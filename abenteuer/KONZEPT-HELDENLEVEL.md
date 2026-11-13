# MYTHARA – Heldenlevel: Aufstieg außerhalb der Kampagnen

**Status:** Konzept, **nicht umgesetzt**. Geplant für den **Launch** (nach der Open Beta).
**Stand:** 13. November 2026, Fassung 2 (Fähigkeiten auf Stufe 3 und 7, sonst Verbesserungen, Meistertitel auf Stufe 10). Grundlage: Abstimmung im Projekt vom 13. November 2026, Simulationen mit der heutigen Engine (`tools/stufen-sim.js`, `tools/balance-helden.js`).
**Baut auf:** [KONZEPT-HELDENFREISCHALTUNG.md](KONZEPT-HELDENFREISCHALTUNG.md). Die Freischaltung kommt zur Open Beta, das Heldenlevel zum Launch.

---

## 1. Leitidee

Heute steigen die Helden **innerhalb** einer Kampagne auf: Sie beginnen auf Stufe 1 und erreichen an den Lagerfeuern Stufe 2 und 3. Nach der Kampagne ist alles wieder auf Anfang.

Zum Launch dreht sich das um:

- **Helden steigen außerhalb der Kampagnen auf.** Jeder freigeschaltete Held hat eine dauerhafte **Heldenstufe von 1 bis 10**, die am Konto gespeichert ist.
- **Erfahrung (XP) gibt es für erfolgreich gespielte Abschnitte und Kampagnen.** Mit XP steigt ein Held auf, wird stärker und schaltet höhere Fähigkeiten frei.
- **Kampagnen haben einen Rang.** Je höher der Rang, desto stärker die Gegner und desto mehr XP. Eine hohe Kampagne mit niedrigen Helden ist möglich, aber schwer, und sie lohnt sich mehr.
- **Die Kampagne bleibt das eigentliche Spiel.** Geschichte, Entscheidungen und taktische Kämpfe stehen im Mittelpunkt. Das Leveln ist der rote Faden zwischen den Geschichten, kein Selbstzweck.

**Zusammenspiel mit der Freischaltung:** Die Freischaltung entscheidet, **wen** man spielen kann. Das Heldenlevel entscheidet, **wie stark** er ist.

---

## 2. Zielbild und Nicht-Ziele

### Ziele
- **Bindung:** „Meine Helden“ wachsen über viele Abende. Ein Held auf Stufe 8 hat eine Geschichte.
- **Klare Treppe:** Jede Kampagne hat eine empfohlene Heldenstufe. Spieler wissen, was sie erwartet.
- **Echte Wahl:** Eine Kampagne kann man früh und riskant spielen (mehr XP) oder später und sicher (weniger XP).
- **Wiederspielwert:** Kampagnen auf höherem Rang, andere Enden und andere Helden lohnen sich.
- **Faire Gruppen:** Freunde mit unterschiedlich weiten Helden können zusammen spielen.

### Nicht-Ziele
- **Kein Grinden als Pflicht.** Wer jede Kampagne einmal spielt, kommt ohne Wiederholung voran (siehe Abschnitt 7.4).
- **Keine Kaufvorteile.** Keine bezahlten XP, keine Lootboxen, keine Abkürzungen gegen Geld.
- **Kein Zwang zum Konto beim Einstieg.** Gäste spielen weiter, nur ohne dauerhaften Fortschritt.
- **Keine Änderung an Escape Rooms und Krimidinner.**
- **Keine höhere Figurenzahl im Kampf.** Es bleibt bei 3 bis 6 Helden (im Moor 2 bis 6).

---

## 3. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Heldenstufe** | Dauerhafte Stufe eines Helden am Konto, 1 bis 10. Bestimmt Lebenspunkte, Treffsicherheit, Fähigkeiten, Verbesserungen und den Meistertitel. |
| **XP** | Erfahrung. Gibt es für Abschnitte und Kampagnen, gehört einem bestimmten Helden. |
| **Erfahrungsschatz** | Ein kleiner Teil jeder Belohnung fließt in einen Topf am Konto, den man frei auf einen beliebigen eigenen Helden verteilen kann. |
| **Kampagnenrang** | Schwierigkeit einer Kampagne, 1 bis 5. Bestimmt Stärke der Gegner und Höhe der XP. Jede Kampagne hat einen Grundrang und kann auf höheren Rängen wiederholt werden. |
| **Empfohlene Stufe** | Die Heldenstufe, für die eine Kampagne auf ihrem Rang ausgelegt ist. |
| **Gruppenstufe** | Durchschnitt der Heldenstufen der Gruppe. Wird beim Start mit der Empfehlung verglichen. |
| **Kampagnen-Segen** | Ein kleiner Vorteil, den die Gruppe am Lagerfeuer wählt. Gilt nur bis zum Ende dieser Kampagne. Ersetzt den heutigen Aufstieg am Lagerfeuer. |
| **Neue Fähigkeit** | Auf Stufe 3 und 7 bekommt jeder Held eine neue Fähigkeit: die, die er heute auf Stufe 2 und 3 bekommt. |
| **Verbesserung** | Auf Stufe 5 und 8 wird eine vorhandene Fähigkeit des Helden stärker (mehr Einsätze, größere Reichweite, zusätzlicher Effekt). Fest je Held, ohne Auswahl. |
| **Meisterstufe** | Stufe 10: eine große Meisterverbesserung der Kernfähigkeit **und** ein **Meistertitel**. |
| **Meistertitel** | Ehrentitel des Helden, z. B. „Torvald, Schild von Grauwacht“. Er erscheint im Spiel überall, wo der Held zu sehen ist (Abschnitt 13.4). |

---

