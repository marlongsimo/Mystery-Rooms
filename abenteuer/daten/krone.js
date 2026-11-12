/*
 * Die Krone unter dem Eis – ENTWURF (Schwierigkeit 4, siehe KONZEPT-KRONE.md)
 * Akt I: Vorgeschichte, drei Wege nach Veyrholm (je ein Pfadkampf), Marktplatz der leeren Fenster, Kammern der Verschleppten.
 * Akt II: Brücke über den Gletscherbruch, Tor der Kronenwache. Akt III: Archiv der Namen, Frostkammer, Kronensaal, drei Enden.
 * Die Kämpfe nutzen die Mechaniken aus regeln.js (Ziel-Objekte, Wellen, Eis, Schutzfeld, Rufer, Nester).
 * Karten ohne Bild: M Fels/Mauer, K niedriger Wall (Deckung), Q Abgrund oder Wasser (versperrt den Weg, nicht die Sicht).
 */
(function (root) {
  "use strict";
  const M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y], Q = (x, y) => ["Q", x, y];
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { const f = { M, K, Q }[c]; if (f) h.push(f(x, y)); })); return h; };
  const sp = [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wo = [[3, 4], [3, 3], [3, 5], [2, 2]];

  /* ---------- Karten (12 × 9) ---------- */
  // A · Sturmgrat: ein Grat über dem Abgrund, Windschutzmauern, rechts auf einem Felsen das Jagdhorn
  const STURMGRAT = { name: "Der Sturmgrat", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["QQQQQQQQQQQQ", "QQQ...QQQ..Q", "Q.....K....Q", "....K.......", "............", "....K...K...", "Q.....K....Q", "QQQ..QQQ...Q", "QQQQQQQQQQQQ"]),
    start: { spieler: sp, wolf: wo, gegner: [[10, 4], [9, 3], [9, 5], [10, 2], [10, 6], [8, 4], [11, 5], [7, 2], [7, 6], [4, 1], [4, 7], [11, 3]] } };
  // B · Unterstollen: ein eingestürzter Bergwerksstollen, zwei Schwärmernester in Seitennischen, brüchiges Eis in der Mitte
  const UNTERSTOLLEN = { name: "Die Unterstollen", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M...MM....MM", "M.M....MM..M", "....MM......", "............", "...M....MM..", "M.....MM...M", "MM..M......M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 3], [0, 4], [2, 1]], gegner: [[9, 1], [9, 7], [10, 4], [9, 3], [10, 5], [10, 2], [10, 6], [8, 4], [11, 3], [11, 5]] } };
  // C · Pilgerstraße: ein Treppenweg zwischen Grabnischen, drei erloschene Grablichter
  const PILGERSTRASSE = { name: "Die Pilgerstraße", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M.M..M..M..M", "M..........M", "M...K..K...M", "............", "M...K..K...M", "M..........M", "M.M..M..M..M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: wo, gegner: [[9, 4], [10, 4], [8, 2], [8, 6], [9, 3], [9, 5], [10, 2], [10, 6], [7, 4], [11, 4]] } };
  // Marktplatz der leeren Fenster: drei Siegelsteine, Hauszugänge oben und unten
  const MARKT = { name: "Marktplatz der leeren Fenster", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMM.MMM.MMM", "M..........M", "M.K......K.M", "M..........M", "...........M", "M..........M", "M.K......K.M", "M..........M", "MMMM.MMM.MMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 3], [3, 5], [1, 2]], gegner: [[10, 4], [9, 3], [9, 5], [10, 2], [10, 6], [7, 1], [7, 7], [10, 1], [10, 7], [9, 4], [5, 1], [5, 7]] } };
  // Die Kammern der Verschleppten: ein Gewölbe mit drei Eisblöcken, Risse in den Wänden
  const KAMMERN = { name: "Die Kammern der Verschleppten", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M....MM....M", "M..........M", "M..MM..MM..M", "...........M", "M..MM..MM..M", "M..........M", "M....MM....M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [2, 3], [2, 5], [1, 2]], gegner: [[8, 4], [9, 2], [9, 6], [7, 2], [7, 6], [10, 4]] } };
  /* ----- Akt II und III ----- */
  // Die Brücke über den Gletscherbruch: drei Felder breit über dem Abgrund, Felsplattformen an beiden Enden, rechts der Ausgang
  const BRUECKE = { name: "Die Brücke über den Gletscherbruch", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M...QQQQ...M", "M..QQQQQQ..M", "............", "............", "............", "M..QQQQQQ..M", "M...QQQQ...M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[0, 3], [0, 5], [0, 4], [2, 2]], gegner: [[9, 4], [9, 1], [10, 2], [9, 7], [10, 6], [9, 3], [9, 5], [10, 1], [10, 7], [8, 4]] } };
  // Das Tor der Kronenwache: Vorhof vor dem Palast, zwei Runensäulen an den Seiten
  const TOR = { name: "Das Tor der Kronenwache", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M...M..M...M", "M..........M", "M..K....K..M", "............", "M..K....K..M", "M..........M", "M...M..M...M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [2, 2], [2, 6], [4, 4]], gegner: [[8, 4], [9, 2], [9, 6], [10, 1], [10, 7], [10, 4], [7, 2], [7, 6], [8, 1], [8, 7]] } };
  // Das Archiv der Namen: Regalgänge, drei Schrifttafeln, Schriftkapseln in den Wänden
  const ARCHIV = { name: "Das Archiv der Namen", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M.M.M..M.M.M", "M..........M", "M.MM.MM.MM.M", "............", "M.MM.MM.MM.M", "M..........M", "M.M.M..M.M.M", "MMMMMMMMMMMM"]),
    start: { spieler: [[1, 4], [2, 4], [0, 4], [1, 2], [1, 6], [2, 2]], wolf: [[3, 4], [3, 2], [3, 6], [2, 6]], gegner: [[9, 4], [8, 2], [8, 6], [10, 2], [10, 6], [7, 4], [10, 3], [5, 2], [5, 6], [9, 2]] } };
  // Die Frostkammer: Säulenhalle mit zwei Nestern, in der Mitte die Frostmatrone
  const FROSTKAMMER = { name: "Die Frostkammer", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M....MM....M", "M.MM....MM.M", "M..........M", "............", "M..........M", "M.MM....MM.M", "M....MM....M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 3], [3, 5], [1, 3]], gegner: [[9, 4], [10, 1], [10, 7], [8, 3], [8, 5], [10, 3], [10, 5], [7, 4]] } };
  // Der Kronensaal: Säulenhalle, rechts das Kronenherz, drei Runenpunkte, Seitengänge für die Ehrengarde
  const KRONENSAAL = { name: "Der Kronensaal", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText(["MMMMMMMMMMMM", "M...M..M...M", "M.K......K.M", "M..........M", "...........M", "M..........M", "M.K......K.M", "M...M..M...M", "MMMMMMMMMMMM"]),
    start: { spieler: sp, wolf: [[3, 4], [3, 3], [3, 5], [1, 2]], gegner: [[9, 4], [8, 2], [8, 6], [9, 3], [9, 5], [10, 1], [10, 7], [8, 4]] } };
  const KARTEN = { STURMGRAT, UNTERSTOLLEN, PILGERSTRASSE, MARKT, KAMMERN, BRUECKE, TOR, ARCHIV, FROSTKAMMER, KRONENSAAL };
  // Ziel-Objekte und Mechaniken je Kampf (Felder müssen frei sein, siehe tests/krone.test.js)
  const OBJEKTE = {
    horn: { id: "horn", name: "Das Jagdhorn", art: "horn", x: 10, y: 3, runden: 2, ruhe: true, aktion: "Jagdhorn sichern", fertigText: "Ihr reißt das Horn vom Pfahl. Die Jäger hören auf zu blasen" },
    lichter: [{ id: "l1", name: "Grablicht am Treppenfuß", art: "grablicht", x: 3, y: 2, umkehrbar: true, aktion: "Grablicht entzünden", fertigText: "Eine kleine Flamme, warm wie Atem", wirkung: { schild: true } },
      { id: "l2", name: "Grablicht im Schrein", art: "grablicht", x: 6, y: 6, umkehrbar: true, aktion: "Grablicht entzünden", fertigText: "Eine kleine Flamme, warm wie Atem", wirkung: { schild: true } },
      { id: "l3", name: "Grablicht am Tor", art: "grablicht", x: 9, y: 1, umkehrbar: true, aktion: "Grablicht entzünden", fertigText: "Eine kleine Flamme, warm wie Atem", wirkung: { schild: true } }],
    steine: [{ id: "s1", name: "Siegelstein Nord", art: "siegelstein", x: 6, y: 2, runden: 2, ruhe: true, umkehrbar: true, aktion: "Siegelstein abschalten", fertigText: "Das Licht im Stein erlischt" },
      { id: "s2", name: "Siegelstein Mitte", art: "siegelstein", x: 8, y: 4, runden: 2, ruhe: true, umkehrbar: true, aktion: "Siegelstein abschalten", fertigText: "Das Licht im Stein erlischt" },
      { id: "s3", name: "Siegelstein Süd", art: "siegelstein", x: 6, y: 6, runden: 2, ruhe: true, umkehrbar: true, aktion: "Siegelstein abschalten", fertigText: "Das Licht im Stein erlischt" }],
    bloecke: [{ id: "b1", name: "Eisblock mit einem Kind", art: "eisblock", x: 10, y: 1, runden: 2, frist: 6, aktion: "Eis aufschlagen", fertigText: "Das Eis springt, ein Kind fällt euch hustend in die Arme", wirkung: { gerettet: true, verlorenText: "Hinter dem Eis wird es still." } },
      { id: "b2", name: "Eisblock mit einer alten Frau", art: "eisblock", x: 5, y: 4, runden: 2, frist: 6, aktion: "Eis aufschlagen", fertigText: "Das Eis bricht, eine alte Frau atmet zum ersten Mal seit Jahren", wirkung: { gerettet: true, verlorenText: "Hinter dem Eis wird es still." } },
      { id: "b3", name: "Eisblock mit einem Wachmann", art: "eisblock", x: 10, y: 7, runden: 2, frist: 6, aktion: "Eis aufschlagen", fertigText: "Das Eis platzt, ein Mann in alter Rüstung sinkt auf die Knie", wirkung: { gerettet: true, verlorenText: "Hinter dem Eis wird es still." } }],
  };
  OBJEKTE.gitter = [3, 4, 5].map((y, i) => ({ id: "g" + (i + 1), name: "Eisgitter", art: "gitter", x: 10, y, runden: 2, aktion: "Eisgitter aufschlagen", fertigText: "Das Gitter zerspringt", wirkung: { oeffnet: true } }));
  OBJEKTE.saeulen = [{ id: "r1", name: "Runensäule Nord", art: "saeule", x: 9, y: 1, runden: 2, ruhe: true, aktion: "Runensäule abschalten", fertigText: "Die Rune erlischt" },
    { id: "r2", name: "Runensäule Süd", art: "saeule", x: 9, y: 7, runden: 2, ruhe: true, aktion: "Runensäule abschalten", fertigText: "Die Rune erlischt" }];
  OBJEKTE.tafeln = [{ id: "t1", name: "Tafel der Gründer", art: "tafel", x: 6, y: 1, runden: 2, frist: 6, umkehrbar: true, aktion: "Tafel sichern", fertigText: "Ihr wickelt die Tafel in Mäntel. Die Namen bleiben", wirkung: { verlorenText: "Die letzten Zeichen verblassen." } },
    { id: "t2", name: "Tafel der Wächter", art: "tafel", x: 6, y: 7, runden: 2, frist: 6, umkehrbar: true, aktion: "Tafel sichern", fertigText: "Ihr wickelt die Tafel in Mäntel. Die Namen bleiben", wirkung: { verlorenText: "Die letzten Zeichen verblassen." } },
    { id: "t3", name: "Tafel des Herzens", art: "tafel", x: 11, y: 4, runden: 2, frist: 6, umkehrbar: true, aktion: "Tafel sichern", fertigText: "Ihr wickelt die Tafel in Mäntel. Die Namen bleiben", wirkung: { verlorenText: "Die letzten Zeichen verblassen." } }];
  OBJEKTE.runen = [[6, 1], [6, 7], [10, 2]].map(([x, y], i) => ({ id: "p" + (i + 1), name: ["Runenpunkt Nord", "Runenpunkt Süd", "Runenpunkt am Herzen"][i], art: "rune", x, y, runden: 2, ruhe: true, aktion: "Runenpunkt schließen", fertigText: "Die Rune verlischt", wirkung: { schild: true, welleAusAlle: "garde" } }));
  OBJEKTE.herz = { id: "herz", name: "Das Kronenherz", art: "herz", x: 10, y: 4, runden: 3, ruhe: true, aktion: "Das Kronenherz berühren", fertigText: "Eure Hände liegen auf dem Herzen der Siegel. Der König hält inne" };
  const NAMEN = { siegeljaeger: "Maskierter Jäger", jaegerschuetze: "Maskierter Schütze", funkenhund: "Fährtenhund", jaegerhauptmann: "Jägerhauptmann Varrek", eisgezeichneter: "Verlorener Pilger" };
  const bonusName = { signalhorn: "das Signalhorn", kernsplitter: "den Kernsplitter", pilgerzeichen: "das Pilgerzeichen" };

  const SZENEN = {
    /* ================= Akt I · Der Eintritt in die Stadt ================= */
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Licht unter dem Eis", ort: "Im hohen Norden", weiter: "vorgeschichte",
      text: [
        "Das Signal von Hochwacht blieb nicht unbeantwortet. In einer klaren Nacht erschien weit im Norden ein zweites Licht – nicht auf einem Berg, sondern unter dem Eis eines Gletschers, als brenne dort unten eine Stadt.",
        "Alte Aufzeichnungen kennen den Ort: Veyrholm, die Hauptstadt des Reiches, das die sieben Siegel errichtete. Unter ihrem Palast soll das Kronenherz liegen, der Kern, der alle Siegel verbindet.",
        "Ihr seid nicht die Einzigen, die es gesehen haben.",
      ],
    },
    vorgeschichte: {
      art: "wahl", abschnitt: 1, titel: "Was hinter euch liegt (1/2)", ort: "Im hohen Norden",
      text: ["Habt ihr das Siegel von Grauwacht erlebt? Wie endete es? (Das ändert Gespräche und einzelne Kämpfe, nicht den Weg. Wer es nicht kennt, wählt „Nicht dabei gewesen“.)"],
      optionen: [
        { id: "erneuert", text: "Wir haben das Siegel erneuert", setzt: { grauwacht: "erneuert" }, weiter: "vorgeschichte2" },
        { id: "gebrochen", text: "Wir haben das Siegel gebrochen", setzt: { grauwacht: "gebrochen", bund_gewarnt: true }, weiter: "vorgeschichte2" },
        { id: "verrat", text: "Anselm hat uns verraten", setzt: { grauwacht: "verrat", anselm_spur: true }, weiter: "vorgeschichte2" },
        { id: "nicht", text: "Nicht dabei gewesen", setzt: { grauwacht: "nicht" }, weiter: "vorgeschichte2" },
      ],
    },
    vorgeschichte2: {
      art: "wahl", abschnitt: 1, titel: "Was hinter euch liegt (2/2)", ort: "Im hohen Norden",
      text: ["Und die Hochwarte? Was wurde aus dem Wachtfunken und aus Sera Venn?"],
      optionen: [
        { id: "fackel", text: "Der Funke brennt auf der Hochwarte, Sera hütet ihn", setzt: { hochwacht: "fackel" }, weiter: "gletscherrand" },
        { id: "funke", text: "Wir haben den Funken mitgenommen", setzt: { hochwacht: "funke", funke: true, bund_gewarnt: true }, weiter: "gletscherrand" },
        { id: "dunkel", text: "Wir haben den Funken gelöscht", setzt: { hochwacht: "dunkel" }, weiter: "gletscherrand" },
        { id: "verloren", text: "Sera wurde verschleppt", setzt: { hochwacht: "verloren", sera_verschollen: true }, weiter: "gletscherrand" },
        { id: "nicht", text: "Nicht dabei gewesen", setzt: { hochwacht: "nicht" }, weiter: "gletscherrand" },
      ],
    },
    gletscherrand: {
      art: "gespraech", abschnitt: 1, titel: "Am Rand des Gletschers", ort: "Kaltbrunn, das letzte Dorf",
      text: (A) => [
        "Kaltbrunn sind sieben Häuser am Rand eines Gletschers, so groß, dass er bis an den Himmel zu reichen scheint. In der einzigen Stube mit Feuer sitzt Ylva Hallgrim, Eisschneiderin, und mustert euch, als zähle sie, wie viele von euch zurückkommen.",
        "„Ihr wollt nach Veyrholm“, sagt sie. „Wie die Maskierten vor zwei Tagen. Ich sag euch, was ich denen auch gesagt habe: Es gibt drei Wege hinein. Keiner ist gut.“",
        A.merker.hochwacht === "fackel" ? "Auf dem Tisch liegt ein Brief mit dem Siegel des Wachtordens. Ylva schiebt ihn zu euch herüber: „Kam vor einer Woche. Für euch, steht drauf.“" : "",
        A.merker.funke ? "Der Wachtfunke in eurem Gepäck ist unruhig. Er zieht nach Norden, wie eine Kompassnadel, die zittert." : "",
      ],
      optionen: [
        { id: "veyrholm", text: "Nach Veyrholm fragen", wer: "Ylva", frage: "„Was ist Veyrholm?“",
          antwort: "„Eine Stadt, die der Gletscher gefressen hat. Vor dreihundert Jahren, sagen die Alten, über Nacht. Die Leute sind nicht geflohen. Man sieht sie manchmal, unter dem Eis, wie Fische im Winterteich.“ Sie spuckt ins Feuer. „Und seit dem Licht bewegen sie sich.“", setzt: { veyrholm_wissen: true } },
        { id: "bund", text: "Nach den Maskierten fragen", wer: "Ylva", frage: "„Wer waren die Maskierten?“",
          antwort: (A) => `„Zwölf, vielleicht fünfzehn. Masken mit einer leeren Krone darauf. Sie nennen sich den Bund der Hohlkrone. Ihr Anführer heißt Varrek und hat Hunde dabei, die nach etwas schnüffeln, das ich nicht riechen kann.“${A.merker.anselm_spur ? " Sie zögert. „Einer hatte einen Brief. Mit dem Siegel eines Abtes. Anselm, stand da.“" : ""}`,
          setzt: { bund_bekannt: true } },
        { id: "wege", text: "Nach den drei Wegen fragen", wer: "Ylva", frage: "„Welche drei Wege?“",
          antwort: "„Der Sturmgrat: offen, windig, schnell. Da sind die Maskierten hoch, Varrek und seine Hunde. Die Unterstollen: das alte Bergwerk, kurz und dunkel, aber im Eis nisten Glasschwärmer. Und die Pilgerstraße: Treppen, Schreine, Gräber. Langsam. Still. Zu still.“", setzt: { wege_bekannt: true } },
        { id: "brief", text: "Den Brief des Ordens lesen", wenn: (A) => A.merker.hochwacht === "fackel", wer: "Sera (Brief)", frage: "Ihr brecht das Siegel.",
          antwort: "„Das Licht unter dem Eis ist die Antwort auf unser Signal. Veyrholm ruft zurück. Geht nicht ohne Vorrat. Ich schicke, was der Orden entbehren kann. – S. V.“ Unter dem Brief: ein Päckchen mit zwei Heiltränken.", tranke: 2 },
        { id: "funke", text: "Dem Zug des Funkens folgen", wenn: (A) => Boolean(A.merker.funke), wer: "Der Wachtfunke", frage: "Ihr haltet den Funken über Ylvas Karte.",
          antwort: "Er zieht zur Pilgerstraße, bis an einen eingezeichneten Schrein. Ylva wird blass. „Da hat meine Großmutter gebetet. Bevor das Eis kam.“", setzt: { funke_zeigt: true } },
        { id: "vorraete", text: "Ylva um Ausrüstung bitten", frage: "„Habt Ihr etwas für den Weg?“",
          probe: { name: "Überzeugen", attr: "CHA", sg: 13, geuebt: ["kleriker", "schurke"], knapp: true,
            erfolg: { text: "Ylva holt Steigeisen, ein Seil und zwei Heiltränke aus einer Truhe. „Bringt das Seil zurück.“", tranke: 2, setzt: { seil: true } },
            knapp: { text: "„Ein Trank. Mehr hab ich nicht für Leute, die nicht zurückkommen.“", tranke: 1 },
            fehl: { text: "„Ich hab den Maskierten schon alles verkauft.“" } } },
        { id: "los", text: "Zum Gletscherplateau aufbrechen", weiter: "routenwahl" },
      ],
    },
    routenwahl: {
      art: "wahl", abschnitt: 1, titel: "Drei Wege nach Veyrholm", ort: "Das Gletscherplateau",
      text: (A) => [
        "Auf dem Plateau liegt die Stadt unter euch: Dächer und Türme, eingeschlossen im blauen Eis, als hätte jemand sie in Glas gegossen. Drei Wege führen hinab. Ihr nehmt nur einen.",
        A.merker.wege_bekannt ? "Ylvas Worte im Ohr: der Grat ist schnell, aber die Maskierten sind dort. Die Stollen sind kurz, aber voller Schwärmer. Die Pilgerstraße ist still." : "",
        "Stimmt ab.",
      ],
      optionen: [
        { id: "grat", text: "A · Der Sturmgrat: offen, windig, Schützen und Hunde", setzt: { s4_route: "sturmgrat" }, weiter: "anmarsch_grat" },
        { id: "stollen", text: "B · Die Unterstollen: eng, dunkel, brüchiges Eis", setzt: { s4_route: "stollen" }, weiter: "anmarsch_stollen" },
        { id: "pilger", text: "C · Die Pilgerstraße: Treppen, Schreine, Grabnischen", setzt: { s4_route: "pilgerweg" }, weiter: "anmarsch_pilger" },
      ],
    },
    // ----- A · Sturmgrat -----
    anmarsch_grat: {
      art: "probe", abschnitt: 1, titel: "Der Sturmgrat", ort: "Der Sturmgrat",
      text: (A) => ["Der Grat ist so schmal, dass ihr hintereinander gehen müsst. Der Wind reißt an euren Mänteln. Alle klettern; gelingt es der Hälfte, kommt ihr ungesehen voran.", A.merker.seil ? "Ylvas Seil hält euch zusammen: Vorteil." : ""],
      probe: { name: "Klettern", wer: "gruppe", attr: "GES", sg: 12, geuebt: ["waldlaeufer", "schurke"], vorteil: (A) => (A.merker.seil ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr seht die Maskierten, bevor sie euch sehen: Sie bewachen ein großes Jagdhorn auf einem Pfahl. Damit rufen sie, wer immer in der Stadt auf sie hört.", setzt: { grat_ueberrascht: true }, weiter: "grat_wahl" },
        knapp: { text: "Ihr kommt hinauf, aber nicht leise. Vor euch, auf einem Felsen, ein großes Jagdhorn. Die Maskierten drehen sich um.", weiter: "grat_wahl" },
        fehl: { text: "Ein Stein löst sich und poltert in die Tiefe. Oben bläst jemand in ein Horn.", glocke: 1, weiter: "grat_wahl" } },
    },
    grat_wahl: {
      art: "wahl", abschnitt: 1, titel: "Das Jagdhorn", ort: "Der Sturmgrat",
      text: ["Wer das Horn hat, bestimmt, wann die Maskierten Verstärkung rufen. Ihr könnt darum kämpfen oder im Windschatten an ihnen vorbei. Stimmt ab."],
      optionen: [
        { id: "kampf", text: "Um das Jagdhorn kämpfen (Belohnung: das Signalhorn)", weiter: "kampf_grat" },
        { id: "schleichen", text: "Im Windschatten vorbeischleichen (keine Belohnung)", weiter: "grat_schleichen" },
      ],
    },
    grat_schleichen: {
      art: "probe", abschnitt: 1, titel: "Im Windschatten", ort: "Der Sturmgrat",
      text: ["Geduckt, Felsen um Felsen. Alle schleichen; gelingt es der Hälfte, seid ihr vorbei."],
      probe: { name: "Schleichen", wer: "gruppe", attr: "GES", sg: 13, geuebt: ["schurke", "waldlaeufer"],
        erfolg: { text: "Der Wind verschluckt eure Schritte. Hinter euch bleiben die Maskierten und ihr Horn zurück.", setzt: { s4_route_bonus: "keiner" }, weiter: "markt_ankunft" },
        fehl: { text: "Ein Fährtenhund hebt den Kopf. Dann bellen alle.", weiter: "kampf_grat" } },
    },
    kampf_grat: {
      art: "kampf", abschnitt: 1, titel: "Jagd auf die Fackel", ort: "Der Sturmgrat",
      text: ["Jägerhauptmann Varrek und seine Maskierten verteidigen das Jagdhorn rechts auf dem Felsen. Sichert es (zwei Aktionen direkt daneben, ohne Gegner neben euch) oder besiegt sie. Am Rand geht es in den Abgrund."],
      kampf: (A) => ({ begegnung: "k_grat", karte: STURMGRAT, keinAnfuehrer: true, mischen: false, namen: NAMEN, ueberraschung: Boolean(A.merker.grat_ueberrascht), skalaMal: A.merker.bund_gewarnt ? 1.1 : 1,
        mechanik: { ziele: [OBJEKTE.horn], sieg: { ziele: 1, art: "horn", text: "Das Jagdhorn ist euer. Die Maskierten ziehen sich in den Sturm zurück." } },
        sieg: { setzt: { s4_route_bonus: "signalhorn" }, weiter: "grat_nach" }, verloren: { setzt: { s4_route_bonus: "keiner" }, glocke: 1, weiter: "pfad_rueckzug" } }),
    },
    grat_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Das Signalhorn", ort: "Der Sturmgrat", weiter: "markt_ankunft", rastErlaubt: true,
      text: ["Das Horn ist aus dem Gehörn eines Tieres, das es nicht mehr gibt, und mit Silber beschlagen. Wenn ihr hineinblast, antwortet etwas in der Stadt. Varreks Leute werden zögern, bevor sie ihre Verstärkung rufen. Ihr habt **das Signalhorn**."],
    },
    // ----- B · Unterstollen -----
    anmarsch_stollen: {
      art: "probe", abschnitt: 1, titel: "Die Unterstollen", ort: "Das alte Bergwerk",
      text: ["Der Stollen ist halb eingestürzt. Milchige Kristallfäden hängen von der Decke, und irgendwo klirrt es, als zerbreche Glas. Eine Person führt durch die Dunkelheit."],
      probe: { name: "Orientierung", attr: "WEI", sg: 12, geuebt: ["waldlaeufer", "zauberer"], knapp: true,
        erfolg: { text: "Ihr findet einen Weg, auf dem das Eis trägt. Vor euch weitet sich der Stollen zu einer Halle: zwei Nester aus Glas, und etwas Großes, das darin brütet.", setzt: { stollen_bekannt: true }, weiter: "stollen_wahl" },
        knapp: { text: "Ihr kommt durch, aber es dauert. Vor euch eine Halle voller Glasnester.", weiter: "stollen_wahl" },
        fehl: { text: "Ein Gang endet im Nichts, ein anderer im Wasser. Ihr seid nass und durchgefroren, als ihr die Nesthalle erreicht.", glocke: 1, weiter: "stollen_wahl" } },
    },
    stollen_wahl: {
      art: "wahl", abschnitt: 1, titel: "Das Nest", ort: "Die Unterstollen",
      text: ["Im größeren Nest glimmt ein Kristall, so klar, dass das Licht darin zu stehen scheint: ein Splitter aus dem Herzen der Stadt. Die Brutmutter wird ihn nicht hergeben. Oder ihr kriecht durch einen engen Seitenschacht vorbei. Stimmt ab."],
      optionen: [
        { id: "kampf", text: "Das Nest ausräuchern (Belohnung: der Kernsplitter)", weiter: "kampf_stollen" },
        { id: "schacht", text: "Durch den Seitenschacht kriechen (keine Belohnung)", weiter: "stollen_schacht" },
      ],
    },
    stollen_schacht: {
      art: "probe", abschnitt: 1, titel: "Der Seitenschacht", ort: "Die Unterstollen",
      text: ["Der Schacht ist eng und vereist. Alle kriechen; gelingt es der Hälfte, zieht ihr die anderen durch."],
      probe: { name: "Kriechen", wer: "gruppe", attr: "STR", sg: 12, geuebt: ["krieger"],
        erfolg: { text: "Mit aufgeschürften Händen und Knien kommt ihr auf der anderen Seite heraus. Hinter euch summt das Nest.", setzt: { s4_route_bonus: "keiner" }, weiter: "markt_ankunft" },
        fehl: { text: "Der Schacht bricht ein, und ihr rutscht genau in die Nesthalle.", weiter: "kampf_stollen" } },
    },
    kampf_stollen: {
      art: "kampf", abschnitt: 1, titel: "Nest im Eis", ort: "Die Unterstollen",
      text: ["Zwei Schwärmernester in den Nischen oben und unten, dazwischen die Splitterbrutmutter, die alle zwei Runden eine Brut ausspeit. Zerstört beide Nester oder besiegt die Mutter. Das Eis in der Mitte knackt."],
      kampf: (A) => {
        const eis = []; for (let x = 4; x <= 7; x++) eis.push([x, 4]);
        return { begegnung: "k_stollen", karte: UNTERSTOLLEN, keinAnfuehrer: true, mischen: false,
          mechanik: { eis: { felder: eis, proRunde: 1, ab: 3, bekannt: Boolean(A.merker.stollen_bekannt) }, sieg: { besiegt: [{ art: "glasnest", n: 2 }, { art: "splitterbrutmutter", n: 1 }], text: "Das Summen bricht ab. Die Nesthalle ist still." } },
          sieg: { setzt: { s4_route_bonus: "kernsplitter" }, weiter: "stollen_nach" }, verloren: { setzt: { s4_route_bonus: "keiner" }, glocke: 1, weiter: "pfad_rueckzug" } };
      },
    },
    stollen_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Der Kernsplitter", ort: "Die Unterstollen", weiter: "markt_ankunft", rastErlaubt: true,
      text: ["Im zerbrochenen Nest liegt der Kristall. Er ist kalt, aber wenn ihr ihn in die Hand nehmt, pulsiert er, langsam, wie ein Herz im Schlaf. Ein Splitter des Kronenherzens: Mit ihm lässt sich ein Kristallschutz einmal brechen. Ihr habt **den Kernsplitter**."],
    },
    // ----- C · Pilgerstraße -----
    anmarsch_pilger: {
      art: "probe", abschnitt: 1, titel: "Die Pilgerstraße", ort: "Die Pilgerstraße",
      text: (A) => ["Hunderte Stufen führen in die Stadt hinab, vorbei an Schreinen und Grabnischen. Im Eis an den Rändern stehen Gestalten, eingefroren mitten im Gehen. Eine Person liest die alten Zeichen an den Schreinen.", A.merker.funke_zeigt ? "Der Funke zieht euch zu dem Schrein, den Ylva gezeigt hat: Vorteil." : ""],
      probe: { name: "Zeichen deuten", attr: "INT", sg: 12, geuebt: ["zauberer", "kleriker"], vorteil: (A) => (A.merker.funke_zeigt ? 1 : 0), knapp: true,
        erfolg: { text: "Die Zeichen sind Gebete: Drei Grablichter halten die Pilger in Ruhe. Sie sind erloschen. Unten am Tor steht ein Eidwächter, und ein Kälterufer bläst die Lichter aus, sobald jemand sie anzündet.", setzt: { pilger_bekannt: true }, weiter: "pilger_wahl" },
        knapp: { text: "Ihr versteht nur so viel: Die Lichter sind wichtig. Und unten wartet ein Wächter.", weiter: "pilger_wahl" },
        fehl: { text: "Die Zeichen bleiben stumm. Als ihr weitergeht, knirscht hinter euch das Eis: Die Gestalten haben sich umgedreht.", glocke: 1, weiter: "pilger_wahl" } },
    },
    pilger_wahl: {
      art: "wahl", abschnitt: 1, titel: "Die namenlosen Pilger", ort: "Die Pilgerstraße",
      text: ["Ihr könnt die drei Grablichter entzünden und den Pilgern ihre Ruhe zurückgeben – oder den Eidwächter bitten, euch durchzulassen. Stimmt ab."],
      optionen: [
        { id: "kampf", text: "Die Grablichter entzünden (Belohnung: das Pilgerzeichen)", weiter: "kampf_pilger" },
        { id: "bitten", text: "Den Eidwächter um Durchlass bitten (keine Belohnung)", weiter: "pilger_bitten" },
      ],
    },
    pilger_bitten: {
      art: "probe", abschnitt: 1, titel: "Der Eid", ort: "Die Pilgerstraße",
      text: ["Der Eidwächter ist ein Riese aus Eis und alter Rüstung. Er hat geschworen, niemanden durchzulassen, der nicht gebetet hat. Eine Person spricht."],
      probe: { name: "Überzeugen", attr: "CHA", sg: 14, geuebt: ["kleriker"], knapp: true,
        erfolg: { text: "Ihr sprecht die Worte von den Schreinen nach. Der Wächter senkt den Hammer und tritt beiseite.", setzt: { s4_route_bonus: "keiner" }, weiter: "markt_ankunft" },
        knapp: { text: "Er lässt euch durch. Aber die Pilger folgen euch ein Stück, und die Kälte kriecht in die Knochen.", setzt: { s4_route_bonus: "keiner" }, glocke: 1, weiter: "markt_ankunft" },
        fehl: { text: "„Kein Gebet“, dröhnt er. Die Pilger lösen sich aus dem Eis.", weiter: "kampf_pilger" } },
    },
    kampf_pilger: {
      art: "kampf", abschnitt: 1, titel: "Die namenlosen Pilger", ort: "Die Pilgerstraße",
      text: ["Entzündet die drei Grablichter (je eine Aktion daneben, bei großen Gruppen zwei in Ruhe) oder besiegt alle. Brennen alle drei, verliert der Eidwächter seinen Schutzkreis. Der Kälterufer bläst Lichter wieder aus – haltet ihn auf."],
      kampf: (A) => {
        // Große Gruppen zünden schneller: ab 5 Helden braucht jedes Licht zwei Aktionen in Ruhe
        const gross = A.gruppe.filter((f) => !A.zust[f].tot).length >= 5, lichter = OBJEKTE.lichter.map((l) => Object.assign({}, l, gross ? { runden: 2, ruhe: true } : {}));
        return { begegnung: "k_pilger", karte: PILGERSTRASSE, keinAnfuehrer: true, namen: NAMEN,
        mechanik: { ziele: lichter, schild: { art: "eidwaechter", ziele: ["l1", "l2", "l3"], halt: 10, pause: 2, text: "Schutzkreis der Pilger" },
          sieg: { ziele: 3, art: "grablicht", text: "Drei Lichter brennen. Die Pilger legen sich nieder, einer nach dem anderen, und das Eis schließt sich über ihnen wie eine Decke." } },
        sieg: { setzt: { s4_route_bonus: "pilgerzeichen" }, weiter: "pilger_nach" }, verloren: { setzt: { s4_route_bonus: "keiner" }, glocke: 1, weiter: "pfad_rueckzug" } };
      },
    },
    pilger_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Das Pilgerzeichen", ort: "Die Pilgerstraße", weiter: "markt_ankunft", rastErlaubt: true,
      text: ["Am Tor liegt ein Anhänger aus Bein: ein Kreis mit sieben Punkten, das Zeichen der Pilger. Wer ihn trägt, sieht in Veyrholm Wege, die andere nicht sehen – und Stellen, an denen ihr ausruhen könnt. Ihr habt **das Pilgerzeichen**."],
    },
    pfad_rueckzug: {
      art: "erzaehlung", abschnitt: 1, titel: "Ohne Beute", ort: "Am Stadtrand", weiter: "markt_ankunft",
      text: ["Ihr kommt durch, aber nicht als Sieger. Hinter euch heult der Wind, vor euch liegt die Stadt. Was ihr hier hättet gewinnen können, bleibt zurück."],
    },
    // ----- Knotenpunkt -----
    markt_ankunft: {
      art: "gespraech", abschnitt: 1, titel: "Die leeren Fenster", ort: "Veyrholm",
      text: (A) => [
        "Alle Wege enden auf demselben Platz. Ringsum Häuser mit leeren Fenstern, und hinter jedem Fenster eine Gestalt aus Eis, die hinausschaut. Die Bewohner sind nicht geflohen.",
        "In der Mitte drei Siegelsteine, groß wie Türen. Sie leuchten. Ein Kälterufer geht von Stein zu Stein und legt die Hand darauf, und mit jedem Mal bewegt sich etwas hinter den Fenstern.",
        A.merker.s4_route_bonus && A.merker.s4_route_bonus !== "keiner" ? `Ihr tragt ${bonusName[A.merker.s4_route_bonus]} bei euch.` : "",
      ],
      optionen: [
        { id: "steine", text: "Die Siegelsteine betrachten", wer: "Die Steine", frage: "Was tun die Steine?",
          antwort: "Sie halten die Stadt wach. Solange sie leuchten, wecken sie die Eisgezeichneten in den Häusern. Zwei abgeschaltete Steine sollten genügen, um den Platz zu beruhigen – wenn der Kälterufer sie nicht wieder entzündet.", setzt: { steine_bekannt: true } },
        { id: "ruhe", text: "Den sicheren Ruhepunkt nutzen (Pilgerzeichen)", wenn: (A) => A.merker.s4_route_bonus === "pilgerzeichen" && !A.merker.ruhepunkt, frage: "Das Zeichen zeigt eine Nische, in der kein Eis wächst.",
          antwort: "Ihr ruht eine Weile im Schutz der Nische. Die Kälte lässt nach.", setzt: { ruhepunkt: true }, heilen: 0.5 },
        { id: "los", text: "Den Platz betreten", weiter: "kampf_markt" },
      ],
    },
    kampf_markt: {
      art: "kampf", abschnitt: 1, titel: "Marktplatz der leeren Fenster", ort: "Veyrholm",
      text: (A) => [`Schaltet zwei der drei Siegelsteine ab (je zwei Aktionen daneben, ohne Gegner neben euch). Aus den Hauszugängen oben und unten drängen Eisgezeichnete nach, solange der Kälterufer lebt – er weckt auch abgeschaltete Steine wieder.${A.merker.s4_route_bonus === "signalhorn" ? " Das Signalhorn hält die erste Welle zurück." : ""}`],
      kampf: (A) => ({ begegnung: "k_markt", karte: MARKT, keinAnfuehrer: true, namen: NAMEN, skalaMal: A.merker.bund_gewarnt ? 1.1 : 1,
        mechanik: { ziele: OBJEKTE.steine, sieg: { ziele: 2, art: "siegelstein", text: "Zwei Steine schweigen. Hinter den Fenstern erstarren die Gestalten wieder." },
          wellen: [{ id: "haeuser", name: "Die Hauszugänge", kurz: "aus den Häusern", quellen: [[4, 0], [8, 0], [4, 8], [8, 8]], gegner: [["eisgezeichneter", 0.35, 3, 0.5]], alle: 2, ab: A.merker.s4_route_bonus === "signalhorn" ? 5 : 3, max: 3, an: "kaelterufer", text: "Hinter den Türen kratzt Eis über Stein" }] },
        sieg: { weiter: "markt_nach" }, verloren: { setzt: { markt_verloren: true }, glocke: 1, weiter: "markt_flucht" } }),
    },
    markt_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Stille", ort: "Veyrholm", weiter: "kammern_ruf", rastErlaubt: true,
      text: ["Die Siegelsteine erlöschen, und mit ihnen das Kratzen hinter den Türen. Die Gestalten in den Fenstern stehen wieder still. Aber nicht alle sind aus Eis: Hinter einem der Häuser hört ihr Klopfen."],
    },
    markt_flucht: {
      art: "erzaehlung", abschnitt: 1, titel: "Durch die Gassen", ort: "Veyrholm", weiter: "kammern_ruf",
      text: ["Ihr reißt euch los und flieht in eine Gasse. Hinter euch leuchten die Steine weiter, und mehr Gestalten lösen sich aus den Fenstern. Der Weg in die Stadt ist offen, aber Veyrholm ist jetzt wach. Im nächsten großen Kampf werden mehr auf euch warten."],
    },
    // ----- Optional: Die Kammern der Verschleppten (ersetzt den Glockenkeller) -----
    kammern_ruf: {
      art: "wahl", abschnitt: 1, titel: "Klopfen unter dem Pflaster", ort: "Veyrholm",
      text: ["Unter dem Pflaster klopft es. Dreimal, Pause, dreimal. Eine Treppe führt hinab in Gewölbe. Ylva hat gesagt, manche Bewohner wurden in den Untergrund verschleppt. Vielleicht lebt dort noch jemand. Stimmt ab."],
      optionen: [
        { id: "hinab", text: "Hinabsteigen", weiter: "kampf_kammern" },
        { id: "weiter", text: "Weitergehen – wir haben keine Zeit", setzt: { s4_verschleppte: "nicht_betreten" }, weiter: "lager_akt1" },
      ],
    },
    kampf_kammern: {
      art: "kampf", abschnitt: 1, titel: "Die Kammern der Verschleppten", ort: "Unter dem Marktplatz",
      text: ["Drei Menschen stecken in Eisblöcken, und sie leben noch. Schlagt das Eis auf (je zwei Aktionen direkt daneben), bevor sie erfrieren – ihr habt 6 Runden. Glasschwärmer kriechen aus den Rissen in den Wänden, ein Frostknecht hält den Gang."],
      kampf: () => ({ begegnung: "k_kammern", karte: KAMMERN, keinAnfuehrer: true, mischen: false,
        mechanik: { ziele: OBJEKTE.bloecke, zieleZuerst: true, wellen: [{ id: "risse", name: "Die Risse in den Wänden", kurz: "aus der Wand", quellen: [[6, 2], [6, 6], [9, 4]], gegner: [["glasschwaermer", 0.3, 2, 0.5]], alle: 2, ab: 2, max: 3, text: "Es klirrt in den Wänden" }] },
        nachher: (st) => ({ setzt: { s4_verschleppte: st.mech ? st.mech.gerettet : 0 } }),
        sieg: { weiter: "kammern_nach" }, verloren: { glocke: 1, weiter: "kammern_nach" } }),
    },
    kammern_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Die Geretteten", ort: "Unter dem Marktplatz", weiter: "lager_akt1", rastErlaubt: true,
      text: (A) => {
        const n = A.merker.s4_verschleppte || 0;
        return [n === 0 ? "Ihr wart zu spät. In den Eisblöcken ist es still geworden. Ihr legt eure Hände auf das kalte Eis und geht."
          : n === 1 ? "Ein Kind, kaum sechs Jahre alt, sitzt zitternd in eurem Mantel. Es sagt, die Männer mit den leeren Kronen hätten einen Mann mit einem Buch dabeigehabt, der Runen vorlas, bis das Eis kam."
          : n === 2 ? "Zwei haben überlebt. Die alte Frau war Brückenwärterin, sagt sie, vor dreihundert Jahren oder gestern, sie weiß es nicht mehr. „Auf der Brücke tragen nur die Felder mit den Sternen im Eis. Merkt euch das.“"
          : "Alle drei leben. Die Brückenwärterin weiß, welche Felder auf der Brücke tragen. Und der Wachmann in der alten Rüstung salutiert. „Im Kronensaal wartet der König. Ich halte euch den Rücken frei, wenn es so weit ist.“",
          n > 0 ? "Ihr bringt sie in ein Haus ohne Eis und macht Feuer. Sie werden warten, bis ihr zurückkommt." : ""];
      },
    },
    lager_akt1: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer in einem Haus ohne Eis", ort: "Veyrholm", aufstieg: 2, weiter: "bruecke_ankunft",
      text: (A) => [
        "Ein Haus am Rand des Platzes, in dem das Eis nur bis zur Türschwelle reicht. Ihr macht Feuer aus alten Möbeln. Draußen ist es still, so still, dass ihr euren Atem hört.",
        A.merker.s4_verschleppte > 0 ? "Die Geretteten schlafen dicht am Feuer. Das Kind hält im Schlaf den Ärmel eines von euch fest." : "",
        A.merker.anselm_spur ? "Ihr denkt an den Brief mit Anselms Siegel. Was sucht ein Abt aus Grauwacht in einer Stadt unter dem Eis?" : "",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    /* ================= Akt II · Die Stadt erwacht ================= */
    bruecke_ankunft: {
      art: "gespraech", abschnitt: 2, titel: "Der Gletscherbruch", ort: "Veyrholm",
      text: (A) => [
        "Zwischen der Unterstadt und dem Palastbezirk klafft ein Riss im Gletscher, so tief, dass unten nur Dunkelheit ist. Darüber eine Brücke aus Stein und Eis, drei Schritt breit. Auf der anderen Seite: Felsplattformen, und auf ihnen Maskierte mit Bögen. In der Mitte der Brücke liegt etwas Großes in Ketten und hebt den Kopf.",
        A.merker.s4_verschleppte >= 2 ? "Die alte Brückenwärterin hat es euch gesagt: Nur die Felder mit den Sternen im Eis tragen. Ihr seht, welche brechen werden." : "",
        A.merker.markt_verloren ? "Seit dem Marktplatz ist die Stadt wach. Mehr Augen hinter den Fenstern, mehr Bögen auf den Plattformen." : "",
      ],
      optionen: [
        { id: "spaehen", text: "Die Schützen ausspähen", frage: "Ihr legt euch flach an den Rand und beobachtet die Plattformen.",
          probe: { name: "Wahrnehmung", attr: "WEI", sg: 13, geuebt: ["waldlaeufer", "schurke"], knapp: true,
            erfolg: { text: "Sie wechseln die Wache. Wenn ihr jetzt lauft, sind sie nicht bereit.", setzt: { bruecke_ueberrascht: true } },
            knapp: { text: "Vier Schützen, eine Kettenbestie. Mehr erkennt ihr nicht." },
            fehl: { text: "Ein Pfeil schlägt neben euch ins Eis. Sie haben euch gesehen.", glocke: 1 } } },
        { id: "seil", text: "Ein Seil als Geländer spannen", wenn: (A) => Boolean(A.merker.seil && !A.merker.bruecke_seil), frage: "Ihr spannt Ylvas Seil am Brückenrand.",
          antwort: "Es wird halten, wenn jemand stürzt. Vielleicht.", setzt: { bruecke_seil: true } },
        { id: "los", text: "Über die Brücke", weiter: "kampf_bruecke" },
      ],
    },
    kampf_bruecke: {
      art: "kampf", abschnitt: 2, stufe: 2, titel: "Die Brücke über den Gletscherbruch", ort: "Der Gletscherbruch",
      text: (A) => [`Am Ende der Brücke versperrt ein Eisgitter den Weg: Schlagt es auf (je Feld zwei Aktionen daneben) und kommt alle auf die andere Seite (die markierten Felder rechts) – oder besiegt alle. Die Kettenbestie stößt Helden zurück, am Rand geht es in den Abgrund. Die Brücke knackt: Angekündigte Felder brechen eine Runde später ein.${A.merker.s4_verschleppte >= 2 ? " Dank der Brückenwärterin seht ihr die brüchigen Felder." : ""}`],
      kampf: (A) => {
        const eis = []; for (let x = 3; x <= 8; x++) { eis.push([x, 3]); eis.push([x, 5]); }
        let mal = 1; if (A.merker.markt_verloren) mal *= 1.15; if (A.merker.bund_gewarnt) mal *= 1.05;
        return { begegnung: "k_bruecke", karte: BRUECKE, keinAnfuehrer: true, mischen: false, namen: NAMEN, skalaMal: mal, ueberraschung: Boolean(A.merker.bruecke_ueberrascht),
          mechanik: { ziele: OBJEKTE.gitter, eis: { felder: eis, proRunde: 2, ab: 2, max: 5, bekannt: A.merker.s4_verschleppte >= 2 }, ausgang: { felder: [[10, 3], [10, 4], [10, 5], [11, 3], [11, 4], [11, 5]], text: "Ihr seid drüben! Hinter euch bricht ein Stück der Brücke in die Tiefe." } },
          sieg: { weiter: "bruecke_nach" }, verloren: { setzt: { zeit_verloren: true }, glocke: 1, weiter: "bruecke_flucht" } };
      },
    },
    bruecke_nach: {
      art: "erzaehlung", abschnitt: 2, titel: "Der Palastbezirk", ort: "Veyrholm", weiter: "tor_ankunft", rastErlaubt: true,
      text: ["Auf der anderen Seite ist die Luft kälter und stiller. Die Häuser sind größer, die Gestalten in den Fenstern tragen Schmuck. Vor euch steigt eine Prachtstraße zum Palast hinauf."],
    },
    bruecke_flucht: {
      art: "erzaehlung", abschnitt: 2, titel: "Der lange Weg", ort: "Veyrholm", weiter: "tor_ankunft",
      text: ["Ihr müsst zurück, einen Umweg suchen, über eine halb eingestürzte Nebenbrücke klettern. Als ihr endlich im Palastbezirk steht, ist es Nacht, und der Bund hat Zeit gehabt, sich vorzubereiten."],
    },
    tor_ankunft: {
      art: "gespraech", abschnitt: 2, titel: "Das Tor der Kronenwache", ort: "Vor dem Palast",
      text: (A) => [
        "Vor dem Palasttor steht der Eisenhirte: ein Wächter aus Stein und Eisen, doppelt so groß wie ein Mann. Auf seiner Brust pulsiert eine Rune, und ein schimmerndes Feld umgibt ihn. Links und rechts des Vorhofs ragen zwei Runensäulen auf.",
        A.merker.s4_verschleppte >= 3 ? "Der gerettete Wachmann tritt neben euch. „Ich kenne ihn. Ich habe neben ihm Wache gestanden, vor dreihundert Jahren. Die Säulen nähren ihn. Ich fange bei der nördlichen an.“" : "",
      ],
      optionen: [
        { id: "runen", text: "Die Runen deuten", frage: "Ihr betrachtet die Zeichen an Säulen und Brust.",
          probe: { name: "Runen lesen", attr: "INT", sg: 13, geuebt: ["zauberer", "kleriker"], knapp: true,
            erfolg: { text: "Die Säulen speisen ihn. Sind beide aus, erstarrt er. Und vor jedem Bodenstoß hebt er die Fäuste: Wer dann zwei Schritt Abstand hält, bleibt verschont.", setzt: { runen_bekannt: true } },
            knapp: { text: "Die Säulen und die Brust gehören zusammen. Mehr seht ihr nicht." },
            fehl: { text: "Die Zeichen verschwimmen vor euren Augen. Kälte kriecht in eure Finger.", glocke: 1 } } },
        { id: "los", text: "Den Vorhof betreten", weiter: "kampf_tor" },
      ],
    },
    kampf_tor: {
      art: "kampf", abschnitt: 2, stufe: 2, titel: "Das Tor der Kronenwache", ort: "Vor dem Palast",
      text: ["Der Eisenhirte trägt ein Runenschild (halber Schaden, bricht nach genug Treffern für zwei Runden). Alle drei Runden kündigt er einen Bodenstoß an: Wer im Umkreis von zwei Feldern bleibt, wird getroffen. Schaltet die beiden Runensäulen ab (je zwei Aktionen in Ruhe) – dann erstarrt er. Oder besiegt ihn."],
      kampf: (A) => ({ begegnung: "k_tor", karte: TOR, keinAnfuehrer: true, mischen: false, skalaMal: A.merker.zeit_verloren ? 1.1 : 1,
        mechanik: { ziele: OBJEKTE.saeulen.map((z) => Object.assign({}, z, A.gruppe.filter((f) => !A.zust[f].tot).length >= 5 ? { runden: 3 } : {}, A.merker.s4_verschleppte >= 3 && z.id === "r1" ? { start: 1 } : {})),
          schild: { art: "eisenhirte", ziele: ["r1", "r2"], halt: 18, pause: 2, text: "Runenschild" },
          sieg: { ziele: 2, art: "saeule", besiegt: { art: "eisenhirte", n: 1 }, text: "Der Eisenhirte erstarrt. Langsam, mit einem Knirschen wie Gletschereis, tritt er beiseite. Das Tor ist frei." } },
        sieg: { weiter: "tor_nach" } }),
    },
    tor_nach: {
      art: "erzaehlung", abschnitt: 2, titel: "Das offene Tor", ort: "Der Palast", weiter: "lager_akt2", rastErlaubt: true,
      text: ["Hinter dem Tor liegt der Palast, und unter ihm, irgendwo, das Kronenherz. Ihr spürt es: ein langsamer Puls im Boden, wie ein Herz im Schlaf. Im Palast brennt Licht. Jemand ist vor euch hier."],
    },
    lager_akt2: {
      art: "lager", abschnitt: 2, titel: "Lagerfeuer in der Wachstube", ort: "Der Palast", aufstieg: 3, weiter: "archiv_ankunft",
      text: (A) => [
        "Die alte Wachstube neben dem Tor hat einen Kamin. Ihr verbrennt Speerschäfte und Stuhlbeine und wärmt euch, so gut es geht.",
        A.merker.s4_route_bonus === "kernsplitter" ? "Der Kernsplitter pulsiert schneller, seit ihr im Palast seid. Er will nach Hause." : "",
        A.merker.anselm_spur ? "An der Wand der Wachstube: ein frisches Zeichen, eine leere Krone, und darunter ein Kürzel. A." : "",
        "Ihr seid stärker geworden. **Stufe 3.**",
      ],
    },
    /* ================= Akt III · Das Herz der Siegel ================= */
    archiv_ankunft: {
      art: "gespraech", abschnitt: 3, titel: "Das Archiv der Namen", ort: "Der Palast",
      text: (A) => [
        "Unter dem Palast liegt ein Archiv: Gang um Gang, Regal um Regal, und an den Enden drei steinerne Tafeln voller Namen. Ein Kälterufer steht vor der ersten und streicht mit der Hand darüber. Wo er streicht, verschwinden die Namen.",
        "Neben ihm ein Mann mit einem Buch, der Runen vorliest. Ein Runenleser. Er sieht euch und lächelt.",
        A.merker.s4_route_bonus === "pilgerzeichen" ? "Das Pilgerzeichen in eurer Tasche wird warm: Hier gibt es einen Weg, den nur Pilger kennen." : "",
      ],
      optionen: [
        { id: "warum", text: "Den Runenleser ansprechen", wer: "Der Runenleser", frage: "„Warum löscht ihr die Namen?“",
          antwort: (A) => `„Ein Name ist ein Siegel, das man vergessen kann“, sagt er. „Das Kronenherz hält die Siegel zusammen, weil es sich an alle erinnert. Wenn niemand sich erinnert, gehorcht es dem, der es hält.“ Er klappt das Buch zu.${A.merker.anselm_spur ? " „Grüße von Anselm übrigens.“" : ""}` },
        { id: "los", text: "Die Tafeln sichern", weiter: "kampf_archiv" },
      ],
    },
    kampf_archiv: {
      art: "kampf", abschnitt: 3, stufe: 3, titel: "Das Archiv der Namen", ort: "Unter dem Palast",
      text: (A) => [`Sichert die drei Tafeln (je zwei Aktionen daneben), bevor die Namen verblassen – ihr habt bis Runde 6. Der Kälterufer löscht, was ihr gesichert habt, wenn er herankommt. Der Runenleser lässt Eis zwischen euch wachsen. Aus den Schriftkapseln brechen Glasschwärmer.${A.merker.s4_route_bonus === "signalhorn" ? " Das Signalhorn hält die Schwärmer eine Weile zurück." : ""}`],
      kampf: (A) => ({ begegnung: "k_archiv", karte: ARCHIV, keinAnfuehrer: true, namen: NAMEN,
        mechanik: { ziele: OBJEKTE.tafeln, zieleZuerst: true, sieg: { ziele: 3, art: "tafel", text: "Alle drei Tafeln sind gesichert. Der Runenleser flucht und verschwindet in den Gängen." },
          wellen: [{ id: "kapseln", name: "Die Schriftkapseln", kurz: "aus den Kapseln", quellen: [[3, 1], [8, 1], [3, 7], [8, 7]], gegner: [["glasschwaermer", 0.3, 2, 0.5]], alle: 3, ab: A.merker.s4_route_bonus === "signalhorn" ? 5 : 3, max: 2, text: "In den Wänden klirrt Glas" }] },
        nachher: (st) => ({ setzt: { tafeln: st.mech ? st.mech.ziele.filter((z) => z.fertig).length : 0 } }),
        sieg: { weiter: "archiv_nach" }, verloren: { glocke: 1, weiter: "archiv_nach" } }),
    },
    archiv_nach: {
      art: "erzaehlung", abschnitt: 3, titel: "Was die Tafeln sagen", ort: "Unter dem Palast", weiter: "frost_suche", rastErlaubt: true,
      beimEintritt: (A) => (A.merker.tafeln >= 2 ? { setzt: { archiv_wahrheit: true } } : null),
      text: (A) => [
        A.merker.tafeln >= 2 ? "Ihr lest die Tafeln im Licht einer Fackel. Die Gründer haben das Kronenherz gebaut, um die sieben Siegel stabil zu halten. Aber auf der Tafel des Herzens steht noch etwas, später eingemeißelt, in hastiger Schrift: Wer das Herz hält, kann jedes Siegel öffnen. Die letzten Könige haben es versucht. Dann kam das Eis."
          : A.merker.tafeln === 1 ? "Eine Tafel habt ihr retten können. Sie nennt die Namen der Gründer und spricht von einem Herz, das sich an alle Siegel erinnert. Wozu es gebaut wurde, steht auf den anderen. Die sind leer."
          : "Die Tafeln sind leer. Was immer sie über das Kronenherz sagten, ist vergessen. Der Runenleser hat bekommen, was er wollte.",
      ],
    },
    frost_suche: {
      art: "probe", abschnitt: 3, titel: "Ein kalter Luftzug", ort: "Unter dem Palast",
      text: (A) => ["Zwischen zwei Regalen zieht es eiskalt. Dahinter könnte ein Gang liegen. Eine Person sucht.", A.merker.s4_route_bonus === "pilgerzeichen" ? "Das Pilgerzeichen zeigt euch die Stelle: Vorteil." : ""],
      probe: { name: "Suchen", attr: "WEI", sg: 13, geuebt: ["schurke", "waldlaeufer"], vorteil: (A) => (A.merker.s4_route_bonus === "pilgerzeichen" ? 1 : 0),
        erfolg: { text: "Hinter dem Regal: eine Tür aus Eis, und dahinter eine Halle voller Säulen. In der Mitte, auf einem Thron aus Kristall, sitzt eine Frau aus Raureif. Die Frostmatrone. Sie herrscht über die Schwärmer – auch über die im Kronensaal.", weiter: "frost_wahl" },
        fehl: { text: "Ihr findet nichts als kalte Steine. Was immer dort zieht, bleibt euch verborgen.", setzt: { s4_frostmatrone: "nicht_gefunden" }, weiter: "vor_kronensaal" } },
    },
    frost_wahl: {
      art: "wahl", abschnitt: 3, titel: "Die Frostmatrone", ort: "Die Frostkammer",
      text: ["Besiegt ihr sie, wird der Kronensaal leichter: keine Schwärmer mehr aus ihren Nestern. Aber sie ist stark, und niemand zwingt euch. Ihr könnt mit ihr reden, oder leise wieder gehen. Stimmt ab."],
      optionen: [
        { id: "kampf", text: "Die Frostmatrone herausfordern", weiter: "kampf_frost" },
        { id: "reden", text: "Mit ihr reden", weiter: "frost_reden" },
        { id: "gehen", text: "Leise wieder gehen", setzt: { s4_frostmatrone: "nicht_gefunden" }, weiter: "vor_kronensaal" },
      ],
    },
    frost_reden: {
      art: "probe", abschnitt: 3, titel: "Ein Handel im Eis", ort: "Die Frostkammer",
      text: ["„Ihr wollt zum Herzen“, sagt sie, und ihre Stimme klingt wie Eis, das bricht. „Was gebt ihr mir, wenn ich meine Kinder zurückhalte?“ Eine Person verhandelt."],
      probe: { name: "Verhandeln", attr: "CHA", sg: 15, geuebt: ["kleriker", "schurke"], knapp: true,
        erfolg: { text: "Ihr versprecht ihr die Kammer, für immer, ohne Krone und ohne Bund. Sie neigt den Kopf. „Dann schweigen meine Kinder im Saal.“", setzt: { s4_frostmatrone: "verschont" }, weiter: "vor_kronensaal" },
        knapp: { text: "Sie lacht. „Ein Teil meiner Kinder. Nicht alle.“", setzt: { s4_frostmatrone: "verschont", matrone_halb: true }, weiter: "vor_kronensaal" },
        fehl: { text: "„Ihr habt nichts, was ich will.“ Die Nester glühen auf.", weiter: "kampf_frost" } },
    },
    kampf_frost: {
      art: "kampf", abschnitt: 3, stufe: 3, titel: "Die Frostkammer", ort: "Die Frostkammer",
      text: ["Besiegt die Frostmatrone. Sie greift auf zwei Felder Entfernung, lässt Eiskorridore zwischen euch wachsen und speit Brut. Zwei Nester lassen Schwärmer schlüpfen."],
      kampf: () => ({ begegnung: "k_frost", karte: FROSTKAMMER, keinAnfuehrer: true, mischen: false,
        mechanik: { sieg: { besiegt: { art: "frostmatrone", n: 1 }, text: "Die Frostmatrone zerspringt wie ein Spiegel. Die Nester verstummen." } },
        sieg: { setzt: { s4_frostmatrone: "besiegt" }, weiter: "frost_nach" }, verloren: { setzt: { s4_frostmatrone: "nicht_gefunden" }, glocke: 1, weiter: "vor_kronensaal" } }),
    },
    frost_nach: {
      art: "erzaehlung", abschnitt: 3, titel: "Stille in der Kammer", ort: "Die Frostkammer", weiter: "vor_kronensaal", rastErlaubt: true,
      text: ["Wo die Frostmatrone saß, liegt ein Häufchen Raureif, und darin ein Ring aus blauem Kristall. Er ist kalt, aber er schützt: Wer ihn trägt, friert nicht. Im Kronensaal werden keine Schwärmer auf euch warten."],
    },
    vor_kronensaal: {
      art: "gespraech", abschnitt: 3, titel: "Vor dem Kronensaal", ort: "Tief unter dem Palast",
      text: (A) => [
        "Eine Treppe führt tiefer, als der Gletscher dick sein kann. Unten eine Tür aus Gold und Eis, und dahinter ein Puls, langsam und schwer, der durch eure Stiefel in die Knochen geht. Das Kronenherz.",
        A.merker.anselm_spur ? "Vor der Tür steht ein Mann in grauer Kutte, die Hände auf dem Rücken. Anselm, der Abt aus Grauwacht. Er sieht älter aus. Und zufrieden." : "",
        A.merker.s4_verschleppte >= 3 ? "Der gerettete Wachmann ist euch gefolgt. „Ich halte die Seitengänge“, sagt er. „Solange ich kann.“" : "",
      ],
      optionen: [
        { id: "anselm", text: "Anselm zur Rede stellen", wenn: (A) => Boolean(A.merker.anselm_spur), wer: "Anselm", frage: "„Was tut Ihr hier?“",
          antwort: (A) => (A.merker.grauwacht === "verrat"
            ? "„Was ich in Grauwacht begonnen habe.“ Er lächelt. „Der Bund will das Herz brechen. Ich will es besitzen. Ihr werdet es für mich öffnen, ob ihr wollt oder nicht.“ Dann ist er fort, als hätte es ihn nie gegeben."
            : "„Ich warte.“ Er weicht eurem Blick aus. „Darauf, dass jemand die richtige Entscheidung trifft. Ich habe es nicht gekonnt.“ Er tritt beiseite und verschwindet die Treppe hinauf."),
          setzt: (A) => (A.merker.grauwacht === "verrat" ? { anselm_gegner: true } : { anselm_gegangen: true }) },
        { id: "splitter", text: "Den Kernsplitter an die Tür halten", wenn: (A) => A.merker.s4_route_bonus === "kernsplitter", wer: "Der Kernsplitter", frage: "Der Splitter zieht zur Tür.",
          antwort: "Er pulsiert im Takt des Herzens. Wenn ihr ihn im Saal in die Höhe haltet, wird der Kristallschutz des Königs brechen. Für eine Weile." },
        { id: "los", text: "Den Kronensaal betreten", weiter: "kampf_krone" },
      ],
    },
    kampf_krone: {
      art: "kampf", abschnitt: 3, stufe: 3, titel: "Der König unter dem Eis", ort: "Der Kronensaal",
      text: (A) => [
        "Der König ist nicht der König, sondern die Erinnerung, die das Herz an ihn bewahrt. Ein Kristallschutz fängt die Hälfte des Schadens ab. Alle drei Runden kündigt er einen Kronenschlag in einer Linie an.",
        "Phase II (unter zwei Dritteln): Die Ehrengarde kommt aus den Seitengängen, bis alle drei Runenpunkte geschlossen sind (je zwei Aktionen in Ruhe) – das bricht auch den Kristallschutz. Phase III (unter einem Drittel): Der Boden reißt auf.",
        "Besiegt ihn – oder legt die Hände auf das Kronenherz (drei Aktionen in Ruhe).",
        A.merker.s4_route_bonus === "kernsplitter" ? "Der Kernsplitter bricht den Kristallschutz für die ersten drei Runden." : "",
        A.merker.s4_frostmatrone === "besiegt" ? "Keine Schwärmer: Die Frostmatrone ist tot." : A.merker.s4_frostmatrone === "verschont" ? "Die Frostmatrone hält ihr Wort – fast alle Schwärmer bleiben in den Nestern." : "Aus den Nestern hinter euch kriechen Glasschwärmer.",
      ],
      kampf: (A) => {
        const m = A.merker; let mal = 1; if (m.archiv_wahrheit) mal *= 0.95; if (m.anselm_gegner) mal *= 1.05;
        const wellen = [{ id: "garde", name: "Die Ehrengarde", kurz: "Ehrengarde", quellen: [[5, 1], [5, 7], [10, 7]], gegner: [["eisgezeichneter", 0.4, 3, 0.5]], alle: 2, max: m.s4_verschleppte >= 3 ? 2 : 3, aus: true, text: "In den Seitengängen klirren Rüstungen" }];
        if (m.s4_frostmatrone !== "besiegt") wellen.push({ id: "brut", name: "Die Nester", kurz: "aus den Nestern", quellen: [[1, 1], [1, 7]], gegner: [["glasschwaermer", 0.3, 2, 0.5]], alle: 3, ab: 3, max: m.s4_frostmatrone === "verschont" ? (m.matrone_halb ? 2 : 1) : 3, text: "Hinter euch klirrt Glas" });
        return { begegnung: "k_krone", karte: KRONENSAAL, keinAnfuehrer: true, mischen: false, skalaMal: mal, beute: false,
          mechanik: { ziele: OBJEKTE.runen.concat([OBJEKTE.herz]), wellen,
            schild: { art: "koenig", ziele: ["p1", "p2", "p3"], halt: 22, pause: 2, text: "Kristallschutz", startAus: m.s4_route_bonus === "kernsplitter" ? 3 : 0 },
            sieg: { ziele: 1, art: "herz", besiegt: { art: "koenig", n: 1 }, text: "Der König sinkt auf die Knie, und das Licht in ihm wird ruhig. Vor euch pulsiert das Kronenherz. Es wartet." } },
          sieg: { weiter: "herz_entscheidung" } };
      },
    },
    herz_entscheidung: {
      art: "wahl", abschnitt: 3, titel: "Das Herz der Siegel", ort: "Der Kronensaal",
      text: (A) => [
        "Das Kronenherz ist ein Kristall, groß wie ein Mensch, und in ihm schlagen sieben Lichter, jedes für ein Siegel. Eines flackert, wo Grauwacht liegt. Eines brennt hell, wo Hochwacht ist. Ihr könnt es berühren. Ihr könnt es verändern.",
        A.merker.archiv_wahrheit ? "Ihr wisst, was die Tafeln sagen: Wer das Herz hält, kann jedes Siegel öffnen. Die letzten Könige haben es versucht. Dann kam das Eis." : "Was die Gründer mit dem Herzen wollten, wisst ihr nicht. Ihr müsst euch auf euer Gefühl verlassen.",
        "Stimmt ab.",
      ],
      optionen: [
        { id: "stabil", text: "Stabilisieren: Das Herz beruhigen, die Siegel halten – die Bedrohung bleibt", setzt: { s4_kronenherz: "stabilisiert" }, weiter: "ende_stabil" },
        { id: "siegel", text: "Versiegeln: Den Saal verschließen, niemand kommt mehr an das Herz – auch ihr nicht", setzt: { s4_kronenherz: "versiegelt" }, weiter: "ende_versiegelt" },
        { id: "umleiten", text: "Umleiten: Die Kraft eines Siegels nutzen, um eine Gefahr abzuwenden – ein anderes gerät unter Druck", setzt: { s4_kronenherz: "umgeleitet" }, weiter: "ende_umgeleitet" },
      ],
    },
    ende_stabil: {
      art: "ende", abschnitt: 3, titel: "Das Herz schlägt ruhig", ort: "Veyrholm",
      text: (A) => ["Ihr legt die Hände auf den Kristall, und das Flackern wird ruhig. Sieben Lichter, gleichmäßig wie Atem. Über euch knirscht der Gletscher, aber er hält.", ...epilog(A), "Die Siegel halten. Aber der Bund der Hohlkrone weiß jetzt, wo das Herz liegt. Er wird wiederkommen."],
    },
    ende_versiegelt: {
      art: "ende", abschnitt: 3, titel: "Die Stadt schläft", ort: "Veyrholm",
      text: (A) => ["Ihr zieht die Tür aus Gold und Eis hinter euch zu, und der Gletscher schließt sich darüber wie eine Hand. Niemand wird das Herz je wieder berühren.", ...epilog(A), "Veyrholm bleibt verborgen. Wer das Netz der Siegel verstehen will, muss einen anderen Weg finden."],
    },
    ende_umgeleitet: {
      art: "ende", abschnitt: 3, titel: "Ein Siegel entlastet, ein anderes bebt", ort: "Veyrholm",
      text: (A) => [`Ihr lenkt die Kraft um. Das flackernde Licht ${A.merker.grauwacht === "gebrochen" ? "von Grauwacht" : "im Osten"} wird hell und ruhig. Dafür beginnt ein anderes zu zittern, weit im Süden, wo ihr noch nie wart.`, ...epilog(A), "Irgendwo im Süden bebt ein Siegel. Die nächste Krise hat schon begonnen."],
    },
    krone_verloren: { art: "ende", abschnitt: 0, titel: "Unter dem Eis", ort: "", text: ["Das Eis schließt sich über euch. Irgendwann wird jemand durch die Fenster schauen und euch sehen, wie Fische im Winterteich."] },
  };

  /** Epilog: Geschichte der Gruppe, je nach Weg und Entscheidungen */
  function epilog(A) {
    const m = A.merker, t = [];
    const weg = { sturmgrat: "über den Sturmgrat", stollen: "durch die Unterstollen", pilgerweg: "über die Pilgerstraße" }[m.s4_route];
    if (weg) t.push(`Ihr seid ${weg} gekommen${m.s4_route_bonus && m.s4_route_bonus !== "keiner" ? `, und ${bonusName[m.s4_route_bonus]} hat euch begleitet` : ""}.`);
    if (m.s4_verschleppte > 0) t.push(m.s4_verschleppte >= 3 ? "Die drei Geretteten gehen mit euch hinauf ans Licht. Das Kind fragt, ob es den Himmel noch gibt." : "Die Geretteten aus den Kammern warten oben am Feuer. Sie sind die ersten Bewohner Veyrholms seit dreihundert Jahren, die die Sonne sehen.");
    else if (m.s4_verschleppte === 0) t.push("An die Eisblöcke unter dem Marktplatz denkt ihr noch lange.");
    if (m.s4_frostmatrone === "verschont") t.push("Die Frostmatrone bleibt in ihrer Kammer. Sie hat ihr Wort gehalten. Ob sie es immer halten wird?");
    if (m.anselm_gegner) t.push("Von Anselm findet ihr nur Fußspuren im Schnee, die nach Süden führen.");
    else if (m.anselm_gegangen) t.push("Anselm wartet oben an der Treppe. Er fragt nicht, was ihr entschieden habt. Er sieht es in euren Gesichtern.");
    if (m.hochwacht === "fackel") t.push("Als ihr Kaltbrunn erreicht, brennt im Süden ein Licht auf der Hochwarte. Sera weiß es schon.");
    if (A.gefallen.length) t.push(`Am Rand des Gletschers schichtet ihr Steine für ${A.gefallen.map((f) => (FIG() ? FIG().FIGUREN[f].name : f)).join(", ")}.`);
    return t;
  }
  const FIG = () => root.ABF || (typeof require === "function" ? require("../js/figuren.js") : null);
  const WISSEN = {
    koenig: { klassen: ["krieger", "kleriker", "zauberer"], text: "Drei Phasen. Kristallschutz halbiert den Schaden, bis er bricht oder alle drei Runenpunkte geschlossen sind. Kronenschlag in einer Linie wird angekündigt – zur Seite treten. Wer drei Runden in Ruhe am Kronenherz steht, beendet den Kampf." },
    siegeljaeger: { klassen: ["schurke", "waldlaeufer"], text: "Maskierte Jäger des Bundes der Hohlkrone: flink (6 Felder), aber leicht gepanzert." },
    jaegerschuetze: { klassen: ["waldlaeufer"], text: "Schießt aus 6 Feldern. Deckung hilft, oder ihr geht nah heran." },
    funkenhund: { klassen: ["waldlaeufer"], text: "Fährtenhund: alle drei Runden Glutatem im Kegel von 3 Feldern (3W6, GES-Rettung halbiert). Nicht zusammenstehen." },
    jaegerhauptmann: { klassen: ["krieger", "schurke"], text: "Varrek trifft hart mit der Kriegsaxt (1W12+3). Wer das Horn sichert, beendet den Kampf." },
    glasnest: { klassen: ["zauberer", "waldlaeufer"], text: "Bewegt sich nicht und greift nicht an, lässt aber alle zwei Runden einen Schwärmer schlüpfen. Zwei zerstörte Nester beenden den Kampf." },
    glasschwaermer: { klassen: ["zauberer"], text: "Klein und schwach (5 TP), aber viele. Flächenzauber lohnen sich." },
    splitterbrutmutter: { klassen: ["krieger", "zauberer"], text: "Speit alle zwei Runden eine Brut aus. Wer sie besiegt, beendet den Kampf." },
    frostknecht: { klassen: ["krieger"], text: "Langsam (4 Felder), robust (RK 15). Hält Engstellen – nicht frontal festbeißen, sondern umgehen." },
    eisgezeichneter: { klassen: ["kleriker"], text: "Untot und schwach (9 TP), kommt in Gruppen. Licht und Vertreiben wirken." },
    kaelterufer: { klassen: ["zauberer", "kleriker"], text: "Weckt erledigte Ziele wieder und heilt seine Verbündeten. Solange er lebt, kommt Verstärkung. Zuerst ausschalten!" },
    kettenbestie: { klassen: ["krieger", "waldlaeufer"], text: "Schwer (2W6+3) und mit Rückstoß: STR-Rettung, sonst bis zu zwei Felder zurück – am Abgrund ein Sturz. Nicht mit dem Rücken zum Rand stehen." },
    eisenhirte: { klassen: ["zauberer", "krieger"], text: "Runenschild halbiert den Schaden, bis es bricht. Bodenstoß wird angekündigt: zwei Felder Abstand halten. Die beiden Runensäulen lassen ihn erstarren." },
    runenleser: { klassen: ["zauberer"], text: "Lässt neben eng stehenden Helden Eis wachsen (angekündigt, zwei Runden). Verteilt euch." },
    frostmatrone: { klassen: ["zauberer", "kleriker"], text: "Frostgriff auf zwei Felder, Eiskorridore und Brut. Unter halbem Leben wird sie härter (RK +1)." },
    eidwaechter: { klassen: ["kleriker", "krieger"], text: "Schwer (RK 15, Eidhammer 2W6+3). Sein Schutzkreis fängt die Hälfte des Schadens ab, bis alle drei Grablichter brennen." },
  };
  const META = {
    id: "krone", schwierigkeit: 4, entwurf: true, titel: "Die Krone unter dem Eis", kurz: "Krone", untertitel: "Ein verzweigtes Abenteuer in der versunkenen Stadt Veyrholm (Entwurf)",
    kurztext: "Drei Wege führen in eine Stadt unter dem Gletscher – und zum Herzen der sieben Siegel.",
    min: 3, max: 6, stufen: "1–3", dauer: "4–5 Stunden", abschnitte: 3, enden: 3,
    bild: "img/krone/titel.webp", vorschau: "img/krone/vorschau.webp", abschnittBilder: { 1: "img/krone/abschnitt-1.webp", 2: "img/krone/abschnitt-2.webp", 3: "img/krone/abschnitt-3.webp" },
    uhr: { name: "Frost", max: 7, mehr: "Der Frost kriecht tiefer.", weniger: "Die Kälte lässt etwas nach.", unruhe: "der Frost lässt niemanden ganz schlafen", rueckzug: "Der Frost kriecht tiefer." },
    gruppe: "Die Eisgänger", aufbruch: "Hinab nach Veyrholm", niederlage: "Unter dem Eis", chronik: "Chronik von Veyrholm",
    abschnitte_namen: { 1: "Der Eintritt in die Stadt", 2: "Die Stadt erwacht", 3: "Das Herz der Siegel" },
  };
  const API = { META, EREIGNISSE: [], WISSEN, START: "prolog", NIEDERLAGE: "krone_verloren", SZENEN, KARTEN, OBJEKTE };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.krone = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
