/**
 * "Ask Destiny" answer engine. Runs entirely in the visitor's browser over /assistant-index.json
 * (built from the website's own verified data). It never invents facts: every answer is either a fixed,
 * reviewed reply below or a list of pages from the index, with dates exactly as stored there.
 */
export type Lvl = 'bachelor' | 'master' | 'phd' | 'postdoc' | 'other';
export interface Doc {
  k: string; t: string; u: string; s?: string; w?: string; c?: string[]; l?: Lvl[]; f?: string; pk?: 1;
  d?: { o?: string | null; dl?: string | null; cc?: boolean; ov?: string | null; n?: string | null };
}
export interface Fund { c: string; n: string; cur: string; a: number | null; unit: string; sum: string; lvl: string; src: string | null; chk: string }
export interface Index { built: string; contact: { email: string; whatsapp: string; phone: string }; dest: Record<string, string>; funds: Fund[]; docs: Doc[] }

export interface Link { label: string; href: string }
export interface Item { title: string; href: string; kind: string; badge?: string; tone?: 'ok' | 'warn' | 'muted'; note?: string }
export interface Reply { text: string[]; items?: Item[]; links?: Link[]; chips?: string[]; handoff?: boolean }
/** Set when the answer could improve with the university list (loaded separately); the window loads it and asks again. */
export interface Answer { reply: Reply; ctx: Ctx; needUnis?: boolean }

export interface Ctx { country?: string; level?: Lvl; pk?: boolean; full?: boolean; kinds?: string[]; openOnly?: boolean; last?: string }

const KIND_LABEL: Record<string, string> = {
  sch: 'Scholarship', em: 'Erasmus Mundus', phd: 'PhD', pd: 'Postdoc', fel: 'Fellowship', int: 'Internship', conf: 'Conference',
  guide: 'Guide', blog: 'Blog', tool: 'Free tool', country: 'Destination', svc: 'Service', itgrant: 'Italy grant', uni: 'University',
};
export const kindLabel = (k: string) => KIND_LABEL[k] ?? 'Page';

const STOP = new Set('a an the and or of for in on to at by with from is are am be can could i me my we you your it this that these those do does did how what which where when who whom why will would should there their them about any some all more most into than then so as if please tell show find give list want need looking look search get know latest best top new also only just like ok okay hi hello hey dear sir madam'.split(' '));

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9+\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const ALIASES: Record<string, string> = {
  uk: 'united-kingdom', britain: 'united-kingdom', england: 'united-kingdom', scotland: 'united-kingdom', 'great britain': 'united-kingdom', london: 'united-kingdom',
  usa: 'united-states', us: 'united-states', america: 'united-states', 'united states of america': 'united-states',
  korea: 'south-korea', turkey: 'turkiye', uae: 'united-arab-emirates', dubai: 'united-arab-emirates', emirates: 'united-arab-emirates',
  holland: 'netherlands', czechia: 'czech-republic', czech: 'czech-republic', saudi: 'saudi-arabia', ksa: 'saudi-arabia', nz: 'new-zealand',
  deutschland: 'germany', italia: 'italy', budapest: 'hungary', rome: 'italy', milan: 'italy', berlin: 'germany', paris: 'france', tokyo: 'japan', seoul: 'south-korea', beijing: 'china', istanbul: 'turkiye', ankara: 'turkiye',
  eu: 'europe', european: 'europe',
};
const LEVELS: [RegExp, Lvl][] = [
  [/\b(post ?doc|postdoctoral|post-doc)\w*/, 'postdoc'],
  [/\b(phd|ph d|doctorate|doctoral|dphil)\b/, 'phd'],
  [/\b(masters?|ms|msc|mba|mphil|ma|postgrad\w*|graduate)\b/, 'master'],
  [/\b(bachelors?|bs|bsc|ba|undergrad\w*|bachelor)\b/, 'bachelor'],
];
const OTHER_NATIONS = ['india', 'indian', 'bangladesh', 'bangladeshi', 'sri lanka', 'sri lankan', 'nepal', 'nepali', 'nigeria', 'nigerian', 'egypt', 'egyptian', 'afghanistan', 'afghan', 'iran', 'iranian', 'kenya', 'kenyan', 'ghana', 'ghanaian', 'indonesia', 'indonesian', 'philippines', 'filipino', 'vietnam', 'vietnamese'];

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
export const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Same rules as the site's status badges (src/lib/scholarships.ts getStatus). */
export function status(d?: Doc['d']): { key: string; badge: string; tone: Item['tone'] } | null {
  if (!d) return null;
  const t = todayStr();
  if (d.ov === 'closed') return { key: 'closed', badge: 'Closed for this cycle', tone: 'muted' };
  if (d.ov === 'varies') return { key: 'varies', badge: 'Deadlines vary', tone: 'warn' };
  if (d.ov === 'open') return { key: 'open', badge: 'Open', tone: 'ok' };
  if (!d.cc) return { key: 'unconfirmed', badge: 'Next cycle not yet confirmed', tone: 'muted' };
  if (d.o && t < d.o) return { key: 'upcoming', badge: `Opens ${fmtDate(d.o)}`, tone: 'warn' };
  if (!d.dl) return { key: 'varies', badge: 'Check the deadline', tone: 'warn' };
  if (t > d.dl) return { key: 'closed', badge: 'Closed for this cycle', tone: 'muted' };
  const n = days(t, d.dl);
  return { key: n <= 30 ? 'closing-soon' : 'open', badge: n === 0 ? 'Open · closes today' : `Open · closes ${fmtDate(d.dl)}`, tone: n <= 30 ? 'warn' : 'ok' };
}

