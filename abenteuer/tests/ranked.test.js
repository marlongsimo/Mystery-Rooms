/*
 * Mythara – Arena, Ranked im Browser: Karte mit Rang und Fortschritt, Rangliste, letzte Kämpfe, Belohnungen, Suche im Rang,
 * Ergebnisbildschirm mit Punkten und Abstieg, Rang in der Kopfzeile. Die Datenbank ist nachgestellt (wie Migration 022);
 * die echten Funktionen prüft supabase/tests/022_rpg_ranked_test.sql. Die Edge Function ist die gebaute Datei.
 * Aufruf: node abenteuer/tests/ranked.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden"); const attrappe = require("./arena-server-attrappe");
const URL = "http://localhost:8765/abenteuer/index.html?schnell&arena=server";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const S = attrappe(); S.db.nutzer["tok-A"] = "nutzer-A";
const ID = "00000000-0000-0000-0000-00000000c001";
const DB = { team: null, such: 0, suchend: false, punkte: 105, siege: 5, niederlagen: 2, ergebnis: 0, queue: [] };
const mein = () => DB.team.map((h) => ({ held: h, stufe: 4 }));
const status = () => ({ konto: true, saison: { id: 1, name: "Season 0", beginn: new Date(Date.now() - 864e5).toISOString(), ende: new Date(Date.now() + 41 * 864e5 + 5 * 36e5).toISOString(), laeuft: true, jetzt: Date.now() },
  ich: { punkte: DB.punkte, rang: Math.min(14, Math.floor(DB.punkte / 100)), hoechst: 130, siege: DB.siege, niederlagen: DB.niederlagen, platz: 3 },
  rangliste: [{ platz: 1, name: "Nachtfalke", avatar: "assassine", rahmen: "r_krone", punkte: 640, rang: 6, siege: 30, niederlagen: 8, ich: false }, { platz: 2, name: "Lena", avatar: null, rahmen: null, punkte: 310, rang: 3, siege: 14, niederlagen: 6, ich: false },
    { platz: 3, name: "Spieler A", avatar: "schildwaechter", rahmen: null, punkte: DB.punkte, rang: Math.floor(DB.punkte / 100), siege: DB.siege, niederlagen: DB.niederlagen, ich: true }, { platz: 4, name: "Timo_07", avatar: "berserker", rahmen: null, punkte: 40, rang: 0, siege: 2, niederlagen: 3, ich: false }],
  chronik: [{ gegner: "Lena", sieg: true, grund: "team", runden: 6, delta: 35, vor: 70, wann: new Date(Date.now() - 2 * 36e5).toISOString(), team: [{ held: "schildwaechter", stufe: 4 }, { held: "lichtbringer", stufe: 4 }, { held: "wildnislaeufer", stufe: 4 }], gegner_team: [{ held: "berserker", stufe: 5 }, { held: "trickser", stufe: 4 }, { held: "gelehrter", stufe: 4 }] },
    { gegner: "Timo_07", sieg: false, grund: "aufgabe", runden: null, delta: -15, vor: 85, wann: new Date(Date.now() - 30 * 36e5).toISOString(), team: [], gegner_team: [] }],
  belohnungen: [150, 300, 500, 800, 1200] });
function sicht() {
  const k = S.db.kaempfe[ID];
  if (!k) return DB.suchend ? { id: ID, status: "offen", seite: 1, host: { name: "Spieler A", schnitt: 4, team: mein() }, gast: null, kampfstufe: 4 } : null;
  const m = k.match;
  return { id: ID, status: m.status, seite: 1, host: { name: m.host_name, schnitt: 4, team: m.host_team }, gast: { name: m.guest_name, schnitt: 4, team: m.guest_team }, karte: m.karte, begegnung: m.begegnung, seed: m.seed, room_code: null, kampfstufe: 4,
    sieger: m.sieger || null, grund: m.grund || null, punkte: m.punkte || null, runden: m.runden || null, belohnung: m.status === "beendet" ? { sieg: m.sieger === 1, gewertet: false, waehrung: 0, angebot: null, xp: [] } : null };
}
function server(name, args) {
  if (name === "rpg_my_wallet") return { konto: true, waehrung: 0 };
  if (name === "rpg_arena_list") { const s = sicht(); return { konto: true, waehrung: 0, heute: 0, nur_siege: true, offen: [], mein: s && ["offen", "bereit", "laeuft"].includes(s.status) ? s : null }; }
  if (name === "rpg_arena_modes") return {};
  if (name === "rpg_arena_squad") return DB.team ? { konto: true, team: mein(), schnitt: 4 } : { konto: true, team: null };
  if (name === "rpg_arena_squad_set") { DB.team = args.p_team; return { konto: true, team: mein(), schnitt: 4 }; }
  if (name === "rpg_arena_invites") return { an_mich: [], von_mir: null };
  if (name === "rpg_my_friends") return { freunde: [], anfragen_an_mich: [], anfragen_von_mir: [], blockiert: [] };
  if (name === "rpg_ranked_status") return status();
  if (name === "rpg_arena_queue") { DB.queue.push(args.p_art); return { fehler: "In diesem Test sucht niemand außerhalb von Ranked." }; }
  // wie Migration 022: nach der Wartezeit (hier: dritte Nachfrage) ein Rechner-Gegner im selben Rang
  if (name === "rpg_ranked_queue") { DB.queue.push("ranked"); if (S.db.kaempfe[ID]) return sicht(); DB.suchend = true; DB.such++;
    if (DB.such >= 3) S.kampf(ID, { beginn: Date.now() + 2500, match: { host_id: "nutzer-A", guest_id: null, host_name: "Spieler A", guest_name: "Runenwolf_3", host_team: mein(), guest_team: [{ held: "berserker", stufe: 4 }, { held: "wanderheiler", stufe: 4 }, { held: "elementarist", stufe: 4 }], seed: 4721, modus: "duell", bot: true, staerke: 0.63, karte: "gruft", begegnung: "kobolde", kampfstufe: 4 } });
    return sicht(); }
  if (name === "rpg_ranked_result") { DB.ergebnis++; const m = (S.db.kaempfe[ID] || {}).match; if (!m || m.status !== "beendet") return { ranked: true, gewertet: false, vor: 105 };
    if (DB.punkte === 105) { DB.punkte = 90; DB.niederlagen++; } return { ranked: true, gewertet: true, vor: 105, delta: -15, nach: 90, rang_vor: 1, rang_nach: 0, weit: false }; }
  if (name === "rpg_ranked_gegenueber") return { da: true, ranked: true, host: 1, gast: 1 };
  if (name === "rpg_arena_looks") return { host: { name: "Spieler A", avatar: "schildwaechter", rahmen: null }, gast: { name: "Runenwolf_3", avatar: "trickser", rahmen: null } };
  if (name === "rpg_looks") return {};
  if (name === "rpg_arena_get") return sicht() || { fehler: "Diesen Kampf gibt es nicht." };
  if (name === "rpg_arena_fight") return S.sicht(ID, "nutzer-A", args.p_version);
  if (name === "rpg_arena_fight_leader") return true;
  if (name === "rpg_arena_cancel") { const k = S.db.kaempfe[ID]; if (!k) { DB.suchend = false; return { id: ID, status: "abgebrochen", seite: 1 }; } const m = k.match; if (m.status === "laeuft") Object.assign(m, { status: "beendet", sieger: 2, grund: "aufgabe" }); else m.status = "abgebrochen"; return sicht(); }
  return { fehler: "unbekannt: " + name };
}
async function seite(b, vp) {
  const p = await (await b.newContext({ viewport: vp })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler A", avatar_key: "schildwaechter", created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: Object.fromEntries(ALLE.map((f) => [f, 500])) }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|ranked_[a-z_]+|my_wallet|my_friends|looks)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.route(/\/functions\/v1\/arena(\?|$)/, async (r) => { if (r.request().method() === "OPTIONS") return json(r, {}); let rumpf = {}; try { rumpf = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ } const a = await S.ruf("tok-A", rumpf); return json(r, a.o, a.status); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 });
  return { p, fehler };
}
const shot = async (p, n) => { if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/${n}.png`, fullPage: true }); };
(async () => {
  const b = await chromium.launch();
  console.log("Arena: Ranked");
  const { p, fehler } = await seite(b, { width: 1200, height: 1000 });
  check(await p.waitForFunction(() => { const e = document.querySelector("#hub-rang"); return e && !e.hidden && /Bronze II/.test(e.textContent); }, null, { timeout: 10000 }).then(() => true, () => false), "Der Rang steht in der Kopfzeile des Dorfs (Bronze II)");
  await p.click('.dorf-ort[data-hub="arena"]'); await p.waitForSelector("#arena-team-aendern"); await p.waitForSelector(".rang-karte");
  const k = await p.evaluate(() => { const e = document.querySelector(".rang-karte"); return { text: e.textContent.replace(/\s+/g, " "), tier: e.dataset.tier, balken: e.querySelector(".rang-balken u").style.width, knopf: e.querySelector(".rang-spielen").disabled, tabs: [...document.querySelectorAll("[data-arena-tab]")].map((x) => x.textContent.trim() + (x.classList.contains("an") ? "*" : "")).join(" | "), teamKarte: Boolean(document.querySelector(".arena-meinteam")), teamKnopf: document.querySelector("#arena-team-aendern").textContent.trim(), ohne: (document.querySelector(".arena-ohne-team") || {}).textContent || "" }; });
  check(k.tabs === "Ranked* | Fun | Rangliste" && !k.teamKarte && /Mein Team/.test(k.teamKnopf) && /Lege zuerst dein Team/.test(k.ohne), "Aufbau: drei Reiter (Ranked · Fun · Rangliste); das Team steckt hinter dem Knopf „Mein Team“ oben rechts – ohne Team ein Hinweis mit Knopf");
  check(/Season 0 · noch 41 Tage/.test(k.text) && /Bronze II/.test(k.text) && /5 \/ 100 bis Bronze I/.test(k.text) && k.balken === "5%" && /Punkte\s*105/.test(k.text) && /5 : 2/.test(k.text) && /#3/.test(k.text) && k.tier === "bronze", "Reiter Ranked: Saison mit Restzeit, Rang, Fortschritt zur nächsten Stufe, Punkte, Bilanz, Platz");
  check(k.knopf, "Ohne Team ist „Ranked spielen“ gesperrt");
  await p.click("[data-team-auf]"); await p.waitForSelector("[data-arena-held]");
  { await p.setViewportSize({ width: 390, height: 640 }); await p.evaluate(() => document.querySelector('[data-arena-held="kopfgeldjaeger"]').scrollIntoView({ block: "center" }));
    const y0 = await p.evaluate(() => window.scrollY); await p.evaluate(() => document.querySelector('[data-arena-held="kopfgeldjaeger"]').click()); const y1 = await p.evaluate(() => window.scrollY);
    const an = await p.evaluate(() => document.querySelector('[data-arena-held="kopfgeldjaeger"]').classList.contains("an")); await p.evaluate(() => document.querySelector('[data-arena-held="kopfgeldjaeger"]').click()); const y2 = await p.evaluate(() => window.scrollY);
    check(y0 > 100 && an && Math.abs(y1 - y0) <= 2 && Math.abs(y2 - y0) <= 2, `Held an- und abwählen: Die Seite springt nicht nach oben (Position ${y0} → ${y1} → ${y2})`);
    await p.setViewportSize({ width: 1200, height: 950 }); }
  for (const f of ["schildwaechter", "lichtbringer", "wildnislaeufer"]) await p.click(`[data-arena-held="${f}"]`);
  await p.click("#arena-wahl-ok"); await p.waitForSelector('.rang-spielen:not([disabled])');
  check(await p.evaluate(() => /Mein Team\s*Ø 4,0/.test(document.querySelector("#arena-team-aendern").textContent) && /Torvald/.test(document.querySelector("#arena-team-aendern").title) && !document.querySelector(".arena-ohne-team")), "Nach dem Speichern: Der Knopf zeigt „Mein Team Ø 4,0“ (die Helden nur als Hinweis beim Darüberfahren)");
  await p.click('[data-arena-tab="fun"]'); await p.waitForSelector(".arena-arten");
  check(await p.evaluate(() => document.querySelectorAll(".arena-arten [data-arena-art]").length === 2 && Boolean(document.querySelector("#arena-privat")) && !document.querySelector(".rang-karte") && /Ohne Rangpunkte/.test(document.querySelector(".arena-tab").textContent)), "Reiter Fun: Normal, Arcade, Privater Kampf – ohne Rangpunkte");
  await p.click('[data-arena-tab="rangliste"]'); await p.waitForSelector(".rang-liste");
  // Reiter
  const reiter = await p.evaluate(() => ({ tabs: [...document.querySelectorAll("[data-rang-reiter]")].map((x) => x.textContent + (x.classList.contains("an") ? "*" : "")).join(" | "), zeilen: [...document.querySelectorAll(".rang-liste li")].map((x) => x.textContent.replace(/\s+/g, " ").trim()), ich: (document.querySelector(".rang-liste li.ich b") || {}).textContent, rahmen: document.querySelector(".rang-liste li .rang-bild").dataset.rahmen, embleme: document.querySelectorAll(".rang-liste .rang-emblem").length }));
  check(reiter.tabs === "" && reiter.zeilen.length === 4 && /^1\s*Nachtfalke.*640/.test(reiter.zeilen[0]) && reiter.ich === "Spieler A" && reiter.rahmen === "r_krone" && reiter.embleme === 4, "Reiter Rangliste: Platz, Bild mit Rahmen, Name, Bilanz, Rang und Punkte – die eigene Zeile ist hervorgehoben");
  await p.click('[data-arena-tab="ranked"]'); await p.waitForSelector(".rang-karte");
  check(await p.evaluate(() => [...document.querySelectorAll("[data-rang-reiter]")].map((x) => x.textContent + (x.classList.contains("an") ? "*" : "")).join(" | ")) === "Letzte Kämpfe* | Belohnungen", "Unter der Ranked-Karte: Letzte Kämpfe und Belohnungen");
  await shot(p, "ranked-1-arena");
  const ch = await p.evaluate(() => [...document.querySelectorAll(".rang-chronik li")].map((x) => ({ k: x.className, t: x.textContent.replace(/\s+/g, " ").trim(), bilder: x.querySelectorAll(".rang-teams img").length })));
  check(ch.length === 2 && ch[0].k === "sieg" && /Sieg gegen Lena/.test(ch[0].t) && /\+35/.test(ch[0].t) && /▲ Bronze II/.test(ch[0].t) && ch[0].bilder === 6 && ch[1].k === "niederlage" && /durch Aufgabe/.test(ch[1].t) && /-15/.test(ch[1].t), "Letzte Kämpfe: Sieg oder Niederlage, Gegner, beide Teams, Punkte – mit Aufstieg, wo es einen gab");
  await p.click('[data-rang-reiter="belohnungen"]');
  const lo = await p.evaluate(() => [...document.querySelectorAll(".rang-lohn li")].map((x) => ({ t: x.textContent.replace(/\s+/g, " ").trim(), w: x.querySelector(".kos-wuerfel").dataset.wuerfel, r: x.querySelector(".kos-rahmen").dataset.rahmen, m: x.classList.contains("meiner"), zier: getComputedStyle(x.querySelector(".rahmen-halter"), "::after").backgroundImage.length > 20 })));
  check(lo.length === 5 && /Meister ◈ 1200/.test(lo[0].t) && lo[0].w === "w_s0_meister" && lo[0].r === "r_s0_meister" && /Bronze ◈ 150/.test(lo[4].t) && lo[4].m && lo.filter((x) => x.m).length === 1 && lo.every((x) => x.zier), "Belohnungen: je Rang Seelensplitter (1200 bis 150), Würfel und Rahmen; der eigene Stand ist markiert");
  await shot(p, "ranked-2-belohnungen");
  // Suche und Kampf
  await p.click('[data-rang-reiter="chronik"]'); await p.click(".rang-spielen"); await p.waitForSelector(".arena-suche");
  check(/Ranked: Suche nach einem Gegner in deinem Rang/.test(await p.textContent(".arena-suche")) && /Bronze II/.test(await p.textContent(".arena-suche")) && /nach 25 Sekunden/.test(await p.textContent(".arena-suche")), "Suche: „in deinem Rang“, mit Abzeichen und dem Hinweis auf die 25 Sekunden");
  const auf = await p.waitForSelector(".arena-gegenueber", { timeout: 20000 }).then(() => true, () => false);
  check(auf && DB.queue.every((x) => x === "ranked") && DB.queue.length >= 3, "Gesucht wird nur in der Ranked-Warteschlange; danach steht ein Gegner bereit");
  const rg = await p.waitForSelector('.arena-team[data-team-seite="2"] .arena-team-rang', { timeout: 5000 }).then(() => p.evaluate(() => [...document.querySelectorAll(".arena-team")].map((t) => (t.classList.contains("gegner") ? "Gegner" : "ich") + ":" + (t.querySelector(".arena-team-rang") ? t.querySelector(".arena-team-rang").textContent.trim() + (t.querySelector(".arena-team-rang .rang-emblem") ? "+Emblem" : "") : "–")).join(" | ")), () => "fehlt");
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/aufstellung-rang.png" });
  check(/ich:(II)?Bronze II\+Emblem/.test(rg) && /Gegner:(II)?Bronze II\+Emblem/.test(rg), `Aufstellung: Unter beiden Namen steht der Rang mit Emblem (${rg})`);
  check(await p.waitForSelector("#karte .fig", { timeout: 25000 }).then(() => true, () => false) && S.db.kaempfe[ID].st.arena.modus === "duell" && Math.abs(S.db.kaempfe[ID].st.arena.bot.staerke - 0.63) < 1e-9, "Gespielt wird ein Duell; der Rechner-Gegner bekommt seine Stärke aus dem Rang");
  await p.click("#arena-aufgeben");
  const ende = await p.waitForSelector(".rang-ergebnis", { timeout: 20000 }).then(() => true, () => false);
  await p.waitForFunction(() => { const e = document.querySelector(".rang-ergebnis"); return e && e.classList.contains("fertig"); }, null, { timeout: 8000 }).catch(() => {});
  const er = ende ? await p.evaluate(() => { const e = document.querySelector(".rang-ergebnis"); return { text: e.textContent.replace(/\s+/g, " ").trim(), k: e.className, tier: e.dataset.tier, zahl: e.querySelector(".rang-zahl").textContent, name: e.querySelector(".rang-stand b").textContent, vorKnopf: e.compareDocumentPosition(document.querySelector("#arena-ende-zu")) & 4 }; }) : {};
  check(ende && /▼ Abstieg: Bronze III/.test(er.text) && /-15/.test(er.text) && er.zahl === "90" && er.name === "Bronze III" && /\bab\b/.test(er.k) && /minus/.test(er.k) && er.vorKnopf, "Ergebnisbildschirm: −15 Rangpunkte, die Zahl läuft von 105 auf 90, „▼ Abstieg: Bronze III“");
  await shot(p, "ranked-3-ergebnis");
  await p.click("#arena-ende-zu"); await p.waitForFunction(() => { const e = document.querySelector("#hub-rang"); return e && !e.hidden && /Bronze III/.test(e.textContent); }, null, { timeout: 10000 }).catch(() => {});
  check(await p.evaluate(() => /Bronze III/.test(document.querySelector("#hub-rang").textContent)), "Zurück im Dorf zeigt die Kopfzeile den neuen Rang");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Handy
  const H = await seite(b, { width: 390, height: 844 }); await H.p.click('.dorf-ort[data-hub="arena"]'); await H.p.waitForSelector(".rang-karte");
  const hoch = await H.p.evaluate(() => ({ breit: document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".rang-karte").getBoundingClientRect().right <= innerWidth, seite: document.documentElement.scrollHeight, fenster: innerHeight, knopf: Math.round(document.querySelector(".rang-spielen").getBoundingClientRect().bottom + scrollY) }));
  check(hoch.breit && hoch.seite <= hoch.fenster * 1.8 && hoch.knopf <= hoch.fenster * 1.15, `Handy: passt in die Breite, kein langes Scrollen mehr (Seite ${hoch.seite}px bei ${hoch.fenster}px Bildschirm; „Ranked spielen“ liegt bei ${hoch.knopf}px)`);
  await shot(H.p, "ranked-4-handy"); await H.p.click('[data-arena-tab="rangliste"]'); await H.p.waitForSelector(".rang-liste");
  check(await H.p.evaluate(() => document.querySelector(".rang-liste li").getBoundingClientRect().right <= innerWidth), "Handy: Die Rangliste passt in die Breite");
  check(!H.fehler.length, "keine Skriptfehler am Handy" + (H.fehler.length ? ": " + H.fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nRANKED IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
