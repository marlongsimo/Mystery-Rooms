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
  /** Chronik-Zeile: Treffer / Verfehlt als deutliche Marke vorn, das Ergebniswort im Text hervorgehoben */
  const logZeile = (l) => {
    const m = /(kritischer Treffer|Treffer|verfehlt|widersteht|misslingt)/.exec(l.t || "");
    if (!m || !/W20|Rettungswurf/.test(l.t)) return esc(l.t);
    const gegner = l.art === "gegner", wort = m[1];
    const erfolg = wort === "Treffer" || wort === "kritischer Treffer" || wort === "misslingt"; // der Angriff/Zauber wirkt
    const gut = gegner ? !erfolg : erfolg; // gut für die Helden?
    const marke = wort === "kritischer Treffer" ? "Kritisch" : wort === "Treffer" ? "Treffer" : wort === "verfehlt" ? "Verfehlt" : wort === "widersteht" ? "Widerstanden" : "Wirkt";
    return `<b class="lg-marke ${gut ? "gut" : "schlecht"}">${erfolg ? "✓" : "✗"} ${marke}</b> ` + esc(l.t).replace(wort, `<b>${wort}</b>`);
  };
  const Z = 60; // Feldgröße im SVG
  const params = new URLSearchParams(location.search);
  // Erst wenn alle Skripte geladen sind (sonst fehlt bei langsamem Laden noch die Abenteuer-Oberfläche und das Fortsetzen fällt aus)
  const bereit = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r, { once: true }) : r()));
  // Tempo der Gegnerzüge (Einstellungen): langsam 2,4 s, normal 1,6 s, schnell 0,8 s; im Testmodus sofort
  const TEMPI = { langsam: 2400, normal: 1600, schnell: 800 };
  const tempo = () => { if (params.has("schnell")) return 0; let t = "normal"; try { t = localStorage.getItem("ab_tempo") || "normal"; } catch (e) { /* privat */ } return TEMPI[t] || TEMPI.normal; };
  const TEMPO = params.has("schnell") ? 0 : 1;
  const SLUG = params.get("liveslug") || "abenteuer"; // ?liveslug= nur für Tests
  const SPEICHER = "ab_tisch", SETUP_KEY = "ab_setup";
  const SELBST = new Set(["selbstheilung", "trank", "raserei", "finte", "gift", "verstecken", "rueckzug", "spurt", "schattenschritt", "spiegelbilder", "segen", "schutzkreis", "vertreiben", "bewahren", "massenheil", "rauch", "tatendrang"]);
  const BEGEGNUNGEN = R.BEGEGNUNGEN;
  let gegnerInfo = null; // id des angetippten Gegners (Infokarte)
  let st = null, wahl = null, gegnerTimer = null, letzterLog = 0, kampfEnde = null, tipp = null, letzteTP = {};
  let SETUP = { gruppe: [], stufe: 1, schwierigkeit: "normal", begegnung: "garten", abenteuer: "grauwacht" };
  /** Kenndaten des gewählten Abenteuers (Titel, Mindestgröße der Gruppe, Texte) */
  const META = () => (window.ABS && window.ABS.metaVon ? window.ABS.metaVon(SETUP.abenteuer) : { min: 3, gruppe: "Die Gemeinschaft von Grauwacht", aufbruch: "Aufbruch nach Halmbruck", niederlage: "Grauwacht behält euch", uhr: { rueckzug: "Die Glocke schlägt." } });
  try { const s = JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); if (s && Array.isArray(s.gruppe)) SETUP = Object.assign(SETUP, s, { gruppe: s.gruppe.filter((f) => F.FIGUREN[f]).slice(0, 6) }); if (!F.HARDCORE) SETUP.schwierigkeit = "normal"; } catch (e) { /* privat */ }
  const setupMerken = () => { try { localStorage.setItem(SETUP_KEY, JSON.stringify(SETUP)); } catch (e) { /* privat */ } };

  /* ---------- Live-Zustand ---------- */
  const LIVE = { client: null, phase: null, besitz: {}, frueher: {}, erledigt: {}, antwort: null, schreibt: false, nochmal: false, sperre: null };
  const liveAn = () => Boolean(LIVE.client && LIVE.client.session);
  const spielerName = (uid) => (LIVE.client && LIVE.client.playerName(uid)) || "Handy";
  const besitzerVon = (f) => (liveAn() && f && f.fid ? LIVE.besitz[f.fid] : null);

  function speichern() {
    if (!liveAn()) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify({ phase: LIVE.phase, besitz: LIVE.besitz, frueher: LIVE.frueher, erledigt: LIVE.erledigt, setup: SETUP, st: st ? R.speichern(st) : null, abenteuer: window.ABT ? window.ABT.speichern() : null, imAbenteuer: Boolean(kampfEnde) })); } catch (e) { /* privat */ }
  }
  function vergessen() { try { localStorage.removeItem(SPEICHER); } catch (e) { /* privat */ } }
  /** Allein am Tisch: laufenden Kampf im Abenteuer merken, damit Neuladen nichts kostet */
  const SOLO = "ab_solo";
  function soloMerken() { try { localStorage.setItem(SOLO, JSON.stringify({ st: st && kampfEnde ? R.speichern(st) : null })); } catch (e) { /* privat */ } }

  /** Öffentlichen Stand an alle Handys (immer nur der neueste, nie zwei Schreibvorgänge gleichzeitig) */
  function veroeffentlichen() {
    if (window.KAMPAGNE) window.KAMPAGNE.geaendert();
    if (!liveAn()) { soloMerken(); return; }
    if (!LIVE.client.session.is_host) return;
    if (LIVE.phase === "szene" || LIVE.phase === "kampf") Object.assign(LIVE.frueher, LIVE.besitz); // für den Wiedereinstieg merken
    speichern();
    if (LIVE.schreibt) { LIVE.nochmal = true; return; }
    LIVE.schreibt = true; LIVE.nochmal = false;
    const namen = {}; LIVE.client.players.forEach((p) => { namen[p.user_id] = p.player_name; });
    const kamp = window.KAMPAGNE && window.KAMPAGNE.aktuell && window.KAMPAGNE.aktuell();
    const daten = Object.assign(window.ABT ? window.ABT.oeffentlich() : {}, { kampagne: (kamp && kamp.id) || null, phase: LIVE.phase, besitz: LIVE.besitz, namen, gruppe: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, antwort: LIVE.antwort, antworten: LIVE.antworten || {}, at: Date.now() }, st && LIVE.phase === "kampf" ? R.ansicht(st) : {});
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
      const laeuft = LIVE.phase === "kampf" || LIVE.phase === "szene";
      // Läuft das Abenteuer (Szene oder Kampf), nur Figuren der Gruppe übernehmen; in der Lobby höchstens 6 Handys
      if (fid && laeuft && !SETUP.gruppe.includes(fid)) { veroeffentlichen(); return; }
      if (fid && !laeuft && !SETUP.gruppe.includes(fid) && SETUP.gruppe.filter((f) => LIVE.besitz[f] !== uid).length >= 6) { veroeffentlichen(); return; }
      if (laeuft && !fid) { veroeffentlichen(); return; } // im laufenden Abenteuer behält man seine Figur
      for (const f of Object.keys(LIVE.besitz)) if (LIVE.besitz[f] === uid) delete LIVE.besitz[f];
      if (fid) { LIVE.besitz[fid] = uid; if (laeuft) LIVE.frueher[fid] = uid; }
      if (!laeuft) gruppeAusHandys();
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

  /** Wiedereinstieg: Wer im laufenden Abenteuer zurückkommt (Verbindung weg, neu geladen, Pause, neuer Tisch),
   *  bekommt automatisch seinen Helden zurück – sofern ihn inzwischen niemand anderes übernommen hat. */
  function zurueckgeben() {
    if (!liveAn() || !(LIVE.phase === "szene" || LIVE.phase === "kampf")) return false;
    const da = new Set(LIVE.client.players.filter((p) => !p.is_host).map((p) => p.user_id)), hat = new Set(Object.values(LIVE.besitz)); let n = 0;
    for (const fid of SETUP.gruppe) {
      const uid = LIVE.frueher[fid];
      if (!uid || LIVE.besitz[fid] || !da.has(uid) || hat.has(uid)) continue;
      LIVE.besitz[fid] = uid; hat.add(uid); n++;
      toast(`${spielerName(uid)} ist zurück und spielt wieder ${F.FIGUREN[fid] ? F.FIGUREN[fid].name : fid}.`);
    }
    return n > 0;
  }
  /** Frühere Zuordnung (Held → Spieler) übernehmen, z. B. aus dem Kampagnenstand oder den Kampagnen-Mitgliedern */
  function frueherSetzen(m) { LIVE.frueher = Object.assign({}, m || {}); if (zurueckgeben()) { zeichneSetup(); if (st) render(); veroeffentlichen(); } }
  /** Mit Handys spielen nur die Figuren, die jemand auf dem Handy gewählt hat */
  function gruppeAusHandys() {
    // Handy-Helden und vom Tisch gesteuerte Helden (SETUP.tisch); übernimmt ein Handy einen Tisch-Helden, gehört er dem Handy
    SETUP.tisch = (SETUP.tisch || []).filter((f) => F.FIGUREN[f] && !LIVE.besitz[f]);
    const soll = Object.keys(LIVE.besitz).concat(SETUP.tisch), alt = SETUP.gruppe.filter((f) => soll.includes(f));
    SETUP.gruppe = alt.concat(soll.filter((f) => !alt.includes(f))).slice(0, 6);
  }
  function liveClient() {
    if (LIVE.client) return LIVE.client;
    if (!window.RPGNetz) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar. Ihr könnt allein auf diesem Gerät spielen.");
    const c = LIVE.client = window.RPGNetz.connect({ gameSlug: SLUG, maxPlayers: 7, storeKey: "ab_live:" + SLUG });
    c.on("state", eintrag);
    c.on("players", () => {
      const da = new Set(c.players.map((p) => p.user_id)); let geaendert = false;
      for (const f of Object.keys(LIVE.besitz)) if (!da.has(LIVE.besitz[f])) { delete LIVE.besitz[f]; geaendert = true; }
      if (LIVE.phase === "lobby") gruppeAusHandys(); // nur bei der Heldenwahl: im laufenden Abenteuer bleibt die Gruppe fest
      else zurueckgeben();
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
      LIVE.phase = "lobby"; LIVE.besitz = {}; LIVE.frueher = {}; LIVE.erledigt = {}; LIVE.antwort = null; st = null; SETUP.gruppe = []; SETUP.tisch = [];
      wach();
      // Mit Kampagnen: zuerst einladen (Freunde, Gäste-Code, Tisch-Gerät), dann Heldenwahl
      if (window.KAMPAGNE && window.KAMPAGNE.einladen) { veroeffentlichen(); await window.KAMPAGNE.einladen(); }
      else { zeigeSetup(); veroeffentlichen(); }
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
    // Heldensammlung (Open Beta): Welche Helden darf der Tisch stellen? Im Coop-Mode mit Kampagne die des Hosts,
    // im Solo-Mode immer die Sammlung des angemeldeten Benutzers (ohne Konto: die Starter-Helden).
    const SM = window.ABSAMMLUNG;
    if (SM) {
      const k = window.KAMPAGNE && window.KAMPAGNE.aktuell && window.KAMPAGNE.aktuell();
      SM.tischLaden(liveAn() ? k && k.id : null).then(() => {
        if ($("#lobby").hidden) return;
        const vorher = JSON.stringify([SETUP.gruppe, SETUP.tisch]);
        SETUP.tisch = (SETUP.tisch || []).filter((f) => SM.tischFrei(f));
        if (liveAn()) gruppeAusHandys(); else SETUP.gruppe = SETUP.gruppe.filter((f) => SM.tischFrei(f));
        if (JSON.stringify([SETUP.gruppe, SETUP.tisch]) !== vorher) { setupMerken(); veroeffentlichen(); }
        zeichneSetup();
      }).catch(() => {});
    }
  }
  /** Darf der Tisch diesen Helden stellen? (Heldensammlung; ohne Sammlung sind alle frei) */
  const tischFrei = (fid) => !window.ABSAMMLUNG || window.ABSAMMLUNG.tischFrei(fid);
  function gesperrtHinweis(live) {
    const SM = window.ABSAMMLUNG, S = SM ? SM.zustand() : {}, schloss = SM ? SM.SCHLOSS : "";
    const text = live ? "Am Spieltisch ist dieser Held noch nicht freigeschaltet. Wer ihn in seiner Sammlung hat, wählt ihn auf dem eigenen Handy."
      : S.konto ? "Noch nicht in deiner Sammlung. Jedes Kampagnen-Ende, das du zum ersten Mal erreichst, schaltet einen neuen Helden frei."
        : "Ohne Spielerkonto stehen fünf Starter-Helden zur Wahl, einer je Klasse. Mit einem Konto baust du dir deine eigene Sammlung auf.";
    return `<div class="sm-gesperrt">${schloss}<span><b>Gesperrt.</b> ${text}</span></div>`;
  }
  let fokus = null, klasseSicht = null; // Heldenwahl: null = Schritt 1 (Klassen), sonst Schritt 2 (Helden dieser Klasse)
  /** Heldenwahl wie in einem Spiel: Gruppenplätze, Galerie mit Klassenfilter, große Vorstellung */
  function zeichneSetup() {
    const el = $("#lobby"); if (el.hidden) return;
    const HL = window.ABH_HELDEN, n = SETUP.gruppe.length, live = liveAn(), MIN = META().min || 3;
    if (klasseSicht && (!fokus || !F.FIGUREN[fokus] || F.FIGUREN[fokus].klasse !== klasseSicht)) fokus = HL.vonKlasse(klasseSicht).find((f) => SETUP.gruppe.includes(f)) || HL.vonKlasse(klasseSicht).find(tischFrei) || HL.vonKlasse(klasseSicht)[0];
    if (!fokus || !F.FIGUREN[fokus]) fokus = SETUP.gruppe[n - 1] || F.REIHE[0];
    const namen = {}; if (live) for (const [fid, uid] of Object.entries(LIVE.besitz)) namen[fid] = spielerName(uid);
    const sicht = klasseSicht ? HL.vonKlasse(klasseSicht) : [];
    const kacheln = sicht.map((fid) => {
      const uid = live ? LIVE.besitz[fid] : null, an = SETUP.gruppe.includes(fid);
      const zu = !uid && !an && !tischFrei(fid);
      return HL.kachel(fid, { an, fokus: fid === fokus, gesperrt: zu, status: uid ? "📱 " + spielerName(uid) : an ? "in der Gruppe" : zu ? (live ? "📱 nur per Handy" : "gesperrt") : "", statusArt: uid ? "" : "tisch" });
    }).join("");
    const an = SETUP.gruppe.includes(fokus), uidF = live ? LIVE.besitz[fokus] : null, zuF = !an && !uidF && !tischFrei(fokus);
    const knopf = zuF ? gesperrtHinweis(live) + (live ? `<p class="held-hinweis">Wählt eure Figuren auf den Handys. Fehlt jemand, steuert der Tisch weitere Helden – ein Handy kann sie jederzeit übernehmen.</p>` : "") : live
      ? (uidF ? `<p class="held-hinweis">📱 <b>${esc(spielerName(uidF))}</b> spielt ${esc(F.FIGUREN[fokus].name)}.</p>`
        : `<button class="btn ${an ? "ghost " : ""}gross held-knopf" id="f-tisch" ${!an && n >= 6 ? "disabled" : ""}>${an ? "Nicht mehr vom Tisch spielen" : n >= 6 ? "Die Gruppe ist voll" : `${esc(F.FIGUREN[fokus].name)} vom Tisch spielen lassen`}</button>
          <p class="held-hinweis">Wählt eure Figuren auf den Handys. Fehlt jemand, steuert der Tisch weitere Helden – ein Handy kann sie jederzeit übernehmen.</p>`)
      : `<button class="btn gross held-knopf" id="f-waehlen" ${!an && n >= 6 ? "disabled" : ""}>${an ? "Aus der Gruppe nehmen" : n >= 6 ? "Die Gruppe ist voll" : `${esc(F.FIGUREN[fokus].name)} in die Gruppe`}</button>`;
    const handys = live ? LIVE.client.players.filter((p) => !p.is_host) : [];
    const status = live
      ? (handys.length ? `Verbunden: ${handys.map((p) => esc(p.player_name)).join(", ")}. ` : "Noch kein Handy verbunden. ") + `Es spielen die Figuren der Handys${(SETUP.tisch || []).length ? ` und ${SETUP.tisch.length} vom Tisch gesteuerte` : ""}${n < MIN ? ` – mindestens ${MIN}, noch ${MIN - n}. Zu wenige Handys? Lasst weitere Helden vom Tisch spielen` : ""}.`
      : n < MIN ? `Wählt mindestens ${MIN} Figuren – noch ${MIN - n}.` : "Solo-Mode: Eine Person steuert alle Figuren auf diesem Gerät.";
    const gegner = (() => { const g = R.gegnerFuer(SETUP.begegnung, Math.max(3, n), SETUP.stufe); return g.map((x) => `${x.anzahl} × ${R.GEGNER[x.art].name}${Math.abs(x.tpFaktor - 1) > 0.04 ? ` (${Math.round(R.GEGNER[x.art].tp * x.tpFaktor)} TP)` : ""}`).join(", "); })();
    el.innerHTML = `
      <div class="wahl-kopf"><div><p class="eyebrow">${esc(META().gruppe || META().titel)}</p><h1>Wählt eure Helden</h1></div>${HL.plaetze(SETUP.gruppe, namen)}</div>
      ${live ? beitrittBox() : ""}
      ${klasseSicht ? `${HL.klassenLeiste(klasseSicht)}
      <div class="wahl-body stufe2">
        <div class="wahl-galerie">${HL.klassenKopf(klasseSicht)}<div class="fkarten drei">${kacheln}</div></div>
        <div class="wahl-detail">${HL.detail(fokus, 1, knopf)}</div>
      </div>` : `<p class="wahl-schritt"><b>Schritt 1 von 2:</b> Wählt eine Klasse. Darin stellen sich euch je drei Helden vor.</p>${HL.klassenWahl({ gruppe: SETUP.gruppe, frei: window.ABSAMMLUNG && window.ABSAMMLUNG.tischBekannt() && !window.ABSAMMLUNG.tischAlleFrei() ? tischFrei : null })}`}
      <div class="wahl-fuss">
        <h2 class="klein">${live ? `Gruppe · ${n} ${n === 1 ? "Person" : "Personen"} (${MIN}–6)` : `Gruppe · ${n} von ${MIN}–6 Figuren`}</h2>
        <p class="note">${status}</p>
        <div class="einstellungen"><div><span class="eyebrow">Schwierigkeit</span><div class="seg">${[["normal", "Normal"], ["hardcore", "Hardcore"]].filter(([v]) => v === "normal" || F.HARDCORE).map(([v, t]) => `<button data-schwer="${v}" class="${SETUP.schwierigkeit === v ? "an" : ""}">${t}</button>`).join("")}</div></div>
          <p class="note">${SETUP.schwierigkeit === "hardcore" ? "<b>Hardcore:</b> Wer fällt, würfelt um sein Leben. Tote bleiben tot." : "<b>Normal:</b> Am Boden ist das Schlimmste, was passieren kann."}</p></div>
        <div class="knoepfe"><button class="btn gross" id="abenteuer-los" ${n < MIN ? "disabled" : ""}>${esc(META().aufbruch || "Aufbrechen")}</button>${live ? `<button class="btn ghost" id="lobby-ende">Sitzung beenden</button>` : `<button class="btn ghost" id="zurueck">Zurück</button>`}</div>
        <details class="uebung"><summary>Übungskampf ohne Geschichte</summary>
          <div class="einstellungen">
            <div><span class="eyebrow">Stufe</span><div class="seg">${[1, 2, 3].map((s) => `<button data-stufe="${s}" class="${SETUP.stufe === s ? "an" : ""}">${s}</button>`).join("")}</div></div>
            <div><span class="eyebrow">Gegner</span><select id="begegnung">${Object.entries(BEGEGNUNGEN).map(([id, b]) => `<option value="${id}" ${SETUP.begegnung === id ? "selected" : ""}>${esc(b.name)} (Stufe ${b.stufe})</option>`).join("")}</select></div>
            <button class="btn ghost" id="los" ${n < MIN ? "disabled" : ""}>Übungskampf beginnen</button>
          </div>
          <p class="note">Gegner bei ${Math.max(3, n)} Figuren: ${gegner}. Die Gegner passen sich an die Gruppengröße an.</p>
        </details>
      </div>`;
    const uebung = el.querySelector(".uebung"); if (uebung && zeichneSetup.uebungOffen) uebung.open = true;
    if (uebung) uebung.ontoggle = () => { zeichneSetup.uebungOffen = uebung.open; };
    el.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => { fokus = b.dataset.fid; zeichneSetup(); if (window.innerWidth < 980) { const d = $(".wahl-detail"); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); } }; });
    el.querySelectorAll("[data-platz]").forEach((b) => { b.onclick = () => { fokus = b.dataset.platz; klasseSicht = F.FIGUREN[fokus].klasse; zeichneSetup(); }; });
    el.querySelectorAll("[data-klasse]").forEach((b) => { b.onclick = () => { klasseSicht = b.dataset.klasse; fokus = null; zeichneSetup(); const k = $(".klassen-leiste"); if (k) k.scrollIntoView({ block: "nearest" }); }; });
    const kz = $("#klassen-zurueck"); if (kz) kz.onclick = () => { klasseSicht = null; zeichneSetup(); };
    const ft = $("#f-tisch"); if (ft) ft.onclick = () => {
      SETUP.tisch = SETUP.tisch || [];
      if (SETUP.tisch.includes(fokus)) SETUP.tisch = SETUP.tisch.filter((f) => f !== fokus); else if (n < 6 && tischFrei(fokus)) { SETUP.tisch.push(fokus); if (window.ABE) window.ABE.glocke(0.25); }
      gruppeAusHandys(); setupMerken(); zeichneSetup(); veroeffentlichen();
    };
    const w = $("#f-waehlen"); if (w) w.onclick = () => {
      const i = SETUP.gruppe.indexOf(fokus);
      if (i >= 0) SETUP.gruppe.splice(i, 1); else if (SETUP.gruppe.length < 6 && tischFrei(fokus)) { SETUP.gruppe.push(fokus); if (window.ABE) window.ABE.glocke(0.25); }
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
    // Heldenwahl fertig → Intro der Kampagne → Abenteuer
    $("#abenteuer-los").onclick = () => { if (!window.ABT) return; const los = () => { if (window.ABE) window.ABE.glocke(1); window.ABT.start(SETUP); }; if (window.ABE && window.ABE.intro) window.ABE.intro(los); else los(); };
    if ($("#lobby-ende")) $("#lobby-ende").onclick = liveBeenden;
    if ($("#zurueck")) $("#zurueck").onclick = () => zeigeSektion("kodex");
  }
  function zeichneLiveBar() {
    const bar = $("#livebar");
    if (!liveAn()) { bar.hidden = true; bar.innerHTML = ""; return; }
    const n = LIVE.client.players.filter((p) => !p.is_host).length;
    bar.hidden = false;
    bar.innerHTML = `<span class="dot"></span><b>LIVE</b> <span>${esc(LIVE.client.session.room_code)} · ${n} ${n === 1 ? "Handy" : "Handys"}</span><button class="btn ghost klein" id="qr-zeigen">Beitreten</button><button class="btn ghost klein" id="live-ende">Beenden</button>`;
    $("#qr-zeigen").onclick = qrZeigen;
    $("#live-ende").onclick = liveBeenden;
    if (window.KAMPAGNE && window.KAMPAGNE.aktiv()) { const b = document.createElement("button"); b.className = "btn ghost klein"; b.id = "live-pause"; b.textContent = "Pausieren"; b.title = "Kampagne speichern und pausieren"; b.onclick = () => window.KAMPAGNE.pausieren(); bar.insertBefore(b, $("#live-ende"));
      const w = document.createElement("button"); w.className = "btn ghost klein"; w.id = "live-tisch"; w.textContent = "Tisch wechseln"; w.title = "Auf einem anderen Gerät als Spieltisch weiterspielen"; w.onclick = () => window.KAMPAGNE.tischWechseln(); bar.insertBefore(w, b); }
  }
  function qrZeigen() { const o = $("#qr-overlay"); o.innerHTML = `<div class="karte-box">${beitrittBox()}<button class="btn" id="qr-zu">Schließen</button></div>`; o.hidden = false; $("#qr-zu").onclick = () => { o.hidden = true; }; }

  /* ---------- Kampagnen (abenteuer/js/kampagnen.js): Spielstand abgeben und übernehmen ---------- */
  /** Gesamter Spielstand eines laufenden Abenteuers (allein oder live), oder null */
  function spielstand() {
    if (!window.ABT || !window.ABT.laeuft()) return null;
    return { live: liveAn(), phase: liveAn() ? LIVE.phase : (st && kampfEnde ? "kampf" : "szene"), besitz: liveAn() ? LIVE.besitz : {}, frueher: liveAn() ? Object.assign({}, LIVE.frueher, LIVE.besitz) : {}, setup: SETUP,
      st: st && kampfEnde ? R.speichern(st) : null, abenteuer: window.ABT.speichern(), imAbenteuer: Boolean(st && kampfEnde) };
  }
  /** Gespeicherten Stand übernehmen: Abenteuer und ggf. laufenden Kampf (eine Live-Verbindung bleibt, wie sie ist) */
  function spielstandUebernehmen(o) {
    clearTimeout(gegnerTimer); wahl = null; tipp = null;
    if (o.setup) SETUP = Object.assign({}, SETUP, o.setup);
    window.ABT.uebernehmen(o.abenteuer);
    if (o.st && o.imAbenteuer) {
      st = R.laden(o.st); window.AB.st = st; letzterLog = st.log.length; letzteTP = {}; kampfEnde = window.ABT.kampfFertig;
      if (liveAn()) { LIVE.phase = "kampf"; LIVE.antwort = null; }
      zeigeSpiel(); render(); veroeffentlichen(); gegnerSchleife();
    } else { st = null; window.AB.st = null; kampfEnde = null; window.ABT.zeige(); }
  }
  /** Neue Live-Runde für eine fortgesetzte Kampagne (neuer Code; die Handys wählen ihre Figur wieder) */
  async function liveFuerKampagne() {
    const c = liveClient();
    if (c.session) { try { await c.leave(); } catch (e) { /* schon zu */ } }
    try { await c.create("Spieltisch"); }
    catch (e) { if (/Gruppengröße|max/i.test(e.message || "")) { c.maxPlayers = 4; await c.create("Spieltisch"); } else throw e; }
    LIVE.phase = "szene"; LIVE.besitz = {}; LIVE.erledigt = {}; LIVE.antwort = null; LIVE.antworten = {};
    wach(); zeichneLiveBar();
    return c.session;
  }
  /** Live-Runde für eine Pause beenden: Handys sehen „pausiert“, dann wird die Sitzung geschlossen */
  async function liveFuerPauseBeenden() {
    if (!liveAn()) return;
    clearTimeout(gegnerTimer);
    try { await LIVE.client.writeOwn("spiel", { phase: "pause", gruppe: SETUP.gruppe, besitz: LIVE.besitz, at: Date.now() }); } catch (e) { /* weiter */ }
    await new Promise((r) => setTimeout(r, 1500));
    try { await LIVE.client.leave(); } catch (e) { /* schon zu */ }
    LIVE.phase = null; vergessen(); zeichneLiveBar();
  }
  /** Neues Tisch-Gerät einer noch nicht begonnenen Kampagne: Heldenwahl mit Handys */
  function lobbyFuerKampagne(schwierigkeit) {
    SETUP.schwierigkeit = schwierigkeit === "hardcore" ? "hardcore" : "normal"; SETUP.gruppe = []; SETUP.tisch = [];
    LIVE.phase = "lobby"; LIVE.besitz = {}; LIVE.frueher = {}; LIVE.erledigt = {}; st = null; window.AB.st = null; kampfEnde = null;
    zeigeSetup(); veroeffentlichen();
  }
  /** Alles Laufende auf diesem Gerät beenden (nach Pause, Löschen, Neu beginnen) */
  function allesBeenden() { clearTimeout(gegnerTimer); st = null; window.AB.st = null; kampfEnde = null; wahl = null; tipp = null; try { localStorage.removeItem(SOLO); } catch (e) { /* privat */ } }

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
    // Moor: Wasser (versperrt den Weg, nicht die Sicht) und tote Bäume / Schilf (versperren beides)
    if (t === "Q") return `<g><rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="#14262a"/><path d="M${x * Z + 8} ${y * Z + 20} q8 -5 16 0 t16 0 M${x * Z + 14} ${y * Z + 40} q8 -5 16 0 t16 0" stroke="#3f6f78" stroke-width="2" fill="none" opacity=".7"/></g>`;
    if (t === "T") return `<g transform="translate(${cx} ${cy})"><ellipse cy="20" rx="20" ry="6" fill="#000" opacity=".3"/><path d="M-3 22 L-2 -6 L-14 -18 M-2 -2 L10 -20 M0 -10 L4 -26" stroke="#3b3326" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M-2 22 L-2 -6" stroke="#2a2418" stroke-width="7"/></g>`;
    if (t === "K") return `<g><rect x="${x * Z + 8}" y="${y * Z + 8}" width="${Z - 16}" height="${Z - 16}" fill="#6a4e30" stroke="#2e2014" stroke-width="2"/><path d="M${x * Z + 8} ${y * Z + 8}L${x * Z + Z - 8} ${y * Z + Z - 8}M${x * Z + Z - 8} ${y * Z + 8}L${x * Z + 8} ${y * Z + Z - 8}" stroke="#2e2014" stroke-width="2"/></g>`;
    // Krone: eingebrochenes Eis (Loch, man sieht hinüber) und gewachsene Eiswand
    if (t === "L") return `<g><rect x="${x * Z + 2}" y="${y * Z + 2}" width="${Z - 4}" height="${Z - 4}" rx="10" fill="#071a24"/><path d="M${x * Z + 6} ${y * Z + 14} l12 8 l-4 12 l14 6 M${x * Z + Z - 8} ${y * Z + 10} l-10 10 l6 10 M${x * Z + 10} ${y * Z + Z - 8} l14 -8 l12 4" stroke="#9fd8ff" stroke-width="1.6" fill="none" opacity=".6"/><ellipse cx="${cx}" cy="${cy + 4}" rx="16" ry="9" fill="#123a4c" opacity=".8"/></g>`;
    if (t === "E") return `<g><path d="M${x * Z + 6} ${y * Z + Z - 4} L${x * Z + 10} ${y * Z + 14} L${cx - 6} ${y * Z + 4} L${cx + 8} ${y * Z + 10} L${x * Z + Z - 6} ${y * Z + 6} L${x * Z + Z - 4} ${y * Z + Z - 4} Z" fill="#bfe6f7" fill-opacity=".85" stroke="#6fb4d4" stroke-width="2"/><path d="M${cx - 6} ${y * Z + 12} L${cx - 2} ${y * Z + Z - 10} M${cx + 8} ${y * Z + 16} L${cx + 6} ${y * Z + Z - 14}" stroke="#ffffff" stroke-opacity=".7" stroke-width="2"/></g>`;
    if (t === "R") return `<g transform="translate(${cx} ${cy})"><path d="M-22 -22 Q0 -34 22 -22 L18 4 L-18 4 Z" fill="#8a6a2a" stroke="#3a2a10" stroke-width="2"/><path d="M0 4 V26" stroke="#b08850" stroke-width="4"/><circle cy="27" r="3" fill="#b08850"/></g>`;
    return `<g transform="translate(${cx} ${cy})"><circle r="24" fill="#6f6a60" stroke="#3b3a35" stroke-width="3"/><circle r="15" fill="#10161a"/><path d="M-10 -4 Q0 -10 10 -4" stroke="#3d5a6a" stroke-width="2" fill="none"/></g>`;
  }
  /** Krone: Ziel-Objekte, angekündigte Flächen, knackendes Eis, Verstärkung an den Zugängen, Ausgang */
  function mechanikEbene() {
    const m = st.mech, mitte = (x, y) => [x * Z + Z / 2, y * Z + Z / 2]; let o = "";
    const schrift = (x, y, t, farbe = "#f0e2c0") => `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="700" fill="${farbe}" stroke="#000" stroke-width="3" paint-order="stroke">${esc(t)}</text>`;
    if (m.eis && m.eis.bekannt) for (const [x, y] of m.eis.felder) if (!st.karte.block.has(x + "," + y)) o += `<path d="M${x * Z + 10} ${y * Z + 16} l10 8 l-3 10 l12 6 M${x * Z + Z - 12} ${y * Z + 12} l-8 9" stroke="#9fd8ff" stroke-opacity=".55" stroke-width="1.5" fill="none"><title>Brüchiges Eis</title></path>`;
    if (m.ausgang) for (const [x, y] of m.ausgang.felder) o += `<rect x="${x * Z + 4}" y="${y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#e8c46a" fill-opacity=".12" stroke="#e8c46a" stroke-width="2.5" stroke-dasharray="6 4"><title>Ausgang: Alle Helden hierher</title></rect>`;
    for (const c of m.wandel) for (const [x, y] of c.felder) o += `<g class="gefahr-eis"><rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="${c.typ === "loch" ? "#1c5a78" : "#bfe6f7"}" fill-opacity=".35" stroke="#9fd8ff" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M${x * Z + 12} ${y * Z + 14} l10 10 l-4 10 l12 8" stroke="#e8f6ff" stroke-width="2" fill="none"/><title>${c.typ === "loch" ? "Bricht ein" : "Hier wächst Eis"}</title></g>`;
    for (const mk of m.marken) {
      for (const [x, y] of mk.felder) o += `<rect class="gefahr-feld" x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="#d0343e" fill-opacity=".28" stroke="#ff6a5a" stroke-width="2.5" stroke-dasharray="6 3"><title>${esc(mk.name)}: trifft beim nächsten Zug</title></rect>`;
      const [x0, y0] = mk.felder[0] || [0, 0]; o += schrift(x0 * Z + Z / 2, y0 * Z + 13, mk.name, "#ffb0a0");
    }
    for (const w of m.wellen) if (!w.aus && w.gekommen < w.max && st.runde === w.naechste - 1) for (const [x, y] of w.quellen) { const [cx, cy] = mitte(x, y); o += `<g class="welle-kommt"><circle cx="${cx}" cy="${cy}" r="${Z * 0.45}" fill="#ff9a3a" fill-opacity=".2" stroke="#ffb35a" stroke-width="3" stroke-dasharray="7 4"/>${schrift(cx, cy - Z * 0.5 < 12 ? cy + Z * 0.62 : cy - Z * 0.5, "Verstärkung!", "#ffd08a")}</g>`; }
    for (const z of m.ziele) {
      const [cx, cy] = mitte(z.x, z.y), an = z.fertig, weg = z.verloren;
      const kern = z.art === "saeule" ? `<rect x="-11" y="-26" width="22" height="48" rx="3" fill="${an ? "#3a3d44" : "#5a6474"}" stroke="#1c1e22" stroke-width="2"/><path d="M0 -16 L-6 -4 L4 2 L-2 14" stroke="${an ? "#4a5060" : "#8fd0ff"}" stroke-width="3" fill="none"/>`
        : z.art === "eisblock" ? `<rect x="-20" y="-22" width="40" height="44" rx="5" fill="${weg ? "#5a6670" : an ? "#2a3a44" : "#bfe6f7"}" fill-opacity="${an ? ".5" : ".85"}" stroke="#6fb4d4" stroke-width="2"/><circle cy="-6" r="6" fill="#3a4a58" opacity="${an ? 0 : 0.7}"/><path d="M-8 18 Q0 2 8 18" fill="#3a4a58" opacity="${an ? 0 : 0.7}"/>`
        : z.art === "tafel" ? `<path d="M-15 22 V-14 Q0 -28 15 -14 V22 Z" fill="${an ? "#8a7a52" : "#6a6862"}" stroke="#2a2824" stroke-width="2"/><path d="M-8 -6 H8 M-8 2 H8 M-8 10 H4" stroke="#2a2824" stroke-width="2"/>`
        : z.art === "gitter" ? (an ? `<path d="M-20 18 L-10 6 M14 18 L6 4 M-4 20 L0 10" stroke="#9fd8ff" stroke-width="3" opacity=".6"/>` : `<rect x="-22" y="-24" width="44" height="48" rx="3" fill="#bfe6f7" fill-opacity=".35" stroke="#6fb4d4" stroke-width="2"/><path d="M-12 -24 V24 M0 -24 V24 M12 -24 V24 M-22 -8 H22 M-22 8 H22" stroke="#4a6a7a" stroke-width="3"/>`)
        : z.art === "herz" ? `<circle r="22" fill="#e8c46a" opacity="${an ? 0.5 : 0.25}"/><path d="M0 18 C-26 0 -16 -22 0 -10 C16 -22 26 0 0 18 Z" fill="${an ? "#fff2c4" : "#f0d488"}" stroke="#8a6a20" stroke-width="2"/><circle r="5" fill="#ffffff" opacity=".9"/>`
        : z.art === "rune" ? `<circle r="18" fill="${an ? "#3a3d44" : "#8fd0ff"}" fill-opacity="${an ? ".6" : ".3"}" stroke="${an ? "#5a6070" : "#cfefff"}" stroke-width="2.5"/><path d="M0 -12 L-8 6 H8 Z M0 -4 V8" stroke="${an ? "#5a6070" : "#ffffff"}" stroke-width="2.5" fill="none"/>`
        : z.art === "horn" ? `<path d="M-2 24 V-4" stroke="#5a4a3a" stroke-width="4"/><path d="M-18 -10 Q-4 -24 14 -14 L18 -6 Q2 -16 -14 -2 Z" fill="${an ? "#e8c46a" : "#c8b088"}" stroke="#4a3a2a" stroke-width="2"/><circle cx="16" cy="-10" r="4" fill="#4a3a2a"/>`
        : z.art === "laich" ? (an ? `<ellipse cy="12" rx="20" ry="7" fill="#2f3a22" opacity=".6"/>` : `<ellipse cy="10" rx="22" ry="10" fill="#2f3a22" stroke="#141a0c" stroke-width="2"/>${[[-10, 4], [0, -2], [10, 5], [-3, 10], [7, -6], [-12, -5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#9fb86a" fill-opacity=".75" stroke="#3a4a1c" stroke-width="1.5"/><circle cx="${x + 1}" cy="${y + 1}" r="2.5" fill="#1c2410"/>`).join("")}`)
        : z.art === "winde" ? `<circle r="19" fill="#5a4530" stroke="#2a1c10" stroke-width="3"/><path d="M0 -19 V19 M-19 0 H19 M-13 -13 L13 13 M-13 13 L13 -13" stroke="#2a1c10" stroke-width="3"/><circle r="5" fill="${an ? "#e8c46a" : "#b9b2a4"}" stroke="#2a1c10" stroke-width="2"/><path d="M19 0 H28" stroke="#b9b2a4" stroke-width="4" stroke-linecap="round"/>`
        : z.art === "kette" ? `<rect x="-6" y="-24" width="12" height="48" rx="3" fill="#5a4530" stroke="#2a1c10" stroke-width="2"/>${[-14, -4, 6].map((y) => `<ellipse cx="14" cy="${y + (an ? 0 : 6)}" rx="7" ry="4" fill="none" stroke="${an ? "#e8c46a" : "#9aa0a8"}" stroke-width="3"/>`).join("")}<path d="M-6 -10 H${an ? 24 : 8}" stroke="${an ? "#e8c46a" : "#9aa0a8"}" stroke-width="3"/>`
        : z.art === "haufen" ? (an ? `<ellipse cy="14" rx="18" ry="5" fill="#000" opacity=".3"/>` : `<ellipse cy="16" rx="20" ry="6" fill="#000" opacity=".35"/><path d="M-18 16 Q-10 -8 0 -12 Q12 -8 18 16 Z" fill="#b9963c" stroke="#5a4414" stroke-width="2"/>${[[-8, 6], [4, 0], [9, 9], [-2, -5], [-12, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff0b0" stroke="#8a6a20" stroke-width="1"/>`).join("")}`)
        : z.art === "grablaterne" ? `<path d="M0 22 V-2" stroke="#3a3a36" stroke-width="5"/><rect x="-9" y="-22" width="18" height="22" rx="2" fill="#2a2a26" stroke="#141412" stroke-width="2"/><circle cy="-11" r="${an ? 3 : 8}" fill="${an ? "#3a3a3a" : "#9be8a0"}" opacity="${an ? 1 : 0.9}"/>${an ? "" : `<circle cy="-11" r="16" fill="#9be8a0" opacity=".2"/>`}`
        : z.art === "kind" ? `<ellipse cy="16" rx="18" ry="5" fill="#000" opacity=".3"/><path d="M-16 14 Q-14 2 -4 2 H10 Q18 4 16 14 Z" fill="#7a6a8a" stroke="#2a2434" stroke-width="2"/><circle cx="-9" cy="-2" r="7" fill="#ecd8c0" stroke="#2a2434" stroke-width="1.5"/>${an ? `<path d="M-12 -3 h2 M-7 -3 h2" stroke="#2a2434" stroke-width="2"/>` : `<path d="M10 -12 l5 -4 M14 -6 l6 -1" stroke="#cfe6ff" stroke-width="2" opacity=".7"/>`}`
        : z.art === "schleuse" ? `<path d="M-20 22 V-20 M20 22 V-20" stroke="#4a3622" stroke-width="6" stroke-linecap="round"/><rect x="-17" y="${an ? 0 : -18}" width="34" height="20" rx="2" fill="#8a6a3e" stroke="#2e2010" stroke-width="2"/><path d="M-17 ${an ? 7 : -11} H17 M-17 ${an ? 13 : -5} H17" stroke="#2e2010" stroke-width="1.5"/><path d="M0 -26 V${an ? -2 : -20}" stroke="#b9b2a4" stroke-width="3"/><circle cy="-26" r="5" fill="none" stroke="#b9b2a4" stroke-width="3"/>${an ? "" : `<path d="M-14 8 Q-7 14 0 8 T14 8 M-14 16 Q-7 22 0 16 T14 16" stroke="#7fc4e8" stroke-width="2.5" fill="none" opacity=".8"/>`}`
        : z.art === "grablicht" ? `<rect x="-9" y="-6" width="18" height="26" rx="2" fill="#4a4842" stroke="#24231f" stroke-width="2"/><circle cy="-12" r="${an ? 9 : 5}" fill="${an ? "#ffd27a" : "#3a3a3a"}" opacity="${an ? 0.9 : 1}"/>`
        : `<ellipse cy="24" rx="20" ry="5" fill="#000" opacity=".35"/><path d="M-13 24 L-16 -14 L0 -27 L16 -14 L13 24 Z" fill="${an ? "#4a4842" : "#6a7488"}" stroke="#24231f" stroke-width="2.5"/><path d="M0 -16 V12 M-7 -6 L7 2 M7 -6 L-7 2" stroke="${an ? "#5a5a5a" : "#cfe6ff"}" stroke-width="2.4" stroke-linecap="round"/>`;
      const glanz = an ? `<circle r="${Z * 0.46}" fill="#e8c46a" fill-opacity=".18" stroke="#e8c46a" stroke-width="2.5"/>` : weg ? "" : `<circle r="${Z * 0.46}" fill="none" stroke="#cfe6ff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="5 4"/>`;
      o += `<g transform="translate(${cx} ${cy})" class="ziel-objekt${an ? " fertig" : ""}${weg ? " verloren" : ""}">${glanz}${kern}<title>${esc(z.name)}${an ? " – erledigt" : weg ? " – verloren" : z.runden > 1 ? ` – ${z.fortschritt}/${z.runden}` : ""}${z.ruhe ? " · nur ohne Gegner daneben" : ""}</title></g>`;
      const info = weg ? "verloren" : an ? "✓" : [z.runden > 1 ? `${z.fortschritt}/${z.runden}` : "", z.frist ? `noch ${Math.max(0, z.frist - st.runde + 1)} R.` : ""].filter(Boolean).join(" · ");
      if (info) o += schrift(cx, cy - Z * 0.5 < 12 ? cy + Z * 0.62 : cy - Z * 0.5, info, an ? "#f0d488" : weg ? "#b0a8a0" : "#cfe6ff");
    }
    return o;
  }
  /** Schatten bleibt am Boden, der Rest der Figur kommt in eine eigene Ebene, die schweben darf (ohne SVG-Positionen zu überschreiben) */
  function figSchweben(teil) {
    const m = teil.match(/<ellipse class="fig-schatten"[^>]*\/>/);
    return (m ? m[0] : "") + `<g class="fig-schweb">${m ? teil.replace(m[0], "") : teil}</g>`;
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
    const n = k.name || "", boden = k.boden ? k.boden : !n || /Garten/i.test(n) ? "garten" : /Turm/i.test(n) ? "holz" : /Pilz/i.test(n) ? "pilz" : /Asche/i.test(n) ? "asche" : "stein";
    const farbe = (v) => ({ garten: `hsl(${95 + v * 60} 22% ${20 + v * 18}%)`, holz: `hsl(${26 + v * 30} 32% ${17 + v * 12}%)`, pilz: `hsl(${165 + v * 40} 20% ${12 + v * 12}%)`, asche: `hsl(${12 + v * 20} 7% ${12 + v * 12}%)`, stein: `hsl(${215 + v * 20} 7% ${16 + v * 14}%)`, moor: `hsl(${70 + v * 50} 24% ${15 + v * 14}%)` }[boden]);
    if (k.bild) {
      // Gemalte Karte: Bild als Boden, Raster nur auf begehbaren Feldern, leichte Vignette
      o += `<defs><radialGradient id="vignette" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>`;
      o += `<image href="${k.bild}" x="0" y="0" width="${k.b * Z}" height="${k.h * Z}" preserveAspectRatio="none"/>`;
      o += `<rect width="${k.b * Z}" height="${k.h * Z}" fill="url(#vignette)"/>`;
      for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) if (!k.block.has(x + "," + y)) o += `<rect x="${x * Z + 1}" y="${y * Z + 1}" width="${Z - 2}" height="${Z - 2}" rx="3" fill="none" stroke="#e8dcc0" stroke-opacity=".16"/>`;
    }
    else for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) {
      const v = ((x * 7 + y * 13) % 5) / 40;
      o += `<rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="${farbe(v)}"/>`;
      if (boden === "holz") o += `<path d="M${x * Z} ${y * Z + Z / 2}h${Z}" stroke="#000" stroke-opacity=".18"/>`;
      if (boden === "asche" && (x * 5 + y * 3) % 7 === 0) o += `<circle cx="${x * Z + 14 + (y % 3) * 9}" cy="${y * Z + 18 + (x % 3) * 8}" r="4" fill="#ff7a2a" opacity=".45"/>`;
      if (boden === "moor" && (x * 5 + y * 7) % 6 === 0) o += `<path d="M${x * Z + 14 + (y % 3) * 8} ${y * Z + 46} q3 -12 1 -24 M${x * Z + 20 + (y % 3) * 8} ${y * Z + 46} q-2 -10 2 -18" stroke="#8a9a5a" stroke-width="2" fill="none" opacity=".5"/>`;
      if (boden === "pilz" && (x * 3 + y * 5) % 9 === 0) o += `<circle cx="${x * Z + 20}" cy="${y * Z + 34}" r="3" fill="#7fe0c0" opacity=".35"/>`;
    }
    if (/Siegel/i.test(n) && !k.bild) o += `<circle cx="${k.b * Z / 2}" cy="${k.h * Z / 2}" r="${Z * 3.2}" fill="none" stroke="#c8ccd8" stroke-opacity=".35" stroke-width="5"/><circle cx="${k.b * Z / 2}" cy="${k.h * Z / 2}" r="${Z * 2.9}" fill="none" stroke="#c8ccd8" stroke-opacity=".15" stroke-width="2"/>`;
    if (!k.bild) o += `<path d="${Array.from({ length: k.b + 1 }, (_, i) => `M${i * Z} 0V${k.h * Z}`).join("")}${Array.from({ length: k.h + 1 }, (_, i) => `M0 ${i * Z}H${k.b * Z}`).join("")}" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
    if (boden === "garten" && !k.bild) o += `<rect x="0" y="${4 * Z + 18}" width="${k.b * Z}" height="24" fill="#8a7a5c" opacity=".25"/>`;
    // Zonen und Glut
    for (const zo of st.zonen) {
      const x0 = Math.max(0, zo.x - zo.radius), y0 = Math.max(0, zo.y - zo.radius), x1 = Math.min(k.b - 1, zo.x + zo.radius), y1 = Math.min(k.h - 1, zo.y + zo.radius);
      o += zo.art === "rauch"
        ? `<rect x="${x0 * Z}" y="${y0 * Z}" width="${(x1 - x0 + 1) * Z}" height="${(y1 - y0 + 1) * Z}" rx="20" fill="#b8b8c0" fill-opacity=".45"/>`
        : `<rect x="${x0 * Z + 2}" y="${y0 * Z + 2}" width="${(x1 - x0 + 1) * Z - 4}" height="${(y1 - y0 + 1) * Z - 4}" rx="12" fill="#9a6ad0" fill-opacity=".12" stroke="#b58cff" stroke-width="3" stroke-dasharray="8 6"/>`;
    }
    for (const b of st.brand) o += `<rect x="${b.x * Z + 4}" y="${b.y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#ff7a2a" fill-opacity=".35"/>`;
    for (const [kk, c] of reach) { const [x, y] = kk.split(",").map(Number); if (x === akt.x && y === akt.y) continue; o += `<rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="${c === "schritt" ? "#b58cff" : "#4D9DB6"}" fill-opacity="${k.bild ? ".32" : ".2"}" stroke="${c === "schritt" ? "#c9a8ff" : "#8fd0e6"}" stroke-opacity=".7" stroke-width="1.5"/>`; }
    if (tipp && tipp.feld && spielerDran) o += `<rect class="tipp-ring" x="${tipp.feld.x * Z + 4}" y="${tipp.feld.y * Z + 4}" width="${Z - 8}" height="${Z - 8}" rx="8" fill="#f2d35a" fill-opacity=".18" stroke="#f2d35a" stroke-width="3"/>`;
    // Auf gemalten Karten ist alles im Bild; nur berührte Siegelsteine leuchten zusätzlich auf
    for (const [t, x, y] of k.hindernisse) {
      if (t === "X" || t === "O") continue; // Ziel-Objekte zeichnet die Mechanik-Ebene
      if (t === "L" || t === "E") { o += hindernis(t, x, y); continue; } // entstehen erst im Kampf, also nie im Bild
      if (k.bild) { if (t === "Z" && st.siegel && (st.siegel.find((z) => z.x === x && z.y === y) || {}).beruehrt) o += `<circle cx="${x * Z + Z / 2}" cy="${y * Z + Z / 2}" r="${Z * 0.48}" fill="#f0d488" fill-opacity=".28" stroke="#f0d488" stroke-width="3"/>`; continue; }
      o += hindernis(t, x, y);
    }
    // Ziel eines Läufers (Glockenseil) markieren, solange er unterwegs ist
    for (const g of st.figuren) if (g.laeufer && g.tp > 0) { const L = g.laeufer, lx = L.x * Z + Z / 2, ly = L.y * Z + Z / 2; o += `<g class="seil-ziel"><circle cx="${lx}" cy="${ly}" r="${Z * 0.44}" fill="#C5A267" fill-opacity="${L.da ? ".35" : ".12"}" stroke="#f0d488" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${lx}" y="${ly - Z * 0.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#f0d488" stroke="#000" stroke-width="3" paint-order="stroke">${L.da ? "Er zieht gleich!" : "Glockenseil"}</text></g>`; }
    // Eskorte: Seras Weg (Punkte) und der Ausgang (Fahne) bzw. das Gerät mit Fortschritt
    if (st.eskorte) {
      const r = st.eskorte.route, ak = st.eskorte.aktivierung;
      if (ak && r.length) { const [x, y] = r[r.length - 1]; o += `<g transform="translate(${x * Z + Z / 2} ${y * Z + Z / 2})" class="geraet"><circle r="${Z * 0.46}" fill="#8fd0ff" fill-opacity="${0.1 + 0.25 * ak.fortschritt / ak.runden}" stroke="#8fd0ff" stroke-width="2.5" stroke-dasharray="6 4"/><text y="${-Z * 0.52}" text-anchor="middle" font-size="13" font-weight="700" fill="#cfeaff" stroke="#000" stroke-width="3" paint-order="stroke">${ak.fortschritt}/${ak.runden}</text></g>`; }
      if (ak) r.slice(0, -1).forEach(([x, y], i) => { o += `<circle cx="${x * Z + Z / 2}" cy="${y * Z + Z / 2}" r="6" fill="${i < st.eskorte.schritt ? "#6a6250" : "#e8c46a"}" fill-opacity=".7"/>`; });
      else r.forEach(([x, y], i) => { const fertig = i < st.eskorte.schritt, letzter = i === r.length - 1; o += letzter
        ? `<g transform="translate(${x * Z + Z / 2} ${y * Z + Z / 2})" class="ausgang"><circle r="${Z * 0.42}" fill="#e8c46a" fill-opacity=".14" stroke="#e8c46a" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M-6 16V-16L12 -9L-6 -2" fill="#e8c46a" stroke="#6a4e1e" stroke-width="1.5"/></g>`
        : `<circle cx="${x * Z + Z / 2}" cy="${y * Z + Z / 2}" r="6" fill="${fertig ? "#6a6250" : "#e8c46a"}" fill-opacity=".7"/>`; });
    }
    if (st.mech) o += mechanikEbene();
    // Wer am Boden liegt, wird zuerst gezeichnet, damit stehende Figuren darüber sichtbar bleiben
    // Sockel und Licht der Spielfiguren (Verläufe einmal je Karte)
    o += `<defs><radialGradient id="sockel-held" cx="50%" cy="35%" r="65%"><stop offset="0" stop-color="#2c4a5c"/><stop offset="1" stop-color="#0c1820"/></radialGradient><radialGradient id="sockel-feind" cx="50%" cy="35%" r="65%"><stop offset="0" stop-color="#5a1c22"/><stop offset="1" stop-color="#1a080a"/></radialGradient><radialGradient id="aktiv-licht"><stop offset="0" stop-color="#ffd890" stop-opacity=".55"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs>`;
    if (!st.ende && akt && akt.x >= 0) o += `<circle class="aktiv-licht" cx="${akt.x * Z + Z / 2}" cy="${akt.y * Z + Z / 2}" r="${Z * 1.6}" fill="url(#aktiv-licht)"/>`;
    for (const f of st.figuren.slice().sort((a, b) => (a.tp > 0) - (b.tp > 0))) {
      if (f.x < 0 || (f.z && f.z.verbannt)) continue;
      const vorFig = o.length; // jede Figur in eine eigene Gruppe, damit die Effekt-Ebene sie bewegen kann
      try {
      const cx = f.x * Z + Z / 2, cy = f.y * Z + Z / 2, unten = f.tp <= 0;
      const titel = `<title>${esc(f.name)}${f.titel ? " – " + esc(f.titel) : ""} · ${f.tp}/${f.tpMax} TP · RK ${f.rk}${R.zustaende(st, f).length ? " · " + esc(R.zustaende(st, f).join(", ")) : ""}</title>`;
      if (f.seite === "gegner" && unten) { o += B.gegnerBild(f.art) ? `<g transform="translate(${cx} ${cy}) scale(.8)" opacity=".45">${B.gegner(f.art, true)}</g>` : `<g transform="translate(${cx} ${cy}) rotate(180)" opacity=".35">${B.gegner(f.art)}</g>`; continue; }
      if (!unten) o += `<ellipse class="fig-schatten" cx="${cx}" cy="${cy + 22}" rx="24" ry="7" fill="#000" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="27" fill="url(#sockel-${f.seite === "gegner" ? "feind" : "held"})" stroke="${f.seite === "gegner" ? "#c0444e" : f.art === "wolf" ? "#6fbf8a" : "#d9b26a"}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="29.5" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.5"/>`;
      if (!unten && f.schild && f.schild.aktiv) o += `<circle class="schild-ring" cx="${cx}" cy="${cy}" r="33" fill="#8fd0ff" fill-opacity=".12" stroke="#8fd0ff" stroke-width="3" stroke-dasharray="5 3"><title>${esc(f.schild.text)}: fängt die Hälfte des Schadens ab</title></circle>`;
      if (f === akt && !st.ende) o += `<circle class="aktiv-ring" cx="${cx}" cy="${cy}" r="29" fill="none" stroke="#C5A267" stroke-width="3.5"/><circle cx="${cx}" cy="${cy}" r="33" fill="none" stroke="#C5A267" stroke-opacity=".35" stroke-width="5"/>`;
      if (gegnerInfo === f.id) o += `<circle cx="${cx}" cy="${cy}" r="31" fill="none" stroke="#e8dcc0" stroke-width="2" stroke-dasharray="4 3"/>`;
      if (zs.includes(f)) {
        o += `<circle cx="${cx}" cy="${cy}" r="29" fill="${f.seite === "gegner" ? "#d0545e" : "#6fd06a"}" fill-opacity=".28" stroke="${f.seite === "gegner" ? "#ff6a6a" : "#7fe07a"}" stroke-width="3.5"/>`;
        const c = R.chance(st, wahl, f.id);
        if (c.p != null && f !== akt) o += `<g transform="translate(${cx} ${cy - 34 < 12 ? cy + 42 : cy - 34})"><rect x="-26" y="-11" width="52" height="18" rx="9" fill="#1b1612" stroke="${c.p >= 0.6 ? "#7fe07a" : c.p >= 0.35 ? "#d6a23a" : "#ff7a5a"}" stroke-width="1.5"/><text y="3" text-anchor="middle" font-size="12" font-weight="700" fill="#ece4d4">${Math.round(c.p * 100)} %</text></g>`;
      }
      if (tipp && tipp.ziel === f.id && !wahl) o += `<circle class="tipp-ring" cx="${cx}" cy="${cy}" r="31" fill="none" stroke="#f2d35a" stroke-width="3"/>`;
      if (f.seite === "gegner") {
        o += `<g transform="translate(${cx} ${cy})">${titel}${B.gegner(f.art)}</g>`;
        const nr = (f.name.match(/\d+$/) || [""])[0];
        if (nr) o += `<g transform="translate(${cx + 17} ${cy - 17})"><circle r="10" fill="#1b1612" stroke="#d79a7d" stroke-width="1.5"/><text y="4.5" text-anchor="middle" font-size="13" font-weight="700" fill="#f0d0c0">${esc(nr)}</text></g>`;
      } else {
        if (f.art === "begleiter") {
          const visier = st.figuren.some((g) => g.seite === "gegner" && g.tp > 0 && g.visier === st.runde);
          o += `<g transform="translate(${cx} ${cy})">${titel}${B.begleiter(unten)}</g>`;
          if (visier && !unten) o += `<g class="visier" transform="translate(${cx} ${cy})"><circle r="30" fill="none" stroke="#ff5a4a" stroke-width="2.5" stroke-dasharray="5 4"/><path d="M0 -36V-26M0 26V36M-36 0H-26M26 0H36" stroke="#ff5a4a" stroke-width="3"/></g>`;
          if (unten) o += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">${f.stabil ? "stabil" : "retten!"}</text>`;
          const w = 44, anteil = Math.max(0, f.tp / f.tpMax);
          o += `<rect x="${cx - w / 2}" y="${cy + 23}" width="${w}" height="6" fill="#1b1612" rx="2"/><rect x="${cx - w / 2}" y="${cy + 23}" width="${w * anteil}" height="6" rx="2" fill="#e8c46a"/>`;
          continue;
        }
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
      } finally { o = o.slice(0, vorFig) + `<g class="fig ${f.seite === "gegner" ? "feind" : "held"} ${f.tp > 0 && !f.tot ? "steht" : "liegt"}" data-id="${f.id}" style="--v:${-(((Date.now() / 1000) + (st.figuren.indexOf(f) % 5) * 0.6) % 3).toFixed(2)}s"><g class="fig-k">` + figSchweben(o.slice(vorFig)) + "</g></g>"; }
    }
    if (RASTER) o += rasterEbene(k);
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) o += `<rect class="feld" data-x="${x}" data-y="${y}" x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="transparent"/>`;
    svg.innerHTML = o;

    const mini = (f) => f.seite === "gegner" ? `<svg class="mini" viewBox="-26 -26 52 52" aria-hidden="true">${B.gegner(f.art)}</svg>` : `<img class="mini" src="${F.bild(f.fid)}" alt="">`;
    $("#reihe").innerHTML = `<span class="runde">Runde ${st.runde}${st.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</span>` + st.reihe.map((id, i) => { const f = R.fig(st, id), b = besitzerVon(f); return `<span class="${i === st.am && !st.ende ? "dran" : ""} ${f.tp <= 0 ? "down" : ""} ${f.seite === "gegner" ? "g" : ""}" ${f.seite === "gegner" ? `data-info="${f.id}"` : ""}>${mini(f)}${esc(f.name)}${b ? ` <small>📱 ${esc(spielerName(b))}</small>` : ""}</span>`; }).join("");

    if (st.ende) { $("#aktiv").innerHTML = ""; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else if (!spielerDran) { $("#aktiv").innerHTML = `<b>${esc(akt.name)}</b><span class="werte">ist am Zug …</span>`; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else {
      const b = besitzerVon(akt), zust = R.zustaende(st, akt);
      const pl = akt.plaetzeMax && (akt.plaetzeMax[0] + akt.plaetzeMax[1]) ? ` · Plätze ${"●".repeat(akt.plaetze[0])}${akt.plaetzeMax[1] ? " | " + "◆".repeat(akt.plaetze[1]) : ""}` : "";
      $("#aktiv").innerHTML = `<div class="kopf-klein">${B.marke(akt.fid, 40)}<div><b>${esc(akt.name)}</b><span class="werte">${esc(akt.titel)} · Stufe ${akt.stufe}</span></div></div><span class="werte">TP ${akt.tp}/${akt.tpMax} · RK ${R.rkEff(st, akt)} · Bewegung ${st.zug.bewegung}${st.zug.schritt ? " + Schattenschritt " + st.zug.schritt : ""}${pl}</span>${zust.length ? `<span class="werte zust">${esc(zust.join(" · "))}</span>` : ""}${b ? `<span class="handy-dran">📱 ${esc(spielerName(b))} ist dran: hier auf der Karte bewegen, Aktionen auf dem Handy.</span>` : ""}`;
      const knopf = (a) => {
        const g = R.grund(st, a.id), r = R.rest(akt, a), typ = a.typ === "bonus" ? "Bonusaktion" : a.typ === "frei" ? "frei" : "Aktion";
        const kosten = a.platz ? ` · ${a.platz === 2 ? "Platz Grad 2" : "1 Platz"}` : "", gz = R.grenze(akt, a), rr = r !== Infinity ? ` · noch ${Math.max(0, r)}${gz ? ` von ${gz.n} je ${gz.je}` : ""}` : "";
        const wirk = a.schaden ? ` · ${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""}` : a.heilung ? ` · heilt ${a.heilung}` : "";
        return `<button class="akt ${wahl === a.id ? "gewaehlt" : ""} ${tipp && tipp.aktion === a.id ? "getippt" : ""}" data-a="${a.id}" ${g ? "disabled" : ""}><span class="akt-kopf"><b>${esc(a.name)}${a.art === "trank" && !a.gross ? ` (${R.trankZahl(akt)})` : ""}</b><small>${typ}${kosten}${rr}${wirk}</small></span><span class="akt-text">${esc(g && g !== "Kein gültiges Ziel." ? g : a.text || "")}${g === "Kein gültiges Ziel." ? ` <em>${["trank", "selbstheilung"].includes(a.art) ? "Nicht nötig – du bist unverletzt." : SELBST.has(a.art) ? "Gerade nicht möglich." : "Gerade kein Ziel in Reichweite."}</em>` : ""}</span></button>`;
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
    $("#log").innerHTML = st.log.slice().reverse().map((l) => `<li class="${l.art || ""}">${logZeile(l)}</li>`).join("");
    zeichneGegnerInfo(); zeichneLeiste(akt, spielerDran);
    zeigeWurf();
    schwebeZahlen();
    zeichneLiveBar();
    if (st.ende) zeigeEnde(); else $("#ende").hidden = true;
    if (window.ABFX) window.ABFX.nach(st, R);
  }

  /** Schaden und Heilung als aufsteigende Zahlen über den Figuren */
  function schwebeZahlen() {
    const wrap = $(".karte-wrap"); if (!wrap || !st) return;
    if (window.ABFX && window.ABFX.aktiv()) return; // die Effekt-Ebene zeigt die Zahlen selbst
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
  /** Neue Einträge aus dem Verlauf erscheinen kurz als Banner oben auf der Karte */
  function zeigeMeldungen(neu) {
    if (TEMPO === 0 || !neu.length) return;
    let box = $("#meldungen");
    if (!box) { box = document.createElement("div"); box.id = "meldungen"; box.className = "meldungen"; box.setAttribute("aria-live", "polite"); $(".karte-wrap").appendChild(box); }
    for (const l of neu) {
      const runde = /^— Runde/.test(l.t), m = document.createElement("div");
      m.className = `meldung ${l.art || ""} ${runde ? "runde" : ""}`; m.textContent = l.t;
      box.appendChild(m);
      setTimeout(() => m.classList.add("weg"), runde ? 1800 : 3600); setTimeout(() => m.remove(), runde ? 2300 : 4100);
    }
    while (box.children.length > 4) box.firstElementChild.remove();
  }
  function zeigeWurf() {
    const neu = st.log.slice(letzterLog); letzterLog = st.log.length;
    zeigeMeldungen(neu);
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
      : st.ende === "gefangen"
        ? `<h2>Verschleppt</h2><p>Die Jäger haben ${esc((R.begleiterVon(st) || {}).name || "eure Begleiterin")} mitgenommen. Die Geschichte geht anders weiter.</p>`
      : st.ende === "niederlage"
        ? `<h2>${esc(META().niederlage || "Niederlage")}</h2><p>Niemand ist mehr auf den Beinen. ${tote.length ? `Gefallen: ${tote.map((f) => esc(f.name)).join(", ")}.` : ""}</p>`
        : `<h2>Rückzug</h2><p>Die Gruppe liegt am Boden und zieht sich zum Lagerfeuer zurück. Im echten Abenteuer verliert ihr nichts, ihr versucht es einfach noch einmal.</p>`;
    if (kampfEnde) {
      const t2 = st.ende === "rueckzug" ? `<h2>Rückzug</h2><p>Die Gruppe schleppt sich zum letzten Lagerfeuer zurück. ${esc((META().uhr || {}).rueckzug || "")} Alle erholen sich ganz, dann versucht ihr es noch einmal.</p>` : text;
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
    if (!st || RASTER) return;
    if (st.ende) { veroeffentlichen(); return; }
    const a = R.aktiv(st);
    if (a.seite === "gegner") gegnerTimer = setTimeout(() => { R.gegnerZug(st); render(); veroeffentlichen(); gegnerSchleife(); }, tempo());
  }

  function klickFeld(x, y) {
    if (!st) return;
    const akt = R.aktiv(st);
    const g = st.figuren.find((f) => f.seite === "gegner" && f.x === x && f.y === y && f.tp > 0);
    if (!wahl && g) { gegnerInfo = gegnerInfo === g.id ? null : g.id; render(); return; }
    if (st.ende || akt.seite !== "spieler") return;
    if (wahl) {
      const z = R.ziele(st, wahl).find((f) => f.x === x && f.y === y);
      if (!z) { $("#hinweis").textContent = "Dort ist kein gültiges Ziel."; return; }
      R.handeln(st, wahl, z.id); wahl = null; tipp = null; render(); veroeffentlichen(); return;
    }
    const r = R.bewegen(st, x, y);
    if (r.fehler) $("#hinweis").textContent = r.fehler; else { tipp = null; render(); veroeffentlichen(); }
  }

  function zeigeSektion(id) {
    for (const x of ["mythara", "hub", "einladen", "intro", "einleitung", "kodex", "lobby", "spiel", "ende", "szene"]) { const el = $("#" + x); if (el) el.hidden = x !== id; }
    document.body.classList.toggle("im-kampf", id === "spiel");
    document.body.classList.toggle("im-szene", id === "szene");
    // Für das Neuladen merken, ob man gerade im Spiel war (nur dann wird automatisch fortgesetzt)
    try { sessionStorage.setItem("ab_ansicht", id); } catch (e) { /* privat */ }
  }
  /** War vor dem Neuladen ein Spielbildschirm offen (Szene, Kampf, Heldenwahl …)? Ohne Angabe: ja (ältere Stände) */
  const imSpielGewesen = () => { let a = null; try { a = sessionStorage.getItem("ab_ansicht"); } catch (e) { /* privat */ } return !a || ["szene", "spiel", "ende", "lobby", "einleitung", "einladen"].includes(a); };
  function zeigeIntro() { if (window.MYTHARA && window.MYTHARA.imHub()) window.MYTHARA.zeigeHub(); else zeigeSektion("intro"); }
  function zeigeSpiel() { zeigeSektion("spiel"); }
  /* ---------- Karten-Prüfmodus (?raster): Koordinaten, Hindernisse und Startplätze sichtbar ---------- */
  const RASTER = params.has("raster");
  const RASTER_KARTEN = { GARTEN: "garten", TURM: "kobolde", GRUFT: "gruft", PILZE: "pilze", SCHACHT: "netz", HALLE: "halle", SIEGEL: "siegel" };
  function rasterEbene(k) {
    const FARBE = { X: "#e0434f", P: "#3d8fe0", Z: "#e8c46a" }; let o = "";
    for (const [t, x, y] of k.hindernisse) o += `<rect x="${x * Z + 2}" y="${y * Z + 2}" width="${Z - 4}" height="${Z - 4}" fill="${FARBE[t] || "#e08a3a"}" fill-opacity=".22" stroke="${FARBE[t] || "#e08a3a"}" stroke-width="2"/>`;
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) o += `<rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="none" stroke="#fff" stroke-opacity=".35"/><text x="${x * Z + 3}" y="${y * Z + 11}" font-size="9" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke">${x},${y}</text>`;
    const marke = (liste, buchstabe, farbe) => liste.map(([x, y], i) => `<text x="${x * Z + Z - 4}" y="${y * Z + Z - 5}" text-anchor="end" font-size="11" font-weight="700" fill="${farbe}" stroke="#000" stroke-width="3" paint-order="stroke">${buchstabe}${i + 1}</text>`).join("");
    return o + marke(k.start.spieler, "H", "#7fd0ff") + marke(k.start.wolf, "W", "#8fe08a") + marke(k.start.gegner, "G", "#ff9a8a");
  }
  function rasterStart(name) {
    const D = window.ABD, karte = name === "GARTEN" ? R.KARTE_GARTEN : D.KARTEN[name];
    clearTimeout(gegnerTimer); kampfEnde = null; wahl = null; tipp = null;
    st = R.neuesSpiel(1, { figuren: ["schildwaechter", "elementarist", "lichtbringer", "trickser", "tiergefaehrte", "kopfgeldjaeger"], stufe: 3, begegnung: RASTER_KARTEN[name], karte });
    window.AB.st = st; letzterLog = st.log.length; zeigeSpiel(); render();
    let bar = $("#rasterbar"); if (!bar) { bar = document.createElement("div"); bar.id = "rasterbar"; bar.className = "rasterbar"; $("#spiel").prepend(bar); }
    bar.innerHTML = `<b>Kartenprüfung</b>${Object.keys(RASTER_KARTEN).map((n) => `<button class="btn ${n === name ? "" : "ghost"} klein" data-rkarte="${n}">${esc(n === "GARTEN" ? "Klostergarten" : D.KARTEN[n].name.replace(/^(Der|Die) /, ""))}</button>`).join("")}
      <span class="note"><i style="background:#e0434f"></i>gesperrt <i style="background:#3d8fe0"></i>Grube (Sicht frei) <i style="background:#e8c46a"></i>Siegelstein · H = Helden, W = Wolf, G = Gegner (Startplätze). Die Figuren könnt ihr zum Ausprobieren bewegen; Gegner ziehen hier nicht.</span>`;
    bar.querySelectorAll("[data-rkarte]").forEach((b) => { b.onclick = () => rasterStart(b.dataset.rkarte); });
  }
  if (RASTER) bereit.then(() => rasterStart((params.get("raster") || "GARTEN").toUpperCase() in RASTER_KARTEN ? params.get("raster").toUpperCase() : "GARTEN"));

  /** Bekannte Eigenschaften der Gegner (für die Infokarte) */
  const GEGNER_INFO = {
    rost: "Rost: Treffer gegen Metallrüstung senken deren RK.",
    flieht: "Flieht, wenn es schlecht für ihn steht.",
    untot: "Untot: Heiliges Licht und Vertreiben wirken besonders.",
    anfaellig: "Anfällig gegen Wuchtschaden.",
    sporen: "Sporen: Wer in der Nähe ist, atmet giftige Sporen ein.",
    netz: "Netz: Fesselt Getroffene an Ort und Stelle.",
    atem: "Atem: Greift alle paar Runden mehrere Ziele auf einmal an.",
    boss: "Anführer: ruft Tote zu Hilfe. Siegelsteine und sein wahrer Name schwächen ihn.",
  };
  function zeichneGegnerInfo() {
    const el = $("#gegner-info"), g = gegnerInfo && R.fig(st, gegnerInfo);
    if (!g || g.tp <= 0) { gegnerInfo = null; el.hidden = true; el.innerHTML = ""; return; }
    const d = R.GEGNER[g.art], anteil = Math.max(0, g.tp / g.tpMax), z = R.zustaende(st, g);
    const eig = Object.keys(GEGNER_INFO).filter((k) => d[k]).map((k) => `<li>${esc(GEGNER_INFO[k])}</li>`).join("");
    el.hidden = false;
    el.innerHTML = `<div class="gi-kopf"><svg class="gi-bild" viewBox="-26 -26 52 52" aria-hidden="true">${B.gegner(g.art)}</svg><div><b>${esc(g.name)}</b><small>Gegner${d.untot ? " · untot" : ""}</small></div><button class="link" id="gi-zu" aria-label="Schließen">✕</button></div>
      <div class="gi-tp"><i style="width:${anteil * 100}%"></i><span>❤ ${g.tp} / ${g.tpMax}</span></div>
      <ul class="gi-werte"><li><span>Rüstungsklasse</span><b>${R.rkEff ? R.rkEff(st, g) : g.rk}</b></li><li><span>Bewegung</span><b>${d.bewegung || 6}</b></li>${d.angriff ? `<li><span>${esc(d.angriff.name)}</span><b>+${d.angriff.bonus} · ${esc(d.angriff.schaden)}${d.angriff.reichweite ? ` · ${d.angriff.reichweite} Felder` : ""}</b></li>` : ""}</ul>
      ${eig ? `<ul class="gi-eig">${eig}</ul>` : ""}${z.length ? `<p class="gi-zust">${z.map(esc).join(" · ")}</p>` : ""}`;
  }
  /** Aktionsleiste unter der Karte: Bewegen · Angreifen · Fähigkeit · Gegenstand · Zug beenden */
  function zeichneLeiste(akt, dran) {
    const el = $("#leiste");
    if (!st || st.ende || !akt || akt.seite !== "spieler") { el.innerHTML = st && !st.ende && akt ? `<div class="l-wer"><span class="l-warte">${esc(akt.name)} ist am Zug …</span></div>` : ""; return; }
    const alle = R.aktionenVon(akt, st), frei = (a) => a && !R.grund(st, a.id);
    const angriff = alle.find((a) => (a.typ || "aktion") === "aktion" && a.schaden && !a.platz && R.rest(akt, a) === Infinity);
    const trank = alle.find((a) => a.art === "trank" && !a.gross) || alle.find((a) => a.art === "trank");
    const anteil = Math.max(0, akt.tp / akt.tpMax);
    const knopf = (l, sym, text, an, extra = "") => `<button class="l-knopf ${an ? "" : "aus"}" data-l="${l}" ${extra} ${dran && an ? "" : "disabled"}><span class="l-sym" aria-hidden="true">${sym}</span><span>${text}</span></button>`;
    el.innerHTML = `<div class="l-wer">${akt.fid ? B.marke(akt.fid, 46) : ""}<div><b>${esc(akt.name)}</b><div class="l-tp"><i style="width:${anteil * 100}%"></i><span>❤ ${akt.tp} / ${akt.tpMax}</span></div></div></div>
      <div class="l-knoepfe">${knopf("bewegen", "➶", "Bewegen", st.zug.bewegung || st.zug.schritt)}${knopf("angriff", "⚔", angriff ? esc(angriff.name) : "Angreifen", frei(angriff), angriff ? `data-a="${angriff.id}"` : "")}${knopf("faehig", "✶", "Fähigkeit", true)}${knopf("trank", "⚱", `Heiltrank (${R.trankZahl(akt)})`, frei(trank), trank ? `data-a="${trank.id}"` : "")}${knopf("ende", "⟳", "Zug beenden", true)}</div>`;
    if (wahl) { const b = el.querySelector(`[data-a="${wahl}"]`); if (b) b.classList.add("gewaehlt"); }
  }
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
    if (SETUP.gruppe.length < Math.min(3, META().min)) { zeigeSetup(); return; }
    F.STUFEN10.aktiv = false; // Übungskampf: immer im bisherigen Modell (Stufe 1–3 frei wählbar)
    st = R.neuesSpiel(seed, { figuren: SETUP.gruppe, stufe: SETUP.stufe, schwierigkeit: SETUP.schwierigkeit, begegnung: BEGEGNUNGEN[SETUP.begegnung] ? SETUP.begegnung : "garten" });
    wahl = null; tipp = null; letzteTP = {}; letzterLog = st.log.length;
    window.AB.st = st;
    if (liveAn()) { LIVE.phase = "kampf"; LIVE.antwort = null; }
    zeigeSpiel(); render(); veroeffentlichen(); gegnerSchleife();
  }

  $("#karte").addEventListener("click", (ev) => { const t = ev.target.closest(".feld"); if (t) klickFeld(+t.dataset.x, +t.dataset.y); });
  $("#reihe").addEventListener("click", (ev) => { const t = ev.target.closest("[data-info]"); if (t && st) { gegnerInfo = gegnerInfo === t.dataset.info ? null : t.dataset.info; render(); } });
  $("#gegner-info").addEventListener("click", (ev) => { if (ev.target.closest("#gi-zu")) { gegnerInfo = null; render(); } });
  $("#leiste").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-l]"); if (!b || b.disabled || !st) return;
    const akt = R.aktiv(st), l = b.dataset.l; tipp = null;
    if (l === "bewegen") { wahl = null; render(); return; }
    if (l === "ende") { wahl = null; R.zugEnde(st); render(); veroeffentlichen(); gegnerSchleife(); return; }
    if (l === "faehig") { const el = $("#aktionen"); if (el) { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); el.classList.remove("blink"); void el.offsetWidth; el.classList.add("blink"); } return; }
    const id = b.dataset.a; if (!id) return;
    const h = R.findeAktion(akt, id);
    if (h && SELBST.has(h.a.art)) { R.handeln(st, id, akt.id); wahl = null; render(); veroeffentlichen(); return; }
    wahl = wahl === id ? null : id; render();
  });
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

  // Nach dem Neuladen: laufende Live-Sitzung und Kampf wiederherstellen.
  // Nur beim Neuladen derselben Seite – wer über die Website kommt, landet auf der Start- bzw. Spielerseite.
  const neuGeladen = (() => { try { const n = performance.getEntriesByType("navigation")[0]; return n ? n.type === "reload" : performance.navigation && performance.navigation.type === 1; } catch (e) { return false; } })();
  (async () => {
    await bereit;
    if (!neuGeladen || !imSpielGewesen()) return; // auf der Start- oder Spielerseite neu geladen: dort bleiben
    let gespeichert = null;
    try { gespeichert = JSON.parse(localStorage.getItem(SPEICHER) || "null"); } catch (e) { /* defekt */ }
    if (!gespeichert || !window.RPGNetz) { allein(); return; }
    try {
      const c = liveClient(), s = await c.restore();
      if (!s || s.closed || !s.is_host) { vergessen(); allein(); return; }
      LIVE.phase = gespeichert.phase; LIVE.besitz = gespeichert.besitz || {}; LIVE.frueher = gespeichert.frueher || {}; LIVE.erledigt = gespeichert.erledigt || {};
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
    } catch (e) { vergessen(); allein(); }
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
  window.AB = { st: null, R, LIVE, SETUP: () => SETUP, META, liveClient, frueherSetzen,
    /** Neues Abenteuer wählen (Spielerseite → Neue Kampagne): Daten, Mindestgröße und Texte für Einleitung und Kodex */
    abenteuerWaehlen(id) { SETUP.abenteuer = id || "grauwacht"; setupMerken(); if (window.ABE && window.ABE.abenteuerTexte) window.ABE.abenteuerTexte(META()); }, qrSvg, lobbyFuerKampagne, spielstand, spielstandUebernehmen, liveFuerKampagne, liveFuerPauseBeenden, allesBeenden, qrZeigen, zeigeIntro, render, klickFeld, start, zeigeSetup, zeigeSektion, kampfStarten, veroeffentlichen, toast,
    liveBeenden: async () => { try { await LIVE.client.leave(); } catch (e) { /* schon zu */ } LIVE.phase = null; vergessen(); zeichneLiveBar(); },
    liveAn, besitzVon: (fid) => (liveAn() ? LIVE.besitz[fid] : null), spielerName,
    besitzTauschen(alt, neu) { const i = SETUP.gruppe.indexOf(alt); if (i >= 0) SETUP.gruppe[i] = neu; if (LIVE.besitz[alt]) { LIVE.besitz[neu] = LIVE.besitz[alt]; delete LIVE.besitz[alt]; } if (LIVE.frueher[alt]) { LIVE.frueher[neu] = LIVE.frueher[alt]; delete LIVE.frueher[alt]; } setupMerken(); },
    auto() { if (st && !st.ende && R.aktiv(st).seite === "spieler") { R.autoZug(st); wahl = null; render(); veroeffentlichen(); gegnerSchleife(); } } };
})();
