/** Labels for the codes used inside scholarships.json. Add new keys here when you add new values. */

export const degreeLabels: Record<string, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: 'PhD',
  research: 'Research / Non-degree research',
  'non-degree': 'Non-degree & language',
};

export const subjectLabels: Record<string, string> = {
  any: 'All subjects',
  engineering: 'Engineering & Technology',
  sciences: 'Natural Sciences',
  'economics-business': 'Economics & Business',
  'law-politics': 'Law, Politics & Governance',
  'social-sciences': 'Social Sciences',
  'health-medicine': 'Health & Medicine',
  'environment-agriculture': 'Environment & Agriculture',
  humanities: 'Arts & Humanities',
};

export type FundingType =
  | 'fully-funded'
  | 'partially-funded'
  | 'tuition-only'
  | 'stipend-based'
  | 'varies';

export const fundingLabels: Record<FundingType, string> = {
  'fully-funded': 'Fully funded',
  'partially-funded': 'Partially funded',
  'tuition-only': 'Tuition only',
  'stipend-based': 'Stipend / allowance',
  varies: 'Funding varies',
};

export const fundingDescriptions: Record<FundingType, string> = {
  'fully-funded': 'Official information describes tuition plus living costs (and usually more) as covered.',
  'partially-funded': 'Covers some costs (e.g. tuition and a stipend) but you pay others such as travel or housing.',
  'tuition-only': 'Covers tuition fees only.',
  'stipend-based': 'Pays a monthly allowance; tuition may or may not be waived.',
  varies: 'Coverage depends on the category or programme — check the official source.',
};

export const providerTypeLabels: Record<string, string> = {
  government: 'Government',
  university: 'University',
  intergovernmental: 'International / Intergovernmental',
  foundation: 'Foundation',
};

export type StatusKey = 'open' | 'closing-soon' | 'upcoming' | 'closed' | 'varies' | 'unconfirmed';

export const statusLabels: Record<StatusKey, string> = {
  open: 'Open',
  'closing-soon': 'Closing soon',
  upcoming: 'Opening soon',
  closed: 'Closed for this cycle',
  varies: 'Deadlines vary',
  unconfirmed: 'Cycle not yet confirmed',
};

export const verificationLabels: Record<string, string> = {
  official: 'Verified on official source',
  partial: 'Partly verified',
  'needs-verification': 'Needs verification',
};
