# Case Unlocked · Abenteuer – Spielkonzept 0.1

**Kooperatives Fantasy-Rollenspiel im Stil klassischer W20-Rollenspiele, im Browser, ohne Spielleitung und ohne Anmeldung.**

| | |
|---|---|
| Spieler | 1–6 auf eigenen Geräten, eine Gruppe von 3–6 Figuren |
| Dauer | erstes Abenteuer ca. 2–3 Stunden, in drei Abschnitten, jederzeit speicherbar |
| Figuren | 5 Klassen, Stufe 1–3 im ersten Abenteuer, Figur wird **auf dem Gerät** gespeichert und wächst mit |
| Technik | statische Seite + vorhandene Multiplayer-Plattform (Sitzungen, Raumcode, gemeinsamer Spielstand) |
| Anmeldung | keine, wie bei allen Spielen auf Case Unlocked |
| Pfad | `/abenteuer/` |

> **Stand:** Entwurf zur Freigabe. Nichts davon ist gebaut. Welt, Namen, Regeln und Zahlen sind Vorschläge. Alle Namen sind gegen die bestehenden Spiele geprüft und kommen dort nicht vor.

---

## 1 · Leitidee

Eine Gruppe zieht gemeinsam in einen Dungeon. Gekämpft wird taktisch auf einer Rasterkarte, mit Initiative, Bewegung, Angriffswürfen gegen Rüstungsklasse, Zaubern und Beute. Dazwischen gibt es Proben, Fallen, Gespräche und Entscheidungen, bei denen die Gruppe abstimmt. Die Erzählstimme übernimmt das Spiel selbst: Alle Szenen sind vorbereitet, es gibt weder KI noch Spielleitung.

**Was es von den Escape Rooms unterscheidet:** Kampf und Charakterentwicklung stehen im Mittelpunkt. **Was es mit ihnen teilt:** Rätsel, eine dichte Geschichte und das gemeinsame Spielen per Raumcode.

**Rechtliche Leitplanke:** Die Grundmechanik (W20, sechs Attribute, Rüstungsklasse, Vorteil und Nachteil) darf jeder verwenden. Wir verwenden **keine** Namen, Welten, Monster oder Texte aus „Dungeons & Dragons“ und auch nicht das offizielle Regelwerk (SRD). Alle Regeltexte, Monster und Orte sind eigene. Das Spiel wird nicht als D&D beworben.

---

## 2 · Die Welt: die Splitterlande

Ein Land aus kleinen Fürstentümern, Wäldern und Mooren, das vor dreihundert Jahren in einem Krieg der Magier „zersplittert“ wurde. Überall liegen alte Siegel im Boden, die etwas fernhalten. Die meisten Menschen haben vergessen, was.

**Ton:** düster, aber nicht grausam. Abenteuerlich, mit trockenem Humor. Ab 12 Jahren.

---

## 3 · Die fünf Klassen

Jede Klasse hat für das erste Abenteuer eine fertige Figur. Den Namen wählt jede Person selbst. Die Werte sind Startwerte für Stufe 1.

| Klasse | Figur | Rolle | Stärke | Geschick | Konstitution | Intelligenz | Weisheit | Charisma | TP | RK |
|---|---|---|---|---|---|---|---|---|---|---|
| Krieger | **Schildwächter** | vorn stehen, schützen | 16 (+3) | 12 (+1) | 15 (+2) | 8 (−1) | 10 (0) | 11 (0) | 12 | 18 |
| Magier | **Elementarist** | Schaden auf Entfernung, Flächen | 8 (−1) | 14 (+2) | 13 (+1) | 16 (+3) | 12 (+1) | 10 (0) | 7 | 12 |
| Schurke | **Schattenläufer** | Hinterhalt, Fallen, Schlösser | 10 (0) | 16 (+3) | 13 (+1) | 12 (+1) | 12 (+1) | 12 (+1) | 9 | 14 |
| Kleriker | **Lichtbringer** | heilen, stärken, Untote | 14 (+2) | 10 (0) | 14 (+2) | 10 (0) | 16 (+3) | 12 (+1) | 10 | 18 |
| Waldläufer | **Wildnisläufer** | Fernkampf, Spuren, Natur | 12 (+1) | 16 (+3) | 13 (+1) | 10 (0) | 14 (+2) | 8 (−1) | 11 | 15 |

**Fähigkeiten nach Stufe:**

