#!/usr/bin/env python3
"""Adds France, Belgium, Spain, Portugal and Malta to src/data/universities-europe.json."""
import json, re, sys, os, unicodedata
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from fr_chunks import TEXT as FR
P = sys.argv[1]; CHECKED = '2026-11-17'
def slug(s):
    s = s.replace('ß', 'ss').replace('’', '').replace("'", ' ')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def uniq(lst):
    seen = set()
    for i in lst:
        s = i['slug']; k = 2
        while s in seen: s = f"{i['slug']}-{k}"; k += 1
        i['slug'] = s; seen.add(s)
    return lst

# ---------------- FRANCE ----------------
sub = [('#U', 'Université'), ('#E', 'École'), ('#N', 'nationale supérieure'), ('#I', 'Institut'), ('#S', 'supérieure'), ('#G', 'ingénieurs')]
TYPE = {'U': 'University', 'E': 'School (grande école / école)', 'G': 'Grand établissement', 'A': 'Other higher education institution'}
fr = []
for line in FR.split('\n'):
    n, to, city, w = line.split('|')
    for a, b in sub: n = n.replace(a, b)
    n = re.sub(r'\s+', ' ', n).strip()
    if n.startswith('École nationale supérieure') is False and n.startswith('Ecole Nationale Supérieure'): pass
    d = {'slug': slug(n), 'name': n, 'ownership': 'public' if to[1] == 'o' else 'private', 'category': TYPE[to[0]], 'city': city or None}
    if w and '.' in w: d['website'] = 'https://' + w
    else: d['note'] = 'The Ministry’s list does not give a website address for this institution.'
    fr.append({k: v for k, v in d.items() if v is not None})
fr = uniq(fr)
assert len(fr) == 245

# ---------------- BELGIUM ----------------
be = []
for n, u in [('Ghent University','https://www.ugent.be/en'),('KU Leuven','https://www.kuleuven.be/english/'),('Hasselt University','https://www.uhasselt.be/en'),
             ('University of Antwerp','https://www.uantwerpen.be/en/'),('Vrije Universiteit Brussel','https://www.vub.be/en')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'University · Flanders (Dutch-speaking)', 'website': u})
for n, u in [('Institute of Tropical Medicine','https://www.itg.be/en'),('Antwerp Management School','https://www.antwerpmanagementschool.be/en'),('Vlerick Business School','https://www.vlerick.com/en/')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'Other higher education institution · Flanders', 'website': u})
for n, u in [('Antwerp Maritime Academy','https://www.hzs.be/en/'),('AP University of Applied Sciences and Arts','https://www.ap.be/en/homepage'),
             ('Artevelde University of Applied Sciences and Arts','https://www.artevelde-uas.be/'),('Erasmus Brussels University of Applied Sciences and Arts','https://www.erasmushogeschool.be/en'),
             ('HOGENT University of Applied Sciences and Arts','https://www.hogent.be/en/'),('Howest University of Applied Sciences','https://www.howest.be/en'),
             ('KdG University of Applied Sciences and Arts','https://www.kdg.be/en'),('LUCA School of Arts','https://www.luca-arts.be/en'),('Odisee University College','https://www.odisee.be/en'),
             ('PXL University of Applied Sciences and Arts','https://www.pxl.be/International.html'),('Thomas More University of Applied Sciences','https://www.thomasmore.be/en/welcome'),
             ('UCLL University of Applied Sciences','https://www.ucll.be/international'),('VIVES University of Applied Sciences','https://www.vives.be/')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'University of applied sciences and arts · Flanders', 'website': u})
for n, u in [('Université catholique de Louvain (UCLouvain)','https://uclouvain.be'),('Université libre de Bruxelles (ULB)','https://www.ulb.be'),('Université de Liège (ULiège)','https://www.uliege.be'),
             ('Université de Mons (UMONS)','https://web.umons.ac.be'),('Université de Namur (UNamur)','https://www.unamur.be')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'University · Wallonia-Brussels (French-speaking)', 'website': u})
