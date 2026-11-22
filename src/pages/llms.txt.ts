// /llms.txt — a plain-text map of the website for AI assistants and answer engines (https://llmstxt.org).
import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { scholarships } from '../lib/data';
import { guides } from '../data/guides';
import { services } from '../data/services';
import { countries } from '../data/countries';
import { tools } from '../data/tools';
import { conferences } from '../lib/conferences';

export const GET: APIRoute = ({ site: base }) => {
  const u = (p: string) => new URL(p, base).href;
  const lines: string[] = [];
  lines.push(`# ${site.platformName} (${site.companyName})`, '');
  lines.push(`> ${site.mission} A free, independent platform listing scholarships, fellowships, PhD and postdoc positions, funded conferences and English-taught degrees worldwide — each checked against official sources with a "last checked" date — plus free tools and optional paid consultancy for admissions, scholarship applications and visas.`, '');
  lines.push('Key facts:');
  lines.push(`- Operator: ${site.companyName}, company no. ${site.registration.number} (${site.registration.jurisdiction}), registered office ${site.registration.registeredOffice}.`);
  lines.push('- Independent: not affiliated with any government, embassy, university or scholarship provider. Applying on official websites is always free; our assistance is optional and guarantees no outcome.');
  lines.push('- Every listing links to the official source and shows when it was last checked and how it was verified. Dates are never guessed; unconfirmed cycles are labelled "Cycle not yet confirmed".');
  lines.push(`- Contact: ${site.contact.email}${site.whatsappChannel ? `; WhatsApp Channel for new scholarships: ${site.whatsappChannel}` : ''}.`, '');

  lines.push('## Main sections');
  for (const [t, p, d] of [
    ['Scholarships', '/scholarships/', 'searchable list of international scholarships with eligibility, funding, deadlines and official links'],
    ['Scholarships for Pakistani students', '/scholarships/pakistan/', 'every listed scholarship whose official rules accept citizens of Pakistan'],
    ['Universitaly pre-enrolment guide', '/guides/universitaly-pre-enrolment-guide/', 'how pre-enrolment, the Italian study visa and residence permit fit together'],
    ['Course finder', '/find/', 'search scholarships, degrees and opportunities in one place'],
    ['Compare scholarship schemes', '/scholarships/compare/', 'major government schemes side by side'],
    ['Erasmus Mundus catalogue', '/scholarships/erasmus-mundus/', 'all Erasmus Mundus Joint Masters with intake status and scholarships'],
    ['Italy regional grants (DSU)', '/scholarships/italy-regional-grants/', 'need-based grants for studying in Italy'],
    ['English-taught degrees in Italy', '/universities/italy/', 'programmes at Italian universities'],
    ['Universities', '/universities/', 'universities by country'],
    ['PhD positions', '/phd/', 'funded doctoral positions'],
    ['Postdoc positions', '/postdoc/', 'postdoctoral opportunities'],
    ['Fellowships', '/fellowships/', 'research and leadership fellowships'],
    ['Conferences & summits', '/conferences/', 'funded conferences, travel grants and summits'],
    ['Internships & theses', '/internships/', 'research internships'],
    ['Study destinations', '/countries/', 'country guides'],
    ['Guides', '/guides/', 'how-to guides for applications, documents and visas'],
    ['Free tools', '/tools/', 'eligibility checker, grade and ECTS converter, visa money calculator, planner, checklists'],
    ['Consultancy services', '/services/', 'optional paid assistance'],
    ['How we verify', '/scholarship-verification/', 'verification standard and status labels'],
  ] as const) lines.push(`- [${t}](${u(p)}): ${d}`);
  lines.push('');

  lines.push('## Free tools');
  for (const t of tools.filter((t) => t.href.startsWith('/'))) lines.push(`- [${t.label}](${u(t.href)}): ${t.text}`);
  lines.push('');

  lines.push('## Scholarships');
  for (const s of scholarships) lines.push(`- [${s.title}](${u(`/scholarships/${s.slug}/`)}): ${s.summary.replace(/\s+/g, ' ').slice(0, 220)} (last checked ${s.verification.lastChecked})`);
  lines.push('');

  lines.push('## Funded conferences and summits');
  for (const c of conferences) lines.push(`- [${c.title}](${u(`/conferences/${c.slug}/`)}): ${c.summary.replace(/\s+/g, ' ').slice(0, 180)}`);
  lines.push('');

  lines.push('## Guides');
  for (const g of guides) lines.push(`- [${g.title}](${u(`/guides/${g.slug}/`)}): ${g.description}`);
  lines.push('');

  lines.push('## Study destinations');
  lines.push(countries.map((c) => `[${c.name}](${u(`/countries/${c.slug}/`)})`).join(' · '), '');

  lines.push('## Services (optional, paid)');
  for (const s of services) lines.push(`- [${s.title}](${u(`/services/${s.slug}/`)})`);
  lines.push('');

  lines.push('## Optional');
  lines.push(`- [About](${u('/about/')})`, `- [Contact](${u('/contact/')})`, `- [Privacy policy](${u('/privacy-policy/')})`, `- [Terms](${u('/terms/')})`, `- [Disclaimer](${u('/disclaimer/')})`, `- [Sitemap](${u('/sitemap-index.xml')})`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
