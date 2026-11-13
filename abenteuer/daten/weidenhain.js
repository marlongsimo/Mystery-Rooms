/*
 * Das Erntefest von Weidenhain – Einsteiger-Kurzabenteuer (1 Abschnitt, Stufe 1, 2–6 Helden, etwa 45 Minuten)
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

  /* ---------- Epilog ---------- */
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "Das Korn ist gerettet, fast jeder Sack. Weidenhain wird gut über den Winter kommen." : A.glocke <= 5 ? "Ein Teil des Korns ist verloren. Es wird ein knapper Winter, aber niemand muss hungern." : "Die Kröten haben viel gefressen, bevor ihr sie aufhalten konntet. Weidenhain wird im Winter zusammenrücken müssen.");
    t.push(m.ziege ? "Die Ziege des Bürgermeisters folgt euch bis zum Dorfrand. Sie hat beschlossen, dass ihr jetzt zu ihr gehört." : "");
    t.push(m.lied ? "Der Spielmann hat ein Lied über euch gemacht. Es ist nicht gut, aber alle singen mit." : "");
    if (A.gefallen.length) t.push(`Unter der Dorflinde von Weidenhain liegt jetzt ein Stein mit ${A.gefallen.length === 1 ? "einem Namen" : "Namen"}: ${A.gefallen.map((f) => h.name(A, f)).join(", ")}. Jedes Erntefest legen die Kinder Kränze dazu.`);
    return t.filter(Boolean);
  }

  const SZENEN = {
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Weidenhain", ort: "Am Rand des Schwarzmoors, Abend", weiter: "festplatz",
      text: [
        "Ihr kennt euch kaum. Ihr seid alle aus demselben Grund in Weidenhain: Es ist Erntefest, und wer Arbeit sucht, findet hier welche. Auf dem Dorfplatz brennt ein Feuer, es riecht nach Brot und Bier, und jemand spielt schief auf einer Fiedel.",
        "Dann schreit jemand. Hinter der Scheune poltert es, Säcke fallen, und eine Magd rennt aus dem Kornspeicher, als wäre der Teufel hinter ihr her.",
      ],
    },
    festplatz: {
      art: "gespraech", abschnitt: 1, titel: "Der Dorfplatz", ort: "Weidenhain",
      text: (A, h) => [
        "Die Musik bricht ab. Hanne Kalk, die Bürgermeisterin, eine breite Frau mit Mehl an den Händen, kommt auf euch zu. „Ihr da. Ihr seht aus, als könntet ihr kämpfen. Könnt ihr?“",
        h.klasse(A, "kleriker") ? "Sie sieht das heilige Zeichen und nickt erleichtert." : "",
      ].filter(Boolean),
      optionen: [
        { id: "was", text: "Fragen, was passiert ist", wer: "Hanne", frage: "„Was ist im Speicher?“",
          antwort: "„Kröten. So groß wie Hunde. Seit drei Tagen kommen sie aus dem Mühlgraben und fressen unser Korn. Heute sind sie in den Speicher. Wenn das Korn weg ist, wird der Winter lang.“" },
        { id: "lichter", text: "Die alte Mette nach den Lichtern fragen", wer: "Mette", frage: "Eine alte Frau am Feuer zeigt nach Süden.",
          antwort: "„Seht ihr das? Über dem Moor. Lichter, die nicht flackern.“ Ihr seht hin. Weit im Süden, über dem Schwarzmoor, schweben drei kleine, stille Lichter. „Die Kröten fürchten sie“, sagt Mette. „Darum fliehen sie zu uns. Was die Kröten fürchtet, sollten wir auch fürchten.“",
          setzt: { lichter_gesehen: true } },
        { id: "lohn", text: "Nach dem Lohn fragen", wer: "Hanne", frage: "„Und was zahlt ihr?“",
          antwort: "Hanne verschränkt die Arme. „Essen, ein Bett und einen Beutel Silber. Und das Dorf wird sich an euch erinnern.“ Sie zögert. „Und die Heiltränke vom Kräuterweib. Die sind mehr wert als das Silber.“",
          tranke: 1, setzt: { lohn: true } },
        { id: "spuren", text: "Die Spuren am Speicher lesen (Waldläufer)", wenn: (A, h) => Boolean(h.klasse(A, "waldlaeufer")), frage: "Ihr kniet euch in den Schlamm vor dem Speicher.",
          antwort: "Breite, nasse Abdrücke, die alle vom Mühlgraben kommen. Und einer davon ist viel größer als die anderen. Irgendwo am Graben wartet etwas, das die anderen anführt.",
          setzt: { spuren: true } },
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
        A.merker.spuren ? "Ihr wisst es schon: vom Graben, und dort wartet etwas Größeres." : "",
      ].filter(Boolean),
    },
    wegwahl: {
      art: "wahl", abschnitt: 1, titel: "Am Graben entlang?", ort: "Hinter dem Speicher",
      text: [
        "Der Mühlgraben führt vom Dorf hinaus zur alten Mühle und weiter zum Wehr. Dort kommen die Kröten her. Es ist dunkel, und der Weg am Graben ist rutschig.",
        "*Eine Abstimmung: Jede Person stimmt ab, die Mehrheit entscheidet.*",
      ],
      optionen: [
        { id: "graben", text: "Sofort am Graben entlang zur Mühle", weiter: "graben" },
        { id: "fackeln", text: "Erst Fackeln und Laternen holen (kostet Zeit, dafür Licht)", glocke: 1, setzt: { fackeln: true }, weiter: "fackeln" },
      ],
    },
    fackeln: {
      art: "erzaehlung", abschnitt: 1, titel: "Fackeln", ort: "Weidenhain", weiter: "kampf_muehle",
      text: ["Das halbe Dorf drückt euch Fackeln und Laternen in die Hände. Der Weg zur Mühle ist hell erleuchtet, und ihr kommt sicher an. Aber die Nacht ist weiter fortgeschritten, und die Kröten haben euch kommen sehen."],
      beimEintritt: () => ({ tranke: 1 }),
    },
    graben: {
      art: "probe", abschnitt: 1, titel: "Der rutschige Weg", ort: "Am Mühlgraben",
      text: ["Der Pfad am Graben ist schmal und schlammig. Alle müssen sicher auftreten.", "*Eine Probe: Jede Person würfelt. Gelingt es der Hälfte, kommt die Gruppe gut durch.*"],
      probe: { name: "Trittsicher", wer: "gruppe", attr: "GES", sg: 10, geuebt: ["schurke", "waldlaeufer"], knapp: true,
        erfolg: { text: "Ihr kommt leise und schnell zur Mühle. Die Kröten sitzen am Steg und haben euch nicht bemerkt.", setzt: { ueberraschung: true }, weiter: "kampf_muehle" },
        knapp: { text: "Jemand rutscht in den Graben, ihr zieht ihn heraus. Nass, aber heil. An der Mühle quakt es: Sie wissen, dass ihr kommt.", weiter: "kampf_muehle" },
        fehl: { text: "Der Schlamm hält euch auf. Als ihr endlich an der Mühle seid, ist es spät, und die Kröten warten schon.", glocke: 1, weiter: "kampf_muehle" } },
    },
    kampf_muehle: {
      art: "kampf", abschnitt: 1, titel: "Am Mühlgraben", ort: "Die alte Mühle",
      text: (A) => ["Der Graben teilt die Wiese. Nur über den Steg in der Mitte kommt man hinüber. Über dem Wasser tanzt ein kleines Licht.", A.merker.ueberraschung ? "Ihr seid zuerst da. Die Kröten haben euch noch nicht bemerkt." : ""].filter(Boolean),
      kampf: (A) => ({ begegnung: "w_muehle", karte: MUEHLE, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.ueberraschung), sieg: { weiter: "lager" } }),
    },
    lager: {
      art: "lager", abschnitt: 1, titel: "Am Mühlrad", ort: "Die alte Mühle", weiter: "spielmann",
      text: (A) => [
        "In der Mühle ist es trocken. Das Mühlrad knarrt im Wind. Ihr verbindet eure Wunden und teilt das Brot, das Hanne euch mitgegeben hat.",
        A.glocke >= 4 ? "Vom Dorf her ist keine Musik mehr zu hören. Es ist spät geworden." : "Vom Dorf her klingt wieder Musik. Man feiert, weil man euch vertraut.",
        "*Am Lagerfeuer erholt ihr euch ganz. Das Spiel wird hier gespeichert.*",
      ],
    },
    spielmann: {
      art: "geheim", abschnitt: 1, titel: "Der Spielmann", ort: "Die alte Mühle",
      text: ["Ein junger Spielmann ist euch aus dem Dorf gefolgt. Er will ein Lied über euch machen und fragt jede Person einzeln, leise, damit die anderen es nicht hören: „Warum bist du hier?“", "*Eine geheime Entscheidung: Jede Person antwortet für sich. Die anderen sehen die Antwort nicht.*"],
      frage: "„Warum bist du hier?“",
      antworten: [
        { id: "silber", text: "„Für das Silber.“", setzt: (f) => ({ ["grund_" + f]: "silber" }) },
        { id: "dorf", text: "„Weil das Dorf Hilfe braucht.“", setzt: (f) => ({ ["grund_" + f]: "dorf", lied: true }) },
        { id: "abenteuer", text: "„Weil ich Abenteuer suche.“", setzt: (f) => ({ ["grund_" + f]: "abenteuer", lied: true }) },
      ],
      abschluss: (A) => (A.merker.lied ? "Der Spielmann grinst und schreibt eifrig. „Daraus wird ein Lied.“" : "Der Spielmann seufzt. „Für Silber singt niemand gern. Aber gut.“"),
      weiter: "wehr",
    },
    wehr: {
      art: "erzaehlung", abschnitt: 1, titel: "Das alte Wehr", ort: "Hinter der Mühle", weiter: "kampf_unke",
      text: (A) => [
        "Am Wehr staut sich der Mühlteich. Auf den Steinen sitzt die größte Kröte, die ihr je gesehen habt, so groß wie ein Kalb. Die Dörfler nennen sie die alte Unke.",
        "Über ihr schweben Irrlichter, und die Unke duckt sich unter ihnen, als hätte sie Angst. Dann sieht sie euch, und die Angst wird zu Wut.",
        A.merker.lichter_gesehen ? "Weit im Süden, über dem Moor, stehen die stillen Lichter, die Mette euch gezeigt hat. Sie sind näher gekommen." : "",
      ].filter(Boolean),
    },
    kampf_unke: {
      art: "kampf", abschnitt: 1, titel: "Die alte Unke", ort: "Das alte Wehr",
      text: ["Die Unke ist zäh und ihre Zunge reicht weit. Die Irrlichter bleiben auf Abstand und werfen kalte Funken: Fernkämpfer und Zauber holen sie herunter."],
      kampf: { begegnung: "w_unke", karte: WEHR, keinAnfuehrer: true, namen: { schlammkroete: "Die alte Unke" }, sieg: { weiter: "nach_unke" } },
    },
    nach_unke: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Bote aus dem Süden", ort: "Das alte Wehr", weiter: "entscheidung",
      text: [
        "Die Unke rutscht ins Wasser und taucht nicht wieder auf. Die Irrlichter treiben davon, nach Süden, zum Schwarzmoor.",
        "Als ihr ins Dorf zurückkommt, sitzt ein Junge am Feuer, vielleicht zwölf, schlammverschmiert bis zu den Knien. Er ist die ganze Nacht gelaufen. „Ich komme aus Rabenmoor“, keucht er. „Drei Kinder sind weg. Sie sind den Lichtern ins Moor gefolgt. Und das Dorf will die alte Hedda verbrennen.“",
        "Er sieht euch an. „Sie sagen, hier sind Leute, die gegen Kröten kämpfen können.“",
      ],
    },
    entscheidung: {
      art: "wahl", abschnitt: 1, titel: "Wann brecht ihr auf?", ort: "Weidenhain",
      text: ["Rabenmoor liegt einen halben Tag südlich, mitten im Schwarzmoor. Stimmt ab."],
      optionen: [
        { id: "sofort", text: "Sofort aufbrechen, noch in dieser Nacht", setzt: { aufbruch: "nacht" }, weiter: "ende_nacht" },
        { id: "morgen", text: "Bis zum Morgen bleiben, ausruhen und das Fest zu Ende feiern", setzt: { aufbruch: "morgen" }, weiter: "ende_fest" },
      ],
    },

    /* ----- Enden ----- */
    ende_nacht: {
      art: "ende", abschnitt: 1, titel: "Aufbruch in der Nacht", ort: "Weidenhain",
      text: (A, h) => [
        "Hanne Kalk drückt euch den Beutel Silber in die Hand und sagt nichts. Das ganze Dorf steht am Weg nach Süden und hält Laternen hoch, bis ihr im Nebel verschwindet.",
        ...epilog(A, h),
        "Vor euch liegt das Schwarzmoor. Über dem Wasser schweben stille Lichter, und keines von ihnen flackert.",
        "*Weiter geht es in „Das Moor der stummen Lichter“.*",
      ],
    },
    ende_fest: {
      art: "ende", abschnitt: 1, titel: "Ein Fest für die Retter", ort: "Weidenhain",
      text: (A, h) => [
        "Die Musik spielt wieder, diesmal für euch. Ihr esst, trinkt und schlaft ein paar Stunden im Heu. Der Junge aus Rabenmoor schläft neben dem Feuer, aber er wacht immer wieder auf und sieht nach Süden.",
        ...epilog(A, h),
        "Im Morgengrauen brecht ihr auf. Ausgeruht und satt, aber eine Nacht später. Über dem Moor sind es jetzt vier Lichter.",
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
        erfolg: { text: "Ein Sprung, ein Griff, und ihr habt sie. Das ganze Dorf jubelt. Die Ziege kaut zufrieden an eurem Ärmel.", setzt: { ziege: true }, weiter: (A) => A.ereignisZiel },
        knapp: { text: "Ihr erwischt sie, nachdem sie zwei Tische umgeworfen hat. Gelächter, aber auch Applaus.", setzt: { ziege: true }, weiter: (A) => A.ereignisZiel },
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
    irrlicht: { klassen: ["zauberer", "waldlaeufer"], text: "Flink und schwer zu treffen (RK 14): Es wirft kalte Funken über 4 Felder und bleibt auf Abstand. Fernkämpfer und Zauber holen es herunter." },
  };
  const META = {
    id: "weidenhain", entwurf: true, schwierigkeit: 1, reihe: -1, einsteiger: true,
    titel: "Das Erntefest von Weidenhain", kurz: "Weidenhain", untertitel: "Ein Einsteiger-Abenteuer am Rand des Schwarzmoors",
    kurztext: "Kröten plündern den Kornspeicher, mitten im Erntefest. Der beste Einstieg in Mythara.",
    ehrentitel: "Retter von Weidenhain", // Kampagnentitel für alle gefundenen Enden (Heldensammlung)
    abschnitte_namen: { 1: "Weidenhain" },
    min: 2, max: 6, stufen: "1", dauer: "etwa 45 Minuten", abschnitte: 1, enden: 2,
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
    // Ziel-Siegquote je Kampf (Einsteiger: freundlich)
    zielquoten: { kampf_speicher: 0.92, kampf_muehle: 0.88, kampf_unke: 0.85 },
  };
  const API = { META, EREIGNISSE, WISSEN, START: "prolog", NIEDERLAGE: "weidenhain_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.weidenhain = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
