/*
 * DEADLINE.exe – Spiellogik
 *
 * Spielstand, Countdown, zeitgesteuerte Ereignisse, Schlösser, Widerspruch,
 * Terminal-Befehle, Hinweise und die Entscheidung am Ende.
 * Keine Oberfläche: os.js und apps.js hören auf DL.on("change" | "message" | "event" | "ending").
 */
window.DL = window.DL || {};
(() => {
  "use strict";
  const ST = DL.story;
  const TOTAL = 100 * 60;
  const DEFAULT_KEY = "deadline_save_v2"; // v2: vier Siegel – Spielstände aus v1 werden nicht übernommen
  let saveKey = DEFAULT_KEY;
  let hooks = null; // Multiplayer

  /* ---------- Ereignisse ---------- */
  const listeners = {};
  DL.on = (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); return () => { listeners[name] = listeners[name].filter((f) => f !== fn); }; };
  DL.emit = (name, ...args) => (listeners[name] || []).slice().forEach((fn) => { try { fn(...args); } catch (e) { console.error(e); } });

  /* ---------- Spielstand ---------- */
  const fresh = () => ({
    v: 1, started: false, relaxed: false, elapsed: 0,
    completed: [], flags: {}, fails: {}, msgs: [], msgAt: {}, events: [], hints: {},
    ending: null, endings: [], finished: false,
    draft: { redact: [], target: "", by: "" },
  });
  let S = fresh();
  let paused = false;

  function load() {
    try { const raw = JSON.parse(localStorage.getItem(saveKey) || "null"); if (raw && raw.v === 1) S = { ...fresh(), ...raw }; else S = fresh(); }
    catch (e) { S = fresh(); }
  }
  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify(S)); } catch (e) { /* privat */ }
    if (hooks && hooks.changed) hooks.changed();
  }
  function changed() { save(); DL.emit("change"); }
  load();
  window.addEventListener("pagehide", save);

  const isSolved = (id) => S.completed.includes(id);
  const flag = (k) => Boolean(S.flags[k]);
  function cond(c) {
    if (!c) return true;
    const [kind, id] = c.split(":");
    if (kind === "solved") return isSolved(id);
    if (kind === "event") return S.events.includes(id);
    if (kind === "flag") return flag(id);
    return false;
  }
  const visible = (id) => { const n = ST.nodes[id]; return Boolean(n) && cond(n.when); };
  const unlocked = (id) => { const n = ST.nodes[id]; return !n || !n.lock || isSolved(n.lock.step); };
  const children = (folder) => Object.keys(ST.nodes).filter((id) => ST.nodes[id].parent === folder && visible(id));

  function setFlag(k) { if (!S.flags[k]) { S.flags[k] = true; changed(); } }
  function solve(id) {
    if (isSolved(id)) return false;
    S.completed.push(id);
    const trig = { archiv: "u_archiv", nora: "u_nora", trace: "u_trace", case: "u_case" }[id];
    changed();
    DL.emit("solved", id);
    if (trig) setTimeout(() => send(trig), 2600 + Math.random() * 3000);
    checkSeals();
    return true;
  }
  /** Alle vier Siegel gebrochen → CASE_17 entsiegelt */
  const sealsOpen = () => ST.seals.filter((x) => !isSolved(x.id));
  function checkSeals() { if (!isSolved("case") && !sealsOpen().length) solve("case"); }

  /* ---------- Nachrichten von UNBEKANNT ---------- */
  function send(id) {
    if (!ST.messages[id] || S.msgs.includes(id) || S.ending) return;
    S.msgs.push(id); S.msgAt[id] = S.elapsed;
    changed();
    DL.emit("message", id);
  }

  /* ---------- Zeit ---------- */
  const remaining = () => Math.max(0, TOTAL - S.elapsed);
  const fmt = (sec) => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
  /** Uhrzeit im Spiel: Start Samstag, 18.10., 00:12 */
  const clock = () => { const t = 12 + Math.floor(S.elapsed / 60); return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
  /*
   * Die Frist ist Spielzeit: Sie läuft, solange das Spiel geöffnet ist – auch in einem
   * Hintergrund-Tab. Sie steht nur bei Pause oder geschlossener Seite. Gemessen wird mit
   * der Systemuhr, weil Browser Zeitgeber in Hintergrund-Tabs stark verlangsamen.
   * Ein Sprung über 2 Minuten (Rechner im Ruhezustand) zählt nicht.
   */
  let running = false, lastTs = null, frac = 0, lastSave = 0;
  function tick() {
    if (!running || paused || !S.started || S.ending) { lastTs = null; return; }
    const now = Date.now();
    if (lastTs === null) { lastTs = now; return; }
    let d = (now - lastTs) / 1000; lastTs = now;
    if (d > 120) d = 1;
    frac += d;
    const whole = Math.floor(frac);
    if (!whole) return;
    frac -= whole;
    S.elapsed += whole;
    checkTime();
    if (now - lastSave > 5000) { lastSave = now; save(); }
    DL.emit("tick");
  }
  function checkTime() {
    if (S.elapsed >= 60) send("u_start");
    for (const ev of ST.events) {
      if (S.events.includes(ev.id) || S.elapsed < ev.at * 60) continue;
      if (ev.countdownOnly && S.relaxed) continue;
      S.events.push(ev.id);
      changed();
      DL.emit("event", ev);
      if (ev.msg) send(ev.msg);
    }
    if (!S.relaxed && S.elapsed >= TOTAL && !S.ending) finish("timeout");
  }
  setInterval(tick, 1000);

  /* ---------- Schlösser ---------- */
  const norm = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  function tryLock(id, code) {
    const n = ST.nodes[id];
    if (!n || !n.lock) return { ok: true };
    if (isSolved(n.lock.step)) return { ok: true };
    if (norm(code) === norm(n.lock.code)) { solve(n.lock.step); return { ok: true }; }
    S.fails[id] = (S.fails[id] || 0) + 1;
    if (id === "archiv" && S.fails[id] >= 2) setTimeout(() => send("u_fail"), 4000);
    changed();
    return { ok: false, text: "Zugriff verweigert. Schlüssel ungültig." };
  }
  function tryChat(code) {
    if (isSolved("chat")) return { ok: true };
    if (norm(code) === "MILO") { solve("chat"); return { ok: true }; }
    S.fails.chat = (S.fails.chat || 0) + 1; changed();
    if (norm(code) === "NORA") return { ok: false, text: "Abgelehnt. Hinweis der Besitzerin: „Nicht mein Name. So leicht mache ich es niemandem.“" };
    return { ok: false, text: "Entschlüsselung fehlgeschlagen. Passwort ungültig." };
  }

  /* ---------- Sicherheitsberichte (Audit-Portal, Aufruf per Vorgangsnummer) ---------- */
  function openReport(ref) {
    const r = ST.srReports[norm(ref)];
    if (!r) return null;
    if (r.key) solve("quelle");
    return r;
  }

  /* ---------- Terminal ---------- */
  const pretty = (d) => d.replace(/^([A-Z]+)([A-Z0-9]*?)(\d+)$/, (m, a, b, c) => (b ? `${a}-${b}${c}` : `${a}-${c}`));
  const DEVNAMES = { SEC01: "SEC-01", SEC10: "SEC-10", CAMB01: "CAM-B01", LTN14: "LT-N14", WSE02: "WS-E02", HD03: "HD-03", WSL07: "WS-L07", SRVL1: "SRV-L1" };
  let termQueue = [];
  function command(input) {
    const raw = String(input || "").trim();
    const out = [];
    const L = (t, cls = "") => out.push({ t, cls });
    if (!raw) return out;
    if (!flag("term_used")) { setFlag("term_used"); setTimeout(() => send("u_term"), 3500); }
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = (name) => { const i = parts.findIndex((p) => p.toLowerCase() === name); return i >= 0 ? parts[i + 1] : undefined; };
    const pkgOk = (p) => /^CASE_?17(\.ENC)?$/i.test(p || "");
    switch (cmd) {
      case "help":
        L("Verfügbare Befehle:");
        ["help", "ls", "cat <datei>", "status <paket>", "trace <geräte-id>", "decrypt <paket> --key <wort>", "verify <paket> --seed <code>", "whoami", "date", "clear"].forEach((c) => L("  " + c, "dim"));
        break;
      case "ls":
        L("CASE_17.enc            2.4 MB   " + (isSolved("case") ? "entsiegelt" : `versiegelt (${4 - sealsOpen().length} von 4 Siegeln gebrochen)`));
        L("autoresp.log           —        " + (isSolved("case") ? "lesbar" : "Zugriff verweigert"));
        L("readme_terminal.txt    1 KB");
        break;
      case "cat": {
        const f = (parts[1] || "").toLowerCase();
        if (!f) { L("Syntax: cat <datei>", "warn"); break; }
        if (f === "readme_terminal.txt") { L("Arbeitsordner von E. Voss. CASE_17 ist mit vier Siegeln verschlossen."); L("Zustand: status CASE_17. Siehe pruefung.txt und terminal_help.txt in Dokumente."); }
        else if (f.startsWith("case_17")) L("�ꝏ▒░ PK♦ 7a 1f e2 ▒▒ ░░ … (verschlüsselt)", "dim");
        else if (f === "autoresp.log") {
          if (!isSolved("case")) { L("Permission denied.", "err"); break; }
          L("autoresp · Regeln (angelegt 17.10. 23:46 von E.VOSS)");
          Object.entries(ST.messages).forEach(([id, m]) => L(`  #${m.rule}  ${id.padEnd(14)} → "${m.text}"`, "dim"));
          L("SENDER \"UNBEKANNT\" · Zustellung lokal, zeitversetzt");
        } else L(`cat: ${parts[1]}: Datei nicht gefunden`, "err");
        break;
      }
      case "status": {
        if (!pkgOk(parts[1])) { L(parts[1] ? `status: Paket ${parts[1]} nicht gefunden` : "Syntax: status <paket>", parts[1] ? "err" : "warn"); break; }
        L("CASE_17 · Beweispaket von E. VOSS · 2.4 MB");
        ST.seals.forEach((x, i) => {
          const done = isSolved(x.id);
          let extra = "";
          if (x.id === "verify" && !done) extra = isSolved("decrypt") ? "   (decrypt ✓ · verify fehlt)" : "   (decrypt fehlt · verify fehlt)";
          L(`  SIEGEL ${i + 1}  ${x.name.padEnd(10)} ${done ? "GEBROCHEN" : "VERSIEGELT"}${extra}`, done ? "ok" : "");
        });
        L(isSolved("case") ? "STATUS: ENTSIEGELT – EVIDENCE_UNLOCKED liegt auf dem Desktop" : `STATUS: VERSIEGELT · ${sealsOpen().length} Siegel offen · Hinweise in pruefung.txt`, isSolved("case") ? "ok" : "warn");
        break;
      }
      case "whoami": L(isSolved("case") ? "E.VOSS (wiederhergestellt) · Access Level: FULL" : "UNKNOWN · Access Level: LIMITED"); break;
      case "date": L(`Sa 18.10.2025 ${clock()}`); break;
      case "trace": {
        const d = norm(parts[1]);
        if (!d) { L("Syntax: trace <geräte-id>", "warn"); break; }
        const t = ST.traces[d];
        if (!t) { L("TRACE STARTED"); L(`DEVICE ${parts[1].toUpperCase()} NOT FOUND`, "err"); break; }
        const n = t.groups.reduce((a, g) => a + g[1].length, 0);
        L("TRACE STARTED");
        L(`DEVICE : ${DEVNAMES[d] || pretty(d)}`);
        L(`OWNER  : ${t.owner}`);
        L("DATE   : 14.10.2025");
        L(`EVENTS : ${n}${t.groups.length > 1 ? "   (gruppiert nach Konto)" : ""}`);
        for (const [head, rows] of t.groups) {
          L(""); L(`[${head}]`, "hl");
          for (const [time, act, proc, chk] of rows) L(`  ${time}  ${act.padEnd(14)} PROC=${proc.padEnd(9)} CHECK=${chk}`);
        }
        if (t.tail) { L(""); L(t.tail, "dim"); }
        L(""); L("TRACE COMPLETE");
        if (d === "SEC01" && !isSolved("trace")) { L("SIEGEL 1 · GERÄT GEBROCHEN", "ok"); L("Erweiterter Prüfzugang aktiv: Interne Projekte im Audit-Portal freigegeben.", "ok"); solve("trace"); }
        break;
      }
      case "decrypt": {
        const p = parts[1], key = arg("--key");
        if (!p || !key || !arg("--key")) { L("Syntax: decrypt <paket> --key <wort>", "warn"); break; }
        if (!pkgOk(p)) { L(`decrypt: Paket ${p} nicht gefunden`, "err"); break; }
        if (isSolved("decrypt")) { L("CASE_17 ist bereits entschlüsselt. Status: " + (isSolved("verify") ? "VERIFIED" : "UNVERIFIED")); break; }
        L("DECRYPTION STARTED ...");
        if (norm(key) !== "MIRROR") { L("KEY REJECTED.", "err"); S.fails.decrypt = (S.fails.decrypt || 0) + 1; changed(); break; }
        L("KEY ACCEPTED.", "ok"); L("CASE_17 DECRYPTED.");
        L("STATUS: UNVERIFIED – verify required (Siegel 4, Teil 2)", "warn");
        solve("decrypt");
        break;
      }
      case "verify": {
        const p = parts[1], seed = arg("--seed");
        if (!p || !seed) { L("Syntax: verify <paket> --seed <code>", "warn"); break; }
        if (!pkgOk(p)) { L(`verify: Paket ${p} nicht gefunden`, "err"); break; }
        if (!isSolved("decrypt")) { L("PACKAGE ENCRYPTED – decrypt first.", "err"); break; }
        if (isSolved("verify")) { L("EVIDENCE PACKAGE ALREADY VERIFIED."); break; }
        L("VERIFYING PACKAGE ...");
        const s = String(seed).replace(/\D/g, "");
        if (s !== "7319") {
          S.fails.verify = (S.fails.verify || 0) + 1; changed();
          if (s.split("").sort().join("") === "1379") L("CHECKSUM MISMATCH · Ziffern bekannt, Reihenfolge ungültig.", "err");
          else L("CHECKSUM MISMATCH.", "err");
          break;
        }
        ["SOURCE DEVICE: SEC-01", "PROJECT: MIRROR", "SIGNATURE: VALID", "CHECKSUM: MATCH"].forEach((x) => L(x));
        L("SIEGEL 4 · SCHLÜSSEL GEBROCHEN", "ok");
        solve("verify");
        if (isSolved("case")) L("ALLE SIEGEL GEBROCHEN. Neuer Ordner auf dem Desktop: EVIDENCE_UNLOCKED", "ok");
        else L(`Noch versiegelt: ${sealsOpen().map((x) => x.name).join(", ")} – siehe status CASE_17`, "warn");
        break;
      }
      case "clear": return [{ clear: true }];
      case "exit": L("Nein.", "dim"); break;
      case "sudo": L("Netter Versuch.", "dim"); break;
      default: L("ERROR: Unknown command.", "err"); L('Type "help" for available commands.', "dim");
    }
    return out;
  }
  const takeTermQueue = () => { const q = termQueue; termQueue = []; return q; };
  DL.on("event", (ev) => { if (ev.id === "e75") termQueue.push({ t: "WARNING: FINAL PURGE SEQUENCE PREPARED.", cls: "err" }); });

  /* ---------- Hinweise ---------- */
  const stepDone = (s) => (s.id === "finale" ? Boolean(S.ending) : isSolved(s.id));
  /** Schritte, deren Voraussetzungen erfüllt sind und die noch offen sind (mehrere gleichzeitig möglich) */
  const openSteps = () => ST.steps.filter((s) => !stepDone(s) && s.needs.every((n) => isSolved(n)));
  const currentStep = () => openSteps()[0] || null;
  function revealHint(step) {
    const lvl = S.hints[step] || 0;
    if (lvl >= 4) return;
    S.hints[step] = lvl + 1; changed();
  }

  /* ---------- Entscheidung ---------- */
  function judge({ target, redact = [] }) {
    if (target === "purge") return "purge";
    if (target === "review") return "sender";
    const r = new Set(redact);
    if (r.has("Viktor Kern") || r.has("Nora Weiss")) return "empty";
    if (r.has("Jana Thiel") && r.has("Malte Brück")) return "truth";
    return "price";
  }
  function finish(id) {
    if (S.ending) return;
    S.ending = id; S.finished = true;
    if (!S.endings.includes(id)) S.endings.push(id);
    changed();
    DL.emit("ending", id);
  }
  const decide = (choice) => { if (!isSolved("case")) return null; const id = judge(choice); finish(id); return id; };
  function backToDecision() { if (!S.ending || S.ending === "timeout") return; S.ending = null; changed(); }

  /* ---------- Spielstart ---------- */
  /* ---------- Entwurf der Entscheidung (gespeichert; im Team gemeinsam, letzte Änderung gilt) ---------- */
  const getDraft = () => S.draft || (S.draft = { redact: [], target: "", by: "" });
  function updateDraft(patch) {
    S.draft = { ...getDraft(), ...patch, by: "", at: Date.now() };
    save();
    if (hooks && hooks.draftChanged) hooks.draftChanged(S.draft);
    DL.emit("draft");
  }
  function applyDraft(d, byName) {
    if (!d || typeof d !== "object") return;
    S.draft = { redact: Array.isArray(d.redact) ? d.redact.slice() : [], target: d.target || "", by: byName || "", at: d.at || 0 };
    try { localStorage.setItem(saveKey, JSON.stringify(S)); } catch (e) { /* privat */ }
    DL.emit("draft", true);
  }

  function startGame({ relaxed } = {}) {
    if (!S.started) { S.started = true; S.relaxed = Boolean(relaxed); }
    running = true; paused = false;
    changed();
  }
  function newGame({ relaxed } = {}) { const found = S.endings || []; S = fresh(); S.endings = found; S.started = true; S.relaxed = Boolean(relaxed); running = true; paused = false; changed(); }
  function stop() { running = false; save(); }
  function reset() { S = fresh(); running = false; paused = false; changed(); }

  /* ---------- Multiplayer-Schnittstelle ---------- */
  const SHARED = ["started", "relaxed", "elapsed", "completed", "flags", "fails", "msgs", "msgAt", "events", "hints", "ending", "endings", "finished"];
  function exportShared() { const o = {}; SHARED.forEach((k) => { o[k] = S[k]; }); if (o.ending === null) delete o.ending; return JSON.parse(JSON.stringify(o)); }
  function applyShared(st) {
    if (!st) return [];
    const merged = window.MRMultiplayer ? window.MRMultiplayer.merge(exportShared(), st) : st;
    const news = [];
    const before = { completed: S.completed.slice(), msgs: S.msgs.slice(), events: S.events.slice(), ending: S.ending };
    SHARED.forEach((k) => { if (merged[k] !== undefined) S[k] = merged[k]; });
    S.completed.filter((id) => !before.completed.includes(id)).forEach((id) => { const st2 = ST.steps.find((x) => x.id === id); if (st2) news.push(st2.label); DL.emit("solved", id, true); });
    try { localStorage.setItem(saveKey, JSON.stringify(S)); } catch (e) { /* privat */ }
    S.msgs.filter((id) => !before.msgs.includes(id)).forEach((id) => DL.emit("message", id, true));
    S.events.filter((id) => !before.events.includes(id)).forEach((id) => DL.emit("event", ST.events.find((e) => e.id === id), true));
    checkSeals();
    DL.emit("change");
    if (S.ending && !before.ending) DL.emit("ending", S.ending, true);
    return news;
  }
  function enterMultiplayer(h) { hooks = h; saveKey = h.saveKey; load(); }
  function leaveMultiplayer() { hooks = null; saveKey = DEFAULT_KEY; load(); running = false; DL.emit("change"); }

  DL.game = {
    get state() { return S; },
    TOTAL, isSolved, flag, setFlag, cond, visible, unlocked, children, solve, send,
    remaining, elapsed: () => S.elapsed, fmt, clock,
    pause(on) { paused = on; DL.emit("change"); }, isPaused: () => paused, isRunning: () => running,
    tryLock, tryChat, openReport, command, takeTermQueue, sealsOpen,
    currentStep, openSteps, stepDone, revealHint, hintLevel: (s) => S.hints[s] || 0,
    decide, judge, backToDecision, draft: getDraft, updateDraft, applyDraft, startGame, newGame, stop, reset, save,
    exportShared, applyShared, enterMultiplayer, leaveMultiplayer,
    isMultiplayer: () => Boolean(hooks), hooks: () => hooks,
    _setElapsed(sec) { S.elapsed = sec; checkTime(); changed(); },
  };
})();