/* ---------- understanding the question ---------- */
interface Parsed { q: string; tokens: string[]; country?: string; level?: Lvl; pk: boolean; otherNat?: string; full: boolean; openOnly: boolean; kinds: string[] }

function parse(raw: string, ix: Index): Parsed {
  const q = ` ${norm(raw)} `;
  let country: string | undefined;
  const names = Object.entries(ix.dest).map(([slug, name]) => [norm(name), slug] as const).concat(Object.entries(ALIASES).map(([a, s]) => [a, s] as const));
  names.sort((a, b) => b[0].length - a[0].length);
  let rest = q;
  for (const [name, slug] of names) {
    if (rest.includes(` ${name} `)) { country = slug; rest = rest.replace(` ${name} `, ' '); break; }
  }
  let level: Lvl | undefined;
  for (const [re, l] of LEVELS) if (re.test(q)) { level = l; break; }
  const pk = /\b(pakistan|pakistani|pakistanis|pak|hec)\b/.test(q);
  const otherNat = pk ? undefined : OTHER_NATIONS.find((n) => q.includes(` ${n} `) || q.includes(` ${n}s `));
  const full = /\b(fully funded|full funded|full scholarships?|full ride|fully-funded|100 ?% scholarships?)\b/.test(q);
  const openOnly = /\b(open now|opened|currently open|still open|accepting|open for|which are open|scholarships open|closing soon|apply now|this month|upcoming)\b/.test(q);
  const kinds: string[] = [];
  if (/\b(scholarships?|grants?|funding|stipends?|bursar(y|ies))\b/.test(q)) kinds.push('sch', 'em', 'itgrant');
  if (/\b(erasmus|emjm|joint masters?)\b/.test(q)) kinds.push('em');
  if (/\b(phd|doctora\w*)\b/.test(q)) kinds.push('phd');
  if (/\bpost ?doc\w*/.test(q)) kinds.push('pd');
  if (/\bfellowships?\b/.test(q)) kinds.push('fel');
  if (/\b(internships?|traineeships?|thesis)\b/.test(q)) kinds.push('int');
  if (/\b(conferences?|summits?|summer schools?|forums?|events?)\b/.test(q)) kinds.push('conf');
  if (/\b(universit(y|ies)|colleges?)\b/.test(q) && !/\b(scholarships?|grants?)\b/.test(q)) kinds.push('uni');
  if (/\b(news|blogs?|updates?|announce\w*)\b/.test(q)) kinds.push('blog');
  if (/\b(how to|how do i|guides?|tips|steps)\b/.test(q)) kinds.push('guide');
  const tokens = norm(rest).split(' ').filter((t) => t.length > 1 && !STOP.has(t));
  return { q, tokens, country, level, pk, otherNat, full, openOnly, kinds };
}

