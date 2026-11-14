# Case Unlocked

Digitale Escape Rooms für den Browser – kostenlos, ohne Anmeldung, direkt spielbar. Rein statisch (GitHub Pages); gemeinsames Spielen läuft über Supabase.

**Live:** https://case-unlocked.de/ (GitHub Pages, eigene Domain über die Datei `CNAME`)

## Spiele

Jedes Spiel hat ein eigenes Spielprinzip.

| Spiel | Prinzip | Status | Ordner |
|---|---|---|---|
| **Hotel Nocturne** – Die letzte Nacht | Räume erkunden, Gegenstände sammeln und kombinieren (7 Räume, 21 Rätsel) | spielbar, allein oder bis zu viert | [`hotel-nocturne/`](hotel-nocturne/) |
| **Der letzte Fall** – Der letzte Vorhang | Beweise sammeln, Aussagen prüfen, Fragen mit Belegen beantworten | Vorschau – siehe unten | [`der-letzte-fall/`](der-letzte-fall/) |
| **DEADLINE.exe** – Der letzte Zugriff | Ermitteln auf einem simulierten Computer: vier parallele Stränge, Terminal, sechs Enden | Vorschau, allein vollständig spielbar | [`deadline/`](deadline/) |
| **Das ARCHON-Protokoll** – 120 Minuten. Eine Chance. | Schwerer Desktop-Thriller: Finanzermittlung, Register, Audio, Terminal; Wissensdatenbank im Spiel | Vorschau, allein, am besten Computer/Tablet (Handy geht mit Hinweis) | [`archon/`](archon/) |
| **SEKTOR 9** – Das letzte Protokoll | Kooperative Ermittlung in 3D: fünf Hallen mit Standpunkten, ECHO als Gegenspieler, Abschaltung zu zweit, Abstimmung, drei Enden | spielbar, allein oder bis zu viert | [`sektor-9/`](sektor-9/) |
| **Krimidinner** (vier Fälle) | Rollenspiel am Tisch mit Spielleitung, Beweisrunden und Anklage; Rollen per Code, Runden per Losungswort, Druckversion | Vorschau, im Katalog · noch nicht am Tisch getestet – siehe unten | [`krimidinner/`](krimidinner/) |
| Das Geheimnis der Pyramide | – | geplant | – |
| Projekt Schattenlabor | – | geplant | – |

### Krimidinner: vier Fälle auf einer Engine

| Fall | Schauplatz | Personen | Dauer | Ordner |
|---|---|---|---|---|
| 01 · **Der letzte Gast** | Sternwarte Eichenfels, heute | 4–10 | 2–2½ Std. | [`krimidinner/eichenfels/`](krimidinner/eichenfels/) |
| 02 · **Abfahrt ins Dunkel** | Silberkamm-Express, 1929 | 6–8 | 3–3½ Std. | [`krimidinner/silberkamm/`](krimidinner/silberkamm/) |
| 03 · **Vorhang aus Lügen** | Palais Mirage, 1958 | 6–10 | 3 Std. | [`krimidinner/mirage/`](krimidinner/mirage/) |
| 04 · **Nebenan – Der stille Kreis** | Haus am Anger, 2004 | 5–10 | 3–3½ Std. | [`krimidinner/nebenan/`](krimidinner/nebenan/) |

Texte (`.md`) und `fall.json` sind die Quelle, `python3 krimidinner/engine/build_case.py <fall>` erzeugt daraus `js/content.js` und prüft den Fall vorher (`krimidinner/tools/check_case.py`). Aufbau und Norm: [`krimidinner/ENGINE.md`](krimidinner/ENGINE.md). Vorlage für Testabende: [`krimidinner/TESTPROTOKOLL.md`](krimidinner/TESTPROTOKOLL.md).

### Der letzte Fall: zwei Versionen

| Version | Datei | Stand |
|---|---|---|
| Version 1 | `der-letzte-fall/index.html` | alle fünf Bereiche spielbar, Zahlenschlösser und Pinnwand. **Im Katalog verlinkt.** |
| Version 2 (Ermittlung) | `der-letzte-fall/ermittlung.html` | Ermittlungs-Tablet mit Fragen und Belegen, Kapitel 1–3. Ersetzt Version 1, sobald Kapitel 4 und 5 fertig sind. |

## Aufbau

| Ordner | Inhalt |
|---|---|
| `index.html`, `portal/` | Startseite: Katalog (`portal/games.js`), Welten, Detailansicht, FAQ |
| `platform/multiplayer/` | Gemeinsames Spielen für alle Spiele (Supabase, nur Publishable Key) – siehe [README](platform/multiplayer/README.md) |
| `platform/board/` | Pinnwand-Baustein (Karten, Fäden, gemeinsam bearbeitbar) |
| `platform/desktop/` | Desktop-Baustein für Computer-Spiele (Fenster, Ton, Spielzeit, Sperren) |
| `platform/rating/` | Bewertungen nach dem Spiel (Supabase, nur Eintragen) |
| `hotel-nocturne/`, `der-letzte-fall/`, `deadline/` | je ein Spiel mit eigener README (Aufbau, Lösungen) |

**Neues Spiel eintragen:** Eintrag in `portal/games.js`. Für gemeinsames Spielen zusätzlich ein Eintrag in der Supabase-Tabelle `game_catalog` (`slug`, Titel, Code-Präfix, `enabled = true`).

## Gemeinsames Spielen

| Spiel | `game_catalog` | Getestet über die echte Datenbank |
|---|---|---|
| Hotel Nocturne | vorhanden | ja (31.10.2026) |
| Der letzte Fall | vorhanden | ja, Version 1 und Version 2 |
| DEADLINE.exe | vorhanden | ja (01.11.2026: zwei Spieler, alle Siegel, gemeinsamer Entwurf, Ende) |
| SEKTOR 9 | vorhanden (`ECHO-XXXXXX`) | ja (07.11.2026: zwei Spieler – gemeinsamer Stand, Positionen, Team-Archiv, Funk, Neuladen, Verlassen; Nowaks Abschaltung zu zweit) |

## Bewertungen

Tabelle `game_ratings` ist angelegt (`platform/rating/setup.sql`). Besucher können nur eintragen; Auswertung im Supabase-Dashboard.

## Noch offen

- Tests auf echten Geräten (iOS Safari, Android)
- Der letzte Fall, Version 2: Kapitel 4 und 5
- Krimidinner: Testabende je Fall mit kleinster, mittlerer und größter Besetzung (Protokoll nach `krimidinner/TESTPROTOKOLL.md`)
