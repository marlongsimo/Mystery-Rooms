# DAS ARCHON-PROTOKOLL – Design-Dokument

**Version 1.2 · 01.11.2026 · Grundlage: Fassung 1.1 (fachliche und spielmechanische Prüfung), dazu: pausierbarer Countdown und Wissensdatenbank im Spiel**

> **Achtung: enthält alle Lösungen.** Nur für die Entwicklung, nicht für Testspieler.

**Umsetzung:** Stand 01.11.2026 gebaut. Kleine Abweichungen stehen in `README.md` (Abschnitt „Abweichungen“).

**Änderungen gegenüber 1.1**
- **Countdown:** pausierbar, nicht mehr strikt. Ohne Server und Backend; die Zeit läuft nur, solange das Spiel geöffnet und nicht pausiert ist (Kap. 0, 5a, 11, 15.6).
- **Neu: Kapitel 16 „Recherche“.** Eine Suchmaschine im Spiel erklärt jeden Fachbegriff, den man zum Lösen braucht: Embargo, Treuhand, IBAN, Base64 usw.
- **Neu: fiktive Embargoliste** und Frachtpapiere als Material (R7-Umfeld, N6).
- **Hinweise:** Die dritte Stufe von R11 und R12 nennt nicht mehr die Lösung (Regel „Hinweise ohne Lösung“).
- **Kapitel 15.2:** doppelte Sätze bereinigt.

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
| Spielzeit | 120:00 Minuten **Spielzeit**. Die Zeit läuft nur, während das Spiel geöffnet und nicht pausiert ist. |
| Pause | jederzeit möglich. Der Bildschirm wird dabei verdeckt, damit man nicht in der Pause weiterermittelt. |
| Ordner | `archon/` (eigener Speicherstand `archon_save_v1`) |
| Technik | baut auf dem gemeinsamen Desktop-Baustein `platform/desktop/` auf (aus DEADLINE.exe herausgelöst, siehe Kap. 11). Kein Backend nötig. |

### Was sich gegenüber dem GDD geändert hat

| GDD | Jetzt | Grund |
|---|---|---|
| Countdown = Aris' Löschroutine | Countdown = **ARCHONs Rückverfolgung** deiner Sitzung | Unterscheidet sich klar von DEADLINE.exe: Du bist selbst im Visier. |
| Finale „Beweise senden oder Wurm“ | Zwei Wege bleiben, aber **das Ergebnis hängt davon ab, wie vollständig du ermittelt hast** (4 Enden + Scheitern) | Kein zweites „senden oder löschen“ wie bei DEADLINE. |
| Sperre für jeden falschen Terminalbefehl | **Tippfehler werden nie bestraft.** Sperren nur bei falschen Lösungen (Codes, Passwörter, Zuordnungen), steigend | Druck gegen Raten, nicht gegen Vertippen. |
| Base64, Hex, Spektrogramm, Embargo ohne Erklärung | **Werkzeuge im Spiel** (`decode`, Spektrogramm, Filter in der Datenbank) und eine **Suchmaschine mit Erklärartikeln** zu jedem Fachbegriff (Kap. 16) | Die Leistung liegt im Erkennen und Kombinieren, nicht im Vorwissen. |
| Rätsel 14: „Wer die Regeln nicht findet, muss raten“ | Die Regeln liegen **sicher auffindbar** im wiederhergestellten Prüfbericht | Keine Sackgasse. |
| Masterpasswort ohne Format | **Format wird ausdrücklich verraten** (im reparierten Protokoll) | Niemand scheitert an Bindestrichen. |
| Countdown strikt, keine Pause | **Pause erlaubt.** Die Zeit läuft nur bei geöffnetem, nicht pausiertem Spiel. Neuladen setzt sie nicht zurück. | Entscheidung der Spielleitung: Fairness vor Härte. Kein Server nötig. |
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

**Pause in der Geschichte:** Aris hat ein Werkzeug hinterlassen, das die Verbindung „einfriert“: `FREEZE · TRACE ANGEHALTEN`. Solange es aktiv ist, steht die Rückverfolgung still, aber der Bildschirm ist dunkel, und du siehst nichts.

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
- **Recherche:** Die Suchmaschine (Kap. 16) ist ab dem Login jederzeit verfügbar. Vor dem Login hilft das Offline-Handbuch des Notfall-Terminals (`help <befehl>`).
- **Kapitelwechsel:** Das nächste Kapitel öffnet sich, wenn alle Haupträtsel des Kapitels gelöst sind. Story-Ereignisse und Sicherheitslevel kommen dazu.

---

## 3. Die 15 Haupträtsel mit Lösung

Zu jedem Rätsel stehen hier: Ort, Material, Herleitung, **Eingabe**, Sperrregel, drei Hinweise **ohne Lösung** und die Suchbegriffe aus Kap. 16. Für alle Rätsel gilt die Sperrregel aus Kap. 5: Der erste Fehlversuch ist frei, danach 30 / 60 / 90 / 120 Sekunden.

### KAPITEL 1 – Der kalte Bootvorgang

**Sichtbar:**
- Sperrbildschirm: Hintergrundbild, Uhr, Login-Feld (Benutzer `h.aris` vorausgefüllt)
- Kennworthinweis: **„Wo sie liegt.“**
- Knopf „Systeminformationen“
- Notfall-Terminal mit eingeschränkten Befehlen und Offline-Handbuch: `help`, `help <befehl>`, `sysinfo`, `ls`, `meta <datei>`, `decode <text>`, `whoami`, `clear`
  - `help decode` erklärt kurz, was Base64 ist und woran man es erkennt.

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
- **Recherche (Offline-Handbuch):** `help meta` (Metadaten), `help decode` (Base64)

#### R2 · Die manipulierte Spam-Mail
- **Material:** eingeschränktes Postfach mit 4 Mails. Eine Spam-Mail „Ihre Sendung konnte nicht zugestellt werden“. Unter „Kopfzeilen“ steht zwischen normalen Kopfzeilen `X-Archive-Key: c2FyZ2Fzc28=`.
- **Herleitung:** Eine Kopfzeile, die nicht in eine Spam-Mail gehört. Dekodiert ergibt sie **sargasso**.
- **Eingabe:** keine eigene. Das Wort wird in R3 gebraucht.
- **Hinweise:**
  1. „Nicht jede Spam-Mail ist Spam.“
  2. „Sieh dir an, was eine Mail über sich selbst verrät – unter der Oberfläche.“
  3. „Eine Kopfzeile beginnt mit X- und gehört zu keinem Mailprogramm. Das Terminal kann sie lesbar machen.“
- **Recherche:** E-Mail-Kopfzeilen · X-Header · Base64

