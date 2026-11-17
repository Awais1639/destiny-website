#!/usr/bin/env python3
"""Adds Germany (HRK Hochschulkompass list) to src/data/universities-europe.json."""
import json, re, sys, os, unicodedata
H = os.path.dirname(os.path.abspath(__file__))
P = sys.argv[1]
def slug(s):
    s = s.replace('ß', 'ss')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
rows = [l for l in open(os.path.join(H, 'de_rows.txt')).read().splitlines() if l]
cities = open(os.path.join(H, 'de_cities.txt')).read().strip().split(';')
www = open(os.path.join(H, 'de_www.txt')).read().strip()
assert len(www) == len(rows) == len(cities)
sub = [('#Ie', 'Internationale'), ('#En', 'Evangelischen'), ('#F', 'Fachhochschule'), ('#H', 'Hochschule'), ('#U', 'Universität'), ('#T', 'Technische'),
       ('#A', 'University of Applied Sciences'), ('#f', 'für '), ('#I', 'International'), ('#E', 'Evangelische'), ('#K', 'Katholische'), ('#W', 'Wirtschaft'), ('^', '&')]
TYPE = {'F': 'University of applied sciences (Fachhochschule/HAW)', 'U': 'University', 'K': 'Art and music university', 'E': 'Other higher education institution'}
out, seen = [], set()
for r, city, fw in zip(rows, cities, www):
    n, to, _c, w = r.split('|')
    for a, b in sub: n = n.replace(a, b)
    n = re.sub(r'\s+', ' ', n).strip()
    t, o = to[0], to[1]
    s = slug(n)
    if s in seen: s = slug(n + ' ' + city)
    seen.add(s)
    d = {'slug': s, 'name': n, 'category': TYPE[t] + (' · church-run, state-recognised' if o == 'k' else ''), 'city': city}
    if o == 'o': d['ownership'] = 'public'
    elif o == 'p': d['ownership'] = 'private'
    if '.' in w and not w.endswith('prf.hn'): d['website'] = 'https://' + ('www.' if fw == '1' and not w.startswith('www.') else '') + w
    if 'website' not in d: d['note'] = 'The HRK list does not give a usable website address for this institution.'
    out.append(d)
SRC = 'https://www.hochschulkompass.de/hochschulen/downloads.html'
country = {'slug': 'germany', 'name': 'Germany', 'checked': '2026-11-17',
  'scope': 'Every state-recognised higher education institution in the German Rectors’ Conference (HRK) Hochschulkompass list, except public-administration colleges that only train civil servants.',
  'ownershipNote': 'Public = public-law (state) institution; private = private, state-recognised institution, as recorded by the HRK. Church-run institutions are state-recognised but not labelled public or private.',
  'rules': {
    'portal': {'label': 'Apply via the university or uni-assist', 'url': 'https://daad.de/en/studying-in-germany/requirements/overview/'},
    'applicationFee': 'Universities that use uni-assist charge its handling fee: €75 for the first course of study and €30 for each additional one in the same semester. Direct applications are often free — check the university.',
    'tuition': 'Public universities generally charge no tuition for bachelor’s and most master’s programmes; you pay a semester contribution of about €70–430. Exceptions: Baden-Württemberg charges non-EU students €1,500 per semester, and institutions in Bavaria may charge non-EU/EEA students fees they set themselves. Private institutions charge their own fees.',
    'english': 'English-taught programmes need proof of English (accepted tests and scores are set by each programme) and no German. German-taught programmes usually require German at B2 or higher.',
    'entry': ['Bachelor’s: your school certificate must be recognised as a higher education entrance qualification. If it is not, you need two or three semesters of comparable university study at home, or a foundation course (Studienkolleg) and its final exam.',
              'Master’s: a recognised bachelor’s degree in a relevant subject; programmes set their own grade and subject requirements.',
              'Applicants from outside the EU/EEA apply through uni-assist or directly to the university, as the university specifies.'],
    'deadlines': [], 'deadlineNote': 'Each university sets its own deadlines — check the programme in the DAAD International Programmes database or on the university’s website.',
    'funds': 'Student visa: proof of €992 a month for living costs (amount in force from 1 January 2025), usually through a blocked account.',
    'scholarships': [{'label': 'DAAD EPOS scholarships (development-related master’s)', 'href': '/scholarships/daad-epos-development-related-postgraduate-courses/'}], 'scholarshipNote': None},
  'sources': [{'label': 'HRK Hochschulkompass — list of higher education institutions', 'url': SRC},
              {'label': 'DAAD — costs of education and living', 'url': 'https://www.daad.de/en/studying-in-germany/living-in-germany/finances/'},
              {'label': 'DAAD — requirements overview', 'url': 'https://daad.de/en/studying-in-germany/requirements/overview/'},
              {'label': 'uni-assist — handling fees', 'url': 'https://www.uni-assist.de/en/how-to-apply/pay-all-fees/handling-fees/'},
              {'label': 'DAAD — International Programmes in Germany', 'url': 'https://www2.daad.de/deutschland/studienangebote/international-programmes/en/'}],
  'institutions': out}
d = json.load(open(P))
bys = {c['slug']: c for c in d['countries']}
bys['germany'] = country
d['countries'] = list(bys.values())
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print(len(out), sum(1 for x in out if x.get('ownership') == 'public'), sum(1 for x in out if x.get('ownership') == 'private'))
