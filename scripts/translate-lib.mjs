// Gemeinsame Übersetzungs-Helfer für die GitHub Actions (kostenlos, ohne API-Schlüssel)
// 1. Versuch: Google Translate (öffentlicher Endpunkt) · 2. Versuch: MyMemory
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function hash(s){ s = String(s || ''); let h = 5381; for (let i = 0; i < s.length; i++){ h = ((h << 5) + h + s.charCodeAt(i)) | 0; } return (h >>> 0).toString(36); }

const decode = s => String(s).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const encode = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function gtx(q, from, to){
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + from + '&tl=' + to + '&dt=t&q=' + encodeURIComponent(q), {signal: AbortSignal.timeout(15000), headers: {'User-Agent': 'Mozilla/5.0 HiddenGem.Atlas'}});
  if (!r.ok) throw new Error('gtx ' + r.status);
  const j = await r.json();
  const out = (j[0] || []).map(x => x[0]).join('');
  if (!out) throw new Error('gtx leer');
  return out;
}
async function mymemory(q, from, to){
  const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=' + from + '|' + to, {signal: AbortSignal.timeout(15000)});
  const j = await r.json();
  const out = j && j.responseData && j.responseData.translatedText;
  if (!out || String(j.responseStatus) !== '200' || /MYMEMORY WARNING|QUERY LENGTH|INVALID LANGUAGE|PLEASE SELECT/i.test(out)) throw new Error('mymemory ' + (j && j.responseStatus));
  return decode(out);
}
function chunks(s, max){
  if (s.length <= max) return [s];
  const parts = s.match(/[^.!?\n]+[.!?\n]*\s*/g) || [s]; const out = []; let cur = '';
  for (const p of parts){ if ((cur + p).length > max && cur){ out.push(cur); cur = ''; } cur += p; }
  if (cur) out.push(cur); return out;
}
let failures = 0;
export async function tr(text, from, to){
  const src = String(text || '').trim();
  if (!src || !/[A-Za-zÄÖÜäöüß]/.test(src)) return src;
  let res = '';
  for (const c of chunks(src, 450)){
    let out = null;
    for (const eng of [gtx, mymemory]){
      try { out = await eng(c, from, to); break; } catch (e) { /* nächster Dienst */ }
    }
    if (out == null){ failures++; throw new Error('Übersetzung nicht möglich'); }
    res += (res ? ' ' : '') + out.trim();
    await sleep(250);
  }
  return res.replace(/[–—]/g, '-');
}
// HTML-Texte: Tags bleiben erhalten, nur Textstücke werden übersetzt
export async function trHtml(html, from, to){
  const tokens = String(html || '').split(/(<[^>]+>)/);
  const out = [];
  for (const tk of tokens){
    if (!tk || tk.startsWith('<') || !/[A-Za-zÄÖÜäöüß]/.test(tk)){ out.push(tk); continue; }
    const lead = tk.match(/^\s*/)[0], trail = tk.match(/\s*$/)[0];
    out.push(lead + encode(await tr(decode(tk.trim()), from, to)) + trail);
  }
  return out.join('');
}
export const trFailures = () => failures;
