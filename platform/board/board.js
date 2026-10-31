/*
 * MYSTERY ROOMS – Pinnwand (Plattform-Baustein, Stufe 1)
 *
 *   const board = MRBoard.mount({ el, template, store, onOpen });
 *
 * template: Startzustand – { cards: [...], threads: [...] }
 *   Karte:  { id, type: "card"|"note", x, y, kind: "photo"|"doc", title, sub, art, body, color, text, rot, author }
 *   Faden:  { id, type: "thread", from, to, color: "red"|"blue"|"green"|"yellow", label }
 * store:   Speicher – { load(): {id: obj}, put(obj), subscribe(cb) }. Jede Änderung ersetzt das ganze
 *          Objekt (zuletzt gespeichert gewinnt). Gelöscht wird mit { id, deleted: true }.
 * onOpen(card): Karte antippen ohne zu ziehen → genauer ansehen.
 *
 * Bedienung: Ziehen verschiebt Karten, Ziehen auf freier Fläche verschiebt die Wand,
 * Mausrad oder zwei Finger zoomen. Werkzeug „Faden“: erste Karte antippen, zweite Karte antippen.
 * Freie Fäden lösen nie etwas aus – sie sind Arbeitsmaterial.
 */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const COLORS = { red: "#b3261e", blue: "#3b76c4", green: "#2e8a55", yellow: "#d9a91a" };
  const COLOR_NAMES = { red: "Rot – verdächtig", blue: "Blau – zeitlich", green: "Grün – bestätigt", yellow: "Gelb – offene Frage" };
  const NOTE_COLORS = ["#f3e58a", "#f6c4a6", "#bfe3c3", "#c9dcf2"];
  const SIZE = { photo: [150, 196], doc: [200, 150], note: [168, 150] };
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /**
   * Spiel-Erweiterungen (alle optional):
   *   decorate(o)        → { cls, stamp, color, tag } – Darstellung je Karte/Faden (z. B. „ENTLASTET“, durchgestrichen)
   *   threadMenu(t)      → { locked, note, actions: [{ id, label, primary }] } – eigene Aktionen statt Farbe/Entfernen
   *   onThreadAction(t, actionId)
   *   locked(o)          → true: nicht entfernbar (z. B. Hagedorns Fäden und die Karten daran)
   */
  function mount({ el, template, store, onOpen = () => {}, surface = { w: 2600, h: 1700 }, decorate = () => null, threadMenu = () => null, onThreadAction = () => {}, locked = () => false }) {
    /* ---------- Modell: Vorlage + gespeicherte Änderungen ---------- */
    const model = new Map();
    for (const c of template.cards || []) model.set(c.id, { ...c, type: c.type || "card" });
    for (const t of template.threads || []) model.set(t.id, { ...t, type: "thread" });
    const applySaved = (saved) => { for (const [id, obj] of Object.entries(saved || {})) model.set(id, obj); };
    applySaved(store.load());

    const view = { x: 0, y: 0, s: 0.6 };
    let tool = "move", threadColor = "red", pending = null, selected = null, dragging = null;

    el.classList.add("mrb");
    el.innerHTML = `
      <div class="mrb-viewport"><div class="mrb-surface" style="width:${surface.w}px;height:${surface.h}px">
        <svg class="mrb-threads" width="${surface.w}" height="${surface.h}" aria-hidden="true"></svg><div class="mrb-items"></div></div></div>
      <div class="mrb-toolbar" role="toolbar" aria-label="Werkzeuge der Pinnwand">
        <button type="button" data-tool="move" class="on" title="Bewegen und ansehen">✋<span>Bewegen</span></button>
        <button type="button" data-tool="thread" title="Faden ziehen">〰<span>Faden</span></button>
        <span class="mrb-colors" aria-label="Fadenfarbe">${Object.keys(COLORS).map((c) => `<button type="button" data-color="${c}" class="${c === threadColor ? "on" : ""}" style="--c:${COLORS[c]}" title="${COLOR_NAMES[c]}" aria-label="${COLOR_NAMES[c]}"></button>`).join("")}</span>
        <button type="button" data-act="note" title="Neue Notiz">＋<span>Notiz</span></button>
        <button type="button" data-tool="delete" title="Entfernen">✕<span>Entfernen</span></button>
        <span class="mrb-sep"></span>
        <button type="button" data-act="zoomout" title="Verkleinern" aria-label="Verkleinern">−</button>
        <button type="button" data-act="fit" title="Alles zeigen" aria-label="Alles zeigen">⤢</button>
        <button type="button" data-act="zoomin" title="Vergrößern" aria-label="Vergrößern">+</button>
      </div>
      <p class="mrb-hint" aria-live="polite"></p>
      <div class="mrb-pop" hidden></div>`;
    const vp = el.querySelector(".mrb-viewport"), surf = el.querySelector(".mrb-surface");
    const svg = el.querySelector(".mrb-threads"), items = el.querySelector(".mrb-items");
    const hint = el.querySelector(".mrb-hint"), pop = el.querySelector(".mrb-pop");

    const setHint = (t) => { hint.textContent = t || ""; hint.classList.toggle("show", Boolean(t)); };
    const applyView = () => { surf.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; };
    const sizeOf = (o) => (o.type === "note" ? SIZE.note : SIZE[o.kind] || SIZE.doc);
    const center = (o) => { const [w, h] = sizeOf(o); return [o.x + w / 2, o.y + h / 2]; };
    const alive = (o) => o && !o.deleted;
    const save = (o) => { model.set(o.id, o); store.put(o); };
    /** Freien Platz nahe (cx, cy) suchen, damit Neues nicht auf Vorhandenem landet. */
    function freeSpot(w, h, cx, cy) {
      const taken = [...model.values()].filter((o) => o.type !== "thread" && alive(o)).map((o) => { const [ow, oh] = sizeOf(o); return [o.x - 18, o.y - 18, o.x + ow + 18, o.y + oh + 18]; });
      const fits = (x, y) => !taken.some(([a, b, c, d]) => x < c && x + w > a && y < d && y + h > b);
      for (let r = 0; r < 14; r++) {
        const steps = r === 0 ? 1 : 8 * r;
        for (let k = 0; k < steps; k++) {
          const ang = (k / steps) * Math.PI * 2, x = Math.round(cx - w / 2 + Math.cos(ang) * r * 70), y = Math.round(cy - h / 2 + Math.sin(ang) * r * 60);
          if (x > 20 && y > 20 && x + w < surface.w - 20 && y + h < surface.h - 20 && fits(x, y)) return [x, y];
        }
      }
      return [Math.round(cx - w / 2), Math.round(cy - h / 2)];
    }

    /* ---------- Darstellung ---------- */
    function cardHtml(o) {
      const [w, h] = sizeOf(o);
      const style = `left:${o.x}px;top:${o.y}px;width:${w}px;height:${h}px;--rot:${o.rot || 0}deg`;
      const dec = decorate(o) || {};
      const cls = `mrb-item ${o.type === "note" ? "mrb-note" : "mrb-card mrb-" + o.kind}${selected === o.id ? " sel" : ""}${pending === o.id ? " pending" : ""}${dec.cls ? " " + dec.cls : ""}`;
      const stamp = dec.stamp ? `<span class="mrb-stamp">${esc(dec.stamp)}</span>` : "";
      if (o.type === "note") return `<div class="${cls}" data-id="${o.id}" style="${style};--note:${o.color || NOTE_COLORS[0]}"><i class="pin"></i><p class="${o.author === "hagedorn" ? "hand" : ""}">${esc(o.text || "")}</p>${o.author === "hagedorn" ? `<small>– H.</small>` : ""}${stamp}</div>`;
      return `<div class="${cls}" data-id="${o.id}" style="${style}"><i class="pin"></i>${o.art ? `<div class="mrb-art">${o.art}</div>` : ""}<div class="mrb-label"><b>${esc(o.title)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</div>${stamp}</div>`;
    }
    function threadPath(t) {
      const a = model.get(t.from), b = model.get(t.to);
      if (!alive(a) || !alive(b)) return null;
      const [x1, y1] = center(a), [x2, y2] = center(b);
      const sag = Math.min(80, Math.hypot(x2 - x1, y2 - y1) * 0.12);
      return { d: `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 + sag / 2 };
    }
    function drawThreads() {
      svg.innerHTML = [...model.values()].filter((o) => o.type === "thread" && alive(o)).map((t) => {
        const p = threadPath(t);
        if (!p) return "";
        const dec = decorate(t) || {};
        const c = COLORS[dec.color || t.color] || COLORS.red;
        const label = t.label || dec.tag ? `<foreignObject x="${p.mx - 90}" y="${p.my - 14}" width="180" height="62"><div class="mrb-tlabel" style="--c:${c}">${t.label ? `<span class="txt">${esc(t.label)}</span>` : ""}${dec.tag ? `<em class="mrb-ttag">${esc(dec.tag)}</em>` : ""}</div></foreignObject>` : "";
        return `<g class="mrb-thread${selected === t.id ? " sel" : ""}${dec.cls ? " " + dec.cls : ""}" data-id="${t.id}"><path d="${p.d}" class="hit"/><path d="${p.d}" class="line" style="stroke:${c}"/>${label}</g>`;
      }).join("");
    }
    function render() {
      items.innerHTML = [...model.values()].filter((o) => o.type !== "thread" && alive(o)).map(cardHtml).join("");
      drawThreads();
    }

    /* ---------- Ansicht: alles einpassen, zoomen, verschieben ---------- */
    function fit() {
      const objs = [...model.values()].filter((o) => o.type !== "thread" && alive(o));
      if (!objs.length) return;
      const xs = objs.flatMap((o) => [o.x, o.x + sizeOf(o)[0]]), ys = objs.flatMap((o) => [o.y, o.y + sizeOf(o)[1]]);
      const bx = Math.min(...xs) - 40, by = Math.min(...ys) - 40, bw = Math.max(...xs) - bx + 40, bh = Math.max(...ys) - by + 40;
      const r = vp.getBoundingClientRect();
      // Platz für die Werkzeugleiste unten freihalten (tatsächliche Höhe, auf dem Handy höher)
      const bar = el.querySelector(".mrb-toolbar"), reserve = bar ? bar.offsetHeight + 24 : 70;
      view.s = Math.max(0.15, Math.min(1.4, Math.min(r.width / bw, (r.height - reserve) / bh)));
      view.x = (r.width - bw * view.s) / 2 - bx * view.s;
      view.y = (r.height - reserve - bh * view.s) / 2 - by * view.s;
      applyView();
    }
    function zoomAt(f, cx, cy) {
      const s = Math.max(0.2, Math.min(2.2, view.s * f));
      const r = vp.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
      view.x = px - ((px - view.x) * s) / view.s; view.y = py - ((py - view.y) * s) / view.s; view.s = s;
      applyView();
    }
    const toSurface = (cx, cy) => { const r = vp.getBoundingClientRect(); return [(cx - r.left - view.x) / view.s, (cy - r.top - view.y) / view.s]; };

    /* ---------- Werkzeuge ---------- */
    function setTool(t) {
      tool = t; pending = null; selected = null; hidePop();
      el.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === t));
      el.classList.toggle("tool-thread", t === "thread"); el.classList.toggle("tool-delete", t === "delete");
      setHint(t === "thread" ? "Faden: erste Karte antippen, dann die zweite." : t === "delete" ? "Entfernen: Karte, Notiz oder Faden antippen." : "");
      render();
    }
    function addNote(text = "", at = null) {
      const r = vp.getBoundingClientRect();
      const [x, y] = at || toSurface(r.left + r.width / 2, r.top + r.height / 2);
      const [nx, ny] = freeSpot(SIZE.note[0], SIZE.note[1], x, y);
      const o = { id: uid("note"), type: "note", x: nx, y: ny, text, color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], rot: Math.round(Math.random() * 6 - 3) };
      save(o); render(); editNote(o.id);
    }
    function removeObj(id) {
      const o = model.get(id);
      if (!o) return;
      const guarded = locked(o) || (o.type !== "thread" && [...model.values()].some((t) => t.type === "thread" && alive(t) && locked(t) && (t.from === id || t.to === id)));
      if (guarded) { setHint(o.type === "thread" ? "Dieser Faden lässt sich nicht abreißen – nur widerlegen." : "Daran hängt ein Faden, der erst widerlegt werden muss."); return; }
      save({ id, type: o.type, deleted: true });
      // Fäden an einer entfernten Karte verschwinden mit
      if (o.type !== "thread") for (const t of model.values()) if (t.type === "thread" && alive(t) && (t.from === id || t.to === id)) save({ id: t.id, type: "thread", deleted: true });
      render();
    }
    function tapItem(id) {
      const o = model.get(id);
      if (tool === "delete") return removeObj(id);
      if (tool === "thread") {
        if (!pending) { pending = id; setHint("Jetzt die zweite Karte antippen."); return render(); }
        if (pending === id) { pending = null; setHint("Faden: erste Karte antippen, dann die zweite."); return render(); }
        const exists = [...model.values()].some((t) => t.type === "thread" && alive(t) && ((t.from === pending && t.to === id) || (t.from === id && t.to === pending)));
        if (!exists) save({ id: uid("thread"), type: "thread", from: pending, to: id, color: threadColor });
        pending = null; setHint("Faden gezogen. Nächste Verbindung: wieder zwei Karten antippen."); return render();
      }
      if (o.type === "note") return editNote(id);
      onOpen(o);
    }

    /* ---------- kleine Fenster: Notiz bearbeiten, Faden ändern ---------- */
    function hidePop() { pop.hidden = true; pop.innerHTML = ""; }
    function editNote(id) {
      const o = model.get(id);
      pop.hidden = false;
      pop.innerHTML = `<div class="mrb-popbox"><p class="mrb-poptitle">Notiz</p>
        <textarea maxlength="160" rows="4" placeholder="z. B. „Warum stimmen die Uhrzeiten nicht?“">${esc(o.text || "")}</textarea>
        <div class="mrb-notecolors">${NOTE_COLORS.map((c) => `<button type="button" data-notecolor="${c}" style="--note:${c}" class="${c === o.color ? "on" : ""}" aria-label="Farbe"></button>`).join("")}</div>
        <div class="mrb-popactions"><button type="button" data-pop="del">Entfernen</button><button type="button" data-pop="ok" class="primary">Fertig</button></div></div>`;
      const ta = pop.querySelector("textarea"); setTimeout(() => ta.focus(), 30);
      pop.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.notecolor) { pop.querySelectorAll("[data-notecolor]").forEach((x) => x.classList.toggle("on", x === b)); o.color = b.dataset.notecolor; return; }
        if (b.dataset.pop === "del") { hidePop(); return removeObj(id); }
        if (b.dataset.pop === "ok") { save({ ...o, text: ta.value.trim() }); hidePop(); render(); }
      };
    }
    function editThread(id) {
      const t = model.get(id);
      selected = id; render();
      pop.hidden = false;
      const menu = threadMenu(t);
      if (menu) {
        pop.innerHTML = `<div class="mrb-popbox"><p class="mrb-poptitle">${esc(menu.title || "Faden")}</p>${t.label ? `<p class="mrb-popnote">„${esc(t.label)}“</p>` : ""}${menu.note ? `<p class="mrb-popsub">${esc(menu.note)}</p>` : ""}
          <div class="mrb-popactions mrb-popstack">${(menu.actions || []).map((a) => `<button type="button" data-tact="${esc(a.id)}" class="${a.primary ? "primary" : ""}">${esc(a.label)}</button>`).join("")}<button type="button" data-pop="ok">Schließen</button></div></div>`;
        pop.onclick = (e) => {
          const b = e.target.closest("button"); if (!b) return;
          hidePop(); selected = null; render();
          if (b.dataset.tact) onThreadAction(t, b.dataset.tact);
        };
        return;
      }
      pop.innerHTML = `<div class="mrb-popbox"><p class="mrb-poptitle">Faden</p>${t.label ? `<p class="mrb-popnote">„${esc(t.label)}“</p>` : ""}
        <div class="mrb-threadcolors">${Object.keys(COLORS).map((c) => `<button type="button" data-tcolor="${c}" class="${c === t.color ? "on" : ""}" style="--c:${COLORS[c]}">${COLOR_NAMES[c]}</button>`).join("")}</div>
        <div class="mrb-popactions"><button type="button" data-pop="del">Faden entfernen</button><button type="button" data-pop="ok" class="primary">Fertig</button></div></div>`;
      pop.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.tcolor) { save({ ...model.get(id), color: b.dataset.tcolor }); pop.querySelectorAll("[data-tcolor]").forEach((x) => x.classList.toggle("on", x === b)); return drawThreads(); }
        if (b.dataset.pop === "del") { hidePop(); selected = null; return removeObj(id); }
        hidePop(); selected = null; render();
      };
    }

    /* ---------- Zeiger: Karten ziehen, Wand verschieben, zwei Finger zoomen ---------- */
    const pointers = new Map();
    let pinch = null, pan = null;
    vp.addEventListener("pointerdown", (e) => {
      if (!pop.hidden) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      vp.setPointerCapture(e.pointerId);
      if (pointers.size === 2) { // zwei Finger: zoomen statt ziehen
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s };
        dragging = null; pan = null; return;
      }
      const itemEl = e.target.closest(".mrb-item"), threadEl = e.target.closest(".mrb-thread");
      if (itemEl) {
        const o = model.get(itemEl.dataset.id);
        dragging = { id: o.id, el: itemEl, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, moved: false };
      } else if (threadEl) {
        dragging = { thread: threadEl.dataset.id, sx: e.clientX, sy: e.clientY, moved: false };
      } else {
        pan = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
      }
    });
    vp.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAt((pinch.s * d) / pinch.d / view.s, (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      if (dragging && dragging.id) {
        const dx = e.clientX - dragging.sx, dy = e.clientY - dragging.sy;
        if (!dragging.moved && Math.hypot(dx, dy) < 6) return;
        if (tool !== "move") return; // in den anderen Werkzeugen nur antippen
        dragging.moved = true;
        const o = model.get(dragging.id);
        o.x = Math.round(dragging.ox + dx / view.s); o.y = Math.round(dragging.oy + dy / view.s);
        dragging.el.style.left = o.x + "px"; dragging.el.style.top = o.y + "px";
        dragging.el.classList.add("lifted");
        drawThreads();
      } else if (dragging && dragging.thread) {
        if (Math.hypot(e.clientX - dragging.sx, e.clientY - dragging.sy) > 6) dragging.moved = true;
      } else if (pan) {
        const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy;
        if (Math.hypot(dx, dy) > 4) pan.moved = true;
        view.x = pan.vx + dx; view.y = pan.vy + dy; applyView();
      }
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; return; }
      if (dragging && dragging.id) {
        const d = dragging; dragging = null;
        if (d.moved) { const o = model.get(d.id); save({ ...o }); render(); } else tapItem(d.id);
      } else if (dragging && dragging.thread) {
        const d = dragging; dragging = null;
        if (!d.moved) { if (tool === "delete") removeObj(d.thread); else editThread(d.thread); }
      } else if (pan) {
        const p = pan; pan = null;
        if (!p.moved && (pending || selected)) { pending = null; selected = null; render(); if (tool === "thread") setHint("Faden: erste Karte antippen, dann die zweite."); }
      }
    };
    vp.addEventListener("pointerup", up);
    vp.addEventListener("pointercancel", up);
    vp.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });

    el.querySelector(".mrb-toolbar").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tool) setTool(b.dataset.tool);
      if (b.dataset.color) { threadColor = b.dataset.color; el.querySelectorAll("[data-color]").forEach((x) => x.classList.toggle("on", x === b)); if (tool !== "thread") setTool("thread"); }
      if (b.dataset.act === "note") addNote();
      if (b.dataset.act === "zoomin") { const r = vp.getBoundingClientRect(); zoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2); }
      if (b.dataset.act === "zoomout") { const r = vp.getBoundingClientRect(); zoomAt(1 / 1.2, r.left + r.width / 2, r.top + r.height / 2); }
      if (b.dataset.act === "fit") fit();
    });

    /* ---------- Änderungen von anderen ---------- */
    let active = true; // nach erneutem Einhängen reagiert die alte Wand nicht mehr
    store.subscribe((obj) => {
      if (!active || !obj || !obj.id) return;
      if (dragging && dragging.id === obj.id) return; // eigene Bewegung läuft gerade
      model.set(obj.id, obj);
      if (!dragging) render(); else drawThreads();
    });

    render();
    requestAnimationFrame(fit);
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    el._mrbDestroy && el._mrbDestroy();
    el._mrbDestroy = () => { active = false; window.removeEventListener("resize", onResize); };

    return {
      /** Beweis aus der Akte aufhängen (in der Mitte der aktuellen Ansicht). */
      pin(card) {
        if (alive(model.get(card.id))) return false;
        const r = vp.getBoundingClientRect(), [cx, cy] = toSurface(r.left + r.width / 2, r.top + r.height / 2);
        const [w, h] = SIZE[card.kind] || SIZE.doc;
        const [x, y] = freeSpot(w, h, cx, cy);
        save({ ...card, type: "card", x, y, rot: Math.round(Math.random() * 4 - 2), deleted: false });
        render(); return true;
      },
      has: (id) => alive(model.get(id)),
      get: (id) => model.get(id),
      all: () => [...model.values()].filter(alive),
      reload(saved) { applySaved(saved); render(); },
      /** Neu zeichnen, z. B. wenn sich der Spielstand (Entlastungen) geändert hat. */
      redraw: () => { if (!dragging) render(); },
      fit,
    };
  }

  /* ---------- Speicher ---------- */
  /** Allein: im Browser speichern. */
  function localStore(key) {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { /* defekt */ }
    return {
      load: () => data,
      put(obj) { data[obj.id] = obj; try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* privat */ } },
      subscribe() {},
    };
  }
  /** Gemeinsam: jedes Objekt ein eigener Eintrag „board:<id>“ in der Sitzung (MRMultiplayer-Client). */
  function sessionStore(client, prefix = "board:") {
    const subs = [];
    // Eigene Änderungen kommen als Echo zurück – die Wand hat sie schon, also nicht noch einmal anwenden
    client.on("state", (row) => {
      if (!String(row.state_key).startsWith(prefix)) return;
      if (row.updated_by && client.user && row.updated_by === client.user.id) return;
      subs.forEach((f) => f(row.state));
    });
    // Pro Objekt höchstens eine Anfrage gleichzeitig, immer mit dem neuesten Stand:
    // sonst kann eine ältere Fassung (z. B. leere Notiz) eine neuere auf dem Server überholen.
    const queue = new Map();
    async function flush(id) {
      const q = queue.get(id);
      q.busy = true;
      while (q.next) {
        const obj = q.next; q.next = null;
        try { await client.writeOwn(prefix + id, obj); } catch (e) { client.emit("error", e); }
      }
      q.busy = false;
    }
    return {
      load: () => Object.fromEntries(Object.entries(client.states).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v])),
      put(obj) {
        const q = queue.get(obj.id) || { busy: false, next: null };
        queue.set(obj.id, q);
        q.next = obj;
        if (!q.busy) flush(obj.id);
      },
      subscribe(f) { subs.push(f); },
    };
  }

  window.MRBoard = { mount, localStore, sessionStore };
})();
