/**
 * Course finder: one search index over everything on the site, built at build time from the existing data files
 * (no new data). Common keys for level, subject and destination let one set of filters work across courses,
 * scholarships, regional grants, universities and countries. Also works out which funding applies to each course.
 */
import { scholarships } from './data';
import { getStatus, type Scholarship } from './scholarships';
import { itProgs, itUnis, itUniByCode, progUrl, uniUrl, levelShort, isEnglishOnly, type ItProg } from './italy';
import { emProgrammes, emUpdates, emStatus } from './erasmus';
import { regions, agencyByUni, regionUrl, agencyId, lastDeadline, euro, dsu } from './italy-regional';
import { countries } from '../data/countries';
import { fundingLabels } from '../data/taxonomy';
import { dirCountries, dirInstUrl, ownershipLabel, progLevelLabels, dirProgs, dirBySlug, progAnchor, progLevelShort } from './universities-europe';

/* ---------- shared vocabulary ---------- */
export const fLevels = {
  bachelor: "Bachelor's",
  master: "Master's",
  'single-cycle': 'Single-cycle (5–6 years)',
  phd: 'PhD',
  other: 'Research & short courses',
} as const;
export type FLevel = keyof typeof fLevels;

export const fSubjects = {
  computing: 'Computing, Data & AI',
  engineering: 'Engineering & Architecture',
  sciences: 'Natural Sciences & Maths',
  health: 'Medicine & Health',
  business: 'Business & Economics',
  social: 'Social Sciences, Law & Politics',
  psychology: 'Psychology & Education',
  humanities: 'Arts, Humanities & Languages',
  environment: 'Agriculture, Food & Environment',
  other: 'Interdisciplinary',
} as const;
export type FSubject = keyof typeof fSubjects;

export const fTypes = {
  course: 'Courses',
  funding: 'Scholarships & grants',
  university: 'Universities',
  country: 'Destinations',
} as const;
export type FType = keyof typeof fTypes;

const itTopic: Record<string, FSubject> = {
  engineering: 'engineering', computing: 'computing', architecture: 'engineering', sciences: 'sciences', economics: 'business',
  social: 'social', law: 'social', psychology: 'psychology', health: 'health', agriculture: 'environment', sport: 'health',
  'art-design': 'humanities', languages: 'humanities', humanities: 'humanities', education: 'psychology',
};
const emTopic: Record<string, FSubject> = {
  computing: 'computing', engineering: 'engineering', 'energy-environment': 'environment', 'natural-sciences': 'sciences',
  health: 'health', 'agri-food': 'environment', social: 'social', 'humanities-arts': 'humanities', business: 'business', other: 'other',
};
const schSubject: Record<string, FSubject[]> = {
  engineering: ['engineering', 'computing'], sciences: ['sciences'], 'economics-business': ['business'], 'law-politics': ['social'],
  'social-sciences': ['social', 'psychology'], 'health-medicine': ['health'], 'environment-agriculture': ['environment'], humanities: ['humanities'],
};
const schLevel: Record<string, FLevel[]> = { bachelors: ['bachelor', 'single-cycle'], masters: ['master'], phd: ['phd'], research: ['other'], 'non-degree': ['other'] };
const itLevel: Record<string, FLevel> = { bachelor: 'bachelor', master: 'master', 'single-cycle': 'single-cycle', other: 'other' };

/* ---------- funding that applies to a course ---------- */
export interface FundingRef { kind: 'scholarship' | 'grant' | 'erasmus'; title: string; href: string; note: string; status: string; deadline: string | null; payload?: string }

const statusPayload = (s: Scholarship) => JSON.stringify({ dates: s.dates, statusOverride: s.statusOverride });
const schFund = (s: Scholarship, note: string): FundingRef => ({
  kind: 'scholarship', title: s.program, href: `/scholarships/${s.slug}/`, note, status: getStatus(s), deadline: s.dates.deadline, payload: statusPayload(s),
});
const allSubjects = (s: Scholarship) => s.subjects.includes('any') ? null : new Set(s.subjects.flatMap((x) => schSubject[x] ?? []));

