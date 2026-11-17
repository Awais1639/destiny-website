#!/usr/bin/env python3
"""Adds Central European countries to src/data/universities-europe.json (replaces by slug)."""
import json, re, sys, unicodedata
CHECKED = '2026-11-17'
P = sys.argv[1]

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'\(.*?\)', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def https(u):
    return re.sub(r'^http://', 'https://', u) if u else None

def inst(name, **k):
    d = {'slug': k.pop('slug', None) or slug(name), 'name': name}
    for key in ['localName', 'ownership', 'category', 'city', 'website', 'programmesUrl', 'profileUrl', 'english', 'programmes', 'tuition', 'parent', 'note']:
        v = k.get(key)
        if v not in (None, '', [], {}): d[key] = v
    return d

# ---------------- AUSTRIA ----------------
SIA = 'https://studyinaustria.at/en/study/institutions/'
at = []
for n, city, p in [
 ('University of Vienna','Vienna','university-of-vienna'),('BOKU University of Natural Resources and Life Sciences',None,'boku-university-of-natural-resources-and-life-sciences'),
 ('University of Veterinary Medicine Vienna','Vienna','university-of-veterinary-medicine-vienna'),('WU Vienna University of Economics and Business','Vienna','wu-vienna-university-of-economics-and-business'),
 ('University of Klagenfurt','Klagenfurt','university-of-klagenfurt'),('University of Salzburg','Salzburg','university-of-salzburg'),('University of Graz','Graz','university-of-graz'),
 ('University of Innsbruck','Innsbruck','university-of-innsbruck'),('Johannes Kepler University Linz (JKU)','Linz','johannes-kepler-university-linz-jku'),
 ('Medical University of Vienna','Vienna','medical-university-of-vienna'),('Medical University of Graz','Graz','medical-university-of-graz'),('Medical University of Innsbruck','Innsbruck','medical-university-of-innsbruck'),
 ('University of Applied Arts Vienna','Vienna','university-of-applied-arts-vienna'),('mdw – University of Music and Performing Arts Vienna','Vienna','mdw-university-of-music-and-performing-arts-vienna'),
 ('Academy of Fine Arts Vienna','Vienna','academy-of-fine-arts-vienna'),('Mozarteum University Salzburg','Salzburg','mozarteum-university-salzburg'),
 ('University of Music and Performing Arts Graz (KUG)','Graz','university-of-music-and-performing-arts-kug'),('University of Arts Linz','Linz','university-of-art-and-design-linz'),
 ('TU Wien','Vienna','vienna-university-of-technology'),('Montanuniversität Leoben','Leoben','montanuniversitaet-leoben'),('Graz University of Technology','Graz','graz-university-of-technology'),
 ('IT:U Interdisciplinary Transformation University Austria',None,'itu-interdisciplinary-transformation-university-austria'),('University for Continuing Education Krems','Krems','danube-university-krems')]:
    at.append(inst(n, ownership='public', category='Public university', city=city, profileUrl=SIA + 'universities/' + p))
for n, city, p in [
 ('FHWien der WKW','Vienna','fhwien-der-wkw-university-of-applied-sciences-for-management-communication'),('UAS Technikum Wien','Vienna','uas-technikum-wien-vienna'),
 ('University of Applied Sciences for Business & Society BFI Vienna','Vienna','university-of-applied-sciences-for-business-society-bfi-vienna'),('Hochschule Campus Wien','Vienna','fh-campus-wien-university-of-applied-sciences'),
 ('Lauder Business School','Vienna','lauder-business-school'),('IMC Krems University of Applied Sciences',None,'imc-university-of-applied-sciences-krems'),
 ('USTP – University of Applied Sciences St. Pölten',None,'ustp-university-of-applied-sciences-st-poelten'),('University of Applied Sciences Wiener Neustadt',None,'university-of-applied-sciences-wiener-neustadt'),
 ('University of Applied Military Sciences',None,'theresan-military-academy'),('FERNFH Distance-Learning University of Applied Sciences',None,'fernfh-distance-learning-university-of-applied-sciences'),
 ('University of Applied Sciences Burgenland',None,'university-of-applied-sciences-burgenland'),('University of Applied Sciences for Health Professions Upper Austria',None,'university-of-applied-sciences-for-health-professions-upper-austria'),
 ('University of Applied Sciences Upper Austria',None,'university-of-applied-sciences-upper-austria'),('FH JOANNEUM',None,'fh-joanneum-university-of-applied-sciences'),
 ('CAMPUS 02 University of Applied Sciences',None,'campus-02-university-of-applied-sciences'),('Salzburg University of Applied Sciences',None,'salzburg-university-of-applied-sciences'),
 ('Carinthia University of Applied Sciences',None,'carinthia-university-of-applied-sciences'),('MCI | The Entrepreneurial School',None,'management-center-innsbruck'),
 ('Health University of Applied Sciences Tyrol',None,'health-university-of-applied-sciences-tyrol'),('Kufstein University of Applied Sciences',None,'kufstein-university-of-applied-sciences'),
 ('FHV – Vorarlberg University of Applied Sciences',None,'vorarlberg-university-of-applied-sciences-fh-vorarlberg')]:
    at.append(inst(n, category='University of applied sciences', city=city, profileUrl=SIA + 'university-of-applied-sciences/' + p))
