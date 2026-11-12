/*
 * Helden-Ranking je Kampagne (Normal): Jede Kampfszene wird so aufgebaut wie im Spiel (S.kampfOptionen), mit zufälligen Gruppen
 * aus 3–6 Helden, gesteuert von der eingebauten KI. Gemessen je Held: Siegquote der Gruppen mit ihm, eigenes übriges Leben, wie oft am Boden.
 * Aufruf: node abenteuer/tools/auswertung-helden.js [N=30 Kämpfe je Szene und Gruppengröße] [--nur=krone,hochwacht] [--json=datei]
 */
"use strict";
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), F = R.FD;
for (const d of ["grauwacht", "rabenmoor", "hochwacht", "krone"]) require("../daten/" + d + ".js");
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 30, HARD = process.argv.includes("--hardcore");
const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : null; };
const NUR = (arg("nur") || "rabenmoor,grauwacht,hochwacht,krone").split(",");
const erg = {};
for (const ab of NUR) {
  const D = globalThis.ABD_ALLE[ab], held = {}; for (const f of F.REIHE) held[f] = { k: 0, s: 0, tp: 0, boden: 0 };
  const szenen = Object.entries(D.SZENEN).filter(([, s]) => s.art === "kampf");
  let kaempfe = 0, siege = 0;
  for (const [id, s] of szenen) for (const n of [3, 4, 5, 6]) for (let i = 0; i < N; i++) {
    const r = R.rng(id.length * 7919 + n * 104729 + i * 31 + ab.length), gruppe = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
    const A = S.neu(3e5 + i * 17 + n + id.length, { gruppe, abenteuer: ab, schwierigkeit: HARD ? "hardcore" : "normal" });
    A.szene = id; A.stufe = s.stufe || Math.min(3, s.abschnitt || 1);
    let o; try { o = S.kampfOptionen(A); } catch (e) { continue; }
    if (!o.stufe || s.stufe) o.stufe = A.stufe; else o.stufe = (R.BEGEGNUNGEN[o.begegnung] || {}).stufe || A.stufe;
    const st = R.neuesSpiel(5e6 + i * 13 + n * 7 + id.length, o); let k = 0;
    const unten = {};
    while (!st.ende && k++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); for (const f of R.spielerFiguren(st)) if (f.tp <= 0) unten[f.fid] = true; }
    const sieg = st.ende === "sieg"; kaempfe++; if (sieg) siege++;
    for (const f of R.spielerFiguren(st)) { const h = held[f.fid]; h.k++; if (sieg) h.s++; h.tp += sieg ? Math.max(0, f.tp) / f.tpMax : 0; if (unten[f.fid]) h.boden++; }
  }
  erg[ab] = { kaempfe, sieg: siege / kaempfe, helden: Object.fromEntries(F.REIHE.map((f) => [f, { q: held[f].s / held[f].k, tp: held[f].tp / held[f].k, b: held[f].boden / held[f].k }])) };
  const liste = F.REIHE.slice().sort((a, b) => erg[ab].helden[b].q - erg[ab].helden[a].q || erg[ab].helden[b].tp - erg[ab].helden[a].tp);
  console.log(`\n${D.META.titel} · ${szenen.length} Kampfszenen · ${kaempfe} Kämpfe · Sieg gesamt ${(siege / kaempfe * 100).toFixed(1)} %`);
  liste.forEach((f, i) => { const h = erg[ab].helden[f]; console.log(`${String(i + 1).padStart(2)}. ${(F.FIGUREN[f].name + " (" + F.KLASSEN[F.FIGUREN[f].klasse].name + ")").padEnd(26)} ${(h.q * 100).toFixed(1).padStart(5)} %  Leben ${(h.tp * 100).toFixed(0).padStart(3)} %  am Boden ${(h.b * 100).toFixed(0).padStart(3)} %`); });
}
if (arg("json")) require("fs").writeFileSync(arg("json"), JSON.stringify(erg));
