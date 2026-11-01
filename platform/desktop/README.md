# Desktop-Baustein

Gemeinsame Grundlage für Spiele auf einem simulierten Computer. Genutzt von DEADLINE.exe und dem ARCHON-Protokoll.

| Datei | API | Aufgabe |
|---|---|---|
| `desktop.js` | `MRDesktop.create({ desk, layer, tasks, apps, icon, sound })`, `MRDesktop.toast(container, …)` | Fenster (verschieben, Größe, minimieren, maximieren, schließen), Taskleiste, Doppelklick/Antippen, Neuzeichnen nur bei Änderungen |
| `sound.js` | `MRSound.play(name)`, `morse`, `tone`, `noise`, `fan`, `fanLevel`, `toggle`, `suspend` | Geräusche per Web Audio; Speicherschlüssel über `<html data-sound-key>` |
| `playclock.js` | `MRPlayClock.create({ get, set, onTick, save })` | Spielzeit nach Systemuhr, läuft auch im Hintergrund-Tab, Pause, Ruhezustand zählt nicht |
| `locks.js` | `MRLocks.create({ store, now })` | Sperren bei falschen Lösungen: erster Versuch frei, dann 30/60/90/120 s (oder fest), in Spielzeit |

Die Gestaltung (Fenster, Taskleiste) liefert jedes Spiel in seinem eigenen CSS. Die Klassennamen (`.win`, `.win-bar`, `.task` …) sind gleich.

## Touch (ab Version 2)

`MRDesktop.create()` schaltet einmalig eine Touch-Schicht ein (`installTouch`), die für Finger und Stift gilt (Maus bleibt unverändert):

| Problem | Lösung |
|---|---|
| Safari (iPad) verschluckt Klicks, wenn sich die Seite beim Antippen ändert | Klick wird beim Loslassen selbst ausgelöst; ein Fenster, das schon vorn ist, wird nicht erneut „nach vorn geholt“; Taskleiste wird nur bei Änderung neu gezeichnet |
| Browser schickt danach noch einen eigenen Klick | wird 800 ms lang verworfen (kein doppeltes Umschalten) |
| Wischen/Scrollen | Bewegung > 12 px, Scrollen oder Abbruch: kein Tipp |
| Tastatur geht nicht auf | Textfelder bekommen den Fokus beim Antippen selbst |
| Windows-Touch: langes Drücken = Rechtsklick | kein Kontextmenü außer in Eingabefeldern |
| Desktop-Symbole auf Touch-Laptops (Maus als Hauptzeiger) | ein Tipp öffnet |
| Listen springen nach oben | `render(w)` stellt Scrollpositionen wieder her |
| Auswahllisten (`select`) | bleiben beim Browser |

Größere Ziele (`@media (pointer: coarse)`) und `touch-action: manipulation` stehen im CSS des jeweiligen Spiels.
