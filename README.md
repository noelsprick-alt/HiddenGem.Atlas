# HiddenGem.Atlas

Website + automatischer Trend-Radar. Kein Server, keine Datenbank.

## Dateien
- `index.html` — komplette Website
- `data/trends.json` — täglich automatisch aktualisiert
- `scripts/fetch-trends.mjs` — RSS-Fetcher
- `.github/workflows/trends.yml` — läuft täglich 07:00

## Live schalten
1. Repository auf GitHub, Public
2. Settings → Pages → Deploy from branch: main / root
3. Settings → Actions → General → Workflow permissions: Read and write
4. Actions → Trend-Radar → Run workflow
