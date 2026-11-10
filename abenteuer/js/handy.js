/*
 * Case Unlocked · Abenteuer – Charakterbogen auf dem Handy
 * Liest nur den öffentlichen Stand „spiel“, den der Spieltisch schreibt (und nur, wenn der Host ihn
 * geschrieben hat). Schreibt nur eigene Einträge: „wahl:<ich>“ und „zug:<ich>“. Gewürfelt und
 * geprüft wird ausschließlich am Tisch.
 */
(function () {
  "use strict";
  const R = window.ABR, B = window.ABB, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const params = new URLSearchParams(location.search);
  const SLUG = params.get("liveslug") || "abenteuer";
  const NAME_KEY = "ab_name";
  const ATTR = { STR: "Stärke", GES: "Geschicklichkeit", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const H = { client: null, row: null, spiel: null, tab: "zug", sel: null, ziel: null, warte: null, fehler: "", busy: false, warDran: false, ergebnis: null, wahlOffen: null, nLog: 0 };
  const ich = () => H.client && H.client.user && H.client.user.id;
  const meineFig = () => { const s = H.spiel; if (!s || !s.besitz) return null; return Object.keys(s.besitz).find((f) => s.besitz[f] === ich()) || null; };
  const figDaten = (id) => (H.spiel && H.spiel.figuren ? H.spiel.figuren.find((f) => f.id === id) : null);
  const klasseVon = (id) => { const l = H.spiel && H.spiel.liste ? H.spiel.liste.find((f) => f.id === id) : null; return l ? l.klasse : null; };
  const vorz = (n) => (n >= 0 ? "+" + n : String(n));

  function toast(text) {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("an"); clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("an"), 4000);
  }

  /* ---------- Verbindung ---------- */
  function client() {
    if (H.client) return H.client;
    if (!window.MRMultiplayer) throw new Error("Die Live-Verbindung ist gerade nicht verfügbar.");
    const c = H.client = window.MRMultiplayer.connect({ gameSlug: SLUG, maxPlayers: 4, storeKey: "ab_handy:" + SLUG });
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
    // Antwort auf meinen letzten Wunsch
    if (H.warte && s.antwort && s.antwort.uid === ich() && s.antwort.n === H.warte.n) {
      if (s.antwort.ok) { H.fehler = ""; H.sel = null; H.ziel = null; } else H.fehler = s.antwort.fehler || "Das ging nicht.";
      H.warte = null;
    }
    // Ergebnis meiner Figur aus den neuen Einträgen
    const f = meineFig(), fd = f && figDaten(f);
    if (fd && s.log && s.nLog > H.nLog) {
      const neu = s.log.slice(Math.max(0, s.log.length - (s.nLog - H.nLog)));
      const mein = neu.filter((l) => l.t.indexOf(fd.name + ":") === 0).pop();
      if (mein) H.ergebnis = mein;
    }
    if (s.nLog) H.nLog = s.nLog;
    if (s.phase !== "kampf" || (alt && alt.runde > (s.runde || 0))) H.ergebnis = null;
    // Ich bin dran → kurz vibrieren
    const dran = Boolean(f && s.phase === "kampf" && !s.ende && s.aktiv === f);
    if (dran && !H.warDran) { try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { /* egal */ } H.tab = "zug"; }
    if (!dran) { H.sel = null; H.ziel = null; }
    H.warDran = dran;
    if (H.wahlOffen && s.besitz && (s.besitz[H.wahlOffen] === ich() || s.besitz[H.wahlOffen])) H.wahlOffen = null;
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
  async function waehle(fig) {
    H.wahlOffen = fig || null; render();
    try { await H.client.writeOwn("wahl:" + ich(), { fig: fig || null, at: Date.now() }); }
    catch (e) { H.wahlOffen = null; H.fehler = e.message; render(); }
    setTimeout(() => { if (H.wahlOffen === fig) { H.wahlOffen = null; render(); } }, 8000);
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
    const f = meineFig();
    if (!f) return viewWahl(app);
    viewBogen(app, f);
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
    const s = H.spiel, liste = s.liste || [];
    app.innerHTML = `<section class="karte-h"><p class="eyebrow">Verbunden · ${esc(H.client.session.room_code)}</p><h1>Wähle deine Figur</h1>
      <ul class="figwahl handywahl">${liste.map((l) => {
        const c = R.KLASSEN[l.klasse], uid = s.besitz && s.besitz[l.id], frei = !uid;
        return `<li><button class="wahl" data-fig="${l.id}" ${frei && !H.wahlOffen ? "" : "disabled"}>${B.marke(l.klasse, 44)}<span><b>${esc(c.name)}</b><small>${esc(c.klasse)} · TP ${c.tp} · RK ${c.rk}</small></span><em>${H.wahlOffen === l.id ? "…" : frei ? "frei" : "📱 " + esc((s.namen || {})[uid] || "vergeben")}</em></button></li>`;
      }).join("")}</ul>
      <p class="note">Figuren, die niemand wählt, steuert ihr am Tisch.</p><p class="fb">${esc(H.fehler)}</p></section>`;
    app.querySelectorAll("[data-fig]").forEach((b) => { b.onclick = () => waehle(b.dataset.fig); });
  }

  function balken(tp, max) {
    const a = Math.max(0, tp / max);
    return `<div class="tpbalken"><i style="width:${a * 100}%;background:${a > .5 ? "#6fa86a" : a > .25 ? "#d6a23a" : "#c0503a"}"></i><span>${tp} / ${max} TP</span></div>`;
  }

  function viewBogen(app, fid) {
    const s = H.spiel, klasse = klasseVon(fid), c = R.KLASSEN[klasse], fd = figDaten(fid);
    const tp = fd ? fd.tp : c.tp, max = fd ? fd.tpMax : c.tp, rk = fd ? fd.rk : c.rk, plaetze = fd ? fd.plaetze : c.plaetze || 0;
    const dran = s.phase === "kampf" && !s.ende && s.aktiv === fid;
    const meinName = (s.namen || {})[ich()] || "";
    let html = `<section class="bogen ${dran ? "ist-dran" : ""}">
      <div class="kopf">${B.marke(klasse, 52)}<div><h1>${esc(c.name)}</h1><p>${esc(c.klasse)} · Stufe 1${meinName ? " · " + esc(meinName) : ""}</p></div></div>
      ${balken(tp, max)}
      <div class="werte-zeile"><span><b>${rk}</b>RK</span>${c.plaetze ? `<span><b>${"●".repeat(plaetze)}${"○".repeat(Math.max(0, c.plaetze - plaetze))}</b>Zauberplätze</span>` : ""}<span><b>${dran ? s.zug.bewegung : 6}</b>Felder Bewegung</span></div>
      <nav class="tabs">${[["zug", "Zug"], ["faehig", "Fähigkeiten"], ["rucksack", "Rucksack"]].map(([id, t]) => `<button data-tab="${id}" class="${H.tab === id ? "an" : ""}">${t}${id === "zug" && dran ? " ●" : ""}</button>`).join("")}</nav>
      <div class="tabinhalt">`;
    if (H.tab === "faehig") html += tabFaehig(c);
    else if (H.tab === "rucksack") html += tabRucksack(fd ? fd.rucksack : (c.rucksack || []).map(([id, n]) => ({ id, n })));
    else html += tabZug(s, fid, fd, dran, c);
    html += `</div></section>`;
    app.innerHTML = html;
    app.querySelectorAll("[data-tab]").forEach((b) => { b.onclick = () => { H.tab = b.dataset.tab; render(); }; });
    app.querySelectorAll("[data-opt]").forEach((b) => { b.onclick = () => { H.sel = H.sel === b.dataset.opt ? null : b.dataset.opt; H.ziel = null; H.fehler = ""; render(); }; });
    app.querySelectorAll("[data-ziel]").forEach((b) => { b.onclick = () => { H.ziel = b.dataset.ziel; render(); }; });
    const w = $("#wuerfeln"); if (w) w.onclick = () => senden({ typ: "aktion", aktion: H.sel, ziel: H.ziel || fid });
    const e = $("#zugende"); if (e) e.onclick = () => senden({ typ: "ende" });
    const a = $("#andere"); if (a) a.onclick = () => waehle(null);
  }

  function aktionInfo(a, typ, c) {
    const teile = [typ === "bonus" ? "Bonusaktion" : "Aktion"];
    if (a.reichweite) teile.push(a.reichweite === 1 ? "Nahkampf" : `Reichweite ${a.reichweite} Felder`);
    if (a.art === "angriff") teile.push(`Angriff ${vorz(R.mod(c.werte[a.attr]) + 2)}`);
    if (a.art === "rettungswurf") teile.push(`SG ${8 + 2 + R.mod(c.werte[a.attr])}`);
    if (a.schaden) teile.push(`${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""} Schaden`);
    if (a.heilung) teile.push(`heilt ${a.heilung}`);
    if (a.platz) teile.push("1 Zauberplatz");
    if (a.proRast) teile.push("1× pro Kampf");
    return teile.join(" · ");
  }

  function tabZug(s, fid, fd, dran, c) {
    let h = "";
    if (s.phase !== "kampf") h += `<div class="info">Gleich geht's los. Der Tisch startet den Kampf.</div><button class="btn ghost breit" id="andere">Andere Figur wählen</button>`;
    else if (s.ende) h += `<div class="info gross">${s.ende === "sieg" ? "Sieg! Die Rostkäfer sind besiegt." : "Rückzug. Ihr versucht es noch einmal."}</div>`;
    else if (fd && fd.tp <= 0) h += `<div class="info schlecht">Du liegst am Boden. Nur Heilung bringt dich zurück in den Kampf.</div>`;
    else if (!dran) {
      const a = figDaten(s.aktiv), b = s.besitz && s.besitz[s.aktiv];
      h += `<div class="info">Am Zug: <b>${esc(a ? a.name : "…")}</b>${b && b !== ich() ? ` (📱 ${esc((s.namen || {})[b] || "")})` : a && a.seite === "spieler" ? " (am Tisch)" : ""}</div>`;
    } else {
      h += `<div class="info dran"><b>Du bist dran!</b> Bewegen: Tippe am Tisch dein Zielfeld an (noch ${s.zug.bewegung} Felder).</div>`;
      h += `<div class="optionen">`;
      for (const o of s.optionen || []) {
        const def = R.findeAktion({ klasse: fd.klasse, rucksack: fd.rucksack }, o.id); if (!def) continue;
        const a = def.a, gew = H.sel === o.id;
        const zahl = a.art === "trank" ? ` (${R.trankZahl(fd)})` : "";
        h += `<button class="opt ${gew ? "gewaehlt" : ""}" data-opt="${o.id}" ${o.ok && !H.warte ? "" : "disabled"}><b>${esc(a.name)}${zahl}</b><small>${esc(aktionInfo(a, def.typ, c))}</small></button>`;
        if (gew) {
          const selbst = a.art === "selbstheilung" || a.art === "trank";
          if (!selbst) h += `<div class="ziele">${o.ziele.map((z) => `<button class="ziel ${H.ziel === z.id ? "gewaehlt" : ""}" data-ziel="${z.id}">${esc(z.name)}${z.id[0] === "f" ? ` <small>${z.tp}/${z.tpMax} TP</small>` : ""}</button>`).join("")}</div>`;
          const bereit = selbst || H.ziel;
          h += `<button class="btn breit wuerfel" id="wuerfeln" ${bereit && !H.warte ? "" : "disabled"}>${H.warte ? "Der Tisch würfelt …" : bereit ? "🎲 Würfeln" : "Ziel wählen"}</button>`;
        }
      }
      h += `</div><button class="btn ghost breit" id="zugende" ${H.warte ? "disabled" : ""}>Zug beenden</button>`;
    }
    if (H.fehler) h += `<p class="fb">${esc(H.fehler)}</p>`;
    if (H.ergebnis && s.phase === "kampf") h += `<div class="ergebnis ${H.ergebnis.art || ""}">${H.ergebnis.wurf ? `<b class="${H.ergebnis.wurf === 20 ? "krit" : H.ergebnis.wurf === 1 ? "patzer" : ""}">${H.ergebnis.wurf}</b>` : ""}<span>${esc(H.ergebnis.t)}</span></div>`;
    if (s.phase === "kampf" && s.log && s.log.length) h += `<h3 class="klein">Zuletzt am Tisch · Runde ${s.runde}</h3><ol class="log kurz">${s.log.slice(-5).reverse().map((l) => `<li class="${l.art || ""}">${esc(l.t)}</li>`).join("")}</ol>`;
    return h;
  }

  function tabFaehig(c) {
    const werte = Object.keys(ATTR).map((k) => `<span><b>${vorz(R.mod(c.werte[k]))}</b><small>${ATTR[k]} ${c.werte[k]}</small></span>`).join("");
    const liste = c.aktionen.map((a) => [a, "aktion"]).concat(c.bonus.map((a) => [a, "bonus"]));
    return `<div class="attr">${werte}</div><ul class="faehig">${liste.map(([a, typ]) => `<li><b>${esc(a.name)}</b><small>${esc(aktionInfo(a, typ, c))}</small><p>${esc(a.text || "")}</p></li>`).join("")}
      <li><b>Bewegung</b><small>6 Felder pro Zug</small><p>Schräg zählt wie gerade. An Grabsteinen und Mauern kommt niemand vorbei.</p></li></ul>`;
  }

  function tabRucksack(dinge) {
    if (!dinge || !dinge.length) return `<div class="info">Der Rucksack ist leer.</div>`;
    return `<ul class="faehig">${dinge.map((d) => { const x = R.DINGE[d.id] || { name: d.id, text: "" }; return `<li class="${d.n ? "" : "leer"}"><b>${esc(x.name)} <span class="anzahl">×${d.n}</span></b><p>${esc(x.text)}</p>${d.id === "heiltrank" && d.n ? `<small>Trinken: im Reiter „Zug“, wenn du dran bist.</small>` : ""}</li>`; }).join("")}</ul>`;
  }

  $("#verlassen").onclick = async () => {
    if (!confirm("Den Spieltisch verlassen? Deine Figur steuert dann der Tisch.")) return;
    try { await H.client.leave(); } catch (e) { /* schon zu */ }
    H.spiel = null; H.row = null; render();
  };

  // Nach dem Neuladen wieder verbinden
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
