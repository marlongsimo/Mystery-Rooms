/*
 * Case Unlocked · Abenteuer – das Abenteuer am Spieltisch
 * Zeigt Szenen (Erzählung, Gespräch, Abstimmung, Probe, geheime Entscheidung, Lagerfeuer), startet Kämpfe
 * über spiel.js und wertet Wünsche der Handys aus. Die Regeln der Szenen stehen in szenen.js.
 */
(function () {
  "use strict";
  const S = window.ABS, R = window.ABR, F = window.ABF, B = window.ABB, AB = window.AB, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fett = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
  const KEY = "ab_abenteuer";
  let A = null, hilfeAn = true, letzterWurf = null;
  try { hilfeAn = localStorage.getItem("ab_hilfe") !== "aus"; } catch (e) { /* privat */ }
  const ATTR = { STR: "Stärke", GES: "Geschicklichkeit", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const HILFE = {
    erzaehlung: "Erzählung: Lest den Text laut vor und lasst ihn wirken. Mit „Weiter“ geht die Geschichte voran.",
    gespraech: "Gespräch: Ihr könnt in beliebiger Reihenfolge fragen und handeln, jede Möglichkeit einmal. Was gesagt wurde, steht im Verlauf. Wenn ihr genug wisst, geht es mit dem goldenen Knopf weiter.",
    wahl: "Gruppenentscheidung: Besprecht euch. Dann entscheidet die Gruppe – mit Handys stimmt jede Person geheim ab, die Mehrheit gilt, bei Gleichstand der Würfel. Viele Entscheidungen haben Folgen, manche erst viel später.",
    probe: "Probe: Eine Figur versucht es und würfelt einen W20 plus ihren Bonus. Erreicht sie den Schwierigkeitsgrad (SG), gelingt es. Knapp daneben kostet oft etwas, ein Fehlschlag führt auf einen anderen Weg. Wählt jemanden mit hohem Bonus.",
    geheim: "Geheime Entscheidung: Jede Person entscheidet ganz allein. Niemand am Tisch erfährt, wie die anderen entschieden haben.",
    kampf: "Kampf: Gleich wechselt ihr auf die Karte. Wer dran ist, zieht bis zu 6 Felder, macht eine Aktion und eine Bonusaktion, dann „Zug beenden“. Der Knopf „💡 Tipp“ schlägt einen sinnvollen Zug vor.",
    lager: "Lagerfeuer: Ihr ruht, heilt vollständig und bekommt eure Zauberplätze zurück. Das Spiel speichert hier.",
    raetsel: "Rätsel: Lest euch gegenseitig vor, was auf euren Handys steht. Dann schlagt die Glocken am Tisch in der richtigen Reihenfolge an. Jeder falsche Versuch lässt die Glocke von Grauwacht schlagen.",
  };

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
    if (hilfeAn && HILFE[s.art] && !A.zwischenprobe) h += `<div class="hilfe"><span>ⓘ</span><p>${esc(HILFE[s.art])}</p><button class="link" id="hilfe-aus">Hinweise ausblenden</button></div>`;
    if (A.zwischenprobe && hilfeAn) h += `<div class="hilfe"><span>ⓘ</span><p>${esc(HILFE.probe)}</p></div>`;
    if (s.art === "gespraech" && v.dialog.length) h += dialogHtml(v.dialog);
    else if (v.antwort) h += `<div class="antwort">${fett(v.antwort)}</div>`;
    h += `<div class="interaktion">${interaktion(v, s)}</div>`;
    h += gruppeHtml();
    if (v.protokoll.length) h += `<ol class="log kurz">${v.protokoll.slice().reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("")}</ol>`;
    el.innerHTML = h;
    const pw = el.querySelector(".probe-wuerfel");
    if (pw && window.ABW) {
      const [fid, w, ges, sg] = pw.dataset.wurfKey.split("-").map((x, i) => (i ? +x : x)), neu = pw.dataset.wurfKey !== letzterWurf; letzterWurf = pw.dataset.wurfKey;
      window.ABW.rollen(pw, w, `${F.FIGUREN[fid] ? F.FIGUREN[fid].name : ""}: ${w} + Bonus = ${ges} gegen SG ${sg}`, { titel: w === 20 || ges >= sg ? "Geschafft!" : ges >= sg - 3 ? "Knapp daneben" : "Daneben", gut: ges >= sg, sofort: !neu || new URLSearchParams(location.search).has("schnell") });
    }
    binde(el, v, s);
  }
  function dialogHtml(d) {
    const l = d[d.length - 1], wuerfel = l && l.wurf ? `<div class="probe-wuerfel" data-wurf-key="${l.werWuerfelt}-${l.wurf.w}-${l.wurf.gesamt}-${l.sg || 0}"></div>` : "";
    return `<div class="dialog">${d.map((e) => `<div class="d-frage"><small>Ihr</small><p>${fett(e.frage)}</p></div>${e.offen ? `<div class="d-antwort offen"><small>🎲 ${esc(e.probe)}</small><p>… eine Figur muss würfeln.</p></div>` : e.antwort ? `<div class="d-antwort ${e.stufe || ""}"><small>${e.probe ? `🎲 ${esc(e.probe)} · ${{ erfolg: "geschafft", knapp: "knapp daneben", fehl: "misslungen" }[e.stufe] || ""}${e.werWuerfelt ? " · " + esc(F.FIGUREN[e.werWuerfelt].name) + " würfelt " + e.wurf.w : ""}` : esc(e.wer || "")}</small><p>${fett(e.antwort)}</p></div>` : ""}`).join("")}</div>${wuerfel}`;
  }
  function probeHtml(v) {
    const p = v.probe, lebend = S.lebende(A);
    const attrName = typeof p.attr === "function" ? "Probe" : p.attr;
    let h = `<div class="probe"><b>${esc(p.name)}</b> · ${esc(attrName)} gegen SG ${p.sg}${p.gruppe ? " · alle würfeln, die Hälfte muss es schaffen" : ""}</div>`;
    const lw = Object.entries(p.wuerfe).pop();
    if (p.ergebnis && lw) h += `<div class="probe-wuerfel" data-wurf-key="${lw[0]}-${lw[1].w}-${lw[1].gesamt}-${p.sg}"></div>`;
    if (p.ergebnis) return h + `<div class="probe-erg ${p.ergebnis.stufe}">${{ erfolg: "Geschafft", knapp: "Knapp daneben", fehl: "Misslungen" }[p.ergebnis.stufe]}${p.ergebnis.text ? ": " + fett(p.ergebnis.text) : ""}</div><button class="btn" id="sz-weiter">Weiter</button>`;
    if (!p.gruppe && !p.wer) {
      const chance = (b) => Math.round(Math.max(5, Math.min(95, (21 - (p.sg - b)) * 5)));
      const beste = Math.max(...lebend.map((f) => p.boni[f]));
      h += `<p class="note">Wer versucht es?${live() ? " (oder auf dem eigenen Handy „Ich versuche es“)" : ""} Gebraucht wird ${esc(ATTR[p.attr] || "die passende Eigenschaft")}.</p><div class="wer">${lebend.map((fid) => `<button class="btn ghost wer-knopf ${p.boni[fid] === beste ? "beste" : ""}" data-wer="${fid}">${B.marke(fid, 28)} <span><b>${esc(F.FIGUREN[fid].name)}</b><small>Bonus ${p.boni[fid] >= 0 ? "+" : ""}${p.boni[fid]} · braucht ${Math.max(2, p.sg - p.boni[fid])}+ · ${chance(p.boni[fid])} %</small></span></button>`).join("")}</div>`;
      return h;
    }
    const offen = p.gruppe ? lebend.filter((f) => !p.wuerfe[f]) : [p.wer].filter((f) => !p.wuerfe[f]);
    const letzte = Object.entries(p.wuerfe).pop();
    if (letzte) h += `<div class="probe-wuerfel" data-wurf-key="${letzte[0]}-${letzte[1].w}-${letzte[1].gesamt}-${p.sg}"></div>`;
    h += `<ul class="wuerfe">${Object.entries(p.wuerfe).map(([fid, w]) => `<li class="${w.gesamt >= p.sg ? "gut" : "schlecht"}">${esc(F.FIGUREN[fid].name)}: W20 ${w.w} ${w.bonus >= 0 ? "+" : "−"} ${Math.abs(w.bonus)} = <b>${w.gesamt}</b></li>`).join("")}</ul>`;
    if (offen.length) h += `<div class="wer">${offen.map((fid) => `<button class="btn" data-wurf="${fid}">🎲 ${esc(F.FIGUREN[fid].name)} würfelt${live() && besitzer(fid) ? " (oder am Handy)" : ""}</button>`).join("")}</div>`;
    return h;
  }
  function raetselHtml(v) {
    const r = v.raetsel, n = r.folge.length;
    let h = `<div class="joch">${r.glocken.map((g) => `<button class="glockenknopf" data-glocke="${g.id}"><svg viewBox="0 0 60 70" aria-hidden="true"><path d="M30 6 C14 6 12 24 12 36 L8 52 H52 L48 36 C48 24 46 6 30 6Z" fill="#b08850" stroke="#5a4020" stroke-width="2"/><circle cx="30" cy="58" r="5" fill="#5a4020"/></svg><b>${esc(g.name)}</b></button>`).join("")}</div>`;
    h += `<p class="note">Angeschlagen: ${n ? r.folge.map((id) => `<b>${esc(r.glocken.find((g) => g.id === id).name)}</b>`).join(" → ") : "noch keine"} (${n} von ${r.laenge})${r.fehl ? ` · Fehlversuche: ${r.fehl}` : ""}</p>`;
    if (!live()) h += `<div class="platten">${Object.entries(r.hinweise).map(([fid, hs]) => hs.map((t) => `<blockquote class="platte"><small>${esc(F.FIGUREN[fid].name)} liest:</small>${fett(t)}</blockquote>`).join("")).join("")}</div>`;
    else h += `<p class="note">Die Verse der Grabplatten stehen auf euren Handys. Lest sie einander vor.</p>`;
    return h + `<div class="knoepfe"><button class="btn ghost" id="rz-neu" ${n ? "" : "disabled"}>Neu beginnen</button><button class="btn ghost" id="rz-auf">Aufgeben</button></div>`;
  }
  function ersatzHtml(v) {
    return `<div class="ersatz"><h2 class="klein">Ersatz für die Gefallenen</h2>${v.ersatz.offen.map((alt) => `<p>Wer kommt an ${esc(F.FIGUREN[alt].name)}s Stelle?${live() && besitzer(alt) ? ` (${esc(AB.spielerName(besitzer(alt)))} wählt auf dem Handy oder hier)` : ""}</p>
      <div class="ersatz-wahl">${v.ersatz.frei.map((neu) => `<button class="btn ghost klein" data-ersatz="${alt}:${neu}">${B.marke(neu, 26)} ${esc(F.FIGUREN[neu].name)}</button>`).join("")}</div>`).join("")}</div>`;
  }
  function interaktion(v, s) {
    if (A.zwischenprobe || (s.art === "probe")) return probeHtml(v);
    if (s.art === "raetsel") return raetselHtml(v);
    if (s.art === "lager" && v.ersatz) return ersatzHtml(v) + `<div class="knoepfe"><button class="btn ghost" id="sz-weiter">Ohne Ersatz weiter</button></div>`;
    if (s.art === "erzaehlung" || s.art === "lager") {
      const rast = s.rastErlaubt && A.schwierigkeit === "normal" && !A.merker["kurz_" + (s.abschnitt || 1)];
      return `<div class="knoepfe"><button class="btn" id="sz-weiter">Weiter</button>${rast ? `<button class="btn ghost" id="sz-rast" title="Halbe fehlende TP zurück. Die Glocke schlägt.">Kurze Rast (Glocke +1)</button>` : ""}</div>`;
    }
    if (s.art === "gespraech") {
      const fragen = v.optionen.filter((o) => !o.weiter), weiter = v.optionen.filter((o) => o.weiter);
      return `${fragen.length ? `<p class="akt-gruppe">Was wollt ihr tun?</p>` : ""}<div class="optionen-tisch">${fragen.map((o) => `<button class="btn ghost frage" data-opt="${o.id}"><span>${esc(o.text)}</span>${o.probe ? `<small>🎲 Probe: ${esc(ATTR[o.probe.attr] || "")} gegen SG ${o.probe.sg}</small>` : o.wer ? `<small>an ${esc(o.wer)}</small>` : ""}</button>`).join("")}</div>
        ${weiter.length ? `<p class="akt-gruppe">Weitergehen</p><div class="optionen-tisch">${weiter.map((o) => `<button class="btn" data-opt="${o.id}">${esc(o.text)}</button>`).join("")}</div>` : ""}`;
    }
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
    el.querySelectorAll("[data-glocke]").forEach((b) => { b.onclick = () => { if (window.ABE) window.ABE.glocke(0.35); S.raetselTipp(A, b.dataset.glocke); nachSzene(); }; });
    el.querySelectorAll("[data-ersatz]").forEach((b) => { b.onclick = () => { const [alt, neu] = b.dataset.ersatz.split(":"); if (!S.ersatz(A, alt, neu).fehler) AB.besitzTauschen(alt, neu); nach(); }; });
    const rn = $("#rz-neu"); if (rn) rn.onclick = () => { S.raetselNeu(A); nach(); };
    const ra = $("#rz-auf"); if (ra) ra.onclick = () => { if (confirm("Das Rätsel aufgeben? Was im Joch verborgen ist, bleibt dort.")) { S.raetselAufgeben(A); nachSzene(); } };
    const ha = $("#hilfe-aus"); if (ha) ha.onclick = () => { hilfeAn = false; try { localStorage.setItem("ab_hilfe", "aus"); } catch (e) { /* privat */ } render(); };
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
    else if (v.typ === "ersatz") { r = S.ersatz(A, fid, String(v.fid)); if (!r.fehler) AB.besitzTauschen(fid, String(v.fid)); }
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
