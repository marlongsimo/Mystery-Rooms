# Mythara – Konflikt der Fraktionen (PvPvE)

Roadmap für einen eigenständigen Spielmodus, in dem zwei Spieler mit je drei Helden auf derselben Karte gegeneinander und gegen computergesteuerte Gegner antreten.
Stand: 14. November 2026 · Status: **Konzept, noch nichts gebaut**

**Festgelegt (14. November 2026):**
- **Immer ein Spieler gegen einen anderen.** Jeder wählt drei Helden aus seiner Sammlung und steuert sie allein.
- **Die Helden spielen auf ihrer erarbeiteten Stufe.** Aus den drei Helden wird eine Durchschnittsstufe berechnet. Der Gegner muss mit seinem Team innerhalb einer festen Spanne um diesen Wert liegen.
- **Spielen über das Internet soll möglich sein.**

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
- **Spanne:** Die Teamstufen zweier Gegner dürfen höchstens **1,0** auseinanderliegen (Vorschlag). Beispiel: Team mit Stufen 4, 5, 6 (Teamstufe 5,0) spielt gegen Teams von 4,0 bis 6,0.
- **Grenze je Held:** Kein Held darf mehr als **2 Stufen** über der eigenen Teamstufe liegen (Vorschlag). Sonst trägt ein Stufe-10-Held zwei Stufe-1-Helden durch die Paarung.
- **Wer nicht passt:** Bei einer Herausforderung unter Freunden zeigt das Spiel vorher an, ob die Teams in der Spanne liegen, und lässt die Aufstellung ändern. Bei der Suche nach einem Gegner wird nur innerhalb der Spanne gepaart.
- **Die Monster richten sich nach der höheren der beiden Teamstufen** (Bedrohung wie in den Kampagnen).

Der Stufenunterschied innerhalb der Spanne ist gewollt spürbar, soll aber nicht entscheiden. Wie viel eine Stufe Vorsprung ausmacht, wird in Phase 2 gemessen. Ziel: Bei einer Stufe Unterschied gewinnt das stärkere Team höchstens 60 % der simulierten Partien. Reicht die Spanne dafür nicht, wird sie enger.

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

Diese Liste ist ein Startpunkt und wird in Phase 2 und 4 mit Messungen und Testpartien nachgezogen.

## 5. Voraussetzungen

Bevor der Modus gebaut wird, muss im Hauptspiel stehen:

1. **Stufenmodell am Tisch erprobt.** Es ist seit dem 14. November 2026 eingeschaltet, aber noch nie mit einer Gruppe gespielt worden.
2. **Heldenbalance enger.** In den späteren Kampagnen liegen Orin, Vex und Faye bis zu 8 Punkte hinter den Kriegern. Weil die Helden im Modus mit ihren echten Stufen und Verbesserungen antreten, wiegt das hier schwerer als in den Kampagnen. Ziel ist eine Spanne von höchstens 4 Punkten.
3. **Verbesserungen und Meisterschaften abgestimmt.** Die 45 Verbesserungen sind bisher nicht gegeneinander ausbalanciert. Im Modus treffen sie direkt aufeinander.
4. **Lücken im Stufenmodell geschlossen:** Warnung vor zu schweren Kampagnen, Ersatz für den Aufstieg am Lagerfeuer.

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

## 7. Phasen

| Phase | Inhalt | Ergebnis | Abbruchkriterium |
|---|---|---|---|
| **0 · Fundament** | Voraussetzungen aus Abschnitt 5 | Hauptspiel stabil, Balance in der Zielspanne | – |
| **1 · Regelkern** | Zwei Spielerseiten in der Engine, Zugfolge, Zielwahl der Monster, Artefakt, Siegpunkte, Rückkehr am Startpunkt | Simulierte Partien laufen durch | Eine Startseite gewinnt dauerhaft über 55 % |
| **2 · Balance in der Simulation** | Zwei KI-Spieler gegeneinander, Regeln aus Abschnitt 4, Messung je Held, je Aufstellung und je Stufenunterschied | Kein Held über 56 % oder unter 44 %; eine Stufe Vorsprung höchstens 60 %; Spanne festgelegt | Kontrolle, Heilung oder Stufenvorsprung lassen sich nicht einfangen |
| **3 · Netzwerk** | Züge übertragen, Prüfwert vergleichen, Würfel vom Server, Aufstellung prüfen, Zeitlimit, Aufgabe und Abbruch | Zwei Browser spielen eine Partie über das Internet | Die Engine rechnet auf zwei Geräten nicht zuverlässig gleich |
| **4 · Prototyp** | Eine Karte, ein Modus, Freund herausfordern, Aufstellung mit Spannenanzeige, Bildschirm für einen Spieler mit drei Helden | Spielbare Partie für zwei Konten | – |
| **5 · Testrunden** | Ausgewählte Spieler, Fragebogen nach der Partie | Entscheidung: weiterbauen, umbauen oder einstellen | Weniger als die Hälfte will eine zweite Partie |
| **6 · Veröffentlichung** | Zweite Karte, Belohnungen (Titel, Erfolge), Hilfe-Seite, Einstieg im Hub | Modus für alle Konten sichtbar | – |
| **7 · Ausbau (optional)** | Gegnersuche, Wertung, Modus „Gebietskontrolle“, weitere Karten | – | Nur, wenn der Modus gespielt wird |

