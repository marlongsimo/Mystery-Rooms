# DER LETZTE FALL – Ermittlungsdesign

**Entwurf 3 · Umbau vom Escape Room zum Ermittlungsspiel** · Krimi · 1–4 Personen · ca. 75–90 Minuten

> Leitfrage des Spiels: nicht „Wie komme ich weiter?“, sondern **„Was ist wirklich passiert?“**

**Verhältnis zu `RAETSELDESIGN.md`:** Geschichte, Figuren, Zeittafel, Schlüssel, Mechanismus und Zahlen (Abschnitte 1–3) bleiben dort verbindlich und gelten unverändert. Dieses Dokument ersetzt die *Spielmechanik* (dort Abschnitte 4–8): wie man vorankommt, was geprüft wird und wie die Oberfläche aussieht. Wird eine Uhrzeit, ein Name oder ein Betrag gebraucht, steht er im Rätseldesign.

Hotel Nocturne bleibt ein Erkundungs- und Escape-Spiel. Beide Spiele teilen die Plattform, nicht das Spielprinzip.

---

## 1. Grundsätze

1. **Die Welt liefert Material, die Ermittlung liefert Fortschritt.** In den Räumen wird untersucht, gefunden und sichtbar gemacht (Durchschlag schraffieren, Pfeil mit der Taschenlampe finden). Neue Orte und Wendungen öffnen sich nur durch **eingereichte Erkenntnisse**, nicht durch Zahlenschlösser.
2. **Jede Prüfung ist eine ausdrückliche Handlung.** Das Spiel bewertet nur, was eingereicht wird. Freies Arbeiten an der Wand (Fäden, Notizen, Verschieben) löst nie etwas aus.
3. **Behauptung plus Beleg.** Eine Erkenntnis besteht aus einer Antwort *und* den Beweisen, die sie tragen. Wer richtig rät, aber nichts belegen kann, kommt nicht weiter. Das macht Raten wertlos und Beweise wichtig.
4. **Fehler lehren etwas über den Fall.** Jede falsche Einreichung bekommt eine Rückmeldung, *warum* sie nicht trägt, ohne die Lösung zu verraten. Es gibt keine Strafe, keinen Zeitverlust.
5. **Alles ist auch ohne Fadenziehen lösbar.** Auf dem Smartphone reicht: Frage antippen → Antwort wählen → Beweise auswählen → einreichen. Die Wand ist das Denkwerkzeug und ein zweiter Zugang zu denselben Fragen.
6. **Mehrere richtige Beweisketten sind erlaubt**, solange sie die Behauptung wirklich belegen. Völlig freie Texteingaben gibt es nicht – sie wären nicht fair auswertbar.

## 2. Das Ermittlungs-Tablet

Hagedorns Dienst-Tablet ersetzt Rucksack, Akte und Pinnwand-Knopf. Es öffnet sich bildschirmfüllend und hat fünf Reiter (auf dem Smartphone unten, auf großen Bildschirmen links):

| Reiter | Inhalt | Ersetzt |
|---|---|---|
| **Fall** | Fallstand (Zugang · Gelegenheit · Mittel · Motiv), offene Fragen, gesicherte Erkenntnisse, Abschlussbericht | Ziele, Hinweise „Worum geht es?“ |
| **Beweise** | Archiv aller Dokumente, Fotos, Abschriften und Fundstücke; Filter nach Ort und Person; Vergleichsansicht (zwei Dokumente nebeneinander) | Akte und Rucksack |
| **Personen** | Akten zu Mira, Timo, Ruth, Keller, Reuter, Mahler, Hagedorn: Rolle, Beziehung zu Reuter, Aussage, Hagedorns Verdacht, geprüfte Punkte | – (neu) |
| **Zeitleiste** | Tatnacht 17:00–22:00 und die Tage danach; Einträge aus Beweisen, mit Quelle und Uhrart | Sortierrätsel |
| **Wand** | Hagedorns Ermittlungswand wie bisher, gemeinsam bearbeitbar | Pinnwand |

Das **Telefon** bleibt als Gerät der Spielfigur: Nachrichten (Wessel, Mahler, die SMS), Taschenlampe, Karte, Hinweise.

