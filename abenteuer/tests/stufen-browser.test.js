/*
 * Mythara – Heldenstufen im Browser (Migration 007), mit nachgebildeten Antworten des Servers:
 * Charaktere-Seite und Profil zeigen Stufe und EP-Balken, eine neue Kampagne spielt im Zehn-Stufen-Modell mit eigener
 * Stufe je Held (ohne Anhebung), ein Kampf läuft durch, die Belohnung zeigt EP und Aufstieg.
 * Ohne die Funktionen in der Datenbank bleibt alles beim bisherigen Modell.
 * Aufruf: node abenteuer/tests/stufen-browser.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
const EP = { schildwaechter: 1350, lichtbringer: 260, wildnislaeufer: 0 }; // Stufe 6, Stufe 3, Stufe 1
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
async function seite(b, mit007) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => (mit007 ? json(r, { konto: true, xp: EP }) : r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "PGRST202", message: "Could not find the function public.rpg_hero_levels" }) })));
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
    check(/Torvald.*Stufe 6/.test(liste[0]) && /0 \/ 700 EP bis Stufe 7/.test(liste[0]) && /Stufe 3/.test(liste[1]) && /10 \/ 250 EP/.test(liste[1]), "Charaktere: Übersicht mit Stufe und EP bis zur nächsten Stufe (" + liste[0].slice(0, 60) + " …)");
    await p.click('#hub-seite [data-klasse="krieger"]'); await p.waitForSelector("article.held");
    const karte = await p.evaluate(() => ({ kopf: document.querySelector("article.held .sm-stufe").textContent, kachel: document.querySelector('.fkarte[data-fid="schildwaechter"] .sm-stufe').textContent, tp: document.querySelector(".held-kern b").textContent, jetzt: (document.querySelector(".held-pfad tr.aktuell th") || {}).textContent, an: window.ABF.STUFEN10.aktiv }));
    check(/Stufe 6/.test(karte.kopf) && /Stufe 6/.test(karte.kachel) && karte.tp === String(await p.evaluate(() => { const F = window.ABF; F.STUFEN10.aktiv = true; const t = F.tpVon("schildwaechter", 6); F.STUFEN10.aktiv = false; return t; })) && /6/.test(karte.jetzt) && !karte.an, `Heldenkarte: Stufe 6 mit Balken, Leben der Stufe (${karte.tp}), Zeile „jetzt“ in der Stufentabelle`);
    check(await p.evaluate(() => (window.ABSAMMLUNG.heldenUebersichtHtml().match(/data-held-stufe/g) || []).length === 15), "Profil „Meine Helden“: alle 15 Helden mit Stufe (das Menü selbst gibt es nur mit Konto)");
    // Ampel in der Heldenwahl: Gruppenstufe gegen die Empfehlung der Kampagne
    const ampel = await p.evaluate(async () => {
      const lies = async (ab, gruppe) => { window.AB.abenteuerWaehlen(ab); const s = window.AB.SETUP(); s.gruppe = gruppe; await window.ABSAMMLUNG.tischLaden(null); window.AB.zeigeSetup(); await new Promise((r) => setTimeout(r, 400)); const e = document.querySelector(".stufen-ampel"); return e ? e.className.replace("stufen-ampel", "").trim() + " | " + e.textContent : "fehlt"; };
      return { krone: await lies("krone", ["schildwaechter", "lichtbringer", "wildnislaeufer"]), kroneSchwach: await lies("krone", ["wildnislaeufer", "trickser", "elementarist"]), weidenhain: await lies("weidenhain", ["schildwaechter", "lichtbringer", "wildnislaeufer"]), leer: await lies("krone", []) };
    });
    check(/^gelb \| Empfohlene Heldenstufe: 6.*3,3 im Schnitt/.test(ampel.krone) && /^rot /.test(ampel.kroneSchwach) && /^gruen .*Empfohlene Heldenstufe: 1/.test(ampel.weidenhain) && /Empfohlene Heldenstufe: 6/.test(ampel.leer),
      "Heldenwahl: Ampel gelb (Krone, Schnitt 3,3 von 6), rot (drei Stufe-1-Helden), grün (Weidenhain); ohne Gruppe nur die Empfehlung");
    await p.screenshot({ path: (process.env.SHOT_DIR || "/tmp") + "/ampel.png", fullPage: true });
    // Neue Kampagne (Solo): Zehn-Stufen-Modell, eigene Stufe je Held, Anhebung auf Empfehlung − 2
    const start = await p.evaluate(async () => {
      window.AB.abenteuerWaehlen("krone"); const s = window.AB.SETUP(); s.gruppe = ["schildwaechter", "lichtbringer", "wildnislaeufer"];
      await window.ABSAMMLUNG.tischLaden(null); window.ABT.start(s); const A = window.ABT.A(), F = window.ABF;
      return { m10: A.modell10, an: F.STUFEN10.aktiv, stufen: A.heldStufe, echt: A.heldEcht, tp: A.zust.schildwaechter.tp, soll: F.tpVon("schildwaechter", 6), tpK: A.zust.wildnislaeufer.tp, sollK: F.tpVon("wildnislaeufer", 1) };
    });
    check(start.m10 && start.an && start.stufen.schildwaechter === 6 && start.stufen.lichtbringer === 3 && start.stufen.wildnislaeufer === 1 && start.tp === start.soll && start.tpK === start.sollK,
      "Krone (empfohlen 6): jeder Held auf seiner echten Stufe (6, 3, 1), keine Anhebung, Leben passend");
    const kampf = await p.evaluate(() => { const A = window.ABT.A(); A.szene = "kampf_markt"; window.ABT.render(); document.querySelector("#sz-kampf").click(); return true; });
    await p.waitForFunction(() => window.AB.st);
    const k = await p.evaluate(() => { const st = window.AB.st, R = window.AB.R; const f = R.spielerFiguren(st).map((x) => x.fid + ":" + x.stufe).join(","); let n = 0; while (!st.ende && n++ < 4000) R.aktiv(st).seite === "gegner" ? R.gegnerZug(st) : R.autoZug(st); return { f, bed: st.bed, ende: st.ende }; });
    check(/schildwaechter:6/.test(k.f) && /wildnislaeufer:1/.test(k.f) && k.bed === 5 && Boolean(k.ende), `Kampf: Figuren mit eigener Stufe (${k.f}), Bedrohung ${k.bed}, endet mit „${k.ende}“`);
    // Segen am Lagerfeuer: Wahl aus drei am Tisch, danach als Zeile unter der Gruppe sichtbar
    const segen = await p.evaluate(async () => {
      const A = window.ABT.A(), D = window.ABS.datenVon(A.abenteuer), lager = Object.keys(D.SZENEN).find((k) => D.SZENEN[k].art === "lager" && D.SZENEN[k].aufstieg);
      window.AB.st = null; window.ABS.gehe(A, lager); window.ABT.render(); await new Promise((r) => setTimeout(r, 300));
      const knoepfe = [...document.querySelectorAll("#szene button")].filter((b) => /:/.test(b.textContent) && Object.values(window.ABF.SEGEN).some((s) => b.textContent.includes(s.name)));
      const titel = document.querySelector("#szene").textContent.includes("Der Segen des Feuers"), n = knoepfe.length, name = n ? knoepfe[0].textContent : "";
      if (n) knoepfe[0].click(); await new Promise((r) => setTimeout(r, 300));
      const leiste = document.querySelector(".segen-leiste");
      return { titel, n, name: name.slice(0, 40), danach: A.szene === lager, segen: A.segen, leiste: leiste ? leiste.textContent : "" };
    });
    check(segen.titel && segen.n === 3 && segen.danach && segen.segen.length === 1 && segen.leiste.includes(await p.evaluate((id) => window.ABF.SEGEN[id].name, segen.segen[0])), `Lagerfeuer am Tisch: „Der Segen des Feuers“ mit drei Möglichkeiten, gewählt: ${segen.segen[0]}, Zeile unter der Gruppe`);
    // Ortskunde: Die Gegnervorschau zeigt Schwächen auch ohne die passende Klasse (früher ein Absturz der Anzeige)
    const orts = await p.evaluate(async () => { const A = window.ABT.A(); A.segen = ["ortskunde"]; A.szene = "kampf_markt"; window.ABT.render(); await new Promise((r) => setTimeout(r, 300));
      const v = window.ABS.gegnerVorschau(A); return { offen: v.arten.filter((a) => a.wissen && !a.wissen.wer).length, verdeckt: v.arten.filter((a) => a.verdeckt).length, knopf: Boolean(document.querySelector("#sz-kampf")), text: /Ortskunde:/.test(document.querySelector("#szene").textContent) }; });
    check(orts.knopf && orts.verdeckt === 0 && (orts.offen === 0 || orts.text), `Ortskunde: Vorschau ohne verdeckte Schwächen (${orts.offen} durch den Segen aufgedeckt), Szene wird angezeigt`);
    // Belohnung mit EP
    await p.evaluate(() => { window.ABSAMMLUNG.endeMelden("00000000-0000-0000-0000-000000000001", { versuche: 1 }); }); await p.waitForSelector(".sm-xp");
    const xp = await p.evaluate(() => [...document.querySelectorAll(".sm-xp .sm-xp-zeile")].map((z) => (z.classList.contains("auf") ? "AUF " : "") + z.textContent.replace(/\s+/g, " ").trim()));
    check(xp.length === 3 && /^AUF .*Kael.*\+320 EP.*Aufstieg: Stufe 1 → 3/.test(xp[0]) && /^AUF .*\+200 EP.*Stufe 3 → 4/.test(xp[1]) && !/^AUF/.test(xp[2]) && /\+50 EP.*Stufe 6/.test(xp[2]), "Belohnung: EP je Held, Balken und Aufstieg (" + xp[0].slice(0, 70) + " …)");
    await p.screenshot({ path: (process.env.SHOT_DIR || "/tmp") + "/xp-belohnung.png" });
    // Abschlussbildschirm am Spieltisch: Belohnungen und darunter „Zur Startseite“ / „Weiter: nächste Kampagne“
    await p.evaluate(() => document.querySelector("#sm-zu").click());
    const ziel = await p.evaluate(() => new Promise((res) => { window.ABSAMMLUNG.abschluss({ kampagne: "00000000-0000-0000-0000-000000000002", abenteuer: "weidenhain", start: () => res("start"), weiterTitel: window.MYTHARA.naechstesAbenteuer("weidenhain").titel, weiter: () => res("weiter") });
      const warte = () => { const n = document.querySelector("#sm-naechste"), s = document.querySelector("#sm-start"), xp = document.querySelectorAll(".sm-xp .sm-xp-zeile").length; if (n && s && xp === 3) { window.__knopf = n.textContent; n.click(); } else setTimeout(warte, 100); }; warte(); }));
    check(ziel === "weiter" && /Weiter: Das Moor der stummen Lichter/.test(await p.evaluate(() => window.__knopf)) && await p.evaluate(() => document.querySelector("#sm-buehne").hidden), "Abschluss: EP-Übersicht, darunter „Zur Startseite“ und „Weiter: Das Moor der stummen Lichter“; der Knopf führt weiter");
    // Im Spiel: Endszene → „Weiter zu den Belohnungen“ → „Zur Startseite“ landet im Hub, nicht in der Heldenwahl
    const hub = await p.evaluate(() => new Promise((res) => { const A = window.ABT.A(); A.szene = "ende_stabil"; window.ABT.render(); const b = document.querySelector("#sz-schluss"), text = b.textContent; b.click();
      const warte = () => { const s = document.querySelector("#sm-start"); if (s) { s.click(); setTimeout(() => res({ text, hub: !document.querySelector("#hub").hidden, lobby: !document.querySelector("#lobby").hidden, A: Boolean(window.ABT.A()) }), 300); } else setTimeout(warte, 100); }; warte(); }));
    check(/Belohnungen/.test(hub.text) && hub.hub && !hub.lobby && !hub.A, "Endszene: „Weiter zu den Belohnungen“ → „Zur Startseite“ führt auf die Startseite (nicht in die Heldenwahl)");
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
