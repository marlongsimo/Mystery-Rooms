/*
 * Mythara – Heldenstufen 1–10 (KONZEPT-HELDENLEVEL.md): prüft das Zehn-Stufen-Modell im Regelkern.
 * Je Held Kämpfe auf Stufe 1, 5 und 10 ohne Absturz; dazu einzelne Werte und Verbesserungen gezielt.
 * Der Schalter STUFEN10.aktiv ist im Spiel aus – dieser Test schaltet ihn nur für sich ein.
 * Aufruf: node abenteuer/tests/stufen.test.js
 */
const W = __dirname + "/../";
const R = require(W + "js/regeln.js"), F = R.FD; require(W + "daten/krone.js"); require(W + "daten/weidenhain.js"); const S = require(W + "js/szenen.js");
F.STUFEN10.aktiv = true;
let fehler = 0; const sieg = {};
for (const stufe of [1, 5, 10]) for (const fid of F.REIHE) {
  let s = 0, n = 0;
  for (let i = 0; i < 20; i++) {
    const rest = F.REIHE.filter((x) => x !== fid), g = [fid, rest[(i * 3) % 14], rest[(i * 5 + 1) % 14]];
    try {
      const A = S.neu(i + 1, { abenteuer: "krone", gruppe: [...new Set(g)] }); A.szene = "kampf_markt"; A.stufe = stufe;
      for (const f of A.gruppe) Object.assign(A.zust[f], { stufe, tp: F.tpVon(f, stufe), plaetze: F.KLASSEN[F.FIGUREN[f].klasse].plaetze ? F.plaetzeVon(stufe).slice() : [0, 0] });
      const st = R.neuesSpiel(i * 7 + stufe, S.kampfOptionen(A)); let k = 0;
      while (!st.ende && k++ < 3000) R.aktiv(st).seite === "gegner" ? R.gegnerZug(st) : R.autoZug(st);
      n++; if (st.ende === "sieg") s++;
    } catch (e) { fehler++; if (fehler < 6) console.log("FEHLER", fid, "Stufe", stufe, e.stack.split("\n").slice(0, 3).join(" | ")); }
  }
  sieg[stufe] = sieg[stufe] || []; sieg[stufe].push(s / Math.max(1, n));
}
for (const st of [1, 5, 10]) console.log("Stufe", st, "Siegquote Markt (Krone), Mittel über alle Helden:", (sieg[st].reduce((a, b) => a + b, 0) / sieg[st].length * 100).toFixed(0) + " %");
// Gezielt: Werte einzelner Verbesserungen
const fig = (fid, stufe) => { const st = R.neuesSpiel(5, { figuren: [fid, "lichtbringer", "schildwaechter"], stufe, begegnung: "w_speicher", karte: require(W + "daten/weidenhain.js").KARTEN.SPEICHER }); return { st, f: st.figuren.find((x) => x.fid === fid) }; };
const t = fig("schildwaechter", 10), akt = (f, id) => F.faehigVon(f.fid, f.stufe).find((a) => a.id === id);
console.log("Torvald 10: TP", t.f.tpMax, "RK", t.f.rk, "STR", t.f.werte.STR, "| Spott je Rast", R.grenze(t.f, akt(t.f, "spott")).n, "| Schildstoß", JSON.stringify(R.grenze(t.f, akt(t.f, "schildstoss"))), "Felder", akt(t.f, "schildstoss").felder);
const v = fig("elementarist", 10); console.log("Vaelin 10: Plätze", JSON.stringify(v.f.plaetze), "| Geschoss Pfeile", akt(v.f, "geschoss").anzahl, "| Glutsphäre Radius", akt(v.f, "glutsphaere").groesse, "frei je Rast", akt(v.f, "glutsphaere").freiJeRast);
const fy = fig("tiergefaehrte", 5); console.log("Faye 5: Grau TP", fy.st.figuren.find((x) => x.art === "wolf").tpMax, "(Stufe 4:", fig("tiergefaehrte", 4).st.figuren.find((x) => x.art === "wolf").tpMax + ")");
const d = fig("schattenlaeufer", 10); console.log("Darian 10: Falle", JSON.stringify(d.st.falle), "| Stufe 6:", JSON.stringify(fig("schattenlaeufer", 6).st.falle || null));
const o3 = fig("kopfgeldjaeger", 3), o2 = fig("kopfgeldjaeger", 2); console.log("Orin: Lähmender Bolzen ab Stufe 3:", Boolean(akt(o3.f, "laehmbolzen")), "| auf Stufe 2:", Boolean(akt(o2.f, "laehmbolzen")));
let ok = !fehler; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
check(!fehler, "keine Abstürze in " + 3 * 15 * 20 + " Kämpfen auf Stufe 1, 5 und 10");
check(t.f.tpMax === 63 && t.f.rk === 18 && t.f.werte.STR === 18, "Torvald Stufe 10: 63 Lebenspunkte, RK 18, Stärke 18");
check(R.grenze(t.f, akt(t.f, "spott")).n === 2 && akt(t.f, "schildstoss").felder === 2, "Torvald: Spott 2× je Rast, Schildstoß 2 Felder");
check(JSON.stringify(v.f.plaetze) === "[5,3]" && akt(v.f, "geschoss").anzahl === 4 && akt(v.f, "glutsphaere").groesse === 3, "Vaelin Stufe 10: Zauberplätze 5 + 3, vier Lichtpfeile, Glutsphäre mit Radius 3");
check(fy.st.figuren.find((x) => x.art === "wolf").tpMax === 22, "Faye Stufe 5: Grau hat 10 Lebenspunkte mehr");
check(d.st.falle && d.st.falle.meister && !fig("schattenlaeufer", 6).st.falle, "Darian: Falle ab Stufe 7, Meisterfalle auf Stufe 10");
check(Boolean(akt(o3.f, "laehmbolzen")) && !akt(o2.f, "laehmbolzen"), "Orin: Lähmender Bolzen ab Stufe 3");
// Gegner wachsen mit: Bedrohung aus der Schwierigkeit der Kampagne
{ const K = S.neu(5, { abenteuer: "krone", gruppe: ["schildwaechter", "lichtbringer", "wildnislaeufer"] }), Wd = S.neu(5, { abenteuer: "weidenhain", gruppe: ["schildwaechter", "lichtbringer", "wildnislaeufer"] });
  check(S.empfStufe("krone") === 6 && K.stufe === 6 && Wd.stufe === 1, "Krone (Schwierigkeit 4) spielt auf Heldenstufe 6, Weidenhain auf Stufe 1");
  K.szene = "kampf_markt"; const ko = S.kampfOptionen(K), stB = R.neuesSpiel(3, ko), st0 = R.neuesSpiel(3, Object.assign({}, ko, { bedrohung: 0 }));
  const g1 = R.gegnerFiguren(stB)[0], g0 = R.gegnerFiguren(st0).find((x) => x.art === g1.art);
  check(ko.bedrohung === 5 && stB.bed === 5 && g1.tpMax > g0.tpMax * 1.5 && g1.rk === g0.rk + 1, "Krone, erster Kampf: Bedrohung +5 – Gegner mit mehr Leben und RK +1");
  Wd.szene = "kampf_speicher"; check(S.kampfOptionen(Wd).bedrohung === 0, "Weidenhain, erster Kampf: Bedrohung 0 (Gegner wie bisher)"); }
F.STUFEN10.aktiv = false;
{ const K = S.neu(5, { abenteuer: "krone", gruppe: ["schildwaechter", "lichtbringer", "wildnislaeufer"] }); K.szene = "kampf_markt"; check(K.stufe === 1 && !S.kampfOptionen(K).bedrohung && R.neuesSpiel(3, Object.assign(S.kampfOptionen(K), { bedrohung: 4 })).bed === 0, "Schalter aus: Kampagnen starten auf Stufe 1, keine Bedrohung"); }
check(F.tpVon("schildwaechter", 3) === F.tpAlt("schildwaechter", 3) && !F.faehigVon("kopfgeldjaeger", 3).some((a) => a.nur10 || a.besser), "Schalter aus: bisheriges Modell unverändert, keine neuen Fähigkeiten");
console.log(ok ? "\nHELDENSTUFEN IN ORDNUNG" : "\nHELDENSTUFEN FEHLER"); process.exit(ok ? 0 : 1);
