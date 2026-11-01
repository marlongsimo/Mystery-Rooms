# DAS ARCHON-PROTOKOLL – Design-Dokument

**Version 1.0 · 01.11.2026 · Grundlage: GDD „Extreme Edition“ mit den vereinbarten Änderungen**

> **Achtung: enthält alle Lösungen.** Nur für die Entwicklung, nicht für Testspieler.

---

## 0. Eckdaten

| Merkmal | Festlegung |
|---|---|
| Titel | Das ARCHON-Protokoll |
| Untertitel | 120 Minuten. Eine Chance. |
| Kategorie | Digitales Escape Game (Plattform-Kategorie 03) |
| Schwierigkeit | 4 von 4 („Schwer“), als *Extreme Edition* gekennzeichnet |
| Spieler | allein (kein Multiplayer in Version 1) |
| Gerät | **nur am Computer** (Maus und Tastatur, ab 1280 px Breite). Am Handy erscheint ein Hinweis statt des Spiels. |
| Spielzeit | 120:00 Minuten, strikt |
| Ordner | `archon/` (eigener Speicherstand `archon_save_v1`) |
| Technik | baut auf dem gemeinsamen Desktop-Baustein `platform/desktop/` auf (aus DEADLINE.exe herausgelöst, siehe Kap. 11) |

### Was sich gegenüber dem GDD geändert hat (vereinbart)

| GDD | Jetzt | Grund |
|---|---|---|
| Countdown = Aris' Löschroutine | Countdown = **ARCHONs Rückverfolgung** deiner Sitzung | Unterscheidet sich klar von DEADLINE.exe: Du bist selbst im Visier. |
| Finale „Beweise senden oder Wurm“ | Zwei Wege bleiben, aber **das Ergebnis hängt davon ab, wie vollständig du ermittelt hast** (4 Enden + Scheitern) | Kein zweites „senden oder löschen“ wie bei DEADLINE. |
| Sperre für jeden falschen Terminalbefehl | **Tippfehler werden nie bestraft.** Sperren nur bei falschen Lösungen (Codes, Passwörter, Zuordnungen), steigend | Druck gegen Raten, nicht gegen Vertippen. |
| Base64, Hex, Spektrogramm ohne Werkzeug | **Werkzeuge im Spiel** (`decode`, Spektrogramm, Filter in der Datenbank) plus Erklärseiten im Intranet | Die Leistung liegt im Erkennen, nicht im Fachwissen. |
| Rätsel 14: „Wer die Regeln nicht findet, muss raten“ | Die Regeln liegen **sicher auffindbar** im wiederhergestellten Prüfbericht | Keine Sackgasse. |
| Masterpasswort ohne Format | **Format wird ausdrücklich verraten** (im reparierten Protokoll) | Niemand scheitert an Bindestrichen. |
| Pause „nur bei technischer Unterbrechung“ | Keine Pause. Die Zeit läuft nur, **solange das Spiel geöffnet ist** (auch im Hintergrund-Tab). Absturz oder geschlossener Tab kostet keine Zeit. | Technische Unterbrechungen lassen sich nicht erkennen. Neuladen setzt nichts zurück. |
| Manipulationsschutz per Server | Kein Server. Die Zeit wird mit der Systemuhr gemessen, Sprünge über 2 Minuten zählen nicht. | Wer mogelt, betrügt nur sich selbst. |
| Ermittlungsakte neu bauen | Pinnwand-Baustein `platform/board` wiederverwenden | Gibt es schon. |
| Audioaufnahmen produzieren | Töne und Spektrogramme werden erzeugt, Sprache erscheint als Transkript | Keine Sprecher nötig. Echte Stimmen könnten später ergänzt werden. |

---

## 1. Geschichte

### Ausgangslage

**Hendrik Valentin Aris** (54), Wirtschaftsprüfer, Partner der Kanzlei *Aris & Lund Prüfungsgesellschaft*, Hamburg. Im Auftrag des Aufsichtsrats der **Hafenbank Nordelbe** prüft er seit Sommer 2026 die Geschäftsbeziehungen der Bank zur **Corvane Holding AG** (Zug). Er stößt auf ein Netz aus acht Firmen, Treuhändern und einer Stiftung und auf einen Namen, der in internen Nachrichten immer wieder auftaucht: **ARCHON**.

**Sonntag, 1. November 2026, 21:30 Uhr:** Aris verlässt sein Büro und ist seitdem verschwunden.

**Dienstag, 3. November 2026, 22:47 Uhr (Spielbeginn):** Du bist forensische Analystin bzw. Analyst. Von einer unbekannten Adresse kommt ein Link, den Aris für den Fall seines Verschwindens vorbereitet hat: ein Fernzugang zu seinem Archivrechner `ARIS-ARCHIVE-07`.

```
REMOTE SESSION ESTABLISHED.
USER: UNKNOWN   HOST: ARIS-ARCHIVE-07   SECURITY LEVEL: 01
WARNING: SESSION MONITORED
TRACE IN PROGRESS · ESTIMATED TIME TO LOCATION: 120:00
```

Der Rechner wird überwacht. Mit deiner Anmeldung hat ARCHON begonnen, die Verbindung zurückzuverfolgen. In 120 Minuten wissen sie, wer du bist. Dann trennen sie die Sitzung und löschen das Archiv.

### Die Wahrheit (Auflösung)

- **Das Geldnetz:** Über vier Konten in vier Ländern werden Gelder der Hafenbank gewaschen. Dahinter steht eine Holding-Kette: Corvane → Sarnia Holdings → Vellum Trust → **Stiftung Kestrel** (Vaduz).
- **ARCHON** ist keine Organisation mit Logo, sondern eine Ordnung aus fünf Ebenen mit Decknamen. An ihrer Spitze („Nordstern“) steht die Stifterin der Stiftung Kestrel: **Margarete Holm**, Aufsichtsratsvorsitzende der Hafenbank Nordelbe.
- **Der Twist:** Die Frau, die Aris den Prüfauftrag gegeben hat, ist ARCHON. Sie wollte wissen, wie viel man finden kann, und beobachtete jeden Schritt.
- **Aris** hat das früh geahnt. Sein Login-Passwort enthält ausgerechnet den Namen der Stiftung („KESTREL“). Er ist untergetaucht, nicht tot. Seine letzte Nachricht erreicht dich in Kapitel 4.

