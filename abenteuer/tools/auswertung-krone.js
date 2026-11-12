/*
 * Die Krone unter dem Eis – Auswertung und Kalibrierung der Kämpfe (so, wie die Szenen sie aufbauen)
 * Aufruf: node abenteuer/tools/auswertung-krone.js [N=150] [--hardcore] [--nur=kampf_grat,kampf_markt] [--kalibrieren]
 * Kalibrieren: Lebensfaktor (skala) je Gruppengröße so suchen, dass die Siegquote das Ziel trifft; schreibt in js/regeln.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), D = require("../daten/krone.js"), F = R.FD;
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : d; };
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 150, HARD = process.argv.includes("--hardcore"), KAL = process.argv.includes("--kalibrieren");
const NUR = arg("nur", "").split(",").filter(Boolean);
// Zielquote je Kampf (Sieg in %): Pfad- und Nebenkämpfe etwas leichter als Hauptkämpfe
const KAEMPFE = { kampf_grat: 0.85, kampf_stollen: 0.85, kampf_pilger: 0.85, kampf_markt: 0.8, kampf_kammern: 0.88 };
const GR = [3, 4, 5, 6];
function kampf(id, n, i, skala) {
  const r = R.rng(id.length * 7919 + n * 104729 + i), gruppe = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
  const A = S.neu(9e5 + i * 17 + n, { gruppe, abenteuer: "krone", schwierigkeit: HARD ? "hardcore" : "normal" });
  A.szene = id; A.stufe = D.SZENEN[id].stufe || 1;
  const o = S.kampfOptionen(A); if (skala != null) o.skala = skala;
  const st = R.neuesSpiel(7e6 + i * 31 + n * 7 + id.length, o); let k = 0;
  while (!st.ende && k++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
  const sp = R.spielerFiguren(st), sieg = st.ende === "sieg";
  return { sieg, leben: sieg ? sp.reduce((a, f) => a + Math.max(0, f.tp) / f.tpMax, 0) / sp.length : 0, runden: st.runde, ziele: st.mech ? st.mech.ziele.filter((z) => z.fertig).length : 0, gerettet: st.mech ? st.mech.gerettet : 0, haengt: !st.ende };
}
function messen(id, n, skala, m = N) {
  let s = 0, l = 0, r = 0, z = 0, g = 0, h = 0;
  for (let i = 0; i < m; i++) { const e = kampf(id, n, i, skala); s += e.sieg; l += e.leben; r += e.runden; z += e.ziele; g += e.gerettet; h += e.haengt; }
  return { sieg: s / m, leben: l / m, runden: r / m, ziele: z / m, gerettet: g / m, haengt: h };
}
const begVon = (id) => { const A = S.neu(1, { gruppe: F.REIHE.slice(0, 4), abenteuer: "krone" }); A.szene = id; return S.kampfOptionen(A).begegnung; };
const liste = Object.keys(KAEMPFE).filter((id) => !NUR.length || NUR.includes(id));
console.log(`Krone · ${HARD ? "Hardcore" : "Normal"} · ${KAL ? "Kalibrierung" : N + " Kämpfe je Größe"}`);
for (const id of liste) {
  const beg = begVon(id), b = R.BEGEGNUNGEN[beg];
  if (KAL) {
    const tab = {};
    for (const n of GR) {
      let lo = 0.25, hi = 4;
      for (let it = 0; it < 7; it++) { const mid = Math.sqrt(lo * hi), e = messen(id, n, mid, Math.max(40, Math.round(N / 2))); if (e.sieg > KAEMPFE[id]) lo = mid; else hi = mid; }
      tab[n] = +Math.sqrt(lo * hi).toFixed(2); const e = messen(id, n, tab[n]);
      console.log(`  ${id} ${n} Helden: Faktor ${tab[n]} → Sieg ${Math.round(e.sieg * 100)} %, Leben ${Math.round(e.leben * 100)} %, Runden ${e.runden.toFixed(1)}`);
    }
    tab[2] = tab[3];
    const datei = path.join(__dirname, "../js/regeln.js"); let txt = fs.readFileSync(datei, "utf8");
    const feld = HARD ? "skalaHC" : "skala", neu = `${feld}: { ${[2, 3, 4, 5, 6].map((n) => `${n}: ${tab[n]}`).join(", ")} }`;
    const re = new RegExp(`(    ${beg}: \\{[^\\n]*?)${feld}: \\{[^}]*\\}`); if (!re.test(txt)) throw new Error("Begegnung nicht gefunden: " + beg);
    txt = txt.replace(re, `$1${neu}`); fs.writeFileSync(datei, txt); console.log(`  → ${beg}.${feld} geschrieben`);
  } else {
    const z = GR.map((n) => { const e = messen(id, n); return `${n}: ${Math.round(e.sieg * 100)} % (Leben ${Math.round(e.leben * 100)}, ${e.runden.toFixed(1)} R.${id === "kampf_kammern" ? `, gerettet ${e.gerettet.toFixed(1)}` : e.ziele ? `, Ziele ${e.ziele.toFixed(1)}` : ""}${e.haengt ? `, HÄNGT ${e.haengt}` : ""})`; });
    console.log(`${(b.name || id).padEnd(32)} ${z.join(" · ")}`);
  }
}
