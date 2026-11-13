/*
 * Mythara – Heldensammlung (Open Beta, siehe KONZEPT-HELDENFREISCHALTUNG.md und supabase/006_rpg_heldensammlung.sql)
 *
 * • Spielerkonten haben eine Sammlung: drei Startrunden bei der Registrierung (je einer von drei Helden),
 *   danach ein neuer Held für jedes Kampagnen-Ende, das das Konto zum ersten Mal erreicht.
 * • Ohne Konto (Gast) gibt es ein festes Starter-Set mit einem Helden je Klasse.
 * • Freischalt-Code im Konto: alle 15 Helden.
 * • Ist Migration 006 in der Datenbank (noch) nicht eingespielt, sind wie bisher alle Helden frei.
 *
 * Gelost und geprüft wird ausschließlich auf dem Server. Dieses Modul zeigt nur an und meldet Entscheidungen.
 */
(() => {
  "use strict";
  const F = window.ABF;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function toast(text) {
    if (window.AB && window.AB.toast) return window.AB.toast(text);
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("an"); clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("an"), 4000);
  }

  /** Festes Starter-Set ohne Konto: ein Einstiegsheld je Klasse */
  const STARTER = ["schildwaechter", "elementarist", "trickser", "lichtbringer", "wildnislaeufer"];
  /** Reguläre Enden und Kampagnentitel je Abenteuer: aus js/enden.js (erzeugt aus daten/*.js mit tools/kampagne.js enden) */
  const KAMPAGNEN = window.ABENDEN || {};
  const TITEL = Object.fromEntries(Object.entries(KAMPAGNEN).map(([ab, v]) => [ab, v.ehrentitel || ""]));
  // Volle Adresse: In einer CSS-Variable würde ein relativer Pfad vom CSS-Ordner aus gelesen
  const bildVon = (ab) => new URL(`img/${KAMPAGNEN[ab] ? ab : "grauwacht"}/titel.webp`, location.href).href;
  const SCHLOSS = '<svg viewBox="0 0 24 24" fill="none" stroke="#e8dcc0" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(0,0,0,.55)"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.4" fill="#e8dcc0"/></svg>';

  /* ---------- Verbindung ---------- */
  let netzQuelle = () => (window.AB && window.AB.liveClient ? window.AB.liveClient() : null);
  const netz = () => netzQuelle();
  /** Fehlt die Funktion in der Datenbank (Migration 006 noch nicht eingespielt)? */
  const fehlt = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  async function rpc(name, args = {}) { const c = netz(); if (!c) throw new Error("Keine Verbindung."); return c.rpc(name, args); }

  /* ---------- Zustand ---------- */
  // installiert: false → Migration fehlt, alle Helden frei. konto: false → Starter-Set.
  let S = { geladen: false, installiert: true, konto: false, helden: [], start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] };
  let laedt = null;
  const hoerer = new Set();
  const melden = () => hoerer.forEach((f) => { try { f(S); } catch (e) { console.warn("[Sammlung]", e); } });

  /** Eigene Sammlung laden (neu: Zwischenspeicher übergehen) */
  function laden(neu) {
    if (S.geladen && !neu) return Promise.resolve(S);
    if (laedt) return laedt;
    laedt = (async () => {
      try {
        const r = await rpc("rpg_my_heroes", {});
        S = Object.assign({ helden: [], angebote: [], enden: [], alle_enden: {}, titel: [] }, r, { geladen: true, installiert: true, konto: Boolean(r && r.konto) });
      } catch (e) {
        // Fehlt die Migration, bleibt alles wie bisher. Bei anderen Fehlern (Netz) niemanden aussperren.
        S = { geladen: true, installiert: !fehlt(e), konto: false, helden: [], start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [], fehler: fehlt(e) ? null : e.message, offline: !fehlt(e) };
      }
      melden();
      return S;
    })().finally(() => { laedt = null; });
    return laedt;
  }
  /** Ist ein Held in der eigenen Sammlung (bzw. im Starter-Set) verfügbar? */
  function frei(fid) {
    if (!S.geladen || !S.installiert || S.offline) return true;
    return S.konto ? S.helden.includes(fid) : STARTER.includes(fid);
  }
  const anzahl = () => (S.konto ? S.helden.length : STARTER.length);

  /* ---------- Spieltisch: wessen Sammlung gilt? ---------- */
  // Mit Kampagne: die des Hosts (auch auf einem übernommenen Tisch-Gerät). Ohne Kampagne: die eigene.
  let T = { kampagne: undefined, frei: null }; // frei: null = alle Helden
  async function tischLaden(kampagne) {
    kampagne = kampagne || null;
    if (!kampagne) { await laden(); T = { kampagne: null, frei: !S.installiert || S.offline ? null : S.konto ? S.helden.slice() : STARTER.slice() }; return T; }
    try {
      const r = await rpc("rpg_campaign_heroes", { p_campaign_id: kampagne });
      T = { kampagne, frei: r && r.konto ? r.helden || [] : STARTER.slice() };
    } catch (e) {
      // Migration fehlt oder keine Verbindung: niemanden aussperren. Sonst (z. B. nicht Tisch dieser Kampagne): eigene Sammlung.
      if (fehlt(e) || !/Spieltisch/.test(e.message || "")) T = { kampagne, frei: null };
      else { await laden(); T = { kampagne, frei: !S.installiert || S.offline ? null : S.konto ? S.helden.slice() : STARTER.slice() }; }
    }
    melden();
    return T;
  }
  const tischFrei = (fid) => !T.frei || T.frei.includes(fid);
  const tischBekannt = () => T.kampagne !== undefined;

  /* ---------- Karten-Bühne (Registrierung, Belohnung) ---------- */
  let sperre = false;
  function buehne() {
    let b = $("#sm-buehne");
    if (!b) {
      b = document.createElement("div"); b.id = "sm-buehne"; b.className = "sm-buehne"; b.setAttribute("role", "dialog"); b.setAttribute("aria-modal", "true");
      document.body.appendChild(b);
    }
    b.hidden = false; document.documentElement.classList.add("sm-offen");
    return b;
  }
  function schliessen() {
    const b = $("#sm-buehne"); if (b) { b.hidden = true; b.innerHTML = ""; b.style.removeProperty("--bild"); }
    detailZu(); document.documentElement.classList.remove("sm-offen"); sperre = false;
  }
  function zaehlerHtml() {
    const n = S.konto ? S.helden.length : 0, u = 2 * Math.PI * 16;
    return `<span class="sm-zaehler" id="sm-zaehler" title="Helden in deiner Sammlung"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="sm-ring-hg"/><circle cx="20" cy="20" r="16" class="sm-ring" stroke-dasharray="${(u * n / 15).toFixed(1)} ${u.toFixed(1)}"/></svg><b>${n}</b><small>von 15</small></span>`;
  }
  function rahmen(inhalt, o = {}) {
    const b = buehne();
    if (o.bild) b.style.setProperty("--bild", `url('${o.bild}')`); else b.style.removeProperty("--bild");
    b.innerHTML = `<div class="sm-hg" aria-hidden="true"></div><header class="sm-kopf"><span class="sm-logo">MYTHARA</span><span class="sm-kopf-titel">${esc(o.kopf || "Heldensammlung")}</span>${zaehlerHtml()}</header><div class="sm-inhalt">${inhalt}</div>`;
    b.scrollTop = 0;
    return b;
  }
  function karte(fid, extra = "") {
    const d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse];
    return `<div class="sm-karte verdeckt ${extra}" data-sm-fid="${fid}" role="button" tabindex="0" aria-label="${esc(d.name)} ansehen"><div class="sm-innen">
      <div class="sm-vorne" style="background-image:url('${F.bild(fid)}');--rand:${k.farbe};--kf:${k.farbe}"><span class="sm-klasse">${esc(k.name)}</span>${extra.includes("eingebucht") ? '<span class="sm-drin">✓ Eingebucht</span>' : ""}
        <div class="sm-info"><h3>${esc(d.name)}</h3><div class="sm-titel">${esc(d.titel)}</div><div class="sm-rolle">${esc(d.rolle)}</div>${extra.includes("eingebucht") ? "" : '<span class="sm-lupe">ANSEHEN ›</span>'}</div></div>
      <div class="sm-hinten"><span>M</span></div></div></div>`;
  }
  function aufdecken(el) { el.querySelectorAll(".sm-karte.verdeckt").forEach((k, i) => setTimeout(() => k.classList.remove("verdeckt"), 350 + i * 320)); }
  const runden = (fertig, jetzt) => `<div class="sm-runden">${[0, 1, 2].map((i) => `<i class="${i < fertig ? "fertig" : i === jetzt ? "jetzt" : ""}"></i>`).join("")}</div>`;

  /** Große Vorstellung eines Helden über der Bühne. einbuchen: Rückruf für den Knopf (sonst nur ansehen) */
  function detail(fid, o = {}) {
    if (sperre) return;
    const HL = window.ABH_HELDEN, d = F.FIGUREN[fid];
    let s = $("#sm-detail");
    if (!s) { s = document.createElement("div"); s.id = "sm-detail"; s.className = "sm-detail-schleier"; document.body.appendChild(s); s.addEventListener("click", (e) => { if (e.target === s) detailZu(); }); }
    const gesperrt = o.gesperrt ? `<div class="sm-gesperrt">${SCHLOSS}<span><b>Noch gesperrt.</b> ${esc(o.gesperrt)}</span></div>` : "";
    const knopf = o.einbuchen ? `<div class="sm-detail-knoepfe"><button class="btn ghost" data-sm-zu>Zurück zur Auswahl</button><button class="btn gross" id="sm-ein">${esc(d.name)} einbuchen</button></div>` : gesperrt;
    s.innerHTML = `<div class="sm-detail-box"><button class="sm-x" data-sm-zu aria-label="Schließen">✕</button>${HL ? HL.detail(fid, 1, knopf) : `<h2>${esc(d.name)}</h2>${knopf}`}</div>`;
    if (o.gesperrt) s.querySelector(".held").classList.add("gesperrt");
    s.hidden = false; requestAnimationFrame(() => s.classList.add("an"));
    s.querySelectorAll("[data-sm-zu]").forEach((b) => { b.onclick = detailZu; });
    const ein = $("#sm-ein"); if (ein) ein.onclick = () => { if (sperre) return; sperre = true; detailZu(); o.einbuchen(); };
  }
  function detailZu() { const s = $("#sm-detail"); if (s) { s.classList.remove("an"); s.hidden = true; s.innerHTML = ""; } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") detailZu(); });

  /** Gewählte Karte fliegt in den Zähler, die anderen sinken weg */
  function einfliegen(k, fid) {
    return new Promise((fertig) => {
      const alle = [...k.parentElement.querySelectorAll(".sm-karte")].filter((x) => x !== k);
      alle.forEach((x) => x.classList.add("weg")); k.classList.add("gewaehlt");
      setTimeout(() => {
        const r = k.getBoundingClientRect(), zEl = $("#sm-zaehler"), z = zEl ? zEl.getBoundingClientRect() : { left: innerWidth - 60, top: 10 };
        const f = document.createElement("div"); f.className = "sm-flieg"; f.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;background-image:url('${F.bild(fid)}')`;
        document.body.appendChild(f); k.style.visibility = "hidden";
        requestAnimationFrame(() => requestAnimationFrame(() => { Object.assign(f.style, { left: z.left + "px", top: z.top + "px", width: "40px", height: "40px", opacity: ".2" }); }));
        setTimeout(() => { f.remove(); fertig(); }, 950);
      }, 650);
    });
  }
  function karteBinden(el, beimEinbuchen) {
    el.querySelectorAll(".sm-karte[data-sm-fid]").forEach((k) => {
      const fid = k.dataset.smFid, auf = () => { if (!k.classList.contains("verdeckt")) detail(fid, beimEinbuchen ? { einbuchen: () => beimEinbuchen(k, fid) } : {}); };
      k.onclick = auf; k.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auf(); } };
    });
  }
  /** Held einbuchen: Animation und Server parallel, danach Sammlung neu laden */
  async function einbuchen(k, fid, angebot) {
    let ergebnis = null, fehler = null;
    await Promise.all([einfliegen(k, fid), rpc("rpg_hero_pick", { p_offer_id: angebot.id, p_hero: fid }).then((r) => { ergebnis = r; }, (e) => { fehler = e; })]);
    await laden(true);
    const z = $("#sm-zaehler"); if (z) { z.outerHTML = zaehlerHtml(); const n = $("#sm-zaehler"); n.classList.add("puls"); }
    sperre = false;
    if (fehler) { toast(fehler.message); return null; }
    return ergebnis;
  }

  /* ---------- Registrierung: drei Runden, dann Übersicht ---------- */
  let regFertig = null;
  /** Startrunden zeigen (nach dem Erstellen des Kontos oder wenn sie noch offen sind). fertig() nach „Weiter“. */
  async function registrierung(fertig) {
    if (fertig) regFertig = fertig;
    await laden();
    if (!S.installiert || !S.konto) { schliessen(); if (regFertig) regFertig(); return; }
    rahmen(`<p class="sm-eyebrow">Registrierung</p><h1 class="sm-gross">Deine Helden werden gemischt …</h1>`, { kopf: "Registrierung" });
    let r;
    try { r = await rpc("rpg_hero_start_offer", {}); }
    catch (e) {
      rahmen(`<p class="sm-eyebrow">Registrierung</p><h1 class="sm-gross">Das hat nicht geklappt</h1><p class="sm-unter">${esc(e.message)}</p>
        <div class="sm-knoepfe"><button class="btn ghost" id="sm-spaeter">Später</button><button class="btn gross" id="sm-nochmal">Noch einmal</button></div>`, { kopf: "Registrierung" });
      $("#sm-nochmal").onclick = () => registrierung(); $("#sm-spaeter").onclick = () => { schliessen(); if (regFertig) regFertig(); };
      return;
    }
    if (r.fertig) return zusammenfassung((r.helden || []).slice(0, 3));
    const runde = r.runde, a = r.angebot;
    const el = rahmen(`<p class="sm-eyebrow">Registrierung · Runde ${runde} von 3</p><h1 class="sm-gross">Wähle deinen ${["ersten", "zweiten", "dritten"][runde - 1] || "nächsten"} Helden</h1>
      <p class="sm-unter">Drei Helden bieten dir ihre Klinge an. Tippe eine Karte an, um sie dir genau anzusehen, und buche den ein, mit dem du losziehen willst.</p>
      ${runden(runde - 1, runde - 1)}
      <div class="sm-reihe" id="sm-reihe">${a.helden.map((f) => karte(f)).join("")}</div>
      <p class="sm-hinweis">Die Wahl ist endgültig. Die beiden anderen bleiben im Pool und können später als Belohnung wieder auftauchen.</p>`, { kopf: "Registrierung" });
    aufdecken(el);
    karteBinden(el, async (k, fid) => {
      if (!a.helden.includes(fid)) { sperre = false; return; }
      await einbuchen(k, fid, a);
      registrierung();
    });
  }
  function zusammenfassung(helden) {
    const el = rahmen(`<p class="sm-eyebrow">Registrierung abgeschlossen</p><h1 class="sm-gross">Deine Helden sind eingebucht</h1>
      ${runden(3, -1)}
      <div class="sm-reihe drei">${helden.map((f) => karte(f, "eingebucht")).join("")}</div>
      <p class="sm-unter">Ab sofort stehen sie dir unter <b>Charaktere</b> zur Verfügung. Jedes Kampagnen-Ende, das du zum ersten Mal erreichst, bringt einen neuen Helden dazu.</p>
      <div class="sm-knoepfe"><button class="btn gross sm-weiter" id="sm-weiter">Weiter</button></div>`, { kopf: "Registrierung" });
    aufdecken(el); karteBinden(el, null);
    $("#sm-weiter").onclick = () => { schliessen(); const f = regFertig; regFertig = null; if (f) f(); };
  }

  /* ---------- Belohnung nach einem Kampagnen-Ende ---------- */
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const gemeldet = new Set();
  /**
   * Ende für das eigene Konto melden und das Ergebnis zeigen.
   * Der Spieltisch setzt die Kampagne erst nach dem Speichern auf „abgeschlossen“: Darum mehrmals versuchen.
   * o.still: nur melden, nichts zeigen, wenn es nichts Neues gibt (Nachholen auf der Startseite).
   */
  async function endeMelden(kampagne, o = {}) {
    if (!kampagne) return null;
    await laden();
    if (!S.installiert || !S.konto) return null;
    let r = null;
    for (let i = 0; i < (o.versuche || 6); i++) {
      try { r = await rpc("rpg_claim_ending", { p_campaign_id: kampagne }); break; }
      catch (e) {
        if (fehlt(e)) return null;
        if (/noch nicht abgeschlossen/.test(e.message) && i < (o.versuche || 6) - 1) { await warte(2500 + i * 1500); continue; }
        return null; // Niederlage, zu kurz, nicht dabei: kein gewertetes Ende
      }
    }
    if (!r || !r.konto) return null;
    gemeldet.add(kampagne);
    await laden(true);
    if (r.schon_gemeldet && !r.angebot) return r; // schon gemeldet und nichts mehr offen: nichts erneut zeigen
    if (o.still && !r.neu) return r;               // Nachholen: ein bekanntes Ende nicht nachträglich anzeigen
    if (o.knopf) { endeErgebnis = { kampagne, r }; endePlatzFuellen(); if (r.neu) toast(r.angebot ? "Neues Ende entdeckt: Ein neuer Held wartet auf dich!" : "Neues Ende entdeckt!"); return r; }
    belohnung(r, o);
    return r;
  }
  /* Spieltisch: Die Endszene bleibt stehen, darunter ein Knopf zur Belohnung (Platzhalter [data-sm-endeplatz]) */
  let endeErgebnis = null;
  function endeKnopf() {
    const k = window.KAMPAGNE && window.KAMPAGNE.aktuell && window.KAMPAGNE.aktuell();
    if (!endeErgebnis || !k || k.id !== endeErgebnis.kampagne) return "";
    const r = endeErgebnis.r;
    return `<button class="btn gross sm-ende-knopf" data-sm-belohnung>${r.neu ? (r.angebot ? "★ Belohnung: neuer Held" : "★ Neues Ende entdeckt") : "Euer Fortschritt"}</button>`;
  }
  function endePlatzFuellen() { document.querySelectorAll("[data-sm-endeplatz]").forEach((p) => { p.innerHTML = endeKnopf(); }); }
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-sm-belohnung]") || !endeErgebnis) return;
    const { r } = endeErgebnis;
    // Ist das Angebot inzwischen gewählt (z. B. auf einem anderen Gerät), zeigt laden() es nicht mehr als offen
    if (r.angebot && !(S.angebote || []).some((a) => a.id === r.angebot.id)) r.angebot = null;
    belohnung(r, { fertig: endePlatzFuellen });
  });
  /** Ergebnis von rpg_claim_ending (oder ein offenes Angebot) zeigen */
  function belohnung(r, o = {}) {
    const K = KAMPAGNEN[r.abenteuer] || { titel: "", enden: {} }, endName = K.enden[r.ende] || "";
    const bild = bildVon(r.abenteuer), kopf = K.titel || "Kampagne";
    const zu = () => { schliessen(); if (o.fertig) o.fertig(); };
    const fortschritt = () => `${r.gefunden} von ${r.gesamt} Enden`;
    const alleEnden = r.gesamt && r.gefunden >= r.gesamt;
    const titelHtml = () => alleEnden
      ? `<div class="sm-siegel"><div class="sm-zeichen">♛</div><b>${esc(TITEL[r.abenteuer] || "")}</b><small>${esc(K.titel)} · ${fortschritt()}</small></div>
         <p class="sm-unter">Ihr habt alle Enden dieser Kampagne gefunden. Ab sofort trägst du den Titel <b>„${esc(TITEL[r.abenteuer] || "")}“</b>. Er erscheint neben deinem Namen.</p>`
      : "";
    const schritt0 = () => {
      if (!r.neu) {
        const rest = (r.gesamt || 0) - (r.gefunden || 0);
        const el = rahmen(`<p class="sm-eyebrow">Kampagne abgeschlossen${endName ? " · Ende: " + esc(endName) : ""}</p><h1 class="sm-gross">Sieg</h1><p class="sm-unter">${esc(K.titel)}.</p>
          <div class="sm-box">Dieses Ende hast du schon einmal erreicht. Einen neuen Helden gibt es nur für ein Ende, das du zum ersten Mal erreichst. ${rest <= 0 ? `Alle Enden von „${esc(K.titel)}“ hast du schon entdeckt.` : `In „${esc(K.titel)}“ wartet noch ${rest === 1 ? "ein weiteres Ende" : rest + " weitere Enden"}.`}</div>
          <div class="sm-knoepfe"><button class="btn gross" id="sm-zu">Weiter</button></div>`, { kopf, bild });
        el.querySelector("#sm-zu").onclick = zu; return;
      }
      const voll = !r.angebot;
      const el = rahmen(`<p class="sm-eyebrow">Kampagne abgeschlossen${endName ? " · Ende: " + esc(endName) : ""}</p><h1 class="sm-gross">Sieg</h1><p class="sm-unter">${esc(K.titel)} · ${fortschritt()} entdeckt.</p>
        <div class="sm-box"><b>Neues Ende entdeckt.</b> Zum ersten Mal hast du „${esc(endName)}“ erreicht. ${voll ? "Deine Sammlung ist schon vollständig, deshalb gibt es keinen neuen Helden. Das Ende zählt aber für deinen Kampagnentitel." : "Dafür schließt sich dir ein neuer Held an."}</div>
        <div class="sm-knoepfe"><button class="btn gross" id="sm-weiter">${voll ? "Weiter" : "Belohnung ansehen"}</button></div>`, { kopf, bild });
      el.querySelector("#sm-weiter").onclick = voll ? schrittVoll : schrittWahl;
    };
    const schrittVoll = () => {
      const el = rahmen(`<p class="sm-eyebrow">Sammlung vollständig · alle 15 Helden</p><h1 class="sm-gross">${alleEnden ? "Alle Enden gefunden" : "Neues Ende entdeckt"}</h1>
        ${alleEnden ? titelHtml() : `<div class="sm-siegel"><div class="sm-zeichen">✦</div><b>${esc(endName)}</b><small>${esc(K.titel)} · ${fortschritt()}</small></div>
        <p class="sm-unter">Wer alle ${r.gesamt} Enden dieser Kampagne findet, bekommt den Titel „${esc(TITEL[r.abenteuer] || "")}“. Deinen Fortschritt siehst du unter Charaktere.</p>`}
        <div class="sm-knoepfe"><button class="btn gross" id="sm-zu">Weiter</button></div>`, { kopf, bild });
      el.querySelector("#sm-zu").onclick = zu;
    };
    const schrittWahl = () => {
      const a = r.angebot;
      const el = rahmen(`<p class="sm-eyebrow">Belohnung · neues Ende</p><h1 class="sm-gross">Wähle einen neuen Helden</h1><p class="sm-unter">Einer von ${a.helden.length === 1 ? "einem" : a.helden.length === 2 ? "zweien" : "dreien"} schließt sich dir dauerhaft an. Sieh sie dir an und entscheide dich.</p>
        <div class="sm-reihe" id="sm-reihe">${a.helden.map((f) => karte(f)).join("")}</div>
        <div class="sm-knoepfe"><button class="btn ghost klein" id="sm-spaeter">Später wählen</button></div>
        <p class="sm-hinweis">Wählst du jetzt nicht, wartet die Belohnung auf der Startseite auf dich.</p>`, { kopf, bild });
      aufdecken(el);
      el.querySelector("#sm-spaeter").onclick = zu;
      karteBinden(el, async (k, fid) => {
        if (!a.helden.includes(fid)) { sperre = false; return; }
        const e = await einbuchen(k, fid, a);
        if (e) schrittNeu(fid); else schrittWahl();
      });
    };
    const schrittNeu = (fid) => {
      const d = F.FIGUREN[fid];
      const el = rahmen(`<p class="sm-eyebrow">Neu in deiner Sammlung</p><h1 class="sm-gross">${esc(d.name)}</h1><div class="sm-reihe">${karte(fid, "eingebucht")}</div>
        <p class="sm-unter">${S.helden.length} von 15 Helden. In der nächsten Kampagne steht ${esc(d.name)} zur Wahl.</p>
        ${alleEnden ? titelHtml() : ""}
        <div class="sm-knoepfe"><button class="btn gross" id="sm-zu">Weiter</button></div>`, { kopf, bild });
      aufdecken(el); karteBinden(el, null);
      el.querySelector("#sm-zu").onclick = zu;
    };
    if (o.direktWahl && r.angebot) schrittWahl(); else schritt0();
  }
  /** Offene Belohnung (z. B. nach „Später wählen“) auf der Startseite anbieten */
  function offeneBelohnung(fertig) {
    const a = (S.angebote || []).find((x) => x.art === "ende");
    if (!a) return false;
    const gef = (S.enden || []).filter((e) => e.abenteuer === a.abenteuer).length;
    belohnung({ konto: true, neu: true, abenteuer: a.abenteuer, ende: a.ende, angebot: a, gefunden: gef, gesamt: (S.alle_enden || {})[a.abenteuer] || 0, sammlung: S.helden.length }, { direktWahl: true, fertig });
    return true;
  }
  /** Abgeschlossene Kampagnen nachmelden (z. B. Handy war beim Ende schon zu). Pro Kampagne einmal je Gerät. */
  async function nachholen(liste) {
    await laden();
    if (!S.installiert || !S.konto || !Array.isArray(liste)) return;
    let gesehen = [];
    try { gesehen = JSON.parse(localStorage.getItem("ab_enden_gemeldet") || "[]"); } catch (e) { /* privat */ }
    const offen = liste.filter((c) => c.status === "abgeschlossen" && (c.role === "host" || c.role === "spieler") && !gesehen.includes(c.id) && !gemeldet.has(c.id));
    for (const c of offen) {
      const r = await endeMelden(c.id, { still: true, versuche: 1 });
      gesehen.push(c.id);
      try { localStorage.setItem("ab_enden_gemeldet", JSON.stringify(gesehen.slice(-200))); } catch (e) { /* privat */ }
      if (r && !(r.schon_gemeldet && !r.angebot)) return; // eine Belohnung auf einmal
    }
  }

  /* ---------- Freischalt-Code ---------- */
  async function codeEinloesen(code) {
    const r = await rpc("rpg_redeem_unlock_code", { p_code: code });
    if (r && r.fehler) throw new Error(r.fehler);
    await laden(true);
    return r;
  }

  /* ---------- Code-Übersicht für Admins (Admin wird nur per SQL festgelegt, der Server prüft jeden Aufruf) ---------- */
  const istAdmin = () => Boolean(S.geladen && S.installiert && S.konto && S.admin);
  const adminCodes = () => rpc("rpg_admin_codes", {});
  const adminErstellen = (o) => rpc("rpg_admin_create_code", { p_label: o.bezeichnung, p_fuer: o.fuer || null, p_max_uses: o.anzahl || 1, p_valid_days: o.tage || 90 });
  const adminSperren = (id) => rpc("rpg_admin_disable_code", { p_id: id });

  /* ---------- Sammlung als Seite (Charaktere im Hub) ---------- */
  /** Fortschritt je Kampagne: gefundene Enden */
  function endenHtml() {
    if (!S.konto) return "";
    return `<div class="sm-enden">${Object.entries(KAMPAGNEN).map(([ab, v]) => {
      const n = (S.alle_enden || {})[ab] || Object.keys(v.enden).length, g = (S.enden || []).filter((e) => e.abenteuer === ab).length, titel = (S.titel || []).includes(ab);
      return `<div class="sm-ende-chip ${titel ? "titel" : ""}" style="--bild:url('${bildVon(ab)}')"><b>${esc(v.titel)}</b><span>${g} von ${n} Enden${titel ? ` · ♛ ${esc(TITEL[ab])}` : ""}</span><i style="width:${n ? (g / n) * 100 : 0}%"></i></div>`;
    }).join("")}</div>`;
  }
  const gesperrtText = () => (S.konto ? "Jedes Kampagnen-Ende, das du zum ersten Mal erreichst, schaltet einen Helden frei: Du wählst aus drei Angeboten." : "Ohne Konto spielst du mit fünf Starter-Helden. Mit einem Spielerkonto baust du dir deine eigene Sammlung auf.");
  /** Neuester Kampagnentitel des Kontos (für den Kopf der Startseite) */
  const titelText = () => { const t = (S.titel || []).slice(-1)[0]; return t ? TITEL[t] : ""; };

  window.ABSAMMLUNG = {
    STARTER, TITEL, KAMPAGNEN, SCHLOSS,
    netzSetzen: (fn) => { netzQuelle = fn; },
    laden, frei, anzahl, zustand: () => S, beiAenderung: (fn) => { hoerer.add(fn); return () => hoerer.delete(fn); },
    aktiv: () => S.geladen && S.installiert && !S.offline,
    tischLaden, tischFrei, tischBekannt, tischAlleFrei: () => !T.frei,
    registrierung, endeMelden, offeneBelohnung, nachholen, codeEinloesen,
    detail, schliessen, endenHtml, gesperrtText, titelText, endeKnopf,
    istAdmin, adminCodes, adminErstellen, adminSperren,
  };
})();
