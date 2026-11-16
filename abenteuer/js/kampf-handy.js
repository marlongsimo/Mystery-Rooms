/*
 * Mythara – Kampf am Handy (Prototyp): eigene Bedienung für schmale Bildschirme, wenn auf DIESEM Gerät gespielt wird
 * (Solo-Modus und Arena). Am Spieltisch mit verbundenen Handys bleibt alles, wie es ist.
 *
 * Was sich ändert:
 *   • Kein Scrollen mehr: oben die Karte, unten eine feste Bedienleiste.
 *   • Die Karte ist vergrößert (Felder gut fingerbreit), folgt dem Helden am Zug und lässt sich mit dem Finger verschieben.
 *     Der Knopf „Übersicht“ zeigt die ganze Karte.
 *   • Aktionen als Kacheln statt als lange Liste; ein Tipp wählt, die Erklärung steht direkt über den Kacheln.
 *   • Oben in der Leiste: wer am Zug ist, Lebenspunkte und was in diesem Zug noch geht (Bewegung, Aktion, Bonusaktion).
 *
 * Die Spiellogik bleibt, wo sie ist: Diese Datei zeigt nur anders an und löst die vorhandenen Knöpfe aus (#aktionen, #ende-zug).
 * Ein/Aus: …/abenteuer/?handy=neu  bzw.  ?handy=alt  (gilt, bis der Tab geschlossen wird).
 * Globaler Name: window.ABKH = { an(), bauen() }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const GEWAEHLT = (() => { let a = ""; const p = new URLSearchParams(location.search).get("handy");
    try { if (p === "neu" || p === "alt") sessionStorage.setItem("ab_handy", p); a = sessionStorage.getItem("ab_handy") || ""; } catch (e) { a = p || ""; } return a === "neu"; })();
  const schmal = () => window.matchMedia("(max-width: 700px)").matches;
  const ZOOM = 1.7;
  let zoom = ZOOM, tx = 0, ty = 0, mitteFuer = "", offen = null, zieht = null, gezogen = false, logAuf = false;

  /** Nur wenn hier auf diesem Gerät gespielt wird: schmaler Bildschirm, Kampf sichtbar, kein Spieltisch mit Handys */
  function an() {
    const sp = $("#spiel"), live = $("#livebar");
    return GEWAEHLT && schmal() && sp && !sp.hidden && (!live || live.hidden) && window.AB && window.AB.st;
  }
  const symbol = (a) => !a ? "✧" : a.art === "trank" ? "🧪" : a.art === "selbstheilung" || a.heilung ? "✚" : a.art === "spurt" ? "👟" : a.art === "stoss" ? "🛡" : a.art === "verstecken" ? "🌫" : a.art === "spott" ? "📣"
    : a.art === "flaeche" ? "✹" : a.art === "kontrolle" || a.art === "rettungswurf" ? "✦" : a.art === "angriff" ? ((a.reichweite || 1) > 1 ? (a.wurfwaffe ? "🗡" : "🏹") : "⚔") : "✧";

  /* ---------- Karte: vergrößern, verschieben, dem Helden folgen ---------- */
  function karteMass() { const w = $(".karte-wrap"), k = $("#karte"); return w && k ? { W: w.clientWidth, H: w.clientHeight, w: k.clientWidth, h: k.clientHeight } : null; }
  function setzen(weich) {
    const k = $("#karte"), m = karteMass(); if (!k || !m) return;
    const bw = m.w * zoom, bh = m.h * zoom;
    tx = bw <= m.W ? (m.W - bw) / 2 : Math.min(0, Math.max(m.W - bw, tx));
    ty = bh <= m.H ? (m.H - bh) / 2 : Math.min(0, Math.max(m.H - bh, ty));
    k.style.transition = weich ? "transform .28s ease" : "none"; k.style.transformOrigin = "0 0";
    k.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${zoom})`;
  }
  function mitteAuf(f) {
    const st = window.AB.st, m = karteMass(); if (!m || !f || f.x < 0) return;
    const feld = m.w / st.karte.b, cx = (f.x + .5) * feld * zoom, cy = (f.y + .5) * (m.h / st.karte.h) * zoom;
    tx = m.W / 2 - cx; ty = m.H / 2 - cy; setzen(true);
  }
  function zeiger() {
    const w = $(".karte-wrap"); if (!w || w.dataset.kh) return; w.dataset.kh = "1";
    w.addEventListener("pointerdown", (e) => { if (!document.body.classList.contains("kh-an")) return; zieht = { x: e.clientX, y: e.clientY, tx, ty }; gezogen = false; });
    w.addEventListener("pointermove", (e) => { if (!zieht) return; const dx = e.clientX - zieht.x, dy = e.clientY - zieht.y; if (!gezogen && Math.hypot(dx, dy) < 9) return; gezogen = true; tx = zieht.tx + dx; ty = zieht.ty + dy; setzen(false); });
    const ende = () => { zieht = null; setTimeout(() => { gezogen = false; }, 60); };
    w.addEventListener("pointerup", ende); w.addEventListener("pointercancel", ende);
    // Wer die Karte verschoben hat, wollte kein Feld antippen
    w.addEventListener("click", (e) => { if (gezogen && document.body.classList.contains("kh-an")) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  /* ---------- Bedienleiste ---------- */
  function bauen() {
    const ein = Boolean(an()); document.body.classList.toggle("kh-an", ein);
    let el = $("#kh");
    if (!ein) { if (el) el.remove(); const k = $("#karte"), w = $(".karte-wrap"); if (k && k.style.transform && /scale/.test(k.style.transform)) { k.style.transform = ""; k.style.transition = ""; k.style.transformOrigin = ""; } if (w) w.style.height = ""; return; }
    if (!el) { el = document.createElement("div"); el.id = "kh"; el.className = "kh"; document.body.appendChild(el); }
    zeiger();
    const st = window.AB.st, R = window.AB.R, a = R.aktiv(st), F = window.ABF;
    const orig = [...document.querySelectorAll("#aktionen .akt")], endeKnopf = $("#ende-zug"), meinZug = Boolean(endeKnopf) && !st.ende;
    const kacheln = orig.map((b) => { const id = b.dataset.a, h = R.findeAktion(a, id), d = h ? h.a : null, klein = (b.querySelector("small") || {}).textContent || "";
      return { id, name: (b.querySelector("b") || {}).textContent || id, klein, text: (b.querySelector(".akt-text") || {}).textContent || "", aus: b.disabled, an: b.classList.contains("gewaehlt"), tipp: b.classList.contains("getippt"),
        bonus: /^(Bonusaktion|frei)/.test(klein), sym: symbol(d), wert: d && d.schaden ? d.schaden : d && d.heilung ? "+" + d.heilung : "" }; });
    const gewaehlt = kacheln.find((k) => k.an), info = gewaehlt || kacheln.find((k) => k.id === offen) || null;
    if (offen && !kacheln.some((k) => k.id === offen)) offen = null;
    const hinweis = ($("#hinweis") || {}).textContent || "";
    const kopf = () => { const held = a.fid || a.fidA, bild = held && F.FIGUREN[held] ? `<img src="${F.bild(held)}" alt="">` : `<span class="kh-mon">☠</span>`, p = Math.max(0, Math.round(100 * a.tp / a.tpMax));
      const z = st.zug || {}, pip = (an, t, k) => `<i class="${an ? "an" : ""} ${k}">${t}</i>`;
      return `<div class="kh-kopf"><span class="kh-bild">${bild}</span><div class="kh-wer"><b>${esc(a.name)}</b><span class="kh-tp"><u style="width:${p}%"></u><em>${Math.max(0, a.tp)} / ${a.tpMax}</em></span></div>
        ${meinZug ? `<div class="kh-pips">${pip((z.bewegung || 0) + (z.schritt || 0) > 0, "👣 " + ((z.bewegung || 0) + (z.schritt || 0)), "bew")}${pip(z.aktion, "Aktion", "akt")}${pip(z.bonus, "Bonus", "bon")}</div>` : ""}
        <div class="kh-werkzeug"><button id="kh-zoom" aria-label="${zoom > 1 ? "Ganze Karte zeigen" : "Karte vergrößern"}">${zoom > 1 ? "🗺" : "🔍"}</button><button id="kh-log" aria-label="Chronik">📜</button></div></div>`; };
    const letzte = (st.log || []).slice(-2).map((l) => `<p>${esc(l.t)}</p>`).join("");
    el.classList.toggle("wartet", !meinZug);
    el.innerHTML = kopf() + (meinZug
      ? `<div class="kh-info ${info ? (info.aus ? "aus" : "an") : ""}">${info ? `<b>${esc(info.name)}</b> <small>${esc(info.klein)}</small><span>${esc(info.text)}</span>${gewaehlt ? `<em>Tippe ein leuchtendes Ziel an.</em><button id="kh-ab">Abbrechen</button>` : ""}` : `<span>${esc(hinweis)}</span>`}</div>
         <div class="kh-raster">${kacheln.map((k) => `<button class="kh-k ${k.aus ? "aus" : ""} ${k.an ? "an" : ""} ${k.tipp ? "tipp" : ""} ${k.bonus ? "bonus" : ""}" data-kh="${esc(k.id)}"><i>${k.sym}</i><b>${esc(k.name)}</b>${k.wert ? `<small>${esc(k.wert)}</small>` : ""}</button>`).join("")}</div>
         <div class="kh-fuss"><button class="kh-tipp" id="kh-tipp">💡 Tipp</button><button class="kh-ende" id="kh-ende">Zug beenden ⟳</button></div>`
      : `<div class="kh-warten"><b>${st.ende ? "Der Kampf ist vorbei." : esc(a.name) + " ist am Zug …"}</b>${letzte}</div>`);
    // Auslösen: die vorhandenen Knöpfe des Spiels
    el.querySelectorAll("[data-kh]").forEach((b) => { b.onclick = () => { const k = kacheln.find((x) => x.id === b.dataset.kh), o = orig.find((x) => x.dataset.a === b.dataset.kh); if (!k || !o) return;
      if (k.aus) { offen = offen === k.id ? null : k.id; return bauen(); } offen = null; o.click(); }; });
    const klick = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = fn; };
    klick("#kh-ende", () => { offen = null; endeKnopf && endeKnopf.click(); });
    klick("#kh-tipp", () => { const t = $("#tipp"); if (t) t.click(); });
    klick("#kh-ab", () => { const o = gewaehlt && orig.find((x) => x.dataset.a === gewaehlt.id); if (o) o.click(); });
    klick("#kh-zoom", () => { zoom = zoom > 1 ? 1 : ZOOM; mitteFuer = ""; bauen(); });
    klick("#kh-log", () => { logAuf = !logAuf; document.body.classList.toggle("kh-log", logAuf); });
    // Karte: füllt den Platz zwischen Zugreihenfolge und Leiste; folgt dem Helden am Zug
    document.body.style.setProperty("--kh-h", el.offsetHeight + "px");
    const w = $(".karte-wrap"); if (w) { const oben = w.getBoundingClientRect().top, frei = window.innerHeight - oben - el.offsetHeight - 6; w.style.height = Math.max(180, Math.round(frei)) + "px"; }
    const wo = a.id + ":" + a.x + "," + a.y + ":" + zoom;
    if (wo !== mitteFuer) { mitteFuer = wo; mitteAuf(a); } else setzen(false);
  }

  if (!GEWAEHLT) { window.ABKH = { an: () => false, bauen: () => {} }; return; }
  // Neu aufbauen, sobald das Spiel seine Bedienung neu gezeichnet hat
  let geplant = false; const spaeter = () => { if (geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; try { bauen(); } catch (e) { /* Prototyp: im Zweifel bleibt die bisherige Ansicht */ document.body.classList.remove("kh-an"); } }); };
  function start() {
    const mo = new MutationObserver(spaeter);
    for (const s of ["#aktionen", "#aktiv", "#hinweis", "#spiel", "#livebar"]) { const e = $(s); if (e) mo.observe(e, { childList: true, attributes: true, attributeFilter: ["hidden"] }); }
    window.addEventListener("resize", () => { mitteFuer = ""; spaeter(); });
    document.addEventListener("click", (e) => { if (logAuf && !e.target.closest("#kh-log") && !e.target.closest("#log")) { logAuf = false; document.body.classList.remove("kh-log"); } });
    spaeter();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.ABKH = { an: () => Boolean(an()), bauen };
})();
