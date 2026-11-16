/*
 * Mythara – Arena gegen den Rechner-Gegner, im Browser: Suche → nach der Wartezeit steht ein Gegner bereit → Serverkampf.
 * Die Datenbank ist nachgestellt (wie Migration 019), die Edge Function ist die gebaute Datei (supabase/functions/arena/index.ts).
 * Geprüft: Der Gegner erscheint wie ein Spieler (Name, Profilbild), zieht von selbst mit Bedenkzeit, Schritt für Schritt;
 * der Spieler kommt wieder an die Reihe; Aufgeben beendet den Kampf.
 * Aufruf: node abenteuer/tests/arena-bot-browser.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden"); const attrappe = require("./arena-server-attrappe");
const URL = "http://localhost:8765/abenteuer/index.html?schnell&arena=server";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const S = attrappe(); S.db.nutzer["tok-A"] = "nutzer-A";
const ID = "00000000-0000-0000-0000-00000000b001", GEGNER = { name: "Nachtfalke_91", avatar: "assassine", rahmen: "r_dornen" };
const DB = { team: null, such: 0, suchend: false, zeit: [] };
const mein = () => DB.team.map((h) => ({ held: h, stufe: 4 }));
function sicht() {
  const k = S.db.kaempfe[ID];
  if (!k) return DB.suchend ? { id: ID, status: "offen", seite: 1, host: { name: "Spieler A", schnitt: 4, team: mein() }, gast: null, kampfstufe: 4 } : null;
  const m = k.match;
  return { id: ID, status: m.status, seite: 1, host: { name: m.host_name, schnitt: 4, team: m.host_team }, gast: { name: m.guest_name, schnitt: 4, team: m.guest_team }, karte: m.karte, begegnung: m.begegnung, seed: m.seed, room_code: null, kampfstufe: 4,
    sieger: m.sieger || null, grund: m.grund || null, punkte: m.punkte || null, runden: m.runden || null, belohnung: m.status === "beendet" ? { sieg: m.sieger === 1, gewertet: m.sieger === 1, waehrung: m.sieger === 1 ? 25 : 0, angebot: null, xp: [] } : null };
}
function server(name, args) {
  if (name === "rpg_my_wallet") return { konto: true, waehrung: 0 };
  if (name === "rpg_arena_list") { const s = sicht(); return { konto: true, waehrung: 0, heute: 0, nur_siege: true, offen: [], mein: s && ["offen", "bereit", "laeuft"].includes(s.status) ? s : null }; }
  if (name === "rpg_arena_modes") return {};
  if (name === "rpg_arena_squad") return DB.team ? { konto: true, team: mein(), schnitt: 4 } : { konto: true, team: null };
  if (name === "rpg_arena_squad_set") { DB.team = args.p_team; return { konto: true, team: mein(), schnitt: 4 }; }
  if (name === "rpg_arena_invites") return { an_mich: [], von_mir: null };
  if (name === "rpg_my_friends") return { freunde: [], anfragen_an_mich: [], anfragen_von_mir: [], blockiert: [] };
  // wie Migration 019: Nach der Wartezeit (hier: dritte Nachfrage) stellt der Server den Gegner – ohne Konto (guest_id fehlt), mit Vermerk für die Edge Function
  if (name === "rpg_arena_queue") { if (S.db.kaempfe[ID]) return sicht(); DB.suchend = true; DB.such++;
    if (DB.such >= 3) S.kampf(ID, { beginn: Date.now() + 3000, match: { host_id: "nutzer-A", guest_id: null, host_name: "Spieler A", guest_name: GEGNER.name, host_team: mein(), guest_team: [{ held: "berserker", stufe: 4 }, { held: "wanderheiler", stufe: 5 }, { held: "elementarist", stufe: 3 }], seed: 4720, modus: "duell", bot: true, karte: "gruft", begegnung: "kobolde", kampfstufe: 4 } });
    return sicht(); }
  if (name === "rpg_arena_looks") return { host: { name: "Spieler A", avatar: "schildwaechter", rahmen: null }, gast: GEGNER };
  if (name === "rpg_looks") return {};
  if (name === "rpg_arena_get") return sicht() || { fehler: "Diesen Kampf gibt es nicht." };
  if (name === "rpg_arena_fight") return S.sicht(ID, "nutzer-A", args.p_version);
  if (name === "rpg_arena_fight_leader") return true;
  if (name === "rpg_arena_cancel") { const k = S.db.kaempfe[ID]; if (!k) { DB.suchend = false; return { id: ID, status: "abgebrochen", seite: 1 }; } const m = k.match; if (m.status === "laeuft") Object.assign(m, { status: "beendet", sieger: 2, grund: "aufgabe" }); else m.status = "abgebrochen"; return sicht(); }
  return { fehler: "unbekannt: " + name };
}
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler A", avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: Object.fromEntries(ALLE.map((f) => [f, 500])) }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|my_wallet|my_friends|looks)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.route(/\/functions\/v1\/arena(\?|$)/, async (r) => { if (r.request().method() === "OPTIONS") return json(r, {});
    let rumpf = {}; try { rumpf = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ } const v0 = S.db.kaempfe[ID] ? S.db.kaempfe[ID].v : 0; const a = await S.ruf("tok-A", rumpf);
    if (rumpf.aktion === "zeit") DB.zeit.push({ t: Date.now(), neu: (S.db.kaempfe[ID] ? S.db.kaempfe[ID].v : 0) - v0 }); return json(r, a.o, a.status); });
  console.log("Arena gegen den Rechner-Gegner (Browser)");
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 });
  await p.click('.dorf-ort[data-hub="arena"]'); await p.waitForSelector("#arena-team-aendern"); await p.click("#arena-team-aendern");
  for (const f of ["schildwaechter", "lichtbringer", "wildnislaeufer"]) await p.click(`[data-arena-held="${f}"]`);
  await p.click("#arena-wahl-ok"); await p.waitForSelector('[data-arena-art="normal"]:not([disabled])');
  await p.click('[data-arena-art="normal"]'); await p.waitForSelector(".arena-suche");
  check(/Suche nach einem Duell/.test(await p.textContent(".arena-suche")), "Suche läuft (Suchbildschirm)");
  const auf = await p.waitForSelector(".arena-gegenueber", { timeout: 20000 }).then(() => true, () => false);
  const at = auf ? (await p.textContent("[data-arena]")).replace(/\s+/g, " ") : "";
  check(auf && at.includes(GEGNER.name) && !/bot|rechner|computer/i.test(at), "Nach der Wartezeit: Aufstellung gegen „" + GEGNER.name + "“ – nichts weist auf einen Rechner-Gegner hin");
  check(await p.waitForFunction(() => { const t = [...document.querySelectorAll(".arena-team h3 .kos-traeger")]; return t.length === 2 && t[1].dataset.rahmen === "r_dornen" && t[1].querySelector("img"); }, null, { timeout: 8000 }).then(() => true, () => false), "Der Gegner hat Profilbild und Rahmen");
  check(await p.waitForSelector("#karte .fig", { timeout: 25000 }).then(() => true, () => false), "Der Kampf beginnt");
  // Der Spieler beendet nur seine Züge; der Gegner muss von selbst ziehen
  const stand = () => { const k = S.db.kaempfe[ID]; return k && k.st; };
  const botAmZug = () => { const st = stand(); if (!st || st.ende) return false; const a = st.figuren.find((f) => f.id === st.reihe[st.am]); return a && a.team === 2; };
  const arten = new Set(); let t0 = Date.now(), meine = 0;
  while (Date.now() - t0 < 150000 && !(arten.has("bewegen") && arten.has("aktion") && arten.has("ende") && DB.zeit.filter((z) => z.neu > 0).length >= 8) && !(stand() && stand().ende)) {
    const k = S.db.kaempfe[ID];
    const st = stand(), b0 = st && st.arena.bot; if (b0 && b0.letzt) arten.add(b0.letzt.typ);
    if (st && !st.ende && !botAmZug()) { const knopf = await p.$("#ende-zug"); if (knopf && await knopf.isVisible() && await knopf.isEnabled()) { await knopf.click().catch(() => {}); meine++; } }
    await p.waitForTimeout(250);
  }
  const k = S.db.kaempfe[ID], st = stand(), botSchritte = DB.zeit.filter((z) => z.neu > 0).length, leer = DB.zeit.filter((z) => z.neu === 0).length;
  check(botSchritte >= 4, `Der Gegner zieht von selbst: ${botSchritte} Schritte in ${Math.round((Date.now() - t0) / 1000)} s (der Spieler hat ${meine}-mal nur „Zug beenden“ gedrückt)`);
  const luecken = DB.zeit.filter((z) => z.neu > 0).map((z, i, a) => (i ? z.t - a[i - 1].t : 0)).slice(1);
  check(luecken.length >= 3 && Math.min(...luecken) >= 600 && new Set(luecken.map((x) => Math.round(x / 400))).size >= 2, `Er lässt sich Zeit, und nicht immer gleich viel (Abstände: ${luecken.map((x) => (x / 1000).toFixed(1)).join(" · ")} s)`);
  check(leer <= botSchritte * 3 + 6, `Das Spiel fragt nur nach, wenn ein Schritt fällig ist (${leer} Nachfragen ohne Ergebnis)`);
  check(arten.has("bewegen") && arten.has("aktion") && arten.has("ende"), "Er bewegt sich, setzt Fähigkeiten ein und beendet seine Züge (" + [...arten].join(", ") + ")");
  const sichtText = JSON.stringify(k.schritte.map((s) => s.sicht1));
  check(!/"bot"/.test(sichtText) && !/"rs"/.test(sichtText) && /"takt"/.test(sichtText), "Was das Spiel empfängt, enthält keinen Vermerk „Rechner-Gegner“ und keinen Würfelstand – nur den Zeitpunkt des nächsten Schritts");
  check(await p.evaluate((n) => document.body.textContent.includes(n), GEGNER.name), "Im Kampf steht der Name des Gegners");
  // Aufgeben
  if (!st.ende) { await p.click("#arena-aufgeben"); }
  const ende = await p.waitForFunction(() => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && /Niederlage|Sieg/.test(e.textContent); }, null, { timeout: 30000 }).then(() => true, () => false);
  check(ende && k.match.status === "beendet", "Aufgeben (oder Kampfende): Ergebnisbildschirm, Kampf beendet");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nARENA-BOT (BROWSER) IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
