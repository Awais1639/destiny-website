#!/usr/bin/env node
/**
 * Builds worker/src/universities.json: the list of universities (name, country, official website hosts)
 * that the live-lookup service may read. Only these hosts can ever be fetched by the service.
 *
 * Sources (official websites):
 *  1. Our own university directory (src/data/universities-europe.json, src/data/italy-programmes.json) — preferred.
 *  2. Hipo "University Domains and Names Data List" (MIT licence), scripts/data/raw/world-universities.json,
 *     https://github.com/Hipo/university-domains-list — about 10,000 institutions worldwide.
 * Run: node scripts/build-worker-universities.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const host = (u) => { try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };
const out = new Map(); // key: primary host
const add = (name, country, urls, aliases = []) => {
  const hosts = [...new Set(urls.map(host).filter(Boolean))].filter((h) => h.includes('.') && !/(facebook|linkedin|twitter|instagram|wikipedia|google)\./.test(h));
  if (!name || !hosts.length) return;
  const key = hosts[0];
  const prev = out.get(key);
  if (prev) { for (const h of hosts) if (!prev.h.includes(h)) prev.h.push(h); for (const a of [name, ...aliases]) if (a && a !== prev.n && !prev.a.includes(a)) prev.a.push(a); return; }
  out.set(key, { n: name, c: country, h: hosts, a: [...new Set(aliases.filter((a) => a && a !== name))] });
};

const dir = read('../src/data/universities-europe.json');
for (const c of dir.countries) for (const i of c.institutions) if (i.website) add(i.name, c.name, [i.website, i.programmesUrl].filter(Boolean), [i.localName]);
const it = read('../src/data/italy-programmes.json');
for (const u of it.universities) if (u.website) add(u.name, 'Italy', [u.website], [u.short]);
let fromDir = out.size;
for (const u of read('./data/raw/world-universities.json')) add(u.name, u.country, [...(u.web_pages ?? []), ...(u.domains ?? [])]);

const list = [...out.values()].map((x) => ({ n: x.n, c: x.c, h: x.h, ...(x.a.length ? { a: x.a.slice(0, 4) } : {}) }));
writeFileSync(new URL('../worker/src/universities.json', import.meta.url), JSON.stringify(list));
console.log(`[worker] ${list.length} universities (${fromDir} from our directory), ${list.reduce((s, x) => s + x.h.length, 0)} official hosts`);
