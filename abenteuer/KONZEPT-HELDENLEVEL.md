# MYTHARA – Heldenlevel: Aufstieg außerhalb der Kampagnen

**Status:** Konzept, **nicht umgesetzt**. Geplant für den **Launch** (nach der Open Beta).
**Stand:** 13. November 2026. Grundlage: Abstimmung im Projekt vom 13. November 2026, Simulationen mit der heutigen Engine (`tools/stufen-sim.js`, `tools/balance-helden.js`).
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
| **Heldenstufe** | Dauerhafte Stufe eines Helden am Konto, 1 bis 10. Bestimmt Lebenspunkte, Treffsicherheit, Fähigkeiten und Talente. |
| **XP** | Erfahrung. Gibt es für Abschnitte und Kampagnen, gehört einem bestimmten Helden. |
| **Erfahrungsschatz** | Ein kleiner Teil jeder Belohnung fließt in einen Topf am Konto, den man frei auf einen beliebigen eigenen Helden verteilen kann. |
| **Kampagnenrang** | Schwierigkeit einer Kampagne, 1 bis 5. Bestimmt Stärke der Gegner und Höhe der XP. Jede Kampagne hat einen Grundrang und kann auf höheren Rängen wiederholt werden. |
| **Empfohlene Stufe** | Die Heldenstufe, für die eine Kampagne auf ihrem Rang ausgelegt ist. |
| **Gruppenstufe** | Durchschnitt der Heldenstufen der Gruppe. Wird beim Start mit der Empfehlung verglichen. |
| **Kampagnen-Segen** | Ein kleiner Vorteil, den die Gruppe am Lagerfeuer wählt. Gilt nur bis zum Ende dieser Kampagne. Ersetzt den heutigen Aufstieg am Lagerfeuer. |
| **Talent** | Eine Wahl beim Aufstieg (Stufe 4, 6, 8): eine bestehende Fähigkeit verbessern oder eine kleine neue Eigenschaft wählen. |
| **Signaturfähigkeit** | Neue, starke Fähigkeit eines Helden auf Stufe 5 und 9. |

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
2. **Bei 10 Stufen muss jede Stufe weniger bewirken.** Würde jede Stufe so viel bringen wie heute, wäre eine Kampagne zwei Stufen über der Empfehlung trivial und zwei Stufen darunter kaum zu schaffen. Ziel: **etwa 5 bis 8 Prozentpunkte je Stufe** in der Nähe der Empfehlung (Abschnitt 6.3).
3. **Die Gegner müssen mitwachsen.** Die heutigen Gegner sind für die Stufen 1 bis 3 gebaut. Für Kampagnen auf Rang 3 bis 5 brauchen sie Stufenwerte bis zur Heldenstufe 10 (Abschnitt 6).

---

## 5. Die Heldenstufen 1 bis 10

### 5.1 Grundsatz
- **Stufe 1 bis 3 bleiben wie heute:** dieselben Lebenspunkte, Fähigkeiten und Zauberplätze. Damit bleibt alles gültig, was heute gebaut und balanciert ist.
- **Ab Stufe 4 wird jede Stufe flacher:** weniger Lebenspunkte je Stufe als heute, dafür Entscheidungen (Talente) und zwei große Momente (Signaturfähigkeiten auf 5 und 9).
- **Jede Stufe bringt etwas Spürbares**, aber keine einzelne Stufe verdoppelt die Kraft.

### 5.2 Was jede Stufe bringt

| Stufe | Lebenspunkte | Übungsbonus | Neu |
|---|---|---|---|
| 1 | wie heute | +2 | Grundfähigkeiten |
| 2 | wie heute | +2 | Fähigkeit der Stufe 2 (wie heute) |
| 3 | wie heute | +2 | Fähigkeit der Stufe 3 (wie heute) |
| 4 | + Zuwachs | +2 | **Talent 1** (Wahl aus 3) |
| 5 | + Zuwachs | **+3** | **Signaturfähigkeit I** |
| 6 | + Zuwachs | +3 | **Talent 2** (Wahl aus 3) |
| 7 | + Zuwachs | +3 | **Attributsteigerung:** +2 auf das Hauptattribut (höchstens 20) |
| 8 | + Zuwachs | +3 | **Talent 3** (Wahl aus 3) |
| 9 | + Zuwachs | **+4** | **Signaturfähigkeit II** |
| 10 | + Zuwachs | +4 | **Meistertalent** (Wahl aus 2) und Titel, z. B. „Torvald, Schild von Grauwacht“ |

