/*
 * Mythara – Arena, Serverkampf: der Rechenkern (server/arena-kern.js) in Node, ohne Netz und Datenbank.
 * Spielt ganze Kämpfe in allen vier Modi mit zufälligen erlaubten Zügen und prüft: Zugrecht, verborgene Angaben,
 * Speichern/Laden zwischen den Zügen (wie in der Edge Function), Zugzeit, Aufgabe durch Zeitablauf, Ergebnis.
 * Aufruf: node abenteuer/tests/arena-kern.test.js
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js");
const K = kern(R, D.KARTEN);
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const team = (h, s) => h.map((held, i) => ({ held, stufe: s[i] }));
const match = (seed, karte) => ({ seed, karte, begegnung: "kobolde", kampfstufe: 3, host_name: "Anna", guest_name: "Ben",
  host_team: team(["schildwaechter", "lichtbringer", "wildnislaeufer"], [4, 3, 3]), guest_team: team(["berserker", "elementarist", "trickser"], [3, 3, 3]) });
// Zufall für die Testspieler (fest, damit der Test wiederholbar ist)
let zs = 12345; const zf = () => { zs = (zs * 1103515245 + 12345) & 0x7fffffff; return zs / 0x7fffffff; };
/** Ein Zugwunsch für den Helden am Zug: mal bewegen, mal eine Aktion mit Ziel, sonst Zugende */
function wunsch(st, schonBewegt, schonGehandelt) {
  const a = R.aktiv(st);
  if (!schonGehandelt) {
    const akt = R.aktionenVon(a, st).filter((x) => (x.typ || "aktion") !== "frei" && !R.grund(st, x.id));
    for (const x of akt.sort(() => zf() - 0.5)) { const z = R.ziele(st, x.id); if (z.length) return { typ: "aktion", aktion: x.id, ziel: z[Math.floor(zf() * z.length)].id }; }
  }
  if (!schonBewegt && zf() < 0.8) { const f = [...R.bewegungsfelder(st, a).keys()].filter((k) => k !== a.x + "," + a.y); if (f.length) { const [x, y] = f[Math.floor(zf() * f.length)].split(",").map(Number); return { typ: "bewegen", x, y }; } }
  return { typ: "ende" };
}
/** Ganzer Kampf wie über die Edge Function: Stand nach jedem Aufruf speichern und neu laden */
function spiele(seed, karte, opt = {}) {
  let jetzt = 1000000, gespeichert, v = 0; const sichten = [];
  const nimm = (schritte) => { v += schritte.length; for (const s of schritte) sichten.push(s); };
  { const s = K.start(match(seed, karte), 1, 2, jetzt); nimm(s.schritte); gespeichert = K.speichern(s.st); }
  let zuege = 0, abgelehnt = 0, fremd = 0, fehler = [];
  for (let i = 0; i < 4000; i++) {
    const st = K.laden(gespeichert); if (st.ende) break;
    const a = R.aktiv(st), tm = R.teamVon(st, a);
    if (!tm) { fehler.push("Monster am Zug, obwohl der Server sie sofort ziehen lässt"); break; }
    jetzt += 2000;
    // die falsche Seite versucht es zuerst
    if (i % 7 === 0) { const r = K.zug(K.laden(gespeichert), 3 - tm, { typ: "ende" }, jetzt); if (r.fehler) fremd++; else fehler.push("Zug der falschen Seite wurde ausgeführt"); }
    let bewegt = false, gehandelt = false;
    const w = opt.nurEnde ? { typ: "ende" } : wunsch(st, bewegt, gehandelt);
    const r = K.zug(st, tm, w, jetzt);
    if (r.fehler) { abgelehnt++; const e = K.zug(st, tm, { typ: "ende" }, jetzt); if (e.fehler) { fehler.push("Zugende abgelehnt: " + e.fehler); break; } nimm(e.schritte); }
    else { nimm(r.schritte); zuege++;
      // nach Bewegung oder Aktion den Zug beenden, falls derselbe Held noch dran ist
      if (!st.ende && w.typ !== "ende" && R.aktiv(st).id === a.id) { const e = K.zug(st, tm, { typ: "ende" }, jetzt); if (!e.fehler) nimm(e.schritte); } }
    gespeichert = K.speichern(st);
  }
  return { st: K.laden(gespeichert), sichten, zuege, abgelehnt, fremd, fehler, v };
}

