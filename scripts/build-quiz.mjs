// Baut data/quiz.json – die Fragenbank für das Reise-Quiz (quiz/index.html).
// Alle Fragen entstehen aus geprüften Daten der Website (Orte, UNESCO, Guides, Geschichten)
// plus Hauptstädte, Flaggen, Kontinente und handverlesenes Reisewissen.
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const arr = (d) => (Array.isArray(d) ? d : d.items || []);

// --- Kontinente (für passende Falschantworten); AMB = transkontinental, keine Kontinent-Frage ---
const CONT = {
  EU: 'AD AL AT BA BE BG BY CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SK SM UA VA XK',
  AS: 'AE AF AM AZ BD BH BN BT CN GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  AF: 'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RW SC SD SL SN SO SS ST SZ TD TG TN TZ UG ZA ZM ZW',
  NA: 'AG BB BS BZ CA CR CU DM DO GD GT HN HT JM KN LC MX NI PA SV TT US VC',
  SA: 'AR BO BR CL CO EC GY PE PY SR UY VE',
  OC: 'AU FJ FM KI MH NR NZ PG PW SB TO TV VU WS',
};
const AMB = new Set(['RU', 'TR', 'CY', 'GE', 'AM', 'AZ', 'KZ', 'EG', 'HK', 'PS']);
const cont = {};
for (const [k, v] of Object.entries(CONT)) for (const cc of v.split(' ')) cont[cc] = k;

// --- Hauptstädte: EN|DE (nur eindeutige Fälle; umstrittene/mehrfache Hauptstädte bewusst ausgelassen) ---
const CAPS_RAW = `AD Andorra la Vella;AE Abu Dhabi;AF Kabul;AG Saint John's;AL Tirana;AM Yerevan|Jerewan;AO Luanda;AR Buenos Aires;AT Vienna|Wien;AU Canberra;AZ Baku;BA Sarajevo;BB Bridgetown;BD Dhaka;BE Brussels|Brüssel;BF Ouagadougou;BG Sofia;BH Manama;BN Bandar Seri Begawan;BR Brasília;BS Nassau;BT Thimphu;BW Gaborone;BY Minsk;BZ Belmopan;CA Ottawa;CD Kinshasa;CF Bangui;CG Brazzaville;CH Bern;CL Santiago|Santiago de Chile;CM Yaoundé;CN Beijing|Peking;CO Bogotá;CR San José;CU Havana|Havanna;CV Praia;CY Nicosia|Nikosia;CZ Prague|Prag;DE Berlin;DJ Djibouti|Dschibuti;DK Copenhagen|Kopenhagen;DM Roseau;DO Santo Domingo;DZ Algiers|Algier;EC Quito;EE Tallinn;EG Cairo|Kairo;ER Asmara;ES Madrid;ET Addis Ababa|Addis Abeba;FI Helsinki;FJ Suva;FM Palikir;FR Paris;GA Libreville;GB London;GD St. George's;GE Tbilisi|Tiflis;GH Accra;GM Banjul;GN Conakry;GR Athens|Athen;GT Guatemala City|Guatemala-Stadt;GW Bissau;GY Georgetown;HN Tegucigalpa;HR Zagreb;HT Port-au-Prince;HU Budapest;IE Dublin;IN New Delhi|Neu-Delhi;IQ Baghdad|Bagdad;IR Tehran|Teheran;IS Reykjavík;IT Rome|Rom;JM Kingston;JO Amman;JP Tokyo|Tokio;KE Nairobi;KG Bishkek|Bischkek;KH Phnom Penh;KI South Tarawa|Süd-Tarawa;KM Moroni;KN Basseterre;KP Pyongyang|Pjöngjang;KR Seoul;KW Kuwait City|Kuwait-Stadt;KZ Astana;LA Vientiane;LB Beirut;LC Castries;LI Vaduz;LR Monrovia;LS Maseru;LT Vilnius;LU Luxembourg|Luxemburg;LV Riga;LY Tripoli|Tripolis;MA Rabat;MC Monaco;MD Chișinău;ME Podgorica;MG Antananarivo;MH Majuro;MK Skopje;ML Bamako;MM Naypyidaw;MN Ulaanbaatar;MR Nouakchott;MT Valletta;MU Port Louis;MV Malé;MW Lilongwe;MX Mexico City|Mexiko-Stadt;MY Kuala Lumpur;MZ Maputo;NA Windhoek;NE Niamey;NG Abuja;NI Managua;NL Amsterdam;NO Oslo;NP Kathmandu;NZ Wellington;OM Muscat|Maskat;PA Panama City|Panama-Stadt;PE Lima;PG Port Moresby;PH Manila;PK Islamabad;PL Warsaw|Warschau;PT Lisbon|Lissabon;PW Ngerulmud;PY Asunción;QA Doha;RO Bucharest|Bukarest;RS Belgrade|Belgrad;RU Moscow|Moskau;RW Kigali;SA Riyadh|Riad;SB Honiara;SC Victoria;SE Stockholm;SG Singapore|Singapur;SI Ljubljana;SK Bratislava;SL Freetown;SM San Marino;SN Dakar;SO Mogadishu|Mogadischu;SR Paramaribo;SS Juba;ST São Tomé;SV San Salvador;SY Damascus|Damaskus;TD N'Djamena;TG Lomé;TH Bangkok;TJ Dushanbe|Duschanbe;TL Dili;TM Ashgabat|Aşgabat;TN Tunis;TO Nukuʻalofa;TR Ankara;TT Port of Spain;TV Funafuti;TW Taipei;TZ Dodoma;UA Kyiv|Kiew;UG Kampala;US Washington, D.C.;UY Montevideo;UZ Tashkent|Taschkent;VA Vatican City|Vatikanstadt;VC Kingstown;VE Caracas;VN Hanoi;VU Port Vila;WS Apia;XK Pristina;ZM Lusaka;ZW Harare`;
const caps = {};
for (const e of CAPS_RAW.split(';')) { const cc = e.slice(0, 2); const [en, de] = e.slice(3).split('|'); caps[cc] = de ? [en, de] : [en]; }

