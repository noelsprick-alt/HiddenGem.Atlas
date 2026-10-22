#!/usr/bin/env node
// Erzeugt statische, indexierbare Seiten (DE + EN) aus den Daten der Website:
//   Länder, UNESCO pro Land, Städte, Hidden-Gem-/Story-Orte, Tagesrouten (+ Blog, sobald ohne Entwurfsmarker)
//   + sitemap.xml, robots.txt, seo.css.   Aufruf:  node scripts/build-seo.mjs
// Die Single-Page-App (index.html) bleibt unverändert die Hauptseite; die Seiten hier sind der Einstieg für Google.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const rj = (p) => JSON.parse(rd(p));
let BASE = process.env.SITE_URL || 'https://noelsprick-alt.github.io/HiddenGem.Atlas/';
if (fs.existsSync(path.join(ROOT, 'CNAME'))) BASE = 'https://' + rd('CNAME').trim() + '/';
if (!BASE.endsWith('/')) BASE += '/';
const TODAY = new Date().toISOString().slice(0, 10);
const GYG_ID = 'H0DWLVB', GYG_CODE = 'HIDDENGEMATLAS5', GYG_APP = 'https://gyg.me/hiddengematlas-app', GOAT = 'hiddengem-atlas';

// ---------- Daten laden ----------
const html = rd('index.html');
const i0 = html.indexOf('const MOMENTS = [');
const i1 = html.indexOf('\n];', i0);
const MOMENTS = vm.runInNewContext('(' + html.slice(i0 + 'const MOMENTS = '.length, i1 + 2) + ')');
const bi0 = html.indexOf('const BLOG_DATA = [');
const BLOG = bi0 > 0 ? vm.runInNewContext('(' + html.slice(bi0 + 'const BLOG_DATA = '.length, html.indexOf('\n];', bi0) + 2) + ')') : [];
const items = (f) => { const d = rj('data/' + f); return Array.isArray(d) ? d : d.items; };
const unescoFile = rj('data/moments-unesco.json');
const all = [].concat(MOMENTS, items('moments-extra.json'), items('moments-world.json'), unescoFile.items, items('moments-curated.json'));
const seen = new Set(); const P = [];
for (const m of all) { if (!m || !m.id || seen.has(m.id) || !m.cc || m.cc === 'EU' || typeof m.lat !== 'number') continue; seen.add(m.id); P.push(m); }
for (const m of P) { const tg = unescoFile.tag[m.id]; if (tg && !m.unesco) { m.unesco = tg[0]; m.whc = tg[1]; } }
const content = rj('data/content.json');
const routes = items('routes.json').filter((r) => r.stops && r.stops.length > 1);

// ---------- Hilfen ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => String(s ?? '').replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const dn = { de: new Intl.DisplayNames(['de'], { type: 'region' }), en: new Intl.DisplayNames(['en'], { type: 'region' }) };
const cname = (lang, cc) => { try { return dn[lang].of(cc) || cc; } catch { return cc; } };
const flag = (cc) => cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
const F = (m, k, lang) => (lang === 'en' ? (m[k + '_en'] || m[k]) : m[k]) || '';
const townOf = (m, lang) => (lang === 'en' ? (m.town_en || m.town) : m.town) || '';
const nf = (n, lang) => n.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE');

