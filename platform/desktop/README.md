# Desktop-Baustein

Gemeinsame Grundlage für Spiele auf einem simulierten Computer. Genutzt von DEADLINE.exe und dem ARCHON-Protokoll.

| Datei | API | Aufgabe |
|---|---|---|
| `desktop.js` | `MRDesktop.create({ desk, layer, tasks, apps, icon, sound })`, `MRDesktop.toast(container, …)` | Fenster (verschieben, Größe, minimieren, maximieren, schließen), Taskleiste, Doppelklick/Antippen, Neuzeichnen nur bei Änderungen |
| `sound.js` | `MRSound.play(name)`, `morse`, `tone`, `noise`, `fan`, `fanLevel`, `toggle`, `suspend` | Geräusche per Web Audio; Speicherschlüssel über `<html data-sound-key>` |
| `playclock.js` | `MRPlayClock.create({ get, set, onTick, save })` | Spielzeit nach Systemuhr, läuft auch im Hintergrund-Tab, Pause, Ruhezustand zählt nicht |
| `locks.js` | `MRLocks.create({ store, now })` | Sperren bei falschen Lösungen: erster Versuch frei, dann 30/60/90/120 s (oder fest), in Spielzeit |

Die Gestaltung (Fenster, Taskleiste) liefert jedes Spiel in seinem eigenen CSS. Die Klassennamen (`.win`, `.win-bar`, `.task` …) sind gleich.
