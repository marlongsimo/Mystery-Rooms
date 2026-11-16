/*
 * Mythara – Fähigkeiten ohne Zielwahl (Spurt, Bewahren, Trank …): Antippen wählt nur aus und erklärt, erst „Bestätigen“ löst aus.
 * Am großen Bildschirm (Hinweiszeile) und am Handy (Infozeile über den Kacheln).
 * Aufruf: node abenteuer/tests/bestaetigen.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const BASIS = "http://localhost:8765/abenteuer/index.html?testlauf&schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
async function kampf(b, handy) {
  const p = await (await b.newContext(handy ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
  await p.goto(BASIS); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
  await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true;
    window.AB.kampfStarten({ figuren: ["wanderheiler", "schildwaechter", "elementarist"], stufenListe: [6, 6, 6], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
  await p.waitForSelector("#karte .fig");
  return { p, fehler };
}
/** Bis ein bestimmter Held am Zug ist (Züge der anderen beenden) */
async function bis(p, fid) { for (let i = 0; i < 60; i++) { const w = await p.evaluate(() => { const a = window.AB.R.aktiv(window.AB.st); return a.seite === "spieler" && a.tp > 0 && document.querySelector("#ende-zug") ? a.fid : null; }); if (w === fid) return true;
  if (w) await p.evaluate(() => document.querySelector("#ende-zug").click()); await p.waitForTimeout(250); } return false; }
