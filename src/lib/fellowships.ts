/** Fellowships that are not postdoc jobs (professional, visiting research, advanced study, media, startup) from official sources (src/data/fellowships.json). */
import data from '../data/fellowships.json';
import type { Scholarship } from './scholarships';

export type FellowKind = 'leadership' | 'research' | 'visiting' | 'media' | 'startup';
export type FellowAudience = 'professionals' | 'phd-students' | 'postdocs' | 'senior-researchers' | 'journalists' | 'entrepreneurs';
export interface FellowItem {
  slug: string; title: string; provider: string; providerType: 'eu' | 'international' | 'research' | 'university' | 'government' | 'foundation';
  countries: string[]; kinds: FellowKind[]; audience: FellowAudience[]; summary: string; location: string; fields: string;
  eligibility: string[]; nationalities: string; funding: string; duration: string;
  dates: Scholarship['dates']; statusOverride: Scholarship['statusOverride']; procedure: string[];
  urls: { info: string; apply: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial'; lastChecked: string; notes: string }; warnings: string[]; addedOn: string;
}
export const fellowships = data.programmes as unknown as FellowItem[];
export const fellowKindLabels: Record<FellowKind, string> = { leadership: 'Professional & leadership', research: 'Research fellowship', visiting: 'Visiting / short stay', media: 'Journalism & media', startup: 'Entrepreneurship' };
export const fellowAudienceLabels: Record<FellowAudience, string> = { professionals: 'Working professionals', 'phd-students': 'PhD students', postdocs: 'Early-career researchers', 'senior-researchers': 'Experienced researchers', journalists: 'Journalists', entrepreneurs: 'Entrepreneurs' };
export const fellowProviderLabels: Record<FellowItem['providerType'], string> = { eu: 'EU programme', international: 'International organisation', research: 'Research institute', university: 'University', government: 'Government programme', foundation: 'Foundation' };
