#!/usr/bin/env node
// Holt besondere Orte aus offenen Daten (Wikidata = CC0). Läuft in GitHub Actions (dort ist das Internet offen).
// Ergebnis: data-src/open-raw.json (Rohdaten) + data-src/open-report.json (Kontrolle: welche Klasse, wie viele Treffer)
// Aufruf: node scripts/fetch-open-places.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const UA = 'HiddenGem.Atlas/1.0 (https://noelsprick-alt.github.io/HiddenGem.Atlas/; travel map built on open data)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { started: new Date().toISOString(), classes: {}, countries: {} };

// [Suchname, Gruppe, Limit weltweit, Mindestzahl Wikipedia-Sprachversionen, feste Q-ID (optional), Muster für die Beschreibung]
// Gruppe: adventure | quirky | bar | food
const CLASSES = [
  ['waterfall', 'adventure', 2200, 2, 'Q34038'],
  ['show cave', 'adventure', 700, 1, '', /cave/i],
  ['cave', 'adventure', 1200, 2, 'Q35509'],
  ['hot spring', 'adventure', 600, 1, 'Q177380'],
  ['canyon', 'adventure', 600, 1, 'Q150784'],
  ['gorge', 'adventure', 600, 1, '', /valley|landform|narrow|cliff/i],
  ['natural arch', 'adventure', 400, 1, '', /rock|landform|natural|arch/i],
  ['via ferrata', 'adventure', 400, 0, '', /climb|route|mountain|protected/i],
  ['geyser', 'adventure', 200, 1, 'Q83471'],
  ['cenote', 'adventure', 250, 0, '', /sinkhole|pit|natural|water/i],
  ['crater lake', 'adventure', 350, 1, '', /lake/i],
  ['sinkhole', 'adventure', 250, 1, '', /depression|hole|ground|landform|collapse/i],
  ['lava tube', 'adventure', 120, 0, '', /cave|tube|lava|conduit/i],
  ['ice cave', 'adventure', 120, 0, '', /cave|ice/i],
  ['suspension bridge', 'adventure', 350, 2, '', /bridge/i],
  ['rope bridge', 'adventure', 150, 0, '', /bridge/i],
  ['alpine coaster', 'adventure', 150, 0, '', /coaster|ride|toboggan|sled|amusement/i],
  ['canopy walkway', 'adventure', 120, 0, '', /walk|path|canopy|tree|bridge/i],
  ['zip line', 'adventure', 120, 0, '', /cable|pulley|line|wire|ride/i],
  ['blue hole', 'adventure', 80, 0, '', /sinkhole|marine|cavern|hole/i],
  ['ghost town', 'quirky', 800, 1, 'Q74047'],
  ['abandoned village', 'quirky', 350, 1, '', /village|settlement|abandon/i],
  ['folly', 'quirky', 350, 1, '', /building|architecture|ornamental/i],
  ['catacomb', 'quirky', 200, 0, '', /underground|burial|cemetery|passage/i],
  ['ossuary', 'quirky', 200, 0, '', /bone|chest|building|remains|box|site/i],
  ['underground city', 'quirky', 100, 0, '', /underground|city|settlement/i],
  ['sculpture garden', 'quirky', 300, 1, '', /garden|sculpture|park|outdoor/i],
  ['mural', 'quirky', 300, 1, 'Q219423'],
  ['bunker', 'quirky', 300, 2, 'Q91122'],
  ['hermitage', 'quirky', 200, 2, '', /monk|dwelling|religious|retreat|hermit|isolated/i],
  ['shipwreck', 'quirky', 300, 2, 'Q852190'],
  ['lost city', 'quirky', 100, 0, '', /city|settlement|ruin/i],
  ['rock-cut architecture', 'quirky', 200, 1, '', /architecture|carv|rock|struct/i],
  ['micronation', 'quirky', 80, 0, '', /nation|entity|state|sovereign/i],
  ['tree house', 'quirky', 80, 0, '', /building|tree|structure|platform/i],
  ['bar', 'bar', 1400, 1, 'Q187456'],
  ['pub', 'bar', 1300, 1, 'Q212198'],
  ['coffeehouse', 'bar', 1100, 1, 'Q30022'],
  ['cocktail bar', 'bar', 200, 0, '', /bar/i],
  ['speakeasy', 'bar', 100, 0, '', /bar|prohibition|establishment|illicit/i],
  ['wine bar', 'bar', 200, 0, '', /bar|wine|establishment/i],
  ['beer hall', 'bar', 300, 0, '', /beer|hall|establishment|pub/i],
  ['beer garden', 'bar', 250, 0, '', /beer|garden|outdoor/i],
  ['brewpub', 'bar', 250, 0, '', /pub|brew|restaurant|bar/i],
  ['jazz club', 'bar', 200, 0, '', /club|music|venue|nightclub/i],
  ['cat café', 'bar', 60, 0, '', /café|cafe|cat|coffee/i],
  ['restaurant', 'food', 2400, 2, 'Q11707'],
  ['tavern', 'food', 500, 1, '', /establishment|drinking|inn|tavern|bar/i],
  ['night market', 'food', 200, 0, '', /market|night|street/i],
  ['floating market', 'food', 60, 0, '', /market|boat|water/i],
  ['food market', 'food', 300, 1, '', /market/i],
  ['market hall', 'food', 400, 1, '', /market|hall|building/i],
  ['patisserie', 'food', 250, 1, '', /pastr|bakery|shop|confection/i],
];

