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
  const sauber = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const huebsch = (v) => { const c = sauber(v); return c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; };

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
        <button class="my-knopf" type="button" id="my-abmelden">Abmelden</button>
        <p class="my-fb" id="my-konto-fb" role="status"></p>`;
      reg.innerHTML = "";
      $("#my-abmelden").onclick = abmelden;
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
    const code = sauber($("#my-code-feld").value);
    if (code.length < 10) { $("#my-code-fb").textContent = "Bitte den vollständigen Code eingeben, z. B. ABEN-123456. Er steht am Spieltisch."; $("#my-code-feld").focus(); return; }
    location.href = "handy.html#" + huebsch(code);
  }
  /** Code aus einem gescannten Link oder Text holen */
  function codeAus(text) {
    try { const u = new URL(text, location.href); if (u.hash.length > 1) return sauber(decodeURIComponent(u.hash.slice(1))); } catch (e) { /* kein Link */ }
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
        try { const r = await det.detect(v); if (r.length) { const c = codeAus(r[0].rawValue); if (c.length >= 10) { scannerStopp(); location.href = "handy.html#" + huebsch(c); return; } } } catch (e) { /* weiter */ }
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
  const bildAbschnitt = (n) => `img/mythara/abschnitt-${[1, 2, 3].includes(+n) ? +n : 1}.webp`;
  const vor = (t) => {
    const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
    if (s < 90) return "gerade eben"; if (s < 3600) return `vor ${Math.round(s / 60)} Minuten`; if (s < 86400) return `vor ${Math.round(s / 3600)} Stunden`;
    const d = Math.round(s / 86400); return d === 1 ? "gestern" : d < 14 ? `vor ${d} Tagen` : `vor ${Math.round(d / 7)} Wochen`;
  };
  function zeigeHub() {
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
    $("#hub-profil").innerHTML = `<button class="hub-profil-knopf" id="hub-profil-knopf" aria-haspopup="true" aria-expanded="false"><span class="hub-avatar">${avatarHtml()}</span><span class="hub-name"><b>${esc(name)}</b><small>${konto ? "Spieler" : "Gast"}</small></span><span aria-hidden="true">▾</span></button>
      <button class="hub-rund" id="hub-einst" aria-label="Einstellungen" title="Einstellungen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 4.6v-2.2l-2.4-.6a7 7 0 0 0-.7-1.7l1.3-2.1-1.6-1.6-2.1 1.3a7 7 0 0 0-1.7-.7L13.1 3h-2.2l-.6 2.5a7 7 0 0 0-1.7.7L6.5 4.9 4.9 6.5l1.3 2.1a7 7 0 0 0-.7 1.7L3 10.9v2.2l2.5.6c.2.6.4 1.2.7 1.7l-1.3 2.1 1.6 1.6 2.1-1.3c.5.3 1.1.5 1.7.7l.6 2.5h2.2l.6-2.5c.6-.2 1.2-.4 1.7-.7l2.1 1.3 1.6-1.6-1.3-2.1c.3-.5.5-1.1.7-1.7z"/></svg></span></button>
      <div class="hub-menue" id="hub-menue" hidden>${konto ? `<button data-profil="bild">Profilbild wählen</button><button data-profil="abmelden">Abmelden</button>` : `<button data-profil="anmelden">Anmelden</button><button data-profil="registrieren">Konto erstellen</button>`}</div>`;
    $("#hub-profil-knopf").onclick = () => { const m = $("#hub-menue"); m.hidden = !m.hidden; $("#hub-profil-knopf").setAttribute("aria-expanded", String(!m.hidden)); };
    $("#hub-einst").onclick = () => { const t = $("#titel-einst"); if (t) t.click(); };
  }
  function profilAktion(was) {
    const m = $("#hub-menue"); if (m) m.hidden = true;
    if (was === "abmelden") return abmelden();
    if (was === "bild") return bildWaehlen();
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
      <p class="note">Gib den Code ein, den der Spieltisch zeigt – oder scanne den QR-Code dort einfach mit der Kamera deines Handys.</p>
      <form class="my-code" id="bt-form"><label for="bt-code">Einladungscode</label><input id="bt-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABEN-123456" maxlength="11"><p class="my-fb" id="bt-fb" role="status"></p><button class="my-knopf" type="submit">Beitreten</button></form></div>`;
    o.hidden = false; $("#bt-zu").onclick = () => { o.hidden = true; };
    $("#bt-code").addEventListener("input", (e) => { e.target.value = huebsch(e.target.value); $("#bt-fb").textContent = ""; });
    $("#bt-form").onsubmit = (e) => { e.preventDefault(); const c = sauber($("#bt-code").value); if (c.length < 10) { $("#bt-fb").textContent = "Bitte den vollständigen Code eingeben, z. B. ABEN-123456."; return; } location.href = "handy.html#" + huebsch(c); };
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
      return `<li><img src="${bildAbschnitt(i.abschnitt)}" alt=""><div><b>${esc(c.title)}</b><small>${mitKnopf ? (host ? "Host" : "Mitspieler") + (i.titel ? " · " + esc(i.titel) : "") : esc(vor(c.updated_at)) + (c.status === "abgeschlossen" ? " · abgeschlossen" : "")}</small></div>${mitKnopf ? `<button class="hub-play" data-play="${c.id}" aria-label="${esc(c.title)} ${host ? "fortsetzen" : "beitreten"}" title="${host ? (c.version ? "Fortsetzen" : "Beginnen") : "Am Spieltisch beitreten"}">▶</button>` : ""}</li>`; };
    // Abenteuer, das nur in diesem Browser liegt (ohne Kampagne, z. B. vor der Einführung der Kampagnen)
    const lokal = window.ABT && window.ABT.gespeichert() && !(window.KAMPAGNE && window.KAMPAGNE.aktuell()) ? `<li id="hub-lokal"><img src="${bildAbschnitt(1)}" alt=""><div><b>Abenteuer in diesem Browser</b><small>Weiterspielen, wo ihr aufgehört habt</small></div><button class="hub-play" id="hub-lokal-play" aria-label="Abenteuer fortsetzen" title="Fortsetzen">▶</button></li>` : "";
    akt.innerHTML = lokal + (offen.length ? offen.map((c) => zeile(c, true)).join("") : lokal ? "" : `<li class="hub-leer">Noch keine laufende Kampagne. Starte eine neue!</li>`);
    const lp = $("#hub-lokal-play"); if (lp) lp.onclick = () => window.ABT.fortsetzen();
    zul.innerHTML = zuletzt.length ? zuletzt.map((c) => zeile(c, false)).join("") : `<li class="hub-leer">Noch nichts gespielt.</li>`;
    akt.querySelectorAll("[data-play]").forEach((b) => { b.onclick = async () => {
      const c = liste.find((x) => x.id === b.dataset.play);
      if (c.role !== "host") return beitretenDialog();
      b.disabled = true;
      try { if (c.version > 0) await window.KAMPAGNE.fortsetzen(c.id, Boolean(c.checkpoint && c.checkpoint.live)); else window.KAMPAGNE.beginnen(c); }
      catch (e) { toast(e.message); b.disabled = false; }
    }; });
  }
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-profil]"); if (p) return profilAktion(p.dataset.profil);
    const h = e.target.closest("[data-hub]"); if (!h || $("#hub").hidden) { const m = $("#hub-menue"); if (m && !m.hidden && !e.target.closest(".hub-profil")) m.hidden = true; return; }
    const was = h.dataset.hub;
    if (was === "uebersicht") return zeigeHub();
    if (was === "kampagnen") return window.KAMPAGNE ? window.KAMPAGNE.bibliothek() : toast("Kampagnen sind gerade nicht verfügbar.");
    if (was === "helden") return window.AB.zeigeSetup();
    if (was === "welt" || was === "neu") return neuesAbenteuer();
    if (was === "regeln") { const b = $("#titel-regeln"); if (b) b.click(); return; }
    if (was === "beitreten") return beitretenDialog();
  });

  /* ---------- Verknüpfen ---------- */
  $("#my-gast-start").onclick = () => { profil = profil && profil.konto ? profil : null; try { sessionStorage.setItem(HUB, "gast"); } catch (e) { /* privat */ } zeigeHub(); };
  $("#my-code-zeigen").onclick = () => codeFeld($("#my-code").hidden);
  $("#my-beitreten").onclick = beitreten;
  $("#my-qr").onclick = scannen;
  $("#my-code").onsubmit = (e) => { e.preventDefault(); beitreten(); };
  $("#my-code-feld").addEventListener("input", (e) => { e.target.value = huebsch(e.target.value); $("#my-code-fb").textContent = ""; });
  const zurueck = $("#titel-mythara"); if (zurueck) zurueck.onclick = () => (imHub() ? zeigeHub() : zeige("mythara"));
  kontoZeichnen();
  // Nur neu zeichnen, wenn ein Konto angemeldet ist – sonst bliebe Eingetipptes nicht erhalten.
  // Angemeldet (oder schon als Gast unterwegs) und nichts anderes läuft: gleich auf die Spielerseite.
  if (KONTEN) profilLaden().then(() => { if (profil && profil.konto) kontoZeichnen(); if (imHub() && !$("#mythara").hidden) zeigeHub(); });
  window.MYTHARA = { KONTEN, zeige: () => zeige("mythara"), zeigeHub, imHub };
})();
