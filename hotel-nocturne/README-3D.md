# Hotel Nocturne – 3D-Testmodus

**Seite:** `hotel-nocturne/3d.html` – auf der Startseite des Spiels als „Einchecken (Testmodus 3D)“ verlinkt, nicht im Katalog.

Stand: Prototyp **Rezeption** als 360°-Raum. Alle anderen Räume laufen auf derselben Seite in der gewohnten 2D-Ansicht weiter – das Spiel bleibt komplett durchspielbar.

## Grundsätze

1. **Die Engine bleibt die einzige Wahrheit.** Die 3D-Schicht zeichnet nur. Ein Klick auf ein 3D-Objekt ruft `NOCTURNE.engine.hotspot(id)` – dieselbe Funktion wie ein Klick in 2D. Inventar, Telefon, Rätsel, Dokumente, Spielstand und Raumwechsel sind unverändert.
2. **Die normale Version verhält sich unverändert.** Geändert wurden `engine.js` (kleine Schnittstelle, 2D-Pfad unverändert) und `index.html` (Link zum Testmodus); 3D-Dateien lädt `index.html` nicht. Der Testmodus hat einen eigenen Spielstand (`nocturne_save_3d_v2`).
3. **Keine fremden Modelle (vorerst).** Alles ist mit three.js aus Code gebaut; Texturen (Tapete, Holz, Uhr, Schilder …) werden zur Laufzeit auf Canvas gezeichnet.

## Dateien

| Datei | Inhalt |
|---|---|
| `3d.html` | Kopie der Spielseite + `saveKey`/`testMode3d` + Module |
| `css/3d.css` | Leinwand, Tooltip, Bedienhinweis |
| `js/3d/core.js` | Renderer, Kamera (Ziehen/Wischen, Mausrad/zwei Finger = Zoom), Auswahl per Raycasting, Taschenlampe, Blitz, Schnittstelle `NOCTURNE.view3d` |
| `js/3d/rezeption.js` | Raum 1: Hülle, Möbel, Licht; jedes Objekt an Hotspot-IDs aus `js/rooms/01-rezeption.js` gebunden |
| `../platform/vendor/three-0.170.0/` | three.js (MIT), fest im Repository – kein CDN |

Änderungen an `js/engine.js` (2D unverändert): `saveKey` aus der Konfiguration, in `renderStage` 3D statt SVG, wenn `NOCTURNE.view3d.supports(raum)`; Ziehen eines Gegenstands auf ein 3D-Objekt; Schnittstelle `engine.hotspot / isVisible / hotspotData / has / isLight / selectedItem / say / setView / refresh`.

## Einen Raum ergänzen

```js
defineRoom("zimmer217", (ctx) => {
  const { add, hs, prop, state, anim } = ctx;
  const { place } = walls(R);                       // place(obj, "n"|"e"|"s"|"w", u, höhe, abstand)
  add(place(hs("bett", bettGruppe), "n", 0.3, 0, 1.0));   // Hotspot-ID aus der Raumdatei
  hs(["tuer_offen", "tuer"], tuer);                  // mehrere IDs: die erste sichtbare gilt
  state((has, licht) => { … });                      // Zustand → Optik (Türen, Gegenstände)
  return { eye: [0, 1.62, 0] };
});
```

- `u` entspricht der waagerechten Lage in der 2D-Ansicht dieser Wand (0 = links, 1 = rechts).
- Sichtbarkeit (`if`/`unless`, Taschenlampe) kommt aus der Engine; `hideWhenHidden: true` blendet das Objekt dann auch aus.
- `prop(label, obj, fn)` = reine Optik ohne Spiellogik (z. B. Schubladen).

## Bildhinweise der Rezeption (müssen in 3D lesbar sein)

| Hinweis | Umsetzung |
|---|---|
| Uhr steht auf 23:17, Glas gesprungen | Zifferblatt-Textur mit Zeigern auf 23:17 |
| Gästeregister aufgeschlagen, lose Seite | Buch mit Lesebändchen, gelbliches Blatt. Nach dem Lesen verschwindet das Blatt, die Stelle bleibt anklickbar – genau wie in 2D (der Hotspot hat dort keine Bedingung, nur die Zeichnung im Bild verschwindet). |
| Personalfoto, Zeitungsartikel | Beschriftung wie in den Dokumenten: „Sommer 2008“, „Lokalanzeiger, Freitag, 16. Oktober 2009 – Hotel Nocturne nach Unwetternacht geschlossen“ |
| Anzeige am Aufzug steht auf E, „2“ rot eingekreist | Skala mit Kreis um 2, Zeiger wandert nach dem Schlüsselschalter auf 2 |
| Messingabdeckung, vier Schrauben | Platte → nach dem Schraubendreher Schlüsselschalter mit Lämpchen |
| Unter der Treppe stockdunkel | Hohlraum schwarz; mit Taschenlampe (Lichtkegel folgt Maus/Blickmitte) sichtbar |
| Nur das Porträt hängt gerade | Personalfoto und Zeitungsartikel leicht schief |
| Ordner „ABR. 10/09“ | beschrifteter Ordner im Regal |

## Tests

Im Ordner `tests/` (Aufruf aus dem Repository-Wurzelordner, vorher `python3 -m http.server 8765 &`):

| Datei | Prüft | Dauer |
|---|---|---|
| `3d-hinweise.test.js` | Alle sichtbaren Texte der 3D-Texturen stehen so auch in der Raumdatei (keine erfundenen Namen/Daten) | < 1 s, ohne Browser |
| `3d-rezeption.test.js` | Jeder Hotspot im Startzustand: 3D-Klick öffnet denselben Dialog wie 2D · Durchlauf Code 2117 → Taschenlampe → Schraubendreher → Abdeckung → Schlüsselschalter → Aufzug → Zimmer 217 · Neuladen · getrennter Spielstand | ca. 3 min (Software-Rendering) |
| `3d-touch.test.js` | iPhone quer/hochkant (emuliert): Tippen untersucht, Wischen dreht ohne Fehlauslösung | ca. 1 min |

Letzter Lauf (02.11.2026): 22/22 Hotspots gleich wie 2D, Durchlauf vollständig, keine Fehler.

Nicht prüfbar hier: Bildrate und Gefühl auf echten Geräten, Safari/iOS-WebGL.
