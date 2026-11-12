# Die Krone unter dem Eis – Konzept (Schwierigkeit Stufe 4)

Grundlage: „MYTHARA Kampagnenkonzept Stufe 4 – Die Krone unter dem Eis“ (PDF). Hier steht die abgestimmte Fassung für die Umsetzung in der bestehenden Engine. **Status: Konzept, noch nicht gebaut.**

## K1. Eckdaten (festgelegt)
| Merkmal | Festlegung |
|---|---|
| Schwierigkeit | Stufe 4 im Hub. Schwerer durch Mechaniken, Ziele und Gelände, nicht durch höhere Heldenstufe |
| Heldenstufe | Start bei Stufe 1, Aufstieg bis Stufe 3 (wie Hochwacht). Heldenstufe 4 erst mit der Heldenfreischaltung nach der Beta |
| Gruppengröße | 3–6 Helden (Engine-Grenze; nicht 8) |
| Dauer | ca. 4–5 Stunden |
| Aufbau | 3 Akte · 3 Routen (eine je Durchlauf) · 4 Hauptkämpfe · Finale · 2 optionale Kämpfe |
| Bilder | Vom Nutzer geliefert, Prompts gesammelt am Ende (wie Moor und Hochwacht) |

## K2. Handlung (aus dem PDF)
Das Signal von Hochwacht wird beantwortet: Ein Licht unter dem Eis im Norden zeigt Veyrholm, die verschüttete Hauptstadt des Reiches, das die sieben Siegel errichtete. Unter dem Palast liegt das **Kronenherz**, der Steuerkern, der die Siegel verbindet. Der **Bund der Hohlkrone** will ihn kontrollieren oder die Siegel brechen. Am Ende entscheidet die Gruppe über das Kronenherz und eröffnet damit Stufe 5.

**Anschluss an frühere Kampagnen:** Die Kampagnen bleiben technisch unabhängig. Wie in Hochwacht fragt eine **Vorgeschichte-Wahl** am Anfang ab:
- Wie endete Grauwacht? Daran hängt Anselms Rolle: Gegenspieler oder zwielichtige Figur. Der Endboss ist unabhängig davon der Hüter des Kronenherzens.
- Was wurde aus Sera in Hochwacht (gerettet, gefangen, verloren)? Das verändert die Einleitung.

## K3. Kampfplan
| Nr. | Begegnung | Art | Ziel / Mechanik | Karte |
|---|---|---|---|---|
| 1 | **Sturmgrat** · Jagd auf die Fackel | Pfadkampf Route A | Jagdhorn erreichen und halten oder Ausgang freikämpfen; Jägerhauptmann Varrek (Elite) markiert Ziele | `sturmgrat` |
| 1 | **Unterstollen** · Nest im Eis | Pfadkampf Route B | Splitterbrutmutter besiegen oder zwei Nester zerstören | `unterstollen` |
| 1 | **Pilgerstraße** · Die namenlosen Pilger | Pfadkampf Route C | Drei Grablichter entzünden oder alle besiegen; Eidwächter (Elite) | `pilgerstrasse` |
| 2 | **Marktplatz der leeren Fenster** | Hauptkampf 1 | Zwei von drei Siegelsteinen abschalten; angekündigte Verstärkung aus Hauszugängen; Kälterufer als Prioritätsziel | `marktplatz` |
| 3 | **Die Kammern der Verschleppten** | optional | siehe K4 (ersetzt den Glockenkeller) | `kammern` |
| 4 | **Die Brücke über den Gletscherbruch** | Hauptkampf 2 | Durchbruch statt Vernichtung; Kettenbestie, Schützen von den Seiten, brüchige Eisfelder | `bruecke` |
| 5 | **Das Tor der Kronenwache** | Hauptkampf 3 / Boss | Eisenhirte mit Runenkern-Schild; Schild brechen über zwei Runensäulen oder gezielte Angriffe; angekündigter Bodenstoß | `tor` |
| 6 | **Das Archiv der Namen** | Hauptkampf 4 | Zwei von drei Schrifttafeln sichern oder Ritual unterbrechen; Runenleser (Elite) | `archiv` |
| 7 | **Die Frostkammer** | optionaler Boss | Frostmatrone: Nester, gefrierende Felder; schwächt das Finale | `frostkammer` |
| 8 | **Der Kronensaal** | Finale | König unter dem Eis, drei Phasen: Wächter → gebrochene Krone (drei Runenfelder, Nachschub) → Herz (Spielfeld verändert sich) | `kronensaal` |

Je nach Weg sind das 6 bis 8 Kämpfe pro Durchlauf.

## K4. Ersatz für den Glockenkeller: Die Kammern der Verschleppten (festgelegt)
**Warum ein Ersatz:** Die Glocke gab es schon in Grauwacht. Der Ersatz greift einen Faden auf, der im Konzept schon steckt: Viele Bewohner Veyrholms wurden in den Untergrund verschleppt.

