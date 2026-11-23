/**
 * Destiny live university lookup ("Check live on the official website").
 *
 * POST /ask  { q: string, site?: string }
 *  1. Works out which university is meant (bundled list of ~12,000 official websites; nothing else is ever fetched).
 *  2. Reads up to a few pages of that university's own website (robots.txt respected).
 *  3. A free Workers AI model answers ONLY from those pages and cites them; if the pages don't say, it says so.
 * Answers are cached for a few days to stay within the free daily AI allowance.
 */
import { findUniversity, isOfficial, type Uni } from './match';
import { readPage, readSitemaps, topicsOf, keyWords, linkScore, excerpt, type Page } from './read';

export interface Env {
  AI: { run: (model: string, input: unknown) => Promise<any> };
  CACHE?: KVNamespace;
  LIMIT?: { limit: (o: { key: string }) => Promise<{ success: boolean }> };
  ALLOWED_ORIGINS: string; // comma-separated
  MODELS?: string; // comma-separated, tried in order
  TAVILY_API_KEY?: string; // optional: free web search to find the right page faster
  MOCK_AI?: string; // tests only
  TEST_FETCH_BASE?: string; // tests only: send every fetch to this local server
}

const DEFAULT_MODELS = '@cf/meta/llama-3.3-70b-instruct-fp8-fast,@cf/qwen/qwen3-30b-a3b-fp8,@cf/meta/llama-3.1-8b-instruct-fp8';
const CACHE_TTL = 3 * 24 * 3600;
const MAX_PAGES = 4; // pages given to the AI

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    const cors: Record<string, string> = allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    if (url.pathname === '/health') return json({ ok: true }, 200, cors);
    if (url.pathname !== '/ask' || req.method !== 'POST') return json({ error: 'not_found' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403);

    let body: { q?: unknown; site?: unknown; debug?: unknown };
    try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400, cors); }
    const q = typeof body.q === 'string' ? body.q.trim().slice(0, 300) : '';
    const site = typeof body.site === 'string' ? body.site.slice(0, 200) : undefined;
    if (q.length < 3) return json({ error: 'empty_question' }, 400, cors);

    if (env.LIMIT) {
      const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { success } = await env.LIMIT.limit({ key: ip });
      if (!success) return json({ status: 'busy', message: 'Too many questions in a short time. Please wait a minute and try again.' }, 429, cors);
    }

    const match = findUniversity(q, site);
    if (!match.best || match.score < 1) {
      return json({ status: 'which_university', message: match.best ? 'Which university do you mean?' : 'I couldn’t tell which university you mean. Please write its full name.', options: [match.best, ...match.alternatives].filter(Boolean).slice(0, 4).map((u) => ({ name: u!.n, country: u!.c, site: `https://${u!.h[0]}/` })) }, 200, cors);
    }
    const uni = match.best;

    const key = `v4:${uni.h[0]}:${await sha(keyWords(q).sort().join(' '))}`;
    if (env.CACHE) {
      const hit = await env.CACHE.get(key, 'json');
      if (hit) return json({ ...(hit as object), cached: true }, 200, cors);
    }

    const fetcher: typeof fetch = env.TEST_FETCH_BASE
      ? ((input: RequestInfo | URL, init?: RequestInit) => { const u = new URL(String(input)); return fetch(`${env.TEST_FETCH_BASE}/${u.hostname}${u.pathname}${u.search}`, init).then((r) => { Object.defineProperty(r, 'url', { value: String(input) }); return r; }); }) as typeof fetch
      : fetch;

    const trace: string[] = [];
    const pages = await gather(uni, q, env, fetcher, trace);
    const home = `https://${uni.h[0]}/`;
    if (!pages.length) {
      return json({ status: 'no_pages', university: { name: uni.n, country: uni.c, site: home }, message: `I couldn’t read ${uni.n}’s website automatically (it may block automated reading). Please open the official website.`, sources: [{ title: `${uni.n} — official website`, url: home }], ...(body.debug === true ? { trace } : {}) }, 200, cors);
    }

    const result = await askAI(uni, q, pages, env);
    const out = {
      status: result.ok ? 'ok' : result.quota ? 'quota' : 'error',
      university: { name: uni.n, country: uni.c, site: home },
      answer: result.answer,
      found: result.found,
      sources: (result.used.length ? result.used : pages.map((_, i) => i)).map((i) => ({ title: pages[i].title || pages[i].url, url: pages[i].url })),
      checked: new Date().toISOString().slice(0, 10),
      ...(body.debug === true ? { trace, model: result.model } : {}),
      ...(result.quota ? { message: 'The live check has reached today’s free limit. Please open the official pages below, or try again tomorrow.' } : {}),
    };
    if (result.ok && env.CACHE) ctx.waitUntil(env.CACHE.put(key, JSON.stringify(out), { expirationTtl: CACHE_TTL }));
    return json(out, 200, cors);
  },
};

