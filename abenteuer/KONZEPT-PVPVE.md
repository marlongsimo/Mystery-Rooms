# Mythara – Konflikt der Fraktionen (PvPvE)

Roadmap für einen eigenständigen Spielmodus, in dem zwei Gruppen auf derselben Karte gegeneinander und gegen computergesteuerte Gegner antreten.
Stand: 14. November 2026 · Status: **Konzept, noch nichts gebaut**

---

## 1. Leitidee

Zwei Teams, eine Karte, ein Artefakt, ein Wächter. Jedes Team muss sich entscheiden: den Wächter bekämpfen, das andere Team stören oder abwarten und zugreifen, wenn die anderen geschwächt sind.

Der Modus ist ein **Tischspiel wie die Kampagnen**: ein Gerät als Spieltisch in der Mitte, jede Person spielt auf dem eigenen Handy. Er ergänzt die Kampagnen und ersetzt sie nicht.

## 2. Was der Modus ist – und was nicht

| Ist | Ist nicht |
|---|---|
| Rundenbasiert, mit den Regeln der Kampagnen | Ein eigenes Kampfsystem |
| Eine Partie von 20–35 Minuten | Ein Dauermodus mit Tagesaufgaben |
| Zwei Teams an einem Tisch | Online-Matchmaking gegen Fremde |
| Alle Helden auf derselben festen Stufe | Ein Ort, an dem hohe Stufen gewinnen |
| Ein zweiter Zweck für die Heldensammlung | Der schnellste Weg, Helden zu leveln |

## 3. Grundregeln der ersten Fassung

- **Teams:** 3 gegen 3. Jede Person steuert einen Helden; fehlt jemand, steuert eine Person zwei.
- **Helden:** aus der eigenen Sammlung. Kein Held doppelt auf der Karte; die Teams wählen abwechselnd.
- **Feste Stufe 5** für alle, unabhängig vom echten Fortschritt. Stufe 5 hat die erste neue Fähigkeit und die erste Verbesserung, aber keine Meisterschaft.
- **Zugfolge:** Initiative wie in den Kampagnen, die Teams wechseln sich so weit wie möglich ab. Monster ziehen in derselben Reihenfolge mit.
- **Zeitlimit je Zug:** 60 Sekunden. Läuft es ab, endet der Zug.
- **Niederlage eines Helden:** Er steht nach zwei Runden an seinem Startpunkt mit halben Lebenspunkten wieder auf. Niemand scheidet aus.
- **Sieg:** Wer das Artefakt zu seinem Startpunkt trägt, gewinnt sofort. Nach 12 Runden gewinnt, wer mehr Siegpunkte hat.

### Der Modus „Wettlauf um das Artefakt“

- In der Kartenmitte liegt das Artefakt, bewacht von einem Wächter (Boss) und einigen Dienern.
- Das Artefakt lässt sich erst aufnehmen, wenn der Wächter fällt oder sein Schutz gebrochen ist (zwei Ziele am Kartenrand, je eines näher an jedem Team).
- Wer das Artefakt trägt, bewegt sich zwei Felder langsamer und kann sich nicht verstecken. Geht der Träger zu Boden, bleibt es liegen.
- Der Wächter wird jede dritte Runde stärker. Abwarten hat also einen Preis.
- **Siegpunkte:** Diener besiegt 1, Ziel am Rand erfüllt 2, Wächter den letzten Schlag gegeben 3, Artefakt am Rundenende getragen 1, gegnerischen Helden zu Boden gebracht 1.

### Wen greifen die Monster an?

Die Regel muss sichtbar und vorhersehbar sein, sonst fühlt sich ein Team benachteiligt:

1. Wer das Artefakt trägt.
2. Sonst: wer dem Wächter in der letzten Runde am meisten Schaden gemacht hat.
3. Sonst: das nächste erreichbare Ziel, bei Gleichstand das Team mit mehr Siegpunkten.

Der Tisch zeigt vor jedem Monsterzug an, auf wen es geht und warum.

## 4. Eigene Regeln gegen Helden

Die Fähigkeiten sind für den Kampf gegen Monster gebaut. Gegen Spieler brauchen sie Anpassungen, die **nur in diesem Modus** gelten:

