/** The course-finder index as a separate, cacheable file (keeps the /find/ page itself light). */
import { buildIndex, destinationOptions, fLevels, fSubjects } from '../../lib/finder';
export function GET() {
  const items = buildIndex();
  const dests = destinationOptions(items);
  return new Response(JSON.stringify({ items, levels: fLevels, subjects: fSubjects, base: import.meta.env.BASE_URL, dests: Object.fromEntries(dests.map((d) => [d.slug, d.name])) }), { headers: { 'Content-Type': 'application/json' } });
}
