/** Structured data (schema.org JSON-LD) shared across the site — helps Google, Bing and AI answer engines
 *  understand who runs the website and what each page is about. Only facts that are on the page are used. */
import { site } from '../config/site';

const SITE = 'https://destinyglobals.com';
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

const sameAs = [...Object.values(site.social), site.whatsappChannel].filter((u) => /^https:\/\//.test(u));

export const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.companyName,
  legalName: site.companyName,
  alternateName: [site.platformName, site.shortName, 'Destiny Globals'],
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/brand/icon-512.png`, width: 512, height: 512 },
  image: `${SITE}/og-image.png`,
  description: site.mission,
  slogan: site.tagline,
  email: site.contact.email,
  ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  foundingDate: '2025-08-05',
  identifier: { '@type': 'PropertyValue', propertyID: 'Companies House company number', value: site.registration.number },
  address: { '@type': 'PostalAddress', streetAddress: '27 Old Gloucester Street', addressLocality: 'London', postalCode: 'WC1N 3AX', addressCountry: 'GB' },
  areaServed: 'Worldwide',
  knowsAbout: ['Fully funded scholarships', 'Study abroad', 'University admissions', 'Student visas', 'PhD positions', 'Research fellowships', 'Erasmus Mundus', 'Studying in Italy', 'ECTS credits', 'Scholarship applications'],
  sameAs,
};

export const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: site.platformName,
  alternateName: site.shortName,
  url: `${SITE}/`,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/find/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
};

/** Strip HTML tags from short rich-text answers (FAQ). */
export const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const faqPage = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((it) => ({ '@type': 'Question', name: plain(it.q), acceptedAnswer: { '@type': 'Answer', text: plain(it.a) } })),
});