// Länder, die Noel bereist hat: dort zusätzlich auch weniger bekannte Orte holen
const VISITED = ['AL', 'AT', 'BE', 'CZ', 'DE', 'DK', 'ES', 'FR', 'HR', 'HU', 'JP', 'KR', 'LT', 'LU', 'MA', 'NL', 'SI', 'SK', 'TH', 'TN', 'US', 'VN'];

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json, application/json' }, signal: AbortSignal.timeout(70000) });
      if (r.status === 429 || r.status >= 500) { await sleep(6000 * (i + 1)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (i === tries - 1) throw e; await sleep(4000 * (i + 1)); }
  }
  throw new Error('keine Antwort');
}
async function resolveClass(label, qid, re) {
  if (qid) return { id: qid, label, desc: 'fest' };
  const u = 'https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=en&type=item&limit=10&search=' + encodeURIComponent(label);
  const j = await getJSON(u);
  const hits = j.search || [];
  const exact = hits.filter((s) => (s.label || '').toLowerCase() === label.toLowerCase());
  const hit = exact.find((s) => !re || re.test(s.description || '')) || hits.find((s) => re && re.test(s.description || '') && (s.label || '').toLowerCase().includes(label.split(' ')[0].toLowerCase()));
  return hit ? { id: hit.id, label: hit.label, desc: hit.description || '' } : null;
}
function sparql(clsValues, limit, minLinks, cc) {
  const ccF = cc ? `?item wdt:P17 ?ctry . ?ctry wdt:P297 "${cc}" .` : '';
  return `SELECT ?item ?cls ?coord ?cc ?links ?enl ?del ?esl ?end ?ded ?esd ?enwp ?dewp ?eswp ?admEn ?admDe WHERE {
  { SELECT ?item (SAMPLE(?k) AS ?cls) (SAMPLE(?c) AS ?coord) (SAMPLE(?code) AS ?cc) (MAX(?sl) AS ?links) (SAMPLE(?a) AS ?adm) WHERE {
      VALUES ?k { ${clsValues} }
      ?item wdt:P31/wdt:P279? ?k ; wdt:P625 ?c ; wikibase:sitelinks ?sl .
      ${ccF}
      FILTER(?sl >= ${minLinks})
      FILTER NOT EXISTS { ?item wdt:P576 ?gone }
      FILTER NOT EXISTS { ?item wdt:P3999 ?closed }
      OPTIONAL { ?item wdt:P17/wdt:P297 ?code }
      OPTIONAL { ?item wdt:P131 ?a }
    } GROUP BY ?item ORDER BY DESC(?links) LIMIT ${limit} }
  OPTIONAL { ?item rdfs:label ?enl FILTER(LANG(?enl)='en') }
  OPTIONAL { ?item rdfs:label ?del FILTER(LANG(?del)='de') }
  OPTIONAL { ?item rdfs:label ?esl FILTER(LANG(?esl)='es') }
  OPTIONAL { ?item schema:description ?end FILTER(LANG(?end)='en') }
  OPTIONAL { ?item schema:description ?ded FILTER(LANG(?ded)='de') }
  OPTIONAL { ?item schema:description ?esd FILTER(LANG(?esd)='es') }
  OPTIONAL { ?enwp schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?dewp schema:about ?item ; schema:isPartOf <https://de.wikipedia.org/> }
  OPTIONAL { ?eswp schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> }
  OPTIONAL { ?adm rdfs:label ?admEn FILTER(LANG(?admEn)='en') }
  OPTIONAL { ?adm rdfs:label ?admDe FILTER(LANG(?admDe)='de') }
}`;
}
const v = (b, k) => (b[k] ? b[k].value : '');
const wpTitle = (u) => { try { return u ? decodeURIComponent(u.split('/wiki/')[1] || '') : ''; } catch { return ''; } };

