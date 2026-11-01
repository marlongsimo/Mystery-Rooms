# DEADLINE.exe – Der letzte Zugriff

Cyber-Mystery-Escape-Room auf einem simulierten Computer. 60–90 Minuten, allein oder bis zu viert, sechs Enden. Der Fall spielt im Oktober 2025 (Fr 17.10. Treffen, Sa 18.10. 00:12 Spielbeginn).

**Achtung: Diese Datei enthält alle Lösungen.**

## Was gegenüber dem ursprünglichen Konzept geändert ist

| Konzept | Umsetzung | Warum |
|---|---|---|
| Gerät `KRN-01` | `SEC-01` (dazu `SEC-02` als falsche Fährte) | „KRN“ = Kern hätte den Täter verraten. Jetzt führt der Weg über Register → „Leitung IT-Sicherheit“ → Mitarbeiterverzeichnis. |
| Code `KRN01` im Audit-Portal | **Widerspruch #4471** mit Gerät, zuständiger Person und Belegen aus dem Log | Echte Schlussfolgerung statt Code. Falsche Antworten bekommen eigene Rückmeldungen. |
| `access_note.txt` verrät die Lösung | entfällt | |
| `MIRROR` aus vier Beschreibungen raten | Der Trace zeigt `PROC=mrr.svc`, das Portal ordnet Dienste Projekten zu | Verbinden statt ablesen. |
| Prüfziffern in Reihenfolge ablesen | Trace ist nach Konto gruppiert, enthält auch Viktors eigene Ereignisse. Nur die fremden Konten zählen, nach Uhrzeit sortiert | Man muss filtern und sortieren. |
| Ein Kalendereintrag | Mehrere Treffen mit Nora; das *nächste nach dem Chat (16.10.)* zählt | |
| Moralische Wahl „sichern oder löschen“ | Bericht **schwärzen** (zwei Helfer schützen, Täter und Nora drinlassen) und **Empfänger** wählen (Security Review leitet Viktor) | Die Entscheidung prüft, ob man den Fall verstanden hat. |
| UNBEKANNT schreibt einmal | Neun vorbereitete Nachrichten, ausgelöst durch Aktionen; Hinweis in `autoresp.cfg` im Papierkorb; nach der Verifizierung zeigt der Messenger „geplant · Regel #n“, `cat autoresp.log` listet alle Regeln | Die Wendung braucht Vorbereitung. |
| Harter 90-Minuten-Countdown | Wählbar: mit Countdown oder ohne Zeitlimit. Die Frist ist **Spielzeit**: Sie läuft, solange das Spiel geöffnet ist (auch im Hintergrund-Tab, gemessen mit der Systemuhr), und steht bei Pause oder geschlossener Seite. Letzte 15 Minuten: Lüfter läuft hoch, letzte 5: Herzschlag. | Wer abends unterbricht, soll nicht automatisch verlieren. |
| Ereignisse nach Restzeit | nach Spielzeit 30/45/60/75/85 Minuten; die letzten beiden nur mit Countdown | |

## Lösungsweg

1. **ARCHIV_01** (Dokumente): Papierkorb → `uebergabe.tmp` ist die letzte *erfolgreiche* Übergabe (17.10., 21:40) → **2140**.
2. **Chat-Backup** (Messenger): `memo_03.wav` in ARCHIV_01 ist Morse `-- .. .-.. ---`, Tabelle im Browser unter IT-Hilfe → **MILO** (Noras Kater).
3. **NORA_PRIVATE** (Dokumente): Chat: „mit unserem nächsten Treffen, Tag und Raumnummer“. Das nächste Treffen nach dem 16.10. laut Kalender: Fr 17.10., Raum B-04 → **1704**.
4. **Widerspruch #4471** (Browser → Audit-Portal):
   - Gerät **SEC-01** (Download 19:14 in `audit_1410.csv`)
   - zuständig: **Viktor Kern** (Register: Leitung IT-Sicherheit → Intranet/Mitarbeiter)
   - Belege **18:17** (Nora abgemeldet) und **19:14** (Download über SEC-01). 19:15 und 19:06 sind erlaubt, 18:11 ist falsch.
   - Der Entwurf lässt sich erst ausfüllen, wenn `audit_1410.csv` geöffnet wurde.
   - Danach: Interne Projekte frei, `pruefung.txt` in Dokumente.
5. **Terminal:** `trace SEC-01`
6. `decrypt CASE_17 --key MIRROR` (mrr.svc → MIRROR)
7. `verify CASE_17 --seed 7319` (fremde Konten nach Zeit: 19:12 → 7, 19:14 → 3, 19:15 → 1, 19:22 → 9). Danach EVIDENCE_UNLOCKED auf dem Desktop.
8. **DEADLINE.exe:** Jana Thiel und Malte Brück schwärzen (Mails), Empfänger Ombudsstelle Albers & Roth.

Optional: `meetingroom.jpg` (zoomen: SEC-01 und Ausweis V. KERN in der Scheibe), Kopfzeilen der anonymen Mail (`X-Originating-Device: SEC-01`), `whiteboard.jpg`, Sprachmemos.

## Rätselstruktur

