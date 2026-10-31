# HOTEL NOCTURNE – Rätseldesign

**Stand:** Entwurf 2 · Korrekturen aus der Durchsicht eingearbeitet, Entscheidungen getroffen (siehe Abschnitt 8)
**Ziel:** ca. 105 Minuten im ersten Durchlauf · 21 Rätsel plus Raumübergänge · 7 Räume mit je 4 Blickrichtungen

> **Spoiler-Warnung:** Dieses Dokument enthält alle Lösungen. Nicht an die Person weitergeben, die das Spiel spielen soll.

---

## 1. Die Geschichte in einem Absatz

Am **14. Oktober 2009** dringt bei einem Unwetter Wasser in den Keller, um **23:17 Uhr** fällt der Strom aus. Der Haupteingang ist nicht mehr sicher. Nachtmanager **Elias Voss** startet den Notstrom und evakuiert die **sechs Gäste** über den **westlichen Servicetunnel** und **Tor W2** in den Innenhof (**23:24 Uhr**). Diesen Tunnel hatte Eigentümer **Viktor Lehn** aus Kostengründen auf dem Papier „stillgelegt“, also Wartungsprotokolle gefälscht. Unter den Gästen ist Elias’ Tochter **Mara Voss**, eingecheckt als **M. Vale** in Zimmer 217. Elias kehrt danach allein ins Büro zurück, sichert das **originale Wartungsregister** und das **Backup-Band der Kamera im Innenhof** und verschwindet. Lehn stellt ihn öffentlich als Schuldigen hin. Siebzehn Jahre später lädt **Mara** die Spielerin ins Hotel ein, damit endlich jemand von außen die Wahrheit rekonstruiert und ihren Vater entlastet. Die handschriftlichen Zeilen auf der Reservierung („Vertrauen Sie nicht den offiziellen Aufzeichnungen. – Elias Voss“) stammen aus einem Brief, den Elias 2009 zurückgelassen hat; Mara hat sie abgeschrieben. Die Nachrichten der „unbekannten Nummer“ kommen von ihr und werden im Laufe des Spiels immer persönlicher. Erst ganz am Ende nennt sie ihren Namen.

**Festlegungen zur Welt:**
- **Mara** wurde 1991 geboren: 2009 ist sie 18 (Schal zum achtzehnten Geburtstag), heute 35.
- **Höhenlage:** Der westliche Servicetunnel beginnt im **Westflügel auf Erdgeschosshöhe** und führt über eine Rampe hinaus zu Tor W2. Das Untergeschoss (Gepäcklager, Technik) liegt tiefer und stand in jener Nacht kniehoch unter Wasser. Deshalb war der Westgang der einzige sichere Weg.

**Maras Beweggrund (trägt die ganze Geschichte):** Beweise, die Elias’ Tochter findet, würde jedes Gericht als gefälscht abtun. Mara braucht eine **unabhängige Zeugin** – deshalb hat sie die Spielerin eingeladen. Sie geht ihr voraus, öffnet Wege und legt Dinge bereit (Schritte hinter der Gepäckklappe, das Blatt in Zimmer 217, die warme Lampe im Archiv, das aufgeschlagene Protokollbuch, die Kratzspuren an Fach W: sie hat nur geprüft, ob es noch verschlossen ist), **verändert, entfernt oder erschafft aber nie ein Beweisstück** – sie darf Dinge nur sichtbar bereitlegen (eine Tür öffnen, eine Lampe einschalten, ein Buch aufschlagen), damit die Spielerin sie selbst untersucht. So bleibt sie glaubwürdig. Im Finale spricht sie das aus.

**Begriffe – überall gleich verwenden:**
- **Westlicher Servicetunnel** – der Fluchtweg unter dem Westflügel. In Elias’ Briefen heißt er kurz **„Westgang“**; beides meint dasselbe.
- **Tor W2** – das äußere Tor am Ende dieses Tunnels.
- **Innenhof** – das Ziel der Evakuierung, von Kamera 3 überwacht.

**Leitgedanke für das Design:** Elias hat die Beweise *für Mara* versteckt. Seine Verstecke folgen Dingen, die nur sie beide kannten. Deshalb tauchen Familienspuren (Schirm „E.V.“, „Für M.“, Schal, „Wer nachts wacht“) immer wieder auf.

---

## 2. Weg durch das Hotel

```text
             ┌──────────────┐  Aufzug (Schlüssel 217)  ┌──────────────┐
             │ 1 REZEPTION  │ ───────────────────────▶ │ 2 ZIMMER 217 │
             └──────┬───────┘ ◀─────────────────────── └──────────────┘
                    │ Tür „Personal“ (Personalschlüssel aus Zimmer 217)
          ┌─────────┴──────────┐
          ▼ Treppe UG          ▼ Flur EG
   ┌──────────────┐  Archivschlüssel  ┌──────────────┐
   │3 GEPÄCKLAGER │ ────────────────▶ │ 4 ARCHIV     │
   └──────────────┘                   └──────┬───────┘
                                             │ PIN 1897
                                     ┌───────┴────────┐
                                     │5 ÜBERWACHUNG   │ (UG)
                                     └───────┬────────┘
                                             │ Türfreigabe „Technik“
                                     ┌───────┴────────┐
                                     │ 6 KELLER       │ (UG, dunkel)
                                     └───────┬────────┘
                                             │ verborgene Tür hinter dem Wäscheschrank
                                     ┌───────┴────────┐
                                     │ 7 MANAGERBÜRO  │ (Westflügel)
                                     └───────┬────────┘
                                             ▼ Tor W2 → hinaus in den Innenhof = ENDE
```