## 4. Was die Simulation heute zeigt

Bevor die Kurve festgelegt wird, habe ich gemessen, wie stark die Siegquote heute von der Heldenstufe abhängt. Werkzeug: `tools/stufen-sim.js`, alle Kampfszenen jeder Kampagne, Gruppen mit 3 bis 6 Helden, gleichverteilt gemischt, Normalmodus, eingebaute KI, 25 Gruppen je Szene und Größe.

| Kampagne | wie heute vorgesehen | alle auf Stufe 1 | alle auf Stufe 2 | alle auf Stufe 3 | Kämpfe je Spalte |
|---|---|---|---|---|---|
| Das Moor der stummen Lichter | 83,2 % | 66,0 % | 86,8 % | 96,4 % | 500 |
| Das Siegel von Grauwacht | 82,6 % | 64,1 % | 76,1 % | 86,0 % | 1.400 |
| Die letzte Fackel von Hochwacht | 73,1 % | 48,3 % | 70,4 % | 83,1 % | 800 |
| Die Krone unter dem Eis | 85,6 % | 71,7 % | 86,0 % | 93,1 % | 1.000 |

**Anteil der Helden, die mindestens einmal zu Boden gehen** (wie vorgesehen / Stufe 1 / 2 / 3): Moor 49 / 62 / 43 / 27 %, Grauwacht 33 / 46 / 34 / 23 %, Hochwacht 49 / 68 / 50 / 34 %, Krone 38 / 50 / 35 / 24 %.

**Was daraus folgt:**
1. **Eine Stufe ist heute sehr viel wert:** 10 bis 22 Prozentpunkte Siegquote. Das liegt daran, dass sich die Lebenspunkte von Stufe 1 auf 3 fast verdreifachen und auf Stufe 2 und 3 neue Fähigkeiten dazukommen.
2. **Bei 10 Stufen muss jede Stufe weniger bewirken.** Würde jede Stufe so viel bringen wie heute, wäre eine Kampagne zwei Stufen über der Empfehlung trivial und zwei Stufen darunter kaum zu schaffen. Ziel: **etwa 5 bis 8 Prozentpunkte je Stufe** in der Nähe der Empfehlung (Abschnitt 6.3). Das neue Modell erreicht das, indem es die heutigen drei Stufen auf zehn streckt: Die Fähigkeiten von heute Stufe 2 und 3 kommen erst auf Stufe 3 und 7, die Lebenspunkte wachsen je Stufe nur um die Hälfte des heutigen Zuwachses.
3. **Die Gegner müssen mitwachsen.** Die heutigen Gegner sind für die Stufen 1 bis 3 gebaut. Für Kampagnen auf Rang 3 bis 5 brauchen sie Stufenwerte bis zur Heldenstufe 10 (Abschnitt 6).

---

## 5. Die Heldenstufen 1 bis 10

### 5.1 Grundsatz
- **Keine neuen Fähigkeitsbäume.** Jeder Held behält genau die Fähigkeiten, die er heute hat. Sie werden nur über zehn Stufen verteilt.
- **Neue Fähigkeiten auf Stufe 3 und 7:** Was ein Held heute auf Stufe 2 bekommt, bekommt er künftig auf Stufe 3. Was er heute auf Stufe 3 bekommt, bekommt er auf Stufe 7.
- **Alle anderen Stufen verbessern Werte des Helden oder seine Fähigkeiten.**
- **Keine Auswahl beim Aufstieg.** Jeder Held hat einen festen Weg. Das hält das Spiel am Tisch einfach: Niemand muss einen Bogen ausfüllen, und Gäste und Tisch-Helden brauchen keine Sonderregel.
- **Stufe 10 ist die Meisterstufe:** eine große Meisterverbesserung und zusätzlich ein Meistertitel, der im Spiel beim Helden steht.

### 5.2 Was jede Stufe bringt

| Stufe | Werte | Fähigkeiten |
|---|---|---|
| 1 | Grundwerte wie heute Stufe 1 | Grundfähigkeiten wie heute Stufe 1 |
| 2 | + Lebenspunkte | – |
| **3** | + Lebenspunkte, 4 Zauberplätze | **Neue Fähigkeit I** (heute Stufe 2) |
| 4 | + Lebenspunkte, **Hauptattribut +2** (höchstens 20) | – |
| 5 | + Lebenspunkte, **Übungsbonus +3** | **Verbesserung I** |
| 6 | + Lebenspunkte, **Rüstungsklasse +1** | – |
| **7** | + Lebenspunkte, Zauberplätze 2. Grades | **Neue Fähigkeit II** (heute Stufe 3) |
| 8 | + Lebenspunkte | **Verbesserung II** |
| 9 | + Lebenspunkte, **Übungsbonus +4**, Zauberplätze | – |
| **10** | + Lebenspunkte, Zauberplätze | **Meisterverbesserung** und **Meistertitel** |

**Übungsbonus:** heute fest +2 (`UEBUNG` in `regeln.js`), künftig +2 auf Stufe 1–4, +3 auf 5–8 und +4 auf 9–10. Er wirkt auf Angriffe, Rettungswurf-SG und Proben.

**Lebenspunkte:** Stufe 1 wie heute. Jede weitere Stufe bringt **die Hälfte des heutigen Zuwachses je Stufe**. Dadurch entspricht Stufe 3 in etwa der heutigen Stufe 2 und Stufe 5 der heutigen Stufe 3.

| Beispiel | Stufe 1 | Stufe 3 | Stufe 5 | Stufe 7 | Stufe 10 |
|---|---|---|---|---|---|
| Torvald (Krieger) | 13 | 24 | 35 | 46 | 63 |
| Kael (Waldläufer) | 11 | 18 | 25 | 32 | 43 |
| Lyra (Zauberin) | 9 | 15 | 21 | 27 | 36 |

