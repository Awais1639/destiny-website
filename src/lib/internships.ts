/** Internship, traineeship and master's-thesis programmes from official sources (src/data/internships.json). */
import data from '../data/internships.json';
import type { Scholarship } from './scholarships';

export type Kind = 'internship' | 'traineeship' | 'research-internship' | 'thesis';
export interface Internship {
  slug: string; title: string; provider: string; providerType: 'eu' | 'international' | 'research' | 'university' | 'government';
  countries: string[]; kinds: Kind[]; levels: string[]; summary: string; location: string; fields: string;
  eligibility: string[]; nationalities: string; pay: 'paid' | 'unpaid' | 'varies'; stipend: string; duration: string;
  dates: Scholarship['dates']; statusOverride: Scholarship['statusOverride']; procedure: string[];
  urls: { info: string; apply: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial'; lastChecked: string; notes: string }; warnings: string[]; addedOn: string;
}
export interface Portal { country: string; label: string; url: string; note: string }
export const internships = data.programmes as unknown as Internship[];
export const portals = data.portals as Portal[];
export const kindLabels: Record<Kind, string> = { internship: 'Internship', traineeship: 'Traineeship', 'research-internship': 'Research internship', thesis: 'Master’s thesis' };
export const providerLabels: Record<Internship['providerType'], string> = { eu: 'EU institution', international: 'International organisation', research: 'Research centre', university: 'University', government: 'Government programme' };
export const levelLabels: Record<string, string> = { bachelor: 'Bachelor’s students', master: 'Master’s students', phd: 'PhD students', graduate: 'Recent graduates' };
export const payLabels = { paid: 'Paid / stipend', unpaid: 'Unpaid', varies: 'Depends on position' } as const;
