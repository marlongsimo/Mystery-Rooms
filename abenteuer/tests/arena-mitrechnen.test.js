/*
 * Mythara – Arena: Mitrechnen. Zwei Kämpfe aus derselben Zufallszahl und denselben Schritten müssen in jedem Schritt
 * denselben Prüfwert ergeben (darauf beruht, dass das zweite Gerät den Kampf des Erstellers nachprüfen kann),
 * und jede Veränderung am Stand muss den Prüfwert ändern.
 * Aufruf: node abenteuer/tests/arena-mitrechnen.test.js [Kämpfe je Modus]
 */
const W = __dirname + "/../";
const R = require(W + "js/regeln.js"), F = R.FD; const G = require(W + "daten/grauwacht.js");
F.STUFEN10.aktiv = true;
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const KARTEN = Object.values(G.KARTEN), N = +process.argv[2] || 25;
const neu = (i, modus, anf0) => { const r = R.rng(i + 1), misch = () => F.REIHE.slice().sort(() => r() - 0.5).slice(0, 3).map((fid) => ({ fid, stufe: 1 + (i % 10) }));
  return R.neueArena(5000 + i, { teams: [misch(), misch()], namen: ["A", "B"], karte: KARTEN[i % KARTEN.length], begegnung: ["garten", "kobolde", "gruft"][i % 3], modus, anfuehrer: [anf0, (i + 1) % 3] }); };
for (const modus of ["arena", "koenig", "horde", "duell"]) {
  let schritte = 0, ab = 0, enden = 0, fehler = "";
  for (let i = 0; i < N && !fehler; i++) {
    const a = neu(i, modus, i % 3), b = neu(i, modus, i % 3);
    if (R.arenaAbdruck(a) !== R.arenaAbdruck(b)) { fehler = "Start verschieden"; break; }
    let k = 0;
    while (!a.ende && k++ < 6000) {
      const was = R.aktiv(a).seite === "gegner" ? "gegnerZug" : "autoZug";
      R[was](a); R[was](b); schritte++;
      if (R.arenaAbdruck(a) !== R.arenaAbdruck(b)) { ab++; fehler = `Kampf ${i}, Schritt ${k} (${was}), Runde ${a.runde}`; break; }
    }
    if (a.ende && b.ende && a.arena.sieger === b.arena.sieger) enden++;
  }
  check(!fehler && !ab && enden === N, `${modus}: ${N} Kämpfe, ${schritte} Schritte – beide Rechnungen in jedem Schritt gleich, gleiches Ende${fehler ? " · ABWEICHUNG: " + fehler : ""}`);
}
{ // Der verdeckte Anführer darf den Prüfwert nicht verändern (sonst verriete er sich), sein Fall aber den Ausgang
  const a = neu(3, "koenig", 0), b = neu(3, "koenig", 2);
  check(R.arenaAbdruck(a) === R.arenaAbdruck(b), "Königsmord: Der Prüfwert verrät den Anführer nicht");
}
{ // Jede Veränderung fällt auf
  const a = neu(7, "arena", 0), h = R.arenaAbdruck(a), f = a.figuren.find((x) => x.team === 1);
  f.tp += 1; const h1 = R.arenaAbdruck(a); f.tp -= 1;
  f.x += 1; const h2 = R.arenaAbdruck(a); f.x -= 1;
  a.arena.punkte[1] += 5; const h3 = R.arenaAbdruck(a); a.arena.punkte[1] -= 5;
  a.r(); const h4 = R.arenaAbdruck(a);
  check(h1 !== h && h2 !== h && h3 !== h && h4 !== h, "Geänderte Lebenspunkte, Position, Punkte oder ein zusätzlicher Würfelwurf ändern den Prüfwert");
  const c = neu(7, "arena", 0); R.arenaSicht(c, 2); const hs = R.arenaAbdruck(c); R.arenaSicht(c, 1);
  check(hs === h && R.arenaAbdruck(c) === h, "Die Sicht (wessen Helden als Gegner gelten) ändert den Prüfwert nicht");
}
console.log(ok ? "\nMITRECHNEN IN ORDNUNG" : "\nMITRECHNEN: FEHLER"); process.exit(ok ? 0 : 1);