**Wertung und Ranglisten** stehen in Phase 7 und nicht früher: Sie lohnen sich erst mit einer Gegnersuche und genug Spielern, und sie ziehen Dauerpflege nach sich (Betrugsmeldungen, Saisons, Rückstufungen).

## 8. Was technisch dafür nötig ist

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
| Aufstellung prüfen (Sammlung, Stufen, Spanne) | klein | Auf dem Server, mit den vorhandenen Tabellen |
| Zielwahl der Monster zwischen zwei Spielern | mittel | Regel aus Abschnitt 3, mit Anzeige |
| Artefakt tragen, fallen lassen | klein | Baut auf den Zielen auf |
| Siegpunkte, Rundenlimit, Zeitlimit je Zug | klein | Das Zeitlimit ist auch für die Kampagnen nutzbar |
| Regeln gegen Helden (Abschnitt 4) | mittel | Als Schalter je Fähigkeit, nur im Modus aktiv |
| KI für einen Spieler mit drei Helden gegen Helden | mittel | Für die Simulation; später auch als Übungsgegner denkbar |
| Bildschirm für einen Spieler mit drei Helden | mittel | Ähnlich dem Solo-Mode, mit Gegnerseite und Siegpunkten |
| Herausfordern, Aufstellung, Wartebildschirm | mittel | Baut auf der Freundesliste auf |
| Karte für zwei Startseiten | mittel | Spiegelgleich, damit keine Seite im Vorteil ist; ein neues Kartenbild |

## 9. Belohnungen

- **XP:** Vorschlag: 25 XP je Held für eine beendete Partie, höchstens dreimal am Tag, Sieg und Niederlage gleich. Vergeben wird auf dem Server, nur für Partien, die beide Geräte gleich gemeldet haben. So bleibt der Modus kein Level-Abkürzer, und abgesprochene Partien lohnen sich nicht.
- **Titel und Erfolge**, zum Beispiel „Artefaktträger“ oder „Wächterbezwinger“.
- **Kosmetisches** erst, wenn es dafür überhaupt ein System im Spiel gibt.

## 10. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Stufenvorsprung entscheidet die Partie | Spanne, Grenze je Held, Messung in Phase 2; notfalls engere Spanne |
| Zu wenige Spieler für eine Gegnersuche in der Spanne | Zuerst nur Herausforderung unter Freunden; Suche erst in Phase 7 |
| Schummeln über das Internet | Beide Geräte rechnen, Würfel und Aufstellung vom Server, Ergebnis nur bei Übereinstimmung |
| Die Engine rechnet auf zwei Geräten verschieden | Eigene Tests in Phase 3: dieselbe Partie auf zwei Geräten, Prüfwert nach jedem Zug |
| Verbindungsabbruch und Wegbleiben | Zeitlimit je Zug, Wiedereinstieg, Niederlage nach zwei Minuten |
| Kontrolle und Heilung kippen die Partie | Regeln aus Abschnitt 4, Messung, Abbruchkriterium |
| Wartezeit zwischen den Zügen | Nur zwei Spieler, Zeitlimit, Monsterzüge schnell abgespielt |
| Ein Spieler fühlt sich von den Monstern benachteiligt | Feste, sichtbare Zielregel mit Anzeige |
| Schneeballeffekt: Wer führt, gewinnt | Rückkehr am Startpunkt, Monster bevorzugen bei Gleichstand den Führenden, Artefakt macht langsam |
| Der Umbau der Engine bricht die Kampagnen | Alle bestehenden Testläufe müssen nach jedem Schritt grün sein; der Modus läuft hinter einem Schalter |
| Der Modus zieht Zeit von den Kampagnen ab | Phase 0 zuerst; nach Phase 5 eine ehrliche Entscheidung |

## 11. Offene Entscheidungen

1. **Spanne der Teamstufe:** ±1,0 (Vorschlag) oder weiter? Weiter heißt: leichter einen Gegner finden, aber größerer Vorteil für das stärkere Team.
2. **Grenze je Held:** höchstens 2 Stufen über der eigenen Teamstufe (Vorschlag) oder gar keine?
3. **Derselbe Held auf beiden Seiten** erlaubt (Vorschlag) oder nicht?
4. **XP im Modus:** der kleine Betrag aus Abschnitt 9 oder gar keine?
5. **Verstecken:** für den Anfang hinnehmen, dass es technisch nicht vollständig geschützt ist?
6. **Reihenfolge:** Soll der Modus vor oder nach dem Neubau von Hardcore kommen?

## 12. Messgrößen für Phase 5

- Dauer einer Partie: Ziel 20–35 Minuten.
- Anteil der Partien, die über das Artefakt enden (nicht über das Rundenlimit): Ziel über 50 %.
- Anteil der Züge, die durch das Zeitlimit enden: Ziel unter 10 %.
- Siegquote der Startseiten: Ziel 45–55 %.
- Siegquote des Teams mit der höheren Teamstufe: Ziel höchstens 60 %.
- Abgebrochene Partien (Verbindung, abweichender Prüfwert): Ziel unter 5 %.
- Anteil der Tester, die sofort eine zweite Partie spielen wollen: Ziel über 50 %.
