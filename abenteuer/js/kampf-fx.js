/*
 * Mythara · Effekt-Ebene der Kampfansicht (Etappe 1 des High-End-Designs)
 * Ändert keine Regeln: liest nach jedem Zeichnen den Spielstand und spielt Bewegung, Treffer, Zahlen, Partikel,
 * Stimmung (Nebel, Schnee, Glut, Frost) und Banner ab. Zeichnet die Gruppenleiste links und die Bosskarte.
 * Aus bei ?schnell (Tests), bei „Bewegung reduzieren“ und wenn der Tisch es abschaltet (localStorage ab_effekte = "aus").
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const params = new URLSearchParams(location.search);
  const ruhig = () => params.has("schnell") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || (() => { try { return localStorage.getItem("ab_effekte") === "aus"; } catch (e) { return false; } })();
  const Z = 60;
  let alt = null, stimmung = null, partikel = [], kanal = null, ctx = null, laeuft = false, bossGezeigt = null, endeGezeigt = null;

  /* ---------- Stimmung je Kampagne ---------- */
  const STIMMUNG = { rabenmoor: "nebel", grauwacht: "glut", hochwacht: "schnee", krone: "frost" };
  const FARBE = { feuer: [255, 140, 40], heil: [120, 255, 160], gold: [255, 220, 130], blut: [255, 80, 70], eis: [170, 225, 255] };
  function kampagne() { try { return (window.AB && window.AB.META && window.AB.META().id) || "grauwacht"; } catch (e) { return "grauwacht"; } }
  function ebene() {
    const wrap = $(".karte-wrap"); if (!wrap) return null;
    if (!kanal || kanal.parentNode !== wrap) {
      kanal = document.createElement("canvas"); kanal.className = "fx-kanal"; kanal.setAttribute("aria-hidden", "true"); wrap.appendChild(kanal); ctx = kanal.getContext("2d");
    }
    const r = wrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (kanal.width !== Math.round(r.width * dpr) || kanal.height !== Math.round(r.height * dpr)) { kanal.width = Math.round(r.width * dpr); kanal.height = Math.round(r.height * dpr); }
    return { wrap, w: kanal.width, h: kanal.height, dpr };
  }
  function ambient(art) {
    const e = ebene(); if (!e) return;
    partikel = partikel.filter((p) => !p.amb);
    const n = art === "nebel" ? 18 : art === "glut" ? 40 : art === "frost" ? 34 : 60;
    for (let i = 0; i < n; i++) partikel.push(neuAmb(art, e, true));
  }
  function neuAmb(art, e, zufall) {
    const x = Math.random() * e.w, y = zufall ? Math.random() * e.h : (art === "glut" ? e.h + 10 : -10);
    if (art === "nebel") return { amb: art, x, y, r: (90 + Math.random() * 150) * e.dpr, v: (.12 + Math.random() * .25) * e.dpr, a: .05 + Math.random() * .05 };
    if (art === "glut") return { amb: art, x, y, s: (1 + Math.random() * 1.8) * e.dpr, v: (.25 + Math.random() * .6) * e.dpr, w: Math.random() * 6, a: .35 + Math.random() * .5 };
    return { amb: art, x, y, s: (.8 + Math.random() * (art === "frost" ? 1.4 : 2)) * e.dpr, v: (.25 + Math.random() * .7) * e.dpr, w: Math.random() * 6, a: .35 + Math.random() * .4 };
  }
  function schleife() {
    if (!laeuft) return;
    const e = ebene(); if (!e || !$("#spiel") || $("#spiel").hidden) { laeuft = false; return; }
    ctx.clearRect(0, 0, e.w, e.h);
    for (let i = partikel.length - 1; i >= 0; i--) {
      const p = partikel[i];
      if (p.amb === "nebel") { p.x += p.v; if (p.x - p.r > e.w) p.x = -p.r; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(200,220,210,${p.a})`); g.addColorStop(1, "rgba(200,220,210,0)"); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); continue; }
      if (p.amb) {
        p.w += .02; p.y += p.amb === "glut" ? -p.v : p.v; p.x += Math.sin(p.w) * .4;
        if (p.y < -12 || p.y > e.h + 12) Object.assign(p, neuAmb(p.amb, e, false));
        const c = p.amb === "glut" ? "255,150,60" : p.amb === "frost" ? "190,230,255" : "235,242,255";
        ctx.fillStyle = `rgba(${c},${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); continue;
      }
      if (p.verzug > 0) { p.verzug -= 16; continue; }
      p.x += p.vx; p.y += p.vy; p.vx *= .92; p.vy = p.vy * .92 + p.g; p.leben -= .022;
      if (p.leben <= 0) { partikel.splice(i, 1); continue; }
      const [r, g, b] = FARBE[p.art], gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4);
      ctx.globalCompositeOperation = "lighter"; gr.addColorStop(0, `rgba(${r},${g},${b},${p.leben})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); ctx.fillStyle = gr; ctx.fillRect(p.x - p.s * 4, p.y - p.s * 4, p.s * 8, p.s * 8); ctx.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(schleife);
  }
  function starten() { if (!laeuft) { laeuft = true; requestAnimationFrame(schleife); } }
  function wolke(px, py, art, n) {
    const e = ebene(); if (!e) return;
    for (let i = 0; i < n; i++) { const w = Math.random() * Math.PI * 2, s = (art === "heil" ? 1 : 2.4) + Math.random() * (art === "feuer" ? 5 : 3);
      partikel.push({ x: px * e.dpr, y: py * e.dpr, vx: Math.cos(w) * s * e.dpr, vy: Math.sin(w) * s * e.dpr - (art === "heil" ? 1.6 : 0), g: art === "heil" ? -.04 : art === "feuer" ? -.06 : .03, s: (2 + Math.random() * 3) * e.dpr, art, leben: 1 }); }
  }

  /* ---------- Hilfen ---------- */
  function figurPos(id) {
    const g = document.querySelector(`#karte .fig[data-id="${id}"]`), wrap = $(".karte-wrap"); if (!g || !wrap) return null;
    const r = g.getBoundingClientRect(), w = wrap.getBoundingClientRect(); if (!r.width) return null;
    return { x: r.left + r.width / 2 - w.left, y: r.top + r.height / 2 - w.top, h: r.height };
  }
  function zahl(id, text, art) {
    const p = figurPos(id), wrap = $(".karte-wrap"); if (!p) return;
    const d = document.createElement("div"); d.className = "fx-zahl " + art; d.textContent = text; d.style.left = p.x + "px"; d.style.top = p.y - p.h * .45 + "px";
    wrap.appendChild(d); setTimeout(() => d.remove(), 1700);
  }
  function blitz(art) { const b = document.createElement("div"); b.className = "fx-blitz " + art; ($(".karte-wrap") || document.body).appendChild(b); setTimeout(() => b.remove(), 900); }
  function beben() { const w = $(".karte-wrap"); if (!w) return; w.classList.remove("fx-beben"); void w.offsetWidth; w.classList.add("fx-beben"); }
  function banner(titel, text, art = "") {
    let b = $("#fx-banner"); if (!b) { b = document.createElement("div"); b.id = "fx-banner"; document.body.appendChild(b); }
    b.className = "fx-banner " + art; b.innerHTML = `<div class="fx-band"><h2>${esc(titel)}</h2>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    void b.offsetWidth; b.classList.add("zeigen");
  }
  function zugBanner(f) {
    let z = $("#fx-zug"); if (!z) { z = document.createElement("div"); z.id = "fx-zug"; document.body.appendChild(z); }
    const bild = f.fid && window.ABF ? window.ABF.bild(f.fid) : "";
    z.className = "fx-zug"; z.innerHTML = `${bild ? `<span class="fx-zug-bild" style="background-image:url('${bild}')"></span>` : ""}<span><small>DEIN ZUG</small><b>${esc(f.name)}</b></span>`;
    void z.offsetWidth; z.classList.add("zeigen");
  }
  function bossIntro(g) {
    const D = window.ABD_ALLE && window.ABD_ALLE[kampagne()], meta = D && D.META;
    const bild = meta && meta.abschnittBilder ? meta.abschnittBilder[3] || meta.abschnittBilder[2] || meta.bild : meta && meta.bild;
    let d = $("#fx-intro"); if (!d) { d = document.createElement("div"); d.id = "fx-intro"; document.body.appendChild(d); }
    d.className = "fx-intro"; const dd = (window.AB && window.AB.R && window.AB.R.GEGNER[g.art]) || {};
    d.innerHTML = `<div class="fx-intro-bild" style="${bild ? `background-image:url('${bild}')` : ""}"></div><div class="fx-intro-text"><small>${dd.boss || dd.phasen ? "ENDGEGNER" : "ANFÜHRER"}</small><h1>${esc(g.name.replace(/ \d+$/, ""))}</h1></div>`;
    void d.offsetWidth; d.classList.add("zeigen"); d.onclick = () => d.classList.remove("zeigen");
    setTimeout(() => d.classList.remove("zeigen"), 3600);
  }
  const istBoss = (R, g) => { const d = R.GEGNER[g.art] || {}; return Boolean(d.boss || d.phasen || (g.tpMax >= 60)); };

  /* ---------- Seitenleisten ---------- */
  function gruppe(st, R) {
    const el = $("#gruppe-kampf"); if (!el) return;
    const akt = R.aktiv(st), F = window.ABF;
    const helden = st.figuren.filter((f) => f.seite === "spieler" && f.art !== "wolf");
    el.innerHTML = `<h3>Die Gruppe</h3>` + helden.map((f) => {
      const p = Math.max(0, f.tp) / f.tpMax * 100, bild = f.fid && F ? F.bild(f.fid) : "", z = R.zustaende(st, f);
      const vorher = alt && alt.tp[f.id] != null ? Math.max(0, alt.tp[f.id]) / f.tpMax * 100 : p;
      return `<div class="gk-held ${f === akt && !st.ende ? "dran" : ""} ${f.tp <= 0 ? "unten" : ""} ${f.tot ? "tot" : ""}">
        <span class="gk-bild" style="${bild ? `background-image:url('${bild}')` : ""}">${f.art === "begleiter" ? "✦" : ""}</span>
        <div class="gk-info"><b>${esc(f.name)}</b><small>${esc(f.titel || (f.art === "begleiter" ? "Begleiterin" : ""))}${f.stufe ? ` · Stufe ${f.stufe}` : ""}</small>
          <div class="gk-leben ${p > vorher ? "heil" : ""}"><i class="rest" style="width:${Math.max(p, vorher)}%" data-ziel="${p}"></i><i class="wert" style="width:${p}%"></i><span>${f.tot ? "gefallen" : f.tp <= 0 ? "am Boden" : `${f.tp} / ${f.tpMax}`}</span></div>
          <div class="gk-werte"><span>RK <em>${f.rk}</em></span>${f.rucksack && f.art !== "begleiter" ? `<span>Tränke <em>${R.trankZahl(f)}</em></span>` : ""}${z.length ? `<span class="gk-zust">${esc(z.slice(0, 2).join(" · "))}</span>` : ""}</div></div></div>`;
    }).join("");
    requestAnimationFrame(() => el.querySelectorAll(".rest").forEach((r) => { r.style.width = r.dataset.ziel + "%"; }));
  }
  function bossKarte(st, R) {
    const el = $("#boss-karte"); if (!el) return;
    const g = st.figuren.filter((f) => f.seite === "gegner" && f.tp > 0 && istBoss(R, f)).sort((a, b) => b.tpMax - a.tpMax)[0];
    if (!g) { el.hidden = true; el.innerHTML = ""; return; }
    const d = R.GEGNER[g.art] || {}, p = Math.max(0, g.tp) / g.tpMax * 100, ph = d.phasen ? d.phasen.length + 1 : 0, s = g.schild;
    el.hidden = false;
    el.innerHTML = `<small>${d.boss || d.phasen ? "ENDGEGNER" : "ANFÜHRER"}</small><b>${esc(g.name.replace(/ \d+$/, ""))}</b>
      <div class="gk-leben boss"><i class="wert" style="width:${p}%"></i><span>${g.tp} / ${g.tpMax}</span></div>
      ${s ? `<div class="bk-schild ${s.aktiv ? "" : "aus"}"><span>${esc(s.text)}</span><i style="width:${s.aktiv ? Math.max(0, s.rest) / s.halt * 100 : 0}%"></i></div>` : ""}
      ${ph ? `<div class="bk-phasen">${Array.from({ length: ph }, (_, i) => `<span class="${i <= (g.phase || 0) ? "an" : ""}">${["I", "II", "III", "IV"][i]}</span>`).join("")}</div>` : ""}`;
  }

  /** Kopfleiste: Kampagne, Kapitel, Uhr (Glocke/Kälte/Frost …), Runde, Stufe */
  function kopf(st) {
    const el = $("#kampf-kopf"); if (!el) return;
    const D = window.ABD_ALLE && window.ABD_ALLE[kampagne()], m = (D && D.META) || {}, i = window.ABT && window.ABT.info ? window.ABT.info() : null;
    const kap = i && m.abschnitte_namen ? m.abschnitte_namen[i.abschnitt] : "", rom = ["", "I", "II", "III", "IV"][i ? i.abschnitt : 0] || "";
    const uhr = m.uhr, g = i ? i.glocke || 0 : 0, max = (uhr && uhr.max) || 7;
    el.innerHTML = `<div class="kk-logo">MYTHARA</div><div class="kk-trenner"></div>
      <div class="kk-titel"><b>${esc(m.titel || "Übungskampf")}</b><span>${i ? `Kapitel ${rom}${kap ? " · " + esc(kap) : ""}` : esc(st.karte.name || "")}${i && i.titel && i.titel !== kap ? " · " + esc(i.titel) : ""}</span></div>
      <div class="kk-rechts">${uhr && i ? `<div class="kk-uhr"><small>${esc(uhr.name || "").toUpperCase()}</small><div>${Array.from({ length: max }, (_, n) => `<i class="${n < g ? "an" : ""}"></i>`).join("")}</div></div>` : ""}
        <div class="kk-chip">Runde <b>${st.runde}</b></div><div class="kk-chip">Stufe ${st.stufe} · ${st.schwierigkeit === "hardcore" ? "Hardcore" : "Normal"}</div></div>`;
  }
  /* ---------- Nach jedem Zeichnen ---------- */
  function nach(st, R) {
    if (!st) return;
    document.body.classList.toggle("fx-an", !ruhig());
    gruppe(st, R); bossKarte(st, R); kopf(st);
    document.body.dataset.stimmung = STIMMUNG[kampagne()] || "glut";
    const neu = { pos: {}, tp: {}, akt: R.aktiv(st).id, runde: st.runde, log: st.log.length, st };
    for (const f of st.figuren) { neu.pos[f.id] = [f.x, f.y]; neu.tp[f.id] = f.tp; }
    const wrap = $(".karte-wrap"); if (wrap) wrap.classList.toggle("mit-bild", Boolean(st.karte.bild));
    const vorher = alt && alt.st === st ? alt : null;
    alt = neu;
    if (ruhig()) return;
    const art = STIMMUNG[kampagne()] || "schnee";
    if (stimmung !== art || !partikel.some((p) => p.amb)) { stimmung = art; ambient(art); }
    starten();
    if (!vorher) {
      // Kampfbeginn: Bosse bekommen einen Auftritt
      const boss = st.figuren.find((f) => f.seite === "gegner" && f.tp > 0 && (R.GEGNER[f.art] || {}).boss) || st.figuren.find((f) => f.seite === "gegner" && f.tp > 0 && istBoss(R, f));
      if (boss && bossGezeigt !== st.seed) { bossGezeigt = st.seed; bossIntro(boss); }
      else banner("Kampf", st.karte.name || "");
      return;
    }
    // Bewegung: Figuren gleiten vom alten Feld zum neuen (FLIP)
    for (const f of st.figuren) {
      const a = vorher.pos[f.id]; if (!a || (a[0] === f.x && a[1] === f.y) || f.x < 0 || a[0] < 0) continue;
      const g = document.querySelector(`#karte .fig[data-id="${f.id}"]`); if (!g || !g.animate) continue;
      const dx = (a[0] - f.x) * Z, dy = (a[1] - f.y) * Z, weg = Math.max(Math.abs(a[0] - f.x), Math.abs(a[1] - f.y));
      g.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: Math.min(900, 160 + weg * 110), easing: "cubic-bezier(.3,.7,.2,1)" });
    }
    // Leben: Zahlen, Treffer, Heilung
    const logNeu = st.log.slice(vorher.log), krit = logNeu.some((l) => /kritischer Treffer|kritisch/i.test(l.t) && l.art !== "gegner");
    for (const f of st.figuren) {
      const v = vorher.tp[f.id]; if (v == null || v === f.tp) continue;
      const d = f.tp - v, p = figurPos(f.id); if (!p) continue;
      if (d < 0) {
        const kr = krit && f.seite === "gegner";
        setTimeout(() => { zahl(f.id, "−" + Math.abs(d), kr ? "krit" : f.seite === "gegner" ? "schaden" : "wunde"); wolke(p.x, p.y, kr ? "gold" : f.seite === "gegner" ? "feuer" : "blut", kr ? 70 : 26);
          const g = document.querySelector(`#karte .fig[data-id="${f.id}"]`); if (g) { g.classList.remove("fx-treffer"); void g.getBoundingClientRect(); g.classList.add("fx-treffer"); } }, 180);
      } else { zahl(f.id, "+" + d, "heil"); wolke(p.x, p.y, "heil", 30); }
    }
    if (krit) { setTimeout(() => { blitz("gold"); beben(); }, 160); }
    if (logNeu.some((l) => /Feuerball|Flammen|Glut|Feuer/.test(l.t) && l.art === "wurf")) { const z = st.figuren.filter((f) => vorher.tp[f.id] > f.tp && f.seite === "gegner"); for (const f of z) { const p = figurPos(f.id); if (p) wolke(p.x, p.y, "feuer", 60); } }
    // Banner: neue Runde, Phasenwechsel, wer am Zug ist
    const phase = logNeu.find((l) => /Phase (II|III)|Das Siegel bricht|Die Krone des Königs bricht|zerfällt zu Eis und Licht/.test(l.t));
    if (phase) { beben(); blitz("eis"); banner((phase.t.match(/Phase (II|III)/) || [])[0] || "Die Wende", phase.t.replace(/^.*?: /, "").split(".")[0], "phase"); }
    else if (st.runde !== vorher.runde) banner(`Runde ${st.runde}`, "", "runde");
    else if (neu.akt !== vorher.akt && !st.ende) { const f = R.aktiv(st); if (f.seite === "spieler" && f.tp > 0) zugBanner(f); }
    if (st.ende && endeGezeigt !== st.seed) { endeGezeigt = st.seed; if (st.ende === "sieg") { blitz("gold"); banner("Sieg", "", "sieg"); } }
  }

  window.ABFX = { nach, aktiv: () => !ruhig(), banner, bossIntro };
})();
