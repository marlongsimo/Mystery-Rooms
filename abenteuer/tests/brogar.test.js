/*
 * Mythara – Brogars Kräutermesser (zweiter Angriff neben der Dornenranke) und seine Stufen-Zusätze.
 * Aufruf: node abenteuer/tests/brogar.test.js
 */
const R = require("../js/regeln.js"), F = R.FD;
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
F.STUFEN10.aktiv = true;
console.log("Brogars Kräutermesser");
/** Kampf mit Brogar auf einer Stufe; er ist am Zug und steht neben einem zähen Gegner */
function lage(stufe, seed) {
  const st = R.neuesSpiel(seed, { figuren: ["wanderheiler", "schildwaechter"], stufenListe: [stufe, stufe], karte: R.KARTE_GARTEN, begegnung: "garten", gegner: R.gegnerFuer("garten", 2, null, 1, false, 0) });
  const b = st.figuren.find((f) => f.fid === "wanderheiler"), g = st.figuren.find((f) => f.seite === "gegner");
  st.am = st.reihe.indexOf(b.id); st.zug = Object.assign({}, st.zug, { aktion: true, bonus: true, bewegung: 6 });
  g.tp = g.tpMax = 400; g.rk = 1; g.x = b.x + 1; g.y = b.y; for (const o of st.figuren) if (o !== b && o !== g && o.seite === "gegner") { o.x = st.karte.b - 1; o.y = st.karte.h - 1; }
  return { st, b, g };
}
const messer = (stufe) => F.faehigVon("wanderheiler", stufe).find((a) => a.id === "kraeutermesser");
check(messer(1) && messer(1).art === "angriff" && messer(1).reichweite === 3 && messer(1).attr === "WEI" && messer(1).schaden === "1W4" && messer(1).wurfwaffe, "Ab Stufe 1: Kräutermesser – Angriffswurf mit Weisheit, nah oder geworfen (3 Felder), 1W4");
check(messer(7).schaden === "1W4" && messer(8).schaden === "1W6" && messer(10).schaden === "1W6", "Ab Stufe 8: 1W6 statt 1W4");
check(F.faehigVon("wanderheiler", 1).filter((a) => a.art === "angriff" || a.art === "rettungswurf").map((a) => a.id).join(",") === "dornenranke,kraeutermesser", "Brogar hat zwei Angriffe: Dornenranke (Rettungswurf) und Kräutermesser (Angriffswurf)");
{ const { st, b, g } = lage(1, 11); const z = R.ziele(st, "kraeutermesser"); check(z.includes(g), "Nahkampf: Der Gegner daneben ist ein Ziel");
  g.x = b.x + 3; check(R.ziele(st, "kraeutermesser").includes(g), "Geworfen: 3 Felder weit"); g.x = b.x + 4; check(!R.ziele(st, "kraeutermesser").includes(g), "… aber nicht 4");
  g.x = b.x + 1; const vor = g.tp; R.handeln(st, "kraeutermesser", g.id); const s = vor - g.tp;
  check(s >= 4 && s <= 14 && !st.zug.aktion && !g.z.vergiftet, `Treffer auf Stufe 1: ${s} Schaden (1W4 + 3, bei kritischem Treffer mehr), kostet die Aktion, kein Zusatz`); }
// Stufe 5: Betäubungskraut – einmal je Kampf
{ let gift = 0, zweimal = 0, treffer = 0, daneben = 0;
  for (let seed = 1; seed <= 30; seed++) { const { st, b, g } = lage(5, seed), v0 = g.tp; R.handeln(st, "kraeutermesser", g.id); if (g.tp < v0) { treffer++; if (g.z.vergiftet) gift++; } else if (g.z.vergiftet || b.genutzt.kraut) daneben++; const erst = Boolean(b.genutzt.kraut);
    delete g.z.vergiftet; st.am = st.reihe.indexOf(b.id); st.zug = Object.assign({}, st.zug, { aktion: true }); R.handeln(st, "kraeutermesser", g.id); if (erst && g.z.vergiftet) zweimal++; }
  check(treffer >= 15 && gift === treffer && zweimal === 0 && daneben === 0, `Stufe 5, Betäubungskraut: Der erste Treffer vergiftet das Ziel (${gift} von ${treffer} Treffern), ein zweiter im selben Kampf nicht mehr; ein Fehlwurf verbraucht es nicht`);
  const { st, b, g } = lage(4, 3); R.handeln(st, "kraeutermesser", g.id); check(!g.z.vergiftet && !b.genutzt.kraut, "Auf Stufe 4 noch nicht"); }
// Stufe 10: Blut für Blut
{ let heil = 0, n = 0, falsch = 0;
  for (let seed = 1; seed <= 20; seed++) { const { st, b, g } = lage(10, seed), t = st.figuren.find((f) => f.fid === "schildwaechter"); t.tp = 5; t.x = b.x; t.y = b.y + 1; b.tp = b.tpMax - 2;
    const vt = t.tp, vb = b.tp, v0 = g.tp; R.handeln(st, "kraeutermesser", g.id); if (g.tp < v0) { n++; if (t.tp > vt && t.tp - vt <= 6) heil++; } else if (t.tp !== vt) falsch++; if (b.tp !== vb) falsch++; }
  check(n >= 10 && heil === n && falsch === 0, `Stufe 10, Blut für Blut: Jeder Treffer heilt den am schwersten Verletzten in 5 Feldern (${heil} von ${n} Treffern) – nicht Brogar selbst, wenn ein anderer schlimmer dran ist`);
  const { st, b, g } = lage(10, 5), t = st.figuren.find((f) => f.fid === "schildwaechter"); t.tp = 5; t.x = Math.min(st.karte.b - 1, b.x + 7); const v = t.tp; R.handeln(st, "kraeutermesser", g.id);
  check(R.abstand(b, t) <= 5 || t.tp === v, "Wer weiter als 5 Felder weg steht, wird nicht geheilt"); }
// neuer Kampf: Betäubungskraut ist wieder da
{ const z = { wanderheiler: { tp: 10, plaetze: [1, 0], genutzt: { kraut: 1, bewahren: 1 }, rucksack: {} } }; R.neuerKampf(z);
  check(!z.wanderheiler.genutzt.kraut && z.wanderheiler.genutzt.bewahren === 1, "Im nächsten Kampf ist das Betäubungskraut wieder da (Bewahren, einmal je Rast, bleibt verbraucht)"); }
console.log(ok ? "\nBROGAR IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
