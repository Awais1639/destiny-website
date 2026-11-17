#!/usr/bin/env node
/**
 * Prints the list of everything the weekly checking agent must verify, with the official URL(s) to open
 * and the values currently on the website. Output: scripts/data/weekly-checklist.json (+ a summary on screen).
 * Usage: node scripts/weekly-checklist.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
const rd = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const sch = rd('../src/data/scholarships.json');
const reg = rd('../src/data/italy-regional.json');
const em = rd('../src/data/erasmus-updates.json');
const today = new Date().toISOString().slice(0, 10);
const items = [];
for (const s of sch) items.push({
  kind: 'scholarship', file: 'src/data/scholarships.json', id: s.id, slug: s.slug, title: s.title,
  official: [s.urls.info, s.urls.application, ...s.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { cycle: s.dates.cycle, cycleConfirmed: s.dates.cycleConfirmed, opens: s.dates.opens, deadline: s.dates.deadline, deadlineNote: s.dates.deadlineNote, statusOverride: s.statusOverride, lastChecked: s.verification.lastChecked },
});
for (const r of reg.regions) for (const a of r.agencies) items.push({
  kind: 'italy-regional', file: 'src/data/italy-regional.json', region: r.slug, agency: a.short,
  official: [a.url, ...a.links.map((x) => x.url), ...a.sources.map((x) => x.url)],
  current: { deadlines: a.deadlines.map((d) => `${d.date} ${d.label}`), checked: a.checked },
});
for (const [slug, u] of Object.entries(em)) if (slug !== '_readme') items.push({
  kind: 'erasmus-update', file: 'src/data/erasmus-updates.json', slug,
  official: [u.source, u.url, u.applyUrl].filter(Boolean), current: u,
});
writeFileSync(new URL('./data/weekly-checklist.json', import.meta.url), JSON.stringify({ generated: today, count: items.length, items }, null, 1));
const soon = sch.filter((s) => s.dates.deadline && s.dates.deadline >= today).sort((a, b) => a.dates.deadline.localeCompare(b.dates.deadline));
console.log(`${items.length} items to check (${sch.length} scholarships, ${items.filter((i) => i.kind === 'italy-regional').length} Italy regional agencies, ${items.filter((i) => i.kind === 'erasmus-update').length} Erasmus intake updates).`);
console.log('Upcoming deadlines:'); for (const s of soon) console.log(`  ${s.dates.deadline}  ${s.title}`);
console.log('Written to scripts/data/weekly-checklist.json');