/** Scholarships open to study in `country` at `level` in `subject` (null subject = don't filter). */
function scholarshipsFor(country: string, level: FLevel, subject: FSubject | null) {
  return scholarships.filter((s) => {
    if (!s.countries.includes(country)) return false;
    if (!s.degreeLevels.some((d) => (schLevel[d] ?? []).includes(level))) return false;
    const subj = allSubjects(s);
    return !subj || !subject || subj.has(subject);
  });
}

export function fundingForItalianProgramme(p: ItProg): FundingRef[] {
  const level = itLevel[p.level] ?? 'other';
  const out: FundingRef[] = scholarshipsFor('italy', level, itTopic[p.topic] ?? null).map((s) => schFund(s, 'Italian government scholarship for international students'));
  const hit = agencyByUni[p.uniSlug];
  if (hit) {
    const last = lastDeadline(hit.agency);
    out.push({
      kind: 'grant', title: `${hit.region.name} regional grant (${hit.agency.short})`, href: regionUrl(hit.region) + '#' + agencyId(hit.agency),
      note: `Need-based — up to ${euro(dsu.national.amounts.offsite)} a year for off-site students, plus fee exemption`,
      status: hit.agency.checked ? 'dated' : 'unconfirmed', deadline: last,
      payload: last ? JSON.stringify({ dates: { cycleConfirmed: true, opens: null, deadline: last }, statusOverride: null }) : undefined,
    });
  }
  return out;
}

const emRecord = scholarships.find((s) => s.slug === 'erasmus-mundus-joint-masters');
export function fundingForErasmus(slug: string): FundingRef[] {
  const u = emUpdates[slug];
  const out: FundingRef[] = [{
    kind: 'erasmus', title: 'Erasmus Mundus scholarship', href: `/scholarships/erasmus-mundus/${slug}/`,
    note: u?.scholarships === 'none' ? 'This intake has no Erasmus Mundus scholarships' : 'Full scholarships offered by the consortium itself — apply with your programme application',
    status: emStatus(u), deadline: u?.deadline ?? null,
  }];
  if (emRecord) out.push(schFund(emRecord, 'How Erasmus Mundus scholarships work'));
  return out;
}

/* ---------- the index ---------- */
export interface FItem {
  id: string;
  t: FType;            // type
  k: string;           // kind label shown on the card
  n: string;           // name
  s: string;           // subtitle
  u: string;           // url (site-relative)
  l: FLevel[];         // levels
  j: FSubject[];       // subjects ([] = all subjects)
  c: string[];         // destination slugs
  g?: string;          // place (city / region)
  en?: 1 | 2;          // 1 = taught only in English, 2 = partly in English
  fu?: string;         // funding type key (scholarships)
  st?: string;         // status payload (JSON for the shared status logic) or EM status key
  em?: 1;              // st is an Erasmus status key
  fn?: string[];       // funding titles (courses)
  fo?: string[];       // funding payloads (courses) used for "funding open now"
  x?: string;          // extra search words
  ie?: string;         // English requirement (short, from the official record)
  tf?: string;         // tuition (short, from the official record)
  w: number;           // base weight for ordering
}

const countryName = Object.fromEntries(countries.map((c) => [c.slug, c.name]));
/** English search words for local names (so "TU Munich" or "Cologne" find German institutions). */
const ALIAS: [RegExp, string][] = [
  [/München/, 'Munich'], [/Köln/, 'Cologne'], [/Nürnberg/, 'Nuremberg'], [/Hannover/, 'Hanover'], [/Frankfurt/, 'Frankfurt'], [/Braunschweig/, 'Brunswick'],
  [/\bTU\b|Technische Universität/, 'Technical University technology'], [/Universität|Université|Universidad|Universidade|Universitat|Universiteit|Univerzita/, 'University'],
  [/Hochschule|Fachhochschule|HAW/, 'University of Applied Sciences'], [/Wien/, 'Vienna'], [/Praha|Prague/, 'Prague'], [/Lisboa/, 'Lisbon'], [/Sevilla/, 'Seville'],
];
const aliases = (s: string) => ALIAS.filter(([re]) => re.test(s)).map(([, a]) => a).join(' ');

