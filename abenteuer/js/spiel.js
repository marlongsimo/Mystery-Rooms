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
  const BEGEGNUNGEN = {
    garten: { name: "Rostkäfer im Klostergarten", gegner: (n) => [{ art: "rostkaefer", anzahl: n }] },
    kobolde: { name: "Schattenkobolde", gegner: (n) => [{ art: "schattenkobold", anzahl: Math.round(n * 1.5) }] },
    gruft: { name: "Knochenwächter", gegner: (n) => [{ art: "knochenwaechter", anzahl: n }] },
    pilze: { name: "Pilzbrut und Kobolde", gegner: (n) => [{ art: "pilzbrut", anzahl: Math.ceil(n / 2) }, { art: "schattenkobold", anzahl: n }] },
    netz: { name: "Netzweber und Knochenwächter", gegner: (n) => [{ art: "netzweber", anzahl: n >= 5 ? 2 : 1 }, { art: "knochenwaechter", anzahl: Math.ceil(n / 2) }] },
    asche: { name: "Aschehunde", gegner: (n) => [{ art: "aschehund", anzahl: Math.ceil(n / 2) + 1 }] },
    ritter: { name: "Grabritter mit Knochenwächtern", gegner: (n) => [{ art: "grabritter", anzahl: 1 }, { art: "knochenwaechter", anzahl: n - 1 }] },
  };
  let st = null, wahl = null, gegnerTimer = null, letzterLog = 0;
  let SETUP = { gruppe: ["schildwaechter", "elementarist", "lichtbringer"], stufe: 1, schwierigkeit: "normal", begegnung: "garten" };
  try { const s = JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); if (s && Array.isArray(s.gruppe)) SETUP = Object.assign(SETUP, s, { gruppe: s.gruppe.filter((f) => F.FIGUREN[f]).slice(0, 6) }); } catch (e) { /* privat */ }
  const setupMerken = () => { try { localStorage.setItem(SETUP_KEY, JSON.stringify(SETUP)); } catch (e) { /* privat */ } };

  /* ---------- Live-Zustand ---------- */
  const LIVE = { client: null, phase: null, besitz: {}, erledigt: {}, antwort: null, schreibt: false, nochmal: false, sperre: null };
  const liveAn = () => Boolean(LIVE.client && LIVE.client.session);
  const spielerName = (uid) => (LIVE.client && LIVE.client.playerName(uid)) || "Handy";
  const besitzerVon = (f) => (liveAn() && f && f.fid ? LIVE.besitz[f.fid] : null);

  function speichern() {
    if (!liveAn()) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify({ phase: LIVE.phase, besitz: LIVE.besitz, erledigt: LIVE.erledigt, setup: SETUP, st: st ? R.speichern(st) : null })); } catch (e) { /* privat */ }
  }
  function vergessen() { try { localStorage.removeItem(SPEICHER); } catch (e) { /* privat */ } }

  /** Öffentlichen Stand an alle Handys (immer nur der neueste, nie zwei Schreibvorgänge gleichzeitig) */
  function veroeffentlichen() {
    if (!liveAn() || !LIVE.client.session.is_host) return;
    speichern();
    if (LIVE.schreibt) { LIVE.nochmal = true; return; }
    LIVE.schreibt = true; LIVE.nochmal = false;
    const namen = {}; LIVE.client.players.forEach((p) => { namen[p.user_id] = p.player_name; });
    const daten = Object.assign({ phase: LIVE.phase, besitz: LIVE.besitz, namen, gruppe: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, antwort: LIVE.antwort, at: Date.now() }, st && LIVE.phase === "kampf" ? R.ansicht(st) : {});
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
      const inGruppe = fid && SETUP.gruppe.includes(fid);
      if (fid && !inGruppe && (LIVE.phase === "kampf" || SETUP.gruppe.length >= 6)) { veroeffentlichen(); return; }
      for (const f of Object.keys(LIVE.besitz)) if (LIVE.besitz[f] === uid) delete LIVE.besitz[f];
      if (fid) { LIVE.besitz[fid] = uid; if (!inGruppe) { SETUP.gruppe.push(fid); setupMerken(); } }
      zeichneSetup(); if (st) render(); veroeffentlichen();
      return;
    }
    if (!v.n || v.n <= (LIVE.erledigt[uid] || 0)) return;
    LIVE.erledigt[uid] = v.n;
    const antwort = (fehler) => { LIVE.antwort = { uid, n: v.n, ok: !fehler, fehler: fehler || null }; };
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

  function liveClient() {
    if (LIVE.client) return LIVE.client;
    if (!window.MRMultiplayer) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar. Ihr könnt allein auf diesem Gerät spielen.");
    const c = LIVE.client = window.MRMultiplayer.connect({ gameSlug: SLUG, maxPlayers: 7, storeKey: "ab_live:" + SLUG });
    c.on("state", eintrag);
    c.on("players", () => {
      const da = new Set(c.players.map((p) => p.user_id)); let geaendert = false;
      for (const f of Object.keys(LIVE.besitz)) if (!da.has(LIVE.besitz[f])) { delete LIVE.besitz[f]; geaendert = true; }
      zeichneSetup(); if (st) render();
      veroeffentlichen();
      if (geaendert) toast("Ein Handy hat die Sitzung verlassen. Seine Figur steuert jetzt der Tisch.");
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
      LIVE.phase = "lobby"; LIVE.besitz = {}; LIVE.erledigt = {}; LIVE.antwort = null; st = null;
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
    $("#intro").hidden = true; $("#spiel").hidden = true; $("#ende").hidden = true; $("#lobby").hidden = false;
    if (liveAn()) LIVE.phase = "lobby";
    zeichneSetup(); veroeffentlichen();
  }
  function figurKarte(fid, { an, besitzer, gesperrt }) {
    const d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse];
    return `<button class="fkarte ${an ? "an" : ""}" data-fid="${fid}" ${gesperrt ? "disabled" : ""} style="--k:${k.farbe}">
      <img src="${F.bild(fid)}" alt="" loading="lazy"><span class="klasse">${esc(k.name)}</span>
      <b>${esc(d.name)}</b><small>${esc(d.titel)}</small>${besitzer ? `<em>📱 ${esc(besitzer)}</em>` : an ? `<em class="tisch">dabei</em>` : ""}</button>`;
  }
  function zeichneSetup() {
    const el = $("#lobby"); if (el.hidden) return;
    const n = SETUP.gruppe.length;
    const karten = F.REIHE.map((fid) => {
      const uid = liveAn() ? LIVE.besitz[fid] : null, an = SETUP.gruppe.includes(fid);
      return figurKarte(fid, { an, besitzer: uid ? spielerName(uid) : null, gesperrt: Boolean(uid) || (!an && n >= 6) });
    }).join("");
    const handys = liveAn() ? LIVE.client.players.filter((p) => !p.is_host) : [];
    el.innerHTML = `<h1>Der Klostergarten</h1>
      ${liveAn() ? beitrittBox() : ""}
      <div class="einstellungen">
        <div><span class="eyebrow">Stufe</span><div class="seg">${[1, 2, 3].map((s) => `<button data-stufe="${s}" class="${SETUP.stufe === s ? "an" : ""}">${s}</button>`).join("")}</div></div>
        <div><span class="eyebrow">Schwierigkeit</span><div class="seg">${[["normal", "Normal"], ["hardcore", "Hardcore"]].map(([v, t]) => `<button data-schwer="${v}" class="${SETUP.schwierigkeit === v ? "an" : ""}">${t}</button>`).join("")}</div></div>
        <div><span class="eyebrow">Gegner</span><select id="begegnung">${Object.entries(BEGEGNUNGEN).map(([id, b]) => `<option value="${id}" ${SETUP.begegnung === id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>
      </div>
      <p class="note">${SETUP.schwierigkeit === "hardcore" ? "<b>Hardcore:</b> Wer am Boden liegt, würfelt Todeswürfe. Tote bleiben tot." : "<b>Normal:</b> Am Boden ist das Schlimmste, was passieren kann."}</p>
      <h2 class="klein">Gruppe · ${n} von 3–6 Figuren</h2>
      <div class="fkarten">${karten}</div>
      <p class="note">${liveAn() ? (handys.length ? `Verbunden: ${handys.map((p) => esc(p.player_name)).join(", ")}. ` : "Noch kein Handy verbunden. ") + "Figuren ohne Handy steuert ihr hier am Tisch." : "Tippe Figuren an, um sie in die Gruppe zu nehmen. Alle Figuren steuert ihr auf diesem Gerät."}</p>
      <div class="knoepfe"><button class="btn" id="los" ${n < 3 ? "disabled" : ""}>Kampf beginnen</button>${liveAn() ? `<button class="btn ghost" id="lobby-ende">Sitzung beenden</button>` : `<button class="btn ghost" id="zurueck">Zurück</button>`}</div>`;
    el.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => {
      const fid = b.dataset.fid, i = SETUP.gruppe.indexOf(fid);
      if (i >= 0) SETUP.gruppe.splice(i, 1); else if (SETUP.gruppe.length < 6) SETUP.gruppe.push(fid);
      setupMerken(); zeichneSetup(); veroeffentlichen();
    }; });
    el.querySelectorAll("[data-stufe]").forEach((b) => { b.onclick = () => { SETUP.stufe = +b.dataset.stufe; setupMerken(); zeichneSetup(); veroeffentlichen(); }; });
    el.querySelectorAll("[data-schwer]").forEach((b) => { b.onclick = () => { SETUP.schwierigkeit = b.dataset.schwer; setupMerken(); zeichneSetup(); veroeffentlichen(); }; });
    $("#begegnung").onchange = (e) => { SETUP.begegnung = e.target.value; setupMerken(); };
    $("#los").onclick = () => start(params.has("seed") ? +params.get("seed") : Math.floor(Math.random() * 1e9));
    if ($("#lobby-ende")) $("#lobby-ende").onclick = liveBeenden;
    if ($("#zurueck")) $("#zurueck").onclick = zeigeIntro;
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
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) {
      const v = ((x * 7 + y * 13) % 5) / 40;
      o += `<rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="hsl(${95 + v * 60} 22% ${20 + v * 18}%)"/>`;
    }
    o += `<path d="${Array.from({ length: k.b + 1 }, (_, i) => `M${i * Z} 0V${k.h * Z}`).join("")}${Array.from({ length: k.h + 1 }, (_, i) => `M0 ${i * Z}H${k.b * Z}`).join("")}" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
    o += `<rect x="0" y="${4 * Z + 18}" width="${k.b * Z}" height="24" fill="#8a7a5c" opacity=".25"/>`;
    // Zonen und Glut
    for (const zo of st.zonen) {
      const x0 = Math.max(0, zo.x - zo.radius), y0 = Math.max(0, zo.y - zo.radius), x1 = Math.min(k.b - 1, zo.x + zo.radius), y1 = Math.min(k.h - 1, zo.y + zo.radius);
      o += zo.art === "rauch"
        ? `<rect x="${x0 * Z}" y="${y0 * Z}" width="${(x1 - x0 + 1) * Z}" height="${(y1 - y0 + 1) * Z}" rx="20" fill="#b8b8c0" fill-opacity=".45"/>`
        : `<rect x="${x0 * Z + 2}" y="${y0 * Z + 2}" width="${(x1 - x0 + 1) * Z - 4}" height="${(y1 - y0 + 1) * Z - 4}" rx="12" fill="#9a6ad0" fill-opacity=".12" stroke="#b58cff" stroke-width="3" stroke-dasharray="8 6"/>`;
    }
    for (const b of st.brand) o += `<rect x="${b.x * Z + 4}" y="${b.y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#ff7a2a" fill-opacity=".35"/>`;
    for (const [kk, c] of reach) { const [x, y] = kk.split(",").map(Number); if (x === akt.x && y === akt.y) continue; o += `<rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="${c === "schritt" ? "#b58cff" : "#7fb7ff"}" fill-opacity=".14" stroke="${c === "schritt" ? "#c9a8ff" : "#9cc8ff"}" stroke-opacity=".4"/>`; }
    for (const [t, x, y] of k.hindernisse) o += hindernis(t, x, y);
    for (const f of st.figuren) {
      if (f.x < 0 || (f.z && f.z.verbannt)) continue;
      const cx = f.x * Z + Z / 2, cy = f.y * Z + Z / 2, unten = f.tp <= 0;
      const titel = `<title>${esc(f.name)}${f.titel ? " – " + esc(f.titel) : ""} · ${f.tp}/${f.tpMax} TP · RK ${f.rk}${R.zustaende(st, f).length ? " · " + esc(R.zustaende(st, f).join(", ")) : ""}</title>`;
      if (f.seite === "gegner" && unten) { o += `<g transform="translate(${cx} ${cy}) rotate(180)" opacity=".35">${B.gegner(f.art)}</g>`; continue; }
      if (f === akt && !st.ende) o += `<circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 4"/>`;
      if (zs.includes(f)) o += `<circle cx="${cx}" cy="${cy}" r="28" fill="${f.seite === "gegner" ? "#ff5a3a" : "#6fd06a"}" fill-opacity=".25" stroke="${f.seite === "gegner" ? "#ff7a5a" : "#7fe07a"}" stroke-width="3"/>`;
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
        return `<button class="btn ${wahl === a.id ? "gewaehlt" : ""}" data-a="${a.id}" ${g ? "disabled" : ""} title="${esc(g || a.text || "")}">${esc(a.name)}${a.art === "trank" ? ` (${R.trankZahl(akt)})` : ""}<small>${typ}${kosten}${rr}${wirk}</small></button>`;
      };
      const alle = R.aktionenVon(akt, st), knoepfe = alle.map(knopf).join("");
      $("#aktionen").innerHTML = (b ? `<details class="uebernehmen"><summary>Aktionen hier am Tisch auslösen</summary><div class="aktionen">${knoepfe}</div></details>` : knoepfe) + `<button class="btn ghost" id="ende-zug">Zug beenden</button>`;
      $("#hinweis").textContent = wahl ? "Leuchtendes Ziel antippen. Noch einmal auf die Aktion tippen bricht ab." : st.zug.bewegung || st.zug.schritt ? "Blaues Feld antippen, um dich zu bewegen, oder eine Aktion wählen." : "Wähle eine Aktion oder beende den Zug.";
    }
    $("#log").innerHTML = st.log.slice().reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("");
    zeigeWurf();
    zeichneLiveBar();
    if (st.ende) zeigeEnde(); else $("#ende").hidden = true;
  }

  /** Neue Würfe der Spielerfiguren groß einblenden */
  let wurfTimer = null;
  function zeigeWurf() {
    const neu = st.log.slice(letzterLog); letzterLog = st.log.length;
    const w = neu.filter((l) => l.art === "wurf" || (l.art === "gut" && / heilt /.test(l.t))).pop();
    if (!w || TEMPO === 0) return;
    const el = $("#wurf");
    el.innerHTML = `${w.wurf ? `<b class="${w.wurf === 20 ? "krit" : w.wurf === 1 ? "patzer" : ""}">${w.wurf}</b>` : ""}<span>${esc(w.t)}</span>`;
    el.classList.add("an"); clearTimeout(wurfTimer); wurfTimer = setTimeout(() => el.classList.remove("an"), 2600);
  }

  function zeigeEnde() {
    const e = $("#ende"); e.hidden = false;
    const tote = R.spielerFiguren(st).filter((f) => f.tot);
    const text = st.ende === "sieg"
      ? `<h2>Sieg</h2><p>Die Gegner sind besiegt, nach ${st.runde} Runden.${tote.length ? ` Gefallen: ${tote.map((f) => esc(f.name)).join(", ")}.` : ""}</p>`
      : st.ende === "niederlage"
        ? `<h2>Grauwacht behält euch</h2><p>Niemand ist mehr auf den Beinen. ${tote.length ? `Gefallen: ${tote.map((f) => esc(f.name)).join(", ")}.` : ""}</p>`
        : `<h2>Rückzug</h2><p>Die Gruppe liegt am Boden und zieht sich zum Lagerfeuer zurück. Im echten Abenteuer verliert ihr nichts, ihr versucht es einfach noch einmal.</p>`;
    e.innerHTML = text + `<div class="knoepfe mitte"><button class="btn" id="neu">Noch einmal</button><button class="btn ghost" id="gruppe">Gruppe ändern</button></div>`;
    $("#neu").onclick = () => start(Math.floor(Math.random() * 1e9));
    $("#gruppe").onclick = () => { st = null; zeigeSetup(); };
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
      R.handeln(st, wahl, z.id); wahl = null; render(); veroeffentlichen(); return;
    }
    const r = R.bewegen(st, x, y);
    if (r.fehler) $("#hinweis").textContent = r.fehler; else { render(); veroeffentlichen(); }
  }

  function zeigeIntro() { $("#intro").hidden = false; $("#lobby").hidden = true; $("#spiel").hidden = true; $("#ende").hidden = true; }
  function zeigeSpiel() { $("#intro").hidden = true; $("#lobby").hidden = true; $("#spiel").hidden = false; }

  function start(seed) {
    clearTimeout(gegnerTimer);
    if (SETUP.gruppe.length < 3) { zeigeSetup(); return; }
    const beg = BEGEGNUNGEN[SETUP.begegnung] || BEGEGNUNGEN.garten;
    st = R.neuesSpiel(seed, { figuren: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, gegner: beg.gegner(SETUP.gruppe.length) });
    wahl = null; letzterLog = st.log.length;
    window.AB.st = st;
    if (liveAn()) { LIVE.phase = "kampf"; LIVE.antwort = null; }
    zeigeSpiel(); render(); veroeffentlichen(); gegnerSchleife();
  }

  $("#karte").addEventListener("click", (ev) => { const t = ev.target.closest(".feld"); if (t) klickFeld(+t.dataset.x, +t.dataset.y); });
  $("#aktionen").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b || b.disabled || b.tagName !== "BUTTON") return;
    if (b.id === "ende-zug") { wahl = null; R.zugEnde(st); render(); veroeffentlichen(); gegnerSchleife(); return; }
    const id = b.dataset.a; if (!id) return;
    const akt = R.aktiv(st), h = R.findeAktion(akt, id);
    if (h && SELBST.has(h.a.art)) { R.handeln(st, id, akt.id); wahl = null; render(); veroeffentlichen(); return; }
    wahl = wahl === id ? null : id; render();
  });
  $("#start").onclick = () => zeigeSetup();
  $("#live").onclick = liveStarten;

  // Nach dem Neuladen: laufende Live-Sitzung und Kampf wiederherstellen
  (async () => {
    let gespeichert = null;
    try { gespeichert = JSON.parse(localStorage.getItem(SPEICHER) || "null"); } catch (e) { /* defekt */ }
    if (!gespeichert || !window.MRMultiplayer) return;
    try {
      const c = liveClient(), s = await c.restore();
      if (!s || s.closed || !s.is_host) { vergessen(); return; }
      LIVE.phase = gespeichert.phase; LIVE.besitz = gespeichert.besitz || {}; LIVE.erledigt = gespeichert.erledigt || {};
      if (gespeichert.setup) SETUP = gespeichert.setup;
      wach();
      if (LIVE.phase === "kampf" && gespeichert.st) { st = R.laden(gespeichert.st); window.AB.st = st; letzterLog = st.log.length; zeigeSpiel(); render(); gegnerSchleife(); }
      else zeigeSetup();
      await c.fetchStates().catch(() => {});
      veroeffentlichen();
    } catch (e) { vergessen(); }
  })();

  // Für automatische Tests
  window.AB = { st: null, R, LIVE, SETUP: () => SETUP, render, klickFeld, start, zeigeSetup,
    auto() { if (st && !st.ende && R.aktiv(st).seite === "spieler") { R.autoZug(st); wahl = null; render(); veroeffentlichen(); gegnerSchleife(); } } };
})();
