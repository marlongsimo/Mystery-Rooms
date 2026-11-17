/*
 * Mythara – Arena, verlassener Kampf gegen den Rechner-Gegner: Der Server holt nach, was in der Abwesenheit geschehen wäre
 * (abgelaufene Zugzeiten, Züge des Rechners) – wie gegen einen Menschen, dessen Gerät den Kampf in Gang hält.
 * Aufruf: node abenteuer/tests/arena-nachholen.test.js
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js"); const botF = require("../server/arena-bot.js");
const K = kern(R, D.KARTEN, botF);
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const match = (bot, seed) => ({ staerke: 1, seed, modus: "duell", karte: "garten", begegnung: "kobolde", kampfstufe: 5, host_name: "Anna", guest_name: "Rurik", bot,
  host_team: ["berserker", "trickser", "wanderheiler"].map((held) => ({ held, stufe: 5 })), guest_team: ["duellant", "assassine", "lichtbringer"].map((held) => ({ held, stufe: 5 })) });
/** Bis der Spieler (Team 1) am Zug ist: Rechner-Züge im normalen Takt */
function bisSpieler(st, jetzt) { for (let i = 0; i < 200 && !st.ende; i++) { const a = R.aktiv(st); if (R.teamVon(st, a) === 1) break; jetzt = Math.max(jetzt, st.arena.bot.bis) + 50; K.zeit(st, jetzt); } return jetzt; }
console.log("Verlassener Kampf gegen den Rechner-Gegner");
// 1) Im laufenden Spiel bleibt es bei einem Schritt je Aufruf
{ const st = K.start(match(true, 5), 0, 0, 1e6).st; let jetzt = 1e6, einzeln = true, n = 0;
  for (let i = 0; i < 30 && !st.ende; i++) { const a = R.aktiv(st); if (R.teamVon(st, a) !== 2) { K.zug(st, 1, { typ: "ende" }, jetzt += 1000); continue; } jetzt = Math.max(jetzt, st.arena.bot.bis) + 50; const r = K.zeit(st, jetzt); n++; if (r.schritte.length !== 1) einzeln = false; }
  check(n > 5 && einzeln, `Im laufenden Spiel: ein Schritt des Rechners je Anfrage (${n} Anfragen)`); }
// 2) Kurz weg (gut eine Minute): ein Zug verfällt, der Kampf geht weiter
{ const st = K.start(match(true, 7), 0, 0, 1e6).st; let jetzt = bisSpieler(st, 1e6); const wer = R.aktiv(st).name, bis = st.arena.zugBis;
  const r = K.zeit(st, bis + 15000), log = st.log.map((e) => e.t || "").join("\n");
  check(!st.ende && r.schritte.length >= 1 && new RegExp(`Die Zugzeit von ${wer} ist abgelaufen`).test(log) && (st.arena.zeitaus[1] || 0) >= 1, `75 Sekunden weg: Der Zug von ${wer} verfällt, der Kampf läuft weiter (${r.schritte.length} Schritte nachgeholt)`);
  const a = R.aktiv(st), faellig = R.teamVon(st, a) === 2 ? st.arena.bot.bis : st.arena.zugBis;
  check(faellig > bis + 15000 - 8000, "Danach ist der Kampf wieder in der Gegenwart: Der nächste Schritt ist noch nicht (oder gerade erst) fällig"); }
// 3) Lange weg: Der Kampf ist verloren – dreimal in Folge die Zugzeit verstrichen
{ const st = K.start(match(true, 9), 0, 0, 1e6).st; let jetzt = bisSpieler(st, 1e6); const bis = st.arena.zugBis; let schritte = 0, rufe = 0, max = 0;
  for (; rufe < 20 && !st.ende; rufe++) { const r = K.zeit(st, bis + 20 * 60000); schritte += r.schritte.length; max = Math.max(max, r.schritte.length); if (!r.schritte.length) break; }
  const ab = st.log.filter((e) => /Die Zugzeit von .* ist abgelaufen/.test(e.t || "")).length, e = K.ergebnis(st);
  check(st.ende === "arena" && st.arena.sieger === 2 && /dreimal die Zugzeit/.test(st.arena.grund) && e && e.grund === "aufgabe" && ab >= 3, `20 Minuten weg: Der Kampf ist verloren (${ab}× Zugzeit abgelaufen, gewertet wie eine Aufgabe)`);
  check(max <= 60 && schritte > 3, `Nachgeholt in höchstens 60 Schritten je Anfrage (${schritte} Schritte in ${rufe} Anfragen, größte ${max})`);
  }
// 4) Hat der Spieler dazwischen gezogen, zählt es nicht als „dreimal in Folge“
{ const st = K.start(match(true, 11), 0, 0, 1e6).st; let jetzt = bisSpieler(st, 1e6);
  K.zeit(st, st.arena.zugBis + 15000); const nach1 = (st.arena.zeitaus || {})[1] || 0; jetzt = st.arena.zugBis || jetzt;
  for (let i = 0; i < 60 && !st.ende; i++) { const a = R.aktiv(st); if (R.teamVon(st, a) === 1) break; K.zeit(st, st.arena.bot.bis + 50); }
  const r = K.zug(st, 1, { typ: "ende" }, (st.arena.zugBis || jetzt) - 30000);
  check(nach1 >= 1 && !r.fehler && st.arena.zeitaus[1] === 0, "Wer zurückkommt und zieht, beginnt wieder bei null verstrichenen Zügen"); }
// 5) Gegen einen Menschen bleibt alles wie bisher: ein abgelaufener Zug je Anfrage
{ const st = K.start(match(false, 13), 0, 0, 1e6).st; const bis = st.arena.zugBis; const r = K.zeit(st, bis + 20 * 60000);
  check(!st.arena.bot && r.schritte.length >= 1 && !st.ende && st.log.filter((e) => /Zugzeit von .* ist abgelaufen/.test(e.t || "")).length === 1, "Gegen einen Menschen unverändert: je Anfrage verfällt genau ein Zug (das Gerät des Gegners fragt weiter nach)"); }
console.log(ok ? "\nNACHHOLEN IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
