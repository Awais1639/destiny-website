/**
 * Homepage motion: split-text headline reveals, counters, typewriter search hints,
 * cursor spotlight + parallax, 3D tilt cards, magnetic buttons, scroll progress
 * and a scroll-linked "how it works" line. Everything is skipped when the visitor
 * prefers reduced motion, and the page is fully usable without any of it.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Split text into masked words ---------- */
function split(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  el.setAttribute('aria-label', el.textContent!.replace(/\s+/g, ' ').trim());
  let i = 0;
  const walk = (node: Node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const parts = n.textContent!.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const outer = document.createElement('span');
          outer.className = 'w';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = p;
          inner.style.setProperty('--wi', String(i++));
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') walk(n);
    });
  };
  walk(el);
}

/* ---------- Count up real numbers ---------- */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.countup);
  if (!Number.isFinite(target)) return;
  const dur = 1400;
  const t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (!reduced) {
  document.documentElement.classList.add('motion');
  document.documentElement.dataset.motionReady = '1';

  // Split headings
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(split);

  // Observe split headings, counters, staggers
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add('in');
        if (el.classList.contains('stagger')) setTimeout(() => el.classList.add('done'), 900 + el.children.length * 90);
        if (el.dataset.countup) countUp(el);
        io.unobserve(el);
      }),
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-split]:not(.hero h1), [data-countup], .stagger').forEach((el) => {
    if (el.classList.contains('stagger')) [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)));
    if (el.closest('.hero') && el.dataset.countup) return; // hero counters start on load (below)
    io.observe(el);
  });
  // hero headline plays on load (after the hidden state has been painted, so it transitions)
  setTimeout(() => document.querySelector('.hero h1')?.classList.add('in'), 80);
  setTimeout(() => document.querySelectorAll<HTMLElement>('.hero [data-countup]').forEach(countUp), 700);

  /* ---------- Typewriter hints in the hero search ---------- */
  const input = document.querySelector<HTMLInputElement>('[data-typewriter]');
  if (input) {
    const phrases = (input.dataset.typewriter || '').split('|');
    let pi = 0, ci = 0, deleting = false;
    const base = input.placeholder;
    const step = () => {
      if (document.activeElement === input || input.value) { input.placeholder = base; setTimeout(step, 1200); return; }
      const full = phrases[pi];
      ci += deleting ? -1 : 1;
      input.placeholder = 'Try “' + full.slice(0, ci) + (ci < full.length || deleting ? '▍' : '') + '”';
      let wait = deleting ? 35 : 70;
      if (!deleting && ci === full.length) { deleting = true; wait = 1700; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; wait = 350; }
      setTimeout(step, wait);
    };
    setTimeout(step, 1800);
  }

  /* ---------- Scroll progress + scroll-linked steps line ---------- */
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const steps = document.querySelector<HTMLElement>('[data-steps]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar?.style.setProperty('--p', p.toFixed(4));
      if (steps) {
        const r = steps.getBoundingClientRect();
        const sp = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3)));
        steps.style.setProperty('--sp', sp.toFixed(3));
      }
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (finePointer) {
    /* ---------- Hero spotlight + parallax ---------- */
    const hero = document.querySelector<HTMLElement>('.hero');
    const layers = [...document.querySelectorAll<HTMLElement>('[data-depth]')];
    let raf = 0;
    hero?.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        hero.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        hero.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        layers.forEach((l) => {
          const d = Number(l.dataset.depth);
          l.style.translate = `${((x - 0.5) * d).toFixed(1)}px ${((y - 0.5) * d).toFixed(1)}px`;
        });
      });
    });
    hero?.addEventListener('pointerleave', () => layers.forEach((l) => (l.style.translate = '0 0')));

    /* ---------- 3D tilt ---------- */
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg) translateY(-3px)`;
        el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => (el.style.translate = '0 0'));
    });
  }
} else {
  // Reduced motion: pause SVG (SMIL) animations in the globe.
  document.querySelectorAll<SVGSVGElement>('svg[data-globe]').forEach((s) => s.pauseAnimations?.());
}
