#!/usr/bin/env python3
"""Generates src/data/universities-europe.json (Nordic + Baltic directory). All facts from official national sources."""
import json, re, sys, unicodedata

CHECKED = '2026-11-17'

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def inst(name, website=None, ownership=None, category=None, city=None, programmes_url=None, counts=None, note=None, short=None, parent=None):
    d = {'slug': slug(short or name) if short else slug(name), 'name': name, 'ownership': ownership, 'category': category,
         'city': city, 'website': website, 'programmesUrl': programmes_url, 'english': counts, 'parent': parent, 'note': note}
    return {k: v for k, v in d.items() if v is not None}

# ---------------- SWEDEN ----------------
UKA = 'https://www.uka.se/swedish-higher-education-authority/about-higher-education/universities-university-colleges-and-other-education-providers/higher-education-institutions'
UA_LIST = 'https://www.universityadmissions.se/en/find-out-more/swedish-universities/'
se_univ = {'Chalmers University of Technology','Karlstad University','Karolinska Institutet','KTH Royal Institute of Technology','Linköping University','Linnaeus University','Luleå University of Technology','Lund University','Malmö University','Mid Sweden University','Stockholm School of Economics','Stockholm University','Swedish University of Agricultural Sciences','Umeå University','University of Gothenburg','Uppsala University','Örebro University','Mälardalen University'}
se_coll = {'Blekinge Institute of Technology','Dalarna University','Halmstad University','Jönköping University','Kristianstad University','Swedish Defence University','Södertörn University in Stockholm','The Swedish School of Sport and Health Sciences','University of Borås','University of Gävle','University of Skövde','University West'}
se_art = {'Konstfack, University of Arts, Crafts and Design','Royal College of Music','Royal Institute of Art','Stockholm University of the Arts'}
se_indep_named = {'Chalmers University of Technology','Stockholm School of Economics','Jönköping University'}
se_other_indep = {'Johannelund School of Theology','Marie Cederschiöld University','The Newman Institute','Sophiahemmet University','Swedish Red Cross University','University College Stockholm'}
se_raw = '''Blekinge Institute of Technology | https://www.bth.se/english
Chalmers University of Technology | https://www.chalmers.se/en/
Dalarna University | https://www.du.se/en
Halmstad University | https://www.hh.se/english
Johannelund School of Theology | https://www.johannelund.nu/johannelund-school-of-theology/
Jönköping University | https://ju.se/en.html
Karlstad University | https://www.kau.se/en/
Karolinska Institutet | https://ki.se/education
Konstfack, University of Arts, Crafts and Design | https://www.konstfack.se/en
Kristianstad University | https://www.hkr.se/en/
KTH Royal Institute of Technology | https://www.kth.se/en
Linköping University | https://liu.se/en
Linnaeus University | https://lnu.se/en/
Luleå University of Technology | https://www.ltu.se/?l=en
Lund University | https://www.lunduniversity.lu.se/
Mälardalen University | https://www.mdu.se/en/malardalen-university
Malmö University | https://mau.se/en/
Marie Cederschiöld University | https://www.mchs.se/engelska/marie-cederschiold-university.html
Mid Sweden University | https://www.miun.se/en
The Newman Institute | https://newman.se/in-english/
Örebro University | https://www.oru.se/English/
Royal College of Music | https://www.kmh.se/in-english.html
Royal Institute of Art | https://kkh.se/en/
Södertörn University in Stockholm | https://www.sh.se/english/sodertorn-university
Sophiahemmet University | https://www.shh.se/en/
Stockholm School of Economics | https://www.hhs.se/
Stockholm University | https://www.su.se/english/
Stockholm University of the Arts | https://www.uniarts.se/english
Swedish Defence University | https://www.fhs.se/en/
Swedish Red Cross University | https://www.rkh.se/en/
The Swedish School of Sport and Health Sciences | https://www.gih.se/in-english/
Swedish University of Agricultural Sciences | https://www.slu.se/en/
Umeå University | https://www.umu.se/en/
University of Borås | https://www.hb.se/en/
University College Stockholm | https://ehs.se/en/
University of Gävle | https://www.hig.se/engelska/university-of-gavle
University of Gothenburg | https://www.gu.se/english/
University of Skövde | https://www.his.se/english
University West | https://www.hv.se/en
Uppsala University | https://www.uu.se/en/'''
se = []
for line in se_raw.splitlines():
    n, u = [x.strip() for x in line.split('|')]
    if n in se_univ: cat = 'University'
    elif n in se_coll: cat = 'University college'
    elif n in se_art: cat = 'Art, design or music academy'
    elif n in se_other_indep: cat = 'Independent education provider'
    else: sys.exit('unmapped SE ' + n)
    own = 'private' if (n in se_indep_named or n in se_other_indep) else 'public'
    se.append(inst(n, u, own, cat))

