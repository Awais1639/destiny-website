// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync } from 'node:fs';

// "Last modified" dates for the sitemap, taken from each record's last-checked date (helps search engines re-crawl updated pages).
const readJson = (f) => { try { return JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')); } catch { return null; } };
const lastmod = new Map();
for (const s of readJson('./src/data/scholarships.json') ?? []) if (s.verification?.lastChecked) lastmod.set(`/scholarships/${s.slug}/`, s.verification.lastChecked);
for (const [file, prefix] of [['conferences', 'conferences'], ['fellowships', 'fellowships'], ['phd', 'phd'], ['postdoc', 'postdoc'], ['internships', 'internships']]) {
  for (const p of readJson(`./src/data/${file}.json`)?.programmes ?? []) {
    const d = p.verification?.lastChecked ?? p.lastChecked;
    if (d) lastmod.set(`/${prefix}/${p.slug}/`, d);
  }
}

// Blog posts: lastmod = "updated" (or "date") from each post's front matter.
try {
  for (const f of readdirSync(new URL('./src/blog/', import.meta.url))) {
    if (!f.endsWith('.md')) continue;
    const fm = readFileSync(new URL(`./src/blog/${f}`, import.meta.url), 'utf8').split('---')[1] ?? '';
    const d = (fm.match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m) ?? fm.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m))?.[1];
    if (d) lastmod.set(`/blog/${f.replace(/\.md$/, '')}/`, d);
  }
} catch {}

/**
 * SITE_URL  – the public address of the website (used for canonical URLs, sitemap, social cards).
 * SITE_BASE – only needed when hosting in a sub-folder, e.g. GitHub Pages without a custom domain
 *             (https://username.github.io/repo-name/  ->  SITE_BASE=/repo-name).
 * Both can be set as environment variables on the hosting platform; the defaults below work for
 * a custom domain such as https://destinyglobals.com.
 */
const site = process.env.SITE_URL || 'https://destinyglobals.com';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // keep thin/utility pages out of the sitemap
      serialize: (item) => {
        const d = lastmod.get(new URL(item.url).pathname);
        return d ? { ...item, lastmod: new Date(`${d}T00:00:00Z`).toISOString() } : item;
      },
      filter: (page) => !/\/(saved|assistance|404)\/?$/.test(page) && !new RegExp(`^${base.replace(/\/$/, '')}/(programs|erasmus-mundus)(/|$)`).test(new URL(page).pathname),
    }),
  ],
  // Old addresses keep working after the Scholarships section was reorganised (Nov 2026)
  redirects: {
    '/programs': '/scholarships/compare/',
    '/erasmus-mundus': '/scholarships/erasmus-mundus/',
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
