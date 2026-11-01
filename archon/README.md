# Das ARCHON-Protokoll

Schwerer Desktop-Thriller (Extreme Edition): 120 Minuten Spielzeit, allein, am besten am Computer oder Tablet im Querformat. Am Handy spielbar, mit Hinweis, dass ein größerer Bildschirm (oder AirPlay/Spiegeln auf den Fernseher) besser ist.

**Achtung: Die Lösungen stehen in `DESIGN.md`.**

- **Spielen:** `archon/index.html`
- **Design:** [`DESIGN.md`](DESIGN.md), Version 1.2. Abweichungen in der Umsetzung stehen unten.
- **Prüfskript:** `node archon/tools/check.js` prüft Buchungen, Route, Rechnungen, Hierarchie, Protokoll, Enden und die Wissensdatenbank (Abdeckung, keine Lösungen).
- **Buchungen neu erzeugen:** `python3 archon/tools/gen_ledger.py && python3 archon/tools/gen_data.py` (schreibt `js/ledger.js` und `tools/ledger.json`).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Titel (mit Handy-Hinweis), Verbindungsaufbau, Desktop mit Kopfleiste (Kapitel, Sicherheitslevel, TRACE, Pause), Ende |
| `js/data.js` | 8 Firmen mit Register- und IBAN-Daten, Stiftung Kestrel, 6 Rechnungen, 5 Frachtpapiere, Embargoliste, AIS-Liste |
| `js/ledger.js` | 84 Buchungen (erzeugt) |
| `media/` | Intro-Video (`intro.mp4`, 10 s, H.264) und ARCHON-Logo (`archon_logo.jpg`, Standbild aus dem Video) |
| `audio/` | Echte Aufnahmen (MP3, mono, Lautheit angeglichen). Einträge in `AR.audio` mit `src` (bei Ida zusätzlich `srcRev`) werden abgespielt; Einträge ohne `src` zeigen nur das Transkript. Vorhanden: Anruf, Ida, Diktat, F1–F3 (Geräusche: Quellen in `audio/QUELLEN.md`). Optional fehlt noch `atmo_desktop`. |
| `js/story.js` | Haupt- und Nebenrätsel, Hinweise, Dateisystem, 24 Mails, interne Nachrichten, Kalender, Notizbuch, Audio, Enden |
| `js/wiki.js` | NORDSUCHE: 46 Wissensartikel mit Synonymen und Mini-Rechnern |
| `js/game.js` | Spielstand `archon_save_v1`, Kapitel, Rätselprüfung, Sperren, Sicherheitslevel, Terminal, Beweistiefe, Wertung, Enden |
| `js/apps.js` | Login, Explorer, Schloss, Texte/Rechnungen/Frachtpapiere, Bilder, Mail (Kopfzeilen, Anhänge), Nachrichten, Mediaplayer (Spektrogramm, rückwärts), Kalender, Notizbuch, Systemlog, Terminal, Browser (NORDSUCHE, Register, Hafen, Hafenbank), LEDGER (Filter, Sortierung, Netzwerk), Akte, Hinweise, Überwachungsfenster, Masterprotokoll, Entscheidung |
| `js/os.js` | Desktop, Symbole, Kopfleiste, Ereignisse, Atmosphäre, Ende mit Auswertung und Bewertung |
| `css/archon.css` | Gestaltung |
| `tools/` | Generator und Prüfskript |

Gemeinsame Bausteine: `platform/desktop` (Fenster, Ton, Spielzeit-Uhr, Sperren), `platform/board` (Netzwerk und Akte-Pinnwand), `platform/rating` (Bewertung).

## Abweichungen vom Design 1.2

| Design | Umsetzung | Grund |
|---|---|---|
| R5: „Markieren“-Klick im Spektrogramm | Feld „Auffälligkeit eintragen“, Wort VELLUM eintippen (mit Sperre) | Ein Klick hätte das Lesen nicht geprüft |
| R10: RE-NOR / RE-LUX / RE-SAR mit Fehlern beim Aussteller | Fehler liegen teils beim Empfänger (falsche Anschrift von Nordkap, falsche USt-ID von Luxor, alter Name Sarnia Maritime) | Jede Rechnung braucht eine echte Buchung. Jede hat weiterhin genau einen Fehler (vom Prüfskript kontrolliert). |
| Ermittlungsakte als Seitenleiste rechts | eigenes Fenster „Akte“ | Mehr Platz für die Pinnwand |
| Strukturierte Zahlungen „ab 06.10.“ | 03.10. (TX-1015, Feiertag) bis 26.10.; das Geld vom 03.10. wird erst am 13./15.10. weitergeleitet, der erste *vollständige* Durchlauf bleibt TX-1017 → 1019 → 1022 → 1031 | Konsistenz mit TX-1015 als Teil der neun Zahlungen |
| N3 „Kalender: drei Termine H.“ | verschlüsselte Notiz `notiz_H.enc`, Kennwort DONNERSTAG (Wochentag der H.-Termine) | braucht eine Eingabe, damit es ein Rätsel ist |

## Tests (Playwright, 01.11.2026)

- **Durchlauf A:** alle 15 Haupt- und 12 Nebenrätsel über die Oberfläche bis zum Ende A1 (Index 96, THE ARCHON), keine Fehler.
- **Durchlauf B:** ohne Nebenrätsel bis Ende B2.
- **Mechanik:**
  - Sperre steigt (frei, dann 30 s) und läuft in Spielzeit ab.
  - Pause hält Zeit und Sperre an.
  - Neuladen behält Stand und Zeit.
  - Hinweise werden gezählt.
  - Zeitablauf führt zu SYSTEM FAILURE.
- **Weitere Prüfungen:**
  - Handy zeigt den Hinweis statt des Spiels.
  - Fehlertolerante Suche („embrago“ findet Embargo).
- **Noch offen:** echte Testspieler (DESIGN Kap. 12.3) und echte Browser (Safari, Firefox).