| Thema | Regel im Modus | Grund |
|---|---|---|
| Kontrolle (Furcht, Befehl, Fesseln, Netz, Zeitriss) | wirkt gegen Helden höchstens 1 Runde; danach ist das Ziel 2 Runden dagegen gefeit | Wer mehrere Runden nicht handeln darf, hat keinen Spaß |
| Heilung | gegen den zweiten und jeden weiteren Einsatz auf dasselbe Ziel in einer Runde halbiert | Sonst entscheidet der Kleriker die Partie |
| Aufrichten | Helden stehen nicht durch Verbündete auf, nur über die Rückkehr am Startpunkt | Verhindert endloses Hin und Her |
| Sofort-Effekte (Hinrichtung, Erlegen) | gelten nur gegen Monster | Ein Held soll nicht aus voller Gesundheit fallen |
| Verstecken | Gegnerisches Team sieht versteckte Helden nicht auf dem eigenen Handy, der Tisch zeigt sie als Schatten | Der Tisch liegt offen in der Mitte |
| Spott | zwingt auch Helden, aber nur für 1 Runde | Bleibt nützlich, ohne zu lähmen |

Diese Liste ist ein Startpunkt und wird in Phase 2 und 3 mit Messungen und Testpartien nachgezogen.

## 5. Voraussetzungen

Bevor der Modus gebaut wird, muss im Hauptspiel stehen:

1. **Stufenmodell am Tisch erprobt.** Es ist seit dem 14. November 2026 eingeschaltet, aber noch nie mit einer Gruppe gespielt worden.
2. **Heldenbalance enger.** In den späteren Kampagnen liegen Orin, Vex und Faye bis zu 8 Punkte hinter den Kriegern. Ziel ist eine Spanne von höchstens 4 Punkten.
3. **Lücken im Stufenmodell geschlossen:** Warnung vor zu schweren Kampagnen, Ersatz für den Aufstieg am Lagerfeuer.
4. **Hardcore neu entwickelt** oder bewusst auf später verschoben.

## 6. Phasen

| Phase | Inhalt | Ergebnis | Abbruchkriterium |
|---|---|---|---|
| **0 · Fundament** | Voraussetzungen aus Abschnitt 5 | Hauptspiel stabil, Balance in der Zielspanne | – |
| **1 · Regelkern** | Zwei Teams in der Engine, Zugfolge, Zielwahl der Monster, Artefakt, Siegpunkte, Rückkehr am Startpunkt | Simulierte Partien laufen durch | Simulation zeigt, dass ein Team durch die Startseite mehr als 55 % gewinnt und sich das nicht beheben lässt |
| **2 · Balance in der Simulation** | Zwei KI-Teams gegeneinander, Regeln aus Abschnitt 4, Messung je Held und je Aufstellung | Kein Held über 56 % oder unter 44 % Siegquote; keine Aufstellung über 60 % | Kontrolle oder Heilung lässt sich nicht einfangen, ohne die Helden zu entkernen |
| **3 · Prototyp am Tisch** | Eine Karte, ein Modus, Heldenwahl im Wechsel, Handy-Ansicht je Team, Zeitlimit, Siegpunkte am Tisch | Spielbare Partie für 2–6 Personen | – |
| **4 · Testrunden** | Geschlossene Tests mit ausgewählten Gruppen, Fragebogen nach der Partie | Entscheidung: weiterbauen, umbauen oder einstellen | Weniger als die Hälfte der Testgruppen will eine zweite Partie |
| **5 · Veröffentlichung** | Zweite Karte, Belohnungen (Titel, Erfolge), Hilfe-Seite, Einstieg im Hub | Modus für alle sichtbar | – |
| **6 · Ausbau (optional)** | Modus „Gebietskontrolle“, 4 gegen 4, weitere Karten | – | Nur, wenn der Modus nach Phase 5 gespielt wird |

**Bewusst nicht geplant:** Ranglisten, Saisons, Spiel über das Internet gegen Fremde. Sie brauchen einen Server, der Züge prüft, Betrugsschutz und Dauerpflege. Das wird erst entschieden, wenn der Modus am Tisch trägt.

## 7. Was technisch dafür nötig ist

**Vorhanden und wiederverwendbar:**
- Ziele auf der Karte, Verstärkungswellen, Bosse mit Phasen und Schild, angekündigte Flächenangriffe, Rückstoß.
- Spieltisch und Handys über die bestehende Live-Verbindung.
- Fester Stufenpfad je Held: Eine feste Stufe für alle ist ohne Sonderregeln möglich.
- Simulationswerkzeug mit Heldenvergleich.

**Neu zu bauen:**

