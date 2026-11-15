/*
 * Mythara – Arena gegen die echte Datenbank (Migration 008): zwei neue Test-Konten, vom Erstellen bis zur Belohnung.
 * Testkonten heißen Test_xxxxxx und bleiben bestehen (wie in live-sammlung.test.js).
 * Der Kampf dauert absichtlich länger als zwei Minuten, weil die Datenbank frühere Ergebnisse nicht wertet.
 * Aufruf: node abenteuer/tests/live-arena.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const warte = (p, fn, arg, t = 30000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true, () => false);
async function konto(b) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message + " @ " + String(e.stack).split("\n").slice(1, 3).join(" < "))); p.on("dialog", (d) => d.accept());
  const name = "Test_" + Math.random().toString(36).slice(2, 8), pw = "Mythara-" + Math.random().toString(36).slice(2, 10);
  await p.goto(URL); await p.click("#my-reg"); await p.fill("#my-reg-name", name);
  await warte(p, () => /ist frei/.test(document.querySelector("#my-name-info").textContent));
  await p.fill("#my-reg-pw", pw); await p.fill("#my-reg-pw2", pw); await p.click("#my-reg-form .my-knopf");
  for (let r = 1; r <= 3; r++) {
    await warte(p, (r) => { const s = document.querySelector("#sm-buehne"); return s && !s.hidden && new RegExp(`Runde ${r} von 3`).test(s.textContent) && document.querySelectorAll("#sm-reihe .sm-karte:not(.verdeckt)").length === 3; }, r, 40000);
    const k = await p.evaluate(() => [...document.querySelectorAll("#sm-reihe .sm-karte")].map((x) => x.dataset.smFid));
    await p.click(`.sm-karte[data-sm-fid="${k[0]}"]`); await p.waitForSelector("#sm-ein"); await p.click("#sm-ein");
  }
  await warte(p, () => /Deine Helden sind eingebucht/.test(document.querySelector("#sm-buehne").textContent), null, 40000); await p.click("#sm-weiter");
  await warte(p, () => !document.querySelector("#hub").hidden, null, 30000);
  return { p, fehler, name };
}
(async () => {
  const b = await chromium.launch();
  const A = await konto(b), B = await konto(b);
  console.log("  Testkonten:", A.name, "und", B.name);
  check((await warte(A.p, () => document.querySelector('.hub-kachel[data-hub="arena"]'), null, 20000)) && (await warte(B.p, () => document.querySelector('.hub-kachel[data-hub="arena"]'), null, 20000)), "Startseite beider Konten: „Arena“ ist da (Migration 008 läuft)");
  check(await A.p.evaluate(() => { const w = document.querySelector("#hub-waehrung"); return w && !w.hidden && /0/.test(w.textContent); }), "Neben dem Profilbild: 0 Seelensplitter");
  // A erstellt
  await A.p.click('.hub-kachel[data-hub="arena"]'); await A.p.waitForSelector("#arena-erstellen", { timeout: 30000 }); await A.p.click("#arena-erstellen");
  await A.p.waitForSelector("[data-arena-held]"); const hA = await A.p.evaluate(() => [...document.querySelectorAll("[data-arena-held]")].map((x) => x.dataset.arenaHeld));
  check(hA.length === 3, "Heldenwahl zeigt die drei Helden des neuen Kontos (" + hA.join(", ") + ")");
  for (const f of hA) await A.p.click(`[data-arena-held="${f}"]`);
  check(/1,0/.test(await A.p.textContent(".arena-schnitt")), "Durchschnittsstufe 1,0");
  await A.p.click("#arena-wahl-ok"); check(await warte(A.p, () => document.querySelector(".arena-mein"), null, 30000), "Echte Datenbank: Kampf erstellt, wartet auf einen Gegner");
  // B sieht und tritt bei
  await B.p.click('.hub-kachel[data-hub="arena"]'); await B.p.waitForSelector("#arena-neu-laden", { timeout: 30000 }); await B.p.click("#arena-neu-laden");
  const da = await warte(B.p, (n) => [...document.querySelectorAll(".arena-liste li")].some((li) => li.textContent.includes(n)), A.name, 30000);
  check(da, "Der andere sieht den Kampf in der Übersicht (Name des Erstellers)");
  const zeile = await B.p.evaluate((n) => { const li = [...document.querySelectorAll(".arena-liste li")].find((x) => x.textContent.includes(n)); return li ? li.textContent.replace(/\s+/g, " ") : ""; }, A.name);
  const namenA = await A.p.evaluate((l) => l.map((f) => window.ABF.FIGUREN[f].name), hA);
  check(/1,0/.test(zeile) && !namenA.some((n) => zeile.includes(n)), "… mit Durchschnittsstufe, ohne die Helden: " + zeile.trim());
  await B.p.evaluate((n) => [...document.querySelectorAll(".arena-liste li")].find((x) => x.textContent.includes(n)).querySelector("[data-arena-bei]").click(), A.name);
  await B.p.waitForSelector("[data-arena-held]"); const hB = await B.p.evaluate(() => [...document.querySelectorAll("[data-arena-held]")].map((x) => x.dataset.arenaHeld));
  for (const f of hB) await B.p.click(`[data-arena-held="${f}"]`);
  await B.p.click("#arena-wahl-ok"); check(await warte(B.p, () => document.querySelector(".arena-gegenueber"), null, 30000), "Beitritt: Aufstellung beider Seiten");
  const auf = (await B.p.textContent(".arena-gegenueber")).replace(/\s+/g, " ");
  const los = await B.p.evaluate(() => ({ seed: window.ARENA.zustand().match.seed, modus: (document.querySelector("#arena-modus-text h3") || {}).textContent || "" }));
  check(los.seed != null && /Arena|Königsmord|Die Horde/.test(los.modus), `Das Los kommt aus der Zufallszahl der Datenbank (${los.seed}) → ${los.modus}`);
  check(namenA.every((n) => auf.includes(n)) && /Stufe 1/.test(auf), "Aufstellung zeigt jetzt auch die Helden des Erstellers mit Stufe");
  const imKampf = (await warte(A.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 60000)) && (await warte(B.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 60000));
  check(imKampf, "Beide Geräte sind im Kampf");
  const start = Date.now();
  if (imKampf) {
    const dran = (S, seite) => S.p.evaluate((seite) => { const st = window.AB.st; if (!st || st.ende) return null; const a = window.AB.R.aktiv(st); return window.AB.R.teamVon(st, a) === seite && a.tp > 0 ? a.id : null; }, seite);
    const fertig = (S) => S.p.evaluate(() => { const e = document.querySelector("#arena-ende"); return Boolean(e && !e.hidden); });
    let zuege = 0;
    for (let i = 0; i < 900 && !(await fertig(A)); i++) {
      // die Datenbank wertet erst nach zwei Minuten: bis dahin höchstens bis Runde 3 spielen
      const runde = await A.p.evaluate(() => (window.AB.st ? window.AB.st.runde : 99));
      if (runde >= 3 && Date.now() - start < 135000) { await A.p.waitForTimeout(3000); continue; }
      let gezogen = false;
      for (const [S, seite] of [[A, 1], [B, 2]]) { const id = await dran(S, seite); if (!id) continue;
        await S.p.evaluate(() => { const k = document.querySelector("#ende-zug") || document.querySelector('[data-l="ende"]'); if (k && !k.disabled) k.click(); });
        await warte(S.p, (alt) => { const st = window.AB.st; return !st || st.ende || window.AB.R.aktiv(st).id !== alt; }, id, 20000); gezogen = true; zuege++; }
      if (!gezogen) await A.p.waitForTimeout(300);
    }
    const ende = (S) => warte(S.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && document.querySelector("#arena-ende-zu"); }, null, 90000);
    check((await ende(A)) && (await ende(B)), `Der Kampf endet auf beiden Geräten (${zuege} Züge, ${Math.round((Date.now() - start) / 1000)} Sekunden)`);
    const tA = (await A.p.textContent("#arena-ende")).replace(/\s+/g, " "), tB = (await B.p.textContent("#arena-ende")).replace(/\s+/g, " ");
    console.log("    A:", tA.slice(0, 230)); console.log("    B:", tB.slice(0, 230));
    const siegA = /Sieg/.test(tA) && !/Niederlage/.test(tA), siegB = /Sieg/.test(tB) && !/Niederlage/.test(tB);
    check(siegA !== siegB && !/Abgebrochen/.test(tA + tB), "Gewertet: ein Sieg, eine Niederlage");
    const splitter = Number((/\+(\d+) Seelensplitter/.exec(siegA ? tA : tB) || [])[1] || 0); // 25 fest (nur Migration 008) oder gewürfelt 5–25 (mit 009)
    check(splitter >= 5 && splitter <= 25 && /XP/.test(tA) && /XP/.test(tB), `Echte Belohnung: Sieger +${splitter} Seelensplitter (5 bis 25), beide XP für ihre Helden`);
    const S = siegA ? A : B, V = siegA ? B : A;
    await S.p.click("#arena-ende-zu");
    check(await warte(S.p, (n) => !document.querySelector("#hub").hidden && new RegExp("\\b" + n + "\\b").test((document.querySelector("#hub-waehrung") || {}).textContent || ""), splitter, 30000), `Sieger zurück auf der Startseite: ${splitter} Seelensplitter neben dem Profilbild`);
    const db = await S.p.evaluate(async () => { const c = window.AB.liveClient(); return { w: await c.rpc("rpg_my_wallet", {}), l: await c.rpc("rpg_arena_list", {}), xp: await c.rpc("rpg_hero_levels", {}) }; });
    check(db.w.waehrung === splitter && Object.values(db.xp.xp || {}).filter((x) => x >= 25).length === 3, `Datenbank: Währung ${db.w.waehrung}, XP bei allen drei Helden (${JSON.stringify(db.xp.xp)})`);
    await V.p.click("#arena-ende-zu"); await warte(V.p, () => !document.querySelector("#hub").hidden, null, 30000);
    const dv = await V.p.evaluate(async () => { const c = window.AB.liveClient(); return { w: await c.rpc("rpg_my_wallet", {}), xp: await c.rpc("rpg_hero_levels", {}) }; });
    check(dv.w.waehrung === 0 && Object.values(dv.xp.xp || {}).filter((x) => x >= 8).length === 3, `Verlierer: keine Währung, ein Drittel XP (${JSON.stringify(dv.xp.xp)})`);
  }
  check(!A.fehler.length && !B.fehler.length, "keine Skriptfehler" + (A.fehler.concat(B.fehler).length ? ": " + A.fehler.concat(B.fehler).slice(0, 3).join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nLIVE-ARENA IN ORDNUNG" : "\nLIVE-ARENA: FEHLER"); process.exit(ok ? 0 : 1);
})();
