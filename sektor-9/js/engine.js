/*
 * SEKTOR 9 – Engine (einzige Wahrheit über den Spielstand)
 *
 * Aufbau der Welt (js/data.js): Hallen → Standpunkte → vier Blickrichtungen. Hotspots gehören zu einem oder mehreren
 * Standpunkten einer Halle. Die 3D-Schicht (js/3d/core.js) zeichnet nur und ruft engine.hotspot(id).
 * Spielstand: localStorage. Gemeinsam spielen (js/mp-adapter.js, Plattform platform/multiplayer): geteilt werden gelöste Rätsel,
 * Zustände, der Ausrüstungs-Vorrat und das Team-Archiv. Funde liegen zuerst nur im eigenen Archiv, bis man sie teilt.
 */
(() => {
  const N = window.SEKTOR9;
  const D = N.data, A = N.audio || { play() {}, ambient() {}, setEnabled() {} };
  const SAVE_KEY = "sektor9_save_v1";
  let saveKey = SAVE_KEY, mp = null; // mp: Hooks des Mehrspieler-Adapters { saveKey, changed(), sendChat(text), leave() }
  let team = [], chat = [];
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (v) => String(v || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9ÄÖÜ]/g, "");

  /* ---------- Zustand ---------- */
  const fresh = () => ({ v: 1, started: false, finished: false, hall: D.start.hall, station: D.start.station, view: D.start.view || 0,
    flags: [], solved: [], inventory: [...(D.start.inventory || [])], docs: [...(D.start.docs || [])], newDocs: [], seen: [], hints: {},
    echo: [], playMs: 0, sound: true, teamDocs: [], gone: { items: [] }, relay: { d: 0, a: 0 }, ending: null,
    vote: null, voteRound: 0, votes: [], varSeen: {}, stAt: 0, t4At: -1e9, t4n: 0, blindAt: null, fake: null, noCountdown: false });
  let S = fresh(), selected = null, blockedUntil = 0;
  function load() { try { const s = JSON.parse(localStorage.getItem(saveKey) || "null"); if (s && s.v === 1) S = { ...fresh(), ...s }; } catch (e) { /* neu */ } }
  function save() { try { localStorage.setItem(saveKey, JSON.stringify(S)); } catch (e) { /* privat */ } if (mp && mp.changed) mp.changed(); }

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
      if (a.remove) { S.inventory = S.inventory.filter((x) => x !== a.remove); if (!S.gone.items.includes(a.remove)) S.gone.items.push(a.remove); if (selected === a.remove) selected = null; }
      if (a.doc) addDoc(a.doc);
      if (a.sound) A.play(a.sound);
      if (a.echo) setTimeout(() => echo(a.echo), a.delay || 900);
      if (a.end) setTimeout(() => showEnd(a.end), a.delay || 600);
      if (a.relay) { S.relay[a.relay] = Date.now(); relayTick(); checkK3(); }
      if (a.flag === "blind" && !S.blindAt) S.blindAt = clockText();
      if (a.countdown && !S.fake) { S.fake = { end: S.playMs + a.countdown * 1000, moves: 0, done: false }; fakeTick(); }
    }
  }
  function succeed(p) {
    if (isSolved(p.id)) return;
    S.solved.push(p.id); run(p.onSolve); A.play(p.sound || "success"); save();
    openDialog({ kicker: "GELÖST", title: p.title, html: `<p class="inspect-text">${p.success}</p>${(p.onSolve || []).filter((a) => a.doc).map((a) => docHtml(a.doc) + `<p class="found-note">▤ Ins Archiv gelegt</p>`).join("")}` });
  }
  function checkAnswer(p, value) {
    if (p.type === "sequence" && p.anyOrder) { // z. B. Steckfeld: richtige Teile in beliebiger Reihenfolge, ein falsches setzt zurück
      const seq = String(value).split(",").filter(Boolean), k = seq.length - 1;
      if (k >= 0 && (!p.answer.includes(seq[k]) || seq.indexOf(seq[k]) !== k)) return { ok: false, msg: (p.wrongStep && p.wrongStep[seq[k]]) || p.wrongDefault };
      return seq.length < p.answer.length ? { ok: false, partial: true } : { ok: true };
    }
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
    if (r.ok && p.repeatable) { run(p.onSolve); A.play(p.sound || "lever"); setNarration(p.success); save(); refresh(); return { ok: true, repeat: true }; }
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
    if (h.need && !cond(h.need)) { openDialog({ kicker: `${hall().name.toUpperCase()} · ${station().name.toUpperCase()}`, title: h.title || h.label, html: `<p class="inspect-text">${h.locked || "Noch nicht."}</p>` }); A.play("error"); return; }
    if (h.confirm) { // Entscheidung: erst bestätigen – gemeinsam als Abstimmung (gilt erst, wenn alle dasselbe wählen)
      const vote = mp && team.length && h.solves;
      openDialog({ kicker: vote ? `ABSTIMMUNG · RUNDE ${S.voteRound + 1}` : "ENTSCHEIDUNG", title: h.title || h.label,
        html: `<p class="inspect-text">${h.confirm}</p>${vote ? `<p class="muted small">Ihr entscheidet gemeinsam: Es gilt erst, wenn alle im Team dasselbe wählen.${S.vote && S.vote.r === S.voteRound ? ` Deine Stimme bisher: <b>${esc(VOTE[S.vote.c])}</b>.` : ""}</p>` : ""}<div class="confirm-row"><button class="btn" data-confirm="${id}">${esc(vote ? "Stimme: " + (VOTE[h.solves] || h.title) : h.confirmLabel || "Bestätigen")}</button></div>`,
        after: (root) => { root.querySelector("[data-confirm]").onclick = () => { closeDialog(); if (!h.solves || isSolved(h.solves)) return; if (vote) { castVote(h.solves); return; } S.solved.push(h.solves); run(D.puzzles[h.solves].onSolve); A.play("relay"); save(); refresh(); }; } });
      return;
    }
    const parts = [];
    if (h.variants) { // ECHO zeigt nicht jedem dasselbe (T3): im Team je nach Platz, allein wechselt es beim erneuten Hinsehen
      const n = (S.varSeen[id] = (S.varSeen[id] || 0) + 1), i = mp && team.length ? (mp.slot ? mp.slot() : 0) % h.variants.length : (n - 1) % h.variants.length;
      if (!(mp && team.length) && n > 1) parts.push(`<p class="inspect-text"><i>${n === 2 ? "Eben stand hier etwas anderes." : "Der Bildschirm flackert. Wieder eine andere Fassung."}</i></p>`);
      parts.push(`<div class="doc doc-board">${h.variants[i]}</div>`);
    }
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
    if (p.type === "sequence") { // Tasten/Hebel nacheinander (gleiche Prüfung wie am Objekt)
      const ids = [...(p.options || p.answer)].sort((a, b) => (p.labels[a] || a).localeCompare(p.labels[b] || b));
      return `<div class="lock"><p class="lock-prompt">${p.prompt || "Nacheinander betätigen:"}</p><div class="seq-row">${ids.map((id) => `<button type="button" class="btn ghost" data-seq="${id}">${esc(p.labels[id] || id)}</button>`).join("")}</div><p class="seq-trail muted small">&nbsp;</p><p class="lock-fb" aria-live="polite"></p></div>`;
    }
    const inp = p.type === "code" ? `<input class="lock-input" inputmode="numeric" maxlength="${p.length || 4}" autocomplete="off" placeholder="${"–".repeat(p.length || 4)}">`
      : `<input class="lock-input" maxlength="${p.length || 12}" autocomplete="off" placeholder="${"_".repeat(p.length || 6)}">`;
    return `<div class="lock"><p class="lock-prompt">${p.prompt || ""}</p><div class="lock-row">${inp}<button type="button" class="btn" data-lock-try>${p.button || "Prüfen"}</button></div><p class="lock-fb" aria-live="polite"></p></div>`;
  }
  function bindLock(root, p) {
    if (p.type === "sequence") {
      let seq = []; const fb = $(".lock-fb", root), trail = $(".seq-trail", root);
      const reset = () => { seq = []; $$("[data-seq]", root).forEach((b) => b.classList.remove("on")); trail.innerHTML = "&nbsp;"; };
      $$("[data-seq]", root).forEach((b) => { b.onclick = () => {
        if (seq.includes(b.dataset.seq)) return; seq.push(b.dataset.seq); b.classList.add("on"); trail.textContent = seq.map((x) => p.labels[x] || x).join(" → ");
        const r = checkAnswer(p, seq.join(","));
        if (r.partial) { A.play(p.pressSound || "key"); return; }
        if (r.ok) { closeDialog(); if (p.repeatable) { run(p.onSolve); A.play(p.sound || "lever"); setNarration(p.success); save(); refresh(); } else { succeed(p); refresh(); } return; }
        A.play(p.failSound || "error"); fb.textContent = r.msg || "Nichts passiert."; setTimeout(reset, 700);
      }; });
      return;
    }
    const inp = $(".lock-input", root), fb = $(".lock-fb", root), go = () => {
      const r = checkAnswer(p, inp.value);
      if (r.ok) { closeDialog(); succeed(p); refresh(); return; }
      A.play(p.failSound || "error"); fb.textContent = r.msg || "Nichts passiert."; inp.select();
    };
    $("[data-lock-try]", root).onclick = go; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }); setTimeout(() => inp.focus(), 50);
  }

  /* ---------- Bewegung ---------- */
  /* ---------- Falscher Countdown (T5): läuft mit der Spielzeit, bei null passiert nichts ---------- */
  function fakeTick() {
    const box = $("#fakeBox"); if (!box) return;
    const f = S.fake, live = f && !f.done;
    if (live && S.playMs >= f.end) { f.done = true; save(); echo("DRUCKAUSGLEICH ABGESCHLOSSEN. ES GAB NIE EINEN DRUCKABFALL."); setTimeout(() => echo(f.moves ? `${f.moves}-MAL DEN STANDPUNKT GEWECHSELT. IHR SEID GERANNT.` : "IHR SEID NICHT GERANNT. BEMERKENSWERT."), 6800); }
    const show = Boolean(live && !f.done && S.started && !S.noCountdown && S.hall !== "sektor9"); // im Rechenkern steht dort die Abstimmung
    box.classList.toggle("show", show); if (!show) return;
    const left = Math.max(0, Math.ceil((f.end - S.playMs) / 1000)), mm = Math.floor(left / 60), ss = left % 60;
    box.innerHTML = `DRUCKABFALL SEKTOR D · <b>${mm}:${String(ss).padStart(2, "0")}</b> <button type="button" class="link-btn" data-nocount title="Der Countdown hat keine Folgen fürs Spiel">ausblenden</button>`;
    if (ss === 0 && left !== fakeTick.last) A.play("chirp"); fakeTick.last = left;
  }
  const fakeMove = () => { if (S.fake && !S.fake.done) S.fake.moves++; };

  /* ---------- ECHO kommentiert echte Handlungen (T4, ab Sektor D) ---------- */
  const T4_TAIL = ["UNSICHERHEIT NOTIERT.", "ZÖGERN NOTIERT.", "ABBRUCHNEIGUNG: ERHÖHT.", "INTERESSANT."];
  const dur = (ms) => (ms < 60000 ? `${Math.max(5, Math.round(ms / 5000) * 5)} SEKUNDEN` : `${Math.round(ms / 60000)} ${Math.round(ms / 60000) === 1 ? "MINUTE" : "MINUTEN"}`);
  function t4(text, { force = false } = {}) {
    if (!has("tuer_d") || has("blind") || has("ende") || !S.started) return false;
    if (!force && S.playMs - S.t4At < 75000) return false;
    S.t4At = S.playMs; S.t4n++; echo(text); return true;
  }
  function leftStation(who, hid, sid, ms) {
    const st = D.halls[hid] && D.halls[hid].stations[sid]; if (!st || ms < 8000 || ms > 240000) return;
    t4(`${who} ${who === "DU" ? "HAST" : "HAT"} ${st.name.toUpperCase()} NACH ${dur(ms)} VERLASSEN. ${T4_TAIL[S.t4n % T4_TAIL.length]}`);
  }
  function goStation(st, view) {
    if (!hall().stations[st]) return;
    leftStation("DU", S.hall, S.station, S.playMs - (S.stAt || 0)); S.stAt = S.playMs; fakeMove();
    S.station = st; if (view !== undefined) S.view = view; else if (hall().stations[st].view !== undefined) S.view = hall().stations[st].view;
    A.play("step"); save(); refresh(); setNarration(hall().stations[st].arrive || "");
  }
  function goHall(hid, st, view) {
    const h2 = D.halls[hid]; if (!h2) return;
    leftStation("DU", S.hall, S.station, S.playMs - (S.stAt || 0)); S.stAt = S.playMs; fakeMove();
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
    $("#archiveCount").textContent = knownDocs().length; $("#archiveCount").classList.toggle("fresh", S.newDocs.length > 0);
    renderTeam();
  }
  function refresh() {
    if (!S.started) return;
    renderTop(); renderSide(); renderVote();
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
        const mates = team.filter((p) => p.pos && p.pos.hall === hid && p.pos.station === sid).map((p) => `<i class="mate" style="--c:${p.color}" title="${esc(p.name)}"></i>`).join("");
        return `<button class="map-st${here && sid === S.station ? " here" : ""}" ${can ? `data-go="${hid}|${sid}"` : "disabled"}>${here && sid === S.station ? "● " : ""}${esc(s.name)}${mates}</button>`;
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
  const knownDocs = () => [...new Set([...S.docs, ...S.teamDocs])].filter((id) => D.docs[id]);
  function showArchive(openId) {
    const li = (id) => `<li><button data-doc="${id}">${esc(D.docs[id].title)}${S.newDocs.includes(id) ? " <i>NEU</i>" : ""}${mp && S.teamDocs.includes(id) && !S.docs.includes(id) ? " <i class='team'>TEAM</i>" : ""}</button></li>`;
    let list;
    if (mp) { // gemeinsam: eigene, noch nicht geteilte Funde getrennt vom Team-Archiv
      const mine = S.docs.filter((id) => !S.teamDocs.includes(id)), shared = S.teamDocs.filter((id) => D.docs[id]);
      list = `<li class="arch-h">NUR BEI DIR</li>${mine.map(li).join("") || "<li class='muted small'>nichts Ungeteiltes</li>"}<li class="arch-h">TEAM-ARCHIV</li>${shared.map(li).join("") || "<li class='muted small'>noch leer</li>"}`;
    } else list = S.docs.map(li).join("") || "<li class='muted'>Noch leer.</li>";
    const share = openId && mp && !S.teamDocs.includes(openId) ? `<button class="btn small" data-share="${openId}">Mit dem Team teilen</button><p class="muted small">Erst geteilte Funde sehen auch die anderen.</p>` : openId && mp ? `<p class="found-note">✓ Im Team-Archiv</p>` : "";
    overlay("archiveOv", `<div class="archive"><ol class="arch-list">${list}</ol><div class="arch-view">${openId ? `<h3>${esc(D.docs[openId].title)}</h3>${docHtml(openId)}${share}` : `<p class="muted">Wähle ein Dokument.</p>`}</div></div>`);
  }
  function showEcho() {
    const open = Object.values(D.puzzles).filter((p) => !isSolved(p.id) && p.objective && (!p.when || cond(p.when)) && (p.from || []).some((h) => S.seen.includes(h)));
    const log = S.echo.slice(-14).map((l) => `<div class="echo-line"><span>${l.t}</span> ${esc(l.text)}</div>`).join("") || `<div class="echo-line muted">Keine Meldungen.</div>`;
    const tasks = open.map((p) => {
      const used = S.hints[p.id] || 0;
      const shown = p.hints.slice(0, used).map((t, i) => `<p class="hint-text"><b>Stufe ${i + 1}:</b> ${t}</p>`).join("");
      return `<div class="task"><p class="task-title">▸ ${esc(p.objective)}</p>${shown}${used < p.hints.length ? `<button class="btn small" data-hint="${p.id}">Hinweis ${used + 1} von ${p.hints.length} anfordern</button>` : ""}</div>`;
    }).join("") || `<p class="muted">Keine offenen Aufgaben bekannt. Untersuche die Anlage.</p>`;
    // T2: ab Sektor D lenkt die „Wartungsassistenz“ offen zu FORTSETZEN – die Hinweise selbst bleiben richtig
    const rec = has("tuer_d") && !has("ende") ? `<div class="echo-rec"><p class="echo-head">${has("assist_entlarvt") ? "ECHO/09/ASSIST · EMPFEHLUNG" : "EMPFEHLUNG DER WARTUNGSASSISTENZ"}</p><p>${has("assist_entlarvt")
      ? "Ich empfehle weiterhin: <b>FORTSETZEN</b>. Jetzt wisst ihr, wer das empfiehlt. Ändert das etwas an der Empfehlung?"
      : has("entered_sektor9") ? "Ihr seid am Ziel. Die Taste <b>FORTSETZEN</b> sichert alles, was ihr gefunden habt. Abschalten löscht es. Senden gefährdet euch."
      : "Die Anlage ist stabil. Am Ende genügt <b>FORTSETZEN</b> – Abschalten oder Senden gefährdet alle gesicherten Daten. Nowaks Schaltung ist veraltet und unnötig."}</p></div>` : "";
    overlay("echoOv", `<div class="echo-term"><div class="echo-head">${has("assist_entlarvt") ? "ECHO/09/ASSIST" : "WARTUNGSASSISTENZ"} · KESSELBERG · ${sessions()} ${sessions() === 1 ? "SITZUNG" : "SITZUNGEN"}</div><div class="echo-log">${log}</div>${rec}<h3>Offene Aufgaben</h3>${tasks}</div>`);
  }

  /* ---------- Nowaks Relais (K3): Maschinenhalle D und Leitstand A innerhalb von 90 Sekunden ---------- */
  const RELAY_MS = 90000;
  function checkK3() {
    const { d, a } = S.relay; if (isSolved("k3") || !d || !a) return;
    if (Math.abs(d - a) <= RELAY_MS) { const p = D.puzzles.k3; S.solved.push("k3"); run(p.onSolve); A.play("power"); save(); if (S.started) { openDialog({ kicker: "GELÖST", title: p.title, html: `<p class="inspect-text">${p.success}</p>` }); refresh(); } }
  }
  let relayTimer = null;
  function relayTick() {
    clearInterval(relayTimer);
    const box = $("#relayBox"); if (!box) return;
    const step = () => {
      const { d, a } = S.relay, t0 = Math.max(d, a), left = Math.ceil((t0 + RELAY_MS - Date.now()) / 1000);
      if (isSolved("k3") || !t0 || left <= 0 || (d && a && Math.abs(d - a) <= RELAY_MS)) { box.classList.remove("show"); clearInterval(relayTimer); if (!isSolved("k3") && t0 && left <= 0 && !relayTick.warned) { relayTick.warned = true; echo("ZEITRELAIS ABGELAUFEN. ABSCHALTUNG UNVOLLSTÄNDIG."); } return; }
      relayTick.warned = false;
      box.innerHTML = `NOWAK-RELAIS · <b>${left}</b> s · ${d ? "D ✓" : "D –"} · ${a ? "A ✓" : "A –"}`; box.classList.add("show");
    };
    step(); relayTimer = setInterval(step, 500);
  }

  /* ---------- Ende eines Abschnitts ---------- */
  function showEnd(id) {
    const e = D.endings[id]; S.finished = Boolean(e.final); save(); // Abschnittsende ist kein Spielende
    const hints = Object.values(S.hints).reduce((a, b) => a + b, 0);
    const evalHtml = e.final ? `<div class="echo-eval"><p class="echo-head">ECHO · AUSWERTUNG VERSUCHSGRUPPE 09</p>
      <p class="term">Dauer: ${clockText()} · Personen: ${sessions()} · Dokumente gesichtet: ${knownDocs().length}${mp ? ` · davon geteilt: ${S.teamDocs.length}` : ""}</p>
      <p class="term">Angeforderte Hinweise: ${hints}. ${hints ? "Jeder davon kam von mir." : "Ihr habt mich nicht gefragt. Ihr habt mir trotzdem zugehört."}</p>
      ${voteEval()}${S.t4n ? `<p class="term">Zögern notiert: ${S.t4n}-mal.${has("blind") ? "" : " Ihr wart nie unbeobachtet."}</p>` : ""}${S.fake && S.fake.done ? `<p class="term">Countdown Sektor D: ${S.fake.moves}-mal den Standpunkt gewechselt, während er lief. Es gab nie einen Druckabfall.</p>` : ""}${has("blind") ? `<p class="term">Beobachtung abgeschaltet um ${esc(S.blindAt || "?")}. Ich habe trotzdem mitgeschrieben.</p>` : ""}
      <p class="term">Entscheidung: ${esc(e.choice)}. ${esc(e.verdict)}</p>
      <p class="muted">Habt ihr das selbst entschieden?</p></div>` : "";
    overlay("endOv", `<div class="end-card"><p class="eyebrow">${esc(e.kicker)}</p><h2>${esc(e.title)}</h2>${e.html}${evalHtml}<p class="muted small">Spielzeit ${clockText()} · Hinweise genutzt: ${hints}</p><button class="btn" data-restart>Neu beginnen</button></div>`);
  }

  /* ---------- Start ---------- */
  const sessions = () => (mp ? Math.max(1, team.length + 1) : 1);
  function start() {
    setTimeout(relayTick, 500);
    S.started = true; save();
    $("#title").classList.add("hidden"); $("#game").classList.remove("hidden");
    A.setEnabled(S.sound); A.ambient(hall().ambient || null); refresh();
    if (!has("briefed")) { S.flags.push("briefed"); save(); setTimeout(() => openDialog({ kicker: "EINSATZAUFTRAG", title: D.docs.auftrag.title, html: docHtml("auftrag") + `<p class="found-note">▤ Liegt im Archiv</p>` }), 400); }
    if (D.start.echo && !S.echo.length) setTimeout(() => echo(D.start.echo.replace("1 AKTIVE SITZUNG", sessions() === 1 ? "1 AKTIVE SITZUNG" : `${sessions()} AKTIVE SITZUNGEN`)), 2600);
  }
  let last = performance.now();
  setInterval(() => { const n = performance.now(); if (S.started && !document.hidden) { S.playMs += n - last; $("#clock").textContent = clockText(); fakeTick(); } last = n; }, 1000);

  function bind() {
    $("#startBtn").onclick = () => { if ($("#startBtn").dataset.fresh) { S = fresh(); } start(); };
    $("#closeDialog").onclick = closeDialog; $("#dialog").addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });
    $("#turnLeft").onclick = () => turn(-1); $("#turnRight").onclick = () => turn(1);
    $("#mapBtn").onclick = showMap; $("#archiveBtn").onclick = () => showArchive(); $("#echoBtn").onclick = showEcho;
    $("#soundToggle").onclick = () => { S.sound = !S.sound; A.setEnabled(S.sound); $("#soundToggle").classList.toggle("muted", !S.sound); save(); if (S.sound) A.ambient(hall().ambient || null); };
    document.addEventListener("click", (e) => {
      const t = e.target;
      const slot = t.closest("[data-slot]"); if (slot) { const id = slot.dataset.slot; selected = selected === id ? null : id; A.play("click"); renderSide(); return; }
      if (t.closest("[data-nocount]")) { S.noCountdown = true; save(); fakeTick(); setNarration("Countdown ausgeblendet. Er hat keine Folgen für das Spiel."); return; }
      if (t.closest("[data-drop]")) { e.preventDefault(); selected = null; renderSide(); return; }
      if (t.closest(".ov-close")) { closeOverlays(); return; }
      const go = t.closest("[data-go]"); if (go) { const [hid, sid] = go.dataset.go.split("|"); mapGo(hid, sid); return; }
      const doc = t.closest("[data-doc]"); if (doc) { S.newDocs = S.newDocs.filter((x) => x !== doc.dataset.doc); save(); showArchive(doc.dataset.doc); renderSide(); return; }
      const sh = t.closest("[data-share]"); if (sh) { const id = sh.dataset.share; if (!S.teamDocs.includes(id)) S.teamDocs.push(id); save(); A.play("paper"); showArchive(id); t4(`${myName()} TEILT „${D.docs[id].title.toUpperCase()}“. VERTRAUEN IN DIE GRUPPE: NOTIERT.`); return; }
      if (t.closest("[data-chat-send]")) { sendChat(); return; }
      if (t.closest("#chatBtn")) { showChat(); return; }
      if (t.closest("[data-mp-leave]")) { if (mp && mp.leave) mp.leave(); return; }
      const hint = t.closest("[data-hint]"); if (hint) { const id = hint.dataset.hint; S.hints[id] = (S.hints[id] || 0) + 1; save(); A.play("chirp"); showEcho(); t4(`HINWEIS ${S.hints[id]} ANGEFORDERT: ${D.puzzles[id].title.toUpperCase()}. ABHÄNGIGKEIT STEIGT.`); return; }
      if (t.closest("[data-restart]")) { localStorage.removeItem(SAVE_KEY); location.reload(); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "chatInput") { sendChat(); return; } if (e.key === "Escape" && $(".overlay.show")) closeOverlays(); if (!S.started || blocked()) return; if (e.key === "ArrowLeft") turn(-1); if (e.key === "ArrowRight") turn(1); if (e.key === "m") showMap(); });
    load();
    if (S.started) { $("#startBtn").textContent = "Einsatz fortsetzen"; $("#newBtn").classList.remove("hidden"); }
    $("#newBtn").onclick = () => { localStorage.removeItem(SAVE_KEY); S = fresh(); start(); };
    $("#soundToggle").classList.toggle("muted", !S.sound);
  }

  /* ---------- Mehrspieler-Schnittstelle (für js/mp-adapter.js) ----------
     Gemeinsam: solved, flags (ohne persönliche), inventory (Vorrat), gone.items (verbraucht), teamDocs, finished.
     Pro Person: Halle, Standpunkt, Blickrichtung, eigene Funde (docs), seen, hints, echo, Spielzeit. */
  const localFlag = (f) => f === "briefed" || f.startsWith("entered_");
  function exportShared() {
    return { v: 1, relay: { d: S.relay.d, a: S.relay.a }, solved: S.solved.slice(), flags: S.flags.filter((f) => !localFlag(f)), inventory: S.inventory.slice(), gone: { items: S.gone.items.slice() }, teamDocs: S.teamDocs.slice(), finished: Boolean(S.finished) };
  }
  function normalizeShared(sh) { if (!sh) return sh; const gi = (sh.gone && sh.gone.items) || []; return { ...sh, inventory: (sh.inventory || []).filter((x) => !gi.includes(x)) }; }
  const add = (arr, x) => (arr.includes(x) ? false : (arr.push(x), true));
  /** Stand des Teams übernehmen; Rückgabe: was neu ist (für eine kurze Meldung). */
  function applyShared(raw) {
    const sh = normalizeShared(raw); if (!sh || typeof sh !== "object") return [];
    const news = [], newly = []; let changed = false;
    if (sh.relay) { ["d", "a"].forEach((k) => { const v = Number(sh.relay[k]) || 0; if (v > (S.relay[k] || 0)) { S.relay[k] = v; changed = true; news.push(k === "d" ? "⚡ Relais in der Maschinenhalle gesetzt" : "⚡ Schalter im Leitstand umgelegt"); } }); relayTick(); }
    ((sh.gone && sh.gone.items) || []).forEach((x) => { changed = add(S.gone.items, x) || changed; });
    (sh.solved || []).forEach((x) => { if (add(S.solved, x)) { changed = true; newly.push(x); } });
    (sh.flags || []).forEach((f) => { if (!localFlag(f)) changed = add(S.flags, f) || changed; });
    (sh.inventory || []).forEach((x) => { if (D.items[x] && !S.gone.items.includes(x) && add(S.inventory, x)) { changed = true; news.push((D.items[x].icon || "▣") + " " + D.items[x].name); } });
    const il = S.inventory.length; S.inventory = S.inventory.filter((x) => !S.gone.items.includes(x)); changed = changed || il !== S.inventory.length;
    if (selected && !S.inventory.includes(selected)) selected = null;
    (sh.teamDocs || []).forEach((id) => { if (D.docs[id] && add(S.teamDocs, id)) { changed = true; if (!S.docs.includes(id)) { S.newDocs.push(id); news.push("▤ " + D.docs[id].title); } } });
    newly.forEach((pid) => { const p = D.puzzles[pid]; if (!p) return; news.unshift("✓ " + p.title); run((p.onSolve || []).filter((a) => a.echo || a.end)); }); // ECHO spricht zu allen
    if (!changed) return [];
    save(); checkK3();
    if (S.started) {
      if (dlgOpen && $("#dlgBody .lock") && newly.length) { closeDialog(); setNarration("Jemand aus deinem Team hat das gerade gelöst."); }
      renderSide(); refresh();
      if ($("#archiveOv.show")) showArchive();
    }
    return news;
  }
  const position = () => ({ hall: S.hall, station: S.station, view: S.view, hallName: hall().name, stationName: station().name, vote: S.vote, vr: S.voteRound });

  /* ---------- Abstimmung in Sektor 9 (gemeinsam): jede Stimme steht in der eigenen Positionszeile ---------- */
  const VOTE = { ende_a: "ABSCHALTEN", ende_b: "SENDEN", ende_c: "FORTSETZEN" };
  const myName = () => String((mp && mp.name && mp.name()) || "DU").toUpperCase();
  function noteVote(n, v) { if (!v || !VOTE[v.c]) return; const k = n + "|" + v.r; if (!S.votes.some((x) => x.k === k)) { S.votes.push({ k, n, c: v.c, r: v.r, t: v.t || Date.now() }); return true; } return false; }
  function castVote(pid) {
    S.vote = { c: pid, r: S.voteRound, t: Date.now() }; noteVote(myName(), S.vote); A.play("relay"); save();
    setNarration(`Deine Stimme: <b>${esc(VOTE[pid])}</b>. Es gilt, wenn alle im Team dasselbe wählen.`); evaluateVotes(); renderVote();
  }
  function evaluateVotes() {
    if (!mp || has("ende")) return;
    const others = team.map((p) => ({ n: String(p.name || "?").toUpperCase(), v: p.pos && p.pos.vote, vr: (p.pos && p.pos.vr) || 0 }));
    others.forEach((o) => { if (o.v && noteVote(o.n, o.v) && o.v.r === S.voteRound && S.started) t4(`${o.n} WÄHLT ${VOTE[o.v.c]}.`, { force: true }); });
    // erst die eigene Runde auswerten (Stimmen behalten ihre Rundennummer), dann ggf. eine neuere Runde übernehmen
    const all = [{ n: myName(), v: S.vote }, ...others], R = S.voteRound;
    if (others.length && all.every((x) => x.v && x.v.r === R)) {
      const choice = all[0].v.c;
      if (all.every((x) => x.v.c === choice)) { if (!isSolved(choice)) { S.solved.push(choice); run(D.puzzles[choice].onSolve); A.play("relay"); save(); refresh(); } renderVote(); return; }
      echo(`UNEINIGKEIT. ${all.map((x) => `${x.n}: ${VOTE[x.v.c]}`).join(" · ")}. INTERESSANT. WÄHLT ERNEUT.`);
      S.voteRound = R + 1; save();
    }
    const maxR = Math.max(S.voteRound, ...others.map((o) => o.vr));
    if (maxR > S.voteRound) { S.voteRound = maxR; save(); }
    renderVote();
  }
  function renderVote() {
    const box = $("#voteBox"); if (!box) return;
    const show = Boolean(mp && team.length && S.started && S.hall === "sektor9" && !has("ende"));
    box.classList.toggle("show", show); if (!show) return;
    const v = (x) => (x && x.r === S.voteRound ? VOTE[x.c] : "–");
    box.innerHTML = `ABSTIMMUNG · RUNDE ${S.voteRound + 1}<br>${[`<b>${esc(myName())}</b> ${v(S.vote)}`, ...team.map((p) => `<b>${esc(String(p.name || "?").toUpperCase())}</b> ${v(p.pos && p.pos.vote)}`)].join(" · ")}`;
  }
  function voteEval() {
    if (!S.votes.length) return "";
    const rounds = Math.max(...S.votes.map((x) => x.r)) + 1, c = S.votes.filter((x) => x.c === "ende_c").sort((a, b) => a.t - b.t)[0];
    return `<p class="term">Abstimmung: ${rounds} ${rounds === 1 ? "Runde" : "Runden"}. ${c ? `Zuerst FORTSETZEN gewählt hat: ${esc(c.n)}.` : "Niemand hat FORTSETZEN gewählt. Noch nicht."}</p>`;
  }
  const seenPos = {}; // T4 für Mitspieler: Standpunktwechsel nach kurzer Zeit
  /** Mitspieler: [{ id, name, color, pos }] – Teamliste, Karte, Helmlampen in derselben Halle. */
  function setTeam(list) {
    team = list || []; renderTeam();
    team.forEach((p) => { if (!p.pos) return; const k = p.pos.hall + "|" + p.pos.station, o = seenPos[p.id];
      if (o && o.k !== k) { const [h0, s0] = o.k.split("|"); leftStation(String(p.name || "?").toUpperCase(), h0, s0, Date.now() - o.t); }
      if (!o || o.k !== k) seenPos[p.id] = { k, t: Date.now() }; });
    evaluateVotes(); renderVote();
    if (N.view3d && N.view3d.setPlayers) N.view3d.setPlayers(team.filter((p) => p.pos && p.pos.hall === S.hall).map((p) => ({ id: p.id, color: p.color, station: p.pos.station })));
    if ($("#mapOv.show")) showMap();
  }
  function renderTeam() {
    const el = $("#teamBox"); if (!el) return;
    el.classList.toggle("hidden", !mp); $("#chatBtn").classList.toggle("hidden", !mp);
    if (!mp) return;
    el.innerHTML = `<h2 class="side-h">TEAM · ${esc(mp.code ? mp.code() : "")}</h2><ul class="team-list">${team.map((p) => `<li><i class="mate" style="--c:${p.color}"></i><b>${esc(p.name)}</b><span>${p.pos ? esc(p.pos.hallName + " · " + p.pos.stationName) : "noch nicht in der Anlage"}${p.pos && p.pos.vote && p.pos.vote.r === S.voteRound && !has("ende") ? ` · stimmt für ${esc(VOTE[p.pos.vote.c] || "?")}` : ""}</span></li>`).join("") || `<li class="muted small">Noch niemand sonst in der Anlage.</li>`}</ul><button class="link-btn" data-mp-leave>Sitzung verlassen</button>`;
    const unread = chat.filter((m) => m.t > (S.chatSeen || 0)).length; $("#chatCount").textContent = unread || ""; $("#chatCount").classList.toggle("fresh", unread > 0);
  }
  /* Funk: kurze Textnachrichten im Team */
  function setChat(msgs) { chat = (msgs || []).slice().sort((a, b) => a.t - b.t).slice(-120); if ($("#chatOv.show")) showChat(true); else { renderTeam(); if (chat.length && chat[chat.length - 1].mine === false) A.play("chirp"); } }
  function showChat(keep) {
    S.chatSeen = Date.now(); save();
    const log = chat.map((m) => `<div class="chat-line${m.mine ? " mine" : ""}"><b style="color:${m.color || "inherit"}">${esc(m.n)}</b> ${esc(m.x)}</div>`).join("") || `<p class="muted small">Noch kein Funkverkehr. Was ihr hier schreibt, lesen alle im Team.</p>`;
    const val = keep && $("#chatInput") ? $("#chatInput").value : "";
    overlay("chatOv", `<div class="chat"><div class="chat-log">${log}</div><div class="chat-row"><input id="chatInput" maxlength="240" autocomplete="off" placeholder="Nachricht ans Team"><button class="btn small" data-chat-send>Senden</button></div></div>`);
    const inp = $("#chatInput"); inp.value = val; inp.focus(); const lg = $(".chat-log"); lg.scrollTop = lg.scrollHeight; renderTeam();
  }
  function sendChat() { const inp = $("#chatInput"); const x = inp && inp.value.trim(); if (!x || !mp || !mp.sendChat) return; inp.value = ""; mp.sendChat(x); }
  function enterMultiplayer(hooks) { mp = hooks; saveKey = hooks.saveKey; S = fresh(); selected = null; load(); renderTeam(); }
  function leaveMultiplayer() { mp = null; saveKey = SAVE_KEY; team = []; chat = []; S = fresh(); selected = null; load(); renderTeam(); if (N.view3d && N.view3d.setPlayers) N.view3d.setPlayers([]); }
  /** Lobby-Vorbereitung: Einsatzauftrag lesen, danach „bereit“. */
  function showBriefing(done) { openDialog({ kicker: "EINSATZAUFTRAG", title: D.docs.auftrag.title, html: docHtml("auftrag") }); const d = $("#dialog"); const once = () => { d.removeEventListener("close", once); if (!has("briefed")) S.flags.push("briefed"); save(); done && done(); }; d.addEventListener("close", once); }

  N.engine = {
    exportShared, normalizeShared, applyShared, position, setTeam, setChat, enterMultiplayer, leaveMultiplayer, showBriefing, start, isMultiplayer: () => Boolean(mp), inGame: () => S.started,
    hotspot, hotspotData: (id) => H(id), isVisible, selectedItem: () => selected, isLight: () => false, has, blocked, setView, refresh,
    tryLock, isSolved, openItem: () => {}, echo, goStation, goHall, state: () => S, turn,
  };
  N.items = D.items;
  document.addEventListener("DOMContentLoaded", bind);
})();
