# DER LETZTE FALL – Der letzte Vorhang

**Rätseldesign · Entwurf 2 (freigegeben zur Prototyp-Phase)** · Krimi · 1–4 Personen · ca. 75–90 Minuten · ab 12 Jahren

> Ein Theaterdirektor stirbt bei der Abendprobe. Der Kommissar, der zweifelt, verschwindet. Zurück bleibt seine halb fertige Ermittlungswand – mit richtigen Spuren, falschen Fäden und einer letzten Notiz.

> **Hinweis (Entwurf 3):** Die Spielmechanik wird zum Ermittlungsspiel umgebaut – siehe `ERMITTLUNGSDESIGN.md`. Geschichte, Figuren, Zeittafel und Zahlen in diesem Dokument bleiben verbindlich; die Abschnitte 4–8 beschreiben Version 1.

Dieses Dokument ist die verbindliche Grundlage, bevor gebaut wird. Jede Uhrzeit, jedes Beweisstück und jede Lösung steht hier genau einmal. Wird etwas geändert, dann zuerst hier.

---

## 1. Die Geschichte in einem Absatz

Am **Montag, 9. November 2026**, stürzt während der Abendprobe im **Stadttheater Velden** um **21:44:12 Uhr** der „Mond“ herab – ein 180 Kilogramm schweres Bühnenelement am Zug 12 – und erschlägt Intendant **Anton Reuter**. Es sieht aus wie ein technischer Defekt. Tatsächlich hat Verwaltungsdirektor **Jannis Keller** den Sicherungsstift **P-4** gezogen und den Zug im Blackout von Hand abgelassen: Reuter hatte entdeckt, dass Keller über drei Jahre **186.400 €** mit Scheinrechnungen abgezweigt hat, und wollte es am nächsten Morgen dem Kulturamt melden. Hauptkommissar **Rainer Hagedorn** zweifelt am Unfall und baut in seinem Büro eine Ermittlungswand auf. Am **Mittwochabend** geht er allein ins Theater und findet im Wartungsgang **U-4** den versteckten Stift. Als er Keller kommen hört, versteckt er ihn im Dunkeln – dann sperrt Keller ihn in die Kammer am Ende des Gangs. Von Hagedorns Telefon kommt eine Nachricht: „Brauche ein paar Tage Abstand.“ Am Donnerstag schließt die Dienststelle den Fall als Unfall. **Freitagnacht** steht seine Partnerin oder sein Partner – die Spielerin / der Spieler – vor seiner Wand.

### Festlegungen zur Welt

- **Spielzeit der Handlung:** Freitag, 13. November 2026, ab 22:00 Uhr. Hagedorn ist seit **zwei Nächten** eingesperrt. Im Wartungsgang gibt es einen Wasserhahn – er lebt, ist aber erschöpft. Das gibt dem Spiel Dringlichkeit, ohne es grausam zu machen.
- **Warum sucht niemand nach ihm?** Hagedorn gilt nicht als vermisst. Die Nachricht von seinem Telefon (geschrieben von Keller) erklärt sein Fehlen. Kriminalrat **Dr. Wessel** hält ihn für überarbeitet und schließt den Fall.
- **Warum ist der Fall offiziell ein Unfall?** Zug 12 hatte zwei Wochen zuvor eine Störung (echt, dokumentiert). Ein Defekt war die naheliegende Erklärung.
- **Wer ist die Spielerin / der Spieler?** Hagedorns Partner/in bei der Kripo, angesprochen mit „du“. Ein Name ist optional über `config.js` personalisierbar wie bei Hotel Nocturne; alle Texte bleiben geschlechtsneutral und funktionieren auch ohne Namen.
- **Warum erst Freitag?** Du warst seit Montagmittag auf einer Fortbildung in einer anderen Stadt, dein Diensthandy lag die ganze Woche im Büro. Freitagabend kommst du zurück – und findest auf dem Display die Nachricht von Mittwoch.
- **Die Wand:** Sie hängt im Büro. Im ersten Raum fotografierst du sie mit Hagedorns Dienst-Tablet – ab dann arbeitest du überall auf dem Tablet weiter. So ist die Pinnwand in jedem Raum verfügbar.
- **Ton:** Krimi, nicht Horror. Kein Blut, keine Schreckmomente. Spannung aus Zeitdruck und Widersprüchen.

### Abgrenzung zu Hotel Nocturne (bewusst)

| Hotel Nocturne | Der letzte Fall |
|---|---|
| alter Fall (17 Jahre) | frischer Fall (vier Tage) |
| Einladung ohne Absender | du ermittelst aus eigenem Antrieb |
| Wahrheit über die Vergangenheit | ein Mensch, der jetzt noch zu retten ist |
| Erkunden eines Gebäudes | Kombinieren an der Pinnwand |
| unsichtbare Helferin | ein Gegner, der Spuren beseitigt |

---

## 2. Figuren

