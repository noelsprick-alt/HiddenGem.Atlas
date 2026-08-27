import{writeFileSync,readFileSync,existsSync}from'node:fs';
const FEEDS=[
{url:'https://www.travelbook.de/feed',src:'TRAVELBOOK',cat:'Reise'},
{url:'https://www.tourismuszukunft.de/feed/',src:'Tourismuszukunft',cat:'Trends'},
{url:'https://skift.com/feed/',src:'Skift',cat:'International'}
];
const KW=['trend','hidden','geheimtipp','overtourism','slow travel','nachhaltig','insider','vietnam','albanien','slowenien','japan','balkan','reisetrend','visum'];
const BL=['gewinnspiel','anzeige','sponsored'];
const strip=s=>s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim();
const pick=(b,t)=>{const m=b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`,'i'));return m?strip(m[1]):'';};
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,46);
async function fetchFeed(f){try{const r=await fetch(f.url,{headers:{'User-Agent':'HiddenGem.Atlas bot'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw 0;const xml=await r.text();return xml.split(/<item[\s>]/i).slice(1).concat(xml.split(/<entry[\s>]/i).slice(1)).map(b=>{const title=pick(b,'title');let desc=pick(b,'description')||pick(b,'summary')||'';const lm=b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)||b.match(/<link[^>]*href="([^"]+)"/i);const link=lm?strip(lm[1]):'';const dr=pick(b,'pubDate')||pick(b,'updated');if(desc.length>240)desc=desc.slice(0,237)+'...';return{title,desc,link,date:dr?new Date(dr).toISOString().slice(0,10):'',src:f.src,cat:f.cat};}).filter(i=>i.title&&i.link);}catch(e){console.error('  x '+f.src+': '+e);return[];}}
console.log('Trend-Import '+new Date().toISOString());
const results=await Promise.all(FEEDS.map(fetchFeed));
let items=results.flat().filter(i=>{const h=(i.title+' '+i.desc).toLowerCase();return!BL.some(b=>h.includes(b))&&KW.some(k=>h.includes(k));});
const seen=new Set();items=items.filter(i=>{const k=slug(i.title);if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,24);
let prev={};if(existsSync('data/trends.json')){try{const o=JSON.parse(readFileSync('data/trends.json','utf8'));(o.items||[]).forEach(o=>{if(o.take)prev[o.id]={take:o.take,verdict:o.verdict};});}catch{}}
const out=items.map(i=>{const id='auto-'+slug(i.title);return{id,cat:i.cat,verdict:prev[id]?.verdict||'watch',title:i.title,desc:i.desc,take:prev[id]?.take||'',src:i.src+(i.date?' · '+i.date:''),url:i.link};});
writeFileSync('data/trends.json',JSON.stringify({updated:new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}),generated:new Date().toISOString(),count:out.length,items:out},null,2));
console.log(out.length+' Trends geschrieben');
