# Mythara – Konflikt der Fraktionen (PvPvE)

Roadmap für einen eigenständigen Spielmodus, in dem zwei Spieler mit je drei Helden auf derselben Karte gegeneinander und gegen computergesteuerte Gegner antreten.
Stand: 14. November 2026 · Status: **Konzept, noch nichts gebaut**

**Festgelegt (14. November 2026):**
- **Immer ein Spieler gegen einen anderen.** Jeder wählt drei Helden aus seiner Sammlung und steuert sie allein.
- **Die Helden spielen auf ihrer erarbeiteten Stufe.** Aus den drei Helden wird eine Durchschnittsstufe berechnet. Der Gegner muss mit seinem Team innerhalb einer festen Spanne um diesen Wert liegen.
- **Spielen über das Internet soll möglich sein.**
- **Spanne ±1,0** bei der Teamstufe. **Keine Grenze je Held** – zunächst ist jede Aufstellung erlaubt, die im Durchschnitt passt.
- **Belohnungen:** XP gestaffelt nach Stufe, bei Niederlage ein Drittel; Obergrenze je Tag; bei jedem Sieg 8 % Chance auf eine Heldenwahl aus drei fehlenden Helden (Abschnitt 10).
- **Kein großes Balancing vorab.** Der Modus startet mit den Helden, wie sie sind. Stattdessen zeichnet ein Auswertungswerkzeug jede Partie auf (Aufstellung, Stufen, Ergebnis). Nachgezogen wird, wenn die Zahlen es zeigen.

---

## 1. Leitidee

Zwei Spieler, je drei Helden, eine Karte, ein Artefakt, ein Wächter. Jeder muss sich entscheiden: den Wächter bekämpfen, den anderen stören oder abwarten und zugreifen, wenn der andere geschwächt ist.

Der Modus gibt der Heldensammlung und den erarbeiteten Stufen einen zweiten Zweck. Er ergänzt die Kampagnen und ersetzt sie nicht.

## 2. Was der Modus ist – und was nicht

| Ist | Ist nicht |
|---|---|
| Rundenbasiert, mit den Regeln der Kampagnen | Ein eigenes Kampfsystem |
| Ein Duell: 1 Spieler gegen 1 Spieler, je 3 Helden | Ein Gruppenmodus mit vielen Handys |
| Eine Partie von 20–35 Minuten | Ein Dauermodus mit Tagesaufgaben |
| Über das Internet oder am selben Tisch spielbar | An ein gemeinsames Tischgerät gebunden |
| Mit den erarbeiteten Heldenstufen, in einer fairen Spanne | Ein Modus, in dem die höhere Stufe sicher gewinnt |

## 3. Grundregeln der ersten Fassung

- **Aufstellung:** Jeder Spieler wählt drei Helden aus seiner Sammlung. Derselbe Held darf auf beiden Seiten stehen (jeder spielt mit seiner eigenen Sammlung).
- **Zugfolge:** Initiative wie in den Kampagnen. Monster ziehen in derselben Reihenfolge mit.
- **Zeitlimit je Zug:** 60 Sekunden je Held. Läuft es ab, endet der Zug. Über das Internet ist das Pflicht.
- **Niederlage eines Helden:** Er steht nach zwei Runden an seinem Startpunkt mit halben Lebenspunkten wieder auf. Niemand scheidet aus.
- **Sieg:** Wer das Artefakt zu seinem Startpunkt trägt, gewinnt sofort. Nach 12 Runden gewinnt, wer mehr Siegpunkte hat.
- **Aufgabe und Verbindungsabbruch:** Wer aufgibt oder länger als zwei Minuten weg ist, verliert die Partie.

### Stufen und faire Paarung

- **Teamstufe** = Durchschnitt der drei Heldenstufen, auf eine Nachkommastelle.
- **Spanne:** Die Teamstufen zweier Gegner dürfen höchstens **1,0** auseinanderliegen. Beispiel: Team mit Stufen 4, 5, 6 (Teamstufe 5,0) spielt gegen Teams von 4,0 bis 6,0.
- **Keine Grenze je Held.** Auch 10, 1, 1 (Teamstufe 4,0) ist erlaubt. Ob solche Aufstellungen zu stark sind, zeigt die Auswertung (Abschnitt 7).
- **Wer nicht passt:** Bei einer Herausforderung unter Freunden zeigt das Spiel vorher an, ob die Teams in der Spanne liegen, und lässt die Aufstellung ändern. Bei der Suche nach einem Gegner wird nur innerhalb der Spanne gepaart.
- **Die Monster richten sich nach der höheren der beiden Teamstufen** (Bedrohung wie in den Kampagnen).

