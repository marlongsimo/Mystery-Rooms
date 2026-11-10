/*
 * Case Unlocked · Abenteuer – das Abenteuer am Spieltisch
 * Zeigt Szenen (Erzählung, Gespräch, Abstimmung, Probe, geheime Entscheidung, Lagerfeuer), startet Kämpfe
 * über spiel.js und wertet Wünsche der Handys aus. Die Regeln der Szenen stehen in szenen.js.
 */
(function () {
  "use strict";
  const S = window.ABS, R = window.ABR, F = window.ABF, B = window.ABB, AB = window.AB, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fett = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const KEY = "ab_abenteuer";
  let A = null;

  const live = () => AB.liveAn();
  const besitzer = (fid) => AB.besitzVon(fid);
  function merken() { try { if (A) localStorage.setItem(KEY, JSON.stringify(S.speichern(A))); } catch (e) { /* privat */ } }
  function phase(p) { if (live()) AB.LIVE.phase = p; }

  function start(setup) {
    if (setup.gruppe.length < 3) return;
    A = S.neu(Math.floor(Math.random() * 1e9), { gruppe: setup.gruppe, schwierigkeit: setup.schwierigkeit });
    merken(); zeige();
  }
  function fortsetzen() {
    try { A = S.laden(JSON.parse(localStorage.getItem(KEY))); } catch (e) { A = null; }
    if (A) zeige();
  }
  function zeige() {
    AB.zeigeSektion("szene"); phase("szene");
    render(); AB.veroeffentlichen();
  }

  /* ---------- Darstellung ---------- */
  function glockeHtml(n) { return `<span class="glocke" title="Die Glocke hat ${n}× geschlagen">${Array.from({ length: 7 }, (_, i) => `<i class="${i < n ? "an" : ""}"></i>`).join("")}<small>Glocke ${n}/7</small></span>`; }
  function gruppeHtml() {
    return `<div class="gruppe-leiste">${A.gruppe.map((fid) => { const z = A.zust[fid], d = F.FIGUREN[fid], max = F.tpVon(fid, A.stufe), b = besitzer(fid);
      return `<span class="${z.tot ? "tot" : ""}">${B.marke(fid, 34)}<b>${esc(d.name)}</b><small>${z.tot ? "gefallen" : `${z.tp}/${max} TP`}${b ? " · 📱 " + esc(AB.spielerName(b)) : ""}</small></span>`; }).join("")}</div>`;
  }
  function render() {
    const el = $("#szene"); if (!el || !A) return;
    const v = S.ansicht(A), s = S.szene(A);
    if (window.ABE && render.letzte != null && A.glocke > render.letzte) window.ABE.glocke(0.9);
    render.letzte = A.glocke;
    let h = `<div class="szene-kopf"><span class="eyebrow">Abschnitt ${v.abschnitt} · ${esc(v.ort)} · Stufe ${v.stufe}${v.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</span>${glockeHtml(v.glocke)}</div>
      <h1>${esc(v.titel)}</h1><div class="erzaehlung">${v.text.map((p) => `<p>${fett(p)}</p>`).join("")}</div>`;
    if (v.antwort) h += `<div class="antwort">${fett(v.antwort)}</div>`;
    h += `<div class="interaktion">${interaktion(v, s)}</div>`;
    h += gruppeHtml();
    if (v.protokoll.length) h += `<ol class="log kurz">${v.protokoll.slice().reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("")}</ol>`;
    el.innerHTML = h;
    binde(el, v, s);
  }
  function probeHtml(v) {
    const p = v.probe, lebend = S.lebende(A);
    const attrName = typeof p.attr === "function" ? "Probe" : p.attr;
    let h = `<div class="probe"><b>${esc(p.name)}</b> · ${esc(attrName)} gegen SG ${p.sg}${p.gruppe ? " · alle würfeln, die Hälfte muss es schaffen" : ""}</div>`;
    if (p.ergebnis) return h + `<div class="probe-erg ${p.ergebnis.stufe}">${{ erfolg: "Geschafft", knapp: "Knapp daneben", fehl: "Misslungen" }[p.ergebnis.stufe]}${p.ergebnis.text ? ": " + fett(p.ergebnis.text) : ""}</div><button class="btn" id="sz-weiter">Weiter</button>`;
    if (!p.gruppe && !p.wer) {
      h += `<p class="note">Wer versucht es?${live() ? " (oder auf dem eigenen Handy „Ich versuche es“)" : ""}</p><div class="wer">${lebend.map((fid) => `<button class="btn ghost" data-wer="${fid}">${B.marke(fid, 28)} ${esc(F.FIGUREN[fid].name)} <small>${p.boni[fid] >= 0 ? "+" : ""}${p.boni[fid]}</small></button>`).join("")}</div>`;
      return h;
    }
    const offen = p.gruppe ? lebend.filter((f) => !p.wuerfe[f]) : [p.wer].filter((f) => !p.wuerfe[f]);
    h += `<ul class="wuerfe">${Object.entries(p.wuerfe).map(([fid, w]) => `<li class="${w.gesamt >= p.sg ? "gut" : "schlecht"}">${esc(F.FIGUREN[fid].name)}: W20 ${w.w} ${w.bonus >= 0 ? "+" : "−"} ${Math.abs(w.bonus)} = <b>${w.gesamt}</b></li>`).join("")}</ul>`;
    if (offen.length) h += `<div class="wer">${offen.map((fid) => `<button class="btn" data-wurf="${fid}">🎲 ${esc(F.FIGUREN[fid].name)} würfelt${live() && besitzer(fid) ? " (oder am Handy)" : ""}</button>`).join("")}</div>`;
    return h;
  }
  function interaktion(v, s) {
    if (A.zwischenprobe || (s.art === "probe")) return probeHtml(v);
    if (s.art === "erzaehlung" || s.art === "lager") {
      const rast = s.rastErlaubt && A.schwierigkeit === "normal" && !A.merker["kurz_" + (s.abschnitt || 1)];
      return `<div class="knoepfe"><button class="btn" id="sz-weiter">Weiter</button>${rast ? `<button class="btn ghost" id="sz-rast" title="Halbe fehlende TP zurück. Die Glocke schlägt.">Kurze Rast (Glocke +1)</button>` : ""}</div>`;
    }
    if (s.art === "gespraech") return `<div class="optionen-tisch">${v.optionen.map((o) => `<button class="btn ${o.weiter ? "" : "ghost"}" data-opt="${o.id}">${esc(o.text)}${o.probe ? " <small>Probe</small>" : ""}</button>`).join("")}</div>`;
    if (s.art === "wahl") {
      if (!live()) return `<div class="optionen-tisch">${v.optionen.map((o) => `<button class="btn ghost" data-opt="${o.id}">${esc(o.text)}</button>`).join("")}</div><p class="note">Besprecht es und tippt die Entscheidung an.</p>`;
      const n = Object.keys(A.stimmen).length, alle = S.lebende(A).length;
      return `<div class="optionen-tisch">${v.optionen.map((o) => `<div class="opt-zeile"><span>${esc(o.text)}</span></div>`).join("")}</div>
        <p class="note">Abstimmung auf den Handys: <b>${n} von ${alle}</b> haben abgestimmt (${S.lebende(A).map((f) => `${esc(F.FIGUREN[f].name)} ${A.stimmen[f] ? "✓" : "…"}`).join(" · ")}). Das Ergebnis erscheint, sobald alle abgestimmt haben.</p>
        <div class="knoepfe"><button class="btn ghost" id="sz-auswerten" ${n ? "" : "disabled"}>Jetzt auswerten</button></div>`;
    }
    if (s.art === "geheim") {
      const q = v.geheimFrage;
      if (!live()) return `<p><b>${esc(q.frage)}</b></p>${S.lebende(A).map((fid) => `<div class="opt-zeile">${B.marke(fid, 28)} <span>${esc(F.FIGUREN[fid].name)}</span>${q.antworten.map((a) => `<button class="btn ${A.geheim[fid] === a.id ? "" : "ghost"} klein" data-geheim="${fid}:${a.id}">${esc(a.text)}</button>`).join("")}</div>`).join("")}<div class="knoepfe"><button class="btn" id="sz-weiter" ${S.alleGeheim(A) ? "" : "disabled"}>Weiter</button></div>`;
      return `<p><b>${esc(q.frage)}</b></p><p class="note">Jede Person entscheidet auf ihrem Handy: <b>${q.fertig.length} von ${S.lebende(A).length}</b>. Niemand sieht, wie die anderen entschieden haben.</p>`;
    }
    if (s.art === "kampf") return `<div class="knoepfe"><button class="btn" id="sz-kampf">Zum Kampf</button></div>`;
    if (s.art === "ende") return `<div class="knoepfe"><button class="btn" id="sz-schluss">Zurück zum Start</button></div>`;
    return "";
  }
  function binde(el, v, s) {
    const nach = () => { merken(); render(); AB.veroeffentlichen(); };
    el.querySelectorAll("[data-opt]").forEach((b) => { b.onclick = () => { S.waehle(A, b.dataset.opt); nachSzene(); }; });
    el.querySelectorAll("[data-wer]").forEach((b) => { b.onclick = () => { S.probeWer(A, b.dataset.wer); nach(); }; });
    el.querySelectorAll("[data-wurf]").forEach((b) => { b.onclick = () => { S.probeWurf(A, b.dataset.wurf); nach(); }; });
    el.querySelectorAll("[data-geheim]").forEach((b) => { b.onclick = () => { const [fid, a] = b.dataset.geheim.split(":"); S.geheim(A, fid, a); nach(); }; });
    const w = $("#sz-weiter"); if (w) w.onclick = () => { S.weiter(A); nachSzene(); };
    const r = $("#sz-rast"); if (r) r.onclick = () => { S.kurzeRast(A); nach(); };
    const au = $("#sz-auswerten"); if (au) au.onclick = () => { S.auswerten(A); nachSzene(); };
    const k = $("#sz-kampf"); if (k) k.onclick = kampf;
    const e = $("#sz-schluss"); if (e) e.onclick = () => { try { localStorage.removeItem(KEY); } catch (x) { /* privat */ } A = null; AB.zeigeSetup(); };
  }
  function nachSzene() { merken(); render(); AB.veroeffentlichen(); }

  /* ---------- Kampf ---------- */
  function kampf() {
    const opts = S.kampfOptionen(A);
    AB.kampfStarten(opts, (st) => {
      const e = S.kampfEnde(A, st);
      merken();
      if (e.ergebnis === "rueckzug") AB.toast("Rückzug zum Lagerfeuer. Die Glocke schlägt.");
      zeige();
    });
  }

  /* ---------- Wünsche der Handys ---------- */
  function wunsch(uid, v) {
    if (!A) return "Kein Abenteuer läuft.";
    const fid = A.gruppe.find((f) => besitzer(f) === uid);
    if (!fid) return "Du spielst keine Figur.";
    let r;
    if (v.typ === "stimme") r = S.stimme(A, fid, String(v.opt));
    else if (v.typ === "geheim") r = S.geheim(A, fid, String(v.antwort));
    else if (v.typ === "probe_wer") r = S.probeWer(A, fid);
    else if (v.typ === "probe_wurf") r = S.probeWurf(A, fid);
    else return "Unbekannter Wunsch.";
    if (r.fehler) return r.fehler;
    const s = S.szene(A);
    if (s.art === "wahl" && S.lebende(A).every((f) => A.stimmen[f])) S.auswerten(A);
    if (s.art === "geheim" && S.alleGeheim(A)) S.weiter(A);
    merken(); render();
    return null;
  }
  /** Was die Handys sehen: Szene ohne die Stimmen und geheimen Antworten der anderen */
  function oeffentlich() {
    if (!A) return {};
    const v = S.ansicht(A);
    const stimmen = v.stimmen ? Object.keys(v.stimmen) : null;
    return { modus: "abenteuer", abenteuer: Object.assign({}, v, { stimmen, letzte: A.letzteAbstimmung || null }) };
  }

  // Start-Knopf „Abenteuer fortsetzen“, wenn ein Spielstand da ist (nur allein; live stellt spiel.js wieder her)
  (() => { let da = false; try { da = Boolean(localStorage.getItem(KEY)); } catch (e) { /* privat */ } if (da) { const k = document.querySelector("#intro .knoepfe"); if (k) { const b = document.createElement("button"); b.className = "btn"; b.id = "fortsetzen"; b.textContent = "Abenteuer fortsetzen"; b.onclick = fortsetzen; k.prepend(b); } } })();

  window.ABT = { start, fortsetzen, zeige, render, wunsch, oeffentlich, laeuft: () => Boolean(A), A: () => A,
    speichern: () => (A ? S.speichern(A) : null), laden: (o) => { A = S.laden(o); } };
})();
