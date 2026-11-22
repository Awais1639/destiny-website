import type { APIRoute } from 'astro';
import { posts, romeIso } from '../../lib/blog';
import { site as cfg } from '../../config/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://destinyglobals.com')).href.replace(/\/$/, '');
  const items = posts.slice(0, 50).map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${base}${p.href}</link>
      <guid isPermaLink="true">${base}${p.href}</guid>
      <pubDate>${new Date(romeIso(p.date)).toUTCString()}</pubDate>
      <category>${esc(p.cat.label)}</category>
      <description>${esc(p.description)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Destiny Global Blog</title>
    <link>${base}/blog/</link>
    <atom:link href="${base}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Source-checked news on scholarships, master’s and PhD funding, conferences and study visa rules from ${esc(cfg.companyName)}.</description>
    <language>en</language>
    ${posts[0] ? `<lastBuildDate>${new Date(romeIso(posts[0].date)).toUTCString()}</lastBuildDate>` : ''}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
