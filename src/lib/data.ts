import raw from '../data/scholarships.json';
import type { Scholarship } from './scholarships';
import { getStatus, sortScholarships } from './scholarships';
import { site } from '../config/site';

export const scholarships = raw as unknown as Scholarship[];
export const bySlug = Object.fromEntries(scholarships.map((s) => [s.slug, s]));

/** Prefix an internal path with the configured base path (needed for GitHub Pages sub-folders). */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}` || '/';
}

export const activeScholarships = () => scholarships.filter((s) => ['open', 'closing-soon'].includes(getStatus(s)));
export const sorted = (k: Parameters<typeof sortScholarships>[1]) => sortScholarships(scholarships, k);

/* ---------- Contact link builders (sanitised; return null when not configured) ---------- */

const clean = (v: string) => v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();

export function mailtoLink(subject: string, body: string): string | null {
  const email = site.contact.email.trim();
  if (!/^[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}$/i.test(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent(clean(subject))}&body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`;
}

export function whatsappLink(text: string): string | null {
  const n = site.contact.whatsapp.replace(/\D/g, '');
  if (n.length < 8) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export const socialLinks = () =>
  (Object.entries(site.social) as [string, string][])
    .filter(([, v]) => /^https:\/\//.test(v))
    .map(([k, v]) => ({ key: k, url: v }));
