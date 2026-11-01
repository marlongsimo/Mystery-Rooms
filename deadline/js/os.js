/*
 * DEADLINE.exe – das Betriebssystem
 *
 * Titelbildschirm, Bootsequenz, Desktop mit Symbolen, Fenster (verschieben, minimieren,
 * maximieren, schließen), Taskleiste mit Countdown, Startmenü mit Suche, Meldungen,
 * Pause und Endsequenzen. Die Inhalte der Fenster liefern die Apps (apps.js).
 */
window.DL = window.DL || {};
(() => {
  "use strict";
  const G = DL.game, ST = DL.story, snd = DL.sound;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mobile = () => window.matchMedia("(max-width: 760px), (max-height: 480px)").matches;
  const coarse = () => window.matchMedia("(pointer: coarse)").matches;
  DL.esc = esc;

  /* ---------- Symbole ---------- */
  const ICONS = {
    folder: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#c9a24a"/><path d="M4 18h40v22H4z" fill="#e2bd60"/></svg>`,
    lockfolder: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#8a7440"/><path d="M4 18h40v22H4z" fill="#a88e4f"/><rect x="18" y="25" width="12" height="10" rx="1.5" fill="#1b1d22"/><path d="M20.5 25v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#1b1d22" stroke-width="2"/></svg>`,
    evidence: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#3f8f6a"/><path d="M4 18h40v22H4z" fill="#56b388"/><path d="M17 29l5 5 9-10" fill="none" stroke="#0e2a1d" stroke-width="3"/></svg>`,
    txt: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e8e6e1"/><path d="M30 4v8h8" fill="#bdbab2"/><g stroke="#8b8a86" stroke-width="2"><line x1="15" y1="20" x2="33" y2="20"/><line x1="15" y1="26" x2="33" y2="26"/><line x1="15" y1="32" x2="28" y2="32"/></g></svg>`,
    csv: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#dfe9e1"/><path d="M30 4v8h8" fill="#a9bcae"/><g stroke="#4f7d5c" stroke-width="2"><rect x="15" y="18" width="18" height="18" fill="none"/><line x1="15" y1="24" x2="33" y2="24"/><line x1="15" y1="30" x2="33" y2="30"/><line x1="23" y1="18" x2="23" y2="36"/></g></svg>`,
    wav: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e3e0ef"/><path d="M30 4v8h8" fill="#b5b0cc"/><g stroke="#5c5294" stroke-width="2.4" stroke-linecap="round"><line x1="16" y1="26" x2="16" y2="30"/><line x1="20" y1="21" x2="20" y2="35"/><line x1="24" y1="24" x2="24" y2="32"/><line x1="28" y1="18" x2="28" y2="38"/><line x1="32" y1="25" x2="32" y2="31"/></g></svg>`,
    jpg: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e5ecf1"/><path d="M30 4v8h8" fill="#b2c2cd"/><path d="M14 36l7-9 5 6 3-4 5 7z" fill="#5b7f99"/><circle cx="29" cy="20" r="3" fill="#d6a443"/></svg>`,
    ics: `<svg viewBox="0 0 48 48"><rect x="7" y="9" width="34" height="32" rx="2" fill="#ece9e2"/><rect x="7" y="9" width="34" height="9" fill="#b6453b"/><text x="24" y="35" text-anchor="middle" font-size="14" font-family="DM Mono,monospace" fill="#2a2a2a">17</text></svg>`,
    report: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e8e6e1"/><path d="M30 4v8h8" fill="#bdbab2"/><g stroke="#8b8a86" stroke-width="2"><line x1="15" y1="20" x2="33" y2="20"/><line x1="15" y1="32" x2="33" y2="32"/></g><rect x="15" y="24" width="12" height="4" fill="#111"/></svg>`,
    docs: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#3e6fa8"/><path d="M4 18h40v22H4z" fill="#5389c7"/><path d="M17 25h14M17 30h14" stroke="#dbe8f6" stroke-width="2"/></svg>`,
    pics: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#3e6fa8"/><path d="M4 18h40v22H4z" fill="#5389c7"/><path d="M14 36l7-8 5 5 3-3 5 6z" fill="#dbe8f6"/></svg>`,
    mail: `<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="27" rx="2" fill="#d9dde3"/><path d="M5 13l19 14 19-14" fill="none" stroke="#56606d" stroke-width="2.5"/></svg>`,
    messenger: `<svg viewBox="0 0 48 48"><path d="M7 9h34v23H22l-9 8v-8H7z" fill="#3c9b8a"/><g fill="#e6f5f1"><circle cx="17" cy="20.5" r="2.4"/><circle cx="24" cy="20.5" r="2.4"/><circle cx="31" cy="20.5" r="2.4"/></g></svg>`,
    browser: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#3b5d86"/><g fill="none" stroke="#cfe0f2" stroke-width="2"><ellipse cx="24" cy="24" rx="8" ry="18"/><line x1="6" y1="24" x2="42" y2="24"/><path d="M9 15h30M9 33h30"/></g></svg>`,
    audio: `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#4d4377"/><g stroke="#d9d3f5" stroke-width="2.6" stroke-linecap="round"><line x1="14" y1="22" x2="14" y2="27"/><line x1="19" y1="16" x2="19" y2="33"/><line x1="24" y1="20" x2="24" y2="29"/><line x1="29" y1="14" x2="29" y2="35"/><line x1="34" y1="21" x2="34" y2="28"/></g></svg>`,
    trash: `<svg viewBox="0 0 48 48"><path d="M12 14h24l-2 28H14z" fill="#9aa0a8"/><rect x="9" y="9" width="30" height="5" rx="1" fill="#c3c8ce"/><path d="M19 19v18M24 19v18M29 19v18" stroke="#6c727a" stroke-width="2"/></svg>`,
    terminal: `<svg viewBox="0 0 48 48"><rect x="5" y="8" width="38" height="32" rx="3" fill="#15181d" stroke="#3a414c" stroke-width="2"/><path d="M12 19l6 5-6 5" fill="none" stroke="#5be08f" stroke-width="2.6"/><line x1="21" y1="30" x2="31" y2="30" stroke="#5be08f" stroke-width="2.6"/></svg>`,
    deadline: `<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="4" fill="#3a0d10" stroke="#e0473d" stroke-width="2.5"/><path d="M24 13v14" stroke="#ff5a4e" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="34" r="2.6" fill="#ff5a4e"/></svg>`,
    hints: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#2c3440"/><text x="24" y="31" text-anchor="middle" font-size="20" font-family="DM Sans,sans-serif" fill="#e8c46a">?</text></svg>`,
    lock: `<svg viewBox="0 0 48 48"><rect x="12" y="21" width="24" height="19" rx="2" fill="#c9a24a"/><path d="M17 21v-5a7 7 0 0 1 14 0v5" fill="none" stroke="#c9a24a" stroke-width="3.4"/></svg>`,
  };
  DL.icon = (name) => ICONS[name] || ICONS.txt;
  const nodeIcon = (id) => {
    const n = ST.nodes[id];
    if (n.type === "folder") return n.icon === "evidence" ? "evidence" : n.lock && !G.unlocked(id) ? "lockfolder" : "folder";
    return n.type;
  };
  DL.nodeIcon = nodeIcon;

  /* ---------- Bildschirme ---------- */
  const screens = ["title", "boot", "desk"];
  const show = (id) => screens.forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));

  /* ---------- Fenster ---------- */
  const wins = [];
  let zTop = 10, seq = 0;
  const layer = () => $("#windows");

  function open(appId, arg, opts = {}) {
    const app = DL.apps[appId];
    if (!app) return null;
    const key = appId + ":" + (arg ?? "");
    let w = wins.find((x) => x.key === key);
    if (w) { restore(w); return w; }
    w = { id: "w" + (++seq), key, app: appId, arg, state: {}, min: false, max: false };
    const el = document.createElement("section");
    el.className = "win" + (app.cls ? " " + app.cls : "");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", app.title(arg));
    el.innerHTML = `<header class="win-bar"><span class="win-ico">${DL.icon(app.icon ? app.icon(arg) : appId)}</span><span class="win-title"></span>
      <span class="win-btns"><button class="wb-min" aria-label="Minimieren" title="Minimieren">–</button><button class="wb-max" aria-label="Maximieren" title="Maximieren">□</button><button class="wb-close" aria-label="Schließen" title="Schließen">×</button></span></header>
      <div class="win-body"></div><span class="win-resize" aria-hidden="true"></span>`;
    w.el = el; w.body = $(".win-body", el);
    $(".win-title", el).textContent = app.title(arg);
    layer().appendChild(el);
    const desk = $("#desk").getBoundingClientRect();
    const ww = Math.min(app.w || 620, desk.width - 24), hh = Math.min(app.h || 440, desk.height - 70);
    const n = wins.length;
    el.style.width = ww + "px"; el.style.height = hh + "px";
    el.style.left = Math.max(8, Math.min(desk.width - ww - 8, (opts.x ?? (desk.width - ww) / 2 + (n % 6) * 26 - 60))) + "px";
    el.style.top = Math.max(8, Math.min(desk.height - hh - 56, (opts.y ?? (desk.height - hh) / 2 + (n % 6) * 22 - 50))) + "px";
    wins.push(w);
    wire(w);
    focus(w);
    render(w);
    snd.play("open");
    paintTasks();
    if (app.opened) app.opened(w);
    return w;
  }
  function render(w) { DL.apps[w.app].render(w); const t = DL.apps[w.app].title(w.arg); $(".win-title", w.el).textContent = t; }
  function close(w) {
    const i = wins.indexOf(w); if (i < 0) return;
    if (DL.apps[w.app].closed) DL.apps[w.app].closed(w);
    wins.splice(i, 1); w.el.remove(); paintTasks();
    const top = topWin(); if (top) focus(top);
  }
  function focus(w) {
    wins.forEach((x) => x.el.classList.toggle("focused", x === w));
    w.el.style.zIndex = ++zTop;
    paintTasks();
  }
  function restore(w) { w.min = false; w.el.classList.remove("minimized"); focus(w); }
  function minimize(w) { w.min = true; w.el.classList.add("minimized"); w.el.classList.remove("focused"); paintTasks(); }
  const topWin = () => wins.filter((x) => !x.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle("maxed", w.max); }

  function wire(w) {
    const el = w.el, bar = $(".win-bar", el);
    el.addEventListener("pointerdown", () => focus(w), true);
    $(".wb-close", el).addEventListener("click", (e) => { e.stopPropagation(); close(w); });
    $(".wb-min", el).addEventListener("click", (e) => { e.stopPropagation(); minimize(w); });
    $(".wb-max", el).addEventListener("click", (e) => { e.stopPropagation(); toggleMax(w); });
    bar.addEventListener("dblclick", (e) => { if (!e.target.closest("button")) toggleMax(w); });
    // Verschieben
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || w.max || mobile()) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      const desk = $("#desk").getBoundingClientRect();
      const mv = (ev) => {
        el.style.left = Math.max(-el.offsetWidth + 80, Math.min(desk.width - 80, ox + ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(desk.height - 80, oy + ev.clientY - sy)) + "px";
      };
      const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    });
    // Größe ändern
    $(".win-resize", el).addEventListener("pointerdown", (e) => {
      if (w.max || mobile()) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
      const mv = (ev) => { el.style.width = Math.max(300, ow + ev.clientX - sx) + "px"; el.style.height = Math.max(200, oh + ev.clientY - sy) + "px"; };
      const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    });
  }

  function paintTasks() {
    const top = topWin();
    $("#tasks").innerHTML = wins.map((w) => `<button class="task${w === top ? " active" : ""}${w.min ? " min" : ""}" data-w="${w.id}" title="${esc(DL.apps[w.app].title(w.arg))}">
      <span class="task-ico">${DL.icon(DL.apps[w.app].icon ? DL.apps[w.app].icon(w.arg) : w.app)}</span><span class="task-label">${esc(DL.apps[w.app].title(w.arg))}</span></button>`).join("");
  }

  /** Doppelklick am Rechner, einfacher Fingertipp am Handy, Enter mit der Tastatur */
  function activate(root, sel, fn) {
    root.addEventListener("dblclick", (e) => { const t = e.target.closest(sel); if (t) fn(t); });
    root.addEventListener("click", (e) => {
      const t = e.target.closest(sel); if (!t) return;
      root.querySelectorAll(sel).forEach((x) => x.classList.toggle("selected", x === t));
      if (coarse() || t.dataset.single) fn(t);
    });
    root.addEventListener("keydown", (e) => { if (e.key === "Enter") { const t = e.target.closest(sel); if (t) fn(t); } });
  }

  /* ---------- Knoten öffnen ---------- */
  function openNode(id) {
    const n = ST.nodes[id];
    if (!n || !G.visible(id)) return;
    G.setFlag("seen_" + id);
    if (n.type === "folder") {
      if (!G.unlocked(id)) return open("lock", id);
      return open("explorer", id);
    }
    const app = { txt: "text", csv: "table", ics: "calendar", wav: "audio", jpg: "image", report: "text" }[n.type] || "text";
    return open(app, app === "audio" ? id : id);
  }

  /* ---------- Desktop-Symbole ---------- */
  const DESK = [
    { id: "docs", label: "Dokumente", run: () => open("explorer", "docs"), icon: "docs" },
    { id: "mail", label: "Mail", run: () => open("mail"), icon: "mail" },
    { id: "messenger", label: "Messenger", run: () => open("messenger"), icon: "messenger" },
    { id: "browser", label: "Browser", run: () => open("browser"), icon: "browser" },
    { id: "audio", label: "Audio", run: () => open("audio"), icon: "audio" },
    { id: "pics", label: "Bilder", run: () => open("explorer", "pics"), icon: "pics" },
    { id: "trash", label: "Papierkorb", run: () => open("explorer", "trash"), icon: "trash" },
    { id: "terminal", label: "Terminal", run: () => open("terminal"), icon: "terminal" },
    { id: "deadline", label: "DEADLINE.exe", run: () => open("deadline"), icon: "deadline" },
  ];
  function paintIcons() {
    const nodes = Object.keys(ST.nodes).filter((id) => ST.nodes[id].desktop && G.visible(id));
    const items = DESK.map((d) => ({ key: "a:" + d.id, label: d.label, icon: d.icon, hot: d.id === "deadline" && G.isSolved("verify"), badge: badge(d.id) }))
      .concat(nodes.map((id) => ({ key: "n:" + id, label: ST.nodes[id].name, icon: nodeIcon(id), fresh: !G.flag("seen_" + id) })));
    $("#icons").innerHTML = items.map((it) => `<button class="dicon${it.hot ? " hot" : ""}${it.fresh ? " fresh" : ""}" data-key="${it.key}">
      <span class="dicon-img">${DL.icon(it.icon)}${it.badge ? `<i class="badge">${it.badge}</i>` : ""}</span><span class="dicon-label">${esc(it.label)}</span></button>`).join("");
  }
  function badge(app) {
    if (app === "messenger") { const unread = G.state.msgs.filter((m) => !G.flag("read_" + m)).length; return unread || ""; }
    return "";
  }
  function runIcon(key) {
    snd.play("click");
    const [kind, id] = key.split(":");
    if (kind === "a") DESK.find((d) => d.id === id).run();
    else openNode(id);
  }

  /* ---------- Meldungen ---------- */
  function toast({ title, text, kind = "", onClick, ms = 7000 }) {
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.setAttribute("role", "status");
    el.innerHTML = `<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ""}`;
    if (onClick) { el.classList.add("clickable"); el.addEventListener("click", () => { onClick(); el.remove(); }); }
    $("#toasts").appendChild(el);
    const all = $("#toasts").children; while (all.length > 4) all[0].remove();
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, ms);
  }
  DL.toast = toast;

  /* ---------- Taskleiste: Uhr und Countdown ---------- */
  let lastBeat = -1;
  function paintClock() {
    const S = G.state;
    $("#clock").textContent = G.clock();
    const cd = $("#countdown");
    if (S.relaxed) { cd.textContent = "LAUFZEIT " + G.fmt(S.elapsed); cd.className = "countdown relaxed"; }
    else {
      const r = G.remaining();
      cd.textContent = G.fmt(r);
      cd.className = "countdown" + (r <= 15 * 60 ? " critical" : r <= 30 * 60 ? " warn" : "");
      // Letzte 15 Minuten: Lüfter läuft hoch. Letzte 5 Minuten: Herzschlag.
      if (!S.ending && G.isRunning() && !G.isPaused()) {
        snd.fanLevel(r <= 15 * 60 ? 1 - r / (15 * 60) : 0);
        if (r <= 5 * 60 && r > 0 && S.elapsed % 2 === 0 && S.elapsed !== lastBeat) { lastBeat = S.elapsed; snd.play("heart"); }
      }
    }
    const dlc = document.querySelectorAll("[data-live-countdown]");
    dlc.forEach((x) => { x.textContent = S.relaxed ? "OHNE ZEITLIMIT" : G.fmt(G.remaining()); });
  }

  /* ---------- Startmenü ---------- */
  function paintStart() {
    const q = ($("#startSearch").value || "").trim().toLowerCase();
    const hits = q ? Object.keys(ST.nodes).filter((id) => G.visible(id) && ST.nodes[id].name.toLowerCase().includes(q) && (!ST.nodes[id].parent || G.unlocked(ST.nodes[id].parent))).slice(0, 8) : [];
    const apps = DESK.filter((d) => !q || d.label.toLowerCase().includes(q));
    $("#startList").innerHTML = (hits.length ? `<p class="sm-head">DATEIEN</p>` + hits.map((id) => `<button class="sm-item" data-node="${id}">${DL.icon(nodeIcon(id))}<span>${esc(ST.nodes[id].name)}</span></button>`).join("") : "")
      + (apps.length ? `<p class="sm-head">PROGRAMME</p>` + apps.map((d) => `<button class="sm-item" data-app="${d.id}">${DL.icon(d.icon)}<span>${esc(d.label)}</span></button>`).join("") : "")
      + (!hits.length && !apps.length ? `<p class="sm-empty">Nichts gefunden.</p>` : "");
  }
  function toggleStart(on) {
    const m = $("#startMenu");
    const open_ = on ?? m.hidden;
    m.hidden = !open_;
    $("#startBtn").setAttribute("aria-expanded", String(open_));
    if (open_) { $("#startSearch").value = ""; paintStart(); $("#soundItem span").textContent = snd.isOn() ? "Ton ausschalten" : "Ton einschalten"; $("#pauseItem").hidden = G.isMultiplayer(); if (!coarse()) $("#startSearch").focus(); }
  }

  /* ---------- Titel, Boot, Pause ---------- */
  function paintTitle() {
    const S = G.state, going = S.started && !S.ending;
    $("#startGame").textContent = going ? "Weiterspielen" : S.ending ? "Neuer Versuch" : "Fall starten";
    $("#newGame").hidden = !going;
    $("#modeBox").hidden = going;
    $("#titleState").textContent = going ? (S.relaxed ? `Laufender Fall · ohne Zeitlimit · ${G.fmt(S.elapsed)} gespielt` : `Laufender Fall · noch ${G.fmt(G.remaining())}`) : S.endings.length ? `Gefundene Enden: ${S.endings.length} von 6` : "";
  }
  const relaxedChoice = () => { const r = document.querySelector('input[name="mode"]:checked'); return r ? r.value === "relaxed" : false; };

  let booting = false;
  function boot(full) {
    show("boot");
    booting = true;
    const log = $("#bootLog");
    log.textContent = "";
    const lines = full ? [
      "VANTA SYSTEMS · SECURITY BOOT", "", "SYSTEM INITIALIZATION ...", "Loading user profile ...", "User: Elias Voss", "Checking system integrity ...",
      "!WARNING: Integrity compromised.", "!Unauthorized access detected.", "!Emergency deletion protocol activated.",
    ] : ["VANTA SYSTEMS · SESSION RESTORE", "", "Restoring user profile ...", "User: Elias Voss", "!Emergency deletion protocol: ACTIVE"];
    snd.play("boot");
    let i = 0;
    const skip = () => { if (!booting) return; booting = false; done(); };
    $("#bootSkip").onclick = skip;
    const step = () => {
      if (!booting) return;
      if (i < lines.length) {
        const l = lines[i++];
        const span = document.createElement("span");
        span.className = l.startsWith("!") ? "err" : "";
        span.textContent = l.replace(/^!/, "") + "\n";
        log.appendChild(span);
        if (l.startsWith("!")) snd.play("error"); else if (l) snd.play("key");
        setTimeout(step, l ? (full ? 420 : 260) : 200);
      } else {
        $("#bootBig").hidden = false;
        $("#bootBig").innerHTML = G.state.relaxed
          ? `<b>OHNE ZEITLIMIT</b><span>AUTOMATISCHE DATENLÖSCHUNG · ANGEHALTEN</span>`
          : `<b>${G.fmt(G.remaining())}</b><span>AUTOMATISCHE DATENLÖSCHUNG</span><small>Alle lokalen Daten werden nach Ablauf der Frist gelöscht. SYSTEMKRITISCH</small>`;
        snd.play("alarm");
        setTimeout(skip, full ? 3200 : 1400);
      }
    };
    $("#bootBig").hidden = true;
    setTimeout(step, 300);
    function done() {
      show("desk");
      enterDesk(full);
    }
  }
  function enterDesk(first) {
    G.startGame();
    snd.fan();
    paintIcons(); paintClock(); paintTasks();
    if (first && !wins.length) setTimeout(() => openNode("start"), 450);
    if (G.state.ending) showEnding(G.state.ending, true);
  }
  function leaveToTitle() {
    G.stop();
    wins.slice().forEach(close);
    $("#ending").classList.add("hidden");
    toggleStart(false);
    paintTitle();
    show("title");
  }
  function setPause(on) {
    if (G.isMultiplayer()) return;
    G.pause(on);
    $("#pause").hidden = !on;
  }

  /* ---------- Ereignisse ---------- */
  DL.on("tick", paintClock);
  DL.on("change", () => { if (!$("#desk").classList.contains("hidden")) { paintIcons(); paintClock(); wins.forEach((w) => { const a = DL.apps[w.app]; if (a.onChange) a.onChange(w); }); } });
  DL.on("message", (id, remote) => {
    if ($("#desk").classList.contains("hidden")) return;
    snd.play("message");
    toast({ title: "UNBEKANNT", text: ST.messages[id].text, kind: "msg", onClick: () => open("messenger", "unknown") });
    paintIcons();
  });
  DL.on("solved", (id, remote) => {
    if (id === "verify") setTimeout(() => toast({ title: "Neuer Ordner", text: "EVIDENCE_UNLOCKED liegt auf dem Desktop. DEADLINE.exe ist bereit.", kind: "ok" }), 600);
    if (!remote) snd.play("unlock");
    if (remote && !$("#desk").classList.contains("hidden")) {
      const st = ST.steps.find((s) => s.id === id);
      if (st) toast({ title: "DEIN TEAM", text: st.label + " – erledigt.", kind: "ok" });
    }
  });
  DL.on("event", (ev, remote) => {
    if (!ev) return;
    const desk = $("#desk");
    if (ev.sound) snd.play(ev.sound);
    if (ev.note) toast({ title: ev.note, text: ev.sub || "", kind: ev.red ? "alert" : "sys", ms: 9000 });
    if (ev.glitch) { desk.classList.add("glitch"); setTimeout(() => desk.classList.remove("glitch"), 1800); }
    paintAlert();
  });
  function paintAlert() {
    const S = G.state, desk = $("#desk");
    desk.classList.toggle("stage-2", S.events.includes("e60"));
    desk.classList.toggle("stage-3", S.events.includes("e75") && !S.relaxed);
    desk.classList.toggle("red-alert", S.events.includes("e85") && !S.relaxed);
  }
  DL.on("change", paintAlert);

  /* ---------- Enden ---------- */
  function showEnding(id, instant) {
    const E = ST.endings[id];
    if (!E) return;
    const box = $("#ending");
    box.className = "ending " + E.kind;
    box.innerHTML = `<div class="end-inner"><pre class="end-log"></pre><div class="end-text" hidden>${E.text.map((t) => `<p>${esc(t)}</p>`).join("")}
      ${E.quote ? `<p class="end-quote">${esc(E.quote)}</p>` : ""}
      <p class="end-closed">CASE CLOSED</p><h2>${esc(E.title)}</h2><p class="end-sub">DEADLINE.exe · VANTA SYSTEMS</p>
      <p class="end-count">Gefundene Enden: ${G.state.endings.length} von 6</p>
      <div class="end-actions">
        ${id !== "timeout" && !G.isMultiplayer() ? `<button class="btn ghost" id="endBack">Zur Entscheidung zurück</button>` : ""}
        ${G.isMultiplayer() ? "" : `<button class="btn" id="endNew">Neues Spiel</button>`}
        <a class="btn ghost" href="../index.html">Alle Escape Rooms</a>
      </div></div></div>`;
    $("#desk").classList.add("off");
    const log = $(".end-log", box), text = $(".end-text", box);
    const lines = E.log.slice();
    const reveal = () => {
      text.hidden = false;
      const back = $("#endBack", box); if (back) back.onclick = () => { G.backToDecision(); box.classList.add("hidden"); $("#desk").classList.remove("off"); open("deadline"); };
      const nw = $("#endNew", box); if (nw) nw.onclick = () => { if (confirm("Neues Spiel beginnen? Der aktuelle Fall wird zurückgesetzt.")) { G.reset(); location.reload(); } };
    };
    if (instant) { log.textContent = lines.join("\n"); reveal(); return; }
    snd.play(id === "truth" || id === "price" ? "notify" : "glitch");
    let i = 0;
    const step = () => { if (i < lines.length) { log.textContent += lines[i++] + "\n"; snd.play("key"); setTimeout(step, 420); } else setTimeout(reveal, 900); };
    setTimeout(step, 700);
  }
  DL.on("ending", (id) => {
    wins.slice().forEach((w) => { if (w.app === "deadline") close(w); });
    showEnding(id, false);
  });

  /* ---------- Verdrahtung ---------- */
  function init() {
    paintTitle();
    $("#startGame").addEventListener("click", () => {
      const S = G.state;
      if (S.ending) { G.newGame({ relaxed: relaxedChoice() }); return boot(true); }
      if (!S.started) { G.newGame({ relaxed: relaxedChoice() }); return boot(true); }
      boot(false);
    });
    $("#newGame").addEventListener("click", () => {
      if (!confirm("Wirklich neu beginnen? Der laufende Fall wird gelöscht.")) return;
      G.reset(); paintTitle();
    });
    activate($("#icons"), ".dicon", (t) => runIcon(t.dataset.key));
    $("#tasks").addEventListener("click", (e) => {
      const b = e.target.closest(".task"); if (!b) return;
      const w = wins.find((x) => x.id === b.dataset.w); if (!w) return;
      if (w.min || topWin() !== w) restore(w); else minimize(w);
    });
    $("#startBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleStart(); });
    $("#startSearch").addEventListener("input", paintStart);
    $("#startList").addEventListener("click", (e) => {
      const b = e.target.closest(".sm-item"); if (!b) return;
      toggleStart(false);
      if (b.dataset.node) openNode(b.dataset.node); else DESK.find((d) => d.id === b.dataset.app).run();
    });
    $("#startSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { const f = $("#startList .sm-item"); if (f) f.click(); } if (e.key === "Escape") toggleStart(false); });
    $("#hintsItem").addEventListener("click", () => { toggleStart(false); open("hints"); });
    $("#hintBtn").addEventListener("click", () => open("hints"));
    $("#pauseItem").addEventListener("click", () => { toggleStart(false); setPause(true); });
    $("#soundItem").addEventListener("click", () => { snd.toggle(); paintSound(); toggleStart(false); });
    $("#soundBtn").addEventListener("click", () => { snd.toggle(); paintSound(); });
    $("#quitItem").addEventListener("click", () => { toggleStart(false); leaveToTitle(); });
    $("#resume").addEventListener("click", () => setPause(false));
    $("#pauseQuit").addEventListener("click", () => { setPause(false); leaveToTitle(); });
    document.addEventListener("click", (e) => { if (!$("#startMenu").hidden && !e.target.closest("#startMenu") && !e.target.closest("#startBtn")) toggleStart(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#startMenu").hidden) toggleStart(false); });
    paintSound();
  }
  function paintSound() { $("#soundBtn").classList.toggle("muted", !snd.isOn()); $("#soundBtn").setAttribute("aria-label", snd.isOn() ? "Ton ausschalten" : "Ton einschalten"); }

  DL.os = { open, close, render, focus, openNode, activate, toast, wins, show, boot, enterDesk, leaveToTitle, paintTitle, paintIcons, mobile, coarse };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
