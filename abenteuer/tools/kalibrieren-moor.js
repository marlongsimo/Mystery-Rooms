/*
 * Das Moor der stummen Lichter – Gegnerstärke je Gruppengröße (2–6) kalibrieren
 * Maßstab: Wie viel Leben (Anteil der TP, Niederlage = 0) bleibt zufälligen Gruppen (3–6) nach den Grauwacht-Kämpfen
 * derselben Stufe (frischer Kampf, eingebaute KI)? Frische Kämpfe gewinnt die KI fast immer, das übrige Leben zeigt die Härte.
 * Jede Moor-Begegnung bekommt je Gruppengröße den Faktor auf die Gegner-TP, bei dem gleich viel Leben übrig bleibt.
 * Der Endkampf (moor_schrein) wird härter eingestellt (Ziel: Maßstab − 0,15).
 * Schreibt skala (Normal) und skalaHC (Hardcore) der moor_-Begegnungen in js/regeln.js.
 * Aufruf: node abenteuer/tools/kalibrieren-moor.js [N=150] [--nur=moor_rand,…]   (mit --nur auch andere Begegnungen, z. B. --nur=tor,archiv,hauptmann)
 */
"use strict";
const fs = require("fs"), path = require("path");
const DATEI = path.join(__dirname, "..", "js", "regeln.js");
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 150;
// --nur=moor_rand,moor_tote: nur diese Begegnungen neu bestimmen (z. B. nach einer neuen Karte)
const NUR = (process.argv.find((a) => a.startsWith("--nur=")) || "").slice(6).split(",").filter(Boolean);
const laden = () => { delete require.cache[require.resolve("../js/regeln.js")]; return require("../js/regeln.js"); };
let R = laden(); const F = R.FD, GW = require("../daten/grauwacht.js"), MO = require("../daten/rabenmoor.js"), HW = require("../daten/hochwacht.js");
const KARTE = { moor_rand: MO.KARTEN.BOHLENWEG, moor_kroeten: MO.KARTEN.RIED, moor_kroeten2: MO.KARTEN.RIED, moor_tote: MO.KARTEN.TOTENPFAD, moor_schrein: MO.KARTEN.SCHREIN,
  tor: HW.KARTEN.TOR, archiv: HW.KARTEN.ARCHIV, hauptmann: HW.KARTEN.GRAT, // Hochwacht: Nebenkämpfe (ohne Begleiterin)
  garten: undefined, kobolde: GW.KARTEN.TURM, gruft: GW.KARTEN.GRUFT, pilze: GW.KARTEN.PILZE, netz: GW.KARTEN.SCHACHT };
const gruppen = (seed, n) => { const r = R.rng(seed); return Array.from({ length: N }, () => F.REIHE.slice().sort(() => r() - 0.5).slice(0, n)); };
function quote(beg, n, hard, skala) {
  const b = R.BEGEGNUNGEN[beg]; let s = 0;
  gruppen(beg.length * 97 + n * 13 + (hard ? 5 : 0), n).forEach((g, i) => {
    const st = R.neuesSpiel(5e6 + n * 1e4 + i, { figuren: g, stufe: b.stufe, begegnung: beg, karte: KARTE[beg], schwierigkeit: hard ? "hardcore" : "normal", skala, beute: false });
    let k = 0; while (!st.ende && k++ < 1500) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
    if (st.ende === "sieg") { const sp = R.spielerFiguren(st).filter((f) => f.fid); s += sp.reduce((a, f) => a + Math.max(0, f.tp) / f.tpMax, 0) / sp.length; }
  });
  return s / N;
}
function suche(ziel, q) {
  let lo = Math.log(0.25), hi = Math.log(6), best = null;
  for (let it = 0; it < 7; it++) { const mid = (lo + hi) / 2, k = Math.exp(mid), x = q(k); if (!best || Math.abs(x - ziel) < Math.abs(best.q - ziel)) best = { k, q: x }; if (x > ziel) lo = mid; else hi = mid; }
  return { k: Math.round(best.k * 100) / 100, q: best.q };
}
const t0 = Date.now(), REF = { 1: ["garten", "kobolde"], 2: ["gruft", "pilze", "netz"] }, ergebnis = {};
for (const hard of [false, true]) {
  const ref = {};
  for (const st of [1, 2]) { let s = 0, z = 0; for (const beg of REF[st]) for (const n of [3, 4, 5, 6]) { s += quote(beg, n, hard); z++; } ref[st] = s / z; }
  console.log(`${hard ? "Hardcore" : "Normal"} – Maßstab Grauwacht (übriges Leben): Stufe 1 ${(ref[1] * 100).toFixed(0)} %, Stufe 2 ${(ref[2] * 100).toFixed(0)} %`);
  for (const beg of Object.keys(R.BEGEGNUNGEN).filter((b) => (NUR.length ? NUR.includes(b) : b.startsWith("moor_")))) {
    const b = R.BEGEGNUNGEN[beg], ziel = ref[b.stufe] - (beg === "moor_schrein" ? 0.15 : 0), tab = {};
    for (const n of [2, 3, 4, 5, 6]) { const e = suche(ziel, (k) => quote(beg, n, hard, k)); tab[n] = e.k; process.stdout.write(`  ${beg} ${n}: ${e.k} (${(e.q * 100).toFixed(0)} %)\n`); }
    (ergebnis[beg] = ergebnis[beg] || {})[hard ? "skalaHC" : "skala"] = tab;
  }
}
let txt = fs.readFileSync(DATEI, "utf8");
for (const [beg, t] of Object.entries(ergebnis)) {
  const zeile = (o) => `{ ${[2, 3, 4, 5, 6].map((n) => `${n}: ${o[n]}`).join(", ")} }`;
  txt = txt.replace(new RegExp(`(    ${beg}: \\{.*?)skala: \\{[^}]*\\}, skalaHC: \\{[^}]*\\}`), `$1skala: ${zeile(t.skala)}, skalaHC: ${zeile(t.skalaHC)}`);
}
fs.writeFileSync(DATEI, txt);
console.log(`\nIn js/regeln.js geschrieben · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