/* ---------- fixed, reviewed answers ---------- */
function fixed(p: Parsed, ix: Index): Reply | null {
  const q = p.q;
  if (/^\s*(hi|hello|hey|salam|salaam|assalam\w*|aoa|asalam\w*|good (morning|afternoon|evening))\b/.test(q) && p.tokens.length <= 3)
    return { text: ['Hello! I can find scholarships, degrees, PhD positions, conferences, visa money requirements and guides on this website.', 'Try asking “fully funded master’s in Italy for Pakistani students” or “how much money for a German student visa?”'], chips: START_CHIPS };
  if (/\b(thanks|thank you|thx|shukriya|jazak)\b/.test(q) && p.tokens.length <= 4)
    return { text: ['You’re welcome! Ask me anything else, or talk to our team if you want personal help.'], handoff: true };
  if (/\b(guarantee|guaranteed|100 ?%|sure shot|confirm(ed)? visa|surely get)\b/.test(q))
    return { text: ['Nobody can honestly guarantee a scholarship, admission or visa — the scholarship provider, university or embassy makes every decision. Be careful with anyone who promises one.', 'What we can do is help you choose realistic options and prepare a strong, complete application.'], links: [{ label: 'How to identify scholarship scams', href: '/guides/how-to-identify-scholarship-scams/' }, { label: 'Our services', href: '/services/' }], handoff: true };
  if (/\b(fee|fees|price|prices|charges?|how much do you|cost of (your|the) service|consultancy fee|package)\b/.test(q) && !/tuition|visa|living|blocked|proof/.test(q))
    return { text: ['Our service prices are not published on the website yet. Send us your question and the service you need, and the team will reply with the price.', 'Everything on this website — search, tools and guides — is free.'], links: [{ label: 'All consultancy services', href: '/services/' }, { label: 'Contact us', href: '/contact/' }], handoff: true };
  if (/\b(contact|whatsapp|phone|call|email|talk to|speak to|human|agent|consultant|counsel+or|office|address)\b/.test(q))
    return { text: [`You can reach Destiny Global Solutions by email at ${ix.contact.email}${ix.contact.phone ? ` or phone ${ix.contact.phone}` : ''}, or on WhatsApp with the button below.`], links: [{ label: 'Contact page and inquiry form', href: '/contact/' }], handoff: true };
  if (/\b(who are you|about (you|us|destiny)|what is destiny|are you (a )?(bot|ai|human|real))\b/.test(q))
    return { text: ['I’m the website assistant of Destiny Global Solutions Limited, an independent study-abroad and visa consultancy. I search this website’s own information — I’m not a person and I don’t make decisions about applications.', 'For personal advice, talk to our team.'], links: [{ label: 'About us', href: '/about/' }, { label: 'How we verify information', href: '/scholarship-verification/' }], handoff: true };
  if (/\b(cgpa|gpa|grade conver|german grade|percentage to|division|marks to)\b/.test(q))
    return { text: ['Use our free grade converter: it converts a CGPA or percentage into the German grade (modified Bavarian formula) and other countries’ scales.'], links: [{ label: 'Grade converter and ECTS calculator', href: '/tools/grade-converter/' }] };
  if (/\b(ects|credit hours?|credits)\b/.test(q))
    return { text: ['Our ECTS calculator converts your degree’s credit hours into European ECTS credits, based on the study country’s official workload rules.'], links: [{ label: 'ECTS calculator', href: '/tools/grade-converter/' }] };
  if (/\b(eligible|eligibility|qualify|am i able|can i apply)\b/.test(q) && !p.country && !p.level)
    return { text: ['Our free eligibility checker asks eight short questions and compares your answers with the published rules of the major scholarships.'], links: [{ label: 'Scholarship eligibility checker', href: '/tools/eligibility/' }, ...(p.pk ? [{ label: 'Scholarships open to Pakistani students', href: '/scholarships/pakistan/' }] : [])] };
  if (/\buniversitaly|pre ?enrol+ment\b/.test(q))
    return { text: ['To study in Italy from outside the EU you complete pre-enrolment on Universitaly after your university accepts you; the Italian embassy then processes your study visa. Our guide explains each step.'], links: [{ label: 'Universitaly pre-enrolment guide', href: '/guides/universitaly-pre-enrolment-guide/' }, { label: 'English-taught degrees in Italy', href: '/universities/italy/' }, { label: 'Italy regional grants (DSU)', href: '/scholarships/italy-regional-grants/' }] };
  if (/\b(ielts|toefl|pte|duolingo|english test|english proficiency|moi|medium of instruction|sat|life in the uk)\b/.test(q))
    return { text: ['Requirements differ by university and scholarship — some accept a medium-of-instruction (MOI) certificate instead of IELTS. Check the programme’s official page; our eligibility checker compares your scores with each scheme’s published rule.', 'We also offer IELTS, PTE, SAT and Life in the UK test coaching.'], links: [{ label: 'Eligibility checker', href: '/tools/eligibility/' }, { label: 'Test coaching', href: '/coaching/' }] };
  if (/\b(proof of funds?|bank (statement|balance)|blocked account|sperrkonto|how much money|visa money|financial (requirement|proof)|maintenance funds?|show money|funds? (for|required|needed)|minimum balance|living costs? (for|to show))\b/.test(q) || (/\bvisa\b/.test(q) && /\b(money|funds?|balance|amount|euro|eur|pounds?|gbp|dollars?)\b/.test(q)))
    return visaMoney(p, ix);
  if (/\b(motivation letter|statement of purpose|sop|personal statement|cover letter)\b/.test(q))
    return { text: ['Here is our step-by-step guide to motivation letters and statements of purpose.'], links: [{ label: 'How to write a motivation letter', href: '/guides/how-to-write-a-motivation-letter/' }, { label: 'How to prepare a scholarship CV', href: '/guides/how-to-prepare-a-scholarship-cv/' }] };
  if (/\b(recommendation|reference letter|lor)\b/.test(q))
    return { text: ['This guide explains whom to ask, when, and what to send your referees.'], links: [{ label: 'How to request recommendation letters', href: '/guides/how-to-request-recommendation-letters/' }] };
  if (/\b(scam|fake|fraud|legit|genuine)\b/.test(q))
    return { text: ['Real scholarships never ask you to pay to apply or to “secure” a place. Our guides show the warning signs.'], links: [{ label: 'How to identify scholarship scams', href: '/guides/how-to-identify-scholarship-scams/' }, { label: 'How to spot fake conferences', href: '/guides/how-to-spot-fake-conferences/' }] };
  if (/\b(save|saved|bookmark|shortlist)\b/.test(q))
    return { text: ['Tap the bookmark on any listing to save it. Your saved list stays only in this browser on this device.'], links: [{ label: 'Your saved list', href: '/saved/' }] };
  return null;
}

