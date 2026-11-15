/*
 * Mythara – Hintergrundmusik je Ort: Dorf, Kampagnenszenen, Kampf. Wechselt der Ort, blendet das eine Stück aus und das andere ein.
 * Browser lassen Ton erst nach dem ersten Tipp zu: Die Musik beginnt deshalb mit der ersten Berührung der Seite.
 * Lautstärke in den Einstellungen (Regler „Musik“, 0 = aus), gemerkt auf diesem Gerät. Während des Intros schweigt sie (das Intro hat eigene Musik).
 * Die Dateien werden erst geladen, wenn ihr Ort zum ersten Mal betreten wird.
 * Globaler Name: window.ABMUSIK = { ort(), laut(), setze(v) }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  // Fehlt ein Stück (z. B. eigene Arena-Musik), gilt das unter „sonst“ genannte
  const STUECKE = { dorf: "ton/dorf.mp3", szene: "ton/szene.mp3", kampf: "ton/kampf.mp3" };
  const SONST = { arena: "kampf" };
  const KEY = "ab_musik", BLENDE = 1800, UEBERLAPP = 3.5;
  let laut = 0.45; try { const v = parseFloat(localStorage.getItem(KEY)); if (v >= 0 && v <= 1) laut = v; } catch (e) { /* privat */ }
  let frei = false;          // erst nach dem ersten Tipp darf Ton spielen
  let jetzt = null;          // { name, a: Audio, ziel: 0..1 }
  const alle = new Set();    // alle Audios, die gerade ein- oder ausblenden

  const sichtbar = (sel) => { const e = $(sel); return Boolean(e && !e.hidden); };
  /** Wo ist der Spieler gerade? null = Stille (Intro, Anmeldung, Seite im Hintergrund) */
  function ort() {
    if (document.hidden || $(".intro-film")) return null;
    if (sichtbar("#spiel")) return window.AB && window.AB.arenaAn && window.AB.arenaAn() ? "arena" : "kampf";
    if ($("#arena-ende") && !$("#arena-ende").hidden) return null;
    if (sichtbar("#szene") || sichtbar("#ende") || sichtbar("#lobby") || sichtbar("#einleitung") || sichtbar("#kodex") || sichtbar("#intro")) return "szene";
    if (sichtbar("#hub")) return "dorf";
    return null;
  }
  const datei = (name) => STUECKE[name] || STUECKE[SONST[name]] || null;

  function neu(src) {
    const a = new Audio(src); a.preload = "auto"; a.volume = 0; a._soll = 0; a._weg = false; alle.add(a);
    // Wiederholen mit Überblendung: kurz vor dem Ende beginnt eine zweite Wiedergabe von vorn
    a.addEventListener("timeupdate", () => { if (a._weg || a._folgt || !a.duration || a.duration - a.currentTime > UEBERLAPP) return;
      if (!jetzt || jetzt.a !== a) return; a._folgt = true; const b = neu(src); jetzt.a = b; b._soll = 1; a._soll = 0; a._weg = true; b.play().catch(() => {}); });
    a.addEventListener("ended", () => { alle.delete(a); });
    return a;
  }
  function wechsle(name) {
    const src = name ? datei(name) : null;
    if (jetzt && jetzt.src === src) return;
    if (jetzt) { jetzt.a._soll = 0; jetzt.a._weg = true; }
    jetzt = null;
    if (!src || !frei || laut <= 0) return;
    const a = neu(src); a._soll = 1; jetzt = { src, a };
    a.play().catch(() => { alle.delete(a); if (jetzt && jetzt.a === a) jetzt = null; });
  }
  // Takt: Ort prüfen, Lautstärken weich nachführen, Ausgeblendetes anhalten
  let zuletzt = Date.now();
  setInterval(() => {
    const dt = Date.now() - zuletzt; zuletzt = Date.now();
    wechsle(ort());
    for (const a of alle) {
      const soll = a._soll * laut, schritt = dt / BLENDE * Math.max(0.2, laut);
      a.volume = Math.max(0, Math.min(1, a.volume < soll ? Math.min(soll, a.volume + schritt) : Math.max(soll, a.volume - schritt)));
      if (a._weg && a.volume <= 0.001) { a.pause(); alle.delete(a); }
    }
  }, 120);
  const los = () => { if (frei) return; frei = true; wechsle(ort()); };
  ["pointerdown", "keydown", "touchstart"].forEach((e) => document.addEventListener(e, los, { capture: true, passive: true }));

  function setze(v) { laut = Math.max(0, Math.min(1, Number(v) || 0)); try { localStorage.setItem(KEY, String(laut)); } catch (e) { /* privat */ } if (laut <= 0 && jetzt) { jetzt.a._soll = 0; jetzt.a._weg = true; jetzt = null; } }
  // Regler in den Einstellungen
  function regler() {
    const box = $("#einst-panel .einst-box"), ton = $("#e-ton"); if (!box || !ton || $("#e-musik")) return;
    const zeile = document.createElement("label"); zeile.className = "schalter musik-regler";
    zeile.innerHTML = `<span>Musik</span><input type="range" id="e-musik" min="0" max="100" step="5" value="${Math.round(laut * 100)}" aria-label="Lautstärke der Musik"><output id="e-musik-wert">${laut <= 0 ? "aus" : Math.round(laut * 100) + " %"}</output>`;
    ton.closest("label").after(zeile);
    $("#e-musik").oninput = (e) => { setze(e.target.value / 100); $("#e-musik-wert").textContent = laut <= 0 ? "aus" : Math.round(laut * 100) + " %"; };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", regler); else regler();

  window.ABMUSIK = { ort, laut: () => laut, setze, spielt: () => (jetzt ? { src: jetzt.src, laut: jetzt.a.volume, pausiert: jetzt.a.paused } : null) };
})();
