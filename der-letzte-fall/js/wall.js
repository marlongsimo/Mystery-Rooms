/*
 * DER LETZTE FALL – Hagedorns Wand im Spiel (Tablet)
 *
 * Nutzt den Plattform-Baustein platform/board/board.js. Startzustand und Regeln stehen in
 * js/wand.js (DLF_WALL, DLF_CASE). Beweise kommen aus der Akte: jedes Dokument mit `card`
 * kann an die Wand. Widerlegen/Bestätigen setzt Zustände (Flags), die die Engine im Team
 * teilt; daraus ergeben sich die Rätsel „blackout“, „stoffspur“ und „beweisfuehrung“.
 * Allein liegt die Wand im Browser, gemeinsam als board:-Einträge der Sitzung.
 */
(() => {
  "use strict";
  const N = window.MRGAME, E = N.engine, CASE = window.DLF_CASE;
  if (!E || !window.MRBoard || !CASE) return;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const A = N.audio;

  /* ---------- Startwand (Hagedorns Foto) + seine letzte Notiz ---------- */
  const TEMPLATE = {
    cards: window.DLF_WALL.cards.concat([
      { id: "n-vorhang", type: "note", x: 1220, y: 1160, rot: 3, author: "hagedorn", color: "#f3e58a", text: "Wenn du den letzten Vorhang siehst …" },
    ]),
    threads: window.DLF_WALL.threads,
  };
  const PERSONS = ["mira", "timo", "ruth", "keller", "mond"];
  /** Welche Rätsel an der Wand entstehen */
  const WALL_PUZZLES = [
    { pid: "blackout", needs: ["t-timo", "t-mira"] },
    { pid: "stoffspur", needs: ["t-ruth"] },
  ];
  const refuted = (tid) => E.has("widerlegt_" + tid);
  const confirmed = (tid) => E.has("bestaetigt_" + tid);

  /* ---------- Karten aus Dokumenten ---------- */
  const docArt = (seed) => `<svg viewBox="0 0 180 90" preserveAspectRatio="none"><rect width="180" height="90" fill="#efe7d4"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="12" y="${12 + i * 14}" width="${150 - ((seed.length * 7 + i * 31) % 60)}" height="5" fill="#b9ab8c"/>`).join("")}</svg>`;
  function cardFor(id) {
    const d = N.docs[id];
    if (!d || !d.card) return null;
    const proto = (window.DLF_EVIDENCE || []).find((e) => e.id === id) || {};
    return {
      id, kind: d.card.kind || proto.kind || "doc",
      title: d.card.title || d.title, sub: d.card.sub || proto.sub || "",
      art: d.card.art || proto.art || docArt(id),
      body: `<div class="wall-doc">${E.docHtml(id)}</div>`,
    };
  }
  const evidenceIds = () => E.docs().filter((id) => N.docs[id] && N.docs[id].card);

  /* ---------- Einhängen (je Spielstand bzw. Sitzung eine eigene Wand) ---------- */
  let board = null, boardKey = null, seen = new Set(), justChanged = null;
  function storeNow() {
    const mp = N.multiplayer;
    if (mp && mp.isActive() && mp.client && mp.client.session) return { key: "mp:" + mp.client.session.session_id, make: () => MRBoard.sessionStore(mp.client) };
    const key = "dlf_board:" + E.saveKey();
    return { key, make: () => MRBoard.localStore(key) };
  }
  function ensureBoard() {
    const st = storeNow();
    if (board && boardKey === st.key) return board;
    boardKey = st.key;
    try { seen = new Set(JSON.parse(localStorage.getItem(seenKey()) || "[]")); } catch (e) { seen = new Set(); }
    board = MRBoard.mount({
      el: $("#wallBoard"), template: TEMPLATE, store: st.make(), onOpen: openCard,
      decorate, threadMenu, locked: (o) => o.type === "thread" && o.author === "hagedorn",
      onThreadAction: (t, a) => openPicker(t, a),
    });
    return board;
  }
  const seenKey = () => "dlf_wall_seen:" + E.saveKey();
  const saveSeen = () => { try { localStorage.setItem(seenKey(), JSON.stringify([...seen])); } catch (e) { /* privat */ } };

  /* ---------- Darstellung des Spielstands ---------- */
  function decorate(o) {
    if (o.type === "thread") {
      if (refuted(o.id)) return { cls: "refuted" + (justChanged === o.id ? " just" : ""), tag: "✕ widerlegt" };
      if (confirmed(o.id)) return { cls: "confirmed" + (justChanged === o.id ? " just" : ""), color: "green", tag: "✓ bestätigt" };
      return null;
    }
    const tid = Object.keys(CASE.refute).find((k) => CASE.refute[k].person === o.id);
    if (tid && refuted(tid)) return { cls: "cleared" + (justChanged === tid ? " stamp-in" : ""), stamp: "ENTLASTET" };
    if (o.id === "keller" && E.isSolved("beweisfuehrung")) return { cls: "convicted", stamp: "ÜBERFÜHRT" };
    return null;
  }
  function threadMenu(t) {
    const r = CASE.refute[t.id], c = CASE.confirm[t.id];
    if (!r && !c) return null;
    if (r && refuted(t.id)) return { title: "Widerlegt", note: "Dieser Verdacht ist ausgeräumt.", actions: [] };
    if (c && confirmed(t.id)) return { title: "Bestätigt", note: "Hagedorn lag richtig.", actions: [] };
    if (r) return { title: "Hagedorns Verdacht", note: "Hagedorns Fäden lassen sich nicht abreißen – nur mit einem Beweis widerlegen.", actions: [{ id: "refute", label: "Widerlegen mit …", primary: true }] };
    return { title: "Hagedorns offene Frage", note: "Freiwillig: Lässt sich das belegen?", actions: [{ id: "confirm", label: "Bestätigen mit …", primary: true }] };
  }

  /* ---------- Karte ansehen ---------- */
  function openCard(card) {
    const showArt = card.kind === "photo" && card.art && !String(card.body || "").includes("wall-doc");
    $("#wallViewerBody").innerHTML = `${showArt ? `<div class="viewer-art">${card.art}</div>` : ""}${card.body || `<article class="pv-paper"><p>${esc(card.title)}</p></article>`}`;
    $("#wallViewer").hidden = false;
  }
  $("#wallViewerClose").addEventListener("click", () => { $("#wallViewer").hidden = true; });
  $("#wallViewer").addEventListener("click", (e) => { if (e.target.id === "wallViewer") $("#wallViewer").hidden = true; });
  const toast = (t, ms = 3200) => { const el = $("#wallToast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), ms); };

  /* ---------- Widerlegen / Bestätigen ---------- */
  const wallCards = (exclude = []) => board.all().filter((o) => o.type === "card" && !exclude.includes(o.id) && !PERSONS.includes(o.id));
  function openPicker(t, mode) {
    const rule = (mode === "refute" ? CASE.refute : CASE.confirm)[t.id];
    const cards = wallCards([t.from, t.to]);
    $("#wallPickerTitle").textContent = mode === "refute" ? "Widerlegen mit …" : "Bestätigen mit …";
    $("#wallPickerNote").textContent = `„${t.label}“`;
    $("#wallPickerList").innerHTML = cards.map((c) => `<button type="button" class="ev" data-pick="${c.id}"><span><b>${esc(c.title)}</b><small>${esc(c.sub || "")}</small></span></button>`).join("")
      + `<p class="pick-more">Passender Beweis fehlt? Erst über „Beweise“ an die Wand hängen.</p>`;
    $("#wallPickerFeedback").textContent = ""; $("#wallPickerFeedback").className = "wall-feedback";
    $("#wallPicker").hidden = false;
    $("#wallPickerList").onclick = (e) => {
      const b = e.target.closest("[data-pick]"); if (!b) return;
      const ev = b.dataset.pick;
      if (rule.accept.includes(ev)) {
        $("#wallPicker").hidden = true;
        justChanged = t.id; setTimeout(() => { if (justChanged === t.id) justChanged = null; }, 1800);
        A.play("stamp");
        E.setFlag((mode === "refute" ? "widerlegt_" : "bestaetigt_") + t.id);
        board.redraw();
        if (mode === "refute") { const p = board.get(rule.person); toast(`${p ? p.title : "Der Verdacht"} ist entlastet.`); }
        else toast(t.id === "t-keller" ? "H.: „Also doch. Er hatte den Schlüssel.“" : "H.: „Zwei Minuten. Ich wusste, dass die Uhr lügt.“", 4200);
        checkWallPuzzles();
        return;
      }
      A.play("error");
      $("#wallPickerFeedback").textContent = (rule.wrong && rule.wrong[ev]) || rule.fail;
      $("#wallPickerFeedback").className = "wall-feedback bad";
      b.classList.add("nope"); setTimeout(() => b.classList.remove("nope"), 500);
    };
  }
  $("#wallPickerClose").addEventListener("click", () => { $("#wallPicker").hidden = true; });
  $("#wallPicker").addEventListener("click", (e) => { if (e.target.id === "wallPicker") $("#wallPicker").hidden = true; });
  let solving = false;
  function checkWallPuzzles() {
    if (solving || !E.inGame()) return;
    const w = WALL_PUZZLES.find((x) => !E.isSolved(x.pid) && x.needs.every(refuted));
    if (!w) return;
    solving = true;
    setTimeout(() => { solving = false; E.solveFromWall(w.pid); }, 900); // Erfolgsfenster liegt über der Wand
  }

  /* ---------- Beweisführung (Rätsel 15) ---------- */
  const draftKey = () => "dlf_proof:" + E.saveKey();
  let draft = {};
  const loadDraft = () => { try { draft = JSON.parse(localStorage.getItem(draftKey()) || "{}"); } catch (e) { draft = {}; } };
  const saveDraft = () => { try { localStorage.setItem(draftKey(), JSON.stringify(draft)); } catch (e) { /* privat */ } };
  const proofOpen = () => E.isSolved("kammer");
  function renderProof() {
    const P = CASE.proof;
    $("#wallProof").classList.toggle("hidden", !proofOpen());
    $("#wallProof").classList.toggle("done", E.isSolved("beweisfuehrung"));
    if (!board) return;
    const slots = draft.slots || {};
    if (E.isSolved("beweisfuehrung")) {
      $("#wallProofBody").innerHTML = `<div class="solved"><b>✓ Bericht angenommen</b><p>${esc(P.solved)}</p></div>`;
      return;
    }
    const cards = wallCards();
    const cleared = P.requireRefuted.filter(refuted).length;
    $("#wallProofBody").innerHTML = `<p class="cleared ${cleared === P.requireRefuted.length ? "ok" : ""}">Entlastet: ${cleared} von ${P.requireRefuted.length}</p>`
      + P.slots.map((x) => `<label class="f slot"><span>${esc(x.label)} · ${esc(x.q)}</span><select data-slot="${x.id}"><option value="">– Beweis wählen –</option>${cards.map((c) => `<option value="${c.id}" ${slots[x.id] === c.id ? "selected" : ""}>${esc(c.title)}</option>`).join("")}</select></label>`).join("")
      + `<button class="wall-btn gold" id="wallSubmitProof" type="button">Bericht an Dr. Wessel schicken</button>`
      + (draft.result ? `<p class="wall-feedback bad">${esc(draft.result)}</p>` : "")
      + `<p class="pick-more">Nur Beweise, die an der Wand hängen, stehen zur Auswahl.</p>`;
  }
  $("#wallProofBody").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-slot]"); if (!sel) return;
    draft.slots = { ...(draft.slots || {}), [sel.dataset.slot]: sel.value || null }; draft.result = null; saveDraft();
  });
  $("#wallProofBody").addEventListener("click", (e) => {
    if (!e.target.closest("#wallSubmitProof")) return;
    const P = CASE.proof, slots = draft.slots || {};
    let msg = null;
    if (P.slots.some((x) => !slots[x.id])) msg = "Wessel will alle vier Felder belegt sehen.";
    else if (!P.requireRefuted.every(refuted)) msg = P.missing;
    else {
      const n = P.slots.filter((x) => x.accept.includes(slots[x.id])).length;
      if (n < P.slots.length) msg = `${n} von ${P.slots.length} Feldern sind schlüssig.`;
    }
    if (msg) { A.play("error"); draft.result = msg; saveDraft(); renderProof(); return; }
    draft.result = null; saveDraft();
    A.play("stamp");
    close();
    E.solveFromWall("beweisfuehrung"); // letzter Raum → Finalszene
  });

  /* ---------- Beweise aus der Akte ---------- */
  function renderEvidence() {
    const ids = evidenceIds();
    $("#wallEvidenceList").innerHTML = ids.length ? ids.map((id) => {
      const c = cardFor(id), on = board && board.has(id);
      return `<button type="button" class="ev" data-ev="${id}" ${on ? "disabled" : ""}><span><b>${esc(c.title)}</b><small>${esc(c.sub)}${on ? " · hängt an der Wand" : ""}</small></span><span class="plus">${on ? "✓" : "＋"}</span></button>`;
    }).join("") : `<p class="pick-more">Noch keine Beweise in der Akte.</p>`;
  }
  $("#wallEvidenceList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ev]"); if (!b || b.disabled) return;
    const c = cardFor(b.dataset.ev);
    if (c && board.pin(c)) { A.play("paper"); toast(`„${c.title}“ hängt jetzt an der Wand.`); closePanels(); }
    renderEvidence(); renderButton();
  });

  /* ---------- Öffnen / Schließen ---------- */
  const closePanels = () => document.querySelectorAll(".wall-panel").forEach((p) => p.classList.remove("open"));
  const togglePanel = (id, render) => { const p = $(id), open = !p.classList.contains("open"); closePanels(); p.classList.toggle("open", open); if (open) render(); };
  $("#wallEvidence").addEventListener("click", () => togglePanel("#wallEvidencePanel", renderEvidence));
  $("#wallProof").addEventListener("click", () => togglePanel("#wallProofPanel", renderProof));
  function open(focus) {
    if (!E.has("wand_foto")) return;
    E.closePanels();
    $("#wall").hidden = false; document.body.classList.add("wall-open");
    ensureBoard(); loadDraft();
    A.play("click");
    board.redraw(); board.fit();
    evidenceIds().forEach((id) => seen.add(id)); saveSeen();
    closePanels(); renderButton(); renderProof();
    if (focus === "proof" && proofOpen()) togglePanel("#wallProofPanel", renderProof);
    if (focus === "evidence") togglePanel("#wallEvidencePanel", renderEvidence);
  }
  function close() {
    $("#wall").hidden = true; document.body.classList.remove("wall-open");
    $("#wallViewer").hidden = true; $("#wallPicker").hidden = true; closePanels();
  }
  $("#wallClose").addEventListener("click", close);
  $("#wallButton").addEventListener("click", () => open());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#wall").hidden && !document.querySelector("dialog[open]")) close(); });

  /* Knopf in der Seitenleiste: erst nach dem Foto; Punkt, wenn neue Beweise in der Akte liegen */
  function renderButton() {
    const on = E.has("wand_foto");
    $("#wallButton").classList.toggle("hidden", !on);
    const fresh = on && evidenceIds().some((id) => !seen.has(id));
    $("#wallBadge").classList.toggle("hidden", !fresh);
  }
  N.onRender = () => {
    renderButton();
    if (!$("#wall").hidden && board) {
      // Spielstand kann sich durch das Team geändert haben
      if (boardKey !== storeNow().key) { ensureBoard(); board.fit(); }
      board.redraw(); renderProof();
      if ($("#wallEvidencePanel").classList.contains("open")) renderEvidence();
    }
    checkWallPuzzles();
  };
  try { seen = new Set(JSON.parse(localStorage.getItem(seenKey()) || "[]")); } catch (e) { /* privat */ }
  N.wall = { open, close, isOpen: () => !$("#wall").hidden, get board() { return board; } };
})();
