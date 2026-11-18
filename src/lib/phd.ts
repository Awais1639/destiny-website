/** Funded PhD programmes, doctoral fellowships and PhD positions from official sources (src/data/phd.json). */
import data from '../data/phd.json';
import type { Scholarship } from './scholarships';

export type PhdKind = 'phd-programme' | 'funded-position' | 'fellowship' | 'doctoral-network';
export interface PhdProgramme {
  slug: string; title: string; provider: string; providerType: 'eu' | 'international' | 'research' | 'university' | 'government' | 'foundation';
  countries: string[]; kinds: PhdKind[]; entry: ('bachelor' | 'master')[]; summary: string; location: string; fields: string;
  eligibility: string[]; nationalities: string; funding: string; duration: string;
  dates: Scholarship['dates']; statusOverride: Scholarship['statusOverride']; procedure: string[];
  urls: { info: string; apply: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial'; lastChecked: string; notes: string }; warnings: string[]; addedOn: string;
}
export interface PhdPortal { country: string; label: string; url: string; note: string }
export const phdProgrammes = data.programmes as unknown as PhdProgramme[];
export const phdPortals = data.portals as PhdPortal[];
export const phdKindLabels: Record<PhdKind, string> = { 'phd-programme': 'PhD programme', 'funded-position': 'Funded PhD positions', fellowship: 'Doctoral fellowship', 'doctoral-network': 'Doctoral network' };
export const phdProviderLabels: Record<PhdProgramme['providerType'], string> = { eu: 'EU programme', international: 'International organisation', research: 'Research institute', university: 'University', government: 'Government programme', foundation: 'Foundation' };
export const entryLabels = { bachelor: 'With a bachelor’s', master: 'With a master’s' } as const;
