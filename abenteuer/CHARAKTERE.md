# Die 15 Charaktere – Stufe 1 bis 3

**Case Unlocked · Abenteuer · Die Splitterlande**
Stand 0.2 · in der Engine (`js/figuren.js`, `js/regeln.js`). Die Zahlen sind mit der Kampf-Simulation `tools/simulation.js` abgestimmt (Abschnitt 7).

Fünf Klassen mit je drei Charakteren. Jede Figur hat:
- **Grundangriff:** immer verfügbar
- **Klassenmerkmal:** gleich für alle drei Figuren der Klasse
- **Passiv:** wirkt immer
- **Zwei aktive Fähigkeiten**
- **Eine Fähigkeit außerhalb des Kampfes:** bei Proben, Erkunden und Gesprächen
- **Stufe 2 und Stufe 3:** je ein neuer Baustein
- **Versuchung des Abts** und **eigener Moment in Grauwacht**

---

## 1 · Gemeinsame Regeln

| | |
|---|---|
| **Werte** | Alle Figuren verteilen dieselben sechs Zahlen 16, 14, 13, 12, 10, 8 (Ausnahme Inquisitor: 16, 14, 14, 10, 10, 8). Modifikator = (Wert − 10) ÷ 2, abgerundet. |
| **Übung** | +2 auf Angriffe, Rettungswürfe der eigenen Klasse und geübte Proben (Stufe 1–3) |
| **Angriff** | W20 + Modifikator + 2 gegen RK. Hauptwert 16 heißt immer **+5 zum Treffen**. |
| **Schwierigkeit (SG)** eigener Zauber und Tricks | 8 + 2 + Modifikator = **13** bei Hauptwert 16 |
| **TP** | Stufe 1: höchster Wert des Trefferwürfels + KON. Jede weitere Stufe: halber Würfel + 1 + KON. |
| **Bewegung** | 6 Felder, schräg wie gerade |
| **Rast** | „je Rast“ heißt: kommt bei kurzer **und** langer Rast zurück. „je lange Rast“ heißt: nur am Lagerfeuer. Hardcore kennt keine kurze Rast (siehe Abenteuerbuch). |
| **Zustände** | **verlangsamt** (halbe Bewegung, keine Reaktion) · **festgehalten** (Bewegung 0, Angriffe gegen das Ziel mit Vorteil) · **verängstigt** (muss sich entfernen, greift nicht an) · **geblendet** (Nachteil auf Angriffe, Angriffe gegen das Ziel mit Vorteil) · **liegend** (Nahangriffe gegen das Ziel mit Vorteil, Aufstehen kostet 3 Felder) · **vergiftet** (Nachteil auf Angriffe und Proben) |

### Klassenmerkmale

| Klasse | Würfel | Merkmal (alle drei Figuren) | ab Stufe 2 |
|---|---|---|---|
| **Krieger** | W10 | **Zweiter Atem:** Bonusaktion, heilt 1W10 + Stufe, 1× je Rast | **Tatendrang:** eine zusätzliche Aktion, 1× je lange Rast |
| **Zauberer** | W8 | **Arkaner Schutz:** RK 11 + GES ohne Rüstung (13). **Arkane Wucht:** Zaubertricks + INT Schaden. **Zauberplätze** 3 / 4 / 5, ab Stufe 3 davon 2 vom 2. Grad | – |
| **Schurke** | W8 | **Hinterhalt:** +1W6 (ab Stufe 2: +2W6) einmal je Zug, wenn mit Vorteil oder ein Verbündeter neben dem Ziel steht | **Gerissene Aktion:** Bonusaktion Spurt, Verstecken oder Rückzug |
| **Kleriker** | W8 | **Heilendes Wort:** Bonusaktion, Platz, 1W4 + WEI auf 6 Felder, auch am Boden. **Zauberplätze** 3 / 4 / 5, ab Stufe 3 davon 2 vom 2. Grad | **Göttliche Macht:** je Figur verschieden, 1× je Rast |
| **Waldläufer** | W10 | **Jägermal:** Bonusaktion, ein Ziel bis Kampfende markiert, +1W6 Schaden bei jedem Treffer, 2 / 3 / 3 je lange Rast. **Fährtenleser:** Vorteil auf Spuren und Wahrnehmung im Freien | – |

---

<!-- FIGUREN:START -->
<!-- Dieser Teil wird von tools/charaktere-doc.js aus js/figuren.js erzeugt. Nicht von Hand ändern. -->

## 2 · Krieger

### Torvald – Der Schildwächter
„Niemand fällt, solange ich stehe.“

**Rolle:** vorn, beschützt · **Werte:** STR 16 (+3) · GES 10 (+0) · KON 14 (+2) · INT 8 (-1) · WEI 13 (+1) · CHA 12 (+1)
**TP** 12 / 20 / 28 · **RK** 18 (Kettenpanzer und Schild)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Langschwert** | 1 | Aktion · Nahkampf · Angriff +5 · 1W8 + 3 | Nahkampf. |
| **Spott** | 1 | Bonusaktion · 6 Felder · 2× je Rast | Ein Gegner hat bis zu seinem nächsten Zug Nachteil gegen alle außer dir. |
| **Schildstoß** | 1 | Aktion · Nahkampf · STR-Rettung SG 13 · 1× je Kampf | STR-Rettungswurf, sonst wird das Ziel 1 Feld weggestoßen und liegt. |
| **Zweiter Atem** | 1 | Bonusaktion · heilt 1W10 + Stufe · 1× je Rast | Heilt dich um 1W10 + Stufe. |
| **Tatendrang** | 2 | frei · 1× je lange Rast | Eine zusätzliche Aktion in diesem Zug, einmal je lange Rast. |
| **Schutzhaltung** | 1 | passiv | Reaktion, automatisch: Ein Angriff gegen einen Verbündeten neben dir erfolgt mit Nachteil (ab Stufe 3 zweimal je Runde). |
| **Bollwerk** | 3 | passiv | Schutzhaltung zweimal je Runde. |
| **Stemmen** | – | außerhalb des Kampfes | Vorteil auf Stärke für Türen, Gitter, Trümmer; zieht Verbündete über Abgründe. |

