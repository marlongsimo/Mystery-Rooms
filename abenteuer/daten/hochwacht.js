/*
 * Die letzte Fackel von Hochwacht – ENTWURF (Prototyp der Eskorte, siehe KONZEPT-HOCHWACHT.md)
 * Bisher nur Akt I bis zum ersten Kampf: Sera Venn wird gefunden, Hinterhalt am Pass.
 * Im Hub nur sichtbar mit ?entwurf in der Adresse. Karten ohne Bild: M Fels, K niedriger Wall (Deckung), T Baum, Q Wasser.
 */
(function (root) {
  "use strict";
  const M = (x, y) => ["M", x, y], K = (x, y) => ["K", x, y], T = (x, y) => ["T", x, y], Q = (x, y) => ["Q", x, y];
  const ausText = (zeilen) => { const h = []; zeilen.forEach((z, y) => [...z].forEach((c, x) => { const f = { M, K, T, "~": Q }[c]; if (f) h.push(f(x, y)); })); return h; };
  /** Seras Lebenspunkte je Akt und Gruppengröße (Startwerte zum Testen, siehe KONZEPT-HOCHWACHT.md B2) */
  const seraTP = (A, akt) => { const gross = A.gruppe.filter((f) => !A.zust[f].tot).length >= 5; return { 1: gross ? 18 : 14, 2: gross ? 28 : 22, 3: gross ? 40 : 30 }[akt]; };

  /* ---------- Karten (12 × 9) ---------- */
  // Der Pass: ein schmaler Weg zwischen Felsen, links der Einstieg, rechts der Ausgang; oben und unten Felsnischen für den Hinterhalt
  const PASS = {
    name: "Der Pass", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "MM...MMM...M",
      "M.......K..M",
      "............",
      "............",
      "....K.......",
      "M..........M",
      "MM...MMM...M",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[0, 3], [0, 5], [2, 2], [2, 6]], begleiter: [0, 4],
      gegner: [[9, 1], [9, 7], [10, 1], [10, 7], [8, 1], [8, 7], [11, 3], [11, 5], [10, 2], [10, 6], [9, 3], [9, 5]],
      // Jäger: zuerst am Ausgang, ab dem zweiten auch aus den Felsnischen hinter der Gruppe
      jaeger: [[10, 4], [4, 1], [4, 7], [11, 4], [3, 1], [3, 7]] },
    route: [[3, 4], [6, 4], [9, 4], [11, 4]],
  };
  // Das Jägerlager (Rettung): eine Senke mit Zelten und Feuer, Sera gefesselt am Feuer; die Helden kommen von links
  const LAGER = {
    name: "Das Jägerlager", b: 12, h: 9, boden: "stein", bild: null,
    hindernisse: ausText([
      "MMMMMMMMMMMM",
      "M....TT....M",
      "M..K....K..M",
      "............",
      "......MKM...",
      "............",
      "M..K....K..M",
      "M....TT....M",
      "MMMMMMMMMMMM",
    ]),
    start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[0, 3], [0, 5], [2, 2], [2, 6]], begleiter: [10, 4],
      gegner: [[9, 3], [9, 5], [11, 3], [11, 5], [9, 2], [9, 6], [10, 2], [10, 6], [7, 3], [7, 5], [6, 2], [6, 6]] },
  };
  const KARTEN = { PASS, LAGER };

  const SZENEN = {
    /* ================= Akt I · Der Überfall am Pass ================= */
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Ein Licht im Norden", ort: "Am Nordpass", weiter: "vorgeschichte",
      text: [
        "Seit drei Nächten brennt im Norden ein Licht, wo seit vierzig Jahren keines mehr war: auf der Hochwarte, der alten Signalwarte des Wachtordens.",
        "Die Leute in den Tälern sagen, das Licht ruft. Wen, weiß niemand. Ihr seid auf dem Weg dorthin, als der Schnee einsetzt.",
      ],
    },
    vorgeschichte: {
      art: "wahl", abschnitt: 1, titel: "Was hinter euch liegt", ort: "Am Nordpass",
      text: ["Bevor es losgeht: Habt ihr das Siegel von Grauwacht schon erlebt? Wie endete es? (Das ändert einzelne Gespräche, nicht den Weg. Wer Grauwacht nicht kennt, wählt „Nicht dabei gewesen“.)"],
      optionen: [
        { id: "erneuert", text: "Wir haben das Siegel erneuert", setzt: { grauwacht: "erneuert" }, weiter: "wegstation" },
        { id: "gebrochen", text: "Wir haben das Siegel gebrochen", setzt: { grauwacht: "gebrochen", splitter: true }, weiter: "wegstation" },
        { id: "verrat", text: "Anselm hat uns verraten", setzt: { grauwacht: "verrat" }, weiter: "wegstation" },
        { id: "nicht", text: "Nicht dabei gewesen", setzt: { grauwacht: "nicht" }, weiter: "wegstation" },
      ],
    },
    wegstation: {
      art: "gespraech", abschnitt: 1, titel: "Die Wegstation", ort: "Am Fuß des Passes",
      text: (A) => [
        "In einer verlassenen Wegstation am Fuß des Passes wartet eine Frau, als hätte sie gewusst, dass ihr kommt. Ihr Mantel ist voller Schnee, in ihren Händen glimmt etwas, warm wie Glut und hell wie ein Stern.",
        "„Sera Venn“, sagt sie. „Botin des Wachtordens. Und ihr seid spät.“",
        A.merker.grauwacht === "gebrochen" ? "Der Splitter von Grauwacht in eurem Gepäck summt, als sie näher kommt. Sera hört es auch. Sie wird blass." : "",
      ],
      optionen: [
        { id: "funke", text: "Nach dem Leuchten in ihren Händen fragen", wer: "Sera", frage: "„Was trägst du da?“",
          antwort: "„Einen Wachtfunken. Den letzten. Mit ihm lässt sich die Hochwarte öffnen und das Signal entzünden. Dann sehen wir, wo das nächste Siegel liegt.“ Sie schließt die Finger darum. „Und alles, was Siegel hasst, kann ihn riechen.“" },
        { id: "jaeger", text: "Nach ihren Verfolgern fragen", wer: "Sera", frage: "„Wer ist hinter dir her?“",
          antwort: "„Siegeljäger. Sie verkaufen, was in den Siegeln steckt, an wen auch immer. Sie wollen nicht euch. Sie wollen mich und den Funken. Wenn ihr kämpft: Lasst sie nicht an mich heran.“", setzt: { jaeger_bekannt: true } },
        { id: "grauwacht", text: "Von Grauwacht erzählen", wer: "Sera", frage: "„Wir kommen aus Grauwacht.“", wenn: (A) => A.merker.grauwacht && A.merker.grauwacht !== "nicht",
          antwort: (A) => A.merker.grauwacht === "erneuert" ? "Sera atmet aus. „Dann hält eines. Gut. Der Orden wird es euch nicht vergessen.“" : A.merker.grauwacht === "gebrochen" ? "„Gebrochen.“ Sie sagt es leise. „Dann wissen die Jäger, dass es sich lohnt. Sie werden früher kommen.“" : "„Anselm“, sagt sie nur. „Seine Briefe haben die Jäger hierher geführt. Ich hatte gehofft, es wäre nicht wahr.“",
          setzt: (A) => (A.merker.grauwacht === "gebrochen" || A.merker.grauwacht === "verrat" ? { jaeger_frueh: true } : { orden_dank: true }) },
        { id: "vorraete", text: "Die Station nach Vorräten durchsuchen", frage: "Ihr durchsucht Regale und Kisten.",
          probe: { name: "Suchen", attr: "WEI", sg: 12, geuebt: ["schurke", "waldlaeufer"], knapp: true,
            erfolg: { text: "Hinter einem losen Brett: zwei Heiltränke und ein Seil. Jemand vom Orden hat vorgesorgt.", tranke: 2, setzt: { seil: true } },
            knapp: { text: "Ein einzelner Heiltrank, halb eingefroren.", tranke: 1 },
            fehl: { text: "Nur leere Flaschen und Mäusedreck." } } },
        { id: "los", text: "Aufbrechen, solange es hell ist", weiter: "route" },
      ],
    },
    route: {
      art: "probe", abschnitt: 1, titel: "Der Weg hinauf", ort: "Der Nordpass",
      text: (A) => ["Der Pass windet sich zwischen Felsen nach oben. Wer kennt sich mit Bergen aus? Eine Person führt.", A.merker.jaeger_bekannt ? "Ihr wisst, wonach ihr Ausschau halten müsst: Vorteil." : ""],
      probe: { name: "Orientierung", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], vorteil: (A) => (A.merker.jaeger_bekannt ? 1 : 0), knapp: true,
        erfolg: { text: "Ihr seht die Spuren im Schnee, bevor ihr in die Falle lauft. Die Jäger in den Felsnischen haben euch noch nicht bemerkt.", setzt: { pass_ueberrascht: true }, weiter: "kampf_pass" },
        knapp: { text: "Ihr findet den Weg, aber nicht die Spuren. Dann knirscht Schnee in den Felsen.", weiter: "kampf_pass" },
        fehl: { text: "Ihr verlauft euch im Schneetreiben und findet erst spät zurück. Die Kälte kriecht in die Knochen.", glocke: 1, weiter: "kampf_pass" } },
    },
    kampf_pass: {
      art: "kampf", abschnitt: 1, titel: "Hinterhalt am Pass", ort: "Der Pass",
      text: ["Die Jäger warten in den Felsnischen. Sera folgt dem Weg nach rechts zum Ausgang, bis zu 2 Felder zu Beginn jeder Runde, aber nur, wenn jemand von euch in der Nähe ist und das nächste Feld nicht direkt bedroht ist. Wer direkt neben ihr steht, fängt einen gezielten Angriff auf sie ab (Reaktion). Fällt sie, habt ihr bis zum Ende der nächsten Runde Zeit, sie zu stabilisieren."],
      kampf: (A) => ({ begegnung: "pass", karte: PASS, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.pass_ueberrascht), skalaMal: A.merker.jaeger_frueh ? 1.1 : 1,
        begleiter: { name: "Sera Venn", titel: "Botin des Wachtordens", tp: seraTP(A, 1), start: PASS.start.begleiter, route: PASS.route },
        sieg: { weiter: "wachmann" }, gefangen: { weiter: "verschleppt" } }),
    },
    wachmann: {
      art: "wahl", abschnitt: 1, titel: "Der Wachmann", ort: "Hinter dem Pass", rastErlaubt: true,
      text: [
        "Hinter dem Pass, im Windschatten eines Felsens, sitzt ein Mann in einem zerrissenen Ordensmantel. Brann, sagt Sera, einer der letzten Wachleute. Sein Bein ist gebrochen. Die Jäger haben ihn liegen lassen, um euch aufzulauern.",
        "„Nehmt mich mit“, sagt er. „Ich kenne die Ruine. Ich weiß, wie man das Tor öffnet.“ Mit ihm kommt ihr langsamer voran. Stimmt ab.",
      ],
      optionen: [
        { id: "mit", text: "Brann mitnehmen (langsamer, aber er kennt die Ruine)", setzt: { brann_dabei: true }, glocke: 1, weiter: "lager_akt1" },
        { id: "station", text: "Ihn mit Vorräten zur Wegstation zurückschicken (ein Heiltrank weniger)", setzt: { brann_station: true }, trankWeg: 1, weiter: "lager_akt1" },
        { id: "zurueck", text: "Ihn zurücklassen", setzt: { brann_zurueck: true }, weiter: "lager_akt1" },
      ],
    },
    // ----- Rettung: Sera wurde verschleppt -----
    verschleppt: {
      art: "probe", abschnitt: 1, titel: "Spuren im Schnee", ort: "Hinter dem Pass",
      text: ["Die Jäger sind fort, und Sera mit ihnen. Im frischen Schnee: Schleifspuren, Stiefelabdrücke, ein Tropfen Blut. Ihr müsst ihnen folgen, bevor der Wind alles zuweht. Alle suchen; gelingt es der Hälfte, findet ihr den Weg."],
      probe: { name: "Spuren lesen", wer: "gruppe", attr: "WEI", sg: 12, geuebt: ["waldlaeufer"], knapp: true,
        erfolg: { text: "Die Spuren führen in eine Senke. Rauch steigt auf. Ihr seid da, bevor sie weiterziehen.", setzt: { lager_ueberrascht: true }, weiter: "kampf_lager" },
        knapp: { text: "Ihr findet das Lager, aber erst nach langem Suchen in der Kälte.", glocke: 1, weiter: "kampf_lager" },
        fehl: { text: "Der Wind ist schneller. Als ihr das Lager endlich findet, ist es tief in der Nacht.", glocke: 2, weiter: "kampf_lager" } },
    },
    kampf_lager: {
      art: "kampf", abschnitt: 1, titel: "Das Jägerlager", ort: "Eine Senke im Schnee",
      text: ["Sera liegt gefesselt am Feuer, rechts in der Senke. Die Jäger sind müde, aber sie sind viele. Besiegt sie, dann ist Sera frei."],
      kampf: (A) => ({ begegnung: "pass", karte: LAGER, keinAnfuehrer: true, ueberraschung: Boolean(A.merker.lager_ueberrascht),
        begleiter: { name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(seraTP(A, 1) / 2), start: LAGER.start.begleiter, route: [], ausgang: false, gefesselt: true },
        sieg: { weiter: "befreit" }, gefangen: { weiter: "kampf_lager", glocke: 1 } }),
    },
    befreit: {
      art: "erzaehlung", abschnitt: 1, titel: "Befreit", ort: "Das Jägerlager", weiter: "wachmann", rastErlaubt: true,
      beimEintritt: () => ({ setzt: { sera_befreit: true } }),
      text: ["Ihr schneidet die Fesseln durch. Sera reibt sich die Handgelenke. Der Wachtfunke ist noch da, versteckt in ihrem Ärmel. „Sie haben nicht gesucht“, sagt sie. „Sie dachten, sie hätten Zeit.“", "Sie sieht euch an. „Danke. Das vergesse ich nicht.“"],
    },
    lager_akt1: {
      art: "lager", abschnitt: 1, titel: "Lagerfeuer in der Schutzhütte", ort: "Eine Hütte am Grat", aufstieg: 2, weiter: "akt2_entwurf",
      text: (A) => [
        "Eine alte Schutzhütte des Ordens, halb eingeschneit. Ihr macht Feuer, und zum ersten Mal seit Stunden spürt ihr eure Finger wieder.",
        A.merker.brann_dabei ? "Brann zeichnet mit einem verkohlten Stock die Ruine auf den Boden: zwei Tore, ein Hof, in der Mitte das Signalgerät. „Das Gerät braucht zwei Herzschläge Zeit“, sagt er. „Zwei Runden, in denen niemand stört.“" : "",
        A.merker.sera_befreit ? "Sera sitzt nah am Feuer und schweigt lange. Dann erzählt sie von ihrer Schwester, die auch Botin war, und nicht zurückkam." : "Sera erzählt vom Orden, von den sieben Siegeln, von einer Zeit, als auf jedem Gipfel ein Licht brannte.",
        "Ihr seid stärker geworden. **Stufe 2.**",
      ],
    },
    akt2_entwurf: {
      art: "ende", abschnitt: 2, titel: "Die stumme Wacht", ort: "Vor der Ordensruine",
      text: ["Am Morgen seht ihr sie: die Ruine des Wachtordens, schwarz gegen den Schnee.", "*Hier endet der Prototyp. Akt II (die stumme Wacht) und Akt III (das letzte Licht) folgen.*"],
    },
    hochwacht_verloren: { art: "ende", abschnitt: 0, titel: "Die Nordwarte verstummt", ort: "", text: ["Der Wind trägt Schnee über eure Spuren. Im Norden erlischt ein Licht."] },
  };
  const WISSEN = {
    siegeljaeger: { klassen: ["schurke", "waldlaeufer"], text: "Jagt die Begleiterin: Sieht er Sera, geht er auf sie los. Wer ihm den Weg verstellt, wird statt ihrer angegriffen." },
    jaegerschuetze: { klassen: ["waldlaeufer"], text: "Schießt aus 6 Feldern bevorzugt auf Sera. Deckung oder ein Held neben ihr (Abfangen) schützt sie." },
  };
  const META = {
    id: "hochwacht", schwierigkeit: 3, entwurf: true, titel: "Die letzte Fackel von Hochwacht", kurz: "Hochwacht", untertitel: "Ein Eskorte-Abenteuer im Norden (Entwurf)",
    kurztext: "Bringt die Botin Sera Venn durch einen belagerten Pass zur Hochwarte.",
    min: 3, max: 6, stufen: "1–3", dauer: "3–4 Stunden", abschnitte: 3, enden: 3, bild: null,
    uhr: { name: "Kälte", max: 7, mehr: "Der Wind wird schärfer.", weniger: "Der Wind legt sich ein wenig.", unruhe: "die Kälte lässt niemanden ganz schlafen", rueckzug: "Der Wind wird schärfer." },
    gruppe: "Die Fackelträger", aufbruch: "Über den Pass", niederlage: "Die Nordwarte verstummt", chronik: "Chronik von Hochwacht",
    abschnitte_namen: { 1: "Der Überfall am Pass", 2: "Die stumme Wacht", 3: "Das letzte Licht" },
  };
  const API = { META, EREIGNISSE: [], WISSEN, START: "prolog", NIEDERLAGE: "hochwacht_verloren", SZENEN, KARTEN };
  root.ABD_ALLE = root.ABD_ALLE || {}; root.ABD_ALLE.hochwacht = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
