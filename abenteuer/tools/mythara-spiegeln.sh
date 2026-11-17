#!/usr/bin/env bash
# Mythara – Spiegel für die eigene Adresse (mythara-dungeon.de).
# Kopiert die Dateien, die das Spiel im Browser braucht, aus abenteuer/ in ein zweites Repository (marlongsimo/Mythara),
# das GitHub Pages unter der eigenen Domain ausliefert. Entwickelt wird weiter hier; der Spiegel wird nie von Hand geändert.
# Aufruf: bash abenteuer/tools/mythara-spiegeln.sh /pfad/zum/mythara-klon     (danach dort committen und pushen)
set -euo pipefail
QUELLE="$(cd "$(dirname "$0")/.." && pwd)"; ZIEL="${1:?Zielordner (Klon von marlongsimo/Mythara) fehlt}"
DOMAIN="mythara-dungeon.de"
[ -d "$ZIEL/.git" ] || { echo "Kein Git-Klon: $ZIEL" >&2; exit 1; }
# Alles außer .git im Ziel ersetzen (gelöschte Dateien verschwinden so auch im Spiegel)
find "$ZIEL" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
for d in css daten fonts img js ton vendor; do cp -r "$QUELLE/$d" "$ZIEL/$d"; done
cp "$QUELLE"/index.html "$QUELLE"/handy.html "$QUELLE"/intro.html "$QUELLE"/manifest.webmanifest "$QUELLE"/sw.js "$QUELLE"/verbindung.js "$ZIEL/"
# Unter der eigenen Adresse liegt das Spiel im Wurzelverzeichnis
sed -i "s|https://case-unlocked.de/abenteuer/|https://$DOMAIN/|g" "$ZIEL"/*.html
sed -i "s# | Case Unlocked</title>#</title>#; s# | Case Unlocked\"#\"#g" "$ZIEL"/*.html   # Seitentitel ohne den Zusatz
printf '%s\n' "$DOMAIN" > "$ZIEL/CNAME"; : > "$ZIEL/.nojekyll"
printf 'User-agent: *\nAllow: /\n' > "$ZIEL/robots.txt"
printf '# Mythara\n\nAusgelieferte Fassung des Spiels unter https://%s – wird automatisch aus dem Entwicklungs-Repository gespiegelt.\nBitte hier nichts von Hand ändern; Änderungen gehen beim nächsten Spiegeln verloren.\n' "$DOMAIN" > "$ZIEL/README.md"
if grep -rn '\.\./' "$ZIEL"/*.html; then echo "Achtung: Verweis nach außerhalb des Spielordners gefunden." >&2; exit 1; fi
echo "gespiegelt nach $ZIEL: $(du -sh --exclude=.git "$ZIEL" | cut -f1)"
