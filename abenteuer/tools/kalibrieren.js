/*
 * Abenteuer – Gegnerstärke nach Gruppengröße kalibrieren
 * Bestimmt für jede Stufe (1–3) und Gruppengröße (3–6 Figuren) den Faktor auf die Gegner-TP, bei dem
 * zufällige Gruppen einen Abschnitt (3 Kämpfe) in Normal so oft gewinnen wie das Ziel (Standard 75 %).
 * Schreibt die Tabelle SKALA in js/regeln.js. Danach prüft es Normal und Hardcore je Gruppengröße.
 * Aufruf: node abenteuer/tools/kalibrieren.js [N=120] [Ziel=75] [--hardcore]   (Hardcore schreibt SKALA_HARDCORE)
 */
"use strict";
const fs = require("fs"), path = require("path");
const R = require("../js/regeln.js"), F = R.FD;
const { abschnitt } = require("./simulation.js");
const zahlen = process.argv.filter((a) => /^\d+$/.test(a)).map(Number);
const N = zahlen[0] || 120, ZIEL = (zahlen[1] || 75) / 100, HARD = process.argv.includes("--hardcore"), NAME = HARD ? "SKALA_HARDCORE" : "SKALA";

function gruppen(stufe, n) {
  const r = R.rng(stufe * 1000 + n);
  return Array.from({ length: N }, () => F.REIHE.slice().sort(() => r() - 0.5).slice(0, n));
}
function quote(stufe, n, k, hard = HARD) {
  let s = 0;
  gruppen(stufe, n).forEach((g, i) => { if (abschnitt(stufe * 1e6 + n * 1e5 + i, g, stufe, k, hard).sieg) s++; });
  return s / N;
}
const SKALA = {};
for (const stufe of [1, 2, 3]) {
  SKALA[stufe] = {};
  for (const n of [3, 4, 5, 6]) {
    // Halbierung im Logarithmus: höherer Faktor = stärkere Gegner = niedrigere Siegquote
    let lo = Math.log(0.5), hi = Math.log(1.8), best = null;
    for (let it = 0; it < 6; it++) {
      const mid = (lo + hi) / 2, k = Math.exp(mid), q = quote(stufe, n, k);
      if (!best || Math.abs(q - ZIEL) < Math.abs(best.q - ZIEL)) best = { k, q };
      if (q > ZIEL) lo = mid; else hi = mid;
    }
    SKALA[stufe][n] = Math.round(best.k * 100) / 100;
    console.log(`Stufe ${stufe}, ${n} Figuren: Faktor ${SKALA[stufe][n]} → ${(best.q * 100).toFixed(0)} %`);
  }
}
const datei = path.join(__dirname, "..", "js", "regeln.js");
const alt = fs.readFileSync(datei, "utf8");
const zeile = `  const ${NAME} = { ${[1, 2, 3].map((s) => `${s}: { ${[3, 4, 5, 6].map((n) => `${n}: ${SKALA[s][n]}`).join(", ")} }`).join(", ")} };`;
fs.writeFileSync(datei, alt.replace(new RegExp("^  const " + NAME + " = .*$", "m"), zeile));
console.log("\nIn js/regeln.js geschrieben:\n" + zeile.trim());

// Gegenprobe mit frischen Gruppen: Normal und Hardcore je Gruppengröße
delete require.cache[require.resolve("../js/regeln.js")];
console.log(`\nGegenprobe ${HARD ? "Hardcore" : "Normal"} mit anderen Gruppen:`);
for (const stufe of [1, 2, 3]) {
  const z = [];
  for (const n of [3, 4, 5, 6]) {
    const r = R.rng(99 + stufe * 10 + n); let sn = 0;
    for (let i = 0; i < N; i++) {
      const g = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
      if (abschnitt(7e6 + stufe * 1e5 + n * 1e4 + i, g, stufe, SKALA[stufe][n], HARD).sieg) sn++;
    }
    z.push(`${n} Figuren: ${(sn / N * 100).toFixed(0)} %`);
  }
  console.log(`Stufe ${stufe} – ` + z.join(" · "));
}
