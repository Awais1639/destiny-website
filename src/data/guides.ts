/**
 * Guides: original, general advice. Never state official requirements here as facts —
 * link to official sources instead.
 */
export interface GuideSection {
  heading: string;
  body?: string[];
  list?: string[];
  checklist?: string[];
}
export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: 'Finding' | 'Applying' | 'Documents' | 'Visas' | 'Safety';
  readMinutes: number;
  sections: GuideSection[];
  related: string[]; // scholarship slugs
  references?: { label: string; url: string }[];
}

export const guides: Guide[] = [
  {
    slug: 'how-to-find-fully-funded-scholarships',
    title: 'How to find fully funded scholarships',
    description: 'A practical method for finding scholarships that genuinely cover your costs — and avoiding ones that only look generous.',
    category: 'Finding',
    readMinutes: 6,
    sections: [
      {
        heading: 'Start with the four big sources',
        body: [
          'Most fully funded opportunities come from four places: national governments (e.g. Türkiye, Hungary, Korea, the UK), multi-country programmes (e.g. Erasmus Mundus), universities’ own funds, and research-funded positions such as PhD studentships.',
          'Government schemes are usually the most accessible for students from Pakistan and other developing countries, because many reserve places by country.',
        ],
      },
      {
        heading: 'Read “fully funded” carefully',
        body: [
          'The phrase is used loosely online. Look at the official coverage list: tuition, monthly stipend, accommodation, travel, insurance. If any of these is missing, budget for it.',
        ],
        checklist: ['Tuition covered?', 'Monthly stipend amount stated?', 'Accommodation or housing allowance?', 'Flights?', 'Health insurance?'],
      },
      {
        heading: 'Work one year ahead',
        body: [
          'Many government scholarships close 9–12 months before the course starts. Build a calendar by month and add each scheme’s typical window — then confirm the real dates when the official call is published.',
        ],
      },
      {
        heading: 'Always go to the official source',
        body: ['Use aggregator websites for discovery only. Before you prepare documents, open the provider’s own page and read the current call in full.'],
      },
    ],
    related: ['turkiye-scholarships', 'stipendium-hungaricum', 'erasmus-mundus-joint-masters'],
  },
  {
    slug: 'how-to-apply-for-government-scholarships',
    title: 'How to apply for government scholarships',
    description: 'Understand nomination routes, embassy tracks and national agencies — the parts of government scholarships that confuse most applicants.',
    category: 'Applying',
    readMinutes: 7,
    sections: [
      {
        heading: 'Know your route',
        list: [
          'Direct online application (e.g. Türkiye Scholarships portal)',
          'Application plus nomination by a national body (e.g. Commonwealth Scholarships, Stipendium Hungaricum Sending Partners)',
          'Embassy route (e.g. MEXT, GKS Embassy track)',
          'University route (e.g. GKS University track, Eiffel through French institutions)',
        ],
      },
      {
        heading: 'Expect two deadlines',
        body: ['Where nomination is involved, your national body’s internal deadline is often weeks earlier than the scholarship’s final deadline. Plan for the earlier one.'],
      },
      {
        heading: 'Match the selection criteria',
        body: [
          'Government scholarships usually look for academic merit, leadership potential and a clear plan for how you will use your degree. Map each criterion to concrete evidence in your application.',
        ],
        checklist: ['Read the full official call', 'Identify your nominating/dispatching body', 'Note every deadline', 'Map criteria to evidence', 'Request recommendation letters early'],
      },
    ],
    related: ['commonwealth-masters-scholarships-2027', 'global-korea-scholarship-graduate', 'mext-research-scholarship-japan'],
  },
  {
    slug: 'how-to-prepare-a-scholarship-cv',
    title: 'How to prepare a scholarship CV',
    description: 'Turn your experience into a clear, two-page academic CV that selection committees can scan in a minute.',
    category: 'Documents',
    readMinutes: 5,
    sections: [
      {
        heading: 'Structure that works',
        list: ['Contact details and links', 'Education (with grades/CGPA)', 'Research or thesis', 'Professional experience', 'Publications, awards, leadership', 'Skills and languages'],
      },
      {
        heading: 'Write for evidence',
        body: ['Replace duties with results: “Coordinated a 40-student tutoring programme” is stronger than “Responsible for tutoring”. Use numbers where honest and verifiable.'],
      },
      {
        heading: 'Format check',
        checklist: ['Two pages or less (unless a format such as Europass is required)', 'Consistent dates and fonts', 'No photo unless requested', 'Saved as PDF with a clear file name'],
      },
    ],
    related: ['chevening-scholarships-2027', 'daad-epos-development-related-postgraduate-courses'],
  },
  {
    slug: 'how-to-write-a-motivation-letter',
    title: 'How to write a motivation letter',
    description: 'A clear structure for motivation letters and statements of purpose — with the mistakes to avoid.',
    category: 'Documents',
    readMinutes: 7,
    sections: [
      {
        heading: 'A simple five-part structure',
        list: [
          'Opening: the problem or question that drives you',
          'Background: the studies and experience that prepared you',
          'Fit: why this programme, these modules, this country',
          'Plan: what you will do after graduating',
          'Close: a confident, specific summary',
        ],
      },
      {
        heading: 'Be specific',
        body: ['Name modules, research groups or professors that genuinely match your interests. Generic praise of a university does not persuade anyone.'],
      },
      {
        heading: 'Before you submit',
        checklist: ['Within the word limit', 'Answers the exact prompt', 'Every claim is true and supported in your CV', 'Proofread by someone else', 'Written by you — not copied or generated wholesale'],
      },
    ],
    related: ['erasmus-mundus-joint-masters', 'stipendium-hungaricum'],
  },
  {
    slug: 'how-to-request-recommendation-letters',
    title: 'How to request recommendation letters',
    description: 'Who to ask, when to ask and what to give your referees so they can write a strong letter.',
    category: 'Documents',
    readMinutes: 4,
    sections: [
      { heading: 'Choose the right referees', body: ['Pick people who know your work well — a thesis supervisor or a manager who saw your results — rather than the most senior name you know.'] },
      { heading: 'Ask early', body: ['Give at least three to four weeks’ notice, more during busy periods.'] },
      {
        heading: 'Make it easy for them',
        checklist: ['Your CV and draft motivation letter', 'The scholarship name, deadline and submission method', 'Two or three achievements you hope they can mention', 'A polite reminder one week before the deadline'],
      },
    ],
    related: ['commonwealth-masters-scholarships-2027', 'fulbright-pakistan-degree-program'],
  },
  {
    slug: 'how-to-prepare-for-scholarship-interviews',
    title: 'How to prepare for scholarship interviews',
    description: 'Common question types and a preparation routine that builds genuine confidence.',
    category: 'Applying',
    readMinutes: 5,
    sections: [
      {
        heading: 'Expect these themes',
        list: ['Your motivation and choice of programme', 'Leadership and teamwork examples', 'How the degree fits your future plans', 'Knowledge of your field and of the host country', 'Questions about anything in your written application'],
      },
      { heading: 'Use structured examples', body: ['Prepare four or five short stories using Situation–Task–Action–Result. Each story can answer several questions.'] },
      { heading: 'Practise out loud', checklist: ['Two mock interviews', 'Test your camera, microphone and connection for online interviews', 'Re-read your full application the day before'] },
    ],
    related: ['chevening-scholarships-2027', 'turkiye-scholarships'],
  },
  {
    slug: 'how-to-organize-documents-for-international-admission',
    title: 'How to organise documents for international admission',
    description: 'A folder system and checklist so you never miss a document or upload the wrong version.',
    category: 'Documents',
    readMinutes: 4,
    sections: [
      {
        heading: 'One master folder',
        list: ['01 Identity (passport data page)', '02 Academic (degrees, transcripts, translations)', '03 Language (test reports)', '04 Letters (recommendations, motivation)', '05 Applications (one sub-folder per programme)'],
      },
      {
        heading: 'Typical documents to prepare early',
        checklist: ['Degree certificates and transcripts', 'Certified translations, if required', 'Attestation or legalisation, if the destination requires it', 'Language test results', 'Updated CV'],
        body: ['Requirements differ by country and programme — always confirm against the official application instructions.'],
      },
    ],
    related: ['russian-government-scholarship-quota', 'italian-government-scholarships-maeci'],
  },
  {
    slug: 'how-to-understand-study-visa-requirements',
    title: 'How to understand study visa requirements',
    description: 'How to read official visa guidance and avoid relying on hearsay — general orientation, not legal advice.',
    category: 'Visas',
    readMinutes: 5,
    sections: [
      {
        heading: 'Go to the authority’s own website',
        body: ['Every country publishes its visa rules through a government website or the embassy in your country. Third-party pages and social media may be outdated.'],
      },
      {
        heading: 'Common elements (they vary by country)',
        list: ['Proof of admission', 'Proof of funds or scholarship', 'Valid passport', 'Health insurance', 'Biometrics or interview'],
      },
      { heading: 'Plan the timeline', body: ['Processing times change with seasons. Check the authority’s published processing times and apply as early as its rules allow.'] },
    ],
    related: ['commonwealth-masters-scholarships-2027'],
    references: [
      { label: 'GOV.UK — Student visa', url: 'https://www.gov.uk/student-visa' },
      { label: 'France-Visas (official)', url: 'https://france-visas.gouv.fr/' },
      { label: 'U.S. Department of State — Student visa', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html' },
    ],
  },
  {
    slug: 'common-scholarship-application-mistakes',
    title: 'Common scholarship application mistakes',
    description: 'The avoidable errors that cost applicants their place — and how to prevent each one.',
    category: 'Applying',
    readMinutes: 4,
    sections: [
      {
        heading: 'Mistakes we see most',
        list: [
          'Missing the nominating body’s earlier internal deadline',
          'Using last year’s requirements or forms',
          'Generic motivation letters reused across schemes',
          'Inconsistent names or dates across documents',
          'Uploading unreadable scans',
          'Applying when not eligible (age, nationality, degree date)',
        ],
      },
      { heading: 'The fix', checklist: ['Read the full current call', 'Make an eligibility table before writing', 'Tailor every essay', 'Check names/dates against your passport', 'Submit days before the deadline'] },
    ],
    related: ['global-korea-scholarship-graduate', 'turkiye-scholarships'],
  },
  {
    slug: 'how-to-identify-scholarship-scams',
    title: 'How to identify scholarship scams',
    description: 'Warning signs of fake scholarships and dishonest agents — and how to protect yourself.',
    category: 'Safety',
    readMinutes: 5,
    sections: [
      {
        heading: 'Red flags',
        list: [
          'A “guaranteed” scholarship, admission or visa',
          'Fees to “unlock” or “process” a government scholarship',
          'Pressure to pay quickly or keep things secret',
          'Email addresses that don’t match the provider’s official domain',
          'Requests for passwords or bank PINs',
        ],
      },
      {
        heading: 'Protect yourself',
        checklist: [
          'Find the scholarship on the provider’s official website yourself',
          'Never share account passwords',
          'Ask for written terms for any paid service',
          'Report suspicious messages to the provider or authority being impersonated',
        ],
      },
      {
        heading: 'How we work',
        body: [
          'Destiny Global Solutions Limited is an independent consultancy. We cannot guarantee any admission, scholarship or visa, and official government scholarships never require you to pay an agent.',
        ],
      },
    ],
    related: ['chinese-government-scholarship-csc', 'turkiye-scholarships'],
  },
  {
    slug: 'how-to-spot-fake-conferences',
    title: 'How to spot fake and predatory conferences',
    description: 'Warning signs of fake “international conferences”, paid invitation letters and predatory events — and how to check a conference before you apply or pay.',
    category: 'Safety',
    readMinutes: 6,
    sections: [
      {
        heading: 'Why this matters',
        body: [
          'Many emails invite students and researchers to “international conferences” that exist mainly to collect registration fees. Some never take place, some have no real peer review, and some sell invitation letters that people then use for visa applications. Attending one wastes money, can harm your academic record, and a visa officer may treat a dubious invitation as a red flag.',
        ],
      },
      {
        heading: 'Red flags',
        list: [
          'An unsolicited email inviting you to speak or chair a session outside your field',
          'Acceptance within a day or two, or “guaranteed acceptance” once you pay',
          'A huge list of unrelated topics (medicine, engineering, business and arts at one event)',
          'Organiser names that copy well-known societies, or no named organising committee you can verify',
          'Hotel venues booked “to be announced”, or the same event running in many cities every month',
          'Invitation letters or “visa support” offered as the main benefit, often for an extra fee',
          'Publication “guaranteed” in a journal that is not indexed where it claims to be',
          'Pressure to pay quickly, or payment only by personal transfer',
        ],
      },
      {
        heading: 'Check a conference before you apply',
        checklist: [
          'Find the organiser yourself: a recognised university, academic society, international organisation or research institute — not just a company name',
          'Look for earlier editions with real programmes, speakers and photos on the organiser’s own website',
          'Check that named committee members exist and list the conference on their own university pages',
          'Ask your supervisor or department whether the event is respected in your field',
          'Read the refund, cancellation and travel-grant terms before paying anything',
          'Apply for travel grants only through the conference’s official website or the funder’s own portal',
        ],
      },
      {
        heading: 'Funded opportunities are competitive',
        body: [
          'Genuine travel grants and fully funded summits are selective: you apply, they review, and many applicants are not chosen. No one can guarantee you a funded place. If someone offers a “guaranteed fully funded conference” in exchange for a fee, treat it as a scam.',
        ],
      },
      {
        heading: 'How we work',
        body: [
          'Our Conferences & Summits page lists only events run by established organisers, linked to the organiser’s own website. Destiny Global Solutions Limited is an independent consultancy and cannot guarantee selection for any event or grant.',
        ],
      },
    ],
    related: [],
  },
];

export const guideBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));