// Texte
const TX = {
  de: { home: 'Start', countries: 'Länder', unesco: 'UNESCO-Welterbe', routes: 'Tagesrouten', map: 'Karte', other: 'English', impressum: 'Impressum', privacy: 'Datenschutz',
    mapCta: 'Auf der interaktiven Karte öffnen', toMap: 'Alle Orte auf der Karte', gmaps: 'In Google Maps ansehen', places: 'Orte', cities: 'Städte', gems: 'Hidden Gems', stories: 'Verrückte Geschichten', adventures: 'Abenteuer', bars: 'Bars', sights: 'Must-Sees',
    t: { gem: 'Hidden Gem', mustsee: 'Must-See', story: 'Verrückte Geschichte', adventure: 'Abenteuer', bar: 'Bar', unesco: 'UNESCO-Welterbe' },
    near: 'Mehr in der Nähe', ad: 'Werbung', gygH: 'Touren & Tickets', gygP: (c) => `Touren und Tickets in ${c} bei GetYourGuide - mit dem Code ${GYG_CODE} bekommst du 5 % Rabatt.`, gygB: (c) => `Touren in ${c} ansehen`, gygApp: '📱 GetYourGuide-App holen',
    gygD: 'Affiliate-Link: Bei einer Buchung erhalte ich eine Provision, für dich ohne Mehrkosten.', stops: 'Stationen', best: 'Beste Zeit', allC: 'Alle Länder', allU: 'UNESCO-Welterbe weltweit', allR: 'Alle Tagesrouten', foot: 'Von Noel Sprick, Gladbeck. Karte mit über 4.400 Orten, Tagesrouten und ehrlichen Reisetipps.',
    src: 'Quelle der UNESCO-Daten: UNESCO World Heritage List, Stand 23.08.2026. Namen in der offiziellen englischen Schreibweise.', danger: 'Rote Liste', since: 'seit', walk: 'Gehzeit', min: 'Min.', pop: 'Beliebte Länder' },
  en: { home: 'Home', countries: 'Countries', unesco: 'UNESCO World Heritage', routes: 'Day routes', map: 'Map', other: 'Deutsch', impressum: 'Legal notice', privacy: 'Privacy',
    mapCta: 'Open on the interactive map', toMap: 'All places on the map', gmaps: 'View in Google Maps', places: 'Places', cities: 'Cities', gems: 'Hidden gems', stories: 'Wild stories', adventures: 'Adventures', bars: 'Bars', sights: 'Must-sees',
    t: { gem: 'Hidden gem', mustsee: 'Must-see', story: 'Wild story', adventure: 'Adventure', bar: 'Bar', unesco: 'UNESCO World Heritage' },
    near: 'More nearby', ad: 'Ad', gygH: 'Tours & tickets', gygP: (c) => `Tours and tickets in ${c} on GetYourGuide - use the code ${GYG_CODE} for 5% off.`, gygB: (c) => `See tours in ${c}`, gygApp: '📱 Get the GetYourGuide app',
    gygD: 'Affiliate link: I earn a commission on bookings, at no extra cost to you.', stops: 'Stops', best: 'Best time', allC: 'All countries', allU: 'UNESCO World Heritage worldwide', allR: 'All day routes', foot: 'By Noel Sprick, Gladbeck. A map of 4,400+ places, day routes and honest travel tips.',
    src: 'UNESCO data source: UNESCO World Heritage List, snapshot 23 Aug 2026.', danger: 'Danger list', since: 'since', walk: 'Walking', min: 'min', pop: 'Popular countries' },
};
const typeOf = (m) => m.unesco ? 'unesco' : (m.theme || (m.kind === 'gem' ? 'gem' : 'mustsee'));

// ---------- Gruppen & Slugs ----------
const byCc = new Map(); for (const m of P) { if (!byCc.has(m.cc)) byCc.set(m.cc, []); byCc.get(m.cc).push(m); }
const detailKey = (m) => 'moment-' + m.id;
const hasDetail = (m) => { const d = content.detail?.[detailKey(m)]; return d && strip(d.text).length > 120 && !/Entwurf/.test(d.text || ''); };
// Eigene Fotos aus data/content.json (Galerie je Ort; Videos -> Posterbild)
const photosOf = (ids) => { const out = []; for (const id of ids) for (const src of (content.detail?.['moment-' + id]?.photos || [])) { const im = /\.mp4$/.test(src) ? src.replace('images/video/', 'images/video/p/').replace(/\.mp4$/, '.webp') : src; if (/\.webp$/.test(im) && !out.includes(im) && fs.existsSync(path.join(ROOT, im))) out.push(im); } return out; };
const thumbOf = (s) => (s.startsWith('images/photos/') ? s.replace('images/photos/', 'images/photos/t/') : s);
const gallery = (imgs, alt, U) => (imgs.length ? `<div class="gal">${imgs.slice(0, 6).map((s) => `<a href="${U}${s}"><img src="${U}${thumbOf(s)}" alt="${esc(alt)}" loading="lazy"></a>`).join('')}</div>` : '');
const wantPlace = (m) => m.kind === 'gem' || !!m.theme || hasDetail(m);
const uniq = (map, base, id) => { let s = base || 'x', n = 2; while (map.has(s)) s = base + '-' + n++; map.set(s, id); return s; };

const SL = { de: { c: {}, t: {}, p: {} }, en: { c: {}, t: {}, p: {} } };
const countries = [...byCc.keys()].filter((cc) => byCc.get(cc).length >= 3).sort();
for (const lang of ['de', 'en']) {
  const cm = new Map();
  for (const cc of countries) SL[lang].c[cc] = uniq(cm, slugify(cname(lang, cc)), cc);
  for (const cc of countries) {
    const g = new Map(), tm = new Map(); SL[lang].t[cc] = {};
    for (const m of byCc.get(cc)) { if (!m.town) continue; if (!g.has(m.town)) g.set(m.town, 0); g.set(m.town, g.get(m.town) + 1); }
    for (const [tw, n] of [...g.entries()].sort((a, b) => b[1] - a[1])) if (n >= 4) {
      const m = byCc.get(cc).find((x) => x.town === tw); SL[lang].t[cc][tw] = uniq(tm, slugify(townOf(m, lang)) || slugify(tw), tw);
    }
  }
  const pm = new Map();
  for (const m of P) if (wantPlace(m)) SL[lang].p[m.id] = uniq(pm, slugify(F(m, 'city', lang)) + '-' + slugify(townOf(m, lang)).slice(0, 30), m.id);
}
const RS = { de: {}, en: {} };
for (const r of routes) for (const lang of ['de', 'en']) RS[lang][r.id] = slugify(F(r, 'title', lang)) + '-' + slugify(townOf(r, lang));
const PATHS = {
  de: { hub: 'de/laender/', unesco: 'de/unesco/', routes: 'de/routen/', c: (cc) => `de/land/${SL.de.c[cc]}/`, uc: (cc) => `de/unesco/${SL.de.c[cc]}/`, t: (cc, t) => `de/stadt/${SL.de.c[cc]}/${SL.de.t[cc][t]}/`, p: (id) => `de/ort/${SL.de.p[id]}/`, r: (id) => `de/route/${RS.de[id]}/` },
  en: { hub: 'en/countries/', unesco: 'en/unesco/', routes: 'en/routes/', c: (cc) => `en/country/${SL.en.c[cc]}/`, uc: (cc) => `en/unesco/${SL.en.c[cc]}/`, t: (cc, t) => `en/city/${SL.en.c[cc]}/${SL.en.t[cc][t]}/`, p: (id) => `en/place/${SL.en.p[id]}/`, r: (id) => `en/route/${RS.en[id]}/` },
};
const other = (l) => (l === 'de' ? 'en' : 'de');