for n, p in [('Music and Arts University of the City of Vienna','music-and-arts-university-of-the-city-of-vienna'),('Modul University Vienna','modul-university-vienna'),
 ('Sigmund Freud University','sigmund-freud-university'),('Webster Vienna Private University','webster-vienna-private-university'),('Central European University (CEU)','central-european-university-ceu'),
 ('JAM MUSIC LAB Private University for Jazz and Popular Music Vienna','jam-music-lab-private-university-for-jazz-and-popular-music-vienna'),('Karl Landsteiner University of Health Sciences','karl-landsteiner-university-of-health-sciences-kl'),
 ('Danube Private University','danube-private-university-dpu'),('New Design University','new-design-university-ndu'),('Bertha von Suttner Private University St. Pölten','bertha-von-suttner-privatuniversitaet-st-poelten'),
 ('Paracelsus Medical University','paracelsus-medical-university-pmu'),('Seeburg Castle University','seeburg-castle-university'),
 ('UMIT TIROL – Private University for Health Sciences and Technology','umit-tirol-private-university-for-health-sciences-medical-informatics-and-technology'),
 ('Catholic Private University Linz','catholic-private-university-linz'),('Anton Bruckner Private University','anton-bruckner-private-university'),('Gustav Mahler Private University for Music','gustav-mahler-private-university-for-music'),
 ('Stella Vorarlberg Private University for Music','stella-vorarlberg-private-university-for-music'),('University of Sustainability – Charlotte Fresenius Private University','charlotte-fresenius-private-university'),
 ('Joseph Haydn Private University','joseph-haydn-private-university')]:
    at.append(inst(n, ownership='private', category='Private university', profileUrl=SIA + 'private-universities/' + p))
for n, p in [('University College of Teacher Education Vienna','university-college-of-teacher-education-vienna'),('University College of Agricultural and Environmental Education','university-college-for-agrarian-and-environmental-pedagogy'),
 ('KPH Vienna/Lower Austria','university-college-of-teacher-education-viennakrems'),('University College of Teacher Education Burgenland','university-college-of-teacher-education-burgenland'),
 ('University of Teacher Education Carinthia','university-college-of-teacher-education-carinthia'),('University College of Teacher Education Lower Austria','university-college-of-teacher-education-lower-austria'),
 ('University of Education Salzburg Stefan Zweig','salzburg-university-of-education-stefan-zweig'),('University College of Teacher Education Styria','university-college-of-teacher-education-styria'),
 ('Private University College of Teacher Education Augustinum','private-university-college-of-teacher-education-augustinum'),('University College of Teacher Education Tyrol','university-college-of-teacher-education-tyrol'),
 ('KPH Edith Stein','university-college-of-teacher-education-edith-stein'),('University of Education Upper Austria','university-of-education-upper-austria'),
 ('Private University of Education, Diocese of Linz','private-university-of-education-diocese-of-linz'),('University College of Teacher Education Vorarlberg','university-college-of-teacher-education-vorarlberg')]:
    at.append(inst(n, category='University college of teacher education', ownership='private' if n.startswith('Private') else None, profileUrl=SIA + 'university-colleges-of-teacher-education/' + p))

# ---------------- SWITZERLAND ----------------
SWU = 'https://www.swissuniversities.ch/en/themen/lehre-studium/information-on-studies/tuition-fees/tuition-fees-at-universities'
SWF = 'https://www.swissuniversities.ch/en/themen/lehre-studium/information-on-studies/tuition-fees/tuition-fees-at-uas'
ch = []
for n, short, u, fee in [
 ('ETH Zurich','ETH','https://www.ethz.ch/','CHF 2,190 per semester (bachelor’s and master’s)'),('EPFL – Swiss Federal Institute of Technology in Lausanne','EPFL','https://www.epfl.ch/','CHF 2,190 per semester'),
 ('University of Basel',None,'https://www.unibas.ch/','CHF 850 per semester'),('University of Bern',None,'https://www.unibe.ch/','CHF 2,550 per semester'),
 ('University of Fribourg',None,'https://www.unifr.ch/','CHF 870 per semester'),('University of Geneva',None,'https://www.unige.ch/','CHF 435 per semester'),
 ('University of Lausanne',None,'https://www.unil.ch/','CHF 500 per semester'),('University of Lucerne',None,'https://www.unilu.ch/','CHF 1,025 per semester'),
 ('University of Neuchâtel',None,'https://www.unine.ch/','CHF 775 per semester'),('University of St. Gallen (HSG)',None,'https://www.unisg.ch/','CHF 3,103 per semester (bachelor’s), CHF 3,317 (master’s)'),
 ('Università della Svizzera italiana (USI)',None,'https://www.usi.ch/','CHF 4,000 per semester'),('University of Zurich',None,'https://www.uzh.ch/','CHF 1,220 per semester (bachelor’s), CHF 820 (master’s)')]:
    ch.append(inst(n, slug=slug(short) if short else None, category='University', website=u, tuition={'text': 'Foreign students, 2026–27: ' + fee, 'source': SWU}))
for n, u, fee in [
 ('Bern University of Applied Sciences (BFH)','https://www.bfh.ch/en/','CHF 850, 1,050 or 2,550 per semester depending on the programme'),
 ('University of Applied Sciences of the Grisons (FHGR)','https://www.fhgr.ch','CHF 1,550 per semester'),
 ('University of Applied Sciences and Arts Northwestern Switzerland (FHNW)','https://www.fhnw.ch','CHF 1,000–5,000 per semester'),
 ('HES-SO University of Applied Sciences and Arts Western Switzerland','https://www.hes-so.ch','CHF 1,050 per semester (EHL: about CHF 15,850 on average)'),
 ('Lucerne University of Applied Sciences and Arts (HSLU)','https://www.hslu.ch','CHF 1,300 per semester'),
 ('Kalaidos University of Applied Sciences','https://www.kalaidos-fh.ch',None),
 ('OST – Eastern Switzerland University of Applied Sciences','https://www.ost.ch/en/','CHF 1,500 per semester'),
 ('SUPSI – University of Applied Sciences and Arts of Southern Switzerland','https://www.supsi.ch','CHF 1,000–4,000 per semester depending on programme and level'),
 ('Zurich University of the Arts (ZHdK)','https://www.zhdk.ch/','CHF 1,220 per semester'),
 ('Zurich University of Applied Sciences (ZHAW)','https://www.zhaw.ch/','CHF 1,220 per semester')]:
    ch.append(inst(n, category='University of applied sciences', website=u, tuition={'text': 'Foreign students, 2026–27: ' + fee, 'source': SWF} if fee else None,
                   ownership='private' if n.startswith('Kalaidos') else None,
                   note='swissuniversities lists Kalaidos as a private institution and gives no fee for it.' if n.startswith('Kalaidos') else None))
