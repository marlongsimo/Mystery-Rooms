/*
 * DEADLINE.exe – die Anwendungen
 *
 * Datei-Explorer, Schloss-Dialog, Textansicht, Tabelle, Kalender, Audio-Player (Morse),
 * Bildbetrachter (Zoom, Details), Mail, Messenger, Browser (Intranet, IT-Hilfe,
 * Audit-Portal mit Widerspruch), Terminal, DEADLINE.exe und Hinweise.
 *
 * Jede App: { title(arg), icon(arg)?, w, h, cls?, render(win), onChange(win)?, opened(win)? }
 */
window.DL = window.DL || {};
(() => {
  "use strict";
  const G = DL.game, ST = DL.story, snd = DL.sound, esc = DL.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const os = () => DL.os;
  const N = ST.nodes;

  /* ================= Datei-Explorer ================= */
  const PLACES = ["docs", "pics", "audio", "downloads", "trash", "temp", "evidence"];
  const TYPES = { folder: "Ordner", txt: "Textdokument", csv: "CSV-Tabelle", wav: "Audiodatei", jpg: "Bild", ics: "Kalender", report: "Bericht" };
  function pathOf(id) { const p = []; let c = id; while (c) { p.unshift(c); c = N[c].parent; } return p; }
  const explorer = {
    title: (arg) => (N[arg] ? N[arg].name : "Explorer"), icon: (arg) => (arg === "trash" ? "trash" : arg === "pics" ? "pics" : "docs"), w: 640, h: 420,
    render(w) {
      const cur = w.state.cur || w.arg;
      const kids = G.children(cur);
      w.body.innerHTML = `<div class="ex">
        <nav class="ex-side">${PLACES.filter((p) => G.visible(p)).map((p) => `<button class="ex-place${pathOf(cur)[0] === p ? " on" : ""}" data-place="${p}">${DL.icon(DL.nodeIcon(p) === "folder" ? (p === "trash" ? "trash" : "folder") : DL.nodeIcon(p))}<span>${esc(N[p].name)}</span></button>`).join("")}</nav>
        <div class="ex-main">
          <div class="ex-path">${N[cur].parent ? `<button class="ex-up" aria-label="Eine Ebene höher">↑</button>` : ""}<span>${pathOf(cur).map((p) => esc(N[p].name)).join(" › ")}</span></div>
          <div class="ex-head"><span>Name</span><span>Geändert</span><span>Typ</span></div>
          <div class="ex-list" tabindex="-1">${kids.length ? kids.map((id) => {
            const n = N[id], locked = n.lock && !G.unlocked(id);
            return `<button class="ex-row${G.flag("seen_" + id) ? "" : " fresh"}" data-node="${id}"><span class="ex-name">${DL.icon(DL.nodeIcon(id))}<span>${esc(n.name)}</span>${locked ? `<em class="ex-lock">gesperrt</em>` : ""}</span><span>${esc(n.date || "")}</span><span>${TYPES[n.type] || ""}</span></button>`;
          }).join("") : `<p class="ex-empty">Dieser Ordner ist leer.</p>`}</div>
          <p class="ex-status">${kids.length} Element${kids.length === 1 ? "" : "e"}${os().coarse() ? " · antippen zum Öffnen" : " · Doppelklick zum Öffnen"}</p>
        </div></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const pl = e.target.closest("[data-place]"); if (pl) { w.state.cur = pl.dataset.place; os().render(w); return; }
        if (e.target.closest(".ex-up")) { w.state.cur = N[w.state.cur || w.arg].parent; os().render(w); }
      });
      os().activate(w.body, ".ex-row", (t) => {
        const id = t.dataset.node, n = N[id];
        if (n.type === "folder" && G.unlocked(id)) { G.setFlag("seen_" + id); w.state.cur = id; os().render(w); }
        else os().openNode(id);
      });
    },
    onChange(w) { const cur = w.state.cur || w.arg; if (!G.visible(cur)) w.state.cur = w.arg; os().render(w); },
  };

  /* ================= Schloss-Dialog ================= */
  const lock = {
    title: (arg) => "Gesperrt · " + N[arg].name, icon: () => "lock", w: 380, h: 270, cls: "win-small",
    render(w) {
      const L = N[w.arg].lock;
      w.body.innerHTML = `<form class="lockbox"><div class="lock-ico">${DL.icon("lock")}</div><p>${esc(L.prompt)}</p>
        <input class="field code" inputmode="numeric" autocomplete="off" maxlength="${L.digits + 2}" aria-label="Schlüssel" placeholder="${"•".repeat(L.digits)}">
        <button class="btn" type="submit">Öffnen</button><p class="lock-msg" role="alert"></p></form>`;
      const f = $("form", w.body), inp = $("input", f);
      setTimeout(() => inp.focus(), 50);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const r = G.tryLock(w.arg, inp.value);
        if (r.ok) { const id = w.arg; os().close(w); DL.toast({ title: N[id].name + " entsperrt", kind: "ok" }); os().open("explorer", id); }
        else { $(".lock-msg", f).textContent = r.text; snd.play("error"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); inp.select(); }
      });
    },
  };

  /* ================= Textansicht ================= */
  const text = {
    title: (arg) => N[arg].name + " – Editor", icon: (arg) => DL.nodeIcon(arg), w: 560, h: 440,
    render(w) {
      const n = N[w.arg];
      const body = n.type === "report" ? ST.report.replace(/\{([^}]+)\}/g, "$1") : n.text;
      w.body.innerHTML = `<div class="doc"><p class="doc-meta">${esc(n.name)} · ${esc(n.date || "")}</p><pre class="doc-text">${esc(body)}</pre></div>`;
    },
  };

  /* ================= Tabelle (CSV) ================= */
  const table = {
    title: (arg) => N[arg].name, icon: () => "csv", w: 720, h: 460,
    render(w) {
      const T = ST.audit, hl = w.state.hl || (w.state.hl = new Set());
      w.body.innerHTML = `<div class="tbl"><p class="doc-meta">${esc(T.title)}</p><p class="tbl-tip">Tipp: Zeilen anklicken, um sie zu markieren.</p>
        <div class="tbl-scroll"><table><thead><tr>${T.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${T.rows.map((r, i) => `<tr data-i="${i}" class="${hl.has(i) ? "hl" : ""}">${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
    },
    opened(w) { w.body.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-i]"); if (!tr) return; const i = Number(tr.dataset.i); w.state.hl.has(i) ? w.state.hl.delete(i) : w.state.hl.add(i); tr.classList.toggle("hl"); }); },
  };

  /* ================= Kalender ================= */
  const calendar = {
    title: () => "Kalender · Elias Voss", icon: () => "ics", w: 520, h: 470,
    render(w) {
      const days = [];
      ST.calendar.forEach((c) => { let d = days.find((x) => x.day === c.day); if (!d) days.push(d = { day: c.day, items: [] }); d.items.push(c); });
      w.body.innerHTML = `<div class="cal"><p class="doc-meta">kalender.ics · Oktober 2025 · Export 17.10. 23:41</p>${days.map((d) => `<section class="cal-day"><h4>${esc(d.day)}</h4>${d.items.map((c) => `<div class="cal-item${c.cancelled ? " cancelled" : ""}"><b>${esc(c.time)}</b><span><strong>${esc(c.title)}</strong><small>${esc(c.place)}${c.note ? " · " + esc(c.note) : ""}</small></span></div>`).join("")}</section>`).join("")}</div>`;
    },
  };

  /* ================= Audio-Player ================= */
  const TRANSCRIPTS = {
    memo1: "Notiz an mich. Viktor schreibt mir um zwanzig vor neun, ich soll die Finger von #4471 lassen. Der Leiter der IT-Sicherheit persönlich. Wegen eines Exports, den angeblich eine Admin gemacht hat. Warum interessiert ihn so sehr, was ich mir ansehe?",
    memo2: "Der Audit-Export für #4471 kommt von Security Review. Da fehlt was. Okafor ist drin, sonst niemand aus der Sicherheitsabteilung. Wer filtert seine eigene Abteilung aus einem Export? … Und der Download um 19:14 – das Gerät kenne ich nicht. Ich brauch das Register. Jana fragen.",
  };
  const audio = {
    title: () => "Mediaplayer", icon: () => "audio", w: 600, h: 420,
    render(w) {
      const files = ["memo1", "memo2", "memo4"].concat(G.unlocked("archiv") ? ["memo3"] : []);
      const cur = w.state.cur || (N[w.arg] ? w.arg : files[files.length - 1]);
      w.state.cur = cur;
      const M = ST.memos[cur], isMorse = Boolean(M);
      let wave;
      if (isMorse) {
        wave = `<div class="wave morse">${M.morse.map((g, gi) => `<span class="wg">${g.split("").map((c, ci) => `<i class="${c === "-" ? "long" : "short"}" data-k="${gi}-${ci}"></i>`).join("")}</span>`).join("")}</div>`;
      } else {
        let seed = cur === "memo1" ? 7 : 13;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        wave = `<div class="wave speech">${Array.from({ length: 64 }, () => `<i style="height:${12 + Math.round(rnd() * 70)}%"></i>`).join("")}</div>`;
      }
      w.body.innerHTML = `<div class="ap"><nav class="ap-list">${files.map((f) => `<button class="ap-file${f === cur ? " on" : ""}" data-f="${f}">${DL.icon("wav")}<span>${esc(N[f].name)}<small>${esc(N[f].date)}</small></span></button>`).join("")}
          ${G.unlocked("archiv") ? "" : `<p class="ap-note">Weitere Aufnahmen liegen in gesperrten Ordnern.</p>`}</nav>
        <div class="ap-main"><p class="ap-title">${esc(N[cur].name)}</p>${wave}
          <div class="ap-ctrl"><button class="btn ap-play">${w.state.playing ? "■ Stopp" : "▶ Abspielen"}</button>
          ${isMorse ? `<label class="ap-slow"><input type="checkbox" ${w.state.slow ? "checked" : ""}> langsam</label>` : ""}
          <span class="ap-hint">${snd.isOn() ? "" : "Ton ist aus – die Anzeige zeigt die Signale trotzdem."}</span></div>
          ${isMorse ? `<p class="ap-sub">Unbekanntes Signal · ${M.morse.length} Gruppen · keine Sprache erkannt</p><p class="ap-src"><b>Quelle:</b> ${esc(M.source)}</p>` : `<p class="ap-sub">Sprachmemo · automatisches Transkript</p><p class="ap-trans">${esc(TRANSCRIPTS[cur])}</p>`}
        </div></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const f = e.target.closest(".ap-file"); if (f) { stopPlay(w); w.state.cur = f.dataset.f; os().render(w); return; }
        if (e.target.closest(".ap-play")) { if (w.state.playing) { stopPlay(w); os().render(w); } else play(w); }
      });
      w.body.addEventListener("change", (e) => { if (e.target.matches(".ap-slow input")) { w.state.slow = e.target.checked; } });
    },
    closed(w) { stopPlay(w); },
    onChange(w) { if (!w.state.playing) os().render(w); },
  };
  function planFor(groups, slow) { const unit = slow ? 0.2 : 0.11; const plan = []; let t = 0.15; groups.forEach((g, gi) => { g.split("").forEach((c, ci) => { const dur = c === "-" ? unit * 3 : unit; plan.push({ start: t, dur, k: gi + "-" + ci }); t += dur + unit; }); t += unit * 6; }); return plan; }
  function stopPlay(w) { (w.state.timers || []).forEach(clearTimeout); w.state.timers = []; w.state.playing = false; }
  function play(w) {
    w.state.playing = true; os().render(w);
    w.state.timers = [];
    const M = ST.memos[w.state.cur];
    if (M) {
      if (w.state.cur === "memo3" && !G.flag("played_memo3")) { G.setFlag("played_memo3"); setTimeout(() => G.send("u_memo"), 5000); }
      const { plan, total } = snd.morse(M.morse, { unit: w.state.slow ? 0.2 : 0.11 });
      const keys = planFor(M.morse, w.state.slow);
      plan.forEach((p, i) => {
        const k = keys[i].k;
        w.state.timers.push(setTimeout(() => { const el = w.body.querySelector(`[data-k="${k}"]`); if (el) el.classList.add("on"); }, p.start * 1000));
        w.state.timers.push(setTimeout(() => { const el = w.body.querySelector(`[data-k="${k}"]`); if (el) el.classList.remove("on"); }, (p.start + p.dur) * 1000));
      });
      w.state.timers.push(setTimeout(() => { w.state.playing = false; os().render(w); }, total * 1000 + 300));
    } else {
      snd.play("click");
      const bars = w.body.querySelectorAll(".wave i");
      bars.forEach((b, i) => w.state.timers.push(setTimeout(() => b.classList.add("on"), i * 90)));
      w.state.timers.push(setTimeout(() => { w.state.playing = false; os().render(w); }, bars.length * 90 + 400));
    }
  }

  /* ================= Bilder ================= */
  const IMAGES = {
    whiteboard: {
      meta: ["Aufgenommen: 16.10.2025, 19:02", "Gerät: Smartphone E. Voss", "Ort: Arbeitsplatz 02"],
      svg: `<svg viewBox="0 0 800 500"><rect width="800" height="500" fill="#4a4f55"/><rect x="30" y="30" width="740" height="430" fill="#f3f3ef" stroke="#9aa0a6" stroke-width="6"/>
        <g font-family="'Segoe Print','Comic Sans MS',cursive" fill="#1d3f8a" font-size="24">
        <text x="70" y="90">#4471 — Nora?</text><text x="270" y="90" fill="#b3261e">NEIN</text>
        <text x="70" y="140">18:17 abgemeldet  →  19:14 Download ??</text>
        <text x="70" y="190">Gerät ≠ LT-N14 !!</text>
        <text x="70" y="240">Wer kann Konten „leihen“?</text>
        <text x="70" y="290">Protokolle umgeschrieben → Gerät bleibt!</text>
        <text x="70" y="340">Dienste: ltn · qtz · orb · hlc · ???</text>
        <text x="460" y="400" fill="#b3261e" font-size="22">Ombudsstelle — extern!</text>
        <text x="460" y="432" fill="#b3261e" font-size="22">NICHT an Security Review</text></g>
        <path d="M60 100 q120 -10 260 0" stroke="#b3261e" stroke-width="2" fill="none"/><circle cx="620" cy="165" r="62" fill="none" stroke="#2e7d32" stroke-width="3"/><text x="620" y="158" text-anchor="middle" font-family="cursive" fill="#2e7d32" font-size="18">Wer darf</text><text x="620" y="182" text-anchor="middle" font-family="cursive" fill="#2e7d32" font-size="18">spiegeln?</text></svg>`,
    },
    sommerfest: {
      meta: ["Aufgenommen: 29.08.2025, 20:14", "Kamera: J. Thiel", "VANTA Sommerfest, Dachterrasse"],
      svg: `<svg viewBox="0 0 800 500"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a65a"/><stop offset="1" stop-color="#7b4a6b"/></linearGradient></defs><rect width="800" height="500" fill="url(#sky)"/>
        <rect y="360" width="800" height="140" fill="#3b2c35"/><g stroke="#ffd98a" stroke-width="2"><path d="M0 60 Q200 110 400 60 T800 60" fill="none"/></g>
        <g fill="#ffe7a8">${[40, 120, 200, 280, 360, 440, 520, 600, 680, 760].map((x) => `<circle cx="${x}" cy="${78 + (x % 160 === 40 ? 6 : 0)}" r="6"/>`).join("")}</g>
        <text x="400" y="140" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="30" fill="#fff" opacity=".9">VANTA Sommerfest 2025</text>
        ${[["Lea", 130, "#8fb3d9"], ["Jana", 260, "#e39b9b"], ["Elias", 400, "#9fc79a"], ["Nora", 530, "#d7b6e8"], ["Malte", 660, "#e8cf8f"]].map(([n, x, c]) => `<g><circle cx="${x}" cy="250" r="34" fill="#f1d3b5"/><rect x="${x - 45}" y="290" width="90" height="120" rx="30" fill="${c}"/><rect x="${x - 30}" y="318" width="60" height="22" fill="#fff"/><text x="${x}" y="334" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="14" fill="#222">${n}</text></g>`).join("")}</svg>`,
    },
    meeting: {
      meta: ["Aufgenommen: 14.10.2025, 19:23:04 (Kamerazeit)", "Quelle: Konferenzsystem CAM-B01, Raum B-01 (automatische Raumbelegung)", "Blick: Glaswand zum Flur · gegenüber: Sicherheitsbüro C-01"],
      svg: `<svg viewBox="0 0 800 500"><rect width="800" height="500" fill="#1d2228"/>
        <rect x="0" y="0" width="800" height="330" fill="#2b333c"/>
        <g opacity=".95"><rect x="420" y="60" width="300" height="250" fill="#3c4650"/><rect x="440" y="80" width="260" height="210" fill="#e9dfb8" opacity=".85"/>
          <rect x="560" y="200" width="110" height="70" fill="#222"/><rect x="566" y="206" width="98" height="52" fill="#5f8fbf"/><rect x="600" y="264" width="30" height="16" fill="#333"/>
          <rect x="640" y="248" width="22" height="8" fill="#f4f4f4"/><text x="651" y="254.6" text-anchor="middle" font-family="DM Mono,monospace" font-size="5.2" fill="#000">SEC-01</text>
          <circle cx="520" cy="170" r="22" fill="#272320"/><path d="M490 290 q30 -100 60 0 z" fill="#272320"/><rect x="494" y="190" width="52" height="100" rx="18" fill="#272320"/>
          <line x1="520" y1="194" x2="528" y2="236" stroke="#b32" stroke-width="1.6"/><rect x="522" y="236" width="16" height="11" fill="#f2f2f2"/><text x="530" y="243.5" text-anchor="middle" font-family="DM Mono,monospace" font-size="3.6" fill="#111">V. KERN</text>
          <rect x="440" y="80" width="260" height="22" fill="#1b2025"/><text x="570" y="96" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="13" fill="#d8d8d8">C-01 · SICHERHEITSBÜRO</text></g>
        <g stroke="#9fb1c2" stroke-opacity=".35">${Array.from({ length: 9 }, (_, i) => `<line x1="${30 + i * 90}" y1="0" x2="${30 + i * 90}" y2="330"/>`).join("")}</g>
        <rect x="0" y="0" width="800" height="330" fill="#cfe3f5" opacity=".08"/>
        <path d="M60 400 L740 400 L800 500 L0 500 Z" fill="#4a3a2c"/><rect x="120" y="360" width="560" height="40" rx="6" fill="#6b5440"/>
        ${[160, 280, 400, 520, 640].map((x) => `<rect x="${x}" y="410" width="60" height="60" rx="8" fill="#202428"/>`).join("")}
        <text x="16" y="24" font-family="DM Mono,monospace" font-size="13" fill="#e8e8e8">CAM-B01 · 14.10.2025 19:23:04</text><circle cx="770" cy="20" r="6" fill="#d33"/></svg>`,
    },
  };
  const image = {
    title: (arg) => N[arg].name + " – Bildbetrachter", icon: () => "jpg", w: 700, h: 500,
    render(w) {
      const I = IMAGES[N[w.arg].image], z = w.state.z || 1;
      w.body.innerHTML = `<div class="iv"><div class="iv-bar"><button class="btn small" data-z="-1" aria-label="Verkleinern">−</button><span class="iv-zoom">${Math.round(z * 100)} %</span><button class="btn small" data-z="1" aria-label="Vergrößern">+</button><button class="btn small ghost" data-z="0">Einpassen</button><button class="btn small ghost iv-info">${w.state.info ? "Details ausblenden" : "Details"}</button></div>
        <div class="iv-view"><div class="iv-pan" style="transform:translate(${w.state.x || 0}px,${w.state.y || 0}px) scale(${z})">${I.svg}</div></div>
        ${w.state.info ? `<div class="iv-meta">${I.meta.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : ""}</div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const b = e.target.closest("[data-z]");
        if (b) { const d = Number(b.dataset.z); if (d === 0) { w.state.z = 1; w.state.x = 0; w.state.y = 0; } else w.state.z = Math.max(1, Math.min(6, (w.state.z || 1) * (d > 0 ? 1.5 : 1 / 1.5))); os().render(w); }
        if (e.target.closest(".iv-info")) { w.state.info = !w.state.info; os().render(w); }
      });
      w.body.addEventListener("wheel", (e) => { if (!e.target.closest(".iv-view")) return; e.preventDefault(); w.state.z = Math.max(1, Math.min(6, (w.state.z || 1) * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); os().render(w); }, { passive: false });
      w.body.addEventListener("pointerdown", (e) => {
        if (!e.target.closest(".iv-view")) return;
        const sx = e.clientX, sy = e.clientY, ox = w.state.x || 0, oy = w.state.y || 0;
        const pan = w.body.querySelector(".iv-pan");
        const mv = (ev) => { w.state.x = ox + ev.clientX - sx; w.state.y = oy + ev.clientY - sy; pan.style.transform = `translate(${w.state.x}px,${w.state.y}px) scale(${w.state.z || 1})`; };
        const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
      });
    },
  };

  /* ================= Mail ================= */
  const mail = {
    title: () => "Mail · e.voss@vanta.local", icon: () => "mail", w: 760, h: 480,
    render(w) {
      const sel = w.state.sel;
      const m = ST.mails.find((x) => x.id === sel);
      w.body.innerHTML = `<div class="ml${m ? " reading" : ""}"><nav class="ml-list">${ST.mails.map((x) => `<button class="ml-item${x.id === sel ? " on" : ""}${G.flag("mail_" + x.id) ? "" : " unread"}" data-m="${x.id}"><b>${esc(x.from)}</b><span>${esc(x.subject)}</span><small>${esc(x.date)}</small></button>`).join("")}</nav>
        <article class="ml-read">${m ? `<button class="ml-back btn small ghost">← Posteingang</button><h3>${esc(m.subject)}</h3><p class="ml-from"><b>${esc(m.from)}</b> &lt;${esc(m.addr)}&gt; · ${esc(m.date)}</p>
          ${m.headers ? `<button class="btn small ghost ml-hdr">${w.state.hdr ? "Kopfzeilen ausblenden" : "Kopfzeilen anzeigen"}</button>${w.state.hdr ? `<pre class="ml-headers">${esc(m.headers)}</pre>` : ""}` : ""}
          <pre class="ml-body">${esc(m.body)}</pre>${m.attach ? `<p class="ml-att-row">Anhang: <button class="btn small ghost ml-att" data-node="${m.attach}">📎 ${esc(N[m.attach].name)}</button></p>` : ""}` : `<p class="ml-empty">Wähle eine Nachricht.</p>`}</article></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const it = e.target.closest(".ml-item"); if (it) { w.state.sel = it.dataset.m; w.state.hdr = false; G.setFlag("mail_" + it.dataset.m); os().render(w); return; }
        if (e.target.closest(".ml-back")) { w.state.sel = null; os().render(w); }
        if (e.target.closest(".ml-hdr")) { w.state.hdr = !w.state.hdr; os().render(w); }
        const att = e.target.closest(".ml-att"); if (att) os().openNode(att.dataset.node);
      });
    },
  };

  /* ================= Messenger ================= */
  const messenger = {
    title: () => "Messenger", icon: () => "messenger", w: 560, h: 480,
    render(w) {
      const S = G.state;
      const th = w.state.th || (w.arg === "unknown" && S.msgs.length ? "unknown" : "nora");
      w.state.th = th;
      const threads = [{ id: "nora", name: "Nora Weiss", sub: G.isSolved("chat") ? "Chat-Backup · 16.10." : "chat_backup.enc · verschlüsselt" }]
        .concat(S.msgs.length ? [{ id: "unknown", name: "UNBEKANNT", sub: S.msgs.length + " Nachricht" + (S.msgs.length > 1 ? "en" : ""), unread: S.msgs.filter((m) => !G.flag("read_" + m)).length }] : []);
      let main;
      if (th === "nora") {
        main = G.isSolved("chat")
          ? `<p class="ms-day">CHATBACKUP · 16.10. · 22:14</p>${ST.chat.map((c) => `<div class="ms-msg ${c.who === "Elias" ? "me" : ""}"><p>${esc(c.text)}</p><small>${esc(c.who)} · ${esc(c.time)}</small></div>`).join("")}`
          : `<form class="ms-lock"><div class="lock-ico">${DL.icon("lock")}</div><p><b>chat_backup.enc</b><br>Verschlüsseltes Backup des Chats mit Nora Weiss.</p>
             <input class="field code" autocomplete="off" maxlength="12" placeholder="Passwort" aria-label="Passwort"><button class="btn" type="submit">Entschlüsseln</button><p class="lock-msg" role="alert"></p></form>`;
      } else {
        const after = G.isSolved("case");
        main = `<p class="ms-day">UNBEKANNT · ${after ? "lokaler Absender" : "Absender verborgen"}</p>${S.msgs.map((id) => {
          const m = ST.messages[id]; const t = S.msgAt[id] || 0; const tt = 12 + Math.floor(t / 60);
          const time = `${String(Math.floor(tt / 60) % 24).padStart(2, "0")}:${String(tt % 60).padStart(2, "0")}`;
          return `<div class="ms-msg them"><p>${esc(m.text)}</p><small>${after ? `geplant 17.10. 23:4${m.rule % 10} · Regel #${m.rule} · ausgelöst ${time}` : `zugestellt ${time}`}</small></div>`;
        }).join("")}`;
        if (S.msgs.some((id) => !G.flag("read_" + id))) { S.msgs.forEach((id) => { S.flags["read_" + id] = true; }); G.save(); setTimeout(() => os().paintIcons(), 0); }
      }
      w.body.innerHTML = `<div class="ms"><nav class="ms-threads">${threads.map((t) => `<button class="ms-th${t.id === th ? " on" : ""}" data-th="${t.id}"><b>${esc(t.name)}</b><small>${esc(t.sub)}</small>${t.unread ? `<i class="badge">${t.unread}</i>` : ""}</button>`).join("")}</nav><div class="ms-main">${main}</div></div>`;
      const mm = $(".ms-main", w.body); mm.scrollTop = mm.scrollHeight;
      const f = $(".ms-lock", w.body);
      if (f) f.addEventListener("submit", (e) => {
        e.preventDefault();
        const r = G.tryChat($("input", f).value);
        if (!r.ok) { $(".lock-msg", f).textContent = r.text; snd.play("error"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); }
        else DL.toast({ title: "Chat-Backup entschlüsselt", kind: "ok" });
      });
    },
    opened(w) { w.body.addEventListener("click", (e) => { const t = e.target.closest(".ms-th"); if (t) { w.state.th = t.dataset.th; os().render(w); } }); },
    onChange(w) { const inp = w.body.querySelector(".ms-lock input"); if (inp && inp.value) return; os().render(w); },
  };

  /* ================= Browser ================= */
  const MORSE_TABLE = [["A", ".-"], ["B", "-..."], ["C", "-.-."], ["D", "-.."], ["E", "."], ["F", "..-."], ["G", "--."], ["H", "...."], ["I", ".."], ["J", ".---"], ["K", "-.-"], ["L", ".-.."], ["M", "--"], ["N", "-."], ["O", "---"], ["P", ".--."], ["Q", "--.-"], ["R", ".-."], ["S", "..."], ["T", "-"], ["U", "..-"], ["V", "...-"], ["W", ".--"], ["X", "-..-"], ["Y", "-.--"], ["Z", "--.."]];
  const link = (href, label) => `<a href="#" data-href="${href}">${esc(label)}</a>`;
  const PAGES = {
    "vanta.local": () => `<div class="pg intranet"><header class="pg-head"><b>VANTA</b> Intranet<nav>${link("vanta.local", "Start")} ${link("vanta.local/team", "Mitarbeiter")} ${link("hilfe.vanta.local", "IT-Hilfe")} ${link("audit.vanta.local", "Audit-Portal")}</nav></header>
      <article class="news"><small>15.10.2025 · Unternehmenskommunikation</small><h3>Datenabfluss: Security Review übernimmt Vorfall #4471</h3><p>Nach einem unberechtigten Export von Kundendaten hat Security Review unter Leitung von Viktor Kern die Untersuchung übernommen. Eine Mitarbeiterin der Systemadministration wurde freigestellt. Wir bitten alle Mitarbeitenden, keine eigenen Nachforschungen anzustellen.</p></article>
      <article class="news"><small>14.10.2025 · IT-Betrieb</small><h3>Patchnacht erfolgreich vorbereitet</h3><p>Danke an alle, die am Dienstagabend länger geblieben sind. Die Sicherung über LANTERN lief um 19:25 planmäßig.</p></article>
      <article class="news"><small>01.09.2025 · Personal</small><h3>Fotos vom Sommerfest</h3><p>Danke an Jana Thiel für die Fotos! Sie liegen auf euren Rechnern unter Bilder.</p></article></div>`,
    "vanta.local/team": () => `<div class="pg intranet"><header class="pg-head"><b>VANTA</b> Intranet<nav>${link("vanta.local", "Start")} ${link("vanta.local/team", "Mitarbeiter")} ${link("hilfe.vanta.local", "IT-Hilfe")} ${link("audit.vanta.local", "Audit-Portal")}</nav></header>
      <h3>Mitarbeiterverzeichnis · IT und Technik</h3><table class="pg-table"><thead><tr><th>Name</th><th>Funktion</th><th>Arbeitsplatz</th></tr></thead><tbody>${ST.team.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.role)}${p.note ? ` <em>(${esc(p.note)})</em>` : ""}</td><td>${esc(p.place)}</td></tr>`).join("")}</tbody></table></div>`,
    "hilfe.vanta.local": () => `<div class="pg help"><header class="pg-head"><b>IT-Hilfe</b><nav>${link("vanta.local", "Intranet")}</nav></header><h3>Häufige Themen</h3><ul class="pg-links">
      <li>${link("hilfe.vanta.local/passwort", "Passwort vergessen")}</li><li>${link("hilfe.vanta.local/vpn", "VPN von zu Hause")}</li><li>${link("hilfe.vanta.local/morse", "Notfallkommunikation: Morsealphabet")}</li><li>${link("hilfe.vanta.local/geraete", "Gerätekennungen verstehen")}</li></ul></div>`,
    "hilfe.vanta.local/passwort": () => `<div class="pg help"><header class="pg-head"><b>IT-Hilfe</b><nav>${link("hilfe.vanta.local", "Übersicht")}</nav></header><h3>Passwort vergessen</h3><p>Wende dich an den Helpdesk (EG, HD-03). Passwörter werden niemals per Mail verschickt.</p></div>`,
    "hilfe.vanta.local/vpn": () => `<div class="pg help"><header class="pg-head"><b>IT-Hilfe</b><nav>${link("hilfe.vanta.local", "Übersicht")}</nav></header><h3>VPN von zu Hause</h3><p>Jede VPN-Anmeldung wird mit der Gerätekennung des Laptops protokolliert. Ausgeschaltete Geräte erscheinen im Audit-Log als offline.</p></div>`,
    "hilfe.vanta.local/geraete": () => `<div class="pg help"><header class="pg-head"><b>IT-Hilfe</b><nav>${link("hilfe.vanta.local", "Übersicht")}</nav></header><h3>Gerätekennungen verstehen</h3><p>Jedes Gerät hat eine fest eingebaute Kennung, z. B. <code>LT-N14</code> (Laptop) oder <code>WS-E02</code> (Arbeitsplatzrechner). Sie wird bei jeder Aktion mitgeschrieben, unabhängig davon, mit welchem Konto jemand angemeldet ist.</p><p>Welches Gerät wem zugeordnet ist, steht im Geräteregister (Helpdesk).</p></div>`,
    "hilfe.vanta.local/morse": () => `<div class="pg help"><header class="pg-head"><b>IT-Hilfe</b><nav>${link("hilfe.vanta.local", "Übersicht")}</nav></header><h3>Notfallkommunikation: Morsealphabet</h3><p>Fällt im Notfall alles aus, verständigen sich Teams über Klopf- oder Tonzeichen: kurz (·) und lang (–). Zwischen Buchstaben ist eine längere Pause.</p>
      <div class="morse-grid">${MORSE_TABLE.map(([l, c]) => `<span><b>${l}</b><code>${c.replace(/\./g, "·").replace(/-/g, "–")}</code></span>`).join("")}</div></div>`,
    "albers-roth.de": () => `<div class="pg blocked"><h3>Keine Verbindung</h3><p>Dieses System befindet sich im Quarantänemodus. Externe Verbindungen sind gesperrt.</p><p><small>Ausnahme: VANTA EMERGENCY PROTOCOL (DEADLINE.exe)</small></p></div>`,
    "review.vanta.local": () => `<div class="pg intranet"><header class="pg-head"><b>Security Review</b></header><p>Zugriff nur für Mitglieder von Security Review.</p><p><small>Leitung: V. Kern · Sicherheitsbüro C-01</small></p></div>`,
  };
  function portal(w) {
    const sec = w.state.sec || "vorfaelle";
    const nav = [["vorfaelle", "Vorfälle"], ["akte", "Akte #4471"], ["projekte", "Interne Projekte"], ["berichte", "Sicherheitsberichte"]];
    let body = "";
    if (sec === "vorfaelle") body = `<h3>Vorfälle · Oktober 2025</h3><table class="pg-table"><thead><tr><th>Nr.</th><th>Vorfall</th><th>Konto</th><th>Status</th></tr></thead><tbody>
      <tr><td>#4471</td><td>Export Kundendaten (kundendaten_gesamt.zip), 14.10. 19:14</td><td>NWEISS</td><td>in Prüfung · Security Review</td></tr>
      <tr><td>#4466</td><td>Fehlgeschlagene Anmeldungen VPN</td><td>LAHRENS</td><td>erledigt</td></tr><tr><td>#4459</td><td>Zertifikat abgelaufen (HALCYON)</td><td>SYSTEM</td><td>erledigt</td></tr></tbody></table>`;
    if (sec === "akte") body = `<h3>Ermittlungsakte #4471 <span class="pg-draft">NOTIZEN E. VOSS</span></h3>
      <p>Export von <b>kundendaten_gesamt.zip</b> am Dienstag, 14.10., 19:14, unter dem Konto <b>NWEISS</b>. N. Weiss seit 15.10. freigestellt. Zuständig: Security Review.</p>
      <ul class="pg-notes">
        <li>Konto ≠ Person. Welches <b>Gerät</b> hat den Download ausgeführt? Audit-Auszug liegt bei Nora.</li>
        <li>Geräte lassen sich im Terminal zurückverfolgen (<code>trace</code>). Danach gibt das Portal die internen Projekte frei (Forensik-Richtlinie 4.2).</li>
        <li>Foto aus B-01 – Kamerazeit prüfen, Ticket #3311?</li>
        <li>Zwei anonyme Mails. Wer schreibt so etwas, und wann wirklich?</li>
        <li>Security Review vergibt für alles Vorgangsnummern (SR-…).</li>
      </ul>`;
    if (sec === "projekte") body = G.isSolved("trace")
      ? `<h3>Interne Projekte</h3><table class="pg-table"><thead><tr><th>Projekt</th><th>Dienst</th><th>Zweck</th><th>Verantwortlich</th></tr></thead><tbody>${ST.projects.map((p) => `<tr><td>${p.detail ? `<a href="#" data-proj="${p.name}">${p.name}</a>` : p.name}</td><td><code>${p.svc}</code></td><td>${esc(p.what)}</td><td>${esc(p.owner)}</td></tr>`).join("")}</tbody></table>
         ${w.state.proj ? `<div class="pg-detail"><h4>${esc(w.state.proj)}</h4><p>${esc(ST.projects.find((p) => p.name === w.state.proj).detail)}</p></div>` : `<p class="pg-tip">Projektnamen mit Link haben eine ausführliche Beschreibung.</p>`}`
      : `<h3>Interne Projekte</h3><p class="pg-locked">Kein Zugriff. Erweiterter Prüfzugang erforderlich: Er wird automatisch aktiv, sobald ein verdächtiges Gerät im Terminal untersucht wurde (Forensik-Richtlinie 4.2).</p>`;
    if (sec === "berichte") {
      const r = w.state.sr ? ST.srReports[w.state.sr] : null;
      body = `<h3>Sicherheitsberichte</h3><p>Berichte von Security Review lassen sich nur mit ihrer Vorgangsnummer aufrufen.</p>
        <form class="sr-form"><input class="field" name="sr" placeholder="SR-0000" autocomplete="off" spellcheck="false" aria-label="Vorgangsnummer"><button class="btn small" type="submit">Aufrufen</button></form>
        <p class="obj-msg bad" role="alert">${esc(w.state.srMsg || "")}</p>
        ${r ? `<div class="pg-detail"><h4>${esc(r.title)}</h4><pre class="pg-pre">${esc(r.text)}</pre></div>` : ""}`;
    }
    return `<div class="pg portal"><header class="pg-head"><b>AUDIT-PORTAL</b><span class="pg-user">angemeldet: E.VOSS</span></header><nav class="pg-tabs">${nav.map(([k, l]) => `<button data-sec="${k}" class="${k === sec ? "on" : ""}">${l}</button>`).join("")}</nav>${body}</div>`;
  }

  const BOOKMARKS = [["vanta.local", "Intranet"], ["hilfe.vanta.local", "IT-Hilfe"], ["audit.vanta.local", "Audit-Portal"], ["albers-roth.de", "Ombudsstelle"]];
  const browser = {
    title: () => "Browser", icon: () => "browser", w: 820, h: 540,
    render(w) {
      const url = w.state.url || (w.state.url = "vanta.local");
      const page = url === "audit.vanta.local" ? portal(w) : PAGES[url] ? PAGES[url]() : `<div class="pg blocked"><h3>Seite nicht gefunden</h3><p>${esc(url)} ist nicht erreichbar.</p></div>`;
      w.body.innerHTML = `<div class="br"><div class="br-bar"><button class="btn small ghost br-back" aria-label="Zurück" ${(w.state.hist || []).length ? "" : "disabled"}>←</button><form class="br-url"><input class="field" value="${esc(url)}" aria-label="Adresse" spellcheck="false"></form></div>
        <nav class="br-marks">${BOOKMARKS.map(([u, l]) => `<button data-href="${u}">${esc(l)}</button>`).join("")}</nav><div class="br-page">${page}</div></div>`;
    },
    opened(w) {
      const go = (u) => { u = String(u).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, ""); if (u === w.state.url) return; (w.state.hist = w.state.hist || []).push(w.state.url); w.state.url = u; w.state.sec = null; os().render(w); };
      w.body.addEventListener("click", (e) => {
        const a = e.target.closest("[data-href]"); if (a) { e.preventDefault(); go(a.dataset.href); return; }
        if (e.target.closest(".br-back")) { const h = w.state.hist || []; if (h.length) { w.state.url = h.pop(); os().render(w); } return; }
        const s = e.target.closest("[data-sec]"); if (s) { w.state.sec = s.dataset.sec; os().render(w); return; }
        const p = e.target.closest("[data-proj]"); if (p) { e.preventDefault(); w.state.proj = p.dataset.proj; os().render(w); }
      });
      w.body.addEventListener("submit", (e) => {
        e.preventDefault();
        if (e.target.matches(".br-url")) { go($("input", e.target).value); return; }
        if (e.target.matches(".sr-form")) {
          const v = $("input", e.target).value;
          const r = G.openReport(v);
          if (r) { w.state.sr = Object.keys(ST.srReports).find((k) => ST.srReports[k] === r); w.state.srMsg = ""; if (r.key) snd.play("unlock"); }
          else { w.state.sr = null; w.state.srMsg = "Kein Vorgang mit dieser Nummer."; snd.play("error"); }
          os().render(w);
        }
      });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input,select")) return; os().render(w); },
  };

  /* ================= Terminal ================= */
  const terminal = {
    title: () => "Terminal", icon: () => "terminal", w: 680, h: 440, cls: "win-term",
    render(w) {
      if (!w.state.lines) {
        w.state.lines = [{ t: "VANTA SYSTEM TERMINAL" }, { t: `User: ${G.isSolved("case") ? "E.VOSS" : "UNKNOWN"}` }, { t: `Access Level: ${G.isSolved("case") ? "FULL" : "LIMITED"}` }, { t: 'Type "help" for available commands.', cls: "dim" }, { t: "" }];
        w.state.hist = []; w.state.hi = 0;
      }
      w.state.lines.push(...G.takeTermQueue());
      w.body.innerHTML = `<div class="term"><div class="term-out">${w.state.lines.map((l) => `<div class="tl ${l.cls || ""}">${esc(l.t) || "&nbsp;"}</div>`).join("")}</div>
        <form class="term-in"><span class="term-ps">E-VOSS:~$</span><input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Befehl"></form></div>`;
      const out = $(".term-out", w.body); out.scrollTop = out.scrollHeight;
    },
    opened(w) {
      const focus = () => { const i = $(".term-in input", w.body); if (i && !os().coarse()) i.focus(); };
      setTimeout(focus, 60);
      w.body.addEventListener("click", (e) => { if (!window.getSelection().toString()) focus(); });
      w.body.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = $(".term-in input", w.body), v = inp.value;
        w.state.lines.push({ t: "E-VOSS:~$ " + v, cls: "cmd" });
        if (v.trim()) { w.state.hist.push(v); w.state.hi = w.state.hist.length; }
        const res = G.command(v);
        if (res.length && res[0].clear) w.state.lines = [];
        else w.state.lines.push(...res);
        os().render(w);
        const i2 = $(".term-in input", w.body); if (i2) i2.focus();
      });
      w.body.addEventListener("keydown", (e) => {
        const inp = e.target.closest(".term-in input"); if (!inp) return;
        if (e.key === "ArrowUp" && w.state.hist.length) { w.state.hi = Math.max(0, w.state.hi - 1); inp.value = w.state.hist[w.state.hi]; e.preventDefault(); }
        if (e.key === "ArrowDown" && w.state.hist.length) { w.state.hi = Math.min(w.state.hist.length, w.state.hi + 1); inp.value = w.state.hist[w.state.hi] || ""; e.preventDefault(); }
        if (e.key.length === 1) snd.play("key");
      });
    },
    onChange(w) {
      const q = G.takeTermQueue(); if (!q.length) return;
      const inp = $(".term-in input", w.body), v = inp ? inp.value : "";
      w.state.lines.push(...q); os().render(w);
      const i2 = $(".term-in input", w.body); if (i2) i2.value = v;
    },
  };

  /* ================= DEADLINE.exe ================= */
  function reportHtml(red) {
    return esc(ST.report).replace(/\{([^}]+)\}/g, (m, name) => `<button type="button" class="rd-name${red.includes(name) ? " redacted" : ""}" data-name="${esc(name)}" aria-pressed="${red.includes(name)}">${esc(name)}</button>`);
  }
  const deadline = {
    title: () => "DEADLINE.exe", icon: () => "deadline", w: 760, h: 560, cls: "win-dead",
    render(w) {
      const S = G.state;
      if (!G.isSolved("case")) {
        w.body.innerHTML = `<div class="dx locked"><p class="dx-k">VANTA EMERGENCY PROTOCOL</p><p class="dx-big" data-live-countdown>${S.relaxed ? "OHNE ZEITLIMIT" : G.fmt(G.remaining())}</p><p class="dx-sub">AUTOMATISCHE DATENLÖSCHUNG</p>
          <p class="dx-deny">ZUGRIFF VERWEIGERT · CASE_17 versiegelt (${4 - G.sealsOpen().length} von 4 Siegeln gebrochen)</p></div>`;
        return;
      }
      const draft = G.draft(), count = draft.redact.length;
      w.body.innerHTML = `<div class="dx"><header class="dx-head"><div><p class="dx-k">VANTA EMERGENCY PROTOCOL · SYSTEMENTSCHEIDUNG</p><p>Das Beweispaket wurde verifiziert. Die automatische Löschung läuft weiter.</p></div><p class="dx-time"><b data-live-countdown>${S.relaxed ? "OHNE ZEITLIMIT" : G.fmt(G.remaining())}</b><small>VERBLEIBENDE ZEIT</small></p></header>
        <section class="dx-sec"><h4>1 · Bericht prüfen <span>Namen anklicken, um sie zu schwärzen · ${count} geschwärzt</span></h4><div class="dx-report">${reportHtml(draft.redact)}</div></section>
        <section class="dx-sec"><h4>2 · Empfänger</h4><div class="dx-targets">
          <label class="dx-t"><input type="radio" name="dxt" value="review"${draft.target === "review" ? " checked" : ""}><span><b>VANTA Security Review</b><small>intern · review.vanta.local</small></span></label>
          <label class="dx-t"><input type="radio" name="dxt" value="ombud"${draft.target === "ombud" ? " checked" : ""}><span><b>Ombudsstelle Albers &amp; Roth</b><small>extern · albers-roth.de/portal</small></span></label></div></section>
        ${G.isMultiplayer() ? `<p class="dx-note">Ihr bearbeitet diesen Entwurf gemeinsam – alle sehen dieselben Schwärzungen und denselben Empfänger.${draft.by ? ` Zuletzt geändert von <b>${esc(draft.by)}</b>.` : ""} Wer sendet oder löscht, entscheidet für das ganze Team.</p>` : ""}
        <div class="dx-actions"><button class="btn danger dx-purge">VOLLSTÄNDIG LÖSCHEN</button><button class="btn dx-send"${draft.target ? "" : " disabled"}>BEWEISE SENDEN</button></div>
        <div class="dx-confirm" hidden></div></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const n = e.target.closest(".rd-name");
        if (n) { const name = n.dataset.name, red = G.draft().redact; G.updateDraft({ redact: red.includes(name) ? red.filter((x) => x !== name) : red.concat(name) }); snd.play("click"); return; }
        if (e.target.closest(".dx-send")) return confirmBox(w, "send");
        if (e.target.closest(".dx-purge")) return confirmBox(w, "purge");
        if (e.target.closest(".dx-no")) { $(".dx-confirm", w.body).hidden = true; return; }
        const yes = e.target.closest(".dx-yes");
        if (yes) G.decide({ target: yes.dataset.t === "purge" ? "purge" : G.draft().target, redact: G.draft().redact.slice() });
      });
      w.body.addEventListener("change", (e) => { if (e.target.name === "dxt") G.updateDraft({ target: e.target.value }); });
      w.offDraft = DL.on("draft", () => { if (!w.body.isConnected) return; const c = $(".dx-confirm", w.body), kind = c && !c.hidden ? c.dataset.kind : null; const r = $(".dx-report", w.body), y = r ? r.scrollTop : 0; os().render(w); const r2 = $(".dx-report", w.body); if (r2) r2.scrollTop = y; if (kind) confirmBox(w, kind, true); });
    },
    closed(w) { if (w.offDraft) w.offDraft(); },
    onChange(w) { if ($(".dx-confirm", w.body) && !$(".dx-confirm", w.body).hidden) return; if (!$(".dx-report", w.body) || G.isSolved("case") !== Boolean($(".dx-report", w.body))) os().render(w); },
  };
  function confirmBox(w, kind, changed) {
    const box = $(".dx-confirm", w.body);
    if (!box) return;
    box.dataset.kind = kind;
    const draft = G.draft(), names = draft.redact.slice();
    box.innerHTML = kind === "purge"
      ? `<p><b>Bist du sicher, dass du sämtliche Daten unwiderruflich löschen möchtest?</b><br>Damit werden auch alle Beweise vernichtet.</p><div class="dx-actions"><button class="btn ghost dx-no">Abbrechen</button><button class="btn danger dx-yes" data-t="purge">Endgültig löschen</button></div>`
      : `<p><b>Bericht CASE_17 senden?</b><br>Empfänger: ${draft.target === "review" ? "VANTA Security Review (intern)" : "Ombudsstelle Albers &amp; Roth (extern)"}<br>Geschwärzt: ${names.length ? names.map(esc).join(", ") : "niemand"}</p>${changed ? `<p class="dx-warn">Der Entwurf wurde gerade${draft.by ? " von " + esc(draft.by) : ""} geändert – bitte noch einmal prüfen.</p>` : ""}<p class="dx-warn">Das lässt sich nicht rückgängig machen.</p><div class="dx-actions"><button class="btn ghost dx-no">Noch einmal prüfen</button><button class="btn dx-yes" data-t="send">Endgültig senden</button></div>`;
    box.hidden = false;
    box.scrollIntoView({ block: "nearest" });
  }

  /* ================= Hinweise ================= */
  const hints = {
    title: () => "Hinweise", icon: () => "hints", w: 500, h: 520,
    render(w) {
      const open = G.openSteps();
      const done = ST.steps.filter((s) => s.id !== "finale" && G.isSolved(s.id)).length;
      if (!open.length) { w.body.innerHTML = `<div class="hn"><p>Der Fall ist abgeschlossen.</p></div>`; return; }
      if (!open.find((s) => s.id === w.state.sel)) w.state.sel = open[0].id;
      const cur = open.find((s) => s.id === w.state.sel);
      const lvl = G.hintLevel(cur.id), H = ST.hints[cur.id];
      const known = (s) => G.stepDone(s) || s.needs.every((n) => G.isSolved(n));
      w.body.innerHTML = `<div class="hn"><p class="hn-prog">Fortschritt: ${done} von ${ST.steps.length - 1} Schritten</p>
        <ol class="hn-steps">${ST.steps.map((s) => `<li class="${G.stepDone(s) ? "ok" : ""}${open.includes(s) ? " cur" : ""}">${known(s) ? esc(s.label) : "…"}</li>`).join("")}</ol>
        ${open.length > 1 ? `<p class="hn-pick">Gerade offen – wähle, wobei du Hilfe brauchst:</p><div class="hn-tabs">${open.map((s) => `<button class="btn small ${s.id === cur.id ? "" : "ghost"}" data-step="${s.id}">${esc(s.label)}</button>`).join("")}</div>` : ""}
        <h4>${esc(cur.label)}</h4>
        ${H.slice(0, Math.min(lvl, 3)).map((h, i) => `<p class="hn-hint"><b>Hinweis ${i + 1}</b>${esc(h)}</p>`).join("")}
        ${lvl >= 4 ? `<p class="hn-hint sol"><b>Lösung</b>${esc(H[3])}</p>` : ""}
        ${lvl < 3 ? `<button class="btn hn-more">${lvl === 0 ? "Ersten Hinweis zeigen" : "Nächsten Hinweis zeigen"}</button>` : lvl === 3 ? `<button class="btn ghost hn-more">Lösung zeigen …</button>` : ""}
        <p class="hn-note">Hinweise kosten keine Zeit.${G.isMultiplayer() ? " Dein Team sieht sie auch." : ""}</p></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const t = e.target.closest("[data-step]"); if (t) { w.state.sel = t.dataset.step; os().render(w); return; }
        if (e.target.closest(".hn-more")) {
          const id = w.state.sel; if (!id) return;
          if (G.hintLevel(id) === 3 && !confirm("Willst du die Lösung für diesen Schritt wirklich sehen?")) return;
          G.revealHint(id);
        }
      });
    },
    onChange(w) { os().render(w); },
  };

  DL.apps = { explorer, lock, text, table, calendar, audio, image, mail, messenger, browser, terminal, deadline, hints };
})();
