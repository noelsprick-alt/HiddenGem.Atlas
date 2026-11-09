#!/usr/bin/env node
// Koordinaten für alle Orte in den Stadt-Guides über OpenStreetMap (Nominatim, max. 1 Anfrage/Sekunde).
// Läuft als GitHub Action (.github/workflows/geocode-guides.yml). Ausgabe: data-src/geocode-guides.json
// { "<slug>": { center: {lat, lon}, spots: { "<Spotname>": {lat, lon, km, q} | {miss: true} } } }
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const UA = 'HiddenGem.Atlas/1.0 (https://noelsprick-alt.github.io/HiddenGem.Atlas/; city guide maps)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const km = (a, b, c, d) => { const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180; const h = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const outF = path.join(ROOT, 'data-src/geocode-guides.json');
const out = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : {};
const dir = path.join(ROOT, 'data/guides');
const guides = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter((g) => g.status === 'live');
let calls = 0;
async function search(q, cc, center) {
  let u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=' + encodeURIComponent(q) + (cc ? '&countrycodes=' + cc.toLowerCase() : '');
  if (center) u += `&viewbox=${center.lon - 1},${center.lat + 1},${center.lon + 1},${center.lat - 1}`;
  calls++;
  try { const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }); await sleep(1150); return r.ok ? await r.json() : []; }
  catch (e) { await sleep(1150); return []; }
}
const clean = (s) => String(s || '').replace(/\([^)]*\)/g, '').split(/\s[–-]\s|:|&/)[0].trim();
for (const g of guides) {
  const city = g.city_en || g.city, cc = g.cc || '';
  const o = out[g.slug] || (out[g.slug] = { spots: {} });
  if (!o.center) {
    const r = await search(clean(city), cc);
    if (r[0]) o.center = { lat: +(+r[0].lat).toFixed(5), lon: +(+r[0].lon).toFixed(5) };
  }
  const maxKm = /mallorca|gran canaria|rügen|ruegen|schwarzwald|black forest|lungau|krabi|phuket|zugspitze/i.test(city + ' ' + g.slug) ? 160 : 90;
  for (const b of g.blocks || []) for (const s of b.spots || []) {
    const key = s.name;
    if (o.spots[key] && !o.spots[key].miss) continue;
    const qs = [...new Set([s.q, `${clean(s.name_en || s.name)}, ${clean(city)}`, `${clean(s.name)}, ${clean(city)}`, clean(s.name_en || s.name)].filter(Boolean))];
    let hit = null;
    for (const q of qs) {
      const r = await search(q, cc, o.center);
      for (const h of r) {
        const d = o.center ? km(o.center.lat, o.center.lon, +h.lat, +h.lon) : 0;
        if (d <= maxKm) { hit = { lat: +(+h.lat).toFixed(5), lon: +(+h.lon).toFixed(5), km: +d.toFixed(1), q }; break; }
      }
      if (hit) break;
    }
    o.spots[key] = hit || { miss: true };
  }
  fs.writeFileSync(outF, JSON.stringify(out, null, 1));
}
const all = Object.values(out).flatMap((x) => Object.values(x.spots));
console.log('Anfragen', calls, 'Orte', all.length, 'Treffer', all.filter((x) => !x.miss).length);