for n, u in [('HEP-BEJUNE – University of Teacher Education of Bern, Jura and Neuchâtel','https://www.hep-bejune.ch/'),('HEP Vaud – University of Teacher Education Vaud','https://www.hepl.ch/'),
 ('HEP-VS | PH-VS – University of Teacher Education Valais','https://www.phvs.ch/'),('Hochschulinstitut IVP NMS','https://www.nmsbern.ch/ivp'),
 ('HfH – University of Teacher Education in Special Needs','https://www.hfh.ch/'),('PHGR – University of Teacher Education Graubünden','https://www.phgr.ch/'),
 ('PHBern – Bern University of Teacher Education','https://www.phbern.ch/'),('PH Luzern – Lucerne University of Teacher Education','https://www.phlu.ch/'),
 ('PH FHNW – School of Education FHNW','https://www.fhnw.ch/ph'),('PHSG – St. Gallen University of Teacher Education','https://www.phsg.ch/'),
 ('PHSH – Schaffhausen University of Teacher Education','https://www.phsh.ch/'),('PHSZ – Schwyz University of Teacher Education','https://www.phsz.ch/'),
 ('PHTG – Thurgau University of Teacher Education','https://www.phtg.ch/'),('PH Zürich – Zurich University of Teacher Education','https://www.phzh.ch/'),
 ('PH Zug – Zug University of Teacher Education','https://www.zg.ch/behoerden/direktion-fur-bildung-und-kultur/phzg/'),
 ('Hochschule für Logopädie Ostschweiz (hlo)','https://www.shlr.ch/hlo/die-shlr/'),
 ('Swiss Federal University for Vocational Education and Training (SFUVET)','https://www.sfivet.swiss/')]:
    ch.append(inst(n, category='University of teacher education', website=u))
for n, kind, u in [
 ('César Ritz Colleges Switzerland','UAS','https://www.cesarritzcolleges.edu/en/'),('Franklin University Switzerland','U','https://www.fus.edu/'),
 ('Glion Institute of Higher Education','UAS','https://www.glion.edu/'),('HWZ University of Applied Sciences in Business Administration Zurich','UAS','https://fh-hwz.ch/'),
 ('Hochschulinstitut Schaffhausen (HSSH)','U','https://www.hochschule-schaffhausen.ch/'),('IMD – International Institute for Management Development','U','https://www.imd.org/'),
 ('Geneva Graduate Institute (IHEID)','U','https://graduateinstitute.ch/'),('Les Roches Global Hospitality Education','UAS','https://lesroches.edu/'),
 ('Swiss TCM University','U','https://www.tcmuni.ch/'),('UniDistance Suisse (Swiss Distance University)','U','https://www.fernuni.ch/'),
 ('Swiss Business School (SBS)','UAS','https://www.sbs.edu'),('Swiss Federal Institute of Sport Magglingen (SFISM)','UAS','https://www.bfh.ch/ehsm/en/'),
 ('Swiss UMEF','UAS','https://www.swiss-umef.ch/en'),('Theologische Hochschule Chur','U','https://www.thchur.ch/')]:
    ch.append(inst(n, category='Accredited university institute' if kind == 'U' else 'Accredited university of applied sciences institute', website=u))

# ---------------- CZECH REPUBLIC ----------------
MS = 'https://archiv.msmt.gov.cz/vzdelavani/vysoke-skolstvi/prehled-vysokych-skol-v-cr-3'
cz = []
for en, local, city, u in [
 ('Academy of Performing Arts in Prague (AMU)','Akademie múzických umění v Praze','Prague','http://www.amu.cz/'),
 ('Academy of Fine Arts in Prague (AVU)','Akademie výtvarných umění v Praze','Prague','http://www.avu.cz/'),
 ('Czech University of Life Sciences Prague','Česká zemědělská univerzita v Praze','Prague','http://www.czu.cz/'),
 ('Czech Technical University in Prague','České vysoké učení technické v Praze','Prague','http://www.cvut.cz/'),
 ('Janáček Academy of Performing Arts (JAMU)','Janáčkova akademie múzických umění','Brno','http://www.jamu.cz/'),
 ('University of South Bohemia in České Budějovice','Jihočeská univerzita v Českých Budějovicích','České Budějovice','http://www.jcu.cz/'),
 ('Masaryk University','Masarykova univerzita','Brno','http://www.muni.cz/'),
 ('Mendel University in Brno','Mendelova univerzita v Brně','Brno','http://www.mendelu.cz/'),
 ('University of Ostrava','Ostravská univerzita','Ostrava','http://www.osu.cz/'),
 ('Silesian University in Opava','Slezská univerzita v Opavě','Opava','http://www.slu.cz/'),
 ('Technical University of Liberec','Technická univerzita v Liberci','Liberec','http://www.vslib.cz/'),
 ('University of Hradec Králové','Univerzita Hradec Králové','Hradec Králové','http://www.uhk.cz/'),
 ('Jan Evangelista Purkyně University in Ústí nad Labem','Univerzita Jana Evangelisty Purkyně v Ústí nad Labem','Ústí nad Labem','http://www.ujep.cz/'),
 ('Charles University','Univerzita Karlova','Prague','http://www.cuni.cz/'),
 ('Palacký University Olomouc','Univerzita Palackého v Olomouci','Olomouc','http://www.upol.cz/'),
 ('University of Pardubice','Univerzita Pardubice','Pardubice','http://www.upce.cz/'),
 ('Tomas Bata University in Zlín','Univerzita Tomáše Bati ve Zlíně','Zlín','http://www.utb.cz/'),
 ('Veterinary University Brno','Veterinární univerzita Brno','Brno','http://www.vfu.cz/'),
 ('VSB – Technical University of Ostrava','Vysoká škola báňská – Technická univerzita Ostrava','Ostrava','http://www.vsb.cz/'),
 ('Prague University of Economics and Business','Vysoká škola ekonomická v Praze','Prague','http://www.vse.cz/'),
 ('University of Chemistry and Technology, Prague','Vysoká škola chemicko-technologická v Praze','Prague','http://www.vscht.cz/'),
 ('College of Polytechnics Jihlava','Vysoká škola polytechnická Jihlava','Jihlava','http://www.vspj.cz'),
 ('Institute of Technology and Business in České Budějovice','Vysoká škola technická a ekonomická v Českých Budějovicích','České Budějovice','http://www.vstecb.cz/'),
 ('Academy of Arts, Architecture and Design in Prague (UMPRUM)','Vysoká škola uměleckoprůmyslová v Praze','Prague','http://www.vsup.cz/'),
 ('Brno University of Technology','Vysoké učení technické v Brně','Brno','http://www.vutbr.cz/'),
 ('University of West Bohemia','Západočeská univerzita v Plzni','Plzeň','http://www.zcu.cz/')]:
    cz.append(inst(en, localName=local, ownership='public', category='Public higher education institution', city=city, website=https(u)))
