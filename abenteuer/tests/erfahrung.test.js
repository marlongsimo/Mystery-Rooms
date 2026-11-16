/*
 * Mythara – Erfahrungspakete: dritte Karte beim Händler, Kauf für einen Helden (Paket und Anzahl), Knopf an der Heldenkarte.
 * Die Datenbankfunktionen sind nachgebildet; die echten prüft supabase/tests/023_rpg_erfahrungspakete_test.sql.
 * Aufruf: node abenteuer/tests/erfahrung.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const PAKETE = [["klein", 50, 90, 3], ["mittel", 150, 250, 2], ["gross", 350, 550, 1]];
const DB = { waehrung: 700, heute: { klein: 0, mittel: 0, gross: 0 }, xp: { berserker: 80, trickser: 99999 }, kaeufe: [] };
const laden = () => ({ konto: true, waehrung: DB.waehrung, bis: new Date(Date.now() + 5 * 36e5).toISOString(), pakete: PAKETE.map(([id, xp, preis, pro_tag]) => ({ id, xp, preis, pro_tag, heute: DB.heute[id] })) });
const stufe = (xp) => { const bis = [100, 150, 250, 350, 500, 700, 900, 1200, 1500]; let s = 1, r = xp || 0; while (s < 10 && r >= bis[s - 1]) { r -= bis[s - 1]; s++; } return s; };
function server(name, a) {
  if (name === "rpg_xp_shop") return laden();
  if (name === "rpg_xp_buy") { const p = PAKETE.find((x) => x[0] === a.p_pack); if (!p) return { fehler: "Dieses Paket führt der Händler nicht." };
    if (DB.heute[p[0]] + a.p_anzahl > p[3]) return { fehler: "Von diesem Paket gibt es heute nur noch keines mehr." }; if (DB.waehrung < p[2] * a.p_anzahl) return { fehler: "Dafür reichen deine Seelensplitter nicht." };
    const alt = DB.xp[a.p_held] || 0; DB.heute[p[0]] += a.p_anzahl; DB.waehrung -= p[2] * a.p_anzahl; DB.xp[a.p_held] = alt + p[1] * a.p_anzahl; DB.kaeufe.push(a);
    return { held: a.p_held, xp: p[1] * a.p_anzahl, preis: p[2] * a.p_anzahl, gesamt: DB.xp[a.p_held], stufe_vorher: stufe(alt), stufe: stufe(DB.xp[a.p_held]), waehrung: DB.waehrung, laden: laden() }; }
  if (name === "rpg_my_wallet") return { konto: true, waehrung: DB.waehrung };
  if (name === "rpg_shop_today") return { konto: true, preis: 830, waehrung: DB.waehrung, bis: new Date(Date.now() + 3 * 36e5).toISOString(), alle: false, helden: [{ held: "duellant", gekauft: false }] };
  if (name === "rpg_cosmetics") return { konto: true, waehrung: DB.waehrung, katalog: [], besitz: [], aktiv: { wuerfel: null, rahmen: null } };
  if (name === "rpg_arena_list") return { konto: true, waehrung: DB.waehrung, heute: 0, offen: [], mein: null };
  return { fehler: "nicht erwartet: " + name };
}
async function seite(b, vp) {
  const p = await (await b.newContext({ viewport: vp })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, o, st = 200) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler A", avatar_key: "schildwaechter", created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ["berserker", "trickser", "gelehrter"], start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: DB.xp }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(xp_[a-z_]+|shop_[a-z_]+|cosmetic[a-z_]*|arena_[a-z_]+|my_wallet)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let a = {}; try { a = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(name, a); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="shop"]', { timeout: 20000 });
  return { p, fehler };
}
(async () => {
  const b = await chromium.launch();
  console.log("Erfahrungspakete");
  const { p, fehler } = await seite(b, { width: 1200, height: 950 });
  await p.click('.dorf-ort[data-hub="shop"]'); await p.waitForSelector(".shop-felder");
  const felder = await p.evaluate(() => [...document.querySelectorAll("[data-shop-feld]")].map((x) => x.dataset.shopFeld + ":" + x.querySelector("b").textContent));
  check(felder.join(" | ") === "helden:Helden des Tages | ausstattung:Ausstattung | erfahrung:Erfahrung", "Händler: dritte Karte „Erfahrung“ neben Helden des Tages und Ausstattung");
  await p.click('[data-shop-feld="erfahrung"]'); await p.waitForSelector(".xp-pakete");
  const pk = await p.evaluate(() => ({ pakete: [...document.querySelectorAll(".xp-pakete .xp-paket")].map((x) => x.textContent.replace(/\s+/g, " ").trim()), helden: [...document.querySelectorAll(".xp-held")].map((x) => x.dataset.xpKauf + (x.disabled ? "-" : "")), stand: document.querySelector(".shop-stand").textContent.replace(/\s+/g, " ").trim() }));
  check(pk.pakete.length === 3 && /\+50 XP.*90.*heute noch 3 von 3/.test(pk.pakete[0]) && /\+150 XP.*250.*noch 2 von 2/.test(pk.pakete[1]) && /\+350 XP.*550.*noch 1 von 1/.test(pk.pakete[2]) && /700/.test(pk.stand), "Die drei Pakete mit Preis und Tagesgrenze: 50 XP für 90, 150 für 250, 350 für 550");
  check(pk.helden.join(",") === "berserker,gelehrter,trickser-", "Darunter die eigenen Helden zur Wahl; wer schon Stufe 10 hat, ist gesperrt");
  await p.click('.xp-held[data-xp-kauf="berserker"]'); await p.waitForSelector(".xp-dialog");
  const d0 = await p.evaluate(() => ({ name: document.querySelector(".xp-kopf b").textContent, an: document.querySelector(".xp-wahl .an").dataset.xpPack, n: document.querySelector("#xp-n").textContent, summe: document.querySelector("#xp-summe").textContent.replace(/\s+/g, " "), knopf: document.querySelector("#xp-kaufen").textContent, minus: document.querySelector("#xp-minus").disabled }));
  check(d0.name === "Ragnar" && d0.an === "klein" && d0.n === "1" && /\+50 XP für ◈ 90/.test(d0.summe) && /Stufe 1 → Stufe 2/.test(d0.summe) && /Kaufen für ◈ 90/.test(d0.knopf) && d0.minus, "Kaufdialog für Ragnar: Paket vorgewählt, Anzahl 1, die Summe zeigt XP, Preis und die neue Stufe");
  await p.click('[data-xp-pack="mittel"]'); await p.click("#xp-plus");
  const d1 = await p.evaluate(() => ({ n: document.querySelector("#xp-n").textContent, summe: document.querySelector("#xp-summe").textContent.replace(/\s+/g, " "), plus: document.querySelector("#xp-plus").disabled, kaufen: document.querySelector("#xp-kaufen").disabled }));
  check(d1.n === "2" && /\+300 XP für ◈ 500/.test(d1.summe) && /Stufe 1 → Stufe 3/.test(d1.summe) && d1.plus && !d1.kaufen, "Mittleres Paket, Anzahl 2 (mehr gibt es heute nicht): +300 XP für 500, Stufe 1 → 3");
  await p.click("#xp-kaufen"); await p.waitForFunction(() => /\+300 XP für Ragnar/.test((document.querySelector(".xp-dialog .my-fb") || {}).textContent || ""));
  const k = DB.kaeufe[0] || {};
  check(k.p_held === "berserker" && k.p_pack === "mittel" && k.p_anzahl === 2 && DB.waehrung === 200, "Gekauft: Held, Paket und Anzahl gehen an die Datenbank; 500 Seelensplitter abgebucht");
  const d2 = await p.evaluate(() => ({ stufe: document.querySelector(".xp-kopf .sm-stufe b").textContent, stand: document.querySelector("#xp-stand").textContent, mittel: document.querySelector('[data-xp-pack="mittel"]').disabled, kopf: document.querySelector("#hub-waehrung").textContent, meldung: document.querySelector(".xp-dialog .my-fb").textContent }));
  check(d2.stufe === "Stufe 3" && d2.stand === "200" && d2.mittel && /200/.test(d2.kopf) && /jetzt Stufe 3/.test(d2.meldung), "Danach: Ragnar ist Stufe 3, Kontostand 200 (auch oben in der Kopfzeile), das mittlere Paket ist für heute aufgebraucht");
  await p.click('[data-xp-pack="gross"]');
  check(await p.evaluate(() => document.querySelector("#xp-kaufen").disabled && /es fehlen 350/.test(document.querySelector("#xp-summe").textContent)), "Großes Paket ohne genug Seelensplitter: „es fehlen 350“, Kaufen gesperrt");
  await p.click("#fenster-zu");
  // Heldenhalle: Knopf an der Heldenkarte
  await p.click('.hub-zurueck[data-hub="uebersicht"]'); await p.waitForSelector('.dorf-ort[data-hub="helden"]'); await p.click('.dorf-ort[data-hub="helden"]'); await p.waitForSelector("[data-heldenseite]");
  await p.click('.sm-xp-zeile[data-held-stufe="berserker"]'); await p.waitForSelector(".xp-dialog");
  check(await p.evaluate(() => document.querySelector(".xp-kopf b").textContent === "Ragnar"), "Heldenhalle, „Deine Helden“: Tipp auf einen Helden öffnet den Kauf");
  await p.click("#fenster-zu");
  await p.evaluate(() => { const k = [...document.querySelectorAll("[data-heldenseite] [data-klasse], [data-heldenseite] button")].find((x) => /Krieger/.test(x.textContent)); k.click(); }); await p.waitForSelector("article.held");
  const hk = await p.evaluate(() => { const k = document.querySelector(".xp-kauf"); return k ? { text: k.textContent.replace(/\s+/g, " ").trim(), held: k.querySelector("[data-xp-kauf]").dataset.xpKauf, aus: k.querySelector("[data-xp-kauf]").disabled } : null; });
  check(hk && /Erfahrung kaufen/.test(hk.text) && /Stufe/.test(hk.text) && !hk.aus, `Heldenkarte: Stufe und der Knopf „Erfahrung kaufen“ (${hk ? hk.held : "fehlt"})`);
  await p.click("[data-xp-kauf]"); await p.waitForSelector(".xp-dialog"); await p.click("#xp-kaufen"); await p.waitForFunction(() => /\+50 XP/.test((document.querySelector(".xp-dialog .my-fb") || {}).textContent || ""));
  check(DB.kaeufe.length === 2 && DB.kaeufe[1].p_pack === "klein" && DB.waehrung === 110, "Kauf von der Heldenkarte aus: kleines Paket, 90 abgebucht");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/xp-dialog.png" });
  const H = await seite(b, { width: 390, height: 844 }); await H.p.click('.dorf-ort[data-hub="shop"]'); await H.p.waitForSelector(".shop-felder"); await H.p.click('[data-shop-feld="erfahrung"]'); await H.p.waitForSelector(".xp-pakete");
  check(await H.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".xp-pakete").getBoundingClientRect().right <= innerWidth), "Handy: Die Pakete passen in die Breite");
  if (process.env.SHOT_DIR) await H.p.screenshot({ path: process.env.SHOT_DIR + "/xp-handy.png" });
  check(!H.fehler.length, "keine Skriptfehler am Handy" + (H.fehler.length ? ": " + H.fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nERFAHRUNGSPAKETE IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
