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
  const SCHNELL = new URLSearchParams(location.search).has("schnell");
  const ABSCHNITTE = { 1: "Die Abtei", 2: "Die Krypta", 3: "Das Siegel" };
  let vorlesenAn = false; try { vorlesenAn = localStorage.getItem("ab_vorlesen") === "an"; } catch (e) { /* privat */ }
  const ohneMarkup = (t) => String(t || "").replace(/\*\*?/g, "").replace(/[„“"]/g, "");

  /* ---------- Vorlesen (Browserstimme, experimentell) ---------- */
  const sprache = typeof window !== "undefined" && window.speechSynthesis ? window.speechSynthesis : null;
  function stimme() {
    if (!sprache) return null;
    const alle = sprache.getVoices().filter((v) => /^de(-|_|$)/i.test(v.lang));
    const gut = ["Google Deutsch", "Anna", "Helena", "Markus", "Petra", "Yannick", "Katja", "Conrad"];
    return gut.map((n) => alle.find((v) => v.name.includes(n))).find(Boolean) || alle[0] || null;
  }
  function vorlesen(texte) {
    if (!sprache) return false;
    sprache.cancel();
    const v = stimme();
    for (const t of texte.map(ohneMarkup).filter(Boolean)) {
      const u = new SpeechSynthesisUtterance(t); u.lang = "de-DE"; if (v) u.voice = v; u.rate = 0.92; u.pitch = 0.9;
      sprache.speak(u);
    }
    return true;
  }
  const verstummen = () => { if (sprache) sprache.cancel(); };

  /* ---------- Titelkarte beim Wechsel in einen neuen Abschnitt ---------- */
  function titelkarte(n, fertig) {
    const el = document.createElement("div"); el.className = "titelkarte"; el.setAttribute("role", "presentation");
    el.innerHTML = `<div><p class="eyebrow">Abschnitt ${n}</p><h2>${esc(ABSCHNITTE[n] || "")}</h2><span class="titel-zier" aria-hidden="true"></span></div>`;
    document.body.appendChild(el);
    if (window.ABE) window.ABE.glocke(n === 3 ? 1 : 0.7);
    let weg = false; const schliessen = () => { if (weg) return; weg = true; el.classList.add("aus"); setTimeout(() => { el.remove(); if (fertig) fertig(); }, 700); };
    el.onclick = schliessen; setTimeout(schliessen, 3400);
  }
  try { hilfeAn = localStorage.getItem("ab_hilfe") !== "aus"; } catch (e) { /* privat */ }
  const ATTR = { STR: "Stärke", GES: "Geschicklichkeit", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const HILFE = {
    erzaehlung: "Erzählung: Lest den Text laut vor und lasst ihn wirken. Mit „Weiter“ geht die Geschichte voran.",
    gespraech: "Gespräch: Ihr könnt in beliebiger Reihenfolge fragen und handeln, jede Möglichkeit einmal. Was gesagt wurde, steht im Verlauf. Wenn ihr genug wisst, geht es mit dem goldenen Knopf weiter.",
    wahl: "Gruppenentscheidung: Besprecht euch. Dann entscheidet die Gruppe – mit Handys stimmt jede Person geheim ab, die Mehrheit gilt, bei Gleichstand der Würfel. Viele Entscheidungen haben Folgen, manche erst viel später.",
    probe: "Probe: Eine Figur versucht es und würfelt einen W20 plus ihren Bonus. Erreicht sie den Schwierigkeitsgrad (SG), gelingt es. Knapp daneben kostet oft etwas, ein Fehlschlag führt auf einen anderen Weg. Wählt jemanden mit hohem Bonus.",
    geheim: "Geheime Entscheidung: Jede Person entscheidet ganz allein. Niemand am Tisch erfährt, wie die anderen entschieden haben.",
    kampf: "Kampf: Gleich wechselt ihr auf die Karte. Wer dran ist, läuft so weit, wie die Figur kann (Krieger 3, Zauberer und Kleriker 4, Schurken und Waldläufer 5 Felder), macht eine Aktion und eine Bonusaktion, dann „Zug beenden“. Der Knopf „💡 Tipp“ schlägt einen sinnvollen Zug vor.",
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
    merken();
    if (window.KAMPAGNE) window.KAMPAGNE.abenteuerBegonnen();
    zeige();
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
      const dinge = (z.rucksack || []).filter((x) => R.GEGENSTAENDE[x.id] && x.n > 0).map((x) => `<i title="${esc(R.GEGENSTAENDE[x.id].name)}: ${esc(R.GEGENSTAENDE[x.id].text)}">${R.GEGENSTAENDE[x.id].sym}</i>`).join("");
      const rel = z.tot && S.reliquieTraeger(A) ? `<button class="btn klein reliquie-knopf" data-wiederbeleben="${fid}" title="Reliquie der Brüder nutzen">✝ Zurückholen</button>` : "";
      return `<span class="${z.tot ? "tot" : ""}" data-held="${fid}" role="button" tabindex="0" title="${esc(d.name)} ansehen">${B.marke(fid, 34)}<b>${esc(d.name)}${dinge ? ` <em class="dinge">${dinge}</em>` : ""}</b><small>${z.tot ? "gefallen" : `${z.tp}/${max} TP`}${b ? " · 📱 " + esc(AB.spielerName(b)) : ""}</small>${rel}</span>`; }).join("")}</div>`;
  }
  /** Heldenansicht im Abenteuer: alle Einzelheiten wie bei der Auswahl, auf der aktuellen Stufe, mit aktuellem Stand */
  function heldZeigen(fid) {
    const HL = window.ABH_HELDEN; if (!HL || !A) return;
    const z = A.zust[fid], max = F.tpVon(fid, A.stufe), b = besitzer(fid);
    const dinge = (z.rucksack || []).filter((x) => x.n > 0).map((x) => { const g = R.GEGENSTAENDE[x.id], t = R.DINGE && R.DINGE[x.id]; const n = g ? `${g.sym} ${g.name}` : t ? t.name : x.id; return `<li><b>${esc(n)}${x.n > 1 ? ` ×${x.n}` : ""}</b>${g ? `<span>${esc(g.text)}</span>` : ""}</li>`; }).join("");
    const stand = `<div class="held-stand"><p><b>Stufe ${A.stufe}</b> · ${z.tot ? "<span class=\"gefallen\">gefallen</span>" : `${z.tp}/${max} TP`}${b ? ` · 📱 ${esc(AB.spielerName(b))}` : ""}</p>${dinge ? `<ul>${dinge}</ul>` : `<p class="note">Keine Gegenstände.</p>`}</div>`;
    let dlg = document.getElementById("held-dialog");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "held-dialog"; dlg.className = "held-dialog";
      dlg.innerHTML = `<button class="held-dialog-zu" aria-label="Schließen">✕</button><div class="held-dialog-inhalt"></div>`;
      document.body.appendChild(dlg);
      dlg.querySelector(".held-dialog-zu").onclick = () => dlg.close();
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    }
    dlg.querySelector(".held-dialog-inhalt").innerHTML = HL.detail(fid, A.stufe, stand);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  /* ---------- Chronik: jedes beendete Abenteuer bleibt auf dem Gerät ---------- */
  const CHRONIK = "ab_chronik";
  function chronik() { try { return JSON.parse(localStorage.getItem(CHRONIK) || "[]"); } catch (e) { return []; } }
  function chronikSchreiben(s) {
    if (A.chronik) return; A.chronik = true; merken();
    const n = (fid) => (F.FIGUREN[fid] ? F.FIGUREN[fid].name : fid), m = A.merker;
    const e = { zeit: Date.now(), ende: s.titel, szene: A.szene, schwierigkeit: A.schwierigkeit, glocke: A.glocke,
      gruppe: A.gruppe.map(n), gefallen: A.gefallen.map(n), hueter: m.hueter ? n(m.hueter) : m.verrat_opfer ? n(m.verrat_opfer) : A.szene === "ende_kobold" ? "Nisk" : A.szene === "ende_waechter" ? "Anselm" : null,
      splitter: Boolean(m.splitter), tam: Boolean(m.tam_gerettet) };
    const c = chronik(); c.unshift(e); try { localStorage.setItem(CHRONIK, JSON.stringify(c.slice(0, 50))); } catch (x) { /* privat */ }
    chronikKnopf();
  }
  function chronikKnopf() {
    const c = chronik(), fuss = document.querySelector("#intro .titel-fuss"); if (!fuss || !c.length) return;
    let b = document.querySelector("#chronik"); if (!b) { b = document.createElement("button"); b.className = "link"; b.id = "chronik"; fuss.append(" · ", b); b.onclick = chronikZeigen; }
    b.textContent = `📜 Chronik (${c.length})`;
  }
  function chronikZeigen() {
    const o = $("#qr-overlay"), c = chronik();
    const zeile = (e) => `<li><b>${esc(e.ende)}</b> <span class="note">${new Date(e.zeit).toLocaleDateString("de-DE")} · ${e.schwierigkeit === "hardcore" ? "Hardcore" : "Normal"} · Glocke ${e.glocke}/7</span><br>
      ${esc(e.gruppe.join(", "))}${e.gefallen.length ? `<br><span class="schlecht">Gefallen: ${esc(e.gefallen.join(", "))}</span>` : ""}${e.hueter ? `<br>Hüter von Grauwacht: ${esc(e.hueter)}` : ""}${e.splitter ? "<br>✦ Splitter von Grauwacht im Gepäck" : ""}${e.tam ? "<br>Tam kam nach Hause." : ""}</li>`;
    o.innerHTML = `<div class="karte-box chronik"><h2>Chronik von Grauwacht</h2><ol>${c.map(zeile).join("")}</ol><button class="btn" id="chronik-zu">Schließen</button></div>`;
    o.hidden = false; $("#chronik-zu").onclick = () => { o.hidden = true; };
  }

  function render() {
    const el = $("#szene"); if (!el || !A) return;
    const v = S.ansicht(A), s = S.szene(A);
    if (s.art === "ende") chronikSchreiben(s);
    // Inszenierung: neue Szene → Absätze erscheinen nacheinander; neuer Abschnitt → Titelkarte; Farbstimmung je Abschnitt
    const neueSzene = render.szene !== v.szene, ruhig = SCHNELL || document.body.classList.contains("ruhig") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const auftritt = neueSzene && !ruhig && v.text.length > 0;
    document.body.dataset.abschnitt = String(v.abschnitt || 1);
    if (neueSzene) {
      verstummen();
      const neuerAbschnitt = render.abschnitt != null && v.abschnitt && v.abschnitt !== render.abschnitt && v.abschnitt <= 3;
      render.szene = v.szene; render.abschnitt = v.abschnitt || render.abschnitt;
      if (neuerAbschnitt && !ruhig) titelkarte(v.abschnitt);
      if (vorlesenAn) setTimeout(() => vorlesen([v.titel].concat(v.text)), neuerAbschnitt && !ruhig ? 3600 : 300);
    } else if (vorlesenAn && v.antwort && v.antwort !== render.antwort) vorlesen([v.antwort]);
    render.antwort = v.antwort;
    if (window.ABE && render.letzte != null && A.glocke > render.letzte) window.ABE.glocke(0.9);
    render.letzte = A.glocke;
    let h = `<div class="szene-kopf"><span class="eyebrow">Abschnitt ${v.abschnitt} · ${esc(v.ort)} · Stufe ${v.stufe}${v.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</span>${glockeHtml(v.glocke)}<span class="kopf-links">${sprache ? `<button class="link" id="sz-vorlesen" title="Text vorlesen (Browserstimme) – noch einmal tippen zum Anhalten">🔊 Vorlesen</button>` : ""}${AB.liveAn() ? (window.KAMPAGNE && window.KAMPAGNE.aktiv() ? `<button class="link" id="sz-kpause" title="Kampagne speichern und pausieren – fortsetzen unter „Meine Kampagnen“">Pausieren</button>` : "") : `<button class="link" id="sz-pause" title="Zurück zum Titel – der Spielstand bleibt gespeichert">Pause</button>`}</span></div>
      <h1>${esc(v.titel)}</h1><div class="erzaehlung ${auftritt ? "auftritt" : ""}">${v.text.map((p, i) => `<p style="--i:${i}">${fett(p)}</p>`).join("")}</div>`;
    if (hilfeAn && HILFE[s.art] && !A.zwischenprobe) h += `<div class="hilfe"><span>ⓘ</span><p>${esc(HILFE[s.art])}</p><button class="link" id="hilfe-aus">Hinweise ausblenden</button></div>`;
    if (A.zwischenprobe && hilfeAn) h += `<div class="hilfe"><span>ⓘ</span><p>${esc(HILFE.probe)}</p></div>`;
    if (s.art === "gespraech" && v.dialog.length) h += dialogHtml(v.dialog);
    else if (v.antwort) h += `<div class="antwort">${fett(v.antwort)}</div>`;
    h += `<div class="interaktion ${auftritt ? "auftritt" : ""}" style="--i:${v.text.length}">${interaktion(v, s)}</div>`;
    h += gruppeHtml();
    if (v.protokoll.length) h += `<ol class="log kurz">${v.protokoll.slice().reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("")}</ol>`;
    el.innerHTML = h;
    const pw = el.querySelector(".probe-wuerfel");
    if (pw && window.ABW) {
      const [fid, w, ges, sg] = pw.dataset.wurfKey.split("-").map((x, i) => (i ? +x : x)), neu = pw.dataset.wurfKey !== letzterWurf; letzterWurf = pw.dataset.wurfKey;
      window.ABW.rollen(pw, w, `${F.FIGUREN[fid] ? F.FIGUREN[fid].name : ""}: ${w} + Bonus = ${ges} gegen SG ${sg}`, { titel: w === 20 || ges >= sg ? "Geschafft!" : ges >= sg - 3 ? "Knapp daneben" : "Daneben", gut: ges >= sg, sofort: !neu || new URLSearchParams(location.search).has("schnell") });
    }
    binde(el, v, s);
    const erz = el.querySelector(".erzaehlung.auftritt");
    if (erz) { const alles = () => el.querySelectorAll(".auftritt").forEach((x) => x.classList.remove("auftritt")); erz.onclick = alles; erz.title = "Tippen: alles sofort zeigen"; }
    const vl = $("#sz-vorlesen"); if (vl) vl.onclick = () => { if (sprache && sprache.speaking) verstummen(); else vorlesen([v.titel].concat(v.text, v.antwort ? [v.antwort] : [])); };
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
  /** Beutewahl: drei Gegenstände, einer geht an eine Figur */
  function beuteHtml(v) {
    const b = v.beute;
    const karte = (g) => `<div class="beute-karte ${A.beuteWahl === g.id ? "an" : ""}" data-beute-ding="${g.id}" role="button" tabindex="0">
      <span class="beute-sym" aria-hidden="true">${g.sym}</span><b>${esc(g.name)}</b><p>${esc(g.text)}</p>
      <small>${g.verbrauch ? "Verbrauchsgegenstand – kommt in den Rucksack" : `Wird getragen · höchstens ${b.max} je Figur`}${g.nur ? ` · nur ${g.nur.map((k) => F.KLASSEN[k].name).join(" und ")}` : ""}</small></div>`;
    const gewaehlt = A.beuteWahl && b.dinge.find((g) => g.id === A.beuteWahl);
    const helden = gewaehlt ? `<p class="note">Wer bekommt <b>${esc(gewaehlt.name)}</b>?</p><div class="beute-helden">${Object.entries(b.helden).map(([fid, h]) => {
      const tr = h.getragen.map((id) => R.GEGENSTAENDE[id].sym + " " + R.GEGENSTAENDE[id].name).join(", ");
      return `<button class="btn ${h.darf[gewaehlt.id] ? "ghost" : "ghost"} beute-held" data-beute="${gewaehlt.id}:${fid}" ${h.darf[gewaehlt.id] ? "" : "disabled"}>${B.marke(fid, 30)}<span><b>${esc(F.FIGUREN[fid].name)}</b><small>${tr ? "trägt: " + esc(tr) : "trägt noch nichts"}${h.darf[gewaehlt.id] ? "" : " · kann das nicht nehmen"}</small></span></button>`;
    }).join("")}</div>` : `<p class="note">Wählt einen Gegenstand. Danach entscheidet ihr, wer ihn bekommt.</p>`;
    return `<section class="beute"><h2>Beute</h2><p>Zwischen den Gefallenen findet ihr etwas. Ihr könnt <b>eines</b> davon mitnehmen.</p>
      <div class="beute-karten">${b.dinge.map(karte).join("")}</div>${helden}
      <div class="knoepfe"><button class="link" id="beute-lassen">Nichts mitnehmen</button></div></section>`;
  }
  /** Aufstieg am Lagerfeuer: was jede Figur dazugewinnt */
  function aufstiegHtml(v) {
    const a = v.aufstieg; if (!a) return "";
    const pl = (p) => p ? `${p[0]}${p[1] ? " + " + p[1] + " starke" : ""}` : "";
    return `<section class="aufstieg"><h2>Stufe ${a.auf}</h2><div class="aufstieg-liste">${Object.entries(a.helden).map(([fid, h]) => `<div class="aufstieg-held">${B.marke(fid, 40)}<div>
      <b>${esc(F.FIGUREN[fid].name)}</b><span class="auf-werte">❤ ${h.tp[0]} → <b>${h.tp[1]}</b> Trefferpunkte${h.plaetze ? ` · Zauberplätze ${pl(h.plaetze[0])} → <b>${pl(h.plaetze[1])}</b>` : ""}</span>
      ${h.neu.length ? `<ul>${h.neu.map((n) => `<li><b>Neu: ${esc(n.name)}</b> – ${esc(n.text)}</li>`).join("")}</ul>` : `<p class="note">Keine neue Fähigkeit, aber manche werden stärker.</p>`}</div></div>`).join("")}</div></section>`;
  }
  /** Gegnervorschau vor dem Kampf: sichtbare Werte grob, Schwächen nur, wenn eine passende Klasse sie erkennt */
  function vorschauHtml(v) {
    const vs = v.vorschau; if (!vs || !vs.arten.length) return "";
    const leben = (tp) => (tp < 12 ? "schwach" : tp < 25 ? "kräftig" : tp < 50 ? "zäh" : "gewaltig");
    const panzer = (rk) => (rk <= 10 ? "kaum gepanzert" : rk <= 13 ? "leicht gepanzert" : rk <= 15 ? "gepanzert" : "schwer gepanzert");
    const hinweise = [vs.ueberraschung && "Ihr habt den Vorteil der Überraschung: Die Gegner setzen die erste Runde aus.", vs.anfuehrer && "Einer von ihnen wirkt zäher als die anderen.", vs.siegel && "Vier Siegelsteine stehen im Raum. Wer neben einem steht, kann ihn berühren."].filter(Boolean);
    return `<section class="vorschau" aria-label="Gegner"><h3>Was euch erwartet</h3>
      <div class="vorschau-liste">${vs.arten.map((a) => `<article class="vs-gegner${a.boss ? " boss" : ""}">
        <header><b>${esc(a.name)}</b>${a.anzahl > 1 ? `<span class="vs-anzahl">×${a.anzahl}</span>` : ""}${a.boss ? `<span class="vs-boss">Endgegner</span>` : ""}</header>
        <div class="vs-werte"><span title="Trefferpunkte">❤ ${leben(a.tp)}</span><span title="Rüstung">⛨ ${panzer(a.rk)}</span><span title="Bewegung">➜ ${a.bewegung ? a.bewegung + " Felder" : "steht still"}</span>${a.angriff ? `<span title="Angriff">⚔ ${esc(a.angriff.name)} ${esc(a.angriff.schaden)}${a.angriff.reichweite > 1 ? ` · ${a.angriff.reichweite} Felder` : ""}</span>` : ""}</div>
        ${a.zeichen.length ? `<div class="vs-zeichen">${a.zeichen.map((z) => `<span>${esc(z)}</span>`).join("")}</div>` : ""}
        ${a.wissen ? `<p class="vs-wissen">${B.marke(a.wissen.wer, 24)}<span><b>${esc(a.wissen.name)} erkennt:</b> ${esc(a.wissen.text)}</span></p>`
          : a.verdeckt ? `<p class="vs-verdeckt">Schwäche unbekannt. ${esc(a.kenner.join(" oder "))} wüsste mehr.</p>` : ""}
      </article>`).join("")}</div>
      ${hinweise.map((h) => `<p class="vs-hinweis">${esc(h)}</p>`).join("")}</section>`;
  }
  function interaktion(v, s) {
    if (v.beute) return beuteHtml(v);
    if (A.zwischenprobe || (s.art === "probe")) return probeHtml(v);
    if (s.art === "raetsel") return raetselHtml(v);
    if (s.art === "lager" && v.ersatz) return ersatzHtml(v) + `<div class="knoepfe"><button class="btn ghost" id="sz-weiter">Ohne Ersatz weiter</button></div>`;
    if (s.art === "lager" && v.aufstieg) return aufstiegHtml(v) + interaktion(Object.assign({}, v, { aufstieg: null }), s);
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
      const pf = (fid) => (q.proFigur && q.proFigur[fid]) || q, gleich = S.lebende(A).every((fid) => pf(fid).frage === q.frage);
      if (!live()) return `${gleich ? `<p><b>${esc(q.frage)}</b></p>` : ""}${S.lebende(A).map((fid) => `${gleich ? "" : `<p class="geheim-frage"><b>${esc(F.FIGUREN[fid].name)}:</b> ${esc(pf(fid).frage)}</p>`}<div class="opt-zeile">${B.marke(fid, 28)} <span>${esc(F.FIGUREN[fid].name)}</span>${pf(fid).antworten.map((a) => `<button class="btn ${A.geheim[fid] === a.id ? "" : "ghost"} klein" data-geheim="${fid}:${a.id}">${esc(a.text)}</button>`).join("")}</div>`).join("")}<div class="knoepfe"><button class="btn" id="sz-weiter" ${S.alleGeheim(A) ? "" : "disabled"}>Weiter</button></div>`;
      return `<p><b>${esc(gleich ? q.frage : "Jede Person hört etwas anderes.")}</b></p><p class="note">Jede Person entscheidet auf ihrem Handy: <b>${q.fertig.length} von ${S.lebende(A).length}</b>. Niemand sieht, wie die anderen entschieden haben.</p>`;
    }
    if (s.art === "kampf") return `${vorschauHtml(v)}<div class="knoepfe"><button class="btn" id="sz-kampf">Zum Kampf</button></div>`;
    if (s.art === "ende") return `<p class="note">Dieses Ende steht jetzt in eurer Chronik${A.merker.splitter ? ", zusammen mit dem Splitter von Grauwacht" : ""}. Ihr findet sie auf der Startseite.</p><div class="knoepfe"><button class="btn" id="sz-schluss">Zurück zum Start</button></div>`;
    return "";
  }
  function binde(el, v, s) {
    const nach = () => { merken(); render(); AB.veroeffentlichen(); };
    el.querySelectorAll("[data-opt]").forEach((b) => { b.onclick = () => { S.waehle(A, b.dataset.opt); nachSzene(); }; });
    el.querySelectorAll("[data-held]").forEach((sp) => {
      const auf = (e) => { if (e.target.closest("[data-wiederbeleben]")) return; heldZeigen(sp.dataset.held); };
      sp.onclick = auf; sp.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auf(e); } };
    });
    el.querySelectorAll("[data-wiederbeleben]").forEach((b) => { b.onclick = () => { const fid = b.dataset.wiederbeleben; if (!confirm(`Die Reliquie der Brüder für ${F.FIGUREN[fid].name} nutzen? Sie ist danach verbraucht.`)) return; const r = S.wiederbeleben(A, fid); if (r.fehler) AB.toast(r.fehler); nach(); }; });
    el.querySelectorAll("[data-beute-ding]").forEach((b) => { b.onclick = () => { A.beuteWahl = b.dataset.beuteDing; render(); }; b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.click(); } }; });
    el.querySelectorAll("[data-beute]").forEach((b) => { b.onclick = () => { const [ding, fid] = b.dataset.beute.split(":"); const r = S.beuteGeben(A, ding, fid); if (r.fehler) AB.toast(r.fehler); else A.beuteWahl = null; nach(); }; });
    const bl = $("#beute-lassen"); if (bl) bl.onclick = () => { if (confirm("Wirklich nichts mitnehmen?")) { S.beuteLassen(A); A.beuteWahl = null; nach(); } };
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
    const pz = $("#sz-pause"); if (pz) pz.onclick = pause;
    const kp = $("#sz-kpause"); if (kp) kp.onclick = () => window.KAMPAGNE.pausieren();
    const e = $("#sz-schluss"); if (e) e.onclick = () => { try { localStorage.removeItem(KEY); localStorage.removeItem("ab_solo"); } catch (x) { /* privat */ } A = null; AB.zeigeSetup(); };
  }
  function nachSzene() { merken(); render(); AB.veroeffentlichen(); }

  /* ---------- Kampf ---------- */
  function kampf() {
    const opts = S.kampfOptionen(A);
    AB.kampfStarten(opts, kampfFertig);
  }
  /** Nach dem Kampf (auch nach dem Neuladen mitten im Kampf) */
  function kampfFertig(st) {
    const e = S.kampfEnde(A, st);
    merken();
    if (e.ergebnis === "rueckzug") AB.toast("Rückzug zum Lagerfeuer. Die Glocke schlägt.");
    zeige();
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
  function fortsetzenKnopf() {
    let da = false; try { da = Boolean(localStorage.getItem(KEY)); } catch (e) { /* privat */ }
    const k = document.querySelector("#intro .knoepfe"); if (!da || !k || document.querySelector("#fortsetzen")) return;
    const b = document.createElement("button"); b.className = "menue primaer"; b.id = "fortsetzen"; b.innerHTML = '<span class="m-sym" aria-hidden="true">▶</span>Abenteuer fortsetzen'; b.onclick = fortsetzen; k.prepend(b);
    const n = document.querySelector("#titel-start"); if (n) { n.classList.remove("primaer"); n.innerHTML = '<span class="m-sym" aria-hidden="true">✚</span>Neues Abenteuer'; }
  }
  fortsetzenKnopf(); chronikKnopf();
  /** Pause: zurück zum Titel, der Spielstand bleibt erhalten */
  function pause() { merken(); fortsetzenKnopf(); AB.zeigeSektion("intro"); if (window.KAMPAGNE) window.KAMPAGNE.pausieren({ allein: true }); }

  window.ABT = { vorlesen: (an) => { vorlesenAn = an; if (!an) verstummen(); }, hilfe: (v) => { hilfeAn = v; if (A) render(); }, start, fortsetzen, kampfFertig, gespeichert: () => { try { return Boolean(localStorage.getItem(KEY)); } catch (e) { return false; } }, zeige, render, wunsch, oeffentlich, laeuft: () => Boolean(A), A: () => A,
    speichern: () => (A ? S.speichern(A) : null), laden: (o) => { A = S.laden(o); },
    /** Stand aus einer Kampagne übernehmen und im Browser merken */
    uebernehmen: (o) => { A = S.laden(o); merken(); },
    /** Abenteuer auf diesem Gerät vergessen */
    verwerfen: () => { A = null; verstummen(); try { localStorage.removeItem(KEY); } catch (e) { /* privat */ } },
    /** Kurzinfo für die Kampagnen-Bibliothek */
    info: () => { if (!A) return null; const s = S.szene(A); return { titel: s.titel, szene: A.szene, art: s.art, abschnitt: s.abschnitt || A.abschnitt || 1, stufe: A.stufe, schwierigkeit: A.schwierigkeit, glocke: A.glocke, gruppe: A.gruppe.slice() }; } };
})();
