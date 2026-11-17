/**
 * Interactive 3D dotted globe for the homepage hero (plain canvas, no libraries).
 * - Land rendered as glowing dots with depth shading
 * - Great-circle flight arcs from Pakistan to each destination, with a travelling plane + trail
 * - Auto-tours destinations (flies the camera to each one) and emits `globe:focus` events
 * - Drag / swipe to spin with inertia; pauses when off-screen or the tab is hidden
 */
import land from '../data/land-dots.json';

export interface GlobeDest { code: string; name: string; local: string; lat: number; lon: number }
type V3 = [number, number, number];

const RAD = Math.PI / 180;
const toVec = (lat: number, lon: number): V3 => {
  const p = lat * RAD, l = lon * RAD;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerpAngle = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};

export function createGlobe(host: HTMLElement, origin: GlobeDest, dests: GlobeDest[], opts: { reduced: boolean }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'globe3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d')!;
  const dots = (land as number[][]).map(([la, lo]) => toVec(la, lo));
  const oVec = toVec(origin.lat, origin.lon);
  const dVecs = dests.map((d) => toVec(d.lat, d.lon));
  const BUCKETS = 8;
  const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);

  // precompute arcs (slerp with altitude)
  const arcs = dVecs.map((dv) => {
    const dot = Math.max(-1, Math.min(1, oVec[0] * dv[0] + oVec[1] * dv[1] + oVec[2] * dv[2]));
    const ang = Math.acos(dot);
    const pts: V3[] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const s1 = Math.sin((1 - t) * ang) / Math.sin(ang), s2 = Math.sin(t * ang) / Math.sin(ang);
      const lift = 1 + Math.sin(Math.PI * t) * (0.12 + ang * 0.16);
      pts.push([(oVec[0] * s1 + dv[0] * s2) * lift, (oVec[1] * s1 + dv[1] * s2) * lift, (oVec[2] * s1 + dv[2] * s2) * lift]);
    }
    return pts;
  });

  let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    R = Math.min(W, H) * 0.43; cx = W / 2; cy = H / 2;
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // camera
  let camLon = origin.lon - 20, camLat = 26;
  let velLon = 0;
  let focus = -1, focusStart = 0, flyFrom = { lon: camLon, lat: camLat }, flyTo = { lon: camLon, lat: camLat };
  let flightStart = 0;
  let dragging = false, lastX = 0, lastY = 0, userUntil = 0, resumeTour = false;
  const start = performance.now();

  const rotate = (v: V3): V3 => {
    const l = -camLon * RAD, p = camLat * RAD;
    const x1 = v[0] * Math.cos(l) + v[2] * Math.sin(l);
    const z1 = -v[0] * Math.sin(l) + v[2] * Math.cos(l);
    const y2 = v[1] * Math.cos(p) - z1 * Math.sin(p);
    const z2 = v[1] * Math.sin(p) + z1 * Math.cos(p);
    return [x1, y2, z2];
  };
  const proj = (v: V3) => [cx + v[0] * R, cy - v[1] * R] as const;

  const setFocus = (i: number, now: number) => {
    focus = i;
    focusStart = now;
    flightStart = now + 700;
    const d = dests[i];
    flyFrom = { lon: camLon, lat: camLat };
    // aim the camera between origin and destination, a little north
    const midLon = lerpAngle(origin.lon, d.lon, 0.55);
    flyTo = { lon: midLon, lat: Math.max(10, Math.min(32, (origin.lat + d.lat) / 2 + 2)) };
    host.dispatchEvent(new CustomEvent('globe:focus', { detail: { index: i, dest: d }, bubbles: true }));
  };

  const drawFrame = (now: number) => {
    const t = (now - start) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // atmosphere glow
    const GR = Math.min(R * 1.35, Math.min(W, H) / 2 - 1);
    const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, GR);
    glow.addColorStop(0, 'rgba(123, 63, 209, 0.45)');
    glow.addColorStop(0.45, 'rgba(123, 63, 209, 0.12)');
    glow.addColorStop(1, 'rgba(123, 63, 209, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, GR, 0, Math.PI * 2); ctx.fill();

    // sphere body
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#4b1f88');
    body.addColorStop(0.55, '#2a0f4c');
    body.addColorStop(1, '#14062a');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // rim light
    ctx.strokeStyle = 'rgba(214, 190, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // graticule (latitude rings)
    ctx.lineWidth = 0.6;
    for (let la = -60; la <= 60; la += 30) {
      ctx.strokeStyle = 'rgba(200, 176, 236, 0.08)';
      ctx.beginPath();
      let pen = false;
      for (let lo = -180; lo <= 180; lo += 6) {
        const r = rotate(toVec(la, lo));
        if (r[2] < 0) { pen = false; continue; }
        const [x, y] = proj(r);
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    }

    // land dots
    // batched by brightness bucket (few fill-style changes = fast on phones)
    const ds = Math.max(1, R / 170) * 1.5, half = ds / 2;
    const l = -camLon * RAD, p = camLat * RAD, cl = Math.cos(l), sl = Math.sin(l), cp = Math.cos(p), sp = Math.sin(p);
    for (const bk of buckets) bk.length = 0;
    for (let i = 0; i < dots.length; i++) {
      const v = dots[i];
      const x1 = v[0] * cl + v[2] * sl, z1 = -v[0] * sl + v[2] * cl;
      const z2 = v[1] * sp + z1 * cp;
      if (z2 <= 0.02) continue;
      const y2 = v[1] * cp - z1 * sp;
      buckets[Math.min(BUCKETS - 1, Math.floor(z2 * BUCKETS))].push(cx + x1 * R - half, cy - y2 * R - half);
    }
    for (let k = 0; k < BUCKETS; k++) {
      const bk = buckets[k];
      if (!bk.length) continue;
      ctx.fillStyle = `rgba(226, 210, 255, ${(0.25 + ((k + 0.5) / BUCKETS) * 0.75).toFixed(2)})`;
      ctx.beginPath();
      for (let j = 0; j < bk.length; j += 2) ctx.rect(bk[j], bk[j + 1], ds, ds);
      ctx.fill();
    }

    // arcs
    arcs.forEach((pts, i) => {
      const active = i === focus;
      const appear = Math.min(1, Math.max(0, (t - 0.4 - i * 0.12) / 0.8)); // intro draw-in
      const n = Math.floor(pts.length * appear);
      if (n < 2) return;
      ctx.lineWidth = active ? 2.2 : 1.1;
      ctx.lineCap = 'round';
      let prev: readonly [number, number] | null = null;
      for (let k = 0; k < n; k++) {
        const r = rotate(pts[k]);
        const hidden = r[2] < 0 && Math.hypot(r[0], r[1]) < 1;
        const p = proj(r);
        if (prev && !hidden) {
          const f = k / pts.length;
          ctx.strokeStyle = active ? `rgba(255, ${Math.round(107 + 120 * f)}, ${Math.round(95 + 140 * f)}, 0.95)` : `rgba(255, 107, 95, ${0.28 + 0.2 * f})`;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
        prev = hidden ? null : p;
      }
    });

    // travelling plane on the active arc (with comet trail)
    if (focus >= 0 && !opts.reduced) {
      const ft = Math.min(1, Math.max(0, (now - flightStart) / 2600));
      if (ft > 0) {
        const pts = arcs[focus];
        const head = ease(ft) * (pts.length - 1);
        for (let k = 0; k < 18; k++) {
          const idx = head - k * 0.9;
          if (idx < 0) break;
          const a = pts[Math.floor(idx)], b = pts[Math.min(pts.length - 1, Math.ceil(idx))], f = idx % 1;
          const r = rotate([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
          if (r[2] < 0 && Math.hypot(r[0], r[1]) < 1) continue;
          const [x, y] = proj(r);
          const s = k === 0 ? 4.2 : 3 * (1 - k / 18);
          ctx.fillStyle = k === 0 ? '#ffffff' : `rgba(255, 140, 128, ${0.6 * (1 - k / 18)})`;
          if (k === 0) { ctx.shadowColor = '#ff6b5f'; ctx.shadowBlur = 16; }
          ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // markers
    const marker = (v: V3, label: string, color: string, big: boolean, pulse: number) => {
      const r = rotate(v);
      if (r[2] < 0.05) return;
      const [x, y] = proj(r);
      const ph = (t * 0.9 + pulse) % 1;
      if (!opts.reduced) {
        ctx.strokeStyle = color.replace('1)', `${(1 - ph) * 0.8})`);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 4 + ph * (big ? 22 : 14), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.shadowColor = color; ctx.shadowBlur = big ? 18 : 10;
      ctx.beginPath(); ctx.arc(x, y, big ? 5 : 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (!big) return;
      ctx.font = `750 12px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
      const tw = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(18, 5, 31, 0.72)';
      ctx.beginPath(); ctx.roundRect(x - tw / 2, y + 12, tw, 20, 10); ctx.fill();
      ctx.strokeStyle = color.replace('1)', '0.7)'); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 22.5); ctx.textBaseline = 'alphabetic';
    };
    dests.forEach((d, i) => marker(dVecs[i], d.name, i === focus ? 'rgba(255, 107, 95, 1)' : 'rgba(214, 190, 255, 1)', i === focus, i * 0.17));
    marker(oVec, origin.name, 'rgba(204, 2, 0, 1)', true, 0);

    // specular highlight
    const spec = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, 0, cx - R * 0.45, cy - R * 0.5, R * 0.9);
    spec.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spec;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  };

  // ---- animation loop ----
  let running = true, visible = true, raf = 0;
  const loop = (now: number) => {
    raf = 0;
    if (!running || !visible) return;
    if (!dragging) {
      if (now < userUntil) {
        camLon += velLon; velLon *= 0.95;
      } else if (resumeTour) {
        resumeTour = false;
        setFocus((focus + 1) % dests.length, now);
      } else {
        if (focus < 0 || now - focusStart > 5200) setFocus((focus + 1) % dests.length, now);
        const k = ease(Math.min(1, (now - focusStart) / 1600));
        camLon = lerpAngle(flyFrom.lon, flyTo.lon, k) + Math.sin(now / 4000) * 1.5;
        camLat = flyFrom.lat + (flyTo.lat - flyFrom.lat) * k;
      }
    }
    drawFrame(now);
    raf = requestAnimationFrame(loop);
  };

  if (opts.reduced) {
    // static, still informative frame
    setFocus(0, performance.now());
    camLon = flyTo.lon; camLat = flyTo.lat;
    const still = () => drawFrame(performance.now() + 99999);
    still();
    new ResizeObserver(still).observe(host);
  } else {
    raf = requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(host);
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(loop);
    });

    // drag to spin
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; velLon = 0;
      canvas.setPointerCapture(e.pointerId);
      host.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      velLon = -dx * 0.35;
      camLon += velLon;
      camLat = Math.max(-30, Math.min(60, camLat + dy * 0.25));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      host.classList.remove('is-dragging');
      userUntil = performance.now() + 4000; // let it coast, then continue the tour
      resumeTour = true;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }
  host.classList.add('ready');

  return { focusOn: (i: number) => setFocus(i, performance.now()) };
}
