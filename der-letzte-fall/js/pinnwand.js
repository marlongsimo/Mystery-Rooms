/* DER LETZTE FALL – Pinnwand-Prototyp: allein (Browser) oder gemeinsam (Supabase-Sitzung) */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL_KEY = "mr_board:der-letzte-fall:prototyp";
  const NAME_KEY = "mr_mp_player_name";

  let board = null, client = null, shared = false;

  /* ---------- Karte genauer ansehen ---------- */
  function openCard(card) {
    $("#viewerBody").innerHTML = `${card.kind === "photo" && card.art ? `<div class="viewer-art">${card.art}</div>` : ""}${card.body || `<article class="pv-paper"><p>${esc(card.title)}</p></article>`}`;
    $("#viewer").hidden = false;
  }
  $("#closeViewer").addEventListener("click", () => { $("#viewer").hidden = true; });
  $("#viewer").addEventListener("click", (e) => { if (e.target.id === "viewer") $("#viewer").hidden = true; });

  const toast = (t) => { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); };

  /* ---------- Wand einhängen ---------- */
  function mountBoard(store) {
    board = MRBoard.mount({ el: $("#board"), template: window.DLF_WALL, store, onOpen: openCard });
    renderEvidence();
  }

  /* ---------- Beweise aus der Akte ---------- */
  function renderEvidence() {
    $("#evidenceList").innerHTML = window.DLF_EVIDENCE.map((e) => {
      const on = board && board.has(e.id);
      return `<button type="button" class="ev" data-ev="${e.id}" ${on ? "disabled" : ""}><span><b>${esc(e.title)}</b><small>${esc(e.sub)}${on ? " · hängt an der Wand" : ""}</small></span><span class="plus">${on ? "✓" : "＋"}</span></button>`;
    }).join("");
  }
  $("#evidenceList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ev]"); if (!b || b.disabled) return;
    const ev = window.DLF_EVIDENCE.find((x) => x.id === b.dataset.ev);
    if (board.pin(ev)) { toast(`„${ev.title}“ hängt jetzt an der Wand.`); closePanels(); }
    renderEvidence();
  });
  $("#resetBoard").addEventListener("click", () => {
    if (shared) return toast("In einer gemeinsamen Sitzung wird die Wand nicht zurückgesetzt.");
    if (!confirm("Alle eigenen Änderungen an der Wand verwerfen?")) return;
    try { localStorage.removeItem(LOCAL_KEY); } catch (e) { /* privat */ }
    mountBoard(MRBoard.localStore(LOCAL_KEY)); closePanels();
  });

  /* ---------- Seitenleisten ---------- */
  const closePanels = () => document.querySelectorAll(".panel").forEach((p) => p.classList.remove("open"));
  $("#openEvidence").addEventListener("click", () => { const p = $("#evidencePanel"), open = !p.classList.contains("open"); closePanels(); p.classList.toggle("open", open); renderEvidence(); });
  $("#openTeam").addEventListener("click", () => { const p = $("#teamPanel"), open = !p.classList.contains("open"); closePanels(); p.classList.toggle("open", open); renderTeam(); });

  /* ---------- Gemeinsam (Prototyp) ---------- */
  const setStatus = (t, ok) => { $("#teamStatus").textContent = t || ""; $("#teamStatus").classList.toggle("ok", Boolean(ok)); };
  function renderTeam() {
    const s = client && client.session;
    if (!s) {
      let name = ""; try { name = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ }
      $("#teamBody").innerHTML = `<label class="f"><span>Dein Name</span><input id="tName" maxlength="24" value="${esc(name)}" placeholder="z. B. Alex"></label>
        <button class="btn gold" id="tCreate" type="button">Sitzung erstellen</button>
        <label class="f"><span>Einladungscode</span><input id="tCode" maxlength="11" placeholder="NOCT-XXXXXX" autocapitalize="characters"></label>
        <button class="btn" id="tJoin" type="button">Beitreten</button>`;
      return;
    }
    $("#teamBody").innerHTML = `<div class="code">${esc(s.room_code)}</div>
      <ul class="players">${client.players.map((p) => `<li>${esc(p.player_name)}${p.is_host ? " · Host" : ""}</li>`).join("")}</ul>
      <button class="btn" id="tLeave" type="button">Sitzung verlassen – allein weiter</button>`;
  }
  async function goShared() {
    await client.fetchStates();
    shared = true;
    mountBoard(MRBoard.sessionStore(client));
    $("#openTeam").classList.add("live"); $("#openTeam").textContent = "Gemeinsam ●";
    renderTeam();
  }
  function goLocal() {
    shared = false;
    mountBoard(MRBoard.localStore(LOCAL_KEY));
    $("#openTeam").classList.remove("live"); $("#openTeam").textContent = "Gemeinsam";
    renderTeam();
  }
  $("#teamBody").addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    try {
      if (b.id === "tCreate" || b.id === "tJoin") {
        const name = ($("#tName").value || "").trim();
        if (!name) return setStatus("Bitte zuerst einen Namen eingeben.");
        try { localStorage.setItem(NAME_KEY, name); } catch (x) { /* privat */ }
        setStatus("Verbinde …", true);
        if (b.id === "tCreate") await client.create(name);
        else await client.join(($("#tCode").value || "").trim().toUpperCase(), name);
        await goShared();
        setStatus("Verbunden. Änderungen an der Wand sehen jetzt alle.", true);
      }
      if (b.id === "tLeave") { await client.leave(); goLocal(); setStatus("Du spielst wieder allein."); }
    } catch (err) { setStatus(err.message || String(err)); }
  });

  /* ---------- Start ---------- */
  try {
    client = MRMultiplayer.connect({ gameSlug: "hotel-nocturne", maxPlayers: 4, storeKey: "mr_mp_session_v1:dlf-pinnwand-prototyp" });
    // Änderungen anderer kurz anzeigen (einmal registriert)
    client.on("state", (row) => {
      if (!shared || !String(row.state_key).startsWith("board:")) return;
      if (row.updated_by && client.user && row.updated_by !== client.user.id) toast(`${client.playerName(row.updated_by) || "Jemand"} hat die Wand geändert.`);
      renderEvidence();
    });
    client.on("players", renderTeam);
    client.on("lost", (reason) => { goLocal(); setStatus(reason || "Die Sitzung wurde beendet."); });
  } catch (e) { client = null; }
  goLocal();
  // Nach dem Neuladen: laufende Testsitzung wiederfinden
  if (client) client.restore().then((s) => { if (s) return goShared().then(() => setStatus("Verbindung zur Sitzung wiederhergestellt.", true)); }).catch(() => {});
  window.DLF = { get board() { return board; }, get client() { return client; } };
})();