**Lebenspunkte-Zuwachs ab Stufe 4:** je Stufe die halbe Augenzahl des Trefferwürfels, ohne Konstitution. Krieger und Waldläufer (W10) bekommen +5, Zauberer, Schurken und Kleriker (W8) +4. Der Krieger behält seinen Klassenbonus von +3 je Stufe.

| Beispiel | Stufe 1 | Stufe 3 | Stufe 5 | Stufe 7 | Stufe 10 |
|---|---|---|---|---|---|
| Torvald (Krieger) | 13 | 35 | 51 | 67 | 91 |
| Kael (Waldläufer) | 11 | 25 | 35 | 45 | 60 |
| Lyra (Zauberin) | 9 | 21 | 29 | 37 | 49 |

Damit wächst ein Held von Stufe 3 auf 10 um etwa das 2,3- bis 2,6-Fache. Von Stufe 1 auf 3 ist es heute das 2,3- bis 2,7-Fache. Die zweite Hälfte der Reise ist also gestreckter.

**Übungsbonus:** steigt auf +3 (Stufe 5) und +4 (Stufe 9). Er wirkt auf Angriffe, Rettungswurf-SG und Proben. Heute ist er fest +2 (`UEBUNG` in `regeln.js`).

**Zauberplätze** (Zauberer und Kleriker; heute Stufe 1: 3, Stufe 2: 4, Stufe 3: 3 + 2 starke):

| Stufe | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|
| Plätze 1. Grad + 2. Grad | 4 + 2 | 4 + 3 | 4 + 3 | 4 + 3 | 4 + 4 | 4 + 4 | 5 + 4 |

Plätze 3. Grades führe ich bewusst nicht ein. Die Signaturfähigkeiten übernehmen die Rolle der großen Zauber und sind leichter zu balancieren.

### 5.3 Talente
Talente sind Entscheidungen, keine reinen Zahlen. Jede Klasse hat **sechs Talente**. Auf Stufe 4, 6 und 8 werden jeweils **drei davon angeboten** (nur solche, die der Held noch nicht hat), einer wird gewählt. Auf Stufe 10 gibt es **zwei Meistertalente** je Klasse zur Wahl.

**Regeln für Talente:**
- Ein Talent verstärkt eine vorhandene Fähigkeit oder gibt eine kleine neue Eigenschaft.
- Kein Talent verdoppelt Schaden oder Einsätze.
- Talente lassen sich zurücksetzen: einmal kostenlos, danach gegen 10 % der XP der aktuellen Stufe (siehe Abschnitt 11).

Die vollständigen Talentlisten stehen in **Anhang A**.

### 5.4 Signaturfähigkeiten
Jeder der 15 Helden bekommt auf Stufe 5 und 9 je eine eigene **Signaturfähigkeit**, insgesamt 30. Sie machen den Helden unverwechselbar und sind die großen Momente des Aufstiegs. Einsatz meist **1× je Kampf** oder **1× je Rast**, damit sie besonders bleiben. Die Liste steht in **Anhang B**.

**Hinweis:** Silra und Kael haben heute auf Stufe 3 keine neue Fähigkeit mehr (Kaels Doppelschuss kam beim Balancing auf Stufe 2). Für den Launch sollte jede Figur auf Stufe 3 wieder etwas Neues bekommen (Vorschläge in Anhang B).

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
- **Fähigkeiten:** Angehoben werden nur Werte (Lebenspunkte, Übungsbonus, Zauberplätze), keine Talente und keine Signaturfähigkeiten.

### 9.4 Keine Drosselung nach oben
Helden über der Empfehlung werden **nicht** geschwächt. Sie bekommen weniger XP (Abschnitt 7.3), und die Gruppe sieht vorher, dass die Kampagne leicht wird.

### 9.5 Gäste und Tisch-Helden
- **Gäste ohne Konto** spielen ihre Helden auf der **empfohlenen Stufe der Kampagne**. Talente und Signaturfähigkeiten bekommen sie nach einer festen Standardwahl, damit niemand einen Bogen ausfüllen muss.
- **Helden, die der Tisch steuert,** werden genauso behandelt (empfohlene Stufe, Standardwahl).
- Wer ein Konto anlegt, bekommt die XP eines Gast-Durchgangs **nicht** nachträglich. Das entspricht der Regel der Freischaltung: Die Verknüpfung von Gast und Konto kommt erst später als eigener Schritt.