**Gegenstände** gibt es kaum noch: Bleistift und Taschenlampe (Telefon) für Untersuchungen in der Welt, die Schlüssel werden zu Fakten („Du hast K-4 Reserve“) und liegen im Reiter Beweise.

### Fallstand (Reiter „Fall“)

Oben vier Felder, die sich mit gesicherten Erkenntnissen füllen – so sieht man jederzeit, wie weit der Fall gegen den Täter ist:

```text
ZUGANG        GELEGENHEIT     MITTEL          MOTIV
K-4 → Keller  21:29 im Haus   Handablass/P-4  T-17 / 186.400 €
   ✓               ✓              offen           offen
```

Darunter: **Offene Fragen** (nur die, die man schon kennt) und **Erkenntnisse** (eingereichte, richtige Antworten als kurze Sätze in Hagedorns Stil). Vor dem Finale steht hier der **Abschlussbericht**.

## 3. Das Fragen-System

### 3.1 Aufbau einer Frage

```js
{
  id: "f_abgang",
  chapter: 2,
  text: "Wann verließ Keller das Haus wirklich?",
  answer: { type: "time", accept: ["2127"] },          // time | person | claim | object
  evidence: { need: 2, sets: [["pfoertner", "uhrzettel"]] }, // jede Menge in sets ist eine gültige Beweiskette
  wrongAnswer: { "2133": "Das ist die Zeit der Foyeruhr – stimmt die Foyeruhr?", "2129": "Das ist die Seitentür, nicht der Abgang." },
  wrongEvidence: { seitentuer: "Die Seitentür sagt, wann er hereinkam – nicht, wann er ging." },
  missingEvidence: "Woher weißt du das? Wessel will eine Quelle.",
  unlocks: { questions: ["f_anwesend"], timeline: ["keller_abgang_korr"], person: { keller: "abgang" } },
  finding: "Keller ging um 21:27 – die Foyeruhr geht sechs Minuten vor.",
  hints: ["…", "…", "…"],
}
```

### 3.2 Antwortarten

| Art | Eingabe | Warum so |
|---|---|---|
| **time** | Uhrzeit über Ziffernfeld (hh:mm) | Zeit ist der Kern dieses Falls; Raten ist praktisch unmöglich |
| **person** | Auswahl aus allen *bekannten* Personenakten | alle Namen stehen immer zur Wahl, nicht nur die naheliegenden |
| **object** | Auswahl aus dem Beweisarchiv (z. B. ein Stift, ein Schlüssel) | die Antwort muss gefunden worden sein |
| **claim** | Auswahl aus 3–4 ausformulierten Hypothesen | nur, wo eine Aussage nötig ist; alle Hypothesen müssen plausibel sein, und ohne Beleg zählt keine |

### 3.3 Prüfung und Rückmeldung

Reihenfolge der Prüfung, damit die Rückmeldung immer die *erste* Schwachstelle nennt:

1. **Antwort falsch** → spezifische Rückmeldung (falls hinterlegt), sonst: „Das passt nicht zu dem, was die Belege zeigen.“
2. **Antwort richtig, zu wenige Belege** → `missingEvidence`.
3. **Antwort richtig, Beleg trägt nicht** → `wrongEvidence[beweis]` für den ersten unpassenden Beleg, sonst: „Die Antwort stimmt. Aber „…“ zeigt das nicht.“
4. **Alles richtig** → Erkenntnis wird gesichert, Fallstand und Personenakte aktualisieren sich, ggf. öffnet sich ein Ort oder eine neue Frage.

Nach drei Fehlversuchen an derselben Frage schlägt das Tablet einmal dezent die Hinweise vor.

### 3.4 Fragen und Wand

Hagedorns Fäden sind mit Fragen verknüpft. Antippen eines roten Fadens („Timo – Zugang Technik“) öffnet die passende Frage („Stimmt Timos Aussage?“). Wird sie richtig beantwortet, wird der Faden an der Wand durchgestrichen und die Person bekommt **ENTLASTET** – die bestehende Mechanik bleibt, sie läuft nur über dieselben Fragen.

## 4. Neue Dokumente: Vernehmungen