function visaMoney(p: Parsed, ix: Index): Reply {
  const f = p.country ? ix.funds.find((x) => x.c === p.country) : undefined;
  if (!f) return {
    text: [p.country ? `I don’t have an official proof-of-funds figure for ${ix.dest[p.country] ?? 'that country'} on this website yet.` : 'Tell me the country — for example “visa money Germany” — or open the calculator. It covers 35 countries with the official figures.'],
    links: [{ label: 'Visa money calculator', href: `/tools/visa-money/${p.country ? `?c=${p.country}` : ''}` }],
  };
  const per = f.unit === 'month' ? ' per month' : f.unit === 'year' ? ' per year' : '';
  const amount = f.a != null ? `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(f.a)} ${f.cur}${per}` : null;
  return {
    text: [
      amount ? `${f.n}: ${amount}. ${f.sum}` : `${f.n}: ${f.sum}`,
      f.lvl === 'official' ? `Taken from the official source (checked ${fmtDate(f.chk)}).` : `Partly confirmed (checked ${fmtDate(f.chk)}) — check the official page before you apply.`,
    ],
    links: [{ label: `Calculate for ${f.n}`, href: `/tools/visa-money/?c=${f.c}` }, ...(f.src ? [{ label: 'Official source', href: f.src }] : [])],
  };
}

