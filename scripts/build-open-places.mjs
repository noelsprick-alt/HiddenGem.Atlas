#!/usr/bin/env node
// Wandelt data-src/open-raw.json (Wikidata) in data/moments-open.json um:
// Qualitätsfilter, Dubletten-Check gegen alle bestehenden Orte, Stadt-Zuordnung, Texte in DE/EN/ES.
// Aufruf: node scripts/build-open-places.mjs [maxOrte]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rj = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const items = (f) => { const d = rj('data/' + f); return Array.isArray(d) ? d : d.items || []; };
const MAX = +process.argv[2] || 9000;

// Bestehende Orte (inkl. der fest in index.html eingebauten MOMENTS)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const s = html.indexOf('const MOMENTS = ['), e = html.indexOf('];', s);
const MOMENTS = vm.runInNewContext('(' + html.slice(s + 16, e + 1) + ')');
const existing = [].concat(MOMENTS, items('moments-extra.json'), items('moments-world.json'), items('moments-unesco.json'), items('moments-curated.json'));

// Klassen: [Kategorie, Thema, DE, EN, ES]
const CLS = {
  'waterfall': ['nature', 'adventure', 'Wasserfall', 'Waterfall', 'Cascada'],
  'show cave': ['nature', 'adventure', 'Schauhöhle', 'Show cave', 'Cueva turística'],
  'cave': ['nature', 'adventure', 'Höhle', 'Cave', 'Cueva'],
  'hot spring': ['nature', 'adventure', 'Heiße Quelle', 'Hot spring', 'Fuente termal'],
  'canyon': ['nature', 'adventure', 'Canyon', 'Canyon', 'Cañón'],
  'gorge': ['nature', 'adventure', 'Schlucht', 'Gorge', 'Garganta'],
  'natural arch': ['nature', 'adventure', 'Felsbogen', 'Natural arch', 'Arco natural'],
  'via ferrata': ['nature', 'adventure', 'Klettersteig', 'Via ferrata', 'Vía ferrata'],
  'geyser': ['nature', 'adventure', 'Geysir', 'Geyser', 'Géiser'],
  'cenote': ['nature', 'adventure', 'Cenote', 'Cenote', 'Cenote'],
  'crater lake': ['nature', 'adventure', 'Kratersee', 'Crater lake', 'Lago de cráter'],
  'sinkhole': ['nature', 'adventure', 'Erdfall', 'Sinkhole', 'Dolina'],
  'lava tube': ['nature', 'adventure', 'Lavaröhre', 'Lava tube', 'Tubo volcánico'],
  'ice cave': ['nature', 'adventure', 'Eishöhle', 'Ice cave', 'Cueva de hielo'],
  'suspension bridge': ['view', 'adventure', 'Hängebrücke', 'Suspension bridge', 'Puente colgante'],
  'rope bridge': ['view', 'adventure', 'Seilbrücke', 'Rope bridge', 'Puente de cuerda'],
  'alpine coaster': ['nature', 'adventure', 'Sommerrodelbahn', 'Alpine coaster', 'Tobogán alpino'],
  'canopy walkway': ['nature', 'adventure', 'Baumwipfelpfad', 'Canopy walkway', 'Pasarela en las copas'],
  'zip line': ['nature', 'adventure', 'Seilrutsche', 'Zip line', 'Tirolina'],
  'blue hole': ['nature', 'adventure', 'Blaues Loch', 'Blue hole', 'Agujero azul'],
  'ghost town': ['sight', 'story', 'Geisterstadt', 'Ghost town', 'Pueblo fantasma'],
  'abandoned village': ['sight', 'story', 'Verlassenes Dorf', 'Abandoned village', 'Pueblo abandonado'],
  'folly': ['sight', 'story', 'Folly (Zierbau)', 'Folly', 'Capricho arquitectónico'],
  'catacomb': ['culture', 'story', 'Katakombe', 'Catacomb', 'Catacumba'],
  'ossuary': ['culture', 'story', 'Beinhaus', 'Ossuary', 'Osario'],
  'underground city': ['sight', 'story', 'Unterirdische Stadt', 'Underground city', 'Ciudad subterránea'],
  'sculpture garden': ['culture', 'story', 'Skulpturengarten', 'Sculpture garden', 'Jardín de esculturas'],
  'mural': ['culture', 'story', 'Wandbild', 'Mural', 'Mural'],
  'bunker': ['sight', 'story', 'Bunker', 'Bunker', 'Búnker'],
  'hermitage': ['culture', 'story', 'Einsiedelei', 'Hermitage', 'Ermita'],
  'shipwreck': ['sight', 'story', 'Schiffswrack', 'Shipwreck', 'Naufragio'],
  'lost city': ['sight', 'story', 'Verlorene Stadt', 'Lost city', 'Ciudad perdida'],
  'rock-cut architecture': ['sight', 'story', 'Felsenbau', 'Rock-cut architecture', 'Arquitectura excavada en roca'],
  'micronation': ['sight', 'story', 'Mikronation', 'Micronation', 'Micronación'],
  'tree house': ['sight', 'story', 'Baumhaus', 'Tree house', 'Casa del árbol'],
  'bar': ['bar', 'bar', 'Bar', 'Bar', 'Bar'],
  'pub': ['bar', 'bar', 'Pub', 'Pub', 'Pub'],
  'coffeehouse': ['cafe', 'bar', 'Kaffeehaus', 'Coffeehouse', 'Café'],
  'cocktail bar': ['bar', 'bar', 'Cocktailbar', 'Cocktail bar', 'Coctelería'],
  'speakeasy': ['bar', 'bar', 'Speakeasy', 'Speakeasy', 'Speakeasy'],
  'wine bar': ['bar', 'bar', 'Weinbar', 'Wine bar', 'Bar de vinos'],
  'beer hall': ['bar', 'bar', 'Bierhalle', 'Beer hall', 'Cervecería'],
  'beer garden': ['bar', 'bar', 'Biergarten', 'Beer garden', 'Jardín de cerveza'],
  'brewpub': ['bar', 'bar', 'Gasthausbrauerei', 'Brewpub', 'Cervecería artesanal'],
  'jazz club': ['bar', 'bar', 'Jazzclub', 'Jazz club', 'Club de jazz'],
  'cat café': ['cafe', 'bar', 'Katzencafé', 'Cat café', 'Café de gatos'],
  'restaurant': ['food', 'food', 'Restaurant', 'Restaurant', 'Restaurante'],
  'tavern': ['food', 'food', 'Taverne', 'Tavern', 'Taberna'],
  'night market': ['food', 'food', 'Nachtmarkt', 'Night market', 'Mercado nocturno'],
  'floating market': ['food', 'food', 'Schwimmender Markt', 'Floating market', 'Mercado flotante'],
  'food market': ['food', 'food', 'Lebensmittelmarkt', 'Food market', 'Mercado'],
  'market hall': ['food', 'food', 'Markthalle', 'Market hall', 'Mercado cubierto'],
  'patisserie': ['cafe', 'food', 'Konditorei', 'Patisserie', 'Pastelería'],
};
const VISITED = new Set(['AL', 'AT', 'BE', 'CZ', 'DE', 'DK', 'ES', 'FR', 'HR', 'HU', 'JP', 'KR', 'LT', 'LU', 'MA', 'NL', 'SI', 'SK', 'TH', 'TN', 'US', 'VN']);

