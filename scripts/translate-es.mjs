// Ergänzt spanische Texte (aus dem Englischen übersetzt), wo noch keine von Hand geschrieben wurden:
// 1) Detailseiten in data/content.json (text_en -> text_es)  2) handverlesene Orte in data/moments-curated.json
// Von Hand geschriebene spanische Texte bleiben unangetastet.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {trHtml, tr, hash} from './translate-lib.mjs';

let done = 0, failed = 0;
async function es(src, isHtml){ try{ const r = isHtml ? await trHtml(src, 'en', 'es') : await tr(src, 'en', 'es'); done++; return r; }catch(e){ failed++; return null; } }

// 1) Detailseiten
const CF = 'data/content.json';
if (existsSync(CF)){
  const raw = readFileSync(CF, 'utf8');
  const c = JSON.parse(raw);
  for (const d of Object.values(c.detail || {})){
    if (!d.text_en) continue;
    const h = hash(d.text_en);
    if (d.text_es && d._tes === undefined){ d._tes = h; continue; }   // von Hand geschrieben
    if (d.text_es && d._tes === h) continue;                          // aktuell
    if (d.text_es && d._tes === 'manual') continue;
    const r = await es(d.text_en, true); if (r != null){ d.text_es = r; d._tes = h; }
  }
  writeFileSync(CF, JSON.stringify(c, null, 1));
}
// 2) Handverlesene Orte
const MF = 'data/moments-curated.json';
if (existsSync(MF)){
  const m = JSON.parse(readFileSync(MF, 'utf8'));
  for (const it of m.items || []){
    for (const f of ['city', 'title']){
      const en = it[f + '_en'] || it[f]; if (!en || it[f + '_es']) continue;
      const r = await es(en, false); if (r != null) it[f + '_es'] = r;
    }
  }
  writeFileSync(MF, JSON.stringify(m));
}
console.log(`${done} Texte ins Spanische übersetzt · ${failed} fehlgeschlagen`);
