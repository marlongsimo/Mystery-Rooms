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

**Stand der Umsetzung (14. November 2026) – erste spielbare Fassung „Arena“:**
- **Gebaut:** Regelkern für zwei Teams (`js/regeln.js`: `neueArena`), Migration `supabase/008_rpg_arena.sql` (Kämpfe, Belohnungen, Währung), Arena-Seite (`js/arena.js`), Kampf zwischen zwei Geräten über die Live-Verbindung, Ergebnisbildschirm, Währung „Seelensplitter“ neben dem Profilbild. Auf der Startseite steht „Arena“ statt „Kampagne beitreten“, sobald die Migration läuft.
- **Abweichungen vom Konzept unten (bewusst, für die erste Fassung):**
  - **Sieg:** kein Artefakt. Es endet, sobald ein Team vollständig am Boden liegt (das andere gewinnt), spätestens nach 15 Runden (dann nach Punkten: gegnerischer Held zu Boden 5, Monster 1, Endgegner 2). Der Kampf der Spieler steht im Mittelpunkt, die Monster sind wenige und schwach (so viele wie für zwei Helden, 60 % Leben).
  - **Kein Wiederkehren am Startpunkt:** Wer am Boden liegt, kann wie gewohnt von Verbündeten aufgerichtet oder geheilt werden.
  - **Technik:** Das Gerät des Erstellers rechnet den Kampf, das andere zeigt den Stand und schickt seine Züge (wie Tisch und Handys). Mitrechnen auf beiden Geräten und Würfel vom Server fehlen noch – der Ersteller könnte theoretisch schummeln. Beide Seiten melden das Ergebnis; gewertet wird nur bei Übereinstimmung und frühestens nach zwei Minuten.
  - **Regeln gegen Helden (Abschnitt 4) sind nicht umgesetzt.** Während ein Spieler zieht, gelten die Helden des anderen für die Regeln als Gegner: Schadenszauber und Angriffe wirken normal, viele Kontrolleffekte halten gegen Helden nicht an, und Reaktionen der gegnerischen Helden (Schutzhaltung, Parade) greifen in fremden Zügen nicht.
  - **Kein Zeitlimit je Zug, keine Aufzeichnung für die Auswertung** (Abschnitt 7) – beides folgt.
  - **Karten:** die sieben Karten aus Grauwacht (unverändert, 12 × 9). Der Ersteller startet gemeinsam ganz unten, der Beigetretene ganz oben, die Monster stehen dazwischen – von beiden Teams gleich weit entfernt. In der Simulation gewinnt der Ersteller 53 % von 300 Partien.
  - **Monster greifen beide Spieler gleich oft an:** Jedes Monster nimmt sich das Team vor, das bisher seltener dran war; bei Gleichstand entscheidet der Zufall.
  - **Anzeige:** Helden des Gegenspielers sind blau markiert (Monster rot). Die Chronik nennt jeden Zug mit Spieler, Bewegungen und bei Angriffen das Ziel samt Treffer oder Fehlwurf.
- **Geprüft:** Datenbankfunktionen lokal (`supabase/tests/008_rpg_arena_test.sql`), Regelkern in 150 simulierten Partien ohne Fehler oder Hänger, der ganze Ablauf mit zwei Browsern (`tests/arena.test.js`, Datenbank nachgebildet, Live-Verbindung echt). Nicht geprüft: gegen die echte Datenbank und von Hand gespielt.

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
  - **Grundwert bei einem Sieg: 25 XP**, auf jeder Stufe gleich. Ein Held auf der Stufe der Partie bekommt genau diesen Wert.
  - **Staffelung je Held:** für jede Stufe **unter** der Stufe der Partie 10 XP mehr (höchstens 100), für jede Stufe **darüber** 5 XP weniger (mindestens 5).

    | Partie auf Stufe 8, Held auf Stufe | 1 | 4 | 6 | 8 | 9 | 10 |
    |---|---|---|---|---|---|---|
    | Sieg | 95 | 65 | 45 | 25 | 20 | 15 |
    | Niederlage (ein Drittel) | 32 | 22 | 15 | 8 | 7 | 5 |

  - Zum Vergleich: Eine Kampagne gibt 50 bis 450 XP, eine Stufe kostet 100 bis 1500 XP. Auf der eigenen Stufe ist der Modus also ein kleines Zubrot; spürbar hilft er Helden, die deutlich unter der Stufe der Partie liegen.
  - Vergeben wird auf dem Server, nur für Partien, die beide Geräte gleich gemeldet haben. Aufgabe und Abbruch zählen für den, der bleibt, als Sieg; wer aufgibt oder wegbleibt, bekommt nichts.
  - **Obergrenze je Tag (festgelegt):** Nur die ersten **5 Partien** eines Tages bringen Belohnungen, und jeder Held sammelt im Modus höchstens **150 XP am Tag**. Was darüber hinausginge, verfällt. Für Helden auf der Stufe der Partie greift die Zahl der Partien (fünf Siege bringen 125 XP). Die XP-Grenze bremst Helden, die weit unter der Stufe der Partie liegen (95 XP je Sieg): Sie sind nach zwei Siegen am Tag fertig. Weitere Partien lassen sich spielen und werden aufgezeichnet, geben aber weder XP noch die Chance auf einen Helden. So liegt der Fokus nicht auf dem Modus, und abgesprochene Partien lohnen sich kaum. Der Tag wechselt um Mitternacht (mitteleuropäische Zeit); gezählt wird auf dem Server.
