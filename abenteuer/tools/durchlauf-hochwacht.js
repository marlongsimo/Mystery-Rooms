/*
 * Hochwacht (Entwurf) – automatischer Durchlauf aller bisherigen Szenen mit zufälligen Entscheidungen (3–6 Helden),
 * Kämpfe mit der eingebauten KI. Prüft: keine Fehler, jede Szene erreichbar. Aufruf: node abenteuer/tools/durchlauf-hochwacht.js [N=200]
 */
"use strict";
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), D = require("../daten/hochwacht.js"), F = R.FD;
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 200;
const besucht = new Set(), enden = {}, fehler = [];
function spiel(seed, n) {
  const r = R.rng(seed), z = (k) => Math.floor(r() * k);
  const A = S.neu(seed, { gruppe: F.REIHE.slice().sort(() => r() - 0.5).slice(0, n), abenteuer: "hochwacht" });
  for (let schritt = 0; schritt < 400; schritt++) {
    const s = S.szene(A); besucht.add(A.szene);
    if (A.beute) { const d = A.beute.dinge[0], f = S.lebende(A).find((x) => S.darfTragen(A, x, d)); if (f) S.beuteGeben(A, d, f); else S.beuteLassen(A); continue; }
    if (A.aufstieg) A.aufstieg = null;
    if (s.art === "ende") return A.szene;
    if (s.art === "erzaehlung" || s.art === "lager") { if (s.rastErlaubt && r() < 0.3) S.kurzeRast(A); S.weiter(A); continue; }
    if (s.art === "gespraech") {
      if (A.zwischenprobe) { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); continue; }
      const o = S.optionen(A), frag = o.filter((x) => !x.weiter), w = o.filter((x) => x.weiter);
      S.waehle(A, (frag.length && r() < 0.7 ? frag[z(frag.length)] : w[z(w.length)]).id); continue;
    }
    if (s.art === "wahl") { for (const f of S.lebende(A)) { const o = S.optionen(A); S.stimme(A, f, o[z(o.length)].id); } S.auswerten(A); continue; }
    if (s.art === "geheim") { for (const f of S.lebende(A)) { const q = S.geheimFuer(A, f); S.geheim(A, f, q.antworten[z(q.antworten.length)].id); } S.weiter(A); continue; }
    if (s.art === "probe") { if (A.ergebnis) { S.weiter(A); continue; } if (A.probe.wer === "gruppe") for (const f of S.lebende(A)) S.probeWurf(A, f); else { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); } continue; }
    if (s.art === "kampf") {
      const st = R.neuesSpiel(seed + schritt, S.kampfOptionen(A)); let k = 0;
      // Hin und wieder lassen die Helden Sera bewusst im Stich, damit auch der Rettungsweg vorkommt
      const stich = r() < 0.25;
      while (!st.ende && k++ < 3000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else if (stich && R.begleiterVon(st) && R.begleiterVon(st).tp > 0 && !R.begleiterVon(st).gefesselt) { R.begleiterVon(st).tp = 0; st.eskorte.unten = st.runde; R.zugEnde(st); } else R.autoZug(st); }
      if (!st.ende) throw new Error("Kampf endet nicht: " + A.szene);
      S.kampfEnde(A, st); continue;
    }
    throw new Error("Unbekannte Szenenart " + s.art);
  }
  throw new Error("Hängt in " + A.szene);
}
for (let i = 0; i < N; i++) { try { const e = spiel(4000 + i, 3 + (i % 4)); enden[e] = (enden[e] || 0) + 1; } catch (e) { fehler.push(e.stack.split("\n").slice(0, 3).join(" | ")); } }
const nie = Object.keys(D.SZENEN).filter((id) => !besucht.has(id) && id !== D.NIEDERLAGE);
console.log("Enden:", JSON.stringify(enden)); console.log(nie.length ? "Nie erreicht: " + nie.join(", ") : "Alle Szenen erreicht.");
if (fehler.length) { console.log(fehler.length + " Fehler:\n" + fehler.slice(0, 5).join("\n")); process.exit(1); }
process.exit(nie.length ? 2 : 0);
