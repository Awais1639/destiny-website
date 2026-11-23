#!/usr/bin/env node
/**
 * Checks every blog post in src/blog/*.md before the site is built.
 * The build stops if any ERROR is found; WARNINGS are printed but do not stop it.
 *   node scripts/validate-blog.mjs            all posts
 *   node scripts/validate-blog.mjs <slug>     one post (also prints an SEO summary)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const dir = new URL('../src/blog/', import.meta.url);
const CATS = ['scholarships', 'bachelors-masters', 'phd-postdoc', 'conferences', 'visas-country-rules', 'announcements', 'guides'];
const only = process.argv[2];
const todayRome = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));
const errors = [], warns = [];
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
const seenTitles = new Map();
const seenImages = new Map();

for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  if (only && slug !== only) continue;
  const E = (m) => errors.push(`${f}: ${m}`), W = (m) => warns.push(`${f}: ${m}`);
  const raw = readFileSync(new URL(f, dir), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { E('missing front matter (--- ... ---) at the top'); continue; }
  let fm;
  try { fm = parse(m[1], { schema: 'failsafe' }) ?? {}; } catch (e) { E(`front matter is not valid YAML: ${e.message}`); continue; }
  const body = m[2];
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`|]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) E('file name must be lowercase-words-with-hyphens.md');
  if (slug.length > 80) W('file name (URL) is long; keep it under ~60 characters');

  for (const k of ['title', 'description', 'date', 'category']) if (typeof fm[k] !== 'string' || !fm[k].trim()) E(`"${k}" is required`);
  const title = String(fm.title ?? ''), desc = String(fm.description ?? '').replace(/\s+/g, ' ').trim();
  const seo = String(fm.seoTitle ?? title);
  if (seo.length > 65) E(`title (or seoTitle) is ${seo.length} characters; Google shows ~60 — add a shorter "seoTitle"`);
  if (title.length < 25) W('title is very short');
  if (desc.length < 110 || desc.length > 160) E(`description is ${desc.length} characters; it must be 110–160`);
  if (seenTitles.has(title.toLowerCase())) E(`same title as ${seenTitles.get(title.toLowerCase())}`); else seenTitles.set(title.toLowerCase(), f);

  if (!isDate(String(fm.date ?? ''))) E('"date" must be YYYY-MM-DD');
  else if (fm.date > todayRome) E(`"date" ${fm.date} is in the future (today in Italy is ${todayRome})`);
  if (fm.updated !== undefined && (!isDate(String(fm.updated)) || fm.updated < fm.date || fm.updated > todayRome)) E('"updated" must be YYYY-MM-DD, not before "date" and not in the future');
  if (!CATS.includes(fm.category)) E(`"category" must be one of: ${CATS.join(', ')}`);
  if (fm.status !== undefined && !['verified', 'unconfirmed'].includes(fm.status)) E('"status" must be verified or unconfirmed');
  if (fm.draft !== undefined && !['true', 'false'].includes(String(fm.draft))) E('"draft" must be true or false');

  const kw = Array.isArray(fm.keywords) ? fm.keywords.map(String) : [];
  if (kw.length < 3 || kw.length > 12) E('"keywords" needs 3–12 phrases (the first is the focus keyword)');
  const focus = (kw[0] ?? '').toLowerCase();
  if (focus) {
    const low = text.toLowerCase();
    if (!low.includes(focus)) E(`focus keyword "${kw[0]}" does not appear in the post body`);
    if (!desc.toLowerCase().includes(focus) && !seo.toLowerCase().includes(focus)) W(`focus keyword "${kw[0]}" is in neither the title nor the description`);
    if (!body.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 3).join(' ').toLowerCase().includes(focus)) W(`focus keyword "${kw[0]}" is not in the first paragraph`);
  }

  const tags = Array.isArray(fm.hashtags) ? fm.hashtags.map(String) : [];
  if (tags.length < 4 || tags.length > 10) E('"hashtags" needs 4–10 tags');
  for (const t of tags) if (!/^#[A-Za-z][A-Za-z0-9]{1,40}$/.test(t)) E(`hashtag "${t}" must look like #CamelCaseWords (letters and digits only)`);
  if (new Set(tags.map((t) => t.toLowerCase())).size !== tags.length) E('duplicate hashtags');

  const src = Array.isArray(fm.sources) ? fm.sources : [];
  if (src.length < 1) E('"sources" needs at least one official source');
  for (const s of src) {
    if (!s || typeof s.label !== 'string' || typeof s.url !== 'string') { E('each source needs "label" and "url"'); continue; }
    if (!/^https:\/\/[^\s]+$/.test(s.url)) E(`source URL must start with https:// — ${s.url}`);
  }
  for (const r of Array.isArray(fm.related) ? fm.related : []) {
    if (!r?.label || !/^\/[a-z0-9\-/]*\/$/.test(String(r?.href ?? ''))) { E(`each related item needs "label" and "href" (a site path like /scholarships/x/) — ${JSON.stringify(r)}`); continue; }
    if (!existsSync(new URL(`../src/pages${r.href}`, import.meta.url)) && !existsSync(new URL('../dist' + r.href + 'index.html', import.meta.url))) W(`related page ${r.href} was not found in src/pages or the last build — check the path`);
  }
  const im = fm.image;
  if (!im || typeof im !== 'object') E('"image" is required: a free Unsplash or Pexels photo with url, alt, credit and creditUrl');
  else {
    if (!/^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(\?.*)?$/.test(im.url ?? '') && !/^https:\/\/images\.pexels\.com\/photos\/\d+\/[^\s]+\.(jpe?g|png)(\?.*)?$/i.test(im.url ?? '')) E(`image.url must be the photo file on images.unsplash.com (…/photo-…) or images.pexels.com (…/photos/<id>/…jpeg) — ${im.url}`);
    const alt = String(im.alt ?? '');
    if (alt.length < 15 || alt.length > 160) E(`image.alt must describe the photo in 15–160 characters (it is ${alt.length})`);
    if (/^(image|photo|picture) of/i.test(alt)) W('image.alt: describe the scene directly; do not start with "image of"');
    if (!String(im.credit ?? '').trim()) E('image.credit (the photographer\'s name) is required');
    if (!/^https:\/\/(www\.)?(unsplash|pexels)\.com\/[^\s]+$/.test(im.creditUrl ?? '')) E(`image.creditUrl must be the photo's page on unsplash.com or pexels.com — ${im.creditUrl}`);
    const key = String(im.url ?? '').split('?')[0];
    if (seenImages.has(key)) W(`same photo as ${seenImages.get(key)} — pick a different one`); else seenImages.set(key, f);
  }
  const faq = Array.isArray(fm.faq) ? fm.faq : [];
  for (const q of faq) if (!q?.q || !q?.a) E('each faq item needs "q" and "a"');

  // Body
  if (/^#\s/m.test(body)) E('do not use a "# " heading in the body — the title is already the H1; start sections with "## "');
  const h2 = (body.match(/^##\s/gm) ?? []).length;
  if (h2 < 3) E(`only ${h2} "## " sections; use at least 3 for a readable, well-structured post`);
  if (words < 600) E(`body has ${words} words; write at least 600 (aim for 900–1,500)`);
  else if (words < 800) W(`body has ${words} words; 900–1,500 ranks better`);
  const internal = (body.match(/\]\(\/[a-z0-9][^)]*\)/g) ?? []).length;
  if (internal < 2) E(`only ${internal} internal links; link at least 2 relevant pages on this site, e.g. [Scholarships for Pakistani students](/scholarships/pakistan/)`);
  for (const l of body.match(/\]\(([^)]+)\)/g) ?? []) {
    const u = l.slice(2, -1);
    if (u.startsWith('http://')) E(`use https links — ${u}`);
    if (u.startsWith('/') && !/^\/[^\s]*\/(#[a-z0-9-]+)?$/.test(u) && !/\.(xml|txt|pdf)$/.test(u)) W(`internal link should end with "/" — ${u}`);
  }
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (/guarantee/i.test(sentence) && !/\b(no|not|never|cannot|can’t|can't|nobody|without|don’t|don't|doesn’t|doesn't)\b/i.test(sentence)) E(`sounds like a promise of an outcome: "${sentence.trim().slice(0, 90)}…"`);
  }
  if (/\b(TBD|TODO|lorem ipsum|\[insert)/i.test(body)) E('placeholder text left in the post');

  if (only) {
    console.log(`\n${slug}\n  URL: /blog/${slug}/\n  SEO title (${seo.length}): ${seo}\n  Description (${desc.length}): ${desc}\n  Focus keyword: ${kw[0]}\n  Words: ${words} · sections: ${h2} · internal links: ${internal} · sources: ${src.length} · hashtags: ${tags.join(' ')}`);
  }
}

for (const w of warns) console.warn(`WARNING ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\nBlog check failed: ${errors.length} error(s). Fix them, then build again.`);
  process.exit(1);
}
console.log(`Blog check passed: ${only ? 1 : files.length} post(s), ${warns.length} warning(s).`);
