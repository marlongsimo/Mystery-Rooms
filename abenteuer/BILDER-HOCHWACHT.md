# Bilder für „Die letzte Fackel von Hochwacht“ (vollständige Sammlung)

Das Abenteuer läuft schon ohne diese Bilder: Kampfkarten werden gezeichnet, und für Titel und Abschnitte erscheint ein Ersatzbild. Sobald du Bilder lieferst, baue ich sie ein und richte die unsichtbaren Hindernisse am Bild aus (wie beim Moor).

**Stil für alle Bilder** (wie Grauwacht und Moor): gemalte Fantasy-Illustration, düster-atmosphärisch, gedeckte Farben, Ölmalerei-/Gouache-Anmutung, kein Text, keine Schrift, keine Wasserzeichen, keine Rahmen. Leitfarben: kaltes Schneeblau und Grau, dagegen warmes Fackel- und Glutorange.

Ablage: `abenteuer/img/hochwacht/`. PNG oder JPG in hoher Auflösung genügt, ich wandle sie in WebP um.

**Übersicht – 12 Bilder:** 1 Titelbild, 3 Abschnittsbilder, 8 Kampfkarten (4 Hauptkämpfe, 4 Nebenkämpfe).

| Kampf | Art | Karte |
|---|---|---|
| Hinterhalt am Pass | Hauptkampf 1 (Akt I) | `pass` |
| Das Jägerlager | Nebenkampf (nur wenn Sera verschleppt wird) | `lager` |
| Die Wächter aus Stein | Nebenkampf (Akt II, Weg „Tor“) | `tor` |
| Im Archivgang | Nebenkampf (Akt II, Weg „Archiv“) | `archiv` |
| Die stumme Wacht | Hauptkampf 2 (Akt II) | `hof` |
| Der Jägerhauptmann | Nebenkampf (verfolgen oder Sera verschleppt) | `grat` |
| Der offene Wehrgang | Hauptkampf 3 (Akt III) | `wehrgang` |
| Das letzte Licht | Hauptkampf 4, Finale (Akt III) | `hochwarte` |

---

## 1. Titelbild – `titel` ✓ eingebaut

(Querformat, mind. 1600 × 750) Erscheint bei „Neue Kampagne“ und in der Kampagnenwelt (Ausschnitt 640 × 300, die Mitte zählt).

> A painted dark-fantasy illustration of a ruined mountain monastery-fortress high on a snowy ridge at dusk, a long wall walk climbing to a lone stone watchtower on the highest crag, on top of it a cold, empty iron fire basket. In the foreground on a snowy mountain pass, a small figure of a young woman in a grey hooded cloak shields a tiny glowing ember in her cupped hands; behind her, far down the pass, a line of torches of hunters following her. Blowing snow, cold blue-grey palette against the warm orange glow of the ember and the torches. Wide landscape composition, centre of interest in the middle. No text.

## 2. Abschnittsbilder – `abschnitt-1` bis `abschnitt-3` (Querformat 16:11, mind. 640 × 440)

Kleine Vorschaubilder in „Aktuelle Kampagnen“.

- **abschnitt-1 (Der Überfall am Pass):** ✓ eingebaut
  > Painted dark-fantasy scene: a small stone waystation hut in a snowy mountain pass at dusk, warm light in its window; outside, a young woman in a grey cloak with a faint glowing ember in a small lantern, a wounded old soldier in a worn order's coat leaning on a spear. Far up the pass, dark silhouettes of hunters with torches. No text.
- **abschnitt-2 (Die stumme Wacht):** ✓ eingebaut
  > Painted dark-fantasy scene: the snowy inner courtyard of a ruined mountain monastery, in its centre a tall dormant signal device of brass and crystal on a round stone base, frost on the crystal; from the gates hunters in dark furs with sigil-marked masks approach; a massive old stone guardian construct with a cracked rune on its chest stands half-buried in snow. Cold grey light. No text.
