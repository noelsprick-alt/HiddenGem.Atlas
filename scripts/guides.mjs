// Stadt-Guides: data/guides/<slug>.json  ->  de/guide/<slug>/ + en/guide/<slug>/ (+ Übersicht + guides.json für die App)
// Aufbau jedes Guides: Titelbild · Inhaltsverzeichnis · Intro · Noels Story (nur wenn echt gefüllt) · Auf einen Blick ·
// Anreise · Unterwegs · nummerierte Spot-Abschnitte (Hidden Gems markiert) · Tagesplan · FAQ · Buchungsboxen · Teilen · Autor.
// status "live" = wird veröffentlicht, alles andere ("draft") bleibt unsichtbar.
import fs from 'node:fs';
import path from 'node:path';

export function loadGuides(root) {
  const dir = path.join(root, 'data', 'guides');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.error('Guide-Fehler', f, e.message); return null; } })
    .filter((g) => g && g.status === 'live' && g.slug);
}

const GT = {
  de: { hub: 'Stadt-Guides', back: '← Alle Stadt-Guides', by: 'Von Noel', upd: 'aktualisiert', toc: 'Inhaltsverzeichnis', facts: 'Auf einen Blick',
    disc: 'Dieser Guide enthält Werbe-Links (GetYourGuide, Omio). Wenn du darüber buchst, bekomme ich eine kleine Provision – du zahlst keinen Cent mehr.',
    story: (c) => `Meine Story in ${c}`, gem: 'Hidden Gem', tip: 'Tipp', maps: 'In Google Maps öffnen & speichern', itin: 'Dein Plan', day: 'Tag', faq: 'Häufige Fragen', more: 'Weitere Guides',
    check: 'Preise und Öffnungszeiten ändern sich – vor dem Besuch kurz prüfen.', hours: 'Zeiten', price: 'Preis',
    about: 'Über Noel', aboutP: 'Ich bin Noel, arbeite Vollzeit und reise mit wenig Urlaub und viel Neugier. Ich sammle Orte, die 99 % verpassen – ehrlich, mit echten Kosten und ohne Hype. Alle Spots dieses Guides findest du auch auf meiner Karte.',
    map: 'Alle Orte auf meiner Karte', share: 'Guide teilen', wa: 'Per WhatsApp', ig: 'Mehr Guides und Reels auf Instagram: @hiddengem.atlas', cap: 'Foto: Noel',
    hubLead: 'Lange, persönliche Guides mit Hidden Gems, Hintergründen, Tagesplänen und ehrlichen Tipps – kostenlos. 🌍 DE · EN · ES · 📍 in Google Maps speicherbar · 🆓 viele Gratis-Aktivitäten · 🎟️ 5 % Rabatt mit meinem Code. <a href="../../quiz/?l=de">🎯 Reise-Quiz: Fordere deine Freunde heraus →</a>',
    hubTitle: 'Stadt-Guides: Hidden Gems, Tipps & Tagespläne | HiddenGem.Atlas', hubDesc: 'Kostenlose Reise-Guides für Städte in Europa und weltweit: Hidden Gems, Anreise, Tagespläne und ehrliche Tipps von Noel.',
    uspLang: 'Sprache', uspMaps: 'In Google Maps speichern', uspFree: (n) => `${n} Gratis-Aktivitäten`, uspDeal: '5 % Rabatt-Code', uspBg: 'Hintergrund & Geschichte', esAuto: 'Español (traducción automática)',
    free: 'Kostenlos erlebbar', freeH: '🆓 Kostenlos erleben', freeP: (n, c) => `${n} Orte in ${c}, die du ohne Eintritt oder komplett gratis erleben kannst (bei manchen kostet nur ein Teil, z. B. Turm oder Museum):`,
    dealH: '🎟️ Exklusiv für dich: 5 % Rabatt', dealP: (c) => `Mit meinem Code <b>HIDDENGEMATLAS5</b> sparst du 5 % auf jede Tour, jedes Ticket und jede Aktivität bei GetYourGuide – auch in ${c}. Einfach beim Bezahlen eingeben.`, dealB: (c) => `Touren in ${c} ansehen`, copy: 'Code kopieren', copied: 'Kopiert ✓',
    mapsH: '📍 Diesen Guide in Google Maps speichern', mapsA: 'Schnell: Route öffnen', mapsAp: 'Öffnet alle Orte als Route in Google Maps – dort kannst du sie mit „Speichern“ in eine Liste legen.', mapsPart: 'Teil',
    mapsB: 'Dauerhaft: als eigene Karte (3 Minuten)', mapsSteps: ['Lade die Ortsliste herunter (CSV).', 'Öffne <a href="https://www.google.com/maps/d/" target="_blank" rel="noopener">Google My Maps</a> → „Neue Karte erstellen“ → „Importieren“ → Datei auswählen.', 'Als Position die Spalte „Ort“, als Titel „Name“ wählen – fertig.', 'In der Google-Maps-App findest du die Karte unter „Gespeichert“ → „Karten“, auch unterwegs.'], csv: 'Ortsliste herunterladen (CSV)', mapsCh: 'Einzeln speichern', mapsC: 'Bei jedem Ort führt „In Google Maps öffnen & speichern“ direkt zum Ort – dort auf „Speichern“ tippen.',
    csvH: ['Name', 'Ort', 'Kategorie', 'Kostenlos', 'Tipp', 'Guide'], cMust: 'Must-See', cGem: 'Hidden Gem', yes: 'ja' },
  en: { hub: 'City guides', back: '← All city guides', by: 'By Noel', upd: 'updated', toc: 'Table of contents', facts: 'At a glance',
    disc: 'This guide contains affiliate links (GetYourGuide, Omio). If you book through them I earn a small commission – you never pay a cent more.',
    story: (c) => `My story in ${c}`, gem: 'Hidden gem', tip: 'Tip', maps: 'Open & save in Google Maps', itin: 'Your plan', day: 'Day', faq: 'FAQ', more: 'More guides',
    check: 'Prices and opening hours change – double-check before you go.', hours: 'Hours', price: 'Price',
    about: 'About Noel', aboutP: 'I am Noel. I work full time and travel on little holiday and a lot of curiosity. I collect places 99% of people miss – honest, with real costs and no hype. Every spot in this guide is also on my map.',
    map: 'All places on my map', share: 'Share this guide', wa: 'On WhatsApp', ig: 'More guides and reels on Instagram: @hiddengem.atlas', cap: 'Photo: Noel',
    hubLead: 'Long, personal guides with hidden gems, background stories, day plans and honest tips – free. 🌍 DE · EN · ES · 📍 save to Google Maps · 🆓 lots of free activities · 🎟️ 5% off with my code. <a href="../../quiz/?l=en">🎯 Travel quiz: challenge your friends →</a>',
    hubTitle: 'City guides: hidden gems, tips & day plans | HiddenGem.Atlas', hubDesc: 'Free travel guides for cities in Europe and beyond: hidden gems, getting there, day plans and honest tips from Noel.',
    uspLang: 'Language', uspMaps: 'Save to Google Maps', uspFree: (n) => `${n} free activities`, uspDeal: '5% discount code', uspBg: 'Background & history', esAuto: 'Español (traducción automática)',
    free: 'Free to experience', freeH: '🆓 Free things to do', freeP: (n, c) => `${n} places in ${c} you can enjoy without an entry fee or completely free (for some, only a part costs extra, e.g. a tower or museum):`,
    dealH: '🎟️ Exclusive for you: 5% off', dealP: (c) => `With my code <b>HIDDENGEMATLAS5</b> you save 5% on every tour, ticket and activity on GetYourGuide – in ${c} too. Just enter it at checkout.`, dealB: (c) => `See tours in ${c}`, copy: 'Copy code', copied: 'Copied ✓',
    mapsH: '📍 Save this guide to Google Maps', mapsA: 'Quick: open as a route', mapsAp: 'Opens all places as a route in Google Maps – tap “Save” there to put them in a list.', mapsPart: 'Part',
    mapsB: 'Permanent: as your own map (3 minutes)', mapsSteps: ['Download the place list (CSV).', 'Open <a href="https://www.google.com/maps/d/" target="_blank" rel="noopener">Google My Maps</a> → “Create a new map” → “Import” → choose the file.', 'Pick the column “Place” for position and “Name” for the title – done.', 'In the Google Maps app the map appears under “Saved” → “Maps”, also on the go.'], csv: 'Download place list (CSV)', mapsCh: 'Save one by one', mapsC: '“Open & save in Google Maps” under each place takes you straight there – tap “Save”.',
    csvH: ['Name', 'Place', 'Category', 'Free', 'Tip', 'Guide'], cMust: 'Must-see', cGem: 'Hidden gem', yes: 'yes' },
};

