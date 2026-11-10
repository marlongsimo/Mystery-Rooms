/*
 * Abenteuer – Kampf-Simulation der 15 Charaktere mit der echten Regel-Engine (js/regeln.js)
 *
 * Je Figur und Stufe: N Abschnitte mit Vierergruppen (die Figur + 3 zufällige andere).
 * Ein Abschnitt = drei Kämpfe hintereinander gegen Grauwacht-Gegner der Stufe, TP/Plätze/Tränke
 * werden mitgenommen, kurze Rast vor dem dritten Kampf (wie im Abenteuerbuch und in balance.js).
 * Gemessen: Siegquote des Abschnitts (Normal) und übrige TP der Gruppe. Gesteuert werden alle Figuren
 * von der eingebauten KI (autoZug) – Menschen spielen besser, aber für alle gleich.
 * Aufruf: node abenteuer/tools/simulation.js [N=400] [--hardcore]
 */
"use strict";
const R = require("../js/regeln.js"), F = R.FD;
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 400;
const HARD = process.argv.includes("--hardcore");
const GRENZE = 5; // Prozentpunkte
const ABSCHNITT = { 1: ["garten", "kobolde", "kaefer_kobolde"], 2: ["gruft", "pilze", "netz"], 3: ["asche", "ritter", "asche_knochen"] };
/** Ein Abschnitt: drei Kämpfe, kurze Rast vor dem dritten (nicht in Hardcore). skala: Faktor statt der Tabelle SKALA */
function abschnitt(seed, gruppe, stufe, skala, hard = HARD) {
  let zust = null;
  for (let k = 0; k < 3; k++) {
    if (zust) zust = k === 2 && !hard ? R.kurzeRast(zust) : R.neuerKampf(zust);
    const st = R.neuesSpiel(seed * 7 + k, { figuren: gruppe, stufe, begegnung: ABSCHNITT[stufe][k], skala, vorher: zust, sparen: [1.6, 1.0, 0.2][k], schwierigkeit: hard ? "hardcore" : "normal" });
    let z = 0;
    while (!st.ende && z++ < 800) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
    if (st.ende !== "sieg") return { sieg: false, tp: 0, tote: R.spielerFiguren(st).filter((f) => f.tot).length };
    zust = R.nachKampf(st);
  }
  const sp = Object.entries(zust);
  return { sieg: true, tp: sp.reduce((a, [fid, z]) => a + (z.tot ? 0 : z.tp / F.tpVon(fid, stufe)), 0) / sp.length, tote: sp.filter(([, z]) => z.tot).length };
}
module.exports = { abschnitt, ABSCHNITT };
if (require.main !== module) return;
const rnd = R.rng(424242);
let ausserhalb = 0;
const t0 = Date.now();
for (const stufe of [1, 2, 3]) {
  const erg = {};
  for (const fid of F.REIHE) {
    let siege = 0, tp = 0, tote = 0;
    for (let i = 0; i < N; i++) {
      const andere = F.REIHE.filter((x) => x !== fid).sort(() => rnd() - 0.5).slice(0, 3);
      const gruppe = [fid].concat(andere).sort(() => rnd() - 0.5);
      const e = abschnitt(stufe * 100000 + F.REIHE.indexOf(fid) * 5000 + i, gruppe, stufe);
      if (e.sieg) siege++; tp += e.tp; tote += e.tote;
    }
    erg[fid] = { quote: siege / N * 100, tp: tp / N * 100, tote: tote / N };
  }
  const mittel = Object.values(erg).reduce((a, b) => a + b.quote, 0) / F.REIHE.length;
  console.log(`\nStufe ${stufe}${HARD ? " (Hardcore)" : ""} – Abschnitt-Siegquote im Mittel ${mittel.toFixed(1)} %  (${N} Abschnitte je Figur)`);
  console.log("Figur               Siegquote  Abweichung  übrige TP" + (HARD ? "  Tote/Abschnitt" : ""));
  for (const fid of F.REIHE) {
    const e = erg[fid], ab = e.quote - mittel;
    if (Math.abs(ab) > GRENZE) ausserhalb++;
    const d = F.FIGUREN[fid];
    console.log(`${(d.name + " (" + fid + ")").padEnd(30).slice(0, 30)} ${e.quote.toFixed(1).padStart(6)} %  ${(ab >= 0 ? "+" : "") + ab.toFixed(1).padStart(4)} pp  ${e.tp.toFixed(0).padStart(5)} %${HARD ? "  " + e.tote.toFixed(2) : ""}${Math.abs(ab) > GRENZE ? "  ← außerhalb" : ""}`);
  }
}
console.log(`\n${ausserhalb ? ausserhalb + " Werte außerhalb ±" + GRENZE + " Prozentpunkte" : "Alle 45 Werte innerhalb ±" + GRENZE + " Prozentpunkte"} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(ausserhalb ? 1 : 0);
