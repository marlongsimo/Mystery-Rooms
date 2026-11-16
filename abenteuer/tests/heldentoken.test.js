/*
 * Mythara – Heldentoken, Held der Woche und Heldenkauf in der Heldenhalle.
 * Die Datenbankfunktionen (Migration 026) sind nachgebildet; die echten prüft supabase/tests/026_rpg_heldentoken_test.sql.
 * Aufruf: node abenteuer/tests/heldentoken.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
function welt(helden, waehrung) {
  const DB = { waehrung, tokens: 0, helden: helden.slice(), woche: ALLE.find((h) => !helden.includes(h)) || null, rufe: [] };
  const stand = () => ({ konto: true, preis: 830, angebot: 415, token_preis: 830, tokens: DB.tokens, waehrung: DB.waehrung, bis: new Date(Date.now() + 2 * 864e5 + 5 * 36e5 + 9000).toISOString(),
    alle: ALLE.every((h) => DB.helden.includes(h)), held: DB.woche, gekauft: Boolean(DB.woche && DB.helden.includes(DB.woche)) });
  DB.server = (name, a) => { DB.rufe.push([name, a]);
    if (name === "rpg_shop_week") return stand();
    if (name === "rpg_shop_week_buy") { if (!DB.woche) return { fehler: "Diese Woche hat der Händler keinen Helden für dich." }; if (DB.helden.includes(DB.woche)) return { fehler: "Diesen Helden hast du schon." }; if (DB.waehrung < 415) return { fehler: "Dafür reichen deine Seelensplitter nicht." }; DB.waehrung -= 415; DB.helden.push(DB.woche); return stand(); }
    if (name === "rpg_token_buy") { if (DB.waehrung < 830 * a.p_anzahl) return { fehler: "Dafür reichen deine Seelensplitter nicht." }; DB.waehrung -= 830 * a.p_anzahl; DB.tokens += a.p_anzahl; return stand(); }
    if (name === "rpg_hero_buy") { if (DB.helden.includes(a.p_held)) return { fehler: "Diesen Helden hast du schon." };
      if (a.p_mit === "token") { if (DB.tokens < 1) return { fehler: "Du hast keinen Heldentoken." }; DB.tokens--; } else { if (DB.waehrung < 830) return { fehler: "Dafür reichen deine Seelensplitter nicht." }; DB.waehrung -= 830; }
      DB.helden.push(a.p_held); return Object.assign(stand(), { held_neu: a.p_held }); }
    if (name === "rpg_my_wallet") return { konto: true, waehrung: DB.waehrung };
    if (name === "rpg_cosmetics") return { konto: true, waehrung: DB.waehrung, katalog: [], besitz: [], aktiv: { wuerfel: null, rahmen: null } };
    if (name === "rpg_arena_list") return { konto: true, waehrung: DB.waehrung, heute: 0, offen: [], mein: null };
    return { fehler: "nicht erwartet: " + name, fehlt: true }; };
  return DB;
}
async function seite(b, DB, vp) {
  const p = await (await b.newContext({ viewport: vp || { width: 1200, height: 950 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler A", avatar_key: "schildwaechter", created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: DB.helden, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: {} }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(shop_[a-z_]+|token_[a-z_]+|hero_buy|cosmetic[a-z_]*|arena_[a-z_]+|my_wallet|xp_[a-z_]+)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let a = {}; try { a = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = DB.server(name, a); return e && e.fehler ? json(r, { code: e.fehlt ? "PGRST202" : "P0001", message: e.fehler }, 400) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="shop"]', { timeout: 20000 });
  return { p, fehler };
}
const shot = async (p, name, voll) => { if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/" + name + ".png", fullPage: Boolean(voll) }); };
(async () => {
  const b = await chromium.launch(); console.log("Heldentoken, Held der Woche, Heldenkauf");
  // Konto mit drei Helden und 2100 Seelensplittern
  const DB = welt(["schildwaechter", "trickser", "gelehrter"], 2100), { p, fehler } = await seite(b, DB);
  await p.click('.dorf-ort[data-hub="shop"]'); await p.waitForSelector(".shop-felder");
  const w = await p.evaluate(() => { const k = document.querySelector("[data-woche]"), t = document.querySelector('[data-shop-feld="token"]'); return { held: k.dataset.woche, band: (k.querySelector(".shop-angebot-band") || {}).textContent, oben: k.getBoundingClientRect().top < document.querySelector(".shop-felder").getBoundingClientRect().top, alt: k.querySelector(".shop-preis s").textContent.replace(/\s+/g, " ").trim(), neu: k.querySelector(".shop-preis b").textContent.replace(/\s+/g, " ").trim(),
    durch: getComputedStyle(k.querySelector(".shop-preis s")).textDecorationLine, knopf: k.querySelector("[data-woche-kauf]").textContent.replace(/\s+/g, " ").trim(), rest: k.querySelector("#shop-uhr").textContent, token: t.textContent.replace(/\s+/g, " "), bild: t.querySelector("img").complete && t.querySelector("img").naturalWidth > 0 }; });
  check(w.held === "berserker" && /Sonderangebot · Held der Woche/.test(w.band) && w.oben && /830/.test(w.alt) && /415/.test(w.neu) && /line-through/.test(w.durch) && /Für ◈ 415 holen/.test(w.knopf) && /^2 Tagen [45] Std\.$/.test(w.rest),
    `Held der Woche ganz oben als Sonderangebot: ein Held, der fehlt (${w.held}) – 830 durchgestrichen, daneben 415; neuer Held in ${w.rest}`);
  check(/Heldentoken/.test(w.token) && /830/.test(w.token) && /Im Besitz: 0/.test(w.token) && w.bild, "Unter den Feldern eine eigene Kachel für den Heldentoken mit Bild, Preis und Vorrat");
  await shot(p, "token-haendler", true);
  await p.click("[data-woche-kauf]"); await p.waitForSelector(".shop-angebot.gekauft");
  check(DB.helden.includes("berserker") && DB.waehrung === 1685 && /1685/.test(await p.textContent("#hub-waehrung")) && /In deiner Sammlung/.test(await p.textContent("[data-woche]")), "Held der Woche gekauft: 415 abgebucht, er steht als „In deiner Sammlung“ da");
  await p.click('[data-shop-feld="token"]'); await p.waitForSelector("[data-token]");
  await p.click("[data-token-kauf]"); await p.waitForFunction(() => /Im Besitz: 1/.test(document.querySelector("[data-token]").textContent.replace(/\s+/g, " ")));
  check(DB.tokens === 1 && DB.waehrung === 855 && /liegt für dich bereit/.test(await p.textContent(".fb")), "Heldentoken gekauft: 830 abgebucht, 1 im Besitz");
  // Heldenhalle: gesperrten Helden freischalten
  await p.click("[data-token-halle]"); await p.waitForSelector("[data-heldenseite]");
  await p.evaluate(() => { const k = [...document.querySelectorAll("[data-heldenseite] [data-klasse], [data-heldenseite] button")].find((x) => /Schurke/.test(x.textContent)); k.click(); }); await p.waitForSelector("article.held");
  await p.evaluate(() => document.querySelector('.hub-held-reihe [data-fid="assassine"]').click()); await p.waitForSelector('[data-held-kauf="assassine"]');
  const h0 = await p.evaluate(() => { const k = document.querySelector("[data-held-kauf]"); return { text: k.textContent.replace(/\s+/g, " "), token: !k.querySelector('[data-held-mit="token"]').disabled, splitter: !k.querySelector('[data-held-mit="splitter"]').disabled, gesperrt: !!document.querySelector("article.held.gesperrt") }; });
  check(h0.gesperrt && /Heldentoken: 1/.test(h0.text) && /Mit 1 Heldentoken freischalten/.test(h0.text) && /Für 830 Seelensplitter freischalten/.test(h0.text) && h0.token && h0.splitter, "Heldenhalle, gesperrter Held: zwei Wege – 1 Heldentoken oder 830 Seelensplitter");
  await p.evaluate(() => document.querySelector("[data-held-kauf]").scrollIntoView({ block: "center" })); await shot(p, "token-heldenhalle");
  await p.click('[data-held-mit="token"]'); await p.waitForFunction(() => !document.querySelector("[data-held-kauf]") && !document.querySelector("article.held.gesperrt"));
  check(DB.helden.includes("assassine") && DB.tokens === 0 && DB.waehrung === 855, "Mit Token freigeschaltet: Token verbraucht, Seelensplitter unberührt, die Karte ist nicht mehr gesperrt");
  await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.hub-held-reihe [data-fid="schattenlaeufer"]').click()); await p.waitForSelector('[data-held-kauf="schattenlaeufer"]');
  check(await p.evaluate(() => document.querySelector('[data-held-mit="token"]').disabled && !document.querySelector('[data-held-mit="splitter"]').disabled), "Ohne Token ist nur noch der Kauf mit Seelensplittern möglich");
  await p.click('[data-held-mit="splitter"]'); await p.waitForFunction(() => !document.querySelector("[data-held-kauf]"));
  check(DB.helden.includes("schattenlaeufer") && DB.waehrung === 25 && /25/.test(await p.textContent("#hub-waehrung")), "Für 830 Seelensplitter freigeschaltet: Kontostand 25");
  await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.hub-held-reihe [data-fid="trickser"]').click()); await p.waitForTimeout(200); await p.click("[data-held-klassen]"); await p.waitForSelector("[data-heldenseite] [data-klasse]"); await p.click('[data-heldenseite] [data-klasse="krieger"]'); await p.waitForSelector("article.held"); await p.evaluate(() => document.querySelector('.hub-held-reihe [data-fid="duellant"]').click()); await p.waitForSelector('[data-held-kauf="duellant"]');
  const arm = await p.evaluate(() => { const k = document.querySelector("[data-held-kauf]"); return k ? { beide: [...k.querySelectorAll("[data-held-mit]")].every((x) => x.disabled), text: k.textContent.replace(/\s+/g, " ") } : null; });
  check(arm && arm.beide && /Dir fehlen 805 Seelensplitter/.test(arm.text), "Weder Token noch genug Seelensplitter: beide Knöpfe gesperrt, Hinweis „Dir fehlen 805“");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Alle Helden: kein Held der Woche
  const V = welt(ALLE, 500), Q = await seite(b, V);
  await Q.p.click('.dorf-ort[data-hub="shop"]'); await Q.p.waitForSelector(".shop-felder");
  check(await Q.p.evaluate(() => /Du hast alle Helden freigeschaltet/.test(document.querySelector("[data-woche]").textContent) && !document.querySelector("[data-woche-kauf]")), "Alle Helden freigeschaltet: Das steht oben beim Händler, ohne Kaufknopf");
  check(!Q.fehler.length, "keine Skriptfehler (alle Helden)" + (Q.fehler.length ? ": " + Q.fehler.join(" | ") : ""));
  // Handy
  const H = await seite(b, welt(["schildwaechter"], 900), { width: 390, height: 844 }); await H.p.click('.dorf-ort[data-hub="shop"]'); await H.p.waitForSelector(".shop-felder");
  check(await H.p.evaluate(() => { const f = [...document.querySelectorAll("[data-shop-feld]")], ep = f.find((x) => x.dataset.shopFeld === "erfahrung").getBoundingClientRect(), tk = f.find((x) => x.dataset.shopFeld === "token").getBoundingClientRect();
    return document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".shop-angebot").getBoundingClientRect().right <= innerWidth && tk.top >= ep.bottom - 1; }), "Handy: Das Sonderangebot passt in die Breite, die Token-Kachel steht unter der Erfahrung");
  await shot(H.p, "token-handy", true);
  await b.close();
  console.log(ok ? "\nHELDENTOKEN IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
