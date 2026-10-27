# HiddenGem.Atlas · Website (v11)

Live: https://noelsprick-alt.github.io/HiddenGem.Atlas/

## Inhalte bearbeiten (ohne Code)
1. Website mit **`?edit`** am Ende öffnen: `https://noelsprick-alt.github.io/HiddenGem.Atlas/?edit`
   (nur einmal pro Gerät nötig - danach erscheinen rechts unten ✏️ 🚀 ⚙️)
2. **✏️** → Bearbeitungsmodus. Jeden Text anklicken und lostippen. Bilder über **📷**, Karten (Partner, Projekte, Reality Checks, Momente, Trends, Blog) über **✏️ / ＋ / 🗑**.
3. Andere Unterseite: Auswahl **„Seite“** in der dunklen Leiste unten.
4. Englisch: oben auf **EN** umschalten und den englischen Text direkt ändern - oder leer lassen, dann wird automatisch übersetzt.
5. **🚀 Veröffentlichen** → nach 1-2 Minuten für alle sichtbar.

Beim ersten Veröffentlichen fragt die Seite nach einem **GitHub-Token** (Anleitung steht direkt im Fenster, ⚙️ → GitHub).
Der Token bleibt nur auf deinem Gerät. Alle Änderungen landen in `data/content.json`, Bilder in `images/`.

## Automatisch
- **Trend-Radar** (`.github/workflows/trends.yml`): täglich 05:00 UTC neue Trends, deutsch + englisch, Einträge älter als 14 Tage werden gelöscht.
- **Übersetzung** (`.github/workflows/translate.yml`): läuft nach jedem Veröffentlichen und ergänzt fehlende englische Texte.
- Formulare (Bewerbung, Newsletter) kommen per E-Mail über FormSubmit an die Adresse aus ⚙️ → Formulare. Beim allerersten Absenden kommt eine Aktivierungs-Mail - einmal bestätigen.

## Dateien
- `index.html` - die komplette Website (alle Unterseiten, DE/EN/ES)
- `fonts/` - Schriften (lokal, DSGVO)
- `data/content.json` - deine Änderungen aus dem Editor
- `data/trends.json` - automatisch gepflegte Trends
- `data/moments-extra.json` - zusätzliche Karten-Orte in Masse (siehe unten)
- `data/routes.json` - Tagesrouten (Karte → Tagesrouten): Stopps mit Uhrzeit, Notiz DE/EN, Google-Maps-Suchname
- `data/events.json` - Eventkalender; wird per Skript aus festen Regeln berechnet (nur sichere, wiederkehrende Termine)
- `data/planner-tips.json` - persönliche Empfehlung pro Stadt im Reiseplaner (`own` = eigenes Erlebnis, `tip` = Empfehlung, `todo` = noch nicht dort); im `?edit`-Modus direkt anklickbar
- `scripts/` - Helfer für die GitHub Actions

## Orte in Masse hinzufügen (`data/moments-extra.json`)
Für große Mengen (Ziel: 1.500+ Orte) die Datei direkt ergänzen - ein Objekt pro Ort, immer **Deutsch + Englisch**:

```json
{"id":"rp-es-gruga","kind":"mustsee","cc":"DE","flag":"🇩🇪","area":"ruhr","town":"Essen","town_en":"Essen",
 "city":"Grugapark","city_en":"Grugapark","cat":"nature","lat":51.4255,"lon":6.9970,"q":"Grugapark Essen",
 "rating":4,"price":"€","title":"Satz auf Deutsch","title_en":"Sentence in English","visit":"todo"}
```
- `kind`: `gem` (Hidden Gem) oder `mustsee` · `cat`: sight, food, cafe, nature, view, shop, bar, beach, culture
- `price`: `free`, `€`, `€€`, `€€€` oder `?` (unbekannt, wird nicht angezeigt)
- `area`: optional, gruppiert Orte über Städte hinweg (aktuell `ruhr`; neue Regionen in `MP_AREAS` in `index.html` anlegen)
- `visit`: `todo` = „Auf meiner Liste" (noch nicht besucht); weglassen = von Noel besucht
- `id` muss eindeutig sein. Neue Orte erscheinen automatisch, auch wenn im Editor schon Orte geändert wurden; im Editor gelöschte bleiben gelöscht.

## v13 (Okt 2026)
- `data/moments-world.json`: Hauptstädte + bekannteste Sehenswürdigkeiten weltweit (~2.980 Orte, 198 Länder, nur `mustsee`, keine Hidden Gems, `visit:"todo"`, `cap:1` = Hauptstadt). Kompaktes Format.
- `data/events.json`: `basis` = `rule` (berechnet) oder `official` (Quelle in `src`/`url`); `reg:"ruhr"` = Ruhrgebiet-Kalender; `pending` = angekündigt, Datum noch offen (wird nicht angezeigt).
- Seitenweite Suche (Taste `/` oder Button), Brückentage-Planer, "Warum folgen"-Bereich auf der Startseite.