const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const STOP = new Set('the der die das des of de la le el los las and und im in am an at von zu a y e i di da do du del della st saint sankt'.split(' '));
const toks = (x) => new Set(norm(x).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const km = (a, b, c, d) => { const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180; const h = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

// Raster für schnelle Nachbarsuche
const grid = new Map();
const cell = (lat, lon) => Math.floor(lat * 20) + ':' + Math.floor(lon * 20);
const put = (m) => { const k = cell(+m.lat, +m.lon); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(m); };
const near = (lat, lon) => { const out = []; const a = Math.floor(lat * 20), b = Math.floor(lon * 20); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const g = grid.get((a + i) + ':' + (b + j)); if (g) out.push(...g); } return out; };
existing.filter((m) => isFinite(+m.lat) && isFinite(+m.lon)).forEach(put);

// Städte-Index aus den bestehenden Orten (Mittelpunkt je Land+Stadt)
const towns = new Map();
existing.forEach((m) => { if (!m.town || !m.cc || !isFinite(+m.lat)) return; const k = m.cc + '|' + m.town; const t = towns.get(k) || { cc: m.cc, town: m.town, town_en: m.town_en || m.town, town_es: m.town_es || '', lat: 0, lon: 0, n: 0 }; t.lat += +m.lat; t.lon += +m.lon; t.n++; towns.set(k, t); });
const townList = [...towns.values()].map((t) => ({ ...t, lat: t.lat / t.n, lon: t.lon / t.n }));
function nearestTown(cc, lat, lon) {
  let best = null, bd = 1e9;
  for (const t of townList) { if (t.cc !== cc || Math.abs(t.lat - lat) > 0.3) continue; const d = km(lat, lon, t.lat, t.lon); if (d < bd) { bd = d; best = t; } }
  return bd <= 12 ? best : null;
}

const raw = rj('data-src/open-raw.json');
const report = { raw: raw.length, noLabel: 0, noCc: 0, generic: 0, dup: 0, kept: 0, byTheme: {}, byCc: {} };
const clean = (x) => String(x || '').replace(/\s+/g, ' ').trim();
const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
let out = [];
for (const r of raw) {
  const c = CLS[r.cls]; if (!c) continue;
  const en = clean(r.en), de = clean(r.de), es = clean(r.es);
  if (!en && !de) { report.noLabel++; continue; }
  if (!r.cc || r.cc.length !== 2) { report.noCc++; continue; }
  const lbl = norm(en || de).trim();
  if (!lbl || /^q\d+$/.test(lbl) || lbl === r.cls || lbl === norm(c[2]).trim() || /^(unnamed|untitled)/.test(lbl)) { report.generic++; continue; }
  // Dublette? (gleicher Name in der Nähe oder fast gleiche Koordinate)
  const tk = new Set([...toks(en), ...toks(de)]);
  const dup = near(r.lat, r.lon).some((m) => { const d = km(r.lat, r.lon, +m.lat, +m.lon); if (d < 0.06) return true; if (d > 0.6) return false; const u = new Set([...toks(m.city), ...toks(m.city_en), ...toks(m.q)]); let hit = 0; tk.forEach((w) => { if (u.has(w)) hit++; }); return hit >= Math.min(2, tk.size); });
  if (dup) { report.dup++; continue; }
  const t = nearestTown(r.cc, r.lat, r.lon);
  const town = t ? t.town : clean(r.ade || r.aen);
  const town_en = t ? t.town_en : clean(r.aen || r.ade);
  const dDe = cap(clean(r.ded)), dEn = cap(clean(r.end)), dEs = cap(clean(r.esd));
  const m = { id: 'wd-' + r.id, kind: 'gem', src: 'wd', theme: c[1], cc: r.cc, cat: c[0], lat: r.lat, lon: r.lon, price: '?', visit: 'todo',
    city: de || en, title: dDe || c[2] };
  if (en && en !== m.city) m.city_en = en;
  if (es && es !== (m.city_en || m.city)) m.city_es = es;
  if ((dEn || c[3]) !== m.title) m.title_en = dEn || c[3];
  if ((dEs || c[4]) !== (m.title_en || m.title)) m.title_es = dEs || c[4];
  if (town) m.town = town;
  if (town_en && town_en !== town) m.town_en = town_en;
  if (t && t.town_es) m.town_es = t.town_es;
  m.cl = r.cls;
  const w = {}; if (r.wde) w.de = r.wde; if (r.wen) w.en = r.wen; if (r.wes) w.es = r.wes;
  if (Object.keys(w).length) m.wp = w;
  if (c[1] === 'bar' || c[1] === 'food') m.q = (en || de) + (town_en ? ', ' + town_en : '');
  m._score = (r.links || 0) + (VISITED.has(r.cc) ? 6 : 0) + (t ? 4 : 0) + (r.wde ? 2 : 0);
  out.push(m); put(m);
}
// Begrenzen: pro Thema anteilig, die bekanntesten zuerst
out.sort((a, b) => b._score - a._score);
const quota = { adventure: 0.42, story: 0.18, bar: 0.24, food: 0.16 };
const take = [], used = { adventure: 0, story: 0, bar: 0, food: 0 };
for (const m of out) { if (used[m.theme] < quota[m.theme] * MAX) { take.push(m); used[m.theme]++; } }
const tset = new Set(take); for (const m of out) { if (take.length >= MAX) break; if (!tset.has(m)) { take.push(m); tset.add(m); } }
take.forEach((m) => { delete m._score; report.byTheme[m.theme] = (report.byTheme[m.theme] || 0) + 1; report.byCc[m.cc] = (report.byCc[m.cc] || 0) + 1; });
take.sort((a, b) => a.cc.localeCompare(b.cc) || String(a.town || '').localeCompare(String(b.town || '')));
report.kept = take.length;
fs.writeFileSync(path.join(ROOT, 'data/moments-open.json'), JSON.stringify({ source: 'Wikidata (CC0) - Texte auf Klick aus Wikipedia (CC BY-SA)', items: take }));
fs.writeFileSync(path.join(ROOT, 'data-src/open-build-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ raw: report.raw, kept: report.kept, dup: report.dup, byTheme: report.byTheme }));
