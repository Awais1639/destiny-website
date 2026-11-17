// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
