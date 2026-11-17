#!/usr/bin/env node
/** Checks src/data/italy-regional.json: dates, URLs, university slugs and sources. Run by `npm run build`. */
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../src/data/italy-regional.json', import.meta.url), 'utf8'));
const it = JSON.parse(readFileSync(new URL('../src/data/italy-programmes.json', import.meta.url), 'utf8'));
const uniSlugs = new Set(it.universities.map((u) => u.slug));
const errs = [], warns = [];
const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const okUrl = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
const slugs = new Set(), seenUni = new Map();
for (const r of d.regions) {
  if (slugs.has(r.slug)) errs.push(`duplicate region slug ${r.slug}`); slugs.add(r.slug);
  if (!r.agencies?.length) errs.push(`${r.slug}: no agencies`);
  for (const a of r.agencies) {
    const at = `${r.slug} / ${a.short}`;
    if (!okUrl(a.url)) errs.push(`${at}: bad url ${a.url}`);
    for (const l of [...a.links, ...a.sources]) if (!okUrl(l.url)) errs.push(`${at}: bad link ${l.url}`);
    for (const x of a.deadlines) { if (!iso(x.date)) errs.push(`${at}: bad date ${x.date}`); if (typeof x.apply !== 'boolean') errs.push(`${at}: deadline "${x.label}" needs apply: true/false`); }
    if (a.checked && !iso(a.checked)) errs.push(`${at}: bad checked date`);
    if (a.checked && !a.sources.length) errs.push(`${at}: checked but no official source`);
    if (!a.checked && !a.note) warns.push(`${at}: unverified agency without a note`);
    for (const u of a.unis) {
      if (!uniSlugs.has(u)) errs.push(`${at}: unknown university slug ${u}`);
      if (seenUni.has(u)) errs.push(`${at}: university ${u} also mapped to ${seenUni.get(u)}`); seenUni.set(u, at);
    }
  }
}
const unmapped = [...uniSlugs].filter((u) => !seenUni.has(u));
if (unmapped.length) warns.push(`universities without a regional agency: ${unmapped.join(', ')}`);
for (const w of warns) console.log('  ⚠ ' + w);
if (errs.length) { for (const e of errs) console.error('✖ ' + e); process.exit(1); }
const ag = d.regions.flatMap((r) => r.agencies);
console.log(`✔ Italy regional grants OK — ${d.regions.length} regions, ${ag.length} agencies (${ag.filter((a) => a.checked).length} checked).`);
