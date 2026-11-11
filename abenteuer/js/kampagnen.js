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
  const titelVorschlag = () => { const d = new Date(); return `Grauwacht · ${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`; };

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
          const id = await rpc("rpg_create_campaign", { p_title: titelVorschlag(), p_difficulty: setup.schwierigkeit === "hardcore" ? "hardcore" : "normal", p_display_name: "Spieltisch" });
          K = { id, version: 0, status: "geplant", titel: titelVorschlag() }; merkeK();
        }
        await sitzungStarten();
      } catch (e) { K = null; merkeK(); toast("Kampagne konnte nicht angelegt werden: " + e.message); throw e; }
    })();
    angelegt.then(() => geaendert(true), () => {});
  }
  async function sitzungStarten() {
    const live = window.AB.liveAn() && window.AB.LIVE.client.session;
    await rpc("rpg_start_session", { p_campaign_id: K.id, p_game_session_id: live ? live.session_id : null });
    K.status = "aktiv"; merkeK();
  }

  /* ---------- Speichern ---------- */
  function kurzinfo() {
    const i = window.ABT.info() || {};
    return { titel: i.titel, szene: i.szene, abschnitt: i.abschnitt, stufe: i.stufe, schwierigkeit: i.schwierigkeit, glocke: i.glocke,
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
      if (i.art === "ende") { await rpc("rpg_set_campaign_status", { p_campaign_id: K.id, p_status: "abgeschlossen" }); K.status = "abgeschlossen"; merkeK(); zeigeStatus(""); }
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
      c.status === "pausiert" || c.status === "abgeschlossen" ? `<button class="btn ghost klein" data-k="archiv" data-id="${c.id}">Archivieren</button>` : "",
      c.status === "archiviert" ? `<button class="btn ghost klein" data-k="zurueck" data-id="${c.id}">Wiederherstellen</button>` : "",
      `<button class="btn ghost klein gefahr" data-k="loeschen" data-id="${c.id}">Löschen</button>`].join("")
      : `<button class="btn ghost klein" data-k="verlassen" data-id="${c.id}">Verlassen</button>`;
    return `<li class="k-eintrag" data-kampagne="${c.id}" data-status="${c.status}">
      <div class="k-text"><b>${esc(c.title)}</b><span class="k-status">${esc(STATUS[c.status] || c.status)}${c.laeuft ? " · gerade verbunden" : ""}${c.difficulty === "hardcore" ? " · Hardcore" : ""}</span>
        <small>${i.titel ? `${esc(i.titel)} · Abschnitt ${esc(i.abschnitt)} · Stufe ${esc(i.stufe)}` : "Noch kein Spielstand"} · ${esc(datum(c.updated_at))}</small>
        ${(i.gruppe || []).length ? `<small>Gruppe: ${esc(i.gruppe.join(", "))}${spieler.length ? ` · 📱 ${esc(spieler.map((m) => m.display_name).join(", "))}` : ""}</small>` : ""}
        ${host ? "" : `<small>Du spielst mit${(c.members || []).find((m) => m.role === "host") ? "" : ""}. Fortsetzen kann nur der Spieltisch.</small>`}</div>
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
      <p class="note klein">Kampagnen gehören zu diesem Browser, solange es noch keine Spielerkonten gibt.</p>`);
    const a = $("#k-archiv"); if (a) a.onclick = () => { archivOffen = !archivOffen; bibliothek(); };
    o.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => aktion(b.dataset.k, b.dataset.id, liste.find((c) => c.id === b.dataset.id), b); });
  }
  async function aktion(was, id, c, b) {
    try {
      if (b) b.disabled = true;
      if (was === "handys" || was === "allein") return await fortsetzen(id, was === "handys");
      if (was === "beginnen") return beginnen(c);
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
        const id2 = await rpc("rpg_create_campaign", { p_title: titelVorschlag(), p_difficulty: (window.ABT.info() || {}).schwierigkeit === "hardcore" ? "hardcore" : "normal", p_display_name: "Spieltisch" });
        K = { id: id2, version: 0, status: "geplant", titel: titelVorschlag() }; merkeK();
        await sitzungStarten(); await speichern(); $("#qr-overlay").hidden = true; toast("Das Abenteuer ist jetzt als Kampagne gespeichert."); return;
      }
    } catch (e) { toast(e.message); if (b) b.disabled = false; }
  }
  /** Leere Kampagne beginnen: das Abenteuer startet und wird in dieser Kampagne gespeichert */
  const neuesAbenteuer = () => { const b = $("#titel-start"); if (b) b.click(); };
  function beginnen(c) { K = { id: c.id, version: 0, status: c.status, titel: c.title }; merkeK(); $("#qr-overlay").hidden = true; neuesAbenteuer(); }
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
    zeigeStatus("ok");
    if (mitHandys) { window.AB.qrZeigen(); toast("Kampagne fortgesetzt. Die Handys treten mit dem neuen Code bei und wählen ihre Figur."); }
    else toast("Kampagne fortgesetzt.");
  }

  /* ---------- Einstiege ---------- */
  // Mythara: im Gastbereich · Grauwacht-Titel: im Menü
  const wege = document.querySelector(".my-wege");
  if (wege) { const li = document.createElement("li"); li.innerHTML = `<button class="my-weg" id="my-kampagnen" data-kampagnen><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h12l4 4v14H4z"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#0d0b08" stroke-width="1.6"/></svg></span>Meine Kampagnen</button>`; wege.prepend(li); li.querySelector("button").onclick = bibliothek; }
  const menue = document.querySelector("#intro .titel-menue");
  if (menue) { const b = document.createElement("button"); b.className = "menue"; b.id = "titel-kampagnen"; b.dataset.kampagnen = ""; b.innerHTML = '<span class="m-sym" aria-hidden="true">❖</span>Meine Kampagnen'; b.onclick = bibliothek; const g = $("#titel-gruppe"); menue.insertBefore(b, g); }

  window.KAMPAGNE = { beginnen, aktiv, geaendert, abenteuerBegonnen, pausieren, bibliothek, fortsetzen, aktuell: () => K, speichern };
})();
