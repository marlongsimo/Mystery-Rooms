/*
 * Mythara – Kampagnen (Bauabschnitt A, siehe abenteuer/UMSETZUNG-KAMPAGNEN.md)
 *
 * Eine Kampagne ist der dauerhafte Abenteuerfortschritt einer Gruppe in Supabase (rpg_-Tabellen).
 * Der Spieltisch ist Host: Er legt die Kampagne an und speichert versioniert (rpg_save_snapshot mit
 * erwarteter Version). Hat ein anderes Gerät inzwischen neuer gespeichert, wird nichts überschrieben,
 * sondern der neueste Stand geladen.
 *
 * Für alle freigeschaltet: Jedes Abenteuer wird automatisch als Kampagne gespeichert.
 */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const F = window.ABF, S = window.ABS;
  // Nur für automatische Tests: ?testlauf schaltet das Speichern in Supabase ab
  if (new URLSearchParams(location.search).has("testlauf")) { window.KAMPAGNE = null; return; }
  const ZEIGER = "ab_kampagne";
  try { localStorage.removeItem("mr_kampagnen"); } catch (e) { /* alter Testschalter, nicht mehr nötig */ }

  /* ---------- Zustand ---------- */
  // K: aktive Kampagne auf diesem Gerät { id, version, status, titel }
  let K = null; try { K = JSON.parse(localStorage.getItem(ZEIGER) || "null"); } catch (e) { K = null; }
  const merkeK = () => { try { if (K) localStorage.setItem(ZEIGER, JSON.stringify(K)); else localStorage.removeItem(ZEIGER); } catch (e) { /* privat */ } };
  let angelegt = null, speichert = false, nochmal = false, timer = null, letzterKampfSave = 0, letzteMeta = null, letzteMitglieder = "", status = { art: "", t: 0 };
  // dieselbe Verbindung wie die Live-Runde (eine Anmeldung je Browser, eigener RPG-Speicher)
  const rpc = (name, args) => window.AB.liveClient().rpc(name, args);
  const aktiv = () => Boolean(K && K.id && K.status !== "abgeschlossen" && K.status !== "archiviert");
  const toast = (t) => window.AB && window.AB.toast(t);
  const meta = () => (window.AB.META ? window.AB.META() : { titel: "Das Siegel von Grauwacht", kurz: "Grauwacht" });
  const titelVorschlag = () => { const d = new Date(); return `${meta().kurz || "Grauwacht"} · ${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`; };

  /* ---------- Statusanzeige ---------- */
  function zeigeStatus(art) {
    status = { art, t: Date.now() };
    let el = $("#kampagne-status");
    if (!el) { el = document.createElement("div"); el.id = "kampagne-status"; el.className = "kampagne-status"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    const laeuft = window.ABT && window.ABT.laeuft() && aktiv();
    el.hidden = !laeuft;
    el.dataset.art = art;
    el.textContent = art === "speichert" ? "Kampagne wird gespeichert …" : art === "fehler" ? "⚠ Nicht gespeichert – neuer Versuch beim nächsten Schritt" : art === "ok" ? `✓ Kampagne gespeichert · Stand ${K.version}` : "";
  }

  /* ---------- Anlegen ---------- */
  /** Neues Abenteuer begonnen: Kampagne anlegen (oder eine leere aus „Neu beginnen“ weiterverwenden) und Sitzung starten */
  function abenteuerBegonnen() {
    const leer = K && K.id && K.version === 0 && aktiv();
    angelegt = (async () => {
      try {
        if (!leer) {
          const setup = window.AB.SETUP();
          const id = await rpc("rpg_create_campaign", { p_title: titelVorschlag(), p_difficulty: setup.schwierigkeit === "hardcore" ? "hardcore" : "normal", p_display_name: "Spieltisch", p_adventure: window.AB.SETUP().abenteuer || "grauwacht" });
          K = { id, version: 0, status: "geplant", titel: titelVorschlag() }; merkeK();
        }
        await sitzungStarten();
      } catch (e) { K = null; merkeK(); toast("Kampagne konnte nicht angelegt werden: " + e.message); throw e; }
    })();
    angelegt.then(() => geaendert(true), () => {});
  }
  /** Live-Tisch gestartet: eine schon angelegte (noch leere) Kampagne sofort mit diesem Raum verbinden,
   *  damit eingeladene Mitspieler gleich beitreten und ihre Helden wählen können */
  async function liveGestartet() { if (aktiv() && K.version === 0) await sitzungStarten().catch(() => {}); }
  async function sitzungStarten() {
    const live = window.AB.liveAn() && window.AB.LIVE.client.session;
    await rpc("rpg_start_session", { p_campaign_id: K.id, p_game_session_id: live ? live.session_id : null });
    K.status = "aktiv"; merkeK();
  }

  /* ---------- Speichern ---------- */
  function kurzinfo() {
    const i = window.ABT.info() || {};
    return { abenteuer: i.abenteuer || "grauwacht", titel: i.titel, szene: i.szene, abschnitt: i.abschnitt, stufe: i.stufe, schwierigkeit: i.schwierigkeit, glocke: i.glocke,
      gruppe: (i.gruppe || []).map((f) => (F.FIGUREN[f] || {}).name || f), live: window.AB.liveAn(), kampf: Boolean(window.AB.st) };
  }
  function art(meta) {
    const a = letzteMeta;
    if (!a) return "szene";
    if (meta.abschnitt !== a.abschnitt) return "kapitel";
    if (meta.szene !== a.szene) return meta.szenenArt === "lager" ? "lagerfeuer" : "szene";
    if (a.kampf && !meta.kampf) return "kampf";
    if (meta.kampf) return "auto";
    return "entscheidung";
  }
  /** Bei jeder Änderung (spiel.js → veroeffentlichen): sammeln und speichern. Im Kampf höchstens jede Minute. */
  function geaendert(sofort) {
    if (!aktiv() || !window.ABT || !window.ABT.laeuft()) return;
    clearTimeout(timer);
    const imKampf = Boolean(window.AB.st);
    if (imKampf && !sofort) {
      const warten = Math.max(0, 60000 - (Date.now() - letzterKampfSave));
      timer = setTimeout(speichern, Math.max(warten, 1500));
      return;
    }
    timer = setTimeout(speichern, sofort ? 50 : 1500);
  }
  async function speichern() {
    if (speichert) { nochmal = true; return; }
    if (!aktiv()) return;
    speichert = true; nochmal = false;
    try {
      if (angelegt) await angelegt;
      if (!aktiv()) return;
      if (K.status === "pausiert" || K.status === "geplant") await sitzungStarten();
      const stand = window.AB.spielstand(); if (!stand) return;
      const i = window.ABT.info() || {};
      const meta = { szene: i.szene, szenenArt: i.art, abschnitt: i.abschnitt, kampf: Boolean(stand.st) };
      zeigeStatus("speichert");
      const v = await rpc("rpg_save_snapshot", { p_campaign_id: K.id, p_expected_version: K.version, p_state: stand, p_kind: art(meta), p_checkpoint: kurzinfo() });
      K.version = Number(v); merkeK(); letzteMeta = meta;
      if (meta.kampf) letzterKampfSave = Date.now();
      zeigeStatus("ok");
      await mitgliederAbgleichen().catch(() => {});
      if (i.art === "ende") {
        await rpc("rpg_set_campaign_status", { p_campaign_id: K.id, p_status: "abgeschlossen" }); K.status = "abgeschlossen"; merkeK(); zeigeStatus("");
        // Heldensammlung (Open Beta): Ende für das Konto an diesem Gerät melden; die Datenbank prüft, ob es zählt
        if (window.ABSAMMLUNG) window.ABSAMMLUNG.endeMelden(K.id, { knopf: true, versuche: 2 }).catch(() => {});
      }
    } catch (e) {
      if (/RPG_VERALTET/.test(e.roh || e.message)) await neuererStand();
      else { zeigeStatus("fehler"); console.warn("[Kampagne]", e.message); }
    } finally {
      speichert = false;
      if (nochmal) geaendert(true);
    }
  }
  /** Ein anderes Gerät hat neuer gespeichert: nichts überschreiben, den neuesten Stand laden */
  async function neuererStand() {
    try {
      const d = await rpc("rpg_load_campaign", { p_campaign_id: K.id });
      K.version = d.version; K.status = d.campaign.status; merkeK();
      if (d.state) window.AB.spielstandUebernehmen(d.state);
      letzteMeta = null;
      toast("Auf einem anderen Gerät wurde weitergespielt. Der neueste Stand wurde geladen.");
      zeigeStatus("ok");
    } catch (e) { zeigeStatus("fehler"); }
  }
  /** Mitspieler der Live-Runde mit ihren Figuren in die Kampagne übernehmen */
  async function mitgliederAbgleichen() {
    if (!window.AB.liveAn()) return;
    const L = window.AB.LIVE, liste = Object.entries(L.besitz || {}).map(([fid, uid]) => ({ user_id: uid, display_name: (L.client.playerName(uid) || "Gast").slice(0, 24), character_id: fid }));
    const j = JSON.stringify(liste); if (!liste.length || j === letzteMitglieder) return;
    await rpc("rpg_sync_members", { p_campaign_id: K.id, p_members: liste }); letzteMitglieder = j;
  }

  /* ---------- Pausieren ---------- */
  /** Speichern, Status „pausiert“, Live-Runde beenden. allein: „Pause“ am Tisch – der Browser-Stand bleibt zum direkten Fortsetzen. */
  async function pausieren(o = {}) {
    if (!aktiv()) return;
    if (!o.allein && !confirm("Kampagne pausieren? Sie wird gespeichert und kann unter „Meine Kampagnen“ fortgesetzt werden." + (window.AB.liveAn() ? " Die Handys werden getrennt." : ""))) return;
    clearTimeout(timer); await speichern();
    try { await rpc("rpg_set_campaign_status", { p_campaign_id: K.id, p_status: "pausiert" }); K.status = "pausiert"; merkeK(); }
    catch (e) { toast("Pausieren: " + e.message); }
    if (o.allein) { zeigeStatus(""); return; }
    if (window.AB.liveAn()) await window.AB.liveFuerPauseBeenden();
    window.AB.allesBeenden(); window.ABT.verwerfen(); zeigeStatus("");
    window.AB.zeigeIntro(); toast("Kampagne pausiert. Fortsetzen unter „Meine Kampagnen“.");
  }

  /* ---------- Bibliothek ---------- */
  const STATUS = { geplant: "Noch nicht begonnen", aktiv: "Läuft", pausiert: "Pausiert", abgeschlossen: "Abgeschlossen", archiviert: "Archiviert" };
  const datum = (t) => { try { return new Date(t).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  let archivOffen = false;
  function box(inhalt) {
    const o = $("#qr-overlay");
    o.innerHTML = `<div class="karte-box kampagnen" role="dialog" aria-labelledby="k-titel"><div class="k-kopf"><h2 id="k-titel">Meine Kampagnen</h2><button class="link" id="k-zu">Schließen</button></div>${inhalt}</div>`;
    o.hidden = false; $("#k-zu").onclick = () => { o.hidden = true; };
    return o;
  }
  function eintrag(c) {
    const i = c.checkpoint || {}, host = c.role === "host", fertig = c.status === "abgeschlossen" || c.status === "archiviert";
    const spieler = (c.members || []).filter((m) => m.role !== "host");
    const knoepfe = host ? [
      !fertig && c.version > 0 && i.live ? `<button class="btn klein" data-k="handys" data-id="${c.id}">Mit Handys fortsetzen</button>` : "",
      !fertig && c.version > 0 ? `<button class="btn ${i.live ? "ghost " : ""}klein" data-k="allein" data-id="${c.id}">${i.live ? "Allein fortsetzen" : "Fortsetzen"}</button>` : "",
      !fertig && c.version === 0 ? `<button class="btn klein" data-k="beginnen" data-id="${c.id}">Beginnen</button>` : "",
      c.version > 0 && c.status !== "archiviert" ? `<button class="btn ghost klein" data-k="neu" data-id="${c.id}">Neu beginnen</button>` : "",
      !fertig && window.MYTHARA && window.MYTHARA.istKonto() ? `<button class="btn ghost klein" data-k="einladen" data-id="${c.id}">Freunde einladen</button>` : "",
      !fertig ? `<button class="btn ghost klein" data-k="tisch" data-id="${c.id}">Auf anderem Gerät spielen</button>` : "",
      c.status === "pausiert" || c.status === "abgeschlossen" ? `<button class="btn ghost klein" data-k="archiv" data-id="${c.id}">Archivieren</button>` : "",
      c.status === "archiviert" ? `<button class="btn ghost klein" data-k="zurueck" data-id="${c.id}">Wiederherstellen</button>` : "",
      `<button class="btn ghost klein gefahr" data-k="loeschen" data-id="${c.id}">Löschen</button>`].join("")
      : c.role === "tisch" ? (!fertig && c.version > 0 ? `<button class="btn klein" data-k="handys" data-id="${c.id}">Mit Handys fortsetzen</button><button class="btn ghost klein" data-k="tisch" data-id="${c.id}">Auf anderem Gerät spielen</button>` : "")
      : `${!fertig ? `<button class="btn klein" data-k="mitspielen" data-id="${c.id}">Zum Spieltisch</button>` : ""}<button class="btn ghost klein" data-k="verlassen" data-id="${c.id}">Verlassen</button>`;
    return `<li class="k-eintrag" data-kampagne="${c.id}" data-status="${c.status}">
      <div class="k-text"><b>${esc(c.title)}</b><span class="k-status">${esc(STATUS[c.status] || c.status)}${c.laeuft ? " · gerade verbunden" : ""}${c.difficulty === "hardcore" ? " · Hardcore" : ""}</span>
        <small>${i.titel ? `${esc(i.titel)} · Abschnitt ${esc(i.abschnitt)} · Stufe ${esc(i.stufe)}` : "Noch kein Spielstand"} · ${esc(datum(c.updated_at))}</small>
        ${(i.gruppe || []).length ? `<small>Gruppe: ${esc(i.gruppe.join(", "))}${spieler.length ? ` · 📱 ${esc(spieler.map((m) => m.display_name).join(", "))}` : ""}</small>` : ""}
        ${host || c.role === "tisch" ? "" : `<small>Du spielst mit. „Zum Spieltisch“ verbindet dich – läuft der Tisch noch nicht, wartest du dort, bis es losgeht.</small>`}</div>
      <div class="k-knoepfe">${knoepfe}</div></li>`;
  }
  async function bibliothek() {
    box(`<p class="note">Kampagnen werden geladen …</p>`);
    let liste;
    try { liste = await rpc("rpg_my_campaigns", {}); }
    catch (e) { box(`<p class="fb">${esc(e.message)}</p>`); return; }
    const offen = liste.filter((c) => c.status !== "archiviert"), archiv = liste.filter((c) => c.status === "archiviert");
    const lokal = window.ABT && window.ABT.gespeichert() && !(K && K.id) ? `<div class="k-lokal"><p>In diesem Browser liegt ein Abenteuer ohne Kampagne.</p><button class="btn klein" data-k="uebernehmen">Als Kampagne speichern</button></div>` : "";
    const o = box(`${lokal}
      ${offen.length ? `<ul class="k-liste">${offen.map(eintrag).join("")}</ul>` : `<p class="note">Noch keine Kampagne. Startet ein Abenteuer – es wird automatisch als Kampagne gespeichert.</p>`}
      ${archiv.length ? `<button class="link" id="k-archiv">${archivOffen ? "Archiv ausblenden" : `Archiv anzeigen (${archiv.length})`}</button>${archivOffen ? `<ul class="k-liste archiv">${archiv.map(eintrag).join("")}</ul>` : ""}` : ""}
      <p class="note klein">${window.MYTHARA && window.MYTHARA.istKonto() ? "Deine Kampagnen sind mit deinem Konto verbunden." : "Als Gast gehören deine Kampagnen zu diesem Browser. Mit einem Konto hast du sie auf jedem Gerät."}</p>`);
    const a = $("#k-archiv"); if (a) a.onclick = () => { archivOffen = !archivOffen; bibliothek(); };
    o.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => aktion(b.dataset.k, b.dataset.id, liste.find((c) => c.id === b.dataset.id), b); });
  }
  async function aktion(was, id, c, b) {
    try {
      if (b) b.disabled = true;
      if (was === "handys" || was === "allein") return await fortsetzen(id, was === "handys");
      if (was === "beginnen") return beginnen(c);
      if (was === "tisch") { if (b) b.disabled = false; return tischWechseln(id, c.title); }
      if (was === "mitspielen") { location.href = "handy.html?kampagne=" + encodeURIComponent(id); return; }
      if (was === "einladen") { if (b) b.disabled = false; return window.MYTHARA.freundeEinladen(id, c.title); }
      if (was === "neu") {
        if (!confirm(`„${c.title}“ neu beginnen? Alle Spielstände dieser Kampagne werden gelöscht. Die Kampagne und ihre Mitspieler bleiben.`)) { b.disabled = false; return; }
        await rpc("rpg_reset_campaign", { p_campaign_id: id });
        if (K && K.id === id) { window.AB.allesBeenden(); window.ABT.verwerfen(); }
        K = { id, version: 0, status: "aktiv", titel: c.title }; merkeK(); letzteMeta = null;
        $("#qr-overlay").hidden = true; neuesAbenteuer(); toast("Neuer Anfang: Das Abenteuer wird in dieser Kampagne gespeichert."); return;
      }
      if (was === "archiv" || was === "zurueck") { await rpc("rpg_set_campaign_status", { p_campaign_id: id, p_status: was === "archiv" ? "archiviert" : "pausiert" }); if (K && K.id === id) { K.status = was === "archiv" ? "archiviert" : "pausiert"; merkeK(); } return bibliothek(); }
      if (was === "loeschen") {
        if (!confirm(`„${c.title}“ endgültig löschen? Alle Spielstände gehen verloren.`)) { b.disabled = false; return; }
        await rpc("rpg_delete_campaign", { p_campaign_id: id });
        if (K && K.id === id) { K = null; merkeK(); }
        return bibliothek();
      }
      if (was === "verlassen") { if (!confirm(`„${c.title}“ verlassen?`)) { b.disabled = false; return; } await rpc("rpg_leave_campaign", { p_campaign_id: id }); return bibliothek(); }
      if (was === "uebernehmen") {
        window.ABT.fortsetzen();
        const id2 = await rpc("rpg_create_campaign", { p_title: titelVorschlag(), p_difficulty: (window.ABT.info() || {}).schwierigkeit === "hardcore" ? "hardcore" : "normal", p_display_name: "Spieltisch", p_adventure: window.AB.SETUP().abenteuer || "grauwacht" });
        K = { id: id2, version: 0, status: "geplant", titel: titelVorschlag() }; merkeK();
        await sitzungStarten(); await speichern(); $("#qr-overlay").hidden = true; toast("Das Abenteuer ist jetzt als Kampagne gespeichert."); return;
      }
    } catch (e) { toast(e.message); if (b) b.disabled = false; }
  }
  /** Leere Kampagne beginnen: das Abenteuer startet und wird in dieser Kampagne gespeichert */
  const neuesAbenteuer = () => { const b = $("#titel-start"); if (b) b.click(); };
  function beginnen(c) { K = { id: c.id, version: 0, status: c.status, titel: c.title }; merkeK(); $("#qr-overlay").hidden = true; neuesAbenteuer(); }
  /** Wer hat zuletzt welchen Helden gespielt? Aus dem Spielstand, ergänzt um die Figuren der Kampagnen-Mitglieder */
  function fruehereHelden(d) {
    const s = d.state || {}, m = Object.assign({}, s.frueher || {}, s.besitz || {}), gruppe = (s.setup && s.setup.gruppe) || [];
    const vergeben = new Set(Object.values(m));
    for (const x of d.members || []) {
      const fid = x.character_id;
      if (x.role !== "spieler" || x.member_status === "ausgetreten" || !fid || !gruppe.includes(fid) || m[fid] || vergeben.has(x.user_id)) continue;
      m[fid] = x.user_id; vergeben.add(x.user_id);
    }
    return m;
  }
  /** Kampagne fortsetzen: neuesten Stand laden, Sitzung starten, ggf. neue Live-Runde mit Code */
  async function fortsetzen(id, mitHandys) {
    const d = await rpc("rpg_load_campaign", { p_campaign_id: id });
    if (!d.state) throw new Error("Diese Kampagne hat noch keinen Spielstand.");
    // Was gerade auf diesem Gerät läuft, wird vorher gesichert und beendet
    if (aktiv() && K.id !== id && window.ABT.laeuft()) { clearTimeout(timer); await speichern(); }
    if (window.AB.liveAn() && !mitHandys) await window.AB.liveFuerPauseBeenden();
    window.AB.allesBeenden();
    K = { id, version: d.version, status: d.campaign.status, titel: d.campaign.title }; merkeK(); letzteMeta = null; letzteMitglieder = "";
    if (mitHandys) await window.AB.liveFuerKampagne();
    await sitzungStarten();
    $("#qr-overlay").hidden = true;
    window.AB.spielstandUebernehmen(Object.assign({}, d.state, { besitz: {} }));
    // Wiedereinstieg: Wer zurückkommt, bekommt seinen Helden automatisch zurück
    if (mitHandys) window.AB.frueherSetzen(fruehereHelden(d));
    zeigeStatus("ok");
    if (mitHandys) { window.AB.qrZeigen(); toast("Kampagne fortgesetzt. Die Handys treten mit dem neuen Code bei – wer schon dabei war, bekommt seinen Helden automatisch zurück."); }
    else toast("Kampagne fortgesetzt.");
  }


  /* ---------- Einladen: nach „Coop-Mode“, vor der Heldenwahl ---------- */
  // Freunde (Konto), Gäste per Kampagnen-Code (handy.html?k=…) und auf Wunsch ein anderes Gerät als Spieltisch (index.html?tisch=…)
  let einl = null; // { gast, tisch, uhr, freunde, offen, mitglieder }
  const linkUrl = (pfad) => new URL(pfad, location.href).href;
  const codeBox = (url, code, titel, text) => `<div class="beitritt"><div class="qr">${window.AB.qrSvg(url)}</div><div>
      <p class="eyebrow">${titel}</p><p class="code">${esc(code)}</p><p class="note">${text}</p></div></div>`;
  const kurzUrl = (pfad) => linkUrl(pfad).replace(/[?#].*$/, "").replace(/^https?:\/\//, "");
  function istHost() { return !K || K.rolle !== "tisch"; }
  /** Gäste-Code: einmal je Kampagne erzeugen und auf diesem Gerät merken (7 Tage gültig; ein neuer macht den alten ungültig) */
  async function gastCode() {
    if (K.gast && K.gast.bis > Date.now()) return K.gast.code;
    const code = await rpc("rpg_create_link", { p_campaign_id: K.id, p_art: "gast" });
    K.gast = { code, bis: Date.now() + 6 * 864e5 }; merkeK(); return code;
  }
  /** Kampagne für diese Runde: eine schon angelegte leere weiterverwenden, sonst neu anlegen; dann mit dem Live-Raum verbinden */
  async function kampagneFuerRunde() {
    if (aktiv() && K.version === 0) {
      try {
        // Eine leere Kampagne von vorhin gehört evtl. zu einem anderen Abenteuer (z. B. Moor statt Hochwacht): Namen angleichen,
        // denn ein zweites Gerät als Spieltisch erkennt das Abenteuer am Namen
        const soll = window.AB.SETUP().abenteuer || "grauwacht";
        if (abenteuerAusTitel(K.titel) !== soll && meta().titel) { K.titel = await rpc("rpg_rename_campaign", { p_campaign_id: K.id, p_title: meta().titel }); merkeK(); }
        try { await rpc("rpg_set_adventure", { p_campaign_id: K.id, p_adventure: soll }); } catch (e) { /* vor Migration 005 gibt es das noch nicht */ }
        await sitzungStarten(); return;
      } catch (e) { /* gehört nicht (mehr) zu uns – neu anlegen */ }
    }
    const setup = window.AB.SETUP(), titel = meta().titel || "Das Siegel von Grauwacht";
    const id = await rpc("rpg_create_campaign", { p_title: titel, p_difficulty: setup.schwierigkeit === "hardcore" ? "hardcore" : "normal", p_display_name: "Spieltisch", p_adventure: window.AB.SETUP().abenteuer || "grauwacht" });
    K = { id, version: 0, status: "geplant", titel }; merkeK(); letzteMeta = null; letzteMitglieder = "";
    await sitzungStarten();
  }
  async function einladen() {
    const el = $("#einladen"); window.AB.zeigeSektion("einladen");
    el.innerHTML = `<p class="note">Kampagne wird vorbereitet …</p>`;
    try { await kampagneFuerRunde(); }
    catch (e) { toast("Kampagne konnte nicht angelegt werden: " + e.message); K = null; merkeK(); return window.AB.zeigeSetup(); }
    einl = { gast: null, tisch: null, freunde: null, offen: [], mitglieder: [] };
    try { einl.gast = await gastCode(); } catch (e) { einl.gastFehler = e.message; }
    if (window.MYTHARA && window.MYTHARA.istKonto()) {
      try {
        const [f, o, d] = await Promise.all([rpc("rpg_my_friends", {}), rpc("rpg_campaign_open_invites", { p_campaign_id: K.id }), rpc("rpg_load_campaign", { p_campaign_id: K.id })]);
        einl.freunde = f.freunde || []; einl.offen = o || []; einl.mitglieder = (d.members || []).map((m) => (m.handle || m.display_name || "").toLowerCase());
      } catch (e) { einl.freunde = []; }
    }
    einladenZeichnen();
    clearInterval(einl.uhr); einl.uhr = setInterval(einladenTakt, 3000);
  }
  function einladenZeichnen() {
    const el = $("#einladen"); if (!einl || !K) return;
    const c = window.AB.LIVE.client, handys = c && c.session ? c.players.filter((p) => !p.is_host) : [];
    const freunde = einl.freunde === null
      ? `<p class="note">Mit einem Spielerkonto lädst du Freunde direkt ein – sie sehen die Einladung in ihrer Glocke und kommen ohne Code an den Tisch.</p>`
      : einl.freunde.length ? `<ul class="ei-freunde">${einl.freunde.map((f) => { const h = f.handle, dabei = einl.mitglieder.includes(h.toLowerCase()), eingeladen = einl.offen.includes(h);
          return `<li><b>${esc(h)}</b>${dabei ? `<span class="ei-ok">dabei</span>` : eingeladen ? `<span class="ei-ok">eingeladen ✓</span>` : `<button class="btn ghost klein" data-ei-freund="${esc(h)}">Einladen</button>`}</li>`; }).join("")}</ul>`
      : `<p class="note">Du hast noch keine Freunde. Füge sie auf der Spielerseite unter „Freunde“ hinzu.</p>`;
    const gast = einl.gast
      ? codeBox(linkUrl("handy.html?k=" + encodeURIComponent(einl.gast)), einl.gast, "Gäste einladen", `QR-Code mit dem Handy scannen – oder <b>${esc(kurzUrl("handy.html"))}</b> öffnen und den Code eingeben. Wer beitritt, gehört fest zur Kampagne, auch ohne Konto. Der Code gilt 7 Tage.`)
      : `<p class="note">Gäste-Code gerade nicht verfügbar${einl.gastFehler ? ` (${esc(einl.gastFehler)})` : ""}. Gäste können bei der Heldenwahl über den Raum-Code beitreten.</p>`;
    const tisch = einl.tisch
      ? codeBox(linkUrl("index.html?tisch=" + encodeURIComponent(einl.tisch) + "&ab=" + encodeURIComponent(window.AB.SETUP().abenteuer || "grauwacht")), einl.tisch, "Code für das Tisch-Gerät", `Auf dem Gerät, das in der Mitte liegen soll, QR-Code scannen – oder <b>${esc(kurzUrl("index.html"))}</b> öffnen, „Als Spieltisch verbinden“ wählen und den Code eingeben. Der Code gilt einmal.`) + `<p class="note ei-warte">Warte auf das Tisch-Gerät …</p>`
      : `<p class="note">Dieses Gerät ist der Spieltisch. Soll ein anderes Gerät (z. B. ein Tablet oder Fernseher) in der Mitte liegen, verbinde es mit einem Tisch-Code.</p>`;
    el.innerHTML = `<div class="ei-kopf"><div><p class="eyebrow">Coop-Mode</p><h1>Wer spielt mit?</h1></div>
        ${istHost() ? `<label class="ei-titel">Name der Kampagne <input id="ei-titel" maxlength="80" value="${esc(K.titel || "")}"></label>` : `<p class="note">${esc(K.titel || "")}</p>`}</div>
      <div class="ei-raster">
        <section class="ei-karte"><h2>Freunde</h2>${freunde}</section>
        <section class="ei-karte"><h2>Gäste</h2>${gast}</section>
        <section class="ei-karte"><h2>Spieltisch</h2>
          <div class="seg ei-tisch"><button data-ei-tisch="hier" class="${einl.tisch ? "" : "an"}">Dieses Gerät</button><button data-ei-tisch="anders" class="${einl.tisch ? "an" : ""}">Ein anderes Gerät</button></div>${tisch}</section>
      </div>
      <p class="note ei-da" id="ei-da">${handys.length ? `Schon da: ${handys.map((p) => esc(p.player_name)).join(", ")}` : "Noch niemand verbunden."}</p>
      <div class="knoepfe"><button class="btn gross" id="ei-weiter">Weiter zur Heldenwahl</button></div>`;
    const t = $("#ei-titel"); if (t) t.onchange = async () => {
      const neu = t.value.trim(); if (!neu || neu === K.titel) return;
      try { K.titel = await rpc("rpg_rename_campaign", { p_campaign_id: K.id, p_title: neu }); merkeK(); toast("Name gespeichert."); } catch (e) { toast(e.message); }
    };
    el.querySelectorAll("[data-ei-freund]").forEach((b) => { b.onclick = async () => {
      b.disabled = true;
      try { await rpc("rpg_invite_friend", { p_campaign_id: K.id, p_handle: b.dataset.eiFreund }); einl.offen.push(b.dataset.eiFreund); einladenZeichnen(); }
      catch (e) { toast(e.message); b.disabled = false; }
    }; });
    el.querySelectorAll("[data-ei-tisch]").forEach((b) => { b.onclick = async () => {
      if (b.dataset.eiTisch === "hier") { einl.tisch = null; return einladenZeichnen(); }
      if (einl.tisch) return;
      try { einl.tisch = await rpc("rpg_create_link", { p_campaign_id: K.id, p_art: "tisch" }); einladenZeichnen(); } catch (e) { toast(e.message); }
    }; });
    $("#ei-weiter").onclick = () => { if (einl) clearInterval(einl.uhr); einl = null; el.innerHTML = ""; window.AB.zeigeSetup(); };
  }
  /** Alle 3 Sekunden: Wer ist schon da? Hat das Tisch-Gerät übernommen? */
  async function einladenTakt() {
    if (!einl || $("#einladen").hidden) { if (einl) clearInterval(einl.uhr); einl = null; return; }
    const c = window.AB.LIVE.client, da = $("#ei-da");
    if (da && c && c.session) { const h = c.players.filter((p) => !p.is_host); da.textContent = h.length ? "Schon da: " + h.map((p) => p.player_name).join(", ") : "Noch niemand verbunden."; }
    if (!einl.tisch) return;
    let info; try { info = await rpc("rpg_link_info", { p_token: einl.tisch }); } catch (e) { return; }
    if (info || !einl) return; // noch nicht übernommen
    clearInterval(einl.uhr); einl = null;
    await abgegeben();
  }
  /** Ein anderes Gerät ist jetzt der Spieltisch: hier die Runde beenden (die Handys verbinden sich selbst neu) */
  async function abgegeben() {
    const id = K && K.id, titel = K && K.titel;
    clearTimeout(timer);
    if (window.AB.liveAn()) await window.AB.liveFuerPauseBeenden();
    window.AB.allesBeenden(); if (window.ABT) window.ABT.verwerfen();
    K = null; merkeK(); zeigeStatus("");
    const o = $("#qr-overlay");
    o.innerHTML = `<div class="karte-box kampagnen" role="dialog"><div class="k-kopf"><h2>Spieltisch übergeben</h2></div>
      <p class="note">„${esc(titel || "")}“ läuft jetzt auf dem anderen Gerät. Die Handys verbinden sich von selbst neu.</p>
      <div class="knoepfe"><button class="btn" id="ab-mitspielen">Mit diesem Gerät mitspielen</button><button class="btn ghost" id="ab-zu">Zur Startseite</button></div></div>`;
    o.hidden = false;
    $("#ab-mitspielen").onclick = () => { location.href = "handy.html?kampagne=" + encodeURIComponent(id); };
    $("#ab-zu").onclick = () => { o.hidden = true; window.AB.zeigeIntro(); };
    window.AB.zeigeIntro();
  }

  /* ---------- Tisch wechseln: im Spiel und aus „Meine Kampagnen“ ---------- */
  let wechselUhr = null;
  async function tischWechseln(id, titel) {
    id = id || (K && K.id); titel = titel || (K && K.titel) || "";
    if (!id) return;
    const hier = aktiv() && K.id === id;
    const o = $("#qr-overlay");
    const zu = () => { clearInterval(wechselUhr); wechselUhr = null; o.hidden = true; };
    o.innerHTML = `<div class="karte-box kampagnen"><p class="note">Spielstand wird gesichert …</p></div>`; o.hidden = false;
    let code;
    try {
      if (hier && window.ABT && window.ABT.laeuft()) { clearTimeout(timer); await speichern(); }
      code = await rpc("rpg_create_link", { p_campaign_id: id, p_art: "tisch" });
    } catch (e) { o.hidden = true; toast(e.message); return; }
    o.innerHTML = `<div class="karte-box kampagnen" role="dialog" aria-labelledby="tw-titel"><div class="k-kopf"><h2 id="tw-titel">Spieltisch wechseln</h2><button class="link" id="tw-zu">Abbrechen</button></div>
      <p class="note">„${esc(titel)}“ auf einem anderen Gerät weiterspielen: Dort diesen QR-Code scannen – oder <b>${esc(kurzUrl("index.html"))}</b> öffnen, „Als Spieltisch verbinden“ wählen und den Code eingeben.</p>
      ${codeBox(linkUrl("index.html?tisch=" + encodeURIComponent(code)), code, "Code für das neue Tisch-Gerät", "Der Code gilt einmal und 24 Stunden. Der Spielstand ist gesichert; sobald das neue Gerät verbunden ist, endet die Runde hier.")}
      <p class="note ei-warte">Warte auf das neue Gerät …</p></div>`;
    $("#tw-zu").onclick = zu;
    clearInterval(wechselUhr);
    wechselUhr = setInterval(async () => {
      if (o.hidden) { clearInterval(wechselUhr); return; }
      let info; try { info = await rpc("rpg_link_info", { p_token: code }); } catch (e) { return; }
      if (info) return;
      clearInterval(wechselUhr); wechselUhr = null;
      if (hier && K && K.id === id) await abgegeben();
      else { o.innerHTML = `<div class="karte-box kampagnen"><div class="k-kopf"><h2>Spieltisch übergeben</h2><button class="link" id="tw-zu">Schließen</button></div><p class="note">„${esc(titel)}“ läuft jetzt auf dem anderen Gerät.</p></div>`; $("#tw-zu").onclick = () => { o.hidden = true; }; }
    }, 3000);
  }
  /** Welches Abenteuer zu einer Kampagne gehört, steht vor dem ersten Speichern nur im Titel („Moor · 12.11. 22:20“ oder der volle Titel) */
  function abenteuerAusTitel(t) {
    t = String(t || "").trim();
    for (const D of Object.values(window.ABD_ALLE || {})) {
      const m = D.META || {}; if (!m.id) continue;
      const kopf = t.split(" ·")[0].trim();
      if ((m.kurz && (t === m.kurz || kopf === m.kurz)) || (m.titel && t.startsWith(m.titel)) || (kopf.length >= 4 && m.titel && m.titel.split(/\s+/).includes(kopf))) return m.id;
    }
    return null;
  }
  /** Dieses Gerät wird der Spieltisch einer Kampagne (Tisch-Code oder ?tisch=…) */
  async function tischUebernehmen(code, abenteuer) {
    const d = await rpc("rpg_claim_table", { p_token: code });
    if (aktiv() && K.id !== d.campaign_id && window.ABT && window.ABT.laeuft()) { clearTimeout(timer); await speichern().catch(() => {}); }
    if (Number(d.version) > 0) { await fortsetzen(d.campaign_id, true); K.rolle = "tisch"; merkeK(); return d; }
    if (window.AB.liveAn()) await window.AB.liveFuerPauseBeenden();
    window.AB.allesBeenden(); if (window.ABT) window.ABT.verwerfen();
    K = { id: d.campaign_id, version: 0, status: d.status, titel: d.titel, rolle: "tisch" }; merkeK(); letzteMeta = null; letzteMitglieder = "";
    await window.AB.liveFuerKampagne();
    await sitzungStarten();
    $("#qr-overlay").hidden = true;
    // Das Abenteuer der Kampagne übernehmen, sonst zeigt der Tisch das zuletzt hier gewählte (z. B. Grauwacht statt Moor)
    // Vorrang hat das Abenteuer aus dem QR-Link (&ab=…), sonst der Name der Kampagne
    const bekannt = abenteuer && window.ABD_ALLE && window.ABD_ALLE[abenteuer] ? abenteuer : null;
    // Danach die Datenbank (ab Migration 005; alte Kampagnen stehen dort pauschal auf „grauwacht“), zuletzt der Name
    const ausTitel = abenteuerAusTitel(d.titel), db = d.abenteuer && window.ABD_ALLE && window.ABD_ALLE[d.abenteuer] && !(d.abenteuer === "grauwacht" && ausTitel && ausTitel !== "grauwacht") ? d.abenteuer : null;
    const ab = bekannt || db || ausTitel; if (ab && window.AB.abenteuerWaehlen) window.AB.abenteuerWaehlen(ab);
    window.AB.lobbyFuerKampagne(d.difficulty);
    toast(`Dieses Gerät ist jetzt der Spieltisch von „${d.titel}“.`);
    return d;
  }
  // Aufruf über den QR-Code: index.html?tisch=CODE
  (() => {
    const p = new URLSearchParams(location.search), code = p.get("tisch"), ab = p.get("ab"); if (!code) return;
    p.delete("tisch"); p.delete("ab"); history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
    const los = () => { toast("Verbinde als Spieltisch …"); tischUebernehmen(code, ab).catch((e) => { toast(e.message); alert("Spieltisch verbinden: " + e.message); }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", los, { once: true }); else setTimeout(los, 0);
  })();

  /* ---------- Einstiege ---------- */
  // Mythara: im Gastbereich · Grauwacht-Titel: im Menü
  const wege = document.querySelector(".my-wege");
  if (wege) { const li = document.createElement("li"); li.innerHTML = `<button class="my-weg" id="my-kampagnen" data-kampagnen><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h12l4 4v14H4z"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#0d0b08" stroke-width="1.6"/></svg></span>Meine Kampagnen</button>`; wege.prepend(li); li.querySelector("button").onclick = bibliothek; }
  const menue = document.querySelector("#intro .titel-menue");
  if (menue) { const b = document.createElement("button"); b.className = "menue"; b.id = "titel-kampagnen"; b.dataset.kampagnen = ""; b.innerHTML = '<span class="m-sym" aria-hidden="true">❖</span>Meine Kampagnen'; b.onclick = bibliothek; const g = $("#titel-gruppe"); menue.insertBefore(b, g); }

  window.KAMPAGNE = { abenteuerAusTitel, vergessenWennLeer: () => { if (K && K.version === 0) { K = null; merkeK(); } }, einladen, tischWechseln, tischUebernehmen, beginnen, aktiv, geaendert, abenteuerBegonnen, pausieren, bibliothek, fortsetzen, aktuell: () => K, speichern };
})();