| Klasse | Stufe 1 | Stufe 2 | Stufe 3 |
|---|---|---|---|
| Schildwächter | Langschwert 1W8+3 · **Zweiter Atem** (Bonusaktion, heilt 1W10+Stufe, 1× je Rast) · **Schutzhaltung** (Reaktion: Angriff auf Nachbarn mit Nachteil) | **Tatendrang** (eine zusätzliche Aktion, 1× je Rast) | **Wuchtschlag:** kritischer Treffer schon bei 19–20 |
| Elementarist | Zaubertrick **Glutpfeil** (1W10, 12 Felder) · 2 Zauberplätze: **Magisches Geschoss** (3× 1W4+1, trifft immer), **Schildzauber** (Reaktion, +5 RK) | 3 Zauberplätze · **Donnerwelle** (2W8, Kegel 3 Felder, Gegner werden zurückgestoßen) | 4 Plätze, davon 2 vom 2. Grad · **Glutsphäre** (3W6 in 2 Feldern Umkreis) |
| Schattenläufer | Kurzschwert 1W6+3, Kurzbogen · **Hinterhalt** (+1W6, wenn ein Verbündeter neben dem Ziel steht oder mit Vorteil) · geübt im Fallen-Entschärfen | **Gerissene Aktion** (Bonusaktion: Spurt, Verstecken oder Rückzug) | Hinterhalt +2W6 · **Ausweichen** (Reaktion: halber Schaden) |
| Lichtbringer | Streitkolben 1W6+2 · Zaubertrick **Heiliges Licht** (Rettungswurf Geschick, 1W8) · 2 Plätze: **Heilendes Wort** (Bonusaktion, 1W4+3 auf 6 Felder), **Segen** (+1W4 auf Angriffe von 3 Verbündeten) | 3 Plätze · **Untote vertreiben** (Untote in 6 Feldern fliehen, 1× je Rast) | 4 Plätze, davon 2 vom 2. Grad · **Schutzkreis** (Verbündete im Umkreis +2 RK, 3 Runden) |
| Wildnisläufer | Langbogen 1W8+3, 20 Felder · **Jägermal** (Bonusaktion: +1W6 Schaden gegen ein markiertes Ziel) · Vorteil auf Wahrnehmung im Freien | **Bogenschütze:** +2 auf Fernkampf | **Doppelschuss** (zwei Ziele nebeneinander, je ein Angriff) |

**Persönlichkeitstest:** acht kurze Fragen mit je vier Antworten, jede Antwort gewichtet die fünf Klassen. Der Test schlägt eine Klasse mit Begründung vor. Jede Person kann trotzdem frei wählen. Gespeichert wird nur die gewählte Figur, nicht die Antworten.

**Später (nicht im ersten Abenteuer):** je Klasse zwei weitere Figuren (insgesamt 15), Stufe 4–10.

---

## 4 · Regeln

### 4.1 Proben

- **Probe:** W20 + Attributsmodifikator (+2, wenn die Figur darin geübt ist) gegen einen **Schwierigkeitsgrad**: leicht 10 · mittel 13 · schwer 16.
- **Modifikator:** (Wert − 10) ÷ 2, abgerundet.
- **Vorteil / Nachteil:** zwei W20, der höhere bzw. niedrigere zählt.
- **Gruppenprobe** (z. B. leise schleichen): Gelingt sie der Hälfte, gelingt sie allen.

### 4.2 Kampf

- **Initiative:** W20 + Geschick. Die Reihenfolge steht sichtbar am Rand.
- **Ein Zug:** Bewegung bis zu 6 Feldern, dazu **eine Aktion** (Angriff, Zauber, Spurt, Helfen, Gegenstand, Ausweichen) und gegebenenfalls **eine Bonusaktion**. Reaktionen außerhalb des eigenen Zugs.
- **Angriff:** W20 + Modifikator + 2 gegen die Rüstungsklasse. Eine **20** ist ein kritischer Treffer (Schadenswürfel doppelt), eine **1** verfehlt immer.
- **Gelände:** Wände blockieren Sicht und Weg. Kisten und Säulen geben Deckung (+2 RK). Schwieriges Gelände kostet doppelte Bewegung.
- **Gelegenheitsangriff:** Wer ein Feld neben einem Gegner verlässt, ohne sich zurückzuziehen, kann einmal angegriffen werden.
- **0 TP:** Die Figur liegt am Boden. Ein Verbündeter kann sie mit einer Aktion stabilisieren (sie steht mit 1 TP wieder auf) oder heilen. Liegt die **ganze Gruppe** am Boden, zieht sie sich zum letzten Lagerfeuer zurück. Figuren sterben nicht dauerhaft.