Neu gegenüber dem bisherigen Stand: Man kehrt nach Zimmer 217 **zurück in die Rezeption** und öffnet dort die schon bekannte Tür „Personal“. So wird das Hotel als zusammenhängender Ort erlebbar statt als Kette einzelner Seiten.

**Freigeschaltet ≠ besucht** *(in der Engine bereits umgesetzt)*: Ein Raum gilt als *freigeschaltet*, sobald die Rätsel davor gelöst sind. Betreten kann man ihn trotzdem nur auf dem vorgesehenen Weg (Aufzug, Tür, Gang). Die Karten-App erlaubt Schnellreise **nur in bereits besuchte Räume**; freigeschaltete zeigt sie als „Weg noch finden“. Die Tür „Personal“ wird ein eigener Schlüssel-Übergang mit dem Gegenstand **Personalschlüssel**.

---

## 3. Fäden, die durch mehrere Räume laufen

Diese Verbindungen sind das Herz des Designs. Jede Zeile ist eine Information oder ein Gegenstand, der in einem Raum gefunden und in einem späteren gebraucht wird.

| Gefunden in | Was | Gebraucht in | Wofür |
|---|---|---|---|
| 1 Rezeption | **Schlüssel 217** | 1 Rezeption | Aufzug |
| 1 Rezeption | **Schraubendreher** | 1 Rezeption, **6 Keller** | Abdeckung am Aufzug · Wäscheschrank abschrauben |
| 1 Rezeption | **Taschenlampe** (Telefon) | 1, **2**, **5**, **6** | dunkle Ecke · unter dem Bett · unter dem Pult · ganzer Keller |
| 1 Rezeption | **Gästeregister** (Check-in-Zeiten) | **3 Gepäcklager** | Ankunftsreihenfolge der Koffer |
| 1 Rezeption | **Personalfoto, Rückseite** („Elias Voss (Nacht)“) | **2 Zimmer 217** | Buchstabenschloss ELIAS |
| 1 Rezeption | **„SEIT 1897“** (Reservierung) | **4 Archiv** | PIN des Sicherheitsraums |
| 1 Rezeption | **Hotelplan 2009** („Tunnel dauerhaft verschlossen“) | **4 Archiv**, **7 Büro** | Widerspruch zu den echten Unterlagen |
| 1 Rezeption | **Zeitungsartikel** (Lehn: „Dort gibt es keinen Ausgang“) | **7 Büro** | Frage „Wer hat gelogen?“ |
| 2 Zimmer 217 | **Foto von Mara**, Rückseite | 2 Zimmer 217 | Buchstabenschloss ELIAS |
| 2 Zimmer 217 | **Personalschlüssel** | 1 Rezeption | Tür „Personal“ |
| 2 Zimmer 217 | **Gepäckschein Nr. 6** | **3 Gepäcklager** | Maras Koffer ausgeben lassen |
| 2 Zimmer 217 | Blitz zeigt **Tor in der Westmauer** (Beobachtung) | **7 Büro** | Ahnung, wo der Ausgang ist |
| 3 Gepäcklager | **Archivschlüssel** | 4 Archiv | Archivtür |
| 3 Gepäcklager | **Zerrissene Notiz** von Elias („Band Kamera 3 → Archiv, Fach W“ · „Ich bin erst zurück, als alle draußen waren“) | **4**, **5** | Versteck des Backup-Bands · Reihenfolge der Aufnahmen |
| 4 Archiv | **Echtes Prüfprotokoll** von Tomasz (Schaltfolge C–A–D–B) | **6 Keller** | richtige Schalterreihenfolge |
| 4 Archiv | **Backup-Band Kamera 3** | **5 Überwachung** | fehlende Aufnahme „Innenhof 23:24“ |
| 4 Archiv | **PIN 1897** (Personalakte Tomasz) | 5 Überwachung | Tür des Sicherheitsraums |
| 5 Überwachung | **Ersatzsicherung 30 A** | **6 Keller** | Generator anschließen |
| 5 Überwachung | **23:24** (Zeitstempel Innenhof) | **7 Büro** | Fallbericht · Code von Tor W2 |
| alle | **Akte** | **7 Büro** | Fallbericht als Finale |

---

## 4. Die Räume im Einzelnen

Für jeden Raum: Blickrichtungen, Rätselkette, Lösungen, drei Hinweisstufen, Belohnung und geschätzte Zeit. Zusätzlich hat jeder Raum 3–6 untersuchbare Dinge ohne Rätselfunktion (Atmosphäre, Hintergrund, falsche Fährten).

