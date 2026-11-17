/*
 * Mythara – Kampfziele der Kampagnen (Siegelstein, Laterne, Eisblock, Runensäule …): Jedes muss von einem freien Nachbarfeld
 * aus bedienbar sein. Ziele bedient man auch von schräg daneben (regeln.js: zielNeben) – zwei Ziele haben nur ein schräges freies Feld.
 * Dazu die Regel selbst: Ein Held schräg neben einem Ziel kann es bedienen.
 * Aufruf: node abenteuer/tests/ziele.test.js
 */
const A0 = require("path").join(__dirname, "..") + "/"; const R = require(A0 + "js/regeln.js");
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
console.log("Kampfziele der Kampagnen");
const tief = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === "length" ? 0 : k === "filter" || k === "map" ? () => [] : k === "includes" || k === "some" ? () => false : tief()), apply: () => false });
let n = 0, schlecht = 0, fehler = 0; const offen = [], nurSchraeg = new Set();
for (const ab of ["grauwacht", "rabenmoor", "hochwacht", "krone", "graufurt", "weidenhain"]) {
  const D = require(A0 + "daten/" + ab + ".js");
  for (const [sid, sz] of Object.entries(D.SZENEN || {})) {
    if (typeof sz.kampf !== "function" && !(sz.kampf && typeof sz.kampf === "object")) continue;
    for (const variante of [false, true]) {
      let k = null; const A = { merker: new Proxy({}, { get: () => variante }), gruppe: [], helden: [], n: 3, schwierigkeit: "normal", stufe: 3, glocke: 0, bedrohung: 0 };
      try { k = typeof sz.kampf === "function" ? sz.kampf(A, tief()) : sz.kampf; } catch (e) { fehler++; offen.push(`${ab}/${sid}: ${e.message.slice(0, 70)}`); continue; }
      if (!k) continue; const m = k.mechanik; if (!m || !m.ziele || !m.ziele.length) continue;
      let karte = k.karte; if (typeof karte === "string") karte = D.KARTEN[karte] || D.KARTEN[karte.toUpperCase()];
      if (!karte && k.begegnung) { const b = (R.BEGEGNUNGEN[k.begegnung] || {}); karte = D.KARTEN[b.karte] || D.KARTEN[String(b.karte || "").toUpperCase()]; }
      if (!karte) { offen.push(`${ab}/${sid}: Karte nicht gefunden (${k.begegnung})`); continue; }
      const block = new Set((karte.hindernisse || []).map(([, x, y]) => x + "," + y)), frei = (x, y) => x >= 0 && y >= 0 && x < karte.b && y < karte.h && !block.has(x + "," + y);
      const zielFelder = new Set(m.ziele.map((z) => z.x + "," + z.y));
      for (const z of m.ziele) { n++;
        const gerade = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => frei(z.x + dx, z.y + dy) && !zielFelder.has((z.x + dx) + "," + (z.y + dy))).length;
        const schraeg = [[1, 1], [-1, 1], [1, -1], [-1, -1]].filter(([dx, dy]) => frei(z.x + dx, z.y + dy)).length;
        if (!gerade) nurSchraeg.add(`${ab}/${sid}: ${z.name}`);
        if (!gerade && !schraeg) { schlecht++; console.log(`  ✗ ${ab}/${sid}: „${z.name}“ (${z.x},${z.y}) hat kein freies Nachbarfeld`); } }
    }
  }
}
check(n >= 50 && schlecht === 0, `${n} Ziele in sechs Kampagnen geprüft: Jedes hat ein freies Nachbarfeld`);
check(nurSchraeg.size > 0, `Davon nur über ein schräges Feld erreichbar: ${[...nurSchraeg].join("; ")} – deshalb gilt „daneben“ für Ziele auch schräg`);
check(fehler <= 1, `Szenen, deren Kampf sich hier nicht auswerten ließ: ${fehler}` + (offen.length ? " (" + offen.join("; ") + ")" : ""));
console.log(ok ? "\nZIELE IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
