import type { APIRoute, GetStaticPaths } from 'astro';
import { calItems, buildIcs, eventText, type CalItem } from '../../../lib/calendar';

export const getStaticPaths: GetStaticPaths = () =>
  calItems.map((it) => ({ params: { kind: it.kind, slug: it.slug }, props: { it } }));

export const GET: APIRoute = ({ props, site }) => {
  const it = (props as { it: CalItem }).it;
  const pageUrl = new URL(`/${it.kind}/${it.slug}/`, site).href;
  const { summary, details } = eventText(it.title, it.provider, pageUrl, it.info);
  const body = buildIcs({ uid: `${it.kind}-${it.slug}-${it.deadline}@destinyglobals.com`, summary, details, deadline: it.deadline, url: pageUrl });
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