#### R3 · Der erste Terminalzugang
- **Material:** `help` im Terminal nennt nach dem Login den neuen Befehl `auth <schlüssel>`.
- **Eingabe:** **`auth sargasso`**
- **Sperre:** Terminal-Befehl `auth` (das übrige Terminal bleibt frei)
- **Ergebnis:**
  - Bildschirmmeldung: „ACCESS GRANTED · USER: H.V.ARIS · SECURITY LEVEL 02 · ARCHIVE STATUS: PARTIALLY RECOVERED“
  - Freigeschaltet: Explorer, voller Mail-Client, Audio, Bilder, Papierkorb, Notizbuch, Intranet-Browser **mit Suchmaschine**
- **Hinweise:**
  1. „Das Terminal kann jetzt mehr. Frag es.“
  2. „`help` zeigt einen neuen Befehl.“
  3. „Der Schlüssel stammt aus der Mail, die keine Spam-Mail war.“

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
  - erklärt: „Die Zahlungsroute umfasst vier beteiligte Konten vom Ursprung bis zur letzten Zwischenstation. Das Ausschüttungskonto ist davon getrennt; maßgeblich ist der erste vollständige Durchlauf“ (für R8),
  - enthält im **Anhang „Prüfregeln für Sicherungsprotokolle“** die Regeln für R14.
- **Hinweise:**
  1. „Drei Teile einer Datei. Die Reihenfolge stand irgendwo, als sie noch ganz war.“
  2. „Aris hat die Teile an sich selbst gemailt. Achte auf die Uhrzeit, zu der er sie *ursprünglich* verschickt hat.“
  3. „Weiterleitungen tragen ein neues Datum. Die echte Zeit steht im zitierten Text.“
- **Recherche:** Weiterleitung (Fwd) · Dateifragmente

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
- **Recherche:** Spektrogramm · Frequenz

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
- **Recherche:** Handelsregister · Dokumentenfälschung erkennen

**Kapitelabschluss (R4, R5 und R6 gelöst):**
- Sicherheitslevel 03
- Story-Ereignis: Im Systemprotokoll taucht der Benutzer `ns_observer` auf.
- Freigeschaltet: die Datenbank-Anwendung **LEDGER**, der Bereich „Register“ im Intranet und der Ordner `PRUEFUNG/` (Rechnungen, Handelsdokumente, Prüfberichte, **Embargoliste**)

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

> **Hinweis zu den Daten:** Alle IBANs sind fiktiv, formal aufgebaut wie echte (Ländercode + zwei Prüfziffern + Kontokennung), aber nicht gültig. Die Suchmaschine erklärt den Aufbau einer IBAN, ohne eine der Spiel-IBANs zu nennen.

**LEDGER:** 84 Buchungen `TX-1001` bis `TX-1084` aus dem Zeitraum 01.09. bis 30.10.2026. Spalten: ID, Datum, Uhrzeit, Betrag, Währung, Absender, Empfänger, Rechnungsreferenz, Verwendungszweck. Werkzeuge: Filter nach Spalte, Sortierung, Markieren, Summe der markierten Buchungen.

| Gruppe (überschneidungsfrei) | Anzahl | Merkmal |
|---|---|---|
| Strukturierte Zahlungen NORD-01 → MERC-04 | 9 | 47.900–48.900 EUR, knapp unter der **internen Freigabe-/Prüfschwelle der Hafenbank von 50.000 EUR**, alle 2–4 Tage, keine Rechnungsreferenz. Darunter **TX-1017** (06.10., erster Durchlauf) und **TX-1015** (03.10., Feiertag → N5). |
| Weiterleitungen MERC-04 → ARGO-07 und ARGO-07 → LUX-02 | 18 | jeweils 1–3 Tage später, Betrag minus 1,5 % „Gebühr“, Verwendungszweck „Fracht“, aber keine Frachtpapiere. Darunter **TX-1019** (07.10.) und **TX-1022** (09.10.). |
| Ausschüttung LUX-02 → CORV-08 | 3 | Sammelbeträge, „Dividende“. Darunter **TX-1031** (14.10.). |
| Echter Handel LUX-02 → ARGO-07 (Falle) | 4 | 12.400 EUR usw., mit passender Rechnung (eine davon ist R10, TX-1046) und vollständigen Frachtpapieren |
| Honorare HALD-05 (Falle) | 6 | monatlich 8.500 EUR, ordentlich mit Rechnung |
| Große, aber legale Buchungen (Falle) | 5 | 250.000+ von CORV-08 an Dritte, sauber belegt |
| Alltagsbuchungen (Rauschen) | 39 | Miete, Gehälter, Leasing; TX-1084 ist eine unauffällige Gehaltszahlung |
| **Summe** | **84** | |

**Handelsdokumente und Embargoliste (Ordner `PRUEFUNG/Handel/`):**
- Vier Frachtpapiere (Konnossemente) zu den echten Handelsbuchungen. Sie nennen Warennummer, Absender, Empfänger und Bestimmungshafen.
- `embargoliste_2026.pdf`: die **fiktive** „Sanktionsliste der Republik Kaskarien“ mit Embargo-Codes (z. B. `K-3: Navigations- und Funktechnik, Warennummern 8526 xx`).
- Zu den 18 Weiterleitungen gibt es **keine** Frachtpapiere. Das ist das Indiz in R7.
- Ein fünftes, nicht verbuchtes Papier (MS KESTREL, Ware 8526 91, Weiterleitung nach Kaskarien) ist das Material für Nebenrätsel N6.
- Die Embargo-Codes sind **nicht Teil einer Pflichtlösung**. Sie liefern Beweistiefe und erklären, warum die Fracht als Tarnung taugt.

#### R7 + R8 · Transaktionsanalyse und die vier Konten
- **Fachlicher Hinweis zur 50.000-EUR-Schwelle:** Die 50.000 EUR sind ausschließlich eine fiktive interne Freigabe- und Prüfschwelle der Hafenbank, keine gesetzliche Verdachtsmeldeschwelle. Nach § 43 Abs. 1 GwG besteht die Pflicht zur Verdachtsmeldung unabhängig vom Wert der Transaktion. Die Spieler sollen ein bankinternes Umgehungsmuster erkennen. Der Suchmaschinen-Artikel „Strukturierung“ erklärt genau diesen Unterschied.
- **Herleitung:**
  1. Strukturierte Zahlungen erkennen: Häufigkeit, Beträge knapp unter der internen 50.000-EUR-Schwelle, fehlende Rechnungsreferenzen. Große Beträge allein führen in die Falle.
  2. Der Kette folgen: Wohin geht das Geld 1–3 Tage später? Zu den Weiterleitungen gibt es keine Frachtpapiere.
  3. Prüfbericht (aus R4): Die Route umfasst vier beteiligte Konten einschließlich des Ursprungskontos und endet vor CORV-08. CORV-08 ist das separate Ausschüttungskonto und zählt nicht mit. Die Reihenfolge ergibt sich aus dem ersten vollständigen Durchlauf (06.–14.10.).
  4. Code = die IBAN-Prüfziffern der vier Konten in der Reihenfolge der Kette.
