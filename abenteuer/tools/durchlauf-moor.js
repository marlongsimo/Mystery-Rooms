/*
 * Das Moor der stummen Lichter – automatischer Durchlauf (Node, ohne Darstellung)
 * Spielt das Abenteuer N-mal mit zufälligen Gruppen (2–6) und zufälligen Entscheidungen durch; Kämpfe steuert die eingebaute KI.
 * Prüft: keine Fehler, jede Szene erreichbar, jedes Ende erreichbar. Gibt Siegquoten je Gruppengröße aus.
 * Aufruf: node abenteuer/tools/durchlauf-moor.js [N=300] [--hardcore]
 */
"use strict";
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), D = require("../daten/rabenmoor.js"), F = R.FD;
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 300, HARD = process.argv.includes("--hardcore");
const besucht = new Set(), enden = {}, quote = {}, fehler = [];
function spiel(seed, n) {
  const r = R.rng(seed), z = (k) => Math.floor(r() * k);
  const gruppe = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
  const A = S.neu(seed, { gruppe, schwierigkeit: HARD ? "hardcore" : "normal", abenteuer: "rabenmoor" });
  for (let schritt = 0; schritt < 400; schritt++) {
    const s = S.szene(A); besucht.add(A.szene);
    if (A.beute) { const d = A.beute.dinge[0], f = S.lebende(A).find((x) => S.darfTragen(A, x, d)); if (f) S.beuteGeben(A, d, f); else S.beuteLassen(A); continue; }
    if (A.aufstieg) A.aufstieg = null;
    if (A.ersatzOffen && A.ersatzOffen.length && s.art === "lager") { for (const alt of A.ersatzOffen.slice()) S.ersatz(A, alt, S.freieFiguren(A)[0]); continue; }
    if (s.art === "ende") return { ende: A.szene, glocke: A.glocke };
    if (s.art === "erzaehlung" || s.art === "lager") { if (s.rastErlaubt && r() < 0.3) S.kurzeRast(A); S.weiter(A); continue; }
    if (s.art === "gespraech") {
      if (A.zwischenprobe) { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); continue; }
      const o = S.optionen(A), frag = o.filter((x) => !x.weiter), w = o.filter((x) => x.weiter);
      const pick = frag.length && r() < 0.7 ? frag[z(frag.length)] : w[z(w.length)];
      S.waehle(A, pick.id); continue;
    }
    if (s.art === "wahl") { for (const f of S.lebende(A)) { const o = S.optionen(A); S.stimme(A, f, o[z(o.length)].id); } S.auswerten(A); continue; }
    if (s.art === "geheim") { for (const f of S.lebende(A)) { const q = S.geheimFuer(A, f); S.geheim(A, f, q.antworten[z(q.antworten.length)].id); } S.weiter(A); continue; }
    if (s.art === "probe") {
      if (A.ergebnis) { S.weiter(A); continue; }
      if (A.probe.wer === "gruppe") for (const f of S.lebende(A)) S.probeWurf(A, f);
      else { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); }
      continue;
    }
    if (s.art === "raetsel") {
      if (r() < 0.6) for (const id of s.loesung) S.raetselTipp(A, id); else { const g = s.glocken.map((x) => x.id).sort(() => r() - 0.5); for (const id of g) S.raetselTipp(A, id); }
      continue;
    }
    if (s.art === "kampf") {
      const st = R.neuesSpiel(seed + schritt, S.kampfOptionen(A)); let k = 0;
      while (!st.ende && k++ < 1500) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
      if (!st.ende) throw new Error("Kampf endet nicht: " + A.szene);
      S.kampfEnde(A, st); continue;
    }
    throw new Error("Unbekannte Szenenart " + s.art + " in " + A.szene);
  }
  throw new Error("Zu viele Schritte, hängt in " + A.szene);
}
for (let i = 0; i < N; i++) {
  const n = 2 + (i % 5);
  try { const e = spiel(1000 + i, n); enden[e.ende] = (enden[e.ende] || 0) + 1; quote[n] = quote[n] || { s: 0, n: 0 }; quote[n].n++; if (e.ende !== "moor_behaelt") quote[n].s++; }
  catch (e) { fehler.push(`Lauf ${i} (${n} Helden): ${e.stack.split("\n").slice(0, 3).join(" | ")}`); }
}
const nie = Object.keys(D.SZENEN).filter((id) => !besucht.has(id) && !(id === D.NIEDERLAGE && !HARD)); // Niederlage gibt es nur in Hardcore
console.log("Enden:", JSON.stringify(enden));
console.log("Durchgekommen je Gruppengröße:", Object.entries(quote).map(([n, q]) => `${n}: ${Math.round(q.s / q.n * 100)} %`).join(" · "));
console.log(nie.length ? "Nie erreicht: " + nie.join(", ") : "Alle Szenen erreicht.");
if (fehler.length) { console.log(fehler.length + " Fehler:\n" + fehler.slice(0, 8).join("\n")); process.exit(1); }
process.exit(nie.length ? 2 : 0);
