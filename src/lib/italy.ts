/** English-taught degree programmes in Italy (MUR open data) + details checked by hand on university websites. */
import data from '../data/italy-programmes.json';
import updates from '../data/italy-updates.json';

export type Level = 'bachelor' | 'master' | 'single-cycle' | 'other';
export type UniType = 'public' | 'private' | 'online' | 'other';
export interface ItUni { code: string; slug: string; name: string; short: string; type: UniType; city: string; region: string; website: string | null; checkedOn: string | null; programmeCount: number }
export type Access = 'open' | 'limited-local' | 'limited-national' | 'unknown';
export interface ItProg { slug: string; uni: string; uniSlug: string; name: string; level: Level; classCode: string; className: string; city: string; province: string; language: string; topic: string; access: Access; mode: string }
export interface Deadline { label: string; date?: string | null; text?: string | null }
export interface UniUpdate {
  admissionsUrl: string | null; applicationFee: string | null; tuition: string | null; englishRequirement: string | null;
  deadlines: Deadline[]; notes: string | null; sourceUrl: string; verifiedOn: string;
}
export interface ProgUpdate {
  pageUrl: string | null; applyUrl: string | null; intake: string | null; duration: string | null;
  admissionRequirements: string | null; englishRequirement: string | null; tuition: string | null; applicationFee: string | null;
  deadlines: Deadline[]; notes: string | null; sourceUrl: string; verifiedOn: string;
}

export const it = data as unknown as {
  source: string; sourceUrl: string; dataYear: string; academicYear: string; imported: string; count: number;
  levels: Record<Level, string>; topics: Record<string, string>; access: Record<Access, string>; modes: Record<string, string>; universities: ItUni[]; programmes: ItProg[];
};
export const itUnis = it.universities;
export const itProgs = it.programmes;
export const itUniByCode = Object.fromEntries(itUnis.map((u) => [u.code, u])) as Record<string, ItUni>;
export const itUniBySlug = Object.fromEntries(itUnis.map((u) => [u.slug, u])) as Record<string, ItUni>;
export const uniUpdates = (updates as any).universities as Record<string, UniUpdate>;
export const progUpdates = (updates as any).programmes as Record<string, ProgUpdate>;
export const progKey = (p: ItProg) => `${p.uniSlug}/${p.slug}`;
export const progUrl = (p: ItProg) => `/universities/italy/${p.uniSlug}/${p.slug}/`;
export const uniUrl = (u: ItUni) => `/universities/italy/${u.slug}/`;

export const typeLabels: Record<UniType, string> = { public: 'Public (state) university', private: 'Private (non-state) university', online: 'Online (telematic) university', other: 'University' };
export const isEnglishOnly = (p: ItProg) => !/ital|tedes|franc/i.test(p.language);
export const languageLabel = (l: string) => (/^inglese$/i.test(l.trim()) ? 'English' : l.replace(/Italiano/g, 'Italian').replace(/Inglese/g, 'English').replace(/Tedesco/g, 'German').replace(/Francese/g, 'French').replace(/ - /g, ' and '));
export const typeShort: Record<UniType, string> = { public: 'Public', private: 'Private', online: 'Online', other: '—' };
export const levelShort: Record<Level, string> = { bachelor: "Bachelor's", master: "Master's", 'single-cycle': 'Single-cycle', other: 'Other' };

/** Where the "apply directly" button should go — only to official, recorded links. */
export function directLink(p: ItProg) {
  const pu = progUpdates[progKey(p)], uu = uniUpdates[p.uniSlug], u = itUniByCode[p.uni];
  if (pu?.applyUrl) return { url: pu.applyUrl, label: 'Apply on official application portal', kind: 'apply' as const };
  if (pu?.pageUrl) return { url: pu.pageUrl, label: 'Apply on official programme website', kind: 'programme' as const };
  if (uu?.admissionsUrl) return { url: uu.admissionsUrl, label: 'Visit official admissions page', kind: 'admissions' as const };
  if (u?.website) return { url: u.website, label: 'Visit official university website', kind: 'website' as const };
  return null;
}