**Zauberplätze** (Zauberer und Kleriker; heute Stufe 1: 3, Stufe 2: 4, Stufe 3: 3 + 2 starke):

| Stufe | 1–2 | 3–6 | 7–8 | 9 | 10 |
|---|---|---|---|---|---|
| Plätze 1. Grad + 2. Grad | 3 + 0 | 4 + 0 | 4 + 2 | 4 + 3 | 5 + 3 |

**Klassenmerkmale wandern mit:** Tatendrang der Krieger und die Gerissenen Aktionen der Schurken (Spurt, Verstecken, Rückzug) kommen heute auf Stufe 2. Künftig kommen sie auf Stufe 3.

### 5.3 Verbesserungen und Meisterstufe
- **Verbesserung I (Stufe 5) und II (Stufe 8):** Je Held fest vorgegeben. Sie machen eine Fähigkeit spürbar stärker: mehr Einsätze, mehr Reichweite, ein zusätzliches Ziel oder ein zusätzlicher Effekt. **Kein bloßes „+1 Schaden“**, damit sich jede Stufe lohnt.
- **Meisterverbesserung (Stufe 10):** die größte Verbesserung, meist an der Fähigkeit, die den Helden ausmacht.
- **Meistertitel (Stufe 10):** Zusätzlich bekommt der Held einen Ehrentitel. Der Titel ist reine Anerkennung ohne Spielwert und wird im Spiel überall angezeigt, wo der Held erscheint (13.4).
- **Inhalt:** 15 Helden × 3 Verbesserungen = 45 Verbesserungen, dazu 15 Meistertitel. Die vollständige Liste steht in **Anhang A**.

### 5.4 Lücken, die geschlossen werden müssen
Durch das Balancing im November 2026 haben drei Helden auf einer Stufe heute keine Fähigkeit mehr. Für den Launch bekommen sie eine (Vorschläge, Details in Anhang A):

| Held | Stufe neu | Lücke | Vorschlag |
|---|---|---|---|
| Orin | 3 | Jagdvorbereitung ist auf Stufe 1 gewandert | *Lähmender Bolzen* (Aktion, 2× je Rast): Treffer, und das Ziel ist 1 Runde verlangsamt |
| Kael | 7 | Doppelschuss ist auf Stufe 2 gewandert | *Pfeilregen* (Aktion, 1× je Rast): ein Angriff gegen jeden Gegner in einem Kreis mit 1 Feld |
| Silra | 7 | hatte nie eine Fähigkeit auf Stufe 3 | *Glückssträhne* (passiv): Glückspilz 2× je Kampf, Platztausch 2× je Rast |

---

## 6. Kampagnenränge und Gegnerskalierung

### 6.1 Rang und Empfehlung
Jede Kampagne hat einen **Grundrang**. Sie lässt sich nach dem ersten Abschluss auch auf höheren Rängen wiederholen (gleiche Geschichte, stärkere Gegner, mehr XP).

| Kampagne | Grundrang | Empfohlene Stufe auf dem Grundrang | spielbar ab Rang |
|---|---|---|---|
| Das Moor der stummen Lichter | 1 | 1–3 | 1 bis 5 |
| Das Siegel von Grauwacht | 2 | 3–5 | 2 bis 5 |
| Die letzte Fackel von Hochwacht | 3 | 5–7 | 3 bis 5 |
| Die Krone unter dem Eis | 4 | 7–9 | 4 bis 5 |
| (5. Kampagne, Fortsetzung der Krone) | 5 | 9–10 | 5 |

| Rang | Empfohlene Gruppenstufe |
|---|---|
| 1 | 1–3 |
| 2 | 3–5 |
| 3 | 5–7 |
| 4 | 7–9 |
| 5 | 9–10 |

Die Stufen innerhalb einer Kampagne bleiben erhalten, nur anders: Abschnitt 1 einer Kampagne ist auf den unteren Wert der Empfehlung ausgelegt, das Finale auf den oberen. Die Kampagne wird also nach hinten schwerer, statt dass die Helden mittendrin aufsteigen.

### 6.2 Wie Gegner stärker werden
Gegner bekommen eine **Bedrohungsstufe** von 1 bis 10. Sie ergibt sich aus Rang und Abschnitt (Rang 1: Abschnitt 1 = Bedrohung 1, Finale = Bedrohung 3; Rang 5: Abschnitt 1 = 9, Finale = 10). Je Bedrohungsstufe über dem heutigen Wert:

| Wert | Zuwachs je Bedrohungsstufe |
|---|---|
| Lebenspunkte | +12 % |
| Angriffsbonus | +1 je 2 Stufen |
| Schaden | +1 je 2 Stufen |
| Rettungswurf-SG der Gegner | +1 je 3 Stufen |
| Rüstungsklasse | +1 je 4 Stufen |

**Was gleich bleibt:**
- **Mechaniken bleiben gleich:** Siegelsteine, Wellen, brüchiges Eis, Bossphasen, Schilde. Sie sind das, was die Kampagnen besonders macht, und sollen nicht in Zahlen ertrinken.
- **Die Zahl der Gegner** richtet sich weiter nach der Gruppengröße (heutige Skala), nicht nach dem Rang.
- **Auf Rang 4 und 5 kommt ab Abschnitt 2 je ein zusätzlicher Elite-Gegner dazu** (z. B. ein zweiter Kälterufer). Das macht hohe Ränge taktisch anders, nicht nur zäher.

Diese Werte sind ein Startpunkt. Sie werden mit der Simulation eingestellt (6.3), nicht von Hand geraten.

