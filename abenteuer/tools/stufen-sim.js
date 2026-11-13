/*
 * Siegquote je Kampagne bei fest vorgegebener Heldenstufe (1, 2, 3) – Grundlage für das Konzept „Heldenlevel“.
 * Jede Kampfszene wie im Spiel (S.kampfOptionen), Gruppen 3–6 gleichverteilt gemischt, eingebaute KI.
 * Die Gegner bleiben wie in der Kampagne; nur die Stufe der Helden wird überschrieben.
 * Aufruf: node abenteuer/tools/stufen-sim.js [N=20] [--json=datei]
 */
"use strict";
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), F = R.FD;
for (const d of ["grauwacht", "rabenmoor", "hochwacht", "krone"]) require("../daten/" + d + ".js");
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 20;
const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : null; };
function mischen(liste, r) { const a = liste.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const erg = {};
for (const ab of ["rabenmoor", "grauwacht", "hochwacht", "krone"]) {
  const D = globalThis.ABD_ALLE[ab], szenen = Object.entries(D.SZENEN).filter(([, s]) => s.art === "kampf");
  erg[ab] = { titel: D.META.titel, stufen: {}, normal: { k: 0, s: 0 } };
  for (const stufe of [0, 1, 2, 3]) { // 0 = Stufe wie in der Kampagne vorgesehen
    let k = 0, s = 0, runden = 0, boden = 0, figuren = 0;
    for (const [id, sz] of szenen) for (const n of [3, 4, 5, 6]) for (let i = 0; i < N; i++) {
      const r = R.rng(id.length * 7919 + n * 104729 + i * 31 + ab.length), grp = mischen(F.REIHE, r).slice(0, n);
      const A = S.neu(3e5 + i * 17 + n + id.length, { gruppe: grp, abenteuer: ab, schwierigkeit: "normal" });
      A.szene = id; A.stufe = sz.stufe || Math.min(3, sz.abschnitt || 1);
      let o; try { o = S.kampfOptionen(A); } catch (e) { continue; }
      if (!o.stufe || sz.stufe) o.stufe = A.stufe; else o.stufe = (R.BEGEGNUNGEN[o.begegnung] || {}).stufe || A.stufe;
      if (stufe) o.stufe = stufe;
      const st = R.neuesSpiel(5e6 + i * 13 + n * 7 + id.length, o); let z = 0; const unten = {};
      while (!st.ende && z++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); for (const f of R.spielerFiguren(st)) if (f.tp <= 0 && f.fid) unten[f.id] = true; }
      k++; if (st.ende === "sieg") s++; runden += st.runde; boden += Object.keys(unten).length; figuren += n;
    }
    erg[ab].stufen[stufe || "kampagne"] = { k, sieg: s / k, runden: runden / k, boden: boden / figuren };
  }
  const z = erg[ab].stufen;
  console.log(`${D.META.titel.padEnd(34)} wie vorgesehen ${(z.kampagne.sieg * 100).toFixed(1).padStart(5)} % · Stufe 1 ${(z[1].sieg * 100).toFixed(1).padStart(5)} % · Stufe 2 ${(z[2].sieg * 100).toFixed(1).padStart(5)} % · Stufe 3 ${(z[3].sieg * 100).toFixed(1).padStart(5)} %   (je ${z[1].k} Kämpfe)`);
  console.log(`${"".padEnd(34)} Runden ${z.kampagne.runden.toFixed(1)} / ${z[1].runden.toFixed(1)} / ${z[2].runden.toFixed(1)} / ${z[3].runden.toFixed(1)} · am Boden je Held ${(z.kampagne.boden * 100).toFixed(0)} / ${(z[1].boden * 100).toFixed(0)} / ${(z[2].boden * 100).toFixed(0)} / ${(z[3].boden * 100).toFixed(0)} %`);
}
if (arg("json")) require("fs").writeFileSync(arg("json"), JSON.stringify(erg, null, 1));
