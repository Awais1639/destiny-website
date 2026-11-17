#!/usr/bin/env node
/**
 * Refreshes the Erasmus Mundus programme list from the OFFICIAL EACEA catalogue only:
 *   https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=0,1,2…
 *
 * Each catalogue entry looks like:
 *   <a href="PROGRAMME WEBSITE">Programme name</a>   ACRONYM - Project overview   <a href="EU PROJECT PAGE">…</a>
 *
 * Writes scripts/data/erasmus-catalogue-YYYY-MM-DD.txt (only if the list changed), then rebuilds
 * src/data/erasmus-mundus.json. Safety: if fewer than MIN_ENTRIES programmes are found (site down,
 * layout changed, blocked), it exits with an error and the existing data is left untouched.
 *
 * Usage:  node scripts/sync-erasmus.mjs            (live)
 *         node scripts/sync-erasmus.mjs --file a.html --file b.html   (parse saved pages, for testing)
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const BASE = 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en';
const MIN_ENTRIES = 150;
const MAX_PAGES = 30;
const dataDir = fileURLToPath(new URL('./data/', import.meta.url));

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const isEuProject = (u) => /erasmus-plus\.ec\.europa\.eu\/projects|ec\.europa\.eu\/programmes\/erasmus-plus\/projects|ec\.europa\.eu\/info\/funding-tenders/.test(u);
const isOwnSite = (u) => /(^|\.)(europa\.eu)(\/|$)/.test(new URL(u, BASE).hostname + '/');

/** Parse one catalogue page → [{acronym, name, website, projectPage}] */
export function parsePage(html) {
  const main = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  // Linearise: anchors become ⟦href|text⟧, all other tags become spaces.
  const flat = decode(main
    .replace(/<a\b[^>]*?href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, t) => ` ⟦${h.replace(/[|⟧]/g, '')}|${clean(t).replace(/[|⟧]/g, '')}⟧ `)
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const parts = flat.split(/\s-\s*Project overview/i);
  const out = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i], after = parts[i + 1];
    // Project page: first EU project link right after the marker
    const pm = after.match(/⟦([^|]+)\|[^⟧]*⟧/) || after.match(/(https?:\/\/[^\s<>⟦⟧]+)/);
    let projectPage = pm && isEuProject(pm[1]) ? new URL(decode(pm[1]), BASE).href : null;
    // Acronym: text after the last anchor in `before`
    const lastA = before.lastIndexOf('⟧');
    const acronym = before.slice(lastA + 1).trim().replace(/^[-–—:\s]+/, '');
    if (!acronym || acronym.length > 220) continue;
    // Name + website: the last anchor before the acronym, unless it is a site-internal/EU link
    let name = '', website = null;
    const am = before.slice(0, lastA + 1).match(/⟦([^|]*)\|([^⟧]*)⟧$/);
    if (am && am[2] && /^https?:/i.test(am[1]) && isEuProject(am[1])) { name = am[2].trim(); projectPage ||= decode(am[1]); }
    else if (am && am[2] && /^https?:/i.test(am[1]) && !isOwnSite(am[1])) { name = am[2].trim(); website = decode(am[1]); }
    else if (am && am[2] && !/^https?:/i.test(am[1]) && !/project overview/i.test(am[2])) { name = am[2].trim(); }
    if (!name) continue;
    out.push({ acronym, name, website, projectPage });
  }
  return out;
}

async function fetchPage(n) {
  const res = await fetch(`${BASE}?page=${n}`, { headers: { 'User-Agent': 'DestinyGlobalOpportunities-CatalogueSync/1.0 (+weekly, 1 request per page)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for page ${n}`);
  return res.text();
}

async function main() {
  const files = process.argv.flatMap((a, i, arr) => (a === '--file' ? [arr[i + 1]] : []));
  const all = [];
  if (files.length) for (const f of files) all.push(...parsePage(readFileSync(f, 'utf8')));
  else {
    for (let n = 0; n < MAX_PAGES; n++) {
      const items = parsePage(await fetchPage(n));
      console.log(`page ${n}: ${items.length}`);
      if (!items.length) break;
      all.push(...items);
      await new Promise((r) => setTimeout(r, 1500)); // be polite
    }
  }
  const seen = new Set();
  const rows = all.filter((p) => { const k = `${p.acronym}|${p.projectPage || p.name}`; if (seen.has(k)) return false; seen.add(k); return true; });
  if (rows.length < MIN_ENTRIES) {
    console.error(`✖ Only ${rows.length} programmes found (minimum ${MIN_ENTRIES}). The catalogue may be unavailable or its layout changed. Existing data was NOT changed.`);
    process.exit(1);
  }
  const text = rows.map((p) => [p.acronym, p.name, p.website || 'NONE', p.projectPage || 'NONE'].join(' | ')).join('\n') + '\n';
  const snaps = readdirSync(dataDir).filter((f) => /^erasmus-catalogue-\d{4}-\d{2}-\d{2}\.txt$/.test(f)).sort();
  const prev = snaps.length ? readFileSync(dataDir + snaps.at(-1), 'utf8') : '';
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(dataDir + `erasmus-catalogue-${today}.txt`, text);
  if (prev.trim() === text.trim()) console.log(`✔ Catalogue unchanged (${rows.length} programmes) — check date updated to ${today}.`);
  else {
    const before = new Set(prev.split('\n').map((l) => l.split(' | ')[0]).filter(Boolean));
    const now = new Set(rows.map((r) => r.acronym));
    console.log(`✔ Catalogue updated: ${rows.length} programmes. Added: ${[...now].filter((a) => !before.has(a)).join(', ') || 'none'}. Removed: ${[...before].filter((a) => !now.has(a)).join(', ') || 'none'}.`);
  }
  // keep only the 3 newest snapshots
  const all3 = readdirSync(dataDir).filter((f) => /^erasmus-catalogue-\d{4}-\d{2}-\d{2}\.txt$/.test(f)).sort();
  for (const f of all3.slice(0, -3)) unlinkSync(dataDir + f);
  execFileSync(process.execPath, [fileURLToPath(new URL('./build-erasmus-data.mjs', import.meta.url))], { stdio: 'inherit' });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error('✖', e.message); process.exit(1); });
