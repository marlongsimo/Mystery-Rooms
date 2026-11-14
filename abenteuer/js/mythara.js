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
  function seiteZeigen(name, html) {
    const s = $("#hub-seite");
    s.innerHTML = `<button class="hub-zurueck" data-hub="uebersicht">← Zur Übersicht</button>${html}`;
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
    if (!klasse) { seiteZeigen("helden", `<h1 class="hub-gruss">Charaktere</h1><p class="hub-untertitel">Fünf Klassen, fünfzehn Helden. Wähle eine Klasse, um ihre Helden kennenzulernen.</p>${sammlungKopf()}<div class="hub-helden" data-heldenseite>${HL.klassenWahl({ frei: smAktiv() ? frei : null })}</div>`); return; }
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
    if (S.start_offen) return SM.registrierung(() => zeigeHub());
    SM.offeneBelohnung(() => zeigeHub());
  }
  function codeFormHtml(p) {
    if (!smAktiv() || !SM.zustand().konto) return "";
    const voll = SM.zustand().helden.length >= 15;
    return `<form class="sm-code-form" id="${p}-sm-code" novalidate><label class="my-bald klein" for="${p}-sm-code-feld">${voll ? "Alle 15 Helden sind freigeschaltet." : "Freischalt-Code einlösen (schaltet alle 15 Helden frei)"}</label>
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
        fbc(r.neu ? `✓ ${r.neu} ${r.neu === 1 ? "Held" : "Helden"} freigeschaltet. Jetzt stehen dir alle 15 zur Wahl.` : "✓ Code eingelöst. Du hattest schon alle Helden.", "ok");
        toast("Alle 15 Helden sind freigeschaltet.");
        if (nachher) nachher();
      } catch (err) { fbc(err.message, "fehler"); k.disabled = false; }
    };
  }
  /** Admins: Codes anlegen (für eine bestimmte Person oder jede Person), Übersicht, sperren */
  async function codeUebersicht(neu) {
    if (!smAktiv() || !SM.istAdmin()) return toast("Die Code-Übersicht gibt es nur für Admins.");
    let liste = [];
    try { liste = await SM.adminCodes(); } catch (e) { return toast(e.message); }
    const d = (t) => { try { return new Date(t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return ""; } };
    const status = (c) => !c.aktiv ? "gesperrt" : new Date(c.gueltig_bis) < new Date() ? "abgelaufen" : c.eingeloest >= c.hoechstens ? "verbraucht" : "aktiv";
    const o = fenster("Code-Übersicht", `
      ${neu ? `<div class="sm-code-neu"><p class="note">Neuer Code „${esc(neu.bezeichnung)}“${neu.nur_fuer ? ` · nur für <b>${esc(neu.nur_fuer)}</b>` : " · für jede Person"} · ${neu.hoechstens}× einlösbar · gültig bis ${d(neu.gueltig_bis)}</p>
        <div class="sm-code-anzeige"><b id="sm-code-text">${esc(neu.code)}</b><button class="btn klein" id="sm-code-kopieren">Kopieren</button></div>
        <p class="note klein">Der Code wird nur jetzt angezeigt. Bitte gleich weitergeben oder notieren.</p></div>` : ""}
      <form class="sm-admin-form" id="sm-admin-form" novalidate>
        <h3 class="f-unter">Neuen Code erstellen</h3>
        <label>Bezeichnung <input id="sm-a-name" maxlength="80" placeholder="z. B. Für Lena, Gewinnspiel März" required></label>
        <fieldset class="sm-a-wahl"><legend>Einlösbar von</legend>
          <label><input type="radio" name="sm-a-fuer" value="person" checked> einer bestimmten Person</label>
          <label><input type="radio" name="sm-a-fuer" value="alle"> einer beliebigen Person</label></fieldset>
        <label id="sm-a-handle-feld">Benutzername <input id="sm-a-handle" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Benutzername des Spielers"></label>
        <div class="sm-a-reihe">
          <label id="sm-a-anzahl-feld" hidden>Wie oft einlösbar <input id="sm-a-anzahl" type="number" min="1" max="100" value="1"></label>
          <label>Gültig <select id="sm-a-tage"><option value="30">30 Tage</option><option value="90" selected>90 Tage</option><option value="180">180 Tage</option><option value="365">1 Jahr</option></select></label>
        </div>
        <button class="my-knopf rot" type="submit">Code erstellen</button><p class="my-fb" id="sm-a-fb" role="status"></p>
        <p class="note klein">Ein Code schaltet alle 15 Helden frei. Ein Code für eine bestimmte Person ist immer 1× einlösbar, und nur ihr Konto kann ihn einlösen. Höchstens 20 neue Codes pro Tag.</p>
      </form>
      <h3 class="f-unter">Codes (${liste.length})</h3>
      ${liste.length ? `<ul class="f-liste sm-code-liste">${liste.map((c) => `<li><span><b>${esc(c.bezeichnung)}</b><small>${c.nur_fuer ? "nur für " + esc(c.nur_fuer) : "jede Person"} · ${c.eingeloest} von ${c.hoechstens} eingelöst · bis ${d(c.gueltig_bis)}${c.angelegt_von ? " · von " + esc(c.angelegt_von) : ""}</small></span>
        <span class="f-knoepfe"><em class="sm-code-status ${status(c)}">${status(c)}</em>${c.aktiv ? `<button class="btn ghost klein gefahr" data-sm-sperren="${esc(c.id)}">Sperren</button>` : ""}</span></li>`).join("")}</ul>` : `<p class="note">Noch keine Codes.</p>`}`);
    const umschalten = () => {
      const person = o.querySelector('input[name="sm-a-fuer"]:checked').value === "person";
      $("#sm-a-handle-feld").hidden = !person; $("#sm-a-anzahl-feld").hidden = person;
    };
    o.querySelectorAll('input[name="sm-a-fuer"]').forEach((r) => { r.onchange = umschalten; });
    const kp = $("#sm-code-kopieren");
    if (kp) kp.onclick = async () => { try { await navigator.clipboard.writeText($("#sm-code-text").textContent); toast("Code kopiert."); } catch (e) { toast("Kopieren geht hier nicht – bitte abschreiben."); } };
    $("#sm-admin-form").onsubmit = async (e) => {
      e.preventDefault();
      const fb2 = (t) => { $("#sm-a-fb").textContent = t; };
      const bezeichnung = $("#sm-a-name").value.trim(), person = o.querySelector('input[name="sm-a-fuer"]:checked').value === "person", fuer = $("#sm-a-handle").value.trim();
      if (!bezeichnung) return fb2("Bitte eine Bezeichnung angeben.");
      if (person && !NAME.test(fuer)) return fb2("Bitte den genauen Benutzernamen eingeben.");
      const k = e.target.querySelector("button[type=submit]"); k.disabled = true; fb2("Code wird erstellt …");
      try { const r = await SM.adminErstellen({ bezeichnung, fuer: person ? fuer : null, anzahl: person ? 1 : +$("#sm-a-anzahl").value || 1, tage: +$("#sm-a-tage").value || 90 }); codeUebersicht(r); }
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
    seiteZeigen("regeln", `<h1 class="hub-gruss">Hilfe &amp; Regeln</h1><p class="hub-untertitel">Die Grundlagen, einfach erklärt. Ihr müsst nichts davon auswendig können: Das Spiel rechnet für euch.</p>${H ? `<div class="hub-text hilfe">${H.html()}</div>` : `<div class="hub-text kodex">${kopie('#kodex .seite:not([data-seite="6"])')}</div>`}`);
    if (H) H.binden(document);
  }
  function weltSeite(abenteuer) {
    if (!abenteuer) {
      seiteZeigen("welt", `<h1 class="hub-gruss">Kampagnenwelt</h1><p class="hub-untertitel">Die Splitterlande – und die Abenteuer, die dort auf euch warten.</p>
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
        <ul class="hub-fakten"><li>Schwierigkeit <b>${esc(schwer(m.schwierigkeit))}</b></li><li><b>${m.min}–${m.max}</b> Heldinnen und Helden</li><li><b>${esc(m.dauer || "")}</b></li><li><b>${esc(m.abschnitte || 2)}</b> Abschnitte</li><li><b>${esc(m.enden || 4)}</b> Enden</li><li>ab <b>12</b> Jahren</li></ul>
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
    $("#hub-profil").innerHTML = `<button class="hub-profil-knopf" id="hub-profil-knopf" aria-haspopup="true" aria-expanded="false"><span class="hub-avatar">${avatarHtml()}</span><span class="hub-name"><b>${esc(name)}</b><small id="hub-titel">${konto ? esc((smAktiv() && SM.titelText()) || "Spieler") : "Gast"}</small></span><span aria-hidden="true">▾</span></button>
      ${konto ? `<button class="hub-rund" id="hub-glocke" aria-label="Anfragen" title="Freundschafts- und Gruppenanfragen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a6 6 0 0 0-6 6v4.5L4 16v1.5h16V16l-2-3.5V8a6 6 0 0 0-6-6zM9.5 19.5a2.5 2.5 0 0 0 5 0z"/></svg></span><span class="hub-zahl" data-zahl="alle" hidden></span></button>` : ""}
      <button class="hub-rund" id="hub-einst" aria-label="Einstellungen" title="Einstellungen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 4.6v-2.2l-2.4-.6a7 7 0 0 0-.7-1.7l1.3-2.1-1.6-1.6-2.1 1.3a7 7 0 0 0-1.7-.7L13.1 3h-2.2l-.6 2.5a7 7 0 0 0-1.7.7L6.5 4.9 4.9 6.5l1.3 2.1a7 7 0 0 0-.7 1.7L3 10.9v2.2l2.5.6c.2.6.4 1.2.7 1.7l-1.3 2.1 1.6 1.6 2.1-1.3c.5.3 1.1.5 1.7.7l.6 2.5h2.2l.6-2.5c.6-.2 1.2-.4 1.7-.7l2.1 1.3 1.6-1.6-1.3-2.1c.3-.5.5-1.1.7-1.7z"/></svg></span></button>
      <div class="hub-menue" id="hub-menue" hidden>${konto ? `<button data-profil="bild">Profilbild wählen</button>${smAktiv() ? `<button data-profil="chronik">Chronik</button>` : ""}${smAktiv() ? `<button data-profil="code">Freischalt-Code</button>` : ""}${smAktiv() && SM.istAdmin() ? `<button data-profil="codes">Code-Übersicht</button>` : ""}<button data-profil="abmelden">Abmelden</button>` : `<button data-profil="anmelden">Anmelden</button><button data-profil="registrieren">Konto erstellen</button>`}</div>`;
    $("#hub-profil-knopf").onclick = () => { const m = $("#hub-menue"); m.hidden = !m.hidden; $("#hub-profil-knopf").setAttribute("aria-expanded", String(!m.hidden)); };
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
    o.innerHTML = `<div class="karte-box kampagnen" role="dialog" aria-label="${esc(titel)}"><div class="k-kopf"><h2>${esc(titel)}</h2><button class="link" id="fenster-zu">Schließen</button></div>${inhalt}</div>`;
    o.hidden = false; $("#fenster-zu").onclick = () => { o.hidden = true; hubListen(); posteingang(); };
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
    if (!istKonto()) { fenster("Freunde", `<p class="note">Freunde gibt es mit einem Spielerkonto: Dann kannst du andere über ihren Benutzernamen finden und zu deinen Kampagnen einladen.</p><button class="my-knopf rot" data-profil="registrieren">Konto erstellen</button>`); return; }
    let d; try { d = await netz().rpc("rpg_my_friends", {}); } catch (e) { fenster("Freunde", `<p class="fb">${esc(e.message)}</p>`); return; }
    const zeile = (x, knoepfe) => `<li><span class="hub-avatar klein">${ava(x.avatar_key, x.handle)}</span><b>${esc(x.handle)}</b><span class="f-knoepfe">${knoepfe}</span></li>`;
    const s = suchErgebnis;
    const sKnopf = !s ? "" : s.beziehung === "freund" ? `<span class="f-info">Ihr seid befreundet.</span>` : s.beziehung === "angefragt" ? `<span class="f-info">Anfrage gesendet.</span>` : s.beziehung === "anfrage_an_mich" ? `<button class="btn klein" data-f="annehmen" data-name="${esc(s.handle)}">Anfrage annehmen</button>` : s.beziehung === "blockiert" ? `<button class="btn ghost klein" data-f="entsperren" data-name="${esc(s.handle)}">Entsperren</button>` : `<button class="btn klein" data-f="anfragen" data-name="${esc(s.handle)}">Freundschaftsanfrage senden</button>`;
    const o = fenster("Freunde", `<form class="f-suche" id="f-suche"><label for="f-name">Spieler finden</label><div><input id="f-name" placeholder="Genauer Benutzername" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn klein" type="submit">Suchen</button></div><p class="my-fb" id="f-fb" role="status"></p></form>
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
    if (was === "abmelden") return abmelden();
    if (was === "bild") return bildWaehlen();
    if (was === "code") return codeDialog();
    if (was === "chronik") return SM.laden(true).then(() => fenster("Chronik", SM.chronikHtml()));
    if (was === "codes") return codeUebersicht();
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
    if (was === "kampagnen") return window.KAMPAGNE ? window.KAMPAGNE.bibliothek() : toast("Kampagnen sind gerade nicht verfügbar.");
    if (was === "helden") return heldenSeite();
    if (was === "neu") return neueKampagne();
    if (was === "freunde") return freundeZeigen();
    if (was === "welt") return weltSeite();
    if (was === "regeln") return regelnSeite();
    if (was === "beitreten") return beitretenDialog();
  });

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
  window.MYTHARA = { KONTEN, zeige: () => zeige("mythara"), zeigeHub, imHub, freundeEinladen, istKonto: () => istKonto() };
})();
