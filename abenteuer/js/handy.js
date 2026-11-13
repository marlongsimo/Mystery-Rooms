/*
 * Case Unlocked · Abenteuer – Charakterbogen auf dem Handy
 * Liest nur den öffentlichen Stand „spiel“, den der Spieltisch schreibt (und nur, wenn der Host ihn
 * geschrieben hat). Schreibt nur eigene Einträge: „wahl:<ich>“ und „zug:<ich>“. Gewürfelt und
 * geprüft wird ausschließlich am Tisch.
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
  const params = new URLSearchParams(location.search);
  const SLUG = params.get("liveslug") || "abenteuer";
  const NAME_KEY = "ab_name", FIGUR_KEY = "ab_meine_figur", KCODE_KEY = "ab_kampagnen_code";
  // Kampagnen-Code aus dem Einladungs-Link (?k=…): macht dieses Handy zum Mitspieler der Kampagne und
  // findet den Raum des Spieltischs von selbst – auch wenn der Tisch pausiert oder das Gerät wechselt.
  const kAusLink = (new URLSearchParams(location.search).get("k") || "").trim();
  // Mitspieler einer Kampagne (z. B. angenommene Einladung): ?kampagne=<id> – Beitritt mit dem Benutzernamen, ohne Code
  const kId = (new URLSearchParams(location.search).get("kampagne") || "").trim();
  if (kAusLink) { try { localStorage.setItem(KCODE_KEY, kAusLink); } catch (e) { /* privat */ } }
  // Ein früher gespeicherter Code gilt nur zum Wiederverbinden einer Runde, die über ihn begonnen hat
  const kCode = () => { if (kAusLink) return kAusLink; if (!H.kAktiv) return ""; try { return localStorage.getItem(KCODE_KEY) || ""; } catch (e) { return ""; } };
  const ATTR = { STR: "Stärke", GES: "Geschicklichkeit", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const SELBST = new Set(["selbstheilung", "trank", "raserei", "finte", "gift", "verstecken", "rueckzug", "spurt", "schattenschritt", "spiegelbilder", "segen", "schutzkreis", "vertreiben", "bewahren", "massenheil", "rauch", "tatendrang", "siegel", "ziel"]);
  const H = { client: null, row: null, spiel: null, tab: "zug", sel: null, ziel: null, warte: null, fehler: "", busy: false, warDran: false, ergebnis: null, wahlOffen: null, nLog: 0 };
  const ich = () => H.client && H.client.user && H.client.user.id;
  const meineFid = () => { const s = H.spiel; if (!s || !s.besitz) return null; return Object.keys(s.besitz).find((f) => s.besitz[f] === ich()) || null; };
  const figDaten = (fid) => (H.spiel && H.spiel.figuren ? H.spiel.figuren.find((f) => f.fid === fid && f.art !== "wolf") : null);
  const figId = (id) => (H.spiel && H.spiel.figuren ? H.spiel.figuren.find((f) => f.id === id) : null);
  const vorz = (n) => (n >= 0 ? "+" + n : String(n));

  function toast(text) {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("an"); clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("an"), 4000);
  }

  /* ---------- Verbindung ---------- */
  function client() {
    if (H.client) return H.client;
    if (!window.RPGNetz) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar.");
    const c = H.client = window.RPGNetz.connect({ gameSlug: SLUG, maxPlayers: 7, storeKey: "ab_handy:" + SLUG });
    c.on("state", (row) => { if (row.state_key === "spiel") { H.row = row; pruefe(); } });
    c.on("players", pruefe);
    c.on("lost", (why) => {
      const pause = H.spiel && H.spiel.phase === "pause"; H.spiel = null; H.row = null;
      if ((kCode() || kId) && H.kName) { toast(pause ? "Der Spieltisch hat pausiert. Du wirst automatisch wieder verbunden, sobald es weitergeht." : "Verbindung zum Spieltisch beendet – warte auf den Tisch …"); kampagneWarten(H.kName, c.session && c.session.room_code); }
      else toast(pause ? "Der Spieltisch hat die Runde pausiert. Zum Weiterspielen mit dem neuen Code beitreten." : why || "Verbindung beendet.");
      render();
    });
    return c;
  }
  /** Stand nur übernehmen, wenn ihn der Spieltisch (Host) geschrieben hat */
  function pruefe() {
    const c = H.client; if (!c || !c.session || !H.row) { render(); return; }
    const host = c.players.find((p) => p.is_host);
    if (!host || H.row.updated_by !== host.user_id) { render(); return; }
    const alt = H.spiel; H.spiel = H.row.state || null;
    const s = H.spiel || {};
    const an = (s.antworten && s.antworten[ich()]) || s.antwort;
    if (H.warte && an && an.uid === ich() && an.n === H.warte.n) {
      if (an.ok) { H.fehler = ""; H.sel = null; H.ziel = null; } else H.fehler = an.fehler || "Das ging nicht.";
      H.warte = null;
    }
    const fid = meineFid(), fd = fid && figDaten(fid);
    if (fid) { try { localStorage.setItem(FIGUR_KEY, fid); } catch (e) { /* privat */ } }
    if (fd && s.log && s.nLog > H.nLog) {
      const neu = s.log.slice(Math.max(0, s.log.length - (s.nLog - H.nLog)));
      const mein = neu.filter((l) => l.t.indexOf(fd.name + ":") === 0).pop();
      if (mein) H.ergebnis = mein;
    }
    if (s.nLog) H.nLog = s.nLog;
    if (s.phase !== "kampf" || (alt && alt.phase !== "kampf")) H.ergebnis = null;
    const dran = Boolean((fd && s.phase === "kampf" && !s.ende && s.aktiv === fd.id && fd.tp > 0) || (fid && szeneWartet(s, fid)));
    if (dran && !H.warDran) { try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { /* egal */ } H.tab = "zug"; }
    if (!dran) { H.sel = null; H.ziel = null; }
    H.warDran = dran;
    if (H.wahlOffen && s.besitz && s.besitz[H.wahlOffen]) H.wahlOffen = null;
    if (fid) H.fokus = null;
    render();
  }

  /** Mit Kampagnen-Code: Mitspieler werden und auf den Raum des Spieltischs warten (alle 4 Sekunden nachsehen) */
  async function kampagneWarten(name, alterRaum) {
    H.kName = name; clearTimeout(H.kTimer);
    try {
      const r = kId ? { raum: await client().rpc("rpg_campaign_room", { p_campaign_id: kId }), titel: H.kTitel } : await client().rpc("rpg_join_as_guest", { p_token: kCode(), p_name: name });
      H.kTitel = r.titel;
      if (r.raum && r.raum !== alterRaum && !(H.client && H.client.session)) { H.wartet = false; await client().join(r.raum, name); wach(); render(); return; }
    } catch (e) {
      if (/abgelaufen|ungültig|beendet|gehörst nicht/.test(e.message || "")) { try { localStorage.removeItem(KCODE_KEY); } catch (x) { /* privat */ } H.wartet = false; H.fehler = e.message; render(); return; }
    }
    H.wartet = true; render();
    H.kTimer = setTimeout(() => { if (!(H.client && H.client.session)) kampagneWarten(name, alterRaum); }, 4000);
  }
  async function beitreten(code, name) {
    H.busy = true; H.fehler = ""; render();
    try {
      try { localStorage.setItem(NAME_KEY, name); } catch (e) { /* privat */ }
      if (kId && !code) { H.busy = false; H.kAktiv = true; kampagneWarten(name); return; }
      if (kCode()) {
        H.kName = name; H.kAktiv = true;
        const r = await client().rpc("rpg_join_as_guest", { p_token: kCode(), p_name: name });
        H.kTitel = r.titel; code = code || r.raum;
        if (!code) { H.busy = false; kampagneWarten(name); return; }
      }
      await client().join(code, name);
      wach();
    } catch (e) {
      H.fehler = /nicht verfügbar|game_catalog|unbekannt/i.test(e.message || "") ? "Das Spielen mit Handys ist noch nicht freigeschaltet." : (e.message || String(e));
    }
    H.busy = false; render();
  }
  async function senden(wunsch) {
    if (H.warte) return;
    const n = Date.now();
    H.warte = { n, t: n }; H.fehler = ""; render();
    try { await H.client.writeOwn("zug:" + ich(), Object.assign({ n }, wunsch)); }
    catch (e) { H.warte = null; H.fehler = e.message || String(e); render(); return; }
    setTimeout(() => { if (H.warte && H.warte.n === n) { H.warte = null; H.fehler = "Der Tisch hat nicht geantwortet. Bitte noch einmal versuchen."; render(); } }, 9000);
  }
  async function waehle(fid) {
    H.wahlOffen = fid || null; render();
    try { await H.client.writeOwn("wahl:" + ich(), { fid: fid || null, at: Date.now() }); }
    catch (e) { H.wahlOffen = null; H.fehler = e.message; render(); }
    setTimeout(() => { if (H.wahlOffen === fid) { H.wahlOffen = null; render(); } }, 8000);
  }

  let sperre = null;
  async function wach() { try { if (navigator.wakeLock && !document.hidden && (!sperre || sperre.released)) sperre = await navigator.wakeLock.request("screen"); } catch (e) { /* nicht unterstützt */ } }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && H.client && H.client.session) wach(); });

  /* ---------- Ansichten ---------- */
  /* ---------- Heldensammlung (Open Beta) ---------- */
  const SM = window.ABSAMMLUNG;
  if (SM) { SM.netzSetzen(() => client()); SM.beiAenderung(() => { if (H.spiel && !meineFid()) render(); }); }
  /** Helden, die ich (mein Konto bzw. das Starter-Set) wählen darf. Was der Tisch schon stellt, darf übernommen werden. */
  const darf = (fid, gruppe) => !SM || SM.frei(fid) || (gruppe || []).includes(fid);
  /** Kampagne erreicht ein Ende: Belohnung für mein Konto (die Datenbank prüft, ob es zählt) */
  const endeGemeldet = new Set();
  function endeErreicht(s, fid) {
    const ab = s && s.abenteuer;
    if (!SM || !fid || !s.kampagne || !ab || ab.art !== "ende" || endeGemeldet.has(s.kampagne)) return;
    endeGemeldet.add(s.kampagne);
    setTimeout(() => SM.endeMelden(s.kampagne, { versuche: 8 }).catch(() => {}), 4000); // erst die Endszene lesen lassen
  }
  function render() {
    const app = $("#app"), c = H.client, drin = Boolean(c && c.session);
    $("#verlassen").hidden = !drin;
    if (!drin) return viewBeitritt(app);
    if (!H.spiel) { app.innerHTML = `<section class="karte-h"><p class="eyebrow">Verbunden · ${esc(c.session.room_code)}</p><h1>Einen Moment …</h1><p class="note">Der Spieltisch schickt gleich die Figuren.</p></section>`; return; }
    if (H.spiel.phase === "pause") { app.innerHTML = `<section class="karte-h"><p class="eyebrow">Verbunden · ${esc(c.session.room_code)}</p><h1>Pause</h1><p class="note">Der Spieltisch hat die Runde pausiert und gespeichert. Wenn sie fortgesetzt wird, zeigt der Tisch einen neuen Code – damit trittst du wieder bei.</p></section>`; return; }
    const fid = meineFid();
    endeErreicht(H.spiel, fid);
    if (!fid) return viewWahl(app);
    viewBogen(app, fid);
  }

  // Neuer Code im Link (z. B. QR-Code einer fortgesetzten Kampagne), während die Seite offen ist: ins Codefeld übernehmen
  window.addEventListener("hashchange", () => { if (H.client && H.client.session) return; const i = document.querySelector("#code"); if (i) { i.value = decodeURIComponent(location.hash.slice(1) || ""); H.fehler = ""; const fb = document.querySelector("#fb"); if (fb) fb.textContent = ""; } });
  function viewBeitritt(app) {
    const code = decodeURIComponent(location.hash.slice(1) || "");
    let name = ""; try { name = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ }
    if (H.wartet) { app.innerHTML = `<section class="karte-h"><p class="eyebrow">Kampagne${H.kTitel ? " · " + esc(H.kTitel) : ""}</p><h1>Warte auf den Spieltisch …</h1><p class="note">Du bist dabei. Sobald der Spieltisch verbunden ist, geht es hier von selbst weiter – du kannst diese Seite einfach offen lassen.</p><p class="warte-punkte" aria-hidden="true"><i></i><i></i><i></i></p></section>`; return; }
    const a = document.activeElement; if (a && a.tagName === "INPUT" && app.contains(a)) { const fb = $("#fb"); if (fb) fb.textContent = H.fehler; return; }
    const k = kCode() || kId;
    app.innerHTML = `<section class="karte-h"><p class="eyebrow">${k ? "Einladung zur Kampagne" : "Die Splitterlande"}</p><h1>${k ? "Mitspielen" : "Zum Spieltisch"}</h1>
      <p class="note">${k ? "Gib deinen Namen ein. Wenn der Spieltisch schon bereit ist, geht es sofort los – sonst wartest du kurz." : "Den Code zeigt der Spieltisch (das Tablet in der Mitte)."}</p>
      <label class="fld"${k && !code ? " hidden" : ""}>Code<input id="code" autocomplete="off" autocapitalize="characters" placeholder="ABEN-XXXXXX" value="${esc(code)}"></label>
      <label class="fld">Dein Name<input id="name" maxlength="24" autocomplete="off" value="${esc(name)}"></label>
      <button class="btn breit" id="rein" ${H.busy ? "disabled" : ""}>${H.busy ? "Verbinde …" : "Beitreten"}</button>
      <p class="fb" id="fb">${esc(H.fehler)}</p></section>`;
    $("#rein").onclick = () => {
      const cd = $("#code").value.trim(), nm = $("#name").value.trim();
      if (!nm || (!cd && !kCode() && !kId)) { H.fehler = kCode() || kId ? "Bitte deinen Namen eingeben." : "Bitte Code und Namen eingeben."; $("#fb").textContent = H.fehler; return; }
      document.activeElement && document.activeElement.blur();
      beitreten(cd, nm);
    };
  }

  function viewWahl(app) {
    const s = H.spiel, gruppe = s.gruppe || [], laeuft = s.phase === "kampf" || s.phase === "szene", HL = window.ABH_HELDEN;
    let zuletzt = null; try { zuletzt = localStorage.getItem(FIGUR_KEY); } catch (e) { /* privat */ }
    const liste = laeuft ? gruppe : F.REIHE;
    const voll = !laeuft && gruppe.length >= 6, istVoll = (fid) => voll && !gruppe.includes(fid);
    if (SM && !laeuft) SM.laden();
    const zu = (fid) => !laeuft && !darf(fid, gruppe) && !(s.besitz && s.besitz[fid]);
    const status = (fid) => { const uid = s.besitz && s.besitz[fid]; return H.wahlOffen === fid ? "…" : uid ? "📱 " + ((s.namen || {})[uid] || "vergeben") : gruppe.includes(fid) ? "🎲 Tisch – übernehmbar" : laeuft ? "wartet auf jemanden" : zu(fid) ? "gesperrt" : voll ? "Gruppe voll" : zuletzt === fid ? "zuletzt gespielt" : ""; };
    const kopf = `<p class="eyebrow">Verbunden · ${esc(H.client.session.room_code)}${s.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</p>`;
    const plaetzeHtml = gruppe.length ? HL.plaetze(gruppe, Object.fromEntries(Object.entries(s.besitz || {}).map(([f, u]) => [f, (s.namen || {})[u] || ""]))) : "";
    if (!laeuft) {
      // Schritt 1: Klasse wählen · Schritt 2: die drei Helden der Klasse mit Vorstellung
      if (!H.klasse) {
        app.innerHTML = `<section class="karte-h">${kopf}<h1>Wähle deine Klasse</h1><p class="note">Schritt 1 von 2. In jeder Klasse stellen sich dir drei Helden vor. Jede Person spielt eine Figur. Zusammen mit den Helden, die der Tisch steuert, sind es mindestens 3.</p>
          ${plaetzeHtml}${HL.klassenWahl({ gruppe, frei: SM && SM.aktiv() ? (f) => darf(f, gruppe) : null })}<p class="fb">${esc(H.fehler)}</p></section>`;
        app.querySelectorAll("[data-klasse]").forEach((b) => { b.onclick = () => { H.klasse = b.dataset.klasse; H.fokus = null; render(); window.scrollTo(0, 0); }; });
        return;
      }
      const helden = HL.vonKlasse(H.klasse);
      if (!H.fokus || !helden.includes(H.fokus)) H.fokus = helden.find((f) => zuletzt === f && !zu(f)) || helden.find((f) => !zu(f)) || helden[0];
      const fid = H.fokus, uid = s.besitz && s.besitz[fid], frei = !uid && !istVoll(fid) && !H.wahlOffen && !zu(fid);
      const knopf = zu(fid) ? `<div class="sm-gesperrt">${SM.SCHLOSS}<span><b>Gesperrt.</b> ${esc(SM.gesperrtText())}</span></div>`
        : `<button class="btn gross held-knopf" id="f-spielen" ${frei ? "" : "disabled"}>${H.wahlOffen === fid ? "…" : uid ? "Schon vergeben" : istVoll(fid) ? "Die Gruppe ist voll" : `Ich spiele ${esc(F.FIGUREN[fid].name)}`}</button>`;
      app.innerHTML = `<section class="karte-h">${kopf}${HL.klassenLeiste(H.klasse)}${HL.klassenKopf(H.klasse)}
        <div class="fkarten handy-karten">${helden.map((f) => HL.kachel(f, { an: gruppe.includes(f), fokus: f === fid, gesperrt: zu(f), status: status(f), statusArt: s.besitz && s.besitz[f] ? "" : "tisch" })).join("")}</div>
        ${HL.detail(fid, s.stufe || 1, knopf)}<p class="fb">${esc(H.fehler)}</p></section>`;
      app.querySelectorAll("[data-klasse]").forEach((b) => { b.onclick = () => { H.klasse = b.dataset.klasse; H.fokus = null; render(); }; });
      $("#klassen-zurueck").onclick = () => { H.klasse = null; H.fokus = null; render(); window.scrollTo(0, 0); };
      app.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => { H.fokus = b.dataset.fid; render(); }; });
      const fs = $("#f-spielen"); if (fs) fs.onclick = () => { if (!zu(fid)) waehle(fid); };
      return;
    }
    if (H.fokus && liste.includes(H.fokus)) {
      const fid = H.fokus, uid = s.besitz && s.besitz[fid], frei = !uid && !istVoll(fid) && !H.wahlOffen;
      const knopf = `<button class="btn gross held-knopf" id="f-spielen" ${frei ? "" : "disabled"}>${H.wahlOffen === fid ? "…" : uid ? "Schon vergeben" : istVoll(fid) ? "Die Gruppe ist voll" : `Ich spiele ${esc(F.FIGUREN[fid].name)}`}</button>`;
      app.innerHTML = `<section class="karte-h">${kopf}<button class="btn ghost klein held-zurueck" id="f-zurueck">← Alle Helden</button>${HL.detail(fid, (s.abenteuer && s.abenteuer.stufe) || s.stufe || 1, knopf)}<p class="fb">${esc(H.fehler)}</p></section>`;
      $("#f-zurueck").onclick = () => { H.fokus = null; render(); };
      $("#f-spielen").onclick = () => waehle(fid);
      return;
    }
    app.innerHTML = `<section class="karte-h">${kopf}<h1>Wähle deinen Helden</h1>
      ${laeuft ? `<p class="note">Das Abenteuer läuft schon. Du kannst eine Figur übernehmen, deren Handy die Runde verlassen hat.</p>` : `<p class="note">Tippe einen Helden an, um ihn kennenzulernen. Jede Person spielt eine Figur. Zusammen mit den Helden, die der Tisch steuert, sind es mindestens 3.</p>`}
      ${gruppe.length ? HL.plaetze(gruppe, Object.fromEntries(Object.entries(s.besitz || {}).map(([f, u]) => [f, (s.namen || {})[u] || ""]))) : ""}
      <div class="fkarten handy-karten">${liste.map((fid) => HL.kachel(fid, { an: gruppe.includes(fid), status: status(fid), statusArt: s.besitz && s.besitz[fid] ? "" : "tisch" })).join("")}</div>
      <p class="fb">${esc(H.fehler)}</p></section>`;
    app.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => { H.fokus = b.dataset.fid; render(); window.scrollTo(0, 0); }; });
  }

  /* ---------- Kampf im Prototyp-Stil: Zug-Kasten, Aktionskarten, Zielwahl, Initiative ---------- */
  const SYM = {
    schwert: '<path d="M19 4 9.5 13.5M15 4h4v4M7 11.5l5.5 5.5M8.5 15.5 4.5 19.5"/>',
    bogen: '<path d="M5 19C5 9 9 5 19 5"/><path d="M5 19 19 5"/><path d="M15 5h4v4"/>',
    feuer: '<path d="M12 21c-4 0-6.5-2.7-6.5-6 0-4 4-6 4-10.5 3 2 5.5 5 5.5 8.5 1-.7 1.8-1.8 2-3.5 1.6 1.7 2.5 3.6 2.5 5.5 0 3.3-3 6-7.5 6z"/>',
    heil: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
    trank: '<path d="M9 3h6M10 3v5l-4 7a5 5 0 0 0 4.5 6h3A5 5 0 0 0 18 15l-4-7V3"/><path d="M8 15h8"/>',
    schild: '<path d="M12 3l8 3v6c0 5-3.6 8-8 9-4.4-1-8-4-8-9V6z"/>',
    schatten: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    mal: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    blitz: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  };
  function symVon(a) {
    const art = a.art || "";
    if (art === "trank") return ["trank", "heil"];
    if (/heil|aufrichten|segen|bewahren/.test(art)) return ["heil", "heil"];
    if (art === "angriff") return a.bogen || a.fern ? ["bogen", ""] : ["schwert", ""];
    if (/flaeche|geschoss|rettungswurf|albtraum|bann/.test(art) || a.rettung) return ["feuer", "feuer"];
    if (/schild|schutzkreis|spiegelbilder|vertreiben|siegel/.test(art)) return ["schild", "eis"];
    if (/verstecken|rauch|schattenschritt|rueckzug|finte|gift/.test(art)) return ["schatten", "schatten"];
    if (/mal|kontrolle|analyse|spott|entwaffnen/.test(art)) return ["mal", ""];
    return ["blitz", ""];
  }
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${SYM[k] || SYM.blitz}</svg>`;
  /** Bild einer Figur für Zielwahl und Initiative: Held als Porträt, Gegner als gezeichnetes Symbol */
  function bildVon(f) {
    if (!f) return `<span class="hz-bild"></span>`;
    if (f.seite === "gegner") return B.gegnerBild(f.art) ? `<span class="hz-bild feind" style="background-image:url('${B.gegnerBild(f.art)}');background-position:center 15%"></span>` : `<span class="hz-bild feind"><svg viewBox="-26 -26 52 52">${B.gegner(f.art)}</svg></span>`;
    if (f.art === "begleiter" && B.begleiter) return `<span class="hz-bild"><svg viewBox="-26 -26 52 52">${B.begleiter(false)}</svg></span>`;
    return f.fid ? `<span class="hz-bild" style="background-image:url('${F.bild(f.fid)}')"></span>` : `<span class="hz-bild"></span>`;
  }
  function dranBox(s, d) {
    const z = s.zug || {}, st = (an, rest, t, u) => `<span class="${an ? "" : "weg"}">${t}<small>${u}</small></span>`;
    return `<section class="hz-dran" style="--d:-${((Date.now() % 4000) / 1000).toFixed(2)}s"><small>DEIN ZUG · RUNDE ${s.runde || 1}</small><h2>Du bist dran!</h2>
      <div class="schritte">${st(z.bewegung > 0, z.bewegung, "Bewegen", z.bewegung > 0 ? `noch ${z.bewegung} · am Tisch${z.schritt ? " · Schatten " + z.schritt : ""}` : "erledigt")}${st(z.aktion, 0, "Aktion", z.aktion ? "bereit" : "genutzt")}${st(z.bonus, 0, "Bonus", z.bonus ? "bereit" : "genutzt")}</div>
      <p class="hz-tipp">Zielfeld am Tisch antippen, dann hier eine Karte wählen.</p></section>`;
  }
  function ring(chance, seite) {
    if (seite === "spieler") return "";
    const m = /(\d+)\s*%/.exec(chance || ""), p = m ? +m[1] : /sicher/.test(chance || "") ? 100 : null;
    if (p == null) return chance ? `<span class="hz-chance text"><small>${esc(chance)}</small></span>` : "";
    const u = 2 * Math.PI * 24, farbe = p >= 65 ? "#7fe07a" : p >= 40 ? "#f6dc9c" : "#ff8a6a";
    return `<span class="hz-chance"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" stroke="rgba(255,255,255,.1)" stroke-width="5" fill="none"/><circle cx="29" cy="29" r="24" stroke="${farbe}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="${(u * p / 100).toFixed(1)} ${u.toFixed(1)}"/></svg><b>${p}%</b>${/Vorteil/.test(chance) ? "<small>VORTEIL</small>" : /Nachteil/.test(chance) ? "<small>NACHTEIL</small>" : ""}</span>`;
  }
  function initiative(s, fd) {
    const reihe = (s.reihe || []).map(figId).filter((f) => f && !f.tot && (f.seite !== "gegner" || f.tp > 0));
    if (reihe.length < 2) return "";
    const am = Math.max(0, reihe.findIndex((f) => f.id === s.aktiv)), folge = reihe.slice(am).concat(reihe.slice(0, am));
    return `<div class="hz-ini" aria-label="Zugreihenfolge">${folge.map((f) => `<span class="${f.seite === "gegner" ? "feind" : ""} ${f.id === s.aktiv ? "dran" : ""} ${f.id === fd.id ? "ich" : ""} ${f.tp <= 0 ? "liegt" : ""}" title="${esc(f.name)}">${bildVon(f)}</span>`).join("")}</div>`;
  }

  function viewBogen(app, fid) {
    const s = H.spiel, d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse], fd = figDaten(fid), ab = s.abenteuer, az = ab && ab.zust && ab.zust[fid];
    const stufe = (fd && fd.stufe) || (ab && ab.stufe) || s.stufe || 1;
    const tpMax = fd ? fd.tpMax : F.tpVon(fid, stufe), tp = fd ? fd.tp : az ? az.tp : tpMax, rk = fd ? fd.rk : d.rk[stufe - 1];
    const plMax = fd && fd.plaetzeMax ? fd.plaetzeMax : k.plaetze ? F.PLAETZE[stufe] : [0, 0], pl = fd && fd.plaetze ? fd.plaetze : az ? az.plaetze : plMax;
    const dran = Boolean(fd && s.phase === "kampf" && !s.ende && s.aktiv === fd.id && fd.tp > 0);
    const meinName = (s.namen || {})[ich()] || "";
    const zust = fd ? fd.zustaende || [] : [];
    const traenke = ((fd ? fd.rucksack : az ? az.rucksack : []) || []).filter((x) => /trank/.test(x.id)).reduce((n, x) => n + (x.n || 0), 0);
    const anteil = Math.max(0, Math.min(1, tp / Math.max(1, tpMax)));
    const platzChip = plMax[0] + plMax[1] ? `<span>ZAUBER<b>${pl[0]}${plMax[1] ? "·" + pl[1] : ""}</b></span>` : "";
    let html = `<section class="bogen hz ${dran ? "ist-dran" : ""}" style="--k:${k.farbe}">
      <div class="hz-held"><img class="portraet" src="${F.bild(fid)}" alt="">
        <div class="hz-held-text"><h1>${esc(d.name)}</h1><p class="hz-klasse">${esc(k.name)} · Stufe ${stufe}${meinName ? " · " + esc(meinName) : ""}</p>
          <div class="tpbalken hz-leben ${anteil <= .25 ? "kritisch" : ""}"><i style="width:${anteil * 100}%"></i><span>${tp} / ${tpMax}</span></div>
          <div class="hz-werte"><span>RK<b>${rk}</b></span><span>TEMPO<b>${dran ? s.zug.bewegung : (k.bewegung || 6)}</b></span>${platzChip || `<span>TRÄNKE<b>${traenke}</b></span>`}</div>
        </div>
      </div>
      <p class="spruch hz-spruch">„${esc(d.spruch)}“</p>
      ${fd && fd.tot ? `<div class="info schlecht">${esc(d.name)} ist tot.</div>` : fd && fd.tp <= 0 && s.schwierigkeit === "hardcore" ? `<div class="info schlecht">Todeswürfe: ${"✓".repeat(fd.todes.e)}${"·".repeat(3 - fd.todes.e)} | ${"✗".repeat(fd.todes.f)}${"·".repeat(Math.max(0, 3 - fd.todes.f))}${fd.stabil ? " · stabil" : ""}</div>` : ""}
      ${zust.length ? `<p class="zustaende">${zust.map((z) => `<span>${esc(z)}</span>`).join("")}</p>` : ""}
      ${dran && H.tab === "zug" ? dranBox(s, d) : ""}
      <nav class="tabs hz-reiter">${[["zug", s.phase === "szene" ? "Szene" : "Aktionen"], ["faehig", "Fähigkeiten"], ["rucksack", "Inventar"]].map(([id, t]) => `<button data-tab="${id}" class="${H.tab === id ? "an" : ""}">${t}${id === "zug" && (dran || szeneWartet(s, fid)) ? " ●" : ""}</button>`).join("")}</nav>
      <div class="tabinhalt">`;
    if (H.tab === "faehig") html += tabFaehig(fid, stufe);
    else if (H.tab === "rucksack") html += tabRucksack(fd ? fd.rucksack : az ? az.rucksack : [{ id: "heiltrank", n: 1 }], fid);
    else if (s.phase === "szene" && ab) html += tabSzene(ab, fid);
    else html += tabZug(s, fid, fd, dran, stufe);
    html += `</div>${s.phase === "kampf" && !s.ende && fd ? initiative(s, fd) : ""}${dran && H.tab === "zug" ? `<div class="hz-ende"><button class="btn breit" id="zugende" ${H.warte ? "disabled" : ""}>Zug beenden</button></div>` : ""}</section>`;
    app.innerHTML = html;
    const we = app.querySelector(".wuerfel-erg");
    if (we && window.ABW) { const key = we.dataset.erg; window.ABW.rollen(we, +we.dataset.w, key.replace(/^[^:]+: /, ""), { titel: /verfehlt|widersteht/.test(key) ? "Daneben" : "Getroffen!", gut: !/verfehlt|widersteht/.test(key), sofort: H.letzterWurf === key }); H.letzterWurf = key; }
    app.querySelectorAll("[data-tab]").forEach((b) => { b.onclick = () => { H.tab = b.dataset.tab; render(); }; });
    app.querySelectorAll("[data-opt]").forEach((b) => { b.onclick = () => { H.sel = H.sel === b.dataset.opt ? null : b.dataset.opt; H.ziel = null; H.fehler = ""; render(); const z = document.querySelector(".hz-ziele"); if (z && z.scrollIntoView) z.scrollIntoView({ block: "nearest" }); }; });
    app.querySelectorAll("[data-ziel]").forEach((b) => { b.onclick = () => { H.ziel = b.dataset.ziel; render(); }; });
    const w = $("#wuerfeln"); if (w) w.onclick = () => senden({ typ: "aktion", aktion: H.sel, ziel: H.ziel || (fd && fd.id) });
    const e = $("#zugende"); if (e) e.onclick = () => senden({ typ: "ende" });
    const a = $("#andere"); if (a) a.onclick = () => waehle(null);
    if (ab && ab.ersatz) app.querySelectorAll(".tabinhalt [data-fid]").forEach((b) => { b.onclick = () => senden({ typ: "ersatz", fid: b.dataset.fid }); });
    app.querySelectorAll("[data-stimme]").forEach((b) => { b.onclick = () => { H.meineStimme = { szene: ab.szene, opt: b.dataset.stimme }; senden({ typ: "stimme", opt: b.dataset.stimme }); }; });
    app.querySelectorAll("[data-gantwort]").forEach((b) => { b.onclick = () => { H.meinGeheim = { szene: ab.szene, antwort: b.dataset.gantwort }; senden({ typ: "geheim", antwort: b.dataset.gantwort }); }; });
    const pw = $("#probe-wer"); if (pw) pw.onclick = () => senden({ typ: "probe_wer" });
    const pr = $("#probe-wurf"); if (pr) pr.onclick = () => senden({ typ: "probe_wurf" });
  }

  function aktionInfo(a, d, stufe) {
    const typ = { aktion: "Aktion", bonus: "Bonusaktion", reaktion: "Reaktion", passiv: "passiv", frei: "frei" }[a.typ] || "Aktion";
    const teile = [typ];
    if (a.reichweite) teile.push(a.reichweite === 1 ? "Nahkampf" : `${a.reichweite} Felder`);
    if (a.art === "angriff") teile.push(`Angriff ${vorz(R.mod(d.werte[a.attr]) + 2 + (a.bogen && d === F.FIGUREN.wildnislaeufer ? 1 : 0))}`);
    if (a.rettung && a.attr) teile.push(`${a.rettung}-Rettung SG ${8 + 2 + R.mod(d.werte[a.attr])}`);
    if (a.schaden) teile.push(`${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""}${a.art === "angriff" && !a.ohneMod ? " + " + R.mod(d.werte[a.attr]) : a.plusAttr ? " + " + R.mod(d.werte[a.attr]) : a.plus ? " + " + a.plus : ""}`);
    if (a.heilung) teile.push(`heilt ${a.heilung}`);
    if (a.platz) teile.push(a.platz === 2 ? "Platz vom 2. Grad" : "1 Zauberplatz");
    if (a.pro) { const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange, n = Array.isArray(v) ? v[stufe - 1] : v; teile.push(`${n}× je ${a.pro.kampf != null ? "Kampf" : a.pro.rast != null ? "Rast" : "lange Rast"}`); }
    return teile.join(" · ");
  }

  /** Muss ich in der Szene gerade etwas tun? */
  function szeneWartet(s, fid) {
    const ab = s.abenteuer; if (s.phase !== "szene" || !ab) return false;
    if (ab.art === "wahl") return !(ab.stimmen || []).includes(fid);
    if (ab.art === "geheim") return !(ab.geheimFrage.fertig || []).includes(fid);
    if (ab.ersatz && ab.ersatz.offen.includes(fid)) return true;
    if (ab.raetsel) return true;
    if (ab.probe && !ab.probe.ergebnis) return ab.probe.gruppe ? !ab.probe.wuerfe[fid] : !ab.probe.wer || (ab.probe.wer === fid && !ab.probe.wuerfe[fid]);
    return false;
  }
  function tabSzene(ab, fid) {
    const fett = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
    let h = `<div class="handy-szene"><p class="eyebrow">Abschnitt ${ab.abschnitt} · ${esc(ab.ort)} · ${esc((ab.uhr || {}).name || "Glocke")} ${ab.glocke}/7</p><h2>${esc(ab.titel)}</h2>`;
    const tot = ab.zust && ab.zust[fid] && ab.zust[fid].tot;
    if (ab.beute) return h + `<div class="info dran"><b>Beute!</b> Am Tisch entscheidet ihr gemeinsam, wer welchen Gegenstand bekommt:</div><ul class="faehig">${ab.beute.dinge.map((g) => `<li><b>${g.sym} ${esc(g.name)}</b><p>${esc(g.text)}</p></li>`).join("")}</ul></div>`;
    if (ab.aufstieg && ab.aufstieg.helden[fid]) { const a = ab.aufstieg.helden[fid]; h += `<div class="info dran"><b>Stufe ${ab.aufstieg.auf}!</b> ❤ ${a.tp[0]} → ${a.tp[1]} Trefferpunkte${a.neu.length ? "<br>Neu: " + a.neu.map((n) => esc(n.name)).join(", ") + " – siehe Fähigkeiten" : ""}</div>`; }
    if (tot && ab.ersatz && ab.ersatz.offen.includes(fid)) return h + `<div class="info dran"><b>${esc(F.FIGUREN[fid].name)} ist gefallen.</b> Am Lagerfeuer stößt jemand Neues zur Gruppe. Wen spielst du jetzt?</div><div class="fkarten handy-karten">${ab.ersatz.frei.map((neu) => window.ABH_HELDEN.kachel(neu, {})).join("")}</div></div>`;
    if (tot) return h + `<div class="info schlecht">${esc(F.FIGUREN[fid].name)} ist gefallen. Am nächsten Lagerfeuer kannst du eine neue Figur übernehmen.</div></div>`;
    if (ab.art === "wahl") {
      const schon = (ab.stimmen || []).includes(fid), meine = H.meineStimme && H.meineStimme.szene === ab.szene ? H.meineStimme.opt : null;
      h += `<div class="info dran"><b>Abstimmung.</b> Die anderen sehen nicht, wofür du stimmst.</div><div class="optionen">${ab.optionen.map((o) => `<button class="opt ${meine === o.id ? "gewaehlt" : ""}" data-stimme="${o.id}" ${H.warte ? "disabled" : ""}><b>${esc(o.text)}</b></button>`).join("")}</div>`;
      if (schon) h += `<p class="note">Deine Stimme ist abgegeben${meine ? ` (${esc((ab.optionen.find((o) => o.id === meine) || {}).text || "")})` : ""}. Du kannst sie noch ändern, bis alle abgestimmt haben.</p>`;
    } else if (ab.art === "geheim") {
      const q = (ab.geheimFrage.proFigur && ab.geheimFrage.proFigur[fid]) || ab.geheimFrage, meins = H.meinGeheim && H.meinGeheim.szene === ab.szene ? H.meinGeheim.antwort : null;
      h += `<div class="info dran"><b>${esc(q.frage)}</b><br><small>Nur du siehst deine Antwort.</small></div><div class="optionen">${q.antworten.map((a) => `<button class="opt ${meins === a.id ? "gewaehlt" : ""}" data-gantwort="${a.id}" ${H.warte ? "disabled" : ""}><b>${esc(a.text)}</b></button>`).join("")}</div>`;
    } else if (ab.raetsel) {
      const meine = (ab.raetsel.hinweise || {})[fid] || [];
      h += `<div class="info dran"><b>Dein Hinweis (${esc(ab.raetsel.hinweisName || "Grabplatte")}).</b> Lies ihn den anderen vor. Am Tisch wird die Reihenfolge angetippt.</div>${meine.map((t) => `<blockquote class="platte">${fett(t)}</blockquote>`).join("")}<p class="note">Angeschlagen: ${ab.raetsel.folge.length} von ${ab.raetsel.laenge}</p>`;
    } else if (ab.probe) {
      const p = ab.probe, b = p.boni[fid];
      h += `<div class="info"><b>${esc(p.name)}</b> gegen SG ${p.sg}${p.gruppe ? " · alle würfeln" : ""}. Dein Bonus: ${b >= 0 ? "+" : ""}${b}</div>`;
      if (p.ergebnis) h += `<div class="ergebnis ${p.ergebnis.stufe === "erfolg" ? "gut" : ""}"><span>${{ erfolg: "Geschafft", knapp: "Knapp daneben", fehl: "Misslungen" }[p.ergebnis.stufe]}${p.ergebnis.text ? ": " + fett(p.ergebnis.text) : ""}</span></div>`;
      else if (p.wuerfe[fid]) h += `<div class="ergebnis"><b>${p.wuerfe[fid].w}</b><span>Dein Wurf: ${p.wuerfe[fid].gesamt}</span></div>`;
      else if (p.gruppe || p.wer === fid) h += `<button class="btn breit wuerfel" id="probe-wurf" ${H.warte ? "disabled" : ""}>🎲 Würfeln</button>`;
      else if (!p.wer) h += `<button class="btn breit" id="probe-wer" ${H.warte ? "disabled" : ""}>Ich versuche es</button>`;
      else h += `<p class="note">${esc(F.FIGUREN[p.wer] ? F.FIGUREN[p.wer].name : "")} versucht es.</p>`;
    } else h += `<div class="info">${{ gespraech: "Gespräch: Am Tisch wird gefragt und gehandelt. Sprecht mit, was ihr wissen wollt.", kampf: "Gleich beginnt ein Kampf. Wenn du dran bist, vibriert dein Handy.", lager: "Lagerfeuer: Alle ruhen, heilen und bekommen ihre Zauberplätze zurück.", ende: "Dieser Abschnitt ist zu Ende." }[ab.art] || "Der Tisch liest vor. Hört zu – oder lest mit:"}</div>`;
    h += `<div class="erzaehlung">${ab.text.map((t) => `<p>${fett(t)}</p>`).join("")}</div>`;
    if (ab.art === "gespraech" && ab.dialog && ab.dialog.length) h += `<div class="dialog">${ab.dialog.map((e) => `<div class="d-frage"><small>Ihr</small><p>${fett(e.frage)}</p></div>${e.antwort ? `<div class="d-antwort ${e.stufe || ""}"><small>${esc(e.probe ? "🎲 " + e.probe : e.wer || "")}</small><p>${fett(e.antwort)}</p></div>` : ""}`).join("")}</div>`;
    else if (ab.antwort) h += `<div class="antwort">${fett(ab.antwort)}</div>`;
    if (H.fehler) h += `<p class="fb">${esc(H.fehler)}</p>`;
    return h + "</div>";
  }

  function tabZug(s, fid, fd, dran, stufe) {
    const d = F.FIGUREN[fid];
    let h = "";
    if (s.phase !== "kampf") h += `<div class="info">Gleich geht's los. Der Tisch stellt die Gruppe zusammen und startet den Kampf.</div><button class="btn ghost breit" id="andere">Andere Figur wählen</button>`;
    else if (s.ende) h += `<div class="info gross">${s.ende === "sieg" ? "Sieg!" : s.ende === "niederlage" ? ({ rabenmoor: "Das Moor behält euch.", hochwacht: "Die letzte Fackel erlischt.", krone: "Das Eis behält euch." }[s.abenteuer && s.abenteuer.abenteuer] || "Grauwacht behält euch.") : "Rückzug. Ihr versucht es noch einmal."}</div>`;
    else if (!fd) h += `<div class="info">Deine Figur ist in diesem Kampf nicht dabei.</div>`;
    else if (fd.tot) h += `<div class="info schlecht">${esc(d.name)} ist gefallen.</div>`;
    else if (fd.tp <= 0) h += `<div class="info schlecht">Du liegst am Boden. ${s.schwierigkeit === "hardcore" ? "Zu Beginn deines Zugs würfelt der Tisch deinen Todeswurf. " : ""}Nur Heilung oder Stabilisieren bringt dich zurück.</div>`;
    else if (!dran) {
      const a = figId(s.aktiv), b = a && a.fid && s.besitz && s.besitz[a.fid];
      h += `<div class="info hz-warte ${a && a.seite === "gegner" ? "feind" : ""}">${bildVon(a)}<span><small>AM ZUG · RUNDE ${s.runde || 1}</small><b>${esc(a ? a.name : "…")}</b>${b && b !== ich() ? `<em>📱 ${esc((s.namen || {})[b] || "")}</em>` : a && a.seite === "spieler" ? "<em>am Tisch</em>" : a && a.seite === "gegner" ? "<em>Gegner handelt …</em>" : ""}</span></div>`;
    } else {
      const offen = (s.optionen || []).map((o) => ({ o, def: R.findeAktion({ fid, stufe, rucksack: fd.rucksack }, o.id) })).filter((x) => x.def);
      h += `<div class="hz-titelzeile"><h3>WAS TUST DU?</h3><span>Tippe eine Karte an</span></div><div class="hz-karten optionen">`;
      let gewaehlt = null;
      for (const { o, def } of offen) {
        const a = def.a, gew = H.sel === o.id, [sym, ton] = symVon(a);
        if (gew) gewaehlt = { o, a };
        const anz = a.art === "trank" && !a.gross ? `×${(fd.rucksack.find((x) => x.id === "heiltrank") || { n: 0 }).n}` : o.rest != null && o.rest !== Infinity ? `${Math.max(0, o.rest)}${(() => { const gz = R.grenze({ stufe }, a); return gz ? `/${gz.n}` : ""; })()}` : "";
        const grund = o.ok ? "" : o.grund === "Kein gültiges Ziel." ? (["trank", "selbstheilung"].includes(a.art) ? "Du bist unverletzt." : SELBST.has(a.art) ? "Gerade nicht möglich." : "Kein Ziel in Reichweite.") : o.grund || "";
        const typ = a.typ === "bonus" ? `<span class="art bonus">BONUS</span>` : a.typ === "reaktion" ? `<span class="art">REAKTION</span>` : `<span class="art">AKTION</span>`;
        h += `<button class="opt hz-karte ${ton} ${gew ? "gewaehlt" : ""} ${o.ok ? "" : "aus"}" data-opt="${o.id}" ${o.ok && !H.warte ? "" : "disabled"}>${typ}<span class="sym">${svg(sym)}</span><b>${esc(o.name || a.name)}</b><small>${esc(aktionInfo(a, d, stufe).replace(/^(Aktion|Bonusaktion|Reaktion)( · |$)/, "") || a.text || "")}</small>${grund ? `<i>${esc(grund)}</i>` : ""}${anz ? `<span class="anz">${esc(anz)}</span>` : ""}</button>`;
      }
      h += `</div>`;
      if (!gewaehlt) H.zieleAuf = null;
      if (gewaehlt) {
        const { o, a } = gewaehlt, selbst = SELBST.has(a.art);
        const neu = H.zieleAuf !== o.id; H.zieleAuf = o.id;
        h += `<section class="hz-ziele ${neu ? "neu" : ""}">${a.text ? `<p class="opt-text">${esc(a.text)}</p>` : ""}`;
        if (!selbst) h += `<h4>ZIEL WÄHLEN</h4><div class="ziele">${o.ziele.map((z) => { const f = figId(z.id), q = z.tpMax ? Math.max(0, z.tp / z.tpMax) : 1; return `<button class="ziel ${z.seite === "spieler" ? "freund" : ""} ${H.ziel === z.id ? "gewaehlt" : ""}" data-ziel="${z.id}">${bildVon(f)}<span class="hz-ziel-text"><b>${esc(z.name)}</b><small>${z.seite === "spieler" ? `${z.tp}/${z.tpMax} TP` : q >= 1 ? "unverletzt" : q > .5 ? "angeschlagen" : q > .25 ? "schwer verletzt" : "fast besiegt"}</small><span class="mini ${z.seite === "spieler" ? "freund" : ""}"><i style="width:${q * 100}%"></i></span></span>${ring(z.chance, z.seite)}</button>`; }).join("")}</div>`;
        const bereit = selbst || H.ziel;
        h += `<button class="btn breit wuerfel hz-los" id="wuerfeln" ${bereit && !H.warte ? "" : "disabled"}>${H.warte ? "Der Tisch würfelt …" : bereit ? (a.schaden || a.rettung || a.art === "angriff" ? "🎲 Würfeln" : "Ausführen") : "Ziel wählen"}</button></section>`;
      }
    }
    if (H.fehler) h += `<p class="fb">${esc(H.fehler)}</p>`;
    if (H.ergebnis && s.phase === "kampf") h += H.ergebnis.wurf ? `<div class="ergebnis wuerfel-erg" data-erg="${esc(H.ergebnis.t)}" data-w="${H.ergebnis.wurf}"></div>` : `<div class="ergebnis ${H.ergebnis.art || ""}"><span>${esc(H.ergebnis.t)}</span></div>`;
    if (s.phase === "kampf" && s.log && s.log.length) h += `<h3 class="klein">Zuletzt am Tisch · Runde ${s.runde}</h3><ol class="log kurz">${s.log.slice(-5).reverse().map((l) => `<li class="${l.art || ""}">${logZeile(l)}</li>`).join("")}</ol>`;
    return h;
  }

  function tabFaehig(fid, stufe) {
    const d = F.FIGUREN[fid];
    const werte = Object.keys(ATTR).map((k) => `<span><b>${vorz(R.mod(d.werte[k]))}</b><small>${ATTR[k]} ${d.werte[k]}</small></span>`).join("");
    const alle = F.faehigVon(fid, 3);
    const li = (a) => `<li class="${a.ab > stufe ? "gesperrt" : ""}"><b>${esc(a.name)}${a.ab > stufe ? ` <span class="anzahl">ab Stufe ${a.ab}</span>` : ""}</b><small>${esc(aktionInfo(a, d, stufe))}</small><p>${esc(a.text || "")}</p></li>`;
    return `<div class="attr">${werte}</div>
      <p class="note">${esc(d.rolle)} · ${esc(d.ruestung)} · TP ${F.tpVon(fid, 1)} / ${F.tpVon(fid, 2)} / ${F.tpVon(fid, 3)}</p>
      <h3 class="klein">Im Kampf</h3><ul class="faehig">${alle.filter((a) => a.typ !== "passiv").map(li).join("")}</ul>
      <h3 class="klein">Immer aktiv</h3><ul class="faehig">${(() => { const m = F.KLASSEN[d.klasse].merkmal; if (!m) return ""; const [n, ...t] = m.split(": "); return `<li class="klassen-merkmal" style="--k:${F.KLASSEN[d.klasse].farbe}"><b>${esc(n)}</b><small>Klassenmerkmal</small><p>${esc(t.join(": "))}</p></li>`; })()}${alle.filter((a) => a.typ === "passiv").map(li).join("")}</ul>
      <h3 class="klein">Außerhalb des Kampfes</h3><ul class="faehig"><li><b>${esc(d.aussen.name)}</b><p>${esc(d.aussen.text)}</p></li><li><b>Bewegung</b><small>${F.KLASSEN[F.FIGUREN[fid].klasse].bewegung || 6} Felder pro Zug</small><p>Schräg zählt wie gerade. Wer neben einem Gegner losläuft, riskiert einen Gelegenheitsangriff.</p></li></ul>`;
  }

  function tabRucksack(dinge, fid) {
    const d = F.FIGUREN[fid];
    const extra = { krieger: ["Seil, 15 m", "Fackel"], zauberer: ["Zauberbuch", "Kreide"], schurke: ["Dietriche", "Dunkler Umhang"], kleriker: ["Heiliges Symbol", "Verband"], waldlaeufer: ["Köcher", "Jagdmesser"] }[d.klasse] || [];
    return `<ul class="faehig">${dinge.map((x) => { const t = R.DINGE[x.id] || (R.GEGENSTAENDE[x.id] && Object.assign({}, R.GEGENSTAENDE[x.id], { name: R.GEGENSTAENDE[x.id].sym + " " + R.GEGENSTAENDE[x.id].name })) || { name: x.id, text: "" }; return `<li class="${x.n ? "" : "leer"}"><b>${esc(t.name)} <span class="anzahl">×${x.n}</span></b><p>${esc(t.text)}</p>${x.id === "heiltrank" && x.n ? `<small>Trinken: im Reiter „Zug“, wenn du dran bist.</small>` : ""}</li>`; }).join("")}
      ${extra.map((e) => `<li><b>${esc(e)}</b></li>`).join("")}<li><b>${esc(d.ruestung)}</b><small>RK ${d.rk.join(" / ")}</small></li></ul>`;
  }

  $("#verlassen").onclick = async () => {
    if (!confirm("Den Spieltisch verlassen? Deine Figur steuert dann der Tisch.")) return;
    try { await H.client.leave(); } catch (e) { /* schon zu */ }
    H.spiel = null; H.row = null; render();
  };

  (async () => {
    render();
    try {
      let gespeichert = null; try { gespeichert = localStorage.getItem("ab_handy:" + SLUG); } catch (e) { /* privat */ }
      if (!window.RPGNetz || (!gespeichert && !kId)) return;
      const s = gespeichert ? await client().restore() : null;
      if (kId && !(s && !s.closed)) {
        // Als Mitspieler direkt zum Spieltisch: Name ist der Benutzername (sonst der zuletzt verwendete)
        const p = await client().rpc("rpg_my_profile", {}).catch(() => null);
        let n = p && p.handle; if (!n) { try { n = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ } }
        if (n) { H.kAktiv = true; try { const l = await client().rpc("rpg_my_campaigns", {}); const c = l.find((x) => x.id === kId); if (c) H.kTitel = c.title; } catch (e) { /* ohne Titel */ } kampagneWarten(n); return; }
      }
      if (s && !s.closed) { await H.client.fetchStates().catch(() => {}); wach(); H.kAktiv = true; try { H.kName = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ } }
      render();
    } catch (e) { render(); }
  })();

  window.ABH = { H, render };
})();
