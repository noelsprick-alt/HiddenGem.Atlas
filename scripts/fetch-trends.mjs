// Trend-Radar: holt täglich neue Reisetrends (RSS), übersetzt sie DE/EN
// und löscht Einträge, die älter als 14 Tage sind.
import {writeFileSync, readFileSync, existsSync} from 'node:fs';
import {tr} from './translate-lib.mjs';

const MAX_AGE_DAYS = 14;
const MAX_ITEMS = 30;
const FEEDS = [
  {url: 'https://www.travelbook.de/feed', src: 'TRAVELBOOK', cat: 'Reise', cat_en: 'Travel', lang: 'de'},
  {url: 'https://www.tourismuszukunft.de/feed/', src: 'Tourismuszukunft', cat: 'Trends', cat_en: 'Trends', lang: 'de'},
  {url: 'https://skift.com/feed/', src: 'Skift', cat: 'International', cat_en: 'International', lang: 'en'}
];
const KW = ['trend', 'hidden', 'geheimtipp', 'overtourism', 'slow travel', 'nachhaltig', 'insider', 'vietnam', 'albanien', 'albania', 'slowenien', 'slovenia', 'japan', 'balkan', 'reisetrend', 'visum', 'visa'];
const BL = ['gewinnspiel', 'anzeige', 'sponsored', 'advertorial'];

const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = s => decode(s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ')).replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
const pick = (b, t) => { const m = b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i')); return m ? strip(m[1]) : ''; };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 46);
const today = new Date().toISOString().slice(0, 10);
const ageDays = d => d ? (Date.now() - new Date(d + 'T12:00:00Z').getTime()) / 864e5 : 0;

async function fetchFeed(f){
  try{
    const r = await fetch(f.url, {headers: {'User-Agent': 'HiddenGem.Atlas Trend-Radar'}, signal: AbortSignal.timeout(20000)});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const xml = await r.text();
    return xml.split(/<item[\s>]/i).slice(1).concat(xml.split(/<entry[\s>]/i).slice(1)).map(b => {
      const title = pick(b, 'title');
      let desc = pick(b, 'description') || pick(b, 'summary') || '';
      const lm = b.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || b.match(/<link[^>]*href="([^"]+)"/i);
      const link = lm ? strip(lm[1]) : '';
      const dr = pick(b, 'pubDate') || pick(b, 'updated') || pick(b, 'published');
      if (desc.length > 240) desc = desc.slice(0, 237).replace(/\s+\S*$/, '') + ' ...';
      let date = ''; try{ date = dr ? new Date(dr).toISOString().slice(0, 10) : ''; }catch(e){}
      return {title, desc, link, date, f};
    }).filter(i => i.title && /^https?:/.test(i.link));
  }catch(e){ console.error('  x ' + f.src + ': ' + e.message); return []; }
}

console.log('Trend-Import ' + new Date().toISOString());
let prev = [];
if (existsSync('data/trends.json')){ try{ prev = JSON.parse(readFileSync('data/trends.json', 'utf8')).items || []; }catch(e){} }
const byId = new Map(prev.map(x => [x.id, x]));

const fresh = (await Promise.all(FEEDS.map(fetchFeed))).flat().filter(i => {
  const h = (i.title + ' ' + i.desc).toLowerCase();
  return !BL.some(b => h.includes(b)) && KW.some(k => h.includes(k));
});
for (const i of fresh){
  const id = 'auto-' + slug(i.title);
  if (byId.has(id)) continue;
  const it = {id, cat: i.f.cat, cat_en: i.f.cat_en, verdict: 'watch', lang: i.f.lang, date: i.date || today, src: i.f.src, url: i.link};
  if (i.f.lang === 'en'){ it.title_en = i.title; it.desc_en = i.desc; }
  else { it.title = i.title; it.desc = i.desc; }
  byId.set(id, it);
}

// Alte Einträge (ohne Datum: aus der Quelle „… · JJJJ-MM-TT“) aufräumen
let items = [...byId.values()].map(x => {
  if (!x.date){ const m = String(x.src || '').match(/(\d{4}-\d{2}-\d{2})/); x.date = m ? m[1] : today; x.src = String(x.src || '').replace(/\s*·\s*\d{4}-\d{2}-\d{2}$/, ''); }
  if (!x.lang) x.lang = 'de';
  if (!x.cat_en) x.cat_en = ({Reise: 'Travel'})[x.cat] || x.cat;
  return x;
}).filter(x => ageDays(x.date) <= MAX_AGE_DAYS);
const removed = byId.size - items.length;
items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
items = items.slice(0, MAX_ITEMS);

// Fehlende Übersetzungen ergänzen (DE ↔ EN)
let translated = 0, failed = 0;
for (const x of items){
  try{
    if (x.lang === 'en'){
      if (!x.title && x.title_en){ x.title = await tr(x.title_en, 'en', 'de'); translated++; }
      if (!x.desc && x.desc_en){ x.desc = await tr(x.desc_en, 'en', 'de'); }
    } else {
      if (!x.title_en && x.title){ x.title_en = await tr(x.title, 'de', 'en'); translated++; }
      if (!x.desc_en && x.desc){ x.desc_en = await tr(x.desc, 'de', 'en'); }
    }
  }catch(e){ failed++; }
  if (!x.title) x.title = x.title_en;   // Notfall: Originaltext anzeigen
}

writeFileSync('data/trends.json', JSON.stringify({
  updated: new Date().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin'}),
  generated: new Date().toISOString(), maxAgeDays: MAX_AGE_DAYS, count: items.length, items
}, null, 2));
console.log(`${items.length} Trends · ${removed} alte gelöscht · ${translated} übersetzt · ${failed} Übersetzungen fehlgeschlagen (nächster Lauf versucht es erneut)`);
