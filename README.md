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
- `index.html` - die komplette Website (alle Unterseiten, DE/EN)
- `fonts/` - Schriften (lokal, DSGVO)
- `data/content.json` - deine Änderungen aus dem Editor
- `data/trends.json` - automatisch gepflegte Trends
- `data/moments-extra.json` - zusätzliche Karten-Orte in Masse (siehe unten)
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