**Versuchung des Abts:** „Du kannst jeden beschützen, den du je verloren hast. Ich gebe sie dir zurück.“ Wahr, aber sie kehren als Schatten zurück, die nur leben, solange das Siegel offen ist.

**Moment in Grauwacht:** Der Schacht: Er kann Tam halten, während die anderen kämpfen.

### Ragnar – Der Berserker
„Je mehr es wehtut, desto klarer sehe ich.“

**Rolle:** vorn, hoher Schaden · **Werte:** STR 16 (+3) · GES 13 (+1) · KON 14 (+2) · INT 8 (-1) · WEI 12 (+1) · CHA 10 (+0)
**TP** 12 / 20 / 28 · **RK** 12 (Fell)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Großaxt** | 1 | Aktion · Nahkampf · Angriff +5 · 1W12 + 3 | Nahkampf. |
| **Großaxt, rücksichtslos** | 1 | Aktion · Nahkampf · Angriff +5 · 1W12 + 3 | Vorteil auf deinen Angriff, aber Angriffe gegen dich haben Vorteil bis zu deinem nächsten Zug. |
| **Raserei** | 1 | Bonusaktion · 1× je Rast | Bis Kampfende: Waffenschaden gegen dich halbiert, +2 Schaden. Heilung wirkt nur halb. |
| **Zweiter Atem** | 1 | Bonusaktion · heilt 1W10 + Stufe · 1× je Rast | Heilt dich um 1W10 + Stufe. |
| **Tatendrang** | 2 | frei · 1× je lange Rast | Eine zusätzliche Aktion in diesem Zug, einmal je lange Rast. |
| **Blutrausch** | 1 | passiv | Unter halben TP: +1 Schaden und Vorteil auf Stärke-Proben. |
| **Unbändig** | 3 | passiv | Blutrausch gibt +2 statt +1 Schaden. |
| **Einschüchtern** | – | außerhalb des Kampfes | Vorteil auf Drohungen; im Glockenturm ersetzt er die Charisma-Probe. |

**Versuchung des Abts:** „Du wirst nie wieder Angst haben.“ Wahr: Er fühlt danach gar nichts mehr.

**Moment in Grauwacht:** Coldric: Hält er ihm eine Runde allein stand, nimmt Coldric den Namen leichter an.

### Isolde – Die Duellantin
„Ein Fehler. Mehr brauche ich nicht.“

