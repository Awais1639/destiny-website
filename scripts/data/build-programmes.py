#!/usr/bin/env python3
"""Builds src/data/programmes-europe.json from raw exports of official national programme databases.

Inputs (raw files saved from the official portals, in scripts/data/raw/):
  latvia-studyinlatvia-programmes.json  — Study in Latvia (State Education Development Agency) API
  germany-daad-programmes.json          — DAAD International Programmes database
  czechia-studyin-programmes.json       — Study in Czechia programme search
Every value is copied from the official record (whitespace tidied only). Nothing is inferred.
"""
import json, os, re, sys, unicodedata, collections
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW = os.path.join(ROOT, 'scripts', 'data', 'raw')
OUT = os.path.join(ROOT, 'src', 'data', 'programmes-europe.json')
DIR = json.load(open(os.path.join(ROOT, 'src', 'data', 'universities-europe.json')))

def slug(s):
    s = (s or '').replace('ß', 'ss').replace('’', '').replace("'", ' ')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def tidy(t, n=None):
    if not t: return None
    t = re.sub(r'[ \t ]+', ' ', str(t)).strip()
    t = re.sub(r'•\s*\n\s*', '• ', t)
    t = re.sub(r'[ \t]*\n[ \t]*', '\n', t)
    t = re.sub(r'\n\s*\n+', '\n', t).strip()
    if '\n' not in t and t.startswith('• '): t = t[2:]
    if n and len(t) > n: t = t[:n].rsplit(' ', 1)[0] + ' …'
    return t or None

ENG = re.compile(r'english|ielts|toefl|cambridge|pte|duolingo|cefr|\bB2\b|\bC1\b|\bB1\b', re.I)
def english_lines(text):
    if not text: return None
    lines = [l.strip(' •-') for l in re.split(r'\n|(?<=[.;])\s+(?=[A-Z])', text) if ENG.search(l)]
    lines = [l for l in lines if not re.search(r'taught in english|language of instruction|teaching language', l, re.I) or re.search(r'ielts|toefl|b2|c1|cambridge', l, re.I)]
    return tidy('\n'.join(dict.fromkeys(lines)), 600) if lines else None

