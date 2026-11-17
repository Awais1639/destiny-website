#!/usr/bin/env python3
"""Adds the UK, Canada, Australia and New Zealand (and the US when scripts/data/raw/us-college-scorecard.json
exists) to src/data/universities-europe.json, from official government lists saved in scripts/data/raw/."""
import json, re, os, sys, unicodedata, collections
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW = os.path.join(ROOT, 'scripts', 'data', 'raw')
P = os.path.join(ROOT, 'src', 'data', 'universities-europe.json')
T = '2026-11-17'
def slug(s):
    s = (s or '').replace('ß', 'ss').replace('’', '').replace("'", '')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def uniq(items):
    seen = set()
    for x in items:
        s = x['slug']; n = 2
        while s in seen: s = f"{x['slug']}-{n}"; n += 1
        x['slug'] = s; seen.add(s)
    return items
def web(u):
    if not u: return None
    u = str(u).strip()
    if u.startswith('http://'): u = 'https://' + u[7:]
    if not u.startswith('http'): u = 'https://' + u
    return u.rstrip('/') + '/' if u.count('/') <= 2 else u

# ---------------- United Kingdom ----------------
import openpyxl
ws = openpyxl.load_workbook(os.path.join(RAW, 'uk-ofs-register.xlsx'), read_only=True)['Register']
rows = [r for r in list(ws.iter_rows(values_only=True))[3:] if r[0]]
COUNTY = re.compile(r'shire|Yorkshire|Midlands|^(Surrey|Devon|Essex|Kent|Cornwall|Dorset|Middlesex|Sussex|Cumbria|Suffolk|County Durham|Tyne and Wear|Bucks|Greater Manchester|Norfolk)$')
uk = []
for r in rows:
    dap = str(r[13]).strip()
    if dap.split(' ')[0] not in ('Research', 'Taught', "Bachelor's"): continue
    a = [x.strip() for x in str(r[4]).split('\n') if x.strip()]
    pc = [i for i, x in enumerate(a) if re.match(r'^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$', x)]
    city = None
    if pc:
        i = pc[0] - 1
        while i > 0 and COUNTY.search(a[i]): i -= 1
        city = a[i] if i >= 0 else None
    elif 'London' in str(r[4]): city = 'London'
    trading = str(r[2]).split('\n')[0].strip()
    name = trading if trading and trading != 'Not applicable' and len(trading) > 4 else str(r[0]).strip()
    uni = str(r[17]).strip() == 'Yes'
    levels = {'Research': 'research degrees', 'Taught': 'taught degrees (up to master’s)', "Bachelor's": 'bachelor’s degrees'}[dap.split(' ')[0]]
    d = {'slug': slug(name), 'name': name, 'category': ('University' if uni else 'Higher education provider') + f' · degree-awarding powers: {levels}', 'city': city, 'website': web(r[6]) if r[6] else None}
    if name != str(r[0]).strip(): d['localName'] = str(r[0]).strip()
    uk.append({k: v for k, v in d.items() if v})
