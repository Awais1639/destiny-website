#!/usr/bin/env node
/**
 * Downloads each blog post's free stock photo (Unsplash or Pexels, named in the post's `image.url`)
 * into public/blog-img/ in three sizes, so the website serves the photos itself:
 *   <slug>-sm.jpg  640×360  (cards)
 *   <slug>-lg.jpg  1280×720 (top of the post)
 *   <slug>-og.jpg  1200×630 (social sharing preview)
 * Runs in GitHub Actions before the build (the files are cached there and not committed).
 * Already-downloaded files are skipped. A failed download only prints a warning: the post is then shown
 * without a photo, and the next publish tries again.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { parse } from 'yaml';

const dir = new URL('../src/blog/', import.meta.url);
const out = new URL('../public/blog-img/', import.meta.url);
const marks = new URL('../.blog-img-src/', import.meta.url); // which photo each post's files came from (not published)
mkdirSync(out, { recursive: true });
mkdirSync(marks, { recursive: true });
const SIZES = { sm: [640, 360], lg: [1280, 720], og: [1200, 630] };
const HOSTS = /^https:\/\/images\.(unsplash|pexels)\.com\//;

const sized = (url, w, h) => {
  const u = new URL(url);
  u.search = '';
  if (u.hostname === 'images.unsplash.com') { u.searchParams.set('w', w); u.searchParams.set('h', h); u.searchParams.set('fit', 'crop'); u.searchParams.set('crop', 'entropy'); u.searchParams.set('fm', 'jpg'); u.searchParams.set('q', '72'); }
  else { u.searchParams.set('auto', 'compress'); u.searchParams.set('cs', 'tinysrgb'); u.searchParams.set('fit', 'crop'); u.searchParams.set('w', w); u.searchParams.set('h', h); }
  return u.href;
};

let got = 0, kept = 0, failed = 0;
for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.md')) : []) {
  const slug = f.replace(/\.md$/, '');
  const m = readFileSync(new URL(f, dir), 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const url = m ? parse(m[1])?.image?.url : undefined;
  if (!url) continue;
  if (!HOSTS.test(url)) { console.warn(`WARNING ${f}: image.url must be on images.unsplash.com or images.pexels.com — skipped`); failed++; continue; }
  // If the post now names a different photo, download it again.
  const marker = new URL(`${slug}.txt`, marks);
  const changed = !existsSync(marker) || readFileSync(marker, 'utf8') !== url;
  let ok = true;
  for (const [k, [w, h]] of Object.entries(SIZES)) {
    const file = new URL(`${slug}-${k}.jpg`, out);
    if (!changed && existsSync(file) && statSync(file).size > 5000) { kept++; continue; }
    try {
      const res = await fetch(sized(url, w, h), { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'destinyglobals.com blog image fetch' } });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.startsWith('image/')) throw new Error(`HTTP ${res.status} ${type}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error(`file too small (${buf.length} bytes)`);
      writeFileSync(file, buf);
      got++;
    } catch (e) {
      ok = false;
      console.warn(`WARNING ${f}: could not download ${k} image (${e.message}) — the post will show without a photo`);
      failed++;
    }
  }
  if (ok) writeFileSync(marker, url);
}
console.log(`[blog images] downloaded ${got}, already present ${kept}, failed ${failed}`);
