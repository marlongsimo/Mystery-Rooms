/*
 * Mythara – Händler und Ausstattung im Browser: Eingang mit Feldern (Held der Woche, Ausstattung),
 * Würfel-Designs und Profilrahmen kaufen, im Profil unter „Personalisieren“ auswählen, Auswahl bleibt nach dem Neuladen.
 * Die Datenbankfunktionen (Migration 010 und 017) sind nachgebildet; sie selbst prüft supabase/tests/017_rpg_ausstattung_test.sql.
 * Aufruf: node abenteuer/tests/haendler.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const KATALOG = [["w_obsidian", "wuerfel", 75], ["w_elfenbein", "wuerfel", 75], ["w_smaragd", "wuerfel", 75], ["w_rubin", "wuerfel", 75], ["w_glut", "wuerfel", 150], ["w_frost", "wuerfel", 150], ["w_arkan", "wuerfel", 150], ["w_gold", "wuerfel", 150],
  ["r_bronze", "rahmen", 75], ["r_silber", "rahmen", 75], ["r_eisen", "rahmen", 75], ["r_wald", "rahmen", 75], ["r_gold", "rahmen", 150], ["r_flammen", "rahmen", 150], ["r_frost", "rahmen", 150], ["r_splitter", "rahmen", 150], ["r_dornen", "rahmen", 75], ["r_zahnrad", "rahmen", 75], ["r_lorbeer", "rahmen", 150], ["r_krone", "rahmen", 150], ["r_schwingen", "rahmen", 150], ["r_stern", "rahmen", 150], ["r_runen", "rahmen", 150]].map(([id, art, preis]) => ({ id, art, preis }));
const DB = { waehrung: 260, besitz: [], aktiv: { wuerfel: null, rahmen: null }, kaeufe: [] };
const stand = () => ({ konto: true, waehrung: DB.waehrung, katalog: KATALOG, besitz: DB.besitz.slice(), aktiv: Object.assign({}, DB.aktiv) });
function server(name, a) {
  const fehler = (t) => ({ fehler: t });
  if (name === "rpg_my_wallet") return { konto: true, waehrung: DB.waehrung };
  if (name === "rpg_shop_week") return { konto: true, preis: 830, angebot: 415, token_preis: 830, tokens: 0, waehrung: DB.waehrung, bis: new Date(Date.now() + 3 * 864e5 + 4 * 36e5 + 7000).toISOString(), alle: false, held: "berserker", gekauft: false };
  if (name === "rpg_cosmetics") return stand();
  if (name === "rpg_cosmetic_buy") { const k = KATALOG.find((x) => x.id === a.p_id); if (!k) return fehler("Das führt der Händler nicht."); if (DB.besitz.includes(k.id)) return fehler("Das besitzt du schon."); if (DB.waehrung < k.preis) return fehler("Dafür reichen deine Seelensplitter nicht.");
    DB.waehrung -= k.preis; DB.besitz.push(k.id); DB.kaeufe.push(k.id); return stand(); }
  if (name === "rpg_cosmetic_equip") { if (a.p_id && !DB.besitz.includes(a.p_id)) return fehler("Das besitzt du nicht."); DB.aktiv[a.p_art] = a.p_id || null; return stand(); }
  if (name === "rpg_arena_list") return { konto: true, waehrung: DB.waehrung, heute: 0, offen: [], mein: null };
  return fehler("nicht erwartet: " + name);
}
async function seite(b, vp) {
  const ctx = await b.newContext({ viewport: vp }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler A", avatar_key: "schildwaechter", created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: {} }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(cosmetic[a-z_]*|shop_[a-z_]+|my_wallet|arena_[a-z_]+)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let a = {}; try { a = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, a); return e && e.fehler ? json(r, { code: /nicht erwartet/.test(e.fehler) ? "PGRST202" : "P0001", message: e.fehler }, 400) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="shop"]', { timeout: 20000 });
  return { p, fehler, ctx };
}
const shot = async (p, name) => { if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/" + name + ".png", fullPage: true }); };
(async () => {
  const b = await chromium.launch(); console.log("Händler und Ausstattung");
  const { p, fehler } = await seite(b, { width: 1200, height: 900 });
  // Eingang: zwei Felder, Countdown
  await p.click('.dorf-ort[data-hub="shop"]'); await p.waitForSelector(".shop-felder");
  const ein = (await p.textContent(".shop-felder")).replace(/\s+/g, " ");
  check(/Held der Woche/.test(ein) && /Ragnar zum halben Preis: 830 415/.test(ein) && /Ausstattung/.test(ein) && /Würfel-Designs und Profilrahmen/.test(ein) && /Ab 75/.test(ein), "Händler: Felder – Held der Woche (830 durchgestrichen, 415) und Ausstattung");
  check(/^3 Tagen 4 Std\.$|^3 Tagen 3 Std\.$/.test(await p.textContent("#shop-uhr")), `Bis zum neuen Helden: ${await p.textContent("#shop-uhr")}`);
  check(await p.evaluate(() => document.querySelectorAll(".shop-feld.helden .shop-feld-bilder img").length === 2 && !!document.querySelector('.shop-feld.helden img[src*="heldentoken"]') && !!document.querySelector(".shop-feld.helden s") && !document.querySelector(".shop-woche")), "Das Feld zeigt den Helden der Woche und den Heldentoken");
  await shot(p, "haendler-1-eingang");
  await p.click('[data-shop-feld="helden"]'); await p.waitForSelector(".shop-woche");
  check(await p.evaluate(() => document.querySelectorAll(".shop-woche .shop-held").length === 2 && /Held der Woche/.test(document.querySelector("[data-shop] h1").textContent)), "Klick: der Held der Woche und daneben der Heldentoken");
  await p.click("[data-shop-zurueck]"); await p.waitForSelector(".shop-felder");
  // Ausstattung
  await p.click('[data-shop-feld="ausstattung"]'); await p.waitForSelector(".kos-raster");
  const aus = await p.evaluate(() => ({ karten: document.querySelectorAll(".kos-karte").length, wuerfel: document.querySelectorAll(".kos-karte .kos-wuerfel").length, rahmen: document.querySelectorAll(".kos-karte .kos-rahmen").length,
    p75: [...document.querySelectorAll("[data-kos-kauf]")].filter((x) => /75/.test(x.textContent)).length, p150: [...document.querySelectorAll("[data-kos-kauf]")].filter((x) => /150/.test(x.textContent)).length, stand: document.querySelector(".shop-stand").textContent }));
  check(aus.karten === 23 && aus.wuerfel === 8 && aus.rahmen === 15 && aus.p75 === 10 && aus.p150 === 13 && /260/.test(aus.stand), "Ausstattung: 8 Würfel und 15 Rahmen, einfache für 75, ausgefallene für 150; der Kontostand steht oben");
  // Die Vorschauen sehen wirklich verschieden aus
  const farben = await p.evaluate(() => [...document.querySelectorAll(".kos-karte .kos-wuerfel")].map((v) => getComputedStyle(v.querySelector(".w20-koerper")).fill + "|" + getComputedStyle(v.querySelector(".w20-zahl")).fill));
  const raender = await p.evaluate(() => [...document.querySelectorAll(".kos-karte .kos-rahmen .hub-avatar")].map((v) => getComputedStyle(v).borderTopColor + "|" + getComputedStyle(v).boxShadow + "|" + getComputedStyle(v.parentElement, "::after").backgroundImage.length + "|" + getComputedStyle(v.parentElement, "::before").backgroundImage.length));
  check(new Set(farben).size === 8 && new Set(raender).size === 15, "Jedes der 23 Stücke hat ein eigenes Aussehen in der Vorschau");
  await shot(p, "haendler-2-ausstattung");
  // Kaufen
  await p.click('[data-kos-kauf="w_glut"]'); await p.waitForSelector('.kos-karte.mein');
  check(DB.waehrung === 110 && DB.besitz.includes("w_glut") && DB.aktiv.wuerfel === "w_glut" && /110/.test(await p.textContent(".shop-stand")), "Kauf „Glut“ (150): abgezogen, im Besitz und gleich ausgewählt");
  check(await p.evaluate(() => document.body.dataset.wuerfel === "w_glut"), "Der neue Würfel gilt sofort");
  await p.click('[data-kos-kauf="r_silber"]'); await p.waitForFunction(() => document.querySelectorAll(".kos-karte.mein").length === 2);
  check(DB.waehrung === 35 && DB.aktiv.rahmen === "r_silber" && await p.evaluate(() => document.body.dataset.rahmen === "r_silber" && getComputedStyle(document.querySelector("#hub-profil-knopf .hub-avatar")).borderTopColor === "rgb(216, 221, 230)"),
    "Kauf „Silber“-Rahmen (75): Das eigene Profilbild oben trägt ihn sofort");
  check(await p.evaluate(() => [...document.querySelectorAll("[data-kos-kauf]")].every((x) => x.disabled) && document.querySelectorAll(".shop-fehlt").length === 21), "Mit 35 Seelensplittern: alle übrigen Stücke gesperrt, mit Hinweis, wie viel fehlt");
  // Personalisieren
  await p.click("#hub-profil-knopf"); await p.click('[data-profil="profil"]'); await p.waitForSelector(".profil-kopf"); await p.click('[data-profil-tab="aussehen"]'); await p.waitForSelector(".kos-profil");
  const pers = await p.evaluate(() => ({ wuerfel: [...document.querySelectorAll('[data-kos-wahl][data-art="wuerfel"]')].map((x) => x.dataset.kosWahl), rahmen: [...document.querySelectorAll('[data-kos-wahl][data-art="rahmen"]')].map((x) => x.dataset.kosWahl), an: [...document.querySelectorAll(".kos-wahl.an")].map((x) => x.dataset.kosWahl), text: document.querySelector(".kos-profil").textContent }));
  check(pers.wuerfel.join() === ",w_glut" && pers.rahmen.join() === ",r_silber" && pers.an.slice().sort().join() === "r_silber,w_glut" && /14 weitere beim Händler/.test(pers.text), "Profil → Personalisieren: je Art „Standard“ und das Gekaufte; das Ausgewählte ist markiert");
  await shot(p, "haendler-3-personalisieren");
  await p.click('[data-kos-wahl=""][data-art="wuerfel"]'); await p.waitForFunction(() => !document.body.dataset.wuerfel); await p.waitForFunction(() => { const e = document.querySelector('[data-kos-wahl=""][data-art="wuerfel"]'); return e && !e.disabled && e.classList.contains("an"); });
  check(DB.aktiv.wuerfel === null && DB.besitz.includes("w_glut") && await p.evaluate(() => document.querySelector('[data-kos-wahl=""][data-art="wuerfel"]').classList.contains("an")), "Zurück auf Standard: gespeichert, das Stück bleibt im Besitz");
  await p.click('[data-kos-wahl="w_glut"]'); await p.waitForFunction(() => document.body.dataset.wuerfel === "w_glut"); await p.waitForFunction(() => { const e = document.querySelector('[data-kos-wahl="w_glut"]'); return e && !e.disabled; });
  await p.click("#fenster-zu");
  // Im Kampf: Der Würfel trägt das Design
  await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true; const w = document.querySelector("#wurf"); window.ABW.rollen(w, 17, "Probe", { sofort: true }); w.classList.add("an"); });
  check(await p.evaluate(() => { const k = document.querySelector("#wurf .w20-koerper"); return /w20-glut/.test(getComputedStyle(k).fill); }), "Der Würfel im Spiel zeigt das gewählte Design");
  // Nach dem Neuladen: Auswahl kommt aus der Datenbank zurück (und gilt schon vorher aus dem Gerätespeicher)
  await p.reload(); await p.waitForSelector('.dorf-ort[data-hub="shop"]');
  check(await p.evaluate(() => document.body.dataset.wuerfel === "w_glut" && document.body.dataset.rahmen === "r_silber"), "Nach dem Neuladen: Würfel und Rahmen sind wieder da");
  check(fehler.length === 0, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Handy
  const H = await seite(b, { width: 390, height: 844 }); await H.p.click('.dorf-ort[data-hub="shop"]'); await H.p.waitForSelector(".shop-felder"); await shot(H.p, "haendler-4-handy");
  await H.p.click('[data-shop-feld="ausstattung"]'); await H.p.waitForSelector(".kos-raster");
  check(await H.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelectorAll(".kos-karte").length === 23), "Handy: Ausstattung passt in die Breite");
  await shot(H.p, "haendler-5-handy-ausstattung");
  check(H.fehler.length === 0, "keine Skriptfehler am Handy");
  await b.close();
  console.log(ok ? "\nHÄNDLER IN ORDNUNG" : "\nHÄNDLER: FEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