const items = new Map();
const clsMeta = {}; // Q-ID -> [label, group]
function take(bindings, tag) {
  let n = 0;
  for (const b of bindings) {
    const id = v(b, 'item').split('/').pop();
    const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(v(b, 'coord'));
    if (!m || items.has(id)) continue;
    const k = v(b, 'cls').split('/').pop();
    const meta = clsMeta[k] || ['?', 'quirky'];
    items.set(id, { id, cls: meta[0], group: meta[1], lat: +(+m[2]).toFixed(5), lon: +(+m[1]).toFixed(5), cc: v(b, 'cc'), links: +v(b, 'links') || 0,
      en: v(b, 'enl'), de: v(b, 'del'), es: v(b, 'esl'), end: v(b, 'end'), ded: v(b, 'ded'), esd: v(b, 'esd'),
      wen: wpTitle(v(b, 'enwp')), wde: wpTitle(v(b, 'dewp')), wes: wpTitle(v(b, 'eswp')), aen: v(b, 'admEn'), ade: v(b, 'admDe'), via: tag });
    n++;
  }
  return n;
}
function save() {
  fs.mkdirSync(path.join(ROOT, 'data-src'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data-src/open-raw.json'), JSON.stringify([...items.values()]));
  report.total = items.size; report.saved = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, 'data-src/open-report.json'), JSON.stringify(report, null, 1));
}
async function run(q) { return (await getJSON('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q))).results.bindings; }

// 1) Klassen auflösen
for (const [label, group, , , qid, re] of CLASSES) {
  try {
    const c = await resolveClass(label, qid, re);
    if (!c) { report.classes[label] = { error: 'nicht gefunden' }; continue; }
    clsMeta[c.id] = [label, group];
    report.classes[label] = { qid: c.id, label: c.label, desc: c.desc };
  } catch (e) { report.classes[label] = { error: String(e.message || e) }; }
  await sleep(300);
}
// 2) Weltweit: pro Klasse die bekanntesten Orte
for (const [label, , limit, minLinks] of CLASSES) {
  const r = report.classes[label]; if (!r || !r.qid) continue;
  try {
    const rows = await run(sparql('wd:' + r.qid, limit, minLinks));
    r.rows = rows.length; r.added = take(rows, 'world'); save();
  } catch (e) { r.error = String(e.message || e); }
  await sleep(1500);
}
// 3) Bereiste Länder: zusätzlich weniger bekannte Orte (Bars/Essen und Abenteuer getrennt)
const byGroup = (gs) => Object.entries(clsMeta).filter(([, m]) => gs.includes(m[1])).map(([q]) => 'wd:' + q).join(' ');
for (const cc of VISITED) {
  report.countries[cc] = {};
  for (const [name, gs, lim] of [['bar+food', ['bar', 'food'], 260], ['adventure', ['adventure'], 200], ['quirky', ['quirky'], 120]]) {
    try {
      const rows = await run(sparql(byGroup(gs), lim, 1, cc));
      report.countries[cc][name] = { rows: rows.length, added: take(rows, 'visited') }; save();
    } catch (e) { report.countries[cc][name] = { error: String(e.message || e) }; }
    await sleep(1500);
  }
}
const list = [...items.values()];
fs.mkdirSync(path.join(ROOT, 'data-src'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data-src/open-raw.json'), JSON.stringify(list));
report.total = list.length;
report.finished = new Date().toISOString();
fs.writeFileSync(path.join(ROOT, 'data-src/open-report.json'), JSON.stringify(report, null, 1));
console.log('fertig', list.length);