- **abschnitt-3 (Das letzte Licht):** ✓ eingebaut
  > Painted dark-fantasy scene: a stone platform with pillars on the highest crag of a mountain at night, a big iron fire basket full of grey ash; rising from the ash a tall humanoid figure made of glowing embers and smoke, where it looks the light grows darker; in front of it a young woman in a grey cloak holds a small bright ember up to the basket. Snowstorm, deep blue night against fierce orange glow. No text.

## 3. Kampfkarten (Draufsicht, genau 4 : 3, mind. 1448 × 1086)

- **Senkrechte Draufsicht** wie ein Spielbrett, keine Perspektive, kein Horizont.
- **Raster:** 12 Spalten × 9 Zeilen (ein Feld ≈ 120 × 120 px). Hindernisse ungefähr in den markierten Feldern; ich prüfe und verschiebe die unsichtbaren Hindernisse.
- **Keine Figuren, kein Raster, kein Text.**

**Legende:**
- `S` Fels oder Mauer (blockiert)
- `W` niedriger Wall oder Kiste (Deckung, blockiert)
- `B` Zelt oder Baum (blockiert)
- `.` begehbarer Boden
- `h` Startplatz der Helden
- `s` Sera
- `A` Ausgang
- `g` Gegner

Die Buchstaben `h`, `s`, `A` und `g` dienen nur zur Orientierung; im Bild sollen diese Dinge nicht vorkommen. Ausnahme: Der Ausgang darf als Lücke im Fels erkennbar sein.

### `pass` – Hinterhalt am Pass (Akt I, Hauptkampf 1)
> Top-down orthographic battle map, painted fantasy style, 4:3. A narrow snowy mountain pass running from left to right: jagged dark rock walls along the top and bottom edges with small rocky niches (ambush spots) in the upper and lower walls, a trampled path of snow and frozen gravel through the middle, a low drystone wall on the upper right and another on the lower left as cover, an opening in the rocks at the right edge (the exit). Blowing snow, cold blue dusk light, a few frozen tufts of grass. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S S . . . S S S g g g S
  2  S . . . . . . . W . . S
  3  . h h . . . . . . . . .
  4  s h h . . . . . . . . A
  5  . h h . W . . . . . . .
  6  S . . . . . . . . . . S
  7  S S . . . S S S g g g S
  8  S S S S S S S S S S S S
```

### `lager` – Das Jägerlager (Akt I, Nebenkampf – nur wenn Sera verschleppt wird)
> Top-down orthographic battle map, painted fantasy style, 4:3. A sheltered snowy hollow surrounded by dark rocks: in the centre-right a campfire ringed by stones, with a wooden stake beside it; two canvas tents at the top and bottom middle; a few crates and a low wall of stacked stones as cover; trampled snow, scattered firewood and gear. Night, warm orange firelight against cold blue snow. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S . . . . B B . . . . S
  2  S . . W . . . . W g . S
  3  . h h . . . . . . g . g
  4  . h h . . . S W S . s .
  5  . h h . . . . . . g . g
  6  S . . W . . . . W g . S
  7  S . . . . B B . . . . S
  8  S S S S S S S S S S S S
```

### `tor` – Die Wächter aus Stein (Akt II, Nebenkampf)
> Top-down orthographic battle map, painted fantasy style, 4:3. The outer gate of a ruined mountain monastery: a thick ancient stone wall runs vertically through the middle of the map with a wide open gateway in its centre; on the left side (outside) trampled snow and two broken stone blocks, on the right side (inside) a flagstone forecourt with frost. Grey dawn light, light snowfall. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S . . . . . S . . . . S
  2  S . . W . . S . . g g S
  3  S h h . . . . . g . . S
  4  . h h . . . . . . g . S
  5  S h h . . . . . g . . S
  6  S . . W . . S . . . g S
  7  S . . . . . S . . . . S
  8  S S S S S S S S S S S S
