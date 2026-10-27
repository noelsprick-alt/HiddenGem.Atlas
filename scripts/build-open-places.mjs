#!/usr/bin/env node
// Baut data/moments-open.json aus data-src/sources-raw.json (Quellen-Check aus Wikidata).
// Regeln (damit man den Aussagen trauen kann):
//   1) Atlas Obscura hat den Ort ausgewählt (redaktionell, „besonders & ungewöhnlich“)
//   2) mind. eine weitere unabhängige Quelle führt ihn (Wikipedia, Tripadvisor, Michelin, Routard, Yelp, Google Maps …)
//   3) Google-Bewertung ab 4,1 Sternen (mind. 50 Bewertungen) – Ergebnis der Prüfung in data-src/google-check.json
//      Ohne bestandene Google-Prüfung kommt kein Ort auf die Karte. Bewertungen selbst werden NICHT gespeichert.
//   Nicht aufgenommen: Städte/Dörfer als Ganzes, Zoos, Freizeitparks, Hotels, Flughäfen, Einkaufszentren, große Kunstmuseen
//   und sehr berühmte Orte (über 40 Wikipedia-Sprachversionen = kein Geheimtipp).
// Aufruf: node scripts/build-open-places.mjs
// Nebenprodukt: data-src/open-candidates.json (Kandidaten, die noch geprüft werden müssen, wichtigste zuerst)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rj = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const items = (f) => { const d = rj('data/' + f); return Array.isArray(d) ? d : d.items || []; };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const s = html.indexOf('const MOMENTS = ['), e = html.indexOf('];', s);
const MOMENTS = vm.runInNewContext('(' + html.slice(s + 16, e + 1) + ')');
const existing = [].concat(MOMENTS, items('moments-extra.json'), items('moments-world.json'), items('moments-unesco.json'), items('moments-curated.json'));

const EDITORIAL = ['ao', 'mi', 'lp', 'gm', 'ro', 'pf', 'fo', 'fr', 'rg', 'to'];
const OTHER = ['ta', 'ye', 'fs', 'go', 'ko', 'al'];
const VISITED = new Set(['AL', 'AT', 'BE', 'CZ', 'DE', 'DK', 'ES', 'FR', 'HR', 'HU', 'JP', 'KR', 'LT', 'LU', 'MA', 'NL', 'SI', 'SK', 'TH', 'TN', 'US', 'VN']);