| Figur | Rolle | Was gegen sie spricht (Hagedorns Faden) | Was sie entlastet / überführt |
|---|---|---|---|
| **Anton Reuter** (61) | Intendant, Opfer | – | Notiz „Zahlung stoppen. Morgen melden.“ |
| **Jannis Keller** (44) | Verwaltungsdirektor, stellv. Leiter | gelber Faden: „Schlüssel?“ | **Täter.** Schlüssel K-4, Rückkehr 21:29, Stift P-4 im Schrank K-4, Scheinrechnungen |
| **Mira Seidel** (32) | Hauptdarstellerin | rot: Streit mit Reuter am Vormittag (er wollte ihr die Rolle entziehen) | Regiebuch + Probenmitschnitt: im Blackout an der Rampe links, spricht ihren Monolog |
| **Timo Brandt** (27) | Beleuchter / Bühnentechnik | rot: Zugang zur Bühnentechnik, hat um 21:10 die Sicherheitskontrolle gemacht | Mitschnitt Sprechanlage: 21:44:08 am Lichtpult |
| **Ruth Eilers** (55) | Kostümbildnerin | rot: rote Samtfasern am Mond | Nähprotokoll: Samtkante am Mond um 17:05 repariert |
| **Rainer Hagedorn** (58) | Hauptkommissar | – | eingesperrt in U-4 |
| **Kurt Mahler** (66) | Pförtner (nur Dokumente) | – | Pförtnerbuch, Schlüsselregister |
| **Dr. Wessel** | Kriminalrat (nur Nachrichten) | – | schließt den Fall, drängt dich zur Ruhe |

**Schlüssel – genau festgelegt:**
- **Schlüssel K-4** (Technik: Schnürboden-Aufgang, Unterbühne, Tür U-4, Werkzeugschrank W-1 im Gang) gibt es **zweimal**: das reguläre Exemplar an der Pforte und einen **Ersatzschlüssel in Reuters Tresor**.
- Das reguläre K-4 hat Keller am Montag um 20:58 geholt und **nie zurückgegeben** – im Register fehlt die Rückgabe.
- Hagedorn ließ sich am Mittwoch beim Pförtner den **Generalschlüssel des Hauses** geben (Eintrag im Pförtnerbuch). Keller nahm ihn ihm beim Einsperren ab. Bei der Festnahme hat Keller beide Schlüssel bei sich.
- Sprachlich getrennt: **Schlüssel K-4** · **Werkzeugschrank W-1** (Schließung K-4) · **Wartungsgang U-4**.

**Der Mechanismus des Mordes:** Zug 12 ist ein motorischer Zug, eine Federspeicherbremse hält die Last. Für Notfälle gibt es auf dem **Schnürboden** einen **Handablass-Hebel**, der die Bremse öffnet. Dieser Hebel ist im Probenbetrieb mit dem **Sicherungsstift P-4** blockiert. Ohne P-4 lässt sich der Hebel ziehen, und die Last fällt ungebremst. Keller zog P-4 gegen 21:31 und den Hebel im Blackout um 21:44:12. Die Steuerung protokolliert jeden Handablass mit Uhrzeit („Z12-H“). Wer am Lichtpult oder auf der Bühne war, konnte den Hebel nicht ziehen – er ist nur oben auf dem Schnürboden erreichbar. Die Störung an Zug 12 zwei Wochen vorher betraf den Motor, nicht die Bremse; sie lieferte nur die bequeme Erklärung „Defekt“.

Keller hat für alles dieselbe Nummer: **4417** – seine Kartennummer an der Seitentür, und der Code des Vorhängeschlosses an U-4. Hagedorn hat das bemerkt („Benutzt er überall dieselbe Nummer?“).

---

## 3. Zeittafel (verbindlich)

**Montag, 9. November – Tatabend**

| Zeit | Ereignis | Beleg im Spiel |
|---|---|---|
| 17:05 | Ruth näht die rote Samtkante des Mondes neu | Nähprotokoll (Bereich 4) |
| 18:30 | Probenbeginn „Die Nacht der Masken“ | Probenplan |
| 20:58 | Pförtner gibt Schlüssel **K-4** an **Keller** aus | Schlüsselregister – oben geschwärzt, im Durchschlag lesbar (Bereich 2) |
| 21:10 | Sicherheitskontrolle Zug 12: „P-4 gesteckt ✓ – T.B.“ | Kontrollliste (Bereich 3) |
| 21:15 | Reuter legt fest: „Mondszene – ich stehe selbst auf Markierung Mitte und prüfe das Licht im Blackout.“ | Regiebuch (Bereich 3) |
| **21:33 Foyeruhr = 21:27 echt** | Keller trägt sich beim Pförtner aus: „Feierabend“ | Pförtnerbuch (Bereich 2); Foyeruhr geht 6 Minuten vor (Wartungszettel) |
| **21:29** | Kellers Karte **4417** öffnet die Seitentür | Protokoll Seitentür, Serverzeit (Bereich 2) |
| ca. 21:31 | Keller geht mit K-4 über den Technikaufgang auf den Schnürboden, zieht P-4 | (erschlossen) |
| 21:38 | Vorbereitungsruf „Achtung Mondszene“ | Lichtprotokoll / Regiezettel |
| 21:44:00 | Blackout, Lichtstimmung 47 (Timo am Lichtpult) | Lichtprotokoll |
| 21:44:05–21:44:40 | Mira spricht ihren Monolog an der Rampe links | Probenmitschnitt |
| 21:44:08 | Sprechanlage, Timo: „Blackout steht, warte auf Freigabe.“ – vom Lichtpult | Mitschnitt Sprechanlage |
| **21:44:12** | **Zug 12 – Handablass** (Notablass auf dem Schnürboden) | Zugprotokoll der Obermaschinerie |
| 21:45:03 | Arbeitslicht an | Lichtprotokoll |
| 21:52 | Keller legt P-4, eingewickelt in ein Tuch aus der Verwaltung, in den Werkzeugschrank W-1 im Wartungsgang und verlässt das Haus unbemerkt durch die Seitentür (Ausgang wird nicht protokolliert) | Tuch im Schrank (Bereich 5) |

**Danach**

| Zeit | Ereignis | Beleg |
|---|---|---|
| Di 10.11., 08:00 | Keller schwärzt seinen Namen im Schlüsselregister. Den Durchschlag darunter übersieht er. | Bereich 2 |
| Di 10.11., 09:00 | Reuters Termin beim Kulturamt („Prüfung T-17“) – findet nicht mehr statt | Reuters Kalender (Bereich 4) |
| Di–Mi | Hagedorn baut seine Wand | Bereich 1 |
| Mi 11.11., 20:45 | Hagedorn lässt sich beim Pförtner den Generalschlüssel geben | Pförtnerbuch (Bereich 2) |
| Mi 11.11., ca. 20:50 | Hagedorn hinterlegt seine Notiz im Regiebuch (Lichtregie) | Bereich 3 |
| Mi 11.11., ca. 21:15 | Hagedorn findet P-4 im Werkzeugschrank W-1. Er hört Schritte, schiebt den Stift unter das Bodengitter am Wasserhahn und ritzt einen Pfeil in die Wand. Keller sperrt ihn in die Kammer (Vorhängeschloss 4417), nimmt ihm den Generalschlüssel ab, findet den Schrank leer und sucht im Dunkeln vergeblich. | Bereich 5 |
| Mi 11.11., 21:58 | SMS von Hagedorns Telefon an dich: „Brauche ein paar Tage Abstand. Der Fall war ein Unfall. – R.H.“ | Telefon (Bereich 1) – Hagedorn unterschreibt sonst immer nur mit „H.“ |
| Do 12.11. | Dr. Wessel schließt den Fall als Unfall | Nachricht |
| **Fr 13.11., 22:00** | **Spielbeginn** | – |

---

## 4. Wege und Gegenstände

```text
1 HAGEDORNS BÜRO (Präsidium)
   │  Theaterschlüssel (Schublade 2144) · Tablet: Wand fotografieren
   ▼
2 FOYER & PFORTE ──────────────── Bühnenschlüssel B-1 (Schlüsselkasten)
   │  Bühnentür (B-1)
   ▼
3 BÜHNE & LICHTREGIE ──────────── Hagedorns Notiz: „U-4“
   │  Gang zur Verwaltung / Werkstatt (offen)
   ▼
4 KOSTÜMWERKSTATT & VERWALTUNG ── Ersatzschlüssel K-4 (Reuters Tresor 1011)
   │  zurück zur Bühne → Unterbühne → Tür U-4 (K-4)
   ▼
5 WARTUNGSGANG U-4 ─────────────── Stift P-4 (Bodengitter) · Hagedorn (Vorhängeschloss 4417)
   ▼
   Beweisführung an der Wand → Finale
```

Freigeschaltet ≠ besucht – wie bei Hotel Nocturne: Die Karte erlaubt Schnellreise nur in Bereiche, die man schon betreten hat.

### Gegenstandsmatrix

| Gegenstand | Fundort | Gebraucht in | Wofür |
|---|---|---|---|
| **Dienst-Tablet** | 1, Schreibtisch | überall | Pinnwand (nach dem Foto der Wand) |
| **Bleistift** | 1, Stiftebecher | 2 | Durchschlag im Schlüsselregister durchreiben |
| **Theaterschlüssel** | 1, Schublade (2144) | 1 → 2 | Haupteingang des Theaters |
| **Bühnenschlüssel B-1** | 2, Schlüsselkasten | 2 → 3 | Bühnentür |
| **Ersatzschlüssel K-4** | 4, Reuters Tresor (1011) | 3 → 5 | Tür U-4 in der Unterbühne |
| **Sicherungsstift P-4** | 5, unter dem Bodengitter (Taschenlampe) | Wand | Beweis „Mittel“ |
| Taschenlampe (Telefon) | von Anfang an | 3, 5 | Unterbühne und Gang sind dunkel |

### Beweismatrix (alles, was auf die Wand kann)

| Beweis (Dokument) | Fundort | Wofür |
|---|---|---|
| Hagedorns Wand (Foto) | 1 | Startzustand der Pinnwand |
| SMS „– R.H.“ | 1, Telefon | Story: Hagedorn hat sie nicht geschrieben |
| Wartungszettel Foyeruhr („geht 6 Min. vor“) | 2 | Rätsel 4 |
| Pförtnerbuch (Keller 21:33) | 2 | Rätsel 4 |
| Protokoll Seitentür (Karte 4417, 21:29) | 2 | Rätsel 4 |
| **Zeitabgleich Pforte** (entsteht durch Rätsel 4) | 2 | **Gelegenheit** |
| **Schlüsselregister, Durchschlag** (K-4 → Keller, 20:58) | 2 | **Zugang** |
| Regiebuch (Mondszene, Reuter auf Mitte; Mira Rampe links) | 3 | Mira entlasten |
| Probenmitschnitt (Miras Monolog 21:44:05) | 3 | Mira entlasten |
| Mitschnitt Sprechanlage (Timo 21:44:08 am Lichtpult) | 3 | Timo entlasten |
| Licht- und Zugprotokoll | 3 | Rätsel 5 |
| Kontrollliste Zug 12 (P-4 um 21:10 gesteckt) | 3 | Rätsel 7 |
| Hagedorns letzte Notiz („U-4“) | 3 | Weg zu Bereich 5 |
| Nähprotokoll (17:05, Samtkante Mond) | 4 | Ruth entlasten |
| Rechnungsvergleich T-17 (entsteht durch Rätsel 11) | 4 | **Motiv** |
| Reuters Notiz „Zahlung stoppen. Morgen melden.“ | 4 | **Motiv** |
| Leeres Tuch mit Verwaltungsstempel im Werkzeugschrank W-1 | 5 | stützt „Mittel“ (Verbindung zur Verwaltung) |
| **Sicherungsstift P-4** (verbogene Spitze, passt zum Schaden am Zug) | 5 | **Mittel** |

---

## 5. Die Pinnwand

### 5.1 Startzustand (Hagedorns Wand)

Beim Fotografieren übernimmt das Tablet diese Wand:

- **Karten:** Fotos von Mira, Timo, Ruth, Keller · Foto „Der Mond, 21:45“ · Dienstplan der Probe · Schema Zug 12 · Pförtnerbuch-Auszug (21:33) · Protokoll Seitentür (21:29)
- **Hagedorns Notizen:** „Wer war im Blackout wo?“ · „Foyeruhr prüfen!“ · „Warum stand Reuter genau dort?“ · „Benutzt K. überall dieselbe Nummer?“
- **Hagedorns Fäden:**

| Faden | Farbe | Hagedorns Begründung | Stimmt? | Wie man ihn auflöst |
|---|---|---|---|---|
| Mira → Mond | rot | „Streit am Vormittag. Motiv!“ | nein | **widerlegen** mit Probenmitschnitt (Regiebuch zählt auch) |
| Timo → Zug 12 | rot | „Zugang Technik, Kontrolle 21:10“ | nein | **widerlegen** mit Mitschnitt Sprechanlage |
| Ruth → Mond | rot | „Rote Fasern am Mond“ | nein | **widerlegen** mit Nähprotokoll |
| Keller → ? | gelb | „Schlüssel?“ | **ja** | **bestätigen** mit Durchschlag Schlüsselregister (wird grün) |
| Pförtnerbuch ↔ Seitentür | blau | „Passt nicht – 21:33 / 21:29?“ | **ja** | **bestätigen** mit Zeitabgleich Pforte (wird grün) |

### 5.2 Was Spielerinnen frei tun können (Stufe 1)

Karten aus der Akte aufhängen und verschieben · eigene Notizzettel (Text, vier Farben) · Fäden in vier Farben (rot verdächtig, blau zeitlich, grün bestätigt, gelb offene Frage) · Karten und Fäden löschen · Fläche verschieben und zoomen. Auf dem Smartphone: Werkzeug wählen → Karte antippen → zweite Karte antippen.

**Freie Fäden lösen nie etwas aus.** Sie sind Arbeitsmaterial.

### 5.3 Was das Spiel prüft – nur über ausdrückliche Aktionen

1. **Widerlegen:** Einen von Hagedorns Fäden antippen → „Widerlegen mit …“ → ein Beweis aus der Akte. Richtig: Der Faden wird durchgestrichen, die Person bekommt den Stempel **ENTLASTET**. Falsch: Rückmeldung, warum dieser Beweis das nicht zeigt (z. B. „Die Kontrollliste beweist, dass Timo um 21:10 am Zug war – nicht, wo er um 21:44 war.“).
2. **Bestätigen:** Einen gelben oder blauen Faden antippen → „Bestätigen mit …“. Richtig: Der Faden wird grün.
3. **Beweisführung (Finale):** siehe Rätsel 14.

Weil jede Prüfung eine bewusste Handlung mit Rückmeldung ist, löst Herumprobieren mit Fäden nichts – und falsche Versuche lehren etwas über den Fall.

### 5.4 Gemeinsam spielen

Jede Karte, jede Notiz und jeder Faden ist ein eigener Eintrag (`board:<id>`, über `set_session_state`). Wer zuletzt verschiebt oder löscht, gewinnt – bei einem einzelnen Zettel ist das das erwartbare Verhalten. Widerlegungen, Bestätigungen und die Beweisführung sind gemeinsamer Spielstand (wie gelöste Rätsel). Stufe 2 (später): Mauszeiger der anderen, „X hat … angeheftet“, Rückgängig.

---

## 6. Die Bereiche

### Bereich 1 – Hagedorns Büro · Polizeipräsidium · ca. 10 Min.

**Was du erfährst:** Hagedorn hat am Unfall gezweifelt – und die Nachricht von seinem Telefon hat er nicht selbst geschrieben.

- **Nord · Die Wand:** Kork, Fotos, Fäden, Notizzettel. Noch nicht bearbeitbar, nur ansehen.
- **Ost · Schreibtisch:** Tablet, Stiftebecher (Bleistift), abgeschlossene Schublade mit Zahlenschloss, ein Post-it.
- **Süd · Aktenschrank und Tür:** Fallakte „Reuter – Unfall (geschlossen)“ mit Stempel von Dr. Wessel.
- **West · Fenster und Garderobe:** Hagedorns Mantel hängt noch da – er ist ohne ihn gegangen. Im Mantel: Theaterprogramm „Die Nacht der Masken“.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 1 | **Die Schublade** | Code | Post-it in Hagedorns Schrift: „Code wie immer: die Uhrzeit, um die es geht.“ Auf der Wand steht groß: „Mond fällt 21:44“. | **2144** → Theaterschlüssel |
| 2 | **Die Wand fotografieren** | Ereignis | Tablet nehmen, an der Wand benutzen → Pinnwand erscheint (kurze Einführung: aufhängen, Faden, Notiz) | Tablet an der Wand |

**Telefon beim Start:** die SMS „Brauche ein paar Tage Abstand. Der Fall war ein Unfall. – R.H.“ Hagedorns Notizen an der Wand sind alle mit „H.“ unterschrieben. (Kein Pflichträtsel – ein Moment, der die Dringlichkeit setzt.)
**Nachricht Dr. Wessel nach Rätsel 2:** „Hagedorn hat sich abgemeldet. Der Fall ist abgeschlossen. Gehen Sie nach Hause.“
**Geheimnis:** In der Schreibtischunterlage ein altes Foto: Hagedorn mit dir bei deinem ersten Fall, Rückseite „Wir lassen niemanden zurück. – H.“

**Hinweise:** *1:* (1) Hagedorn benutzt immer denselben Typ Code. (2) Auf der Wand steht die wichtigste Uhrzeit des Falls. (3) 2144. · *2:* (1) Die Wand bleibt hier – nimm sie mit, ohne sie abzunehmen. (2) Das Tablet hat eine Kamera. (3) Tablet aus dem Rucksack an der Wand benutzen.

### Bereich 2 – Foyer und Pforte · Stadttheater · ca. 12 Min.

**Was du erfährst:** Keller hat das Haus nicht verlassen, als er sagte – und er hatte den Schlüssel zur Technik.

- **Nord · Kasse und Garderobe:** Absperrband, Programmhefte.
- **Ost · Foyeruhr und Treppe:** große Uhr, Wartungszettel daneben.
- **Süd · Pforte:** Pförtnerbuch, Schlüsselregister mit Durchschreibeblock, Schlüsselkasten, Terminal „Seitentür“.
- **West · Haupteingang und Plakate:** Plakat der Premiere (verschoben), Gedenkbild Reuter.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 3 | **Der Durchschlag** | Gegenstand | Im Register ist der Eintrag 20:58 oben geschwärzt. Darunter liegt das Kohlepapier-Durchschreibeblatt – leer auf den ersten Blick. Mit dem Bleistift schraffieren. | Bleistift am Register → „20:58 – J. Keller – K-4“ |
| 4 | **Die falsche Uhrzeit** | Code + Logik | Pförtnerbuch nach Foyeruhr: Keller geht 21:33. Seitentür (Serverzeit): Karte 4417 um 21:29. Wartungszettel: Foyeruhr geht 6 Minuten vor. Am Terminal der Pforte „Abgleich“: *Wann verließ Keller das Haus wirklich?* | **2127** → Beweis „Zeitabgleich Pforte: zwei Minuten nach dem Abgang wieder im Haus“ |
| 5 | **Der Schlüsselkasten** | Beobachtung | Kasten offen. Haken B-1 (Bühne) hängt, Haken K-4 (Technik, Unterbühne, Gänge) ist leer. | B-1 nehmen |

Rückmeldungen Rätsel 4: **2139** „Die Uhr geht vor – nicht nach.“ · **2133** „Das ist die Zeit der Foyeruhr.“ · **2129** „Das ist die Zeit an der Seitentür.“
**Hinweise:** *3:* (1) Ein Name wurde geschwärzt – aber Register werden mit Durchschlag geführt. (2) Das Blatt darunter wirkt leer. Mit einem weichen Stift kann man eingedrückte Schrift sichtbar machen. (3) Bleistift aus Hagedorns Büro am Schlüsselregister benutzen. · *4:* (1) Zwei Uhren, zwei Zeiten – nur eine geht richtig. (2) Neben der Foyeruhr hängt ein Wartungszettel; das Seitentür-Terminal nutzt die Serverzeit. (3) 21:33 minus 6 Minuten: 2127. · *5:* (1) Im Schlüsselkasten hängt, was du brauchst – und es fehlt etwas Wichtiges. (2) Achte auf die Beschriftung der Haken. (3) Nimm B-1; der Haken K-4 ist leer, und im Register fehlt die Rückgabe.
**Rückmeldungen Rätsel 3:** falscher Gegenstand am Register: „Damit drückst du nur noch mehr ein. Du brauchst etwas, das abfärbt.“

**Nachricht nach Rätsel 3 (unbekannt, später: Pförtner Mahler):** „Den Durchschlag hat noch nie jemand angeschaut. Außer Ihrem Kollegen.“
**Geheimnis:** Hinter dem Gedenkbild ein Theaterzettel von 1987 – Reuter als junger Schauspieler, Rolle: „Der Kommissar“.

### Bereich 3 – Bühne und Lichtregie · ca. 22 Min.

**Was du erfährst:** Der Mond fiel nicht von selbst. Timo und Mira konnten es nicht gewesen sein.

- **Nord · Die Bühne:** der zerbrochene Mond hinter Absperrband, Markierung „Mitte“ auf dem Boden, Falltür zur Unterbühne.
- **Ost · Lichtregie:** Lichtpult, Monitor mit Lichtprotokoll, Rekorder der Sprechanlage.
- **Süd · Seitenbühne:** Steuerung der Obermaschinerie (Zugprotokoll), Kontrollliste am Brett, Aufgang zum Schnürboden (verschlossen, K-4).
- **West · Inspizientenpult:** Regiebuch, Probenmitschnitt, Monitor.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 6 | **Die letzte Probe** | Sortieren mit Prüfknopf | Vier lose Regiezettel ohne Uhrzeit: „Vorbereitungsruf Mondszene“, „LS 47 – Blackout“, „Zug 12 fährt“, „Arbeitslicht“. Licht- und Zugprotokoll nennen Zeiten nur mit Kürzeln (VR, LS47, Z12-H, AL). In Reihenfolge bringen. | VR 21:38 → LS47 21:44:00 → **Z12-H 21:44:12** → AL 21:45:03. Erkenntnis: „Z12-H“ = **Handablass** – im Blackout, von Hand. |
| 7 | **Der fehlende Stift** | Auswahl | Schema Zug 12: Bremse mit sechs Steckplätzen P-1 bis P-6. Kontrollliste 21:10: „Zug 12 – Bremsstift gesteckt ✓“. Welcher Stift sichert die Bremse von Zug 12? Am echten Zug: ein Loch ist leer. | **P-4** (Legende: Zug 12 → Bremse B3 → P-4). Beweis: „P-4 fehlt seit nach 21:10“ |
| 8 | **Wer war im Blackout wo?** | Pinnwand | Mitschnitt Sprechanlage anhören (Abschrift mit Zeit): 21:44:08 Timo vom Lichtpult. Probenmitschnitt: 21:44:05 Mira, Monolog, Rampe links. | An der Wand: Timo-Faden widerlegen (Sprechanlage), Mira-Faden widerlegen (Mitschnitt) |
| 9 | **Hagedorns letzte Notiz** | Beobachtung | Hagedorns Notiz an der Wand: „Wenn du den letzten Vorhang siehst …“. Im Regiebuch die Seite **„Schlussvorhang“** aufschlagen: Dort steckt sein Zettel: „… suche dort, wo kein Applaus ankommt. U-4.“ Bühnenplan: U-4 = Wartungsgang unter der Unterbühne. | Notiz finden → Ziel U-4 |

**Warum stand Reuter dort?** Regiebuch, Eintrag 21:15: „Mondszene – A.R. steht selbst auf Mitte, prüft Licht im Blackout.“ Keller kannte den Probenplan (er zeichnet ihn als Verwaltungsdirektor ab).
Rückmeldungen Rätsel 6: Z12-H vor LS47 → „Dann wäre der Mond im hellen Licht gefallen – alle hätten es gesehen.“ · AL vor Z12-H → „Nach dem Arbeitslicht war die Probe vorbei.“
**Unterbühne ist dunkel:** Taschenlampe nötig, Tür U-4 verschlossen („Technik – K-4“).
**Geheimnis:** Auf dem Lichtpult eingeritzt: „Timo + Mira, Spielzeit 21/22“ – die beiden decken sich nicht gegenseitig, sie sind nur Freunde (zeigt: Miras Alibi kommt nicht von Timo).

**Hinweise:** *6:* (1) Die Protokolle benutzen Kürzel. (2) LS47 ist eine Lichtstimmung, Z12 ist der Zug des Mondes, H steht für Hand. (3) VR – LS47 – Z12-H – AL. · *7:* (1) Die Kontrollliste nennt den Bremsstift ohne Nummer. (2) Im Schema führt eine Linie von Zug 12 über die Bremse zu einem Steckplatz. (3) P-4. · *8:* (1) Hagedorn fragte: Wer war im Blackout wo? (2) Die Sprechanlage und der Probenmitschnitt haben Zeitstempel – vergleiche mit 21:44:12. (3) Timo-Faden mit Sprechanlage widerlegen, Mira-Faden mit Probenmitschnitt. · *9:* (1) „Der letzte Vorhang“ ist ein Theaterbegriff. (2) Im Regiebuch hat jede Szene eine Seite – die letzte heißt „Schlussvorhang“. (3) Regiebuch, Seite Schlussvorhang.

### Bereich 4 – Kostümwerkstatt und Verwaltung · ca. 18 Min.

**Was du erfährst:** Ruth hat nichts damit zu tun. Und Reuter musste sterben, weil er Keller durchschaut hatte.

- **Nord · Nähtisch:** Nähmaschine, Nähprotokoll, Stoffmusterbuch.
- **Ost · Kostümlager:** Kleiderstangen, Kostüm „Mond“ (Ersatzteil mit roter Samtkante).
- **Süd · Kellers Büro:** aufgeräumt, zu aufgeräumt. Zahlungsbuch im Regal, Reisekostenabrechnung in der Ablage.
- **West · Reuters Büro:** Schreibtisch mit Kalender, Rechnungsordner T-17, kleiner Wandtresor (4 Ziffern).

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 10 | **Die Stoffspur** | Auswahl + Pinnwand | Kriminaltechnik-Bericht (in der Akte): „rote Samtfasern, Charge unbekannt“. Nähprotokoll 17:05: „Mond, Samtkante erneuert – Bordeaux, Charge 0917“. Im Musterbuch die passende Probe finden (fünf Rottöne). Dann an der Wand den Ruth-Faden widerlegen. | **Bordeaux 0917** · Ruth-Faden mit Nähprotokoll widerlegen |
| 11 | **Die doppelte Rechnung** | Auswahl in drei Stufen | Ordner T-17 (Reuters Büro): Rechnung „Hartwig Bühnenbau“ und Rechnung „BTW Theatertechnik“ – gleicher Auftrag, gleiche Leistung, beide bezahlt (Zahlungsbuch). In Kellers Büro: seine Reisekostenabrechnung mit Erstattungskonto. ① Welche ist die Scheinrechnung? ② Wer hat sie freigegeben? ③ Wohin floss das Geld? | ① **BTW** ② **Keller** (Freigabe-Kürzel J.K.) ③ **Kellers Konto**: Die IBAN von BTW im Zahlungsbuch endet auf **…4417 02** – dieselbe IBAN steht auf Kellers Reisekostenabrechnung. Beweis: „Rechnungsvergleich T-17: 186.400 € an Keller“ |
| 12 | **Reuters Tresor** | Code | Auf Reuters Schreibtisch, mit Datum 9.11.: „Zahlung T-17 stoppen. **Morgen** melden.“ Kalender: 10.11., 09:00 „Kulturamt – Prüfung T-17“. Tresor mit 4 Ziffern. | **1011** → Ersatzschlüssel K-4, dazu Reuters Mappe „T-17“ (Beweis Motiv) |

