/* DER LETZTE FALL – Pinnwand-Prototyp: allein (Browser) oder gemeinsam (Supabase-Sitzung) */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL_KEY = "mr_board:der-letzte-fall:prototyp";
  const CASE_KEY = "mr_case:der-letzte-fall:prototyp";
  const CASE = window.DLF_CASE;
  const NAME_KEY = "mr_mp_player_name";

  let board = null, client = null, shared = false;
  let caseStore = null, caseState = {}, justChanged = null;

  /* ---------- Karte genauer ansehen ---------- */
  function openCard(card) {
    $("#viewerBody").innerHTML = `${card.kind === "photo" && card.art ? `<div class="viewer-art">${card.art}</div>` : ""}${card.body || `<article class="pv-paper"><p>${esc(card.title)}</p></article>`}`;
    $("#viewer").hidden = false;
  }
  $("#closeViewer").addEventListener("click", () => { $("#viewer").hidden = true; });
  $("#viewer").addEventListener("click", (e) => { if (e.target.id === "viewer") $("#viewer").hidden = true; });

  const toast = (t) => { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); };

  /* ---------- Spielstand: Entlastungen, Bestätigungen, Beweisführung ---------- */
  const st = (id) => caseState[id] || {};
  const refuted = (tid) => st(tid).status === "refuted";
  const confirmed = (tid) => st(tid).status === "confirmed";
  const solved = () => Boolean(st("proof").solved);
  const titleOf = (id) => { const c = (board && board.get(id)) || window.DLF_EVIDENCE.find((e) => e.id === id); return c ? c.title : id; };
  const who = (uid) => (shared && client && uid ? client.playerName(uid) : "") || "";

  function decorate(o) {
    if (o.type === "thread") {
      if (refuted(o.id)) return { cls: "refuted" + (justChanged === o.id ? " just" : ""), tag: "✕ widerlegt" };
      if (confirmed(o.id)) return { cls: "confirmed" + (justChanged === o.id ? " just" : ""), color: "green", tag: "✓ bestätigt" };
      return null;
    }
    const tid = Object.keys(CASE.refute).find((k) => CASE.refute[k].person === o.id);
    if (tid && refuted(tid)) return { cls: "cleared" + (justChanged === tid ? " stamp-in" : ""), stamp: "ENTLASTET" };
    if (o.id === "keller" && solved()) return { cls: "convicted" + (justChanged === "proof" ? " stamp-in" : ""), stamp: "ÜBERFÜHRT" };
    return null;
  }
  function threadMenu(t) {
    const r = CASE.refute[t.id], c = CASE.confirm[t.id];
    if (!r && !c) return null;
    const s = st(t.id), by = who(s.by);
    if (r && refuted(t.id)) return { title: "Widerlegt", note: `Entlastet durch „${titleOf(s.with)}“${by ? ` (${by})` : ""}.`, actions: [] };
    if (c && confirmed(t.id)) return { title: "Bestätigt", note: `Belegt durch „${titleOf(s.with)}“${by ? ` (${by})` : ""}.`, actions: [] };
    if (r) return { title: "Hagedorns Verdacht", note: "Hagedorns Fäden lassen sich nicht abreißen – nur mit einem Beweis widerlegen.", actions: [{ id: "refute", label: "Widerlegen mit …", primary: true }] };
    return { title: "Hagedorns offene Frage", note: "Freiwillig: Lässt sich das belegen?", actions: [{ id: "confirm", label: "Bestätigen mit …", primary: true }] };
  }
  const isLocked = (o) => o.type === "thread" && o.author === "hagedorn";

  function setCase(obj) {
    caseState[obj.id] = obj; justChanged = obj.id;
    caseStore.put(obj);
    board.redraw(); renderProof();
    setTimeout(() => { if (justChanged === obj.id) justChanged = null; }, 1800);
  }

  /* Beweis auswählen: alles, was an der Wand hängt (außer den beiden Enden des Fadens) */
  function wallCards(exclude = []) {
    return board.all().filter((o) => o.type === "card" && !exclude.includes(o.id) && !["mira", "timo", "ruth", "keller", "mond"].includes(o.id));
  }
  function openPicker(t, mode) {
    const rule = (mode === "refute" ? CASE.refute : CASE.confirm)[t.id];
    const cards = wallCards([t.from, t.to]);
    $("#pickerTitle").textContent = mode === "refute" ? "Widerlegen mit …" : "Bestätigen mit …";
    $("#pickerNote").textContent = `„${t.label}“`;
    $("#pickerList").innerHTML = cards.map((c) => `<button type="button" class="ev" data-pick="${c.id}"><span><b>${esc(c.title)}</b><small>${esc(c.sub || "")}</small></span></button>`).join("")
      + `<p class="pick-more">Passender Beweis fehlt? Erst über „Beweise“ an die Wand hängen.</p>`;
    $("#pickerFeedback").textContent = ""; $("#pickerFeedback").className = "feedback";
    $("#picker").hidden = false;
    $("#pickerList").onclick = (e) => {
      const b = e.target.closest("[data-pick]"); if (!b) return;
      const ev = b.dataset.pick;
      if (rule.accept.includes(ev)) {
        $("#picker").hidden = true;
        setCase({ id: t.id, status: mode === "refute" ? "refuted" : "confirmed", with: ev, by: client && client.user ? client.user.id : null, at: Date.now() });
        if (mode === "refute") {
          const person = board.get(rule.person);
          toast(`${person ? person.title : "Verdacht"} ist entlastet.`);
        } else toast("Hagedorns Spur ist bestätigt.");
        return;
      }
      $("#pickerFeedback").textContent = (rule.wrong && rule.wrong[ev]) || rule.fail;
      $("#pickerFeedback").className = "feedback bad";
      b.classList.add("nope"); setTimeout(() => b.classList.remove("nope"), 500);
    };
  }
  $("#pickerClose").addEventListener("click", () => { $("#picker").hidden = true; });
  $("#picker").addEventListener("click", (e) => { if (e.target.id === "picker") $("#picker").hidden = true; });

  /* ---------- Beweisführung ---------- */
  function renderProof() {
    const P = CASE.proof, s = st("proof"), slots = s.slots || {};
    const cards = board ? wallCards() : [];
    const cleared = P.requireRefuted.filter(refuted).length;
    $("#openProof").classList.toggle("done", solved());
    if (solved()) {
      $("#proofBody").innerHTML = `<div class="solved"><b>✓ Fall gelöst</b><p>${esc(P.solved)}</p></div>` + P.slots.map((x) => `<p class="slot-done"><span>${esc(x.label)}</span>${esc(titleOf(slots[x.id]))}</p>`).join("");
      return;
    }
    $("#proofBody").innerHTML = `<p class="cleared ${cleared === P.requireRefuted.length ? "ok" : ""}">Entlastet: ${cleared} von ${P.requireRefuted.length}</p>`
      + P.slots.map((x) => `<label class="f slot"><span>${esc(x.label)} · ${esc(x.q)}</span><select data-slot="${x.id}"><option value="">– Beweis wählen –</option>${cards.map((c) => `<option value="${c.id}" ${slots[x.id] === c.id ? "selected" : ""}>${esc(c.title)}</option>`).join("")}</select></label>`).join("")
      + `<button class="btn gold" id="submitProof" type="button">Bericht an Dr. Wessel übergeben</button>`
      + (s.result ? `<p class="feedback ${s.result.ok ? "good" : "bad"}">${esc(s.result.text)}</p>` : "");
  }
  $("#proofBody").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-slot]"); if (!sel) return;
    const s = st("proof");
    setCase({ id: "proof", slots: { ...(s.slots || {}), [sel.dataset.slot]: sel.value || null }, result: null });
  });
  $("#proofBody").addEventListener("click", (e) => {
    if (!e.target.closest("#submitProof")) return;
    const P = CASE.proof, s = st("proof"), slots = s.slots || {};
    if (P.slots.some((x) => !slots[x.id])) return setCase({ ...s, id: "proof", result: { ok: false, text: "Wessel will alle vier Felder belegt sehen." } });
    if (!P.requireRefuted.every(refuted)) return setCase({ ...s, id: "proof", result: { ok: false, text: P.missing } });
    const n = P.slots.filter((x) => x.accept.includes(slots[x.id])).length;
    if (n === P.slots.length) { setCase({ ...s, id: "proof", solved: true, result: { ok: true, text: P.solved } }); toast("Fall gelöst."); return; }
    setCase({ ...s, id: "proof", result: { ok: false, text: `${n} von ${P.slots.length} Feldern sind schlüssig.` } });
  });

  /* ---------- Wand einhängen ---------- */
  function mountBoard(store, cStore) {
    caseStore = cStore;
    caseState = { ...cStore.load() };
    cStore.subscribe((obj) => {
      if (!obj || !obj.id) return;
      const was = caseState[obj.id] || {};
      caseState[obj.id] = obj;
      if (obj.status && obj.status !== was.status) { justChanged = obj.id; toast(`${who(obj.by) || "Jemand"} hat ${obj.status === "refuted" ? "einen Verdacht widerlegt" : "eine Spur bestätigt"}.`); }
      if (obj.id === "proof" && obj.solved && !was.solved) { justChanged = "proof"; toast("Fall gelöst."); }
      board.redraw(); renderProof();
    });
    board = MRBoard.mount({ el: $("#board"), template: window.DLF_WALL, store, onOpen: openCard,
      decorate, threadMenu, locked: isLocked, onThreadAction: (t, a) => openPicker(t, a) });
    renderEvidence(); renderProof();
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
    try { localStorage.removeItem(LOCAL_KEY); localStorage.removeItem(CASE_KEY); } catch (e) { /* privat */ }
    mountBoard(MRBoard.localStore(LOCAL_KEY), MRBoard.localStore(CASE_KEY)); closePanels();
  });

  /* ---------- Seitenleisten ---------- */
  const closePanels = () => document.querySelectorAll(".panel").forEach((p) => p.classList.remove("open"));
  $("#openEvidence").addEventListener("click", () => { const p = $("#evidencePanel"), open = !p.classList.contains("open"); closePanels(); p.classList.toggle("open", open); renderEvidence(); });
  $("#openProof").addEventListener("click", () => { const p = $("#proofPanel"), open = !p.classList.contains("open"); closePanels(); p.classList.toggle("open", open); renderProof(); });
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
    mountBoard(MRBoard.sessionStore(client), MRBoard.sessionStore(client, "case:"));
    $("#openTeam").classList.add("live"); $("#openTeam").textContent = "Gemeinsam ●";
    renderTeam();
  }
  function goLocal() {
    shared = false;
    mountBoard(MRBoard.localStore(LOCAL_KEY), MRBoard.localStore(CASE_KEY));
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
      renderEvidence(); if (!$("#proofPanel").classList.contains("open")) renderProof();
    });
    client.on("players", renderTeam);
    client.on("lost", (reason) => { goLocal(); setStatus(reason || "Die Sitzung wurde beendet."); });
  } catch (e) { client = null; }
  goLocal();
  // Nach dem Neuladen: laufende Testsitzung wiederfinden
  if (client) client.restore().then((s) => { if (s) return goShared().then(() => setStatus("Verbindung zur Sitzung wiederhergestellt.", true)); }).catch(() => {});
  window.DLF = { get board() { return board; }, get client() { return client; }, get state() { return caseState; } };
})();