// Thema aus der Wikidata-Klasse ableiten: [Muster, Thema, Kategorie, DE, EN, ES]
const KIND = [
  [/cocktail|speakeasy/, 'bar', 'bar', 'Bar', 'Bar', 'Bar'],
  [/\bpub\b|tavern|\binn\b/, 'bar', 'bar', 'Kneipe', 'Pub', 'Pub'],
  [/brewery|brewpub|beer/, 'bar', 'bar', 'Brauerei & Bier', 'Brewery & beer', 'Cervecería'],
  [/wine bar|winery|bodega/, 'bar', 'bar', 'Wein', 'Wine', 'Vino'],
  [/\bbar\b|nightclub|jazz club|music venue/, 'bar', 'bar', 'Bar', 'Bar', 'Bar'],
  [/coffee|café|\bcafe\b|tea ?house|tea room|kissaten/, 'bar', 'cafe', 'Café', 'Café', 'Café'],
  [/restaurant|eatery|diner|pizzeria|brasserie|bistro|taqueria|izakaya|ramen|sushi|noodle|food truck/, 'food', 'food', 'Restaurant', 'Restaurant', 'Restaurante'],
  [/\bmarket\b|bazaar|souk/, 'food', 'food', 'Markt', 'Market', 'Mercado'],
  [/bakery|patisserie|pastry|confection|chocolat|ice cream|delicatessen|cheese|distillery/, 'food', 'food', 'Kulinarik', 'Food', 'Gastronomía'],
  [/museum|temple|shrine|church|cathedral|basilica|chapel|mosque|synagogue|monastery|abbey|convent|library|sculpture|statue|artwork|mural|memorial|cemetery|grave|tomb|mausoleum|ossuary|catacomb/, 'story', 'culture', 'Kultur & Geschichte', 'Culture & history', 'Cultura e historia'],
  [/castle|palace|fort|château|manor|mansion|country house|\bhouse\b|villa|archaeolog|ruin|bunker|folly|monument|landmark|structure|building|ship|watercraft|wreck|mine\b|factory|ghost town|abandoned|tower house|hermitage|underground/, 'story', 'sight', 'Kurioser Ort', 'Curious place', 'Lugar curioso'],
  [/waterfall/, 'adventure', 'nature', 'Wasserfall', 'Waterfall', 'Cascada'],
  [/cave|cavern|grotto|lava tube|sinkhole|cenote/, 'adventure', 'nature', 'Höhle', 'Cave', 'Cueva'],
  [/canyon|gorge|ravine|valley|glen/, 'adventure', 'nature', 'Schlucht', 'Gorge', 'Garganta'],
  [/hot spring|geyser|thermal|spring/, 'adventure', 'nature', 'Quelle', 'Spring', 'Manantial'],
  [/volcano|crater|caldera|fumarole/, 'adventure', 'nature', 'Vulkan', 'Volcano', 'Volcán'],
  [/mountain|peak|summit|\bhill\b|ridge|massif|cliff|rock formation|\barch\b|natural arch|boulder|butte|mesa|inselberg|dune/, 'adventure', 'view', 'Fels & Berg', 'Rock & mountain', 'Roca y montaña'],
  [/lake|lagoon|pond|reservoir|river|fjord|\bbay\b|beach|coast|cove|island|islet|reef|atoll|sea stack/, 'adventure', 'nature', 'Wasser & Küste', 'Water & coast', 'Agua y costa'],
  [/forest|\btree\b|woodland|grove|wetland|glacier|desert|landform|natural|nature reserve|protected area/, 'adventure', 'nature', 'Natur', 'Nature', 'Naturaleza'],
  [/trail|hiking|via ferrata|long-distance path|footpath/, 'adventure', 'view', 'Wanderweg', 'Trail', 'Ruta'],
  // Parks, Gärten, Brücken, Türme: schöne Orte, aber kein Abenteuer -> ohne Thema
  [/garden|botanical|park|arboretum/, '', 'nature', 'Park & Garten', 'Park & garden', 'Parque y jardín'],
  [/bridge|viewpoint|observation|lookout|tower|lighthouse|cable car|funicular|railway|tunnel|path|route/, '', 'view', 'Aussicht', 'View', 'Mirador'],
];
const STORY = ['story', 'sight', 'Kurioser Ort', 'Curious place', 'Lugar curioso'];
// Was kein Geheimtipp ist bzw. nicht als Punkt auf die Karte passt
const EXCLUDE = /\b(commune|city|town|village|municipality|metropolis|megacity|capital|unincorporated|census-designated|hamlet|borough|ward|prefecture|county|province|region|human settlement|zoo|aquarium|theme park|amusement park|safari park|airport|aerodrome|shopping|department store|mall|university|college|school|hotel|resort|nonprofit|charitable|organization|company|business|enterprise|research institute|national park|stadium|arena|railway station|train station|metro station|subway station|bus station|station building|skyscraper|concert hall|opera house|theatre|theater|art museum|national museum|art gallery|casino|cruise ship|television|radio station|sports venue|golf)\b/i;
const MAX_LINKS = 40;
function kindOf(cls) {
  const c = String(cls || '').toLowerCase();
  for (const k of KIND) if (k[0].test(c)) return k.slice(1);
  return STORY;
}

