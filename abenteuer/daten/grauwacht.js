/*
 * Das Siegel von Grauwacht – Szenen (Abschnitt 1: Die Abtei)
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
      art: "lager", abschnitt: 1, titel: "Lagerfeuer im Kreuzgang", ort: "Abtei Grauwacht", aufstieg: 2, weiter: "abschnitt1_ende",
      text: (A, h) => [
        "Im Kreuzgang, zwischen eingestürzten Bögen, macht ihr Feuer. Der Regen hat aufgehört. Über euch der Turm, schwarz gegen die Wolken.",
        A.merker.nisk_dabei ? (A.merker.nisk_vertrauen >= 2 ? "Nisk hockt am Feuer und wärmt sich die Hände. „Der Alte im Keller flüstert“, sagt er leise. „Jede Nacht. Er verspricht. Er verspricht allen etwas. Auch euch, bald.“" : A.merker.nisk_vertrauen >= 1 ? "Nisk hockt etwas abseits. Als ihr ihn fragt, was unten wartet, sagt er nur: „Der Alte. Er flüstert.“" : "Nisk sitzt gefesselt im Dunkeln. Er spricht nicht. Einmal glaubt ihr, ihn lachen zu hören.") : "",
        "Ihr schlaft unruhig. Kurz vor Morgengrauen schlägt die Glocke einmal. Niemand ist im Turm. Niemand hat am Seil gezogen.",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    abschnitt1_ende: {
      art: "ende", abschnitt: 1, titel: "Ende von Abschnitt 1", ort: "Abtei Grauwacht",
      text: (A, h) => [
        "Hinter dem Altar der Abteikirche führt eine Treppe nach unten, in die Krypta.",
        A.merker.nisk_dabei ? "Nisk zupft euch am Ärmel und zeigt auf einen Spalt in der Wand, den ihr ohne ihn nie gesehen hättet." : "",
        "**Abschnitt 2 – Die Krypta** ist in Arbeit. Euer Spielstand ist gespeichert.",
        `Bisher: Die Glocke hat ${A.glocke}× geschlagen. ${A.merker.wenna_versprechen ? "Ihr habt Wenna ein Versprechen gegeben. " : ""}${A.merker.anselm_durchschaut ? "Ihr wisst, dass Anselm etwas verschweigt. " : ""}${A.merker.blutschuld ? "An euren Händen klebt Blut. " : ""}`,
      ],
    },
    grauwacht_behaelt: {
      art: "ende", abschnitt: 0, titel: "Grauwacht behält euch", ort: "",
      text: ["Die Glocke läutet weiter. Im nächsten Jahr kommt eine neue Gruppe nach Halmbruck. Eure Namen stehen auf ihrer Karte."],
    },
  };
  const API = { START: "prolog", NIEDERLAGE: "grauwacht_behaelt", SZENEN, KARTEN: { TURM } };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABD = API;
})(typeof window !== "undefined" ? window : globalThis);
