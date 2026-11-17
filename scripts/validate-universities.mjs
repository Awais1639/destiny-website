#!/usr/bin/env node
/** Checks src/data/universities-europe.json (Nordic & Baltic directory). Run by `npm run build`. */
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../src/data/universities-europe.json', import.meta.url), 'utf8'));
const errs = [];
const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const okUrl = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
const cs = new Set();
let n = 0;
for (const c of d.countries) {
  if (cs.has(c.slug)) errs.push(`duplicate country ${c.slug}`); cs.add(c.slug);
  if (!iso(c.checked)) errs.push(`${c.slug}: bad checked date`);
  if (!c.sources?.length) errs.push(`${c.slug}: no official sources`);
  for (const s of c.sources ?? []) if (!okUrl(s.url)) errs.push(`${c.slug}: bad source url ${s.url}`);
  const r = c.rules;
  for (const k of ['applicationFee', 'tuition', 'english']) if (!r?.[k]) errs.push(`${c.slug}: rules.${k} missing (write "Set by each university" if the official source gives no single value)`);
  if (!okUrl(r?.portal?.url)) errs.push(`${c.slug}: bad portal url`);
  for (const x of r?.deadlines ?? []) {
    if (!iso(x.date)) errs.push(`${c.slug}: bad deadline date ${x.date}`);
    if (typeof x.apply !== 'boolean') errs.push(`${c.slug}: deadline "${x.label}" needs apply: true/false`);
  }
  if (!r?.deadlines?.length && !r?.deadlineNote) errs.push(`${c.slug}: no deadlines and no deadlineNote`);
  const ss = new Set();
  for (const i of c.institutions) {
    n++;
    const at = `${c.slug}/${i.slug}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(i.slug)) errs.push(`${at}: bad slug`);
    if (ss.has(i.slug)) errs.push(`${at}: duplicate slug`); ss.add(i.slug);
    if (!i.name || !i.category) errs.push(`${at}: name and category are required`);
    if (i.ownership && !['public', 'private'].includes(i.ownership)) errs.push(`${at}: ownership must be public, private or absent`);
    for (const k of ['website', 'programmesUrl']) if (i[k] && !okUrl(i[k])) errs.push(`${at}: ${k} must be an https URL`);
    if (!i.website && !i.programmesUrl) errs.push(`${at}: needs an official website or programme list`);
    if (i.english) {
      const sum = (i.english.bachelor ?? 0) + (i.english.master ?? 0) + (i.english.phd ?? 0);
      if (!Number.isInteger(i.english.total) || i.english.total < 1) errs.push(`${at}: english.total must be a positive integer`);
      if (sum && sum !== i.english.total) errs.push(`${at}: english level counts (${sum}) do not add up to total (${i.english.total})`);
    }
  }
}
if (errs.length) { for (const e of errs) console.error('✖ ' + e); process.exit(1); }
console.log(`✔ University directory OK — ${d.countries.length} countries, ${n} institutions.`);
