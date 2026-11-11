/*
 * Das Siegel von Grauwacht – Szenen (Abschnitt 1: Die Abtei, Abschnitt 2: Die Krypta, Abschnitt 3: Das Siegel)
 * Texte nach Abenteuerbuch 0.1 mit den Verbesserungen aus 0.2 (Anselm als tragische Figur, Wennas Vater,
 * Momente der 15 Figuren). Entwurf: Texte werden beim Spielen freigegeben.
 * text: Absätze (Array) oder Funktion (A, h) → Array; h.hat(A, fid), h.m(A, merker), h.name(A, fid)
 */
(function (root) {
  "use strict";
  /** Glockenturm als gemaltes Bild (12 × 9). X = Mauer, Kisten, Pfeiler; P = Treppenauge (versperrt den Weg, nicht die Sicht) */
  const TURM = (() => {
    const X = (x, y) => ["X", x, y], P = (x, y) => ["P", x, y], h = [];
    for (let x = 0; x < 12; x++) h.push(X(x, 0), X(x, 1), X(x, 8));
    for (let y = 2; y < 8; y++) h.push(X(0, y), X(10, y), X(11, y));
    h.push(X(1, 2), X(1, 3), X(2, 2), X(2, 3), X(3, 2), X(4, 2), X(8, 2), X(9, 2), X(9, 3), X(9, 4), X(9, 7), X(4, 7), X(7, 7), P(2, 5), P(3, 5), P(2, 6), P(3, 6));
    return { name: "Der Glockenturm", b: 12, h: 9, bild: "img/welt/glockenturm.webp", hindernisse: h,
      start: { spieler: [[5, 7], [6, 7], [1, 6], [1, 7], [2, 7], [3, 7]], wolf: [[4, 6], [5, 6], [1, 5], [3, 4]],
        gegner: [[8, 3], [8, 4], [8, 5], [8, 6], [9, 5], [9, 6], [7, 2], [6, 2], [5, 2], [7, 3], [3, 3], [8, 7]] } };
  })();
  // Das Glockenseil hängt mitten im Raum: Der Kobold muss es erreichen und eine Runde dort ausharren, bevor er zieht
  const SEIL = { art: "schattenkobold", feld: [6, 4], ereignis: "alarm", nah: 0, warten: true };
  const kurz = (A) => A.gruppe.length;
  // Gruft der Brüder als gemaltes Bild: Steinsärge geben Deckung, Nischen und Pfeiler sind Wand
  const GRUFT = (() => {
    const X = (x, y) => ["X", x, y], h = [];
    for (let x = 0; x < 12; x++) h.push(X(x, 0), X(x, 1));
    for (let y = 2; y < 9; y++) h.push(X(0, y), X(11, y));
    for (const x of [1, 2, 3, 4, 7, 8, 9, 10]) h.push(X(x, 2));
    h.push(X(1, 3), X(1, 4), X(1, 5), X(1, 6), X(1, 7), X(2, 3), X(10, 3), X(10, 4), X(10, 5), X(10, 7), X(9, 3),
      X(3, 3), X(4, 3), X(7, 3), X(8, 3), X(2, 4), X(3, 4), X(4, 4), X(8, 4), X(9, 4), X(2, 6), X(3, 6), X(8, 6), X(9, 6), X(10, 6));
    return { name: "Die Gruft der Brüder", b: 12, h: 9, bild: "img/welt/gruft.webp", hindernisse: h,
      start: { spieler: [[5, 8], [6, 8], [4, 8], [7, 8], [3, 8], [8, 8]], wolf: [[2, 8], [9, 8], [4, 7], [7, 7]],
        gegner: [[5, 3], [6, 3], [5, 4], [6, 4], [2, 5], [9, 5], [4, 5], [7, 5], [5, 2], [6, 2], [3, 5], [8, 5]] } };
  })();
  // Gemalte Karten: Rand und Hindernisse im Bild sind unsichtbar blockiert (X), Gruben versperren nur den Weg (P), Siegelsteine (Z)
  const BX = (x, y) => ["X", x, y], BP = (x, y) => ["P", x, y], BZ = (x, y) => ["Z", x, y];
  const RAND = (oben2) => { const h = []; for (let x = 0; x < 12; x++) { h.push(BX(x, 0), BX(x, 8)); if (oben2) h.push(BX(x, 1)); } for (let y = oben2 ? 2 : 1; y < 8; y++) h.push(BX(0, y), BX(11, y)); return h; };
  const PILZE = {
    name: "Die Pilzkammer", b: 12, h: 9, bild: "img/welt/pilzkammer.webp",
    hindernisse: RAND(false).concat([BX(1, 1), BX(1, 2), BX(1, 3), BX(4, 1), BX(5, 1), BX(1, 4), BX(1, 7), BX(6, 1), BX(7, 1), BX(5, 2), BX(6, 2), BX(4, 3), BX(5, 3),
      BX(7, 4), BX(4, 5), BX(5, 5), BX(6, 5), BX(4, 6), BX(5, 6), BX(9, 2), BX(10, 2), BX(10, 3), BX(10, 4), BX(9, 6), BX(10, 6), BX(9, 7), BX(10, 7)]),
    start: { spieler: [[2, 5], [3, 5], [2, 6], [3, 4], [2, 3], [3, 7]], wolf: [[1, 5], [1, 6], [3, 3], [2, 4]],
      gegner: [[8, 3], [7, 3], [8, 4], [9, 4], [8, 2], [7, 2], [9, 5], [8, 5], [9, 1], [6, 3], [7, 6], [8, 6]] },
  };
  const SCHACHT = {
    name: "Der Schacht", b: 12, h: 9, bild: "img/welt/schacht.webp",
    hindernisse: RAND(false).concat([BP(4, 2), BP(5, 2), BP(6, 2), BP(7, 2), BP(4, 3), BP(5, 3), BP(6, 3), BP(7, 3), BP(4, 4), BP(5, 4), BP(6, 4), BP(7, 4),
      BX(1, 1), BX(1, 2), BX(9, 1), BX(10, 1), BX(10, 2), BX(1, 4), BX(1, 5), BX(1, 6), BX(1, 7), BX(10, 5), BX(10, 6), BX(10, 7)]),
    start: { spieler: [[2, 3], [2, 4], [2, 5], [2, 6], [3, 4], [3, 5]], wolf: [[3, 3], [3, 6], [2, 2], [2, 7]],
      gegner: [[9, 4], [8, 3], [8, 5], [10, 3], [10, 4], [9, 2], [9, 6], [8, 2], [8, 6], [9, 3], [9, 5], [8, 7]] },
  };
  const W = (x, y) => ["M", x, y];
  const HALLE = {
    name: "Die Halle der Asche", b: 12, h: 9, bild: "img/welt/halle.webp",
    hindernisse: RAND(true).concat([BX(1, 2), BX(1, 3), BX(1, 4), BX(1, 5), BX(1, 6), BX(1, 7), BX(2, 2), BX(2, 3), BX(2, 4), BX(3, 2),
      BX(8, 2), BX(9, 2), BX(9, 3), BX(9, 4), BX(10, 2), BX(10, 3), BX(10, 4), BX(10, 5), BX(10, 6), BX(10, 7)]),
    start: { spieler: [[5, 7], [6, 7], [4, 7], [7, 7], [3, 7], [8, 7]], wolf: [[2, 7], [9, 7], [3, 6], [8, 6]],
      gegner: [[6, 2], [4, 3], [7, 3], [5, 2], [7, 2], [4, 2], [3, 3], [8, 3]] },
  };
  const SIEGEL = {
    name: "Die Siegelkammer", b: 12, h: 9, bild: "img/welt/siegelkammer.webp",
    hindernisse: RAND(true).concat([BX(1, 2), BX(1, 3), BX(2, 2), BX(9, 2), BX(10, 2), BX(10, 3), BX(1, 6), BX(1, 7), BX(2, 7), BX(10, 7), BX(5, 3), BX(6, 3), BZ(3, 2), BZ(8, 2), BZ(3, 6), BZ(8, 6)]),
    start: { spieler: [[5, 7], [6, 7], [4, 7], [7, 7], [3, 7], [8, 7]], wolf: [[4, 6], [7, 6], [2, 6], [9, 6]],
      gegner: [[6, 4], [4, 3], [7, 3], [4, 5], [7, 5], [5, 2], [6, 2], [3, 4], [8, 4]] },
  };
  const KARTEN = { TURM, GRUFT, PILZE, SCHACHT, HALLE, SIEGEL };
  const FIG = () => root.ABF || (typeof require === "function" ? require("../js/figuren.js") : null);
  /** Das Angebot aus der Versuchung einer Figur – nur der Teil in Anführungszeichen, der Haken bleibt geheim */
  const versprechen = (fid) => { const v = FIG().FIGUREN[fid].versuchung || ""; const e = v.indexOf("“"); return e > 0 ? v.slice(0, e + 1) : v; };
  const haken = (fid) => { const v = FIG().FIGUREN[fid].versuchung || ""; const e = v.indexOf("“"); return e > 0 ? v.slice(e + 1).trim() : ""; };
  /** Gab es bei der letzten Abstimmung Überstimmte (optional: die für eine bestimmte Option waren)? */
  const minderheit = (A, fuer) => { if (!A.letzteAbstimmung || A.letzteAbstimmung.szene !== A.szene) return false; const st = A.letzteStimmen || {}, gew = A.letzteAbstimmung.gewinner; return Object.values(st).some((o) => o !== gew && (!fuer || o === fuer)); };
  const lebendeVon = (A) => A.gruppe.filter((f) => !A.zust[f].tot);
  const anselmListig = (A) => (A.merker.anselm_vertrauen || 0) < 0 && !A.merker.wahrheit_frueh;
  const nisk_kann = (A) => Boolean(A.merker.nisk_dabei && !A.merker.nisk_fort && !A.merker.nisk_tot && (A.merker.nisk_vertrauen || 0) >= 2);
  /** Ausblick am Ende: der Faden ins nächste Abenteuer */
  const AUSBLICK = {
    waechter: "Valdric ist nicht der Einzige. In der Bibliothek lag eine Karte mit sieben Kreisen aus Silber, über die Splitterlande verteilt. Einer davon ist durchgestrichen. Die anderen nicht.",
    kobold: "Im Sommer bringt ein Kobold einen Brief nach Halmbruck, in krakeliger Schrift: „Der Alte träumt. Er träumt von einem Turm im Norden, wo jemand wie er wartet. Nisk passt auf. Aber ihr solltet nachsehen.“",
    opfer: "Manchmal, kurz vor dem Einschlafen, hört ihr eine vertraute Stimme. Sie sagt immer dasselbe: „Er ist nicht allein. Es gibt sieben Siegel. Findet die anderen, bevor sie brechen.“",
    bruch: "Über den Splitterlanden reißt in dieser Nacht der Himmel einen Spalt weit auf, im Norden, wie eine Narbe aus Licht. Der Splitter in eurem Gepäck summt lauter, wenn ihr ihn in diese Richtung haltet.",
    verrat: "In den Dörfern des Nordens erzählt man bald von einem alten Mönch, der in den Gasthäusern sitzt und Fremde fragt, ob sie eine Glocke gehört haben. Er hat ein Tagebuch bei sich. Und er hat aufgehört zu husten.",
  };
  const ausblick = (art) => "**Ausblick:** " + AUSBLICK[art];
  /** Epilog: was aus Halmbruck, Tam, Wenna, den Kobolden und euch wird */
  function epilog(A, h) {
    const m = A.merker, t = [];
    t.push(A.glocke <= 2 ? "In Halmbruck schmecken die Brunnen wieder süß. Das Vieh steht mit dem Rücken zur Abtei und frisst." : A.glocke <= 5 ? "In Halmbruck wird das Wasser langsam wieder klar. Nicht alle Kühe überstehen den Winter, und manche Kinder schlafen noch lange bei Licht." : "Halmbruck hat die Glocke zu oft gehört. Drei Häuser stehen im Frühjahr leer. Die Leute, die dort wohnten, sind eines Nachts zur Abtei hinaufgegangen und nicht zurückgekommen.");
    if (m.halmbruck_gewarnt) t.push("Die Kinder haben die Nächte in der Kirche verbracht, dicht aneinander, und keines ist zur Abtei hinaufgegangen. Wenna sagt, das war eure Warnung.");
    if (m.tam_heimlich) t.push(`Tam erzählt jedem, der es hören will, wer ihn aus dem Netz geschnitten hat, als alle anderen gegangen waren: ${h.name(A, m.tam_heimlich)}.`);
    if (m.tam_pferd) t.push(m.tam_gerettet ? "Ihr gebt Tam sein Holzpferd zurück. Er sagt nichts. Er hält es nur fest, die ganze Nacht." : "Das Holzpferd stellt ihr seiner Mutter ins Fenster, neben die Kerze.");
    if (m.kobold_freund) t.push("Ein Kobold mit einem verheilten Bein sitzt manchmal am Waldrand und sieht den Kindern zu. Er tut niemandem etwas.");
    if (m.tam_gerettet) t.push("Tam ist wieder bei seiner Mutter. Er spricht nicht oft über die Abtei. Aber manchmal, wenn es still ist, legt er den Kopf schief, als würde er auf etwas lauschen, das nicht mehr da ist.");
    else if (m.tam_zurueck) t.push("Auf dem Rückweg kommt ihr am Schacht vorbei. Das Netz ist leer. Ihr sagt Tams Mutter, dass ihr ihn nicht gefunden habt. Es ist nicht ganz gelogen.");
    else t.push("Tam wird nie gefunden. Seine Mutter stellt jeden Abend eine Kerze ins Fenster.");
    if (m.medaillon) t.push("Ihr gebt Wenna das Medaillon. Sie öffnet es, sieht das Kinderbild, ihr eigenes, und schließt es wieder. „Danke“, sagt sie. Mehr nicht. Am nächsten Tag geht sie mit einer Schaufel zur Abtei, um ihren Vater nach Hause zu holen.");
    else if (m.vater_gefunden) t.push("Ihr sagt Wenna, wo ihr Vater liegt. Sie nickt nur. Ihr hattet ihr nichts versprochen, und ihr bringt ihr nichts mit.");
    else if (m.wenna_versprechen) t.push("Wenna fragt nicht nach ihrem Vater. Sie sieht euch an, und ihr schüttelt den Kopf. Sie wartet weiter, wie sie zwanzig Jahre gewartet hat.");
    if (A.glocke >= 7) t.push("Der Dorfbrunnen von Halmbruck bleibt bitter. Für immer. Die Kinder lernen früh, nicht daraus zu trinken.");
    if (m.blutschuld) t.push("Die Kobolde vergessen nicht. Im Winter verschwinden in Halmbruck Hühner, dann Schafe. An eine Tür hat jemand mit Kreide ein kleines Gesicht gemalt, mit zu vielen Zähnen.");
    else if (m.kobolde_friedlich || m.nisk_frei || nisk_kann(A)) t.push("Die Kobolde ziehen tiefer in die Hügel. Manchmal finden die Kinder von Halmbruck kleine Geschenke am Waldrand: einen glatten Stein, eine Feder, einen Knopf.");
    if (A.gefallen.length) t.push(`Ihr begrabt ${A.gefallen.map((f) => h.name(A, f)).join(", ")} auf dem Hügel über Halmbruck, mit Blick auf die Abtei.`);
    for (const fid of A.gruppe) if (m["pakt_" + fid] && !A.zust[fid].tot && m.hueter !== fid && m.verrat_opfer !== fid) t.push(`**${h.name(A, fid)}** hat Ja gesagt, unten im Flüstern. Valdric hält sein Wort: ${versprechen(fid)} ${haken(fid)}`);
    return t;
  }
  /** Anselms Tagebuch – der Ton hängt davon ab, wie ihr ihm begegnet seid */
  function TAGEBUCH(A) {
    let t = "„Ich bin der letzte Hüter. Das Siegel unter Grauwacht hält den, der einmal unser Abt war. Aber es hält nur, solange ein Lebender bei ihm wacht, und es nimmt sich, was es braucht: jeden Tag ein wenig von dem, der wacht. Vierzig Jahre. Ich habe keine Kraft mehr. Ich habe die Glocke geläutet, weil ich nicht fragen konnte. Wie fragt man jemanden, ob er an meiner Stelle sterben will?“";
    if (A.merker.anselm_durchschaut) t += " Ihr hattet recht: Er hat gelogen. Aber nicht aus dem Grund, den ihr dachtet.";
    if ((A.merker.anselm_vertrauen || 0) < 0) t += " Ihr habt ihn hart angefasst. Jetzt wisst ihr, was er getragen hat. Ob das etwas ändert, entscheidet ihr selbst.";
    if (A.merker.vater_gefunden) t += " Auf der letzten Seite, in anderer Tinte: „Jorek wollte mich befreien. Ich habe ihn nicht aufgehalten. Das werde ich mir nie verzeihen.“";
    return t;
  }

  const SZENEN = {
    /* ================= Abschnitt 1 · Die Abtei ================= */
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Halmbruck", ort: "Halmbruck, Abenddämmerung", weiter: "halmbruck",
      // Drei Einstiege, ausgelost: Söldner (mehr Vorräte, Anselm misstraut), Pilger (Anselm vertraut), Verwandte (Wennas Geschichte)
      beimEintritt: (A) => {
        if (A.merker.einstieg) return null;
        const e = ["soeldner", "pilger", "verwandt"][Math.floor(A.r() * 3)];
        return e === "soeldner" ? { setzt: { einstieg: e }, plus: { anselm_vertrauen: -1 }, tranke: A.gruppe.length }
          : e === "pilger" ? { setzt: { einstieg: e }, plus: { anselm_vertrauen: 1 } }
          : { setzt: { einstieg: e, wenna_versprechen: true } };
      },
      text: (A, h) => [
        A.merker.einstieg === "soeldner" ? "*Ihr seid Söldner.* Wenna hat euch bezahlt, gut bezahlt, mit dem Geld des ganzen Dorfes. Jede Person trägt einen zusätzlichen Heiltrank. Aber nicht alle hier trauen Leuten, die für Geld kommen."
          : A.merker.einstieg === "pilger" ? "*Ihr seid Pilger* auf dem Weg nach Süden, und der Regen hat euch hierher getrieben. Niemand hat euch gerufen. Vielleicht vertraut man euch gerade deshalb."
          : "*Ihr seid Verwandte.* Wenna Hald ist eure Base. Sie hat euch geschrieben, mit zitternder Hand. Ihr Vater ist vor zwanzig Jahren zur Abtei hinaufgegangen. Ihr habt ihr versprochen, nach ihm zu suchen.",
        "Seit sieben Nächten läutet die Glocke der Abtei Grauwacht. Niemand lebt dort mehr.",
        "Halmbruck liegt geduckt im Nieselregen. An jede Tür hat jemand ein Kreidezeichen gemalt. Das Vieh steht auf den Weiden mit dem Kopf zur Abtei und brüllt, wenn es dunkel wird. Die Brunnen schmecken bitter, seit die Glocke läutet.",
        "Am Dorfbrunnen wartet Wenna Hald, die Vorsteherin, eine Laterne in der Hand. Etwas abseits, auf einer nassen Bank, sitzt ein alter Mönch, den Mantel bis zum Kinn gezogen. Er hustet, als ihr näher kommt, und dreht sich weg.",
        "„Ihr seid gekommen“, sagt Wenna. „Gut. Der Junge der Webers ist seit zwei Tagen fort. Tam. Zwölf Jahre alt. Er ist hinauf zur Abtei, das wissen wir. Er ist nicht zurückgekommen.“",
      ],
    },
    halmbruck: {
      art: "gespraech", abschnitt: 1, titel: "Am Brunnen", ort: "Halmbruck", rastErlaubt: false,
      beimEintritt: (A, h) => (h.hat(A, "wanderheiler") && !A.merker.anselm_durchschaut ? { setzt: { anselm_durchschaut: true } } : null),
      text: (A, h) => [
        "Wenna hält die Laterne höher. Der Mönch auf der Bank heißt Bruder Anselm, sagt sie. Er ist der Letzte, der noch weiß, wie es unter der Abtei aussieht.",
        h.hat(A, "wanderheiler") ? `Brogar sieht, was die anderen übersehen: Anselm drückt ein Tuch auf den Mund, und das Tuch ist rot. Dieser Mann ist nicht nur alt. Er stirbt.` : "",
        "Fragt, was ihr wissen wollt. Dann brecht auf.",
      ],
      optionen: [
        { id: "tam", text: "Wenna nach Tam fragen", wer: "Wenna", frage: "„Was ist mit Tam geschehen?“", antwort: (A, h) => `„Ein stiller Junge. Er hat geträumt, nachts, von einer Glocke unter der Erde. Er hat es seiner Mutter erzählt, und am nächsten Morgen war sein Bett leer.“${h.hat(A, "wildnislaeufer") ? " Kael kniet sich an den Weg zur Abtei: kleine, nackte Fußspuren, gleichmäßig, ohne Zögern. Der Junge ist nicht geflohen und nicht verschleppt worden. Er ist im Schlaf gegangen." : ""}`, setzt: (A, h) => (h.hat(A, "wildnislaeufer") ? { tam_schlaf: true } : {}) },
        { id: "vater", text: "Wenna nach der Abtei fragen", wer: "Wenna", frage: "„Was weißt du über die Abtei?“", antwort: (A, h) => `Wenna schweigt einen Moment. „Mein Vater ist vor zwanzig Jahren hinaufgegangen. Er sagte, er wolle etwas zu Ende bringen. Er kam nicht zurück.“ Sie sieht zu Anselm hinüber, und ihr Blick ist nicht freundlich.${h.hat(A, "kopfgeldjaeger") ? " Orin kennt den Namen. Jorek Hald. Vor zwanzig Jahren hing sein Steckbrief in jeder Stadt am Fluss: gesucht, weil er ein Siegel brechen wollte." : ""}`, setzt: (A, h) => (h.hat(A, "kopfgeldjaeger") ? { vater_steckbrief: true } : {}) },
        { id: "versprechen", text: "Wenna versprechen, ihren Vater zu finden", wer: "Wenna", frage: "„Wir finden deinen Vater.“", wenn: (A) => (A.gewaehlt.halmbruck || []).includes("vater"), setzt: { wenna_versprechen: true }, antwort: "„Wenn ihr ihn findet …“ Sie bricht ab. „Dann bringt mir etwas von ihm zurück. Irgendetwas.“" },
        { id: "anselm_freundlich", text: "Bruder Anselm freundlich ansprechen", wer: "Anselm", frage: "„Bruder, was erwartet uns dort oben?“", plus: { anselm_vertrauen: 1 }, antwort: "Anselm sieht euch lange an. „Die Abtei ist leer, bis auf das, was in den Mauern wohnt. Käfer. Kobolde. Schlimmeres darunter.“ Er hustet. „Ich führe euch bis zum Tor. Weiter gehe ich nicht. Nicht mehr.“ Er sagt nicht, warum die Glocke läutet. Ihr habt das Gefühl, dass er es weiß." },
        { id: "anselm_hart", text: "Bruder Anselm hart befragen", wer: "Anselm", frage: "„Du verschweigst etwas. Warum läutet die Glocke?“", plus: { anselm_vertrauen: -1 },
          probe: { name: "Menschenkenntnis", attr: "WEI", sg: 13, geuebt: ["inquisitor", "kleriker"], vorteil: (A, h, fid) => (fid === "inquisitor" ? 1 : 0), knapp: true,
            erfolg: { text: "Er lügt. Nicht aus Bosheit – aus Scham. Er weiß, warum die Glocke läutet, und er hat Angst davor, es zu sagen.", setzt: { anselm_durchschaut: true } },
            knapp: { text: "Er weicht aus, und ihr spürt, dass da mehr ist. Aber er macht dicht." },
            fehl: { text: "Anselm schweigt. Wenna nickt grimmig, als hätte sie nichts anderes erwartet." } } },
        { id: "spuren", text: "Die Spuren am Dorfrand untersuchen", frage: "Ihr sucht am Dorfrand nach Spuren.",
          probe: { name: "Wahrnehmung", attr: "WEI", sg: 10, geuebt: ["waldlaeufer"], vorteil: (A, h, fid) => (fid === "wildnislaeufer" ? 1 : 0), knapp: true,
            erfolg: { text: "Zwischen den Kuhspuren: kleine, krallige Füße, viele. Kobolde. Sie kommen nachts aus Richtung Abtei und gehen wieder. Wer das weiß, kommt leiser an ihnen vorbei.", setzt: { spuren: true } },
            knapp: { text: "Kleine Fußabdrücke, zu viele, um sie zu zählen. Was sie gemacht hat, könnt ihr nicht sagen." },
            fehl: { text: "Matsch, Regen, Kuhmist. Nichts, was euch weiterhilft." } } },
        { id: "brunnen", text: "Am bitteren Brunnen innehalten", weiter: "brunnen", einmal: true },
        { id: "aufbrechen", text: "Zur Abtei aufbrechen", weiter: "weg" },
      ],
    },
    brunnen: {
      art: "geheim", abschnitt: 1, titel: "Der bittere Brunnen", ort: "Halmbruck", weiter: "halmbruck",
      text: (A, h) => [
        "Das Wasser im Brunnen ist schwarz und still. Es riecht nach nassem Stein und nach etwas Älterem.",
        h.hat(A, "wanderheiler") ? "Brogar schnuppert daran und runzelt die Stirn. Das ist kein Gift. Das ist ein Fluch, und er ist nicht stark. Noch nicht." : "",
        "Jede Person entscheidet für sich, auf ihrem Handy. Niemand sieht, was die anderen tun.",
      ],
      frage: "Trinkst du vom bitteren Wasser?",
      antworten: [
        { id: "trinken", text: "Ich trinke", setzt: (fid) => ({ ["wasser_" + fid]: true }) },
        { id: "nicht", text: "Ich lasse es" },
      ],
      abschluss: "Ihr tretet vom Brunnen zurück. Wer getrunken hat, schmeckt Asche auf der Zunge, und für einen Herzschlag hört er eine Glocke, tief unter der Erde.",
    },
    weg: {
      art: "erzaehlung", abschnitt: 1, titel: "Der Weg hinauf", ort: "Der Pfad zur Abtei", weiter: "garten",
      text: (A, h) => [
        "Der Pfad windet sich durch kahle Buchen den Hang hinauf. Anselm geht voraus, langsam, auf einen Stock gestützt. Niemand spricht.",
        "Am Tor der Abtei bleibt er stehen. Das Holz ist schwarz vor Alter, ein Flügel hängt schief in den Angeln. Dahinter: der Klostergarten, Grabsteine im hohen Gras.",
        A.merker.anselm_vertrauen > 0 ? "„Passt auf euch auf“, sagt er leise. „Und … verzeiht mir.“ Bevor ihr fragen könnt, was er meint, hat er sich umgedreht." : "„Bis hierhin“, sagt er. Er setzt sich auf einen Stein neben dem Tor und sieht euch nicht nach.",
        h.klasse(A, "waldlaeufer") ? `${h.name(A, h.klasse(A, "waldlaeufer"))} hebt die Hand. Im Gras: Kriechspuren, breit wie ein Unterarm, und Rostflocken an den Halmen. „Sie liegen zwischen den Gräbern und warten. Wir kommen von der Seite.“` : "",
        "Im Gras raschelt es. Etwas Rostbraunes schiebt sich zwischen den Gräbern hervor.",
      ],
    },
    garten: {
      art: "kampf", abschnitt: 1, titel: "Der Klostergarten", ort: "Abtei Grauwacht",
      text: ["Rostkäfer, groß wie Hunde, kriechen aus dem Moos. Ihre Fühler zittern, als sie das Metall eurer Rüstungen riechen."],
      kampf: (A, h) => ({ begegnung: "garten", ueberraschung: Boolean(h.klasse(A, "waldlaeufer")), sieg: { weiter: "garten_danach", tranke: Math.ceil(kurz(A) / 2) } }),
    },
    garten_danach: {
      art: "erzaehlung", abschnitt: 1, titel: "Zwischen den Gräbern", ort: "Klostergarten", weiter: (A, h) => h.ereignis(A, 1, "turm"), rastErlaubt: true,
      beimEintritt: () => ({ setzt: { schluessel: true } }),
      text: (A) => [
        "Die letzten Käfer zucken im Gras. Zwischen den Grabsteinen findet ihr, was frühere Besucher zurückgelassen haben: " + Math.ceil(kurz(A) / 2) + (Math.ceil(kurz(A) / 2) === 1 ? " Heiltrank" : " Heiltränke") + " in einem verrotteten Beutel und einen rostigen Schlüssel mit dem Zeichen der Abtei.",
        "Über euch, im Glockenturm, flackert ein Licht. Dann ein Kichern, hoch und hastig. Jemand ist dort oben.",
      ],
    },
    turm: {
      art: "wahl", abschnitt: 1, titel: "Der Glockenturm", ort: "Abtei Grauwacht",
      text: (A, h) => [
        "Die Tür zum Turm steht offen. Eine Wendeltreppe, dann ein weiter Raum unter der Glocke. Ihr hört sie, bevor ihr sie seht: Schattenkobolde, ein halbes Dutzend oder mehr, um eine Laterne gekauert. Das Glockenseil hängt mitten im Raum. Es ist neu, aus Leder geflochten.",
        A.merker.spuren ? "Ihr wisst, woher sie nachts kommen. Ihr wisst, wo sie nicht hinsehen." : "",
        "Wie geht ihr vor? Stimmt ab.",
      ],
      optionen: [
        { id: "angreifen", text: "Angreifen", weiter: "turm_kampf" },
        { id: "verhandeln", text: "Mit ihnen reden", weiter: "turm_verhandeln" },
        { id: "schleichen", text: "Anschleichen und überraschen", weiter: "turm_schleichen" },
        { id: "taeuschen", text: "Silra: „Der Abt schickt uns.“", wenn: (A, h) => h.hat(A, "trickser"), weiter: "turm_taeuschen" },
        { id: "lautlos", text: "Vex: Den Kobold am Seil lautlos ausschalten", wenn: (A, h) => h.hat(A, "assassine"), weiter: "turm_lautlos" },
      ],
    },
    turm_verhandeln: {
      art: "probe", abschnitt: 1, titel: "Verhandlung im Turm", ort: "Glockenturm",
      text: (A, h) => ["Eine Person führt das Wort. Wer?", h.hat(A, "berserker") ? "Ragnar kann es auch mit Drohungen versuchen (Stärke statt Charisma)." : ""],
      probe: { name: "Überzeugen", attr: (A, fid) => (fid === "berserker" ? "STR" : "CHA"), sg: 13, geuebt: ["duellant", "trickser"], knapp: true,
        erfolg: { text: "Die Kobolde ducken sich. Einer, der Älteste, spricht: Der Alte im Keller schickt ihnen Träume. Er will, dass die Glocke läutet. Sie haben Angst vor ihm. Sie lassen euch vorbei.", setzt: { kobolde_friedlich: true }, plus: { nisk_vertrauen: 1 }, weiter: "nisk" },
        knapp: { text: "Sie stieben auseinander, die Treppe hinunter in die Tiefe – und einer reißt im Vorbeilaufen am Seil.", glocke: 1, weiter: "nisk" },
        fehl: { text: "Ein Kobold kreischt. Messer blitzen.", weiter: "turm_kampf" } },
    },
    turm_taeuschen: {
      art: "probe", abschnitt: 1, titel: "Silras Lüge", ort: "Glockenturm",
      text: ["Silra tritt vor, als gehöre ihr der Turm. „Der Abt schickt uns. Er ist unzufrieden mit euch.“"],
      probe: { name: "Täuschen", attr: "CHA", sg: 13, geuebt: ["trickser"], vorteil: (A, h, fid) => (fid === "trickser" ? 1 : 0), knapp: true,
        erfolg: { text: "Die Kobolde werfen sich auf den Boden. Sie glauben es. Sie verraten euch, dass der Alte im Keller ihnen Träume schickt, und dass einer von ihnen den Weg nach unten kennt.", setzt: { kobolde_friedlich: true }, plus: { nisk_vertrauen: 2 }, weiter: "nisk" },
        knapp: { text: "Sie zögern, tuscheln – und rennen dann doch. Einer reißt am Seil.", glocke: 1, weiter: "nisk" },
        fehl: { text: "„Lügnerin!“ Messer blitzen.", weiter: "turm_kampf" } },
    },
    turm_schleichen: {
      art: "probe", abschnitt: 1, titel: "Leise die Treppe hinauf", ort: "Glockenturm",
      text: (A) => ["Alle müssen leise sein. Jede Figur würfelt; gelingt es der Hälfte, gelingt es allen.", A.merker.spuren ? "Ihr kennt ihre Wege: Vorteil." : ""],
      probe: { name: "Schleichen", wer: "gruppe", attr: "GES", sg: 13, geuebt: ["schurke"], vorteil: (A) => (A.merker.spuren ? 1 : 0), knapp: true,
        erfolg: { text: "Niemand hört euch. Die Kobolde drehen sich erst um, als es zu spät ist.", weiter: "turm_kampf_ueberrascht" },
        knapp: { text: "Eine Stufe knarrt. Die Kobolde springen auf – aber ihr seid schon da.", weiter: "turm_kampf" },
        fehl: { text: "Ein Helm schlägt gegen die Wand. Kreischen von oben.", weiter: "turm_kampf" } },
    },
    turm_lautlos: {
      art: "probe", abschnitt: 1, titel: "Vex im Schatten", ort: "Glockenturm",
      text: ["Vex verschwindet in den Schatten der Treppe. Ein Kobold sitzt direkt am Seil."],
      probe: { name: "Heimlichkeit", attr: "GES", sg: 13, geuebt: ["assassine"],
        erfolg: { text: "Vex ist hinter ihm, bevor er atmet.", weiter: "turm_lautlos_wahl" },
        fehl: { text: "Der Kobold sieht ihn im letzten Moment. Kreischen.", weiter: "turm_kampf" } },
    },
    turm_lautlos_wahl: {
      art: "wahl", abschnitt: 1, titel: "Ein Atemzug", ort: "Glockenturm",
      text: ["Vex hat die Klinge am Hals des Kobolds. Es wäre leicht. Stimmt ab."],
      optionen: [
        { id: "betaeuben", text: "Betäuben", weiter: "turm_kampf_still" },
        { id: "toeten", text: "Töten", setzt: { blutschuld: true }, weiter: "turm_kampf_still" },
      ],
    },
    turm_kampf: {
      art: "kampf", abschnitt: 1, titel: "Kampf im Glockenturm", ort: "Glockenturm",
      text: ["Ein Kobold rennt zur Treppe hinauf, zum Glockenseil. Haltet ihn auf, bevor er Alarm schlägt!"],
      kampf: { begegnung: "kobolde", karte: TURM, skalaMal: 1.4, laeufer: SEIL, sieg: { weiter: "nisk" } },
      ereignisse: { alarm: { glocke: 1, notiz: "Der Kobold hat am Seil gezogen. Die Glocke dröhnt über das Land." } },
    },
    turm_kampf_ueberrascht: {
      art: "kampf", abschnitt: 1, titel: "Überfall im Glockenturm", ort: "Glockenturm",
      text: ["Ihr seid über ihnen, bevor sie die Messer ziehen. Trotzdem: Einer rennt zum Seil."],
      kampf: { begegnung: "kobolde", karte: TURM, skalaMal: 1.4, ueberraschung: true, laeufer: SEIL, sieg: { weiter: "nisk" } },
      ereignisse: { alarm: { glocke: 1, notiz: "Der Kobold hat am Seil gezogen. Die Glocke dröhnt über das Land." } },
    },
    turm_kampf_still: {
      art: "kampf", abschnitt: 1, titel: "Stille im Glockenturm", ort: "Glockenturm",
      text: ["Am Seil steht niemand mehr. Die anderen Kobolde merken es erst, als ihr mitten unter ihnen seid."],
      kampf: { begegnung: "kobolde", karte: TURM, skalaMal: 1.4, ueberraschung: true, sieg: { weiter: "nisk" } },
    },
    nisk: {
      art: "wahl", abschnitt: 1, titel: "Nisk", ort: "Glockenturm",
      text: (A) => [
        A.merker.kobolde_friedlich ? "Die Kobolde sind fort, die Treppe hinunter. Nur einer ist geblieben: der Jüngste, mit dem Bein im Glockenseil verheddert." : "Die Kobolde sind tot oder geflohen. Nur einer ist noch da: der Jüngste, das Bein im Glockenseil verheddert.",
        "„Nisk“, sagt er, als ihr näher kommt. „Ich heiße Nisk. Nicht töten. Bitte. Nisk kennt den Weg nach unten. Den geheimen. Nisk zeigt ihn euch.“",
        "Er zittert. Er könnte lügen. Er könnte euch in eine Falle führen. Stimmt ab.",
      ],
      optionen: [
        { id: "mitnehmen", text: "Mitnehmen", setzt: { nisk_dabei: true }, plus: { nisk_vertrauen: 1 }, weiter: (A) => (minderheit(A) ? "nisk_heimlich" : "nisk_folge") },
        { id: "gefesselt", text: "Mitnehmen, aber gefesselt", setzt: { nisk_dabei: true, nisk_gefesselt: true }, weiter: (A) => (minderheit(A) ? "nisk_heimlich" : "nisk_folge") },
        { id: "freilassen", text: "Freilassen", setzt: { nisk_frei: true }, weiter: (A) => (minderheit(A) ? "nisk_heimlich" : "nisk_folge") },
        { id: "toeten", text: "Töten", setzt: { blutschuld: true, nisk_tot: true }, weiter: (A) => (minderheit(A) ? "nisk_heimlich" : "nisk_folge") },
      ],
    },
    nisk_folge: {
      art: "erzaehlung", abschnitt: 1, titel: "Nisk", ort: "Glockenturm", weiter: "kreuzgang", rastErlaubt: true,
      text: (A, h) => {
        if (A.merker.nisk_tot) return [
          "Es geht schnell. Danach ist es sehr still im Turm.",
          h.hat(A, "lichtbringer") ? "Elara spricht ein Gebet über dem kleinen Körper. Ihre Stimme bricht beim letzten Wort." : "",
          "Niemand sieht den anderen an, als ihr die Treppe hinuntersteigt.",
        ];
        if (A.merker.nisk_frei) return ["Ihr löst das Seil. Nisk starrt euch an, als verstünde er nicht. Dann ist er weg, die Treppe hinunter, ein Schatten unter Schatten.", "Vielleicht seht ihr ihn wieder."];
        if (A.merker.nisk_gefesselt) return ["Ihr bindet ihm die Hände mit einem Stück Seil. Er wehrt sich nicht. Er sagt nichts mehr. Aber er beobachtet euch."];
        return ["Ihr löst das Seil von seinem Bein. Nisk reibt sich den Knöchel, sieht euch an und grinst plötzlich, ein Grinsen mit zu vielen Zähnen.", "„Gut. Gute Leute. Nisk merkt sich das.“"];
      },
    },
    kreuzgang: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer im Kreuzgang", ort: "Abtei Grauwacht", aufstieg: 2, weiter: (A, h) => h.ereignis(A, 2, "abstieg"),
      text: (A, h) => [
        "Im Kreuzgang, zwischen eingestürzten Bögen, macht ihr Feuer. Der Regen hat aufgehört. Über euch der Turm, schwarz gegen die Wolken.",
        A.merker.nisk_dabei ? (A.merker.nisk_vertrauen >= 2 ? "Nisk hockt am Feuer und wärmt sich die Hände. „Der Alte im Keller flüstert“, sagt er leise. „Jede Nacht. Er verspricht. Er verspricht allen etwas. Auch euch, bald.“" : A.merker.nisk_vertrauen >= 1 ? "Nisk hockt etwas abseits. Als ihr ihn fragt, was unten wartet, sagt er nur: „Der Alte. Er flüstert.“" : "Nisk sitzt gefesselt im Dunkeln. Er spricht nicht. Einmal glaubt ihr, ihn lachen zu hören.") : "",
        "Ihr schlaft unruhig. Kurz vor Morgengrauen schlägt die Glocke einmal. Niemand ist im Turm. Niemand hat am Seil gezogen.",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    /* ================= Abschnitt 2 · Die Krypta ================= */
    abstieg: {
      art: "wahl", abschnitt: 2, titel: "Der Abstieg", ort: "Abteikirche",
      text: (A, h) => [
        "Die Abteikirche ist kalt. Durch die zerbrochenen Fenster fällt graues Morgenlicht auf Bänke, die niemand mehr benutzt. Hinter dem Altar führt eine Treppe nach unten. Von dort kommt ein Geruch nach nassem Stein und altem Wachs.",
        A.merker.nisk_dabei ? "Nisk zupft euch am Ärmel und zeigt auf einen Spalt in der Wand neben dem Altar, den ihr ohne ihn nie gesehen hättet. „Kurzer Weg“, flüstert er. „Kobold-Weg. Pilze. Aber keine toten Brüder.“" : "",
        !A.merker.nisk_dabei && h.hat(A, "schattenlaeufer") ? "Darian fährt mit der Hand über die Wand neben dem Altar. Ein kühler Luftzug. Hier ist ein Spalt, schmal, von Kobolden ausgetreten." : "",
        !A.merker.nisk_dabei && !h.hat(A, "schattenlaeufer") && h.klasse(A, "waldlaeufer") ? `${h.name(A, h.klasse(A, "waldlaeufer"))} kniet am Altar. Kleine Fußspuren im Staub, viele, alle in dieselbe Richtung: in die Wand hinein. Dahinter ein Spalt, schmal, von Kobolden ausgetreten.` : "",
        "Welchen Weg nehmt ihr?",
      ],
      optionen: [
        { id: "treppe", text: "Die Treppe in die Gruft der Brüder", setzt: { weg_gruft: true }, weiter: "gruft" },
        { id: "spalt", text: "Durch den Spalt, den Schmugglerpfad", wenn: (A, h) => A.merker.nisk_dabei || h.hat(A, "schattenlaeufer") || Boolean(h.klasse(A, "waldlaeufer")), setzt: { weg_pfad: true }, weiter: "pfad" },
      ],
    },
    /* ----- Weg A: Die Gruft der Brüder ----- */
    gruft: {
      art: "wahl", abschnitt: 2, titel: "Die Gruft der Brüder", ort: "Krypta",
      text: (A, h) => [
        "Die Treppe endet in einem langen Gewölbe. Steinsärge in Reihen, in den Wänden Nischen mit Gebeinen, jede mit einer Grabplatte. Am Ende des Gewölbes hängen vier kleine Glocken an einem Joch aus schwarzem Holz.",
        "Als ihr den ersten Schritt macht, knirscht es in den Nischen. Knochen schieben sich übereinander. Die Brüder von Grauwacht stehen auf.",
        h.hat(A, "lichtbringer") ? "Elara spürt, dass in diesen Toten kein Hass ist. Nur ein Befehl, den niemand zurückgenommen hat." : "",
      ],
      optionen: [
        { id: "kampf", text: "Kämpfen", weiter: "gruft_kampf" },
        { id: "segnen", text: "Elara: die Toten segnen", wenn: (A, h) => h.hat(A, "lichtbringer"), weiter: "gruft_segnen" },
      ],
    },
    gruft_segnen: {
      art: "probe", abschnitt: 2, titel: "Ein Segen für die Brüder", ort: "Gruft der Brüder",
      text: ["Elara tritt den Knochenwächtern entgegen, das Symbol erhoben, und spricht die alten Worte für die Toten."],
      probe: { name: "Segen", attr: "WEI", sg: 13, geuebt: ["lichtbringer"], knapp: true,
        erfolg: { text: "Einer nach dem anderen senken die Knochenwächter ihre Klingen und legen sich in ihre Nischen zurück. Auf der vordersten Platte leuchtet ein Name auf: Coldric.", setzt: { gruft_ruhig: true, coldric_name: true }, weiter: "gruft_raetsel" },
        knapp: { text: "Die meisten legen sich nieder. Zwei nicht.", setzt: { gruft_halb: true }, weiter: "gruft_kampf_klein" },
        fehl: { text: "Die Worte verhallen. Die Toten kommen näher.", weiter: "gruft_kampf" } },
    },
    gruft_kampf: {
      art: "kampf", abschnitt: 2, titel: "Kampf in der Gruft", ort: "Gruft der Brüder",
      text: ["Knochenwächter schieben sich aus den Nischen. Ihre Schwerter sind rostig, aber scharf. Wuchtige Waffen zerschlagen sie leichter."],
      kampf: (A) => ({ begegnung: "gruft", karte: KARTEN.GRUFT, sieg: { weiter: "gruft_raetsel" } }),
    },
    gruft_kampf_klein: {
      art: "kampf", abschnitt: 2, titel: "Zwei, die nicht ruhen", ort: "Gruft der Brüder",
      text: ["Zwei Knochenwächter bleiben stehen. Ihr Befehl ist stärker als jeder Segen."],
      kampf: (A) => ({ begegnung: "gruft", skala: 0.45, karte: KARTEN.GRUFT, sieg: { weiter: "gruft_raetsel" } }),
    },
    gruft_raetsel: {
      art: "raetsel", abschnitt: 2, titel: "Das Glockenjoch", ort: "Gruft der Brüder",
      text: (A, h) => [
        "Vier kleine Glocken hängen am Joch, jede mit einem Tier: Rabe, Lamm, Taube, Wolf. Darunter eine Inschrift: *Wer die Brüder ruft, ruft sie in ihrer Ordnung.*",
        "Die Grabplatten ringsum tragen Verse. Jede Person liest auf ihrem Handy, was ihre Figur auf ihrer Platte findet. Nur gemeinsam ergibt sich die Reihenfolge.",
        A.merker.gruft_raetsel_fehl ? "Die falschen Töne hallen noch nach. Irgendwo in den Nischen knirscht es." : "",
        h.klasse(A, "zauberer") ? `${h.name(A, h.klasse(A, "zauberer"))} erkennt die Zeichen am Joch aus alten Ordensschriften: Der Rabe ist der Ruf des Vorstehers. Er beginnt immer.` : "",
      ],
      glocken: [{ id: "rabe", name: "Rabe" }, { id: "lamm", name: "Lamm" }, { id: "taube", name: "Taube" }, { id: "wolf", name: "Wolf" }],
      loesung: ["rabe", "lamm", "taube", "wolf"],
      hinweise: [
        "Bruder Aldo: „Das Lamm ruft nie als Erstes und nie als Letztes.“",
        "Bruder Merek: „Der Wolf hat stets das letzte Wort.“",
        "Bruder Ilvo: „Die Taube folgt dem Lamm, ohne zu zögern.“",
        "Bruder Tan: „Vor dem Lamm, vor allen, wacht einer, der schwarz ist.“",
      ],
      zusatz: { gelehrter: "Lyra erkennt an der Steinmetzarbeit: Die Platten wurden in der Reihenfolge der Glocken gesetzt. Die älteste zeigt einen Raben." },
      richtig: "Die vier Töne verklingen rein. Im Joch öffnet sich ein Fach: eine kleine silberne Glocke und zwei Phiolen mit Weihwasser.",
      falsch: "Der Klang ist falsch, schrill. Die Glocke von Grauwacht antwortet von oben.",
      waechter: "raetsel_waechter",
      erfolg: { setzt: { silberglocke: true }, tranke: 2, weiter: "gruft_nischen" },
      aufgeben: { weiter: "gruft_nischen" },
    },
    raetsel_waechter: {
      art: "kampf", abschnitt: 2, titel: "Der falsche Ruf", ort: "Gruft der Brüder",
      text: ["Der falsche Ruf weckt, was schlafen sollte. Knochenwächter steigen aus den Nischen."],
      kampf: (A) => ({ begegnung: "gruft", skala: 0.4, karte: KARTEN.GRUFT, sieg: { weiter: "gruft_raetsel" } }),
    },
    gruft_nischen: {
      art: "gespraech", abschnitt: 2, titel: "Die Nischen", ort: "Gruft der Brüder", rastErlaubt: true,
      text: ["Es ist still in der Gruft. Zwischen den Nischen gibt es mehr zu finden, als ein Blick verrät."],
      optionen: [
        { id: "platten", text: "Die Grabplatten genauer lesen", frage: "Ihr lest die Grabplatten.", setzt: { coldric_name: true }, antwort: "Auf einer fünften Platte, größer als die anderen: *Coldric, Wächter des Siegels. Er schwor, nicht zu ruhen, bis das Siegel hält.* Darunter ist die Nische leer." },
        { id: "nische", text: "Die verschlossene Nische öffnen", frage: "Ihr steckt den rostigen Schlüssel ins Schloss.", wenn: (A) => A.merker.schluessel, setzt: { umhang: true }, antwort: "Der rostige Schlüssel aus dem Klostergarten passt. In der Nische liegt ein Umhang aus dunkler Wolle, der das Licht zu schlucken scheint: der **Umhang der Dämmerung**." },
        { id: "jorek", text: "Den Toten in der letzten Nische ansehen", frage: "Ihr tretet an die letzte Nische.", setzt: (A) => ({ vater_gefunden: true, medaillon: Boolean(A.merker.wenna_versprechen) }),
          antwort: (A) => `Er trägt keine Kutte, sondern einen Reisemantel. Kein Bruder. In seiner Hand ein zusammengefaltetes Papier, braun vor Alter: „Wenna. Wenn du das liest, bin ich nicht zurückgekommen. Anselm stirbt für dieses Siegel, jeden Tag ein wenig. Ich wollte es brechen, damit er frei ist. Ich hätte es nicht allein versuchen dürfen. Verzeih mir. – Jorek“${A.merker.wenna_versprechen ? " Um seinen Hals hängt ein Medaillon mit einem Kinderbild. Ihr nehmt es mit, für Wenna." : ""}` },
        { id: "weiter", text: "Weiter, tiefer hinab", weiter: "schacht" },
      ],
    },
    /* ----- Weg B: Der Schmugglerpfad ----- */
    pfad: {
      art: "erzaehlung", abschnitt: 2, titel: "Der Schmugglerpfad", ort: "Unter der Abtei", weiter: "pfad_kampf",
      text: (A) => [
        "Der Spalt wird zu einem Gang, kaum schulterbreit. Die Wände sind feucht und mit Pilzen bewachsen, die schwach grün leuchten. Ihr geht gebückt, einer hinter dem anderen.",
        A.merker.nisk_dabei ? (A.merker.nisk_gefesselt ? "Nisk geht voraus, die Hände gebunden. Er stolpert oft. Einmal dreht er sich um und sieht euch an, ohne etwas zu sagen." : "Nisk huscht voraus, bleibt stehen, lauscht, winkt euch weiter.") : "",
        "Dann weitet sich der Gang zu einer Kammer. Die Pilze hier sind groß wie Menschen. Und sie atmen.",
      ],
    },
    pfad_kampf: {
      art: "kampf", abschnitt: 2, titel: "Die Pilzkammer", ort: "Schmugglerpfad",
      text: ["Pilzbrut. Sie bewegt sich nicht, aber ihre Sporen brennen in der Lunge. Dazwischen huschen Schattenkobolde, die hier leben."],
      kampf: (A) => ({ begegnung: "pilze", karte: KARTEN.PILZE, sieg: { weiter: A.merker.blutschuld ? "lager_falle" : "koboldlager" } }),
    },
    koboldlager: {
      art: "wahl", abschnitt: 2, titel: "Das Koboldlager", ort: "Schmugglerpfad",
      beimEintritt: (A, h) => (h.klasse(A, "schurke") ? { setzt: { ring: true } } : null),
      text: (A, h) => [
        "Hinter der Pilzkammer: ein verlassenes Lager. Lumpen, eine erkaltete Feuerstelle, Spielzeug aus Knochen. Die Kobolde sind tiefer geflohen, in aller Eile.",
        "In einer Kiste: drei Heiltränke, sorgfältig in Moos gewickelt, und ein Beutel Münzen.",
        A.merker.nisk_dabei ? "Nisk steht in der Mitte des Lagers und sagt nichts. Es ist sein Zuhause." : "",
        h.hat(A, "schattenlaeufer") ? "Darian findet unter der Feuerstelle ein Geheimfach. Darin ein Ring aus dunklem Metall, kalt wie Wasser." : h.klasse(A, "schurke") ? `${h.name(A, h.klasse(A, "schurke"))} klopft die Steine der Feuerstelle ab. Einer klingt hohl. Darunter ein Geheimfach mit einem Ring aus dunklem Metall, kalt wie Wasser.` : "",
        "Nehmt ihr die Vorräte?",
      ],
      optionen: [
        { id: "nehmen", text: "Die Vorräte nehmen", setzt: { vorraete_gestohlen: true }, plus: { nisk_vertrauen: -1 }, tranke: 3, weiter: "schacht" },
        { id: "lassen", text: "Alles liegen lassen", plus: { nisk_vertrauen: 1 }, weiter: "schacht" },
      ],
    },
    lager_falle: {
      art: "kampf", abschnitt: 2, titel: "Die Rache der Kobolde", ort: "Schmugglerpfad",
      text: ["Das Lager ist nicht verlassen. Es ist eine Falle. Die Kobolde haben gesehen, was ihr im Turm getan habt."],
      kampf: (A) => ({ begegnung: "kobolde", karte: KARTEN.PILZE, sieg: { weiter: "schacht", tranke: 1 } }),
    },
    /* ----- Beide Wege: Der Schacht ----- */
    schacht: {
      art: "erzaehlung", abschnitt: 2, titel: "Der Schacht", ort: "Tief unter der Abtei", weiter: "schacht_kampf",
      text: (A) => [
        "Ihr kommt an einen senkrechten Schacht, so tief, dass das Licht der Fackeln keinen Boden findet. Netze spannen sich darüber, dick wie Tauwerk. Knochen hängen darin.",
        "Und mitten im größten Netz, eingesponnen bis zum Hals, aber am Leben: ein Junge. **Tam.** Seine Augen sind offen. Er sieht euch nicht. Er hört etwas, das ihr nicht hört.",
        A.merker.weg_pfad ? "Ihr seid von der Seite gekommen, ungesehen. Der Netzweber hängt kopfüber über dem Schacht und hat euch noch nicht bemerkt." : "Etwas Großes bewegt sich in der Tiefe, als hätte es auf euch gewartet.",
      ],
    },
    schacht_kampf: {
      art: "kampf", abschnitt: 2, titel: "Der Netzweber", ort: "Der Schacht",
      text: ["Der Netzweber klettert aus dem Schacht. Seine Netze halten fest, wen sie treffen. Knochenwächter, die in den Netzen hingen, lösen sich und fallen auf die Plattform."],
      kampf: (A) => ({ begegnung: "netz", karte: KARTEN.SCHACHT, ueberraschung: Boolean(A.merker.weg_pfad), sieg: { weiter: "tam" } }),
    },
    tam: {
      art: "wahl", abschnitt: 2, titel: "Tam", ort: "Der Schacht",
      text: (A, h) => [
        "Der Netzweber stürzt in die Tiefe. Tam hängt noch im Netz, über dem Abgrund. Ihn herauszuschneiden dauert. Lange.",
        h.hat(A, "schildwaechter") || h.hat(A, "tiergefaehrte")
          ? `${h.hat(A, "schildwaechter") ? "Torvald stemmt sich gegen das Netz und hält es, während die anderen schneiden" : "Grau klettert ins Netz und beruhigt den Jungen, bis er stillhält"}. Es geht schneller, als ihr dachtet.`
          : "Jede Minute hier unten ist eine Minute, in der etwas aufwacht.",
        "Holt ihr ihn heraus?",
      ],
      optionen: [
        { id: "retten", text: "Tam retten", setzt: { tam_gerettet: true, abt_name: true }, glocke: 0, weiter: "tam_folge" },
        { id: "zuruecklassen", text: "Ihn zurücklassen – wir holen ihn auf dem Rückweg", setzt: { tam_zurueck: true }, weiter: (A) => (minderheit(A, "retten") ? "tam_heimlich" : "tam_folge") },
      ],
    },
    tam_folge: {
      art: "erzaehlung", abschnitt: 2, titel: "Tam", ort: "Der Schacht", weiter: (A, h) => h.ereignis(A, 3, "bibliothek"), rastErlaubt: true,
      beimEintritt: (A, h) => (A.merker.tam_heimlich ? { glocke: 1, schadenFig: { fid: A.merker.tam_heimlich, wurf: "2W6" } } : A.merker.tam_gerettet && !(h.hat(A, "schildwaechter") || h.hat(A, "tiergefaehrte")) ? { glocke: 1 } : null),
      text: (A, h) => A.merker.tam_gerettet ? [
        "Tam fällt euch in die Arme, leicht wie ein Vogel. Er zittert. Dann flüstert er, mit einer Stimme, die nicht ganz seine ist:",
        "„Er hat einen Namen. Er hat ihn vergessen, aber ich hab ihn gehört, im Traum. **Valdric.** Er heißt Valdric.“",
        A.merker.nisk_dabei && A.merker.nisk_vertrauen >= 1 ? "Nisk nimmt Tam an der Hand. „Nisk bringt ihn hoch. Kobold-Weg. Sicher.“ Ihr seht ihnen nach, bis das Pilzlicht sie verschluckt." : "Ihr zeigt Tam den Weg zurück nach oben. Er rennt, ohne sich umzusehen.",
      ] : [
        "Ihr wendet euch ab. Hinter euch bewegt sich das Netz im Luftzug aus der Tiefe.",
        "Niemand sagt etwas. Aber jede Person in dieser Gruppe wird sich an seine offenen Augen erinnern.",
      ],
    },
    bibliothek: {
      art: "lager", abschnitt: 2, titel: "Lagerfeuer in der Bibliothek", ort: "Die alte Bibliothek", aufstieg: 3,
      weiter: (A, h) => (h.hat(A, "gelehrter") ? "tagebuch_lyra" : "tagebuch"),
      text: (A) => [
        "Hinter dem Schacht: eine Bibliothek, unberührt. Regale bis zur Decke, Pergament, das unter den Fingern zerfällt. In der Mitte ein Lesepult, darauf ein Buch mit frischer Tinte. Jemand war hier, vor kurzem.",
        "Ihr macht Feuer in einem eisernen Becken. Zum ersten Mal seit Halmbruck ist euch warm.",
        A.merker.tam_zurueck ? "Im Schlaf hört ihr ein Kind rufen. Als ihr aufwacht, ist es still." : "",
        "Ihr seid stärker geworden. **Stufe 3.**",
      ],
    },
    tagebuch: {
      art: "probe", abschnitt: 2, titel: "Anselms Tagebuch", ort: "Die alte Bibliothek",
      text: ["Das Buch auf dem Pult ist ein Tagebuch. Die Schrift ist zittrig, die Tinte an manchen Stellen verlaufen. Wer liest es?"],
      probe: { name: "Entziffern", attr: "INT", sg: 13, geuebt: ["zauberer"], vorteil: (A, h, fid) => (fid === "elementarist" ? 1 : 0), knapp: true,
        erfolg: { text: (A) => TAGEBUCH(A, true), setzt: { wahrheit_frueh: true }, weiter: "treppe_asche" },
        knapp: { text: "Nur Bruchstücke: „… das Siegel nimmt, was es hält … ich bin der Letzte … verzeiht mir, dass ich läute …“ Der Rest ist verlaufen.", setzt: { wahrheit_halb: true }, weiter: "treppe_asche" },
        fehl: { text: "Die Seiten zerfallen unter euren Fingern. Ihr erfahrt nichts.", weiter: "treppe_asche" } },
    },
    tagebuch_lyra: {
      art: "erzaehlung", abschnitt: 2, titel: "Anselms Tagebuch", ort: "Die alte Bibliothek", weiter: "treppe_asche",
      beimEintritt: () => ({ setzt: { wahrheit_frueh: true } }),
      text: (A) => ["Lyra liest das Tagebuch in einem Zug. Sie braucht keine Probe: Sie kennt die alte Kurzschrift der Mönche.", TAGEBUCH(A, true)],
    },
    /* ================= Abschnitt 3 · Das Siegel ================= */
    treppe_asche: {
      art: "erzaehlung", abschnitt: 3, titel: "Die Treppe der Asche", ort: "Unter der Bibliothek", weiter: "halle", rastErlaubt: true,
      beimEintritt: (A) => {
        const m = A.merker, w = { setzt: {}, plus: {} };
        if (m.nisk_dabei && m.tam_gerettet && (m.nisk_vertrauen || 0) >= 1) w.plus.nisk_vertrauen = 1; // Er hat Wort gehalten und kommt zurück
        else if (m.nisk_dabei && (m.nisk_vertrauen || 0) <= 0) Object.assign(w.setzt, { nisk_verrat: true, nisk_fort: true });
        return w;
      },
      text: (A, h) => {
        const m = A.merker;
        return [
          "Hinter der Bibliothek führt eine Treppe in die Tiefe, breit genug für eine Prozession. Die Stufen sind warm. Von unten steigt ein Geruch nach Asche auf, und ein Licht, rot wie Glut hinter einer Ofentür.",
          m.nisk_verrat ? "Auf halber Treppe reißt Nisk sich los. Das Seil fällt leer auf die Stufen. Er rennt voraus, in die Glut hinein, und ihr hört ihn rufen, hoch und schrill: „Sie kommen! Sie kommen!“ Wer dort unten wartet, weiß jetzt Bescheid." : "",
          m.nisk_dabei && !m.nisk_verrat && m.tam_gerettet && (m.nisk_vertrauen || 0) >= 2 ? "Schritte hinter euch, leicht und schnell. Nisk. Er keucht. „Junge ist oben. Bei der Frau mit der Laterne. Nisk hat es versprochen.“ Er grinst, und diesmal sieht es nicht gefährlich aus." : "",
          m.nisk_dabei && !m.nisk_verrat && (m.nisk_vertrauen || 0) >= 2 ? "„Halle der Asche“, flüstert Nisk. „Der tote Ritter wacht dort. Aber es gibt einen Gang an der Seite. Nisk zeigt ihn euch.“" : "",
          m.nisk_frei ? "In einer Nische an der Wand sitzt ein kleiner Schatten. Nisk. Ihr habt ihn freigelassen, oben im Turm. Er sagt nichts, aber er hebt die Hand, als ihr vorbeigeht, und deutet nach links: Dort ist der Boden fester." : "",
          m.blutschuld ? "Hinter euch, weit oben, klappern kleine Krallen auf Stein. Die Kobolde folgen euch. Sie haben nicht vergessen, was im Turm geschehen ist." : "",
          "Am Fuß der Treppe öffnet sich eine Halle.",
        ];
      },
    },
    halle: {
      art: "wahl", abschnitt: 3, titel: "Die Halle der Asche", ort: "Halle der Asche",
      beimEintritt: (A, h) => (h.hat(A, "elementarist") ? { setzt: { glut_aus: true } } : null),
      text: (A, h) => {
        const m = A.merker;
        return [
          "Säulen aus schwarzem Stein tragen eine Decke, die ihr nicht seht. Der Boden ist mit Asche bedeckt, knöcheltief, und darunter glüht es. Zwischen den Säulen liegen Hunde aus Asche und Glut, die Köpfe auf den Pfoten. Sie heben die Köpfe, als ihr eintretet.",
          "Am anderen Ende der Halle, vor einer Tür aus Eisen, steht ein Ritter in rußgeschwärzter Rüstung. Ein Zweihänder, die Spitze im Boden. Hinter dem Visier ist nichts als Dunkelheit. Er hat hier gestanden, seit die Abtei noch Mönche hatte.",
          m.coldric_name ? "Ihr kennt seinen Namen von der Grabplatte: **Coldric**, Wächter des Siegels. Er schwor, nicht zu ruhen, bis das Siegel hält." : "",
          h.hat(A, "elementarist") ? "Vaelin kniet sich in die Asche und legt die Hand flach auf den Boden. Kälte breitet sich aus. Die Glut unter der Asche wird dunkel, Schritt für Schritt. Die Hunde werden schwächer, wenn ihnen die Hitze fehlt." : "",
          "Der Ritter hebt das Schwert. Was tut ihr? Stimmt ab.",
        ];
      },
      optionen: [
        { id: "kampf", text: "Kämpfen", weiter: "halle_kampf" },
        { id: "name", text: "Ihn bei seinem Namen rufen: Coldric", wenn: (A) => A.merker.coldric_name, weiter: "halle_name" },
        { id: "duell", text: "Isolde: Coldric zum Ehrenduell fordern", wenn: (A, h) => h.hat(A, "duellant"), weiter: "halle_duell" },
        { id: "umhang", text: "Im Umhang der Dämmerung an der Wand entlangschleichen", wenn: (A) => A.merker.umhang, weiter: "halle_schleichen" },
      ],
    },
    halle_name: {
      art: "probe", abschnitt: 3, titel: "Ein Name in der Asche", ort: "Halle der Asche",
      text: (A, h) => [
        "Eine Person tritt vor, allein, die Hände offen. Wer ruft ihn?",
        h.hat(A, "berserker") ? "Ragnar könnte es tun. Wenn einer dem Ritter einen Herzschlag lang allein standhält, dann er." : "",
      ],
      probe: { name: "Den Namen rufen", attr: "CHA", sg: 10, geuebt: ["trickser"], vorteil: (A, h, fid) => (fid === "berserker" ? 1 : 0), knapp: true,
        erfolg: { text: "„Coldric.“ Der Ritter erstarrt. Langsam senkt er das Schwert. Eine Stimme, rau wie Asche: „So lange … hat niemand … meinen Namen gesagt.“ Er tritt zur Seite. Die Hunde gehorchen ihm nicht mehr. Sie gehören dem, der unten wartet.", setzt: { coldric_frieden: true }, weiter: "halle_kampf_asche" },
        knapp: { text: "Er zögert. Das Schwert sinkt, nur ein wenig. Dann hebt er es wieder, aber langsamer, als hätte er etwas vergessen, das ihm gerade wieder einfällt.", setzt: { coldric_zoegert: true }, weiter: "halle_kampf" },
        fehl: { text: "Der Name verhallt in der Asche. Coldric hört ihn nicht mehr. Er hört nur den Befehl.", weiter: "halle_kampf" } },
    },
    halle_duell: {
      art: "kampf", abschnitt: 3, titel: "Das Ehrenduell", ort: "Halle der Asche",
      text: [
        "Isolde tritt vor und hebt die Klinge zum Gruß. „Ritter. Ich fordere dich. Nur du und ich.“",
        "Coldric hält inne. Dann hebt er den Zweihänder zum selben Gruß, so alt, dass ihn außer Isolde niemand mehr kennt. Die Hunde legen sich nieder. Die anderen treten zurück. Isolde kämpft allein.",
      ],
      kampf: { figuren: ["duellant"], gegner: [{ art: "grabritter", anzahl: 1, tpFaktor: 0.75 }], karte: KARTEN.HALLE, namen: { grabritter: "Coldric" },
        sieg: { setzt: { coldric_frieden: true, duell_sieg: true }, weiter: "halle_duell_sieg" },
        verloren: { setzt: { duell_verloren: true }, weiter: "halle_kampf" } },
    },
    halle_duell_sieg: {
      art: "erzaehlung", abschnitt: 3, titel: "Ehre", ort: "Halle der Asche", weiter: "halle_danach", rastErlaubt: true,
      text: [
        "Coldric sinkt auf ein Knie. Er hätte noch einmal zuschlagen können. Er tut es nicht.",
        "„Gut gekämpft“, sagt er, und es klingt, als hätte er diese Worte lange nicht benutzt. Er hebt die Hand, und die Hunde aus Asche zerfallen, einer nach dem anderen, zu grauem Staub.",
      ],
    },
    halle_schleichen: {
      art: "probe", abschnitt: 3, titel: "Im Schatten der Säulen", ort: "Halle der Asche",
      text: ["Der Umhang der Dämmerung schluckt das Licht der Glut. Ihr drängt euch dicht zusammen und geht an der Wand entlang, Säule für Säule. Alle würfeln."],
      probe: { name: "Schleichen", attr: "GES", sg: 12, wer: "gruppe", geuebt: ["schurke"], knapp: true,
        erfolg: { text: "Kein Laut. Die Hunde schnuppern, finden nichts und legen die Köpfe wieder ab. Coldric starrt an euch vorbei, als stündet ihr nicht da. Die Eisentür ist nicht verschlossen.", setzt: { halle_umgangen: true }, weiter: "halle_danach" },
        knapp: { text: "Fast. Dann knirscht Asche unter einem Stiefel. Die Hunde springen auf, aber ihr seid schon mitten zwischen ihnen.", setzt: { halle_ueberrascht: true }, weiter: "halle_kampf" },
        fehl: { text: "Ein Hund hebt die Schnauze und heult. Coldric dreht sich um.", weiter: "halle_kampf" } },
    },
    halle_kampf: {
      art: "kampf", abschnitt: 3, titel: "Kampf in der Halle der Asche", ort: "Halle der Asche",
      text: (A) => [
        A.merker.coldric_zoegert ? "Coldric kämpft, aber jeder Hieb kommt einen Herzschlag zu spät." : "Coldric kommt auf euch zu, langsam, unaufhaltsam. Die Hunde aus Asche jagen voraus.",
        A.merker.nisk_verrat ? "Sie haben auf euch gewartet. Nisk hat sie gewarnt." : "",
      ],
      kampf: (A) => {
        const m = A.merker; let mal = 1;
        if (m.glut_aus) mal *= 0.85;
        if (m.coldric_zoegert) mal *= 0.9;
        if (m.nisk_verrat) mal *= 1.15;
        if (m.nisk_dabei && !m.nisk_verrat && (m.nisk_vertrauen || 0) >= 2) mal *= 0.8;
        else if (m.nisk_frei) mal *= 0.9;
        return { begegnung: "halle", karte: KARTEN.HALLE, skalaMal: mal, namen: { grabritter: "Coldric" }, ueberraschung: Boolean(m.halle_ueberrascht || (m.nisk_dabei && !m.nisk_verrat && (m.nisk_vertrauen || 0) >= 2)),
          zusatz: m.blutschuld ? [{ art: "schattenkobold", anzahl: 2, tpFaktor: 1 }] : [], sieg: { weiter: "halle_danach", tranke: 1 } };
      },
    },
    halle_kampf_asche: {
      art: "kampf", abschnitt: 3, titel: "Die Hunde aus Asche", ort: "Halle der Asche",
      text: ["Coldric steht still, das Schwert gesenkt. Aber die Hunde springen auf, die Augen voller Glut. Sie gehorchen einem anderen Herrn."],
      kampf: (A) => ({ begegnung: "halle_asche", karte: KARTEN.HALLE, skalaMal: A.merker.glut_aus ? 0.85 : 1, zusatz: A.merker.blutschuld ? [{ art: "schattenkobold", anzahl: 2, tpFaktor: 1 }] : [], sieg: { weiter: "halle_danach", tranke: 1 } }),
    },
    halle_danach: {
      art: "erzaehlung", abschnitt: 3, titel: "Vor der Eisentür", ort: "Halle der Asche", weiter: (A) => (A.merker.coldric_frieden && !A.merker.coldric_schild ? "coldric_schild" : "siegel_vor"), rastErlaubt: true,
      text: (A, h) => {
        const m = A.merker;
        if (m.halle_umgangen) return ["Die Eisentür gleitet hinter euch zu. Ihr seid durch, ohne Kampf. Hinter euch steht Coldric noch immer und wacht über eine Halle, durch die gerade alle gegangen sind, die er aufhalten sollte.",
          h.klasse(A, "schurke") ? `${h.name(A, h.klasse(A, "schurke"))} hält den Riegel fest, bis er lautlos einrastet. Wer unten wartet, hört euch nicht kommen.` : ""];
        return [
          m.coldric_frieden
            ? "Coldric zieht den Handschuh aus. Darunter ist keine Hand, nur Asche, die die Form einer Hand hält. „Er hat mich gerufen, als ich starb, und ich bin gekommen. Vierzig Jahre war ich sein Hund.“ Er sieht zur Eisentür. „Bindet ihn. Und dann lasst mich gehen.“ Er zerfällt, bevor ihr antworten könnt. In der Asche bleibt sein Schild zurück, schwarz und schwer, mit dem Zeichen der Abtei."
            : "Coldrics Rüstung fällt in sich zusammen. Darin ist nur Asche. Für einen Augenblick glaubt ihr, eine Stimme zu hören, erleichtert: „Endlich.“",
          "Hinter der Eisentür liegt eine Treppe, die letzte. Von unten kommt kein Licht. Nur ein Flüstern.",
          h.klasse(A, "schurke") ? `${h.name(A, h.klasse(A, "schurke"))} ölt die Angeln der Eisentür mit Lampenfett und hält den Riegel, bis er lautlos zurückgleitet. Wer unten wartet, hört euch nicht kommen.` : "",
          A.schwierigkeit === "normal" ? "Wenn ihr Wunden verbinden wollt: Jetzt ist die letzte Gelegenheit." : "",
        ];
      },
    },
    coldric_schild: {
      art: "wahl", abschnitt: 3, titel: "Coldrics Schild", ort: "Halle der Asche",
      text: ["Coldrics Schild liegt in der Asche. Er ist noch warm. Wer ihn trägt, steht fester: **+1 Rüstungsklasse** im Kampf gegen Valdric.", "Wer nimmt ihn? Stimmt ab."],
      optionen: FIG().REIHE.map((fid) => ({ id: fid, text: `${FIG().FIGUREN[fid].name} (RK ${FIG().FIGUREN[fid].rk[2]})`, wenn: (A, h) => h.hat(A, fid), setzt: { coldric_schild: fid }, weiter: "siegel_vor" })),
    },
    siegel_vor: {
      art: "erzaehlung", abschnitt: 3, titel: "Die Siegelkammer", ort: "Die Siegelkammer", weiter: "fluestern",
      text: (A, h) => [
        "Die Kammer ist rund und so hoch, dass die Fackeln die Decke nicht erreichen. In den Boden ist ein Kreis aus Silber eingelassen, und an vier Stellen ragen Steine auf, so hoch wie ein Mensch, bedeckt mit Zeichen, die schwach leuchten. Die **Siegelsteine**.",
        "In der Mitte des Kreises sitzt ein Mann auf einem Stuhl aus Stein. Er trägt die Kutte eines Abts. Er ist sehr alt und sehr dünn, und seine Augen sind offen. Er sieht euch an und lächelt.",
        A.merker.abt_name ? "„Valdric“, sagt jemand von euch, leise. Der Abt neigt den Kopf. „Ein Kind hat es euch verraten. Wie schön. Mich hat lange niemand mehr bei meinem Namen genannt.“" : "„Willkommen“, sagt er. „Ich habe die Glocke für euch geläutet. Nun ja. Nicht ich. Aber ich habe zugehört.“",
        h.klasse(A, "zauberer") ? `${h.name(A, h.klasse(A, "zauberer"))} liest die Zeichen auf dem nächsten Stein, Silbe für Silbe, ohne den Mund zu bewegen. Als das letzte Zeichen gelesen ist, leuchtet der Stein auf. Valdrics Lächeln wird schmaler.` : "",
        "Dann spricht er nicht mehr laut. Er spricht in euren Köpfen. Jede und jeder von euch hört etwas anderes.",
      ],
    },
    fluestern: {
      art: "geheim", abschnitt: 3, titel: "Das Flüstern", ort: "Die Siegelkammer", weiter: "abt_kampf",
      text: [
        "Valdric flüstert. Jede Person hört ihn allein. Niemand sieht, was die anderen hören oder antworten.",
        "Wer zusagt, bekommt, was versprochen wird. Und muss die Bedingung halten.",
      ],
      frage: (A, h, fid) => {
        const F = FIG(), f = F.FIGUREN[fid];
        const angebot = A.merker["wasser_" + fid] ? versprechen(fid) : "„Du wirst lebend hier herauskommen. Die anderen vielleicht nicht. Aber du.“";
        const leise = A.merker["wasser_" + fid] ? "Seit dem bitteren Brunnen ist seine Stimme in dir. Sie ist ganz nah." : "Die Stimme klingt fern, wie durch Wasser.";
        let t = `${leise} ${angebot} „Ich verlange nur eines: Berühre keinen Siegelstein. Und wenn ich dich ansehe, sieh weg.“`;
        if (fid === "schattenmagier") {
          const trinker = A.gruppe.filter((x) => x !== fid && !A.zust[x].tot && A.merker["wasser_" + x]).map((x) => F.FIGUREN[x].name);
          t += ` Und Morwen sieht mehr: Schatten legen sich um die, denen er näher kommt. ${trinker.length ? trinker.join(", ") + (trinker.length === 1 ? " hört" : " hören") + " ihn so deutlich wie du." : "Niemand sonst hört ihn so deutlich wie du."}`;
        }
        return t;
      },
      antworten: [
        { id: "annehmen", text: "Ich nehme an", setzt: (fid) => ({ ["pakt_" + fid]: true }) },
        { id: "ablehnen", text: "Ich lehne ab" },
      ],
      abschluss: (A, h) => {
        const pakt = A.gruppe.filter((f) => A.merker["pakt_" + f] && !A.zust[f].tot);
        let t = "Das Flüstern verstummt. Valdric lächelt noch immer.";
        if (h.hat(A, "inquisitor")) {
          const andere = pakt.filter((f) => f !== "inquisitor");
          if (andere.length) t += ` Seran spürt es wie Kälte im Nacken: Jemand hat Ja gesagt. Er sieht ${andere.map((f) => h.name(A, f)).join(" und ")} an. Er weiß es.`;
          else t += " Seran lauscht in die Stille. Niemand hat Ja gesagt. Er atmet aus.";
        }
        return t;
      },
    },
    abt_kampf: {
      art: "kampf", abschnitt: 3, titel: "Valdric", ort: "Die Siegelkammer",
      text: (A) => [
        "Valdric steht auf. Der Stuhl zerbröckelt hinter ihm. Aus dem Boden kriechen die Toten, die er gerufen hat.",
        "**Die vier Siegelsteine:** Wer neben einem steht, kann ihn mit einer Aktion berühren. Jeder Stein schwächt Valdric. Sind alle vier berührt, ist er gebunden.",
        A.merker.abt_name ? "Ihr kennt seinen wahren Namen. Einmal im Kampf könnt ihr ihn damit lähmen." : "",
        A.merker.silberglocke ? "Die silberne Glocke aus der Gruft: Ihr Klang zerbricht die Knochenwächter." : "",
        A.merker.ring ? "Der Ring aus dem Koboldlager wird eiskalt. Valdric sieht ihn und zuckt zurück: Es ist sein eigener." : "",
        A.glocke >= 5 ? "Die Glocke hat zu oft geschlagen. Er ist stärker, als er sein dürfte." : "",
      ],
      kampf: (A, h) => {
        const m = A.merker, pakt = A.gruppe.filter((f) => m["pakt_" + f] && !A.zust[f].tot);
        let mal = A.schwierigkeit === "hardcore" ? 0.7 : 0.85; // langsamere Helden brauchen länger zu den Siegelsteinen
        if (m.ring) mal *= 0.9; if (A.glocke >= 7) mal *= 1.15;
        return { begegnung: "siegel", karte: KARTEN.SIEGEL, skalaMal: mal, namen: m.abt_name ? {} : { abt: "Der Abt" },
          ausruestung: m.coldric_schild && !A.zust[m.coldric_schild]?.tot ? { [m.coldric_schild]: { name: "Coldrics Schild", rk: 1 } } : {},
          boss: { name: Boolean(m.abt_name), silber: Boolean(m.silberglocke), pakt, stein: Boolean(h.klasse(A, "zauberer")) },
          ueberraschung: Boolean(h.klasse(A, "schurke")),
          zusatz: A.glocke >= 5 ? [{ art: "knochenwaechter", anzahl: 1, tpFaktor: 1 }] : [],
          beute: false, sieg: { weiter: "abt_fall" } };
      },
    },
    abt_fall: {
      art: "erzaehlung", abschnitt: 3, titel: "Stille", ort: "Die Siegelkammer", weiter: "anselm_kommt",
      text: (A, h) => {
        const pakt = A.gruppe.filter((f) => A.merker["pakt_" + f] && !A.zust[f].tot);
        return [
          "Valdric fällt auf die Knie. Er ist nicht tot. Er kann nicht sterben, nicht hier. Aber er ist schwach, und die Toten um ihn sind wieder Knochen.",
          "„Ihr habt mich nicht besiegt“, flüstert er. „Ihr habt mich nur müde gemacht. Das Siegel ist zerbrochen. Morgen bin ich wieder stark. Oder ihr gebt ihm, was es braucht.“",
          pakt.length ? `${pakt.map((f) => h.name(A, f)).join(" und ")} ${pakt.length === 1 ? "spürt" : "spüren"} etwas Warmes in der Brust. Das Versprechen. Es ist noch da.` : "",
          "Auf der Treppe hinter euch: Schritte. Langsam. Ein Stock auf Stein.",
        ];
      },
    },
    anselm_kommt: {
      art: "erzaehlung", abschnitt: 3, titel: "Bruder Anselm", ort: "Die Siegelkammer",
      weiter: (A) => (anselmListig(A) ? "anselm_list" : "anselm_gespraech"),
      text: (A) => {
        const m = A.merker;
        return [
          "Bruder Anselm steht in der Tür. Er ist euch gefolgt, den ganzen Weg. Er sieht aus, als könnte er keinen Schritt mehr gehen.",
          m.wahrheit_frueh || m.wahrheit_halb ? "Ihr wisst, wer er ist. Der letzte Hüter. Der Mann, der vierzig Jahre hier unten gewacht hat." : "Er geht an euch vorbei zum Kreis, als würde er den Weg im Schlaf kennen.",
          anselmListig(A) ? "Er lächelt euch an. Es ist kein freundliches Lächeln. Es ist das Lächeln eines Mannes, der endlich bekommt, worauf er gewartet hat." : "Er sieht euch an, und in seinen Augen ist etwas, das ihr bei ihm noch nie gesehen habt: Hoffnung. Und Scham.",
        ];
      },
    },
    anselm_list: {
      art: "probe", abschnitt: 3, titel: "Anselms Plan", ort: "Die Siegelkammer",
      text: [
        "Anselm hebt die Hände und beginnt zu singen, leise, in der alten Sprache. Die Siegelsteine antworten. Ihr Licht wandert, langsam, auf euch zu.",
        "Jetzt versteht ihr: Er hat die Glocke nicht geläutet, um Hilfe zu holen. Er hat sie geläutet, um jemanden zu holen, der seinen Platz einnimmt. Und ihr habt ihm nie einen Grund gegeben, euch zu fragen. Alle würfeln.",
      ],
      probe: { name: "Den Bann brechen", attr: "WEI", sg: 13, wer: "gruppe", geuebt: ["kleriker"], knapp: false,
        erfolg: { text: "Ihr reißt euch los. Das Licht weicht zurück, und Anselm sinkt zusammen, als hätte man ihm die Fäden durchgeschnitten. „Ich musste es versuchen“, flüstert er. „Verzeiht mir. Oder nicht. Es spielt keine Rolle mehr.“", setzt: { anselm_ertappt: true }, weiter: "siegel_wahl" },
        fehl: { setzt: (A) => ({ verrat_opfer: lebendeVon(A)[Math.floor(A.r() * lebendeVon(A).length)] }), text: "Das Licht ist schneller.", weiter: "ende_verrat" } },
    },
    anselm_gespraech: {
      art: "gespraech", abschnitt: 3, titel: "Bruder Anselm", ort: "Die Siegelkammer",
      text: ["„Das Siegel braucht einen Hüter“, sagt Anselm. „Einen Lebenden, der bei ihm wacht. Es nimmt sich jeden Tag ein wenig von ihm. Ich habe es vierzig Jahre getragen.“ Er hustet. „Ich trage es nicht mehr lange.“"],
      optionen: [
        { id: "glocke", text: "„Warum hast du die Glocke geläutet?“", wer: "Anselm", frage: "„Warum hast du die Glocke geläutet?“", antwort: (A) => (A.merker.anselm_vertrauen || 0) > 0 ? "„Weil ich gehofft habe, dass jemand kommt, den ich fragen kann. Ihr wart freundlich zu mir. Das hat es schwerer gemacht, nicht leichter.“" : "„Weil ich feige bin. Ich wollte, dass jemand kommt. Ich wollte nicht fragen müssen.“" },
        { id: "jorek", text: "„Jorek Hald liegt in der Gruft.“", wer: "Anselm", frage: "„Wennas Vater liegt in der Gruft. Er wollte dich befreien.“", wenn: (A) => A.merker.vater_gefunden, antwort: "Anselm schließt die Augen. Lange. „Er hat das Siegel angegriffen, allein, mit einem Hammer und einem Gebet. Valdric hat ihn in einer Nacht verbraucht. Ich habe ihn begraben. Ich habe Wenna nie gesagt, wo.“" },
        { id: "zerbrechen", text: "„Was passiert, wenn wir es zerbrechen?“", wer: "Anselm", frage: "„Was passiert, wenn wir das Siegel einfach zerbrechen?“", antwort: (A) => `„Dann ist er frei, aber schwach, so schwach wie jetzt. Vielleicht stirbt er. Vielleicht nicht. Die Abtei stürzt ein, so viel ist sicher.“ Er zögert. ${A.glocke >= 4 ? "„Und die Glocke hat oft geschlagen. Was sie gerufen hat, geht nicht mit ihm unter. Das trifft Halmbruck.“" : "„Die Glocke hat selten geschlagen. Vielleicht reicht das.“"}` },
        { id: "weiter", text: "Entscheiden", weiter: "siegel_wahl" },
      ],
    },
    siegel_wahl: {
      art: "wahl", abschnitt: 3, titel: "Das Siegel", ort: "Die Siegelkammer",
      text: (A) => [
        "Valdric kniet im Kreis und wartet. Die Siegelsteine flackern. Ihr habt nicht viel Zeit.",
        "Erneuert ihr das Siegel – dann braucht es einen neuen Hüter? Oder zerbrecht ihr es und nehmt in Kauf, was dann kommt?",
        A.merker.anselm_ertappt ? "Anselm sitzt an der Wand und sieht euch nicht an." : "",
        "Stimmt ab.",
      ],
      optionen: [
        { id: "erneuern", text: "Das Siegel erneuern", weiter: "hueter_wahl" },
        { id: "zerbrechen", text: "Das Siegel zerbrechen", weiter: "ende_bruch" },
      ],
    },
    hueter_wahl: {
      art: "wahl", abschnitt: 3, titel: "Wer wacht?", ort: "Die Siegelkammer",
      text: (A) => [
        "Das Siegel braucht einen Hüter. Wer bleibt?",
        A.merker.anselm_ertappt ? "Anselm hebt den Kopf. „Ich. Bis ich sterbe. Das ist nicht lange. Dann fängt alles von vorn an.“" : "„Ich kann noch ein wenig“, sagt Anselm. „Ein paar Monate. Vielleicht einen Winter.“",
        nisk_kann(A) ? "Nisk zupft euch am Ärmel. „Kobolde leben lange“, sagt er. „Sehr lange. Und Nisk hat keine Angst vor dem Alten. Nicht mehr.“" : "",
      ],
      optionen: [
        { id: "anselm", text: "Anselm bleibt", weiter: "ende_waechter" },
        { id: "nisk", text: "Nisk bleibt", wenn: (A) => nisk_kann(A), weiter: "ende_kobold" },
        { id: "einer", text: "Einer von uns bleibt", weiter: "freiwillig" },
      ],
    },
    freiwillig: {
      art: "geheim", abschnitt: 3, titel: "Einer von uns", ort: "Die Siegelkammer",
      weiter: (A) => (A.gruppe.some((f) => A.merker["bleibt_" + f]) ? "ende_opfer" : "ende_waechter"),
      text: ["Jede Person entscheidet für sich, auf ihrem Handy. Wenn sich mehrere melden, entscheidet das Los."],
      frage: (A, h, fid) => `Bleibst du hier unten, ${h.name(A, fid)}? Für immer, oder bis jemand kommt, den du fragen kannst.`,
      antworten: [
        { id: "bleiben", text: "Ich bleibe", setzt: (fid) => ({ ["bleibt_" + fid]: true }) },
        { id: "gehen", text: "Ich gehe" },
      ],
      abschluss: (A) => (A.gruppe.some((f) => A.merker["bleibt_" + f]) ? "Jemand ist vorgetreten." : "Niemand tritt vor. Anselm nickt, als hätte er es gewusst."),
    },
    ende_waechter: {
      art: "ende", abschnitt: 3, titel: "Der letzte Winter", ort: "Halmbruck",
      text: (A, h) => [
        A.merker.anselm_ertappt
          ? "Anselm setzt sich auf den Boden im Kreis. Er sagt nichts mehr zu euch. Als ihr die Treppe hinaufsteigt, hört ihr ihn beten, oder weinen."
          : "Anselm setzt sich in den Kreis, wo Valdric saß, und legt die Hände auf die Knie. „Geht“, sagt er. „Und danke. Ihr habt mir einen Winter geschenkt, in dem ich weiß, dass es jemanden gab, der gekommen ist.“",
        "Die Steine leuchten auf. Valdric verschwindet im Boden wie in Wasser.",
        ...epilog(A, h),
        "Im Frühjahr läutet die Glocke wieder. Einmal. Dann ist es still. Anselm ist gestorben, und das Siegel sucht. In Halmbruck beginnt man, auf Fremde zu warten.",
        ausblick("waechter"),
      ],
    },
    ende_kobold: {
      art: "ende", abschnitt: 3, titel: "Der Hüter mit den vielen Zähnen", ort: "Halmbruck",
      text: (A, h) => [
        "Nisk setzt sich in den Kreis. Er ist so klein, dass seine Füße den Boden nicht berühren. „Nisk passt auf“, sagt er. „Und ihr kommt besuchen. Ja? Ihr kommt besuchen.“",
        "Anselm legt ihm die Hand auf den Kopf, ein einziges Mal. Dann geht er mit euch hinauf, und zum ersten Mal seit vierzig Jahren sieht er die Sonne aufgehen.",
        ...epilog(A, h),
        "Kobolde leben lange. Die Glocke von Grauwacht schweigt für hundert Jahre. Manchmal, in klaren Nächten, hört man unter der Abtei jemanden kichern.",
        ausblick("kobold"),
      ],
    },
    ende_opfer: {
      art: "ende", abschnitt: 3, titel: "Der neue Hüter", ort: "Halmbruck",
      beimEintritt: (A) => {
        if (A.merker.hueter) return null;
        const frei = A.gruppe.filter((f) => A.merker["bleibt_" + f]);
        return { setzt: { hueter: frei[Math.floor(A.r() * frei.length)] } };
      },
      text: (A, h) => {
        const fid = A.merker.hueter, n = fid ? h.name(A, fid) : "Jemand";
        return [
          `${n} tritt in den Kreis. Die Steine leuchten auf, und das Licht ist warm, nicht kalt. Valdric verschwindet im Boden wie in Wasser.`,
          `„Geht“, sagt ${n}. „Ich halte das. Eine Weile.“`,
          "Anselm geht mit euch hinauf. Er stirbt im Frühjahr, in einem Bett in Halmbruck, und am Ende lächelt er.",
          ...epilog(A, h),
          `Die Glocke von Grauwacht schweigt. In Halmbruck stellt man jedes Jahr am letzten Herbstabend eine Laterne auf den Pfad zur Abtei. Für ${n}.`,
          ausblick("opfer"),
        ];
      },
    },
    ende_bruch: {
      art: "ende", abschnitt: 3, titel: "Der Einsturz", ort: "Halmbruck",
      beimEintritt: () => ({ setzt: { splitter: true } }),
      text: (A, h) => [
        "Ihr legt die Hände auf die Steine und drückt. Einer nach dem anderen kippt. Der Kreis zerspringt, und Valdric lacht, dann schreit er, dann ist er Staub. Über euch ächzt die Abtei.",
        "Wo er gekniet hat, liegt ein Splitter aus dem Siegelstein, so lang wie eine Hand. Er ist warm, und er summt leise, wenn man ihn hält. Ihr nehmt ihn mit: den **Splitter von Grauwacht**.",
        "Ihr rennt. Anselm schafft es nicht. Er will es auch nicht. Er sitzt im zerbrochenen Kreis, als die Decke fällt, und sein Gesicht ist ruhig.",
        A.glocke >= 4
          ? "Ihr erreicht den Hang, als die Abtei in sich zusammenstürzt. Dann seht ihr, was die Glocke gerufen hat: Schatten, die aus den Trümmern steigen und ins Tal ziehen. In Halmbruck brennt in dieser Nacht die Mühle."
          : "Ihr erreicht den Hang, als die Abtei in sich zusammenstürzt. Eine Staubwolke steigt auf, dann ist es still. Zum ersten Mal seit sieben Nächten: wirklich still.",
        ...epilog(A, h),
        "Grauwacht ist ein Haufen Steine. Niemand wacht mehr. Niemand muss mehr wachen.",
        ausblick("bruch"),
      ],
    },
    ende_verrat: {
      art: "ende", abschnitt: 3, titel: "Der Hüter wider Willen", ort: "Die Siegelkammer",
      text: (A, h) => {
        const fid = A.merker.verrat_opfer, n = fid ? h.name(A, fid) : "Eine von euch";
        return [
          `Das Licht erreicht ${n} zuerst. Es legt sich um die Füße, dann um die Brust, und ${n} kann sich nicht mehr bewegen. Die anderen werden aus dem Kreis geschleudert.`,
          "Anselm lacht, dann weint er. „Es tut mir leid. Es tut mir so leid. Ich konnte nicht mehr.“ Er steigt die Treppe hinauf und dreht sich nicht um.",
          `Ihr versucht es. Stundenlang. ${n} sieht euch an und sagt schließlich: „Geht. Bitte. Bevor er euch auch noch nimmt.“`,
          ...epilog(A, h),
          `Anselm wird nie wieder gesehen. Die Glocke schweigt. Unter Grauwacht wacht ${n} und wartet darauf, dass jemand die Glocke läutet.`,
          ausblick("verrat"),
        ];
      },
    },
    /* ================= Zufällige Ereignisse unterwegs (Entwurf) =================
       An drei Haltepunkten wird eines gezogen, keines doppelt in einem Abenteuer.
       Punkt 1: nach dem Klostergarten · Punkt 2: nach dem Kreuzgang · Punkt 3: nach dem Schacht */
    ereignis_folge: {
      art: "erzaehlung", titel: "Unterwegs", rastErlaubt: false, weiter: (A) => A.ereignisZiel,
      text: (A) => [A.merker.ereignis_text || "Ihr geht weiter."],
    },
    e_kobold: {
      art: "wahl", titel: "Ein verwundeter Kobold", ort: "Unterwegs",
      text: (A) => [
        "Hinter einem umgestürzten Pfeiler liegt ein Kobold, kaum größer als eine Katze. Ein Bolzen steckt in seinem Bein. Er faucht euch an, aber er kann nicht weg.",
        A.merker.nisk_dabei ? "Nisk erstarrt. „Das ist Rikk“, flüstert er. „Mein Bruder.“" : "Er hat Angst. Und Hunger.",
        "Was tut ihr? Stimmt ab.",
      ],
      optionen: [
        { id: "helfen", text: "Verbinden und einen Heiltrank geben", trankWeg: 1, plus: { nisk_vertrauen: 1 }, setzt: { kobold_freund: true, ereignis_text: "Der Kobold trinkt, hustet, starrt euch an. Dann ist er weg. Später, in der Dunkelheit, hört ihr ein leises Pfeifen vor euch, als würde jemand den Weg freimachen." }, weiter: "ereignis_folge" },
        { id: "liegen", text: "Liegen lassen", setzt: { ereignis_text: "Ihr geht an ihm vorbei. Sein Fauchen folgt euch noch eine ganze Weile." }, weiter: "ereignis_folge" },
        { id: "erloesen", text: "Ihn erlösen", plus: { nisk_vertrauen: -1 }, setzt: { kobold_erloest: true, ereignis_text: "Es geht schnell. Irgendwo in den Wänden hört ihr kleine Krallen davonhuschen. Sie haben es gesehen." }, weiter: "ereignis_folge" },
      ],
    },
    e_bruder: {
      art: "wahl", titel: "Ein Bruder ohne Ruhe", ort: "Unterwegs",
      text: (A, h) => [
        "Ein Mönch steht im Gang, durchscheinend wie Rauch. Er betet, immer dieselben drei Worte, immer wieder. Als er euch sieht, hört er auf.",
        "„Ihr geht zu ihm“, sagt er. „Geht nicht. Oder geht, und vergesst nicht, wer ihn bewacht hat.“",
      ],
      optionen: [
        { id: "zuhoeren", text: "Ihm zuhören", setzt: { coldric_name: true, ereignis_text: "„Coldric“, sagt der Geist. „Unser Bruder Coldric. Er hält die Halle. Er wartet darauf, dass ihn jemand bei seinem Namen ruft.“ Dann ist er fort." }, weiter: "ereignis_folge" },
        { id: "segnen", text: "Ihn segnen und erlösen (Kleriker)", wenn: (A, h) => ["lichtbringer", "wanderheiler", "inquisitor"].some((f) => h.hat(A, f)), heilen: 0.5, setzt: { ereignis_text: "Die Gestalt lächelt und verblasst. Eine Wärme bleibt im Gang zurück, die euch bis in die Knochen geht. Eure Wunden schmerzen weniger." }, weiter: "ereignis_folge" },
        { id: "weiter", text: "Schnell weitergehen", setzt: { ereignis_text: "Ihr lasst ihn hinter euch. Seine drei Worte hallen euch nach, bis ihr sie nicht mehr hört." }, weiter: "ereignis_folge" },
      ],
    },
    e_kapelle: {
      art: "probe", titel: "Die vergessene Kapelle", ort: "Unterwegs",
      text: ["Eine kleine Kapelle, die Tür halb aus den Angeln. Auf dem Altar brennt eine Kerze, die niemand angezündet hat. Ihr kniet nieder. Alle würfeln."],
      probe: { name: "Andacht", attr: "WEI", sg: 12, wer: "gruppe", geuebt: ["kleriker"], knapp: true,
        erfolg: { text: "Stille, dann Wärme. Ihr steht auf und fühlt euch, als hättet ihr eine Nacht durchgeschlafen. Alle Wunden heilen.", heilen: 1, weiter: (A) => A.ereignisZiel },
        knapp: { text: "Ein kurzer Moment Frieden. Er reicht für ein wenig Kraft.", heilen: 0.4, weiter: (A) => A.ereignisZiel },
        fehl: { text: "Die Kerze erlischt. Weit über euch schlägt die Glocke, als hätte jemand euer Gebet gehört und es nicht gemocht.", glocke: 1, weiter: (A) => A.ereignisZiel } },
    },
    e_haendler: {
      art: "wahl", titel: "Der Händler im Dunkeln", ort: "Unterwegs",
      wenn: (A) => A.gruppe.some((f) => !A.zust[f].tot && A.zust[f].rucksack.some((d) => d.id === "heiltrank" && d.n > 0)),
      text: [
        "Am Rand des Lichts sitzt ein Mann mit einem Bauchladen. Er hat kein Gesicht, nur einen Schatten, wo eines sein sollte. „Tauschen?“, fragt er. „Ein Trank für ein Ding. Ein gutes Ding.“",
      ],
      optionen: [
        { id: "tauschen", text: "Einen Heiltrank tauschen", trankWeg: 1, beute: true, setzt: { haendler: true, ereignis_text: "Er nimmt den Trank, ohne ihn anzusehen, und breitet seine Waren aus. Als ihr aufblickt, ist er fort. Die Waren sind noch da." }, weiter: "ereignis_folge" },
        { id: "ablehnen", text: "Ablehnen", setzt: { ereignis_text: "„Schade“, sagt der Schatten. „Ich komme wieder. Ich komme immer wieder.“" }, weiter: "ereignis_folge" },
      ],
    },
    e_falle: {
      art: "probe", titel: "Der Gang der Klingen", ort: "Unterwegs",
      text: ["Der Boden klickt unter einem Fuß. Aus den Wänden fahren rostige Klingen. Alle würfeln, um auszuweichen."],
      probe: { name: "Ausweichen", attr: "GES", sg: 13, wer: "gruppe", geuebt: ["schurke"], knapp: true,
        erfolg: { text: "Ihr duckt euch, rollt, springt. Niemand blutet. Hinter einer der Klingen klemmt etwas, das jemand vor euch verloren hat.", beute: true, weiter: (A) => A.ereignisZiel },
        knapp: { text: "Nur Kratzer. Aber Kratzer von rostigen Klingen.", schaden: "1W4", weiter: (A) => A.ereignisZiel },
        fehl: { text: "Die Klingen treffen. Ihr verbindet euch gegenseitig, so gut es geht.", schaden: "2W4", weiter: (A) => A.ereignisZiel } },
    },
    e_zweite_glocke: {
      art: "wahl", titel: "Die zweite Glocke", ort: "Unterwegs",
      text: [
        "In einer Nische hängt eine kleine Glocke aus schwarzem Eisen. Eingeritzt: *Wer mich läutet, schläfert die Toten ein. Wer mich läutet, weckt den Abt.*",
        "Ein Dilemma. Stimmt ab.",
      ],
      optionen: [
        { id: "laeuten", text: "Läuten: die nächsten Gegner sind geschwächt, aber die Glocke schlägt", glocke: 1, naechsterKampf: 0.75, setzt: { ereignis_text: "Ein dünner, kalter Ton. Irgendwo weit vor euch fällt etwas klappernd zu Boden. Und weit über euch antwortet die große Glocke." }, weiter: "ereignis_folge" },
        { id: "lassen", text: "Nicht läuten", setzt: { ereignis_text: "Ihr lasst sie hängen. Sie schwingt trotzdem ein wenig, als ihr vorbeigeht, ohne einen Ton." }, weiter: "ereignis_folge" },
      ],
    },
    e_schrein: {
      art: "wahl", titel: "Der Schrein der Brüder", ort: "Unterwegs",
      wenn: (A) => A.gruppe.some((f) => !A.zust[f].tot && A.zust[f].rucksack.some((d) => d.n > 0 && d.id !== "heiltrank")),
      text: [
        "Ein Schrein, darauf Opfergaben: ein Ring, eine Feder, ein Kinderschuh. Eine Inschrift: *Gib, was dir lieb ist, und die Glocke schweigt einen Schlag lang.*",
        "Ein Dilemma. Stimmt ab.",
      ],
      optionen: [
        { id: "opfern", text: "Einen getragenen Gegenstand opfern: Wunden heilen, die Glocke wird leiser", gegenstandWeg: true, heilen: 1, glocke: -1, setzt: { ereignis_text: "Das Ding liegt auf dem Schrein, und für einen Herzschlag hört ihr nichts. Keine Glocke, kein Tropfen, nichts. Dann geht es euch besser als seit Tagen." }, weiter: "ereignis_folge" },
        { id: "nicht", text: "Nichts geben", setzt: { ereignis_text: "Ihr behaltet, was ihr habt. Der Kinderschuh auf dem Schrein ist sehr klein." }, weiter: "ereignis_folge" },
      ],
    },
    e_holzpferd: {
      art: "wahl", titel: "Ein Holzpferd", ort: "Unterwegs",
      wenn: (A) => !A.merker.tam_gerettet && !A.merker.tam_zurueck,
      text: ["Auf dem Boden liegt ein geschnitztes Holzpferd, eines der Beine abgebrochen. Tams, ganz sicher. Er war hier. Es ist noch nicht lange her."],
      optionen: [
        { id: "mitnehmen", text: "Mitnehmen", setzt: { tam_pferd: true, ereignis_text: "Ihr steckt es ein. Es wiegt fast nichts und doch mehr als alles andere im Gepäck." }, weiter: "ereignis_folge" },
        { id: "liegen", text: "Liegen lassen", setzt: { ereignis_text: "Ihr lasst es liegen, wo er es verloren hat. Vielleicht findet er es selbst auf dem Rückweg." }, weiter: "ereignis_folge" },
      ],
    },
    e_wand: {
      art: "probe", titel: "Die flüsternde Wand", ort: "Unterwegs",
      text: ["In eine Wand sind hunderte Namen geritzt, übereinander, durcheinander. Einer davon flüstert. Wer liest ihn?"],
      probe: { name: "Entziffern", attr: "INT", sg: 13, geuebt: ["zauberer"], knapp: true,
        erfolg: { text: "Unter allen anderen, ganz tief geritzt: *Valdric, Abt von Grauwacht, der den Tod betrog.* Ihr kennt jetzt seinen Namen.", setzt: { abt_name: true, wahrheit_halb: true }, weiter: (A) => A.ereignisZiel },
        knapp: { text: "„Val…“ Der Rest ist weggekratzt, absichtlich, wie es aussieht.", weiter: (A) => A.ereignisZiel },
        fehl: { text: "Die Wand flüstert lauter, je länger ihr hinseht. Ihr reißt euch los. Über euch schlägt die Glocke.", glocke: 1, weiter: (A) => A.ereignisZiel } },
    },
    e_bote: {
      art: "wahl", titel: "Ein Bote aus Halmbruck", ort: "Unterwegs",
      text: [
        "Hinter euch Schritte. Ein Mädchen aus dem Dorf, nass bis auf die Haut, mit einem Beutel. „Wenna schickt das. Für euch.“ Im Beutel: zwei Heiltränke.",
        "„Und sie fragt, ob sie die Kinder in die Kirche holen soll. Weil die Glocke.“",
      ],
      optionen: [
        { id: "behalten", text: "Die Tränke behalten und sie zurückschicken", tranke: 2, setzt: { ereignis_text: "Das Mädchen nickt und rennt los. Ihr habt zwei Tränke mehr." }, weiter: "ereignis_folge" },
        { id: "warnen", text: "Die Tränke zurückgeben: „Holt die Kinder in die Kirche, alle, sofort.“", setzt: { halmbruck_gewarnt: true, ereignis_text: "Sie rennt, den Beutel noch in der Hand. Ihr hofft, dass sie schnell genug ist." }, weiter: "ereignis_folge" },
      ],
    },

    /* ----- Heimlich handeln: wer überstimmt wurde, kann allein anders handeln (geheim, auf dem Handy) ----- */
    nisk_heimlich: {
      art: "geheim", abschnitt: 1, titel: "Nisk", ort: "Glockenturm", weiter: "nisk_folge",
      text: ["Die Gruppe hat entschieden. Aber nicht jede Person ist einverstanden. Jede entscheidet jetzt für sich, auf ihrem Handy."],
      frage: (A, h, fid) => {
        const st = A.letzteStimmen || {}, gew = (A.letzteAbstimmung || {}).gewinner, meine = st[fid];
        if (!meine || meine === gew) return "Du warst einverstanden. Es gibt nichts für dich zu tun.";
        return gew === "toeten" ? "Du hast dagegen gestimmt, ihn zu töten. Du könntest heimlich das Seil durchschneiden, bevor es jemand tut." : meine === "toeten" ? "Du wolltest ihn tot sehen. Du könntest heimlich zustechen, wenn niemand hinsieht." : "Die anderen haben anders entschieden als du. Du lässt es dabei.";
      },
      antworten: (A, h, fid) => {
        const st = A.letzteStimmen || {}, gew = (A.letzteAbstimmung || {}).gewinner, meine = st[fid];
        if (meine && meine !== gew && gew === "toeten") return [{ id: "retten", text: "Heimlich das Seil durchschneiden", setzt: (f) => ({ nisk_tot: false, blutschuld: false, nisk_frei: true, nisk_heimlich: f }) }, { id: "nichts", text: "Nichts tun" }];
        if (meine === "toeten" && gew !== "toeten") return [{ id: "toeten", text: "Heimlich zustechen", setzt: (f) => ({ nisk_tot: true, blutschuld: true, nisk_dabei: false, nisk_frei: false, nisk_heimlich_tot: f }) }, { id: "nichts", text: "Nichts tun" }];
        return [{ id: "nichts", text: "Weiter" }];
      },
      abschluss: (A) => (A.merker.nisk_heimlich ? "Als ihr euch umdreht, ist das Seil durchgeschnitten. Nisk ist weg. Niemand sagt, wer es war." : A.merker.nisk_heimlich_tot ? "Ein kurzes Geräusch, dann Stille. Nisk liegt still. Niemand sagt, wer es war." : "Niemand rührt sich."),
    },
    tam_heimlich: {
      art: "geheim", abschnitt: 2, titel: "Tam", ort: "Der Schacht", weiter: "tam_folge",
      text: ["Die Gruppe geht weiter. Aber vielleicht nicht alle. Jede Person entscheidet jetzt für sich, auf ihrem Handy."],
      frage: (A, h, fid) => ((A.letzteStimmen || {})[fid] === "retten" ? "Du wolltest Tam retten. Du könntest zurückbleiben und ihn allein losschneiden. Es wird dich etwas kosten, und die Glocke wird es hören." : "Du gehst mit den anderen."),
      antworten: (A, h, fid) => ((A.letzteStimmen || {})[fid] === "retten" ? [{ id: "bleiben", text: "Heimlich zurückbleiben und Tam befreien", setzt: (f) => ({ tam_heimlich: f, tam_gerettet: true, tam_zurueck: false, abt_name: true }) }, { id: "gehen", text: "Mit den anderen gehen" }] : [{ id: "gehen", text: "Weiter" }]),
      abschluss: (A, h) => (A.merker.tam_heimlich ? `Eine Stunde später holt ${h.name(A, A.merker.tam_heimlich)} euch ein, zerschnitten, blutend, und mit Tam auf dem Rücken.` : "Ihr geht. Alle."),
    },
    grauwacht_behaelt: {
      art: "ende", abschnitt: 0, titel: "Grauwacht behält euch", ort: "",
      text: ["Die Glocke läutet weiter. Im nächsten Jahr kommt eine neue Gruppe nach Halmbruck. Eure Namen stehen auf ihrer Karte."],
    },
  };
  const EREIGNISSE = [
    { id: "e_kobold", punkte: [1, 2] }, { id: "e_bruder", punkte: [2, 3] }, { id: "e_kapelle", punkte: [1, 2, 3] }, { id: "e_haendler", punkte: [1, 2, 3] },
    { id: "e_falle", punkte: [2, 3] }, { id: "e_zweite_glocke", punkte: [1, 2, 3] }, { id: "e_schrein", punkte: [2, 3] }, { id: "e_holzpferd", punkte: [1, 2] },
    { id: "e_wand", punkte: [2, 3], wenn: (A) => !A.merker.abt_name }, { id: "e_bote", punkte: [1] },
  ].map((e) => Object.assign(e, { wenn: e.wenn || SZENEN[e.id].wenn }));
  const API = { EREIGNISSE, START: "prolog", NIEDERLAGE: "grauwacht_behaelt", SZENEN, KARTEN };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABD = API;
})(typeof window !== "undefined" ? window : globalThis);