Für „Aussagen prüfen“ braucht es Aussagen. Hagedorn hat am Dienstag, 10.11., alle befragt; die Protokolle liegen in seinem Büro (Aktenschrank) und füllen die Personenakten.

| Person | Kern der Aussage | Wird geprüft gegen |
|---|---|---|
| **Jannis Keller** | „Ich bin gegen halb zehn gegangen, ganz normal über die Pforte. Danach war ich zu Hause. Schlüssel zur Technik? Habe ich nie gebraucht.“ | Seitentür 21:29, Durchschlag K-4 → **zwei Lügen** |
| **Mira Seidel** | „Ja, wir haben gestritten. Er wollte mir die Rolle wegnehmen. Im Blackout stand ich an der Rampe links und habe meinen Monolog gesprochen.“ | Probenmitschnitt, Regiebuch → stimmt |
| **Timo Brandt** | „Um 21:10 habe ich die Kontrolle gemacht, der Stift steckte. Im Blackout saß ich am Pult und habe auf die Freigabe gewartet.“ | Kontrollliste, Sprechanlage → stimmt |
| **Ruth Eilers** | „Die Samtkante am Mond habe ich am Nachmittag erneuert. Ab halb sieben war ich in der Werkstatt.“ | Nähprotokoll, Musterbuch → stimmt |
| **Kurt Mahler** (Pforte) | „Ich trage ein, was die Uhr im Foyer zeigt. So machen wir das seit Jahren.“ | Wartungszettel → erklärt die 6 Minuten |

Keller ist damit der Einzige, dessen Aussage zweimal den Belegen widerspricht. Das ist bewusst sichtbar, aber erst, wenn man es selbst belegt hat.

## 5. Die Zeitleiste

**Einträge** entstehen aus Beweisen, nicht aus freier Eingabe. Jeder Eintrag hat Uhrzeit, Ereignis, Quelle und **Uhrart**:

| Uhrart | Darstellung | Bedeutung |
|---|---|---|
| Funkuhr / Server | durchgezogen | zuverlässig (Seitentür, Steuerung, Mitschnitte) |
| Foyeruhr | gestrichelt, Symbol ⏱ | geht 6 Minuten vor (erst bekannt nach dem Wartungszettel) |
| Handschrift / geschätzt | blass | Aussage oder Notiz, nicht gemessen |

**Mechanik:**
- Neue Beweise legen ihre Einträge automatisch in die Zeitleiste („Pförtnerbuch: Keller geht · 21:33 ⏱“).
- Widersprüche werden **nicht** automatisch markiert. Der Spieler kann zwei Einträge antippen und „Widerspruch melden“ – das öffnet die passende Frage, falls es eine gibt, sonst: „Das passt zusammen.“
- Einträge ohne Uhrzeit (die vier Regiezettel) müssen von Hand an ihre Stelle gezogen werden; die Kürzel aus dem Steuerungsprotokoll liefern die Zeiten. Richtige Reihenfolge einreichen = Frage F6.
- Gesicherte Korrekturen erscheinen als neuer, grüner Eintrag („Keller geht · 21:27 · korrigiert“); der alte bleibt durchgestrichen sichtbar.

## 6. Ablauf in fünf Kapiteln

Die fünf Orte bleiben. Ihre Funktion ändert sich, und zwischen ihnen öffnen nur Erkenntnisse den Weg.

### Kapitel 1 · Ermittlungsbeginn – Hagedorns Büro (ca. 10 Min.)

Der Theaterschlüssel liegt offen auf dem Schreibtisch – kein Code mehr. Die Wand wird mit dem Tablet übernommen (kurzes Ereignis mit Einführung der Reiter, keine Frage).

| # | Frage | Antwort | Beleg(e) | Öffnet |
|---|---|---|---|---|
| F1 | **Woran zweifelte Hagedorn?** | claim: „Der Mond fiel nicht durch einen Defekt – jemand hat die Bremse gelöst.“ (gegen: Motorschaden · falsch aufgehängt · Bedienfehler am Lichtpult) | Akte Reuter: Kriminaltechnik (Stift fehlt) **oder** Hagedorns Randnotiz „Motor ≠ Bremse“ | Kapitel 2 (Theater), Fallstand |
| F2 *(optional)* | **Hat Hagedorn die SMS selbst geschrieben?** | claim: „Nein.“ | Hagedorns Notizen („– H.“) + Dienstplan (fremde Schrift) | Personenakte Hagedorn: „vermisst“; Wessel-Nachricht |

