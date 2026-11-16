/*
 * Mythara – Elara und Seran (Überarbeitung) und die Wirkungen verteidigender Helden in der Arena.
 * Spielt Duelle Rechner gegen Rechner (server/arena-kern.js mit server/arena-bot.js) und prüft an der Chronik, dass die neuen
 * Fähigkeiten vorkommen und dass Reaktionen und Schutzwirkungen des Teams, das gerade NICHT am Zug ist, in der Arena auslösen.
 * Aufruf: node abenteuer/tests/kleriker.test.js [Kämpfe je Paarung]
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js"); const botF = require("../server/arena-bot.js");
const K = kern(R, D.KARTEN, botF), BOT = botF(R), F = R.FD.FIGUREN;
const N = Number(process.argv[2]) || 14;
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const MUSTER = { parade: /pariert und sticht/, schutzhaltung: /Schutzhaltung\)/, glyphe: /Schutzglyphe/, arkan: /arkanen Schild/, aura: /Aura sengt/, lichtHeilt: /Heiliges Licht.*heilt|heilt.*Heiliges Licht/, geblendet: /Gleißendes Licht – .* ist geblendet/,
  richtspruch: /Richtspruch –/, knie: /Befehl: Knie! – .* (ist liegt|widersteht)/, entzaubert: /Bannen – .* verliert/, suehne: /Sühne/, segen: /segnet/, schutzkreis: /zieht einen Schutzkreis/ };
const zahl = {}, fehler = []; let kaempfe = 0, segenUndAngriff = 0, kreisRk = 0;
function spiele(t1, t2, stufe, seed) {
  const m = { staerke: 1, seed, modus: "duell", karte: ["garten", "turm", "halle"][seed % 3], begegnung: "kobolde", kampfstufe: stufe, host_name: "A", guest_name: "B", bot: true, host_team: t1.map((held) => ({ held, stufe })), guest_team: t2.map((held) => ({ held, stufe })) };
  let jetzt = 1e6; const st = K.start(m, 0, 0, jetzt).st; let merk = { lauf: 0 }, wer = null, gelesen = 0, zugTexte = [];
  for (let i = 0; i < 6000 && !st.ende; i++) {
    const a = R.aktiv(st), tm = R.teamVon(st, a); if (!tm) { fehler.push("kein Team am Zug"); break; }
    const key = a.id + ":" + st.runde; if (wer !== key) { if (zugTexte.some((t) => /segnet|Schutzkreis:/.test(t)) && zugTexte.some((t) => /Heiliges Licht –|Streitkolben/.test(t))) segenUndAngriff++; zugTexte = []; }
    if (tm === 2) { jetzt = Math.max(jetzt, st.arena.bot.bis) + 50; if (!K.zeit(st, jetzt).schritte.length) { fehler.push("Rechner zieht nicht"); break; } }
    else { if (wer !== key) merk = { lauf: 0 }; jetzt += 1500; const w = BOT.entscheide(st, merk); if (w.typ === "bewegen") merk.lauf++; let r = K.zug(st, 1, w, jetzt); if (r.fehler) r = K.zug(st, 1, { typ: "ende" }, jetzt); if (r.fehler) { fehler.push(r.fehler); break; } }
    wer = key;
    for (const e of st.log) { if (e._g) continue; e._g = 1; const t = e.t || ""; zugTexte.push(t); for (const k in MUSTER) if (MUSTER[k].test(t)) zahl[k] = (zahl[k] || 0) + 1; }
    // Schutzkreis: Ein Verbündeter neben Elara hat gegen einen Angriff +2/+3 RK – auch wenn ihr Team gerade nicht am Zug ist
    const elara = st.figuren.find((f) => (f.fid || f.fidA) === "lichtbringer" && f.tp > 0 && f.z.schutzkreis > st.runde);
    if (elara && R.teamVon(st, elara) !== R.teamVon(st, R.aktiv(st))) { const freund = st.figuren.find((f) => f !== elara && R.teamVon(st, f) === R.teamVon(st, elara) && f.tp > 0 && Math.max(Math.abs(f.x - elara.x), Math.abs(f.y - elara.y)) <= 2 && !f.z.schild && !f.z.zeitriss && !(f.z.bruch) && f.z.analyse !== st.runde);
      if (freund && R.rkEff && R.rkEff(st, freund, null, {}) >= freund.rk + 2) kreisRk++; }
  }
  if (!st.ende) fehler.push("Kampf endet nicht"); kaempfe++;
}
console.log("Kleriker-Überarbeitung und Verteidiger-Wirkungen in der Arena");
const TEAMS = [["lichtbringer", "inquisitor", "duellant"], ["schildwaechter", "gelehrter", "berserker"], ["lichtbringer", "schildwaechter", "elementarist"], ["inquisitor", "schattenmagier", "wanderheiler"]];
for (let n = 0; n < N; n++) for (const [a, b] of [[0, 1], [1, 0], [2, 3], [3, 2], [0, 3], [2, 1]]) spiele(TEAMS[a], TEAMS[b], [1, 5, 10][n % 3], 500 + n * 13 + a * 7 + b);
check(!fehler.length, `${kaempfe} Duelle laufen fehlerfrei zu Ende` + (fehler.length ? ": " + [...new Set(fehler)].join(" | ") : ""));
const z = (k) => zahl[k] || 0;
check(z("parade") > 0, `Arena: Isoldes Parade löst aus (${z("parade")}×)`);
check(z("schutzhaltung") > 0, `Arena: Torvalds Schutzhaltung löst aus (${z("schutzhaltung")}×)`);
check(z("glyphe") + z("arkan") > 0, `Arena: Schutzglyphe und Arkaner Schild der Zauberer lösen aus (${z("glyphe")}× / ${z("arkan")}×)`);
check(z("aura") > 0, `Arena: Elaras Strahlende Aura sengt Gegner zu Beginn ihres Zugs (${z("aura")}×)`);
if (R.rkEff) check(kreisRk > 0, `Arena: Der Schutzkreis hebt die Rüstungsklasse auch, wenn Elaras Team nicht am Zug ist (${kreisRk}× beobachtet)`);
check(z("lichtHeilt") > 0, `Elara: Heiliges Licht heilt bei einem Treffer mit (${z("lichtHeilt")}×)`);
check(z("segen") + z("schutzkreis") > 0 && segenUndAngriff > 0, `Elara: Segen und Schutzkreis sind Bonusaktionen – im selben Zug greift sie an (${segenUndAngriff}×)`);
check(z("geblendet") > 0, `Elara: Gleißendes Licht blendet Lebende (${z("geblendet")}×)`);
check(z("richtspruch") > 0, `Seran: Richtspruch aus der Distanz (${z("richtspruch")}×)`);
check(z("knie") > 0, `Seran: Befehl „Knie!“ wird eingesetzt (${z("knie")}×)`);
check(z("entzaubert") > 0, `Seran: Bannen nimmt Lebenden ihre Verstärkungen (${z("entzaubert")}×)`);
check(z("suehne") > 0, `Seran: Sühne heilt ihn bei Hammertreffern auf das Brandmal-Ziel (${z("suehne")}×)`);
// Brandmal bindet: Schritte weg vom Inquisitor kosten doppelt
{ const m = { staerke: 1, seed: 7, modus: "duell", karte: "garten", begegnung: "kobolde", kampfstufe: 5, host_name: "A", guest_name: "B", bot: true, host_team: ["berserker", "duellant", "trickser"].map((held) => ({ held, stufe: 5 })), guest_team: ["inquisitor", "lichtbringer", "wanderheiler"].map((held) => ({ held, stufe: 5 })) };
  const st = K.start(m, 0, 0, 1e6).st; let a = R.aktiv(st); for (let i = 0; i < 40 && R.teamVon(st, a) !== 1; i++) { K.zeit(st, st.arena.bot.bis + 50 + i); a = R.aktiv(st); }
  const seran = st.figuren.find((f) => (f.fid || f.fidA) === "inquisitor"); const frei = [...R.bewegungsfelder(st, a).entries()];
  a.z.brandmal = seran.id; const gebunden = new Map(R.bewegungsfelder(st, a)); delete a.z.brandmal;
  const w = (x, y) => Math.max(Math.abs(x - seran.x), Math.abs(y - seran.y)) + 0.5 * Math.min(Math.abs(x - seran.x), Math.abs(y - seran.y)), hier = w(a.x, a.y);
  const weg = frei.filter(([k]) => { const [x, y] = k.split(",").map(Number); return w(x, y) > hier; }), hin = frei.filter(([k]) => { const [x, y] = k.split(",").map(Number); return w(x, y) < hier; });
  const verloren = frei.filter(([k]) => !gebunden.has(k)), nah = hin.filter(([k]) => { const [x, y] = k.split(",").map(Number); return Math.max(Math.abs(x - a.x), Math.abs(y - a.y)) <= 1; });
  check(verloren.length > 0 && nah.every(([k]) => gebunden.has(k)) && [...gebunden.keys()].every((k) => frei.some(([f2]) => f2 === k)),
    `Seran: Brandmal bindet – ${a.name} erreicht von ${frei.length} Feldern nur noch ${gebunden.size}; Schritte direkt auf Seran zu bleiben frei`); }
check(F.lichtbringer.faehig.find((x) => x.id === "segen").typ === "bonus" && F.lichtbringer.faehig.find((x) => x.id === "schutzkreis").typ === "bonus" && F.lichtbringer.faehig.find((x) => x.id === "vertreiben").name === "Gleißendes Licht"
  && F.inquisitor.faehig.some((x) => x.id === "richtspruch") && F.inquisitor.faehig.some((x) => x.id === "befehl_knie"), "Fähigkeitenlisten: Segen und Schutzkreis als Bonusaktion, Gleißendes Licht, Richtspruch, Befehl „Knie!“");
console.log(ok ? "\nKLERIKER IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