Der Stufenunterschied innerhalb der Spanne ist gewollt spürbar. Wie viel er ausmacht, wird nicht vorab abgestimmt, sondern aus den echten Partien abgelesen.

### Der Modus „Wettlauf um das Artefakt“

- In der Kartenmitte liegt das Artefakt, bewacht von einem Wächter (Boss) und einigen Dienern.
- Das Artefakt lässt sich erst aufnehmen, wenn der Wächter fällt oder sein Schutz gebrochen ist (zwei Ziele am Kartenrand, je eines näher an jedem Spieler).
- Wer das Artefakt trägt, bewegt sich zwei Felder langsamer und kann sich nicht verstecken. Geht der Träger zu Boden, bleibt es liegen.
- Der Wächter wird jede dritte Runde stärker. Abwarten hat also einen Preis.
- **Siegpunkte:** Diener besiegt 1, Ziel am Rand erfüllt 2, Wächter den letzten Schlag gegeben 3, Artefakt am Rundenende getragen 1, gegnerischen Helden zu Boden gebracht 1.

### Wen greifen die Monster an?

Die Regel muss sichtbar und vorhersehbar sein, sonst fühlt sich ein Spieler benachteiligt:

1. Wer das Artefakt trägt.
2. Sonst: wer dem Wächter in der letzten Runde am meisten Schaden gemacht hat.
3. Sonst: das nächste erreichbare Ziel, bei Gleichstand der Spieler mit mehr Siegpunkten.

Das Spiel zeigt vor jedem Monsterzug an, auf wen es geht und warum.

## 4. Eigene Regeln gegen Helden

Die Fähigkeiten sind für den Kampf gegen Monster gebaut. Gegen Spieler brauchen sie Anpassungen, die **nur in diesem Modus** gelten:

| Thema | Regel im Modus | Grund |
|---|---|---|
| Kontrolle (Furcht, Befehl, Fesseln, Netz, Zeitriss) | wirkt gegen Helden höchstens 1 Runde; danach ist das Ziel 2 Runden dagegen gefeit | Wer mehrere Runden nicht handeln darf, hat keinen Spaß |
| Heilung | der zweite und jeder weitere Einsatz auf dasselbe Ziel in einer Runde wird halbiert | Sonst entscheidet der Kleriker die Partie |
| Aufrichten | Helden stehen nicht durch Verbündete auf, nur über die Rückkehr am Startpunkt | Verhindert endloses Hin und Her |
| Sofort-Effekte (Hinrichtung, Erlegen) | gelten nur gegen Monster | Ein Held soll nicht aus voller Gesundheit fallen |
| Verstecken | Der Gegner sieht versteckte Helden nicht. Über das Internet ist das echt verdeckt, am selben Gerät nicht spielbar | Jeder hat seinen eigenen Bildschirm |
| Spott | zwingt auch Helden, aber nur für 1 Runde | Bleibt nützlich, ohne zu lähmen |

Das sind keine Balance-Anpassungen, sondern Regeln, ohne die ein Duell nicht spielbar wäre. Alles Weitere wird erst nach den Zahlen der Auswertung angefasst.

## 5. Voraussetzungen

Bevor der Modus gebaut wird, muss im Hauptspiel stehen:

1. **Stufenmodell am Tisch erprobt.** Es ist seit dem 14. November 2026 eingeschaltet, aber noch nie mit einer Gruppe gespielt worden.
2. **Lücken im Stufenmodell geschlossen:** Warnung vor zu schweren Kampagnen, Ersatz für den Aufstieg am Lagerfeuer.

