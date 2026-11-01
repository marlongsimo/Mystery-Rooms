/*
 * MYSTERY ROOMS – Desktop-Baustein (Fenster, Taskleiste, Meldungen)
 *
 * Gemeinsame Grundlage für Spiele auf einem simulierten Computer (DEADLINE.exe, ARCHON).
 *
 *   const D = MRDesktop.create({
 *     desk: Element,            // Bezugsfläche (Fenstergrenzen)
 *     layer: Element,           // Container für Fenster
 *     tasks: Element,           // Taskleiste (Knöpfe der offenen Fenster)
 *     apps: () => ({ id: { title(arg), icon(arg)?, w, h, cls?, render(w), opened(w)?, closed(w)?, onChange(w)? } }),
 *     icon: (name) => svgString,
 *     sound: { play(name) }     // optional
 *   });
 *   D.open(appId, arg) · D.close(w) · D.render(w) · D.focus(w) · D.wins · D.topWin()
 *   D.activate(root, selector, fn, single) · D.refresh() (onChange aller Fenster)
 *   MRDesktop.toast(container, { title, text, kind, ms })
 *
 * Eigenschaften: Inhalte werden nur neu gezeichnet, wenn sich das HTML ändert (stabile Klicks),
 * Fenster lassen sich verschieben, in der Größe ändern, minimieren, maximieren.
 * Auf schmalen Bildschirmen sind Fenster Vollbild (per CSS), Doppelklick wird zu Antippen.
 * Touch (Finger/Stift): Klick beim Loslassen, kein doppelter Klick, Wischen ist kein Tippen, Textfelder
 * bekommen den Fokus selbst, kein Kontextmenü außerhalb von Eingabefeldern, Scrollpositionen bleiben.
 */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mobile = () => window.matchMedia("(max-width: 760px), (max-height: 480px)").matches;
  const coarse = () => window.matchMedia("(pointer: coarse)").matches;
  const HTML = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");

  /** Neu zeichnen nur bei geändertem Inhalt – sonst gingen Klicks und Doppelklicks verloren. */
  function guardBody(el) {
    let last = null;
    Object.defineProperty(el, "innerHTML", {
      configurable: true,
      get() { return HTML.get.call(this); },
      set(v) { if (v === last) return; last = v; HTML.set.call(this, v); },
    });
  }

  function create({ desk, layer, tasks, apps, icon, sound = { play() {} }, maxOpen = Infinity }) {
    installTouch();
    guardBody(tasks);
    const wins = [];
    let zTop = 10, seq = 0;
    const A = () => apps();
    const title = (w) => A()[w.app].title(w.arg);
    const iconOf = (w) => icon(A()[w.app].icon ? A()[w.app].icon(w.arg) : w.app);

    function open(appId, arg, opts = {}) {
      const app = A()[appId];
      if (!app) return null;
      const key = appId + ":" + (arg ?? "");
      let w = wins.find((x) => x.key === key);
      if (w) { restore(w); return w; }
      w = { id: "w" + (++seq), key, app: appId, arg, state: {}, min: false, max: false };
      const el = document.createElement("section");
      el.className = "win" + (app.cls ? " " + app.cls : "");
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", app.title(arg));
      el.innerHTML = `<header class="win-bar"><span class="win-ico"></span><span class="win-title"></span>
        <span class="win-btns"><button class="wb-min" aria-label="Minimieren" title="Minimieren">–</button><button class="wb-max" aria-label="Maximieren" title="Maximieren">□</button><button class="wb-close" aria-label="Schließen" title="Schließen">×</button></span></header>
        <div class="win-body"></div><span class="win-resize" aria-hidden="true"></span>`;
      w.el = el; w.body = el.querySelector(".win-body");
      guardBody(w.body);
      el.querySelector(".win-ico").innerHTML = iconOf(w);
      el.querySelector(".win-title").textContent = app.title(arg);
      layer.appendChild(el);
      const box = desk.getBoundingClientRect();
      const ww = Math.min(app.w || 620, box.width - 24), hh = Math.min(app.h || 440, box.height - 70);
      const n = wins.length;
      el.style.width = ww + "px"; el.style.height = hh + "px";
      el.style.left = Math.max(8, Math.min(box.width - ww - 8, opts.x ?? (box.width - ww) / 2 + (n % 6) * 26 - 60)) + "px";
      el.style.top = Math.max(8, Math.min(box.height - hh - 56, opts.y ?? (box.height - hh) / 2 + (n % 6) * 22 - 50)) + "px";
      // Ruhiger Bildschirm: Sind schon maxOpen Fenster sichtbar, wird das hinterste minimiert (bleibt in der Taskleiste).
      const vis = wins.filter((x) => !x.min);
      if (vis.length >= maxOpen) minimize(vis.sort((a, b) => a.el.style.zIndex - b.el.style.zIndex)[0]);
      wins.push(w);
      wire(w);
      focus(w);
      render(w);
      sound.play("open");
      paintTasks();
      if (app.opened) app.opened(w);
      return w;
    }
    /** Neu zeichnen, Scrollpositionen in Listen bleiben erhalten. */
    function render(w) {
      const keep = scrollState(w.body);
      A()[w.app].render(w);
      restoreScroll(w.body, keep);
      const t = w.el.querySelector(".win-title"), tt = title(w); if (t.textContent !== tt) t.textContent = tt;
    }
    function close(w) {
      const i = wins.indexOf(w); if (i < 0) return;
      if (A()[w.app].closed) A()[w.app].closed(w);
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
    function closeAll() { wins.slice().forEach(close); }
    /** Alles außer dem vordersten Fenster minimieren. */
    function tidy() { const top = topWin(); wins.forEach((x) => { if (x !== top && !x.min) minimize(x); }); }

    function drag(e, onMove) {
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      const mv = (ev) => onMove(ev.clientX - sx, ev.clientY - sy);
      const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    }
    function wire(w) {
      const el = w.el, bar = el.querySelector(".win-bar");
      // Nur wenn nötig nach vorn holen: Jede DOM-Änderung beim Antippen kann Safari (iPad) den Klick kosten.
      el.addEventListener("pointerdown", () => { if (topWin() !== w || !el.classList.contains("focused")) focus(w); }, true);
      el.querySelector(".wb-close").addEventListener("click", (e) => { e.stopPropagation(); close(w); });
      el.querySelector(".wb-min").addEventListener("click", (e) => { e.stopPropagation(); minimize(w); });
      el.querySelector(".wb-max").addEventListener("click", (e) => { e.stopPropagation(); toggleMax(w); });
      bar.addEventListener("dblclick", (e) => { if (!e.target.closest("button") && !coarse()) toggleMax(w); });
      bar.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button") || w.max || mobile()) return;
        const ox = el.offsetLeft, oy = el.offsetTop, box = desk.getBoundingClientRect();
        drag(e, (dx, dy) => {
          el.style.left = Math.max(-el.offsetWidth + 80, Math.min(box.width - 80, ox + dx)) + "px";
          el.style.top = Math.max(0, Math.min(box.height - 80, oy + dy)) + "px";
        });
      });
      el.querySelector(".win-resize").addEventListener("pointerdown", (e) => {
        if (w.max || mobile()) return;
        const ow = el.offsetWidth, oh = el.offsetHeight;
        drag(e, (dx, dy) => { el.style.width = Math.max(300, ow + dx) + "px"; el.style.height = Math.max(200, oh + dy) + "px"; });
      });
    }

    function paintTasks() {
      const top = topWin();
      tasks.innerHTML = wins.map((w) => `<button class="task${w === top ? " active" : ""}${w.min ? " min" : ""}" data-w="${w.id}" title="${esc(title(w))}">
        <span class="task-ico">${iconOf(w)}</span><span class="task-label">${esc(title(w))}</span></button>`).join("");
    }
    tasks.addEventListener("click", (e) => {
      const b = e.target.closest(".task"); if (!b) return;
      const w = wins.find((x) => x.id === b.dataset.w); if (!w) return;
      if (w.min || topWin() !== w) restore(w); else minimize(w);
    });

    /** Desktop-Symbole: Doppelklick (Touch: Antippen). Listen in Fenstern (single = true): ein Klick. */
    function activate(root, sel, fn, single = false) {
      root.addEventListener("dblclick", (e) => { if (single) return; const t = e.target.closest(sel); if (t) fn(t); });
      root.addEventListener("click", (e) => {
        const t = e.target.closest(sel); if (!t) return;
        root.querySelectorAll(sel).forEach((x) => x.classList.toggle("selected", x === t));
        if (single || coarse() || tapping) fn(t); // Touch (auch Windows-Touchscreen mit Maus): ein Tipp öffnet
      });
      root.addEventListener("keydown", (e) => { if (e.key === "Enter") { const t = e.target.closest(sel); if (t) fn(t); } });
    }
    function refresh() { wins.forEach((w) => { const a = A()[w.app]; if (a && a.onChange) a.onChange(w); }); }

    return { open, close, closeAll, tidy, render, focus, restore, minimize, toggleMax, wins, topWin, activate, refresh, paintTasks };
  }

  /* ---------- Scrollpositionen über ein Neuzeichnen retten ---------- */
  const pathOf = (root, el) => { const p = []; while (el && el !== root) { p.unshift([...el.parentNode.children].indexOf(el) + ":" + el.tagName); el = el.parentNode; } return p.join("/"); };
  function scrollState(root) {
    const out = [];
    [root, ...root.querySelectorAll("*")].forEach((el) => { if (el.scrollTop || el.scrollLeft) out.push([pathOf(root, el), el.scrollTop, el.scrollLeft]); });
    return out;
  }
  function restoreScroll(root, list) {
    if (!list.length) return;
    const map = new Map(list.map((x) => [x[0], x]));
    [root, ...root.querySelectorAll("*")].forEach((el) => { if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) return; const k = map.get(pathOf(root, el)); if (k && !el.scrollTop && !el.scrollLeft) { el.scrollTop = k[1]; el.scrollLeft = k[2]; } });
  }

  /* ---------- Touch: Klick beim Loslassen ----------
   * Safari (iPad) verschluckt Klicks, wenn sich beim Antippen die Seite ändert; Windows-Touch macht aus
   * langem Drücken einen Rechtsklick. Deshalb lösen wir bei Finger/Stift den Klick selbst beim Loslassen aus
   * und verwerfen den Klick, den der Browser eventuell hinterherschickt.
   *  - Bewegung > 12 px, Scrollen oder Abbruch: kein Tipp.
   *  - Textfelder: Fokus selbst setzen (öffnet die Tastatur), kein künstlicher Klick.
   *  - Auswahllisten (select): bleiben beim Browser (eigene Auswahl am iPad).
   *  - Kein Kontextmenü außer in Eingabefeldern. */
  const TEXT = 'textarea, [contenteditable=""], [contenteditable="true"], input:not([type]), input[type=text], input[type=search], input[type=password], input[type=number], input[type=email], input[type=tel], input[type=url]';
  let touchOn = false, tapping = false;
  function installTouch() {
    if (touchOn) return; touchOn = true;
    let tap = null, swallowUntil = 0;
    const isTouch = (e) => e.pointerType === "touch" || e.pointerType === "pen";
    document.addEventListener("pointerdown", (e) => {
      if (!isTouch(e) || !e.isPrimary) { tap = null; return; }
      tap = { t: e.target, x: e.clientX, y: e.clientY, id: e.pointerId };
    }, true);
    document.addEventListener("pointermove", (e) => { if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12) tap = null; }, true);
    document.addEventListener("pointercancel", () => { tap = null; }, true);
    document.addEventListener("scroll", () => { tap = null; }, true);
    document.addEventListener("pointerup", (e) => {
      const t = tap; tap = null;
      if (!t || e.pointerId !== t.id || !isTouch(e)) return;
      const el = t.t; if (!el || !el.isConnected) return;
      if (el.closest("select, option")) return;
      const field = el.closest(TEXT);
      if (field) { if (!field.disabled && document.activeElement !== field) field.focus(); return; }
      if (el.closest("input:disabled, button:disabled")) return;
      swallowUntil = performance.now() + 800;
      tapping = true;
      try { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: e.clientX, clientY: e.clientY, detail: 1 })); } finally { tapping = false; }
    }, true);
    // Den echten Klick des Browsers nach einem Tipp verwerfen (sonst doppelt, z. B. Häkchen an und gleich wieder aus)
    document.addEventListener("click", (e) => {
      if (!e.isTrusted || performance.now() > swallowUntil) return;
      if (e.target.closest && (e.target.closest("select, option") || e.target.closest(TEXT))) return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
    document.addEventListener("dblclick", (e) => { if (performance.now() < swallowUntil + 400) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener("contextmenu", (e) => { if (!(e.target.closest && e.target.closest(TEXT))) e.preventDefault(); });
  }

  /** Kurze Meldung. Fängt keine Klicks ab (CSS: pointer-events none). */
  function toast(container, { title, text, kind = "", ms = 5500, max = 4 }) {
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.setAttribute("role", "status");
    el.innerHTML = `<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ""}`;
    container.appendChild(el);
    const all = container.children; while (all.length > max) all[0].remove();
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, ms);
  }

  window.MRDesktop = { create, toast, esc, mobile, coarse, guardBody, installTouch, version: 2 };
})();
