/*
 * Case Unlocked · Abenteuer – Einstieg: Titelbild, Einleitung, Kodex (Regeln), Glockenklang
 * Der Klang wird im Browser erzeugt (Web Audio), es gibt keine Tondateien.
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s), AB = window.AB;
  const TON_KEY = "ab_ton";
  let tonAn = true; try { tonAn = localStorage.getItem(TON_KEY) !== "aus"; } catch (e) { /* privat */ }
  let ctx = null;

  /** Eine Glocke: mehrere Teiltöne, langsam ausklingend */
  function glocke(staerke = 1) {
    if (!tonAn) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime, grund = 110;
      const gesamt = ctx.createGain(); gesamt.gain.value = 0.22 * staerke; gesamt.connect(ctx.destination);
      [[1, 1, 6], [2, 0.6, 4.5], [2.76, 0.45, 3.5], [5.4, 0.25, 2.2], [8.93, 0.12, 1.4], [0.5, 0.5, 7]].forEach(([f, a, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = grund * f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(gesamt); o.start(t); o.stop(t + d + 0.1);
      });
    } catch (e) { /* kein Ton möglich */ }
  }
  function zeigeTon() { const b = $("#ton"); if (b) b.textContent = tonAn ? "🔔 Ton an" : "🔕 Ton aus"; }

  /* ---------- Seiten mit Punkten ---------- */
  function seiten(sektion, punkte, weiter, zurueck, fertig) {
    const el = $(sektion), ss = [...el.querySelectorAll(".seite")]; let i = 0;
    const zeige = () => {
      ss.forEach((s, j) => { s.hidden = j !== i; if (j === i) { s.classList.remove("einblenden"); void s.offsetWidth; s.classList.add("einblenden"); } });
      $(punkte).innerHTML = ss.map((_, j) => `<i class="${j === i ? "an" : ""}"></i>`).join("");
      const w = $(weiter); if (w) { w.hidden = i === ss.length - 1 && sektion === "#kodex"; w.textContent = i === ss.length - 1 ? "Weiter" : "Weiter"; }
      const z = $(zurueck); if (z) z.textContent = i === 0 ? "Überspringen" : "Zurück";
    };
    return {
      start(j = 0) { i = j; zeige(); },
      vor() { if (i < ss.length - 1) { i++; zeige(); } else fertig(); },
      zurueck() { if (i > 0) { i--; zeige(); } else fertig(true); },
      ende() { i = ss.length - 1; zeige(); },
    };
  }
  const einl = seiten("#einleitung", "#einl-punkte", "#einl-weiter", null, () => { AB.zeigeSektion("kodex"); kodex.start(0); });
  const kodex = seiten("#kodex", "#kodex-punkte", "#kodex-weiter", "#kodex-zurueck", (zurueckAmAnfang) => { if (zurueckAmAnfang === true) kodex.ende(); });

  $("#titel-start").onclick = () => { glocke(1); AB.zeigeSektion("einleitung"); einl.start(0); };
  $("#titel-regeln").onclick = () => { AB.zeigeSektion("kodex"); kodex.start(0); };
  $("#einl-weiter").onclick = () => einl.vor();
  $("#einl-skip").onclick = () => { AB.zeigeSektion("kodex"); kodex.start(0); };
  $("#kodex-weiter").onclick = () => kodex.vor();
  $("#kodex-zurueck").onclick = () => kodex.zurueck();
  $("#ton").onclick = () => { tonAn = !tonAn; try { localStorage.setItem(TON_KEY, tonAn ? "an" : "aus"); } catch (e) { /* privat */ } zeigeTon(); if (tonAn) glocke(0.6); };
  zeigeTon();

  // Hauptmenü: Gruppe verwalten, Einstellungen (Ton, bewegte Effekte, Spielhinweise)
  const EFF_KEY = "ab_effekte";
  let effekteAn = true; try { effekteAn = localStorage.getItem(EFF_KEY) !== "aus"; } catch (e) { /* privat */ }
  const zeigeEffekte = () => document.body.classList.toggle("ruhig", !effekteAn);
  zeigeEffekte();
  $("#titel-gruppe").onclick = () => AB.zeigeSetup();
  $("#titel-einst").onclick = () => {
    $("#e-ton").checked = tonAn; $("#e-effekte").checked = effekteAn;
    let h = true; try { h = localStorage.getItem("ab_hilfe") !== "aus"; } catch (e) { /* privat */ } $("#e-hilfe").checked = h;
    let vl = false; try { vl = localStorage.getItem("ab_vorlesen") === "an"; } catch (e) { /* privat */ } $("#e-vorlesen").checked = vl;
    $("#e-vorlesen").disabled = !window.speechSynthesis;
    $("#einst-panel").hidden = false; $("#e-ton").focus();
  };
  $("#e-ton").onchange = (e) => { tonAn = e.target.checked; try { localStorage.setItem(TON_KEY, tonAn ? "an" : "aus"); } catch (x) { /* privat */ } zeigeTon(); if (tonAn) glocke(0.5); };
  $("#e-effekte").onchange = (e) => { effekteAn = e.target.checked; try { localStorage.setItem(EFF_KEY, effekteAn ? "an" : "aus"); } catch (x) { /* privat */ } zeigeEffekte(); };
  $("#e-hilfe").onchange = (e) => { try { localStorage.setItem("ab_hilfe", e.target.checked ? "an" : "aus"); } catch (x) { /* privat */ } if (window.ABT && window.ABT.hilfe) window.ABT.hilfe(e.target.checked); };
  $("#e-vorlesen").onchange = (e) => { try { localStorage.setItem("ab_vorlesen", e.target.checked ? "an" : "aus"); } catch (x) { /* privat */ } if (window.ABT && window.ABT.vorlesen) window.ABT.vorlesen(e.target.checked);
    if (e.target.checked && window.speechSynthesis) { const u = new SpeechSynthesisUtterance("Seit sieben Nächten läutet die Glocke."); u.lang = "de-DE"; u.rate = 0.92; window.speechSynthesis.speak(u); } };
  $("#einst-zu").onclick = () => { $("#einst-panel").hidden = true; $("#titel-einst").focus(); };
  $("#einst-panel").addEventListener("click", (e) => { if (e.target.id === "einst-panel") $("#einst-zu").click(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#einst-panel").hidden) $("#einst-zu").click(); });

  // Würfel zum Ausprobieren
  $("#w20").onclick = () => {
    const btn = $("#w20"); btn.classList.remove("rollt"); void btn.offsetWidth; btn.classList.add("rollt");
    let n = 0; const tm = setInterval(() => {
      const w = 1 + Math.floor(Math.random() * 20); $("#w20-zahl").textContent = w;
      if (++n > 10) {
        clearInterval(tm);
        const bonus = 3, ges = w + bonus;
        $("#w20-text").innerHTML = w === 20 ? `<b>20!</b> Gelingt immer.` : w === 1 ? `<b>1.</b> Geht immer schief.` : `${w} + 3 (Bonus) = <b>${ges}</b> gegen SG 13: ${ges >= 13 ? "geschafft" : ges >= 10 ? "knapp daneben – mit Preis" : "misslungen"}.`;
      }
    }, 55);
  };

  // Schwierigkeit
  document.querySelectorAll("[data-schwer-wahl]").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll("[data-schwer-wahl]").forEach((x) => x.classList.toggle("an", x === b));
      const s = AB.SETUP(); s.schwierigkeit = b.dataset.schwerWahl; try { localStorage.setItem("ab_setup", JSON.stringify(s)); } catch (e) { /* privat */ }
    };
  });
  (() => { const s = AB.SETUP(); document.querySelectorAll("[data-schwer-wahl]").forEach((x) => x.classList.toggle("an", x.dataset.schwerWahl === s.schwierigkeit)); })();

  window.ABE = { glocke };
})();