- **Eingabe:** LEDGER, Funktion „Rückverfolgung bestätigen“ (Code-Feld): **`42178805`** (NORD 42 · MERC 17 · ARGO 88 · LUX 05)
- **Sperre:** LEDGER-Analysemodul. Abweichend: der erste Fehlversuch ist frei, danach **90 Sekunden** fest.
- **Rückmeldung bei typischen Fehlern** (ohne Lösung):
  - Code mit CH29 → „Ausschüttung ist keine Station.“
  - richtige vier, falsche Reihenfolge → „Stationen erkannt, Reihenfolge nicht.“
  - HALD-05 enthalten → „Honorare mit Rechnung sind kein Durchlauf.“
- **Hinweise:**
  1. „Es geht nicht um die größten Beträge, sondern um die regelmäßigsten.“
  2. „Folge einer Zahlung: Wohin geht dasselbe Geld ein, zwei Tage später?“
  3. „Der Prüfbericht sagt, welche Konten zählen und in welcher Reihenfolge. Die Ziffern stehen in den Firmenprofilen.“
- **Recherche:** Strukturierung (Smurfing) · Geldwäsche (Phasen) · Layering · Interne Freigabeschwelle vs. Verdachtsmeldung · IBAN · Prüfziffer · Briefkastenfirma · Frachtpapiere

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
- **Recherche:** Holding · Trust/Treuhand · Nominee · Stiftung (Liechtenstein) · Protektor · wirtschaftlich Berechtigter · Transparenzregister · Registernummer

#### R10 · Der Rechnungsabgleich
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
  1. „Fünf Rechnungen haben je genau einen Fehler. Eine einzige ist mit allen drei Quellen konsistent.“
  2. „Prüfe jede Rechnung gegen drei Quellen: Buchung, Register, Prüfbericht.“
  3. „Achte auf Beträge, Daten, Anschriften, Steuernummern und darauf, ob es den Aussteller an diesem Tag noch gab.“
- **Recherche:** Rechnungsprüfung · USt-Identifikationsnummer (Formate je Land) · Umfirmierung

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
- **Material:** In `INQUISITION_PROTOCOL/` liegen sechs interne Nachrichten mit vollständigen Kopfzeilen (Absender, Empfänger, Zeitstempel, Betreff). Dazu fünf Kurzprofile (Zahlungsabwicklung, Reederei-Kontakt, Varga/Corvane, Halden Consult, Aufsichtsratsbüro Hafenbank).

| Nachricht | Absender → Empfänger | Inhaltlicher Beleg |
|---|---|---|
| MSG-01 | Obolus → Reede | „Die Überweisungen der Woche sind raus. Freigabe wie angewiesen; die Zahlungslisten liegen im Tresor.“ |
| MSG-02 | Reede → Kompass | „Umschlag über Limassol abgeschlossen. Die Route entspricht deiner Vorgabe.“ |
| MSG-03 | Kompass → Anker | „Der Prüfer fragt nach Anlage B. Ich beobachte ihn und melde jede Abweichung.“ |
| MSG-04 | Anker → Nordstern | „Treuhänder bestätigt. Die Anweisungen wurden umgesetzt. Ich erwarte deine nächste Freigabe.“ |
| MSG-05 | Nordstern → Anker | „Niemand berichtet über mich. Alle berichten an mich.“ |
| MSG-06 | Obolus → Reede (Kopie an Anker) | „Die Zahlungsläufe wurden nach Freigabe durch Reede ausgeführt; die operative Anweisung kam über dessen Route.“ |

- **Herleitung:** Die Kopfzeilen zeigen die Berichtskette, die Texte bestätigen die Funktion. Von der untersten zur obersten Ebene: Obolus → Reede → Kompass → Anker → Nordstern. Die Anfangsbuchstaben ergeben **ORKAN**. MSG-06 ist eine Kontrollnachricht, kein zusätzlicher Hierarchie-Knoten.
- **Eingabe:** Freigabe von `hierarchie.lock`: **`ORKAN`**
- **Sperre:** Datei
- **Hinweise:**
  1. „Fünf Decknamen, fünf Ebenen. Die Kopfzeilen verraten, wer wem berichtet.“
  2. „Beginne bei den Zahlungslisten und folge der Berichtskette bis zu der Person, an die niemand berichtet.“
  3. „Der Schlüssel ist ein Wort aus fünf Buchstaben: der Anfang jedes Decknamens, von unten nach oben.“
- **Recherche:** Berichtslinie · Organigramm · Deckname

#### R12 · Die Identität von ARCHON
- **Material:**
  - Drei Audiofragmente mit getrennten, sichtbaren Metadaten:
    - **F1**, 28.10., Aufnahmezeit 19:41: „Ich habe zehn Minuten. Drinnen reden sie noch über die Quartalszahlen.“
    - **F2**, 28.10., Aufnahmezeit 19:43: Schiffshorn und Möwen. Das Hafen-Intranet ordnet das Geräusch dem Anleger nahe dem Bankgebäude zu.
    - **F3**, 28.10., Aufnahmezeit 19:58: Glockenschlag und der Satz „Gleich acht.“ Das Fragment bestätigt den Zeitkontext, ist aber allein kein Identitätsbeweis.
  - Sitzungsprotokoll des Aufsichtsrats der Hafenbank vom 28.10., 18:00–21:00, TOP 3 Quartalszahlen. Vermerk: *„19:35–19:48 Sitzung unterbrochen; die Vorsitzende verlässt kurz den Raum.“* Vorsitzende laut Teilnehmerliste: **Margarete Holm**.
  - Nachricht `nordstern.enc`: Ihr Passwort ist der Nachname von Nordstern.
- **Herleitung:**
  - F1 datiert das Telefonat auf 19:41. Das Sitzungsprotokoll dokumentiert genau zu diesem Zeitpunkt eine Unterbrechung und den Abgang der Vorsitzenden.
  - F2 stützt den Ort. F3 ist ein atmosphärisches Zeitindiz, aber kein notwendiger Beweis.
  - Die einzige in den Unterlagen belegte Person, die den Sitzungssaal in diesem Zeitfenster verlässt, ist Margarete Holm.