| Baustein | Umfang | Anmerkung |
|---|---|---|
| Zweite Spielerseite in der Engine | groß | Heute gibt es „Spieler“ und „Gegner“. Angriffe, Flächenzauber, Heilung, Reaktionen und Sicht müssen wissen, wer zu wem gehört. Das ist der größte Eingriff. |
| Zielwahl der Monster zwischen zwei Teams | mittel | Regel aus Abschnitt 3, mit Anzeige am Tisch |
| Artefakt tragen, fallen lassen, abgeben | klein | Baut auf den Zielen auf |
| Siegpunkte und Rundenlimit | klein | – |
| Regeln gegen Helden (Abschnitt 4) | mittel | Als Schalter je Fähigkeit, nur im Modus aktiv |
| KI für ein Heldenteam gegen ein Heldenteam | mittel | Für die Simulation; die bestehende Helden-KI kennt nur Monster als Gegner |
| Lobby mit zwei Teams und Wahl im Wechsel | mittel | Neue Ansicht am Tisch und auf den Handys |
| Handy-Ansicht je Team | klein | Eigenes Team hervorgehoben, verdeckte Informationen |
| Zeitlimit je Zug | klein | Auch für die Kampagnen nutzbar |
| Karte für zwei Startseiten | mittel | Spiegelgleich, damit keine Seite im Vorteil ist; ein neues Kartenbild |
| Datenbank | klein | Nur für Titel und Erfolge. Kein Fortschritt, keine Rangliste. Eigene Migration, du führst das SQL aus. |

**Grenze der Technik:** Das Tischgerät rechnet die Partie, kein Server prüft die Züge. An einem gemeinsamen Tisch ist das in Ordnung. Für Belohnungen heißt das: nur Dinge vergeben, bei denen Betrug niemandem schadet (Titel, Erfolge), keine XP in nennenswerter Höhe.

## 8. Belohnungen

- **Keine oder kaum XP.** Vorschlag: 25 XP je Held für eine beendete Partie, höchstens dreimal am Tag. So bleibt der Modus kein Level-Abkürzer.
- **Titel und Erfolge**, zum Beispiel „Artefaktträger“ (das Artefakt nach Hause getragen) oder „Wächterbezwinger“ (letzter Schlag gegen den Wächter).
- **Kosmetisches** erst, wenn es dafür überhaupt ein System im Spiel gibt.

## 9. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Kontrolle und Heilung kippen die Partie | Regeln aus Abschnitt 4, Messung in Phase 2, Abbruchkriterium |
| Wartezeit zwischen den Zügen | 3 gegen 3, Zeitlimit, Monsterzüge schnell abgespielt |
| Ein Team fühlt sich von den Monstern benachteiligt | Feste, sichtbare Zielregel mit Anzeige am Tisch |
| Schneeballeffekt: Wer führt, gewinnt | Rückkehr am Startpunkt, Monster bevorzugen bei Gleichstand das führende Team, Artefakt macht langsam |
| Der Umbau der Engine bricht die Kampagnen | Alle bestehenden Testläufe müssen nach jedem Schritt grün sein; der Modus läuft hinter einem Schalter |
| Der Modus zieht Zeit von den Kampagnen ab | Phase 0 zuerst; nach Phase 4 eine ehrliche Entscheidung |
| Verdeckte Informationen am offenen Tisch | Verstecken und Hinterhalt im Modus vereinfachen statt geheim halten |

## 10. Offene Entscheidungen

1. **Teamgröße:** 3 gegen 3 (Vorschlag) oder 4 gegen 4? Größere Teams bedeuten längere Wartezeiten.
2. **Feste Stufe:** 5 (Vorschlag) oder eine andere?
3. **Wer steuert überzählige Helden,** wenn die Gruppe ungerade ist?
4. **XP im Modus:** gar keine oder der kleine Betrag aus Abschnitt 8?
5. **Zeitlimit:** fest 60 Sekunden oder am Tisch einstellbar?
6. **Reihenfolge:** Soll der Modus vor oder nach dem Neubau von Hardcore kommen?

## 11. Messgrößen für Phase 4

- Dauer einer Partie: Ziel 20–35 Minuten.
- Anteil der Partien, die über das Artefakt enden (nicht über das Rundenlimit): Ziel über 50 %.
- Anteil der Züge, die durch das Zeitlimit enden: Ziel unter 10 %.
- Siegquote der Startseiten: Ziel 45–55 %.
- Anteil der Testgruppen, die sofort eine zweite Partie spielen wollen: Ziel über 50 %.
