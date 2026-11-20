#!/usr/bin/env node
/**
 * Scholarship data validator — run with `npm run validate` (it also runs automatically before every build).
 * Checks src/data/scholarships.json for missing fields, invalid dates, malformed URLs and inconsistent statuses.
 * Errors stop the build; warnings are printed but allowed.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../src/data/scholarships.json', import.meta.url));
let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`✖ scholarships.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const FUNDING = ['fully-funded', 'partially-funded', 'tuition-only', 'stipend-based', 'varies'];
const DEGREES = ['bachelors', 'masters', 'phd', 'research', 'non-degree'];
const LEVELS = ['official', 'partial', 'needs-verification'];
const OVERRIDES = [null, 'varies', 'unconfirmed', 'closed'];
const COUNTRIES = readFileSync(fileURLToPath(new URL('../src/data/countries.ts', import.meta.url)), 'utf8').match(/slug: '([^']+)'/g).map((m) => m.slice(7, -1));
const today = new Date().toISOString().slice(0, 10);

const isDate = (d) => ISO.test(d) && !Number.isNaN(Date.parse(d + 'T00:00:00Z')) && new Date(d + 'T00:00:00Z').toISOString().startsWith(d);
const isUrl = (u) => { try { const p = new URL(u); return p.protocol === 'https:' || p.protocol === 'http:'; } catch { return false; } };

if (!Array.isArray(data)) { console.error('✖ scholarships.json must be an array'); process.exit(1); }
const ids = new Set();
const slugs = new Set();

data.forEach((s, i) => {
  const at = `#${i + 1} ${s.slug ?? s.id ?? '(no slug)'}`;
  const err = (m) => errors.push(`${at}: ${m}`);
  const warn = (m) => warnings.push(`${at}: ${m}`);

  for (const k of ['id', 'slug', 'title', 'program', 'provider', 'providerType', 'summary', 'eligibleNationalities', 'addedOn']) {
    if (!s[k] || typeof s[k] !== 'string') err(`missing "${k}"`);
  }
  if (s.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) err('slug must be lowercase-with-hyphens');
  if (ids.has(s.id)) err(`duplicate id ${s.id}`); ids.add(s.id);
  if (slugs.has(s.slug)) err(`duplicate slug ${s.slug}`); slugs.add(s.slug);

  if (!Array.isArray(s.countries) || !s.countries.length) err('countries must be a non-empty array');
  else s.countries.forEach((c) => { if (!COUNTRIES.includes(c)) err(`unknown country "${c}" — add it to src/data/countries.ts`); });
  if (!Array.isArray(s.degreeLevels) || !s.degreeLevels.length) err('degreeLevels must be a non-empty array');
  else s.degreeLevels.forEach((d) => { if (!DEGREES.includes(d)) err(`unknown degree level "${d}"`); });
  if (!Array.isArray(s.subjects) || !s.subjects.length) err('subjects must be a non-empty array');
  if (!FUNDING.includes(s.fundingType)) err(`fundingType must be one of ${FUNDING.join(', ')}`);
  if (s.addedOn && !isDate(s.addedOn)) err(`addedOn "${s.addedOn}" is not a valid YYYY-MM-DD date`);

  // coverage
  if (!s.coverage || typeof s.coverage !== 'object') err('missing coverage object');
  else if (s.fundingType === 'fully-funded' && !s.coverage.tuition && !s.coverage.stipend) warn('marked fully-funded but tuition and stipend coverage are both empty');

  // dates & status
  const d = s.dates;
  if (!d) err('missing dates');
  else {
    if (typeof d.cycleConfirmed !== 'boolean') err('dates.cycleConfirmed must be true or false');
    for (const k of ['opens', 'deadline']) if (d[k] !== null && d[k] !== undefined && !isDate(d[k])) err(`dates.${k} "${d[k]}" is not a valid YYYY-MM-DD date`);
    if (d.opens && d.deadline && d.opens > d.deadline) err('dates.opens is after dates.deadline');
    if (d.cycleConfirmed && !d.deadline && s.statusOverride !== 'varies') warn('cycle confirmed but no deadline — status will show "Cycle not yet confirmed". Use statusOverride "varies" if deadlines differ per programme.');
    if (!d.cycleConfirmed && d.deadline) warn('deadline set but cycleConfirmed is false — the deadline will be shown but status stays "not yet confirmed"');
    if (d.deadline && d.deadline < today && d.cycleConfirmed) warnings.push(`${at}: deadline ${d.deadline} has passed — listing shows "Closed". Update to the next cycle when it is announced.`);
  }
  if (!OVERRIDES.includes(s.statusOverride ?? null)) err(`statusOverride must be null, "varies", "unconfirmed" or "closed"`);

  // urls
  if (!s.urls || !isUrl(s.urls.info)) err('urls.info must be a valid official URL');
  if (s.urls?.application !== null && s.urls?.application !== undefined && !isUrl(s.urls.application)) err('urls.application must be a valid URL or null');
  if (!Array.isArray(s.urls?.sources) || !s.urls.sources.length) err('urls.sources needs at least one source reference');
  else s.urls.sources.forEach((src, j) => { if (!src.label || !isUrl(src.url)) err(`urls.sources[${j}] needs a label and a valid url`); });
  for (const u of [s.urls?.info, s.urls?.application, ...(s.urls?.sources ?? []).map((x) => x.url)]) if (u && u.startsWith('http://')) warn(`uses http:// (prefer https://): ${u}`);

  // verification
  if (!s.verification) err('missing verification');
  else {
    if (!LEVELS.includes(s.verification.level)) err(`verification.level must be one of ${LEVELS.join(', ')}`);
    if (!isDate(s.verification.lastChecked)) err('verification.lastChecked must be a valid YYYY-MM-DD date');
    else {
      // allow one day of tolerance for time-zone differences between you and the build server
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      if (s.verification.lastChecked > tomorrow) err('verification.lastChecked is in the future');
      const age = (Date.parse(today) - Date.parse(s.verification.lastChecked)) / 86400000;
      if (age > 120) warn(`last checked ${Math.round(age)} days ago — time to re-verify`);
    }
  }
  for (const k of ['eligibility', 'procedure', 'warnings']) if (!Array.isArray(s[k])) err(`${k} must be an array`);
});

{
  const el = JSON.parse(readFileSync(new URL('../src/data/eligibility.json', import.meta.url), 'utf8')).rules ?? {};
  const PK = new Set(['yes', 'only', 'no', 'list']);
  for (const s of data) { if (!el[s.slug]) errors.push(`${s.slug}: missing rule in src/data/eligibility.json`); else if (!PK.has(el[s.slug].pk)) errors.push(`${s.slug}: eligibility.json pk must be yes|only|no|list`); }
  for (const k of Object.keys(el)) if (!data.some((s) => s.slug === k)) warnings.push(`eligibility.json has a rule for unknown slug ${k}`);
}
warnings.forEach((w) => console.warn(`⚠ ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`✖ ${e}`));
  console.error(`\n${errors.length} error(s) in scholarships.json — fix them before building.`);
  process.exit(1);
}
console.log(`✔ scholarships.json OK — ${data.length} records, ${warnings.length} warning(s).`);
