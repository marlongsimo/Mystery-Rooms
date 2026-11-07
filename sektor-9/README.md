# SEKTOR 9 – Das letzte Protokoll

Kooperativer Mystery-Escape-Room in 3D im Browser. Geschichte, Figuren, Rätselketten und Enden: [`DREHBUCH.md`](DREHBUCH.md).

**Stand:** Abschnitte 1–2 von 5 (Verteilerhalle, Kommando-Halle A, Personal-Halle B). Allein spielbar; gemeinsames Spielen ist angebunden, aber erst nach dem Eintrag in `game_catalog` freigeschaltet (siehe unten). Es folgen die Sektoren C und D, die Tonbänder 4–6 und die Enden.

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

## Gemeinsam spielen

Anbindung `js/mp-adapter.js` an `platform/multiplayer` (nur vorhandene Funktionen, nur Publishable Key, keine eigenen Tabellen):

| Eintrag (`set_session_state`) | Inhalt |
|---|---|
| `shared` | gelöste Rätsel, Zustände, Ausrüstungs-Vorrat, verbrauchte Gegenstände (`gone`), Team-Archiv |
| `pos:<Nutzer-ID>` | Halle, Standpunkt, Blickrichtung – Teamliste, Punkte auf der Karte, Helmlampe in derselben Halle |
| `chat` | Funk im Team, Nachrichten werden vereinigt |

Pro Person bleiben Standpunkt, Hinweise, ECHO-Protokoll und **eigene Funde**. Ein Fund geht erst mit „Mit dem Team teilen“ ins Team-Archiv.

**Freischalten:** Im Supabase-Dashboard einen Eintrag in `game_catalog` anlegen (`slug` = `sektor-9`, Titel, Code-Präfix z. B. `ECHO`, `enabled = true`), dann in `js/mp-adapter.js` `ENABLED = true` setzen. Bis dahin erscheint die Lobby nur mit `?mp=1` in der Adresse.
Test: `node sektor-9/tests/mehrspieler.test.js` (zwei Browserprofile gegen die echte Datenbank).