---

## 10. Hardcore und Tod

- **Ein gefallener Held ist nur in diesem Abenteuer tot.** In der Sammlung bleibt er, mit seiner Stufe.
- **XP:** Der gefallene Held verliert die XP der Abschnitte nach seinem Tod. Was er bis dahin verdient hat, bleibt.
- **Ersatz am Lagerfeuer** wie heute (siehe Freischaltungs-Konzept B4). Der Ersatzheld spielt als Gast auf der empfohlenen Stufe.
- **Hardcore lohnt sich:** XP × 1,5.

---

## 11. Talente zurücksetzen und andere Komfortregeln

- **Talente zurücksetzen:** einmal kostenlos je Held, danach kostet es 10 % der XP der aktuellen Stufe. Die Stufe sinkt dabei nicht.
- **Kein Stufenverlust:** XP können nie verloren gehen, außer durch Zurücksetzen von Talenten.
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
| Chronik | Freischaltungen, Aufstiege, Talente und Signaturfähigkeiten erscheinen in der Chronik des Helden |

**Bestehende Konten** behalten beim Launch alle bis dahin freigeschalteten Helden. Die XP, die in der Open Beta schon gesammelt wurden, werden gutgeschrieben (siehe Phase 0).

---

## 13. Oberfläche

### 13.1 „Meine Helden“ im Hub
- Heldenkarte mit Stufe als großer Zahl, XP-Balken zur nächsten Stufe und gewählten Talenten.
- Ein offenes Talent (Stufe 4, 6, 8 erreicht, aber noch nicht gewählt) ist deutlich sichtbar.
- Erfahrungsschatz oben mit Knopf „Verteilen“.
- Aufklappbar: alle Stufen 1–10 mit dem, was noch kommt (Vorfreude statt Überraschung).

### 13.2 Kampagne starten
- Wahl des **Rangs**, beim ersten Durchgang fest auf dem Grundrang.
- **Ampel** für die Gruppenstufe (9.2) und Hinweis auf angehobene Helden (9.3).
- Am Tisch neben jedem Helden seine Stufe.

### 13.3 Nach einem Abschnitt und nach dem Finale
- **Tisch:** kurze Übersicht „Kapitel II abgeschlossen“ mit XP je Held. Beim Aufstieg eine goldene Titelkarte im Stil der Kapitelkarten: „Torvald erreicht Stufe 6“.
- **Handy:** Der eigene Held mit XP-Balken, der sich füllt. Bei einem Aufstieg erscheint die Talentwahl direkt auf dem Handy. Sie kann auch später im Hub erfolgen.
- **Hub:** Eintrag in der Chronik.

### 13.4 Im Kampf
- Unverändert, nur mit höheren Zahlen. Signaturfähigkeiten bekommen auf dem Handy eine eigene goldene Kartenfarbe.

---

## 14. Technisches Zielbild

### 14.1 Engine
- **`figuren.js`:**
  - `tpVon(fid, stufe)` für die Stufen 4–10 erweitern (Formel aus 5.2).
  - `PLAETZE` bis Stufe 10.
  - Fähigkeiten mit `ab: 5` und `ab: 9` (Signaturen).
  - Neues Feld `talente` je Klasse.
- **`regeln.js`:**
  - `UEBUNG` wird eine Funktion der Stufe.
  - Gegner bekommen `bedrohung` (Skalierung nach 6.2) in `neuesSpiel`.
  - Talente wirken über die vorhandenen Stellen (Treffer, Schaden, Einsätze, Rettung).
- **`szenen.js`:**
  - Der Aufstieg am Lagerfeuer entfällt, stattdessen der Kampagnen-Segen.
  - `A.stufe` wird zur Heldenstufe je Held (`A.zust[fid].stufe`).
  - Abschnitts- und Endereignisse melden XP-Anlässe.
- **Simulation:** `balance-helden.js` und `stufen-sim.js` mit `--stufe` und `--rang` (Abnahme nach 6.3).

### 14.2 Datenbank (Supabase, im `rpg_`-Namensraum)

