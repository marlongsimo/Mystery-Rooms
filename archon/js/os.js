/*
 * DAS ARCHON-PROTOKOLL – Oberfläche: Titel, Verbindungsaufbau, Sperrbildschirm, Desktop,
 * Kopfleiste (Level, TRACE, Pause), Symbole, Ereignisse, Atmosphäre, Enden.
 */
window.AR = window.AR || {};
(() => {
  "use strict";
  const G = AR.game, N = AR.nodes, snd = MRSound, esc = MRDesktop.esc;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Symbole ---------- */
  const IC = {
    folder: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#2c6d8f"/><path d="M4 18h40v22H4z" fill="#3c8db5"/></svg>`,
    redfolder: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#7a1f24"/><path d="M4 18h40v22H4z" fill="#b3313a"/></svg>`,
    lockfolder: `<svg viewBox="0 0 48 48"><path d="M4 12h15l4 5h21v23H4z" fill="#3a4a58"/><path d="M4 18h40v22H4z" fill="#4c6072"/><rect x="18" y="25" width="12" height="10" rx="1.5" fill="#0b1118"/><path d="M20.5 25v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#0b1118" stroke-width="2"/></svg>`,
    txt: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#dfe6ee"/><path d="M30 4v8h8" fill="#aab6c4"/><g stroke="#7c8896" stroke-width="2"><line x1="15" y1="20" x2="33" y2="20"/><line x1="15" y1="26" x2="33" y2="26"/><line x1="15" y1="32" x2="28" y2="32"/></g></svg>`,
    jpg: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e3ecf4"/><path d="M14 36l7-9 5 6 3-4 5 7z" fill="#3c6d8f"/><circle cx="29" cy="20" r="3" fill="#e2b64a"/></svg>`,
    wav: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e4e1f2"/><g stroke="#5a4fa0" stroke-width="2.4" stroke-linecap="round"><line x1="16" y1="26" x2="16" y2="30"/><line x1="20" y1="21" x2="20" y2="35"/><line x1="24" y1="24" x2="24" y2="32"/><line x1="28" y1="18" x2="28" y2="38"/><line x1="32" y1="25" x2="32" y2="31"/></g></svg>`,
    ics: `<svg viewBox="0 0 48 48"><rect x="7" y="9" width="34" height="32" rx="2" fill="#e8ecf0"/><rect x="7" y="9" width="34" height="9" fill="#2c6d8f"/></svg>`,
    frag: `<svg viewBox="0 0 48 48"><path d="M10 4h12l-3 10 6 6-4 10 6 14H10z" fill="#c5ccd4"/><path d="M26 4h4l8 8v32h-8l-5-12 4-10-6-6z" fill="#8e99a5"/></svg>`,
    invoice: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#f2efe6"/><text x="24" y="33" text-anchor="middle" font-size="13" font-family="DM Mono,monospace" fill="#3a3a3a">€</text></svg>`,
    freight: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#e6eef2"/><path d="M14 32h20l-3 5H17z" fill="#2c6d8f"/><rect x="18" y="24" width="10" height="8" fill="#b35a2a"/></svg>`,
    embargo: `<svg viewBox="0 0 48 48"><path d="M10 4h20l8 8v32H10z" fill="#f4e6e6"/><circle cx="24" cy="26" r="8" fill="none" stroke="#b3313a" stroke-width="3"/><line x1="18" y1="32" x2="30" y2="20" stroke="#b3313a" stroke-width="3"/></svg>`,
    imsg: `<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="27" rx="2" fill="#2a3540"/><path d="M5 13l19 14 19-14" fill="none" stroke="#c0313a" stroke-width="2.5"/></svg>`,
    proto: `<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="3" fill="#121a24" stroke="#3c8db5" stroke-width="2"/><text x="24" y="29" text-anchor="middle" font-size="10" font-family="DM Mono,monospace" fill="#5fd0ff">0xF</text></svg>`,
    red: `<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="4" fill="#3a0c10" stroke="#e0473d" stroke-width="2.5"/><path d="M24 13v14" stroke="#ff5a4e" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="34" r="2.6" fill="#ff5a4e"/></svg>`,
    origin: `<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="4" fill="#3a0c10" stroke="#e0473d" stroke-width="2.5"/><rect x="17" y="22" width="14" height="12" rx="2" fill="#ff5a4e"/><path d="M19 22v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#ff5a4e" stroke-width="2.5"/></svg>`,
    trash: `<svg viewBox="0 0 48 48"><path d="M12 14h24l-2 28H14z" fill="#8e99a5"/><rect x="9" y="9" width="30" height="5" rx="1" fill="#b8c2cc"/></svg>`,
    mail: `<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="27" rx="2" fill="#d4dde6"/><path d="M5 13l19 14 19-14" fill="none" stroke="#4c5d6e" stroke-width="2.5"/></svg>`,
    messenger: `<svg viewBox="0 0 48 48"><path d="M7 9h34v23H22l-9 8v-8H7z" fill="#2c6d8f"/><g fill="#dff1ff"><circle cx="17" cy="20.5" r="2.4"/><circle cx="24" cy="20.5" r="2.4"/><circle cx="31" cy="20.5" r="2.4"/></g></svg>`,
    browser: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#1f4a66"/><g fill="none" stroke="#bfe3ff" stroke-width="2"><ellipse cx="24" cy="24" rx="8" ry="18"/><line x1="6" y1="24" x2="42" y2="24"/></g></svg>`,
    audio: `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#3c3470"/><g stroke="#d9d3f5" stroke-width="2.6" stroke-linecap="round"><line x1="14" y1="22" x2="14" y2="27"/><line x1="19" y1="16" x2="19" y2="33"/><line x1="24" y1="20" x2="24" y2="29"/><line x1="29" y1="14" x2="29" y2="35"/><line x1="34" y1="21" x2="34" y2="28"/></g></svg>`,
    terminal: `<svg viewBox="0 0 48 48"><rect x="5" y="8" width="38" height="32" rx="3" fill="#0b1016" stroke="#2c3a48" stroke-width="2"/><path d="M12 19l6 5-6 5" fill="none" stroke="#5fd0ff" stroke-width="2.6"/><line x1="21" y1="30" x2="31" y2="30" stroke="#5fd0ff" stroke-width="2.6"/></svg>`,
    note: `<svg viewBox="0 0 48 48"><rect x="10" y="6" width="28" height="36" rx="2" fill="#e9dfc4"/><g stroke="#8a7a5a" stroke-width="1.6"><line x1="15" y1="16" x2="33" y2="16"/><line x1="15" y1="22" x2="33" y2="22"/><line x1="15" y1="28" x2="28" y2="28"/></g></svg>`,
    ledger: `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="2" fill="#0f1a24" stroke="#3c8db5" stroke-width="2"/><g stroke="#5fd0ff" stroke-width="2"><line x1="11" y1="16" x2="37" y2="16"/><line x1="11" y1="23" x2="37" y2="23"/><line x1="11" y1="30" x2="37" y2="30"/><line x1="20" y1="12" x2="20" y2="36"/></g></svg>`,
    akte: `<svg viewBox="0 0 48 48"><path d="M6 12h14l4 4h18v24H6z" fill="#8a6a3a"/><path d="M6 18h36v22H6z" fill="#b38a4a"/><rect x="14" y="24" width="20" height="3" fill="#5a4220"/></svg>`,
    log: `<svg viewBox="0 0 48 48"><rect x="8" y="6" width="32" height="36" rx="2" fill="#16202a"/><g stroke="#e8b44a" stroke-width="2"><line x1="13" y1="14" x2="35" y2="14"/><line x1="13" y1="21" x2="30" y2="21"/><line x1="13" y1="28" x2="35" y2="28"/></g></svg>`,
    hints: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#1d2a36"/><text x="24" y="31" text-anchor="middle" font-size="20" fill="#e8c46a">?</text></svg>`,
    lock: `<svg viewBox="0 0 48 48"><rect x="12" y="21" width="24" height="19" rx="2" fill="#3c8db5"/><path d="M17 21v-5a7 7 0 0 1 14 0v5" fill="none" stroke="#3c8db5" stroke-width="3.4"/></svg>`,
    info: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#1d2a36"/><text x="24" y="31" text-anchor="middle" font-size="20" fill="#5fd0ff">i</text></svg>`,
    eye: `<svg viewBox="0 0 48 48"><path d="M4 24s8-12 20-12 20 12 20 12-8 12-20 12S4 24 4 24z" fill="#3a0c10" stroke="#e0473d" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#ff5a4e"/></svg>`,
  };
  AR.icon = (n) => IC[n] || IC.txt;
  AR.nodeIcon = (id) => { const n = N[id]; if (n.type === "folder") return n.lock && !G.unlocked(id) ? "lockfolder" : n.icon === "red" ? "redfolder" : "folder"; return n.type === "origin" ? "origin" : n.type; };

  /* ---------- Fenster (gemeinsamer Desktop-Baustein) ---------- */
  const D = MRDesktop.create({ desk: $("#desk"), layer: $("#windows"), tasks: $("#tasks"), apps: () => AR.apps, icon: AR.icon, sound: snd });
  const toast = (o) => MRDesktop.toast($("#toasts"), o);

  function openNode(id) {
    const n = N[id]; if (!n || !G.visible(id)) return;
    G.state.seen[id] = true; G.save();
    if (n.side === "N11") { G.solveSide("N11"); G.addFound("SMS: Wagen der Vorsitzenden 19:35 am Seiteneingang"); }
    if (n.lock && !G.unlocked(id)) return D.open("lock", id);
    if (n.type === "folder") return D.open("explorer", id);
    const app = { jpg: "image", wav: "audio", ics: "calendar", proto: "proto", origin: "origin" }[n.type] || "text";
    return D.open(app, id);
  }

  /* ---------- Desktop-Symbole ---------- */
  function deskItems() {
    const S = G.state, ch = G.chapter(), it = [];
    if (!S.login) return it;
    if (!G.is("R3")) return [["mail", "Mail", "mail", () => D.open("mail")], ["terminal", "Terminal", "terminal", () => D.open("terminal")], ["sysinfo", "System", "info", () => D.open("sysinfo")]];
    it.push(["docs", "Dokumente", "folder", () => D.open("explorer", "docs")], ["mail", "Mail", "mail", () => D.open("mail")], ["msg", "Nachrichten", "messenger", () => D.open("messenger")],
      ["browser", "Browser", "browser", () => D.open("browser")], ["audio", "Audio", "audio", () => D.open("audio")], ["pics", "Bilder", "folder", () => D.open("explorer", "pics")],
      ["trash", "Papierkorb", "trash", () => D.open("explorer", "trash")], ["notebook", "Notizbuch", "note", () => D.open("notebook")], ["terminal", "Terminal", "terminal", () => D.open("terminal")],
      ["akte", "Akte", "akte", () => D.open("akte")], ["syslog", "Systemlog", "log", () => D.open("syslog")]);
    if (ch >= 3) it.push(["ledger", "LEDGER", "ledger", () => D.open("ledger")], ["pruefung", "PRUEFUNG", "folder", () => D.open("explorer", "pruefung")]);
    if (ch >= 4) it.push(["inq", "INQUISITION_PROTOCOL", "redfolder", () => D.open("explorer", "inquisition")]);
    if (ch >= 5) it.push(["core", "ARCHIVE_CORE", "redfolder", () => D.open("explorer", "core")]);
    return it;
  }
  let lastIcons = "";
  function paintIcons() {
    const its = deskItems();
    const unread = G.state.flags.arisMsg && !G.state.seen.arisMsg;
    const html = its.map(([k, l, ic]) => `<button class="dicon" data-k="${k}"><span class="dicon-img">${AR.icon(ic)}${k === "msg" && unread ? `<i class="badge">1</i>` : ""}</span><span class="dicon-label">${esc(l)}</span></button>`).join("");
    if (html !== lastIcons) { lastIcons = html; $("#icons").innerHTML = html; }
  }
  D.activate($("#icons"), ".dicon", (t) => { snd.play("click"); const it = deskItems().find((x) => x[0] === t.dataset.k); if (it) it[3](); });

  /* ---------- Kopfleiste ---------- */
  function paintTop() {
    const S = G.state, lv = G.level(), r = G.remaining();
    $("#trace").textContent = G.fmt(r);
    $("#trace").className = "trace" + (r <= 300 ? " crit" : r <= 1800 ? " warn" : "");
    $("#lvl").innerHTML = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= lv ? "on" : ""}${i >= 4 && i <= lv ? " hot" : ""}"></i>`).join("") + `<span>SECURITY LEVEL 0${lv}</span>`;
    $("#chap").textContent = S.login ? `KAPITEL ${G.chapter()}` : "GESPERRT";
    const desk = $("#desk");
    desk.dataset.level = lv;
    desk.classList.toggle("ph-unrest", r < 90 * 60);
    desk.classList.toggle("ph-threat", r < 60 * 60);
    desk.classList.toggle("ph-esc", r < 30 * 60);
    desk.classList.toggle("cold", G.chapter() >= 4);
    if (!G.isPaused() && S.started && !S.ending) {
      snd.fanLevel(r < 1800 ? 1 - r / 1800 : 0);
      if (r <= 300 && r > 0 && r % 2 === 0 && r !== lastBeat) { lastBeat = r; snd.play("heart"); }
    }
  }
  let lastBeat = -1;

  /* ---------- Bildschirme ---------- */
  const show = (id) => ["title", "boot", "desk", "end"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
  function paintTitle() {
    const S = G.state, going = S.started && !S.ending;
    $("#startBtn").textContent = going ? "Sitzung fortsetzen" : "Verbindung herstellen";
    $("#resetBtn").hidden = !S.started;
    $("#titleState").textContent = going ? `Laufende Sitzung · TRACE noch ${G.fmt(G.remaining())} · Kapitel ${G.chapter()}` : S.ending ? `Letzte Sitzung beendet: ${AR.endings[S.ending].title}` : "";
  }
  /* Intro (nur bei neuer Sitzung): Video → Meldung + anonyme Nachricht → Verbindungsaufbau. Spielzeit startet erst danach. */
  function boot() {
    show("boot");
    let done = false, timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => { if (!done) fn(); }, ms));
    const vid = $("#introVid"), msg = $("#introMsg"), log = $("#bootLog");
    msg.hidden = true; log.textContent = ""; $("#imOpen").hidden = true; $("#imText").textContent = "";
    const fin = () => { if (done) return; done = true; timers.forEach(clearTimeout); vid.pause(); vid.hidden = true; document.removeEventListener("keydown", key); enterDesk(); };
    const key = (e) => { if (e.key === "Escape") fin(); };
    document.addEventListener("keydown", key);
    $("#bootSkip").onclick = fin;

    let inMsg = false;
    const stageMsg = () => {
      if (done || inMsg) return; inMsg = true;
      vid.pause(); vid.hidden = true; msg.hidden = false; snd.play("beep");
      const text = "Hendrik Aris ist seit Sonntag verschwunden.\nDieser Link öffnet sein Archiv.\n\nSie werden merken, dass du drin bist. Du hast zwei Stunden.\nFolge dem Geld, nicht den Namen.", el = $("#imText");
      let k = 0;
      later(function type() { el.textContent = text.slice(0, ++k); if (k % 3 === 0) snd.play("key"); if (k < text.length) later(type, text[k - 1] === "\n" ? 380 : 32); else { $("#imOpen").hidden = false; $("#imOpen").focus(); } }, 2000);
      $("#imOpen").onclick = stageLog;
    };
    const stageLog = () => {
      msg.hidden = true; snd.play("boot");
      const lines = ["> connect remote://aris-archive-07 --token ••••••••", "HANDSHAKE ……………… OK", "DECRYPT SESSION KEY … OK", "MOUNT /archive ……… 3 VOLUMES", "", "REMOTE SESSION ESTABLISHED.", "USER: UNKNOWN   HOST: ARIS-ARCHIVE-07   SECURITY LEVEL: 01", "!WARNING: SESSION MONITORED", "!TRACE IN PROGRESS · ESTIMATED TIME TO LOCATION: " + G.fmt(G.remaining())];
      let i = 0;
      later(function step() {
        if (i < lines.length) { const l = lines[i++], sp = document.createElement("span"); sp.className = l[0] === "!" ? "err" : ""; sp.textContent = l.replace(/^!/, "") + "\n"; log.appendChild(sp); if (l) snd.play(l[0] === "!" ? "deny" : "key"); later(step, l[0] === "!" ? 900 : 420); }
        else { const a = document.createElement("span"); a.className = "arc"; a.textContent = "ARCHON: Wer bist du?"; log.appendChild(a); snd.play("deny"); later(fin, 2600); }
      }, 500);
    };

    vid.hidden = false; vid.currentTime = 0; vid.muted = !snd.isOn();
    vid.onended = stageMsg; vid.onerror = stageMsg;
    vid.play().catch(stageMsg);
  }
  function enterDesk() {
    show("desk"); G.start(); snd.fan();
    paintIcons(); paintTop(); D.paintTasks();
    if (!G.state.login) lockScreen(); else $("#lockbar").hidden = true;
    if (G.state.ending) showEnd(G.state.ending, true);
  }
  function lockScreen() {
    $("#lockbar").hidden = false;
    if (!D.wins.find((w) => w.app === "login")) D.open("login");
  }
  function afterLogin() {
    $("#lockbar").hidden = true;
    D.wins.slice().forEach((w) => { if (w.app === "sysinfo") D.close(w); });
    toast({ title: "Angemeldet als h.aris", text: "Eingeschränkter Modus. Mail und Terminal sind verfügbar.", kind: "ok" });
    paintIcons();
  }
  function pause(on) {
    G.pause(on);
    $("#pause").hidden = !on;
  }

  /* ---------- Ereignisse ---------- */
  AR.on("tick", paintTop);
  // Sperren live herunterzählen; bei 0 das Fenster neu zeichnen (Eingabe wieder frei)
  AR.on("tick", () => {
    document.querySelectorAll("[data-lockt]").forEach((el) => {
      const left = G.locks.left(el.dataset.lockt);
      if (left > 0) { el.textContent = G.locks.fmt(left); return; }
      const w = D.wins.find((x) => x.body.contains(el)); if (w) D.render(w);
    });
  });
  AR.on("change", () => { if ($("#desk").classList.contains("hidden")) return; paintIcons(); paintTop(); D.refresh(); });
  AR.on("solved", (id) => {
    snd.play("unlock");
    const p = AR.puzzles.find((x) => x.id === id);
    if (p) toast({ title: "Gelöst: " + p.label, kind: "ok" });
    if (id === "R3") toast({ title: "ACCESS GRANTED", text: "Neue Anwendungen auf dem Desktop. Fachbegriffe erklärt die NORDSUCHE im Browser.", kind: "ok", ms: 8000 });
  });
  AR.on("side", (id) => { snd.play("beep"); toast({ title: "Beweis gesichert", text: AR.sides[id].label + " · Beweistiefe " + G.evidence().pts + "/12", kind: "ok" }); });
  AR.on("chapter", (ch) => {
    if (ch === 3) { snd.play("level"); toast({ title: "SECURITY LEVEL 03", text: "Benutzer ns_observer im Systemprotokoll. Neue Unterlagen: PRUEFUNG, LEDGER.", kind: "sys", ms: 9000 }); }
    if (ch === 4) {
      snd.play("glitch");
      $("#desk").classList.add("glitch"); setTimeout(() => $("#desk").classList.remove("glitch"), 1800);
      toast({ title: "UNAUTHORIZED CORRELATION DETECTED", text: "SECURITY LEVEL 04 · REMOTE SESSION COMPROMISED · Neuer Ordner: INQUISITION_PROTOCOL", kind: "alert", ms: 10000 });
      const until = G.state.elapsed + 300; ["office", "alt"].forEach((k) => { N[k].blockUntil = until; });
      setTimeout(() => D.open("watch"), 2500);
    }
    if (ch === 5) { snd.play("alarm"); toast({ title: "NACHRICHT VON H. ARIS", text: "Öffne „Nachrichten“. SECURITY LEVEL 05 – Alarmzustand.", kind: "alert", ms: 10000 }); setTimeout(() => D.open("messenger"), 1200); }
    paintIcons();
  });
  AR.on("level", (lv) => { snd.play("level"); toast({ title: `SECURITY LEVEL 0${lv}`, text: lv >= 4 ? "Aktive Gegenmaßnahmen. Weniger raten." : "Erhöhte Überwachung.", kind: "sys" }); });
  AR.on("end", (id) => showEnd(id, false));

  /* ---------- Ende ---------- */
  function showEnd(id, instant) {
    const E = AR.endings[id], sc = G.score();
    D.closeAll();
    show("end");
    const box = $("#end");
    box.className = "end " + E.kind;
    const solution = `<ol class="sol"><li>R1 Login: LIEGEPLATZ47 (meta harbour.jpg → decode → „Liegeplatz 47“, Richtlinie: ohne Leerzeichen)</li><li>R2/R3: X-Archive-Key → sargasso → auth sargasso</li><li>R4: restore frag_A frag_C frag_B (Zeiten im Zitat: 09:14, 11:02, 16:40)</li><li>R5: Spektrogramm → VELLUM</li><li>R6: HR-2209 (Eintragsdatum 31.09. gibt es nicht)</li><li>R7/R8: 42178805 (Prüfziffern NORD 42 · MERC 17 · ARGO 88 · LUX 05)</li><li>R9: FL-0002.413.587-4 → Stiftung Kestrel</li><li>R10: AR-2026-118</li><li>R11: ORKAN</li><li>R12: HOLM (Unterbrechung 19:35–19:48, Telefonat 19:41)</li><li>R14: repair 3 904D · repair 5 7786 · repair 7 C1DA</li><li>R15: LIEGEPLATZ47-VELLUM-42178805-ORKAN</li><li>Nebenrätsel: whoami · HELM · DONNERSTAG · Mediaplayer „Umkehren“ bei Idas Nachricht · TX-1015 ⚙ · K-3 · log --user ns_observer · NORDELBE · inspect window · history · SMS im Papierkorb · ls -a / cat .postkarte</li></ol>`;
    box.innerHTML = `<div class="end-inner"><p class="end-k">${id === "FAIL" ? "SESSION TERMINATED" : "CASE CLOSED"}</p><h1>${esc(E.title)}</h1>
      ${E.text.map((t) => `<p>${esc(t)}</p>`).join("")}
      <section class="end-score"><h3>ARCHON PERFORMANCE INDEX · ${sc.total} · ${esc(sc.title)}</h3>
        <table><tr><td>Ermittlungsleistung (35 %)</td><td>${sc.parts.inv}</td></tr><tr><td>Rätselgenauigkeit (25 %)</td><td>${sc.parts.acc}</td></tr><tr><td>Zeitmanagement (20 %)</td><td>${sc.parts.time}</td></tr><tr><td>Hilfenutzung (10 %)</td><td>${sc.parts.help}</td></tr><tr><td>Sicherheitsverhalten (10 %)</td><td>${sc.parts.sec}</td></tr></table>
        <p>Haupträtsel ${sc.main} von 15 · Beweistiefe ${sc.evidence.pts} von 12 · ${sc.hints} Hinweise · ${sc.fails} Fehlversuche · Restzeit ${G.fmt(G.remaining())}</p></section>
      <details class="end-sol"><summary>Lösungen anzeigen</summary>${solution}</details>
      <div class="end-rating"></div>
      <div class="end-actions"><button class="btn" id="endNew">Neue Sitzung</button> <a class="btn ghost" href="../index.html">Alle Escape Rooms</a></div></div>`;
    const sol = $(".end-sol", box);
    sol.addEventListener("toggle", (e) => { if (sol.open && !sol.dataset.ok) { if (!confirm("Wirklich alle Lösungen anzeigen?")) { sol.open = false; return; } sol.dataset.ok = "1"; } });
    if (window.MRRating) MRRating.mount($(".end-rating", box), { game: "archon", title: "Das ARCHON-Protokoll", ending: id });
    $("#endNew").onclick = () => { if (confirm("Neue Sitzung beginnen? Der Spielstand wird gelöscht.")) { G.reset(); location.reload(); } };
    if (!instant) snd.play(id === "FAIL" ? "alarm" : "notify");
  }

  /* ---------- Verdrahtung ---------- */
  function init() {
    // Kleiner Bildschirm (Handy, Tablet hochkant): nur ein Hinweis, spielbar bleibt es. Reagiert auf Drehen.
    const gate = window.matchMedia("(max-width: 1023px), (pointer: coarse) and (orientation: portrait)");
    const paintGate = () => { $("#mobileNote").hidden = !gate.matches; };
    paintGate(); gate.addEventListener("change", paintGate);
    paintTitle();
    $("#startBtn").addEventListener("click", () => { if (G.state.ending) G.reset(); if (G.state.started) enterDesk(); else boot(); });
    $("#resetBtn").addEventListener("click", () => { if (confirm("Sitzung wirklich neu beginnen? Der Fortschritt geht verloren.")) { G.reset(); paintTitle(); } });
    $("#pauseBtn").addEventListener("click", () => pause(true));
    $("#resume").addEventListener("click", () => pause(false));
    $("#pauseTitle").addEventListener("click", () => { pause(false); G.state.started && G.save(); location.reload(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#desk").classList.contains("hidden") && !G.state.ending) pause(!G.isPaused()); });
    $("#hintBtn").addEventListener("click", () => D.open("hints"));
    $("#soundBtn").addEventListener("click", () => { snd.toggle(); $("#soundBtn").classList.toggle("muted", !snd.isOn()); });
    $("#soundBtn").classList.toggle("muted", !snd.isOn());
    $("#lkInfo").addEventListener("click", () => D.open("sysinfo"));
    $("#lkTerm").addEventListener("click", () => D.open("terminal"));
    $("#lkImg").addEventListener("click", () => D.open("image", "harbour"));
    $("#lkLogin").addEventListener("click", () => D.open("login"));
    document.addEventListener("visibilitychange", () => { if (document.hidden) G.save(); });
  }
  AR.os = { open: D.open, close: D.close, render: D.render, activate: D.activate, openNode, toast, paintIcons, afterLogin, wins: D.wins, D };
  init();
})();
