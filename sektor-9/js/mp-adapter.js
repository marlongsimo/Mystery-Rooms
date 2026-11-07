/*
 * SEKTOR 9 – Anbindung an den Multiplayer der Plattform (platform/multiplayer: mp-core.js, mp-lobby.js)
 *
 * Nutzt ausschließlich die vorhandenen Supabase-Funktionen der Plattform (create/join/start/leave_game_session,
 * set_session_state) mit dem Publishable Key aus platform/multiplayer/mp-config.js. Keine eigenen Tabellen.
 *   shared            → gemeinsamer Spielstand (Engine: exportShared/applyShared)
 *   pos:<Nutzer-ID>   → eigene Position (Halle, Standpunkt, Blickrichtung), nur vom eigenen Gerät geschrieben
 *   chat              → Funk: { m: [{ id, u, n, t, x }] } – wird wie alles andere vereinigt, nichts geht verloren
 * Fehlt die Plattform (kein Netz), bleibt das Spiel ganz normal allein spielbar.
 */
(() => {
  "use strict";
  const N = window.SEKTOR9, E = N && N.engine;
  const root = document.getElementById("mpEntry");
  if (!root || !E) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const GAME = "sektor-9", MAX = 4;
  // Freigabe: erst wenn „sektor-9“ in der Supabase-Tabelle game_catalog steht (Dashboard). Bis dahin nur mit ?mp=1 sichtbar (Tests).
  const ENABLED = true; // game_catalog-Eintrag „sektor-9“ (Präfix ECHO) ist angelegt
  if (!ENABLED && !/[?&]mp=1\b/.test(location.search)) { root.remove(); return; }
  const COLORS = ["#e0b45a", "#6fb7e0", "#e07a6a", "#b48ee0", "#8fd19e"];
  if (!window.MRMultiplayer || !window.MRLobby) { root.innerHTML = `<p class="mp-entry-copy">Gemeinsames Spielen ist gerade nicht verfügbar. Allein geht es jederzeit.</p>`; return; }

  let client;
  try { client = window.MRMultiplayer.connect({ gameSlug: GAME, maxPlayers: MAX }); }
  catch (e) { root.innerHTML = `<p class="mp-status" data-kind="error">${esc(e.message)}</p>`; return; }
  let link = null, saveKey = null;

  const colorOf = (uid) => { const i = client.players.findIndex((p) => p.user_id === uid); return COLORS[(i < 0 ? 0 : i) % COLORS.length]; };
  /* ---------- Team: Positionen der anderen ---------- */
  function team() {
    if (!link || !client.session) return;
    E.setTeam(client.players.filter((p) => !client.user || p.user_id !== client.user.id).map((p) => ({ id: p.user_id, name: p.player_name, color: colorOf(p.user_id), pos: client.states["pos:" + p.user_id] || null })));
  }
  /* ---------- Funk ---------- */
  function chatIn() {
    const st = client.states.chat; const me = client.user && client.user.id;
    E.setChat(((st && st.m) || []).map((m) => ({ ...m, mine: m.u === me, color: colorOf(m.u) })));
  }
  function sendChat(text) {
    if (!client.session || !client.user) return;
    const msg = { id: client.user.id.slice(0, 8) + "-" + Date.now().toString(36), u: client.user.id, n: client.playerName(client.user.id) || "?", t: Date.now(), x: String(text).slice(0, 240) };
    const st = client.states.chat || { m: [] }; client.states.chat = { m: [...(st.m || []), msg] }; chatIn(); // sofort selbst sehen
    client.writeMerged("chat", { m: [msg] }).catch(() => toast("Funk gestört – Nachricht wird erneut gesendet, sobald die Verbindung steht."));
  }

  /* ---------- kurze Meldungen ---------- */
  const toastEl = document.createElement("div"); toastEl.className = "mp-toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite"); document.body.appendChild(toastEl);
  let toastTimer = null;
  function toast(html, ms = 5200) { toastEl.innerHTML = html; toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms); }
  let lastError = 0;
  client.on("error", () => { if (Date.now() - lastError < 30000) return; lastError = Date.now(); if (link) toast("Verbindung zum Team gestört – es wird automatisch weiter versucht."); });

  /* ---------- Sitzung ↔ Engine ---------- */
  function attach(session) {
    if (link) return;
    saveKey = "sektor9_mp_" + session.session_id;
    E.enterMultiplayer({
      saveKey,
      changed: () => link && link.changed(),
      sendChat,
      code: () => (client.session ? client.session.room_code : ""),
      name: () => (client.user ? client.playerName(client.user.id) : ""),
      slot: () => Math.max(0, client.players.findIndex((p) => client.user && p.user_id === client.user.id)),
      leave: () => { if (confirm("Sitzung wirklich verlassen? Als Host beendest du sie damit für alle.")) lobby.leave(); },
    });
    link = window.MRMultiplayer.sync(client, {
      exportShared: E.exportShared,
      normalize: E.normalizeShared,
      applyShared: (state, byName) => { const news = E.applyShared(state); if (news.length && E.inGame()) toast(`<b>${esc(byName || "Dein Team")}</b> · ${news.slice(0, 3).map(esc).join(" · ")}${news.length > 3 ? " …" : ""}`); },
      position: E.position,
      onTeam: team,
    });
    link.ready.then(() => { team(); chatIn(); });
    paintBody();
  }
  function detach() {
    if (link) link.stop(); link = null;
    if (saveKey) { try { localStorage.removeItem(saveKey); } catch (e) { /* privat */ } saveKey = null; }
    if (E.isMultiplayer()) E.leaveMultiplayer();
    paintBody();
    if (E.inGame()) location.reload(); // zurück zum eigenen Einsatz
  }
  client.on("state", (row) => { if (row.state_key === "chat") chatIn(); });
  const paintBody = () => document.body.classList.toggle("mp-session", Boolean(client.session));

  const lobby = window.MRLobby.mount({
    client, root,
    texts: {
      title: "Gemeinsam ermitteln",
      copy: "Erstellt eine gemeinsame Sitzung oder tretet mit dem Einsatzcode bei. Jeder bewegt sich frei durch die Anlage. Gelöste Rätsel, Türen und die Ausrüstung teilt ihr – Funde nur, wenn ihr sie ins Team-Archiv legt.",
      lobbyKicker: "SEKTOR 9 · UNTERSUCHUNGSEINHEIT 4",
      lobbyTitle: "Die Einheit sammelt sich",
      namePlaceholder: "Rufname, z. B. Alex",
      codePlaceholder: "CODE-XXXXXX",
      hostWaiting: "Teile den Einsatzcode mit deiner Einheit. Nur du kannst die Anlage öffnen.",
      guestWaiting: "Du bist eingeteilt. Warte, bis die Einsatzleitung die Anlage öffnet.",
      start: "Anlage betreten",
      running: "Euer Einsatz läuft. Du kannst jederzeit zurückkehren.",
      enter: "Zurück in die Anlage",
      playersHead: "EINHEIT",
    },
    buttons: { primary: "btn", ghost: "btn ghost", danger: "btn ghost" },
    prepare: { label: "Einsatzauftrag lesen", againLabel: "✓ Bereit – Auftrag noch einmal lesen", run: (done) => E.showBriefing(done) },
    onEnter(session) { attach(session); E.start(); },
    onLeft() { detach(); },
  });
  client.on("players", () => { paintBody(); team(); });
  client.on("status", paintBody);

  // Nach dem Neuladen: laufende Sitzung wiederfinden (Spielstand bleibt erhalten)
  let stored = null; try { stored = localStorage.getItem("mr_mp_session_v1:" + GAME); } catch (e) { /* privat */ }
  if (stored) lobby.restore().then((s) => { if (s && s.status === "running") attach(s); paintBody(); });
  N.multiplayer = { client, lobby, isActive: () => Boolean(link) };
})();