Rückmeldungen F1: Motorschaden → „Die Störung am 26.10. betraf den Motor. Was sagt die Kriminaltechnik über die Bremse?“ · Lichtpult → „Licht kann keinen Mond abstürzen lassen.“

### Kapitel 2 · Zeitleiste – Foyer und Pforte (ca. 15 Min.)

Untersuchung in der Welt: **Durchschlag** mit dem Bleistift sichtbar machen (bleibt, ist echte Spurensuche). Der Schlüsselkasten wird Beobachtung ohne Rätsel (K-4 fehlt, B-1 hängt da).

| # | Frage | Antwort | Beleg(e) | Öffnet |
|---|---|---|---|---|
| F3 | **Wann verließ Keller das Haus wirklich?** | time 21:27 | Pförtnerbuch + Wartungszettel *(oder Mahlers Aussage + Wartungszettel)* | korrigierter Zeitleisteneintrag |
| F4 | **War Keller zur Tatzeit im Haus?** | claim: „Ja – zwei Minuten nach seinem Abgang kam er durch die Seitentür zurück.“ (gegen: „Nein, er war gegangen“ · „Das Seitentürprotokoll ist fehlerhaft“ · „Jemand hat seine Karte benutzt“) | Protokoll Seitentür + Zeitabgleich (F3) | **Gelegenheit ✓**, blauer Faden grün, Kapitel 3 |
| F5 | **Wer hatte Schlüssel K-4 – und wer lügt darüber?** | person Keller | Durchschlag + Vernehmung Keller | **Zugang ✓**, gelber Faden grün, Keller-Akte: „Aussage widerlegt“ |

Rückmeldungen: F4 „Karte geliehen“ → „Möglich – aber dann bräuchtest du einen Beleg dafür. Hast du einen?“ · F4 nur Pförtnerbuch → „Laut Pförtnerbuch war er weg – oder?“ · F5 nur Schlüsselkasten → „Der leere Haken zeigt, *dass* K-4 fehlt, nicht *wer* ihn hat.“

### Kapitel 3 · Tathergang – Bühne und Lichtregie (ca. 22 Min.)

| # | Frage | Antwort | Beleg(e) | Öffnet |
|---|---|---|---|---|
| F6 | **Wie ist der Mond gefallen?** (Zeitleiste der Mondszene) | Reihenfolge VR → LS47 → Z12-H → AL, dann claim: „Im Blackout hat jemand auf dem Schnürboden den Handablass gezogen.“ | Steuerungsprotokoll + Schema Zug 12 | **Mittel (teilweise)** |
| F7 | **Welcher Stift fehlt – und seit wann?** | object P-4 (aus dem Schema) + Zeitraum „nach 21:10“ | Schema Zug 12 + Kontrollliste | Mittel: „P-4 fehlt“ |
| F8 | **Stimmt Timos Aussage?** | claim: „Ja – er war um 21:44:08 am Lichtpult.“ | Mitschnitt Sprechanlage | Timo **ENTLASTET** |
| F9 | **Stimmt Miras Aussage?** | claim: „Ja – sie sprach im Blackout an der Rampe links.“ | Probenmitschnitt **oder** Regiebuch | Mira **ENTLASTET**, Kapitel 4 |
| F10 *(optional)* | **Warum stand Reuter genau unter dem Mond?** | claim: „Er stand laut Probenplan selbst auf Mitte – und der Täter kannte den Plan.“ | Regiebuch + Probenplan mit Kürzel J.K. (Kapitel 4) | Fallstand: Vorsatz |

Rückmeldungen: F8 mit Kontrollliste → „Die Kontrollliste beweist, dass Timo um 21:10 am Zug war – nicht, wo er um 21:44 war.“ · F9 mit Streit-Notiz → „Ein Streit erklärt ein Motiv. Wo war sie im Blackout?“ · F6 Z12-H vor LS47 → „Dann wäre der Mond im hellen Licht gefallen – alle hätten es gesehen.“

