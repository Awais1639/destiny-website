/**
 * Nordic and Baltic university directory (src/data/universities-europe.json).
 * Country-level admission rules from the official national portals plus every institution on the official list.
 */
import data from '../data/universities-europe.json';

export interface DirLink { label: string; url: string }
export interface DirDeadline { label: string; date: string; apply: boolean }
export interface DirRules {
  portal: DirLink;
  applicationFee: string;
  tuition: string;
  english: string;
  entry: string[];
  deadlines: DirDeadline[];
  deadlineNote?: string | null;
  funds: string | null;
  scholarships: { label: string; href: string }[];
  scholarshipNote?: string | null;
}
export interface DirEnglish { total: number; bachelor?: number; master?: number; phd?: number }
export interface DirInst {
  slug: string; name: string; ownership?: 'public' | 'private'; category: string; city?: string;
  website?: string; programmesUrl?: string; english?: DirEnglish; parent?: string; note?: string;
}
export interface DirCountry {
  slug: string; name: string; checked: string; scope: string; ownershipNote: string;
  rules: DirRules; sources: DirLink[]; institutions: DirInst[];
}

export const dirCountries = (data as unknown as { countries: DirCountry[] }).countries;
export const dirBySlug: Record<string, DirCountry> = Object.fromEntries(dirCountries.map((c) => [c.slug, c]));

export const dirCountryUrl = (c: { slug: string }) => `/universities/${c.slug}/`;
export const dirInstUrl = (c: { slug: string }, i: { slug: string }) => `/universities/${c.slug}/${i.slug}/`;
export const ownershipLabel = { public: 'Public', private: 'Private' } as const;

/** The next application deadline that is still ahead (or the last one), for status badges. */
export function nextApplyDeadline(c: DirCountry, today = new Date().toISOString().slice(0, 10)): string | null {
  const ds = c.rules.deadlines.filter((d) => d.apply).map((d) => d.date).sort();
  return ds.find((d) => d >= today) ?? ds.at(-1) ?? null;
}

export const host = (h?: string | null) => { try { return h ? new URL(h).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };
