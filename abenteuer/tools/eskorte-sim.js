/*
 * Eskorte-Simulation (Hochwacht-Prototyp): Hinterhalt am Pass mit Sera Venn
 * Je Gruppengröße 3–6: Sieg (Ausgang erreicht / Jäger besiegt / alle besiegt), Sera verschleppt, Rückzug,
 * wie oft Sera zu Boden ging, wie oft abgefangen wurde, Runden. Gesteuert von der eingebauten KI.
 * Aufruf: node abenteuer/tools/eskorte-sim.js [N=300] [--hardcore] [--skala=1.0] [--tp=14,18]
 *         node abenteuer/tools/eskorte-sim.js 200 --kalibrieren [--ziel=20]   → Gegnerfaktor je Größe, bei dem Sera in ~20 % der Kämpfe
 *         zu Boden geht (Normal und Hardcore), wird als skala/skalaHC der Begegnung „pass“ in js/regeln.js geschrieben
 */
"use strict";
const R = require("../js/regeln.js"), F = R.FD, D = require("../daten/hochwacht.js");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : d; };
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 300, HARD = process.argv.includes("--hardcore");
const SKALA = arg("skala", null), TP = arg("tp", "14,18").split(",").map(Number);
const P = D.KARTEN.PASS;
function kampf(n, i, hard, skala, r) {
  const g = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
  const st = R.neuesSpiel(3e6 + n * 1e4 + i, { figuren: g, stufe: 1, begegnung: "pass", karte: P, schwierigkeit: hard ? "hardcore" : "normal", skala: skala != null ? +skala : undefined, keinAnfuehrer: true,
    begleiter: { name: "Sera Venn", tp: n >= 5 ? TP[1] : TP[0], start: P.start.begleiter, route: P.route } });
  let k = 0, unten = false;
  while (!st.ende && k++ < 3000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); if (R.begleiterVon(st).tp <= 0) unten = true; }
  return { st, unten };
}
if (process.argv.includes("--kalibrieren")) {
  const ZIEL = +arg("ziel", 20) / 100, fs = require("fs"), path = require("path"), DATEI = path.join(__dirname, "..", "js", "regeln.js"), erg = {};
  for (const hard of [false, true]) {
    const tab = {};
    for (const n of [2, 3, 4, 5, 6]) {
      const quote = (k) => { const r = R.rng(500 + n); let u = 0; for (let i = 0; i < N; i++) if (kampf(n, i, hard, k, r).unten) u++; return u / N; };
      let lo = Math.log(0.5), hi = Math.log(8), best = null;
      for (let it = 0; it < 7; it++) { const mid = (lo + hi) / 2, k = Math.exp(mid), q = quote(k); if (!best || Math.abs(q - ZIEL) < Math.abs(best.q - ZIEL)) best = { k, q }; if (q < ZIEL) lo = mid; else hi = mid; }
      tab[n] = Math.round(best.k * 100) / 100; console.log(`${hard ? "Hardcore" : "Normal  "} ${n} Helden: Faktor ${tab[n]} → Sera am Boden ${(best.q * 100).toFixed(0)} %`);
    }
    erg[hard ? "skalaHC" : "skala"] = tab;
  }
  const z = (o) => `{ ${[2, 3, 4, 5, 6].map((n) => `${n}: ${o[n]}`).join(", ")} }`;
  let txt = fs.readFileSync(DATEI, "utf8");
  txt = txt.replace(/(    pass: \{.*?)skala: \{[^}]*\}, skalaHC: \{[^}]*\}/, `$1skala: ${z(erg.skala)}, skalaHC: ${z(erg.skalaHC)}`);
  fs.writeFileSync(DATEI, txt); console.log("In js/regeln.js geschrieben."); process.exit(0);
}
console.log(`Hinterhalt am Pass · ${HARD ? "Hardcore" : "Normal"} · ${N} zufällige Gruppen je Größe · Sera ${TP[0]}/${TP[1]} LP${SKALA ? " · Gegnerfaktor " + SKALA : ""}`);
console.log("Helden   Sieg   davon Ausgang   verschleppt   Rückzug   Sera am Boden   abgefangen/Kampf   Runden   Gegner");
for (const n of [2, 3, 4, 5, 6]) {
  const r = R.rng(77 + n), e = { sieg: 0, ausgang: 0, gefangen: 0, rueckzug: 0, niederlage: 0, unten: 0, ab: 0, runden: 0 }; let gegnerTxt = "";
  for (let i = 0; i < N; i++) {
    const { st, unten } = kampf(n, i, HARD, SKALA, r);
    if (!gegnerTxt) gegnerTxt = R.gegnerFiguren(st).map((x) => x.name).join(", ");
    e[st.ende || "rueckzug"]++; if (unten) e.unten++; e.runden += st.runde;
    if (st.ende === "sieg" && st.log.some((l) => /erreicht den Ausgang/.test(l.t))) e.ausgang++;
    e.ab += st.log.filter((l) => /fängt den Angriff ab/.test(l.t)).length;
  }
  const p = (x) => `${Math.round(x / N * 100)} %`.padStart(5);
  console.log(`${String(n).padStart(4)}    ${p(e.sieg)}   ${p(e.ausgang).padStart(13)}   ${p(e.gefangen).padStart(11)}   ${p(e.rueckzug + e.niederlage).padStart(7)}   ${p(e.unten).padStart(13)}   ${(e.ab / N).toFixed(1).padStart(16)}   ${(e.runden / N).toFixed(1).padStart(6)}   ${gegnerTxt}`);
}