### Figuren

| Figur | Rolle | Wo man sie kennenlernt |
|---|---|---|
| H. V. Aris | verschwundener Prüfer | überall: Mails, Audio, Notizbuch |
| Ida Lund | Partnerin der Kanzlei, Verbündete | Mails, Sprachnachricht (Nebenrätsel) |
| Mats Brenner | Wirtschaftsjournalist, Aris' Kontakt | Mail-Verlauf (Nebenrätsel) |
| Margarete Holm | Aufsichtsratsvorsitzende Hafenbank, Auftraggeberin, **ARCHON** | Prüfauftrag, Sitzungsprotokoll, Audio |
| Jonas Halden | Geschäftsführer Halden Consult (Treuhänder, Ebene „Anker“) | gefälschte Unterlagen (R6), Nachrichten |
| Dr. Felix Varga | Vorstand Corvane (Ebene „Kompass“) | Firmenprofile, Nachrichten |
| „Reede“ | Logistik-Ebene, Reederei-Kontakt Zypern | Nachrichten |

---

## 2. Spielstruktur

```
KAPITEL 1  Kalter Bootvorgang        R1 Login → R2 Spam-Header → R3 auth
                                         │
KAPITEL 2  Digitale Überreste        ┌───┼─────────────┐   (parallel, beliebige Reihenfolge)
                                     R4 Fragmente   R5 Spektrogramm   R6 Fälschung
                                     └───┼─────────────┘
                                         ▼  ARCHON_ORIGIN.enc + Notiz
KAPITEL 3  Das Geld hat eine Spur    ┌───┼─────────────┐   (parallel)
                                     R7+R8 Konten-Code  R9 Kontrollkette  R10 Rechnung
                                     └───┼─────────────┘
                                         ▼  WENDEPUNKT: INQUISITION_PROTOCOL
KAPITEL 4  Die digitale Inquisition  R11 Hierarchie ─┐
                                     R12 Identität ──┴─► R13 Aris' Nachricht
                                         ▼
KAPITEL 5  Das Erwachen              R14 Protokoll reparieren → R15 Masterpasswort → Entscheidung
```

- **Zeitplan (Dramaturgie, keine Sperre):** K1 15 Min · K2 25 Min · K3 35 Min · K4 25 Min · K5 20 Min.
- **Freiheit:** Bereits geöffnete Anwendungen bleiben immer offen. Innerhalb eines Kapitels sind die Rätsel parallel lösbar.
- **Kapitelwechsel:** Das nächste Kapitel öffnet sich, wenn alle Haupträtsel des Kapitels gelöst sind. Story-Ereignisse und Sicherheitslevel kommen dazu.

---

## 3. Die 15 Haupträtsel mit Lösung

Zu jedem Rätsel stehen hier: Ort, Material, Herleitung, **Eingabe**, Sperrregel und drei Hinweise. Für alle Rätsel gilt die Sperrregel aus Kap. 5: Der erste Fehlversuch ist frei, danach 30 / 60 / 90 / 120 Sekunden.

### KAPITEL 1 – Der kalte Bootvorgang

**Sichtbar:**
- Sperrbildschirm: Hintergrundbild, Uhr, Login-Feld (Benutzer `h.aris` vorausgefüllt)
- Kennworthinweis: **„Wo sie liegt.“**
- Knopf „Systeminformationen“
- Notfall-Terminal mit eingeschränkten Befehlen: `help`, `sysinfo`, `ls`, `meta <datei>`, `decode <text>`, `whoami`, `clear`

#### R1 · Das unsichtbare Passwort
- **Material:**
  - Hintergrundbild `harbour.jpg`: Hamburger Hafen bei Nacht, ein Frachter am Kai. Erst beim Hineinzoomen lesbar: der Rumpfname **KESTREL**.
  - Die Bilddetails bzw. `meta harbour.jpg` zeigen Kamera, Datum und Kommentar `TGllZ2VwbGF0eiA0Nw==`.
  - `decode TGllZ2VwbGF0eiA0Nw==` ergibt **„Liegeplatz 47“**.
  - Systeminformationen: „Kennwortrichtlinie: Buchstaben, gefolgt von Ziffern. Keine Leerzeichen.“
- **Herleitung:** „Wo sie liegt“ meint das Schiff und seinen Liegeplatz: Name plus Liegeplatz in der vorgeschriebenen Form.
- **Eingabe:** **`KESTREL47`** (Groß-/Kleinschreibung egal)
- **Sperre:** Login
- **Hinweise:**
  1. „Das Bild ist mehr als ein Hintergrund.“
  2. „Bilder haben Eigenschaften, die man nicht sieht. Das Terminal kann sie lesen – und manche Zeichenketten übersetzen.“
  3. „Zwei Teile: ein Name, der nur von Nahem lesbar ist, und eine Zahl aus den Bilddaten. Die Richtlinie sagt, in welcher Reihenfolge.“

#### R2 · Die manipulierte Spam-Mail
- **Material:** eingeschränktes Postfach mit 4 Mails. Eine Spam-Mail „Ihre Sendung konnte nicht zugestellt werden“. Unter „Kopfzeilen“ steht zwischen normalen Kopfzeilen `X-Archive-Key: c2FyZ2Fzc28=`.
- **Herleitung:** Eine Kopfzeile, die nicht in eine Spam-Mail gehört. Dekodiert ergibt sie **sargasso**.
- **Eingabe:** keine eigene. Das Wort wird in R3 gebraucht.
- **Hinweise:**
  1. „Nicht jede Spam-Mail ist Spam.“
  2. „Sieh dir an, was eine Mail über sich selbst verrät – unter der Oberfläche.“
  3. „Eine Kopfzeile beginnt mit X- und gehört zu keinem Mailprogramm. Das Terminal kann sie lesbar machen.“

#### R3 · Der erste Terminalzugang
- **Material:** `help` im Terminal nennt nach dem Login den neuen Befehl `auth <schlüssel>`.
- **Eingabe:** **`auth sargasso`**
- **Sperre:** Terminal-Befehl `auth` (das übrige Terminal bleibt frei)
- **Ergebnis:**
  - Bildschirmmeldung: „ACCESS GRANTED · USER: H.V.ARIS · SECURITY LEVEL 02 · ARCHIVE STATUS: PARTIALLY RECOVERED“
  - Freigeschaltet: Explorer, voller Mail-Client, Audio, Bilder, Papierkorb, Notizbuch, Intranet-Browser
