#!/usr/bin/env node
/** Checks src/data/phd.json (funded PhD programmes and official PhD portals). */
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../src/data/phd.json', import.meta.url), 'utf8'));
const countries = new Set([...readFileSync(new URL('../src/data/countries.ts', import.meta.url), 'utf8').matchAll(/slug: '([a-z-]+)'/g)].map((m) => m[1]));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const isUrl = (u) => /^https:\/\/[^\s]+$/.test(u);
const KINDS = ['phd-programme', 'funded-position', 'fellowship', 'doctoral-network'], ENTRY = ['bachelor', 'master'];
const errors = [], warns = [], slugs = new Set(); const today = new Date().toISOString().slice(0, 10);
for (const p of d.programmes) {
  const e = (m) => errors.push(`${p.slug}: ${m}`);
  if (!/^[a-z0-9-]+$/.test(p.slug || '')) e('bad slug'); if (slugs.has(p.slug)) e('duplicate slug'); slugs.add(p.slug);
  for (const k of ['title', 'provider', 'summary', 'location', 'nationalities', 'funding', 'duration']) if (!p[k]) e(`missing ${k}`);
  if (!['eu', 'international', 'research', 'university', 'government', 'foundation'].includes(p.providerType)) e('providerType');
  if (!p.countries?.length || p.countries.some((c) => !countries.has(c))) e('countries must be slugs from countries.ts');
  if (!p.kinds?.length || p.kinds.some((k) => !KINDS.includes(k))) e('kinds');
  if (!p.entry?.length || p.entry.some((k) => !ENTRY.includes(k))) e('entry');
  if (![null, 'varies', 'unconfirmed', 'closed'].includes(p.statusOverride)) e('statusOverride');
  for (const k of ['opens', 'deadline']) if (p.dates[k] != null && !isDate(p.dates[k])) e(`dates.${k}`);
  if (p.statusOverride === null && !p.dates.deadline) e('no deadline: set statusOverride');
  if (p.dates.deadline && p.dates.deadline < today && p.statusOverride === null) warns.push(`${p.slug}: deadline ${p.dates.deadline} has passed — move to the next cycle when announced`);
  if (!isUrl(p.urls.info)) e('urls.info'); if (p.urls.apply != null && !isUrl(p.urls.apply)) e('urls.apply');
  if (!p.urls.sources?.length || p.urls.sources.some((s) => !isUrl(s.url))) e('sources');
  if (!isDate(p.verification.lastChecked)) e('verification.lastChecked');
}
for (const p of d.portals) { if (!isUrl(p.url)) errors.push(`portal ${p.label}: url`); if (!countries.has(p.country)) errors.push(`portal ${p.label}: country`); }
warns.forEach((w) => console.warn('⚠ ' + w));
if (errors.length) { errors.forEach((x) => console.error('✖ ' + x)); process.exit(1); }
console.log(`✔ PhD OK — ${d.programmes.length} programmes, ${d.portals.length} official portals.`);
