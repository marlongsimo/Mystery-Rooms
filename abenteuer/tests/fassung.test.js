/*
 * Mythara – veraltete Fassung erkennen: Liegt online schon eine neuere Fassung (andere Versionsnummern der Dateien),
 * lädt das Spiel sich einmal frisch (am Zwischenspeicher vorbei). Ohne Unterschied passiert nichts; es gibt keine Schleife.
 * Aufruf: node abenteuer/tests/fassung.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch(); console.log("Veraltete Fassung erkennen");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  // 1) gleiche Fassung: kein Neuladen
  { const p = await (await b.newContext()).newPage(); const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); let frisch = 0; p.on("request", (r) => { if (/[?&]frisch=/.test(r.url())) frisch++; });
    await p.goto(URL); await p.waitForFunction(() => window.MYTHARA && window.MYTHARA.neuLaden); await p.waitForTimeout(5500);
    check(frisch === 1 && !/[?&]neu=/.test(p.url()), `Gleiche Fassung: Das Spiel fragt einmal nach (${frisch}×) und lädt nicht neu`);
    check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : "")); await p.close(); }
  // 2) online liegt eine neuere Fassung: einmal frisch laden, danach Ruhe
  { const ctx = await b.newContext(), p = await ctx.newPage(); let frisch = 0, neu = 0;
    await p.route(/index\.html\?(.*&)?frisch=/, (r) => { frisch++; r.fulfill({ status: 200, contentType: "text/html", body: html.replace(/regeln\.js\?v=(\d+)/, (m, n) => "regeln.js?v=" + (Number(n) + 1)) }); });
    p.on("framenavigated", (f) => { if (f === p.mainFrame() && /[?&]neu=/.test(f.url())) neu++; });
    await p.goto(URL); await p.waitForFunction(() => window.MYTHARA && window.MYTHARA.neuLaden);
    const geladen = await p.waitForURL(/[?&]neu=\d+/, { timeout: 12000 }).then(() => true, () => false);
    check(geladen && /schnell/.test(p.url()), "Online liegt eine neuere Fassung: Das Spiel lädt sich von selbst frisch (am Zwischenspeicher vorbei, die Adresse bleibt sonst gleich)");
    await p.waitForFunction(() => window.MYTHARA && window.MYTHARA.neuLaden); await p.waitForTimeout(6500);
    const hinweis = await p.evaluate(() => [...document.querySelectorAll(".toast, [role=status]")].map((e) => e.textContent).join(" | "));
    check(neu === 1, `Bleibt die Seite trotzdem alt, lädt sie kein zweites Mal (${neu}× neu geladen) – stattdessen ein Hinweis`);
    await ctx.close(); }
  await b.close(); console.log(ok ? "\nFASSUNG IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
