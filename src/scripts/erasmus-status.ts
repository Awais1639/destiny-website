/** Recomputes Erasmus Mundus intake badges with the visitor's current date (static HTML may be days old). */
import { emStatusLabels, type EmStatus } from '../lib/erasmus-status-core';
import { dayNumber, todayNumber } from '../lib/scholarships';

export function applyEmStatuses(root: ParentNode = document) {
  const t = todayNumber();
  root.querySelectorAll<HTMLElement>('[data-em-status]').forEach((el) => {
    const opens = dayNumber(el.dataset.opens || null), dl = dayNumber(el.dataset.deadline || null);
    const none = el.dataset.nosch === '1';
    let st: EmStatus = 'check';
    if (dl !== null && t > dl) st = none ? 'no-scholarship' : 'closed';
    else if (none) st = 'no-scholarship';
    else if (opens !== null && t < opens) st = 'upcoming';
    else if (opens !== null) st = 'open';
    el.className = el.className.replace(/\bem-st-[a-z-]+/g, '').trim() + ` em-st-${st}`;
    el.textContent = emStatusLabels[st];
  });
}
