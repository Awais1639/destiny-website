#!/usr/bin/env node
/**
 * Builds src/data/italy-programmes.json — every degree programme taught (fully or partly) in English at
 * Italian universities — from the official open data of Italy's Ministry of University and Research (MUR):
 *
 *   scripts/data/italy/mur-corsi.csv   MUR "Offerta formativa" (corsi di laurea) — one row per programme per
 *                                      academic year. Columns used: ANNO, Ateneo, GruppoDisciplinare, TipoCorso,
 *                                      Classe, NomeClasse, Corso, SedeCorso_Comune, SedeCorso_Provincia,
 *                                      ACCESSO, DIDATTICA, LINGUA
 *   scripts/data/italy/universities.json  Official name, type, city and website of each university, checked by
 *                                      hand on the universities' own websites (keyed by the MUR "Ateneo" name).
 *
 * Only the most recent year in the file is used. Requirements, fees and deadlines are NOT in this data —
 * they are added in src/data/italy-updates.json after checking each university's own website.
 *
 * Usage: node scripts/build-italy-data.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./data/italy/', import.meta.url));
const out = fileURLToPath(new URL('../src/data/italy-programmes.json', import.meta.url));

function readText(p) {
  const buf = readFileSync(p);
  const utf = buf.toString('utf8');
  return utf.includes('�') ? new TextDecoder('windows-1252').decode(buf) : utf; // MUR files are often Windows-1252
}
/** Small CSV parser; detects ; , or tab as the delimiter. */
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.slice(0, text.indexOf('\n'));
  const delim = [';', ',', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '');
