/*
 * SEKTOR 9 – Inhalte des ersten Abschnitts: Verteilerhalle und Kommando-Halle (Sektor A)
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
    personal: { name: "Personal-Halle", sector: "B", pos: "n", need: "tuer_b", lockedText: "Panzertür Nord – Kartenleser", stations: { unterkuenfte: { name: "Unterkünfte", views: ["", "", "", ""] } } },
    forschung: { name: "Forschungs-Halle", sector: "C", pos: "e", need: "nie", lockedText: "Panzertür Ost – verriegelt", stations: { labor: { name: "Labor", views: ["", "", "", ""] } } },
    sicherheit: { name: "Sicherheits-Halle", sector: "D", pos: "s", need: "nie", lockedText: "Panzertür Süd – verriegelt", stations: { maschinen: { name: "Maschinenhalle", views: ["", "", "", ""] } } },
  };

  const items = {
    notstromschluessel: { name: "Schaltschlüssel „Notstrom A“", icon: "⚿" },
    band1: { name: "Tonband „1“", icon: "◎" },
    karte_b: { name: "Ausweiskarte „Personal B“", icon: "▭" },
  };

  const docs = {
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
      onSolve: [{ flag: "tuer_b" }, { sound: "gate" }, { echo: "VERSUCHSGRUPPE 09 · PHASE 1 ABGESCHLOSSEN." }, { end: "abschnitt1", delay: 3200 }],
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
    v_tuer_b_offen: { hall: "verteiler", at: "mitte", label: "Zum Personalbereich", if: "tuer_b", title: "Panzertür Nord · PERSONAL B", text: "Die Tür steht offen. Dahinter liegt der Personalbereich – der nächste Abschnitt ist noch im Bau." },
    v_tuer_c: { hall: "verteiler", at: "mitte", label: "Panzertür Ost", title: "Panzertür Ost · FORSCHUNG C", text: "Verriegelt. Neben der Tür ein Schild: „Zutritt nur mit Freigabe der Versuchsleitung“." },
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
    f_tonband: { hall: "kommando", at: "funkstation", label: "Tonbandgerät", title: "Das Tonbandgerät", text: "Ein schweres Spulentonbandgerät. Daneben steht in Druckschrift: „EIGENES BAND – NICHT LÖSCHEN“.", use: "band1" },
    f_schublade: { hall: "kommando", at: "funkstation", label: "Schublade", title: "Die Schublade", text: "In der Schublade: Bleistifte, eine Dose Pfefferminz – und ein Schaltschlüssel mit Anhänger <b>NOTSTROM A</b>.", take: "notstromschluessel" },
    // Lagezentrum
    l_karte: { hall: "kommando", at: "lagezentrum", label: "Lagekarte", title: "Die Lagekarte", text: "Eine riesige Karte Mitteleuropas. Rote Nadeln im Norden, hastig gesteckt. Eine ist abgebrochen." },
    l_tafel: { hall: "kommando", at: "lagezentrum", label: "Lagetafel", title: "Die Lagetafel", doc: "lagetafel" },
    l_kassette: { hall: "kommando", at: "lagezentrum", label: "Kassette", title: "Die Kassette", lock: "kassette" },
    l_kassette_offen: { hall: "kommando", at: "lagezentrum", label: "Kassette (offen)", if: "kassette", title: "Die Kassette", text: "Leer." },
    l_schrank: { hall: "kommando", at: "lagezentrum", label: "Kartenschrank", title: "Der Kartenschrank", text: "Ein Schrank voller flacher Schubladen mit Karten. Er lässt sich nicht verrücken – aber dahinter zieht es kalt." },
  };
  Object.values(hotspots).forEach((h) => { if (h.lock && !h.unless) h.unless = h.lock; });

  const endings = {
    abschnitt1: { kicker: "ABSCHNITT 1 · KOMMANDO", title: "Die Tafel ist immer ein Stück voraus.", html: `
      <p>Du hast den Kommandobereich geöffnet, Notstrom hergestellt und die erste Spur gefunden: Die Zeiten der Funkstation und die der Lagetafel stimmen nicht überein.</p>
      <p>Und das Terminal hat dich die ganze Zeit beobachtet.</p>
      <p class="term">VERSUCHSGRUPPE 09 · PHASE 1 ABGESCHLOSSEN.</p>
      <p class="muted">Der Personalbereich (Sektor B) ist der nächste Abschnitt und wird gerade gebaut.</p>` },
  };

  return { halls, items, docs, puzzles, hotspots, endings, start: { hall: "verteiler", station: "mitte", view: 3, docs: ["auftrag"], echo: "VERSUCHSGRUPPE ERKANNT. STATUS: 1 AKTIVE SITZUNG." } };
})();
