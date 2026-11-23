/**
 * ============================================================================
 *  CENTRAL CONFIGURATION — edit this one file to change contact details,
 *  social links, brand wording and date formatting across the whole website.
 * ============================================================================
 *
 *  Rules:
 *  - Leave a value as an empty string ("") if you do not have it yet.
 *    The website hides any button/link whose value is empty, so nothing breaks.
 *  - Never put passwords or secret API keys here — this file is public.
 */

export const site = {
  /** Legal company name (shown in footer, legal pages). */
  companyName: 'Destiny Global Solutions Limited',
  /** Platform / product name used in the header and page titles. */
  platformName: 'Destiny Global Opportunities',
  shortName: 'Destiny Global',
  tagline: 'Discover Opportunities. Unlock Your Future.',
  mission:
    'Making global education and international opportunities easier to discover, understand, and access.',

  /** Company registration (from the company's own incorporation summary). */
  registration: {
    number: '16628547',
    jurisdiction: 'England and Wales',
    /** Registered office as recorded in the company register. */
    registeredOffice: '27 Old Gloucester Street, London, WC1N 3AX, United Kingdom',
  },

  contact: {
    /**
     * Business email used for inquiry drafts. This is the company's registered email
     * from its incorporation summary — change it if you prefer a different inbox
     * (for example info@destinyglobals.com).
     */
    email: 'contact@destinyglobals.com',
    /**
     * TODO: WhatsApp number in international format, digits only, no "+" or spaces.
     * Example format: 923001234567  (left empty = WhatsApp buttons are hidden).
     */
    whatsapp: '',
    /**
     * WhatsApp Business short link (wa.me/message/...). Used when no number is set above.
     * Note: this kind of link cannot carry a pre-filled message, so forms copy the message for the visitor to paste.
     */
    whatsappUrl: 'https://wa.me/message/KHX44PI3N4JPH1',
    /** Optional public phone number for display, e.g. "+92 300 1234567". */
    phone: '+44 7877 186998',
    /** Only fill these if confirmed; they are hidden when empty. */
    officeAddress: '27 Old Gloucester Street, London, WC1N 3AX, United Kingdom',
    /** Offices shown on the contact page (as published on the company's previous website). */
    offices: [
      { label: 'UK office', address: '27 Old Gloucester Street, London, WC1N 3AX, United Kingdom', hours: 'Monday–Friday, 9:00–17:00' },
      { label: 'Pakistan office', address: 'Broadway Commercial, DHA Phase 8, Lahore, Pakistan', hours: 'Monday–Sunday, 9:00–19:00' },
    ] as { label: string; address: string; hours: string }[],
    responseTime: '',
  },

  /** Social profiles — paste full URLs. Empty values are hidden. */
  social: {
    facebook: 'https://www.facebook.com/destinyglobals1',
    instagram: 'https://www.instagram.com/destinyglobals/',
    linkedin: 'https://www.linkedin.com/company/destiny-global-solutions-limited/',
    youtube: 'https://www.youtube.com/@DestinyGlobals',
    tiktok: 'https://www.tiktok.com/@destinyglobals',
    pinterest: 'https://www.pinterest.com/destinyglobals/',
    x: '',
  },

  /**
   * Tools page extras — leave empty to hide.
   * bookingUrl: a free Google Calendar "appointment schedule" booking page link
   *   (Google Calendar → Create → Appointment schedule → Share → copy the booking page link).
   * whatsappChannel: the invite link of your WhatsApp Channel (WhatsApp → Updates → Create channel → Share link).
   */
  bookingUrl: '',
  whatsappChannel: 'https://whatsapp.com/channel/0029VbBVvWOFCCoTY0i9eZ0z',
  /**
   * Optional public price list for consultancy services. Shown on /tools/prices/ and the Services page
   * only when at least one entry exists. Example: { service: 'Scholarship application review', price: 'PKR 15,000', note: 'One scholarship' }
   */
  prices: [] as { service: string; price: string; note?: string }[],

  /**
   * Search engine ownership checks (free). Paste only the code from the meta tag, e.g. for
   * <meta name="google-site-verification" content="abc123"> paste 'abc123'.
   * Google Search Console: https://search.google.com/search-console — Bing Webmaster Tools: https://www.bing.com/webmasters
   */
  googleSiteVerification: '',
  /**
   * Cloudflare Web Analytics (free, cookie-free visitor statistics). Dashboard: dash.cloudflare.com → Analytics → Web analytics.
   * Leave empty to switch analytics off.
   */
  cloudflareAnalyticsToken: '1a9ff166d94648ffbb15e06b3dbac5df',
  /**
   * Google Analytics 4 measurement ID. It only loads after a visitor clicks "Accept" on the cookie banner
   * (required by UK/EU law). Leave empty to remove Google Analytics and the banner.
   */
  googleAnalyticsId: 'G-3XK18BL4EP',
  bingSiteVerification: '',
  /**
   * Google AdSense (OFF until filled in). After AdSense approves the site, paste your publisher ID,
   * e.g. 'ca-pub-1234567890123456'. That one change turns on: the AdSense verification tag, the AdSense
   * script on every page, /ads.txt, ad spaces in the blog, the security policy for Google ads and the
   * advertising section of the privacy policy. See README → "Google AdSense".
   */
  adsenseClient: '',
  /**
   * Live university lookup for the "Ask Destiny" assistant (Cloudflare Worker in /worker, free plan).
   * Paste the Worker address after the first deploy, e.g. 'https://destiny-ask.example.workers.dev'.
   * Empty = the "Check live on the official website" button is hidden.
   */
  assistantApi: '',
  /** Optional ad unit IDs (AdSense → Ads → By ad unit). Empty = Auto ads decide placement. */
  adsenseSlots: { inArticle: '', listing: '' },

  /** Date display. Uses the visitor's browser locale rules for this language tag. */
  dateLocale: 'en-GB',
  dateFormat: { day: 'numeric', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions,

  /** A deadline within this many days shows a "Closing soon" badge. */
  closingSoonDays: 30,
} as const;

export type SiteConfig = typeof site;
