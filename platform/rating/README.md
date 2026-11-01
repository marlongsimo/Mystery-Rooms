# Bewertungen nach Spielabschluss

- `rating.js` / `rating.css`: Baustein mit 1–5 Sternen, optionalem Kommentar (max. 500 Zeichen) und „Danke“-Zustand. Pro Gerät und Spiel wird einmal bewertet (`localStorage`).
- Eingebunden auf den Endbildschirmen von Hotel Nocturne, Der letzte Fall (beide Versionen) und DEADLINE.exe (mit erreichtem Ende).
- Gesendet wird per REST an die Tabelle `game_ratings`, nur mit dem Publishable Key aus `platform/multiplayer/mp-config.js`.

## Freischalten

`setup.sql` einmal im Supabase-Dashboard ausführen (SQL Editor → einfügen → Run). Die Datei:
- legt die Tabelle an,
- erlaubt Besuchern **nur das Eintragen** (kein Lesen, Ändern oder Löschen),
- begrenzt Einträge auf 30 pro Minute,
- enthält zwei Abfragen zur Auswertung,
- stellt mit `game_rating_summary()` nur Schnitt und Anzahl je Spiel öffentlich bereit (Startseite zeigt sie ab 3 Bewertungen).

Bis dahin zeigt der Baustein nach dem Absenden „Das hat leider nicht geklappt“. Die Spiele selbst laufen normal.

Neues Spiel: dessen `slug` in der `check`-Bedingung von `game_slug` ergänzen (`alter table … drop constraint … / add constraint …`).
