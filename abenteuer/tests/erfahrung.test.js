/*
 * Mythara – Erfahrungspakete: dritte Karte beim Händler (Kauf auf Vorrat, ohne Helden), Einsetzen an der Heldenkarte (Paket und Anzahl).
 * Die Datenbankfunktionen sind nachgebildet; die echten prüft supabase/tests/023_rpg_erfahrungspakete_test.sql.
 * Aufruf: node abenteuer/tests/erfahrung.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const PAKETE = [["klein", 50, 90, 3], ["mittel", 150, 250, 2], ["gross", 350, 550, 1]];
const DB = { waehrung: 700, heute: { klein: 0, mittel: 0, gross: 0 }, besitz: { klein: 0, mittel: 0, gross: 0 }, xp: { berserker: 80, trickser: 99999 }, kaeufe: [], einsatz: [] };
const laden = () => ({ konto: true, waehrung: DB.waehrung, bis: new Date(Date.now() + 5 * 36e5).toISOString(), pakete: PAKETE.map(([id, xp, preis, pro_tag]) => ({ id, xp, preis, pro_tag, heute: DB.heute[id], besitz: DB.besitz[id] })) });
const stufe = (xp) => { const bis = [100, 150, 250, 350, 500, 700, 900, 1200, 1500]; let s = 1, r = xp || 0; while (s < 10 && r >= bis[s - 1]) { r -= bis[s - 1]; s++; } return s; };
function server(name, a) {
  if (name === "rpg_xp_shop") return laden();
  if (name === "rpg_xp_buy") { const p = PAKETE.find((x) => x[0] === a.p_pack); if (!p) return { fehler: "Dieses Paket führt der Händler nicht." };
    if (DB.heute[p[0]] + a.p_anzahl > p[3]) return { fehler: "Von diesem Paket gibt es heute nur noch keines mehr." }; if (DB.waehrung < p[2] * a.p_anzahl) return { fehler: "Dafür reichen deine Seelensplitter nicht." };
    DB.heute[p[0]] += a.p_anzahl; DB.besitz[p[0]] += a.p_anzahl; DB.waehrung -= p[2] * a.p_anzahl; DB.kaeufe.push(a);
    return { paket: p[0], anzahl: a.p_anzahl, preis: p[2] * a.p_anzahl, waehrung: DB.waehrung, laden: laden() }; }
  if (name === "rpg_xp_use") { const p = PAKETE.find((x) => x[0] === a.p_pack); if (!p || DB.besitz[p[0]] < a.p_anzahl) return { fehler: "So viele dieser Pakete hast du nicht (im Vorrat: " + (p ? DB.besitz[p[0]] : 0) + ")." };
    const alt = DB.xp[a.p_held] || 0; DB.besitz[p[0]] -= a.p_anzahl; DB.xp[a.p_held] = alt + p[1] * a.p_anzahl; DB.einsatz.push(a);
    return { held: a.p_held, xp: p[1] * a.p_anzahl, gesamt: DB.xp[a.p_held], stufe_vorher: stufe(alt), stufe: stufe(DB.xp[a.p_held]), laden: laden() }; }
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
  check(await p.evaluate(() => document.querySelectorAll('[data-shop-feld="erfahrung"] img[src*="img/shop/ep"]').length === 3), "Die Karte zeigt die drei Truhen");
  await p.click('[data-shop-feld="erfahrung"]'); await p.waitForSelector(".xp-pakete");
  const lies = () => p.evaluate(() => ({ pakete: [...document.querySelectorAll(".xp-pakete .xp-paket")].map((x) => x.textContent.replace(/\s+/g, " ").trim()), bilder: [...document.querySelectorAll(".xp-pakete .xp-truhe")].map((x) => /ep(\d+)\.webp/.exec(x.src)[1] + (x.complete && x.naturalWidth ? "" : "!")).join(","),
    helden: document.querySelectorAll(".xp-held, [data-xp-kauf]").length, stand: document.querySelector(".shop-stand").textContent.replace(/\s+/g, " ").trim(), knoepfe: [...document.querySelectorAll("[data-xp-kaufen]")].map((x) => x.textContent + (x.disabled ? " (aus)" : "")) }));
  await p.waitForFunction(() => [...document.querySelectorAll(".xp-pakete .xp-truhe")].every((x) => x.complete));
  const pk = await lies();
  check(pk.pakete.length === 3 && /\+50 XP.*90.*heute noch 3 von 3.*Im Vorrat: 0/.test(pk.pakete[0]) && /\+150 XP.*250.*noch 2 von 2/.test(pk.pakete[1]) && /\+350 XP.*550.*noch 1 von 1/.test(pk.pakete[2]) && /700/.test(pk.stand), "Die drei Pakete mit Preis, Tagesgrenze und Vorrat: 50 XP für 90, 150 für 250, 350 für 550");
  check(pk.bilder === "50,150,350", `Jedes Paket zeigt seine Truhe (${pk.bilder})`);
  check(pk.helden === 0, "Beim Händler wird kein Held gewählt");
  check(pk.knoepfe.join(" | ") === "Kaufen · ◈ 90 | Kaufen · ◈ 250 | Kaufen · ◈ 550", `Je Paket ein Kaufknopf mit Preis (${pk.knoepfe.join(" | ")})`);
  await p.click('[data-xp-paket="mittel"] [data-xp-plus]');
  check(await p.evaluate(() => { const e = document.querySelector('[data-xp-paket="mittel"]'); return e.querySelector("[data-xp-n]").textContent === "2" && e.querySelector("[data-xp-plus]").disabled && /◈ 500/.test(e.querySelector("[data-xp-kaufen]").textContent); }), "Anzahl 2 beim mittleren Paket (mehr gibt es heute nicht): 500");
  await p.click('[data-xp-paket="mittel"] [data-xp-kaufen]'); await p.waitForSelector(".xp-meldung");
  const k = DB.kaeufe[0] || {}, pk2 = await lies();
  check(k.p_pack === "mittel" && k.p_anzahl === 2 && !("p_held" in k) && DB.waehrung === 200, "Gekauft: nur Paket und Anzahl gehen an die Datenbank – kein Held; 500 Seelensplitter abgebucht");
  check(/Im Vorrat: 2/.test(pk2.pakete[1]) && /heute aufgebraucht/.test(pk2.pakete[1]) && /200/.test(pk2.stand) && /Morgen wieder \(aus\)/.test(pk2.knoepfe[1]) && /Es fehlen ◈ 350 \(aus\)/.test(pk2.knoepfe[2]) && /200/.test(await p.textContent("#hub-waehrung")),
    "Danach: 2 im Vorrat, das mittlere ist für heute aufgebraucht, Kontostand 200 (auch in der Kopfzeile); fürs große fehlen 350");
  check(DB.xp.berserker === 80, "Der Kauf ändert an keinem Helden etwas");
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/xp-haendler.png" });
  // Heldenhalle: an der Heldenkarte einsetzen
  await p.click("[data-shop-zurueck]"); await p.waitForSelector(".shop-felder"); await p.click('.hub-zurueck[data-hub="uebersicht"]'); await p.waitForSelector('.dorf-ort[data-hub="helden"]'); await p.click('.dorf-ort[data-hub="helden"]'); await p.waitForSelector("[data-heldenseite]");
  await p.click('.sm-xp-zeile[data-held-stufe="berserker"]'); await p.waitForSelector(".xp-dialog #xp-einsetzen");
  const d0 = await p.evaluate(() => ({ titel: document.querySelector(".xp-dialog").closest("[role=dialog], .fenster, body").textContent.includes("Erfahrungspaket einsetzen"), name: document.querySelector(".xp-kopf b").textContent, an: document.querySelector(".xp-wahl .an").dataset.xpPack, aus: [...document.querySelectorAll(".xp-wahl [data-xp-pack]")].filter((x) => x.disabled).map((x) => x.dataset.xpPack).join(","),
    n: document.querySelector("#xp-n").textContent, summe: document.querySelector("#xp-summe").textContent.replace(/\s+/g, " "), knopf: document.querySelector("#xp-einsetzen").textContent, preis: /◈/.test(document.querySelector(".xp-dialog").textContent) }));
  check(d0.titel && d0.name === "Ragnar" && d0.an === "mittel" && d0.aus === "klein,gross" && d0.n === "1" && /\+150 XP für Ragnar/.test(d0.summe) && /Stufe 1 → Stufe 2/.test(d0.summe) && /1 × einsetzen/.test(d0.knopf) && !d0.preis,
    "Heldenhalle, „Deine Helden“: Tipp auf Ragnar öffnet „Erfahrungspaket einsetzen“ – nur das Paket aus dem Vorrat ist wählbar, kein Preis mehr");
  await p.click("#xp-plus");
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + "/xp-dialog.png" });
  check(await p.evaluate(() => document.querySelector("#xp-n").textContent === "2" && document.querySelector("#xp-plus").disabled && /\+300 XP/.test(document.querySelector("#xp-summe").textContent) && /Stufe 1 → Stufe 3/.test(document.querySelector("#xp-summe").textContent)), "Anzahl 2 (mehr liegt nicht im Vorrat): +300 XP, Stufe 1 → 3");
  await p.click("#xp-minus"); await p.click("#xp-einsetzen"); await p.waitForFunction(() => /\+150 XP für Ragnar/.test((document.querySelector(".xp-dialog .my-fb") || {}).textContent || ""));
  const e = DB.einsatz[0] || {};
  check(e.p_held === "berserker" && e.p_pack === "mittel" && e.p_anzahl === 1 && DB.besitz.mittel === 1 && DB.waehrung === 200 && DB.xp.berserker === 230, "Eingesetzt: Held, Paket und Anzahl gehen an die Datenbank; eines bleibt im Vorrat, es kostet nichts mehr");
  check(await p.evaluate(() => document.querySelector(".xp-kopf .sm-stufe b").textContent === "Stufe 2" && /im Vorrat: 1/.test(document.querySelector('[data-xp-pack="mittel"]').textContent)), "Danach: Ragnar ist Stufe 2, im Dialog steht „im Vorrat: 1“");
  await p.click("#fenster-zu");
  await p.evaluate(() => { const k = [...document.querySelectorAll("[data-heldenseite] [data-klasse], [data-heldenseite] button")].find((x) => /Krieger/.test(x.textContent)); k.click(); }); await p.waitForSelector("article.held");
  const hk = await p.evaluate(() => { const k = document.querySelector(".xp-kauf"); return k ? { text: k.textContent.replace(/\s+/g, " ").trim(), held: k.querySelector("[data-xp-kauf]").dataset.xpKauf, aus: k.querySelector("[data-xp-kauf]").disabled } : null; });
  check(hk && /Erfahrungspaket einsetzen/.test(hk.text) && /Stufe/.test(hk.text) && !hk.aus, `Heldenkarte: Stufe und der Knopf „Erfahrungspaket einsetzen“ (${hk ? hk.held : "fehlt"})`);
  await p.click("[data-xp-kauf]"); await p.waitForSelector(".xp-dialog #xp-einsetzen"); await p.click("#xp-einsetzen"); await p.waitForSelector("#xp-leer");
  check(DB.einsatz.length === 2 && DB.besitz.mittel === 0, "Einsetzen von der Heldenkarte aus: das letzte Paket ist verbraucht");
  check(await p.evaluate(() => /keine Erfahrungspakete im Vorrat/.test(document.querySelector("#xp-leer").textContent) && !!document.querySelector("#xp-zum-haendler")), "Leerer Vorrat: Hinweis und der Knopf „Zum Händler“");
  await p.click("#xp-zum-haendler"); await p.waitForSelector(".xp-pakete");
  check(await p.evaluate(() => !document.querySelector(".xp-dialog") || document.querySelector(".xp-dialog").offsetParent === null), "… der führt direkt zu den Paketen");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  const H = await seite(b, { width: 390, height: 844 }); await H.p.click('.dorf-ort[data-hub="shop"]'); await H.p.waitForSelector(".shop-felder"); await H.p.click('[data-shop-feld="erfahrung"]'); await H.p.waitForSelector(".xp-pakete");
  check(await H.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll(".xp-pakete .xp-paket")].every((k) => { const r = k.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width > 250; }) && [...document.querySelectorAll(".xp-pakete .xp-paket > *")].every((k) => k.getBoundingClientRect().right <= k.parentElement.getBoundingClientRect().right + 1)), "Handy: Die drei Pakete stehen untereinander und passen in die Breite");
  if (process.env.SHOT_DIR) await H.p.screenshot({ path: process.env.SHOT_DIR + "/xp-handy.png", fullPage: true });
  check(!H.fehler.length, "keine Skriptfehler am Handy" + (H.fehler.length ? ": " + H.fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nERFAHRUNGSPAKETE IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
