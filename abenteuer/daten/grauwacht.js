/*
 * Das Siegel von Grauwacht – Szenen (Abschnitt 1: Die Abtei, Abschnitt 2: Die Krypta)
 * Texte nach Abenteuerbuch 0.1 mit den Verbesserungen aus 0.2 (Anselm als tragische Figur, Wennas Vater,
 * Momente der 15 Figuren). Entwurf: Texte werden beim Spielen freigegeben.
 * text: Absätze (Array) oder Funktion (A, h) → Array; h.hat(A, fid), h.m(A, merker), h.name(A, fid)
 */
(function (root) {
  "use strict";
  const TURM = {
    name: "Der Glockenturm", b: 11, h: 8,
    // S = Treppe, M = Balken, K = Kisten, R = Glockenseil
    hindernisse: [["R", 5, 0], ["S", 5, 3], ["S", 5, 4], ["M", 2, 2], ["M", 8, 2], ["M", 2, 5], ["K", 8, 5], ["K", 0, 0], ["K", 10, 0]],
    start: {
      spieler: [[1, 7], [2, 7], [3, 7], [0, 6], [4, 7], [1, 6]],
      wolf: [[0, 7], [2, 6], [3, 6], [4, 6]],
      gegner: [[10, 7], [3, 1], [7, 1], [9, 3], [1, 3], [6, 2], [8, 0], [4, 1], [9, 1], [7, 3], [2, 0], [10, 4]],
    },
  };
  const kurz = (A) => A.gruppe.length;
  const GRUFT = {
    name: "Die Gruft der Brüder", b: 12, h: 9,
    hindernisse: [["G", 3, 2], ["G", 3, 6], ["G", 6, 2], ["G", 6, 6], ["G", 9, 2], ["G", 9, 6], ["M", 5, 4], ["M", 8, 4], ["M", 0, 0], ["M", 11, 0], ["M", 0, 8], ["M", 11, 8]],
    start: { spieler: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 5], [1, 4]], wolf: [[0, 2], [0, 6], [1, 2], [1, 6]], gegner: [[10, 1], [10, 7], [11, 4], [10, 3], [10, 5], [11, 2], [11, 6], [9, 4], [8, 1], [8, 7], [7, 4], [11, 3]] },
  };
  const PILZE = {
    name: "Die Pilzkammer", b: 12, h: 9,
    hindernisse: [["M", 4, 0], ["M", 4, 1], ["M", 4, 2], ["M", 4, 6], ["M", 4, 7], ["M", 4, 8], ["M", 8, 1], ["M", 8, 2], ["M", 8, 6], ["M", 8, 7], ["K", 6, 4], ["K", 10, 4]],
    start: { spieler: [[1, 3], [1, 5], [2, 4], [0, 2], [0, 6], [2, 2]], wolf: [[2, 6], [3, 5], [0, 4], [3, 3]], gegner: [[9, 4], [7, 2], [7, 6], [11, 1], [11, 7], [10, 2], [10, 6], [11, 4], [6, 1], [6, 7], [9, 0], [9, 8]] },
  };
  const SCHACHT = {
    name: "Der Schacht", b: 12, h: 9,
    // P = Abgrund
    hindernisse: [["P", 5, 3], ["P", 6, 3], ["P", 5, 4], ["P", 6, 4], ["P", 5, 5], ["P", 6, 5], ["K", 2, 1], ["K", 9, 7], ["M", 0, 0], ["M", 11, 8]],
    start: { spieler: [[1, 3], [1, 5], [2, 4], [0, 2], [0, 6], [2, 6]], wolf: [[2, 2], [3, 5], [0, 4], [3, 3]], gegner: [[7, 2], [8, 4], [7, 6], [10, 1], [10, 7], [11, 3], [11, 5], [9, 2], [9, 6], [10, 4], [8, 0], [8, 8]] },
  };
  const KARTEN = { TURM, GRUFT, PILZE, SCHACHT };
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
      text: (A, h) => [
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
        { id: "tam", text: "Wenna nach Tam fragen", antwort: (A, h) => `„Ein stiller Junge. Er hat geträumt, nachts, von einer Glocke unter der Erde. Er hat es seiner Mutter erzählt, und am nächsten Morgen war sein Bett leer.“${h.hat(A, "wildnislaeufer") ? " Kael kniet sich an den Weg zur Abtei: kleine, nackte Fußspuren, gleichmäßig, ohne Zögern. Der Junge ist nicht geflohen und nicht verschleppt worden. Er ist im Schlaf gegangen." : ""}`, setzt: (A, h) => (h.hat(A, "wildnislaeufer") ? { tam_schlaf: true } : {}) },
        { id: "vater", text: "Wenna nach der Abtei fragen", antwort: (A, h) => `Wenna schweigt einen Moment. „Mein Vater ist vor zwanzig Jahren hinaufgegangen. Er sagte, er wolle etwas zu Ende bringen. Er kam nicht zurück.“ Sie sieht zu Anselm hinüber, und ihr Blick ist nicht freundlich.${h.hat(A, "kopfgeldjaeger") ? " Orin kennt den Namen. Jorek Hald. Vor zwanzig Jahren hing sein Steckbrief in jeder Stadt am Fluss: gesucht, weil er ein Siegel brechen wollte." : ""}`, setzt: (A, h) => (h.hat(A, "kopfgeldjaeger") ? { vater_steckbrief: true } : {}) },
        { id: "versprechen", text: "Wenna versprechen, ihren Vater zu finden", wenn: (A) => (A.gewaehlt.halmbruck || []).includes("vater"), setzt: { wenna_versprechen: true }, antwort: "„Wenn ihr ihn findet …“ Sie bricht ab. „Dann bringt mir etwas von ihm zurück. Irgendetwas.“" },
        { id: "anselm_freundlich", text: "Bruder Anselm freundlich ansprechen", plus: { anselm_vertrauen: 1 }, antwort: "Anselm sieht euch lange an. „Die Abtei ist leer, bis auf das, was in den Mauern wohnt. Käfer. Kobolde. Schlimmeres darunter.“ Er hustet. „Ich führe euch bis zum Tor. Weiter gehe ich nicht. Nicht mehr.“ Er sagt nicht, warum die Glocke läutet. Ihr habt das Gefühl, dass er es weiß." },
        { id: "anselm_hart", text: "Bruder Anselm hart befragen", plus: { anselm_vertrauen: -1 },
          probe: { name: "Menschenkenntnis", attr: "WEI", sg: 13, geuebt: ["inquisitor", "kleriker"], vorteil: (A, h, fid) => (fid === "inquisitor" ? 1 : 0), knapp: true,
            erfolg: { text: "Er lügt. Nicht aus Bosheit – aus Scham. Er weiß, warum die Glocke läutet, und er hat Angst davor, es zu sagen.", setzt: { anselm_durchschaut: true } },
            knapp: { text: "Er weicht aus, und ihr spürt, dass da mehr ist. Aber er macht dicht." },
            fehl: { text: "Anselm schweigt. Wenna nickt grimmig, als hätte sie nichts anderes erwartet." } } },
        { id: "spuren", text: "Die Spuren am Dorfrand untersuchen",
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
        "Im Gras raschelt es. Etwas Rostbraunes schiebt sich zwischen den Gräbern hervor.",
      ],
    },
    garten: {
      art: "kampf", abschnitt: 1, titel: "Der Klostergarten", ort: "Abtei Grauwacht",
      text: ["Rostkäfer, groß wie Hunde, kriechen aus dem Moos. Ihre Fühler zittern, als sie das Metall eurer Rüstungen riechen."],
      kampf: (A) => ({ begegnung: "garten", sieg: { weiter: "garten_danach", tranke: Math.ceil(kurz(A) / 2) } }),
    },
    garten_danach: {
      art: "erzaehlung", abschnitt: 1, titel: "Zwischen den Gräbern", ort: "Klostergarten", weiter: "turm", rastErlaubt: true,
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
      kampf: { begegnung: "kobolde", karte: TURM, laeufer: { art: "schattenkobold", feld: [5, 0], ereignis: "alarm" }, sieg: { weiter: "nisk" } },
      ereignisse: { alarm: { glocke: 1, notiz: "Der Kobold hat am Seil gezogen. Die Glocke dröhnt über das Land." } },
    },
    turm_kampf_ueberrascht: {
      art: "kampf", abschnitt: 1, titel: "Überfall im Glockenturm", ort: "Glockenturm",
      text: ["Ihr seid über ihnen, bevor sie die Messer ziehen. Trotzdem: Einer rennt zum Seil."],
      kampf: { begegnung: "kobolde", karte: TURM, ueberraschung: true, laeufer: { art: "schattenkobold", feld: [5, 0], ereignis: "alarm" }, sieg: { weiter: "nisk" } },
      ereignisse: { alarm: { glocke: 1, notiz: "Der Kobold hat am Seil gezogen. Die Glocke dröhnt über das Land." } },
    },
    turm_kampf_still: {
      art: "kampf", abschnitt: 1, titel: "Stille im Glockenturm", ort: "Glockenturm",
      text: ["Am Seil steht niemand mehr. Die anderen Kobolde merken es erst, als ihr mitten unter ihnen seid."],
      kampf: { begegnung: "kobolde", karte: TURM, ueberraschung: true, sieg: { weiter: "nisk" } },
    },
    nisk: {
      art: "wahl", abschnitt: 1, titel: "Nisk", ort: "Glockenturm",
      text: (A) => [
        A.merker.kobolde_friedlich ? "Die Kobolde sind fort, die Treppe hinunter. Nur einer ist geblieben: der Jüngste, mit dem Bein im Glockenseil verheddert." : "Die Kobolde sind tot oder geflohen. Nur einer ist noch da: der Jüngste, das Bein im Glockenseil verheddert.",
        "„Nisk“, sagt er, als ihr näher kommt. „Ich heiße Nisk. Nicht töten. Bitte. Nisk kennt den Weg nach unten. Den geheimen. Nisk zeigt ihn euch.“",
        "Er zittert. Er könnte lügen. Er könnte euch in eine Falle führen. Stimmt ab.",
      ],
      optionen: [
        { id: "mitnehmen", text: "Mitnehmen", setzt: { nisk_dabei: true }, plus: { nisk_vertrauen: 1 }, weiter: "nisk_folge" },
        { id: "gefesselt", text: "Mitnehmen, aber gefesselt", setzt: { nisk_dabei: true, nisk_gefesselt: true }, weiter: "nisk_folge" },
        { id: "freilassen", text: "Freilassen", setzt: { nisk_frei: true }, weiter: "nisk_folge" },
        { id: "toeten", text: "Töten", setzt: { blutschuld: true, nisk_tot: true }, weiter: "nisk_folge" },
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
      art: "lager", abschnitt: 1, titel: "Lagerfeuer im Kreuzgang", ort: "Abtei Grauwacht", aufstieg: 2, weiter: "abstieg",
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
        "Welchen Weg nehmt ihr?",
      ],
      optionen: [
        { id: "treppe", text: "Die Treppe in die Gruft der Brüder", setzt: { weg_gruft: true }, weiter: "gruft" },
        { id: "spalt", text: "Durch den Spalt, den Schmugglerpfad", wenn: (A, h) => A.merker.nisk_dabei || h.hat(A, "schattenlaeufer"), setzt: { weg_pfad: true }, weiter: "pfad" },
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
      text: (A) => [
        "Vier kleine Glocken hängen am Joch, jede mit einem Tier: Rabe, Lamm, Taube, Wolf. Darunter eine Inschrift: *Wer die Brüder ruft, ruft sie in ihrer Ordnung.*",
        "Die Grabplatten ringsum tragen Verse. Jede Person liest auf ihrem Handy, was ihre Figur auf ihrer Platte findet. Nur gemeinsam ergibt sich die Reihenfolge.",
        A.merker.gruft_raetsel_fehl ? "Die falschen Töne hallen noch nach. Irgendwo in den Nischen knirscht es." : "",
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
        { id: "platten", text: "Die Grabplatten genauer lesen", setzt: { coldric_name: true }, antwort: "Auf einer fünften Platte, größer als die anderen: *Coldric, Wächter des Siegels. Er schwor, nicht zu ruhen, bis das Siegel hält.* Darunter ist die Nische leer." },
        { id: "nische", text: "Die verschlossene Nische öffnen", wenn: (A) => A.merker.schluessel, setzt: { umhang: true }, antwort: "Der rostige Schlüssel aus dem Klostergarten passt. In der Nische liegt ein Umhang aus dunkler Wolle, der das Licht zu schlucken scheint: der **Umhang der Dämmerung**." },
        { id: "jorek", text: "Den Toten in der letzten Nische ansehen", setzt: (A) => ({ vater_gefunden: true, medaillon: Boolean(A.merker.wenna_versprechen) }),
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
      beimEintritt: (A, h) => (h.hat(A, "schattenlaeufer") ? { setzt: { ring: true } } : null),
      text: (A, h) => [
        "Hinter der Pilzkammer: ein verlassenes Lager. Lumpen, eine erkaltete Feuerstelle, Spielzeug aus Knochen. Die Kobolde sind tiefer geflohen, in aller Eile.",
        "In einer Kiste: drei Heiltränke, sorgfältig in Moos gewickelt, und ein Beutel Münzen.",
        A.merker.nisk_dabei ? "Nisk steht in der Mitte des Lagers und sagt nichts. Es ist sein Zuhause." : "",
        h.hat(A, "schattenlaeufer") ? "Darian findet unter der Feuerstelle ein Geheimfach. Darin ein Ring aus dunklem Metall, kalt wie Wasser." : "",
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
        { id: "zuruecklassen", text: "Ihn zurücklassen – wir holen ihn auf dem Rückweg", setzt: { tam_zurueck: true }, weiter: "tam_folge" },
      ],
    },
    tam_folge: {
      art: "erzaehlung", abschnitt: 2, titel: "Tam", ort: "Der Schacht", weiter: "bibliothek", rastErlaubt: true,
      beimEintritt: (A, h) => (A.merker.tam_gerettet && !(h.hat(A, "schildwaechter") || h.hat(A, "tiergefaehrte")) ? { glocke: 1 } : null),
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
        erfolg: { text: (A) => TAGEBUCH(A, true), setzt: { wahrheit_frueh: true }, weiter: "abschnitt2_ende" },
        knapp: { text: "Nur Bruchstücke: „… das Siegel nimmt, was es hält … ich bin der Letzte … verzeiht mir, dass ich läute …“ Der Rest ist verlaufen.", setzt: { wahrheit_halb: true }, weiter: "abschnitt2_ende" },
        fehl: { text: "Die Seiten zerfallen unter euren Fingern. Ihr erfahrt nichts.", weiter: "abschnitt2_ende" } },
    },
    tagebuch_lyra: {
      art: "erzaehlung", abschnitt: 2, titel: "Anselms Tagebuch", ort: "Die alte Bibliothek", weiter: "abschnitt2_ende",
      beimEintritt: () => ({ setzt: { wahrheit_frueh: true } }),
      text: (A) => ["Lyra liest das Tagebuch in einem Zug. Sie braucht keine Probe: Sie kennt die alte Kurzschrift der Mönche.", TAGEBUCH(A, true)],
    },
    abschnitt2_ende: {
      art: "ende", abschnitt: 2, titel: "Ende von Abschnitt 2", ort: "Die alte Bibliothek",
      text: (A) => [
        "Hinter der Bibliothek führt eine Treppe in die Tiefe. Von unten steigt Wärme auf, und ein Geruch nach Asche.",
        "**Abschnitt 3 – Das Siegel** ist in Arbeit. Euer Spielstand ist gespeichert.",
        `Bisher: Die Glocke hat ${A.glocke}× geschlagen. ${A.merker.tam_gerettet ? "Tam ist gerettet, und ihr kennt einen Namen. " : A.merker.tam_zurueck ? "Tam hängt noch im Netz. " : ""}${A.merker.vater_gefunden ? "Ihr habt Jorek Hald gefunden. " : ""}${A.merker.wahrheit_frueh ? "Ihr kennt Anselms Geheimnis. " : ""}`,
      ],
    },
    grauwacht_behaelt: {
      art: "ende", abschnitt: 0, titel: "Grauwacht behält euch", ort: "",
      text: ["Die Glocke läutet weiter. Im nächsten Jahr kommt eine neue Gruppe nach Halmbruck. Eure Namen stehen auf ihrer Karte."],
    },
  };
  const API = { START: "prolog", NIEDERLAGE: "grauwacht_behaelt", SZENEN, KARTEN };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABD = API;
})(typeof window !== "undefined" ? window : globalThis);
