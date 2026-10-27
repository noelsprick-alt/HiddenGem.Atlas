#!/usr/bin/env node
// Holt Orte, die von MEHREREN unabhängigen Seiten hervorgehoben werden – nicht nur von Wikipedia.
// Grundlage: Wikidata (CC0). Dort ist pro Ort hinterlegt, auf welchen Seiten er geführt wird
// (Atlas Obscura, Michelin, Lonely Planet, Tripadvisor, Yelp, Foursquare, Google Maps …).
// Pflicht für die Karte (wird später in build-open-places.mjs geprüft):
//   mind. 1 redaktionelle Auswahl (Atlas Obscura, Michelin, Lonely Planet, Gault&Millau, Routard …)
//   + mind. 3 verschiedene Quellen insgesamt
//   + danach Google-Bewertung ab 4,5 Sternen (Prüfung von Hand, Ergebnis in data-src/google-ok.json)
// Läuft in GitHub Actions (dort ist das Internet offen).
// Ergebnis: data-src/sources-raw.json + data-src/sources-report.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const UA = 'HiddenGem.Atlas/1.0 (https://noelsprick-alt.github.io/HiddenGem.Atlas/; travel map built on open data)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { started: new Date().toISOString(), props: {}, queries: {} };

// [Kürzel, Suchbegriff, Muster für den Namen der Eigenschaft, redaktionell ausgewählt?]
const SOURCES = [
  ['ao', 'Atlas Obscura', /atlas obscura/i, true],
  ['mi', 'Michelin', /michelin/i, true],
  ['lp', 'Lonely Planet', /lonely planet/i, true],
  ['gm', 'Gault Millau', /gault/i, true],
  ['ro', 'Routard', /routard/i, true],
  ['pf', 'Petit Futé', /petit fut/i, true],
  ['fo', "Fodor's", /fodor/i, true],
  ['fr', "Frommer's", /frommer/i, true],
  ['rg', 'Rough Guides', /rough guide/i, true],
  ['to', 'Time Out', /time ?out/i, true],
  ['ta', 'Tripadvisor', /tripadvisor/i, false],
  ['ye', 'Yelp', /yelp/i, false],
  ['fs', 'Foursquare venue', /foursquare/i, false],
  ['go', 'Google Maps Customer ID', /google maps/i, false],
  ['ko', 'Komoot', /komoot/i, false],
  ['al', 'AllTrails', /alltrails/i, false],
];

async function getJSON(url, opt = {}, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json, application/json', ...(opt.headers || {}) }, signal: AbortSignal.timeout(90000) });
      if (r.status === 429 || r.status >= 500) { await sleep(8000 * (i + 1)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (i === tries - 1) throw e; await sleep(5000 * (i + 1)); }
  }
  throw new Error('keine Antwort');
}
const sparql = async (q) => (await getJSON('https://query.wikidata.org/sparql', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'format=json&query=' + encodeURIComponent(q),
})).results.bindings;
const v = (b, k) => (b[k] ? b[k].value : '');
const wpTitle = (u) => { try { return u ? decodeURIComponent(u.split('/wiki/')[1] || '') : ''; } catch { return ''; } };
const qid = (u) => u.split('/').pop();

// 1) Eigenschaften (Property-IDs) über die Suche auflösen – nichts von Hand raten
const P = {}; // Kürzel -> [{id,label,fmt}]
for (const [k, term, re, editorial] of SOURCES) {
  try {
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=en&type=property&limit=12&search=' + encodeURIComponent(term));
    const hits = (j.search || []).filter((s) => re.test(s.label || '') && /id|identifier|code|slug|number/i.test((s.label || '') + ' ' + (s.description || '')));
    P[k] = hits.map((s) => ({ id: s.id, label: s.label }));
    report.props[k] = { editorial, found: P[k] };
  } catch (e) { report.props[k] = { error: String(e.message || e) }; P[k] = []; }
  await sleep(400);
}
// Formatter-URLs (P1630) für Links „Bekannt aus …“
const allP = Object.values(P).flat();
if (allP.length) {
  try {
    const rows = await sparql(`SELECT ?p ?f WHERE { VALUES ?p { ${allP.map((p) => 'wd:' + p.id).join(' ')} } ?p wdt:P1630 ?f }`);
    for (const b of rows) { const p = allP.find((x) => x.id === qid(v(b, 'p'))); if (p && !p.fmt) p.fmt = v(b, 'f'); }
  } catch (e) { report.fmtError = String(e.message || e); }
}
const save = (items) => {
  fs.mkdirSync(path.join(ROOT, 'data-src'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data-src/sources-raw.json'), JSON.stringify({ props: P, items: [...items.values()] }));
  report.total = items.size; report.saved = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, 'data-src/sources-report.json'), JSON.stringify(report, null, 1));
};