export function buildIndex(): FItem[] {
  const items: FItem[] = [];
  // Courses — Italy
  for (const p of itProgs) {
    const u = itUniByCode[p.uni];
    const fund = fundingForItalianProgramme(p);
    items.push({
      id: `it:${p.uniSlug}/${p.slug}`, t: 'course', k: `${levelShort[p.level]} · Italy`, n: p.name,
      s: `${u?.short ?? p.uni}${p.city ? ` · ${p.city}` : ''}`, u: progUrl(p), l: [itLevel[p.level] ?? 'other'],
      j: [itTopic[p.topic] ?? 'other'], c: ['italy'], g: u?.region || undefined, en: isEnglishOnly(p) ? 1 : 2,
      fn: fund.map((f) => f.kind === 'grant' ? 'Regional grant' : f.title), fo: fund.map((f) => f.payload ?? '').filter(Boolean),
      x: `${u?.name ?? ''} ${p.className ?? ''} ${p.classCode ?? ''}`, w: 2,
    });
  }
  // Courses — Erasmus Mundus
  for (const p of emProgrammes) {
    const u = emUpdates[p.slug];
    items.push({
      id: `em:${p.slug}`, t: 'course', k: p.type === 'emjm' ? "Master's · Erasmus Mundus" : 'Erasmus Mundus scheme', n: p.name,
      s: `${p.acronym} · studied in 2+ European countries`, u: `/scholarships/erasmus-mundus/${p.slug}/`, l: ['master'],
      j: p.topics.map((t) => emTopic[t] ?? 'other'), c: ['europe'], en: 1, st: emStatus(u), em: 1,
      fn: ['Erasmus Mundus scholarship'], x: `${p.acronym} erasmus mundus joint master emjm scholarship europe`, w: 3,
    });
  }
  // Scholarships
  for (const s of scholarships) {
    items.push({
      id: `sch:${s.slug}`, t: 'funding', k: 'Scholarship', n: s.title, s: s.provider, u: `/scholarships/${s.slug}/`,
      l: [...new Set(s.degreeLevels.flatMap((d) => schLevel[d] ?? []))], j: allSubjects(s) ? [...allSubjects(s)!] : [],
      c: s.countries, fu: s.fundingType, st: statusPayload(s),
      x: `${s.program} ${s.countries.map((c) => countryName[c] ?? c).join(' ')} ${fundingLabels[s.fundingType]} scholarship ${s.summary}`, w: 5,
    });
  }
  // Regional grants (Italy)
  for (const r of regions) {
    const last = r.agencies.map(lastDeadline).filter(Boolean).sort().at(-1) as string | undefined;
    items.push({
      id: `dsu:${r.slug}`, t: 'funding', k: 'Regional grant · Italy', n: `Regional scholarships in ${r.name}`,
      s: r.agencies.map((a) => a.short).join(' · '), u: regionUrl(r), l: ['bachelor', 'single-cycle', 'master', 'phd'], j: [],
      c: ['italy'], g: r.name, fu: 'varies',
      st: last ? JSON.stringify({ dates: { cycleConfirmed: true, opens: null, deadline: last }, statusOverride: null }) : JSON.stringify({ dates: { cycleConfirmed: false }, statusOverride: 'unconfirmed' }),
      x: `${r.it} diritto allo studio dsu borsa di studio need-based grant ${r.agencies.map((a) => a.name).join(' ')}`, w: 4,
    });
  }
  // Universities
  for (const u of itUnis) {
    items.push({
      id: `uni:${u.slug}`, t: 'university', k: `University · Italy`, n: u.name,
      s: `${u.programmeCount} English-taught programme${u.programmeCount === 1 ? '' : 's'}${u.city ? ` · ${u.city}` : ''}`,
      u: uniUrl(u), l: [], j: [], c: ['italy'], g: u.region || undefined, x: `${u.short} ${u.city} ${u.region}`, w: 4,
    });
  }
  // Universities — Nordic & Baltic directory
  for (const c of dirCountries) {
    for (const i of c.institutions) {
      const lv: FLevel[] = i.english ? (['bachelor', 'master', 'phd'] as const).filter((k) => (i.english as any)[k]) : [];
      items.push({
        id: `dir:${c.slug}/${i.slug}`, t: 'university', k: `${i.ownership ? ownershipLabel[i.ownership] + ' ' : ''}${i.category.startsWith('Structural') ? 'university unit' : i.category.toLowerCase()} · ${c.name}`,
        n: i.name, s: [i.english ? `${i.english.total} English-taught programme${i.english.total === 1 ? '' : 's'}` : null, i.city].filter(Boolean).join(' · ') || `${c.name} · official list`,
        u: dirInstUrl(c, i), l: lv, j: [], c: [c.slug], g: i.city || undefined,
        x: `${i.localName ?? ''} ${aliases(`${i.name} ${i.city ?? ''}`)} ${i.category} ${i.parent ?? ''} ${i.ownership ?? ''} ${c.name} university college`, w: i.english ? 4 : 3,
      });
      // Programmes listed by the national portal (e.g. Study in Croatia)
      const pl: Record<string, FLevel> = { bachelor: 'bachelor', master: 'master', integrated: 'single-cycle', phd: 'phd', specialist: 'other' };
      (i.programmes ?? []).forEach((p, k) => {
        items.push({
          id: `dirp:${c.slug}/${i.slug}/${k}`, t: 'course', k: `${progLevelLabels[p.level].replace(/ \/.*/, '')} · ${c.name}`, n: p.name,
          s: `${i.name}${i.city ? ` · ${i.city}` : ''}`, u: dirInstUrl(c, i), l: [pl[p.level]], j: [], c: [c.slug], g: i.city || undefined, en: 1,
          x: `${i.name} english-taught`, w: 2,
        });
      });
    }
  }
  // Programmes from official national programme databases (DAAD, Study in Latvia, Study in Czechia)
  const short = (t: string | undefined, n: number) => { if (!t) return undefined; const one = t.replace(/\s*\n\s*/g, ' · ').replace(/\s+/g, ' ').trim(); return one.length > n ? one.slice(0, n - 1).trimEnd() + '…' : one; };
  const engSummary = (t?: string) => {
    if (!t) return undefined;
    const lvl = t.match(/\b([ABC][12])\b/)?.[1];
    const tests = t.split('\n').map((l) => l.replace(/^[•\s-]+/, '').trim()).filter((l) => /ielts|toefl|cambridge|pte|duolingo|toeic/i.test(l) && l.length < 70);
    const parts = [lvl, ...tests.slice(0, 2)].filter(Boolean) as string[];
    return parts.length ? short(parts.join(' · '), 90) : short(t, 90);
  };
  const feeSummary = (t?: string) => t ? short(t.split('\n').map((l) => l.replace(/^[•\s-]+/, '').trim()).filter((l) => l && !/^the following tuition fees apply/i.test(l)).join(' '), 70) : undefined;
  for (const p of dirProgs) {
    const c = dirBySlug[p.c]; const inst = c?.institutions.find((i) => i.slug === p.uni);
    if (!c || !inst) continue;
    items.push({
      id: `dp:${p.id}`, t: 'course', k: `${progLevelShort[p.level]} · ${c.name}`, n: p.name,
      s: `${inst.name}${p.city ? ` · ${p.city}` : ''}`, u: `${dirInstUrl(c, inst)}#${progAnchor(p)}`, l: [p.level === 'single-cycle' ? 'single-cycle' : p.level === 'other' ? 'other' : p.level],
      j: [], c: [c.slug], g: p.city || undefined, en: 1, ie: engSummary(p.english), tf: feeSummary(p.tuition),
      x: `${inst.name} ${p.degree ?? ''} ${p.specialization ?? ''} ${p.faculty ?? ''} ${aliases(`${inst.name} ${p.city ?? ''}`)}`, w: 2,
    });
  }
  // Destinations
  for (const c of countries) {
    items.push({ id: `c:${c.slug}`, t: 'country', k: 'Destination', n: c.name, s: c.highlights.slice(0, 2).join(' · '), u: `/countries/${c.slug}/`, l: [], j: [], c: [c.slug], x: `${c.localName} ${c.region} study in ${c.name}`, w: 4 });
  }
  return items;
}

/** Destinations that actually have items, for the filter list. */
export function destinationOptions(items: FItem[]) {
  const used = new Set(items.flatMap((i) => i.c));
  return countries.filter((c) => used.has(c.slug)).map((c) => ({ slug: c.slug, name: c.slug === 'europe' ? 'Europe (Erasmus Mundus, multi-country)' : c.name }));
}