## Fotos (Handy-Originale)
`pip install pillow pillow-heif` · `python3 scripts/process_photos.py scan <ordner>` (verkleinert auf WebP, Vorschau in `images/photos/t/`, GPS -> nächster Ort ≤ 400 m, ohne EXIF im Web-Bild) · danach `apply` trägt die Fotos in `data/content.json` ein (`moment-<id>` = Ortsgalerie, `pillar-fotografie` = Fotografie-Galerie).

## Medien (v13.2)
- `images/photos/*.webp` (+ `t/` Vorschau) · `images/video/*.mp4` (H.264, 720p, **mit Ton** AAC; startet stumm, Ton-Schalter in Stories/Galerie) + Poster `images/video/p/*.webp`
- Zuordnung in `data/content.json` → `detail[<key>].photos` (`moment-<id>`, `blog-bc-<n>`, `rc-<id>`, `pillar-fotografie`), Porträt in `images.about-portrait`
- Story-Highlights auf „Über mich“: `data/stories.json` (Gruppen mit `cover` + `items[src, poster, cap, cap_en]`)

## v14 (Okt 2026)
- **Startseite:** rotierende Hintergrund-Fotos `images/hero/<name>-w.webp` (quer, Desktop) / `-p.webp` (hoch, Handy); Liste `HERO_SLIDES` in `index.html` (Name + Ort DE/EN/ES).
- **Karte:** `data/moments-unesco.json` = alle 1.273 UNESCO-Welterbestätten (Snapshot 23.08.2026): `items` = neue Orte (`unesco` = Jahr, `whc` = UNESCO-ID), `tag` = bestehende Orte, die Welterbe sind (`id → [Jahr, whc]`). `data/moments-curated.json` = kuratierte Ebenen mit `theme`: `story` (verrückte Geschichten), `adventure` (Abenteuer), `bar` (legendäre Bars).
- **Filter:** Themen-Buttons (UNESCO/Geschichten/Abenteuer/Bars), Land-Auswahl und Stadt-Suche immer sichtbar.
- **Meine Reiseroute:** ➕ bei jedem Ort, Liste ordnen/optimieren, Export als Google-Maps-Route (in Teilen à 9 Zwischenstopps), KML für Google My Maps, CSV. Gespeichert nur im Browser (`hg-myroute`).
- **Spanisch:** `data/i18n-es.json` (`t` = Schlüssel → Text); fehlende Schlüssel und Inhalte ohne `_es` fallen auf Englisch zurück. Datensätze können `title_es`, `city_es` usw. bekommen.

## SEO (v15)
- `node scripts/build-seo.mjs` erzeugt statische, indexierbare Seiten `de/` + `en/` (Länder, UNESCO je Land, Städte, Hidden-Gem-/Story-/Bar-Orte, Tagesrouten), `sitemap.xml`, `robots.txt`, `seo.css`. Quelle: `MOMENTS` in index.html + `data/*.json`.
- GitHub Action `seo.yml` baut die Seiten automatisch neu, wenn sich Orte, Routen oder Texte ändern.
- Blog-Artikel entstehen automatisch, sobald in `data/content.json` der "Entwurf"-Marker entfernt ist (Text >= 600 Zeichen).
- Eigene Domain: Datei `CNAME` mit der Domain anlegen (z. B. `hiddengem.atlas`), Generator nutzt sie als Basis-URL. robots.txt wirkt nur auf einer eigenen Domain (auf github.io/HiddenGem.Atlas liegt sie nicht im Host-Root).
- Search Console: Property anlegen, Sitemap `sitemap.xml` einreichen.

