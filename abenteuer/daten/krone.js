/*
 * Die Krone unter dem Eis – ENTWURF (Schwierigkeit 4, siehe KONZEPT-KRONE.md)
 * Bisher Akt I: Vorgeschichte, drei Wege nach Veyrholm (je ein Pfadkampf), Marktplatz der leeren Fenster, Kammern der Verschleppten.
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
  const KARTEN = { STURMGRAT, UNTERSTOLLEN, PILGERSTRASSE, MARKT, KAMMERN };
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
      art: "lager", abschnitt: 1, titel: "Lagerfeuer in einem Haus ohne Eis", ort: "Veyrholm", aufstieg: 2, weiter: "akt2_entwurf",
      text: (A) => [
        "Ein Haus am Rand des Platzes, in dem das Eis nur bis zur Türschwelle reicht. Ihr macht Feuer aus alten Möbeln. Draußen ist es still, so still, dass ihr euren Atem hört.",
        A.merker.s4_verschleppte > 0 ? "Die Geretteten schlafen dicht am Feuer. Das Kind hält im Schlaf den Ärmel eines von euch fest." : "",
        A.merker.anselm_spur ? "Ihr denkt an den Brief mit Anselms Siegel. Was sucht ein Abt aus Grauwacht in einer Stadt unter dem Eis?" : "",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    akt2_entwurf: {
      art: "ende", abschnitt: 1, titel: "Fortsetzung folgt", ort: "Veyrholm",
      text: ["Hier endet der Entwurf von Akt I. Als Nächstes: die Brücke über den Gletscherbruch, das Tor der Kronenwache, das Archiv der Namen und die Frostkammer."],
    },
    krone_verloren: { art: "ende", abschnitt: 0, titel: "Unter dem Eis", ort: "", text: ["Das Eis schließt sich über euch. Irgendwann wird jemand durch die Fenster schauen und euch sehen, wie Fische im Winterteich."] },
  };

  const WISSEN = {
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
    eidwaechter: { klassen: ["kleriker", "krieger"], text: "Schwer (RK 15, Eidhammer 2W6+3). Sein Schutzkreis fängt die Hälfte des Schadens ab, bis alle drei Grablichter brennen." },
  };
  const META = {
    id: "krone", schwierigkeit: 4, entwurf: true, titel: "Die Krone unter dem Eis", kurz: "Krone", untertitel: "Ein verzweigtes Abenteuer in der versunkenen Stadt Veyrholm (Entwurf)",
    kurztext: "Drei Wege führen in eine Stadt unter dem Gletscher – und zum Herzen der sieben Siegel.",
    min: 3, max: 6, stufen: "1–3", dauer: "4–5 Stunden", abschnitte: 3, enden: 3, bild: null,
    uhr: { name: "Frost", max: 7, mehr: "Der Frost kriecht tiefer.", weniger: "Die Kälte lässt etwas nach.", unruhe: "der Frost lässt niemanden ganz schlafen", rueckzug: "Der Frost kriecht tiefer." },
    gruppe: "Die Eisgänger", aufbruch: "Hinab nach Veyrholm", niederlage: "Unter dem Eis", chronik: "Chronik von Veyrholm",
    abschnitte_namen: { 1: "Der Eintritt in die Stadt", 2: "Die Stadt erwacht", 3: "Das Herz der Siegel" },
  };
  const API = { META, EREIGNISSE: [], WISSEN, START: "prolog", NIEDERLAGE: "krone_verloren", SZENEN, KARTEN, OBJEKTE };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.krone = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
