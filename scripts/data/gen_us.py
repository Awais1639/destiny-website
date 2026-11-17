"""United States: degree-granting colleges from the U.S. Department of Education College Scorecard (used by gen_anglo.py).
Input: scripts/data/raw/us-college-scorecard.json = {source, fetched, results: [...API records...]}."""
import re, unicodedata

STATES = {'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','DC':'District of Columbia','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming','PR':'Puerto Rico','GU':'Guam','VI':'U.S. Virgin Islands','AS':'American Samoa','MP':'Northern Mariana Islands','FM':'Micronesia','MH':'Marshall Islands','PW':'Palau'}

def slug(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().replace('&', ' and ')
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def money(v): return f'${v:,.0f}' if isinstance(v, (int, float)) else None

def build_us(raw, T):
    seen, out = set(), []
    for r in raw['results']:
        g = lambda k: r.get(k)
        name = (g('school.name') or '').strip()
        if not name or r['id'] in seen: continue
        seen.add(r['id'])
        own = g('school.ownership')
        st = g('school.state')
        url = g('school.school_url')
        if url:
            url = url.strip()
            if not re.match(r'https?://', url): url = 'https://' + url
            url = url.replace('http://', 'https://', 1)
            if url.count('/') == 2: url += '/'
        pred = g('school.degrees_awarded.predominant')
        hi = g('school.degrees_awarded.highest')
        cat = {3: 'Mainly bachelor’s degrees', 4: 'Mainly graduate degrees'}.get(pred, 'Degree-granting institution')
        if hi == 4 and pred == 3: cat += ' · also graduate degrees'
        tin, tout, coa = g('latest.cost.tuition.in_state'), g('latest.cost.tuition.out_of_state'), g('latest.cost.attendance.academic_year')
        bits = []
        if tout is not None and own == 1 and tin is not None and tin != tout: bits.append(f'Tuition and fees {money(tout)} a year for out-of-state students ({money(tin)} in-state)')
        elif tout is not None: bits.append(f'Tuition and fees {money(tout)} a year')
        if coa: bits.append(f'average annual cost of attendance {money(coa)}')
        tuition = {'text': '; '.join(bits) + ' (undergraduate, latest College Scorecard year).' + (' International students usually pay the out-of-state rate — check with the university.' if own == 1 else ''), 'source': f'https://collegescorecard.ed.gov/school/?{r["id"]}'} if bits else None
        ar, size = g('latest.admissions.admission_rate.overall'), g('latest.student.size')
        note = ' · '.join(x for x in [f'Admission rate {ar*100:.0f}%' if isinstance(ar, (int, float)) else None, f'{size:,} undergraduate students' if size else None] if x)
        d = {'slug': slug(name), 'name': name, 'ownership': 'public' if own == 1 else 'private',
             'category': cat + (' · private for-profit' if own == 3 else (' · private non-profit' if own == 2 else '')),
             'city': f"{g('school.city')}, {STATES.get(st, st)}" if g('school.city') else STATES.get(st, st),
             'website': url, 'profileUrl': f'https://collegescorecard.ed.gov/school/?{r["id"]}', 'tuition': tuition, 'note': (note + ' (College Scorecard)') if note else None}
        out.append({k: v for k, v in d.items() if v})
    out.sort(key=lambda x: x['name'].lower())
    used = set()
    for x in out:
        s = x['slug']
        if s in used: s = slug(x['name'] + ' ' + x.get('city', ''))
        n = 2
        while s in used: s = f"{x['slug']}-{n}"; n += 1
        x['slug'] = s; used.add(s)
    return {'slug': 'united-states', 'name': 'United States', 'checked': T,
     'scope': 'Every operating U.S. college or university whose degrees are mainly bachelor’s or graduate degrees, as recorded in the U.S. Department of Education’s College Scorecard. To enrol on an F-1 student visa the school must also be SEVP-certified.',
     'ownershipNote': 'Public or private as recorded by the U.S. Department of Education (private includes non-profit and for-profit, shown in the category). Tuition, cost and admission rate are the latest College Scorecard figures for undergraduates.',
     'rules': {
      'portal': {'label': 'Apply to each university, then for an F-1 student visa', 'url': 'https://educationusa.state.gov/'},
      'platforms': [{'label': 'EducationUSA', 'url': 'https://educationusa.state.gov/', 'note': 'U.S. Department of State network for advice on studying in the U.S.'},
                    {'label': 'College Scorecard', 'url': 'https://collegescorecard.ed.gov/', 'note': 'U.S. Department of Education data on costs, admission and outcomes'},
                    {'label': 'Study in the States', 'url': 'https://studyinthestates.dhs.gov/', 'note': 'Department of Homeland Security guide to F-1 status and SEVP-certified schools'},
                    {'label': 'U.S. Department of State — Student visa', 'url': 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html'}],
      'applicationFee': 'University application fees are set by each university. F-1 visa application fee: $185. I-901 SEVIS fee: $350.',
      'tuition': 'Set by each university; public universities usually charge international students the out-of-state rate. Each university page shows the latest College Scorecard tuition and cost.',
      'english': 'Set by each university (many accept TOEFL or IELTS scores) — check the admissions page.',
      'entry': ['An offer of admission from an SEVP-certified school, which then issues Form I-20.', 'Pay the I-901 SEVIS fee and apply for an F (student) visa at a U.S. embassy or consulate, taking Form I-20 to the interview.', 'Undergraduate: secondary-school completion; graduate: a bachelor’s degree — each university sets its own requirements.'],
      'deadlines': [], 'deadlineNote': 'Each university sets its own application deadlines. Student visas for new students can be issued up to 365 days before the course start date, but you cannot enter the U.S. on the visa more than 30 days before it.',
      'funds': None,
      'scholarships': [{'label': 'Fulbright (Pakistan) — USEFP', 'href': '/scholarships/fulbright-pakistan-degree-program/'}], 'scholarshipNote': None},
     'sources': [{'label': 'U.S. Department of Education — College Scorecard, Most Recent Institution-Level Data (updated 2 Nov 2026)', 'url': 'https://collegescorecard.ed.gov/data/'},
                 {'label': 'U.S. Department of State — Student visa', 'url': 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html'},
                 {'label': 'ICE — I-901 SEVIS fee', 'url': 'https://www.ice.gov/sevis/i901'}],
     'institutions': out}
