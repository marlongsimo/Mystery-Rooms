# Hotel Nocturne – 3D-Testmodus

**Seite:** `hotel-nocturne/3d.html` – auf der Startseite des Spiels als „Einchecken (Testmodus 3D)“ verlinkt, nicht im Katalog.

Stand: **Rezeption**, **Zimmer 217** und **Gepäcklager** als 360°-Räume. Alle anderen Räume laufen auf derselben Seite in der gewohnten 2D-Ansicht weiter – das Spiel bleibt komplett durchspielbar.

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
| `js/3d/kit.js` | gemeinsame Bausteine ab Raum 2: Tapete, Holz, Dielen, Schilder, Regen, Raumhülle (`shell`) |
| `js/3d/zimmer217.js` | Raum 2: alle 22 Hotspots aus `js/rooms/02-zimmer217.js` |
| `js/3d/gepaecklager.js` | Raum 3: alle 24 Hotspots aus `js/rooms/03-gepaecklager.js` |
| `js/3d/archiv.js` | Raum 4 (HD): alle 19 Hotspots aus `js/rooms/04-archiv.js` – Regal mit Jahresordnern, Lesetisch, Schreibtisch mit Bankerlampe, Chiffrierscheibe und Buchstabenrädern, Aktenschrank A–Z, Planschrank, Stahltür |
| `../platform/vendor/three-0.170.0/` | three.js (MIT), fest im Repository – kein CDN |

Änderungen an `js/engine.js` (2D unverändert): `saveKey` aus der Konfiguration, in `renderStage` 3D statt SVG, wenn `NOCTURNE.view3d.supports(raum)`; Ziehen eines Gegenstands auf ein 3D-Objekt; Schnittstelle `engine.hotspot / isVisible / hotspotData / has / isLight / selectedItem / say / setView / refresh`.

## Grafikstufe HD (Rezeption, Zimmer 217)

Räume melden sich mit `hd: true` an (Rückgabe des Raum-Builders). Das Gepäcklager ist bewusst noch nicht umgestellt.

| Baustein | Datei | Inhalt |
|---|---|---|
| Grafikkern | `js/3d/gfx.js` | Qualitätsstufen (high/medium/low, `?q=`), automatisches Herunterschalten bei < 25 fps, PBR-Umwandlung mit Normalenkarten aus den Canvas-Texturen, HDRI-Umgebung, Schatten (Taschenlampe + ein Hauptlicht), Leuchten (Bloom), Vignette/Korn, GLB-Lader (Meshopt, WebP), Lichtkegel-Textur der Taschenlampe, Staub |
| HD-Bausteine | `js/3d/hd.js` | Damasttapete, Marmor, Perserteppich, Holzmaserung; abgerundete Kanten, Kassetten, gedrechselte Beine, Zierrahmen; Materialien für Holz, Messing, Samt, Leder |
| Assets | `assets/3d/` | HDRI, Lizenzen in `assets/3d/LIZENZEN.md` |
| three.js-Zusätze | `../platform/vendor/three-0.170.0/addons/` | GLTF-/EXR-Lader, Meshopt-Decoder, Nachbearbeitung, RoundedBox (MIT, Version 0.170.0 wie der Kern) |

| Stufe | Gerät (automatisch) | Schatten | Leuchten | Staub | Auflösung |
|---|---|---|---|---|---|
| high | Computer | Taschenlampe 1024 px + Hauptlicht | ja | ja | bis 2× |
| medium | Tablet | Taschenlampe 512 px | ja (halbe Auflösung) | ja | bis 1,5× |
| low | Handy | nein | nein | nein | 1× |

Alle Möbel und Rätselteile sind aus Code gebaut (die zeitweise genutzten fremden GLB-Modelle wurden wieder entfernt). Falls später Modelle dazukommen: nur Möbel/Deko, immer mit fester unsichtbarer Klickfläche.

**Neue Modelle aufbereiten:** `npx @gltf-transform/cli optimize in.glb out.glb --texture-compress webp --texture-size 512 --compress meshopt --simplify true --simplify-ratio 0.5 --simplify-error 0.001`, Datei nach `assets/3d/models/`, Lizenz in `LIZENZEN.md` und in den Bildnachweisen von `3d.html` eintragen.

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

## Bildhinweise und Zustände in Zimmer 217

| Hinweis / Zustand | Umsetzung |
|---|---|
| Zimmernummer 217, Spiegel mit altem Schlüssel an der Kordel | Messingschild an der Tür, Schlüssel unter dem Spiegel |
| Sanduhr, Kerzenständer (Kerze brennt), Porträtfoto, alter Schlüssel | die vier Gegenstände des Kommoden-Codes; die Ziffern stehen – wie in 2D – erst beim Untersuchen im Text |
| Kommode mit vierstelligem Ziffernschloss (0000) | Schloss an der obersten Schublade; nach dem Code gleitet sie auf |
| „Wer nachts wacht“ über dem Schrank, fünf Buchstabenräder | Schnitzerei und Räder; nach ELIAS schwingen die Türen auf |
| Landschaftsbild „für E.“ | Signatur unten rechts im Bild |
| Fenster schlägt auf (Ereignis beim Blick nach Süden, nachdem die Kommode offen ist) | Blitz, linker Flügel öffnet, Vorhänge wehen; danach nasse Fußspuren von der Tür zum Schreibtisch und ein Blatt auf dem Schreibtisch |
| Tor in der Westmauer (nur im Blitz) | Umriss „W2“ im Hof, nur während des Blitzes sichtbar |
| Gepäckschein „6“ unter dem Bett | an der Vorderkante, halb unter dem Bett, nur im Lichtkegel; ohne Licht ist der Spalt schwarz |

