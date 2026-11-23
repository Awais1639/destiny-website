/** Find which university a question is about, using the bundled list of official websites. */
import list from './universities.json';

export interface Uni { n: string; c: string; h: string[]; a?: string[] }
export const UNIS = list as Uni[];

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
// Words that say nothing about which university is meant.
const WEAK = new Set('university universities universita universitat universite universidad universidade uniwersytet university of the of de di del della degli dei da des du der und and for in at institute institut instituto istituto college school polytechnic politecnico technical technology technische hochschule state national studies studi sciences science applied academy faculty campus fees fee tuition english language requirements requirement requirement admission admissions apply application deadline masters master bachelor bachelors phd msc bsc mba program programme programs programmes course courses scholarship scholarships visa international student students what how much is are the a an my me for about tell'.split(' '));
const SYN: Record<string, string> = { munich: 'munchen', cologne: 'koln', vienna: 'wien', prague: 'praha', warsaw: 'warszawa', milan: 'milano', rome: 'roma', florence: 'firenze', turin: 'torino', naples: 'napoli', venice: 'venezia', padua: 'padova', genoa: 'genova', lisbon: 'lisboa', copenhagen: 'kobenhavn', gothenburg: 'goteborg', brussels: 'bruxelles', tu: 'technische' };

const PRIORITY = ['Pakistan', 'United Kingdom', 'United States', 'Germany', 'Italy', 'Canada', 'Australia', 'France', 'Netherlands', 'Sweden', 'Hungary', 'Turkey', 'Türkiye', 'China', 'Japan', 'South Korea', 'Korea, Republic of', 'Malaysia', 'Ireland', 'Spain', 'Finland', 'Norway', 'Denmark', 'Switzerland', 'Austria', 'Belgium', 'New Zealand'];

interface Entry { u: Uni; words: Set<string>; strong: Set<string>; names: Set<string>[]; acr: string; hosts: string[] }
let INDEX: Entry[] | null = null;
function index(): Entry[] {
  if (INDEX) return INDEX;
  INDEX = UNIS.map((u) => {
    const names = [u.n, ...(u.a ?? [])].map(norm);
    const words = new Set(names.flatMap((n) => n.split(' ')));
    const strong = new Set([...words].filter((w) => w.length > 2 && !WEAK.has(w)));
    const nameSets = names.map((n) => new Set(n.split(' ').filter((w) => w.length > 2 && !WEAK.has(w)))).filter((x) => x.size);
    const acr = norm(u.n).split(' ').filter((w) => !['of', 'the', 'and', 'de', 'di', 'del', 'la'].includes(w)).map((w) => w[0]).join('');
    return { u, words, strong, names: nameSets, acr, hosts: u.h };
  });
  return INDEX;
}

/** Returns the best match and close alternatives. `score` >= 1 means a confident match. */
export function findUniversity(text: string, site?: string): { best?: Uni; score: number; alternatives: Uni[] } {
  const ix = index();
  if (site) {
    const h = hostOf(site);
    const e = h ? ix.find((x) => x.hosts.some((y) => h === y || h.endsWith(`.${y}`))) : undefined;
    if (e) return { best: e.u, score: 2, alternatives: [] };
  }
  const q = norm(text);
  const tokens = q.split(' ').map((t) => SYN[t] ?? t);
  // A website address in the question decides it.
  const dom = q.match(/\b([a-z0-9-]+\.)+[a-z]{2,}\b/)?.[0];
  if (dom) {
    const e = ix.find((x) => x.hosts.some((y) => dom === y || dom.endsWith(`.${y}`) || y.endsWith(`.${dom}`)));
    if (e) return { best: e.u, score: 2, alternatives: [] };
  }
  const strongQ = tokens.filter((t) => t.length > 2 && !WEAK.has(t));
  const acrQ = tokens.filter((t) => /^[a-z]{2,6}$/.test(t) && !WEAK.has(t));
  const scored: { e: Entry; s: number }[] = [];
  for (const e of ix) {
    // Best over the university's names (official name and aliases such as "University of Bologna"):
    // share of that name's distinctive words mentioned, averaged with the share of the question's words it explains.
    let s = 0;
    for (const set of e.names) {
      let hit = 0;
      for (const t of strongQ) if (set.has(t)) hit++;
      if (!hit) continue;
      s = Math.max(s, (hit / set.size + hit / strongQ.length) / 2);
    }
    // "MIT", "LUMS": the website name (mit.edu, lums.edu.pk) beats a matching acronym of the full name.
    if (acrQ.some((a) => a.length >= 3 && e.hosts.some((h) => h.split('.')[0] === a))) s = Math.max(s, 0.95);
    else if (acrQ.some((a) => a.length >= 3 && a === e.acr)) s = Math.max(s, 0.8);
    if (tokens.includes('technische') && e.words.has('technische')) s += 0.15;
    // The full name written in the question ("University of Helsinki") beats a longer similar name.
    if (s > 0 && [e.u.n, ...(e.u.a ?? [])].some((n) => { const x = norm(n); return x.length > 8 && q.includes(x); })) s += 0.5;
    if (s > 0.3) scored.push({ e, s });
  }
  // Ties (e.g. "LUMS", "MIT"): list the most likely first for our visitors.
  const pri = (u: Uni) => PRIORITY.indexOf(u.c) === -1 ? 99 : PRIORITY.indexOf(u.c);
  scored.sort((a, b) => b.s - a.s || pri(a.e.u) - pri(b.e.u) || a.e.u.n.length - b.e.u.n.length);
  const best = scored[0];
  if (!best) return { score: 0, alternatives: [] };
  const close = scored.slice(1, 4).filter((x) => x.s >= best.s - 0.15).map((x) => x.e.u);
  return { best: best.e.u, score: best.s >= 0.6 && !(close.length && scored[1].s === best.s) ? 1 : best.s, alternatives: close };
}

export const hostOf = (u: string) => { try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };

/** True when `url` belongs to one of the university's official hosts (or their sub-domains). */
export function isOfficial(u: Uni, url: string): boolean {
  const h = hostOf(url);
  return !!h && u.h.some((y) => h === y || h.endsWith(`.${y}`));
}
