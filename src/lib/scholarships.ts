/**
 * Reusable scholarship logic — pure functions used both at build time (Astro pages)
 * and in the browser (explorer filtering, live status badges).
 */
import { site } from '../config/site';
import type { FundingType, StatusKey } from '../data/taxonomy';
import { fundingLabels, statusLabels } from '../data/taxonomy';

export interface Coverage {
  tuition: string | null;
  stipend: string | null;
  accommodation: string | null;
  travel: string | null;
  insurance: string | null;
  other: string | null;
}

export interface Scholarship {
  id: string;
  slug: string;
  title: string;
  program: string;
  provider: string;
  providerType: string;
  countries: string[];
  degreeLevels: string[];
  subjects: string[];
  fundingType: FundingType;
  featured: boolean;
  addedOn: string;
  summary: string;
  eligibleNationalities: string;
  eligibleDisciplines: string;
  coverage: Coverage;
  eligibility: string[];
  academicRequirements: string | null;
  languageRequirements: string | null;
  documents: string[] | null;
  dates: {
    cycle: string;
    cycleConfirmed: boolean;
    opens: string | null;
    deadline: string | null;
    deadlineNote: string | null;
    programStart: string | null;
  };
  statusOverride: 'varies' | 'unconfirmed' | 'closed' | null;
  procedure: string[];
  urls: { info: string; application: string | null; sources: { label: string; url: string }[] };
  verification: { level: 'official' | 'partial' | 'needs-verification'; lastChecked: string; notes: string };
  warnings: string[];
}

export const NOT_SPECIFIED = 'Not specified by the official source';

/* ---------- Dates (timezone-safe: all dates are treated as calendar days in UTC) ---------- */

/** Parse "YYYY-MM-DD" into a UTC day number. Returns null for missing/invalid input. */
export function dayNumber(iso: string | null | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  return Number.isNaN(t) ? null : Math.floor(t / 86_400_000);
}

/** Today's calendar day, taken in UTC so results are identical for every visitor and the build. */
export function todayNumber(now: Date = new Date()): number {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
}

export function formatDate(iso: string | null | undefined): string {
  const n = dayNumber(iso);
  if (n === null) return NOT_SPECIFIED;
  return new Intl.DateTimeFormat(site.dateLocale, { ...site.dateFormat, timeZone: 'UTC' }).format(
    new Date(n * 86_400_000),
  );
}

export function daysUntil(iso: string | null | undefined, now?: Date): number | null {
  const n = dayNumber(iso);
  return n === null ? null : n - todayNumber(now);
}

/* ---------- Status ---------- */

/**
 * Application status. Never assumes "open" without a confirmed cycle and a known deadline.
 * A deadline day is treated as still open (the provider's own cut-off time applies).
 */
export function getStatus(s: Pick<Scholarship, 'dates' | 'statusOverride'>, now?: Date): StatusKey {
  if (s.statusOverride) return s.statusOverride;
  if (!s.dates.cycleConfirmed) return 'unconfirmed';
  const today = todayNumber(now);
  const opens = dayNumber(s.dates.opens);
  const deadline = dayNumber(s.dates.deadline);
  if (opens !== null && today < opens) return 'upcoming';
  if (deadline === null) return 'unconfirmed';
  if (today > deadline) return 'closed';
  if (deadline - today <= site.closingSoonDays) return 'closing-soon';
  return 'open';
}

export function statusLabel(k: StatusKey): string {
  return statusLabels[k];
}

export function isActive(k: StatusKey): boolean {
  return k === 'open' || k === 'closing-soon';
}

/* ---------- URLs ---------- */

