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
      <text x="200" y="152" text-anchor="middle" font-family="DM Mono,monospace" font-size="30" font-weight="600" fill="#ff6a5e">01:30:00</text><rect x="170" y="196" width="60" height="18" fill="#191d23"/><rect x="130" y="212" width="140" height="8" rx="2" fill="#191d23"/>`,
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

  /* ---------- Hauptabenteuer ---------- */
  const feat = games.find((g) => g.featured && playable(g)) || games.find(playable);
  function renderFeatured() {
    const el = $("#abenteuer");
    if (!feat) { el.remove(); return; }
    const p = progress(feat);
    el.style.setProperty("--feat-bg", feat.shots && feat.shots[0] ? `url("${abs(feat.shots[0].src)}")` : "none");
    el.innerHTML = `<div class="featured-inner">
      <div class="featured-poster reveal">${art(feat)}<div class="rain" aria-hidden="true"></div></div>
      <div class="featured-body reveal">
        <p class="kicker">HAUPTABENTEUER · ${esc(feat.categoryLabel.toUpperCase())}</p>
        <h2 id="featuredTitle">${esc(feat.title)}</h2>
        <p class="featured-sub">${esc(feat.subtitle)}${feat.tagline ? ` – ${esc(feat.tagline)}` : ""}</p>
        <p class="featured-teaser">${esc(feat.teaser)}</p>
        <ul class="stats">
          ${feat.rooms ? `<li><b>${feat.rooms}</b><span>Räume</span></li>` : ""}
          ${feat.puzzles ? `<li><b>${feat.puzzles}</b><span>Rätsel</span></li>` : ""}
          <li><b>${esc(feat.minutes || feat.duration)}</b><span>Minuten</span></li>
          <li><b>${esc(feat.players.replace(" Personen", ""))}</b><span>Spieler</span></li>
        </ul>
        <p class="featured-meta">${dots(feat.difficulty)} ${DIFF[feat.difficulty]} · ${esc(feat.age)} · mit Ton empfohlen</p>
        ${p ? `<p class="featured-progress">${p.finished ? "✓ Du hast den Fall gelöst." : `Dein Fortschritt: ${p.done} von ${p.total} Bereichen`}</p>` : ""}
        <div class="actions">${playButton(feat, "big")}<button class="btn ghost big" data-details="${feat.id}">Mehr erfahren</button></div>
      </div>
    </div>
    ${feat.shots ? `<ul class="shots" aria-label="Einblicke in ${esc(feat.title)}">${feat.shots.map((s) => `<li class="reveal"><img src="${esc(s.src)}" alt="${esc(s.label)}" loading="lazy"><span>${esc(s.label)}</span></li>`).join("")}</ul>` : ""}`;
  }

  /* ---------- Welten ---------- */
  const WORLDS = [
    { id: "mystery", name: "Mystery", text: "Verlassene Orte, verborgene Wahrheiten", art: "hotel" },
    { id: "krimi", name: "Krimi", text: "Spuren verfolgen, Fälle lösen", art: "krimi" },
    { id: "abenteuer", name: "Abenteuer", text: "Vergessene Kammern, alte Schätze", art: "pyramide" },
  ];
  const state = { cat: "alle", diff: "alle" };
  function renderWorlds() {
    $("#worlds").innerHTML = WORLDS.map((w) => {
      const n = games.filter((g) => g.category === w.id && playable(g)).length;
      const soon = games.filter((g) => g.category === w.id && !playable(g)).length;
      return `<button class="world reveal${state.cat === w.id ? " on" : ""}" data-world="${w.id}" aria-pressed="${state.cat === w.id}">
        <span class="world-art" aria-hidden="true"><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">${ART[w.art]}</svg></span>
        <span class="world-text"><b>${w.name}</b><small>${w.text}</small><em>${n ? `${n} spielbar` : ""}${n && soon ? " · " : ""}${soon ? `${soon} demnächst` : ""}</em></span></button>`;
    }).join("");
  }

  /* ---------- Sammlung ---------- */
  function renderCards() {
    // Ohne Filter: alles außer dem Hauptabenteuer. Mit Welt-Filter: alle passenden Abenteuer.
    let list = state.cat === "alle" ? games.filter((g) => g !== feat) : games.filter((g) => g.category === state.cat);
    if (state.diff !== "alle") list = list.filter((g) => String(g.difficulty) === state.diff);
    list.sort((a, b) => Number(playable(b)) - Number(playable(a)));
    const world = WORLDS.find((w) => w.id === state.cat);
    $("#collTitle").textContent = world ? `Welt: ${world.name}` : "Weitere Abenteuer";
    $("#cards").innerHTML = list.length ? list.map((g) => {
      const p = progress(g);
      return `<article class="card reveal ${playable(g) ? "" : "is-planned"}">
        <div class="card-art">${art(g)}<div class="card-badges">${status(g)}</div></div>
        <div class="card-body">
          <p class="card-cat">${esc(g.categoryLabel)}</p>
          <h3>${esc(g.title)}</h3>
          <p class="card-sub">${esc(g.subtitle)}</p>
          <p class="card-teaser">${esc(g.teaser)}</p>
          <dl class="card-meta">
            <div><dt>Spielzeit</dt><dd>${esc(g.duration)}</dd></div>
            <div><dt>Schwierigkeit</dt><dd>${dots(g.difficulty)}</dd></div>
            <div><dt>Spieler</dt><dd>${esc(g.players)}</dd></div>
          </dl>
          ${p ? `<p class="card-progress">${p.finished ? "✓ Gelöst" : `Fortschritt: ${p.done} / ${p.total} Bereiche`}</p>` : ""}
          <div class="card-actions">${playButton(g)}<button class="btn ghost" data-details="${g.id}">Details</button></div>
        </div></article>`;
    }).join("") : `<p class="empty">Für diese Auswahl gibt es noch kein Abenteuer. <button class="link" data-reset>Alle anzeigen</button></p>`;
    const n = games.filter(playable).length;
    $("#count").textContent = `${n} spielbar · ${games.length - n} in Vorbereitung`;
    // Filter erst, wenn es genug spielbare Abenteuer gibt – sonst reicht die Auswahl der Welten
    $("#filters").innerHTML = state.cat !== "alle"
      ? `<button class="chip on" data-reset>${esc(world ? world.name : "")} ✕</button>`
      : n >= 3 ? `<label class="select"><span>Schwierigkeit</span><select id="diffFilter"><option value="alle">Alle</option>${[1, 2, 3, 4].map((d) => `<option value="${d}" ${state.diff === String(d) ? "selected" : ""}>${DIFF[d]}</option>`).join("")}</select></label>` : "";
    observe();
  }

  /* ---------- Abschluss ---------- */
  function renderCta() {
    const el = $("#cta");
    if (!feat) { el.innerHTML = ""; return; }
    el.style.setProperty("--cta-bg", feat.poster ? `url("${abs(feat.poster)}")` : "none");
    el.innerHTML = `<div class="cta-inner reveal"><p class="kicker">CHECK-IN 23:17 UHR</p><h2>Die Tür steht offen.</h2><p>${esc(feat.title)} wartet auf dich – allein oder mit bis zu drei Mitspielern.</p>${playButton(feat, "big")}</div>`;
  }

  /* ---------- Detailansicht ---------- */
  const dlg = $("#details");
  function openDetails(id) {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    $("#detailsBody").innerHTML = `<div class="detail-art">${art(g)}</div>
      <div class="detail-content">
        <p class="card-cat">${esc(g.categoryLabel)} ${status(g)}</p>
        <h2 id="detailsTitle">${esc(g.title)}</h2><p class="card-sub">${esc(g.subtitle)}</p>
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
    if (t.dataset.world) { state.cat = state.cat === t.dataset.world ? "alle" : t.dataset.world; renderWorlds(); renderCards(); $("#sammlung").scrollIntoView({ behavior: "smooth" }); }
    if (t.dataset.details) openDetails(t.dataset.details);
    if ("reset" in t.dataset) { state.cat = "alle"; state.diff = "alle"; renderWorlds(); renderCards(); }
  });
  document.addEventListener("change", (e) => { if (e.target.id === "diffFilter") { state.diff = e.target.value; renderCards(); } });
  $("#closeDetails").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  $("#menuToggle").addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  document.querySelectorAll("#nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  // Kopfzeile: über dem Titelbild durchsichtig, beim Scrollen fest
  const onScroll = () => $("#header").classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });

  renderFeatured();
  renderWorlds();
  renderCards();
  renderCta();
  onScroll();
  observe();
})();