console.log("Rechenkern des Serverkampfs");
check(K.modusVon(4712) === "arena" && K.modusVon(4713) === "koenig" && K.modusVon(4714) === "horde" && K.modusVon(4715) === "duell", "Das Los (Zufallszahl des Kampfes) ergibt denselben Modus wie auf den Geräten");
for (const [seed, name] of [[4712, "Arena"], [4713, "Königsmord"], [4714, "Die Horde"], [4715, "Duell"]]) {
  const e = spiele(seed, "gruft"), erg = K.ergebnis(e.st);
  check(e.fehler.length === 0 && Boolean(e.st.ende) && erg && [1, 2].includes(erg.sieger) && ["team", "punkte"].includes(erg.grund),
    `${name}: Kampf läuft bis zum Ende (${e.zuege} Züge, ${e.v} Schritte, Runde ${e.st.runde}) – Sieger Team ${erg && erg.sieger}, Grund „${erg && erg.grund}“${e.fehler.length ? " · " + e.fehler[0] : ""}`);
  check(e.fremd > 0, `${name}: Züge der Seite, die nicht dran ist, werden abgelehnt (${e.fremd} Versuche)`);
  check(e.sichten.every((s) => s.sicht1.rs === undefined && s.sicht2.rs === undefined) && e.sichten.every((s) => !("r" in s.sicht1)), `${name}: Keine Sicht enthält den Zustand des Zufallsgenerators`);
  if (name === "Königsmord") {
    const vor = e.sichten.filter((s) => !s.sicht1.ende), k = e.st.arena.koenig;
    check(vor.length > 0 && vor.every((s) => s.sicht1.arena.koenig[1] === k[1] && s.sicht1.arena.koenig[2] === null && s.sicht2.arena.koenig[2] === k[2] && s.sicht2.arena.koenig[1] === null),
      "Königsmord: Jede Seite sieht nur den eigenen Anführer, der des Gegners bleibt verborgen");
    const nach = e.sichten[e.sichten.length - 1];
    check(Boolean(nach.sicht1.ende) && nach.sicht1.arena.koenig[2] === k[2] && nach.sicht2.arena.koenig[1] === k[1], "Königsmord: Nach dem Ende sind beide Anführer aufgedeckt");
    const f1 = e.st.figuren.filter((f) => f.team === 1), f2 = e.st.figuren.filter((f) => f.team === 2);
    check(k[1] === f1[1].id && k[2] === f2[2].id, "Königsmord: Die gewählten Anführer (Platz 2 und Platz 3) sind übernommen");
  }
  check(JSON.stringify(e.sichten[0].sicht1).length < 200000, `${name}: Eine Sicht bleibt handlich (${Math.round(JSON.stringify(e.sichten[0].sicht1).length / 1024)} KB)`);
}
// Festgelegter Modus (Normal, Arcade, privat) geht vor der Zufallszahl
{ const m = (modus) => Object.assign(match(4712, "gruft"), { modus }); // 4712 ergäbe „arena“
  const d = K.start(m("duell"), 0, 0, 0).st, h = K.start(m("horde"), 0, 0, 0).st, k = K.start(m("koenig"), 1, 1, 0).st, x = K.start(m("unsinn"), 0, 0, 0).st;
  check(d.arena.modus === "duell" && !d.figuren.some((f) => !R.teamVon(d, f)) && h.arena.modus === "horde" && k.arena.modus === "koenig" && Boolean(k.arena.koenig) && x.arena.modus === "arena",
    "Ein am Kampf festgelegter Modus gilt (Duell ohne Monster, Horde, Königsmord); eine unbekannte Angabe fällt auf das Los zurück"); }
// Unerlaubtes
{ const s = K.start(match(4712, "gruft"), 0, 0, 5000), st = s.st, a = R.aktiv(st), tm = R.teamVon(st, a);
  check(K.zug(st, tm, { typ: "bewegen", x: 99, y: 99 }, 6000).fehler && K.zug(st, tm, { typ: "aktion", aktion: "gibt_es_nicht" }, 6000).fehler && K.zug(st, tm, { typ: "zaubern" }, 6000).fehler && K.zug(st, 3, { typ: "ende" }, 6000).fehler,
    "Unerlaubte Züge (fremdes Feld, unbekannte Aktion, unbekannter Zug, dritte Seite) werden abgelehnt");
  check(R.aktiv(st).id === a.id && st.arena.zugBis === 5000 + K.ZUGZEIT, "Abgelehnte Züge verändern nichts; die Zugzeit läuft ab dem Start eine Minute");
  // Zugzeit
  check(K.zeit(st, 5000 + K.ZUGZEIT - 1).schritte.length === 0 && R.aktiv(st).id === a.id, "Vor Ablauf der Zugzeit passiert nichts");
  const z = K.zeit(st, 5000 + K.ZUGZEIT + 1);
  check(z.schritte.length >= 1 && R.aktiv(st).id !== a.id && /Zugzeit von .* ist abgelaufen/.test(st.log.map((l) => l.t).join(" ")), "Nach Ablauf endet der Zug des Helden, der nächste ist dran");
}
// Aufgabe durch Zeitablauf: Team 2 tut nie etwas, Team 1 beendet immer sofort
{ const s = K.start(match(4715, "gruft"), 0, 0, 0); const st = s.st; let jetzt = 0, n = 0;
  while (!st.ende && n++ < 200) { const a = R.aktiv(st), tm = R.teamVon(st, a); jetzt += 1000;
    if (tm === 1) K.zug(st, 1, { typ: "ende" }, jetzt); else { jetzt = st.arena.zugBis + 1; K.zeit(st, jetzt); } }
  const erg = K.ergebnis(st);
  check(Boolean(st.ende) && erg.sieger === 1 && erg.grund === "aufgabe" && st.arena.zeitaus[2] === 3, "Lässt ein Team dreimal hintereinander die Zugzeit verstreichen, gewinnt das andere (Grund: Aufgabe)");
}
// Wer zieht, setzt den Zähler zurück
{ const s = K.start(match(4715, "gruft"), 0, 0, 0); const st = s.st; let jetzt = 0, aus = 0, n = 0;
  while (!st.ende && n++ < 60) { const a = R.aktiv(st), tm = R.teamVon(st, a); jetzt += 1000;
    if (tm === 2 && aus < 2) { jetzt = st.arena.zugBis + 1; K.zeit(st, jetzt); aus++; } else K.zug(st, tm, { typ: "ende" }, jetzt); }
  check(!st.ende && st.arena.zeitaus[2] === 0, "Zieht das Team wieder selbst, beginnt die Zählung von vorn");
}
console.log(ok ? "\nARENA-KERN IN ORDNUNG" : "\nARENA-KERN: FEHLER"); process.exit(ok ? 0 : 1);