### 4.3 Rast

- **Kurze Rast** (einmal je Abschnitt): Jede Figur heilt die Hälfte ihrer fehlenden TP, Fähigkeiten „1× je Rast“ kommen zurück.
- **Lange Rast** nur an **Lagerfeuern** (eins pro Abschnitt): alles voll, Zauberplätze zurück.

### 4.4 Aufstieg und Beute

- **Aufstieg nach Meilensteinen:** Stufe 2 nach Abschnitt 1, Stufe 3 nach Abschnitt 2. Erfahrungspunkte werden trotzdem angezeigt (fürs Gefühl und für spätere Abenteuer), entscheiden aber im ersten Abenteuer nicht über den Aufstieg. Das hält das Balancing einfach.
- **Beute:** Gold, Heiltränke (2W4+2), einige feste magische Gegenstände (z. B. *Umhang der Dämmerung*: einmal je Rast unsichtbar bis zum nächsten Angriff). Ausrüstung wird beim Fund einer Figur zugeteilt, wenn nötig per Abstimmung.

### 4.5 Kleine Gruppen

Eine Gruppe hat immer **mindestens 3 Figuren**. Bei 1 oder 2 Personen steuert jede Person mehrere Figuren. Mit 4 bis 6 Personen spielt jede Person eine eigene Figur. Gegnergruppen wachsen mit der Zahl der Figuren (fest in den Begegnungsdaten hinterlegt, zum Beispiel 3 Rostkäfer bei 3 Figuren, 5 bei 5).

---

## 5 · Gegner (eigene Kreaturen)

| Gegner | RK | TP | Angriff | Besonderheit | Abschnitt |
|---|---|---|---|---|---|
| **Rostkäfer** | 13 | 9 | Biss +3, 1W6+1 | Treffer verrostet Metall: −1 RK für den Kampf | 1 |
| **Schattenkobold** | 13 | 7 | Dolch +4, 1W4+2 | flieht bei unter 3 TP, kann Verstärkung holen | 1, 2 |
| **Knochenwächter** | 13 | 13 | Kurzschwert +4, 1W6+2 | anfällig für Wucht, gegen Untote vertreiben | 2 |
| **Pilzbrut** | 5 | 18 | Sporen: Rettungswurf Konstitution SG 12, sonst vergiftet | bewegt sich nicht, platzt bei 0 TP | 2 |
| **Netzweber** | 14 | 26 | Biss +5, 1W10+3 | Netz: festgehalten bis zur Stärke-Probe SG 12 | 2 |
| **Aschehund** | 13 | 22 | Biss +5, 2W6+3 | Glutatem (Kegel 3 Felder, 3W6, Rettungswurf halbiert), alle 3 Runden | 3 |
| **Grabritter** | 17 | 45 | Zweihänder +6, 2W6+4 | Zwischengegner, schützt den Durchgang | 3 |
| **Der Abt ohne Namen** | 14 | 70 | Fluchhand +6, 2W8 | Endgegner in zwei Phasen, siehe Abschnitt 6 | 3 |

Alle Zahlen sind ein erster Vorschlag und werden im Prototyp ausbalanciert.

---

## 6 · Das erste Abenteuer: Das Siegel von Grauwacht

**Aufhänger:** Im Dorf **Halmbruck** läutet seit drei Nächten die Glocke der verlassenen Abtei **Grauwacht**, obwohl dort niemand mehr lebt. Die Brunnen werden bitter, das Vieh flieht in den Wald. Die Dorfvorsteherin bittet die Gruppe nachzusehen. Der alte Mönch **Bruder Anselm**, der einzige, der noch weiß, wie es unter der Abtei aussieht, kommt bis zum Tor mit.

### Abschnitt 1 · Die Abtei (ca. 45 Min.)

- **Halmbruck** (keine Karte, Gespräch): Was ist passiert? Proben auf Wahrnehmung und Überzeugen bringen Hinweise (Glocke, bittere Brunnen, Spuren kleiner Füße).
- **Der Klostergarten** (Karte 1): erster Kampf gegen **Rostkäfer**, Deckung durch Grabsteine.
- **Der Glockenturm:** Schattenkobolde haben die Glocke als Alarm missbraucht. Kampf oder Verhandlung (Charisma-Probe). Ein **gefangener Kobold** bietet an, den Weg nach unten zu zeigen.
- **Gruppenentscheidung:** Kobold mitnehmen (kennt Abkürzungen, könnte verraten) oder zurücklassen.
- **Lagerfeuer** im Kreuzgang → **Stufe 2**.