| Objekt | Zweck |
|---|---|
| `rpg_hero_progress` | Je Konto und Held: Stufe, XP, gewählte Talente, freie Talentwahl, Anzahl Zurücksetzungen |
| `rpg_xp_ledger` | Buchungen (nur Anfügen): Konto, Held, Kampagne, Anlass, XP, Faktoren, eindeutiger Schlüssel gegen Doppelbuchung |
| `rpg_xp_pool` | Erfahrungsschatz je Konto |
| `rpg_campaign_members` (bestehend) | Neu: Heldenstufe und Talente **beim Start** der Kampagne, damit sich nichts mitten im Abenteuer ändert |

**Funktionen (Vorschlag):**
- `rpg_award_progress(p_campaign_id, p_event)` vergibt XP für Abschnitt oder Ende. Sie rechnet **auf dem Server** und prüft auf Plausibilität wie im Freischaltungs-Konzept B5: gespeicherter Stand, Mindestdauer, gültige Endszene.
- `rpg_spend_pool(p_hero_id, p_xp)` verteilt XP aus dem Erfahrungsschatz.
- `rpg_choose_talent(p_hero_id, p_stufe, p_talent)` und `rpg_reset_talents(p_hero_id)`.

**Weitere Regeln:**
- **Idempotent:** Ein Abschnitt bringt je Held und Kampagne genau einmal XP, auch bei Neuladen und Wiederverbindung.
- **RLS:** Jeder sieht und ändert nur den eigenen Fortschritt. Mitspieler sehen nur die Stufe.
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
| **2 · Inhalte** | vor Launch | 30 Talente (6 je Klasse), 10 Meistertalente, 30 Signaturfähigkeiten, Kampagnen-Segen, Balance nach 6.3 | keine (nur intern) |
| **3 · Launch** | Launch | XP-Vergabe live, „Meine Helden“ mit Stufen, Talentwahl, Rangwahl, Ampel, Aufstiegskarten | Heldenlevel spielbar |
| **4 · Ausbau** | nach Launch | 5. Kampagne (Rang 5), kurze **Gefechte** (einzelne Kämpfe, 20 Minuten, für gezieltes Leveln), Erfolge | mehr Inhalte |

**Grober Aufwand:**
- Phase 1: mittel. Die Engine ist darauf vorbereitet, Stufen sind schon ein Parameter.
- Phase 2: groß. Das ist vor allem Inhalt und Balance, mit vielen Simulationsläufen.
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
- Nutzung des Erfahrungsschatzes und der Talentrücksetzung.
- Beliebtheit der Talente je Klasse (Hinweis auf zu starke oder zu schwache Talente).

---

## 18. Offene Entscheidungen (mit Empfehlung)

1. **Höchststufe 10?** *Empfehlung: ja.* Genug Raum für fünf Kampagnenränge, aber überschaubar.
2. **Erfahrungsschatz mit 25 %?** *Empfehlung: ja.* Er macht Heldenwechsel und neue Helden angenehm.
3. **Anhebung auf Empfehlung −2?** *Empfehlung: ja.* Sonst können neue Spieler mit Freunden nicht mitspielen.
4. **Kampagnen auf höherem Rang wiederholen?** *Empfehlung: ja, ab dem ersten Abschluss.* Das bringt viel Wiederspielwert ohne neue Geschichten.
5. **XP aus der Open Beta gutschreiben?** *Empfehlung: ja* (Phase 0). Das belohnt frühe Spieler.
6. **Gefechte als XP-Quelle?** *Empfehlung: ja, aber erst nach dem Launch* und mit halber XP je Minute im Vergleich zu Kampagnen, damit die Geschichten der Hauptweg bleiben.
7. **Wann wird gewählt, Talente am Handy oder nur im Hub?** *Empfehlung: beides.* Direkt nach dem Aufstieg am Handy, sonst später im Hub.

---

## Anhang A – Talente je Klasse

Je Klasse sechs Talente (Angebot auf Stufe 4, 6 und 8: drei davon) und zwei Meistertalente (Stufe 10, eines davon).