- **Hinweise:**
  1. „Das Terminal kann jetzt mehr. Frag es.“
  2. „`help` zeigt einen neuen Befehl.“
  3. „Der Schlüssel stammt aus R2.“

### KAPITEL 2 – Die digitalen Überreste

18 Dateien in drei Strängen (Persönlich · Geschäftlich · Verschlüsselt). Die drei Rätsel sind in beliebiger Reihenfolge lösbar.

#### R4 · Die gelöschte Akte
- **Material:**
  - Papierkorb: `frag_A.bin`, `frag_B.bin`, `frag_C.bin`. Jedes Fragment zeigt in der Vorschau einen Textschnipsel und eine Fragment-ID: A = `2C9`, B = `7F3`, C = `A11`.
  - Mail-Ordner „Sicherung“: drei Mails von Aris an sich selbst, jede mit einem Anhang `teil_<ID>.bin`.
    - **Falle:** Zwei dieser Mails sind Weiterleitungen („Fwd:“) mit späterem Datum. Die ursprüngliche Sendezeit steht nur im zitierten Text („Am 29.10.2026 um 09:14 schrieb H. Aris:“).
  - Ursprüngliche Zeiten: `2C9` 09:14 · `A11` 11:02 · `7F3` 16:40 (alle am 29.10.)
- **Eingabe:** **`restore frag_A frag_C frag_B`**. Akzeptiert werden auch die IDs (`restore 2C9 A11 7F3`).
- **Sperre:** Befehl `restore`
- **Ergebnis:** `pruefbericht_entwurf.txt`. Der Bericht:
  - nennt die acht Firmen mit Kürzeln und den Auftraggeber („Aufsichtsrat, Vorsitz M. Holm“),
  - erklärt: „Gelder laufen immer über vier Stationen zwischen Ursprung und Ausschüttung; maßgeblich ist der erste vollständige Durchlauf“ (für R8),
  - enthält im **Anhang „Prüfregeln für Sicherungsprotokolle“** die Regeln für R14.
- **Hinweise:**
  1. „Drei Teile einer Datei. Die Reihenfolge stand irgendwo, als sie noch ganz war.“
  2. „Aris hat die Teile an sich selbst gemailt. Achte auf die Uhrzeit, zu der er sie *ursprünglich* verschickt hat.“
  3. „Weiterleitungen tragen ein neues Datum. Die echte Zeit steht im zitierten Text.“

#### R5 · Der letzte Anruf
- **Material:** `anruf_3010.wav` (Freitag, 30.10., 19:52, 2:40 Min.):
  - Transkript: Aris spricht mit Ida, dann sagt er: „Wenn mir was passiert – hör genau hin, nicht nur auf mich.“
  - Ab 1:10 gibt es 20 Sekunden Rauschen mit einem gleichmäßigen Pfeifton.
  - Im **Spektrogramm** (Ansicht im Mediaplayer) erscheinen im Bereich 4–6 kHz Buchstaben: **VELLUM**.
- **Eingabe:** keine eigene. VELLUM wird gebraucht für R9 (Name des Trusts) und für das Masterpasswort.
- **Bestätigung:** Ein Klick auf „Markieren“ im Spektrogramm legt das Wort als Fundstück in der Akte ab. Damit gilt das Rätsel als gelöst.
- **Hinweise:**
  1. „Aris hat nicht nur gesprochen.“
  2. „Untersuche die Frequenzbereiche der Aufnahme.“
  3. „Im mittleren Abschnitt, hoch oben im Spektrum, ist etwas geschrieben.“

#### R6 · Die falsche Identität
- **Material:** drei Dokumente über Jonas Halden:
  1. Handelsregisterauszug, Dok-Nr. **HR-2209**
  2. Passkopie (Bild), Dok-Nr. PA-5517
  3. Profil im Intranet der Hafenbank, Dok-Nr. IN-0384
  - Alle drei nennen dasselbe Geburtsdatum (12.03.1979) und dieselbe Adresse.
  - Der Registerauszug trägt als Eintragsdatum **31.09.2025**. Diesen Tag gibt es nicht.
  - Falle: Das Profil hat ein unscharfes Foto und einen Tippfehler im Firmennamen. Das sieht verdächtig aus, ist aber harmlos.
- **Eingabe:** Der Ordner `VERIFIZIERT/` fragt: „Dokumentnummer der Fälschung“. Antwort: **`HR-2209`**
- **Sperre:** Ordner
- **Ergebnis:** In `VERIFIZIERT/` liegen `ARCHON_ORIGIN.enc` (versiegelt bis zum Finale) und die Notiz: *„Sie suchen nicht nach dem Geld. Sie suchen nach demjenigen, der es bewegt.“*
- **Hinweise:**
  1. „Drei Dokumente, eine Person. Eines lügt.“
  2. „Vergleiche nicht nur die Person, sondern auch die Angaben *über* die Dokumente selbst.“
  3. „Ein Datum kann nicht stimmen, egal welches Jahr.“

**Kapitelabschluss (R4, R5 und R6 gelöst):**
- Sicherheitslevel 03
- Story-Ereignis: Im Systemprotokoll taucht der Benutzer `ns_observer` auf.
- Freigeschaltet: die Datenbank-Anwendung **LEDGER**, der Bereich „Register“ im Intranet und der Ordner `PRUEFUNG/` (Rechnungen, Handelsdokumente, Prüfberichte)

### KAPITEL 3 – Das Geld hat eine Spur (Kernkapitel)

#### Datengrundlage

**Acht Firmen** (Profil im Register, IBAN mit Prüfziffer):

| Kürzel | Firma | Sitz | IBAN-Prüfziffer | Rolle |
|---|---|---|---|---|
| NORD-01 | Nordkap Handels GmbH | Hamburg | DE**42** | Ursprung (Gelder der Hafenbank) |
| LUX-02 | Luxor Capital S.à r.l. | Luxemburg | LU**05** | 4. Station |
| VELL-03 | Vellum Trust | Gibraltar | – (kein Konto in der DB) | Treuhand |
| MERC-04 | Meridian Logistics Ltd | Valletta | MT**17** | 2. Station |
| HALD-05 | Halden Consult GmbH | Hamburg | DE**63** | Treuhänder, monatliche Honorare (Falle) |
| SARN-06 | Sarnia Holdings Ltd | Guernsey | GG**31** | Zwischenholding |
| ARGO-07 | Argos Shipping Ltd | Limassol | CY**88** | 3. Station |
| CORV-08 | Corvane Holding AG | Zug | CH**29** | Ausschüttung (Endpunkt) |

