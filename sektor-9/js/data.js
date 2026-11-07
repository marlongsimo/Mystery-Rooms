/*
 * SEKTOR 9 – Inhalte: Abschnitt 1 (Verteilerhalle, Kommando-Halle A) und Abschnitt 2 (Personal-Halle B)
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
    forschung: { name: "Forschungs-Halle", sector: "C", pos: "e", need: "tuer_c", lockedText: "Panzertür Ost – verriegelt", stations: { labor: { name: "Labor", views: ["", "", "", ""] } } },
    sicherheit: { name: "Sicherheits-Halle", sector: "D", pos: "s", need: "nie", lockedText: "Panzertür Süd – verriegelt", stations: { maschinen: { name: "Maschinenhalle", views: ["", "", "", ""] } } },
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
  };

  const docs = {
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
      onSolve: [{ flag: "tuer_c" }, { sound: "gate" }, { echo: "WILLKOMMEN ZURÜCK, DR. OSTROWSKI." }, { end: "abschnitt2", delay: 3400 }],
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
    v_tuer_c_offen: { hall: "verteiler", at: "mitte", label: "Zur Forschung", if: "tuer_c", title: "Panzertür Ost · FORSCHUNG C", text: "Die Tür steht offen. Kalte, weiße Luft. Die Forschungs-Halle ist der nächste Abschnitt und wird gerade gebaut." },
    v_tuer_d: { hall: "verteiler", at: "mitte", label: "Panzertür Süd", title: "Panzertür Süd · SICHERHEIT D", text: "Die schwerste Tür der Halle. Kein Griff, kein Leser. Durch den Spalt am Boden dringt ein schwaches, gleichmäßiges Brummen." },
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
    f_tonband: { hall: "kommando", at: "funkstation", label: "Tonbandgerät", title: "Das Tonbandgerät", text: "Ein schweres Spulentonbandgerät. Daneben steht in Druckschrift: „EIGENES BAND – NICHT LÖSCHEN“.", use: ["band1", "band2", "band3"] },
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
