// Fills the Content-Security-Policy in dist/.htaccess with SHA-256 hashes of every inline script on the site,
// so only the website's own scripts can run (protects visitors against injected code).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const dist = 'dist';
const hashes = new Set();
let adsense = false; // set when any page loads the Google AdSense script (adsenseClient filled in src/config/site.ts)
let liveApi = ''; // origin of the assistant's live university lookup (src/config/site.ts assistantApi)
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && scan(p); } };
const scan = (p) => {
  const html = readFileSync(p, 'utf8');
  if (html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) adsense = true;
  if (!liveApi) { const m = html.match(/data-live="(https?:\/\/[^"/]+)/); if (m) liveApi = m[1]; }
  if (/\son(click|load|error|change|submit|input|mouseover)=/i.test(html)) throw new Error(`Inline event handler in ${p} — move it to a script (CSP would block it).`);
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs)) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
};
walk(dist);
// Google AdSense loads ads from domains that change over time and does not publish a fixed list
// (https://support.google.com/adsense/answer/16283098). When ads are switched on, scripts, frames, images and
// connections from any HTTPS address are allowed; every inline script still has to match a hash.
const ads = adsense ? ' https:' : '';
const csp = [
  "default-src 'self'",
  `script-src 'self' https://static.cloudflareinsights.com https://www.googletagmanager.com${ads} ${[...hashes].sort().join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com${ads}`,
  "font-src 'self' data:",
  `connect-src 'self'${liveApi ? ' ' + liveApi : ''} https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${ads}`,
  ...(adsense ? ['frame-src https:', 'fenced-frame-src https:'] : []),
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');
const file = join(dist, '.htaccess');
const ht = readFileSync(file, 'utf8');
if (!ht.includes('__CSP__')) throw new Error('CSP placeholder missing in dist/.htaccess');
let out = ht.replace('__CSP__', csp);
if (adsense) {
  // Ads need the browser's interest-based ad features and must be able to open the advertiser's site.
  out = out.replace(', interest-cohort=(), browsing-topics=()', '').replace('Cross-Origin-Opener-Policy "same-origin"', 'Cross-Origin-Opener-Policy "same-origin-allow-popups"');
}
writeFileSync(file, out);
writeFileSync('node_modules/.csp-dev.txt', csp); // used by the local test server only
console.log(`[security] CSP written with ${hashes.size} inline-script hashes${adsense ? ' (Google AdSense allowed)' : ''}`);