### Krieger (Torvald, Ragnar, Isolde)
| Talent | Wirkung |
|---|---|
| Eiserne Haut | +1 RK |
| Zweiter Wind | Zweiter Atem heilt zusätzlich +Stufe Lebenspunkte |
| Wachsam | Gelegenheitsangriffe gegen dich mit Nachteil |
| Kriegsruf | Tatendrang: Verbündete in 2 Feldern +1 auf den nächsten Angriff |
| Standhaft | Vorteil auf Rettungswürfe gegen Umstoßen und Rückstoß |
| Waffenmeister | Kritischer Treffer schon bei 19–20 (bei Isolde: 18–20) |
| **Meister: Unbeugsam** | Einmal je Kampf: Fällt man auf 0, bleibt man mit 1 Lebenspunkt stehen |
| **Meister: Heerführer** | Verbündete neben dir +1 RK |

### Zauberer (Lyra, Vaelin, Morwen)
| Talent | Wirkung |
|---|---|
| Arkane Ader | +1 Zauberplatz 1. Grades |
| Weite Zauber | +3 Felder Reichweite für Zauber |
| Zaubertrick-Meister | Zaubertricks +1 Schaden je 2 Stufen über 4 |
| Schutzzauber | +1 RK, solange ein eigener Zauber wirkt |
| Zähe Konzentration | Vorteil auf Rettungswürfe gegen Kontrolle |
| Lehrmeister | Einmal je Kampf ein Zauber ohne Platz |
| **Meister: Überladung** | Einmal je Rast: ein Zauber mit doppeltem Würfelschaden |
| **Meister: Zeitstillstand** | Einmal je Kampf: eine zusätzliche Aktion |

### Schurke (Silra, Vex, Darian)
| Talent | Wirkung |
|---|---|
| Gift der Wahl | Hinterhalt +1W6 |
| Schattenschritt | +2 Felder Bewegung, wenn du versteckt beginnst |
| Ausweichen | Halber Schaden bei gelungenem GES-Rettungswurf gegen Flächen |
| Doppelte Klinge | Zweiter Angriff (Bonus) ohne Abzug |
| Schmutzige Tricks | +1 Einsatz für deine begrenzte Bonus-Fähigkeit |
| Glück der Gauner | Einmal je Kampf einen eigenen W20 wiederholen |
| **Meister: Todesstoß** | Kritische Treffer verdreifachen den Hinterhalt |
| **Meister: Schemen** | Gegner haben Nachteil gegen dich in der ersten Runde jedes Kampfes |

### Kleriker (Elara, Brogar, Seran)
| Talent | Wirkung |
|---|---|
| Gesegnete Hände | Heilzauber +2 |
| Schutzpatron | Heilendes Wort gibt dem Ziel +1 RK bis zu seinem Zug |
| Göttliche Macht | +1 Einsatz der Göttlichen Macht je Rast |
| Lichtblick | Aufrichten gibt 1W6 statt 1 Lebenspunkt |
| Zorn des Glaubens | Zaubertricks +1 Schaden, gegen Untote +2 |
| Fürsprache | Einmal je Kampf einen misslungenen Rettungswurf eines Verbündeten wiederholen |
| **Meister: Wunder** | Einmal je Rast: alle Verbündeten in 6 Feldern heilen 2W8 |
| **Meister: Heiliger Bann** | Untote und Fluchwesen in 2 Feldern um dich haben Nachteil |

### Waldläufer (Kael, Faye, Orin)
| Talent | Wirkung |
|---|---|
| Tödliches Mal | Jägermal +1W4 zusätzlich |
| Flinker Schütze | Leichtfüßig: 3 statt 2 Felder |
| Fährtenmeister | Erstes Mal des Kampfes ohne Einsatz |
| Gefährte | Wolf bzw. Fallen und Netz: +1 Einsatz je Rast |
| Weitschuss | +4 Felder Reichweite, kein Nachteil auf große Entfernung |
| Überleben | +1 Heiltrank je Kampagne |
| **Meister: Pfeilhagel** | Einmal je Kampf: Angriff gegen jeden Gegner in einem Kreis mit 2 Feldern |
| **Meister: Unerbittlich** | Das markierte Ziel kann sich nicht verstecken und hat −2 RK |

---

## Anhang B – Signaturfähigkeiten (Stufe 5 und 9)