cz.append(inst('Police Academy of the Czech Republic in Prague', localName='Policejní akademie České republiky v Praze', ownership='public', category='State higher education institution', city='Prague', website='https://www.polac.cz/'))
cz.append(inst('University of Defence', localName='Univerzita obrany', ownership='public', category='State higher education institution', city='Brno', website='https://www.unob.cz/'))
for local, en, city, u in [
 ('AMBIS vysoká škola','AMBIS University',None,'https://www.ambis.cz/'),('Anglo-americká vysoká škola','Anglo-American University','Prague','http://www.aauni.edu'),
 ('ARCHIP','ARCHIP – Architectural Institute in Prague','Prague','http://www.archip.eu/'),('ART & DESIGN INSTITUT',None,'Prague','http://www.artdesigninstitut.cz'),
 ('CEVRO Univerzita','CEVRO University',None,'http://www.vsci.cz/'),('Evropská výzkumná univerzita',None,None,'http://www.vsss.cz/'),
 ('Filmová akademie Miroslava Ondříčka v Písku','Film Academy of Miroslav Ondříček in Písek','Písek','http://www.filmovka.cz/'),
 ('Metropolitní univerzita Praha','Metropolitan University Prague','Prague','http://www.mup.cz'),('Moravská vysoká škola Olomouc','Moravian Business College Olomouc','Olomouc','http://www.mvso.cz/'),
 ('Panevropská univerzita','Pan-European University','Prague','https://www.peuni.cz/univerzita/'),('Pražská vysoká škola psychosociálních studií',None,'Prague','http://www.pvsps.cz/'),
 ('ŠKODA AUTO Vysoká škola','ŠKODA AUTO University','Mladá Boleslav','https://www.savs.cz/'),('Unicorn Vysoká škola','Unicorn University','Prague','http://www.unicorncollege.cz'),
 ('United vysoká škola',None,None,'https://www.ucp.cz/'),('University of New York in Prague',None,'Prague','http://www.unyp.cz/'),
 ('Vysoká škola aplikované psychologie',None,'Prague','http://www.vsaps.cz/'),('Vysoká škola ekonomie a managementu','University of Economics and Management','Prague','http://www.vsem.cz'),
 ('Vysoká škola evropských a regionálních studií',None,'České Budějovice','http://www.vsers.cz/'),('Vysoká škola finanční a správní',None,None,'http://www.vsfs.cz/'),
 ('Vysoká škola kreativní komunikace',None,'Prague','http://www.vskk.cz/'),('Vysoká škola logistiky',None,'Přerov','http://www.vslg.cz/'),
 ('Vysoká škola NEWTON','NEWTON University',None,'http://www.newtoncollege.cz/'),('Vysoká škola obchodní v Praze',None,'Prague','https://www.peuni.cz/fakulty/fakulta-vysoka-skola-obchodni/o-fakulte-vso/'),
 ('Vysoká škola Sting','STING Academy','Brno','http://www.sting.cz/'),('Vysoká škola tělesné výchovy a sportu Palestra',None,'Prague','http://www.palestra.cz/'),
 ('Vysoká škola zdravotnická',None,'Prague','https://www.vszdrav.cz/')]:
    cz.append(inst(en or local, localName=local if en else None, ownership='private', category='Private higher education institution', city=city, website=https(u)))

