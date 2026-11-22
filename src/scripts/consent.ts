/**
 * Google Analytics with consent. The Google script is only added after the visitor clicks Accept.
 * The choice is remembered in this browser (localStorage key "dg-consent"); "Cookie settings" reopens the banner.
 */
const KEY = 'dg-consent';
const banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
const gaId = banner?.dataset.ga ?? '';

const read = (): string | null => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ } };

let loaded = false;
function loadGA() {
  if (loaded || !gaId) return;
  loaded = true;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() { w.dataLayer.push(arguments); };
  w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  w.gtag('js', new Date());
  w.gtag('config', gaId, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
}

function clearGaCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (/^_ga/.test(name)) for (const d of [location.hostname, '.' + location.hostname.replace(/^www\./, '')]) document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
  }
}

if (banner && gaId) {
  const choice = read();
  if (choice === 'granted') loadGA();
  else if (choice !== 'denied') banner.hidden = false;
  banner.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cookie-choice]');
    if (!btn) return;
    const v = btn.dataset.cookieChoice!;
    write(v);
    banner.hidden = true;
    if (v === 'granted') loadGA();
    else {
      if (loaded) (window as any).gtag?.('consent', 'update', { analytics_storage: 'denied' });
      clearGaCookies();
    }
  });
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-cookie-settings]')) { banner.hidden = false; banner.querySelector<HTMLElement>('[data-cookie-choice="granted"]')?.focus(); }
  });
} else {
  document.querySelectorAll<HTMLElement>('[data-cookie-settings]').forEach((el) => (el.hidden = true));
}
