/*
 * Das Erntefest von Weidenhain – Einsteiger-Kurzabenteuer (1 Abschnitt, Stufe 1–2 (Aufstieg am Lagerfeuer vor der Unke), 2–6 Helden, etwa 1 Stunde)
 * Spielt vor „Das Moor der stummen Lichter“: Die Gruppe findet auf einem Dorffest zusammen, erlebt jede Szenenart
 * einmal in ruhigem Tempo (Gespräch, Abstimmung, Probe, Kampf, Lager, geheime Entscheidung) und sieht zum ersten Mal
 * die stummen Lichter über dem Schwarzmoor. Gebaut nach KAMPAGNEN-BAUKASTEN.md: nur vorhandene Gegner (Schlammkröte, Irrlicht).
 * Die „Uhr“ ist die Nacht (A.glocke, 0–7): Je später es wird, desto mehr fressen die Kröten und desto stiller wird das Fest.
 * Karten mit gemalten Bildern (img/weidenhain/), Hindernisse am Bild ausgerichtet (Raster 12 × 9). Bilder siehe BILDER-WEIDENHAIN.md.
 */
(function (root) {
  "use strict";
  const T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y], M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y];
  // Karte als Text: . begehbar · ~ Wasser (versperrt den Weg, nicht die Sicht) · T Baum/Schilf · K Kiste, Sack, Fass · M Mauer, Stein
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { if (c === "~") h.push(Q(x, y)); else if (c === "T") h.push(T(x, y)); else if (c === "K") h.push(K(x, y)); else if (c === "M") h.push(M(x, y)); })); return h; };

  /* ---------- Karten (12 × 9) ---------- */
  // Der Kornspeicher: links das Tor, rechts das Loch zum Graben, dazwischen Säcke und Fässer
  const SPEICHER = {
    name: "Der Kornspeicher", b: 12, h: 9, boden: "holz", bild: "img/weidenhain/speicher.webp",
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MMKK.....KMM",
      "M..KK..KK.MM",
      "M..KK..KK.MM",
      "............",
      "M..KK..KK.MM",
      "M.........MM",
      "MMKK.....KMM",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[0, 4], [1, 4], [1, 3], [1, 5], [2, 3], [2, 5]], wolf: [[2, 4], [3, 4], [2, 2], [2, 6]],
      gegner: [[9, 4], [10, 4], [11, 4], [9, 3], [9, 5], [9, 2], [9, 6], [6, 2], [6, 6], [7, 4], [6, 3], [6, 5]] },
  };
  // Die Mühle: der Mühlgraben teilt die Wiese, in der Mitte ein Steg, oben rechts das Mühlhaus
  const MUEHLE = {
    name: "Am Mühlgraben", b: 12, h: 9, boden: "garten", bild: "img/weidenhain/muehle.webp",
    hindernisse: ausText([
      "TTT...~~.MMM",
      "TTTKK.~~KMMM",
      "TT....~~..MM",
      "..K...~~..K.",
      "............",
      "..K...~~....",
      "TT....~~.KKT",
      "TT....~~..TT",
      "TTT...~~..TT",
    ]),
    start: { spieler: [[0, 3], [1, 3], [1, 4], [0, 4], [1, 5], [0, 5]], wolf: [[2, 4], [3, 4], [3, 2], [3, 6]],
      gegner: [[9, 4], [10, 4], [11, 4], [9, 3], [9, 5], [8, 4], [8, 2], [9, 2], [10, 5], [11, 5], [8, 6], [11, 3]] },
  };
  // Das Wehr: ein Streifen Ufer zwischen Mühlteich oben und dem Abfluss unten, das Wehr aus Steinen am unteren Rand
  const WEHR = {
    name: "Das alte Wehr", b: 12, h: 9, boden: "moor", bild: "img/weidenhain/wehr.webp",
    hindernisse: ausText([
      "TT~~~~~~~~~T",
      "TTT~~~~~~MMT",
      ".TT......MM.",
      "............",
      ".T..........",
      "TTT.......K.",
      "............",
      "MMMMMMMMMMMM",
      "T~~~~~~~~~~~",
    ]),
    start: { spieler: [[0, 3], [1, 3], [2, 3], [0, 4], [2, 4], [3, 4]], wolf: [[3, 3], [3, 5], [3, 2], [4, 4]],
      gegner: [[9, 4], [10, 4], [9, 3], [10, 3], [9, 5], [11, 4], [11, 3], [11, 5], [8, 4], [8, 2], [8, 6], [9, 6]] },
  };
  const KARTEN = { SPEICHER, MUEHLE, WEHR };

  /* ---------- Erzählfäden ----------
   * Tebbe (Lenes Bruder, an der Mühle): merker.tebbe = "heil" | "verletzt"  – hängt an der Wegwahl
   * Die Unke: merker.unke = "tot" | "frei"; wer von Mette oder Tebbe weiß, dass sie Angst hat, entscheidet wissend
   * Das Müllergeld (geheim): fund_genommen / fund_gemeldet, wer: nahm_<fid> / zeigte_<fid>
   * Der Spielmann (geheim): grund_<fid> = silber | dorf | abenteuer – das Lied am Ende nennt die Namen
   * Hanne: lohn (ihr habt nach dem Lohn gefragt) */
  const kenntAngst = (A) => Boolean(A.merker.lichter_gesehen || A.merker.tebbe === "heil");
  const mitGrund = (A, h, g) => h.lebende(A).filter((f) => A.merker["grund_" + f] === g);
  const nehmer = (A, h) => h.lebende(A).filter((f) => A.merker["nahm_" + f]);
  const zeiger = (A, h) => h.lebende(A).filter((f) => A.merker["zeigte_" + f]);
  const ist = (n) => (n.length === 1 ? "ist" : "sind");

  /* ---------- Epilog: was aus Weidenhain wird (hängt an euren Entscheidungen) ---------- */
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "Das Korn ist gerettet, fast jeder Sack. Weidenhain wird gut über den Winter kommen." : A.glocke <= 5 ? "Ein Teil des Korns ist verloren. Es wird ein knapper Winter, aber niemand muss hungern." : "Die Kröten haben viel gefressen, bevor ihr sie aufhalten konntet. Weidenhain wird im Winter zusammenrücken müssen.");
    // Tebbe und Lene
    t.push(m.tebbe === "heil" ? "↳ Tebbe weicht euch nicht mehr von der Seite. Er trägt die Mühlkatze unter dem Hemd und erzählt jedem, der es hören will, wie ihr über den Graben gekommen seid. Lene drückt euch wortlos einen Laib Brot in die Hand, noch warm."
      : m.tebbe === "verletzt" ? "↳ Tebbe sitzt mit verbundenem Bein am Feuer. Er wird wieder laufen, sagt das Kräuterweib, aber hinken wird er wohl. Lene dankt euch. Sie meint es ehrlich, und doch sieht sie dabei auf sein Bein." : "");
    // Die Unke
    t.push(m.unke === "frei" ? (kenntAngst(A) ? "↳ Mette nickt, als sie hört, dass die Unke lebt. „Sie saß schon am Wehr, als meine Großmutter ein Kind war. Wenn sie wieder quakt, wissen wir, dass die Lichter fort sind. Und wenn sie flieht, wissen wir, dass sie kommen.“ Weidenhain hat jetzt eine Wächterin, die niemand füttern muss."
        : "↳ Ihr habt die Unke ziehen lassen, ohne recht zu wissen, warum. Hanne schüttelt den Kopf darüber. Mette nicht.")
      : m.unke === "tot" ? (kenntAngst(A) ? "↳ Die alte Unke treibt am Morgen im Mühlteich. Ihr wusstet, dass sie nur Angst hatte, und habt es trotzdem zu Ende gebracht. Hanne lässt sie verbrennen. Mette sieht dem Rauch nach und sagt lange nichts."
        : "↳ Die alte Unke treibt am Morgen im Mühlteich. Hanne lässt sie verbrennen, und das Dorf atmet auf. Nur Mette murmelt: „Sie saß schon am Wehr, als meine Großmutter ein Kind war.“") : "");
    // Das Müllergeld
    const n = nehmer(A, h), z = zeiger(A, h);
    if (m.fund_gemeldet && !m.fund_genommen) t.push(`↳ Die Müllerin Agnes hält den Beutel mit beiden Händen, als ${h.namen(A, z)} ihn ihr ${z.length === 1 ? "bringt" : "bringen"}. Es ist alles, was ihr Mann ihr hinterlassen hat, und sie hatte es verloren geglaubt. Sie gibt euch seine Laterne mit. „Die hat ihn dreißig Jahre heimgebracht.“`);
    else if (m.fund_gemeldet && m.fund_genommen) t.push("↳ Die Müllerin Agnes zählt, was ihr unter der Diele gefunden habt. Sie zählt zweimal. „Es war mehr“, sagt sie leise, und dann: „Es ist gut. Es ist mehr, als ich hatte.“ Sie fragt nicht. Jemand von euch ist froh darüber.");
    else if (m.fund_genommen) t.push(`↳ Im Frühjahr wird die Müllerin Agnes die lose Diele in der Mühle heben und das Versteck ihres Mannes finden. ${n.length === 1 ? "Ein Beutel wird fehlen" : "Es wird fast leer sein"}. Sie wird nie erfahren, wer in jener Nacht in der Mühle war. Ihr schon.`);
    else if (m.fund_gesehen) t.push("↳ Unter der Diele in der Mühle liegt noch immer das Geld des toten Müllers. Niemand von euch hat es angerührt, und niemand hat ein Wort darüber verloren. Im Frühjahr wird Agnes es finden.");
    // Hanne und der Lohn
    t.push(m.lohn ? "↳ Hanne zählt euch das Silber in die Hand, Münze für Münze, genau so viel wie abgemacht. „Ihr habt danach gefragt“, sagt sie. „Also sollt ihr es auch genau bekommen.“"
      : "↳ Hanne drückt euch einen Beutel in die Hand, der schwerer ist, als er sein müsste. „Ihr habt nicht einmal gefragt, was es gibt“, sagt sie. „So etwas merkt sich ein Dorf.“");
    // Das Lied des Spielmanns: Hier werden die geheimen Antworten laut
    const si = mitGrund(A, h, "silber"), d = mitGrund(A, h, "dorf"), ab = mitGrund(A, h, "abenteuer");
    if (si.length || d.length || ab.length) {
      const verse = [];
      if (d.length) verse.push(`${h.namen(A, d)} ${d.length === 1 ? "kam" : "kamen"}, weil das Dorf in Not war`);
      if (ab.length) verse.push(`${h.namen(A, ab)} ${ab.length === 1 ? "suchte" : "suchten"} das Abenteuer und ${ab.length === 1 ? "fand" : "fanden"} es im Schlamm`);
      if (si.length) verse.push(`${h.namen(A, si)} ${si.length === 1 ? "kam" : "kamen"} für das Silber und ${si.length === 1 ? "blieb" : "blieben"} trotzdem bis zum Schluss`);
      t.push(`↳ Dann steigt der Spielmann auf einen Tisch und singt sein Lied. Es ist nicht gut, aber es ist ehrlich, denn er hat genau zugehört: ${verse.join("; ")}. ${si.length && (d.length || ab.length) ? "Ein paar von euch sehen einander an. Das habt ihr voneinander nicht gewusst." : si.length ? "Das Dorf lacht, und ihr lacht mit." : "Das Dorf singt die zweite Strophe schon mit."}`);
      if (m.fund_genommen) t.push("↳ Die letzte Strophe singt er leiser. Sie handelt von einer Mühle, einer losen Diele und von jemandem, der im Dunkeln die Hand ausstreckt. Er nennt keinen Namen. Er sieht auch niemanden an.");
    }
    // Abschied: ein Held im Blick, und was Tebbe sich vom Feuer gemerkt hat
    t.push(h.stimme(A, "abschied"));
    const erz = h.lebende(A).filter((f) => m["feuer_" + f]);
    if (erz.length && m.tebbe) { const f = erz[Math.floor(erz.length / 2)]; t.push(`↳ Tebbe ${m.tebbe === "heil" ? "rennt euch am Dorfrand noch einmal nach" : "lässt sich von Lene bis zum Dorfrand stützen"} und sagt zu ${h.name(A, f)}, sehr ernst: „Ich hab mir gemerkt, was du am Feuer gesagt hast.“ Mehr sagt er nicht. Es ist auch nicht nötig.`); }
    t.push(m.ziege ? "Die Ziege des Bürgermeisters folgt euch bis zum Dorfrand. Sie hat beschlossen, dass ihr jetzt zu ihr gehört." : "");
    if (A.gefallen.length) t.push(`Unter der Dorflinde von Weidenhain liegt jetzt ein Stein mit ${A.gefallen.length === 1 ? "einem Namen" : "Namen"}: ${A.gefallen.map((f) => h.name(A, f)).join(", ")}. Jedes Erntefest legen die Kinder Kränze dazu.`);
    return t.filter(Boolean);
  }
  /** Rückschau: die Entscheidungen der Nacht in einem Satz je Faden */
  function rueckschau(A, h) {
    const m = A.merker, n = nehmer(A, h), z = zeiger(A, h), t = [];
    t.push(m.tebbe === "heil" ? "Ihr seid sofort am Graben entlang zur Mühle. Tebbe kam mit dem Schrecken davon." : m.fackeln ? "Ihr habt erst Fackeln geholt. Der Weg war sicher, aber Tebbe saß zu lange allein auf dem Mühlboden." : m.tebbe === "verletzt" ? "Der Graben hat euch aufgehalten. Ihr kamt zu spät, um Tebbe das Bein zu ersparen." : "");
    t.push(m.unke === "frei" ? `Ihr habt die alte Unke ziehen lassen${kenntAngst(A) ? ", weil ihr wusstet, wovor sie floh" : ", ohne zu wissen, wovor sie floh"}.` : m.unke === "tot" ? `Ihr habt die alte Unke getötet${kenntAngst(A) ? ", obwohl ihr wusstet, dass sie nur Angst hatte" : ". Dass sie selbst auf der Flucht war, habt ihr nie erfahren"}.` : "");
    t.push(m.fund_gemeldet ? `${h.namen(A, z)} ${z.length === 1 ? "hat" : "haben"} das Geld des Müllers nicht für sich behalten${m.fund_genommen ? ` – aber ${n.length === 1 ? "jemand anderes hatte" : "andere hatten"} schon zugegriffen` : ""}.` : m.fund_genommen ? `${n.length === 1 ? "Eine Person" : n.length + " von euch"} ${n.length === 1 ? "hat" : "haben"} in der Mühle Geld genommen, das einer Witwe gehört. Die anderen wissen es bis heute nicht.` : m.fund_gesehen ? "Das Geld unter der Diele hat niemand angerührt." : "");
    const si = mitGrund(A, h, "silber"), d = mitGrund(A, h, "dorf"), ab = mitGrund(A, h, "abenteuer");
    if (si.length + d.length + ab.length) t.push(`Dem Spielmann gesagt: ${[d.length ? `${h.namen(A, d)} für das Dorf` : "", ab.length ? `${h.namen(A, ab)} für das Abenteuer` : "", si.length ? `${h.namen(A, si)} für das Silber` : ""].filter(Boolean).join(", ")}.`);
    for (const f of h.lebende(A)) if (h.feuerEcho(A, f)) t.push(h.feuerEcho(A, f));
    t.push(m.lichter_gesehen ? "Ihr habt der alten Mette zugehört. Ihr wisst, was über dem Moor steht." : "Die alte Mette am Feuer habt ihr nicht gefragt. Was sie über die Lichter weiß, nehmt ihr nicht mit ins Moor.");
    t.push(m.aufbruch === "nacht" ? "Ihr seid noch in der Nacht nach Rabenmoor aufgebrochen." : m.aufbruch === "morgen" ? "Ihr habt dem Dorf noch eine Nacht geschenkt und seid erst am Morgen aufgebrochen." : "");
    return t.filter(Boolean);
  }

  const SZENEN = {
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Weidenhain", ort: "Am Rand des Schwarzmoors, Abend", weiter: "festplatz",
      text: [
        "Ihr kennt euch kaum. Ihr seid alle aus demselben Grund in Weidenhain: Es ist Erntefest, und wer Arbeit sucht, findet hier welche. Auf dem Dorfplatz brennt ein Feuer, es riecht nach Brot und Bier, und jemand spielt schief auf einer Fiedel.",
        "Ihr sitzt an einem langen Tisch zwischen Leuten, die einander seit ihrer Geburt kennen. Kinder rennen mit Strohkränzen zwischen den Bänken hindurch. Eine alte Frau am Feuer sieht als Einzige nicht zum Tanz, sondern nach Süden, wo das Moor liegt.",
        "Dann schreit jemand. Hinter der Scheune poltert es, Säcke fallen, und eine junge Magd rennt aus dem Kornspeicher, als wäre der Teufel hinter ihr her.",
      ],
    },
    festplatz: {
      art: "gespraech", abschnitt: 1, titel: "Der Dorfplatz", ort: "Weidenhain",
      // Begrenzte Zeit: drei Fragen, danach kostet jede weitere eine Stunde der Nacht (im Speicher wird weitergefressen)
      fragen: 3, ueberzug: true, draengt: "Im Speicher kracht ein Regal um. Hanne sieht euch an: „Wollt ihr reden oder helfen?“",
      text: (A, h) => [
        "Die Musik bricht ab. Hanne Kalk, die Bürgermeisterin, eine breite Frau mit Mehl an den Händen, kommt auf euch zu. „Ihr da. Ihr seht aus, als könntet ihr kämpfen. Könnt ihr?“",
        h.klasse(A, "kleriker") ? "Sie sieht das heilige Zeichen und nickt erleichtert." : "",
        "Hinter ihr steht die Magd, bleich, die Schürze voller Korn. Am Feuer hat sich die alte Frau nicht umgedreht.",
        "*Hört euch um, bevor ihr geht. Was ihr hier erfahrt, verändert, was später geschieht. Aber im Speicher wird gefressen: Die Zeit reicht nicht für alle.*",
      ],
      optionen: [
        { id: "was", text: "Hanne fragen, was passiert ist", wer: "Hanne", frage: "„Was ist im Speicher?“", wichtig: true,
          antwort: "„Kröten. So groß wie Hunde. Seit drei Tagen kommen sie aus dem Mühlgraben und fressen unser Korn. Heute sind sie in den Speicher. Wenn das Korn weg ist, wird der Winter lang.“ Sie senkt die Stimme. „Früher haben sie das nie getan. Früher hatten sie Angst vor uns.“" },
        { id: "lene", text: "Die Magd fragen, was sie gesehen hat", wer: "Lene", frage: "Ihr geht zu der Magd. Sie heißt Lene und zittert noch.", wichtig: true,
          antwort: "„Sie waren überall zwischen den Säcken“, sagt sie. Dann packt sie euren Arm. „Mein Bruder. Tebbe. Er ist zwölf. Er ist vorhin zur alten Mühle gelaufen, weil die Katze dort Junge hat, und der Graben … die kommen doch alle aus dem Graben!“ Sie beschreibt euch den Pfad, den Tebbe immer nimmt: hinter den Kopfweiden entlang, wo der Boden fester ist.",
          setzt: { tebbe_bekannt: true }, folge: "Ihr wisst jetzt, dass ein Junge an der Mühle ist – und kennt Tebbes Pfad hinter den Weiden. Der Weg am Graben wird leichter." },
        { id: "lichter", text: "Zu der alten Frau am Feuer gehen", wer: "Mette", frage: "Die alte Frau heißt Mette. Sie zeigt nach Süden, ohne euch anzusehen.", wichtig: true,
          antwort: "„Seht ihr das? Über dem Moor. Lichter, die nicht flackern.“ Ihr seht hin. Weit im Süden, über dem Schwarzmoor, schweben drei kleine, stille Lichter. „Die Kröten fürchten sie“, sagt Mette. „Darum fliehen sie zu uns. Die alte Unke am Wehr hat ihr ganzes Volk hergeführt, weg von dort. Sie ist nicht böse. Sie hat Angst.“ Mette sieht euch zum ersten Mal an. „Was die Unke fürchtet, sollten wir auch fürchten.“",
          setzt: { lichter_gesehen: true }, folge: "Ihr wisst jetzt, warum die Kröten kommen: Sie fliehen vor den Lichtern über dem Moor. Das werdet ihr am Wehr nicht vergessen." },
        { id: "lohn", text: "Nach dem Lohn fragen", wer: "Hanne", frage: "„Und was zahlt ihr?“",
          antwort: "Hanne verschränkt die Arme. Hinter ihr poltert es im Speicher. „Essen, ein Bett und einen Beutel Silber“, sagt sie knapp. „Und hier, damit ihr nicht umsonst blutet.“ Sie drückt euch einen Heiltrank vom Kräuterweib in die Hand. Freundlicher ist ihr Blick dabei nicht geworden.",
          tranke: 1, setzt: { lohn: true }, folge: "Ihr habt einen Heiltrank bekommen. Hanne hat sich gemerkt, dass ihr nach dem Lohn gefragt habt." },
        { id: "spuren", text: "Die Spuren am Speicher lesen (Waldläufer)", wenn: (A, h) => Boolean(h.klasse(A, "waldlaeufer")), frage: "Ihr kniet euch in den Schlamm vor dem Speicher.",
          antwort: "Breite, nasse Abdrücke, die alle vom Mühlgraben kommen. Einer davon ist viel größer als die anderen, und er führt nicht zum Speicher. Er bleibt am Wasser. Was auch immer die anderen anführt, es frisst nicht mit.",
          setzt: { spuren: true }, folge: "Ihr wisst: Am Graben wartet etwas Großes, das die anderen anführt – und selbst kein Korn anrührt." },
        { id: "los", text: "Zum Kornspeicher", weiter: "speicher" },
      ],
    },
    speicher: {
      art: "erzaehlung", abschnitt: 1, titel: "Der Kornspeicher", ort: "Weidenhain", weiter: "kampf_speicher",
      text: [
        "Im Speicher ist es dunkel und warm. Zwischen den Säcken schmatzt und quakt es. Als ihr die Tür aufstoßt, drehen sich glänzende Augen zu euch um.",
        "*Euer erster gemeinsamer Kampf. Wer an der Reihe ist, bewegt sich und greift an. Bleibt zusammen, dann kann niemand allein umzingelt werden.*",
      ],
    },
    kampf_speicher: {
      art: "kampf", abschnitt: 1, titel: "Kröten im Korn", ort: "Der Kornspeicher",
      text: ["Die Kröten sind langsam, aber ihre Zunge reicht zwei Felder weit, auch über Säcke hinweg."],
      kampf: { begegnung: "w_speicher", karte: SPEICHER, keinAnfuehrer: true, sieg: { weiter: "speicher_nach" } },
    },
    speicher_nach: {
      art: "erzaehlung", abschnitt: 1, titel: "Das Loch in der Wand", ort: "Der Kornspeicher", weiter: (A, h) => h.ereignis(A, 1, "wegwahl"), rastErlaubt: true,
      text: (A) => [
        "Die letzte Kröte hüpft durch ein Loch in der Rückwand davon. Dahinter rauscht der Mühlgraben.",
        "Hanne Kalk steht in der Tür und zählt die Säcke. „Das war gut“, sagt sie. „Aber sie kommen wieder, solange wir nicht wissen, woher.“",
        A.merker.spuren ? "↳ Ihr wisst es schon: vom Graben, und dort wartet etwas Größeres, das selbst kein Korn frisst." : "",
        A.merker.tebbe_bekannt ? "↳ Lene steht hinter ihr und sagt nichts. Sie muss nichts sagen. Ihr wisst, wer an der Mühle ist, und ihr wisst, dass jede Viertelstunde zählt."
          : "Da drängt sich die Magd an ihr vorbei, die vorhin geschrien hat. „Mein Bruder“, sagt sie. „Tebbe. Er ist zwölf. Er ist zur Mühle gelaufen, wegen der Katze, und ich habe vor lauter Angst nicht daran gedacht!“ Hanne wird blass. Davon hat ihr niemand etwas gesagt. Euch auch nicht, weil ihr nicht gefragt habt.",
      ],
      beimEintritt: (A) => (A.merker.tebbe_bekannt ? null : { folge: "Erst jetzt erfahrt ihr, dass ein Junge an der Mühle ist. Den sicheren Pfad dorthin kennt ihr nicht." }),
    },
    wegwahl: {
      art: "wahl", abschnitt: 1, titel: "Am Graben entlang?", ort: "Hinter dem Speicher",
      text: (A) => [
        "Der Mühlgraben führt vom Dorf hinaus zur alten Mühle und weiter zum Wehr. Dort kommen die Kröten her, und dort ist Tebbe. Es ist dunkel, und der Weg am Graben ist rutschig.",
        A.merker.tebbe_bekannt ? "↳ Lene hat euch Tebbes Pfad beschrieben: hinter den Kopfweiden, wo der Boden fester ist. Im Dunkeln ist er trotzdem kein Spaziergang." : "",
        "Hanne will euch Fackeln und Laternen holen lassen. Das dauert. „Mit Licht kommt ihr heil an“, sagt sie. Lene sagt: „Bis dahin ist er allein.“",
        "*Eine Abstimmung: Jede Person stimmt ab, die Mehrheit entscheidet. Beides hat seinen Preis.*",
      ],
      optionen: [
        { id: "graben", text: "Sofort am Graben entlang zur Mühle – für Tebbe zählt jede Minute", weiter: "graben" },
        { id: "fackeln", text: "Erst Fackeln und Laternen holen – sicherer Weg, aber Tebbe wartet länger", glocke: 1, setzt: { fackeln: true, tebbe: "verletzt" }, weiter: "fackeln",
          folge: "Ihr habt euch für den sicheren Weg entschieden. Tebbe ist so lange allein." },
      ],
    },
    fackeln: {
      art: "erzaehlung", abschnitt: 1, titel: "Fackeln", ort: "Weidenhain", weiter: "kampf_muehle",
      text: [
        "Das halbe Dorf drückt euch Fackeln und Laternen in die Hände, und das Kräuterweib steckt euch noch einen Trank zu. Der Weg zur Mühle ist hell erleuchtet, und ihr kommt sicher an.",
        "Aber es hat gedauert. Die Kröten haben euer Licht kommen sehen, und aus der Mühle hört ihr eine Kinderstimme, die nicht mehr ruft, sondern nur noch wimmert.",
      ],
      beimEintritt: () => ({ tranke: 1 }),
    },
    graben: {
      art: "probe", abschnitt: 1, titel: "Der rutschige Weg", ort: "Am Mühlgraben",
      text: (A) => [
        "Der Pfad am Graben ist schmal und schlammig. Alle müssen sicher auftreten.",
        A.merker.tebbe_bekannt ? "↳ Ihr haltet euch hinter den Kopfweiden, wie Lene es beschrieben hat. Dort trägt der Boden." : "",
        "*Eine Probe: Jede Person würfelt. Gelingt es der Hälfte, kommt die Gruppe gut durch.*",
      ],
      probe: { name: "Trittsicher", wer: "gruppe", attr: "GES", sg: (A) => (A.merker.tebbe_bekannt ? 8 : 10), geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Ihr kommt leise und schnell zur Mühle. Die Kröten sitzen am Steg und haben euch nicht bemerkt. Oben im Mühlfenster seht ihr ein kleines, blasses Gesicht.", setzt: { ueberraschung: true, tebbe: "heil" }, weiter: "kampf_muehle",
          folge: "Ihr seid rechtzeitig da: Tebbe ist unverletzt, und die Kröten haben euch nicht kommen hören." },
        knapp: { text: "Jemand rutscht in den Graben, ihr zieht ihn heraus. Nass, aber heil. An der Mühle quakt es: Sie wissen, dass ihr kommt. Oben im Mühlfenster duckt sich ein kleines, blasses Gesicht.", setzt: { tebbe: "heil" }, weiter: "kampf_muehle",
          folge: "Ihr seid rechtzeitig da: Tebbe ist unverletzt. Aber die Kröten haben euch gehört." },
        fehl: { text: "Der Schlamm hält euch auf. Zweimal müsst ihr umkehren, weil der Pfad im Wasser endet. Als ihr endlich an der Mühle seid, ist es spät, und aus der Mühle kommt kein Rufen mehr, nur ein Wimmern.", glocke: 1, setzt: { tebbe: "verletzt" }, weiter: "kampf_muehle",
          folge: "Der Graben hat euch zu lange aufgehalten. Tebbe hat es nicht unverletzt überstanden." } },
    },
    kampf_muehle: {
      art: "kampf", abschnitt: 1, titel: "Am Mühlgraben", ort: "Die alte Mühle",
      text: (A) => [
        "Der Graben teilt die Wiese. Nur über den Steg in der Mitte kommt man hinüber. Über dem Wasser tanzt ein kleines Licht.",
        "Drüben, am unteren Ende des Grabens, steht das alte Schleusenbrett offen. Solange es offen ist, steht der Graben voll, und aus dem Wasser kommen immer neue Kröten.",
        A.merker.ueberraschung ? "↳ Ihr seid zuerst da. Die Kröten haben euch noch nicht bemerkt." : "",
        "*Ein Kampf mit einem Ziel: Ihr gewinnt, wenn alle Kröten besiegt sind – oder sobald jemand die Schleuse schließt. Dafür muss eine Figur neben dem Schleusenbrett stehen und zweimal ihre Aktion einsetzen. Die anderen halten ihr so lange den Rücken frei.*",
      ].filter(Boolean),
      kampf: (A) => ({ begegnung: "w_muehle", karte: MUEHLE, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.ueberraschung),
        mechanik: {
          ziele: [{ id: "schleuse", name: "Das Schleusenbrett", art: "schleuse", x: 8, y: 7, runden: 2, aktion: "Schleuse schließen", fertigText: "Das Brett fährt knirschend herunter", wirkung: { welleAus: "graben" } }],
          sieg: { ziele: 1, art: "schleuse", text: "Das Wasser im Graben fällt, als hätte jemand einen Stöpsel gezogen. Die Kröten sitzen plötzlich im Schlamm, sehen sich um und fliehen flussabwärts." },
          wellen: [{ id: "graben", name: "Der Mühlgraben", kurz: "aus dem Graben", quellen: [[8, 2], [8, 5]], gegner: [["schlammkroete", 0.2, 1, 0.3]], alle: 3, ab: 3, max: 2, text: "Im Graben blubbert es" }],
        },
        sieg: { weiter: "muehle_innen" } }),
    },
    muehle_innen: {
      art: "erzaehlung", abschnitt: 1, titel: "In der Mühle", ort: "Die alte Mühle", weiter: "lager",
      text: (A, h) => [
        "Die Mühle steht seit dem Tod des alten Müllers leer. Es riecht nach Staub und altem Mehl. Über euch knarrt eine Diele.",
        A.merker.tebbe === "heil"
          ? "↳ Tebbe klettert vom Mühlboden herunter, eine fauchende Katze im Arm und zwei Junge im Hemd. Er ist unverletzt und redet ohne Punkt und Komma. „Ich hab die Große gesehen! Am Wehr! Sie hat die Kleinen mit der Schnauze weggeschoben, als die Lichter kamen. Die hat sich vor die gestellt. Die hat mehr Angst als ich!“"
          : "↳ Tebbe liegt auf dem Mühlboden, die Katze an sich gedrückt. Eine Zunge hat ihn am Bein erwischt, bevor er die Leiter hochkam; die Wade ist dick und dunkel. Er weint nicht mehr, dazu ist er zu müde. Ihr gebt ihm einen eurer Heiltränke. Er hilft, aber nicht ganz. Was er am Wehr gesehen hat, kann er euch nicht mehr erzählen: Er schläft ein, noch während ihr ihn verbindet.",
        h.stimme(A, "kind"),
      ],
      beimEintritt: (A) => (A.merker.tebbe === "heil"
        ? { folge: "Tebbe hat die alte Unke beobachtet: Sie beschützt ihr Volk vor den Lichtern. Sie hat Angst." }
        : { trankWeg: 1, folge: "Ein Heiltrank ist für Tebbes Bein draufgegangen. Was er am Wehr gesehen hat, erfahrt ihr nicht." }),
    },
    feuer: {
      art: "geheim", abschnitt: 1, titel: "Tebbes Fragen", ort: "Am Feuer in der Mühle", verteilung: false,
      text: (A) => [
        A.merker.tebbe === "heil" ? "Tebbe will alles wissen. Er rutscht von einem zum anderen und stellt jeder Person eine Frage, so direkt, wie nur Kinder fragen. Jedem eine andere."
          : "Tebbe kann vor Schmerzen nicht schlafen. Um nicht an sein Bein zu denken, fängt er an zu fragen, so direkt, wie nur Kinder fragen. Jeder Person etwas anderes.",
        "*Ein Heldenmoment: Jede Person bekommt ihre eigene Frage. Was ihr antwortet, hören danach alle am Feuer.*",
      ],
      frage: (A, h, fid) => h.feuerFrage(fid).frage,
      antworten: (A, h, fid) => h.feuerFrage(fid).antworten,
      abschluss: "Das Feuer brennt herunter. Ihr wisst jetzt mehr voneinander als heute Morgen, und ein Zwölfjähriger hat es aus euch herausgeholt.",
      weiter: "fund",
    },
    fund: {
      art: "geheim", abschnitt: 1, titel: "Die lose Diele", ort: "Die alte Mühle, Nachtwache", verteilung: false,
      text: [
        "Ihr wechselt euch bei der Wache ab. Jede Person tritt in ihrer Stunde irgendwann auf dieselbe lose Diele neben dem Mahlstein. Darunter liegt ein Leinenbeutel, schwer von Münzen. Auf dem Stoff steht mit Kohle ein Name: AGNES.",
        "Agnes ist die Witwe des Müllers. Sie wohnt im Dorf und näht für fremde Leute. Offenbar weiß sie nichts von diesem Versteck.",
        "*Eine geheime Entscheidung: Jede Person steht einen Moment allein vor der Diele. Niemand sieht, was die anderen tun.*",
      ],
      frage: (A, h, fid) => `Die anderen schlafen. Du bist allein mit dem Beutel. ${h.moment(fid, "gold")} Was tust du?`,
      antworten: [
        { id: "nehmen", text: "Ein paar Münzen einstecken. Wer soll es merken?", kurz: "nahm etwas", setzt: (f) => ({ fund_gesehen: true, fund_genommen: true, ["nahm_" + f]: true }) },
        { id: "lassen", text: "Die Diele zurücklegen und schweigen.", kurz: "schwieg", setzt: () => ({ fund_gesehen: true }) },
        { id: "melden", text: "Die anderen rufen: Das gehört der Müllerin.", kurz: "rief die anderen", setzt: (f) => ({ fund_gesehen: true, fund_gemeldet: true, ["zeigte_" + f]: true }) },
      ],
      abschluss: (A, h) => {
        const z = zeiger(A, h);
        if (!z.length) return "Niemand sagt ein Wort. Die Diele liegt wieder an ihrem Platz. Ob jemand etwas genommen hat, weiß nur, wer es getan hat.";
        return `${h.namen(A, z)} ${z.length === 1 ? "ruft" : "rufen"} die anderen zusammen und ${z.length === 1 ? "hebt" : "heben"} die Diele an. „Das gehört der Müllerin.“ Ihr nehmt den Beutel für sie mit.${A.merker.fund_genommen ? " Im Staub neben dem Versteck sind frische Fingerspuren, und der Beutel ist nicht mehr ganz zugebunden. Niemand sagt etwas dazu." : ""}`;
      },
      weiter: "wehr",
    },
    lager: {
      art: "lager", abschnitt: 1, titel: "Am Mühlrad", ort: "Die alte Mühle", weiter: "feuer", aufstieg: 2,
      text: (A) => [
        "In der Mühle ist es trocken. Das Mühlrad knarrt im Wind. Ihr verbindet eure Wunden und teilt das Brot, das Hanne euch mitgegeben hat.",
        A.merker.tebbe === "heil" ? "↳ Tebbe sitzt zwischen euch, die Katzen im Schoß, hellwach vor Aufregung." : "↳ Tebbe liegt neben dem Feuer. Das Bein pocht, und schlafen kann er nicht.",
        A.glocke >= 4 ? "Vom Dorf her ist keine Musik mehr zu hören. Es ist spät geworden." : "Vom Dorf her klingt wieder Musik. Man feiert, weil man euch vertraut.",
        "*Am Lagerfeuer erholt ihr euch ganz und steigt auf Stufe 2 auf. Das Spiel wird hier gespeichert.*",
      ],
    },
    spielmann: {
      art: "geheim", abschnitt: 1, titel: "Der Spielmann", ort: "Am Dorfrand",
      text: (A) => [
        A.merker.unke === "frei" ? "↳ Die Unke gleitet ins Wasser. Eine nach der anderen folgen ihr die kleinen Kröten, den Graben hinab, nach Norden, fort vom Dorf. Am Wehr bleibt nur das Rauschen."
          : "↳ Es ist schnell vorbei. Die kleinen Kröten stieben auseinander, in alle Richtungen, kopflos. Ein paar davon werden wohl wieder im Dorf landen, aber ohne die Alte sind sie nur noch Kröten.",
        "Die Irrlichter sind fort. Ihr holt Tebbe aus der Mühle und geht zurück, müde bis in die Knochen.",
        "Am Dorfrand wartet ein junger Spielmann auf euch, die Fiedel auf dem Rücken. Er heißt Wenzel, er hat vom Mühlenhügel aus zugesehen, und er will ein Lied über euch machen. „Ein ehrliches“, sagt er. „Davon gibt es zu wenige.“",
        "Er fragt jede Person einzeln, leise, damit die anderen es nicht hören: „Warum bist du hier?“",
        "*Eine geheime Entscheidung: Jede Person antwortet für sich. Wenzel vergisst nichts – am Ende singt er, was ihr gesagt habt.*",
      ],
      frage: "„Warum bist du hier?“",
      antworten: [
        { id: "silber", text: "„Für das Silber.“", kurz: "für das Silber", setzt: (f) => ({ ["grund_" + f]: "silber" }) },
        { id: "dorf", text: "„Weil das Dorf Hilfe braucht.“", kurz: "für das Dorf", setzt: (f) => ({ ["grund_" + f]: "dorf", lied: true }) },
        { id: "abenteuer", text: "„Weil ich Abenteuer suche.“", kurz: "für das Abenteuer", setzt: (f) => ({ ["grund_" + f]: "abenteuer", lied: true }) },
      ],
      abschluss: (A) => (A.merker.lied ? "Wenzel grinst und schreibt eifrig. „Daraus wird ein Lied. Mit Namen.“" : "Wenzel seufzt. „Für Silber singt niemand gern. Aber ehrlich ist es. Ich singe es trotzdem, mit Namen.“"),
      weiter: "nach_unke",
    },
    wehr: {
      art: "erzaehlung", abschnitt: 1, titel: "Das alte Wehr", ort: "Hinter der Mühle", weiter: "kampf_unke",
      text: (A) => [
        "Am Wehr staut sich der Mühlteich. Auf den Steinen sitzt die größte Kröte, die ihr je gesehen habt, so groß wie ein Kalb. Die Dörfler nennen sie die alte Unke.",
        "Über ihr schweben Irrlichter, und die Unke duckt sich unter ihnen. Hinter ihr, im flachen Wasser, drängen sich Dutzende kleinere Kröten aneinander.",
        A.merker.lichter_gesehen ? "↳ Ihr denkt an Mettes Worte: Sie ist nicht böse, sie hat Angst. Jetzt seht ihr es selbst. Die Unke sieht nicht zu euch. Sie sieht nach oben, zu den Lichtern." : "",
        A.merker.tebbe === "heil" ? "↳ Es ist genau, wie Tebbe gesagt hat: Sie hat sich vor die Kleinen gestellt." : "",
        !kenntAngst(A) ? "Ihr seht ein riesiges Tier, das euch den Weg versperrt. Mehr wisst ihr nicht über sie." : "",
        "Dann treibt eines der Irrlichter auf euch zu, die Unke fährt herum, und was eben noch Angst war, wird Wut. Sie kennt nur einen Weg, ihr Volk zu schützen.",
        A.merker.lichter_gesehen ? "Weit im Süden, über dem Moor, stehen die stillen Lichter, die Mette euch gezeigt hat. Sie sind näher gekommen." : "",
      ],
    },
    kampf_unke: {
      art: "kampf", abschnitt: 1, titel: "Die alte Unke", ort: "Das alte Wehr",
      text: [
        "Die Unke ist zäh. Die Irrlichter bleiben auf Abstand und werfen kalte Funken: Fernkämpfer und Zauber holen sie herunter.",
        "*Achtet auf die Unke: Wenn sie Luft holt, leuchtet eine Reihe von Feldern rot auf. Dorthin schlägt bei ihrem nächsten Zug die Zunge. Wer bis dahin von den roten Feldern heruntergeht, bleibt unverletzt.*",
      ],
      kampf: { begegnung: "w_unke", karte: WEHR, keinAnfuehrer: true, sieg: { weiter: "unke_schicksal" } },
    },
    unke_schicksal: {
      art: "wahl", abschnitt: 1, titel: "Die Unke am Boden", ort: "Das alte Wehr",
      text: (A, h) => [
        "Das letzte Irrlicht zerstiebt über dem Wasser. Die alte Unke liegt halb auf den Steinen, schwer atmend, zu erschöpft, um die Zunge noch einmal zu heben. Hinter ihr sind die kleinen Kröten verstummt.",
        kenntAngst(A) ? "↳ Ihr wisst, was sie hergetrieben hat. Ohne die Lichter über ihr ist nichts mehr an ihr, das angreift. Sie wartet einfach ab, was ihr tut."
          : "Sie sieht euch an und rührt sich nicht. Ihr wisst nicht, was in so einem Tier vorgeht. Vielleicht sammelt sie nur Kraft.",
        h.stimme(A, "gnade"),
        "Ein Hieb, und Weidenhain ist sie los. Oder ihr tretet zurück und lasst sie ins Wasser gleiten.",
        "*Eine Abstimmung. Was ihr hier tut, bestimmt, was aus dem Wehr wird.*",
      ],
      optionen: [
        { id: "toeten", text: "Es zu Ende bringen. Das Dorf soll sicher sein.", setzt: { unke: "tot" }, weiter: "spielmann",
          folge: (A) => (kenntAngst(A) ? "Ihr habt die alte Unke getötet, obwohl ihr wusstet, dass sie nur Angst hatte." : "Ihr habt die alte Unke getötet. Am Wehr wird es still.") },
        { id: "lassen", text: "Zurücktreten und sie ziehen lassen.", setzt: { unke: "frei" }, weiter: "spielmann",
          folge: (A) => (kenntAngst(A) ? "Ihr habt die alte Unke verschont. Sie führt ihr Volk den Graben hinab, weg vom Dorf und weg von den Lichtern." : "Ihr habt die alte Unke ziehen lassen, ohne zu wissen, was sie tun wird.") },
      ],
    },
    nach_unke: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Bote aus dem Süden", ort: "Weidenhain", weiter: "entscheidung",
      text: (A) => [
        "Über dem Dorf ist der Himmel wieder dunkel, wie er sein soll. Nur ganz im Süden, über dem Schwarzmoor, stehen noch die stillen Lichter.",
        "Auf dem Dorfplatz sitzt ein fremder Junge am Feuer, vielleicht zwölf, schlammverschmiert bis zu den Knien. Er ist die ganze Nacht gelaufen. „Ich komme aus Rabenmoor“, keucht er. „Drei Kinder sind weg. Sie sind den Lichtern ins Moor gefolgt. Und das Dorf will die alte Hedda verbrennen, weil es sagt, sie hat sie gerufen.“",
        A.merker.tebbe === "verletzt" ? "↳ Er ist so alt wie Tebbe. Ihr seht alle kurz zu dem Jungen mit dem verbundenen Bein hinüber." : A.merker.tebbe === "heil" ? "↳ Tebbe, der neben ihm sitzt, schiebt ihm wortlos seine Schale Suppe hin." : "",
        "Er sieht euch an. „Sie sagen, hier sind Leute, die helfen.“",
      ],
    },
    entscheidung: {
      art: "wahl", abschnitt: 1, titel: "Wann brecht ihr auf?", ort: "Weidenhain",
      text: (A) => [
        "Rabenmoor liegt einen halben Tag südlich, mitten im Schwarzmoor. Der Junge will sofort zurück. Hanne sagt, im Dunkeln geht niemand ins Moor, der bei Verstand ist, und dass ihr kaum noch stehen könnt.",
        A.merker.lichter_gesehen ? "↳ Mette sagt nur: „Gestern waren es drei Lichter.“ Ihr zählt nach. Es sind vier." : "",
        "*Eine Abstimmung: die letzte dieser Nacht.*",
      ],
      optionen: [
        { id: "sofort", text: "Sofort aufbrechen, noch in dieser Nacht", setzt: { aufbruch: "nacht" }, weiter: "ende_nacht", folge: "Ihr brecht noch in der Nacht auf. Das Fest findet ohne euch statt." },
        { id: "morgen", text: "Bis zum Morgen bleiben, ausruhen und das Fest zu Ende feiern", setzt: { aufbruch: "morgen" }, weiter: "ende_fest", folge: "Ihr bleibt bis zum Morgen. In Rabenmoor vergeht eine weitere Nacht." },
      ],
    },

    /* ----- Enden ----- */
    ende_nacht: {
      art: "ende", abschnitt: 1, titel: "Aufbruch in der Nacht", ort: "Weidenhain", rueckschau,
      text: (A, h) => [
        "Ihr packt, während das Dorf noch die Tische zurechtrückt. Es wird ein kurzer Abschied, im Stehen, mit vollem Mund.",
        ...epilog(A, h),
        "Das ganze Dorf steht am Weg nach Süden und hält Laternen hoch, bis ihr im Nebel verschwindet. Der Junge aus Rabenmoor geht voraus, so schnell, dass ihr kaum Schritt haltet.",
        "Vor euch liegt das Schwarzmoor. Über dem Wasser schweben stille Lichter, und keines von ihnen flackert.",
        "*Weiter geht es in „Das Moor der stummen Lichter“.*",
      ],
    },
    ende_fest: {
      art: "ende", abschnitt: 1, titel: "Ein Fest für die Retter", ort: "Weidenhain", rueckschau,
      text: (A, h) => [
        "Die Musik spielt wieder, diesmal für euch. Ihr esst, trinkt und sitzt zum ersten Mal an diesem Abend nicht als Fremde am Tisch.",
        ...epilog(A, h),
        "Ihr schlaft ein paar Stunden im Heu. Der Junge aus Rabenmoor schläft neben dem Feuer, aber er wacht immer wieder auf und sieht nach Süden.",
        "Im Morgengrauen brecht ihr auf. Ausgeruht und satt, aber eine Nacht später. Über dem Moor sind es jetzt fünf Lichter.",
        "*Weiter geht es in „Das Moor der stummen Lichter“.*",
      ],
    },
    weidenhain_verloren: {
      art: "ende", abschnitt: 0, titel: "Ein langer Winter", ort: "",
      text: ["Die Kröten fressen den Speicher leer. Weidenhain hungert im Winter, und über dem Moor stehen stille Lichter."],
    },

    /* ----- Zufallsereignisse (Haltepunkt 1: nach dem Speicher) ----- */
    e_ziege: {
      art: "probe", abschnitt: 1, titel: "Die Ziege des Bürgermeisters", ort: "Weidenhain",
      text: ["Die Ziege des Bürgermeisters hat sich losgerissen und rennt quer über den Festplatz, mitten durch die Tische. Jemand muss sie fangen."],
      probe: { name: "Ziege fangen", attr: "GES", sg: 11, geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Ein Sprung, ein Griff, und ihr habt sie. Das ganze Dorf jubelt. Die Ziege kaut zufrieden an eurem Ärmel.", setzt: { ziege: true }, weiter: (A) => A.ereignisZiel, folge: "Die Ziege des Bürgermeisters hat euch ins Herz geschlossen." },
        knapp: { text: "Ihr erwischt sie, nachdem sie zwei Tische umgeworfen hat. Gelächter, aber auch Applaus.", setzt: { ziege: true }, weiter: (A) => A.ereignisZiel, folge: "Die Ziege des Bürgermeisters hat euch ins Herz geschlossen." },
        fehl: { text: "Die Ziege ist schneller als ihr. Bis ein Kind sie mit einem Apfel lockt, ist eine halbe Stunde vergangen.", glocke: 1, weiter: (A) => A.ereignisZiel } },
    },
    e_kraeuterweib: {
      art: "erzaehlung", abschnitt: 1, titel: "Das Kräuterweib", ort: "Weidenhain", weiter: (A) => A.ereignisZiel,
      text: ["Eine alte Frau mit einem Korb voller Kräuter zupft euch am Ärmel. „Für unterwegs“, sagt sie und gibt euch zwei kleine Flaschen. „Und haltet euch vom Licht fern. Nicht vom Feuer. Vom anderen.“"],
      beimEintritt: () => ({ tranke: 2 }),
    },
  };

  const EREIGNISSE = [{ id: "e_ziege", punkte: [1] }, { id: "e_kraeuterweib", punkte: [1] }];
  const WISSEN = {
    schlammkroete: { klassen: ["waldlaeufer"], text: "Ein Tier: Wolfszahn trifft sie härter. Ihre Zunge reicht 2 Felder weit, über Wasser hinweg." },
    alte_unke: { klassen: ["waldlaeufer", "kleriker"], text: "Ein Tier, alt und zäh. Bevor sie mit der Zunge durch eine ganze Reihe schlägt, holt sie eine Runde lang Luft: Die Felder leuchten rot. Wer herausgeht, bleibt heil." },
    irrlicht: { klassen: ["zauberer", "waldlaeufer"], text: "Flink und schwer zu treffen (RK 14): Es wirft kalte Funken über 4 Felder und bleibt auf Abstand. Fernkämpfer und Zauber holen es herunter." },
  };
  const META = {
    id: "weidenhain", schwierigkeit: 1, reihe: -1, einsteiger: true,
    titel: "Das Erntefest von Weidenhain", kurz: "Weidenhain", untertitel: "Ein Einsteiger-Abenteuer am Rand des Schwarzmoors",
    kurztext: "Kröten plündern den Kornspeicher, mitten im Erntefest. Der beste Einstieg in Mythara.",
    ehrentitel: "Retter von Weidenhain", // Kampagnentitel für alle gefundenen Enden (Heldensammlung)
    abschnitte_namen: { 1: "Weidenhain" },
    min: 2, max: 6, stufen: "1–2", dauer: "etwa 1 Stunde", abschnitte: 1, enden: 2,
    // Bilder siehe BILDER-WEIDENHAIN.md (alle eingebaut)
    bild: "img/weidenhain/titel.webp", vorschau: "img/weidenhain/vorschau.webp", abschnittBilder: { 1: "img/weidenhain/abschnitt-1.webp" },
    uhr: { name: "Nacht", symbol: "☾", max: 7, mehr: "Die Nacht schreitet voran.", weniger: "Ihr habt etwas Zeit gewonnen.", unruhe: "das Quaken vom Graben lässt niemanden ganz schlafen", rueckzug: "Die Nacht schreitet voran." },
    gruppe: "Die Retter von Weidenhain", aufbruch: "Zum Erntefest", niederlage: "Ein langer Winter", chronik: "Chronik von Weidenhain",
    einleitung: [
      { eyebrow: "I · Die Splitterlande", titel: "Ein Land aus Scherben", text: ["Vor dreihundert Jahren führten die Magier der alten Fürstentümer einen Krieg, den niemand gewann. Zurück blieben zersplitterte Herrschaften, dichte Wälder und Moore.", "Wer hier lebt, hilft sich selbst. Und wer kämpfen kann, findet immer Arbeit."] },
      { eyebrow: "II · Weidenhain", titel: "Ein Dorf am Moor", text: ["Weidenhain liegt am Nordrand des Schwarzmoors, zwischen Weiden, Feldern und einem alten Mühlgraben. Einmal im Jahr feiert das Dorf die Ernte, mit Feuer, Musik und viel zu viel Bier.", "Ihr seid Fremde, die das Fest angelockt hat. Ihr kennt euch noch nicht. Das wird sich heute Nacht ändern."] },
      { eyebrow: "III · Die Nacht", titel: "Bis Mitternacht", text: ["Seit drei Tagen kommen Kröten aus dem Graben und fressen das Korn. Je länger die Nacht dauert, desto mehr ist verloren.", "Über dem Moor im Süden steht etwas am Himmel, das dort nicht hingehört."] },
    ],
    kodexUhr: { titel: "Die Nacht", text: ["Jeder Umweg und jede kurze Rast lassen die <b>Nacht</b> voranschreiten, bis zu sieben Stunden.", "Je später es wird, desto mehr Korn fressen die Kröten. Wie viel Weidenhain bleibt, erzählt das Ende."] },
    // Hinweise ohne Spoiler auf das Ende, das die Gruppe nicht gesehen hat
    endeHinweise: { ende_nacht: "Ein anderes Ende beginnt damit, dass ihr dem Jungen aus Rabenmoor noch in derselben Nacht folgt.", ende_fest: "Ein anderes Ende beginnt damit, dass ihr dem Dorf noch eine Nacht schenkt." },
    // Ziel-Siegquote je Kampf (Einsteiger: freundlich)
    zielquoten: { kampf_speicher: 0.92, kampf_muehle: 0.88, kampf_unke: 0.94 }, // die Unke bewusst etwas leichter, damit der Kampf nicht über 10 Runden geht
  };
  const API = { META, EREIGNISSE, WISSEN, START: "prolog", NIEDERLAGE: "weidenhain_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.weidenhain = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
