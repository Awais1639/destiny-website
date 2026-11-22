// Fills the Content-Security-Policy in dist/.htaccess with SHA-256 hashes of every inline script on the site,
// so only the website's own scripts can run (protects visitors against injected code).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const dist = 'dist';
const hashes = new Set();
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && scan(p); } };
const scan = (p) => {
  const html = readFileSync(p, 'utf8');
  if (/\son(click|load|error|change|submit|input|mouseover)=/i.test(html)) throw new Error(`Inline event handler in ${p} — move it to a script (CSP would block it).`);
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs)) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
};
walk(dist);
const csp = [
  "default-src 'self'",
  `script-src 'self' https://static.cloudflareinsights.com https://www.googletagmanager.com ${[...hashes].sort().join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
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
writeFileSync(file, ht.replace('__CSP__', csp));
writeFileSync('node_modules/.csp-dev.txt', csp); // used by the local test server only
console.log(`[security] CSP written with ${hashes.size} inline-script hashes`);
