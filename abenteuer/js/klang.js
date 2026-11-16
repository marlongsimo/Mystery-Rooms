/*
 * Mythara – Klänge im Kampf: Würfel, Hieb, Zauber, Heilung, Schild. Ändert keine Regeln; die Effekt-Ebene (kampf-fx.js) ruft sie auf.
 * Gespielt wird über Web Audio (mehrere Klänge gleichzeitig, ohne Verzögerung). Browser lassen Ton erst nach dem ersten Tipp zu.
 * Aus, wenn der Schalter „Ton“ in den Einstellungen aus ist; Lautstärke über den Regler „Klänge“ (0 = aus), gemerkt auf diesem Gerät.
 * Die Dateien liegen in ton/fx/ und werden beim ersten Kampf geladen. Quellen: ton/fx/QUELLEN.md
 * Globaler Name: window.ABKLANG = { spiel(name, { laut, verzug }), laden(), laut(), setze(v), gespielt }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const ORDNER = "ton/fx/", STAND = "1";
  // Name → Dateien (bei mehreren wird abgewechselt), Grundlautstärke, Mindestabstand in ms (gegen Klangbrei bei vielen Treffern zugleich)
  const KLANG = {
    wuerfel: { d: ["wuerfel1", "wuerfel2", "wuerfel3", "wuerfel4"], l: .75, ab: 350 },
    hieb: { d: ["hieb"], l: .7, ab: 90 },
    zauber: { d: ["zauber"], l: .6, ab: 220 },
    heil: { d: ["heil"], l: .8, ab: 400 },
    schild: { d: ["schild"], l: .7, ab: 400 },
  };
  const KEY = "ab_klang";
  let laut = 0.7; try { const v = parseFloat(localStorage.getItem(KEY)); if (v >= 0 && v <= 1) laut = v; } catch (e) { /* privat */ }
  const tonAn = () => { try { return localStorage.getItem("ab_ton") !== "aus"; } catch (e) { return true; } };
  let ctx = null, gesamt = null, geladen = false;
  const puffer = {}, zuletzt = {}, letzte = {}, gespielt = [];

  function kontext() {
    if (ctx) return ctx;
    const K = window.AudioContext || window.webkitAudioContext; if (!K) return null;
    try { ctx = new K(); gesamt = ctx.createGain(); gesamt.gain.value = laut; gesamt.connect(ctx.destination); } catch (e) { ctx = null; }
    return ctx;
  }
  /** Lädt alle Klänge (einmal). Fehlt eine Datei, bleibt nur dieser Klang stumm. */
  function laden() {
    if (geladen || !kontext()) return; geladen = true;
    for (const k in KLANG) for (const d of KLANG[k].d) {
      fetch(`${ORDNER}${d}.mp3?v=${STAND}`).then((a) => (a.ok ? a.arrayBuffer() : Promise.reject(new Error(String(a.status)))))
        .then((b) => new Promise((ok, nein) => { const p = ctx.decodeAudioData(b, ok, nein); if (p && p.then) p.then(ok, nein); }))
        .then((p) => { puffer[d] = p; }).catch(() => { /* dieser Klang fehlt */ });
    }
  }
  /** Spielt einen Klang. laut: 0..1 zusätzlich zur Grundlautstärke; verzug: Millisekunden bis zum Beginn. */
  function spiel(name, o) {
    const k = KLANG[name]; if (!k || laut <= 0 || !tonAn() || document.hidden) return false;
    const c = kontext(); if (!c) return false;
    laden();
    const verzug = Math.max(0, (o && o.verzug) || 0), wann = Date.now() + verzug;
    if (zuletzt[name] && Math.abs(wann - zuletzt[name]) < k.ab) return false;
    // nicht zweimal dieselbe Fassung hintereinander
    let d = k.d[0]; if (k.d.length > 1) { const wahl = k.d.filter((x) => x !== letzte[name]); d = wahl[Math.floor(Math.random() * wahl.length)]; }
    const p = puffer[d]; if (!p || c.state !== "running") return false; // noch nicht geladen oder noch kein Tipp: lieber still als verspätet
    zuletzt[name] = wann; letzte[name] = d;
    try {
      const q = c.createBufferSource(), g = c.createGain(); q.buffer = p; g.gain.value = k.l * (o && o.laut != null ? o.laut : 1);
      if (k.d.length > 1) q.playbackRate.value = .94 + Math.random() * .12; // Würfel klingen nie ganz gleich
      q.connect(g); g.connect(gesamt); q.start(c.currentTime + verzug / 1000);
      gespielt.push({ name, d, t: wann }); if (gespielt.length > 60) gespielt.shift();
      return true;
    } catch (e) { return false; }
  }
  // Erst nach dem ersten Tipp darf Ton spielen (und nach einer Pause im Hintergrund wieder)
  const los = () => { const c = kontext(); if (c && c.state !== "running") c.resume().catch(() => {}); };
  ["pointerdown", "keydown", "touchend"].forEach((e) => document.addEventListener(e, los, { capture: true, passive: true }));

  function setze(v) { laut = Math.max(0, Math.min(1, Number(v) || 0)); try { localStorage.setItem(KEY, String(laut)); } catch (e) { /* privat */ } if (gesamt) gesamt.gain.value = laut; }
  // Regler in den Einstellungen (unter „Musik“)
  function regler() {
    const ton = $("#e-ton"); if (!ton || $("#e-klang")) return;
    const text = () => (laut <= 0 ? "aus" : Math.round(laut * 100) + " %");
    const zeile = document.createElement("label"); zeile.className = "schalter musik-regler";
    zeile.innerHTML = `<span>Klänge</span><input type="range" id="e-klang" min="0" max="100" step="5" value="${Math.round(laut * 100)}" aria-label="Lautstärke der Klänge im Kampf"><output id="e-klang-wert">${text()}</output>`;
    ton.closest("label").after(zeile);
    $("#e-klang").oninput = (e) => { setze(e.target.value / 100); $("#e-klang-wert").textContent = text(); };
    $("#e-klang").onchange = () => { los(); spiel("wuerfel"); }; // Hörprobe beim Loslassen
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", regler); else regler();

  window.ABKLANG = { spiel, laden, laut: () => laut, setze, gespielt, bereit: () => Object.keys(puffer).length, zustand: () => (ctx ? ctx.state : "kein") };
})();
