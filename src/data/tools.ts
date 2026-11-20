import { site } from '../config/site';
export interface ToolLink { href: string; label: string; text: string; icon: string; cta: string; external?: boolean }
export const tools: ToolLink[] = [
  { href: '/tools/eligibility/', label: 'Scholarship eligibility checker', text: 'Answer eight questions and see which major scholarships you meet the published requirements for — and why.', icon: 'target', cta: 'Check my eligibility' },
  { href: '/tools/grade-converter/', label: 'Grade converter', text: 'Convert your CGPA or percentage to the German grade with the official Bavarian formula.', icon: 'sliders', cta: 'Convert my grade' },
  { href: '/tools/planner/', label: 'Application planner', text: 'A dated plan and checklist for every application, counting back from the deadline — with calendar reminders.', icon: 'route', cta: 'Plan my applications' },
  { href: '/tools/visa-money/', label: 'Visa money calculator', text: 'How much money you must show for a student visa in Germany, the UK, Canada, Australia, Ireland and New Zealand.', icon: 'passport', cta: 'Calculate' },
  { href: '/tools/checklists/', label: 'Printable checklists', text: 'One-page checklists for each scholarship — eligibility, documents and steps — to print or save as PDF.', icon: 'file', cta: 'Open checklists' },
  site.bookingUrl
    ? { href: site.bookingUrl, label: 'Book a free consultation', text: 'Pick a time that suits you for a call with our team.', icon: 'calendar', cta: 'Choose a time', external: true }
    : { href: '/contact/', label: 'Request a consultation', text: 'Send us your questions and preferred time — we will reply to arrange a call.', icon: 'calendar', cta: 'Send a request' },
  ...(site.whatsappChannel ? [{ href: site.whatsappChannel, label: 'Deadline alerts on WhatsApp', text: 'Follow our WhatsApp Channel for new scholarships and deadlines every week.', icon: 'whatsapp', cta: 'Follow the channel', external: true }] : []),
  { href: '/start-here/', label: 'Start here — how to use this site', text: 'A quick guide for students and parents: what you will find here, how to apply and which tools to use.', icon: 'compass', cta: 'Read the guide' },
  ...(site.prices.length ? [{ href: '/tools/prices/', label: 'Service prices', text: 'Transparent prices for our consultancy services.', icon: 'badge', cta: 'See prices' }] : []),
];