```

### `archiv` – Im Archivgang (Akt II, Nebenkampf)
> Top-down orthographic battle map, painted fantasy style, 4:3. An underground monastery archive: three parallel corridors running left to right, separated by collapsed stone walls and toppled bookshelves, scattered books and torn pages, a few crates; cold blue light falling through cracks in the ceiling, some candles. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S . . W . . W . . W g S
  2  S h h . . . . . . . g S
  3  S S . S S S . S S S . S
  4  S h h . . . . . . . g g
  5  S . S S S . S S S . S S
  6  S h h . . . . . . . g S
  7  S . W . . W . . W . g S
  8  S S S S S S S S S S S S
```

### `hof` – Die stumme Wacht (Akt II, Hauptkampf 2)
> Top-down orthographic battle map, painted fantasy style, 4:3. The snowy inner courtyard of a ruined mountain monastery: in the exact centre a tall signal device of brass and crystal on a round stone base (one field), four low broken walls as cover around it, an open gate in the middle of the top wall and another in the middle of the bottom wall, the party enters through a gap in the left wall. Snow on flagstones, cold light, faint blue glow from the crystal. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S . . S S S S S
  1  S . . . g g g g . . . S
  2  S . . W . . . . W . . S
  3  S h h . . . . . . . . S
  4  s h h . . . G . . . . S
  5  S h h . . . . . . . . S
  6  S . . W . . . . W . . S
  7  S . . . . g g . . . . S
  8  S S S S S . . S S S S S
```
(`G` = das Signalgerät in der Mitte.)

### `grat` – Der Jägerhauptmann (Akt II, Nebenkampf)
> Top-down orthographic battle map, painted fantasy style, 4:3. A narrow rocky mountain ridge seen from above, widening in the middle, with sheer drops (dark abyss and drifting clouds) along the top and bottom edges, a few boulders as cover, wind-blown snow, a small hunters' camp with a fire at the right end. Harsh wind, cold late-afternoon light. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S S S S . . . . S S S S
  2  S S . . . . . . . g S S
  3  S h h W . . . g W . g S
  4  . h h . . . . . . g s .
  5  S h h . . W W . . . g S
  6  S S . . . . . . . g S S
  7  S S S S . . . . S S S S
  8  S S S S S S S S S S S S
```

### `wehrgang` – Der offene Wehrgang (Akt III, Hauptkampf 3)
> Top-down orthographic battle map, painted fantasy style, 4:3. A broad open wall walk on the flank of a mountain, running from left to right like a stone road: thick dark rock and masonry along the top and bottom edges with four narrow stairways (two at the top, two at the bottom) leading onto the walk, broken parapet stones scattered as low cover, an open stair leading up and out at the right edge (the exit towards the high watchtower). Snow drifts on flagstones, strong wind, cold blue night light, a few torches at the stairways. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S S . . S S S S . . S S
  2  S W . . . . . . g W g S
  3  . h h . . . . g . . . g
  4  s h h . W . . . . W . A
  5  . h h . . . . . . . . g
  6  S W . . . . . . g W g S
  7  S S . . S S S S . . S S
  8  S S S S S S S S S S S S
```
(Die Lücken in Zeile 1 und 7 sind die vier Treppen, über die die Jäger kommen.)

### `hochwarte` – Das letzte Licht (Akt III, Finale)
> Top-down orthographic battle map, painted fantasy style, 4:3. A round-ish stone platform on the highest crag of a mountain, seen from directly above: a low rampart along the edges with a gap on the left side (where the party arrives), six stone pillars standing in two rows (three at the top, three at the bottom) as cover, on the right side a large iron fire basket full of grey ash on a stone plinth (the signal fire, it occupies one field), scorched flagstones and ash drifting across the snow. Night, snowstorm, faint orange glow of embers in the ash. No characters, no grid, no text.
```
     0 1 2 3 4 5 6 7 8 91011
  0  S S S S S S S S S S S S
  1  S . . . . . . g . . g S
  2  S . . S . S . . S . g S
  3  S h h . . . . . . g . S
  4  s h h . . . . . . F g S
  5  S h h . . . . . . g . S
  6  S . . S . S . . S . g S
  7  S . . . . . . g . . . S
  8  S S S S S S S S S S S S
```
(`F` = das Signalfeuer. Die `S` in Zeile 2 und 6 sind die Säulen.)
