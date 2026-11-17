/**
 * Italy's regional right-to-study grants (DSU — "Diritto allo Studio Universitario").
 * Data: src/data/italy-regional.json — every fact comes from the agency's or ministry's official page
 * listed in `sources`, checked on `checked`. `checked: null` = agency listed but its call not yet verified.
 */
import raw from '../data/italy-regional.json';
import { dayNumber, todayNumber } from './scholarships';

export interface Link { label: string; url: string }
export interface Deadline { label: string; date: string; time: string | null; note: string | null; /** an application deadline (vs documents, lease, housing) */ apply: boolean }
export interface Agency {
  name: string; short: string; url: string; covers: string; unis: string[];
  checked: string | null; note: string | null;
  deadlines: Deadline[];
  limits: { isee?: number; ispe?: number } | null;
  amounts: { offsite?: number; commuter?: number; local?: number; note?: string } | null;
  international: string[]; links: Link[]; sources: Link[];
}
export interface Region { slug: string; name: string; it: string; intro?: string; agencies: Agency[] }

export const dsu = raw as unknown as {
  academicYear: string; checkedOn: string;
  national: {
    isee: number; ispe: number; amounts: { offsite: number; commuter: number; local: number };
    increase: string; poorCountries: number; pakistanOnPoorList: boolean; sources: Link[];
  };
  regions: Region[];
};
export const regions = dsu.regions;

/** Region name used in italy-programmes.json → our region slug */
export const regionByItName: Record<string, Region> = Object.fromEntries(regions.map((r) => [r.it, r]));

/** University slug → the agency (and region) that handles its students' grants */
export const agencyByUni: Record<string, { region: Region; agency: Agency }> = {};
for (const r of regions) for (const a of r.agencies) for (const u of a.unis) agencyByUni[u] = { region: r, agency: a };

export const regionUrl = (r: Region) => `/scholarships/italy-regional-grants/${r.slug}/`;
export const agencyId = (a: Agency) => 'ag-' + a.short.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const HUB = '/scholarships/italy-regional-grants/';

export const euro = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/** Latest application deadline of an agency's call (documents, lease and housing dates excluded) */
export function lastDeadline(a: Agency): string | null {
  return a.deadlines.filter((d) => d.apply).map((d) => d.date).sort().at(-1) ?? null;
}
export function isPast(iso: string, now?: Date): boolean {
  const n = dayNumber(iso);
  return n !== null && n < todayNumber(now);
}
/** Payload for the shared live status badge (src/scripts/site.ts). */
export const livePayload = (iso: string) =>
  JSON.stringify({ dates: { cycleConfirmed: true, opens: null, deadline: iso }, statusOverride: null });