# ---------------- POLAND ----------------
pl_raw = '''Academy of Social and Media Culture in Toruń|Toruń
Adam Mickiewicz University in Poznań|Poznań
AGH University of Krakow|Kraków
Andrzej Frycz Modrzewski Krakow University|Kraków
Bialska Academy of John Paul II in Biała Podlaska|Biała Podlaska
Bialystok University of Technology|Białystok
Bielsko-Biała University|Bielsko-Biała
Bronisław Czech University of Physical Education in Krakow|Kraków
Cardinal Stefan Wyszyński University in Warsaw|Warsaw
Christian Theological Academy in Warsaw|Warsaw
Civitas University in Warsaw|Warsaw
Collegium Da Vinci in Poznań|Poznań
Commission of National Education University in Kraków|Kraków
Cracow University of Economics|Kraków
Częstochowa University of Technology|Częstochowa
Eugeniusz Piasecki University of Physical Education in Poznań|Poznań
European University of Medical and Social Sciences in Warsaw|Warsaw
Gdańsk University of Technology|Gdańsk
Helena Chodkowska University of Technology and Economics in Warsaw|Warsaw
Ignacy Łukasiewicz Rzeszów University of Technology|Rzeszów
Ignatianum Academy in Krakow|Kraków
International University of Logistics and Transport in Wrocław|Wrocław
Jacob of Paradies University|
Jagiellonian University in Kraków|Kraków
Jan and Jędrzej Śniadecki University of Technology in Bydgoszcz|Bydgoszcz
Jan Długosz University in Częstochowa|Częstochowa
Jan Grodek State University in Sanok|Sanok
Jan Kochanowski University in Kielce|Kielce
Jerzy Kukuczka University of Physical Education in Katowice|Katowice
Jędrzej Śniadecki University of Physical Education and Sport in Gdańsk|Gdańsk
John Paul II Catholic University of Lublin|Lublin
Józef Piłsudski University of Physical Education in Warsaw|Warsaw
Higher School of Art and Design in Lodz|Łódź
Higher School of Social and Medical Sciences in Warsaw|Warsaw
Katowice Institute of Information Technologies|Katowice
Kazimierz Pułaski University of Technology and Humanities in Radom|Radom
Kazimierz Wielki University in Bydgoszcz|Bydgoszcz
Kielce University of Technology|Kielce
Koszalin University of Technology|Koszalin
Kozminski University|
Lazarski University in Warsaw|Warsaw
Lodz University of Technology|Łódź
Lower Silesian University DSW in Wrocław|Wrocław
Lublin University of Technology|Lublin
Łomża Academy|Łomża
Maria Curie-Skłodowska University in Lublin|Lublin
Maria Grzegorzewska University|
Nicolaus Copernicus University in Toruń|Toruń
Opole University of Technology|Opole
Polish-Japanese Academy of Information Technology in Warsaw|Warsaw
Pomeranian University in Słupsk|Słupsk
Pontifical Faculty of Theology in Wroclaw|Wrocław
Pontifical University of John Paul II in Kraków|Kraków
Poznan School of Logistics|Poznań
Poznan University of Technology|Poznań
Poznań University of Economics and Business|Poznań
Poznań University of Life Sciences|Poznań
The School of Banking and Management in Cracow|Kraków
SGH Warsaw School of Economics|Warsaw
Silesian University of Technology in Gliwice|Gliwice
Sopot University of Applied Sciences|Sopot
State Academy of Applied Sciences in Chełm|Chełm
State Academy of Applied Sciences in Przemyśl|Przemyśl
State Academy of Applied Sciences named after Rev. Bronisław Markiewicz in Jarosław|Jarosław
State Vocational University of Prof. Edward F. Szczepanik in Suwałki|Suwałki
SWPS University|
Tadeusz Kościuszko Cracow University of Technology|Kraków
Tarnów Academy|Tarnów
Technical and Artistic University of Applied Sciences in Warsaw|Warsaw
The University College of Enterprise and Administration|
The University College of Tourism and Ecology|
University of Agriculture in Krakow|Kraków
University of Applied Sciences in Bielsko-Biała|Bielsko-Biała
University of Applied Sciences in Elbląg|Elbląg
University of Applied Sciences in Nowy Targ|Nowy Targ
University of Applied Sciences in Opole|Opole
University of Białystok|Białystok
University of Economics in Katowice|Katowice
University of Gdańsk|Gdańsk
University of Health in Gdańsk|Gdańsk
University of Information Technology and Management in Rzeszów|Rzeszów
University of Life Sciences in Lublin|Lublin
University of Łódź|Łódź
University of Opole|Opole
University of Physical Education of Polish Olympians in Wrocław|Wrocław
University of Rzeszów|Rzeszów
University of Siedlce|Siedlce
University of Silesia in Katowice|Katowice
University of Social Sciences in Łódź|Łódź
University of Szczecin|Szczecin
University of Warmia and Mazury in Olsztyn|Olsztyn
University of Warsaw|Warsaw
University of Wrocław|Wrocław
University of Zielona Góra|Zielona Góra
Vincent Pol University of Applied Sciences in Lublin|Lublin
Vistula School of Hospitality in Warsaw|Warsaw
Vistula University|
VIZJA University|
Warsaw College of Engineering and Health|Warsaw
Warsaw University of Life Sciences|Warsaw
Warsaw University of Technology|Warsaw
West Pomeranian University of Technology in Szczecin|Szczecin
WIT Academy in Warsaw|Warsaw
Wroclaw Business University of Applied Sciences|Wrocław
Wrocław University of Economics and Business|Wrocław
Wrocław University of Environmental and Life Sciences|Wrocław
Wrocław University of Science and Technology|Wrocław
WSB Merito University Gdansk|Gdańsk
WSB Merito University Poznan|Poznań
WSB Merito University Wroclaw|Wrocław
WSB University in Dąbrowa Górnicza|Dąbrowa Górnicza
Zamość Academy|Zamość'''
pl = [inst(n, category='Higher education institution', city=c or None) for n, c in (l.split('|') for l in pl_raw.splitlines())]

# ---------------- HUNGARY ----------------
SH = 'https://apply.stipendiumhungaricum.hu/institutions/institution/'
hu_raw = '''Budapest Circus Arts and Contemporary Dance College|Budapest|180-budapest-circus-arts-and-contemporary-dance-college
Budapest Metropolitan University|Budapest|181-budapest-metropolitan-university
Budapest University of Economics and Business|Budapest|128-budapest-university-economics-and-business
Budapest University of Technology and Economics|Budapest|22-budapest-university-technology-and-economics
Corvinus University of Budapest|Budapest|26-corvinus-university-budapest
Dharma Gate Buddhist College|Budapest|169-dharma-gate-buddhist-college
Eötvös Loránd University|Budapest|2-eotvos-lorand-university
Hungarian Dance University|Budapest|38-hungarian-dance-university
Hungarian University of Fine Arts|Budapest|42-hungarian-university-fine-arts
Hungarian University of Sports Science|Budapest|153-hungarian-university-sports-science
John Wesley Theological College|Budapest|156-john-wesley-theological-college
Károli Gáspár University of the Reformed Church in Hungary|Budapest|54-karoli-gaspar-university-reformed-church-hungary
Kodolányi János University|Budapest|183-kodolanyi-janos-university
Liszt Ferenc Academy of Music|Budapest|50-liszt-ferenc-academy-music
Ludovika University of Public Service|Budapest|62-ludovika-university-public-service
Moholy-Nagy University of Art and Design Budapest|Budapest|58-moholy-nagy-university-art-and-design-budapest
Obuda University|Budapest|66-obuda-university
Pázmány Péter Catholic University|Budapest|74-pazmany-peter-catholic-university
Semmelweis University|Budapest|78-semmelweis-university
University of Veterinary Medicine Budapest|Budapest|122-university-veterinary-medicine-budapest
University of Debrecen|Debrecen|90-university-debrecen
University of Dunaújváros|Dunaújváros|98-university-dunaujvaros
Eszterházy Károly Catholic University|Eger|34-eszterhazy-karoly-catholic-university
Széchenyi István University|Győr|82-szechenyi-istvan-university
Hungarian University of Agriculture and Life Sciences (MATE)|Gödöllő|86-hungarian-university-agriculture-and-life-sciences-mate
John von Neumann University|Kecskemét|70-john-von-neumann-university
University of Miskolc|Miskolc|106-university-miskolc
University of Nyíregyháza|Nyíregyháza|154-university-nyiregyhaza
University of Pécs|Pécs|114-university-pecs
University of Sopron|Sopron|126-university-sopron
University of Szeged|Szeged|118-university-szeged
Sárospatak Reformed Theological University|Sárospatak|184-sarospatak-reformed-theological-university
University of Tokaj|Sárospatak|170-university-tokaj
Edutus University|Tatabánya|185-edutus-university
University of Pannonia|Veszprém|110-university-pannonia
Apor Vilmos Catholic College|Vác|168-apor-vilmos-catholic-college'''
hu = [inst(n, category='College' if 'College' in n else 'University', city=c, profileUrl=SH + p) for n, c, p in (l.split('|') for l in hu_raw.splitlines())]