**Hagedorns Spur:** Seine Notiz „Wenn du den letzten Vorhang siehst …“ führt zur Seite „Schlussvorhang“ im Regiebuch (Untersuchung, keine Frage) → „U-4“.

### Kapitel 4 · Motive und Verdächtige – Werkstatt und Verwaltung (ca. 18 Min.)

Untersuchung: **Faserabgleich** – Kriminaltechnik und Musterbuch im Reiter Beweise nebeneinander legen, Probe wählen (Bordeaux 0917). Liefert den Befund für F11.

| # | Frage | Antwort | Beleg(e) | Öffnet |
|---|---|---|---|---|
| F11 | **Stimmt Ruths Aussage?** | claim: „Ja – die Fasern stammen von ihrer Reparatur um 17:05.“ | Nähprotokoll + Faserbefund | Ruth **ENTLASTET** |
| F12 | **Was hatte Reuter entdeckt?** | claim: „Keller hat über Scheinrechnungen von BTW Geld auf sein eigenes Konto geleitet.“ (gegen: „Hartwig hat doppelt abgerechnet“ · „BTW ist eine echte Zweitfirma“ · „Reuter selbst hat Geld veruntreut“) | Zahlungsbuch (IBAN) + Reisekostenabrechnung (IBAN) | **Motiv (teilweise)**, Rechnungsvergleich |
| F13 | **Was wollte Reuter am nächsten Tag tun?** | claim: „Die Zahlungen stoppen und Keller beim Kulturamt melden – am 10.11. um 9 Uhr.“ | Reuters Notiz + Kalender | **Motiv ✓** |

**Reuters Tresor** bleibt als Schloss – aber er ist jetzt die *Folge* von F13: Wer weiß, welcher Tag Reuter so wichtig war, kennt den Code (1011). Darin: K-4 Reserve und die Mappe T-17.

Rückmeldungen F12: Hartwig → „Hartwig hat gearbeitet – im Pförtnerbuch stehen ihre Monteure.“ · nur Rechnungen → „Zwei Rechnungen zeigen, *dass* doppelt gezahlt wurde. Wohin ging das Geld?“

### Kapitel 5 · Auflösung – Wartungsgang U-4 (ca. 13 Min.)

Bleibt weitgehend: Tür U-4 mit K-4 Reserve, Dunkelheit, Taschenlampe, Hagedorns Pfeil „H. ↓“, Stift P-4 unter dem Gitter (Untersuchung, liefert **Mittel ✓**).

| # | Frage | Antwort | Beleg(e) | Öffnet |
|---|---|---|---|---|
| F14 | **Welche Nummer benutzt Keller überall?** | time-Feld als Ziffern 4417 | Protokoll Seitentür + Zahlungsbuch (IBAN …4417 02) | das Vorhängeschloss der Kammer → Hagedorn |
| F15 | **Abschlussbericht an Dr. Wessel** | person Keller + je ein Beleg für Zugang, Gelegenheit, Mittel, Motiv | siehe Rätseldesign Abschnitt 6, Rätsel 15 | Finale |

F14 ersetzt das Zahlenschloss nicht, sondern begründet es: Das Schloss nimmt die Zahl erst an, wenn die Frage gesichert ist (oder: das Schloss *ist* die Eingabe, die Belege werden mit eingereicht).

**F15 – Abschlussbericht:** Voraussetzung sind die drei Entlastungen (F8, F9, F11). Rückmeldung bei Fehlern: „x von 5 Angaben sind schlüssig“ (Täter + vier Felder), ohne zu sagen welche. Fehlt eine Entlastung: „Solange ein falscher Verdacht an der Wand hängt, zerreißt Wessel den Bericht.“

## 7. Zählung

| | Anzahl |
|---|---|
| Pflichtfragen | 13 (F1, F3–F9, F11–F15) |
| Optionale Fragen | 2 (F2, F10) – zählen als „Erkenntnisse“ in der Abschlussstatistik |
| Untersuchungen in der Welt | 5 (Durchschlag, Schlussvorhang-Notiz, Faserabgleich, Bodengitter, Tresor) |
| Echte Zahlenschlösser | 2 (Tresor, Kammer) – beide als Folge einer Erkenntnis |
| Geheimnisse | 5 (wie bisher) |