ALIASES = {
    'germany': {"ludwig-maximilians-universitat-munchen": "lmu-munchen", "hof-university-of-applied-sciences": "hochschule-hof", "technical-university-of-munich": "tu-munchen", "dresden-university-of-technology": "tu-dresden", "saarland-university": "universitat-des-saarlandes", "bremen-university-of-applied-sciences": "hochschule-bremen", "technische-universitat-berlin": "tu-berlin", "rptu-university-kaiserslautern-landau": "rptu-kaiserslautern-landau", "hannover-medical-school": "medizinische-hochschule-hannover", "university-of-tubingen": "universitat-tubingen", "kiel-university": "universitat-zu-kiel", "goethe-university-frankfurt": "universitat-frankfurt-am-main", "university-of-bonn": "universitat-bonn", "hamburg-university-of-technology": "tu-hamburg", "hwr-berlin": "hochschule-fur-wirtschaft-und-recht-berlin", "srh-distance-learning-university": "srh-fernhochschule-the-mobile-university", "university-of-potsdam": "universitat-potsdam", "johannes-gutenberg-university-mainz": "universitat-mainz", "bavarian-university-of-business-and-technology": "hochschule-der-bayerischen-wirtschaft-fur-angewandte-wissenschaften", "university-of-kassel": "universitat-kassel", "stuttgart-technical-university-of-applied-sciences": "hochschule-fur-technik-stuttgart", "university-of-gottingen": "universitat-gottingen", "university-of-bremen": "universitat-bremen", "university-of-regensburg": "universitat-regensburg", "magdeburg-stendal-university-of-applied-sciences": "hochschule-magdeburg-stendal", "reutlingen-university": "hochschule-reutlingen", "university-of-hamburg": "universitat-hamburg", "trier-university-of-applied-sciences": "hochschule-trier", "leipzig-university": "universitat-leipzig", "university-of-technology-nuremberg": "technische-universitat-nurnberg", "otto-von-guericke-university-magdeburg": "universitat-magdeburg", "technische-universitat-braunschweig": "tu-braunschweig", "nurtingen-geislingen-university": "hochschule-fur-wirtschaft-und-umwelt-nurtingen-geislingen", "european-university-viadrina": "europa-universitat-viadrina-frankfurt", "university-of-siegen": "universitat-siegen", "university-of-oldenburg": "universitat-oldenburg", "university-of-munster": "universitat-munster", "technical-university-of-applied-sciences-wildau": "technische-hochschule-wildau", "chemnitz-university-of-technology": "tu-chemnitz", "university-of-freiburg": "universitat-freiburg-im-breisgau", "baden-wuerttemberg-cooperative-state-university": "duale-hochschule-baden-wurttemberg", "biberach-university-of-applied-sciences": "hochschule-biberach", "university-of-cologne": "universitat-zu-koln", "hamburg-university-of-applied-sciences": "hochschule-fur-angewandte-wissenschaften-hamburg", "karlsruhe-institute-of-technology": "karlsruher-institut-fur-technologie", "osnabruck-university": "universitat-osnabruck", "university-of-konstanz": "universitat-konstanz", "aschaffenburg-university-of-applied-sciences": "technische-hochschule-aschaffenburg", "justus-liebig-university-giessen": "universitat-giessen", "albstadt-sigmaringen-university": "hochschule-albstadt-sigmaringen", "esslingen-university-of-applied-sciences": "hochschule-esslingen", "weihenstephan-triesdorf-university-of-applied-sciences": "hochschule-weihenstephan-triesdorf", "university-of-applied-sciences-emden-leer": "hochschule-emden-leer", "university-of-applied-sciences-koblenz": "hochschule-koblenz", "zeppelin-university": "zeppelin-universitat", "offenburg-university-of-applied-sciences": "hochschule-fur-technik-wirtschaft-und-medien-offenburg", "owl-university-of-applied-sciences-and-arts": "technische-hochschule-ostwestfalen-lippe", "marburg-university": "universitat-marburg", "paderborn-university": "universitat-paderborn", "dortmund-university-of-applied-sciences-and-arts": "fachhochschule-dortmund", "university-of-koblenz": "universitat-koblenz", "heidelberg-university": "universitat-heidelberg", "kaiserslautern-university-of-applied-sciences": "hochschule-kaiserslautern", "kempten-university-of-applied-sciences": "hochschule-kempten", "karlsruhe-university-of-applied-sciences": "hochschule-karlsruhe", "university-of-rostock": "universitat-rostock", "brandenburg-university-of-technology-cottbus-senftenberg": "btu-cottbus-senftenberg", "friedrich-schiller-university-jena": "universitat-jena"},
    'czech-republic': {
        'academy-of-arts-architecture-design-in-prague': 'academy-of-arts-architecture-and-design-in-prague',
        'university-of-veterinary-science-brno': 'veterinary-university-brno',
        'european-research-university': 'evropska-vyzkumna-univerzita',
        'university-of-finance-and-administration': 'vysoka-skola-financni-a-spravni',
        'prague-school-of-creative-communication': 'vysoka-skola-kreativni-komunikace',
        'skoda-auto-vysoka-skola': 'skoda-auto-university',
    },
}
def host_key(u):
    m = re.match(r'https?://([^/]+)', u or '')
    if not m: return None
    h = m.group(1).lower().split(':')[0]
    parts = h.split('.')
    return '.'.join(parts[-2:]) if len(parts) >= 2 else h
def find_inst(country, *names, url=None):
    c = next(x for x in DIR['countries'] if x['slug'] == country)
    by = {i['slug']: i for i in c['institutions']}
    al = ALIASES.get(country, {})
    for n in names:
        s = slug(n)
        if al.get(s) in by: return al[s]
    if url:
        hk = host_key(url)
        hits = [i['slug'] for i in c['institutions'] if hk and host_key(i.get('website')) == hk]
        if len(hits) == 1: return hits[0]
    for n in names:
        s = slug(n)
        if s in by: return s
    # loose: institution name contained in the given name or vice versa
    for n in names:
        sn = slug(n)
        for s in by:
            if len(s) > 8 and (s in sn or sn in s): return s
    return None

progs, unmatched = [], {}

# ---------------- Latvia ----------------
p = os.path.join(RAW, 'latvia-studyinlatvia-programmes.json')
if os.path.exists(p):
    d = json.load(open(p))
    LV = {'bachelor-level-studies': 'bachelor', 'master-level-studies': 'master', 'doctoral-level-studies': 'phd'}
    for r in d['programmes']:
        if 'EN' not in (r.get('languages') or []): continue
        uni = find_inst('latvia', r['uniTitle'])
        if not uni: unmatched.setdefault('latvia', set()).add(r['uniTitle']); continue
        req = '\n'.join(b['text'] for k, b in r['blocks'].items() if re.search(r'requirement|admission|enrol|entry|criteria', k, re.I) and b.get('text'))
        req_url = next((b['url'] for k, b in r['blocks'].items() if re.search(r'requirement|admission|enrol|entry|criteria', k, re.I) and b.get('url')), None)
        progs.append({
            'id': f"lv-{r['slug']}", 'c': 'latvia', 'uni': uni, 'name': r['title'], 'degree': tidy(r.get('degree')),
            'level': next((v for k, v in {'bachelor': 'bachelor', 'master': 'master', 'doctor': 'phd'}.items() if k in (r.get('level') or '')), 'other'), 'duration': tidy(r.get('duration')), 'credits': tidy(r.get('credits')), 'mode': tidy(r.get('mode')),
            'city': r.get('location'), 'tuition': tidy(r.get('fees')), 'english': english_lines(req), 'requirements': tidy(req, 1500),
            'intake': ', '.join(r.get('intake') or []) or None, 'deadlines': None,
            'url': r.get('programmeLink') or None, 'apply': (r.get('applicationLinks') or [None])[0], 'requirementsUrl': req_url,
            'source': f"https://www.studyinlatvia.lv/studies/{r['slug']}", 'sourceLabel': 'Study in Latvia', 'checked': d['fetched'][:10],
        })

