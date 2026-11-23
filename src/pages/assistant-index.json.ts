/**
 * Knowledge base for the "Ask Destiny" assistant (src/components/Assistant.astro).
 * Built from the website's own verified data on every build, so the assistant always matches the site.
 * Loaded by the visitor's browser only when they open the assistant. Nothing is sent back to us.
 * Dates are included raw so the browser works out "open / closing soon / closed" on the day it is used.
 */
import type { APIRoute } from 'astro';
import { scholarships } from '../lib/data';
import { emProgrammes, emUpdates } from '../lib/erasmus';
import { phdProgrammes } from '../lib/phd';
import { postdocs } from '../lib/postdoc';
import { fellowships } from '../lib/fellowships';
import { internships } from '../lib/internships';
import { conferences } from '../lib/conferences';
import { guides } from '../data/guides';
import { posts } from '../lib/blog';
import { tools } from '../data/tools';
import { countries } from '../data/countries';
import { services } from '../data/services';
import { coaching } from '../data/coaching';
import { regions, regionUrl } from '../lib/italy-regional';
import { dirCountries } from '../lib/universities-europe';
import { site } from '../config/site';
import elig from '../data/eligibility.json';
import visa from '../data/visa-funds.json';

export type Lvl = 'bachelor' | 'master' | 'phd' | 'postdoc' | 'other';
export interface Doc {
  k: string; t: string; u: string; s?: string; w?: string; c?: string[]; l?: Lvl[]; f?: string; pk?: 1;
  d?: { o?: string | null; dl?: string | null; cc?: boolean; ov?: string | null; n?: string | null };
}
const cut = (x: string | null | undefined, n = 220) => { const s = (x ?? '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…'; };
const dates = (d: { opens?: string | null; deadline?: string | null; cycleConfirmed?: boolean; deadlineNote?: string | null }, ov?: string | null) =>
  ({ o: d.opens ?? null, dl: d.deadline ?? null, cc: !!d.cycleConfirmed, ov: ov ?? null, n: cut(d.deadlineNote, 200) || null });
const schLvl: Record<string, Lvl[]> = { bachelors: ['bachelor'], masters: ['master'], phd: ['phd'], research: ['postdoc', 'other'], 'non-degree': ['other'] };
const rules = (elig as { rules: Record<string, { pk?: string }> }).rules;
const pkOk = (slug: string) => ['yes', 'only', 'list'].includes(rules[slug]?.pk ?? '');

export const GET: APIRoute = () => {
  const docs: Doc[] = [];

  for (const s of scholarships) docs.push({
    k: 'sch', t: s.title, u: `/scholarships/${s.slug}/`, s: cut(s.summary),
    w: [s.program, s.provider, s.eligibleNationalities, s.subjects.join(' ')].join(' '),
    c: s.countries, l: [...new Set(s.degreeLevels.flatMap((d) => schLvl[d] ?? []))], f: s.fundingType,
    ...(pkOk(s.slug) ? { pk: 1 as const } : {}), d: dates(s.dates, s.statusOverride),
  });

  for (const p of emProgrammes) {
    const up = emUpdates[p.slug];
    docs.push({
      k: 'em', t: `${p.acronym} — ${p.name}`, u: `/scholarships/erasmus-mundus/${p.slug}/`,
      s: 'Erasmus Mundus Joint Master: study in two or more European countries; EU-funded scholarships for the best-ranked applicants.',
      w: `erasmus mundus joint master emjm ${p.topics.join(' ')}`, c: ['europe'], l: ['master'], f: 'fully-funded',
      ...(up ? { d: { o: up.opens, dl: up.deadline, cc: !!up.deadline, ov: up.scholarships === 'none' ? 'closed' : null, n: cut(up.deadlineNote, 160) || null } } : {}),
    });
  }

  const research: [string, { slug: string; title: string; provider: string; countries: string[]; summary: string; fields?: string; dates: any; statusOverride?: string | null }[], string, Lvl[]][] = [
    ['phd', phdProgrammes as any, '/phd/', ['phd']],
    ['pd', postdocs as any, '/postdoc/', ['postdoc']],
    ['fel', fellowships as any, '/fellowships/', ['postdoc', 'other']],
    ['int', internships as any, '/internships/', ['bachelor', 'master', 'other']],
    ['conf', conferences as any, '/conferences/', ['other']],
  ];
  for (const [k, list, base, l] of research) for (const p of list) docs.push({
    k, t: p.title, u: `${base}${p.slug}/`, s: cut(p.summary), w: `${p.provider} ${p.fields ?? ''}`, c: p.countries, l, d: dates(p.dates, p.statusOverride),
  });

  for (const g of guides) docs.push({ k: 'guide', t: g.title, u: `/guides/${g.slug}/`, s: cut(g.description), w: g.sections.map((x) => x.heading).join(' ') });
  for (const p of posts) docs.push({ k: 'blog', t: p.title, u: p.href, s: cut(p.description), w: p.keywords.join(' ') + ' ' + p.date });
  for (const t of tools) if (t.href.startsWith('/')) docs.push({ k: 'tool', t: t.label, u: t.href, s: cut(t.text) });
  for (const c of countries) docs.push({ k: 'country', t: `Study in ${c.name}`, u: `/countries/${c.slug}/`, s: cut(c.intro), c: [c.slug], w: c.localName });
  for (const s of services) docs.push({ k: 'svc', t: s.title, u: `/services/${s.slug}/`, s: cut(s.short + ' ' + s.intro), w: s.help.join(' ') });
  for (const c of coaching) docs.push({ k: 'svc', t: c.title, u: `/coaching/${c.slug}/`, s: cut(c.tagline + ' ' + c.intro), w: `${c.test} coaching preparation test` });
  for (const r of regions) docs.push({ k: 'itgrant', t: `Regional grant (DSU) — ${r.name}`, u: regionUrl(r), s: 'Need-based Italian regional study grant (borsa di studio DSU): money, housing and meals for students with limited family income.', c: ['italy'], w: 'dsu borsa di studio diritto allo studio isee regional grant italy', l: ['bachelor', 'master', 'phd'] });

  // Proof-of-funds figures for the visa money answers.
  const funds = (visa as { countries: any[] }).countries.map((v) => ({ c: v.slug, n: v.name, cur: v.currency, a: v.amount ?? null, unit: v.unit, sum: cut(v.summary, 320), lvl: v.level, src: v.source?.url ?? null, chk: v.checked }));

  // Destination names the assistant recognises (site destinations + university directory countries).
  const dest: Record<string, string> = {};
  for (const c of countries) dest[c.slug] = c.name;
  for (const c of dirCountries) dest[c.slug] = c.name;

  const body = {
    built: new Date().toISOString().slice(0, 10),
    contact: { email: site.contact.email, whatsapp: site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp}` : site.contact.whatsappUrl, phone: site.contact.phone },
    dest, funds, docs,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
