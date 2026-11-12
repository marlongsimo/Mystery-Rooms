/*
 * Die letzte Fackel von Hochwacht – Auswertung (Normal oder --hardcore)
 * 1. Siegchance und übriges Leben je Kampf und Gruppengröße (frischer Kampf, Stufe der Begegnung, eingebaute KI, mit Sera)
 *    Niederlage = Rückzug oder Sera verschleppt
 * 2. Helden-Ranking: Siegquote, übriges Leben und wie oft die Figur zu Boden ging – über alle Kämpfe und Größen
 * Aufruf: node abenteuer/tools/auswertung-hochwacht.js [N=150] [--hardcore]
 */
"use strict";
const R = require("../js/regeln.js"), F = R.FD, D = require("../daten/hochwacht.js"), K = D.KARTEN;
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 150, HARD = process.argv.includes("--hardcore");
const tp = (akt, n) => ({ 1: n >= 5 ? 18 : 14, 2: n >= 5 ? 28 : 22, 3: n >= 5 ? 40 : 30 })[akt];
const esk = (k) => (n) => Object.assign(D.ESKORTE[k].begleiter(tp(D.ESKORTE[k].akt, n)), { titel: "Botin" });
const fess = (karte, akt) => (n) => ({ name: "Sera Venn", titel: "gefesselt", tp: Math.ceil(tp(akt, n) / 2), start: karte.start.begleiter, route: [], ausgang: false, gefesselt: true });
const KAMPF = [
  ["pass", "1 · Hinterhalt am Pass (Haupt)", K.PASS, esk("pass")],
  ["pass", "  · Jägerlager (Neben, Rettung)", K.LAGER, fess(K.LAGER, 1)],
  ["tor", "  · Wächter aus Stein (Neben)", K.TOR, null],
  ["archiv", "  · Archivgang (Neben)", K.ARCHIV, null],
  ["wacht", "2 · Die stumme Wacht (Haupt)", K.HOF, esk("wacht")],
  ["hauptmann", "  · Jägerhauptmann (Neben)", K.GRAT, null],
  ["wehrgang", "3 · Der offene Wehrgang (Haupt)", K.WEHRGANG, esk("wehrgang")],
  ["finale", "4 · Das letzte Licht (Haupt)", K.HOCHWARTE, esk("finale")],
];
const GR = [3, 4, 5, 6];
const held = {}; for (const f of F.REIHE) held[f] = { k: 0, s: 0, tp: 0, boden: 0 };
const zeilen = [];
for (const [beg, name, karte, beg2] of KAMPF) {
  const z = [name];
  for (const n of GR) {
    const r = R.rng(name.length * 1000 + n); let s = 0, leben = 0;
    for (let i = 0; i < N; i++) {
      const g = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
      const st = R.neuesSpiel(7e6 + n * 1e4 + i + name.length * 7, { figuren: g, stufe: R.BEGEGNUNGEN[beg].stufe, begegnung: beg, karte, keinAnfuehrer: true,
        schwierigkeit: HARD ? "hardcore" : "normal", beute: false, begleiter: beg2 ? beg2(n) : undefined });
      const unten = {}; let k = 0;
      while (!st.ende && k++ < 3000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); for (const f of R.spielerFiguren(st)) if (f.tp <= 0) unten[f.fid] = true; }
      const sieg = st.ende === "sieg", sp = R.spielerFiguren(st);
      const l = sieg ? sp.reduce((a, f) => a + Math.max(0, f.tp) / f.tpMax, 0) / sp.length : 0;
      if (sieg) s++; leben += l;
      for (const f of sp) { const h = held[f.fid]; h.k++; if (sieg) h.s++; h.tp += sieg ? Math.max(0, f.tp) / f.tpMax : 0; if (unten[f.fid]) h.boden++; }
    }
    z.push(`${Math.round(s / N * 100)} % (${Math.round(leben / N * 100)})`);
  }
  zeilen.push(z);
}
console.log(`Siegchance je Kampf · ${HARD ? "Hardcore" : "Normal"} · ${N} zufällige Gruppen je Feld · in Klammern: übriges Leben der Gruppe in %`);
console.log("Kampf".padEnd(36) + GR.map((n) => `${n} Helden`.padStart(13)).join(""));
for (const z of zeilen) console.log(z[0].padEnd(36) + z.slice(1).map((x) => x.padStart(13)).join(""));
console.log("\nHelden-Ranking (alle Hochwacht-Kämpfe, 3–6 Helden): Siegquote der Gruppen mit dieser Figur · eigenes übriges Leben · wie oft am Boden");
const liste = F.REIHE.map((f) => ({ f, q: held[f].s / held[f].k, tp: held[f].tp / held[f].k, b: held[f].boden / held[f].k })).sort((a, b) => b.q - a.q || b.tp - a.tp);
liste.forEach((x, i) => console.log(`${String(i + 1).padStart(2)}. ${(F.FIGUREN[x.f].name + " (" + F.KLASSEN[F.FIGUREN[x.f].klasse].name + ")").padEnd(28)} ${(x.q * 100).toFixed(1).padStart(5)} %   Leben ${(x.tp * 100).toFixed(0).padStart(3)} %   am Boden ${(x.b * 100).toFixed(0).padStart(3)} %`));