Die Heldenbalance und die 45 Verbesserungen werden **nicht** vorab für den Modus abgestimmt. Bekannt ist: In den späteren Kampagnen liegen Orin, Vex und Faye bis zu 8 Punkte hinter den Kriegern, und die Verbesserungen sind untereinander nicht ausbalanciert. Im Duell treffen sie direkt aufeinander. Das wird hingenommen und über die Auswertung beobachtet.

## 6. Spielen über das Internet

Heute rechnet das Tischgerät eine Partie allein, und niemand prüft es. Für ein Duell gegen einen anderen Spieler reicht das nicht: Wer rechnet, könnte schummeln.

**Vorschlag: beide rechnen mit, der Server würfelt.**

- Beide Geräte führen dieselbe Partie mit denselben Regeln. Übertragen werden nur die Züge („Torvald geht nach 5,3 und greift den Wächter an“), nicht das Ergebnis.
- Nach jedem Zug vergleichen beide einen Prüfwert des Spielstands. Weichen sie ab, wird die Partie abgebrochen und nicht gewertet.
- **Die Würfel kommen vom Server** (eine Funktion in Supabase liefert die Würfe einer Partie der Reihe nach). So kann keiner die Würfe vorhersehen oder aussuchen.
- **Aufstellung und Stufen prüft der Server:** Er kennt Sammlung und Stufen beider Konten und bestätigt, dass die Teams echt sind und in der Spanne liegen.
- **Das Ergebnis zählt nur, wenn beide Geräte dasselbe melden.**

Das kommt ohne eigenen Spielserver aus und baut auf dem auf, was schon da ist (Supabase, Live-Verbindung, eine Engine, die bei gleichen Würfen gleich rechnet). Verdeckte Informationen (versteckte Helden) sind damit nicht vollständig geschützt, weil beide Geräte den ganzen Spielstand kennen. Für den Anfang wird das hingenommen.

**Wege in eine Partie:**

| Weg | Wann | Anmerkung |
|---|---|---|
| Freund herausfordern | erste Fassung | Baut auf der Freundesliste auf. Kein Warten, kein Missbrauch durch Fremde. |
| Gegner suchen | später | Braucht genug Spieler gleichzeitig. Bei wenigen Spielern wartet man lange oder findet niemanden in der Spanne. |
| Am selben Gerät abwechselnd | optional | Ohne Verstecken. Einfach, aber weniger reizvoll. |

**Nur mit Konto.** Gäste haben keine Sammlung und keine Stufen.

## 7. Auswertung: jede Partie wird aufgezeichnet

Statt vorab zu balancieren, sammelt der Modus von der ersten Partie an Zahlen.

**Was je Partie gespeichert wird (auf dem Server, beim Melden des Ergebnisses):**
- beide Aufstellungen: je drei Helden mit ihrer Stufe, dazu die Teamstufe
- Sieger, Art des Siegs (Artefakt, Siegpunkte, Aufgabe, Abbruch), Siegpunkte beider Seiten
- Rundenzahl und Dauer, Startseite jedes Spielers
- je Held: wie oft zu Boden gegangen, Schaden an Helden und an Monstern, Heilung, letzter Schlag gegen den Wächter
- Karte und Modus, Version der Regeln (damit sich Zahlen vor und nach einer Änderung trennen lassen)

**Was die Auswertung zeigt (Seite nur für Admins, wie die Code-Übersicht):**

| Auswertung | Frage dahinter |
|---|---|
| Siegquote je Held, mit Zahl der Partien | Wer ist zu stark, wer zu schwach? |
| Wahlquote je Held | Wen nimmt jeder, wen niemand? |
| Siegquote je Aufstellung (drei Helden) und je Heldenpaar | Gibt es eine Kombination, gegen die nichts hilft? |
| Siegquote je Klassenmischung (z. B. zwei Kleriker) | Entscheidet Heilung oder Kontrolle die Partie? |
| Siegquote nach Unterschied der Teamstufe (0 bis 1,0) | Passt die Spanne? |
| Siegquote nach Verteilung der Stufen (z. B. 10, 1, 1 gegen 4, 4, 4) | Braucht es doch eine Grenze je Held? |
| Siegquote je Startseite | Ist die Karte fair? |
| Art des Siegs, Dauer, Abbrüche | Trägt der Modus, hält die Technik? |

