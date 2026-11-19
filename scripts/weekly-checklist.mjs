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
const eu = rd('../src/data/universities-europe.json');
const itp = rd('../src/data/italy-programmes.json');
const itu = rd('../src/data/italy-updates.json');
const progs = rd('../src/data/programmes-europe.json').programmes;
const ovr = rd('./data/programme-overrides.json');
const intern = rd('../src/data/internships.json');
const phd = rd('../src/data/phd.json');
const postdoc = rd('../src/data/postdoc.json');
const fellows = rd('../src/data/fellowships.json');
const confs = rd('../src/data/conferences.json');
// How many programmes / directory institutions to re-check each week (oldest first / rotating), so that
// everything is covered over time without one run trying to open thousands of pages.
const PROG_PER_WEEK = Number(process.env.PROG_PER_WEEK || 60);
const INST_PER_WEEK = Number(process.env.INST_PER_WEEK || 60);
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
// Internship, traineeship and thesis programmes + official portals.
for (const p of intern.programmes) items.push({
  kind: 'internship', file: 'src/data/internships.json', slug: p.slug, title: p.title,
  official: [p.urls.info, p.urls.apply, ...p.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { opens: p.dates.opens, deadline: p.dates.deadline, deadlineNote: p.dates.deadlineNote, statusOverride: p.statusOverride, stipend: p.stipend, lastChecked: p.verification.lastChecked },
});
for (const p of intern.portals) items.push({ kind: 'internship-portal', file: 'src/data/internships.json', title: p.label, official: [p.url], current: 'check the link still works' });
// Funded PhD programmes + official PhD portals.
for (const p of phd.programmes) items.push({
  kind: 'phd', file: 'src/data/phd.json', slug: p.slug, title: p.title,
  official: [p.urls.info, p.urls.apply, ...p.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { opens: p.dates.opens, deadline: p.dates.deadline, deadlineNote: p.dates.deadlineNote, statusOverride: p.statusOverride, funding: p.funding, lastChecked: p.verification.lastChecked },
});
for (const p of phd.portals) items.push({ kind: 'phd-portal', file: 'src/data/phd.json', title: p.label, official: [p.url], current: 'check the link still works' });
for (const p of postdoc.programmes) items.push({
  kind: 'postdoc', file: 'src/data/postdoc.json', slug: p.slug, title: p.title,
  official: [p.urls.info, p.urls.apply, ...p.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { opens: p.dates.opens, deadline: p.dates.deadline, deadlineNote: p.dates.deadlineNote, statusOverride: p.statusOverride, funding: p.funding, lastChecked: p.verification.lastChecked },
});
for (const p of postdoc.portals) items.push({ kind: 'postdoc-portal', file: 'src/data/postdoc.json', title: p.label, official: [p.url], current: 'check the link still works' });
for (const p of confs.programmes) items.push({
  kind: 'conference', file: 'src/data/conferences.json', slug: p.slug, title: p.title,
  official: [p.urls.info, p.urls.apply, ...p.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { event: p.event, opens: p.dates.opens, deadline: p.dates.deadline, deadlineNote: p.dates.deadlineNote, statusOverride: p.statusOverride, funding: p.funding, lastChecked: p.verification.lastChecked },
});
for (const p of fellows.programmes) items.push({
  kind: 'fellowship', file: 'src/data/fellowships.json', slug: p.slug, title: p.title,
  official: [p.urls.info, p.urls.apply, ...p.urls.sources.map((x) => x.url)].filter(Boolean),
  current: { opens: p.dates.opens, deadline: p.dates.deadline, deadlineNote: p.dates.deadlineNote, statusOverride: p.statusOverride, funding: p.funding, lastChecked: p.verification.lastChecked },
});
// Europe university directory: country-wide admission rules (deadlines, fees, English, scholarships).
for (const c of eu.countries) items.push({
  kind: 'europe-country-rules', file: 'src/data/universities-europe.json', country: c.slug,
  official: [c.rules.portal.url, ...(c.rules.platforms || []).map((x) => x.url), ...c.sources.map((x) => x.url)],
  current: { deadlines: c.rules.deadlines.map((d) => `${d.date} ${d.label}`), deadlineNote: c.rules.deadlineNote, applicationFee: c.rules.applicationFee, tuition: c.rules.tuition, english: c.rules.english, checked: c.checked },
});
// Italian universities: university-wide admission rules checked on each university's own site.
for (const u of itp.universities) {
  const r = itu.universities[u.slug];
  items.push({
    kind: r ? 'italy-university' : 'italy-university-missing', file: 'src/data/italy-updates.json', slug: u.slug, name: u.name,
    official: r ? [r.admissionsUrl, r.sourceUrl].filter(Boolean) : [u.website || u.url].filter(Boolean),
    current: r ? { deadlines: r.deadlines.map((d) => `${d.date || d.text} ${d.label}`), applicationFee: r.applicationFee, tuition: r.tuition, english: r.englishRequirement, verifiedOn: r.verifiedOn } : 'no details yet — try to find the official international admissions page',
  });
}
// Programmes from official national databases: the PROG_PER_WEEK least recently checked.
const pChecked = (p) => (ovr[p.id] && ovr[p.id]._checked) || p.checked || '0000';
for (const p of [...progs].sort((a, b) => pChecked(a).localeCompare(pChecked(b)) || a.id.localeCompare(b.id)).slice(0, PROG_PER_WEEK)) items.push({
  kind: 'programme', file: 'scripts/data/programme-overrides.json (then python3 scripts/data/build-programmes.py)', id: p.id, country: p.c, university: p.uni, name: p.name,
  official: [p.url, p.apply, p.requirementsUrl, p.source].filter(Boolean),
  current: { deadlines: p.deadlines || null, english: p.english || null, tuition: p.tuition || null, intake: p.intake || null, checked: pChecked(p) },
});
// Directory institutions (1,000+): a rotating slice each week — check that the official links still work.
const insts = eu.countries.flatMap((c) => c.institutions.map((i) => ({ c: c.slug, ...i })));
const week = Math.floor(Date.now() / (7 * 86400000));
const start = (week * INST_PER_WEEK) % Math.max(insts.length, 1);
for (const i of [...insts, ...insts].slice(start, start + Math.min(INST_PER_WEEK, insts.length))) items.push({
  kind: 'institution-links', file: 'src/data/universities-europe.json', country: i.c, slug: i.slug, name: i.name,
  official: [i.website, i.programmesUrl, i.profileUrl].filter(Boolean), current: { english: i.english || null, tuition: i.tuition || null },
});
writeFileSync(new URL('./data/weekly-checklist.json', import.meta.url), JSON.stringify({ generated: today, count: items.length, items }, null, 1));
const soon = sch.filter((s) => s.dates.deadline && s.dates.deadline >= today).sort((a, b) => a.dates.deadline.localeCompare(b.dates.deadline));
const n = (k) => items.filter((i) => i.kind === k).length;
console.log(`${items.length} items to check: ${sch.length} scholarships, ${n('italy-regional')} Italy regional agencies, ${n('erasmus-update')} Erasmus intake updates, ${n('europe-country-rules')} country admission rules, ${n('internship')} internship/thesis programmes (+${n('internship-portal')} portals), ${n('phd')} PhD programmes (+${n('phd-portal')} portals), ${n('postdoc')} postdoc fellowships (+${n('postdoc-portal')} portals), ${n('fellowship')} other fellowships, ${n('conference')} conferences/summits, ${n('italy-university')} Italian universities (+${n('italy-university-missing')} without details yet), ${n('programme')} programmes (least recently checked of ${progs.length}), ${n('institution-links')} directory institutions (rotating slice of ${insts.length}).`);
console.log('Upcoming deadlines:'); for (const s of soon) console.log(`  ${s.dates.deadline}  ${s.title}`);
console.log('Written to scripts/data/weekly-checklist.json');
