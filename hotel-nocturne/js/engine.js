/*
 * HOTEL NOCTURNE – Spiel-Engine (Version 2: vier Blickrichtungen)
 * Liest die Raumdaten aus js/rooms/*.js. Zuständig für Darstellung, Drehen,
 * Rätsel, Rucksack, Telefon, Akte, Hinweise, Raumwechsel und Spielstand.
 */
(() => {
  "use strict";
  const N = window.NOCTURNE;
  const A = N.audio;
  const SAVE_KEY = "nocturne_save_v2";
  N.messages = N.messages || {};

  /* ---------- Hilfsfunktionen ---------- */
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const playerName = () => (N.config.playerName || "").trim() || "Verehrter Gast";
  const fill = (s) => String(s ?? "").replaceAll("{name}", esc(playerName()));
  const norm = (s) => String(s ?? "").toUpperCase().replace(/ß/g, "SS").replace(/[^A-Z0-9ÄÖÜ]/g, "");
  const pad2 = (n) => String(n).padStart(2, "0");
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ---------- Raumdaten aufbereiten ---------- */
  const ROOM = {}, PUZ = {};
  N.rooms.forEach((r, i) => {
    r.index = i; ROOM[r.id] = r;
    for (const [id, p] of Object.entries(r.puzzles || {})) { p.id = id; p.room = r.id; PUZ[id] = p; }
  });
  const hotspotsOf = (r) => (r.views ? r.views.flatMap((v) => v.hotspots) : r.hotspots);

  /* ---------- Spielstand ---------- */
  const fresh = () => ({
    v: 2, started: false, finished: false,
    current: N.rooms[0].id, unlocked: [N.rooms[0].id], completed: [], views: {},
    solved: [], flags: [], inventory: [], docs: [], newDocs: [], messages: [], unread: [],
    hints: {}, puzzleStart: {}, playMs: 0, notes: "", sound: true, showHotspots: false,
  });
  let S = fresh();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (s && s.v === 2) S = Object.assign(fresh(), s);
      if (!ROOM[S.current]) S.current = N.rooms[0].id;
    } catch (e) { /* defekter Spielstand → neu beginnen */ }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* privater Modus */ } }

  /* Laufzeit-Zustand (wird nicht gespeichert) */
  let selected = null;     // ausgewählter Gegenstand im Rucksack
  let light = false;       // Taschenlampe
  let overlay = null;      // "phone" | "akte" | null
  let phoneApp = null;
  let aktePage = 0;

  const room = () => ROOM[S.current];
  const viewIndex = (r) => S.views[r.id] || 0;
  const has = (flag) => (flag === "licht" ? light : S.flags.includes(flag));
  const isSolved = (pid) => S.solved.includes(pid);
  const add = (arr, v) => (arr.includes(v) ? false : (arr.push(v), true));
  const visible = (h) => (!h.if || has(h.if)) && (!h.unless || !has(h.unless));
  const clockAt = (ms) => { const m = 23 * 60 + 17 + Math.floor(ms / 60000); return `${pad2(Math.floor(m / 60) % 24)}:${pad2(m % 60)}`; };
  const currentPuzzle = (r) => Object.keys(r.puzzles || {}).find((id) => !isSolved(id));

  /* ---------- Aktionen ---------- */
  let gained = [];
  let justCompleted = null;
  function run(actions) {
    for (const a of actions || []) {
      if (a.flag) add(S.flags, a.flag);
      if (a.give && add(S.inventory, a.give)) gained.push(N.items[a.give].icon + " " + N.items[a.give].name);
      if (a.doc && addDoc(a.doc)) gained.push("▤ " + N.docs[a.doc].title);
      if (a.sound) A.play(a.sound);
      if (a.message) addMessage(a.message);
      if (a.solve) solve(a.solve);
    }
  }
  function addDoc(id) {
    if (!N.docs[id] || S.docs.includes(id)) return false;
    S.docs.push(id); S.newDocs.push(id);
    return true;
  }
  function addMessage(id, delay = 1400) {
    if (!N.messages[id] || S.messages.some((m) => m.id === id)) return;
    S.messages.push({ id, at: clockAt(S.playMs) });
    S.unread.push(id);
    save();
    setTimeout(() => {
      A.play("buzz");
      const b = $("#phoneButton");
      b.classList.remove("ring"); void b.offsetWidth; b.classList.add("ring");
      renderSide();
    }, delay);
  }
  function solve(pid) {
    if (isSolved(pid)) return;
    S.solved.push(pid);
    const p = PUZ[pid];
    run(p.onSolve);
    const r = ROOM[p.room];
    if (!S.completed.includes(r.id) && (r.completeWhen || []).every(isSolved)) {
      S.completed.push(r.id); justCompleted = r.id;
      const next = N.rooms[r.index + 1];
      if (next) add(S.unlocked, next.id);
      if (r.final) S.finished = true;
    }
    save();
  }

  /* ---------- Bildschirme ---------- */
  function showScreen(id) {
    ["intro", "game", "ending"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
    if (id !== "game") { A.ambient(null); closeOverlay(); }
    window.scrollTo(0, 0);
  }
  const inGame = () => !$("#game").classList.contains("hidden");
  function renderIntro() {
    $("#introName").textContent = playerName();
    $("#startButton").innerHTML = S.started ? "Weiterspielen <span>→</span>" : "Einchecken <span>→</span>";
    $("#newGameLink").classList.toggle("hidden", !S.started);
  }

  /* ---------- Darstellung ---------- */
  function render(opts = {}) {
    const r = room();
    const pid = currentPuzzle(r);
    if (pid && S.puzzleStart[pid] == null) { S.puzzleStart[pid] = S.playMs; save(); }
    $("#location").textContent = r.name.toUpperCase();
    renderStage(opts);
    renderSide();
    renderObjective();
    A.ambient(r.ambient && !S.finished ? r.ambient : null);
  }

  function renderStage({ anim = null, narrate = null, reset = false } = {}) {
    const r = room(), sc = $("#scene"), st = $("#stage");
    sc.classList.toggle("show-hotspots", S.showHotspots);
    sc.classList.toggle("lit", light);
    $("#lightChip").classList.toggle("hidden", !light);
    if (r.views) {
      const i = viewIndex(r), v = r.views[i], n = r.views.length;
      sc.classList.remove("draft");
      st.innerHTML = v.scene
        + (v.dark ? `<div class="darkness" style="left:${v.dark.x}%;top:${v.dark.y}%;width:${v.dark.w}%;height:${v.dark.h}%${v.dark.clip ? `;clip-path:${v.dark.clip}` : ""}"></div>` : "")
        + v.hotspots.filter(visible).map((h) =>
          `<button class="hotspot${h.go ? " exit" : ""}${h.take ? " pickup" : ""}" data-hs="${h.id}" style="left:${h.x + h.w / 2}%;top:${h.y + h.h / 2}%;width:${h.w}%;height:${h.h}%" aria-label="${esc(h.label)}"><span class="hs-label">${h.go ? "→ " : ""}${esc(h.label)}</span></button>`).join("");
      $$("[data-if]", st).forEach((el) => { el.style.display = has(el.dataset.if) ? "" : "none"; });
      $$("[data-unless]", st).forEach((el) => { el.style.display = has(el.dataset.unless) ? "none" : ""; });
      $("#viewName").textContent = `${v.dir} · ${v.name}`;
      $("#compass").innerHTML = r.views.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
      const left = r.views[(i - 1 + n) % n], right = r.views[(i + 1) % n];
      $("#turnLeft").innerHTML = `<span aria-hidden="true">‹</span><small>${esc(left.name)}</small>`;
      $("#turnRight").innerHTML = `<small>${esc(right.name)}</small><span aria-hidden="true">›</span>`;
      $("#turnLeft").setAttribute("aria-label", `Nach links drehen: ${left.name}`);
      $("#turnRight").setAttribute("aria-label", `Nach rechts drehen: ${right.name}`);
      sc.classList.remove("no-views");
      if (reset) setNarration(v.desc);
    } else {
      sc.classList.add("draft", "no-views");
      st.innerHTML = `<div class="draft-inner"><p class="draft-title">${esc(r.title)}</p><p class="draft-sub">14. OKTOBER 2009 · NACH 23:17</p>
        <div class="draft-cards">${r.hotspots.map((h) => `<button class="card-object" data-hs="${h.id}"><span class="glyph">${h.glyph}</span><small>${esc(h.label)}</small></button>`).join("")}</div>
        <p class="draft-tag">Vorläufige Raumansicht – dieser Bereich wird noch ausgestaltet</p></div>`;
      $("#viewName").textContent = r.name.toUpperCase();
      $("#compass").innerHTML = "";
      if (reset) setNarration(r.story);
    }
    if (narrate) setNarration(narrate);
    if (anim) { st.classList.remove("turn-left", "turn-right", "arrive"); void st.offsetWidth; st.classList.add(anim); }
  }

  function setNarration(html) { $("#narration").innerHTML = fill(html); }

  function renderObjective() {
    const r = room(), pid = currentPuzzle(r), done = S.completed.includes(r.id);
    const next = N.rooms[r.index + 1];
    $("#objective").innerHTML = done
      ? `<span class="obj-done">✓ Bereich gesichert</span>${r.final ? `<button class="link-button" data-ending>Den letzten Brief lesen →</button>` : next ? `<button class="link-button" data-goto="${next.id}" data-via="${r.views ? "elevator" : "door"}">${esc(r.exitLabel || `Weiter: ${next.name}`)} →</button>` : ""}`
      : `<span class="obj-label">ZIEL</span> ${esc(PUZ[pid]?.objective || "Untersuche den Raum.")}`;
  }

  function renderSide() {
    const slots = Math.max(8, S.inventory.length);
    $("#backpack").innerHTML = Array.from({ length: slots }, (_, k) => {
      const id = S.inventory[k];
      if (!id) return `<span class="slot empty" aria-hidden="true"></span>`;
      const it = N.items[id];
      return `<button class="slot${selected === id ? " selected" : ""}" data-slot="${id}" aria-label="${esc(it.name)}${selected === id ? " (ausgewählt)" : ""}" title="${esc(it.name)}"><span>${it.icon}</span><small>${esc(it.name)}</small></button>`;
    }).join("");
    $("#selectedNote").innerHTML = selected
      ? `<b>${esc(N.items[selected].name)}</b> ausgewählt – tippe auf eine Stelle im Raum. <button class="link-button" data-examine="${selected}">Ansehen</button> · <button class="link-button" data-deselect>Ablegen</button>`
      : S.inventory.length ? "Gegenstand antippen, um ihn zu benutzen." : "Noch leer.";
    const unread = S.unread.length;
    $("#msgBadge").textContent = unread;
    $("#msgBadge").classList.toggle("hidden", !unread);
    $("#docCount").textContent = S.docs.length;
    $("#docCount").classList.toggle("fresh", S.newDocs.length > 0);
    const n = S.completed.length, total = N.rooms.length;
    $("#progressText").textContent = `${n} / ${total} Bereiche`;
    $("#progressBar").style.width = `${(n / total) * 100}%`;
  }

  /* ---------- Drehen & Raumwechsel ---------- */
  function turn(d) {
    const r = room();
    if (!r.views || overlay || dlg.open) return;
    S.views[r.id] = (viewIndex(r) + d + r.views.length) % r.views.length;
    save();
    A.play("step");
    renderStage({ anim: d > 0 ? "turn-right" : "turn-left", reset: true });
  }

  function goRoom(id, via) {
    if (!S.unlocked.includes(id)) return;
    closeDialog(); closeOverlay();
    selected = null; light = false;
    const sc = $("#scene");
    sc.classList.add("leaving");
    A.play(via === "elevator" ? "elevator" : "door");
    setTimeout(() => {
      S.current = id; save();
      sc.classList.remove("leaving");
      render({ anim: "arrive", reset: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, via === "elevator" ? 1100 : 650);
  }

  /* ---------- Dialog ---------- */
  const dlg = $("#dialog");
  let dlgCleanup = null;
  function openDialog({ kicker = "", title = "", html = "", after = null, wide = false }) {
    if (dlgCleanup) { dlgCleanup(); dlgCleanup = null; }
    $("#dlgKicker").textContent = kicker;
    $("#dlgTitle").textContent = title;
    $("#dlgBody").innerHTML = html;
    dlg.classList.toggle("wide", wide);
    if (!dlg.open) dlg.showModal();
    $("#dlgBody").scrollTop = 0;
    if (after) after();
  }
  function closeDialog() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", () => {
    if (dlgCleanup) { dlgCleanup(); dlgCleanup = null; }
    justCompleted = null;
    if (inGame()) { renderStage(); renderSide(); renderObjective(); }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(); });

  const paper = (kind, html) => `<article class="paper paper-${kind}">${fill(html)}</article>`;
  function docHtml(id) {
    const d = N.docs[id];
    if (!d.pages) return paper(d.kind, d.html);
    return d.pages.map((h, i) => `${i ? `<p class="page-label">Rückseite</p>` : ""}${paper(d.kind, h)}`).join("");
  }

  /* ---------- Hotspots ---------- */
  function onHotspot(id) {
    const r = room();
    const h = hotspotsOf(r).find((x) => x.id === id);
    if (!h) return;
    if (selected && r.views) return useItemOn(h, selected);
    if (h.take) {
      add(S.inventory, h.take); add(S.flags, "taken_" + h.id);
      run(h.actions);
      if (h.solves) solve(h.solves);
      save();
      A.play("pickup");
      pulse("#backpack");
      renderStage({ narrate: h.takeText || `Du nimmst ${N.items[h.take].name} mit.` });
      renderSide(); renderObjective();
      return;
    }
    if (h.go && S.unlocked.includes(h.go)) return goRoom(h.go, h.via);
    inspect(h);
  }

  function useItemOn(h, itemId) {
    const it = N.items[itemId];
    const p = h.use ? PUZ[h.use] : null;
    if (p && !isSolved(p.id)) {
      if (p.item === itemId) { selected = null; return succeed(p); }
      A.play("error");
      return renderStage({ narrate: p.wrongItem || `${it.name} bringt hier nichts.` });
    }
    A.play("error");
    renderStage({ narrate: `${esc(it.name)} lässt sich an „${esc(h.label)}“ nicht benutzen.` });
  }

  function inspect(h) {
    const r = room();
    A.play("click");
    if (h.sound) A.play(h.sound);
    run(h.actions);
    const parts = [];
    let after = null;
    if (h.text) parts.push(`<p class="inspect-text">${fill(h.text)}</p>`);
    if (h.doc) {
      A.play("paper");
      parts.push(docHtml(h.doc));
      if (addDoc(h.doc)) parts.push(`<p class="found-note">▤ In die Akte gelegt</p>`);
      save();
    }
    const pid = h.lock || h.use;
    if (pid) {
      const p = PUZ[pid];
      if (isSolved(pid)) parts.push(`<div class="solved-box"><span>✓</span><p>${fill(p.success)}</p></div>`);
      else { parts.push(lockHtml(p)); after = () => bindLock(p); }
    }
    if (!h.text && !h.doc && !pid && h.go) parts.push(`<p class="inspect-text">Verschlossen.</p>`);
    openDialog({ kicker: r.name.toUpperCase(), title: h.title || h.label, html: parts.join(""), after, wide: Boolean(h.doc && N.docs[h.doc].kind === "plan") });
    renderSide();
  }

  /* ---------- Schlösser & Rätsel ---------- */
  function lockHtml(p) {
    const head = `${p.prompt ? `<p class="lock-prompt">${fill(p.prompt)}</p>` : ""}${p.clue ? `<div class="clue">${esc(p.clue)}</div>` : ""}`;
    const fb = `<p class="lock-feedback" role="status" aria-live="polite"></p>`;
    if (p.type === "code") {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
      return `<div class="lock lock-code">${head}<div class="code-slots" aria-label="Eingegebener Code">${Array.from({ length: p.length }, () => "<span></span>").join("")}</div>
        <div class="keypad">${keys.map((k) => `<button type="button" data-key="${k}" aria-label="${k === "⌫" ? "Löschen" : k === "✓" ? "Bestätigen" : k}">${k}</button>`).join("")}</div>${fb}</div>`;
    }
    if (p.type === "text") return `<form class="lock lock-text">${head}<div class="text-row"><input class="text-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Lösung eingeben" aria-label="Lösung"><button class="submit-button">Prüfen</button></div>${fb}</form>`;
    if (p.type === "multi") return `<form class="lock lock-multi">${head}${p.fields.map((f, i) => `<label class="multi-field"><span>${i + 1}. ${esc(f.label)}</span><input class="text-input" autocomplete="off" spellcheck="false"></label>`).join("")}<button class="submit-button wide">Tresor öffnen</button>${fb}</form>`;
    if (p.type === "use") {
      return `<div class="lock lock-use"><p class="lock-prompt">Welchen Gegenstand möchtest du hier benutzen?</p>
        ${S.inventory.length ? `<div class="use-items">${S.inventory.map((id) => `<button type="button" class="use-item" data-use="${id}"><span>${N.items[id].icon}</span> ${esc(N.items[id].name)}</button>`).join("")}</div>` : `<p class="muted">${esc(p.noItems || "Du hast noch nichts, was du hier benutzen könntest.")}</p>`}${fb}</div>`;
    }
    return "";
  }

  function bindLock(p) {
    const root = $("#dlgBody .lock");
    const fb = $(".lock-feedback", root);
    const fail = (msg) => {
      A.play("error");
      fb.textContent = msg || "Nichts passiert. Das scheint nicht die richtige Lösung zu sein.";
      root.classList.remove("shake"); void root.offsetWidth; root.classList.add("shake");
    };
    const attempt = (value) => {
      if ((p.answers || []).map(norm).includes(norm(value))) { succeed(p); return true; }
      fail(p.wrong ? p.wrong[norm(value)] : null);
      return false;
    };
    if (p.type === "code") {
      let entry = "";
      const slots = $$(".code-slots span", root);
      const paint = () => slots.forEach((s, i) => { s.textContent = entry[i] || ""; s.classList.toggle("filled", i < entry.length); });
      const press = (k) => {
        if (k === "⌫") entry = entry.slice(0, -1);
        else if (k === "✓") { if (entry.length === p.length) { if (!attempt(entry)) entry = ""; } else fail(`Der Code hat ${p.length} Stellen.`); }
        else if (/^\d$/.test(k) && entry.length < p.length) {
          entry += k; A.play("key");
          if (entry.length === p.length) { paint(); setTimeout(() => { if (!attempt(entry)) { entry = ""; paint(); } }, 220); return; }
        }
        paint();
      };
      root.addEventListener("click", (e) => { const b = e.target.closest("[data-key]"); if (b) press(b.dataset.key); });
      const onKey = (e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === "Backspace") press("⌫");
        else if (e.key === "Enter") { e.preventDefault(); press("✓"); }
      };
      document.addEventListener("keydown", onKey);
      dlgCleanup = () => document.removeEventListener("keydown", onKey);
    }
    if (p.type === "text") {
      const input = $("input", root);
      setTimeout(() => input.focus(), 50);
      root.addEventListener("submit", (e) => { e.preventDefault(); if (!input.value.trim()) return fail("Bitte gib zuerst etwas ein."); attempt(input.value); });
    }
    if (p.type === "multi") {
      root.addEventListener("submit", (e) => {
        e.preventDefault();
        const vals = $$("input", root).map((i) => i.value);
        if (vals.some((v) => !v.trim())) return fail("Bitte beantworte alle Fragen.");
        const right = p.fields.filter((f, i) => f.answers.map(norm).includes(norm(vals[i]))).length;
        if (right === p.fields.length) return succeed(p);
        fail(`Der Tresor bleibt verschlossen. ${right} von ${p.fields.length} Antworten scheinen zu stimmen.`);
      });
    }
    if (p.type === "use") {
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-use]");
        if (!b) return;
        if (b.dataset.use === p.item) succeed(p);
        else fail(p.wrongItem || "Das passt hier nicht.");
      });
    }
  }

  function succeed(p) {
    if (dlgCleanup) { dlgCleanup(); dlgCleanup = null; }
    gained = [];
    A.play("unlock");
    solve(p.id);
    setTimeout(() => A.play("success"), 250);
    const r = ROOM[p.room], next = N.rooms[r.index + 1];
    const completedNow = justCompleted === r.id;
    let buttons = `<button class="primary-button small" data-close>Weiter untersuchen</button>`;
    if (completedNow && r.final) buttons = `<button class="primary-button small" data-ending>Den letzten Brief lesen <span>→</span></button>`;
    else if (completedNow && next) buttons = `<button class="primary-button small" data-goto="${next.id}" data-via="${r.views ? "elevator" : "door"}">${esc(r.exitLabel || `Weiter: ${next.name}`)} <span>→</span></button><button class="ghost-button" data-close>Noch hier bleiben</button>`;
    openDialog({
      kicker: r.name.toUpperCase(),
      title: completedNow ? "Bereich gesichert" : "Gelöst",
      html: `<div class="success-box"><div class="success-mark">✓</div><p>${fill(p.success)}</p>
        ${gained.length ? `<div class="gained"><p class="eyebrow">GEFUNDEN</p><ul>${gained.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
        ${completedNow && next ? `<p class="unlock-note">Neuer Bereich freigeschaltet: <b>${esc(next.name)}</b></p>` : ""}
        <div class="button-row">${buttons}</div></div>`,
    });
    renderStage({ narrate: p.success }); renderSide(); renderObjective();
    return true;
  }

  /* ---------- Rucksack: antippen oder ziehen ---------- */
  function pulse(sel) { const el = $(sel); el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }
  function selectItem(id) {
    if (selected === id) return openItem(id);
    selected = id;
    A.play("click");
    renderSide();
    if (room().views) setNarration(`<b>${esc(N.items[id].name)}</b> in der Hand. Tippe auf die Stelle, an der du es benutzen willst.`);
  }
  function openItem(id) {
    const it = N.items[id];
    openDialog({ kicker: "RUCKSACK", title: it.name, wide: it.doc && N.docs[it.doc].kind === "plan", html: `<p class="inspect-text">${fill(it.text)}</p>${it.doc ? docHtml(it.doc) : ""}` });
  }
  (() => {
    let drag = null;
    const bp = $("#backpack");
    bp.addEventListener("pointerdown", (e) => {
      const slot = e.target.closest("[data-slot]");
      if (!slot || e.button > 0) return;
      drag = { id: slot.dataset.slot, x: e.clientX, y: e.clientY, ghost: null, pid: e.pointerId };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10 && room().views) {
        drag.ghost = document.createElement("div");
        drag.ghost.className = "drag-ghost";
        drag.ghost.textContent = N.items[drag.id].icon;
        document.body.appendChild(drag.ghost);
        $("#scene").classList.add("dropping");
      }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; e.preventDefault(); }
    }, { passive: false });
    window.addEventListener("pointerup", (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      $("#scene").classList.remove("dropping");
      if (d.ghost) {
        d.ghost.remove();
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("#stage [data-hs]");
        if (target) { selected = d.id; onHotspot(target.dataset.hs); renderSide(); }
        return;
      }
      selectItem(d.id);
    });
    window.addEventListener("pointercancel", () => { if (drag?.ghost) drag.ghost.remove(); drag = null; $("#scene").classList.remove("dropping"); });
  })();

  /* ---------- Szene: Wischen & Lichtkegel ---------- */
  (() => {
    const sc = $("#scene");
    let start = null, suppressClick = false;
    const moveLight = (e) => {
      if (!light) return;
      $$(".darkness", sc).forEach((d) => {
        const r = d.getBoundingClientRect();
        d.style.setProperty("--lx", e.clientX - r.left + "px");
        d.style.setProperty("--ly", e.clientY - r.top + "px");
      });
    };
    sc.addEventListener("pointerdown", (e) => { start = { x: e.clientX, y: e.clientY, t: Date.now() }; moveLight(e); });
    sc.addEventListener("pointermove", moveLight);
    sc.addEventListener("pointerup", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y, dt = Date.now() - start.t;
      start = null;
      if (!light && Math.abs(dx) > 60 && Math.abs(dy) < 60 && dt < 700) { suppressClick = true; turn(dx < 0 ? 1 : -1); }
    });
    sc.addEventListener("click", (e) => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  })();

  /* ---------- Telefon ---------- */
  const APPS = [
    { id: "nachrichten", name: "Nachrichten", icon: "✉" },
    { id: "licht", name: "Taschenlampe", icon: "◉" },
    { id: "notizen", name: "Notizen", icon: "✎" },
    { id: "karte", name: "Karte", icon: "▦" },
    { id: "hinweise", name: "Hinweise", icon: "?" },
  ];
  function openPhone(app = null) {
    if (overlay === "akte") closeOverlay();
    overlay = "phone"; phoneApp = app;
    $("#phone").classList.remove("hidden");
    A.play("click");
    renderPhone();
  }
  function renderPhone() {
    $("#phoneClock").textContent = clockAt(S.playMs);
    const sc = $("#phoneScreen");
    if (!phoneApp) {
      sc.innerHTML = `<div class="phone-home-screen"><p class="phone-time">${clockAt(S.playMs)}</p><p class="phone-date">Mittwoch, 14. Oktober</p>
        <div class="app-grid">${APPS.map((a) => `<button class="app" data-app="${a.id}"><span class="app-icon${a.id === "licht" && light ? " on" : ""}">${a.icon}${a.id === "nachrichten" && S.unread.length ? `<i>${S.unread.length}</i>` : ""}</span><small>${a.name}</small></button>`).join("")}</div></div>`;
      return;
    }
    const app = APPS.find((a) => a.id === phoneApp);
    const head = `<div class="app-head"><button class="app-back" data-app-back aria-label="Zurück">‹</button><b>${app.name}</b></div>`;
    let body = "";
    if (phoneApp === "nachrichten") {
      S.unread = []; save(); renderSide();
      body = S.messages.length
        ? `<div class="msgs">${S.messages.map((m) => `<div class="msg"><p class="msg-from">${esc(N.messages[m.id].from)} · ${m.at}</p><p class="bubble">${fill(N.messages[m.id].text)}</p></div>`).join("")}</div>`
        : `<p class="app-empty">Keine Nachrichten.</p>`;
    }
    if (phoneApp === "notizen") body = `<textarea id="notesInput" class="note-area" placeholder="Codes, Namen, offene Fragen …">${esc(S.notes)}</textarea><p class="app-hint">Wird automatisch gespeichert.</p>`;
    if (phoneApp === "karte") {
      body = `${S.inventory.includes("hotelplan") ? `<div class="mini-plan">${paper("plan", N.docs.hotelplan.html)}</div>` : `<p class="app-empty">Noch kein Gebäudeplan gespeichert.</p>`}
        <p class="app-sub">BEREICHE</p><ul class="room-list">${N.rooms.map((r) => {
          const open = S.unlocked.includes(r.id), here = r.id === S.current, done = S.completed.includes(r.id);
          return `<li class="${here ? "here" : ""}"><span>${pad2(r.index + 1)}</span><b>${open ? esc(r.name) : "Verschlossen"}</b>${here ? "<em>Du bist hier</em>" : open ? `<button class="link-button" data-goto="${r.id}">Hingehen</button>` : ""}${done ? "<i>✓</i>" : ""}</li>`;
        }).join("")}</ul>`;
    }
    if (phoneApp === "hinweise") body = hintsHtml();
    sc.innerHTML = `<div class="app-view">${head}<div class="app-body">${body}</div></div>`;
    if (phoneApp === "notizen") { const t = $("#notesInput"); t.addEventListener("input", () => { S.notes = t.value; save(); }); }
  }
  function hintsHtml() {
    const r = room(), pid = currentPuzzle(r);
    if (!pid) return `<p class="app-empty">In diesem Bereich ist alles gelöst.</p>`;
    const p = PUZ[pid], n = S.hints[pid] || 0;
    const mins = Math.max(0, Math.floor((S.playMs - (S.puzzleStart[pid] ?? S.playMs)) / 60000));
    return `<p class="app-sub">AKTUELLES ZIEL</p><p class="hint-goal">${esc(p.objective || p.title)}</p>
      <p class="app-hint">Du bist seit ${mins === 0 ? "weniger als einer Minute" : plural(mins, "Minute", "Minuten")} an dieser Aufgabe.</p>
      <ol class="hint-list">${p.hints.map((h, i) => i < n
        ? `<li class="open"><b>Hinweis ${i + 1}${i === 2 ? " · Lösung" : ""}</b><p>${fill(h)}</p></li>`
        : `<li class="closed"><b>Hinweis ${i + 1}${i === 2 ? " · Lösung" : ""}</b><p>${i === n ? "Noch verdeckt." : "Erst nach dem vorherigen Hinweis."}</p></li>`).join("")}</ol>
      ${n < p.hints.length ? `<button class="primary-button small block" data-hint="${pid}">${n === p.hints.length - 1 ? "Lösung aufdecken" : `Hinweis ${n + 1} aufdecken`}</button>` : ""}`;
  }
  function toggleLight(on = !light) {
    light = on;
    A.play("light");
    closeOverlay();
    const r = room();
    const dark = r.views && r.views[viewIndex(r)].dark;
    renderStage({ narrate: light ? (dark ? "Die Taschenlampe ist an. Bewege den Lichtkegel mit der Maus oder dem Finger durch die Dunkelheit." : "Die Taschenlampe ist an. Hier ist es allerdings hell genug.") : "Die Taschenlampe ist aus." });
  }

  /* ---------- Akte zum Umblättern ---------- */
  function aktePages() {
    const pages = [{ type: "index" }];
    for (const id of S.docs) {
      const d = N.docs[id];
      (d.pages || [d.html]).forEach((html, i, arr) => pages.push({ id, html, i, n: arr.length }));
    }
    return pages;
  }
  function openAkte(docId = null) {
    if (overlay === "phone") closeOverlay();
    overlay = "akte";
    $("#akte").classList.remove("hidden");
    A.play("paper");
    const pages = aktePages();
    aktePage = docId ? Math.max(0, pages.findIndex((p) => p.id === docId)) : 0;
    renderAkte();
  }
  function renderAkte() {
    const pages = aktePages();
    aktePage = Math.min(aktePage, pages.length - 1);
    const pg = pages[aktePage];
    let html;
    if (pg.type === "index") {
      html = `<p class="akte-title">Ermittlungsakte</p><p class="akte-sub">Fall 014-10 · Hotel Nocturne</p>
        ${S.docs.length ? `<ol class="akte-index">${S.docs.map((id) => `<li><button data-akte-doc="${id}">${esc(N.docs[id].title)}${S.newDocs.includes(id) ? "<i>NEU</i>" : ""}</button></li>`).join("")}</ol>` : `<p class="muted">Noch leer.</p>`}`;
    } else {
      const d = N.docs[pg.id];
      S.newDocs = S.newDocs.filter((x) => x !== pg.id); save(); renderSide();
      html = `<p class="akte-doc-title">${esc(d.title)}${pg.n > 1 ? `<small>${pg.i === 0 ? "Vorderseite" : "Rückseite"}</small>` : ""}</p>${paper(d.kind, pg.html)}`;
    }
    $("#aktePage").innerHTML = html;
    $("#akteNum").textContent = aktePage === 0 ? "Inhalt" : `Seite ${aktePage} von ${pages.length - 1}`;
    $("#aktePrev").disabled = aktePage === 0;
    $("#akteNext").disabled = aktePage >= pages.length - 1;
  }
  function flip(to) {
    const pages = aktePages();
    if (to < 0 || to >= pages.length || to === aktePage) return;
    const pg = $("#aktePage"), dir = to > aktePage ? "next" : "prev";
    A.play("paper");
    pg.className = `akte-page out-${dir}`;
    setTimeout(() => { aktePage = to; renderAkte(); pg.className = `akte-page in-${dir}`; }, 220);
  }
  (() => {
    let sx = null;
    const pg = $("#akteBook");
    pg.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    pg.addEventListener("pointerup", (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) flip(aktePage + (dx < 0 ? 1 : -1)); });
  })();

  function closeOverlay() {
    overlay = null; phoneApp = null;
    $("#phone").classList.add("hidden");
    $("#akte").classList.add("hidden");
  }

  /* ---------- Menü ---------- */
  function openMenu() {
    openDialog({
      kicker: "MENÜ", title: "Einstellungen",
      html: `<div class="menu-list">
        <label class="switch"><input type="checkbox" id="optSound" ${S.sound ? "checked" : ""}><span>Geräusche</span></label>
        <label class="switch"><input type="checkbox" id="optHotspots" ${S.showHotspots ? "checked" : ""}><span>Untersuchbare Stellen immer anzeigen</span></label>
        <div class="stats"><span>Spielzeit <b>${Math.floor(S.playMs / 60000)} Min.</b></span><span>Hinweise <b>${Object.values(S.hints).reduce((a, b) => a + b, 0)}</b></span><span>Bereiche <b>${S.completed.length} / ${N.rooms.length}</b></span></div>
        <p class="muted small">Steuerung: Mit den Pfeilen links und rechts (oder Wischen bzw. den Pfeiltasten) drehst du dich im Raum. Gegenstände im Rucksack antippen und dann auf eine Stelle tippen – oder direkt dorthin ziehen.</p>
        <div class="button-row"><button class="ghost-button" data-title>Zum Titelbildschirm</button><button class="danger-button" data-reset>Spielstand löschen</button></div></div>`,
      after: () => {
        $("#optSound").addEventListener("change", (e) => { S.sound = e.target.checked; A.setEnabled(S.sound); updateSoundIcon(); save(); });
        $("#optHotspots").addEventListener("change", (e) => { S.showHotspots = e.target.checked; save(); renderStage(); });
      },
    });
  }
  function updateSoundIcon() {
    $("#soundToggle").classList.toggle("off", !S.sound);
    $("#soundToggle").setAttribute("aria-label", S.sound ? "Geräusche ausschalten" : "Geräusche einschalten");
  }
  function resetGame() {
    if (!confirm("Möchtest du wirklich den gesamten Spielstand löschen?")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ }
    S = fresh(); selected = null; light = false;
    closeDialog(); closeOverlay();
    renderIntro(); showScreen("intro");
  }

  /* ---------- Start & Ende ---------- */
  function start() {
    if (!S.started) {
      S.started = true;
      addDoc("reservierung"); S.newDocs = [];
      save();
      showScreen("game");
      render({ reset: true });
      A.play("paper");
      openDialog({
        kicker: "14. OKTOBER · 23:17", title: "Die Reservierung",
        html: `<p class="inspect-text">Der Umschlag lag ohne Absender in deinem Briefkasten. Jetzt stehst du in einer verlassenen Hotellobby, der Regen trommelt gegen die Scheiben – und die Tür hinter dir ist ins Schloss gefallen.</p>
          ${docHtml("reservierung")}<p class="found-note">▤ Die Reservierung liegt in deiner Akte.</p>
          <ul class="howto"><li><b>‹ ›</b> Umdrehen – oder wischen</li><li><b>Antippen</b> Dinge im Raum untersuchen</li><li><b>Rucksack</b> Gegenstand wählen, dann auf ein Ziel tippen oder ziehen</li><li><b>Telefon</b> Nachrichten, Taschenlampe, Karte, Hinweise</li></ul>
          <div class="button-row"><button class="primary-button small" data-close>Die Lobby betreten <span>→</span></button></div>`,
      });
      addMessage("m_start", 5000);
      return;
    }
    if (S.finished) return showEnding();
    showScreen("game");
    render({ reset: true });
  }
  function showEnding() {
    closeDialog();
    S.finished = true; save();
    const mins = Math.floor(S.playMs / 60000), hints = Object.values(S.hints).reduce((a, b) => a + b, 0);
    $("#endingLetter").innerHTML = `<p>An den Menschen, der bis hierher gekommen ist.</p>
      <p>Sie haben herausgefunden, was damals wirklich passiert ist. Die sechs Gäste sind nicht verschwunden. Sie wurden gerettet.</p>
      <p>Ich habe mich entschieden, den Weg durch den Westgang zu nehmen, obwohl ich wusste, dass ich damit gegen sämtliche offiziellen Anweisungen verstoßen würde. Ich konnte nicht zulassen, dass Menschen sterben, nur weil jemand Geld sparen wollte.</p>
      <p>Mara war unter ihnen. Ich habe das Register mitgenommen, weil ich wusste, dass die Wahrheit eines Tages ans Licht kommen muss.</p>
      <p>Wenn Sie dieses Dokument lesen, dann ist das Hotel nicht länger ein Ort der Lügen. Es ist Zeit, die Tür zu öffnen.</p>
      <p class="sign">Elias Voss</p>`;
    $("#endingPersonal").textContent = N.config.personalMessage || "";
    $("#endingStats").textContent = `Spielzeit ${mins} Min. · ${plural(hints, "Hinweis", "Hinweise")} genutzt`;
    showScreen("ending");
    A.play("success");
  }

  /* ---------- Ereignisse ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const ds = t.dataset;
    if (ds.hs) return onHotspot(ds.hs);
    if (ds.slot && e.detail === 0) return selectItem(ds.slot); // Tastatur
    if (ds.goto) { if (ROOM[ds.goto].id === S.current) return closeOverlay(); return goRoom(ds.goto, ds.via); }
    if (ds.app) { if (ds.app === "licht") return toggleLight(); phoneApp = ds.app; A.play("click"); return renderPhone(); }
    if ("appBack" in ds) { phoneApp = null; return renderPhone(); }
    if (ds.akteDoc) return flip(aktePages().findIndex((p) => p.id === ds.akteDoc));
    if (ds.examine) return openItem(ds.examine);
    if ("deselect" in ds) { selected = null; renderSide(); return setNarration("Du steckst den Gegenstand wieder ein."); }
    if ("close" in ds) return closeDialog();
    if ("ending" in ds) return showEnding();
    if ("reset" in ds) return resetGame();
    if ("title" in ds) { closeDialog(); renderIntro(); return showScreen("intro"); }
    if (ds.hint) { S.hints[ds.hint] = (S.hints[ds.hint] || 0) + 1; save(); A.play("paper"); return renderPhone(); }
  });
  $("#closeDialog").addEventListener("click", closeDialog);
  $("#startButton").addEventListener("click", () => { A.setEnabled(S.sound); start(); });
  $("#newGameLink").addEventListener("click", (e) => { e.preventDefault(); resetGame(); });
  $("#restartButton").addEventListener("click", resetGame);
  $("#brandHome").addEventListener("click", (e) => { e.preventDefault(); if (S.started) { closeDialog(); renderIntro(); showScreen("intro"); } });
  $("#turnLeft").addEventListener("click", () => turn(-1));
  $("#turnRight").addEventListener("click", () => turn(1));
  $("#phoneButton").addEventListener("click", () => (overlay === "phone" ? closeOverlay() : openPhone()));
  $("#akteButton").addEventListener("click", () => (overlay === "akte" ? closeOverlay() : openAkte()));
  $("#lightChip").addEventListener("click", () => toggleLight(false));
  $("#aktePrev").addEventListener("click", () => flip(aktePage - 1));
  $("#akteNext").addEventListener("click", () => flip(aktePage + 1));
  $$("[data-overlay-close]").forEach((b) => b.addEventListener("click", closeOverlay));
  $("#phone").addEventListener("click", (e) => { if (e.target.id === "phone") closeOverlay(); });
  $("#akte").addEventListener("click", (e) => { if (e.target.id === "akte") closeOverlay(); });
  $("#menuButton").addEventListener("click", openMenu);
  $("#soundToggle").addEventListener("click", () => { S.sound = !S.sound; A.setEnabled(S.sound); updateSoundIcon(); save(); if (S.sound && inGame()) { A.play("click"); render(); } });
  document.addEventListener("keydown", (e) => {
    if (!inGame() || dlg.open || e.target.matches("input, textarea")) return;
    if (e.key === "Escape") { if (overlay) closeOverlay(); else if (selected) { selected = null; renderSide(); } return; }
    if (overlay === "akte") { if (e.key === "ArrowRight") flip(aktePage + 1); if (e.key === "ArrowLeft") flip(aktePage - 1); return; }
    if (overlay) return;
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "ArrowLeft") turn(-1);
  });

  /* ---------- Gewitter ---------- */
  (function storm() {
    setTimeout(() => {
      const r = room();
      if (inGame() && r.weather === "storm" && !document.hidden) {
        document.body.classList.add("flash");
        setTimeout(() => document.body.classList.remove("flash"), 120);
        setTimeout(() => { document.body.classList.add("flash"); setTimeout(() => document.body.classList.remove("flash"), 90); }, 260);
        setTimeout(() => A.play("thunder"), 1300);
      }
      storm();
    }, 28000 + Math.random() * 40000);
  })();

  /* ---------- Spielzeit & Uhr ---------- */
  let ticks = 0;
  setInterval(() => {
    if (document.hidden || !inGame() || S.finished) return;
    S.playMs += 1000;
    if (++ticks % 10 === 0) save();
    $("#clock").textContent = clockAt(S.playMs);
  }, 1000);
  window.addEventListener("pagehide", save);

  /* ---------- Los geht’s ---------- */
  load();
  A.setEnabled(S.sound);
  updateSoundIcon();
  $("#clock").textContent = clockAt(S.playMs);
  renderIntro();
  showScreen("intro");
})();