Filter nach Zeitraum, Regelversion und Stufenbereich. Zahlen mit wenigen Partien werden als unsicher markiert, damit niemand aus zehn Spielen einen Schluss zieht.

**Nebenbei:** Dieselbe Aufzeichnung lässt sich später für die Kampagnen nutzen (welche Helden werden gewählt, welche Kämpfe enden im Rückzug). Das ist nicht Teil dieser Roadmap, die Tabellen werden aber so angelegt, dass es möglich bleibt.

## 8. Phasen

| Phase | Inhalt | Ergebnis | Abbruchkriterium |
|---|---|---|---|
| **0 · Fundament** | Voraussetzungen aus Abschnitt 5 | Hauptspiel stabil | – |
| **1 · Regelkern** | Zwei Spielerseiten in der Engine, Zugfolge, Zielwahl der Monster, Artefakt, Siegpunkte, Rückkehr am Startpunkt | Simulierte Partien laufen durch | Eine Startseite gewinnt dauerhaft über 55 % |
| **2 · Spielbarkeit in der Simulation** | Zwei KI-Spieler gegeneinander, Regeln aus Abschnitt 4. Kein Feinschliff: Es wird nur geprüft, dass Partien enden, im Zeitrahmen bleiben und keine Seite der Karte klar im Vorteil ist | Partien enden in 8–12 Runden, Startseiten 45–55 % | Partien enden nicht oder kippen immer in dieselbe Richtung |
| **3 · Netzwerk** | Züge übertragen, Prüfwert vergleichen, Würfel vom Server, Aufstellung prüfen, Zeitlimit, Aufgabe und Abbruch | Zwei Browser spielen eine Partie über das Internet | Die Engine rechnet auf zwei Geräten nicht zuverlässig gleich |
| **4 · Prototyp mit Aufzeichnung** | Eine Karte, ein Modus, Freund herausfordern, Aufstellung mit Spannenanzeige, Bildschirm für einen Spieler mit drei Helden. Jede Partie wird aufgezeichnet (Abschnitt 7), die Auswertungsseite für Admins steht | Spielbare Partie für zwei Konten, Zahlen ab der ersten Partie | – |
| **5 · Testrunden** | Ausgewählte Spieler, Fragebogen nach der Partie. Erste Anpassungen nach den Zahlen der Auswertung | Entscheidung: weiterbauen, umbauen oder einstellen | Weniger als die Hälfte will eine zweite Partie |
| **6 · Veröffentlichung** | Zweite Karte, Belohnungen (Titel, Erfolge), Hilfe-Seite, Einstieg im Hub | Modus für alle Konten sichtbar | – |
| **7 · Ausbau (optional)** | Gegnersuche, Wertung, Modus „Gebietskontrolle“, weitere Karten | – | Nur, wenn der Modus gespielt wird |

**Wertung und Ranglisten** stehen in Phase 7 und nicht früher: Sie lohnen sich erst mit einer Gegnersuche und genug Spielern, und sie ziehen Dauerpflege nach sich (Betrugsmeldungen, Saisons, Rückstufungen).

## 9. Was technisch dafür nötig ist

**Vorhanden und wiederverwendbar:**
- Ziele auf der Karte, Verstärkungswellen, Bosse mit Phasen und Schild, angekündigte Flächenangriffe, Rückstoß.
- Heldenstufen und Sammlung je Konto auf dem Server (Migration 006 und 007).
- Bedrohung: Monster wachsen mit der Stufe.
- Freundesliste und Live-Verbindung.
- Simulationswerkzeug mit Heldenvergleich.

**Neu zu bauen:**

