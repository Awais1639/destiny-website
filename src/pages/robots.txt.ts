import type { APIRoute } from 'astro';

// Search engines and AI assistants are welcome: the content is public information meant to be found.
// Only the personal "Saved" page is kept out of search results.
const aiAndSearchBots = [
  'Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Baiduspider', 'Applebot', 'Applebot-Extended',
  'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot', 'cohere-ai', 'MistralAI-User', 'YouBot',
];

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, site).href;
  const rules = `Allow: /\nDisallow: ${base}/saved/\n`;
  const body = [
    `# ${new URL(site!).host} — public scholarship and study-abroad information`,
    `# Summary for AI assistants: ${new URL(`${base}/llms.txt`, site).href}`,
    '',
    `User-agent: *\n${rules}`,
    ...aiAndSearchBots.map((b) => `User-agent: ${b}\n${rules}`),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
