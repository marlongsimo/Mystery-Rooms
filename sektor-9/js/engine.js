/*
 * SEKTOR 9 – Engine (einzige Wahrheit über den Spielstand)
 *
 * Aufbau der Welt (js/data.js): Hallen → Standpunkte → vier Blickrichtungen. Hotspots gehören zu einem oder mehreren
 * Standpunkten einer Halle. Die 3D-Schicht (js/3d/core.js) zeichnet nur und ruft engine.hotspot(id).
 * Spielstand: localStorage (allein). Für das gemeinsame Spielen ist alles, was geteilt wird, in S zusammengefasst
 * (flags, solved, inventory, docs) – ein Mehrspieler-Adapter kann später genau diesen Teil synchronisieren.
 */
(() => {
  const N = window.SEKTOR9;
  const D = N.data, A = N.audio || { play() {}, ambient() {}, setEnabled() {} };
  const SAVE_KEY = "sektor9_save_v1";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (v) => String(v || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9ÄÖÜ]/g, "");

  /* ---------- Zustand ---------- */
  const fresh = () => ({ v: 1, started: false, finished: false, hall: D.start.hall, station: D.start.station, view: D.start.view || 0,
    flags: [], solved: [], inventory: [...(D.start.inventory || [])], docs: [...(D.start.docs || [])], newDocs: [], seen: [], hints: {},
    echo: [], playMs: 0, sound: true });
  let S = fresh(), selected = null, blockedUntil = 0;
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (s && s.v === 1) S = { ...fresh(), ...s }; } catch (e) { /* neu */ } }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* privat */ } }

  const has = (f) => S.flags.includes(f);
  const isSolved = (p) => S.solved.includes(p);
  const cond = (c, neg) => { if (!c) return true; const all = [].concat(c).every((f) => has(f) || isSolved(f)); return neg ? ![].concat(c).some((f) => has(f) || isSolved(f)) : all; };
  const hall = () => D.halls[S.hall];
  const station = () => hall().stations[S.station];
  const H = (id) => D.hotspots[id];
  /** Hotspot gerade anklickbar: richtige Halle und Standpunkt, Bedingungen erfüllt. */
  function isVisible(id) {
    const h = H(id); if (!h || h.hall !== S.hall) return false;
    if (h.at && h.at !== "*" && ![].concat(h.at).includes(S.station)) return false;
    return cond(h.if) && cond(h.unless, true) && !(h.take && has("taken_" + h.take));
  }

  /* ---------- Oberfläche ---------- */
  const stage = () => $("#stage");
  function setNarration(t) { const n = $("#narration"); n.innerHTML = t || ""; n.classList.toggle("show", Boolean(t)); clearTimeout(setNarration.tm); if (t) setNarration.tm = setTimeout(() => n.classList.remove("show"), 7000); }
  let dlgOpen = false;
  function openDialog({ kicker = "", title = "", html = "", after = null, wide = false }) {
    const d = $("#dialog"); $("#dlgKicker").textContent = kicker; $("#dlgTitle").textContent = title; $("#dlgBody").innerHTML = html;
    d.classList.toggle("wide", wide); if (!d.open) d.showModal(); dlgOpen = true; if (after) after($("#dlgBody"));
  }
  function closeDialog() { const d = $("#dialog"); if (d.open) d.close(); dlgOpen = false; renderSide(); refresh(); }
  const blocked = () => dlgOpen || Boolean($(".overlay.show")) || performance.now() < blockedUntil;

  function docHtml(id) { const d = D.docs[id]; return `<div class="doc doc-${d.kind || "paper"}">${d.html}</div>`; }
  function addDoc(id) { if (!D.docs[id] || S.docs.includes(id)) return false; S.docs.push(id); S.newDocs.push(id); return true; }
  function give(id) { if (!S.inventory.includes(id)) S.inventory.push(id); }

  /* ---------- ECHO: Meldungen am Rand, gesammelt im Terminal ---------- */
  function echo(text, { quiet = false } = {}) {
    const line = { t: clockText(), text }; S.echo.push(line); save();
    const box = $("#echoToast"); box.innerHTML = `<span class="echo-tag">ECHO ▸</span> ${esc(text)}`; box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
    clearTimeout(echo.tm); echo.tm = setTimeout(() => box.classList.remove("show"), 6500);
    if (!quiet) A.play("glitch");
  }
  function clockText() { const m = Math.floor(S.playMs / 60000); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

  /* ---------- Aktionen (Rätsel gelöst, Hotspot-Folgen) ---------- */
  function run(actions = []) {
    for (const a of actions) {
      if (a.flag) { if (!has(a.flag)) S.flags.push(a.flag); }
      if (a.unflag) S.flags = S.flags.filter((f) => f !== a.unflag);
      if (a.solve && !isSolved(a.solve)) S.solved.push(a.solve);
      if (a.give) give(a.give);
      if (a.remove) { S.inventory = S.inventory.filter((x) => x !== a.remove); if (selected === a.remove) selected = null; }
      if (a.doc) addDoc(a.doc);
      if (a.sound) A.play(a.sound);
      if (a.echo) setTimeout(() => echo(a.echo), a.delay || 900);
      if (a.end) setTimeout(() => showEnd(a.end), a.delay || 600);
    }
  }
  function succeed(p) {
    if (isSolved(p.id)) return;
    S.solved.push(p.id); run(p.onSolve); A.play(p.sound || "success"); save();
    openDialog({ kicker: "GELÖST", title: p.title, html: `<p class="inspect-text">${p.success}</p>${(p.onSolve || []).filter((a) => a.doc).map((a) => docHtml(a.doc) + `<p class="found-note">▤ Ins Archiv gelegt</p>`).join("")}` });
  }
  function checkAnswer(p, value) {
    if (p.type === "sequence") {
      const seq = String(value).split(",").filter(Boolean), k = seq.length - 1;
      if (p.checkEach && k >= 0 && seq[k] !== p.answer[k]) return { ok: false, msg: (p.wrongStep && p.wrongStep[seq[k]]) || p.wrongDefault };
      if (seq.length < p.answer.length) return { ok: false, partial: true };
      return seq.join() === p.answer.join() ? { ok: true } : { ok: false, msg: (p.wrong && p.wrong[seq.join(",")]) || p.wrongDefault };
    }
    if ((p.answers || []).map(norm).includes(norm(value))) return { ok: true };
    return { ok: false, msg: (p.wrong && p.wrong[norm(value)]) || p.wrongDefault || null };
  }
  /** Eingabe am Objekt (3D) oder im Fenster: gleiche Prüfung, gleiche Texte. */
  function tryLock(pid, value) {
    const p = D.puzzles[pid]; if (!p || isSolved(pid)) return { ok: false, solved: Boolean(p) };
    const r = checkAnswer(p, value);
    if (r.ok) { succeed(p); refresh(); return { ok: true }; }
    if (r.partial) { A.play("key"); return r; }
    A.play(p.failSound || "error"); setNarration(esc(r.msg || "Nichts passiert.")); return r;
  }

  /* ---------- Hotspot anklicken ---------- */
  function hotspot(id) {
    const h = H(id); if (!h || !isVisible(id) || blocked()) return;
    if (!S.seen.includes(id)) S.seen.push(id);
    // Standpunkt wechseln (Bodenmarkierung) oder Halle wechseln
    if (h.station) { if (h.need && !cond(h.need)) { setNarration(h.locked || "Dorthin geht es noch nicht."); A.play("error"); return; } goStation(h.station); return; }
    if (h.go) { if (h.need && !cond(h.need)) { openDialog({ kicker: hall().name.toUpperCase(), title: h.title || h.label, html: `<p class="inspect-text">${h.locked || h.text || "Verschlossen."}</p>` }); A.play("error"); return; } goHall(h.go.hall, h.go.station, h.go.view); return; }
    // Gegenstand benutzen
    if (selected) {
      const it = selected; selected = null; renderSide();
      // ein Hotspot kann mehrere Gegenstände annehmen (z. B. Tonbandgerät: Band 1, 2, 3)
      const uses = [].concat(h.use || []).map((u) => D.puzzles[u]).filter((u) => u && !isSolved(u.id));
      const pu = uses.find((u) => u.item === it);
      if (pu) { succeed(pu); refresh(); return; }
      if (uses.length) { A.play("error"); setNarration(esc(uses[0].wrongItem || "Das passt hier nicht.")); return; }
      setNarration(`${esc(D.items[it].name)} hilft hier nicht weiter.`); return;
    }
    const parts = [];
    if (h.text) parts.push(`<p class="inspect-text">${h.text}</p>`);
    if (h.doc) { parts.push(docHtml(h.doc)); if (addDoc(h.doc)) parts.push(`<p class="found-note">▤ Ins Archiv gelegt</p>`); }
    if (h.take && !has("taken_" + h.take)) { give(h.take); S.flags.push("taken_" + h.take); parts.push(`<p class="found-note">＋ ${esc(D.items[h.take].name)} eingesteckt</p>`); A.play("pickup"); }
    if (h.solves && !isSolved(h.solves)) { run(D.puzzles[h.solves].onSolve); S.solved.push(h.solves); parts.push(`<p class="inspect-text">${D.puzzles[h.solves].success}</p>`); A.play("success"); }
    if (h.actions) run(h.actions);
    const pu = h.lock && D.puzzles[h.lock];
    if (pu && !isSolved(pu.id)) parts.push(lockHtml(pu));
    const openUse = [].concat(h.use || []).find((u) => D.puzzles[u] && !isSolved(u));
    if (openUse && !h.text) parts.push(`<p class="inspect-text">${D.puzzles[openUse].noItems || ""}</p>`);
    save();
    if (!parts.length) return;
    openDialog({ kicker: `${hall().name.toUpperCase()} · ${station().name.toUpperCase()}`, title: h.title || h.label, html: parts.join(""), wide: Boolean(h.doc && D.docs[h.doc].wide), after: pu ? (root) => bindLock(root, pu) : null });
  }
  function lockHtml(p) {
    const inp = p.type === "code" ? `<input class="lock-input" inputmode="numeric" maxlength="${p.length || 4}" autocomplete="off" placeholder="${"–".repeat(p.length || 4)}">`
      : `<input class="lock-input" maxlength="${p.length || 12}" autocomplete="off" placeholder="${"_".repeat(p.length || 6)}">`;
    return `<div class="lock"><p class="lock-prompt">${p.prompt || ""}</p><div class="lock-row">${inp}<button type="button" class="btn" data-lock-try>${p.button || "Prüfen"}</button></div><p class="lock-fb" aria-live="polite"></p></div>`;
  }
  function bindLock(root, p) {
    const inp = $(".lock-input", root), fb = $(".lock-fb", root), go = () => {
      const r = checkAnswer(p, inp.value);
      if (r.ok) { closeDialog(); succeed(p); refresh(); return; }
      A.play(p.failSound || "error"); fb.textContent = r.msg || "Nichts passiert."; inp.select();
    };
    $("[data-lock-try]", root).onclick = go; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }); setTimeout(() => inp.focus(), 50);
  }

  /* ---------- Bewegung ---------- */
  function goStation(st, view) {
    if (!hall().stations[st]) return;
    S.station = st; if (view !== undefined) S.view = view; else if (hall().stations[st].view !== undefined) S.view = hall().stations[st].view;
    A.play("step"); save(); refresh(); setNarration(hall().stations[st].arrive || "");
  }
  function goHall(hid, st, view) {
    const h2 = D.halls[hid]; if (!h2) return;
    S.hall = hid; S.station = st || Object.keys(h2.stations)[0]; S.view = view ?? h2.stations[S.station].view ?? 0;
    A.play("door"); A.ambient(h2.ambient || null); save(); refresh();
    if (h2.onEnter && !has("entered_" + hid)) { S.flags.push("entered_" + hid); run(h2.onEnter); save(); }
  }
  function setView(i) { S.view = ((i % 4) + 4) % 4; renderTop(); save(); }
  function turn(d) { S.view = (S.view + d + 4) % 4; refresh(); }

  /* ---------- Zeichnen ---------- */
  function renderTop() {
    const st = station(); $("#location").textContent = `${hall().short || hall().name} · ${st.name}`;
    $("#viewName").textContent = (st.views && st.views[S.view]) || "";
  }
  function renderSide() {
    const inv = $("#inventory"); inv.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const id = S.inventory[i], it = id && D.items[id];
      inv.insertAdjacentHTML("beforeend", it ? `<button class="slot${selected === id ? " selected" : ""}" data-slot="${id}" title="${esc(it.name)}"><span aria-hidden="true">${it.icon || "▣"}</span><small>${esc(it.name)}</small></button>` : `<span class="slot empty"></span>`);
    }
    $("#invHint").innerHTML = selected ? `<b>${esc(D.items[selected].name)}</b> in der Hand – tippe auf die Stelle, an der du es benutzen willst. <a href="#" data-drop>Weglegen</a>` : "Gegenstand antippen, um ihn zu benutzen.";
    $("#archiveCount").textContent = S.docs.length; $("#archiveCount").classList.toggle("fresh", S.newDocs.length > 0);
  }
  function refresh() {
    if (!S.started) return;
    renderTop(); renderSide();
    const r = { id: S.hall, station: S.station };
    const in3d = Boolean(N.view3d && N.view3d.supports(r));
    $("#scene").classList.toggle("is3d", in3d);
    if (in3d) N.view3d.render(stage(), r, S.view);
    else stage().innerHTML = `<div class="no3d"><p>Diese Halle braucht 3D (WebGL). Dein Browser unterstützt es gerade nicht.</p></div>`;
  }

  /* ---------- Karte, Archiv, ECHO-Terminal (Overlays) ---------- */
  function overlay(id, html) { const o = $("#" + id); o.querySelector(".ov-body").innerHTML = html; o.classList.add("show"); }
  function closeOverlays() { $$(".overlay.show").forEach((o) => o.classList.remove("show")); blockedUntil = performance.now() + 250; refresh(); }
  function showMap() {
    const halls = Object.entries(D.halls).map(([hid, h]) => {
      const open = !h.need || cond(h.need), here = hid === S.hall;
      const sts = Object.entries(h.stations).map(([sid, s]) => {
        const can = open && (!s.need || cond(s.need)) && (hid !== S.hall || sid !== S.station);
        return `<button class="map-st${here && sid === S.station ? " here" : ""}" ${can ? `data-go="${hid}|${sid}"` : "disabled"}>${here && sid === S.station ? "● " : ""}${esc(s.name)}</button>`;
      }).join("");
      return `<div class="map-hall map-${h.pos || "c"}${open ? "" : " locked"}${here ? " current" : ""}"><h3>${esc(h.name)}${h.sector ? ` <small>SEKTOR ${h.sector}</small>` : ""}</h3>${open ? sts : `<p class="map-locked">${esc(h.lockedText || "Verschlossen")}</p>`}</div>`;
    }).join("");
    overlay("mapOv", `<div class="bunker-map">${halls}</div><p class="muted small">Hallen wechselst du über die Panzertüren der Verteilerhalle. In einer Halle bringt dich ein Standpunkt direkt dorthin.</p>`);
  }
  function mapGo(hid, sid) {
    closeOverlays();
    if (hid === S.hall) { goStation(sid); return; }
    // in eine andere Halle nur über die Verteilerhalle: Weg ist frei, wenn die Halle offen ist
    goHall(hid, sid);
  }
  function showArchive(openId) {
    const list = S.docs.map((id) => `<li><button data-doc="${id}">${esc(D.docs[id].title)}${S.newDocs.includes(id) ? " <i>NEU</i>" : ""}</button></li>`).join("");
    overlay("archiveOv", `<div class="archive"><ol class="arch-list">${list || "<li class='muted'>Noch leer.</li>"}</ol><div class="arch-view">${openId ? `<h3>${esc(D.docs[openId].title)}</h3>${docHtml(openId)}` : `<p class="muted">Wähle ein Dokument.</p>`}</div></div>`);
  }
  function showEcho() {
    const open = Object.values(D.puzzles).filter((p) => !isSolved(p.id) && p.objective && (!p.when || cond(p.when)) && (p.from || []).some((h) => S.seen.includes(h)));
    const log = S.echo.slice(-14).map((l) => `<div class="echo-line"><span>${l.t}</span> ${esc(l.text)}</div>`).join("") || `<div class="echo-line muted">Keine Meldungen.</div>`;
    const tasks = open.map((p) => {
      const used = S.hints[p.id] || 0;
      const shown = p.hints.slice(0, used).map((t, i) => `<p class="hint-text"><b>Stufe ${i + 1}:</b> ${t}</p>`).join("");
      return `<div class="task"><p class="task-title">▸ ${esc(p.objective)}</p>${shown}${used < p.hints.length ? `<button class="btn small" data-hint="${p.id}">Hinweis ${used + 1} von ${p.hints.length} anfordern</button>` : ""}</div>`;
    }).join("") || `<p class="muted">Keine offenen Aufgaben bekannt. Untersuche die Anlage.</p>`;
    overlay("echoOv", `<div class="echo-term"><div class="echo-head">WARTUNGSASSISTENZ · KESSELBERG · SITZUNG 1</div><div class="echo-log">${log}</div><h3>Offene Aufgaben</h3>${tasks}</div>`);
  }

  /* ---------- Ende eines Abschnitts ---------- */
  function showEnd(id) {
    const e = D.endings[id]; S.finished = Boolean(e.final); save(); // Abschnittsende ist kein Spielende
    overlay("endOv", `<div class="end-card"><p class="eyebrow">${esc(e.kicker)}</p><h2>${esc(e.title)}</h2>${e.html}<p class="muted small">Spielzeit ${clockText()} · Hinweise genutzt: ${Object.values(S.hints).reduce((a, b) => a + b, 0)}</p><button class="btn" data-restart>Neu beginnen</button></div>`);
  }

  /* ---------- Start ---------- */
  function start() {
    S.started = true; save();
    $("#title").classList.add("hidden"); $("#game").classList.remove("hidden");
    A.setEnabled(S.sound); A.ambient(hall().ambient || null); refresh();
    if (!has("briefed")) { S.flags.push("briefed"); save(); setTimeout(() => openDialog({ kicker: "EINSATZAUFTRAG", title: D.docs.auftrag.title, html: docHtml("auftrag") + `<p class="found-note">▤ Liegt im Archiv</p>` }), 400); }
    if (D.start.echo && !S.echo.length) setTimeout(() => echo(D.start.echo), 2600);
  }
  let last = performance.now();
  setInterval(() => { const n = performance.now(); if (S.started && !document.hidden) { S.playMs += n - last; $("#clock").textContent = clockText(); } last = n; }, 1000);

  function bind() {
    $("#startBtn").onclick = () => { if ($("#startBtn").dataset.fresh) { S = fresh(); } start(); };
    $("#closeDialog").onclick = closeDialog; $("#dialog").addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });
    $("#turnLeft").onclick = () => turn(-1); $("#turnRight").onclick = () => turn(1);
    $("#mapBtn").onclick = showMap; $("#archiveBtn").onclick = () => showArchive(); $("#echoBtn").onclick = showEcho;
    $("#soundToggle").onclick = () => { S.sound = !S.sound; A.setEnabled(S.sound); $("#soundToggle").classList.toggle("muted", !S.sound); save(); if (S.sound) A.ambient(hall().ambient || null); };
    document.addEventListener("click", (e) => {
      const t = e.target;
      const slot = t.closest("[data-slot]"); if (slot) { const id = slot.dataset.slot; selected = selected === id ? null : id; A.play("click"); renderSide(); return; }
      if (t.closest("[data-drop]")) { e.preventDefault(); selected = null; renderSide(); return; }
      if (t.closest(".ov-close")) { closeOverlays(); return; }
      const go = t.closest("[data-go]"); if (go) { const [hid, sid] = go.dataset.go.split("|"); mapGo(hid, sid); return; }
      const doc = t.closest("[data-doc]"); if (doc) { S.newDocs = S.newDocs.filter((x) => x !== doc.dataset.doc); save(); showArchive(doc.dataset.doc); renderSide(); return; }
      const hint = t.closest("[data-hint]"); if (hint) { const id = hint.dataset.hint; S.hints[id] = (S.hints[id] || 0) + 1; save(); A.play("chirp"); showEcho(); return; }
      if (t.closest("[data-restart]")) { localStorage.removeItem(SAVE_KEY); location.reload(); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $(".overlay.show")) closeOverlays(); if (!S.started || blocked()) return; if (e.key === "ArrowLeft") turn(-1); if (e.key === "ArrowRight") turn(1); if (e.key === "m") showMap(); });
    load();
    if (S.started) { $("#startBtn").textContent = "Einsatz fortsetzen"; $("#newBtn").classList.remove("hidden"); }
    $("#newBtn").onclick = () => { localStorage.removeItem(SAVE_KEY); S = fresh(); start(); };
    $("#soundToggle").classList.toggle("muted", !S.sound);
  }

  N.engine = {
    hotspot, hotspotData: (id) => H(id), isVisible, selectedItem: () => selected, isLight: () => false, has, blocked, setView, refresh,
    tryLock, isSolved, openItem: () => {}, echo, goStation, goHall, state: () => S, turn,
  };
  N.items = D.items;
  document.addEventListener("DOMContentLoaded", bind);
})();