### 6.3 Balance-Ziele
Ziel-Siegquote je Kampf (Normal, gemischte Gruppen, KI) in Abhängigkeit vom Abstand der Gruppenstufe zur Empfehlung:

| Abstand zur Empfehlung | −3 | −2 | −1 | 0 | +1 | +2 | +3 |
|---|---|---|---|---|---|---|---|
| Ziel-Siegquote | ≈ 35 % | ≈ 50 % | ≈ 65 % | ≈ 80 % | ≈ 88 % | ≈ 93 % | ≈ 96 % |

**Prüfung vor dem Launch:**
- `tools/balance-helden.js` bekommt die Schalter `--stufe` und `--rang`.
- Für jede Kampagne und jeden spielbaren Rang wird diese Tabelle nachgerechnet.
- **Abnahme:** Jeder Wert liegt höchstens 5 Prozentpunkte neben dem Ziel. Keine Heldenklasse liegt auf irgendeiner Stufe mehr als 4 Prozentpunkte (Δ ohne) neben dem Durchschnitt.

**Hardcore** liegt wie heute deutlich darüber in der Schwierigkeit. Ziel: auf der empfohlenen Stufe etwa 60 % Siegquote je Kampf.

---

## 7. Erfahrung (XP)

### 7.1 Aufstiegskurve

| Stufe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| XP gesamt | 0 | 100 | 250 | 450 | 700 | 1.000 | 1.350 | 1.750 | 2.200 | 2.700 |
| XP für diese Stufe | – | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 |

### 7.2 XP-Quellen
XP gibt es **für Fortschritt in der Geschichte**, nicht für einzelne besiegte Gegner. Das verhindert, dass man Kämpfe absichtlich in die Länge zieht.

| Quelle | XP |
|---|---|
| Abschnitt abgeschlossen (Kapitel I, II …) | 20 % der Kampagnen-Basis je Abschnitt |
| Kampagnenende erreicht (jedes reguläre Ende) | Rest der Basis, sodass ein vollständiger Durchgang 100 % ergibt |
| Erstes Mal dieses Ende erreicht | +20 % der Basis |
| Optionaler Bosskampf gewonnen (z. B. Frostkammer) | +10 % der Basis |
| Hardcore | alle XP × 1,5 |

**Kampagnen-Basis nach Rang** (vollständiger Durchgang, Normal, Gruppe auf Empfehlung):

| Rang | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Basis-XP je Held | 300 | 450 | 600 | 800 | 1.000 |

### 7.3 Faktoren für Stufe und Wiederholung

| Lage des Helden zur Empfehlung | XP-Faktor |
|---|---|
| 3 oder mehr Stufen darunter | × 1,5 |
| 1–2 Stufen darunter | × 1,25 |
| innerhalb der Empfehlung | × 1,0 |
| 1–2 Stufen darüber | × 0,6 |
| 3 oder mehr Stufen darüber | × 0,25 |

| Wiederholung derselben Kampagne auf demselben Rang mit demselben Helden | Faktor |
|---|---|
| 1. Durchgang | × 1,0 |
| 2. Durchgang | × 0,6 |
| ab 3. Durchgang | × 0,3 |

**Niederlage:** Die bis dahin abgeschlossenen Abschnitte bleiben gutgeschrieben. Für das Ende gibt es nichts. Wer mitten in der Kampagne scheitert, verliert also nicht alles.

### 7.4 Erfahrungsschatz
**25 % jeder XP-Belohnung** gehen zusätzlich in den **Erfahrungsschatz** des Kontos. Diesen Topf kann man jederzeit auf einen beliebigen eigenen Helden verteilen.

**Warum:** Wer die Helden wechselt oder einen neuen freischaltet, soll nicht ganz von vorn anfangen. Der Schatz löst das ohne Zwang zum Wiederholen.

**Begrenzung:** Mit dem Erfahrungsschatz kann ein Held höchstens bis **zwei Stufen unter dem eigenen stärksten Helden** gebracht werden. Darüber hinaus muss er selbst spielen.

### 7.5 Beispielreise (ein Spieler, ein Held, alles Normal, jedes Mal ein neues Ende)

| Nach … | XP des Helden | Stufe | Nächste Kampagne passt? |
|---|---|---|---|
| Moor (Rang 1) | 360 | 3 | Grauwacht empfiehlt 3–5 ✔ |
| Grauwacht (Rang 2) | 900 | 5 | Hochwacht empfiehlt 5–7 ✔ |
| Hochwacht (Rang 3) | 1.620 | 7 | Krone empfiehlt 7–9 ✔ |
| Krone (Rang 4) | 2.580 | 9 | 5. Kampagne empfiehlt 9–10 ✔ |
| 5. Kampagne (Rang 5) | ≥ 2.700 | 10 | Höchststufe |

So sieht man: Wer jede Kampagne **einmal** spielt, landet jedes Mal im passenden Bereich, ohne Wiederholung. Wer eine Kampagne auslässt, kann sie später auf höherem Rang nachholen oder liegt eine Stufe darunter (bekommt dafür mehr XP).

---

## 8. Was innerhalb der Kampagne bleibt

Der Aufstieg mitten in der Geschichte fällt weg, das Lagerfeuer bleibt aber ein wichtiger Ort:

- **Lange Rast** wie heute: Lebenspunkte und Zauberplätze zurück, die Uhr (Glocke, Lichter, Kälte, Frost) wirkt weiter.
- **Beute** wie heute.
- **Neu: Kampagnen-Segen.** Die Gruppe wählt einen von drei Segen, der bis zum Ende dieser Kampagne gilt. Beispiele:
  - *Wachtfeuer:* +2 Lebenspunkte für alle.
  - *Scharfe Klingen:* +1 Schaden auf den ersten Treffer jedes Kampfes.
  - *Ruhiger Atem:* +1 auf Rettungswürfe.
  - *Vorräte:* ein zusätzlicher Heiltrank je Held.
  - *Ortskunde:* Die Gegnervorschau zeigt alle Schwächen.