# ---------------- FINLAND ----------------
fi_raw = '''Aalto University|U|https://www.aalto.fi/en/study-at-aalto|
Arcada University of Applied Sciences|A|https://www.arcada.fi/en/study-arcada|Helsinki
Centria University of Applied Sciences|A|https://net.centria.fi/en/|
Diaconia University of Applied Sciences|A|https://www.diak.fi/en/education-and-learning/|
Haaga-Helia University of Applied Sciences|A|https://www.haaga-helia.fi/en|
Hanken School of Economics|U|https://www.hanken.fi/en|
Humak University of Applied Sciences|A|https://www.humak.fi/en/|
Häme University of Applied Sciences HAMK|A|https://www.hamk.fi/en/come-to-study/|
Jamk University of Applied Sciences|A|https://www.jamk.fi/en|Jyväskylä
Kajaani University of Applied Sciences|A|https://www.kamk.fi/en|
Karelia University of Applied Sciences|A|https://www.karelia.fi/en/education/admission|
LAB University of Applied Sciences|A|https://lab.fi/en/studying|
LUT University|U|https://www.lut.fi/admissions|
Lapland University of Applied Sciences|A|https://lapinamk.fi/|
Laurea University of Applied Sciences|A|https://www.laurea.fi/en|
Metropolia University of Applied Sciences|A|https://www.metropolia.fi/en/academics|Helsinki
Novia University of Applied Sciences|A|https://www.novia.fi/|
Oulu University of Applied Sciences|A|https://www.oamk.fi/|
Satakunta University of Applied Sciences SAMK|A|https://www.samk.fi/|
Savonia University of Applied Sciences|A|https://www.savonia.fi/|
Seinäjoki University of Applied Sciences SeAMK|A|https://www.seamk.fi/en/|Seinäjoki
South-Eastern Finland University of Applied Sciences XAMK|A|https://www.xamk.fi/en/education-and-degrees/|
TAMK University of Applied Sciences|A|https://www.tuni.fi/en/study-with-us/apply-to-tamk/degree-programmes-tamk|
Tampere University|U|https://www.tuni.fi/en|
Turku University of Applied Sciences|A|https://www.turkuamk.fi/en/|
University of Eastern Finland|U|https://www.uef.fi/en/study|
University of Helsinki|U|https://www.helsinki.fi/en/admissions-and-education/apply-bachelors-and-masters-programmes|
University of Jyväskylä|U|https://www.jyu.fi/en/apply|
University of Lapland|U|https://ulapland.fi/en/frontpage/|
University of Oulu|U|https://www.oulu.fi/en/apply/international-programmes|
University of Turku|U|https://www.utu.fi/|
University of Vaasa|U|https://www.uwasa.fi/|
University of the Arts Helsinki|U|https://www.uniarts.fi/en/study-at-uniarts-helsinki/|Helsinki
Vaasa University of Applied Sciences|A|https://www.vamk.fi/|
Åbo Akademi University|U|https://www.abo.fi/en/study/apply/international-master-programmes/|Turku and Vaasa'''
fi = []
for line in fi_raw.splitlines():
    n, t, u, c = line.split('|')
    fi.append(inst(n, u, 'public', 'University' if t == 'U' else 'University of applied sciences', c or None))
assert len(fi) == 35 and sum(1 for x in fi if x['category'] == 'University') == 13, len(fi)