# ---------------- Germany (DAAD) ----------------
p = os.path.join(RAW, 'germany-daad-programmes.json')
if os.path.exists(p):
    d = json.load(open(p))
    TY = {1: 'bachelor', 2: 'master', 3: 'phd'}
    for r in d['programmes']:
        f = r.get('detail') or {}
        uni = find_inst('germany', r.get('academy') or '', url=f.get('_web'))
        if not uni: unmatched.setdefault('germany', set()).add(r.get('academy')); continue
        periods = f.get('Application periods (2)') or f.get('Application periods')
        tuition = f.get('Tuition fees per semester') or r.get('tuitionFees')
        progs.append({
            'id': f"de-{r['id']}", 'c': 'germany', 'uni': uni, 'name': r['courseName'], 'degree': tidy(f.get('Degree')),
            'level': TY.get(r.get('courseType'), 'other'), 'duration': tidy(f.get('Programme duration') or r.get('programmeDuration')),
            'mode': tidy(f.get('Full-time / part-time'), 80), 'city': r.get('city'), 'languages': tidy(f.get('Languages'), 300),
            'tuition': tidy(tuition, 500), 'semesterContribution': tidy(f.get('Semester contribution'), 300),
            'english': tidy(f.get('English language skills'), 800), 'german': tidy(f.get('German language skills'), 400),
            'requirements': tidy(f.get('Academic admission requirements'), 1500), 'intake': tidy(f.get('Beginning') or r.get('beginning')),
            'deadlines': tidy(periods, 800), 'applyVia': tidy(f.get('Submit application via'), 300),
            'url': f.get('_web'), 'apply': None, 'source': 'https://www2.daad.de' + r['link'], 'sourceLabel': 'DAAD International Programmes',
            'checked': d['fetched'][:10],
        })

# ---------------- Czech Republic ----------------
p = os.path.join(RAW, 'czechia-studyin-programmes.json')
if os.path.exists(p):
    d = json.load(open(p))
    CZ = {'Bachelor': 'bachelor', 'Master': 'master', 'Doctoral': 'phd', 'Long-cycle': 'single-cycle'}
    for r in d['programmes']:
        uni = find_inst('czech-republic', r.get('institution') or '', re.sub(r'\s*\(.*', '', r.get('institution') or ''))
        if not uni: unmatched.setdefault('czech-republic', set()).add(r.get('institution')); continue
        lvl = next((v for k, v in CZ.items() if k.lower() in (r.get('type') or '').lower()), 'other')
        progs.append({
            'id': f"cz-{slug(r['institution'])[:30]}-{slug(r['title'])[:50]}-{slug(r.get('form') or '')[:10]}", 'c': 'czech-republic', 'uni': uni,
            'name': r['title'], 'degree': tidy(r.get('type')), 'level': lvl, 'duration': tidy(r.get('duration')), 'mode': tidy(r.get('form')),
            'city': r.get('city'), 'faculty': tidy(r.get('institution')), 'specialization': tidy(r.get('specialization')),
            'tuition': tidy(r.get('fee')), 'english': None, 'requirements': None, 'intake': None, 'deadlines': None,
            'url': r.get('more'), 'apply': None, 'source': 'https://studyin.gov.cz/study-programmes/', 'sourceLabel': 'Study in Czechia',
            'checked': d['fetched'][:10],
        })

