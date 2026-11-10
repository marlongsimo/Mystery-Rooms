/*
 * Case Unlocked · Abenteuer – Kampf-Prototyp: Darstellung und Bedienung
 * Zeichnet die Rasterkarte als SVG, nimmt Antippen entgegen und ruft nur Funktionen aus regeln.js.
 */
(function () {
  "use strict";
  const R = window.ABR, $ = (s) => document.querySelector(s);
  const Z = 60; // Feldgröße im SVG
  const params = new URLSearchParams(location.search);
  const TEMPO = params.has("schnell") ? 0 : 650;
  let st = null, wahl = null, gegnerTimer = null;

  const ICON = {
    schild: '<path d="M0 -15 L12 -10 L11 4 Q8 12 0 16 Q-8 12 -11 4 L-12 -10 Z" fill="#1d1a14" stroke="#1d1a14" stroke-width="1"/><path d="M0 -10 V11 M-7 -2 H7" stroke="#c9a24a" stroke-width="2.5"/>',
    flamme: '<path d="M0 -16 C9 -6 12 2 7 10 C4 15 -4 15 -7 10 C-11 3 -6 -4 -2 -7 C-2 -2 0 1 3 1 C4 -6 2 -11 0 -16 Z" fill="#1d1a14"/>',
    sonne: '<circle r="7" fill="#1d1a14"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-1.6" y="-16" width="3.2" height="6" fill="#1d1a14" transform="rotate(${a})"/>`).join(""),
  };

  function svgKaefer() {
    return '<g><ellipse rx="17" ry="13" fill="#7a4a2a" stroke="#2a1a10" stroke-width="2"/><path d="M0 -13 V13" stroke="#2a1a10" stroke-width="1.5"/>' +
      [-1, 1].map((s) => `<path d="M${s * 12} -8 l${s * 9} -6 M${s * 14} 0 l${s * 10} 0 M${s * 12} 8 l${s * 9} 6" stroke="#2a1a10" stroke-width="2.4" stroke-linecap="round"/>`).join("") +
      '<circle cx="-5" cy="-14" r="2.4" fill="#e8c27a"/><circle cx="5" cy="-14" r="2.4" fill="#e8c27a"/>' +
      '<circle cx="-6" cy="-2" r="3" fill="#b5713d" opacity=".8"/><circle cx="6" cy="4" r="2.5" fill="#b5713d" opacity=".8"/></g>';
  }

  function hindernis(t, x, y) {
    const cx = x * Z + Z / 2, cy = y * Z + Z / 2;
    if (t === "G") return `<g transform="translate(${cx} ${cy})"><path d="M-14 22 V-8 Q-14 -22 0 -22 Q14 -22 14 -8 V22 Z" fill="#7c7a72" stroke="#3b3a35" stroke-width="2"/><path d="M0 -12 V8 M-6 -4 H6" stroke="#4c4a44" stroke-width="2.4"/><ellipse cy="24" rx="20" ry="5" fill="#000" opacity=".25"/></g>`;
    if (t === "M") return `<g><rect x="${x * Z + 2}" y="${y * Z + 2}" width="${Z - 4}" height="${Z - 4}" fill="#6b6152" stroke="#3a332a" stroke-width="2"/><path d="M${x * Z + 2} ${y * Z + 22}h${Z - 4}M${x * Z + 2} ${y * Z + 40}h${Z - 4}M${x * Z + 30} ${y * Z + 2}v20M${x * Z + 16} ${y * Z + 22}v18M${x * Z + 44} ${y * Z + 22}v18" stroke="#3a332a" stroke-width="1.5"/></g>`;
    return `<g transform="translate(${cx} ${cy})"><circle r="24" fill="#6f6a60" stroke="#3b3a35" stroke-width="3"/><circle r="15" fill="#10161a"/><path d="M-10 -4 Q0 -10 10 -4" stroke="#3d5a6a" stroke-width="2" fill="none"/></g>`;
  }

  function render() {
    const svg = $("#karte"), k = st.karte, akt = R.aktiv(st);
    svg.setAttribute("viewBox", `0 0 ${k.b * Z} ${k.h * Z}`);
    const spielerDran = akt.seite === "spieler" && !st.ende;
    const reach = spielerDran && !wahl ? R.erreichbar(st, akt, st.zug.bewegung) : new Map();
    const zs = spielerDran && wahl ? R.ziele(st, wahl) : [];
    let o = "";
    // Boden
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) {
      const v = ((x * 7 + y * 13) % 5) / 40;
      o += `<rect x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="hsl(${95 + v * 60} 22% ${20 + v * 18}%)"/>`;
    }
    o += `<path d="${Array.from({ length: k.b + 1 }, (_, i) => `M${i * Z} 0V${k.h * Z}`).join("")}${Array.from({ length: k.h + 1 }, (_, i) => `M0 ${i * Z}H${k.b * Z}`).join("")}" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
    // Weg zum Tor
    o += `<rect x="0" y="${4 * Z + 18}" width="${k.b * Z}" height="24" fill="#8a7a5c" opacity=".25"/>`;
    // erreichbare Felder
    for (const [kk, c] of reach) { const [x, y] = kk.split(",").map(Number); if (x === akt.x && y === akt.y) continue; o += `<rect x="${x * Z + 3}" y="${y * Z + 3}" width="${Z - 6}" height="${Z - 6}" rx="6" fill="#7fb7ff" fill-opacity=".14" stroke="#9cc8ff" stroke-opacity=".4"/>`; }
    for (const [t, x, y] of k.hindernisse) o += hindernis(t, x, y);
    // Figuren
    for (const f of st.figuren) {
      const cx = f.x * Z + Z / 2, cy = f.y * Z + Z / 2, tot = f.tp <= 0;
      if (f.seite === "gegner" && tot) { o += `<g transform="translate(${cx} ${cy}) rotate(180)" opacity=".35">${svgKaefer()}</g>`; continue; }
      if (f === akt && !st.ende) o += `<circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 4"/>`;
      if (zs.includes(f)) o += `<circle cx="${cx}" cy="${cy}" r="27" fill="${f.seite === "gegner" ? "#ff5a3a" : "#6fd06a"}" fill-opacity=".25" stroke="${f.seite === "gegner" ? "#ff7a5a" : "#7fe07a"}" stroke-width="3"/>`;
      if (f.seite === "gegner") o += `<g transform="translate(${cx} ${cy})">${svgKaefer()}</g>`;
      else o += `<g transform="translate(${cx} ${cy})" opacity="${tot ? 0.45 : 1}"><circle r="21" fill="${f.farbe}" stroke="#1d1a14" stroke-width="3"/>${ICON[f.zeichen]}</g>`;
      const w = 44, anteil = Math.max(0, f.tp / f.tpMax);
      o += `<rect x="${cx - w / 2}" y="${cy + 23}" width="${w}" height="6" fill="#1b1612" rx="2"/><rect x="${cx - w / 2}" y="${cy + 23}" width="${w * anteil}" height="6" rx="2" fill="${anteil > .5 ? "#6fa86a" : anteil > .25 ? "#d6a23a" : "#c0503a"}"/>`;
      if (tot && f.seite === "spieler") o += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" fill="#fff" font-weight="600">am Boden</text>`;
    }
    // unsichtbare Klickflächen
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) o += `<rect class="feld" data-x="${x}" data-y="${y}" x="${x * Z}" y="${y * Z}" width="${Z}" height="${Z}" fill="transparent"/>`;
    svg.innerHTML = o;

    // Reihenfolge
    $("#reihe").innerHTML = `<span>Runde ${st.runde}</span>` + st.reihe.map((id, i) => { const f = R.fig(st, id); return `<span class="${i === st.am && !st.ende ? "dran" : ""} ${f.tp <= 0 ? "down" : ""} ${f.seite === "gegner" ? "g" : ""}">${f.name}</span>`; }).join("");

    // Panel
    if (st.ende) { $("#aktiv").innerHTML = ""; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else if (!spielerDran) { $("#aktiv").innerHTML = `<b>${akt.name}</b><span class="werte">ist am Zug …</span>`; $("#aktionen").innerHTML = ""; $("#hinweis").textContent = ""; }
    else {
      const c = R.KLASSEN[akt.klasse];
      $("#aktiv").innerHTML = `<b>${akt.name}</b><span class="werte">TP ${akt.tp}/${akt.tpMax} · RK ${akt.rk} · Bewegung ${st.zug.bewegung}${c.plaetze ? ` · Zauberplätze ${akt.plaetze}` : ""}</span>`;
      const knopf = (a, typ) => `<button class="btn ${wahl === a.id ? "gewaehlt" : ""}" data-a="${a.id}" ${R.verfuegbar(st, a.id) && (a.art === "selbstheilung" || R.ziele(st, a.id).length) ? "" : "disabled"}>${a.name}<small>${typ === "bonus" ? "Bonusaktion" : a.platz ? "Aktion · 1 Zauberplatz" : "Aktion"}${a.schaden ? " · " + a.schaden + (a.anzahl ? " ×" + a.anzahl : "") : a.heilung ? " · heilt " + a.heilung : ""}</small></button>`;
      $("#aktionen").innerHTML = c.aktionen.map((a) => knopf(a, "aktion")).join("") + c.bonus.map((a) => knopf(a, "bonus")).join("") + `<button class="btn ghost" id="ende-zug">Zug beenden</button>`;
      $("#hinweis").textContent = wahl ? "Leuchtendes Ziel antippen. Noch einmal auf die Aktion tippen bricht ab." : st.zug.bewegung ? "Blaues Feld antippen, um dich zu bewegen, oder eine Aktion wählen." : "Wähle eine Aktion oder beende den Zug.";
    }
    $("#log").innerHTML = st.log.slice().reverse().map((l) => `<li class="${l.art || ""}">${l.t}</li>`).join("");
    if (st.ende) zeigeEnde();
  }

  function zeigeEnde() {
    const e = $("#ende"); e.hidden = false;
    e.innerHTML = st.ende === "sieg"
      ? `<h2>Sieg im Klostergarten</h2><p>Die Rostkäfer sind besiegt, nach ${st.runde} Runden. Hinter dem Garten wartet der Glockenturm.</p><button class="btn" id="neu">Noch einmal</button>`
      : `<h2>Rückzug</h2><p>Die Gruppe liegt am Boden und zieht sich zum Lagerfeuer zurück. Im echten Abenteuer verliert ihr nichts, ihr versucht es einfach noch einmal.</p><button class="btn" id="neu">Noch einmal</button>`;
    $("#neu").onclick = () => start(Math.floor(Math.random() * 1e9));
  }

  function gegnerSchleife() {
    clearTimeout(gegnerTimer);
    if (st.ende) return;
    if (R.aktiv(st).seite === "gegner") gegnerTimer = setTimeout(() => { R.gegnerZug(st); render(); gegnerSchleife(); }, TEMPO);
  }

  function klickFeld(x, y) {
    const akt = R.aktiv(st);
    if (st.ende || akt.seite !== "spieler") return;
    if (wahl) {
      const z = R.ziele(st, wahl).find((f) => f.x === x && f.y === y);
      if (!z) { $("#hinweis").textContent = "Dort ist kein gültiges Ziel."; return; }
      R.handeln(st, wahl, z.id); wahl = null; render(); return;
    }
    const r = R.bewegen(st, x, y);
    if (r.fehler) $("#hinweis").textContent = r.fehler; else render();
  }

  function start(seed) {
    clearTimeout(gegnerTimer);
    st = R.neuesSpiel(seed); wahl = null;
    window.AB.st = st;
    $("#intro").hidden = true; $("#spiel").hidden = false; $("#ende").hidden = true;
    render(); gegnerSchleife();
  }

  $("#karte").addEventListener("click", (ev) => { const t = ev.target.closest(".feld"); if (t) klickFeld(+t.dataset.x, +t.dataset.y); });
  $("#aktionen").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.id === "ende-zug") { wahl = null; R.zugEnde(st); render(); gegnerSchleife(); return; }
    const id = b.dataset.a, h = R.findeAktion(R.aktiv(st), id);
    if (h && h.a.art === "selbstheilung") { R.handeln(st, id, R.aktiv(st).id); wahl = null; render(); return; }
    wahl = wahl === id ? null : id; render();
  });
  $("#start").onclick = () => start(params.has("seed") ? +params.get("seed") : Math.floor(Math.random() * 1e9));

  // Für automatische Tests: ein Zug der Spielerfigur nach einfacher Logik
  window.AB = { st: null, R, render, klickFeld, auto() { if (st && !st.ende && R.aktiv(st).seite === "spieler") { R.autoZug(st); wahl = null; render(); gegnerSchleife(); } } };
})();
