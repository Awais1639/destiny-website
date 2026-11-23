/** Polite reading of a university's own website: robots.txt, a few pages, text and links. */
import { isOfficial, type Uni } from './match';

export const UA = 'DestinyGlobalAssistant/1.0 (+https://destinyglobals.com/assistant-bot/)';
const MAX_BYTES = 700_000;

export interface Page { url: string; title: string; text: string; links: { href: string; text: string }[] }

/* ---------- robots.txt ---------- */
const robotsCache = new Map<string, { allow: string[]; disallow: string[] }>();
export async function robotsAllows(url: string, fetcher: typeof fetch): Promise<boolean> {
  const u = new URL(url);
  let rules = robotsCache.get(u.origin);
  if (!rules) {
    rules = { allow: [], disallow: [] };
    try {
      const r = await fetcher(`${u.origin}/robots.txt`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const txt = (await r.text()).slice(0, 60_000);
        let mine = false, star = false, seenOurs = false;
        const ours = { allow: [] as string[], disallow: [] as string[] }, any = { allow: [] as string[], disallow: [] as string[] };
        for (const raw of txt.split(/\r?\n/)) {
          const line = raw.replace(/#.*/, '').trim();
          const m = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
          if (!m) continue;
          const k = m[1].toLowerCase(), v = m[2].trim();
          if (k === 'user-agent') { const a = v.toLowerCase(); mine = a.includes('destinyglobalassistant'); star = a === '*'; if (mine) seenOurs = true; continue; }
          const target = mine ? ours : star ? any : null;
          if (target && v) (k === 'allow' ? target.allow : target.disallow).push(v);
        }
        rules = seenOurs ? ours : any;
      }
    } catch { /* no robots.txt reachable: treat as allowed */ }
    robotsCache.set(u.origin, rules);
  }
  const path = u.pathname + u.search;
  const match = (p: string) => { const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')); return re.test(path); };
  const dis = rules.disallow.filter(match).sort((a, b) => b.length - a.length)[0];
  const al = rules.allow.filter(match).sort((a, b) => b.length - a.length)[0];
  return !dis || (!!al && al.length >= dis.length);
}

/* ---------- fetching and extracting ---------- */
export async function readPage(url: string, uni: Uni, fetcher: typeof fetch, trace: string[] = []): Promise<Page | null> {
  if (!isOfficial(uni, url)) { trace.push(`not official: ${url}`); return null; }
  if (!(await robotsAllows(url, fetcher))) { trace.push(`robots.txt disallows: ${url}`); return null; }
  let res: Response;
  try { res = await fetcher(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en' }, redirect: 'follow', signal: AbortSignal.timeout(7000) }); }
  catch (e) { trace.push(`fetch failed: ${url} (${String((e as Error)?.message ?? e).slice(0, 80)})`); return null; }
  if (!res.ok) { trace.push(`HTTP ${res.status}: ${url}`); return null; }
  if (!isOfficial(uni, res.url || url)) { trace.push(`redirected off-site: ${url} -> ${res.url}`); return null; }
  if (!(res.headers.get('content-type') ?? '').includes('html')) { trace.push(`not HTML: ${url}`); return null; }

  const page: Page = { url: res.url || url, title: '', text: '', links: [] };
  const parts: string[] = [];
  let skip = 0, inTitle = false, linkHref: string | null = null, linkText = '', size = 0;
  const rw = new HTMLRewriter()
    .on('script, style, noscript, svg, iframe, template, nav, footer', { element(e) { skip++; e.onEndTag(() => { skip--; }); } })
    .on('title', { element(e) { inTitle = true; e.onEndTag(() => { inTitle = false; }); } })
    .on('a[href]', {
      element(e) {
        const href = e.getAttribute('href') ?? '';
        linkHref = href; linkText = '';
        e.onEndTag(() => {
          if (linkHref && page.links.length < 1500) { try { page.links.push({ href: new URL(linkHref, page.url).href.split('#')[0], text: linkText.trim().slice(0, 120) }); } catch { /* bad URL */ } }
          linkHref = null;
        });
      },
    })
    .on('h1, h2, h3, h4, p, li, td, th, dt, dd', { element(e) { if (!skip) parts.push('\n'); e.onEndTag(() => { if (!skip) parts.push('\n'); }); } })
    .onDocument({
      text(t) {
        if (inTitle) { page.title += t.text; return; }
        if (linkHref !== null) linkText += t.text;
        if (skip || size > 60_000) return;
        size += t.text.length; parts.push(t.text);
      },
    });
  // Read at most MAX_BYTES of the page.
  const reader = res.body?.getReader();
  if (!reader) return null;
  let got = 0;
  const stream = new ReadableStream({
    async pull(ctrl) {
      const { value, done } = await reader.read();
      if (done || got > MAX_BYTES) { ctrl.close(); reader.cancel().catch(() => {}); return; }
      got += value.byteLength; ctrl.enqueue(value);
    },
  });
  await rw.transform(new Response(stream, { headers: { 'content-type': 'text/html' } })).arrayBuffer();
  trace.push(`read: ${page.url} (${got} bytes, ${page.links.length} links)`);
  page.title = decode(page.title).replace(/\s+/g, ' ').trim().slice(0, 160);
  page.text = decode(parts.join('')).replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();
  return page;
}

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

/* ---------- what the question is about ---------- */
export interface Topic { key: string; words: RegExp }
export const TOPICS: Topic[] = [
  { key: 'fees', words: /tuition|fees?|cost|price|payment|contribution|studiengeb|tasse|matricula|scholarship|financial|funding/i },
  { key: 'english', words: /english|language|ielts|toefl|pte|duolingo|cambridge|proficiency|cefr|b2|c1/i },
  { key: 'admission', words: /admission|entry|requirement|eligib|apply|application|how to apply|deadline|dates?|intake|enrol|enroll|document|transcript|gpa|grade|qualification/i },
  { key: 'international', words: /international|foreign|overseas|non-eu|visa|residence|permit|immigration|arriv/i },
  { key: 'programmes', words: /programmes?|programs?|courses?|degrees?|study|studies|master|bachelor|phd|doctora|msc|bsc|mba|catalog|offer/i },
];
export function topicsOf(q: string): Topic[] {
  const t = TOPICS.filter((x) => x.words.test(q));
  return t.length ? t : TOPICS.filter((x) => ['admission', 'fees', 'english'].includes(x.key));
}

const STOP = new Set('the a an of for in at to and or is are what how much does do can i my me about with on from by be this that university universita universitat'.split(' '));
export const keyWords = (q: string) => q.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Score a link for how likely it leads to the answer. */
export function linkScore(l: { href: string; text: string }, topics: Topic[], words: string[]): number {
  const t = `${l.text} ${decodeURIComponent(l.href).replace(/[-_/.?=&]/g, ' ')}`.toLowerCase();
  let s = 0;
  for (const tp of topics) if (tp.words.test(t)) s += 3;
  for (const w of words) if (t.includes(w)) s += 2;
  if (/international|foreign|non-eu/.test(t)) s += 2;
  if (/tuition|fees|english-language|language-requirements|entry-requirements|how-to-apply|application-deadline/.test(t)) s += 3;
  if (/\b(en|english)\b|\/en\//.test(l.href.toLowerCase())) s += 1;
  if (/news|event|blog|press|login|staff|intranet|calendar|alumni|job|career|research-group|\.(pdf|jpg|png|zip|docx?)$/i.test(l.href)) s -= 4;
  return s;
}

/** Pick the most relevant paragraphs of a page, up to `max` characters. */
export function excerpt(text: string, topics: Topic[], words: string[], max = 5000): string {
  const paras = text.split('\n').filter((p) => p.length > 25);
  const scored = paras.map((p, i) => {
    const l = p.toLowerCase();
    let s = 0;
    for (const tp of topics) if (tp.words.test(l)) s += 2;
    for (const w of words) if (l.includes(w)) s += 1;
    if (/\d/.test(p) && /€|eur|\$|usd|£|gbp|chf|sek|nok|dkk|pln|huf|czk|ielts|toefl|cefr|deadline|\b20\d\d\b/i.test(p)) s += 3;
    return { p, i, s };
  });
  const keep = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  let out: typeof keep = [], len = 0;
  for (const x of keep) { if (len + x.p.length > max) continue; out.push(x); len += x.p.length; }
  if (!out.length) return text.slice(0, Math.min(max, 1500));
  return out.sort((a, b) => a.i - b.i).map((x) => x.p).join('\n');
}

/* ---------- sitemaps ---------- */
/** URLs from the university's sitemap(s): robots.txt "Sitemap:" lines or /sitemap.xml. At most a few files, a few thousand URLs. */
export async function readSitemaps(base: string, uni: Uni, fetcher: typeof fetch, trace: string[] = []): Promise<string[]> {
  const origin = new URL(base).origin;
  const list: string[] = [];
  const get = async (u: string): Promise<string> => {
    if (!isOfficial(uni, u)) return '';
    try {
      const r = await fetcher(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
      if (!r.ok) return '';
      return (await r.text()).slice(0, 3_000_000);
    } catch { return ''; }
  };
  let roots: string[] = [];
  try {
    const rb = await fetcher(`${origin}/robots.txt`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) });
    if (rb.ok) roots = [...(await rb.text()).matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]).filter((u) => isOfficial(uni, u));
  } catch { /* ignore */ }
  if (!roots.length) roots = [`${origin}/sitemap.xml`];
  let files = 0;
  const queue = roots.slice(0, 3);
  while (queue.length && files < 4 && list.length < 8000) {
    const u = queue.shift()!;
    const xml = await get(u); files++;
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
    if (/<sitemapindex/i.test(xml)) {
      // Prefer English / page sitemaps over news, events, people.
      const pick = locs.filter((x) => !/news|event|people|person|staff|image|video|blog|tag|author/i.test(x)).sort((a, b) => Number(/\ben\b|english|page/i.test(b)) - Number(/\ben\b|english|page/i.test(a)));
      queue.push(...pick.slice(0, 3));
    } else list.push(...locs.filter((x) => isOfficial(uni, x)));
  }
  trace.push(`sitemap: ${list.length} urls from ${files} file(s)`);
  return list.slice(0, 8000);
}