# ---------------- CROATIA ----------------
B, M, I, D, S = 'bachelor', 'master', 'integrated', 'phd', 'specialist'
def progs(spec):
    out = []
    for lvl, names in spec:
        for n in names: out.append({'level': lvl, 'name': n})
    return out
hr_data = [
 ('Algebra Bernays University', 'Zagreb', 'Private university' , progs([(B,['Visual Communications Design','Digital Marketing','Software Engineering','Cybersecurity','Multimedia Production','Game Development']),(M,['Creative Design Management','Digital Marketing','MBA e-Leadership','Applied Computer Engineering']),(D,['Computer and Data Science'])])),
 ('University of Dubrovnik','Dubrovnik',None, progs([(B,['Business Economics']),(M,['Conservation and Restoration','Mariculture','Economics','Business Economics','Mass Media','Applied/Business Computing']),(D,['Business Economics in the Digital Environment'])])),
 ('University of Rijeka','Rijeka',None, progs([(B,['Business Economics','International Business','Business Economics in Tourism and Hospitality','Hospitality Management','Joint Bachelor in Urban Sustainability Studies (YUFE)']),(M,['Biotechnology for the Life Sciences','Cognition and the Mind','International Business','Sustainable Outdoor Hospitality Management','Discrete Mathematics and Its Applications']),(I,['Dental Medicine','Medicine']),(D,['Governance and Economics in the Public Sector','Engineering Sciences']),(S,['Urban Studies'])])),
 ('University of Zagreb','Zagreb',None, progs([(B,['Economics','Business','Computing','Electrical Engineering and Information Technology']),(M,['Economics','Business','Computing','Electrical Engineering and Information Technology','Information and Communication Technology','Applied Cognitive Science','Sculpture','New Media','Graphic Arts','Painting','Environment, Agriculture and Resource Management','Sustainability in Agriculture, Food Production and Food Technology in the Danube Region','Close to Nature Forestry','Digital Linguistics','Interdisciplinary Research and Studies in Eastern Europe','European Studies','East European and Eurasian Studies','Biomedical Mathematics','Petroleum and Geoenergy Engineering and Management','Applied Geology and Geological Engineering','Chemical and Environmental Technology','Logistics and Mobility Management']),(I,['Veterinary Medicine','Medicine','Dental Medicine','Pharmacy']),(D,['Electrical Engineering and Computing','Linguistics','Mechanical Engineering, Naval Architecture, Aeronautical Engineering and Metallurgical Engineering','Digital Innovation Management','Biomedicine and Health Sciences','Kinesiology','Human Rights, Society and Multi-level Governance']),(S,['CO2 Geological Storage','MBA in Construction','15 veterinary specialist programmes (e.g. Farm Biosecurity, Veterinary Epidemiology, Wildlife Health and Management)'])])),
 ('University of Zadar','Zadar',None, progs([(B,['Language and Communication in a Multilingual Society (double major)']),(M,['Marine Biotechnology'])])),
 ('University of Split','Split',None, progs([(B,['Psychology','Forensic Sciences']),(M,['Democracy and Resilience in Modern Society','Forensic Sciences','Data Science and Engineering','International Basketball Coaching and Management','Chemical and Environmental Technology']),(I,['Medicine']),(D,['Military Naval Studies','Biology and Neoplasms','Evidence-Based Clinical Medicine','Translational Research in Biomedicine (TRIBE)','Biophysics','Technologies in Maritime Affairs']),(S,['Sleep Medicine','Management of Healthcare Organizations'])])),
 ('Josip Juraj Strossmayer University of Osijek','Osijek',None, progs([(M,['Biotechnology','Digital Agriculture','Entrepreneurial Management and Entrepreneurship','Automotive Computing and Communications','Resilient Structures']),(S,['Public Relations and Communication Studies'])])),
 ('RIT Croatia','Zagreb and Dubrovnik',None, progs([(B,['Global Business Management','Hospitality and Tourism Management','Web and Mobile Computing','New Media Design'])])),
 ("VERN' University",'Zagreb',None, progs([(B,['Entrepreneurship Economics','Tourism and Hotel Management'])])),
 ('Zagreb School of Economics and Management','Zagreb',None, progs([(B,['Business Mathematics and Economics','Economics and Management']),(M,['MBA Management'])])),
 ('Libertas International University','Zagreb',None, progs([(B,['International Relations'])])),
 ('Juraj Dobrila University of Pula','Pula',None, progs([(D,['International Economic Relations and Management'])])),
 ('University North','Varaždin',None, progs([(D,['Educational & Communication Sciences'])])),
 ('Zagreb University of Applied Sciences','Zagreb',None, progs([(M,['Information Security and Digital Forensics'])])),
]
HRP = 'https://www.studyincroatia.hr/study-in-croatia/study-programmes-in-english/'
hr = []
for n, city, _cat, pr in hr_data:
    cnt = {}
    for p in pr: cnt[p['level']] = cnt.get(p['level'], 0) + 1
    e = {'total': len(pr)}
    for k in ('bachelor', 'master', 'phd'):
        if cnt.get(k): e[k] = cnt[k]
    hr.append(inst(n, category='Higher education institution', city=city, programmesUrl=HRP, programmes=pr, english=e))

