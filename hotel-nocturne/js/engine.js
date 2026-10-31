/*
 * HOTEL NOCTURNE – Spiel-Engine
 * Liest die Raumdaten aus js/rooms/*.js und kümmert sich um Darstellung,
 * Rätsel, Inventar, Beweismappe, Hinweise und Spielstand.
 */
(() => {
  "use strict";
  const N = window.NOCTURNE;
  const A = N.audio;
  const SAVE_KEY = "nocturne_save_v1";

  /* ---------- Hilfsfunktionen ---------- */
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const playerName = () => (N.config.playerName || "").trim() || "Verehrter Gast";
  const fill = (s) => String(s ?? "").replaceAll("{name}", esc(playerName()));
  const norm = (s) => String(s ?? "").toUpperCase().replace(/ß/g, "SS").replace(/[^A-Z0-9ÄÖÜ]/g, "");
  const pad2 = (n) => String(n).padStart(2, "0");

  /* ---------- Raumdaten aufbereiten ---------- */
  const ROOM = {};
  const PUZ = {};
  N.rooms.forEach((r, i) => {
    r.index = i;
    ROOM[r.id] = r;
    for (const [id, p] of Object.entries(r.puzzles || {})) { p.id = id; p.room = r.id; PUZ[id] = p; }
  });

  /* ---------- Spielstand ---------- */
  const fresh = () => ({
    v: 1, started: false, finished: false,
    current: N.rooms[0].id, unlocked: [N.rooms[0].id], completed: [],
    solved: [], flags: [], inventory: [], docs: [], newDocs: [],
    hints: {}, puzzleStart: {}, playMs: 0, notes: "",
    sound: true, showHotspots: false,
  });
  let S = fresh();
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && s.v === 1) S = Object.assign(fresh(), s);
      if (!ROOM[S.current]) S.current = N.rooms[0].id;
    } catch (e) { /* defekter Spielstand → neu beginnen */ }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* z. B. privater Modus */ } }
  const has = (flag) => S.flags.includes(flag);
  const isSolved = (pid) => S.solved.includes(pid);
  const add = (arr, v) => (arr.includes(v) ? false : (arr.push(v), true));

  /* ---------- Aktionen (Belohnungen, Freischaltungen …) ---------- */
  let gained = [];
  let justCompleted = null;

  function run(actions) {
    for (const a of actions || []) {
      if (a.flag) add(S.flags, a.flag);
      if (a.give && add(S.inventory, a.give)) gained.push(N.items[a.give].icon + " " + N.items[a.give].name);
      if (a.doc && addDoc(a.doc)) gained.push("▤ " + N.docs[a.doc].title);
      if (a.sound) A.play(a.sound);
      if (a.solve) solve(a.solve);
    }
  }
  function addDoc(id) {
    if (!N.docs[id] || S.docs.includes(id)) return false;
    S.docs.push(id); S.newDocs.push(id);
    return true;
  }
  function solve(pid) {
    if (isSolved(pid)) return;
    S.solved.push(pid);
    const p = PUZ[pid];
    run(p.onSolve);
    const r = ROOM[p.room];
    if (!S.completed.includes(r.id) && (r.completeWhen || []).every(isSolved)) completeRoom(r);
    save();
  }
  function completeRoom(r) {
    S.completed.push(r.id);
    justCompleted = r.id;
    const next = N.rooms[r.index + 1];
    if (next) add(S.unlocked, next.id);
    if (r.final) S.finished = true;
  }
  const currentPuzzle = (r) => Object.keys(r.puzzles || {}).find((id) => !isSolved(id));

  /* ---------- Bildschirme ---------- */
  function showScreen(id) {
    ["intro", "game", "ending"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
    if (id !== "game") A.ambient(null);
    window.scrollTo(0, 0);
  }

  function renderIntro() {
    $("#introName").textContent = playerName();
    $("#startButton").innerHTML = S.started ? "Weiterspielen <span>→</span>" : "Einchecken <span>→</span>";
    $("#newGameLink").classList.toggle("hidden", !S.started);
  }

  /* ---------- Hauptansicht ---------- */
  function render() {
    const r = ROOM[S.current];
    const pid = currentPuzzle(r);
    if (pid && S.puzzleStart[pid] == null) { S.puzzleStart[pid] = S.playMs; save(); }

    // Kopfzeile des Raums
    $("#roomKicker").textContent = r.kicker;
    $("#roomTitle").textContent = r.title;
    $("#roomNumber").textContent = pad2(r.index + 1);
    const done = S.completed.includes(r.id);
    const next = N.rooms[r.index + 1];
    $("#objective").innerHTML = done
      ? `<span class="obj-done">✓ Bereich gesichert</span>${next && !r.final ? `<button class="link-button" data-goto="${next.id}">Weiter: ${esc(next.name)} →</button>` : ""}${r.final ? `<button class="link-button" data-ending>Den letzten Brief lesen →</button>` : ""}`
      : `<span class="obj-label">ZIEL</span> ${esc(PUZ[pid]?.objective || "Untersuche den Raum.")}`;

    // Szene
    const sc = $("#scene");
    sc.classList.toggle("draft", !r.scene);
    sc.classList.toggle("show-hotspots", S.showHotspots);
    $("#panHint").classList.toggle("hidden", !r.scene);
    if (r.scene) {
      sc.innerHTML = `<div class="stage">${r.scene}` + r.hotspots.filter(visible).map((h) =>
        `<button class="hotspot" data-hs="${h.id}" style="left:${h.x + h.w / 2}%;top:${h.y + h.h / 2}%;width:${h.w}%;height:${h.h}%" aria-label="${esc(h.label)} untersuchen"><span class="hs-label">${esc(h.label)}</span></button>`
      ).join("") + `</div>`;
      $$("[data-if]", sc).forEach((el) => { el.style.display = has(el.dataset.if) ? "" : "none"; });
      $$("[data-unless]", sc).forEach((el) => { el.style.display = has(el.dataset.unless) ? "none" : ""; });
    } else {
      sc.innerHTML = `<div class="draft-inner"><p class="draft-title">${esc(r.title)}</p><p class="draft-sub">14. OKTOBER 2009 · NACH 23:17</p>
        <div class="draft-cards">${r.hotspots.map((h) => `<button class="card-object" data-hs="${h.id}"><span class="glyph">${h.glyph}</span><small>${esc(h.label)}</small></button>`).join("")}</div>
        <p class="draft-tag">Vorläufige Raumansicht – dieser Bereich wird noch ausgestaltet</p></div>`;
    }
    $("#storyText").textContent = r.story;
    if (lastRendered !== r.id) {
      lastRendered = r.id;
      sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; // Smartphone: Szene mittig zeigen
    }

    renderNav();
    renderInventory();
    A.ambient(r.ambient && !S.finished ? r.ambient : null);
  }
  let lastRendered = null;
  const visible = (h) => (!h.if || has(h.if)) && (!h.unless || !has(h.unless));

  function renderNav() {
    $("#roomNav").innerHTML = N.rooms.map((r) => {
      const unlocked = S.unlocked.includes(r.id), done = S.completed.includes(r.id);
      return `<button class="room-link ${r.id === S.current ? "current" : ""} ${done ? "done" : ""} ${unlocked ? "" : "locked"}" data-goto="${r.id}" ${unlocked ? "" : "disabled"} ${r.id === S.current ? 'aria-current="true"' : ""}>
        <span class="num">${pad2(r.index + 1)}</span><span class="room-name">${unlocked ? esc(r.name) : "Verschlossen"}</span></button>`;
    }).join("");
    const n = S.completed.length, total = N.rooms.length;
    $("#progressText").textContent = `${n} / ${total}`;
    $("#progressBar").style.width = `${(n / total) * 100}%`;
    $("#evidenceCount").textContent = S.docs.length;
    $("#evidenceCount").classList.toggle("fresh", S.newDocs.length > 0);
    $("#planButton").classList.toggle("hidden", !S.inventory.includes("hotelplan"));
  }

  function renderInventory() {
    const inv = $("#inventory");
    inv.innerHTML = S.inventory.length
      ? S.inventory.map((id) => `<button class="inv-item" data-item="${id}" title="${esc(N.items[id].name)}"><span>${N.items[id].icon}</span><small>${esc(N.items[id].name)}</small></button>`).join("")
      : `<p class="inv-empty">Noch keine Gegenstände</p>`;
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
    if (!$("#game").classList.contains("hidden")) render();
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(); });

  const docHtml = (id) => `<article class="paper paper-${N.docs[id].kind}">${fill(N.docs[id].html)}</article>`;

  /* ---------- Untersuchen ---------- */
  function inspect(hsId) {
    const r = ROOM[S.current];
    const h = r.hotspots.find((x) => x.id === hsId);
    if (!h) return;
    A.play("click");
    if (h.sound) A.play(h.sound);
    const parts = [];
    let after = null;
    if (h.text) parts.push(`<p class="inspect-text">${fill(h.text)}</p>`);
    if (h.doc) {
      A.play("paper");
      parts.push(docHtml(h.doc));
      if (addDoc(h.doc)) parts.push(`<p class="found-note">▤ In die Beweismappe gelegt</p>`);
      save();
    }
    const pid = h.lock || h.use;
    if (pid) {
      const p = PUZ[pid];
      if (isSolved(pid)) parts.push(`<div class="solved-box"><span>✓</span><p>${fill(p.success)}</p></div>`);
      else { parts.push(lockHtml(p)); after = () => bindLock(p); }
    }
    openDialog({ kicker: r.name.toUpperCase(), title: h.title || h.label, html: parts.join(""), after, wide: Boolean(h.doc && N.docs[h.doc].kind === "plan") });
    renderNav();
  }

  /* ---------- Schlösser & Rätsel ---------- */
  function lockHtml(p) {
    const head = `${p.prompt ? `<p class="lock-prompt">${fill(p.prompt)}</p>` : ""}${p.clue ? `<div class="clue">${esc(p.clue)}</div>` : ""}`;
    const fb = `<p class="lock-feedback" role="status" aria-live="polite"></p>`;
    if (p.type === "code") {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
      return `<div class="lock lock-code">${head}
        <div class="code-slots" aria-label="Eingegebener Code">${Array.from({ length: p.length }, () => `<span></span>`).join("")}</div>
        <div class="keypad">${keys.map((k) => `<button type="button" data-key="${k}" aria-label="${k === "⌫" ? "Löschen" : k === "✓" ? "Bestätigen" : k}">${k}</button>`).join("")}</div>${fb}</div>`;
    }
    if (p.type === "text") {
      return `<form class="lock lock-text">${head}<div class="text-row"><input class="text-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Lösung eingeben" aria-label="Lösung"><button class="submit-button">Prüfen</button></div>${fb}</form>`;
    }
    if (p.type === "multi") {
      return `<form class="lock lock-multi">${head}${p.fields.map((f, i) => `<label class="multi-field"><span>${i + 1}. ${esc(f.label)}</span><input class="text-input" autocomplete="off" spellcheck="false"></label>`).join("")}<button class="submit-button wide">Tresor öffnen</button>${fb}</form>`;
    }
    if (p.type === "use") {
      const items = S.inventory;
      return `<div class="lock lock-use"><p class="lock-prompt">Welchen Gegenstand möchtest du hier benutzen?</p>
        ${items.length ? `<div class="use-items">${items.map((id) => `<button type="button" class="use-item" data-use="${id}"><span>${N.items[id].icon}</span> ${esc(N.items[id].name)}</button>`).join("")}</div>` : `<p class="muted">${esc(p.noItems || "Du hast noch nichts, was du hier benutzen könntest.")}</p>`}${fb}</div>`;
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
      if (isCorrect(p, value)) return succeed(p);
      const special = p.wrong && typeof value === "string" ? p.wrong[norm(value)] : null;
      fail(special);
      return false;
    };

    if (p.type === "code") {
      let entry = "";
      const slots = $$(".code-slots span", root);
      const paint = () => slots.forEach((s, i) => { s.textContent = entry[i] || ""; s.classList.toggle("filled", i < entry.length); });
      const press = (k) => {
        if (k === "⌫") entry = entry.slice(0, -1);
        else if (k === "✓") { if (entry.length === p.length) { if (!attempt(entry)) { entry = ""; } } else fail("Der Code hat " + p.length + " Stellen."); }
        else if (/^\d$/.test(k) && entry.length < p.length) {
          entry += k;
          A.play("key");
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
        if (vals.some((v) => !v.trim())) return fail("Bitte beantworte alle vier Fragen.");
        // Rückmeldung, wie viele Antworten stimmen – ohne zu verraten, welche
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

  function isCorrect(p, value) {
    if (p.type === "multi") return false; // wird separat geprüft
    return (p.answers || []).map(norm).includes(norm(value));
  }

  function succeed(p) {
    if (dlgCleanup) { dlgCleanup(); dlgCleanup = null; }
    gained = [];
    A.play("unlock");
    solve(p.id);
    setTimeout(() => A.play("success"), 250);
    const r = ROOM[p.room];
    const next = N.rooms[r.index + 1];
    const completedNow = justCompleted === r.id;
    let buttons = `<button class="primary-button small" data-close>Weiter untersuchen</button>`;
    if (completedNow && r.final) buttons = `<button class="primary-button small" data-ending>Den letzten Brief lesen <span>→</span></button>`;
    else if (completedNow && next) buttons = `<button class="primary-button small" data-goto="${next.id}">Weiter: ${esc(next.name)} <span>→</span></button><button class="ghost-button" data-close>Noch hier bleiben</button>`;
    openDialog({
      kicker: r.name.toUpperCase(),
      title: completedNow ? "Bereich gesichert" : "Gelöst",
      html: `<div class="success-box"><div class="success-mark">✓</div><p>${fill(p.success)}</p>
        ${gained.length ? `<div class="gained"><p class="eyebrow">GEFUNDEN</p><ul>${gained.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
        ${completedNow && next ? `<p class="unlock-note">Neuer Bereich freigeschaltet: <b>${esc(next.name)}</b></p>` : ""}
        <div class="button-row">${buttons}</div></div>`,
    });
    // Szene im Hintergrund schon aktualisieren (z. B. geöffneter Schlüsselkasten)
    render();
    return true;
  }

  /* ---------- Beweismappe, Inventar, Notizen, Hinweise, Menü ---------- */
  function openEvidence(docId) {
    if (docId) {
      S.newDocs = S.newDocs.filter((d) => d !== docId); save();
      openDialog({
        kicker: "BEWEISMAPPE", title: N.docs[docId].title, wide: N.docs[docId].kind === "plan",
        html: `${docHtml(docId)}<div class="button-row"><button class="ghost-button" data-evidence>← Zurück zur Beweismappe</button></div>`,
      });
      renderNav();
      return;
    }
    openDialog({
      kicker: "BEWEISMAPPE", title: `${S.docs.length} ${S.docs.length === 1 ? "Dokument" : "Dokumente"}`,
      html: S.docs.length
        ? `<ul class="doc-list">${S.docs.map((id) => `<li><button data-doc="${id}"><span>▤</span>${esc(N.docs[id].title)}${S.newDocs.includes(id) ? `<i>NEU</i>` : ""}</button></li>`).join("")}</ul>`
        : `<p class="muted">Noch keine Dokumente gefunden. Untersuche die Räume sorgfältig.</p>`,
    });
  }

  function openItem(id) {
    const it = N.items[id];
    openDialog({
      kicker: "INVENTAR", title: it.name, wide: it.doc && N.docs[it.doc].kind === "plan",
      html: `<p class="inspect-text">${fill(it.text)}</p>${it.doc ? docHtml(it.doc) : ""}`,
    });
  }

  function openNotes() {
    openDialog({
      kicker: "NOTIZBUCH", title: "Eigene Notizen",
      html: `<p class="muted">Halte Zusammenhänge, Codes und offene Fragen fest. Die Notizen werden in diesem Browser gespeichert.</p>
        <textarea id="notesInput" class="note-area" placeholder="Was ist dir aufgefallen?">${esc(S.notes)}</textarea>`,
      after: () => { const t = $("#notesInput"); t.addEventListener("input", () => { S.notes = t.value; save(); }); },
    });
  }

  function openHints() {
    const r = ROOM[S.current];
    const pid = currentPuzzle(r);
    if (!pid) {
      openDialog({ kicker: "HINWEISE", title: r.name, html: `<p class="muted">In diesem Bereich ist alles gelöst.</p>` });
      return;
    }
    const p = PUZ[pid];
    const n = S.hints[pid] || 0;
    const mins = Math.max(0, Math.floor((S.playMs - (S.puzzleStart[pid] ?? S.playMs)) / 60000));
    openDialog({
      kicker: "HINWEISE", title: p.objective || p.title,
      html: `<p class="muted">Du beschäftigst dich seit ${mins === 0 ? "weniger als einer Minute" : mins === 1 ? "einer Minute" : mins + " Minuten"} mit dieser Aufgabe.</p>
        <ol class="hint-list">${p.hints.map((h, i) => i < n
          ? `<li class="open"><b>Hinweis ${i + 1}${i === 2 ? " · Lösung" : ""}</b><p>${fill(h)}</p></li>`
          : `<li class="closed"><b>Hinweis ${i + 1}${i === 2 ? " · Lösung" : ""}</b><p>${i === n ? "Noch verdeckt." : "Erst nach dem vorherigen Hinweis verfügbar."}</p></li>`).join("")}</ol>
        ${n < p.hints.length ? `<div class="button-row"><button class="primary-button small" data-hint="${pid}">${n === p.hints.length - 1 ? "Lösung aufdecken" : `Hinweis ${n + 1} aufdecken`}</button></div>` : ""}`,
    });
  }

  function openMenu() {
    openDialog({
      kicker: "MENÜ", title: "Einstellungen",
      html: `<div class="menu-list">
        <label class="switch"><input type="checkbox" id="optSound" ${S.sound ? "checked" : ""}><span>Geräusche</span></label>
        <label class="switch"><input type="checkbox" id="optHotspots" ${S.showHotspots ? "checked" : ""}><span>Untersuchbare Stellen immer anzeigen</span></label>
        <div class="stats"><span>Spielzeit <b>${Math.floor(S.playMs / 60000)} Min.</b></span><span>Hinweise <b>${Object.values(S.hints).reduce((a, b) => a + b, 0)}</b></span><span>Bereiche <b>${S.completed.length} / ${N.rooms.length}</b></span></div>
        <div class="button-row"><button class="ghost-button" data-title>Zum Titelbildschirm</button><button class="danger-button" data-reset>Spielstand löschen</button></div></div>`,
      after: () => {
        $("#optSound").addEventListener("change", (e) => { S.sound = e.target.checked; A.setEnabled(S.sound); updateSoundIcon(); save(); });
        $("#optHotspots").addEventListener("change", (e) => { S.showHotspots = e.target.checked; save(); render(); });
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
    S = fresh();
    closeDialog();
    renderIntro();
    showScreen("intro");
  }

  /* ---------- Spielstart & Ende ---------- */
  function start() {
    if (!S.started) {
      S.started = true;
      addDoc("reservierung");
      S.newDocs = [];
      save();
      showScreen("game");
      render();
      A.play("paper");
      openDialog({
        kicker: "14. OKTOBER · 23:17", title: "Die Reservierung",
        html: `<p class="inspect-text">Der Umschlag lag ohne Absender in deinem Briefkasten. Jetzt stehst du in einer verlassenen Hotellobby, der Regen trommelt gegen die Fenster – und die Tür hinter dir ist ins Schloss gefallen.</p>
          ${docHtml("reservierung")}
          <p class="found-note">▤ Die Reservierung liegt in deiner Beweismappe.</p>
          <p class="muted small">Tippe auf Dinge im Raum, um sie zu untersuchen. Unten findest du Inventar, Beweismappe, Notizen und Hinweise.</p>
          <div class="button-row"><button class="primary-button small" data-close>Die Lobby betreten <span>→</span></button></div>`,
      });
      return;
    }
    if (S.finished) return showEnding();
    showScreen("game");
    render();
  }

  function showEnding() {
    closeDialog();
    S.finished = true; save();
    const mins = Math.floor(S.playMs / 60000);
    const hints = Object.values(S.hints).reduce((a, b) => a + b, 0);
    $("#endingLetter").innerHTML = `<p>An den Menschen, der bis hierher gekommen ist.</p>
      <p>Sie haben herausgefunden, was damals wirklich passiert ist. Die sechs Gäste sind nicht verschwunden. Sie wurden gerettet.</p>
      <p>Ich habe mich entschieden, den Weg durch den Westgang zu nehmen, obwohl ich wusste, dass ich damit gegen sämtliche offiziellen Anweisungen verstoßen würde. Ich konnte nicht zulassen, dass Menschen sterben, nur weil jemand Geld sparen wollte.</p>
      <p>Mara war unter ihnen. Ich habe das Register mitgenommen, weil ich wusste, dass die Wahrheit eines Tages ans Licht kommen muss.</p>
      <p>Wenn Sie dieses Dokument lesen, dann ist das Hotel nicht länger ein Ort der Lügen. Es ist Zeit, die Tür zu öffnen.</p>
      <p class="sign">Elias Voss</p>`;
    $("#endingPersonal").textContent = N.config.personalMessage || "";
    $("#endingStats").textContent = `Spielzeit ${mins} Min. · ${hints} ${hints === 1 ? "Hinweis" : "Hinweise"} genutzt`;
    showScreen("ending");
    A.play("success");
  }

  /* ---------- Ereignisse ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.hs) return inspect(t.dataset.hs);
    if (t.dataset.goto) { S.current = t.dataset.goto; save(); closeDialog(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); A.play(t.closest("#roomNav") ? "click" : "open"); return; }
    if (t.dataset.item) return openItem(t.dataset.item);
    if (t.dataset.doc) return openEvidence(t.dataset.doc);
    if ("evidence" in t.dataset) return openEvidence();
    if ("close" in t.dataset) return closeDialog();
    if ("ending" in t.dataset) return showEnding();
    if ("reset" in t.dataset) return resetGame();
    if ("title" in t.dataset) { closeDialog(); renderIntro(); return showScreen("intro"); }
    if (t.dataset.hint) { S.hints[t.dataset.hint] = (S.hints[t.dataset.hint] || 0) + 1; save(); A.play("paper"); return openHints(); }
  });
  $("#closeDialog").addEventListener("click", closeDialog);
  $("#startButton").addEventListener("click", () => { A.setEnabled(S.sound); start(); });
  $("#newGameLink").addEventListener("click", (e) => { e.preventDefault(); resetGame(); });
  $("#restartButton").addEventListener("click", resetGame);
  $("#brandHome").addEventListener("click", (e) => { e.preventDefault(); if (S.started) { closeDialog(); renderIntro(); showScreen("intro"); } });
  $("#evidenceButton").addEventListener("click", () => openEvidence());
  $("#notesButton").addEventListener("click", openNotes);
  $("#hintButton").addEventListener("click", openHints);
  $("#planButton").addEventListener("click", () => openItem("hotelplan"));
  $("#menuButton").addEventListener("click", openMenu);
  $("#soundToggle").addEventListener("click", () => { S.sound = !S.sound; A.setEnabled(S.sound); updateSoundIcon(); save(); if (S.sound) { A.play("click"); if (!$("#game").classList.contains("hidden")) render(); } });

  /* ---------- Spielzeit & Uhr ---------- */
  function updateClock() {
    const m = 23 * 60 + 17 + Math.floor(S.playMs / 60000);
    $("#clock").textContent = `${pad2(Math.floor(m / 60) % 24)}:${pad2(m % 60)}`;
  }
  let ticks = 0;
  setInterval(() => {
    if (document.hidden || $("#game").classList.contains("hidden") || S.finished) return;
    S.playMs += 1000;
    if (++ticks % 10 === 0) save();
    updateClock();
  }, 1000);
  window.addEventListener("pagehide", save);

  /* ---------- Los geht’s ---------- */
  load();
  A.setEnabled(S.sound);
  updateSoundIcon();
  updateClock();
  renderIntro();
  showScreen("intro");
})();
