/**
 * Blog posts: one Markdown file per post in src/blog/<slug>.md (front matter + body).
 * See .claude/agents/blog-writer.md for the writing rules and scripts/validate-blog.mjs for the checks.
 */
import type { MarkdownHeading } from 'astro';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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
  /** Free stock photo (Unsplash or Pexels). Downloaded at publish time by scripts/fetch-blog-images.mjs and served from our own site. */
  image?: { url: string; alt: string; credit: string; creditUrl: string };
}

/** Author shown on every post. */
export const BLOG_AUTHOR = 'DGSL';

/** Self-hosted image files for a post (present only when the download step has run). */
export interface PostImage { alt: string; credit: string; creditUrl: string; source: 'Unsplash' | 'Pexels'; sm: string; lg: string; og: string; w: number; h: number }
export const IMG_SIZES = { sm: [640, 360], lg: [1280, 720], og: [1200, 630] } as const;

interface MdModule {
  frontmatter: BlogFrontmatter;
  file: string;
  Content: any;
  rawContent: () => string;
  getHeadings: () => MarkdownHeading[];
}

const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

const mods = import.meta.glob<MdModule>('../blog/*.md', { eager: true });
// Which downloaded images exist (public/blog-img/<slug>-{sm,lg,og}.jpg). Missing files = no photo shown.
const imgDir = join(process.cwd(), 'public', 'blog-img');
const files = new Set(existsSync(imgDir) ? readdirSync(imgDir) : []);

export interface Post extends BlogFrontmatter {
  slug: string;
  href: string;
  cat: BlogCategory;
  words: number;
  readMinutes: number;
  Content: any;
  headings: MarkdownHeading[];
  img?: PostImage;
  /** Internal pages this post links to (body links + related). */
  links: string[];
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
      img: imgFor(slug, m.frontmatter.image),
      links: [...new Set([...m.rawContent().matchAll(/\]\((\/[^)#\s]*)/g)].map((x) => x[1]).concat((m.frontmatter.related ?? []).map((r) => r.href)))],
    } as Post;
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

function imgFor(slug: string, im?: BlogFrontmatter['image']): PostImage | undefined {
  if (!im?.url || !['sm', 'lg', 'og'].every((k) => files.has(`${slug}-${k}.jpg`))) return undefined;
  return {
    alt: im.alt, credit: im.credit, creditUrl: im.creditUrl,
    source: /pexels\.com/.test(im.url) ? 'Pexels' : 'Unsplash',
    sm: `/blog-img/${slug}-sm.jpg`, lg: `/blog-img/${slug}-lg.jpg`, og: `/blog-img/${slug}-og.jpg`,
    w: IMG_SIZES.lg[0], h: IMG_SIZES.lg[1],
  };
}

/** Posts that link to a page on our site — shown on that page as "In the blog" (internal links help SEO). */
export const postsLinkingTo = (path: string, n = 3) => posts.filter((p) => p.links.includes(path)).slice(0, n);

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