/* ---------- search ---------- */
// English and local names of university cities and words, so "TU Munich" finds "Technische Universität München".
const SYN: Record<string, string[]> = {
  munich: ['munchen'], cologne: ['koln'], vienna: ['wien'], prague: ['praha'], warsaw: ['warszawa'], krakow: ['krakow', 'cracow'], milano: ['milan'],
  rome: ['roma'], florence: ['firenze'], turin: ['torino'], naples: ['napoli'], venice: ['venezia'], padua: ['padova'], genoa: ['genova'],
  lisbon: ['lisboa'], copenhagen: ['kobenhavn'], gothenburg: ['goteborg'], zurich: ['zurich'], geneva: ['geneve'], brussels: ['bruxelles', 'brussel'],
  tu: ['technische'], tum: ['technische'], uni: ['universita', 'university', 'universitat', 'universite', 'universidad'], polimi: ['politecnico'],
};
const EUROPE = new Set(['austria', 'belgium', 'croatia', 'czech-republic', 'denmark', 'estonia', 'finland', 'france', 'germany', 'hungary', 'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg', 'malta', 'netherlands', 'norway', 'poland', 'portugal', 'spain', 'sweden', 'switzerland']);
const BASE_KIND: Record<string, number> = { sch: 6, em: 2, itgrant: 2, phd: 3, pd: 3, fel: 3, int: 2, conf: 2, guide: 2, blog: 2, tool: 3, country: 3, svc: 2, uni: 0 };

function score(d: Doc, p: Parsed): number {
  const title = norm(d.t), body = norm(`${d.s ?? ''} ${d.w ?? ''}`);
  let s = 0, hit = 0;
  for (const t of p.tokens) {
    const res = [t, ...(SYN[t] ?? [])].map((w) => { const e = w.replace(/[-+]/g, '\\$&'); return new RegExp(w.length < 4 ? `(^| )${e}( |$)` : `(^| )${e}`); });
    if (res.some((re) => re.test(title))) { s += 6; hit++; } else if (res.some((re) => re.test(body))) { s += 2; hit++; }
  }
  const need = p.tokens.length <= 2 ? p.tokens.length : Math.ceil(p.tokens.length * 0.6);
  if (hit < need) return 0; // short questions must match every word, longer ones most words
  const phrase = p.tokens.join(' ');
  if (phrase.length > 5 && title.includes(phrase)) s += 12;
  return s;
}

