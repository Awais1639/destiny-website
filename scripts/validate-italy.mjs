#!/usr/bin/env node
/** Checks src/data/italy-updates.json (details checked by hand on Italian universities' websites). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
let data, upd;
try { data = read('../src/data/italy-programmes.json'); upd = read('../src/data/italy-updates.json'); }
catch (e) { console.error(`✖ Italy data is not valid JSON: ${e.message}`); process.exit(1); }
const unis = new Set(data.universities.map((u) => u.slug));
const progs = new Set(data.programmes.map((p) => `${p.uniSlug}/${p.slug}`));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (d) => ISO.test(d) && new Date(d + 'T00:00:00Z').toISOString().startsWith(d);
const isUrl = (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const errors = [];
function common(where, u, urlKeys) {
  const err = (m) => errors.push(`italy-updates ${where}: ${m}`);
  for (const k of urlKeys) if (u[k] != null && !isUrl(u[k])) err(`${k} must be a full https:// URL or null`);
  if (!isUrl(u.sourceUrl)) err('sourceUrl (the official page you checked) is required');
  if (!isDate(u.verifiedOn || '')) err('verifiedOn must be YYYY-MM-DD'); else if (u.verifiedOn > tomorrow) err('verifiedOn is in the future');
  if (!Array.isArray(u.deadlines)) err('deadlines must be an array (use [] if none)');
  else u.deadlines.forEach((d, i) => { if (!d.label) err(`deadlines[${i}] needs a label`); if (d.date != null && !isDate(d.date)) err(`deadlines[${i}].date must be YYYY-MM-DD`); if (d.date == null && !d.text) err(`deadlines[${i}] needs a date or a text`); });
}
for (const [k, u] of Object.entries(upd.universities || {})) {
  if (!unis.has(k)) { errors.push(`italy-updates universities "${k}": no university with this slug (see /universities/italy/<slug>/)`); continue; }
  common(`universities "${k}"`, u, ['admissionsUrl']);
}
for (const [k, u] of Object.entries(upd.programmes || {})) {
  if (!progs.has(k)) { errors.push(`italy-updates programmes "${k}": no programme with this key (use "university-slug/programme-slug" from the page address)`); continue; }
  common(`programmes "${k}"`, u, ['pageUrl', 'applyUrl']);
}
if (errors.length) { errors.forEach((e) => console.error(`✖ ${e}`)); process.exit(1); }
console.log(`✔ Italy data OK — ${data.count} programmes at ${data.universities.length} universities (${data.academicYear}); checked details for ${Object.keys(upd.universities || {}).length} universities and ${Object.keys(upd.programmes || {}).length} programmes.`);
