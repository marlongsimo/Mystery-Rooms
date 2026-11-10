/*
 * Case Unlocked · Abenteuer – Charakterbogen auf dem Handy
 * Liest nur den öffentlichen Stand „spiel“, den der Spieltisch schreibt (und nur, wenn der Host ihn
 * geschrieben hat). Schreibt nur eigene Einträge: „wahl:<ich>“ und „zug:<ich>“. Gewürfelt und
 * geprüft wird ausschließlich am Tisch.
 */
(function () {
  "use strict";
  const R = window.ABR, F = window.ABF, B = window.ABB, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const params = new URLSearchParams(location.search);
  const SLUG = params.get("liveslug") || "abenteuer";
  const NAME_KEY = "ab_name", FIGUR_KEY = "ab_meine_figur";
  const ATTR = { STR: "Stärke", GES: "Geschicklichkeit", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const SELBST = new Set(["selbstheilung", "trank", "raserei", "finte", "gift", "verstecken", "rueckzug", "spurt", "schattenschritt", "spiegelbilder", "segen", "schutzkreis", "vertreiben", "bewahren", "massenheil", "rauch", "tatendrang"]);
  const H = { client: null, row: null, spiel: null, tab: "zug", sel: null, ziel: null, warte: null, fehler: "", busy: false, warDran: false, ergebnis: null, wahlOffen: null, nLog: 0 };
  const ich = () => H.client && H.client.user && H.client.user.id;
  const meineFid = () => { const s = H.spiel; if (!s || !s.besitz) return null; return Object.keys(s.besitz).find((f) => s.besitz[f] === ich()) || null; };
  const figDaten = (fid) => (H.spiel && H.spiel.figuren ? H.spiel.figuren.find((f) => f.fid === fid && f.art !== "wolf") : null);
  const figId = (id) => (H.spiel && H.spiel.figuren ? H.spiel.figuren.find((f) => f.id === id) : null);
  const vorz = (n) => (n >= 0 ? "+" + n : String(n));

  function toast(text) {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("an"); clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("an"), 4000);
  }

  /* ---------- Verbindung ---------- */
  function client() {
    if (H.client) return H.client;
    if (!window.MRMultiplayer) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar.");
    const c = H.client = window.MRMultiplayer.connect({ gameSlug: SLUG, maxPlayers: 7, storeKey: "ab_handy:" + SLUG });
    c.on("state", (row) => { if (row.state_key === "spiel") { H.row = row; pruefe(); } });
    c.on("players", pruefe);
    c.on("lost", (why) => { H.spiel = null; H.row = null; toast(why || "Verbindung beendet."); render(); });
    return c;
  }
  /** Stand nur übernehmen, wenn ihn der Spieltisch (Host) geschrieben hat */
  function pruefe() {
    const c = H.client; if (!c || !c.session || !H.row) { render(); return; }
    const host = c.players.find((p) => p.is_host);
    if (!host || H.row.updated_by !== host.user_id) { render(); return; }
    const alt = H.spiel; H.spiel = H.row.state || null;
    const s = H.spiel || {};
    const an = (s.antworten && s.antworten[ich()]) || s.antwort;
    if (H.warte && an && an.uid === ich() && an.n === H.warte.n) {
      if (an.ok) { H.fehler = ""; H.sel = null; H.ziel = null; } else H.fehler = an.fehler || "Das ging nicht.";
      H.warte = null;
    }
    const fid = meineFid(), fd = fid && figDaten(fid);
    if (fid) { try { localStorage.setItem(FIGUR_KEY, fid); } catch (e) { /* privat */ } }
    if (fd && s.log && s.nLog > H.nLog) {
      const neu = s.log.slice(Math.max(0, s.log.length - (s.nLog - H.nLog)));
      const mein = neu.filter((l) => l.t.indexOf(fd.name + ":") === 0).pop();
      if (mein) H.ergebnis = mein;
    }
    if (s.nLog) H.nLog = s.nLog;
    if (s.phase !== "kampf" || (alt && alt.phase !== "kampf")) H.ergebnis = null;
    const dran = Boolean((fd && s.phase === "kampf" && !s.ende && s.aktiv === fd.id && fd.tp > 0) || (fid && szeneWartet(s, fid)));
    if (dran && !H.warDran) { try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { /* egal */ } H.tab = "zug"; }
    if (!dran) { H.sel = null; H.ziel = null; }
    H.warDran = dran;
    if (H.wahlOffen && s.besitz && s.besitz[H.wahlOffen]) H.wahlOffen = null;
    if (fid) H.fokus = null;
    render();
  }

  async function beitreten(code, name) {
    H.busy = true; H.fehler = ""; render();
    try {
      try { localStorage.setItem(NAME_KEY, name); } catch (e) { /* privat */ }
      await client().join(code, name);
      wach();
    } catch (e) {
      H.fehler = /nicht verfügbar|game_catalog|unbekannt/i.test(e.message || "") ? "Das Spielen mit Handys ist noch nicht freigeschaltet." : (e.message || String(e));
    }
    H.busy = false; render();
  }
  async function senden(wunsch) {
    if (H.warte) return;
    const n = Date.now();
    H.warte = { n, t: n }; H.fehler = ""; render();
    try { await H.client.writeOwn("zug:" + ich(), Object.assign({ n }, wunsch)); }
    catch (e) { H.warte = null; H.fehler = e.message || String(e); render(); return; }
    setTimeout(() => { if (H.warte && H.warte.n === n) { H.warte = null; H.fehler = "Der Tisch hat nicht geantwortet. Bitte noch einmal versuchen."; render(); } }, 9000);
  }
  async function waehle(fid) {
    H.wahlOffen = fid || null; render();
    try { await H.client.writeOwn("wahl:" + ich(), { fid: fid || null, at: Date.now() }); }
    catch (e) { H.wahlOffen = null; H.fehler = e.message; render(); }
    setTimeout(() => { if (H.wahlOffen === fid) { H.wahlOffen = null; render(); } }, 8000);
  }

  let sperre = null;
  async function wach() { try { if (navigator.wakeLock && !document.hidden && (!sperre || sperre.released)) sperre = await navigator.wakeLock.request("screen"); } catch (e) { /* nicht unterstützt */ } }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && H.client && H.client.session) wach(); });

  /* ---------- Ansichten ---------- */
  function render() {
    const app = $("#app"), c = H.client, drin = Boolean(c && c.session);
    $("#verlassen").hidden = !drin;
    if (!drin) return viewBeitritt(app);
    if (!H.spiel) { app.innerHTML = `<section class="karte-h"><p class="eyebrow">Verbunden · ${esc(c.session.room_code)}</p><h1>Einen Moment …</h1><p class="note">Der Spieltisch schickt gleich die Figuren.</p></section>`; return; }
    const fid = meineFid();
    if (!fid) return viewWahl(app);
    viewBogen(app, fid);
  }

  function viewBeitritt(app) {
    const code = decodeURIComponent(location.hash.slice(1) || "");
    let name = ""; try { name = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* privat */ }
    const a = document.activeElement; if (a && a.tagName === "INPUT" && app.contains(a)) { const fb = $("#fb"); if (fb) fb.textContent = H.fehler; return; }
    app.innerHTML = `<section class="karte-h"><p class="eyebrow">Die Splitterlande</p><h1>Zum Spieltisch</h1>
      <p class="note">Den Code zeigt der Spieltisch (das Tablet in der Mitte).</p>
      <label class="fld">Code<input id="code" autocomplete="off" autocapitalize="characters" placeholder="ABEN-XXXXXX" value="${esc(code)}"></label>
      <label class="fld">Dein Name<input id="name" maxlength="24" autocomplete="off" value="${esc(name)}"></label>
      <button class="btn breit" id="rein" ${H.busy ? "disabled" : ""}>${H.busy ? "Verbinde …" : "Beitreten"}</button>
      <p class="fb" id="fb">${esc(H.fehler)}</p></section>`;
    $("#rein").onclick = () => {
      const cd = $("#code").value.trim(), nm = $("#name").value.trim();
      if (!cd || !nm) { H.fehler = "Bitte Code und Namen eingeben."; $("#fb").textContent = H.fehler; return; }
      document.activeElement && document.activeElement.blur();
      beitreten(cd, nm);
    };
  }

  function viewWahl(app) {
    const s = H.spiel, gruppe = s.gruppe || [], laeuft = s.phase === "kampf" || s.phase === "szene", HL = window.ABH_HELDEN;
    let zuletzt = null; try { zuletzt = localStorage.getItem(FIGUR_KEY); } catch (e) { /* privat */ }
    const liste = laeuft ? gruppe : F.REIHE;
    const voll = !laeuft && Object.keys(s.besitz || {}).length >= 6;
    const status = (fid) => { const uid = s.besitz && s.besitz[fid]; return H.wahlOffen === fid ? "…" : uid ? "📱 " + ((s.namen || {})[uid] || "vergeben") : laeuft ? "wartet auf jemanden" : voll ? "Gruppe voll" : zuletzt === fid ? "zuletzt gespielt" : ""; };
    const kopf = `<p class="eyebrow">Verbunden · ${esc(H.client.session.room_code)}${s.schwierigkeit === "hardcore" ? " · Hardcore" : ""}</p>`;
    if (H.fokus && liste.includes(H.fokus)) {
      const fid = H.fokus, uid = s.besitz && s.besitz[fid], frei = !uid && !voll && !H.wahlOffen;
      const knopf = `<button class="btn gross held-knopf" id="f-spielen" ${frei ? "" : "disabled"}>${H.wahlOffen === fid ? "…" : uid ? "Schon vergeben" : voll ? "Die Gruppe ist voll" : `Ich spiele ${esc(F.FIGUREN[fid].name)}`}</button>`;
      app.innerHTML = `<section class="karte-h">${kopf}<button class="btn ghost klein held-zurueck" id="f-zurueck">← Alle Helden</button>${HL.detail(fid, (s.abenteuer && s.abenteuer.stufe) || s.stufe || 1, knopf)}<p class="fb">${esc(H.fehler)}</p></section>`;
      $("#f-zurueck").onclick = () => { H.fokus = null; render(); };
      $("#f-spielen").onclick = () => waehle(fid);
      return;
    }
    app.innerHTML = `<section class="karte-h">${kopf}<h1>Wähle deinen Helden</h1>
      ${laeuft ? `<p class="note">Das Abenteuer läuft schon. Du kannst eine Figur übernehmen, deren Handy die Runde verlassen hat.</p>` : `<p class="note">Tippe einen Helden an, um ihn kennenzulernen. Jede Person spielt eine Figur, mindestens 3.</p>`}
      ${gruppe.length ? HL.plaetze(gruppe, Object.fromEntries(Object.entries(s.besitz || {}).map(([f, u]) => [f, (s.namen || {})[u] || ""]))) : ""}
      <div class="fkarten handy-karten">${liste.map((fid) => HL.kachel(fid, { an: gruppe.includes(fid), status: status(fid), statusArt: s.besitz && s.besitz[fid] ? "" : "tisch" })).join("")}</div>
      <p class="fb">${esc(H.fehler)}</p></section>`;
    app.querySelectorAll("[data-fid]").forEach((b) => { b.onclick = () => { H.fokus = b.dataset.fid; render(); window.scrollTo(0, 0); }; });
  }

  function balken(tp, max) {
    const a = Math.max(0, tp / max);
    return `<div class="tpbalken"><i style="width:${a * 100}%;background:${a > .5 ? "#6fa86a" : a > .25 ? "#d6a23a" : "#c0503a"}"></i><span>${tp} / ${max} TP</span></div>`;
  }

  function viewBogen(app, fid) {
    const s = H.spiel, d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse], fd = figDaten(fid), ab = s.abenteuer, az = ab && ab.zust && ab.zust[fid];
    const stufe = (fd && fd.stufe) || (ab && ab.stufe) || s.stufe || 1;
    const tpMax = fd ? fd.tpMax : F.tpVon(fid, stufe), tp = fd ? fd.tp : az ? az.tp : tpMax, rk = fd ? fd.rk : d.rk[stufe - 1];
    const plMax = fd && fd.plaetzeMax ? fd.plaetzeMax : k.plaetze ? F.PLAETZE[stufe] : [0, 0], pl = fd && fd.plaetze ? fd.plaetze : az ? az.plaetze : plMax;
    const dran = Boolean(fd && s.phase === "kampf" && !s.ende && s.aktiv === fd.id && fd.tp > 0);
    const meinName = (s.namen || {})[ich()] || "";
    const zust = fd ? fd.zustaende || [] : [];
    const platzText = plMax[0] + plMax[1] ? `<span><b>${"●".repeat(pl[0])}${"○".repeat(Math.max(0, plMax[0] - pl[0]))}${plMax[1] ? " " + "◆".repeat(pl[1]) + "◇".repeat(Math.max(0, plMax[1] - pl[1])) : ""}</b>Zauberplätze</span>` : "";
    let html = `<section class="bogen ${dran ? "ist-dran" : ""}" style="--k:${k.farbe}">
      <div class="kopf"><img class="portraet" src="${F.bild(fid)}" alt=""><div><h1>${esc(d.name)}</h1><p>${esc(d.titel)} · ${esc(k.name)} · Stufe ${stufe}${meinName ? " · " + esc(meinName) : ""}</p><p class="spruch">„${esc(d.spruch)}“</p></div></div>
      ${balken(tp, tpMax)}
      ${fd && fd.tot ? `<div class="info schlecht">${esc(d.name)} ist tot.</div>` : fd && fd.tp <= 0 && s.schwierigkeit === "hardcore" ? `<div class="info schlecht">Todeswürfe: ${"✓".repeat(fd.todes.e)}${"·".repeat(3 - fd.todes.e)} | ${"✗".repeat(fd.todes.f)}${"·".repeat(Math.max(0, 3 - fd.todes.f))}${fd.stabil ? " · stabil" : ""}</div>` : ""}
      <div class="werte-zeile"><span><b>${rk}</b>RK</span>${platzText}<span><b>${dran ? s.zug.bewegung : 6}</b>Felder</span></div>
      ${zust.length ? `<p class="zustaende">${zust.map((z) => `<span>${esc(z)}</span>`).join("")}</p>` : ""}
      <nav class="tabs">${[["zug", s.phase === "szene" ? "Szene" : "Zug"], ["faehig", "Fähigkeiten"], ["rucksack", "Rucksack"]].map(([id, t]) => `<button data-tab="${id}" class="${H.tab === id ? "an" : ""}">${t}${id === "zug" && (dran || szeneWartet(s, fid)) ? " ●" : ""}</button>`).join("")}</nav>
      <div class="tabinhalt">`;
    if (H.tab === "faehig") html += tabFaehig(fid, stufe);
    else if (H.tab === "rucksack") html += tabRucksack(fd ? fd.rucksack : az ? az.rucksack : [{ id: "heiltrank", n: 1 }], fid);
    else if (s.phase === "szene" && ab) html += tabSzene(ab, fid);
    else html += tabZug(s, fid, fd, dran, stufe);
    html += `</div></section>`;
    app.innerHTML = html;
    app.querySelectorAll("[data-tab]").forEach((b) => { b.onclick = () => { H.tab = b.dataset.tab; render(); }; });
    app.querySelectorAll("[data-opt]").forEach((b) => { b.onclick = () => { H.sel = H.sel === b.dataset.opt ? null : b.dataset.opt; H.ziel = null; H.fehler = ""; render(); }; });
    app.querySelectorAll("[data-ziel]").forEach((b) => { b.onclick = () => { H.ziel = b.dataset.ziel; render(); }; });
    const w = $("#wuerfeln"); if (w) w.onclick = () => senden({ typ: "aktion", aktion: H.sel, ziel: H.ziel || (fd && fd.id) });
    const e = $("#zugende"); if (e) e.onclick = () => senden({ typ: "ende" });
    const a = $("#andere"); if (a) a.onclick = () => waehle(null);
    if (ab && ab.ersatz) app.querySelectorAll(".tabinhalt [data-fid]").forEach((b) => { b.onclick = () => senden({ typ: "ersatz", fid: b.dataset.fid }); });
    app.querySelectorAll("[data-stimme]").forEach((b) => { b.onclick = () => { H.meineStimme = { szene: ab.szene, opt: b.dataset.stimme }; senden({ typ: "stimme", opt: b.dataset.stimme }); }; });
    app.querySelectorAll("[data-gantwort]").forEach((b) => { b.onclick = () => { H.meinGeheim = { szene: ab.szene, antwort: b.dataset.gantwort }; senden({ typ: "geheim", antwort: b.dataset.gantwort }); }; });
    const pw = $("#probe-wer"); if (pw) pw.onclick = () => senden({ typ: "probe_wer" });
    const pr = $("#probe-wurf"); if (pr) pr.onclick = () => senden({ typ: "probe_wurf" });
  }

  function aktionInfo(a, d, stufe) {
    const typ = { aktion: "Aktion", bonus: "Bonusaktion", reaktion: "Reaktion", passiv: "passiv", frei: "frei" }[a.typ] || "Aktion";
    const teile = [typ];
    if (a.reichweite) teile.push(a.reichweite === 1 ? "Nahkampf" : `${a.reichweite} Felder`);
    if (a.art === "angriff") teile.push(`Angriff ${vorz(R.mod(d.werte[a.attr]) + 2 + (a.bogen && d === F.FIGUREN.wildnislaeufer && stufe >= 2 ? 1 : 0))}`);
    if (a.rettung && a.attr) teile.push(`${a.rettung}-Rettung SG ${8 + 2 + R.mod(d.werte[a.attr])}`);
    if (a.schaden) teile.push(`${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""}${a.art === "angriff" && !a.ohneMod ? " + " + R.mod(d.werte[a.attr]) : a.plusAttr ? " + " + R.mod(d.werte[a.attr]) : a.plus ? " + " + a.plus : ""}`);
    if (a.heilung) teile.push(`heilt ${a.heilung}`);
    if (a.platz) teile.push(a.platz === 2 ? "Platz vom 2. Grad" : "1 Zauberplatz");
    if (a.pro) { const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange, n = Array.isArray(v) ? v[stufe - 1] : v; teile.push(`${n}× je ${a.pro.kampf != null ? "Kampf" : a.pro.rast != null ? "Rast" : "lange Rast"}`); }
    return teile.join(" · ");
  }

  /** Muss ich in der Szene gerade etwas tun? */
  function szeneWartet(s, fid) {
    const ab = s.abenteuer; if (s.phase !== "szene" || !ab) return false;
    if (ab.art === "wahl") return !(ab.stimmen || []).includes(fid);
    if (ab.art === "geheim") return !(ab.geheimFrage.fertig || []).includes(fid);
    if (ab.ersatz && ab.ersatz.offen.includes(fid)) return true;
    if (ab.raetsel) return true;
    if (ab.probe && !ab.probe.ergebnis) return ab.probe.gruppe ? !ab.probe.wuerfe[fid] : !ab.probe.wer || (ab.probe.wer === fid && !ab.probe.wuerfe[fid]);
    return false;
  }
  function tabSzene(ab, fid) {
    const fett = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
    let h = `<div class="handy-szene"><p class="eyebrow">Abschnitt ${ab.abschnitt} · ${esc(ab.ort)} · Glocke ${ab.glocke}/7</p><h2>${esc(ab.titel)}</h2>`;
    const tot = ab.zust && ab.zust[fid] && ab.zust[fid].tot;
    if (tot && ab.ersatz && ab.ersatz.offen.includes(fid)) return h + `<div class="info dran"><b>${esc(F.FIGUREN[fid].name)} ist gefallen.</b> Am Lagerfeuer stößt jemand Neues zur Gruppe. Wen spielst du jetzt?</div><div class="fkarten handy-karten">${ab.ersatz.frei.map((neu) => window.ABH_HELDEN.kachel(neu, {})).join("")}</div></div>`;
    if (tot) return h + `<div class="info schlecht">${esc(F.FIGUREN[fid].name)} ist gefallen. Am nächsten Lagerfeuer kannst du eine neue Figur übernehmen.</div></div>`;
    if (ab.art === "wahl") {
      const schon = (ab.stimmen || []).includes(fid), meine = H.meineStimme && H.meineStimme.szene === ab.szene ? H.meineStimme.opt : null;
      h += `<div class="info dran"><b>Abstimmung.</b> Die anderen sehen nicht, wofür du stimmst.</div><div class="optionen">${ab.optionen.map((o) => `<button class="opt ${meine === o.id ? "gewaehlt" : ""}" data-stimme="${o.id}" ${H.warte ? "disabled" : ""}><b>${esc(o.text)}</b></button>`).join("")}</div>`;
      if (schon) h += `<p class="note">Deine Stimme ist abgegeben${meine ? ` (${esc((ab.optionen.find((o) => o.id === meine) || {}).text || "")})` : ""}. Du kannst sie noch ändern, bis alle abgestimmt haben.</p>`;
    } else if (ab.art === "geheim") {
      const q = ab.geheimFrage, meins = H.meinGeheim && H.meinGeheim.szene === ab.szene ? H.meinGeheim.antwort : null;
      h += `<div class="info dran"><b>${esc(q.frage)}</b><br><small>Nur du siehst deine Antwort.</small></div><div class="optionen">${q.antworten.map((a) => `<button class="opt ${meins === a.id ? "gewaehlt" : ""}" data-gantwort="${a.id}" ${H.warte ? "disabled" : ""}><b>${esc(a.text)}</b></button>`).join("")}</div>`;
    } else if (ab.raetsel) {
      const meine = (ab.raetsel.hinweise || {})[fid] || [];
      h += `<div class="info dran"><b>Deine Grabplatte.</b> Lies sie den anderen vor. Am Tisch werden die Glocken angeschlagen.</div>${meine.map((t) => `<blockquote class="platte">${fett(t)}</blockquote>`).join("")}<p class="note">Angeschlagen: ${ab.raetsel.folge.length} von ${ab.raetsel.laenge}</p>`;
    } else if (ab.probe) {
      const p = ab.probe, b = p.boni[fid];
      h += `<div class="info"><b>${esc(p.name)}</b> gegen SG ${p.sg}${p.gruppe ? " · alle würfeln" : ""}. Dein Bonus: ${b >= 0 ? "+" : ""}${b}</div>`;
      if (p.ergebnis) h += `<div class="ergebnis ${p.ergebnis.stufe === "erfolg" ? "gut" : ""}"><span>${{ erfolg: "Geschafft", knapp: "Knapp daneben", fehl: "Misslungen" }[p.ergebnis.stufe]}${p.ergebnis.text ? ": " + fett(p.ergebnis.text) : ""}</span></div>`;
      else if (p.wuerfe[fid]) h += `<div class="ergebnis"><b>${p.wuerfe[fid].w}</b><span>Dein Wurf: ${p.wuerfe[fid].gesamt}</span></div>`;
      else if (p.gruppe || p.wer === fid) h += `<button class="btn breit wuerfel" id="probe-wurf" ${H.warte ? "disabled" : ""}>🎲 Würfeln</button>`;
      else if (!p.wer) h += `<button class="btn breit" id="probe-wer" ${H.warte ? "disabled" : ""}>Ich versuche es</button>`;
      else h += `<p class="note">${esc(F.FIGUREN[p.wer] ? F.FIGUREN[p.wer].name : "")} versucht es.</p>`;
    } else h += `<div class="info">Der Tisch liest vor. Hört zu – oder lest mit:</div>`;
    h += `<div class="erzaehlung">${ab.text.map((t) => `<p>${fett(t)}</p>`).join("")}</div>${ab.antwort ? `<div class="antwort">${fett(ab.antwort)}</div>` : ""}`;
    if (H.fehler) h += `<p class="fb">${esc(H.fehler)}</p>`;
    return h + "</div>";
  }

  function tabZug(s, fid, fd, dran, stufe) {
    const d = F.FIGUREN[fid];
    let h = "";
    if (s.phase !== "kampf") h += `<div class="info">Gleich geht's los. Der Tisch stellt die Gruppe zusammen und startet den Kampf.</div><button class="btn ghost breit" id="andere">Andere Figur wählen</button>`;
    else if (s.ende) h += `<div class="info gross">${s.ende === "sieg" ? "Sieg!" : s.ende === "niederlage" ? "Grauwacht behält euch." : "Rückzug. Ihr versucht es noch einmal."}</div>`;
    else if (!fd) h += `<div class="info">Deine Figur ist in diesem Kampf nicht dabei.</div>`;
    else if (fd.tot) h += `<div class="info schlecht">${esc(d.name)} ist gefallen.</div>`;
    else if (fd.tp <= 0) h += `<div class="info schlecht">Du liegst am Boden. ${s.schwierigkeit === "hardcore" ? "Zu Beginn deines Zugs würfelt der Tisch deinen Todeswurf. " : ""}Nur Heilung oder Stabilisieren bringt dich zurück.</div>`;
    else if (!dran) {
      const a = figId(s.aktiv), b = a && a.fid && s.besitz && s.besitz[a.fid];
      h += `<div class="info">Am Zug: <b>${esc(a ? a.name : "…")}</b>${b && b !== ich() ? ` (📱 ${esc((s.namen || {})[b] || "")})` : a && a.seite === "spieler" ? " (am Tisch)" : ""}</div>`;
    } else {
      h += `<div class="info dran"><b>Du bist dran!</b> Bewegen: Tippe am Tisch dein Zielfeld an (noch ${s.zug.bewegung} Felder${s.zug.schritt ? ", Schattenschritt " + s.zug.schritt : ""}).</div>`;
      h += `<div class="optionen">`;
      for (const o of s.optionen || []) {
        const def = R.findeAktion({ fid, stufe, rucksack: fd.rucksack }, o.id); if (!def) continue;
        const a = def.a, gew = H.sel === o.id;
        const zahl = a.art === "trank" ? ` (${(fd.rucksack.find((x) => x.id === "heiltrank") || { n: 0 }).n})` : o.rest != null && o.rest !== Infinity ? ` · noch ${Math.max(0, o.rest)}` : "";
        h += `<button class="opt ${gew ? "gewaehlt" : ""} ${o.ok ? "" : "aus"}" data-opt="${o.id}" ${o.ok && !H.warte ? "" : "disabled"}><b>${esc(a.name)}<span class="anzahl">${esc(zahl)}</span></b><small>${esc(aktionInfo(a, d, stufe))}</small>${o.ok ? "" : `<i>${esc(o.grund || "")}</i>`}</button>`;
        if (gew) {
          const selbst = SELBST.has(a.art);
          if (a.text) h += `<p class="opt-text">${esc(a.text)}</p>`;
          if (!selbst) h += `<div class="ziele">${o.ziele.map((z) => `<button class="ziel ${z.seite === "spieler" ? "freund" : ""} ${H.ziel === z.id ? "gewaehlt" : ""}" data-ziel="${z.id}">${esc(z.name)}${z.seite === "spieler" ? ` <small>${z.tp}/${z.tpMax} TP</small>` : ""}</button>`).join("")}</div>`;
          const bereit = selbst || H.ziel;
          h += `<button class="btn breit wuerfel" id="wuerfeln" ${bereit && !H.warte ? "" : "disabled"}>${H.warte ? "Der Tisch würfelt …" : bereit ? (a.schaden || a.rettung || a.art === "angriff" ? "🎲 Würfeln" : "Ausführen") : "Ziel wählen"}</button>`;
        }
      }
      h += `</div><button class="btn ghost breit" id="zugende" ${H.warte ? "disabled" : ""}>Zug beenden</button>`;
    }
    if (H.fehler) h += `<p class="fb">${esc(H.fehler)}</p>`;
    if (H.ergebnis && s.phase === "kampf") h += `<div class="ergebnis ${H.ergebnis.art || ""}">${H.ergebnis.wurf ? `<b class="${H.ergebnis.wurf === 20 ? "krit" : H.ergebnis.wurf === 1 ? "patzer" : ""}">${H.ergebnis.wurf}</b>` : ""}<span>${esc(H.ergebnis.t)}</span></div>`;
    if (s.phase === "kampf" && s.log && s.log.length) h += `<h3 class="klein">Zuletzt am Tisch · Runde ${s.runde}</h3><ol class="log kurz">${s.log.slice(-5).reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("")}</ol>`;
    return h;
  }

  function tabFaehig(fid, stufe) {
    const d = F.FIGUREN[fid];
    const werte = Object.keys(ATTR).map((k) => `<span><b>${vorz(R.mod(d.werte[k]))}</b><small>${ATTR[k]} ${d.werte[k]}</small></span>`).join("");
    const alle = F.faehigVon(fid, 3);
    const li = (a) => `<li class="${a.ab > stufe ? "gesperrt" : ""}"><b>${esc(a.name)}${a.ab > stufe ? ` <span class="anzahl">ab Stufe ${a.ab}</span>` : ""}</b><small>${esc(aktionInfo(a, d, stufe))}</small><p>${esc(a.text || "")}</p></li>`;
    return `<div class="attr">${werte}</div>
      <p class="note">${esc(d.rolle)} · ${esc(d.ruestung)} · TP ${F.tpVon(fid, 1)} / ${F.tpVon(fid, 2)} / ${F.tpVon(fid, 3)}</p>
      <h3 class="klein">Im Kampf</h3><ul class="faehig">${alle.filter((a) => a.typ !== "passiv").map(li).join("")}</ul>
      <h3 class="klein">Immer aktiv</h3><ul class="faehig">${alle.filter((a) => a.typ === "passiv").map(li).join("")}</ul>
      <h3 class="klein">Außerhalb des Kampfes</h3><ul class="faehig"><li><b>${esc(d.aussen.name)}</b><p>${esc(d.aussen.text)}</p></li><li><b>Bewegung</b><small>6 Felder pro Zug</small><p>Schräg zählt wie gerade. Wer neben einem Gegner losläuft, riskiert einen Gelegenheitsangriff.</p></li></ul>`;
  }

  function tabRucksack(dinge, fid) {
    const d = F.FIGUREN[fid];
    const extra = { krieger: ["Seil, 15 m", "Fackel"], zauberer: ["Zauberbuch", "Kreide"], schurke: ["Dietriche", "Dunkler Umhang"], kleriker: ["Heiliges Symbol", "Verband"], waldlaeufer: ["Köcher", "Jagdmesser"] }[d.klasse] || [];
    return `<ul class="faehig">${dinge.map((x) => { const t = R.DINGE[x.id] || { name: x.id, text: "" }; return `<li class="${x.n ? "" : "leer"}"><b>${esc(t.name)} <span class="anzahl">×${x.n}</span></b><p>${esc(t.text)}</p>${x.id === "heiltrank" && x.n ? `<small>Trinken: im Reiter „Zug“, wenn du dran bist.</small>` : ""}</li>`; }).join("")}
      ${extra.map((e) => `<li><b>${esc(e)}</b></li>`).join("")}<li><b>${esc(d.ruestung)}</b><small>RK ${d.rk.join(" / ")}</small></li></ul>`;
  }

  $("#verlassen").onclick = async () => {
    if (!confirm("Den Spieltisch verlassen? Deine Figur steuert dann der Tisch.")) return;
    try { await H.client.leave(); } catch (e) { /* schon zu */ }
    H.spiel = null; H.row = null; render();
  };

  (async () => {
    render();
    try {
      let gespeichert = null; try { gespeichert = localStorage.getItem("ab_handy:" + SLUG); } catch (e) { /* privat */ }
      if (!gespeichert || !window.MRMultiplayer) return;
      const s = await client().restore();
      if (s && !s.closed) { await H.client.fetchStates().catch(() => {}); wach(); }
      render();
    } catch (e) { render(); }
  })();

  window.ABH = { H, render };
})();
