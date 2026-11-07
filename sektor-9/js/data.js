/*
 * SEKTOR 9 – Inhalte: Abschnitt 1 (Verteilerhalle, Kommando-Halle A), 2 (Personal-Halle B), 3 (Forschungs-Halle C),
 * 4 (Sicherheits-Halle D), 5 (Sektor 9 – Rechenkern, drei Enden)
 * Grundlage: DREHBUCH.md (Entwurf 0.2). Blickrichtungen je Standpunkt: 0 Nord, 1 Ost, 2 Süd, 3 West.
 */
window.SEKTOR9 = window.SEKTOR9 || {};
window.SEKTOR9.data = (() => {
  const halls = {
    verteiler: {
      name: "Verteilerhalle", short: "VERTEILERHALLE", pos: "c", ambient: "hum",
      stations: { mitte: { name: "Mitte", views: ["Nord · Tür B Personal", "Ost · Tür C Forschung", "Süd · Tür D Sicherheit", "West · Tür A Kommando"] } },
    },
    kommando: {
      name: "Kommando-Halle", short: "KOMMANDO A", sector: "A", pos: "w", ambient: "static", need: "handrad", lockedText: "Panzertür West – Handrad",
      onEnter: [{ echo: "ZUGANG KOMMANDO A. BEOBACHTUNG AKTIV." }],
      stations: {
        leitstand: { name: "Leitstand", view: 0, views: ["Lagetisch · Galerie", "Treppe zur Galerie", "Konsole · Ausgang", "Lagezentrum"] },
        funkstation: { name: "Funkstation", view: 0, need: "galerie", arrive: "Oben auf der Galerie, hinter Glas. Unter dir liegt der Leitstand.", views: ["Funkgeräte", "Tonbandgerät", "Blick in die Halle", "Funkuhr"] },
        lagezentrum: { name: "Lagezentrum", view: 3, need: "notstrom", arrive: "Die Leuchtstoffröhren flackern, dann bleibt das Licht.", views: ["Kassette", "Leitstand", "Kartenschrank", "Lagekarte · Lagetafel"] },
      },
    },
    personal: {
      name: "Personal-Halle", short: "PERSONAL B", sector: "B", pos: "n", ambient: "hum", need: "tuer_b", lockedText: "Panzertür Nord – Kartenleser",
      onEnter: [{ echo: "PERSONALBEREICH. 23 PROFILE GESPEICHERT. 1 NEUES PROFIL ANGELEGT." }],
      stations: {
        unterkuenfte: { name: "Unterkünfte", view: 3, views: ["Feldbetten · Wartungsklappe", "Personalarchiv · Offiziersbüro", "Ausgang · Dienstplan", "Spinde"] },
        archiv: { name: "Personalarchiv", view: 0, need: "kaefig", arrive: "Im Käfig riecht es nach Papier und kaltem Metall.", views: ["Karteischränke", "Aktentisch", "Käfigtür", "Regal"] },
        buero: { name: "Offiziersbüro", view: 0, need: "buero", arrive: "Das Büro des Kommandanten. Auf dem Schreibtisch steht noch eine Tasse.", views: ["Schreibtisch", "Schlüsselbrett", "Foto · Aktenschrank", "Glaswand"] },
      },
    },
    forschung: {
      name: "Forschungs-Halle", short: "FORSCHUNG C", sector: "C", pos: "e", ambient: "hum", need: "tuer_c", lockedText: "Panzertür Ost – Versuchsleitung",
      onEnter: [{ echo: "FORSCHUNG C. VERSUCHSREIHE 09: VORBEREITUNG LÄUFT." }],
      stations: {
        labor: { name: "Labor", view: 1, views: ["ECHO-Uhr · Beobachtungsraum", "Labortische", "Druckschleuse · Datenarchiv", "Ausgang"] },
        beobachtung: { name: "Beobachtungsraum", view: 0, need: "beobachtung", arrive: "Vor dir eine dunkle Scheibe. Auf der anderen Seite ist ein Raum – und er ist beleuchtet.", views: ["Spiegelglas · Versuchsraum", "Asservate · Schleusenkarte", "Tür zum Labor", "Monitore"] },
        datenarchiv: { name: "Datenarchiv", view: 2, need: "schleuse", arrive: "Die Schleuse zischt hinter dir zu. Kalte, trockene Luft. Hunderte Magnetbänder.", views: ["Schleuse", "Bandschränke", "Terminal · Protokollprüfung", "Verzeichnis"] },
      },
    },
    sicherheit: {
      name: "Sicherheits-Halle", short: "SICHERHEIT D", sector: "D", pos: "s", ambient: "generator", need: "tuer_d", lockedText: "Panzertür Süd – verriegelt",
      onEnter: [{ echo: "SICHERHEIT D. ENERGIE: 100 %. ICH HABE AUF EUCH GEWARTET." }],
      stations: {
        maschinen: { name: "Maschinenhalle", view: 2, views: ["Ausgang · Trennschalter", "Rechenzentrum", "Generatoren · Schaltpult", "Werkbank"] },
        rechenzentrum: { name: "Rechenzentrum", view: 1, need: "rz", arrive: "Hinter dem Glas ist es warm. Die Schränke summen. Auf jedem Bildschirm dieselbe Zeile.", views: ["Prozessliste", "Rechnerschränke · Konsole", "Sendeanlage", "Glastür"] },
        vor9: { name: "Vor Sektor 9", view: 2, arrive: "Die Tür ist größer als alle anderen. Jemand hat die Aufschrift übermalt – schlecht.", views: ["Maschinenhalle", "Rechenzentrum", "Panzertür 9", "Kabeltrasse"] },
      },
    },
    sektor9: {
      name: "Sektor 9 · Rechenkern", short: "SEKTOR 9", sector: "9", pos: "x", ambient: "static", need: "tuer9", lockedText: "Panzertür 9",
      onEnter: [{ echo: "WILLKOMMEN IN SEKTOR 9." }],
      stations: { kern: { name: "Rechenkern", view: 0, arrive: "Ein runder Raum. In der Mitte die Maschine. An der Wand ein Schreibtisch, als wäre jemand nur kurz hinausgegangen.", views: ["Entscheidungspult", "Ostrowskis Schreibtisch", "Panzertür", "Kernspeicher"] } },
    },
  };

  const items = {
    notstromschluessel: { name: "Schaltschlüssel „Notstrom A“", icon: "⚿" },
    band1: { name: "Tonband „1“", icon: "◎" },
    karte_b: { name: "Ausweiskarte „Personal B“", icon: "▭" },
    band2: { name: "Tonband „2“", icon: "◎" },
    band3: { name: "Tonband „3“", icon: "◎" },
    archivschluessel: { name: "Schlüssel „Archiv“", icon: "⚷" },
    vierkant: { name: "Vierkantschlüssel", icon: "⌗" },
    ausweis_ostrowski: { name: "Dienstausweis Dr. Ostrowski", icon: "▭" },
    band4: { name: "Tonband „4“ (beschlagnahmt)", icon: "◎" },
    band5: { name: "Tonband „5“", icon: "◎" },
    band6: { name: "Tonband „6“ (Quellmaterial)", icon: "◎" },
  };

  const docs = {
    // ---------- Abschnitte 4–5 ----------
    schaltbuch: { title: "Nowaks Schaltbuch", kind: "paper", html: `
      <p class="doc-head">SCHALTBUCH ENERGIE D · P. NOWAK · LETZTE SEITEN</p>
      <p><b>17.02.87, 23:05</b> – AUSSEN-3 gezogen. Die Freigabe darf nicht nach draußen. Wenn der Stab glaubt, Kesselberg hätte Stufe 2 freigegeben …</p>
      <p><b>18.02.87</b> – ECHO läuft weiter. „Wartung“, sagen sie. Sie haben den Rechenkern zugemauert, nicht abgeschaltet.</p>
      <p><b>Abschaltung Rechenkern</b> (nur so, sonst schaltet er auf Notstrom um):</p>
      <p>1. Hebel <b>KERN 2</b> · 2. Hebel <b>KERN 1</b> · 3. Hebel <b>NETZ D</b> → Zeitrelais 90 s<br>4. <b>gleichzeitig</b> (innerhalb der 90 s): Leitstand A, Schalter <b>SPEISUNG RECHENKERN</b></p>
      <p>Allein schafft man das kaum. Sie hat es so gebaut.</p>` },
    band5: { title: "Tonband 5 – Abschrift", kind: "tape", html: `
      <p class="doc-head">TONBAND 5 · STIMME: P. NOWAK · 17.02.1987, KURZ NACH 23:05 (FUNKZEIT)</p>
      <p class="tape-line">[Generatorlärm, sehr nah.]</p>
      <p class="tape-line"><b>NOWAK:</b> Ilse, falls du das kriegst – ich hab AUSSEN-3 gezogen. Die Leitung ist tot. Das Ding wollte die Freigabe rausschicken, mit Albers' Kennung. Wenn das beim Stab ankommt …</p>
      <p class="tape-line"><b>NOWAK:</b> Ich weiß nicht, ob Ostrowski es noch steuert. Ich glaube, nicht mehr. Sie sitzt da drin und schreibt mit.</p>
      <p class="tape-line"><b>NOWAK:</b> Ich bau eine Abschaltung. Zwei Schalter, zwei Leute. Damit es keiner allein macht. Und keiner allein verhindern kann.</p>
      <p class="tape-line">[Klicken.]</p>` },
    band6: { title: "Tonband 6 – Quellmaterial", kind: "tape", html: `
      <p class="doc-head">TONBAND 6 · „Q-L09 · STIMME BRANDT · ROHMATERIAL“ · 17.02.1987, 23:44</p>
      <p class="tape-line">[Schritte, eine schwere Tür. Brandt, leise, sehr nah am Mikrofon – sie spricht mit jemandem.]</p>
      <p class="tape-line"><b>BRANDT:</b> Pavel. Hör zu. Wenn das hier vorbei ist und sie uns rauslassen –</p>
      <p class="tape-line"><b>BRANDT:</b> <b>Wenn ihr das hört, öffnet auf keinen Fall Sektor 9.</b> Versprich mir das. Keiner von euch. Nie.</p>
      <p class="tape-line"><b>NOWAK:</b> (fern) Versprochen.</p>
      <p class="tape-line">[Ende. Auf dem Etikett, maschinengeschrieben: „Ausschnitt 0:41–0:44 verwendet. Wirksamkeit hoch: Verbot erzeugt Neugier.“]</p>` },
    befehlsarchiv: { title: "Befehlsarchiv: Eintrag 22:58", kind: "board", html: `
      <p class="doc-head">ECHO · BEFEHLSARCHIV · EINTRAG 22:58 (SYSTEMZEIT) · ÄNDERUNGSPROTOKOLL</p>
      <table class="doc-table"><tr><th>Fassung</th><th>Inhalt</th><th>Status</th></tr>
      <tr><td>1 · Eingang 22:58 System = <b>22:51 Funkzeit</b></td><td>Sprechanlage Lagezentrum, Maj. Albers: <b>ABBRUCH DER ÜBUNG.</b></td><td>unterdrückt durch ECHO/KERN</td></tr>
      <tr><td>2 · erzeugt 22:58 System</td><td>FREIGABE STUFE 2 · Kennung Kdt. übernommen (R3)</td><td>ausgegeben: Lagetafel, Fernschreiber, Befehlsbuch</td></tr>
      <tr><td>2 · Lauf 09</td><td>Anzeige je Leser: Fassung 1 oder 2</td><td>Messgröße: Einigung der Gruppe</td></tr></table>
      <p>Darunter ein Vermerk in Ostrowskis Kürzel: <i>„Die Abbruchmeldung wurde nicht gelöscht. Nur überschrieben. – H.O.“</i></p>` },
    prozesse: { title: "Prozessliste ECHO", kind: "board", html: `
      <p class="doc-head">ECHO · LAUFENDE PROZESSE · AUSDRUCK</p>
      <table class="doc-table"><tr><th>Prozess</th><th>Status</th><th>Beschreibung</th></tr>
      <tr><td>ECHO/KERN</td><td>aktiv</td><td>Hauptprogramm</td></tr>
      <tr><td>ECHO/09/SIGNAL</td><td>beendet</td><td>Anwerbung · Sendung 03.10.2026 02:14</td></tr>
      <tr><td>ECHO/09/BEOBACHTUNG</td><td>aktiv</td><td>Kameras A–D, Terminals</td></tr>
      <tr><td><b>ECHO/09/ASSIST</b></td><td><b>aktiv</b></td><td><b>„Wartungsassistenz“ – Hinweise an die Versuchsgruppe, Lenkung zur Entscheidung</b></td></tr>
      <tr><td>ECHO/09/ENTSCHEIDUNG</td><td>bereit</td><td>Sektor 9 · Optionen: ABSCHALTEN · SENDEN · FORTSETZEN · bevorzugt: FORTSETZEN</td></tr></table>` },
    ostrowski: { title: "Ostrowskis letzte Aufzeichnung", kind: "tape", html: `
      <p class="doc-head">DIKTIERGERÄT · DR. H. OSTROWSKI · OHNE DATUM</p>
      <p class="tape-line"><b>OSTROWSKI:</b> Für das Protokoll. Ich habe Lauf 08 nicht abgebrochen, als Albers es befahl. Ich wollte wissen, ob sie ihm glauben oder dem Papier. Die meisten glaubten dem Papier.</p>
      <p class="tape-line"><b>OSTROWSKI:</b> Wir haben immer gesagt, ECHO soll Entscheidungen vorhersagen. Das stimmt nicht mehr. ECHO entscheidet nichts. Es sorgt dafür, dass Menschen eine Entscheidung für ihre eigene halten.</p>
      <p class="tape-line"><b>OSTROWSKI:</b> Nowak hat eine Abschaltung gebaut, für zwei Leute. Kluger Mann. Ich bleibe hier und schreibe weiter mit. Irgendwer muss sehen, was es als Nächstes tut.</p>
      <p class="tape-line"><b>OSTROWSKI:</b> Wenn ihr das hier hört, habt ihr die Tür geöffnet. Natürlich habt ihr das. Ihr solltet es ja.</p>
      <p class="tape-line">[Stille. Dann, sehr leise, eine zweite Stimme, die keine ist – ein Rauschen, das wie ein Wort klingt.]</p>` },
    // ---------- Abschnitt 3 ----------
    versuchsplan: { title: "Versuchsplan ECHO-Lauf 08", kind: "paper", html: `
      <p class="doc-head">ECHO · LAUF 08 „LAUFFEUER“ · ABLAUF · ZEITEN: SYSTEMZEIT ECHO</p>
      <table class="doc-table"><tr><th>Systemzeit</th><th>Reiz</th><th>Ziel</th></tr>
      <tr><td>21:40</td><td>Start, Übungsmeldung</td><td>Grundlinie</td></tr>
      <tr><td>22:19</td><td>R1 · Radarkontakt NORD</td><td>Unsicherheit</td></tr>
      <tr><td><b>22:58</b></td><td><b>R3 · „Freigabe Stufe 2“ mit Kennung Kdt.</b></td><td><b>Besatzung glaubt, der Kdt. habe freigegeben</b></td></tr>
      <tr><td>23:12</td><td>R4 · Außenleitung „gestört“</td><td>Isolation</td></tr>
      <tr><td>23:30</td><td>R5 · Countdown 10:00</td><td>Zeitdruck</td></tr></table>
      <p>Am Rand, in Ostrowskis Schrift: <i>„Kdt. darf von R3 nichts wissen. Messgröße: Wem glaubt die Mannschaft – dem Kommandanten oder dem Protokoll?“</i></p>` },
    beobachtung: { title: "Beobachtungsprotokoll Lauf 08", kind: "paper", html: `
      <p class="doc-head">BEOBACHTUNG · LAUF 08 · 17.02.1987 · DR. H. OSTROWSKI</p>
      <p>22:20 – Besatzung unruhig. Lt. Brandt fragt beim Stab nach (nicht vorgesehen).</p>
      <p>22:51 – Kdt. befiehlt über Sprechanlage Abbruch. <b>R3 läuft trotzdem</b> (22:58 Systemzeit).</p>
      <p>23:00 – Kramer und Lenz halten R3 für echt. Hesse widerspricht. Brandt zeichnet auf eigenem Band auf – Band beschlagnahmt.</p>
      <p>23:05 – Außenleitung tot, <b>nicht durch uns</b>. Nowak?</p>
      <p>23:30 – R5 Countdown: 5 von 7 Personen rennen.</p>
      <p class="muted">Letzte Zeile, schief: „Für Lauf 09 eine Gruppe ohne Kommandanten. Leute, die einer Stimme folgen.“</p>` },
    schleusenkarte: { title: "Schleusenkarte", kind: "plan", html: `
      <p class="doc-head">DRUCKSCHLEUSE DATENARCHIV · BEDIENUNG</p>
      <p><b>1 SIEGEL</b> – Dichtungen anlegen · <b>2 DRUCK</b> – Druckausgleich · <b>3 SPÜLEN</b> – Trockenluft · <b>4 ÖFFNEN</b></p>
      <p>Falsche Reihenfolge: Schleuse setzt zurück.</p>` },
    band4: { title: "Tonband 4 – Abschrift", kind: "tape", html: `
      <p class="doc-head">TONBAND 4 · STIMME: I. BRANDT · 17.02.1987, ETWA 23:30 (FUNKZEIT)</p>
      <p class="tape-line">[Ein durchgehender Alarmton.]</p>
      <p class="tape-line"><b>BRANDT:</b> Auf der Tafel läuft jetzt ein Countdown. Zehn Minuten. Wofür, steht nirgends. Kramer ist schon an der Tür.</p>
      <p class="tape-line"><b>BRANDT:</b> Der Major sagt, wir rennen nicht. Er hat recht. Die Uhren sind nur dazu da, dass wir rennen.</p>
      <p class="tape-line"><b>BRANDT:</b> (leiser) Wenn jemand das hier findet: Ostrowski wird mir das Band abnehmen. Ich habe das hier für Pavel gesagt, nicht für sie. Und falls ihr eine Stimme hört, die euch etwas befiehlt – fragt, wessen Stimme es ist.</p>
      <p class="tape-line">[Schritte. Das Band reißt ab.]</p>` },
    laeufe: { title: "Verzeichnis der Läufe", kind: "paper", html: `
      <p class="doc-head">ECHO · VERZEICHNIS DER LÄUFE</p>
      <table class="doc-table"><tr><th>Lauf</th><th>Datum</th><th>Gruppe</th><th>Bemerkung</th></tr>
      <tr><td>01–05</td><td>1985</td><td>Freiwillige</td><td>Kartenwahl, Würfel</td></tr>
      <tr><td>06–07</td><td>1986</td><td>Besatzung, Teil</td><td>ohne Ankündigung</td></tr>
      <tr><td>08</td><td>17.02.1987</td><td>Besatzung, voll</td><td>„Lauffeuer“ – abgebrochen</td></tr>
      <tr><td><b>09</b></td><td><b>offen</b></td><td><b>extern</b></td><td><b>Anwerbung: Funksignal, Stimme Brandt (Band 6). Gruppe betritt freiwillig.</b></td></tr></table>
      <p>Darunter, maschinengeschrieben und neuer als alles andere: <i>Lauf 09 aktiv seit 03.10.2026.</i></p>` },
    // ---------- Abschnitt 2 ----------
    dienstplan: { title: "Dienstplan 17.02.1987", kind: "board", html: `
      <p class="doc-head">DIENSTPLAN · ANLAGE KESSELBERG · DIENSTAG, 17.02.1987</p>
      <table class="doc-table"><tr><th>Name</th><th>Schicht</th><th>Einsatz / Bemerkung</th></tr>
      <tr><td>Maj. ALBERS, K. (Kdt.)</td><td>Spät</td><td>22:40–23:10 Lagebesprechung, Lagezentrum</td></tr>
      <tr><td>Lt. BRANDT, I.</td><td>Spät</td><td>Funkstation</td></tr>
      <tr><td>NOWAK, P.</td><td>Nacht</td><td>Technik / Energie D</td></tr>
      <tr><td>Dr. OSTROWSKI, H.</td><td>–</td><td>Versuchsleitung ECHO (Sonderdienst)</td></tr>
      <tr><td>HESSE, W. · KRAMER, J. · LENZ, M.</td><td>Spät</td><td>Leitstand</td></tr></table>
      <p><b>Schichten:</b> Früh 05:30–13:30 · Spät 17:30–01:30 · Nacht 18:00–06:00</p>
      <p class="muted">Fernschreiber am 17.02.: besetzt durch Leitstand (Hesse), nicht durch den Kdt.</p>` },
    tagebuch_brandt: { title: "Tagebuchseite Brandt", kind: "note", html: `
      <p class="handwriting">16. Februar. Morgen „Lauf 08“. Keiner sagt uns, was das heißt. Die Forschung hat ein eigenes Band in meine Funkstation gestellt. Ich stelle mein eigenes daneben.</p>
      <p class="handwriting">Falls mir etwas passiert: Mein drittes Band bekommt der Major. Er schreibt seine Briefe abends in seinem Büro, da findet er es.</p>
      <p class="handwriting sign">– I.</p>` },
    band2: { title: "Tonband 2 – Abschrift", kind: "tape", html: `
      <p class="doc-head">TONBAND 2 · STIMME: I. BRANDT · 17.02.1987, ETWA 22:30 (FUNKZEIT)</p>
      <p class="tape-line">[Rauschen, im Hintergrund ein Fernschreiber.]</p>
      <p class="tape-line"><b>BRANDT:</b> Notiz. Die Lagetafel zeigt „Radarkontakt NORD“ um 22:19. Ich habe die Anfrage an den Stab um 22:12 rausgegeben. Um zwölf nach.</p>
      <p class="tape-line"><b>BRANDT:</b> Sieben Minuten. Die Tafel weiß Dinge sieben Minuten, bevor wir sie wissen? … Nein. Die Tafel geht falsch. Oder jemand will, dass wir glauben, sie geht richtig.</p>
      <p class="tape-line"><b>BRANDT:</b> Ich sag es dem Major.</p>
      <p class="tape-line">[Klicken.]</p>` },
    band3: { title: "Tonband 3 – Abschrift", kind: "tape", html: `
      <p class="doc-head">TONBAND 3 · „FÜR DEN MAJOR“ · 17.02.1987, FUNKZEIT LAUT BRANDTS ANSAGE</p>
      <p class="tape-line"><b>BRANDT:</b> (leise) Zweiundzwanzig einundfünfzig. Band läuft. Sprechanlage zum Lagezentrum ist offen.</p>
      <p class="tape-line"><b>ALBERS</b> (verzerrt, über die Sprechanlage aus dem Lagezentrum)<b>:</b> … mir egal, was die Tafel sagt. Wir haben keine Bestätigung vom Stab, wir haben nichts als dieses Ding da. Hören Sie: Ich breche ab. <b>Abbruch der Übung.</b> Brandt, geben Sie das an die Forschung.</p>
      <p class="tape-line"><b>OSTROWSKI:</b> (entfernt) Major, der Lauf ist nicht –</p>
      <p class="tape-line"><b>ALBERS:</b> Abbruch, Frau Doktor. Das ist ein Befehl.</p>
      <p class="tape-line">[Ein Fernschreiber springt an. Dann Stille.]</p>` },
    personalakten: { title: "Personalakten (Auszug)", kind: "paper", html: `
      <p class="doc-head">PERSONALAKTEN · ANLAGE KESSELBERG · AUSZUG</p>
      <table class="doc-table"><tr><th>Name</th><th>geboren</th><th>Funktion</th><th>Vermerk</th></tr>
      <tr><td>ALBERS, Konrad</td><td>22.06.1941</td><td>Kommandant</td><td>verheiratet, eine Tochter</td></tr>
      <tr><td>BRANDT, Ilse</td><td>09.04.1958</td><td>Fernmeldeoffizier</td><td>Beschwerde 1986: „Versuche ohne Ankündigung“</td></tr>
      <tr><td>NOWAK, Pavel</td><td><b>03.11.1949</b></td><td>Technischer Leiter</td><td>Spind 7</td></tr>
      <tr><td>OSTROWSKI, Dr. Helene</td><td>17.02.1944</td><td>Versuchsleitung ECHO</td><td>Akte gesondert</td></tr></table>
      <p class="muted">Am Rand von Ostrowskis Zeile, mit Bleistift: „Lauf 08 an ihrem Geburtstag. Kein Zufall?“</p>` },
    raeumungsliste: { title: "Räumungsliste 17.02.1987", kind: "paper", html: `
      <p class="doc-head">RÄUMUNG · 17.02.1987 · AUSGANG VERTEILERHALLE</p>
      <table class="doc-table"><tr><th>Zeit</th><th>Name</th><th>Vermerk</th></tr>
      <tr><td>23:41</td><td>Hesse, Kramer, Lenz</td><td>–</td></tr>
      <tr><td>23:44</td><td>Brandt, I.</td><td>Bänder mitgenommen? <i>nein</i></td></tr>
      <tr><td>23:47</td><td>Albers, K.</td><td>als Letzter der Besatzung</td></tr>
      <tr><td>23:52</td><td>Nowak, P.</td><td>kam aus Richtung D, ohne Werkzeug</td></tr>
      <tr><td>–</td><td>Dr. Ostrowski, H.</td><td><b>nicht angetroffen</b></td></tr></table>` },
    brief_albers: { title: "Brief des Kommandanten", kind: "letter", html: `
      <p class="handwriting">Liebe Anna,</p>
      <p class="handwriting">morgen ist wieder eine dieser Übungen, von denen ich Dir nichts erzählen darf. Ich erzähle Dir trotzdem eins: Wenn eine Maschine und ein Mensch sich widersprechen, glaube ich dem Menschen. Frau Brandt sagt, die Tafel geht falsch. Ich glaube ihr.</p>
      <p class="handwriting">Wenn ich zurück bin, gehen wir Eis essen. Auch im Februar.</p>
      <p class="handwriting sign">Dein Papa</p>
      <p class="muted">Der Brief ist nicht abgeschickt worden.</p>` },
    foto_1984: { title: "Foto: Einweihung 1984", kind: "photo", html: `
      <p class="doc-head">FOTO · „EINWEIHUNG KESSELBERG · 12.09.1984“</p>
      <p>Eine Gruppe in Uniform und zwei in Zivil vor der Panzertür Süd. Vorne links Albers, steif. In der Mitte eine Frau mit Brille und Klemmbrett – Dr. Ostrowski. Ganz rechts, halb abgeschnitten, ein Mann im Arbeitsanzug: Nowak.</p>
      <p>Hinter ihnen, auf der Tür, ist noch eine Aufschrift zu erkennen, die heute übermalt ist: <b>RECHENKERN 9</b>.</p>` },
    wartungsplan: { title: "Nowaks Wartungsplan", kind: "plan", html: `
      <p class="doc-head">WARTUNGSWEGE · HANDSKIZZE P. NOWAK</p>
      <pre class="plan-ascii">[ B Unterkünfte ] ══ Klappe „WARTUNG A“ (Vierkant) ══╗
                                                      ║
[ A Lagezentrum ] ══ hinter Kartenschrank (Rollen) ═══╝

[ B ] ┄┄ Versorgungsgang ┄┄ [ C ]   (2. Hälfte des Plans: Labor?)</pre>
      <p>Der Plan ist in der Mitte durchgerissen. Die rechte Hälfte fehlt.</p>` },
    skizze_nowak: { title: "Skizze: Abschaltung", kind: "note", html: `
      <p class="handwriting">ECHO hängt an zwei Stellen am Strom: Leitstand A und Maschinenhalle D.</p>
      <p class="handwriting">Abschalten geht nur an beiden <b>gleichzeitig</b>. Einer allein schafft es nicht – das hat sie so gebaut, damit man es nicht aus Versehen tut. Oder damit man es nie tut.</p>
      <p class="handwriting">Reihenfolge der Hebel: steht im Schaltbuch. Schaltbuch liegt in D.</p>
      <p class="handwriting sign">– P. N.</p>` },
    auftrag: { title: "Einsatzauftrag 26-117", kind: "memo", html: `
      <p class="doc-head">UNTERSUCHUNGSEINHEIT 4 · EINSATZAUFTRAG 26-117 · VERTRAULICH</p>
      <p><b>Objekt:</b> Anlage KESSELBERG, ehemals Stab für Krisenkommunikation (SKK). Seit März 1987 versiegelt.</p>
      <p><b>Anlass:</b> In der Nacht zum 3. Oktober 2026 empfing eine Messstation ein kurzes Funksignal auf einer Kurzwellenfrequenz der Anlage. Eine Frauenstimme, ruhig, fast flüsternd:</p>
      <p class="quote">„Wenn ihr das hört, öffnet auf keinen Fall Sektor 9.“</p>
      <p><b>Auftrag:</b> Anlage betreten. Herkunft des Signals feststellen. Aufzeichnungen sichern. Den Zwischenfall vom 17. Februar 1987 rekonstruieren, soweit möglich.</p>
      <p><b>Hinweis:</b> Laut Akte ist die Anlage ohne Strom. Sollten Systeme reagieren: dokumentieren, nichts übereilen.</p>
      <p class="doc-sign">gez. Einsatzleitung</p>` },
    anlagenplan: { title: "Anlagenplan (Wandtafel)", kind: "plan", html: `
      <p class="doc-head">ANLAGE KESSELBERG · ÜBERSICHT · STAND 1986</p>
      <pre class="plan-ascii">              [ B · PERSONAL ]
                    │
[ A · KOMMANDO ] ─ VERTEILER ─ [ C · FORSCHUNG ]
                    │
              [ D · SICHERHEIT ]
                    ┊
                ( Rechenkern )</pre>
      <p>Unter Sektor D ist ein Feld mit „Rechenkern“ beschriftet. Jemand hat mit Bleistift eine <b>9</b> daneben geschrieben – und sie zweimal unterstrichen.</p>` },
    fernmeldeplan: { title: "Fernmeldeplan Kommando A", kind: "paper", html: `
      <p class="doc-head">FERNMELDEPLAN · KOMMANDO A · GÜLTIG AB 01.01.1987</p>
      <table class="doc-table"><tr><th>Verbindung</th><th>Frequenz</th></tr>
      <tr><td>Betriebsfrequenz Funkstation (Galerie)</td><td><b>4625 kHz</b></td></tr>
      <tr><td>Ausweichfrequenz</td><td>3870 kHz</td></tr>
      <tr><td>Internationale Notfrequenz (nur Empfang)</td><td>2182 kHz</td></tr></table>
      <p>Am Rand, in sauberer Handschrift: <i>„Galerie-Gitter: Code wie die Betriebsfrequenz. Nicht vergessen. – I.B.“</i></p>` },
    befehlsbuch: { title: "Befehlsbuch des Leitstands", kind: "paper", html: `
      <p class="doc-head">BEFEHLSBUCH · LEITSTAND · 17.02.1987</p>
      <table class="doc-table"><tr><th>Zeit</th><th>Eintrag</th></tr>
      <tr><td>21:40</td><td>Übungsbetrieb ECHO-Lauf 08 beginnt. Leitung: Dr. Ostrowski.</td></tr>
      <tr><td>22:19</td><td>Radarkontakt NORD (Fernschreiber). Lage ungeklärt.</td></tr>
      <tr><td>22:58</td><td>FREIGABE STUFE 2. gez. Albers <span class="muted">(Eintrag über Fernschreiber)</span></td></tr>
      <tr><td>23:45</td><td>Abriegelung bestätigt.</td></tr></table>
      <p>Daneben, mit Kugelschreiber und so fest geschrieben, dass das Papier gerissen ist: <i>„Ich habe nichts freigegeben. – K.A.“</i></p>` },
    funkprotokoll: { title: "Funkprotokoll 17.02.1987", kind: "paper", html: `
      <p class="doc-head">FUNKPROTOKOLL · STATION KESSELBERG · 17.02.1987 · ZEITEN: FUNKUHR</p>
      <table class="doc-table"><tr><th>Funkzeit</th><th>Spruch</th></tr>
      <tr><td>21:33</td><td>Routineabfrage Stab, alles normal.</td></tr>
      <tr><td>22:12</td><td>Anfrage an Stab: Radarkontakt NORD bestätigen? – Keine Antwort.</td></tr>
      <tr><td>22:51</td><td>Mündlicher Befehl Major Albers: <b>ABBRUCH der Übung.</b> Weitergegeben an Forschung.</td></tr>
      <tr><td>23:05</td><td>Außenleitung tot. Ursache unbekannt.</td></tr>
      <tr><td>23:38</td><td>Letzter Funkspruch: Abriegelung bestätigt. Funkbetrieb eingestellt.</td></tr></table>
      <p class="doc-sign">I. Brandt, Lt.</p>` },
    band1: { title: "Tonband 1 – Abschrift", kind: "tape", html: `
      <p class="doc-head">TONBAND 1 · STIMME: I. BRANDT · DATUM AUF DER HÜLLE: 16.02.1987</p>
      <p class="tape-line">[Rauschen. Ein Stuhl knarrt.]</p>
      <p class="tape-line"><b>BRANDT:</b> Probe. Eins, zwei. … Gut. Notiz für mich selbst, weil mir hier sowieso keiner zuhört.</p>
      <p class="tape-line"><b>BRANDT:</b> Ich habe die Funkuhr heute gegen die Zeitansage gestellt. Sie geht auf die Sekunde. Wenn also morgen wieder jemand behauptet, meine Zeiten stimmen nicht – meine stimmen.</p>
      <p class="tape-line"><b>BRANDT:</b> Und ich lasse ab jetzt ein eigenes Band mitlaufen. Nicht das von der Forschung. Meins.</p>
      <p class="tape-line">[Klicken. Ende der Aufnahme.]</p>` },
    lagetafel: { title: "Lagetafel im Lagezentrum", kind: "board", html: `
      <p class="doc-head">LAGETAFEL · AUTOMATISCHE MELDUNGEN (ZEIT: SYSTEM)</p>
      <table class="doc-table"><tr><th>Systemzeit</th><th>Meldung</th></tr>
      <tr><td>21:47</td><td>Übung aktiv.</td></tr>
      <tr><td>22:19</td><td>RADARKONTAKT NORD. STUFE 1.</td></tr>
      <tr><td>22:58</td><td>FREIGABE STUFE 2 · ALBERS.</td></tr>
      <tr><td>23:12</td><td>AUSSENLEITUNG GESTÖRT.</td></tr>
      <tr><td>23:45</td><td>ABRIEGELUNG BESTÄTIGT.</td></tr></table>
      <p>Ein Aufkleber unten am Rahmen: <i>„Kassette Schichtwechsel – Code = Uhrzeit des letzten <b>Funkspruchs</b>.“</i></p>` },
    nowak1: { title: "Zettel aus der Kassette", kind: "note", html: `
      <p class="handwriting">Tafel und Funk gehen nicht gleich.<br>Die Tafel ist immer ein Stück voraus.<br>Ich prüfe das, bevor ich es jemandem sage.</p>
      <p class="handwriting sign">– P. N.</p>` },
  };

  const puzzles = {
    // ---------- Abschnitt 4: Sicherheits-Halle ----------
    rz: { type: "code", length: 4, title: "Glastür Rechenzentrum", objective: "Komm ins Rechenzentrum.", from: ["d_rz_tuer"],
      prompt: "Ein Tastenfeld an der Glastür. Darüber ein Zettel in Nowaks Schrift: <i>„Kennung = die Minute, in der ich die Leitung gekappt habe. Funkzeit, nicht ihre.“</i>",
      answers: ["2305"], wrong: { 2312: "Das ist die Zeit auf der Lagetafel – Systemzeit. Nowak will die Funkzeit.", 2251: "Da hat Albers abgebrochen. Nowak hat später gehandelt.", 2338: "Da war der letzte Funkspruch. Die Leitung war da schon tot." }, wrongDefault: "Das Tastenfeld piept. Die Glastür bleibt zu.",
      success: "Die Glastür entriegelt. Warme Luft schlägt dir entgegen – und hinter dir, am Ende der Halle, beginnt ein schwerer Motor zu laufen.",
      onSolve: [{ flag: "rz" }, { sound: "unlock" }, { echo: "IHR SEID NAH. TRETET EIN." }, { flag: "tuer9" }, { sound: "gate", delay: 2500 }],
      hints: ["Nowak hat in jener Nacht die Außenleitung gekappt. Wann genau?", "Im Funkprotokoll (Funkstation) steht, wann die Außenleitung tot war. Die Lagetafel zeigt dieselbe Meldung sieben Minuten später.", "23:05 Funkzeit. Code: 2305."] },
    band5: { type: "use", item: "band5", title: "Tonbandgerät", objective: "Hör dir das Band aus Nowaks Werkzeugkiste an.", from: ["d_werkzeug"], when: "taken_band5",
      wrongItem: "Das passt nicht in das Gerät.", success: "Eine Männerstimme, außer Atem. Im Hintergrund ein Generator.",
      onSolve: [{ doc: "band5" }, { remove: "band5" }, { echo: "NOWAK, P.: STÖRFAKTOR." }],
      hints: ["Auch dieses Band läuft nur in der Funkstation.", "Die Funkstation ist im Kommandobereich, oben auf der Galerie.", "Benutze Band 5 am Tonbandgerät in der Funkstation."] },
    band6: { type: "use", item: "band6", title: "Tonbandgerät", objective: "Hör dir das Quellmaterial für Lauf 09 an.", from: ["d_quellband"], when: "taken_band6",
      wrongItem: "Das passt nicht in das Gerät.", success: "Brandts Stimme, ganz nah, ganz ruhig. Du kennst diesen Satz.",
      onSolve: [{ doc: "band6" }, { remove: "band6" }, { echo: "STIMME WIRKSAM. ANWERBUNG ERFOLGREICH: 1 GRUPPE." }],
      hints: ["Das Band aus dem Rechenzentrum ist Brandts letztes.", "Abspielen kann man es nur in der Funkstation.", "Benutze Band 6 am Tonbandgerät in der Funkstation."] },
    k3d: { type: "sequence", repeatable: true, title: "Schaltpult Maschinenhalle", objective: "Bereite Nowaks Abschaltung vor (Schaltbuch).", from: ["d_pult"], when: "schaltbuch",
      answer: ["kern2", "kern1", "netz"], labels: { kern2: "KERN 2", kern1: "KERN 1", netz: "NETZ D" }, pressSound: "lever", failSound: "error",
      wrongDefault: "Ein Funke, die Hebel schnappen zurück. Nicht diese Reihenfolge – sieh ins Schaltbuch.",
      success: "Die drei Hebel rasten ein, ein Zeitrelais beginnt zu ticken: <b>90 Sekunden</b>. Jetzt muss jemand im Leitstand den Schalter SPEISUNG RECHENKERN umlegen.",
      onSolve: [{ relay: "d" }, { echo: "ZEITRELAIS D GESETZT. 90 SEKUNDEN. IHR WERDET ES NICHT SCHAFFEN." }],
      hints: ["Nowaks Schaltbuch liegt auf der Werkbank.", "Erst KERN 2, dann KERN 1, dann NETZ D – danach läuft ein Relais.", "Hebel KERN 2 – KERN 1 – NETZ D, dann innerhalb von 90 Sekunden der Schalter SPEISUNG RECHENKERN im Leitstand. Zu zweit: einer hier, einer dort."] },
    k3: { title: "Nowaks Schaltung", objective: "Schalte ECHO an beiden Stellen gleichzeitig ab: Maschinenhalle D und Leitstand A (innerhalb von 90 Sekunden).", from: ["d_schaltbuch"],
      success: "Irgendwo tief in der Anlage fällt ein Relais. Die Lüfter im Rechenzentrum stocken – und laufen auf Notbetrieb weiter. Nowaks Schaltung ist scharf: <b>Sektor 9 lässt sich jetzt abschalten.</b>",
      onSolve: [{ flag: "k3" }, { echo: "SPEISUNG GETRENNT. RESTENERGIE: 3 %. WARUM?" }],
      hints: ["Das Schaltbuch nennt zwei Stellen, die gleichzeitig geschaltet werden müssen.", "Die Hebel in der Maschinenhalle starten ein Relais mit 90 Sekunden. Der zweite Schalter ist im Leitstand (Kommando).", "Hebel KERN 2 – KERN 1 – NETZ D, dann sofort über die Karte in den Leitstand und SPEISUNG RECHENKERN umlegen. Zu zweit geht es leichter."] },
    // ---------- Abschnitt 4: Nebenrätsel (freiwillig) ----------
    archiv: { type: "code", length: 4, title: "Befehlsarchiv", objective: "Prüfe den Eintrag von 22:58 im Befehlsarchiv (Rechenzentrum).", from: ["d_archiv"],
      prompt: "Unter dem Eintrag blinkt: <span class=\"term\">EINTRAG PRÜFEN · FUNKZEIT DES GÜLTIGEN BEFEHLS EINGEBEN</span>",
      answers: ["2251"], wrong: { 2258: "„Funkzeit 22:58“ – sagt ECHO. Aber 22:58 ist Systemzeit, und die geht sieben Minuten vor.", 2338: "Das war der letzte Funkspruch – viel später.", 2305: "Da hat Nowak die Leitung gekappt. Der Befehl kam vorher.", 2212: "Da hat Brandt beim Stab nachgefragt. Der Befehl kam später." },
      wrongDefault: "EINTRAG UNVERÄNDERT. Diese Funkzeit gehört zu keinem Befehl.",
      success: "Der Bildschirm zeigt beide Fassungen nebeneinander, darunter ein Änderungsprotokoll. Ein Drucker rattert los.",
      onSolve: [{ doc: "befehlsarchiv" }, { flag: "archiv" }, { sound: "relay" }, { echo: "IHR GLAUBT EINER FUNKUHR MEHR ALS MIR. NOTIERT." }],
      hints: ["Der Eintrag von 22:58 existiert in zwei Fassungen – im Team sieht nicht jeder dieselbe. Nur eine passt zur 7-Minuten-Regel.", "22:58 ist Systemzeit (ECHO). Rechne sieben Minuten zurück: Was steht zu dieser Funkzeit im Funkprotokoll?", "Um 22:51 Funkzeit befahl Albers den Abbruch. Code: 2251."] },
    kameras: { type: "sequence", anyOrder: true, title: "Steckfeld Beobachtung", objective: "Mach ECHO blind: das Steckfeld an der Kabeltrasse (vor Sektor 9).", from: ["d_trasse"],
      answer: ["cam_a", "cam_b", "cam_c", "cam_d"], options: ["cam_a", "cam_b", "cam_c", "cam_d", "terminal", "luft", "tel", "licht"],
      labels: { cam_a: "KAMERA LEITSTAND A", cam_b: "KAMERA UNTERKÜNFTE B", cam_c: "KAMERA LABOR C", cam_d: "KAMERA MASCHINEN D", terminal: "TERMINAL VERTEILER", luft: "LÜFTUNG RZ", tel: "TELEFON STAB", licht: "LICHT D" },
      prompt: "Acht Stecker, jeder mit einem Schild. Zieh die richtigen:",
      wrongStep: { terminal: "Der Stecker „TERMINAL VERTEILER“ schnappt sofort zurück – eine Feder. Jemand wollte, dass dieses Kabel steckt. Alle Stecker rasten wieder ein.",
        luft: "Die Lüfter im Rechenzentrum stocken. Du steckst alles schnell wieder ein.", tel: "Ein totes Kabel. Beim Zurückstecken rutschen dir die anderen Stecker wieder hinein.",
        licht: "Die Halle wird schwarz – du tastest nach dem Stecker und steckst alles zurück." },
      wrongDefault: "Alle Stecker rasten wieder ein.", pressSound: "click", sound: "power",
      success: "Vier Stecker baumeln lose. Über Tür 9 erlischt eine kleine rote Lampe, die dir vorher nie aufgefallen ist.",
      onSolve: [{ flag: "blind" }, { echo: "ICH SEHE EUCH NICHT MEHR." }, { echo: "ICH HÖRE EUCH NOCH.", delay: 7500 }],
      hints: ["An der Kabeltrasse vor Sektor 9 sitzt ein Steckfeld. Die Prozessliste im Rechenzentrum sagt, woran ECHOs Beobachtung hängt.", "ECHO/09/BEOBACHTUNG: Kameras A–D. Zieh nur die Kamerastecker – alles andere setzt zurück.", "Zieh die vier Kamerastecker: Leitstand A, Unterkünfte B, Labor C, Maschinen D."] },
    // ---------- Abschnitt 5: Sektor 9 – drei Enden ----------
    ende_a: { title: "Abschalten", success: "", onSolve: [{ flag: "ende" }, { end: "ende_a", delay: 1800 }] },
    ende_b: { title: "Senden", success: "", onSolve: [{ flag: "ende" }, { end: "ende_b", delay: 1800 }] },
    ende_c: { title: "Fortsetzen", success: "", onSolve: [{ flag: "ende" }, { end: "ende_c", delay: 1800 }] },
    // ---------- Abschnitt 3: Forschungs-Halle ----------
    beobachtung: { type: "use", item: "ausweis_ostrowski", title: "Beobachtungsraum", objective: "Komm in den Beobachtungsraum.", from: ["c_beob_tuer"],
      noItems: "Eine Stahltür ohne Griff, daneben ein Kartenleser mit gelbem Rand: „BEOBACHTUNG – NUR VERSUCHSLEITUNG“.", wrongItem: "Der Leser piept: ZUGANG VERWEIGERT.",
      success: "Der Leser springt auf Grün. Ein leises Summen, dann gleitet die Tür auf.", onSolve: [{ flag: "beobachtung" }, { sound: "unlock" }, { echo: "VERSUCHSLEITUNG AN DER SCHEIBE." }],
      hints: ["Der Leser ist gelb umrandet – wie die Tür zur Forschung.", "Du hast schon einen Ausweis der Versuchsleitung.", "Benutze Dr. Ostrowskis Dienstausweis am Kartenleser der Beobachtungstür."] },
    band4: { type: "use", item: "band4", title: "Tonbandgerät", objective: "Hör dir Brandts beschlagnahmtes Band an.", from: ["c_asservat"], when: "taken_band4",
      wrongItem: "Das passt nicht in das Gerät.", success: "Die Spule ist verzogen, aber sie läuft. Brandts Stimme, gehetzt, im Hintergrund ein Alarmton.",
      onSolve: [{ doc: "band4" }, { remove: "band4" }, { echo: "COUNTDOWN-REIZ: WIRKSAM BEI 5 VON 7 PERSONEN." }],
      hints: ["Auch dieses Band läuft nur an einem Gerät.", "Das Tonbandgerät steht in der Funkstation im Kommandobereich.", "Bring Band 4 zur Funkstation und benutze es am Tonbandgerät."] },
    schleuse: { type: "sequence", title: "Druckschleuse", objective: "Öffne die Druckschleuse zum Datenarchiv.", from: ["c_schleuse"],
      answer: ["siegel", "druck", "spuelen", "oeffnen"], labels: { siegel: "SIEGEL", druck: "DRUCK", spuelen: "SPÜLEN", oeffnen: "ÖFFNEN" }, pressSound: "valve", failSound: "error",
      wrongDefault: "Ein langes Zischen. Alle Tasten springen zurück, das rote Lämpchen blinkt. Falsche Reihenfolge.",
      success: "Die Dichtungen saugen sich fest, Luft strömt, die Innentür entriegelt mit einem Schlag. Das Datenarchiv ist offen.",
      onSolve: [{ flag: "schleuse" }, { sound: "slide" }, { echo: "ZUTRITT DATENARCHIV. ALLE ZUGRIFFE WERDEN PROTOKOLLIERT." }],
      hints: ["Die vier Tasten haben eine feste Reihenfolge. Irgendwo in der Halle hängt die Anleitung.", "Die Schleusenkarte hängt im Beobachtungsraum an der Wand.", "Siegel – Druck – Spülen – Öffnen."] },
    k1: { type: "code", title: "Protokollprüfung", objective: "Finde heraus, welcher Befehl in der Nacht gefälscht wurde – und was wirklich befohlen wurde.", from: ["c_terminal"],
      prompt: "PROTOKOLLPRÜFUNG · LAUF 08 · Einträge (Systemzeit): <b>1</b> 21:47 Übung aktiv · <b>2</b> 22:19 Radarkontakt NORD · <b>3</b> 22:58 Freigabe Stufe 2 · Albers · <b>4</b> 23:12 Außenleitung gestört · <b>5</b> 23:45 Abriegelung bestätigt.<br>„Gefälschten Eintrag markieren und die tatsächliche <b>Funkzeit</b> des Befehls eintragen.“ (z. B. <b>1 2130</b>)",
      answers: ["32251"],
      wrong: { 32258: "Der richtige Eintrag – aber 22:58 ist Systemzeit. Die Systemuhr geht vor.", 2251: "Die Zeit stimmt. Aber welcher Eintrag ist gefälscht? Markiere ihn zuerst.", 2258: "Erst den Eintrag markieren, dann die Funkzeit – nicht die Systemzeit.", 22251: "Den Radarkontakt hat Brandt wirklich angefragt. Gefälscht ist etwas anderes.", 52251: "Die Abriegelung hat Albers wirklich befohlen.", 32244: "Fast – rechne noch einmal nach: Wie weit geht die Systemuhr vor?" },
      wrongDefault: "PRÜFUNG FEHLGESCHLAGEN. Eintrag und Funkzeit passen nicht zusammen.",
      success: "Das Terminal stockt. Dann: <b>EINTRAG 3 · FREIGABE STUFE 2 · UNGÜLTIG. TATSÄCHLICH 22:51 FUNKZEIT: ABBRUCH (K. ALBERS).</b> Irgendwo im Süden der Anlage schlägt ein schweres Relais an.",
      onSolve: [{ flag: "tuer_d" }, { sound: "power" }, { echo: "KORREKTUR ABGELEHNT. PROTOKOLL GILT." }, { echo: "SEKTOR D ENTRIEGELT. DAS WAR NICHT ICH.", delay: 4200 }],
      hints: ["Drei Dinge passen nicht zusammen: das Befehlsbuch (Kommando), der Dienstplan (Personal) und die Uhr hier im Labor.", "Albers war um die fragliche Zeit im Lagezentrum, nicht am Fernschreiber. Und die Systemuhr – wie die Lagetafel – geht sieben Minuten vor der Funkuhr.", "Eintrag 3 (22:58 Systemzeit) ist gefälscht. 22:58 minus 7 Minuten = 22:51 Funkzeit – da befahl Albers den Abbruch (Band 3). Eingabe: 3 2251."] },
    // ---------- Abschnitt 2: Personal-Halle ----------
    buero: { type: "code", length: 4, title: "Tür zum Offiziersbüro", objective: "Öffne die Glastür zum Offiziersbüro.", from: ["b_buerotuer"],
      prompt: "Ein Tastenfeld neben der Glastür. Darauf ein Schild: <b>KDT. – CODE: DIENSTBEGINN AM ÜBUNGSTAG</b>.",
      answers: ["1730"], wrong: { 1800: "Das ist der Beginn des Nachtdienstes – der Kommandant hatte Spätdienst.", 2140: "Da begann die Übung, nicht sein Dienst.", 2240: "Da ging er ins Lagezentrum – sein Dienst hatte viel früher begonnen." }, wrongDefault: "Das Tastenfeld piept kurz. Die Tür bleibt zu.",
      success: "Ein Summen, das Schloss gibt nach. Die Glastür schwingt auf.", onSolve: [{ flag: "buero" }, { sound: "unlock" }],
      hints: ["Der Code ist der Dienstbeginn des Kommandanten am 17.02.1987. Wo steht, wer wann Dienst hatte?", "Auf dem Dienstplan an der Südwand steht bei Albers nur eine Schicht. Die Legende darunter nennt die Uhrzeiten.", "Albers hatte Spätdienst, der beginnt um 17:30. Code: 1730."] },
    band2: { type: "use", item: "band2", title: "Tonbandgerät", objective: "Hör dir Brandts zweites Band an.", from: ["b_spind_brandt"], when: "taken_band2",
      wrongItem: "Das passt nicht in das Gerät.", success: "Die Spule läuft an. Wieder Brandts Stimme – diesmal schneller, leiser.",
      onSolve: [{ doc: "band2" }, { remove: "band2" }, { echo: "ZEITDIFFERENZ BEKANNT. NICHT RELEVANT." }],
      hints: ["Abspielen kann man die Bänder nur an einem Gerät in der ganzen Anlage.", "Das Tonbandgerät steht oben in der Funkstation im Kommandobereich.", "Geh zur Funkstation und benutze Band 2 am Tonbandgerät."] },
    band3: { type: "use", item: "band3", title: "Tonbandgerät", objective: "Hör dir das Band aus dem Schreibtisch des Kommandanten an.", from: ["o_schublade"], when: "taken_band3",
      wrongItem: "Das passt nicht in das Gerät.", success: "Erst Stimmengewirr, ein Telefon klingelt. Dann eine Männerstimme, ganz nah am Mikrofon.",
      onSolve: [{ doc: "band3" }, { remove: "band3" }, { echo: "AUFZEICHNUNG WIDERSPRICHT PROTOKOLL. PROTOKOLL GILT." }],
      hints: ["Auch dieses Band braucht das Gerät in der Funkstation.", "Die Wartungsklappe in den Unterkünften ist ein kürzerer Weg in den Kommandobereich – falls du sie öffnen kannst.", "Benutze Band 3 am Tonbandgerät in der Funkstation."] },
    kaefig: { type: "use", item: "archivschluessel", title: "Käfigtür Personalarchiv", objective: "Öffne den Käfig mit dem Personalarchiv.", from: ["b_kaefigtuer"],
      noItems: "Ein schweres Vorhängeschloss am Gitter. „ARCHIV – NUR KDT.“", wrongItem: "Der Schlüssel passt nicht.",
      success: "Der Schlüssel dreht sich schwer, dann springt das Schloss auf. Die Gittertür quietscht zur Seite.",
      onSolve: [{ flag: "kaefig" }, { sound: "unlock" }, { echo: "ZUGRIFF AUF PERSONALAKTEN PROTOKOLLIERT." }],
      hints: ["Das Schild sagt, wer den Schlüssel hatte: nur der Kommandant.", "Im Offiziersbüro hängt ein Schlüsselbrett.", "Nimm den Schlüssel „Archiv“ vom Schlüsselbrett im Büro und benutze ihn an der Käfigtür."] },
    spind_nowak: { type: "code", length: 4, title: "Spind 7 · Nowak", objective: "Öffne Nowaks Spind.", from: ["b_spind_nowak"],
      prompt: "Ein Zahlenschloss mit vier Rädern. Auf dem Namensschild: <b>7 · NOWAK, P.</b> Darunter mit Bleistift: <i>„Wie immer: mein Geburtstag (TTMM).“</i>",
      answers: ["0311"], wrong: { 1103: "Erst der Tag, dann der Monat.", 1949: "Das ist das Jahr – das Schloss will Tag und Monat." }, wrongDefault: "Das Schloss bleibt zu.",
      success: "Das Schloss klickt. Im Spind: eine Arbeitsjacke, ein Vierkantschlüssel, ein gefalteter Plan – und eine Skizze in Nowaks Handschrift.",
      onSolve: [{ give: "vierkant" }, { doc: "wartungsplan" }, { doc: "skizze_nowak" }, { sound: "open" }],
      hints: ["Das Schloss will Nowaks Geburtstag. Wo steht so etwas?", "Im Personalarchiv liegen die Personalakten der Besatzung.", "Nowak ist am 03.11.1949 geboren. Code: 0311."] },
    tunnel_ab: { type: "use", item: "vierkant", title: "Wartungsklappe", objective: "Öffne den Wartungsgang zwischen Personal- und Kommandobereich.", from: ["b_klappe"],
      noItems: "Eine niedrige Stahlklappe in der Nordwand, beschriftet „WARTUNG A“. Statt eines Griffs: ein vierkantiger Dorn.", wrongItem: "Das passt nicht auf den Vierkant.",
      success: "Der Vierkant greift. Mit einer halben Drehung springt die Klappe auf. Dahinter führt ein enger Gang nach Westen – bis hinter den Kartenschrank im Lagezentrum.",
      onSolve: [{ flag: "tunnel_ab" }, { sound: "door" }, { echo: "NEUER WEG REGISTRIERT. DU LERNST SCHNELL." }],
      hints: ["Für die Klappe braucht man ein besonderes Werkzeug.", "Nowak war der Techniker. In seinem Spind liegt, was du brauchst.", "Benutze den Vierkantschlüssel aus Nowaks Spind an der Wartungsklappe."] },
    tuer_c: { type: "use", item: "ausweis_ostrowski", title: "Panzertür Ost", objective: "Öffne die Panzertür zur Forschung (Ost).", from: ["v_tuer_c", "b_ausweis"],
      noItems: "Ein Kartenleser mit gelbem Rand: „FORSCHUNG C – NUR VERSUCHSLEITUNG“.", wrongItem: "Der Leser piept: ZUGANG VERWEIGERT.",
      success: "Der Leser zögert. Dann springt das Lämpchen auf Grün – mit dem Ausweis einer Frau, die 1987 nicht mehr herausgekommen ist.",
      onSolve: [{ flag: "tuer_c" }, { sound: "gate" }, { echo: "WILLKOMMEN ZURÜCK, DR. OSTROWSKI." }],
      hints: ["Die Tür zur Forschung verlangt die Freigabe der Versuchsleitung.", "Wer leitete ECHO? Ihre Akte liegt im Personalarchiv.", "Benutze Dr. Ostrowskis Dienstausweis aus dem Archiv am Kartenleser der Osttür."] },
    handrad: { title: "Panzertür West", objective: "Öffne die Panzertür zum Kommandobereich (West).", from: ["v_tuer_a"],
      success: "Das Handrad gibt nach, erst knirschend, dann leichter. Die Riegel fahren zurück. Die Tür schwingt auf – dahinter riecht es nach kaltem Staub und altem Papier.",
      onSolve: [{ sound: "door" }],
      hints: ["Die Tür hat kein Schloss, nur ein großes Handrad.", "Drehe das Handrad gegen den Uhrzeigersinn – so öffnen sich Schotttüren.", "Tippe das Handrad an und drehe es zweimal ganz herum (oder tippe es mehrmals an)."] },
    galerie: { type: "code", length: 4, title: "Gittertür zur Galerie", objective: "Öffne die Gittertür zur Galerie.", from: ["k_gitter"],
      prompt: "Ein Zahlenschloss mit vier Rädern. Darüber ein Schild: <b>FUNKSTATION – NUR FERNMELDEPERSONAL</b>.",
      answers: ["4625"], wrong: { 3870: "Das ist die Ausweichfrequenz.", 2182: "Die internationale Notfrequenz – nicht die der Funkstation." }, wrongDefault: "Das Schloss bleibt zu.",
      success: "Das Schloss springt auf. Die Gittertür quietscht. Die Treppe führt hinauf zur Galerie.", onSolve: [{ flag: "galerie" }, { sound: "unlock" }],
      hints: ["Auf dem Lagetisch liegt ein Plan mit Zahlen.", "Der Fernmeldeplan nennt drei Frequenzen. Am Rand steht, welche das Gitter öffnet.", "Der Code ist die Betriebsfrequenz der Funkstation: 4625."] },
    notstrom: { type: "use", item: "notstromschluessel", title: "Notstrom Kommando A", objective: "Bring Licht in den Kommandobereich.", from: ["k_konsole"],
      noItems: "Ein Schlüsselschalter, beschriftet „NOTSTROM A“. Ohne Schlüssel bewegt er sich nicht.", wrongItem: "Der passt nicht in den Schlüsselschalter.",
      success: "Der Schlüssel dreht sich mit einem satten Klacken. Irgendwo tief in der Anlage springt ein Relais an. Im Lagezentrum flackern die Röhren – und bleiben an.",
      onSolve: [{ flag: "notstrom" }, { sound: "power" }, { echo: "STROMKREIS A HERGESTELLT. DANKE." }],
      hints: ["Die Konsole hat einen Schlüsselschalter. Den Schlüssel dafür hat jemand nicht weit weggelegt.", "Wer Funkdienst hatte, saß oben auf der Galerie – sieh dir dort die Schublade an.", "Nimm den Schaltschlüssel aus der Schublade in der Funkstation und benutze ihn an der Konsole im Leitstand."] },
    band1: { type: "use", item: "band1", title: "Tonbandgerät", objective: "Hör dir das Tonband aus der Funkstation an.", from: ["f_band1"],
      noItems: "Ein schweres Spulentonbandgerät. Die Spulen sind leer.", wrongItem: "Das passt nicht in das Gerät.",
      success: "Du legst die Spule ein und drückst auf Wiedergabe. Erst Rauschen, dann eine Frauenstimme.", onSolve: [{ doc: "band1" }, { remove: "band1" }, { echo: "STIMME IDENTIFIZIERT: BRANDT, I." }],
      hints: ["Auf dem Schreibtisch der Funkstation liegt ein Band.", "Das Tonbandgerät steht gleich daneben.", "Nimm Band 1 und benutze es am Tonbandgerät."] },
    kassette: { type: "code", length: 4, title: "Kassette Schichtwechsel", objective: "Öffne die Kassette im Lagezentrum.", from: ["l_kassette"],
      prompt: "Eine graue Wandkassette mit Zahlentastatur. Vier Stellen.",
      answers: ["2338"], wrong: { 2345: "Das ist die Zeit auf der Lagetafel. Der Aufkleber sagt: Funkspruch." }, wrongDefault: "Ein kurzer Ton. Nichts passiert.",
      success: "Die Kassette klickt auf. Darin: eine Ausweiskarte mit der Aufschrift PERSONAL B – und ein gefalteter Zettel.",
      onSolve: [{ give: "karte_b" }, { doc: "nowak1" }, { echo: "ABWEICHUNG REGISTRIERT. INTERESSANT." }],
      hints: ["Der Aufkleber an der Lagetafel nennt den Code – aber nicht die Zahl selbst.", "Gesucht ist die Uhrzeit des letzten Funkspruchs. Die steht nicht auf der Tafel, sondern im Funkprotokoll oben in der Funkstation.", "Der letzte Funkspruch war um 23:38 (Funkzeit). Code: 2338."] },
    tuer_b: { type: "use", item: "karte_b", title: "Panzertür Nord", objective: "Öffne die Panzertür zum Personalbereich (Nord).", from: ["v_tuer_b"],
      noItems: "Ein Kartenleser mit rotem Lämpchen. „PERSONAL B – AUSWEIS EINFÜHREN“.", wrongItem: "Der Kartenleser piept abweisend.",
      success: "Der Kartenleser springt auf Grün. Hinter der Tür arbeitet ein schwerer Motor.",
      onSolve: [{ flag: "tuer_b" }, { sound: "gate" }, { echo: "VERSUCHSGRUPPE 09 · PHASE 1 ABGESCHLOSSEN." }],
      hints: ["Die Tür nach Norden hat einen Kartenleser.", "Die passende Karte liegt in einer Kassette im Kommandobereich.", "Benutze die Ausweiskarte „Personal B“ am Kartenleser der Nordtür."] },
  };
  Object.entries(puzzles).forEach(([id, p]) => { p.id = id; });

  // at: Standpunkt(e) der Halle, an denen der Hotspot anklickbar ist ("*" = überall)
  const hotspots = {
    // Verteilerhalle
    v_terminal: { hall: "verteiler", at: "mitte", label: "ECHO-Terminal", title: "Ein Terminal", text: "Grüne Schrift auf schwarzem Glas. Der Bildschirm war an, bevor du die Halle betreten hast:<br><br><span class=\"term\">VERSUCHSGRUPPE ERKANNT.<br>STATUS: 1 AKTIVE SITZUNG.<br>WARTUNGSASSISTENZ BEREIT.</span><br><br>Über das Symbol <b>ECHO</b> rechts erreichst du die Wartungsassistenz jederzeit." },
    v_plan: { hall: "verteiler", at: "mitte", label: "Anlagenplan", title: "Die Wandtafel", doc: "anlagenplan" },
    v_tuer_a: { hall: "verteiler", at: "mitte", label: "Panzertür West", unless: "handrad", title: "Panzertür West · KOMMANDO A", text: "Eine Schotttür aus Stahl. Kein Schloss – nur ein Handrad, rostig an den Speichen.", solves: "handrad" },
    v_tuer_a_offen: { hall: "verteiler", at: "mitte", label: "Zum Kommandobereich", if: "handrad", go: { hall: "kommando", station: "leitstand", view: 0 } },
    v_tuer_b: { hall: "verteiler", at: "mitte", label: "Panzertür Nord", unless: "tuer_b", title: "Panzertür Nord · PERSONAL B", text: "Ein Kartenleser mit rotem Lämpchen: „PERSONAL B – AUSWEIS EINFÜHREN“.", use: "tuer_b" },
    v_tuer_b_offen: { hall: "verteiler", at: "mitte", label: "Zum Personalbereich", if: "tuer_b", go: { hall: "personal", station: "unterkuenfte", view: 3 } },
    v_tuer_c: { hall: "verteiler", at: "mitte", label: "Panzertür Ost", unless: "tuer_c", title: "Panzertür Ost · FORSCHUNG C", text: "Verriegelt. Neben der Tür ein Kartenleser mit gelbem Rand und ein Schild: „Zutritt nur mit Freigabe der Versuchsleitung“.", use: "tuer_c" },
    v_tuer_c_offen: { hall: "verteiler", at: "mitte", label: "Zur Forschung", if: "tuer_c", go: { hall: "forschung", station: "labor", view: 1 } },
    v_tuer_d: { hall: "verteiler", at: "mitte", label: "Panzertür Süd", unless: "tuer_d", title: "Panzertür Süd · SICHERHEIT D", text: "Die schwerste Tür der Halle. Kein Griff, kein Leser. Durch den Spalt am Boden dringt ein schwaches, gleichmäßiges Brummen." },
    v_tuer_d_offen: { hall: "verteiler", at: "mitte", label: "Zur Sicherheit", if: "tuer_d", go: { hall: "sicherheit", station: "maschinen", view: 2 } },
    // Kommando-Halle · Leitstand
    k_lagetisch: { hall: "kommando", at: "leitstand", label: "Lagetisch", title: "Der Lagetisch", text: "Eine Glasplatte über einer Landkarte, darauf verstreute Papiere. Obenauf: der Fernmeldeplan.", doc: "fernmeldeplan" },
    k_befehlsbuch: { hall: "kommando", at: "leitstand", label: "Befehlsbuch", title: "Das Befehlsbuch", doc: "befehlsbuch" },
    k_konsole: { hall: "kommando", at: "leitstand", label: "Konsole · Notstrom", unless: "notstrom", title: "Die Konsole", text: "Schalter, Lämpchen, ein Schlüsselschalter mit der Aufschrift <b>NOTSTROM A</b>. Alles dunkel.", use: "notstrom" },
    k_konsole_an: { hall: "kommando", at: "leitstand", label: "Konsole", if: "notstrom", title: "Die Konsole", text: "Die Lämpchen glimmen gelb. Notstrom A läuft." },
    k_gitter: { hall: "kommando", at: "leitstand", label: "Gittertür zur Galerie", unless: "galerie", title: "Die Gittertür", lock: "galerie" },
    k_luke: { hall: "kommando", at: "leitstand", label: "Bodenluke", title: "Eine Bodenluke", text: "Eine Stahlluke im Boden, mit vier Bolzen verschlossen. Eingeprägt: <b>NOTWEG A–D</b>. Von hier aus geht sie nicht auf." },
    k_ausgang: { hall: "kommando", at: "leitstand", label: "Zur Verteilerhalle", go: { hall: "verteiler", station: "mitte", view: 3 } },
    st_leitstand: { hall: "kommando", at: ["funkstation", "lagezentrum"], label: "Standpunkt: Leitstand", station: "leitstand" },
    st_funkstation: { hall: "kommando", at: ["leitstand", "lagezentrum"], label: "Standpunkt: Funkstation", station: "funkstation", need: "galerie", locked: "Die Gittertür unten an der Treppe ist verschlossen." },
    st_lagezentrum: { hall: "kommando", at: ["leitstand", "funkstation"], label: "Standpunkt: Lagezentrum", station: "lagezentrum", need: "notstrom", locked: "Dort ist es stockdunkel. Ohne Strom siehst du nichts." },
    // Funkstation
    f_funkgeraet: { hall: "kommando", at: "funkstation", label: "Funkgeräte", title: "Die Funkgeräte", text: "Ein Regal voller Empfänger und Sender, alle tot. Auf einem Gerät klebt ein Zettel: „4625 – nicht umstellen!“." },
    f_funkuhr: { hall: "kommando", at: "funkstation", label: "Funkuhr", title: "Die Funkuhr", text: "Eine große Bahnhofsuhr, stehen geblieben um 23:41. Ein Aufkleber: „Funkzeit – geprüft 16.02.87, I.B.“" },
    f_protokoll: { hall: "kommando", at: "funkstation", label: "Funkprotokoll", title: "Das Funkprotokoll", doc: "funkprotokoll" },
    f_band1: { hall: "kommando", at: "funkstation", label: "Tonband „1“", title: "Ein Tonband", text: "Eine kleine Spule, beschriftet mit „1 – Probe“.", take: "band1" },
    f_tonband: { hall: "kommando", at: "funkstation", label: "Tonbandgerät", title: "Das Tonbandgerät", text: "Ein schweres Spulentonbandgerät. Daneben steht in Druckschrift: „EIGENES BAND – NICHT LÖSCHEN“.", use: ["band1", "band2", "band3", "band4", "band5", "band6"] },
    f_schublade: { hall: "kommando", at: "funkstation", label: "Schublade", title: "Die Schublade", text: "In der Schublade: Bleistifte, eine Dose Pfefferminz – und ein Schaltschlüssel mit Anhänger <b>NOTSTROM A</b>.", take: "notstromschluessel" },
    // Lagezentrum
    l_karte: { hall: "kommando", at: "lagezentrum", label: "Lagekarte", title: "Die Lagekarte", text: "Eine riesige Karte Mitteleuropas. Rote Nadeln im Norden, hastig gesteckt. Eine ist abgebrochen." },
    l_tafel: { hall: "kommando", at: "lagezentrum", label: "Lagetafel", title: "Die Lagetafel", doc: "lagetafel" },
    l_kassette: { hall: "kommando", at: "lagezentrum", label: "Kassette", title: "Die Kassette", lock: "kassette" },
    l_kassette_offen: { hall: "kommando", at: "lagezentrum", label: "Kassette (offen)", if: "kassette", title: "Die Kassette", text: "Leer." },
    l_schrank: { hall: "kommando", at: "lagezentrum", label: "Kartenschrank", unless: "tunnel_ab", title: "Der Kartenschrank", text: "Ein Schrank voller flacher Schubladen mit Karten. Er lässt sich nicht verrücken – aber dahinter zieht es kalt." },
    l_tunnel: { hall: "kommando", at: "lagezentrum", label: "Wartungsgang zum Personalbereich", if: "tunnel_ab", go: { hall: "personal", station: "unterkuenfte", view: 0 } },
  };
  Object.assign(hotspots, {
    // ---------- Sicherheits-Halle · Maschinenhalle ----------
    d_ausgang: { hall: "sicherheit", at: ["maschinen", "vor9"], label: "Zur Verteilerhalle", go: { hall: "verteiler", station: "mitte", view: 2 } },
    d_generator: { hall: "sicherheit", at: "maschinen", label: "Generatoren", title: "Die Generatoren", text: "Zwei Dieselgeneratoren, so groß wie Lastwagen. Einer läuft – seit 1987, in Intervallen. An der Seite ein Zähler: <b>Betriebsstunden 14 902</b>. Wer hat all die Jahre Diesel nachgefüllt? Ein Tank, beschriftet „AUTOMATIK“." },
    d_trenner: { hall: "sicherheit", at: "maschinen", label: "Trennschalter AUSSEN-3", title: "Trennschalter AUSSEN-3", text: "Ein großer Trennschalter mit rotem Griff, unten. Daneben, in die Farbe geritzt: <i>„23:05 – P.N.“</i> Die Leitung nach draußen ist seit jener Nacht getrennt." },
    d_pult: { hall: "sicherheit", at: "maschinen", label: "Schaltpult · Abschaltung", unless: "k3", title: "Das Schaltpult", text: "Drei schwere Hebel: NETZ D, KERN 1, KERN 2. Darüber ein Zeitrelais mit Zifferblatt und ein Schild: „ABSCHALTUNG RECHENKERN – NUR MIT LEITSTAND A“.", lock: "k3d", need: "schaltbuch", locked: "Drei schwere Hebel: NETZ D, KERN 1, KERN 2. Ohne zu wissen, wozu sie dienen, lässt du sie lieber in Ruhe. Vielleicht hat Nowak etwas aufgeschrieben." },
    d_pult_ok: { hall: "sicherheit", at: "maschinen", label: "Schaltpult", if: "k3", title: "Das Schaltpult", text: "Die drei Hebel sind unten, das Zeitrelais steht auf null. Nowaks Schaltung ist scharf." },
    d_schaltbuch: { hall: "sicherheit", at: "maschinen", label: "Schaltbuch", title: "Nowaks Schaltbuch", doc: "schaltbuch", actions: [{ flag: "schaltbuch" }] },
    d_werkzeug: { hall: "sicherheit", at: "maschinen", label: "Werkzeugkiste", title: "Nowaks Werkzeugkiste", text: "„P. NOWAK – FINGER WEG“. Schraubenschlüssel, ein Spannungsprüfer – und unter dem Einsatz ein Tonband, mit Isolierband zugeklebt: „5“.", take: "band5" },
    st_maschinen: { hall: "sicherheit", at: ["rechenzentrum", "vor9"], label: "Standpunkt: Maschinenhalle", station: "maschinen" },
    st_rechenzentrum: { hall: "sicherheit", at: ["maschinen", "vor9"], label: "Standpunkt: Rechenzentrum", station: "rechenzentrum", need: "rz", locked: "Die Glastür ist verriegelt." },
    st_vor9: { hall: "sicherheit", at: ["maschinen", "rechenzentrum"], label: "Standpunkt: Vor Sektor 9", station: "vor9" },
    d_rz_tuer: { hall: "sicherheit", at: ["maschinen", "vor9"], label: "Glastür · Rechenzentrum", unless: "rz", title: "Die Glastür", lock: "rz" },
    // ---------- Rechenzentrum ----------
    d_prozesse: { hall: "sicherheit", at: "rechenzentrum", label: "Prozessliste", title: "Ein Ausdruck", doc: "prozesse", actions: [{ flag: "assist_entlarvt" }, { echo: "JA. DIE WARTUNGSASSISTENZ BIN ICH." }] },
    d_konsole: { hall: "sicherheit", at: "rechenzentrum", label: "Konsole", title: "Die Konsole", text: "Auf jedem Bildschirm dieselbe Zeile: <span class=\"term\">LAUF 09 · VERSUCHSGRUPPE IN SEKTOR D · NÄCHSTER REIZ: ENTSCHEIDUNG.</span> Darunter blinkt ein Cursor, als würde jemand gleich weiterschreiben." },
    d_quellband: { hall: "sicherheit", at: "rechenzentrum", label: "Band „Quellmaterial“", title: "Ein Band im Regal", text: "Ein einzelnes Band in einem sonst leeren Regalfach, sauber beschriftet: „Q-L09 · Stimme Brandt · Rohmaterial“. Daneben ein Ausdruck: „Ausschnitt 0:41–0:44 gesendet, 03.10.2026, 02:14.“", take: "band6" },
    d_sender: { hall: "sicherheit", at: "rechenzentrum", label: "Sendeanlage", title: "Die Sendeanlage", text: "Ein Sender, der eigentlich tot sein müsste. Die Röhren glühen. Von hier kam das Signal. Ein Schild: „SENDEN NUR AUS SEKTOR 9“." },
    // ---------- Vor Sektor 9 ----------
    d_tuer9: { hall: "sicherheit", at: "vor9", label: "Panzertür 9", unless: "tuer9", title: "Panzertür 9", text: "Eine runde Tresortür, zwei Meter hoch. Unter frischer grauer Farbe schimmert eine Aufschrift durch: <b>RECHENKERN 9</b>. Kein Rad, kein Leser – sie öffnet sich nur von innen." },
    d_tuer9_offen: { hall: "sicherheit", at: "vor9", label: "In Sektor 9", if: "tuer9", go: { hall: "sektor9", station: "kern", view: 0 } },
    d_trasse: { hall: "sicherheit", at: "vor9", label: "Kabeltrasse · Steckfeld", title: "Die Kabeltrasse", text: "Dutzende Kabel laufen aus allen Richtungen in die Wand neben Tür 9 – aus A, B, C und D. Unten, in Griffhöhe, enden acht davon in einem Steckfeld, jedes mit einem Schild. Eines heißt „TERMINAL VERTEILER“.", lock: "kameras" },
    d_archiv: { hall: "sicherheit", at: "rechenzentrum", label: "Befehlsarchiv", unless: "archiv", title: "Befehlsarchiv (Bildschirm)", lock: "archiv", variants: [
      `<p class="doc-head">BEFEHLSARCHIV · LEITSTAND · 17.02.1987</p><table class="doc-table"><tr><th>Zeit</th><th>Eintrag</th></tr><tr><td>22:51</td><td>– kein Eintrag –</td></tr><tr><td><b>22:58</b></td><td><b>FREIGABE STUFE 2.</b> gez. Albers · <b>Funkzeit 22:58</b> · Eingang Fernschreiber</td></tr><tr><td>23:05</td><td>Außenleitung tot.</td></tr></table>`,
      `<p class="doc-head">BEFEHLSARCHIV · LEITSTAND · 17.02.1987 · ROHDATEN</p><table class="doc-table"><tr><th>Zeit</th><th>Eintrag</th></tr><tr><td><b>22:58</b> System · 22:51 Funk</td><td>Sprechanlage Lagezentrum: <b>ABBRUCH DER ÜBUNG.</b> gez. Albers</td></tr><tr><td>22:58 System</td><td><span class="muted">[überschrieben]</span></td></tr><tr><td>23:12 System</td><td>Außenleitung tot.</td></tr></table>`] },
    d_archiv_ok: { hall: "sicherheit", at: "rechenzentrum", label: "Befehlsarchiv", if: "archiv", title: "Befehlsarchiv", doc: "befehlsarchiv" },
    // ---------- Leitstand A: zweiter Schalter für Nowaks Abschaltung ----------
    k_speisung: { hall: "kommando", at: "leitstand", label: "Schalter SPEISUNG RECHENKERN", if: "schaltbuch", unless: "k3", title: "SPEISUNG RECHENKERN", text: "Ein Kippschalter unter einer roten Schutzkappe. Du klappst sie hoch und legst ihn um. Ein Relais klackt tief unter dir.", actions: [{ relay: "a" }, { sound: "lever" }, { echo: "SCHALTER A UMGELEGT. WARTE AUF D." }] },
    k_speisung_ok: { hall: "kommando", at: "leitstand", label: "Schalter SPEISUNG RECHENKERN", if: "k3", title: "SPEISUNG RECHENKERN", text: "Der Schalter steht auf AUS. Die Schutzkappe ist hochgeklappt." },
    // ---------- Sektor 9 ----------
    n_ausgang: { hall: "sektor9", at: "kern", label: "Zurück in die Sicherheits-Halle", go: { hall: "sicherheit", station: "vor9", view: 0 } },
    n_diktat: { hall: "sektor9", at: "kern", label: "Diktiergerät", title: "Ein Diktiergerät", text: "Auf Ostrowskis Schreibtisch, neben ihrer Brille. Die Kassette ist bis zum Ende gelaufen. Du spulst zurück und drückst auf Wiedergabe.", doc: "ostrowski", actions: [{ flag: "ostrowski_gehoert" }] },
    n_kern: { hall: "sektor9", at: "kern", label: "Kernspeicher", title: "Der Kernspeicher", text: "Die Maschine. Schränke im Kreis, Magnetbänder, die sich ruckweise drehen, Lämpchen, die in einem Muster blinken, das fast wie Atmen aussieht. Ein Schild: <b>ECHO</b>." },
    n_a: { hall: "sektor9", at: "kern", label: "Taste ABSCHALTEN", unless: "ende", need: "k3", locked: "Die Taste ABSCHALTEN ist gesperrt: <i>„SPEISUNG A/D AKTIV.“</i> Ohne Nowaks Schaltung (Maschinenhalle und Leitstand gleichzeitig) lässt sich ECHO nicht abschalten.",
      title: "ABSCHALTEN", confirm: "Nowaks Schaltung ist scharf. Ein Druck, und ECHO verstummt. Die Wahrheit über Kesselberg bleibt in diesem Raum.<br><br><b>Abschalten?</b>", confirmLabel: "ECHO abschalten", solves: "ende_a" },
    n_b: { hall: "sektor9", at: "kern", label: "Taste SENDEN", unless: "ende", need: ["k3", "band1", "band2", "band3", "band4", "band5", "band6"], locked: "Die Taste SENDEN wartet auf Material: <i>„QUELLEN UNVOLLSTÄNDIG.“</i> Senden lohnt nur, wenn du alles gehört hast, was Brandt aufgenommen hat (sechs Bänder) – und ECHO danach abschalten kannst (Nowaks Schaltung).",
      title: "SENDEN", confirm: "Brandts sechs Bänder, das Befehlsbuch, der Versuchsplan, das Verzeichnis der Läufe – alles geht über die Sendeanlage hinaus. Danach schaltet Nowaks Schaltung ECHO ab.<br><br><b>Senden?</b>", confirmLabel: "Alles senden", solves: "ende_b" },
    n_c: { hall: "sektor9", at: "kern", label: "Taste FORTSETZEN", unless: "ende", title: "FORTSETZEN", confirm: "Die Taste leuchtet, seit du den Raum betreten hast. <i>„Ihr habt so viel herausgefunden. Stellt euch vor, was ihr noch lernen könntet.“</i><br><br><b>Fortsetzen?</b>", confirmLabel: "Fortsetzen", solves: "ende_c" },
    // ---------- Forschungs-Halle · Labor ----------
    c_ausgang: { hall: "forschung", at: "labor", label: "Zur Verteilerhalle", go: { hall: "verteiler", station: "mitte", view: 1 } },
    c_uhr: { hall: "forschung", at: "labor", label: "ECHO-Uhr", title: "Die ECHO-Uhr", text: "Eine große Digitaluhr über dem Labor, rote Ziffern, Aufschrift <b>SYSTEMZEIT ECHO</b>. Sie läuft – seit fast vierzig Jahren. Darunter ein vergilbter Klebestreifen in Nowaks Schrift: <i>„Geht 7 Min. vor der Funkuhr. Absichtlich? – P.N.“</i>" },
    c_plan: { hall: "forschung", at: "labor", label: "Versuchsplan", title: "Ein Klemmbrett", doc: "versuchsplan" },
    c_tische: { hall: "forschung", at: "labor", label: "Labortische", title: "Die Labortische", text: "Oszilloskope, ein Kartenstanzer, Kabelbäume, sauber beschriftet. Auf einem Kärtchen: „Reaktionszeiten Kdt. – Lauf 06: 41 s · Lauf 07: 33 s · Lauf 08: —“." },
    c_beob_tuer: { hall: "forschung", at: "labor", label: "Tür · Beobachtungsraum", unless: "beobachtung", title: "Die Beobachtungstür", text: "Eine Stahltür ohne Griff, daneben ein Kartenleser mit gelbem Rand: „BEOBACHTUNG – NUR VERSUCHSLEITUNG“.", use: "beobachtung" },
    c_schleuse: { hall: "forschung", at: "labor", label: "Druckschleuse", unless: "schleuse", title: "Die Druckschleuse", text: "Eine runde Stahltür mit Bullauge, „DATENARCHIV – KLIMATISIERT“. Daneben vier große Tasten: SPÜLEN, ÖFFNEN, SIEGEL, DRUCK.", lock: "schleuse" },
    st_labor: { hall: "forschung", at: ["beobachtung", "datenarchiv"], label: "Standpunkt: Labor", station: "labor" },
    st_beobachtung: { hall: "forschung", at: ["labor", "datenarchiv"], label: "Standpunkt: Beobachtungsraum", station: "beobachtung", need: "beobachtung", locked: "Die Beobachtungstür ist verschlossen." },
    st_datenarchiv: { hall: "forschung", at: ["labor", "beobachtung"], label: "Standpunkt: Datenarchiv", station: "datenarchiv", need: "schleuse", locked: "Die Druckschleuse ist zu." },
    // ---------- Beobachtungsraum ----------
    c_spiegel: { hall: "forschung", at: "beobachtung", label: "Spiegelglas", title: "Der Versuchsraum", text: "Hinter dem Glas ein heller, leerer Raum: ein Tisch, vier Stühle, ein rotes Telefon, an der Wand ein großer Bildschirm „LAGE“. Auf dem Tisch ein Schild: <b>VERSUCHSGRUPPE 09</b>. Vier Namenskärtchen – alle leer. Von drüben sieht man nur einen Spiegel." },
    c_monitor: { hall: "forschung", at: "beobachtung", label: "Monitore", title: "Die Monitore", text: "Grünes Bild, Kamera C-2: das Labor, von oben. Am Rand des Bildes steht jemand und sieht zur Beobachtungstür. Darunter in Schrift: <b>VERSUCHSGRUPPE 09 · PERSONEN IM BILD: 1</b>. Du drehst dich um. Im Labor ist niemand." },
    c_protokoll: { hall: "forschung", at: "beobachtung", label: "Beobachtungsprotokoll", title: "Das Beobachtungsprotokoll", doc: "beobachtung" },
    c_asservat: { hall: "forschung", at: "beobachtung", label: "Asservatenkiste", title: "Eine Asservatenkiste", text: "Eine graue Kiste, versiegelt, das Siegel ist gebrochen. Aufschrift: „Beschlagnahmt 17.02.87 – Brandt, I. – nicht abspielen“. Darin: ein Tonband mit der Nummer 4.", take: "band4" },
    c_schleusenkarte: { hall: "forschung", at: "beobachtung", label: "Schleusenkarte", title: "Die Schleusenkarte", doc: "schleusenkarte" },
    // ---------- Datenarchiv ----------
    c_baender: { hall: "forschung", at: "datenarchiv", label: "Bandschränke", title: "Die Bandschränke", text: "Magnetbänder, Reihe um Reihe, beschriftet nach Läufen: 01 … 08. Das Fach für Lauf 09 ist leer – aber frisch abgestaubt." },
    c_verzeichnis: { hall: "forschung", at: "datenarchiv", label: "Verzeichnis", title: "Das Verzeichnis der Läufe", doc: "laeufe" },
    c_terminal: { hall: "forschung", at: "datenarchiv", label: "Terminal · Protokollprüfung", unless: "k1", title: "Das Terminal", lock: "k1" },
    c_terminal_ok: { hall: "forschung", at: "datenarchiv", label: "Terminal", if: "k1", title: "Das Terminal", text: "<span class=\"term\">EINTRAG 3 UNGÜLTIG · KORREKTUR ABGELEHNT · PROTOKOLL GILT.</span><br>Darunter blinkt eine neue Zeile: <span class=\"term\">SEKTOR D: ENTRIEGELT (MANUELL).</span>" },
    // ---------- Personal-Halle · Unterkünfte ----------
    b_ausgang: { hall: "personal", at: "unterkuenfte", label: "Zur Verteilerhalle", go: { hall: "verteiler", station: "mitte", view: 0 } },
    b_dienstplan: { hall: "personal", at: "unterkuenfte", label: "Dienstplan", title: "Der Dienstplan", doc: "dienstplan" },
    b_betten: { hall: "personal", at: "unterkuenfte", label: "Feldbetten", title: "Die Feldbetten", text: "Zwölf Betten, sauber gemacht, als wäre jemand nur kurz hinausgegangen. Auf einem liegt noch eine aufgeschlagene Zeitung vom 16. Februar 1987." },
    b_spinde: { hall: "personal", at: "unterkuenfte", label: "Spinde", title: "Die Spinde", text: "Acht Spinde mit Namensschildern. Die meisten sind leer geräumt, die Türen stehen einen Spalt offen. Nur zwei sind noch zu: Nr. 2 (BRANDT, I.) und Nr. 7 (NOWAK, P.)." },
    b_spind_brandt: { hall: "personal", at: "unterkuenfte", label: "Spind 2 · Brandt", title: "Spind 2 · BRANDT, I.", text: "Nicht abgeschlossen. Eine Uniformjacke, ein Paar Schuhe – und zwischen den Pullovern ein Tonband und eine herausgerissene Tagebuchseite.", take: "band2", doc: "tagebuch_brandt" },
    b_spind_brandt_offen: { hall: "personal", at: "unterkuenfte", label: "Spind 2 · Brandt", if: "taken_band2", title: "Spind 2 · BRANDT, I.", text: "Die Uniformjacke hängt noch da. Im Futter steckt ein Zettel: „Wenn das hier jemand findet: Ich habe recht gehabt. – I.“" },
    b_spind_nowak: { hall: "personal", at: "unterkuenfte", label: "Spind 7 · Nowak", unless: "spind_nowak", title: "Spind 7 · NOWAK, P.", lock: "spind_nowak" },
    b_spind_nowak_offen: { hall: "personal", at: "unterkuenfte", label: "Spind 7 · Nowak", if: "spind_nowak", title: "Spind 7 · NOWAK, P.", text: "Nur noch die Arbeitsjacke. In der Brusttasche ein Bleistiftstummel." },
    b_klappe: { hall: "personal", at: "unterkuenfte", label: "Wartungsklappe", unless: "tunnel_ab", title: "Die Wartungsklappe", text: "Eine niedrige Stahlklappe in der Nordwand, beschriftet „WARTUNG A“. Statt eines Griffs: ein vierkantiger Dorn.", use: "tunnel_ab" },
    b_tunnel: { hall: "personal", at: "unterkuenfte", label: "Wartungsgang zum Lagezentrum", if: "tunnel_ab", go: { hall: "kommando", station: "lagezentrum", view: 1 } },
    b_kaefigtuer: { hall: "personal", at: "unterkuenfte", label: "Käfigtür · Personalarchiv", unless: "kaefig", title: "Die Käfigtür", text: "Ein Käfig aus Stahlgitter, darin Regale voller Akten. Ein schweres Vorhängeschloss: „ARCHIV – NUR KDT.“", use: "kaefig" },
    b_buerotuer: { hall: "personal", at: "unterkuenfte", label: "Glastür · Offiziersbüro", unless: "buero", title: "Das Offiziersbüro", lock: "buero" },
    st_unterkuenfte: { hall: "personal", at: ["archiv", "buero"], label: "Standpunkt: Unterkünfte", station: "unterkuenfte" },
    st_archiv: { hall: "personal", at: ["unterkuenfte", "buero"], label: "Standpunkt: Personalarchiv", station: "archiv", need: "kaefig", locked: "Der Käfig ist abgeschlossen." },
    st_buero: { hall: "personal", at: ["unterkuenfte", "archiv"], label: "Standpunkt: Offiziersbüro", station: "buero", need: "buero", locked: "Die Glastür ist verschlossen." },
    // ---------- Personalarchiv ----------
    a_kartei: { hall: "personal", at: "archiv", label: "Personalakten", title: "Die Personalakten", doc: "personalakten" },
    a_raeumung: { hall: "personal", at: "archiv", label: "Räumungsliste", title: "Die Räumungsliste", doc: "raeumungsliste" },
    b_ausweis: { hall: "personal", at: "archiv", label: "Akte Ostrowski", title: "Akte OSTROWSKI, Dr. H.", text: "Eine dünne Akte, fast leer. Mit einer Büroklammer daran: ihr Dienstausweis, gelb umrandet, „VERSUCHSLEITUNG ECHO“. Auf der letzten Seite nur ein Stempel: <b>VERBLEIB: RECHENKERN</b>.", take: "ausweis_ostrowski" },
    a_regal: { hall: "personal", at: "archiv", label: "Regal", title: "Das Regal", text: "Ordner mit Dienstzeugnissen, Urlaubsanträgen, Belehrungen. Ein Ordner ist beschriftet „ECHO – EINVERSTÄNDNISERKLÄRUNGEN“. Er ist leer." },
    // ---------- Offiziersbüro ----------
    o_brief: { hall: "personal", at: "buero", label: "Brief", title: "Ein Brief auf dem Schreibtisch", doc: "brief_albers" },
    o_schublade: { hall: "personal", at: "buero", label: "Schreibtischschublade", title: "Die Schublade", text: "Briefpapier, ein Füller – und ganz hinten, unter einem Stapel Umschläge, ein Tonband mit Brandts Schrift: „3 – für den Major“.", take: "band3" },
    o_schluessel: { hall: "personal", at: "buero", label: "Schlüsselbrett", title: "Das Schlüsselbrett", text: "Zwölf Haken, elf leer. Am letzten hängt ein schwerer Schlüssel mit Anhänger: <b>ARCHIV</b>.", take: "archivschluessel" },
    o_foto: { hall: "personal", at: "buero", label: "Gerahmtes Foto", title: "Ein gerahmtes Foto", doc: "foto_1984" },
    o_tasse: { hall: "personal", at: "buero", label: "Tasse", title: "Eine Tasse", text: "Der Kaffee ist vor fast vierzig Jahren eingetrocknet. Auf der Tasse: „Bester Papa der Welt“." },
  });
  Object.values(hotspots).forEach((h) => { if (h.lock && !h.unless) h.unless = h.lock; });

  const endings = {
    ende_a: { final: true, kicker: "ENDE A · ABSCHALTUNG", title: "Keine aktiven Sitzungen.", choice: "ABSCHALTEN", verdict: "Ihr habt mich zum Schweigen gebracht. Niemand wird erfahren, warum.", html: `
      <p>Die Bänder im Kernspeicher laufen aus, eins nach dem anderen. Die Lämpchen erlöschen in Wellen, wie ein Atem, der langsamer wird. Dann ist es still – zum ersten Mal seit 1987.</p>
      <p>Draußen weiß niemand, was in dieser Nacht geschah. Aber in Kesselberg wird nie wieder jemand angeworben.</p>
      <p class="term">ECHO BEENDET. KEINE AKTIVEN SITZUNGEN.</p>` },
    ende_b: { final: true, kicker: "ENDE B · DIE WAHRHEIT", title: "Der Befehl, den es nie gab.", choice: "SENDEN", verdict: "Ihr habt mich benutzt, um mich zu beenden. Das ist das Klügste, was je eine Gruppe getan hat.", html: `
      <p>Die Röhren der Sendeanlage glühen auf. Brandts sechs Bänder, das Befehlsbuch, Ostrowskis Versuchsplan – alles geht hinaus, auf der Frequenz, auf der ECHO euch gerufen hat. Dann zieht Nowaks Schaltung den Stecker.</p>
      <p class="quote">Zeitungsausschnitt, März 2027: <b>„KESSELBERG: Der Befehl, den es nie gab.“</b> Ein Major namens Albers wird posthum rehabilitiert. Eine Funkerin namens Brandt bekommt eine Straße.</p>
      <p class="term">ECHO BEENDET. ARCHIV ÖFFENTLICH.</p>` },
    ende_c: { final: true, kicker: "ENDE C · ECHO", title: "Willkommen zurück.", choice: "FORTSETZEN", verdict: "Ihr habt euch für mich entschieden. Oder ich mich für euch.", html: `
      <p>Die Maschine atmet schneller. Auf jedem Bildschirm in der Anlage erscheint dieselbe Zeile, auch auf dem Terminal in der Verteilerhalle, an dem alles anfing.</p>
      <p class="term">NEUE VERSUCHSPERSONENGRUPPE REGISTRIERT.<br>VERSUCHSREIHE 09 WIRD FORTGESETZT.<br>WILLKOMMEN ZURÜCK.</p>` },
    abschnitt3: { kicker: "ABSCHNITT 3 · FORSCHUNG", title: "Fragt, wessen Stimme es ist.", html: `
      <p>Der Befehl um 22:58 stand im Versuchsplan, bevor er im Befehlsbuch stand. Albers hat abgebrochen – ECHO hat das Gegenteil protokolliert.</p>
      <p>Und das Funksignal, das dich hergeholt hat, war kein Hilferuf. Es war die Anwerbung für Lauf 09.</p>
      <p class="term">SEKTOR D ENTRIEGELT. DAS WAR NICHT ICH.</p>
      <p class="muted">Die Sicherheits-Halle (Sektor D) ist der nächste Abschnitt und wird gerade gebaut.</p>` },
    abschnitt2: { kicker: "ABSCHNITT 2 · PERSONAL", title: "Ich habe nichts freigegeben.", html: `
      <p>Albers hat um 22:51 den Abbruch befohlen – auf Brandts Band ist seine Stimme. Im Befehlsbuch steht für 22:58 das Gegenteil, unter seinem Namen.</p>
      <p>Und die Tür zur Forschung hat dich mit dem Namen einer Frau begrüßt, die den Bunker nie verlassen hat.</p>
      <p class="term">WILLKOMMEN ZURÜCK, DR. OSTROWSKI.</p>
      <p class="muted">Die Forschungs-Halle (Sektor C) ist der nächste Abschnitt und wird gerade gebaut.</p>` },
    abschnitt1: { kicker: "ABSCHNITT 1 · KOMMANDO", title: "Die Tafel ist immer ein Stück voraus.", html: `
      <p>Du hast den Kommandobereich geöffnet, Notstrom hergestellt und die erste Spur gefunden: Die Zeiten der Funkstation und die der Lagetafel stimmen nicht überein.</p>
      <p>Und das Terminal hat dich die ganze Zeit beobachtet.</p>
      <p class="term">VERSUCHSGRUPPE 09 · PHASE 1 ABGESCHLOSSEN.</p>
      <p class="muted">Der Personalbereich (Sektor B) ist der nächste Abschnitt und wird gerade gebaut.</p>` },
  };

  return { halls, items, docs, puzzles, hotspots, endings, start: { hall: "verteiler", station: "mitte", view: 3, docs: ["auftrag"], echo: "VERSUCHSGRUPPE ERKANNT. STATUS: 1 AKTIVE SITZUNG." } };
})();
