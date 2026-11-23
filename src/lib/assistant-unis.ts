/** Universities for the "Ask Destiny" assistant (about 4,500), served as a separate file loaded only when needed. */
import { dirCountries, dirInstUrl } from './universities-europe';
import { itUnis } from './italy';

export interface UniDoc { k: 'uni'; t: string; u: string; s?: string; c: string[]; w?: string }

export function universityDocs(): UniDoc[] {
  const out: UniDoc[] = [];
  for (const u of itUnis) out.push({ k: 'uni', t: u.name, u: `/universities/italy/${u.slug}/`, s: `${u.city}, Italy`, c: ['italy'], ...(u.short && u.short !== u.name ? { w: u.short } : {}) });
  for (const dc of dirCountries) for (const i of dc.institutions) out.push({ k: 'uni', t: i.name, u: dirInstUrl(dc, i), s: [i.city, dc.name].filter(Boolean).join(', '), c: [dc.slug], ...(i.localName ? { w: i.localName } : {}) });
  return out;
}