- **Einstieg:** Nach dem Marktplatz hört die Gruppe Klopfen unter dem Pflaster. Eine Treppe führt in Gewölbe, in denen Menschen in Eisblöcken eingeschlossen sind, manche noch lebendig. Die Gruppe kann weitergehen oder hinabsteigen.
- **Ziel:** Drei Eisblöcke aufschlagen, bevor die Gefangenen erfrieren. Ein Held neben dem Block braucht dafür eine Aktion, und zwar zwei Runden lang. Das ist dieselbe Technik wie die Aktivierung bei Sera, nur dass hier die Helden handeln. Glasschwärmer kriechen aus den Wänden, ein Frostknecht hält den Gang. Nach 6 Runden ist ein noch eingeschlossener Gefangener verloren.
- **Taktische Frage:** Wer schlägt das Eis auf, und wer hält die Schwärmer fern? Die Gruppe muss sich aufteilen.
- **Belohnung je nach Zahl der Geretteten:**
  - 1 Gerettete: Hinweise auf das Archiv (Wissen über den Runenleser).
  - 2 Gerettete: Eine alte Brückenwärterin zeigt die tragenden Eisfelder. Die brüchigen Felder auf der Brücke werden vor dem Kampf angezeigt.
  - 3 Gerettete: zusätzlich weniger Nachschub im Finale (wie es die Glocke vorsah).
- **Folgen:** Die Geretteten kommen im Epilog vor. Ist niemand gerettet oder wurde der Keller übergangen, bleiben sie im Eis; das erwähnt der Epilog ebenfalls.
- **Marker:** `s4_verschleppte` = 0 / 1 / 2 / 3 / `nicht_betreten` (ersetzt `s4_glocke`).

## K5. Gegner (Rollen statt Lebenspunkte)
Wiederverwendet aus Hochwacht: Maskierter Jäger = Siegeljäger (Schütze), Fährtenhund = Funkenhund, Jägerhauptmann Varrek = Jägerhauptmann.

Neu: Frostknecht (Nahkampf, blockiert Engstellen), Eisgezeichneter (untoter Mob, schwach, kommt in Gruppen), Glasschwärmer (kleiner Schwarm aus Nestern, anfällig für Flächenschaden), Kälterufer (Unterstützer, stärkt und schützt), Runenleser (Elite, markiert Felder und trennt Helden), Kettenbestie (schwer, Rückstoß), Eisenhirte (Konstrukt-Boss mit Runenkern), Splitterbrutmutter, Eidwächter, Frostmatrone, König unter dem Eis.

**Zusammensetzung:**
- Kleiner Kampf: 1 Frontkämpfer, 2 Mobs, eventuell 1 Unterstützer.
- Mittlerer Kampf: 2 Rollen, 1 Elite, 1 begrenzte Welle.
- Großer Kampf: höchstens 1 Boss mit wenigen klaren Helfern.

## K6. Neue Engine-Bausteine (zuerst bauen und simulieren)
| Baustein | Stand | Plan |
|---|---|---|
| Ziel-Objekte anfassen (Siegelsteine, Runensäulen, Grablichter, Schrifttafeln, Eisblöcke) | vorhanden (Siegelsteine in Grauwacht) | verallgemeinern: Objekt-Typ, Aktion, Runden, Wirkung |
| Boss mit Phasen | ansatzweise (Valdric Phase 2) | allgemeine Phasen nach TP-Schwellen mit Phasentext |
| Verstärkungswellen | Valdric ruft Tote | allgemein: angekündigt (Zugänge leuchten eine Runde vorher), mit Obergrenze, abschaltbar über Ziele |
| Angekündigte Flächenangriffe | neu | Felder werden markiert, Wirkung im nächsten Gegnerzug; Darstellung auf der Karte |
| Nester als Ziele | machbar | unbewegliche Gegnerfigur, die Schwärmer erzeugt |
| Brüchige und gefrierende Felder | neu | Gelände ändert sich während des Kampfes (Feld wird Hindernis oder Gefahr) |
| Rückstoß | neu | um 1–2 Felder schieben; an Abgrund oder brüchigem Eis gefährlich |
| Eisenhirte „frontal gepanzert“ | Die Engine kennt keine Blickrichtung | ersetzt durch den Runenkern-Schild |

### Stand der Bausteine (umgesetzt und getestet)
Umgesetzt in `js/regeln.js` (Abschnitt „Mechaniken“), eingeschaltet je Kampf über `mechanik` in `neuesSpiel`. Ohne `mechanik` laufen alle bisherigen Kämpfe Zug für Zug gleich (280 Vergleichskämpfe). Darstellung in `js/spiel.js` (`mechanikEbene`), Gegnerbilder in `js/bild.js`. Tests: `tests/mechanik.test.js` (Regeln und Browser). Probekämpfe: `tools/mechanik-sim.js`.