**LEDGER:** 84 Buchungen `TX-1001` bis `TX-1084` aus dem Zeitraum 01.09. bis 30.10.2026. Spalten: ID, Datum, Uhrzeit, Betrag, Währung, Absender, Empfänger, Rechnungsreferenz, Verwendungszweck. Werkzeuge: Filter nach Spalte, Sortierung, Markieren, Summe der markierten Buchungen.

| Gruppe | Anzahl | Merkmal |
|---|---|---|
| Strukturierte Zahlungen NORD-01 → MERC-04 | 9 | 47.900–48.900 EUR, knapp unter der 50.000-Meldegrenze, alle 2–4 Tage, keine Rechnungsreferenz |
| Weiterleitungen MERC-04 → ARGO-07 → LUX-02 | 18 | jeweils 1–3 Tage später, Betrag minus 1,5 % „Gebühr“, Verwendungszweck „Fracht“, aber keine Frachtpapiere |
| Ausschüttung LUX-02 → CORV-08 | 3 | Sammelbeträge, „Dividende“ |
| **Erster vollständiger Durchlauf** | 4 | **TX-1017** NORD-01→MERC-04 06.10. · **TX-1019** MERC-04→ARGO-07 07.10. · **TX-1022** ARGO-07→LUX-02 09.10. · TX-1031 LUX-02→CORV-08 14.10. |
| Falle: echter Handel LUX-02 → ARGO-07 | 4 | 12.400 EUR usw., mit passender Rechnung (eine davon ist R10) |
| Falle: Honorare HALD-05 | 6 | monatlich 8.500 EUR, ordentlich mit Rechnung |
| Falle: große, aber legale Buchungen | 5 | 250.000+ von CORV-08 an Dritte, sauber belegt |
| Feiertagsbuchung | 1 | **TX-1015 am 03.10.** (Tag der Deutschen Einheit) NORD-01 → MERC-04: Indiz für automatisierte Überweisung (Nebenrätsel N5) |
| Rauschen | 38 | Alltagsbuchungen (Miete, Gehälter, Leasing) |

#### R7 + R8 · Transaktionsanalyse und die vier Konten
- **Herleitung:**
  1. Strukturierte Zahlungen erkennen: Häufigkeit, Beträge knapp unter 50.000, keine Rechnung. Große Beträge allein führen in die Falle.
  2. Der Kette folgen: Wohin geht das Geld 1–3 Tage später?
  3. Prüfbericht (aus R4): Es sind „vier Stationen zwischen Ursprung und Ausschüttung“. CORV-08 ist die Ausschüttung und zählt nicht mit. Die Reihenfolge ergibt sich aus dem ersten vollständigen Durchlauf (06.–09.10.).
  4. Code = die IBAN-Prüfziffern der vier Stationen in der Reihenfolge der Kette.
- **Eingabe:** LEDGER, Funktion „Rückverfolgung bestätigen“ (Code-Feld): **`42178805`** (NORD 42 · MERC 17 · ARGO 88 · LUX 05)
- **Sperre:** LEDGER-Analysemodul. Abweichend: der erste Fehlversuch ist frei, danach **90 Sekunden** fest (GDD).
- **Rückmeldung bei typischen Fehlern** (ohne Lösung):
  - Code mit CH29 → „Ausschüttung ist keine Station.“
  - richtige vier, falsche Reihenfolge → „Stationen erkannt, Reihenfolge nicht.“
  - HALD-05 enthalten → „Honorare mit Rechnung sind kein Durchlauf.“
- **Hinweise:**
  1. „Es geht nicht um die größten Beträge, sondern um die regelmäßigsten.“
  2. „Folge einer Zahlung: Wohin geht dasselbe Geld ein, zwei Tage später?“
  3. „Der Prüfbericht sagt, was zählt und in welcher Reihenfolge. Die Ziffern stehen in den Firmenprofilen.“

#### R9 · Die Kontrollkette
- **Material (Intranet → Register, Netzwerkansicht in LEDGER):**
  - Corvane AG: Aktionärin 100 % Sarnia Holdings Ltd.
  - Sarnia Holdings: Anteile gehalten von Vellum Trust (Nominee), Direktor: Halden Consult.
  - Vellum Trust: Treuhandvertrag `vellum_deed.txt` im Ordner PRUEFUNG. Darin: „Begünstigt ist die in **Anlage B** genannte Stiftung.“
  - `anlage_b.txt` hat den Namen geschwärzt, aber die Registernummer **FL-0002.413.587-4** sichtbar.
  - Die Registersuche nach Nummer (Intranet → Register → „Ausländische Register“) ergibt: **Stiftung Kestrel, Vaduz**. Stifterin geschwärzt, Protektor: Halden Consult.
- **Eingabe:** Registersuche **`FL-0002.413.587-4`**. Akzeptiert wird jede Schreibweise mit denselben Ziffern. Die Suche nach Namen ist gesperrt („Abfrage nur über Registernummer“).
- **Sperre:** Registersuche
- **Netzwerkansicht:** Die acht Firmen sind als Knoten verschiebbar. Verbindungen zieht man selbst, als Werkzeug ohne Prüfung (Pinnwand-Baustein).
- **Ergebnis:** Ein neuer Knoten „Stiftung Kestrel“ erscheint ganz oben. Zusammen mit dem Login-Passwort ergibt das ein Aha-Erlebnis.
- **Hinweise:**
  1. „Wem gehört Corvane – und wem gehört der, dem Corvane gehört?“
  2. „Der Trust verweist auf eine Anlage. Ein Name fehlt dort, eine Nummer nicht.“
  3. „Ausländische Register lassen sich im Intranet nur über die Registernummer abfragen.“

#### R10 · Die falsche Rechnung
- **Material:** sechs Rechnungen im Ordner PRUEFUNG/Rechnungen. Nur eine passt zu LEDGER, Register und Prüfbericht.

