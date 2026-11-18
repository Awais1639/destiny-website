/** Postdoctoral fellowships, programmes and positions from official sources (src/data/postdoc.json). */
import data from '../data/postdoc.json';
import type { Scholarship } from './scholarships';

export type PostdocKind = 'fellowship' | 'programme' | 'position';
export interface PostdocItem {
  slug: string; title: string; provider: string; providerType: 'eu' | 'international' | 'research' | 'university' | 'government' | 'foundation';
  countries: string[]; kinds: PostdocKind[]; summary: string; location: string; fields: string;
  eligibility: string[]; nationalities: string; funding: string; duration: string;
  dates: Scholarship['dates']; statusOverride: Scholarship['statusOverride']; procedure: string[];
  urls: { info: string; apply: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial'; lastChecked: string; notes: string }; warnings: string[]; addedOn: string;
}
export interface PostdocPortal { country: string; label: string; url: string; note: string }
export const postdocs = data.programmes as unknown as PostdocItem[];
export const postdocPortals = data.portals as PostdocPortal[];
export const postdocKindLabels: Record<PostdocKind, string> = { fellowship: 'Individual fellowship', programme: 'Postdoc programme', position: 'Postdoc positions' };
export const postdocProviderLabels: Record<PostdocItem['providerType'], string> = { eu: 'EU programme', international: 'International organisation', research: 'Research institute', university: 'University', government: 'Government programme', foundation: 'Foundation' };
