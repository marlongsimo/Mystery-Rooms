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
      gegner: [[9, 1], [9, 7], [10, 1], [10, 7], [8, 1], [8, 7], [11, 3], [11, 5], [10, 2], [10, 6], [9, 3], [9, 5]] },
    route: [[3, 4], [6, 4], [9, 4], [11, 4]],
  };
  const KARTEN = { PASS };

  const SZENEN = {
    prolog: {
      art: "erzaehlung", abschnitt: 1, titel: "Die Wegstation", ort: "Am Nordpass", weiter: "sera",
      text: [
        "Seit drei Nächten brennt im Norden ein Licht, wo seit vierzig Jahren keines mehr war: auf der Hochwarte, der alten Signalwarte des Wachtordens.",
        "In einer verlassenen Wegstation am Fuß des Passes findet ihr eine Frau, die auf euch gewartet hat. Ihr Mantel ist voller Schnee, in ihren Händen glimmt etwas, warm wie Glut und hell wie ein Stern.",
      ],
    },
    sera: {
      art: "erzaehlung", abschnitt: 1, titel: "Sera Venn", ort: "Die Wegstation", weiter: "kampf_pass",
      text: [
        "„Sera Venn“, sagt sie. „Botin des Wachtordens. Das hier ist ein Wachtfunke. Mit ihm lässt sich die Hochwarte öffnen – und die Spur zum nächsten Siegel entzünden.“",
        "„Sie wittern ihn. Die Siegeljäger. Ich kenne den Weg, aber ich kann nicht kämpfen. Bringt mich über den Pass.“",
        "Draußen knirscht Schnee. Jemand ist schon da.",
      ],
    },
    kampf_pass: {
      art: "kampf", abschnitt: 1, titel: "Hinterhalt am Pass", ort: "Der Pass",
      text: ["Die Jäger warten in den Felsnischen. Sera folgt dem Weg nach rechts zum Ausgang, bis zu 2 Felder zu Beginn jeder Runde, aber nur, wenn jemand von euch in der Nähe ist und das nächste Feld nicht direkt bedroht ist. Wer direkt neben ihr steht, fängt einen gezielten Angriff auf sie ab (Reaktion). Fällt sie, habt ihr bis zum Ende der nächsten Runde Zeit, sie zu stabilisieren."],
      kampf: (A) => ({ begegnung: "pass", karte: PASS, keinAnfuehrer: true, begleiter: { name: "Sera Venn", titel: "Botin des Wachtordens", tp: seraTP(A, 1), start: PASS.start.begleiter, route: PASS.route },
        sieg: { weiter: "nach_pass" }, gefangen: { weiter: "verschleppt" } }),
    },
    nach_pass: {
      art: "ende", abschnitt: 1, titel: "Über den Pass", ort: "Am Nordpass",
      text: ["Sera lehnt sich gegen einen Felsen und atmet. Der Wachtfunke in ihren Händen leuchtet ruhig.", "*Hier endet der Prototyp. Akt II und III folgen.*"],
    },
    verschleppt: {
      art: "ende", abschnitt: 1, titel: "Verschleppt", ort: "Am Nordpass",
      text: ["Die Jäger sind fort, und Sera mit ihnen. Im Schnee bleiben Spuren zurück, nach Norden.", "*Im fertigen Abenteuer folgt hier ein Rettungsabschnitt. Hier endet der Prototyp.*"],
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