// --- Handverlesenes Reisewissen: [Frage DE, Frage EN, Optionen DE, Optionen EN] – richtige Antwort steht immer zuerst ---
const TRIVIA = [
  ['Welches Land hat (mit Überseegebieten) die meisten Zeitzonen?', 'Which country has the most time zones (including overseas territories)?', ['Frankreich', 'Russland', 'USA', 'Großbritannien'], ['France', 'Russia', 'USA', 'United Kingdom']],
  ['Welches ist das kleinste Land der Welt?', 'What is the smallest country in the world?', ['Vatikanstadt', 'Monaco', 'San Marino', 'Liechtenstein'], ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein']],
  ['Welcher ist der längste Fluss Europas?', 'What is the longest river in Europe?', ['Wolga', 'Donau', 'Rhein', 'Dnepr'], ['Volga', 'Danube', 'Rhine', 'Dnieper']],
  ['Welcher ist der höchste Berg der Alpen?', 'What is the highest mountain in the Alps?', ['Mont Blanc', 'Matterhorn', 'Großglockner', 'Zugspitze'], ['Mont Blanc', 'Matterhorn', 'Grossglockner', 'Zugspitze']],
  ['Welche Stadt liegt auf zwei Kontinenten?', 'Which city lies on two continents?', ['Istanbul', 'Athen', 'Kairo', 'Moskau'], ['Istanbul', 'Athens', 'Cairo', 'Moscow']],
  ['Mit welcher Währung bezahlst du in Japan?', 'Which currency do you pay with in Japan?', ['Yen', 'Won', 'Yuan', 'Baht'], ['Yen', 'Won', 'Yuan', 'Baht']],
  ['Mit welcher Währung bezahlst du in der Schweiz?', 'Which currency do you pay with in Switzerland?', ['Franken', 'Euro', 'Krone', 'Schilling'], ['Swiss franc', 'Euro', 'Krone', 'Schilling']],
  ['Mit welcher Währung bezahlst du in Tschechien?', 'Which currency do you pay with in Czechia?', ['Tschechische Krone', 'Euro', 'Złoty', 'Forint'], ['Czech koruna', 'Euro', 'Złoty', 'Forint']],
  ['Mit welcher Währung bezahlst du in Ungarn?', 'Which currency do you pay with in Hungary?', ['Forint', 'Euro', 'Lei', 'Kuna'], ['Forint', 'Euro', 'Leu', 'Kuna']],
  ['Mit welcher Währung bezahlst du in Albanien?', 'Which currency do you pay with in Albania?', ['Lek', 'Euro', 'Dinar', 'Denar'], ['Lek', 'Euro', 'Dinar', 'Denar']],
  ['Mit welcher Währung bezahlst du in Thailand?', 'Which currency do you pay with in Thailand?', ['Baht', 'Ringgit', 'Dong', 'Rupiah'], ['Baht', 'Ringgit', 'Dong', 'Rupiah']],
  ['Mit welcher Währung bezahlst du in Vietnam?', 'Which currency do you pay with in Vietnam?', ['Dong', 'Kip', 'Baht', 'Riel'], ['Dong', 'Kip', 'Baht', 'Riel']],
  ['Welches Meer liegt zwischen Italien und Kroatien?', 'Which sea lies between Italy and Croatia?', ['Adria', 'Ägäis', 'Tyrrhenisches Meer', 'Ionisches Meer'], ['Adriatic Sea', 'Aegean Sea', 'Tyrrhenian Sea', 'Ionian Sea']],
  ['Welche ist die trockenste Wüste der Welt (ohne Polargebiete)?', 'Which is the driest non-polar desert in the world?', ['Atacama', 'Sahara', 'Gobi', 'Kalahari'], ['Atacama', 'Sahara', 'Gobi', 'Kalahari']],
  ['Welches Land ist flächenmäßig das größte der Welt?', 'Which country is the largest by area?', ['Russland', 'Kanada', 'China', 'USA'], ['Russia', 'Canada', 'China', 'USA']],
  ['Welches ist das höchste Gebäude der Welt?', 'What is the tallest building in the world?', ['Burj Khalifa', 'Shanghai Tower', 'One World Trade Center', 'Taipei 101'], ['Burj Khalifa', 'Shanghai Tower', 'One World Trade Center', 'Taipei 101']],
  ['Für welchen Flughafen steht der Code LHR?', 'Which airport has the code LHR?', ['London Heathrow', 'Lahore', 'London Luton', 'Le Havre'], ['London Heathrow', 'Lahore', 'London Luton', 'Le Havre']],
  ['Für welchen Flughafen steht der Code CDG?', 'Which airport has the code CDG?', ['Paris Charles de Gaulle', 'Cardiff', 'Chicago', 'Córdoba'], ['Paris Charles de Gaulle', 'Cardiff', 'Chicago', 'Córdoba']],
  ['Für welchen Flughafen steht der Code DUS?', 'Which airport has the code DUS?', ['Düsseldorf', 'Dubai', 'Durban', 'Dresden'], ['Düsseldorf', 'Dubai', 'Durban', 'Dresden']],
  ['Für welchen Flughafen steht der Code JFK?', 'Which airport has the code JFK?', ['New York', 'Johannesburg', 'Jakarta', 'Jeddah'], ['New York', 'Johannesburg', 'Jakarta', 'Jeddah']],
  ['Welche ist die nördlichste Hauptstadt eines unabhängigen Staates?', 'Which is the northernmost capital of a sovereign state?', ['Reykjavík', 'Oslo', 'Helsinki', 'Tallinn'], ['Reykjavík', 'Oslo', 'Helsinki', 'Tallinn']],
  ['Welches Land hat eine nicht rechteckige Nationalflagge?', 'Which country has a non-rectangular national flag?', ['Nepal', 'Bhutan', 'Schweiz', 'Japan'], ['Nepal', 'Bhutan', 'Switzerland', 'Japan']],
  ['In welchem dieser Länder fährt man links?', 'In which of these countries do people drive on the left?', ['Japan', 'Spanien', 'Italien', 'Kroatien'], ['Japan', 'Spain', 'Italy', 'Croatia']],
  ['Woher stammt der Pastel de Nata?', 'Where does the pastel de nata come from?', ['Portugal', 'Spanien', 'Brasilien', 'Frankreich'], ['Portugal', 'Spain', 'Brazil', 'France']],
  ['Welche Sprache spricht man in Brasilien?', 'Which language is spoken in Brazil?', ['Portugiesisch', 'Spanisch', 'Französisch', 'Englisch'], ['Portuguese', 'Spanish', 'French', 'English']],
  ['Wie viele Landessprachen hat die Schweiz?', 'How many national languages does Switzerland have?', ['4', '3', '2', '5'], ['4', '3', '2', '5']],
  ['In welcher Stadt sitzt die Kleine Meerjungfrau?', 'In which city does the Little Mermaid statue sit?', ['Kopenhagen', 'Oslo', 'Stockholm', 'Amsterdam'], ['Copenhagen', 'Oslo', 'Stockholm', 'Amsterdam']],
  ['In welcher Stadt steht das Manneken Pis?', 'In which city is the Manneken Pis?', ['Brüssel', 'Antwerpen', 'Gent', 'Brügge'], ['Brussels', 'Antwerp', 'Ghent', 'Bruges']],
  ['Welche Stadt nennt man die „Stadt der hundert Türme“?', 'Which city is called the “City of a Hundred Spires”?', ['Prag', 'Krakau', 'Wien', 'Budapest'], ['Prague', 'Kraków', 'Vienna', 'Budapest']],
  ['Welches Gebirge gilt als Grenze zwischen Europa und Asien?', 'Which mountain range is seen as the border between Europe and Asia?', ['Ural', 'Kaukasus', 'Karpaten', 'Altai'], ['Ural', 'Caucasus', 'Carpathians', 'Altai']],
  ['Welcher ist der größte See Mitteleuropas?', 'Which is the largest lake in Central Europe?', ['Balaton', 'Bodensee', 'Gardasee', 'Neusiedler See'], ['Lake Balaton', 'Lake Constance', 'Lake Garda', 'Lake Neusiedl']],
  ['In welchem Land liegt der Bleder See?', 'In which country is Lake Bled?', ['Slowenien', 'Kroatien', 'Österreich', 'Slowakei'], ['Slovenia', 'Croatia', 'Austria', 'Slovakia']],
  ['In welcher Stadt steht das Atomium?', 'In which city is the Atomium?', ['Brüssel', 'Luxemburg', 'Rotterdam', 'Lüttich'], ['Brussels', 'Luxembourg', 'Rotterdam', 'Liège']],
  ['Wer entwarf die Sagrada Família?', 'Who designed the Sagrada Família?', ['Antoni Gaudí', 'Pablo Picasso', 'Salvador Dalí', 'Joan Miró'], ['Antoni Gaudí', 'Pablo Picasso', 'Salvador Dalí', 'Joan Miró']],
  ['In welchem Land liegt das Dorf Schengen?', 'In which country is the village of Schengen?', ['Luxemburg', 'Belgien', 'Deutschland', 'Frankreich'], ['Luxembourg', 'Belgium', 'Germany', 'France']],
  ['Welcher ist der höchste Wasserfall der Welt?', 'What is the highest waterfall in the world?', ['Salto Ángel', 'Niagarafälle', 'Victoriafälle', 'Iguazú-Fälle'], ['Angel Falls', 'Niagara Falls', 'Victoria Falls', 'Iguazú Falls']],
  ['Welche Meerenge trennt Europa und Afrika?', 'Which strait separates Europe and Africa?', ['Straße von Gibraltar', 'Bosporus', 'Straße von Messina', 'Ärmelkanal'], ['Strait of Gibraltar', 'Bosphorus', 'Strait of Messina', 'English Channel']],
  ['Welcher ist der größte Ozean?', 'Which is the largest ocean?', ['Pazifik', 'Atlantik', 'Indischer Ozean', 'Arktischer Ozean'], ['Pacific', 'Atlantic', 'Indian Ocean', 'Arctic Ocean']],
  ['Wie heißt das berühmte Konzerthaus am Hamburger Hafen?', 'What is the famous concert hall at Hamburg’s harbour called?', ['Elbphilharmonie', 'Laeiszhalle', 'Musikverein', 'Gewandhaus'], ['Elbphilharmonie', 'Laeiszhalle', 'Musikverein', 'Gewandhaus']],
  ['In welcher Stadt steht die Karlsbrücke?', 'In which city is the Charles Bridge?', ['Prag', 'Budapest', 'Bratislava', 'Krakau'], ['Prague', 'Budapest', 'Bratislava', 'Kraków']],
  ['In welcher Stadt steht die Burg Gravensteen?', 'In which city is Gravensteen castle?', ['Gent', 'Brügge', 'Antwerpen', 'Lüttich'], ['Ghent', 'Bruges', 'Antwerp', 'Liège']],
  ['Welche kroatische Stadt hat ein römisches Amphitheater, in dem heute Konzerte stattfinden?', 'Which Croatian city has a Roman amphitheatre that still hosts concerts?', ['Pula', 'Split', 'Zadar', 'Rijeka'], ['Pula', 'Split', 'Zadar', 'Rijeka']],
  ['Was ist ein Bánh mì?', 'What is a bánh mì?', ['Vietnamesisches Baguette-Sandwich', 'Thailändische Nudelsuppe', 'Japanischer Reiskuchen', 'Koreanischer Pfannkuchen'], ['Vietnamese baguette sandwich', 'Thai noodle soup', 'Japanese rice cake', 'Korean pancake']],
  ['Zu welcher Inselgruppe gehört Mallorca?', 'Which island group does Mallorca belong to?', ['Balearen', 'Kanaren', 'Azoren', 'Kykladen'], ['Balearic Islands', 'Canary Islands', 'Azores', 'Cyclades']],
  ['Zu welcher Inselgruppe gehört Gran Canaria?', 'Which island group does Gran Canaria belong to?', ['Kanaren', 'Balearen', 'Madeira', 'Kapverden'], ['Canary Islands', 'Balearic Islands', 'Madeira', 'Cape Verde']],
  ['In welcher Stadt liegt der Platz Djemaa el-Fna?', 'In which city is the Djemaa el-Fna square?', ['Marrakesch', 'Fès', 'Casablanca', 'Tunis'], ['Marrakech', 'Fez', 'Casablanca', 'Tunis']],
  ['In welchem Land liegt Krabi?', 'In which country is Krabi?', ['Thailand', 'Vietnam', 'Malaysia', 'Indonesien'], ['Thailand', 'Vietnam', 'Malaysia', 'Indonesia']],
  ['In welcher deutschen Stadt liegt die Reeperbahn?', 'In which German city is the Reeperbahn?', ['Hamburg', 'Berlin', 'Köln', 'Bremen'], ['Hamburg', 'Berlin', 'Cologne', 'Bremen']],
  ['Welche Länder verbindet der Eurotunnel?', 'Which countries does the Channel Tunnel connect?', ['Großbritannien & Frankreich', 'Dänemark & Schweden', 'Frankreich & Belgien', 'Großbritannien & Irland'], ['UK & France', 'Denmark & Sweden', 'France & Belgium', 'UK & Ireland']],
  ['Welcher ist der tiefste See der Welt?', 'What is the deepest lake in the world?', ['Baikalsee', 'Tanganjikasee', 'Kaspisches Meer', 'Lago di Garda'], ['Lake Baikal', 'Lake Tanganyika', 'Caspian Sea', 'Lake Garda']],
  ['Was erlaubt der Schengen-Raum?', 'What does the Schengen Area allow?', ['Reisen ohne Grenzkontrollen', 'Bezahlen in Euro', 'Kostenloses Roaming', 'Zollfreies Einkaufen'], ['Travel without border checks', 'Paying in euros', 'Free roaming', 'Duty-free shopping']],
  ['Woher stammt Pho ursprünglich?', 'Where does pho originally come from?', ['Vietnam', 'Thailand', 'China', 'Kambodscha'], ['Vietnam', 'Thailand', 'China', 'Cambodia']],
  ['Was ist in Japan beim Trinkgeld üblich?', 'What is usual for tipping in Japan?', ['Meist kein Trinkgeld', '10 %', '15–20 %', 'Immer aufrunden'], ['Usually no tip', '10%', '15–20%', 'Always round up']],
  ['In welcher Stadt liegt der Park Güell?', 'In which city is Park Güell?', ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'], ['Barcelona', 'Madrid', 'Valencia', 'Seville']],
  ['Welche Meerenge fließt mitten durch Istanbul?', 'Which strait runs through the middle of Istanbul?', ['Bosporus', 'Dardanellen', 'Straße von Otranto', 'Öresund'], ['Bosphorus', 'Dardanelles', 'Strait of Otranto', 'Øresund']],
  ['Welches Land hat die meisten Inseln?', 'Which country has the most islands?', ['Schweden', 'Indonesien', 'Philippinen', 'Griechenland'], ['Sweden', 'Indonesia', 'Philippines', 'Greece']],
  ['Welche lila Süßigkeit ist typisch für Gent?', 'Which purple sweet is typical of Ghent?', ['Cuberdon', 'Speculoos', 'Praline', 'Stroopwafel'], ['Cuberdon', 'Speculoos', 'Praline', 'Stroopwafel']],
  ['In welcher Stadt liegt Machu Picchus nächster großer Ausgangspunkt mit Flughafen?', 'Which city is the main gateway with an airport for Machu Picchu?', ['Cusco', 'Lima', 'Arequipa', 'La Paz'], ['Cusco', 'Lima', 'Arequipa', 'La Paz']],
  ['Was bedeutet „Hidden Gem“?', 'What does “hidden gem” mean?', ['Geheimtipp abseits der Massen', 'Teures Luxushotel', 'Bekanntestes Wahrzeichen', 'Schmuckgeschäft'], ['An insider spot away from the crowds', 'An expensive luxury hotel', 'The most famous landmark', 'A jewellery shop']],
  ['Wie heißt das Wahrzeichen von Kuala Lumpur?', 'What is the landmark of Kuala Lumpur called?', ['Petronas Towers', 'Marina Bay Sands', 'Lotte World Tower', 'Taipei 101'], ['Petronas Towers', 'Marina Bay Sands', 'Lotte World Tower', 'Taipei 101']],
];

// --- Daten der Website ---
const world = arr(rd('data/moments-world.json'));
const unesco = arr(rd('data/moments-unesco.json'));
const curated = arr(rd('data/moments-curated.json'));
const guideFiles = fs.readdirSync(path.join(ROOT, 'data/guides')).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
const guides = guideFiles.map((f) => rd('data/guides/' + f)).filter((g) => g.status === 'live');

const G = guides.map((g) => [g.city_en || g.city, g.city, `en/guide/${g.slug_en || g.slug}/`, `de/guide/${g.slug}/`, g.cc || '']);
const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const Q = [];
// Orte weltweit: [w, name, cc, town, descDE, descEN]
const seen = new Set();
for (const m of world) {
  if (!m.cc || !cont[m.cc] || !m.city || m.city.length > 70) continue;
  const name = m.city_en || m.city; const k = name + '|' + m.cc; if (seen.has(k)) continue; seen.add(k);
  Q.push(['w', name, m.cc, m.town || '', clean(m.title), clean(m.title_en)]);
}
// UNESCO: [u, name, cc, year, natur(1)/kultur(0)]
for (const m of unesco) {
  if (!m.cc || !cont[m.cc] || !m.city || !m.unesco || m.city.length > 90) continue;
  if (/grenzüberschreitend|transnational/i.test(m.title || '')) continue; // mehrere Länder → keine eindeutige Antwort
  const te = m.title_en || ''; const typ = /cultural & natural/i.test(te) ? 2 : /natural heritage/i.test(te) ? 1 : 0; // 2 = gemischt
  Q.push(['u', m.city, m.cc, m.unesco, typ]);
}
// Guide-Orte: [g, nameDE, nameEN, guideIndex]
const SKIPB = /ausflug|umgebung|umland|essen|durres|innenland|berge/i;
const SKIPN = /küche|cuisine|essen|food|bier\b|beer|spezialit|speciali|tagesausflug|day trip|ausflug|kochkurs|cooking|massage|fahrrad|cycling|bike|strände|beaches|inselhopping|island hopping|boat tour|bootstour|tour\b|touren|card\b|hammam|thermal|taxi|anreise|unterkunft|nachtleben|nightlife|clubszene|club scene|märkte|markets|ramen|sushi|tapas|waffel|waffles|pommes|fries|schokolade|chocolate|kaffee|coffee|wein\b|wine\b/i;
const cityNames = guides.flatMap((g) => [g.city, g.city_en].filter(Boolean).map((c) => c.toLowerCase().split(/[ &,(]/)[0]).filter((c) => c.length > 3));
guides.forEach((g, gi) => {
  const own = [g.city, g.city_en].filter(Boolean).flatMap((c) => [c.toLowerCase(), c.toLowerCase().split(/[ &,(]/)[0]]);
  for (const b of g.blocks || []) {
    if (SKIPB.test(b.id || '')) continue;
    for (const s of b.spots || []) {
      if (!s.name || SKIPN.test(s.name) || SKIPN.test(s.name_en || '')) continue;
      const low = (s.name + ' ' + (s.name_en || '')).toLowerCase();
      if (own.some((c) => c.length >= 3 && low.includes(c))) continue;
      if (/^(the |der |die |das )?(lake|see) /i.test(s.name_en || s.name) || /piran|bergen aan zee|haarlem|brügge|bruges/i.test(low)) continue; // Antwort steht schon im Namen
      if (cityNames.some((c) => !own.includes(c) && low.includes(c))) continue; // andere Guide-Stadt im Namen → mehrdeutig
      Q.push(['g', s.name, s.name_en || s.name, gi]);
    }
  }
});
// Verrückte Geschichten, Abenteuer, Bars: [x, textDE, textEN, town, cc, theme]
for (const m of curated) { if (!m.cc || !cont[m.cc] || !m.town) continue; Q.push(['x', clean(m.title), clean(m.title_en || m.title), m.town, m.cc, m.theme || 'story']); }
// Reisewissen
for (const t of TRIVIA) Q.push(['t', ...t]);

// Zählung der möglichen Fragen (Ort → Land/Stadt/Beschreibung usw.)
const towns = {}; for (const q of Q) if (q[0] === 'w' && q[3]) (towns[q[2]] ||= new Set()).add(q[3]);
let n = 0;
for (const q of Q) {
  if (q[0] === 'w') n += 1 + (towns[q[2]]?.size >= 4 && q[3] ? 1 : 0) + (q[5] ? 1 : 0);
  else if (q[0] === 'u') n += q[4] === 2 ? 2 : 3; else n += 1;
}
const capN = Object.keys(caps).length, flagN = Object.keys(cont).filter((c) => !['XK', 'HK', 'PS'].includes(c)).length, contN = Object.keys(cont).filter((c) => !AMB.has(c)).length;
n += capN + flagN + contN;
const out = { v: new Date().toISOString().slice(0, 10), n, cont, amb: [...AMB], caps, guides: G, q: Q };
fs.writeFileSync(path.join(ROOT, 'data/quiz.json'), JSON.stringify(out));
console.log(`Quiz: ${Q.length} Einträge → ${n} mögliche Fragen (Hauptstädte ${capN}, Flaggen ${flagN}, Kontinente ${contN}, Reisewissen ${TRIVIA.length})`);