for n, u in [('Haute École Albert Jacquard','https://www.heaj.be'),('Haute École Bruxelles-Brabant','https://www.he2b.be'),('Haute École Charlemagne','https://www.hech.be'),('Haute École EPHEC','https://www.ephec.be'),
             ('Haute École Francisco Ferrer','https://www.he-ferrer.eu'),('Haute École Galilée – IHECS','https://www.ihecs.be'),('Haute École ICHEC – ECAM – ISFSC','https://he-ichec-ecam-isfsc.be'),
             ('Haute École en Hainaut','https://www.heh.be'),('Haute École Léonard de Vinci','https://www.vinci.be'),('Haute École libre de Bruxelles – Ilya Prigogine','https://www.helb-prigogine.be'),
             ('Haute École libre Mosane','https://www.helmo.be'),('Haute École Louvain en Hainaut','https://www.helha.be'),('Haute École Lucia de Brouckère','https://www.heldb.be'),
             ('Haute École de Namur-Liège-Luxembourg','https://www.henallux.be'),('Haute École provinciale de Hainaut – Condorcet','https://www.condorcet.be'),
             ('Haute École de la Province de Liège','https://www.provincedeliege.be/hauteecole'),('Haute École de la Province de Namur','https://hepn.be'),('Haute École Robert Schuman','https://www.hers.be'),
             ('Haute École de la Ville de Liège','https://www.hel.be')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'University college (haute école) · Wallonia-Brussels', 'website': u})
for n, u in [('Académie des Beaux-Arts de Tournai','https://www.actournai.be'),('Académie royale des Beaux-Arts de la Ville de Bruxelles','https://www.arba-esa.be'),('Arts²','https://www.artsaucarre.be'),
             ('Beaux-Arts de Liège – École supérieure des Arts','https://beauxartsdeliege.be'),('Conservatoire royal de Bruxelles','https://www.conservatoire.be'),('Conservatoire royal de Liège','https://www.crlg.be'),
             ('La Cambre – École nationale supérieure des Arts visuels','https://www.lacambre.be'),('École supérieure des Arts de l’Image « Le 75 »','https://leseptantecinq.be'),
             ('ERG – École de Recherche graphique','https://www.erg.be'),('École supérieure des Arts du Cirque','https://esac.be'),('ESA Institut Saint-Luc Tournai','https://stluc-sup-tournai.be'),
             ('ESA Saint-Luc de Bruxelles','https://www.stluc-bruxelles-esa.be'),('ESA Saint-Luc de Liège','https://www.saint-luc.be'),('Institut des Arts de Diffusion (IAD)','https://www.iad-arts.be'),
             ('INSAS – Institut national supérieur des Arts du Spectacle','https://insas.be'),('Institut supérieur de Musique et de Pédagogie (IMEP)','https://www.imep.be')]:
    be.append({'slug': slug(n), 'name': n, 'category': 'School of arts · Wallonia-Brussels', 'website': u})
be = uniq(be)