| Rechnung | Fehler |
|---|---|
| RE-MER-0412 | Betrag 48.500, Buchung TX-1017 aber 48.700 |
| RE-ARG-0233 | Rechnungsdatum liegt nach der Buchung |
| RE-NOR-1180 | Anschrift: laut Register hat Nordkap dort nie gesessen |
| RE-LUX-0077 | USt-ID im falschen Format (LU + 9 statt 8 Ziffern) |
| RE-SAR-0019 | Aussteller Sarnia laut Register am Rechnungsdatum bereits umfirmiert |
| **AR-2026-118** | Argos an Luxor, 12.400 EUR, Datum, Betrag, Anschrift, USt-ID und Buchung TX-1046 passen |

- **Eingabe:** Passwort der Datei `abgleich_final.enc`: **`AR-2026-118`** (Trennzeichen egal)
- **Sperre:** Datei
- **Ergebnis:** Aris' Abgleichsnotiz bestätigt das Netz, und der Wendepunkt beginnt.
- **Hinweise:**
  1. „Fünf Rechnungen haben je genau einen Fehler.“
  2. „Prüfe jede Rechnung gegen drei Quellen: Buchung, Register, Prüfbericht.“
  3. „Achte auf Beträge, Daten, Anschriften, Steuernummern und darauf, ob es den Aussteller an diesem Tag noch gab.“

**WENDEPUNKT (R8, R9 und R10 gelöst):**
- Bildschirmmeldung: „UNAUTHORIZED CORRELATION DETECTED · SECURITY LEVEL 04 · EXTERNAL CONNECTION DETECTED · REMOTE SESSION COMPROMISED“
- Im Explorer erscheint der Ordner `INQUISITION_PROTOCOL/`.
- Gestaltung: Die Farben kippen ins Kalte, der Benutzer `ns_observer` ist „aktiv“.

### KAPITEL 4 – Die digitale Inquisition

**Störungen** (nur Darstellung, nie Datenverlust):
- Ein fremdes Fenster „ARCHON · SITZUNGSÜBERWACHUNG“ öffnet sich und lässt sich schließen.
- Systemmeldungen sind verfremdet.
- Zwei *optionale* Dateien sind für 5 Minuten „gesperrt durch ns_observer“.
- Im Log erscheinen Zugriffsversuche, und der Mauszeiger flackert kurz.

#### R11 · Das Organisationsdiagramm
- **Material:** In `INQUISITION_PROTOCOL/` liegen sechs interne Nachrichten. Jede ist mit einem Decknamen signiert und beschreibt, wem sie berichtet bzw. was sie tut. Dazu vier Profile (Halden, Varga, Reederei Zypern, Hafenbank-Aufsichtsrat).

| Deckname | Hinweis in den Nachrichten | Ebene |
|---|---|---|
| **Obolus** | „Die Überweisungen der Woche sind raus“ | 1 Finanzielle Infrastruktur |
| **Reede** | „Ladung über Limassol umgeschlagen“ | 2 Logistische Infrastruktur |
| **Kompass** | „Der Prüfer fragt nach Anlage B. Ich behalte ihn im Blick.“ | 3 Informationsbeschaffung |
| **Anker** | „Treuhänder bestätigt. Ich gebe die Anweisungen weiter.“ | 4 Exekutive Kontrolle |
| **Nordstern** | „Niemand berichtet über mich. Alle berichten an mich.“ | 5 ARCHON-Kern |

- **Herleitung:** Wer berichtet an wen? Daraus ergibt sich die Reihenfolge von unten nach oben. Die Anfangsbuchstaben von Ebene 1 bis 5 ergeben **ORKAN**.
- **Eingabe:** Freigabe von `hierarchie.lock`: **`ORKAN`**
- **Sperre:** Datei
- **Hinweise:**
  1. „Fünf Decknamen, fünf Ebenen. Wer gibt Anweisungen, wer führt aus?“
  2. „Ordne von der untersten Ebene (Geld) bis zur obersten (niemand über ihr).“
  3. „Lies die Anfangsbuchstaben in dieser Reihenfolge.“

#### R12 · Die Identität von ARCHON
- **Material:**
  - Drei Audiofragmente von ARCHON-Telefonaten (Transkript mit Zeitstempel und Hintergrundgeräuschen):
    - F1, 28.10., 19:41: „Ich habe zehn Minuten. Drinnen reden sie noch über die Quartalszahlen.“
    - F2: Schiffshorn und Möwen.
    - F3: Glocke, „St. Katharinen schlägt gleich acht.“
  - Sitzungsprotokoll des Aufsichtsrats der Hafenbank vom 28.10., 18:00–21:00, TOP 3 Quartalszahlen. Vermerk: *„19:35–19:48 Sitzung unterbrochen, die Vorsitzende verlässt kurz den Raum.“* Vorsitzende laut Teilnehmerliste: **Margarete Holm**.
  - Nachricht `nordstern.enc`: Ihr Passwort ist der Nachname von Nordstern.
- **Herleitung:** Nordstern telefonierte am 28.10. um 19:41 während einer Sitzung über Quartalszahlen. Nur eine Person hat die Sitzung genau in diesem Zeitraum verlassen. Die Fragmente F2 und F3 sind Bestätigung bzw. Falle: Kirche und Hafen passen zur Bank am Hafen.
- **Eingabe:** Passwort für `nordstern.enc`: **`HOLM`**
- **Sperre:** Datei, steigend (wichtig gegen das Durchprobieren aller Namen)
- **Ergebnis:** Nordsterns Nachricht an Anker: *„Lasst den Prüfer weitermachen. Ich will wissen, wie weit man kommt.“* So erfährt man, dass die Auftraggeberin die Täterin ist.
- **Hinweise:**
  1. „Nordstern hat eine Lücke im Terminkalender verraten.“
  2. „Wann und wo telefonierte Nordstern? Welches Dokument verzeichnet Anwesenheiten auf die Minute?“
  3. „Das Protokoll vom 28.10. vermerkt eine Unterbrechung. Wer ging hinaus?“

