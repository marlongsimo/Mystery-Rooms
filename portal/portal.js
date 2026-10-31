/* MYSTERY ROOMS – Startseite: Katalog, Filter, Detailansicht */
(() => {
  "use strict";
  const games = window.MR_GAMES || [];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DIFF = ["", "Leicht", "Mittel", "Anspruchsvoll", "Schwer"];

  /* Titelgrafiken (SVG, 400 × 240) */
  const ART = {
    hotel: `<rect width="400" height="240" fill="#0b0d14"/><g stroke="#9fb2c4" stroke-opacity=".16"><line x1="30" y1="0" x2="18" y2="50"/><line x1="120" y1="30" x2="108" y2="80"/><line x1="330" y1="10" x2="318" y2="60"/><line x1="370" y1="90" x2="358" y2="140"/></g>
      <polygon points="110,240 110,70 200,38 290,70 290,240" fill="#17130f" stroke="#3a2e24"/><text x="200" y="64" text-anchor="middle" fill="#d5ad62" font-family="Cinzel,serif" font-size="15" letter-spacing="5">NOCTURNE</text>
      <g fill="#100d0b" stroke="#3a2e24"><rect x="130" y="85" width="26" height="36"/><rect x="186" y="85" width="26" height="36"/><rect x="244" y="85" width="26" height="36"/><rect x="130" y="140" width="26" height="36"/><rect x="186" y="140" width="26" height="36"/></g>
      <circle cx="257" cy="158" r="34" fill="#f0c27a" opacity=".18"/><rect x="244" y="140" width="26" height="36" fill="#e9b96f"/><rect x="186" y="196" width="28" height="44" fill="#0a0806" stroke="#5b4430"/>`,
    krimi: `<rect width="400" height="240" fill="#0d1018"/><rect x="70" y="40" width="170" height="130" fill="#d9ceb4" transform="rotate(-6 155 105)"/><rect x="150" y="70" width="170" height="130" fill="#e8dfc8" transform="rotate(4 235 135)"/>
      <g stroke="#8a7a62" stroke-width="2" transform="rotate(4 235 135)"><line x1="170" y1="95" x2="290" y2="95"/><line x1="170" y1="110" x2="300" y2="110"/><line x1="170" y1="125" x2="270" y2="125"/><line x1="170" y1="140" x2="295" y2="140"/></g>
      <text x="245" y="185" text-anchor="middle" fill="#8e3b36" font-family="Cinzel,serif" font-size="11" transform="rotate(4 235 135)">STRENG VERTRAULICH</text>
      <circle cx="290" cy="160" r="36" fill="#54b8b022" stroke="#d5ad62" stroke-width="6"/><line x1="316" y1="186" x2="350" y2="220" stroke="#d5ad62" stroke-width="10" stroke-linecap="round"/>`,
    pyramide: `<rect width="400" height="240" fill="#120f0c"/><circle cx="310" cy="60" r="26" fill="#d5ad62" opacity=".8"/><rect y="190" width="400" height="50" fill="#2a2016"/>
      <polygon points="200,40 330,190 70,190" fill="#5a4630"/><polygon points="200,40 330,190 200,190" fill="#3e3022"/><rect x="186" y="150" width="28" height="40" fill="#120f0c"/>
      <g fill="#d5ad62" opacity=".75"><circle cx="160" cy="150" r="4"/><rect x="150" y="125" width="6" height="14"/><path d="M230 120 l8 14 l-16 0 z"/></g>`,
    labor: `<rect width="400" height="240" fill="#0a1214"/><g stroke="#54b8b0" stroke-opacity=".15"><line x1="0" y1="60" x2="400" y2="60"/><line x1="0" y1="120" x2="400" y2="120"/><line x1="0" y1="180" x2="400" y2="180"/><line x1="100" y1="0" x2="100" y2="240"/><line x1="200" y1="0" x2="200" y2="240"/><line x1="300" y1="0" x2="300" y2="240"/></g>
      <path d="M180 50 h40 v50 l45 90 h-130 l45 -90 z" fill="#54b8b018" stroke="#54b8b0" stroke-width="3"/><path d="M152 160 h96 l13 30 h-122 z" fill="#54b8b0" opacity=".55"/>
      <circle cx="190" cy="150" r="5" fill="#bff3ee"/><circle cx="214" cy="132" r="3" fill="#bff3ee"/><circle cx="204" cy="112" r="2" fill="#bff3ee"/>`,
  };
  const art = (g) => `<svg viewBox="0 0 400 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${ART[g.art] || ""}</svg>`;

  const dots = (n) => `<span class="dots" aria-label="Schwierigkeit: ${DIFF[n]}">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;

  function progress(g) {
    if (!g.saveKey) return null;
    try {
      const s = JSON.parse(localStorage.getItem(g.saveKey) || "null");
      if (!s || !s.started) return null;
      return { done: (s.completed || []).length, total: g.rooms || 0, finished: !!s.finished };
    } catch (e) { return null; }
  }

  function badge(g) {
    if (g.status === "geplant") return `<span class="badge soon">Demnächst</span>`;
    if (g.status === "vorschau") return `<span class="badge preview">Vorschau</span>${g.isNew ? `<span class="badge new">Neu</span>` : ""}`;
    return g.isNew ? `<span class="badge new">Neu</span>` : "";
  }

  function playButton(g, cls = "") {
    if (g.status === "geplant") return `<span class="btn ${cls} disabled" aria-disabled="true">In Vorbereitung</span>`;
    const p = progress(g);
    const label = p ? (p.finished ? "Erneut ansehen" : "Weiterspielen") : "Jetzt spielen";
    return `<a class="btn gold ${cls}" href="${esc(g.url)}">${label} <span aria-hidden="true">→</span></a>`;
  }

  /* Karten */
  const state = { cat: "alle", diff: "alle" };
  function renderCards() {
    const list = games.filter((g) => (state.cat === "alle" || g.category === state.cat) && (state.diff === "alle" || String(g.difficulty) === state.diff));
    $("#cards").innerHTML = list.length ? list.map((g) => {
      const p = progress(g);
      return `<article class="card ${g.status === "geplant" ? "is-planned" : ""}">
        <div class="card-art">${art(g)}<div class="card-badges">${badge(g)}</div></div>
        <div class="card-body">
          <p class="card-cat">${esc(g.categoryLabel)}</p>
          <h3>${esc(g.title)}</h3>
          <p class="card-sub">${esc(g.subtitle)}</p>
          <p class="card-teaser">${esc(g.teaser)}</p>
          <dl class="card-meta">
            <div><dt>Dauer</dt><dd>${esc(g.duration)}</dd></div>
            <div><dt>Schwierigkeit</dt><dd>${dots(g.difficulty)} ${DIFF[g.difficulty]}</dd></div>
            <div><dt>Spieler</dt><dd>${esc(g.players)}</dd></div>
          </dl>
          ${p ? `<p class="card-progress">${p.finished ? "✓ Abgeschlossen" : `Dein Fortschritt: ${p.done} / ${p.total} Bereiche`}</p>` : ""}
          <div class="card-actions">${playButton(g)}<button class="btn ghost" data-details="${g.id}">Details</button></div>
        </div></article>`;
    }).join("") : `<p class="empty">Für diese Auswahl gibt es noch keinen Escape Room. <button class="link" data-reset-filter>Filter zurücksetzen</button></p>`;
  }

  function renderFilters() {
    const cats = [["alle", "Alle"], ...[...new Map(games.map((g) => [g.category, g.category[0].toUpperCase() + g.category.slice(1)])).entries()]];
    $("#catFilter").innerHTML = cats.map(([id, label]) => `<button class="chip ${state.cat === id ? "on" : ""}" data-cat="${id}" aria-pressed="${state.cat === id}">${esc(label)}</button>`).join("");
    const playable = games.filter((g) => g.status !== "geplant").length;
    $("#count").textContent = `${playable} spielbar · ${games.length - playable} in Vorbereitung`;
    $("#heroCount").textContent = playable;
  }

  /* Detailansicht */
  const dlg = $("#details");
  function openDetails(id) {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    $("#detailsBody").innerHTML = `<div class="detail-art">${art(g)}</div>
      <div class="detail-content">
        <p class="card-cat">${esc(g.categoryLabel)} ${badge(g)}</p>
        <h2 id="detailsTitle">${esc(g.title)}</h2><p class="card-sub">${esc(g.subtitle)}</p>
        <p class="detail-teaser">${esc(g.teaser)}</p>
        <table class="facts">
          <tr><th>Kategorie</th><td>${esc(g.categoryLabel)}</td></tr>
          <tr><th>Schwierigkeit</th><td>${dots(g.difficulty)} ${DIFF[g.difficulty]}</td></tr>
          <tr><th>Spielzeit</th><td>${esc(g.duration)}</td></tr>
          <tr><th>Spieler</th><td>${esc(g.players)}</td></tr>
          <tr><th>Alter</th><td>${esc(g.age)}</td></tr>
          ${g.rooms ? `<tr><th>Bereiche</th><td>${g.rooms}</td></tr>` : ""}
          <tr><th>Kosten</th><td>Kostenlos</td></tr>
        </table>
        ${g.statusNote ? `<p class="note">${esc(g.statusNote)}</p>` : ""}
        <p class="note">Läuft im Browser auf Smartphone, Tablet und Computer. Der Spielstand wird automatisch auf deinem Gerät gespeichert.</p>
        <div class="card-actions">${playButton(g)}</div>
      </div>`;
    dlg.showModal();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.cat) { state.cat = t.dataset.cat; renderFilters(); renderCards(); }
    if (t.dataset.cats) { state.cat = t.dataset.cats; renderFilters(); renderCards(); document.querySelector("#rooms").scrollIntoView({ behavior: "smooth" }); }
    if (t.dataset.details) openDetails(t.dataset.details);
    if ("resetFilter" in t.dataset) { state.cat = "alle"; state.diff = "alle"; $("#diffFilter").value = "alle"; renderFilters(); renderCards(); }
  });
  $("#diffFilter").addEventListener("change", (e) => { state.diff = e.target.value; renderCards(); });
  $("#closeDetails").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  $("#menuToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

  renderFilters();
  renderCards();
})();
