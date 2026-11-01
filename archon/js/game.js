/*
 * DAS ARCHON-PROTOKOLL – Spiellogik
 *
 * Spielstand, Kapitel, Rätselprüfung, Sperren (MRLocks), Sicherheitslevel, Spielzeit mit Pause
 * (MRPlayClock), Terminal-Befehle, Hinweise, Beweistiefe, Wertung und Enden.
 * Keine Oberfläche: os.js / apps.js hören auf AR.on("change" | "solved" | "side" | "chapter" | "level" | "end" | "tick").
 */
window.AR = window.AR || {};
(() => {
  "use strict";
  const TOTAL = 120 * 60;
  const KEY = "archon_save_v1";
  const norm = (v) => String(v || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, "");

  /* ---------- Ereignisse ---------- */
  const L = {};
  AR.on = (n, fn) => { (L[n] = L[n] || []).push(fn); return () => { L[n] = L[n].filter((f) => f !== fn); }; };
  AR.emit = (n, ...a) => (L[n] || []).slice().forEach((fn) => { try { fn(...a); } catch (e) { console.error(e); } });

  /* ---------- Spielstand ---------- */
  const fresh = () => ({
    v: 1, started: false, elapsed: 0, login: false,
    solved: {}, sides: {}, flags: {}, locks: {}, hints: {},
    proto: {}, autoFlags: {}, akte: { notes: "", hypos: [] }, found: [],
    storyLevel: 1, maxFailLevel: 1, ending: null, choice: null, seen: {},
    mode: null,          // "timer" (Countdown) | "relaxed" (ohne Zeitdruck); alte Spielstände = timer
    marks: {},           // LEDGER: markierte Buchungen
    invMarks: {},        // Rechnungsabgleich: eigene Notizen (ok/bad)
    route: null,         // R8: gültige Kette
    openAt: {}, chAt: {}, hintAt: {}, startedAt: null, // Testprotokoll
    act: { p: {}, app: {} }, // aktive Sekunden je Rätsel / Programm (Programm im Vordergrund, nicht pausiert)
    invSeen: {}, r10snap: null, // Rechnungsabgleich: angesehene Rechnungen, Stand beim Lösen
  });
  let S = fresh();
  try { const raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw && raw.v === 1) S = { ...fresh(), ...raw }; } catch (e) { /* privat */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* privat */ } };
  const relaxed = () => S.mode === "relaxed";
  /** Testprotokoll: wann wurde ein Kapitel erreicht, wann ein Rätsel freigeschaltet (unabhängig von Fenstern). */
  function track() {
    if (!S.started) return;
    const ch = chapter(); if (S.chAt[ch] == null) S.chAt[ch] = S.elapsed;
    openPuzzles().forEach((p) => { if (S.openAt[p.id] == null) S.openAt[p.id] = S.elapsed; });
  }
  const changed = () => { track(); save(); AR.emit("change"); };

  /* ---------- Zeit, Pause, Sperren ---------- */
  const clock = MRPlayClock.create({
    get: () => S.elapsed, set: (v) => { S.elapsed = v; }, save,
    onTick: () => { if (S.elapsed >= TOTAL && !S.ending && !relaxed()) finish("FAIL"); AR.emit("tick"); },
  });
  const locks = MRLocks.create({ store: () => S.locks, now: () => S.elapsed, onChange: () => { updateLevel(); changed(); } });
  const remaining = () => Math.max(0, TOTAL - S.elapsed);
  const fmt = (sec) => { sec = Math.max(0, Math.floor(sec)); return `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor(sec % 3600 / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; };

  /* ---------- Kapitel und Level ---------- */
  const is = (id) => S.solved[id] != null; // Zeitstempel 0 (sofort gelöst) zählt als gelöst
  const side = (id) => S.sides[id] != null;
  function chapter() {
    if (!is("R3")) return 1;
    if (!(is("R4") && is("R5") && is("R6"))) return 2;
    if (!(is("R8") && is("R9") && is("R10"))) return 3;
    if (!is("R13")) return 4;
    return 5;
  }
  function cond(c) {
    if (!c) return true;
    const [k, v] = c.split(":");
    if (k === "ch") return chapter() >= Number(v);
    if (k === "solved") return is(v);
    if (k === "side") return side(v);
    if (k === "flag") return Boolean(S.flags[v]);
    return false;
  }
  function failLevel() { const t = locks.total(); return t >= 18 ? 5 : t >= 12 ? 4 : t >= 6 ? 3 : 1; }
  const level = () => Math.max(S.storyLevel, Math.min(S.storyLevel + 1, failLevel()));
  let lastLevel = null;
  function updateLevel() {
    const ch = chapter();
    const story = is("R13") ? 5 : ch >= 4 ? 4 : ch >= 3 ? 3 : is("R3") ? 2 : 1;
    S.storyLevel = Math.max(S.storyLevel, story);
    const lv = level();
    if (lv > S.storyLevel) S.maxFailLevel = Math.max(S.maxFailLevel, lv);
    if (lastLevel !== null && lv > lastLevel) AR.emit("level", lv);
    lastLevel = lv;
  }

  /* ---------- Lösen ---------- */
  function solve(id, silent) {
    if (is(id)) return false;
    const before = chapter();
    S.solved[id] = S.elapsed;
    if (id === "R8") S.solved.R7 = S.elapsed;
    if (id === "R10") S.r10snap = { gesehen: Object.keys(S.invSeen).length, notizen: Object.keys(S.invMarks).length, fehler_notiert: Object.values(S.invMarks).filter((v) => v === "bad").length };
    if (id === "R2" || id === "R3") if (!is("R2")) S.solved.R2 = S.elapsed;
    if (is("R11") && is("R12") && !is("R13")) { S.solved.R13 = S.elapsed; S.flags.arisMsg = true; }
    updateLevel();
    changed();
    if (!silent) AR.emit("solved", id);
    const after = chapter();
    if (after > before) AR.emit("chapter", after);
    return true;
  }
  function solveSide(id) {
    if (side(id) || !AR.sides[id]) return false;
    S.sides[id] = S.elapsed; changed(); AR.emit("side", id); return true;
  }
  function setFlag(k, v = true) { if (S.flags[k] !== v) { S.flags[k] = v; changed(); } }

  /** Prüft eine Eingabe gegen ein Sperrziel. Gibt { ok } / { locked: sek } / { ok:false, text, wait } zurück. */
  function attempt(target, ok, onOk, wrongText = "Falsch.", opts = {}) {
    const left = locks.left(target);
    if (left > 0) return { ok: false, locked: left, target, base: "Gesperrt durch Sicherheitsprotokoll.", text: `Gesperrt durch Sicherheitsprotokoll · noch ${locks.fmt(left)}` };
    if (ok) { onOk(); return { ok: true }; }
    const sec = locks.fail(target, opts);
    MRSound.play("deny");
    return { ok: false, target, base: wrongText, text: wrongText + (sec ? ` Eingabe für ${locks.fmt(sec)} gesperrt.` : ""), wait: sec };
  }

  /* ---------- Schlösser an Dateien und Ordnern ---------- */
  const visible = (id) => { const n = AR.nodes[id]; return Boolean(n) && cond(n.when) && (!n.parent || visible(n.parent)); };
  const unlocked = (id) => { const n = AR.nodes[id]; if (!n || !n.lock) return true; return n.lock.puzzle ? is(n.lock.puzzle) : side(n.lock.side); };
  const children = (folder) => Object.keys(AR.nodes).filter((id) => AR.nodes[id].parent === folder && visible(id));
  function tryNodeLock(id, input) {
    const n = AR.nodes[id], L2 = n.lock;
    let ok = norm(input) === norm(L2.code);
    if (id === "notizH") ok = ok || norm(input) === "DO";
    return attempt(L2.target, ok, () => (L2.puzzle ? solve(L2.puzzle) : solveSide(L2.side)), "Zugriff verweigert.");
  }

  /* ---------- Einzelne Rätsel ---------- */
  function login(pw) {
    return attempt("login", ["LIEGEPLATZ47", "WALTERSHOFLIEGEPLATZ47"].includes(norm(pw)), () => { S.login = true; solve("R1"); }, "Anmeldung fehlgeschlagen.");
  }
  function spectro(word) {
    return attempt("R5", norm(word) === "VELLUM", () => { addFound("Spektrogramm: VELLUM"); solve("R5"); }, "Das ergibt keinen Sinn im Spektrum.");
  }
  /* R8: markierte Buchungen als Weiterleitungskette prüfen.
   * Regeln: Empfänger = nächster Absender · 1–3 Tage später · Betrag = vorheriger − 1,5 % (auf Cent).
   * Drei Buchungen = vier Konten (Ursprung bis letzte Zwischenstation). Jede gültige Kette ergibt dieselbe Route
   * (tools/check.js prüft das über alle 84 Buchungen). */
  const dayNo = (d) => { const [a, b, c] = d.split(".").map(Number); return Math.round(Date.UTC(c, b - 1, a) / 864e5); };
  const cent = (x) => Math.round(x * 100) / 100;
  const eurTxt = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  function linkProblem(a, b) {
    if (a.to !== b.from) return `${b.id} kommt von ${b.from} – das Geld aus ${a.id} ging aber an ${a.to}.`;
    const d = dayNo(b.date) - dayNo(a.date);
    if (d < 1 || d > 3) return `${b.id} liegt ${d} Tag${Math.abs(d) === 1 ? "" : "e"} nach ${a.id}. Eine Weiterleitung folgt 1 bis 3 Tage später.`;
    const exp = cent(a.amount * 0.985);
    if (Math.abs(exp - b.amount) >= 0.005) return `${b.id}: erwartet ${eurTxt(exp)} (${a.id} minus 1,5 %), gebucht sind ${eurTxt(b.amount)}.`;
    return null;
  }
  const chainLinks = (tx) => tx.slice(1).map((b, i) => linkProblem(tx[i], b));
  const routeOf = (tx) => [tx[0].from, ...tx.map((t) => t.to)];
  const checkDigit = (k) => (AR.firms[k] ? AR.firms[k].iban.replace(/\s/g, "").slice(2, 4) : "??");
  function traceChain(ids) {
    const tx = ids.map((id) => AR.ledger.find((t) => t.id === id)).filter(Boolean).sort((a, b) => (dayNo(a.date) - dayNo(b.date)) || a.time.localeCompare(b.time));
    const left = locks.left("ledger");
    if (left > 0) return { ok: false, locked: left, target: "ledger", base: "Analysemodul gesperrt.", text: `Analysemodul gesperrt · noch ${locks.fmt(left)}` };
    const div = tx.find((t) => /^Dividende/.test(t.purpose));
    if (div) return { ok: false, soft: true, text: `${div.id} ist eine Ausschüttung an ${div.to}, keine Weiterleitung – sie gehört nicht zur Route. Entferne die Markierung.` };
    if (tx.length !== 3) return { ok: false, soft: true, text: `${tx.length} Buchung${tx.length === 1 ? "" : "en"} markiert. Gesucht ist ein vollständiger Durchlauf: drei Buchungen, vom Ursprung bis zur letzten Zwischenstation (vier Konten).` };
    const probs = chainLinks(tx), bad = probs.find(Boolean);
    if (!bad) {
      const route = routeOf(tx);
      S.route = tx.map((t) => t.id);
      addFound(`Geldroute ${route.join(" → ")} · Stationen-Code ${route.map(checkDigit).join("")}`);
      solve("R8");
      return { ok: true, tx, route, code: route.map(checkDigit).join("") };
    }
    const sec = locks.fail("ledger");
    MRSound.play("deny");
    return { ok: false, target: "ledger", tx, probs, base: "Keine gültige Kette: " + bad, text: "Keine gültige Kette: " + bad + (sec ? ` Analysemodul für ${locks.fmt(sec)} gesperrt.` : "") };
  }
  function setMark(id, on) { if (on) S.marks[id] = true; else delete S.marks[id]; changed(); }
  function registerSearch(q) {
    const d = String(q || "").replace(/\D/g, "");
    const left = locks.left("register");
    if (left > 0) return { ok: false, locked: left, text: `Registerabfrage gesperrt · noch ${locks.fmt(left)}` };
    if (d === AR.kestrel.digits) { solve("R9"); addFound("Registereintrag: " + AR.kestrel.name); return { ok: true, entry: AR.kestrel }; }
    if (!d) return { ok: false, text: "Abfrage nur über Registernummer möglich." };
    const sec = locks.fail("register");
    return { ok: false, text: "Kein Eintrag unter dieser Nummer." + (sec ? ` Abfrage für ${locks.fmt(sec)} gesperrt.` : "") };
  }
  function freightFinding(code) {
    return attempt("N6", norm(code) === "K3", () => { solveSide("N6"); addFound("Embargoverstoß: KN-2299 / Code K-3"); }, "Befund passt nicht zur Embargoliste.");
  }
  function brenner(pw) {
    const ok = ["NORDELBE", "HAFENBANKNORDELBE"].includes(norm(pw));
    return attempt("N8", ok, () => { solveSide("N8"); addFound("Pressekontakt: Notizen Mats Brenner"); }, "Kennwort falsch.");
  }
  function flagAuto(txId) {
    S.autoFlags[txId] = !S.autoFlags[txId];
    if (txId === "TX-1015" && S.autoFlags[txId]) { solveSide("N5"); addFound("TX-1015: automatisierte Zahlung am Feiertag"); }
    changed();
  }
  function addFound(t) { if (!S.found.includes(t)) { S.found.push(t); changed(); } }

  /* ---------- Terminal ---------- */
  const B64 = (s) => { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return null; } };
  const HELP = {
    help: "help [befehl] – zeigt Befehle oder erklärt einen Befehl.",
    sysinfo: "sysinfo – Informationen über diesen Rechner und die Kennwortrichtlinie.",
    ls: "ls – Dateien im Arbeitsordner. Mit -a auch versteckte Dateien (Punkt am Anfang).",
    meta: "meta <datei> – zeigt die Metadaten einer Bild- oder Audiodatei (Kamera, Zeit, Kommentar …).",
    decode: "decode <text> – übersetzt Base64 in lesbaren Text. Base64 erkennt man an A–Z, a–z, 0–9, + und /, oft mit = am Ende. Base64 ist eine Kodierung, keine Verschlüsselung.",
    whoami: "whoami – zeigt den angemeldeten Benutzer und seine Gruppen.",
    clear: "clear – leert den Bildschirm.",
    auth: "auth <schlüssel> – gibt das Archiv mit einem Archivschlüssel frei.",
    restore: "restore <fragment1> <fragment2> <fragment3> – setzt gelöschte Fragmente in dieser Reihenfolge zusammen. Statt der Dateinamen gehen auch die Fragment-IDs.",
    log: "log [--user <name>] – Systemprotokoll, optional nur für einen Benutzer.",
    history: "history – zuletzt eingegebene Befehle des Kontoinhabers.",
    inspect: "inspect window – untersucht das zuletzt geöffnete fremde Fenster.",
    repair: "repair <block> <wert> – ersetzt einen Block im Masterprotokoll (Blöcke 1–8, vier Hex-Zeichen).",
    decrypt: "decrypt ARCHON_ORIGIN --key <schlüssel> – entschlüsselt das Ursprungsarchiv.",
    cat: "cat <datei> – zeigt den Inhalt einer kleinen Textdatei.",
    status: "status – Sitzung, Rückverfolgung, Sicherheitslevel, Kapitel.",
  };
  function available() {
    const ch = chapter(), c = ["help", "sysinfo", "ls", "meta", "decode", "whoami", "clear", "status"];
    if (S.login) c.push("auth");
    if (is("R3")) c.push("log", "history", "cat");
    if (ch >= 2) c.push("restore");
    if (ch >= 4) c.push("inspect");
    if (ch >= 5) c.push("repair", "decrypt");
    return c;
  }
  const imgMeta = (name) => { const id = Object.keys(AR.nodes).find((k) => AR.nodes[k].name.toLowerCase() === String(name).toLowerCase()); return id && AR.nodes[id].meta ? AR.nodes[id].meta : null; };
  function command(input) {
    const raw = String(input || "").trim(), out = [];
    const P = (t, cls = "") => out.push({ t, cls });
    if (!raw) return out;
    const parts = raw.split(/\s+/), cmd = parts[0].toLowerCase(), args = parts.slice(1);
    if (!available().includes(cmd)) { P(`Unbekannter Befehl: ${parts[0]} – help zeigt alle Befehle.`, "dim"); return out; }
    const lockedOut = (t) => { const l = locks.left(t); if (l > 0) { P(`GESPERRT · ${locks.fmt(l)} · Sicherheitsprotokoll`, "err"); return true; } return false; };
    switch (cmd) {
      case "help":
        if (args[0] && HELP[args[0].toLowerCase()]) P(HELP[args[0].toLowerCase()]);
        else { P("Verfügbare Befehle:"); available().forEach((c) => P("  " + HELP[c], "dim")); P("help <befehl> erklärt einen Befehl genauer." + (is("R3") ? " Fachbegriffe: NORDSUCHE im Browser." : ""), "dim"); }
        break;
      case "clear": return [{ clear: true }];
      case "status": P(`HOST ARIS-ARCHIVE-07 · KAPITEL ${chapter()} · SECURITY LEVEL 0${level()} · TRACE ${fmt(remaining())}`); break;
      case "sysinfo":
        ["Host: ARIS-ARCHIVE-07 (Archivrechner)", "Betrieb: über Infrastruktur Dritter", "Benutzer: h.aris", "Kennworthinweis: „Wo sie liegt.“",
          "Kennwortrichtlinie: Buchstaben, gefolgt von Ziffern. Keine Leerzeichen.", "Hintergrundbild: harbour.jpg"].forEach((l) => P(l));
        break;
      case "ls": {
        const all = args[0] === "-a";
        const files = ["harbour.jpg", "readme.txt"];
        if (is("R3")) files.push("syslog.db");
        if (chapter() >= 5) files.push("master.proto", "ARCHON_ORIGIN.enc");
        if (all && chapter() >= 5) files.push(".postkarte");
        files.forEach((f) => P("  " + f));
        if (all && chapter() < 5) P("  (keine versteckten Dateien)", "dim");
        break;
      }
      case "cat": {
        const f = (args[0] || "").toLowerCase();
        if (f === "readme.txt") P("Archivrechner H. A. – Fernzugang nur für Berechtigte. Alles Weitere im Archiv.");
        else if (f === ".postkarte" && chapter() >= 5) { P("„Ich lebe. Danke, dass du geblieben bist. – H.“", "ok"); solveSide("N12"); addFound("Postkarte von Aris: Er lebt."); }
        else P(`cat: ${args[0] || ""}: nicht gefunden`, "err");
        break;
      }
      case "meta": {
        if (!args[0]) { P("Syntax: meta <datei>", "warn"); break; }
        const m = imgMeta(args[0]);
        if (!m) { P(`meta: ${args[0]}: keine Metadaten gefunden`, "err"); break; }
        Object.entries(m).forEach(([k, v]) => P(`  ${k.padEnd(12)} ${v}`));
        break;
      }
      case "decode": {
        if (!args[0]) { P("Syntax: decode <text>", "warn"); break; }
        const r = B64(args.join(""));
        if (r === null || !/^[\x20-\x7EäöüÄÖÜß]+$/.test(r)) { P("decode: kein gültiges Base64", "err"); break; }
        P(r, "ok");
        if (norm(r) === "SARGASSO" && S.login) solve("R2", true);
        break;
      }
      case "whoami":
        if (!S.login) P("guest@unknown");
        else { P("h.aris  Gruppen: archiv, wg-nordelbe"); solveSide("N1"); addFound("Archivrechner läuft in Gruppe wg-nordelbe (Hafenbank)"); }
        break;
      case "auth": {
        if (lockedOut("auth")) break;
        const r = attempt("auth", norm(args[0]) === "SARGASSO", () => solve("R3"), "AUTH FAILED.");
        if (r.ok) { ["ACCESS GRANTED.", "USER: H.V.ARIS · SECURITY LEVEL 02", "ARCHIVE STATUS: PARTIALLY RECOVERED", "Neue Anwendungen auf dem Desktop."].forEach((l) => P(l, "ok")); }
        else P(r.text, "err");
        break;
      }
      case "restore": {
        if (lockedOut("restore")) break;
        if (is("R4")) { P("Bereits wiederhergestellt: Dokumente/wiederhergestellt/pruefbericht_entwurf.txt"); break; }
        const map = { FRAGA: "2C9", FRAGB: "7F3", FRAGC: "A11", "2C9": "2C9", "7F3": "7F3", A11: "A11" };
        const ids = args.slice(0, 3).map((a) => map[norm(a.replace(/\.bin$/i, ""))]);
        if (args.length < 3 || ids.some((x) => !x)) { P("Syntax: restore <fragment1> <fragment2> <fragment3> (z. B. Dateinamen aus dem Papierkorb)", "warn"); break; }
        const r = attempt("restore", ids.join() === "2C9,A11,7F3", () => solve("R4"), "Prüfsumme ungültig – Reihenfolge falsch.");
        if (r.ok) { P("RESTORE OK · pruefbericht_entwurf.txt → Dokumente/wiederhergestellt", "ok"); addFound("Prüfbericht (Entwurf) wiederhergestellt"); }
        else P(r.text, "err");
        break;
      }
      case "log": {
        const u = args[0] === "--user" ? (args[1] || "").toLowerCase() : null;
        const lines = [
          ["03.11. 22:47", "unknown", "REMOTE SESSION ESTABLISHED"],
          ["03.11. 22:47", "system", "TRACE STARTED"],
        ];
        if (chapter() >= 3) lines.push(["14.10. 19:12", "ns_observer", "LOGIN (read-only)"], ["28.10. 19:37", "ns_observer", "LOGIN (read-only)"], ["28.10. 19:46", "ns_observer", "LOGOUT"], ["03.11. 23:05", "ns_observer", "SESSION WATCH"]);
        const sel = u ? lines.filter((l) => l[1] === u) : lines;
        if (!sel.length) P(u ? `Keine Einträge für ${u}.` : "Keine Einträge.", "dim");
        sel.forEach((l) => P(`  ${l[0]}  ${l[1].padEnd(12)} ${l[2]}`));
        if (u === "ns_observer" && chapter() >= 3) { solveSide("N7"); addFound("ns_observer meldet sich in Sitzungspausen an (14.10., 28.10.)"); }
        break;
      }
      case "history":
        ["  restore frag_A …", "  log --user ns_observer", "  schedule msg 03.11 22:47 --to <anonym> --link remote", "  shutdown --archive-mode"].forEach((l) => P(l, "dim"));
        solveSide("N10"); addFound("Aris hat den Link selbst für 03.11. 22:47 geplant");
        break;
      case "inspect": {
        if ((args[0] || "").toLowerCase() !== "window") { P("Syntax: inspect window", "warn"); break; }
        if (!S.flags.watchSeen) { P("inspect: kein fremdes Fenster gefunden", "err"); break; }
        ["<window id=\"archon-watch\" class=\"overlay\">", "  <meta name=\"trace_origin\" content=\"hafenbank-nordelbe.local\">", "  <meta name=\"operator\" content=\"ns_observer\">", "</window>"].forEach((l) => P(l, "dim"));
        solveSide("N9"); addFound("Überwachung geht von hafenbank-nordelbe.local aus");
        break;
      }
      case "repair": {
        if (lockedOut("repair")) break;
        const b = Number(args[0]), v = norm(args[1]);
        if (!(b >= 1 && b <= 8) || !/^[0-9A-F]{4}$/.test(v)) { P("Syntax: repair <block 1–8> <vier Hex-Zeichen>", "warn"); break; }
        const fix = AR.proto.fixes[b];
        const ok = Boolean(fix) && v === fix && !S.proto[b];
        if (S.proto[b]) { P(`Block ${b} ist bereits repariert.`); break; }
        const r = attempt("repair", ok, () => { S.proto[b] = true; changed(); }, `Block ${b}: Reparatur abgelehnt.`, { fixed: locks.fails("repair") >= 1 ? 120 : 0 });
        if (r.ok) {
          P(`Block ${b} repariert: ${v}`, "ok");
          if (Object.keys(AR.proto.fixes).every((k) => S.proto[k])) { solve("R14"); P("MASTERPROTOKOLL LESBAR.", "ok"); P("MASTER = <ZUGANG>-<TON>-<STATIONEN>-<ORDNUNG>", "hl"); }
        } else P(r.text, "err");
        break;
      }
      case "decrypt": {
        if (lockedOut("decrypt")) break;
        if (!is("R14")) { P("decrypt: Masterprotokoll beschädigt – Format unbekannt.", "err"); break; }
        const ki = parts.findIndex((p) => p.toLowerCase() === "--key");
        if (!/^archon_origin(\.enc)?$/i.test(args[0] || "") || ki < 0 || !parts[ki + 1]) { P("Syntax: decrypt ARCHON_ORIGIN --key <schlüssel>", "warn"); break; }
        const given = parts[ki + 1].toUpperCase().split("-");
        const want = ["LIEGEPLATZ47", "VELLUM", "42178805", "ORKAN"];
        const ok = given.length === 4 && given.every((g, i) => norm(g) === want[i]);
        const r = attempt("decrypt", ok, () => solve("R15"), "DECRYPTION FAILED.");
        if (r.ok) { P("KEY ACCEPTED · ARCHON_ORIGIN entschlüsselt.", "ok"); P("Die Entscheidung ist jetzt möglich.", "hl"); }
        else {
          P(r.text, "err");
          if (locks.fails("decrypt") >= 3) P(`${given.length === 4 ? given.filter((g, i) => norm(g) === want[i]).length : 0} von 4 Teilen gültig.`, "warn");
        }
        break;
      }
      default: P(`Unbekannter Befehl: ${parts[0]}`, "dim");
    }
    return out;
  }

  /* ---------- Hinweise ---------- */
  const openPuzzles = () => AR.puzzles.filter((p) => p.ch === chapter() && !is(p.id) && (!p.needs || p.needs.every(is)));
  function revealHint(id) {
    const p = AR.puzzles.find((x) => x.id === id), n = S.hints[id] || 0;
    if (!p || n >= p.hints.length) return;
    S.hints[id] = n + 1; (S.hintAt[id] = S.hintAt[id] || []).push(S.elapsed); changed();
  }
  const hintsUsed = () => Object.values(S.hints).reduce((a, b) => a + b, 0);

  /* ---------- Beweistiefe, Wertung, Enden ---------- */
  function evidence() {
    const pts = Object.keys(S.sides).length;
    const cats = new Set(Object.keys(S.sides).map((k) => AR.sides[k].cat));
    return { pts, cats, allCats: ["fin", "org", "person", "watch"].every((c) => cats.has(c)), n8: side("N8") };
  }
  const mainSolved = () => ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R12", "R13", "R14", "R15"].filter(is).length;
  function score() {
    const e = evidence();
    const inv = (0.6 * mainSolved() / 15 + 0.4 * e.pts / 12) * 100;
    const acc = Math.max(0, 100 - 4 * locks.total());
    const time = relaxed() ? null : S.ending && S.ending !== "FAIL" ? Math.min(remaining() / 1800, 1) * 100 : 0;
    const help = Math.max(0, 100 - 10 * hintsUsed());
    const sec = S.maxFailLevel <= 3 ? 100 : S.maxFailLevel === 4 ? 75 : 50;
    // Ohne Zeitdruck: Zeitanteil entfällt, die übrigen Anteile werden hochgerechnet (eigene Wertung)
    const total = relaxed() ? Math.round((0.35 * inv + 0.25 * acc + 0.1 * help + 0.1 * sec) / 0.8) : Math.round(0.35 * inv + 0.25 * acc + 0.2 * time + 0.1 * help + 0.1 * sec);
    const title = total >= 95 ? "THE ARCHON" : total >= 80 ? "GHOST PROTOCOL" : total >= 60 ? "MASTER ANALYST" : total >= 40 ? "DIGITAL FORENSIC" : "ARCHON INITIATE";
    return { total, title, relaxed: relaxed(), parts: { inv: Math.round(inv), acc, time: time === null ? null : Math.round(time), help, sec }, evidence: e, main: mainSolved(), hints: hintsUsed(), fails: locks.total() };
  }
  function decide(choice) {
    if (!is("R15") || S.ending) return null;
    const e = evidence(), strong = e.pts >= 6 && e.allCats;
    const id = choice === "A" ? (strong && e.n8 ? "A1" : "A2") : (strong ? "B1" : "B2");
    S.choice = choice; finish(id); return id;
  }
  function finish(id) { if (S.ending) return; S.ending = id; clock.stop(); changed(); AR.emit("end", id); }

  /* ---------- Start ---------- */
  function start(mode) {
    if (!S.started) { S.started = true; S.mode = mode === "relaxed" ? "relaxed" : "timer"; S.startedAt = new Date().toISOString(); S.chAt[1] = 0; changed(); }
    clock.start();
  }

  /* ---------- Testprotokoll ---------- */
  const FAIL_TARGET = { R1: "login", R3: "auth", R4: "restore", R5: "R5", R6: "R6", R8: "ledger", R9: "register", R10: "R10", R11: "R11", R12: "R12", R14: "repair", R15: "decrypt" };
  const mmss = (sec) => (sec == null ? "–" : `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`);
  function protocol() {
    const now = S.elapsed, ch = chapter(), sc = score();
    const chapters = [1, 2, 3, 4, 5].filter((c) => S.chAt[c] != null).map((c) => {
      const end = S.chAt[c + 1] != null ? S.chAt[c + 1] : S.ending ? now : null;
      return { kapitel: c, beginn: mmss(S.chAt[c]), ende: end == null ? "läuft" : mmss(end), dauer_min: +(((end == null ? now : end) - S.chAt[c]) / 60).toFixed(1) };
    });
    const puzzles = AR.puzzles.map((p) => {
      const op = S.openAt[p.id], sv = S.solved[p.id], dur = op == null ? null : (sv != null ? sv : now) - op, act = S.act.p[p.id] || 0;
      return { id: p.id, raetsel: p.label, kapitel: p.ch, freigeschaltet: mmss(op), geloest: sv != null ? mmss(sv) : (op != null ? "offen" : "–"),
        offen_min: dur == null ? null : +(dur / 60).toFixed(1), aktiv_min: +(act / 60).toFixed(1), hinweisstufe: S.hints[p.id] || 0, hinweis_zeiten: (S.hintAt[p.id] || []).map(mmss),
        fehlversuche: FAIL_TARGET[p.id] ? locks.fails(FAIL_TARGET[p.id]) : 0, ueber_10_min_aktiv: act > 600 };
    });
    return {
      spiel: "Das ARCHON-Protokoll", version: AR.version || "", erstellt: new Date().toISOString(), begonnen: S.startedAt,
      modus: relaxed() ? "ohne Zeitdruck" : "Countdown 120 min", gesamtdauer_min: +(now / 60).toFixed(1), restzeit: relaxed() ? "–" : mmss(remaining()),
      ende: S.ending || "nicht beendet", kapitel_erreicht: ch, haupraetsel_geloest: mainSolved(), nebenraetsel: Object.keys(S.sides).length,
      hinweise_gesamt: hintsUsed(), fehlversuche_gesamt: locks.total(), wertung: S.ending ? sc.total : null,
      ueber_10_min_aktiv: puzzles.filter((p) => p.ueber_10_min_aktiv).map((p) => `${p.id} ${p.raetsel} (${p.aktiv_min} min aktiv)`),
      kapitel: chapters, raetsel: puzzles,
      programme_aktiv_min: Object.fromEntries(Object.entries(S.act.app).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / 60).toFixed(1)])),
      rechnungsabgleich: { rechnungen_angesehen: Object.keys(S.invSeen).length + " von 6", notizen: Object.keys(S.invMarks).length, fehler_notiert: Object.values(S.invMarks).filter((v) => v === "bad").length,
        aktiv_min: +((S.act.p.R10 || 0) / 60).toFixed(1), beim_loesen: S.r10snap ? `${S.r10snap.gesehen} von 6 angesehen, ${S.r10snap.fehler_notiert} Fehler notiert` : "noch nicht gelöst", fehlversuche: locks.fails("R10") },
      hinweis: "Offen = Freischaltung bis Lösung (parallel offene Rätsel überschneiden sich). Aktiv = Sekunden, in denen ein zum Rätsel gehörendes Programm vorne lag und das Spiel nicht pausiert war.",
    };
  }
  function reset() { S = fresh(); save(); clock.stop(); AR.emit("change"); }
  function pause(on) { clock.pause(on); MRSound.suspend(on); AR.emit("pause", on); }
  updateLevel();

  AR.game = {
    get state() { return S; }, TOTAL, norm, fmt, remaining, chapter, level, cond, is, side, visible, unlocked, children,
    solve, solveSide, setFlag, addFound, login, spectro, traceChain, chainLinks, routeOf, checkDigit, setMark, registerSearch, protocol, relaxed, freightFinding, brenner, flagAuto, tryNodeLock,
    command, available, openPuzzles, revealHint, hintsUsed, evidence, score, decide, start, reset, pause,
    isPaused: () => clock.isPaused(), locks, save,
    _set(sec) { S.elapsed = sec; if (S.elapsed >= TOTAL && !S.ending && !relaxed()) finish("FAIL"); AR.emit("tick"); },
  };
})();