#### R13 · Die letzte Nachricht
- **Auslöser:** R11 und R12 gelöst
- **Was passiert:** Eine Nachricht von Aris erscheint im Messenger, vorbereitet und zeitgesteuert:
  > „Wenn du das lesen kannst, bist du bereits Teil der Untersuchung. Du hast zwei Möglichkeiten. Aber du musst verstehen, was du zerstörst, bevor du dich entscheidest. Das Masterprotokoll ist beschädigt – ich musste es so lassen. Du kennst die Regeln.“
- Damit öffnet sich das Finale: Sicherheitslevel 05, Alarmzustand.

### KAPITEL 5 – Das Erwachen

#### R14 · Das beschädigte Masterprotokoll
- **Material:** `master.proto` mit 8 Blöcken zu je 4 Hex-Zeichen.

  **Regel** (aus dem Anhang von R4): Die vierte Stelle ist die Summe der ersten drei Stellen mod 16.

  | Block | angezeigt | Prüfung | richtig | Status |
  |---|---|---|---|---|
  | 1 | `3A2F` | 3+10+2 = 15 → F | `3A2F` | ok |
  | 2 | `51C2` | 5+1+12 = 18 → 2 | `51C2` | ok |
  | 3 | `9042` | 9+0+4 = 13 → D | **`904D`** | **defekt** |
  | 4 | `B230` | 11+2+3 = 16 → 0 | `B230` | ok |
  | 5 | `778B` | 7+7+8 = 22 → 6 | **`7786`** | **defekt** |
  | 6 | `0E53` | 0+14+5 = 19 → 3 | `0E53` | ok |
  | 7 | `C1DF` | 12+1+13 = 26 → A | **`C1DA`** | **defekt** |
  | 8 | `442A` | 4+4+2 = 10 → A | `442A` | ok |

  Genau drei Blöcke sind defekt (3, 5, 7). Eine falsche Reparatur an einem korrekten Block zählt als Fehlversuch.

- **Eingabe:** `repair <block> <wert>` im Terminal: **`repair 3 904D`**, **`repair 5 7786`**, **`repair 7 C1DA`** (Reihenfolge egal)
- **Sperre:** falsche Reparatur sperrt `repair` steigend. Das Finale-Protokoll wird nach dem zweiten Fehler ab dann 120 Sekunden gesperrt (GDD).
- **Ergebnis:** Das Protokoll ist lesbar und nennt das Format des Masterpassworts:
  `MASTER = <ZUGANG>-<TON>-<STATIONEN>-<ORDNUNG>`
- **Hinweise:**
  1. „Die Regeln standen in Aris' Prüfbericht.“
  2. „Hex-Ziffern: A=10 … F=15. Jede Zeile prüft sich selbst.“
  3. „Rechne für jeden Block die Summe der ersten drei Stellen mod 16 und vergleiche mit der vierten.“

#### R15 · Die letzte Verschlüsselung
- **Eingabe:** `decrypt ARCHON_ORIGIN --key KESTREL47-VELLUM-42178805-ORKAN`
  - ZUGANG = Login (R1) · TON = Spektrogramm (R5) · STATIONEN = Kontencode (R8) · ORDNUNG = Hierarchie (R11)
- **Sperre:** `decrypt` steigend
- **Rückmeldung bei Fehlern:** Wie viele der vier Teile stimmen („2 von 4 Teilen gültig“), aber nicht welche. Erst ab dem dritten Fehlversuch.
- **Hinweise:**
  1. „Das Format steht im reparierten Protokoll.“
  2. „Jeder Teil ist ein Schlüssel, den du schon benutzt oder gefunden hast.“
  3. „Zugang = dein allererstes Passwort. Ton = was du im Spektrum gesehen hast.“

#### Die Entscheidung

`ARCHON_ORIGIN` öffnet sich. Darin liegen Stiftungsurkunde, Zahlungsplan und Nordsterns Anweisungen, also die vollständigen Beweise. Zwei Wege:

| | **A · DIE WAHRHEIT** | **B · DIE AUSLÖSCHUNG** |
|---|---|---|
| Handlung | Beweise an die Staatsanwaltschaft Hamburg (Wirtschaftsstrafsachen) übertragen | Aris' Simulationsprogramm `ARCHON-WORM` starten |
| Folge | Holm wird angeklagt. Die Rückverfolgung erreicht dich: Deine Identität ist bekannt. | Die Infrastruktur von ARCHON bricht zusammen, die Beweise sind weg. Niemand wird je angeklagt. Du bleibst unerkannt. |

**Ergebnis je nach Vollständigkeit** („Beweistiefe“ = Anzahl gelöster Nebenrätsel, siehe Kap. 4):

| Ende | Bedingung | Auflösung (Kurzfassung) |
|---|---|---|
| **A1 · Die Wahrheit** | A und Beweistiefe ≥ 6 | Anklage hält, Aris kehrt zurück, du wirst als Zeugin bzw. Zeuge geschützt |
| **A2 · Die halbe Wahrheit** | A und Beweistiefe < 6 | Holm tritt zurück, die Anklage bricht zusammen. Aris bleibt verschwunden. |
| **B1 · Die Auslöschung** | B und Beweistiefe ≥ 6 | ARCHON zerfällt vollständig. Aris schickt eine letzte Postkarte ohne Absender. |
| **B2 · Der Schatten** | B und Beweistiefe < 6 | ARCHON verliert ein Netz und baut ein neues. Nordstern bleibt im Amt. |
| **SYSTEM FAILURE** | Zeit abgelaufen | „ARCHIVE PURGED · ALL EVIDENCE DESTROYED · SESSION TERMINATED“ |

Danach folgen in allen Fällen die Auswertung (Kap. 7), eine Kapitelübersicht, „Lösungen anzeigen“ (nach Abfrage) und die Bewertung (`platform/rating`).

---

## 4. Die 12 Nebenrätsel (Beweistiefe)

Nebenrätsel sind nie Pflicht. Jedes bringt einen Punkt Beweistiefe, manche öffnen dazu einen zweiten Weg zu einer Information. Das schützt vor Sackgassen durch Sperren.

