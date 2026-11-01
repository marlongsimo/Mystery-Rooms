# DEADLINE.exe – Der letzte Zugriff (Version 2)

Cyber-Mystery-Escape-Room auf einem simulierten Computer. 90–100 Minuten, allein oder bis zu viert, sechs Enden. Der Fall spielt im Oktober 2025: Treffen am Fr 17.10., Spielbeginn Sa 18.10. 00:12.

**Achtung: Diese Datei enthält alle Lösungen.**

## Grundregeln

- **Eingaben:** Passwörter, Codes, Terminalbefehle und die Entscheidung am Ende. Es gibt keine Formulare und keine Beweisabgaben.
- **Aufbau:** Erst ein Einstieg aus drei Rätseln. Danach gibt es **vier Siegel** auf CASE_17, die sich in beliebiger Reihenfolge brechen lassen.
- **Speicherstand:** `deadline_save_v2`. Spielstände aus Version 1 werden nicht übernommen.

## Rätselstruktur

```
EINSTIEG
 START_HERE ─► Papierkorb (4 Übergaben) ─► ARCHIV_01 ─┬─► memo_03 vs. memo_04 (Morse) ─► Chat-Backup
                                                      └─► kalender.ics ────────────────┬──► NORA_PRIVATE
                                                           Chat (Raum geändert) ───────┘
VIER SIEGEL (beliebige Reihenfolge, Stand: status CASE_17)
 1 GERÄT    audit_1410.csv · Register · Intranet ─────────────► trace SEC-01   (gibt „Interne Projekte“ frei)
 2 ZEIT     meetingroom.jpg · Ticket #3311 (Kamera +9 min) ────► zutritt_c01.zip  (Maltes Anhang)
 3 QUELLE   zwei anonyme Mails · Kopfzeilen Date/Received ─────► Sicherheitsbericht SR-0458 (Audit-Portal)
 4 SCHLÜSSEL Trace (mrr.svc) · Interne Projekte ───────────────► decrypt --key MIRROR
             Trace · ereignistypen.txt (filtern, sortieren) ───► verify --seed 7319
 alle vier ─► EVIDENCE_UNLOCKED ─► DEADLINE.exe: Schwärzen + Empfänger (Mails, final_message)
```

## Lösungsweg

**Einstieg**
1. **ARCHIV_01 → 2140**
   - Im Papierkorb liegen vier Übergaben.
   - Gesucht ist Noras letzte erfolgreiche: `uebergabe (wiederhergestellt).tmp` mit 17.10., 21:40, Quelle USB N. WEISS.
   - Fallen: Die Liste zeigt bei dieser Datei das Wiederherstellungsdatum 18.10. `uebergabe_sync.tmp` (22:15) war zwar erfolgreich, stammt aber von Elias' eigener Sicherung.
2. **Chat-Backup → MILO**
   - Es gibt zwei Morse-Aufnahmen.
   - `memo_04.wav` (Audio) ist laut „Quelle“ Elias' Mikrofontest und ergibt `NORA`. Das Backup lehnt das ab mit „Nicht mein Name“.
   - `memo_03.wav` (ARCHIV_01, Anruf N. Weiss) ergibt `-- .. .-.. ---` = MILO, Noras Kater.
3. **NORA_PRIVATE → 1704**
   - Regel im Chat: Tag und Raumnummer des nächsten Treffens.
   - Das Treffen ist Freitag, 17.10. Es wurde laut Chat auf abends verschoben und nach **B-04** verlegt.
   - Der Kalender zeigt noch **B-03**: Elias hat nur die Uhrzeit geändert.

**Vier Siegel** (Erklärung in `pruefung.txt`, erscheint nach NORA_PRIVATE)
1. **GERÄT:** Der Download um 19:14 lief über **SEC-01**, SEC-10 ist eine Falle. → `trace SEC-01`. Danach gibt das Portal die internen Projekte frei.
2. **ZEIT:**
   - `meetingroom.jpg` trägt die Kamerazeit 19:23.
   - Ticket #3311 (Mail vom 06.10., ebenso `system_error.log` und `trace CAM-B01`): Die Kamera geht 9 Minuten vor, die echte Zeit ist also 19:14.
   - Passwort für `zutritt_c01.zip` (Mail von Malte oder Downloads): **1914**.
   - Inhalt: Nora hat das Gebäude um 18:21 verlassen, Kern war von 18:38 bis 19:34 in C-01.
3. **QUELLE:**
   - „Ich habe sie gesehen“ ist auf 14.10. 19:20 datiert, kam laut `Received` aber erst am 15.10. um 07:12 von SEC-01 („geplanter Versand“).
   - Ihre `X-SR-Ref` lautet **SR-0458**. Im Audit-Portal unter Sicherheitsberichte zeigt dieser Vorgang: von VKERN angelegt um 19:02, zwölf Minuten vor dem Export.
   - SR-0449 und SR-0451 sind Nebenvorgänge.