- **Lagerfeuer-Moment für das XP-Gefühl:** Am Lagerfeuer zeigt der Tisch, wie viel XP jeder Held in dieser Kampagne schon gesammelt hat. Gutgeschrieben wird erst am Abschnittsende (siehe 7.2).

---

## 9. Gemischte Gruppen, Gäste und Tisch-Helden

### 9.1 Grundregel
Die Gegner richten sich nach dem **Rang der Kampagne**, nicht nach der Gruppe. Stärke soll sich wie Stärke anfühlen.

### 9.2 Vor dem Start
- Der Tisch zeigt die **Gruppenstufe** im Vergleich zur Empfehlung als Ampel:
  - **grün:** innerhalb der Empfehlung
  - **gelb:** 1–2 Stufen darunter
  - **rot:** 3 oder mehr Stufen darunter
- Bei Rot erscheint ein Hinweis, die Gruppe kann trotzdem starten.

### 9.3 Mindeststufe (Anhebung)
Helden, die **mehr als zwei Stufen unter der Empfehlung** liegen, werden für diese Kampagne auf **Empfehlung minus 2** angehoben.
- So kann ein neuer Freund mit Stufe-1-Helden bei einer Rang-3-Kampagne mitspielen, ohne nach einem Treffer am Boden zu liegen.
- **XP-Faktor:** Für angehobene Helden zählt die **echte** Stufe. Sie lernen also besonders schnell (× 1,5).
- **Was angehoben wird:** Werte und Fähigkeiten der angehobenen Stufe (Lebenspunkte, Übungsbonus, Zauberplätze, neue Fähigkeit auf 3 bzw. 7), aber keine Verbesserungen und kein Meistertitel.

### 9.4 Keine Drosselung nach oben
Helden über der Empfehlung werden **nicht** geschwächt. Sie bekommen weniger XP (Abschnitt 7.3), und die Gruppe sieht vorher, dass die Kampagne leicht wird.

### 9.5 Gäste und Tisch-Helden
- **Gäste ohne Konto** spielen ihre Helden auf der **empfohlenen Stufe der Kampagne**, mit allen Fähigkeiten und Verbesserungen dieser Stufe. Weil es keine Auswahl beim Aufstieg gibt, braucht es dafür keine Sonderregel. Einen Meistertitel tragen Gast-Helden nicht.
- **Helden, die der Tisch steuert,** werden genauso behandelt (empfohlene Stufe).
- Wer ein Konto anlegt, bekommt die XP eines Gast-Durchgangs **nicht** nachträglich. Das entspricht der Regel der Freischaltung: Die Verknüpfung von Gast und Konto kommt erst später als eigener Schritt.

---

## 10. Hardcore und Tod

- **Ein gefallener Held ist nur in diesem Abenteuer tot.** In der Sammlung bleibt er, mit seiner Stufe.
- **XP:** Der gefallene Held verliert die XP der Abschnitte nach seinem Tod. Was er bis dahin verdient hat, bleibt.
- **Ersatz am Lagerfeuer** wie heute (siehe Freischaltungs-Konzept B4). Der Ersatzheld spielt als Gast auf der empfohlenen Stufe.
- **Hardcore lohnt sich:** XP × 1,5.

---

## 11. Komfortregeln

- **Kein Stufenverlust:** XP gehen nie verloren.
- **Kein Zurücksetzen nötig:** Weil der Weg je Held fest ist, gibt es nichts falsch zu wählen.
- **Höchststufe:** Ab Stufe 10 fließen weitere XP vollständig in den Erfahrungsschatz.
- **Keine Uhr und kein Druck:** keine Tagesaufgaben, keine Login-Serien, keine verfallenden XP.

---

## 12. Zusammenspiel mit der Heldenfreischaltung

| Thema | Regel ab Launch |
|---|---|
| Startsammlung | 3 Helden aus 3 Auswahlrunden (wie im Freischaltungs-Konzept), alle auf Stufe 1 |
| Neuer Held nach Kampagnenabschluss | Startet auf **Stufe 1**, der Erfahrungsschatz bringt ihn schnell bis zwei Stufen unter den stärksten eigenen Helden (7.4) |
| „Keine dauerhafte Machtsteigerung“ | Gilt bis zum Launch. Ab Launch gibt es dauerhafte Stufen, aber **keine** dauerhaften Gegenstände und keine Kaufvorteile |
| Belohnung nach dem Finale | Freischaltung (einmal je Konto und Kampagnenversion) **plus** XP für die beteiligten Helden |
| Chronik | Freischaltungen, Aufstiege, neue Fähigkeiten, Verbesserungen und der Meistertitel erscheinen in der Chronik des Helden |

**Bestehende Konten** behalten beim Launch alle bis dahin freigeschalteten Helden. Die XP, die in der Open Beta schon gesammelt wurden, werden gutgeschrieben (siehe Phase 0).

---

## 13. Oberfläche

### 13.1 „Meine Helden“ im Hub
- Heldenkarte mit Stufe als großer Zahl und XP-Balken zur nächsten Stufe.
- Ein Stufenpfad 1–10 zeigt, was schon erreicht ist und was noch kommt: nächste neue Fähigkeit, nächste Verbesserung, Meisterstufe. Das macht Vorfreude statt Überraschung.
- Erfahrungsschatz oben mit Knopf „Verteilen“.
- Helden auf Stufe 10 haben einen goldenen Meisterrahmen und ihren Meistertitel unter dem Namen.

