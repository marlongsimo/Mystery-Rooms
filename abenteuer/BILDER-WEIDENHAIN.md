# Bilder für „Das Erntefest von Weidenhain“ (Einsteiger-Kurzabenteuer) – alle 6 eingebaut

Alle Bilder sind eingebaut. Die unsichtbaren Hindernisse der Kampfkarten sind am Bild ausgerichtet; die Raster unten zeigen den ursprünglichen Entwurf, die gültigen stehen in `daten/weidenhain.js`.

**Neue Gegnerbilder braucht es nicht:** Schlammkröte und Irrlicht gibt es schon aus dem Moor. Die alte Unke ist eine Schlammkröte mit eigenem Namen.

**Stil für alle Bilder** (wie Moor und Grauwacht): gemalte Fantasy-Illustration, gedeckte Farben, Ölmalerei-/Gouache-Anmutung, kein Text, keine Schrift, keine Wasserzeichen, keine Rahmen. Leitfarben: warmes Festfeuer und Laternenlicht, Herbstgold der Ernte, dagegen das kalte, stille Licht über dem Moor im Süden. Etwas freundlicher als das Moor, es ist das Einsteiger-Abenteuer.

Ablage: `abenteuer/img/weidenhain/`. PNG oder JPG in hoher Auflösung genügt.

**Übersicht – 6 Bilder:** 1 Titelbild, 1 Vorschau, 1 Abschnittsbild, 3 Kampfkarten.

| Kampf | Karte |
|---|---|
| Kröten im Korn | `speicher` |
| Am Mühlgraben | `muehle` |
| Die alte Unke | `wehr` |

---

## 1. Titelbild – `titel` ✓ eingebaut (Querformat, mind. 1600 × 750)
> A painted fantasy illustration of a small village harvest festival at night on the edge of a dark marsh: a big bonfire on the village square, lanterns strung between timber houses, villagers dancing, tables with bread and pumpkins, a wooden granary barn with its door ajar and a few large toad shapes slipping out. Far in the south, beyond willow trees, a dark marsh under a cold sky with three small, perfectly still pale lights hanging above the water. Warm golden firelight against cold blue night. No text.

## 2. Vorschau – `vorschau` ✓ eingebaut (Querformat 16:11, mind. 640 × 440)
> Close-up of the same scene: the granary door at night lit by the festival fire, a large wet marsh toad with glistening skin peering out between grain sacks. No text.

## 3. Abschnittsbild – `abschnitt-1` ✓ eingebaut (Querformat 16:11, mind. 640 × 440)
> Painted fantasy scene: a stout village mayor woman with flour on her hands and a festival ribbon talks to a small group of strangers by a bonfire; behind them a timber granary, in the far distance three still pale lights above a dark marsh. Warm and cosy, a little uneasy. No text.

---

## 4. Kampfkarten (Draufsicht, genau 4 : 3, mind. 1448 × 1086)

- **Senkrechte Draufsicht** wie ein Spielbrett, keine Perspektive, kein Horizont.
- **Raster:** 12 Spalten × 9 Zeilen (ein Feld ≈ 120 × 120 px). Hindernisse ungefähr in den markierten Feldern (siehe `daten/weidenhain.js`).
- **Keine Figuren, kein Raster, kein Text.**

**Legende:** `~` Wasser · `T` Baum oder Schilf · `K` Säcke, Kisten, Fässer · `M` Mauer oder Stein · `.` begehbar. Helden starten links, Gegner rechts.

### `speicher` – Kröten im Korn ✓ eingebaut
```
MMMMMMMMMMMM
M..K....K..M
M..........M
M...KK..KK.M
............
M...KK..KK.M
M..........M
M..K....K..M
MMMMMMMMMMMM
```
> Top-down orthographic battle map, painted fantasy style, 4:3. The inside of a wooden village granary: plank floor with spilled grain, thick timber walls around all edges, a wide open barn door in the middle of the left wall, a ragged hole in the middle of the right wall with mud and water beyond; stacks of grain sacks and barrels in two double rows, a few single sacks near the corners. Warm lantern light from the door, dark corners. No characters, no grid, no text.

### `muehle` – Am Mühlgraben ✓ eingebaut
```
TT....~~MMMM
T.....~~MMMM
......~~....
..K...~~..K.
............
..K...~~....
......~~..K.
T.....~~....
TT....~~..TT
```
> Top-down orthographic battle map, painted fantasy style, 4:3. A meadow at night split by a straight mill race running from top to bottom just right of the centre, crossed by a narrow wooden footbridge in the middle; the corner of a stone watermill in the upper right; a few hay bales and crates on the grass, willows in the corners. Moonlight and a faint cold glow over the water. No characters, no grid, no text.

### `wehr` – Die alte Unke ✓ eingebaut
```
~~~~~~~~~~~~
~~~~~~~~~~~~
..T......M..
............
............
............
..T....K....
~~~~MMMM~~~~
~~~~~~~~~~~~
```
> Top-down orthographic battle map, painted fantasy style, 4:3. A muddy strip of bank between a dark mill pond along the top edge and an outflow channel along the bottom edge; an old weir of mossy stones in the middle of the bottom edge; two reed clumps on the left, a boulder upper right, a broken crate lower right. Mist on the water, cold pale light from above. No characters, no grid, no text.