| Baustein | Umfang | Anmerkung |
|---|---|---|
| Zweite Spielerseite in der Engine | groß | Heute gibt es „Spieler“ und „Gegner“. Angriffe, Flächenzauber, Heilung, Reaktionen und Sicht müssen wissen, wer zu wem gehört. Der größte Eingriff. |
| Gleiches Rechnen auf zwei Geräten | groß | Alle Würfe über eine Quelle, kein Zufall an anderer Stelle, Prüfwert des Spielstands. Muss gründlich getestet werden. |
| Würfel und Partien auf dem Server | mittel | Neue Migration: Partien, Aufstellungen, Würfelfolge, Ergebnis. Du führst das SQL aus. |
| Aufzeichnung und Auswertungsseite | mittel | Tabellen für Partie und Heldenwerte, Abfragen für die Auswertungen aus Abschnitt 7, Seite nur für Admins |
| Aufstellung prüfen (Sammlung, Stufen, Spanne) | klein | Auf dem Server, mit den vorhandenen Tabellen |
| Zielwahl der Monster zwischen zwei Spielern | mittel | Regel aus Abschnitt 3, mit Anzeige |
| Artefakt tragen, fallen lassen | klein | Baut auf den Zielen auf |
| Siegpunkte, Rundenlimit, Zeitlimit je Zug | klein | Das Zeitlimit ist auch für die Kampagnen nutzbar |
| Regeln gegen Helden (Abschnitt 4) | mittel | Als Schalter je Fähigkeit, nur im Modus aktiv |
| KI für einen Spieler mit drei Helden gegen Helden | mittel | Für die Simulation; später auch als Übungsgegner denkbar |
| Bildschirm für einen Spieler mit drei Helden | mittel | Ähnlich dem Solo-Mode, mit Gegnerseite und Siegpunkten |
| Herausfordern, Aufstellung, Wartebildschirm | mittel | Baut auf der Freundesliste auf |
| Karte für zwei Startseiten | mittel | Spiegelgleich, damit keine Seite im Vorteil ist; ein neues Kartenbild |

## 10. Belohnungen

- **XP (festgelegt am 14. November 2026):** Eine Partie gibt den Helden etwas Erfahrung, aber weniger als eine Kampagne. Gestaffelt nach Stufe wie in den Kampagnen. **Bei einer Niederlage bekommt jeder Held ein Drittel.**
  - **Stufe der Partie** = die höhere der beiden Teamstufen, gerundet (nach ihr richten sich auch die Monster).
  - **Grundwert bei einem Sieg** = 25 × Stufe der Partie (Vorschlag). Das ist etwa ein Drittel dessen, was eine Kampagne dieser Stufe gibt:

    | Stufe der Partie | 1 | 3 | 4 | 6 | 8 | 10 |
    |---|---|---|---|---|---|---|
    | Sieg | 25 | 75 | 100 | 150 | 200 | 250 |
    | Niederlage | 8 | 25 | 33 | 50 | 67 | 83 |
    | Kampagne dieser Stufe zum Vergleich | 100 | 200 | 300 | 450 | 600 | – |

  - **Staffelung je Held** wie in den Kampagnen: Ein Held auf der Stufe der Partie bekommt den Grundwert, ein Held darunter mehr (bis ×2), ein Held darüber weniger (bis ×0,1). In der Aufstellung 10, 1, 1 (Stufe der Partie 4) bekommen die beiden Stufe-1-Helden also das Doppelte, der Stufe-10-Held fast nichts.
  - Vergeben wird auf dem Server, nur für Partien, die beide Geräte gleich gemeldet haben. Aufgabe und Abbruch zählen für den, der bleibt, als Sieg; wer aufgibt oder wegbleibt, bekommt nichts.
  - **Obergrenze je Tag (festgelegt):** Nur die ersten **3 Partien** eines Tages bringen Belohnungen (Zahl ist ein Vorschlag). Weitere Partien lassen sich spielen und werden aufgezeichnet, geben aber weder XP noch die Chance auf einen Helden. So liegt der Fokus nicht auf dem Modus, und abgesprochene Partien lohnen sich kaum. Der Tag wechselt um Mitternacht (mitteleuropäische Zeit); gezählt wird auf dem Server.
- **Heldenchance (festgelegt):** Bei **jedem Sieg** besteht eine Chance von **8 %**, einen neuen Helden freizuschalten – wie nach einem neuen Kampagnen-Ende als **Wahl aus drei Helden, die noch fehlen**.
  - Gewürfelt wird auf dem Server, zusammen mit der XP-Vergabe. Das Angebot nutzt die vorhandene Heldenwahl (`rpg_hero_offers`, neue Art „duell“) und wartet wie die anderen Belohnungen auf der Startseite, wenn man nicht sofort wählt.
  - Zählt nur für Siege innerhalb der Obergrenze je Tag. Ein Sieg durch Aufgabe oder Abbruch des Gegners zählt nicht für die Heldenchance (Vorschlag), sonst ließe sie sich durch abgesprochenes Aufgeben abgreifen.
  - Wer schon alle 15 Helden hat, bekommt nichts stattdessen.
  - **Einordnung:** Bei 3 Partien am Tag und der Hälfte davon gewonnen kommt im Schnitt etwa alle 8 Tage ein neuer Held dazu. Über die Kampagnen sind es insgesamt 17 Enden für 12 fehlende Helden. Der Modus ist damit ein zweiter, langsamerer Weg zur vollen Sammlung; die neuen Enden der Kampagnen bleiben der Hauptweg.