// ---------- Rendering ----------
const OUT = []; // {path, html, alt:{de,en}}
const sitemap = [];
const up = (p) => '../'.repeat(p.split('/').filter(Boolean).length);

function page({ lang, p, title, desc, h1, lead, body, crumbs, ld = [], alt, type = 'website', image }) {
  const U = up(p), t = TX[lang];
  { const SFX = ' | HiddenGem.Atlas'; let core = title.endsWith(SFX) ? title.slice(0, -SFX.length) : title; const max = 68 - SFX.length;
    if (core.length > max) core = core.slice(0, max).replace(/[\s,:;-]+\S*$/, '') + '…'; title = core + SFX; }
  const url = BASE + p, img = BASE + (image || 'og-image.jpg');
  const bc = [{ n: t.home, u: BASE }].concat(crumbs.map((c) => ({ n: c.n, u: c.p ? BASE + c.p : url })));
  const ldAll = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: bc.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.n, item: c.u })) }].concat(ld);
  const altTags = alt ? `<link rel="alternate" hreflang="${lang}" href="${url}">\n<link rel="alternate" hreflang="${other(lang)}" href="${BASE + alt}">\n<link rel="alternate" hreflang="x-default" href="${BASE + (lang === 'de' ? p : alt)}">` : '';
  const sw = alt ? `<a class="lang" href="${U + alt}" hreflang="${other(lang)}" lang="${other(lang)}">${t.other}</a>` : '';
  const crumbHtml = crumbs.map((c) => (c.p ? `<a href="${U + c.p}">${esc(c.n)}</a>` : `<span>${esc(c.n)}</span>`)).join(' <i>/</i> ');
  const out = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
${altTags}
<meta property="og:type" content="${type}"><meta property="og:site_name" content="HiddenGem.Atlas"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${img}"><meta property="og:locale" content="${lang === 'de' ? 'de_DE' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#1a0e04">
<link rel="preload" href="${U}fonts/dm-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${U}seo.css">
<script type="application/ld+json">${JSON.stringify(ldAll)}</script>
</head><body>
<header class="top"><a class="logo" href="${U}index.html">Hidden<em>Gem</em>.Atlas</a><nav>
<a href="${U}${PATHS[lang].hub}">${t.countries}</a><a href="${U}${PATHS[lang].unesco}">UNESCO</a><a href="${U}${PATHS[lang].routes}">${t.routes}</a><a href="${U}index.html#/momente">${t.map}</a>${sw}</nav></header>
<main><nav class="crumb" aria-label="Breadcrumb">${crumbHtml}</nav>
<h1>${h1}</h1>
${lead ? `<p class="lead">${lead}</p>` : ''}
${body}
</main>
<footer><p>${t.foot}</p><p><a href="${U}${PATHS[lang].hub}">${t.allC}</a> · <a href="${U}${PATHS[lang].unesco}">${t.allU}</a> · <a href="${U}${PATHS[lang].routes}">${t.allR}</a></p>
<p><a href="${U}index.html#/impressum">${t.impressum}</a> · <a href="${U}index.html#/datenschutz">${t.privacy}</a> · <a href="https://www.instagram.com/hiddengem.atlas/" rel="noopener">Instagram</a></p></footer>
<script data-goatcounter="https://${GOAT}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body></html>`;
  OUT.push({ path: p + 'index.html', html: out });
  sitemap.push({ p, alt: alt ? { [lang]: p, [other(lang)]: alt } : null, lang });
}

