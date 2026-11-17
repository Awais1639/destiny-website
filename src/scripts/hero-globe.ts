/** Hero orchestration: 3D globe + synced headline word + "Now exploring" card + starfield. */
import { createGlobe, type GlobeDest } from './globe3d';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const host = document.querySelector<HTMLElement>('[data-globe3d]');

interface Dest extends GlobeDest {
  sch: { title: string; href: string; funding: string; status: string } | null;
  countryHref: string;
}
const statusText: Record<string, string> = {
  open: 'Open', 'closing-soon': 'Closing soon', upcoming: 'Opening soon',
  closed: 'Closed for this cycle', varies: 'Deadlines vary', unconfirmed: 'Cycle not yet confirmed',
};

/* ---------- Text scramble for the destination word ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ✈•';
function scramble(el: HTMLElement, to: string) {
  if (reduced) { el.textContent = to; return; }
  const from = el.textContent || '';
  const len = Math.max(from.length, to.length);
  const queue = Array.from({ length: len }, (_, i) => ({
    from: from[i] || '', to: to[i] || '', start: Math.floor(Math.random() * 10), end: 10 + Math.floor(Math.random() * 16),
  }));
  let frame = 0;
  const tick = () => {
    let out = '', done = 0;
    for (const q of queue) {
      if (frame >= q.end) { done++; out += q.to; }
      else if (frame >= q.start) out += `<span class="glyph">${GLYPHS[Math.floor(Math.random() * GLYPHS.length)]}</span>`;
      else out += q.from;
    }
    el.innerHTML = out;
    if (done < queue.length) { frame++; requestAnimationFrame(tick); }
    else el.textContent = to;
  };
  tick();
}

if (host) {
  const origin = JSON.parse(host.dataset.origin!) as GlobeDest;
  const dests = JSON.parse(host.dataset.dests!) as Dest[];
  const word = document.querySelector<HTMLAnchorElement>('[data-dest-word]');
  const card = document.querySelector<HTMLAnchorElement>('[data-now]');
  const local = card?.querySelector<HTMLElement>('[data-now-local]');
  const name = card?.querySelector<HTMLElement>('[data-now-name]');
  const sch = card?.querySelector<HTMLElement>('[data-now-sch]');
  const meta = card?.querySelector<HTMLElement>('[data-now-meta]');
  let firstFocus = true;

  host.addEventListener('globe:focus', (e) => {
    const { index } = (e as CustomEvent).detail as { index: number };
    const d = dests[index];
    if (firstFocus) { firstFocus = false; return; } // initial content is already server-rendered
    if (word) { scramble(word, d.name); word.href = d.countryHref; }
    if (card) {
      card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip');
      setTimeout(() => {
        card.href = d.sch?.href ?? d.countryHref;
        if (local) local.textContent = d.local;
        if (name) name.textContent = d.local === d.name ? '' : d.name;
        if (sch) sch.textContent = d.sch?.title ?? `Study in ${d.name}`;
        if (meta) meta.textContent = d.sch ? `${d.sch.funding} · ${statusText[d.sch.status] ?? ''}` : 'Destination guide';
      }, 260);
    }
  });

  try {
    createGlobe(host, origin, dests, { reduced });
  } catch {
    /* canvas unavailable: the SVG fallback stays visible */
  }

  // hide the drag hint after the first interaction
  host.addEventListener('pointerdown', () => host.classList.add('touched'), { once: true });
}

/* ---------- Starfield with shooting stars ---------- */
const sky = document.querySelector<HTMLCanvasElement>('[data-stars]');
if (sky) {
  const ctx = sky.getContext('2d')!;
  let w = 0, h = 0, dpr = 1;
  type Star = { x: number; y: number; r: number; tw: number; sp: number };
  let stars: Star[] = [];
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = sky.clientWidth; h = sky.clientHeight;
    sky.width = w * dpr; sky.height = h * dpr;
    const n = Math.round((w * h) / 9000);
    stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2, tw: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 1.4 }));
  };
  resize();
  new ResizeObserver(resize).observe(sky);
  let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
  let nextShoot = performance.now() + 2500;
  let visible = true, looping = false;
  const kick = () => { if (!looping) { looping = true; requestAnimationFrame(draw); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(sky);

  function draw(now: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = reduced ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(s.tw + (now / 1000) * s.sp));
      ctx.fillStyle = `rgba(235, 225, 255, ${a * 0.8})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduced) {
      if (!shoot && now > nextShoot) {
        shoot = { x: Math.random() * w * 0.6 + w * 0.2, y: Math.random() * h * 0.3, vx: 9 + Math.random() * 4, vy: 3.5 + Math.random() * 2, life: 1 };
        nextShoot = now + 5000 + Math.random() * 5000;
      }
      if (shoot) {
        const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12);
        g.addColorStop(0, `rgba(255, 220, 215, ${shoot.life})`);
        g.addColorStop(1, 'rgba(255, 107, 95, 0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12); ctx.stroke();
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.018;
        if (shoot.life <= 0 || shoot.x > w + 100) shoot = null;
      }
      if (visible && !document.hidden) { requestAnimationFrame(draw); return; }
    }
    looping = false;
  }
  kick();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduced) kick(); });
}
