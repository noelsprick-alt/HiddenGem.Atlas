#!/usr/bin/env node
// Prüft die Koordinaten der handverlesenen neuen Orte über OpenStreetMap (Nominatim, max. 1 Anfrage/Sekunde).
// Eingabe: data-src/curated-new.json [{id, q, cc, lat, lon}]  Ausgabe: data-src/geocode.json {id: {lat, lon, km, name} | {miss}}
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const UA = 'HiddenGem.Atlas/1.0 (https://noelsprick-alt.github.io/HiddenGem.Atlas/; coordinate check for a travel map)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = path.join(ROOT, 'data-src/curated-new.json');
if (!fs.existsSync(src)) { console.log('keine curated-new.json'); process.exit(0); }
const list = JSON.parse(fs.readFileSync(src, 'utf8'));
const outF = path.join(ROOT, 'data-src/geocode.json');
const out = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : {};
const km = (a, b, c, d) => { const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180; const h = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

for (const it of list) {
  if (out[it.id] && !out[it.id].miss && out[it.id].q === it.q) continue;
  const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=' + encodeURIComponent(it.q) + (it.cc ? '&countrycodes=' + it.cc.toLowerCase() : '');
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    const j = r.ok ? await r.json() : [];
    let best = null;
    for (const h of j) { const d = km(it.lat, it.lon, +h.lat, +h.lon); if (!best || d < best.km) best = { lat: +(+h.lat).toFixed(5), lon: +(+h.lon).toFixed(5), km: +d.toFixed(2), name: h.display_name.slice(0, 120), q: it.q }; }
    out[it.id] = best && best.km <= 8 ? best : { miss: true, q: it.q, near: best };
  } catch (e) { out[it.id] = { miss: true, q: it.q, err: String(e.message || e) }; }
  await sleep(1150);
}
fs.writeFileSync(outF, JSON.stringify(out, null, 1));
console.log('geprüft', list.length, 'Treffer', Object.values(out).filter((x) => !x.miss).length);
