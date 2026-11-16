/*
 * Mythara – „Mein Profil“ (Profilbild · Aussehen · Code einlösen), das aufgeräumte Profilmenü und Codes für Seelensplitter.
 * Die Datenbankfunktionen sind nachgebildet; die echten prüfen supabase/tests/017_… und 021_rpg_splitter_codes_test.sql.
 * Aufruf: node abenteuer/tests/profil.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const KATALOG = [["w_glut", "wuerfel", 150], ["w_frost", "wuerfel", 150], ["r_lorbeer", "rahmen", 150], ["r_krone", "rahmen", 150], ["r_bronze", "rahmen", 75]].map(([id, art, preis], reihe) => ({ id, art, preis, reihe }));
const DB = { bild: "schildwaechter", waehrung: 72, besitz: ["w_glut", "r_lorbeer", "r_krone"], aktiv: { wuerfel: null, rahmen: null }, rufe: [], codes: [], erstellt: [] };
const kos = () => ({ konto: true, waehrung: DB.waehrung, katalog: KATALOG, besitz: DB.besitz.slice(), aktiv: Object.assign({}, DB.aktiv) });
function server(name, a) {
  DB.rufe.push(name);
  if (name === "rpg_set_profile") { if (a.p_avatar_key) DB.bild = a.p_avatar_key; return { handle: a.p_handle, avatar_key: DB.bild, konto: true }; }
  if (name === "rpg_cosmetics") return kos();
  if (name === "rpg_cosmetic_equip") { if (a.p_id && !DB.besitz.includes(a.p_id)) return { fehler: "Das besitzt du nicht." }; DB.aktiv[a.p_art] = a.p_id || null; return kos(); }
  if (name === "rpg_redeem_unlock_code") { DB.codes.push(a.p_code); if (a.p_code === "SPLI-TTER-0150") { DB.waehrung += 150; return { waehrung: 150, kontostand: DB.waehrung, bezeichnung: "Turnier" }; }
    if (a.p_code === "HELD-ENHE-LDEN") return { neu: 0, gesamt: 15, bezeichnung: "Beta" }; return { fehler: "Dieser Code ist ungültig." }; }
  if (name === "rpg_admin_codes") return [{ id: "00000000-0000-0000-0000-000000000c01", bezeichnung: "Turnier", nur_fuer: null, eingeloest: 1, hoechstens: 5, gueltig_bis: new Date(Date.now() + 864e5 * 30).toISOString(), aktiv: true, angelegt_von: "Chef", waehrung: 150 },
    { id: "00000000-0000-0000-0000-000000000c02", bezeichnung: "Beta", nur_fuer: "Lena", eingeloest: 0, hoechstens: 1, gueltig_bis: new Date(Date.now() + 864e5 * 30).toISOString(), aktiv: true, angelegt_von: "Chef", waehrung: null }];
  if (name === "rpg_admin_create_code") { DB.erstellt.push(a); return { code: "NEUE-RCOD-E123", bezeichnung: a.p_label, nur_fuer: null, hoechstens: a.p_max_uses, gueltig_bis: new Date(Date.now() + 864e5 * 90).toISOString(), waehrung: a.p_waehrung == null ? null : a.p_waehrung }; }
  if (name === "rpg_my_wallet") return { konto: true, waehrung: DB.waehrung };
  if (name === "rpg_arena_list") return { konto: true, waehrung: DB.waehrung, heute: 0, offen: [], mein: null };
  if (name === "rpg_looks") return {};
  return { fehler: "nicht erwartet: " + name };
}
async function seite(b, vp) {
  const p = await (await b.newContext({ viewport: vp || { width: 1200, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Chef", avatar_key: DB.bild, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, admin: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: {} }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(set_profile|cosmetic[a-z_]*|redeem_unlock_code|admin_[a-z_]+|arena_[a-z_]+|my_wallet|looks)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let a = {}; try { a = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, a); return e && e.fehler && name !== "rpg_redeem_unlock_code" ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector("#hub-profil-knopf", { timeout: 20000 });
  return { p, fehler };
}
(async () => {
  const b = await chromium.launch();
  console.log("Mein Profil");
  const { p, fehler } = await seite(b);
  await p.click("#hub-profil-knopf");
  const menue = await p.evaluate(() => [...document.querySelectorAll("#hub-menue button")].map((x) => x.textContent));
  check(menue.join(" | ") === "Mein Profil | Admin-Bereich | Tutorial ansehen | Abmelden", "Profilmenü aufgeräumt: " + menue.join(" · "));
  await p.click('[data-profil="profil"]'); await p.waitForSelector(".profil-kopf");
  const kopf = () => p.evaluate(() => ({ h: document.querySelector("#qr-overlay h2").textContent, name: document.querySelector(".profil-wer b").textContent, zeilen: [...document.querySelectorAll(".profil-wer small")].map((x) => x.textContent).join(" | "), bild: (document.querySelector(".profil-bild img") || {}).src || "", rahmen: document.querySelector(".profil-bild").dataset.rahmen, wuerfel: document.querySelector(".profil-wuerfel").dataset.wuerfel,
    tabs: [...document.querySelectorAll("[data-profil-tab]")].map((x) => x.textContent + (x.classList.contains("an") ? "*" : "")).join(" | ") }));
  let k = await kopf();
  check(k.h === "Mein Profil" && k.name === "Chef" && /schildwaechter/.test(k.bild) && k.tabs === "Profilbild* | Aussehen | Code einlösen", "Eigene Seite „Mein Profil“: oben Bild, Name, Rahmen und Würfel; darunter drei Reiter");
  check(await p.evaluate(() => document.querySelectorAll(".profil [data-bild]").length === 15 && document.querySelector('.profil [data-bild="schildwaechter"]').classList.contains("an")), "Reiter Profilbild: 15 Bilder, das aktuelle ist markiert");
  await p.click('.profil [data-bild="trickser"]'); await p.waitForFunction(() => /trickser/.test((document.querySelector(".profil-bild img") || {}).src || ""));
  k = await kopf();
  check(DB.bild === "trickser" && await p.evaluate(() => document.querySelector('.profil [data-bild="trickser"]').classList.contains("an") && /trickser/.test(document.querySelector("#hub-profil-knopf img").src) && !document.querySelector("#qr-overlay").hidden), "Bild antippen: gespeichert, oben und in der Kopfzeile sofort übernommen, die Seite bleibt offen");
  await p.click('[data-profil-tab="aussehen"]'); await p.waitForSelector(".kos-profil");
  check(await p.evaluate(() => document.querySelectorAll('.kos-wahl[data-art="rahmen"]').length === 3 && document.querySelectorAll('.kos-wahl[data-art="wuerfel"]').length === 2 && /2 weitere beim Händler|1 weitere beim Händler/.test(document.querySelector(".kos-profil").textContent)), "Reiter Aussehen: eigene Rahmen und Würfel (dazu Standard), Hinweis auf den Händler");
  await p.click('.kos-wahl[data-kos-wahl="r_krone"]'); await p.waitForFunction(() => document.querySelector(".profil-bild").dataset.rahmen === "r_krone");
  await p.click('.kos-wahl[data-kos-wahl="w_glut"]'); await p.waitForFunction(() => document.querySelector(".profil-wuerfel").dataset.wuerfel === "w_glut");
  k = await kopf();
  check(DB.aktiv.rahmen === "r_krone" && DB.aktiv.wuerfel === "w_glut" && /Rahmen: /.test(k.zeilen) && !/Standard/.test(k.zeilen) && k.tabs === "Profilbild | Aussehen* | Code einlösen" && await p.evaluate(() => document.body.dataset.rahmen === "r_krone"), `Rahmen und Würfel wählen: gespeichert, die Vorschau oben zeigt beides (${k.zeilen})`);
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/profil-aussehen.png" });
  // Code einlösen
  await p.click('[data-profil-tab="code"]'); await p.waitForSelector("#prof-sm-code-feld");
  check(await p.evaluate(() => /Helden frei oder bringt Seelensplitter/.test(document.querySelector(".profil-inhalt").textContent)), "Reiter Code einlösen: Eingabe ist da, obwohl schon alle 15 Helden freigeschaltet sind");
  await p.fill("#prof-sm-code-feld", "SPLITTER0150"); await p.click("#prof-sm-code button[type=submit]"); await p.waitForFunction(() => /Seelensplitter/.test(document.querySelector("#prof-sm-code-fb").textContent));
  check(DB.codes[0] === "SPLI-TTER-0150" && await p.evaluate(() => /\+150 Seelensplitter\. Dein Kontostand: 222/.test(document.querySelector("#prof-sm-code-fb").textContent) && /222/.test(document.querySelector("#hub-waehrung").textContent) && document.querySelector("#prof-sm-code-feld").value === ""), "Splitter-Code: „+150 Seelensplitter“, der Kontostand oben springt auf 222, das Feld ist bereit für den nächsten Code");
  await p.fill("#prof-sm-code-feld", "FALSCHFALSCH"); await p.click("#prof-sm-code button[type=submit]"); await p.waitForFunction(() => /ungültig/.test(document.querySelector("#prof-sm-code-fb").textContent));
  check(true, "Falscher Code: Meldung „ungültig“");
  await p.click("#fenster-zu");
  // Admin: Code für Seelensplitter anlegen
  await p.click("#hub-profil-knopf"); await p.click('[data-profil="admin"]'); await p.waitForSelector("#sm-admin-form");
  check(await p.evaluate(() => { const t = document.querySelector(".sm-code-liste").textContent; return /150 Seelensplitter/.test(t) && /alle Helden/.test(t) && document.querySelector("#sm-a-splitter-feld").hidden; }), "Admin, Codes: Die Liste nennt, was jeder Code bringt; das Mengenfeld ist zunächst ausgeblendet");
  await p.fill("#sm-a-name", "Gewinnspiel"); await p.click('input[name="sm-a-fuer"][value="alle"]'); await p.fill("#sm-a-anzahl", "10"); await p.click('input[name="sm-a-inhalt"][value="splitter"]');
  check(await p.evaluate(() => !document.querySelector("#sm-a-splitter-feld").hidden), "„Seelensplitter“ gewählt: Das Mengenfeld erscheint");
  await p.fill("#sm-a-splitter", "9000"); await p.click("#sm-admin-form button[type=submit]"); await p.waitForTimeout(300);
  check(DB.erstellt.length === 0 && /1 bis 5000/.test(await p.textContent("#sm-a-fb")), "Mehr als 5000 wird schon im Formular abgewiesen");
  await p.fill("#sm-a-splitter", "250"); await p.click("#sm-admin-form button[type=submit]"); await p.waitForSelector(".sm-code-neu");
  const e = DB.erstellt[0] || {};
  check(e.p_label === "Gewinnspiel" && e.p_waehrung === 250 && e.p_max_uses === 10 && e.p_fuer === null && /250 Seelensplitter/.test(await p.textContent(".sm-code-neu")), "Angelegt: 250 Seelensplitter, 10× einlösbar; der neue Code wird mit seinem Inhalt angezeigt");
  await p.fill("#sm-a-name", "Nur Helden"); await p.click('input[name="sm-a-fuer"][value="alle"]'); await p.click("#sm-admin-form button[type=submit]"); await p.waitForFunction(() => /Nur Helden/.test((document.querySelector(".sm-code-neu") || {}).textContent || ""));
  check(DB.erstellt[1] && !("p_waehrung" in DB.erstellt[1]) && /alle Helden/.test(await p.textContent(".sm-code-neu")), "Helden-Code wie bisher: ohne Mengenangabe an die Datenbank (geht auch ohne Migration 021)");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Handy
  const H = await seite(b, { width: 390, height: 800 }); await H.p.click("#hub-profil-knopf"); await H.p.click('[data-profil="profil"]'); await H.p.waitForSelector(".profil-kopf");
  check(await H.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".profil-kopf").getBoundingClientRect().right <= innerWidth), "Handy: Die Profilseite passt in die Breite");
  if (process.env.SHOT_DIR) await H.p.screenshot({ path: process.env.SHOT_DIR + "/profil-handy.png" });
  check(!H.fehler.length, "keine Skriptfehler am Handy" + (H.fehler.length ? ": " + H.fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nMEIN PROFIL IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
