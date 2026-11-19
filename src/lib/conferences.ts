/** Funded conferences, summits and academic meetings with travel support, from official organiser pages (src/data/conferences.json). */
import data from '../data/conferences.json';
import type { Scholarship } from './scholarships';

export type ConfKind = 'summit' | 'academic' | 'youth' | 'pitch';
export type ConfAudience = 'students' | 'phd-students' | 'postdocs' | 'senior-researchers' | 'professionals' | 'young-leaders' | 'journalists';
export type ConfSupport = 'full' | 'travel-grant' | 'partial' | 'fee-waiver';
export interface ConfItem {
  slug: string; title: string; provider: string; providerType: 'eu' | 'international' | 'research' | 'university' | 'government' | 'foundation';
  countries: string[]; kinds: ConfKind[]; audience: ConfAudience[]; support: ConfSupport;
  event: { start: string; end: string; location: string; online: boolean };
  summary: string; fields: string; eligibility: string[]; nationalities: string; funding: string;
  dates: Scholarship['dates']; statusOverride: Scholarship['statusOverride']; procedure: string[];
  urls: { info: string; apply: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial'; lastChecked: string; notes: string }; warnings: string[]; addedOn: string;
  /** derived for shared templates */
  location: string; duration: string;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (s: string) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
/** "12–17 Sep 2027", "28 Sep – 1 Oct 2027", or "Throughout 2027" for whole-year calendars. */
export function eventRange(start: string, end: string): string {
  const a = parts(start), b = parts(end);
  if (a.m === 1 && a.d === 1 && b.m === 12 && b.d === 31 && a.y === b.y) return `Throughout ${a.y}`;
  if (a.m === 11 && a.d === 1 && b.m === 11 && b.d === 30 && a.y === b.y) return `November ${a.y}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[a.m - 1]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${a.y}`;
  return `${a.d} ${MONTHS[a.m - 1]} ${a.y} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
}
export const conferences: ConfItem[] = (data.programmes as any[]).map((p) => ({
  ...p, location: p.event.location + (p.event.online ? ' · online option' : ''), duration: eventRange(p.event.start, p.event.end),
}));
export const confCalendars = ((data as any).calendars ?? []) as { label: string; url: string; note: string }[];
export const confKindLabels: Record<ConfKind, string> = { summit: 'Science & leadership summit', academic: 'Academic conference', youth: 'Youth summit', pitch: 'Pitch competition' };
export const confAudienceLabels: Record<ConfAudience, string> = { students: 'Students', 'phd-students': 'PhD students', postdocs: 'Early-career researchers', 'senior-researchers': 'Experienced researchers', professionals: 'Professionals', 'young-leaders': 'Young leaders (18–30)', journalists: 'Journalists' };
export const confSupportLabels: Record<ConfSupport, string> = { full: 'Fully funded places', 'travel-grant': 'Travel grants', partial: 'Partly funded', 'fee-waiver': 'Fee waiver + travel help' };
export const confProviderLabels: Record<ConfItem['providerType'], string> = { eu: 'EU programme', international: 'International organisation', research: 'Research institute', university: 'University', government: 'Government', foundation: 'Foundation' };