| Nr. | Kapitel | Rätsel | Lösung / Auslöser | Nutzen |
|---|---|---|---|---|
| N1 | 1 | `whoami` vor dem Login | zeigt `guest@unknown`. Nach dem Login zeigt ein zweites `whoami` die versteckte Gruppe `wg-nordelbe` | Beweis: Zugang über Bank-Infrastruktur |
| N2 | 2 | Notizbuch, Seite 3: Zahlenreihe 8-5-12-13 | Buchstaben-Positionen = **HELM** → Ordner `HELM/` | Fotos vom Hafen, Schiff KESTREL im Besitz von ARGO-07 |
| N3 | 2 | Kalender von Aris: drei Termine „H.“ | alle am Tag nach Aufsichtsratssitzungen | Indiz zu Holm (zweiter Weg zu R12) |
| N4 | 2 | Sprachnachricht von Ida, rückwärts abgespielt (Player-Funktion) | „Er ist sicher. Frag nicht, wo.“ | Aris lebt |
| N5 | 3 | Feiertagsbuchung TX-1015 (03.10.) | in LEDGER als „automatisiert“ markieren | automatisierter Zahlungsplan |
| N6 | 3 | Schiffsposition KESTREL im Hafen-Intranet (AIS-Liste) | Liegeplatz 47 an den Tagen der Weiterleitungen | Ware als Tarnung |
| N7 | 3 | `log --user ns_observer` | Login-Zeiten = Sitzungspausen der Bank | Überwachung durch die Bank (zweiter Weg zu R12) |
| N8 | 3 | Mail-Verlauf mit Mats Brenner, Anhang verschlüsselt | Passwort `NORDELBE` (Hinweis: „Wofür du arbeitest“) | Presse-Kontakt, für Ende A wichtig |
| N9 | 4 | Fremdes Fenster „ARCHON“: Quelltext ansehen (`inspect window`) | enthält `trace_origin=hafenbank-nordelbe.local` | ARCHON überwacht von der Bank aus |
| N10 | 4 | `history` im Terminal | Aris' letzte Befehle, u. a. `schedule msg 03.11 22:47` | Aris hat dir den Link geschickt |
| N11 | 4 | Gelöschte SMS im Papierkorb (erscheint in Kapitel 4) | Holms Fahrer: „Wagen steht 19:35 am Seiteneingang“ | dritter Weg zu R12 |
| N12 | 5 | versteckte Datei im Finale: `ls -a` zeigt `.postkarte` | „Ich lebe. Danke, dass du geblieben bist. – H.“ | Abschluss-Geheimnis |

**Schwelle:** Für A1/B1 braucht es mindestens 6 von 12. Das wird nach den Testspielen nachjustiert.

---

## 5. Fehlersystem: Sperren und Sicherheitslevel

### Sperren

- **Wofür:** nur bei falschen *Lösungen* (Passwort, Code, Zuordnung, Reparatur, Entschlüsselung).
- **Nie gesperrt:** unbekannte Befehle, Tippfehler in Befehlsnamen, falsche Syntax. Das Terminal antwortet dann mit `Unbekannter Befehl – help`.
- **Dauer:** Der erste Fehlversuch je Ziel ist frei, danach 30 → 60 → 90 → 120 Sekunden (höchstens 120). Ausnahmen: LEDGER 90 Sekunden fest, Finale-Protokoll 120 Sekunden ab dem 2. Fehler.
- **Anzeige:** Die Sperrzeit läuft mit der Spielzeit weiter. Gesperrte Fenster zeigen „GESPERRT · 0:47 · Sicherheitsprotokoll“.
- **Fairness:** Eine Sperre betrifft immer nur das Eingabefeld bzw. den Befehl, nie das Lesen von Dateien. Was man zum Lösen braucht, bleibt sichtbar.

### Sicherheitslevel

| Level | Auslöser | Wirkung |
|---|---|---|
| 01 | Start | ruhig, nur Lüfter |
| 02 | R3 | Protokollüberwachung im Systemlog sichtbar |
| 03 | Kapitel 2 abgeschlossen **oder** 6 Fehlversuche | `ns_observer` im Log, gelegentliche Warnmeldungen |
| 04 | Wendepunkt **oder** 12 Fehlversuche | Störungen (siehe Kapitel 4), kältere Farben |
| 05 | R13 **oder** 18 Fehlversuche | Alarmzustand, rote Fensterrahmen, Herzschlag in den letzten 5 Minuten |

Fehlversuche heben das Level höchstens um eine Stufe über das Story-Level. Das Level beeinflusst die **Zeit nicht** und die **Wertung** (Kap. 7) nur leicht.

---

## 6. Hilfesystem

- **Umfang:** drei Hinweise je Haupträtsel, **ohne Lösung**. Nebenrätsel haben keine Hinweise.
- **Anfordern:** nur bewusst. Es gibt keine automatischen Einblendungen.
- **Auswahl:** Sind mehrere Rätsel offen, wählt man aus, wofür man Hilfe will (wie bei DEADLINE 2.0).
- **Kosten:** Jeder Hinweis kostet Wertungspunkte, aber keine Zeit.
- **Nach dem Spiel**, bei Erfolg oder Scheitern: „Lösungen anzeigen“ nach einer Abfrage.

---

## 7. Auswertung: ARCHON Performance Index

Die Gewichtung ist vorläufig und wird nach den Testspielen festgelegt.

| Kriterium | Gewicht | Berechnung (Entwurf) |
|---|---|---|
| Ermittlungsleistung | 35 % | gelöste Haupträtsel (15) + Beweistiefe (12) |
| Rätselgenauigkeit | 25 % | 100 % minus 4 % je Fehlversuch (min. 0) |
| Zeitmanagement | 20 % | Restzeit / 30 Minuten (max. 100 %) |
| Hilfenutzung | 10 % | 100 % minus 10 % je Hinweis |
| Sicherheitsverhalten | 10 % | Level 3 → 100 %, je Level darüber durch Fehler −25 % |

| Index | Titel |
|---|---|
| < 40 | ARCHON INITIATE |
| 40–59 | DIGITAL FORENSIC |
| 60–79 | MASTER ANALYST |
| 80–94 | GHOST PROTOCOL |
| ≥ 95 | THE ARCHON |

Auch beim Scheitern gibt es eine Auswertung: erreichte Kapitel, gelöste Rätsel und Beweistiefe.

---

## 8. Oberfläche

Sie baut auf dem Desktop-Baustein auf, dazu kommen Elemente des GDD:

| Bereich | Inhalt |
|---|---|
| Oben links | ARCHON-Systemlogo bzw. Hostname |
| Oben Mitte | Sicherheitslevel (5 Segmente) und Status |
| Oben rechts | **TRACE 01:59:59** (Rückverfolgung) |
| Links | Anwendungsleiste |
| Mitte | frei bewegliche Fenster |
| Rechts | Ermittlungsakte (einklappbar): Beweismittel, Erkenntnisse, Verbindungen (Pinnwand), Hypothesen (bestätigt / widerlegt / offen) |
| Unten | Taskleiste, Systemlog-Ticker |

**Neue Anwendungen** (gegenüber DEADLINE):
- **LEDGER:** Tabelle mit Filter und Sortierung, Netzwerkansicht
- **Spektrogramm** im Mediaplayer
- **Notizbuch**
- **Systemlog**
- **Register** im Intranet

---

## 9. Dramaturgie und Ton

| Restzeit | Phase | Ton und Bild |
|---|---|---|
| 120–90 | Isolation | Lüfter, Tastatur, selten Systemmeldungen |
| 90–60 | Unruhe | erste Warnungen, Dateien mit seltsamen Zugriffszeiten |
| 60–30 | Bedrohung | `ns_observer`, verfremdete Meldungen, tieferes Brummen |
| 30–0 | Eskalation | Alarm, rote Rahmen, Herzschlag in den letzten 5 Minuten |

Die Eskalation läuft nach Restzeit, unabhängig vom Spielfortschritt, damit es auch beim Festhängen spannend bleibt. Die Story-Level kommen zusätzlich dazu.

---

## 10. Inhaltsumfang (Mindestmaß)

| Inhalt | Umfang |
|---|---|
| Haupt- / Nebenrätsel | 15 / 12 |
| E-Mails | 24 |
| Dokumente | 30 |
| Buchungen | 84 |
| Firmenprofile | 8 (+ Stiftung) |
| Rechnungen | 6 |
| Audio (Transkript + erzeugter Ton) | 4 (+ 3 Fragmente) |
| Bilder | 8 (gezeichnet als SVG) |
| Intranet-Seiten | 5 |
| Terminal-Protokolle | 12 |

---

## 11. Technik

### Desktop-Baustein `platform/desktop/` (zuerst)

Er wird aus DEADLINE.exe herausgelöst; DEADLINE läuft danach unverändert darauf weiter (Regressionstest: alle bisherigen DEADLINE-Tests).
- Fenster, Taskleiste, Startmenü, Meldungen, Touch-Absicherungen
- Countdown nach Systemuhr (läuft nur bei geöffnetem Spiel, Sprünge über 2 Minuten zählen nicht)
- Speicherstand, Ereignisse, Ton (Web Audio)
- Apps als Bausteine: Explorer, Editor, Mail (Kopfzeilen, Anhänge), Messenger, Browser, Terminal (Befehle pro Spiel), Mediaplayer, Bildbetrachter
- **Neu im Baustein:** Sperr-Manager (Ziel, Stufe, Restzeit), Sicherheitslevel, Hinweis-Auswahl

### Spiel `archon/`

```
archon/
  index.html            Titel, „nur am Computer“-Hinweis, Sperrbildschirm
  DESIGN.md             dieses Dokument
  README.md             Lösungen, Aufbau, Tests
  css/archon.css
  js/story.js           Texte, Mails, Dokumente, Figuren
  js/data.js            84 Buchungen, Firmen, Rechnungen, Register
  js/puzzles.js         15 + 12 Rätsel: Prüfung, Sperrziel, Hinweise
  js/game.js            Kapitel, Level, Wertung, Enden
  js/apps-archon.js     LEDGER, Spektrogramm, Notizbuch, Systemlog, Register
```

Bilder sind als SVG gezeichnet, Töne werden per Web Audio erzeugt. Das Spektrogramm-Bild mit „VELLUM“ wird zur Laufzeit gezeichnet. Es gibt keine externen Dateien und keine Abhängigkeiten.

### Prüfskript

Ein Skript prüft beim Bau automatisch:
- Die Hex-Regeln stimmen.
- Die Kette in LEDGER ist eindeutig.
- Genau eine Rechnung ist konsistent.
- Alle Lösungswege lassen sich durchspielen.

---

## 12. Tests und Abnahme

1. **Automatisch (Playwright):**
   - kompletter Durchlauf
   - alle Rätsel in verschiedenen Reihenfolgen innerhalb der Kapitel
   - jede Sperre: Dauer, Steigerung, nie eine Lese-Sperre
   - Zeitablauf und Neuladen (Zeit läuft weiter, Stand bleibt)
   - alle 4 Enden und das Scheitern
2. **Fairness:**
   - Jede Pflichtinformation ist ohne gesperrte Elemente erreichbar.
   - Kein Rätsel lässt sich vorziehen, indem man eine Lösung errät, die erst später hergeleitet werden kann. Ausnahme: der KESTREL-Wink, gewollt, nur Bestätigung.
3. **Menschen:** mindestens **drei Personen** spielen unabhängig und ohne Vorwissen.
   - Gemessen werden die Zeit je Kapitel, die Hinweise je Rätsel und wo jemand länger als 10 Minuten festhängt.
   - Danach werden Sperrzeiten, Wertung und die Schwelle für Beweistiefe festgelegt.
4. **Geräte:** Chrome, Firefox, Safari und Edge am Rechner. Am Handy nur der Hinweis „nur am Computer“.

---

## 13. Offene Entscheidungen

| Frage | Vorschlag |
|---|---|
| Schwelle Beweistiefe für A1/B1 | 6 von 12, nach Tests anpassen |
| Später Multiplayer? | Version 1 nur allein. Mit Sperren und Rangliste zu viert wäre ein eigenes Konzept nötig. |
| Bestenliste (Index, Restzeit) | später, wieder über Supabase, nur mit Einwilligung |
| Echte Sprachaufnahmen | optional, wenn ihr Stimmen aufnehmen wollt |

---

## 14. Nächste Schritte

1. Freigabe dieses Dokuments (Änderungswünsche hier eintragen)
2. Desktop-Baustein aus DEADLINE herauslösen, DEADLINE erneut komplett testen
3. Datensätze und Prüfskript (Kapitel 3 zuerst, weil es das Herzstück ist)
4. Kapitel 1–5 bauen, automatisch testen
5. Drei Testspieler, danach Feinabstimmung
6. Veröffentlichung als „Vorschau“ in der Kategorie *Digitale Escape Games*
