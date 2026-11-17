/*
 * Mythara – Umzug auf mythara-dungeon.de: Wer das Spiel über Case Unlocked öffnet, wird zur neuen Adresse geleitet
 * (mit Seite und Parametern), aber nur, wenn sie über https antwortet. Unter der neuen Adresse passiert nichts.
 * Dazu: keine Kopfzeile auf der Startseite, neues Symbol für den Startbildschirm.
 * Aufruf: node abenteuer/tests/umzug.test.js
 */
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
const WURZEL = path.join(__dirname, ".."); let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const TYP = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", svg: "image/svg+xml", woff2: "font/woff2", webmanifest: "application/manifest+json", jpg: "image/jpeg" };
const datei = (route, teil) => { const p = path.join(WURZEL, decodeURIComponent(teil.split("?")[0].split("#")[0]) || "index.html"); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404, body: "" }); route.fulfill({ status: 200, contentType: TYP[p.split(".").pop()] || "application/octet-stream", body: fs.readFileSync(p) }); };
(async () => {
  const b = await chromium.launch();
  async function seite(neuDa) { const c = await b.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: "block" }); const p = await c.newPage();
    await c.route("https://case-unlocked.de/abenteuer/**", (r) => datei(r, new URL(r.request().url()).pathname.replace("/abenteuer/", "")));
    await c.route("https://mythara-dungeon.de/**", (r) => (neuDa ? datei(r, new URL(r.request().url()).pathname.slice(1) || "index.html") : r.abort("connectionrefused")));
    await c.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    return { c, p }; }
  console.log("Umzug");
  { const { c, p } = await seite(true); await p.goto("https://case-unlocked.de/abenteuer/index.html?x=1#y"); await p.waitForURL(/mythara-dungeon\.de/, { timeout: 15000 }).catch(() => {});
    check(p.url() === "https://mythara-dungeon.de/index.html?x=1#y", "Case Unlocked leitet zur neuen Adresse weiter, Seite und Parameter bleiben erhalten: " + p.url());
    await p.waitForTimeout(1500); check(/mythara-dungeon\.de\/index\.html/.test(p.url()), "Unter der neuen Adresse wird nicht weitergeleitet"); await c.close(); }
  { const { c, p } = await seite(true); await p.goto("https://case-unlocked.de/abenteuer/handy.html?code=ABEN-123456"); await p.waitForURL(/mythara-dungeon\.de/, { timeout: 15000 }).catch(() => {});
    check(p.url() === "https://mythara-dungeon.de/handy.html?code=ABEN-123456", "Auch Handy-Links mit Einladungscode kommen an: " + p.url()); await c.close(); }
  { const { c, p } = await seite(false); await p.goto("https://case-unlocked.de/abenteuer/index.html"); await p.waitForTimeout(2500);
    check(/case-unlocked\.de\/abenteuer\/index\.html/.test(p.url()) && await p.evaluate(() => Boolean(window.MYTHARA)), "Antwortet die neue Adresse nicht sicher, bleibt das Spiel auf Case Unlocked spielbar"); await c.close(); }
  { const { c, p } = await seite(true); await p.goto("https://mythara-dungeon.de/index.html"); await p.waitForTimeout(2000);
    const r = await p.evaluate(() => { const h = document.querySelector("header.top"); return { kopf: h ? getComputedStyle(h).display : "fehlt", zurueck: Boolean(document.querySelector("header.top .back")), apple: document.querySelector('link[rel="apple-touch-icon"]').getAttribute("href"), text: document.body.innerText }; });
    check(r.kopf === "none" && !r.zurueck && !/← Case Unlocked/.test(r.text), "Auf der Startseite gibt es keine Kopfzeile und keinen Link „← Case Unlocked“ mehr");
    const man = JSON.parse(fs.readFileSync(path.join(WURZEL, "manifest.webmanifest"), "utf8"));
    check([r.apple, ...man.icons.map((i) => i.src)].every((s) => /mythara-/.test(s) && fs.existsSync(path.join(WURZEL, s))), "Das neue Symbol ist für iPhone und Android hinterlegt, alle Dateien sind da");
    await c.close(); }
  await b.close(); console.log(ok ? "\nUMZUG IN ORDNUNG" : "\nUMZUG: FEHLER"); process.exit(ok ? 0 : 1);
})();