const SMALL = /^(of|and|in|for|the|to|with|on|at|di|e|del|della|delle|dei|degli|per|da|a|in|nel|nella)$/;
const ACRONYMS = new Set(['AI', 'ICT', 'EU', 'UE', 'MSC', 'BSC', 'MBA', 'II', 'III', 'IV', 'HR', 'IT', 'UX', 'UI', 'GIS', 'STEM', 'PPE', 'IOT', 'BIM', 'ESG', 'TV', '3D', 'R&D', 'UK', 'UN', 'NGO', 'SDG', 'SDGS', 'FMCG', 'ICT4D']);
function titleCase(s) {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().split(/(\s+|-|\/|\(|\))/).map((w, i) => {
    if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
    if (i > 0 && SMALL.test(w)) return w;
    return w.replace(/^(\p{L})/u, (c) => c.toUpperCase()).replace(/'(\p{L})/u, (_, c) => `'${c.toUpperCase()}`);
  }).join('');
}

if (!existsSync(dir + 'mur-corsi.csv')) { console.error('✖ Missing scripts/data/italy/mur-corsi.csv — see the comment at the top of this script.'); process.exit(1); }
const corsi = parseCsv(readText(dir + 'mur-corsi.csv'));
const uniInfo = existsSync(dir + 'universities.json') ? JSON.parse(readFileSync(dir + 'universities.json', 'utf8')) : {};

const year = [...new Set(corsi.map((r) => r.ANNO).filter(Boolean))].sort().at(-1);
const thisYear = corsi.filter((r) => r.ANNO === year);
const rows = thisYear.filter((r) => /ingl|engl/i.test(r.LINGUA));

const LEVEL = { 'Laurea': 'bachelor', 'Laurea Magistrale': 'master', 'Laurea Magistrale Ciclo Unico': 'single-cycle' };
// Official MUR subject groups ("Gruppo disciplinare"), translated
const GROUPS = {
  "Ingegneria industriale e dell'informazione": ['engineering', 'Industrial & Information Engineering'],
  'Informatica e Tecnologie ICT': ['computing', 'Computer Science & ICT'],
  'Architettura e Ingegneria civile': ['architecture', 'Architecture & Civil Engineering'],
  'Scientifico': ['sciences', 'Natural Sciences & Mathematics'],
  'Economico': ['economics', 'Economics, Business & Management'],
  'Politico-Sociale e Comunicazione': ['social', 'Political & Social Sciences, Communication'],
  'Giuridico': ['law', 'Law'],
  'Psicologico': ['psychology', 'Psychology'],
  'Medico-Sanitario e Farmaceutico': ['health', 'Medicine, Health & Pharmacy'],
  'Agrario-Forestale e Veterinario': ['agriculture', 'Agriculture, Food, Forestry & Veterinary'],
  'Scienze motorie e sportive': ['sport', 'Sport Sciences'],
  'Arte e Design': ['art-design', 'Art & Design'],
  'Linguistico': ['languages', 'Languages & Linguistics'],
  'Letterario-Umanistico': ['humanities', 'Humanities'],
  'Educazione e Formazione': ['education', 'Education'],
};
const ACCESS = { 'accesso libero': 'open', 'locale': 'limited-local', 'nazionale': 'limited-national' };
const MODE = { 'Convenzionale': 'in-person', 'Blended/Modalità Mista': 'blended', 'Prevalentemente a distanza': 'mostly-online', 'Teledidattica': 'online' };

// --- universities (key = MUR "Ateneo" name)
const uni = new Map();
const missingInfo = new Set();
for (const r of rows) {
  const key = r.Ateneo;
  if (uni.has(key)) continue;
  const m = uniInfo[key];
  if (!m) missingInfo.add(key);
  const online = /telematic/i.test(key);
  uni.set(key, {
    code: key,
    name: m?.name || key.replace(/\s*-\s*telematica$/i, ''),
    short: m?.short || key.replace(/\s*-\s*telematica$/i, ''),
    type: m?.type || (online ? 'online' : 'other'),
    city: m?.city || '',
    region: m?.region || '',
    website: m?.website || null,
    checkedOn: m?.checkedOn || null,
  });
}

// --- programmes
const seen = new Set(), programmes = [];
for (const r of rows) {
  const name = titleCase(r.Corso.replace(/\s+/g, ' '));
  const city = titleCase(r.SedeCorso_Comune || '');
  const key = `${r.Ateneo}|${name.toLowerCase()}|${r.Classe}|${city}`;
  if (seen.has(key)) continue; seen.add(key);
  const g = GROUPS[r.GruppoDisciplinare] || ['other', r.GruppoDisciplinare || 'Other'];
  programmes.push({
    uni: r.Ateneo, name, level: LEVEL[r.TipoCorso] || 'other', classCode: r.Classe, className: r.NomeClasse,
    city, province: r.SedeCorso_Provincia || '', language: r.LINGUA, topic: g[0],
    access: ACCESS[r.ACCESSO] || 'unknown', mode: MODE[r.DIDATTICA] || 'unknown',
  });
}

// --- slugs
const uniSeen = new Set();
for (const u of uni.values()) {
  let s = slugify(u.code.replace(/\s*-\s*telematica$/i, ''));
  while (uniSeen.has(s)) s += '-2';
  uniSeen.add(s); u.slug = s;
}
const progSeen = new Set();
for (const p of programmes) {
  p.uniSlug = uni.get(p.uni).slug;
  const base = `${p.uniSlug}/${slugify(p.name) || 'programme'}`;
  let s = base;
  if (progSeen.has(s)) s = `${base}-${slugify(p.city) || p.level}`;
  let n = 2; while (progSeen.has(s)) s = `${base}-${n++}`;
  progSeen.add(s); p.slug = s.split('/')[1];
}
const universities = [...uni.values()].map((u) => ({ ...u, programmeCount: programmes.filter((p) => p.uni === u.code).length }))
  .sort((a, b) => a.name.localeCompare(b.name, 'it'));
programmes.sort((a, b) => a.name.localeCompare(b.name, 'en'));

const usedTopics = new Set(programmes.map((p) => p.topic));
writeFileSync(out, JSON.stringify({
  source: 'Ministero dell’Università e della Ricerca (MUR) — open data “Offerta formativa” (USTAT)',
  sourceUrl: 'https://dati-ustat.mur.gov.it/',
  dataYear: year,
  academicYear: `${year}/${String(+year + 1).slice(-2)}`,
  imported: new Date().toISOString().slice(0, 10),
  count: programmes.length,
  levels: { bachelor: "Bachelor's (Laurea)", master: "Master's (Laurea Magistrale)", 'single-cycle': 'Single-cycle master’s (Laurea Magistrale a ciclo unico)', other: 'Other' },
  topics: Object.fromEntries([...Object.values(GROUPS), ['other', 'Other']].filter(([k]) => usedTopics.has(k))),
  access: { open: 'Open access', 'limited-local': 'Limited places (set by the university)', 'limited-national': 'Limited places (national entrance test)', unknown: 'Not specified' },
  modes: { 'in-person': 'In person', blended: 'Blended (in person + online)', 'mostly-online': 'Mostly online', online: 'Online', unknown: 'Not specified' },
  universities,
  programmes,
}, null, 1));
const byLevel = programmes.reduce((m, p) => ((m[p.level] = (m[p.level] || 0) + 1), m), {});
console.log(`✔ italy-programmes.json — ${year}/${+year + 1}: ${programmes.length} programmes taught in English (fully or partly) at ${universities.length} universities`, byLevel);
console.log(`  Of these, taught only in English: ${programmes.filter((p) => p.language === 'Inglese').length}`);
if (missingInfo.size) console.log(`  ⚠ No checked details yet in universities.json for: ${[...missingInfo].join(', ')}`);