# ---------------- SPAIN ----------------
es_raw = '''Universidad de Almería|o|Andalucía
Universidad de Cádiz|o|Andalucía
Universidad de Córdoba|o|Andalucía
Universidad de Granada|o|Andalucía
Universidad de Huelva|o|Andalucía
Universidad de Jaén|o|Andalucía
Universidad de Málaga|o|Andalucía
Universidad Pablo de Olavide|o|Andalucía
Universidad de Sevilla|o|Andalucía
Universidad CEU Fernando III|p|Andalucía
Universidad Loyola Andalucía|p|Andalucía
Universidad de Zaragoza|o|Aragón
Universidad San Jorge|p|Aragón
Universidad de Oviedo|o|Asturias
Universitat de les Illes Balears|o|Illes Balears
Universidad de La Laguna|o|Canarias
Universidad de Las Palmas de Gran Canaria|o|Canarias
Universidad del Atlántico Medio|p|Canarias
Universidad Europea de Canarias|p|Canarias
Universidad Fernando Pessoa-Canarias|p|Canarias
Universidad de Cantabria|o|Cantabria
Universidad Europea del Atlántico|p|Cantabria
Universidad de Burgos|o|Castilla y León
Universidad de León|o|Castilla y León
Universidad de Salamanca|o|Castilla y León
Universidad de Valladolid|o|Castilla y León
Universidad Católica Santa Teresa de Jesús de Ávila|p|Castilla y León
Universidad Europea Miguel de Cervantes|p|Castilla y León
IE Universidad|p|Castilla y León
Universidad Pontificia de Salamanca|p|Castilla y León
Universidad de Castilla-La Mancha|o|Castilla-La Mancha
Universitat Autònoma de Barcelona|o|Cataluña
Universitat de Barcelona|o|Cataluña
Universitat de Girona|o|Cataluña
Universitat de Lleida|o|Cataluña
Universitat Politècnica de Catalunya|o|Cataluña
Universitat Rovira i Virgili|o|Cataluña
Universitat Pompeu Fabra|o|Cataluña
Universitat Abat Oliba CEU|p|Cataluña
Universitat Internacional de Catalunya|p|Cataluña
Universitat Ramon Llull|p|Cataluña
Universitat de Vic – Universitat Central de Catalunya|p|Cataluña
Universidad de Alicante|o|Comunitat Valenciana
Universitat Jaume I de Castellón|o|Comunitat Valenciana
Universidad Miguel Hernández de Elche|o|Comunitat Valenciana
Universitat Politècnica de València|o|Comunitat Valenciana
Universitat de València (Estudi General)|o|Comunitat Valenciana
Universidad Cardenal Herrera-CEU|p|Comunitat Valenciana
Universidad Católica de Valencia San Vicente Mártir|p|Comunitat Valenciana
Universidad Europea de Valencia|p|Comunitat Valenciana
Universidad de Extremadura|o|Extremadura
Universidade da Coruña|o|Galicia
Universidade de Santiago de Compostela|o|Galicia
Universidade de Vigo|o|Galicia
Universidad Intercontinental de la Empresa|p|Galicia
Universidad de Alcalá|o|Madrid
Universidad Autónoma de Madrid|o|Madrid
Universidad Carlos III de Madrid|o|Madrid
Universidad Complutense de Madrid|o|Madrid
Universidad Politécnica de Madrid|o|Madrid
Universidad Rey Juan Carlos|o|Madrid
Universidad Alfonso X El Sabio|p|Madrid
Universidad Antonio de Nebrija|p|Madrid
Universidad Camilo José Cela|p|Madrid
CUNEF Universidad|p|Madrid
Universidad de Diseño, Innovación y Tecnología (UDIT)|p|Madrid
ESIC Universidad|p|Madrid
Universidad Europea de Madrid|p|Madrid
Universidad Francisco de Vitoria|p|Madrid
Universidad Internacional de la Empresa|p|Madrid
Universidad Internacional Villanueva|p|Madrid
Universidad Pontificia Comillas|p|Madrid
Universidad San Pablo-CEU|p|Madrid
Universidad de Murcia|o|Región de Murcia
Universidad Politécnica de Cartagena|o|Región de Murcia
Universidad Católica San Antonio|p|Región de Murcia
Universidad Pública de Navarra|o|Navarra
Universidad de Navarra|p|Navarra
Universidad del País Vasco/Euskal Herriko Unibertsitatea|o|País Vasco
Universidad de Deusto|p|País Vasco
Euneiz|p|País Vasco
Mondragon Unibertsitatea|p|País Vasco
Universidad de La Rioja|o|La Rioja
Universidad Nacional de Educación a Distancia (UNED)|o|Distance · national
Universidad Internacional Menéndez Pelayo (UIMP)|o|Special · national
Universidad Internacional de Andalucía|o|Andalucía
Universidad Internacional Isabel I de Castilla|p|Castilla y León
Universidad a Distancia de Madrid (UDIMA)|p|Madrid
Universidad Internacional de La Rioja (UNIR)|p|La Rioja
Universitat Oberta de Catalunya (UOC)|p|Cataluña
Universidad Internacional Valenciana|p|Comunitat Valenciana'''
es = []
for l in es_raw.splitlines():
    n, o, reg = l.split('|')
    online = any(k in n for k in ('Distancia', 'UNED', 'UNIR', 'Oberta', 'Isabel I', 'Internacional Valenciana', 'UIMP', 'Internacional de Andalucía'))
    es.append({'slug': slug(n), 'name': n, 'ownership': 'public' if o == 'o' else 'private',
               'category': ('Distance or special university' if online else 'University') + ' · ' + reg})
es = uniq(es)

