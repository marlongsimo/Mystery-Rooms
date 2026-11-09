/* MYSTERY ROOMS – Startseite: Hauptabenteuer, Welten, Sammlung, Detailansicht */
(() => {
  "use strict";
  const games = window.MR_GAMES || [];
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DIFF = ["", "Leicht", "Mittel", "Anspruchsvoll", "Schwer"];
  const playable = (g) => g.status !== "geplant";
  // Bildpfade für CSS-Hintergründe vollständig angeben (sonst löst das Stylesheet sie relativ zu portal/ auf)
  const abs = (u) => new URL(u, document.baseURI).href;

  /* Titelgrafiken (SVG, 400 × 240) – für Spiele ohne eigenes Bild */
  const ART = {
    hotel: `<rect width="400" height="240" fill="#0b0d14"/><polygon points="110,240 110,70 200,38 290,70 290,240" fill="#17130f" stroke="#3a2e24"/><text x="200" y="64" text-anchor="middle" fill="#d5ad62" font-family="Cinzel,serif" font-size="15" letter-spacing="5">NOCTURNE</text><circle cx="257" cy="158" r="34" fill="#f0c27a" opacity=".18"/><rect x="244" y="140" width="26" height="36" fill="#e9b96f"/>`,
    krimi: `<rect width="400" height="240" fill="#0d1018"/><rect x="70" y="40" width="170" height="130" fill="#d9ceb4" transform="rotate(-6 155 105)"/><rect x="150" y="70" width="170" height="130" fill="#e8dfc8" transform="rotate(4 235 135)"/>
      <g stroke="#8a7a62" stroke-width="2" transform="rotate(4 235 135)"><line x1="170" y1="95" x2="290" y2="95"/><line x1="170" y1="110" x2="300" y2="110"/><line x1="170" y1="125" x2="270" y2="125"/><line x1="170" y1="140" x2="295" y2="140"/></g>
      <text x="245" y="185" text-anchor="middle" fill="#8e3b36" font-family="Cinzel,serif" font-size="11" transform="rotate(4 235 135)">STRENG VERTRAULICH</text>
      <circle cx="290" cy="160" r="36" fill="#54b8b022" stroke="#d5ad62" stroke-width="6"/><line x1="316" y1="186" x2="350" y2="220" stroke="#d5ad62" stroke-width="10" stroke-linecap="round"/>`,
    cyber: `<rect width="400" height="240" fill="#07080a"/><rect x="70" y="36" width="260" height="160" rx="8" fill="#111418" stroke="#2f363f" stroke-width="4"/><rect x="84" y="50" width="232" height="132" fill="#050607"/>
      <g font-family="DM Mono,monospace" font-size="10" fill="#5be08f"><text x="96" y="70">VANTA SECURITY BOOT</text><text x="96" y="86" fill="#ff6a5e">WARNING: integrity compromised</text><text x="96" y="102">trace SEC-01 ...</text></g>
      <text x="200" y="152" text-anchor="middle" font-family="DM Mono,monospace" font-size="30" font-weight="600" fill="#ff6a5e">01:40:00</text><rect x="170" y="196" width="60" height="18" fill="#191d23"/><rect x="130" y="212" width="140" height="8" rx="2" fill="#191d23"/>`,
    archon: `<rect width="400" height="240" fill="#04070c"/><g stroke="#3c8db5" stroke-opacity=".35">${Array.from({ length: 9 }, (_, i) => `<line x1="${40 + i * 40}" y1="30" x2="${40 + i * 40}" y2="210"/>`).join("")}</g>
      <text x="200" y="104" text-anchor="middle" font-family="DM Mono,monospace" font-size="34" font-weight="600" fill="#ff6a5e" letter-spacing="6">ARCHON</text>
      <text x="200" y="134" text-anchor="middle" font-family="DM Mono,monospace" font-size="12" fill="#5fd0ff" letter-spacing="4">TRACE 02:00:00</text>
      <g fill="#3c8db5"><rect x="140" y="160" width="22" height="7"/><rect x="166" y="160" width="22" height="7"/><rect x="192" y="160" width="22" height="7"/></g><rect x="218" y="160" width="22" height="7" fill="#e0473d"/><rect x="244" y="160" width="22" height="7" fill="#1b2633"/>`,
    silberkamm: `<rect width="400" height="240" fill="#0f1418"/><g fill="#dfe6ee">${[[30,30],[80,60],[140,20],[210,50],[300,26],[350,70],[380,30],[110,90],[260,84],[180,96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" opacity=".8"/>`).join("")}</g><path d="M0 150 L90 96 L170 140 L250 84 L330 132 L400 104 L400 240 L0 240 Z" fill="#1a2128"/><path d="M90 96 L112 110 L70 110 Z M250 84 L274 100 L228 100 Z" fill="#dfe6ee" opacity=".7"/><rect y="186" width="400" height="54" fill="#dfe6ee" opacity=".12"/><line x1="0" y1="196" x2="400" y2="196" stroke="#8a96a3" stroke-width="2"/><g fill="#232c36" stroke="#3b4754"><rect x="64" y="158" width="58" height="32" rx="3"/><rect x="128" y="160" width="76" height="30" rx="3"/><rect x="210" y="160" width="76" height="30" rx="3"/><rect x="292" y="160" width="76" height="30" rx="3"/></g><g fill="#e8c77a" opacity=".85">${[140,160,180,222,242,262,304,324,344].map((x) => `<rect x="${x}" y="167" width="10" height="9"/>`).join("")}</g><rect x="98" y="146" width="8" height="12" fill="#3b4754"/><path d="M102 146 C 96 132, 110 126, 104 112" fill="none" stroke="#dfe6ee" stroke-width="3" opacity=".5"/><text x="200" y="228" text-anchor="middle" fill="#c9ced6" font-family="Playfair Display,Georgia,serif" font-size="14" letter-spacing="4">SILBERKAMM</text>`,
    sternwarte: `<rect width="400" height="240" fill="#0b0f1a"/><g fill="#e9e3d4">${[[40,40],[90,70],[150,30],[330,50],[360,110],[280,30],[60,120],[220,60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join("")}</g><rect y="196" width="400" height="44" fill="#141a26"/><rect x="120" y="120" width="160" height="80" fill="#1b2232" stroke="#2c3550"/><path d="M150 120 A50 50 0 0 1 250 120 Z" fill="#232c40" stroke="#3a4766"/><rect x="196" y="78" width="8" height="40" fill="#3a4766" transform="rotate(-28 200 120)"/><rect x="140" y="150" width="18" height="24" fill="#d5ad62" opacity=".8"/><rect x="242" y="150" width="18" height="24" fill="#d5ad62" opacity=".5"/><text x="200" y="228" text-anchor="middle" fill="#d5ad62" font-family="Playfair Display,Georgia,serif" font-size="14" letter-spacing="4">EICHENFELS</text>`,
    bunker: `<rect width="400" height="240" fill="#0b0d0c"/><rect y="186" width="400" height="54" fill="#141815"/><rect x="120" y="46" width="160" height="146" fill="#1a1f1b" stroke="#2c332e" stroke-width="6"/>
      <rect x="140" y="62" width="120" height="124" fill="#2a302b"/><circle cx="200" cy="124" r="30" fill="none" stroke="#7a4a2c" stroke-width="6"/><g stroke="#7a4a2c" stroke-width="5"><line x1="170" y1="124" x2="230" y2="124"/><line x1="200" y1="94" x2="200" y2="154"/></g>
      <text x="200" y="222" text-anchor="middle" font-family="DM Mono,monospace" font-size="16" fill="#d8cfb4" letter-spacing="6">SEKTOR <tspan fill="#d0473a">9</tspan></text>
      <rect x="292" y="104" width="64" height="44" fill="#050806" stroke="#3f6b4a"/><text x="324" y="122" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#8fd19e">1 AKTIVE</text><text x="324" y="134" text-anchor="middle" font-family="DM Mono,monospace" font-size="7" fill="#8fd19e">SITZUNG</text><circle cx="270" cy="58" r="4" fill="#d0473a"/>`,
    pyramide: `<rect width="400" height="240" fill="#120f0c"/><circle cx="310" cy="60" r="26" fill="#d5ad62" opacity=".8"/><rect y="190" width="400" height="50" fill="#2a2016"/>
      <polygon points="200,40 330,190 70,190" fill="#5a4630"/><polygon points="200,40 330,190 200,190" fill="#3e3022"/><rect x="186" y="150" width="28" height="40" fill="#120f0c"/>`,
    labor: `<rect width="400" height="240" fill="#0a1214"/><g stroke="#54b8b0" stroke-opacity=".15"><line x1="0" y1="60" x2="400" y2="60"/><line x1="0" y1="120" x2="400" y2="120"/><line x1="0" y1="180" x2="400" y2="180"/><line x1="100" y1="0" x2="100" y2="240"/><line x1="200" y1="0" x2="200" y2="240"/><line x1="300" y1="0" x2="300" y2="240"/></g>
      <path d="M180 50 h40 v50 l45 90 h-130 l45 -90 z" fill="#54b8b018" stroke="#54b8b0" stroke-width="3"/><path d="M152 160 h96 l13 30 h-122 z" fill="#54b8b0" opacity=".55"/>`,
  };
  const art = (g) => g.poster
    ? `<img src="${esc(g.poster)}" alt="" loading="lazy">`
    : `<svg viewBox="0 0 400 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${ART[g.art] || ""}</svg>`;
  const dots = (n) => `<span class="dots" aria-label="Schwierigkeit: ${DIFF[n]}">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;

  function progress(g) {
    if (!g.saveKey) return null;
    try {
      const s = JSON.parse(localStorage.getItem(g.saveKey) || "null");
      if (!s || !s.started) return null;
      return { done: (s.completed || []).length, total: g.rooms || 0, finished: !!s.finished };
    } catch (e) { return null; }
  }
  function playButton(g, cls = "") {
    if (!playable(g)) return `<span class="btn ${cls} disabled" aria-disabled="true">In Vorbereitung</span>`;
    const p = progress(g);
    const label = p ? (p.finished ? "Erneut betreten" : "Weiterspielen") : "Jetzt spielen";
    return `<a class="btn gold ${cls}" href="${esc(g.url)}">${label} <span aria-hidden="true">→</span></a>`;
  }
  const status = (g) => (playable(g) ? `<span class="badge play">Spielbar</span>${g.isNew ? `<span class="badge new">Neu</span>` : ""}` : `<span class="badge soon">Demnächst</span>`);

  /* ---------- Kategorien (nach Spielprinzip) ---------- */
  const CATEGORIES = [
    { id: "klassisch", no: "01", name: "Klassische Escape Rooms", text: "Du bist eingeschlossen. Erkunde Räume, untersuche Gegenstände und finde deinen Weg durch verschlossene Türen.", tag: "Raum für Raum", art: "hotel" },
    { id: "crime", no: "02", name: "Crime & Mystery", text: "Untersuche Beweise, verbinde Hinweise und löse mysteriöse Fälle. Hier ist dein Ermittlergeschick gefragt.", tag: "Ermitteln & Kombinieren", art: "krimi" },
    { id: "digital", no: "03", name: "Digitale Escape Games", text: "Rätselwelten auf einem fremden Computer. Knacke Codes, entschlüssele Nachrichten und löse komplexe Aufgaben.", tag: "Digitales Rätseln", art: "cyber" },
  ];
  const shown = games.filter(playable);
  function renderCategories() {
    $("#kategorien-list").innerHTML = CATEGORIES.map((c) => {
      const list = shown.filter((g) => g.category === c.id);
      const target = list.length ? "#spiel-" + list[0].id : "#abenteuer";
      return `<a class="category reveal" href="${target}">
        <span class="category-art" aria-hidden="true"><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">${ART[c.art] || ""}</svg></span>
        <span class="category-text"><span class="category-no">${c.no}</span><b>${esc(c.name)}</b><small>${esc(c.text)}</small>
        <em>${esc(c.tag)}</em>${list.length ? `<span class="category-games">${list.map((g) => esc(g.title)).join(" · ")} <span aria-hidden="true">→</span></span>` : ""}</span></a>`;
    }).join("");
  }

  /* ---------- Bewertungen: Schnitt und Anzahl (ab MIN_RATINGS) ---------- */
  const MIN_RATINGS = 3;
  let ratings = {};
  const stars = (g) => {
    const r = ratings[g.id];
    if (!r || r.total < MIN_RATINGS) return "";
    const avg = Number(r.avg).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `<span class="rating" aria-label="Bewertung ${avg} von 5 Sternen, ${r.total} Bewertungen"><b aria-hidden="true">★ ${avg}</b> <span aria-hidden="true">(${r.total})</span></span>`;
  };
  async function loadRatings() {
    const cfg = window.MR_MULTIPLAYER_CONFIG;
    if (!cfg || !cfg.supabaseUrl || !window.fetch) return;
    try {
      const res = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/game_rating_summary", {
        method: "POST", headers: { apikey: cfg.supabasePublishableKey, "Content-Type": "application/json" }, body: "{}",
      });
      if (!res.ok) return;
      const rows = await res.json();
      ratings = {};
      (rows || []).forEach((r) => { ratings[r.game_slug] = { avg: r.avg_stars, total: Number(r.total) }; });
      renderGames();
    } catch (e) { /* ohne Bewertungen weiter */ }
  }

  /* ---------- Unsere Abenteuer (nur spielbare) ---------- */
  function renderGames() {
    const order = (g) => CATEGORIES.findIndex((c) => c.id === g.category);
    const list = shown.slice().sort((a, b) => order(a) - order(b));
    $("#cards").innerHTML = list.map((g) => {
      const p = progress(g);
      return `<article class="card reveal" id="spiel-${esc(g.id)}">
        <div class="card-art">${art(g)}<div class="card-badges">${g.isNew ? `<span class="badge new">Neu</span>` : ""}${g.status === "vorschau" ? `<span class="badge soon">Vorschau</span>` : ""}</div></div>
        <div class="card-body">
          <p class="card-cat">${esc(g.categoryLabel)}</p>
          <h3>${esc(g.title)}</h3>${stars(g)}
          <p class="card-sub">${esc(g.subtitle)}</p>
          <p class="card-teaser">${esc(g.teaser)}</p>
          <dl class="card-meta">
            <div><dt>Spielzeit</dt><dd>${esc(g.duration)}</dd></div>
            <div><dt>Schwierigkeit</dt><dd>${dots(g.difficulty)}</dd></div>
            <div><dt>Spieler</dt><dd>${esc(g.players)}</dd></div>
          </dl>
          ${p ? `<p class="card-progress">${p.finished ? "✓ Gelöst" : "Spielstand gespeichert"}</p>` : ""}
          <div class="card-actions">${playButton(g)}<button class="btn ghost" data-details="${g.id}">Details</button></div>
        </div></article>`;
    }).join("");
    observe();
  }

  /* ---------- Detailansicht ---------- */
  const dlg = $("#details");
  function openDetails(id) {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    $("#detailsBody").innerHTML = `<div class="detail-art">${art(g)}</div>
      <div class="detail-content">
        <p class="card-cat">${esc(g.categoryLabel)} ${status(g)}</p>
        <h2 id="detailsTitle">${esc(g.title)}</h2>${stars(g)}<p class="card-sub">${esc(g.subtitle)}</p>
        <p class="detail-teaser">${esc(g.teaser)}</p>
        ${g.shots ? `<div class="detail-shots">${g.shots.map((s) => `<img src="${esc(s.src)}" alt="${esc(s.label)}" loading="lazy">`).join("")}</div>` : ""}
        <table class="facts">
          <tr><th>Spielzeit</th><td>${esc(g.duration)}</td></tr>
          <tr><th>Schwierigkeit</th><td>${dots(g.difficulty)} ${DIFF[g.difficulty]}</td></tr>
          <tr><th>Spieler</th><td>${esc(g.players)}${/1–4/.test(g.players) && playable(g) ? " · gemeinsam mit Einladungscode" : ""}</td></tr>
          <tr><th>Alter</th><td>${esc(g.age)}</td></tr>
          ${g.rooms ? `<tr><th>Räume</th><td>${g.rooms}${g.puzzles ? ` · ${g.puzzles} Rätsel` : ""}</td></tr>` : ""}
          <tr><th>Kosten</th><td>Kostenlos, ohne Anmeldung</td></tr>
        </table>
        ${g.statusNote ? `<p class="note">${esc(g.statusNote)}</p>` : ""}
        <p class="note">Läuft im Browser auf Smartphone, Tablet und Computer. Dein Spielstand wird automatisch gespeichert.</p>
        <div class="card-actions">${playButton(g)}</div>
      </div>`;
    dlg.showModal();
  }

  /* ---------- sanftes Einblenden beim Scrollen ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" }) : null;
  function observe() { document.querySelectorAll(".reveal:not(.in)").forEach((el) => (io ? io.observe(el) : el.classList.add("in"))); }

  /* ---------- Bedienung ---------- */
  const setNav = (open) => { document.body.classList.toggle("nav-open", open); $("#menuToggle").setAttribute("aria-expanded", String(open)); };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.details) openDetails(t.dataset.details);
  });
  $("#closeDetails").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  $("#menuToggle").addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  document.querySelectorAll("#nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  // Kopfzeile: über dem Titelbild durchsichtig, beim Scrollen fest
  const onScroll = () => $("#header").classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });

  renderCategories();
  renderGames();
  loadRatings();
  onScroll();
  observe();
})();