### 13.2 Kampagne starten
- Wahl des **Rangs**, beim ersten Durchgang fest auf dem Grundrang.
- **Ampel** für die Gruppenstufe (9.2) und Hinweis auf angehobene Helden (9.3).
- Am Tisch neben jedem Helden seine Stufe.

### 13.3 Nach einem Abschnitt und nach dem Finale
- **Tisch:** kurze Übersicht „Kapitel II abgeschlossen“ mit XP je Held. Beim Aufstieg eine goldene Titelkarte im Stil der Kapitelkarten: „Torvald erreicht Stufe 7: neue Fähigkeit Bollwerk“.
- **Stufe 10:** eine eigene, größere Karte: „Torvald wird zum **Schild von Grauwacht**“.
- **Handy:** Der eigene Held mit XP-Balken, der sich füllt. Beim Aufstieg zeigt das Handy, was neu ist (Fähigkeit, Verbesserung oder Werte). Es gibt nichts auszuwählen.
- **Hub:** Eintrag in der Chronik.

### 13.4 Der Meistertitel im Spiel
Der Meistertitel steht überall, wo der Held erscheint:
- **Tisch, Gruppenleiste** (Kampf und Erzählbühne): unter dem Namen, z. B. *„Schild von Grauwacht“*, dazu ein goldener Rahmen um das Porträt.
- **Zug-Banner:** „DEIN ZUG · Torvald, Schild von Grauwacht“.
- **Spielfigur auf dem Brett:** goldener Meisterring um den Sockel.
- **Handy:** in der Heldenkarte unter dem Namen.
- **Lobby und Heldenwahl:** neben dem Namen, damit die Mitspieler sehen, wer mit einem Meister kommt.
- **Chronik und Abspann:** „Mit Torvald, dem Schild von Grauwacht“.

### 13.5 Im Kampf
- Unverändert, nur mit höheren Zahlen. Verbesserte Fähigkeiten tragen auf dem Handy einen kleinen goldenen Stern.

---

## 14. Technisches Zielbild

### 14.1 Engine
- **`figuren.js`:**
  - `tpVon(fid, stufe)` für die Stufen 1–10 (Formel aus 5.2).
  - `PLAETZE` bis Stufe 10.
  - Bei den Fähigkeiten wird aus `ab: 2` künftig `ab: 3` und aus `ab: 3` künftig `ab: 7`.
  - Neues Feld `verbesserungen` je Held: `{ 5: …, 8: …, 10: … }`.
  - Neues Feld `meistertitel` je Held.
- **`regeln.js`:**
  - `UEBUNG` wird eine Funktion der Stufe.
  - Gegner bekommen `bedrohung` (Skalierung nach 6.2) in `neuesSpiel`.
  - Verbesserungen wirken über die vorhandenen Stellen (Einsätze, Reichweite, Ziele, Schaden, Rettung).
- **`szenen.js`:**
  - Der Aufstieg am Lagerfeuer entfällt, stattdessen der Kampagnen-Segen.
  - `A.stufe` wird zur Heldenstufe je Held (`A.zust[fid].stufe`).
  - Abschnitts- und Endereignisse melden XP-Anlässe.
- **Simulation:** `balance-helden.js` und `stufen-sim.js` mit `--stufe` und `--rang` (Abnahme nach 6.3).

### 14.2 Datenbank (Supabase, im `rpg_`-Namensraum)

| Objekt | Zweck |
|---|---|
| `rpg_hero_progress` | Je Konto und Held: Stufe, XP, Datum der Meisterstufe |
| `rpg_xp_ledger` | Buchungen (nur Anfügen): Konto, Held, Kampagne, Anlass, XP, Faktoren, eindeutiger Schlüssel gegen Doppelbuchung |
| `rpg_xp_pool` | Erfahrungsschatz je Konto |
| `rpg_campaign_members` (bestehend) | Neu: Heldenstufe **beim Start** der Kampagne, damit sich nichts mitten im Abenteuer ändert |

**Funktionen (Vorschlag):**
- `rpg_award_progress(p_campaign_id, p_event)` vergibt XP für Abschnitt oder Ende. Sie rechnet **auf dem Server** und prüft auf Plausibilität wie im Freischaltungs-Konzept B5: gespeicherter Stand, Mindestdauer, gültige Endszene.
- `rpg_spend_pool(p_hero_id, p_xp)` verteilt XP aus dem Erfahrungsschatz.

**Weitere Regeln:**
- **Idempotent:** Ein Abschnitt bringt je Held und Kampagne genau einmal XP, auch bei Neuladen und Wiederverbindung.
- **RLS:** Jeder sieht und ändert nur den eigenen Fortschritt. Mitspieler sehen nur Stufe und Meistertitel.
- **Migrationen:**
  - `006_rpg_heldensammlung.sql` (Freischaltung, Open Beta)
  - `007_rpg_heldenlevel.sql` (Level, Launch)
  - jeweils mit Rückbau-Skript und lokaler Prüfung (`supabase/tests/pruefen.sh`)
  - Du führst sie in Supabase aus, wie bisher.

---

## 15. Einführung in Phasen

