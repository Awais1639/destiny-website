/** Erasmus Mundus catalogue data + owner-verified intake updates. */
import catalogue from '../data/erasmus-mundus.json';
import updatesRaw from '../data/erasmus-updates.json';
import { dayNumber, todayNumber } from './scholarships';

export interface EmProgramme {
  slug: string;
  acronym: string;
  name: string;
  type: 'emjm' | 'intra-africa';
  website: string | null;
  projectPage: string | null;
  selectionYear: number | null;
  topics: string[];
  linkWarning?: boolean;
  catalogueOrder: number;
}
export interface EmUpdate {
  intake: string | null;
  opens: string | null;
  opensText?: string | null;
  deadline: string | null;
  deadlineNote: string | null;
  otherDeadlines: { label: string; date: string }[];
  scholarships: 'available' | 'none' | 'unknown';
  scholarshipNote: string | null;
  applyUrl: string | null;
  sourceUrl: string;
  verifiedOn: string;
}

export const em = catalogue as unknown as {
  source: string; sourceUrl: string; lastChecked: string; count: number;
  topics: Record<string, string>; programmes: EmProgramme[];
};
export const emProgrammes = em.programmes;
export const emTopics = em.topics;
export const emUpdates: Record<string, EmUpdate> = Object.fromEntries(
  Object.entries(updatesRaw as Record<string, unknown>).filter(([k]) => !k.startsWith('_')),
) as Record<string, EmUpdate>;
export const emBySlug = Object.fromEntries(emProgrammes.map((p) => [p.slug, p]));

import { emStatusLabels, type EmStatus } from './erasmus-status-core';
export { emStatusLabels, type EmStatus };

/** Status is derived ONLY from verified updates; without one we never guess. */
export function emStatus(u: EmUpdate | undefined, now?: Date): EmStatus {
  if (!u) return 'check';
  const t = todayNumber(now);
  const opens = dayNumber(u.opens), dl = dayNumber(u.deadline);
  if (dl !== null && t > dl) return u.scholarships === 'none' ? 'no-scholarship' : 'closed';
  if (u.scholarships === 'none') return 'no-scholarship';
  if (opens !== null && t < opens) return 'upcoming';
  if (opens !== null && dl !== null) return 'open';
  if (opens !== null && t >= opens) return 'open';
  return 'check';
}

export const typeLabels = { emjm: 'Erasmus Mundus Joint Master', 'intra-africa': 'Intra-Africa mobility scheme' } as const;