OTHER = [  # Scotland (gov.scot), Wales (gov.uk recognised bodies in Wales), Northern Ireland (nidirect)
 ('University of Aberdeen','Aberdeen','abdn.ac.uk','S'),('Abertay University','Dundee','abertay.ac.uk','S'),('University of Dundee','Dundee','dundee.ac.uk','S'),
 ('University of Edinburgh','Edinburgh','ed.ac.uk','S'),('Edinburgh Napier University','Edinburgh','napier.ac.uk','S'),('University of Glasgow','Glasgow','gla.ac.uk','S'),
 ('Glasgow Caledonian University','Glasgow','gcu.ac.uk','S'),('Heriot-Watt University','Edinburgh','hw.ac.uk','S'),('University of the Highlands and Islands','Inverness','uhi.ac.uk','S'),
 ('Queen Margaret University','Edinburgh','qmu.ac.uk','S'),('Robert Gordon University','Aberdeen','rgu.ac.uk','S'),('Royal Conservatoire of Scotland','Glasgow','rcs.ac.uk','S'),
 ('Scotland’s Rural College','Edinburgh','sruc.ac.uk','S'),('University of St Andrews','St Andrews','st-andrews.ac.uk','S'),('University of Stirling','Stirling','stir.ac.uk','S'),
 ('University of Strathclyde','Glasgow','strath.ac.uk','S'),('University of the West of Scotland','Paisley','uws.ac.uk','S'),('The Glasgow School of Art','Glasgow','gsa.ac.uk','S-'),
 ('Aberystwyth University','Aberystwyth','aber.ac.uk','W'),('Bangor University','Bangor','bangor.ac.uk','W'),('Cardiff Metropolitan University','Cardiff','cardiffmet.ac.uk','W'),
 ('Cardiff University','Cardiff','cardiff.ac.uk','W'),('University of South Wales','Pontypridd','southwales.ac.uk','W'),('Swansea University','Swansea','swansea.ac.uk','W'),
 ('University of Wales Trinity Saint David','Carmarthen','uwtsd.ac.uk','W'),('Wrexham University','Wrexham','wrexham.ac.uk','W'),
 ('Queen’s University Belfast','Belfast','qub.ac.uk','N'),('Ulster University','Belfast','ulster.ac.uk','N'),('St Mary’s University College','Belfast','smucb.ac.uk','NC'),('Stranmillis University College','Belfast','stran.ac.uk','NC')]
NAT = {'S': 'Scotland', 'W': 'Wales', 'N': 'Northern Ireland'}
for n, c, dom, k in OTHER:
    cat = {'S': 'University · recognised body, Scotland', 'S-': 'Higher education institution, Scotland (degrees validated by another body)', 'W': 'University · recognised body, Wales', 'N': 'University · Northern Ireland', 'NC': 'University college · Northern Ireland'}[k]
    uk.append({'slug': slug(n), 'name': n, 'category': cat, 'city': c, 'website': f'https://www.{dom}/'})
uk = uniq(sorted(uk, key=lambda x: x['name'].lower().replace('the ', '', 1)))

