/*
 * DEADLINE.exe – Anbindung an den Multiplayer der Plattform
 *
 * Geteilt werden gelöste Schritte, Hinweise, Nachrichten, Ereignisse, die Laufzeit
 * (es zählt die längste) und das Ende. Fenster, Schwärzungen und Eingaben bleiben
 * bei jeder Person. Ohne Plattform oder Netz läuft das Spiel allein weiter.
 */
(() => {
  "use strict";
  const G = window.DL && DL.game, root = document.getElementById("mpEntry");
  if (!G || !root) return;
  const esc = DL.esc;
  const CFG = { gameSlug: "deadline", maxPlayers: 4, storeKey: "mr_mp_session_v1:deadline", savePrefix: "deadline2_mp_" };
  if (!window.MRMultiplayer || !window.MRLobby) { root.innerHTML = `<p class="mp-entry-copy">Gemeinsames Spielen ist gerade nicht verfügbar. Allein ermitteln geht jederzeit.</p>`; return; }

  let client;
  try { client = window.MRMultiplayer.connect({ gameSlug: CFG.gameSlug, maxPlayers: CFG.maxPlayers, storeKey: CFG.storeKey }); }
  catch (e) { root.innerHTML = `<p class="mp-status" data-kind="error">${esc(e.message)}</p>`; return; }

  let link = null, saveKey = null, beat = null;
  const dot = document.getElementById("teamDot");
  function renderTeam(list = []) {
    dot.hidden = !link;
    if (!link) return;
    dot.title = `Team ${client.session ? client.session.room_code : ""}: ` + (list.length ? list.map((p) => p.name + (p.pos && p.pos.view ? " (" + p.pos.view + ")" : "")).join(", ") : "noch niemand sonst da");
  }
  const toastEl = document.createElement("div");
  toastEl.className = "mp-toast"; toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  let tt = null;
  const toast = (html) => { toastEl.innerHTML = html; toastEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove("show"), 5000); };
  let lastErr = 0;
  client.on("error", () => { if (Date.now() - lastErr < 30000 || !link) return; lastErr = Date.now(); toast("Verbindung zum Team gestört – es wird automatisch weiter versucht."); });

  function position() {
    const top = DL.os.wins.filter((w) => !w.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    return { room: "desk", roomName: "Desktop", view: top ? DL.apps[top.app].title(top.arg) : "Desktop" };
  }
  function attach(session) {
    if (link) return;
    saveKey = CFG.savePrefix + session.session_id;
    G.enterMultiplayer({ saveKey, changed: () => link && link.changed(), draftChanged });
    link = window.MRMultiplayer.sync(client, {
      exportShared: G.exportShared,
      applyShared: (state, byName) => { const news = G.applyShared(state); if (news.length && byName) toast(`<b>${esc(byName)}</b> · ${news.map(esc).join(" · ")}`); },
      position,
      onTeam: renderTeam,
    });
    link.ready.then(() => { const d = client.states.draft; if (d) G.applyDraft(d, null); }).catch(() => {});
    if (!beat) beat = setInterval(() => { if (link) link.changed(); }, 15000); // Laufzeit und Position regelmäßig teilen
    renderTeam([]);
    paint();
  }
  /* Entwurf der Entscheidung: ein gemeinsamer Eintrag, die letzte Änderung gilt */
  let draftTimer = null;
  function draftChanged(d) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { if (link) client.writeOwn("draft", { redact: d.redact, target: d.target, at: d.at }).catch((e) => client.emit("error", e)); }, 250);
  }
  client.on("state", (row) => {
    if (!link || row.state_key !== "draft") return;
    if (client.user && row.updated_by === client.user.id) return;
    G.applyDraft(row.state, client.playerName(row.updated_by) || "Team");
  });
  function detach() {
    if (link) link.stop();
    link = null; renderTeam();
    if (saveKey) { try { localStorage.removeItem(saveKey); } catch (e) { /* privat */ } saveKey = null; }
    if (G.isMultiplayer()) G.leaveMultiplayer();
    DL.os.leaveToTitle();
    paint();
  }
  const paint = () => document.body.classList.toggle("mp-session", Boolean(client.session));

  const lobby = window.MRLobby.mount({
    client, root,
    buttons: { primary: "btn small", ghost: "btn ghost small", danger: "btn danger small" },
    texts: {
      title: "Gemeinsam ermitteln",
      copy: "Bis zu vier Personen untersuchen denselben Computer – jede in ihren eigenen Fenstern. Gelöste Schritte, Hinweise und der Countdown gehören allen.",
      open: "Gemeinsam ermitteln",
      lobbyKicker: "PRIVATE SITZUNG",
      lobbyTitle: "Gemeinsamer Zugriff",
      start: "Zugriff starten",
      running: "Eure Sitzung läuft. Du kannst jederzeit zurückkehren.",
      enter: "Zurück an den Rechner",
    },
    onEnter(session) {
      attach(session);
      const S = G.state;
      if (!S.started) { const r = document.querySelector('input[name="mode"]:checked'); G.newGame({ relaxed: r ? r.value === "relaxed" : false }); link && link.changed(); }
      DL.os.boot(!G.state.completed.length && G.state.elapsed < 30);
    },
    onLeft() { detach(); },
  });
  client.on("players", paint);
  client.on("status", paint);
  let stored = null; try { stored = localStorage.getItem(CFG.storeKey); } catch (e) { /* privat */ }
  if (stored) lobby.restore().then((s) => { if (s && s.status === "running") { attach(s); DL.os.paintTitle(); } paint(); });
  DL.multiplayer = { client, lobby, isActive: () => Boolean(link) };
})();
