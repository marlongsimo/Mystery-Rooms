/*
 * Mythara – Startbildschirm des RPG: als Gast spielen (ohne Registrierung, mit Einladungscode, per QR-Code)
 * oder – später – als Spieler mit Konto anmelden.
 * Spielerkonten mit Benutzername und Passwort (siehe abenteuer/UMSETZUNG-KAMPAGNEN.md, Bauabschnitt B).
 */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const KONTEN = true; // Spielerkonten sind freigeschaltet
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zeige = (id) => window.AB && window.AB.zeigeSektion ? window.AB.zeigeSektion(id) : null;
  // Raum-Codes haben 10 Zeichen (ABEN-123456), Kampagnen-Codes für Gäste und Tisch-Geräte 12 (K7QM-2XHP-9RTA)
  const sauber = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const huebsch = (v) => { const c = sauber(v); return c.length > 10 ? c.slice(0, 4) + "-" + c.slice(4, 8) + "-" + c.slice(8) : c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; };
  /** Code öffnen: Raum-Code → Handy; Kampagnen-Code → als Gast mitspielen (Handy) oder dieses Gerät wird der Spieltisch */
  async function codeLos(code, fb) {
    if (code.length === 10) { location.href = "handy.html#" + huebsch(code); return; }
    if (code.length !== 12) return fb("Bitte den vollständigen Code eingeben – z. B. ABEN-123456 oder K7QM-2XHP-9RTA.");
    fb("Code wird geprüft …"); code = huebsch(code); // immer als XXXX-XXXX-XXXX (so wurde er erzeugt)
    let info; try { info = await netz().rpc("rpg_link_info", { p_token: code }); } catch (e) { return fb(e.message); }
    if (!info) return fb("Dieser Code ist abgelaufen oder ungültig.");
    if (info.art === "gast") { location.href = "handy.html?k=" + encodeURIComponent(code); return; }
    if (!window.KAMPAGNE || !confirm(`Dieses Gerät wird der Spieltisch von „${info.titel}“. Weiter?`)) return fb("");
    $("#qr-overlay").hidden = true; fb("");
    try { await window.KAMPAGNE.tischUebernehmen(code); } catch (e) { fb(e.message); toast(e.message); }
  }

  /* ---------- Konto: Benutzername und Passwort (Bauabschnitt B) ---------- */
  // Supabase braucht für Passwörter eine E-Mail: Jedes Konto hat eine interne Platzhalter-Adresse
  // (siehe abenteuer/supabase/002_rpg_profile.sql), die niemand sieht und an die nie Mails gehen.
  const ICO = {
    person: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v11H5z"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    auge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3.2" fill="#0d0b08"/></svg>',
    neu: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7.5" r="4"/><path d="M1 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/><path d="M19 8v6M16 11h6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };
  const NAME = /^[A-Za-z0-9_ÄÖÜäöüß]{3,20}$/;
  const netz = () => window.AB.liveClient();
  let profil = null, ansicht = "anmelden"; // anmelden | registrieren
  const feld = (id, ico, typ, platz, auto, extra = "") => `<label class="my-feld"><span class="my-ico">${ICO[ico]}</span><input type="${typ}" id="${id}" autocomplete="${auto}" placeholder="${platz}" aria-label="${platz}" ${extra}>${typ === "password" ? `<button type="button" class="my-auge" data-auge="${id}" aria-label="Passwort anzeigen"><span class="my-ico">${ICO.auge}</span></button>` : ""}</label>`;
  const fb = (t, art = "") => { const e = $("#my-konto-fb"); if (e) { e.textContent = t; e.dataset.art = art; } };

  async function profilLaden() {
    try { await netz().ensureUser(); profil = await netz().rpc("rpg_my_profile", {}); } catch (e) { profil = null; }
    // Ausstattung (Würfel, Profilrahmen): mit Konto die gespeicherte Auswahl holen, als Gast zurück auf Standard
    if (window.ABKOS) { if (profil && profil.konto) window.ABKOS.laden().catch(() => {}); else if (profil) window.ABKOS.zuruecksetzen(); }
    return profil;
  }
  function kontoZeichnen() {
    const el = $("#my-konto-inhalt"), reg = $("#my-registrieren"), titel = $("#my-konto-titel");
    if (!KONTEN) {
      el.innerHTML = `<p class="my-bald">Spielerkonten kommen bald. Dann bleiben deine Charaktere und Kampagnen auf allen Geräten gespeichert.</p>
        <p class="my-bald klein">Bis dahin spielst du als Gast. Deine Kampagnen werden in diesem Browser gespeichert.</p>`;
      reg.innerHTML = "";
      return;
    }
    if (profil && profil.konto) {
      titel.textContent = "Willkommen zurück";
      el.innerHTML = `<p class="my-angemeldet">Angemeldet als <b>${esc(profil.handle)}</b></p>
        <p class="my-bald klein">Deine Kampagnen sind mit deinem Konto verbunden und auf jedem Gerät verfügbar, auf dem du dich anmeldest.</p>
        ${codeFormHtml("my")}
        <button class="my-knopf" type="button" id="my-abmelden">Abmelden</button>
        <p class="my-fb" id="my-konto-fb" role="status"></p>`;
      reg.innerHTML = "";
      $("#my-abmelden").onclick = abmelden;
      codeFormBinden("my");
      return;
    }
    if (ansicht === "registrieren") {
      titel.textContent = "Konto erstellen";
      el.innerHTML = `<form class="my-anmelden" id="my-reg-form" novalidate>
          ${feld("my-reg-name", "person", "text", "Benutzername", "username", 'maxlength="20" autocapitalize="off" spellcheck="false"')}
          <p class="my-name-info" id="my-name-info">3–20 Zeichen: Buchstaben, Ziffern oder _. Diesen Namen sehen deine Mitspieler.</p>
          ${feld("my-reg-pw", "schloss", "password", "Passwort (mind. 8 Zeichen)", "new-password", 'minlength="8"')}
          ${feld("my-reg-pw2", "schloss", "password", "Passwort wiederholen", "new-password")}
          <p class="my-bald klein">Merke dir dein Passwort gut: Ohne hinterlegte E-Mail kann es nicht zurückgesetzt werden.${profil && profil.handle ? "" : ""}</p>
          <button class="my-knopf rot" type="submit">Konto erstellen</button>
          <button class="my-link" type="button" id="my-zur-anmeldung">Ich habe schon ein Konto</button>
          <p class="my-fb" id="my-konto-fb" role="status"></p>
        </form>`;
      reg.innerHTML = "";
      let pruefTimer = null;
      $("#my-reg-name").addEventListener("input", (e) => {
        const v = e.target.value.trim(), info = $("#my-name-info"); clearTimeout(pruefTimer);
        if (!v) { info.textContent = "3–20 Zeichen: Buchstaben, Ziffern oder _. Diesen Namen sehen deine Mitspieler."; info.dataset.art = ""; return; }
        if (!NAME.test(v)) { info.textContent = "Nur 3–20 Zeichen: Buchstaben, Ziffern oder _ (keine Leerzeichen)."; info.dataset.art = "fehler"; return; }
        info.textContent = "Wird geprüft …"; info.dataset.art = "";
        pruefTimer = setTimeout(async () => {
          try {
            const r = await netz().rpc("rpg_handle_frei", { p_handle: v });
            if ($("#my-reg-name").value.trim() !== v) return;
            info.textContent = r === "frei" ? `✓ „${v}“ ist frei.` : r === "gesperrt" ? "Dieser Name ist nicht erlaubt." : r === "vergeben" ? `„${v}“ ist schon vergeben.` : "Ungültiger Name.";
            info.dataset.art = r === "frei" ? "ok" : "fehler";
          } catch (err) { info.textContent = err.message; info.dataset.art = "fehler"; }
        }, 350);
      });
      $("#my-reg-form").onsubmit = (e) => { e.preventDefault(); registrieren(); };
      $("#my-zur-anmeldung").onclick = () => { ansicht = "anmelden"; kontoZeichnen(); };
    } else {
      titel.textContent = "Als Spieler anmelden";
      el.innerHTML = `<form class="my-anmelden" id="my-anmelden" novalidate>
          ${feld("my-name", "person", "text", "Benutzername", "username", 'maxlength="20" autocapitalize="off" spellcheck="false"')}
          ${feld("my-pw", "schloss", "password", "Passwort", "current-password")}
          <button class="my-knopf rot" type="submit">Anmelden</button>
          <button class="my-link" type="button" id="my-vergessen">Passwort vergessen?</button>
          <p class="my-fb" id="my-konto-fb" role="status"></p>
        </form>`;
      reg.innerHTML = `<button class="my-reg-knopf" id="my-reg"><span class="my-ico gross">${ICO.neu}</span>Noch kein Konto? <b>Jetzt registrieren</b><span aria-hidden="true" class="my-pfeil">→</span></button>`;
      $("#my-anmelden").onsubmit = (e) => { e.preventDefault(); anmelden(); };
      $("#my-vergessen").onclick = () => fb("Ohne hinterlegte E-Mail lässt sich das Passwort leider nicht zurücksetzen. Eine E-Mail im Konto zu hinterlegen, wird später möglich.");
      $("#my-reg").onclick = () => { ansicht = "registrieren"; kontoZeichnen(); $("#my-reg-name").focus(); };
    }
    el.querySelectorAll("[data-auge]").forEach((b) => { b.onclick = () => { const i = $("#" + b.dataset.auge); i.type = i.type === "password" ? "text" : "password"; }; });
  }
  /** Nach An- oder Abmelden ist ein anderer Nutzer aktiv: Gerätebezogenes (aktive Kampagne) vergessen und neu laden */
  function neuStarten() { try { localStorage.removeItem("ab_kampagne"); } catch (e) { /* privat */ } location.reload(); }

  async function registrieren() {
    const name = $("#my-reg-name").value.trim(), pw = $("#my-reg-pw").value, pw2 = $("#my-reg-pw2").value;
    if (!NAME.test(name)) return fb("Bitte einen gültigen Benutzernamen wählen (3–20 Zeichen: Buchstaben, Ziffern oder _).", "fehler");
    if (pw.length < 8) return fb("Das Passwort braucht mindestens 8 Zeichen.", "fehler");
    if (pw !== pw2) return fb("Die beiden Passwörter stimmen nicht überein.", "fehler");
    const knopf = $("#my-reg-form .my-knopf"); knopf.disabled = true; fb("Konto wird erstellt …");
    try {
      await netz().ensureUser();
      const p = await netz().rpc("rpg_set_profile", { p_handle: name });            // reserviert den Namen für diesen Gast
      const { error } = await netz().db.auth.updateUser({ email: p.anmeldung, password: pw }); // Gast wird Konto (gleiche ID, Kampagnen bleiben)
      if (error) throw new Error(/password/i.test(error.message) && /weak|short|least/i.test(error.message) ? "Dieses Passwort ist zu schwach. Bitte ein längeres wählen." : error.message);
      await profilLaden();
      if (!profil || !profil.konto) throw new Error("Das Konto konnte nicht bestätigt werden. Ist in Supabase „Confirm email“ ausgeschaltet?");
      kontoZeichnen(); zeigeHub(); toast(`Willkommen, ${profil.handle}! Dein Konto ist eingerichtet.`);
      sammlungPruefen(true);
    } catch (e) { fb(e.message, "fehler"); knopf.disabled = false; }
  }
  async function anmelden() {
    const name = $("#my-name").value.trim(), pw = $("#my-pw").value;
    if (!name || !pw) return fb("Bitte Benutzername und Passwort eingeben.", "fehler");
    const knopf = $("#my-anmelden .my-knopf"); knopf.disabled = true; fb("Anmeldung …");
    try {
      await netz().ensureUser();
      const adresse = NAME.test(name) ? await netz().rpc("rpg_login_email", { p_handle: name }) : null;
      if (!adresse) throw new Error("Benutzername oder Passwort ist falsch.");
      const { error } = await netz().db.auth.signInWithPassword({ email: adresse, password: pw });
      if (error) throw new Error(/invalid/i.test(error.message) ? "Benutzername oder Passwort ist falsch." : error.message);
      neuStarten();
    } catch (e) { fb(e.message, "fehler"); knopf.disabled = false; }
  }
  async function abmelden() {
    if (!confirm("Abmelden? Danach spielst du auf diesem Gerät als Gast weiter.")) return;
    try { await netz().db.auth.signOut(); } catch (e) { /* trotzdem neu starten */ }
    if (window.ABKOS) window.ABKOS.zuruecksetzen();
    try { sessionStorage.removeItem(HUB); } catch (e) { /* privat */ }
    neuStarten();
  }

  /* ---------- Gast ---------- */
  function codeFeld(an) {
    const f = $("#my-code"); f.hidden = !an; $("#my-beitreten").hidden = !an;
    if (an) { const i = $("#my-code-feld"); i.focus(); }
  }
  function beitreten() {
    const f = $("#my-code");
    if (f.hidden) { codeFeld(true); return; }
    return codeLos(sauber($("#my-code-feld").value), (t) => { $("#my-code-fb").textContent = t; });
  }
  /** Code aus einem gescannten Link oder Text holen */
  function codeAus(text) {
    try { const u = new URL(text, location.href); const k = u.searchParams.get("k") || u.searchParams.get("tisch"); if (k) return sauber(k); if (u.hash.length > 1) return sauber(decodeURIComponent(u.hash.slice(1))); } catch (e) { /* kein Link */ }
    return sauber(text);
  }
  let strom = null;
  function scannerStopp() { if (strom) { strom.getTracks().forEach((t) => t.stop()); strom = null; } const s = $("#my-scanner"); s.hidden = true; s.innerHTML = ""; }
  async function scannen() {
    const s = $("#my-scanner");
    if (!s.hidden) { scannerStopp(); return; }
    s.hidden = false;
    const tipp = `<p class="my-scan-tipp">Am einfachsten: Richte die <b>Kamera deines Handys</b> auf den QR-Code am Spieltisch – der Link öffnet sich von selbst.</p>`;
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      s.innerHTML = tipp + `<p class="my-scan-tipp">Oder tippe auf „Mit Einladungscode beitreten“ und gib den Code ein, der unter dem QR-Code steht.</p>`;
      return;
    }
    s.innerHTML = tipp + `<video id="my-video" playsinline muted></video><button class="my-link" id="my-scan-zu">Scanner schließen</button>`;
    $("#my-scan-zu").onclick = scannerStopp;
    try {
      strom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = $("#my-video"); v.srcObject = strom; await v.play();
      const det = new window.BarcodeDetector({ formats: ["qr_code"] });
      const suche = async () => {
        if (!strom) return;
        try { const r = await det.detect(v); if (r.length) { const c = codeAus(r[0].rawValue); if (c.length >= 10) { scannerStopp(); codeLos(c, toast); return; } } } catch (e) { /* weiter */ }
        requestAnimationFrame(suche);
      };
      suche();
    } catch (e) {
      s.innerHTML = tipp + `<p class="my-scan-tipp">Die Kamera ist hier nicht verfügbar (${esc(e.message || "keine Erlaubnis")}). Gib den Code stattdessen von Hand ein.</p>`;
    }
  }

  /* ---------- Spielerseite (Konto oder Gast in dieser Gerätesitzung) ---------- */
  const HUB = "mythara_hub";
  const toast = (t) => window.AB && window.AB.toast(t);
  const imHub = () => { let g = null; try { g = sessionStorage.getItem(HUB); } catch (e) { /* privat */ } return Boolean((profil && profil.konto) || g); };
  const bildAbschnitt = (n, ab) => (ab && ab !== "grauwacht" ? ((window.ABS.metaVon(ab).abschnittBilder || {})[+n || 1] || window.ABS.metaVon(ab).vorschau || "img/mythara/karte-kampagnen.webp") : `img/mythara/abschnitt-${[1, 2, 3].includes(+n) ? +n : 1}.webp`);
  /** Bild mit Ersatz, solange für ein neues Abenteuer noch keine Bilder da sind */
  const BILD_ERSATZ = `onerror="this.onerror=null;this.src='img/mythara/karte-kampagnen.webp'"`;
  /** Alle Abenteuer (aus daten/*.js), leichtere zuerst */
  // Entwürfe (META.entwurf) nur mit ?entwurf in der Adresse
  const ENTWURF = new URLSearchParams(location.search).has("entwurf");
  const ABENTEUER = () => Object.values(window.ABD_ALLE || {}).map((d) => window.ABS.metaVon(d.META ? d.META.id : "grauwacht")).filter((m) => ENTWURF || !m.entwurf).sort((a, b) => (a.schwierigkeit || 1) - (b.schwierigkeit || 1) || (a.reihe || 0) - (b.reihe || 0)); // leichtere Abenteuer zuerst
  const titelbild = (m) => (m.bild || "img/mythara/karte-kampagnen.webp");
  /** Schwierigkeit einer Kampagne in Worten: „2 – Normal“ */
  const schwer = (n) => { const s = (window.ABF.SCHWIERIGKEIT || {})[n || 1]; return (n || 1) + (s ? " – " + s.name : ""); };
  const abenteuerKachel = (m, attr) => `<button class="hub-kachel welt" ${attr}="${m.id}"><img src="${titelbild(m)}" alt="" ${BILD_ERSATZ}><b>${esc(m.titel)}</b><small>${esc(m.kurztext || "")} <span class="hub-schwer">Schwierigkeit: ${esc(schwer(m.schwierigkeit))}</span> · ${m.min}–${m.max} Helden.</small>${attr === "data-welt" ? `<span class="hub-mehr">Zur Beschreibung →</span>` : ""}</button>`;
  const vor = (t) => {
    const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
    if (s < 90) return "gerade eben"; if (s < 3600) return `vor ${Math.round(s / 60)} Minuten`; if (s < 86400) return `vor ${Math.round(s / 3600)} Stunden`;
    const d = Math.round(s / 86400); return d === 1 ? "gestern" : d < 14 ? `vor ${d} Tagen` : `vor ${Math.round(d / 7)} Wochen`;
  };
  /* ---------- Eigene Seiten der Spielerseite: Helden, Regeln, Kampagnenwelt (ohne Spielablauf) ---------- */
  /* ---------- Händler: jeden Tag drei Helden, die man noch nicht hat (Migration 010) ---------- */
  const rpcFehlt = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  let shopUhr = null;
  /* Händler: Eingang mit zwei Feldern – Helden des Tages (mit Countdown bis zur neuen Auswahl) und Ausstattung */
  async function shopZeigen() {
    const A = window.ARENA, name = A ? A.WAEHRUNG : "Seelensplitter", zeichen = A ? A.ZEICHEN : "◈";
    clearInterval(shopUhr);
    seiteZeigen("shop", `<div class="shop" data-shop><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Einen Moment …</h1></div>`);
    let s = null, fehler = null;
    try { await netz().ensureUser(); s = await netz().rpc("rpg_shop_today", {}); } catch (e) { fehler = e; }
    if (!document.querySelector("[data-shop]")) return;
    if (fehler && !rpcFehlt(fehler)) return seiteZeigen("shop", `<div class="shop-bald"><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Keine Verbindung</h1><p class="hub-untertitel">${esc(fehler.message)}</p></div>`);
    if (s && !s.konto) return seiteZeigen("shop", `<div class="shop-bald"><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Nur für Spielerkonten</h1><p class="hub-untertitel">Der Händler tauscht ${name} gegen Helden und Ausstattung. Beides gibt es nur mit einem Konto.</p></div>`);
    const uhr = () => { if (!s || !s.bis) return ""; const ms = Math.max(0, new Date(s.bis).getTime() - Date.now()), h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), sek = Math.floor(ms % 60000 / 1000);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sek).padStart(2, "0")}`; };
    const offen = s ? s.helden.filter((h) => !h.gekauft).length : 0;
    seiteZeigen("shop", `<div class="shop" data-shop><div class="shop-kopf"><div><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Was darf es sein?</h1>
        <p class="hub-untertitel">${name} bekommst du für Siege in der Arena.</p></div>${s ? `<p class="shop-stand"><i>${zeichen}</i> ${s.waehrung} ${name}</p>` : ""}</div>
      <div class="shop-felder">
        <button class="shop-feld helden" data-shop-feld="helden" ${s ? "" : "disabled"}><span class="shop-feld-bilder">${s ? s.helden.slice(0, 3).map((h) => (window.ABF.FIGUREN[h.held] ? `<img src="${window.ABF.bild(h.held)}" alt="">` : "")).join("") : ""}</span>
          <b>Helden des Tages</b><span>${!s ? "Folgt bald." : s.alle ? "Du hast alle Helden." : offen ? `${offen === 1 ? "Ein Held" : offen + " Helden"}, die dir noch fehlen. Je ${s.preis} ${name}.` : "Heute ist nichts mehr für dich dabei."}</span>
          ${s && s.bis ? `<em class="shop-uhr">Neue Auswahl in <strong id="shop-uhr">${uhr()}</strong></em>` : ""}</button>
        <button class="shop-feld ausstattung" data-shop-feld="ausstattung"><span class="shop-feld-bilder kos"><span class="kos-bild kos-wuerfel" data-wuerfel="w_glut"><span class="w20-box">${window.ABW ? window.ABW.svg(20) : ""}</span></span><span class="kos-bild kos-rahmen" data-rahmen="r_lorbeer"><span class="rahmen-halter"><span class="hub-avatar">${avatarHtml()}</span></span></span></span>
          <b>Ausstattung</b><span>Würfel-Designs und Profilrahmen. Ab 75 ${name}.</span><em class="shop-uhr">Rein fürs Auge</em></button>
      </div></div>`);
    shopUhr = setInterval(() => { const el = $("#shop-uhr"); if (!el) return clearInterval(shopUhr); if (new Date(s.bis).getTime() <= Date.now()) { clearInterval(shopUhr); return shopZeigen(); } el.textContent = uhr(); }, 1000);
    document.querySelectorAll("[data-shop-feld]").forEach((b) => { b.onclick = () => { clearInterval(shopUhr); if (b.dataset.shopFeld === "helden") shopHelden(); else if (window.ABKOS) window.ABKOS.ausstattung(); }; });
  }
  async function shopHelden() {
    const A = window.ARENA, F = window.ABF, name = A ? A.WAEHRUNG : "Seelensplitter", zeichen = A ? A.ZEICHEN : "◈";
    const bald = (text) => seiteZeigen("shop", `<div class="shop-bald"><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Folgt bald</h1><p class="hub-untertitel">${text}</p></div>`);
    clearInterval(shopUhr);
    seiteZeigen("shop", `<div class="shop" data-shop><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Einen Moment …</h1></div>`);
    let s = null;
    try { await netz().ensureUser(); s = await netz().rpc("rpg_shop_today", {}); }
    catch (e) { if (!document.querySelector("[data-shop]")) return; return bald(rpcFehlt(e) ? `Der Händler packt seine Waren noch aus. Bald kannst du hier deine ${name} eintauschen.` : esc(e.message)); }
    if (!document.querySelector("[data-shop]")) return;
    if (!s || !s.konto) return seiteZeigen("shop", `<div class="shop-bald"><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Nur für Spielerkonten</h1><p class="hub-untertitel">Der Händler tauscht ${name} gegen Helden. Beides gibt es nur mit einem Konto.</p></div>`);
    const zeichne = (meldung) => {
      const rest = () => { const ms = Math.max(0, new Date(s.bis).getTime() - Date.now()), h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000); return h ? `${h} Std. ${m} Min` : `${m} Min`; };
      seiteZeigen("shop", `<div class="shop" data-shop><button class="btn ghost klein shop-zurueck" data-shop-zurueck>← Zum Händler</button><div class="shop-kopf"><div><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Helden des Tages</h1>
          <p class="hub-untertitel">Jeden Tag drei Helden, die dir noch fehlen. Jeder kostet ${s.preis} ${name}.</p></div><p class="shop-stand"><i>${zeichen}</i> ${s.waehrung} ${name}</p></div>
        ${meldung ? `<p class="fb">${esc(meldung)}</p>` : ""}
        ${s.helden.length ? `<div class="shop-helden">${s.helden.map((h) => { const d = F.FIGUREN[h.held]; if (!d) return ""; const fehlt = s.preis - s.waehrung;
          return `<div class="shop-held ${h.gekauft ? "gekauft" : ""}" style="--k:${F.KLASSEN[d.klasse].farbe}"><img src="${F.bild(h.held)}" alt="" loading="lazy"><b>${esc(d.name)}</b><small>${esc(d.titel)} · ${esc(F.KLASSEN[d.klasse].name)}</small>
            <button class="my-link" data-shop-ansehen="${h.held}">Ansehen</button>
            ${h.gekauft ? `<span class="shop-gekauft">✓ In deiner Sammlung</span>` : `<button class="btn" data-shop-kauf="${h.held}" ${fehlt > 0 ? "disabled" : ""}><i>${zeichen}</i> ${s.preis}</button>${fehlt > 0 ? `<small class="shop-fehlt">Es fehlen ${fehlt}</small>` : ""}`}</div>`; }).join("")}</div>
          <p class="note">Neue Auswahl in <span id="shop-rest">${rest()}</span> – ${name} bekommst du für Siege in der Arena.</p>`
          : `<p class="note">${s.alle ? "Du hast alle Helden. Der Händler hat dir nichts mehr anzubieten – vorerst." : "Heute hat der Händler nichts für dich. Schau morgen wieder vorbei."}</p>`}</div>`);
      clearInterval(shopUhr); shopUhr = setInterval(() => { const el = $("#shop-rest"); if (!el) return clearInterval(shopUhr); if (new Date(s.bis).getTime() <= Date.now()) { clearInterval(shopUhr); return shopHelden(); } el.textContent = rest(); }, 30000);
      { const z = document.querySelector("[data-shop-zurueck]"); if (z) z.onclick = () => shopZeigen(); }
      document.querySelectorAll("[data-shop-ansehen]").forEach((b) => { b.onclick = () => { const f = b.dataset.shopAnsehen; fenster(F.FIGUREN[f].name, window.ABH_HELDEN.detail(f, 1, "")); }; });
      document.querySelectorAll("[data-shop-kauf]").forEach((b) => { b.onclick = async () => { const f = b.dataset.shopKauf;
        if (!confirm(`${F.FIGUREN[f].name} für ${s.preis} ${name} in deine Sammlung holen?`)) return; b.disabled = true;
        try { s = await netz().rpc("rpg_shop_buy", { p_held: f }); if (A) { await A.pruefen(true); waehrungZeigen(A.waehrung()); } if (SM) await SM.laden(true); zeichne(); toast(`${F.FIGUREN[f].name} gehört jetzt zu deiner Sammlung.`); }
        catch (e) { try { s = await netz().rpc("rpg_shop_today", {}); } catch (e2) { /* alter Stand bleibt */ } zeichne(e.message); } }; });
    };
    zeichne();
  }

  /* ---------- Admin-Bereich (nur Admins): Codes · Kampfstatistiken · Rechner-Gegner ---------- */
  let adminTab = null;
  const ADMIN_TABS = [["codes", "Codes", "Code-Übersicht"], ["stats", "Kampfstatistiken", "Arena-Auswertung"], ["bots", "Rechner-Gegner", "Rechner-Gegner"]];
  function adminBereich(tab) {
    if (!smAktiv() || !SM.istAdmin()) return toast("Den Admin-Bereich gibt es nur für Admins.");
    adminTab = ADMIN_TABS.some((t) => t[0] === tab) ? tab : "codes";
    return adminTab === "stats" ? arenaAuswertung() : adminTab === "bots" ? botEinstellungen() : codeUebersicht();
  }
  /** Rechner-Gegner der Arena: ein/aus, Wartezeit, Spielstärke, Stufen – und wie die Kämpfe gegen ihn ausgehen (Migration 020) */
  async function botEinstellungen(meldung) {
    if (!smAktiv() || !SM.istAdmin()) return toast("Die Einstellungen gibt es nur für Admins.");
    let d = null;
    try { d = await netz().rpc("rpg_admin_bot", {}); } catch (e) { return fenster("Rechner-Gegner", `<p class="note">${rpcFehlt(e) ? "Die Einstellungen sind in der Datenbank noch nicht eingerichtet (Migration 020)." : esc(e.message)}</p>`); }
    const e = d.einstellungen, s = d.statistik || {}, pct = (a, n) => (n ? Math.round(100 * a / n) + " %" : "–"), vz = (n) => (n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "±0");
    const MODUS = { arena: "Arena", koenig: "Königsmord", horde: "Die Horde", duell: "Duell" }, STUFE = { "1 schwach": "unter 40 %", "2 mittel": "40 bis unter 70 %", "3 stark": "ab 70 %", "4 ohne Angabe": "ohne Angabe (volle Stärke)" };
    const wahl = (id, wert) => `<select id="${id}">${[-3, -2, -1, 0, 1, 2].map((n) => `<option value="${n}"${n === wert ? " selected" : ""}>${vz(n)}</option>`).join("")}</select>`;
    const wann = (t) => { try { return new Date(t).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (x) { return ""; } };
    const o = fenster("Rechner-Gegner", `<form class="admin-bot" id="admin-bot" novalidate>
      <p class="note">Findet die Suche in der Arena keinen Menschen, springt nach der Wartezeit ein Gegner ein, den der Server spielt. Änderungen gelten für neue Kämpfe.</p>
      <label class="schalter"><input type="checkbox" id="ab-aktiv"${e.aktiv ? " checked" : ""}><span>Rechner-Gegner eingeschaltet</span></label>
      <label class="admin-regler"><span>Wartezeit, bis er einspringt</span><input type="range" id="ab-warten" min="10" max="180" step="5" value="${e.wartezeit}"><output id="ab-warten-w"></output></label>
      <fieldset><legend>Spielstärke</legend>
        <label class="admin-regler"><span>von</span><input type="range" id="ab-sv" min="0" max="100" step="5" value="${Math.round(e.staerke_von * 100)}"><output id="ab-sv-w"></output></label>
        <label class="admin-regler"><span>bis</span><input type="range" id="ab-sb" min="0" max="100" step="5" value="${Math.round(e.staerke_bis * 100)}"><output id="ab-sb-w"></output></label>
        <p class="note klein">100 % = er spielt, so gut er kann. Darunter lässt er öfter die Aktion eines Helden ungenutzt, greift daneben und stellt sich schlechter. Je Gegner wird ein Wert aus dem Bereich gelost – so spielen nicht alle gleich gut.</p>
        <div class="admin-schnell"><span>Schnellwahl:</span><button type="button" class="btn ghost klein" data-ab-schnell="30,50,-1,0">Leicht</button><button type="button" class="btn ghost klein" data-ab-schnell="50,70,-1,0">Mittel</button><button type="button" class="btn ghost klein" data-ab-schnell="75,95,-1,1">Schwer</button><button type="button" class="btn ghost klein" data-ab-schnell="100,100,-1,1">Voll</button></div>
      </fieldset>
      <fieldset><legend>Stufen seiner Helden gegenüber denen des Spielers</legend>
        <div class="admin-reihe"><label>von ${wahl("ab-lv", e.stufe_von)}</label><label>bis ${wahl("ab-lb", e.stufe_bis)}</label></div>
        <div class="admin-reihe"><label>Durchschnitt des Teams höchstens <select id="ab-sm">${[0, 0.5, 1, 1.5, 2, 3].map((n) => `<option value="${n}"${Number(e.schnitt_max == null ? 0.5 : e.schnitt_max) === n ? " selected" : ""}>± ${String(n).replace(".", ",")}</option>`).join("")}</select> Stufen vom Spieler entfernt</label></div>
        <p class="note klein">Je Held wird eine Verschiebung aus dem Bereich gelost – so oft, bis der Durchschnitt des Teams passt. „−1 bis ±0“: kein Held über den Stufen des Spielers.</p>
      </fieldset>
      <button class="my-knopf rot" type="submit">Speichern</button><p class="my-fb" id="ab-fb" role="status">${meldung ? esc(meldung) : ""}</p>
      ${e.geaendert && e.von ? `<p class="note klein">Zuletzt geändert von ${esc(e.von)} am ${wann(e.geaendert)}.</p>` : ""}
    </form>
    <div class="auswertung"><h3>Kämpfe gegen den Rechner-Gegner</h3>
      <p class="note"><b>${s.kaempfe || 0}</b> beendet · Spieler gewannen <b>${pct(s.siege_spieler, s.kaempfe)}</b> · ${s.aufgaben || 0} durch Aufgabe · Ø ${s.runden != null ? s.runden : "–"} Runden · ${s.laufend || 0} laufend · ${s.heute || 0} in den letzten 24 Stunden</p>
      <table><thead><tr><th>Spielstärke</th><th>Kämpfe</th><th>Spieler gewinnt</th><th>Ø Runden</th></tr></thead><tbody>
        ${(s.nach_staerke || []).map((z) => `<tr><th>${STUFE[z.stufe] || esc(z.stufe)}</th><td>${z.kaempfe}</td><td><b>${pct(z.siege_spieler, z.kaempfe)}</b></td><td>${z.runden != null ? z.runden : "–"}</td></tr>`).join("") || `<tr><td colspan="4">Noch keine Kämpfe.</td></tr>`}</tbody></table>
      <table><thead><tr><th>Modus</th><th>Kämpfe</th><th>Spieler gewinnt</th></tr></thead><tbody>
        ${(s.nach_modus || []).map((z) => `<tr><th>${MODUS[z.modus] || esc(z.modus)}</th><td>${z.kaempfe}</td><td>${pct(z.siege_spieler, z.kaempfe)}</td></tr>`).join("") || `<tr><td colspan="3">Noch keine Kämpfe.</td></tr>`}</tbody></table>
      <h3>Letzte Kämpfe</h3><table><thead><tr><th>Spieler</th><th>Gegner</th><th>Modus</th><th>Stufe</th><th>Stärke</th><th>Ausgang</th><th>Runden</th><th>Wann</th></tr></thead><tbody>
        ${(s.letzte || []).map((k) => `<tr><th>${esc(k.spieler)}</th><td>${esc(k.gegner)}</td><td>${MODUS[k.modus] || "–"}</td><td>${k.stufe_spieler} : ${k.stufe_gegner}</td><td>${k.staerke != null ? Math.round(k.staerke * 100) + " %" : "voll"}</td><td>${k.status !== "beendet" ? esc(k.status) : k.sieger === 1 ? "<b>Spieler</b>" : "Gegner"}${k.grund === "aufgabe" ? " (Aufgabe)" : ""}</td><td>${k.runden != null ? k.runden : "–"}</td><td>${wann(k.wann)}</td></tr>`).join("") || `<tr><td colspan="8">Noch keine Kämpfe.</td></tr>`}</tbody></table></div>`);
    const el = (id) => o.querySelector("#" + id), zeig = () => {
      el("ab-warten-w").textContent = el("ab-warten").value + " s"; el("ab-sv-w").textContent = el("ab-sv").value + " %"; el("ab-sb-w").textContent = el("ab-sb").value + " %"; };
    el("ab-warten").oninput = zeig;
    el("ab-sv").oninput = () => { if (+el("ab-sv").value > +el("ab-sb").value) el("ab-sb").value = el("ab-sv").value; zeig(); };
    el("ab-sb").oninput = () => { if (+el("ab-sb").value < +el("ab-sv").value) el("ab-sv").value = el("ab-sb").value; zeig(); };
    el("ab-lv").onchange = () => { if (+el("ab-lv").value > +el("ab-lb").value) el("ab-lb").value = el("ab-lv").value; };
    el("ab-lb").onchange = () => { if (+el("ab-lb").value < +el("ab-lv").value) el("ab-lv").value = el("ab-lb").value; };
    o.querySelectorAll("[data-ab-schnell]").forEach((b) => { b.onclick = () => { const [a, c, x, y] = b.dataset.abSchnell.split(","); el("ab-sv").value = a; el("ab-sb").value = c; el("ab-lv").value = x; el("ab-lb").value = y; zeig(); el("ab-fb").textContent = "Noch nicht gespeichert."; }; });
    zeig();
    el("admin-bot").onsubmit = async (ev) => {
      ev.preventDefault(); const k = ev.target.querySelector("button[type=submit]"); k.disabled = true; el("ab-fb").textContent = "Wird gespeichert …";
      try { await netz().rpc("rpg_admin_bot_set", { p_aktiv: el("ab-aktiv").checked, p_wartezeit: +el("ab-warten").value, p_staerke_von: +el("ab-sv").value / 100, p_staerke_bis: +el("ab-sb").value / 100, p_stufe_von: +el("ab-lv").value, p_stufe_bis: +el("ab-lb").value, p_schnitt_max: +el("ab-sm").value });
        botEinstellungen("Gespeichert."); }
      catch (x) { k.disabled = false; el("ab-fb").textContent = x.message || "Speichern fehlgeschlagen."; }
    };
  }
  /* ---------- Auswertung der Arena (nur Admins, Migration 010; ab Migration 020 mit Rechner-Gegner und Modus vom Kampf) ---------- */
  async function arenaAuswertung() {
    if (!smAktiv() || !SM.istAdmin()) return toast("Die Auswertung gibt es nur für Admins.");
    const F = window.ABF, MODUS = { arena: "Arena", koenig: "Königsmord", horde: "Die Horde", duell: "Duell" }, pct = (s, n) => (n ? Math.round(100 * s / n) + " %" : "–");
    let a = null;
    try { a = await netz().rpc("rpg_arena_stats", {}); } catch (e) { return fenster("Arena-Auswertung", `<p class="note">${rpcFehlt(e) ? "Die Auswertung ist in der Datenbank noch nicht eingerichtet (Migration 010)." : esc(e.message)}</p>`); }
    const hn = (f) => esc((F.FIGUREN[f] || { name: f }).name), modi = Object.keys(MODUS);
    fenster("Arena-Auswertung", `<div class="auswertung">
      <p class="note"><b>${a.kaempfe}</b> beendete Kämpfe · ${a.offen} offen oder laufend · ${a.abgebrochen} abgebrochen.${a.gegen_bot != null ? ` Davon <b>${a.gegen_mensch}</b> gegen Menschen, <b>${a.gegen_bot}</b> gegen den Rechner-Gegner (Spieler gewannen ${pct(a.bot_siege_spieler, a.gegen_bot)}), ${a.privat} privat.` : " Kämpfe vor Einführung des Duells stehen unter dem Modus, den ihre Zufallszahl heute ergäbe."}</p>
      <h3>Modi</h3><table><thead><tr><th>Modus</th><th>Kämpfe</th><th>Ersteller gewinnt</th><th>Ø Runden</th><th>Ø Minuten</th><th>Team am Boden</th><th>Punkte</th><th>Aufgabe</th></tr></thead><tbody>
        ${(a.modi || []).map((m) => `<tr><th>${MODUS[m.modus] || esc(m.modus)}</th><td>${m.kaempfe}</td><td>${pct(m.sieg_ersteller, m.kaempfe)}</td><td>${m.runden != null ? m.runden : "–"}</td><td>${m.minuten != null ? m.minuten : "–"}</td><td>${m.team}</td><td>${m.punkte}</td><td>${m.aufgabe}</td></tr>`).join("") || `<tr><td colspan="8">Noch keine Kämpfe.</td></tr>`}</tbody></table>
      <h3>Helden</h3><table><thead><tr><th>Held</th><th>Kämpfe</th><th>Siege</th><th>Quote</th><th>Ø Stufe</th>${modi.map((k) => `<th>${MODUS[k]}</th>`).join("")}</tr></thead><tbody>
        ${(a.helden || []).slice().sort((x, y) => y.siege / y.kaempfe - x.siege / x.kaempfe || y.kaempfe - x.kaempfe).map((h) => `<tr><th>${hn(h.held)}</th><td>${h.kaempfe}</td><td>${h.siege}</td><td><b>${pct(h.siege, h.kaempfe)}</b></td><td>${h.stufe}</td>${modi.map((k) => { const m = (h.modi || {})[k]; return `<td>${m ? pct(m[1], m[0]) + " <small>(" + m[0] + ")</small>" : "–"}</td>`; }).join("")}</tr>`).join("") || `<tr><td colspan="9">Noch keine Kämpfe.</td></tr>`}</tbody></table>
      <h3>Häufigste Teams</h3><table><thead><tr><th>Team</th><th>Kämpfe</th><th>Siege</th><th>Quote</th></tr></thead><tbody>
        ${(a.teams || []).map((t) => `<tr><th>${t.team.map(hn).join(" · ")}</th><td>${t.kaempfe}</td><td>${t.siege}</td><td>${pct(t.siege, t.kaempfe)}</td></tr>`).join("") || `<tr><td colspan="4">Noch keine Kämpfe.</td></tr>`}</tbody></table>
      <p class="note">Karten: ${Object.keys(a.karten || {}).map((k) => `${esc(k)} ${a.karten[k]}`).join(" · ") || "–"}</p></div>`);
  }
  function seiteZeigen(name, html) {
    const s = $("#hub-seite");
    s.innerHTML = `<button class="hub-zurueck" data-hub="uebersicht">← Zum Dorf</button>${html}`;
    s.hidden = false; $("#hub-start").hidden = true; $("#hub").classList.add("seite-offen");
    document.querySelectorAll(".hub-nav-punkt").forEach((b) => b.classList.toggle("an", b.dataset.hub === name));
    s.scrollIntoView({ block: "start" }); window.scrollTo(0, 0);
  }
  function startseiteZeigen() {
    const s = $("#hub-seite"); if (s) { s.hidden = true; s.innerHTML = ""; }
    $("#hub-start").hidden = false; $("#hub").classList.remove("seite-offen");
    document.querySelectorAll(".hub-nav-punkt").forEach((b) => b.classList.toggle("an", b.dataset.hub === "uebersicht"));
  }
  /** Kopie von Inhalten der Spielseiten ohne Knöpfe und ohne IDs (keine doppelten IDs, kein Spielstart) */
  function kopie(sel) {
    const t = document.createElement("div");
    document.querySelectorAll(sel).forEach((a) => { const c = a.cloneNode(true); c.hidden = false; c.removeAttribute("hidden"); t.appendChild(c); });
    // Auswahlknöpfe mit Erklärung (Normal/Hardcore) als Text behalten, alle anderen Knöpfe entfernen
    t.querySelectorAll("button.schwer").forEach((b) => { const d = document.createElement("div"); d.className = b.className.replace(/\ban\b/, "").trim() + " nur-text"; d.innerHTML = b.innerHTML; b.replaceWith(d); });
    t.querySelectorAll("button, .knoepfe, .fb, [id^=intro-]").forEach((x) => x.remove());
    t.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
    t.querySelectorAll("h2.klein").forEach((h) => { if (/Wie spielt ihr/.test(h.textContent)) { const n = h.nextElementSibling; h.remove(); if (n && n.classList.contains("note")) n.remove(); } });
    t.querySelectorAll("p, div.note").forEach((n) => { if (/Mit Handys: Dieses Gerät liegt|Tippe den Würfel an/.test(n.textContent)) n.remove(); });
    return t.innerHTML;
  }
  /* ---------- Heldensammlung (Open Beta, js/sammlung.js) ---------- */
  const SM = window.ABSAMMLUNG;
  const smAktiv = () => Boolean(SM && SM.aktiv());
  /** Kopf der Charaktere-Seite: Anzahl freigeschalteter Helden, Enden je Kampagne, wartende Belohnung */
  function sammlungKopf() {
    if (!smAktiv()) return "";
    const S = SM.zustand(), offen = (S.angebote || []).some((a) => a.art === "ende");
    if (!S.konto) return `<div class="sm-sammlung-kopf"><span class="sm-sammlung-zahl">5 Starter-Helden</span><span class="hub-untertitel" style="margin:0">Als Gast spielst du mit einem Helden je Klasse. Mit einem <button class="my-link" data-profil="registrieren">Spielerkonto</button> baust du dir deine eigene Sammlung auf.</span></div>`;
    return `${offen ? `<div class="sm-hub-belohnung"><span><b>Eine Belohnung wartet.</b> Für ein neues Kampagnen-Ende darfst du dir noch einen Helden aussuchen.</span><button class="my-knopf rot" data-sm-offen>Jetzt wählen</button></div>` : ""}
      <div class="sm-sammlung-kopf"><span class="sm-sammlung-zahl">${S.helden.length} von 15 Helden freigeschaltet</span>${S.helden.length < 15 ? `<span class="hub-untertitel" style="margin:0">Jedes Kampagnen-Ende, das du zum ersten Mal erreichst, bringt einen neuen Helden.</span>` : ""}</div>${SM.endenHtml()}`;
  }
  function heldenSeite(klasse, fid) {
    const HL = window.ABH_HELDEN, F = window.ABF;
    if (SM && !SM.zustand().geladen) SM.laden().then(() => { const s = $("#hub-seite"); if (s && !s.hidden && s.querySelector("[data-heldenseite]")) heldenSeite(klasse, fid); });
    const frei = (f) => !smAktiv() || SM.frei(f);
    if (!klasse) { seiteZeigen("helden", `<h1 class="hub-gruss">Heldenhalle</h1><p class="hub-untertitel">Fünf Klassen, fünfzehn Helden. Wähle eine Klasse, um ihre Helden kennenzulernen.</p>${sammlungKopf()}<div class="hub-helden" data-heldenseite>${HL.klassenWahl({ frei: smAktiv() ? frei : null })}</div>${smAktiv() && SM.zustand().konto && SM.zustand().stufenDa ? `<h2 class="hub-zwischen">Deine Helden</h2>${SM.heldenUebersichtHtml()}` : ""}`); return; }
    const helden = HL.vonKlasse(klasse); fid = fid || helden.find(frei) || helden[0];
    const gesperrt = !frei(fid) ? `<div class="sm-gesperrt">${SM.SCHLOSS}<span><b>Noch gesperrt.</b> ${esc(SM.gesperrtText())}</span></div>` : "";
    seiteZeigen("helden", `<div class="hub-helden" data-heldenseite>${HL.klassenLeiste(klasse).replace('id="klassen-zurueck"', 'data-held-klassen')}${HL.klassenKopf(klasse)}
      <div class="hub-held-reihe">${helden.map((f) => HL.kachel(f, { an: f === fid, gesperrt: !frei(f), status: !frei(f) ? "gesperrt" : "" })).join("")}</div>${HL.detail(fid, 1, gesperrt).replace('<article class="held"', `<article class="held${gesperrt ? " gesperrt" : ""}"`)}</div>`);
  }
  /** Einmal je Seitenaufruf (und nach der Registrierung): offene Startrunden oder eine wartende Belohnung zeigen */
  let sammlungGeprueft = false;
  async function sammlungPruefen(neu) {
    if (!SM || !(profil && profil.konto) || (sammlungGeprueft && !neu)) return;
    sammlungGeprueft = true;
    const S = await SM.laden(true);
    if (!S.installiert || !S.konto) return;
    // Neu registriert: erst das Intro (überspringbar), dann die Heldenwahl
    const T = window.ABTUT; if (T) T.konto(profil.handle);
    // Neu registriert: Intro, Heldenwahl, danach das Tutorial (Wert je Profil; überspringbar)
    if (S.start_offen) { if (T) T.merkeNeu(); const los = () => SM.registrierung(() => { zeigeHub(); if (T) T.pruefen(); }); return window.ABINTRO && window.ABINTRO.aktiv && !window.ABINTRO.gesehen() ? window.ABINTRO.zeigen(los) : los(); }
    if (T) T.pruefen(); // steht das Tutorial für dieses Konto noch an, beginnt es im Dorf
    SM.offeneBelohnung(() => zeigeHub());
  }
  function codeFormHtml(p, immer) {
    if (!smAktiv() || !SM.zustand().konto) return "";
    // immer: Eingabe auch zeigen, wenn schon alle Helden da sind (ein Code kann auch Seelensplitter bringen)
    const voll = !immer && SM.zustand().helden.length >= 15;
    return `<form class="sm-code-form" id="${p}-sm-code" novalidate><label class="my-bald klein" for="${p}-sm-code-feld">${voll ? "Alle 15 Helden sind freigeschaltet." : immer ? "Code" : "Freischalt-Code einlösen (schaltet alle 15 Helden frei)"}</label>
      ${voll ? "" : `<input id="${p}-sm-code-feld" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" maxlength="14"><button class="my-knopf" type="submit">Code einlösen</button>`}<p class="my-fb" id="${p}-sm-code-fb" role="status"></p></form>`;
  }
  function codeFormBinden(p, nachher) {
    const f = $("#" + p + "-sm-code"), i = $("#" + p + "-sm-code-feld"); if (!f || !i) return;
    const fbc = (t, art = "") => { const e = $("#" + p + "-sm-code-fb"); e.textContent = t; e.dataset.art = art; };
    i.addEventListener("input", () => { i.value = huebsch(i.value); fbc(""); });
    f.onsubmit = async (e) => {
      e.preventDefault();
      const code = sauber(i.value); if (code.length !== 12) return fbc("Bitte den vollständigen Code eingeben (XXXX-XXXX-XXXX).", "fehler");
      const k = f.querySelector("button"); k.disabled = true; fbc("Code wird geprüft …");
      try {
        const r = await SM.codeEinloesen(huebsch(code));
        if (r.waehrung) { // Splitter-Code (Migration 021)
          fbc(`✓ +${r.waehrung} Seelensplitter. Dein Kontostand: ${r.kontostand}.`, "ok"); toast(`+${r.waehrung} Seelensplitter`); waehrungZeigen(r.kontostand);
          if (window.ARENA && window.ARENA.pruefen) window.ARENA.pruefen(true).catch(() => {});
          i.value = ""; k.disabled = false;
        } else {
          fbc(r.neu ? `✓ ${r.neu} ${r.neu === 1 ? "Held" : "Helden"} freigeschaltet. Jetzt stehen dir alle 15 zur Wahl.` : "✓ Code eingelöst. Du hattest schon alle Helden.", "ok");
          toast("Alle 15 Helden sind freigeschaltet.");
        }
        if (nachher) nachher();
      } catch (err) { fbc(err.message, "fehler"); k.disabled = false; }
    };
  }
  /* ---------- Mein Profil: Profilbild · Aussehen (Rahmen, Würfel) · Code einlösen ---------- */
  const PROFIL_TABS = [["bild", "Profilbild"], ["aussehen", "Aussehen"], ["code", "Code einlösen"]];
  async function profilSeite(tab) {
    if (!istKonto()) return toast("Das Profil gibt es mit einem Spielerkonto.");
    tab = PROFIL_TABS.some((t) => t[0] === tab) ? tab : "bild";
    const K = window.ABKOS, F = window.ABF;
    if (K) { try { await K.laden(); } catch (e) { /* ohne Ausstattung: Standard */ } }
    const akt = K ? K.aktiv() : { wuerfel: null, rahmen: null }, name = (K && K.STUECKE) || {};
    // Kopf: so sehen dich andere – Bild im gewählten Rahmen, daneben der gewählte Würfel
    const kopf = `<div class="profil-kopf">
        <span class="profil-bild kos-bild kos-rahmen" data-rahmen="${esc(akt.rahmen || "standard")}"><span class="rahmen-halter"><span class="hub-avatar">${avatarHtml()}</span></span></span>
        <div class="profil-wer"><b>${esc(profil.handle)}</b><small>${esc(akt.rahmen && name[akt.rahmen] ? "Rahmen: " + name[akt.rahmen].name : "Rahmen: Standard")}</small><small>${esc(akt.wuerfel && name[akt.wuerfel] ? "Würfel: " + name[akt.wuerfel].name : "Würfel: Standard")}</small></div>
        <span class="profil-wuerfel kos-bild kos-wuerfel" data-wuerfel="${esc(akt.wuerfel || "standard")}"><span class="w20-box">${window.ABW ? window.ABW.svg(20) : ""}</span></span>
      </div>
      <nav class="admin-tabs profil-tabs" aria-label="Mein Profil">${PROFIL_TABS.map((t) => `<button data-profil-tab="${t[0]}" class="${t[0] === tab ? "an" : ""}"${t[0] === tab ? ' aria-current="page"' : ""}>${t[1]}</button>`).join("")}</nav>`;
    const inhalt = tab === "bild"
      ? `<p class="note">Tippe ein Bild an – es wird sofort übernommen.</p><div class="hub-bilder">${F.REIHE.map((f) => `<button class="hub-bild${profil.avatar_key === f ? " an" : ""}" data-bild="${f}" aria-pressed="${profil.avatar_key === f}" title="${esc(F.FIGUREN[f].name)}"><img src="img/figuren/${f}.jpg" alt=""><span>${esc(F.FIGUREN[f].name)}</span></button>`).join("")}</div>`
      : tab === "aussehen" ? (K ? K.wahlHtml() : `<p class="note">Die Ausstattung ist gerade nicht verfügbar.</p>`)
      : `<p class="note">Hast du einen Code bekommen? Hier löst du ihn ein – je nach Code schaltet er alle Helden frei oder bringt Seelensplitter.</p>${codeFormHtml("prof", true)}`;
    const o = fenster("Mein Profil", `<div class="profil" data-profil-seite="${tab}">${kopf}<div class="profil-inhalt">${inhalt}</div></div>`);
    o.querySelectorAll("[data-profil-tab]").forEach((b) => { b.onclick = () => profilSeite(b.dataset.profilTab); });
    if (tab === "bild") o.querySelectorAll("[data-bild]").forEach((b) => { b.onclick = async () => {
      o.querySelectorAll("[data-bild]").forEach((x) => { x.disabled = true; });
      try { const p = await netz().rpc("rpg_set_profile", { p_handle: profil.handle, p_avatar_key: b.dataset.bild }); profil.avatar_key = p.avatar_key; hubKopf(); }
      catch (e) { toast(e.message); }
      profilSeite("bild");
    }; });
    if (tab === "aussehen" && K) K.wahlBinden(() => { hubKopf(); profilSeite("aussehen"); });
    if (tab === "code") { codeFormBinden("prof", () => { hubListen(); }); const i = $("#prof-sm-code-feld"); if (i) i.focus(); }
    return o;
  }
  /** Admins: Codes anlegen (für eine bestimmte Person oder jede Person; für alle Helden oder für Seelensplitter), Übersicht, sperren */
  async function codeUebersicht(neu) {
    if (!smAktiv() || !SM.istAdmin()) return toast("Die Code-Übersicht gibt es nur für Admins.");
    let liste = [];
    try { liste = await SM.adminCodes(); } catch (e) { return toast(e.message); }
    const d = (t) => { try { return new Date(t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return ""; } };
    const status = (c) => !c.aktiv ? "gesperrt" : new Date(c.gueltig_bis) < new Date() ? "abgelaufen" : c.eingeloest >= c.hoechstens ? "verbraucht" : "aktiv";
    const o = fenster("Code-Übersicht", `
      ${neu ? `<div class="sm-code-neu"><p class="note">Neuer Code „${esc(neu.bezeichnung)}“${neu.waehrung ? ` · <b>${neu.waehrung} Seelensplitter</b>` : " · alle Helden"}${neu.nur_fuer ? ` · nur für <b>${esc(neu.nur_fuer)}</b>` : " · für jede Person"} · ${neu.hoechstens}× einlösbar · gültig bis ${d(neu.gueltig_bis)}</p>
        <div class="sm-code-anzeige"><b id="sm-code-text">${esc(neu.code)}</b><button class="btn klein" id="sm-code-kopieren">Kopieren</button></div>
        <p class="note klein">Der Code wird nur jetzt angezeigt. Bitte gleich weitergeben oder notieren.</p></div>` : ""}
      <form class="sm-admin-form" id="sm-admin-form" novalidate>
        <h3 class="f-unter">Neuen Code erstellen</h3>
        <label>Bezeichnung <input id="sm-a-name" maxlength="80" placeholder="z. B. Für Lena, Gewinnspiel März" required></label>
        <fieldset class="sm-a-wahl"><legend>Einlösbar von</legend>
          <label><input type="radio" name="sm-a-fuer" value="person" checked> einer bestimmten Person</label>
          <label><input type="radio" name="sm-a-fuer" value="alle"> einer beliebigen Person</label></fieldset>
        <fieldset class="sm-a-wahl"><legend>Der Code bringt</legend>
          <label><input type="radio" name="sm-a-inhalt" value="helden" checked> alle 15 Helden</label>
          <label><input type="radio" name="sm-a-inhalt" value="splitter"> Seelensplitter</label></fieldset>
        <label id="sm-a-splitter-feld" hidden>Wie viele Seelensplitter <input id="sm-a-splitter" type="number" min="1" max="5000" step="1" value="100" inputmode="numeric"></label>
        <label id="sm-a-handle-feld">Benutzername <input id="sm-a-handle" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Benutzername des Spielers"></label>
        <div class="sm-a-reihe">
          <label id="sm-a-anzahl-feld" hidden>Wie oft einlösbar <input id="sm-a-anzahl" type="number" min="1" max="100" value="1"></label>
          <label>Gültig <select id="sm-a-tage"><option value="30">30 Tage</option><option value="90" selected>90 Tage</option><option value="180">180 Tage</option><option value="365">1 Jahr</option></select></label>
        </div>
        <button class="my-knopf rot" type="submit">Code erstellen</button><p class="my-fb" id="sm-a-fb" role="status"></p>
        <p class="note klein">Ein Code schaltet alle 15 Helden frei oder bringt Seelensplitter (1 bis 5000). Ein Code für eine bestimmte Person ist immer 1× einlösbar, und nur ihr Konto kann ihn einlösen. Höchstens 20 neue Codes pro Tag.</p>
      </form>
      <h3 class="f-unter">Codes (${liste.length})</h3>
      ${liste.length ? `<ul class="f-liste sm-code-liste">${liste.map((c) => `<li><span><b>${esc(c.bezeichnung)}</b><small>${c.waehrung ? c.waehrung + " Seelensplitter" : "alle Helden"} · ${c.nur_fuer ? "nur für " + esc(c.nur_fuer) : "jede Person"} · ${c.eingeloest} von ${c.hoechstens} eingelöst · bis ${d(c.gueltig_bis)}${c.angelegt_von ? " · von " + esc(c.angelegt_von) : ""}</small></span>
        <span class="f-knoepfe"><em class="sm-code-status ${status(c)}">${status(c)}</em>${c.aktiv ? `<button class="btn ghost klein gefahr" data-sm-sperren="${esc(c.id)}">Sperren</button>` : ""}</span></li>`).join("")}</ul>` : `<p class="note">Noch keine Codes.</p>`}`);
    const umschalten = () => {
      const person = o.querySelector('input[name="sm-a-fuer"]:checked').value === "person";
      $("#sm-a-handle-feld").hidden = !person; $("#sm-a-anzahl-feld").hidden = person;
      $("#sm-a-splitter-feld").hidden = o.querySelector('input[name="sm-a-inhalt"]:checked').value !== "splitter";
    };
    o.querySelectorAll('input[name="sm-a-fuer"], input[name="sm-a-inhalt"]').forEach((r) => { r.onchange = umschalten; });
    const kp = $("#sm-code-kopieren");
    if (kp) kp.onclick = async () => { try { await navigator.clipboard.writeText($("#sm-code-text").textContent); toast("Code kopiert."); } catch (e) { toast("Kopieren geht hier nicht – bitte abschreiben."); } };
    $("#sm-admin-form").onsubmit = async (e) => {
      e.preventDefault();
      const fb2 = (t) => { $("#sm-a-fb").textContent = t; };
      const bezeichnung = $("#sm-a-name").value.trim(), person = o.querySelector('input[name="sm-a-fuer"]:checked').value === "person", fuer = $("#sm-a-handle").value.trim();
      if (!bezeichnung) return fb2("Bitte eine Bezeichnung angeben.");
      if (person && !NAME.test(fuer)) return fb2("Bitte den genauen Benutzernamen eingeben.");
      const k = e.target.querySelector("button[type=submit]"); k.disabled = true; fb2("Code wird erstellt …");
      const splitter = o.querySelector('input[name="sm-a-inhalt"]:checked').value === "splitter", menge = Math.round(+$("#sm-a-splitter").value || 0);
      if (splitter && !(menge >= 1 && menge <= 5000)) { k.disabled = false; return fb2("Bitte 1 bis 5000 Seelensplitter angeben."); }
      try { const r = await SM.adminErstellen({ bezeichnung, fuer: person ? fuer : null, anzahl: person ? 1 : +$("#sm-a-anzahl").value || 1, tage: +$("#sm-a-tage").value || 90, waehrung: splitter ? menge : null }); if (splitter && r && r.waehrung == null) r.waehrung = menge; codeUebersicht(r); }
      catch (err) { fb2(err.message); k.disabled = false; }
    };
    o.querySelectorAll("[data-sm-sperren]").forEach((b) => { b.onclick = async () => {
      if (!confirm("Diesen Code sperren? Er kann danach nicht mehr eingelöst werden.")) return;
      b.disabled = true;
      try { await SM.adminSperren(b.dataset.smSperren); toast("Code gesperrt."); } catch (e) { toast(e.message); }
      codeUebersicht();
    }; });
    if (neu) o.querySelector(".karte-box").scrollTop = 0;
  }
  function codeDialog() {
    if (!smAktiv() || !istKonto()) return toast("Codes kann nur ein Spielerkonto einlösen.");
    fenster("Freischalt-Code", `<p class="note">Mit einem Freischalt-Code stehen dir sofort alle 15 Helden zur Wahl.</p>${codeFormHtml("dlg")}`);
    codeFormBinden("dlg");
    const i = $("#dlg-sm-code-feld"); if (i) i.focus();
  }
  function regelnSeite() {
    // Grundlagen in einfachen Worten (js/hilfe.js); ohne das Modul bleibt der Kodex als Ersatz
    const H = window.ABHILFE;
    seiteZeigen("regeln", `<h1 class="hub-gruss">Hilfe</h1><p class="hub-untertitel">Die Grundlagen, einfach erklärt. Ihr müsst nichts davon auswendig können: Das Spiel rechnet für euch.</p>${H ? `<div class="hub-text hilfe">${H.html()}</div>` : `<div class="hub-text kodex">${kopie('#kodex .seite:not([data-seite="6"])')}</div>`}`);
    if (H) H.binden(document);
  }
  /** Lore: die Hintergründe der Welt bis zum Heute (Texte in js/lore.js) */
  function loreSeite() {
    const L = window.ABLORE || { welt: [] };
    seiteZeigen("lore", `<div class="lore"><p class="shop-eyebrow">Der Splitterbrunnen</p><h1 class="hub-gruss">Die Geschichte von Mythara</h1><p class="hub-untertitel">${esc(L.auftakt || "")}</p>
      ${window.ABINTRO && window.ABINTRO.aktiv ? `<div class="lore-intro-knopf"><button class="btn ghost" id="lore-intro">▶ Intro noch einmal ansehen</button></div>` : ""}
      ${L.welt.map((k, i) => `<section class="lore-kapitel"><span class="lore-nr">${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i] || i + 1}</span><h2>${esc(k.titel)}</h2>${k.text.map((a) => `<p>${esc(a)}</p>`).join("")}</section>`).join("")}
      <p class="lore-schluss">${esc(L.schluss || "")}</p></div>`);
    const ib = $("#lore-intro"); if (ib) ib.onclick = () => window.ABINTRO.zeigen(() => {});
    // Am Splitterbrunnen läuft zuerst das Intro (überspringbar), darunter steht schon der Text
    if (window.ABINTRO && window.ABINTRO.aktiv && !window.ABINTRO.still) window.ABINTRO.zeigen(() => {});
  }
  function weltSeite(abenteuer) {
    if (!abenteuer) {
      seiteZeigen("welt", `<h1 class="hub-gruss">Stadttor</h1><p class="hub-untertitel">Hinter dem Tor liegen die Splitterlande – und die Abenteuer, die dort auf euch warten.</p>
        <div class="hub-welt-liste">
          ${ABENTEUER().map((m) => abenteuerKachel(m, "data-welt")).join("")}
          <div class="hub-kachel welt bald" aria-disabled="true"><b>Weitere Abenteuer</b><small>sind in Vorbereitung.</small></div>
        </div>`);
      return;
    }
    if (abenteuer !== "grauwacht") {
      const m = window.ABS.metaVon(abenteuer);
      seiteZeigen("welt", `<button class="hub-zurueck klein" data-welt="">← Alle Abenteuer</button>
        <h1 class="hub-gruss">${esc(m.titel)}</h1><p class="hub-untertitel">${esc(m.untertitel || "")}</p>
        <img class="hub-welt-bild" src="${titelbild(m)}" alt="" ${BILD_ERSATZ}>
        <ul class="hub-fakten"><li>Schwierigkeit <b>${esc(schwer(m.schwierigkeit))}</b></li><li>Empfohlene Heldenstufe <b>${(window.ABF.SCHWIERIGKEIT[m.schwierigkeit || 1] || {}).stufe || 1}</b></li><li><b>${m.min}–${m.max}</b> Heldinnen und Helden</li><li><b>${esc(m.dauer || "")}</b></li><li><b>${esc(m.abschnitte || 2)}</b> Abschnitte</li><li><b>${esc(m.enden || 4)}</b> Enden</li><li>ab <b>12</b> Jahren</li></ul>
        <div class="hub-text einleitung">${(m.einleitung || []).map((p) => `<article class="seite"><p class="eyebrow">${esc(p.eyebrow || "")}</p><h2>${esc(p.titel)}</h2>${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}</article>`).join("")}</div>
        <button class="my-knopf rot hub-welt-start" data-neu-start="${m.id}">Kampagne starten</button>`);
      return;
    }
    seiteZeigen("welt", `<button class="hub-zurueck klein" data-welt="">← Alle Abenteuer</button>
      <h1 class="hub-gruss">Das Siegel von Grauwacht</h1><p class="hub-untertitel">Das erste Abenteuer in den Splitterlanden</p>
      <img class="hub-welt-bild" src="${titelbild(window.ABS.metaVon("grauwacht"))}" alt="" ${BILD_ERSATZ}>
      <ul class="hub-fakten"><li>Schwierigkeit <b>${esc(schwer(window.ABS.metaVon("grauwacht").schwierigkeit || 2))}</b></li><li><b>3–6</b> Heldinnen und Helden</li><li>etwa <b>3 Stunden</b></li><li><b>3</b> Abschnitte</li><li><b>5</b> Enden</li><li>ab <b>12</b> Jahren</li></ul>
      <div class="hub-text einleitung">${kopie("#einl-grauwacht .seite")}</div>
      <button class="my-knopf rot hub-welt-start" data-neu-start="grauwacht">Kampagne starten</button>`);
  }

  function zeigeHub() {
    startseiteZeigen();
    try { sessionStorage.setItem(HUB, profil && profil.konto ? "konto" : "gast"); } catch (e) { /* privat */ }
    const ep = $("#einst-panel"); if (ep && ep.parentElement !== document.body) document.body.appendChild(ep); // Einstellungen auch von hier aus
    scannerStopp(); zeige("hub"); hubKopf(); hubListen();
  }
  function avatarHtml() {
    const k = profil && profil.konto && profil.avatar_key && window.ABF.FIGUREN[profil.avatar_key] ? profil.avatar_key : null;
    return k ? `<img src="img/figuren/${k}.jpg" alt="">` : `<span>${esc(((profil && profil.konto && profil.handle) || "G").slice(0, 1).toUpperCase())}</span>`;
  }
  function hubKopf() {
    const konto = Boolean(profil && profil.konto), name = konto ? profil.handle : "Gast";
    $("#hub-gruss").textContent = konto ? `Willkommen zurück, ${name}!` : "Willkommen in Mythara!";
    const gh = $("#hub-gast-hinweis"); gh.hidden = konto;
    if (!konto) gh.innerHTML = `<span>Du spielst als <b>Gast</b>. Deine Kampagnen sind an diesen Browser gebunden. Mit einem Konto hast du sie auf jedem Gerät.</span><span class="hub-gast-knoepfe"><button class="my-link" data-profil="registrieren">Konto erstellen</button><button class="my-link" data-profil="anmelden">Anmelden</button></span>`;
    $("#hub-profil").innerHTML = `<span class="arena-waehrung kopf" id="hub-waehrung" hidden></span><button class="hub-profil-knopf" id="hub-profil-knopf" aria-haspopup="true" aria-expanded="false"><span class="rahmen-halter"><span class="hub-avatar">${avatarHtml()}</span></span><span class="hub-name"><b>${esc(name)}</b><small id="hub-titel">${konto ? esc((smAktiv() && SM.titelText()) || "Spieler") : "Gast"}</small></span><span aria-hidden="true">▾</span></button>
      ${konto ? `<button class="hub-rund" id="hub-glocke" aria-label="Anfragen" title="Freundschafts- und Gruppenanfragen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a6 6 0 0 0-6 6v4.5L4 16v1.5h16V16l-2-3.5V8a6 6 0 0 0-6-6zM9.5 19.5a2.5 2.5 0 0 0 5 0z"/></svg></span><span class="hub-zahl" data-zahl="alle" hidden></span></button>` : ""}
      <button class="hub-rund" id="hub-shop" aria-label="Händler" title="Händler"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16l1.5 5a3 3 0 0 1-2.5 3.9V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.100A3 3 0 0 1 2.500 9zm3 9v6h4v-4h3v4h3v-6a3 3 0 0 1-2.500-1.300A3 3 0 0 1 12 12.900a3 3 0 0 1-2.500-1.200A3 3 0 0 1 7 13z"/></svg></span></button>
      <button class="hub-rund" id="hub-einst" aria-label="Einstellungen" title="Einstellungen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 4.6v-2.2l-2.4-.6a7 7 0 0 0-.7-1.7l1.3-2.1-1.6-1.6-2.1 1.3a7 7 0 0 0-1.7-.7L13.1 3h-2.2l-.6 2.5a7 7 0 0 0-1.7.7L6.5 4.9 4.9 6.5l1.3 2.1a7 7 0 0 0-.7 1.7L3 10.9v2.2l2.5.6c.2.6.4 1.2.7 1.7l-1.3 2.1 1.6 1.6 2.1-1.3c.5.3 1.1.5 1.7.7l.6 2.5h2.2l.6-2.5c.6-.2 1.2-.4 1.7-.7l2.1 1.3 1.6-1.6-1.3-2.1c.3-.5.5-1.1.7-1.7z"/></svg></span></button>
      <div class="hub-menue" id="hub-menue" hidden>${konto ? `<button data-profil="profil">Mein Profil</button>${smAktiv() && SM.istAdmin() ? `<button data-profil="admin">Admin-Bereich</button>` : ""}<button data-profil="tutorial">Tutorial ansehen</button><button data-profil="abmelden">Abmelden</button>` : `<button data-profil="anmelden">Anmelden</button><button data-profil="registrieren">Konto erstellen</button>`}</div>`;
    arenaKachel();
    $("#hub-profil-knopf").onclick = () => { const m = $("#hub-menue"); m.hidden = !m.hidden; $("#hub-profil-knopf").setAttribute("aria-expanded", String(!m.hidden)); };
    $("#hub-shop").onclick = shopZeigen;
    $("#hub-einst").onclick = () => { const t = $("#titel-einst"); if (t) t.click(); };
    const gl = $("#hub-glocke"); if (gl) gl.onclick = anfragenZeigen;
    posteingang();
  }

  /* ---------- Freunde und Anfragen (Migration 003) ---------- */
  let inbox = { freunde: [], kampagnen: [] };
  const istKonto = () => Boolean(profil && profil.konto);
  const ava = (k, name) => k && window.ABF.FIGUREN[k] ? `<img src="img/figuren/${k}.jpg" alt="">` : `<span>${esc((name || "?").slice(0, 1).toUpperCase())}</span>`;
  /** Posteingang laden und Zähler (Glocke, „Freunde“) setzen */
  async function posteingang() {
    if (!istKonto()) return;
    try { inbox = await netz().rpc("rpg_my_inbox", {}); } catch (e) { return; }
    const n = { alle: inbox.freunde.length + inbox.kampagnen.length, freunde: inbox.freunde.length };
    document.querySelectorAll("[data-zahl]").forEach((z) => { const v = n[z.dataset.zahl] || 0; z.hidden = !v; z.textContent = v > 9 ? "9+" : String(v); });
    const gl = $("#hub-glocke"); if (gl) gl.classList.toggle("neu", n.alle > 0);
  }
  setInterval(() => { if (!document.hidden && !$("#hub").hidden) posteingang(); }, 30000);
  function fenster(titel, inhalt) {
    const o = $("#qr-overlay");
    // Im Admin-Bereich: gemeinsamer Kopf mit Reitern (nur für die drei Admin-Seiten)
    const admin = adminTab && ADMIN_TABS.some((t) => t[2] === titel);
    if (!admin) adminTab = null;
    const reiter = admin ? `<nav class="admin-tabs" aria-label="Admin-Bereich">${ADMIN_TABS.map((t) => `<button data-admin-tab="${t[0]}" class="${t[0] === adminTab ? "an" : ""}"${t[0] === adminTab ? ' aria-current="page"' : ""}>${t[1]}</button>`).join("")}</nav>` : "";
    o.innerHTML = `<div class="karte-box kampagnen${admin ? " admin" : ""}" role="dialog" aria-label="${esc(admin ? "Admin-Bereich" : titel)}"><div class="k-kopf"><h2>${esc(admin ? "Admin-Bereich" : titel)}</h2><button class="link" id="fenster-zu">Schließen</button></div>${reiter}${inhalt}</div>`;
    o.hidden = false; $("#fenster-zu").onclick = () => { adminTab = null; o.hidden = true; hubListen(); posteingang(); };
    o.querySelectorAll("[data-admin-tab]").forEach((b) => { b.onclick = () => adminBereich(b.dataset.adminTab); });
    if (window.ABKOS && o.querySelector(".kos-traeger")) window.ABKOS.schmuecken(o); // Profilrahmen der Freunde
    return o;
  }
  async function anfragenZeigen() {
    await posteingang();
    const f = inbox.freunde, k = inbox.kampagnen;
    const o = fenster("Anfragen", `${!f.length && !k.length ? `<p class="note">Keine offenen Anfragen.</p>` : ""}
      ${f.length ? `<h3 class="f-unter">Freundschaftsanfragen</h3><ul class="f-liste">${f.map((x) => `<li><span class="hub-avatar klein">${ava(x.avatar_key, x.handle)}</span><b>${esc(x.handle)}</b><span class="f-knoepfe"><button class="btn klein" data-fa="ja" data-name="${esc(x.handle)}">Annehmen</button><button class="btn ghost klein" data-fa="nein" data-name="${esc(x.handle)}">Ablehnen</button></span></li>`).join("")}</ul>` : ""}
      ${k.length ? `<h3 class="f-unter">Gruppenanfragen</h3><ul class="f-liste">${k.map((x) => `<li><span class="hub-avatar klein">${ava(x.avatar_key, x.von)}</span><span><b>${esc(x.titel)}</b><small>Einladung von ${esc(x.von)}</small></span><span class="f-knoepfe"><button class="btn klein" data-ka="ja" data-id="${x.id}" data-kid="${esc(x.campaign_id || "")}" data-titel="${esc(x.titel)}">Annehmen</button><button class="btn ghost klein" data-ka="nein" data-id="${x.id}">Ablehnen</button></span></li>`).join("")}</ul>` : ""}`);
    o.querySelectorAll("[data-fa]").forEach((b) => { b.onclick = async () => { b.disabled = true; try { await netz().rpc("rpg_answer_friend", { p_handle: b.dataset.name, p_accept: b.dataset.fa === "ja" }); toast(b.dataset.fa === "ja" ? `Du bist jetzt mit ${b.dataset.name} befreundet.` : "Anfrage abgelehnt."); } catch (e) { toast(e.message); } anfragenZeigen(); }; });
    o.querySelectorAll("[data-ka]").forEach((b) => { b.onclick = async () => {
      b.disabled = true;
      try {
        await netz().rpc("rpg_answer_invite", { p_invite_id: b.dataset.id, p_accept: b.dataset.ka === "ja" });
        // Angenommen: direkt zum Spieltisch – mit dem Benutzernamen, ohne Code
        if (b.dataset.ka === "ja") {
          let kid = b.dataset.kid;
          if (!kid) { const l = await netz().rpc("rpg_my_campaigns", {}).catch(() => []); const c = l.find((x) => x.role === "spieler" && x.title === b.dataset.titel); kid = c && c.id; } // ältere Datenbank ohne ID im Posteingang
          if (kid) { location.href = "handy.html?kampagne=" + encodeURIComponent(kid); return; }
        }
        toast(b.dataset.ka === "ja" ? "Du bist jetzt Mitspieler dieser Kampagne." : "Einladung abgelehnt.");
      } catch (e) { toast(e.message); }
      anfragenZeigen();
    }; });
  }
  async function freundeZeigen(suchErgebnis) {
    if (!istKonto()) { fenster("Taverne", `<p class="note">Freunde gibt es mit einem Spielerkonto: Dann kannst du andere über ihren Benutzernamen finden und zu deinen Kampagnen einladen.</p><button class="my-knopf rot" data-profil="registrieren">Konto erstellen</button>`); return; }
    let d; try { d = await netz().rpc("rpg_my_friends", {}); } catch (e) { fenster("Taverne", `<p class="fb">${esc(e.message)}</p>`); return; }
    const zeile = (x, knoepfe) => `<li>${window.ABKOS ? window.ABKOS.traeger(x.handle) : `<span class="hub-avatar klein">${ava(x.avatar_key, x.handle)}</span>`}<b>${esc(x.handle)}</b><span class="f-knoepfe">${knoepfe}</span></li>`;
    const s = suchErgebnis;
    const sKnopf = !s ? "" : s.beziehung === "freund" ? `<span class="f-info">Ihr seid befreundet.</span>` : s.beziehung === "angefragt" ? `<span class="f-info">Anfrage gesendet.</span>` : s.beziehung === "anfrage_an_mich" ? `<button class="btn klein" data-f="annehmen" data-name="${esc(s.handle)}">Anfrage annehmen</button>` : s.beziehung === "blockiert" ? `<button class="btn ghost klein" data-f="entsperren" data-name="${esc(s.handle)}">Entsperren</button>` : `<button class="btn klein" data-f="anfragen" data-name="${esc(s.handle)}">Freundschaftsanfrage senden</button>`;
    const o = fenster("Taverne", `<form class="f-suche" id="f-suche"><label for="f-name">Spieler finden</label><div><input id="f-name" placeholder="Genauer Benutzername" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn klein" type="submit">Suchen</button></div><p class="my-fb" id="f-fb" role="status"></p></form>
      ${s ? `<ul class="f-liste treffer">${zeile(s, sKnopf)}</ul>` : ""}
      ${d.an_mich.length ? `<h3 class="f-unter">Anfragen an dich</h3><ul class="f-liste">${d.an_mich.map((x) => zeile(x, `<button class="btn klein" data-f="annehmen" data-name="${esc(x.handle)}">Annehmen</button><button class="btn ghost klein" data-f="ablehnen" data-name="${esc(x.handle)}">Ablehnen</button>`)).join("")}</ul>` : ""}
      <h3 class="f-unter">Deine Freunde (${d.freunde.length})</h3>
      ${d.freunde.length ? `<ul class="f-liste">${d.freunde.map((x) => zeile(x, `<button class="btn ghost klein" data-f="entfernen" data-name="${esc(x.handle)}">Entfernen</button><button class="btn ghost klein gefahr" data-f="blockieren" data-name="${esc(x.handle)}">Blockieren</button>`)).join("")}</ul>` : `<p class="note">Noch keine Freunde. Suche oben nach dem genauen Benutzernamen.</p>`}
      ${d.von_mir.length ? `<h3 class="f-unter">Gesendet</h3><ul class="f-liste">${d.von_mir.map((x) => zeile(x, `<button class="btn ghost klein" data-f="zurueck" data-name="${esc(x.handle)}">Zurückziehen</button>`)).join("")}</ul>` : ""}
      ${d.blockiert.length ? `<h3 class="f-unter">Blockiert</h3><ul class="f-liste">${d.blockiert.map((x) => zeile(x, `<button class="btn ghost klein" data-f="entsperren" data-name="${esc(x.handle)}">Entsperren</button>`)).join("")}</ul>` : ""}`);
    $("#f-suche").onsubmit = async (e) => {
      e.preventDefault(); const n = $("#f-name").value.trim();
      if (!NAME.test(n)) { $("#f-fb").textContent = "Bitte den genauen Benutzernamen eingeben (3–20 Zeichen)."; return; }
      try { const r = await netz().rpc("rpg_find_player", { p_handle: n }); if (!r) { $("#f-fb").textContent = `Niemanden mit dem Namen „${n}“ gefunden.`; return; } freundeZeigen(r); }
      catch (err) { $("#f-fb").textContent = err.message; }
    };
    o.querySelectorAll("[data-f]").forEach((b) => { b.onclick = async () => {
      const n = b.dataset.name, was = b.dataset.f;
      if ((was === "entfernen" || was === "blockieren") && !confirm(was === "blockieren" ? `${n} blockieren? Ihr seid dann nicht mehr befreundet, und ${n} kann dir keine Anfragen mehr schicken.` : `Freundschaft mit ${n} beenden?`)) return;
      b.disabled = true;
      try {
        if (was === "anfragen") { const r = await netz().rpc("rpg_request_friend", { p_handle: n }); toast(r === "freund" ? `Du bist jetzt mit ${n} befreundet.` : `Anfrage an ${n} gesendet.`); }
        if (was === "annehmen" || was === "ablehnen") await netz().rpc("rpg_answer_friend", { p_handle: n, p_accept: was === "annehmen" });
        if (was === "entfernen" || was === "zurueck") await netz().rpc("rpg_remove_friend", { p_handle: n });
        if (was === "blockieren") await netz().rpc("rpg_block", { p_handle: n });
        if (was === "entsperren") await netz().rpc("rpg_unblock", { p_handle: n });
      } catch (e) { toast(e.message); }
      posteingang(); freundeZeigen();
    }; });
  }
  /** Freunde zu einer Kampagne einladen (Host). Liefert die Liste der eingeladenen Namen. */
  async function freundeEinladen(kampagnenId, titel) {
    if (!istKonto()) return toast("Einladen geht mit einem Spielerkonto.");
    let d, offen = [], mitglieder = [];
    try {
      [d, offen] = await Promise.all([netz().rpc("rpg_my_friends", {}), netz().rpc("rpg_campaign_open_invites", { p_campaign_id: kampagnenId })]);
      mitglieder = ((await netz().rpc("rpg_load_campaign", { p_campaign_id: kampagnenId })).members || []).map((m) => (m.handle || m.display_name || "").toLowerCase());
    } catch (e) { return toast(e.message); }
    const waehlbar = d.freunde.filter((f) => !mitglieder.includes(f.handle.toLowerCase()) && !offen.includes(f.handle));
    const o = fenster("Freunde einladen", `<p class="note">„${esc(titel)}“: Wer annimmt, wird Mitspieler dieser Kampagne.</p>
      ${waehlbar.length ? `<ul class="f-liste wahl">${waehlbar.map((f) => `<li><label><input type="checkbox" value="${esc(f.handle)}"> <span class="hub-avatar klein">${ava(f.avatar_key, f.handle)}</span><b>${esc(f.handle)}</b></label></li>`).join("")}</ul><button class="my-knopf rot" id="f-einladen">Einladungen senden</button>`
        : `<p class="note">${d.freunde.length ? "Alle deine Freunde sind schon dabei oder eingeladen." : "Du hast noch keine Freunde. Füge sie unter „Freunde“ hinzu."}</p>`}
      ${offen.length ? `<p class="note klein">Schon eingeladen: ${esc(offen.join(", "))}</p>` : ""}`);
    const k = $("#f-einladen");
    if (k) k.onclick = async () => {
      const namen = [...o.querySelectorAll("input:checked")].map((i) => i.value); if (!namen.length) return toast("Bitte mindestens einen Freund auswählen.");
      k.disabled = true; let n = 0;
      for (const name of namen) { try { await netz().rpc("rpg_invite_friend", { p_campaign_id: kampagnenId, p_handle: name }); n++; } catch (e) { toast(e.message); } }
      o.hidden = true; toast(`${n} ${n === 1 ? "Einladung" : "Einladungen"} gesendet.`);
    };
  }
  /** Neue Kampagne: zuerst das Abenteuer wählen. Name und Freunde kommen später im Einladen-Schritt (Coop-Mode). */
  function neueKampagne() {
    const o = fenster("Neue Kampagne starten", `<p class="note">Welches Abenteuer wollt ihr spielen?</p>
      <div class="hub-welt-liste neu-wahl">${ABENTEUER().map((m) => abenteuerKachel(m, "data-neu-abenteuer")).join("")}</div>`);
    o.querySelectorAll("[data-neu-abenteuer]").forEach((b) => { b.onclick = () => { o.hidden = true; abenteuerStarten(b.dataset.neuAbenteuer); }; });
  }
  function abenteuerStarten(id) {
    // eine angefangene, aber nie gespielte Kampagne nicht versehentlich weiterverwenden
    if (window.KAMPAGNE && window.KAMPAGNE.vergessenWennLeer) window.KAMPAGNE.vergessenWennLeer();
    if (window.AB.abenteuerWaehlen) window.AB.abenteuerWaehlen(id);
    neuesAbenteuer();
  }
  function profilAktion(was) {
    const m = $("#hub-menue"); if (m) m.hidden = true;
    $("#qr-overlay").hidden = true;
    adminTab = null;
    if (was === "abmelden") return abmelden();
    if (was === "admin") return adminBereich("codes");
    if (was === "profil" || was === "bild") return profilSeite("bild");
    if (was === "kosmetik") return profilSeite("aussehen");
    if (was === "code") return profilSeite("code");
    if (was === "stufen") return SM.laden(true).then(() => fenster("Meine Helden", SM.heldenUebersichtHtml()));
    if (was === "chronik") return SM.laden(true).then(() => fenster("Chronik", SM.chronikHtml()));
    if (was === "codes") return codeUebersicht();
    if (was === "tutorial") { const m = $("#hub-menue"); if (m) m.hidden = true; if (window.ABTUT) { window.ABTUT.konto(profil && profil.handle); window.ABTUT.nochmal(); } return; }
    if (was === "arenastats") return arenaAuswertung();
    ansicht = was === "registrieren" ? "registrieren" : "anmelden";
    zeige("mythara"); kontoZeichnen();
    const f = $(ansicht === "registrieren" ? "#my-reg-name" : "#my-name"); if (f) f.focus();
  }
  function bildWaehlen() {
    const o = $("#qr-overlay"), F = window.ABF;
    o.innerHTML = `<div class="karte-box kampagnen"><div class="k-kopf"><h2>Profilbild wählen</h2><button class="link" id="bild-zu">Schließen</button></div>
      <div class="hub-bilder">${F.REIHE.map((f) => `<button class="hub-bild${profil.avatar_key === f ? " an" : ""}" data-bild="${f}" title="${esc(F.FIGUREN[f].name)}"><img src="img/figuren/${f}.jpg" alt=""><span>${esc(F.FIGUREN[f].name)}</span></button>`).join("")}</div></div>`;
    o.hidden = false; $("#bild-zu").onclick = () => { o.hidden = true; };
    o.querySelectorAll("[data-bild]").forEach((b) => { b.onclick = async () => {
      try { const p = await netz().rpc("rpg_set_profile", { p_handle: profil.handle, p_avatar_key: b.dataset.bild }); profil.avatar_key = p.avatar_key; o.hidden = true; hubKopf(); }
      catch (e) { toast(e.message); }
    }; });
  }
  function beitretenDialog() {
    const o = $("#qr-overlay");
    o.innerHTML = `<div class="karte-box kampagnen"><div class="k-kopf"><h2>Kampagne beitreten</h2><button class="link" id="bt-zu">Schließen</button></div>
      <p class="note">Gib den Code ein, den der Spieltisch zeigt – oder scanne den QR-Code dort einfach mit der Kamera deines Handys. Ein Tisch-Code macht dieses Gerät zum Spieltisch der Kampagne.</p>
      <form class="my-code" id="bt-form"><label for="bt-code">Einladungscode</label><input id="bt-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABEN-123456" maxlength="14"><p class="my-fb" id="bt-fb" role="status"></p><button class="my-knopf" type="submit">Beitreten</button></form></div>`;
    o.hidden = false; $("#bt-zu").onclick = () => { o.hidden = true; };
    $("#bt-code").addEventListener("input", (e) => { e.target.value = huebsch(e.target.value); $("#bt-fb").textContent = ""; });
    $("#bt-form").onsubmit = (e) => { e.preventDefault(); codeLos(sauber($("#bt-code").value), (t) => { $("#bt-fb").textContent = t; }); };
    $("#bt-code").focus();
  }
  const neuesAbenteuer = () => { const b = $("#titel-start"); if (b) b.click(); };
  async function hubListen() {
    const akt = $("#hub-aktuell"), zul = $("#hub-zuletzt");
    let liste = [];
    try { liste = window.KAMPAGNE ? await netz().rpc("rpg_my_campaigns", {}) : []; }
    catch (e) { akt.innerHTML = `<li class="hub-leer">${esc(e.message)}</li>`; zul.innerHTML = ""; return; }
    const offen = liste.filter((c) => ["geplant", "aktiv", "pausiert"].includes(c.status)).slice(0, 4);
    const zuletzt = liste.filter((c) => c.version > 0).slice(0, 3);
    const zeile = (c, mitKnopf) => { const i = c.checkpoint || {}, host = c.role === "host";
      return `<li><img src="${bildAbschnitt(i.abschnitt, i.abenteuer)}" alt="" ${BILD_ERSATZ}><div><b>${esc(c.title)}</b><small>${mitKnopf ? (host ? "Host" : c.role === "tisch" ? "Spieltisch" : "Mitspieler") + (i.titel ? " · " + esc(i.titel) : "") : esc(vor(c.updated_at)) + (c.status === "abgeschlossen" ? " · abgeschlossen" : "")}</small></div>${mitKnopf ? `<button class="hub-play" data-play="${c.id}" aria-label="${esc(c.title)} ${host ? "fortsetzen" : "beitreten"}" title="${host ? (c.version ? "Fortsetzen" : "Beginnen") : "Am Spieltisch beitreten"}">▶</button>` : ""}</li>`; };
    // Abenteuer, das nur in diesem Browser liegt (ohne Kampagne, z. B. vor der Einführung der Kampagnen)
    const lokal = window.ABT && window.ABT.gespeichert() && !(window.KAMPAGNE && window.KAMPAGNE.aktuell()) ? `<li id="hub-lokal"><img src="${bildAbschnitt(1)}" alt=""><div><b>Abenteuer in diesem Browser</b><small>Weiterspielen, wo ihr aufgehört habt</small></div><button class="hub-play" id="hub-lokal-play" aria-label="Abenteuer fortsetzen" title="Fortsetzen">▶</button></li>` : "";
    akt.innerHTML = lokal + (offen.length ? offen.map((c) => zeile(c, true)).join("") : lokal ? "" : `<li class="hub-leer">Noch keine laufende Kampagne. Starte eine neue!</li>`);
    const lp = $("#hub-lokal-play"); if (lp) lp.onclick = () => window.ABT.fortsetzen();
    zul.innerHTML = zuletzt.length ? zuletzt.map((c) => zeile(c, false)).join("") : `<li class="hub-leer">Noch nichts gespielt.</li>`;
    if (SM && istKonto() && !hubListen.nachgeholt) { hubListen.nachgeholt = true; SM.nachholen(liste).catch(() => {}); }
    akt.querySelectorAll("[data-play]").forEach((b) => { b.onclick = async () => {
      const c = liste.find((x) => x.id === b.dataset.play);
      if (c.role === "spieler") { location.href = "handy.html?kampagne=" + encodeURIComponent(c.id); return; } // Mitspieler: direkt zum Spieltisch
      b.disabled = true;
      try { if (c.version > 0) await window.KAMPAGNE.fortsetzen(c.id, Boolean(c.checkpoint && c.checkpoint.live)); else window.KAMPAGNE.beginnen(c); }
      catch (e) { toast(e.message); b.disabled = false; }
    }; });
  }
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-profil]"); if (p) return profilAktion(p.dataset.profil);
    if (e.target.closest("[data-sm-offen]") && SM) return SM.offeneBelohnung(() => heldenSeite());
    // Heldenseite: Klasse wählen, Held wählen, zurück zu allen Klassen
    const hs = e.target.closest("[data-heldenseite]");
    if (hs) {
      if (e.target.closest("[data-held-klassen]")) return heldenSeite();
      const k = e.target.closest("[data-klasse]"); if (k) return heldenSeite(k.dataset.klasse);
      const f = e.target.closest("[data-fid]"); if (f) return heldenSeite(window.ABF.FIGUREN[f.dataset.fid].klasse, f.dataset.fid);
    }
    const w = e.target.closest("[data-welt]"); if (w) return weltSeite(w.dataset.welt || null);
    const ns = e.target.closest("[data-neu-start]"); if (ns) return abenteuerStarten(ns.dataset.neuStart);
    const h = e.target.closest("[data-hub]"); if (!h || $("#hub").hidden) { const m = $("#hub-menue"); if (m && !m.hidden && !e.target.closest(".hub-profil")) m.hidden = true; return; }
    const was = h.dataset.hub;
    if (was === "uebersicht") return zeigeHub();
    if (was === "kampagnen") return window.KAMPAGNE ? window.KAMPAGNE.bibliothek()
      : seiteZeigen("kampagnen", `<h1 class="hub-gruss">Abenteurergilde</h1><p class="hub-untertitel">Gespeicherte Kampagnen sind gerade nicht verfügbar. Ein neues Abenteuer könnt ihr trotzdem beginnen.</p><div class="knoepfe gilde-knoepfe"><button class="btn" data-hub="neu">Neue Kampagne starten</button><button class="btn ghost" data-hub="beitreten">Kampagne beitreten</button></div>`);
    if (was === "helden") return heldenSeite();
    if (was === "neu") return neueKampagne();
    if (was === "freunde") return freundeZeigen();
    if (was === "lore") return loreSeite();
    if (was === "shop") return shopZeigen();
    if (was === "welt") return weltSeite();
    if (was === "regeln") return regelnSeite();
    if (was === "beitreten") return beitretenDialog();
    if (was === "arena") return window.ARENA ? window.ARENA.zeigen() : toast("Die Arena ist gerade nicht verfügbar.");
  });
  /* ---------- Arena (Migration 008): Gibt es sie, steht auf der Startseite „Arena“ statt „Kampagne beitreten“ ---------- */
  function waehrungZeigen(n) {
    const el = $("#hub-waehrung"); if (!el || !window.ARENA) return;
    el.hidden = !(profil && profil.konto); el.title = window.ARENA.WAEHRUNG + ": Belohnung für Siege in der Arena";
    el.innerHTML = `<i>${window.ARENA.ZEICHEN}</i>${Number(n) || 0}`;
  }
  let kachelAlt = null;
  /** Währung neben dem Profilbild zeigen, sobald es die Arena für dieses Konto gibt (die Arena selbst erreicht man über das Dorf) */
  async function arenaKachel() {
    if (!window.ARENA) return;
    if (Boolean(profil && profil.konto) && await window.ARENA.pruefen()) waehrungZeigen(window.ARENA.waehrung());
  }

  /* ---------- Zur Startseite (MYTHARA oben rechts und das Logo) ---------- */
  const SPIELANSICHT = ["szene", "spiel", "ende", "lobby", "einleitung", "einladen", "kodex", "intro"];
  async function nachHause() {
    const offen = SPIELANSICHT.find((id) => { const el = $("#" + id); return el && !el.hidden; });
    const laeuft = window.ABT && window.ABT.laeuft && window.ABT.laeuft(), live = window.AB.liveAn && window.AB.liveAn();
    if (offen && (laeuft || live)) {
      // Kampagne mit Handys: speichern, pausieren, Handys trennen (fragt selbst nach; Abbrechen = bleiben)
      if (live && window.KAMPAGNE && window.KAMPAGNE.aktiv()) { await window.KAMPAGNE.pausieren(); if (window.AB.liveAn()) return; }
      else {
        if (!confirm(live ? "Zur Startseite? Die Live-Runde wird beendet, die Handys werden getrennt. Das Abenteuer bleibt gespeichert." : "Zur Startseite? Euer Abenteuer bleibt gespeichert und kann fortgesetzt werden.")) return;
        if (live) await window.AB.liveBeenden();
        if (laeuft && window.ABT.pause) window.ABT.pause();
      }
    }
    $("#qr-overlay").hidden = true;
    if (imHub()) zeigeHub(); else { zeige("mythara"); window.scrollTo(0, 0); }
  }
  const heim = $("#brand-heim"); if (heim) heim.onclick = nachHause;
  document.querySelectorAll(".hub-logo, .my-logo").forEach((l) => { l.style.cursor = "pointer"; l.title = "Zur Startseite"; l.addEventListener("click", nachHause); });

  /* ---------- Verknüpfen ---------- */
  $("#my-gast-start").onclick = () => { profil = profil && profil.konto ? profil : null; try { sessionStorage.setItem(HUB, "gast"); } catch (e) { /* privat */ } zeigeHub(); };
  $("#my-code-zeigen").onclick = () => codeFeld($("#my-code").hidden);
  const tz = $("#my-tisch-zeigen"); if (tz) tz.onclick = () => { codeFeld(true); $("#my-code-feld").placeholder = "XXXX-XXXX-XXXX"; $("#my-code-fb").textContent = "Tisch-Code eingeben, den der bisherige Spieltisch zeigt."; };
  $("#my-beitreten").onclick = beitreten;
  $("#my-qr").onclick = scannen;
  $("#my-code").onsubmit = (e) => { e.preventDefault(); beitreten(); };
  $("#my-code-feld").addEventListener("input", (e) => { e.target.value = huebsch(e.target.value); $("#my-code-fb").textContent = ""; });
  const zurueck = $("#titel-mythara"); if (zurueck) zurueck.onclick = () => (imHub() ? zeigeHub() : zeige("mythara"));
  kontoZeichnen();
  // Nur neu zeichnen, wenn ein Konto angemeldet ist – sonst bliebe Eingetipptes nicht erhalten.
  // Angemeldet (oder schon als Gast unterwegs) und nichts anderes läuft: gleich auf die Spielerseite.
  if (KONTEN) profilLaden().then(async () => {
    if (profil && profil.konto) { if (SM) await SM.laden(); kontoZeichnen(); }
    if (imHub() && !$("#mythara").hidden) zeigeHub();
    if (imHub() && !$("#hub").hidden) sammlungPruefen();
  });
  if (SM) SM.beiAenderung(() => {
    const t = $("#hub-titel"); if (t && istKonto()) t.textContent = (smAktiv() && SM.titelText()) || "Spieler";
    if (istKonto() && !$("#mythara").hidden) kontoZeichnen();
  });
  /** Die Kampagne, die in der Übersicht nach dieser kommt (für „Weiter mit der nächsten Kampagne“) */
  const naechstesAbenteuer = (id) => { const l = ABENTEUER(), i = l.findIndex((m) => m.id === id); return i >= 0 && l[i + 1] ? l[i + 1] : null; };
  window.MYTHARA = { profil: profilSeite, ava, seite: seiteZeigen, waehrungZeigen, shop: shopZeigen, fenster, toast, avatarHtml, kopfNeu: () => hubKopf(), KONTEN, zeige: () => zeige("mythara"), zeigeHub, imHub, freundeEinladen, istKonto: () => istKonto(), naechstesAbenteuer, abenteuerStarten };
})();
