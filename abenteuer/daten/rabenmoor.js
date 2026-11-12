/*
 * Das Moor der stummen Lichter – Szenen (Abschnitt 1: Rabenmoor, Abschnitt 2: Das tiefe Moor)
 * Ein kürzeres Abenteuer für 2–6 Heldinnen und Helden, Stufe 1–2, etwa 1,5 bis 2 Stunden.
 * Aufbau wie daten/grauwacht.js. text: Absätze (Array) oder Funktion (A, h) → Array; h.hat(A, fid), h.klasse(A, k), h.name(A, fid)
 * Die „Uhr“ dieses Abenteuers sind die Lichter über dem Moor (A.glocke, 0–7): Mit jedem Licht schlafen die Kinder tiefer.
 * Karten ohne Bild: Die Hindernisse werden gezeichnet (T Baum/Schilf, Q Wasser, M Stein, K Stumpf). Sobald ein gemaltes
 * Bild da ist, kommt es unter `bild` und die Hindernisse bleiben, wo sie sind (Raster 12 × 9).
 */
(function (root) {
  "use strict";
  const T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y], M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y];
  const reihe = (f, y, von, bis) => Array.from({ length: bis - von + 1 }, (_, i) => f(von + i, y));
  const spalte = (f, x, von, bis) => Array.from({ length: bis - von + 1 }, (_, i) => f(x, von + i));

  /* ---------- Karten (12 × 9) ---------- */
  // Der Bohlenweg: ein Steg aus Planken quer durchs Wasser, links und rechts Inseln mit toten Erlen
  const BOHLENWEG = {
    name: "Der Bohlenweg", b: 12, h: 9, boden: "moor", bild: null,
    hindernisse: [].concat(reihe(Q, 0, 0, 11), reihe(Q, 1, 0, 3), reihe(Q, 1, 7, 11), reihe(Q, 7, 0, 2), reihe(Q, 7, 8, 11), reihe(Q, 8, 0, 11),
      [Q(4, 1), Q(5, 2), Q(6, 2), Q(4, 6), Q(5, 6), Q(6, 7), Q(7, 7), T(1, 2), T(10, 2), T(2, 6), T(9, 6), K(6, 1), K(3, 6)]),
    start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[0, 4], [0, 3], [0, 5], [3, 5]],
      gegner: [[10, 4], [9, 3], [9, 5], [10, 3], [10, 5], [8, 4], [11, 4], [11, 3], [11, 5], [8, 2], [8, 6], [7, 4]] },
  };
  // Das Ried: Schilfinseln, schmale Furten, die Kröten kommen aus dem Wasser
  const RIED = {
    name: "Das Ried", b: 12, h: 9, boden: "moor", bild: null,
    hindernisse: [].concat([T(0, 0), T(1, 0), T(0, 1), T(10, 0), T(11, 0), T(11, 1), T(0, 8), T(11, 8), T(0, 7)],
      [Q(4, 0), Q(5, 0), Q(6, 0), Q(4, 1), Q(5, 1), Q(3, 3), Q(4, 3), Q(5, 4), Q(6, 4), Q(7, 4), Q(8, 5), Q(3, 6), Q(4, 7), Q(5, 7), Q(6, 8), Q(7, 8), Q(9, 2), Q(10, 3)],
      [T(2, 2), T(7, 2), T(8, 7), T(2, 5), T(9, 5), K(6, 6)]),
    start: { spieler: [[1, 4], [1, 5], [2, 4], [1, 3], [2, 6], [1, 6]], wolf: [[0, 4], [0, 5], [2, 3], [0, 3]],
      gegner: [[9, 4], [10, 5], [8, 3], [10, 1], [9, 7], [11, 4], [10, 6], [8, 1], [11, 6], [7, 6], [11, 2], [10, 7]] },
  };
  // Der Totenpfad: ein Damm aus Wurzeln zwischen schwarzen Tümpeln; aus ihnen steigen die Ertrunkenen
  const TOTENPFAD = {
    name: "Der Totenpfad", b: 12, h: 9, boden: "moor", bild: null,
    hindernisse: [].concat(reihe(Q, 0, 0, 11), reihe(Q, 8, 0, 11), [Q(0, 1), Q(1, 1), Q(10, 1), Q(11, 1), Q(0, 7), Q(11, 7)],
      [Q(3, 2), Q(4, 2), Q(3, 3), Q(7, 5), Q(8, 5), Q(8, 6), Q(5, 6), Q(6, 1), Q(9, 3)],
      [T(1, 2), T(10, 6), T(5, 4), M(2, 6), M(9, 2), K(6, 3)]),
    start: { spieler: [[1, 4], [1, 5], [2, 4], [1, 3], [2, 5], [2, 3]], wolf: [[0, 4], [0, 5], [0, 3], [3, 4]],
      gegner: [[10, 4], [9, 5], [10, 3], [8, 3], [10, 5], [7, 2], [9, 7], [11, 4], [7, 7], [11, 3], [6, 6], [11, 5]] },
  };
  // Der versunkene Schrein: ein Ring aus Steinen auf einer Insel, ringsum Wasser, in der Mitte der Altar
  const SCHREIN = {
    name: "Der versunkene Schrein", b: 12, h: 9, boden: "moor", bild: null,
    hindernisse: [].concat(reihe(Q, 0, 0, 11), reihe(Q, 8, 0, 11), spalte(Q, 0, 1, 7), spalte(Q, 11, 1, 7),
      [Q(1, 1), Q(10, 1), Q(1, 7), Q(10, 7), Q(1, 6), Q(10, 2)],
      [M(4, 2), M(7, 2), M(3, 4), M(8, 4), M(4, 6), M(7, 6), K(5, 4), K(6, 4)]),
    start: { spieler: [[5, 7], [6, 7], [4, 7], [7, 7], [3, 7], [8, 7]], wolf: [[2, 7], [9, 7], [3, 6], [8, 6]],
      gegner: [[6, 2], [5, 2], [5, 3], [6, 3], [3, 2], [8, 2], [2, 3], [9, 3], [2, 4], [9, 4], [5, 1], [6, 1]] },
  };
  const KARTEN = { BOHLENWEG, RIED, TOTENPFAD, SCHREIN };

  /* ---------- Hilfen ---------- */
  const kurz = (A) => A.gruppe.length;
  const lebendeVon = (A) => A.gruppe.filter((f) => !A.zust[f].tot);
  /** Kann die Gruppe Alwine erlösen? Sie braucht ihren Namen und jemanden, der für sie spricht */
  const erloesbar = (A) => Boolean(A.merker.alwine_name && (A.merker.hedda_dabei || A.merker.bertold_dabei || A.merker.lied));
  /** Wie viele Kinder kommen nach Hause? Mira nur, wenn nicht zu viele Lichter brennen oder ihre Pfeife sie weckt */
  const miraWacht = (A) => A.glocke < 6 || Boolean(A.merker.pfeife);
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "Über dem Schwarzmoor hängt in dieser Nacht kein einziges Licht. Die Frösche fangen wieder an zu rufen, erst einer, dann alle." : A.glocke <= 5 ? "Ein paar Lichter treiben noch über dem Wasser, schwach und ziellos. Bis zum Morgen sind sie fort." : "Das Moor ist voller Lichter, als ihr zurückkehrt. Sie verlöschen eins nach dem anderen, langsam, als täten sie es ungern.");
    t.push(m.jannik_fenna === "gerettet" ? "Jannik und Fenna schlafen in dieser Nacht im Bett ihrer Eltern, alle vier in einem. Fenna will die ganze Woche nicht allein sein." : "Jannik und Fenna finden die Torfstecher am nächsten Morgen am Rand des Rieds, durchgefroren, aber am Leben. Sie erinnern sich an nichts.");
    t.push(miraWacht(A) ? `Mira wacht in Ilses Armen auf und fragt, warum alle weinen.${m.pfeife ? " Die Pfeife hält sie fest in der Faust und gibt sie nie wieder her." : ""}` : "Mira atmet, aber sie wacht nicht auf. Ilse sitzt jeden Tag an ihrem Bett. Hedda sagt, das Moor gibt zurück, was man ihm lässt, und manchmal braucht es dafür einen Winter.");
    if (m.hedda_ausgeliefert) t.push("Mutter Hedda kommt nie zurück ins Moor. Man sagt, sie lebe jetzt in einer Stadt im Süden und spreche mit niemandem.");
    else if (m.huette_brennt) t.push("Heddas Hütte ist abgebrannt. Die Leute von Rabenmoor bauen sie im Frühjahr neu auf, ohne dass jemand darüber spricht. Hedda nimmt die Hilfe an. Vergeben hat sie nicht.");
    else t.push("Mutter Hedda kommt im Herbst ins Dorf, zum ersten Mal seit fünfzig Jahren. Sie bringt Kräuter für Ilse und setzt sich an den Brunnen, als hätte sie dort immer gesessen.");
    if (m.bertold_gestanden) t.push("Bertold Krähe tritt am Erntefest vor das Dorf und erzählt, was sein Vater getan hat. Er bleibt Schulze. Aber er geht seitdem jeden Sonntag ins Moor und bringt Blumen zum Schrein.");
    else if (m.bertold_schuld) t.push("Bertold Krähe schweigt über das, was ihr wisst. Ihr auch. Im Winter legt er den Schulzenstab nieder, ohne zu sagen, warum.");
    if (A.gefallen.length) t.push(`Auf dem Hügel über Rabenmoor, wo es trocken ist, begrabt ihr ${A.gefallen.map((f) => h.name(A, f)).join(", ")}. Die Kinder bringen jeden Tag Schilfblüten.`);
    return t;
  }

  const SZENEN = {
    /* ================= Abschnitt 1 · Rabenmoor ================= */
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Rabenmoor", ort: "Rabenmoor, Dämmerung", weiter: "dorf",
      text: (A, h) => [
        "Rabenmoor besteht aus zwanzig Häusern auf einer Sandinsel im Schwarzmoor. Torfstapel an jeder Wand, Netze vor jeder Tür. Ein Damm aus Bohlen ist die einzige Straße.",
        "Drei Kinder sind fort. Drei Nächte, drei Kinder. Jedes ist einem Licht gefolgt, das über dem Moor schwebte. Die Lichter machen kein Geräusch. Sie flackern nicht. Sie warten.",
        "Als ihr über den Damm kommt, brennen auf dem Dorfplatz Fackeln. Ein Dutzend Torfstecher, Spaten und Heugabeln in den Händen. Vorne steht ein breiter Mann mit einer Amtskette: Bertold Krähe, der Schulze.",
        "„Die Hexe im Moor“, ruft er. „Die alte Hedda. Sie lockt sie mit ihren Lichtern. Heute Nacht räuchern wir sie aus.“ Die Männer brummen. Eine Frau mit verweinten Augen steht abseits und sagt nichts.",
        kurz(A) <= 2 ? "Ihr seid nur wenige. Aber ihr seid die Einzigen hier, die keine Fackel tragen." : "Ihr seid fremd hier. Aber ihr seid die Einzigen, die keine Fackel tragen.",
      ],
    },
    dorf: {
      art: "gespraech", abschnitt: 1, titel: "Der Dorfplatz", ort: "Rabenmoor",
      beimEintritt: (A, h) => (h.klasse(A, "zauberer") && !A.merker.legende ? { setzt: { legende: "halb" } } : null),
      text: (A, h) => [
        "Die Fackeln knistern. Der Schulze wartet nicht gern, das sieht man ihm an. Noch habt ihr Zeit.",
        h.klasse(A, "zauberer") ? `${h.name(A, h.klasse(A, "zauberer"))} kennt Geschichten über Moorlichter: Irrlichter flackern und summen. Stumme Lichter nicht. Stumme Lichter gehören einer Seele, die keinen Namen mehr hat.` : "",
        A.merker.mob_ruhig ? "Die Männer haben die Fackeln gesenkt. Ein paar sind schon nach Hause gegangen." : "",
      ],
      optionen: [
        { id: "ilse", text: "Die Frau abseits ansprechen", wer: "Ilse", frage: "„Wen habt Ihr verloren?“",
          antwort: "„Mira. Meine Tochter. Acht Jahre.“ Ilse hält etwas in der Hand: eine kleine Weidenpfeife. „Sie pfeift damit, wenn sie Angst hat. Sie hat sie vergessen, in der Nacht. Wenn ihr ins Moor geht … nehmt sie mit. Wenn Mira sie hört, kommt sie vielleicht.“",
          setzt: { pfeife: true } },
        { id: "bertold", text: "Den Schulzen befragen", wer: "Bertold", frage: "„Warum glaubt Ihr, dass es Hedda ist?“",
          antwort: "„Wer sonst? Sie lebt seit fünfzig Jahren allein da draußen. Ihre Schwester war genauso. Hexenbrut.“ Bei dem Wort Schwester zuckt er, als hätte er zu viel gesagt.", setzt: { schwester: true },
          probe: { name: "Menschenkenntnis", attr: "WEI", sg: 12, geuebt: ["kleriker", "inquisitor"], vorteil: (A, h, fid) => (fid === "inquisitor" ? 1 : 0), knapp: true,
            erfolg: { text: "Er hat keine Angst vor Hedda. Er hat Angst vor etwas, das er weiß. Seine Hand liegt auf der Amtskette, als wolle er sie verstecken.", setzt: { bertold_schuld: true } },
            knapp: { text: "Er verbirgt etwas, aber er macht sofort dicht." },
            fehl: { text: "Er starrt euch nur an, bis ihr wegseht." } } },
        { id: "grete", text: "Die alte Frau an der Tür fragen", wer: "Großmutter Grete", frage: "„Ihr seid alt genug, um Euch zu erinnern. Woran?“",
          wenn: (A) => Boolean(A.merker.schwester || A.merker.legende),
          antwort: "Grete zieht euch in den Türschatten. „Hedda hatte eine Schwester. Alwine. Sie konnte nicht sprechen, nie. Als ich ein Mädchen war, verschwand ein Kind im Moor, und die Leute sagten, die Stumme hätte es geholt. Sie haben Alwine mit Fackeln ins Moor getrieben. Der alte Krähe vorneweg. Sie kam nicht zurück.“ Sie bekreuzigt sich. „Das verschwundene Kind kam am nächsten Morgen wieder. Es hatte sich nur verlaufen.“",
          setzt: { alwine_name: true, legende: "ganz" } },
        { id: "spuren", text: "Am Dammende nach Spuren suchen", frage: "Ihr folgt den Spuren der Kinder bis zum Wasser.",
          probe: { name: "Spuren lesen", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], vorteil: (A, h, fid) => (fid === "wildnislaeufer" || fid === "tiergefaehrte" ? 1 : 0), knapp: true,
            erfolg: { text: "Kleine nackte Füße, ruhige Schritte, keine Hast. Sie gehen ins Wasser und kommen nicht zurück. Aber am anderen Ufer, zwischen dem Schilf: dieselben Füße, weiter nach Norden. Zur alten Torfstecherei. Wer das weiß, findet den kürzeren Weg.", setzt: { spur: true } },
            knapp: { text: "Die Spuren führen ins Wasser. Weiter kommt ihr nicht." },
            fehl: { text: "Fackelschein, Matsch, die Stiefel der Torfstecher. Nichts zu erkennen." } } },
        { id: "beruhigen", text: "Die Männer mit den Fackeln beruhigen", wer: "Die Torfstecher", frage: "„Wenn ihr die Hütte anzündet, findet ihr die Kinder nie.“", wenn: (A) => !A.merker.mob_ruhig,
          probe: { name: "Überzeugen", attr: (A, fid) => (fid === "berserker" ? "STR" : "CHA"), sg: 13, geuebt: ["duellant", "trickser", "lichtbringer"], vorteil: (A, h, fid) => (A.merker.bertold_schuld ? 1 : 0), knapp: true,
            erfolg: { text: "Einer nach dem anderen senken sie die Fackeln. „Eine Nacht“, sagt Bertold schließlich. „Ihr habt eine Nacht. Dann gehen wir.“", setzt: { mob_ruhig: true } },
            knapp: { text: "Sie zögern. „Bis zum Morgen“, knurrt Bertold. Ihr wisst nicht, ob er sich daran hält.", setzt: { mob_wartet: true } },
            fehl: { text: "„Fremde haben hier nichts zu sagen.“ Die Fackeln bleiben oben." } } },
        { id: "joost", text: "Den Fährmann am Steg ansprechen", wer: "Joost", frage: "„Kannst du uns ins Moor bringen?“",
          antwort: (A) => A.merker.spur ? "Der alte Joost spuckt ins Wasser. „Zur Torfstecherei? Ich weiß, wo das ist. Ich hab da gestochen, im Frühjahr, auf Befehl des Schulzen. Bis wir den Stein gefunden haben, mit den Zeichen drauf. Seitdem sind die Lichter da.“ Er nickt zum Kahn. „Steigt ein, wenn ihr wollt.“"
            : "„Ins Moor? Bei Nacht?“ Joost schüttelt den Kopf. Dann sieht er die Fackeln und seufzt. „Wenn ihr wisst, wohin, bring ich euch. Aber ich fahr nicht ins Blaue.“",
          setzt: (A) => (A.merker.spur ? { kahn: true, torfstein: true } : { joost_gefragt: true }) },
        { id: "aufbrechen", text: "Ins Moor aufbrechen", weiter: "uferstimme" },
      ],
    },
    uferstimme: {
      art: "geheim", abschnitt: 1, titel: "Am Ufer", ort: "Rand des Schwarzmoors", weiter: "wegwahl",
      text: (A) => [
        "Am Ende des Damms beginnt das Moor. Nebel liegt auf dem Wasser, flach wie ein Tuch. Weit draußen hängt ein Licht. Es bewegt sich nicht.",
        "Und dann hört jede Person, jede für sich, eine Stimme aus dem Wasser. Keine Worte. Ein Summen, ein Kinderlied ohne Melodie. Es klingt einsam.",
        "Jede Person entscheidet auf ihrem Handy für sich.",
      ],
      frage: "Die Stimme summt. Antwortest du ihr?",
      antworten: [
        { id: "antworten", text: "Ich summe leise zurück", setzt: (fid) => ({ ["gehoert_" + fid]: true }) },
        { id: "schweigen", text: "Ich schweige und gehe weiter" },
      ],
      abschluss: (A) => (Object.keys(A.merker).some((k) => k.startsWith("gehoert_")) ? "Wer zurückgesummt hat, spürt eine kalte Hand auf der Schulter, für einen Herzschlag nur. Dann ist das Summen fort. Irgendwo da draußen hat jemand zugehört." : "Das Summen bricht ab. Das Licht draußen wird ein wenig heller, als sei jemand enttäuscht."),
    },
    wegwahl: {
      art: "wahl", abschnitt: 1, titel: "Welcher Weg?", ort: "Rand des Schwarzmoors",
      text: (A, h) => [
        "Der Bohlenweg führt sicher, aber in weitem Bogen nach Norden, über eine Stunde. Das Ried ist kürzer, aber wer dort vom Weg abkommt, steht bis zur Brust im Schlamm.",
        A.merker.kahn ? "Joost wartet mit seinem Kahn am Steg. Er kennt den Weg zur Torfstecherei." : "",
        h.hat(A, "schattenlaeufer") ? "Darian zeigt auf eine Reihe von Grasbuckeln, die wie Trittsteine durchs Ried laufen. Wer leise ist, kommt hier ungesehen durch." : "",
        "Stimmt ab.",
      ],
      optionen: [
        { id: "bohlen", text: "Der sichere Bohlenweg (dauert, ein Licht mehr)", glocke: 1, weiter: "bohlenweg" },
        { id: "ried", text: "Abkürzung durchs Ried", weiter: "ried" },
        { id: "kahn", text: "Mit Joosts Kahn", wenn: (A) => Boolean(A.merker.kahn), setzt: { joost_dabei: true }, weiter: "kahnfahrt" },
      ],
    },
    bohlenweg: {
      art: "erzaehlung", abschnitt: 1, titel: "Der Bohlenweg", ort: "Schwarzmoor", weiter: "kampf_bohlen",
      text: [
        "Die Bohlen sind glitschig und knarren unter jedem Schritt. Links und rechts schwarzes Wasser, so still, dass sich die Sterne darin spiegeln.",
        "Auf halbem Weg sitzt etwas auf den Planken. Groß wie ein Kalb, nass und braun, mit einem Maul, das bis zu den Augen reicht. Hinter ihm schweben kleine Lichter. Diese flackern. Diese summen. Sie haben Hunger.",
      ],
    },
    kampf_bohlen: {
      art: "kampf", abschnitt: 1, titel: "Kampf auf dem Bohlenweg", ort: "Schwarzmoor",
      text: ["Schlammkröten und Irrlichter versperren den Steg. Die Kröten schnappen mit langen Zungen auch über zwei Felder, die Irrlichter werfen kalte Funken aus der Ferne. Das Wasser selbst ist zu tief: Niemand geht hindurch, aber man sieht darüber hinweg."],
      kampf: { begegnung: "moor_rand", karte: BOHLENWEG, sieg: { weiter: "nach_bohlen", tranke: 1 } },
    },
    nach_bohlen: {
      art: "erzaehlung", abschnitt: 1, titel: "Stille", ort: "Schwarzmoor", weiter: (A, h) => h.ereignis(A, 1, "hedda"), rastErlaubt: true,
      text: (A) => [
        "Die Irrlichter zerstieben wie Funken aus einem Feuer. Die letzte Kröte gleitet ins Wasser und taucht nicht wieder auf.",
        "In einer Kröte steckt etwas Glänzendes: ein Heiltrank, noch versiegelt. Wer immer ihn verloren hat, braucht ihn nicht mehr.",
        "Am Ende des Stegs, auf Pfählen über dem Wasser: eine Hütte. Im Fenster brennt eine Kerze.",
      ],
    },
    ried: {
      art: "probe", abschnitt: 1, titel: "Durchs Ried", ort: "Schwarzmoor",
      text: (A) => ["Ihr springt von Buckel zu Buckel. Alle müssen sicher auftreten; gelingt es der Hälfte, helfen die anderen.", A.merker.spur ? "Ihr wisst, wohin die Kinder gegangen sind: Vorteil." : ""],
      probe: { name: "Trittsicher", wer: "gruppe", attr: "GES", sg: 12, geuebt: ["schurke", "waldlaeufer"], vorteil: (A) => (A.merker.spur ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr kommt trocken und schnell durch das Ried. Keine Kröte bemerkt euch.", weiter: "ried_still" },
        knapp: { text: "Jemand rutscht ab, bis zur Hüfte ins Wasser. Ihr zieht ihn heraus, aber es platscht laut. Im Schilf regt sich etwas.", weiter: "kampf_ried" },
        fehl: { text: "Der Schlamm hält euch fest. Bis ihr wieder frei seid, ist es spät, und ein weiteres Licht steht über dem Moor. Dann rascheln die Kröten.", glocke: 1, weiter: "kampf_ried" } },
    },
    ried_still: {
      art: "erzaehlung", abschnitt: 1, titel: "Am Rand des Rieds", ort: "Schwarzmoor", weiter: (A, h) => h.ereignis(A, 1, "hedda"),
      text: ["Hinter dem Schilf liegt eine Hütte auf Pfählen über dem Wasser. Im Fenster brennt eine Kerze. Auf dem Steg davor sitzt eine alte Frau und sieht euch kommen, als hätte sie euch erwartet."],
    },
    kampf_ried: {
      art: "kampf", abschnitt: 1, titel: "Kröten im Ried", ort: "Das Ried",
      text: ["Schlammkröten schieben sich aus dem Wasser, drei, vier, mehr. Zwischen den Schilfinseln liegen tiefe Furten: Wer darüber will, muss außen herum."],
      kampf: { begegnung: "moor_kroeten", karte: RIED, sieg: { weiter: "ried_still" } },
    },
    kahnfahrt: {
      art: "erzaehlung", abschnitt: 1, titel: "Joosts Kahn", ort: "Schwarzmoor", weiter: "hedda",
      beimEintritt: (A) => (A.merker.kahn_gefahren ? null : Object.assign({ setzt: { kahn_gefahren: true } }, A.glocke > 0 ? { glocke: -1 } : {})),
      text: [
        "Joost stakt den Kahn lautlos durch Kanäle, die ihr allein nie gefunden hättet. Einmal hält er an und legt den Finger an die Lippen. Neben dem Boot gleitet ein brauner Rücken vorbei, groß wie ein Kalb.",
        "„Der Stein“, sagt er leise, als ihr weiterfahrt, „lag tief im Torf. Eine Frauenfigur, mit einem Finger auf den Lippen. Der Schulze hat gesagt, wir sollen ihn ins Wasser werfen. Hab ich nicht. Er liegt am Schrein, wo er war.“",
        "Ihr seid schneller als jedes Licht. Eines, weit hinten, erlischt sogar. Am Ende des Kanals: eine Hütte auf Pfählen, im Fenster eine Kerze.",
      ],
    },
    hedda: {
      art: "gespraech", abschnitt: 1, titel: "Mutter Hedda", ort: "Heddas Hütte",
      text: (A, h) => [
        "Mutter Hedda ist kleiner, als ihr gedacht habt, und älter. Ihre Hütte riecht nach getrockneter Minze und nassem Holz. Sie stellt Becher auf den Tisch, ohne zu fragen, ob ihr trinken wollt.",
        "„Ihr kommt aus dem Dorf“, sagt sie. „Mit Fackeln oder ohne?“",
        h.hat(A, "wanderheiler") ? "Brogar sieht die Kräuterbündel unter der Decke: Baldrian, Mohn, Weidenrinde. Nichts davon lockt Kinder ins Moor. Alles davon hilft beim Schlafen. Diese Frau schläft schlecht, seit Jahren." : "",
      ],
      optionen: [
        { id: "lichter", text: "Nach den Lichtern fragen", wer: "Hedda", frage: "„Was sind das für Lichter?“",
          antwort: "„Irrlichter summen. Die hier nicht.“ Sie sieht aus dem Fenster. „Die stummen Lichter gehören jemandem, der ruft, ohne zu sprechen. Jedes Licht ist eine Nacht, in der die Kinder tiefer schlafen. Wenn genug brennen, wachen sie nicht mehr auf.“" },
        { id: "alwine", text: "Nach Alwine fragen", wer: "Hedda", frage: "„Wer war Alwine?“", wenn: (A) => Boolean(A.merker.alwine_name || A.merker.schwester),
          antwort: (A) => `Hedda stellt den Becher ab, sehr vorsichtig. „Meine kleine Schwester. Sie konnte nicht sprechen, aber sie konnte summen, und alle Tiere kamen, wenn sie summte. Das Dorf hatte Angst vor ihr. Als das Kind verschwand, haben sie sie ins Moor getrieben. Zum alten Schrein.“ ${A.merker.alwine_name ? "Ihre Stimme bricht. „Sie ist nicht böse. Sie ist allein. Fünfzig Jahre allein. Und dann haben sie im Frühjahr ihren Stein ausgegraben.“" : "„Alwine“, sagt sie noch einmal, als hätte sie den Namen lange nicht laut gesagt."}`,
          setzt: { alwine_name: true, wahrheit: true } },
        { id: "anklagen", text: "Hedda beschuldigen", wer: "Hedda", frage: "„Ihr wisst mehr, als Ihr sagt. Wo sind die Kinder?“", plus: { hedda_vertrauen: -1 },
          probe: { name: "Einschüchtern", attr: (A, fid) => (fid === "berserker" ? "STR" : "CHA"), sg: 13, geuebt: ["inquisitor", "berserker"], knapp: true,
            erfolg: { text: "Hedda hält eurem Blick stand, dann senkt sie den Kopf. „Beim versunkenen Schrein. Dort, wo meine Schwester ertrunken ist. Ich hätte es dem Dorf sagen sollen. Aber wer hört einer Hexe zu?“", setzt: { schrein_weg: true } },
            knapp: { text: "„Im Moor“, sagt sie kalt. „Wo sonst.“ Mehr bekommt ihr nicht aus ihr heraus." },
            fehl: { text: "Hedda steht auf und öffnet die Tür. „Dann sucht sie allein.“ Sie meint es nicht so. Aber sie sagt nichts mehr." } } },
        { id: "schuetzen", text: "Hedda Schutz versprechen", wer: "Hedda", frage: "„Niemand wird Eure Hütte anzünden. Nicht, solange wir hier sind.“", plus: { hedda_vertrauen: 1 },
          antwort: "Hedda sieht euch lange an. Dann holt sie eine Laterne vom Haken, alt, aus grünem Glas. „Die hat Alwine gehört. Sie zeigt den Weg zum Schrein, wenn man die richtigen Lichter kennt.“", setzt: { laterne: true, schrein_weg: true } },
        { id: "tee", text: "Vom Tee trinken", weiter: "tee", einmal: true },
        { id: "weiter", text: "Den Abend bei Hedda verbringen", weiter: (A) => (A.merker.mob_ruhig ? "lager" : "fackeln") },
      ],
    },
    tee: {
      art: "geheim", abschnitt: 1, titel: "Heddas Tee", ort: "Heddas Hütte", weiter: "hedda",
      text: ["Der Tee ist grün und bitter. „Klarblick“, sagt Hedda. „Wer ihn trinkt, sieht die Lichter, wie sie wirklich sind. Manche wollen das lieber nicht.“", "Jede Person entscheidet auf ihrem Handy für sich."],
      frage: "Trinkst du Heddas Tee?",
      antworten: [
        { id: "trinken", text: "Ich trinke", setzt: (fid) => ({ ["klarblick_" + fid]: true }) },
        { id: "nicht", text: "Ich lasse den Becher stehen" },
      ],
      abschluss: "Wer getrunken hat, sieht draußen über dem Wasser keine Lichter mehr, sondern kleine, frierende Hände, die sich nach etwas ausstrecken.",
    },
    fackeln: {
      art: "wahl", abschnitt: 1, titel: "Fackeln am Ufer", ort: "Heddas Hütte",
      text: (A) => [
        A.merker.mob_wartet ? "Der Schulze hat sein Wort nicht gehalten. Kurz vor Mitternacht leuchten Fackeln am Ufer, ein ganzer Zug, Bertold vorne." : "Kurz vor Mitternacht leuchten Fackeln am Ufer. Die Torfstecher sind gekommen, Bertold vorne.",
        "„Gebt uns die Hexe“, ruft er über das Wasser, „und ihr könnt gehen.“ Hedda steht hinter euch und sagt nichts. Ihre Hände zittern nicht.",
        "Was tut ihr? Stimmt ab.",
      ],
      optionen: [
        { id: "stellen", text: "Sich den Männern in den Weg stellen", weiter: "fackeln_probe" },
        { id: "wahrheit", text: "Bertold vor allen die Wahrheit über Alwine sagen", wenn: (A) => Boolean(A.merker.alwine_name && A.merker.bertold_schuld), weiter: "bertold_wahrheit" },
        { id: "verstecken", text: "Hedda im Schilf verstecken", setzt: { huette_brennt: true, hedda_dabei: true }, weiter: "huette_brennt" },
        { id: "ausliefern", text: "Hedda ausliefern", setzt: { hedda_ausgeliefert: true }, weiter: "ausgeliefert" },
      ],
    },
    fackeln_probe: {
      art: "probe", abschnitt: 1, titel: "Auf dem Steg", ort: "Heddas Hütte",
      text: (A, h) => ["Ihr stellt euch auf den Steg, zwischen die Fackeln und die Hütte. Eine Person spricht für alle. Wer?", h.hat(A, "schildwaechter") ? "Torvald stellt sich einfach vorne hin, den Schild auf den Planken. Manchmal reicht das." : ""],
      probe: { name: "Standhalten", attr: (A, fid) => (fid === "schildwaechter" || fid === "berserker" ? "STR" : "CHA"), sg: 13, geuebt: ["krieger", "duellant"], vorteil: (A) => ((A.merker.hedda_vertrauen || 0) > 0 ? 1 : 0), knapp: true,
        erfolg: { text: "Die Fackeln sinken. „Morgen früh“, sagt Bertold. „Wenn die Kinder dann nicht da sind …“ Er dreht um. Die anderen folgen.", setzt: { mob_ruhig: true, hedda_dabei: true }, weiter: "lager" },
        knapp: { text: "Jemand wirft eine Fackel. Sie landet auf dem Dach. Ihr löscht sie, aber die halbe Hütte ist schwarz. Dann gehen die Männer, beschämt.", setzt: { huette_brennt: true, hedda_dabei: true }, weiter: "lager" },
        fehl: { text: "Die Männer drängen vor. Ihr bringt Hedda ins Schilf, bevor die erste Fackel fliegt. Hinter euch brennt die Hütte.", setzt: { huette_brennt: true, hedda_dabei: true }, glocke: 1, weiter: "huette_brennt" } },
    },
    bertold_wahrheit: {
      art: "erzaehlung", abschnitt: 1, titel: "Was der alte Krähe tat", ort: "Heddas Hütte", weiter: "lager",
      beimEintritt: () => ({ setzt: { bertold_gestanden: true, bertold_dabei: true, mob_ruhig: true, hedda_dabei: true } }),
      text: [
        "Ihr sagt es laut, über das Wasser, damit es alle hören: Alwine. Der Schrein. Der alte Krähe mit der Fackel. Das Kind, das am nächsten Morgen wiederkam.",
        "Die Torfstecher sehen ihren Schulzen an. Bertold steht sehr still. Dann nimmt er die Amtskette ab und hält sie in der Hand, als wüsste er nicht, was er damit soll.",
        "„Mein Vater hat es mir erzählt, als er starb“, sagt er. „Ich habe den Torf am Schrein stechen lassen, damit niemand ihn je findet.“ Er watet ins Wasser, bis zu den Knien, und sieht Hedda an. „Ich komme mit. Wenn sie jemanden will, dann mich.“",
        "Die anderen gehen nach Hause. Bertold bleibt.",
      ],
    },
    huette_brennt: {
      art: "erzaehlung", abschnitt: 1, titel: "Feuer auf dem Wasser", ort: "Im Schilf", weiter: "lager",
      text: (A) => [
        "Die Hütte brennt lichterloh. Das Wasser spiegelt das Feuer, und für einen Moment ist das ganze Moor hell. Hedda sieht zu und sagt kein Wort.",
        "Als die Männer fort sind, sammelt sie, was der Steg übrig gelassen hat: einen Kessel, ein Bündel Kräuter" + (A.merker.laterne ? ", die grüne Laterne." : ". Die Laterne ihrer Schwester ist verbrannt.") ,
        "„Wir rasten hier“, sagt sie. „Im Dunkeln findet ihr den Schrein nicht.“",
      ],
    },
    ausgeliefert: {
      art: "erzaehlung", abschnitt: 1, titel: "Fackeln", ort: "Heddas Hütte", weiter: "lager",
      beimEintritt: () => ({ glocke: 1 }),
      text: [
        "Hedda geht allein über den Steg zu den Männern. Sie dreht sich nicht um.",
        "Bertold packt sie am Arm. Dann zieht der Zug ab, und mit ihm das Licht. Das Moor ist sehr dunkel, als sie fort sind. Draußen über dem Wasser steigt ein neues Licht auf, heller als die anderen.",
        "Ihr findet in der Hütte ein Bündel Decken und genug trockenes Holz für die Nacht.",
      ],
    },
    lager: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer auf dem Steg", ort: "Schwarzmoor", aufstieg: 2, weiter: (A, h) => h.ereignis(A, 2, "lichterweg"),
      text: (A) => [
        A.merker.huette_brennt ? "Ihr macht Feuer auf den verkohlten Planken. Es riecht nach Rauch und Minze." : A.merker.hedda_ausgeliefert ? "Ihr macht Feuer in Heddas leerer Hütte. Ihr Becher steht noch auf dem Tisch." : "Hedda kocht Suppe, und eine Weile ist es fast gemütlich.",
        A.merker.bertold_dabei ? "Bertold sitzt etwas abseits, die Amtskette in der Faust. Er isst nichts." : "",
        A.merker.hedda_dabei && !A.merker.hedda_ausgeliefert ? "Spät in der Nacht summt Hedda leise ein Lied. Ein altes, ohne Worte. „Das hat Alwine immer gesummt“, sagt sie, als sie merkt, dass ihr zuhört. „Wenn ich es ihr vorsumme, erkennt sie mich vielleicht.“" : "",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ].filter(Boolean),
      beimEintritt: (A) => (A.merker.hedda_dabei && !A.merker.hedda_ausgeliefert ? { setzt: { lied: true } } : null),
    },

    /* ================= Abschnitt 2 · Das tiefe Moor ================= */
    lichterweg: {
      art: "raetsel", abschnitt: 2, titel: "Die vier Lichter", ort: "Das tiefe Moor",
      symbol: "laterne", hinweisName: "Heddas Lied", tippText: "Ihr folgt dem Licht",
      text: (A, h) => [
        "Tiefer im Moor teilen sich die Wege. An jeder Gabelung schwebt ein Licht: weiß, grün, blau, golden. Folgt man dem falschen, führt es im Kreis, und die Nacht wird länger.",
        A.merker.laterne ? "Alwines grüne Laterne flackert, als würde sie sich erinnern." : "",
        "Hedda hat euch die Verse ihres Kinderlieds beigebracht. Jede Person kennt einen anderen Vers. Nur zusammen ergibt sich der Weg.",
        h.klasse(A, "waldlaeufer") ? `${h.name(A, h.klasse(A, "waldlaeufer"))} riecht, wo das Wasser frisch ist und wo es steht. Das blaue Licht hängt über frischem Wasser.` : "",
      ],
      glocken: [{ id: "weiss", name: "Weiß", farbe: "#f4f1e6" }, { id: "gruen", name: "Grün", farbe: "#9fe08a" }, { id: "blau", name: "Blau", farbe: "#8fc4ff" }, { id: "gold", name: "Gold", farbe: "#f2d35a" }],
      loesung: ["blau", "weiss", "gruen", "gold"],
      hinweise: [
        "„Wo das Wasser fließt, beginnt der Weg, und blau ist, was fließt.“",
        "„Gold ist das Ende, Gold ist der Schrein, Gold kommt nie vor dem Grün.“",
        "„Das Weiße wartet gleich nach dem Ersten, wie der Mond nach dem Fluss.“",
        "„Grün geht nie voran, Grün folgt immer dem Mond.“",
      ],
      zusatz: { gelehrter: "Lyra kennt das Lied aus einer alten Sammlung: Moorlieder zählen immer von der Quelle bis zum Heiligtum." },
      richtig: "Das goldene Licht steigt auf, bleibt stehen und wartet. Dahinter, zwischen alten Weiden, liegt ein Damm aus Wurzeln.",
      falsch: "Das Licht führt euch im Kreis. Als ihr wieder an der Gabelung steht, schwebt über dem Moor ein Licht mehr.",
      waechter: "verirrt",
      erfolg: { weiter: "totenpfad" },
      aufgeben: { glocke: 1, weiter: "verirrt" },
    },
    verirrt: {
      art: "kampf", abschnitt: 2, titel: "Verirrt", ort: "Das Ried",
      text: ["Ihr seid vom Weg abgekommen und steht zwischen Schilfinseln, die ihr nicht kennt. Aus dem Wasser schieben sich Schlammkröten, angelockt von eurem Lärm."],
      kampf: { begegnung: "moor_kroeten2", karte: RIED, sieg: { weiter: "totenpfad_weg" } },
    },
    totenpfad_weg: {
      art: "erzaehlung", abschnitt: 2, titel: "Der Damm aus Wurzeln", ort: "Das tiefe Moor", weiter: "totenpfad",
      text: ["Hinter den Schilfinseln findet ihr endlich, was ihr gesucht habt: einen Damm aus Wurzeln zwischen schwarzen Tümpeln. Ganz am Ende, weit draußen, ein goldenes Licht."],
    },
    totenpfad: {
      art: "wahl", abschnitt: 2, titel: "Der Totenpfad", ort: "Das tiefe Moor",
      text: (A, h) => [
        "Der Damm ist schmal. Links und rechts Tümpel, schwarz wie Tinte. In einem treibt ein Hut. In einem anderen eine Hand.",
        "Als ihr den ersten Schritt macht, hebt sich das Wasser. Gestalten stehen auf, grau, aufgedunsen, Schilf in den Haaren: die Ertrunkenen des Moors. Hundert Jahre Torfstecher, Wanderer, Verirrte.",
        A.merker.klarblick_gesamt ? "Wer Heddas Tee getrunken hat, sieht ihre Gesichter. Sie sind nicht böse. Sie sind nur kalt." : "",
        h.klasse(A, "kleriker") ? `${h.name(A, h.klasse(A, "kleriker"))} spürt: Diese Toten gehorchen niemandem. Sie suchen nur Wärme. Vielleicht lassen sie sich zur Ruhe singen.` : "",
      ],
      beimEintritt: (A) => (A.gruppe.some((f) => A.merker["klarblick_" + f]) ? { setzt: { klarblick_gesamt: true } } : null),
      optionen: [
        { id: "kampf", text: "Kämpfen", weiter: "kampf_toten" },
        { id: "ruhe", text: "Die Toten zur Ruhe singen", wenn: (A, h) => Boolean(h.klasse(A, "kleriker") || A.merker.lied), weiter: "toten_ruhe" },
      ],
    },
    toten_ruhe: {
      art: "probe", abschnitt: 2, titel: "Ein Lied für die Ertrunkenen", ort: "Der Totenpfad",
      text: (A) => ["Eine Person tritt vor und singt. Ein Gebet, ein Wiegenlied, irgendetwas Warmes.", A.merker.lied ? "Heddas Lied hilft: Vorteil." : ""],
      probe: { name: "Singen", attr: (A, fid) => (["lichtbringer", "wanderheiler", "inquisitor"].includes(fid) ? "WEI" : "CHA"), sg: 13, geuebt: ["kleriker"], vorteil: (A) => (A.merker.lied ? 1 : 0), knapp: true,
        erfolg: { text: "Einer nach dem anderen sinken die Ertrunkenen zurück ins Wasser, still, als hätten sie nur darauf gewartet. Am Damm liegt, was sie bei sich trugen: zwei Heiltränke in einer Ledertasche.", tranke: 2, setzt: { toten_ruhig: true }, weiter: "kinder" },
        knapp: { text: "Die meisten sinken zurück. Ein paar bleiben stehen, die leeren Augen auf euch gerichtet.", naechsterKampf: 0.55, weiter: "kampf_toten" },
        fehl: { text: "Die Stimme versagt. Die Ertrunkenen kommen näher.", weiter: "kampf_toten" } },
    },
    kampf_toten: {
      art: "kampf", abschnitt: 2, titel: "Die Ertrunkenen", ort: "Der Totenpfad",
      text: ["Moorleichen waten aus den Tümpeln, langsam, aber zäh. Über ihnen tanzen Irrlichter. Der Damm ist schmal: Haltet die Linie."],
      kampf: { begegnung: "moor_tote", karte: TOTENPFAD, sieg: { weiter: "kinder" } },
    },
    kinder: {
      art: "probe", abschnitt: 2, titel: "Im Schilf", ort: "Das tiefe Moor",
      text: (A, h) => [
        "Am Ende des Damms, in einer Mulde aus Schilf, liegen zwei Kinder. Ein Junge, ein kleines Mädchen. Jannik und Fenna. Sie atmen, ruhig und tief. Ihre Haut ist kalt.",
        "Mira ist nicht hier. Weiter vorne, zwischen den Weiden, schwebt das goldene Licht.",
        "Jemand muss die beiden wecken, sanft, bevor das Moor sie ganz behält. Wer versucht es?",
        h.hat(A, "wanderheiler") ? "Brogar hat Riechsalz dabei, aus Heddas Kräutern: Vorteil." : "",
      ],
      probe: { name: "Heilkunde", attr: "WEI", sg: 12, geuebt: ["kleriker"], vorteil: (A, h, fid) => (fid === "wanderheiler" || h.hat(A, "wanderheiler") ? 1 : 0), knapp: true,
        erfolg: { text: "Fenna schlägt die Augen auf und fängt sofort an zu weinen. Jannik setzt sich auf und fragt, wo Mira ist. „Die Frau hat sie mitgenommen“, sagt er. „Sie singt nicht. Sie ist traurig.“", setzt: { jannik_fenna: "wach" }, weiter: "kinder_wohin" },
        knapp: { text: "Die beiden wachen auf, aber sie sind schwach und können kaum stehen. Noch ein Licht steigt auf, während ihr sie wärmt.", glocke: 1, setzt: { jannik_fenna: "wach" }, weiter: "kinder_wohin" },
        fehl: { text: "Sie wachen nicht auf. Ihr wickelt sie in Mäntel. Als ihr euch umdreht, schwebt ein weiteres Licht über dem Moor.", glocke: 1, setzt: { jannik_fenna: "schlaf" }, weiter: "kinder_wohin" } },
    },
    kinder_wohin: {
      art: "wahl", abschnitt: 2, titel: "Wohin mit den Kindern?", ort: "Das tiefe Moor",
      text: (A) => [
        "Der Schrein ist nah. Ihr könnt die Kinder nicht mitnehmen, nicht dorthin. Aber hier lassen?",
        A.merker.joost_dabei ? "Joost wartet mit dem Kahn am Ende des Damms." : "",
        A.merker.bertold_dabei ? "Bertold sieht die Kinder an, dann euch. „Ich bringe sie zurück“, sagt er. „Ich kenne den Weg.“" : "",
        A.merker.hedda_dabei && !A.merker.hedda_ausgeliefert ? "Hedda hat ihren Mantel schon ausgezogen." : "",
        "Stimmt ab.",
      ],
      optionen: [
        { id: "joost", text: "Joost bringt sie mit dem Kahn zurück", wenn: (A) => Boolean(A.merker.joost_dabei), setzt: { jannik_fenna: "gerettet" }, weiter: "schrein" },
        { id: "bertold", text: "Bertold bringt sie zurück", wenn: (A) => Boolean(A.merker.bertold_dabei), setzt: { jannik_fenna: "gerettet", bertold_dabei: false, bertold_bringt: true }, weiter: "schrein" },
        { id: "hedda", text: "Hedda bleibt bei ihnen", wenn: (A) => Boolean(A.merker.hedda_dabei && !A.merker.hedda_ausgeliefert), setzt: { jannik_fenna: "gerettet", hedda_bleibt: true }, weiter: "schrein" },
        { id: "verstecken", text: "In Mäntel gewickelt im Schilf lassen", setzt: { jannik_fenna: "versteckt" }, weiter: "schrein" },
      ],
    },
    schrein: {
      art: "gespraech", abschnitt: 2, titel: "Der versunkene Schrein", ort: "Der Schrein der Stummen",
      beimEintritt: (A) => (A.merker.hedda_bleibt ? { setzt: { hedda_dabei: false } } : null),
      text: (A, h) => [
        "Zwischen den Weiden liegt eine Insel, kaum größer als ein Dorfplatz. Ein Ring aus moosigen Steinen, in der Mitte ein Altar. Daneben, halb im Torf: eine Steinfigur, eine Frau mit dem Finger auf den Lippen.",
        "Auf dem Altar liegt Mira und schläft. Neben ihr sitzt ein Mädchen, zwölf vielleicht, durchsichtig wie Nebel, das Haar voller Wasserlinsen. Sie streicht Mira über die Stirn. Sie sieht euch an. Sie sagt nichts.",
        "Um die Insel herum stehen Lichter, Dutzende, still. Es ist kalt.",
        A.glocke >= 6 ? "Mira atmet kaum noch. Zu viele Lichter brennen." : "",
        A.gruppe.some((f) => A.merker["gehoert_" + f]) ? `Das Mädchen sieht ${A.gruppe.filter((f) => A.merker["gehoert_" + f]).map((f) => h.name(A, f)).join(" und ")} an und lächelt. Sie erkennt, wer ihr am Ufer geantwortet hat.` : "",
        A.merker.hedda_dabei ? "Hedda bleibt am Rand der Insel stehen. „Alwine“, flüstert sie." : "",
      ],
      optionen: [
        { id: "name", text: "Sie bei ihrem Namen nennen", wer: "Alwine", frage: "„Alwine.“", wenn: (A) => Boolean(A.merker.alwine_name),
          antwort: "Das Mädchen zuckt zusammen, als hätte sie seit fünfzig Jahren niemand mehr gerufen. Die Lichter flackern. Für einen Moment ist es wärmer.", setzt: { name_gerufen: true }, glocke: -1 },
        { id: "pfeife", text: "Auf Miras Pfeife pfeifen", wer: "Mira", frage: "Ein dünner, heller Ton über dem Wasser.", wenn: (A) => Boolean(A.merker.pfeife),
          antwort: "Mira bewegt sich im Schlaf. Ihre Lippen formen ein Wort: „Mama.“ Alwine sieht auf das Kind hinunter, und ihr Gesicht wird traurig." },
        { id: "stein", text: "Die Steinfigur aus dem Torf heben", wer: "Der Schrein", frage: "Ihr kniet euch in den Schlamm und hebt die Figur.",
          probe: { name: "Kraftakt", attr: "STR", sg: 12, geuebt: ["krieger"], knapp: true,
            erfolg: { text: "Ihr stellt die Figur zurück auf ihren Sockel, wo sie hingehört. Alwine sieht zu und legt den Finger auf die Lippen, wie die Figur. Es sieht aus wie ein Dank.", setzt: { stein_gerichtet: true }, glocke: -1 },
            knapp: { text: "Die Figur steht, aber schief. Alwine sieht sie an und legt den Kopf schräg." },
            fehl: { text: "Der Torf hält sie fest. Ihr rutscht aus, und das Wasser spritzt bis zum Altar." } } },
        { id: "erloesen", text: "Alwine gehen lassen: für sie sprechen", wenn: (A) => erloesbar(A), weiter: "erloesung" },
        { id: "angreifen", text: "Mira mit Gewalt holen", weiter: "kampf_schrein" },
      ],
    },
    erloesung: {
      art: "probe", abschnitt: 2, titel: "Für Alwine sprechen", ort: "Der Schrein der Stummen",
      text: (A, h) => [
        A.merker.hedda_dabei ? "Hedda tritt in den Steinkreis und summt das Lied, das Alwine immer gesummt hat. Ihre Stimme ist alt und brüchig." : A.merker.bertold_dabei ? "Bertold tritt in den Steinkreis, die Amtskette in der Hand. „Mein Vater hat dir das angetan“, sagt er. „Es tut mir leid.“" : "Ihr summt das Lied, das Hedda euch beigebracht hat.",
        "Eine Person muss für Alwine sprechen: ihr sagen, dass sie gehen darf, dass niemand mehr böse ist, dass sie nicht allein bleiben muss. Wer?",
        "Jedes Zeichen, das ihr hier gesetzt habt, hilft: ihr Name, der aufgerichtete Stein, wer am Ufer geantwortet hat oder Heddas Tee getrunken hat.",
      ],
      probe: { name: "Für sie sprechen", attr: (A, fid) => (F_KLERIKER.includes(fid) ? "WEI" : "CHA"), sg: (A) => 15 - (A.merker.name_gerufen ? 1 : 0) - (A.merker.stein_gerichtet ? 1 : 0) - (A.merker.bertold_dabei ? 1 : 0), geuebt: ["kleriker", "duellant", "trickser"],
        vorteil: (A, h, fid) => (A.merker["gehoert_" + fid] || A.merker["klarblick_" + fid] ? 1 : 0), knapp: true,
        erfolg: { text: "Alwine hört zu. Lange. Dann steht sie auf, beugt sich über Mira und haucht ihr auf die Stirn, und das Kind atmet tief ein. Die Lichter steigen auf, alle zugleich, und verlöschen hoch über dem Moor wie Sterne, die man ausbläst.", weiter: "ende_erloest" },
        knapp: { text: "Alwine schwankt. Sie sieht Mira an, dann euch, dann ihre Schwester. Dann schreit sie, ohne Ton, und die Lichter stürzen sich auf euch. Aber sie zögert, und ihr spürt es: Sie will nicht kämpfen.", naechsterKampf: 0.7, weiter: "kampf_schrein" },
        fehl: { text: "Eure Worte erreichen sie nicht. Fünfzig Jahre sind zu lang. Alwine steht auf, und das Wasser um die Insel beginnt zu kochen.", weiter: "kampf_schrein" } },
    },
    kampf_schrein: {
      art: "kampf", abschnitt: 2, titel: "Die Stumme", ort: "Der Schrein der Stummen",
      text: ["Alwine schwebt über dem Altar. Ihre kalte Hand reicht weit, und wenn sie die Wehklage ausstößt, trifft die Kälte alle in einem Kegel vor ihr (WEI-Rettung halbiert). Ertrunkene steigen aus dem Wasser, Irrlichter umkreisen sie. Mira liegt auf dem Altar: Bringt es zu Ende."],
      kampf: { begegnung: "moor_schrein", karte: SCHREIN, keinAnfuehrer: true, beute: false, sieg: { weiter: "ende_besiegt" } },
    },
    ende_erloest: {
      art: "ende", abschnitt: 2, titel: "Der Name im Wasser", ort: "Rabenmoor",
      text: (A, h) => [
        "Als ihr mit Mira zurück ins Dorf kommt, steht ganz Rabenmoor am Damm. Niemand trägt eine Fackel.",
        A.merker.hedda_dabei || A.merker.hedda_bleibt ? "Hedda bleibt noch eine Weile am Schrein. Als sie zurückkommt, hat sie geweint, und sie sieht jünger aus." : "",
        ...epilog(A, h),
        "Am Schrein der Stummen steht jetzt ein neuer Stein. Jemand hat einen Namen hineingeritzt, mit ungelenker Hand: **ALWINE**. Wenn der Wind über das Moor streicht, summt es manchmal. Es klingt nicht mehr einsam.",
      ],
    },
    ende_besiegt: {
      art: "ende", abschnitt: 2, titel: "Stille über dem Moor", ort: "Rabenmoor",
      text: (A, h) => [
        "Alwine zerfließt wie Nebel in der Morgensonne. Ihr letzter Blick gilt nicht euch, sondern Mira. Dann ist sie fort, und mit ihr die Lichter.",
        A.merker.hedda_dabei ? "Hedda kniet am Altar und legt die Hand auf den kalten Stein. „Jetzt ist sie wirklich tot“, sagt sie. Sie sagt es ohne Vorwurf. Das macht es schlimmer." : "",
        ...epilog(A, h),
        "Das Schwarzmoor bleibt still, Jahr um Jahr. Die Kinder von Rabenmoor folgen keinen Lichtern mehr. Aber manchmal, sagt Hedda, wenn sie nachts am Wasser sitzt, fehlt ihr ein Summen.",
      ],
    },
    moor_behaelt: {
      art: "ende", abschnitt: 0, titel: "Das Moor behält euch", ort: "",
      text: ["Über dem Schwarzmoor stehen in dieser Nacht mehr Lichter als je zuvor. Eins davon summt eure Namen."],
    },

    /* ================= Ereignisse (zufällig, je Haltepunkt eins) ================= */
    e_torfstecher: {
      art: "erzaehlung", abschnitt: 1, titel: "Der alte Torfstecher", ort: "Schwarzmoor", weiter: (A) => A.ereignisZiel,
      text: ["Auf einer Torfbank sitzt ein alter Mann und isst Brot, mitten in der Nacht. „Die Lichter holen keine Alten“, sagt er, als wäre das eine Erklärung. Er teilt sein Brot und gibt euch eine Flasche mit trübem Saft. „Gegen die Kälte. Und gegen anderes.“"],
      beimEintritt: () => ({ tranke: 1 }),
    },
    e_schuh: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Kinderschuh", ort: "Schwarzmoor", weiter: (A) => A.ereignisZiel,
      text: ["Im Schilf hängt ein Kinderschuh, rot, viel zu klein. Daneben, in den Schlamm gedrückt, ein Abdruck: barfuß, ruhig, in Richtung Norden. Wer das sieht, weiß, wohin die Kinder gegangen sind."],
      beimEintritt: () => ({ setzt: { spur: true } }),
    },
    e_nebel: {
      art: "probe", abschnitt: 2, titel: "Die Nebelbank", ort: "Das tiefe Moor",
      text: ["Eine Wand aus Nebel rollt über das Wasser, so dicht, dass ihr die eigenen Hände nicht seht. Alle müssen sich zusammenhalten."],
      probe: { name: "Orientierung", wer: "gruppe", attr: "WEI", sg: 11, geuebt: ["waldlaeufer"], knapp: true,
        erfolg: { text: "Ihr haltet euch an den Händen und kommt geschlossen durch.", weiter: (A) => A.ereignisZiel },
        knapp: { text: "Ihr findet euch wieder, aber erst nach langer Suche.", weiter: (A) => A.ereignisZiel },
        fehl: { text: "Als der Nebel sich hebt, ist es später, als es sein dürfte. Ein Licht mehr steht über dem Moor.", glocke: 1, weiter: (A) => A.ereignisZiel } },
    },
    e_fuchs: {
      art: "erzaehlung", abschnitt: 2, titel: "Der Moorfuchs", ort: "Das tiefe Moor", weiter: (A) => A.ereignisZiel,
      text: (A, h) => [
        "Ein Fuchs sitzt auf dem Weg und sieht euch an, rotbraun, mit einem weißen Fleck auf der Stirn. Er läuft ein Stück voraus, dann wartet er.",
        h.hat(A, "tiergefaehrte") ? "Fayes Wolf winselt leise und folgt ihm. Faye nickt: „Er will, dass wir mitkommen.“" : "Ihr folgt ihm. Er führt euch um ein tiefes Loch herum, das ihr im Dunkeln nie gesehen hättet.",
        "Dann ist er fort. Wo er gesessen hat, liegen zwei Heiltränke in einer verrotteten Tasche.",
      ],
      beimEintritt: () => ({ tranke: 2 }),
    },
  };
  // Proben, bei denen Kleriker mit Weisheit statt Charisma sprechen
  const F_KLERIKER = ["lichtbringer", "wanderheiler", "inquisitor"];
  // Die Ereignisse brauchen einen eigenen Rückweg (A.ereignisZiel): Proben-Ergebnisse oben, Erzählungen über „weiter“
  const EREIGNISSE = [{ id: "e_torfstecher", punkte: [1] }, { id: "e_schuh", punkte: [1], wenn: (A) => !A.merker.spur }, { id: "e_nebel", punkte: [2] }, { id: "e_fuchs", punkte: [2] }];
  const WISSEN = {
    irrlicht: { klassen: ["zauberer", "waldlaeufer"], text: "Flink und schwer zu treffen (RK 14): Es wirft kalte Funken über 4 Felder und bleibt auf Abstand. Fernkämpfer und Zauber holen es herunter." },
    schlammkroete: { klassen: ["waldlaeufer"], text: "Ein Tier: Wolfszahn trifft sie härter. Ihre Zunge reicht 2 Felder weit, über Wasser hinweg." },
    moorleiche: { klassen: ["kleriker", "zauberer"], text: "Untot und langsam (4 Felder): Untote vertreiben und strahlende Aura wirken. Wer Abstand hält, wird selten erwischt." },
    alwine: { klassen: ["kleriker", "zauberer", "waldlaeufer"], text: "Ihre kalte Hand reicht 4 Felder. Alle drei Runden stößt sie die Wehklage aus: Kälte im Kegel von 3 Feldern (3W6, WEI-Rettung halbiert). Nicht hintereinander stehen." },
  };
  const META = {
    id: "rabenmoor", titel: "Das Moor der stummen Lichter", kurz: "Rabenmoor", untertitel: "Ein Abenteuer im Schwarzmoor, für kleine und große Gruppen",
    kurztext: "Drei Kinder sind stummen Lichtern ins Moor gefolgt. Das Dorf will die Kräuterfrau verbrennen.",
    abschnitte_namen: { 1: "Rabenmoor", 2: "Das tiefe Moor" },
    min: 2, max: 6, stufen: "1–2", dauer: "1,5–2 Stunden", abschnitte: 2, enden: 4,
    // Bilder (siehe BILDER-RABENMOOR.md): fehlt ein Abschnittsbild, zeigt die Liste die Vorschau des Titelbilds
    bild: "img/rabenmoor/titel.webp", vorschau: "img/rabenmoor/vorschau.webp", abschnittBilder: { 1: "img/rabenmoor/abschnitt-1.webp", 2: "img/rabenmoor/abschnitt-2.webp" },
    uhr: { name: "Lichter", symbol: "✦", klasse: "lichter", max: 7, mehr: "Ein weiteres Licht steigt über dem Moor auf.", weniger: "Ein Licht über dem Moor erlischt.", unruhe: "die Lichter lassen niemanden ganz schlafen", rueckzug: "Ein weiteres Licht steigt auf." },
    gruppe: "Die Retter von Rabenmoor", aufbruch: "Ins Schwarzmoor", niederlage: "Das Moor behält euch", chronik: "Chronik von Rabenmoor",
    einleitung: [
      { eyebrow: "I · Die Splitterlande", titel: "Ein Land aus Scherben", text: ["Vor dreihundert Jahren führten die Magier der alten Fürstentümer einen Krieg, den niemand gewann. Zurück blieben zersplitterte Herrschaften, dichte Wälder und Moore, in denen niemand mehr wohnen will.", "Fast niemand."] },
      { eyebrow: "II · Rabenmoor", titel: "Das Dorf im Schwarzmoor", text: ["Rabenmoor liegt auf einer Sandinsel mitten im Schwarzmoor. Die Leute dort stechen Torf, flechten Körbe und reden nicht viel. Am Rand des Moors lebt seit fünfzig Jahren eine alte Kräuterfrau, Mutter Hedda. Die Kinder dürfen nicht zu ihr."] },
      { eyebrow: "III · Die stummen Lichter", titel: "Drei Nächte, drei Kinder", text: ["Seit drei Nächten schweben Lichter über dem Moor. Sie flackern nicht, sie summen nicht. Jede Nacht ist ein Kind ihnen gefolgt, barfuß, im Schlaf.", "Das Dorf hat einen Schuldigen gefunden. Heute Nacht wollen sie ihre Fackeln anzünden. Ihr kommt gerade noch rechtzeitig."] },
    ],
    kodexUhr: { titel: "Die Lichter", text: ["Jedes Mal, wenn ihr rastet, euch verirrt oder zu lange zögert, steigt über dem Schwarzmoor <b>ein weiteres Licht</b> auf. Sieben können es werden.", "Mit jedem Licht schlafen die verschwundenen Kinder tiefer. Brennen zu viele, wacht eines vielleicht nicht mehr auf. Eine Rast kann euch retten – und kostet trotzdem Zeit."] },
  };
  const API = { META, EREIGNISSE, WISSEN, START: "prolog", NIEDERLAGE: "moor_behaelt", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.rabenmoor = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