**Die Scheinrechnungen (Zahlungsbuch, Auftrag T-17 „Instandhaltung Obermaschinerie“):**

| Jahr | Rechnungen BTW | Summe | Freigabe |
|---|---|---|---|
| 2023 | 4 | 52.800 € | J.K. |
| 2024 | 5 | 61.200 € | J.K. |
| 2025 | 6 | 72.400 € | J.K. |
| **Gesamt** | **15** | **186.400 €** | |

Hartwig Bühnenbau hat die Arbeiten tatsächlich ausgeführt und korrekt abgerechnet; jede BTW-Rechnung kopiert eine Hartwig-Leistung desselben Monats. Verdächtig sind die fehlende Steuernummer und das Postfach – **beweisend** ist erst die IBAN, die zu Kellers Erstattungskonto gehört. Reuter fiel es auf, weil er im Oktober 2026 die Hartwig-Rechnung für die Motorreparatur an Zug 12 abzeichnete und im selben Monat eine zweite fand.

Rückmeldungen Rätsel 11: ① Hartwig → „Hartwig hat gearbeitet – im Probenplan stehen ihre Monteure.“ ③ falsches Konto → „Vergleiche die IBAN mit allen Unterlagen aus der Verwaltung.“

Rückmeldungen Rätsel 12: **0911** „Das ist der Tag der Notiz – er wollte es morgen melden.“ · **0900** „Die Uhrzeit des Termins – gesucht ist der Tag.“
**Nachricht Dr. Wessel nach Rätsel 11:** „Sind Sie etwa im Theater? Das Haus ist versiegelt.“ – Druck, aber keine Strafe.
**Geheimnis:** Im Kostümlager ein Kostüm mit Namensschild „A. Reuter – Abschiedsvorstellung“: Ruth hatte heimlich ein Kostüm für Reuters letzte Rolle genäht.

**Hinweise (ergänzt):** *11:* (1) Zwei Firmen, ein Auftrag – nur eine hat gearbeitet. (2) Das Freigabe-Kürzel steht unten rechts; die IBAN steht im Zahlungsbuch. Wo taucht dieselbe IBAN noch auf? (3) BTW – freigegeben von Keller – IBAN wie auf Kellers Reisekostenabrechnung.

**Hinweise:** *10:* (1) Wann kamen die Fasern an den Mond? (2) Das Nähprotokoll nennt Uhrzeit und Charge. (3) Bordeaux 0917; dann Ruth-Faden mit dem Nähprotokoll widerlegen. · *12:* (1) Reuter wollte etwas am nächsten Tag tun. (2) Sein Kalender zeigt den Termin. (3) 1011.

### Bereich 5 – Wartungsgang U-4 · Unter der Bühne · ca. 13 Min.

**Was du erfährst:** wo der Stift ist – und wo Hagedorn ist.

- **Nord · Tür U-4:** Stahltür, Schild „U-4 – nur Technik“. Mit K-4 auf.
- **Ost · Werkzeugschrank W-1:** öffnet mit Schlüssel K-4. Darin nur ein leeres Tuch mit Stempel „Verwaltung – Stadttheater Velden“ – die Form eines Stifts ist noch zu sehen. Daneben Arbeitshandschuhe.
- **Süd · Der Gang:** stockdunkel, Rohre, ein Wasserhahn, ein Bodengitter. In die Wand geritzt (nur mit Licht): ein Pfeil nach unten und „H.“.
- **West · Kammer:** Holztür mit Riegel und Vorhängeschloss (4 Ziffern). Klopfen von innen.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 13 | **Das Versteck** | Suche (Taschenlampe) | Schrank leer, nur das Tuch. Mit der Taschenlampe im Gang: Hagedorns Pfeil „H. ↓“ über dem Bodengitter. Gitter anheben. | **P-4** (Spitze verbogen) – Beweis „Mittel“ |
| 14 | **Die Kammer** | Code | Hagedorns Wandnotiz: „Benutzt K. überall dieselbe Nummer?“ Kellers Kartennummer steht im Protokoll der Seitentür. | **4417** → Hagedorn ist frei (erschöpft, aber ansprechbar) |
| 15 | **Die Beweisführung** | Pinnwand (Finale) | Hagedorn: „Den Stift hat er nicht gefunden? Gut. Hast du den Rest? Dann zeig es mir – so, dass Wessel es nicht wegwischen kann.“ An der Wand öffnet sich die Beweisführung: vier Felder, in jedes ein Beweis. Die drei Entlastungen müssen vorher erledigt sein. | siehe unten |

**Beweisführung (Rätsel 15):**

| Feld | Richtige Beweise (einer genügt) | Rückmeldung bei Fehler |
|---|---|---|
| **Zugang** – Wie kam er an die Technik? | Durchschlag Schlüsselregister | „Das zeigt nicht, dass er einen Schlüssel hatte.“ |
| **Gelegenheit** – War er zur Tatzeit im Haus? | Zeitabgleich Pforte | „Laut Pförtnerbuch war er weg – oder?“ |
| **Mittel** – Wie wurde der Mond zum Absturz gebracht? | Sicherungsstift P-4 · (auch: Zugprotokoll Handablass) | „Das zeigt einen Defekt, keinen Eingriff.“ |
| **Motiv** – Warum Reuter? | Reuters Notiz „Morgen melden“ · Rechnungsvergleich T-17 | „Ein Streit ist kein Grund für so einen Plan.“ |

