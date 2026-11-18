/* "Add deadline to calendar" helpers. Deadlines are all-day events on the official deadline date. */
import { scholarships } from './data';
import { internships } from './internships';
import { phdProgrammes } from './phd';
import { postdocs } from './postdoc';

export type CalKind = 'scholarships' | 'internships' | 'phd' | 'postdoc';
export interface CalItem { kind: CalKind; slug: string; title: string; provider: string; deadline: string; info: string | null }

const pick = (kind: CalKind, list: any[]): CalItem[] =>
  list.filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.dates?.deadline ?? ''))
    .map((x) => ({ kind, slug: x.slug, title: x.title, provider: x.provider, deadline: x.dates.deadline, info: x.urls?.info ?? x.urls?.officialInfo ?? null }));

export const calItems: CalItem[] = [
  ...pick('scholarships', scholarships as any[]),
  ...pick('internships', internships as any[]),
  ...pick('phd', phdProgrammes as any[]),
  ...pick('postdoc', postdocs as any[]),
];

import { ymd, nextDay } from './calendar-core';
export { nextDay, eventText, googleUrl, outlookUrl } from './calendar-core';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = []; let cur = ''; let len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; len = 0; }
    cur += ch; len += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(o: { uid: string; summary: string; details: string; deadline: string; url: string }): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Destiny Global Opportunities//Deadlines//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${o.uid}`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(o.deadline)}`, `DTEND;VALUE=DATE:${ymd(nextDay(o.deadline))}`,
    `SUMMARY:${esc(o.summary)}`, `DESCRIPTION:${esc(o.details)}`, `URL:${o.url}`, 'TRANSP:TRANSPARENT',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${o.summary} — 7 days left`)}`, 'TRIGGER:-P7D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${o.summary} — tomorrow`)}`, 'TRIGGER:-P1D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