export function hasUrl(u: string | null | undefined): u is string {
  if (!u) return false;
  try {
    const p = new URL(u);
    return p.protocol === 'https:' || p.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Returns the label/URL for the "direct" button, never inventing an application portal. */
export function directApplyAction(s: Scholarship): { label: string; url: string; verifiedPortal: boolean } {
  if (hasUrl(s.urls.application)) return { label: 'Apply on Official Website', url: s.urls.application, verifiedPortal: true };
  return { label: 'Visit Official Scholarship Website', url: s.urls.info, verifiedPortal: false };
}

/* ---------- Funding ---------- */

export function fundingLabel(t: FundingType): string {
  return fundingLabels[t] ?? 'Funding varies';
}

export const coverageRows: { key: keyof Coverage; label: string }[] = [
  { key: 'tuition', label: 'Tuition fees' },
  { key: 'stipend', label: 'Monthly stipend' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'travel', label: 'Travel / airfare' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'other', label: 'Other benefits' },
];

/* ---------- Search, filter, sort ---------- */

export interface Filters {
  q?: string;
  country?: string[];
  degree?: string[];
  funding?: string[];
  subject?: string[];
  status?: string[];
  provider?: string[];
  deadlineWithin?: number | null; // days
}

export function searchText(s: Scholarship): string {
  return [s.title, s.program, s.provider, s.summary, s.eligibleNationalities, s.eligibleDisciplines, ...s.countries, ...s.degreeLevels]
    .join(' ')
    .toLowerCase();
}

export function normalise(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function matchesQuery(haystack: string, q: string): boolean {
  const terms = normalise(q).split(/\s+/).filter(Boolean);
  const h = normalise(haystack);
  return terms.every((t) => h.includes(t));
}

export function matchesFilters(s: Scholarship, f: Filters, now?: Date): boolean {
  const any = (list: string[] | undefined, values: string[]) => !list?.length || list.some((v) => values.includes(v));
  if (f.q && !matchesQuery(searchText(s), f.q)) return false;
  if (!any(f.country, s.countries)) return false;
  if (!any(f.degree, s.degreeLevels)) return false;
  if (!any(f.funding, [s.fundingType])) return false;
  // "any" subject scholarships match every subject filter
  if (f.subject?.length && !s.subjects.includes('any') && !any(f.subject, s.subjects)) return false;
  if (!any(f.provider, [s.providerType])) return false;
  const st = getStatus(s, now);
  if (f.status?.length) {
    const normalised = st === 'closing-soon' ? ['open', 'closing-soon'] : [st];
    if (!f.status.some((v) => normalised.includes(v))) return false;
  }
  if (f.deadlineWithin) {
    const d = daysUntil(s.dates.deadline, now);
    if (d === null || d < 0 || d > f.deadlineWithin) return false;
  }
  return true;
}

export type SortKey = 'relevance' | 'deadline' | 'newest' | 'title';

const statusRank: Record<StatusKey, number> = { 'closing-soon': 0, open: 1, upcoming: 2, varies: 3, unconfirmed: 4, closed: 5 };

export function sortScholarships(list: Scholarship[], key: SortKey, now?: Date): Scholarship[] {
  const copy = [...list];
  const dl = (s: Scholarship) => dayNumber(s.dates.deadline) ?? Number.MAX_SAFE_INTEGER;
  switch (key) {
    case 'deadline':
      // soonest upcoming deadline first; closed and undated last
      return copy.sort((a, b) => {
        const ra = statusRank[getStatus(a, now)], rb = statusRank[getStatus(b, now)];
        const aActive = ra <= 1, bActive = rb <= 1;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return dl(a) - dl(b) || ra - rb;
      });
    case 'newest':
      return copy.sort((a, b) => (b.addedOn || '').localeCompare(a.addedOn || '') || a.title.localeCompare(b.title));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy.sort(
        (a, b) =>
          statusRank[getStatus(a, now)] - statusRank[getStatus(b, now)] ||
          Number(b.featured) - Number(a.featured) ||
          a.title.localeCompare(b.title),
      );
  }
}

export function relatedScholarships(s: Scholarship, all: Scholarship[], limit = 3): Scholarship[] {
  return all
    .filter((o) => o.slug !== s.slug)
    .map((o) => ({
      o,
      score:
        o.countries.filter((c) => s.countries.includes(c)).length * 3 +
        o.degreeLevels.filter((d) => s.degreeLevels.includes(d)).length +
        (o.fundingType === s.fundingType ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.o.title.localeCompare(b.o.title))
    .slice(0, limit)
    .map((x) => x.o);
}
