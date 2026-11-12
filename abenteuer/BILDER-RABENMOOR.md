# Bilder für „Das Moor der stummen Lichter“

Das Abenteuer läuft schon ohne diese Bilder: Kampfkarten werden gezeichnet, und für Titel und Abschnitte erscheint ein Ersatzbild. Sobald du Bilder lieferst, baue ich sie ein (Format, Größe und Ausrichtung am Raster übernehme ich).

**Stil für alle Bilder** (wie Grauwacht): gemalte Fantasy-Illustration, düster-atmosphärisch, gedeckte Farben, Ölmalerei-/Gouache-Anmutung, kein Text, keine Schrift, keine Wasserzeichen, keine Rahmen.

Ablage später: `abenteuer/img/rabenmoor/` – Dateinamen siehe unten. PNG oder JPG in hoher Auflösung genügt, ich wandle sie in WebP um.

---

## 1. Titelbild – `titel` ✓ eingebaut

(Querformat, mind. 1600 × 750)

Erscheint auf der Spielerseite bei „Neue Kampagne“ und in der Kampagnenwelt (Ausschnitt 640 × 300, Mitte zählt).

> A painted dark-fantasy illustration of a misty black moor at night. A small village of peat-cutter huts on a sand island in the distance, connected by a long wooden plank causeway. Over the dark still water hover several small, perfectly still, pale greenish-white lights that do not flicker. In the foreground, reeds and a dead alder; a tiny pair of a child's bare footprints leads into the water. Mood: quiet, eerie, melancholic, beautiful. Muted teal, olive and bone-white palette with soft glow. Wide landscape composition, centre of interest in the middle. No text.

## 2. Abschnittsbilder – `abschnitt-1` und `abschnitt-2` (Querformat 16:11, mind. 640 × 440)

Kleine Vorschaubilder in „Aktuelle Kampagnen“.

- **abschnitt-1 (Rabenmoor):** ✓ eingebaut
  > Painted dark-fantasy scene: a peat-cutters' village square at dusk on an island in a moor, villagers holding torches and pitchforks, a broad man with a chain of office in front, a weeping woman apart from the crowd. Warm torchlight against cold blue mist. No text.
- **abschnitt-2 (Das tiefe Moor):**
  > Painted dark-fantasy scene: a small island deep in a black moor with a ring of mossy standing stones and a stone altar; a translucent pale girl made of mist, hair full of duckweed, sits beside a sleeping child on the altar; dozens of still pale lights hover around over the water. Cold, sad, quiet. No text.

## 3. Kampfkarten (Draufsicht, genau 4 : 3, mind. 1448 × 1086)

Wichtig für alle Karten:
- **Senkrechte Draufsicht** (wie ein Spielbrett), keine Perspektive, kein Horizont.
- Das Bild wird in ein **Raster aus 12 Spalten × 9 Zeilen** geteilt (jedes Feld ≈ 120 × 120 px). Hindernisse sollten ungefähr in den markierten Feldern liegen – es muss nicht pixelgenau sein, ich prüfe und verschiebe notfalls die unsichtbaren Hindernisse.
- Keine Figuren, keine Tiere, kein Raster einzeichnen.

Legende: `~` tiefes Wasser · `B` toter Baum oder dichtes Schilf (blockiert) · `S` Stein/Mauerrest · `K` Baumstumpf, Kiste oder Fass (Deckung) · `.` begehbarer Boden · `h` Startplatz der Helden · `g` Startplatz der Gegner (nur zur Orientierung, im Bild nichts davon zeigen)

### `bohlenweg` – Der Bohlenweg
> Top-down orthographic battle map, painted fantasy style, 4:3. A wide wooden plank causeway crossing a black moor from left to right through the middle three rows, with small grassy islands at both ends; dark still water along the top and bottom edges; two dead alder trees on each island; a few broken planks, a mossy crate and a stump. Night, faint pale mist, subtle moonlight. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
  1  ~ ~ ~ ~ ~ . K ~ ~ ~ ~ ~
  2  . B . . . ~ ~ . . . B .
  3  . h h . . . . . . g g .
  4  . h h . . . . . g . g .
  5  . h h . . . . . . g g .
  6  . . B K ~ ~ . . . B . .
  7  ~ ~ ~ . . . ~ ~ ~ ~ ~ ~
  8  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
```

### `ried` – Das Ried
> Top-down orthographic battle map, painted fantasy style, 4:3. A reed marsh: patches of muddy ground and grass hummocks separated by narrow channels of dark water; thick reed clumps at the corners and scattered in the middle; one rotting stump. Night, greenish gloom, mist pooling in the channels. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  B B . . ~ ~ ~ . . . B B
  1  B . . . ~ ~ . . . . g B
  2  . . B . . . . B . ~ . .
  3  . h . ~ ~ . . . g . ~ .
  4  . h h . . ~ ~ ~ . g . g
  5  . h B . . . . . ~ B g .
  6  . h h ~ . . K . . . . .
  7  B . . . ~ ~ . . B g . .
  8  B . . . . . ~ ~ . . . B
```

### `totenpfad` – Der Totenpfad
> Top-down orthographic battle map, painted fantasy style, 4:3. A causeway of tangled roots and peat crossing a moor of black, ink-like pools; dark water along the top and bottom edges; a few pools inside the walkable area; a sunken stone marker, a toppled boundary stone, one dead tree and a half-buried crate. Eerie, cold, faint pale light reflecting in the pools. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
  1  ~ ~ . . . . ~ . . . ~ ~
  2  . B . ~ ~ . . g . S . .
  3  . h h ~ . . K . g ~ g .
  4  . h h . . B . . . . g .
  5  . h h . . . . ~ ~ g g .
  6  . . S . . ~ . . ~ . B .
  7  ~ . . . . . . . . . . ~
  8  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
```

### `schrein` – Der versunkene Schrein
> Top-down orthographic battle map, painted fantasy style, 4:3. A small mossy island surrounded on all sides by dark still water. On the island a ring of six weathered standing stones and in the centre a low stone altar (two cells wide) with a small stone statue of a woman holding a finger to her lips. Pale lights reflected in the water, cold mist, moonlight. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
  1  ~ ~ . . . . . . . . ~ ~
  2  ~ . . g S g g S g . ~ ~
  3  ~ . . . . g g . . . . ~
  4  ~ . . S . K K . S . . ~
  5  ~ . . . . . . . . . . ~
  6  ~ ~ . . S . . S . . . ~
  7  ~ ~ . h h h h h h . ~ ~
  8  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
```
(Im Schrein sind `K` der Altar in der Mitte.)
