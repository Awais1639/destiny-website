/** Site-wide behaviour: header state, drawers, reveal-on-scroll, save buttons, live status badges. */
import { getSaved, toggleSaved } from './saved';
import { getStatus, statusText } from '../lib/scholarships';

const announce = (msg: string) => {
  const r = document.getElementById('live-region');
  if (r) { r.textContent = ''; requestAnimationFrame(() => (r.textContent = msg)); }
};
(window as any).dgoAnnounce = announce;

if (!document.querySelector('.hero')) document.documentElement.dataset.motionReady = '1';

/* ---------- Header shadow on scroll ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Drawers (mobile menu, filter panel) ---------- */
let lastTrigger: HTMLElement | null = null;
function openDrawer(d: HTMLElement, trigger?: HTMLElement | null) {
  lastTrigger = trigger ?? null;
  d.setAttribute('data-open', '');
  document.body.classList.add('no-scroll');
  trigger?.setAttribute('aria-expanded', 'true');
  const focusable = d.querySelector<HTMLElement>('button, a, input, select');
  focusable?.focus();
}
function closeDrawer(d: HTMLElement) {
  d.removeAttribute('data-open');
  document.body.classList.remove('no-scroll');
  lastTrigger?.setAttribute('aria-expanded', 'false');
  lastTrigger?.focus();
}
(window as any).dgoDrawer = { open: openDrawer, close: closeDrawer };

document.querySelectorAll<HTMLElement>('[data-menu-open]').forEach((b) =>
  b.addEventListener('click', () => {
    const d = document.getElementById(b.getAttribute('aria-controls') || '');
    if (d) openDrawer(d, b);
  }),
);
document.querySelectorAll<HTMLElement>('[data-drawer]').forEach((d) => {
  d.querySelectorAll('[data-drawer-close]').forEach((c) => c.addEventListener('click', () => closeDrawer(d)));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer(d);
    if (e.key === 'Tab') {
      const f = [...d.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // close the menu when following a link inside it
  d.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (d.id === 'mobile-menu') d.removeAttribute('data-open'); document.body.classList.remove('no-scroll'); }));
});

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

/* ---------- Saved scholarships ---------- */
function syncSaved() {
  const list = getSaved();
  document.querySelectorAll<HTMLElement>('[data-saved-count]').forEach((el) => {
    el.dataset.n = String(list.length);
    el.textContent = list.length ? String(list.length) : '';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((b) => {
    const on = list.includes(b.dataset.save!);
    b.setAttribute('aria-pressed', String(on));
    const t = b.dataset.title || 'scholarship';
    b.setAttribute('aria-label', on ? `Remove ${t} from saved` : `Save ${t}`);
    const txt = b.querySelector('[data-save-text]');
    if (txt) txt.textContent = on ? 'Saved' : 'Save';
  });
}
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-save]');
  if (!b) return;
  e.preventDefault();
  const added = toggleSaved(b.dataset.save!);
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  announce(added ? 'Saved to your list on this device.' : 'Removed from your saved list.');
});
window.addEventListener('saved:change', syncSaved);
window.addEventListener('storage', syncSaved);
syncSaved();

/* ---------- Live status badges (recomputed with today's date, so a static build never shows stale "Open") ---------- */
export function refreshStatuses(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-live-status]').forEach((el) => {
    try {
      const d = JSON.parse(el.dataset.liveStatus!);
      const st = getStatus({ dates: d.dates, statusOverride: d.statusOverride });
      el.className = `badge badge-dot badge-${st}`;
            el.textContent = statusText(st, d.dates.deadline);
      el.closest<HTMLElement>('[data-card]')?.setAttribute('data-status', st);
    } catch { /* keep server-rendered value */ }
  });
}
refreshStatuses();