export function answer(raw: string, ix: Index, ctx: Ctx, unisLoaded = false): Answer {
  let p = parse(raw, ix);
  // Follow-ups like "and Germany?" or "what about PhD?" keep the earlier filters.
  const short = p.tokens.length <= 3 && (p.country || p.level) && /^\s*(and|what about|how about|in|for|also|same for|ok and)\b/.test(p.q);
  if (short && ctx.last) {
    p = { ...p, country: p.country ?? ctx.country, level: p.level ?? ctx.level, pk: p.pk || !!ctx.pk, full: p.full || !!ctx.full, kinds: p.kinds.length ? p.kinds : ctx.kinds ?? [], openOnly: p.openOnly || !!ctx.openOnly };
  }
  const nctx: Ctx = { country: p.country, level: p.level, pk: p.pk, full: p.full, kinds: p.kinds, openOnly: p.openOnly, last: raw };

  const f = fixed(p, ix);
  if (f) return { reply: f, ctx: nctx };

  const hasFilter = !!(p.country || p.level || p.pk || p.full || p.kinds.length || p.openOnly);
  if (!p.tokens.length && !hasFilter) return { reply: { text: ['Could you tell me a bit more? For example: a country, a degree level, or a scholarship name.'], chips: START_CHIPS }, ctx: nctx };

  // Words already turned into filters should not also be required as text matches.
  const filterWords = /^(burslari|bursu|erasmus|mundus|joint|emjm|indians?|bangladeshi|bangladesh|nepali|nepal|nigerians?|nigeria|lankan|sri|lanka|egyptians?|afghans?|iranians?|kenyans?|ghanaians?|indonesians?|filipinos?|vietnamese|scholarships?|grants?|funding|funded|fully|full|masters?|ms|msc|bachelors?|bs|bsc|phd|doctoral|doctorate|postdocs?|fellowships?|internships?|conferences?|summits?|universit\w*|pakistan\w*|hec|open|now|currently|deadlines?|study|studying|abroad|students?|international|programmes?|programs?|degrees?|courses?|news|blog|guides?|apply|application|2026|2027|2028)$/;
  const textTokens = p.tokens.filter((t) => !filterWords.test(t) && !(p.country && norm(ix.dest[p.country] ?? '').split(' ').includes(t)));
  const pq: Parsed = { ...p, tokens: textTokens };

  const kinds = p.kinds.length ? new Set(p.kinds) : null;
  const scored = ix.docs.map((d) => {
    if (kinds && !kinds.has(d.k)) return null;
    if (!kinds && d.k === 'uni' && !textTokens.length) return null;
    if (p.country) {
      const inC = d.c?.includes(p.country) || (d.c?.includes('europe') && EUROPE.has(p.country) && d.k !== 'country');
      if (!inC) return null;
    }
    if (p.level && d.l && !d.l.includes(p.level)) return null;
    if (p.level && !d.l && ['sch', 'phd', 'pd', 'fel', 'int', 'conf', 'em', 'itgrant'].includes(d.k)) return null;
    if (p.full && d.f && d.f !== 'fully-funded') return null;
    if (p.pk && d.k === 'sch' && !d.pk) return null;
    const st = status(d.d);
    if (p.openOnly && st && ['closed', 'unconfirmed'].includes(st.key)) return null;
    const txt = textTokens.length ? score(d, pq) : 0;
    if (textTokens.length && txt === 0) return null;
    let s = txt + (BASE_KIND[d.k] ?? 1);
    if (st) s += ({ open: 4, 'closing-soon': 5, upcoming: 3, varies: 1, unconfirmed: 0, closed: -2 } as Record<string, number>)[st.key] ?? 0;
    if (p.country && d.c?.includes(p.country)) s += 3;
    if (d.k === 'country' && p.country && d.c?.[0] === p.country) s += p.tokens.length <= 2 ? 6 : 1;
    if (p.pk && d.pk) s += 2;
    return { d, s, st };
  }).filter(Boolean) as { d: Doc; s: number; st: ReturnType<typeof status> }[];
  scored.sort((a, b) => b.s - a.s || a.d.t.localeCompare(b.d.t));
  const top = scored.slice(0, 6);

  const cName = p.country ? ix.dest[p.country] ?? p.country : '';
  const lvlName = p.level ? ({ bachelor: 'bachelor’s', master: 'master’s', phd: 'PhD', postdoc: 'postdoctoral', other: '' } as const)[p.level] : '';
  const kindWord = kinds?.has('phd') && !kinds.has('sch') ? 'PhD positions' : '';
  const what = [p.full ? 'fully funded' : '', kindWord && p.level === 'phd' ? '' : lvlName, kinds?.has('phd') && !kinds.has('sch') ? 'PhD positions' : kinds?.has('conf') ? 'conferences and summits' : kinds?.has('fel') ? 'fellowships' : kinds?.has('int') ? 'internships' : kinds?.has('uni') ? 'universities' : kinds?.has('blog') ? 'news posts' : kinds?.has('guide') ? 'guides' : kinds?.has('sch') ? 'scholarships' : kinds?.has('em') ? 'Erasmus Mundus programmes' : 'opportunities'].filter(Boolean).join(' ');
  const where = [cName ? `in ${cName}` : '', p.pk ? 'open to Pakistani students' : ''].filter(Boolean).join(' ');

  const links: Link[] = [];
  if (p.pk) links.push({ label: 'All scholarships for Pakistani students', href: '/scholarships/pakistan/' });
  if ((!kinds && !textTokens.length) || kinds?.has('sch')) {
    const sp = new URLSearchParams();
    if (p.country && p.country !== 'europe') sp.set('country', p.country);
    if (p.level && p.level !== 'postdoc' && p.level !== 'other') sp.set('degree', p.level === 'master' ? 'masters' : p.level === 'bachelor' ? 'bachelors' : 'phd');
    if (p.full) sp.set('funding', 'fully-funded');
    links.push({ label: 'Filter all scholarships', href: `/scholarships/${sp.toString() ? `?${sp}` : ''}` });
  }
  if (p.level === 'master' && (!p.country || EUROPE.has(p.country) || p.country === 'europe')) links.push({ label: 'Erasmus Mundus catalogue', href: '/scholarships/erasmus-mundus/' });
  if (p.country && p.country !== 'europe' && ix.dest[p.country]) links.push({ label: `Study in ${cName}`, href: `/countries/${p.country}/` });
  const fp = new URLSearchParams();
  if (textTokens.length) fp.set('q', textTokens.join(' '));
  if (p.level && ['bachelor', 'master', 'phd'].includes(p.level)) fp.set('level', p.level);
  if (p.country) fp.set('dest', p.country);
  links.push({ label: 'Search degree courses', href: `/find/${fp.toString() ? `?${fp}` : ''}` });

  const wantsUnis = !unisLoaded && (kinds?.has('uni') || (textTokens.length > 0 && !kinds));
  if (wantsUnis) return { reply: { text: [] }, ctx, needUnis: true };

  if (!top.length) {
    return {
      reply: {
        text: [`I couldn’t find ${what} ${where}`.replace(/\s+/g, ' ').trim() + ' on this website.', p.otherNat ? `Eligibility depends on nationality — check each scholarship’s rules for ${p.otherNat.replace(/s$/, '')} applicants with the eligibility checker.` : 'Try fewer words, another country, or the full search.'],
        links: [...links.slice(0, 3), { label: 'Eligibility checker', href: '/tools/eligibility/' }],
        handoff: true,
      },
      ctx: nctx,
    };
  }

  const intro = hasFilter
    ? `Here ${top.length === 1 ? 'is what I found' : `are ${top.length === 6 ? 'the best matches' : 'the matches'}`} for ${what} ${where}`.replace(/\s+/g, ' ').trim() + ':'
    : 'Here is what I found on the website:';
  const text = [intro];
  if (!kinds && textTokens.length && (p.level === 'bachelor' || p.level === 'master')) text.push('For degree courses in this subject, open “Search degree courses” below — it lists thousands of programmes.');
  if (p.otherNat) text.push(`Note: most listings here were checked for Pakistani applicants. For ${p.otherNat.replace(/s$/, '')} nationals, open each listing’s eligibility section or use the eligibility checker.`);
  const items: Item[] = top.map(({ d, st }) => ({ title: d.t, href: d.u, kind: kindLabel(d.k), badge: st?.badge, tone: st?.tone, note: st && ['unconfirmed', 'closed'].includes(st.key) && d.d?.n ? d.d.n : d.s }));
  if (top.some((x) => x.st)) text.push('Dates are copied from the official sources we checked — always confirm on the official website before applying.');
  return { reply: { text, items, links: links.slice(0, 4), handoff: true }, ctx: nctx };
}

export const START_CHIPS = [
  'Fully funded master’s for Pakistani students',
  'Scholarships open now',
  'Study in Italy',
  'Visa money for Germany',
  'Funded PhD positions',
  'Convert my CGPA',
];
