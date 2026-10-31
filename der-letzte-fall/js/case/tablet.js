/*
 * DER LETZTE FALL – Ermittlungs-Tablet (Prototyp)
 * Reiter: Fall · Beweise · Personen · Zeitleiste · Wand. Fragen werden mit Antwort + Belegen
 * eingereicht und nach ERMITTLUNGSDESIGN.md, Abschnitt 3.3 geprüft.
 * Spielstand: allein im Browser, gemeinsam als „inv:“-Einträge (Fragen, Entwürfe, Untersuchungen)
 * und „board:“-Einträge (Wand) der Sitzung – je Eintrag gewinnt der letzte Schreiber.
 */
(() => {
  "use strict";
  const N = window.MRGAME, CASE = N.case;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL = { inv: "dlf_inv:kapitel2", board: "dlf_inv_board:kapitel2", local: "dlf_inv_local:kapitel2" };
  const Q = Object.fromEntries(CASE.questions.map((q) => [q.id, q]));

  /* ---------- Spielstand ---------- */
  let client = null, shared = false, invStore = null, state = {}, board = null, boardStore = null;
  let local = {}; // nur dieses Gerät: Hinweise, Fehlversuche, Reiter
  try { local = JSON.parse(localStorage.getItem(LOCAL.local) || "{}"); } catch (e) { local = {}; }
  const saveLocal = () => { try { localStorage.setItem(LOCAL.local, JSON.stringify(local)); } catch (e) { /* privat */ } };
  const solved = (qid) => Boolean((qid && Q[qid] && Q[qid].solvedAtStart) || (state[qid] && state[qid].solved));
  const found = (xid) => Boolean(state[xid] && state[xid].done);
  const draftOf = (qid) => state["draft:" + qid] || { id: "draft:" + qid, answer: null, evidence: [] };
  const me = () => (client && client.user ? client.user.id : null);
  const who = (uid) => (shared && client && uid ? client.playerName(uid) : "") || "";
  function put(obj) { state[obj.id] = obj; invStore.put(obj); }

  const inArchive = () => CASE.archive.filter((a) => (!a.ifFound || found(a.ifFound)) && (!a.ifSolved || solved(a.ifSolved)) && N.docs[a.id]);
  const visibleQuestions = () => CASE.questions.filter((q) => !q.solvedAtStart && (!q.hiddenUntil || solved(q.hiddenUntil)));

  /* ---------- Dokumente ---------- */
  const paper = (kind, html) => `<article class="paper paper-${kind}">${html}</article>`;
  function docHtml(id) {
    const d = N.docs[id];
    if (!d.pages) return paper(d.kind, d.html);
    return d.pages.map((h, i) => `${d.pageLabels ? `<p class="page-label">${esc(d.pageLabels[i])}</p>` : ""}${paper(d.kind, h)}`).join("");
  }

  /* ---------- Rahmen ---------- */
  const toast = (t, ms = 3200) => { const el = $("#tToast"); el.innerHTML = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), ms); };
  const modal = (html, cls = "") => { const m = $("#tModal"); m.innerHTML = `<div class="tm-box ${cls}"><button class="tm-x" data-close-modal aria-label="Schließen">×</button>${html}</div>`; m.hidden = false; return $(".tm-box", m); };
  const closeModal = () => { $("#tModal").hidden = true; $("#tModal").innerHTML = ""; openQ = null; };
  $("#tModal").addEventListener("click", (e) => { if (e.target.id === "tModal" || e.target.closest("[data-close-modal]")) closeModal(); });

  let tab = local.tab || "fall";
  function setTab(t) {
    tab = t; local.tab = t; saveLocal();
    $$("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
    $$(".t-pane").forEach((p) => { p.hidden = p.id !== "pane-" + t; });
    render();
    if (t === "wand") mountBoard();
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) setTab(b.dataset.tab); });

  function render() {
    const open = visibleQuestions().filter((q) => !solved(q.id)).length;
    $("#badgeFall").textContent = open || ""; $("#badgeFall").hidden = !open;
    if (tab === "fall") renderFall();
    if (tab === "beweise") renderArchive();
    if (tab === "personen") renderPersons();
    if (tab === "zeit") renderTimeline();
    if (tab === "wand" && board) board.redraw();
  }

  /* ---------- Reiter: Fall ---------- */
  function renderFall() {
    const fieldQ = (f) => CASE.questions.find((q) => q.field === f.id);
    const fields = CASE.fields.map((f) => { const q = fieldQ(f), ok = q && solved(q.id);
      return `<div class="t-field ${ok ? "ok" : ""}"><b>${esc(f.label)}</b><span>${ok ? esc(q.fieldText || "belegt") : esc(f.open)}</span><i>${ok ? "✓" : "offen"}</i></div>`; }).join("");
    const qs = visibleQuestions();
    const openQs = qs.filter((q) => !solved(q.id)), doneQs = CASE.questions.filter((q) => solved(q.id));
    $("#pane-fall").innerHTML = `<p class="t-kicker">FALLSTAND · TÄTER UNBEKANNT</p><div class="t-fields">${fields}</div>
      <h3 class="t-h">Offene Fragen</h3>${openQs.length ? openQs.map((q) => { const d = draftOf(q.id); const r = d.result;
        return `<button class="t-q" data-q="${q.id}"><span>${esc(q.title)}</span><small>${r && !r.ok ? `Zuletzt: ${esc(r.short || "nicht schlüssig")}${who(r.by) ? " · " + esc(who(r.by)) : ""}` : d.answer || (d.evidence || []).length ? "Entwurf begonnen" : "noch nicht bearbeitet"}</small><em>›</em></button>`; }).join("") : `<p class="t-empty">Für dieses Kapitel ist alles geklärt.</p>`}
      <h3 class="t-h">Erkenntnisse</h3><ol class="t-findings">${doneQs.map((q) => `<li><b>${esc(q.title)}</b><p>${esc(q.finding)}</p>${state[q.id] && who(state[q.id].by) ? `<small>gesichert von ${esc(who(state[q.id].by))}</small>` : ""}</li>`).join("")}</ol>`;
  }
  $("#pane-fall").addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) openQuestion(b.dataset.q); });

  /* ---------- Fragen: Entwurf, Einreichen, Prüfen ---------- */
  let openQ = null;
  const PERSONS = () => Object.entries(CASE.persons);
  function answerLabel(q, v) {
    if (v == null || v === "") return "";
    if (q.answer.type === "time") return `${String(v).slice(0, 2)}:${String(v).slice(2)}`;
    if (q.answer.type === "person") return CASE.persons[v] ? CASE.persons[v].name : v;
    if (q.answer.type === "claim") { const o = q.answer.options.find((x) => x.id === v); return o ? o.text : v; }
    return v;
  }
  function openQuestion(qid) {
    const q = Q[qid]; if (!q) return;
    openQ = qid;
    if (solved(qid)) { modal(`<p class="t-kicker">ERKENNTNIS</p><h3>${esc(q.title)}</h3><div class="t-result good">${esc(q.finding)}</div>`, "q"); return; }
    renderQuestion();
  }
  function renderQuestion(keepScroll = false) {
    const q = Q[openQ]; if (!q || solved(q.id)) return; // gelöst: das Fenster zeigt die Erkenntnis
    const d = draftOf(q.id), box = $("#tModal .tm-box"), y = keepScroll && box ? box.scrollTop : 0;
    const a = q.answer;
    let input = "";
    if (a.type === "time") input = `<div class="t-time"><input id="qTime" inputmode="numeric" maxlength="5" placeholder="hh:mm" value="${esc(answerLabel(q, d.answer))}" autocomplete="off"><span class="t-sub">Uhrzeit, z. B. 21:15</span></div>`;
    if (a.type === "person") input = `<div class="t-opts persons">${PERSONS().map(([id, p]) => `<label class="t-opt ${d.answer === id ? "on" : ""}"><input type="radio" name="qa" value="${id}" ${d.answer === id ? "checked" : ""}><span><b>${esc(p.name)}</b><small>${esc(p.role)}</small></span></label>`).join("")}</div>`;
    if (a.type === "claim") input = `<div class="t-opts">${a.options.map((o) => `<label class="t-opt ${d.answer === o.id ? "on" : ""}"><input type="radio" name="qa" value="${o.id}" ${d.answer === o.id ? "checked" : ""}><span>${esc(o.text)}</span></label>`).join("")}</div>`;
    const ev = (d.evidence || []).filter((x) => N.docs[x]);
    const r = d.result;
    const hints = local.hints && local.hints[q.id] || 0, fails = (local.fails && local.fails[q.id]) || 0;
    const b = modal(`<p class="t-kicker">${esc(CASE.title)} · OFFENE FRAGE</p><h3>${esc(q.title)}</h3>
      <p class="t-step">1 · Deine Antwort</p>${input}
      <p class="t-step">2 · Deine Belege <span class="t-sub">(mindestens ${q.evidence.need})</span></p>
      <div class="t-chips">${ev.map((x) => `<span class="t-chip">${esc(N.docs[x].title)}<button data-unpick="${x}" aria-label="Beleg entfernen">×</button></span>`).join("")}<button class="t-add" data-pickev>+ Beleg aus dem Archiv</button></div>
      ${r ? `<div class="t-result ${r.ok ? "good" : "bad"}">${esc(r.text)}${who(r.by) && r.by !== me() ? `<small>eingereicht von ${esc(who(r.by))}</small>` : ""}</div>` : ""}
      ${d.by && d.by !== me() && who(d.by) ? `<p class="t-sub">${esc(who(d.by))} hat zuletzt an diesem Entwurf gearbeitet.</p>` : ""}
      <button class="t-btn gold" data-submit>Schlussfolgerung einreichen</button>
      ${fails >= 3 && hints < 1 ? `<p class="t-sub nudge">Du hängst hier fest? Unten gibt es Hinweise.</p>` : ""}
      <details class="t-hints" ${hints ? "open" : ""}><summary>Hinweise</summary>${q.hints.map((h, i) => i < hints ? `<p><b>${i + 1}${i === 2 ? " · Lösung" : ""}</b> ${esc(h)}</p>` : "").join("")}${hints < q.hints.length ? `<button class="t-btn small" data-hint>${hints === q.hints.length - 1 ? "Lösung aufdecken" : `Hinweis ${hints + 1} aufdecken`}</button>` : ""}</details>`, "q");
    b.scrollTop = y;
    const time = $("#qTime", b);
    if (time) time.addEventListener("change", () => saveDraft({ answer: time.value.replace(/\D/g, "").slice(0, 4) || null }));
    $$('input[name="qa"]', b).forEach((i) => i.addEventListener("change", () => saveDraft({ answer: i.value }, true)));
    b.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-pickev]")) return pickEvidence();
      const un = t.closest("[data-unpick]"); if (un) return saveDraft({ evidence: draftOf(openQ).evidence.filter((x) => x !== un.dataset.unpick) }, true);
      if (t.closest("[data-submit]")) { if (time) saveDraft({ answer: time.value.replace(/\D/g, "").slice(0, 4) || null }); return submit(); }
      if (t.closest("[data-hint]")) { local.hints = local.hints || {}; local.hints[openQ] = hints + 1; saveLocal(); renderQuestion(true); }
    });
  }
  function saveDraft(patch, rerender = false) {
    const d = { ...draftOf(openQ), ...patch, id: "draft:" + openQ, by: me(), result: patch.result !== undefined ? patch.result : null };
    put(d);
    if (rerender) renderQuestion(true);
  }
  function pickEvidence() {
    const d = draftOf(openQ), sel = new Set(d.evidence || []);
    const b = modal(`<p class="t-kicker">BELEGE AUSWÄHLEN</p><h3>${esc(Q[openQ].title)}</h3><div class="t-picklist">${inArchive().map((a) => `<label class="t-opt ${sel.has(a.id) ? "on" : ""}"><input type="checkbox" value="${a.id}" ${sel.has(a.id) ? "checked" : ""}><span><b>${esc(N.docs[a.id].title)}</b><small>${esc(a.place)}</small></span></label>`).join("")}</div><button class="t-btn gold" data-pickdone>Übernehmen</button>`, "q");
    const qid = openQ;
    b.addEventListener("change", (e) => { const i = e.target; if (i.type === "checkbox") { if (i.checked) sel.add(i.value); else sel.delete(i.value); i.closest(".t-opt").classList.toggle("on", i.checked); } });
    b.addEventListener("click", (e) => { if (e.target.closest("[data-pickdone]")) { openQ = qid; saveDraft({ evidence: [...sel] }); renderQuestion(); } });
    openQ = qid;
  }

  /** Prüfung in der Reihenfolge aus ERMITTLUNGSDESIGN.md 3.3 – meldet die erste Schwachstelle. */
  function evaluate(q, d) {
    const a = q.answer, val = d.answer;
    if (!val) return { ok: false, text: "Wähle zuerst eine Antwort.", short: "keine Antwort" };
    if (!a.accept.includes(val)) return { ok: false, text: (q.wrongAnswer && q.wrongAnswer[val]) || "Das passt nicht zu dem, was die Belege zeigen.", short: "Antwort passt nicht" };
    const ev = (d.evidence || []).filter((x) => N.docs[x]);
    if (ev.length < q.evidence.need) return { ok: false, text: q.missingEvidence, short: "Belege fehlen" };
    const valid = new Set(q.evidence.sets.flat());
    const bad = ev.find((x) => !valid.has(x));
    if (bad) return { ok: false, text: (q.wrongEvidence && q.wrongEvidence[bad]) || `Die Antwort stimmt. Aber „${N.docs[bad].title}“ zeigt das nicht.`, short: "ein Beleg trägt nicht" };
    if (!q.evidence.sets.some((s) => s.every((x) => ev.includes(x)))) return { ok: false, text: q.missingEvidence, short: "Beweiskette unvollständig" };
    return { ok: true, text: q.finding };
  }
  function submit() {
    const q = Q[openQ], d = draftOf(openQ);
    const r = evaluate(q, d);
    if (!r.ok) {
      local.fails = local.fails || {}; local.fails[q.id] = (local.fails[q.id] || 0) + 1; saveLocal();
      saveDraft({ result: { ...r, by: me(), at: Date.now() } }, true);
      const box = $("#tModal .tm-box"); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
      return;
    }
    put({ id: q.id, solved: true, by: me(), at: Date.now() });
    saveDraft({ result: { ok: true, text: r.text, by: me(), at: Date.now() } });
    showSolved(q, true);
    render();
  }
  function showSolved(q, mine) {
    const next = CASE.questions.filter((x) => x.hiddenUntil === q.id);
    const field = q.field && CASE.fields.find((f) => f.id === q.field);
    modal(`<div class="t-solved"><div class="t-mark">✓</div><p class="t-kicker">${mine ? "ERKENNTNIS GESICHERT" : `GESICHERT VON ${esc(who(state[q.id] && state[q.id].by) || "DEINEM TEAM").toUpperCase()}`}</p><h3>${esc(q.title)}</h3><p>${esc(q.finding)}</p>
      ${field ? `<p class="t-unlock">Fallstand: <b>${esc(field.label)}</b> belegt.</p>` : ""}${next.map((x) => `<p class="t-unlock">Neue Frage: <b>${esc(x.title)}</b></p>`).join("")}${q.thread ? `<p class="t-unlock">Hagedorns Faden an der Wand ist jetzt grün.</p>` : ""}
      <button class="t-btn gold" data-close-modal>Weiter ermitteln</button></div>`, "q");
  }

  /* ---------- Reiter: Beweise ---------- */
  let filter = "alle", compare = null; // compare: null | [] | [id] | [id, id]
  function renderArchive() {
    const items = inArchive(), places = ["alle", ...new Set(items.map((a) => a.place))];
    $("#pane-beweise").innerHTML = `<div class="t-filters">${places.map((p) => `<button class="${filter === p ? "on" : ""}" data-filter="${esc(p)}">${esc(p === "alle" ? "Alle" : p)}</button>`).join("")}<button class="cmp ${compare ? "on" : ""}" data-compare>⇆ Vergleichen</button></div>
      ${compare ? `<p class="t-sub">Tippe zwei Dokumente an, um sie nebeneinander zu sehen. (${compare.length} / 2)</p>` : ""}
      <div class="t-docs">${items.filter((a) => filter === "alle" || a.place === filter).map((a) => { const act = CASE.actions[a.id]; return `<button class="t-doc ${compare && compare.includes(a.id) ? "sel" : ""}" data-doc="${a.id}"><b>${esc(N.docs[a.id].title)}</b><small>${esc(a.place)}${act && !found(act.id) ? " · noch nicht ganz untersucht" : ""}</small></button>`; }).join("")}</div>`;
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
    openDoc(id);
  });
  function openDoc(id) {
    const act = CASE.actions[id];
    const b = modal(`<p class="t-kicker">BEWEISARCHIV</p><h3>${esc(N.docs[id].title)}</h3>${docHtml(id)}${act && !found(act.id) ? `<button class="t-btn" data-act="${id}">${esc(act.label)}</button>` : ""}`, "doc");
    b.addEventListener("click", (e) => {
      if (!e.target.closest("[data-act]")) return;
      put({ id: act.id, done: true, by: me(), at: Date.now() });
      modal(`<p class="t-kicker">UNTERSUCHUNG</p><h3>${esc(N.docs[act.gives].title)}</h3><p class="t-lead">${esc(act.text)}</p>${docHtml(act.gives)}<p class="t-unlock">Neu im Beweisarchiv.</p>`, "doc");
      render();
    });
  }

  /* ---------- Reiter: Personen ---------- */
  function renderPersons() {
    $("#pane-personen").innerHTML = `<div class="t-persons">${Object.entries(CASE.persons).map(([id, p]) => { const done = p.checks.filter((c) => c.q && solved(c.q)).length;
      return `<button class="t-person" data-person="${id}"><span class="t-avatar">${esc(p.name.split(" ").map((w) => w[0]).join(""))}</span><span><b>${esc(p.name)}</b><small>${esc(p.role)}</small>${p.suspicion ? `<em class="sus">${esc(p.suspicion)}</em>` : ""}${done ? `<em class="chk">${done} Punkt${done > 1 ? "e" : ""} geprüft</em>` : ""}</span></button>`; }).join("")}</div>`;
  }
  $("#pane-personen").addEventListener("click", (e) => {
    const b = e.target.closest("[data-person]"); if (!b) return;
    const p = CASE.persons[b.dataset.person];
    const m = modal(`<p class="t-kicker">PERSONENAKTE</p><h3>${esc(p.name)}</h3><p class="t-lead">${esc(p.role)} · ${esc(p.rel)}</p>
      ${p.suspicion ? `<p class="t-sus">Hagedorns Verdacht: ${esc(p.suspicion)}</p>` : ""}
      <h4>Geprüft</h4><ul class="t-checks">${p.checks.length ? p.checks.map((c) => { const ok = c.q && solved(c.q); return `<li class="${ok ? "ok" : ""}">${ok ? "✓ " + esc(c.text) : c.q ? "○ noch offen" : "○ " + esc(c.text)}</li>`; }).join("") : "<li>–</li>"}</ul>
      ${p.doc ? `<h4>Aussage</h4>${docHtml(p.doc)}` : ""}`, "doc");
    void m;
  });

  /* ---------- Reiter: Zeitleiste ---------- */
  let tlSel = [];
  const CLOCK = { server: "Serverzeit · Funkuhr", foyer: "⏱ Foyeruhr", est: "Aussage / geschätzt" };
  function tlEntries() {
    return CASE.timeline.filter((x) => (!x.onlyIf || solved(x.onlyIf)) && (!x.doc || inArchive().some((a) => a.id === x.doc)))
      .map((x) => ({ ...x, text: x.textIf && found(x.textIf.q) ? x.textIf.text : x.text }))
      .sort((a, b) => (a.sort || a.t).localeCompare(b.sort || b.t));
  }
  function renderTimeline() {
    const foyerKnown = inArchive().some((a) => a.id === "uhrzettel");
    $("#pane-zeit").innerHTML = `<p class="t-kicker">MONTAG, 9. NOVEMBER 2026 · TATABEND</p>
      <div class="t-legend"><span class="server">Serverzeit</span><span class="foyer">Foyeruhr${foyerKnown ? " (geht 6 Min. vor)" : ""}</span><span class="est">Aussage / geschätzt</span></div>
      <ol class="t-tl">${tlEntries().map((x) => `<li class="c-${x.clock}${x.strikeIf && solved(x.strikeIf) ? " struck" : ""}${x.fixed ? " fixed" : ""}${tlSel.includes(x.id) ? " sel" : ""}" data-tl="${x.id}"><time>${esc(x.t)}</time><span>${esc(x.text)}<small>${esc(x.doc ? N.docs[x.doc].title : "deine Korrektur")} · ${esc(CLOCK[x.clock])}</small></span></li>`).join("")}</ol>
      <div class="t-tlbar ${tlSel.length ? "show" : ""}"><span>${tlSel.length === 2 ? "Zwei Einträge gewählt." : tlSel.length === 1 ? "Noch einen Eintrag antippen." : ""}</span><button class="t-btn small" data-tlclear>Abwählen</button><button class="t-btn small gold" data-contra ${tlSel.length === 2 ? "" : "disabled"}>Widerspruch melden</button></div>`;
  }
  $("#pane-zeit").addEventListener("click", (e) => {
    const li = e.target.closest("[data-tl]");
    if (li) { const id = li.dataset.tl; tlSel = tlSel.includes(id) ? tlSel.filter((x) => x !== id) : [...tlSel.slice(-1), id]; return renderTimeline(); }
    if (e.target.closest("[data-tlclear]")) { tlSel = []; return renderTimeline(); }
    if (e.target.closest("[data-contra]")) {
      const c = CASE.contradictions.find((x) => x.pair.every((p) => tlSel.includes(p)));
      tlSel = []; renderTimeline();
      if (!c) return toast("Das passt zusammen – kein Widerspruch.");
      const q = Q[c.q], visible = visibleQuestions().includes(q);
      modal(`<p class="t-kicker">WIDERSPRUCH</p><p class="t-lead">${esc(c.text)}</p>${solved(c.q) ? `<div class="t-result good">Bereits geklärt: ${esc(q.finding)}</div>` : visible ? `<button class="t-btn gold" data-openq="${c.q}">Frage öffnen: ${esc(q.title)}</button>` : `<p class="t-sub">Das lässt sich erst klären, wenn eine andere Frage beantwortet ist.</p>`}`, "q")
        .addEventListener("click", (ev) => { const b = ev.target.closest("[data-openq]"); if (b) openQuestion(b.dataset.openq); });
    }
  });

  /* ---------- Reiter: Wand ---------- */
  function decorate(o) {
    if (o.type !== "thread") return null;
    const qid = CASE.threads[o.id];
    if (qid && solved(qid)) return { cls: "confirmed", color: "green", tag: "✓ bestätigt" };
    return null;
  }
  function threadMenu(t) {
    if (!(t.id in CASE.threads)) return null;
    const qid = CASE.threads[t.id];
    if (!qid) return { title: "Hagedorns Verdacht", note: "Dieser Faden wird in einem späteren Kapitel geprüft.", actions: [] };
    if (solved(qid)) return { title: "Bestätigt", note: Q[qid].finding, actions: [] };
    return { title: "Hagedorns Frage", note: "Dazu gibt es eine offene Frage.", actions: [{ id: qid, label: "Frage öffnen", primary: true }] };
  }
  function mountBoard() {
    if (board) { board.redraw(); board.fit(); return; }
    board = MRBoard.mount({ el: $("#tBoard"), template: window.DLF_WALL, store: boardStore, onOpen: (c) => { if (N.docs[c.id]) openDoc(c.id); else modal(`<h3>${esc(c.title)}</h3>${c.body || ""}`, "doc"); },
      decorate, threadMenu, locked: (o) => o.type === "thread" && o.author === "hagedorn", onThreadAction: (t, a) => openQuestion(a) });
  }
  function remountBoard() { board = null; $("#tBoard").innerHTML = ""; if (tab === "wand") mountBoard(); }

  /* ---------- Allein / gemeinsam ---------- */
  function useStores(inv, brd) {
    invStore = inv; boardStore = brd;
    state = { ...inv.load() };
    inv.subscribe((obj) => {
      if (!obj || !obj.id) return;
      const was = state[obj.id] || {};
      state[obj.id] = obj;
      if (obj.solved && !was.solved && Q[obj.id]) { toast(`<b>${esc(who(obj.by) || "Dein Team")}</b> hat eine Erkenntnis gesichert: ${esc(Q[obj.id].title)}`, 5000); if (openQ === obj.id) showSolved(Q[obj.id], false); }
      else if (obj.result && !obj.result.ok && obj.result.by !== me() && (!was.result || was.result.at !== obj.result.at)) toast(`<b>${esc(who(obj.result.by) || "Jemand")}</b> hat eingereicht – nicht schlüssig.`);
      else if (obj.done && !was.done) toast(`<b>${esc(who(obj.by) || "Jemand")}</b> hat etwas untersucht. Neu im Archiv.`);
      if (obj.id.startsWith("draft:") && openQ === obj.id.slice(6) && !$("#tModal").hidden && $("#tModal [data-submit]")) renderQuestion(true);
      render();
    });
    remountBoard(); render();
  }
  function goLocal() { shared = false; useStores(MRBoard.localStore(LOCAL.inv), MRBoard.localStore(LOCAL.board)); renderTeam(); $("#tTeamBtn").classList.remove("live"); }
  async function goShared() {
    await client.fetchStates();
    shared = true;
    useStores(MRBoard.sessionStore(client, "inv:"), MRBoard.sessionStore(client, "board:"));
    renderTeam(); $("#tTeamBtn").classList.add("live");
  }
  const NAME_KEY = "mr_mp_player_name";
  function renderTeam() {
    const s = client && client.session, el = $("#tTeam");
    if (!el) return;
    if (!client) { el.innerHTML = `<p class="t-sub">Gemeinsames Ermitteln ist gerade nicht verfügbar.</p>`; return; }
    if (!s) {
      let name = ""; try { name = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ }
      el.innerHTML = `<label class="t-f"><span>Dein Name</span><input id="tName" maxlength="24" value="${esc(name)}"></label><button class="t-btn gold" id="tCreate">Sitzung erstellen</button>
        <label class="t-f"><span>Einladungscode</span><input id="tCode" maxlength="11" placeholder="FALL-XXXXXX" autocapitalize="characters"></label><button class="t-btn" id="tJoin">Beitreten</button><p class="t-sub" id="tStatus"></p>`;
      return;
    }
    el.innerHTML = `<div class="t-code">${esc(s.room_code)}</div><ul class="t-players">${client.players.map((p) => `<li>${esc(p.player_name)}${p.is_host ? " · Host" : ""}</li>`).join("")}</ul><button class="t-btn" id="tLeave">Sitzung verlassen – allein weiter</button><p class="t-sub" id="tStatus"></p>`;
  }
  $("#tTeamBtn").addEventListener("click", () => { const p = $("#tTeamPanel"); p.hidden = !p.hidden; renderTeam(); });
  $("#tTeamPanel").addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const status = (t) => { const s = $("#tStatus"); if (s) s.textContent = t; };
    try {
      if (b.id === "tCreate" || b.id === "tJoin") {
        const name = ($("#tName").value || "").trim(); if (!name) return status("Bitte zuerst einen Namen eingeben.");
        try { localStorage.setItem(NAME_KEY, name); } catch (x) { /* privat */ }
        status("Verbinde …");
        if (b.id === "tCreate") await client.create(name); else await client.join(($("#tCode").value || "").trim().toUpperCase(), name);
        await goShared(); status("Verbunden – ihr ermittelt jetzt gemeinsam.");
      }
      if (b.id === "tLeave") { await client.leave(); goLocal(); }
    } catch (err) { status(err.message || String(err)); }
  });

  /* ---------- Start ---------- */
  try {
    client = MRMultiplayer.connect({ gameSlug: "der-letzte-fall", maxPlayers: 4, storeKey: "mr_mp_session_v1:dlf-ermittlung-prototyp" });
    client.on("players", renderTeam);
    client.on("lost", () => { goLocal(); toast("Die gemeinsame Sitzung wurde beendet."); });
  } catch (e) { client = null; }
  $("#tTitle").textContent = CASE.title; $("#tSub").textContent = CASE.subtitle;
  goLocal(); setTab(tab);
  if (client) client.restore().then((s) => { if (s) return goShared(); }).catch(() => {});
  $("#tReset").addEventListener("click", () => {
    if (shared) return toast("In einer gemeinsamen Sitzung wird nichts zurückgesetzt.");
    if (!confirm("Prototyp-Stand löschen und von vorn beginnen?")) return;
    Object.values(LOCAL).forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* privat */ } });
    local = {}; goLocal(); setTab("fall");
  });
  window.DLF_INV = { get state() { return state; }, get client() { return client; }, get board() { return board; }, evaluate: (qid, d) => evaluate(Q[qid], d) };
})();
