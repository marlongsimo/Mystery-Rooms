#!/usr/bin/env bash
# Hotel Nocturne – 3D-Tests gezielt starten (nacheinander, nie parallel: Software-Rendering ist langsam).
#   tests/run-3d.sh archiv          → nur die Tests dieses Raums (Bedienung + Rundgang)
#   tests/run-3d.sh kern            → nach Änderungen an core.js / interact.js / engine.js: Rezeption-Bedienung + Rundgänge
#   tests/run-3d.sh alle            → Gesamtlauf (lange; z. B. vor einer Veröffentlichung)
#   SHOTS=1 tests/run-3d.sh …       → zusätzlich Bildschirmfotos (im temporären Ordner)
# Aufruf aus hotel-nocturne/. Startet bei Bedarf den lokalen Server auf Port 8765.
cd "$(dirname "$0")/.." || exit 1
curl -s -o /dev/null localhost:8765 || (cd .. && python3 -m http.server 8765 >/dev/null 2>&1 &) ; sleep 1
declare -A T=(
  [rezeption]="3d-interaktion 3d-rezeption"
  [zimmer217]="3d-interaktion-217 3d-zimmer217"
  [gepaecklager]="3d-interaktion-gl 3d-gepaecklager"
  [archiv]="3d-interaktion-archiv 3d-archiv"
  [ueberwachung]="3d-interaktion-ue 3d-ueberwachung"
  [keller]="3d-interaktion-keller 3d-keller"
  [buero]="3d-buero"
  [kern]="3d-interaktion 3d-rezeption 3d-gepaecklager 3d-archiv 3d-ueberwachung"
)
if [ "$1" = alle ]; then list="${T[rezeption]} ${T[zimmer217]} ${T[gepaecklager]} ${T[archiv]} ${T[ueberwachung]} ${T[keller]} ${T[buero]}"; else list="${T[$1]}"; fi
[ -z "$list" ] && { echo "Raum unbekannt: $1 (rezeption, zimmer217, gepaecklager, archiv, ueberwachung, keller, buero, kern, alle)"; exit 2; }
fail=0
for t in $list; do
  log="$(mktemp)"; timeout 2400 node "tests/$t.test.js" >"$log" 2>&1; code=$?
  echo "== $t (Exit $code) · ✓ $(grep -c '  ✓' "$log")"; grep -E "✗|Error|FEHLER|in Ordnung|no errors|Hotspots im|≠" "$log" | head -15
  [ $code -ne 0 ] && fail=1
done
exit $fail