const trim = (s, n) => { s = strip(s); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const gygUrl = (town, cc) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(town)}&partner_id=${GYG_ID}&cmp=seo-${(cc || 'xx').toLowerCase()}`;
const gygBox = (lang, town, cc, direct) => { const t = TX[lang]; return `<aside class="gyg"><span class="ad">${t.ad}</span><h2>${t.gygH}</h2><p>${esc(t.gygP(town))}</p><a class="btn" href="${esc(direct || gygUrl(town, cc))}" rel="sponsored noopener" target="_blank">${esc(t.gygB(town))} ↗</a><a class="btn alt" href="${GYG_APP}" rel="sponsored noopener" target="_blank">${t.gygApp}</a><small>${t.gygD}</small></aside>`; };
const gmapsUrl = (m) => `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`;
const rank = (m) => (m.kind === 'gem' ? 0 : m.theme ? 1 : m.unesco ? 2 : 3);
const sortP = (a) => [...a].sort((x, y) => rank(x) - rank(y) || (y.rating || 0) - (x.rating || 0));
const li = (m, lang, U, showTown) => {
  const hasPage = SL[lang].p[m.id]; const nm = esc(F(m, 'city', lang)); const ty = TX[lang].t[typeOf(m)];
  const link = hasPage ? `<a href="${U}${PATHS[lang].p(m.id)}">${nm}</a>` : nm;
  const extra = m.unesco ? ` <em>${TX[lang].since} ${m.unesco}</em>${m.danger ? ' · ' + TX[lang].danger : ''}` : '';
  return `<li>${link} <span class="ty">${ty}${showTown && townOf(m, lang) ? ' · ' + esc(townOf(m, lang)) : ''}</span>${extra}</li>`;
};

// --- Länder & Städte ---
const popular = countries.map((cc) => [cc, byCc.get(cc).length]).sort((a, b) => b[1] - a[1]).slice(0, 14).map((x) => x[0]);
for (const lang of ['de', 'en']) {
  const t = TX[lang], o = other(lang);
  for (const cc of countries) {
    const list = byCc.get(cc), cn = cname(lang, cc), p = PATHS[lang].c(cc), U = up(p);
    const un = list.filter((m) => m.unesco), cur = list.filter((m) => m.theme), gem = list.filter((m) => m.kind === 'gem');
    const stats = [];
    if (un.length) stats.push(`${un.length} ${t.unesco}`); if (gem.length) stats.push(`${gem.length} ${t.gems}`);
    const tm = SL[lang].t[cc]; const towns = Object.keys(tm).map((tw) => [tw, list.filter((m) => m.town === tw)]).sort((a, b) => b[1].length - a[1].length);
    const ex = sortP(list).slice(0, 3).map((m) => F(m, 'city', lang)).join(', ');
    const title = lang === 'de' ? `${cn}: Hidden Gems, Must-Sees & UNESCO-Welterbe | HiddenGem.Atlas` : `${cn}: hidden gems, must-sees & UNESCO sites | HiddenGem.Atlas`;
    const desc = lang === 'de' ? `${nf(list.length, lang)} Orte in ${cn}${stats.length ? ' - ' + stats.join(', ') : ''}. Darunter ${ex}. Mit Karte und Routenplaner.` : `${nf(list.length, lang)} places in ${cn}${stats.length ? ' - ' + stats.join(', ') : ''}. Including ${ex}. With map and route planner.`;
    let body = `<p><a class="btn" href="${U}index.html#/momente">${t.mapCta} →</a>${un.length >= 2 ? ` <a class="btn alt" href="${U}${PATHS[lang].uc(cc)}">${t.unesco} (${un.length})</a>` : ''}</p>`;
    const feat = sortP(list.filter((m) => m.kind === 'gem' || m.theme)).slice(0, 40);
    if (feat.length) body += `<h2>${lang === 'de' ? 'Geheimtipps, Geschichten & Abenteuer' : 'Hidden gems, stories & adventures'}</h2><ul class="pl">${feat.map((m) => li(m, lang, U, true)).join('')}</ul>`;
    if (towns.length) body += `<h2>${t.cities}</h2><ul class="chips">${towns.slice(0, 40).map(([tw, a]) => `<li><a href="${U}${PATHS[lang].t(cc, tw)}">${esc(townOf(a[0], lang))} <b>${a.length}</b></a></li>`).join('')}</ul>`;
    const rest = sortP(list.filter((m) => !feat.includes(m))).slice(0, 150);
    if (rest.length) body += `<h2>${lang === 'de' ? 'Weitere Sehenswürdigkeiten' : 'More sights'}</h2><ul class="pl two">${rest.map((m) => li(m, lang, U, true)).join('')}</ul>${list.length - feat.length > rest.length ? `<p><a href="${U}index.html#/momente">${t.toMap}: ${nf(list.length, lang)} →</a></p>` : ''}`;
    if (towns[0]) body += gygBox(lang, townOf(towns[0][1][0], lang), cc);
    page({ lang, p, title, desc: trim(desc, 158), h1: `${flag(cc)} ${esc(cn)}`, lead: esc(lang === 'de' ? `${nf(list.length, lang)} Orte in ${cn}: ${stats.join(' · ') || 'Sehenswürdigkeiten'} - von Noel gesammelt und auf einer Karte planbar.` : `${nf(list.length, lang)} places in ${cn}: ${stats.join(' · ') || 'sights'} - collected by Noel and plannable on a map.`),
      body, crumbs: [{ n: t.countries, p: PATHS[lang].hub }, { n: cn }], alt: PATHS[o].c(cc), ld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: BASE + p, inLanguage: lang, about: { '@type': 'Country', name: cn }, mainEntity: { '@type': 'ItemList', itemListElement: sortP(list).slice(0, 30).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: F(m, 'city', lang) })) } }] });

    // UNESCO je Land
    if (un.length >= 2) {
      const up2 = PATHS[lang].uc(cc), U2 = up(up2); const us = [...un].sort((a, b) => a.unesco - b.unesco || a.city.localeCompare(b.city));
      const tt = lang === 'de' ? `UNESCO-Welterbe in ${cn}: alle ${us.length} Stätten | HiddenGem.Atlas` : `UNESCO World Heritage Sites in ${cn}: all ${us.length} | HiddenGem.Atlas`;
      const dd = lang === 'de' ? `Alle ${us.length} UNESCO-Welterbestätten in ${cn} mit Aufnahmejahr, darunter ${us.slice(0, 3).map((m) => m.city).join(', ')}. Auf Karte und Routenplaner.` : `All ${us.length} UNESCO World Heritage Sites in ${cn} with year of inscription, including ${us.slice(0, 3).map((m) => m.city).join(', ')}. On a map with route planner.`;
      const rows = us.map((m) => `<li><b>${m.city}</b> <span class="ty">${t.since} ${m.unesco}${m.cat === 'nature' ? (lang === 'de' ? ' · Natur' : ' · natural') : (lang === 'de' ? ' · Kultur' : ' · cultural')}${m.danger ? ' · ' + t.danger : ''}</span> <a class="mini" href="${gmapsUrl(m)}" rel="noopener" target="_blank">${t.gmaps}</a></li>`).join('');
      page({ lang, p: up2, title: tt, desc: trim(dd, 158), h1: `${flag(cc)} ${lang === 'de' ? 'UNESCO-Welterbe in' : 'UNESCO World Heritage in'} ${esc(cn)}`, lead: esc(lang === 'de' ? `${us.length} Stätten, sortiert nach Jahr der Aufnahme.` : `${us.length} sites, sorted by year of inscription.`),
        body: `<p><a class="btn" href="${U2}index.html#/momente">${t.mapCta} →</a> <a class="btn alt" href="${U2}${p}">${esc(cn)}</a></p><ol class="pl uns">${rows}</ol><p class="src">${t.src}</p>`,
        crumbs: [{ n: t.unesco, p: PATHS[lang].unesco }, { n: cn }], alt: PATHS[o].uc(cc), ld: [{ '@context': 'https://schema.org', '@type': 'ItemList', name: tt, itemListElement: us.map((m, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: m.city, geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lon } } })) }] });
    }
    // Städte
    for (const [tw, a] of towns) {
      const tp = PATHS[lang].t(cc, tw), U3 = up(tp), tn = townOf(a[0], lang);
      const tt = lang === 'de' ? `${tn}: Hidden Gems & Sehenswürdigkeiten (${cn}) | HiddenGem.Atlas` : `${tn}: hidden gems & things to see (${cn}) | HiddenGem.Atlas`;
      const exs = sortP(a).slice(0, 3).map((m) => F(m, 'city', lang)).join(', ');
      const dd = lang === 'de' ? `${a.length} Orte in ${tn}, ${cn}: ${exs} und mehr. Mit Karte, Google-Maps-Link und Touren.` : `${a.length} places in ${tn}, ${cn}: ${exs} and more. With map, Google Maps link and tours.`;
      const rts = routes.filter((r) => r.cc === cc && r.town === tw);
      let b = `<p><a class="btn" href="${U3}index.html#/momente">${t.mapCta} →</a> <a class="btn alt" href="${U3}${p}">${flag(cc)} ${esc(cn)}</a></p><ul class="pl two">${sortP(a).map((m) => li(m, lang, U3, false)).join('')}</ul>`;
      const tph = photosOf(sortP(a).map((m) => m.id)); if (tph.length) b = b.replace('</p>', '</p>' + gallery(tph, tn, U3));
      if (rts.length) b += `<h2>${t.routes}</h2><ul class="pl">${rts.map((r) => `<li><a href="${U3}${PATHS[lang].r(r.id)}">${esc(F(r, 'title', lang))}</a></li>`).join('')}</ul>`;
      b += gygBox(lang, tn, cc);
      page({ lang, p: tp, title: tt, desc: trim(dd, 158), image: tph[0], h1: esc(tn), lead: esc(lang === 'de' ? `${a.length} Orte in ${tn}, ${cn}.` : `${a.length} places in ${tn}, ${cn}.`), body: b,
        crumbs: [{ n: t.countries, p: PATHS[lang].hub }, { n: cn, p }, { n: tn }], alt: PATHS[o].t(cc, tw),
        ld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: tt, url: BASE + tp, inLanguage: lang, about: { '@type': 'City', name: tn }, mainEntity: { '@type': 'ItemList', itemListElement: sortP(a).slice(0, 30).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: F(m, 'city', lang) })) } }] });
    }
  }

  // --- Orte (Hidden Gems, Geschichten, Abenteuer, Bars) ---
  for (const m of P.filter((x) => SL[lang].p[x.id] && SL.de.c[x.cc])) {
    const p = PATHS[lang].p(m.id), U = up(p), cn = cname(lang, m.cc), tn = townOf(m, lang), nm = F(m, 'city', lang), ty = t.t[typeOf(m)];
    const ti = strip(F(m, 'title', lang));
    const d = content.detail?.[detailKey(m)]; const detail = hasDetail(m) ? (lang === 'en' ? d.text_en || d.text : d.text) : '';
    const near = sortP(P.filter((x) => x.id !== m.id && x.cc === m.cc && x.town === m.town && x.kind !== 'x')).slice(0, 8);
    const title = `${nm}${tn && tn !== nm ? ', ' + tn : ''} - ${ty} | HiddenGem.Atlas`;
    const loc = `${cn}${tn ? ', ' + tn : ''}`; const desc = ti.length + loc.length < 150 ? `${ti} (${loc})` : trim(ti, 158);
    let b = `<p class="meta"><span class="badge">${ty}</span> ${flag(m.cc)} <a href="${U}${PATHS[lang].c(m.cc)}">${esc(cn)}</a>${tn && SL[lang].t[m.cc]?.[m.town] ? ` · <a href="${U}${PATHS[lang].t(m.cc, m.town)}">${esc(tn)}</a>` : tn ? ' · ' + esc(tn) : ''}${m.unesco ? ` · ${t.since} ${m.unesco}` : ''}</p>`;
    const ph = photosOf([m.id]); b += gallery(ph, `${nm}${tn ? ', ' + tn : ''}`, U);
    if (detail) b += `<div class="story">${detail.replace(/<p><em>✍️[^<]*<\/em><\/p>/g, '')}</div>`;
    b += `<p><a class="btn" href="${U}index.html#/momente/${encodeURIComponent(m.id)}">${t.mapCta} →</a> <a class="btn alt" href="${gmapsUrl(m)}" rel="noopener" target="_blank">${t.gmaps} ↗</a></p>`;
    if (near.length) b += `<h2>${t.near}</h2><ul class="pl two">${near.map((x) => li(x, lang, U, false)).join('')}</ul>`;
    if (m.gyg || (m.kind === 'gem' && tn)) b += gygBox(lang, tn || nm, m.cc, m.gyg);
    page({ lang, p, title, desc, h1: esc(nm), lead: esc(ti), body: b, type: 'article', image: ph[0],
      crumbs: [{ n: t.countries, p: PATHS[lang].hub }, { n: cn, p: PATHS[lang].c(m.cc) }, { n: nm }], alt: PATHS[other(lang)].p(m.id),
      ld: [{ '@context': 'https://schema.org', '@type': 'TouristAttraction', name: nm, description: ti, url: BASE + p, inLanguage: lang, geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lon }, address: { '@type': 'PostalAddress', addressLocality: tn, addressCountry: m.cc }, isAccessibleForFree: m.price === 'free' ? true : undefined }] });
  }

  // --- Routen ---
  for (const r of routes) {
    const p = PATHS[lang].r(r.id), U = up(p), cn = cname(lang, r.cc), tn = townOf(r, lang);
    const title = `${F(r, 'title', lang)} - ${lang === 'de' ? 'Tagesroute' : 'day route'} ${tn} | HiddenGem.Atlas`;
    const st = r.stops;
    const dir = (() => { const s = st.slice(0, 10); const f = (x) => x.lat + ',' + x.lon; return `https://www.google.com/maps/dir/?api=1&origin=${f(s[0])}&destination=${f(s[s.length - 1])}${s.length > 2 ? '&waypoints=' + s.slice(1, -1).map(f).join('%7C') : ''}&travelmode=walking`; })();
    const rows = st.map((s) => `<li><b>${esc(s.t)}</b> ${esc(F(s, 'name', lang))}${s.note ? `<br><span class="ty">${esc(F(s, 'note', lang))}</span>` : ''}${s.km ? ` <small>${s.km} km${s.walk ? ' · ' + t.walk + ' ' + s.walk + ' ' + t.min : ''}</small>` : ''} <a class="mini" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}" rel="noopener" target="_blank">Maps</a></li>`).join('');
    const b = `<p class="meta"><span class="badge">${t.routes}</span> ${flag(r.cc)} <a href="${U}${PATHS[lang].c(r.cc)}">${esc(cn)}</a> · ${esc(tn)}${r.best ? ` · ${t.best}: ${esc(F(r, 'best', lang))}` : ''}</p>
<p><a class="btn" href="${esc(dir)}" rel="noopener" target="_blank">${lang === 'de' ? 'Route in Google Maps öffnen' : 'Open route in Google Maps'} ↗</a> <a class="btn alt" href="${U}index.html#/planer">${lang === 'de' ? 'Alle Routen in der App' : 'All routes in the app'}</a></p>
<h2>${t.stops}</h2><ol class="pl uns">${rows}</ol>${gygBox(lang, tn, r.cc)}`;
    page({ lang, p, title, desc: trim(F(r, 'intro', lang), 158), h1: esc(F(r, 'title', lang)), lead: esc(F(r, 'intro', lang)), body: b, type: 'article',
      crumbs: [{ n: t.routes, p: PATHS[lang].routes }, { n: tn }], alt: PATHS[other(lang)].r(r.id),
      ld: [{ '@context': 'https://schema.org', '@type': 'TouristTrip', name: F(r, 'title', lang), description: F(r, 'intro', lang), inLanguage: lang, itinerary: { '@type': 'ItemList', itemListElement: st.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: F(s, 'name', lang), geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lon } } })) } }] });
  }

  // --- Verzeichnisse ---
  { const p = PATHS[lang].hub, U = up(p);
    const list = countries.map((cc) => [cc, cname(lang, cc), byCc.get(cc).length]).sort((a, b) => a[1].localeCompare(b[1], lang));
    page({ lang, p, title: lang === 'de' ? 'Alle Länder: Hidden Gems & Must-Sees weltweit | HiddenGem.Atlas' : 'All countries: hidden gems & must-sees worldwide | HiddenGem.Atlas',
      desc: lang === 'de' ? `${list.length} Länder, über 4.400 Orte: Hidden Gems, UNESCO-Welterbe, verrückte Geschichten, Abenteuer und Bars - mit Karte und Routenplaner.` : `${list.length} countries, 4,400+ places: hidden gems, UNESCO sites, wild stories, adventures and bars - with map and route planner.`,
      h1: lang === 'de' ? 'Alle Länder' : 'All countries', lead: lang === 'de' ? 'Wähle ein Land und plane deine eigene Route.' : 'Pick a country and plan your own route.',
      body: `<p><a class="btn" href="${U}index.html#/momente">${t.mapCta} →</a></p><ul class="chips">${list.map(([cc, n, c]) => `<li><a href="${U}${PATHS[lang].c(cc)}">${flag(cc)} ${esc(n)} <b>${c}</b></a></li>`).join('')}</ul>`,
      crumbs: [{ n: t.countries }], alt: PATHS[other(lang)].hub }); }
  { const p = PATHS[lang].unesco, U = up(p);
    const list = countries.filter((cc) => byCc.get(cc).filter((m) => m.unesco).length >= 2).map((cc) => [cc, cname(lang, cc), byCc.get(cc).filter((m) => m.unesco).length]).sort((a, b) => b[2] - a[2]);
    const tot = P.filter((m) => m.unesco).length;
    page({ lang, p, title: lang === 'de' ? 'UNESCO-Welterbe weltweit: alle Stätten nach Land | HiddenGem.Atlas' : 'UNESCO World Heritage worldwide: all sites by country | HiddenGem.Atlas',
      desc: lang === 'de' ? `${nf(tot, lang)} UNESCO-Welterbestätten nach Land sortiert - mit Aufnahmejahr, Karte und Google-Maps-Link.` : `${nf(tot, lang)} UNESCO World Heritage Sites by country - with year of inscription, map and Google Maps link.`,
      h1: lang === 'de' ? 'UNESCO-Welterbe weltweit' : 'UNESCO World Heritage worldwide', lead: lang === 'de' ? `${nf(tot, lang)} Stätten, nach Land sortiert.` : `${nf(tot, lang)} sites, sorted by country.`,
      body: `<ul class="chips">${list.map(([cc, n, c]) => `<li><a href="${U}${PATHS[lang].uc(cc)}">${flag(cc)} ${esc(n)} <b>${c}</b></a></li>`).join('')}</ul><p class="src">${t.src}</p>`,
      crumbs: [{ n: t.unesco }], alt: PATHS[other(lang)].unesco }); }
  { const p = PATHS[lang].routes, U = up(p);
    page({ lang, p, title: lang === 'de' ? 'Tagesrouten: fertig geplante Stadtrouten | HiddenGem.Atlas' : 'Day routes: ready-made city itineraries | HiddenGem.Atlas',
      desc: lang === 'de' ? 'Fertig geplante Tagesrouten mit Uhrzeiten, Gehzeiten und Google-Maps-Link - von einem Berufstätigen, der nur wenig Urlaub hat.' : 'Ready-made day routes with times, walking distances and a Google Maps link - from someone with a full-time job and little holiday.',
      h1: t.routes, lead: lang === 'de' ? 'Jede Route öffnest du mit einem Klick in Google Maps.' : 'Open any route in Google Maps with one click.',
      body: `<ul class="pl">${routes.map((r) => `<li><a href="${U}${PATHS[lang].r(r.id)}">${flag(r.cc)} ${esc(F(r, 'title', lang))}</a> <span class="ty">${esc(townOf(r, lang))}</span></li>`).join('')}</ul>`,
      crumbs: [{ n: t.routes }], alt: PATHS[other(lang)].routes }); }
}

