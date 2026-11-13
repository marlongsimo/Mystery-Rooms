# Bilder für „Die Fähre von Graufurt“ (Kurzabenteuer, Entwurf)

Das Abenteuer läuft schon ohne diese Bilder: Kampfkarten werden gezeichnet, und für Titel und Abschnitt erscheint das allgemeine Kampagnenbild. Sobald du Bilder lieferst, baue ich sie ein und richte die unsichtbaren Hindernisse am Bild aus.

**Neue Gegnerbilder braucht es nicht:** Rostkäfer, Schattenkobolde und Knochenwächter gibt es schon aus Grauwacht.

**Stil für alle Bilder** (wie Moor und Grauwacht): gemalte Fantasy-Illustration, düster-atmosphärisch, gedeckte Farben, Ölmalerei-/Gouache-Anmutung, kein Text, keine Schrift, keine Wasserzeichen, keine Rahmen. Leitfarben: regennasses Grau und Grün des Flusses, dagegen warmes Laternenlicht und ein kaltes, grünliches Leuchten aus dem Turm.

Ablage: `abenteuer/img/graufurt/`. PNG oder JPG in hoher Auflösung genügt, ich wandle sie in WebP um.

**Übersicht – 7 Bilder:** 1 Titelbild, 1 Vorschau (darf ein Ausschnitt des Titelbilds sein), 1 Abschnittsbild, 4 Kampfkarten.

| Kampf | Weg | Karte |
|---|---|---|
| Rost am Anleger | Fähre | `ufer` |
| Kobolde an Bord | Fähre | `faehre` |
| Auf der Kiesbank | Furt | `furt` |
| Der Zöllner zählt | beide, Finale | `turm` |

---

## 1. Titelbild – `titel` (Querformat, mind. 1600 × 750)
Erscheint bei „Neue Kampagne“ und in der Kampagnenwelt (Ausschnitt 640 × 300, die Mitte zählt).

> A painted dark-fantasy illustration of a wide grey river in heavy rain at dusk. On the near bank a small timber ferry house with one warm lit window and a wooden landing stage; a broad flat ferry raft lies crooked at the landing, its heavy iron chain torn and trailing into the water. On a hill across the river stands a leaning round stone toll tower without a roof, a faint sickly green glow in one window. Far in the north beyond dark hills, a pale grey sky. Small grey goblin silhouettes at the far waterline. Moody, rainy, muted greys and greens with warm lantern light. No text.

## 2. Vorschau – `vorschau` (Querformat 16:11, mind. 640 × 440)
> Same scene as the title, closer: the torn iron ferry chain trailing in the grey river, the ferry raft at the landing, the green-glowing tower window across the water in the rain. No text.

## 3. Abschnittsbild – `abschnitt-1` (Querformat 16:11, mind. 640 × 440)
> Painted dark-fantasy scene: inside a small timber ferry house at night, a tough middle-aged ferrywoman with wet hair and a hand axe stands at a half-open door, rain outside; on the table a lantern, a hammer and a new chain link; through the window across the river the silhouette of a round tower with a faint green light. No text.

---

## 4. Kampfkarten (Draufsicht, genau 4 : 3, mind. 1448 × 1086)

- **Senkrechte Draufsicht** wie ein Spielbrett, keine Perspektive, kein Horizont.
- **Raster:** 12 Spalten × 9 Zeilen (ein Feld ≈ 120 × 120 px). Hindernisse ungefähr in den markierten Feldern (siehe `daten/graufurt.js`).
- **Keine Figuren, kein Raster, kein Text.**

**Legende:** `~` Wasser (blockiert) · `T` Baum oder Schilf · `K` Kiste, Pfosten, Fels · `M` Mauer oder Stein · `.` begehbar. Helden starten links, Gegner rechts.

### `ufer` – Rost am Anleger
```
TT....K.~~~~
T.........~~
..K.....M.~~
...........~
............
...........~
..K......M~~
T.........~~
TT...K..~~~~
```
> Top-down orthographic battle map, painted fantasy style, 4:3. A wet grassy riverbank: on the left edge a few willow trees and reeds, scattered crates and wooden posts on the meadow, two old mooring stones on the right; along the right edge the grey river with a wooden landing stage in the middle of the right side reaching into the water, a heavy rusty iron chain lying across the grass from the landing. Rain puddles, muted green and grey. No characters, no grid, no text.

### `faehre` – Kobolde an Bord
```
~~~~~~~~~~~~
~~~~~~~~~~~~
~K........K~
~..........~
~....KK....~
~..........~
~K........K~
~~~~~~~~~~~~
~~~~~~~~~~~~
```
> Top-down orthographic battle map, painted fantasy style, 4:3. A broad rectangular wooden ferry raft in the middle of a fast grey river, filling the middle five rows of the image from edge to edge (one row of water left and right); thick wooden posts at its four corners, a stack of crates and sacks in the centre, an iron chain running across the raft from left to right. Rain on the planks, foam on the water around it. No characters, no grid, no text.

### `furt` – Auf der Kiesbank
```
~~~~..~~~~~~
~~~.....~~~~
~...M......~
......~~....
...........M
..~~....M...
~.......~...
~~~~.....~~~
~~~~~~..~~~~
```
> Top-down orthographic battle map, painted fantasy style, 4:3. A shallow river ford: wide pale gravel banks and flat stones in shallow rushing water, crossed by a few deep dark channels; scattered boulders; foam and ripples, grey overcast light. No characters, no grid, no text.

### `turm` – Der Zöllner zählt
```
MMMMMMMMMMMM
MM...KK...MM
M..........M
M...M..M...M
............
M...M..M...M
M..........M
MM..K...K.MM
MMMMMMMMMMMM
```
> Top-down orthographic battle map, painted fantasy style, 4:3. The round interior of a ruined stone toll tower without a roof, rain falling in: thick stone walls around the edge, a doorway gap in the middle of the left wall and a small gap in the middle of the right wall, four stone pillars in the room, an old table with scattered coins and a few crates, a pile of rope at the right wall. A faint sickly green glow from a lantern on the table. No characters, no grid, no text.