Abschlussbildschirm: „13 von 13 Erkenntnissen · 2 von 2 Zusatzfragen · x Fehleinreichungen · y Hinweise“.

## 8. Gemeinsam ermitteln

- **Gesicherte Erkenntnisse** sind gemeinsamer Spielstand (wie heute gelöste Rätsel).
- **Entwürfe** (gewählte Antwort und Belege einer offenen Frage) sind pro Frage geteilt – letzter Schreiber gewinnt. Wer die Frage öffnet, sieht: „Alex hat zuletzt bearbeitet.“
- **Einreichen darf jede/r.** Das Ergebnis gilt für alle; bei Fehlern sehen alle die Rückmeldung („Alex hat eingereicht: Die Antwort stimmt, aber …“).
- **Zeitleiste und Wand** sind gemeinsam; Notizen und eigene Fäden ebenfalls (wie bisher je Objekt).
- Hinweise und Fehlversuche zählen pro Person, in der Statistik zusammen.

## 9. Was bleibt, was neu ist

| Vorhanden | Neue Verwendung |
|---|---|
| Räume mit vier Blickrichtungen, Hotspots, Dunkelheit | Untersuchungsorte |
| Dokumente (`N.docs`) | Beweisarchiv; Dokumente bekommen Metadaten: Ort, Personen, Zeitleisteneinträge |
| Pinnwand (`platform/board`) | Reiter „Wand“, Fäden mit Fragen verknüpft |
| Rätseltypen choice/code/use | nur noch für Untersuchungen (Faserabgleich, Tresor, Kammer, Tür) |
| Hinweise-App, „Worum geht es?“ | pro Frage, drei Stufen |
| Multiplayer-Sync, Filmsequenzen, Prolog, Finale | unverändert |

**Neu zu bauen:**
1. Tablet-Gerüst mit fünf Reitern (ersetzt Seitenleiste mit Rucksack/Akte im Spiel).
2. Fragen-System: Datenformat, Einreichen-Dialog (Antwort + Belege), Auswertung, Rückmeldungen, Freischaltungen.
3. Fallstand mit den vier Feldern.
4. Zeitleiste: Einträge aus Dokumenten, Uhrarten, „Widerspruch melden“, Sortieren, Korrekturen.
5. Personenakten mit Vernehmungen und Prüfstatus.
6. Vergleichsansicht im Beweisarchiv (zwei Dokumente nebeneinander).
7. Verknüpfung Wand ↔ Fragen.

## 10. Vorgehen

1. **Dieses Dokument prüfen und festschreiben** (vor allem: Fragenkatalog, Hypothesen-Texte, Rückmeldungen).
2. **Prototyp Kapitel 2 (Foyer):** Tablet mit allen fünf Reitern, Fragen F3–F5, Zeitleiste mit Foyeruhr/Serverzeit, Personenakte Keller und Mahler. Allein und zu zweit testen. Hier zeigt sich, ob „Behauptung plus Beleg“ sich gut anfühlt.
3. Kapitel 1 und 3 umstellen, dann 4 und 5.
4. Bisherige Version 1 bleibt spielbar, bis Version 2 vollständig ist.
5. Plattform: zwei Spielarten „Erkundung“ (Hotel Nocturne) und „Ermittlung“ (Der letzte Fall) auf der Startseite; über einen neuen Plattformnamen erst nach der Testphase entscheiden.

## 11. Offene Entscheidungen

| Frage | Vorschlag |
|---|---|
| Sollen claim-Fragen ganz durch Personen/Zeit/Objekt ersetzt werden? | Nein – aber pro Kapitel höchstens zwei claim-Fragen, und jede Hypothese muss plausibel sein |
| Wie streng sind Belege? | Jede Frage hat 1–2 gültige Beweisketten; zusätzliche, passende Belege schaden nicht, unpassende werden zurückgemeldet |
| Bleiben Zahlenschlösser? | Nur Tresor und Kammer, beide als Folge einer Erkenntnis |
| Zeitlimit / Druck? | Kein Timer; Dringlichkeit über Hagedorns Klopfen und Wessels Nachrichten |
| Version 1 behalten? | Ja, bis Version 2 fertig ist; danach ersetzen |
