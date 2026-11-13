/*
 * Die Fähre von Graufurt – Kurzabenteuer (1 Abschnitt, Stufe 1, 2–6 Helden, etwa 60 Minuten)
 * Spielt nach „Das Moor der stummen Lichter“ und vor „Das Siegel von Grauwacht“: Auf dem Weg nach Norden
 * hören die Helden zum ersten Mal die Glocke von Grauwacht. Gebaut nach KAMPAGNEN-BAUKASTEN.md:
 * nur vorhandene Gegner (Rostkäfer, Schattenkobolde, Knochenwächter) und vorhandene Bausteine (gefesselte Begleitung aus Hochwacht).
 * Die „Uhr“ ist der Pegel der Wehre (A.glocke, 0–7): Es regnet, der Fluss steigt, Pims Zeit wird knapp.
 * Karten mit gemalten Bildern (img/graufurt/), Hindernisse am Bild ausgerichtet (Raster 12 × 9). Bilder siehe BILDER-GRAUFURT.md.
 */
(function (root) {
  "use strict";
  const T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y], M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y];
  // Karte als Text: . begehbar · ~ Wasser (versperrt den Weg, nicht die Sicht) · T Baum/Schilf · K Kiste, Pfosten, Fels · M Mauer, Stein
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { if (c === "~") h.push(Q(x, y)); else if (c === "T") h.push(T(x, y)); else if (c === "K") h.push(K(x, y)); else if (c === "M") h.push(M(x, y)); })); return h; };

  /* ---------- Karten (12 × 9) ---------- */
  // Die Fährstelle: Wiese am Ufer, rechts die Wehre mit dem Anleger, an den Pfosten hängt die zerfressene Kette
  const UFER = {
    name: "Die Fährstelle", b: 12, h: 9, boden: "garten", bild: "img/graufurt/ufer.webp",
    hindernisse: ausText([
      "TTTTT.K...~~",
      "TTT......K~~",
      "TTKK...M..~~",
      "T...........",
      "T.......K...",
      "T.........~~",
      "TTK....MM.~~",
      "TT.....MMK~~",
      "TTTTKM..T.~~",
    ]),
    start: { spieler: [[1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]], wolf: [[3, 3], [3, 4], [3, 5], [3, 6]],
      gegner: [[9, 3], [10, 3], [11, 3], [9, 4], [10, 4], [11, 4], [8, 3], [7, 4], [7, 3], [8, 5], [9, 5], [9, 6]] },
  };
  // Die Fähre: ein breites Floß mitten auf der Wehre, Pfosten an den Ecken, Ladung in der Mitte
  const FAEHRE = {
    name: "Die Fähre", b: 12, h: 9, boden: "holz", bild: "img/graufurt/faehre.webp",
    hindernisse: ausText([
      "~~~~~~~~~~~~",
      "~~~~~~~~~~~~",
      "K..........K",
      ".....KK.....",
      "....KKK.....",
      ".....KK.....",
      "K..........K",
      "~~~~~~~~~~~~",
      "~~~~~~~~~~~~",
    ]),
    start: { spieler: [[1, 3], [1, 4], [1, 5], [2, 3], [2, 5], [2, 4]], wolf: [[3, 3], [3, 5], [2, 2], [2, 6]],
      gegner: [[9, 3], [9, 4], [9, 5], [10, 4], [10, 3], [10, 5], [8, 3], [8, 5], [8, 4], [9, 2], [9, 6], [7, 4]] },
  };
  // Die alte Furt: Kies und Steine im flachen Wasser, dazwischen tiefe Rinnen
  const FURT = {
    name: "Die alte Furt", b: 12, h: 9, boden: "moor", bild: "img/graufurt/furt.webp",
    hindernisse: ausText([
      "TT~.M..~~~~M",
      "T.~.....~~~M",
      "...MM....~~~",
      "...M......MM",
      "............",
      "~~~~...MM...",
      "~~~~~~......",
      "TM.~~~~~~~~~",
      "TT.....~~~M~",
    ]),
    start: { spieler: [[0, 3], [1, 3], [0, 4], [1, 4], [2, 3], [2, 4]], wolf: [[2, 2], [1, 2], [0, 2], [3, 4]],
      gegner: [[9, 3], [9, 4], [10, 4], [11, 4], [8, 4], [8, 3], [9, 5], [10, 5], [11, 5], [8, 6], [9, 6], [10, 6]] },
  };
  // Der Zollturm: runder Raum mit Säulen, links die Tür, rechts an der Wand liegt Pim gefesselt
  const TURM = {
    name: "Der Zollturm", b: 12, h: 9, boden: "stein", bild: "img/graufurt/turm.webp",
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MMM..KK..MMM",
      "MM..M..M..MM",
      "MM........MM",
      "MM...KK....M",
      "MM..M..M..MM",
      "MM........MM",
      "MMM.K..K.MMM",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[2, 4], [2, 3], [3, 4], [2, 5], [3, 3], [3, 5]], wolf: [[2, 6], [3, 6], [2, 2], [3, 2]], begleiter: [9, 4],
      gegner: [[7, 3], [7, 4], [8, 3], [8, 4], [8, 5], [8, 6], [9, 3], [9, 5], [9, 6], [6, 5], [6, 6], [5, 6]] },
  };
  const KARTEN = { UFER, FAEHRE, FURT, TURM };

  /* ---------- Epilog: was aus Graufurt wird ---------- */
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "Am Morgen hört der Regen auf. Die Wehre fällt so schnell, wie sie gestiegen ist, und auf den Wiesen glitzert das Wasser." : A.glocke <= 5 ? "Der Fluss steht noch zwei Tage über den Wiesen. Dann zieht er sich zurück und lässt Schlamm und Treibholz zurück." : "Die Wehre tritt über die Ufer. Das Fährhaus steht bis zu den Fenstern im Wasser, und Marit braucht den ganzen Sommer, um es wieder aufzubauen.");
    t.push(m.pim_frei ? "Pim erzählt jedem, der es hören will, von den Kobolden. Er übertreibt maßlos. Marit lässt ihn." : "");
    t.push(m.marit_vertraut ? "Marit setzt euch umsonst über, so oft ihr wollt. „Für euch fährt die Fähre immer“, sagt sie, „auch bei Hochwasser.“" : "Marit setzt euch über und nimmt kein Geld. Mehr sagt sie nicht. Bei ihr ist das viel.");
    if (A.gefallen.length) t.push(`Am Ufer unter der alten Weide begrabt ihr ${A.gefallen.map((f) => h.name(A, f)).join(", ")}. Pim legt jeden Tag einen glatten Stein aus dem Fluss dazu.`);
    return t.filter(Boolean);
  }

  const SZENEN = {
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Nach Norden", ort: "Die Straße an der Wehre", weiter: "faehrhaus",
      text: [
        "Hinter euch liegt das Schwarzmoor. Die Straße nach Norden folgt der Wehre, einem breiten, grauen Fluss, der seit Tagen nur steigt. Es regnet, und der Regen hört nicht auf.",
        "Am Abend hört ihr es zum ersten Mal: tief und fern, von irgendwo hinter den Hügeln im Norden. Eine Glocke. Sie schlägt dreimal, dann ist es still.",
        "Vor euch liegt Graufurt, die einzige Fähre über die Wehre auf drei Tagesreisen. Im Fährhaus brennt Licht. Die Fähre selbst liegt schief am Anleger, und die Kette, die sie über den Fluss zieht, hängt zerrissen im Wasser.",
      ],
    },
    faehrhaus: {
      art: "gespraech", abschnitt: 1, titel: "Das Fährhaus", ort: "Graufurt",
      text: (A, h) => [
        "Marit Wehrlin, die Fährfrau, öffnet die Tür nur einen Spalt. Sie hat ein Beil in der Hand. Als sie sieht, dass ihr keine Kobolde seid, lässt sie euch herein.",
        "„Mein Sohn ist drüben“, sagt sie, bevor ihr fragen könnt. „Pim. Elf Jahre. Er wollte die Kette flicken, gestern Nacht. Dann kamen sie und haben ihn mitgenommen. Rüber, zum alten Zollturm.“",
        h.klasse(A, "kleriker") ? "Sie sieht das heilige Zeichen an eurem Hals und atmet aus. „Gut. Vielleicht hilft das gegen die da.“" : "",
      ],
      optionen: [
        { id: "kobolde", text: "Nach den Kobolden fragen", wer: "Marit", frage: "„Wer hat ihn geholt?“",
          antwort: "„Kleine graue Biester, nicht größer als ein Kind. Sie kommen seit drei Nächten den Fluss herunter, aus dem Norden. Sie stehlen alles, was glänzt. Und sie haben Käfer dabei, die fressen Eisen. Die haben meine Kette durchgenagt.“" },
        { id: "glocke", text: "Nach der Glocke fragen", wer: "Marit", frage: "„Was ist das für eine Glocke im Norden?“",
          antwort: "„Grauwacht. Eine alte Abtei hinter den Hügeln, eine Woche zu Fuß. Die Glocke hat seit Jahren geschwiegen. Seit drei Nächten läutet sie wieder. Seitdem kommen die Kobolde.“ Sie schweigt kurz. „Mein Großvater hat gesagt, wenn die Glocke von Grauwacht läutet, soll man die Türen verriegeln.“",
          setzt: { glocke_gehoert: true } },
        { id: "turm", text: "Nach dem Zollturm fragen", wer: "Marit", frage: "„Was ist das für ein Turm?“",
          antwort: "„Da hat früher der Zöllner gewohnt. Der alte Brannick. Der ist vor dreißig Jahren gestorben, und begraben haben sie ihn im Keller, weil der Boden draußen zu nass war.“ Sie verzieht das Gesicht. „Die Kinder sagen, er zählt nachts noch die Münzen.“" },
        { id: "helfen", text: "Versprechen, Pim zurückzubringen", wer: "Marit", frage: "„Wir holen ihn zurück.“",
          antwort: "Marit sieht euch lange an. Dann gibt sie euch die Hand, eine raue, nasse Hand. „Wenn ihr das tut, fahre ich euch über, wann immer ihr wollt. Für den Rest meines Lebens.“",
          setzt: { marit_vertraut: true } },
        { id: "spuren", text: "Spuren am Anleger lesen (Waldläufer oder Schurke)", wenn: (A, h) => Boolean(h.klasse(A, "waldlaeufer") || h.klasse(A, "schurke")), frage: "Ihr kniet euch an den Anleger.",
          antwort: "Kleine Füße, viele. Dazwischen die Abdrücke von Kinderstiefeln, die sich wehren. Und Kratzspuren im Holz, wo etwas Hartes mit vielen Beinen an der Kette hing. Die Kobolde sind nicht über den Fluss geschwommen. Sie kennen die alte Furt flussaufwärts.",
          setzt: { spuren: true } },
        { id: "los", text: "Aufbrechen", weiter: (A, h) => h.ereignis(A, 1, "wegwahl") },
      ],
    },
    wegwahl: {
      art: "wahl", abschnitt: 1, titel: "Über die Wehre", ort: "Graufurt",
      text: (A) => [
        "Zwei Wege führen hinüber. Die Fähre ist schnell, aber die Kette muss erst geflickt werden, und an den Pfosten sitzen noch die Käfer. Die alte Furt liegt eine Stunde flussaufwärts, und bei diesem Pegel steht das Wasser dort bis zur Brust.",
        A.merker.spuren ? "Ihr wisst, dass die Kobolde die Furt benutzen. Vielleicht trefft ihr dort welche." : "",
        "Stimmt ab.",
      ].filter(Boolean),
      optionen: [
        { id: "faehre", text: "Die Kette flicken und mit der Fähre übersetzen", weiter: "kette" },
        { id: "furt", text: "Flussaufwärts zur alten Furt (dauert, der Pegel steigt)", glocke: 1, weiter: "furt" },
      ],
    },

    /* ----- Weg 1: die Fähre ----- */
    kette: {
      art: "erzaehlung", abschnitt: 1, titel: "Die Kette", ort: "Der Anleger", weiter: "kampf_kette",
      text: ["Marit bringt Hammer, Nieten und ein neues Kettenglied. Als ihr an den Anleger tretet, klickt und knirscht es an den Pfosten. Käfer, so groß wie Katzen, mit rostroten Panzern. Sie fressen an der Kette, und als sie euch bemerken, fressen sie nicht mehr."],
    },
    kampf_kette: {
      art: "kampf", abschnitt: 1, titel: "Rost am Anleger", ort: "Die Fährstelle",
      text: ["Die Käfer kommen über die Wiese. Metall schützt euch hier nicht: Wer gebissen wird, dessen Rüstung rostet."],
      kampf: { begegnung: "f_kette", karte: UFER, sieg: { weiter: "kette_nach" } },
    },
    kette_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Geflickt", ort: "Der Anleger", weiter: "ueberfahrt", rastErlaubt: true,
      text: (A, h) => [
        "Ihr hämmert das neue Glied in die Kette. Marit spannt sie mit der Winde, bis sie über dem Wasser summt.",
        h.klasse(A, "krieger") ? `${h.name(A, h.klasse(A, "krieger"))} hält die Kette, während Marit die Niete setzt. Sie nickt anerkennend.` : "",
        "„Steigt auf“, sagt Marit. „Ich ziehe. Ihr passt auf.“",
      ].filter(Boolean),
    },
    ueberfahrt: {
      art: "erzaehlung", abschnitt: 1, titel: "Die Überfahrt", ort: "Mitten auf der Wehre", weiter: "kampf_faehre",
      text: ["Die Fähre gleitet hinaus in den grauen Fluss. Regen peitscht über die Planken. In der Mitte, wo die Strömung am stärksten ist, tauchen links und rechts kleine graue Köpfe aus dem Wasser. Dann Hände, die sich an die Ränder krallen. Die Kobolde klettern an Bord."],
    },
    kampf_faehre: {
      art: "kampf", abschnitt: 1, titel: "Kobolde an Bord", ort: "Die Fähre",
      text: ["Rund um euch ist nur Wasser. Wer am Rand steht, steht den Kobolden am nächsten."],
      kampf: { begegnung: "f_faehre", karte: FAEHRE, sieg: { weiter: "anderes_ufer" } },
    },

    /* ----- Weg 2: die Furt ----- */
    furt: {
      art: "probe", abschnitt: 1, titel: "Die alte Furt", ort: "Eine Stunde flussaufwärts",
      text: (A) => ["Die Furt ist eine Reihe flacher Kiesbänke, zwischen denen das Wasser schäumt. Ihr müsst euch gegen die Strömung stemmen. Alle würfeln.", A.merker.spuren ? "Ihr wisst, wo die Kobolde gegangen sind, und folgt ihrem Weg: Vorteil." : ""],
      probe: { name: "Gegen die Strömung", wer: "gruppe", attr: "STR", sg: 11, geuebt: ["krieger", "waldlaeufer"], vorteil: (A) => (A.merker.spuren ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr kommt sicher hinüber und seht sie zuerst: Kobolde, die sich auf einer Kiesbank um einen glänzenden Haufen streiten.", setzt: { furt_ueberraschung: true }, weiter: "kampf_furt" },
        knapp: { text: "Jemand verliert den Halt, die anderen ziehen ihn heraus. Es platscht. Auf der Kiesbank vor euch fahren graue Köpfe herum.", weiter: "kampf_furt" },
        fehl: { text: "Die Strömung reißt euch fast mit. Bis ihr drüben seid, ist es spät, der Fluss ist weiter gestiegen, und die Kobolde warten schon.", glocke: 1, weiter: "kampf_furt" } },
    },
    kampf_furt: {
      art: "kampf", abschnitt: 1, titel: "Auf der Kiesbank", ort: "Die alte Furt",
      text: ["Zwischen den Kiesbänken ist das Wasser zu tief zum Durchwaten. Ihr müsst über die Steine."],
      kampf: (A) => ({ begegnung: "f_furt", karte: FURT, ueberraschung: Boolean(A.merker.furt_ueberraschung), sieg: { weiter: "anderes_ufer" } }),
    },

    /* ----- Das andere Ufer ----- */
    anderes_ufer: {
      art: "gespraech", abschnitt: 1, titel: "Das andere Ufer", ort: "Am Nordufer der Wehre",
      text: (A) => [
        "Am Nordufer liegt eine Kindermütze im Gras, nass und zertreten. Dahinter, auf einem Hügel über dem Fluss, steht der alte Zollturm: rund, schief, ohne Dach. In einem Fenster flackert grünes Licht.",
        A.merker.glocke_gehoert ? "Im Norden schlägt wieder die Glocke von Grauwacht. Diesmal klingt sie näher." : "Im Norden schlägt eine Glocke, tief und langsam. Marit hat sie Grauwacht genannt.",
      ],
      optionen: [
        { id: "beute", text: "Was die Kobolde verloren haben untersuchen", frage: "Am Ufer liegt Diebesgut.",
          antwort: "Löffel, Nägel, ein Kerzenleuchter, eine Gürtelschnalle. Alles aus Metall, alles glänzend. Und dazwischen etwas, das nicht dazupasst: ein Stück grauer Stein, so groß wie eine Hand, mit einem eingeritzten Zeichen. Ein Kreis mit sieben Strichen. Der Stein ist kalt, obwohl er in der Sonne gelegen hat.",
          setzt: { zeichen_gesehen: true } },
        { id: "lauschen", text: "Am Turm lauschen (Schurke oder Waldläufer)", wenn: (A, h) => Boolean(h.klasse(A, "schurke") || h.klasse(A, "waldlaeufer")), frage: "Ihr schleicht bis an die Mauer.",
          antwort: "Drinnen kichern Kobolde. Dazwischen eine Kinderstimme, die zählt, laut und tapfer: „Hundertzwölf, hundertdreizehn …“ Und ein Geräusch wie von Münzen, die auf einen Tisch fallen. Unter dem Turm führt ein Kellerschacht nach draußen, mit Brettern verstellt.",
          setzt: { schacht: true } },
        { id: "lager", text: "Am Ufer kurz Kraft sammeln, dann zum Turm", weiter: "lager" },
      ],
    },
    lager: {
      art: "lager", abschnitt: 1, titel: "Unter der alten Weide", ort: "Am Nordufer der Wehre", weiter: "turm_wahl",
      text: (A) => [
        "Unter einer alten Weide ist der Boden fast trocken. Ihr esst kalt, um kein Feuer zu machen, und verbindet eure Wunden.",
        A.glocke >= 4 ? "Das Wasser steigt. Wo vorhin noch Wiese war, glänzt jetzt der Fluss. Lange könnt ihr nicht bleiben." : "Hinter euch rauscht die Wehre. Aus dem Turm dringt grünes Licht durch den Regen.",
      ],
    },
    turm_wahl: {
      art: "wahl", abschnitt: 1, titel: "Der Zollturm", ort: "Vor dem Zollturm",
      text: (A) => [
        "Die Tür des Zollturms hängt nur noch an einer Angel. Dahinter: Stimmen, Kichern, grünes Licht.",
        A.merker.schacht ? "Der Kellerschacht an der Rückseite führt unter den Turm. Wer leise ist, kommt von hinten heran." : "",
        "Stimmt ab.",
      ].filter(Boolean),
      optionen: [
        { id: "tuer", text: "Durch die Tür, schnell und laut", weiter: "kampf_turm" },
        { id: "schacht", text: "Durch den Kellerschacht schleichen", wenn: (A) => Boolean(A.merker.schacht), weiter: "schleichen" },
        { id: "warten", text: "Warten, bis das Licht ausgeht (der Pegel steigt)", glocke: 1, setzt: { gewartet: true }, weiter: "kampf_turm" },
      ],
    },
    schleichen: {
      art: "probe", abschnitt: 1, titel: "Im Kellerschacht", ort: "Unter dem Zollturm",
      text: ["Der Schacht ist eng und riecht nach Moder. Wer vorangeht, muss leise sein, sonst hören es alle."],
      probe: { name: "Leise", attr: "GES", sg: 12, geuebt: ["schurke"], knapp: true,
        erfolg: { text: "Ihr kommt lautlos hinter einer Säule heraus. Die Kobolde sitzen um einen Tisch voller Münzen und haben euch den Rücken zugedreht.", setzt: { ueberraschung: true }, weiter: "kampf_turm" },
        knapp: { text: "Ein Brett knarrt. Die Kobolde horchen auf, aber sie wissen nicht, woher es kam.", weiter: "kampf_turm" },
        fehl: { text: "Ihr reißt beim Aufstieg einen Eimer um. Er scheppert die ganze Treppe hinunter. Oben wird es still, dann bricht Geschrei los.", glocke: 1, weiter: "kampf_turm" } },
    },
    kampf_turm: {
      art: "kampf", abschnitt: 1, titel: "Der Zöllner zählt", ort: "Der Zollturm",
      text: ["Pim liegt gefesselt an der hinteren Wand. Zwischen euch und ihm: Kobolde, und am Tisch mit den Münzen eine Gestalt aus Knochen, im verrotteten Mantel eines Zöllners. Brannick. Er zählt noch immer. Besiegt sie, dann ist Pim frei."],
      kampf: (A) => ({ begegnung: "f_turm", karte: TURM, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.ueberraschung),
        begleiter: { name: "Pim", titel: "gefesselt", tp: 8, start: TURM.start.begleiter, route: [], ausgang: false, gefesselt: true },
        sieg: { setzt: { pim_frei: true }, weiter: "turm_nach" } }),
    },
    turm_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Hundertdreizehn", ort: "Der Zollturm", weiter: "splitter", rastErlaubt: true,
      text: (A) => [
        "Brannicks Knochen fallen auseinander, als hätte jemand die Schnur durchgeschnitten, die sie hielt. Die Münzen rollen über den Boden.",
        "Ihr schneidet Pim los. Er zittert, aber er grinst. „Hundertdreizehn“, sagt er. „Ich hab mitgezählt, damit ich nicht weine.“",
        A.merker.zeichen_gesehen ? "Auf dem Tisch, mitten zwischen den Münzen, liegt ein zweites Stück grauer Stein. Dasselbe Zeichen: ein Kreis mit sieben Strichen. Die beiden Stücke passen aneinander." : "Auf dem Tisch, mitten zwischen den Münzen, liegt ein Stück grauer Stein, so groß wie eine Hand. Ein Zeichen ist hineingeritzt: ein Kreis mit sieben Strichen. Der Stein ist eiskalt.",
        "Pim zeigt darauf. „Das haben sie aus dem Norden mitgebracht. Sie haben es angebetet. Und jedes Mal, wenn die Glocke geschlagen hat, haben sie gejubelt.“",
      ],
    },
    splitter: {
      art: "wahl", abschnitt: 1, titel: "Der graue Stein", ort: "Der Zollturm",
      text: ["Der Stein ist kalt und schwer. Im Norden schlägt die Glocke von Grauwacht, und für einen Herzschlag glaubt ihr, der Stein schlage mit.", "Was tut ihr damit? Stimmt ab."],
      optionen: [
        { id: "mitnehmen", text: "Mitnehmen: Wer auch immer in Grauwacht läutet, sollte wissen, was hier geschieht", setzt: { splitter: "mit" }, weiter: "ende_norden" },
        { id: "versenken", text: "In die Wehre werfen: Was immer es ist, es soll niemandem mehr schaden", setzt: { splitter: "fluss" }, weiter: "ende_wehre" },
      ],
    },

    /* ----- Enden ----- */
    ende_norden: {
      art: "ende", abschnitt: 1, titel: "Der Weg nach Norden", ort: "Graufurt",
      text: (A, h) => [
        "Marit setzt euch am nächsten Morgen über. Den Stein tragt ihr in ein Tuch gewickelt, und wer ihn trägt, friert, auch in der Sonne.",
        ...epilog(A, h),
        "Die Straße nach Norden führt nach Halmbruck, einem Dorf am Fuß der Hügel, eine Woche entfernt. Dahinter liegt Grauwacht. Jede Nacht schlägt die Glocke, und jede Nacht ein bisschen lauter.",
        "*Weiter geht es in „Das Siegel von Grauwacht“.*",
      ],
    },
    ende_wehre: {
      art: "ende", abschnitt: 1, titel: "Was die Wehre nimmt", ort: "Graufurt",
      text: (A, h) => [
        "Der Stein versinkt ohne einen Laut. Für eine Nacht schweigt die Glocke im Norden, zum ersten Mal seit Tagen. Marit sagt, das sei ein gutes Zeichen. Ihr seid nicht so sicher.",
        ...epilog(A, h),
        "In der dritten Nacht schlägt die Glocke wieder, lauter als zuvor. Was immer in Grauwacht läutet, braucht keinen Stein. Ihr packt eure Sachen und folgt der Straße nach Norden, nach Halmbruck.",
        "*Weiter geht es in „Das Siegel von Grauwacht“.*",
      ],
    },
    graufurt_verloren: {
      art: "ende", abschnitt: 0, titel: "Die Wehre steigt", ort: "",
      text: ["Der Fluss tritt über die Ufer und nimmt mit, was er findet. Im Norden schlägt die Glocke, und niemand hört mehr hin."],
    },

    /* ----- Zufallsereignisse (Haltepunkt 1: nach dem Fährhaus) ----- */
    e_pilger: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Pilger aus dem Norden", ort: "Die Straße an der Wehre", weiter: (A) => A.ereignisZiel,
      text: ["Auf der Straße kommt euch ein alter Pilger entgegen, durchnässt, mit einer Laterne. Er will nach Süden, weg von der Glocke. „Sieben Nächte“, murmelt er. „Wenn sie sieben Nächte läutet, ist es zu spät.“ Er drückt euch einen Heiltrank in die Hand. „Ihr geht nach Norden. Ihr braucht ihn mehr als ich.“"],
      beimEintritt: () => ({ tranke: 1 }),
    },
    e_treibgut: {
      art: "probe", abschnitt: 1, titel: "Treibgut", ort: "Am Ufer der Wehre",
      text: ["Im Fluss treibt eine Kiste vorbei, dicht am Ufer. Wer schnell ist, bekommt sie zu fassen."],
      probe: { name: "Zupacken", attr: "GES", sg: 12, geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Ihr zieht die Kiste ans Ufer. Darin: Proviant, eine Decke und zwei Heiltränke, sorgfältig in Wachstuch gewickelt.", tranke: 2, weiter: (A) => A.ereignisZiel },
        knapp: { text: "Die Kiste zerbricht am Ufer. Ein Heiltrank bleibt heil.", tranke: 1, weiter: (A) => A.ereignisZiel },
        fehl: { text: "Ihr rutscht aus, die Kiste treibt davon. Bis ihr wieder trocken seid, ist der Fluss weiter gestiegen.", glocke: 1, weiter: (A) => A.ereignisZiel } },
    },
  };

  const EREIGNISSE = [{ id: "e_pilger", punkte: [1] }, { id: "e_treibgut", punkte: [1] }];
  const WISSEN = {
    rostkaefer: { klassen: ["waldlaeufer", "zauberer"], text: "Frisst Metall: Jeder Biss lässt eine Metallrüstung rosten (−1 RK, höchstens −2). Leder und Stoff sind sicher." },
    schattenkobold: { klassen: ["waldlaeufer", "schurke"], text: "Feige: Unter 3 Trefferpunkten flieht er. Wer ihn dabei im Blick hat, bekommt einen letzten Schuss." },
    knochenwaechter: { klassen: ["kleriker", "zauberer"], text: "Knochen brechen unter Wucht: Streitkolben, Hämmer und Schildstöße machen anderthalbfachen Schaden." },
  };
  const META = {
    id: "graufurt", entwurf: true, schwierigkeit: 1, reihe: 2, titel: "Die Fähre von Graufurt", kurz: "Graufurt", untertitel: "Ein Kurzabenteuer an der Wehre, auf dem Weg nach Grauwacht",
    kurztext: "Kobolde haben den Sohn der Fährfrau verschleppt. Im Norden läutet zum ersten Mal die Glocke von Grauwacht.",
    ehrentitel: "Freund von Graufurt", // Kampagnentitel für alle gefundenen Enden (Heldensammlung)
    abschnitte_namen: { 1: "Graufurt" },
    min: 2, max: 6, stufen: "1", dauer: "etwa 1 Stunde", abschnitte: 1, enden: 2,
    // Bilder siehe BILDER-GRAUFURT.md (alle eingebaut)
    bild: "img/graufurt/titel.webp", vorschau: "img/graufurt/vorschau.webp", abschnittBilder: { 1: "img/graufurt/abschnitt-1.webp" },
    uhr: { name: "Pegel", symbol: "≈", max: 7, mehr: "Die Wehre steigt.", weniger: "Der Fluss fällt ein wenig.", unruhe: "das Rauschen des Flusses lässt niemanden ganz schlafen", rueckzug: "Die Wehre steigt." },
    gruppe: "Die Fährleute von Graufurt", aufbruch: "An die Wehre", niederlage: "Die Wehre steigt", chronik: "Chronik von Graufurt",
    einleitung: [
      { eyebrow: "I · Nach dem Moor", titel: "Die Straße nach Norden", text: ["Das Schwarzmoor liegt hinter euch. Wer in den Splitterlanden nach Norden will, muss über die Wehre, einen breiten, grauen Fluss, der im Frühjahr gern über die Ufer tritt.", "Es gibt nur eine Stelle, an der man sicher hinüberkommt: die Fähre von Graufurt."] },
      { eyebrow: "II · Graufurt", titel: "Die Fährfrau und ihr Sohn", text: ["Graufurt ist kein Dorf, nur ein Fährhaus, ein Anleger und gegenüber, auf einem Hügel, der alte Zollturm. Die Fähre hängt an einer Kette, die quer über den Fluss läuft.", "Marit Wehrlin zieht sie seit zwanzig Jahren hin und her. Ihr Sohn Pim hilft ihr, seit er laufen kann."] },
      { eyebrow: "III · Die Glocke", titel: "Ein Klang aus dem Norden", text: ["Seit drei Nächten läutet im Norden eine Glocke, die lange geschwiegen hat. Seitdem kommen kleine graue Gestalten den Fluss herunter.", "Ihr seid auf dem Weg nach Norden. Noch wisst ihr nicht, wohin er euch führt."] },
    ],
    kodexUhr: { titel: "Der Pegel", text: ["Es regnet, und die Wehre steigt. Jedes Zögern, jeder Umweg und jede kurze Rast lassen den <b>Pegel</b> steigen, bis zu sieben Stufen.", "Steigt der Fluss zu hoch, wird es für Pim und für das Fährhaus eng. Was das bedeutet, erzählt das Ende."] },
    // Ziel-Siegquote je Kampf für tools/kampagne.js (Kurzabenteuer: eher freundlich, Stufe 1)
    zielquoten: { kampf_kette: 0.88, kampf_faehre: 0.85, kampf_furt: 0.85, kampf_turm: 0.8 },
  };
  const API = { META, EREIGNISSE, WISSEN, START: "prolog", NIEDERLAGE: "graufurt_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.graufurt = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
