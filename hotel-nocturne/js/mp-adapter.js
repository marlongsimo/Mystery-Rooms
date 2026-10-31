/*
 * HOTEL NOCTURNE – Anbindung an den Multiplayer der Plattform
 *
 * Verbindet die Engine (N.engine) mit platform/multiplayer/mp-core.js und mp-lobby.js.
 * Alles Spielspezifische steht hier oder in js/config.js (multiplayer: { … }).
 * Fehlt die Plattform (z. B. kein Netz beim Laden der Seite), bleibt das Spiel
 * ganz normal im Einzelspielermodus.
 */
(() => {
  "use strict";
  const N = window.NOCTURNE, E = N && N.engine, cfg = N && N.config && N.config.multiplayer;
  const root = document.getElementById("mpEntry");
  if (!root || !E || !cfg) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  if (!window.MRMultiplayer || !window.MRLobby) {
    root.innerHTML = `<p class="mp-entry-copy">Gemeinsames Spielen ist gerade nicht verfügbar. Allein einchecken geht jederzeit.</p>`;
    return;
  }

  let client;
  try { client = window.MRMultiplayer.connect({ gameSlug: cfg.gameSlug, maxPlayers: cfg.maxPlayers }); }
  catch (e) { root.innerHTML = `<p class="mp-status" data-kind="error">${esc(e.message)}</p>`; return; }

  let link = null, saveKey = null;

  /* ---------- Team-Anzeige im Spiel ---------- */
  const side = document.querySelector(".side");
  const teamEl = document.createElement("div");
  teamEl.className = "side-block mp-team hidden";
  teamEl.id = "mpTeam";
  side.insertBefore(teamEl, side.querySelector(".side-progress"));
  function renderTeam(list = []) {
    teamEl.classList.toggle("hidden", !link);
    if (!link) return;
    teamEl.innerHTML = `<p class="eyebrow">TEAM · ${esc(client.session ? client.session.room_code : "")}</p>
      ${list.length ? `<ul class="mp-team-list">${list.map((p) => `<li><b>${esc(p.name)}</b><span>${p.pos ? esc(E.roomName(p.pos.room)) + (p.pos.view ? " · " + esc(p.pos.view) : "") : "noch nicht im Hotel"}</span></li>`).join("")}</ul>`
        : `<p class="selected-note">Noch niemand sonst im Hotel.</p>`}`;
  }

  /* ---------- kurze Meldungen ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "mp-toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function toast(html, ms = 5200) {
    toastEl.innerHTML = html; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }
  let lastError = 0;
  client.on("error", () => {
    if (Date.now() - lastError < 30000) return;
    lastError = Date.now();
    if (link) toast("Verbindung zum Team gestört – es wird automatisch weiter versucht.");
  });

  /* ---------- Sitzung ↔ Engine ---------- */
  function attach(session) {
    if (link) return;
    saveKey = "nocturne_mp_" + session.session_id;
    E.enterMultiplayer({
      saveKey,
      changed: () => link && link.changed(),
      leave: () => { if (confirm("Sitzung wirklich verlassen? Als Host beendest du sie damit für alle.")) lobby.leave(); },
      menuHtml: () => `<div class="mp-menu"><p class="eyebrow">GEMEINSAME SITZUNG</p><p>Code <b>${esc(client.session ? client.session.room_code : "")}</b> · ${client.players.map((p) => esc(p.player_name)).join(", ")}</p></div>`,
    });
    link = window.MRMultiplayer.sync(client, {
      exportShared: E.exportShared,
      normalize: E.normalizeShared,
      applyShared: (state, byName) => {
        const news = E.applyShared(state);
        if (news.length && E.inGame()) toast(`<b>${esc(byName || "Dein Team")}</b> · ${news.slice(0, 3).map(esc).join(" · ")}${news.length > 3 ? " …" : ""}`);
      },
      position: E.position,
      onTeam: renderTeam,
    });
    renderTeam([]);
    paintBody();
  }
  function detach() {
    if (link) link.stop();
    link = null;
    renderTeam();
    if (saveKey) { try { localStorage.removeItem(saveKey); } catch (e) { /* privat */ } saveKey = null; }
    if (E.isMultiplayer()) E.leaveMultiplayer();
    paintBody();
  }
  const paintBody = () => document.body.classList.toggle("mp-session", Boolean(client.session));

  const lobby = window.MRLobby.mount({
    client, root,
    defaultName: N.config.playerName || "",
    texts: {
      title: "Nicht allein einchecken.",
      copy: "Erstellt eine gemeinsame Sitzung oder tretet mit einem Einladungscode bei. Jeder bewegt sich frei durch das Hotel – Rucksack, Akte und gelöste Rätsel teilt ihr.",
      lobbyKicker: "HOTEL NOCTURNE · PRIVATE SITZUNG",
      lobbyTitle: "Der gemeinsame Check-in",
      codePlaceholder: "NOCT-XXXXXX",
      hostWaiting: "Teile den Code mit deinen Mitspielern. Nur du kannst das Hotel öffnen.",
      guestWaiting: "Du bist eingecheckt. Warte, bis der Host das Hotel öffnet.",
      start: "Das Hotel betreten",
      running: "Eure Sitzung läuft. Du kannst jederzeit zurückkehren.",
      enter: "Zurück ins Hotel",
      playersHead: "EINGECHECKTE GÄSTE",
    },
    // Vor dem Start liest jede/r die Fallakte im eigenen Tempo; danach „bereit“.
    prepare: { label: "Fallakte lesen", againLabel: "✓ Bereit – Fallakte noch einmal lesen", run: (done) => E.showCaseFile(done) },
    onEnter(session) { attach(session); E.start(); },
    onLeft() { detach(); },
  });
  client.on("players", paintBody);
  client.on("status", paintBody);

  // Nach dem Neuladen: laufende Sitzung wiederfinden (Spielstand bleibt erhalten)
  let stored = null; try { stored = localStorage.getItem("mr_mp_session_v1:" + cfg.gameSlug); } catch (e) { /* privat */ }
  if (stored) {
    lobby.restore().then((s) => { if (s && s.status === "running") attach(s); paintBody(); });
  }
  N.multiplayer = { client, lobby, isActive: () => Boolean(link) };
})();
