/*
 * Mythara – Tutorial im Browser: der geführte Rundgang von Anfang bis „Ich bin bereit!“, am Rechner und am Handy.
 * Die Datenbank ist nachgebildet (Migration 011 prüft supabase/tests/011_rpg_tutorial_test.sql).
 * Geprüft wird je Schritt: Die Sprechblase liegt im Bild, alles außer der markierten Stelle ist gesperrt,
 * bei Klick-Schritten lässt sich genau die markierte Stelle antippen.
 * Aufruf: node abenteuer/tests/tutorial.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const URL = "http://localhost:8765/abenteuer/index.html";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
async function seite(b, w, h, zustand) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("dialog", (d) => d.accept());
  const json = (r, body) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Neuling", avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ["lichtbringer", "trickser", "schildwaechter"], start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: { lichtbringer: 120 } }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_my_friends(\?|$)/, (r) => json(r, { freunde: [], an_mich: [], von_mir: [], blockiert: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_my_wallet(\?|$)/, (r) => json(r, { konto: true, waehrung: 40 }));
  await p.route(/\/rest\/v1\/rpc\/rpg_arena_modes(\?|$)/, (r) => json(r, {}));
  await p.route(/\/rest\/v1\/rpc\/rpg_arena_list(\?|$)/, (r) => json(r, { konto: true, waehrung: 40, heute: 0, mein: null, offen: [{ id: "x1", name: "Mondfalke", schnitt: 1.3 }] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_shop_today(\?|$)/, (r) => json(r, { konto: true, preis: 830, waehrung: 40, bis: new Date(Date.now() + 5 * 3600e3).toISOString(), alle: false, helden: ["berserker", "schattenmagier", "kopfgeldjaeger"].map((x) => ({ held: x, gekauft: false })) }));
  await p.route(/\/rest\/v1\/rpc\/rpg_tutorial_state(\?|$)/, (r) => json(r, { konto: true, tutorial: zustand.offen }));
  await p.route(/\/rest\/v1\/rpc\/rpg_tutorial_done(\?|$)/, (r) => { zustand.offen = false; zustand.erledigt++; return json(r, { konto: true, tutorial: false }); });
  await p.route(/\/rest\/v1\/rpc\/rpg_tutorial_reset(\?|$)/, (r) => { zustand.offen = true; return json(r, { konto: true, tutorial: true }); });
  return { p, fehler };
}
const stand = (p) => p.evaluate(() => { const b = document.querySelector(".tut-blase"), q = b.getBoundingClientRect(), ring = document.querySelector(".tut-ring"), r = ring.getBoundingClientRect(), rda = getComputedStyle(ring).display !== "none";
  // gesperrt: An neun Punkten außerhalb der markierten Stelle liegt eine Sperrfläche (oder das Tutorial selbst) obenauf
  const pkt = []; for (const fx of [0.08, 0.5, 0.92]) for (const fy of [0.12, 0.5, 0.9]) pkt.push([innerWidth * fx, innerHeight * fy]);
  const frei = pkt.filter(([x, y]) => !(rda && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)).filter(([x, y]) => { const e = document.elementFromPoint(x, y); return !(e && e.closest("#tut")); }).length;
  const mitte = rda ? document.elementFromPoint((r.left + r.right) / 2, Math.min(innerHeight - 2, Math.max(2, (r.top + r.bottom) / 2))) : null;
  return { zahl: document.querySelector(".tut-zahl").textContent, titel: b.querySelector("h3").textContent, text: document.querySelector(".tut-text").textContent, weiter: Boolean(document.querySelector("#tut-weiter")), fertig: Boolean(document.querySelector("#tut-fertig")), klick: Boolean(document.querySelector(".tut-hinweis")),
    blaseDrin: q.left >= 0 && q.right <= innerWidth + 1 && q.top >= 0 && q.bottom <= innerHeight + 1, ring: rda ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, ringDrin: !rda || (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth),
    frei, zielFrei: Boolean(mitte && !mitte.closest("#tut")), skip: Boolean(document.querySelector("#tut-skip")), ueberdeckt: rda && !(q.bottom <= r.top || q.top >= r.bottom || q.right <= r.left || q.left >= r.right) && r.height < innerHeight * 0.6 }; });
(async () => {
  const b = await chromium.launch();
  for (const [w, h, name] of [[1440, 900, "Rechner"], [390, 844, "Handy"]]) {
    const Z = { offen: true, erledigt: 0 }, { p, fehler } = await seite(b, w, h, Z);
    await p.goto(URL); await p.waitForSelector("#tut .tut-blase:not(.wartet)", { timeout: 25000 });
    check(true, `${name}: Das Tutorial startet im Dorf von selbst (Konto steht auf „Tutorial: ja“)`);
    const titel = [], maengel = []; let klicks = 0, letzte = "";
    for (let i = 0; i < 80; i++) {
      await p.waitForFunction((alt) => { const b = document.querySelector(".tut-blase"); return !document.querySelector("#tut") || (b && !b.classList.contains("wartet") && document.querySelector(".tut-zahl").textContent !== alt); }, letzte, { timeout: 15000 }).catch(() => {});
      if (!(await p.$("#tut"))) break;
      await p.waitForTimeout(320);
      const s = await stand(p); letzte = s.zahl; titel.push(s.titel);
      if (!s.blaseDrin) maengel.push(`${s.zahl} „${s.titel}“: Sprechblase ragt aus dem Bild`);
      if (!s.ringDrin) maengel.push(`${s.zahl} „${s.titel}“: markierte Stelle liegt außerhalb des Bilds`);
      if (s.frei) maengel.push(`${s.zahl} „${s.titel}“: ${s.frei} Stellen außerhalb sind nicht gesperrt`);
      if (!s.skip) maengel.push(`${s.zahl}: „Tutorial überspringen“ fehlt`);
      if (s.ueberdeckt) maengel.push(`${s.zahl} „${s.titel}“: Sprechblase liegt über der markierten Stelle`);
      if (s.klick && !s.zielFrei) maengel.push(`${s.zahl} „${s.titel}“: die markierte Stelle lässt sich nicht antippen`);
      if (!s.klick && s.ring && s.zielFrei) maengel.push(`${s.zahl} „${s.titel}“: Info-Schritt, aber die Stelle ist anklickbar`);
      if (process.env.SHOT_DIR && [1, 6, 10, 13, 22, 29, 30, 38, 41, 46, 49].includes(i + 1)) await p.screenshot({ path: `${process.env.SHOT_DIR}/tut-${name}-${String(i + 1).padStart(2, "0")}.png` });
      if (s.fertig) { await p.click("#tut-fertig"); break; }
      if (s.weiter) await p.click("#tut-weiter");
      else if (s.klick) { klicks++; await p.mouse.click(s.ring[0] + s.ring[2] / 2, Math.min(h - 3, s.ring[1] + s.ring[3] / 2)); }
      else { maengel.push(`${s.zahl}: weder Weiter noch Klick`); break; }
    }
    if (process.env.DEBUG) console.log("    " + titel.join(" · "));
    check(titel.length >= 40, `${name}: ${titel.length} Schritte durchgeklickt, davon ${klicks} zum Selbst-Antippen`);
    check(!maengel.length, `${name}: in jedem Schritt liegt die Sprechblase im Bild, ist alles andere gesperrt und die markierte Stelle richtig frei oder gesperrt${maengel.length ? " – " + maengel.slice(0, 6).join(" | ") : ""}`);
    for (const t of ["Die Heldenhalle", "Eine Klasse ansehen", "Ein Held im Einzelnen", "Wie Helden aufsteigen", "Weitere Helden finden", "Die Abenteurergilde", "Neue Kampagne starten", "Die Taverne", "Die Arena", "Der Händler", "Hilfe und Regeln"]) if (!titel.includes(t)) maengel.push("fehlt: " + t);
    check(["Die Heldenhalle", "Eine Klasse ansehen", "Ein Held im Einzelnen", "Wie Helden aufsteigen", "Weitere Helden finden", "Die Abenteurergilde", "Neue Kampagne starten", "Die Taverne", "Die Arena", "Der Händler", "Hilfe und Regeln"].every((t) => titel.includes(t)), `${name}: Heldenhalle (Klasse, Held, Aufstieg, weitere Helden), Abenteurergilde, Taverne, Arena, Händler und Hilfe kommen alle vor`);
    await p.waitForFunction(() => !document.querySelector("#tut"), null, { timeout: 8000 }).catch(() => {});
    for (let i = 0; i < 30 && !Z.erledigt; i++) await p.waitForTimeout(100);
    check(!(await p.$("#tut")) && Z.erledigt === 1 && Z.offen === false, `${name}: „Ich bin bereit!“ beendet das Tutorial und speichert „Tutorial: nein“`);
    check(await p.evaluate(() => !document.querySelector("#szene") || document.querySelector("#szene").hidden) && await p.evaluate(() => !window.ABT || !window.ABT.A || !window.ABT.A()), `${name}: Es wurde keine Kampagne gestartet`);
    await p.reload(); await p.waitForSelector(".dorf-ort"); await p.waitForTimeout(1500);
    check(!(await p.$("#tut")), `${name}: Beim nächsten Besuch startet es nicht noch einmal`);
    check(!fehler.length, `${name}: keine Skriptfehler${fehler.length ? ": " + fehler.slice(0, 3).join(" | ") : ""}`);
  }
  { // Überspringen und „Tutorial ansehen“
    const Z = { offen: true, erledigt: 0 }, { p } = await seite(b, 1280, 800, Z);
    await p.goto(URL); await p.waitForSelector("#tut .tut-blase:not(.wartet)", { timeout: 25000 }); await p.click("#tut-weiter"); await p.waitForTimeout(600);
    await p.click("#tut-skip"); await p.waitForFunction(() => !document.querySelector("#tut"));
    for (let i = 0; i < 30 && !Z.erledigt; i++) await p.waitForTimeout(100);
    check(Z.erledigt === 1 && Z.offen === false, "„Tutorial überspringen“ (oben rechts) beendet es sofort und speichert „Tutorial: nein“");
    await p.click("#hub-profil-knopf"); await p.click('[data-profil="tutorial"]'); await p.waitForSelector("#tut .tut-blase:not(.wartet)");
    check(Z.offen === true && /Willkommen/.test(await p.textContent(".tut-blase h3")), "Profilmenü „Tutorial ansehen“ startet es von vorn");
  }
  await b.close();
  console.log(ok ? "\nTUTORIAL IN ORDNUNG" : "\nTUTORIAL: FEHLER"); process.exit(ok ? 0 : 1);
})();