// 2) Alle Orte mit Koordinaten, die von einer redaktionellen Quelle ausgewählt wurden
const ids = new Set();
for (const [k, , , editorial] of SOURCES) {
  if (!editorial) continue;
  for (const p of P[k] || []) {
    try {
      const rows = await sparql(`SELECT DISTINCT ?item WHERE { ?item wdt:${p.id} ?x ; wdt:P625 ?c . FILTER NOT EXISTS { ?item wdt:P576 ?g } FILTER NOT EXISTS { ?item wdt:P3999 ?cl } }`);
      for (const b of rows) ids.add(qid(v(b, 'item')));
      report.queries[p.id] = { src: k, label: p.label, items: rows.length };
    } catch (e) { report.queries[p.id] = { src: k, error: String(e.message || e) }; }
    await sleep(1500);
  }
}
report.candidates = ids.size;

// 3) Details in Paketen à 200: Koordinaten, Land, Namen, Wikipedia-Titel, welche Quellen ihn führen
const items = new Map();
const list = [...ids];
const srcVars = Object.entries(P).flatMap(([k, ps]) => ps.map((p, i) => [k + i, p.id, k]));
for (let i = 0; i < list.length; i += 200) {
  const chunk = list.slice(i, i + 200);
  const q = `SELECT ?item (SAMPLE(?c) AS ?coord) (SAMPLE(?code) AS ?cc) (MAX(?sl) AS ?links)
    (GROUP_CONCAT(DISTINCT ?clsL; separator="|") AS ?cls)
    ${srcVars.map(([n]) => `(SAMPLE(?s_${n}) AS ?${n})`).join(' ')}
    (SAMPLE(?enl) AS ?en) (SAMPLE(?del) AS ?de) (SAMPLE(?esl) AS ?es)
    (SAMPLE(?end0) AS ?end) (SAMPLE(?ded0) AS ?ded) (SAMPLE(?esd0) AS ?esd)
    (SAMPLE(?enwp) AS ?wen) (SAMPLE(?dewp) AS ?wde) (SAMPLE(?eswp) AS ?wes)
    (SAMPLE(?admEn) AS ?aen) (SAMPLE(?admDe) AS ?ade) WHERE {
    VALUES ?item { ${chunk.map((x) => 'wd:' + x).join(' ')} }
    ?item wdt:P625 ?c ; wikibase:sitelinks ?sl .
    OPTIONAL { ?item wdt:P17/wdt:P297 ?code }
    OPTIONAL { ?item wdt:P31 ?k . ?k rdfs:label ?clsL FILTER(LANG(?clsL)='en') }
    ${srcVars.map(([n, pid]) => `OPTIONAL { ?item wdt:${pid} ?s_${n} }`).join('\n    ')}
    OPTIONAL { ?item rdfs:label ?enl FILTER(LANG(?enl)='en') }
    OPTIONAL { ?item rdfs:label ?del FILTER(LANG(?del)='de') }
    OPTIONAL { ?item rdfs:label ?esl FILTER(LANG(?esl)='es') }
    OPTIONAL { ?item schema:description ?end0 FILTER(LANG(?end0)='en') }
    OPTIONAL { ?item schema:description ?ded0 FILTER(LANG(?ded0)='de') }
    OPTIONAL { ?item schema:description ?esd0 FILTER(LANG(?esd0)='es') }
    OPTIONAL { ?enwp schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
    OPTIONAL { ?dewp schema:about ?item ; schema:isPartOf <https://de.wikipedia.org/> }
    OPTIONAL { ?eswp schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> }
    OPTIONAL { ?item wdt:P131 ?a . OPTIONAL { ?a rdfs:label ?admEn FILTER(LANG(?admEn)='en') } OPTIONAL { ?a rdfs:label ?admDe FILTER(LANG(?admDe)='de') } }
  } GROUP BY ?item`;
  try {
    const rows = await sparql(q);
    for (const b of rows) {
      const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(v(b, 'coord')); if (!m) continue;
      const src = {};
      for (const [n, , k] of srcVars) { const x = v(b, n); if (x && !src[k]) src[k] = x; }
      items.set(qid(v(b, 'item')), {
        id: qid(v(b, 'item')), lat: +(+m[2]).toFixed(5), lon: +(+m[1]).toFixed(5), cc: v(b, 'cc'), links: +v(b, 'links') || 0,
        cls: v(b, 'cls'), src, en: v(b, 'en'), de: v(b, 'de'), es: v(b, 'es'), end: v(b, 'end'), ded: v(b, 'ded'), esd: v(b, 'esd'),
        wen: wpTitle(v(b, 'wen')), wde: wpTitle(v(b, 'wde')), wes: wpTitle(v(b, 'wes')), aen: v(b, 'aen'), ade: v(b, 'ade'),
      });
    }
  } catch (e) { (report.chunkErrors = report.chunkErrors || []).push([i, String(e.message || e)]); }
  if ((i / 200) % 5 === 0) save(items);
  await sleep(1200);
}
report.finished = new Date().toISOString();
save(items);
console.log('Kandidaten', ids.size, 'mit Details', items.size);
