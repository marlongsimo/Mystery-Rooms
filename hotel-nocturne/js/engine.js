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
  let saveKey = SAVE_KEY;  // im Multiplayer: eigener Spielstand je Sitzung (der Einzelspieler-Stand bleibt unberührt)
  let mp = null;           // Multiplayer-Anbindung (js/mp-adapter.js), sonst null
  N.messages = N.messages || {};
  const MUSIC = "assets/audio/shadowed-loop.mp3"; // Hintergrundmusik des Hotels (Räume können mit music: "…" abweichen)

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
    current: N.rooms[0].id, unlocked: [N.rooms[0].id], visited: [N.rooms[0].id], completed: [], views: {},
    solved: [], flags: [], inventory: [], docs: [], newDocs: [], messages: [], unread: [],
    secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 0, notes: "", sound: true, music: true, showHotspots: false,
  });
  let S = fresh();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(saveKey) || "null");
      if (s && s.v === 2) S = Object.assign(fresh(), s);
      S.gone = { items: [], flags: [], ...(S.gone || {}) };
      if (!ROOM[S.current]) S.current = N.rooms[0].id;
      // ältere Spielstände ohne „besucht“: alles Abgeschlossene und der aktuelle Raum gelten als besucht
      [...S.completed, S.current].forEach((id) => add(S.visited, id));
      // Wurde die Seite neu geladen, während eine verzögerte Aktion noch ausstand
      // (z. B. Gepäckausgabe), wird sie jetzt sofort nachgeholt – sonst entstünde eine Sackgasse.
      // Migration: Frühere Platzhalter-Räume tragen dieselbe ID wie die neuen, vollständigen Räume.
      // Ein Raum bleibt nur „abgeschlossen“, wenn seine heutigen Rätsel wirklich gelöst sind.
      S.completed = S.completed.filter((id) => ROOM[id] && (ROOM[id].completeWhen || []).every((pid) => S.solved.includes(pid)));
      const open = S.pending; S.pending = [];
      open.forEach((p) => run(p.actions));
      if (open.length) save();
    } catch (e) { /* defekter Spielstand → neu beginnen */ }
  }
  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify(S)); } catch (e) { /* privater Modus */ }
    if (mp && mp.changed) mp.changed(); // gemeinsamen Stand abgleichen (gebündelt, nicht bei jedem Aufruf)
  }

  /* Laufzeit-Zustand (wird nicht gespeichert) */
  let selected = null;     // ausgewählter Gegenstand im Rucksack
  let light = false;       // Taschenlampe
  let overlay = null;      // "phone" | "akte" | null
  let phoneApp = null;
  let aktePage = 0;
  let lockPid = null;      // Rätsel, dessen Schloss gerade im Dialog offen ist

  const room = () => ROOM[S.current];
  const viewIndex = (r) => S.views[r.id] || 0;
  const has = (flag) => (flag === "licht" ? light : S.flags.includes(flag));
  const isSolved = (pid) => S.solved.includes(pid);
  const add = (arr, v) => (arr.includes(v) ? false : (arr.push(v), true));
  // Flags, die nur die eigene Sicht betreffen (Ereignisse, kurze Bildschirmeffekte), werden nie geteilt.
  const localFlag = (f) => f.startsWith("evt_") || ((N.config.multiplayer || {}).localFlags || []).includes(f);
  const visible = (h) => (!h.if || has(h.if)) && (!h.unless || !has(h.unless));
  const clockAt = (ms) => { const m = 23 * 60 + 17 + Math.floor(ms / 60000); return `${pad2(Math.floor(m / 60) % 24)}:${pad2(m % 60)}`; };
  const currentPuzzle = (r) => Object.keys(r.puzzles || {}).find((id) => !isSolved(id));
  /* Das nächste offene Rätsel im Spiel: zuerst im aktuellen Raum, sonst im frühesten
     unvollständigen Raum, den man schon betreten hat (z. B. Tür in der Rezeption,
     die zu Zimmer 217 gehört). */
  function frontierPuzzle() {
    const here = currentPuzzle(room());
    if (here) return here;
    const r = N.rooms.find((x) => !S.completed.includes(x.id) && S.visited.includes(x.id));
    return r ? currentPuzzle(r) : null;
  }
  const ALL_SECRETS = () => N.rooms.flatMap(hotspotsOf).filter((h) => h.secret).length;

  /* ---------- Aktionen ---------- */
  let gained = [];
  let justCompleted = null;
  function run(actions) {
    for (const a of actions || []) {
      if (a.flag) add(S.flags, a.flag);
      if (a.unflag) { S.flags = S.flags.filter((f) => f !== a.unflag); if (!localFlag(a.unflag)) add(S.gone.flags, a.unflag); }
      if (a.open && N.docs[a.open] && inGame()) { // Dokument direkt zeigen, z. B. eine abgespielte Aufnahme
        addDoc(a.open);
        openDialog({ kicker: "AUFNAHME", title: N.docs[a.open].title, html: docHtml(a.open), wide: true });
      }
      if (a.give && add(S.inventory, a.give)) gained.push(N.items[a.give].icon + " " + N.items[a.give].name);
      if (a.doc && addDoc(a.doc)) gained.push("▤ " + N.docs[a.doc].title);
      if (a.sound) A.play(a.sound);
      if (a.message) addMessage(a.message);
      if (a.unlock) add(S.unlocked, a.unlock);
      if (a.evidence) { add(S.evidence, a.evidence); if (N.docs[a.evidence]) addDoc(a.evidence); } // Beweis für den Abschlussbericht
      if (a.remove) { S.inventory = S.inventory.filter((x) => x !== a.remove); add(S.gone.items, a.remove); if (selected === a.remove) selected = null; }
      if (a.later) { // verzögerte Aktionen, z. B. etwas rumpelt erst nach ein paar Sekunden
        const roomId = S.current;
        const key = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
        S.pending.push({ key, actions: a.later.actions }); // wird mitgespeichert, falls neu geladen wird
        setTimeout(() => {
          const p = S.pending.find((x) => x.key === key);
          if (!p) return; // bereits beim Laden nachgeholt
          S.pending = S.pending.filter((x) => x.key !== key);
          run(p.actions); save();
          if (inGame() && S.current === roomId) {
            // Meldung nur zeigen, wenn die Spielerin noch in die passende Richtung blickt
            const r = room(), here = r.views ? r.views[viewIndex(r)].id : null;
            const narrate = !a.later.view || a.later.view === here ? a.later.narrate : null;
            renderStage({ narrate }); renderSide(); renderObjective();
          }
        }, a.later.ms || 1500);
      }
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
    if (id !== "game") { A.ambient(null); A.music(null); closeOverlay(); }
    window.scrollTo(0, 0);
  }
  const inGame = () => !$("#game").classList.contains("hidden");
  function renderIntro() {
    document.body.classList.toggle("mp-mode", Boolean(mp));
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
    A.music(S.music && !S.finished ? r.music || MUSIC : null);
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
    const r = room(), done = S.completed.includes(r.id);
    const pid = frontierPuzzle();
    const next = N.rooms[r.index + 1];
    if (done && pid && PUZ[pid].room !== r.id) { // Aufgabe geht in einem anderen Raum weiter
      $("#objective").innerHTML = `<span class="obj-label">ZIEL</span> ${esc(PUZ[pid].objective)}`;
      return;
    }
    const fresh = N.rooms.find((x) => S.unlocked.includes(x.id) && !S.visited.includes(x.id));
    // Ein neuer Bereich ist offen, aber nicht der direkte Nachfolger dieses Raums (z. B. Treppe hinter der Tür „Personal“)
    if (done && fresh && !(next && next.id === fresh.id)) {
      $("#objective").innerHTML = `<span class="obj-label">ZIEL</span> Neuer Bereich offen: ${esc(fresh.name)}. Finde den Weg dorthin.`;
      return;
    }
    // Ist in einem früher betretenen Raum noch etwas offen, wird es zusätzlich angezeigt.
    const behind = N.rooms.find((x) => x.id !== r.id && S.visited.includes(x.id) && !S.completed.includes(x.id) && currentPuzzle(x));
    const openLine = behind ? `<span class="obj-open">Noch offen – ${esc(behind.name)}: ${esc(PUZ[currentPuzzle(behind)].objective)}</span>` : "";
    $("#objective").innerHTML = (done
      ? `<span class="obj-done">✓ Bereich gesichert</span>${r.final ? `<button class="link-button" data-ending>Den letzten Brief lesen →</button>` : next && !S.visited.includes(next.id) ? `<button class="link-button" data-goto="${next.id}" data-via="${r.exitVia || (r.views ? "elevator" : "door")}">${esc(r.exitLabel || `Weiter: ${next.name}`)} →</button>` : ""}`
      : `<span class="obj-label">ZIEL</span> ${esc(PUZ[pid]?.objective || "Untersuche den Raum.")}`) + openLine;
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

  /* ---------- Ereignisse ----------
     room.events: [{ id, view, ifSolved, flash, actions, narrate, delay }]
     Wird einmalig ausgelöst, wenn die Spielerin die Blickrichtung betritt. */
  const scheduledEvents = new Set();
  function checkEvents() {
    const r = room();
    if (!r.views) return;
    const v = r.views[viewIndex(r)];
    for (const ev of r.events || []) {
      const flag = "evt_" + ev.id;
      if (has(flag) || scheduledEvents.has(ev.id) || (ev.view && ev.view !== v.id) || (ev.ifSolved && !isSolved(ev.ifSolved))) continue;
      scheduledEvents.add(ev.id);
      setTimeout(() => {
        scheduledEvents.delete(ev.id);
        // Hat die Spielerin Raum oder Blickrichtung inzwischen gewechselt, bleibt das Ereignis offen
        // und wird beim nächsten Betreten erneut ausgelöst.
        if (!inGame() || room().id !== r.id || (ev.view && r.views[viewIndex(r)].id !== ev.view)) return;
        add(S.flags, flag);
        if (ev.flash) lightning();
        run(ev.actions);
        save();
        renderStage({ narrate: ev.narrate });
        renderSide(); renderObjective();
      }, ev.delay ?? 900);
    }
  }
  function lightning() {
    document.body.classList.add("flash");
    setTimeout(() => document.body.classList.remove("flash"), 140);
    setTimeout(() => { document.body.classList.add("flash"); setTimeout(() => document.body.classList.remove("flash"), 100); }, 280);
    setTimeout(() => A.play("thunder"), 900);
  }

  /* ---------- Drehen & Raumwechsel ---------- */
  function turn(d) {
    const r = room();
    if (!r.views || overlay || dlg.open) return;
    S.views[r.id] = (viewIndex(r) + d + r.views.length) % r.views.length;
    save();
    A.play("step");
    renderStage({ anim: d > 0 ? "turn-right" : "turn-left", reset: true });
    checkEvents();
  }

  function goRoom(id, via) {
    if (!S.unlocked.includes(id)) return;
    closeDialog(); closeOverlay();
    selected = null; light = false;
    const sc = $("#scene");
    sc.classList.add("leaving");
    A.play(via === "elevator" ? "elevator" : "door");
    setTimeout(() => {
      S.current = id; add(S.visited, id); save();
      sc.classList.remove("leaving");
      render({ anim: "arrive", reset: true });
      checkEvents();
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
    justCompleted = null; lockPid = null;
    if (inGame()) { renderStage(); renderSide(); renderObjective(); }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(); });

  const paper = (kind, html) => `<article class="paper paper-${kind}">${fill(html)}</article>`;
  function docHtml(id) {
    const d = N.docs[id];
    if (!d.pages) return paper(d.kind, d.html);
    const label = (i) => (d.pageLabels ? d.pageLabels[i] : i ? "Rückseite" : "");
    return d.pages.map((h, i) => `${label(i) ? `<p class="page-label">${esc(label(i))}</p>` : ""}${paper(d.kind, h)}`).join("");
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
    if (h.secret && add(S.secrets, h.id)) { parts.push(`<p class="secret-note">✦ Geheimnis entdeckt (${S.secrets.length} / ${ALL_SECRETS()})</p>`); A.play("success"); save(); }
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
      else { parts.push(lockHtml(p)); after = () => { lockPid = p.id; bindLock(p); }; }
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
    if (p.type === "wheels") {
      return `<div class="lock lock-wheels">${head}<p class="muted small">Tippe auf ein Rad, um den Buchstaben direkt zu wählen – oder drehe mit ▲ ▼.</p><div class="wheels${p.length > 5 ? " many" : ""}" role="group" aria-label="Buchstabenräder">${Array.from({ length: p.length }, (_, i) => `<div class="wheel"><button type="button" data-wheel="${i}" data-dir="-1" aria-label="Rad ${i + 1} zurück">▲</button><button type="button" class="wheel-letter" data-pick="${i}" aria-label="Rad ${i + 1}: Buchstabe wählen">A</button><button type="button" data-wheel="${i}" data-dir="1" aria-label="Rad ${i + 1} weiter">▼</button></div>`).join("")}</div>
        <div class="wheel-picker hidden" role="group" aria-label="Buchstabe wählen">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => `<button type="button" data-letter="${c}">${c}</button>`).join("")}</div>
        <button type="button" class="submit-button wide" data-wheels-open>Öffnen</button>${fb}</div>`;
    }
    if (p.type === "cipher") {
      const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const pos = (i, r) => { const a = (i / 26) * 2 * Math.PI - Math.PI / 2; return [150 + r * Math.cos(a), 150 + r * Math.sin(a)]; };
      const ring = (r, cls) => ABC.split("").map((c, i) => { const [x, y] = pos(i, r); return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" class="${cls}">${c}</text>`; }).join("");
      return `<div class="lock lock-cipher">${head}
        <p class="muted small">Außen: Buchstaben des Briefs. Innen: was sie bedeuten. Drehe den inneren Ring.</p>
        <svg viewBox="0 0 300 300" class="cipher-disc" aria-hidden="true">
          <circle cx="150" cy="150" r="146" class="disc-outer"/><circle cx="150" cy="150" r="106" class="disc-inner"/><circle cx="150" cy="150" r="70" class="disc-hub"/>
          ${ring(128, "outer-l")}<g class="inner-ring">${ring(88, "inner-l")}</g>
          <path d="M150 2 l-7 -0 l7 14 l7 -14 z" class="disc-mark"/><text x="150" y="156" class="disc-center">NOCTURNE</text>
        </svg>
        <p class="cipher-readout" aria-live="polite"></p>
        <div class="button-row cipher-buttons"><button type="button" class="ghost-button" data-turn="-1" aria-label="Inneren Ring nach links drehen">↺</button><button type="button" class="ghost-button" data-turn="1" aria-label="Inneren Ring nach rechts drehen">↻</button><button type="button" class="submit-button" data-cipher-check>Text prüfen</button></div>${fb}</div>`;
    }
    if (p.type === "choice") {
      return `<form class="lock lock-choice">${head}${p.steps.map((st, si) => `<fieldset class="choice-step${si ? " hidden" : ""}" data-step="${si}"><legend>${si + 1}. ${esc(st.question)}</legend>
        ${st.options.map((o) => `<label class="choice-opt"><input type="${st.pick === 1 ? "radio" : "checkbox"}" name="step${si}" value="${o.id}"><span>${esc(o.label)}</span></label>`).join("")}</fieldset>`).join("")}
        <button class="submit-button wide">${esc(p.button || "Prüfen")}</button>${fb}</form>`;
    }
    if (p.type === "sort") {
      return `<div class="lock lock-sort">${head}<p class="muted small">${esc(p.help || "Ziehe die Streifen in die richtige Reihenfolge – oder verschiebe sie mit ▲ ▼.")}</p><ol class="strips${p.plain ? " plain" : ""}" aria-label="Reihenfolge"></ol>${p.checkButton ? `<button type="button" class="submit-button wide" data-sort-check>${esc(p.button || "Reihenfolge prüfen")}</button>` : ""}${fb}</div>`;
    }
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
      fail((p.wrong && p.wrong[norm(value)]) || p.wrongDefault || null);
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
    if (p.type === "wheels") {
      const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const pos = Array(p.length).fill(0);
      const letters = $$(".wheel-letter", root);
      const picker = $(".wheel-picker", root);
      let active = null;
      const setWheel = (i, k) => {
        pos[i] = k; letters[i].textContent = ABC[k];
        letters[i].classList.remove("tick"); void letters[i].offsetWidth; letters[i].classList.add("tick");
        A.play("key");
      };
      root.addEventListener("click", (e) => {
        const pick = e.target.closest("[data-pick]");
        if (pick) {
          const i = +pick.dataset.pick;
          active = active === i ? null : i;
          letters.forEach((l, k) => l.classList.toggle("active", k === active));
          picker.classList.toggle("hidden", active === null);
          return;
        }
        const letter = e.target.closest("[data-letter]");
        if (letter && active !== null) {
          setWheel(active, ABC.indexOf(letter.dataset.letter));
          letters[active].classList.remove("active");
          // gleich zum nächsten Rad weiter, damit man flüssig durchtippen kann
          active = active + 1 < p.length ? active + 1 : null;
          if (active !== null) letters[active].classList.add("active");
          picker.classList.toggle("hidden", active === null);
          return;
        }
        const w = e.target.closest("[data-wheel]");
        if (w) {
          const i = +w.dataset.wheel;
          pos[i] = (pos[i] + +w.dataset.dir + 26) % 26;
          letters[i].textContent = ABC[pos[i]];
          letters[i].classList.remove("tick"); void letters[i].offsetWidth; letters[i].classList.add("tick");
          A.play("key");
        }
        if (e.target.closest("[data-wheels-open]")) attempt(pos.map((k) => ABC[k]).join(""));
      });
      // Tastatur: Buchstaben tippen füllt die Räder von links
      let cursor = 0;
      const onKey = (e) => {
        if (/^[a-zA-Z]$/.test(e.key)) { const k = ABC.indexOf(e.key.toUpperCase()); pos[cursor] = k; letters[cursor].textContent = ABC[k]; A.play("key"); cursor = (cursor + 1) % p.length; }
        else if (e.key === "Enter") { e.preventDefault(); attempt(pos.map((k) => ABC[k]).join("")); }
      };
      document.addEventListener("keydown", onKey);
      dlgCleanup = () => document.removeEventListener("keydown", onKey);
    }
    if (p.type === "cipher") {
      const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let k = 0;
      const inner = $(".inner-ring", root), readout = $(".cipher-readout", root);
      const paint = () => {
        inner.style.transform = `rotate(${(k * 360) / 26}deg)`;
        // Anzeige: welcher Klartextbuchstabe steht unter dem markierten Geheimbuchstaben?
        const first = p.probe || "G";
        readout.innerHTML = `Erster Buchstabe des Briefs: <b>${first}</b> → <b>${ABC[(ABC.indexOf(first) - k + 26) % 26]}</b> &nbsp;·&nbsp; Stellung ${k}`;
      };
      paint();
      root.addEventListener("click", (e) => {
        const t = e.target.closest("[data-turn]");
        if (t) { k = (k + +t.dataset.turn + 26) % 26; A.play("key"); fb.textContent = ""; paint(); return; }
        if (e.target.closest("[data-cipher-check]")) {
          if (k === p.shift) return succeed(p);
          fail((p.wrongShift && p.wrongShift[k]) || "Der Text ist noch nicht lesbar.");
        }
      });
    }
    if (p.type === "choice") {
      root.addEventListener("submit", (e) => {
        e.preventDefault();
        // Schritt für Schritt: Die nächste Frage erscheint erst, wenn die vorige stimmt.
        for (const [si, st] of p.steps.entries()) {
          const box = $(`[data-step="${si}"]`, root);
          const picked = $$(`input[name="step${si}"]:checked`, root).map((i) => i.value);
          if (picked.length !== st.pick) return fail(st.pick === 1 ? "Bitte wähle eine Antwort." : `Wähle genau ${st.pick} Antworten.`);
          const right = picked.filter((x) => st.answer.includes(x)).length;
          if (right !== st.pick) return fail((st.feedback && st.feedback[right]) || st.wrong || "Das stimmt noch nicht.");
          box.classList.add("done");
          $$("input", box).forEach((i) => { i.disabled = true; });
          const nextBox = $(`[data-step="${si + 1}"]`, root);
          if (nextBox && nextBox.classList.contains("hidden")) {
            nextBox.classList.remove("hidden");
            A.play("paper");
            $(".lock-feedback", root).textContent = "";
            if (st.next) { const n = document.createElement("p"); n.className = "choice-next"; n.textContent = st.next; box.after(n); }
            return;
          }
        }
        succeed(p);
      });
    }
    if (p.type === "sort") {
      // Risskanten: Jede Grenze zwischen zwei Streifen hat ein eigenes Zackenmuster.
      // Ein Streifen trägt oben das Muster seiner richtigen Position, unten das der nächsten –
      // nur in der richtigen Reihenfolge passen die Kanten aufeinander.
      const n = p.items.length;
      const jag = (k, x) => { const v = Math.sin(k * 12.9898 + x * 78.233) * 43758.5453; return (v - Math.floor(v)) * 7; };
      const clip = (idx) => {
        const top = Array.from({ length: 11 }, (_, x) => `${x * 10}% ${jag(idx, x).toFixed(1)}px`);
        const bot = Array.from({ length: 11 }, (_, x) => `${(10 - x) * 10}% calc(100% - ${(7 - jag(idx + 1, 10 - x)).toFixed(1)}px)`);
        return `polygon(${top.concat(bot).join(",")})`;
      };
      let order = (p.start || p.items.map((it) => it.id)).slice();
      const list = $(".strips", root);
      const item = (id) => p.items.find((it) => it.id === id);
      const draw = () => {
        list.innerHTML = order.map((id, i) => `<li class="strip" data-strip="${id}"${p.plain ? "" : ` style="clip-path:${clip(p.answer.indexOf(id))}"`}>
          ${item(id).html || ""}<span class="strip-text">${esc(item(id).text)}</span>
          <span class="strip-btns"><button type="button" data-move="-1" data-i="${i}" aria-label="Nach oben" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" data-move="1" data-i="${i}" aria-label="Nach unten" ${i === n - 1 ? "disabled" : ""}>▼</button></span></li>`).join("");
      };
      const check = () => {
        if (order.join() === p.answer.join()) {
          list.classList.add("done");
          A.play("paper");
          setTimeout(() => succeed(p), 700);
          return true;
        }
        return false;
      };
      const move = (from, to) => {
        if (to < 0 || to >= n || from === to) return;
        const [x] = order.splice(from, 1); order.splice(to, 0, x);
        A.play("paper"); draw(); fb.textContent = "";
        if (!p.checkButton) check(); // mit Prüfknopf wird erst auf Wunsch geprüft
      };
      draw();
      root.addEventListener("click", (e) => {
        if (e.target.closest("[data-sort-check]") && !list.classList.contains("done")) {
          if (!check()) fail((p.wrongOrders && p.wrongOrders[order.join(",")]) || p.wrongDefault || "Die Reihenfolge stimmt noch nicht.");
          return;
        }
        const b = e.target.closest("[data-move]");
        if (b && !list.classList.contains("done")) move(+b.dataset.i, +b.dataset.i + +b.dataset.move);
      });
      // Ziehen mit Maus oder Finger
      let drag = null;
      list.addEventListener("pointerdown", (e) => {
        const li = e.target.closest(".strip");
        if (!li || e.target.closest("button") || list.classList.contains("done")) return;
        drag = { li, from: order.indexOf(li.dataset.strip), y: e.clientY };
        li.setPointerCapture(e.pointerId); li.classList.add("dragging");
      });
      list.addEventListener("pointermove", (e) => { if (drag) drag.li.style.transform = `translateY(${e.clientY - drag.y}px)`; });
      const drop = (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        d.li.classList.remove("dragging"); d.li.style.transform = "";
        const rects = $$(".strip", list).map((el) => el.getBoundingClientRect());
        let to = rects.findIndex((r) => e.clientY < r.top + r.height / 2);
        if (to === -1) to = n - 1;
        else if (to > d.from) to -= 1;
        move(d.from, to);
      };
      list.addEventListener("pointerup", drop);
      list.addEventListener("pointercancel", drop);
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
    if (p.quiet && justCompleted !== p.room) { // ohne Erfolgsdialog: nur Text unter der Szene
      closeDialog();
      renderStage({ narrate: p.success }); renderSide(); renderObjective();
      return true;
    }
    setTimeout(() => A.play("success"), 250);
    const r = ROOM[p.room], next = N.rooms[r.index + 1];
    const completedNow = justCompleted === r.id;
    let buttons = `<button class="primary-button small" data-close>Weiter untersuchen</button>`;
    if (completedNow && r.final) buttons = `<button class="primary-button small" data-ending>Den letzten Brief lesen <span>→</span></button>`;
    else if (completedNow && next) buttons = `<button class="primary-button small" data-goto="${next.id}" data-via="${r.exitVia || (r.views ? "elevator" : "door")}">${esc(r.exitLabel || `Weiter: ${next.name}`)} <span>→</span></button><button class="ghost-button" data-close>Noch hier bleiben</button>`;
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
          // Schnellreise nur in Räume, die man schon auf dem vorgesehenen Weg betreten hat
          const open = S.unlocked.includes(r.id), seen = S.visited.includes(r.id), here = r.id === S.current, done = S.completed.includes(r.id);
          return `<li class="${here ? "here" : ""}"><span>${pad2(r.index + 1)}</span><b>${open ? esc(r.name) : "Verschlossen"}</b>${here ? "<em>Du bist hier</em>" : seen ? `<button class="link-button" data-goto="${r.id}">Hingehen</button>` : open ? "<em class=\"dim\">Weg noch finden</em>" : ""}${done ? "<i>✓</i>" : ""}</li>`;
        }).join("")}</ul>`;
    }
    if (phoneApp === "hinweise") body = hintsHtml();
    sc.innerHTML = `<div class="app-view">${head}<div class="app-body">${body}</div></div>`;
    if (phoneApp === "notizen") { const t = $("#notesInput"); t.addEventListener("input", () => { S.notes = t.value; save(); }); }
  }
  function hintsHtml() {
    const pid = frontierPuzzle();
    if (!pid) return `<p class="app-empty">Gerade gibt es hier nichts zu lösen. Geh weiter.</p>`;
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
        ${S.docs.length ? `<ol class="akte-index">${S.docs.map((id) => `<li><button data-akte-doc="${id}">${esc(N.docs[id].title)}${S.evidence.includes(id) ? `<em class="proof">BEWEIS</em>` : ""}${S.newDocs.includes(id) ? "<i>NEU</i>" : ""}</button></li>`).join("")}</ol>` : `<p class="muted">Noch leer.</p>`}`;
    } else {
      const d = N.docs[pg.id];
      S.newDocs = S.newDocs.filter((x) => x !== pg.id); save(); renderSide();
      html = `<p class="akte-doc-title">${esc(d.title)}${pg.n > 1 ? `<small>${d.pageLabels ? esc(d.pageLabels[pg.i]) : pg.i === 0 ? "Vorderseite" : "Rückseite"}</small>` : ""}</p>${paper(d.kind, pg.html)}`;
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
        <label class="switch"><input type="checkbox" id="optSound" ${S.sound ? "checked" : ""}><span>Ton (Geräusche und Musik)</span></label>
        <label class="switch"><input type="checkbox" id="optMusic" ${S.music ? "checked" : ""}><span>Hintergrundmusik</span></label>
        <label class="switch"><input type="checkbox" id="optHotspots" ${S.showHotspots ? "checked" : ""}><span>Untersuchbare Stellen immer anzeigen</span></label>
        <div class="button-row" style="margin-top:0"><button class="ghost-button" id="soundTest">♪ Ton testen</button></div>
        <div class="stats"><span>Spielzeit <b>${Math.floor(S.playMs / 60000)} Min.</b></span><span>Hinweise <b>${Object.values(S.hints).reduce((a, b) => a + b, 0)}</b></span><span>Bereiche <b>${S.completed.length} / ${N.rooms.length}</b></span><span>Geheimnisse <b>${S.secrets.length} / ${ALL_SECRETS()}</b></span><span>Version <b>13</b></span></div>
        <p class="muted small">Steuerung: Mit den Pfeilen links und rechts (oder Wischen bzw. den Pfeiltasten) drehst du dich im Raum. Gegenstände im Rucksack antippen und dann auf eine Stelle tippen – oder direkt dorthin ziehen.</p>
        ${mp && mp.menuHtml ? mp.menuHtml() : ""}
        <div class="button-row"><button class="ghost-button" data-title>Zum Titelbildschirm</button>${mp ? `<button class="danger-button" data-mp-leave>Sitzung verlassen</button>` : `<button class="danger-button" data-reset>Spielstand löschen</button>`}</div></div>`,
      after: () => {
        $("#optSound").addEventListener("change", (e) => { S.sound = e.target.checked; A.setEnabled(S.sound); updateSoundIcon(); save(); if (S.sound && inGame()) A.music(S.music ? room().music || MUSIC : null); });
        $("#soundTest").addEventListener("click", () => {
          if (!S.sound) { S.sound = true; A.setEnabled(true); updateSoundIcon(); save(); }
          A.play("bell");
          if (S.music && inGame()) A.music(room().music || MUSIC);
        });
        $("#optMusic").addEventListener("change", (e) => { S.music = e.target.checked; save(); if (inGame()) A.music(S.music ? room().music || MUSIC : null); });
        $("#optHotspots").addEventListener("change", (e) => { S.showHotspots = e.target.checked; save(); renderStage(); });
      },
    });
  }
  function updateSoundIcon() {
    $("#soundToggle").classList.toggle("off", !S.sound);
    $("#soundToggle").setAttribute("aria-label", S.sound ? "Geräusche ausschalten" : "Geräusche einschalten");
  }
  function resetGame() {
    if (mp) return showTitle(); // gemeinsamer Stand wird nie lokal gelöscht
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
    $("#restartButton").innerHTML = mp ? "Zum Titelbildschirm <span>→</span>" : "Spiel neu beginnen <span>↻</span>";
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
    if ("title" in ds) return showTitle();
    if ("mpLeave" in ds) { closeDialog(); return mp && mp.leave && mp.leave(); }
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

  function showTitle() { closeDialog(); renderIntro(); showScreen("intro"); }

  /* ---------- Multiplayer-Schnittstelle ----------
     Gemeinsam: gelöste Rätsel, Zustände (Türen, Mechanismen, Story), Rucksack, Akte,
     Beweise, freigeschaltete und gesicherte Bereiche, Nachrichten, Geheimnisse, Ende.
     Pro Spieler: Raum, Blickrichtung, besuchte Räume, Taschenlampe, Auswahl, Notizen,
     Hinweise, Spielzeit, ungelesene Nachrichten. */
  const SHARED_SETS = ["solved", "unlocked", "completed", "evidence", "secrets"];
  function exportShared() {
    return {
      v: 1,
      solved: S.solved.slice(), flags: S.flags.filter((f) => !localFlag(f)), inventory: S.inventory.slice(),
      docs: S.docs.slice(), evidence: S.evidence.slice(), unlocked: S.unlocked.slice(), completed: S.completed.slice(),
      messages: S.messages.map((m) => ({ id: m.id, at: m.at })), secrets: S.secrets.slice(), finished: Boolean(S.finished),
      gone: { items: S.gone.items.slice(), flags: S.gone.flags.slice() },
    };
  }
  /** Verbrauchte Gegenstände und zurückgenommene Zustände bleiben weg, auch wenn ein anderes Gerät sie noch kennt. */
  function normalizeShared(sh) {
    if (!sh) return sh;
    const g = sh.gone || {}, gi = g.items || [], gf = g.flags || [];
    return { ...sh, inventory: (sh.inventory || []).filter((x) => !gi.includes(x)), flags: (sh.flags || []).filter((f) => !gf.includes(f)) };
  }
  /** Stand vom Server übernehmen. Gibt zurück, was neu ist (für eine kurze Meldung). */
  function applyShared(raw) {
    const sh = normalizeShared(raw);
    if (!sh || typeof sh !== "object") return [];
    const news = [], newlySolved = [];
    let changed = false;
    (sh.gone?.items || []).forEach((x) => { changed = add(S.gone.items, x) || changed; });
    (sh.gone?.flags || []).forEach((x) => { changed = add(S.gone.flags, x) || changed; });
    for (const k of SHARED_SETS) (sh[k] || []).forEach((x) => { if (add(S[k], x)) { changed = true; if (k === "solved") newlySolved.push(x); } });
    (sh.flags || []).forEach((f) => { if (!localFlag(f) && !S.gone.flags.includes(f)) changed = add(S.flags, f) || changed; });
    const fl = S.flags.length; S.flags = S.flags.filter((f) => localFlag(f) || !S.gone.flags.includes(f)); changed = changed || fl !== S.flags.length;
    (sh.inventory || []).forEach((x) => { if (N.items[x] && !S.gone.items.includes(x) && add(S.inventory, x)) { changed = true; news.push(N.items[x].icon + " " + N.items[x].name); } });
    const il = S.inventory.length; S.inventory = S.inventory.filter((x) => !S.gone.items.includes(x)); changed = changed || il !== S.inventory.length;
    if (selected && !S.inventory.includes(selected)) selected = null;
    (sh.docs || []).forEach((id) => { if (addDoc(id)) { changed = true; news.push("▤ " + N.docs[id].title); } });
    let buzz = false;
    (sh.messages || []).forEach((m) => {
      if (!m || !N.messages[m.id] || S.messages.some((x) => x.id === m.id)) return;
      S.messages.push({ id: m.id, at: m.at || clockAt(S.playMs) }); S.unread.push(m.id); changed = buzz = true;
    });
    newlySolved.forEach((pid) => { if (PUZ[pid]) news.unshift("✓ " + (PUZ[pid].title || PUZ[pid].objective || "Rätsel gelöst")); });
    const endNow = sh.finished && !S.finished;
    if (endNow) { S.finished = true; changed = true; }
    if (!changed) return [];
    save();
    if (buzz) { A.play("buzz"); const b = $("#phoneButton"); b.classList.remove("ring"); void b.offsetWidth; b.classList.add("ring"); }
    if (!inGame()) return news;
    let narrate = null;
    if (dlg.open && lockPid && newlySolved.includes(lockPid) && $("#dlgBody .lock")) {
      closeDialog();
      narrate = "Jemand aus deinem Team hat das gerade gelöst.";
    }
    if (overlay === "akte") renderAkte();
    if (overlay === "phone" && phoneApp !== "notizen") renderPhone();
    renderStage({ narrate }); renderSide(); renderObjective();
    if (endNow) openDialog({ kicker: "FALL 014-10", title: "Das letzte Rätsel ist gelöst", html: `<p class="inspect-text">Dein Team hat den Fall abgeschlossen.</p><div class="button-row"><button class="primary-button small" data-ending>Den letzten Brief lesen <span>→</span></button></div>` });
    return news;
  }
  N.engine = {
    /** In den Spielstand einer Sitzung wechseln. hooks: { saveKey, changed(), leave(), menuHtml() } */
    enterMultiplayer(hooks) {
      mp = hooks; saveKey = hooks.saveKey;
      S = fresh(); selected = null; light = false; scheduledEvents.clear();
      load();
      A.setEnabled(S.sound); updateSoundIcon(); $("#clock").textContent = clockAt(S.playMs);
      renderIntro();
    },
    /** Zurück zum eigenen Einzelspieler-Spielstand. */
    leaveMultiplayer() {
      mp = null; saveKey = SAVE_KEY;
      S = fresh(); selected = null; light = false; scheduledEvents.clear();
      load();
      A.setEnabled(S.sound); updateSoundIcon(); $("#clock").textContent = clockAt(S.playMs);
      showTitle();
    },
    isMultiplayer: () => Boolean(mp),
    start() { A.setEnabled(S.sound); start(); },
    showTitle, inGame,
    exportShared, applyShared, normalizeShared,
    position() { const r = room(); return { room: r.id, roomName: r.name, view: r.views ? r.views[viewIndex(r)].name : null }; },
    roomName: (id) => (ROOM[id] ? ROOM[id].name : id),
  };

  /* ---------- Los geht’s ---------- */
  load();
  A.setEnabled(S.sound);
  updateSoundIcon();
  $("#clock").textContent = clockAt(S.playMs);
  renderIntro();
  showScreen("intro");
})();
