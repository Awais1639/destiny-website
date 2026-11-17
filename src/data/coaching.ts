/**
 * Test-preparation coaching offered by Destiny Global Solutions Limited (carried over from the company's previous website).
 * Facts about each test come from the official test owner (see `official`); edit freely, but never add score or
 * visa guarantees — results depend on the student and on the test owner / authorities.
 * Prices, course length and schedules are not published: visitors ask through the inquiry form.
 */
export interface Coaching {
  slug: string;
  oldSlug: string; // URL on the previous WordPress site (redirected)
  title: string; // service title (also used in the inquiry form)
  test: string;
  tagline: string;
  intro: string;
  useFor: string[];
  format: { label: string; value: string }[];
  formatNote?: string;
  covers: string[];
  official: { label: string; url: string }[];
  hue: number;
  mark: string; // short glyph shown on the card
}

export const coachingIncludes = [
  'Live online sessions at times that suit you',
  'A personal study plan based on a starting assessment',
  'Practice on every section with feedback on your answers',
  'Full-length mock tests under exam conditions',
  'Study material and exam strategies',
];

export const coaching: Coaching[] = [
  {
    slug: 'ielts',
    oldSlug: 'ielts-coaching',
    title: 'IELTS Coaching',
    test: 'IELTS',
    tagline: 'Listening, Reading, Writing and Speaking — prepared section by section.',
    intro:
      'One-to-one and small-group IELTS preparation online, for students applying to universities and for professionals and migrants who need an English score. We start from your current level and your target band, then work on each skill with practice, feedback and mock tests.',
    useFor: ['University admission abroad (IELTS Academic)', 'Work, training and migration (IELTS General Training)', 'Professional registration where an English score is required'],
    format: [
      { label: 'Listening', value: 'about 30 min' },
      { label: 'Reading', value: '60 min' },
      { label: 'Writing', value: '60 min' },
      { label: 'Speaking', value: '11–14 min' },
      { label: 'Total', value: '2 h 45 min' },
    ],
    formatNote: 'IELTS Academic, at a test centre or online. Listening and Speaking are the same in Academic and General Training; Reading and Writing differ.',
    covers: ['Listening question types and note-taking', 'Academic or General Training reading strategies', 'Writing Task 1 and Task 2 structure, with marked essays', 'Speaking practice for all three parts', 'Time management across the test'],
    official: [{ label: 'IELTS — IELTS Academic test', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test' }],
    hue: 352,
    mark: 'IE',
  },
  {
    slug: 'pte',
    oldSlug: 'pte-coaching',
    title: 'PTE Coaching',
    test: 'PTE Academic',
    tagline: 'A computer-scored test — practise the way it is marked.',
    intro:
      'Online coaching for PTE Academic, the computer-based English test from Pearson. Because every answer is scored by computer, we focus on the question types, timing and techniques the test rewards, with practice and full mock tests.',
    useFor: ['University admission (accepted by thousands of universities worldwide)', 'Australian migration and work visas', 'New Zealand migration visas'],
    format: [
      { label: 'Speaking & Writing', value: '76–84 min' },
      { label: 'Reading', value: '23–30 min' },
      { label: 'Listening', value: '31–39 min' },
      { label: 'Total', value: 'about 2 h' },
      { label: 'Score', value: '10–90' },
    ],
    formatNote: 'Taken on a computer at an authorised PTE test centre. Some UK visas require PTE Academic UKVI instead.',
    covers: ['All Speaking & Writing question types', 'Reading and Listening techniques', 'Pronunciation and oral fluency practice', 'Timing for each task', 'Mock tests with score breakdowns'],
    official: [{ label: 'Pearson — PTE Academic', url: 'https://www.pearsonpte.com/pte-academic/' }],
    hue: 280,
    mark: 'PTE',
  },
  {
    slug: 'sat',
    oldSlug: 'sat-coaching',
    title: 'SAT Coaching',
    test: 'SAT',
    tagline: 'Reading and Writing plus Math, on the adaptive digital SAT.',
    intro:
      'Online preparation for the digital SAT, the admissions test used by many universities in the United States and elsewhere. We build your Reading and Writing and Math skills and get you used to the adaptive, timed format.',
    useFor: ['Undergraduate admission in the United States', 'Universities in other countries that accept or require the SAT', 'Some merit scholarships that consider SAT scores'],
    format: [
      { label: 'Reading and Writing', value: '64 min' },
      { label: 'Math', value: '70 min' },
      { label: 'Total', value: '2 h 14 min' },
      { label: 'Score', value: '400–1600' },
    ],
    formatNote: 'Each section has two modules; how you do on the first decides whether the second is harder or easier.',
    covers: ['Short-passage reading and grammar questions', 'Algebra, advanced math, problem-solving and geometry', 'Strategies for the adaptive modules', 'Timed practice and full-length mock tests'],
    official: [{ label: 'College Board — SAT format, content and scoring', url: 'https://international.collegeboard.org/toolkit/sat-policy/understanding-sat/format-digital-content-scoring' }],
    hue: 210,
    mark: 'SAT',
  },
  {
    slug: 'citizenship-test',
    oldSlug: 'citizenship-test',
    title: 'Citizenship Test Coaching',
    test: 'Life in the UK Test',
    tagline: 'Know the handbook, practise the questions, sit the test with confidence.',
    intro:
      'Coaching for citizenship and settlement tests — in particular the UK’s Life in the UK Test. We go through the official handbook topics, practise with timed questions and help you feel ready on test day.',
    useFor: ['Applying for settlement (indefinite leave to remain) in the UK', 'Applying for British citizenship', 'Other citizenship tests — ask us which ones we can prepare you for'],
    format: [
      { label: 'Questions', value: '24' },
      { label: 'Time', value: '45 min' },
      { label: 'Pass mark', value: '75%' },
    ],
    formatNote: 'Life in the UK Test, booked through GOV.UK.',
    covers: ['UK history, traditions and customs', 'Government, law and your role in the community', 'Timed practice questions', 'Revision plan before your test date'],
    official: [{ label: 'GOV.UK — Life in the UK Test: what happens at the test', url: 'https://www.gov.uk/life-in-the-uk-test/what-happens-test' }, { label: 'GOV.UK — Book the Life in the UK Test', url: 'https://www.gov.uk/life-in-the-uk-test' }],
    hue: 20,
    mark: 'UK',
  },
];