- **Heldenchance (festgelegt):** Bei **jedem Sieg** besteht eine Chance von **8 %**, einen neuen Helden freizuschalten – wie nach einem neuen Kampagnen-Ende als **Wahl aus drei Helden, die noch fehlen**.
  - Gewürfelt wird auf dem Server, zusammen mit der XP-Vergabe. Das Angebot nutzt die vorhandene Heldenwahl (`rpg_hero_offers`, neue Art „duell“) und wartet wie die anderen Belohnungen auf der Startseite, wenn man nicht sofort wählt.
  - Zählt nur für Siege innerhalb der Obergrenze je Tag. Ein Sieg durch Aufgabe oder Abbruch des Gegners zählt nicht für die Heldenchance, sonst ließe sie sich durch abgesprochenes Aufgeben abgreifen.
  - Wer schon alle 15 Helden hat, bekommt nichts stattdessen.
  - **Einordnung:** Bei 5 Partien am Tag und der Hälfte davon gewonnen kommt im Schnitt etwa alle 5 Tage ein neuer Held dazu. Über die Kampagnen sind es insgesamt 17 Enden für 12 fehlende Helden. Der Modus ist damit ein zweiter, langsamerer Weg zur vollen Sammlung; die neuen Enden der Kampagnen bleiben der Hauptweg.
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

## 12. Entscheidungen

**Entschieden (14. November 2026):**
1. **Derselbe Held darf auf beiden Seiten stehen.** Jeder spielt mit seiner eigenen Sammlung.
2. **Ein Sieg durch Aufgabe oder Abbruch des Gegners bringt nur XP,** keine Heldenchance.
3. **Verstecken:** Für den Anfang wird hingenommen, dass es über das Internet technisch nicht vollständig geheim ist.
4. **Reihenfolge:** Der Modus kommt **vor** dem Neubau von Hardcore.
5. Staffelung der XP und Obergrenze (5 Partien und 150 XP je Held am Tag), Heldenchance 8 %.

**Noch offen:**
- **Auswertung:** nur für Admins (Vorschlag) oder später auch eine öffentliche Seite mit Siegquoten je Held?

## 13. Messgrößen für Phase 5

- Dauer einer Partie: Ziel 20–35 Minuten.
- Anteil der Partien, die über das Artefakt enden (nicht über das Rundenlimit): Ziel über 50 %.
- Anteil der Züge, die durch das Zeitlimit enden: Ziel unter 10 %.
- Siegquote der Startseiten: Ziel 45–55 %.
- Siegquote des Teams mit der höheren Teamstufe: wird beobachtet, kein festes Ziel vorab.
- Abgebrochene Partien (Verbindung, abweichender Prüfwert): Ziel unter 5 %.
- Anteil der Tester, die sofort eine zweite Partie spielen wollen: Ziel über 50 %.

## Nachtrag: Spielmodi, Zugzeit, Kontrolle (Migration 009)

- **Modi** (Wahl beim Erstellen, sichtbar in Übersicht und Aufstellung): *Arena* (wie bisher), *Königsmord* (jeder bestimmt verdeckt einen Anführer; fällt er, ist der Kampf verloren; sonst Punkte nach 15 Runden), *Die Horde* (jede Runde neue, stärker werdende Monster; bis 30 Runden). Der Modus liegt in `rpg_arena_modes` (Migration 009, rein ergänzend); ohne 009 gibt es nur „Arena“.
- **Anführer:** bleibt auf dem eigenen Gerät; der Beigetretene nennt ihn dem Ersteller über die Live-Sitzung, der Ersteller überträgt seinen eigenen nicht. Krone nur am eigenen Anführer.
- **Zugzeit:** eine Minute je Held. Der Ersteller stellt die Uhr und beendet den Zug, wenn sie abläuft; beide Geräte zeigen sie an.
- **Kontrolle gegen Helden:** wirkt höchstens eine Runde, danach ist der Held zwei Runden gefeit. Verängstigt: nur bewegen. Verbannt: setzt aus. Netz: eine Runde festgehalten.
- **Währung:** jeder Sieg bringt zufällig 5–25 Seelensplitter, ohne Tagesgrenze (Auslöser auf `rpg_arena_rewards`); XP und Heldenchance bleiben bei fünf Kämpfen am Tag.
- **Simulation (je 150 Kämpfe, KI gegen KI):** Arena Ø 6,9 Runden; Königsmord Ø 3,7 Runden (immer durch den Anführer entschieden – mit Menschen beobachten, ggf. Anführer zäher machen); Horde Ø 8,9 Runden, rund 24 Monster je Kampf.
- **Offen:** Reaktionen gegnerischer Helden im fremden Zug, Aufzeichnung der Kämpfe für die Auswertung, Schutz gegen Schummeln, Zweck der Währung.

### Änderung: Modus per Los
- Der Modus wird nicht mehr gewählt, sondern **ausgelost**: aus der Zufallszahl des Kampfes (`seed` der Datenbank, Rest bei Teilung durch 3 → Arena, Königsmord, Horde). Die Tabelle `rpg_arena_modes` aus 009 wird dafür nicht mehr gebraucht (bleibt ungenutzt bestehen).
- Die Aufstellung zeigt vor dem Start Modus, Erklärung und Siegbedingungen; danach läuft ein Countdown (8 Sekunden, im Königsmord 15 – dort bestimmt jeder in der Aufstellung seinen Anführer).
- „i“ in der Arena-Übersicht: Ablauf, Zugzeit, Belohnungen und alle drei Modi.
- Horde: Neue Monster erscheinen von den nächsten Helden beider Teams gleich weit entfernt (höchstens ein Feld Unterschied).
- Live geprüft (`tests/live-arena.test.js`): Los aus der echten Datenbank, gewürfelte Seelensplitter (009 ist eingespielt).