Fehlversuch: „x von 4 Feldern sind schlüssig.“ (verrät nicht, welche) · Fehlt eine Entlastung: „Solange ein falscher Verdacht an der Wand hängt, zerreißt Wessel den Bericht.“

**Hinweise:** *13:* (1) Das Tuch ist leer – jemand war schneller als Keller. (2) Hagedorn hinterlässt Zeichen mit „H.“ – hier unten siehst du ohne Licht nichts. (3) Taschenlampe im Gang (Süden), Bodengitter unter dem Pfeil. · *14:* (1) Hagedorn hatte einen Verdacht über Kellers Zahlen. (2) Eine Nummer von Keller steht in einem Protokoll im Foyer. (3) 4417. · *15:* (1) Jedes Feld braucht einen Beweis, keine Vermutung. (2) Schlüssel, Uhrzeit, Stift, Geld. (3) Durchschlag · Zeitabgleich · Stift P-4 · Reuters Notiz.

**Geheimnis:** In Hagedorns Notizbuch (er hatte es bei sich): die erste Seite des Falls, durchgestrichen „Unfall?“, darüber „Nein.“ – mit Datum Montag, 23:40 Uhr. Er wusste es von Anfang an.

---

## 7. Finale

Filmische Sequenz mit dem Abspieler von Hotel Nocturne (Szenen, Untertitel, Geräusche, optional Stimme):

1. Die Wand, Fäden laufen grün zu Keller zusammen.
2. Hagedorn, auf einer Kiste sitzend, Wasserbecher: „Ich habe zwei Nächte gezählt, wie oft der Inspizient ‚Achtung Mondszene‘ gerufen hätte.“
3. Telefon: du schickst den Bericht an Dr. Wessel. Antwort nach kurzer Pause: „Ich schicke eine Streife. Und einen Krankenwagen.“
4. Außen, Theater bei Nacht, Blaulicht. Keller wird an der Seitentür festgenommen – mit Karte 4417 in der Hand, in der Tasche Schlüssel K-4 und der Generalschlüssel des Hauses.
5. „Der letzte Vorhang fällt.“ – Abschluss mit Statistik und persönlicher Nachricht.

**Ende ohne Beweisführung gibt es nicht** – Hagedorn freizulassen reicht nicht, der Fall muss gelöst werden.

---

## 8. Zählung, Zeit, Schwierigkeit

- **15 Rätsel**, davon an der Pinnwand: die drei Widerlegungen (in Rätsel 8 und 10) und die Beweisführung (15).
- **Bestätigen** (Kellers gelber und der blaue Faden) ist **freiwillig**: Der Faden wird grün und Hagedorn kommentiert per Notiz. Pflicht sind nur die Widerlegungen und die Beweisführung – so bleibt niemand an einer Formalie hängen.
- **5 Geheimnisse** (eins pro Bereich).
- **Zeit:** 75 Minuten für die Rätsel, mit Diskussion an der Wand realistisch 75–90.
- **Schwierigkeit:** mittel. Logik und Lesen statt Suchbild. Jedes Rätsel hat drei Hinweise (der dritte ist die Lösung), dazu „Worum geht es gerade?“ wie bei Hotel Nocturne.

## 9. Was die Engine dafür braucht

| Baustein | Stand |
|---|---|
| Räume mit vier Blickrichtungen, Hotspots, Rucksack, Telefon, Akte, Hinweise, Multiplayer | **vorhanden** (Hotel Nocturne) |
| Rätseltypen code, sort, choice, use, event | **vorhanden** |
| Dokumente mit mehreren Seiten (Regiebuch) | **vorhanden** |
| Filmische Sequenz für das Finale | **vorhanden** |
| **Pinnwand-Modul** (Karten, Notizen, Fäden, Zoom, Sync je Objekt) | neu – als Plattform-Baustein |
| **Rätseltyp „Widerlegen/Bestätigen“** an Hagedorns Fäden | neu |
| **Rätseltyp „Beweisführung“** (Felder mit Beweisen) | neu |
| Tondokumente mit Abschrift (Sprechanlage, Probenmitschnitt) | neu, klein (Dokument mit optionalem Ton) |

## 10. Reihenfolge

1. **Dieses Dokument prüfen und festschreiben.**
2. **Pinnwand-Prototyp** (Stufe 1) mit Hagedorns Startwand, allein und zu zweit, besonders die Fadenbedienung auf dem Smartphone.
3. Rätseltypen Widerlegen / Bestätigen / Beweisführung. ✓
4. Bereich 1 als spielbarer Einstieg, dann 2–5. ✓ (Version 1)
5. Katalogeintrag „Der letzte Fall“ auf „spielbar“ setzen. (zunächst „Vorschau“, bis echte Testrunden gelaufen sind)

## 11. Entscheidungen

| Frage | Entscheidung |
|---|---|
| Katalog | Titel **Der letzte Fall**, Untertitel **Der letzte Vorhang** |
| Katalogtext | „Ein Theaterdirektor ist tot. Ein Kommissar verschwunden. Seine letzte Ermittlung wartet auf dich.“ · Krimi · 75–90 Min. · 1–4 Personen |
| Spielerfigur | geschlechtsneutral, Name optional über `config.js` |
| Stück im Theater | **Die Nacht der Masken** |
| Jahr | 2026 (Mo 9.11. Tat · Fr 13.11. Spielbeginn) |
