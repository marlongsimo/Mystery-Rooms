/*
 * Probekämpfe für die Mechaniken der Krone (KONZEPT-KRONE.md K6) – keine echten Kampagnenkämpfe, nur zum Prüfen der Automatik.
 * A „Marktplatz“: drei Siegelsteine (zwei genügen, ein Kälterufer weckt sie wieder), Verstärkung aus zwei Hauszugängen, brüchiges Eis
 * B „Tor“: Eisenhirte mit Runenschild (zwei Runensäulen), Bodenstoß, Phase 2, Kettenbestie mit Rückstoß, Runenleser mit Eiswänden
 * Aufruf: node abenteuer/tools/mechanik-sim.js [N=200]
 */
"use strict";
const R = require("../js/regeln.js"), F = R.FD;
const text = (zeilen) => zeilen.flatMap((z, y) => [...z].map((c, x) => (c === "M" ? ["M", x, y] : c === "K" ? ["K", x, y] : null)).filter(Boolean));
const PLATZ = { name: "Probeplatz", b: 12, h: 9, boden: "stein", hindernisse: text(["MMMMM..MMMMM", "M..........M", "M..K....K..M", "M..........M", "...........M", "M..........M", "M..K....K..M", "M..........M", "MMMMM..MMMMM"]),
  start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[3, 4], [3, 3], [3, 5], [2, 2]], gegner: [[9, 4], [9, 3], [9, 5], [10, 4], [10, 2], [10, 6], [8, 2], [8, 6]] } };
const eisFelder = []; for (let x = 4; x <= 7; x++) for (let y = 3; y <= 5; y++) eisFelder.push([x, y]);
const PROBE = {
  markt: (n) => ({ gegner: [{ art: "frostknecht", anzahl: Math.max(1, Math.round(n * 0.35)) }, { art: "eisgezeichneter", anzahl: Math.round(n * 0.7) }, { art: "kaelterufer", anzahl: 1 }],
    mechanik: { ziele: [{ id: "s1", name: "Siegelstein Nord", art: "siegelstein", x: 8, y: 2, runden: 2, ruhe: true, umkehrbar: true }, { id: "s2", name: "Siegelstein Mitte", art: "siegelstein", x: 7, y: 4, runden: 2, ruhe: true, umkehrbar: true }, { id: "s3", name: "Siegelstein Süd", art: "siegelstein", x: 8, y: 6, runden: 2, ruhe: true, umkehrbar: true }],
      sieg: { ziele: 2, art: "siegelstein", text: "Zwei Siegelsteine schweigen – der Platz ist frei." },
      wellen: [{ id: "haus", name: "Die Hauszugänge", kurz: "aus den Häusern", quellen: [[5, 0], [6, 8]], gegner: [["eisgezeichneter", 0.35, 3, 0]], alle: 2, ab: 3, max: 3, an: "kaelterufer", text: "Hinter den Türen kratzt es" }],
      eis: { felder: eisFelder, proRunde: 1, ab: 3 } } }),
  tor: (n) => ({ gegner: [{ art: "eisenhirte", anzahl: 1, tpFaktor: 0.8 + n * 0.12 }, { art: "kettenbestie", anzahl: n >= 5 ? 1 : 0 }, { art: "runenleser", anzahl: n >= 4 ? 1 : 0 }, { art: "frostknecht", anzahl: Math.round(n * 0.3) }].filter((g) => g.anzahl),
    mechanik: { ziele: [{ id: "r1", name: "Runensäule West", art: "saeule", x: 4, y: 1, runden: 2, ruhe: true, wirkung: { schild: true } }, { id: "r2", name: "Runensäule Ost", art: "saeule", x: 4, y: 7, runden: 2, ruhe: true, wirkung: { schild: true } }],
      schild: { art: "eisenhirte", ziele: ["r1", "r2"], halt: 18, pause: 2, text: "Runenschild" } } }),
};
function lauf(N = 200, still = true) {
  const erg = { n: 0, haengt: 0, siege: 0, zieleErledigt: 0, zielSiege: 0, getroffen: 0, ausgewichen: 0, wellen: 0, eisLoecher: 0, runden: 0, zeilen: [] };
  for (const [name, bau] of Object.entries(PROBE)) for (const n of [3, 4, 5, 6]) {
    let s = 0, r = 0;
    for (let i = 0; i < N / 8; i++) {
      const zr = R.rng(i * 31 + n * 7 + name.length), g = F.REIHE.slice().sort(() => zr() - 0.5).slice(0, n), b = bau(n);
      const st = R.neuesSpiel(5e5 + i * 13 + n, { figuren: g, stufe: 2, karte: PLATZ, keinAnfuehrer: true, zusatzGegner: 0, gegner: b.gegner, mechanik: b.mechanik });
      let k = 0; while (!st.ende && k++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
      erg.n++; if (!st.ende) erg.haengt++;
      if (st.ende === "sieg") { s++; erg.siege++; if (st.mech.sieg && /Siegelsteine schweigen/.test(st.log[st.log.length - 1].t)) erg.zielSiege++; }
      erg.zieleErledigt += st.mech.ziele.filter((z) => z.fertig).length; erg.getroffen += st.mech.stat.getroffen; erg.ausgewichen += st.mech.stat.ausgewichen;
      erg.wellen += st.mech.wellen.reduce((a, w) => a + w.gekommen, 0); erg.eisLoecher += st.karte.hindernisse.filter(([t]) => t === "L").length; r += st.runde; erg.runden += st.runde;
    }
    erg.zeilen.push(`${name.padEnd(6)} ${n} Helden: Sieg ${Math.round(s / (N / 8) * 100)} % · Runden ${(r / (N / 8)).toFixed(1)}`);
  }
  erg.sieg = erg.siege / erg.n;
  if (!still) { console.log(erg.zeilen.join("\n")); console.log(`\n${erg.n} Kämpfe · hängt ${erg.haengt} · Ziele erledigt ${erg.zieleErledigt} · Siege über Ziele ${erg.zielSiege} · Flächen: ${erg.ausgewichen} ausgewichen, ${erg.getroffen} getroffen · Wellen ${erg.wellen} · Eislöcher ${erg.eisLoecher}`); }
  return erg;
}
if (require.main === module) lauf(+process.argv[2] || 200, false);
module.exports = { lauf, PLATZ, PROBE };
