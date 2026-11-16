/*
 * Mythara – Admin-Bereich im Profil: ein Menüpunkt für Admins mit drei Reitern (Codes, Kampfstatistiken, Rechner-Gegner).
 * Die Datenbankfunktionen sind nachgebildet; sie selbst prüft supabase/tests/020_rpg_admin_bereich_test.sql.
 * Aufruf: node abenteuer/tests/admin.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const DB = { e: { aktiv: true, wartezeit: 30, staerke_von: 1, staerke_bis: 1, stufe_von: -1, stufe_bis: 1, schnitt_max: 0.5, geaendert: null, von: null }, gesetzt: [], rufe: [] };
const bot = () => ({ einstellungen: DB.e, statistik: { kaempfe: 12, siege_spieler: 5, aufgaben: 1, laufend: 2, abgebrochen: 0, runden: 6.4, heute: 3,
  nach_staerke: [{ stufe: "2 mittel", kaempfe: 4, siege_spieler: 3, runden: 7.1 }, { stufe: "4 ohne Angabe", kaempfe: 8, siege_spieler: 2, runden: 6 }], nach_modus: [{ modus: "duell", kaempfe: 9, siege_spieler: 4 }, { modus: "horde", kaempfe: 3, siege_spieler: 1 }],
  letzte: [{ spieler: "Julian", gegner: "Brotzeit", modus: "duell", status: "beendet", sieger: 2, grund: "team", runden: 3, staerke: null, stufe_spieler: 1, stufe_gegner: 1.3, wann: new Date().toISOString() },
    { spieler: "Lena", gegner: "Elif_87", modus: "horde", status: "beendet", sieger: 1, grund: "punkte", runden: 30, staerke: 0.55, stufe_spieler: 4, stufe_gegner: 3.7, wann: new Date().toISOString() }] } });
function server(name, a) {
  DB.rufe.push(name);
  if (name === "rpg_admin_codes") return [{ id: "00000000-0000-0000-0000-000000000c01", bezeichnung: "Beta-Runde", nur_fuer: null, eingeloest: 2, hoechstens: 20, gueltig_bis: new Date(Date.now() + 864e5 * 30).toISOString(), aktiv: true, angelegt_von: "Chef" }];
  if (name === "rpg_arena_stats") return { kaempfe: 20, gegen_mensch: 6, gegen_bot: 12, privat: 2, bot_siege_spieler: 5, offen: 1, abgebrochen: 3, modi: [{ modus: "duell", kaempfe: 14, sieg_ersteller: 8, runden: 6.2, minuten: 7.5, team: 12, punkte: 1, aufgabe: 1 }],
    helden: [{ held: "berserker", kaempfe: 9, siege: 6, stufe: 2.4, modi: { duell: [7, 5] } }], teams: [], karten: { gruft: 5 } };
  if (name === "rpg_admin_bot") return bot();
  if (name === "rpg_admin_bot_set") { DB.gesetzt.push(a); Object.assign(DB.e, { aktiv: a.p_aktiv, wartezeit: a.p_wartezeit, staerke_von: a.p_staerke_von, staerke_bis: a.p_staerke_bis, stufe_von: a.p_stufe_von, stufe_bis: a.p_stufe_bis, schnitt_max: a.p_schnitt_max, geaendert: new Date().toISOString(), von: "Chef" }); return bot(); }
  if (name === "rpg_arena_list") return { konto: true, waehrung: 0, heute: 0, offen: [], mein: null };
  if (name === "rpg_my_wallet") return { konto: true, waehrung: 0 };
  return { fehler: "nicht erwartet: " + name };
}
async function seite(b, admin, vp) {
  const p = await (await b.newContext({ viewport: vp || { width: 1200, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: admin ? "Chef" : "Spieler", avatar_key: "schildwaechter", created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, admin, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: {} }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(admin_[a-z_]+|arena_[a-z_]+|my_wallet)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let a = {}; try { a = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, a); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector("#hub-profil-knopf", { timeout: 20000 });
  return { p, fehler };
}
(async () => {
  const b = await chromium.launch();
  console.log("Admin-Bereich");
  const S = await seite(b, false); await S.p.click("#hub-profil-knopf");
  check(await S.p.evaluate(() => !document.querySelector('[data-profil="admin"]') && !document.querySelector('[data-profil="codes"]') && Boolean(document.querySelector('[data-profil="code"]'))), "Spieler ohne Admin-Recht: kein Admin-Bereich im Profilmenü");
  const A = await seite(b, true), p = A.p; await p.click("#hub-profil-knopf");
  const menue = await p.evaluate(() => [...document.querySelectorAll("#hub-menue button")].map((x) => x.textContent));
  check(menue.includes("Admin-Bereich") && !menue.includes("Code-Übersicht") && !menue.includes("Arena-Auswertung"), "Admin: ein Menüpunkt „Admin-Bereich“ (statt zwei einzelner)");
  await p.click('[data-profil="admin"]'); await p.waitForSelector(".admin-tabs");
  const kopf = () => p.evaluate(() => ({ h: document.querySelector("#qr-overlay h2").textContent, tabs: [...document.querySelectorAll(".admin-tabs button")].map((x) => x.textContent + (x.classList.contains("an") ? "*" : "")).join(" | ") }));
  let k = await kopf();
  check(k.h === "Admin-Bereich" && k.tabs === "Codes* | Kampfstatistiken | Rechner-Gegner" && await p.evaluate(() => Boolean(document.querySelector("#sm-admin-form")) && /Beta-Runde/.test(document.querySelector(".sm-code-liste").textContent)), "Reiter Codes: Formular für neue Codes und die Liste");
  await p.click('[data-admin-tab="stats"]'); await p.waitForFunction(() => /Kämpfe/.test((document.querySelector(".auswertung") || {}).textContent || ""));
  k = await kopf(); const st = (await p.textContent(".auswertung")).replace(/\s+/g, " ");
  check(k.tabs === "Codes | Kampfstatistiken* | Rechner-Gegner" && /20 beendete Kämpfe/.test(st) && /6 gegen Menschen/.test(st) && /12 gegen den Rechner-Gegner \(Spieler gewannen 42 %\)/.test(st) && /2 privat/.test(st) && /Duell/.test(st), "Reiter Kampfstatistiken: Auswertung, getrennt nach Mensch, Rechner-Gegner und privat");
  await p.click('[data-admin-tab="bots"]'); await p.waitForSelector("#admin-bot");
  k = await kopf(); const bt = (await p.textContent("#qr-overlay")).replace(/\s+/g, " ");
  check(k.tabs === "Codes | Kampfstatistiken | Rechner-Gegner*" && await p.evaluate(() => document.querySelector("#ab-aktiv").checked && document.querySelector("#ab-warten").value === "30" && document.querySelector("#ab-sv").value === "100" && document.querySelector("#ab-sb").value === "100" && document.querySelector("#ab-lv").value === "-1" && document.querySelector("#ab-lb").value === "1" && document.querySelector("#ab-sm").value === "0.5"
    && document.querySelector("#ab-warten-w").textContent === "30 s" && document.querySelector("#ab-sb-w").textContent === "100 %"), "Reiter Rechner-Gegner: zeigt die geltenden Einstellungen (an, 30 s, 100 %, Stufen −1 bis +1, Durchschnitt ± 0,5)");
  check(/12 beendet/.test(bt) && /Spieler gewannen 42 %/.test(bt) && /40 bis unter 70 %/.test(bt) && /75 %/.test(bt) && /Brotzeit/.test(bt) && /Elif_87/.test(bt) && /55 %/.test(bt), "… und die Statistik: Siegquote der Spieler gesamt und je Spielstärke, letzte Kämpfe");
  // Schnellwahl und Regler
  await p.click('[data-ab-schnell="50,70,-1,0"]');
  check(await p.evaluate(() => document.querySelector("#ab-sv").value === "50" && document.querySelector("#ab-sb").value === "70" && document.querySelector("#ab-lb").value === "0" && /Noch nicht gespeichert/.test(document.querySelector("#ab-fb").textContent)) && DB.gesetzt.length === 0, "Schnellwahl „Mittel“ stellt die Regler (50–70 %, Stufen −1 bis ±0), speichert aber noch nicht");
  await p.evaluate(() => { const v = document.querySelector("#ab-sv"); v.value = "85"; v.dispatchEvent(new Event("input", { bubbles: true })); });
  check(await p.evaluate(() => document.querySelector("#ab-sb").value === "85" && document.querySelector("#ab-sb-w").textContent === "85 %"), "„von“ über „bis“ gezogen: „bis“ geht mit");
  await p.evaluate(() => { const set = (id, v) => { const e = document.querySelector(id); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }; set("#ab-sv", "40"); set("#ab-sb", "60"); set("#ab-warten", "45"); });
  await p.click("#admin-bot button[type=submit]"); await p.waitForFunction(() => /Gespeichert/.test((document.querySelector("#ab-fb") || {}).textContent || ""));
  const g = DB.gesetzt[0] || {};
  check(DB.gesetzt.length === 1 && g.p_aktiv === true && g.p_wartezeit === 45 && Math.abs(g.p_staerke_von - 0.4) < 1e-9 && Math.abs(g.p_staerke_bis - 0.6) < 1e-9 && g.p_stufe_von === -1 && g.p_stufe_bis === 0 && g.p_schnitt_max === 0.5, "Speichern schickt genau die eingestellten Werte (45 s, 40–60 %, Stufen −1 bis ±0, Durchschnitt ± 0,5)");
  check(await p.evaluate(() => document.querySelector("#ab-warten").value === "45" && document.querySelector("#ab-sv").value === "40" && /Zuletzt geändert von Chef/.test(document.querySelector("#admin-bot").textContent)) && (await kopf()).tabs.endsWith("Rechner-Gegner*"), "Danach: gespeicherte Werte, „Zuletzt geändert von …“, der Reiter bleibt");
  await p.click("#ab-aktiv"); await p.click("#admin-bot button[type=submit]"); await p.waitForFunction(() => /Gespeichert/.test((document.querySelector("#ab-fb") || {}).textContent || "") && !document.querySelector("#ab-aktiv").checked);
  check(DB.gesetzt[1] && DB.gesetzt[1].p_aktiv === false, "Ausschalten lässt sich speichern");
  // Schließen, danach ein anderes Fenster: keine Reiter
  await p.click("#fenster-zu"); await p.click("#hub-profil-knopf"); await p.click('[data-profil="stufen"]'); await p.waitForFunction(() => { const o = document.querySelector("#qr-overlay"); return !o.hidden && /Meine Helden/.test(o.querySelector("h2").textContent); });
  check(await p.evaluate(() => !document.querySelector(".admin-tabs")), "Andere Fenster (z. B. „Meine Helden“) zeigen keine Admin-Reiter");
  await p.click("#fenster-zu");
  // Handy
  const H = await seite(b, true, { width: 390, height: 800 }); await H.p.click("#hub-profil-knopf"); await H.p.click('[data-profil="admin"]'); await H.p.waitForSelector(".admin-tabs"); await H.p.click('[data-admin-tab="bots"]'); await H.p.waitForSelector("#admin-bot");
  check(await H.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector("#admin-bot").getBoundingClientRect().width <= innerWidth), "Handy: Der Admin-Bereich passt in die Breite");
  if (process.env.SHOT_DIR) { await p.click("#hub-profil-knopf"); await p.click('[data-profil="admin"]'); await p.waitForSelector(".admin-tabs"); await p.click('[data-admin-tab="bots"]'); await p.waitForSelector("#admin-bot"); await p.screenshot({ path: process.env.SHOT_DIR + "/admin-bots.png" }); await H.p.screenshot({ path: process.env.SHOT_DIR + "/admin-bots-handy.png" }); }
  check(!S.fehler.length && !A.fehler.length && !H.fehler.length, "keine Skriptfehler" + [S, A, H].flatMap((x) => x.fehler).join(" | "));
  await b.close();
  console.log(ok ? "\nADMIN-BEREICH IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