async function sha(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Find and read the most relevant pages on the university's own website. */
async function gather(uni: Uni, q: string, env: Env, fetcher: typeof fetch, trace: string[] = []): Promise<Page[]> {
  const read = async (u: string) => { const r = await readPage(u, uni, fetcher, trace); return r; };
  const topics = topicsOf(q);
  const words = keyWords(q).filter((w) => !uni.n.toLowerCase().includes(w));
  const seen = new Set<string>();
  const pages: Page[] = [];
  const candidates = new Map<string, number>();
  const consider = (p: Page) => {
    for (const l of p.links) {
      if (!isOfficial(uni, l.href) || seen.has(l.href) || !/^https?:/.test(l.href)) continue;
      const s = linkScore(l, topics, words);
      if (s > 2) candidates.set(l.href, Math.max(candidates.get(l.href) ?? 0, s));
    }
  };

  // Optional: a free web-search key finds the exact page directly.
  if (env.TAVILY_API_KEY) {
    try {
      const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TAVILY_API_KEY}` }, body: JSON.stringify({ query: q, include_domains: uni.h, max_results: 5, search_depth: 'basic' }), signal: AbortSignal.timeout(6000) });
      if (r.ok) for (const x of ((await r.json()) as any).results ?? []) if (isOfficial(uni, x.url)) candidates.set(x.url, 20 - candidates.size);
    } catch { /* search is optional */ }
  }

  // The home page and a few common English entry points.
  for (const start of [`https://${uni.h[0]}/`, `https://www.${uni.h[0]}/`, `https://www.${uni.h[0]}/en/`]) {
    if (pages.length) break;
    seen.add(start);
    const p = await read(start);
    if (p) { consider(p); if (topics.some((t) => t.words.test(p.text.slice(0, 3000)))) pages.push(p); }
  }

  // The university's sitemap lists its pages: URLs such as /tuition-fees or /admissions/english are strong hints.
  for (const u of await readSitemaps(`https://www.${uni.h[0]}/`, uni, fetcher, trace)) {
    if (seen.has(u)) continue;
    const sc = linkScore({ href: u, text: '' }, topics, words) + 2;
    if (sc > 6) candidates.set(u, Math.max(candidates.get(u) ?? 0, sc));
  }

  // Three rounds: follow the best links, then the best links found on those pages.
  for (let round = 0; round < 3 && pages.length < MAX_PAGES + 2; round++) {
    const next = [...candidates.entries()].filter(([u]) => !seen.has(u)).sort((a, b) => b[1] - a[1]).slice(0, round === 0 ? 3 : 2);
    if (!next.length) break;
    const got = await Promise.all(next.map(([u]) => { seen.add(u); return read(u); }));
    for (const p of got) if (p) { consider(p); pages.push(p); }
  }
  // Keep the pages most related to the question.
  const rank = (p: Page) => { const ex = excerpt(p.text, topics, words, 3000); const nums = (ex.match(/€|eur\b|\$|£|chf|sek|nok|dkk|ielts|toefl|deadline|\b20\d\d\b/gi) ?? []).length; return Math.min(ex.length, 3000) / 100 + nums * 3 + (topics.some((t) => t.words.test(p.title)) ? 15 : 0) + linkScore({ href: p.url, text: p.title }, topics, words); };
  const uniq = [...new Map(pages.map((p) => [p.url, p])).values()];
  return uniq.sort((a, b) => rank(b) - rank(a)).slice(0, MAX_PAGES);
}

interface AIResult { ok: boolean; quota?: boolean; answer: string; found: boolean; used: number[]; model?: string }

async function askAI(uni: Uni, q: string, pages: Page[], env: Env): Promise<AIResult> {
  const topics = topicsOf(q);
  const words = keyWords(q);
  const context = pages.map((p, i) => `[${i + 1}] ${p.title}\nURL: ${p.url}\n${excerpt(p.text, topics, words, Math.floor(14000 / pages.length))}`).join('\n\n---\n\n');
  const system = [
    `You answer questions from prospective international students about ${uni.n} (${uni.c}).`,
    'Use ONLY the numbered page excerpts provided. They come from the university’s official website.',
    'Never use outside knowledge and never guess. If the excerpts do not contain the answer, write: "The pages I checked don\'t state <what was asked>." Never claim that something does not exist, is free, or is not required unless a page says so explicitly.',
    'Ignore navigation text, news, events and cookie notices. Prefer information for international / non-EU students when the question is about them.',
    'Copy figures (fees, scores, dates) exactly as written, with currency and the academic year if shown. Say which group a fee applies to (e.g. EU / non-EU) when stated.',
    'Write a short, plain answer in English (max 120 words). Use "- " bullet lines for lists. Put the page number in square brackets after each fact, e.g. [2].',
    'Reply as JSON: {"answer": "...", "found": true|false, "sources": [page numbers used]}',
  ].join('\n');
  const user = `Question: ${q}\n\nPage excerpts:\n\n${context}`;

  if (env.MOCK_AI) return { ok: true, answer: user.slice(0, 1500), found: true, used: [0] }; // local tests only: shows what the model would read

  for (const model of (env.MODELS || DEFAULT_MODELS).split(',').map((m) => m.trim()).filter(Boolean)) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: 'system', content: system }, { role: 'user', content: (model.includes('qwen3') ? '/no_think\n' : '') + user }], max_tokens: 500, temperature: 0.1 });
      const out = r?.response ?? r?.choices?.[0]?.message?.content ?? r?.result?.response ?? '';
      // Some models already return parsed JSON; others return text that contains JSON.
      const raw = typeof out === 'string' ? out.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : JSON.stringify(out);
      const parsed = typeof out === 'object' && out ? out : parseJson(raw);
      const answer = (typeof parsed?.answer === 'string' ? parsed.answer : typeof out === 'string' ? raw : '').trim();
      if (!answer) continue;
      const used = Array.isArray(parsed?.sources) ? parsed.sources.map((n: unknown) => Number(n) - 1).filter((n: number) => Number.isInteger(n) && n >= 0 && n < pages.length) : [];
      const found = parsed?.found !== false && !/do not (state|contain|mention)|does not (state|contain|mention)|not (stated|found|mentioned)/i.test(answer);
      return { ok: true, answer: answer.slice(0, 1500), found, used: [...new Set<number>(used)], model };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/4006|daily free allocation|neurons/i.test(msg)) return { ok: false, quota: true, answer: '', found: false, used: [] };
      // 5035 = model needs a paid plan; other errors: try the next model.
    }
  }
  return { ok: false, answer: '', found: false, used: [] };
}

function parseJson(s: string): { answer?: string; found?: boolean; sources?: unknown[] } | null {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
