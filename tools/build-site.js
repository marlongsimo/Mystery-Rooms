#!/usr/bin/env node
/*
 * CASE UNLOCKED – Seitengenerator für Suchmaschinen und geteilte Links
 *
 * Erzeugt aus portal/games.js (einzige Quelle):
 *   spiele/<id>.html      eine eigene Seite je Spiel (Titel, Beschreibung, Fakten, Bilder, strukturierte Daten)
 *   portal/og/<id>.png    Vorschaubild 1200 × 630 für WhatsApp, Facebook, Google usw. (und portal/og/start.png)
 *   sitemap.xml, robots.txt
 *   index.html            Abschnitte zwischen <!-- SEO:START --> … und <!-- SPIELE:START --> … werden ersetzt
 *
 * Aufruf (im Hauptordner):  node tools/build-site.js
 * Eigene Domain:            SITE_URL=https://www.beispiel.de/ node tools/build-site.js   (oder unten SITE_URL ändern)
 * Vorschaubilder werden mit dem vorinstallierten Chromium (Playwright) gezeichnet; ohne Playwright: NO_OG=1.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SITE_URL = (process.env.SITE_URL || "https://case-unlocked.de/").replace(/\/?$/, "/");
const ROOT = path.resolve(__dirname, "..");
const TODAY = new Date().toISOString().slice(0, 10);

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["portal/games.js", "portal/art.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
const GAMES = ctx.window.MR_GAMES.filter((g) => g.status !== "geplant");
const ART = ctx.window.MR_ART;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DIFF = ["", "Leicht", "Mittel", "Anspruchsvoll", "Schwer"];
const isTable = (g) => g.kind === "tisch";
const dots = (n) => `<span class="dots" aria-label="Schwierigkeit: ${DIFF[n]}">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const artHtml = (g, pre = "") => (g.poster ? `<img src="${pre}${esc(g.poster)}" alt="${esc(g.title)}">` : `<svg viewBox="0 0 400 240" role="img" aria-label="${esc(g.title)}" preserveAspectRatio="xMidYMid slice">${ART[g.art] || ""}</svg>`);
const short = (s, n = 155) => { s = String(s).replace(/\s+/g, " ").trim(); if (s.length <= n) return s; const cut = s.slice(0, n - 1); return cut.slice(0, cut.lastIndexOf(" ")) + "…"; };
const kindLabel = (g) => (isTable(g) ? "Krimidinner" : "Online Escape Room");
const pageTitle = (g) => `${g.title} – ${isTable(g) ? "Krimidinner für zu Hause" : g.subtitle + " · Online Escape Room"} | Case Unlocked`;
const description = (g) => short(`${isTable(g) ? "Kostenloses Krimidinner für " + g.players + ", " + g.duration + ". " : "Kostenloser Online Escape Room, " + g.players + ", " + g.duration + ". "}${g.teaser}`);

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4 15h9.5v-3.5a6.5 6.5 0 0 1 13 0V15H36v21H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="20" cy="11.2" r="2.4" fill="currentColor"/><path d="M18.9 12.6h2.2l1 5.2h-4.2z" fill="currentColor"/><path d="M10 24h20M10 29h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>`;
const CSS_V = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/portal\.css\?v=(\d+)/) || [, "1"])[1];

function footerGames(pre) {
  const group = (label, list) => `<b>${label}</b>` + list.map((g) => `<a href="${pre}spiele/${g.id}.html">${esc(g.title)}</a>`).join("");
  return group("ESCAPE ROOMS", GAMES.filter((g) => !isTable(g))) + group("KRIMIDINNER", GAMES.filter(isTable));
}
function seoHead({ title, desc, url, image, type = "website", jsonld }) {
  return [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="Case Unlocked">`,
    `<meta property="og:locale" content="de_DE">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>`,
  ].map((l) => "  " + l).join("\n");
}

function gamePage(g) {
  const url = `${SITE_URL}spiele/${g.id}.html`, image = `${SITE_URL}portal/og/${g.id}.png`, title = pageTitle(g), desc = description(g);
  const others = GAMES.filter((x) => x.id !== g.id).sort((a, b) => (isTable(a) === isTable(g) ? 0 : 1) - (isTable(b) === isTable(g) ? 0 : 1)).slice(0, 4);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Game", name: g.title, alternateName: g.subtitle, description: g.teaser, url, image, inLanguage: "de", genre: g.categoryLabel, isAccessibleForFree: true, audience: { "@type": "PeopleAudience", suggestedMinAge: Number((g.age.match(/\d+/) || [0])[0]) || undefined }, numberOfPlayers: (() => { const n = (g.players.match(/\d+/g) || []).map(Number); return { "@type": "QuantitativeValue", minValue: Math.min(...n), maxValue: Math.max(...n) }; })(), publisher: { "@type": "Organization", name: "Case Unlocked", url: SITE_URL } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Case Unlocked", item: SITE_URL }, { "@type": "ListItem", position: 2, name: isTable(g) ? "Krimidinner" : "Escape Rooms", item: SITE_URL + (isTable(g) ? "#krimidinner" : "#escape-rooms") }, { "@type": "ListItem", position: 3, name: g.title, item: url }] },
    ],
  };
  const how = isTable(g)
    ? `<h2>So läuft der Abend</h2><ol>
        <li><b>Abend anlegen:</b> Die Spielleitung trägt ${esc(g.players)} ein. Rollen werden zufällig verteilt, die Spielleitung spielt mit.</li>
        <li><b>Codes verschicken:</b> Jede Person öffnet ihr Rollenblatt mit dem eigenen Code: Charakter, Kostümvorschlag, Geheimnis und Ziele.</li>
        <li><b>Am Tisch ermitteln:</b> Losungswörter öffnen Runde für Runde neue Beweise und Erinnerungen. Fehlende Rollen ersetzen Aussagekarten.</li>
        <li><b>Anklage und Auflösung:</b> Alle klagen verdeckt an, dann öffnet die Spielleitung die versiegelte Lösung.</li>
      </ol><p class="note">Mit Handy oder komplett ausgedruckt. Ohne Anmeldung, die Rollen stecken im Code und gehen nicht an einen Server.</p>`
    : `<h2>So spielst du</h2><ol>
        <li><b>Starten:</b> direkt im Browser auf Smartphone, Tablet oder Computer, ohne Anmeldung.</li>
        <li><b>Rätseln:</b> Räume untersuchen, Hinweise kombinieren. Wenn du feststeckst, helfen Hinweise in mehreren Stufen.</li>
        ${/–[2-9]/.test(g.players) ? `<li><b>Gemeinsam:</b> „Gemeinsam spielen“ wählen und den Einladungscode teilen. ${esc(g.players)} spielen jeweils auf dem eigenen Gerät.</li>` : ""}
        <li><b>Pause:</b> Dein Spielstand wird automatisch gespeichert.</li>
      </ol>`;
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0b111c">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
${seoHead({ title, desc, url, image, type: "article", jsonld })}
  <link rel="icon" href="../portal/img/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../portal/portal.css?v=${CSS_V}">
</head>
<body>
  <!-- Erzeugt von tools/build-site.js aus portal/games.js – nicht von Hand bearbeiten. -->
  <header class="header scrolled solid" id="header">
    <a href="../index.html" class="logo" aria-label="Case Unlocked – zur Startseite">${LOGO}<span class="wordmark">CASE <b>UNLOCKED</b></span></a>
    <nav class="nav" id="nav" aria-label="Hauptnavigation">
      <a href="../index.html#escape-rooms">Escape Rooms</a>
      <a href="../index.html#krimidinner">Krimidinner</a>
      <a href="../index.html#so-gehts">So geht’s</a>
      <a href="../ueber-uns.html">Über uns</a>
    </nav>
    <button class="menu-toggle" id="menuToggle" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
  </header>
  <main class="game">
    <p class="crumbs"><a href="../index.html">Case Unlocked</a> › <a href="../index.html#${isTable(g) ? "krimidinner" : "escape-rooms"}">${isTable(g) ? "Krimidinner" : "Escape Rooms"}</a> › ${esc(g.title)}</p>
    <div class="game-top">
      <div class="game-art">${artHtml(g, "../")}</div>
      <div>
        <p class="card-cat">${esc(g.categoryLabel)}</p>
        <h1>${esc(g.title)}</h1>
        <p class="card-sub">${esc(g.subtitle)}</p>
        <p class="game-teaser">${esc(g.teaser)}</p>
        <table class="facts">
          <tr><th>Art</th><td>${kindLabel(g)}</td></tr>
          <tr><th>${isTable(g) ? "Dauer" : "Spielzeit"}</th><td>${esc(g.duration)}</td></tr>
          <tr><th>Schwierigkeit</th><td>${dots(g.difficulty)} ${DIFF[g.difficulty]}</td></tr>
          <tr><th>${isTable(g) ? "Personen" : "Spieler"}</th><td>${esc(g.players)}</td></tr>
          <tr><th>Alter</th><td>${esc(g.age)}</td></tr>
          ${g.rooms ? `<tr><th>Räume</th><td>${g.rooms}${g.puzzles ? ` · ${g.puzzles} Rätsel` : ""}</td></tr>` : ""}
          <tr><th>Kosten</th><td>Kostenlos, ohne Anmeldung</td></tr>
        </table>
        <div class="card-actions"><a class="btn gold big" href="../${esc(g.url)}">${isTable(g) ? "Abend anlegen" : "Jetzt spielen"} <span aria-hidden="true">→</span></a>${isTable(g) ? `<a class="btn ghost" href="../${esc(g.url)}#code">Mein Rollenblatt öffnen</a>` : ""}</div>
      </div>
    </div>
    ${g.shots ? `<ul class="game-shots">${g.shots.map((s) => `<li><img src="../${esc(s.src)}" alt="${esc(g.title)}: ${esc(s.label)}" loading="lazy"><span>${esc(s.label)}</span></li>`).join("")}</ul>` : ""}
    <section class="game-more">${how}</section>
    <section class="game-next"><h2>Weitere Abenteuer</h2><div class="cards">${others.map((o) => `<a class="mini" href="${o.id}.html">${artHtml(o, "../")}<span><b>${esc(o.title)}</b><small>${kindLabel(o)} · ${esc(o.players)}</small></span></a>`).join("")}</div></section>
  </main>
  <footer class="footer">
    <a href="../index.html" class="logo-text">CASE <b>UNLOCKED</b></a>
    <p class="footer-claim">Find the clues. Crack the case.</p>
    <p>Mit Leidenschaft entwickelt. Für alle kostenlos.</p>
    <nav class="footer-games" aria-label="Alle Spiele">${footerGames("../")}</nav>
    <nav class="footer-nav" aria-label="Fußzeile"><a href="../ueber-uns.html">Über uns</a><a href="../impressum.html#kontakt">Kontakt</a><a href="../impressum.html">Impressum</a><a href="../datenschutz.html">Datenschutz</a></nav>
    <p class="footer-small">Keine Cookies, kein Tracking, keine Werbung.</p>
  </footer>
  <script>
    (() => {
      const b = document.getElementById("menuToggle");
      const set = (o) => { document.body.classList.toggle("nav-open", o); b.setAttribute("aria-expanded", String(o)); };
      b.addEventListener("click", () => set(!document.body.classList.contains("nav-open")));
      document.querySelectorAll("#nav a").forEach((a) => a.addEventListener("click", () => set(false)));
    })();
  </script>
</body>
</html>
`;
}

function between(text, start, end, inner) {
  const a = text.indexOf(start), b = text.indexOf(end);
  if (a < 0 || b < a) throw new Error("Marke fehlt: " + start);
  return text.slice(0, a + start.length) + "\n" + inner + "\n  " + text.slice(b);
}

async function ogImages() {
  if (process.env.NO_OG) return console.log("Vorschaubilder übersprungen (NO_OG)");
  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) { return console.log("Playwright fehlt – Vorschaubilder übersprungen"); }
  fs.mkdirSync(path.join(ROOT, "portal/og"), { recursive: true });
  const font = (f) => "file://" + path.join(ROOT, "portal/fonts", f);
  const frame = (bg, kicker, title, sub) => `<!doctype html><html><head><style>
    @font-face{font-family:Cinzel;font-weight:600;src:url(${font("cinzel-latin-600-normal.woff2")})}
    @font-face{font-family:Inter;font-weight:500;src:url(${font("inter-latin-500-normal.woff2")})}
    @font-face{font-family:Slab;font-weight:800;src:url(${font("roboto-slab-latin-800-normal.woff2")})}
    body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;background:#0b111c;font-family:Inter,sans-serif;color:#f1eee7}
    .bg{position:absolute;inset:0}.bg svg,.bg img{width:100%;height:100%;object-fit:cover;display:block}
    .shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b111cf2 0%,#0b111cd0 45%,#0b111c30 100%)}
    .txt{position:absolute;left:70px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center}
    .k{font-size:20px;letter-spacing:.26em;color:#54b8b0;margin-bottom:22px}
    h1{font:600 64px/1.08 Cinzel,serif;margin:0 0 18px;letter-spacing:.02em}
    .s{font-size:26px;color:#e8cb90}
    .brand{position:absolute;right:56px;bottom:44px;font:800 26px Slab,serif;letter-spacing:.08em}.brand b{color:#d5ad62}
    .line{position:absolute;left:0;right:0;bottom:0;height:8px;background:#d5ad62}
  </style></head><body><div class="bg">${bg}</div><div class="shade"></div>
  <div class="txt"><div class="k">${kicker}</div><h1>${title}</h1><div class="s">${sub}</div></div><div class="brand">CASE <b>UNLOCKED</b></div><div class="line"></div></body></html>`;
  const bgOf = (g) => (g.poster ? `<img src="file://${path.join(ROOT, g.poster)}">` : `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">${ART[g.art] || ""}</svg>`);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const shoot = async (html, file) => { const tmp = path.join(ROOT, "portal/og/.tmp.html"); fs.writeFileSync(tmp, html); await p.goto("file://" + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120); await p.screenshot({ path: path.join(ROOT, "portal/og", file), type: "png" }); fs.unlinkSync(tmp); };
  for (const g of GAMES) await shoot(frame(bgOf(g), esc(kindLabel(g).toUpperCase() + " · KOSTENLOS"), esc(g.title), esc(`${g.subtitle} · ${g.players} · ${g.duration}`)), g.id + ".png");
  const logo = "file://" + path.join(ROOT, "portal/img/case-unlocked.jpg");
  await shoot(`<!doctype html><html><head><style>body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0b0907;position:relative}
    .blur{position:absolute;inset:-40px;background:url(${logo}) center/cover;filter:blur(28px) brightness(.45)}
    img{position:absolute;left:50%;top:0;height:630px;transform:translateX(-50%);box-shadow:0 0 80px #000}</style></head>
    <body><div class="blur"></div><img src="${logo}"></body></html>`, "start.png");
  await b.close();
  console.log("Vorschaubilder:", GAMES.length + 1);
}

(async () => {
  fs.mkdirSync(path.join(ROOT, "spiele"), { recursive: true });
  // alte Seiten entfernen, deren Spiel es nicht mehr gibt
  for (const f of fs.readdirSync(path.join(ROOT, "spiele"))) if (f.endsWith(".html") && !GAMES.some((g) => g.id + ".html" === f)) fs.unlinkSync(path.join(ROOT, "spiele", f));
  for (const g of GAMES) fs.writeFileSync(path.join(ROOT, "spiele", g.id + ".html"), gamePage(g));
  console.log("Spielseiten:", GAMES.length);

  // Startseite: Kopf (kanonische Adresse, Vorschaubild, strukturierte Daten) und Spiele-Links in der Fußzeile
  let idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const title = (idx.match(/<title>([^<]*)<\/title>/) || [, "Case Unlocked"])[1].replace(/&amp;/g, "&");
  const desc = (idx.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1];
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: "Case Unlocked", url: SITE_URL, inLanguage: "de", description: desc },
    { "@type": "ItemList", name: "Escape Rooms und Krimidinner", itemListElement: GAMES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}spiele/${g.id}.html`, name: g.title })) },
  ] };
  idx = between(idx, "<!-- SEO:START (erzeugt von tools/build-site.js) -->", "<!-- SEO:END -->", seoHead({ title, desc, url: SITE_URL, image: SITE_URL + "portal/og/start.png", jsonld }));
  idx = between(idx, "<!-- SPIELE:START (erzeugt von tools/build-site.js) -->", "<!-- SPIELE:END -->", "      " + footerGames(""));
  fs.writeFileSync(path.join(ROOT, "index.html"), idx);

  // Sitemap und robots.txt
  const urls = [["", "1.0", "weekly"]].concat(GAMES.map((g) => [`spiele/${g.id}.html`, "0.8", "monthly"]), [["ueber-uns.html", "0.4", "yearly"], ["impressum.html", "0.1", "yearly"], ["datenschutz.html", "0.1", "yearly"]]);
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr, ch]) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>${ch}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
  console.log("sitemap.xml:", urls.length, "Adressen ·", SITE_URL);

  await ogImages();
})().catch((e) => { console.error(e); process.exit(1); });
