/*
 * Die letzte Fackel von Hochwacht – ENTWURF (Prototyp der Eskorte, siehe KONZEPT-HOCHWACHT.md)
 * Bisher nur Akt I bis zum ersten Kampf: Sera Venn wird gefunden, Hinterhalt am Pass.
 * Karten ohne Bild: M Fels, K niedriger Wall (Deckung), T Baum, Q Wasser.
 */
(function (root) {
  "use strict";
  const M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y], T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y];
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { const f = { M, K, T, "~": Q }[c]; if (f) h.push(f(x, y)); })); return h; };
  /** Seras Lebenspunkte je Akt und Gruppengröße (Startwerte zum Testen, siehe KONZEPT-HOCHWACHT.md B2) */
  const seraTP = (A, akt) => { const gross = A.gruppe.filter((f) => !A.zust[f].tot).length >= 5; return { 1: gross ? 18 : 14, 2: gross ? 28 : 22, 3: gross ? 40 : 30 }[akt]; };

  /* ---------- Karten (12 × 9) ---------- */
  // Hindernisse nach den gemalten Bildern ausgerichtet (Raster 12 × 9, siehe BILDER-HOCHWACHT.md)
  // Der Pass: ein Weg zwischen Felsen, links der Einstieg, rechts der Ausgang; oben zwei Felsnischen, unten eine Mulde für den Hinterhalt
  const PASS = {
    name: "Der Pass", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/pass.webp",
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MMM..MMM.MMM",
      "MMM..MMK.K.M",
      "...........M",
      "............",
      ".KK.....K..M",
      "M....M..MMMM",
      "MMMM.MMMMMMM",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 4], [1, 3], [2, 4], [2, 3], [3, 4], [3, 3]], wolf: [[0, 3], [0, 5], [3, 2], [2, 6]], begleiter: [0, 4],
      gegner: [[8, 1], [10, 2], [10, 3], [10, 5], [9, 3], [9, 5], [11, 4], [10, 4], [7, 6], [9, 4], [6, 6], [8, 3]],
      // Jäger: zuerst am Ausgang, ab dem zweiten auch aus den Felsnischen hinter der Gruppe
      jaeger: [[10, 4], [4, 1], [4, 7], [11, 4], [3, 1], [4, 6]] },
    route: [[3, 4], [6, 4], [9, 4], [11, 4]],
  };
  // Das Jägerlager (Rettung): eine Senke mit Zelten und Feuer, Sera gefesselt am Banner neben dem Feuer; die Helden kommen von links
  const LAGER = {
    name: "Das Jägerlager", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/lager.webp",
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MMMKMMMMKMMM",
      "M..KKKM..K.M",
      "MK.........M",
      "MKK.....M.KM",
      ".........KKM",
      "M..KMMM.KMMM",
      "M..KMMM.KMMM",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 5], [0, 5], [1, 6], [2, 6], [1, 2], [2, 2]], wolf: [[3, 4], [3, 3], [3, 5], [2, 3]], begleiter: [9, 4],
      gegner: [[7, 3], [7, 4], [7, 5], [9, 3], [10, 3], [8, 5], [6, 3], [8, 3], [10, 2], [5, 4], [7, 2], [6, 5]] },
  };
  /* ----- Akt II ----- */
  const sp = [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]];
  // Das Haupttor der Ruine: eine Mauer mit Tor in der Mitte, links der verschneite Hang, rechts der Vorhof mit zwei Säulen
  const TOR = { name: "Das Haupttor", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/tor.webp",
    hindernisse: ausText(["MM...MMMMMMM", "MM...MM..M.M", "MMK..MM..K.M", ".....MM.....", "............", ".....MM.....", "M.K..MM..K.M", "MM...MMMMMMM", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 3], [3, 5], [1, 6]], gegner: [[9, 4], [8, 3], [8, 5], [10, 2], [10, 6], [8, 2], [8, 6], [10, 4]] } };
  // Der Archivgang: drei Gänge zwischen Regalwänden, in der Mitte durch Geröll verbunden
  const ARCHIV = { name: "Der Archivgang", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/archiv.webp",
    hindernisse: ausText(["MMMMMMMMMMMM", "M.K........M", "M..........M", "M.MMM..MMM.M", "M..........M", "M.MMM..MMM.M", "M.MMM..MMM.M", "M..........M", "MMMMMMMMMMMM"]),
    start: { spieler: [[1, 4], [2, 4], [1, 2], [2, 2], [1, 7], [2, 7]], wolf: [[3, 4], [3, 2], [3, 7], [1, 1]], gegner: [[9, 4], [9, 2], [9, 7], [10, 2], [10, 7], [10, 1], [8, 2], [8, 7], [8, 4], [7, 4]] } };
  // Der Innenhof: das Signalgerät in der Mitte, Tore im Norden und Süden, Mauerreste als Deckung; die Gruppe kommt von Westen
  const HOF = { name: "Der Innenhof", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/hof.webp",
    hindernisse: ausText(["MMMMM..MMMMM", "MMMMM..MMMMM", "M..K....K.MM", "M.....M....M", "......M....M", "M..........M", "M..KK..KK.MM", "MMMMM..MMMMM", "MMMMM..MMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [2, 2], [2, 6], [4, 4]], begleiter: [0, 4],
      gegner: [[5, 1], [6, 1], [5, 7], [6, 7], [5, 2], [6, 2], [5, 6], [6, 6], [9, 2], [9, 6], [10, 3], [10, 5]],
      jaeger: [[5, 0], [6, 8], [6, 0], [5, 8], [6, 1], [5, 7]] },
    route: [[3, 4], [5, 4]] };
  // Der Felsgrat: der Jägerhauptmann stellt sich auf einem Grat, rechts sein Lager mit Feuer
  const GRAT = { name: "Der Felsgrat", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/grat.webp",
    hindernisse: ausText(["MMMMMMMMMMMM", "MMMMMMMMMMMM", "MMMMMMMMMMMM", "MM.M....K.MM", "......M....M", "MM..K...M..M", "MMMMMM..M.MM", "MMMMMMMMMMMM", "MMMMMMMMMMMM"]),
    start: { spieler: [[1, 4], [2, 4], [2, 3], [2, 5], [3, 4], [0, 4]], wolf: [[4, 4], [5, 4], [3, 5], [4, 3]], begleiter: [10, 4], gegner: [[9, 4], [9, 3], [10, 5], [8, 4], [9, 6], [7, 3], [7, 5], [9, 5]] } };
  /* ----- Akt III ----- */
  // Der offene Wehrgang: ein breiter Wehrgang, je zwei Treppen oben und unten, rechts die Treppe zur Hochwarte
  const WEHRGANG = { name: "Der offene Wehrgang", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/wehrgang.webp",
    hindernisse: ausText(["MMMMMMMMMMMM", "MM.MMMMM.MMM", "MM.MMMMM.MMM", "...K..K..K.M", "............", "....K..K...M", "MM.MMMMM.MMM", "MM.MMMMM.MMM", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 5], [0, 3], [0, 5]], begleiter: [0, 4], gegner: [[10, 4], [10, 3], [10, 5], [8, 3], [8, 5], [9, 4], [8, 2], [8, 6], [7, 4], [11, 4]],
      jaeger: [[11, 4], [2, 1], [8, 7], [2, 7], [8, 1], [10, 3]] },
    route: [[6, 4], [11, 4]] };
  // Die Hochwarte: runde Plattform mit sechs Säulen, rechts das Signalfeuer; die Gruppe kommt von links über den Grat
  const HOCHWARTE = { name: "Die Hochwarte", b: 12, h: 9, boden: "stein", bild: "img/hochwacht/hochwarte.webp",
    hindernisse: ausText(["MMMMMMMMMMMM", "MMM......MMM", "MMM.M.M.M.MM", "MMM........M", ".........M.M", "MMM........M", "MMM.M.M.M.MM", "MMMMMMMMMMMM", "MMMMMMMMMMMM"]),
    start: { spieler: [[1, 4], [2, 4], [3, 4], [3, 3], [3, 6], [4, 4]], wolf: [[4, 3], [4, 5], [5, 4], [3, 1]], begleiter: [0, 4],
      gegner: [[10, 4], [10, 3], [10, 5], [9, 3], [9, 5], [8, 1], [9, 6], [6, 1], [7, 6], [8, 3]],
      jaeger: [[10, 4], [10, 3], [10, 5], [8, 1], [9, 6], [9, 3]] },
    route: [[4, 4], [8, 4]] };
  const KARTEN = { PASS, LAGER, TOR, ARCHIV, HOF, GRAT, WEHRGANG, HOCHWARTE };
  /** Epilog: Brann, Sera, Grauwacht */
  function epilog(A) {
    const m = A.merker, t = [];
    if (m.brann_dabei) t.push("↳ Brann kehrt mit euch ins Tal zurück, auf euren Schultern, und erzählt jedem, der zuhört, vom Wehrgang.");
    else if (m.brann_station) t.push("↳ In der Wegstation findet ihr Brann, mit geschientem Bein und einem Feuer im Ofen. Er hat gewartet.");
    else if (m.brann_zurueck) t.push("↳ Von Brann findet ihr auf dem Rückweg nur den zerrissenen Ordensmantel.");
    if (m.sera_befreit || m.sera_gerettet) t.push("↳ Sera trägt die Spuren der Fesseln noch Wochen später. Sie spricht nie darüber, aber sie dankt euch jedes Mal, wenn ihr euch seht.");
    if (m.grauwacht === "gebrochen") t.push("↳ Der Splitter von Grauwacht summt seitdem leiser. Als hätte er etwas wiedergefunden.");
    else if (m.grauwacht === "verrat") t.push("↳ In Anselms Handschrift findet ihr einen Brief bei den toten Jägern. Ihr verbrennt ihn, ohne ihn zu Ende zu lesen.");
    if (m.signal) t.push("↳ Eine Nacht lang stand der Strahl des Signalfeuers über dem Berg im Osten. Die Richtung kennt ihr jetzt. Jeder, der in dieser Nacht nach Norden gesehen hat, kennt sie auch.");
    if (m.signal && m.orden_dank) t.push("↳ Sera schreibt dem Orden noch in derselben Woche: dass in Grauwacht ein Siegel hält, und wer es erneuert hat. Der Brief ist kurz. Eure Namen stehen alle darin.");
    if (A.gefallen.length) t.push(`Auf dem Grat unter der Hochwarte schichtet ihr Steine für ${A.gefallen.map((f) => (FIG() ? FIG().FIGUREN[f].name : f)).join(", ")}.`);
    return t;
  }
  /** Rückschau: die Entscheidungen des Weges in einem Satz je Faden */
  function rueckschau(A, h) {
    const m = A.merker, t = [];
    t.push(m.brann_dabei ? "Ihr habt Brann mitgenommen, mit gebrochenem Bein und gegen die Kälte. Er hat es euch mit allem vergolten, was er über die Ruine wusste."
      : m.brann_station ? "Ihr habt Brann mit einem eurer Heiltränke zur Wegstation geschickt. Die Ruine habt ihr ohne ihn geöffnet, aber er lebt."
      : m.brann_zurueck ? "Ihr habt Brann am Pass zurückgelassen. Was er über die Ruine wusste, blieb bei ihm im Schnee." : "");
    const mal = [m.sera_befreit, m.sera_hauptmann, m.sera_oben].filter(Boolean).length;
    t.push(mal ? `Die Jäger haben euch Sera ${["einmal", "zweimal", "dreimal"][mal - 1]} entrissen. Ihr habt sie ${mal === 1 ? "zurückgeholt" : "jedes Mal zurückgeholt"}.` : "Sera wurde euch kein einziges Mal entrissen: Ihr habt sie vom Pass bis ans Signalfeuer gebracht.");
    t.push(m.wachtbuch ? `Ihr seid durch den Archivgang gegangen und habt das Wachtbuch gefunden. ${m.gletscherwasser ? "Sein Rat hat dem Fackelzehrer die Glut gebrochen: Gletscherwasser." : "Das Gletscherwasser, von dem es spricht, habt ihr nicht geholt."}`
      : m.weg === "mauer" ? `Ihr seid über die Mauer in die Ruine gestiegen${m.ueberblick ? " und kanntet die Wege der Jäger, bevor sie kamen" : ". Das Eis hat es euch nicht leicht gemacht"}.`
      : m.weg === "tor" ? (m.brann_dabei ? "Ihr habt das Haupttor genommen, und Brann hat es mit einem Spruch geöffnet." : "Ihr habt das Haupttor genommen, ohne jemanden, der den Spruch kannte.") : "");
    t.push(m.hauptmann_besiegt ? (m.sera_hauptmann ? "Auf dem Felsgrat habt ihr den Hauptmann gestellt, weil er Sera hatte. An der Hochwarte fehlte er seinen Jägern." : "Ihr habt den Hauptmann verfolgt, statt ihn ziehen zu lassen. An der Hochwarte fehlte er seinen Jägern.")
      : "Ihr habt den Hauptmann ziehen lassen und gerastet. An der Hochwarte hatte er seine Leute gesammelt.");
    t.push(m.jaeger_frueh ? "Ihr habt Sera gesagt, wie es in Grauwacht ausging. Sie hatte recht: Die Jäger kamen früher und härter." : m.orden_dank ? "Ihr habt Sera erzählt, dass das Siegel von Grauwacht hält. Der Orden weiß es jetzt auch." : "");
    for (const f of h.lebende(A)) if (h.feuerEcho(A, f, "nacht")) t.push(h.feuerEcho(A, f, "nacht"));
    t.push(A.szene === "ende_fackel" ? "Den Wachtfunken habt ihr im Signalfeuer gelassen. Die Hochwarte brennt, und Sera wacht darüber."
      : A.szene === "ende_funke" ? "Den Wachtfunken habt ihr mitgenommen. Er zeigt euch den Weg, und den Jägern zeigt er euch."
      : A.szene === "ende_dunkel" ? "Den Wachtfunken habt ihr gelöscht. Niemand folgt euch mehr, und niemand weist euch den Weg." : "");
    return t.filter(Boolean);
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
        { id: "erneuert", text: "Wir haben das Siegel erneuert", setzt: { grauwacht: "erneuert" }, weiter: "wegstation", folge: "Hinter euch hält ein Siegel. Es gibt Leute im Norden, die das hören wollen." },
        { id: "gebrochen", text: "Wir haben das Siegel gebrochen", setzt: { grauwacht: "gebrochen", splitter: true }, weiter: "wegstation", folge: "Ihr tragt den Splitter von Grauwacht im Gepäck. Er wird nicht jedem verborgen bleiben." },
        { id: "verrat", text: "Anselm hat uns verraten", setzt: { grauwacht: "verrat" }, weiter: "wegstation", folge: "Anselms Verrat reist mit euch. Wem er noch geschrieben hat, wisst ihr nicht." },
        { id: "nicht", text: "Nicht dabei gewesen", setzt: { grauwacht: "nicht" }, weiter: "wegstation" },
      ],
    },
    wegstation: {
      art: "gespraech", abschnitt: 1, titel: "Die Wegstation", ort: "Am Fuß des Passes",
      text: (A) => [
        "In einer verlassenen Wegstation am Fuß des Passes wartet eine Frau, als hätte sie gewusst, dass ihr kommt. Ihr Mantel ist voller Schnee, in ihren Händen glimmt etwas, warm wie Glut und hell wie ein Stern.",
        "„Sera Venn“, sagt sie. „Botin des Wachtordens. Und ihr seid spät.“",
        A.merker.grauwacht === "gebrochen" ? "↳ Der Splitter von Grauwacht in eurem Gepäck summt, als sie näher kommt. Sera hört es auch. Sie wird blass." : "",
      ],
      optionen: [
        { id: "funke", text: "Nach dem Leuchten in ihren Händen fragen", wer: "Sera", frage: "„Was trägst du da?“",
          antwort: "„Einen Wachtfunken. Den letzten. Mit ihm lässt sich die Hochwarte öffnen und das Signal entzünden. Dann sehen wir, wo das nächste Siegel liegt.“ Sie schließt die Finger darum. „Und alles, was Siegel hasst, kann ihn riechen.“" },
        { id: "jaeger", text: "Nach ihren Verfolgern fragen", wer: "Sera", wichtig: true, frage: "„Wer ist hinter dir her?“",
          antwort: "„Siegeljäger. Sie verkaufen, was in den Siegeln steckt, an wen auch immer. Sie wollen nicht euch. Sie wollen mich und den Funken. Wenn ihr kämpft: Lasst sie nicht an mich heran.“", setzt: { jaeger_bekannt: true }, folge: "Ihr wisst jetzt, wer am Pass lauert und wen sie wollen: Sera, nicht euch. Auf dem Weg hinauf haltet ihr danach Ausschau." },
        { id: "grauwacht", text: "Von Grauwacht erzählen", wer: "Sera", frage: "„Wir kommen aus Grauwacht.“", wenn: (A) => A.merker.grauwacht && A.merker.grauwacht !== "nicht",
          antwort: (A) => A.merker.grauwacht === "erneuert" ? "Sera atmet aus. „Dann hält eines. Gut. Der Orden wird es euch nicht vergessen.“" : A.merker.grauwacht === "gebrochen" ? "„Gebrochen.“ Sie sagt es leise. „Dann wissen die Jäger, dass es sich lohnt. Sie werden früher kommen.“" : "„Anselm“, sagt sie nur. „Seine Briefe haben die Jäger hierher geführt. Ich hatte gehofft, es wäre nicht wahr.“",
          setzt: (A) => (A.merker.grauwacht === "gebrochen" || A.merker.grauwacht === "verrat" ? { jaeger_frueh: true } : { orden_dank: true }),
          folge: (A) => (A.merker.jaeger_frueh ? "Sera rechnet jetzt mit dem Schlimmsten, und sie hat Grund dazu: Die Jäger kommen früher und härter, als ihr gehofft habt." : "Sera weiß, dass ihr ein Siegel gehalten habt. Der Orden steht in eurer Schuld, und sie wird dafür sorgen, dass er es erfährt.") },
        { id: "vorraete", text: "Die Station nach Vorräten durchsuchen", wichtig: true, frage: "Ihr durchsucht Regale und Kisten.",
          probe: { name: "Suchen", attr: "WEI", sg: 12, geuebt: ["schurke", "waldlaeufer"], knapp: true,
            erfolg: { text: "Hinter einem losen Brett: zwei Heiltränke und ein Seil. Jemand vom Orden hat vorgesorgt.", tranke: 2, setzt: { seil: true }, folge: "Zwei Heiltränke mehr, und ein Seil. Auf einem Berg findet sich dafür immer jemand, der gehalten werden muss." },
            knapp: { text: "Ein einzelner Heiltrank, halb eingefroren.", tranke: 1, folge: "Ein Heiltrank mehr im Gepäck. Mehr gibt die Station nicht her." },
            fehl: { text: "Nur leere Flaschen und Mäusedreck." } } },
        { id: "los", text: "Aufbrechen, solange es hell ist", weiter: "route" },
      ],
    },
    route: {
      art: "probe", abschnitt: 1, titel: "Der Weg hinauf", ort: "Der Nordpass",
      text: (A, h) => ["Der Pass windet sich zwischen Felsen nach oben. Wer kennt sich mit Bergen aus? Eine Person führt.", A.merker.jaeger_bekannt ? "↳ Ihr wisst, wonach ihr Ausschau halten müsst: Vorteil." : "",
        "Sera geht in eurer Mitte, den Funken unter dem Mantel. Sie hält Schritt, aber sie sieht öfter zurück als nach vorn.", h.stimme(A, "schutz")],
      probe: { name: "Orientierung", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], vorteil: (A) => (A.merker.jaeger_bekannt ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr seht die Spuren im Schnee, bevor ihr in die Falle lauft. Die Jäger in den Felsnischen haben euch noch nicht bemerkt.", setzt: { pass_ueberrascht: true }, weiter: "kampf_pass", folge: "Ihr habt die Jäger zuerst gesehen. Am Pass gehört der erste Schlag euch." },
        knapp: { text: "Ihr findet den Weg, aber nicht die Spuren. Dann knirscht Schnee in den Felsen.", weiter: "kampf_pass", folge: "Ihr habt den Weg gefunden, die Jäger aber nicht kommen sehen. Am Pass überrascht niemand niemanden." },
        fehl: { text: "Ihr verlauft euch im Schneetreiben und findet erst spät zurück. Die Kälte kriecht in die Knochen.", glocke: 1, weiter: "kampf_pass", folge: "Der Umweg hat Zeit gekostet: Die Kälte steigt. Und die Jäger hatten Zeit, sich einzurichten." } },
    },
    kampf_pass: {
      art: "kampf", abschnitt: 1, titel: "Hinterhalt am Pass", ort: "Der Pass",
      text: ["Die Jäger warten in den Felsnischen. Sera folgt dem Weg nach rechts zum Ausgang, bis zu 2 Felder zu Beginn jeder Runde, aber nur, wenn jemand von euch in der Nähe ist und das nächste Feld nicht direkt bedroht ist. Wer direkt neben ihr steht, fängt einen gezielten Angriff auf sie ab (Reaktion). Fällt sie, habt ihr bis zum Ende der nächsten Runde Zeit, sie zu stabilisieren."],
      kampf: (A) => ({ begegnung: "pass", karte: PASS, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.pass_ueberrascht), skalaMal: A.merker.jaeger_frueh ? 1.1 : 1,
        begleiter: { name: "Sera Venn", titel: "Botin des Wachtordens", tp: seraTP(A, 1), start: PASS.start.begleiter, route: PASS.route },
        sieg: { weiter: "wachmann", folge: "Ihr habt Sera durch den Hinterhalt gebracht. Der Funke ist noch bei ihr." }, gefangen: { weiter: "verschleppt", folge: "Die Jäger haben Sera und mit ihr den Funken. Jede Stunde, die ihr sucht, ziehen sie weiter." } }),
    },
    wachmann: {
      art: "wahl", abschnitt: 1, titel: "Der Wachmann", ort: "Hinter dem Pass", rastErlaubt: true,
      text: [
        "Hinter dem Pass, im Windschatten eines Felsens, sitzt ein Mann in einem zerrissenen Ordensmantel. Brann, sagt Sera, einer der letzten Wachleute. Sein Bein ist gebrochen. Die Jäger haben ihn liegen lassen, um euch aufzulauern.",
        "„Nehmt mich mit“, sagt er. „Ich kenne die Ruine. Ich weiß, wie man das Tor öffnet.“ Mit ihm kommt ihr langsamer voran. Stimmt ab.",
      ],
      optionen: [
        { id: "mit", text: "Brann mitnehmen (langsamer, aber er kennt die Ruine)", setzt: { brann_dabei: true }, glocke: 1, weiter: "lager_akt1", folge: "Brann kommt mit. Ihr seid langsamer, die Kälte steigt. Aber er kennt die Ruine und ihr Tor." },
        { id: "station", text: "Ihn mit Vorräten zur Wegstation zurückschicken (ein Heiltrank weniger)", setzt: { brann_station: true }, trankWeg: 1, weiter: "lager_akt1", folge: "Brann humpelt mit einem eurer Heiltränke zur Wegstation zurück. Die Ruine müsst ihr ohne ihn öffnen." },
        { id: "zurueck", text: "Ihn zurücklassen", setzt: { brann_zurueck: true }, weiter: "lager_akt1", folge: "Ihr lasst Brann im Windschatten des Felsens zurück. Die Ruine müsst ihr ohne ihn öffnen." },
      ],
    },
    // ----- Rettung: Sera wurde verschleppt -----
    verschleppt: {
      art: "probe", abschnitt: 1, titel: "Spuren im Schnee", ort: "Hinter dem Pass",
      text: ["Die Jäger sind fort, und Sera mit ihnen. Im frischen Schnee: Schleifspuren, Stiefelabdrücke, ein Tropfen Blut. Ihr müsst ihnen folgen, bevor der Wind alles zuweht. Alle suchen; gelingt es der Hälfte, findet ihr den Weg."],
      probe: { name: "Spuren lesen", wer: "gruppe", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], knapp: true,
        erfolg: { text: "Die Spuren führen in eine Senke. Rauch steigt auf. Ihr seid da, bevor sie weiterziehen.", setzt: { lager_ueberrascht: true }, weiter: "kampf_lager", folge: "Ihr seid am Lager, bevor die Jäger mit euch rechnen. Der erste Schlag gehört euch." },
        knapp: { text: "Ihr findet das Lager, aber erst nach langem Suchen in der Kälte.", glocke: 1, weiter: "kampf_lager", folge: "Ihr habt das Lager gefunden, aber die Suche hat Zeit gekostet: Die Kälte steigt." },
        fehl: { text: "Der Wind ist schneller. Als ihr das Lager endlich findet, ist es tief in der Nacht.", glocke: 2, weiter: "kampf_lager", folge: "Der Wind hat euch Stunden gekostet: Die Kälte steigt deutlich. Die Jäger sitzen ausgeruht am Feuer." } },
    },
    kampf_lager: {
      art: "kampf", abschnitt: 1, titel: "Das Jägerlager", ort: "Eine Senke im Schnee",
      text: ["Sera liegt gefesselt am Feuer, rechts in der Senke. Die Jäger sind müde, aber sie sind viele. Besiegt sie, dann ist Sera frei."],
      kampf: (A) => ({ begegnung: "pass", karte: LAGER, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.lager_ueberrascht),
        begleiter: { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 1) / 2), start: LAGER.start.begleiter, route: [], ausgang: false, gefesselt: true },
        sieg: { weiter: "befreit", folge: "Sera ist frei, der Funke noch bei ihr. Was sie in dieser Senke erlebt hat, trägt sie von jetzt an mit." }, gefangen: { weiter: "kampf_lager", glocke: 1 } }),
    },
    befreit: {
      art: "erzaehlung", abschnitt: 1, titel: "Befreit", ort: "Das Jägerlager", weiter: "wachmann", rastErlaubt: true,
      beimEintritt: () => ({ setzt: { sera_befreit: true } }),
      text: ["Ihr schneidet die Fesseln durch. Sera reibt sich die Handgelenke. Der Wachtfunke ist noch da, versteckt in ihrem Ärmel. „Sie haben nicht gesucht“, sagt sie. „Sie dachten, sie hätten Zeit.“", "Sie sieht euch an. „Danke. Das vergesse ich nicht.“"],
    },
    lager_akt1: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer in der Schutzhütte", ort: "Eine Hütte am Grat", aufstieg: 2, weiter: "ruine",
      text: (A, h) => [
        "Eine alte Schutzhütte des Ordens, halb eingeschneit. Ihr macht Feuer, und zum ersten Mal seit Stunden spürt ihr eure Finger wieder.",
        h.stimme(A, "kaelte"),
        A.merker.brann_dabei ? "↳ Brann zeichnet mit einem verkohlten Stock die Ruine auf den Boden: zwei Tore, ein Hof, in der Mitte das Signalgerät. „Das Gerät braucht zwei Runden, in denen niemand stört“, sagt er. „Und das Haupttor öffne ich euch. Ich kenne den Spruch.“" : "",
        A.merker.sera_befreit ? "↳ Sera sitzt nah am Feuer und schweigt lange. Dann erzählt sie von ihrer Schwester, die auch Botin war, und nicht zurückkam." : "Sera erzählt vom Orden, von den sieben Siegeln, von einer Zeit, als auf jedem Gipfel ein Licht brannte.",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    /* ================= Akt II · Die stumme Wacht ================= */
    ruine: {
      art: "wahl", abschnitt: 2, titel: "Die Ordensruine", ort: "Die stumme Wacht",
      text: (A) => [
        "Am Morgen seht ihr sie: die Ruine des Wachtordens, schwarz gegen den Schnee. Eine Mauer, ein verschlossenes Haupttor, dahinter ein Hof. Dort steht das Signalgerät, sagt Sera, das den Weg zur Hochwarte zeigt.",
        "Es gibt drei Wege hinein: das Haupttor mit seinem alten Mechanismus, den eingestürzten Archivgang unter der Mauer, oder über die Mauer selbst, wo sie zerfallen ist.",
        A.merker.brann_dabei ? "↳ Brann humpelt auf das Tor zu. „Lasst mich machen.“" : "",
        "Welchen Weg nehmt ihr? Stimmt ab.",
      ],
      optionen: [
        { id: "tor", text: "Durch das Haupttor", setzt: { weg: "tor" }, weiter: (A) => (A.merker.brann_dabei ? "tor_brann" : "tor_probe"),
          folge: (A) => (A.merker.brann_dabei ? "Ihr nehmt das Haupttor. Brann kennt den Spruch." : "Ihr nehmt das Haupttor, ohne jemanden, der den Spruch kennt. Der Mechanismus muss es tun.") },
        { id: "archiv", text: "Durch den Archivgang (dort lagern die Schriften des Ordens)", setzt: { weg: "archiv" }, weiter: "kampf_archiv", folge: "Ihr nehmt den Weg unter der Mauer, vorbei an den Schriften des Ordens. Was dort noch liegt, liegt auf eurem Weg." },
        { id: "mauer", text: "Über die zerfallene Mauer klettern", setzt: { weg: "mauer" }, weiter: "mauer", folge: "Ihr steigt über die Mauer. Von oben sieht man mehr als vom Tor aus, wenn das Eis hält." },
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
        erfolg: { text: "Die Ringe drehen sich in die richtige Stellung. Das Tor öffnet sich. Die Wächter aus Stein dahinter bleiben stumm.", weiter: "hof", folge: "Das Tor ist offen, und die Wächter aus Stein schlafen weiter. Ihr kommt unversehrt in den Hof." },
        knapp: { text: "Das Tor öffnet sich, aber nur nach vielen Versuchen. Der Wind wird schärfer.", glocke: 1, weiter: "hof", folge: "Das Tor ist offen, aber es hat gedauert: Die Kälte steigt." },
        fehl: { text: "Ein falscher Ring – und hinter dem Tor heben die Wächter aus Stein die Köpfe.", weiter: "kampf_tor", folge: "Ihr habt die Wächter aus Stein geweckt. In den Hof kommt ihr jetzt nur noch durch sie hindurch." } },
    },
    kampf_tor: {
      art: "kampf", abschnitt: 2, titel: "Die Wächter aus Stein", ort: "Das Haupttor",
      text: ["Wachkonstrukte des Ordens stapfen durch den Torbogen: langsam, aber hart wie Fels. Wuchtige Waffen zerbrechen sie leichter."],
      kampf: { begegnung: "tor", karte: TOR, sieg: { weiter: "hof", tranke: 1, folge: "Die Wächter aus Stein liegen in Trümmern. Im Schutt des Torbogens lag noch ein Heiltrank des Ordens." } },
    },
    kampf_archiv: {
      art: "kampf", abschnitt: 2, titel: "Im Archivgang", ort: "Unter der Mauer",
      text: ["Im Archivgang ist jemand vor euch gewesen: Siegeljäger durchwühlen die Regale, Kobolde tragen Bücher davon. Die Gänge sind schmal."],
      kampf: { begegnung: "archiv", karte: ARCHIV, sieg: { weiter: "archiv_fund" } },
    },
    archiv_fund: {
      art: "erzaehlung", abschnitt: 2, titel: "Das Wachtbuch", ort: "Der Archivgang", weiter: "hof", rastErlaubt: true,
      beimEintritt: () => ({ setzt: { wachtbuch: true }, folge: "Ihr habt das Wachtbuch. Es nennt, was auf der Hochwarte wartet, und was seine Glut bricht: Gletscherwasser." }),
      text: ["Zwischen zerrissenen Seiten findet ihr ein Buch, das die Jäger übersehen haben: das Wachtbuch des Ordens. Auf einer der letzten Seiten eine Zeichnung, ein Wesen aus Asche und Glut.", "„Der Fackelzehrer“, liest Sera. „Er frisst das Licht. Aber wer ihm Wasser aus den Gletschern ins Feuer wirft, bricht seine Glut.“ Sie steckt das Buch ein."],
    },
    mauer: {
      art: "probe", abschnitt: 2, titel: "Über die Mauer", ort: "Die zerfallene Mauer",
      text: ["Die Mauer ist vereist und bröckelig. Alle klettern; gelingt es der Hälfte, helfen die anderen nach."],
      probe: { name: "Klettern", wer: "gruppe", attr: "GES", sg: 13, geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Oben auf der Mauer habt ihr den ganzen Hof im Blick: beide Tore, die Wege der Jäger. Ihr wisst jetzt, wo sie kommen werden.", setzt: { ueberblick: true }, weiter: "hof", folge: "Ihr kennt die Wege der Jäger in den Hof. Wenn sie kommen, steht ihr schon richtig." },
        knapp: { text: "Jemand rutscht ab und schlägt hart auf. Aber ihr seid drin.", schaden: "1W6", weiter: "hof", folge: "Ihr seid im Hof, mit Prellungen und ohne Überblick." },
        fehl: { text: "Das Eis gibt nach. Ihr fallt, rappelt euch auf und klettert noch einmal. Es dauert.", schaden: "1W6", glocke: 1, weiter: "hof", folge: "Der Sturz hat Kraft und Zeit gekostet: Die Kälte steigt. Gesehen habt ihr von oben nichts." } },
    },
    hof: {
      art: "gespraech", abschnitt: 2, titel: "Der Innenhof", ort: "Die stumme Wacht",
      text: (A) => [
        "Der Hof ist still. In der Mitte steht das Signalgerät: ein Gestell aus Messing und Kristall, so hoch wie ein Mensch. Sera legt die Hand darauf. „Zwei Runden“, sagt sie. „Wenn mich niemand stört.“",
        "Im Norden und Süden führen Tore in den Hof. Von draußen hört ihr Stimmen, Stiefel im Schnee. Die Jäger sind euch gefolgt.",
        A.merker.ueberblick ? "↳ Von der Mauer aus habt ihr gesehen, wo sie kommen werden." : "",
      ],
      optionen: [
        { id: "barrikade", text: "Das Südtor verbarrikadieren", wichtig: true, frage: "Ihr stemmt euch gegen das alte Tor und verkeilt es mit Trümmern.", wenn: (A) => !A.merker.barrikade,
          probe: { name: "Kraftakt", attr: "STR", sg: 13, geuebt: ["krieger"], knapp: true,
            erfolg: { text: "Das Südtor sitzt fest. Wer jetzt kommt, muss durch das Nordtor.", setzt: { barrikade: true }, folge: "Das Südtor ist zu. Die Jäger kommen nur noch von einer Seite an Sera heran, und es kommen weniger." },
            knapp: { text: "Es hält – ein bisschen. Es wird sie aufhalten, nicht aussperren.", setzt: { barrikade_halb: true }, folge: "Das Südtor hält eine Weile. Von dort kommen die Jäger später und nicht alle auf einmal." },
            fehl: { text: "Das Tor bewegt sich keinen Fingerbreit.", folge: "Beide Tore bleiben offen. Die Jäger kommen von zwei Seiten." } } },
        { id: "fallen", text: "Fallen im Schnee auslegen", wer: "Ein Schurke", frage: "Ihr legt Stolperdrähte und Krähenfüße unter den Schnee.", wenn: (A, h) => Boolean(h.klasse(A, "schurke")),
          antwort: "Wer durch die Tore stürmt, wird es merken.", setzt: { fallen: true }, folge: "Unter dem Schnee vor den Toren liegen eure Fallen. Die Ersten, die hereinstürmen, kommen nicht heil bis zu Sera." },
        { id: "brann", text: "Brann am Nordtor postieren", wer: "Brann", frage: "„Kannst du das Tor halten?“", wenn: (A) => Boolean(A.merker.brann_dabei),
          antwort: "„Sitzend? Ja.“ Er grinst schief und lehnt sich mit der Armbrust an den Torbogen. „Einen oder zwei hole ich.“", setzt: { brann_tor: true }, folge: "Brann deckt das Nordtor mit der Armbrust. Wer dort hereinkommt, bezahlt dafür." },
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
          sieg: { weiter: "nach_wacht", folge: "Das Signalgerät hat gesprochen: Ihr kennt den Weg zur Hochwarte. Die Jäger haben den Strahl auch gesehen." }, gefangen: { setzt: { sera_hauptmann: true }, weiter: "verschleppt2", folge: "Die Jäger haben Sera aus dem Hof geschleift. Ihr Hauptmann hat sie, und weit kommt er mit ihr nicht." } };
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
        { id: "verfolgen", text: "Den Hauptmann verfolgen (er wird euch im Finale fehlen)", weiter: "kampf_hauptmann", folge: "Ihr setzt dem Hauptmann nach, bevor er seine Leute sammelt. Fällt er, fehlt er den Jägern an der Hochwarte." },
        { id: "rasten", text: "Rasten und Kräfte sammeln", weiter: "lager_akt2", folge: "Ihr lasst den Hauptmann ziehen. Er wird seine Leute sammeln und an der Hochwarte auf euch warten." },
      ],
    },
    verschleppt2: {
      art: "erzaehlung", abschnitt: 2, titel: "Die Axt im Schnee", ort: "Der Innenhof", weiter: "kampf_hauptmann",
      text: ["Die Jäger haben Sera. Durch das Nordtor seht ihr sie davonziehen, ihr Hauptmann voran. Aber sie kommen nicht weit: Auf dem Felsgrat hinter der Ruine stellen sie sich. Sie wollen den Funken, bevor ihr sie einholt."],
    },
    kampf_hauptmann: {
      art: "kampf", abschnitt: 2, titel: "Der Jägerhauptmann", ort: "Der Felsgrat",
      text: (A) => [A.merker.sera_hauptmann && !A.merker.sera_zurueck ? "Sera liegt gefesselt hinter dem Hauptmann. Besiegt ihn und seine Jäger." : "Der Hauptmann erwartet euch auf dem Grat, die Axt in den Händen. Mit ihm ein paar seiner Jäger."],
      kampf: (A) => Object.assign({ begegnung: "hauptmann", karte: GRAT, keinAnfuehrer: true, sieg: { setzt: { hauptmann_besiegt: true, sera_zurueck: true }, weiter: "nach_hauptmann", folge: (A) => (A.merker.sera_hauptmann ? "Der Hauptmann ist gefallen, und Sera ist frei. An der Hochwarte fehlt den Jägern jetzt der Anführer." : "Der Hauptmann ist gefallen. An der Hochwarte fehlt den Jägern jetzt der Anführer.") } },
        A.merker.sera_hauptmann && !A.merker.sera_zurueck ? { begleiter: { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 2) / 2), start: GRAT.start.begleiter, route: [], ausgang: false, gefesselt: true }, gefangen: { glocke: 1, weiter: "kampf_hauptmann" } } : {}),
    },
    nach_hauptmann: {
      art: "erzaehlung", abschnitt: 2, titel: "Ohne Hauptmann", ort: "Der Felsgrat", weiter: "lager_akt2", rastErlaubt: true,
      text: (A) => [
        "Der Hauptmann fällt in den Schnee. Seine Axt rutscht über den Grat und verschwindet in der Tiefe.",
        A.merker.sera_hauptmann ? "↳ Sera ist frei. Sie zittert, aber sie lacht, zum ersten Mal, seit ihr sie kennt." : "↳ Ohne ihn werden die Jäger an der Hochwarte schlechter geführt sein.",
        "In seiner Tasche: eine Karte der Hochwarte, mit Kreuzen markiert. Dort werden sie warten.",
      ],
    },
    lager_akt2: {
      art: "lager", abschnitt: 2, titel: "Lagerfeuer im Wachturm", ort: "Die stumme Wacht", aufstieg: 3, weiter: "nacht_wachturm",
      text: (A) => [
        "Im einzigen Turm der Ruine, der noch ein Dach hat, macht ihr Feuer. Durch die Schießscharten seht ihr den Lichtstrahl, der zur Hochwarte zeigt.",
        A.merker.wachtbuch ? "↳ Sera liest im Wachtbuch, bis das Feuer herunterbrennt. Ab und zu sagt sie leise: „Gletscherwasser.“" : "",
        A.merker.brann_dabei ? "↳ Brann schläft als Erster. Er hat sich das verdient." : "",
        "Ihr seid stärker geworden. **Stufe 3.**",
      ].filter(Boolean),
    },
    nacht_wachturm: {
      art: "geheim", abschnitt: 2, titel: "Die letzte Nacht vor dem Aufstieg", ort: "Im Wachturm der Ruine", verteilung: false,
      text: (A) => [
        "Es ist still geworden im Turm. Der Wind hat sich gelegt, die Glut ist fast aus, und durch die Schießscharten fällt nur noch der dünne Strahl, der zur Hochwarte zeigt.",
        A.merker.sera_befreit || A.merker.sera_hauptmann ? "↳ Sera schläft mit dem Rücken zur Wand, die Hand um den Funken geschlossen. Seit die Jäger sie hatten, schläft sie nicht mehr anders." : "Sera schläft, die Hand um den Funken geschlossen. Zwischen ihren Fingern glimmt es, ruhig wie ein Atem.",
        "Niemand redet mehr. Jede Person hängt einem eigenen Gedanken nach, einem von denen, die nur kommen, wenn es so still ist.",
        "*Ein Heldenmoment: Jede Person bekommt ihre eigene Frage und antwortet für sich. Was ihr antwortet, erfahren danach alle.*",
      ],
      frage: (A, h, fid) => h.feuerFrage(fid, "nacht").frage,
      antworten: (A, h, fid) => h.feuerFrage(fid, "nacht").antworten,
      abschluss: "Irgendwann schlaft ihr doch. Am Morgen spricht niemand über die Nacht, aber ihr geht anders nebeneinander her als gestern.",
      weiter: "akt3",
    },
    /* ================= Akt III · Das letzte Licht ================= */
    akt3: {
      art: "gespraech", abschnitt: 3, titel: "Vor dem Aufstieg", ort: "Unter der Hochwarte",
      text: (A) => [
        "Der Weg zur Hochwarte führt über einen offenen Wehrgang, eine Mauer, so breit wie eine Straße, an der Flanke des Berges. Kein Dach, keine Deckung außer der zerbrochenen Brüstung. Oben, auf dem Felsgrat, wartet das alte Signalfeuer.",
        A.merker.hauptmann_besiegt ? "↳ Ohne ihren Hauptmann sind die Jäger zerstreut. Ihr seht nur einzelne Fackeln auf den Treppen." : "↳ Auf den Treppen zum Wehrgang brennen Fackeln. Der Hauptmann hat seine Leute gesammelt.",
        "Und im Schnee: Pfotenabdrücke, die glühen, bevor sie verlöschen. Funkenhunde. Sie riechen den Wachtfunken.",
      ],
      optionen: [
        { id: "wasser", text: "Gletscherwasser holen (wie es im Wachtbuch steht)", wichtig: true, wer: "Das Wachtbuch", frage: "Ihr füllt eure Flaschen an einem Gletscherbach. Es dauert, und es ist bitterkalt.", wenn: (A) => Boolean(A.merker.wachtbuch && !A.merker.gletscherwasser),
          antwort: "Das Wasser ist so kalt, dass es in den Flaschen knistert. Gegen den Fackelzehrer wird es helfen.", setzt: { gletscherwasser: true }, glocke: 1, folge: "Ihr tragt Gletscherwasser bei euch. Es hat Zeit gekostet, die Kälte steigt. Aber dem Fackelzehrer wird es die Glut brechen." },
        { id: "seil", text: "Sera mit dem Seil sichern", wichtig: true, wer: "Sera", frage: "„Halt dich am Seil. Wenn du fällst, ziehen wir dich hoch.“", wenn: (A) => Boolean(A.merker.seil && !A.merker.gesichert),
          antwort: "Sera knotet das Seil um ihre Hüfte. „Fallen werde ich nicht. Aber danke.“", setzt: { gesichert: true }, folge: "Sera hängt an eurem Seil. Auf dem Wehrgang ist sie schwerer zu treffen und schwerer fortzureißen." },
        { id: "brann", text: "Brann nach dem Wehrgang fragen", wer: "Brann", frage: "„Kennst du den Wehrgang?“", wenn: (A) => Boolean(A.merker.brann_dabei),
          antwort: "„Jeden Stein. Die Treppen oben und unten: Da kommen sie. Haltet die Treppen, dann kommt Sera durch.“", setzt: { treppen: true }, folge: "Ihr wisst, wo die Jäger auf den Wehrgang kommen. Wer die Treppen hält, hat es mit weniger von ihnen zu tun." },
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
          sieg: { weiter: "vor_finale", folge: "Sera ist über den Wehrgang. Zwischen ihr und dem Signalfeuer liegt nur noch die Hochwarte." }, gefangen: { setzt: { sera_oben: true }, weiter: "verschleppt3", folge: "Die Jäger haben Sera zur Hochwarte hinaufgeschleift. Oben müsst ihr sie erst befreien, bevor das Feuer brennen kann." } };
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
        A.merker.gletscherwasser ? "↳ Ihr spürt die Kälte der Flaschen durch eure Mäntel. Jetzt wird sich zeigen, ob das Wachtbuch recht hat." : "",
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
        const b = m.sera_oben ? { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 3) / 2), start: [8, 4], route: [], ausgang: false, gefesselt: true }
          : Object.assign(ESKORTE.finale.begleiter(seraTP(A, 3)), { titel: "Botin des Wachtordens" });
        return { begegnung: "finale", karte: HOCHWARTE, keinAnfuehrer: true, skalaMal: mal, beute: false, begleiter: b,
          sieg: { weiter: m.sera_oben ? "signal_nachher" : "signal_brennt" }, gefangen: { weiter: "nordwarte_verstummt" } };
      },
    },
    signal_nachher: {
      art: "erzaehlung", abschnitt: 3, titel: "Frei", ort: "Die Hochwarte", weiter: "funke",
      text: ["Der Fackelzehrer zerfällt zu Asche, und der Wind trägt ihn davon. Ihr schneidet Sera los. Mit zitternden Händen legt sie den Funken in den Korb. Diesmal stört niemand. Das Signalfeuer brennt.", "„Ihr seid zweimal für mich gekommen“, sagt sie. „Das vergisst der Orden nicht.“"],
      beimEintritt: () => ({ setzt: { signal: true, sera_gerettet: true }, folge: "Ihr habt Sera dem Fackelzehrer wieder abgenommen, und das Signalfeuer brennt doch noch." }),
    },
    signal_brennt: {
      art: "erzaehlung", abschnitt: 3, titel: "Das letzte Licht", ort: "Die Hochwarte", weiter: "funke",
      beimEintritt: () => ({ setzt: { signal: true }, folge: "Das Signalfeuer brennt. Sein Strahl zeigt nach Osten, auf das nächste Siegel." }),
      text: ["Das Signalfeuer flammt auf, weiß und heiß, und für einen Augenblick ist es auf dem Grat taghell. Der Fackelzehrer schreit, ohne Stimme, und zerfällt.", "Ein Lichtstrahl steigt in den Himmel, knickt nach Osten ab und bleibt über einem fernen Berg stehen. Dort liegt das nächste Siegel."],
    },
    funke: {
      art: "wahl", abschnitt: 3, titel: "Der Wachtfunke", ort: "Die Hochwarte",
      text: ["Der Wachtfunke glimmt noch in der Asche, kleiner jetzt, aber nicht erloschen. Sera sieht euch an. „Er gehört dem Orden. Aber ihr habt ihn hierher gebracht. Entscheidet ihr.“", "Stimmt ab."],
      optionen: [
        { id: "brennen", text: "Im Signalfeuer lassen: Die Hochwarte brennt weiter", weiter: "ende_fackel", folge: "Der Funke bleibt im Feuer. Die Hochwarte leuchtet weiter, und Sera bleibt bei ihr." },
        { id: "mitnehmen", text: "Mitnehmen: Er zeigt den Weg zum nächsten Siegel – und verrät euch den Jägern", weiter: "ende_funke", folge: "Ihr tragt den Funken weiter. Er zeigt euch den Weg, und den Jägern zeigt er euch." },
        { id: "loeschen", text: "Löschen: Die Jäger verlieren die Spur – und ihr auch", weiter: "ende_dunkel", folge: "Der Funke ist erloschen. Niemand folgt euch mehr, und niemand weist euch den Weg." },
      ],
    },
    ende_fackel: {
      art: "ende", abschnitt: 3, titel: "Die Fackel bewahrt", ort: "Die Hochwarte", rueckschau,
      text: (A) => ["Ihr lasst den Funken im Feuer. Die Hochwarte brennt wieder, wie vor vierzig Jahren, und in den Tälern sehen die Leute nach Norden und wissen nicht, warum ihnen leichter ums Herz ist.", ...epilog(A), "Sera bleibt auf der Hochwarte, als neue Wächterin. Wenn ihr wiederkommt, wird das Feuer brennen."],
    },
    ende_funke: {
      art: "ende", abschnitt: 3, titel: "Der Funke im Gepäck", ort: "Die Hochwarte", rueckschau,
      text: (A) => ["Ihr nehmt den Funken mit. Er zieht nach Osten, wie eine Kompassnadel, und ihr wisst: Das nächste Siegel ist nicht mehr weit.", ...epilog(A), "Aber in der zweiten Nacht seht ihr hinter euch Fackeln auf dem Pass. Die Jäger riechen ihn auch."],
    },
    ende_dunkel: {
      art: "ende", abschnitt: 3, titel: "Die Nordwarte verstummt", ort: "Die Hochwarte", rueckschau,
      text: (A) => ["Ihr drückt den Funken in den Schnee, bis er erlischt. Das Signalfeuer brennt noch eine Nacht, dann geht es aus. Die Jäger finden keine Spur mehr – und ihr auch nicht.", ...epilog(A), "Den Weg zum nächsten Siegel werdet ihr in alten Büchern suchen müssen. Sera sagt, sie kennt eine Bibliothek."],
    },
    nordwarte_verstummt: {
      art: "ende", niederlage: true, abschnitt: 3, titel: "Die Nordwarte verstummt", ort: "Die Hochwarte",
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
    ehrentitel: "Fackelträger des Nordens", // Kampagnentitel für alle gefundenen Enden (Heldensammlung)
    id: "hochwacht", schwierigkeit: 3, titel: "Die letzte Fackel von Hochwacht", kurz: "Hochwacht", untertitel: "Ein Eskorte-Abenteuer im Norden",
    kurztext: "Bringt die Botin Sera Venn durch einen belagerten Pass zur Hochwarte.",
    min: 3, max: 6, stufen: "1–3", dauer: "3–4 Stunden", abschnitte: 3, enden: 3,
    bild: "img/hochwacht/titel.webp", vorschau: "img/hochwacht/vorschau.webp", abschnittBilder: { 1: "img/hochwacht/abschnitt-1.webp", 2: "img/hochwacht/abschnitt-2.webp", 3: "img/hochwacht/abschnitt-3.webp" },
    uhr: { name: "Kälte", max: 7, mehr: "Der Wind wird schärfer.", weniger: "Der Wind legt sich ein wenig.", unruhe: "die Kälte lässt niemanden ganz schlafen", rueckzug: "Der Wind wird schärfer." },
    gruppe: "Die Fackelträger", aufbruch: "Über den Pass", niederlage: "Die Nordwarte verstummt", chronik: "Chronik von Hochwacht",
    einleitung: [
      { eyebrow: "I · Die sieben Siegel", titel: "Was der Krieg zurückließ", text: ["Vor dreihundert Jahren endete der Krieg der Magier. Was er hervorgebracht hatte, ließ sich nicht töten. Man band es in sieben Siegel.", "Grauwacht war eines davon. Wer dort war, weiß: Die Siegel halten nicht von allein."] },
      { eyebrow: "II · Der Norden", titel: "Ein Licht auf dem Felsgrat", text: ["Über dem Pass im Norden steht die Signalwarte von Hochwacht. Seit Jahrzehnten war sie dunkel.", "Seit drei Nächten brennt dort oben wieder ein schwaches Licht. Niemand weiß, wer es entzündet hat."] },
      { eyebrow: "III · Der Auftrag", titel: "Die Botin und der Funke", text: ["Sera Venn ist die letzte Botin des alten Wachtordens. Sie trägt den Wachtfunken, der die Nordwarte öffnet. Der Funke zieht alles an, was im Pass auf Beute wartet. Sera kennt den Weg, aber sie ist keine Kämpferin.", "Bringt sie lebend zur Hochwarte. Die Siegeljäger sind schon unterwegs."] },
    ],
    kodexUhr: { titel: "Die Kälte", text: ["Jede kurze Rast und mancher Umweg kosten Zeit. Mit der Zeit wird es im Pass <b>kälter</b>, bis zu sieben Stufen.", "Ab der dritten Stufe findet am Lagerfeuer niemand mehr richtig Schlaf: Eine lange Rast heilt dann nur noch bis drei Viertel der Trefferpunkte. Wer zügig weiterzieht, kommt ausgeruhter oben an."] },
    abschnitte_namen: { 1: "Der Überfall am Pass", 2: "Die stumme Wacht", 3: "Das letzte Licht" },
    endeHinweise: {
      ende_fackel: "Ein anderes Ende hängt an der letzten Abstimmung auf der Hochwarte: Dort bleibt der Wachtfunke, wo er vierzig Jahre gefehlt hat.",
      ende_funke: "Ein anderes Ende hängt an der letzten Abstimmung auf der Hochwarte: Dort geht der Wachtfunke mit euch weiter, mit allem, was ihm folgt.",
      ende_dunkel: "Ein anderes Ende hängt an der letzten Abstimmung auf der Hochwarte: Dort ist euch wichtiger, dass niemand eure Spur findet, als dass jemand den Weg sieht.",
    },
  };
  const API = { META, ESKORTE, EREIGNISSE: [], WISSEN, START: "prolog", NIEDERLAGE: "hochwacht_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.hochwacht = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