// ---------- Blog (nur Texte ohne Entwurfsmarker) ----------
// Sobald Noel die echten Geschichten in content.json ersetzt (Marker "Entwurf" entfernt), entstehen hier automatisch Artikel-Seiten.
let blogN = 0;
for (const b of BLOG) {
  const d = content.detail?.['blog-' + b.id]; if (!d || /Entwurf/.test(d.text || '') || strip(d.text).length < 600) continue;
  for (const lang of ['de', 'en']) {
    const text = lang === 'en' ? d.text_en || d.text : d.text; const ttl = lang === 'en' ? b.title_en || b.title : b.title;
    const p = `${lang}/blog/${slugify(ttl)}/`; const alt = `${other(lang)}/blog/${slugify(other(lang) === 'en' ? b.title_en || b.title : b.title)}/`;
    page({ lang, p, title: ttl + ' | HiddenGem.Atlas', desc: trim(text, 158), h1: esc(ttl), lead: '', body: `<div class="story">${text}</div><p><a class="btn" href="${up(p)}index.html#/blog">Blog →</a></p>`, type: 'article', crumbs: [{ n: 'Blog' }, { n: ttl }], alt,
      ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: ttl, inLanguage: lang, author: { '@type': 'Person', name: 'Noel Sprick' }, dateModified: TODAY }] });
    blogN++;
  }
}