# ---------------- PORTUGAL ----------------
pt_pub = [('Universidade dos Açores','U'),('Universidade do Algarve','U'),('Universidade de Aveiro','U'),('Universidade da Beira Interior','U'),('Universidade de Coimbra','U'),('Universidade de Évora','U'),
 ('Universidade Nova de Lisboa','U'),('Universidade do Minho','U'),('Universidade do Porto','U'),('Universidade de Trás-os-Montes e Alto Douro','U'),('Universidade da Madeira','U'),('Universidade de Lisboa','U'),
 ('ISCTE – Instituto Universitário de Lisboa','U'),('Instituto Politécnico de Beja','P'),('Instituto Politécnico do Cávado e do Ave','P'),('Instituto Politécnico de Bragança','P'),('Instituto Politécnico de Castelo Branco','P'),
 ('Instituto Politécnico de Coimbra','P'),('Instituto Politécnico da Guarda','P'),('Instituto Politécnico de Leiria','P'),('Instituto Politécnico de Lisboa','P'),('Instituto Politécnico de Portalegre','P'),
 ('Instituto Politécnico do Porto','P'),('Instituto Politécnico de Santarém','P'),('Instituto Politécnico de Setúbal','P'),('Instituto Politécnico de Viana do Castelo','P'),('Instituto Politécnico de Viseu','P'),
 ('Instituto Politécnico de Tomar','P'),('Escola Superior de Enfermagem de Coimbra','P'),('Escola Superior de Enfermagem de Lisboa','P'),('Escola Superior de Enfermagem do Porto','P'),
 ('Escola Superior Náutica Infante D. Henrique','P'),('Escola Superior de Hotelaria e Turismo do Estoril','P')]
pt_priv_u = ['Atlântica – Instituto Universitário','Escola Superior Artística do Porto','Escola Superior Gallaecia','Escola Universitária Vasco da Gama',
 'Instituto Superior de Estudos Interculturais e Transdisciplinares de Almada','Instituto Superior de Estudos Interculturais e Transdisciplinares de Viseu','Instituto Superior de Gestão',
 'Instituto Superior de Serviço Social do Porto','Instituto Superior Manuel Teixeira Gomes','Instituto Superior Miguel Torga','Instituto Universitário de Ciências da Saúde – CESPU',
 'Instituto Universitário Egas Moniz','ISPA – Instituto Universitário de Ciências Psicológicas, Sociais e da Vida','Universidade Autónoma de Lisboa Luís de Camões','Universidade Católica Portuguesa',
 'Universidade da Maia','Universidade Europeia','Universidade Fernando Pessoa','Universidade Lusíada','Universidade Lusófona','Universidade Portucalense Infante D. Henrique']
pt_priv_p = ['Academia Nacional Superior de Orquestra','Escola Superior de Atividades Imobiliárias','Escola Superior de Artes e Design','Escola Superior de Educação de Fafe',
 'Escola Superior de Educação de João de Deus','Escola Superior de Educação de Paula Frassinetti','Escola Superior de Enfermagem de São José de Cluny','Escola Superior de Enfermagem São Francisco das Misericórdias',
 'Escola Superior de Negócios Atlântico','Escola Superior de Saúde Atlântica','Escola Superior de Saúde Cruz Vermelha Portuguesa – Alto Tâmega','Escola Superior de Saúde da Cruz Vermelha Portuguesa – Lisboa',
 'Escola Superior de Saúde da Fundação Fernando Pessoa','Escola Superior de Saúde de Santa Maria','Escola Superior de Saúde do Alcoitão','Escola Superior de Saúde Egas Moniz',
 'Escola Superior de Saúde Jean Piaget de Viseu','Escola Superior de Saúde Norte da Cruz Vermelha Portuguesa','Escola Superior de Tecnologias de Fafe','Instituto Politécnico da Lusofonia',
 'Instituto Politécnico da Maia','Instituto Politécnico de Saúde do Norte – CESPU','Instituto Politécnico Jean Piaget do Norte','Instituto Politécnico Jean Piaget do Sul',
 'Instituto Português de Administração de Marketing de Lisboa','Instituto Português de Administração de Marketing do Porto','Instituto Superior D. Dinis','Instituto Superior de Administração e Gestão',
 'Instituto Superior de Administração e Línguas','Instituto Superior Politécnico Gaya','ISLA – Instituto Politécnico de Gestão e Tecnologia']