### Raum 1 – Rezeption · *fertig* · ca. 13 Min.

Bleibt wie gebaut. Einzige Ergänzung: Die Tür „Personal“ (Osten) bekommt später einen Schlüssel-Hotspot (Personalschlüssel aus Raum 2).

| # | Rätsel | Art | Lösung |
|---|---|---|---|
| 1 | Gästeregister lesen → gültige Buchung für Zimmer 217 | Dokument / Logik | **2117** am Schlüsselkasten |
| 2 | Hinweis „Licht mitbringen“ → dunkle Ecke unter der Treppe | Suche | Schraubendreher |
| 3 | Messingabdeckung am Aufzug | Mechanik | Schraubendreher benutzen |
| 4 | Schlüsselschalter | Mechanik | Schlüssel 217 benutzen |

---

### Raum 2 – Zimmer 217 · 2. Etage · *gebaut* · ca. 14 Min.

**Was die Spielerin erfährt:** Hier wohnte jemand, den Elias liebte. „M. Vale“ ist nicht der echte Name.

**Blickrichtungen**
- **Nord · Zimmertür:** Tür zum Flur (Rückweg zum Aufzug), Garderobe, Spiegel mit einem alten, an den Rahmen gebundenen Schlüssel.
- **Ost · Bett:** Bett mit Tagesdecke, Nachttisch mit Sanduhr und Brief, darunter tiefe Dunkelheit.
- **Süd · Fenster:** Regen, Innenhof. Bei Blitzen wird kurz ein Tor in der Westmauer sichtbar.
- **West · Schreibtisch und Schrank:** Schreibtisch mit Kerzenständer, Kommode mit Ziffernschloss und Porträtfoto, Kleiderschrank mit Buchstabenschloss.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 5 | **Die Anordnung** | Suche + Logik | Brief auf dem Nachttisch: „Zuerst das, was die Zeit festhält. Danach das, was Licht spendet. Anschließend das, was Türen öffnet. Zuletzt das, was Erinnerungen bewahrt.“ Die vier Gegenstände stehen in **drei verschiedenen Blickrichtungen**. Ihre Zahlen sieht man erst, wenn man jeden Gegenstand einzeln untersucht und anhebt (Sanduhr 4, Kerzenständer 1, Schlüssel am Spiegel 7, Porträtfoto 3). | **4173** → Kommode |
| 6 | **Wer nachts wacht** | Dokumente kombinieren | Kommode enthält *Brief an Mara* und *Foto von Mara* (Rückseite: „Mara – 14.10.2009. Wer nachts wacht, passt auf dich auf.“). Der Kleiderschrank hat ein **Buchstabenschloss mit 5 Rädern**. Lösung über die Rückseite des Personalfotos aus Raum 1: „Elias Voss (**Nacht**)“. | **ELIAS** → Kleiderschrank |
| 7 | **Unter dem Bett** | Suche (Taschenlampe) | Mit Licht unter dem Bett: ein **Gepäckschein Nr. 6**, mit Klebeband unter den Lattenrost geklebt. Daneben ins Holz geritzt: „UG“. | Gepäckschein Nr. 6 |

**Belohnung im Kleiderschrank:** Elias’ Schlüsselbund mit dem **Personalschlüssel** und einer Nachricht: „Wenn du das findest, nimm die Treppe, nicht den Aufzug. – Papa“
**Übergang:** Mit dem Aufzug zurück in die Rezeption, mit dem Personalschlüssel die Tür „Personal“ öffnen → Treppe ins UG.
**Telefon-Nachricht nach Rätsel 6:** „Vor Gästen durfte ich ihn nie ‚Papa‘ nennen. Er meinte, das gehöre sich nicht für einen Nachtmanager.“ *(Erster Hinweis, dass die Absenderin seine Tochter ist.)*

**Hinweise**
- *5:* (1) Der Brief beschreibt vier Dinge, die irgendwo im Zimmer stehen. Sieh dich in alle Richtungen um. (2) Die Zahlen stehen auf der Unterseite. Zeit = Sanduhr, Licht = Kerzenständer, Türen = Schlüssel am Spiegel, Erinnerungen = Porträtfoto. (3) 4 – 1 – 7 – 3.
- *6:* (1) „Wer nachts wacht“ – wer hatte in diesem Hotel nachts Dienst? (2) Auf der Rückseite des Personalfotos aus der Rezeption steht, wer Nachtdienst hatte. Es ist in deiner Akte. (3) ELIAS.
- *7:* (1) Ein Teil dieses Zimmers liegt völlig im Dunkeln. (2) Leuchte mit der Taschenlampe unter das Bett (Osten). (3) Unter dem Lattenrost klebt ein Gepäckschein – tippe ihn an.

---

### Raum 3 – Gepäcklager · Untergeschoss · *gebaut (Stand 1.1)* · ca. 14 Min.

**Was die Spielerin erfährt:** M. Vale war **Mara Voss**, Elias’ Tochter. Elias hat nach der Evakuierung Beweise gesichert (Band Kamera 3 → Archiv, Fach W).

**Gepäcklogik:** Die Anhängernummern sind zugleich die Gepäckscheinnummern. Im Regal stehen drei Wertgepäckstücke (Schachfigur 2, Notenblatt 9, Kompass 4); das vierte, **Nr. 6 mit dem blauen Schal**, ist Maras Koffer und kommt erst gegen den Gepäckschein aus der Ausgabeklappe.

**Blickrichtungen**
- **Nord · Treppe:** nasse Treppe zurück zur Rezeption, auf dem Absatz die Milchglastür **ARCHIV**, flackernde Notbeleuchtung („Notstromkreis W · geprüft 09/2009“).
- **Ost · Regale:** drei Koffer mit Gegenstand und Messinganhänger, tropfendes Rohr über einem Eimer.
- **Süd · Ausgabe:** Stahlklappe „Ausgabe nur gegen Gepäckschein“ mit Schlitz, Tischklingel, beschädigtes Verzeichnis, Papierkorb.
- **West · Gitterkäfig:** Käfig „Wertgepäck“ mit Truhe („In der Reihenfolge, in der sie ankamen.“).

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 8 | **Gepäckausgabe** | Mechanik | Gepäckschein Nr. 6 am Schlitz benutzen (Schein wird verbraucht). Erst ein Klicken, nach zwei Sekunden Rumpeln: Die Klappe hebt sich, Maras Koffer rollt heraus, hinter der Wand entfernen sich Schritte. Im Koffer: **Käfigschlüssel**, Maras Notizbuch (Geheimnis). | Gepäckschein benutzen |
| – | *Übergang: Käfig* | Mechanik | Käfigschlüssel an der Käfigtür. | – |
| 9 | **Ankunftsreihenfolge** | Logik + Raum 1 | Verzeichnis: *„Nur vier Stücke eingelagert. Die übrigen Gäste haben ihre Koffer vor der Evakuierung zurückerhalten.“* · Schachfigur → zuerst angekommen · Notenblatt → Zimmer 214 · Kompass → zuletzt angekommen. Die Zeiten stehen nur im Gästeregister (Raum 1). Rückmeldungen für 2469 (Anhängernummern), 2964 (Zimmernummern), 4962 (umgekehrt). | **2694** → Originales Gepäckverzeichnis („M. Vale – tatsächlicher Name: Mara Voss“) + **Archivschlüssel** |
| 10 | **Elias’ Notiz** | Sortieren | Fünf Papierstreifen ziehen oder mit ▲/▼ ordnen; die Risskanten passen nur in einer Reihenfolge. | „Band Kamera 3 gesichert. / Liegt im Archiv, Fach W. / Lehn darf es nie finden. / Ich bin erst zurück, als alle draußen waren. / – E.“ |
| – | *Übergang: Archivtür* | Mechanik | Archivschlüssel an der Milchglastür (Nord). Die Tür schaltet das Archiv selbst frei – keine Sackgasse, falls die Notiz noch fehlt. Der Raum gilt erst als abgeschlossen, wenn Truhe, Notiz und Tür gelöst sind. | – |

**Nachrichten (Mara, ohne Namen):** nach der Ausgabe *„Den Schal hat er mir zum achtzehnten Geburtstag geschenkt. Ich habe ihn in jener Nacht hier zurückgelassen.“* · nach der Truhe *„Du hast gefunden, was im Register fehlte. Ein Name kann aus einer Akte verschwinden. Aus einer Erinnerung nicht.“*

**Ereignis:** Nach der Truhe rutscht beim nächsten Blick nach Osten der schwarze Koffer vom Regal; dahinter erscheint die Marke *„14.10.2009 · 23:10 – Wasserstand Kniehöhe“* (sieben Minuten vor dem Stromausfall).

**Geheimnis:** Maras Notizbuch: *„Papa sagt, das Hotel hat mehr Türen, als auf dem Plan stehen. Er sagt, ich soll mir merken, welche davon wirklich nach draußen führen.“*

**Klang:** Raumgeräusch Tropfen und Rohrbrummen; Effekte Rumpeln, entfernte Schritte, Gitter, Truhe, Papier.

### Raum 4 – Hotelarchiv · Erdgeschoss · *gebaut* · ca. 15 Min.

**Was die Spielerin erfährt:** Der Westgang war nie stillgelegt. Viktor Lehn hat die Stilllegung nur auf dem Papier angeordnet und ein Prüfprotokoll gefälscht. Tomasz hat die Wahrheit dokumentiert, Elias hat das Band von Kamera 3 versteckt.

**Stimmung:** Trocken und still – der erste Raum ohne Regen. Die Leselampe brennt bereits, ihr Schirm ist noch warm.

**Blickrichtungen**
- **Nord · Eingang:** Milchglastür (anfangs offen) zum Gepäcklager, Wandregal mit Jahresordnern 2001–2009 (2009 auffallend dünn), darin das **Protokollbuch 2009**, ein leerer Lesetisch.
- **Ost · Schreibtisch:** Leselampe, Schreibmaschine („Hiermit kündige ich zum –“), Brief von Tomasz, **Chiffrierscheibe**, Schreibtischfach mit acht Buchstabenrädern („Wohin?“).
- **Süd · Aktenschrank:** 26 Schubladen A–Z, **W** klemmt (frische Kratzspuren), Karton „Personal 2009“, quer darauf die Akte „Voss, E.“.
- **West · Planschrank:** Protokolle A und B, abgeschlossene untere Planschublade, Stahltür „Sicherheitsbereich UG“ mit PIN-Feld.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 11a | **Chiffrierscheibe** | Werkzeug | Außen Geheimtext, innen Klartext; inneren Ring drehen, „Text prüfen“. Anzeige nur für den ersten Buchstaben (G → ?). Stellung −3: „Falsche Richtung“. | Stellung 3: DER WESTGANG IST OFFEN |
| 11b | **Schreibtischfach** | Buchstabenräder (8) | „Wohin?“ – Rückmeldungen für OFFENIST, ZHVWJDQJ, sonst „Wohin wollte Tomasz Elias führen?“ | **WESTGANG** → Bauakte Okt. 2009 (Beweis) |
| 12 | **Echt oder gefälscht** | Auswahl in zwei Stufen | ① A oder B – erst danach erscheint ② genau zwei von fünf Belegen. Rückmeldungen: B gewählt / 0 Treffer / 1 Treffer. | **A** · **Datum + Protokollnummer** → Bestandsplan 1998 (Tunnel, Rampe, Tor W2, „gegr. 1897“); Tomasz’ Protokoll wird Beweis |
| 13 | **Fach W** | Mechanik + Raum 1 und 3 | Schraubendreher an Schublade W. | Backup-Band Kamera 3 (Beweis) + Zettel „Tomasz’ alte Regel“ |
| – | *Übergang: PIN-Tür* | Code | Tomasz’ Personalakte: „PIN = Gründungsjahr des Hauses“. Die PIN funktioniert jederzeit; der Raum gilt erst mit Fach W als abgeschlossen. Rückmeldungen für 2009 und 1998. | **1897** → Raum 5 |

**Nachrichten (Mara, ohne Namen):** nach dem Schreibtischfach *„Lehn hat nach jener Nacht alles verschwinden lassen, was ihm schaden konnte. Fast alles.“* · nach Fach W *„Siebzehn Jahre. Und es lag die ganze Zeit hier.“*

**Ereignis:** Nach Rätsel 12 ist beim nächsten Blick nach Norden die Milchglastür zu, und das Protokollbuch liegt aufgeschlagen bei PR-09/117 auf dem Lesetisch. Die Tür bleibt jederzeit benutzbar.

**Geheimnis:** Elias’ Personalakte – Belobigung 2006 („alle Gäste unversehrt evakuiert“), mit Bleistift: *„Er hat es wieder getan.“*

**Klang:** fast Stille – Lampenbrummen, gelegentliches Holzknacken.

### Raum 5 – Überwachungsraum · Untergeschoss · ca. 14 Min.

**Was die Spielerin erfährt:** Der Ablauf der Nacht. Die Gäste waren um 23:24 draußen, Elias kehrte danach zurück.

**Blickrichtungen**
- **Nord · Tür:** PIN-Feld innen, Dienstplan an der Wand.
- **Ost · Monitorwand:** vier Monitore, Monitor 3 zeigt „KEIN SIGNAL“.
- **Süd · Bandarchiv und Rekorder:** Bandschacht, Regale mit leeren Hüllen. Eine Hülle trägt die Aufschrift „Kamera 3 – 14.10. – GELÖSCHT“.
- **West · Schaltpult:** Indexterminal, Türfreigaben, dunkler Platz unter dem Pult.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 14 | **Das fehlende Band** | Mechanik + Raum 4 | Backup-Band in den Rekorder einlegen → Monitor 3 zeigt den Innenhof: sechs Personen gehen durch Tor W2, **23:24**. | Band benutzen |
| 15 | **Rekonstruktion** | Logik / Zeitachse (neu) | Vier Standbilder per Ziehen in eine Zeitleiste bringen: A Lobby 23:17 (5) · B Generator, ohne Zeit (2) · C Innenhof 23:24 (8) · D Büro, Elias allein (1). Abhängigkeiten stehen in den Dokumenten: *Tor W2 öffnet nur mit Notstrom* (Prüfprotokoll, Raum 4) · *Ich bin erst zurück, als alle draußen waren* (Notiz, Raum 3). | **A → B → C → D**, ergibt den Index **5281** für Datei 5 |
| 16 | **Datei 5** | Suche (Taschenlampe) | Datei 5 zeigt Elias mit dem Wartungsregister; er blickt in die Kamera: „Der Keller ist der Schlüssel. Nicht die Tür, die Sie sehen. Die Tür, die Sie niemals sehen sollten.“ Danach entriegelt das Pult die Tür „Technik“. Unter dem Pult (dunkel) liegt eine **Ersatzsicherung 30 A**. | Sicherung mitnehmen |

**Übergang:** Tür „Technik“ ist jetzt offen → Keller.

**Hinweise**
- *14:* (1) Ein Monitor hat kein Bild. Du trägst etwas, das das ändern könnte. (2) Das Band aus Fach W gehört in den Rekorder (Süden). (3) Benutze das Backup-Band am Rekorder.
- *15:* (1) Zwei Dokumente aus früheren Räumen verraten die Reihenfolge. (2) Ohne Notstrom öffnet sich das Tor nicht. Elias kam erst zurück, als alle draußen waren. (3) A → B → C → D.
- *16:* (1) Das Pult hat die Tür zum Keller freigegeben – aber du brauchst dort unten noch etwas. (2) Unter dem Pult ist es dunkel. (3) Leuchte unter das Pult (Westen) und nimm die Sicherung.

---

### Raum 6 – Keller / Technik · Untergeschoss · ca. 16 Min.

**Was die Spielerin erfährt:** Der Fluchtweg war die ganze Zeit da.

**Besonderheit:** Der ganze Raum ist dunkel. Die Taschenlampe ist Pflicht, bis der Notstrom läuft; danach wird es heller. Wasser tropft, der Generator brummt erst nach dem Start.

**Blickrichtungen**
- **Nord · Treppe und Wasser:** knöcheltiefes Wasser, Rückweg.
- **Ost · Generator:** Generator mit leerem Sicherungsfach, wasserfleckige Startanleitung.
- **Süd · Schalttafel:** vier große Hebelschalter A, B, C, D. Daneben der **Wandplan**, den Lehn hat aufhängen lassen: „A → B → C → D · Tor W2: stillgelegt“.
- **West · Wäscheschrank:** schwerer Wäscheschrank, mit vier Schrauben an der Wand befestigt. Dahinter weht ein Luftzug.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 17 | **Generator** | Mechanik + Suche | Sicherung einsetzen, dann die Startanleitung befolgen: (1) Kraftstoffhahn auf · (2) Choke ziehen · (3) Zündung · (4) Starter. Schritte 2 und 3 sind nur mit Licht lesbar. Falsche Reihenfolge: der Motor hustet und geht aus. | Sicherung + Reihenfolge Hahn – Choke – Zündung – Starter |
| 18 | **Der Plan lügt** | Mechanik + Raum 4 | Der Wandplan (A–B–C–D) ist falsch. Die richtige Schaltfolge steht in Tomasz’ echtem Prüfprotokoll: **C – A – D – B**. Die Hebel müssen in dieser Reihenfolge umgelegt werden (Kennziffern auf den Hebeln: C 3, A 1, D 4, B 2). Bei einem Fehler springen alle zurück. | **C → A → D → B** (3-1-4-2) |
| 19 | **Die Tür, die niemand sehen sollte** | Mechanik + Raum 1 | Notstrom an, das Licht flackert hoch. Am Wäscheschrank sind jetzt vier Schrauben sichtbar → mit dem **Schraubendreher aus der Rezeption** lösen → Schrank zur Seite schieben → schmale Tür: „Nur wer die Vergangenheit versteht, darf eintreten.“ | Schraubendreher benutzen |

**Übergang:** Durch die Tür, einen schmalen Gang hinauf → Westflügel, Managerbüro.

**Hinweise**
- *17:* (1) Der Generator braucht zuerst ein fehlendes Teil. (2) Setze die Sicherung aus dem Überwachungsraum ein und lies die Startanleitung mit Licht. (3) Kraftstoffhahn – Choke – Zündung – Starter.
- *18:* (1) Elias hat gesagt: Vertrauen Sie nicht den offiziellen Aufzeichnungen. (2) Das echte Prüfprotokoll aus dem Archiv nennt eine andere Reihenfolge. (3) C – A – D – B.
- *19:* (1) „Nicht die Tür, die Sie sehen.“ Was steht hier, das nicht hierher gehört? (2) Der Wäscheschrank ist an die Wand geschraubt. (3) Benutze den Schraubendreher am Wäscheschrank (Westen).

---

### Raum 7 – Managerbüro · Westflügel · ca. 14 Min.

**Was die Spielerin erfährt:** Die ganze Wahrheit. Und sie verlässt das Hotel auf demselben Weg wie die sechs Gäste.

**Blickrichtungen**
- **Nord · Schreibtisch:** Brief von Elias, Tischkalender, aufgeschlagen beim 14.10.2009.
- **Ost · Bücherregal:** eine auffällige Lücke, in der ein dickes Buch fehlt.
- **Süd · Tresor:** Tresor mit Formular „Abschlussbericht“.
- **West · Fenster zum Innenhof:** draußen Tor W2, daneben ein Ziffernfeld.

| # | Rätsel | Art | Ablauf | Lösung |
|---|---|---|---|---|
| 20 | **Abschlussbericht** | Meta-Rätsel | Der Tresor öffnet sich erst, wenn der Fall vollständig rekonstruiert ist. Fünf Fragen, Antworten aus der Akte (Auswahl oder Eingabe): ① Über welchen Ausgang wurden die Gäste evakuiert? ② Wie viele Gäste? ③ Wer blieb zurück? ④ Um wie viel Uhr waren sie draußen? ⑤ **Wer hat die Unterlagen gefälscht?** Bei Fehlern sagt der Tresor nur, *wie viele* Antworten stimmen. | **Westgang · 6 · Elias Voss · 23:24 · Viktor Lehn** |
| 21 | **Tor W2** | Abschluss | Im Tresor: das **originale Wartungsregister** und Elias’ letzter Brief. Das Tor im Hof hat ein Ziffernfeld. Elias’ Brief endet mit: „Das Tor merkt sich die Minute, in der alle draußen waren.“ | **2324** → Tor öffnet sich → Abspann |

