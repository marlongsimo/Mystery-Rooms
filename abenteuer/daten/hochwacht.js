/*
 * Die letzte Fackel von Hochwacht – ENTWURF (Prototyp der Eskorte, siehe KONZEPT-HOCHWACHT.md)
 * Bisher nur Akt I bis zum ersten Kampf: Sera Venn wird gefunden, Hinterhalt am Pass.
 * Im Hub nur sichtbar mit ?entwurf in der Adresse. Karten ohne Bild: M Fels, K niedriger Wall (Deckung), T Baum, Q Wasser.
 */
(function (root) {
  "use strict";
  const M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y], T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y];
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { const f = { M, K, T, "~": Q }[c]; if (f) h.push(f(x, y)); })); return h; };
  /** Seras Lebenspunkte je Akt und Gruppengröße (Startwerte zum Testen, siehe KONZEPT-HOCHWACHT.md B2) */
  const seraTP = (A, akt) => { const gross = A.gruppe.filter((f) => !A.zust[f].tot).length >= 5; return { 1: gross ? 18 : 14, 2: gross ? 28 : 22, 3: gross ? 40 : 30 }[akt]; };

  /* ---------- Karten (12 × 9) ---------- */
  // Der Pass: ein schmaler Weg zwischen Felsen, links der Einstieg, rechts der Ausgang; oben und unten Felsnischen für den Hinterhalt
  const PASS = {
    name: "Der Pass", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MM...MMM...M",
      "M.......K..M",
      "............",
      "............",
      "....K.......",
      "M..........M",
      "MM...MMM...M",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[0, 3], [0, 5], [2, 2], [2, 6]], begleiter: [0, 4],
      gegner: [[9, 1], [9, 7], [10, 1], [10, 7], [8, 1], [8, 7], [11, 3], [11, 5], [10, 2], [10, 6], [9, 3], [9, 5]],
      // Jäger: zuerst am Ausgang, ab dem zweiten auch aus den Felsnischen hinter der Gruppe
      jaeger: [[10, 4], [4, 1], [4, 7], [11, 4], [3, 1], [3, 7]] },
    route: [[3, 4], [6, 4], [9, 4], [11, 4]],
  };
  // Das Jägerlager (Rettung): eine Senke mit Zelten und Feuer, Sera gefesselt am Feuer; die Helden kommen von links
  const LAGER = {
    name: "Das Jägerlager", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "M....TT....M",
      "M..K....K..M",
      "............",
      "......MKM...",
      "............",
      "M..K....K..M",
      "M....TT....M",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[0, 3], [0, 5], [2, 2], [2, 6]], begleiter: [10, 4],
      gegner: [[9, 3], [9, 5], [11, 3], [11, 5], [9, 2], [9, 6], [10, 2], [10, 6], [7, 3], [7, 5], [6, 2], [6, 6]] },
  };
  /* ----- Akt II ----- */
  const sp = [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wo = [[3, 4], [3, 3], [3, 5], [2, 2]];
  // Das Haupttor der Ruine: eine Mauer mit Durchgang in der Mitte, dahinter die Wächter aus Stein
  const TOR = { name: "Das Haupttor", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M.....M....M", "M..K..M....M", "M..........M", "...........M", "M..........M", "M..K..M....M", "M.....M....M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: wo, gegner: [[9, 4], [8, 3], [8, 5], [10, 2], [10, 6], [9, 2], [9, 6], [10, 4]] } };
  // Der Archivgang: drei Gänge zwischen eingestürzten Regalwänden
  const ARCHIV = { name: "Der Archivgang", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M..K..K..K.M", "M..........M", "MM.MMM.MMM.M", "M...........", "M.MMM.MMM.MM", "M..........M", "M.K..K..K..M", "MMMMMMMMMMMM"]),
    start: { spieler: [[1, 4], [1, 2], [1, 6], [2, 4], [2, 2], [2, 6]], wolf: [[3, 4], [3, 2], [3, 6], [2, 1]], gegner: [[10, 4], [11, 4], [10, 2], [10, 6], [10, 1], [10, 7], [8, 2], [8, 6], [9, 4], [7, 4]] } };
  // Der Innenhof: das Signalgerät in der Mitte, Zugänge im Norden und Süden, Mauerreste als Deckung; die Gruppe kommt von Westen
  const HOF = { name: "Der Innenhof", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMM..MMMMM", "M..........M", "M..K....K..M", "M..........M", "...........M", "M..........M", "M..K....K..M", "M..........M", "MMMMM..MMMMM"]),
    start: { spieler: sp, wolf: wo, begleiter: [0, 4],
      gegner: [[5, 1], [6, 1], [5, 7], [6, 7], [4, 1], [7, 1], [4, 7], [7, 7], [9, 1], [9, 7], [10, 3], [10, 5]],
      jaeger: [[5, 0], [6, 8], [6, 0], [5, 8], [7, 1], [4, 7]] },
    route: [[3, 4], [6, 4]] };
  // Der Felsgrat: der Jägerhauptmann stellt sich auf einem schmalen Grat
  const GRAT = { name: "Der Felsgrat", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "MMMM....MMMM", "MM........MM", "M..K....K..M", "............", "M....KK....M", "MM........MM", "MMMM....MMMM", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [2, 2], [2, 6], [4, 4]], begleiter: [10, 4], gegner: [[9, 4], [10, 3], [10, 5], [9, 2], [9, 6], [7, 3], [7, 5], [11, 4]] } };
  /* ----- Akt III ----- */
  // Der offene Wehrgang: ein langer Wehrgang zur Hochwarte, Treppen oben und unten, brüchige Brüstung als Deckung
  const WEHRGANG = { name: "Der offene Wehrgang", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "MM..MMMM..MM", "MK.......K.M", "............", "....K....K..", "............", "MK.......K.M", "MM..MMMM..MM", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: wo, begleiter: [0, 4], gegner: [[11, 3], [11, 5], [10, 2], [10, 6], [8, 2], [8, 6], [11, 4], [7, 3], [7, 5], [9, 3]],
      jaeger: [[11, 4], [2, 1], [9, 7], [3, 7], [8, 1], [11, 3]] },
    route: [[6, 4], [11, 4]] };
  // Die Hochwarte: Plattform mit Säulen, rechts das Signalfeuer; die Gruppe kommt von links
  const HOCHWARTE = { name: "Die Hochwarte", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M..........M", "M..M.M..M..M", "M..........M", "...........M", "M..........M", "M..M.M..M..M", "M..........M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: wo, begleiter: [0, 4], gegner: [[10, 4], [10, 2], [10, 6], [9, 3], [9, 5], [7, 1], [7, 7], [10, 1], [10, 7], [6, 3]],
      jaeger: [[10, 4], [10, 2], [10, 6], [7, 1], [7, 7], [9, 3]] },
    route: [[4, 4], [8, 4]] };
  const KARTEN = { PASS, LAGER, TOR, ARCHIV, HOF, GRAT, WEHRGANG, HOCHWARTE };
  /** Epilog: Brann, Sera, Grauwacht */
  function epilog(A) {
    const m = A.merker, t = [];
    if (m.brann_dabei) t.push("Brann kehrt mit euch ins Tal zurück, auf euren Schultern, und erzählt jedem, der zuhört, vom Wehrgang.");
    else if (m.brann_station) t.push("In der Wegstation findet ihr Brann, mit geschientem Bein und einem Feuer im Ofen. Er hat gewartet.");
    else if (m.brann_zurueck) t.push("Von Brann findet ihr auf dem Rückweg nur den zerrissenen Ordensmantel.");
    if (m.sera_befreit || m.sera_gerettet) t.push("Sera trägt die Spuren der Fesseln noch Wochen später. Sie spricht nie darüber, aber sie dankt euch jedes Mal, wenn ihr euch seht.");
    if (m.grauwacht === "gebrochen") t.push("Der Splitter von Grauwacht summt seitdem leiser. Als hätte er etwas wiedergefunden.");
    else if (m.grauwacht === "verrat") t.push("In Anselms Handschrift findet ihr einen Brief bei den toten Jägern. Ihr verbrennt ihn, ohne ihn zu Ende zu lesen.");
    if (A.gefallen.length) t.push(`Auf dem Grat unter der Hochwarte schichtet ihr Steine für ${A.gefallen.map((f) => (FIG() ? FIG().FIGUREN[f].name : f)).join(", ")}.`);
    return t;
  }
  const FIG = () => root.ABF || (typeof require === "function" ? require("../js/figuren.js") : null);
  /** Eskorte-Kämpfe für die Simulation (tools/eskorte-sim.js): Karte, Stufe, Akt und Seras Aufgabe */
  const ESKORTE = {
    pass: { karte: PASS, stufe: 1, akt: 1, begleiter: (tp) => ({ name: "Sera Venn", tp, start: PASS.start.begleiter, route: PASS.route }) },
    wehrgang: { karte: WEHRGANG, stufe: 3, akt: 3, begleiter: (tp) => ({ name: "Sera Venn", tp, start: WEHRGANG.start.begleiter, route: WEHRGANG.route }) },
    finale: { karte: HOCHWARTE, stufe: 3, akt: 3, begleiter: (tp) => ({ name: "Sera Venn", tp, start: HOCHWARTE.start.begleiter, route: HOCHWARTE.route, aktivierung: { runden: 2, name: "das Signalfeuer", ununterbrochen: true } }) },
    wacht: { karte: HOF, stufe: 2, akt: 2, begleiter: (tp) => ({ name: "Sera Venn", tp, start: HOF.start.begleiter, route: HOF.route, aktivierung: { runden: 2, name: "das Signalgerät" } }) },
  };

  const SZENEN = {
    /* ================= Akt I · Der Überfall am Pass ================= */
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Licht im Norden", ort: "Am Nordpass", weiter: "vorgeschichte",
      text: [
        "Seit drei Nächten brennt im Norden ein Licht, wo seit vierzig Jahren keines mehr war: auf der Hochwarte, der alten Signalwarte des Wachtordens.",
        "Die Leute in den Tälern sagen, das Licht ruft. Wen, weiß niemand. Ihr seid auf dem Weg dorthin, als der Schnee einsetzt.",
      ],
    },
    vorgeschichte: {
      art: "wahl", abschnitt: 1, titel: "Was hinter euch liegt", ort: "Am Nordpass",
      text: ["Bevor es losgeht: Habt ihr das Siegel von Grauwacht schon erlebt? Wie endete es? (Das ändert einzelne Gespräche, nicht den Weg. Wer Grauwacht nicht kennt, wählt „Nicht dabei gewesen“.)"],
      optionen: [
        { id: "erneuert", text: "Wir haben das Siegel erneuert", setzt: { grauwacht: "erneuert" }, weiter: "wegstation" },
        { id: "gebrochen", text: "Wir haben das Siegel gebrochen", setzt: { grauwacht: "gebrochen", splitter: true }, weiter: "wegstation" },
        { id: "verrat", text: "Anselm hat uns verraten", setzt: { grauwacht: "verrat" }, weiter: "wegstation" },
        { id: "nicht", text: "Nicht dabei gewesen", setzt: { grauwacht: "nicht" }, weiter: "wegstation" },
      ],
    },
    wegstation: {
      art: "gespraech", abschnitt: 1, titel: "Die Wegstation", ort: "Am Fuß des Passes",
      text: (A) => [
        "In einer verlassenen Wegstation am Fuß des Passes wartet eine Frau, als hätte sie gewusst, dass ihr kommt. Ihr Mantel ist voller Schnee, in ihren Händen glimmt etwas, warm wie Glut und hell wie ein Stern.",
        "„Sera Venn“, sagt sie. „Botin des Wachtordens. Und ihr seid spät.“",
        A.merker.grauwacht === "gebrochen" ? "Der Splitter von Grauwacht in eurem Gepäck summt, als sie näher kommt. Sera hört es auch. Sie wird blass." : "",
      ],
      optionen: [
        { id: "funke", text: "Nach dem Leuchten in ihren Händen fragen", wer: "Sera", frage: "„Was trägst du da?“",
          antwort: "„Einen Wachtfunken. Den letzten. Mit ihm lässt sich die Hochwarte öffnen und das Signal entzünden. Dann sehen wir, wo das nächste Siegel liegt.“ Sie schließt die Finger darum. „Und alles, was Siegel hasst, kann ihn riechen.“" },
        { id: "jaeger", text: "Nach ihren Verfolgern fragen", wer: "Sera", frage: "„Wer ist hinter dir her?“",
          antwort: "„Siegeljäger. Sie verkaufen, was in den Siegeln steckt, an wen auch immer. Sie wollen nicht euch. Sie wollen mich und den Funken. Wenn ihr kämpft: Lasst sie nicht an mich heran.“", setzt: { jaeger_bekannt: true } },
        { id: "grauwacht", text: "Von Grauwacht erzählen", wer: "Sera", frage: "„Wir kommen aus Grauwacht.“", wenn: (A) => A.merker.grauwacht && A.merker.grauwacht !== "nicht",
          antwort: (A) => A.merker.grauwacht === "erneuert" ? "Sera atmet aus. „Dann hält eines. Gut. Der Orden wird es euch nicht vergessen.“" : A.merker.grauwacht === "gebrochen" ? "„Gebrochen.“ Sie sagt es leise. „Dann wissen die Jäger, dass es sich lohnt. Sie werden früher kommen.“" : "„Anselm“, sagt sie nur. „Seine Briefe haben die Jäger hierher geführt. Ich hatte gehofft, es wäre nicht wahr.“",
          setzt: (A) => (A.merker.grauwacht === "gebrochen" || A.merker.grauwacht === "verrat" ? { jaeger_frueh: true } : { orden_dank: true }) },
        { id: "vorraete", text: "Die Station nach Vorräten durchsuchen", frage: "Ihr durchsucht Regale und Kisten.",
          probe: { name: "Suchen", attr: "WEI", sg: 12, geuebt: ["schurke", "waldlaeufer"], knapp: true,
            erfolg: { text: "Hinter einem losen Brett: zwei Heiltränke und ein Seil. Jemand vom Orden hat vorgesorgt.", tranke: 2, setzt: { seil: true } },
            knapp: { text: "Ein einzelner Heiltrank, halb eingefroren.", tranke: 1 },
            fehl: { text: "Nur leere Flaschen und Mäusedreck." } } },
        { id: "los", text: "Aufbrechen, solange es hell ist", weiter: "route" },
      ],
    },
    route: {
      art: "probe", abschnitt: 1, titel: "Der Weg hinauf", ort: "Der Nordpass",
      text: (A) => ["Der Pass windet sich zwischen Felsen nach oben. Wer kennt sich mit Bergen aus? Eine Person führt.", A.merker.jaeger_bekannt ? "Ihr wisst, wonach ihr Ausschau halten müsst: Vorteil." : ""],
      probe: { name: "Orientierung", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], vorteil: (A) => (A.merker.jaeger_bekannt ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr seht die Spuren im Schnee, bevor ihr in die Falle lauft. Die Jäger in den Felsnischen haben euch noch nicht bemerkt.", setzt: { pass_ueberrascht: true }, weiter: "kampf_pass" },
        knapp: { text: "Ihr findet den Weg, aber nicht die Spuren. Dann knirscht Schnee in den Felsen.", weiter: "kampf_pass" },
        fehl: { text: "Ihr verlauft euch im Schneetreiben und findet erst spät zurück. Die Kälte kriecht in die Knochen.", glocke: 1, weiter: "kampf_pass" } },
    },
    kampf_pass: {
      art: "kampf", abschnitt: 1, titel: "Hinterhalt am Pass", ort: "Der Pass",
      text: ["Die Jäger warten in den Felsnischen. Sera folgt dem Weg nach rechts zum Ausgang, bis zu 2 Felder zu Beginn jeder Runde, aber nur, wenn jemand von euch in der Nähe ist und das nächste Feld nicht direkt bedroht ist. Wer direkt neben ihr steht, fängt einen gezielten Angriff auf sie ab (Reaktion). Fällt sie, habt ihr bis zum Ende der nächsten Runde Zeit, sie zu stabilisieren."],
      kampf: (A) => ({ begegnung: "pass", karte: PASS, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.pass_ueberrascht), skalaMal: A.merker.jaeger_frueh ? 1.1 : 1,
        begleiter: { name: "Sera Venn", titel: "Botin des Wachtordens", tp: seraTP(A, 1), start: PASS.start.begleiter, route: PASS.route },
        sieg: { weiter: "wachmann" }, gefangen: { weiter: "verschleppt" } }),
    },
    wachmann: {
      art: "wahl", abschnitt: 1, titel: "Der Wachmann", ort: "Hinter dem Pass", rastErlaubt: true,
      text: [
        "Hinter dem Pass, im Windschatten eines Felsens, sitzt ein Mann in einem zerrissenen Ordensmantel. Brann, sagt Sera, einer der letzten Wachleute. Sein Bein ist gebrochen. Die Jäger haben ihn liegen lassen, um euch aufzulauern.",
        "„Nehmt mich mit“, sagt er. „Ich kenne die Ruine. Ich weiß, wie man das Tor öffnet.“ Mit ihm kommt ihr langsamer voran. Stimmt ab.",
      ],
      optionen: [
        { id: "mit", text: "Brann mitnehmen (langsamer, aber er kennt die Ruine)", setzt: { brann_dabei: true }, glocke: 1, weiter: "lager_akt1" },
        { id: "station", text: "Ihn mit Vorräten zur Wegstation zurückschicken (ein Heiltrank weniger)", setzt: { brann_station: true }, trankWeg: 1, weiter: "lager_akt1" },
        { id: "zurueck", text: "Ihn zurücklassen", setzt: { brann_zurueck: true }, weiter: "lager_akt1" },
      ],
    },
    // ----- Rettung: Sera wurde verschleppt -----
    verschleppt: {
      art: "probe", abschnitt: 1, titel: "Spuren im Schnee", ort: "Hinter dem Pass",
      text: ["Die Jäger sind fort, und Sera mit ihnen. Im frischen Schnee: Schleifspuren, Stiefelabdrücke, ein Tropfen Blut. Ihr müsst ihnen folgen, bevor der Wind alles zuweht. Alle suchen; gelingt es der Hälfte, findet ihr den Weg."],
      probe: { name: "Spuren lesen", wer: "gruppe", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], knapp: true,
        erfolg: { text: "Die Spuren führen in eine Senke. Rauch steigt auf. Ihr seid da, bevor sie weiterziehen.", setzt: { lager_ueberrascht: true }, weiter: "kampf_lager" },
        knapp: { text: "Ihr findet das Lager, aber erst nach langem Suchen in der Kälte.", glocke: 1, weiter: "kampf_lager" },
        fehl: { text: "Der Wind ist schneller. Als ihr das Lager endlich findet, ist es tief in der Nacht.", glocke: 2, weiter: "kampf_lager" } },
    },
    kampf_lager: {
      art: "kampf", abschnitt: 1, titel: "Das Jägerlager", ort: "Eine Senke im Schnee",
      text: ["Sera liegt gefesselt am Feuer, rechts in der Senke. Die Jäger sind müde, aber sie sind viele. Besiegt sie, dann ist Sera frei."],
      kampf: (A) => ({ begegnung: "pass", karte: LAGER, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.lager_ueberrascht),
        begleiter: { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 1) / 2), start: LAGER.start.begleiter, route: [], ausgang: false, gefesselt: true },
        sieg: { weiter: "befreit" }, gefangen: { weiter: "kampf_lager", glocke: 1 } }),
    },
    befreit: {
      art: "erzaehlung", abschnitt: 1, titel: "Befreit", ort: "Das Jägerlager", weiter: "wachmann", rastErlaubt: true,
      beimEintritt: () => ({ setzt: { sera_befreit: true } }),
      text: ["Ihr schneidet die Fesseln durch. Sera reibt sich die Handgelenke. Der Wachtfunke ist noch da, versteckt in ihrem Ärmel. „Sie haben nicht gesucht“, sagt sie. „Sie dachten, sie hätten Zeit.“", "Sie sieht euch an. „Danke. Das vergesse ich nicht.“"],
    },
    lager_akt1: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer in der Schutzhütte", ort: "Eine Hütte am Grat", aufstieg: 2, weiter: "ruine",
      text: (A) => [
        "Eine alte Schutzhütte des Ordens, halb eingeschneit. Ihr macht Feuer, und zum ersten Mal seit Stunden spürt ihr eure Finger wieder.",
        A.merker.brann_dabei ? "Brann zeichnet mit einem verkohlten Stock die Ruine auf den Boden: zwei Tore, ein Hof, in der Mitte das Signalgerät. „Das Gerät braucht zwei Runden, in denen niemand stört“, sagt er. „Und das Haupttor öffne ich euch. Ich kenne den Spruch.“" : "",
        A.merker.sera_befreit ? "Sera sitzt nah am Feuer und schweigt lange. Dann erzählt sie von ihrer Schwester, die auch Botin war, und nicht zurückkam." : "Sera erzählt vom Orden, von den sieben Siegeln, von einer Zeit, als auf jedem Gipfel ein Licht brannte.",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    /* ================= Akt II · Die stumme Wacht ================= */
    ruine: {
      art: "wahl", abschnitt: 2, titel: "Die Ordensruine", ort: "Die stumme Wacht",
      text: (A) => [
        "Am Morgen seht ihr sie: die Ruine des Wachtordens, schwarz gegen den Schnee. Eine Mauer, ein verschlossenes Haupttor, dahinter ein Hof. Dort steht das Signalgerät, sagt Sera, das den Weg zur Hochwarte zeigt.",
        "Es gibt drei Wege hinein: das Haupttor mit seinem alten Mechanismus, den eingestürzten Archivgang unter der Mauer, oder über die Mauer selbst, wo sie zerfallen ist.",
        A.merker.brann_dabei ? "Brann humpelt auf das Tor zu. „Lasst mich machen.“" : "",
        "Welchen Weg nehmt ihr? Stimmt ab.",
      ],
      optionen: [
        { id: "tor", text: "Durch das Haupttor", weiter: (A) => (A.merker.brann_dabei ? "tor_brann" : "tor_probe") },
        { id: "archiv", text: "Durch den Archivgang (dort lagern die Schriften des Ordens)", weiter: "kampf_archiv" },
        { id: "mauer", text: "Über die zerfallene Mauer klettern", weiter: "mauer" },
      ],
    },
    tor_brann: {
      art: "erzaehlung", abschnitt: 2, titel: "Branns Spruch", ort: "Das Haupttor", weiter: "hof",
      text: ["Brann legt die Hand auf das kalte Metall und murmelt Worte, die ihr nicht versteht. Irgendwo im Stein rastet etwas ein. Das Tor schwingt auf, lautlos, als hätte es nur auf ihn gewartet.", "Hinter dem Tor stehen zwei Wächter aus Stein. Sie rühren sich nicht."],
    },
    tor_probe: {
      art: "probe", abschnitt: 2, titel: "Der Mechanismus", ort: "Das Haupttor",
      text: ["Das Tor hat kein Schloss, sondern ein Rätsel aus Ringen und Zeichen. Wer versteht etwas von alten Mechanismen?"],
      probe: { name: "Mechanismus", attr: "INT", sg: 13, geuebt: ["zauberer"], vorteil: (A, h, fid) => (fid === "gelehrter" ? 1 : 0), knapp: true,
        erfolg: { text: "Die Ringe drehen sich in die richtige Stellung. Das Tor öffnet sich. Die Wächter aus Stein dahinter bleiben stumm.", weiter: "hof" },
        knapp: { text: "Das Tor öffnet sich, aber nur nach vielen Versuchen. Der Wind wird schärfer.", glocke: 1, weiter: "hof" },
        fehl: { text: "Ein falscher Ring – und hinter dem Tor heben die Wächter aus Stein die Köpfe.", weiter: "kampf_tor" } },
    },
    kampf_tor: {
      art: "kampf", abschnitt: 2, titel: "Die Wächter aus Stein", ort: "Das Haupttor",
      text: ["Wachkonstrukte des Ordens stapfen durch den Torbogen: langsam, aber hart wie Fels. Wuchtige Waffen zerbrechen sie leichter."],
      kampf: { begegnung: "tor", karte: TOR, sieg: { weiter: "hof", tranke: 1 } },
    },
    kampf_archiv: {
      art: "kampf", abschnitt: 2, titel: "Im Archivgang", ort: "Unter der Mauer",
      text: ["Im Archivgang ist jemand vor euch gewesen: Siegeljäger durchwühlen die Regale, Kobolde tragen Bücher davon. Die Gänge sind schmal."],
      kampf: { begegnung: "archiv", karte: ARCHIV, sieg: { weiter: "archiv_fund" } },
    },
    archiv_fund: {
      art: "erzaehlung", abschnitt: 2, titel: "Das Wachtbuch", ort: "Der Archivgang", weiter: "hof", rastErlaubt: true,
      beimEintritt: () => ({ setzt: { wachtbuch: true } }),
      text: ["Zwischen zerrissenen Seiten findet ihr ein Buch, das die Jäger übersehen haben: das Wachtbuch des Ordens. Auf einer der letzten Seiten eine Zeichnung, ein Wesen aus Asche und Glut.", "„Der Fackelzehrer“, liest Sera. „Er frisst das Licht. Aber wer ihm Wasser aus den Gletschern ins Feuer wirft, bricht seine Glut.“ Sie steckt das Buch ein."],
    },
    mauer: {
      art: "probe", abschnitt: 2, titel: "Über die Mauer", ort: "Die zerfallene Mauer",
      text: ["Die Mauer ist vereist und bröckelig. Alle klettern; gelingt es der Hälfte, helfen die anderen nach."],
      probe: { name: "Klettern", wer: "gruppe", attr: "GES", sg: 13, geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Oben auf der Mauer habt ihr den ganzen Hof im Blick: beide Tore, die Wege der Jäger. Ihr wisst jetzt, wo sie kommen werden.", setzt: { ueberblick: true }, weiter: "hof" },
        knapp: { text: "Jemand rutscht ab und schlägt hart auf. Aber ihr seid drin.", schaden: "1W6", weiter: "hof" },
        fehl: { text: "Das Eis gibt nach. Ihr fallt, rappelt euch auf und klettert noch einmal. Es dauert.", schaden: "1W6", glocke: 1, weiter: "hof" } },
    },
    hof: {
      art: "gespraech", abschnitt: 2, titel: "Der Innenhof", ort: "Die stumme Wacht",
      text: (A) => [
        "Der Hof ist still. In der Mitte steht das Signalgerät: ein Gestell aus Messing und Kristall, so hoch wie ein Mensch. Sera legt die Hand darauf. „Zwei Runden“, sagt sie. „Wenn mich niemand stört.“",
        "Im Norden und Süden führen Tore in den Hof. Von draußen hört ihr Stimmen, Stiefel im Schnee. Die Jäger sind euch gefolgt.",
        A.merker.ueberblick ? "Von der Mauer aus habt ihr gesehen, wo sie kommen werden." : "",
      ],
      optionen: [
        { id: "barrikade", text: "Das Südtor verbarrikadieren", frage: "Ihr stemmt euch gegen das alte Tor und verkeilt es mit Trümmern.", wenn: (A) => !A.merker.barrikade,
          probe: { name: "Kraftakt", attr: "STR", sg: 13, geuebt: ["krieger"], knapp: true,
            erfolg: { text: "Das Südtor sitzt fest. Wer jetzt kommt, muss durch das Nordtor.", setzt: { barrikade: true } },
            knapp: { text: "Es hält – ein bisschen. Es wird sie aufhalten, nicht aussperren.", setzt: { barrikade_halb: true } },
            fehl: { text: "Das Tor bewegt sich keinen Fingerbreit." } } },
        { id: "fallen", text: "Fallen im Schnee auslegen", wer: "Ein Schurke", frage: "Ihr legt Stolperdrähte und Krähenfüße unter den Schnee.", wenn: (A, h) => Boolean(h.klasse(A, "schurke")),
          antwort: "Wer durch die Tore stürmt, wird es merken.", setzt: { fallen: true } },
        { id: "brann", text: "Brann am Nordtor postieren", wer: "Brann", frage: "„Kannst du das Tor halten?“", wenn: (A) => Boolean(A.merker.brann_dabei),
          antwort: "„Sitzend? Ja.“ Er grinst schief und lehnt sich mit der Armbrust an den Torbogen. „Einen oder zwei hole ich.“", setzt: { brann_tor: true } },
        { id: "los", text: "„Sera, fang an.“", weiter: "kampf_wacht" },
      ],
    },
    kampf_wacht: {
      art: "kampf", abschnitt: 2, titel: "Die stumme Wacht", ort: "Der Innenhof",
      text: ["Sera geht zum Signalgerät in der Mitte des Hofs und bedient es. Sie braucht zwei Runden, in denen kein Gegner direkt neben ihr steht. Die Jäger kommen durch das Nord- und das Südtor. Haltet sie von ihr fern – oder besiegt sie alle."],
      kampf: (A) => {
        const m = A.merker; let mal = 1;
        if (m.barrikade) mal *= 0.85; else if (m.barrikade_halb) mal *= 0.93;
        if (m.fallen) mal *= 0.9; if (m.brann_tor) mal *= 0.9; if (m.jaeger_frueh) mal *= 1.1;
        return { begegnung: "wacht", karte: HOF, keinAnfuehrer: true, skalaMal: mal, ueberraschung: Boolean(m.ueberblick),
          begleiter: Object.assign(ESKORTE.wacht.begleiter(seraTP(A, 2)), { titel: "Botin des Wachtordens" }),
          sieg: { weiter: "nach_wacht" }, gefangen: { setzt: { sera_hauptmann: true }, weiter: "verschleppt2" } };
      },
    },
    nach_wacht: {
      art: "wahl", abschnitt: 2, titel: "Das Signal", ort: "Der Innenhof",
      text: (A) => [
        "Das Signalgerät summt, dann bricht ein Lichtstrahl aus dem Kristall, quer über die Berge, bis zu einem Felsgrat im Norden: die Hochwarte. Jetzt kennt ihr den Weg.",
        "Am Nordtor seht ihr die letzten Jäger fliehen. Einer bleibt kurz stehen und dreht sich um: groß, mit einer Axt auf dem Rücken. Ihr Hauptmann. Er weiß jetzt auch, wohin ihr wollt.",
        "Ihr könnt ihn verfolgen, bevor er seine Leute sammelt – oder ihr nutzt die Zeit zum Rasten. Stimmt ab.",
      ],
      optionen: [
        { id: "verfolgen", text: "Den Hauptmann verfolgen (er wird euch im Finale fehlen)", weiter: "kampf_hauptmann" },
        { id: "rasten", text: "Rasten und Kräfte sammeln", weiter: "lager_akt2" },
      ],
    },
    verschleppt2: {
      art: "erzaehlung", abschnitt: 2, titel: "Die Axt im Schnee", ort: "Der Innenhof", weiter: "kampf_hauptmann",
      text: ["Die Jäger haben Sera. Durch das Nordtor seht ihr sie davonziehen, ihr Hauptmann voran. Aber sie kommen nicht weit: Auf dem Felsgrat hinter der Ruine stellen sie sich. Sie wollen den Funken, bevor ihr sie einholt."],
    },
    kampf_hauptmann: {
      art: "kampf", abschnitt: 2, titel: "Der Jägerhauptmann", ort: "Der Felsgrat",
      text: (A) => [A.merker.sera_hauptmann && !A.merker.sera_zurueck ? "Sera liegt gefesselt hinter dem Hauptmann. Besiegt ihn und seine Jäger." : "Der Hauptmann erwartet euch auf dem Grat, die Axt in den Händen. Mit ihm ein paar seiner Jäger."],
      kampf: (A) => Object.assign({ begegnung: "hauptmann", karte: GRAT, keinAnfuehrer: true, sieg: { setzt: { hauptmann_besiegt: true, sera_zurueck: true }, weiter: "nach_hauptmann" } },
        A.merker.sera_hauptmann && !A.merker.sera_zurueck ? { begleiter: { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 2) / 2), start: GRAT.start.begleiter, route: [], ausgang: false, gefesselt: true }, gefangen: { glocke: 1, weiter: "kampf_hauptmann" } } : {}),
    },
    nach_hauptmann: {
      art: "erzaehlung", abschnitt: 2, titel: "Ohne Hauptmann", ort: "Der Felsgrat", weiter: "lager_akt2", rastErlaubt: true,
      text: (A) => [
        "Der Hauptmann fällt in den Schnee. Seine Axt rutscht über den Grat und verschwindet in der Tiefe.",
        A.merker.sera_hauptmann ? "Sera ist frei. Sie zittert, aber sie lacht, zum ersten Mal, seit ihr sie kennt." : "Ohne ihn werden die Jäger an der Hochwarte schlechter geführt sein.",
        "In seiner Tasche: eine Karte der Hochwarte, mit Kreuzen markiert. Dort werden sie warten.",
      ],
    },
    lager_akt2: {
      art: "lager", abschnitt: 2, titel: "Lagerfeuer im Wachturm", ort: "Die stumme Wacht", aufstieg: 3, weiter: "akt3",
      text: (A) => [
        "Im einzigen Turm der Ruine, der noch ein Dach hat, macht ihr Feuer. Durch die Schießscharten seht ihr den Lichtstrahl, der zur Hochwarte zeigt.",
        A.merker.wachtbuch ? "Sera liest im Wachtbuch, bis das Feuer herunterbrennt. Ab und zu sagt sie leise: „Gletscherwasser.“" : "",
        A.merker.brann_dabei ? "Brann schläft als Erster. Er hat sich das verdient." : "",
        "Ihr seid stärker geworden. **Stufe 3.**",
      ].filter(Boolean),
    },
    /* ================= Akt III · Das letzte Licht ================= */
    akt3: {
      art: "gespraech", abschnitt: 3, titel: "Vor dem Aufstieg", ort: "Unter der Hochwarte",
      text: (A) => [
        "Der Weg zur Hochwarte führt über einen offenen Wehrgang, eine Mauer, so breit wie eine Straße, an der Flanke des Berges. Kein Dach, keine Deckung außer der zerbrochenen Brüstung. Oben, auf dem Felsgrat, wartet das alte Signalfeuer.",
        A.merker.hauptmann_besiegt ? "Ohne ihren Hauptmann sind die Jäger zerstreut. Ihr seht nur einzelne Fackeln auf den Treppen." : "Auf den Treppen zum Wehrgang brennen Fackeln. Der Hauptmann hat seine Leute gesammelt.",
        "Und im Schnee: Pfotenabdrücke, die glühen, bevor sie verlöschen. Funkenhunde. Sie riechen den Wachtfunken.",
      ],
      optionen: [
        { id: "wasser", text: "Gletscherwasser holen (wie es im Wachtbuch steht)", wer: "Das Wachtbuch", frage: "Ihr füllt eure Flaschen an einem Gletscherbach. Es dauert, und es ist bitterkalt.", wenn: (A) => Boolean(A.merker.wachtbuch && !A.merker.gletscherwasser),
          antwort: "Das Wasser ist so kalt, dass es in den Flaschen knistert. Gegen den Fackelzehrer wird es helfen.", setzt: { gletscherwasser: true }, glocke: 1 },
        { id: "seil", text: "Sera mit dem Seil sichern", wer: "Sera", frage: "„Halt dich am Seil. Wenn du fällst, ziehen wir dich hoch.“", wenn: (A) => Boolean(A.merker.seil && !A.merker.gesichert),
          antwort: "Sera knotet das Seil um ihre Hüfte. „Fallen werde ich nicht. Aber danke.“", setzt: { gesichert: true } },
        { id: "brann", text: "Brann nach dem Wehrgang fragen", wer: "Brann", frage: "„Kennst du den Wehrgang?“", wenn: (A) => Boolean(A.merker.brann_dabei),
          antwort: "„Jeden Stein. Die Treppen oben und unten: Da kommen sie. Haltet die Treppen, dann kommt Sera durch.“", setzt: { treppen: true } },
        { id: "los", text: "Den Wehrgang betreten", weiter: "kampf_wehrgang" },
      ],
    },
    kampf_wehrgang: {
      art: "kampf", abschnitt: 3, titel: "Der offene Wehrgang", ort: "Der Wehrgang",
      text: ["Sera geht den Wehrgang entlang nach rechts zur Treppe der Hochwarte. Jäger kommen über die Treppen oben und unten, Funkenhunde folgen der Spur des Funkens. Bringt sie hinüber – oder besiegt alle."],
      kampf: (A) => {
        const m = A.merker; let mal = 1;
        if (m.hauptmann_besiegt) mal *= 0.85; if (m.treppen) mal *= 0.92; if (m.jaeger_frueh) mal *= 1.1;
        const b = ESKORTE.wehrgang.begleiter(seraTP(A, 3)); if (m.gesichert) b.rk = 14;
        return { begegnung: "wehrgang", karte: WEHRGANG, keinAnfuehrer: true, skalaMal: mal, begleiter: Object.assign(b, { titel: "Botin des Wachtordens" }),
          sieg: { weiter: "vor_finale" }, gefangen: { setzt: { sera_oben: true }, weiter: "verschleppt3" } };
      },
    },
    verschleppt3: {
      art: "erzaehlung", abschnitt: 3, titel: "Nach oben", ort: "Der Wehrgang", weiter: "vor_finale",
      text: ["Die Jäger schleifen Sera die Treppe hinauf, zur Hochwarte. Dort oben wartet ihr Herr, und dort oben wollen sie ihr den Funken nehmen. Ihr folgt ihnen, so schnell ihr könnt."],
    },
    vor_finale: {
      art: "erzaehlung", abschnitt: 3, titel: "Die Hochwarte", ort: "Die Hochwarte",
      text: (A) => [
        "Die Hochwarte ist eine Plattform aus Stein auf dem höchsten Grat, umgeben von Säulen. Rechts steht das Signalfeuer, ein eiserner Korb voller kalter Asche.",
        "Aus der Asche steigt etwas auf. Es hat die Form eines Mannes, aber es ist aus Glut, und wo es hinsieht, wird es dunkler. Der Fackelzehrer. Er frisst das Licht.",
        A.merker.sera_oben ? "Sera liegt gefesselt neben dem Signalfeuer. Der Fackelzehrer beugt sich über sie, über den Funken in ihren Händen." : "„Zwei Runden“, sagt Sera. „Zwei Runden am Feuer, ohne dass mich jemand anrührt. Wenn er mich stört, muss ich von vorn beginnen.“",
        A.merker.gletscherwasser ? "Ihr spürt die Kälte der Flaschen durch eure Mäntel. Jetzt wird sich zeigen, ob das Wachtbuch recht hat." : "",
      ],
      weiter: "kampf_finale",
    },
    kampf_finale: {
      art: "kampf", abschnitt: 3, titel: "Das letzte Licht", ort: "Die Hochwarte",
      text: (A) => [A.merker.sera_oben
        ? "Befreit Sera: Besiegt den Fackelzehrer und seine Jäger. Seine Glutklaue trifft hart, alle drei Runden fegt ein Aschesturm über die Plattform (Kegel, WEI-Rettung halbiert)."
        : "Sera geht zum Signalfeuer und entzündet es. Sie braucht zwei Runden am Stück, in denen kein Gegner neben ihr steht – sonst beginnt sie von vorn. Der Fackelzehrer wechselt zwischen ihr und euch. Alle drei Runden fegt ein Aschesturm über die Plattform (Kegel, WEI-Rettung halbiert)."],
      kampf: (A) => {
        const m = A.merker; let mal = 1;
        if (m.gletscherwasser) mal *= 0.85; if (m.hauptmann_besiegt) mal *= 0.9; if (m.jaeger_frueh) mal *= 1.1;
        const b = m.sera_oben ? { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 3) / 2), start: [9, 4], route: [], ausgang: false, gefesselt: true }
          : Object.assign(ESKORTE.finale.begleiter(seraTP(A, 3)), { titel: "Botin des Wachtordens" });
        return { begegnung: "finale", karte: HOCHWARTE, keinAnfuehrer: true, skalaMal: mal, beute: false, begleiter: b,
          sieg: { weiter: m.sera_oben ? "signal_nachher" : "signal_brennt" }, gefangen: { weiter: "nordwarte_verstummt" } };
      },
    },
    signal_nachher: {
      art: "erzaehlung", abschnitt: 3, titel: "Frei", ort: "Die Hochwarte", weiter: "funke",
      text: ["Der Fackelzehrer zerfällt zu Asche, und der Wind trägt ihn davon. Ihr schneidet Sera los. Mit zitternden Händen legt sie den Funken in den Korb. Diesmal stört niemand. Das Signalfeuer brennt.", "„Ihr seid zweimal für mich gekommen“, sagt sie. „Das vergisst der Orden nicht.“"],
      beimEintritt: () => ({ setzt: { signal: true, sera_gerettet: true } }),
    },
    signal_brennt: {
      art: "erzaehlung", abschnitt: 3, titel: "Das letzte Licht", ort: "Die Hochwarte", weiter: "funke",
      beimEintritt: () => ({ setzt: { signal: true } }),
      text: ["Das Signalfeuer flammt auf, weiß und heiß, und für einen Augenblick ist es auf dem Grat taghell. Der Fackelzehrer schreit, ohne Stimme, und zerfällt.", "Ein Lichtstrahl steigt in den Himmel, knickt nach Osten ab und bleibt über einem fernen Berg stehen. Dort liegt das nächste Siegel."],
    },
    funke: {
      art: "wahl", abschnitt: 3, titel: "Der Wachtfunke", ort: "Die Hochwarte",
      text: ["Der Wachtfunke glimmt noch in der Asche, kleiner jetzt, aber nicht erloschen. Sera sieht euch an. „Er gehört dem Orden. Aber ihr habt ihn hierher gebracht. Entscheidet ihr.“", "Stimmt ab."],
      optionen: [
        { id: "brennen", text: "Im Signalfeuer lassen: Die Hochwarte brennt weiter", weiter: "ende_fackel" },
        { id: "mitnehmen", text: "Mitnehmen: Er zeigt den Weg zum nächsten Siegel – und verrät euch den Jägern", weiter: "ende_funke" },
        { id: "loeschen", text: "Löschen: Die Jäger verlieren die Spur – und ihr auch", weiter: "ende_dunkel" },
      ],
    },
    ende_fackel: {
      art: "ende", abschnitt: 3, titel: "Die Fackel bewahrt", ort: "Die Hochwarte",
      text: (A) => ["Ihr lasst den Funken im Feuer. Die Hochwarte brennt wieder, wie vor vierzig Jahren, und in den Tälern sehen die Leute nach Norden und wissen nicht, warum ihnen leichter ums Herz ist.", ...epilog(A), "Sera bleibt auf der Hochwarte, als neue Wächterin. Wenn ihr wiederkommt, wird das Feuer brennen."],
    },
    ende_funke: {
      art: "ende", abschnitt: 3, titel: "Der Funke im Gepäck", ort: "Die Hochwarte",
      text: (A) => ["Ihr nehmt den Funken mit. Er zieht nach Osten, wie eine Kompassnadel, und ihr wisst: Das nächste Siegel ist nicht mehr weit.", ...epilog(A), "Aber in der zweiten Nacht seht ihr hinter euch Fackeln auf dem Pass. Die Jäger riechen ihn auch."],
    },
    ende_dunkel: {
      art: "ende", abschnitt: 3, titel: "Die Nordwarte verstummt", ort: "Die Hochwarte",
      text: (A) => ["Ihr drückt den Funken in den Schnee, bis er erlischt. Das Signalfeuer brennt noch eine Nacht, dann geht es aus. Die Jäger finden keine Spur mehr – und ihr auch nicht.", ...epilog(A), "Den Weg zum nächsten Siegel werdet ihr in alten Büchern suchen müssen. Sera sagt, sie kennt eine Bibliothek."],
    },
    nordwarte_verstummt: {
      art: "ende", abschnitt: 3, titel: "Die Nordwarte verstummt", ort: "Die Hochwarte",
      text: (A) => ["Der Fackelzehrer nimmt den Funken, und mit ihm Sera. Das Signalfeuer bleibt kalt.", ...epilog(A), "Irgendwo im Norden wartet sie. Ihr werdet sie suchen."],
    },
    hochwacht_verloren: { art: "ende", abschnitt: 0, titel: "Die Nordwarte verstummt", ort: "", text: ["Der Wind trägt Schnee über eure Spuren. Im Norden erlischt ein Licht."] },
  };
  const WISSEN = {
    siegeljaeger: { klassen: ["schurke", "waldlaeufer"], text: "Jagt die Begleiterin: Sieht er Sera, geht er auf sie los. Wer ihm den Weg verstellt, wird statt ihrer angegriffen." },
    wachkonstrukt: { klassen: ["zauberer", "krieger"], text: "Langsam (4 Felder) und schwer gepanzert (RK 16). Stein bricht unter Wucht: Hämmer und Streitkolben machen anderthalbfachen Schaden." },
    jaegerhauptmann: { klassen: ["krieger", "schurke"], text: "Trifft hart mit der Kriegsaxt (1W12+3). Wie seine Jäger geht er auf Sera los, wenn er sie sieht." },
    funkenhund: { klassen: ["waldlaeufer"], text: "Ein Aschehund, der der Spur des Funkens folgt: Er läuft auf Sera zu. Alle drei Runden Glutatem im Kegel von 3 Feldern (3W6, GES-Rettung halbiert)." },
    fackelzehrer: { klassen: ["zauberer", "kleriker"], text: "Wechselt rundenweise zwischen Sera und euch. Glutklaue 2W8+3, alle drei Runden ein Aschesturm (3W6 im Kegel, WEI-Rettung halbiert). Gletscherwasser bricht seine Glut." },
    jaegerschuetze: { klassen: ["waldlaeufer"], text: "Schießt aus 6 Feldern bevorzugt auf Sera. Deckung oder ein Held neben ihr (Abfangen) schützt sie." },
  };
  const META = {
    id: "hochwacht", schwierigkeit: 3, entwurf: true, titel: "Die letzte Fackel von Hochwacht", kurz: "Hochwacht", untertitel: "Ein Eskorte-Abenteuer im Norden (Entwurf)",
    kurztext: "Bringt die Botin Sera Venn durch einen belagerten Pass zur Hochwarte.",
    min: 3, max: 6, stufen: "1–3", dauer: "3–4 Stunden", abschnitte: 3, enden: 3, bild: null,
    uhr: { name: "Kälte", max: 7, mehr: "Der Wind wird schärfer.", weniger: "Der Wind legt sich ein wenig.", unruhe: "die Kälte lässt niemanden ganz schlafen", rueckzug: "Der Wind wird schärfer." },
    gruppe: "Die Fackelträger", aufbruch: "Über den Pass", niederlage: "Die Nordwarte verstummt", chronik: "Chronik von Hochwacht",
    abschnitte_namen: { 1: "Der Überfall am Pass", 2: "Die stumme Wacht", 3: "Das letzte Licht" },
  };
  const API = { META, ESKORTE, EREIGNISSE: [], WISSEN, START: "prolog", NIEDERLAGE: "hochwacht_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.hochwacht = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