pt_priv_x = ['Instituto Superior de Ciências da Informação e da Administração','Instituto Superior de Ciências Educativas do Douro','Instituto Superior de Ciências Empresariais e do Turismo',
 'Instituto Superior de Entre Douro e Vouga','Instituto Superior de Tecnologias Avançadas de Lisboa','Instituto Superior de Tecnologias Avançadas do Porto','ISAVE – Instituto Superior de Saúde',
 'ISCE – Instituto Superior de Lisboa e Vale do Tejo','ISEC Lisboa – Instituto Superior de Educação e Ciências','ISLA – Instituto Superior de Gestão e Administração de Santarém']
pt = [{'slug': slug(n), 'name': n, 'ownership': 'public', 'category': 'Public university' if t == 'U' else 'Public polytechnic'} for n, t in pt_pub]
pt += [{'slug': slug(n), 'name': n, 'ownership': 'private', 'category': 'Private university education'} for n in pt_priv_u]
pt += [{'slug': slug(n), 'name': n, 'ownership': 'private', 'category': 'Private polytechnic education'} for n in pt_priv_p]
pt += [{'slug': slug(n), 'name': n, 'ownership': 'private', 'category': 'Private higher education institution'} for n in pt_priv_x]
pt = uniq(pt)

# ---------------- MALTA ----------------
mt = [
 {'slug': 'university-of-malta', 'name': 'University of Malta', 'category': 'University', 'city': 'Msida', 'website': 'https://www.um.edu.mt/',
  'programmesUrl': 'https://www.um.edu.mt/media/um/docs/study/admissions/october_list.pdf'},
 {'slug': 'mcast', 'name': 'Malta College of Arts, Science and Technology (MCAST)', 'category': 'College (vocational and professional degrees)', 'website': 'https://mcast.edu.mt/international-applicants/'},
]

C = []
C.append({'slug': 'france', 'name': 'France', 'checked': CHECKED,
 'scope': 'The 245 main higher education institutions in the Ministry of Higher Education and Research open-data list: universities, grandes écoles and other schools, grands établissements and French schools abroad.',
 'ownershipNote': 'Public or private as recorded by the Ministry of Higher Education and Research.',
 'rules': {
  'portal': {'label': 'Études en France (Campus France)', 'url': 'https://www.pakistan.campusfrance.org/prepare-your-budget'},
  'applicationFee': 'Not specified in the Campus France guide — check your local Campus France office and the institution.',
  'tuition': 'Public institutions, non-EU students starting in 2026–27: €2,895 a year for a bachelor’s (licence), €3,941 for a master’s and €397 for a PhD (Campus France guide; Campus France Pakistan lists €2,902 and €3,950). Private schools, especially business schools, charge about €3,000–10,000 or more a year.',
  'english': 'Over 600 master’s programmes are taught in English — each sets its own English test. French-taught programmes may require a French test; medicine and health programmes require at least B2 French.',
  'entry': ['Students living in an Études en France country apply through their local Campus France office, which also handles the interview and the visa file.',
            'First-year bachelor’s at a university: preliminary admission request (DAP) or Parcoursup; master’s: Mon Master or Études en France.'],
  'deadlines': [], 'deadlineNote': 'Études en France opens in October or November depending on the country; Mon Master applications run from late February to late March; DAP runs from early December to the end of February.',
  'funds': None, 'scholarships': [{'label': 'Eiffel Excellence Scholarship', 'href': '/scholarships/eiffel-excellence-scholarship-2027/'}], 'scholarshipNote': None},
 'sources': [{'label': 'Ministry of Higher Education and Research — main institutions (open data)', 'url': 'https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-principaux-etablissements-enseignement-superieur/'},
             {'label': 'Campus France — Choose France guide 2026–2027', 'url': 'https://ressources.campusfrance.org/pratique/guides/en/choisir_la_france_en.pdf'},
             {'label': 'Campus France Pakistan — prepare your budget', 'url': 'https://www.pakistan.campusfrance.org/prepare-your-budget'}],
 'institutions': fr})
