/*
 * Das Moor der stummen Lichter – Auswertung (Normal oder --hardcore)
 * 1. Siegchance und übriges Leben je Kampf und Gruppengröße (frischer Kampf, Stufe der Begegnung, eingebaute KI)
 * 2. Helden-Ranking: Siegquote, übriges Leben und wie oft die Figur zu Boden ging – über alle Kämpfe und Größen
 * Aufruf: node abenteuer/tools/auswertung-moor.js [N=300] [--hardcore]
 */
"use strict";
const R = require("../js/regeln.js"), F = R.FD, MO = require("../daten/rabenmoor.js");
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 300, HARD = process.argv.includes("--hardcore");
const KAMPF = { moor_rand: ["Bohlenweg", MO.KARTEN.BOHLENWEG], moor_kroeten: ["Ried (Abschnitt 1)", MO.KARTEN.RIED], moor_kroeten2: ["Ried, verirrt (Abschnitt 2)", MO.KARTEN.RIED], moor_tote: ["Totenpfad", MO.KARTEN.TOTENPFAD], moor_schrein: ["Schrein – Alwine", MO.KARTEN.SCHREIN] };
const held = {}; for (const f of F.REIHE) held[f] = { k: 0, s: 0, tp: 0, boden: 0 };
const zeilen = [];
for (const [beg, [name, karte]] of Object.entries(KAMPF)) {
  const z = [name];
  for (const n of [2, 3, 4, 5, 6]) {
    const r = R.rng(beg.length * 1000 + n); let s = 0, leben = 0;
    for (let i = 0; i < N; i++) {
      const g = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
      const st = R.neuesSpiel(9e6 + n * 1e4 + i + beg.length * 7, { figuren: g, stufe: R.BEGEGNUNGEN[beg].stufe, begegnung: beg, karte, schwierigkeit: HARD ? "hardcore" : "normal", beute: false });
      const unten = {}; let k = 0;
      while (!st.ende && k++ < 1500) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); for (const f of R.spielerFiguren(st)) if (f.tp <= 0) unten[f.fid] = true; }
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
console.log("Kampf".padEnd(30) + [2, 3, 4, 5, 6].map((n) => `${n} Helden`.padStart(14)).join(""));
for (const z of zeilen) console.log(z[0].padEnd(30) + z.slice(1).map((x) => x.padStart(14)).join(""));
console.log("\nHelden-Ranking (alle Moor-Kämpfe, 2–6 Helden): Siegquote der Gruppen mit dieser Figur · eigenes übriges Leben · wie oft am Boden");
const liste = F.REIHE.map((f) => ({ f, q: held[f].s / held[f].k, tp: held[f].tp / held[f].k, b: held[f].boden / held[f].k })).sort((a, b) => b.q - a.q || b.tp - a.tp);
liste.forEach((x, i) => console.log(`${String(i + 1).padStart(2)}. ${(F.FIGUREN[x.f].name + " (" + F.KLASSEN[F.FIGUREN[x.f].klasse].name + ")").padEnd(28)} ${(x.q * 100).toFixed(1).padStart(5)} %   Leben ${(x.tp * 100).toFixed(0).padStart(3)} %   am Boden ${(x.b * 100).toFixed(0).padStart(3)} %`));
