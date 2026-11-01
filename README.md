# Mystery Rooms

Digitale Escape Rooms für den Browser – kostenlos, ohne Anmeldung, direkt spielbar. Rein statisch (GitHub Pages); gemeinsames Spielen läuft über Supabase.

**Live:** https://marlongsimo.github.io/Mystery-Rooms/

## Spiele

Jedes Spiel hat ein eigenes Spielprinzip.

| Spiel | Prinzip | Status | Ordner |
|---|---|---|---|
| **Hotel Nocturne** – Die letzte Nacht | Räume erkunden, Gegenstände sammeln und kombinieren (7 Räume, 21 Rätsel) | spielbar, allein oder bis zu viert | [`hotel-nocturne/`](hotel-nocturne/) |
| **Der letzte Fall** – Der letzte Vorhang | Beweise sammeln, Aussagen prüfen, Fragen mit Belegen beantworten | Vorschau – siehe unten | [`der-letzte-fall/`](der-letzte-fall/) |
| **DEADLINE.exe** – Der letzte Zugriff | Ermitteln auf einem simulierten Computer: vier parallele Stränge, Terminal, sechs Enden | Vorschau, allein vollständig spielbar | [`deadline/`](deadline/) |
| Das Geheimnis der Pyramide | – | geplant | – |
| Projekt Schattenlabor | – | geplant | – |

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
| `hotel-nocturne/`, `der-letzte-fall/`, `deadline/` | je ein Spiel mit eigener README (Aufbau, Lösungen) |

**Neues Spiel eintragen:** Eintrag in `portal/games.js`. Für gemeinsames Spielen zusätzlich ein Eintrag in der Supabase-Tabelle `game_catalog` (`slug`, Titel, Code-Präfix, `enabled = true`).

## Gemeinsames Spielen

| Spiel | `game_catalog` | Getestet über die echte Datenbank |
|---|---|---|
| Hotel Nocturne | vorhanden | ja (31.10.2026) |
| Der letzte Fall | vorhanden | ja, Version 1 und Version 2 |
| DEADLINE.exe | vorhanden | ja (01.11.2026: zwei Spieler, alle Siegel, gemeinsamer Entwurf, Ende) |

## Bewertungen

Tabelle `game_ratings` ist angelegt (`platform/rating/setup.sql`). Besucher können nur eintragen; Auswertung im Supabase-Dashboard.

## Noch offen

- Tests auf echten Geräten (iOS Safari, Android)
- Der letzte Fall, Version 2: Kapitel 4 und 5