- **Eingabe:** Passwort für `nordstern.enc`: **`HOLM`**
- **Sperre:** Datei, steigend (wichtig gegen das Durchprobieren aller Namen)
- **Ergebnis:** Nordsterns Nachricht an Anker: *„Lasst den Prüfer weitermachen. Ich will wissen, wie weit man kommt.“* So erfährt man, dass die Auftraggeberin die Täterin ist.
- **Hinweise:**
  1. „Nordstern hat eine Lücke im Terminkalender verraten.“
  2. „Vergleiche den Zeitstempel des Telefonats mit dem Sitzungsprotokoll.“
  3. „Das Protokoll vermerkt eine Unterbrechung. Wer hat den Raum in genau dieser Zeit verlassen? Die Teilnehmerliste sagt, wer diese Rolle hat.“
- **Recherche:** Aufsichtsrat · Sitzungsprotokoll · Audio-Metadaten

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
- **Sperre:** Eine falsche Reparatur sperrt `repair` steigend. Ab dem zweiten Fehler wird das Finale-Protokoll jeweils 120 Sekunden gesperrt.
- **Ergebnis:** Das Protokoll ist lesbar und nennt das Format des Masterpassworts:
  `MASTER = <ZUGANG>-<TON>-<STATIONEN>-<ORDNUNG>`
- **Hinweise:**
  1. „Die Regeln standen in Aris' Prüfbericht.“
  2. „Hex-Ziffern: A=10 … F=15. Jede Zeile prüft sich selbst.“
  3. „Rechne für jeden Block die Summe der ersten drei Stellen mod 16 und vergleiche mit der vierten.“
- **Recherche:** Hexadezimalsystem · Modulo · Prüfsumme

#### R15 · Die letzte Verschlüsselung
- **Eingabe:** `decrypt ARCHON_ORIGIN --key KESTREL47-VELLUM-42178805-ORKAN`
  - ZUGANG = Login (R1) · TON = Spektrogramm (R5) · STATIONEN = Kontencode (R8) · ORDNUNG = Hierarchie (R11)
- **Sperre:** `decrypt` steigend
- **Rückmeldung bei Fehlern:** Wie viele der vier Teile stimmen („2 von 4 Teilen gültig“), aber nicht welche. Erst ab dem dritten Fehlversuch.
- **Hinweise:**
  1. „Das Format steht im reparierten Protokoll.“
  2. „Jeder Teil ist ein Schlüssel, den du schon benutzt oder gefunden hast.“
  3. „Zugang = das erste, was du auf diesem Rechner eingegeben hast. Ton = was du gesehen, nicht gehört hast.“

#### Die Entscheidung

`ARCHON_ORIGIN` öffnet sich. Darin liegen Stiftungsurkunde, Zahlungsplan und Nordsterns Anweisungen, also die vollständigen Beweise. Zwei Wege:

| | **A · DIE WAHRHEIT** | **B · DIE AUSLÖSCHUNG** |
|---|---|---|
| Handlung | Beweise an die Staatsanwaltschaft Hamburg (Wirtschaftsstrafsachen) übertragen | Aris' Simulationsprogramm `ARCHON-WORM` starten |
| Folge | Holm wird angeklagt. Die Rückverfolgung erreicht dich: Deine Identität ist bekannt. | Die Infrastruktur von ARCHON bricht zusammen, die Beweise sind weg. Niemand wird je angeklagt. Du bleibst unerkannt. |

**Ergebnis je nach Vollständigkeit** („Beweistiefe“, siehe Kap. 4):

| Ende | Bedingung | Auflösung (Kurzfassung) |
|---|---|---|
| **A1 · Die Wahrheit** | A gewählt; mindestens 6 Beweispunkte; mindestens ein Beweis aus jeder der vier Kategorien; N8 (unabhängiger Pressekontakt) gefunden | Die Beweiskette ist belastbar. Holm wird angeklagt, Aris kehrt zurück, du wirst als Zeugin bzw. Zeuge geschützt. |
| **A2 · Die halbe Wahrheit** | A gewählt, A1-Bedingungen nicht erfüllt | Holm tritt zurück, aber die Beweiskette reicht nicht für eine tragfähige Anklage. Aris bleibt verschwunden. |
| **B1 · Die Auslöschung** | B gewählt; mindestens 6 Beweispunkte; mindestens ein Beweis aus jeder der vier Kategorien | ARCHONs Infrastruktur zerfällt vollständig. Aris schickt eine letzte Postkarte ohne Absender. |
| **B2 · Der Schatten** | B gewählt, B1-Bedingungen nicht erfüllt | ARCHON verliert ein Netz und baut ein neues. Nordstern bleibt im Amt. |
| **SYSTEM FAILURE** | 120 Minuten Spielzeit erreicht, bevor die Entscheidung bestätigt wurde | „ARCHIVE PURGED · ALL EVIDENCE DESTROYED · SESSION TERMINATED“ |

Danach folgen in allen Fällen die Auswertung (Kap. 7), eine Kapitelübersicht, „Lösungen anzeigen“ (nach Abfrage) und die Bewertung (`platform/rating`).

---

## 4. Die 12 Nebenrätsel (Beweistiefe)

Nebenrätsel sind nie Pflicht für das Erreichen des Finales. Jedes bringt einen Beweispunkt und gehört genau zu einer Beweiskategorie. Die Kategorien verhindern, dass sechs triviale Funde allein als vollständige Beweiskette gelten. Manche Nebenrätsel öffnen zusätzlich einen zweiten Weg zu einer Information. Das schützt vor Sackgassen durch Sperren.

**Beweiskategorien:**
- **Finanziell:** N5, N6
- **Organisatorisch:** N1, N2, N9
- **Personenbezogen:** N3, N4, N11, N12
- **Überwachung / unabhängige Bestätigung:** N7, N8, N10