# ---------------- NORWAY ----------------
no_raw = '''Nord University | University | https://www.nord.no/en
Norwegian University of Life Sciences (NMBU) | University | https://www.nmbu.no/en
Norwegian University of Science and Technology (NTNU) | University | https://www.ntnu.edu/
Oslo Metropolitan University (OsloMet) | University | https://www.oslomet.no/en
University of Agder (UiA) | University | https://www.uia.no/en
University of Bergen (UiB) | University | https://www.uib.no/en
University of Inland Norway (INN) | University | https://www.inn.no/english/
University of Oslo (UiO) | University | https://www.uio.no/english/
University of South-Eastern Norway (USN) | University | https://www.usn.no/english/
University of Stavanger (UiS) | University | https://www.uis.no/en
UiT The Arctic University of Norway (UiT) | University | https://en.uit.no/startsida
Molde University College (HiMolde) | Specialised university | https://www.himolde.no/english/
NHH Norwegian School of Economics (NHH) | Specialised university | https://www.nhh.no/en/
Norwegian Academy of Music (NMH) | Specialised university | https://nmh.no/en
BI Norwegian Business School (BI) | Specialised university | https://www.bi.no/en/
Norwegian School of Sport Sciences (NIH) | Specialised university | https://www.nih.no/english/
MF Norwegian School of Theology, Religion and Society (MF) | Specialised university | https://mf.no/en
Oslo National Academy of the Arts (KHIO) | Specialised university | https://khio.no/en
Oslo School of Architecture and Design (AHO) | Specialised university | https://www.aho.no/english/
VID Specialized University (VID) | Specialised university | https://www.vid.no/en/
Ansgar University College (Ansgar) | University college | https://ansgarhoyskole.no/om-skolen/information-in-english
Bergen School of Architecture (BAS) | University college | https://bas.org/en/
Fjellhaug International University College (FIUC) | University college | https://fih.fjellhaug.no/en/
Kristiania University College (Kristiania) | University college | https://www.kristiania.no/en
Lovisenberg Diaconal University College (LDH) | University college | https://ldh.no/en
NLA University College (NLA) | University college | https://www.nla.no/en/
Norwegian Defence University College (NDUC) | University college | https://www.forsvaret.no/en/organisation/nduc
Norwegian Police University College (PHS) | University college | https://www.politihogskolen.no/english/
Norwegian School of Leadership and Theology (HLT) | University college | https://hlt.no/en/home/
Queen Maud University College of Early Childhood Education (QMUC) | University college | https://dmmh.no/en
Rudolf Steiner University College | University college | https://www.steinerhoyskolen.no/en
Sámi University of Applied Sciences (SAMAS) | University college | https://samas.no/en
Volda University College (VUC) | University college | https://www.hivolda.no/en
Western Norway University of Applied Sciences (HVL) | University college | https://www.hvl.no/en/
Østfold University College (OUC) | University college | https://www.hiof.no/english/
Lillehammer Institute of Music Production and Industries (LIMPI) | University college with accredited programmes | https://limpimusic.com/
Noroff University College (Noroff) | University college with accredited programmes | https://www.noroff.no/en/studies/university-college
Edda University College (previously NSKI) | University college with accredited programmes | https://www.nski.no/en/home
Oslo New University College (ONH) | University college with accredited programmes | https://oslonyehoyskole.no/en
University College of Norwegian Correctional Service (KRUS) | University college with accredited programmes | https://www.krus.no/hamburgermeny/om-krus/english'''
no = []
for line in no_raw.splitlines():
    n, c, u = [x.strip() for x in line.split('|')]
    clean = re.sub(r'\s*\((?!previously)[^)]*\)', '', n).strip()
    no.append(inst(clean, u, None, c))