C = []
C.append({'slug': 'austria', 'name': 'Austria', 'checked': CHECKED,
  'scope': 'Every higher education institution listed by Study in Austria (OeAD): 23 public universities, 21 universities of applied sciences, 19 private universities and 14 university colleges of teacher education.',
  'ownershipNote': 'Public = the “Universities” group and private = the “Private universities” group on Study in Austria. Universities of applied sciences and teacher-education colleges are not labelled by ownership there, except colleges whose official name says “Private”.',
  'rules': {
    'portal': {'label': 'Apply directly to each institution', 'url': 'https://studyinaustria.at/en/plan-your-studies/application-and-admission'},
    'applicationFee': 'Not specified by Study in Austria — check the institution.',
    'tuition': 'Public universities: non-EU students holding a student residence permit generally pay €726.72 per semester, plus the compulsory €26.20 students’ union (ÖH) fee. Universities of applied sciences and private universities set their own fees. Exemptions are possible for some scholarship holders, exchange students and students from specific countries.',
    'english': 'Most programmes are taught in German, with a growing number in English. The language requirement and accepted certificates are set by each programme.',
    'entry': ['Bachelor’s: a secondary school leaving certificate that entitles you to university study in your home country, plus proof of the teaching language (German for German-taught programmes).',
              'Master’s: a relevant bachelor’s degree of at least six semesters (180 ECTS). PhD: a master’s degree in a related field.',
              'Foreign documents must be legalised; documents not in German or English need legalised translations. Some programmes (e.g. medicine, arts, many UAS programmes) have entrance exams.'],
    'deadlines': [{'label': 'Public universities — summer semester 2027 (non-EU applicants)', 'date': '2027-02-05', 'apply': True},
                  {'label': 'Public universities — winter semester 2027/28 (non-EU applicants)', 'date': '2027-09-05', 'apply': True}],
    'deadlineNote': 'These are the general deadlines Study in Austria gives for universities. Universities of the arts, private universities, universities of applied sciences and teacher-education colleges have their own deadlines, and programmes with entrance exams can close up to six months before the semester.',
    'funds': None, 'scholarships': [], 'scholarshipNote': None},
  'sources': [{'label': 'Study in Austria — higher education institutions', 'url': 'https://studyinaustria.at/en/study/institutions'},
              {'label': 'Study in Austria — tuition fees', 'url': 'https://studyinaustria.at/en/plan-your-studies/tuition-fee'},
              {'label': 'Study in Austria — application and admission', 'url': 'https://studyinaustria.at/en/plan-your-studies/application-and-admission'}],
  'institutions': at})
C.append({'slug': 'switzerland', 'name': 'Switzerland', 'checked': CHECKED,
  'scope': 'Every accredited higher education institution listed by swissuniversities: universities and federal institutes of technology, universities of applied sciences, universities of teacher education and other accredited institutes.',
  'ownershipNote': 'swissuniversities does not label institutions public or private, except Kalaidos, which it lists as private.',
  'rules': {
    'portal': {'label': 'Apply directly to each institution', 'url': 'https://www.swissuniversities.ch/en/topics/studying/accredited-swiss-higher-education-institutions'},
    'applicationFee': 'Set by each institution — check its admissions page.',
    'tuition': 'Fees for foreign students at universities range from CHF 435 to CHF 4,000 per semester (2026–27); at universities of applied sciences mostly CHF 1,050–5,000 per semester. Each university’s fee is shown on its page here.',
    'english': 'Language skills and/or exams are required as set by each university; programmes are taught in German, French, Italian or English.',
    'entry': ['Admission depends on the country where you earned your school certificate: swissuniversities publishes the requirement for each country and each university — for some countries this means one or two years of university study first, or a complementary exam (ECUS).',
              'Master’s: a recognised bachelor’s degree in a relevant field; the university decides on admission.'],
    'deadlines': [], 'deadlineNote': 'Each university sets its own application deadline — see the institution’s admissions page.',
    'funds': None,
    'scholarships': [], 'scholarshipNote': None},
  'sources': [{'label': 'swissuniversities — accredited institutions', 'url': 'https://www.swissuniversities.ch/en/topics/studying/accredited-swiss-higher-education-institutions'},
              {'label': 'swissuniversities — tuition fees at universities', 'url': SWU},
              {'label': 'swissuniversities — tuition fees at UAS', 'url': SWF},
              {'label': 'swissuniversities — admission requirements by country', 'url': 'https://www.swissuniversities.ch/en/topics/studying/admission-to-universities/countries-1'}],
  'institutions': ch})
C.append({'slug': 'czech-republic', 'name': 'Czech Republic', 'checked': CHECKED,
  'scope': 'Every public, state and active private higher education institution on the Ministry of Education’s list of higher education institutions (archive edition — the Ministry is moving to a new website).',
  'ownershipNote': 'Public and state institutions are marked public; private institutions as private — as grouped by the Ministry of Education, Youth and Sports.',
  'rules': {
    'portal': {'label': 'Study in Czechia — how to apply', 'url': 'https://studyin.gov.cz/plan-your-studies/how-to-apply'},
    'applicationFee': 'Most universities charge an application fee; the amount is set by each university.',
    'tuition': 'Degree programmes taught in Czech at public and state universities are tuition-free for all nationalities. English-taught programmes charge tuition set by each university.',
    'english': 'Set by each university and programme. Czech-taught programmes usually require Czech at level B2.',
    'entry': ['Each university sets its own requirements, deadlines and process. Your previous education may need official recognition (nostrification) — start early.',
              'Some programmes have entrance exams, interviews or portfolio reviews in spring or early summer.'],
    'deadlines': [], 'deadlineNote': 'Many applications for September start close between February and April; results are often announced in June–July. Always follow the deadline of your programme.',
    'funds': None, 'scholarships': [], 'scholarshipNote': None},
  'sources': [{'label': 'Ministry of Education — overview of higher education institutions', 'url': MS},
              {'label': 'Study in Czechia — how to apply', 'url': 'https://studyin.gov.cz/plan-your-studies/how-to-apply'},
              {'label': 'Study in Czechia — study tuition-free in Czech', 'url': 'https://studyin.gov.cz/plan-your-studies/learn-czech-study-tuition-free'}],
  'institutions': cz})
