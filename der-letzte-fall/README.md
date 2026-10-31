# Der letzte Fall – Der letzte Vorhang

Digitaler Krimi-Escape-Room · 5 Bereiche · 15 Rätsel · 5 Geheimnisse · allein oder bis zu viert.
Verbindliche Grundlage für Geschichte, Zeiten und Lösungen: `RAETSELDESIGN.md`.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Spielseite |
| `js/config.js` | Name, persönliche Nachricht, Spielrahmen (Uhrzeit, Texte, Multiplayer-Slug `der-letzte-fall`) |
| `js/engine.js` | Kopie der Engine von Hotel Nocturne (v22), Texte über `config.js`, neuer Rätseltyp `wall` |
| `js/scenes.js` | Szenen-Grundgerüst und Zeichenhelfer |
| `js/rooms/01–05-*.js` | die fünf Bereiche (Szenen, Dokumente, Rätsel, Finale in `05`) |
| `js/prolog.js` | Fallakte und Ankunft |
| `js/wand.js` | Hagedorns Startwand und die Regeln (Widerlegen, Bestätigen, Beweisführung) |
| `js/wall.js` | Pinnwand im Spiel (Tablet) auf Basis von `platform/board/` |
| `js/mp-adapter.js` | Anbindung an `platform/multiplayer/` |
| `pinnwand.html` | Prototyp der Pinnwand (zum Ausprobieren ohne Spiel) |

Hotel Nocturne bleibt unverändert; Audio-Datei für iOS und Schriften werden von dort mitbenutzt.

## Pinnwand
- Nach Rätsel 2 (Tablet an der Wand) erscheint „Pinnwand“ in der Seitenleiste.
- Jedes Dokument mit `card` kann aus der Akte an die Wand. Nur was an der Wand hängt, ist als Beweis wählbar.
- Hagedorns Fäden lassen sich nicht entfernen, nur widerlegen (rot) oder bestätigen (gelb/blau, freiwillig).
  Das setzt die Zustände `widerlegt_<faden>` / `bestaetigt_<faden>`, die im Team geteilt werden;
  daraus lösen sich „blackout“ (Timo + Mira) und „stoffspur“ (Ruth).
- Die Beweisführung erscheint, sobald Hagedorn befreit ist (Rätsel 14). Richtig → Finale.
- Allein liegt die Wand im Browser, gemeinsam als `board:`-Einträge der Sitzung (letzter Schreiber gewinnt je Objekt).