```
START_HERE ─► Papierkorb ─► ARCHIV_01 ─┬─► memo_03 (Morse) ─► Chat-Backup ─┐
                                      └─► kalender.ics ──────────────────┴─► NORA_PRIVATE
                                                                                │ audit_1410.csv, Register
 Mail (Kopfzeilen: SEC-01) ─► Terminal: trace SEC-01 ─┐                          ▼
 Intranet: Mitarbeiter ───────────────────────────────┴──────────────► Widerspruch #4471
                                                                                │
                                         Interne Projekte (mrr.svc = MIRROR) ◄──┘
 trace SEC-01 (Prüfziffern) ─► decrypt CASE_17 --key MIRROR ─► verify --seed 7319 ─► DEADLINE.exe
 Mails (Jana, Malte, Ombudsstelle, Viktors Signatur) ──────────────────────────────►  (Schwärzen + Empfänger)
```

- **Pflichtkette:** 1 → 2 → 3 → 4 → 5/6 → 7 → 8. Die ersten drei Schritte sind linear (Einstieg), danach laufen Stränge zusammen.
- **Paralleler Strang:** Wer die Kopfzeilen der anonymen Mail liest (`X-Originating-Device: SEC-01`), kann das Gerät schon vor Noras Ordner im Terminal verfolgen. Der Trace nennt „Leitung IT-Sicherheit“, das Intranet nennt Viktor. Der Widerspruch braucht trotzdem den Audit-Auszug aus NORA_PRIVATE.
- **Geschlossene Abkürzungen (Überarbeitung):**
  - Das Chat-Passwort war `NORA` und ließ sich raten. Jetzt `MILO`.
  - Das Whiteboard verriet `MIRROR`. Jetzt steht dort „Wer darf spiegeln?“.
  - Der Widerspruch ließ sich ohne Noras Ordner ausfüllen, weil das Formular selbst die Log-Zeilen zeigte. Jetzt erst nach `audit_1410.csv`.
- **Optionale Belege:** `meetingroom.jpg` (Zoom), Mail-Kopfzeilen, `whiteboard.jpg`, Sprachmemos, `system_error.log` (ab 30 Minuten), `plan_b.txt` (ab 60 Minuten) als Rettungsanker.

## Enden

| Ende | Bedingung |
|---|---|
| DIE WAHRHEIT | Ombudsstelle, genau Jana und Malte geschwärzt (Elias egal) |
| DER PREIS | Ombudsstelle, mindestens ein Helfer nicht geschwärzt |
| LEERE AKTE | Ombudsstelle, Viktor oder Nora geschwärzt |
| ZURÜCK AN DEN ABSENDER | Security Review |
| KEINE SPUREN | Vollständig löschen |
| SYSTEMVERLUST | Countdown abgelaufen (nur mit Countdown) |

Nach jedem Ende außer Systemverlust kann man im Einzelspiel zur Entscheidung zurück. Gefundene Enden bleiben über neue Spiele erhalten. Schwärzungen und Empfänger werden als Entwurf gespeichert und überstehen ein Neuladen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Titel, Boot, Desktop, Taskleiste, Startmenü |
| `js/story.js` | Alle Inhalte: Dateisystem, Mails, Chat, Kalender, Intranet, Audit-Log, Traces, Bericht, Nachrichten, Ereignisse, Hinweise, Enden |
| `js/game.js` | Spielstand (`deadline_save_v1`), Countdown, Ereignisse, Schlösser, Widerspruch, Terminal-Befehle, Hinweise, Entscheidung, Multiplayer-Schnittstelle |
| `js/os.js` | Fenster (verschieben, Größe, minimieren, maximieren), Symbole, Meldungen, Boot, Pause, Endsequenzen |
| `js/apps.js` | Explorer, Schloss, Editor, Tabelle, Kalender, Mediaplayer (Morse sichtbar und hörbar), Bildbetrachter (Zoom, Details), Mail, Messenger, Browser, Terminal, DEADLINE.exe, Hinweise |
| `js/sound.js` | Alle Geräusche per Web Audio (keine Audiodateien) |
| `js/mp-adapter.js` | Anbindung an `platform/multiplayer` |
| `css/deadline.css` | Gestaltung, Handy-Ansicht (Apps im Vollbild), weniger Bewegung bei entsprechender Systemeinstellung |

## Multiplayer

- **Geteilt:** gelöste Schritte, Hinweise, Nachrichten, Ereignisse, Laufzeit (die längste zählt) und das Ende.
- **Gemeinsamer Entwurf:** Schwärzungen und Empfänger stehen in einem eigenen Eintrag `draft`. Alle sehen denselben Entwurf; die letzte Änderung gilt, die Anzeige nennt, wer zuletzt geändert hat. Jede Person kann nach Bestätigung senden; ändert jemand den Entwurf, während die Bestätigung offen ist, wird sie neu angezeigt.
- **Nicht geteilt:** Fenster und Eingaben bleiben bei jeder Person.
- **Pause:** gibt es im Multiplayer nicht.
- **Zeitmodus:** Spielt eine Person im Team ohne Zeitlimit, gilt das für alle.

**Voraussetzung:** In Supabase muss `game_catalog` einen Eintrag mit `slug = deadline` haben (`enabled = true`, Code-Präfix z. B. `DEAD`). Ohne diesen Eintrag meldet die Lobby „Dieser Escape Room ist nicht verfügbar“, allein spielen geht immer.
