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
    /** TODO: add the registered office address exactly as filed at Companies House. */
    registeredOffice: '',
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
    /** Optional public phone number for display, e.g. "+92 300 1234567". */
    phone: '+44 7877 186998',
    /** Only fill these if confirmed; they are hidden when empty. */
    officeAddress: '27 Old Gloucester Street, London, United Kingdom',
    /** Offices shown on the contact page (as published on the company's previous website). */
    offices: [
      { label: 'UK office', address: '27 Old Gloucester Street, London, United Kingdom', hours: 'Monday–Friday, 9:00–17:00' },
      { label: 'Pakistan office', address: 'Broadway Commercial, DHA Phase 8, Lahore, Pakistan', hours: 'Monday–Sunday, 9:00–19:00' },
    ] as { label: string; address: string; hours: string }[],
    responseTime: '',
  },

  /** Social profiles — paste full URLs. Empty values are hidden. */
  social: {
    facebook: 'https://www.facebook.com/destinyglobals',
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
  whatsappChannel: '',
  /**
   * Optional public price list for consultancy services. Shown on /tools/prices/ and the Services page
   * only when at least one entry exists. Example: { service: 'Scholarship application review', price: 'PKR 15,000', note: 'One scholarship' }
   */
  prices: [] as { service: string; price: string; note?: string }[],

  /** Date display. Uses the visitor's browser locale rules for this language tag. */
  dateLocale: 'en-GB',
  dateFormat: { day: 'numeric', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions,

  /** A deadline within this many days shows a "Closing soon" badge. */
  closingSoonDays: 30,
} as const;

export type SiteConfig = typeof site;
