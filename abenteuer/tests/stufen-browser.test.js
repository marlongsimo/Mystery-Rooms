/*
 * Mythara – Heldenstufen im Browser (Migration 007), mit nachgebildeten Antworten des Servers:
 * Charaktere-Seite und Profil zeigen Stufe und XP-Balken, eine neue Kampagne spielt im Zehn-Stufen-Modell mit eigener
 * Stufe je Held (Anhebung auf Empfehlung − 2), ein Kampf läuft durch, die Belohnung zeigt XP und Aufstieg.
 * Ohne die Funktionen in der Datenbank bleibt alles beim bisherigen Modell.
 * Aufruf: node abenteuer/tests/stufen-browser.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
const XP = { schildwaechter: 1350, lichtbringer: 260, wildnislaeufer: 0 }; // Stufe 6, Stufe 3, Stufe 1
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
async function seite(b, mit007) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => (mit007 ? json(r, { konto: true, xp: XP }) : r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "PGRST202", message: "Could not find the function public.rpg_hero_levels" }) })));
  await p.route(/\/rest\/v1\/rpc\/rpg_claim_ending(\?|$)/, (r) => json(r, { konto: true, neu: false, abenteuer: "grauwacht", ende: "ende_waechter", schon_gemeldet: false, angebot: null, gefunden: 1, gesamt: 5, sammlung: 15 }));
  await p.route(/\/rest\/v1\/rpc\/rpg_award_xp(\?|$)/, (r) => json(r, { konto: true, abenteuer: "grauwacht", helden: [
    { held: "wildnislaeufer", xp: 320, vorher: 1, stufe: 3, gesamt: 320, neu: true }, { held: "lichtbringer", xp: 200, vorher: 3, stufe: 4, gesamt: 460, neu: true }, { held: "schildwaechter", xp: 50, vorher: 6, stufe: 6, gesamt: 1400, neu: true }] }));
  return { p, fehler };
}
(async () => {
  const b = await chromium.launch();
  { // ---------- mit Heldenstufen ----------
    const { p, fehler } = await seite(b, true);
    await p.goto(URL); await p.click("#my-gast-start");
    await p.evaluate(() => window.ABSAMMLUNG.laden(true));
    await p.evaluate(() => document.querySelector('.hub-nav-punkt[data-hub="helden"]').click()); await p.waitForSelector(".sm-helden-liste");
    const liste = await p.evaluate(() => [...document.querySelectorAll(".sm-helden-liste .sm-xp-zeile")].slice(0, 3).map((z) => z.textContent.replace(/\s+/g, " ").trim()));
    check(/Torvald.*Stufe 6/.test(liste[0]) && /0 \/ 700 XP bis Stufe 7/.test(liste[0]) && /Stufe 3/.test(liste[1]) && /10 \/ 250 XP/.test(liste[1]), "Charaktere: Übersicht mit Stufe und XP bis zur nächsten Stufe (" + liste[0].slice(0, 60) + " …)");
    await p.click('#hub-seite [data-klasse="krieger"]'); await p.waitForSelector("article.held");
    const karte = await p.evaluate(() => ({ kopf: document.querySelector("article.held .sm-stufe").textContent, kachel: document.querySelector('.fkarte[data-fid="schildwaechter"] .sm-stufe').textContent, tp: document.querySelector(".held-kern b").textContent, jetzt: (document.querySelector(".held-pfad tr.aktuell th") || {}).textContent, an: window.ABF.STUFEN10.aktiv }));
    check(/Stufe 6/.test(karte.kopf) && /Stufe 6/.test(karte.kachel) && karte.tp === String(await p.evaluate(() => { const F = window.ABF; F.STUFEN10.aktiv = true; const t = F.tpVon("schildwaechter", 6); F.STUFEN10.aktiv = false; return t; })) && /6/.test(karte.jetzt) && !karte.an, `Heldenkarte: Stufe 6 mit Balken, Leben der Stufe (${karte.tp}), Zeile „jetzt“ in der Stufentabelle`);
    check(await p.evaluate(() => (window.ABSAMMLUNG.heldenUebersichtHtml().match(/data-held-stufe/g) || []).length === 15), "Profil „Meine Helden“: alle 15 Helden mit Stufe (das Menü selbst gibt es nur mit Konto)");
    // Neue Kampagne (Solo): Zehn-Stufen-Modell, eigene Stufe je Held, Anhebung auf Empfehlung − 2
    const start = await p.evaluate(async () => {
      window.AB.abenteuerWaehlen("krone"); const s = window.AB.SETUP(); s.gruppe = ["schildwaechter", "lichtbringer", "wildnislaeufer"];
      await window.ABSAMMLUNG.tischLaden(null); window.ABT.start(s); const A = window.ABT.A(), F = window.ABF;
      return { m10: A.modell10, an: F.STUFEN10.aktiv, stufen: A.heldStufe, echt: A.heldEcht, tp: A.zust.schildwaechter.tp, soll: F.tpVon("schildwaechter", 6), tpK: A.zust.wildnislaeufer.tp, sollK: F.tpVon("wildnislaeufer", 4) };
    });
    check(start.m10 && start.an && start.stufen.schildwaechter === 6 && start.stufen.lichtbringer === 4 && start.stufen.wildnislaeufer === 4 && start.echt.wildnislaeufer === 1 && start.tp === start.soll && start.tpK === start.sollK,
      "Krone (empfohlen 6): Torvald auf Stufe 6, Elara und Kael von 3 und 1 auf Stufe 4 angehoben, Leben passend");
    const kampf = await p.evaluate(() => { const A = window.ABT.A(); A.szene = "kampf_markt"; window.ABT.render(); document.querySelector("#sz-kampf").click(); return true; });
    await p.waitForFunction(() => window.AB.st);
    const k = await p.evaluate(() => { const st = window.AB.st, R = window.AB.R; const f = R.spielerFiguren(st).map((x) => x.fid + ":" + x.stufe).join(","); let n = 0; while (!st.ende && n++ < 4000) R.aktiv(st).seite === "gegner" ? R.gegnerZug(st) : R.autoZug(st); return { f, bed: st.bed, ende: st.ende }; });
    check(/schildwaechter:6/.test(k.f) && /wildnislaeufer:4/.test(k.f) && k.bed === 5 && Boolean(k.ende), `Kampf: Figuren mit eigener Stufe (${k.f}), Bedrohung ${k.bed}, endet mit „${k.ende}“`);
    // Belohnung mit XP
    await p.evaluate(() => { window.ABSAMMLUNG.endeMelden("00000000-0000-0000-0000-000000000001", { versuche: 1 }); }); await p.waitForSelector(".sm-xp");
    const xp = await p.evaluate(() => [...document.querySelectorAll(".sm-xp .sm-xp-zeile")].map((z) => (z.classList.contains("auf") ? "AUF " : "") + z.textContent.replace(/\s+/g, " ").trim()));
    check(xp.length === 3 && /^AUF .*Kael.*\+320 XP.*Aufstieg: Stufe 1 → 3/.test(xp[0]) && /^AUF .*\+200 XP.*Stufe 3 → 4/.test(xp[1]) && !/^AUF/.test(xp[2]) && /\+50 XP.*Stufe 6/.test(xp[2]), "Belohnung: XP je Held, Balken und Aufstieg (" + xp[0].slice(0, 70) + " …)");
    await p.screenshot({ path: (process.env.SHOT_DIR || "/tmp") + "/xp-belohnung.png" });
    check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
    await p.close();
  }
  { // ---------- ohne Migration 007: bisheriges Modell ----------
    const { p, fehler } = await seite(b, false);
    await p.goto(URL); await p.click("#my-gast-start");
    const alt = await p.evaluate(async () => {
      await window.ABSAMMLUNG.laden(true);
      window.AB.abenteuerWaehlen("krone"); const s = window.AB.SETUP(); s.gruppe = ["schildwaechter", "lichtbringer", "wildnislaeufer"];
      await window.ABSAMMLUNG.tischLaden(null); window.ABT.start(s); const A = window.ABT.A();
      return { m10: Boolean(A.modell10), an: window.ABF.STUFEN10.aktiv, stufe: A.stufe, hs: A.heldStufe || null, balken: window.ABSAMMLUNG.stufeHtml("schildwaechter") };
    });
    check(!alt.m10 && !alt.an && alt.stufe === 1 && !alt.hs && alt.balken === "", "Ohne Heldenstufen in der Datenbank: bisheriges Modell, keine Stufenanzeige");
    check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
    await p.close();
  }
  await b.close();
  console.log(ok ? "\nHELDENSTUFEN IM BROWSER IN ORDNUNG" : "\nHELDENSTUFEN IM BROWSER: FEHLER"); process.exit(ok ? 0 : 1);
})();