## Bildhinweise und Zustände im Gepäcklager

| Hinweis / Zustand | Umsetzung |
|---|---|
| Messinganhänger 2 · 9 · 4 (Regal) und 6 (Ausgabe), Springerfigur, Notenblatt „Nocturne“, Kompass | Anhänger mit großer Ziffer an jedem Koffer; die Truhen-Kombination ergibt sich daraus |
| „AUSGABE NUR GEGEN GEPÄCKSCHEIN“, Schlitz unter der Klappe | Schild über der Stahlklappe; nach dem Gepäckschein hebt sich die Klappe, Koffer Nr. 6 mit blauem Schal, rotem Notizbuch und Käfigschlüssel gleitet auf den Tresen |
| „WERTGEPÄCK“, Käfigtür mit Kastenschloss, Truhe mit Zahlenschloss 0000 | Gittertür schwingt nach dem Käfigschlüssel auf, Deckel öffnet nach dem Code |
| Koffer 4 rutscht vom Regal (Ereignis beim Blick nach Osten, nachdem die Truhe offen ist) | Koffer fällt schräg auf den Boden; dahinter die gelbe Marke „14.10.2009 · 23:10 – WASSERSTAND KNIEHÖHE“ |
| Wasserrand auf Kniehöhe rundum, nasse Treppe, Milchglastür „ARCHIV“ oben, „← REZEPTION“ | dunkler Rand in der Wandtextur; Treppenschacht hinter der Nordwand, Tür öffnet nach dem Archivschlüssel |
| Notbeleuchtung flackert, Wasser tropft in den Eimer | Licht flackert unregelmäßig, Tropfen fallen aus dem Rohr |

## Tests

Im Ordner `tests/` (Aufruf aus dem Repository-Wurzelordner, vorher `python3 -m http.server 8765 &`). Die Funktionstests laufen in Stufe `low` (schnell im Software-Rendering); `Q=high node …` testet eine andere Stufe.

| Datei | Prüft | Dauer |
|---|---|---|
| `3d-hinweise.test.js` | Alle sichtbaren Texte der 3D-Texturen stehen so auch in der Raumdatei (keine erfundenen Namen/Daten) | < 1 s, ohne Browser |
| `3d-rezeption.test.js` | Jeder Hotspot im Startzustand: 3D-Klick öffnet denselben Dialog wie 2D · Durchlauf Code 2117 → Taschenlampe → Schraubendreher → Abdeckung → Schlüsselschalter → Aufzug → Zimmer 217 · Neuladen · getrennter Spielstand | ca. 3 min (Software-Rendering) |
| `3d-zimmer217.test.js` | Start direkt in Zimmer 217: jeder Hotspot 3D ↔ 2D · Kommode 4173 → Fensterereignis → Fußspuren und Blatt → Taschenlampe → Gepäckschein → Schrank ELIAS → Tür zurück in die Rezeption | ca. 3 min |
| `3d-gepaecklager.test.js` | Start im Gepäcklager: jeder Hotspot 3D ↔ 2D · Gepäckschein → Koffer Nr. 6 → Käfigschlüssel → Käfig → Truhe 2694 → Ereignis Koffer 4/Wassermarke → Archivtür → Archiv | ca. 3 min |
| `3d-archiv.test.js` | Start im Archiv: jeder Hotspot 3D ↔ 2D · Chiffrierscheibe → Fach WESTGANG → Planschrank (A · Datum + Nummer) → Ereignis im Norden → Schublade W → Stahltür 1897 → Sicherheitsbereich | ca. 4 min |
| `3d-hd.test.js` | Rezeption, Zimmer 217 und Archiv in den Stufen high/medium/low: HD aktiv, Umgebung, Leuchten und Schatten je Stufe, keine Ladefehler, keine Fehler; Bilder im Temp-Ordner | ca. 4 min |
| `3d-touch.test.js` | iPhone quer/hochkant (emuliert): Tippen untersucht, Wischen dreht ohne Fehlauslösung | ca. 1 min |

Letzter Lauf (02.11.2026): Rezeption 22/22, Zimmer 217 17/17, Gepäcklager 13/13 Hotspots gleich wie 2D (Startzustand), alle Durchläufe vollständig, keine Fehler.

Nicht prüfbar hier: Bildrate und Gefühl auf echten Geräten, Safari/iOS-WebGL.