## v16 (Okt 2026)
- **GetYourGuide:** Rabattcode `HIDDENGEMATLAS5` (alter Code ersetzt), App-Install-Link `gyg.me/hiddengematlas-app` (2 $ pro Installation, 8 % Provision auf App-Buchungen mit Code) im GYG-Bereich und in jeder GYG-Box der SEO-Seiten. Konstanten oben in `scripts/build-seo.mjs`.
- **GoatCounter** (`hiddengem-atlas`) auch auf den statischen SEO-Seiten.
- **57 neue Fotos** (Pula/Istrien, Gent, Thailand, Mallorca, Luxemburg, Durrës, Marrakesch, Düsseldorf, Lungau) in Ortsgalerien, Blog-Galerien, Stories (neu: „Istrien“) und als Titelbild für Pula, Luxemburg, Albanien. Hero: `krabi-aussicht`, `pula-arena`.
- **Neuer Hidden Gem:** `m-gent-graffiti` (Werregarenstraatje, Gent). Graslei als besucht markiert.
- **SEO-Seiten** zeigen jetzt eigene Fotos (Galerie + og:image) bei Orten und Städten.
- **17 neue Videos** (Krabi-Kajak, Muay Thai Ao Nang, Roller, Affen, Phuket-Schrein, Pula Arena/Verudela/DJ, Lungau Gipfel/Grat/Alm, Karwoche Vilafranca, Qanat, Gent) in Galerien und Stories.
- **Omio:** Box „Anreise mit Bahn & Bus“ (Code xwjmj3nl) auf allen europäischen Städte-, Orts- und Routenseiten; endet automatisch nach 07.04.2027 (`OMIO_UNTIL`).
- **Search Console:** Property `https://noelsprick-alt.github.io/HiddenGem.Atlas/` bestätigt, Sitemap eingereicht (22.10.2026).

## v17 (27.10.2026)
- **Qualitätsregel für neue Hidden Gems** (damit man den Aussagen trauen kann):
  1. **Atlas Obscura** hat den Ort redaktionell ausgewählt (Grundlage der Karte; nur ID + Link, keine Texte übernommen),
  2. mind. **eine weitere unabhängige Quelle** führt ihn (Tripadvisor, Michelin, Routard, Yelp, Wikipedia …) – Wikipedia allein reicht nie,
  3. **Google ab 4,5 Sternen** (mind. 50 Bewertungen, Treffer max. 3 km vom Ort entfernt). Bewertungen werden nur geprüft, nicht gespeichert oder angezeigt.
  - Außerdem raus: Städte/Dörfer, Zoos, Freizeitparks, Hotels, Flughäfen, Einkaufszentren, große Kunst-/Nationalmuseen, Bahnhöfe und sehr berühmte Orte (über 40 Wikipedia-Sprachversionen). Von Hand übersprungen: nicht zugängliche/private Orte, reine Straßen, Mainstream (z. B. Shakespeare and Company, Altneu-Synagoge).
  - Stand 27.10.2026: 623 geprüfte offene Orte (316 Abenteuer, 157 Geschichten, 78 Restaurants & Märkte, 46 Bars & Cafés) + 226 handverlesene.
  - Handverlesene Orte (`data/moments-curated.json`) wurden genauso geprüft; alles unter 4,5 ist rausgeflogen (z. B. U Fleků, Hofbräuhaus, Harry's Bar Venedig, Golden Gai, Café Central Wien).
- **Offene Daten:** `data/moments-open.json` = Orte aus Wikidata (CC0), gekennzeichnet mit ✅ „Mehrfach empfohlen“ und Links „Bekannt aus: Atlas Obscura · Tripadvisor · Wikipedia“. Der Kurztext kommt erst auf Klick live von Wikipedia (CC BY-SA, mit Quelle). Keine eigenen SEO-Seiten.
  - Neu holen: Actions → „Offene Ortsdaten holen“ → `sources` (schreibt `data-src/sources-raw.json`), danach lokal `node scripts/build-open-places.mjs`.
  - Das Skript schreibt `data-src/open-candidates.json` (noch nicht bei Google geprüft, wichtigste zuerst). Geprüfte Orte stehen in `data-src/google-check.json` (`"ok"` / `"no"`) – nur `"ok"` kommt auf die Karte.
  - Koordinaten handverlesener Orte prüft der Workflow mit `geocode` über OpenStreetMap (`data-src/curated-new.json` → `data-src/geocode.json`).
- **Neues Thema** 🍽️ „Besondere Restaurants & Märkte“; 🍸 heißt jetzt „Besondere Bars & Cafés“.
- **Reise-Guides:** alle 31 Beiträge mit „Was das Land ausmacht“, „Ein bisschen Geschichte“, eigenem Erlebnis (nur echte Erlebnisse) und Tipp. Beiträge ohne eigenes Foto haben ein Karten-Cover (`images/blog/`).
- **Spanisch:** `scripts/translate-es.mjs` (läuft im Übersetzungs-Workflow) übersetzt fehlende spanische Texte aus dem Englischen; von Hand geschriebene bleiben unangetastet.
- **Navigation:** 📍 Karte · 📝 Reise-Guides · Reise planen ▾ · Inspiration ▾ · Über HiddenGem ▾ (alte Adressen `#/entdecken` und `#/content` leiten weiter).
- **Foto-Kalender** entfernt (gibt es 2027 nicht).
