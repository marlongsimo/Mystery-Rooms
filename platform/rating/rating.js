/*
 * MYSTERY ROOMS – Bewertung nach Spielabschluss (für alle Spiele gleich)
 *
 *   MRRating.mount(container, { game: "deadline", title: "DEADLINE.exe", ending: "truth" })
 *
 * Schickt 1–5 Sterne und einen optionalen Kommentar an die Supabase-Tabelle
 * `game_ratings` (Anlage: platform/rating/setup.sql). Im Browser steht nur der
 * Publishable Key aus platform/multiplayer/mp-config.js. Besucher können dort nur
 * eintragen, nicht lesen. Pro Gerät und Spiel wird einmal bewertet.
 */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = (game) => "mr_rating_done:" + game;
  const done = (game) => { try { return localStorage.getItem(KEY(game)); } catch (e) { return null; } };
  const LABELS = ["", "Hat mir nicht gefallen", "Geht so", "Ganz gut", "Hat mir gefallen", "Großartig"];

  async function send(row) {
    const cfg = window.MR_MULTIPLAYER_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) throw new Error("nicht konfiguriert");
    if (/^sb_secret_/i.test(cfg.supabasePublishableKey) || /service_role/i.test(cfg.supabasePublishableKey)) throw new Error("Falscher Schlüssel");
    const res = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/game_ratings", {
      method: "POST",
      headers: { apikey: cfg.supabasePublishableKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!res.ok) { let t = ""; try { t = await res.text(); } catch (e) { /* leer */ } throw new Error(res.status + " " + t); }
  }

  function mount(root, { game, title = "", ending = null } = {}) {
    if (!root || !game) return;
    const box = document.createElement("section");
    box.className = "mr-rating";
    box.setAttribute("aria-label", "Bewertung");
    root.appendChild(box);
    let stars = 0;
    const paint = () => {
      const prev = done(game);
      if (prev) { box.innerHTML = `<p class="mr-rating-thanks">Danke für deine Bewertung${title ? ` von ${esc(title)}` : ""}! ${"★".repeat(Number(prev) || 0)}</p>`; return; }
      box.innerHTML = `<h3 class="mr-rating-title">Wie hat dir das Abenteuer gefallen?</h3>
        <div class="mr-stars" role="radiogroup" aria-label="Bewertung von 1 bis 5 Sternen">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${n === stars}" aria-label="${n} von 5 Sternen – ${LABELS[n]}" data-n="${n}" class="${n <= stars ? "on" : ""}">★</button>`).join("")}
        </div>
        <p class="mr-stars-label" aria-live="polite">${stars ? LABELS[stars] : "Wähle eine Bewertung"}</p>
        <label class="mr-rating-label">Was möchtest du uns noch mitteilen? <small>(optional)</small>
          <textarea maxlength="500" rows="3" placeholder="Was war gut, was war schwierig?"></textarea></label>
        <button type="button" class="mr-rating-send" ${stars ? "" : "disabled"}>Bewertung abgeben</button>
        <p class="mr-rating-note">Anonym · ohne Anmeldung · <a href="../datenschutz.html" target="_blank" rel="noopener">Datenschutz</a></p>
        <p class="mr-rating-msg" role="alert"></p>`;
    };
    box.addEventListener("click", async (e) => {
      const s = e.target.closest("[data-n]");
      if (s) { const t = box.querySelector("textarea"), keep = t ? t.value : ""; stars = Number(s.dataset.n); paint(); box.querySelector("textarea").value = keep; box.querySelector(`[data-n="${stars}"]`).focus(); return; }
      const b = e.target.closest(".mr-rating-send");
      if (!b || !stars) return;
      const comment = (box.querySelector("textarea").value || "").trim().slice(0, 500);
      b.disabled = true; b.textContent = "Wird gesendet …";
      try {
        await send({ game_slug: game, stars, comment: comment || null, ending: ending ? String(ending).slice(0, 40) : null });
        try { localStorage.setItem(KEY(game), String(stars)); } catch (err) { /* privat */ }
        paint();
      } catch (err) {
        b.disabled = false; b.textContent = "Bewertung abgeben";
        box.querySelector(".mr-rating-msg").textContent = "Das hat leider nicht geklappt. Bitte versuch es später noch einmal.";
      }
    });
    box.addEventListener("keydown", (e) => {
      if (!e.target.closest("[data-n]") || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      stars = Math.max(1, Math.min(5, (stars || 0) + (e.key === "ArrowRight" ? 1 : -1)));
      const t = box.querySelector("textarea"), keep = t ? t.value : "";
      paint(); box.querySelector("textarea").value = keep; box.querySelector(`[data-n="${stars}"]`).focus();
    });
    paint();
    return box;
  }

  window.MRRating = { mount, version: 1 };
})();