// ---------- Schreiben ----------
for (const d of ['de', 'en']) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
for (const o of OUT) { const f = path.join(ROOT, o.path); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, o.html); }

const urlTag = (p, alt) => `<url><loc>${BASE}${p}</loc><lastmod>${TODAY}</lastmod>${alt ? Object.entries(alt).map(([l, ap]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${ap}"/>`).join('') : ''}</url>`;
const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n<url><loc>${BASE}</loc><lastmod>${TODAY}</lastmod></url>\n${sitemap.map((s) => urlTag(s.p, s.alt)).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

fs.writeFileSync(path.join(ROOT, 'seo.css'), `@font-face{font-family:'DM Sans';font-weight:100 1000;font-display:swap;src:url(fonts/dm-sans-latin-wght-normal.woff2) format('woff2')}
@font-face{font-family:'Cormorant Garamond';font-weight:400;font-display:swap;src:url(fonts/cormorant-garamond-latin-400-normal.woff2) format('woff2')}
:root{--bg:#fdf8f0;--bg2:#f7f0e4;--text:#1a1208;--text2:#5c4a2a;--gold:#c97a2a;--line:rgba(90,60,20,.16);--dark:#1a0e04}
@media(prefers-color-scheme:dark){:root{--bg:#16110a;--bg2:#211910;--text:#f3ead9;--text2:#c9b793;--gold:#e8923a;--line:rgba(255,230,190,.16)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 'DM Sans',system-ui,sans-serif}
a{color:var(--gold)}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;background:var(--dark)}
.logo{font:400 24px 'Cormorant Garamond',Georgia,serif;color:#fdf8f0;text-decoration:none}.logo em{color:#e8923a}
.top nav{display:flex;gap:14px;flex-wrap:wrap;font-size:14px}.top nav a{color:#f3ead9;text-decoration:none}.top nav a:hover{color:#e8923a}.lang{border:1px solid #e8923a;border-radius:20px;padding:0 10px}
main{max-width:860px;margin:0 auto;padding:24px 16px 48px}h1{font:400 clamp(30px,6vw,46px)/1.15 'Cormorant Garamond',Georgia,serif;margin:.3em 0 .3em}
h2{font:400 26px 'Cormorant Garamond',Georgia,serif;margin:1.6em 0 .5em}.lead{font-size:18px;color:var(--text2);margin:0 0 1.2em}
.crumb{font-size:13px;color:var(--text2)}.crumb i{opacity:.5;font-style:normal}.crumb a{color:var(--text2)}
.btn{display:inline-block;background:var(--gold);color:#16140f;font-weight:600;padding:10px 18px;border-radius:24px;text-decoration:none;margin:0 6px 8px 0}.btn.alt{background:none;border:1px solid var(--gold);color:var(--gold)}
.pl{padding-left:20px;margin:0}.pl li{padding:5px 0;border-bottom:1px solid var(--line)}.pl.two{columns:2;column-gap:28px}.pl.two li{break-inside:avoid}.uns{padding-left:28px}
.ty{color:var(--text2);font-size:13px}.mini{font-size:12px;margin-left:6px}.meta{color:var(--text2);font-size:14px}.badge{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:1px 9px;font-size:12px;color:var(--gold)}
.chips{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}.chips a{display:inline-block;border:1px solid var(--line);background:var(--bg2);border-radius:20px;padding:5px 13px;text-decoration:none;color:var(--text)}.chips b{color:var(--gold);font-weight:600;margin-left:4px}
.gyg{margin:2em 0;padding:18px;border:1px solid var(--gold);border-radius:12px;background:var(--bg2)}.gyg h2{margin:.1em 0 .3em}.gyg .ad{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text2)}.gyg small{display:block;color:var(--text2);margin-top:6px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin:1.2em 0}.gal img{width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;border-radius:10px;display:block}.story{font-size:17px}.src{font-size:12px;color:var(--text2);margin-top:2em}
footer{border-top:1px solid var(--line);padding:24px 16px;text-align:center;font-size:13px;color:var(--text2)}footer a{color:var(--text2)}
@media(max-width:620px){.pl.two{columns:1}}
`);
console.log(`Seiten: ${OUT.length} (Länder ${countries.length}×2, Blog ${blogN}) · Sitemap-URLs: ${sitemap.length + 1} · Basis ${BASE}`);
