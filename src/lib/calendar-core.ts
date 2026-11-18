/* Browser-safe calendar link helpers (no data imports). */
export const ymd = (iso: string) => iso.replace(/-/g, '');
export function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function eventText(title: string, provider: string, pageUrl: string, info: string | null) {
  const summary = `Deadline: ${title}`;
  const details = [
    `Application deadline for ${title} (${provider}).`,
    'Always confirm the exact deadline, time and time zone on the official website before applying.',
    info ? `Official website: ${info}` : '',
    `Details: ${pageUrl}`,
  ].filter(Boolean).join('\n');
  return { summary, details };
}

export function googleUrl(summary: string, details: string, deadline: string): string {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: summary, dates: `${ymd(deadline)}/${ymd(nextDay(deadline))}`, details });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function outlookUrl(summary: string, details: string, deadline: string): string {
  const q = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: summary, startdt: deadline, enddt: nextDay(deadline), allday: 'true', body: details });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`;
}