### Abschnitt 2 · Die Krypta (ca. 60 Min.)

- **Die Gruft der Brüder** (Karte 2): **Knochenwächter** erheben sich, Fallen im Boden (Schurke im Vorteil).
- **Das Glockenrätsel:** Vier kleine Glocken mit Inschriften, die in der richtigen Reihenfolge geschlagen werden müssen. Die Hinweise stehen auf Grabplatten im ganzen Raum, jede Person sieht nur, was ihre Figur liest. Das Rätsel ist nur gemeinsam lösbar.
- **Die Pilzkammer:** **Pilzbrut** in engen Gängen. Wer den Kobold dabei hat, kennt einen Umweg (Verzweigung).
- **Das Netz** (Karte 3): Kampf gegen den **Netzweber** an einem Schacht.
- **Lagerfeuer** in der alten Bibliothek, mit Anselms Tagebuch → **Stufe 3**.

### Abschnitt 3 · Das Siegel (ca. 45 Min.)

- **Die Halle der Asche** (Karte 4): **Aschehunde** und der **Grabritter**, der das Siegel bewacht.
- **Die Siegelkammer** (Karte 5): **Der Abt ohne Namen**, ein vor dreihundert Jahren eingesiegelter Magier.
  - **Phase 1:** Er greift aus der Mitte des Siegels an und ruft Knochenwächter.
  - **Phase 2** (ab der Hälfte seiner TP): Das Siegel bricht, der Raum verändert sich. Auf dem Raster brennen Felder, die Gruppe muss die vier Siegelsteine an den Ecken berühren, um ihn zu schwächen.
- **Wendung:** Bruder Anselm ist der letzte Nachfahre der Mönche, die den Abt einst einsiegelten. Er hat die Glocke selbst geläutet, um Hilfe zu holen, weil er allein nicht mehr stark genug war.
- **Gruppenentscheidung am Ende:**
  - **Das Siegel erneuern:** Anselm bleibt als Wächter in der Abtei. Die Brunnen werden süß, die Glocke schweigt.
  - **Das Siegel zerbrechen und die Kraft befreien:** Ein mächtiger Gegenstand für die Gruppe, aber die Splitterlande verändern sich, was das nächste Abenteuer prägt.

Beide Enden sind gut spielbar, und beide werden auf dem Gerät gespeichert.

---

## 7 · Darstellung

- **Draufsicht auf einem quadratischen Raster**, wie eine Spielmatte am Tisch. Jede Karte etwa 20 × 14 Felder.
- Gezeichnet aus Code (SVG/Canvas) wie bisher, ohne fremde Grafiken. Figuren als Plättchen mit Klassensymbol und Farbe der spielenden Person.
- **Erzählfenster** für Szenen, Gespräche und Entscheidungen. **Charakterbogen** und Inventar per Tippen.
- **Handy zuerst:** Karte verschieben und zoomen, Felder antippen, große Knöpfe für Aktionen.

---

## 8 · Technik

### 8.1 Mehrspieler auf der vorhandenen Plattform

Es entsteht **keine neue Datenbank**. Verwendet werden die vorhandenen Sitzungen (`create_game_session`, `join_game_session`), der gemeinsame Spielstand (`set_session_state`) und die anonyme Anmeldung. In Supabase ist nur **ein neuer Eintrag in `game_catalog`** nötig (Kennung `abenteuer`, Code-Präfix `ABEN`, bis zu 6 Personen). Die SQL-Zeile bekommst du von mir zum Ausführen.

**Die Gastgeberin oder der Gastgeber führt die Regeln aus.**
- Das Gerät, das die Sitzung eröffnet, ist der **Spieltisch**: Es würfelt, prüft Züge, bewegt Gegner und schreibt den Stand unter `spiel` mit fortlaufender Nummer.
- Alle anderen schicken nur **Absichten** unter ihrem eigenen Schlüssel (`zug:<Gerät>`), zum Beispiel „Figur 3 bewegt sich nach 7/4 und greift Gegner 2 an“. Der Spieltisch prüft und übernimmt sie oder lehnt sie mit einer Meldung ab.
- **Abstimmungen** schreibt jedes Gerät unter `stimme:<Gerät>`.
- So sehen alle dasselbe, und es gibt keine widersprüchlichen Würfe.

