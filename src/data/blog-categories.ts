/**
 * Blog categories. Every post's `category` must be one of these slugs (checked by scripts/validate-blog.mjs).
 * Each category has its own crawlable page at /blog/category/<slug>/.
 */
export interface BlogCategory {
  slug: string;
  label: string;
  icon: string;
  description: string;
}

export const blogCategories: BlogCategory[] = [
  { slug: 'scholarships', label: 'Scholarships', icon: 'award', description: 'New and upcoming scholarship calls, deadlines and funding explained — checked against official sources.' },
  { slug: 'bachelors-masters', label: 'Bachelor’s & master’s', icon: 'graduation', description: 'Degree programmes, admissions windows and application tips for bachelor’s and master’s study abroad.' },
  { slug: 'phd-postdoc', label: 'PhD & postdoc', icon: 'book', description: 'Funded PhD positions, postdoctoral calls, fellowships and research careers.' },
  { slug: 'conferences', label: 'Conferences & events', icon: 'calendar', description: 'Funded conferences, summits, summer schools and youth programmes — with warnings about fake events.' },
  { slug: 'visas-country-rules', label: 'Visas & country rules', icon: 'passport', description: 'Study visa rules, proof of funds, residence permits and policy changes by country.' },
  { slug: 'announcements', label: 'Announcements', icon: 'sparkle', description: 'Results, official announcements and news that affect international students.' },
  { slug: 'guides', label: 'How-to', icon: 'compass', description: 'Practical, step-by-step advice for documents, letters, interviews and planning.' },
];

export const categoryBySlug: Record<string, BlogCategory> = Object.fromEntries(blogCategories.map((c) => [c.slug, c]));