C.append({'slug': 'belgium', 'name': 'Belgium', 'checked': CHECKED,
 'scope': 'Every higher education institution listed by Study in Flanders (Dutch-speaking) and Study in Belgium (Wallonia-Brussels Federation, French-speaking).',
 'ownershipNote': 'The official lists do not label institutions public or private, so ownership is not shown.',
 'rules': {
  'portal': {'label': 'Apply directly to the institution', 'url': 'https://www.studyinflanders.be/practical-information/admission-requirements'},
  'applicationFee': 'Set by each institution.',
  'tuition': 'Wallonia-Brussels (French-speaking): non-EU students pay €835 plus an additional contribution of €4,175 a year — €5,369 in total for 2025–26 — unless exempt (for example nationals of a UN least-developed country). Flanders: fees for non-EEA students are set by each institution.',
  'english': 'Flanders: English-taught programmes usually require B2 — for example IELTS 6.0 overall or TOEFL iBT 72–94. Wallonia-Brussels: French at B2 (DELF/DALF/TEF/TCF) for French-taught master’s.',
  'entry': ['Bachelor’s: a secondary diploma that gives access to university in the country where it was awarded; admission follows an individual application procedure.',
            'Medicine, dentistry, veterinary sciences and arts programmes have entrance exams.'],
  'deadlines': [], 'deadlineNote': 'Wallonia-Brussels master’s: the non-EU deadline is usually 31 March (apply in February). Flanders: each institution sets its deadline; the academic year starts in mid-September.',
  'funds': 'Wallonia-Brussels estimates student living costs of €1,000–1,200 a month.',
  'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'Study in Flanders — higher education in Flanders', 'url': 'https://www.studyinflanders.be/higher-education-in-flanders'},
             {'label': 'Study in Flanders — admission requirements', 'url': 'https://www.studyinflanders.be/practical-information/admission-requirements'},
             {'label': 'Study in Belgium — student brochure 2025', 'url': 'https://www.studyinbelgium.be/sites/default/files/uploads/Ressources/Brochure%20Etudiants%202025_ENG_web.pdf'},
             {'label': 'Study in Belgium — registration fees', 'url': 'https://www.studyinbelgium.be/en/studying-french-speaking-belgium-registration-fees'}],
 'institutions': be})
C.append({'slug': 'spain', 'name': 'Spain', 'checked': CHECKED,
 'scope': 'Every Spanish university in the Ministry of Science, Innovation and Universities’ “Datos y cifras del Sistema Universitario Español 2025/26” — in-person, distance and special universities.',
 'ownershipNote': 'Public or private as recorded by the Ministry. The Ministry’s table does not give website addresses.',
 'rules': {
  'portal': {'label': 'Apply directly to the university', 'url': 'https://www.exteriores.gob.es/Embajadas/tunez/es/Comunicacion/Noticias/Documents/Estudiar%20en%20las%20universidades%20espa%C3%B1olas%20(T%C3%BAnez).pdf'},
  'applicationFee': 'Set by each university.',
  'tuition': 'Public university fees are set per credit by each autonomous community — Galicia and Andalucía have the lowest prices, Cataluña and Madrid the highest. Private universities set their own fees.',
  'english': 'Spanish-taught degrees usually require Spanish at B1–B2 (DELE B2 recommended). Over 800 degrees are taught fully or partly in English — the university sets the English requirement.',
  'entry': ['Bachelor’s: your school diploma must be homologated (or accredited through UNEDasiss); you then meet the degree’s cut-off grade, and some universities add their own tests.',
            'Master’s and doctorate: apply directly to the university.'],
  'deadlines': [], 'deadlineNote': 'Most universities have a special enrolment period for foreign students; courses start in September. Check the university’s calendar.',
  'funds': None, 'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'Ministry of Science, Innovation and Universities — Datos y cifras 2025/26', 'url': 'https://www.ciencia.gob.es/dam/jcr:747444d8-7089-4b15-97e1-0fc27874e6a7/DatosCifras_SUE2025_2026.pdf'},
             {'label': 'Ministry of Foreign Affairs — Studying at Spanish universities', 'url': 'https://www.exteriores.gob.es/Embajadas/tunez/es/Comunicacion/Noticias/Documents/Estudiar%20en%20las%20universidades%20espa%C3%B1olas%20(T%C3%BAnez).pdf'}],
 'institutions': es, 'linkless': True})