# ---------------- LITHUANIA ----------------
SLT = 'https://new.studyin.lt/institutions/'
lt_raw = '''Klaipėda State College|College|Klaipėda|8|klaipedos-valstybine-kolegija-higher-education-institution|https://www.kvk.lt/en|public
Lithuanian Academy of Music and Theatre|University|Vilnius|6|lithuanian-academy-of-music-and-theatre|https://www.lmta.lt/en|
Vytautas Magnus University|University|Kaunas|38|vytautas-magnus-university|https://www.vdu.lt/en|
Kazimieras Simonavičius University|University|Vilnius|10|kazimieras-simonavicius-university-ksu|https://ksu.lt/en/admission/|
Vilnius Academy of Arts|University|Vilnius|30|vilnius-academy-of-arts|https://www.vda.lt/en|
Klaipėda University|University|Klaipėda|26|klaipeda-university|https://www.ku.lt/en|
Kaunas University of Technology|University|Kaunas|83|kaunas-university-of-technology|https://en.ktu.edu/|
Lithuanian University of Health Sciences|University|Kaunas|19|lithuanian-university-of-health-sciences|https://lsmu.lt/en|
ISM University of Management and Economics|University|Vilnius|11|ism-university-of-management-and-economics|https://www.ism.lt/en|
LCC International University|University|Klaipėda|6|lcc-international-university|https://lcc.lt|
Mykolas Romeris University|University|Vilnius|32|mykolas-romeris-university|https://www.mruni.eu/en|
Vilnius Gediminas Technical University (VILNIUS TECH)|University|Vilnius|58|vilnius-gediminas-technical-university-vilnius-tech|https://vilniustech.lt|
Vilnius University|University|Vilnius|77|vilnius-university|https://www.vu.lt/en/|
Kolping Higher Education Institution|College|Kaunas|3|kolpingo-kolegija-kolping-higher-education-institution|https://www.kolpingokolegija.lt/en|
St. Ignatius of Loyola College|College|Kaunas|6|st-ignatius-of-loyola-college|https://www.ilk.lt/en/home|
Lithuania Business College|College|Klaipėda|8|lithuania-business-college|https://www.ltvk.lt/en|
Vilnius College (Vilniaus kolegija)|College|Vilnius|8|vilniaus-kolegija-higher-education-institution|https://en.viko.lt/|
Utena University of Applied Sciences (Utenos kolegija)|College|Utena|13|utenos-kolegija-higher-education-institution|https://www.utenos-kolegija.lt/en|
Panevėžys College (Panevėžio kolegija)|College|Panevėžys|7|panevezio-kolegija-state-higher-education-institution|https://panko.lt/en|public
Lithuanian Maritime Academy|College|Klaipėda|4|lithuanian-maritime-academy||
Šiauliai State College|College|Šiauliai|5|siauliu-valstybine-kolegija-higher-education-institution|https://svako.lt/en|public
Kaunas College (Kauno kolegija)|College|Kaunas|8|kauno-kolegija-higher-education-institution|https://www.kaunokolegija.lt/en|
European Humanities University|University|Vilnius|22|european-humanities-university|https://en.ehuniversity.lt/|
SMK College of Applied Sciences|College|Vilnius|15|smk-college-of-applied-sciences|https://www.smk.lt/en|
Vilnius Business College|College|Vilnius|5|vilnius-business-college-higher-education-institution|https://www.kolegija.lt/en/vilnius-business-college/|
Lithuanian Sports University|University|Kaunas|13|lithuanian-sports-university|https://www.lsu.lt/en|'''
lt = []
for line in lt_raw.splitlines():
    n, c, city, cnt, s, w, own = line.split('|')
    lt.append(inst(n, w or None, own or None, c, city, SLT + s + '/', {'total': int(cnt)}))

