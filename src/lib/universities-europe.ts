/**
 * Nordic and Baltic university directory (src/data/universities-europe.json).
 * Country-level admission rules from the official national portals plus every institution on the official list.
 */
import data from '../data/universities-europe.json';

export interface DirLink { label: string; url: string }
export interface DirDeadline { label: string; date: string; apply: boolean }
export interface DirRules {
  portal: DirLink;
  platforms?: { label: string; url: string; note: string }[];
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
export interface DirProgramme { level: 'bachelor' | 'master' | 'integrated' | 'phd' | 'specialist'; name: string }
export interface DirInst {
  slug: string; name: string; localName?: string; ownership?: 'public' | 'private'; category: string; city?: string;
  website?: string; programmesUrl?: string; profileUrl?: string; english?: DirEnglish; programmes?: DirProgramme[];
  tuition?: { text: string; source: string }; parent?: string; note?: string;
}
export const progLevelLabels: Record<DirProgramme['level'], string> = {
  bachelor: 'Bachelor’s', master: 'Master’s', integrated: 'Integrated bachelor’s + master’s', phd: 'Doctoral', specialist: 'Specialist / postgraduate',
};
export interface DirCountry {
  slug: string; name: string; checked: string; scope: string; ownershipNote: string;
  rules: DirRules; sources: DirLink[]; institutions: DirInst[]; linkless?: boolean;
}

export const dirCountries = (data as unknown as { countries: DirCountry[] }).countries;
export const dirBySlug: Record<string, DirCountry> = Object.fromEntries(dirCountries.map((c) => [c.slug, c]));

export const dirCountryUrl = (c: { slug: string }) => `/universities/${c.slug}/`;
export const dirInstUrl = (c: { slug: string }, i: { slug: string }) => `/universities/${c.slug}/${i.slug}/`;
export const ownershipLabel = { public: 'Public', private: 'Private' } as const;

export const host = (h?: string | null) => { try { return h ? new URL(h).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };

/* ---------- programmes from official national programme databases ---------- */
import progData from '../data/programmes-europe.json';
export interface DirProg {
  id: string; c: string; uni: string; name: string; degree?: string; level: 'bachelor' | 'master' | 'phd' | 'single-cycle' | 'other';
  duration?: string; credits?: string; mode?: string; city?: string; faculty?: string; specialization?: string; languages?: string;
  tuition?: string; semesterContribution?: string; english?: string; german?: string; requirements?: string; intake?: string;
  deadlines?: string; applyVia?: string; url?: string; apply?: string; requirementsUrl?: string; source: string; sourceLabel: string; checked: string;
}
export const dirProgs = (progData as unknown as { programmes: DirProg[] }).programmes;
export const progsByInst: Record<string, DirProg[]> = {};
for (const p of dirProgs) (progsByInst[`${p.c}/${p.uni}`] ??= []).push(p);
export const progLevelShort: Record<DirProg['level'], string> = { bachelor: 'Bachelor’s', master: 'Master’s', phd: 'Doctoral', 'single-cycle': 'Long-cycle master’s', other: 'Other' };
export const progAnchor = (p: DirProg) => `p-${p.id}`;

/** How many institutions share each name across all countries (used to disambiguate page titles). */
export const instNameCount = new Map<string, number>();
for (const cc of dirCountries) for (const x of cc.institutions) instNameCount.set(x.name, (instNameCount.get(x.name) ?? 0) + 1);
