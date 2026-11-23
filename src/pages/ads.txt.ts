import type { APIRoute } from 'astro';
import { site } from '../config/site';

// Authorized Digital Sellers file. Google AdSense checks it once the publisher ID is set in src/config/site.ts.
export const GET: APIRoute = () => {
  const client = (site as unknown as { adsenseClient?: string }).adsenseClient ?? '';
  const pub = /^ca-pub-(\d{10,20})$/.exec(client)?.[1];
  const body = pub
    ? `google.com, pub-${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# destinyglobals.com does not sell advertising through any partner yet.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