C.append({'slug': 'portugal', 'name': 'Portugal', 'checked': CHECKED,
 'scope': 'Every public and private higher education institution in the Directorate-General for Higher Education’s report “O Ensino Superior em Portugal 2021/2023”.',
 'ownershipNote': 'Public or private as grouped by the Directorate-General for Higher Education. The report does not give website addresses.',
 'rules': {
  'portal': {'label': 'Special Contest for International Students', 'url': 'https://wwwcdn.dges.gov.pt/en/node/192'},
  'applicationFee': 'Set by each institution.',
  'tuition': 'Set by each institution for international students — see its regulation for the Special Contest.',
  'english': 'Set by each institution and programme.',
  'entry': ['Non-EU students apply directly to the institution through the Special Contest for International Students, for bachelor’s (licenciatura) and integrated master’s programmes it opens to the contest.',
            'You need a qualification that gives access to higher education in the country where it was issued. Each institution publishes its own regulation with documents, places and selection criteria.'],
  'deadlines': [], 'deadlineNote': 'Each institution sets its deadline — at least three months before classes start — and publishes it on its website.',
  'funds': None, 'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'DGES — O Ensino Superior em Portugal 2021/2023', 'url': 'https://wwwcdn.dges.gov.pt/sites/default/files/o_ensino_superior_em_portugal_2021-2023_versao_final_10_07_2024.pdf'},
             {'label': 'DGES — Special Contest for International Students', 'url': 'https://wwwcdn.dges.gov.pt/en/node/192'}],
 'institutions': pt, 'linkless': True})
C.append({'slug': 'malta', 'name': 'Malta', 'checked': CHECKED,
 'scope': 'Malta’s public higher education institutions. The online register of licensed private providers kept by the Malta Further and Higher Education Authority (MFHEA) could not be opened when we checked (its security certificate failed), so private providers are not listed yet.',
 'ownershipNote': 'Both institutions listed are public.',
 'rules': {
  'portal': {'label': 'University of Malta — dates and deadlines', 'url': 'https://www.um.edu.mt/study/datesdeadlines/'},
  'applicationFee': 'The University of Malta charges application fees set under its fees regulations — see its fees page.',
  'tuition': 'Non-EU tuition at the University of Malta is set per course under the University Fees Regulations; MCAST publishes a separate fee structure for non-EU candidates.',
  'english': 'University of Malta — undergraduate: IELTS Academic 6.0 (writing 6.0, other bands 5.5), TOEFL iBT 80 (writing 20), Cambridge Advanced grade C, or PTE Academic 65 (59 in each part). Postgraduate: IELTS 6.5 (no band below 6.0) or TOEFL iBT 95 (writing 24).',
  'entry': ['Apply to the institution. Non-EU applicants living outside the EU cannot start in February — they apply for the October intake.'],
  'deadlines': [{'label': 'University of Malta — Medicine and Surgery (overseas qualifications), October 2027 intake', 'date': '2027-01-15', 'apply': True},
                {'label': 'University of Malta — non-EU applicants needing a visa, October 2027 intake (14:00)', 'date': '2027-07-01', 'apply': True},
                {'label': 'University of Malta — general deadline, October 2027 intake (14:00)', 'date': '2027-07-21', 'apply': True}],
  'deadlineNote': 'Most research master’s and doctoral programmes accept applications all year round.',
  'funds': None, 'scholarships': [], 'scholarshipNote': None},
 'sources': [{'label': 'University of Malta — dates and deadlines', 'url': 'https://www.um.edu.mt/study/datesdeadlines/'},
             {'label': 'University of Malta — English language requirements', 'url': 'https://www.um.edu.mt/study/admissionsadvice/international/englishlanguagerequirements/'},
             {'label': 'University of Malta — fees and funding', 'url': 'https://www.um.edu.mt/study/feesfunding/'},
             {'label': 'MCAST — fees for non-EU candidates', 'url': 'https://mcast.edu.mt/fee-payments-for-non-eu-candidates/'},
             {'label': 'MFHEA — licensed providers', 'url': 'https://mfhea.mt/list-of-licensed-providers-and-accredited-programmes/'}],
 'institutions': [dict(i, ownership='public') for i in mt]})

d = json.load(open(P))
bys = {c['slug']: c for c in d['countries']}
for c in C: bys[c['slug']] = c
d['countries'] = list(bys.values())
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print({c['slug']: len(c['institutions']) for c in C})
