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
    story: (c) => `Meine Story in ${c}`, gem: 'Hidden Gem', tip: 'Tipp', maps: 'In Google Maps ansehen', itin: 'Dein Plan', day: 'Tag', faq: 'Häufige Fragen', more: 'Weitere Guides',
    check: 'Preise und Öffnungszeiten ändern sich – vor dem Besuch kurz prüfen.', hours: 'Zeiten', price: 'Preis',
    about: 'Über Noel', aboutP: 'Ich bin Noel, arbeite Vollzeit und reise mit wenig Urlaub und viel Neugier. Ich sammle Orte, die 99 % verpassen – ehrlich, mit echten Kosten und ohne Hype. Alle Spots dieses Guides findest du auch auf meiner Karte.',
    map: 'Alle Orte auf meiner Karte', share: 'Guide teilen', wa: 'Per WhatsApp', ig: 'Mehr Guides und Reels auf Instagram: @hiddengem.atlas', cap: 'Foto: Noel',
    hubLead: 'Lange, sorgfältig recherchierte Guides mit Hidden Gems, Anreise, Tagesplänen und ehrlichen Tipps – kostenlos.',
    hubTitle: 'Stadt-Guides: Hidden Gems, Tipps & Tagespläne | HiddenGem.Atlas', hubDesc: 'Kostenlose Reise-Guides für Städte in Europa und weltweit: Hidden Gems, Anreise, Tagespläne und ehrliche Tipps von Noel.' },
  en: { hub: 'City guides', back: '← All city guides', by: 'By Noel', upd: 'updated', toc: 'Table of contents', facts: 'At a glance',
    disc: 'This guide contains affiliate links (GetYourGuide, Omio). If you book through them I earn a small commission – you never pay a cent more.',
    story: (c) => `My story in ${c}`, gem: 'Hidden gem', tip: 'Tip', maps: 'View in Google Maps', itin: 'Your plan', day: 'Day', faq: 'FAQ', more: 'More guides',
    check: 'Prices and opening hours change – double-check before you go.', hours: 'Hours', price: 'Price',
    about: 'About Noel', aboutP: 'I am Noel. I work full time and travel on little holiday and a lot of curiosity. I collect places 99% of people miss – honest, with real costs and no hype. Every spot in this guide is also on my map.',
    map: 'All places on my map', share: 'Share this guide', wa: 'On WhatsApp', ig: 'More guides and reels on Instagram: @hiddengem.atlas', cap: 'Photo: Noel',
    hubLead: 'Long, carefully researched guides with hidden gems, getting there, day plans and honest tips – free.',
    hubTitle: 'City guides: hidden gems, tips & day plans | HiddenGem.Atlas', hubDesc: 'Free travel guides for cities in Europe and beyond: hidden gems, getting there, day plans and honest tips from Noel.' },
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
      const spot = (s) => {
        const nm = gv(s, 'name', lang); const q = s.q || `${nm} ${city}`;
        const meta = [s.hours || s.hours_en ? `🕒 ${esc(gv(s, 'hours', lang))}` : '', s.price || s.price_en ? `💶 ${esc(gv(s, 'price', lang))}` : ''].filter(Boolean).join(' · ');
        return `<div class="spot${s.gem ? ' gem' : ''}"><h3>${esc(nm)}${s.gem ? `<span class="gembadge">💎 ${T.gem}</span>` : ''}</h3>`
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
      if ((g.facts || []).length) main += `<h2 id="facts">${T.facts}</h2><div class="facts">${g.facts.map((f) => `<div><b>${esc(gv(f, 'k', lang))}</b>${esc(gv(f, 'v', lang))}</div>`).join('')}</div>`, toc.push(['facts', T.facts]);

      // Blöcke
      for (const b of g.blocks || []) {
        const id = b.id || `s${toc.length}`;
        if (b.type === 'spots') main += sec(id, gv(b, 'h', lang), true) + (b.intro ? `<div class="gtext">${gv(b, 'intro', lang)}</div>` : '') + (b.spots || []).map(spot).join('');
        else main += sec(id, gv(b, 'h', lang), false) + `<div class="gtext">${gv(b, 'html', lang)}</div>`;
        if (b.box === 'omio') main += omioBox(lang, city, g.cc);
        if (b.box === 'gyg') main += gygBox(lang, g.gyg_q || city, g.cc);
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
      const tocHtml = `<details class="toc" open><summary>${T.toc}</summary><ol>${toc.map(([id, l]) => `<li><a href="#${esc(id)}">${esc(l)}</a></li>`).join('')}</ol></details>`;
      const alt = gPath(g, o), img = firstImg(g);
      const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: title, inLanguage: lang, author: { '@type': 'Person', name: 'Noel Sprick' }, publisher: { '@type': 'Organization', name: 'HiddenGem.Atlas' }, dateModified: g.updated || TODAY, ...(img ? { image: BASE + img } : {}) }];
      if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) });
      page({ lang, p, title: `${title} | HiddenGem.Atlas`, desc: trim(gv(g, 'desc', lang) || gv(g, 'intro', lang), 158), h1: `${g.flag || ''} ${esc(title)}`, lead: '',
        body: `<div class="guide"><p><a href="${U}${hubP}">${T.back}</a></p>${byline}${hero}${tocHtml}${main}</div>`, type: 'article', image: img, crumbs: [{ n: T.hub, p: hubP }, { n: city }], alt, ld });
      idx.push({ slug: gSlug(g, lang), blog: g.blog || '', city, flag: g.flag || '', title, img: img || '', url: p });
      count++;
    }
    const HU = up(hubP);
    const cards = GUIDES.map((g) => { const im = firstImg(g); return `<li><a href="${HU}${gPath(g, lang)}">${im ? `<img src="${HU}${im}" alt="" loading="lazy">` : `<div class="ph">${g.flag || '📍'}</div>`}<span>${g.flag || ''} ${esc(gv(g, 'city', lang))}</span></a></li>`; });
    page({ lang, p: hubP, title: T.hubTitle, desc: T.hubDesc, h1: T.hub, lead: T.hubLead, body: `<ul class="gcards">${cards.join('')}</ul>`, crumbs: [{ n: T.hub }], alt: `${o}/guide/` });
    OUT.push({ path: `${lang}/guides.json`, html: JSON.stringify(idx) });
  }
  return count;
}
