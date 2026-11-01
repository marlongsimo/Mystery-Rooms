/*
 * DAS ARCHON-PROTOKOLL – Anwendungen
 * Jede App: { title(arg), icon(arg)?, w, h, cls?, render(w), opened(w)?, onChange(w)?, closed(w)? }
 */
window.AR = window.AR || {};
(() => {
  "use strict";
  const G = AR.game, N = AR.nodes, esc = MRDesktop.esc, snd = MRSound;
  const $ = (s, r = document) => r.querySelector(s);
  const os = () => AR.os;
  const lockMsg = (r) => (r.locked ? `<p class="lockmsg">${esc(r.text)}</p>` : "");
  function formResult(w, key, r, okText) { w.state[key] = r.ok ? { ok: true, text: okText || "" } : fail(r); os().render(w); }
  /* Live-Sperranzeige: os.js zählt alle [data-lockt] jede Sekunde herunter und zeichnet das Fenster bei 0 neu. */
  const lockSpan = (t) => `<span class="lock-t" data-lockt="${esc(t)}">${G.locks.fmt(G.locks.left(t))}</span>`;
  const lockLine = (t, label = "GESPERRT") => (G.locks.left(t) > 0 ? `<p class="lockmsg">${esc(label)} · noch ${lockSpan(t)} · Sicherheitsprotokoll</p>` : "");
  const msgHtml = (m) => {
    if (!m) return `<p class="msg" role="alert"></p>`;
    const lk = m.t && G.locks.left(m.t) > 0 ? ` Eingabe gesperrt · noch ${lockSpan(m.t)}` : "";
    return `<p class="msg ${m.ok ? "ok" : "bad"}" role="alert">${esc(m.text)}${lk}</p>`;
  };
  const EYE_O = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', EYE_C = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.3 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  const fail = (r) => ({ ok: false, text: r.base || r.text, t: r.target });

  /* ================= Bilder (SVG) ================= */
  const IMG = {
    harbour: `<svg viewBox="0 0 960 540"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05080f"/><stop offset="1" stop-color="#14233a"/></linearGradient></defs>
      <rect width="960" height="540" fill="url(#sky)"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 960}" cy="${(i * 53) % 200}" r="${i % 3 ? 0.8 : 1.4}" fill="#cfe3ff" opacity=".5"/>`).join("")}
      <g fill="#0b1220"><rect x="40" y="170" width="16" height="190"/><path d="M48 170 L200 150 L200 158 L56 180z"/><rect x="700" y="150" width="18" height="210"/><path d="M709 150 L880 128 L880 137 L718 160z"/></g>
      <g fill="#ffcf7a" opacity=".8"><circle cx="200" cy="154" r="3"/><circle cx="880" cy="132" r="3"/></g>
      <path d="M220 330 L760 330 L720 392 L260 392 Z" fill="#1d2a3c"/><rect x="300" y="282" width="80" height="48" fill="#24364d"/><rect x="390" y="290" width="200" height="40" fill="#8a3b2a"/><rect x="600" y="292" width="70" height="38" fill="#2f5a7a"/>
      <rect x="300" y="250" width="40" height="32" fill="#e8e2d0"/><rect x="306" y="258" width="8" height="6" fill="#ffd27a"/><rect x="320" y="258" width="8" height="6" fill="#ffd27a"/>
      <text x="645" y="380" font-family="DM Mono,monospace" font-size="7.5" fill="#d9e1ea" letter-spacing="1.2">KESTREL</text>
      <text x="653" y="388" font-family="DM Mono,monospace" font-size="4.2" fill="#a9b6c4">LIMASSOL</text>
      <rect y="392" width="960" height="148" fill="#060b14"/>${Array.from({ length: 22 }, (_, i) => `<rect x="${i * 44 + 8}" y="${400 + (i % 4) * 30}" width="${18 + (i % 3) * 8}" height="2" fill="#ffcf7a" opacity=".25"/>`).join("")}
      <rect x="840" y="330" width="90" height="10" fill="#2a3a50"/><text x="885" y="352" text-anchor="middle" font-family="DM Mono,monospace" font-size="5" fill="#7d8ea3">WALTERSHOF</text></svg>`,
    pass: `<svg viewBox="0 0 640 400"><rect width="640" height="400" fill="#e9e4d6"/><rect x="20" y="20" width="600" height="360" rx="14" fill="#c9d6c3" stroke="#8aa08a"/>
      <text x="40" y="58" font-family="DM Sans,sans-serif" font-size="18" fill="#2c3a2c">BUNDESREPUBLIK DEUTSCHLAND · REISEPASS</text><rect x="40" y="80" width="150" height="190" fill="#9fb0a0"/><circle cx="115" cy="150" r="38" fill="#6d7f6e"/><rect x="70" y="195" width="90" height="70" rx="30" fill="#6d7f6e"/>
      <g font-family="DM Mono,monospace" font-size="15" fill="#1f2a1f"><text x="215" y="105">Name: HALDEN</text><text x="215" y="132">Vorname: JONAS</text><text x="215" y="159">Geburtsdatum: 12.03.1979</text><text x="215" y="186">Wohnort: Hamburg</text><text x="215" y="213">Pass-Nr.: C4X91LK7P</text><text x="215" y="240">Gültig bis: 08.2031</text></g>
      <text x="40" y="330" font-family="DM Mono,monospace" font-size="13" fill="#3a4a3a">P&lt;D&lt;&lt;HALDEN&lt;&lt;JONAS&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text><text x="520" y="368" font-family="DM Mono,monospace" font-size="11" fill="#5a6a5a">PA-5517</text></svg>`,
    office: `<svg viewBox="0 0 800 500"><rect width="800" height="500" fill="#1a1d22"/><rect x="60" y="60" width="680" height="300" fill="#2a2f37"/><rect x="420" y="90" width="280" height="200" fill="#e8e4d8"/>
      <g font-family="cursive" font-size="20" fill="#244a8a"><text x="440" y="130">Nordkap → Meridian → ?</text><text x="440" y="165">„Fracht“ ohne Papiere</text><text x="440" y="200">Wer berichtet an wen?</text><text x="440" y="235">Anlage B !!</text></g>
      <rect x="100" y="380" width="600" height="20" fill="#3a3027"/><rect x="140" y="300" width="180" height="80" fill="#111"/><rect x="148" y="308" width="164" height="60" fill="#2b5a7a"/></svg>`,
    bank: `<svg viewBox="0 0 800 500"><rect width="800" height="500" fill="#0b0f18"/><rect x="120" y="80" width="560" height="360" fill="#1b2433"/>${Array.from({ length: 24 }, (_, i) => `<rect x="${150 + (i % 8) * 64}" y="${110 + Math.floor(i / 8) * 90}" width="40" height="60" fill="${i === 9 ? "#ffd58a" : "#243248"}"/>`).join("")}
      <text x="400" y="70" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="22" fill="#c9d4e2" letter-spacing="4">HAFENBANK NORDELBE</text><rect x="600" y="380" width="70" height="60" fill="#0e131c"/><text x="635" y="372" text-anchor="middle" font-family="DM Mono,monospace" font-size="10" fill="#8aa0b8">SEITENEINGANG</text>
      <rect x="540" y="420" width="120" height="34" rx="10" fill="#2a2f38"/><circle cx="560" cy="456" r="9" fill="#111"/><circle cx="640" cy="456" r="9" fill="#111"/><text x="20" y="490" font-family="DM Mono,monospace" font-size="12" fill="#aab4c0">28.10.2026 19:44</text></svg>`,
    kestrel: `<svg viewBox="0 0 800 500"><rect width="800" height="500" fill="#0a1220"/><path d="M80 300 L720 300 L680 380 L120 380Z" fill="#20324a"/><rect x="560" y="230" width="90" height="70" fill="#d9d4c4"/><rect x="150" y="260" width="380" height="40" fill="#7a3426"/>
      <text x="610" y="365" font-family="DM Mono,monospace" font-size="20" fill="#e4ecf4" letter-spacing="3">KESTREL</text><text x="618" y="378" font-family="DM Mono,monospace" font-size="10" fill="#9fb0c2">LIMASSOL</text>
      <rect x="40" y="380" width="720" height="16" fill="#3b4b60"/><text x="60" y="420" font-family="DM Mono,monospace" font-size="16" fill="#ffcf7a">LIEGEPLATZ 47</text></svg>`,
  };

  /* ================= Login (Kapitel 1) ================= */
  const login = {
    title: () => "Anmeldung · ARIS-ARCHIVE-07", icon: () => "lock", w: 420, h: 330, cls: "win-login",
    render(w) {
      const locked = G.locks.left("login") > 0, show = !!w.state.show;
      w.body.innerHTML = `<form class="login"><div class="avatar">HA</div><p class="login-user">h.aris</p>
        <div class="pw"><input class="field" type="${show ? "text" : "password"}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Kennwort" aria-label="Kennwort" ${locked ? "disabled" : ""}><button type="button" class="pw-eye" aria-label="${show ? "Kennwort verbergen" : "Kennwort anzeigen"}" title="${show ? "Kennwort verbergen" : "Kennwort anzeigen"}">${show ? EYE_C : EYE_O}</button></div>
        <button class="btn" type="submit" ${locked ? "disabled" : ""}>Anmelden</button>
        <p class="login-hint">Kennworthinweis: <b>„Wo sie liegt.“</b><br><small>Groß-/Kleinschreibung spielt keine Rolle.</small></p>${w.state.m ? msgHtml(w.state.m) : locked ? msgHtml({ ok: false, text: "Anmeldung gesperrt.", t: "login" }) : msgHtml(null)}</form>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        if (!e.target.closest(".pw-eye")) return;
        // Ohne Neuzeichnen umschalten, damit Eingabe und Fokus bleiben
        w.state.show = !w.state.show; const i = $("input", w.body), b = $(".pw-eye", w.body);
        i.type = w.state.show ? "text" : "password"; b.innerHTML = w.state.show ? EYE_C : EYE_O; b.setAttribute("aria-label", w.state.show ? "Kennwort verbergen" : "Kennwort anzeigen"); b.title = b.getAttribute("aria-label");
      });
      w.body.addEventListener("submit", (e) => {
        e.preventDefault();
        const r = G.login($("input", w.body).value);
        if (r.ok) { snd.play("unlock"); os().afterLogin(); os().close(w); } else { w.state.m = fail(r); w.state.n = (w.state.n || 0) + 1; w.body.innerHTML = ""; os().render(w); }
      });
    },
  };
  const sysinfo = {
    title: () => "Systeminformationen", icon: () => "info", w: 460, h: 300,
    render(w) { w.body.innerHTML = `<div class="doc"><pre class="doc-text">Host:              ARIS-ARCHIVE-07 (Archivrechner)
Betrieb:           Infrastruktur eines Dritten
Benutzer:          h.aris
Kennworthinweis:   „Wo sie liegt.“
Kennwortrichtlinie: Buchstaben, gefolgt von Ziffern.
                   Keine Leerzeichen. Groß-/Kleinschreibung egal.
Hintergrundbild:   harbour.jpg
Notfall-Terminal:  help · meta · decode</pre></div>`; },
  };

  /* ================= Explorer ================= */
  const PLACES = ["docs", "pics", "audio", "trash", "pruefung", "inquisition", "core"];
  const TYPES = { folder: "Ordner", txt: "Text", jpg: "Bild", wav: "Audio", ics: "Kalender", frag: "Fragment", invoice: "Rechnung", freight: "Frachtpapier", embargo: "Liste", imsg: "Nachricht", proto: "Protokoll", origin: "verschlüsselt" };
  const pathOf = (id) => { const p = []; let c = id; while (c) { p.unshift(c); c = N[c].parent; } return p; };
  const explorer = {
    title: (a) => (N[a] ? N[a].name : "Explorer"), icon: (a) => (a === "trash" ? "trash" : "folder"), w: 680, h: 440,
    render(w) {
      const cur = w.state.cur || w.arg, kids = G.children(cur);
      w.body.innerHTML = `<div class="ex"><nav class="ex-side">${PLACES.filter((p) => G.visible(p)).map((p) => `<button class="ex-place${pathOf(cur)[0] === p ? " on" : ""}" data-place="${p}">${AR.icon(p === "trash" ? "trash" : N[p].icon === "red" ? "redfolder" : "folder")}<span>${esc(N[p].name)}</span></button>`).join("")}</nav>
        <div class="ex-main"><div class="ex-path">${N[cur].parent ? `<button class="ex-up" aria-label="Eine Ebene höher">↑</button>` : ""}<span>${pathOf(cur).map((p) => esc(N[p].name)).join(" › ")}</span></div>
        <div class="ex-head"><span>Name</span><span>Geändert</span><span>Typ</span></div>
        <div class="ex-list">${kids.length ? kids.map((id) => { const n = N[id], locked = n.lock && !G.unlocked(id); return `<button class="ex-row${G.state.seen[id] ? "" : " fresh"}" data-node="${id}"><span class="ex-name">${AR.icon(AR.nodeIcon(id))}<span>${esc(n.name)}</span>${locked ? `<em class="ex-lock">gesperrt</em>` : ""}</span><span>${esc(n.date || "")}</span><span>${TYPES[n.type] || ""}</span></button>`; }).join("") : `<p class="ex-empty">Leer.</p>`}</div>
        <p class="ex-status">${kids.length} Element${kids.length === 1 ? "" : "e"} · Klick zum Öffnen</p></div></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const pl = e.target.closest("[data-place]"); if (pl) { w.state.cur = pl.dataset.place; os().render(w); return; }
        if (e.target.closest(".ex-up")) { w.state.cur = N[w.state.cur || w.arg].parent; os().render(w); }
      });
      os().activate(w.body, ".ex-row", (t) => {
        const id = t.dataset.node, n = N[id];
        if (n.type === "folder" && G.unlocked(id)) { G.state.seen[id] = true; w.state.cur = id; os().render(w); } else os().openNode(id);
      }, true);
    },
    onChange(w) { os().render(w); },
  };

  /* ================= Schloss ================= */
  const lock = {
    title: (a) => "Gesperrt · " + N[a].name, icon: () => "lock", w: 440, h: 270,
    render(w) {
      const L = N[w.arg].lock, left = G.locks.left(L.target);
      w.body.innerHTML = `<form class="lockbox"><div class="lock-ico">${AR.icon("lock")}</div><p>${esc(L.prompt)}</p>
        <input class="field code" autocomplete="off" aria-label="Eingabe" ${left > 0 ? "disabled" : ""}><button class="btn" type="submit" ${left > 0 ? "disabled" : ""}>Öffnen</button>
        ${left > 0 ? lockLine(L.target) : msgHtml(w.state.m)}</form>`;
      const i = $("input", w.body); if (i && !i.disabled) setTimeout(() => i.focus(), 30);
    },
    opened(w) {
      w.body.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = w.arg, r = G.tryNodeLock(id, $("input", w.body).value);
        if (r.ok) { snd.play("unlock"); os().close(w); AR.os.toast({ title: N[id].name + " geöffnet", kind: "ok" }); os().openNode(id); }
        else { w.state.m = fail(r); os().render(w); }
      });
    },
    onChange(w) { os().render(w); },
  };

  /* ================= Textansicht (auch Rechnungen, Frachtpapiere, Nachrichten) ================= */
  const tbl = (rows) => `<table class="kv">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>`;
  const text = {
    title: (a) => N[a].name, icon: (a) => AR.nodeIcon(a), w: 640, h: 470,
    render(w) {
      const n = N[w.arg];
      if (n.blockUntil && G.state.elapsed < n.blockUntil) { w.body.innerHTML = `<div class="doc"><p class="lockmsg">Datei gesperrt durch ns_observer · noch ${G.locks.fmt(n.blockUntil - G.state.elapsed)}</p></div>`; return; }
      let body = "";
      if (n.type === "invoice") {
        const r = AR.invoices[n.invoice];
        body = `<div class="paper"><h3>RECHNUNG ${esc(r.id)}</h3>${tbl([["Aussteller", r.issuer], ["Anschrift", r.issuerAddr], ["USt-IdNr. Aussteller", r.issuerVat], ["Empfänger", r.to], ["Anschrift Empfänger", r.toAddr]].concat(r.toVat ? [["USt-IdNr. Empfänger", r.toVat]] : []).concat([["Rechnungsdatum", r.date], ["Leistung", r.item], ["Betrag", r.net]]))}</div>`;
      } else if (n.type === "freight") {
        const f = AR.freight[n.freight];
        body = `<div class="paper"><h3>KONNOSSEMENT ${esc(f.id)}</h3>${tbl([["Schiff", f.ship], ["Datum", f.date], ["Abgangshafen", f.from], ["Bestimmung", f.to], ["Absender", f.shipper], ["Empfänger", f.consignee], ["Ware", f.goods], ["Warennummer (HS)", f.hs], ["Zahlung", f.booked]])}</div>`;
        if (f.id === "KN-2299") body += `<form class="finding"><label>Befund (Embargo-Code laut Liste): <input class="field" name="code" autocomplete="off" placeholder="z. B. X-0" ${G.side("N6") ? "disabled value=\"bestätigt\"" : ""}></label><button class="btn small" ${G.side("N6") ? "disabled" : ""}>Eintragen</button>${msgHtml(w.state.m)}</form>`;
      } else if (n.type === "embargo") {
        body = `<div class="paper"><h3>${esc(AR.embargo.title)}</h3><p>${esc(AR.embargo.note)}</p><table class="grid"><tr><th>Code</th><th>Warengruppe</th><th>Warennummern</th></tr>${AR.embargo.rows.map((r) => `<tr><td>${r.map(esc).join("</td><td>")}</td></tr>`).join("")}</table></div>`;
      } else if (n.type === "imsg") {
        const m = AR.imsgs[n.msg];
        body = `<div class="paper mono"><p>Message-ID: ${esc(m.id)}<br>From: ${esc(m.from)}<br>To: ${esc(m.to)}${m.cc ? `<br>Cc: ${esc(m.cc)}` : ""}<br>Date: ${esc(m.date)}<br>Subject: ${esc(m.subject)}</p><hr><p>${esc(m.text)}</p></div>`;
      } else if (n.type === "frag") {
        body = `<div class="doc"><p class="doc-meta">Fragment-ID: <b>${esc(n.frag)}</b> · beschädigt · nicht einzeln lesbar</p><pre class="doc-text dim">${esc(n.text)}</pre><p class="doc-meta">Wiederherstellen im Terminal: restore (help restore)</p></div>`;
      } else body = `<div class="doc"><p class="doc-meta">${esc(n.name)} · ${esc(n.date || "")}</p><pre class="doc-text">${esc(n.text || "")}</pre></div>`;
      w.body.innerHTML = body;
    },
    opened(w) {
      w.body.addEventListener("submit", (e) => { e.preventDefault(); if (e.target.matches(".finding")) { const r = G.freightFinding(e.target.code.value); w.state.m = r.ok ? { ok: true, text: "Befund bestätigt: Embargoverstoß." } : fail(r); if (r.ok) snd.play("unlock"); os().render(w); } });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input")) return; os().render(w); },
  };

  /* ================= Bildbetrachter ================= */
  const image = {
    title: (a) => N[a].name, icon: () => "jpg", w: 760, h: 520,
    render(w) {
      const n = N[w.arg], z = w.state.z || 1;
      w.body.innerHTML = `<div class="iv"><div class="iv-bar"><button class="btn small" data-z="-1">−</button><span class="iv-zoom">${Math.round(z * 100)} %</span><button class="btn small" data-z="1">+</button><button class="btn small ghost" data-z="0">Einpassen</button><button class="btn small ghost iv-info">${w.state.info ? "Details ausblenden" : "Details"}</button></div>
        <div class="iv-view"><div class="iv-pan" style="transform:translate(${w.state.x || 0}px,${w.state.y || 0}px) scale(${z})">${IMG[n.image] || ""}</div></div>
        ${w.state.info ? `<div class="iv-meta">${Object.entries(n.meta || {}).map(([k, v]) => `<p>${esc(k)}: ${esc(v)}</p>`).join("") || "<p>Keine Metadaten.</p>"}</div>` : ""}</div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const b = e.target.closest("[data-z]"); if (b) { const d = +b.dataset.z; if (!d) { w.state.z = 1; w.state.x = w.state.y = 0; } else w.state.z = Math.max(1, Math.min(8, (w.state.z || 1) * (d > 0 ? 1.6 : 1 / 1.6))); os().render(w); }
        if (e.target.closest(".iv-info")) { w.state.info = !w.state.info; os().render(w); }
      });
      w.body.addEventListener("wheel", (e) => { if (!e.target.closest(".iv-view")) return; e.preventDefault(); w.state.z = Math.max(1, Math.min(8, (w.state.z || 1) * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); os().render(w); }, { passive: false });
      w.body.addEventListener("pointerdown", (e) => {
        if (!e.target.closest(".iv-view")) return;
        const sx = e.clientX, sy = e.clientY, ox = w.state.x || 0, oy = w.state.y || 0, pan = $(".iv-pan", w.body);
        const mv = (ev) => { w.state.x = ox + ev.clientX - sx; w.state.y = oy + ev.clientY - sy; pan.style.transform = `translate(${w.state.x}px,${w.state.y}px) scale(${w.state.z || 1})`; };
        const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
      });
    },
  };

  /* ================= Mail ================= */
  const FOLDERS = [["in", "Posteingang"], ["backup", "Sicherung"], ["sent", "Gesendet"]];
  const mail = {
    title: () => (G.is("R3") ? "Mail · h.aris@aris-lund.de" : "Mail · eingeschränkt"), icon: () => "mail", w: 820, h: 520,
    render(w) {
      const stage = G.is("R3") ? 3 : 1, f = w.state.f || "in";
      const list = AR.mails.filter((m) => (stage === 1 ? m.stage === 1 : (m.stage <= 2 || G.chapter() >= m.stage)) && m.folder === f);
      const m = AR.mails.find((x) => x.id === w.state.sel);
      w.body.innerHTML = `<div class="ml${m ? " reading" : ""}"><nav class="ml-list">${stage === 1 ? `<p class="ml-note">Eingeschränkter Modus – nur 4 Nachrichten.</p>` : `<div class="ml-folders">${FOLDERS.map(([k, l]) => `<button class="${k === f ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>`}
        ${list.map((x) => `<button class="ml-item${x.id === w.state.sel ? " on" : ""}${G.state.seen["mail_" + x.id] ? "" : " unread"}" data-m="${x.id}"><b>${esc(x.from)}</b><span>${esc(x.subject)}</span><small>${esc(x.date)}</small></button>`).join("")}</nav>
        <article class="ml-read">${m ? `<button class="ml-back btn small ghost">← Liste</button><h3>${esc(m.subject)}</h3><p class="ml-from"><b>${esc(m.from)}</b> &lt;${esc(m.addr)}&gt; · ${esc(m.date)}</p>
          ${m.headers ? `<button class="btn small ghost ml-hdr">${w.state.hdr ? "Kopfzeilen ausblenden" : "Kopfzeilen anzeigen"}</button>${w.state.hdr ? `<pre class="ml-headers">${esc(m.headers)}</pre>` : ""}` : ""}
          <pre class="ml-body">${esc(m.body)}</pre>${m.attach ? `<p class="ml-att">Anhang: <button class="btn small ghost" data-att="${esc(m.attach)}">📎 ${esc(m.attach)}</button></p>${attInfo(w, m)}` : ""}` : `<p class="ml-empty">Nachricht wählen.</p>`}</article></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const it = e.target.closest(".ml-item"); if (it) { w.state.sel = it.dataset.m; w.state.hdr = false; w.state.att = null; G.state.seen["mail_" + it.dataset.m] = true; G.save(); os().render(w); return; }
        const fo = e.target.closest("[data-f]"); if (fo) { w.state.f = fo.dataset.f; w.state.sel = null; os().render(w); return; }
        if (e.target.closest(".ml-back")) { w.state.sel = null; os().render(w); }
        if (e.target.closest(".ml-hdr")) { w.state.hdr = !w.state.hdr; os().render(w); }
        const a = e.target.closest("[data-att]"); if (a) { w.state.att = a.dataset.att; os().render(w); }
      });
      w.body.addEventListener("submit", (e) => { e.preventDefault(); const r = G.brenner(e.target.pw.value); w.state.bm = r.ok ? null : fail(r); if (r.ok) snd.play("unlock"); os().render(w); });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input")) return; os().render(w); },
  };
  function attInfo(w, m) {
    if (w.state.att !== m.attach) return "";
    if (/^teil_/.test(m.attach)) return `<p class="ml-attinfo">${esc(m.attach)} · Fragment-ID ${esc(m.attach.slice(5, 8))} · Kopie des Fragments im Papierkorb</p>`;
    if (m.attach === "brenner_notizen.zip") {
      if (G.side("N8")) return `<pre class="ml-attinfo">NOTIZEN M. BRENNER (entschlüsselt)
- Zahlungen Nordkap → Meridian seit Oktober, immer knapp unter 50.000 €.
- Meridian hat in Valletta kein Lager, Argos hat kein Schiff für diese „Fracht“.
- Quelle in der Hafenbank: „Die Vorsitzende stellt dem Prüfer Fragen, die sie nicht stellen dürfte.“
- Ich veröffentliche erst, wenn ich eine unabhängige zweite Quelle habe.</pre>`;
      return `<form class="ml-attinfo zipform"><label>brenner_notizen.zip ist verschlüsselt. Kennwort: <input class="field" name="pw" autocomplete="off"></label><button class="btn small">Öffnen</button>${msgHtml(w.state.bm)}</form>`;
    }
    return "";
  }

  /* ================= Nachrichten (Messenger) ================= */
  const messenger = {
    title: () => "Nachrichten", icon: () => "messenger", w: 520, h: 420,
    render(w) {
      const items = [];
      if (G.state.flags.arisMsg) items.push({ from: "H. Aris (zeitgesteuert)", text: AR.aris.r13 });
      w.body.innerHTML = `<div class="ms">${items.length ? items.map((m) => `<div class="ms-msg"><small>${esc(m.from)}</small><p>${esc(m.text)}</p></div>`).join("") : `<p class="ms-empty">Keine Nachrichten.</p>`}</div>`;
      if (items.length && !G.state.seen.arisMsg) { G.state.seen.arisMsg = true; G.save(); setTimeout(() => os().paintIcons(), 0); }
    },
    onChange(w) { os().render(w); },
  };

  /* ================= Mediaplayer (Spektrogramm, rückwärts) ================= */
  const audio = {
    title: () => "Mediaplayer", icon: () => "audio", w: 760, h: 520,
    render(w) {
      const files = Object.keys(N).filter((id) => N[id].type === "wav" && G.visible(id));
      const cur = w.state.cur || (N[w.arg] ? w.arg : files[0]); w.state.cur = cur;
      const A = AR.audio[N[cur].audio], view = w.state.view || "wave";
      const rev = !!w.state.rev, rate = w.state.rate || 1;
      w.body.innerHTML = `<div class="ap"><nav class="ap-list">${files.map((f) => `<button class="ap-file${f === cur ? " on" : ""}" data-f="${f}">${AR.icon("wav")}<span>${esc(N[f].name)}</span></button>`).join("")}</nav>
        <div class="ap-main"><p class="ap-title">${esc(A.title)}</p>
        <div class="ap-tabs"><button data-v="wave" class="${view === "wave" ? "on" : ""}">Wellenform</button><button data-v="spec" class="${view === "spec" ? "on" : ""}">Spektrogramm</button><button data-v="info" class="${view === "info" ? "on" : ""}">Details</button></div>
        ${view === "spec" ? `<canvas class="spec" width="680" height="240" aria-label="Spektrogramm: Zeit waagerecht, Frequenz senkrecht"></canvas><p class="ap-axis">0 s → ${A.dur} s · unten 0 kHz, oben 8 kHz</p>
          ${A.spectro ? `<form class="ap-mark"><label>Auffälligkeit eintragen: <input class="field" name="w" autocomplete="off" ${G.is("R5") ? "disabled value=\"VELLUM (gesichert)\"" : ""}></label><button class="btn small" ${G.is("R5") ? "disabled" : ""}>Eintragen</button>${msgHtml(w.state.m)}</form>` : ""}`
        : view === "info" ? `<div class="ap-info">${Object.entries(N[cur].meta || { Datei: N[cur].name, Datum: N[cur].date || "" }).map(([k, v]) => `<p>${esc(k)}: ${esc(v)}</p>`).join("")}${A.place ? `<p>${esc(A.place)}</p>` : ""}</div>`
        : `<div class="wave">${Array.from({ length: 72 }, (_, i) => `<i style="height:${15 + Math.round(Math.abs(Math.sin(i * 1.7 + cur.length)) * 70)}%"></i>`).join("")}</div>`}
        <div class="ap-ctrl"><button class="btn ap-play">${w.state.playing ? "■ Stopp" : "▶ Abspielen"}</button><span class="ap-fx" role="group" aria-label="Wiedergabe"><button data-rate="0.5" class="${rate === 0.5 ? "on" : ""}">½×</button><button data-rate="1" class="${rate === 1 ? "on" : ""}">1×</button><button data-rate="2" class="${rate === 2 ? "on" : ""}">2×</button><button data-fx="rev" class="${rev ? "on" : ""}" title="Wiedergaberichtung umkehren">⇄ Umkehren</button></span><span class="ap-time">0:00 / ${Math.floor(A.dur / 60)}:${String(A.dur % 60).padStart(2, "0")}</span>${A.src ? "" : `<span class="ap-note">Aufnahme folgt – Transkript lesen</span>`}</div>
        <div class="ap-trans"><p class="ap-sub">Transkript</p>${rev && !A.backward ? `<p class="dim">(umgekehrte Wiedergabe – unverständlich)</p>` : A.transcript ? A.transcript.map(([t, s]) => `<p data-t="${t}"><b>${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}</b> ${esc(s)}</p>`).join("") : `<p>${esc(rev ? A.backward : A.forward)}</p>`}</div></div></div>`;
      if (view === "spec") drawSpec($("canvas.spec", w.body), A);
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const f = e.target.closest(".ap-file"); if (f) { stopAudio(w); w.state.cur = f.dataset.f; w.state.rev = false; w.state.rate = 1; os().render(w); return; }
        const rt = e.target.closest("[data-rate]"); if (rt) { w.state.rate = +rt.dataset.rate; if (w.state.el) w.state.el.playbackRate = w.state.rate; os().render(w); return; }
        if (e.target.closest('[data-fx="rev"]')) { stopAudio(w); w.state.rev = !w.state.rev; os().render(w); return; }
        const v = e.target.closest("[data-v]"); if (v) { w.state.view = v.dataset.v; os().render(w); return; }
        if (e.target.closest(".ap-play")) {
          const A = AR.audio[N[w.state.cur].audio];
          if (w.state.playing) { stopAudio(w); os().render(w); return; }
          if (A.backward && w.state.rev) { G.solveSide("N4"); G.addFound("Ida: „Er ist sicher. Frag nicht, wo.“"); }
          w.state.playing = true; os().render(w);
          const src = w.state.rev ? A.srcRev || (A.src && A.src.replace(".mp3", "_rev.mp3")) : A.src;
          if (src) playAudio(w, src, w.state.rate || 1);
          else { snd.play("beep"); if (A.spectro) { snd.tone(5200, 1.4, { vol: 0.03, at: 0.2 }); snd.noise(1.2, { vol: 0.08, freq: 3000, at: 0.1 }); } setTimeout(() => { w.state.playing = false; os().render(w); }, 1800); }
        }
      });
      w.offPause = AR.on("pause", (on) => { if (on && w.state.playing) { stopAudio(w); os().render(w); } });
      w.body.addEventListener("submit", (e) => { e.preventDefault(); const r = G.spectro(e.target.w.value); w.state.m = r.ok ? { ok: true, text: "Gesichert und in der Akte vermerkt." } : fail(r); if (r.ok) snd.play("unlock"); os().render(w); });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input[type=text],input:not([type])")) return; if (!w.state.playing) os().render(w); },
    closed(w) { stopAudio(w); if (w.offPause) w.offPause(); },
  };
  /* Echte Aufnahmen (archon/audio): Abspielen, Zeitanzeige, aktuelle Transkriptzeile hervorheben */
  function playAudio(w, src, rate = 1) {
    const el = new Audio(src); w.state.el = el; el.preservesPitch = false; el.mozPreservesPitch = false; el.webkitPreservesPitch = false; el.playbackRate = rate;
    const fmtT = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
    el.addEventListener("timeupdate", () => {
      const tEl = $(".ap-time", w.body); if (tEl) tEl.textContent = `${fmtT(el.currentTime)} / ${fmtT(el.duration || 0)}`;
      let cur = null; w.body.querySelectorAll(".ap-trans [data-t]").forEach((p) => { if (+p.dataset.t <= el.currentTime) cur = p; p.classList.remove("now"); });
      if (cur) cur.classList.add("now");
    });
    el.addEventListener("ended", () => { w.state.playing = false; w.state.el = null; os().render(w); });
    el.play().catch(() => { w.state.playing = false; os().render(w); });
  }
  function stopAudio(w) { if (w.state.el) { w.state.el.pause(); w.state.el = null; } w.state.playing = false; }
  function drawSpec(c, A) {
    if (!c || !c.getContext) return;
    const g = c.getContext("2d"), W = c.width, H = c.height;
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    g.fillStyle = "#05070c"; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 3) for (let y = 0; y < H; y += 3) {
      const low = 1 - y / H, speech = y > H * 0.55 ? 0.55 * Math.abs(Math.sin(x / 9)) : 0.08;
      const v = Math.min(1, rnd() * 0.25 + (low > 0.45 ? speech : 0.05));
      g.fillStyle = `rgba(${40 + v * 200},${30 + v * 120},${120 + v * 80},${v})`; g.fillRect(x, y, 3, 3);
    }
    if (A.spectro) {
      const [g0, g1] = A.gap || [70, 92], x0 = W * (g0 / A.dur), x1 = W * (g1 / A.dur);
      g.fillStyle = "rgba(255,240,200,.15)"; g.fillRect(x0, 0, x1 - x0, H);
      g.save(); g.fillStyle = "rgba(255,250,220,.92)"; g.font = "bold 30px DM Mono, monospace"; g.textBaseline = "middle";
      const yTop = H * (1 - 6 / 8), yBot = H * (1 - 4 / 8); // 4–6 kHz
      g.translate(x0 + 4, (yTop + yBot) / 2); g.scale((x1 - x0 - 8) / g.measureText(A.spectro).width, 1); g.fillText(A.spectro, 0, 0); g.restore();
      g.fillStyle = "rgba(200,220,255,.35)"; g.fillRect(x0, H * (1 - 7.2 / 8), x1 - x0, 2);
    }
    g.fillStyle = "#8aa0b8"; g.font = "10px DM Mono, monospace";
    [0, 2, 4, 6, 8].forEach((k) => g.fillText(k + " kHz", 4, H - (k / 8) * H + (k === 8 ? 10 : -2)));
  }

  /* ================= Kalender, Notizbuch, Systemlog ================= */
  const calendar = {
    title: () => "Kalender · H. Aris", icon: () => "ics", w: 520, h: 480,
    render(w) { w.body.innerHTML = `<div class="cal">${AR.calendar.map((c) => `<div class="cal-item${c.cancelled ? " cancelled" : ""}"><b>${esc(c.day)} ${esc(c.time)}</b><span>${esc(c.title)}<small>${esc(c.place)}</small></span></div>`).join("")}</div>`; },
  };
  const notebook = {
    title: () => "Notizbuch", icon: () => "note", w: 520, h: 420,
    render(w) {
      const p = w.state.p || 0, pg = AR.notebook[p];
      w.body.innerHTML = `<div class="nb"><div class="nb-tabs">${AR.notebook.map((x, i) => `<button class="${i === p ? "on" : ""}" data-p="${i}">${i + 1}</button>`).join("")}</div><h3>${esc(pg.title)}</h3><pre class="nb-page">${esc(pg.text)}</pre></div>`;
    },
    opened(w) { w.body.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { w.state.p = +b.dataset.p; os().render(w); } }); },
  };
  const syslog = {
    title: () => "Systemlog", icon: () => "log", w: 560, h: 380,
    render(w) {
      const ch = G.chapter(), L2 = ["22:47 REMOTE SESSION ESTABLISHED (unknown)", "22:47 TRACE STARTED"];
      if (G.state.login) L2.push("LOGIN h.aris");
      if (G.is("R3")) L2.push("AUTH OK · SECURITY LEVEL 02", "PROTOKOLLÜBERWACHUNG AKTIV");
      if (ch >= 3) L2.push("WARN: user ns_observer present (read-only)");
      if (ch >= 4) L2.push("ALERT: UNAUTHORIZED CORRELATION DETECTED", "ns_observer: SESSION WATCH", "ACCESS ATTEMPT from 10.12.4.7 (blocked)");
      if (ch >= 5) L2.push("ALERT: FINAL PURGE SEQUENCE ARMED");
      L2.push(`SECURITY LEVEL 0${G.level()} · TRACE ${G.fmt(G.remaining())}`);
      w.body.innerHTML = `<div class="term"><div class="term-out">${L2.map((l) => `<div class="tl${/ALERT|WARN/.test(l) ? " warn" : ""}">${esc(l)}</div>`).join("")}<div class="tl dim">Filter im Terminal: log --user &lt;name&gt;</div></div></div>`;
    },
    onChange(w) { os().render(w); },
  };

  /* ================= Terminal ================= */
  const terminal = {
    title: () => (G.state.login ? "Terminal" : "Notfall-Terminal"), icon: () => "terminal", w: 700, h: 440, cls: "win-term",
    render(w) {
      if (!w.state.lines) { w.state.lines = [{ t: G.state.login ? "ARIS-ARCHIVE-07 · Terminal" : "ARIS-ARCHIVE-07 · NOTFALL-TERMINAL (eingeschränkt)" }, { t: 'help zeigt alle Befehle, help <befehl> erklärt einen.', cls: "dim" }, { t: "" }]; w.state.hist = []; w.state.hi = 0; }
      w.body.innerHTML = `<div class="term"><div class="term-out">${w.state.lines.map((l) => `<div class="tl ${l.cls || ""}">${esc(l.t) || "&nbsp;"}</div>`).join("")}</div>
        <form class="term-in"><span class="term-ps">${G.state.login ? "h.aris" : "guest"}@archive:~$</span><input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Befehl"></form></div>`;
      const o = $(".term-out", w.body); o.scrollTop = o.scrollHeight;
    },
    opened(w) {
      const focus = () => { const i = $(".term-in input", w.body); if (i) i.focus(); };
      setTimeout(focus, 50);
      w.body.addEventListener("click", () => { if (!window.getSelection().toString()) focus(); });
      w.body.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = $(".term-in input", w.body).value;
        w.state.lines.push({ t: `$ ${v}`, cls: "cmd" });
        if (v.trim()) { w.state.hist.push(v); w.state.hi = w.state.hist.length; }
        const res = G.command(v);
        if (res.length && res[0].clear) w.state.lines = []; else w.state.lines.push(...res);
        os().render(w); focus();
      });
      w.body.addEventListener("keydown", (e) => {
        const i = e.target.closest(".term-in input"); if (!i) return;
        if (e.key === "ArrowUp" && w.state.hist.length) { w.state.hi = Math.max(0, w.state.hi - 1); i.value = w.state.hist[w.state.hi]; e.preventDefault(); }
        if (e.key === "ArrowDown" && w.state.hist.length) { w.state.hi = Math.min(w.state.hist.length, w.state.hi + 1); i.value = w.state.hist[w.state.hi] || ""; e.preventDefault(); }
        if (e.key.length === 1) snd.play("key");
      });
    },
  };

  /* ================= Browser: NORDSUCHE, Register, Hafen, Hafenbank ================= */
  const fold = (s) => String(s || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "");
  function lev(a, b) { const m = []; for (let i = 0; i <= b.length; i++) m[i] = [i]; for (let j = 0; j <= a.length; j++) m[0][j] = j; for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)); return m[b.length][a.length]; }
  function search(q) {
    const words = fold(q).split(/[^a-z0-9§-]+/).filter((x) => x.length > 1);
    if (!words.length) return [];
    return AR.wiki.map((a) => {
      const hay = [a.title, ...a.tags].map(fold), body = fold(a.what + " " + a.spot);
      let s = 0;
      for (const wd of words) {
        if (hay.some((h) => h === wd)) s += 10; else if (hay.some((h) => h.includes(wd) || wd.includes(h) && h.length > 3)) s += 6;
        else if (wd.length > 4 && hay.some((h) => h.split(/\s+/).some((p) => Math.abs(p.length - wd.length) <= 2 && lev(p, wd) <= 2))) s += 4;
        else if (body.includes(wd)) s += 1;
      }
      return { a, s };
    }).filter((x) => x.s >= 4).sort((x, y) => y.s - x.s).map((x) => x.a);
  }
  AR.search = search;
  const tool = (t) => t === "base64" ? `<form class="tool" data-tool="b64"><label>Base64 übersetzen: <input class="field" name="v" autocomplete="off"></label><button class="btn small">Übersetzen</button><output></output></form>`
    : t === "hex" ? `<form class="tool" data-tool="hex"><label>Hex → Dezimal: <input class="field" name="v" autocomplete="off" placeholder="z. B. C"></label><button class="btn small">Umrechnen</button><output></output></form>`
    : t === "mod" ? `<form class="tool" data-tool="mod"><label>Zahl <input class="field small" name="a" inputmode="numeric"> mod <input class="field small" name="n" value="16" inputmode="numeric"></label><button class="btn small">Rechnen</button><output></output></form>` : "";
  function articleHtml(a) {
    return `<article class="wk"><p class="wk-area">${esc(a.area)}</p><h2>${esc(a.title)}</h2>
      <h4>Was ist das?</h4><p>${esc(a.what)}</p><h4>Woran erkennt man es?</h4><p>${esc(a.spot)}</p><h4>Wie geht man vor?</h4><p>${esc(a.how)}</p>
      <h4>Beispiel</h4><p class="wk-ex">${esc(a.example)}</p>${a.tool ? tool(a.tool) : ""}
      ${a.see && a.see.length ? `<p class="wk-see">Siehe auch: ${a.see.map((id) => { const s = AR.wiki.find((x) => x.id === id); return s ? `<a href="#" data-art="${id}">${esc(s.title)}</a>` : ""; }).join(" · ")}</p>` : ""}</article>`;
  }
  const PAGES = {
    "nordsuche": (w) => {
      const q = w.state.q || "", res = q ? search(q) : null, art = w.state.art ? AR.wiki.find((a) => a.id === w.state.art) : null;
      const areas = [...new Set(AR.wiki.map((a) => a.area))];
      return `<div class="pg ns"><header class="ns-head"><b>NORDSUCHE</b><small>Wissensdatenbank der Kanzlei Aris &amp; Lund · ${AR.wiki.length} Artikel</small></header>
        <form class="ns-form"><input class="field" name="q" value="${esc(q)}" placeholder="Begriff suchen, z. B. Treuhand, Base64, Embargo …" autocomplete="off"><button class="btn small">Suchen</button></form>
        ${art ? articleHtml(art) : res ? (res.length ? `<p class="ns-count">${res.length} Treffer für „${esc(q)}“</p><ul class="ns-res">${res.map((a) => `<li><a href="#" data-art="${a.id}">${esc(a.title)}</a><small>${esc(a.area)}</small><p>${esc(a.what.slice(0, 150))}…</p></li>`).join("")}</ul>`
          : `<p class="ns-count">Keine Treffer für „${esc(q)}“. Versuch ein anderes Wort oder sieh dir die Themen an.</p>`) : ""}
        ${!art ? `<div class="ns-topics">${areas.map((ar) => `<section><h4>${esc(ar)}</h4>${AR.wiki.filter((a) => a.area === ar).map((a) => `<a href="#" data-art="${a.id}">${esc(a.title)}</a>`).join("")}</section>`).join("")}</div>` : ""}</div>`;
    },
    "register": (w) => {
      const ch3 = G.chapter() >= 3, firm = w.state.firm ? AR.firms[w.state.firm] : null, rs = w.state.rs;
      return `<div class="pg"><header class="pg-head"><b>REGISTER</b><small>Firmendaten (Spielwelt)</small></header>
        ${!ch3 ? `<p class="pg-locked">Registerzugang erst nach Freigabe der Prüfungsunterlagen.</p>` : `
        <h3>Inländische und Partner-Register</h3><div class="reg-list">${Object.entries(AR.firms).map(([k, f]) => `<button data-firm="${k}" class="${w.state.firm === k ? "on" : ""}">${esc(k)} · ${esc(f.name)}</button>`).join("")}</div>
        ${firm ? `<div class="paper">${tbl([["Firma", firm.name], ["Sitz", firm.address], ["Register", firm.reg], ["USt-IdNr.", firm.vat], ["IBAN", firm.iban], ["Vertretung", firm.officers], ["Gesellschafter", firm.owners], ["Gegründet", firm.founded], ["Geschäft", firm.business]])}<p><b>Historie:</b> ${firm.history.map(esc).join(" · ")}</p></div>` : ""}
        <h3>Ausländische Register</h3><p class="pg-tip">Abfrage nur über die exakte Registernummer.</p>
        <form class="reg-form"><input class="field" name="nr" placeholder="Registernummer" autocomplete="off"><button class="btn small">Abfragen</button></form>
        ${rs ? (rs.ok ? `<div class="paper ok">${tbl([["Name", rs.entry.name], ["Sitz", rs.entry.seat], ["Art", rs.entry.type], ["Errichtet", rs.entry.founded], ["Stifter/in", rs.entry.founder], ["Protektor", rs.entry.protector], ["Zweck", rs.entry.purpose]])}</div>` : `<p class="msg bad">${esc(rs.text)}</p>`) : ""}`}</div>`;
    },
    "hafen.intern": () => `<div class="pg"><header class="pg-head"><b>HAFEN-INTRANET</b><small>Lesezugang</small></header>
      <h3>Schiffspositionen (AIS, Auszug)</h3><table class="grid"><tr><th>Schiff</th><th>IMO</th><th>Zeitraum</th><th>Position</th></tr>${AR.ais.map((r) => `<tr><td>${r.map(esc).join("</td><td>")}</td></tr>`).join("")}</table>
      <h3>Geräuschkarte der Anleger</h3><p>Schiffshorn + Möwen + Kaimauer-Wellenschlag: typisch für den Anleger <b>Kehrwieder</b>, direkt neben der Hafenbank Nordelbe.</p></div>`,
    "hafenbank.intern": () => `<div class="pg"><header class="pg-head"><b>HAFENBANK NORDELBE</b><small>Intranet</small></header>
      <h3>Sitzungstermine des Aufsichtsrats 2026</h3><ul><li>Mi 16.09.2026, 18:00</li><li>Mi 14.10.2026, 18:00</li><li>Mi 28.10.2026, 18:00</li><li>Mi 25.11.2026, 18:00</li></ul>
      <p>Vorsitzende des Aufsichtsrats: Margarete Holm · Büro des Aufsichtsrats, 6. OG</p></div>`,
  };
  const MARKS = [["nordsuche", "NORDSUCHE"], ["register", "Register"], ["hafen.intern", "Hafen-Intranet"], ["hafenbank.intern", "Hafenbank"]];
  const browser = {
    title: () => "Browser", icon: () => "browser", w: 880, h: 580,
    render(w) {
      const url = w.state.url || (w.state.url = "nordsuche");
      w.body.innerHTML = `<div class="br"><div class="br-bar"><button class="btn small ghost br-back" ${(w.state.hist || []).length ? "" : "disabled"}>←</button><form class="br-url"><input class="field" value="${esc(url)}" aria-label="Adresse"></form></div>
        <nav class="br-marks">${MARKS.map(([u, l]) => `<button data-go="${u}">${l}</button>`).join("")}</nav><div class="br-page">${PAGES[url] ? PAGES[url](w) : `<div class="pg"><h3>Nicht erreichbar</h3><p>${esc(url)} ist von diesem Rechner aus nicht erreichbar.</p></div>`}</div></div>`;
    },
    opened(w) {
      const go = (u) => { u = fold(u).replace(/^https?:\/\//, "").replace(/\/$/, ""); if (u === w.state.url) return; (w.state.hist = w.state.hist || []).push(w.state.url); w.state.url = u; os().render(w); };
      w.body.addEventListener("click", (e) => {
        const g = e.target.closest("[data-go]"); if (g) { w.state.art = null; go(g.dataset.go); return; }
        if (e.target.closest(".br-back")) { const h = w.state.hist || []; if (h.length) { w.state.url = h.pop(); os().render(w); } return; }
        const a = e.target.closest("[data-art]"); if (a) { e.preventDefault(); w.state.art = a.dataset.art; os().render(w); $(".br-page", w.body).scrollTop = 0; return; }
        const f = e.target.closest("[data-firm]"); if (f) { w.state.firm = f.dataset.firm; os().render(w); }
      });
      w.body.addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target;
        if (f.matches(".br-url")) return go($("input", f).value);
        if (f.matches(".ns-form")) { w.state.q = f.q.value; w.state.art = null; os().render(w); return; }
        if (f.matches(".reg-form")) { w.state.rs = G.registerSearch(f.nr.value); if (w.state.rs.ok) snd.play("unlock"); os().render(w); return; }
        if (f.matches(".tool")) {
          const o = $("output", f); const t = f.dataset.tool;
          if (t === "b64") { try { o.textContent = "→ " + decodeURIComponent(escape(atob(f.v.value.trim()))); } catch (er) { o.textContent = "→ kein gültiges Base64"; } }
          if (t === "hex") { const s = f.v.value.trim().toUpperCase(); o.textContent = /^[0-9A-F]+$/.test(s) ? `→ ${s.split("").map((c) => `${c}=${parseInt(c, 16)}`).join(" · ")}` : "→ nur 0–9 und A–F"; }
          if (t === "mod") { const a = parseInt(f.a.value, 10), n = parseInt(f.n.value, 10); o.textContent = n > 0 && !isNaN(a) ? `→ ${a} mod ${n} = ${((a % n) + n) % n}` : "→ Zahlen eingeben"; }
        }
      });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input")) return; os().render(w); },
  };

  /* ================= LEDGER ================= */
  const COLS = [["id", "ID"], ["date", "Datum"], ["time", "Zeit"], ["amount", "Betrag"], ["from", "Absender"], ["to", "Empfänger"], ["ref", "Rechnung"], ["purpose", "Verwendungszweck"]];
  const dkey = (t) => t.date.split(".").reverse().join("") + t.time;
  const eur = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ledger = {
    title: () => "LEDGER · Transaktionsanalyse", icon: () => "ledger", w: 980, h: 600, cls: "win-ledger",
    render(w) {
      const tab = w.state.tab || "tx";
      const tabs = [["tx", "Buchungen"], ["firms", "Firmen"], ["net", "Netzwerk"], ["trace", "Rückverfolgung"]];
      let body = "";
      if (tab === "tx") {
        const f = w.state.f || {}, s = w.state.sort || ["id", 1], marks = G.state.marks;
        let rows = AR.ledger.filter((t) => COLS.every(([k]) => !f[k] || fold(k === "amount" ? eur(t[k]) : t[k]).includes(fold(f[k]))));
        rows.sort((a, b) => { const k = s[0]; const va = k === "amount" ? a.amount : k === "date" ? dkey(a) : String(a[k]); const vb = k === "amount" ? b.amount : k === "date" ? dkey(b) : String(b[k]); return (va > vb ? 1 : va < vb ? -1 : 0) * s[1]; });
        const sum = AR.ledger.filter((t) => marks[t.id]).reduce((a, t) => a + t.amount, 0), nm = Object.values(marks).filter(Boolean).length;
        body = `<div class="lg-tools"><span>${rows.length} von ${AR.ledger.length} Buchungen</span><span>Markiert: ${nm} · Summe ${eur(sum)} EUR</span><button class="btn small ghost" data-clear>Filter löschen</button>${nm ? `<button class="btn small ghost" data-unmark>Markierungen aufheben</button><button class="btn small" data-tab="trace">Markierte als Kette prüfen →</button>` : ""}</div>
          <div class="lg-scroll"><table class="lg"><thead><tr><th></th>${COLS.map(([k, l]) => `<th><button data-sort="${k}">${l}${s[0] === k ? (s[1] > 0 ? " ▲" : " ▼") : ""}</button><input class="field tiny" data-filter="${k}" value="${esc(f[k] || "")}" placeholder="Filter"></th>`).join("")}<th>auto</th></tr></thead>
          <tbody>${rows.map((t) => `<tr class="${marks[t.id] ? "mk" : ""}"><td><input type="checkbox" data-mark="${t.id}" ${marks[t.id] ? "checked" : ""} aria-label="markieren"></td><td>${t.id}</td><td>${t.date}</td><td>${t.time}</td><td class="num">${eur(t.amount)}</td><td>${esc(t.from)}</td><td>${esc(t.to)}</td><td>${esc(t.ref || "–")}</td><td>${esc(t.purpose)}</td><td><button class="auto${G.state.autoFlags[t.id] ? " on" : ""}" data-auto="${t.id}" title="als automatisiert markieren">⚙</button></td></tr>`).join("")}</tbody></table></div>`;
      } else if (tab === "firms") {
        body = `<div class="lg-firms">${Object.entries(AR.firms).map(([k, f]) => `<div class="paper"><h4>${esc(k)} · ${esc(f.name)}</h4>${tbl([["Sitz", f.seat], ["IBAN", f.iban], ["Gesellschafter", f.owners], ["Vertretung", f.officers]])}</div>`).join("")}</div>`;
      } else if (tab === "net") {
        body = `<p class="lg-tip">Firmen als Karten. Werkzeug „Faden“: zwei Karten antippen, um eine Verbindung zu ziehen. Verbindungen sind nur Arbeitsmaterial.</p><div class="lg-board"></div>`;
      } else {
        body = traceView(w);
      }
      w.body.innerHTML = `<div class="lg-wrap"><nav class="lg-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`).join("")}</nav>${body}</div>`;
      if (tab === "net") mountNet(w);
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const t = e.target.closest("[data-tab]"); if (t) { w.state.tab = t.dataset.tab; os().render(w); return; }
        const so = e.target.closest("[data-sort]"); if (so) { const k = so.dataset.sort, s = w.state.sort || ["id", 1]; w.state.sort = [k, s[0] === k ? -s[1] : 1]; os().render(w); return; }
        if (e.target.closest("[data-clear]")) { w.state.f = {}; os().render(w); return; }
        if (e.target.closest("[data-unmark]")) { Object.keys(G.state.marks).forEach((k) => G.setMark(k, false)); w.state.m = null; return; }
        const um = e.target.closest("[data-unmark-one]"); if (um) { G.setMark(um.dataset.unmarkOne, false); w.state.m = null; return; }
        if (e.target.closest("[data-chain]")) { const r = G.traceChain(Object.keys(G.state.marks)); w.state.m = r.ok ? null : { ok: false, text: r.base || r.text, t: r.target }; if (r.ok) snd.play("unlock"); os().render(w); return; }
        const au = e.target.closest("[data-auto]"); if (au) { G.flagAuto(au.dataset.auto); os().render(w); }
      });
      w.body.addEventListener("change", (e) => { const m = e.target.closest("[data-mark]"); if (m) { G.setMark(m.dataset.mark, m.checked); w.state.m = null; } });
      w.body.addEventListener("input", (e) => {
        const fi = e.target.closest("[data-filter]"); if (!fi) return;
        (w.state.f = w.state.f || {})[fi.dataset.filter] = fi.value;
        const k = fi.dataset.filter, pos = fi.selectionStart; os().render(w);
        const again = w.body.querySelector(`[data-filter="${k}"]`); if (again) { again.focus(); again.setSelectionRange(pos, pos); }
      });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input:not([type=checkbox])")) return; os().render(w); if (w.state.board && G.is("R9") && !w.state.board.has("kestrel")) w.state.board.pin({ id: "kestrel", kind: "doc", title: "Stiftung Kestrel", sub: "Vaduz · " + AR.kestrel.number }); },
  };
  /** Reiter „Rückverfolgung“: markierte Buchungen als Kette prüfen (R8). */
  function traceView(w) {
    const rule = `<ol class="tr-rules"><li>Empfänger einer Buchung = Absender der nächsten</li><li>1 bis 3 Tage später</li><li>Betrag = vorheriger Betrag minus 1,5 % (auf Cent)</li></ol>`;
    if (G.is("R8") && G.state.route) {
      const tx = G.state.route.map((id) => AR.ledger.find((t) => t.id === id)), route = G.routeOf(tx);
      return `<div class="lg-trace"><h3>Rückverfolgung bestätigt</h3><p class="msg ok">Die Kette ist lückenlos. Die Route läuft über vier Konten.</p>
        <div class="tr-route">${route.map((k, i) => `<div class="tr-st"><b>${esc(k)}</b><small>${esc(AR.firms[k] ? AR.firms[k].name : "")}</small><span>Prüfziffer ${esc(G.checkDigit(k))}</span></div>${i < route.length - 1 ? `<i>→ ${esc(tx[i].id)}</i>` : ""}`).join("")}</div>
        <p class="tr-code">Stationen-Code: <b>${route.map(G.checkDigit).join("")}</b></p><p class="dim">Der Code steht auch in der Akte.</p></div>`;
    }
    if (G.is("R8")) return `<div class="lg-trace"><h3>Rückverfolgung bestätigt</h3><p class="tr-code">Stationen-Code: <b>42178805</b></p></div>`;
    const tx = Object.keys(G.state.marks).map((id) => AR.ledger.find((t) => t.id === id)).filter(Boolean).sort((a, b) => dkey(a).localeCompare(dkey(b)));
    const probs = tx.length > 1 ? G.chainLinks(tx) : [];
    const left = G.locks.left("ledger");
    return `<div class="lg-trace"><h3>Rückverfolgung</h3><p>Markiere im Reiter „Buchungen“ einen vollständigen Durchlauf des Geldes und prüfe ihn hier. Eine gültige Kette erfüllt:</p>${rule}
      ${tx.length ? `<table class="tr-tab"><tr><th>Buchung</th><th>Datum</th><th>Von → An</th><th class="num">Betrag</th><th>Verbindung zur vorigen</th><th></th></tr>${tx.map((t, i) => `<tr><td>${t.id}</td><td>${t.date}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td class="num">${eur(t.amount)}</td><td>${i === 0 ? "–" : probs[i - 1] ? `<span class="bad">✗ ${esc(probs[i - 1])}</span>` : `<span class="ok">✓ passt</span>`}</td><td><button class="hx" data-unmark-one="${t.id}" aria-label="Markierung entfernen">×</button></td></tr>`).join("")}</table>` : `<p class="dim">Noch keine Buchung markiert.</p>`}
      <p><button class="btn" data-chain ${left > 0 || !tx.length ? "disabled" : ""}>Kette prüfen</button></p>${left > 0 ? lockLine("ledger", "Analysemodul gesperrt") : msgHtml(w.state.m)}</div>`;
  }
  function mountNet(w) {
    const el = $(".lg-board", w.body);
    if (!el || el === w.state.boardEl) return;
    w.state.boardEl = el;
    const pos = { "CORV-08": [700, 120], "SARN-06": [420, 120], "VELL-03": [140, 120], "NORD-01": [140, 420], "MERC-04": [420, 420], "ARGO-07": [700, 420], "LUX-02": [980, 420], "HALD-05": [980, 120] };
    const cards = Object.entries(AR.firms).map(([k, f]) => ({ id: k, type: "card", kind: "doc", title: k, sub: f.name, x: pos[k][0], y: pos[k][1], rot: 0 }));
    w.state.board = MRBoard.mount({ el, template: { cards, threads: [] }, store: MRBoard.localStore("archon_net_v1"), surface: { w: 1400, h: 760 } });
    if (G.is("R9") && !w.state.board.has("kestrel")) w.state.board.pin({ id: "kestrel", kind: "doc", title: "Stiftung Kestrel", sub: "Vaduz · " + AR.kestrel.number });
  }

  /* ================= Ermittlungsakte ================= */
  const akte = {
    title: () => "Ermittlungsakte", icon: () => "akte", w: 760, h: 560,
    render(w) {
      const tab = w.state.tab || "ev", S = G.state;
      const tabs = [["ev", "Beweismittel"], ["notes", "Erkenntnisse"], ["links", "Verbindungen"], ["hyp", "Hypothesen"]];
      let body = "";
      if (tab === "ev") {
        const e = G.evidence();
        body = `<p class="ak-sum">Beweistiefe: <b>${e.pts} von 12</b> · Kategorien: ${Object.entries(AR.CATS).map(([k, l]) => `<span class="cat${e.cats.has(k) ? " on" : ""}">${l}</span>`).join("")}</p>
          <ul class="ak-list">${S.found.map((f) => `<li>${esc(f)}</li>`).join("") || "<li class=\"dim\">Noch keine Fundstücke.</li>"}</ul>`;
      } else if (tab === "notes") body = `<textarea class="field ak-notes" placeholder="Eigene Erkenntnisse – nur für dich, wird gespeichert.">${esc(S.akte.notes)}</textarea>`;
      else if (tab === "links") body = `<p class="lg-tip">Fundstücke als Karten, Fäden für Verbindungen, Notizen frei. Reines Arbeitsmaterial.</p><div class="ak-board"></div>`;
      else body = `<form class="ak-hform"><input class="field" name="h" placeholder="Neue Hypothese, z. B. „Holm weiß mehr, als sie sagt“" autocomplete="off"><button class="btn small">Hinzufügen</button></form>
        <ul class="ak-hyps">${S.akte.hypos.map((h, i) => `<li><button class="hs ${h.s}" data-h="${i}">${h.s === "ok" ? "bestätigt" : h.s === "no" ? "widerlegt" : "offen"}</button><span>${esc(h.t)}</span><button class="hx" data-hx="${i}" aria-label="entfernen">×</button></li>`).join("")}</ul>`;
      w.body.innerHTML = `<div class="ak"><nav class="lg-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`).join("")}</nav>${body}</div>`;
      if (tab === "links") mountAkte(w);
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const t = e.target.closest("[data-tab]"); if (t) { w.state.tab = t.dataset.tab; os().render(w); return; }
        const h = e.target.closest("[data-h]"); if (h) { const x = G.state.akte.hypos[+h.dataset.h]; x.s = x.s === "open" ? "ok" : x.s === "ok" ? "no" : "open"; G.save(); os().render(w); return; }
        const hx = e.target.closest("[data-hx]"); if (hx) { G.state.akte.hypos.splice(+hx.dataset.hx, 1); G.save(); os().render(w); }
      });
      w.body.addEventListener("input", (e) => { if (e.target.matches(".ak-notes")) { G.state.akte.notes = e.target.value; G.save(); } });
      w.body.addEventListener("submit", (e) => { e.preventDefault(); const v = e.target.h.value.trim(); if (v) { G.state.akte.hypos.push({ t: v, s: "open" }); G.save(); os().render(w); } });
    },
    onChange(w) { const a = document.activeElement; if (a && w.body.contains(a) && a.matches("input,textarea")) return; os().render(w); if (w.state.board) pinFound(w); },
  };
  function mountAkte(w) {
    const el = $(".ak-board", w.body);
    if (!el || el === w.state.boardEl) return;
    w.state.boardEl = el;
    w.state.board = MRBoard.mount({ el, template: { cards: [], threads: [] }, store: MRBoard.localStore("archon_akte_v1"), surface: { w: 1600, h: 1000 } });
    pinFound(w);
  }
  function pinFound(w) { G.state.found.forEach((f, i) => { const id = "f" + i; if (!w.state.board.has(id)) w.state.board.pin({ id, kind: "doc", title: f.split(":")[0].slice(0, 40), sub: f.includes(":") ? f.split(":").slice(1).join(":").trim().slice(0, 60) : "" }); }); }

  /* ================= Hinweise ================= */
  const HN_STEPS = ["Orientierung", "Methode", "Konkrete Hilfe", "Lösungsweg"];
  const hints = {
    title: () => "Hinweise", icon: () => "hints", w: 520, h: 480,
    render(w) {
      const open = G.openPuzzles();
      if (!open.length) { w.body.innerHTML = `<div class="hn"><p>Gerade gibt es kein offenes Haupträtsel.</p></div>`; return; }
      if (!open.find((p) => p.id === w.state.sel)) w.state.sel = open[0].id;
      const p = open.find((x) => x.id === w.state.sel), lv = G.state.hints[p.id] || 0;
      w.body.innerHTML = `<div class="hn"><p class="hn-note">Kapitel ${G.chapter()} · ${G.hintsUsed()} Hinweise genutzt · vier Stufen je Rätsel, von „wo suchen“ bis zum Lösungsweg. Hinweise kosten Wertungspunkte, keine Zeit. Fachbegriffe erklärt die NORDSUCHE kostenlos.</p>
        ${open.length > 1 ? `<div class="hn-tabs">${open.map((x) => `<button class="btn small ${x.id === p.id ? "" : "ghost"}" data-sel="${x.id}">${esc(x.label)}</button>`).join("")}</div>` : ""}
        <h4>${esc(p.label)}</h4>${p.goal ? `<p class="hn-goal">Ziel: ${esc(p.goal)}</p>` : ""}${p.hints.slice(0, lv).map((h, i) => `<p class="hn-hint${i === 3 ? " sol" : ""}"><b>Stufe ${i + 1} · ${HN_STEPS[i]}</b>${esc(h)}</p>`).join("")}
        ${lv < p.hints.length ? `<button class="btn hn-more">${lv ? `Stufe ${lv + 1} zeigen: ${HN_STEPS[lv]}` : "Stufe 1 zeigen: Orientierung"}</button>${lv === 2 ? `<p class="hn-note">Stufe 4 zeigt den vollständigen Lösungsweg.</p>` : ""}` : `<p class="hn-note">Alle Stufen aufgedeckt.</p>`}</div>`;
    },
    opened(w) { w.body.addEventListener("click", (e) => { const s = e.target.closest("[data-sel]"); if (s) { w.state.sel = s.dataset.sel; os().render(w); return; } if (e.target.closest(".hn-more")) G.revealHint(w.state.sel); }); },
    onChange(w) { os().render(w); },
  };

  /* ================= Kapitel 4: fremdes Fenster ================= */
  const watch = {
    title: () => "ARCHON · SITZUNGSÜBERWACHUNG", icon: () => "eye", w: 460, h: 260, cls: "win-watch",
    render(w) { w.body.innerHTML = `<div class="watch"><p class="w-k">ns_observer</p><p>WIR SEHEN DICH.</p><p class="w-sub">Sitzung ARIS-ARCHIVE-07 wird gespiegelt. Rückverfolgung läuft.</p><p class="w-dim">Fenster-ID: archon-watch</p></div>`; },
    opened() { G.setFlag("watchSeen"); },
  };

  /* ================= Kapitel 5: Masterprotokoll und Ursprung ================= */
  const proto = {
    title: () => "master.proto", icon: () => "proto", w: 520, h: 420,
    render(w) {
      const P = AR.proto;
      const okSum = (b) => [0, 1, 2].reduce((a, k) => a + parseInt(b[k], 16), 0) % 16 === parseInt(b[3], 16);
      w.body.innerHTML = `<div class="doc"><p class="doc-meta">Sicherungsprotokoll · 8 Blöcke · Reparatur im Terminal: repair &lt;block&gt; &lt;wert&gt;</p>
        <p class="pr-rule">Prüfregel (Prüfbericht, Anhang): Die <b>vierte Stelle</b> jedes Blocks ist die Summe der ersten drei Stellen <b>mod 16</b>. Hex-Ziffern: A=10, B=11, C=12, D=13, E=14, F=15.</p>
        <table class="grid proto">${P.blocks.map((b, i) => { const fixed = G.state.proto[i + 1], v = fixed ? P.fixes[i + 1] : b, ok = fixed || okSum(b); return `<tr class="${ok ? "" : "pr-bad"}"><td>Block ${i + 1}</td><td class="mono">${v}</td><td>${fixed ? "✓ repariert" : ok ? "Prüfsumme stimmt" : "✗ Prüfsumme falsch"}</td></tr>`; }).join("")}</table>
        ${G.is("R14") ? `<p class="msg ok">Protokoll lesbar.<br><b>MASTER = &lt;ZUGANG&gt;-&lt;TON&gt;-&lt;STATIONEN&gt;-&lt;ORDNUNG&gt;</b></p>` : `<p class="dim">Rechne für jeden defekten Block die richtige vierte Stelle aus und ersetze den Block im Terminal.</p>`}</div>`;
    },
    onChange(w) { os().render(w); },
  };
  const origin = {
    title: () => "ARCHON_ORIGIN", icon: () => "red", w: 760, h: 560, cls: "win-origin",
    render(w) {
      if (!G.is("R15")) { w.body.innerHTML = `<div class="doc"><p class="lockmsg">ARCHON_ORIGIN.enc ist verschlüsselt. Entschlüsseln im Terminal: decrypt ARCHON_ORIGIN --key &lt;schlüssel&gt;</p></div>`; return; }
      const e = G.evidence();
      w.body.innerHTML = `<div class="origin"><p class="w-k">ARCHON_ORIGIN · ENTSCHLÜSSELT</p>
        <ul><li>Stiftungsurkunde Stiftung Kestrel – Stifterin: <b>Margarete Holm</b></li><li>Zahlungsplan Nordkap → Meridian → Argos → Luxor → Corvane</li><li>Anweisungen von Nordstern an Anker, 2024–2026</li></ul>
        <p class="o-ev">Deine Beweistiefe: ${e.pts} von 12 · Kategorien: ${e.cats.size} von 4${e.n8 ? " · unabhängiger Pressekontakt vorhanden" : ""}</p>
        <div class="o-choice"><button class="btn big" data-c="A"><b>A · DIE WAHRHEIT</b><small>Beweise an die Staatsanwaltschaft Hamburg übertragen. Deine Identität wird bekannt.</small></button>
        <button class="btn big danger" data-c="B"><b>B · DIE AUSLÖSCHUNG</b><small>ARCHON-WORM starten. Netz zerstören, Beweise vernichten. Du bleibst unerkannt.</small></button></div>
        <div class="o-confirm" hidden></div></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const c = e.target.closest("[data-c]");
        if (c) { const box = $(".o-confirm", w.body); box.hidden = false; box.innerHTML = `<p>Endgültig ${c.dataset.c === "A" ? "die Beweise übertragen" : "ARCHON-WORM starten"}? Das lässt sich nicht rückgängig machen.</p><button class="btn ghost" data-no>Abbrechen</button> <button class="btn" data-yes="${c.dataset.c}">Bestätigen</button>`; return; }
        if (e.target.closest("[data-no]")) { $(".o-confirm", w.body).hidden = true; return; }
        const y = e.target.closest("[data-yes]"); if (y) G.decide(y.dataset.yes);
      });
    },
    onChange(w) { const b = $(".o-confirm", w.body); if (b && !b.hidden) return; os().render(w); },
  };

  /* ================= Rechnungsabgleich (R10): Rechnung · Buchung · Register in einem Fenster ================= */
  const regBox = (k, role) => {
    const f = k && AR.firms[k];
    if (!f) return `<div class="ab-reg"><h5>${esc(role)}</h5><p class="dim">Externer Dienstleister – nicht im Firmenregister.</p></div>`;
    return `<div class="ab-reg"><h5>${esc(role)} · Register ${esc(k)}</h5>${tbl([["Name heute", f.name], ["Anschrift", f.address], ["USt-ID", f.vat || "–"], ["Historie", (f.history || []).join(" · ")]])}</div>`;
  };
  const abgleich = {
    title: () => "Rechnungsabgleich · PRUEFUNG", icon: () => "invoice", w: 1040, h: 600, cls: "win-abgleich",
    render(w) {
      const invs = AR.invoices, cur = invs.find((x) => x.id === w.state.cur) || invs[0]; w.state.cur = cur.id;
      G.state.invSeen[cur.id] = true;
      const t = AR.ledger.find((x) => x.id === cur.tx), mk = G.state.invMarks, done = G.is("R10"), left = G.locks.left("R10");
      w.body.innerHTML = `<div class="ab">
        <nav class="ab-list"><p class="ab-k">Rechnungen (6)</p>${invs.map((x) => `<button class="ab-item${x.id === cur.id ? " on" : ""} ${mk[x.id] || ""}" data-inv="${x.id}"><b>${esc(x.id)}</b><small>${esc(x.issuer)}</small>${mk[x.id] === "bad" ? `<em>Fehler notiert</em>` : mk[x.id] === "ok" ? `<em>stimmig?</em>` : ""}</button>`).join("")}
          <p class="ab-tip">Fünf Rechnungen haben genau einen Fehler. Vergleiche Betrag und Datum mit der Buchung, Anschrift, USt-ID und Firmennamen mit dem Register.</p></nav>
        <section class="ab-doc paper"><h4>RECHNUNG ${esc(cur.id)}</h4>${tbl([["Aussteller", cur.issuer], ["Anschrift Aussteller", cur.issuerAddr], ["USt-ID Aussteller", cur.issuerVat], ["Empfänger", cur.to], ["Anschrift Empfänger", cur.toAddr], ...(cur.toVat ? [["USt-ID Empfänger", cur.toVat]] : []), ["Rechnungsdatum", cur.date], ["Leistung", cur.item], ["Betrag", cur.net]])}
          <div class="ab-acts"><button class="btn small ghost" data-im="bad">Fehler gefunden</button><button class="btn small ghost" data-im="ok">Wirkt stimmig</button><button class="btn small ghost" data-im="">Notiz löschen</button></div>
          ${done ? `<p class="msg ok">Abgleich abgeschlossen: ${esc("AR-2026-118")} ist die einzige stimmige Rechnung.</p>` : `<button class="btn" data-confirm ${left > 0 ? "disabled" : ""}>Als einzige stimmige Rechnung bestätigen</button>${left > 0 ? lockLine("R10") : msgHtml(w.state.m)}`}</section>
        <section class="ab-side"><div class="ab-tx"><h5>Buchung laut LEDGER</h5>${t ? tbl([["ID", t.id], ["Datum", t.date + " " + t.time], ["Betrag", eur(t.amount) + " EUR"], ["Von → An", t.from + " → " + t.to], ["Verwendungszweck", t.purpose]]) : `<p class="dim">Keine Buchung gefunden.</p>`}</div>
          ${regBox(cur.issuerKey, "Aussteller")}${regBox(cur.toKey, "Empfänger")}</section></div>`;
    },
    opened(w) {
      w.body.addEventListener("click", (e) => {
        const it = e.target.closest("[data-inv]"); if (it) { w.state.cur = it.dataset.inv; w.state.m = null; os().render(w); return; }
        const im = e.target.closest("[data-im]"); if (im) { if (im.dataset.im) G.state.invMarks[w.state.cur] = im.dataset.im; else delete G.state.invMarks[w.state.cur]; G.save(); os().render(w); return; }
        if (e.target.closest("[data-confirm]")) {
          const r = G.tryNodeLock("abgleich", w.state.cur);
          if (r.ok) { snd.play("unlock"); os().render(w); AR.os.toast({ title: "abgleich_final.enc geöffnet", kind: "ok" }); os().openNode("abgleich"); }
          else { w.state.m = { ok: false, text: r.locked ? r.base : "Diese Rechnung ist nicht stimmig.", t: r.target }; os().render(w); }
        }
      });
    },
    onChange(w) { os().render(w); },
  };

  AR.apps = { login, sysinfo, explorer, lock, text, image, mail, messenger, audio, calendar, notebook, syslog, terminal, browser, ledger, akte, hints, watch, proto, origin, abgleich };
  AR.IMG = IMG;
})();