| Nr. | Kapitel | Rätsel | Lösung / Auslöser | Nutzen |
|---|---|---|---|---|
| N1 | 1 | `whoami` vor dem Login | zeigt `guest@unknown`. Nach dem Login zeigt ein zweites `whoami` die versteckte Gruppe `wg-nordelbe` | Beweis: Zugang über Bank-Infrastruktur |
| N2 | 2 | Notizbuch, Seite 3: Zahlenreihe 8-5-12-13 | Buchstaben-Positionen im Alphabet = **HELM** → Ordner `HELM/` | Fotos vom Hafen, Schiff KESTREL im Besitz von ARGO-07 |
| N3 | 2 | Kalender von Aris: drei Termine „H.“ | alle am Tag nach Aufsichtsratssitzungen | Indiz zu Holm (zweiter Weg zu R12) |
| N4 | 2 | Sprachnachricht von Ida, rückwärts abgespielt (Player-Funktion) | „Er ist sicher. Frag nicht, wo.“ | Aris lebt |
| N5 | 3 | Feiertagsbuchung TX-1015 (03.10.) | in LEDGER als „automatisiert“ markieren | automatisierter Zahlungsplan |
| N6 | 3 | Nicht verbuchtes Frachtpapier MS KESTREL + Embargoliste + Schiffsposition (AIS-Liste im Hafen-Intranet) | Warennummer 8526 91 fällt unter den fiktiven Embargo-Code **K-3**. Die KESTREL lag an den Tagen der Weiterleitungen an Liegeplatz 47. Eingabe: Embargo-Code `K-3` im Feld „Befund“ des Frachtpapiers | Ware als Tarnung, Embargoverstoß |
| N7 | 3 | `log --user ns_observer` | Login-Zeiten = Sitzungspausen der Bank | Überwachung durch die Bank (zweiter Weg zu R12) |
| N8 | 3 | Mail-Verlauf mit Mats Brenner, Anhang verschlüsselt | Passwort `NORDELBE` (Hinweis: „Wofür du arbeitest“) | Pressekontakt, für Ende A1 Pflicht |
| N9 | 4 | Fremdes Fenster „ARCHON“: Quelltext ansehen (`inspect window`) | enthält `trace_origin=hafenbank-nordelbe.local` | ARCHON überwacht von der Bank aus |
| N10 | 4 | `history` im Terminal | Aris' letzte Befehle, u. a. `schedule msg 03.11 22:47` | Aris hat dir den Link geschickt |
| N11 | 4 | Gelöschte SMS im Papierkorb (erscheint in Kapitel 4) | Holms Fahrer: „Wagen steht 19:35 am Seiteneingang“ | dritter Weg zu R12 |
| N12 | 5 | versteckte Datei im Finale: `ls -a` zeigt `.postkarte` | „Ich lebe. Danke, dass du geblieben bist. – H.“ | Abschluss-Geheimnis |

**Schwelle:**
- Für A1 und B1 braucht es mindestens 6 von 12 Beweispunkten und mindestens einen Fund aus jeder Kategorie.
- A1 braucht zusätzlich N8 als unabhängigen Pressekontakt.
- Diese Schwellen werden nach Testspielen überprüft. Ändern darf man sie nur mit dokumentierten Testdaten.

---

## 5. Fehlersystem: Sperren und Sicherheitslevel

### Sperren

- **Wofür:** nur bei falschen *Lösungen* (Passwort, Code, Zuordnung, Reparatur, Entschlüsselung).
- **Nie gesperrt:** unbekannte Befehle, Tippfehler in Befehlsnamen, falsche Syntax. Das Terminal antwortet dann mit `Unbekannter Befehl – help`. Auch Suchanfragen in der Suchmaschine werden nie gesperrt.
- **Dauer:** Der erste Fehlversuch je Ziel ist frei, danach 30 → 60 → 90 → 120 Sekunden (höchstens 120). Ausnahmen: LEDGER 90 Sekunden fest, Finale-Protokoll 120 Sekunden ab dem 2. Fehler.
- **Anzeige:** Sperren laufen in **Spielzeit** ab. In der Pause steht also auch eine Sperre still. Gesperrte Fenster zeigen „GESPERRT · 0:47 · Sicherheitsprotokoll“.
- **Fairness:** Eine Sperre betrifft immer nur das Eingabefeld bzw. den Befehl, nie das Lesen von Dateien und nie die Suchmaschine. Was man zum Lösen braucht, bleibt sichtbar.

### 5a. Pause

- **Bedienung:** über die Taskleiste und die Taste `Esc`, jederzeit und beliebig oft.
- **Während der Pause:** Der Bildschirm wird verdeckt („FREEZE · TRACE ANGEHALTEN“). Countdown, Sperren und zeitgesteuerte Ereignisse stehen still.
- **Wertung:** Pausen kosten nichts und werden nicht gezählt.
- **Geschlossene Seite:** Wird das Spiel geschlossen oder der Rechner geht in den Ruhezustand, läuft die Zeit nicht weiter. Beim Öffnen geht es mit der gespeicherten Restzeit weiter.
- **Hintergrund-Tab:** Ein Tab im Hintergrund pausiert **nicht** automatisch. Wer weg will, drückt Pause.

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
- **Auswahl:** Sind mehrere Rätsel offen, wählt man aus, wofür man Hilfe will.
- **Kosten:** Jeder Hinweis kostet Wertungspunkte, aber keine Zeit.
- **Suchmaschine (Kap. 16):** zählt **nicht** als Hinweis und kostet nichts.
- **Nach dem Spiel**, bei Erfolg oder Scheitern: „Lösungen anzeigen“ nach einer Abfrage.

---

## 7. Auswertung: ARCHON Performance Index

Die Gewichtung ist vorläufig und wird nach den Testspielen festgelegt.

| Kriterium | Gewicht | Berechnung (Entwurf) |
|---|---|---|
| Ermittlungsleistung | 35 % | 60 % gelöste Haupträtsel (gelöst / 15) + 40 % Beweistiefe (Punkte / 12), normiert auf 0–100 |
| Rätselgenauigkeit | 25 % | 100 % minus 4 % je Fehlversuch (min. 0) |
| Zeitmanagement | 20 % | `min(Restzeit in Sekunden / 1.800, 1) × 100`: bei 30 Minuten Restzeit oder mehr volle Punkte, darunter anteilig |
| Hilfenutzung | 10 % | 100 % minus 10 % je Hinweis |
| Sicherheitsverhalten | 10 % | Level 1–3 = 100 %, Level 4 = 75 %, Level 5 = 50 %. Story-bedingte Anstiege ziehen nichts ab, nur die durch Fehlversuche verursachten Zusatzstufen. |

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
| Oben rechts | **TRACE 01:59:59** (Rückverfolgung) und Pause-Knopf |
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
- **Suchmaschine** im Browser (Kap. 16)

---

## 9. Dramaturgie und Ton

| Restzeit | Phase | Ton und Bild |
|---|---|---|
| 120–90 | Isolation | Lüfter, Tastatur, selten Systemmeldungen |
| 90–60 | Unruhe | erste Warnungen, Dateien mit seltsamen Zugriffszeiten |
| 60–30 | Bedrohung | `ns_observer`, verfremdete Meldungen, tieferes Brummen |
| 30–0 | Eskalation | Alarm, rote Rahmen, Herzschlag in den letzten 5 Minuten |

Die Eskalation läuft nach Restzeit, unabhängig vom Spielfortschritt, damit es auch beim Festhängen spannend bleibt. Die Story-Level kommen zusätzlich dazu. In der Pause verstummen alle Geräusche.

