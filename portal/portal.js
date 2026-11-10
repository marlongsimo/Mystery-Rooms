/* MYSTERY ROOMS – Startseite: Einstieg, Escape Rooms (mit Filtern), Krimidinner, Spielstand, Bewertungen */
(() => {
  "use strict";
  const games = window.MR_GAMES || [];
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DIFF = ["", "Leicht", "Mittel", "Anspruchsvoll", "Schwer"];
  const playable = (g) => g.status !== "geplant";
  const isTable = (g) => g.kind === "tisch";
  const ART = window.MR_ART || {};
  const art = (g) => g.poster
    ? `<img src="${esc(g.poster)}" alt="${esc(g.title)} – ${esc(g.subtitle)}" loading="lazy">`
    : `<svg viewBox="0 0 400 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${ART[g.art] || ""}</svg>`;
  const dots = (n) => `<span class="dots" aria-label="Schwierigkeit: ${DIFF[n]}">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  const page = (g) => `spiele/${g.id}.html`;

  function progress(g) {
    if (!g.saveKey) return null;
    try {
      const s = JSON.parse(localStorage.getItem(g.saveKey) || "null");
      if (!s || !s.started) return null;
      return { done: (s.completed || []).length, total: g.rooms || 0, finished: !!s.finished };
    } catch (e) { return null; }
  }
  function playButton(g) {
    const p = progress(g);
    const label = isTable(g) ? "Abend anlegen" : p ? (p.finished ? "Erneut spielen" : "Weiterspielen") : "Jetzt spielen";
    return `<a class="btn gold" href="${esc(g.url)}">${label} <span aria-hidden="true">→</span></a>`;
  }

  /* ---------- Escape Rooms: Filter nach Spielprinzip ---------- */
  const CATEGORIES = [
    { id: "klassisch", name: "Klassisch", long: "Räume erkunden, Gegenstände untersuchen, Türen öffnen." },
    { id: "crime", name: "Crime & Mystery", long: "Beweise sichten, Spuren verbinden, Fälle lösen." },
    { id: "digital", name: "Digital", long: "Ein fremder Computer: Mails, Chats, Codes, Terminal." },
  ];
  const online = games.filter((g) => playable(g) && !isTable(g));
  const tables = games.filter((g) => playable(g) && isTable(g));
  let filter = "alle";

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
      renderOnline(); renderTables();
    } catch (e) { /* ohne Bewertungen weiter */ }
  }

  const together = (g) => /–[2-9]/.test(g.players);
  function card(g) {
    const p = progress(g);
    return `<article class="card reveal" id="spiel-${esc(g.id)}">
      <a class="card-art" href="${page(g)}" tabindex="-1" aria-hidden="true">${art(g)}${g.banner ? `<span class="card-banner">${esc(g.banner)}</span>` : ""}<span class="card-badges">${g.isNew ? `<span class="badge new">Neu</span>` : ""}${together(g) ? `<span class="badge team">Gemeinsam</span>` : `<span class="badge solo">Allein</span>`}</span></a>
      <div class="card-body">
        <p class="card-cat">${esc(g.categoryLabel)}</p>
        <h3><a href="${page(g)}">${esc(g.title)}</a></h3>${stars(g)}
        <p class="card-sub">${esc(g.subtitle)}</p>
        <p class="card-teaser">${esc(g.teaser)}</p>
        <dl class="card-meta">
          <div><dt>Spielzeit</dt><dd>${esc(g.duration)}</dd></div>
          <div><dt>Schwierigkeit</dt><dd>${dots(g.difficulty)}</dd></div>
          <div><dt>Spieler</dt><dd>${esc(g.players)}</dd></div>
        </dl>
        ${p ? `<p class="card-progress">${p.finished ? "✓ Gelöst" : "Spielstand gespeichert"}</p>` : ""}
        <div class="card-actions">${playButton(g)}<a class="btn ghost" href="${page(g)}">Details</a></div>
      </div></article>`;
  }
  function renderFilters() {
    const count = (id) => online.filter((g) => id === "alle" || g.category === id).length;
    const chips = [{ id: "alle", name: "Alle" }].concat(CATEGORIES).filter((c) => count(c.id));
    $("#filters").innerHTML = chips.map((c) => `<button class="chip${filter === c.id ? " on" : ""}" data-filter="${c.id}" aria-pressed="${filter === c.id}">${esc(c.name)} <span>${count(c.id)}</span></button>`).join("");
    const c = CATEGORIES.find((x) => x.id === filter);
    $("#filterNote").textContent = c ? c.long : "";
  }
  function renderOnline() {
    const order = (g) => CATEGORIES.findIndex((c) => c.id === g.category);
    const list = online.filter((g) => filter === "alle" || g.category === filter).sort((a, b) => order(a) - order(b));
    $("#cards").innerHTML = list.map(card).join("");
    observe();
  }

  /* ---------- Krimidinner: Fälle ---------- */
  function renderTables() {
    $("#cases").innerHTML = tables.map((g) => `<article class="case reveal" id="spiel-${esc(g.id)}">
      <a class="case-art" href="${page(g)}" tabindex="-1" aria-hidden="true">${art(g)}${g.isNew ? `<span class="card-badges"><span class="badge new">Neu</span></span>` : ""}</a>
      <div class="case-body">
        <p class="card-cat">${esc(g.subtitle)}</p>
        <h3><a href="${page(g)}">${esc(g.title)}</a></h3>${stars(g)}
        <p class="card-teaser">${esc(g.teaser)}</p>
        <dl class="card-meta">
          <div><dt>Personen</dt><dd>${esc(g.players)}</dd></div>
          <div><dt>Dauer</dt><dd>${esc(g.duration)}</dd></div>
          <div><dt>Schwierigkeit</dt><dd>${dots(g.difficulty)}</dd></div>
        </dl>
        <div class="card-actions">${playButton(g)}<a class="btn ghost" href="${esc(g.url)}#code">Mein Rollenblatt öffnen</a><a class="btn ghost" href="${page(g)}">Details</a></div>
      </div></article>`).join("");
    observe();
  }

  /* ---------- Einstieg: Zahlen in den beiden Wegen ---------- */
  function renderDoors() {
    const range = (list) => { const n = list.flatMap((g) => (g.players.match(/\d+/g) || []).map(Number)); return n.length ? `${Math.min(...n)}–${Math.max(...n)} Personen` : ""; };
    $("#doorOnline").textContent = `${online.length} Abenteuer · ${range(online)}`;
    $("#doorTable").textContent = `${tables.length} ${tables.length === 1 ? "Fall" : "Fälle"} · ${range(tables)}`;
  }

  /* ---------- sanftes Einblenden beim Scrollen ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" }) : null;
  function observe() { document.querySelectorAll(".reveal:not(.in)").forEach((el) => (io ? io.observe(el) : el.classList.add("in"))); }

  /* ---------- Bedienung ---------- */
  const setNav = (open) => { document.body.classList.toggle("nav-open", open); $("#menuToggle").setAttribute("aria-expanded", String(open)); };
  document.addEventListener("click", (e) => {
    const f = e.target.closest("[data-filter]");
    if (f) { filter = f.dataset.filter; renderFilters(); renderOnline(); }
  });
  $("#menuToggle").addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  document.querySelectorAll("#nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  // Kopfzeile: über dem Titelbild durchsichtig, beim Scrollen fest
  const onScroll = () => $("#header").classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });

  renderDoors();
  renderFilters();
  renderOnline();
  renderTables();
  loadRatings();
  onScroll();
  observe();
})();