**Hinweise**
- *20:* (1) Alles, was du brauchst, liegt in deiner Akte. (2) Prüfprotokoll, Gepäckverzeichnis, Kameraaufnahme und Bauakte beantworten je eine Frage. (3) Westgang · 6 · Elias Voss · 23:24 · Viktor Lehn.
- *21:* (1) Lies den letzten Satz von Elias’ Brief noch einmal. (2) Welche Minute zeigte die Kamera im Innenhof? (3) 2324.

**Finale (in Ruhe, nicht sofort Abspann):**
1. Tor W2 öffnet sich langsam, Kamerafahrt in den Innenhof.
2. Der Regen lässt nach, die Musik wird leiser und wärmer, ein letzter Donner weit weg.
3. Das Telefon vibriert. Letzte Nachricht: *„Du hast die Wahrheit gefunden. Mein Name ist Mara Voss. M. Vale war nie mein richtiger Name. Danke, dass du meinem Vater geglaubt hast.“*
4. „Case closed“ mit Spielzeit und genutzten Hinweisen.
5. Persönliche Abschlussseite: Brief (Pflicht, `config.js`), dazu **optional** eine Sprachnachricht und ein Foto. Ohne Medien funktioniert das Ende vollständig.

---

## 5. Rätselmix und Zeitplan

| Art | Anzahl | Rätsel |
|---|---|---|
| Logik und Zuordnung | 4 | 1, 5, 9, 15 |
| Codes und Schlösser | 3 | 6, 11, 21 |
| Dokumentenanalyse | 2 | 12, 13 |
| Mechanik und Gegenstände | 7 | 3, 4, 8, 14, 17, 18, 19 |
| Beobachtung und Suche | 4 | 2, 7, 10, 16 |
| Meta-Rätsel (alle Beweise) | 1 | 20 |
| **Gesamt** | **21** | |

*(Viele Rätsel verbinden zwei Arten – etwa Mechanik mit Informationen aus einem früheren Raum. Gezählt ist jeweils der Schwerpunkt.)*

| Abschnitt | Minuten |
|---|---|
| Einführung | 3 |
| 1 Rezeption | 13 |
| 2 Zimmer 217 | 14 |
| 3 Gepäcklager | 14 |
| 4 Archiv | 14 |
| 5 Überwachung | 14 |
| 6 Keller | 16 |
| 7 Managerbüro | 14 |
| Finale | 3 |
| **Gesamt** | **≈ 105** |

Die Zeiten sind Schätzungen. Messen lässt sich das erst mit Testspielern – am besten schon nach Raum 2.

---

## 6. Was die Engine dafür zusätzlich können muss

| Erweiterung | Für Rätsel | Aufwand |
|---|---|---|
| Gegenstände in der Szene anheben → Zahl auf der Unterseite | 5 | klein |
| Buchstabenschloss mit drehbaren Rädern | 6 | klein |
| Tür mit Schlüssel öffnen und danach durchgehen (ein Hotspot) | Übergänge | klein |
| Blitz macht für einen Moment etwas sichtbar | Raum 2 (Beobachtung) | klein |
| Puzzle „Schnipsel zusammensetzen“ (Ziehen) | 10 | mittel |
| Chiffrierscheibe (drehbar, Live-Vorschau) | 11 | mittel |
| Auswahlfrage, auch mit Mehrfachauswahl („Welche zwei Belege …?“) | 12, 20 | klein |
| Zeitleiste mit verschiebbaren Standbildern | 15 | mittel |
| Reihenfolge-Mechanik (Hebel, Generatorschritte) mit Zurückspringen bei Fehlern | 17, 18 | mittel |
| Raum dauerhaft dunkel, bis ein Ereignis ihn erhellt | Raum 6 | klein |
| Abspann-Sequenz durch Tor W2 mit letzter Nachricht | 21 | klein |
| Tür-Übergang mit Schlüssel (Personalschlüssel, Archivschlüssel) | Übergänge | klein |
| Zähler für optionale Geheimnisse | alle | klein |
| Persönliches Ende mit optionaler Sprachnachricht und Foto (`config.js`) | Finale | klein |
| Beweisübersicht als erste Seite der Akte | 20 | klein |

**Grundsatz:** Jede Mechanik wird als wiederverwendbarer Baustein gebaut (Buchstabenräder, Auswahlfrage, Schnipsel, Zeitleiste, Schalterfolge) und in den Raumdaten nur noch konfiguriert. Keine Sonderprogrammierung pro Raum.

---

## 7. Klang

Aufbauend auf dem, was schon läuft:

