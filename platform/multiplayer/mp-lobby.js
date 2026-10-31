/*
 * MYSTERY ROOMS – Multiplayer-Lobby (spielunabhängig)
 *
 * Erzeugt die Lobby-Oberfläche in einem Container des Spiels:
 *   Name eingeben · Sitzung erstellen · Code anzeigen und kopieren · mit Code beitreten ·
 *   Spielerliste · nur der Host startet · Sitzung verlassen.
 * Aussehen über CSS-Variablen (siehe mp-lobby.css), Texte über `texts`.
 *
 *   const lobby = MRLobby.mount({ client, root, texts, defaultName, onEnter, onLeft });
 *   onEnter(session, { auto })   → Spiel soll (wieder) beginnen
 *   onLeft(reason)               → Sitzung verlassen oder beendet
 */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NAME_KEY = "mr_mp_player_name";
  const cleanCode = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const prettyCode = (v) => { const c = cleanCode(v); return c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; };

  const DEFAULT_TEXTS = {
    title: "Gemeinsam spielen",
    copy: "Erstellt eine gemeinsame Sitzung oder tretet mit einem Einladungscode bei. Jeder bewegt sich frei durch die Räume – Rucksack, Akte und gelöste Rätsel teilt ihr.",
    open: "Gemeinsam spielen",
    lobbyKicker: "PRIVATE SITZUNG",
    lobbyTitle: "Gemeinsamer Start",
    namePlaceholder: "z. B. Alex",
    create: "Sitzung erstellen",
    join: "Sitzung beitreten",
    codePlaceholder: "CODE-XXXXXX",
    hostWaiting: "Teile den Code mit deinen Mitspielern. Nur du kannst das Spiel starten.",
    guestWaiting: "Du bist dabei. Warte, bis der Host das Spiel startet.",
    start: "Spiel starten",
    running: "Eure Sitzung läuft. Du kannst jederzeit zurückkehren.",
    enter: "Zurück ins Spiel",
    leave: "Sitzung verlassen",
    leaveConfirm: "Sitzung wirklich verlassen? Als Host beendest du sie damit für alle.",
    playersHead: "SPIELER",
  };

  function mount({ client, root, texts = {}, defaultName = "", onEnter = () => {}, onLeft = () => {}, buttons = {} }) {
    const T = { ...DEFAULT_TEXTS, ...texts };
    const B = { primary: "primary-button small", ghost: "ghost-button", danger: "danger-button", ...buttons };
    let open = false, busy = false, status = { text: "", kind: "" }, entered = false;
    let savedName = ""; try { savedName = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ }
    let nameValue = savedName || defaultName, codeValue = "";

    const setStatus = (text, kind = "") => { status = { text, kind }; paintStatus(); };
    const paintStatus = () => {
      const el = root.querySelector(".mp-status");
      if (!el) return;
      el.textContent = status.text; el.dataset.kind = status.kind; el.hidden = !status.text;
    };
    const name = () => (nameValue || "").trim().slice(0, 24);

    function playersHtml() {
      const s = client.session, me = client.user && client.user.id;
      return `<div class="mp-players-head"><span>${esc(T.playersHead)}</span><span>${client.players.length} / ${s.max_players || 4}</span></div>
        <ul class="mp-player-list">${client.players.map((p, i) => `<li class="mp-player${p.user_id === me ? " me" : ""}"><span class="mp-player-number">${String(i + 1).padStart(2, "0")}</span><span class="mp-player-name">${esc(p.player_name)}${p.user_id === me ? " <em>(du)</em>" : ""}</span><span class="mp-role${p.is_host ? "" : " mp-role-guest"}">${p.is_host ? "HOST" : "GAST"}</span></li>`).join("")}</ul>`;
    }

    function render() {
      const s = client.session;
      let html;
      if (!s) {
        html = `<h2 class="mp-entry-title">${esc(T.title)}</h2>
          <p class="mp-entry-copy">${esc(T.copy)}</p>
          ${open ? `<div class="mp-lobby">
            <div class="mp-lobby-head"><div><p class="eyebrow">${esc(T.lobbyKicker)}</p><h3>${esc(T.lobbyTitle)}</h3></div><button type="button" class="mp-lobby-close" data-mp="close" aria-label="Schließen">×</button></div>
            <label class="mp-field"><span>Dein Name</span><input data-mp-input="name" maxlength="24" autocomplete="nickname" placeholder="${esc(T.namePlaceholder)}" value="${esc(nameValue)}"></label>
            <button type="button" class="${B.primary} mp-wide" data-mp="create">${esc(T.create)} <span>→</span></button>
            <div class="mp-divider"><span>ODER MIT CODE</span></div>
            <label class="mp-field"><span>Einladungscode</span><input class="mp-code-input" data-mp-input="code" maxlength="11" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(T.codePlaceholder)}" value="${esc(codeValue)}"></label>
            <button type="button" class="${B.ghost} mp-wide" data-mp="join">${esc(T.join)}</button>
          </div>` : `<button type="button" class="${B.ghost}" data-mp="open">${esc(T.open)}</button>`}`;
      } else {
        const running = s.status === "running";
        html = `<div class="mp-lobby">
          <div class="mp-lobby-head"><div><p class="eyebrow">${esc(T.lobbyKicker)}</p><h3>${esc(running ? "Sitzung läuft" : T.lobbyTitle)}</h3></div></div>
          <div class="mp-code-card"><p class="mp-code-label">EINLADUNGSCODE</p><div class="mp-room-code">${esc(s.room_code)}</div>${running ? "" : `<button type="button" class="mp-copy" data-mp="copy">Code kopieren</button>`}</div>
          ${playersHtml()}
          <p class="mp-waiting">${esc(running ? T.running : s.is_host ? T.hostWaiting : T.guestWaiting)}</p>
          ${running ? `<button type="button" class="${B.primary} mp-wide" data-mp="enter">${esc(T.enter)} <span>→</span></button>`
            : s.is_host ? `<button type="button" class="${B.primary} mp-wide" data-mp="start">${esc(T.start)} <span>→</span></button>` : ""}
          <div class="mp-secondary-actions"><span class="mp-micro">MAXIMAL ${s.max_players || 4} SPIELER</span><button type="button" class="${B.danger}" data-mp="leave">${esc(T.leave)}</button></div>
        </div>`;
      }
      root.innerHTML = html + `<p class="mp-status" role="status" aria-live="polite" hidden></p>`;
      root.querySelectorAll("button[data-mp]").forEach((b) => { if (busy && b.dataset.mp !== "close") b.disabled = true; });
      paintStatus();
    }

    async function act(fn, pending) {
      if (busy) return;
      busy = true; if (pending) setStatus(pending); render();
      try { await fn(); } catch (e) { setStatus(e.message || String(e), "error"); }
      busy = false; render();
    }

    const actions = {
      open() { open = true; render(); const i = root.querySelector('[data-mp-input="name"]'); if (i) i.focus(); },
      close() { open = false; setStatus(""); render(); },
      create() {
        if (!name()) { setStatus("Bitte gib zuerst deinen Namen ein.", "error"); return root.querySelector('[data-mp-input="name"]')?.focus(); }
        try { localStorage.setItem(NAME_KEY, name()); } catch (e) { /* privat */ }
        return act(async () => { await client.create(name()); setStatus("Sitzung erstellt. Teile den Einladungscode.", "success"); }, "Die Sitzung wird vorbereitet …");
      },
      join() {
        if (!name()) { setStatus("Bitte gib zuerst deinen Namen ein.", "error"); return root.querySelector('[data-mp-input="name"]')?.focus(); }
        if (cleanCode(codeValue).length < 10) { setStatus("Bitte gib den vollständigen Einladungscode ein.", "error"); return root.querySelector('[data-mp-input="code"]')?.focus(); }
        try { localStorage.setItem(NAME_KEY, name()); } catch (e) { /* privat */ }
        return act(async () => {
          const s = await client.join(prettyCode(codeValue), name());
          setStatus("Du bist der Sitzung beigetreten.", "success");
          if (s.status === "running") enter(false);
        }, "Die Einladung wird geprüft …");
      },
      start() { return act(async () => { await client.start(); setStatus(""); enter(false); }, "Das Spiel wird gestartet …"); },
      enter() { enter(false); },
      async copy() {
        const code = client.session && client.session.room_code;
        if (!code) return;
        try { await navigator.clipboard.writeText(code); setStatus("Code kopiert.", "success"); }
        catch (e) { setStatus("Bitte den Code markieren und kopieren: " + code, "success"); }
      },
      leave() {
        if (!confirm(T.leaveConfirm)) return;
        return leave();
      },
    };

    function enter(auto) { entered = true; onEnter(client.session, { auto }); }
    function leave() {
      return act(async () => { await client.leave(); entered = false; open = false; setStatus("Du hast die Sitzung verlassen."); onLeft(null); });
    }

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-mp]");
      if (b && !b.disabled && actions[b.dataset.mp]) actions[b.dataset.mp]();
    });
    root.addEventListener("input", (e) => {
      const k = e.target.dataset.mpInput;
      if (k === "name") nameValue = e.target.value;
      if (k === "code") { const pos = prettyCode(e.target.value); e.target.value = pos; codeValue = pos; }
    });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const k = e.target.dataset && e.target.dataset.mpInput;
      if (k === "code") actions.join();
      if (k === "name" && !cleanCode(codeValue)) actions.create();
    });

    client.on("players", () => { if (!busy) render(); });
    client.on("status", (st) => {
      if (!busy) render();
      // Gäste starten automatisch, sobald der Host das Spiel eröffnet
      if (st === "running" && !entered) enter(true);
    });
    client.on("lost", (reason) => { entered = false; open = false; setStatus(reason, "error"); render(); onLeft(reason); });

    render();
    return {
      render, setStatus, leave,
      /** gespeicherte Sitzung nach dem Neuladen wiederherstellen */
      async restore() {
        busy = true; render();
        try {
          const r = await client.restore();
          if (r && r.closed) setStatus(`Die Sitzung ${r.room_code} wurde inzwischen beendet.`, "error");
          else if (r) setStatus(r.status === "running" ? "Verbindung zur laufenden Sitzung wiederhergestellt." : "Verbindung zur Sitzung wiederhergestellt.", "success");
          return r && !r.closed ? r : null;
        } catch (e) { setStatus(e.message || String(e), "error"); return null; }
        finally { busy = false; render(); }
      },
    };
  }

  window.MRLobby = { mount, cleanCode, prettyCode };
})();