export function renderGuides(ctx) {
  const { GUIDES, ROOT, BASE, TODAY, OUT, page, up, other, esc, trim, strip, omioBox, gygBox, gygUrl } = ctx;
  if (!GUIDES.length) return 0;
  const gv = (o, k, lang) => (lang === 'en' ? (o[k + '_en'] ?? o[k]) : o[k]) ?? '';
  const fexists = (s) => !!s && fs.existsSync(path.join(ROOT, s));
  const posterOf = (s) => s.replace('images/video/', 'images/video/p/').replace(/\.mp4$/i, '.webp');
  const gSlug = (g, lang) => (lang === 'en' ? g.slug_en || g.slug : g.slug);
  const gPath = (g, lang) => `${lang}/guide/${gSlug(g, lang)}/`;
  const mediaHtml = (srcs, alt, U) => {
    const out = (srcs || []).filter(fexists).map((s) => (/\.mp4$/i.test(s)
      ? `<video controls muted playsinline preload="none"${fexists(posterOf(s)) ? ` poster="${U}${posterOf(s)}"` : ''}><source src="${U}${s}" type="video/mp4"></video>`
      : `<img src="${U}${s}" alt="${esc(alt)}" loading="lazy">`));
    return out.length ? `<div class="media">${out.join('')}</div>` : '';
  };
  const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const firstImg = (g) => [g.hero, ...(g.media || [])].filter(Boolean).map((s) => (/\.mp4$/i.test(s) ? posterOf(s) : s)).find(fexists);
  let count = 0;

  for (const lang of ['de', 'en']) {
    const T = GT[lang], o = other(lang), hubP = `${lang}/guide/`;
    const idx = [];
    for (const g of GUIDES) {
      const p = gPath(g, lang), U = up(p), city = gv(g, 'city', lang), title = gv(g, 'title', lang);
      const toc = []; let n = 0; let main = '';
      const sec = (id, h, numbered) => { const label = numbered ? `${++n}. ${h}` : h; toc.push([id, label]); return `<h2 id="${esc(id)}">${esc(label)}</h2>`; };
      const allSpots = (g.blocks || []).flatMap((b) => (b.type === 'spots' ? b.spots || [] : []));
      const sid = (s) => 'o' + (allSpots.indexOf(s) + 1);
      const spot = (s) => {
        const nm = gv(s, 'name', lang); const q = s.q || `${nm} ${city}`;
        const meta = [s.hours || s.hours_en ? `🕒 ${esc(gv(s, 'hours', lang))}` : '', s.price || s.price_en ? `💶 ${esc(gv(s, 'price', lang))}` : ''].filter(Boolean).join(' · ');
        return `<div class="spot${s.gem ? ' gem' : ''}" id="${sid(s)}"><h3>${esc(nm)}${s.gem ? `<span class="gembadge">💎 ${T.gem}</span>` : ''}${s.free ? `<span class="freebadge">🆓 ${T.free}</span>` : ''}</h3>`
          + `<div class="gtext">${gv(s, 'text', lang)}</div>${meta ? `<p class="meta">${meta}</p>` : ''}`
          + (s.tip || s.tip_en ? `<p class="tip"><b>${T.tip}:</b> ${gv(s, 'tip', lang)}</p>` : '')
          + mediaHtml(s.photos, nm, U)
          + `<p class="gm"><a href="${esc(mapsUrl(q))}" target="_blank" rel="noopener">📍 ${T.maps}</a></p></div>`;
      };

      // Intro + Story
      main += `<div class="gtext">${gv(g, 'intro', lang)}</div>`;
      const storyHtml = gv(g, 'story', lang);
      if (storyHtml) main += `<section class="sbox"><h2 id="story">${esc(T.story(city))}</h2><div class="gtext">${storyHtml}</div>${mediaHtml(g.media, city, U)}<p class="meta">${T.cap}</p></section>`, toc.push(['story', T.story(city)]);
      else if ((g.media || []).length) main += mediaHtml(g.media, city, U);
      main += `<p class="disc">${T.disc} ${T.check}</p>`;
      const freeSpots = allSpots.filter((x) => x.free);
      const bgId = (g.blocks || []).find((b) => b.type !== 'spots' && /wissen|ausmacht|hintergrund/i.test(b.id + ' ' + (b.h || '')))?.id || (storyHtml ? 'story' : '');
      // Rabatt-Box
      main += `<aside class="deal" id="deal"><span class="ad">${lang === 'de' ? 'Werbung' : 'Ad'}</span><h2>${T.dealH}</h2><p>${T.dealP(esc(city))}</p><p><button class="btn copy" type="button" data-code="HIDDENGEMATLAS5" data-ok="${T.copied}">${T.copy}: HIDDENGEMATLAS5</button> <a class="btn alt" href="${esc(gygUrl(g.gyg_q || city, g.cc))}" rel="sponsored noopener" target="_blank">${esc(T.dealB(city))} ↗</a></p></aside>`;
      // Gratis-Box
      if (freeSpots.length) main += `<section class="freebox" id="free"><h2>${T.freeH}</h2><p>${esc(T.freeP(freeSpots.length, city))}</p><ul>${freeSpots.map((x) => `<li><a href="#${sid(x)}">${esc(gv(x, 'name', lang))}</a></li>`).join('')}</ul></section>`;
      if ((g.facts || []).length) main += `<h2 id="facts">${T.facts}</h2><div class="facts">${g.facts.map((f) => `<div><b>${esc(gv(f, 'k', lang))}</b>${esc(gv(f, 'v', lang))}</div>`).join('')}</div>`, toc.push(['facts', T.facts]);

      // Blöcke
      for (const b of g.blocks || []) {
        const id = b.id || `s${toc.length}`;
        if (b.type === 'spots') main += sec(id, gv(b, 'h', lang), true) + (b.intro ? `<div class="gtext">${gv(b, 'intro', lang)}</div>` : '') + (b.spots || []).map(spot).join('');
        else main += sec(id, gv(b, 'h', lang), false) + `<div class="gtext">${gv(b, 'html', lang)}</div>`;
        if (b.box === 'omio') main += omioBox(lang, city, g.cc);
        if (b.box === 'gyg') main += gygBox(lang, g.gyg_q || city, g.cc);
      }

      // Google-Maps-Export
      if (allSpots.length) {
        const qs = allSpots.map((x) => x.q || `${gv(x, 'name', lang)} ${city}`);
        const chunks = []; for (let i = 0; i < qs.length; i += 10) chunks.push(qs.slice(i, i + 10));
        const dir = (c) => `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${encodeURIComponent(c[0])}&destination=${encodeURIComponent(c[c.length - 1])}${c.length > 2 ? `&waypoints=${encodeURIComponent(c.slice(1, -1).join('|'))}` : ''}`;
        const csvName = `hiddengem-atlas-${gSlug(g, lang)}.csv`;
        const cq = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const rows = [T.csvH.map(cq).join(',')].concat(allSpots.map((x, i) => [gv(x, 'name', lang), qs[i], x.gem ? T.cGem : T.cMust, x.free ? T.yes : '', strip(gv(x, 'tip', lang) || ''), `${BASE}${p}#${sid(x)}`].map(cq).join(',')));
        OUT.push({ path: p + csvName, html: '\uFEFF' + rows.join('\r\n') + '\r\n' });
        main += `<section class="mapsbox" id="maps"><h2>${T.mapsH}</h2><h3>1. ${T.mapsA}</h3><p class="meta">${T.mapsAp}</p><p>${chunks.map((c, i) => `<a class="btn" href="${esc(dir(c))}" target="_blank" rel="noopener">🗺️ ${chunks.length > 1 ? `${T.mapsPart} ${i + 1} (${c.length})` : T.mapsA}</a>`).join(' ')}</p>`
          + `<h3>2. ${T.mapsB}</h3><ol>${T.mapsSteps.map((x) => `<li>${x}</li>`).join('')}</ol><p><a class="btn alt" href="${csvName}" download>⬇️ ${T.csv}</a></p><h3>3. ${T.mapsCh}</h3><p class="meta">${T.mapsC}</p></section>`;
      }

      // Tagesplan
      if ((g.itinerary || []).length) {
        main += `<div class="itin">${sec('plan', T.itin, false)}` + g.itinerary.map((d, i) => `<h3>${T.day} ${i + 1}: ${esc(gv(d, 'h', lang))}</h3><ol>${(lang === 'en' ? d.items_en || d.items : d.items).map((x) => `<li>${x}</li>`).join('')}</ol>`).join('') + '</div>';
      }
      // FAQ
      const faq = (g.faq || []).map((f) => ({ q: gv(f, 'q', lang), a: gv(f, 'a', lang) }));
      if (faq.length) main += sec('faq', T.faq, false) + faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><div class="gtext">${f.a}</div></details>`).join('');

      // Abschluss
      main += `<p><a class="btn" href="${U}index.html#/momente">🗺️ ${T.map} →</a> <a class="btn alt" href="https://www.instagram.com/hiddengem.atlas/" rel="noopener" target="_blank">${T.ig}</a></p>`;
      main += gygBox(lang, g.gyg_q || city, g.cc);
      const url = BASE + p; const shareTxt = encodeURIComponent(`${title} – ${url}`);
      main += `<p><b>${T.share}:</b> <a href="https://wa.me/?text=${shareTxt}" target="_blank" rel="noopener">${T.wa}</a></p>`;
      const others = GUIDES.filter((x) => x !== g).slice(0, 6);
      if (others.length) main += `<h2>${T.more}</h2><ul class="gcards">${others.map((x) => { const im = firstImg(x); return `<li><a href="${U}${gPath(x, lang)}">${im ? `<img src="${U}${im}" alt="" loading="lazy">` : `<div class="ph">${x.flag || '📍'}</div>`}<span>${x.flag || ''} ${esc(gv(x, 'city', lang))}</span></a></li>`; }).join('')}</ul>`;
      main += `<div class="about"><div><b>${T.about}</b><p class="meta">${T.aboutP}</p></div></div>`;

      // Kopf
      const hero = g.hero && fexists(g.hero) ? `<figure class="hero"><img src="${U}${g.hero}" alt="${esc(gv(g, 'hero_alt', lang) || city)}" fetchpriority="high"></figure>` : '';
      const byline = `<p class="byline">${T.by} · ${T.upd} ${esc(g.updated || TODAY)}</p>`;
      const enUrl = BASE + gPath(g, 'en'); const host = new URL(BASE).host.replace(/-/g, '--').replace(/\./g, '-');
      const esUrl = `https://${host}.translate.goog${new URL(enUrl).pathname}?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es`;
      const langs = [['de', 'DE', U + gPath(g, 'de')], ['en', 'EN', U + gPath(g, 'en')], ['es', 'ES', esUrl]].map(([l, lab, href]) => (l === lang ? `<b>${lab}</b>` : `<a href="${esc(href)}" hreflang="${l}"${l === 'es' ? ` title="${esc(T.esAuto)}" rel="noopener" target="_blank"` : ''}>${lab}</a>`)).join(' · ');
      const freeN = allSpots.filter((x) => x.free).length;
      const bgId2 = (g.blocks || []).find((b) => b.type !== 'spots' && /wissen|ausmacht|hintergrund/i.test(b.id + ' ' + (b.h || '')))?.id || (gv(g, 'story', lang) ? 'story' : '');
      const usp = `<nav class="usp" aria-label="Guide"><span class="chip">🌍 ${T.uspLang}: ${langs}</span><a class="chip" href="#maps">📍 ${T.uspMaps}</a>${freeN ? `<a class="chip" href="#free">🆓 ${T.uspFree(freeN)}</a>` : ''}<a class="chip" href="#deal">🎟️ ${T.uspDeal}</a>${bgId2 ? `<a class="chip" href="#${esc(bgId2)}">📖 ${T.uspBg}</a>` : ''}</nav>`;
      const copyJs = `<script>document.querySelectorAll('button.copy').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(b.dataset.code);b.textContent=b.dataset.ok;}catch(e){}});});</script>`;
      const tocHtml = `<details class="toc" open><summary>${T.toc}</summary><ol>${toc.map(([id, l]) => `<li><a href="#${esc(id)}">${esc(l)}</a></li>`).join('')}</ol></details>`;
      const alt = gPath(g, o), img = firstImg(g);
      const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: title, inLanguage: lang, author: { '@type': 'Person', name: 'Noel Sprick' }, publisher: { '@type': 'Organization', name: 'HiddenGem.Atlas' }, dateModified: g.updated || TODAY, ...(img ? { image: BASE + img } : {}) }];
      if (allSpots.length) ld.push({ '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: allSpots.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: gv(x, 'name', lang), url: `${BASE}${p}#${sid(x)}`, ...(x.free ? { isAccessibleForFree: true } : {}) } })) });
      if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) });
      page({ lang, p, title: `${title} | HiddenGem.Atlas`, desc: trim(gv(g, 'desc', lang) || gv(g, 'intro', lang), 158), h1: `${g.flag || ''} ${esc(title)}`, lead: '',
        body: `<div class="guide"><p><a href="${U}${hubP}">${T.back}</a></p>${byline}${usp}${hero}${tocHtml}${main}</div>${copyJs}`, type: 'article', lastmod: g.updated || TODAY, image: img, crumbs: [{ n: T.hub, p: hubP }, { n: city }], alt, ld });
      idx.push({ slug: gSlug(g, lang), blog: g.blog || '', city, flag: g.flag || '', title, img: img || '', url: p });
      count++;
    }
    const HU = up(hubP);
    const cards = GUIDES.map((g) => { const im = firstImg(g); return `<li><a href="${HU}${gPath(g, lang)}">${im ? `<img src="${HU}${im}" alt="" loading="lazy">` : `<div class="ph">${g.flag || '📍'}</div>`}<span>${g.flag || ''} ${esc(gv(g, 'city', lang))}</span></a></li>`; });
    page({ lang, p: hubP, title: T.hubTitle, desc: T.hubDesc, h1: T.hub, lead: T.hubLead, body: `<ul class="gcards">${cards.join('')}</ul>`, crumbs: [{ n: T.hub }], alt: `${o}/guide/` });
    OUT.push({ path: `${lang}/guides.json`, html: JSON.stringify(idx) });
  }

  // ---- Weiterleitungen: falsche Slugs, Kurzlinks, 404-Fallback (für Instagram-DMs & Tippfehler) ----
  const redir = (to) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="${BASE}${to}"><meta http-equiv="refresh" content="0;url=${BASE}${to}"><script>location.replace(${JSON.stringify(BASE + to)}+location.hash)</script><title>HiddenGem.Atlas</title></head><body><a href="${BASE}${to}">${BASE}${to}</a></body></html>`;
  const alias = {}; // kleingeschriebener Schlüssel -> Zielpfad
  const reserved = new Set(['de', 'en', 'g', 'data', 'data-src', 'images', 'fonts', 'scripts', 'social']);
  for (const g of GUIDES) {
    const de = g.slug, en = g.slug_en || g.slug;
    // /en/guide/<de-slug>/ -> EN, /de/guide/<en-slug>/ -> DE
    if (de !== en) { OUT.push({ path: `en/guide/${de}/index.html`, html: redir(gPath(g, 'en')) }); OUT.push({ path: `de/guide/${en}/index.html`, html: redir(gPath(g, 'de')) }); }
    // Kurzlinks /g/<slug>/ -> englischer Guide (Instagram-Publikum ist überwiegend englischsprachig)
    for (const sl of new Set([de, en])) OUT.push({ path: `g/${sl}/index.html`, html: redir(gPath(g, 'en')) });
    for (const sl of new Set([de, en])) {
      alias[sl] = gPath(g, 'en'); alias[`g/${sl}`] = gPath(g, 'en');
      alias[`en/guide/${sl}`] = gPath(g, 'en'); alias[`de/guide/${sl}`] = gPath(g, 'de');
    }
  }
  alias['guide'] = 'en/guide/'; alias['guides'] = 'en/guide/'; alias['en/guide'] = 'en/guide/'; alias['de/guide'] = 'de/guide/'; alias['quiz'] = 'quiz/';
  const basePath = new URL(BASE).pathname; // z. B. /HiddenGem.Atlas/
  OUT.push({ path: '404.html', html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>HiddenGem.Atlas – page not found</title>
<style>body{font-family:system-ui,sans-serif;background:#fdf8f0;color:#1a1208;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px;text-align:center}a{color:#c97a2a;font-weight:600}</style>
<script>(function(){var A=${JSON.stringify(alias)};var B=${JSON.stringify(basePath.toLowerCase().split('/').filter(Boolean).pop() || '')};
var s=decodeURIComponent(location.pathname).toLowerCase().split('/').filter(function(x){return x&&x!=='index.html';});
var k=s.indexOf(B);if(k>=0)s=s.slice(k+1);var r=s.join('/').split(' ').join('-');
var t=A[r]||A[s[s.length-1]];var gi=s.indexOf('guide');if(!t&&gi>=0&&s[gi+1])t=A[s[gi+1]];
if(t){location.replace(${JSON.stringify(BASE)}+t+location.hash);}})();</script></head>
<body><div><h1>🧭 Oops – this page moved</h1><p>All free city guides: <a href="${BASE}en/guide/">English</a> · <a href="${BASE}de/guide/">Deutsch</a></p><p><a href="${BASE}">HiddenGem.Atlas</a></p></div></body></html>` });
  return count;
}
