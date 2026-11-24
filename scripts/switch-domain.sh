#!/usr/bin/env bash
# Stellt die Website von der GitHub-Adresse auf die eigene Domain um (Standard: hiddengematlas.com).
# Erst ausführen, wenn bei INWX die DNS-Einträge stehen und GitHub Pages die Domain akzeptiert hat.
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1:-hiddengematlas.com}"
OLDHOST="noelsprick-alt.github.io"
OLDPATH="${OLDHOST}/HiddenGem.Atlas"
echo "$NEW" > CNAME
grep -rlI --exclude-dir=.git --exclude-dir=node_modules --exclude=switch-domain.sh "$OLDHOST" . | while read -r f; do
  sed -i -e "s#https://${OLDPATH}/#https://${NEW}/#g" \
         -e "s#https://${OLDPATH}#https://${NEW}#g" \
         -e "s#${OLDPATH}#${NEW}#g" \
         -e "s#'${OLDHOST}'#'${NEW}'#g" "$f"
done
node scripts/build-seo.mjs
python3 tools/pins/make_pins.py >/dev/null
echo "Rest-Treffer alte Adresse (sollte leer sein):"
grep -rIl --exclude-dir=.git --exclude=switch-domain.sh "$OLDHOST" . || true
