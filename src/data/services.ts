export interface Service {
  slug: string;
  title: string;
  short: string;
  icon: string; // icon name in Icon.astro
  group: 'education' | 'visa' | 'relocation';
  intro: string;
  forWho: string[];
  help: string[];
  process: string[];
  documents: string[];
}

export const services: Service[] = [
  {
    slug: 'student-consultancy',
    title: 'Student Consultancy',
    short: 'A personal plan for where, what and when to study abroad.',
    icon: 'compass',
    group: 'education',
    intro:
      'Not sure which country, degree or scholarship fits your profile? We review your background and goals and help you build a realistic, step-by-step study-abroad plan.',
    forWho: ['Students starting to explore study abroad', 'Graduates comparing countries and costs', 'Parents supporting a student’s decision'],
    help: [
      'Profile review: academic record, test scores, experience',
      'Shortlisting countries, programmes and scholarships that match your profile',
      'A timeline of deadlines and preparation tasks',
      'Budget planning: tuition, living costs and funding gaps',
    ],
    process: ['Initial inquiry', 'Profile and goals review', 'Personalised shortlist and timeline', 'Follow-up as you prepare'],
    documents: ['Transcripts and degree certificates', 'CV', 'Test scores (if available)', 'Passport copy (data page only, when needed)'],
  },
  {
    slug: 'university-admission-assistance',
    title: 'University Admission Assistance',
    short: 'Organised, well-presented applications to the right universities.',
    icon: 'graduation',
    group: 'education',
    intro:
      'We help you prepare strong, complete admission applications — from choosing programmes to checking every document before you submit through the university’s official portal.',
    forWho: ['Bachelor’s, master’s and PhD applicants', 'Applicants unfamiliar with a country’s application system'],
    help: [
      'Programme selection and entry-requirement checks',
      'Statement of purpose / motivation letter feedback',
      'CV formatting for academic applications',
      'Document checklists and submission review',
    ],
    process: ['Inquiry', 'Programme shortlist', 'Document preparation and review', 'You submit on the official portal', 'Offer and next steps'],
    documents: ['Transcripts and degrees', 'CV', 'Motivation letter drafts', 'Language certificates', 'Recommendation letters'],
  },
  {
    slug: 'scholarship-application-assistance',
    title: 'Scholarship Application Assistance',
    short: 'Support preparing scholarship applications — you stay in control.',
    icon: 'award',
    group: 'education',
    intro:
      'Competitive scholarships reward clear, well-evidenced applications. We help you understand requirements and prepare your materials; you submit through the provider’s official system.',
    forWho: ['Applicants to government, university and EU scholarships', 'Candidates who want a second pair of eyes on essays'],
    help: [
      'Eligibility check against the official criteria',
      'Essay and motivation-letter feedback',
      'Interview preparation sessions',
      'Deadline and document tracking',
    ],
    process: ['Inquiry naming the scholarship', 'Eligibility check', 'Drafting and feedback rounds', 'Final review before you submit officially'],
    documents: ['Scholarship-specific forms', 'Essays', 'Recommendation letters', 'Transcripts and certificates'],
  },
  {
    slug: 'study-visa-assistance',
    title: 'Study Visa Assistance',
    short: 'Help understanding and organising your student visa file.',
    icon: 'passport',
    group: 'visa',
    intro:
      'After an offer comes the visa. We help you understand the official requirements for your destination and organise a complete, consistent document file.',
    forWho: ['Students with an admission offer', 'Scholarship winners preparing to travel'],
    help: [
      'Walkthrough of the official requirements for your destination',
      'Document checklist and consistency review',
      'Financial-evidence organisation',
      'Appointment and interview preparation',
    ],
    process: ['Inquiry', 'Requirement review using official sources', 'Document organisation', 'You apply with the official authority or its appointed centre'],
    documents: ['Passport', 'Admission letter', 'Proof of funds or scholarship letter', 'Academic documents', 'Other items required by the authority'],
  },
  {
    slug: 'family-dependent-visa',
    title: 'Family & Dependent Visa Consultancy',
    short: 'Guidance for joining a family member abroad.',
    icon: 'family',
    group: 'visa',
    intro:
      'Joining a spouse, parent or family member abroad involves rules that differ widely by country and by the sponsor’s status. We help you understand the official route and prepare your file.',
    forWho: ['Spouses and children of students or workers abroad', 'Families planning to relocate together'],
    help: ['Route identification based on official guidance', 'Relationship and sponsorship evidence checklist', 'File organisation and review'],
    process: ['Inquiry', 'Situation review', 'Checklist and preparation', 'Official application by the applicant'],
    documents: ['Passports', 'Marriage/birth certificates', 'Sponsor’s status documents', 'Financial evidence'],
  },
  {
    slug: 'business-visa',
    title: 'Business Visa Consultancy',
    short: 'Prepare for meetings, conferences and business travel.',
    icon: 'briefcase',
    group: 'visa',
    intro: 'For short business trips — meetings, conferences, trade fairs — we help you identify the right visa category and assemble supporting documents.',
    forWho: ['Professionals attending meetings or conferences', 'Entrepreneurs exploring international markets'],
    help: ['Visa category guidance', 'Invitation and supporting-letter checklist', 'Travel-history and finance documentation review'],
    process: ['Inquiry', 'Category check', 'Document preparation', 'Official application'],
    documents: ['Invitation letter', 'Employer/business letters', 'Bank statements', 'Business registration documents'],
  },
  {
    slug: 'work-visa',
    title: 'Work Visa Consultancy',
    short: 'Understand work-permit routes before you commit.',
    icon: 'badge',
    group: 'visa',
    intro:
      'Work visas usually depend on a genuine job offer and employer sponsorship. We explain official routes and help you prepare — we do not sell jobs or job offers.',
    forWho: ['Professionals with a job offer abroad', 'Graduates exploring post-study work routes'],
    help: ['Explanation of official work routes', 'Qualification and experience documentation', 'Checklists for employer-sponsored applications'],
    process: ['Inquiry', 'Route review', 'Document preparation', 'Official application with employer support'],
    documents: ['Job offer / contract', 'Degrees and experience letters', 'Passport', 'Any licence or recognition documents'],
  },
  {
    slug: 'digital-nomad-visa',
    title: 'Digital Nomad Visa Consultancy',
    short: 'Remote workers: compare countries and requirements.',
    icon: 'laptop',
    group: 'visa',
    intro:
      'A growing number of countries offer visas for remote workers. Income thresholds, insurance and tax implications differ — we help you compare options using official information.',
    forWho: ['Remote employees and freelancers', 'Founders working online'],
    help: ['Comparison of official digital-nomad programmes', 'Income and insurance evidence checklist', 'File organisation'],
    process: ['Inquiry', 'Country comparison', 'Document preparation', 'Official application'],
    documents: ['Proof of remote employment or clients', 'Income evidence', 'Health insurance', 'Passport'],
  },
  {
    slug: 'tourist-visitor-visa',
    title: 'Tourist & Visitor Visa Consultancy',
    short: 'Clear, consistent visitor-visa applications.',
    icon: 'plane',
    group: 'visa',
    intro: 'Visiting family, travelling or attending an event? We help you prepare a clear and consistent visitor-visa file based on official requirements.',
    forWho: ['Tourists and family visitors', 'Attendees of short events'],
    help: ['Checklist based on the official requirements', 'Itinerary and accommodation documentation', 'Financial evidence review'],
    process: ['Inquiry', 'Checklist', 'Review', 'Official application'],
    documents: ['Passport', 'Travel itinerary', 'Bank statements', 'Invitation letter (if visiting family)'],
  },
  {
    slug: 'relocation-guidance',
    title: 'International Relocation Guidance',
    short: 'Practical help settling in after you arrive.',
    icon: 'home',
    group: 'relocation',
    intro: 'From housing searches to local registration, we share practical guidance to help you plan your first weeks in a new country.',
    forWho: ['Students and professionals moving abroad', 'Families relocating together'],
    help: ['Pre-departure checklist', 'Housing search guidance', 'Local registration and banking orientation', 'Budgeting for the first months'],
    process: ['Inquiry', 'Relocation checklist', 'Q&A sessions'],
    documents: ['Depends on destination — we provide a personalised list'],
  },
];

export const serviceBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