| Held | Stufe 5 | Stufe 9 |
|---|---|---|
| **Torvald** (Schildwächter) | *Schildwall:* Verbündete neben dir +2 RK bis zu deinem nächsten Zug (Bonus, 1× je Kampf) | *Letzte Bastion:* 2 Runden fängt Torvald alle Angriffe gegen Verbündete in 2 Feldern ab (1× je Rast) |
| **Ragnar** (Berserker) | *Blutfurie:* Raserei-Runden mit zwei Angriffen | *Unaufhaltsam:* 1× je Kampf: Angriff gegen alle Gegner neben dir |
| **Isolde** (Duellantin) | *Riposte-Kette:* Parade bis zu zweimal je Runde | *Tanz der Klingen:* 1× je Kampf: drei Angriffe auf verschiedene Ziele, ohne Gelegenheitsangriffe |
| **Lyra** (Gelehrte) | *Schwachstelle offenlegen:* Analyse wirkt auf zwei Ziele | *Zeitfalte:* 1× je Rast: ein Verbündeter bekommt sofort einen zusätzlichen Zug |
| **Vaelin** (Elementarist) | *Feuersturm:* Kegel 4 Felder, 4W6, GES halbiert (Platz 2. Grades) | *Meteor:* 1× je Rast: Kreis mit 2 Feldern, 8W6, angekündigt eine Runde vorher |
| **Morwen** (Schattenmagierin) | *Schattenfessel:* Ziel kann sich 1 Runde nicht bewegen und hat Nachteil | *Albtraumflut:* 1× je Rast: alle Gegner in 3 Feldern verängstigt (WEI) |
| **Silra** (Trickserin) | *Taschenspieler:* Stiehlt eine Stärkung des Gegners (Schild, Segen) und gibt sie einem Verbündeten | *Großer Coup:* 1× je Kampf: Platztausch mit einem Gegner, beide Seiten verwirrt |
| **Vex** (Assassine) | *Markiert zum Tod:* Ziel nimmt von dir +2W6 bis Kampfende (1× je Kampf) | *Klinge aus dem Nichts:* 1× je Kampf: Teleport hinter ein Ziel und kritischer Treffer |
| **Darian** (Schattenläufer) | *Rauchschleier:* Feld mit 2 Feldern Radius, Verbündete darin versteckt | *Hundert Fallen:* 1× je Rast: drei Fallen auf einmal |
| **Elara** (Lichtbringerin) | *Morgenröte:* Kreis mit 2 Feldern, heilt Verbündete 2W6, Untote nehmen 2W6 | *Sonnenfanal:* 1× je Rast: alle Gegner in 4 Feldern geblendet, Untote 4W8 |
| **Brogar** (Wanderheiler) | *Lebensband:* Verbindung zu einem Verbündeten, Schaden wird geteilt | *Auferstehung:* 1× je Kampagne: ein gefallener Verbündeter steht mit halben Lebenspunkten auf (auch Hardcore) |
| **Seran** (Inquisitor) | *Urteil:* Brandmal-Ziel kann nicht fliehen und nicht geheilt werden | *Feuerprobe:* 1× je Rast: alle markierten Gegner nehmen 4W8 |
| **Kael** (Wildnisläufer) | *Durchschlagender Pfeil:* trifft alle Gegner in einer Linie | *Sturm aus Pfeilen:* 1× je Kampf: drei Schüsse mit Vorteil |
| **Faye** (Tiergefährtin) | *Rudelruf:* ein zweiter Wolf für 3 Runden | *Grau, der Alte:* Grau wird ein Leitwolf: +10 Lebenspunkte, Umreißen ohne Einsatz |
| **Orin** (Kopfgeldjäger) | *Lebend oder tot:* Netz und Treffer gleichzeitig | *Kopfgeld:* 1× je Kampf: Schaden gegen das markierte Ziel verdoppelt, bis es fällt |

**Lücken auf Stufe 3 schließen:**
- *Silra:* „Glückssträhne“, Glückspilz 2× je Kampf.
- *Kael:* „Adlerauge“, Fernkampf ohne Nachteil auf große Entfernung und gegen Deckung.

Alle Werte in Anhang A und B sind Entwürfe. Sie werden in Phase 2 mit der Simulation eingestellt. Was die Abnahme nach 6.3 nicht besteht, wird angepasst.

---

## Anhang C – Simulation wiederholen
```
node abenteuer/tools/stufen-sim.js 25            # Siegquote je Kampagne bei Heldenstufe 1, 2, 3 und wie vorgesehen
node abenteuer/tools/balance-helden.js 100 --md=abenteuer/BALANCE-HELDEN.md
```
Ab Phase 1 kommen `--stufe=N` und `--rang=N` dazu.
