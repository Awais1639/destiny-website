#!/usr/bin/env node
/** Checks src/data/erasmus-updates.json (owner-verified Erasmus Mundus intake details). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
let cat, upd;
try { cat = read('../src/data/erasmus-mundus.json'); upd = read('../src/data/erasmus-updates.json'); }
catch (e) { console.error(`✖ Erasmus data is not valid JSON: ${e.message}`); process.exit(1); }
const slugs = new Set(cat.programmes.map((p) => p.slug));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (d) => ISO.test(d) && new Date(d + 'T00:00:00Z').toISOString().startsWith(d);
const isUrl = (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
const errors = [], warnings = [];
for (const [slug, u] of Object.entries(upd)) {
  if (slug.startsWith('_')) continue;
  const err = (m) => errors.push(`erasmus-updates "${slug}": ${m}`);
  if (!slugs.has(slug)) { err('no programme with this slug in erasmus-mundus.json (see the URL /erasmus-mundus/<slug>/)'); continue; }
  for (const k of ['opens', 'deadline']) if (u[k] != null && !isDate(u[k])) err(`${k} must be YYYY-MM-DD or null`);
  if (u.opens && u.deadline && u.opens > u.deadline) err('opens is after deadline');
  if (!Array.isArray(u.otherDeadlines)) err('otherDeadlines must be an array (use [] if none)');
  else u.otherDeadlines.forEach((o, i) => { if (!o.label || !isDate(o.date)) err(`otherDeadlines[${i}] needs a label and a YYYY-MM-DD date`); });
  if (!['available', 'none', 'unknown'].includes(u.scholarships)) err('scholarships must be "available", "none" or "unknown"');
  if (u.applyUrl != null && !isUrl(u.applyUrl)) err('applyUrl must be a full https:// URL or null');
  if (!isUrl(u.sourceUrl)) err('sourceUrl (the official page you checked) is required');
  if (!isDate(u.verifiedOn || '')) err('verifiedOn must be YYYY-MM-DD');
  else if (u.verifiedOn > tomorrow) err('verifiedOn is in the future');
  if (u.deadline && u.deadline < today) warnings.push(`erasmus-updates "${slug}": deadline has passed — check the programme website for the next intake`);
}
warnings.forEach((w) => console.warn(`⚠ ${w}`));
if (errors.length) { errors.forEach((e) => console.error(`✖ ${e}`)); process.exit(1); }
console.log(`✔ Erasmus Mundus data OK — ${cat.count} catalogue programmes, ${Object.keys(upd).filter((k) => !k.startsWith('_')).length} verified intake update(s).`);