---

## 10. Inhaltsumfang (Mindestmaß)

| Inhalt | Umfang |
|---|---|
| Haupt- / Nebenrätsel | 15 / 12 |
| E-Mails | 24 |
| Dokumente | 30 (dazu 5 Frachtpapiere und die Embargoliste) |
| Buchungen | 84 |
| Firmenprofile | 8 (+ Stiftung) |
| Rechnungen | 6 |
| Audio (Transkript + erzeugter Ton) | 4 (+ 3 Fragmente) |
| Bilder | 8 (gezeichnet als SVG) |
| Intranet-Seiten | 5 |
| Terminal-Protokolle | 12 |
| **Wissensartikel (Suchmaschine)** | **mindestens 40** (Kap. 16) |

---

## 11. Technik

### Desktop-Baustein `platform/desktop/` (zuerst)

Er wird aus DEADLINE.exe herausgelöst; DEADLINE läuft danach unverändert darauf weiter (Regressionstest: alle bisherigen DEADLINE-Tests).
- Fenster, Taskleiste, Startmenü, Meldungen, Touch-Absicherungen
- **Countdown als Spielzeit:**
  - Die vergangene Spielzeit wird im Speicherstand gesichert (alle 5 Sekunden und beim Verlassen der Seite).
  - Gemessen wird mit der Systemuhr, weil Browser Zeitgeber in Hintergrund-Tabs drosseln.
  - Ein Sprung über 2 Minuten (Ruhezustand) zählt nicht.
  - Pause hält Zeit, Sperren und Ereignisse an. Neuladen setzt nichts zurück.
  - Nicht manipulationssicher, aber das ist bei einem kostenlosen Einzelspiel auch nicht nötig.
- Speicherstand, Ereignisse, Ton (Web Audio)
- Apps als Bausteine: Explorer, Editor, Mail (Kopfzeilen, Anhänge), Messenger, Browser (mit Suchmaschine), Terminal (Befehle pro Spiel, `help <befehl>`), Mediaplayer, Bildbetrachter
- **Neu im Baustein:** Sperr-Manager (Ziel, Stufe, Restzeit in Spielzeit), Sicherheitslevel, Hinweis-Auswahl, Pause-Overlay, **Suchmaschine** (Index, Synonyme, Artikelansicht)

### Spiel `archon/`

```
archon/
  index.html            Titel, „nur am Computer“-Hinweis, Sperrbildschirm
  DESIGN.md             dieses Dokument
  README.md             Lösungen, Aufbau, Tests
  css/archon.css
  js/story.js           Texte, Mails, Dokumente, Figuren
  js/data.js            84 Buchungen, Firmen, Rechnungen, Register, Frachtpapiere, Embargoliste
  js/wiki.js            Wissensartikel der Suchmaschine (Kap. 16)
  js/puzzles.js         15 + 12 Rätsel: Prüfung, Sperrziel, Hinweise, Suchbegriffe
  js/game.js            Kapitel, Level, Wertung, Enden
  js/apps-archon.js     LEDGER, Spektrogramm, Notizbuch, Systemlog, Register
```

Bilder sind als SVG gezeichnet, Töne werden per Web Audio erzeugt. Das Spektrogramm-Bild mit „VELLUM“ wird zur Laufzeit gezeichnet. Es gibt keine externen Dateien, keine Abhängigkeiten und kein Backend.

### Prüfskript

Ein Skript prüft beim Bau automatisch:
- Die Hex-Regeln stimmen.
- Die Kette in LEDGER ist eindeutig.
- Genau eine Rechnung ist konsistent.
- Alle Lösungswege lassen sich durchspielen.
- **Jeder Suchbegriff, der bei einem Rätsel unter „Recherche“ steht, liefert in der Suchmaschine mindestens einen Artikel.**
- **Kein Wissensartikel enthält eine Lösung** (Abgleich gegen alle Lösungswerte).

---

## 12. Tests und Abnahme

1. **Automatisch (Playwright):**
   - kompletter Durchlauf
   - alle Rätsel in verschiedenen Reihenfolgen innerhalb der Kapitel
   - jede Sperre: Dauer, Steigerung, nie eine Lese-Sperre, steht in der Pause still
   - Pause, Neuladen, Ruhezustand: Zeit und Stand stimmen
   - Zeitablauf, alle 4 Enden und das Scheitern
   - Suchmaschine: alle Pflichtbegriffe finden Artikel, Tippfehler und Synonyme werden erkannt
2. **Fairness:**
   - Jede Pflichtinformation ist ohne gesperrte Elemente erreichbar.
   - Jeder Fachbegriff ist erklärt.
   - Kein Rätsel lässt sich vorziehen, indem man eine Lösung errät, die erst später hergeleitet werden kann. Ausnahme: der KESTREL-Wink, gewollt, nur Bestätigung.
3. **Menschen:** mindestens **drei Personen** spielen unabhängig und ohne Vorwissen, davon mindestens eine ohne Finanz- oder IT-Hintergrund.
   - Gemessen werden die Zeit je Kapitel, die Hinweise je Rätsel, die genutzten Suchbegriffe (lokal protokolliert) und wo jemand länger als 10 Minuten festhängt.
   - Danach werden Sperrzeiten, Wertung, die Schwelle für Beweistiefe und fehlende Wissensartikel ergänzt.
4. **Geräte:** Chrome, Firefox, Safari und Edge am Rechner. Am Handy nur der Hinweis „nur am Computer“.

---

## 13. Offene Entscheidungen

| Frage | Vorschlag |
|---|---|
| Schwelle Beweistiefe für A1/B1 | 6 von 12, nach Tests anpassen |
| Später Multiplayer? | Version 1 nur allein. Mit Sperren und Rangliste zu viert wäre ein eigenes Konzept nötig. |
| Bestenliste (Index, Restzeit) | Später, wieder über Supabase, nur mit Einwilligung. Weil Pausen erlaubt sind, zählt in einer Bestenliste nur die Spielzeit. |
| 50.000-EUR-Wert | Ausschließlich interne Schwelle der fiktiven Hafenbank, ausdrücklich keine gesetzliche Verdachtsmeldeschwelle. |
| Echte Sprachaufnahmen | optional, wenn ihr Stimmen aufnehmen wollt |

---

## 14. Nächste Schritte

1. Freigabe dieses Dokuments (Änderungswünsche hier eintragen)
2. Desktop-Baustein aus DEADLINE herauslösen, DEADLINE erneut komplett testen
3. Datensätze, Wissensartikel und Prüfskript (Kapitel 3 zuerst, weil es das Herzstück ist)
4. Kapitel 1–5 bauen, automatisch testen
5. Drei Testspieler, danach Feinabstimmung
6. Veröffentlichung als „Vorschau“ in der Kategorie *Digitale Escape Games*