**Rolle:** vorn, Einzelkampf · **Werte:** STR 10 (+0) · GES 16 (+3) · KON 14 (+2) · INT 8 (-1) · WEI 12 (+1) · CHA 13 (+1)
**TP** 12 / 20 / 28 · **RK** 15 (beschlagenes Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Rapier** | 1 | Aktion · Nahkampf · Angriff +5 · 1W8 + 3 | Nahkampf. |
| **Finte** | 1 | Bonusaktion · 2× je Rast | Dein nächster Angriff hat Vorteil und macht +1W6. |
| **Entwaffnen** | 1 | Aktion · Nahkampf · STR-Rettung SG 13 · 1× je Kampf | STR-Rettungswurf, sonst macht das Ziel 2 Runden nur halben Schaden. |
| **Zweiter Atem** | 1 | Bonusaktion · heilt 1W10 + Stufe · 1× je Rast | Heilt dich um 1W10 + Stufe. |
| **Tatendrang** | 2 | frei · 1× je lange Rast | Eine zusätzliche Aktion in diesem Zug, einmal je lange Rast. |
| **Parade** | 1 | passiv | Reaktion, automatisch: Verfehlt dich ein Nahangriff, greifst du sofort an. |
| **Klingenmeisterin** | 3 | passiv | Kritischer Treffer schon bei 19–20. |
| **Ehrenkodex** | – | außerhalb des Kampfes | Vorteil bei Gesprächen mit Rittern und Kriegern, erkennt Kampfstile. |

**Versuchung des Abts:** „Ich zeige dir den einen Gegner, den du nie besiegt hast, und lasse dich gewinnen.“ Wahr, aber der Sieg ersetzt alle anderen Erinnerungen.

**Moment in Grauwacht:** Coldric: Sie kann ihn zum Ehrenduell fordern.

## 3 · Zauberer

### Lyra – Die Gelehrte
„Alles hat eine Ordnung. Auch das hier.“

**Rolle:** hinten, Schwächen aufdecken, schützen · **Werte:** STR 8 (-1) · GES 14 (+2) · KON 13 (+1) · INT 16 (+3) · WEI 12 (+1) · CHA 10 (+0)
**TP** 9 / 15 / 21 · **RK** 13 (Arkaner Schutz) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Arkaner Funke** | 1 | Aktion · 12 Felder · Angriff +5 · 1W10 + 3 | Zaubertrick. |
| **Analyse** | 1 | Bonusaktion · 12 Felder | Der nächste Angriff gegen den Gegner (bis Rundenende) trifft gegen −2 RK; seine Werte sind für alle sichtbar. |
| **Zeitriss** | 1 | Aktion · 12 Felder · WEI-Rettung SG 13 · 1 Zauberplatz | WEI-Rettungswurf, sonst 2 Runden verlangsamt, ohne Bonusaktion und −2 RK. |
| **Bannkreis** | 3 | Aktion · 12 Felder · Radius 2 · Platz vom 2. Grad | Kreis mit 2 Feldern Radius um ein Ziel, 3 Runden: Gegner darin −2 RK. |
| **Schutzglyphe** | 1 | passiv | Reaktion, automatisch, kostet einen Platz: +5 RK für einen Verbündeten in 6 Feldern gegen einen Treffer, wenn es ihn sonst schwer erwischt. |
| **Gedankenstütze** | 2 | passiv · 2× je Rast | Automatisch, 2× je Rast: Ein Verbündeter wiederholt einen knapp misslungenen W20. |
| **Arkaner Schutz und Arkane Wucht** | 1 | passiv | RK 11 + GES ohne Rüstung. Deine Zaubertricks machen + INT Schaden. |
| **Alte Schriften** | – | außerhalb des Kampfes | Liest jede Schrift der Abtei, zusätzlicher Hinweis bei Rätseln. |

**Versuchung des Abts:** „Ich gebe dir Wissen, das niemand sonst besitzen darf.“ Wahr, aber man kann es nie wieder vergessen und nie jemandem sagen.

**Moment in Grauwacht:** Bibliothek: Sie liest Anselms Tagebuch ohne Probe vollständig.

### Vaelin – Der Elementarist
„Feuer fragt nicht.“

**Rolle:** hinten, Flächenschaden · **Werte:** STR 8 (-1) · GES 14 (+2) · KON 13 (+1) · INT 16 (+3) · WEI 12 (+1) · CHA 10 (+0)
**TP** 9 / 15 / 21 · **RK** 13 (Arkaner Schutz) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Glutpfeil** | 1 | Aktion · 12 Felder · Angriff +5 · 1W10 + 3 | Zaubertrick. Das Feld des Ziels brennt 1 Runde (1W4). |
| **Frosthauch** | 1 | Aktion · 12 Felder · Radius 1 · KON-Rettung SG 13 · 2W6 · 1 Zauberplatz | Eiswolke um ein Ziel (1 Feld Radius), 2W6 Kälte, Rettung halbiert; wer verfehlt, ist verlangsamt. |
| **Magisches Geschoss** | 1 | Aktion · 12 Felder · 1W4 ×3 + 1 · 1 Zauberplatz | Drei Pfeile, je 1W4 + 1, treffen immer. |
| **Donnerwelle** | 2 | Aktion · 6 Felder · Radius 1 · KON-Rettung SG 13 · 2W8 · 1 Zauberplatz | Donnerschlag um ein Ziel in 6 Feldern (1 Feld Radius), 2W8, Rettung halbiert, wer verfehlt, wird 2 Felder weggestoßen. |
| **Glutsphäre** | 3 | Aktion · 12 Felder · Radius 2 · GES-Rettung SG 13 · 3W6 · Platz vom 2. Grad | 3W6 Feuer in 2 Feldern Radius um ein Ziel, Rettung halbiert. |
| **Zauberformung** | 1 | passiv | Deine Flächenzauber treffen keine Verbündeten. |
| **Elementarer Nachhall** | 2 | passiv | Glutpfeil macht +1W6. |
| **Arkaner Schutz und Arkane Wucht** | 1 | passiv | RK 11 + GES ohne Rüstung. Deine Zaubertricks machen + INT Schaden. |
| **Elementarsinn** | – | außerhalb des Kampfes | Spürt Hitze, Kälte und Luftzug: findet Geheimgänge, entzündet und löscht Feuer. |

**Versuchung des Abts:** „Ich gebe dir das Feuer, das nie erlischt.“ Wahr, aber es brennt in dir weiter.

**Moment in Grauwacht:** Halle der Asche: Er kann die Glut im Boden löschen.

### Morwen – Die Schattenmagierin
„Was du siehst, entscheide ich.“

**Rolle:** hinten, Kontrolle · **Werte:** STR 8 (-1) · GES 14 (+2) · KON 13 (+1) · INT 16 (+3) · WEI 10 (+0) · CHA 12 (+1)
**TP** 9 / 15 / 21 · **RK** 14 (Arkaner Schutz und Schattenmantel) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Schattenstich** | 1 | Aktion · 12 Felder · WEI-Rettung SG 13 · 1W10 + 3 | Zaubertrick. WEI-Rettungswurf, sonst Schaden und Nachteil auf den nächsten Angriff des Ziels. |
| **Furcht** | 1 | Aktion · 12 Felder · Radius 1 · WEI-Rettung SG 13 · 1 Zauberplatz | Das Ziel und alle Gegner direkt daneben: WEI-Rettungswurf, sonst 2 Runden verängstigt. |
| **Schattenfesseln** | 1 | Aktion · 12 Felder · STR-Rettung SG 13 · 1 Zauberplatz | STR-Rettungswurf, sonst 2 Runden festgehalten. |
| **Schattenschritt** | 2 | Bonusaktion · 2× je Rast | Bis zu 6 Felder durch Schatten, über Hindernisse hinweg und ohne Gelegenheitsangriffe. |
| **Spiegelbilder** | 2 | Aktion · 1 Zauberplatz | 3 Bilder: Jeder Angriff trifft zu 50 % ein Bild statt dich. |
| **Albtraum** | 3 | Aktion · 12 Felder · Radius 1 · WEI-Rettung SG 13 · 2W8 · Platz vom 2. Grad | Das Ziel und alle Gegner direkt daneben: WEI-Rettungswurf; bei Fehlschlag 2W8 und 1 Runde verängstigt, sonst 1W8. |
| **Trugbild** | 1 | passiv | Der erste Angriff gegen dich in jeder Runde erfolgt mit Nachteil. |
| **Arkaner Schutz und Arkane Wucht** | 1 | passiv | RK 11 + GES ohne Rüstung. Deine Zaubertricks machen + INT Schaden. |
| **Blendwerk** | – | außerhalb des Kampfes | Erzeugt Geräusche und Trugbilder als Ablenkung, erkennt Illusionen. |

**Versuchung des Abts:** „Niemand wird je wieder sehen, wer du wirklich bist.“ Wahr, auch nicht die, die dich lieben.

**Moment in Grauwacht:** Das Flüstern: Sie sieht, wer ein Angebot des Abts bekommen hat.

## 4 · Schurke

### Darian – Der Schattenläufer
„Ich war nie hier.“

**Rolle:** Mitte, Fallen, Bewegung · **Werte:** STR 8 (-1) · GES 16 (+3) · KON 14 (+2) · INT 13 (+1) · WEI 12 (+1) · CHA 10 (+0)
**TP** 10 / 17 / 24 · **RK** 15 (Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Kurzschwert** | 1 | Aktion · Nahkampf · Angriff +5 · 1W6 + 3 | Nahkampf. |
| **Kurzbogen** | 1 | Aktion · 16 Felder · Angriff +5 · 1W6 + 3 | Fernkampf. |
| **Rauchbombe** | 1 | Aktion · Radius 2 · 1× je Rast | 2 Felder Radius um dich, 2 Runden: Niemand sieht hinein oder hinaus. |
| **Gerissener Spurt** | 1 | Bonusaktion | Gerissene Aktion: noch einmal so weit laufen, wie du ohnehin kannst. |
| **Verstecken** | 1 | Bonusaktion | Gerissene Aktion: Neben Deckung oder im Rauch verbirgst du dich. Dein nächster Angriff hat Vorteil, Gegner greifen lieber andere an. |
| **Rückzug** | 1 | Bonusaktion | Gerissene Aktion: Diesen Zug keine Gelegenheitsangriffe gegen dich. |
| **Leiser Schritt** | 1 | passiv | Du kannst dich auch ohne Deckung verstecken, solange kein Gegner neben dir steht. Gerissene Aktion schon ab Stufe 1. |
| **Kletterer** | 2 | passiv | Wände und Schächte ohne Probe. |
| **Fallensteller** | 3 | passiv | Vor einem Kampf, den die Gruppe kommen sieht, legt er eine Falle. |
| **Hinterhalt** | 1 | passiv | Einmal je Zug +1W6 (ab Stufe 2 +2W6), wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht. |
| **Fallen und Schlösser** | – | außerhalb des Kampfes | Entdeckt und entschärft Fallen, öffnet Schlösser ohne Schlüssel. |

**Versuchung des Abts:** „Niemand wird dich jemals wieder finden.“ Wahr, auch nicht, wenn du gefunden werden willst.

**Moment in Grauwacht:** Schmugglerpfad: Er findet ohne Nisk den Zugang zum Koboldlager.

### Silra – Die Trickserin
„Schau mal da drüben.“

**Rolle:** Mitte, Ablenkung · **Werte:** STR 8 (-1) · GES 16 (+3) · KON 13 (+1) · INT 12 (+1) · WEI 10 (+0) · CHA 14 (+2)
**TP** 9 / 15 / 21 · **RK** 14 (Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Dolch** | 1 | Aktion · 8 Felder · Angriff +5 · 1W4 + 3 | Nah oder geworfen (8 Felder). |
| **Zweiter Dolch** | 1 | Bonusaktion · 8 Felder · Angriff +5 · 1W4 | Nach einem Dolchangriff: ein zweiter Dolch, 1W4. |
| **Schmutziger Trick** | 1 | Bonusaktion · Nahkampf · GES-Rettung SG 13 · 2/2/3× je Rast | Ein Gegner neben dir: GES-Rettungswurf, sonst 1 Runde geblendet. |
| **Platztausch** | 1 | Bonusaktion · 6 Felder · 1× je Rast | Tausche den Platz mit einem Verbündeten in 6 Feldern. |
| **Gerissener Spurt** | 2 | Bonusaktion | Gerissene Aktion: noch einmal so weit laufen, wie du ohnehin kannst. |
| **Verstecken** | 2 | Bonusaktion | Gerissene Aktion: Neben Deckung oder im Rauch verbirgst du dich. Dein nächster Angriff hat Vorteil, Gegner greifen lieber andere an. |
| **Rückzug** | 2 | Bonusaktion | Gerissene Aktion: Diesen Zug keine Gelegenheitsangriffe gegen dich. |
| **Glückspilz** | 1 | passiv · 1× je Kampf | Automatisch, 1× je Kampf: einen knapp verfehlten eigenen Angriff wiederholen oder einen Gegner seinen Treffer gegen dich wiederholen lassen. |
| **Hinterhalt** | 1 | passiv | Einmal je Zug +1W6 (ab Stufe 2 +2W6), wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht. |
| **Täuschen** | – | außerhalb des Kampfes | Vorteil auf Lügen, Verkleiden, Taschendiebstahl. |

**Versuchung des Abts:** „Ich mache, dass dir jeder glaubt.“ Wahr, du wirst nie wieder wissen, ob jemand dich mag oder nur glaubt.

**Moment in Grauwacht:** Glockenturm: Sie lässt die Kobolde glauben, der Abt habe die Gruppe geschickt.

### Vex – Der Assassine
„Ein Schnitt. Kein Laut.“

**Rolle:** Mitte, Einzelziel · **Werte:** STR 8 (-1) · GES 16 (+3) · KON 13 (+1) · INT 14 (+2) · WEI 12 (+1) · CHA 10 (+0)
**TP** 9 / 15 / 21 · **RK** 14 (Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Klinge der Gilde** | 1 | Aktion · Nahkampf · Angriff +5 · 1W8 + 3 | Nahkampf. |
| **Leichte Armbrust** | 1 | Aktion · 16 Felder · Angriff +5 · 1W8 + 3 | Fernkampf. |
| **Gift** | 1 | Bonusaktion · 2× je Rast | Dein nächster Treffer macht +1W6 Gift (ab Stufe 2 +2W6), das Ziel ist 1 Runde vergiftet. |
| **Aus dem Schatten** | 1 | Bonusaktion | Neben Deckung oder im Rauch: verstecken. |
| **Gerissener Spurt** | 2 | Bonusaktion | Gerissene Aktion: noch einmal so weit laufen, wie du ohnehin kannst. |
| **Verstecken** | 2 | Bonusaktion | Gerissene Aktion: Neben Deckung oder im Rauch verbirgst du dich. Dein nächster Angriff hat Vorteil, Gegner greifen lieber andere an. |
| **Rückzug** | 2 | Bonusaktion | Gerissene Aktion: Diesen Zug keine Gelegenheitsangriffe gegen dich. |
| **Todesstoß** | 1 | passiv | Vorteil gegen Gegner, die im Kampf noch nicht gehandelt haben. |
| **Hinrichtung** | 3 | passiv | Gegner unter halben TP nehmen +1W6. |
| **Hinterhalt** | 1 | passiv | Einmal je Zug +1W6 (ab Stufe 2 +2W6), wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht. |
| **Lautlos** | – | außerhalb des Kampfes | Schaltet einen ahnungslosen Wächter ohne Kampf aus; verwischt Spuren. |

**Versuchung des Abts:** „Nenn mir einen Namen. Ich nehme ihn, und niemand wird es je wissen.“ Wahr, und Halmbruck verliert jemanden.

**Moment in Grauwacht:** Glockenturm: Er schaltet den Kobold am Glockenseil lautlos aus.

## 5 · Kleriker

### Elara – Die Lichtbringerin
„Das Licht weicht nicht.“

**Rolle:** vorn/Mitte, gegen Untote · **Werte:** STR 13 (+1) · GES 8 (-1) · KON 14 (+2) · INT 10 (+0) · WEI 16 (+3) · CHA 12 (+1)
**TP** 10 / 17 / 24 · **RK** 18 (Kettenpanzer und Schild) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Heiliges Licht** | 1 | Aktion · 12 Felder · GES-Rettung SG 13 · 1W8 + 3 | Zaubertrick. GES-Rettungswurf, sonst 1W8 + WEI gleißender Schaden. |
| **Streitkolben** | 1 | Aktion · Nahkampf · Angriff +3 · 1W6 + 1 | Nahkampf. |
| **Segen** | 1 | Aktion · 6 Felder · 1 Zauberplatz | Bis Kampfende: 3 Verbündete in 6 Feldern +1W4 auf Angriffe und Rettungswürfe. Nur ein Segen zur Zeit. |
| **Untote vertreiben** | 2 | Aktion · 6 Felder · WEI-Rettung SG 13 · 1× je Rast | Göttliche Macht: Untote in 6 Feldern fliehen 2 Runden (WEI-Rettungswurf). |
| **Schutzkreis** | 3 | Aktion · Platz vom 2. Grad | Verbündete in 2 Feldern um dich +2 RK, 3 Runden. |
| **Heilendes Wort** | 1 | Bonusaktion · 6 Felder · heilt 1W4 + WEI · 1 Zauberplatz | Heilt eine Figur in 6 Feldern um 1W4 + WEI, auch am Boden. |
| **Strahlende Aura** | 1 | passiv | Gegner neben dir nehmen zu Beginn ihres Zugs 2 gleißenden Schaden, Untote 3. |
| **Geweihtes Wissen** | – | außerhalb des Kampfes | Erkennt Flüche und Untote; bringt schwache Untote ohne Kampf zur Ruhe. |

**Versuchung des Abts:** „Ich mache den Tod eines Unschuldigen rückgängig. Wähle.“ Wahr, aber ein anderer Unschuldiger nimmt seinen Platz.

**Moment in Grauwacht:** Gruft: Sie kann die Knochenwächter segnen statt zerschlagen.

### Brogar – Der Wanderheiler
„Erst die Wunde. Dann die Frage.“

**Rolle:** Mitte, Heilung, Schutz · **Werte:** STR 8 (-1) · GES 13 (+1) · KON 14 (+2) · INT 12 (+1) · WEI 16 (+3) · CHA 10 (+0)
**TP** 10 / 17 / 24 · **RK** 15 (Schuppenpanzer) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Dornenranke** | 1 | Aktion · 8 Felder · GES-Rettung SG 13 · 1W8 + 3 | Zaubertrick. GES-Rettungswurf, sonst Schaden und 1 Runde verlangsamt. |
| **Schild des Glaubens** | 1 | Bonusaktion · 6 Felder · 1 Zauberplatz | Ein Verbündeter +2 RK bis Kampfende. |
| **Lebenshauch** | 1 | Aktion · 6 Felder · 1× je Kampf | Ein Verbündeter am Boden in 6 Feldern steht mit 1 TP auf. |
| **Bewahren** | 2 | Aktion · 6 Felder · 1× je Rast | Göttliche Macht: 5 × Stufe TP auf Verbündete in 6 Feldern verteilen. |
| **Massenheilwort** | 3 | Bonusaktion · 6 Felder · heilt 1W4 + WEI · Platz vom 2. Grad | 3 Verbündete je 1W4 + 3 (+ Gesegnete Heilung). |
| **Heilendes Wort** | 1 | Bonusaktion · 6 Felder · heilt 1W4 + WEI · 1 Zauberplatz | Heilt eine Figur in 6 Feldern um 1W4 + WEI, auch am Boden. |
| **Gesegnete Heilung** | 1 | passiv | Deine Heilzauber heilen zusätzlich 2 + Grad des Platzes. |
| **Kräuterkunde** | – | außerhalb des Kampfes | Erkennt Gifte und Flüche; nach jedem Kampf heilt die Gruppe je 1W4. |

**Versuchung des Abts:** „Ich zeige dir, wie man jede Wunde schließt.“ Wahr, aber jede geschlossene Wunde öffnet sich bei dir.

**Moment in Grauwacht:** Halmbruck: Er sieht sofort, dass Anselm Blut hustet.

### Seran – Der Inquisitor
„Ich frage nur einmal.“

**Rolle:** vorn, Flüche, Bann · **Werte:** STR 16 (+3) · GES 8 (-1) · KON 14 (+2) · INT 10 (+0) · WEI 14 (+2) · CHA 10 (+0)
**TP** 10 / 17 / 24 · **RK** 18 (Kettenpanzer und Schild) · **Zauberplätze** 3 / 4 / 3+2

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Kriegshammer** | 1 | Aktion · Nahkampf · Angriff +5 · 1W8 + 3 | Nahkampf. |
| **Brandmal** | 1 | Bonusaktion · 12 Felder · 1 Zauberplatz | 1× je Kampf ohne Platz: Deine Treffer gegen das Ziel machen +1W4 (ab Stufe 3 +2W6). |
| **Befehl: Flieh!** | 1 | Aktion · 12 Felder · WEI-Rettung SG 12 · 1 Zauberplatz | WEI-Rettungswurf, sonst flieht das Ziel 1 Runde. |
| **Bannen** | 2 | Aktion · 12 Felder · WEI-Rettung SG 12 · 1× je Rast | Göttliche Macht: Ein Untoter oder Fluchwesen ist 2 Runden aus dem Kampf verbannt. |
| **Heilendes Wort** | 1 | Bonusaktion · 6 Felder · heilt 1W4 + WEI · 1 Zauberplatz | Heilt eine Figur in 6 Feldern um 1W4 + WEI, auch am Boden. |
| **Wahrheitsblick** | 1 | passiv | Vorteil, Lügen zu erkennen; sieht Illusionen und Unsichtbares in 2 Feldern. |
| **Gerechter Zorn** | 3 | passiv | Brandmal +2W6. |
| **Verhör** | – | außerhalb des Kampfes | Erkennt Flüche, Pakte und Lügen; Vorteil, um Anselm zu durchschauen. |

**Versuchung des Abts:** „Ich zeige dir jede Lüge, die man dir je erzählt hat.“ Wahr, alle, auch die gnädigen.

**Moment in Grauwacht:** Das Flüstern: Er spürt, wer einen Pakt angenommen hat.

## 6 · Waldläufer

### Kael – Der Wildnisläufer
„Ich sehe dich, lange bevor du mich siehst.“

**Rolle:** hinten, Fernkampf, Spuren · **Werte:** STR 10 (+0) · GES 16 (+3) · KON 13 (+1) · INT 12 (+1) · WEI 14 (+2) · CHA 8 (-1)
**TP** 11 / 18 / 25 · **RK** 14 (Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Langbogen** | 1 | Aktion · 20 Felder · Angriff +5 (Stufe 2+: +6) · 1W8 + 3 | Fernkampf, ab Stufe 2 +1 zum Treffen. |
| **Fesselnder Pfeil** | 1 | Aktion · 20 Felder · Angriff +5 (Stufe 2+: +6) · 1W8 + 3 · 2× je Rast | Treffer und STR-Rettungswurf, sonst festgehalten (befreit sich mit Glück nach 1 Runde). |
| **Doppelschuss** | 3 | Aktion · 20 Felder · Angriff +5 (Stufe 2+: +6) · 1W8 + 3 · 2× je Rast | Zwei Ziele nebeneinander, je ein Angriff. |
| **Jägermal** | 1 | Bonusaktion · 20 Felder · 2/3/3× je lange Rast | Markiert einen Gegner bis Kampfende: +1W6 Schaden bei jedem deiner Treffer. Fällt das Ziel, kannst du das Mal ohne Einsatz weitergeben. |
| **Scharfes Auge** | 1 | passiv | Ignoriert Deckung. |
| **Leichtfüßig** | 1 | passiv | Nach einem Schuss bis zu 2 Felder ohne Gelegenheitsangriff. |
| **Bogenschütze** | 2 | passiv | +1 auf Fernkampf. |
| **Fährtenleser** | 1 | passiv | Vorteil auf Spuren und Wahrnehmung im Freien. |
| **Fährtenleser** | – | außerhalb des Kampfes | Liest Spuren genau, findet sichere Wege. |

**Versuchung des Abts:** „Du wirst nie wieder jemanden verlieren, den du beschützen willst.“ Wahr, weil du niemanden mehr nah genug heranlässt.

**Moment in Grauwacht:** Halmbruck: Er liest an Tams Spuren, dass der Junge im Schlaf ging.

### Faye – Die Tiergefährtin
„Grau geht vor. Ich folge.“

**Rolle:** Mitte, mit Wolf · **Werte:** STR 10 (+0) · GES 16 (+3) · KON 13 (+1) · INT 12 (+1) · WEI 14 (+2) · CHA 8 (-1)
**TP** 9 / 16 / 23 · **RK** 14 (Leder) · **Wolf Grau:** TP 8 / 12 / 20, RK 13, Biss +4/+4/+5, 1W6 + 2, 8 Felder

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Kurzschwert** | 1 | Aktion · Nahkampf · Angriff +5 · 1W6 + 3 | Nahkampf. |
| **Kurzbogen** | 1 | Aktion · 16 Felder · Angriff +5 · 1W6 + 3 | Fernkampf. |
| **Befehl an Grau** | 1 | Bonusaktion · 20 Felder | Grau läuft bis zu 8 Felder zum Ziel und beißt. |
| **Grau: Umreißen** | 1 | Bonusaktion · 20 Felder · 2× je Rast | Wie Befehl, dazu STR-Rettungswurf, sonst liegt das Ziel. |
| **Jägermal** | 1 | Bonusaktion · 20 Felder · 2/3/3× je lange Rast | Markiert einen Gegner bis Kampfende: +1W6 Schaden bei jedem deiner Treffer. Fällt das Ziel, kannst du das Mal ohne Einsatz weitergeben. |
| **Rudeltaktik** | 1 | passiv | Du und Grau habt Vorteil gegen ein Ziel, neben dem der andere steht. |
| **Eingespielt** | 2 | passiv | Grau beißt am Ende deines Zugs auch ohne Befehl, wenn er neben einem Gegner steht, den du getroffen hast. |
| **Ein Rudel** | 3 | passiv | Jägermal gilt auch für Grau, Grau +1 zum Treffen. |
| **Fährtenleser** | 1 | passiv | Vorteil auf Spuren und Wahrnehmung im Freien. |
| **Witterung** | – | außerhalb des Kampfes | Grau riecht Untote und Hinterhalte. Die Gruppe kann nicht überrascht werden. |

**Versuchung des Abts:** „Ich gebe deinem Wolf eine Stimme, und er wird nie sterben.“ Wahr, aber er wird nicht mehr dein Wolf sein.

**Moment in Grauwacht:** Der Schacht: Grau findet Tam zuerst und beruhigt ihn.

### Orin – Der Kopfgeldjäger
„Jeder hat einen Preis. Und eine Schwäche.“

**Rolle:** hinten, markiert und erlegt · **Werte:** STR 10 (+0) · GES 16 (+3) · KON 13 (+1) · INT 12 (+1) · WEI 14 (+2) · CHA 8 (-1)
**TP** 11 / 18 / 25 · **RK** 15 (beschlagenes Leder)

| Fähigkeit | Stufe | Werte | Wirkung |
|---|---|---|---|
| **Leichte Armbrust** | 1 | Aktion · 16 Felder · Angriff +5 · 1W8 + 3 | Fernkampf. |
| **Netz** | 1 | Aktion · 6 Felder · STR-Rettung SG 13 · 1× je Rast | STR-Rettungswurf, sonst festgehalten, bis es sich befreit (Aktion, STR gegen SG 13). |
| **Jägermal** | 1 | Bonusaktion · 20 Felder · 2/3/3× je lange Rast | Markiert einen Gegner bis Kampfende: +1W6 Schaden bei jedem deiner Treffer. Fällt das Ziel, kannst du das Mal ohne Einsatz weitergeben. |
| **Schwachstelle** | 1 | passiv | Gegen dein markiertes Ziel kritisch bei 19–20. |
| **Fangschuss** | 1 | passiv | Reaktion, automatisch: Bewegt sich dein markiertes Ziel, schießt du einmal. |
| **Jagdvorbereitung** | 2 | passiv | Zu Beginn jedes Kampfes ist ein Gegner schon markiert (ohne Einsatz). |
| **Erlegen** | 3 | passiv · 1× je Kampf | 1× je Kampf gegen dein markiertes Ziel unter halben TP: +2W6. |
| **Fährtenleser** | 1 | passiv | Vorteil auf Spuren und Wahrnehmung im Freien. |
| **Steckbriefe** | – | außerhalb des Kampfes | Kennt Kreaturen: vor einem Kampf eine Schwäche des Gegners. |

**Versuchung des Abts:** „Nenn mir den Einen, den du nie gefunden hast. Ich bringe ihn dir.“ Wahr, er steht vor dir und hat dein Gesicht.

**Moment in Grauwacht:** Halmbruck: Er erkennt Wennas Vater auf einem alten Steckbrief.

<!-- FIGUREN:END -->

---

## 7 · Wie ausbalanciert wurde

**Werkzeug:** `node abenteuer/tools/balance.js` rechnet alle 15 Figuren auf allen drei Stufen durch und schlägt fehl, sobald eine Figur aus dem Band fällt.

**Was gemessen wird:**
- **Angriff:** eigener Schaden pro Runde, gemittelt über einen Kampf, inklusive begrenzter Fähigkeiten, plus der Schaden, den die Figur Verbündeten verschafft (Analyse, Segen, Fesseln …).
- **Schutz:** eigene TP, umgerechnet nach Rüstungsklasse und danach, wie oft die Figur angegriffen wird (vorn mehr, hinten weniger), plus Heilung und verhinderter Schaden für die Gruppe.
- **Gruppenbeitrag:** Wie stark ist eine Vierergruppe aus drei Durchschnittsfiguren **plus dieser Figur**? Gemessen wird Angriff × Schutz der Gruppe. Dieses Maß ist fairer als ein Einzelwert: Ein Heiler macht wenig Schaden, aber seine Gruppe hält länger.

**Annahmen:**
- 4 Runden je Kampf.
- 2 Kämpfe je kurzer Rast und 3 Kämpfe je langer Rast.
- Referenzgegner je Stufe: RK 13 / 13 / 14, Angriff +4 / +4 / +5, 6 / 7 / 8 Schaden.

**Ergebnis:** Alle 45 Werte (15 Figuren × 3 Stufen) liegen innerhalb **±5 %** Gruppenbeitrag.

| Stufe 1 | Schaden/Runde | Gruppe | | Stufe 3 | Schaden/Runde | Gruppe |
|---|---|---|---|---|---|---|
| Schildwächter | 5,1 | +1,4 % | | Schildwächter | 5,3 | −3,1 % |
| Berserker | 10,2 | +3,7 % | | Berserker | 11,6 | +2,6 % |
| Duellant | 8,3 | +4,3 % | | Duellant | 8,6 | −4,5 % |
| Gelehrter | 5,1 | −2,7 % | | Gelehrter | 4,3 | −2,3 % |
| Elementarist | 8,7 | −1,2 % | | Elementarist | 11,6 | +1,0 % |
| Schattenmagier | 3,5 | −5,0 % | | Schattenmagier | 5,6 | +1,0 % |
| Schattenläufer | 7,5 | −1,8 % | | Schattenläufer | 9,3 | +3,3 % |
| Trickser | 6,4 | +1,4 % | | Trickser | 7,7 | +0,1 % |
| Assassine | 8,1 | −4,8 % | | Assassine | 10,4 | +2,3 % |
| Lichtbringer | 3,5 | −4,4 % | | Lichtbringer | 3,3 | −4,3 % |
| Wanderheiler | 5,0 | −1,1 % | | Wanderheiler | 4,5 | −0,8 % |
| Inquisitor | 7,0 | −4,9 % | | Inquisitor | 8,3 | −3,7 % |
| Wildnisläufer | 6,7 | +3,6 % | | Wildnisläufer | 9,8 | +3,8 % |
| Tiergefährte | 7,9 | +4,9 % | | Tiergefährte | 9,0 | +2,5 % |
| Kopfgeldjäger | 7,0 | +3,5 % | | Kopfgeldjäger | 7,8 | −1,9 % |

Die vollständige Tabelle mit Stufe 2 und den Werten für Angriff und Schutz gibt das Werkzeug aus.

**Was beim Abstimmen geändert wurde** (gegenüber Konzept und Prototyp):
- **Zauberer:**
  - W8 statt W6.
  - Dauerhafter Arkaner Schutz (RK 13).
  - Zaubertricks mit +INT Schaden.
  - 3/4/5 Plätze.
  - Ohne das hatten sie in kurzen Kämpfen 15 % weniger Gruppenbeitrag.
- **Kleriker:** ebenfalls 3/4/5 Plätze.
- **Berserker:** W10 statt W12, Blutrausch +1 statt +2.
- **Kopfgeldjäger:** leichte statt schwere Armbrust, sein Jägermal gibt nur +1W4.
- **Tiergefährte:**
  - Der Wolf greift nur auf Befehl an.
  - Befehl und Jägermal teilen sich die Bonusaktion.
  - Der Wolf hat weniger TP.
- **Wildnisläufer:** Bogenschütze +1 statt +2.
- **Duellant:** Finte 2× statt 3× je Rast.
- **Schattenläufer:** Ausweichen auf Stufe 3 durch Fallensteller ersetzt.
- **Inquisitor:** Brandmal einmal je Kampf ohne Platz.
- **Schildwächter:** RK 19 auf Stufe 3.

**Ehrliche Grenze:** Das ist ein **Rechenmodell**, keine gespielte Simulation. Es zeigt, dass keine Figur auf dem Papier deutlich stärker oder schwächer ist. Den nächsten Schritt mache ich, wenn die Figuren in der Kampf-Engine stecken:
- je Figur und Stufe 300 automatisch gespielte Kämpfe gegen die echten Grauwacht-Gegner,
- in gemischten Gruppen,
- für Normal und Hardcore.

Weicht etwas ab, korrigiere ich es dort. Positionsspiel wie Spott, Leichtfüßig oder Platztausch steckt im Modell nur grob in „wie oft angegriffen“. Das zeigt erst die Simulation genau.

---

## 8 · Zur Freigabe

1. Die **15 Figuren**, ihre Rollen und Fähigkeiten
2. Die **Änderungen beim Abstimmen** (Abschnitt 7), besonders die stärkeren Zauberer
3. Die **15 Versuchungen**: Jede ist wahr, aber mit einem Haken.
4. Die **15 Momente** in Grauwacht. Sie greifen in Szenen aus dem Abenteuerbuch ein und kommen in 0.2 mit hinein.
5. **Reihenfolge:** zuerst die Figuren in die Engine (Kampf mit allen 15, Charakterwahl auf dem Handy, Simulation), dann das Abenteuerbuch 0.2.
