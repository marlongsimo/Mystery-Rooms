/*
 * Mythara – Arena, Serverkampf im Browser (Vorschau unter ?arena=server): zwei Spieler, der Server rechnet.
 * Die Edge Function ist die GEBAUTE Datei (über tests/arena-server-attrappe.js in Node geladen); nachgebildet sind nur
 * die Datenbankfunktionen. Zwischen den Geräten gibt es keine Live-Verbindung mehr – beide reden nur mit dem Server.
 * Vorher bauen: node abenteuer/tools/arena-funktion-bauen.js
 * Aufruf: node abenteuer/tests/arena-server.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden"); const attrappe = require("./arena-server-attrappe.js"); const R = require("../js/regeln.js");
const URL = "http://localhost:8765/abenteuer/index.html?schnell&arena=server" + (process.env.HANDY ? "&handy=neu" : ""); // HANDY=1: neue Handy-Bedienung (nur für Bilder; der Ablauf unten bedient die bisherigen Knöpfe)
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const S = attrappe(); Object.assign(S.db.nutzer, { "tok-A": "nutzer-A", "tok-B": "nutzer-B" });
const ID = "00000000-0000-0000-0000-00000000d001";
const DB = { teams: {}, suchend: null, arten: [], einl: null, suchAb: 0, xp: { A: { schildwaechter: 1350, lichtbringer: 260 }, B: { berserker: 850 } }, live: 0, anf: 0 };
const stufe = (xp) => { const bis = [100, 150, 250, 350, 500, 700, 900, 1200, 1500]; let s = 1, r = xp || 0; while (s < 10 && r >= bis[s - 1]) { r -= bis[s - 1]; s++; } return s; };
const team = (ich, helden) => helden.map((h) => ({ held: h, stufe: stufe(DB.xp[ich][h]) }));
const schnitt = (t) => Math.round(t.reduce((a, h) => a + h.stufe, 0) / t.length * 10) / 10;
// Sicht eines Spielers auf den Kampf (wie rpg_arena_get)
function sicht(ich) {
  const k = S.db.kaempfe[ID], w = DB.suchend;
  if (!k) return w && w.wer === ich ? { id: ID, status: "offen", seite: 1, host: w.host, gast: null, kampfstufe: Math.round(w.host.schnitt) } : null;
  const m = k.match, seite = m.host_id === "nutzer-" + ich ? 1 : 2, sieg = m.sieger === seite, t = seite === 1 ? m.host_team : m.guest_team;
  return { id: ID, status: m.status, seite, host: { name: m.host_name, schnitt: schnitt(m.host_team), team: m.host_team }, gast: { name: m.guest_name, schnitt: schnitt(m.guest_team), team: m.guest_team }, karte: m.karte, begegnung: m.begegnung, seed: m.seed, room_code: null,
    kampfstufe: m.kampfstufe, sieger: m.sieger || null, grund: m.grund || null, punkte: m.punkte || null, runden: m.runden || null,
    belohnung: m.status === "beendet" && k.privat ? { sieg: false, gewertet: false, waehrung: 0, angebot: null, xp: [] } : m.status === "beendet" ? { sieg, gewertet: true, waehrung: sieg ? 17 : 0, angebot: null, xp: t.map((h) => ({ held: h.held, xp: sieg ? 25 : 8, vorher: h.stufe, stufe: h.stufe, gesamt: (DB.xp[ich][h.held] || 0) + (sieg ? 25 : 8), neu: true })) } : null };
}
function server(ich, name, args) {
  const fehler = (t) => ({ fehler: t }), squad = () => (DB.teams[ich] ? { konto: true, team: team(ich, DB.teams[ich]), schnitt: schnitt(team(ich, DB.teams[ich])) } : { konto: true, team: null });
  if (name === "rpg_my_wallet") return { konto: true, waehrung: 0 };
  if (name === "rpg_arena_list") { const s = sicht(ich); return { konto: true, waehrung: 0, heute: 0, nur_siege: true, offen: [], mein: s && ["offen", "bereit", "laeuft"].includes(s.status) ? s : null }; }
  if (name === "rpg_arena_modes") return {};
  if (name === "rpg_arena_squad") return squad();
  if (name === "rpg_arena_squad_set") { DB.teams[ich] = args.p_team; return squad(); }
  if (name === "rpg_arena_search") return fehler("In diesem Test sucht niemand ohne Server.");
  if (name === "rpg_arena_search_server") {
    const k = S.db.kaempfe[ID]; if (k) return sicht(ich);
    const t = team(ich, DB.teams[ich]);
    if (DB.suchend && DB.suchend.wer !== ich) { const h = DB.suchend;
      S.kampf(ID, { beginn: Date.now() + 5000, match: { host_id: "nutzer-" + h.wer, guest_id: "nutzer-" + ich, host_name: h.host.name, guest_name: "Spieler " + ich, host_team: h.host.team, guest_team: t, seed: 4713, karte: "gruft", begegnung: "kobolde", kampfstufe: Math.round(Math.max(h.host.schnitt, schnitt(t))) } });
      DB.suchend = null; return sicht(ich); }
    DB.suchend = { wer: ich, host: { name: "Spieler " + ich, schnitt: schnitt(t), team: t } }; return sicht(ich);
  }
  // Migration 016: Spielarten und privater Kampf
  if (name === "rpg_arena_queue") { DB.arten.push(ich + ":" + args.p_art); const k = S.db.kaempfe[ID]; if (k) return sicht(ich); const t = team(ich, DB.teams[ich]);
    DB.suchend = { wer: ich, art: args.p_art, host: { name: "Spieler " + ich, schnitt: schnitt(t), team: t } }; return sicht(ich); }
  if (name === "rpg_my_friends") return { freunde: [{ handle: "Spieler " + (ich === "A" ? "B" : "A") }], anfragen_an_mich: [], anfragen_von_mir: [], blockiert: [] };
  if (name === "rpg_arena_invite") { DB.einl = { id: "00000000-0000-0000-0000-0000000000e1", von: ich, an: args.p_handle.slice(-1), modus: args.p_modus, status: "offen" }; return DB.einl.id; }
  if (name === "rpg_arena_invites") { const e = DB.einl; return { an_mich: e && e.an === ich && e.status === "offen" ? [{ id: e.id, von: "Spieler " + e.von, modus: e.modus, seit: new Date().toISOString() }] : [],
    von_mir: e && e.von === ich ? { id: e.id, an: "Spieler " + e.an, modus: e.modus, status: e.status, kampf: e.status === "angenommen" ? sicht(ich) : null } : null }; }
  if (name === "rpg_arena_invite_cancel") { if (DB.einl && DB.einl.status === "offen") DB.einl.status = "zurueck"; return true; }
  if (name === "rpg_arena_invite_answer") { const e = DB.einl; if (!e || e.an !== ich || e.status !== "offen") return fehler("Diese Einladung gilt nicht mehr."); if (!args.p_accept) { e.status = "abgelehnt"; return null; }
    const t1 = team(e.von, DB.teams[e.von]), t2 = team(ich, DB.teams[ich]);
    S.kampf(ID, { beginn: Date.now() + 5000, match: { host_id: "nutzer-" + e.von, guest_id: "nutzer-" + ich, host_name: "Spieler " + e.von, guest_name: "Spieler " + ich, host_team: t1, guest_team: t2, seed: 4712, modus: e.modus, karte: "gruft", begegnung: "kobolde", kampfstufe: Math.round(Math.max(schnitt(t1), schnitt(t2))) } });
    S.db.kaempfe[ID].privat = true; e.status = "angenommen"; return sicht(ich); }
  if (name === "rpg_arena_get") return sicht(ich) || fehler("Diesen Kampf gibt es nicht.");
  if (name === "rpg_arena_fight") return S.sicht(ID, "nutzer-" + ich, args.p_version);
  if (name === "rpg_arena_fight_leader") { const k = S.db.kaempfe[ID]; if (!k || k.st) return false; DB.anf++; if (k.match.host_id === "nutzer-" + ich) k.anf1 = args.p_idx; else k.anf2 = args.p_idx; return true; }
  if (name === "rpg_arena_cancel") { const k = S.db.kaempfe[ID]; if (!k) { DB.suchend = null; DB.suchAb++; return { id: ID, status: "abgebrochen", seite: 1 }; }
    const m = k.match, seite = m.host_id === "nutzer-" + ich ? 1 : 2; if (m.status === "laeuft") Object.assign(m, { status: "beendet", sieger: 3 - seite, grund: "aufgabe" }); else if (m.status === "bereit") m.status = "abgebrochen"; return sicht(ich); }
  return fehler("unbekannt: " + name);
}
async function spieler(b, ich, mobil) {
  const ctx = await b.newContext({ viewport: mobil ? { width: 390, height: 800 } : { width: 1200, height: 900 } }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler " + ich, avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: DB.xp[ich] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/(create_game_session|join_game_session|set_session_state)(\?|$)/, (r) => { DB.live++; return json(r, { message: "nicht erwartet" }, 400); });
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|my_wallet|my_friends)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(ich, name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  // Die Edge Function: die gebaute Datei, in Node ausgeführt. Wer anfragt, bestimmt hier das Gerät (im Echtbetrieb das Anmelde-Token).
  await p.route(/\/functions\/v1\/arena(\?|$)/, async (r) => { if (r.request().method() === "OPTIONS") return json(r, {});
    let rumpf = {}; try { rumpf = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ } const a = await S.ruf("tok-" + ich, rumpf); return json(r, a.o, a.status); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 });
  return { p, fehler, ich };
}
const warte = (p, fn, arg, t = 30000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true, () => false);
const shot = async (p, name) => { if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/" + name + ".png" }); };
const stand = () => R.laden(S.db.kaempfe[ID].st);
(async () => {
  const b = await chromium.launch();
  const A = await spieler(b, "A"), B = await spieler(b, "B", true), seite = { A: 1, B: 2 };
  // Teams festlegen
  for (const [s, helden] of [[A, ["schildwaechter", "lichtbringer", "wildnislaeufer"]], [B, ["trickser", "elementarist", "berserker"]]]) {
    await s.p.click('.dorf-ort[data-hub="arena"]'); await s.p.waitForSelector("#arena-team-aendern"); await s.p.click("#arena-team-aendern");
    for (const f of helden) await s.p.click(`[data-arena-held="${f}"]`);
    await s.p.click("#arena-wahl-ok"); await s.p.waitForSelector('[data-arena-art="normal"]:not([disabled])');
  }
  const arten = (await A.p.textContent(".arena-arten")).replace(/\s+/g, " ");
  check(/Normal/.test(arten) && /Duell/.test(arten) && /Arcade/.test(arten) && /Königsmord oder Horde/.test(arten) && /Privater Kampf/.test(arten) && /Ohne Wertung/.test(arten) && !(await A.p.$("#arena-suchen")),
    "Übersicht: drei Spielarten – Normal (Duell), Arcade (Los aus drei Modi), Privater Kampf");
  await shot(A.p, "arten-1-uebersicht"); await shot(B.p, "arten-2-uebersicht-handy");
  // Normal und Arcade: suchen mit der gewählten Spielart, abbrechen
  await A.p.click('[data-arena-art="normal"]'); await A.p.waitForSelector(".arena-suche"); for (let i = 0; i < 40 && !DB.arten.includes("A:normal"); i++) await A.p.waitForTimeout(100);
  check(/Normal: Suche nach einem Duell/.test(await A.p.textContent(".arena-suche")) && DB.arten.includes("A:normal"), "Normal: Suchbildschirm, die Suche läuft in der Warteschlange „normal“");
  await A.p.click("#arena-suche-ab"); await A.p.waitForSelector(".arena-arten");
  await A.p.click('[data-arena-art="arcade"]'); await A.p.waitForSelector(".arena-suche"); for (let i = 0; i < 40 && !DB.arten.includes("A:arcade"); i++) await A.p.waitForTimeout(100);
  check(/Arcade/.test(await A.p.textContent(".arena-suche")) && DB.arten.includes("A:arcade") && DB.suchAb >= 1, "Arcade: eigene Warteschlange; Abbrechen trägt die Suche aus");
  await A.p.click("#arena-suche-ab"); await A.p.waitForSelector(".arena-arten");
  // Privater Kampf: Modus wählen, Freund einladen
  await A.p.click("#arena-privat"); await A.p.waitForSelector("[data-privat-freund]");
  const pw = (await A.p.textContent("[data-arena]")).replace(/\s+/g, " ");
  check(/Privater Kampf/.test(pw) && /Spieler B/.test(pw) && await A.p.evaluate(() => document.querySelectorAll("[data-privat-modus]").length === 4 && document.querySelector('[data-privat-modus="duell"]').classList.contains("an")), "Privater Kampf: vier Modi zur Wahl (Duell vorgewählt), darunter die Freundesliste");
  await A.p.click('[data-privat-modus="koenig"]'); await shot(A.p, "arten-3-privat");
  await A.p.click('[data-privat-freund="Spieler B"]'); await A.p.waitForSelector(".arena-suche");
  check(/Warte auf Spieler B/.test(await A.p.textContent(".arena-suche")) && DB.einl && DB.einl.modus === "koenig" && DB.einl.an === "B", "Einladung an den Freund mit dem gewählten Modus (Königsmord); A wartet");
  const einl = await B.p.waitForSelector(".arena-einladung", { timeout: 12000 }).then(() => true, () => false);
  const et = einl ? (await B.p.textContent(".arena-einladung")).replace(/\s+/g, " ") : "";
  check(einl && /Spieler A fordert dich heraus/.test(et) && /Königsmord/.test(et) && /ohne Wertung/.test(et), "Der Freund sieht die Einladung in seiner Arena: wer, welcher Modus, ohne Wertung");
  await shot(B.p, "arten-4-einladung-handy");
  await B.p.click("[data-einl-ja]");
  const auf = await A.p.waitForSelector(".arena-gegenueber", { timeout: 15000 }).then(() => true, () => false) && await B.p.waitForSelector(".arena-gegenueber", { timeout: 15000 }).then(() => true, () => false);
  check(auf && S.db.kaempfe[ID], "Annehmen: Beide landen in der Aufstellung");
  // Königsmord: Anführer wählen – er geht an den Server, nicht an den Gegner
  await B.p.waitForSelector('[data-arena-anf="berserker"]', { timeout: 10000 });
  const mt = (await B.p.textContent("#arena-modus-text")).replace(/\s+/g, " ");
  check(/Privater Kampf · ohne Wertung/.test(mt) && /Königsmord/.test(mt) && !/Das Los hat entschieden/.test(mt), "Aufstellung: gewählter Modus Königsmord (die Zufallszahl hätte „Arena“ ergeben), gekennzeichnet als privat");
  await B.p.click('[data-arena-anf="berserker"]'); await A.p.click('[data-arena-anf="lichtbringer"]');
  const zaehlt = await warte(A.p, () => /beginnt in \d+/.test((document.querySelector("#arena-status") || {}).textContent || ""), null, 8000);
  check(zaehlt, "Aufstellung: Der Countdown kommt vom Server");
  const los = await warte(A.p, () => { const s = document.querySelector("#spiel"); return s && !s.hidden && document.querySelectorAll("#karte .fig").length >= 6; }, null, 30000)
    && await warte(B.p, () => { const s = document.querySelector("#spiel"); return s && !s.hidden && document.querySelectorAll("#karte .fig").length >= 6; }, null, 30000);
  check(los, "Der Kampf beginnt auf beiden Geräten");
  const k = S.db.kaempfe[ID];
  check(k.anf1 === 1 && k.anf2 === 2 && DB.anf >= 2, "Die gewählten Anführer liegen beim Server (Elara und Ragnar)");
  check(DB.live === 0, "Keine Live-Sitzung zwischen den Geräten: Beide reden nur mit dem Server");
  const sichtB = await B.p.evaluate(() => ({ rs: window.AB.st.rs, k: window.AB.st.arena.koenig, seite: window.AB.st.figuren.filter((f) => f.fidA || f.fid).length }));
  const st0 = stand();
  check(sichtB.rs === undefined && sichtB.k[1] === null && sichtB.k[2] === st0.arena.koenig[2], "Gerät B kennt weder den Zufallsstand noch den Anführer von A – nur den eigenen");
  check(await A.p.evaluate(() => document.querySelectorAll("#karte .fig.held").length === 3 && document.querySelectorAll("#karte .fig.feind").length >= 3), "Jedes Gerät sieht die eigenen Helden als Helden, die des Gegners als Gegner");
  await shot(A.p, "server-1-kampf-a"); await shot(B.p, "server-2-kampf-b");
  // Ein Zug: Wer dran ist, bewegt seinen Helden; das andere Gerät sieht es
  const dran = () => { const st = stand(), a = R.aktiv(st), tm = R.teamVon(st, a); return { st, a, tm, ich: tm === 1 ? A : B, andere: tm === 1 ? B : A }; };
  let d = dran();
  // erst zeigen beide Geräte alle Schritte des Starts (Monster ziehen einzeln), dann ist der Held des Servers auch dort an der Reihe
  const aufgeholt = await warte(d.ich.p, (id) => window.AB.R.aktiv(window.AB.st).id === id, d.a.id, 20000) && await warte(d.andere.p, (id) => window.AB.R.aktiv(window.AB.st).id === id, d.a.id, 20000);
  check(aufgeholt, "Beide Geräte haben den Stand des Servers eingeholt: derselbe Held ist an der Reihe");
  const ziel = await d.ich.p.evaluate(() => { const st = window.AB.st, Rr = window.AB.R, a = Rr.aktiv(st); const kk = [...Rr.bewegungsfelder(st, a).keys()].filter((x) => x !== a.x + "," + a.y);
    const [x, y] = kk[kk.length - 1].split(",").map(Number); return { id: a.id, x, y }; });
  const vVor = k.v;
  // Die andere Seite tippt auch – das darf nichts auslösen
  await d.andere.p.mouse.click(300, 300).catch(() => {});
  // Tipp auf das Feld (als Ereignis am Feld selbst: An manchen Stellen liegt die Aktionsleiste über dem Kartenrand)
  await d.ich.p.evaluate((z) => document.querySelector(`#karte .feld[data-x="${z.x}"][data-y="${z.y}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), ziel);
  const bewegtIch = await warte(d.ich.p, (z) => { const f = window.AB.R.fig(window.AB.st, z.id); return f && f.x === z.x && f.y === z.y; }, ziel, 8000);
  const bewegtAndere = await warte(d.andere.p, (z) => { const f = window.AB.st.figuren.find((x) => x.id === z.id); return f && f.x === z.x && f.y === z.y; }, ziel, 8000);
  const fs = R.fig(stand(), ziel.id);
  check(bewegtIch && fs.x === ziel.x && fs.y === ziel.y && k.v > vVor, "Zug per Tipp auf ein Feld: Der Server rechnet ihn, das eigene Gerät zeigt ihn sofort");
  check(bewegtAndere, "Das andere Gerät sieht den Zug nach kurzer Zeit");
  // Zug beenden – der nächste Held ist dran, auf beiden Geräten derselbe
  await d.ich.p.click((await d.ich.p.$("#kh-ende")) ? "#kh-ende" : "#ende-zug"); // am Handy: Knopf der Bedienleiste
  const weiter = await warte(d.ich.p, (id) => window.AB.R.aktiv(window.AB.st).id !== id, ziel.id, 8000);
  const neu = dran(), gleich = await warte(A.p, (id) => window.AB.R.aktiv(window.AB.st).id === id, neu.a.id, 8000) && await warte(B.p, (id) => window.AB.R.aktiv(window.AB.st).id === id, neu.a.id, 8000);
  check(weiter && gleich, "Zug beenden: Auf beiden Geräten ist derselbe nächste Held an der Reihe");
  const uhr = await A.p.evaluate(() => { const u = document.querySelector("#arena-uhr"); return u && !u.hidden ? u.textContent : ""; });
  check(/Zugzeit 0:[0-5]\d|Zugzeit 1:00/.test(uhr), `Die Zugzeit läuft auf dem Gerät mit (${uhr.replace(/\s+/g, " ").trim().slice(0, 40)})`);
  // Abkürzen: Der Server steht kurz vor der letzten Runde; danach beenden beide nur noch ihre Züge
  k.st.runde = k.st.arena.runden; const vSprung = k.v;
  let n = 0;
  while (S.db.kaempfe[ID].match.status === "laeuft" && n++ < 40) {
    d = dran(); if (d.st.ende) break;
    const meins = await warte(d.ich.p, (id) => { const st = window.AB.st, a = window.AB.R.aktiv(st); return a.id === id && !document.querySelector("#ende-zug").disabled; }, d.a.id, 10000);
    if (!meins) break; const v = k.v; await d.ich.p.click((await d.ich.p.$("#kh-ende")) ? "#kh-ende" : "#ende-zug"); // am Handy: Knopf der Bedienleiste
    for (let i = 0; i < 40 && k.v === v && k.match.status === "laeuft"; i++) await d.ich.p.waitForTimeout(150);
  }
  check(k.match.status === "beendet" && S.db.enden.length === 1 && k.v > vSprung, `Der Kampf läuft bis zum Ende, der Server trägt das Ergebnis ein (Sieger Team ${S.db.enden[0] && S.db.enden[0].sieger})`);
  const sieger = S.db.enden[0] ? S.db.enden[0].sieger : 0;
  const endeA = await warte(A.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && /Zur Startseite|Helden wählen/.test(e.textContent); }, null, 30000);
  const endeB = await warte(B.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && /Zur Startseite|Helden wählen/.test(e.textContent); }, null, 30000);
  const tA = endeA ? (await A.p.textContent("#arena-ende")).replace(/\s+/g, " ") : "", tB = endeB ? (await B.p.textContent("#arena-ende")).replace(/\s+/g, " ") : "";
  check(endeA && endeB && new RegExp(sieger === 1 ? "Sieg" : "Niederlage").test(tA) && new RegExp(sieger === 2 ? "Sieg" : "Niederlage").test(tB), "Ergebnis: Ein Gerät zeigt „Sieg“, das andere „Niederlage“ – ohne dass ein Gerät etwas gemeldet hat");
  check(/Privater Kampf: ohne Wertung/.test(tA) && /Privater Kampf: ohne Wertung/.test(tB) && !/XP/.test(tA + tB) && !/Seelensplitter/.test(tA + tB) && !/Tagesgrenze/.test(tA + tB), "Privater Kampf: Das Ergebnis nennt „ohne Wertung“, keine Belohnung");
  await shot(A.p, "server-3-ende-a");
  await A.p.click("#arena-ende-zu"); const zurueck = await warte(A.p, () => { const h = document.querySelector("#hub"); return h && !h.hidden; }, null, 15000);
  check(zurueck, "„Zur Startseite“ führt zurück ins Dorf");
  // Ohne Link: Die Server-Arena gilt von selbst, sobald die Datenbank sie kennt – sonst bleibt die frühere Arena
  { const ohne = async (kennt) => { const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(); const j = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
      await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => j(r, { konto: true, handle: "Spieler C", avatar_key: null, created_at: new Date().toISOString() }));
      await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => j(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
      await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => j(r, { konto: true, xp: {} }));
      await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => j(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
      await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|my_wallet)(\?|$)/, (r) => { const n = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1];
        if (n === "rpg_my_wallet") return j(r, { konto: true, waehrung: 0 }); if (n === "rpg_arena_list") return j(r, { konto: true, waehrung: 0, heute: 0, offen: [], mein: null }); if (n === "rpg_arena_modes") return j(r, {});
        if (n === "rpg_arena_invites") return kennt ? j(r, { an_mich: [], von_mir: null }) : j(r, { code: "PGRST202", message: "Could not find the function public.rpg_arena_invites without parameters in the schema cache" }, 404);
        if (n === "rpg_arena_squad") return j(r, { konto: true, team: null }); return j(r, { code: "P0001", message: "nicht erwartet: " + n }, 400); });
      await p.goto("http://localhost:8765/abenteuer/index.html?schnell"); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 }); await p.click('.dorf-ort[data-hub="arena"]');
      await p.waitForSelector(".arena-arten, #arena-erstellen", { timeout: 20000 }); const neu = Boolean(await p.$(".arena-arten")), alt = Boolean(await p.$("#arena-erstellen")); await ctx.close(); return { neu, alt }; };
    const mit = await ohne(true), nicht = await ohne(false);
    check(mit.neu && !mit.alt, "Ohne Link, Datenbank kennt die Server-Arena: Alle sehen die neue Arena mit den drei Spielarten");
    check(nicht.alt && !nicht.neu, "Ohne Link, Datenbank kennt sie noch nicht: Es bleibt bei der früheren Arena (nichts geht kaputt)"); }
  for (const s of [A, B]) check(s.fehler.length === 0, `keine Skriptfehler bei ${s.ich}${s.fehler.length ? ": " + s.fehler.join(" | ") : ""}`);
  await b.close();
  console.log(ok ? "\nARENA-SERVER IN ORDNUNG" : "\nARENA-SERVER: FEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
