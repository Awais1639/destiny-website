/** Saved scholarships — stored only in this browser (localStorage). No account, nothing sent anywhere. */
const KEY = 'dgo:saved:v1';

export function getSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (private mode) — fail silently */
  }
  window.dispatchEvent(new CustomEvent('saved:change', { detail: list }));
}

export function isSaved(slug: string) {
  return getSaved().includes(slug);
}

export function toggleSaved(slug: string): boolean {
  const list = getSaved();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(slug);
  write(list);
  return i < 0;
}

export function clearSaved() {
  write([]);
}
