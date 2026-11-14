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

  /* ---------- Erzählfäden ----------
   * Marit: marit_vertraut (Versprechen), marit_schuld (ihr wisst, warum Pim draußen war), marit_dabei (sie fuhr mit der Fähre mit)
   * Pim: pim_frei, gewartet (er war länger allein), pim_trost (ihr habt ihm gesagt, was seine Mutter sich vorwirft)
   * Brannick, der Zöllner: brannick (seine Geschichte), fehlende_muenze (Pim hat die 114.), muenzen = "gezaehlt" | "marit" | "genommen"
   * Der graue Stein (geheim): hielt_<fid> – wer ihn länger festgehalten hat; splitter = "mit" | "fluss" */
  const halter = (A, h) => h.lebende(A).filter((f) => A.merker["hielt_" + f]);

  /* ---------- Epilog: was aus Graufurt wird ---------- */
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "Am Morgen hört der Regen auf. Die Wehre fällt so schnell, wie sie gestiegen ist, und auf den Wiesen glitzert das Wasser." : A.glocke <= 5 ? "Der Fluss steht noch zwei Tage über den Wiesen. Dann zieht er sich zurück und lässt Schlamm und Treibholz zurück." : "Die Wehre tritt über die Ufer. Das Fährhaus steht bis zu den Fenstern im Wasser, und Marit braucht den ganzen Sommer, um es wieder aufzubauen.");
    // Pim und Marit
    t.push(m.pim_trost ? "↳ Pim geht zu seiner Mutter und sagt etwas, das ihr nicht hört. Marit legt das Beil weg, zum ersten Mal, seit ihr sie kennt. Am nächsten Morgen flicken die beiden die Kette gemeinsam: Er setzt die Niete, sie hält die Laterne."
      : m.marit_schuld ? "↳ Marit lässt Pim nicht mehr an die Kette. Er fragt nicht, warum, und sie sagt es ihm nicht. Ihr wisst es. Ihr habt es ihm auch nicht gesagt."
      : m.pim_frei ? "Pim erzählt jedem, der es hören will, von den Kobolden. Er übertreibt maßlos. Marit lässt ihn." : "");
    t.push(m.gewartet ? "↳ Nachts zählt Pim manchmal im Schlaf. Er kommt weiter als bis hundertdreizehn. Er war lange allein in diesem Turm, länger, als nötig gewesen wäre." : "");
    t.push(m.marit_vertraut ? "↳ Marit setzt euch umsonst über, so oft ihr wollt. „Ihr habt es versprochen, bevor ihr wusstet, was drüben wartet“, sagt sie. „Für euch fährt die Fähre immer, auch bei Hochwasser.“" : "↳ Marit setzt euch über und nimmt kein Geld. Mehr sagt sie nicht. Versprochen hattet ihr ihr nichts, und sie hat es nicht vergessen. Bei ihr ist ein Nicken trotzdem viel.");
    // Brannick
    t.push(m.muenzen === "gezaehlt" ? "↳ Im Zollturm ist es still. Hundertvierzehn Münzen liegen in Reihen auf dem Tisch, und niemand rührt sie an. Die Kinder von Graufurt sagen, der alte Brannick habe endlich Feierabend."
      : m.muenzen === "marit" ? "↳ Von Brannicks Zollgeld kauft Marit eine neue Kette, Eisen aus dem Süden, das kein Käfer frisst. Aber im Herbst sagen die Kinder, im Turm klimpere es wieder: bis hundertdreizehn, und dann von vorn."
      : m.muenzen === "genommen" ? "↳ Das Zollgeld klimpert in euren Taschen. Es ist gutes, altes Silber. Im Herbst sagen die Kinder von Graufurt, im Turm zähle wieder jemand, lauter als früher, und er finde keine einzige Münze mehr." : "");
    if (A.gefallen.length) t.push(`Am Ufer unter der alten Weide begrabt ihr ${A.gefallen.map((f) => h.name(A, f)).join(", ")}. Pim legt jeden Tag einen glatten Stein aus dem Fluss dazu.`);
    return t.filter(Boolean);
  }
  /** Rückschau: die Entscheidungen dieser Nacht */
  function rueckschau(A, h) {
    const m = A.merker, ha = halter(A, h), t = [];
    t.push(m.marit_vertraut ? "Ihr habt Marit versprochen, Pim zurückzubringen, bevor ihr wusstet, was drüben wartet." : "Ein Versprechen habt ihr Marit nicht gegeben. Ihr habt Pim trotzdem geholt.");
    t.push(m.marit_dabei ? "Ihr habt die Kette geflickt, und Marit hat euch selbst über den Fluss gezogen." : "Ihr seid durch die alte Furt gegangen. Marit hat die Nacht allein im Fährhaus gewartet.");
    t.push(m.gewartet ? "Vor dem Turm habt ihr gewartet, bis das Licht ausging. Der Kampf war leichter. Pim war so lange allein." : "");
    t.push(m.pim_trost ? "Ihr habt Pim gesagt, was seine Mutter sich vorwirft. Er hat es ihr abgenommen." : m.marit_schuld ? "Ihr wusstet, was Marit sich vorwirft. Pim habt ihr es nicht gesagt." : "Warum ein Elfjähriger nachts an der Kette stand, habt ihr Marit nie gefragt.");
    t.push(m.muenzen === "gezaehlt" ? "Ihr habt Brannick die fehlende Münze hingelegt und zu Ende gezählt. Im Turm ist Ruhe." : m.muenzen === "marit" ? "Ihr habt Brannicks Zollgeld Marit gebracht." + (m.fehlende_muenze ? " Dass ihm nur eine einzige Münze fehlte, wusstet ihr." : " Was den alten Zöllner hielt, habt ihr nie erfahren.") : m.muenzen === "genommen" ? "Ihr habt Brannicks Zollgeld eingesteckt." + (m.fehlende_muenze ? " Dass ihm nur eine einzige Münze fehlte, wusstet ihr." : " Was den alten Zöllner hielt, habt ihr nie erfahren.") : "");
    t.push(ha.length ? `${h.namen(A, ha)} ${ha.length === 1 ? "hat" : "haben"} den grauen Stein länger festgehalten als nötig. Jetzt wisst ihr es alle.` : m.stein_gesehen ? "Den grauen Stein hat keiner von euch länger gehalten als nötig." : "");
    t.push(m.splitter === "mit" ? "Ihr tragt den Stein nach Norden." : m.splitter === "fluss" ? "Ihr habt den Stein der Wehre gegeben." : "");
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
      // Begrenzte Zeit: drei Fragen, danach kostet jede weitere einen Schritt des Pegels
      fragen: 3, ueberzug: true, draengt: "Draußen klatscht das Wasser gegen den Anleger. Marit steht schon an der Tür.",
      text: (A, h) => [
        "Marit Wehrlin, die Fährfrau, öffnet die Tür nur einen Spalt. Sie hat ein Beil in der Hand. Als sie sieht, dass ihr keine Kobolde seid, lässt sie euch herein.",
        "„Mein Sohn ist drüben“, sagt sie, bevor ihr fragen könnt. „Pim. Elf Jahre. Er wollte die Kette flicken, gestern Nacht. Dann kamen sie und haben ihn mitgenommen. Rüber, zum alten Zollturm.“",
        h.klasse(A, "kleriker") ? "Sie sieht das heilige Zeichen an eurem Hals und atmet aus. „Gut. Vielleicht hilft das gegen die da.“" : "",
        "Auf dem Tisch stehen zwei Teller. Einer ist unberührt. Das Beil legt sie nicht weg.",
        "*Hört euch um, bevor ihr geht. Was ihr hier erfahrt, zählt später. Aber der Fluss steigt: Die Zeit reicht nicht für alles.*",
      ],
      optionen: [
        { id: "kobolde", text: "Nach den Kobolden fragen", wer: "Marit", frage: "„Wer hat ihn geholt?“",
          antwort: "„Kleine graue Biester, nicht größer als ein Kind. Sie kommen seit drei Nächten den Fluss herunter, aus dem Norden. Sie stehlen alles, was glänzt. Und sie haben Käfer dabei, die fressen Eisen. Die haben meine Kette durchgenagt.“" },
        { id: "glocke", text: "Nach der Glocke fragen", wer: "Marit", frage: "„Was ist das für eine Glocke im Norden?“",
          antwort: "„Grauwacht. Eine alte Abtei hinter den Hügeln, eine Woche zu Fuß. Die Glocke hat seit Jahren geschwiegen. Seit drei Nächten läutet sie wieder. Seitdem kommen die Kobolde.“ Sie schweigt kurz. „Mein Großvater hat gesagt, wenn die Glocke von Grauwacht läutet, soll man die Türen verriegeln.“",
          setzt: { glocke_gehoert: true }, folge: "Ihr wisst jetzt, woher die Glocke kommt: Grauwacht. Seit sie läutet, kommen die Kobolde." },
        { id: "turm", text: "Nach dem Zollturm fragen", wer: "Marit", frage: "„Was ist das für ein Turm?“", wichtig: true,
          antwort: "„Da hat früher der Zöllner gewohnt. Der alte Brannick. Man hat ihm nachgesagt, er habe aus der Zollkasse genommen. Bewiesen hat es keiner, aber geglaubt haben es alle. Er hat danach jeden Abend nachgezählt, bis er starb, damit keiner sagen kann, es fehle etwas.“ Sie verzieht das Gesicht. „Begraben haben sie ihn im Keller, weil der Boden draußen zu nass war. Die Kinder sagen, er zählt noch immer.“",
          setzt: { brannick: true }, folge: "Ihr kennt die Geschichte des alten Zöllners. Im Turm werdet ihr wissen, was er zählt und warum." },
        { id: "schuld", text: "Fragen, warum ein Elfjähriger nachts die Kette flickt", wer: "Marit", frage: "„Warum war er allein da draußen?“", wichtig: true,
          antwort: "Marit sieht auf das Beil in ihrer Hand. „Weil sein Vater es nicht mehr kann. Die Wehre hat ihn vor zwei Jahren geholt, an genau dieser Kette. Seitdem will Pim der Fährmann sein. Ich habe es ihm immer verboten.“ Sie sagt es ganz ruhig. „Gestern nicht. Gestern habe ich ihm die Laterne gehalten.“",
          setzt: { marit_schuld: true }, folge: "Ihr wisst jetzt, was Marit sich vorwirft. Pim weiß es nicht." },
        { id: "helfen", text: "Versprechen, Pim zurückzubringen", wer: "Marit", frage: "„Wir holen ihn zurück.“", wichtig: true,
          antwort: "Marit sieht euch lange an. Dann gibt sie euch die Hand, eine raue, nasse Hand. „Wenn ihr das tut, fahre ich euch über, wann immer ihr wollt. Für den Rest meines Lebens.“",
          setzt: { marit_vertraut: true }, folge: "Ihr habt Marit euer Wort gegeben. Sie wird euch daran messen." },
        { id: "spuren", text: "Spuren am Anleger lesen (Waldläufer oder Schurke)", wenn: (A, h) => Boolean(h.klasse(A, "waldlaeufer") || h.klasse(A, "schurke")), frage: "Ihr kniet euch an den Anleger.",
          antwort: "Kleine Füße, viele. Dazwischen die Abdrücke von Kinderstiefeln, die sich wehren. Und Kratzspuren im Holz, wo etwas Hartes mit vielen Beinen an der Kette hing. Die Kobolde sind nicht über den Fluss geschwommen. Sie kennen die alte Furt flussaufwärts.",
          setzt: { spuren: true }, folge: "Ihr wisst, dass die Kobolde die alte Furt benutzen. Dort kennt ihr jetzt ihren Weg." },
        { id: "los", text: "Aufbrechen", weiter: (A, h) => h.ereignis(A, 1, "wegwahl") },
      ],
    },
    wegwahl: {
      art: "wahl", abschnitt: 1, titel: "Über die Wehre", ort: "Graufurt",
      text: (A) => [
        "Zwei Wege führen hinüber. Die Fähre ist schnell, aber die Kette muss erst geflickt werden, und an den Pfosten sitzen noch die Käfer. Die alte Furt liegt eine Stunde flussaufwärts, und bei diesem Pegel steht das Wasser dort bis zur Brust.",
        A.merker.spuren ? "↳ Ihr wisst, dass die Kobolde die Furt benutzen. Vielleicht trefft ihr dort welche." : "",
        "Marit bindet sich das Haar zurück. „Wenn die Fähre fährt, ziehe ich sie selbst. Durch die Furt komme ich mit meinem Knie nicht.“ Sie will dabei sein, wenn ihr Sohn aus diesem Turm kommt. Das sagt sie nicht, aber es steht ihr im Gesicht.",
        "*Eine Abstimmung. Es geht nicht nur um den Weg, sondern auch darum, ob Marit mitkommt.*",
      ].filter(Boolean),
      optionen: [
        { id: "faehre", text: "Die Kette flicken und mit der Fähre übersetzen – Marit kommt mit", setzt: { marit_dabei: true }, weiter: "kette",
          folge: "Marit zieht euch selbst hinüber. Sie wird am Nordufer sein, wenn ihr aus dem Turm kommt." },
        { id: "furt", text: "Flussaufwärts zur alten Furt – ohne Marit (dauert, der Pegel steigt)", glocke: 1, weiter: "furt",
          folge: "Ihr geht ohne Marit. Sie bleibt im Fährhaus und weiß bis zum Morgen nicht, was aus euch und Pim wird." },
      ],
    },

    /* ----- Weg 1: die Fähre ----- */
    kette: {
      art: "erzaehlung", abschnitt: 1, titel: "Die Kette", ort: "Der Anleger", weiter: "kampf_kette",
      text: ["Marit bringt Hammer, Nieten und ein neues Kettenglied. Als ihr an den Anleger tretet, klickt und knirscht es an den Pfosten. Käfer, so groß wie Katzen, mit rostroten Panzern. Sie fressen an der Kette, und als sie euch bemerken, fressen sie nicht mehr."],
    },
    kampf_kette: {
      art: "kampf", abschnitt: 1, titel: "Rost am Anleger", ort: "Die Fährstelle",
      text: [
        "Die Käfer kommen über die Wiese. Metall schützt euch hier nicht: Wer gebissen wird, dessen Rüstung rostet.",
        "Am Pfosten beim Wasser hängt die lose Kette. Solange sie durchhängt, klettern immer neue Käfer daran aus dem Fluss.",
        "*Ein Kampf mit einem Ziel: Ihr gewinnt, wenn alle Gegner besiegt sind – oder sobald jemand die Kette spannt. Dafür muss eine Figur neben dem Pfosten stehen, ohne dass ein Gegner daneben ist, und zweimal ihre Aktion einsetzen.*",
      ],
      kampf: { begegnung: "f_kette", karte: UFER,
        mechanik: {
          ziele: [{ id: "kette", name: "Der Kettenpfosten", art: "kette", x: 9, y: 5, runden: 2, ruhe: true, aktion: "Kette spannen", fertigText: "Die Kette hebt sich triefend aus dem Wasser", wirkung: { welleAus: "fluss" } }],
          sieg: { ziele: 1, art: "kette", text: "Die Kette spannt sich mit einem Ruck und beginnt zu summen. Die Käfer, die noch daran hängen, fallen ins Wasser. Die übrigen suchen das Weite." },
          wellen: [{ id: "fluss", name: "Die Kette im Wasser", kurz: "aus dem Fluss", quellen: [[9, 0], [9, 8]], gegner: [["rostkaefer", 0.2, 1, 0.3]], alle: 3, ab: 3, max: 2, text: "An der Kette klickt und knirscht es" }],
        },
        sieg: { weiter: "kette_nach" } },
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
      text: (A, h) => ["Die Fähre gleitet hinaus in den grauen Fluss. Marit steht an der Winde und zieht, Hand über Hand, ohne aufzusehen.", h.stimme(A, "wasser"), "Regen peitscht über die Planken. In der Mitte, wo die Strömung am stärksten ist, tauchen links und rechts kleine graue Köpfe aus dem Wasser. Dann Hände, die sich an die Ränder krallen. Die Kobolde klettern an Bord."],
    },
    kampf_faehre: {
      art: "kampf", abschnitt: 1, titel: "Kobolde an Bord", ort: "Die Fähre",
      text: [
        "Rund um euch ist nur Wasser. Wer am Rand steht, steht den Kobolden am nächsten.",
        "Marit ist von der Winde zurückgewichen, das Beil in beiden Händen. „Kurbelt!“, ruft sie. „Solange wir mitten im Fluss stehen, kommen immer mehr!“",
        "*Ein Kampf mit einem Ziel: Ihr gewinnt, wenn alle Kobolde besiegt sind – oder sobald die Fähre das Ufer erreicht. Dafür muss jemand an der Winde stehen und viermal seine Aktion einsetzen. Kurbeln geht nur, wenn kein Kobold neben der Winde steht: Haltet sie frei. Bis dahin klettern Kobolde nach.*",
      ],
      kampf: { begegnung: "f_faehre", karte: FAEHRE,
        mechanik: {
          ziele: [{ id: "winde", name: "Die Winde", art: "winde", x: 6, y: 2, runden: 4, ruhe: true, aktion: "An der Winde kurbeln", fertigText: "Die Fähre ruckt ein Stück weiter", wirkung: { welleAus: "rand" } }],
          sieg: { ziele: 1, art: "winde", text: "Die Fähre knirscht auf den Kies des Nordufers. Die Kobolde springen kreischend ab und verschwinden im Schilf." },
          wellen: [{ id: "rand", name: "Die Bordwand", kurz: "über die Bordwand", quellen: [[3, 2], [3, 6], [8, 2], [8, 6]], gegner: [["schattenkobold", 0.25, 2, 0.3]], alle: 2, ab: 2, max: 3, text: "Nasse Hände krallen sich an den Rand" }],
        },
        sieg: { weiter: "anderes_ufer" } },
    },

    /* ----- Weg 2: die Furt ----- */
    furt: {
      art: "probe", abschnitt: 1, titel: "Die alte Furt", ort: "Eine Stunde flussaufwärts",
      text: (A, h) => ["Die Furt ist eine Reihe flacher Kiesbänke, zwischen denen das Wasser schäumt. Ihr müsst euch gegen die Strömung stemmen. Alle würfeln.", h.stimme(A, "wasser"), A.merker.spuren ? "↳ Ihr wisst, wo die Kobolde gegangen sind, und folgt ihrem Weg: Vorteil." : ""],
      probe: { name: "Gegen die Strömung", wer: "gruppe", attr: "STR", sg: 11, geuebt: ["krieger", "waldlaeufer"], vorteil: (A) => (A.merker.spuren ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr kommt sicher hinüber und seht sie zuerst: Kobolde, die sich auf einer Kiesbank um einen glänzenden Haufen streiten.", setzt: { furt_ueberraschung: true }, weiter: "kampf_furt", folge: "Ihr seid unbemerkt über die Furt gekommen. Die Kobolde ahnen nichts." },
        knapp: { text: "Jemand verliert den Halt, die anderen ziehen ihn heraus. Es platscht. Auf der Kiesbank vor euch fahren graue Köpfe herum.", weiter: "kampf_furt" },
        fehl: { text: "Die Strömung reißt euch fast mit. Bis ihr drüben seid, ist es spät, der Fluss ist weiter gestiegen, und die Kobolde warten schon.", glocke: 1, weiter: "kampf_furt", folge: "Die Furt hat euch Zeit gekostet. Die Wehre steigt weiter, und die Kobolde sind gewarnt." } },
    },
    kampf_furt: {
      art: "kampf", abschnitt: 1, titel: "Auf der Kiesbank", ort: "Die alte Furt",
      text: [
        "Zwischen den Kiesbänken ist das Wasser zu tief zum Durchwaten. Ihr müsst über die Steine.",
        "Ganz hinten, am Rand der letzten Kiesbank, liegt der glänzende Haufen, um den sich die Kobolde gestritten haben: Löffel, Schnallen, Nägel. Sie lassen ihn nicht aus den Augen.",
        "*Ein Kampf mit einem Ziel: Ihr gewinnt, wenn alle Gegner besiegt sind – oder sobald jemand den Haufen in den Fluss tritt. Dafür muss eine Figur daneben stehen und ihre Aktion einsetzen. Der Weg dorthin führt mitten durch die Kobolde.*",
      ],
      kampf: (A) => ({ begegnung: "f_furt", karte: FURT, ueberraschung: Boolean(A.merker.furt_ueberraschung),
        mechanik: {
          ziele: [{ id: "haufen", name: "Der glänzende Haufen", art: "haufen", x: 11, y: 5, runden: 1, aktion: "Den Haufen in den Fluss treten", fertigText: "Es klirrt, glitzert und versinkt" }],
          sieg: { ziele: 1, art: "haufen", text: "Die Kobolde kreischen auf und stürzen sich dem Glitzern hinterher ins Wasser. Die Strömung nimmt sie mit." },
        },
        sieg: { weiter: "anderes_ufer" } }),
    },

    /* ----- Das andere Ufer ----- */
    anderes_ufer: {
      art: "gespraech", abschnitt: 1, titel: "Das andere Ufer", ort: "Am Nordufer der Wehre",
      text: (A) => [
        "Am Nordufer liegt eine Kindermütze im Gras, nass und zertreten. Dahinter, auf einem Hügel über dem Fluss, steht der alte Zollturm: rund, schief, ohne Dach. In einem Fenster flackert grünes Licht.",
        A.merker.marit_dabei ? "↳ Marit macht die Fähre fest und hebt die Mütze auf. Sie dreht sie in den Händen, wringt sie aus und steckt sie ein. „Ich warte hier“, sagt sie. „Wenn ich mit hineingehe, mache ich etwas Dummes.“" : "↳ Niemand hebt die Mütze auf, der sie kennt. Ihr steckt sie ein, für Marit, die drüben im Fährhaus sitzt und auf den Fluss sieht.",
        A.merker.glocke_gehoert ? "↳ Im Norden schlägt wieder die Glocke von Grauwacht. Diesmal klingt sie näher." : "Im Norden schlägt eine Glocke, tief und langsam. Ihr wisst nicht, was dort läutet.",
      ],
      optionen: [
        { id: "beute", text: "Was die Kobolde verloren haben untersuchen", frage: "Am Ufer liegt Diebesgut.",
          antwort: "Löffel, Nägel, ein Kerzenleuchter, eine Gürtelschnalle. Alles aus Metall, alles glänzend. Und dazwischen etwas, das nicht dazupasst: ein Stück grauer Stein, so groß wie eine Hand, mit einem eingeritzten Zeichen. Ein Kreis mit sieben Strichen. Der Stein ist kalt, obwohl er in der Sonne gelegen hat.",
          setzt: { zeichen_gesehen: true }, folge: "Ihr habt ein Stück grauen Stein mit einem Zeichen gefunden: ein Kreis mit sieben Strichen. Ihr werdet es wiedererkennen." },
        { id: "lauschen", wichtig: true, text: "Am Turm lauschen (Schurke oder Waldläufer)", wenn: (A, h) => Boolean(h.klasse(A, "schurke") || h.klasse(A, "waldlaeufer")), frage: "Ihr schleicht bis an die Mauer.",
          antwort: "Drinnen kichern Kobolde. Dazwischen eine Kinderstimme, die zählt, laut und tapfer: „Hundertzwölf, hundertdreizehn …“ Und ein Geräusch wie von Münzen, die auf einen Tisch fallen. Unter dem Turm führt ein Kellerschacht nach draußen, mit Brettern verstellt.",
          setzt: { schacht: true }, folge: "Pim lebt, und er zählt. Und ihr kennt einen zweiten Weg in den Turm: den Kellerschacht." },
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
        A.merker.schacht ? "↳ Der Kellerschacht an der Rückseite führt unter den Turm. Wer leise ist, kommt von hinten heran." : "",
        A.merker.brannick ? "↳ Zwischen dem Kichern hört ihr eine zweite Stimme, trocken und gleichmäßig. Sie zählt. Ihr wisst, wem sie gehört." : "Zwischen dem Kichern zählt jemand, trocken und gleichmäßig. Es ist keine Kinderstimme.",
        "*Eine Abstimmung. Wer wartet, hat es leichter. Pim nicht.*",
      ].filter(Boolean),
      optionen: [
        { id: "tuer", text: "Durch die Tür, schnell und laut", weiter: "kampf_turm", folge: "Ihr geht geradewegs hinein. Pim hört euch kommen." },
        { id: "schacht", text: "Durch den Kellerschacht schleichen", wenn: (A) => Boolean(A.merker.schacht), weiter: "schleichen" },
        { id: "warten", text: "Warten, bis die Kobolde müde werden (leichterer Kampf, der Pegel steigt, Pim bleibt so lange allein)", glocke: 1, setzt: { gewartet: true }, naechsterKampf: 0.85, weiter: "kampf_turm",
          folge: "Ihr wartet, bis das Kichern leiser wird. Die Kobolde sind schläfrig. Pim hat aufgehört, laut zu zählen." },
      ],
    },
    schleichen: {
      art: "probe", abschnitt: 1, titel: "Im Kellerschacht", ort: "Unter dem Zollturm",
      text: ["Der Schacht ist eng und riecht nach Moder. Wer vorangeht, muss leise sein, sonst hören es alle."],
      probe: { name: "Leise", attr: "GES", sg: 12, geuebt: ["schurke"], knapp: true,
        erfolg: { text: "Ihr kommt lautlos hinter einer Säule heraus. Die Kobolde sitzen um einen Tisch voller Münzen und haben euch den Rücken zugedreht.", setzt: { ueberraschung: true }, weiter: "kampf_turm", folge: "Ihr steht im Rücken der Kobolde. Sie haben euch nicht gehört." },
        knapp: { text: "Ein Brett knarrt. Die Kobolde horchen auf, aber sie wissen nicht, woher es kam.", weiter: "kampf_turm" },
        fehl: { text: "Ihr reißt beim Aufstieg einen Eimer um. Er scheppert die ganze Treppe hinunter. Oben wird es still, dann bricht Geschrei los.", glocke: 1, weiter: "kampf_turm" } },
    },
    kampf_turm: {
      art: "kampf", abschnitt: 1, titel: "Der Zöllner zählt", ort: "Der Zollturm",
      text: [
        "Pim liegt gefesselt an der hinteren Wand. Zwischen euch und ihm: Kobolde, und am Tisch mit den Münzen eine Gestalt aus Knochen, im verrotteten Mantel eines Zöllners. Brannick. Er zählt noch immer. Besiegt sie, dann ist Pim frei.",
        "*Achtet auf Brannick: Wenn er eine Handvoll Münzen hebt, leuchten Felder rot auf. Dorthin schleudert er sie bei seinem nächsten Zug. Wer bis dahin heruntergeht, bleibt heil. Steht nicht dicht beieinander.*",
      ],
      kampf: (A) => ({ begegnung: "f_turm", karte: TURM, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.ueberraschung),
        begleiter: { name: "Pim", titel: "gefesselt", tp: 8, start: TURM.start.begleiter, route: [], ausgang: false, gefesselt: true },
        sieg: { setzt: { pim_frei: true }, weiter: "turm_nach", folge: "Pim ist frei." } }),
    },
    turm_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Hundertdreizehn", ort: "Der Zollturm", weiter: "pim", rastErlaubt: true,
      text: (A, h) => [
        "Brannicks Knochen fallen auseinander, als hätte jemand die Schnur durchgeschnitten, die sie hielt. Die Münzen rollen über den Boden.",
        h.stimme(A, "gefangen"),
        A.merker.gewartet ? "↳ Pim sagt nichts, als ihr ihn losschneidet. Er hat irgendwann aufgehört zu zählen. Erst als die Fesseln ab sind, holt er Luft, als hätte er es die ganze Zeit vergessen."
          : "Pim zittert, aber er grinst. „Hundertdreizehn“, sagt er. „Ich hab mitgezählt, damit ich nicht weine.“",
        A.merker.marit_dabei ? "↳ Marit ist die Treppe herauf, bevor ihr sie rufen könnt. Sie sagt kein Wort. Sie hält ihn nur fest, das Beil noch in der Hand, und er lässt es sich gefallen, obwohl er elf ist." : "↳ Pim sieht zur Tür, als müsse dort jemand stehen. „Sie wartet drüben“, sagt ihr. Er nickt, tapfer und ein bisschen enttäuscht.",
      ],
    },
    pim: {
      art: "gespraech", abschnitt: 1, titel: "Pim", ort: "Der Zollturm",
      // Pim ist erschöpft: zwei Fragen, mehr schafft er nicht
      fragen: 2, draengt: "Pim gähnt mitten im Satz und reibt sich die Augen. Mehr bekommt ihr heute nicht aus ihm heraus.",
      text: (A) => [
        "Pim reibt sich die Handgelenke und sieht sich im Turm um, als gehöre er jetzt ihm. Auf dem Tisch liegen Brannicks Münzen, in umgestürzten Stapeln. Mitten darin liegt etwas Graues, das nicht dazugehört.",
        A.merker.zeichen_gesehen ? "↳ Ein Stück grauer Stein. Dasselbe Zeichen wie am Ufer: ein Kreis mit sieben Strichen. Die beiden Stücke passen aneinander." : "Ein Stück grauer Stein, so groß wie eine Hand. Ein Zeichen ist hineingeritzt: ein Kreis mit sieben Strichen.",
        "*Pim war eine Nacht lang hier. Er hat mehr gesehen als ihr. Aber er hält sich kaum noch auf den Beinen.*",
      ],
      optionen: [
        { id: "kobolde", text: "Pim fragen, was die Kobolde hier wollten", wer: "Pim", frage: "„Was haben sie hier gemacht?“",
          antwort: "Pim zeigt auf den Stein. „Den haben sie aus dem Norden mitgebracht. Sie haben ihn angebetet. Und jedes Mal, wenn die Glocke geschlagen hat, haben sie gejubelt.“ Er zieht die Nase hoch. „Mich haben sie nur geholt, weil meine Jackenknöpfe glänzen.“" },
        { id: "zoellner", text: "Pim nach dem Zöllner fragen", wer: "Pim", frage: "„Hat er dir etwas getan?“", wichtig: true,
          antwort: (A) => `„Der? Nein. Der hat nur gezählt.“ Pim zuckt mit den Schultern. „Immer bis hundertdreizehn. Dann hat er so ein Geräusch gemacht, wie wenn man seufzt, und wieder von vorn angefangen. Als ob eine fehlt.“ Er greift in die Jackentasche und zieht eine schwarz angelaufene Silbermünze heraus. „Die lag unter dem Tisch, ganz hinten in der Ritze. Ich hab sie mit dem Fuß geholt. Glaubt ihr, die ist es?“${A.merker.brannick ? " Ihr denkt an das, was Marit erzählt hat: Er hat nachgezählt, damit keiner sagen kann, es fehle etwas. Dreißig Jahre lang hat eine gefehlt." : ""}`,
          setzt: { fehlende_muenze: true }, folge: "Ihr wisst, warum Brannick nie aufhört: Ihm fehlt eine einzige Münze. Pim hat sie gefunden." },
        { id: "mutter", text: "Pim sagen, was seine Mutter sich vorwirft", wer: "Pim", wenn: (A) => Boolean(A.merker.marit_schuld), frage: "„Deine Mutter glaubt, es sei ihre Schuld.“", wichtig: true,
          antwort: (A) => `Pim sieht euch an, als hättet ihr etwas sehr Dummes gesagt. „Weil sie mir die Laterne gehalten hat? Das war das Beste, was sie je gemacht hat! Papa hat mich nie an die Kette gelassen. Sie schon.“ Er denkt nach. „Sie guckt immer so, wenn sie denkt, sie hat was falsch gemacht. Dann redet sie drei Tage nicht.“ ${A.merker.marit_dabei ? "Er sieht zu Marit hinüber, die an der Tür steht und so tut, als höre sie nicht zu." : "Er steht auf. „Ich sag ihr das. Gleich, wenn wir drüben sind.“"}`,
          setzt: { pim_trost: true }, folge: "Pim weiß jetzt, was seine Mutter sich vorwirft, und sieht es ganz anders. Er wird es ihr sagen." },
        { id: "weiter", text: "An Brannicks Tisch treten", weiter: "muenzen" },
      ],
    },
    muenzen: {
      art: "wahl", abschnitt: 1, titel: "Das Zollgeld", ort: "Der Zollturm",
      text: (A) => [
        "Hundertdreizehn Silbermünzen, alt und schwer, mit dem Wappen eines Fürsten, den es nicht mehr gibt. Sie gehören niemandem, der noch lebt.",
        A.merker.fehlende_muenze ? "↳ Pim hält die hundertvierzehnte in der Faust. Ihr wisst, was der alte Zöllner dreißig Jahre lang gesucht hat. Unter dem Tisch liegen seine Knochen, und sie liegen nicht ganz still." : "Unter dem Tisch liegen die Knochen des Zöllners. Warum er nicht aufhören konnte zu zählen, wisst ihr nicht. Gefragt habt ihr den Einzigen nicht, der ihm eine Nacht lang zugehört hat.",
        A.merker.marit_vertraut ? "↳ Ihr denkt an Marit, an die zerfressene Kette, an das Fährhaus, das die Wehre gerade bis zur Schwelle unter Wasser setzt." : "",
        "*Eine Abstimmung. Was mit dem Geld geschieht, bestimmt, was aus dem Turm wird.*",
      ],
      optionen: [
        { id: "zaehlen", text: "Die fehlende Münze dazulegen und für Brannick zu Ende zählen", wenn: (A) => Boolean(A.merker.fehlende_muenze), setzt: { muenzen: "gezaehlt" }, weiter: "stein",
          folge: "Ihr stapelt die Münzen neu, Pim legt die letzte obenauf, und ihr zählt laut, alle zusammen. Bei hundertvierzehn geht das grüne Licht im Fenster aus. Die Knochen unter dem Tisch liegen still." },
        { id: "marit", text: "Das Geld für Marit mitnehmen: eine neue Kette, ein trockenes Haus", setzt: { muenzen: "marit" }, weiter: "stein",
          folge: "Ihr packt das Zollgeld für Marit ein. Hinter euch, unter dem Tisch, klickt etwas, leise, wie ein Finger auf Holz." },
        { id: "nehmen", text: "Das Geld einstecken: Lohn für eine lange Nacht", setzt: { muenzen: "genommen" }, weiter: "stein",
          folge: "Ihr teilt das Zollgeld unter euch auf. Pim sieht zu und sagt nichts. Unter dem Tisch klickt etwas, leise, wie ein Finger auf Holz." },
      ],
    },
    stein: {
      art: "geheim", abschnitt: 1, titel: "Der graue Stein", ort: "Der Zollturm",
      text: [
        "Bleibt der Stein. Jemand muss ihn vom Tisch nehmen. Er geht reihum, von Hand zu Hand, weil ihn niemand lange halten will: Er ist kalt, und er ist schwerer, als er sein dürfte.",
        "Im Norden schlägt die Glocke von Grauwacht. Wer den Stein in diesem Moment in der Hand hat, spürt, dass er mitschlägt. Und dass er etwas verspricht, ohne Worte, jedem etwas anderes.",
        "*Eine geheime Entscheidung: Jede Person hält den Stein einen Augenblick lang allein. Niemand sieht, wie lange.*",
      ],
      frage: "Der Stein liegt in deiner Hand und schlägt wie ein zweites Herz. Gibst du ihn sofort weiter?",
      antworten: [
        { id: "weiter", text: "Ja. Sofort.", kurz: "gab ihn sofort weiter", setzt: () => ({ stein_gesehen: true }) },
        { id: "halten", text: "Nein. Noch einen Schlag lang.", kurz: "hielt ihn länger fest", setzt: (f) => ({ stein_gesehen: true, ["hielt_" + f]: true }),
          folge: "Jemand von euch hat den Stein länger gehalten, als nötig war. Der Stein hat es bemerkt." },
      ],
      abschluss: (A, h) => (halter(A, h).length ? "Der Stein liegt wieder auf dem Tisch. Niemand sieht den anderen an. Draußen verklingt die Glocke, und für einen Moment hat sie geklungen wie eine Antwort." : "Der Stein liegt wieder auf dem Tisch. Ihr wischt euch alle die Hand am Mantel ab, ohne es zu merken. Draußen verklingt die Glocke."),
      weiter: "splitter",
    },
    splitter: {
      art: "wahl", abschnitt: 1, titel: "Der graue Stein", ort: "Der Zollturm",
      text: (A, h) => [
        "Der Stein kann nicht hierbleiben. Pim sagt, die Kobolde kämen wieder, solange er hier liege.",
        halter(A, h).length ? "↳ Wer ihn länger gehalten hat, weiß, wohin er will: nach Norden, zur Glocke. Ob das ein Grund ist, ihn hinzubringen, oder der beste Grund, es nicht zu tun, müsst ihr entscheiden." : "↳ Keiner von euch hat ihn länger gehalten als nötig. Was er will, wisst ihr nicht. Vielleicht ist das gut so.",
        "*Die letzte Abstimmung dieser Nacht.*",
      ],
      optionen: [
        { id: "mitnehmen", text: "Mitnehmen: Wer auch immer in Grauwacht läutet, sollte wissen, was hier geschieht", setzt: { splitter: "mit" }, weiter: "ende_norden", folge: "Ihr nehmt den Stein mit nach Norden." },
        { id: "versenken", text: "In die Wehre werfen: Was immer es ist, es soll niemandem mehr schaden", setzt: { splitter: "fluss" }, weiter: "ende_wehre", folge: "Ihr gebt den Stein der Wehre." },
      ],
    },

    /* ----- Enden ----- */
    ende_norden: {
      art: "ende", abschnitt: 1, titel: "Der Weg nach Norden", ort: "Graufurt", rueckschau,
      text: (A, h) => [
        "Marit setzt euch am nächsten Morgen über. Den Stein tragt ihr in ein Tuch gewickelt, und wer ihn trägt, friert, auch in der Sonne.",
        ...epilog(A, h),
        halter(A, h).length ? `↳ ${h.namen(A, halter(A, h))} ${halter(A, h).length === 1 ? "trägt" : "tragen"} den Stein öfter als die anderen, ohne dass es jemand so bestimmt hätte. Die Kälte des Steins scheint dabei kaum noch zu stören. Jetzt wisst ihr auch, wer ihn im Turm nicht hergeben wollte.` : "",
        "Die Straße nach Norden führt nach Halmbruck, einem Dorf am Fuß der Hügel, eine Woche entfernt. Dahinter liegt Grauwacht. Jede Nacht schlägt die Glocke, und jede Nacht ein bisschen lauter.",
        "*Weiter geht es in „Das Siegel von Grauwacht“.*",
      ],
    },
    ende_wehre: {
      art: "ende", abschnitt: 1, titel: "Was die Wehre nimmt", ort: "Graufurt", rueckschau,
      text: (A, h) => [
        "Der Stein versinkt ohne einen Laut. Für eine Nacht schweigt die Glocke im Norden, zum ersten Mal seit Tagen. Marit sagt, das sei ein gutes Zeichen. Ihr seid nicht so sicher.",
        ...epilog(A, h),
        halter(A, h).length ? `↳ ${h.namen(A, halter(A, h))} ${halter(A, h).length === 1 ? "wacht" : "wachen"} in den Nächten danach auf und ${halter(A, h).length === 1 ? "hört" : "hören"} es: tief unter Wasser, weit weg, schlägt etwas weiter. Jetzt wisst ihr auch, wer den Stein im Turm nicht hergeben wollte.` : "",
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
    zoellner: { klassen: ["kleriker", "zauberer"], text: "Untot, und Knochen brechen unter Wucht. Bevor er Münzen schleudert, hebt er sie eine Runde lang: Die Felder leuchten rot. Wer auseinander steht, verliert weniger." },
  };
  const META = {
    id: "graufurt", schwierigkeit: 1, reihe: 2, titel: "Die Fähre von Graufurt", kurz: "Graufurt", untertitel: "Ein Kurzabenteuer an der Wehre, auf dem Weg nach Grauwacht",
    kurztext: "Kobolde haben den Sohn der Fährfrau verschleppt. Im Norden läutet zum ersten Mal die Glocke von Grauwacht.",
    // Hinweise ohne Spoiler auf das Ende, das die Gruppe nicht gesehen hat
    endeHinweise: { ende_norden: "Ein anderes Ende beginnt damit, dass ihr den grauen Stein nicht hergebt.", ende_wehre: "Ein anderes Ende beginnt damit, dass der Fluss den grauen Stein bekommt." },
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
