/*
 * DER LETZTE FALL – Version 2: Ermittlungs-Tablet im Spiel
 * Reiter: Fall · Beweise · Personen · Zeitleiste · Wand (ERMITTLUNGSDESIGN.md, Abschnitt 2).
 * Fragen sind Rätsel vom Typ „question“ in den Bereichen (js/v2/kapitel.js); gelöst werden sie
 * über die Engine – damit gelten sie im Team und schalten Bereiche frei wie bisher.
 * Entwürfe (Antwort + Belege + letzte Rückmeldung) liegen allein im Browser, gemeinsam als
 * „inv:“-Einträge der Sitzung; die Wand als „board:“-Einträge. Je Eintrag gewinnt der letzte Schreiber.
 */
(() => {
  "use strict";
  const N = window.MRGAME, E = N.engine, CASE = N.case, A = N.audio;
  if (!E || !CASE) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const QS = () => E.questions();
  const Q = (id) => E.puzzle(id);
  const solved = (id) => Boolean(id && E.isSolved(id));
  const mp = () => (N.multiplayer && N.multiplayer.isActive() && N.multiplayer.client && N.multiplayer.client.session ? N.multiplayer.client : null);
  const me = () => (mp() && mp().user ? mp().user.id : null);
  const who = (uid) => (mp() && uid ? mp().playerName(uid) : "") || "";

  /* ---------- Speicher je Spielstand bzw. Sitzung ---------- */
  let storeKey = null, inv = null, state = {}, boardStore = null, board = null, local = {};
  const localKey = () => "dlf_v2_local:" + E.saveKey();
  function ensureStores() {
    const c = mp(), key = c ? "mp:" + c.session.session_id : "sp:" + E.saveKey();
    if (key === storeKey) return;
    storeKey = key;
    inv = c ? MRBoard.sessionStore(c, "inv:") : MRBoard.localStore("dlf_v2_inv:" + E.saveKey());
    boardStore = c ? MRBoard.sessionStore(c, "board:") : MRBoard.localStore("dlf_v2_board:" + E.saveKey());
    state = { ...inv.load() };
    try { local = JSON.parse(localStorage.getItem(localKey()) || "{}"); } catch (e) { local = {}; }
    inv.subscribe((obj) => {
      if (!obj || !obj.id || storeKey !== key) return;
      const was = state[obj.id] || {};
      state[obj.id] = obj;
      if (obj.result && !obj.result.ok && obj.result.by !== me() && (!was.result || was.result.at !== obj.result.at)) toast(`<b>${esc(who(obj.result.by) || "Jemand")}</b> hat eingereicht – nicht schlüssig.`);
      if (obj.id.startsWith("draft:") && openQ === obj.id.slice(6) && isOpen() && $("#tModal [data-submit]")) renderQuestion(true);
    });
    board = null; $("#tBoard").innerHTML = ""; ready = false;
  }
  const saveLocal = () => { try { localStorage.setItem(localKey(), JSON.stringify(local)); } catch (e) { /* privat */ } };
  const draftOf = (qid) => state["draft:" + qid] || { id: "draft:" + qid, answer: null, evidence: [] };
  const put = (obj) => { state[obj.id] = obj; inv.put(obj); };

  /* ---------- Sichtbarkeit ---------- */
  const archive = () => E.docs().filter((id) => N.docs[id] && !CASE.hiddenDocs.includes(id));
  const placeOf = (id) => CASE.places[id] || "Akte";
  const visibleQuestions = () => QS().filter((q) => E.visited(q.room) && (!q.hiddenUntil || solved(q.hiddenUntil)));
  const docHtml = (id) => E.docHtml(id);

  /* ---------- Rahmen ---------- */
  const isOpen = () => !$("#tablet").hidden;
  const toast = (t, ms = 3600) => { const el = $("#tToast"); el.innerHTML = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), ms); };
  function modal(html, cls = "") { const m = $("#tModal"); m.innerHTML = `<div class="tm-box ${cls}"><button class="tm-x" data-close-modal aria-label="Schließen">×</button>${html}</div>`; m.hidden = false; return $(".tm-box", m); }
  function closeModal() { $("#tModal").hidden = true; $("#tModal").innerHTML = ""; openQ = null; }
  $("#tModal").addEventListener("click", (e) => { if (e.target.id === "tModal" || e.target.closest("[data-close-modal]")) closeModal(); });

  let tab = "fall";
  function setTab(t) {
    tab = t;
    $$("#tablet [data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
    $$("#tablet .t-pane").forEach((p) => { p.hidden = p.id !== "pane-" + t; });
    render();
    if (t === "wand") mountBoard();
  }
  $("#tablet").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { A.play("click"); setTab(b.dataset.tab); } });

  function render() {
    if (!isOpen()) return;
    const open = visibleQuestions().filter((q) => !solved(q.id) && !q.bonus).length;
    $("#badgeFall").textContent = open || ""; $("#badgeFall").hidden = !open;
    if (tab === "fall") renderFall();
    if (tab === "beweise") renderArchive();
    if (tab === "personen") renderPersons();
    if (tab === "zeit") renderTimeline();
    if (tab === "wand") mountBoard();
  }

  /* ---------- Fall ---------- */
  function renderFall() {
    const fields = CASE.fields.map((f) => { const q = QS().find((x) => x.field === f.id), ok = q && solved(q.id);
      return `<div class="t-field ${ok ? "ok" : ""}"><b>${esc(f.label)}</b><span>${ok ? esc(q.fieldText) : esc(f.open)}</span><i>${ok ? "✓" : "offen"}</i></div>`; }).join("");
    const vis = visibleQuestions(), openQs = vis.filter((q) => !solved(q.id)), done = QS().filter((q) => solved(q.id));
    const item = (q) => { const d = draftOf(q.id), r = d.result;
      return `<button class="t-q ${q.bonus ? "bonus" : ""}" data-q="${q.id}"><span>${esc(q.title)}${q.bonus ? ` <span class="t-tag">Zusatzfrage</span>` : ""}</span><small>${r && !r.ok ? `Zuletzt: ${esc(r.short)}${who(r.by) ? " · " + esc(who(r.by)) : ""}` : d.answer || (d.evidence || []).length ? "Entwurf begonnen" : "noch nicht bearbeitet"}</small><em>›</em></button>`; };
    $("#pane-fall").innerHTML = `<p class="t-kicker">FALLSTAND · TÄTER UNBEKANNT</p><div class="t-fields">${fields}</div>
      <h3 class="t-h">Offene Fragen</h3>${openQs.length ? openQs.map(item).join("") : `<p class="t-empty">Gerade ist keine Frage offen. Untersuche die Orte – neue Funde werfen neue Fragen auf.</p>`}
      ${done.length ? `<h3 class="t-h">Erkenntnisse</h3><ol class="t-findings">${done.map((q) => `<li><b>${esc(q.title)}</b><p>${esc(q.finding)}</p></li>`).join("")}</ol>` : ""}`;
  }
  $("#pane-fall").addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) openQuestion(b.dataset.q); });

  /* ---------- Fragen ---------- */
  let openQ = null;
  const answerLabel = (q, v) => (v == null || v === "" ? "" : q.answer.type === "time" ? `${String(v).slice(0, 2)}:${String(v).slice(2)}` : v);
  function openQuestion(qid) {
    const q = Q(qid); if (!q) return;
    openQ = qid;
    if (solved(qid)) { modal(`<p class="t-kicker">ERKENNTNIS</p><h3>${esc(q.title)}</h3><div class="t-result good">${esc(q.finding)}</div>`, "q"); return; }
    renderQuestion();
  }
  function renderQuestion(keep = false) {
    const q = Q(openQ); if (!q || solved(q.id)) return;
    const d = draftOf(q.id), old = $("#tModal .tm-box"), y = keep && old ? old.scrollTop : 0, a = q.answer;
    let input = "";
    if (a.type === "time") input = `<div class="t-time"><input id="qTime" inputmode="numeric" maxlength="5" placeholder="hh:mm" value="${esc(answerLabel(q, d.answer))}" autocomplete="off"><span class="t-sub">Uhrzeit, z. B. 21:15</span></div>`;
    if (a.type === "person") input = `<div class="t-opts persons">${Object.entries(CASE.persons).map(([id, p]) => `<label class="t-opt ${d.answer === id ? "on" : ""}"><input type="radio" name="qa" value="${id}" ${d.answer === id ? "checked" : ""}><span><b>${esc(p.name)}</b><small>${esc(p.role)}</small></span></label>`).join("")}</div>`;
    if (a.type === "claim") input = `<div class="t-opts">${a.options.map((o) => `<label class="t-opt ${d.answer === o.id ? "on" : ""}"><input type="radio" name="qa" value="${o.id}" ${d.answer === o.id ? "checked" : ""}><span>${esc(o.text)}</span></label>`).join("")}</div>`;
    const ev = (d.evidence || []).filter((x) => N.docs[x]), r = d.result;
    const hints = E.hintCount(q.id), fails = (local.fails || {})[q.id] || 0;
    const b = modal(`<p class="t-kicker">OFFENE FRAGE${q.bonus ? " · ZUSATZ" : ""}</p><h3>${esc(q.title)}</h3>${q.prompt ? `<p class="t-lead">${q.prompt}</p>` : ""}
      <p class="t-step">1 · Deine Antwort</p>${input}
      <p class="t-step">2 · Deine Belege <span class="t-sub">(mindestens ${q.evidence.need})</span></p>
      <div class="t-chips">${ev.map((x) => `<span class="t-chip">${esc(N.docs[x].title)}<button data-unpick="${x}" aria-label="Beleg entfernen">×</button></span>`).join("")}<button class="t-add" data-pickev>+ Beleg aus dem Archiv</button></div>
      ${r ? `<div class="t-result ${r.ok ? "good" : "bad"}">${esc(r.text)}${who(r.by) && r.by !== me() ? `<small>eingereicht von ${esc(who(r.by))}</small>` : ""}</div>` : ""}
      ${d.by && d.by !== me() && who(d.by) ? `<p class="t-sub">${esc(who(d.by))} hat zuletzt an diesem Entwurf gearbeitet.</p>` : ""}
      <button class="t-btn gold" data-submit>Schlussfolgerung einreichen</button>
      ${fails >= 3 && hints < 1 ? `<p class="t-sub nudge">Du hängst hier fest? Unten gibt es Hinweise.</p>` : ""}
      <details class="t-hints" ${hints ? "open" : ""}><summary>Hinweise</summary>${q.hints.map((h, i) => (i < hints ? `<p><b>${i + 1}${i === 2 ? " · Lösung" : ""}</b> ${esc(h)}</p>` : "")).join("")}${hints < q.hints.length ? `<button class="t-btn small" data-hint>${hints === q.hints.length - 1 ? "Lösung aufdecken" : `Hinweis ${hints + 1} aufdecken`}</button>` : ""}</details>`, "q");
    b.scrollTop = y;
    const time = $("#qTime", b);
    const timeVal = () => time.value.replace(/\D/g, "").slice(0, 4) || null;
    if (time) time.addEventListener("change", () => saveDraft({ answer: timeVal() }));
    $$('input[name="qa"]', b).forEach((i) => i.addEventListener("change", () => saveDraft({ answer: i.value }, true)));
    b.addEventListener("click", (e) => {
      if (e.target.closest("[data-pickev]")) return pickEvidence();
      const un = e.target.closest("[data-unpick]"); if (un) return saveDraft({ evidence: draftOf(openQ).evidence.filter((x) => x !== un.dataset.unpick) }, true);
      if (e.target.closest("[data-submit]")) { if (time) saveDraft({ answer: timeVal() }); return submit(); }
      if (e.target.closest("[data-hint]")) { E.addHint(openQ); A.play("paper"); renderQuestion(true); }
    });
  }
  function saveDraft(patch, rerender = false) {
    put({ ...draftOf(openQ), ...patch, id: "draft:" + openQ, by: me(), result: patch.result !== undefined ? patch.result : null });
    if (rerender) renderQuestion(true);
  }
  function pickEvidence() {
    const qid = openQ, sel = new Set(draftOf(qid).evidence || []);
    const b = modal(`<p class="t-kicker">BELEGE AUSWÄHLEN</p><h3>${esc(Q(qid).title)}</h3><div class="t-picklist">${archive().map((id) => `<label class="t-opt ${sel.has(id) ? "on" : ""}"><input type="checkbox" value="${id}" ${sel.has(id) ? "checked" : ""}><span><b>${esc(N.docs[id].title)}</b><small>${esc(placeOf(id))}</small></span></label>`).join("")}</div><button class="t-btn gold" data-pickdone>Übernehmen</button>`, "q");
    openQ = qid;
    b.addEventListener("change", (e) => { const i = e.target; if (i.type === "checkbox") { if (i.checked) sel.add(i.value); else sel.delete(i.value); i.closest(".t-opt").classList.toggle("on", i.checked); } });
    b.addEventListener("click", (e) => { if (e.target.closest("[data-pickdone]")) { openQ = qid; saveDraft({ evidence: [...sel] }); renderQuestion(); } });
  }
  /** ERMITTLUNGSDESIGN.md 3.3 – meldet die erste Schwachstelle. */
  function evaluate(q, d) {
    const val = d.answer;
    if (!val) return { ok: false, text: "Wähle zuerst eine Antwort.", short: "keine Antwort" };
    if (!q.answer.accept.includes(val)) return { ok: false, text: (q.wrongAnswer && q.wrongAnswer[val]) || "Das passt nicht zu dem, was die Belege zeigen.", short: "Antwort passt nicht" };
    const ev = (d.evidence || []).filter((x) => N.docs[x]);
    if (ev.length < q.evidence.need) return { ok: false, text: q.missingEvidence, short: "Belege fehlen" };
    const valid = new Set(q.evidence.sets.flat()), bad = ev.find((x) => !valid.has(x));
    if (bad) return { ok: false, text: (q.wrongEvidence && q.wrongEvidence[bad]) || `Die Antwort stimmt. Aber „${N.docs[bad].title}“ zeigt das nicht.`, short: "ein Beleg trägt nicht" };
    if (!q.evidence.sets.some((s) => s.every((x) => ev.includes(x)))) return { ok: false, text: q.missingEvidence, short: "Beweiskette unvollständig" };
    return { ok: true, text: q.finding };
  }
  function submit() {
    const q = Q(openQ), r = evaluate(q, draftOf(openQ));
    if (!r.ok) {
      local.fails = local.fails || {}; local.fails[q.id] = (local.fails[q.id] || 0) + 1; saveLocal();
      A.play("error");
      saveDraft({ result: { ...r, by: me(), at: Date.now() } }, true);
      const box = $("#tModal .tm-box"); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
      return;
    }
    saveDraft({ result: { ok: true, text: r.text, by: me(), at: Date.now() } });
    known.add(q.id);
    A.play("stamp");
    const completesRoom = E.solveQuestion(q.id); // schließt der Bereich ab, übernimmt das Erfolgsfenster der Engine
    if (!completesRoom) showSolved(q, true);
    render();
  }
  function showSolved(q, mine) {
    const next = QS().filter((x) => x.hiddenUntil === q.id), field = q.field && CASE.fields.find((f) => f.id === q.field);
    A.play("success");
    modal(`<div class="t-solved"><div class="t-mark">✓</div><p class="t-kicker">${mine ? "ERKENNTNIS GESICHERT" : "DEIN TEAM HAT EINE ERKENNTNIS GESICHERT"}</p><h3>${esc(q.title)}</h3><p>${esc(q.finding)}</p>
      ${field ? `<p class="t-unlock">Fallstand: <b>${esc(field.label)}</b> belegt.</p>` : ""}${next.map((x) => `<p class="t-unlock">Neue Frage: <b>${esc(x.title)}</b></p>`).join("")}${q.thread ? `<p class="t-unlock">Hagedorns Faden an der Wand: ${q.refutes ? "widerlegt" : "bestätigt"}.</p>` : ""}
      <button class="t-btn gold" data-close-modal>Weiter ermitteln</button></div>`, "q");
  }

  /* ---------- Beweise ---------- */
  let filter = "alle", compare = null;
  function renderArchive() {
    const items = archive(), places = ["alle", ...new Set(items.map(placeOf))];
    $("#pane-beweise").innerHTML = `<div class="t-filters">${places.map((p) => `<button class="${filter === p ? "on" : ""}" data-filter="${esc(p)}">${esc(p === "alle" ? "Alle" : p)}</button>`).join("")}<button class="cmp ${compare ? "on" : ""}" data-compare>⇆ Vergleichen</button></div>
      ${compare ? `<p class="t-sub">Tippe zwei Dokumente an, um sie nebeneinander zu sehen. (${compare.length} / 2)</p>` : ""}
      <div class="t-docs">${items.filter((id) => filter === "alle" || placeOf(id) === filter).map((id) => `<button class="t-doc ${compare && compare.includes(id) ? "sel" : ""}" data-doc="${id}"><b>${esc(N.docs[id].title)}</b><small>${esc(placeOf(id))}</small></button>`).join("") || `<p class="t-empty">Noch nichts gefunden.</p>`}</div>`;
  }
  $("#pane-beweise").addEventListener("click", (e) => {
    const f = e.target.closest("[data-filter]"); if (f) { filter = f.dataset.filter; return renderArchive(); }
    if (e.target.closest("[data-compare]")) { compare = compare ? null : []; return renderArchive(); }
    const d = e.target.closest("[data-doc]"); if (!d) return;
    const id = d.dataset.doc;
    if (compare) {
      if (compare.includes(id)) compare = compare.filter((x) => x !== id); else compare.push(id);
      if (compare.length === 2) { const [x, y] = compare; compare = null; renderArchive(); return modal(`<div class="t-compare"><div><p class="t-kicker">${esc(N.docs[x].title)}</p>${docHtml(x)}</div><div><p class="t-kicker">${esc(N.docs[y].title)}</p>${docHtml(y)}</div></div>`, "wide"); }
      return renderArchive();
    }
    A.play("paper");
    modal(`<p class="t-kicker">BEWEISARCHIV · ${esc(placeOf(id).toUpperCase())}</p><h3>${esc(N.docs[id].title)}</h3>${docHtml(id)}`, "doc");
  });

  /* ---------- Personen ---------- */
  function renderPersons() {
    $("#pane-personen").innerHTML = `<div class="t-persons">${Object.entries(CASE.persons).map(([id, p]) => { const n = p.checks.filter((c) => solved(c.q)).length;
      return `<button class="t-person" data-person="${id}"><span class="t-avatar">${esc(p.name.split(" ").map((w) => w[0]).join(""))}</span><span><b>${esc(p.name)}</b><small>${esc(p.role)}</small>${p.suspicion ? `<em class="sus">${esc(p.suspicion)}</em>` : ""}${n ? `<em class="chk">${n} Punkt${n > 1 ? "e" : ""} geprüft</em>` : ""}</span></button>`; }).join("")}</div>`;
  }
  $("#pane-personen").addEventListener("click", (e) => {
    const b = e.target.closest("[data-person]"); if (!b) return;
    const p = CASE.persons[b.dataset.person], hasDoc = p.doc && archive().includes(p.doc);
    modal(`<p class="t-kicker">PERSONENAKTE</p><h3>${esc(p.name)}</h3><p class="t-lead">${esc(p.role)} · ${esc(p.rel)}</p>
      ${p.suspicion ? `<p class="t-sus">Hagedorns Verdacht: ${esc(p.suspicion)}</p>` : ""}
      <h4>Geprüft</h4><ul class="t-checks">${p.checks.length ? p.checks.map((c) => (solved(c.q) ? `<li class="ok">✓ ${esc(c.text)}</li>` : `<li>○ ${c.q ? "noch offen" : esc(c.text)}</li>`)).join("") : "<li>–</li>"}</ul>
      ${p.doc ? `<h4>Aussage</h4>${hasDoc ? docHtml(p.doc) : `<p class="t-sub">Hagedorns Vernehmungsprotokoll hast du noch nicht gefunden.</p>`}` : ""}`, "doc");
  });

  /* ---------- Zeitleiste ---------- */
  let tlSel = [];
  const CLOCK = { server: "Serverzeit · Funkuhr", foyer: "⏱ Foyeruhr", est: "Aussage / Notiz" };
  function tlEntries() {
    const have = new Set(archive());
    return CASE.timeline.filter((x) => (!x.onlyIf || solved(x.onlyIf)) && (!x.doc || have.has(x.doc)))
      .map((x) => ({ ...x, text: x.textIfDoc && have.has(x.textIfDoc.doc) ? x.textIfDoc.text : x.text }))
      .sort((a, b) => (a.sort || a.t).localeCompare(b.sort || b.t));
  }
  function renderTimeline() {
    const list = tlEntries(), foyerKnown = archive().includes("uhrzettel");
    $("#pane-zeit").innerHTML = `<p class="t-kicker">MONTAG, 9. NOVEMBER 2026 · TATABEND</p>
      <div class="t-legend"><span class="server">Serverzeit</span><span class="foyer">Foyeruhr${foyerKnown ? " (geht 6 Min. vor)" : ""}</span><span class="est">Aussage / Notiz</span></div>
      ${list.length ? `<ol class="t-tl">${list.map((x) => `<li class="c-${x.clock}${x.strikeIf && solved(x.strikeIf) ? " struck" : ""}${x.fixed ? " fixed" : ""}${tlSel.includes(x.id) ? " sel" : ""}" data-tl="${x.id}"><time>${esc(x.t)}</time><span>${esc(x.text)}<small>${esc(x.doc ? N.docs[x.doc].title : "deine Korrektur")} · ${esc(CLOCK[x.clock])}</small></span></li>`).join("")}</ol>` : `<p class="t-empty">Noch keine Einträge. Zeiten aus gefundenen Dokumenten erscheinen hier von selbst.</p>`}
      <div class="t-tlbar ${tlSel.length ? "show" : ""}"><span>${tlSel.length === 2 ? "Zwei Einträge gewählt." : "Noch einen Eintrag antippen."}</span><button class="t-btn small" data-tlclear>Abwählen</button><button class="t-btn small gold" data-contra ${tlSel.length === 2 ? "" : "disabled"}>Widerspruch melden</button></div>`;
  }
  $("#pane-zeit").addEventListener("click", (e) => {
    const li = e.target.closest("[data-tl]");
    if (li) { const id = li.dataset.tl; tlSel = tlSel.includes(id) ? tlSel.filter((x) => x !== id) : [...tlSel.slice(-1), id]; return renderTimeline(); }
    if (e.target.closest("[data-tlclear]")) { tlSel = []; return renderTimeline(); }
    if (!e.target.closest("[data-contra]")) return;
    const c = CASE.contradictions.find((x) => x.pair.every((p) => tlSel.includes(p)));
    tlSel = []; renderTimeline();
    if (!c) return toast("Das passt zusammen – kein Widerspruch.");
    const q = Q(c.q), visible = q && visibleQuestions().includes(q);
    modal(`<p class="t-kicker">WIDERSPRUCH</p><p class="t-lead">${esc(c.text)}</p>${solved(c.q) ? `<div class="t-result good">Bereits geklärt: ${esc(q.finding)}</div>` : visible ? `<button class="t-btn gold" data-openq="${c.q}">Frage öffnen: ${esc(q.title)}</button>` : `<p class="t-sub">Das lässt sich erst klären, wenn eine andere Frage beantwortet ist.</p>`}`, "q")
      .addEventListener("click", (ev) => { const b = ev.target.closest("[data-openq]"); if (b) openQuestion(b.dataset.openq); });
  });

  /* ---------- Wand ---------- */
  const TEMPLATE = { cards: window.DLF_WALL.cards.concat([{ id: "n-vorhang", type: "note", x: 1220, y: 1160, rot: 3, author: "hagedorn", color: "#f3e58a", text: "Wenn du den letzten Vorhang siehst …" }]), threads: window.DLF_WALL.threads };
  const threadQ = (tid) => CASE.threads[tid] ? Q(CASE.threads[tid]) : null;
  function decorate(o) {
    if (o.type === "thread") { const q = threadQ(o.id); if (!q || !solved(q.id)) return null; return q.refutes ? { cls: "refuted", tag: "✕ widerlegt" } : { cls: "confirmed", color: "green", tag: "✓ bestätigt" }; }
    const tid = Object.keys(CASE.threads).find((k) => { const t = window.DLF_WALL.threads.find((x) => x.id === k); return t && t.from === o.id && threadQ(k) && threadQ(k).refutes; });
    if (tid && solved(CASE.threads[tid])) return { cls: "cleared", stamp: "ENTLASTET" };
    return null;
  }
  function threadMenu(t) {
    if (!(t.id in CASE.threads)) return null;
    const q = threadQ(t.id);
    if (!q) return { title: "Hagedorns Verdacht", note: "Dieser Faden wird in einem späteren Kapitel geprüft.", actions: [] };
    if (solved(q.id)) return { title: q.refutes ? "Widerlegt" : "Bestätigt", note: q.finding, actions: [] };
    if (!visibleQuestions().includes(q)) return { title: "Hagedorns Verdacht", note: "Dazu fehlen dir noch Unterlagen. Untersuche die Orte.", actions: [] };
    return { title: "Hagedorns Faden", note: "Dazu gibt es eine offene Frage.", actions: [{ id: q.id, label: "Frage öffnen", primary: true }] };
  }
  function mountBoard() {
    if (!E.has("wand_foto")) { $("#tBoard").innerHTML = `<p class="t-empty t-wallhint">Hagedorns Wand hängt in seinem Büro. Fotografiere sie mit dem Tablet, dann arbeitest du hier weiter.</p>`; board = null; return; }
    if (board) { board.redraw(); return; }
    $("#tBoard").innerHTML = "";
    board = MRBoard.mount({ el: $("#tBoard"), template: TEMPLATE, store: boardStore,
      onOpen: (c) => modal(`<h3>${esc(c.title)}</h3>${N.docs[c.id] ? docHtml(c.id) : c.body || ""}`, "doc"),
      decorate, threadMenu, locked: (o) => o.type === "thread" && o.author === "hagedorn", onThreadAction: (t, qid) => openQuestion(qid) });
  }

  /* ---------- Öffnen, Schließen, Knopf ---------- */
  function open(qid = null) {
    if (!E.has("taken_b1_tablet")) return;
    ensureStores();
    E.closePanels();
    $("#tablet").hidden = false; document.body.classList.add("wall-open");
    A.play("click");
    seenDocs = new Set(archive()); try { localStorage.setItem("dlf_v2_seen:" + E.saveKey(), JSON.stringify([...seenDocs])); } catch (e) { /* privat */ }
    setTab(qid ? "fall" : tab);
    if (qid) openQuestion(qid);
    renderButton();
  }
  function close() { closeModal(); $("#tablet").hidden = true; document.body.classList.remove("wall-open"); }
  $("#tClose").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen() && !document.querySelector("dialog[open]")) { if (!$("#tModal").hidden) closeModal(); else close(); } });
  $("#tabletButton").addEventListener("click", () => open());

  let seenDocs = new Set(), known = new Set(), ready = false;
  function renderButton() {
    const on = E.has("taken_b1_tablet");
    $("#tabletButton").classList.toggle("hidden", !on);
    const fresh = on && archive().some((id) => !seenDocs.has(id));
    $("#tabletBadge").classList.toggle("hidden", !fresh);
  }
  N.onRender = () => {
    if (!E.inGame()) return;
    ensureStores();
    if (!ready) { try { seenDocs = new Set(JSON.parse(localStorage.getItem("dlf_v2_seen:" + E.saveKey()) || "[]")); } catch (e) { /* privat */ } known = new Set(QS().filter((q) => solved(q.id)).map((q) => q.id)); ready = true; }
    // Fragen, die das Team gelöst hat, während dieses Gerät die Frage offen hatte
    for (const q of QS()) if (solved(q.id) && !known.has(q.id)) { known.add(q.id); if (isOpen() && openQ === q.id) showSolved(q, false); }
    renderButton();
    if (isOpen()) { render(); if (board) board.redraw(); }
  };
  N.tablet = { open, close, isOpen, get state() { return state; }, evaluate: (qid, d) => evaluate(Q(qid), d) };
})();