| Phase | Wann | Inhalt | Wirkung für Spieler |
|---|---|---|---|
| **0 · Vorbereitung** | Open Beta | Tabellen und XP-Buchungen schon anlegen und mitschreiben, aber ohne Wirkung im Spiel | keine; beim Launch werden die gesammelten XP gutgeschrieben |
| **1 · Engine** | vor Launch | Stufen 4–10, Übungsbonus, Zauberplätze, Gegner-Bedrohung, Simulation mit `--stufe/--rang` | keine (nur intern) |
| **2 · Inhalte** | vor Launch | 45 Verbesserungen (3 je Held), 3 neue Fähigkeiten für die Lücken (5.4), 15 Meistertitel, Kampagnen-Segen, Balance nach 6.3 | keine (nur intern) |
| **3 · Launch** | Launch | XP-Vergabe live, „Meine Helden“ mit Stufenpfad, Meistertitel im Spiel, Rangwahl, Ampel, Aufstiegskarten | Heldenlevel spielbar |
| **4 · Ausbau** | nach Launch | 5. Kampagne (Rang 5), kurze **Gefechte** (einzelne Kämpfe, 20 Minuten, für gezieltes Leveln), Erfolge | mehr Inhalte |

**Grober Aufwand:**
- Phase 1: mittel. Die Engine ist darauf vorbereitet, Stufen sind schon ein Parameter, und die Fähigkeiten tragen schon ein `ab`.
- Phase 2: mittel. Weil es keine neuen Fähigkeitsbäume gibt, sind es 45 Verbesserungen an bestehenden Fähigkeiten und drei neue Fähigkeiten, dazu viele Simulationsläufe.
- Phase 3: mittel. Oberfläche und Supabase, nach dem Muster der Kampagnen und der Freischaltung.

---

## 16. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Spieler grinden die leichteste Kampagne | Wiederholungs- und Überstufen-Faktoren (7.3); XP nur für Fortschritt, nicht für Gegner |
| Hohe Kampagnen sind für Neue verschlossen | Anhebung auf Empfehlung −2 (9.3), Unterstufen-Bonus (7.3), Erfahrungsschatz (7.4) |
| Freunde mit unterschiedlicher Stufe können nicht zusammen spielen | Gegner nach Rang, Anhebung nach unten, Ampel vor dem Start |
| Neue Helden fühlen sich wertlos an | Erfahrungsschatz bis zwei Stufen unter dem stärksten Helden |
| Eine Klasse wird auf hoher Stufe übermächtig | Abnahmekriterium „Δ ohne höchstens 4 Prozentpunkte“ je Stufe (6.3) |
| Stufe 8–10 wirken leer, weil die letzte neue Fähigkeit auf 7 kommt | Verbesserung II (8) und Meisterverbesserung (10) sichtbar stark, Meistertitel als Ziel, Übungsbonus +4 auf 9 |
| Zwei Spieler mit demselben Helden sind gleich | Bewusst so gewollt (einfach); falls gewünscht später auf Stufe 10 eine Wahl zwischen zwei Meisterverbesserungen |
| Zahlenaufblähung, Kämpfe dauern zu lange | Flache Kurve ab Stufe 4, Gegner +12 % Lebenspunkte je Bedrohungsstufe, Mechaniken statt Zahlen |
| Der Aufstieg am Lagerfeuer fehlt | Kampagnen-Segen und XP-Anzeige am Lagerfeuer (Abschnitt 8) |
| Manipulierte Abschlüsse | Server rechnet XP, Plausibilitätsprüfung, Idempotenz |
| Zu viel Inhalt auf einmal | Phasen 1–2 vor dem Launch, Gefechte und 5. Kampagne danach |

---

## 17. Messgrößen
- Verteilung der Heldenstufen nach 1, 4 und 12 Wochen.
- Siegquote echter Runden je Rang und Abstand zur Empfehlung (Vergleich mit 6.3).
- Anteil der Gruppen mit Ampel gelb oder rot und deren Siegquote.
- Wie oft Kampagnen wiederholt werden, und auf welchem Rang.
- Nutzung des Erfahrungsschatzes.
- Wie viele Helden die Meisterstufe erreichen, und nach wie vielen Kampagnen.

---

## 18. Offene Entscheidungen (mit Empfehlung)

1. **Höchststufe 10?** *Empfehlung: ja.* Genug Raum für fünf Kampagnenränge, aber überschaubar.
2. **Erfahrungsschatz mit 25 %?** *Empfehlung: ja.* Er macht Heldenwechsel und neue Helden angenehm.
3. **Anhebung auf Empfehlung −2?** *Empfehlung: ja.* Sonst können neue Spieler mit Freunden nicht mitspielen.
4. **Kampagnen auf höherem Rang wiederholen?** *Empfehlung: ja, ab dem ersten Abschluss.* Das bringt viel Wiederspielwert ohne neue Geschichten.
5. **XP aus der Open Beta gutschreiben?** *Empfehlung: ja* (Phase 0). Das belohnt frühe Spieler.
6. **Gefechte als XP-Quelle?** *Empfehlung: ja, aber erst nach dem Launch* und mit halber XP je Minute im Vergleich zu Kampagnen, damit die Geschichten der Hauptweg bleiben.
7. **Meisterstufe mit oder ohne Wahl?** *Empfehlung: zum Launch ohne Wahl* (eine feste Meisterverbesserung je Held). Eine Wahl zwischen zwei Meisterverbesserungen kann später ergänzt werden, ohne das Datenmodell zu ändern.

---

## Anhang A – Fähigkeiten, Verbesserungen und Meistertitel je Held

Spalten: **Stufe 3** und **Stufe 7** sind die heutigen Fähigkeiten der Stufen 2 und 3. **Stufe 5** und **Stufe 8** sind Verbesserungen. **Stufe 10** ist die Meisterverbesserung, darunter der Meistertitel. Alle Werte sind Entwürfe für Phase 2 und werden mit der Simulation eingestellt.