UK = {'slug': 'united-kingdom', 'name': 'United Kingdom', 'checked': T,
 'scope': 'England: every provider on the Office for Students (OfS) Register that holds its own degree-awarding powers. Scotland, Wales and Northern Ireland: the universities on the Scottish Government’s, the UK Government’s (Wales) and nidirect’s official lists.',
 'ownershipNote': 'The official registers do not classify providers as public or private, so ownership is not shown. The category shows whether the provider may call itself a university and the level of its degree-awarding powers (OfS Register).',
 'rules': {
  'portal': {'label': 'Undergraduate: apply through UCAS. Postgraduate: usually apply directly to the university.', 'url': 'https://www.ucas.com/applying/applying-to-university/dates-and-deadlines-for-uni-applications'},
  'platforms': [{'label': 'UCAS', 'url': 'https://www.ucas.com/', 'note': 'Central application service for undergraduate courses'},
                {'label': 'OfS Register', 'url': 'https://www.officeforstudents.org.uk/for-providers/registering-with-the-ofs/the-ofs-register/', 'note': 'Official register of English higher education providers'},
                {'label': 'GOV.UK — Student visa', 'url': 'https://www.gov.uk/student-visa'}],
  'applicationFee': 'UCAS undergraduate application fee for the 2027 cycle: £34.50 (up to five choices). Postgraduate application fees are set by each university. Student visa: £558 from outside the UK, plus the immigration healthcare surcharge.',
  'tuition': 'International tuition fees are set by each university — check the course page.',
  'english': 'Student visa: English equivalent to CEFR B2 for degree-level study (B1 below degree level). A university can assess your English itself for degree-level study; nationals of listed majority English-speaking countries do not need to prove it. Each university sets its own test scores.',
  'entry': ['Undergraduate: a qualification equivalent to UK A-levels, as set by each course.', 'Postgraduate: a bachelor’s degree; the university sets the grade and subject requirements.', 'Student visa: an unconditional offer and a Confirmation of Acceptance for Studies (CAS) from a licensed student sponsor.'],
  'deadlines': [{'label': '2027 entry (UCAS) — Oxford, Cambridge and most medicine, dentistry and veterinary courses, 18:00 UK time', 'date': '2026-10-15', 'apply': True},
                {'label': '2027 entry (UCAS) — equal consideration date for most undergraduate courses, 18:00 UK time', 'date': '2027-01-13', 'apply': True},
                {'label': '2027 entry (UCAS) — applications after this date go into Clearing', 'date': '2027-06-30', 'apply': True},
                {'label': '2027 entry (UCAS) — final deadline, 18:00 UK time', 'date': '2027-09-23', 'apply': True}],
  'deadlineNote': 'UCAS notes that many universities keep accepting international applications later in the year. Postgraduate deadlines are set by each university. The earliest you can apply for a Student visa from outside the UK is 6 months before your course starts.',
  'funds': 'Student visa: course fees for one academic year (up to 9 months) plus £1,529 a month for courses in London or £1,171 a month elsewhere (up to 9 months), unless you have been in the UK with a valid visa for 12 months.',
  'scholarships': [{'label': 'Chevening Scholarships', 'href': '/scholarships/chevening-scholarships-2027/'}, {'label': 'Commonwealth Master’s Scholarships', 'href': '/scholarships/commonwealth-masters-scholarships-2027/'}], 'scholarshipNote': None},
 'sources': [{'label': 'Office for Students — the OfS Register (downloaded 17 Nov 2026)', 'url': 'https://www.officeforstudents.org.uk/for-providers/registering-with-the-ofs/the-ofs-register/'},
             {'label': 'gov.scot — Universities', 'url': 'https://www.gov.scot/policies/universities/'},
             {'label': 'GOV.UK — Recognised bodies in Wales', 'url': 'https://www.gov.uk/check-university-award-degree/recognised-bodies-wales'},
             {'label': 'nidirect — Universities and colleges in Northern Ireland', 'url': 'https://www.nidirect.gov.uk/articles/universities-and-colleges-northern-ireland'},
             {'label': 'UCAS — Dates and deadlines (2027 entry)', 'url': 'https://www.ucas.com/applying/applying-to-university/dates-and-deadlines-for-uni-applications'},
             {'label': 'UCAS — 2027 application fee', 'url': 'https://www.ucas.com/faqs/what-is-the-application-fee-for-the-2027-cycle'},
             {'label': 'GOV.UK — Student visa', 'url': 'https://www.gov.uk/student-visa'}],
 'institutions': uk}

# ---------------- Canada ----------------
dli = json.load(open(os.path.join(RAW, 'canada-ircc-dli-list.json')))['data']
g = collections.defaultdict(list)
for r in dli: g[(r['Institution'].strip(), r['Public/Private'])].append(r)
ca = []
for (n, own), rs in g.items():
    pub = own.startswith('Public'); grad = any(x['Grad Program'] == 'Yes' for x in rs)
    if not pub and not (grad or re.search(r'universit', n, re.I)): continue
    cities = sorted({c.strip() for x in rs for c in re.split(r',\s*', x['City'] or '') if c.strip()})
    prov = sorted({x['Province'] for x in rs})
    m = [re.search(r"href='([^']+)'", x['HTML'] or '') for x in rs]
    prof = next(('https://www.canada.ca' + mm.group(1).replace('/content/canadasite', '') for mm in m if mm and not re.search(r'/(alberta|british-columbia|manitoba|new-brunswick|newfoundland-labrador|nova-scotia|ontario|prince-edward-island|quebec|saskatchewan|yukon|northwest-territories|nunavut)\.html$', mm.group(1))), None)
    cat = 'Offers graduate degree programmes' if grad else 'Post-secondary institution'
    d = {'slug': slug(n), 'name': n, 'ownership': 'public' if pub else 'private', 'category': cat,
         'city': ', '.join(cities[:4]) + (' …' if len(cities) > 4 else '') + ' · ' + ', '.join(prov), 'profileUrl': prof,
         'note': 'DLI number(s): ' + ', '.join(sorted({x['DLI #'] for x in rs}))}
    ca.append({k: v for k, v in d.items() if v})
