/*
 * Mythara – Arena-Serverkampf gegen die ECHTE Datenbank und die ECHTE Edge Function „arena“ (Migration 015):
 * zwei neue Test-Konten, Team festlegen, Server-Suche, Kampf bis zum Ende, Belohnung.
 * Testkonten heißen Test_xxxxxx und bleiben bestehen. Beide Seiten beenden nur ihre Züge; der Kampf endet nach Punkten.
 * Aufruf: node abenteuer/tests/live-arena-server.test.js   (Webserver auf Port 8765; dauert mehrere Minuten)
 */
const { chromium } = require("playwright");
const URL = "http://localhost:8765/abenteuer/index.html?schnell&arena=server";
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
  // Aufrufe der Edge Function mitschreiben: Status und Dauer
  const fn = { n: 0, fehler: [], ms: [] };
  for (const S of [A, B]) S.p.on("requestfinished", async (rq) => { if (!/\/functions\/v1\/arena/.test(rq.url()) || rq.method() !== "POST") return; const r = await rq.response(); fn.n++; const t = rq.timing(); if (t && t.responseEnd > 0) fn.ms.push(Math.round(t.responseEnd));
    if (r && r.status() !== 200) { let txt = ""; try { txt = (await r.text()).slice(0, 200); } catch (e) { /* weg */ } fn.fehler.push(r.status() + " " + txt); } });
  for (const S of [A, B]) S.p.on("requestfailed", (rq) => { if (/\/functions\/v1\/arena/.test(rq.url())) fn.fehler.push("fehlgeschlagen: " + (rq.failure() || {}).errorText); });
  // Team festlegen (die drei Helden des neuen Kontos), dann suchen
  for (const S of [A, B]) {
    await S.p.click('.dorf-ort[data-hub="arena"]');
    const da = await warte(S.p, () => document.querySelector("#arena-team-aendern"), null, 30000);
    if (S === A) check(da && await S.p.evaluate(() => !document.querySelector("#arena-team-aendern").disabled), "Echte Datenbank: neue Arena mit „Mein Team“ (Migration 014 läuft)");
    await S.p.click("#arena-team-aendern"); await S.p.waitForSelector("[data-arena-held]");
    const h = await S.p.evaluate(() => [...document.querySelectorAll("[data-arena-held]")].map((x) => x.dataset.arenaHeld));
    for (const f of h) await S.p.click(`[data-arena-held="${f}"]`);
    await S.p.click("#arena-wahl-ok");
    const gespeichert = await warte(S.p, () => document.querySelector('[data-arena-art="normal"]') && !document.querySelector('[data-arena-art="normal"]').disabled, null, 30000);
    if (S === A) check(gespeichert, "Team in der echten Datenbank gespeichert; die drei Spielarten stehen zur Wahl");
  }
  // Privater Kampf zuerst (kurz): Freundschaft schließen, einladen, annehmen, Modus prüfen, abbrechen
  const ruf = (S, n, a) => S.p.evaluate(async ([n, a]) => { const c = window.AB.liveClient(); await c.ensureUser(); const { data, error } = await c.db.rpc(n, a); return error ? { FEHLER: error.message } : data; }, [n, a]);
  const f1 = await ruf(A, "rpg_request_friend", { p_handle: B.name }), f2 = await ruf(B, "rpg_answer_friend", { p_handle: A.name, p_accept: true });
  check(!(f1 && f1.FEHLER) && !(f2 && f2.FEHLER), "Die beiden Testkonten sind befreundet" + ((f1 && f1.FEHLER) || (f2 && f2.FEHLER) ? " · " + JSON.stringify([f1, f2]) : ""));
  await A.p.click("#arena-privat"); const liste = await warte(A.p, (n) => document.querySelector(`[data-privat-freund="${n}"]`), B.name, 30000);
  check(liste, "Privater Kampf: Die Freundesliste aus der echten Datenbank zeigt den Freund");
  if (liste) {
    await A.p.click('[data-privat-modus="horde"]'); await A.p.click(`[data-privat-freund="${B.name}"]`);
    const wartet = await warte(A.p, () => /Warte auf/.test((document.querySelector(".arena-suche") || {}).textContent || ""), null, 20000);
    check(wartet, "Einladung verschickt (rpg_arena_invite)" + (wartet ? "" : " · " + await A.p.evaluate(() => (document.querySelector("[data-arena] .fb") || {}).textContent || "")));
    const einl = await warte(B.p, (n) => { const e = document.querySelector(".arena-einladung"); return e && e.textContent.includes(n) && /Die Horde/.test(e.textContent); }, A.name, 25000);
    check(einl, "Der Freund sieht die Einladung mit dem gewählten Modus (Die Horde)");
    if (einl) { await B.p.click("[data-einl-ja]");
      const da = (await warte(A.p, () => document.querySelector(".arena-gegenueber"), null, 30000)) && (await warte(B.p, () => document.querySelector(".arena-gegenueber"), null, 30000));
      const txt = da ? await warte(B.p, () => /Privater Kampf · ohne Wertung/.test((document.querySelector("#arena-modus-text") || {}).textContent || "") && /Die Horde/.test(document.querySelector("#arena-modus-text").textContent), null, 20000) : false;
      check(da && txt, "Annehmen: Beide in der Aufstellung, Modus „Die Horde“, gekennzeichnet als privater Kampf ohne Wertung");
      await A.p.click("#arena-abbrechen"); await warte(A.p, () => document.querySelector(".arena-arten"), null, 30000);
      await B.p.waitForTimeout(3000); await B.p.click('.dorf-ort[data-hub="dorf"], [data-hub="dorf"]').catch(() => {}); await B.p.goto(URL); await warte(B.p, () => document.querySelector('.dorf-ort[data-hub="arena"]'), null, 30000); await B.p.click('.dorf-ort[data-hub="arena"]');
      await A.p.goto(URL); await warte(A.p, () => document.querySelector('.dorf-ort[data-hub="arena"]'), null, 30000); await A.p.click('.dorf-ort[data-hub="arena"]');
    } else { await A.p.click("#arena-suche-ab").catch(() => {}); }
  }
  // Normal: Beide suchen – gespielt wird ein Duell
  for (const S of [A, B]) { const da = await warte(S.p, () => document.querySelector('[data-arena-art="normal"]') && !document.querySelector('[data-arena-art="normal"]').disabled, null, 40000); if (!da) console.log("   (Übersicht fehlt bei " + S.name + ")"); await S.p.click('[data-arena-art="normal"]'); }
  const auf = (await warte(A.p, () => document.querySelector(".arena-gegenueber"), null, 40000)) && (await warte(B.p, () => document.querySelector(".arena-gegenueber"), null, 40000));
  const fehlerText = async (S) => S.p.evaluate(() => { const f = document.querySelector("[data-arena] .fb"); return f ? f.textContent : ""; });
  check(auf, "Normal-Suche (rpg_arena_queue): Beide werden verbunden und sehen die Aufstellung" + (auf ? "" : " · " + (await fehlerText(A)) + " | " + (await fehlerText(B))));
  const modusDa = auf ? await warte(A.p, () => document.querySelector("#arena-modus-text h3"), null, 20000) : false;
  const modus = modusDa ? await A.p.evaluate(() => document.querySelector("#arena-modus-text h3").textContent) : "";
  check(modus === "Duell", "Normal: Der Modus ist Duell (angezeigt: " + (modus || "?") + ")");
  const zaehlt = await warte(A.p, () => /beginnt in \d+|Der Kampf beginnt/.test((document.querySelector("#arena-status") || {}).textContent || ""), null, 20000);
  check(zaehlt, "rpg_arena_fight antwortet: Es ist ein Serverkampf, der Countdown läuft" + (zaehlt ? "" : " · Status: " + await A.p.evaluate(() => (document.querySelector("#arena-status") || {}).textContent)));
  const imKampf = (await warte(A.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 60000)) && (await warte(B.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 30000));
  check(imKampf, "Die echte Edge Function startet den Kampf; beide Geräte zeigen ihn" + (imKampf ? "" : " · Status: " + await A.p.evaluate(() => (document.querySelector("#arena-status") || {}).textContent) + " · Function: " + fn.fehler.join(" | ")));
  if (imKampf) {
    const sicht = await B.p.evaluate(() => ({ rs: window.AB.st.rs, figuren: window.AB.st.figuren.length, monster: window.AB.st.figuren.filter((f) => !f.team).length, runden: window.AB.st.arena.runden }));
    check(sicht.rs === undefined && sicht.figuren >= 6 && sicht.monster === 0, "Duell auf dem Server: nur die Helden beider Teams (mit Begleitern " + sicht.figuren + " Figuren), keine Monster; das Gerät bekommt keinen Zufallsstand");
    // Wer Ersteller ist, entscheidet die Datenbank (wer zuerst in der Warteschlange stand): die eigene Seite vom Gerät lesen
    const start = Date.now(), seite = new Map(); for (const S of [A, B]) seite.set(S, await S.p.evaluate(() => window.ARENA.zustand().match.seite)); let zuege = 0, letzter = Date.now();
    check(seite.get(A) + seite.get(B) === 3, "Die beiden Geräte stehen auf verschiedenen Seiten");
    const lage = (S) => S.p.evaluate((seite) => { const e = document.querySelector("#arena-ende"); if (e && !e.hidden) return { ende: true }; const st = window.AB.st; if (!st || st.ende) return { warten: true };
      const a = window.AB.R.aktiv(st), k = document.querySelector("#ende-zug"); return { dran: window.AB.R.teamVon(st, a) === seite && a.tp > 0 && Boolean(k) && !k.disabled, id: a.id + ":" + st.runde, runde: st.runde }; }, seite.get(S));
    const getan = new Map(); let runde = 0;
    while (Date.now() - start < 9 * 60000) {
      let fertig = 0;
      for (const S of [A, B]) { const l = await lage(S); if (l.ende) { fertig++; continue; } if (l.runde) runde = l.runde;
        if (l.dran && getan.get(S) !== l.id) { getan.set(S, l.id); await S.p.click("#ende-zug").catch(() => {}); zuege++; letzter = Date.now(); } }
      if (fertig === 2) break;
      if (Date.now() - letzter > 20000) getan.clear(); // hängt etwas (verlorene Antwort), noch einmal versuchen
      await A.p.waitForTimeout(250);
    }
    console.log(`  ${zuege} Züge in ${Math.round((Date.now() - start) / 1000)} s, zuletzt Runde ${runde}; Function: ${fn.n} Aufrufe, mittlere Antwortzeit ${fn.ms.length ? Math.round(fn.ms.reduce((a, x) => a + x, 0) / fn.ms.length) : "?"} ms, längste ${fn.ms.length ? Math.max(...fn.ms) : "?"} ms`);
    const eA = await warte(A.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && /Zur Startseite|Helden wählen/.test(e.textContent); }, null, 40000);
    const eB = await warte(B.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && /Zur Startseite|Helden wählen/.test(e.textContent); }, null, 40000);
    const tA = eA ? (await A.p.textContent("#arena-ende")).replace(/\s+/g, " ") : "", tB = eB ? (await B.p.textContent("#arena-ende")).replace(/\s+/g, " ") : "";
    console.log("  A:", tA.slice(0, 200)); console.log("  B:", tB.slice(0, 200));
    check(eA && eB, "Der Kampf endet; beide Geräte zeigen das Ergebnis aus der Datenbank");
    check(/Sieg|Niederlage/.test(tA) && /Sieg|Niederlage/.test(tB) && /Sieg/.test(tA) !== /Sieg/.test(tB) && !/Abgebrochen|ohne Wertung|nicht gemeldet/.test(tA + tB), "Gewertet: ein Sieg, eine Niederlage – eingetragen vom Server (rpg_arena_srv_end)");
    check(zuege > 20, "Beide Seiten haben gezogen (" + zuege + " Züge)");
    check(/XP/.test(tA) && /XP/.test(tB), "Belohnungsbuchung: Beide bekommen Erfahrung für ihre Helden");
    check(/\+\d+ Seelensplitter/.test(/Sieg/.test(tA) ? tA : tB), "Der Sieger bekommt Seelensplitter");
  }
  check(fn.fehler.length === 0, "Alle Aufrufe der Edge Function wurden mit Status 200 beantwortet" + (fn.fehler.length ? ": " + [...new Set(fn.fehler)].slice(0, 4).join(" | ") : ` (${fn.n} Aufrufe)`));
  for (const S of [A, B]) check(S.fehler.length === 0, `keine Skriptfehler bei ${S.name}${S.fehler.length ? ": " + S.fehler.slice(0, 3).join(" | ") : ""}`);
  await b.close();
  console.log(ok ? "\nLIVE-ARENA-SERVER IN ORDNUNG" : "\nLIVE-ARENA-SERVER: FEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