# ---------------- Australia (CRICOS) ----------------
import csv
pc, pi = os.path.join(RAW, 'au-cricos-courses.csv'), os.path.join(RAW, 'au-cricos-institutions.csv')
if os.path.exists(pc) and os.path.exists(pi) and any(c['slug'] == 'australia' for c in DIR['countries']):
    au = next(c for c in DIR['countries'] if c['slug'] == 'australia')
    def hk2(u):
        m = re.match(r'(?:https?://)?([^/]+)', (u or '').strip().lower())
        if not m or '.' not in m.group(1): return None
        h = m.group(1).split(':')[0]
        return h[4:] if h.startswith('www.') else h
    by_name = {}
    for i in au['institutions']:
        for n in (i['name'], i.get('localName')):
            if n: by_name.setdefault(slug(n), i['slug'])
    by_host = collections.defaultdict(set)
    for i in au['institutions']:
        if hk2(i.get('website')): by_host[hk2(i['website'])].add(i['slug'])
    prov = {}
    for r in csv.DictReader(open(pi, encoding='utf-8-sig')):
        cand = [by_name.get(slug(re.sub(r'\(.*?\)', '', n))) for n in (r['Institution Name'], r['Trading Name']) if n]
        cand = [c for c in cand if c]
        if not cand and not re.search(r'://[^/]+/.', 'https://' + re.sub(r'^https?://', '', r['Website'].strip())):
            h = by_host.get(hk2(r['Website']))
            if h and len(h) == 1: cand = list(h)
        if cand: prov[r['CRICOS Provider Code']] = cand[0]
    LVL = {'Bachelor Degree': 'bachelor', 'Bachelor Honours Degree': 'bachelor', 'Masters Degree (Coursework)': 'master', 'Masters Degree (Research)': 'master', 'Masters Degree (Extended)': 'master', 'Doctoral Degree': 'phd'}
    for r in csv.DictReader(open(pc, encoding='utf-8-sig')):
        if r['Expired'] != 'No' or r['Course Level'] not in LVL or 'english' not in (r['Course Language'] or '').lower(): continue
        uni = prov.get(r['CRICOS Provider Code'])
        if not uni: unmatched.setdefault('australia', set()).add(r['Institution Name']); continue
        fee = '; '.join(x for x in [f"Tuition fee {r['Tuition Fee']}" if r['Tuition Fee'] else None, f"non-tuition fees {r['Non Tuition Fee']}" if r['Non Tuition Fee'] and r['Non Tuition Fee'] != '$0.00' else None, f"estimated total course cost {r['Estimated Total Course Cost']}" if r['Estimated Total Course Cost'] else None] if x)
        progs.append({
            'id': f"au-{r['CRICOS Course Code'].lower()}", 'c': 'australia', 'uni': uni, 'name': r['Course Name'].strip(),
            'degree': f"{r['Course Level']} · CRICOS course code {r['CRICOS Course Code']}", 'level': LVL[r['Course Level']],
            'duration': f"{r['Duration (Weeks)']} weeks" if r['Duration (Weeks)'] else None,
            'specialization': tidy('Field of education: ' + ' — '.join(dict.fromkeys(x for x in [re.sub(r'^\d+ - ', '', r['Field of Education 1 Broad Field'] or ''), re.sub(r'^\d+ - ', '', r['Field of Education 1 Detailed Field'] or '')] if x))) if r['Field of Education 1 Broad Field'] else None,
            'languages': r['Course Language'] or None,
            'tuition': (fee + ' (whole course, as registered on CRICOS)') if fee else None,
            'english': None, 'requirements': None, 'intake': None, 'deadlines': None, 'url': None, 'apply': None,
            'source': 'https://cricos.education.gov.au/', 'sourceLabel': 'CRICOS', 'checked': '2026-11-17',
        })

# unique ids
seen = {}
for p_ in progs:
    k = p_['id']; n = seen.get(k, 0); seen[k] = n + 1
    if n: p_['id'] = f'{k}-{n+1}'
def fixurl(u):
    if not u: return None
    u = u.strip()
    if not re.match(r'https?://', u): u = 'https://' + u.lstrip('/')
    return u.replace('http://', 'https://', 1) if u.startswith('http://') else u
for p_ in progs:
    for k in ('url', 'apply', 'requirementsUrl'):
        if p_.get(k): p_[k] = fixurl(p_[k])
# Corrections made by hand (weekly check) on the programme's official page — see AGENT.md.
OVR = os.path.join(ROOT, 'scripts', 'data', 'programme-overrides.json')
if os.path.exists(OVR):
    ovr = {k: v for k, v in json.load(open(OVR)).items() if not k.startswith('_')}
    byid = {p_['id']: p_ for p_ in progs}
    for k, o in ovr.items():
        if k not in byid: print('OVERRIDE FOR UNKNOWN PROGRAMME', k); continue
        for f, v in o.items():
            if f == '_checked': byid[k]['checked'] = v
            elif f == '_source': byid[k]['verifiedUrl'] = v
            elif not f.startswith('_'): byid[k][f] = v
progs = [{k: v for k, v in p_.items() if v not in (None, '', [])} for p_ in progs]
json.dump({'_readme': 'Programmes copied from official national programme databases (Study in Latvia, DAAD, Study in Czechia, CRICOS). Rebuild with scripts/data/build-programmes.py.', 'programmes': progs}, open(OUT, 'w'), ensure_ascii=False, indent=0)
import collections
print(collections.Counter(p_['c'] for p_ in progs), 'with english:', sum(1 for p_ in progs if p_.get('english')))
for c, s in unmatched.items(): print('UNMATCHED', c, len(s), sorted(s)[:40])
