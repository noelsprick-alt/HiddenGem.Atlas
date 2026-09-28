// Übersetzt alle im Website-Editor geänderten deutschen Texte automatisch ins Englische.
// Läuft als GitHub Action, sobald data/content.json veröffentlicht wurde.
// Englische Texte, die du im Editor selbst geschrieben hast, bleiben unangetastet.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {trHtml, hash} from './translate-lib.mjs';

const FILE = 'data/content.json';
if (!existsSync(FILE)){ console.log('Keine data/content.json - nichts zu tun.'); process.exit(0); }
const c = JSON.parse(readFileSync(FILE, 'utf8'));

// Zweisprachige Felder je Sammlung (Feld → Feld_en)
const FIELDS = {
  rc: ['title', 'meta', 'story', 'fail', 'lesson', 'costs', 'hype', 'mental'],
  projects: ['title', 'meta', 'story', 'fail', 'lesson', 'linkLabel'],
  partners: ['since', 'desc'],
  blog: ['title', 'tag', 'meta'],
  moments: ['city', 'title', 'date'],
  trends: ['title', 'cat', 'desc', 'take']
};
let done = 0, failed = 0;
async function en(de){ try{ const r = await trHtml(de, 'de', 'en'); done++; return r; }catch(e){ failed++; return null; } }

// 1) Texte der Seite
c.text = c.text || {}; c.text.de = c.text.de || {}; c.text.en = c.text.en || {}; c.tmeta = c.tmeta || {};
for (const k of Object.keys(c.text.de)){
  const de = c.text.de[k]; if (!de) continue;
  const h = hash(de);
  if (c.text.en[k] && c.tmeta[k] === h) continue;
  const r = await en(de); if (r != null){ c.text.en[k] = r; c.tmeta[k] = h; }
}
// 2) Sammlungen (Partner, Projekte, Reality Checks, Momente, Trends, Blog)
for (const [col, fields] of Object.entries(FIELDS)){
  for (const it of (c.col && c.col[col]) || []){
    it._t = it._t || {};
    for (const f of fields){
      const de = it[f]; if (!de || typeof de !== 'string') continue;
      const h = hash(de);
      const hasEn = it[f + '_en'] != null && String(it[f + '_en']).trim() !== '';
      if (hasEn && (it._t[f] === undefined || it._t[f] === h)) continue;
      const r = await en(de); if (r != null){ it[f + '_en'] = r; it._t[f] = h; }
    }
  }
}
// 3) Detailseiten (Text + Link-Titel)
for (const d of Object.values(c.detail || {})){
  if (d.text){ const h = hash(d.text); if (!d.text_en || (d._t !== undefined && d._t !== h)){ const r = await en(d.text); if (r != null){ d.text_en = r; d._t = h; } } }
  for (const l of d.links || []){ if (l.title && !l.title_en){ const r = await en(l.title); if (r != null) l.title_en = r; } }
}
// 4) Einschätzungen zu automatischen Trends
for (const o of Object.values(c.trendOv || {})){
  if (o.take && !o.take_en){ const r = await en(o.take); if (r != null) o.take_en = r; }
}
writeFileSync(FILE, JSON.stringify(c, null, 1));
console.log(`${done} Texte übersetzt · ${failed} fehlgeschlagen (werden beim nächsten Mal erneut versucht)`);
