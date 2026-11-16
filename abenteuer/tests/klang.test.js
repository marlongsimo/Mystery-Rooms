/*
 * Mythara – Klänge im Kampf (js/klang.js): Dateien laden, Würfel und Treffer im echten Kampf, Schalter und Regler.
 * Geprüft wird, dass die Klänge ausgelöst werden – nicht, wie sie klingen.
 * Aufruf: node abenteuer/tests/klang.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const BASIS = "http://localhost:8765/abenteuer/index.html?testlauf";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(), fehler = [], fehlt = [];
  p.on("pageerror", (e) => fehler.push(e.message)); p.on("response", (r) => { if (/ton\/fx\//.test(r.url()) && !r.ok()) fehlt.push(r.url()); });
  console.log("Klänge im Kampf");
  await p.goto(BASIS); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
  check(await p.evaluate(() => Boolean(window.ABKLANG) && window.ABKLANG.bereit() === 0), "Vor dem ersten Kampf ist nichts geladen");
  await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true;
    window.AB.kampfStarten({ figuren: ["elementarist", "schildwaechter", "lichtbringer"], stufenListe: [10, 5, 5], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
  await p.waitForSelector("#karte .fig");
  await p.waitForFunction(() => window.ABKLANG.bereit() === 8, null, { timeout: 15000 }).catch(() => {});
  check(await p.evaluate(() => window.ABKLANG.bereit()) === 8 && !fehlt.length, "Mit dem Kampf werden alle acht Dateien geladen und entschlüsselt" + (fehlt.length ? " – fehlt: " + fehlt.join(", ") : ""));
  check(await p.evaluate(() => window.ABKLANG.zustand()) === "running", "Nach dem ersten Klick darf Ton spielen");
  // Züge beenden, bis die Gegner würfeln und treffen
  const namen = () => p.evaluate(() => window.ABKLANG.gespielt.map((x) => x.name));
  for (let i = 0; i < 40; i++) { const n = await namen(); if (n.includes("wuerfel") && n.includes("hieb")) break;
    if (await p.evaluate(() => Boolean(window.AB.st.ende))) break;
    const knopf = await p.$("#ende-zug"); if (knopf && await knopf.isVisible() && await knopf.isEnabled()) await knopf.click().catch(() => {}); await p.waitForTimeout(700); }
  const n = await namen();
  check(n.includes("wuerfel"), "Im Kampf: Der Würfel ist zu hören (" + n.filter((x) => x === "wuerfel").length + "-mal)");
  check(n.includes("hieb"), "Im Kampf: Ein Treffer ist zu hören (" + n.filter((x) => x === "hieb").length + "-mal)");
  const fassungen = await p.evaluate(() => { const w = window.ABKLANG.gespielt.filter((x) => x.name === "wuerfel").map((x) => x.d); return { n: w.length, gleich: w.some((d, i) => i && d === w[i - 1]) }; });
  check(fassungen.n < 2 || !fassungen.gleich, "Der Würfel wechselt die Fassung (nie zweimal dieselbe hintereinander)");
  // jeder Klang einzeln, Mindestabstand, Schalter und Regler
  await p.waitForTimeout(600);
  const einzeln = await p.evaluate(() => ["wuerfel", "hieb", "zauber", "heil", "schild"].map((k) => window.ABKLANG.spiel(k)));
  check(einzeln.every(Boolean), "Würfel, Hieb, Zauber, Heilung und Schild lassen sich abspielen");
  check(await p.evaluate(() => window.ABKLANG.spiel("heil")) === false, "Derselbe Klang zweimal im selben Augenblick: nur einmal (kein Klangbrei bei vielen Zielen)");
  await p.waitForTimeout(600);
  check(await p.evaluate(() => { localStorage.setItem("ab_ton", "aus"); const r = window.ABKLANG.spiel("heil"); localStorage.setItem("ab_ton", "an"); return r; }) === false, "Schalter „Ton“ aus: kein Klang");
  check(await p.evaluate(() => { window.ABKLANG.setze(0); const r = window.ABKLANG.spiel("heil"); window.ABKLANG.setze(0.7); return r; }) === false, "Regler „Klänge“ auf 0: kein Klang");
  check(await p.evaluate(() => { const a = [...document.querySelectorAll("#einst-panel .musik-regler span")].map((x) => x.textContent); return a.join(",") === "Musik,Klänge" && localStorage.getItem("ab_klang") === "0.7"; }), "Einstellungen: Regler „Klänge“ steht unter „Musik“ und wird gemerkt");
  check(await p.evaluate(() => window.ABKLANG.spiel("gibtsnicht")) === false, "Unbekannter Klang: nichts passiert");
  check(!fehler.length, "Keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // ?schnell (Tests, Effekte aus): kein Klang im Kampf
  const q = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await q.goto(BASIS + "&schnell"); await q.click("#my-gast-start"); await q.waitForSelector(".dorf-ort");
  await q.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN);
    window.AB.kampfStarten({ figuren: ["elementarist", "schildwaechter", "lichtbringer"], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
  await q.waitForSelector("#karte .fig"); await q.waitForTimeout(800);
  check(await q.evaluate(() => window.ABKLANG.bereit() === 0 && window.ABKLANG.gespielt.length === 0), "Mit abgeschalteten Effekten (?schnell) bleibt der Kampf still und lädt nichts");
  await b.close();
  console.log(ok ? "\nAlles in Ordnung." : "\nFEHLER."); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
