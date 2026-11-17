#!/usr/bin/env node
/**
 * Builds src/data/erasmus-mundus.json from the newest official catalogue snapshot in scripts/data/
 * (files named erasmus-catalogue-YYYY-MM-DD.txt, one programme per line:
 *  ACRONYM | Programme name | official programme website | official EU project page).
 *
 * Source: EACEA Erasmus Mundus Catalogue — https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en
 * Snapshots are created by scripts/sync-erasmus.mjs (automatic) or by hand.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./data/', import.meta.url));
const snaps = readdirSync(dir).filter((f) => /^erasmus-catalogue-\d{4}-\d{2}-\d{2}\.txt$/.test(f)).sort();
if (!snaps.length) { console.error('No catalogue snapshot found in scripts/data/'); process.exit(1); }
const file = snaps.at(-1);
const checked = file.match(/(\d{4}-\d{2}-\d{2})/)[1];

const isUrl = (u) => /^https?:\/\/[^\s]+$/i.test(u || '');
const isProjectPage = (u) => /ec\.europa\.eu\/(programmes\/erasmus-plus|info\/funding-tenders)|erasmus-plus\.ec\.europa\.eu\/projects/.test(u || '');
const INTRA_AFRICA = new Set(['SPREE', 'MASTET', 'MIRET', 'FRAME', 'ELbM', 'AFRIDI', 'AWaRMN']);

// Topic grouping (our own classification from the programme title — shown as "Topic", not as an official field)
const TOPICS = [
  ['computing', 'Computing, Data & AI', /\b(data|artificial intelligence|\bai\b|software|cyber|computing|computer|digital|informat|cloud|robot|vision|machine)/i],
  ['engineering', 'Engineering & Technology', /(engineer|mechatronic|electr|photonic|laser|nano|material|manufactur|construction|structur|ship|aeronaut|vehicle|accelerator|textile|sensor|membrane|mechanic|systems|technolog|imaging|acoustic)/i],
  ['energy-environment', 'Energy, Climate & Environment', /(energy|renewable|hydrogen|climate|environment|sustainab|water|groundwater|flood|coast|marine|ocean|forest|soil|ecolog|biodiversity|circular|green|earth|geo|island|nature|urban climate|tropical|hydrolog|cities|urban)/i],
  ['natural-sciences', 'Natural Sciences & Mathematics', /(physics|chemi|catalys|spectroscop|quantum|mathemat|astrophys|planetary|nuclear|fusion|biolog|genom|biotech|particle|science)/i],
  ['health', 'Health & Life Sciences', /(health|medic|neuro|vaccin|disease|pharma|drug|ageing|aging|skin|clinical|biomedical|toxicolog|one health|physiolog|psycholog|care|brain)/i],
  ['agri-food', 'Agriculture, Food & Aquaculture', /(agri|food|crop|plant|aquacult|insect|wine|bioeconomy|biomass|rural)/i],
  ['social', 'Social Sciences, Law & Policy', /(law|polic|politic|econom|governance|migration|security|humanitarian|gender|human rights|criminolog|society|social|global studies|public|diversity|peace|intercultural|work|education|leadership|sport|integrity|eurasian|european studies|regional)/i],
  ['humanities-arts', 'Humanities, Arts & Media', /(film|cinema|fiction|documentary|dance|theatre|\barts?\b|design|patrimoine|game|animation|sound|journalism|media|literat|linguist|language|lexicograph|heritage|museum|histor|archaeolog|religio|german studies|culture|cultural|prehistory|architect|creativ|children)/i],
  ['business', 'Business, Management & Innovation', /(management|business|entrepreneur|innovation|market|finance|tourism|industry)/i],
];

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const seen = new Map();
const rows = readFileSync(dir + file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const programmes = rows.map((line, i) => {
  let [a, b, c, d] = line.split(' | ').map((x) => (x ?? '').trim());
  // Some catalogue rows list "name | acronym" — the acronym is the short token without spaces-heavy wording
  if (a.length > b.length && b.split(' ').length <= 3 && a.split(' ').length > 3) [a, b] = [b, a];
  const acronym = a, name = b;
  let website = isUrl(c) && !isProjectPage(c) ? c : null;
  let overview = isUrl(d) ? d : isProjectPage(c) ? c : null;
  let slug = slugify(acronym) || `programme-${i + 1}`;
  if (seen.has(slug)) slug = `${slug}-${seen.get(slug) + 1}`;
  seen.set(slug, (seen.get(slug) || 0) + 1);
  const yearMatch = (overview || '').match(/EPP-1-(\d{4})-/);
  const topics = TOPICS.filter(([, , re]) => re.test(name)).map(([k]) => k).slice(0, 3);
  return {
    slug,
    acronym,
    name,
    type: INTRA_AFRICA.has(acronym) ? 'intra-africa' : 'emjm',
    website,
    projectPage: overview,
    selectionYear: yearMatch ? Number(yearMatch[1]) : null,
    topics: topics.length ? topics : ['other'],
    linkWarning: website && /[$]|[A-Za-z0-9]{14,}\$?$/.test(new URL(website).pathname.split('/').pop() || '') ? true : undefined,
    catalogueOrder: i + 1,
  };
});

const out = {
  source: 'EACEA Erasmus Mundus Catalogue',
  sourceUrl: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en',
  lastChecked: checked,
  count: programmes.length,
  topics: Object.fromEntries([...TOPICS.map(([k, label]) => [k, label]), ['other', 'Other / Interdisciplinary']]),
  programmes,
};
writeFileSync(fileURLToPath(new URL('../src/data/erasmus-mundus.json', import.meta.url)), JSON.stringify(out, null, 1));
const noSite = programmes.filter((p) => !p.website).map((p) => p.acronym);
console.log(`✔ erasmus-mundus.json — ${programmes.length} programmes from ${file}. Without official website link: ${noSite.join(', ') || 'none'}`);
