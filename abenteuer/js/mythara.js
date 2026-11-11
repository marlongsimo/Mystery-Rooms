/*
 * Mythara – Startbildschirm des RPG: als Gast spielen (ohne Registrierung, mit Einladungscode, per QR-Code)
 * oder – später – als Spieler mit Konto anmelden.
 * Die Kontoseite ist bis zur Freigabe von Bauabschnitt B nur mit ?konten in der Adresse sichtbar.
 */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const KONTEN = params.has("konten"); // Testschalter für Bauabschnitt B (Konten)
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zeige = (id) => window.AB && window.AB.zeigeSektion ? window.AB.zeigeSektion(id) : null;
  const sauber = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const huebsch = (v) => { const c = sauber(v); return c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; };

  /* ---------- Konto (Bauabschnitt B) ---------- */
  function kontoZeichnen() {
    const el = $("#my-konto-inhalt"), reg = $("#my-registrieren");
    if (!KONTEN) {
      el.innerHTML = `<p class="my-bald">Spielerkonten kommen bald. Dann bleiben deine Charaktere und Kampagnen auf allen Geräten gespeichert.</p>
        <p class="my-bald klein">Bis dahin spielst du als Gast. Deine Kampagnen werden in diesem Browser gespeichert.</p>`;
      reg.innerHTML = "";
      return;
    }
    el.innerHTML = `<form class="my-anmelden" id="my-anmelden" novalidate>
        <label class="my-feld"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20v14H2z"/><path d="M2 5l10 8 10-8" fill="none" stroke="#0d0b08" stroke-width="1.6"/></svg></span><input type="email" id="my-mail" autocomplete="email" placeholder="E-Mail-Adresse" aria-label="E-Mail-Adresse"></label>
        <label class="my-feld"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v11H5z"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg></span><input type="password" id="my-pw" autocomplete="current-password" placeholder="Passwort" aria-label="Passwort"><button type="button" class="my-auge" id="my-auge" aria-label="Passwort anzeigen"><span class="my-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3.2" fill="#0d0b08"/></svg></span></button></label>
        <button class="my-knopf rot" type="submit">Anmelden</button>
        <button class="my-link" type="button" id="my-vergessen">Passwort vergessen?</button>
        <p class="my-fb" id="my-konto-fb" role="status"></p>
      </form>`;
    reg.innerHTML = `<button class="my-reg-knopf" id="my-reg"><span class="my-ico gross"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7.5" r="4"/><path d="M1 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/><path d="M19 8v6M16 11h6" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>Noch kein Konto? <b>Jetzt registrieren</b><span aria-hidden="true" class="my-pfeil">→</span></button>`;
    const fb = (t) => { $("#my-konto-fb").textContent = t; };
    $("#my-auge").onclick = () => { const i = $("#my-pw"); i.type = i.type === "password" ? "text" : "password"; };
    $("#my-anmelden").onsubmit = (e) => { e.preventDefault(); fb("Die Anmeldung wird gerade gebaut (Bauabschnitt B) und ist noch nicht freigeschaltet."); };
    $("#my-vergessen").onclick = () => fb("Passwort zurücksetzen folgt mit den Spielerkonten.");
    $("#my-reg").onclick = () => fb("Die Registrierung folgt mit den Spielerkonten.");
  }

  /* ---------- Gast ---------- */
  function codeFeld(an) {
    const f = $("#my-code"); f.hidden = !an;
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

  /* ---------- Verknüpfen ---------- */
  $("#my-gast-start").onclick = () => { scannerStopp(); zeige("intro"); };
  $("#my-code-zeigen").onclick = () => codeFeld($("#my-code").hidden);
  $("#my-beitreten").onclick = beitreten;
  $("#my-qr").onclick = scannen;
  $("#my-code").onsubmit = (e) => { e.preventDefault(); beitreten(); };
  $("#my-code-feld").addEventListener("input", (e) => { e.target.value = huebsch(e.target.value); $("#my-code-fb").textContent = ""; });
  const zurueck = $("#titel-mythara"); if (zurueck) zurueck.onclick = () => zeige("mythara");
  kontoZeichnen();
  window.MYTHARA = { KONTEN, zeige: () => zeige("mythara") };
})();
