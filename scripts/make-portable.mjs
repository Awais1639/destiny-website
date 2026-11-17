#!/usr/bin/env node
/**
 * Creates dist-portable/: a copy of the built site where every page is an independent HTML file
 * with RELATIVE links (about/index.html, ../countries/japan/index.html …) and classic scripts.
 * Result: the whole website can be browsed by double-clicking dist-portable/index.html on any
 * computer, uploaded to any host or sub-folder, or shared as a preview — no server needed.
 *
 * Run after `astro build` (npm run build:portable does both).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'dist');
const OUT = join(ROOT, 'dist-portable');
if (!existsSync(SRC)) { console.error('Run `npm run build` first.'); process.exit(1); }
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(OUT);

// 1) CSS: /_astro/x.woff2 -> ./x.woff2 (css lives in _astro/)
for (const f of files.filter((f) => f.endsWith('.css'))) {
  writeFileSync(f, readFileSync(f, 'utf8').replace(/url\(\/_astro\//g, 'url(./'));
}

// 2) HTML pages
const bundles = new Map();
let pages = 0;
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const rel = relative(OUT, f).split('\\').join('/');
  const depth = rel.split('/').length - 1;
  const up = depth ? '../'.repeat(depth) : './';
  const fix = (p) => {
    // p is a root-relative path without the leading slash
    const m = p.match(/^([^?#]*)(.*)$/);
    let path = m[1];
    const rest = m[2];
    if (path === '' || path.endsWith('/')) path += 'index.html';
    else if (!/\.[a-z0-9]+$/i.test(path)) path += '/index.html';
    return up + path + rest;
  };
  let html = readFileSync(f, 'utf8');

  // module scripts -> one classic IIFE bundle per page (shared modules de-duplicated)
  const srcs = [...html.matchAll(/<script type="module" src="\/([^"]+)"><\/script>/g)].map((m) => m[1]);
  if (srcs.length) {
    const key = createHash('md5').update(srcs.join('|')).digest('hex').slice(0, 10);
    if (!bundles.has(key)) {
      const entry = srcs.map((s) => `import ${JSON.stringify(join(SRC, s))};`).join('\n');
      const res = await build({ stdin: { contents: entry, resolveDir: SRC, loader: 'js' }, bundle: true, format: 'iife', minify: true, write: false, logLevel: 'silent' });
      writeFileSync(join(OUT, '_astro', `p-${key}.js`), res.outputFiles[0].text);
      bundles.set(key, true);
    }
    html = html.replace(/<script type="module" src="\/[^"]+"><\/script>/g, '');
    html = html.replace('</head>', `<script defer src="${up}_astro/p-${key}.js"></script></head>`);
  }
  // inline module scripts -> classic scripts that run after the page is parsed, in their own scope
  html = html.replace(/<script type="module">([\s\S]*?)<\/script>/g, (_, code) =>
    `<script>document.addEventListener('DOMContentLoaded',function(){${code}});</script>`);

  // root-relative attributes
  html = html.replace(/\b(href|src|action|poster)="\/(?!\/)([^"]*)"/g, (_, a, p) => `${a}="${fix(p)}"`);
  // redirect pages (old addresses)
  html = html.replace(/content="0;url=\/([^"]*)"/g, (_, p) => `content="0;url=${fix(p)}"`);
  // root-relative paths inside JSON data attributes (e.g. the hero globe tour)
  html = html.replace(/&quot;\/(scholarships|countries|services|guides|about|contact|programs|universities)([^&]*)&quot;/g, (_, a, b) => `&quot;${fix(a + b)}&quot;`);
  writeFileSync(f, html);
  pages++;
}
console.log(`✔ dist-portable ready — ${pages} independent pages, ${bundles.size} script bundles. Open dist-portable/index.html`);