ca = uniq(sorted(ca, key=lambda x: x['name'].lower()))
CA = {'slug': 'canada', 'name': 'Canada', 'checked': T,
 'scope': 'Every public post-secondary designated learning institution (DLI) on IRCC’s official list, plus private DLIs that are universities or offer graduate degree programmes. Private career colleges are not included.',
 'ownershipNote': 'Public or private as recorded on IRCC’s designated learning institutions list. The list does not give websites, so each entry links to its IRCC record where one exists.',
 'linkless': True,
 'rules': {
  'portal': {'label': 'Apply directly to the institution, then for a study permit with IRCC', 'url': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'},
  'platforms': [{'label': 'IRCC — Designated learning institutions list', 'url': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html', 'note': 'You need a letter of acceptance from a DLI to apply for a study permit'},
                {'label': 'IRCC — Study permit', 'url': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'}],
  'applicationFee': 'Set by each institution.',
  'tuition': 'Set by each institution — check the programme page.',
  'english': 'Set by each institution (IRCC does not set a single English score for the study permit).',
  'entry': ['A letter of acceptance from a designated learning institution.', 'Most new applicants also need a provincial or territorial attestation letter (PAL/TAL); the IRCC list shows which public DLIs offer graduate degree programmes.', 'Proof of money for tuition, living costs and travel.'],
  'deadlines': [], 'deadlineNote': 'Each institution sets its own application deadlines.',
  'funds': 'Study permit (outside Quebec): tuition and travel plus CAN$23,448 a year for one person for applications from 1 September 2026 (CAN$22,895 for applications from 1 January 2025 to 31 August 2026). Quebec sets its own amounts.',
  'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'IRCC — Designated learning institutions list (official data, 17 Nov 2026)', 'url': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html'},
             {'label': 'IRCC — Proof of financial support', 'url': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html'}],
 'institutions': ca}

# ---------------- Australia ----------------
au_raw = json.load(open(os.path.join(RAW, 'australia-teqsa-register.json')))
au = []
for row in au_raw['rows']:
    p = row.split('|')
    if len(p) < 7 or p[5] != 'Registered' or not p[6]: continue
    s, name, trading, addr, w, st, cat = p[:7]
    m = re.search(r'([A-Z][A-Z \'-]+)\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+\d{4}', addr, re.I)
    city = (m.group(1).strip().title() + ', ' + m.group(2).upper()) if m else None
    disp = re.sub(r',?\s+(Pty\.? Ltd\.?|Ltd\.?|Limited|Incorporated|Inc\.?)(?=\s*(\(|$))', '', name or '').strip()
    tn = trading.strip() if trading else ''
    name = tn if tn and tn != disp else None
    if not disp: print('AU: no name for', s); continue
    d = {'slug': slug(disp), 'name': disp, 'localName': name, 'category': cat, 'city': city, 'website': (w.replace('http://', 'https://', 1) if w else None), 'profileUrl': 'https://www.teqsa.gov.au/provider/' + s}
    au.append({k: v for k, v in d.items() if v})
au = uniq(sorted(au, key=lambda x: (x['category'] != 'Australian University', x['name'].lower().replace('the ', '', 1))))
AU = {'slug': 'australia', 'name': 'Australia', 'checked': T,
 'scope': 'Every higher education provider currently registered on TEQSA’s National Register (Australian universities, university colleges, institutes of higher education and other providers).',
 'ownershipNote': 'TEQSA’s register does not classify providers as public or private, so ownership is not shown; the category is TEQSA’s provider category. To enrol on a Student visa, the course must also be registered on CRICOS.',
 'rules': {
  'portal': {'label': 'Apply directly to the provider (some states use a tertiary admissions centre for undergraduate courses)', 'url': 'https://www.studyaustralia.gov.au/'},
  'platforms': [{'label': 'TEQSA National Register', 'url': 'https://www.teqsa.gov.au/national-register', 'note': 'Official register of higher education providers and their courses'},
                {'label': 'CRICOS', 'url': 'https://cricos.education.gov.au/', 'note': 'Courses open to international students on a Student visa'},
                {'label': 'Home Affairs — Student visa (subclass 500)', 'url': 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'}],
  'applicationFee': 'Set by each provider. Student visa (subclass 500): from AUD 2,500.',
  'tuition': 'Set by each provider — check the course page and its CRICOS record.',
  'english': 'Each provider sets its English requirement. Home Affairs may also ask for English test evidence with the visa application (check the Document Checklist Tool).',
  'entry': ['A Confirmation of Enrolment (CoE) for a course of study in Australia.', 'Overseas Student Health Cover (OSHC).', 'Proof of money for travel, course fees and living costs.'],
  'deadlines': [], 'deadlineNote': 'Each provider sets its own application deadlines and intakes. New Student visa rules apply from 2 October 2026 — see Home Affairs.',
  'funds': 'Student visa: 12-month living costs of AUD 29,710 for a student (AUD 10,394 for a partner, AUD 4,449 per child), plus the first 12 months of course fees and travel — or evidence that a parent or partner earned at least AUD 87,856 in the past 12 months (AUD 102,500 with family members).',
  'scholarships': [{'label': 'Australia Awards Scholarships', 'href': '/scholarships/australia-awards-pakistan/'}], 'scholarshipNote': None},
 'sources': [{'label': 'TEQSA — National Register (17 Nov 2026)', 'url': 'https://www.teqsa.gov.au/national-register'},
             {'label': 'Home Affairs — Student visa (subclass 500)', 'url': 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'}],
 'institutions': au}

# ---------------- New Zealand ----------------
NZU = [('The University of Auckland','Auckland','auckland.ac.nz'),('Auckland University of Technology','Auckland','aut.ac.nz'),('The University of Canterbury','Christchurch','canterbury.ac.nz'),
       ('Lincoln University','Lincoln','lincoln.ac.nz'),('Massey University','Palmerston North','massey.ac.nz'),('The University of Otago','Dunedin','otago.ac.nz'),
       ('Victoria University of Wellington','Wellington','wgtn.ac.nz'),('The University of Waikato','Hamilton','waikato.ac.nz')]
nz = [{'slug': slug(n.replace('The ', '')), 'name': n, 'category': 'University', 'city': c, 'website': f'https://www.{d}/'} for n, c, d in NZU]
NZ = {'slug': 'new-zealand', 'name': 'New Zealand', 'checked': T,
 'scope': 'New Zealand’s eight universities, as listed by Study with New Zealand (Education New Zealand, a government agency).',
 'ownershipNote': 'Ownership labels are not shown.',
 'rules': {
  'portal': {'label': 'Apply directly to the university, then for a Fee Paying Student Visa', 'url': 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'},
  'platforms': [{'label': 'Study with New Zealand', 'url': 'https://www.studywithnewzealand.govt.nz/', 'note': 'Official government study portal'},
                {'label': 'Immigration New Zealand — Fee Paying Student Visa', 'url': 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'}],
  'applicationFee': 'Set by each university. Fee Paying Student Visa: from NZD $850.',
  'tuition': 'Set by each university — check the programme page.',
  'english': 'The education provider must be satisfied that you have the English ability and academic capability to pass the course; each university sets its test scores.',
  'entry': ['An offer of place from an education provider that has signed the Code of Practice for international learners.', 'Money for tuition (or a scholarship), living costs and outward travel.'],
  'deadlines': [], 'deadlineNote': 'Each university sets its own application deadlines.',
  'funds': 'Tertiary study: NZD $20,000 for each year (or NZD $1,667 a month for study shorter than a year), plus tuition and outward travel.',
  'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'Study with New Zealand — New Zealand universities', 'url': 'https://www.studywithnewzealand.govt.nz/en/study-options/higher-education/universities'},
             {'label': 'Immigration New Zealand — Fee Paying Student Visa', 'url': 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'},
             {'label': 'Immigration New Zealand — Student fund requirements', 'url': 'https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/student-fund-requirements/'}],
 'institutions': nz}

NEW = [UK, CA, AU, NZ]
USF = os.path.join(RAW, 'us-college-scorecard.json')
if os.path.exists(USF):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from gen_us import build_us
    NEW.append(build_us(json.load(open(USF)), T))
d = json.load(open(P))
bys = {c['slug']: c for c in d['countries']}
for c in NEW: bys[c['slug']] = c
d['countries'] = list(bys.values())
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
for c in NEW: print(c['slug'], len(c['institutions']), collections.Counter(i.get('ownership') for i in c['institutions']))