- **Musik:** „Shadowed Loop“ bleibt das durchgehende Thema. An Schlüsselmomenten (Rätsel 6, 14, 19, Finale) kommen kurze Klangakzente dazu, im Finale wird es ruhiger.
- **Raumgeräusche** (neue Ebene, je Raum eine Schleife): Rezeption Regen und Uhr · Zimmer 217 Fensterklappern und Dielen · Gepäcklager Rohre und Tropfen · Archiv Brummen und Papier · Überwachung Rauschen und Monitorbrummen · Keller Wasser, später Generator · Büro Wind und Stille.
- **Effekte:** wie bisher, später Schritt für Schritt durch Aufnahmen ersetzt.
- **Einstellungen:** drei getrennte Lautstärkeregler (Musik, Raumgeräusche, Effekte) statt der heutigen zwei Ein/Aus-Schalter.
- **Tonaufnahmen als Hinweise:** Elias’ Aufnahmen (Anrufbeantworter, Datei 5 im Überwachungsraum) können als echte Sprachaufnahmen eingebunden werden. **Jede Aufnahme hat ein Transkript**, kein Rätsel hängt nur am Hören. Ohne Aufnahme bleibt das Transkript allein bestehen.
- **Quellen:** selbst aufgenommen, CC0 (z. B. Freesound) oder ausdrücklich lizenziert. Die Herkunft wird in `assets/audio/QUELLEN.md` dokumentiert.

---

## 8. Optionale Geheimnisse und Ereignisse

**Optionale Geheimnisse** – nicht nötig für den Fortschritt, aber belohnt im Menü („Geheimnisse 4 / 9“) und mit einem zusätzlichen Satz im Abspann:

| Raum | Geheimnis |
|---|---|
| 1 Rezeption | Ältere Seite im Gästeregister: Kinderzeichnung des Hotels, signiert „M., 9 Jahre“ |
| 2 Zimmer 217 | Kinokarte vom 14.10.2009, 19:30 Uhr, in der Manteltasche an der Garderobe |
| 3 Gepäcklager | Maras Notizbuch: „Papa sagt, das Hotel hat mehr Türen, als auf dem Plan stehen.“ |
| 4 Archiv | Personalakte Elias Voss: Belobigung „für besonnenes Handeln bei Brandalarm 2006“ |
| 5 Überwachung | Dienstplan 14.10., Elias’ Handschrift am Rand: „M. kommt heute. Zimmer 217 freihalten.“ |
| 6 Keller | Ins Rohr geritzt: „T. + E. – 1999 – hier unten hört uns keiner“ (Tomasz und Elias) |
| 7 Büro | Foto in der Schreibtischschublade: Elias und Mara vor Tor W2, Sommer 2005 |

**Unerklärte Ereignisse** – sparsam, ohne Schreckeffekte, alle später durch Mara erklärbar (sie ist im Hotel und geht der Spielerin voraus):

| Raum | Ereignis | Erklärung am Ende |
|---|---|---|
| 2 Zimmer 217 | Beim Blitz schlägt das Fenster auf. Danach liegt ein trockenes Blatt auf dem Schreibtisch. | Mara hat das Blatt hineingelegt. |
| 3 Gepäcklager | Ein Koffer, der vorher oben stand, steht beim Zurückdrehen auf dem Boden. | Mara war kurz vorher dort. |
| 5 Überwachung | Monitor 2 zeigt für zwei Sekunden eine Person in der Lobby – live, nicht 2009. | Das war Mara. |
| 6 Keller | Nach dem Generatorstart geht das Licht einmal aus und wieder an; eine Tür fällt irgendwo ins Schloss. | Mara verlässt den Keller vor der Spielerin. |

## 9. Entscheidungen (aus der Durchsicht)

1. **Absenderin der Nachrichten:** **Mara Voss.** Anfangs sachlich, dann persönlicher (Raum 2: „Vor Gästen durfte ich ihn nie ‚Papa‘ nennen …“), Namensnennung erst im Finale.
2. **Rätsel 12:** Der 31. September bleibt, ist aber nur noch einer von zwei nötigen Belegen. Der zweite ist die Protokollnummer.
3. **Persönliches Ende:** Brief als fester Bestandteil, Sprachnachricht und Foto optional.
4. **Baureihenfolge:** Zimmer 217 → Testlauf → Gepäcklager und Archiv → Überwachung und Keller → Büro → Sounddesign → Gesamttest.

## 10. Änderungen gegenüber Entwurf 1

- Gepäcklager: Kopfzeile erklärt, warum nur vier Gäste zählen (sonst wären Hallström und Doran früheste bzw. späteste).
- Archiv: Chiffrierscheibe liegt offen auf dem Schreibtisch statt im Fach, das sie öffnen soll.
- Archiv: Rätsel 12 mit Protokollbuch und zwei Belegen.
- Karte: Schnellreise nur in besuchte Räume (umgesetzt).
- Begriffe vereinheitlicht: Westlicher Servicetunnel („Westgang“), Tor W2, Innenhof.
- Mara als Absenderin, längeres Finale, optionale Geheimnisse, unerklärte Ereignisse, Tonaufnahmen mit Transkript, drei Lautstärkeregler.