const lage = (p) => p.evaluate(() => { const st = window.AB.st, h = document.querySelector("#hinweis"); return { aktion: st.zug.aktion, log: st.log.length, gewaehlt: (document.querySelector("#aktionen .akt.gewaehlt") || { dataset: {} }).dataset.a || null, text: h.textContent.replace(/\s+/g, " "), ok: Boolean(document.querySelector("#bestaetigen")), ab: Boolean(document.querySelector("#wahl-ab")), bewegung: st.zug.bewegung, gruen: document.querySelectorAll("#karte .rw.hilfe").length }; });
(async () => {
  const b = await chromium.launch();
  console.log("Fähigkeiten ohne Zielwahl: erst erklären, dann bestätigen");
  const { p, fehler } = await kampf(b, false);
  await bis(p, "schildwaechter");
  const v = await lage(p);
  await p.click('#aktionen .akt[data-a="spurt_aktion"]'); let n = await lage(p);
  check(n.gewaehlt === "spurt_aktion" && n.aktion === true && n.log === v.log && n.bewegung === v.bewegung, "Spurt antippen: gewählt, aber noch nicht ausgelöst");
  check(/Spurt:/.test(n.text) && /noch einmal so weit laufen/.test(n.text) && n.ok && n.ab, "Oben steht die Erklärung, darunter „Bestätigen“ und „Abbrechen“");
  await p.click("#wahl-ab"); n = await lage(p);
  check(n.gewaehlt === null && n.aktion === true && n.log === v.log && !n.ok, "„Abbrechen“: nichts passiert, die Aktion bleibt frei");
  await p.click('#aktionen .akt[data-a="spurt_aktion"]'); await p.click('#aktionen .akt[data-a="spurt_aktion"]'); n = await lage(p);
  check(n.gewaehlt === null && n.aktion === true, "Noch einmal auf die Fähigkeit tippen bricht ebenfalls ab");
  await p.click('#aktionen .akt[data-a="spurt_aktion"]'); await p.click("#bestaetigen"); n = await lage(p);
  check(n.aktion === false && n.bewegung > v.bewegung && n.gewaehlt === null && !n.ok, `„Bestätigen“ löst den Spurt aus (Bewegung ${v.bewegung} → ${n.bewegung}, Aktion verbraucht)`);
  // Bewahren: vor dem Bestätigen ist der Wirkungsbereich grün
  await bis(p, "wanderheiler");
  await p.evaluate(() => { for (const f of window.AB.st.figuren) if (f.seite === "spieler") f.tp = Math.max(1, Math.floor(f.tpMax / 3)); });
  await p.evaluate(() => document.querySelector("#ende-zug").click()); await bis(p, "wanderheiler"); // neu zeichnen mit den Verletzten
  const tp0 = await p.evaluate(() => window.AB.st.figuren.filter((f) => f.seite === "spieler").reduce((a, f) => a + f.tp, 0));
  const kn = await p.$('#aktionen .akt[data-a="bewahren"]:not([disabled])');
  if (kn) { await kn.click(); n = await lage(p);
    check(n.gewaehlt === "bewahren" && n.ok && /Bewahren:/.test(n.text) && n.gruen > 0 && await p.evaluate((t) => window.AB.st.figuren.filter((f) => f.seite === "spieler").reduce((a, f) => a + f.tp, 0) === t, tp0), `Bewahren antippen: Erklärung, ${n.gruen} grüne Felder zeigen den Wirkungsbereich, geheilt ist noch niemand`);
    await p.click("#bestaetigen");
    check(await p.evaluate((t) => window.AB.st.figuren.filter((f) => f.seite === "spieler").reduce((a, f) => a + f.tp, 0) > t, tp0), "„Bestätigen“: Jetzt wird geheilt");
  } else check(false, "Bewahren ist nicht verfügbar (Testaufbau)");
  // Aktionen mit Zielwahl bleiben, wie sie waren
  await bis(p, "schildwaechter");
  await p.click('#aktionen .akt[data-a="langschwert"]'); n = await lage(p);
  check(n.gewaehlt === "langschwert" && !n.ok, "Angriffe mit Zielwahl: weiterhin Ziel antippen, kein „Bestätigen“");
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Handy
  const H = await kampf(b, true), q = H.p; await bis(q, "schildwaechter"); await q.waitForSelector('.kh-k[data-kh="spurt_aktion"]');
  const hv = await q.evaluate(() => ({ aktion: window.AB.st.zug.aktion, bew: window.AB.st.zug.bewegung }));
  await q.evaluate(() => document.querySelector('.kh-k[data-kh="spurt_aktion"]').scrollIntoView({ block: "nearest" })); await q.tap('.kh-k[data-kh="spurt_aktion"]'); await q.waitForSelector("#kh-ok");
  let h = await q.evaluate(() => ({ aktion: window.AB.st.zug.aktion, info: document.querySelector(".kh-info").textContent.replace(/\s+/g, " "), ok: Boolean(document.querySelector("#kh-ok")), ab: Boolean(document.querySelector("#kh-ab")), breit: document.documentElement.scrollWidth <= innerWidth }));
  check(h.aktion === true && /Spurt/.test(h.info) && /noch einmal so weit laufen/.test(h.info) && h.ok && h.ab && h.breit, "Handy: Kachel antippen zeigt die Erklärung mit „Bestätigen“ und „Abbrechen“ – ausgelöst ist noch nichts");
  if (process.env.SHOT_DIR) await q.screenshot({ path: process.env.SHOT_DIR + "/bestaetigen-handy.png" });
  await q.tap("#kh-ab"); await q.waitForTimeout(200);
  check(await q.evaluate(() => window.AB.st.zug.aktion === true && !document.querySelector("#kh-ok") && !document.querySelector(".kh-k.an")), "Handy: „Abbrechen“ hebt die Wahl auf");
  await q.tap('.kh-k[data-kh="spurt_aktion"]'); await q.waitForSelector("#kh-ok"); await q.tap("#kh-ok"); await q.waitForTimeout(300);
  check(await q.evaluate((v) => window.AB.st.zug.aktion === false && window.AB.st.zug.bewegung > v.bew, hv), "Handy: „Bestätigen“ löst aus");
  check(!H.fehler.length, "keine Skriptfehler am Handy" + (H.fehler.length ? ": " + H.fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nBESTÄTIGEN IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