4. **SCHLÜSSEL:**
   - `decrypt CASE_17 --key MIRROR` (mrr.svc → MIRROR, Interne Projekte).
   - `verify CASE_17 --seed 7319`: Es zählen nur Ereignisse unter fremden Konten über mrr.svc, die nicht automatisch sind.
   - VKERN, SYSTEM, HEARTBEAT und TOKEN_RENEW fallen weg. Übrig bleiben 19:12 → 7, 19:14 → 3, 19:15 → 1, 19:22 → 9.

**Finale:** Jana Thiel und Malte Brück schwärzen (aus den Mails), Empfänger Ombudsstelle Albers & Roth.

**Optional:**
- Whiteboard, Sprachmemos, Sommerfest-Foto
- `trace` für alle Geräte aus dem Register
- `plan_b.txt` (ab 60 Minuten) als Rettungsanker

## Hinweise

Jeder offene Schritt hat drei Hinweise und eine Lösung. Die Lösung erscheint erst nach einer Abfrage („Willst du die Lösung wirklich sehen?“). Sind mehrere Siegel offen, wählt man, wofür man Hilfe will. Hinweise kosten keine Zeit.

## Enden

| Ende | Bedingung |
|---|---|
| DIE WAHRHEIT | Ombudsstelle, genau Jana und Malte geschwärzt (Elias egal) |
| DER PREIS | Ombudsstelle, mindestens ein Helfer nicht geschwärzt |
| LEERE AKTE | Ombudsstelle, Viktor oder Nora geschwärzt |
| ZURÜCK AN DEN ABSENDER | Security Review |
| KEINE SPUREN | Vollständig löschen |
| SYSTEMVERLUST | Countdown abgelaufen (nur mit Countdown) |

- **Zurück zur Entscheidung:** Nach jedem Ende außer Systemverlust geht das im Einzelspiel.
- **Gefundene Enden** bleiben über neue Spiele erhalten.
- **Entwurf:** Schwärzungen und Empfänger werden gespeichert.

## Zeit

- **Countdown:** 100 Minuten Spielzeit. Sie läuft, solange das Spiel geöffnet ist, auch im Hintergrund-Tab (gemessen mit der Systemuhr). Bei Pause oder geschlossener Seite steht sie. Ruhezustand zählt nicht.
- **Ereignisse nach Spielzeit:** 30 Minuten (`system_error.log`), 45 (Nachricht), 60 (`TEMP_ACCESS`). Nur mit Countdown: 85 (Warnung) und 95 (rote Fenster).
- **Ton:** In den letzten 15 Minuten wird der Lüfter lauter, in den letzten 5 kommt ein Herzschlag dazu.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Titel, Boot, Desktop, Taskleiste, Startmenü |
| `js/story.js` | Inhalte: Dateien, Mails, Chat, Kalender, Intranet, Audit-Log, Traces, Sicherheitsberichte, Siegel, Bericht, Nachrichten, Ereignisse, Hinweise, Morse, Enden |
| `js/game.js` | Spielstand, Countdown, Ereignisse, Schlösser, Siegel, Terminal-Befehle (`status`, `trace`, `decrypt`, `verify` …), Hinweise, Entscheidung, Multiplayer-Schnittstelle |
| `js/os.js` | Fenster, Symbole, Meldungen, Boot, Pause, Endsequenzen |
| `js/apps.js` | Explorer, Schloss, Editor, Tabelle, Kalender, Mediaplayer, Bildbetrachter, Mail (Kopfzeilen, Anhänge), Messenger, Browser (Intranet, IT-Hilfe, Audit-Portal), Terminal, DEADLINE.exe, Hinweise |
| `js/sound.js` | Geräusche per Web Audio |
| `js/mp-adapter.js` | Anbindung an `platform/multiplayer` |
| `css/deadline.css` | Gestaltung, Handy-Ansicht, weniger Bewegung bei Systemeinstellung |

## Multiplayer

- **Geteilt:** gelöste Schritte und Siegel, Hinweise, Nachrichten, Ereignisse, Laufzeit (die längste zählt) und das Ende.
- **Gemeinsamer Entwurf:** Schwärzungen und Empfänger stehen in einem eigenen Eintrag `draft`. Die letzte Änderung gilt, die Anzeige nennt, wer zuletzt geändert hat.
- **Zeitmodus:** Spielt eine Person im Team ohne Zeitlimit, gilt das für alle. Pause gibt es im Team nicht.

**Voraussetzung:** In Supabase muss `game_catalog` einen Eintrag mit `slug = deadline` haben (`enabled = true`, Code-Präfix z. B. `DEAD`). Ohne diesen Eintrag meldet die Lobby „Dieser Escape Room ist nicht verfügbar“, allein spielen geht immer.