- **Titel und Erfolge**, zum Beispiel „Artefaktträger“ oder „Wächterbezwinger“.
- **Kosmetisches** erst, wenn es dafür überhaupt ein System im Spiel gibt.

## 11. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Stufenvorsprung oder einzelne Helden entscheiden die Partie | Bewusst nicht vorab gelöst. Die Auswertung zeigt es; dann Spanne, Grenze je Held oder einzelne Fähigkeiten nachziehen |
| Zu wenige Partien für belastbare Zahlen | Zahlen mit wenigen Partien als unsicher markieren; erst handeln, wenn ein Muster über viele Partien steht |
| Zu wenige Spieler für eine Gegnersuche in der Spanne | Zuerst nur Herausforderung unter Freunden; Suche erst in Phase 7 |
| Schummeln über das Internet | Beide Geräte rechnen, Würfel und Aufstellung vom Server, Ergebnis nur bei Übereinstimmung |
| Die Engine rechnet auf zwei Geräten verschieden | Eigene Tests in Phase 3: dieselbe Partie auf zwei Geräten, Prüfwert nach jedem Zug |
| Verbindungsabbruch und Wegbleiben | Zeitlimit je Zug, Wiedereinstieg, Niederlage nach zwei Minuten |
| Kontrolle und Heilung kippen die Partie | Regeln aus Abschnitt 4; Auswertung je Klassenmischung |
| Wartezeit zwischen den Zügen | Nur zwei Spieler, Zeitlimit, Monsterzüge schnell abgespielt |
| Ein Spieler fühlt sich von den Monstern benachteiligt | Feste, sichtbare Zielregel mit Anzeige |
| Schneeballeffekt: Wer führt, gewinnt | Rückkehr am Startpunkt, Monster bevorzugen bei Gleichstand den Führenden, Artefakt macht langsam |
| Der Umbau der Engine bricht die Kampagnen | Alle bestehenden Testläufe müssen nach jedem Schritt grün sein; der Modus läuft hinter einem Schalter |
| Der Modus zieht Zeit von den Kampagnen ab | Phase 0 zuerst; nach Phase 5 eine ehrliche Entscheidung |

## 12. Offene Entscheidungen

1. **Derselbe Held auf beiden Seiten** erlaubt (Vorschlag) oder nicht?
2. **Belohnungen im Modus:** Grundwert 25 × Stufe der Partie und Obergrenze von 3 Partien je Tag bestätigen. Soll ein Sieg durch Aufgabe des Gegners für die Heldenchance zählen?
3. **Verstecken:** für den Anfang hinnehmen, dass es technisch nicht vollständig geschützt ist?
4. **Reihenfolge:** Soll der Modus vor oder nach dem Neubau von Hardcore kommen?
5. **Auswertung:** nur für Admins (Vorschlag) oder später auch eine öffentliche Seite mit Siegquoten je Held?

## 13. Messgrößen für Phase 5

- Dauer einer Partie: Ziel 20–35 Minuten.
- Anteil der Partien, die über das Artefakt enden (nicht über das Rundenlimit): Ziel über 50 %.
- Anteil der Züge, die durch das Zeitlimit enden: Ziel unter 10 %.
- Siegquote der Startseiten: Ziel 45–55 %.
- Siegquote des Teams mit der höheren Teamstufe: wird beobachtet, kein festes Ziel vorab.
- Abgebrochene Partien (Verbindung, abweichender Prüfwert): Ziel unter 5 %.
- Anteil der Tester, die sofort eine zweite Partie spielen wollen: Ziel über 50 %.
