# SEKTOR 9 – Das letzte Protokoll

Kooperativer Mystery-Escape-Room in 3D im Browser. Geschichte, Figuren, Rätselketten und Enden: [`DREHBUCH.md`](DREHBUCH.md).

**Stand:** Abschnitt 1 von 5, allein spielbar. Er umfasst die Verteilerhalle und die Kommando-Halle (Sektor A) mit drei Standpunkten. Mehrspieler, die Sektoren B bis D, die Tonbänder 2–6 und die Enden folgen.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html` | Titel, Spieloberfläche (Szene, Ausrüstung, Karte, Archiv, ECHO), Fenster |
| `js/data.js` | **Inhalte**: Hallen → Standpunkte → Blickrichtungen, Hotspots, Rätsel mit drei Hinweisstufen, Dokumente, Gegenstände |
| `js/engine.js` | **Einzige Wahrheit** über den Spielstand: Hotspots, Rätselprüfung (`tryLock`), Bewegung, Archiv, Karte, ECHO-Meldungen, Speichern |
| `js/3d/core.js` | 3D-Kern aus Hotel Nocturne, erweitert um **Standpunkte** (mehrere Augenpunkte je Halle, Kamera gleitet) und Helmlampen für Mitspieler |
| `js/3d/s9kit.js` | Bunker-Baukasten: Beton, Stahl, Panzertür mit Handrad, Standpunkt-Markierung, Röhrenbildschirm, Lampen |
| `js/3d/verteiler.js`, `js/3d/kommando.js` | die Hallen |
| `js/3d/interact.js`, `gfx.js`, `hd.js`, `kit.js`, `js/audio.js` | aus Hotel Nocturne übernommen (eigener Namensraum `SEKTOR9`), Hotel Nocturne bleibt unverändert |

**Grundregel wie in Hotel Nocturne:** Die 3D-Schicht zeichnet nur und ruft `engine.hotspot(id)` oder `engine.tryLock(rätsel, wert)` auf. Lösungen, Fehlertexte und Folgen stehen in `data.js`. Jedes direkt bedienbare Objekt lässt sich auch über „Klassisch lösen“ im Fenster lösen.

## Testen

```
python3 -m http.server 8765 &      # im Repository-Wurzelordner
node sektor-9/tests/abschnitt1.test.js        # ganzer Abschnitt 1 in 3D, SHOTS=1 für Bildschirmfotos
```
