/**
 * Blog posts: one Markdown file per post in src/blog/<slug>.md (front matter + body).
 * See .claude/agents/blog-writer.md for the writing rules and scripts/validate-blog.mjs for the checks.
 */
import type { MarkdownHeading } from 'astro';
import { categoryBySlug, type BlogCategory } from '../data/blog-categories';

export interface BlogFrontmatter {
  title: string;
  seoTitle?: string;
  description: string;
  date: string; // YYYY-MM-DD (publication day, Italian time)
  updated?: string;
  category: string;
  keywords: string[]; // first = focus keyword
  hashtags: string[];
  sources: { label: string; url: string }[];
  related?: { label: string; href: string }[]; // internal pages, e.g. { label: 'Stipendium Hungaricum', href: '/scholarships/stipendium-hungaricum/' }
  faq?: { q: string; a: string }[];
  status?: 'verified' | 'unconfirmed';
  draft?: boolean;
}

interface MdModule {
  frontmatter: BlogFrontmatter;
  file: string;
  Content: any;
  rawContent: () => string;
  getHeadings: () => MarkdownHeading[];
}

const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

const mods = import.meta.glob<MdModule>('../blog/*.md', { eager: true });

export interface Post extends BlogFrontmatter {
  slug: string;
  href: string;
  cat: BlogCategory;
  words: number;
  readMinutes: number;
  Content: any;
  headings: MarkdownHeading[];
}

export const posts: Post[] = Object.entries(mods)
  .map(([path, m]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    const words = m.rawContent().replace(/[#>*_`|\-\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
    return {
      ...m.frontmatter,
      date: day(m.frontmatter.date),
      updated: m.frontmatter.updated ? day(m.frontmatter.updated) : undefined,
      slug,
      href: `/blog/${slug}/`,
      cat: categoryBySlug[m.frontmatter.category],
      words,
      readMinutes: Math.max(2, Math.round(words / 220)),
      Content: m.Content,
      headings: m.getHeadings(),
    } as Post;
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

export const postsIn = (cat: string) => posts.filter((p) => p.category === cat);

/** Related posts: same category first, then shared keywords, then newest. */
export function relatedPosts(p: Post, n = 3): Post[] {
  const kw = new Set(p.keywords.map((k) => k.toLowerCase()));
  return posts
    .filter((x) => x.slug !== p.slug)
    .map((x) => ({ x, score: (x.category === p.category ? 2 : 0) + x.keywords.filter((k) => kw.has(k.toLowerCase())).length }))
    .sort((a, b) => b.score - a.score || b.x.date.localeCompare(a.x.date))
    .slice(0, n)
    .map((r) => r.x);
}

export const formatPostDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** ISO timestamp for 14:00 Italian time on the given day (posts go live at 2 p.m. in Italy). */
export function romeIso(d: string, time = '14:00'): string {
  const probe = new Date(`${d}T12:00:00Z`);
  const off = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', timeZoneName: 'longOffset' })
    .formatToParts(probe).find((x) => x.type === 'timeZoneName')?.value.replace('GMT', '') || '+01:00';
  return `${d}T${time}:00${off === '' ? '+00:00' : off}`;
}
