/*
 * Case Unlocked · Abenteuer – Spieltisch (Tablet oder ein Gerät allein)
 * Gruppe aus den 15 Figuren wählen, Stufe, Schwierigkeit und Gegner einstellen, dann auf der Rasterkarte kämpfen.
 * Alle Regeln stehen in regeln.js, die Figuren in figuren.js.
 *
 * Mit Handys: Dieses Gerät eröffnet eine Sitzung (vorhandene Plattform, mp-core.js) und ist der
 * einzige Schiedsrichter. Es schreibt den öffentlichen Stand unter „spiel“. Handys schreiben nur
 * eigene Einträge: „wahl:<Nutzer>“ (welche Figur) und „zug:<Nutzer>“ (gewünschte Aktion).
 * Der Tisch prüft jeden Wunsch mit den Regeln, würfelt selbst und übernimmt nur Einträge,
 * die der jeweilige Nutzer selbst geschrieben hat.
 */
(function () {
  "use strict";
  const R = window.ABR, F = window.ABF, B = window.ABB, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const Z = 60; // Feldgröße im SVG
  const params = new URLSearchParams(location.search);
  const TEMPO = params.has("schnell") ? 0 : 650;
  const SLUG = params.get("liveslug") || "abenteuer"; // ?liveslug= nur für Tests
  const SPEICHER = "ab_tisch", SETUP_KEY = "ab_setup";
  const SELBST = new Set(["selbstheilung", "trank", "raserei", "finte", "gift", "verstecken", "rueckzug", "spurt", "schattenschritt", "spiegelbilder", "segen", "schutzkreis", "vertreiben", "bewahren", "massenheil", "rauch", "tatendrang"]);
  const BEGEGNUNGEN = R.BEGEGNUNGEN;
  let st = null, wahl = null, gegnerTimer = null, letzterLog = 0, kampfEnde = null, tipp = null, letzteTP = {};
  let SETUP = { gruppe: [], stufe: 1, schwierigkeit: "normal", begegnung: "garten" };
  try { const s = JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); if (s && Array.isArray(s.gruppe)) SETUP = Object.assign(SETUP, s, { gruppe: s.gruppe.filter((f) => F.FIGUREN[f]).slice(0, 6) }); } catch (e) { /* privat */ }
  const setupMerken = () => { try { localStorage.setItem(SETUP_KEY, JSON.stringify(SETUP)); } catch (e) { /* privat */ } };

  /* ---------- Live-Zustand ---------- */
  const LIVE = { client: null, phase: null, besitz: {}, erledigt: {}, antwort: null, schreibt: false, nochmal: false, sperre: null };
  const liveAn = () => Boolean(LIVE.client && LIVE.client.session);
  const spielerName = (uid) => (LIVE.client && LIVE.client.playerName(uid)) || "Handy";
  const besitzerVon = (f) => (liveAn() && f && f.fid ? LIVE.besitz[f.fid] : null);

  function speichern() {
    if (!liveAn()) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify({ phase: LIVE.phase, besitz: LIVE.besitz, erledigt: LIVE.erledigt, setup: SETUP, st: st ? R.speichern(st) : null, abenteuer: window.ABT ? window.ABT.speichern() : null, imAbenteuer: Boolean(kampfEnde) })); } catch (e) { /* privat */ }
  }
  function vergessen() { try { localStorage.removeItem(SPEICHER); } catch (e) { /* privat */ } }
  /** Allein am Tisch: laufenden Kampf im Abenteuer merken, damit Neuladen nichts kostet */
  const SOLO = "ab_solo";
  function soloMerken() { try { localStorage.setItem(SOLO, JSON.stringify({ st: st && kampfEnde ? R.speichern(st) : null })); } catch (e) { /* privat */ } }

  /** Öffentlichen Stand an alle Handys (immer nur der neueste, nie zwei Schreibvorgänge gleichzeitig) */
  function veroeffentlichen() {
    if (!liveAn()) { soloMerken(); return; }
    if (!LIVE.client.session.is_host) return;
    speichern();
    if (LIVE.schreibt) { LIVE.nochmal = true; return; }
    LIVE.schreibt = true; LIVE.nochmal = false;
    const namen = {}; LIVE.client.players.forEach((p) => { namen[p.user_id] = p.player_name; });
    const daten = Object.assign(window.ABT ? window.ABT.oeffentlich() : {}, { phase: LIVE.phase, besitz: LIVE.besitz, namen, gruppe: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, antwort: LIVE.antwort, antworten: LIVE.antworten || {}, at: Date.now() }, st && LIVE.phase === "kampf" ? R.ansicht(st) : {});
    LIVE.client.writeOwn("spiel", daten)
      .catch((e) => toast("Live: " + e.message))
      .then(() => { LIVE.schreibt = false; if (LIVE.nochmal) veroeffentlichen(); });
  }

  /** Einträge der Handys auswerten – nur, was der Nutzer selbst geschrieben hat */
  function eintrag(row) {
    if (!LIVE.client || !LIVE.client.session || !LIVE.client.session.is_host) return;
    const k = row.state_key || "", uid = k.slice(k.indexOf(":") + 1);
    if (!(k.startsWith("wahl:") || k.startsWith("zug:"))) return;
    if (row.updated_by && row.updated_by !== uid) return; // fremder Eintrag: ignorieren
    const v = row.state || {};
    if (k.startsWith("wahl:")) {
      const fid = v.fid || null;
      if (fid && !F.FIGUREN[fid]) return;
      if (fid && LIVE.besitz[fid] && LIVE.besitz[fid] !== uid) { veroeffentlichen(); return; }
      const kampf = LIVE.phase === "kampf";
      // Im Kampf nur Figuren übernehmen, deren Handy weg ist; in der Lobby höchstens 6 Handys
      if (fid && kampf && !SETUP.gruppe.includes(fid)) { veroeffentlichen(); return; }
      if (fid && !kampf && !Object.values(LIVE.besitz).includes(uid) && Object.keys(LIVE.besitz).length >= 6) { veroeffentlichen(); return; }
      if (kampf && !fid) { veroeffentlichen(); return; } // im Kampf behält man seine Figur
      for (const f of Object.keys(LIVE.besitz)) if (LIVE.besitz[f] === uid) delete LIVE.besitz[f];
      if (fid) LIVE.besitz[fid] = uid;
      if (!kampf) gruppeAusHandys();
      zeichneSetup(); if (st) render(); veroeffentlichen();
      return;
    }
    if (!v.n || v.n <= (LIVE.erledigt[uid] || 0)) return;
    LIVE.erledigt[uid] = v.n;
    const antwort = (fehler) => { LIVE.antwort = { uid, n: v.n, ok: !fehler, fehler: fehler || null }; LIVE.antworten = LIVE.antworten || {}; LIVE.antworten[uid] = LIVE.antwort; };
    if (["stimme", "geheim", "probe_wer", "probe_wurf", "ersatz"].includes(v.typ)) { antwort(window.ABT ? window.ABT.wunsch(uid, v) : "Kein Abenteuer."); veroeffentlichen(); return; }
    if (LIVE.phase !== "kampf" || !st || st.ende) { antwort("Der Kampf läuft gerade nicht."); veroeffentlichen(); return; }
    const akt = R.aktiv(st);
    if (akt.seite !== "spieler" || LIVE.besitz[akt.fid] !== uid) { antwort("Du bist gerade nicht am Zug."); veroeffentlichen(); return; }
    if (v.typ === "ende") { wahl = null; R.zugEnde(st); antwort(null); render(); gegnerSchleife(); veroeffentlichen(); return; }
    if (v.typ === "aktion") {
      const r = R.handeln(st, String(v.aktion), String(v.ziel || akt.id));
      antwort(r.fehler); wahl = null; render(); veroeffentlichen(); return;
    }
    antwort("Unbekannter Wunsch."); veroeffentlichen();
  }

  /** Mit Handys spielen nur die Figuren, die jemand auf dem Handy gewählt hat */
  function gruppeAusHandys() {
    const alt = SETUP.gruppe.filter((f) => LIVE.besitz[f]);
    SETUP.gruppe = alt.concat(Object.keys(LIVE.besitz).filter((f) => !alt.includes(f)));
  }
  function liveClient() {
    if (LIVE.client) return LIVE.client;
    if (!window.MRMultiplayer) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar. Ihr könnt allein auf diesem Gerät spielen.");
    const c = LIVE.client = window.MRMultiplayer.connect({ gameSlug: SLUG, maxPlayers: 7, storeKey: "ab_live:" + SLUG });
    c.on("state", eintrag);
    c.on("players", () => {
      const da = new Set(c.players.map((p) => p.user_id)); let geaendert = false;
      for (const f of Object.keys(LIVE.besitz)) if (!da.has(LIVE.besitz[f])) { delete LIVE.besitz[f]; geaendert = true; }
      if (LIVE.phase !== "kampf") gruppeAusHandys();
      zeichneSetup(); if (st) render();
      veroeffentlichen();
      if (geaendert && LIVE.phase === "kampf") toast("Ein Handy hat die Sitzung verlassen. Bis jemand die Figur übernimmt, steuert sie der Tisch.");
    });
    c.on("lost", (why) => { toast(why || "Live-Verbindung beendet."); LIVE.phase = null; vergessen(); zeichneLiveBar(); zeichneSetup(); if (st) render(); });
    return c;
  }
  const katalogFehler = (e) => /nicht verfügbar|game_catalog|unbekannt|unknown|not.*found|kein.*Spiel/i.test((e && e.message) || "");

  async function liveStarten() {
    const fb = $("#intro-fehler"); fb.textContent = ""; $("#live").disabled = true;
    try {
      const c = liveClient();
      try { await c.create("Spieltisch"); }
      catch (e) { if (/Gruppengröße|max/i.test(e.message || "")) { c.maxPlayers = 4; await c.create("Spieltisch"); } else throw e; }
      LIVE.phase = "lobby"; LIVE.besitz = {}; LIVE.erledigt = {}; LIVE.antwort = null; st = null; SETUP.gruppe = [];
      wach(); zeigeSetup(); veroeffentlichen();
    } catch (e) {
      fb.textContent = katalogFehler(e) ? "Das Spielen mit Handys ist für dieses Spiel noch nicht freigeschaltet. Ihr könnt allein auf diesem Gerät spielen." : (e.message || String(e));
    }
    $("#live").disabled = false;
  }
  async function liveBeenden() {
    if (!confirm("Live-Sitzung beenden? Die Handys werden getrennt.")) return;
    try { await LIVE.client.leave(); } catch (e) { /* schon zu */ }
    LIVE.phase = null; vergessen(); zeichneLiveBar(); if (st) render(); else zeigeSetup();
  }

  /* ---------- Beitritt: Code, Link, QR ---------- */
  function beitrittsLink() {
    const u = new URL("handy.html", location.href);
    if (params.get("liveslug")) u.searchParams.set("liveslug", SLUG);
    u.hash = LIVE.client.session.room_code;
    return u.href;
  }
  function qrSvg(text) {
    if (!window.qrcode) return "";
    const q = window.qrcode(0, "M"); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
  function beitrittBox() {
    const link = beitrittsLink(), code = LIVE.client.session.room_code;
    return `<div class="beitritt"><div class="qr">${qrSvg(link)}</div><div>
      <p class="eyebrow">Mit dem Handy beitreten</p><p class="code">${esc(code)}</p>
      <p class="note">Kamera auf den QR-Code richten. Oder auf dem Handy <b>${esc(link.replace(/#.*$/, "").replace(/^https?:\/\//, ""))}</b> öffnen und den Code eingeben.</p></div></div>`;
  }

  /* ---------- Gruppe zusammenstellen ---------- */
  function zeigeSetup() {
    zeigeSektion("lobby");
    if (liveAn()) LIVE.phase = "lobby";
    zeichneSetup(); veroeffentlichen();
  }
  let fokus = null, filter = "alle";
  /** Heldenwahl wie in einem Spiel: Gruppenplätze, Galerie mit Klassenfilter, große Vorstellung */
  function zeichneSetup() {
    const el = $("#lobby"); if (el.hidden) return;
    const HL = window.ABH_HELDEN, n = SETUP.gruppe.length, live = liveAn();
    if (!fokus || !F.FIGUREN[fokus]) fokus = SETUP.gruppe[n - 1] || F.REIHE[0];
    const namen = {}; if (live) for (const [fid, uid] of Object.entries(LIVE.besitz)) namen[fid] = spielerName(uid);
    const sicht = F.REIHE.filter((fid) => filter === "alle" || F.FIGUREN[fid].klasse === filter);
    const kacheln = sicht.map((fid) => {
      const uid = live ? LIVE.besitz[fid] : null, an = SETUP.gruppe.includes(fid);
      return HL.kachel(fid, { an, fokus: fid === fokus, status: uid ? "📱 " + spielerName(uid) : an ? "in der Gruppe" : "", statusArt: uid ? "" : "tisch" });
    }).join("");
    const an = SETUP.gruppe.includes(fokus), uidF = live ? LIVE.besitz[fokus] : null;
    const knopf = live
      ? `<p class="held-hinweis">${uidF ? `📱 <b>${esc(spielerName(uidF))}</b> spielt ${esc(F.FIGUREN[fokus].name)}.` : "Wählt eure Figuren auf den Handys. Hier könnt ihr sie euch ansehen."}</p>`
      : `<button class="btn gross held-knopf" id="f-waehlen" ${!an && n >= 6 ? "disabled" : ""}>${an ? "Aus der Gruppe nehmen" : n >= 6 ? "Die Gruppe ist voll" : `${esc(F.FIGUREN[fokus].name)} in die Gruppe`}</button>`;
    const handys = live ? LIVE.client.players.filter((p) => !p.is_host) : [];
    const status = live
      ? (handys.length ? `Verbunden: ${handys.map((p) => esc(p.player_name)).join(", ")}. ` : "Noch kein Handy verbunden. ") + `Es spielen nur die Figuren, die jemand auf dem Handy gewählt hat${n < 3 ? ` – mindestens 3, noch ${3 - n}` : ""}.`
      : n < 3 ? `Wählt mindestens 3 Figuren – noch ${3 - n}.` : "Eine Person steuert alle Figuren auf diesem Gerät.";
    const gegner = (() => { const g = R.gegnerFuer(SETUP.begegnung, Math.max(3, n), SETUP.stufe); return g.map((x) => `${x.anzahl} × ${R.GEGNER[x.art].name}${Math.abs(x.tpFaktor - 1) > 0.04 ? ` (${Math.round(R.GEGNER[x.art].tp * x.tpFaktor)} TP)` : ""}`).join(", "); })();
    el.innerHTML = `
      <div class="wahl-kopf"><div><p class="eyebrow">Die Gemeinschaft von Grauwacht</p><h1>Wählt eure Helden</h1></div>${HL.plaetze(SETUP.gruppe, namen)}</div>
      ${live ? beitrittBox() : ""}
      <div class="wahl-body">
        <div class="wahl-galerie">
          <div class="klassen-filter">${[["alle", "Alle"]].concat(Object.entries(F.KLASSEN).map(([k, v]) => [k, HL.KLASSE_ZEICHEN[k] + " " + v.name])).map(([k, t]) => `<button data-filter="${k}" class="${filter === k ? "an" : ""}">${esc(t)}</button>`).join("")}</div>
          <div class="fkarten">${kacheln}</div>
        </div>
        <div class="wahl-detail">${HL.detail(fokus, 1, knopf)}</div>
      </div>
      <div class="wahl-fuss">
        <h2 class="klein">${live ? `Gruppe · ${n} ${n === 1 ? "Person" : "Personen"} (3–6)` : `Gruppe · ${n} von 3–6 Figuren`}</h2>
        <p class="note">${status}</p>
        <div class="einstellungen"><div><span class="eyebrow">Schwierigkeit</span><div class="seg">${[["normal", "Normal"], ["hardcore", "Hardcore"]].map(([v, t]) => `<button data-schwer="${v}" class="${SETUP.schwierigkeit === v ? "an" : ""}">${t}</button>`).join("")}</div></div>
          <p class="note">${SETUP.schwierigkeit === "hardcore" ? "<b>Hardcore:</b> Wer fällt, würfelt um sein Leben. Tote bleiben tot." : "<b>Normal:</b> Am Boden ist das Schlimmste, was passieren kann."}</p></div>
        <div class="knoepfe"><button class="btn gross" id="abenteuer-los" ${n < 3 ? "disabled" : ""}>Aufbruch nach Halmbruck</button>${live ? `<button class="btn ghost" id="lobby-ende">Sitzung beenden</button>` : `<button class="btn ghost" id="zurueck">Zurück</button>`}</div>
        <details class="uebung"><summary>Übungskampf ohne Geschichte</summary>
          <div class="einstellungen">
            <div><span class="eyebrow">Stufe</span><div class="seg">${[1, 2, 3].map((s) => `<button data-stufe="${s}" class="${SETUP.stufe === s ? "an" : ""}">${s}</button>`).join("")}</div></div>
            <div><span class="eyebrow">Gegner</span><select id="begegnung">${Object.entries(BEGEGNUNGEN).map(([id, b]) => `<option value="${id}" ${SETUP.begegnung === id ? "selected" : ""}>${esc(b.name)} (Stufe ${b.stufe})</option>`).join("")}</select></div>
            <button class="btn ghost" id="los" ${n < 3 ? "disabled" : ""}>Übungskampf beginnen</button>
          </div>
          <p class="note">Gegner bei ${Math.max(3, n)} Figuren: ${gegner}. Die Gegner passen sich an die Gruppengröße an.</p>
        </details>
      </div>`;
    const uebung = el.querySelector(".uebung"); if (uebung && zeichneSetup.uebungOffen) uebung.open = true;
    if (uebung) uebung.ontoggle = () => { zeichneSetup.uebungOffen = uebung.open; };
    el.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => { fokus = b.dataset.fid; zeichneSetup(); if (window.innerWidth < 980) { const d = $(".wahl-detail"); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); } }; });
    el.querySelectorAll("[data-platz]").forEach((b) => { b.onclick = () => { fokus = b.dataset.platz; zeichneSetup(); }; });
    el.querySelectorAll("[data-filter]").forEach((b) => { b.onclick = () => { filter = b.dataset.filter; zeichneSetup(); }; });
    const w = $("#f-waehlen"); if (w) w.onclick = () => {
      const i = SETUP.gruppe.indexOf(fokus);
      if (i >= 0) SETUP.gruppe.splice(i, 1); else if (SETUP.gruppe.length < 6) { SETUP.gruppe.push(fokus); if (window.ABE) window.ABE.glocke(0.25); }
      setupMerken(); zeichneSetup(); veroeffentlichen();
    };
    el.querySelectorAll("[data-stufe]").forEach((b) => { b.onclick = () => {
      SETUP.stufe = +b.dataset.stufe;
      if ((BEGEGNUNGEN[SETUP.begegnung] || {}).stufe !== SETUP.stufe) SETUP.begegnung = Object.keys(BEGEGNUNGEN).find((id) => BEGEGNUNGEN[id].stufe === SETUP.stufe);
      setupMerken(); zeichneSetup(); veroeffentlichen();
    }; });
    el.querySelectorAll("[data-schwer]").forEach((b) => { b.onclick = () => { SETUP.schwierigkeit = b.dataset.schwer; setupMerken(); zeichneSetup(); veroeffentlichen(); }; });
    $("#begegnung").onchange = (e) => { SETUP.begegnung = e.target.value; setupMerken(); zeichneSetup(); };
    $("#los").onclick = () => start(params.has("seed") ? +params.get("seed") : Math.floor(Math.random() * 1e9));
    $("#abenteuer-los").onclick = () => { if (window.ABT) { if (window.ABE) window.ABE.glocke(1); window.ABT.start(SETUP); } };
    if ($("#lobby-ende")) $("#lobby-ende").onclick = liveBeenden;
    if ($("#zurueck")) $("#zurueck").onclick = () => zeigeSektion("kodex");
  }
  function zeichneLiveBar() {
    const bar = $("#livebar");
    if (!liveAn()) { bar.hidden = true; bar.innerHTML = ""; return; }
    const n = LIVE.client.players.filter((p) => !p.is_host).length;
    bar.hidden = false;
    bar.innerHTML = `<span class="dot"></span><b>LIVE</b> <span>${esc(LIVE.client.session.room_code)} · ${n} ${n === 1 ? "Handy" : "Handys"}</span><button class="btn ghost klein" id="qr-zeigen">Beitreten</button><button class="btn ghost klein" id="live-ende">Beenden</button>`;
    $("#qr-zeigen").onclick = () => { const o = $("#qr-overlay"); o.innerHTML = `<div class="karte-box">${beitrittBox()}<button class="btn" id="qr-zu">Schließen</button></div>`; o.hidden = false; $("#qr-zu").onclick = () => { o.hidden = true; }; };
    $("#live-ende").onclick = liveBeenden;
  }

  /* ---------- Bildschirm wach halten ---------- */
  async function wach() {
    try { if (navigator.wakeLock && !document.hidden && (!LIVE.sperre || LIVE.sperre.released)) LIVE.sperre = await navigator.wakeLock.request("screen"); } catch (e) { /* nicht unterstützt */ }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && liveAn()) wach(); });

  /* ---------- Karte ---------- */
  function hindernis(t, x, y) {
    const cx = x * Z + Z / 2, cy = y * Z + Z / 2;
    if (t === "G") return `<g transform="translate(${cx} ${cy})"><path d="M-14 22 V-8 Q-14 -22 0 -22 Q14 -22 14 -8 V22 Z" fill="#7c7a72" stroke="#3b3a35" stroke-width="2"/><path d="M0 -12 V8 M-6 -4 H6" stroke="#4c4a44" stroke-width="2.4"/><ellipse cy="24" rx="20" ry="5" fill="#000" opacity=".25"/></g>`;
    if (t === "M") return `<g><rect x="${x * Z + 2}" y="${y * Z + 2}" width="${Z - 4}" height="${Z - 4}" fill="#6b6152" stroke="#3a332a" stroke-width="2"/><path d="M${x * Z + 2} ${y * Z + 22}h${Z - 4}M${x * Z + 2} ${y * Z + 40}h${Z - 4}M${x * Z + 30} ${y * Z + 2}v20M${x * Z + 16} ${y * Z + 22}v18M${x * Z + 44} ${y * Z + 22}v18" stroke="#3a332a" stroke-width="1.5"/></g>`;
    if (t === "S") return `<g><rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" fill="#4a4036" stroke="#2a231c" stroke-width="2"/>${[0, 1, 2, 3].map((i) => `<rect x="${x * Z + 8 + i * 3}" y="${y * Z + 10 + i * 10}" width="${Z - 16 - i * 6}" height="6" fill="#6b5d4c"/>`).join("")}</g>`;
    if (t === "P") return `<g><rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="#050506"/><rect x="${x * Z + 4}" y="${y * Z + 4}" width="${Z - 8}" height="${Z - 8}" fill="#000" opacity=".7"/><path d="M${x * Z + 10} ${y * Z + 20} q10 -8 20 0 t20 0" stroke="#d8d0c0" stroke-opacity=".25" fill="none"/></g>`;
    if (t === "Z") {
      const an = st && st.siegel && (st.siegel.find((z) => z.x === x && z.y === y) || {}).beruehrt;
      return `<g transform="translate(${cx} ${cy})" class="siegelstein${an ? " an" : ""}"><ellipse cy="24" rx="20" ry="5" fill="#000" opacity=".35"/>${an ? `<circle r="27" fill="#e8c46a" opacity=".22"/>` : ""}<path d="M-13 24 L-16 -14 L0 -27 L16 -14 L13 24 Z" fill="${an ? "#8a7a52" : "#4a4842"}" stroke="${an ? "#f0d488" : "#24231f"}" stroke-width="2.5"/><path d="M0 -16 V12 M-7 -6 L7 2 M7 -6 L-7 2" stroke="${an ? "#fff2c4" : "#8a96a8"}" stroke-opacity="${an ? 1 : 0.45}" stroke-width="2.4" stroke-linecap="round"/></g>`;
    }
    if (t === "K") return `<g><rect x="${x * Z + 8}" y="${y * Z + 8}" width="${Z - 16}" height="${Z - 16}" fill="#6a4e30" stroke="#2e2014" stroke-width="2"/><path d="M${x * Z + 8} ${y * Z + 8}L${x * Z + Z - 8} ${y * Z + Z - 8}M${x * Z + Z - 8} ${y * Z + 8}L${x * Z + 8} ${y * Z + Z - 8}" stroke="#2e2014" stroke-width="2"/></g>`;
    if (t === "R") return `<g transform="translate(${cx} ${cy})"><path d="M-22 -22 Q0 -34 22 -22 L18 4 L-18 4 Z" fill="#8a6a2a" stroke="#3a2a10" stroke-width="2"/><path d="M0 4 V26" stroke="#b08850" stroke-width="4"/><circle cy="27" r="3" fill="#b08850"/></g>`;
    return `<g transform="translate(${cx} ${cy})"><circle r="24" fill="#6f6a60" stroke="#3b3a35" stroke-width="3"/><circle r="15" fill="#10161a"/><path d="M-10 -4 Q0 -10 10 -4" stroke="#3d5a6a" stroke-width="2" fill="none"/></g>`;
  }
  const farbeVon = (f) => (f.art === "wolf" ? "#3f7a3a" : F.KLASSEN[f.klasse].farbe);

  function render() {
    const svg = $("#karte"), k = st.karte, akt = R.aktiv(st);
    svg.setAttribute("viewBox", `0 0 ${k.b * Z} ${k.h * Z}`);
    const spielerDran = akt.seite === "spieler" && !st.ende && akt.tp > 0;
    const reach = spielerDran && !wahl ? R.bewegungsfelder(st, akt) : new Map();
    const zs = spielerDran && wahl ? R.ziele(st, wahl) : [];
    let o = "";
    // Boden je Ort: Garten, Holzboden im Turm, Stein in Gruft und Schacht, Pilzkammer, Asche mit Glut
    const n = k.name || "", boden = !n || /Garten/i.test(n) ? "garten" : /Turm/i.test(n) ? "holz" : /Pilz/i.test(n) ? "pilz" : /Asche/i.test(n) ? "asche" : "stein";
    const farbe = (v) => ({ garten: `hsl(${95 + v * 60} 22% ${20 + v * 18}%)`, holz: `hsl(${26 + v * 30} 32% ${17 + v * 12}%)`, pilz: `hsl(${165 + v * 40} 20% ${12 + v * 12}%)`, asche: `hsl(${12 + v * 20} 7% ${12 + v * 12}%)`, stein: `hsl(${215 + v * 20} 7% ${16 + v * 14}%)` }[boden]);
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) {
      const v = ((x * 7 + y * 13) % 5) / 40;
      o += `<rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="${farbe(v)}"/>`;
      if (boden === "holz") o += `<path d="M${x * Z} ${y * Z + Z / 2}h${Z}" stroke="#000" stroke-opacity=".18"/>`;
      if (boden === "asche" && (x * 5 + y * 3) % 7 === 0) o += `<circle cx="${x * Z + 14 + (y % 3) * 9}" cy="${y * Z + 18 + (x % 3) * 8}" r="4" fill="#ff7a2a" opacity=".45"/>`;
      if (boden === "pilz" && (x * 3 + y * 5) % 9 === 0) o += `<circle cx="${x * Z + 20}" cy="${y * Z + 34}" r="3" fill="#7fe0c0" opacity=".35"/>`;
    }
    if (/Siegel/i.test(n)) o += `<circle cx="${k.b * Z / 2}" cy="${k.h * Z / 2}" r="${Z * 3.2}" fill="none" stroke="#c8ccd8" stroke-opacity=".35" stroke-width="5"/><circle cx="${k.b * Z / 2}" cy="${k.h * Z / 2}" r="${Z * 2.9}" fill="none" stroke="#c8ccd8" stroke-opacity=".15" stroke-width="2"/>`;
    o += `<path d="${Array.from({ length: k.b + 1 }, (_, i) => `M${i * Z} 0V${k.h * Z}`).join("")}${Array.from({ length: k.h + 1 }, (_, i) => `M0 ${i * Z}H${k.b * Z}`).join("")}" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
    if (boden === "garten") o += `<rect x="0" y="${4 * Z + 18}" width="${k.b * Z}" height="24" fill="#8a7a5c" opacity=".25"/>`;
    // Zonen und Glut
    for (const zo of st.zonen) {
      const x0 = Math.max(0, zo.x - zo.radius), y0 = Math.max(0, zo.y - zo.radius), x1 = Math.min(k.b - 1, zo.x + zo.radius), y1 = Math.min(k.h - 1, zo.y + zo.radius);
      o += zo.art === "rauch"
        ? `<rect x="${x0 * Z}" y="${y0 * Z}" width="${(x1 - x0 + 1) * Z}" height="${(y1 - y0 + 1) * Z}" rx="20" fill="#b8b8c0" fill-opacity=".45"/>`
        : `<rect x="${x0 * Z + 2}" y="${y0 * Z + 2}" width="${(x1 - x0 + 1) * Z - 4}" height="${(y1 - y0 + 1) * Z - 4}" rx="12" fill="#9a6ad0" fill-opacity=".12" stroke="#b58cff" stroke-width="3" stroke-dasharray="8 6"/>`;
    }
    for (const b of st.brand) o += `<rect x="${b.x * Z + 4}" y="${b.y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#ff7a2a" fill-opacity=".35"/>`;
    for (const [kk, c] of reach) { const [x, y] = kk.split(",").map(Number); if (x === akt.x && y === akt.y) continue; o += `<rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="${c === "schritt" ? "#b58cff" : "#7fb7ff"}" fill-opacity=".14" stroke="${c === "schritt" ? "#c9a8ff" : "#9cc8ff"}" stroke-opacity=".4"/>`; }
    if (tipp && tipp.feld && spielerDran) o += `<rect class="tipp-ring" x="${tipp.feld.x * Z + 4}" y="${tipp.feld.y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#f2d35a" fill-opacity=".18" stroke="#f2d35a" stroke-width="3"/>`;
    for (const [t, x, y] of k.hindernisse) o += hindernis(t, x, y);
    for (const f of st.figuren) {
      if (f.x < 0 || (f.z && f.z.verbannt)) continue;
      const cx = f.x * Z + Z / 2, cy = f.y * Z + Z / 2, unten = f.tp <= 0;
      const titel = `<title>${esc(f.name)}${f.titel ? " – " + esc(f.titel) : ""} · ${f.tp}/${f.tpMax} TP · RK ${f.rk}${R.zustaende(st, f).length ? " · " + esc(R.zustaende(st, f).join(", ")) : ""}</title>`;
      if (f.seite === "gegner" && unten) { o += `<g transform="translate(${cx} ${cy}) rotate(180)" opacity=".35">${B.gegner(f.art)}</g>`; continue; }
      if (f === akt && !st.ende) o += `<circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 4"/>`;
      if (zs.includes(f)) {
        o += `<circle cx="${cx}" cy="${cy}" r="28" fill="${f.seite === "gegner" ? "#ff5a3a" : "#6fd06a"}" fill-opacity=".25" stroke="${f.seite === "gegner" ? "#ff7a5a" : "#7fe07a"}" stroke-width="3"/>`;
        const c = R.chance(st, wahl, f.id);
        if (c.p != null && f !== akt) o += `<g transform="translate(${cx} ${cy - 34 < 12 ? cy + 42 : cy - 34})"><rect x="-26" y="-11" width="52" height="18" rx="9" fill="#1b1612" stroke="${c.p >= 0.6 ? "#7fe07a" : c.p >= 0.35 ? "#d6a23a" : "#ff7a5a"}" stroke-width="1.5"/><text y="3" text-anchor="middle" font-size="12" font-weight="700" fill="#ece4d4">${Math.round(c.p * 100)} %</text></g>`;
      }
      if (tipp && tipp.ziel === f.id && !wahl) o += `<circle class="tipp-ring" cx="${cx}" cy="${cy}" r="31" fill="none" stroke="#f2d35a" stroke-width="3"/>`;
      if (f.seite === "gegner") {
        o += `<g transform="translate(${cx} ${cy})">${titel}${B.gegner(f.art)}</g>`;
        o += `<g transform="translate(${cx + 17} ${cy - 17})"><circle r="10" fill="#1b1612" stroke="#d79a7d" stroke-width="1.5"/><text y="4.5" text-anchor="middle" font-size="13" font-weight="700" fill="#f0d0c0">${esc((f.name.match(/\d+$/) || [""])[0])}</text></g>`;
      } else {
        const href = f.art === "wolf" ? "img/figuren/wolf.jpg" : F.bild(f.fid);
        o += `<g transform="translate(${cx} ${cy})" opacity="${f.tot ? 0.5 : 1}">${titel}${B.portraet(href, f.art === "wolf" ? 17 : 21, farbeVon(f), "c" + f.id, unten)}${f.z && f.z.versteckt ? '<circle r="25" fill="none" stroke="#b58cff" stroke-width="2" stroke-dasharray="3 3"/>' : ""}</g>`;
        if (f.tot) o += `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="22" fill="#fff">✝</text>`;
        else if (unten) o += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">${st.schwierigkeit === "hardcore" && f.art !== "wolf" ? (f.stabil ? "stabil" : `${f.todes.e}✓ ${f.todes.f}✗`) : "am Boden"}</text>`;
      }
      const n = R.zustaende(st, f).length;
      if (n && f.tp > 0) o += `<g transform="translate(${cx - 18} ${cy - 18})"><circle r="8" fill="#b58cff" stroke="#1b1612" stroke-width="1.5"/><text y="4" text-anchor="middle" font-size="10" font-weight="700" fill="#1b1612">${n}</text></g>`;
      if (!f.tot) {
        const w = 44, anteil = Math.max(0, f.tp / f.tpMax);
        o += `<rect x="${cx - w / 2}" y="${cy + 23}" width="${w}" height="6" fill="#1b1612" rx="2"/><rect x="${cx - w / 2}" y="${cy + 23}" width="${w * anteil}" height="6" rx="2" fill="${anteil > .5 ? "#6fa86a" : anteil > .25 ? "#d6a23a" : "#c0503a"}"/>`;
      }
    }
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) o += `<rect class="feld" data-x="${x}" data-y="${y}" x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="transparent"/>`;
    svg.innerHTML = o;

    $("#reihe").innerHTML = `<span>Runde ${st.runde}${st.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</span>` + st.reihe.map((id, i) => { const f = R.fig(st, id), b = besitzerVon(f); return `<span class="${i === st.am && !st.ende ? "dran" : ""} ${f.tp <= 0 ? "down" : ""} ${f.seite === "gegner" ? "g" : ""}">${esc(f.name)}${b ? ` <small>📱 ${esc(spielerName(b))}</small>` : ""}</span>`; }).join("");

    if (st.ende) { $("#aktiv").innerHTML = ""; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else if (!spielerDran) { $("#aktiv").innerHTML = `<b>${esc(akt.name)}</b><span class="werte">ist am Zug …</span>`; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else {
      const b = besitzerVon(akt), zust = R.zustaende(st, akt);
      const pl = akt.plaetzeMax && (akt.plaetzeMax[0] + akt.plaetzeMax[1]) ? ` · Plätze ${"●".repeat(akt.plaetze[0])}${akt.plaetzeMax[1] ? " | " + "◆".repeat(akt.plaetze[1]) : ""}` : "";
      $("#aktiv").innerHTML = `<div class="kopf-klein">${B.marke(akt.fid, 40)}<div><b>${esc(akt.name)}</b><span class="werte">${esc(akt.titel)} · Stufe ${akt.stufe}</span></div></div><span class="werte">TP ${akt.tp}/${akt.tpMax} · RK ${R.rkEff(st, akt)} · Bewegung ${st.zug.bewegung}${st.zug.schritt ? " + Schattenschritt " + st.zug.schritt : ""}${pl}</span>${zust.length ? `<span class="werte zust">${esc(zust.join(" · "))}</span>` : ""}${b ? `<span class="handy-dran">📱 ${esc(spielerName(b))} ist dran: hier auf der Karte bewegen, Aktionen auf dem Handy.</span>` : ""}`;
      const knopf = (a) => {
        const g = R.grund(st, a.id), r = R.rest(akt, a), typ = a.typ === "bonus" ? "Bonusaktion" : a.typ === "frei" ? "frei" : "Aktion";
        const kosten = a.platz ? ` · ${a.platz === 2 ? "Platz Grad 2" : "1 Platz"}` : "", rr = r !== Infinity ? ` · noch ${Math.max(0, r)}` : "";
        const wirk = a.schaden ? ` · ${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""}` : a.heilung ? ` · heilt ${a.heilung}` : "";
        return `<button class="akt ${wahl === a.id ? "gewaehlt" : ""} ${tipp && tipp.aktion === a.id ? "getippt" : ""}" data-a="${a.id}" ${g ? "disabled" : ""}><span class="akt-kopf"><b>${esc(a.name)}${a.art === "trank" ? ` (${R.trankZahl(akt)})` : ""}</b><small>${typ}${kosten}${rr}${wirk}</small></span><span class="akt-text">${esc(g && g !== "Kein gültiges Ziel." ? g : a.text || "")}${g === "Kein gültiges Ziel." ? ` <em>${["trank", "selbstheilung"].includes(a.art) ? "Nicht nötig – du bist unverletzt." : SELBST.has(a.art) ? "Gerade nicht möglich." : "Gerade kein Ziel in Reichweite."}</em>` : ""}</span></button>`;
      };
      const alle = R.aktionenVon(akt, st);
      const gruppe = (typen, titel) => { const l = alle.filter((a) => typen.includes(a.typ || "aktion")); return l.length ? `<p class="akt-gruppe">${titel}</p>${l.map(knopf).join("")}` : ""; };
      const knoepfe = gruppe(["aktion"], st.zug.aktion ? "Aktion – eine pro Zug" : "Aktion – schon verbraucht") + gruppe(["bonus", "frei"], st.zug.bonus ? "Bonusaktion – zusätzlich eine pro Zug" : "Bonusaktion – schon verbraucht");
      const schritt = (an, fertig, t) => `<span class="${fertig ? "fertig" : an ? "an" : ""}">${t}</span>`;
      const schritte = `<div class="schritte">${schritt(true, !(st.zug.bewegung || st.zug.schritt), `① Bewegen · ${st.zug.bewegung} Felder`)}${schritt(st.zug.aktion, !st.zug.aktion, "② Aktion")}${schritt(st.zug.bonus, !st.zug.bonus, "③ Bonusaktion")}${schritt(true, false, "④ Zug beenden")}</div>`;
      $("#aktionen").innerHTML = schritte + (b ? `<details class="uebernehmen"><summary>Aktionen hier am Tisch auslösen</summary>${knoepfe}</details>` : knoepfe) + `<div class="knoepfe"><button class="btn ghost klein" id="tipp">💡 Tipp</button><button class="btn ghost" id="ende-zug">Zug beenden</button></div>`;
      const gewaehlt = wahl && R.findeAktion(akt, wahl);
      $("#hinweis").innerHTML = tipp && !wahl ? `<b>${esc(tipp.text)}</b>` : gewaehlt ? `<b>${esc(gewaehlt.a.name)}:</b> ${esc(gewaehlt.a.text || "")} <br>Tippe ein leuchtendes Ziel an. Die Zahl darüber ist die Chance, dass es gelingt. Noch einmal auf die Aktion tippen bricht ab.` : st.zug.bewegung || st.zug.schritt ? "Tippe ein blaues Feld an, um dich zu bewegen, oder wähle eine Aktion. Unsicher? Tippe auf 💡 Tipp." : "Wähle eine Aktion oder beende den Zug.";
    }
    $("#log").innerHTML = st.log.slice().reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("");
    zeigeWurf();
    schwebeZahlen();
    zeichneLiveBar();
    if (st.ende) zeigeEnde(); else $("#ende").hidden = true;
  }

  /** Schaden und Heilung als aufsteigende Zahlen über den Figuren */
  function schwebeZahlen() {
    const wrap = $(".karte-wrap"); if (!wrap || !st) return;
    for (const f of st.figuren) {
      const vor = letzteTP[f.id]; letzteTP[f.id] = f.tp;
      if (vor == null || vor === f.tp || TEMPO === 0) continue;
      const d = document.createElement("span"), diff = f.tp - vor;
      d.className = "schwebe " + (diff < 0 ? "minus" : "plus"); d.textContent = (diff < 0 ? "−" : "+") + Math.abs(diff);
      d.style.left = ((f.x + 0.5) / st.karte.b * 100) + "%"; d.style.top = ((f.y + 0.2) / st.karte.h * 100) + "%";
      wrap.appendChild(d); setTimeout(() => d.remove(), 1500);
    }
  }
  /** Neue Würfe der Spielerfiguren groß einblenden */
  let wurfTimer = null;
  function zeigeWurf() {
    const neu = st.log.slice(letzterLog); letzterLog = st.log.length;
    const w = neu.filter((l) => l.art === "wurf" || (l.art === "gut" && / heilt /.test(l.t))).pop();
    const g = neu.filter((l) => l.art === "gegner" && l.wurf).pop();
    const zeig = w || g;
    if (!zeig || TEMPO === 0) return;
    const el = $("#wurf"), gegnerWurf = zeig === g && !w;
    const gut = /verfehlt|widersteht|weicht/.test(zeig.t) ? gegnerWurf : /Treffer|Schaden|heilt/.test(zeig.t) ? !gegnerWurf : null;
    if (zeig.wurf && window.ABW) window.ABW.rollen(el, zeig.wurf, zeig.t.replace(/^[^:]+: /, ""), { titel: zeig.t.split(":")[0], gut });
    else el.innerHTML = `<div class="w20-erg da"><span>${esc(zeig.t)}</span></div>`;
    el.classList.toggle("gegner", gegnerWurf);
    el.classList.add("an"); clearTimeout(wurfTimer); wurfTimer = setTimeout(() => el.classList.remove("an"), 2800);
  }

  function zeigeEnde() {
    const e = $("#ende"); e.hidden = false;
    const tote = R.spielerFiguren(st).filter((f) => f.tot);
    const text = st.ende === "sieg"
      ? `<h2>Sieg</h2><p>Die Gegner sind besiegt, nach ${st.runde} Runden.${tote.length ? ` Gefallen: ${tote.map((f) => esc(f.name)).join(", ")}.` : ""}</p>`
      : st.ende === "niederlage"
        ? `<h2>Grauwacht behält euch</h2><p>Niemand ist mehr auf den Beinen. ${tote.length ? `Gefallen: ${tote.map((f) => esc(f.name)).join(", ")}.` : ""}</p>`
        : `<h2>Rückzug</h2><p>Die Gruppe liegt am Boden und zieht sich zum Lagerfeuer zurück. Im echten Abenteuer verliert ihr nichts, ihr versucht es einfach noch einmal.</p>`;
    if (kampfEnde) {
      const t2 = st.ende === "rueckzug" ? `<h2>Rückzug</h2><p>Die Gruppe schleppt sich zum letzten Lagerfeuer zurück. Die Glocke schlägt. Ihr versucht es noch einmal.</p>` : text;
      e.innerHTML = t2 + `<div class="knoepfe mitte"><button class="btn" id="weiter-abenteuer">Weiter</button></div>`;
      $("#weiter-abenteuer").onclick = () => { const cb = kampfEnde; kampfEnde = null; const s2 = st; st = null; window.AB.st = null; cb(s2); };
      return;
    }
    e.innerHTML = text + `<div class="knoepfe mitte"><button class="btn" id="neu">Noch einmal</button><button class="btn ghost" id="gruppe">Gruppe ändern</button></div>`;
    $("#neu").onclick = () => start(Math.floor(Math.random() * 1e9));
    $("#gruppe").onclick = () => { st = null; if (liveAn()) gruppeAusHandys(); zeigeSetup(); };
  }

  function toast(text) {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("an"); clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("an"), 4500);
  }

  function gegnerSchleife() {
    clearTimeout(gegnerTimer);
    if (!st) return;
    if (st.ende) { veroeffentlichen(); return; }
    const a = R.aktiv(st);
    if (a.seite === "gegner") gegnerTimer = setTimeout(() => { R.gegnerZug(st); render(); veroeffentlichen(); gegnerSchleife(); }, TEMPO);
  }

  function klickFeld(x, y) {
    if (!st) return;
    const akt = R.aktiv(st);
    if (st.ende || akt.seite !== "spieler") return;
    if (wahl) {
      const z = R.ziele(st, wahl).find((f) => f.x === x && f.y === y);
      if (!z) { $("#hinweis").textContent = "Dort ist kein gültiges Ziel."; return; }
      R.handeln(st, wahl, z.id); wahl = null; tipp = null; render(); veroeffentlichen(); return;
    }
    const r = R.bewegen(st, x, y);
    if (r.fehler) $("#hinweis").textContent = r.fehler; else { tipp = null; render(); veroeffentlichen(); }
  }

  function zeigeSektion(id) { for (const x of ["intro", "einleitung", "kodex", "lobby", "spiel", "ende", "szene"]) { const el = $("#" + x); if (el) el.hidden = x !== id; } }
  function zeigeIntro() { zeigeSektion("intro"); }
  function zeigeSpiel() { zeigeSektion("spiel"); }
  /** Kampf aus dem Abenteuer heraus: opts für neuesSpiel, cb(st) nach dem Ende */
  function kampfStarten(opts, cb) {
    clearTimeout(gegnerTimer);
    st = R.neuesSpiel(Math.floor(Math.random() * 1e9), opts);
    kampfEnde = cb; wahl = null; tipp = null; letzteTP = {}; letzterLog = st.log.length; window.AB.st = st;
    if (liveAn()) { LIVE.phase = "kampf"; LIVE.antwort = null; }
    zeigeSpiel(); render(); veroeffentlichen(); gegnerSchleife();
  }

  function start(seed) {
    clearTimeout(gegnerTimer);
    if (SETUP.gruppe.length < 3) { zeigeSetup(); return; }
    st = R.neuesSpiel(seed, { figuren: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, begegnung: BEGEGNUNGEN[SETUP.begegnung] ? SETUP.begegnung : "garten" });
    wahl = null; tipp = null; letzteTP = {}; letzterLog = st.log.length;
    window.AB.st = st;
    if (liveAn()) { LIVE.phase = "kampf"; LIVE.antwort = null; }
    zeigeSpiel(); render(); veroeffentlichen(); gegnerSchleife();
  }

  $("#karte").addEventListener("click", (ev) => { const t = ev.target.closest(".feld"); if (t) klickFeld(+t.dataset.x, +t.dataset.y); });
  $("#aktionen").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b || b.disabled || b.tagName !== "BUTTON") return;
    if (b.id === "ende-zug") { wahl = null; tipp = null; R.zugEnde(st); render(); veroeffentlichen(); gegnerSchleife(); return; }
    if (b.id === "tipp") { tipp = R.vorschlag(st) || { text: "Gerade kein Vorschlag." }; wahl = null; render(); return; }
    tipp = null;
    const id = b.dataset.a; if (!id) return;
    const akt = R.aktiv(st), h = R.findeAktion(akt, id);
    if (h && SELBST.has(h.a.art)) { R.handeln(st, id, akt.id); wahl = null; render(); veroeffentlichen(); return; }
    wahl = wahl === id ? null : id; render();
  });
  $("#start").onclick = () => { if (!SETUP.gruppe.length) SETUP.gruppe = []; zeigeSetup(); };
  $("#live").onclick = liveStarten;

  // Nach dem Neuladen: laufende Live-Sitzung und Kampf wiederherstellen
  (async () => {
    let gespeichert = null;
    try { gespeichert = JSON.parse(localStorage.getItem(SPEICHER) || "null"); } catch (e) { /* defekt */ }
    if (!gespeichert || !window.MRMultiplayer) { setTimeout(allein, 0); return; }
    try {
      const c = liveClient(), s = await c.restore();
      if (!s || s.closed || !s.is_host) { vergessen(); setTimeout(allein, 0); return; }
      LIVE.phase = gespeichert.phase; LIVE.besitz = gespeichert.besitz || {}; LIVE.erledigt = gespeichert.erledigt || {};
      if (gespeichert.setup) SETUP = gespeichert.setup;
      wach();
      if (gespeichert.abenteuer && window.ABT) window.ABT.laden(gespeichert.abenteuer);
      if (LIVE.phase === "kampf" && gespeichert.st) {
        st = R.laden(gespeichert.st); window.AB.st = st; letzterLog = st.log.length;
        if (gespeichert.imAbenteuer && window.ABT) kampfEnde = window.ABT.kampfFertig;
        zeigeSpiel(); render(); gegnerSchleife();
      }
      else if (LIVE.phase === "szene" && window.ABT && window.ABT.laeuft()) window.ABT.zeige();
      else zeigeSetup();
      await c.fetchStates().catch(() => {});
      veroeffentlichen();
    } catch (e) { vergessen(); setTimeout(allein, 0); }
  })();
  /** Allein am Tisch: Abenteuer (und ggf. den laufenden Kampf) nach dem Neuladen direkt fortsetzen */
  function allein() {
    if (!window.ABT || !window.ABT.gespeichert()) return;
    let solo = null; try { solo = JSON.parse(localStorage.getItem(SOLO) || "null"); } catch (e) { /* defekt */ }
    window.ABT.fortsetzen();
    if (!window.ABT.laeuft()) return;
    if (solo && solo.st) {
      try {
        st = R.laden(solo.st); window.AB.st = st; letzterLog = st.log.length; kampfEnde = window.ABT.kampfFertig;
        zeigeSpiel(); render(); gegnerSchleife();
      } catch (e) { st = null; window.AB.st = null; kampfEnde = null; window.ABT.zeige(); }
    }
  }

  // Für automatische Tests
  window.AB = { st: null, R, LIVE, SETUP: () => SETUP, render, klickFeld, start, zeigeSetup, zeigeSektion, kampfStarten, veroeffentlichen, toast,
    liveAn, besitzVon: (fid) => (liveAn() ? LIVE.besitz[fid] : null), spielerName,
    besitzTauschen(alt, neu) { const i = SETUP.gruppe.indexOf(alt); if (i >= 0) SETUP.gruppe[i] = neu; if (LIVE.besitz[alt]) { LIVE.besitz[neu] = LIVE.besitz[alt]; delete LIVE.besitz[alt]; } setupMerken(); },
    auto() { if (st && !st.ende && R.aktiv(st).seite === "spieler") { R.autoZug(st); wahl = null; render(); veroeffentlichen(); gegnerSchleife(); } } };
})();