---

## 15. Verbindliche Konsistenz- und Fachhinweise

### 15.1 Geldwäsche-Fachlichkeit
- Die 50.000-EUR-Grenze ist eine interne Freigabe- und Prüfschwelle der fiktiven Hafenbank Nordelbe.
- Sie darf in keinem Spieltext als gesetzliche Meldegrenze oder als Grenze für Verdachtsmeldungen bezeichnet werden.
- § 43 Abs. 1 GwG bestimmt, dass eine Verdachtsmeldung bei Vorliegen der gesetzlichen Voraussetzungen unabhängig vom Wert der Transaktion zu erfolgen hat (Quelle: § 43 GwG, gesetze-im-internet.de).
- Der Wissensartikel „Strukturierung“ und der Artikel „Verdachtsmeldung“ müssen das so darstellen.

### 15.2 Zählweise der 84 Buchungen
- **Grundsatz:** Die 84 Buchungen werden genau einmal gezählt.
- **Die überschneidungsfreien Gruppen:**
  - 9 strukturierte Zahlungen NORD → MERC
  - 18 Weiterleitungen (MERC → ARGO und ARGO → LUX)
  - 3 Ausschüttungen (LUX → CORV)
  - 4 echte Handelsbuchungen
  - 6 Honorare
  - 5 große belegte legale Buchungen
  - 39 Alltagsbuchungen
  - Summe: **84**
- **Teilmengen, die nicht zusätzlich zählen:**
  - Der „erste vollständige Durchlauf“ (TX-1017, TX-1019, TX-1022, TX-1031) liegt innerhalb dieser Gruppen.
  - Ebenso die Feiertagsbuchung TX-1015 (in den 9 strukturierten Zahlungen).
  - TX-1084 ist eine unauffällige Gehaltszahlung innerhalb der 39 Alltagsbuchungen.

### 15.3 R8 – Stationen und Code
Die vier Konten für den Code sind NORD-01 → MERC-04 → ARGO-07 → LUX-02. NORD-01 ist das Ursprungskonto und zählt als erstes der vier Konten. CORV-08 ist das separate Ausschüttungskonto und gehört nicht in den Code.

### 15.4 R11 – eindeutige Hierarchie
- Die sechs Nachrichten haben vollständige Kopfzeilen mit Absender und Empfänger.
- Die fünf Hierarchiestufen sind Obolus, Reede, Kompass, Anker und Nordstern. MSG-06 ist eine Kontrollnachricht, kein sechster Deckname.
- Von unten nach oben gelesen ergibt sich ORKAN.
- Nachrichten und Profile müssen im Produktionsdatensatz genau mit der Tabelle in R11 übereinstimmen.

### 15.5 R12 – Beweisführung
- Die Identifizierung von Margarete Holm stützt sich nur auf F1 (19:41) zusammen mit dem Sitzungsprotokoll (Unterbrechung 19:35–19:48, Abgang der Vorsitzenden).
- F2 stützt den Ort.
- F3 ist ein atmosphärisches Zusatzindiz und darf nicht als notwendiger Schlussstein behandelt werden.

### 15.6 Zeitregel (geändert in 1.2)
- **Start:** Der 120-Minuten-Countdown startet beim ersten Klick auf „Verbindung herstellen“.
- **Spielzeit:** Er misst Spielzeit und läuft nur, solange das Spiel geöffnet und nicht pausiert ist.
- **Pause:** jederzeit erlaubt. Sie verdeckt den Bildschirm und hält Countdown, Sperren und Ereignisse an.
- **Neuladen** setzt die Zeit nicht zurück.
- **Ablauf:** Nach 120 Minuten Spielzeit ist die Sitzung beendet (SYSTEM FAILURE). Ein neuer Versuch beginnt bei 120:00.

### 15.7 Produktionsfreigabe
- **Vor der Implementierung:** In `data.js` müssen alle 84 Datensätze vollständig vorliegen, ebenso in `wiki.js` alle Pflichtartikel aus Kap. 16.
- **Das Prüfskript kontrolliert:**
  - lückenlose IDs TX-1001 bis TX-1084
  - eindeutige Buchungsgruppen ohne Doppelzählung
  - genau eine konsistente Rechnung
  - eindeutige vierteilige Zahlungsroute
  - eindeutige Lösung ORKAN
  - eindeutige Zuordnung der zwölf Nebenrätsel zu vier Beweiskategorien
  - alle vier Endbedingungen
  - Abdeckung aller Recherche-Begriffe
  - keine Lösungswerte in Wissensartikeln

---

## 16. Recherche: Suchmaschine und Wissensartikel (neu in 1.2)

### Grundsatz

**Jede schwierige Sache muss suchbar und erklärt sein.** Wer nicht weiß, was eine Embargoliste, ein Nominee oder Base64 ist, soll es im Spiel nachschlagen können und danach selbst weiterkommen. Die Suchmaschine erklärt Begriffe und Methoden. **Sie nennt nie eine Lösung** und nie Daten aus dem Fall (keine Spiel-IBANs, keine Registernummern, keine Namen).

### Wie sie funktioniert

| Merkmal | Festlegung |
|---|---|
| Name im Spiel | **NORDSUCHE**, Startseite des Intranet-Browsers, ab dem Login verfügbar |
| Vor dem Login | Offline-Handbuch im Notfall-Terminal: `help <befehl>` erklärt `meta`, `decode` und Base64 |
| Suche | Groß-/Kleinschreibung und Umlaute egal (ae = ä), Teilwörter, Tippfehler bis 2 Zeichen, **Synonyme** (z. B. „Treuhand“ findet Trust, „Smurfing“ findet Strukturierung, „Sanktion“ findet Embargo) |
| Ergebnis | Liste mit Titel und Anrisstext. Ein Klick öffnet den Artikel. Querverweise führen zu verwandten Artikeln. |
| Artikelaufbau | **Was ist das?** (2–3 Sätze) · **Woran erkennt man es?** · **Wie geht man vor?** (Methode in Schritten) · **Beispiel** (immer mit neutralen Beispieldaten, nie mit Falldaten) · **Siehe auch** |
| Leere Suche | Vorschlag „Meintest du …?“ und Themenübersicht nach Bereichen |
| Kosten | keine. Zählt nicht als Hinweis, wird nie gesperrt. |
| Werkzeuge im Artikel | Wo sinnvoll, steht ein Mini-Rechner dabei, z. B. ein Hex-Dezimal-Umrechner oder ein Base64-Feld (dasselbe wie `decode`). |