const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const STOP = new Set('the der die das des of de la le el los las and und im in am an at von zu a y e i di da do du del della st saint sankt'.split(' '));
const toks = (x) => new Set(norm(x).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const km = (a, b, c, d) => { const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180; const h = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const grid = new Map();
const cell = (lat, lon) => Math.floor(lat * 20) + ':' + Math.floor(lon * 20);
const put = (m) => { const k = cell(+m.lat, +m.lon); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(m); };
const near = (lat, lon) => { const out = []; const a = Math.floor(lat * 20), b = Math.floor(lon * 20); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const g = grid.get((a + i) + ':' + (b + j)); if (g) out.push(...g); } return out; };
existing.filter((m) => isFinite(+m.lat) && isFinite(+m.lon)).forEach(put);

// Städte-Index (Mittelpunkt je Land+Stadt) – Noels eigene Städte bekommen Vorrang
const towns = new Map();
const own = new Set(MOMENTS.map((m) => m.cc + '|' + m.town));
existing.forEach((m) => { if (!m.town || !m.cc || !isFinite(+m.lat)) return; const k = m.cc + '|' + m.town; const t = towns.get(k) || { cc: m.cc, town: m.town, town_en: m.town_en || m.town, town_es: m.town_es || '', lat: 0, lon: 0, n: 0, own: own.has(k) }; t.lat += +m.lat; t.lon += +m.lon; t.n++; towns.set(k, t); });
const townList = [...towns.values()].map((t) => ({ ...t, lat: t.lat / t.n, lon: t.lon / t.n }));
function nearestTown(cc, lat, lon) {
  let best = null, bd = 1e9;
  for (const t of townList) { if (t.cc !== cc || Math.abs(t.lat - lat) > 0.3) continue; const d = km(lat, lon, t.lat, t.lon); if (d < bd) { bd = d; best = t; } }
  return bd <= 12 ? best : null;
}

const RAW = rj('data-src/sources-raw.json');
const GC = fs.existsSync(path.join(ROOT, 'data-src/google-check.json')) ? rj('data-src/google-check.json') : {};
// Formatter-URLs je Quelle (für die Links „Bekannt aus …“)
const fmt = {};
for (const [k, ps] of Object.entries(RAW.props || {})) { const p = (ps || []).find((x) => x.fmt); if (p) fmt[k] = p.fmt; }

const clean = (x) => String(x || '').replace(/\s+/g, ' ').trim();
const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
const report = { raw: RAW.items.length, noEditorial: 0, fewSources: 0, noLabel: 0, noCc: 0, dup: 0, candidates: 0, googleOk: 0, googleNo: 0, unchecked: 0, byTheme: {}, byCc: {}, bySrc: {} };
const cands = [], out = [];
for (const r of RAW.items) {
  const src = r.src || {};
  const ed = EDITORIAL.filter((k) => src[k]);
  const ot = OTHER.filter((k) => src[k]);
  const wiki = r.wen || r.wde || r.wes ? 1 : 0;
  const n = ed.length + ot.length + wiki;
  if (!src.ao) { report.noEditorial++; continue; }
  if (n < 2) { report.fewSources++; continue; }
  if (EXCLUDE.test(r.cls || '')) { report.excluded = (report.excluded || 0) + 1; continue; }
  if ((r.links || 0) > MAX_LINKS) { report.tooFamous = (report.tooFamous || 0) + 1; continue; }
  const en = clean(r.en), de = clean(r.de), es = clean(r.es);
  if (!en && !de) { report.noLabel++; continue; }
  if (!r.cc || r.cc.length !== 2) { report.noCc++; continue; }
  const tk = new Set([...toks(en), ...toks(de)]);
  const dup = near(r.lat, r.lon).some((m) => { const d = km(r.lat, r.lon, +m.lat, +m.lon); if (d < 0.06) return true; if (d > 0.6) return false; const u = new Set([...toks(m.city), ...toks(m.city_en), ...toks(m.q)]); let hit = 0; tk.forEach((w) => { if (u.has(w)) hit++; }); return hit >= Math.min(2, tk.size); });
  if (dup) { report.dup++; continue; }
  let [theme, cat, kDe, kEn, kEs] = kindOf(r.cls);
  const t = nearestTown(r.cc, r.lat, r.lon);
  const town = t ? t.town : clean(r.ade || r.aen);
  const town_en = t ? t.town_en : clean(r.aen || r.ade);
  const id = 'wd-' + r.id;
  const q = (en || de) + (town_en ? ', ' + town_en : '') ;
  const prio = (VISITED.has(r.cc) ? 30 : 0) + (t && t.own ? 25 : 0) + (n >= 3 ? 20 : 0) + n * 4 + Math.min(r.links || 0, 30) / 3 + (theme === 'bar' || theme === 'food' ? 6 : 0) + (theme === 'adventure' ? 4 : 0);
  report.candidates++;
  const g = GC[id];
  if (g === undefined) { report.unchecked++; cands.push({ id, q, cc: r.cc, theme, prio: Math.round(prio), lat: r.lat, lon: r.lon }); continue; }
  if (!String(g).startsWith('ok')) { report.googleNo++; continue; }
  report.googleOk++;
  // Google zeigt, dass es kein Lokal (mehr) ist -> als kurioser Ort führen
  const over = String(g).split(':')[1];
  if (over === 'story') { theme = 'story'; cat = 'sight'; kDe = STORY[2]; kEn = STORY[3]; kEs = STORY[4]; }
  if (over === 'none') { theme = ''; cat = 'view'; kDe = 'Aussicht'; kEn = 'View'; kEs = 'Mirador'; }
  if (over === 'nature') { theme = ''; cat = 'nature'; kDe = 'Park & Garten'; kEn = 'Park & garden'; kEs = 'Parque y jardín'; }
  if (over === 'adv') { theme = 'adventure'; cat = 'nature'; }
  const dDe = cap(clean(r.ded)), dEn = cap(clean(r.end)), dEs = cap(clean(r.esd));
  const m = { id, kind: 'gem', src: 'wd', ...(theme ? { theme } : {}), cc: r.cc, cat, lat: r.lat, lon: r.lon, price: '?', visit: 'todo', city: de || en, title: dDe || kDe };
  if (en && en !== m.city) m.city_en = en;
  if (es && es !== (m.city_en || m.city)) m.city_es = es;
  if ((dEn || kEn) !== m.title) m.title_en = dEn || kEn;
  if ((dEs || kEs) !== (m.title_en || m.title)) m.title_es = dEs || kEs;
  if (town) m.town = town;
  if (town_en && town_en !== town) m.town_en = town_en;
  if (t && t.town_es) m.town_es = t.town_es;
  const w = {}; if (r.wde) w.de = r.wde; if (r.wen) w.en = r.wen; if (r.wes) w.es = r.wes;
  if (Object.keys(w).length) m.wp = w;
  // Quellen werden bewusst NICHT angezeigt/gespeichert (nur geprüft)
  if (theme === 'bar' || theme === 'food') m.q = q;
  out.push(m); put(m);
  report.byTheme[theme || '-'] = (report.byTheme[theme || '-'] || 0) + 1; report.byCc[m.cc] = (report.byCc[m.cc] || 0) + 1;
  for (const k of [...ed, ...ot]) report.bySrc[k] = (report.bySrc[k] || 0) + 1;
}
out.sort((a, b) => a.cc.localeCompare(b.cc) || String(a.town || '').localeCompare(String(b.town || '')));
cands.sort((a, b) => b.prio - a.prio);
fs.writeFileSync(path.join(ROOT, 'data/moments-open.json'), JSON.stringify({ source: 'Wikidata (CC0) – geprüft: mehrere unabhängige Quellen + Google ab 4,1 Sternen. Texte auf Klick aus Wikipedia (CC BY-SA)', items: out }));
fs.writeFileSync(path.join(ROOT, 'data-src/open-candidates.json'), JSON.stringify(cands));
fs.writeFileSync(path.join(ROOT, 'data-src/open-build-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ raw: report.raw, candidates: report.candidates, onMap: out.length, unchecked: report.unchecked, googleNo: report.googleNo, byTheme: report.byTheme }));