| Baustein | Umsetzung |
|---|---|
| Ziel-Objekte | Aktion „Ziel bedienen“ (auf dem Handy mit eigenem Namen); `runden` (mehrere Aktionen), `ruhe` (kein Gegner daneben), `frist` (danach verloren), `umkehrbar` (ein Rufer weckt es wieder). Wirkungen: Welle aus, Schild aus, Gerettete zählen. Sieg über Ziele möglich |
| Verstärkungswellen | Eine Runde vorher angekündigt (Zugang leuchtet „Verstärkung!“), mit Obergrenze. Endet, wenn ihr Träger (`an`) besiegt oder ein Ziel erledigt ist. Gegnerzahl und Leben wachsen mit der Gruppe |
| Angekündigte Flächen | Gegner mit `flaeche` (Kreis, Linie, Ring um sich): Die Felder werden rot markiert und treffen beim nächsten Zug des Gegners. Die Automatik weicht aus (Probe: 401 ausgewichen, 48 getroffen) |
| Gelände | Brüchiges Eis: knackt angekündigt, bricht eine Runde später ein (Loch, Sturz 2W6 bei misslungener GES-Rettung, begrenzt auf die Hälfte der Felder). Eiswände (`feldzauber`): trennen Helden, entstehen beim nächsten Zug des Zaubernden, tauen nach 2 Runden |
| Rückstoß | `rueckstoss`: STR-Rettung, sonst bis zu 2 Felder weg; an Abgrund oder Loch Sturz (2W6, liegt), an der Wand Aufprall (1W6) |
| Boss-Phasen | `phasen` nach TP-Schwellen: Text, RK, Welle starten, Gelände verwandeln, Schild erneuern |
| Schutzfeld | fängt die Hälfte ab, bricht nach genug Schaden für 2 Runden, erlischt endgültig, wenn seine Ziele (Runensäulen) erledigt sind |
| Rufer | `rufer`: weckt erledigte Ziele wieder oder heilt Verbündete. Die Automatik greift Rufer zuerst an |
| Nester | `nest`: unbewegliche Gegnerfigur, lässt alle 2 Runden einen Schwärmer schlüpfen (höchstens 3) |
| Durchbruch | `ausgang`: Stehen alle Helden auf den Ausgangsfeldern, ist der Kampf gewonnen |

Schon angelegte Gegner: Frostknecht, Eisgezeichneter, Glasschwärmer, Schwärmernest, Kälterufer, Runenleser, Kettenbestie, Eisenhirte. Ihre Werte sind vorläufig; das Balancing folgt mit den echten Kämpfen.

### Stand Akt I (Entwurf, gebaut und getestet)
`daten/krone.js`: Vorgeschichte (Grauwacht, Hochwacht) → Kaltbrunn (Ylva Hallgrim) → Routenwahl → je Weg Anmarsch (Probe), Wahl Kampf/Umgehen (ohne Belohnung) → Pfadkampf → Marktplatz (Hauptkampf 1) → Kammern der Verschleppten (optional) → Lager (Stufe 2) → Ende des Entwurfs.
Pfadkämpfe: Sturmgrat (Jagdhorn sichern oder alle besiegen), Unterstollen (zwei Nester oder die Brutmutter, brüchiges Eis), Pilgerstraße (drei Grablichter brechen den Schutzkreis des Eidwächters; ab 5 Helden zwei Aktionen in Ruhe). Niederlagen führen weiter, nur ohne Belohnung.
Siegquote Normal (Automatik, 120 Gruppen je Größe, 3–6 Helden): Pfadkämpfe 78–92 %, Marktplatz 72–86 % (6 Helden danach leicht entschärft), Kammern 85–93 % mit im Schnitt 2 von 3 Geretteten. Werkzeuge: `tools/auswertung-krone.js` (auch `--kalibrieren`), `tools/durchlauf-krone.js`; Test: `tests/krone.test.js`.

## K7. Enden und Marker
**Enden:** Stabilisieren · Versiegeln · Umleiten, dazu die Niederlage. Jedes Ende öffnet Stufe 5 auf eigene Weise.

**Marker:**
- `s4_route` = sturmgrat / stollen / pilgerweg
- `s4_route_bonus` = signalhorn / kernsplitter / pilgerzeichen / keiner
- `s4_verschleppte`
- `s4_frostmatrone` = besiegt / verschont / nicht gefunden
- `s4_kronenherz` = stabilisiert / versiegelt / umgeleitet

**Pfadvorteile:**
- Signalhorn: verzögert eine Verstärkungswelle.
- Kernsplitter: schaltet im Finale einmal einen Kristallschutz ab.
- Pilgerzeichen: zeigt eine Schwäche im Schutzkreis oder gibt einen sicheren Rastpunkt.

## K8. Reihenfolge der Umsetzung
1. **Engine-Bausteine (K6)** mit eigenen Tests und Simulation.
2. **Akt I:** Vorgeschichte, Routenwahl, drei Pfadkämpfe, Marktplatz, Kammern der Verschleppten.
3. **Akt II:** Brücke, Tor der Kronenwache, Archiv, Frostkammer.
4. **Akt III:** Kronensaal mit drei Phasen, drei Enden, Epilog.
5. **Kalibrierung** für 3–6 Helden (Normal und Hardcore), Helden-Ranking, Durchläufe.
6. **Bildprompts gesammelt am Ende:** Titel, 3 Abschnittsbilder, 10 Karten.

Nur RPG-Dateien werden geändert. Escape-Rooms und Krimidinner bleiben unberührt.
