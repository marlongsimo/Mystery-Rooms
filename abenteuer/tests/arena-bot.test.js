/*
 * Mythara – Arena, Rechner-Gegner (server/arena-bot.js mit server/arena-kern.js) in Node, ohne Netz und Datenbank.
 * Spielt ganze Kämpfe in allen vier Modi: Team 1 zieht mit zufälligen erlaubten Zügen (oder ebenfalls mit der Bot-Logik),
 * Team 2 ist der Rechner-Gegner. Geprüft: Er zieht nur nach seiner Bedenkzeit, nie für den Spieler, lässt keine Zugzeit
 * verstreichen, die Sicht verrät ihn nicht, er nutzt Fähigkeiten, heilt und richtet auf – und er gewinnt gegen Zufallszüge.
 * Aufruf: node abenteuer/tests/arena-bot.test.js [Kämpfe je Modus]
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js"); const botF = require("../server/arena-bot.js");
const K = kern(R, D.KARTEN, botF), BOT = botF(R);
const N = Number(process.argv[2]) || 8;
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const HELDEN = Object.keys(R.FD.FIGUREN || R.FD.figuren || {}).filter((k) => k !== "wolf");
let zs = 4711; const zf = () => { zs = (zs * 1103515245 + 12345) & 0x7fffffff; return zs / 0x7fffffff; };
const drei = () => HELDEN.slice().sort(() => zf() - 0.5).slice(0, 3);
const match = (seed, modus, stufe) => ({ seed, modus, karte: "garten", begegnung: "kobolde", kampfstufe: stufe, host_name: "Anna", guest_name: "Rurik", bot: true,
  host_team: drei().map((held) => ({ held, stufe })), guest_team: drei().map((held) => ({ held, stufe })) });
function zufallsZug(st, bewegt, gehandelt) {
  const a = R.aktiv(st);
  if (!gehandelt) { const akt = R.aktionenVon(a, st).filter((x) => !R.grund(st, x.id));
    for (const x of akt.sort(() => zf() - 0.5)) { const z = R.ziele(st, x.id); if (z.length) return { typ: "aktion", aktion: x.id, ziel: z[Math.floor(zf() * z.length)].id }; } }
  if (!bewegt) { const f = [...R.bewegungsfelder(st, a).keys()].filter((k) => k !== a.x + "," + a.y); if (f.length) { const [x, y] = f[Math.floor(zf() * f.length)].split(",").map(Number); return { typ: "bewegen", x, y }; } }
  return { typ: "ende" };
}
/** Ein Kampf wie über die Edge Function: speichern und laden zwischen den Aufrufen. gegner: "zufall" | "klug" */
function spiele(seed, modus, gegner, stufe) {
  let jetzt = 1000000, gesp; const m = match(seed, modus, stufe), stat = { arten: {}, botSchritte: 0, frueh: 0, fremd: 0, verraten: 0, zeitaus: 0, maxMs: 0, heil: 0, auf: 0, laufN: 0, fehler: [] };
  const merkArt = (st0, w) => { if (w.typ !== "aktion") { if (w.typ === "bewegen") stat.laufN++; return; } const a = R.aktionenVon(R.aktiv(st0), st0).find((x) => x.id === w.aktion); if (a) { stat.arten[a.art] = (stat.arten[a.art] || 0) + 1; if (/heilung|trank|massenheil|bewahren/.test(a.art)) stat.heil++; if (a.art === "aufrichten") stat.auf++; } };
  const pruefSicht = (schritte) => { for (const s of schritte) for (const v of [s.sicht1, s.sicht2]) { if (JSON.stringify(v).includes('"bot"') || v.rs != null) stat.verraten++; if (/abgelaufen|verstreichen/.test(JSON.stringify(v.log.slice(-3))) ) stat.zeitaus++; } };
  { const s = K.start(m, 0, 0, jetzt); pruefSicht(s.schritte); gesp = K.speichern(s.st); }
  let merk = { lauf: 0, wer: null }, bew = false, geh = false, wer = null;
  for (let i = 0; i < 6000; i++) {
    const st = K.laden(gesp); if (st.ende) return Object.assign(stat, { sieger: st.arena.sieger, runden: st.runde, modus: st.arena.modus, grund: st.arena.grund, st });
    const a = R.aktiv(st), tm = R.teamVon(st, a);
    if (!tm) { stat.fehler.push("Monster am Zug"); break; }
    if (tm === 2) {
      // vor der Bedenkzeit passiert nichts; der Spieler kann den Zug nicht für den Gegner machen
      if (i % 5 === 0) { const r = K.zeit(K.laden(gesp), st.arena.bot.bis - 1); if (r.schritte.length) stat.frueh++; const f = K.zug(K.laden(gesp), 1, { typ: "ende" }, jetzt); if (!f.fehler) stat.fremd++; }
      jetzt = Math.max(jetzt, st.arena.bot.bis) + 50;
      const vorher = K.laden(gesp), t0 = Date.now();
      const r = K.zeit(st, jetzt); stat.maxMs = Math.max(stat.maxMs, Date.now() - t0);
      if (!r.schritte.length) { stat.fehler.push("Bot zieht nicht"); break; }
      stat.botSchritte++; pruefSicht(r.schritte);
      { const w = st.arena.bot && st.arena.bot.letzt; if (w) merkArt(vorher, w); else if (!st.ende) stat.fehler.push("kein Schritt vermerkt"); }
      gesp = K.speichern(st); continue;
    }
    const k = a.id + ":" + st.runde; if (wer !== k) { wer = k; bew = false; geh = false; merk = { lauf: 0 }; }
    jetzt += 1500;
    const w = gegner === "klug" ? BOT.entscheide(st, merk) : zufallsZug(st, bew, geh);
    if (w.typ === "bewegen") { bew = true; merk.lauf++; } else if (w.typ === "aktion") geh = true;
    let r = K.zug(st, 1, w, jetzt); if (r.fehler) r = K.zug(st, 1, { typ: "ende" }, jetzt);
    if (r.fehler) { stat.fehler.push(r.fehler); break; }
    pruefSicht(r.schritte); gesp = K.speichern(st);
  }
  stat.fehler.push("Kampf endet nicht"); return stat;
}
console.log("Rechner-Gegner der Arena");
check(HELDEN.length >= 10, `Alle ${HELDEN.length} Helden stehen zur Auswahl`);
const alle = [], t0 = Date.now();
for (const modus of ["duell", "arena", "koenig", "horde"]) for (let i = 0; i < N; i++) alle.push(spiele(1000 + i * 37 + modus.length, modus, "zufall", 1 + (i * 3) % 10));
const fehler = alle.flatMap((s) => s.fehler), arten = {}; for (const s of alle) for (const k in s.arten) arten[k] = (arten[k] || 0) + s.arten[k];
check(!fehler.length && alle.every((s) => s.sieger === 1 || s.sieger === 2), `${alle.length} Kämpfe in vier Modi laufen bis zum Ende` + (fehler.length ? " – " + [...new Set(fehler)].join("; ") : ""));
check(alle.every((s) => s.frueh === 0), "Vor Ablauf seiner Bedenkzeit zieht der Gegner nicht");
check(alle.every((s) => s.fremd === 0), "Der Spieler kann nicht für den Gegner ziehen");
check(alle.every((s) => s.verraten === 0), "Die Sichten der Spieler enthalten weder den Würfelstand noch einen Hinweis auf den Rechner-Gegner");
check(alle.every((s) => s.zeitaus === 0), "Der Gegner lässt nie die Zugzeit verstreichen");
const siege = alle.filter((s) => s.sieger === 2).length;
check(siege >= alle.length * 0.8, `Gegen zufällige Züge gewinnt er ${siege} von ${alle.length} Kämpfen`);
check(Object.keys(arten).length >= 8, `Er nutzt viele Arten von Fähigkeiten: ${Object.entries(arten).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + n).join(", ")}`);
check(alle.reduce((a, s) => a + s.heil, 0) > 0, `Er heilt (${alle.reduce((a, s) => a + s.heil, 0)}-mal)`);
// Gestellte Lage: Ein Verbündeter liegt direkt neben dem Helden am Zug am Boden – er richtet ihn auf (oder heilt ihn)
{ let n = 0, gut = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const s = K.start(match(900 + seed, "duell", 5), 0, 0, 1000), st = s.st;
    for (let i = 0; i < 12 && R.teamVon(st, R.aktiv(st)) !== 2; i++) K.zug(st, 1, { typ: "ende" }, 2000);
    const f = R.aktiv(st); if (R.teamVon(st, f) !== 2) continue;
    const freund = st.figuren.find((o) => o.team === 2 && o !== f), frei = [...R.bewegungsfelder(st, f).keys()].map((k) => k.split(",").map(Number)).find(([x, y]) => Math.max(Math.abs(x - f.x), Math.abs(y - f.y)) === 1);
    if (!freund || !frei) continue;
    freund.x = frei[0]; freund.y = frei[1]; freund.tp = 0; n++;
    const w = BOT.entscheide(st, { lauf: 0 });
    if (w.typ === "aktion" && w.ziel === freund.id) gut++;
  }
  check(n >= 8 && gut >= n - 1, `Liegt ein Verbündeter neben ihm am Boden, richtet er ihn auf oder heilt ihn (${gut} von ${n} gestellten Lagen; im Spiel ${alle.reduce((a, s) => a + s.auf, 0)}-mal)`); }
const maxMs = Math.max(...alle.map((s) => s.maxMs));
check(maxMs < 1500, `Ein Schritt braucht höchstens ${maxMs} ms Rechenzeit (${alle.reduce((a, s) => a + s.botSchritte, 0)} Schritte, ${Math.round((Date.now() - t0) / 1000)} s gesamt)`);
// Bot gegen Bot-Logik: ausgeglichen (kein Vorteil durch verdecktes Wissen), und beide Seiten gewinnen
const spiegel = []; for (const modus of ["duell", "koenig"]) for (let i = 0; i < N; i++) spiegel.push(spiele(5000 + i * 53, modus, "klug", 5));
const s2 = spiegel.filter((s) => s.sieger === 2).length;
check(spiegel.every((s) => !s.fehler.length) && s2 > 0 && s2 < spiegel.length, `Gegen dieselbe Logik auf der anderen Seite gewinnt er ${s2} von ${spiegel.length} (beide Seiten kommen zum Zug)`);
// Königsmord: Der Anführer des Gegners ist dem Bot verborgen (Vorlage), sein eigener ist der zäheste
{ const m = match(77, "koenig", 5), s = K.start(m, 1, 0, 1000), st = s.st, k2 = st.figuren.find((f) => f.id === st.arena.koenig[2]), t2 = st.figuren.filter((f) => f.team === 2);
  check(t2.every((f) => f.tpMax * f.rk <= k2.tpMax * k2.rk), `Königsmord: Er bestimmt seinen zähesten Helden zum Anführer (${k2.name})`);
  check(s.schritte.every((x) => x.sicht1.arena.koenig[2] === null), "… und der bleibt dem Spieler verborgen"); }
console.log(ok ? "\nARENA-BOT IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