### Krieger
| Held | Stufe 3 (neu) | Stufe 5 (Verbesserung I) | Stufe 7 (neu) | Stufe 8 (Verbesserung II) | Stufe 10 (Meister) |
|---|---|---|---|---|---|
| **Torvald** | Tatendrang | Spott 2× je Rast | Bollwerk | Schildstoß 2× je Kampf, stößt 2 Felder | Schutzhaltung auch für Verbündete in 2 Feldern, dreimal je Runde · **„Schild von Grauwacht“** |
| **Ragnar** | Tatendrang | Raserei 2× je Rast | Unbändig | Blutrausch schon unter ¾ der Lebenspunkte | Rücksichtsloser Angriff trifft einmal je Runde alle Gegner neben ihm · **„Der Unbeugsame“** |
| **Isolde** | Tatendrang | Finte 3× je Rast | Klingenmeisterin | Entwaffnen 2× je Kampf, wirkt 3 Runden | Parade zweimal je Runde, Parade-Treffer kritisch bei 17–20 · **„Erste Klinge des Nordens“** |

### Zauberer
| Held | Stufe 3 (neu) | Stufe 5 (Verbesserung I) | Stufe 7 (neu) | Stufe 8 (Verbesserung II) | Stufe 10 (Meister) |
|---|---|---|---|---|---|
| **Lyra** | Gedankenstütze | Analyse wirkt auf zwei Ziele | Bannkreis | Schutzglyphe +7 statt +5 RK, einmal je Kampf ohne Platz | Zeitriss trifft auch alle Gegner in 2 Feldern um das Ziel · **„Hüterin der Ordnung“** |
| **Vaelin** | Donnerwelle, Elementarer Nachhall | Glutpfeil: Feld brennt 2 Runden, 1W6 | Glutsphäre | Magisches Geschoss mit 4 statt 3 Lichtpfeilen | Glutsphäre einmal je Rast ohne Platz, Radius +1 · **„Herr der Elemente“** |
| **Morwen** | Schattenschritt, Spiegelbilder | Furcht trifft zwei Ziele | Albtraum | Spiegelbilder 4 statt 3 | Albtraum verängstigt zusätzlich alle Gegner in 2 Feldern um das Ziel · **„Die aus dem Schatten“** |

### Schurken
| Held | Stufe 3 (neu) | Stufe 5 (Verbesserung I) | Stufe 7 (neu) | Stufe 8 (Verbesserung II) | Stufe 10 (Meister) |
|---|---|---|---|---|---|
| **Darian** | Kletterer, Schattenstoß, Gerissene Aktionen | Rauchbombe 2× je Rast | Fallensteller | Schattenwirbel 3× je Rast | Fallen machen doppelten Schaden und halten fest · **„Der Unsichtbare“** |
| **Silra** | Gerissene Aktionen | Schmutziger Trick +1 Einsatz, Reichweite 2 Felder | **Glückssträhne** (neu, siehe 5.4) | Zweiter Dolch mit vollem Schaden | Hinterhalt mit jedem Dolch, nicht nur einmal je Zug · **„Königin der Gassen“** |
| **Vex** | Gerissene Aktionen | Gift 3× je Rast | Hinrichtung | Todesstoß: Vorteil auch aus dem Versteck in jeder Runde | Hinrichtung +2W6 statt 1W6; Gegner (keine Bosse) unter 8 Lebenspunkten fallen bei einem Treffer · **„Die letzte Klinge“** |

### Kleriker
| Held | Stufe 3 (neu) | Stufe 5 (Verbesserung I) | Stufe 7 (neu) | Stufe 8 (Verbesserung II) | Stufe 10 (Meister) |
|---|---|---|---|---|---|
| **Elara** | Untote vertreiben | Segen auf 4 Verbündete | Schutzkreis | Strahlende Aura wirkt in 2 Feldern | Schutzkreis +3 RK und heilt jede Runde 1W6 · **„Licht von Grauwacht“** |
| **Brogar** | Bewahren | Lebenshauch 2× je Kampf | Massenheilwort | Bewahren verteilt 6 × Stufe statt 5 × Stufe | Massenheilwort heilt alle Verbündeten in 6 Feldern · **„Der Barmherzige“** |
| **Seran** | Bannen | Brandmal 2× je Kampf ohne Platz | Gerechter Zorn | Befehl: Flieh! trifft zwei Ziele | Gerechter Zorn +3W6, und das Brandmal-Ziel kann nicht fliehen · **„Hammer der Wahrheit“** |

### Waldläufer
| Held | Stufe 3 (neu) | Stufe 5 (Verbesserung I) | Stufe 7 (neu) | Stufe 8 (Verbesserung II) | Stufe 10 (Meister) |
|---|---|---|---|---|---|
| **Kael** | Doppelschuss | Jägermal +1W8 statt +1W6 | **Pfeilregen** (neu, siehe 5.4) | Fesselnder Pfeil 3× je Rast | Doppelschuss trifft drei Ziele · **„Falke des Nordens“** |
| **Faye** | Eingespielt | Grau +10 Lebenspunkte | Ein Rudel | Grau: Umreißen 3× je Rast | Grau greift zweimal je Zug an · **„Herrin der Wölfe“** |
| **Orin** | **Lähmender Bolzen** (neu, siehe 5.4) | Netz mit 8 Feldern Reichweite, Befreien gegen SG +2 | Erlegen | Fangschuss zweimal je Runde | Erlegen 2× je Kampf, +4W6 statt +2W6 · **„Der Unentrinnbare“** |

---

## Anhang C – Simulation wiederholen
```
node abenteuer/tools/stufen-sim.js 25            # Siegquote je Kampagne bei Heldenstufe 1, 2, 3 und wie vorgesehen
node abenteuer/tools/balance-helden.js 100 --md=abenteuer/BALANCE-HELDEN.md
```
Ab Phase 1 kommen `--stufe=N` und `--rang=N` dazu.