### Pflichtartikel (mindestens 40)

**Technik und Daten**

| Artikel | Erklärt | gebraucht für |
|---|---|---|
| Base64 | Kodierung statt Verschlüsselung; erkennbar an A–Z, a–z, 0–9, +, / und `=` am Ende; Dekodieren mit `decode` | R1, R2 |
| Metadaten / EXIF | Was Bilder über sich speichern (Kamera, Datum, Kommentar); Ansehen mit `meta` | R1 |
| E-Mail-Kopfzeilen | From, To, Date, Received, Message-ID; warum `Received` verlässlicher ist als `Date` | R2, N8 |
| X-Header | Selbst definierte Kopfzeilen, warum sie auffallen | R2 |
| Weiterleitung (Fwd) | neues Datum, ursprüngliche Zeit im Zitat | R4 |
| Dateifragmente / Wiederherstellen | Reihenfolge, `restore` | R4 |
| Spektrogramm | Zeit × Frequenz × Lautstärke; Bilder im Spektrum; Bedienung des Spektrogramms im Player | R5 |
| Frequenz / Hertz | hoch und tief, kHz | R5 |
| Rückwärts abspielen | Funktion im Player | N4 |
| Hexadezimalsystem | 0–9, A–F, Umrechnung, Umrechner | R14 |
| Modulo | Rest einer Division, „mod 16“ mit Beispielen | R14 |
| Prüfsumme / Prüfziffer | wozu sie dienen, wie man einen Fehler findet | R14, R8 |
| Terminal-Befehle | Übersicht und `help <befehl>` | alle |
| Systemlog | Zeilenaufbau, Filter `log --user` | N7 |
| Kalender als Beweis | Datumslogik, Wochentage | N3, R6 |

**Finanzen und Geldwäsche**

| Artikel | Erklärt | gebraucht für |
|---|---|---|
| Geldwäsche | drei Phasen: Platzierung, Verschleierung (Layering), Integration | R7/R8 |
| Strukturierung (Smurfing) | Aufteilen von Beträgen unter eine Schwelle. **Wichtig:** interne Bankschwellen sind keine gesetzliche Meldegrenze (§ 43 GwG) | R7 |
| Verdachtsmeldung (GwG) | wer meldet, unabhängig vom Betrag | R7 |
| Interne Freigabeschwelle | Vier-Augen-Prinzip, warum Banken eigene Grenzen setzen | R7 |
| Layering / Durchlauf | Geld über mehrere Konten und Länder, Gebühren als Tarnung | R8 |
| IBAN | Aufbau: Ländercode, **zwei Prüfziffern**, Kontokennung; Beispiel mit einer erfundenen Muster-IBAN | R8 |
| Briefkastenfirma | Sitz ohne Geschäftsbetrieb, Merkmale | R7, R9 |
| Holding / Zwischenholding | wer wem gehört, Beteiligungskette | R9 |
| Trust / Treuhand | Treugeber, Treuhänder, Begünstigter | R9 |
| Nominee | Strohmann-Anteilseigner bzw. -Direktor | R9 |
| Stiftung (Liechtenstein) | Stifter, Begünstigte, **Protektor** | R9 |
| Wirtschaftlich Berechtigter | wer am Ende kontrolliert bzw. profitiert | R9 |
| Transparenzregister / Handelsregister | was dort steht, Registernummern, Abfrage | R6, R9 |
| Umfirmierung | Firmenname geändert, alte Rechnungen ungültig | R10 |
| Rechnungsprüfung | Pflichtangaben, Abgleich mit Buchung | R10 |
| USt-IdNr. | Aufbau je Land (z. B. DE + 9 Ziffern, LU + 8 Ziffern, MT + 8 Ziffern, CY + 8 Ziffern + Buchstabe) | R10 |
| Dividende / Ausschüttung | warum sie das Ende einer Kette ist | R8 |
| Feiertage im Zahlungsverkehr | Bankarbeitstage, automatisierte Aufträge | N5 |

**Handel, Embargo, Schifffahrt**

| Artikel | Erklärt | gebraucht für |
|---|---|---|
| Embargo | Handelsverbot gegen ein Land oder für bestimmte Waren; wie man eine Embargoliste liest | N6 |
| Sanktionsliste | Personen- und Warenlisten, Codes | N6 |
| Warennummer / HS-Code | Aufbau der Zolltarifnummer (Kapitel, Position), wie man sie mit einer Liste abgleicht; Beispiel mit neutraler Ware | N6 |
| Dual-Use-Güter | zivil und militärisch nutzbar | N6 |
| Konnossement / Frachtpapier | was drinsteht, warum fehlende Papiere auffallen | R7, N6 |
| AIS / Schiffsposition | wie man Liegezeiten abliest | N6 |
| Liegeplatz | Hafenbegriffe | R1, N6 |

**Organisation und Personen**

| Artikel | Erklärt | gebraucht für |
|---|---|---|
| Organigramm / Berichtslinie | „berichtet an“, von unten nach oben lesen | R11 |
| Deckname | warum Netzwerke Decknamen nutzen | R11 |
| Aufsichtsrat | Rolle, Vorsitz, Sitzungen | R12 |
| Sitzungsprotokoll | Teilnehmerliste, Unterbrechungen, Vermerke | R12 |
| Audio-Metadaten | Aufnahmezeit vs. Dateidatum | R12 |
| Dokumentenfälschung erkennen | unmögliche Daten, Formatfehler, Widersprüche zwischen Dokumenten | R6 |

### Regeln für die Artikel

1. **Neutrale Beispiele:** Beispiele nutzen eigene, erfundene Daten (z. B. „Muster GmbH“, `DE00 1234 …`), nie Werte aus dem Fall.
2. **Methode statt Antwort:** Ein Artikel erklärt, *wie* man vorgeht, nicht *was* herauskommt.
3. **Kurz:** höchstens 200 Wörter je Artikel. Tiefer geht es über „Siehe auch“.
4. **Fachlich korrekt:** Rechtliche Aussagen (z. B. § 43 GwG) stimmen mit der Quelle überein. Fiktive Elemente (Republik Kaskarien, Embargo-Code K-3) sind im Artikel als „Beispiel“ bzw. in der Spielwelt als fiktiv erkennbar.
5. **Abdeckung:** Jeder Begriff unter „Recherche“ bei einem Rätsel hat einen Artikel (wird vom Prüfskript kontrolliert).
6. **Spielwelt:** Die Suchmaschine ist Teil der Fiktion („Firmeneigene Wissensdatenbank der Kanzlei Aris & Lund“). Es gibt keine echten Webseiten und keine externen Links.