**Ehrliche Grenze:** Wer den Spieltisch führt, könnte im Browser schummeln. Bei einem Koop-Spiel unter Freunden ist das kein echtes Problem. Ranglisten oder Spiele mit Fremden gibt es deshalb bewusst nicht.

**Verbindung bricht ab:** Jedes Gerät hält den letzten Stand. Verlässt der Spieltisch die Sitzung, schließt die Plattform sie. Der Spieltisch kann dann aus seinem gespeicherten Stand eine neue Sitzung eröffnen, die anderen treten mit dem neuen Code wieder bei und übernehmen ihre Figuren.

### 8.2 Speichern auf dem Gerät

- **Die eigene Figur** (Klasse, Name, Stufe, Erfahrung, Ausrüstung, Gold, gewähltes Ende) liegt im Browser (`localStorage`) und wird nach jedem Abschnitt gespeichert.
- **Der Spielstand** einer Partie liegt beim Spieltisch und bei allen Mitspielenden. Eine Partie lässt sich an einem Lagerfeuer unterbrechen und später fortsetzen.
- **Gerät wechseln:** Unter „Figur sichern“ lässt sich die Figur als kurzer Code kopieren und auf einem anderen Gerät einfügen. Keine Anmeldung nötig.
- **Schutz:** Beim Laden wird geprüft, ob die Werte zur Stufe passen. Offensichtlich veränderte Figuren werden auf gültige Werte zurückgesetzt.

### 8.3 Aufbau der Dateien

```
abenteuer/
  index.html            Einstieg, Figur wählen, Test, Sitzung
  js/regeln.js          Würfel, Proben, Kampf, Aufstieg (ohne Darstellung, testbar)
  js/spieltisch.js      führt Szenen und Kämpfe aus, verarbeitet Absichten
  js/karte.js           Rasterkarte, Bewegung, Sichtlinien
  js/oberflaeche.js     Erzählfenster, Charakterbogen, Aktionsleiste
  js/mehrspieler.js     Anbindung an platform/multiplayer
  daten/klassen.json    fünf Klassen mit Werten und Fähigkeiten
  daten/gegner.json     Gegnerwerte
  daten/test.json       Persönlichkeitstest
  daten/grauwacht/      Szenen, Karten, Begegnungen, Texte des ersten Abenteuers
  tests/                Regeltests und Browsertests
```

---

## 9 · Umsetzung in Schritten

| Schritt | Inhalt | Ergebnis zum Anschauen |
|---|---|---|
| 1 · Prototyp Kampf | Regeln, eine Karte, 3 Figuren gegen Rostkäfer, allein auf einem Gerät | ein spielbarer Kampf im Browser |
| 2 · Mehrspieler | Spieltisch, Absichten, Abstimmung, Wiederbeitreten | derselbe Kampf zu zweit auf zwei Handys |
| 3 · Figuren | fünf Klassen, Test, Charakterbogen, Speichern auf dem Gerät, Sicherungscode | Figur wählen und behalten |
| 4 · Abschnitt 1 | Dorf, Garten, Glockenturm, Kobold-Entscheidung, Lagerfeuer, Stufe 2 | ein erstes Stück Geschichte |
| 5 · Abschnitte 2 und 3 | Krypta, Rätsel, Endgegner, zwei Enden | das ganze Abenteuer |
| 6 · Feinschliff | Balancing, Handy-Bedienung, Tests, Kachel auf der Startseite | veröffentlichungsbereit |

Nach jedem Schritt kannst du spielen und entscheiden, ob es weitergeht.

---

## 10 · Zur Freigabe

1. **Name** des Bereichs auf der Startseite: Vorschlag „Abenteuer“, Untertitel „Fantasy-Rollenspiel für 1–6 Personen“.
2. **Welt** „die Splitterlande“, erstes Abenteuer „Das Siegel von Grauwacht“.
3. **Ton:** düster, aber nicht grausam, ab 12 Jahren.
4. **Regeln** wie in Abschnitt 4, besonders: Aufstieg nach Meilensteinen, kein dauerhafter Tod, mindestens 3 Figuren je Gruppe.
5. **Spieltisch-Prinzip** (Abschnitt 8.1) mit der ehrlichen Grenze beim Schummeln.
6. **Reihenfolge der Umsetzung** (Abschnitt 9), beginnend mit dem Kampf-Prototyp.
