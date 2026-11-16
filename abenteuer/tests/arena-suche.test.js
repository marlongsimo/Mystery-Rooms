/*
 * Mythara – neue Arena (Vorschau unter ?arena=suche): gespeichertes Team und Gegnersuche, zwei Spieler in zwei Browser-Kontexten.
 * Die Funktionen der Datenbank (Migration 008 und 014) sind hier nachgebildet; die Live-Verbindung zwischen den Geräten ist echt.
 * Die Datenbankfunktionen selbst prüft supabase/tests/014_rpg_arena_team_suche_test.sql.
 * Aufruf: node abenteuer/tests/arena-suche.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell&arena=suche";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
// Nachgebildeter Server
const DB = { kaempfe: [], nr: 0, teams: {}, suchend: {}, xp: { A: { schildwaechter: 1350, lichtbringer: 260 }, B: { berserker: 850 }, C: {} } };
const stufe = (xp) => { const bis = [100, 150, 250, 350, 500, 700, 900, 1200, 1500]; let s = 1, r = xp || 0; while (s < 10 && r >= bis[s - 1]) { r -= bis[s - 1]; s++; } return s; };
const team = (ich, helden) => helden.map((h) => ({ held: h, stufe: stufe(DB.xp[ich][h]) }));
const schnitt = (t) => Math.round(t.reduce((a, h) => a + h.stufe, 0) / t.length * 10) / 10;
const sicht = (m, ich) => { const seite = m.hostWer === ich ? 1 : 2;
  return { id: m.id, status: m.status, seite, host: { name: m.host.name, schnitt: m.host.schnitt, team: seite === 1 || m.gast ? m.host.team : null }, gast: m.gast || null, karte: m.karte, begegnung: m.begegnung, seed: m.seed, room_code: m.room,
    kampfstufe: Math.round(Math.max(m.host.schnitt, m.gast ? m.gast.schnitt : m.host.schnitt)), sieger: null, grund: null, punkte: null, runden: null, belohnung: null }; };
const meiner = (ich, st) => DB.kaempfe.filter((m) => (m.hostWer === ich || m.gastWer === ich) && st.includes(m.status)).pop() || null;
function server(ich, name, args) {
  const fehler = (t) => ({ fehler: t }), squad = () => (DB.teams[ich] ? { konto: true, team: team(ich, DB.teams[ich]), schnitt: schnitt(team(ich, DB.teams[ich])) } : { konto: true, team: null });
  if (name === "rpg_my_wallet") return { konto: true, waehrung: 0 };
  if (name === "rpg_arena_list") { const m = meiner(ich, ["offen", "bereit", "laeuft"]); return { konto: true, waehrung: 0, heute: 0, nur_siege: true, offen: [], mein: m ? sicht(m, ich) : null }; }
  if (name === "rpg_arena_modes") return {};
  if (name === "rpg_arena_squad") return squad();
  if (name === "rpg_arena_squad_set") { if ((args.p_team || []).length !== 3) return fehler("Wähle genau drei verschiedene Helden."); DB.teams[ich] = args.p_team; return squad(); }
  if (name === "rpg_arena_search") {
    if (!DB.teams[ich]) return fehler("Lege zuerst dein Team fest.");
    DB.aufrufe = (DB.aufrufe || 0) + 1;
    const laeuft = meiner(ich, ["bereit", "laeuft"]); if (laeuft) return sicht(laeuft, ich);
    const t = team(ich, DB.teams[ich]), s = schnitt(t), mein = meiner(ich, ["offen"]);
    const ziel = DB.kaempfe.find((m) => m.status === "offen" && m.hostWer !== ich && DB.suchend[m.id] && Math.abs(m.host.schnitt - s) <= 1 && (!mein || m.nr < mein.nr));
    if (ziel) { if (mein) mein.status = "abgebrochen"; Object.assign(ziel, { status: "bereit", gastWer: ich, gast: { name: "Spieler " + ich, schnitt: s, team: t }, karte: "gruft", begegnung: "kobolde", seed: 4712 }); return sicht(ziel, ich); }
    if (mein) return sicht(mein, ich);
    const m = { id: "00000000-0000-0000-0000-0000000000" + String(10 + DB.nr), nr: DB.nr++, status: "offen", hostWer: ich, host: { name: "Spieler " + ich, schnitt: s, team: t } }; DB.kaempfe.push(m); DB.suchend[m.id] = true; return sicht(m, ich);
  }
  const m = DB.kaempfe.find((x) => x.id === args.p_match_id); if (!m) return fehler("Diesen Kampf gibt es nicht.");
  if (name === "rpg_arena_get") return sicht(m, ich);
  if (name === "rpg_arena_room") { m.room = args.p_code; m.status = "laeuft"; return sicht(m, ich); }
  if (name === "rpg_arena_cancel") { DB.abbruch = (DB.abbruch || 0) + 1; if (m.status === "offen" || m.status === "bereit") m.status = "abgebrochen"; return sicht(m, ich); }
  return fehler("unbekannt: " + name);
}
async function spieler(b, ich, mobil) {
  const ctx = await b.newContext({ viewport: mobil ? { width: 390, height: 800 } : { width: 1200, height: 900 } }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler " + ich, avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: DB.xp[ich] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|my_wallet)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(ich, name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 });
  return { p, fehler, ich };
}
const warte = (p, fn, arg, t = 30000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true, () => false);
const shot = async (p, name) => { if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/" + name + ".png", fullPage: true }); };
(async () => {
  const b = await chromium.launch();
  const A = await spieler(b, "A"), B = await spieler(b, "B", true), C = await spieler(b, "C");
  // Übersicht ohne Team
  await A.p.click('.dorf-ort[data-hub="arena"]'); await A.p.waitForSelector(".arena-meinteam");
  check(await A.p.evaluate(() => !document.querySelector("#arena-erstellen") && !document.querySelector(".arena-liste") && !/Offene Kämpfe/.test(document.querySelector("[data-arena]").textContent)), "Neue Arena: kein „Kampf erstellen“, keine Liste offener Kämpfe");
  check(await A.p.evaluate(() => document.querySelectorAll(".arena-meinteam .arena-held.leer").length === 3 && document.querySelector("#arena-suchen").disabled && /Team festlegen/.test(document.querySelector("#arena-team-aendern").textContent)), "Ohne Team: drei freie Plätze, „Team festlegen“, Suche gesperrt");
  await shot(A.p, "suche-1-ohne-team");
  // Team festlegen
  await A.p.click("#arena-team-aendern");
  for (const f of ["schildwaechter", "lichtbringer", "wildnislaeufer"]) await A.p.click(`[data-arena-held="${f}"]`);
  check(/3 von 3/.test(await A.p.textContent(".arena-schnitt")) && /Team speichern/.test(await A.p.textContent("#arena-wahl-ok")), "Heldenwahl „Mein Team“: drei Helden, Knopf „Team speichern“");
  await A.p.click("#arena-wahl-ok"); await A.p.waitForSelector(".arena-meinteam .arena-held:not(.leer)");
  const mt = (await A.p.textContent(".arena-meinteam")).replace(/\s+/g, " ");
  check(/Torvald/.test(mt) && /Elara/.test(mt) && /Stufe 6/.test(mt) && /Ø 3,3/.test(mt) && await A.p.evaluate(() => !document.querySelector("#arena-suchen").disabled), "Mein Team steht oben: Helden, Stufen und Schnitt 3,3; Suche freigegeben");
  check(/2,3 bis 4,3/.test(await A.p.textContent("[data-arena] > .note")), "Hinweis: gesucht wird Stufe 2,3 bis 4,3");
  await shot(A.p, "suche-2-mein-team");
  // gespeichert: nach dem Neuladen noch da
  await A.p.reload(); await A.p.waitForSelector('.dorf-ort[data-hub="arena"]'); await A.p.click('.dorf-ort[data-hub="arena"]'); await A.p.waitForSelector(".arena-meinteam .arena-held:not(.leer)");
  check(/Torvald/.test(await A.p.textContent(".arena-meinteam")), "Nach dem Neuladen: Das Team kommt aus der Datenbank zurück");
  // bearbeiten: Vorauswahl ist das gespeicherte Team
  await A.p.click("#arena-team-aendern");
  check(await A.p.evaluate(() => document.querySelectorAll("[data-arena-held].an").length === 3 && document.querySelector('[data-arena-held="schildwaechter"]').classList.contains("an")), "Team bearbeiten: Die gespeicherten Helden sind vorgewählt");
  await A.p.click("#arena-wahl-zurueck"); await A.p.waitForSelector("#arena-suchen");
  // Suchen und abbrechen
  await A.p.click("#arena-suchen"); await A.p.waitForSelector(".arena-suche");
  check(/Suche nach einem Gegner/.test(await A.p.textContent(".arena-suche")) && await A.p.isVisible("#arena-suche-ab") && await A.p.evaluate(() => document.querySelectorAll(".arena-suche-team img").length === 3), "Suchbildschirm: Hinweis, eigenes Team, „Abbrechen“");
  await shot(A.p, "suche-3-suchbildschirm");
  await A.p.waitForTimeout(3600);
  check(DB.aufrufe >= 2 && DB.kaempfe.filter((m) => m.status === "offen").length === 1 && /0:0[3-9]/.test(await A.p.textContent("#arena-suche-zeit")), "Während der Suche: regelmäßiges Lebenszeichen, genau ein Sucheintrag, die Uhr läuft");
  await A.p.click("#arena-suche-ab"); await A.p.waitForSelector(".arena-meinteam");
  check(DB.kaempfe.every((m) => m.status !== "offen") && DB.abbruch >= 1, "Abbrechen: zurück zur Übersicht, der Sucheintrag ist ausgetragen");
  const vorher = DB.aufrufe; await A.p.waitForTimeout(3600);
  check(DB.aufrufe === vorher, "Nach dem Abbrechen wird nicht weiter gesucht");
  // C (Stufe 1) und A (Stufe 3,3) passen nicht zusammen
  await C.p.click('.dorf-ort[data-hub="arena"]'); await C.p.waitForSelector("#arena-team-aendern"); await C.p.click("#arena-team-aendern");
  for (const f of ["trickser", "elementarist", "duellant"]) await C.p.click(`[data-arena-held="${f}"]`);
  await C.p.click("#arena-wahl-ok"); await C.p.waitForSelector("#arena-suchen:not([disabled])"); await C.p.click("#arena-suchen"); await C.p.waitForSelector(".arena-suche");
  await A.p.click("#arena-suchen"); await A.p.waitForSelector(".arena-suche"); await A.p.waitForTimeout(4000);
  check(await A.p.isVisible(".arena-suche") && await C.p.isVisible(".arena-suche") && DB.kaempfe.filter((m) => m.status === "offen").length === 2, "A (3,3) und C (1,0) suchen beide: zu weit auseinander, keiner wird verbunden");
  // B (2,3) sucht: wird mit A verbunden
  await B.p.click('.dorf-ort[data-hub="arena"]'); await B.p.waitForSelector("#arena-team-aendern"); await B.p.click("#arena-team-aendern");
  for (const f of ["trickser", "elementarist", "berserker"]) await B.p.click(`[data-arena-held="${f}"]`);
  await B.p.click("#arena-wahl-ok"); await B.p.waitForSelector("#arena-suchen:not([disabled])"); await shot(B.p, "suche-4-handy-team"); await B.p.click("#arena-suchen");
  const bDa = await B.p.waitForSelector(".arena-gegenueber", { timeout: 15000 }).then(() => true, () => false), aDa = await A.p.waitForSelector(".arena-gegenueber", { timeout: 15000 }).then(() => true, () => false);
  check(bDa && aDa, "B (2,3) sucht: A und B landen beide in der Aufstellung");
  const auf = (await B.p.textContent(".arena-gegenueber")).replace(/\s+/g, " ");
  check(/Spieler A/.test(auf) && /Torvald/.test(auf) && /Ragnar/.test(auf) && /Das Los hat entschieden/.test(await B.p.textContent("#arena-modus-text")), "Aufstellung: beide gespeicherten Teams, Modus ausgelost");
  check(await C.p.isVisible(".arena-suche"), "C sucht weiter");
  const zaehlt = await warte(B.p, () => /beginnt in \d+/.test((document.querySelector("#arena-status") || {}).textContent || ""), null, 30000);
  check(zaehlt, "Die Verbindung steht: Der Countdown bis zum Start läuft");
  const imKampf = await warte(A.p, () => { const s = document.querySelector("#spiel"); return s && !s.hidden && document.querySelectorAll("#karte .fig").length >= 6; }, null, 40000);
  check(imKampf, "Der Kampf beginnt wie in der bisherigen Arena");
  await C.p.click("#arena-suche-ab"); await C.p.waitForSelector(".arena-meinteam");
  for (const s of [A, B, C]) check(s.fehler.length === 0, `keine Skriptfehler bei ${s.ich}${s.fehler.length ? ": " + s.fehler.join(" | ") : ""}`);
  await b.close();
  console.log(ok ? "\nARENA-SUCHE IN ORDNUNG" : "\nARENA-SUCHE: FEHLER"); process.exit(ok ? 0 : 1);
})();