# ---------------- LATVIA ----------------
SLV = 'https://www.studyinlatvia.lv/universities/'
lv_raw = '''art-academy-of-latvia|Art Academy of Latvia|S|Riga|https://www.lma.lv/en||master:1
ba-school-of-business-and-finance|FinTech Business School|S|Riga|https://ftbs.lu.lv/en/|University of Latvia|bachelor:2 doctoral:1 master:2
daugavpils-university|Daugavpils University|S|Daugavpils|https://du.lv/en/||doctoral:9 master:4 bachelor:2
eka-university-of-applied-sciences|EKA University of Applied Sciences|P|Riga|https://www.augstskola.lv/?lng=eng||bachelor:4 master:3
european-christian-academy|European Christian Academy|S|Jūrmala|https://en.kra.lv/home/||
latvia-university-of-life-sciences-and-technologies|Latvia University of Life Sciences and Technologies|S|Jelgava|https://www.lbtu.lv/en||master:8 bachelor:6 doctoral:7
latvian-academy-of-culture|Latvian Academy of Culture|S|Riga|https://www.lka.edu.lv/en/||master:1
liepaja-university|RTU Liepaja Academy|S|Liepaja|https://www.liepu.lv/en|Riga Technical University|bachelor:2 master:1
rezekne-academy-of-technologies|RTU Rezekne Academy|S|Rezekne|https://www.rta.lv/|Riga Technical University|bachelor:4 master:4 doctoral:4
riga-stradins-university|Rīga Stradiņš University|S|Riga|https://www.rsu.lv/en||master:7 bachelor:1 doctoral:1
riseba-university-of-applied-sciences|RISEBA University of Applied Sciences|P|Riga|https://www.riseba.lv/en/||doctoral:1 master:7 bachelor:5
riga-technical-university|Riga Technical University|S|Riga|https://www.rtu.lv/en||master:22 bachelor:13 doctoral:12
riga-business-school|RTU Riga Business School|S|Riga|https://rbs.lv/|Riga Technical University|bachelor:2 master:2
stockholm-school-of-economics-in-riga|Stockholm School of Economics in Riga|P|Riga|https://www.sseriga.edu/||bachelor:1 master:1
turiba-university|Turiba University|P|Riga|https://www.turiba.lv/en/||doctoral:4 bachelor:5 master:6
university-of-latvia|University of Latvia|S|Riga|https://www.lu.lv/en||bachelor:11 master:19 doctoral:12
ventspils-university-of-applied-sciences|Ventspils University of Applied Sciences|S|Ventspils|https://en.venta.lv/||bachelor:3 master:1 doctoral:1
vidzeme-university-of-applied-sciences|Vidzeme University of Applied Sciences|S|Valmiera|https://va.lv/en||bachelor:2 master:6 doctoral:2
riga-graduate-school-of-law-rgsl|Riga Graduate School of Law (RGSL)|P|Riga|https://www.rgsl.edu.lv/en||bachelor:2 master:3
transport-and-telecommunication-institute|Transport and Telecommunication Institute|P|Riga|https://tsi.lv/||bachelor:7 master:8 doctoral:2
rsu-latvian-academy-of-sport-education|RSU Latvian Academy of Sport Education|S|Riga|https://www.rsu.lv/en/undergraduate-programmes|Rīga Stradiņš University|
rtu-latvian-maritime-academy|RTU Latvian Maritime Academy|S|Riga|https://www.rtu.lv/en/lma|Riga Technical University|bachelor:3 master:1'''
lv = []
for line in lv_raw.splitlines():
    s, n, o, city, w, parent, counts = line.split('|')
    c = {}
    for kv in counts.split():
        k, v = kv.split(':'); c[{'doctoral': 'phd'}.get(k, k)] = int(v)
    if c: c['total'] = sum(c.values())
    cat = 'Structural unit of ' + parent if parent else ('University of applied sciences' if 'Applied Sciences' in n else 'Higher education institution')
    lv.append(inst(n, w, 'public' if o == 'S' else 'private', cat, city, SLV + s, c or None))
lv.append(inst('Jāzeps Vītols Latvian Academy of Music', 'https://www.jvlma.lv/en', None, 'Higher education institution', None, None, None,
               'Listed by the Ministry of Education and Science; no English-taught programmes are featured on Study in Latvia.'))