C.append({'slug': 'poland', 'name': 'Poland', 'checked': CHECKED,
  'scope': 'The 112 universities supervised by the Ministry of Science and Higher Education that have a framework agreement with NAWA (Polish National Agency for Academic Exchange) for 2026/27.',
  'ownershipNote': 'The NAWA list does not say which universities are public or private, so ownership is not shown.',
  'rules': {
    'portal': {'label': 'Apply directly to each university', 'url': 'https://nawa.gov.pl/images/publikacje/Study_in_Poland.pdf'},
    'applicationFee': 'Set by each university.',
    'tuition': 'About €1,000–6,000 a year for bachelor’s and €1,500–8,000 for master’s and long-cycle studies; medicine, dentistry and MBA programmes €12,000–15,000 or more. Doctoral schools are tuition-free and full-time candidates receive a scholarship. (NAWA, December 2023.)',
    'english': 'English-taught programmes require at least B2 — a certificate or previous education fully in English.',
    'entry': ['There is no central application system — you apply to the university.',
              'Foreign diplomas are recognised through international agreements or by nostrification at a Polish university; check with ENIC-NARIC Poland.'],
    'deadlines': [], 'deadlineNote': 'Admission campaigns usually start in April or May and can run for up to six months, depending on the university.',
    'funds': 'Living costs start from about €600 a month; the average student spends about €890 (NAWA).',
    'scholarships': [], 'scholarshipNote': None},
  'sources': [{'label': 'NAWA — list of universities 2026/27', 'url': 'https://nawa.gov.pl/images/Banach/2026/Banach-NAWA---Att.-2.-List-of-universities-2026.pdf'},
              {'label': 'NAWA — Study in Poland (December 2023)', 'url': 'https://nawa.gov.pl/images/publikacje/Study_in_Poland.pdf'}],
  'institutions': pl, 'linkless': True})
C.append({'slug': 'hungary', 'name': 'Hungary', 'checked': CHECKED,
  'scope': 'Every Hungarian higher education institution that accepts international students through the Study in Hungary / Stipendium Hungaricum application system (Tempus Public Foundation).',
  'ownershipNote': 'The official list does not label institutions public, church or private, so ownership is not shown.',
  'rules': {
    'portal': {'label': 'Apply directly to each institution', 'url': 'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/entry-and-admission-requirements.html'},
    'applicationFee': 'Set by each institution.',
    'tuition': 'Self-financed students pay tuition set by each institution, usually (in part) before enrolment. Stipendium Hungaricum scholarships cover tuition for students from partner countries.',
    'english': 'Proof of language proficiency is required; tests and scores are set by each institution.',
    'entry': ['Bachelor’s: a secondary school diploma and transcript (with Hungarian or English translation); some programmes have an entrance exam.',
              'Master’s: a bachelor’s degree; PhD: a master’s-equivalent degree.'],
    'deadlines': [], 'deadlineNote': 'Self-financed applications: first round usually in November for February start; second round in February for September start; decisions around late July. Check the institution for exact dates.',
    'funds': None,
    'scholarships': [{'label': 'Stipendium Hungaricum Scholarship', 'href': '/scholarships/stipendium-hungaricum/'}], 'scholarshipNote': None},
  'sources': [{'label': 'Stipendium Hungaricum — institutions', 'url': 'https://apply.stipendiumhungaricum.hu/institutions'},
              {'label': 'Study in Hungary — entry and admission requirements', 'url': 'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/entry-and-admission-requirements.html'},
              {'label': 'Study in Hungary — application timeline', 'url': 'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/application-timeline.html'}],
  'institutions': hu})
C.append({'slug': 'croatia', 'name': 'Croatia', 'checked': CHECKED,
  'scope': 'Every institution with English-taught degree programmes listed by Study in Croatia, with each programme by level.',
  'ownershipNote': 'Study in Croatia does not label institutions public or private, so ownership is not shown.',
  'rules': {
    'portal': {'label': 'Study in Croatia — how to apply', 'url': 'https://www.studyincroatia.hr/study-in-croatia/how-to-apply/'},
    'applicationFee': 'Possible application fees of €60–300, set by each institution.',
    'tuition': 'Per year for international students: humanities and social sciences €1,100–10,400; natural and technical sciences about €1,000–6,000; medical studies €10,000–12,000. Each institution sets its own fees.',
    'english': 'You need knowledge of English for English-taught programmes; the institution sets how you prove it.',
    'entry': ['Undergraduate Croatian-taught programmes use the national “Postani student!” system; graduate programmes use diplomski.studij.hr or the institution; postgraduate programmes always apply to the institution. For English-taught programmes contact the institution directly.',
              'Admission requirements (previous qualification, grades, special skills) are set by each institution.'],
    'deadlines': [], 'deadlineNote': 'Set by each institution — contact the institution for its calendar.',
    'funds': 'You must show enough money for your stay, from your own funds or a scholarship.',
    'scholarships': [], 'scholarshipNote': 'Some institutions may offer partial tuition fee waivers.'},
  'sources': [{'label': 'Study in Croatia — study programmes in English', 'url': HRP},
              {'label': 'Study in Croatia — tuition fees and scholarships', 'url': 'https://www.studyincroatia.hr/study-in-croatia/tuition-fees-and-scholarships/'},
              {'label': 'Study in Croatia — how to apply', 'url': 'https://www.studyincroatia.hr/study-in-croatia/how-to-apply/'}],
  'institutions': hr})

d = json.load(open(P))
bys = {c['slug']: c for c in d['countries']}
for c in C:
    ss = [i['slug'] for i in c['institutions']]
    dup = {s for s in ss if ss.count(s) > 1}
    if dup:
        seen = set(); out = []
        for i in c['institutions']:
            if i['slug'] in seen: continue
            seen.add(i['slug']); out.append(i)
        c['institutions'] = out
    bys[c['slug']] = c
d['countries'] = list(bys.values())
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print({c['slug']: len(c['institutions']) for c in d['countries']})