countries = [
  {
    'slug': 'sweden', 'name': 'Sweden', 'checked': CHECKED,
    'scope': 'Every university and university college that admits students through University Admissions in Sweden (40 institutions).',
    'ownershipNote': 'Public = state higher education institution; private = independent education provider, as classified by the Swedish Higher Education Authority (UKÄ).',
    'rules': {
      'portal': {'label': 'University Admissions in Sweden', 'url': 'https://www.universityadmissions.se/en/'},
      'applicationFee': 'SEK 900 per semester for citizens of countries outside the EU/EEA and Switzerland. One fee covers all the programmes you choose in that round. Doctoral applicants pay no fee.',
      'tuition': 'Citizens of countries outside the EU/EEA and Switzerland pay tuition for bachelor’s and master’s studies. Each university sets its own amount — it is shown in the search results on University Admissions and on the university’s website. Doctoral studies are free of tuition fees.',
      'english': 'English 6: IELTS Academic 6.5 with no section below 5.5 · TOEFL iBT 4.5 on the new 1–6 scale (no section below 4) or 90 with writing 20 on the old scale · Cambridge C1 Advanced 180 · PTE Academic 62 (writing 61). Some degrees taught in English count instead of a test — see the official page.',
      'entry': [
        'Bachelor’s: completed upper secondary (high school) education, English 6 and Mathematics 1a, 1b or 1c, plus any specific requirements of the programme.',
        'Master’s: a bachelor’s degree equivalent to a Swedish kandidatexamen, English 6 and the programme’s specific requirements.',
      ],
      'deadlines': [
        {'label': 'Autumn 2027 application round opens', 'date': '2026-10-16', 'apply': False},
        {'label': 'Application deadline (autumn 2027, first round)', 'date': '2027-01-15', 'apply': True},
        {'label': 'Application fee and documents due', 'date': '2027-02-01', 'apply': False},
        {'label': 'Results — master’s', 'date': '2027-04-01', 'apply': False},
        {'label': 'Results — bachelor’s', 'date': '2027-04-08', 'apply': False},
      ],
      'funds': None,
      'scholarships': [{'label': 'Swedish Institute Scholarships for Global Professionals', 'href': '/scholarships/swedish-institute-scholarships-global-professionals/'}],
      'scholarshipNote': 'Many universities also offer tuition-fee scholarships to fee-paying students — see each university’s website.',
    },
    'sources': [
      {'label': 'University Admissions — Swedish universities', 'url': UA_LIST},
      {'label': 'University Admissions — autumn semester dates', 'url': 'https://www.universityadmissions.se/en/key-dates-and-deadlines/autumn-semester-dates/'},
      {'label': 'University Admissions — who pays fees', 'url': 'https://www.universityadmissions.se/en/fees-scholarships-residence-permit/who-is-required-to-pay-fees/'},
      {'label': 'University Admissions — English requirements', 'url': 'https://www.universityadmissions.se/en/entry-requirements/english-language-requirements/'},
      {'label': 'University Admissions — bachelor’s requirements', 'url': 'https://www.universityadmissions.se/en/entry-requirements/bachelors-requirements/'},
      {'label': 'University Admissions — master’s requirements', 'url': 'https://www.universityadmissions.se/en/entry-requirements/masters-requirements/'},
      {'label': 'UKÄ — higher education institutions', 'url': UKA},
    ],
    'institutions': se,
  },
  {
    'slug': 'finland', 'name': 'Finland', 'checked': CHECKED,
    'scope': 'All 13 universities and 22 universities of applied sciences listed by Study in Finland.',
    'ownershipNote': 'All are publicly funded: universities are public-law corporations or foundations funded by the State, and universities of applied sciences are public limited companies in the Ministry of Education and Culture’s branch.',
    'rules': {
      'portal': {'label': 'Studyinfo.fi (joint application)', 'url': 'https://opintopolku.fi/konfo/en/'},
      'applicationFee': '€100 for applicants from outside the EU/EEA (Studyinfo application fee).',
      'tuition': 'Students from outside the EU/EEA and Switzerland usually pay tuition for English-taught bachelor’s and master’s programmes — typically €9,000 to €20,000 a year depending on the university and programme. Doctoral programmes are tuition-free. Universities often offer scholarships to fee-paying students.',
      'english': 'IELTS, TOEFL, PTE and Cambridge English are commonly accepted. Minimum scores are set by each university and programme.',
      'entry': [
        'Bachelor’s: a school-leaving certificate that qualifies you for higher education in your home country. Some programmes add entrance exams, SAT or interviews.',
        'Master’s: a bachelor’s degree. Master’s programmes at universities of applied sciences also require two years of relevant work experience.',
      ],
      'deadlines': [
        {'label': 'Joint application for January 2027 start (closed)', 'date': '2026-09-10', 'apply': True},
        {'label': 'Joint application for autumn 2027 start opens', 'date': '2027-01-07', 'apply': False},
        {'label': 'Joint application for autumn 2027 closes (15:00 Finnish time)', 'date': '2027-01-21', 'apply': True},
      ],
      'deadlineNote': 'Some programmes run separate applications (mainly December–January) or rolling admission — check the programme on Studyinfo.fi.',
      'funds': 'Residence permit: at least €800 a month (€9,600 a year) — the minimum set by the Finnish Immigration Service.',
      'scholarships': [],
      'scholarshipNote': 'Scholarships for fee-paying students are offered by the universities themselves — see each university’s tuition-fee page.',
    },
    'sources': [
      {'label': 'Study in Finland — universities', 'url': 'https://www.studyinfinland.fi/universities'},
      {'label': 'Study in Finland — fees and cost of living', 'url': 'https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living'},
      {'label': 'Study in Finland — bachelor’s and master’s admissions', 'url': 'https://www.studyinfinland.fi/admissions/bachelors-and-masters-admissions'},
      {'label': 'Study in Finland — joint application dates', 'url': 'https://www.studyinfinland.fi/news-events/joint-application-autumn-2026'},
      {'label': 'Ministry of Education and Culture — higher education institutions', 'url': 'https://okm.fi/en/heis-and-science-agencies'},
    ],
    'institutions': fi,
  },
  {
    'slug': 'norway', 'name': 'Norway', 'checked': CHECKED,
    'scope': 'Every institution listed by Study in Norway (the Directorate for Higher Education and Skills): universities, specialised universities and university colleges.',
    'ownershipNote': 'Study in Norway and NOKUT group institutions by type, not by ownership, so we do not label them public or private here. Fees for non-EU students apply at public institutions too.',
    'rules': {
      'portal': {'label': 'Apply through each institution', 'url': 'https://studyinnorway.no/higher-education-institutions-norway'},
      'applicationFee': 'Not specified by Study in Norway — check the institution’s admission page.',
      'tuition': 'Degree-seeking students from outside the EU/EEA and Switzerland must normally pay tuition fees. Amounts vary by institution and programme. Doctoral candidates and students on schemes such as NORPART, NORHED, Fulbright, Students at Risk and some Erasmus Mundus degrees are exempt.',
      'english': 'Document your English according to the institution’s requirements. Accepted tests and scores vary from institution to institution.',
      'entry': [
        'Bachelor’s: the Higher Education Entrance Qualification — foreign qualifications are assessed against the official GSU list for your country. English-taught bachelor’s programmes admit through the institution’s own system.',
        'Master’s: a recognised bachelor’s degree comparable to 180 ECTS, including at least 1½ years of full-time study in a relevant subject. Some programmes set a minimum grade average.',
      ],
      'deadlines': [],
      'deadlineNote': 'Each institution sets its own deadline for international applicants — see the institution’s admission page.',
      'funds': 'Residence permit: at least NOK 170,368 a year (NOK 15,488 a month) for 2026–2027, in addition to tuition.',
      'scholarships': [],
      'scholarshipNote': 'Some institutions, such as the University of Oslo, state that they offer no scholarships that cover tuition.',
    },
    'sources': [
      {'label': 'Study in Norway — higher education institutions', 'url': 'https://studyinnorway.no/higher-education-institutions-norway'},
      {'label': 'Study in Norway — cost and requirements', 'url': 'https://studyinnorway.no/cost-and-requirements'},
      {'label': 'Study in Norway — tuition fees', 'url': 'https://studyinnorway.no/tuition-fees-students'},
      {'label': 'Study in Norway — admission to degree programmes', 'url': 'https://studyinnorway.no/node/35'},
      {'label': 'NOKUT — higher education institutions', 'url': 'https://www.nokut.no/en/higher-education/higher-education-institutions/'},
      {'label': 'University of Oslo — tuition fees', 'url': 'https://www.uio.no/english/studies/admission/tuition/'},
    ],
    'institutions': no,
  },
  {
    'slug': 'lithuania', 'name': 'Lithuania', 'checked': CHECKED,
    'scope': 'Every university and college that lists English-taught programmes on Study in Lithuania (26 institutions).',
    'ownershipNote': 'Study in Lithuania does not say which institutions are state or private, so we only mark ownership where the institution’s official name says it is a state institution.',
    'rules': {
      'portal': {'label': 'Apply directly to each university', 'url': 'https://studyin.lt/how-to-apply/'},
      'applicationFee': 'Set by each university and programme.',
      'tuition': 'Study in Lithuania gives average fees of €2,000–€5,000 a year for bachelor’s and €3,000–€6,000 a year for master’s studies (FAQ last updated 2023). The exact fee is on each programme page.',
      'english': 'Set by each university and programme — see the programme’s “More information” page.',
      'entry': [
        'Each university runs its own admission. Your documents go through recognition and subject-equivalence checks, which can take a month or longer — apply early.',
      ],
      'deadlines': [],
      'deadlineNote': 'Deadlines for the autumn semester at most universities are in June. Several universities also offer a spring intake.',
      'funds': 'Living costs: about €500–€800 a month depending on the city (Study in Lithuania).',
      'scholarships': [],
      'scholarshipNote': None,
    },
    'sources': [
      {'label': 'Study in Lithuania — universities', 'url': 'https://new.studyin.lt/universities/'},
      {'label': 'Study in Lithuania — how to apply', 'url': 'https://studyin.lt/how-to-apply/'},
      {'label': 'Study in Lithuania — FAQ', 'url': 'https://old.studyin.lt/faq/'},
      {'label': 'LAMA BPO — universities and colleges', 'url': 'https://lamabpo.lt/en/bachelors-studies/universities/'},
    ],
    'institutions': lt,
  },
  {
    'slug': 'latvia', 'name': 'Latvia', 'checked': CHECKED,
    'scope': 'Every institution featured on Study in Latvia (the State Education Development Agency), with the number of English-taught programmes it lists, plus the Latvian Academy of Music from the Ministry’s list.',
    'ownershipNote': 'Public = “State” and private = “Private”, as labelled by Study in Latvia.',
    'rules': {
      'portal': {'label': 'Apply directly to each university (often via DreamApply)', 'url': 'https://studyinlatvia.lv/faq/the-admissions-and-application-process'},
      'applicationFee': 'A non-refundable application fee of around €150–€200.',
      'tuition': 'From under €1,600 a year for some bachelor’s programmes up to €25,600 for an Executive MBA. The fee for each programme is on Study in Latvia and the university’s website.',
      'english': 'English at CEFR level B2 or higher. How you prove it depends on the country where you studied.',
      'entry': [
        'Bachelor’s: a secondary school certificate that allows you to enter the chosen studies.',
        'Master’s: a bachelor’s degree in a relevant field. Your diploma is assessed by the Academic Information Centre (AIC).',
      ],
      'deadlines': [],
      'deadlineNote': 'Study in Latvia says non-EU applicants should apply by the beginning of June for the autumn semester and by mid-October or the beginning of November for spring. This guidance dates from 2021 — confirm the date with the university.',
      'funds': 'Living costs: about €450–€700 a month (Study in Latvia).',
      'scholarships': [],
      'scholarshipNote': None,
    },
    'sources': [
      {'label': 'Study in Latvia — universities', 'url': 'https://www.studyinlatvia.lv/universities'},
      {'label': 'Study in Latvia — fees and costs', 'url': 'https://studyinlatvia.lv/faq/fees-and-costs'},
      {'label': 'Study in Latvia — admission process', 'url': 'https://studyinlatvia.lv/faq/the-admissions-and-application-process'},
      {'label': 'Study in Latvia — language requirements', 'url': 'https://studyinlatvia.lv/faq/the-admissions-and-application-process-2'},
      {'label': 'Ministry of Education and Science — higher education institutions', 'url': 'https://www.izm.gov.lv/en/higher-education-institutions'},
    ],
    'institutions': lv,
  },
]

for c in countries:
    seen = set()
    for i in c['institutions']:
        assert i['slug'] not in seen, (c['slug'], i['slug']); seen.add(i['slug'])

out = {'_readme': 'Nordic and Baltic university directory. Every fact comes from the official national portal or ministry listed in each country\'s "sources". Update "checked" when you re-verify a country. Ownership is null when no official source states it.', 'countries': countries}
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
print({c['slug']: len(c['institutions']) for c in countries})
