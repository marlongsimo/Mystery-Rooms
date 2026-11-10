/*
 * Case Unlocked · Abenteuer – Regeln (ohne Darstellung, testbar im Browser und in Node)
 * W20-Proben, Angriffe, Zustände, Flächen, Reaktionen, Bewegung auf dem Raster, Gegnerverhalten,
 * Todeswürfe (Hardcore) und eine einfache Steuerung für Figuren ohne Spielerin oder Spieler.
 * Die 15 Figuren stehen in figuren.js, ihre Zahlen sind mit tools/balance.js abgestimmt.
 */
(function (root) {
  "use strict";
  const FD = root.ABF || (typeof require === "function" ? require("./figuren.js") : null);

  /* ---------- Zufall (mit Startwert; Zustand in st.rs, damit er sich speichern lässt) ---------- */
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function zufall(st) {
    st.r = function () { st.rs = (st.rs + 0x6d2b79f5) >>> 0; let t = st.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return st;
  }
  const W = (r, n) => 1 + Math.floor(r() * n);
  /** „2W6+3“ → {n:2, s:6, b:3} */
  function parse(expr) { const m = /^(\d+)W(\d+)([+-]\d+)?$/.exec(expr); return { n: +m[1], s: +m[2], b: m[3] ? +m[3] : 0 }; }
  function roll(r, expr, crit = false) {
    const p = parse(expr), n = crit ? p.n * 2 : p.n, rolls = [];
    for (let i = 0; i < n; i++) rolls.push(W(r, p.s));
    return { total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + p.b), rolls, bonus: p.b };
  }
  const mittel = (expr) => { const p = parse(expr); return p.n * (p.s + 1) / 2 + p.b; };
  const mod = (v) => Math.floor((v - 10) / 2);
  const UEBUNG = 2;
  const SG = (f, attr) => 8 + UEBUNG + mod(f.werte[attr]);

  /* ---------- Gegenstände ---------- */
  const DINGE = {
    heiltrank: { name: "Heiltrank", text: "Rote, warme Flüssigkeit. Trinken ist eine Bonusaktion und heilt 2W4+2 TP.", heilung: "2W4+2" },
  };
  const TRANK = { id: "heiltrank", name: "Heiltrank trinken", typ: "bonus", art: "trank", heilung: "2W4+2", text: DINGE.heiltrank.text };
  const STABIL = { id: "stabilisieren", name: "Stabilisieren", typ: "aktion", art: "aufrichten", reichweite: 1, stabil: true, text: "Eine Figur am Boden neben dir: In Normal steht sie mit 1 TP auf, in Hardcore hören ihre Todeswürfe auf." };
  const SPURT = { id: "spurt_aktion", name: "Spurt", typ: "aktion", art: "spurt", text: "6 Felder zusätzliche Bewegung statt einer Aktion." };

  /* ---------- Gegner (Grauwacht) ---------- */
  const GEGNER = {
    rostkaefer: { name: "Rostkäfer", tp: 9, rk: 13, werte: { STR: 12, GES: 12, KON: 13, INT: 1, WEI: 10, CHA: 3 }, angriff: { name: "Biss", bonus: 3, schaden: "1W6+1" }, rost: true, xp: 25 },
    schattenkobold: { name: "Schattenkobold", tp: 7, rk: 13, werte: { STR: 8, GES: 15, KON: 10, INT: 10, WEI: 8, CHA: 8 }, angriff: { name: "Dolch", bonus: 4, schaden: "1W4+2" }, flieht: 3, xp: 25 },
    knochenwaechter: { name: "Knochenwächter", tp: 13, rk: 13, werte: { STR: 10, GES: 14, KON: 15, INT: 6, WEI: 8, CHA: 5 }, angriff: { name: "Kurzschwert", bonus: 4, schaden: "1W6+2" }, untot: true, anfaellig: "wucht", xp: 50 },
    pilzbrut: { name: "Pilzbrut", tp: 18, rk: 5, werte: { STR: 6, GES: 1, KON: 14, INT: 1, WEI: 3, CHA: 1 }, sporen: { sg: 12, schaden: "1W8" }, bewegung: 0, xp: 50 },
    netzweber: { name: "Netzweber", tp: 26, rk: 14, werte: { STR: 14, GES: 16, KON: 12, INT: 2, WEI: 11, CHA: 4 }, angriff: { name: "Biss", bonus: 5, schaden: "1W10+3" }, netz: { bonus: 5, sg: 12, reichweite: 6 }, xp: 200 },
    aschehund: { name: "Aschehund", tp: 22, rk: 13, werte: { STR: 17, GES: 12, KON: 14, INT: 6, WEI: 12, CHA: 6 }, angriff: { name: "Biss", bonus: 5, schaden: "1W8+3" }, atem: { schaden: "3W6", sg: 12, alle: 3 }, xp: 200 },
    grabritter: { name: "Grabritter", tp: 45, rk: 17, werte: { STR: 18, GES: 11, KON: 16, INT: 10, WEI: 12, CHA: 12 }, angriff: { name: "Zweihänder", bonus: 6, schaden: "2W6+4" }, untot: true, xp: 450 },
  };
  const WOLF_WERTE = { STR: 12, GES: 15, KON: 12, INT: 3, WEI: 12, CHA: 6 };

  /* ---------- Karte ---------- */
  const key = (x, y) => x + "," + y;
  const abstand = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const lebt = (f) => f.tp > 0 && !f.tot && !(f.z && f.z.verbannt);
  function blockiert(st, x, y) { return x < 0 || y < 0 || x >= st.karte.b || y >= st.karte.h || st.karte.block.has(key(x, y)); }
  function belegt(st, x, y, ausser) { return st.figuren.some((f) => f !== ausser && !f.tot && !(f.z && f.z.verbannt) && (f.tp > 0 || f.seite === "spieler") && f.x === x && f.y === y); }
  const imRauch = (st, x, y) => st.zonen.some((z) => z.art === "rauch" && Math.max(Math.abs(z.x - x), Math.abs(z.y - y)) <= z.radius);

  /** Erreichbare Felder (8 Richtungen, keine Ecken durch Hindernisse), Map key → Kosten */
  function erreichbar(st, f, max) {
    const ziel = new Map([[key(f.x, f.y), 0]]), q = [[f.x, f.y, 0]];
    while (q.length) {
      const [x, y, d] = q.shift();
      if (d >= max) continue;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (blockiert(st, nx, ny)) continue;
        if (dx && dy && (blockiert(st, x + dx, y) || blockiert(st, x, y + dy))) continue;
        const k = key(nx, ny);
        const anderer = st.figuren.find((o) => o !== f && lebt(o) && o.x === nx && o.y === ny);
        if (anderer && anderer.seite !== f.seite) continue; // durch Gegner nicht hindurch
        if (ziel.has(k)) continue;
        ziel.set(k, d + 1); q.push([nx, ny, d + 1]);
      }
    }
    for (const k of [...ziel.keys()]) { const [x, y] = k.split(",").map(Number); if (belegt(st, x, y, f)) ziel.delete(k); }
    return ziel;
  }
  /** Bewegungsfelder des Zugs: normal plus Schattenschritt (über Hindernisse, Chebyshev) */
  function bewegungsfelder(st, f) {
    const m = erreichbar(st, f, st.zug ? st.zug.bewegung : 6);
    if (st.zug && st.zug.schritt > 0) {
      for (let dx = -st.zug.schritt; dx <= st.zug.schritt; dx++) for (let dy = -st.zug.schritt; dy <= st.zug.schritt; dy++) {
        const x = f.x + dx, y = f.y + dy, k = key(x, y);
        if (m.has(k) || blockiert(st, x, y) || belegt(st, x, y, f)) continue;
        m.set(k, "schritt");
      }
    }
    return m;
  }

  /** Sichtlinie: kein Hindernis und kein Rauch dazwischen; im Rauch sieht man nur Nachbarn */
  function sicht(st, a, b) {
    if (abstand(a, b) <= 1) return true;
    if (imRauch(st, a.x, a.y) || imRauch(st, b.x, b.y)) return false;
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 4;
    for (let i = 1; i < n; i++) {
      const x = Math.round(a.x + (b.x - a.x) * i / n), y = Math.round(a.y + (b.y - a.y) * i / n);
      if ((x !== a.x || y !== a.y) && (x !== b.x || y !== b.y) && (st.karte.block.has(key(x, y)) || imRauch(st, x, y))) return false;
    }
    return true;
  }
  /** Deckung: Hindernis direkt neben dem Ziel auf der Seite des Schützen */
  function deckung(st, a, z) {
    for (const k of st.karte.block) {
      const [x, y] = k.split(",").map(Number), o = { x, y };
      if (abstand(o, z) !== 1 || abstand(a, o) >= abstand(a, z)) continue;
      if ((o.x - z.x) * (a.x - z.x) + (o.y - z.y) * (a.y - z.y) > 0) return true;
    }
    return false;
  }

  const KARTE_GARTEN = {
    name: "Der Klostergarten", b: 12, h: 9,
    hindernisse: [
      ["G", 4, 1], ["G", 4, 3], ["G", 7, 2], ["G", 7, 6], ["G", 4, 7],
      ["M", 6, 4], ["M", 6, 5], ["B", 9, 4],
    ],
    start: {
      spieler: [[1, 3], [1, 5], [2, 4], [0, 2], [0, 6], [2, 2]],
      wolf: [[2, 6], [3, 5], [0, 4], [3, 3]],
      gegner: [[10, 1], [10, 7], [11, 4], [11, 2], [11, 6], [10, 3], [10, 5], [11, 0]],
    },
  };

  /* ---------- Figuren ---------- */
  const fig = (st, id) => st.figuren.find((f) => f.id === id);
  const aktiv = (st) => fig(st, st.reihe[st.am]);
  const istFig = (f, fid) => f && f.fid === fid;
  const wolfVon = (st, f) => st.figuren.find((o) => o.art === "wolf" && o.besitzer === f.id);
  const spielerFiguren = (st) => st.figuren.filter((f) => f.seite === "spieler" && f.art !== "wolf");
  const gegnerFiguren = (st) => st.figuren.filter((f) => f.seite === "gegner");

  function neueFigur(fid, i, stufe, x, y) {
    const d = FD.FIGUREN[fid], k = FD.KLASSEN[d.klasse], tp = FD.tpVon(fid, stufe);
    const pl = k.plaetze ? FD.PLAETZE[stufe].slice() : [0, 0];
    return {
      id: "f" + i, seite: "spieler", fid, klasse: d.klasse, name: d.name, titel: d.titel, stufe, x, y,
      tp, tpMax: tp, rk: d.rk[stufe - 1], rkBasis: d.rk[stufe - 1], metall: Boolean(d.metall), werte: d.werte,
      plaetze: pl, plaetzeMax: pl.slice(), genutzt: {}, rucksack: [{ id: "heiltrank", n: 1 }], z: {}, todes: { e: 0, f: 0 }, reaktion: 1,
    };
  }

  /**
   * Neuer Kampf.
   * opts.figuren: Liste von Figuren-IDs (3–6), opts.stufe 1–3, opts.schwierigkeit "normal" | "hardcore",
   * opts.gegner: [{ art, anzahl }] (Standard: so viele Rostkäfer wie Figuren), opts.karte
   */
  function neuesSpiel(seed, opts = {}) {
    const st = { sparen: opts.sparen != null ? opts.sparen : 1, seed, rs: seed >>> 0 || 1, karte: null, figuren: [], log: [], runde: 1, reihe: [], am: 0, zug: null, ende: null, xp: 0, zonen: [], brand: [],
      stufe: opts.stufe || 1, schwierigkeit: opts.schwierigkeit === "hardcore" ? "hardcore" : "normal" };
    zufall(st);
    const r = st.r, k = opts.karte || KARTE_GARTEN;
    st.karte = { name: k.name, b: k.b, h: k.h, hindernisse: k.hindernisse, start: k.start, block: new Set(k.hindernisse.map(([, x, y]) => key(x, y))) };
    const fids = (opts.figuren && opts.figuren.length ? opts.figuren : ["schildwaechter", "elementarist", "lichtbringer"]).slice(0, 6);
    fids.forEach((fid, i) => {
      const [x, y] = k.start.spieler[i];
      const f = neueFigur(fid, i, st.stufe, x, y);
      const v = opts.vorher && opts.vorher[fid];
      if (v) { f.tp = v.tot ? 0 : Math.max(v.tp, 1); f.tot = Boolean(v.tot); f.plaetze = v.plaetze.slice(); f.genutzt = Object.assign({}, v.genutzt); f.rucksack = JSON.parse(JSON.stringify(v.rucksack)); }
      st.figuren.push(f);
      if (f.tot) { f.x = -1; f.y = -1; }
      const wd = FD.FIGUREN[fid].wolf;
      if (wd) {
        const frei = k.start.wolf.find(([wx, wy]) => !belegt(st, wx, wy));
        st.figuren.push({ id: "w" + i, seite: "spieler", art: "wolf", besitzer: f.id, name: wd.name, x: frei[0], y: frei[1], tp: wd.tp[st.stufe - 1], tpMax: wd.tp[st.stufe - 1], rk: wd.rk, rkBasis: wd.rk, werte: WOLF_WERTE, z: {}, reaktion: 1, genutzt: {} });
      }
    });
    const gruppen = opts.gegner || [{ art: "rostkaefer", anzahl: fids.length }];
    let gi = 0;
    for (const g of gruppen) for (let i = 0; i < g.anzahl; i++) {
      const d = GEGNER[g.art];
      let [x, y] = k.start.gegner[gi % k.start.gegner.length];
      if (gi >= k.start.gegner.length || belegt(st, x, y) || blockiert(st, x, y)) {
        // nächstes freies Feld auf der Gegnerseite
        let best = null;
        for (let yy = 0; yy < k.h; yy++) for (let xx = Math.floor(k.b * 0.6); xx < k.b; xx++) { if (blockiert(st, xx, yy) || belegt(st, xx, yy)) continue; const dd = Math.abs(xx - x) + Math.abs(yy - y) + (k.b - 1 - xx) * 0.1; if (!best || dd < best.dd) best = { xx, yy, dd }; }
        if (best) { x = best.xx; y = best.yy; }
      }
      const nr = gruppen.length === 1 || g.anzahl > 1 ? " " + (i + 1) : "";
      st.figuren.push({ id: "g" + gi, seite: "gegner", art: g.art, name: d.name + nr, x, y, tp: d.tp, tpMax: d.tp, rk: d.rk, rkBasis: d.rk, werte: d.werte, z: {}, reaktion: 1, genutzt: {}, atemBereit: true });
      gi++;
    }
    // Initiative (Wölfe handeln im Zug ihrer Besitzerin)
    const teil = st.figuren.filter((f) => f.art !== "wolf");
    for (const f of teil) { const w = W(r, 20); f.ini = w + mod(f.werte.GES); f.iniWurf = w; }
    st.reihe = teil.slice().sort((a, b) => b.ini - a.ini || mod(b.werte.GES) - mod(a.werte.GES) || (a.seite === "spieler" ? -1 : 1)).map((f) => f.id);
    st.log.push({ t: "Initiative: " + st.reihe.map((id) => { const f = fig(st, id); return `${f.name} (${f.ini})`; }).join(" · ") });
    if (st.schwierigkeit === "hardcore") st.log.push({ t: "Hardcore: Wer am Boden liegt, würfelt Todeswürfe. Der Tod ist endgültig.", art: "schlecht" });
    // Jagdvorbereitung: Kopfgeldjäger ab Stufe 2 beginnt mit einem markierten Gegner
    for (const f of spielerFiguren(st)) if (istFig(f, "kopfgeldjaeger") && f.stufe >= 2) {
      const z = gegnerFiguren(st).sort((a, b) => b.tp - a.tp)[0];
      if (z) { z.z.mal_jaeger = f.id; f.malZiel = z.id; st.log.push({ t: `${f.name} hat ${z.name} schon im Visier (Jagdvorbereitung).` }); }
    }
    beginneZug(st);
    return st;
  }

  /* ---------- Fähigkeiten einer Figur ---------- */
  function faehigkeiten(f) {
    if (!f || f.seite !== "spieler" || f.art === "wolf") return [];
    return FD.faehigVon(f.fid, f.stufe);
  }
  function findeAktion(f, id) {
    if (!f) return null;
    if (id === "heiltrank") return { a: TRANK, typ: "bonus" };
    if (id === "stabilisieren") return { a: STABIL, typ: "aktion" };
    if (id === "spurt_aktion") return { a: SPURT, typ: "aktion" };
    const fid = f.fid, liste = fid ? FD.faehigVon(fid, f.stufe) : [];
    const a = liste.find((x) => x.id === id && x.typ !== "passiv");
    return a ? { a, typ: a.typ } : null;
  }
  /** Alle wählbaren Aktionen in fester Reihenfolge (für Tisch und Handy) */
  function aktionenVon(f, st) {
    const liste = faehigkeiten(f).filter((a) => a.typ === "aktion" || a.typ === "bonus" || a.typ === "frei");
    if (trankZahl(f)) liste.push(TRANK);
    if (!st || st.figuren.some((o) => o.seite === "spieler" && o.art !== "wolf" && o.tp <= 0 && !o.tot)) liste.push(STABIL);
    liste.push(SPURT);
    return liste;
  }
  const trankZahl = (f) => { const t = (f.rucksack || []).find((d) => d.id === "heiltrank"); return t ? t.n : 0; };
  /** Wie oft eine Fähigkeit in diesem Kampf noch geht (Infinity = beliebig) */
  function rest(f, a) {
    const gen = (f.genutzt || {})[a.id] || 0;
    if (a.id === "raserei") return 1 - gen;
    if (a.id === "brandmal") return Infinity; // erster frei, danach Platz
    if (!a.pro) return Infinity;
    const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange;
    const n = Array.isArray(v) ? v[f.stufe - 1] : v;
    return n - gen;
  }
  /** Platz finden: kleinster passender Grad, Rückgabe Index oder -1 */
  function platzIndex(f, grad) {
    for (let g = grad; g <= 2; g++) if ((f.plaetze || [0, 0])[g - 1] > 0) return g - 1;
    return -1;
  }
  function brauchtPlatz(f, a) {
    if (a.id === "brandmal") return ((f.genutzt || {}).brandmal_frei || 0) >= 1 ? 1 : 0;
    if (a.art === "mal" && a.mal === "jaeger") return 0;
    return a.platz || 0;
  }

  /* ---------- Zustände ---------- */
  const ZUSTAND_NAME = { verlangsamt: "verlangsamt", veraengstigt: "verängstigt", festgehalten: "festgehalten", geblendet: "geblendet", liegend: "liegt", vergiftet: "vergiftet", entwaffnet: "entwaffnet", zeitriss: "Zeitriss", verbannt: "verbannt", raserei: "Raserei", versteckt: "versteckt", segen: "gesegnet", schild: "Schild des Glaubens", spiegel: "Spiegelbilder", finte: "Finte", gift: "Gift bereit", spott: "verspottet", stich: "Schattenstich", ruecksichtslos: "rücksichtslos", rueckzug: "Rückzug" };
  function zustaende(st, f) {
    const z = f.z || {}, out = [];
    for (const k of Object.keys(ZUSTAND_NAME)) if (z[k]) out.push(k === "spiegel" ? `${ZUSTAND_NAME[k]} (${z[k]})` : ZUSTAND_NAME[k]);
    if (z.mal_jaeger) out.push("Jägermal");
    if (z.brandmal) out.push("Brandmal");
    if (z.analyse === st.runde) out.push("analysiert (−2 RK)");
    return out;
  }
  const dauer = (v) => (typeof v === "object" ? v.rest : v);

  /** Effektive Rüstungsklasse gegen einen Angriff */
  function rkEff(st, z, a, spec = {}) {
    let rk = z.rk;
    if (z.z.schild) rk += 2;
    if (z.seite === "spieler" && st.figuren.some((l) => istFig(l, "lichtbringer") && lebt(l) && l.z.schutzkreis > st.runde && abstand(l, z) <= 2)) rk += 2;
    if (z.z.analyse === st.runde) rk -= 2;
    if (z.z.zeitriss) rk -= 2;
    if (z.seite === "gegner" && st.zonen.some((zo) => zo.art === "bann" && Math.max(Math.abs(zo.x - z.x), Math.abs(zo.y - z.y)) <= zo.radius)) rk -= 2;
    if (a && spec.fern && abstand(a, z) > 1 && !istFig(a, "wildnislaeufer") && deckung(st, a, z)) rk += 2;
    return rk;
  }
  /** Vorteil (+1), Nachteil (−1) oder neutral (0) mit Gründen */
  function vorteil(st, a, z, spec = {}) {
    const plus = [], minus = [];
    const nah = abstand(a, z) <= 1;
    if (z.z.festgehalten) plus.push("festgehalten");
    if (z.z.geblendet) plus.push("geblendet");
    if (z.z.liegend && nah) plus.push("liegt");
    if (z.z.liegend && !nah) minus.push("liegt (fern)");
    if (a.z.versteckt) plus.push("aus dem Versteck");
    if (a.z.finte) plus.push("Finte");
    if (spec.ruecksichtslos) plus.push("rücksichtslos");
    if (z.z.ruecksichtslos) plus.push("Ziel rücksichtslos");
    if (istFig(a, "assassine") && !z.gehandelt) plus.push("Todesstoß");
    if (istFig(a, "tiergefaehrte")) { const w = wolfVon(st, a); if (w && lebt(w) && abstand(w, z) <= 1) plus.push("Rudeltaktik"); }
    if (a.art === "wolf") { const b = fig(st, a.besitzer); if (b && lebt(b) && abstand(b, z) <= 1) plus.push("Rudeltaktik"); }
    if (a.z.geblendet) minus.push("geblendet");
    if (a.z.vergiftet) minus.push("vergiftet");
    if (a.z.liegend) minus.push("liegt");
    if (a.z.stich) minus.push("Schattenstich");
    if (a.z.spott && a.z.spott !== z.id) minus.push("verspottet");
    if (istFig(z, "schattenmagier") && !z.trugbildWeg) minus.push("Trugbild");
    if (spec.fern && a.seite === "spieler" && st.figuren.some((o) => o.seite !== a.seite && lebt(o) && abstand(o, a) <= 1)) minus.push("Gegner daneben");
    const v = plus.length && minus.length ? 0 : plus.length ? 1 : minus.length ? -1 : 0;
    return { v, plus, minus };
  }

  /* ---------- Würfe ---------- */
  function w20(st, v) {
    const a = W(st.r, 20);
    if (!v) return { w: a, alle: [a] };
    const b = W(st.r, 20);
    return { w: v > 0 ? Math.max(a, b) : Math.min(a, b), alle: [a, b] };
  }
  /** Gedankenstütze der Gelehrten: knapp misslungenen W20 eines Verbündeten wiederholen (2× je Rast) */
  function gedankenstuetze(st, wer, fehlt) {
    if (wer.seite !== "spieler" || fehlt > 3 || fehlt <= 0) return null;
    const g = st.figuren.find((o) => istFig(o, "gelehrter") && lebt(o) && o.stufe >= 2 && (o.genutzt.gedankenstuetze || 0) < 2 && abstand(o, wer) <= 12);
    if (!g) return null;
    g.genutzt.gedankenstuetze = (g.genutzt.gedankenstuetze || 0) + 1;
    return g;
  }
  /** Rettungswurf: {erfolg, w, total} */
  function rettung(st, z, attr, sg) {
    let v = 0; if (attr === "GES" && z.z.festgehalten) v = -1;
    let { w } = w20(st, v);
    const bon = () => mod(z.werte[attr]) + (z.seite === "spieler" && z.klasse && FD.KLASSEN[z.klasse].rettung.includes(attr) ? UEBUNG : 0);
    let total = w + bon() + (z.z.segen ? W(st.r, 4) : 0);
    if (total < sg) { const g = gedankenstuetze(st, z, sg - total); if (g) { w = W(st.r, 20); total = w + bon() + (z.z.segen ? W(st.r, 4) : 0); st.log.push({ t: `${g.name}: Gedankenstütze – ${z.name} würfelt noch einmal.`, art: "gut" }); } }
    return { erfolg: total >= sg, w, total };
  }

  /* ---------- Schaden, Heilung, Ende ---------- */
  function schaden(st, z, n, opts = {}) {
    if (z.tot) return;
    if (z.seite === "spieler" && z.tp <= 0) {
      if (st.schwierigkeit === "hardcore" && z.art !== "wolf" && n > 0) {
        z.todes.f += opts.krit ? 2 : 1;
        st.log.push({ t: `${z.name} wird am Boden getroffen: Todeswurf misslungen (${z.todes.f}/3).`, art: "schlecht" });
        if (z.todes.f >= 3) stirbt(st, z);
      }
      return;
    }
    const ueber = n - z.tp;
    z.tp = Math.max(0, z.tp - n);
    if (z.tp === 0) {
      if (z.seite === "gegner") st.log.push({ t: `${z.name} ist besiegt.`, art: "gut" });
      else if (z.art === "wolf") { st.log.push({ t: `${z.name} bleibt winselnd liegen.`, art: "schlecht" }); if (st.schwierigkeit === "hardcore") z.tot = true; }
      else {
        z.todes = { e: 0, f: 0 }; z.stabil = false;
        for (const k of ["versteckt", "raserei", "finte", "gift", "rueckzug"]) delete z.z[k];
        z.z.liegend = true;
        if (st.schwierigkeit === "hardcore" && ueber >= z.tpMax) { stirbt(st, z); }
        else st.log.push({ t: `${z.name} geht zu Boden!`, art: "schlecht" });
      }
      for (const f of spielerFiguren(st)) if (f.malZiel === z.id) f.malFrei = true; // Jägermal darf weiter
    }
    pruefeEnde(st);
  }
  function stirbt(st, z) {
    z.tot = true; z.tp = 0;
    st.log.push({ t: `${z.name} ist tot.`, art: "schlecht" });
  }
  function heilen(st, z, n, quelle) {
    if (z.tot) return 0;
    if (z.z.raserei) n = Math.floor(n / 2);
    const vorher = z.tp; z.tp = Math.min(z.tpMax, z.tp + n);
    if (vorher === 0 && z.tp > 0) { z.todes = { e: 0, f: 0 }; z.stabil = false; }
    st.log.push({ t: `${quelle}: ${z.name} heilt ${z.tp - vorher} TP${vorher === 0 && z.tp > 0 ? " und steht wieder auf" : ""}.`, art: "gut" });
    return z.tp - vorher;
  }
  function pruefeEnde(st) {
    if (st.ende) return st.ende;
    const sp = spielerFiguren(st), ge = gegnerFiguren(st);
    if (ge.every((f) => f.tp <= 0)) {
      st.ende = "sieg"; st.xp = ge.reduce((a, g) => a + GEGNER[g.art].xp, 0);
      st.log.push({ t: `Sieg! Alle Gegner sind besiegt. Jede Figur erhält ${Math.floor(st.xp / sp.length)} EP.`, art: "ende" });
    } else if (sp.every((f) => f.tp <= 0)) {
      if (st.schwierigkeit === "hardcore") {
        st.ende = "niederlage";
        for (const f of sp) if (!f.tot && !f.stabil) f.tot = true;
        st.log.push({ t: "Die ganze Gruppe liegt am Boden. Niemand kommt, um sie zu holen.", art: "ende" });
      } else { st.ende = "rueckzug"; st.log.push({ t: "Die ganze Gruppe liegt am Boden. Ihr zieht euch zum Lagerfeuer zurück.", art: "ende" }); }
    }
    return st.ende;
  }

  /* ---------- Angriffe ---------- */
  /**
   * Ein Angriffswurf mit allen Reaktionen. spec: { name, bonus, schaden, fest, extra:[Würfel], nah, fern, magisch, wucht, krit, ruecksichtslos,
   *   hinterhalt: Würfel (nur Schurken), nachTreffer(treffer) }
   */
  function angriffswurf(st, a, z, spec) {
    // Spiegelbilder
    if (z.z.spiegel > 0 && W(st.r, 2) === 1) {
      z.z.spiegel--; if (!z.z.spiegel) delete z.z.spiegel;
      st.log.push({ t: `${a.name}: ${spec.name} trifft nur ein Spiegelbild von ${z.name}.`, art: a.seite === "gegner" ? "gegner" : "wurf" });
      nachAngriff(st, a, z);
      return { treffer: false, spiegel: true };
    }
    const vt = vorteil(st, a, z, spec);
    let v = vt.v;
    // Schutzhaltung: Angriff gegen Verbündeten neben dem Schildwächter
    if (a.seite === "gegner" && z.seite === "spieler") {
      const s = st.figuren.find((o) => istFig(o, "schildwaechter") && o !== z && lebt(o) && o.reaktion > 0 && abstand(o, z) <= 1);
      if (s) { s.reaktion--; vt.minus.push("Schutzhaltung"); v = vt.plus.length ? 0 : -1; st.log.push({ t: `${s.name} stellt sich mit dem Schild dazwischen (Schutzhaltung).` }); }
    }
    let rk = rkEff(st, z, a, spec);
    const kritAb = spec.krit || 20;
    let { w } = w20(st, v);
    const segen = () => (a.z.segen ? W(st.r, 4) : 0);
    let total = w + spec.bonus + segen();
    let treffer = w !== 1 && (w >= kritAb || total >= rk);
    // Glückspilz (Trickserin): eigener knapper Fehlwurf
    if (!treffer && istFig(a, "trickser") && rk - total <= 5 && (a.genutzt.glueckspilz || 0) < 1) {
      a.genutzt.glueckspilz = 1; w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk);
      st.log.push({ t: `${a.name} hat Glück und versucht es noch einmal.` });
    }
    // Gedankenstütze
    if (!treffer && a.seite === "spieler" && w !== 1) { const g = gedankenstuetze(st, a, rk - total); if (g) { w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk); st.log.push({ t: `${g.name}: Gedankenstütze – ${a.name} würfelt noch einmal.`, art: "gut" }); } }
    // Glückspilz: Gegner trifft die Trickserin
    if (treffer && w < kritAb && istFig(z, "trickser") && a.seite === "gegner" && (z.genutzt.glueckspilz || 0) < 1) {
      z.genutzt.glueckspilz = 1; w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk);
      st.log.push({ t: `${z.name} weicht im letzten Moment aus: ${a.name} muss neu würfeln.` });
    }
    // Schutzglyphe (Gelehrte): knapper Treffer, der viel kosten würde
    if (treffer && w < kritAb && a.seite === "gegner" && z.seite === "spieler" && total < rk + 5) {
      const g = st.figuren.find((o) => istFig(o, "gelehrter") && lebt(o) && o.reaktion > 0 && platzIndex(o, 1) >= 0 && abstand(o, z) <= 6);
      if (g && z.tp - mittel(spec.schaden) <= z.tpMax / 2) {
        g.reaktion--; g.plaetze[platzIndex(g, 1)]--; rk += 5; treffer = false;
        st.log.push({ t: `${g.name} wirft eine Schutzglyphe vor ${z.name}: RK ${rk}.`, art: "gut" });
      }
    }
    const krit = treffer && w >= kritAb;
    const vtext = v > 0 ? " (Vorteil)" : v < 0 ? " (Nachteil)" : "";
    let erg = { treffer, krit, w, total, schaden: 0 };
    if (treffer) {
      let s = roll(st.r, spec.schaden, krit).total + (spec.fest || 0);
      const extra = (spec.extra || []).slice();
      if (spec.hinterhalt && !st.zug.hinterhalt && (v > 0 || (v === 0 && st.figuren.some((o) => o.seite === a.seite && o !== a && lebt(o) && abstand(o, z) <= 1)))) { extra.push(spec.hinterhalt); st.zug.hinterhalt = true; }
      for (const e of extra) s += roll(st.r, e, krit).total;
      if (a.z.entwaffnet) s = Math.floor(s / 2);
      if (z.z.raserei && !spec.magisch) s = Math.floor(s / 2);
      if (z.seite === "gegner" && GEGNER[z.art].anfaellig === "wucht" && spec.wucht) s = Math.floor(s * 1.5);
      erg.schaden = s;
      st.log.push({ t: `${a.name}: ${spec.name} – W20 ${w}${vtext} + ${spec.bonus} = ${total} gegen RK ${rk}: ${krit ? "kritischer Treffer" : "Treffer"}, ${s} Schaden.${spec.zusatzText || ""}`, art: a.seite === "gegner" ? "gegner" : "wurf", wurf: w });
      schaden(st, z, s, { krit });
      if (spec.nachTreffer) spec.nachTreffer(erg);
      if (a.seite === "spieler" && st.zug) st.zug.getroffen.push(z.id);
    } else {
      st.log.push({ t: `${a.name}: ${spec.name} – W20 ${w}${vtext} + ${spec.bonus} = ${total} gegen RK ${rk}: verfehlt.`, art: a.seite === "gegner" ? "gegner" : "wurf", wurf: w });
      // Parade der Duellantin
      if (spec.nah && istFig(z, "duellant") && a.seite === "gegner" && lebt(z) && z.reaktion > 0) {
        z.reaktion--; st.log.push({ t: `${z.name} pariert und sticht zurück.` });
        spielerAngriff(st, z, findeAktion(z, "rapier").a, a, { reaktion: true });
      }
    }
    nachAngriff(st, a, z);
    return erg;
  }
  function nachAngriff(st, a, z) {
    delete a.z.versteckt; delete a.z.finte; delete a.z.stich;
    if (istFig(z, "schattenmagier")) z.trugbildWeg = true;
  }

  /** Angriff einer Spielerfigur mit einer Waffe oder einem Angriffszauber */
  function spielerAngriff(st, f, a, z, opt = {}) {
    let bonus = mod(f.werte[a.attr]) + UEBUNG + (a.bogen && istFig(f, "wildnislaeufer") && f.stufe >= 2 ? 1 : 0);
    const fest = a.ohneMod ? 0 : mod(f.werte[a.attr]);
    const extra = [];
    let krit = 20, zusatz = "";
    if (f.z.raserei && a.attr === "STR") extra.push("0W1+2");
    if (istFig(f, "berserker") && f.tp < f.tpMax / 2) extra.push(f.stufe >= 3 ? "0W1+2" : "0W1+1");
    if (f.z.finte) extra.push("1W6");
    if (f.z.gift) extra.push("1W6");
    if (z.z.mal_jaeger === f.id) extra.push(FD.FIGUREN[f.fid].malWuerfel || "1W6");
    if (z.z.brandmal === f.id) extra.push(f.stufe >= 3 ? "2W6" : "1W6");
    if (istFig(f, "assassine") && f.stufe >= 3 && z.tp < z.tpMax / 2) extra.push("1W6");
    if (istFig(f, "kopfgeldjaeger") && f.stufe >= 3 && z.z.mal_jaeger === f.id && z.tp < z.tpMax / 2 && !(f.genutzt.erlegen)) { extra.push("2W6"); f.genutzt.erlegen = 1; zusatz = " Erlegen!"; }
    if (istFig(f, "duellant") && f.stufe >= 3) krit = 19;
    if (istFig(f, "kopfgeldjaeger") && z.z.mal_jaeger === f.id) krit = 19;
    const giftAktiv = Boolean(f.z.gift);
    const spec = {
      name: a.name, bonus, schaden: a.schaden, fest, extra, krit, nah: abstand(f, z) <= 1, fern: Boolean(a.fern) || (a.wurfwaffe && abstand(f, z) > 1),
      magisch: Boolean(a.magisch), wucht: Boolean(a.wucht), ruecksichtslos: Boolean(a.ruecksichtslos), zusatzText: zusatz,
      hinterhalt: f.klasse === "schurke" ? (f.stufe >= 3 ? "2W6" : "1W6") : null,
      nachTreffer: () => {
        if (giftAktiv && lebt(z)) { z.z.vergiftet = 1; delete f.z.gift; }
        if (a.fesseln && lebt(z)) { const r = rettung(st, z, "STR", SG(f, "GES")); if (!r.erfolg) { z.z.festgehalten = { rest: 2, flucht: SG(f, "GES") }; st.log.push({ t: `${z.name} ist festgenagelt (Rettungswurf ${r.total}).` }); } }
        if (a.brennt && !blockiert(st, z.x, z.y)) st.brand.push({ x: z.x, y: z.y, bis: st.runde + 1 });
      },
    };
    if (a.ruecksichtslos) f.z.ruecksichtslos = true;
    const erg = angriffswurf(st, f, z, spec);
    if (a.bogen && st.zug && st.zug.figur === f.id) st.zug.leicht = 2;
    if (a.doppel && !opt.zweites) {
      const zweit = gegnerFiguren(st).find((o) => o !== z && lebt(o) && abstand(o, z) <= 1 && abstand(f, o) <= a.reichweite && sicht(st, f, o));
      if (zweit) spielerAngriff(st, f, Object.assign({}, a, { doppel: false }), zweit, { zweites: true });
    }
    if (a.id === "dolch" && st.zug && st.zug.figur === f.id) st.zug.dolch = true;
    return erg;
  }

  /* ---------- Ziele ---------- */
  function flaecheZiele(st, f, a, z) {
    const out = [];
    for (const g of st.figuren) {
      if (!lebt(g) || g.seite === f.seite) continue; // Zauberformung: Verbündete bleiben verschont
      if (a.form === "kreis") { if (abstand(g, z) <= a.groesse) out.push(g); continue; }
      const d = abstand(f, g); if (d < 1 || d > a.groesse) continue;
      const vx = z.x - f.x, vy = z.y - f.y, gx = g.x - f.x, gy = g.y - f.y;
      const cos = (vx * gx + vy * gy) / (Math.hypot(vx, vy) * Math.hypot(gx, gy) || 1);
      if (cos >= 0.7) out.push(g);
    }
    return out;
  }
  function ziele(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId); if (!h || st.ende) return [];
    const a = h.a, gegner = st.figuren.filter((o) => o.seite !== f.seite && lebt(o));
    const freunde = st.figuren.filter((o) => o.seite === f.seite && !o.tot && !(o.z && o.z.verbannt));
    const inReich = (o, r) => abstand(f, o) <= (r || 1) && (abstand(f, o) <= 1 || sicht(st, f, o));
    switch (a.art) {
      case "angriff": if (a.nachDolch && !st.zug.dolch) return []; return gegner.filter((o) => inReich(o, a.reichweite));
      case "rettungswurf": case "geschoss": case "albtraum": case "bannkreis": case "spott": case "analyse":
        return gegner.filter((o) => inReich(o, a.reichweite));
      case "kontrolle": return gegner.filter((o) => inReich(o, a.reichweite) && (!a.nurUntot || GEGNER[o.art].untot) && !(a.zustand === "netz" && o.z.festgehalten));
      case "flaeche": return gegner.filter((o) => inReich(o, a.reichweite));
      case "stoss": case "entwaffnen": return gegner.filter((o) => abstand(f, o) <= 1);
      case "mal": {
        const feld = a.mal === "jaeger" ? "mal_jaeger" : "brandmal";
        const laufend = gegner.some((o) => o.z[feld] === f.id);
        if (laufend) return [];
        return gegner.filter((o) => inReich(o, a.reichweite));
      }
      case "heilung": return freunde.filter((o) => o.tp < o.tpMax && inReich(o, a.reichweite));
      case "selbstheilung": case "trank": return f.tp < f.tpMax ? [f] : [];
      case "aufrichten": return freunde.filter((o) => o.tp <= 0 && o.art !== "wolf" && !o.tot && !(a.stabil && o.stabil) && abstand(f, o) <= a.reichweite);
      case "schild": return freunde.filter((o) => o.tp > 0 && !o.z.schild && inReich(o, a.reichweite));
      case "tausch": return freunde.filter((o) => o !== f && o.tp > 0 && abstand(f, o) <= a.reichweite);
      case "wolf": { const w = wolfVon(st, f); if (!w || !lebt(w)) return []; return gegner.filter((o) => abstand(w, o) <= 9); }
      case "verstecken": {
        if (f.z.versteckt) return [];
        if (gegner.some((o) => abstand(o, f) <= 1)) return [];
        const deck = imRauch(st, f.x, f.y) || [...st.karte.block].some((k) => { const [x, y] = k.split(",").map(Number); return abstand({ x, y }, f) <= 1; });
        return deck || istFig(f, "schattenlaeufer") ? [f] : [];
      }
      case "raserei": return f.z.raserei ? [] : [f];
      case "finte": return f.z.finte ? [] : [f];
      case "gift": return f.z.gift ? [] : [f];
      case "rueckzug": return f.z.rueckzug ? [] : [f];
      case "schattenschritt": return st.zug.schritt ? [] : [f];
      case "spiegelbilder": return f.z.spiegel ? [] : [f];
      case "segen": return !st.figuren.some((o) => o.z && o.z.segen === f.id && lebt(o)) && freunde.some((o) => o.tp > 0 && o.art !== "wolf" && !o.z.segen && abstand(f, o) <= 6) ? [f] : [];
      case "schutzkreis": return f.z.schutzkreis > st.runde ? [] : [f];
      case "vertreiben": return gegner.some((o) => GEGNER[o.art].untot && abstand(f, o) <= a.reichweite) ? [f] : [];
      case "bewahren": case "massenheil": return freunde.some((o) => o.tp < o.tpMax && abstand(f, o) <= a.reichweite) ? [f] : [];
      case "rauch": case "spurt": return [f];
      case "tatendrang": return !st.zug.aktion && !st.zug.tatendrang ? [f] : [];
      default: return [];
    }
  }
  /** Warum eine Aktion gerade nicht geht (oder null) */
  function grund(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId);
    if (!h || st.ende || f.seite !== "spieler") return "Nicht am Zug.";
    if (f.tp <= 0) return "Am Boden.";
    const a = h.a;
    if (h.typ === "aktion" && !st.zug.aktion) return "Aktion schon verbraucht.";
    if (h.typ === "bonus" && !st.zug.bonus) return f.z.zeitriss ? "Keine Bonusaktion (Zeitriss)." : "Bonusaktion schon verbraucht.";
    if (rest(f, a) <= 0 && !(a.art === "mal" && a.mal === "jaeger" && f.malFrei)) return "Schon aufgebraucht.";
    const p = brauchtPlatz(f, a);
    if (p && platzIndex(f, a.platz || 1) < 0) return "Kein Zauberplatz mehr.";
    if (!ziele(st, aktionId).length) return "Kein gültiges Ziel.";
    return null;
  }
  const verfuegbar = (st, aktionId) => grund(st, aktionId) === null;

  /* ---------- Handeln ---------- */
  function verbrauche(st, f, a, typ) {
    if (typ === "aktion") st.zug.aktion = false; else if (typ === "bonus") st.zug.bonus = false;
    if (a.id === "brandmal") {
      if ((f.genutzt.brandmal_frei || 0) < 1) f.genutzt.brandmal_frei = 1; else f.plaetze[platzIndex(f, 1)]--;
    } else if (a.platz) f.plaetze[platzIndex(f, a.platz)]--;
    if ((a.pro || a.id === "raserei") && !(a.art === "mal" && a.mal === "jaeger" && f.malFrei)) f.genutzt[a.id] = (f.genutzt[a.id] || 0) + 1;
  }
  function schieben(st, z, von, n) {
    const dx = Math.sign(z.x - von.x), dy = Math.sign(z.y - von.y);
    for (let i = 0; i < n; i++) { const nx = z.x + dx, ny = z.y + dy; if (blockiert(st, nx, ny) || belegt(st, nx, ny, z)) break; z.x = nx; z.y = ny; }
  }
  function setzeZustand(st, z, a, f) {
    const zu = a.zustand;
    if (zu === "netz") z.z.festgehalten = { netz: true, flucht: SG(f, a.attr) };
    else if (zu === "festgehalten") z.z.festgehalten = { rest: a.dauer };
    else if (zu === "veraengstigt") z.z.veraengstigt = { rest: a.dauer, von: f.id };
    else if (zu === "verbannt") { z.z.verbannt = a.dauer; }
    else z.z[zu] = a.dauer;
  }

  function handeln(st, aktionId, zielId) {
    const f = aktiv(st);
    const g = grund(st, aktionId); if (g) return { fehler: g };
    const { a, typ } = findeAktion(f, aktionId);
    const z = fig(st, zielId) || f;
    const zs = ziele(st, aktionId);
    if (!zs.includes(z) && !(zs.length === 1 && zs[0] === f)) return { fehler: "Kein gültiges Ziel." };
    const ziel = zs.includes(z) ? z : f;
    verbrauche(st, f, a, typ);
    const r = st.r;
    switch (a.art) {
      case "angriff": spielerAngriff(st, f, a, ziel); break;
      case "geschoss": {
        let sum = 0; const einzel = [];
        for (let i = 0; i < a.anzahl; i++) { const s = roll(r, a.schaden).total + a.plus; sum += s; einzel.push(s); }
        st.log.push({ t: `${f.name}: ${a.name} – drei Lichtpfeile treffen sicher (${einzel.join(" + ")}) = ${sum} Schaden.`, art: "wurf" });
        schaden(st, ziel, sum); break;
      }
      case "rettungswurf": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} widersteht (Rettungswurf ${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else {
          const s = roll(r, a.schaden).total + (a.plusAttr ? mod(f.werte[a.attr]) : 0);
          st.log.push({ t: `${f.name}: ${a.name} – Rettungswurf ${rw.total} gegen SG ${sg} misslingt, ${s} Schaden.`, art: "wurf" });
          schaden(st, ziel, s);
          if (a.zustand && lebt(ziel)) setzeZustand(st, ziel, a, f);
        }
        break;
      }
      case "kontrolle": {
        const sg = SG(f, a.attr), betroffen = a.radius ? flaecheZiele(st, f, { form: "kreis", groesse: a.radius }, ziel) : [ziel];
        for (const o of betroffen) {
          const rw = rettung(st, o, a.rettung, sg);
          if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${o.name} widersteht (${rw.total} gegen SG ${sg}).`, art: "wurf" });
          else { setzeZustand(st, o, a, f); st.log.push({ t: `${f.name}: ${a.name} – ${o.name} ist ${ZUSTAND_NAME[a.zustand === "netz" ? "festgehalten" : a.zustand]} (${rw.total} gegen SG ${sg}).`, art: "gut" }); }
        }
        break;
      }
      case "flaeche": {
        const sg = SG(f, a.attr), betroffen = flaecheZiele(st, f, a, ziel), teile = [];
        for (const o of betroffen) {
          const rw = rettung(st, o, a.rettung, sg); let s = roll(r, a.schaden).total; if (rw.erfolg && a.halb) s = Math.floor(s / 2);
          teile.push(`${o.name} ${s}${rw.erfolg ? " (halb)" : ""}`);
          schaden(st, o, s);
          if (!rw.erfolg && lebt(o)) { if (a.zustand) setzeZustand(st, o, a, f); if (a.stoss) schieben(st, o, f, a.stoss); }
        }
        st.log.push({ t: `${f.name}: ${a.name} – ${teile.join(", ") || "niemand getroffen"}.`, art: "wurf" });
        break;
      }
      case "albtraum": {
        const sg = SG(f, a.attr), zweit = gegnerFiguren(st).filter((o) => o !== ziel && lebt(o) && abstand(f, o) <= a.reichweite && sicht(st, f, o)).sort((x, y) => abstand(ziel, x) - abstand(ziel, y))[0];
        for (const o of [ziel, zweit].filter(Boolean)) {
          const rw = rettung(st, o, a.rettung, sg), s = rw.erfolg ? roll(r, "1W8").total : roll(r, a.schaden).total;
          st.log.push({ t: `${f.name}: Albtraum – ${o.name} ${rw.erfolg ? "widersteht halb" : "schreit auf"}, ${s} Schaden.`, art: "wurf" });
          schaden(st, o, s); if (!rw.erfolg && lebt(o)) o.z.veraengstigt = { rest: 1, von: f.id };
        }
        break;
      }
      case "stoss": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} hält stand (${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else { schieben(st, ziel, f, 1); ziel.z.liegend = true; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} fliegt zurück und liegt am Boden.`, art: "gut" }); }
        break;
      }
      case "entwaffnen": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} hält fest (${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else { ziel.z.entwaffnet = 2; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} verliert den Halt und macht 2 Runden nur halben Schaden.`, art: "gut" }); }
        break;
      }
      case "spott": ziel.z.spott = f.id; st.log.push({ t: `${f.name} verspottet ${ziel.name}.` }); break;
      case "analyse": ziel.z.analyse = st.runde; st.log.push({ t: `${f.name} analysiert ${ziel.name}: RK ${ziel.rk - 2} bis Rundenende, ${ziel.tp}/${ziel.tpMax} TP.` }); break;
      case "mal": {
        if (a.mal === "jaeger") { ziel.z.mal_jaeger = f.id; f.malZiel = ziel.id; f.malFrei = false; st.log.push({ t: `${f.name} markiert ${ziel.name} (Jägermal).` }); }
        else { ziel.z.brandmal = f.id; st.log.push({ t: `${f.name} brennt ${ziel.name} ein Mal ein (Brandmal).` }); }
        break;
      }
      case "heilung": {
        let n = roll(r, a.heilung).total + mod(f.werte[a.plusAttr || "WEI"]);
        if (istFig(f, "wanderheiler")) n += 2 + (a.platz || 1);
        heilen(st, ziel, n, `${f.name}: ${a.name}`); break;
      }
      case "selbstheilung": heilen(st, f, roll(r, a.heilung).total + (a.plusStufe ? f.stufe : 0), `${f.name}: ${a.name}`); break;
      case "trank": f.rucksack.find((d) => d.id === "heiltrank").n -= 1; heilen(st, f, roll(r, a.heilung).total, `${f.name}: Heiltrank`); break;
      case "aufrichten": {
        if (a.stabil && st.schwierigkeit === "hardcore") { ziel.stabil = true; st.log.push({ t: `${f.name} stabilisiert ${ziel.name}. Die Todeswürfe hören auf.`, art: "gut" }); }
        else { ziel.tp = 1; ziel.todes = { e: 0, f: 0 }; ziel.stabil = false; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} steht mit 1 TP wieder auf.`, art: "gut" }); }
        break;
      }
      case "schild": ziel.z.schild = true; st.log.push({ t: `${f.name}: Schild des Glaubens auf ${ziel.name} (+2 RK).`, art: "gut" }); break;
      case "tausch": { const x = f.x, y = f.y; f.x = ziel.x; f.y = ziel.y; ziel.x = x; ziel.y = y; st.log.push({ t: `${f.name} tauscht den Platz mit ${ziel.name}.` }); break; }
      case "wolf": wolfBeisst(st, f, ziel, Boolean(a.umreissen)); break;
      case "verstecken": f.z.versteckt = true; st.log.push({ t: `${f.name} verschwindet im Schatten.` }); break;
      case "raserei": f.z.raserei = true; st.log.push({ t: `${f.name} gerät in Raserei!`, art: "gut" }); break;
      case "finte": f.z.finte = true; st.log.push({ t: `${f.name} täuscht einen Angriff an.` }); break;
      case "gift": f.z.gift = true; st.log.push({ t: `${f.name} bestreicht die Klinge mit Gift.` }); break;
      case "rueckzug": f.z.rueckzug = true; st.log.push({ t: `${f.name} zieht sich geschickt zurück.` }); break;
      case "spurt": st.zug.bewegung += 6; st.log.push({ t: `${f.name} spurtet.` }); break;
      case "schattenschritt": st.zug.schritt = 6; st.log.push({ t: `${f.name} tritt in die Schatten.` }); break;
      case "spiegelbilder": f.z.spiegel = 3; st.log.push({ t: `${f.name} teilt sich in drei Spiegelbilder.`, art: "gut" }); break;
      case "segen": {
        const zs2 = spielerFiguren(st).filter((o) => o.tp > 0 && !o.z.segen && abstand(f, o) <= 6).sort((x, y) => abstand(f, x) - abstand(f, y)).slice(0, 3);
        zs2.forEach((o) => { o.z.segen = f.id; });
        st.log.push({ t: `${f.name} segnet ${zs2.map((o) => o.name).join(", ")}.`, art: "gut" }); break;
      }
      case "schutzkreis": f.z.schutzkreis = st.runde + a.dauer; st.log.push({ t: `${f.name} zieht einen Schutzkreis: Verbündete in 2 Feldern +2 RK.`, art: "gut" }); break;
      case "vertreiben": {
        const sg = SG(f, a.attr);
        for (const o of gegnerFiguren(st).filter((o) => lebt(o) && GEGNER[o.art].untot && abstand(f, o) <= a.reichweite)) {
          const rw = rettung(st, o, "WEI", sg);
          if (!rw.erfolg) o.z.veraengstigt = { rest: 2, von: f.id };
          st.log.push({ t: `${f.name}: Untote vertreiben – ${o.name} ${rw.erfolg ? "widersteht" : "flieht"}.`, art: "wurf" });
        }
        break;
      }
      case "bewahren": {
        let topf = 5 * f.stufe;
        while (topf > 0) {
          const o = spielerFiguren(st).concat(st.figuren.filter((x) => x.art === "wolf")).filter((x) => !x.tot && x.tp < x.tpMax && abstand(f, x) <= a.reichweite).sort((x, y) => x.tp / x.tpMax - y.tp / y.tpMax)[0];
          if (!o) break;
          const n = Math.min(topf, Math.max(1, Math.ceil((o.tpMax - o.tp) / 2))); topf -= n; heilen(st, o, n, `${f.name}: Bewahren`);
        }
        break;
      }
      case "massenheil": {
        const zs3 = st.figuren.filter((o) => o.seite === "spieler" && !o.tot && o.tp < o.tpMax && abstand(f, o) <= a.reichweite).sort((x, y) => x.tp / x.tpMax - y.tp / y.tpMax).slice(0, 3);
        for (const o of zs3) heilen(st, o, roll(r, a.heilung).total + mod(f.werte.WEI) + 2 + 2, `${f.name}: Massenheilwort`);
        break;
      }
      case "bannkreis": st.zonen.push({ art: "bann", x: ziel.x, y: ziel.y, radius: a.radius, bis: st.runde + a.dauer }); st.log.push({ t: `${f.name} zieht einen Bannkreis um ${ziel.name}: Gegner darin −2 RK.`, art: "gut" }); break;
      case "rauch": st.zonen.push({ art: "rauch", x: f.x, y: f.y, radius: a.radius, bis: st.runde + a.dauer }); st.log.push({ t: `${f.name} wirft eine Rauchbombe.` }); break;
      case "tatendrang": st.zug.aktion = true; st.zug.tatendrang = true; st.log.push({ t: `${f.name}: Tatendrang – noch eine Aktion!`, art: "gut" }); break;
      default: return { fehler: "Unbekannte Fähigkeit." };
    }
    pruefeEnde(st);
    return { ok: true };
  }

  /** Grau läuft zum Ziel und beißt */
  function wolfBeisst(st, f, z, umreissen) {
    const w = wolfVon(st, f); if (!w || !lebt(w) || !lebt(z)) return;
    if (abstand(w, z) > 1) {
      const m = erreichbar(st, w, FD.FIGUREN[f.fid].wolf.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const d = abstand({ x, y }, z); if (!best || d < best.d || (d === best.d && c < best.c)) best = { x, y, d, c }; }
      if (best) { w.x = best.x; w.y = best.y; }
    }
    if (abstand(w, z) > 1) { st.log.push({ t: `${w.name} kommt nicht an ${z.name} heran.` }); return; }
    const wd = FD.FIGUREN[f.fid].wolf, extra = [];
    if (f.stufe >= 3 && z.z.mal_jaeger === f.id) extra.push("1W6");
    if (st.zug) st.zug.wolfBiss = true;
    angriffswurf(st, w, z, {
      name: umreissen ? "Biss (Umreißen)" : "Biss", bonus: wd.angriff[f.stufe - 1], schaden: wd.schaden, fest: wd.plus, extra, nah: true,
      nachTreffer: () => { if (umreissen && lebt(z)) { const rw = rettung(st, z, "STR", 12); if (!rw.erfolg) { z.z.liegend = true; st.log.push({ t: `${z.name} wird umgerissen.` }); } } },
    });
  }

  /* ---------- Bewegung ---------- */
  function bewegen(st, x, y) {
    const f = aktiv(st);
    if (st.ende || f.seite !== "spieler" || f.tp <= 0) return { fehler: "Nicht am Zug." };
    const m = bewegungsfelder(st, f), k = key(x, y);
    if (!m.has(k) || (x === f.x && y === f.y)) return { fehler: "Dorthin kommt " + f.name + " nicht." };
    const c = m.get(k), schritt = c === "schritt";
    // Gelegenheitsangriffe
    if (!schritt && !f.z.rueckzug && !(st.zug.leicht >= c)) {
      for (const g of gegnerFiguren(st)) {
        if (!lebt(g) || g.reaktion <= 0 || g.z.veraengstigt || g.z.festgehalten || !GEGNER[g.art].angriff) continue;
        if (abstand(g, f) <= 1 && abstand(g, { x, y }) > 1) { g.reaktion--; st.log.push({ t: `${g.name} nutzt die Lücke (Gelegenheitsangriff).`, art: "gegner" }); gegnerAngriff(st, g, f); if (f.tp <= 0) return { ok: true, gefallen: true }; }
      }
    }
    if (schritt) { st.zug.schritt = 0; } else { st.zug.bewegung -= c; st.zug.leicht = Math.max(0, (st.zug.leicht || 0) - c); }
    f.x = x; f.y = y;
    brandFeld(st, f);
    return { ok: true };
  }
  function brandFeld(st, f) {
    if (st.brand.some((b) => b.x === f.x && b.y === f.y) && lebt(f)) { const s = W(st.r, 4); st.log.push({ t: `${f.name} tritt in die Glut: ${s} Schaden.` }); schaden(st, f, s); }
  }

  /* ---------- Zugwechsel ---------- */
  function beginneZug(st) {
    for (let schutz = 0; schutz < 40; schutz++) {
      const f = aktiv(st);
      if (f.seite === "gegner") {
        if (f.tp <= 0) { weiter(st, true); continue; }
        if (f.z.verbannt) { f.z.verbannt--; if (!f.z.verbannt) { delete f.z.verbannt; st.log.push({ t: `${f.name} kehrt aus der Verbannung zurück.` }); } else st.log.push({ t: `${f.name} ist noch verbannt.` }); weiter(st, true); continue; }
      } else {
        if (f.tot) { weiter(st, true); continue; }
        if (f.tp <= 0) {
          if (st.schwierigkeit === "hardcore" && !f.stabil) {
            const w = W(st.r, 20);
            if (w === 20) { f.tp = 1; f.todes = { e: 0, f: 0 }; st.log.push({ t: `${f.name}: Todeswurf 20 – steht mit 1 TP wieder auf!`, art: "gut", wurf: w }); }
            else {
              if (w >= 10) f.todes.e++; else f.todes.f += w === 1 ? 2 : 1;
              st.log.push({ t: `${f.name}: Todeswurf ${w} – ${w >= 10 ? "Erfolg" : "Fehlschlag"} (${f.todes.e} ✓ / ${f.todes.f} ✗).`, art: w >= 10 ? "gut" : "schlecht", wurf: w });
              if (f.todes.f >= 3) { stirbt(st, f); pruefeEnde(st); }
              else if (f.todes.e >= 3) { f.stabil = true; st.log.push({ t: `${f.name} ist stabil, bleibt aber bewusstlos.` }); }
              weiter(st, true); continue;
            }
          } else { weiter(st, true); continue; }
        }
      }
      break;
    }
    const f = aktiv(st);
    f.gehandelt = true;
    f.reaktion = istFig(f, "schildwaechter") && f.stufe >= 3 ? 2 : 1;
    delete f.z.ruecksichtslos;
    let bew = f.seite === "gegner" ? (GEGNER[f.art].bewegung != null ? GEGNER[f.art].bewegung : 6) : 6;
    if (f.z.verlangsamt || f.z.zeitriss) bew = Math.floor(bew / 2);
    st.zug = { figur: f.id, bewegung: bew, aktion: true, bonus: !f.z.zeitriss, hinterhalt: false, tatendrang: false, leicht: 0, schritt: 0, dolch: false, getroffen: [], wolfBiss: false };
    if (f.z.festgehalten) {
      const fg = f.z.festgehalten;
      if (fg.flucht && !fg.netz) { const rw = rettung(st, f, "STR", fg.flucht); if (rw.erfolg) { delete f.z.festgehalten; st.log.push({ t: `${f.name} reißt sich los.` }); } }
      if (f.z.festgehalten) st.zug.bewegung = 0;
    }
    if (f.z.liegend && f.tp > 0 && st.zug.bewegung >= 3) { st.zug.bewegung -= 3; delete f.z.liegend; }
    // Strahlende Aura gegen Untote
    if (f.seite === "gegner" && GEGNER[f.art].untot) for (const l of st.figuren) if (istFig(l, "lichtbringer") && lebt(l) && abstand(l, f) <= 1) { st.log.push({ t: `${l.name}s Aura sengt ${f.name}: 2 Schaden.` }); schaden(st, f, 2); }
    if (lebt(f)) brandFeld(st, f);
    if (st.ende) return;
    if (!lebt(f)) weiter(st);
  }
  function tick(f) {
    const z = f.z;
    for (const k of ["verlangsamt", "geblendet", "vergiftet", "entwaffnet", "zeitriss", "stich"]) if (z[k]) { z[k]--; if (z[k] <= 0) delete z[k]; }
    if (z.veraengstigt) { z.veraengstigt.rest--; if (z.veraengstigt.rest <= 0) delete z.veraengstigt; }
    if (z.festgehalten && z.festgehalten.rest != null) { z.festgehalten.rest--; if (z.festgehalten.rest <= 0) delete z.festgehalten; }
    delete z.spott; delete z.rueckzug;
  }
  function weiter(st, still) {
    const f = aktiv(st); if (f && !still) tick(f);
    st.am++;
    if (st.am >= st.reihe.length) {
      st.am = 0; st.runde++;
      st.zonen = st.zonen.filter((z) => z.bis > st.runde);
      st.brand = st.brand.filter((b) => b.bis > st.runde);
      for (const g of st.figuren) if (g.seite === "gegner" && g.atemRunde && st.runde - g.atemRunde >= GEGNER[g.art].atem.alle) g.atemBereit = true;
      st.log.push({ t: `— Runde ${st.runde} —`, art: "runde" });
    }
    if (!st.ende) beginneZug(st);
  }
  function zugEnde(st) {
    if (st.ende) return;
    const f = aktiv(st);
    // Eingespielt: Grau beißt ohne Befehl
    if (istFig(f, "tiergefaehrte") && f.stufe >= 2 && !st.zug.wolfBiss) {
      const w = wolfVon(st, f);
      const z = w && lebt(w) && gegnerFiguren(st).find((o) => lebt(o) && abstand(w, o) <= 1 && st.zug.getroffen.includes(o.id));
      if (z) wolfBeisst(st, f, z, false);
    }
    if (st.ende) return;
    weiter(st);
  }

  /* ---------- Gegner ---------- */
  function gegnerAngriff(st, g, z) {
    const d = GEGNER[g.art];
    const metallVorher = z.rk;
    return angriffswurf(st, g, z, {
      name: d.angriff.name, bonus: d.angriff.bonus, schaden: d.angriff.schaden.replace(/[+-]\d+$/, ""), fest: parse(d.angriff.schaden).b, nah: true,
      nachTreffer: () => { if (d.rost && z.metall && z.rk > z.rkBasis - 2 && metallVorher === z.rk) { z.rk -= 1; st.log.push({ t: `Die Rüstung von ${z.name} rostet: RK ${z.rk}.` }); } },
    });
  }
  function zieleFuerGegner(st, g) {
    const alle = st.figuren.filter((f) => f.seite === "spieler" && lebt(f));
    const sichtbar = alle.filter((f) => !f.z.versteckt);
    return sichtbar.length ? sichtbar : alle;
  }
  function gegnerZug(st) {
    const g = aktiv(st);
    if (!g || g.seite !== "gegner" || st.ende) return;
    const d = GEGNER[g.art];
    let lebende = zieleFuerGegner(st, g);
    if (!lebende.length || g.tp <= 0) { weiter(st); return; }
    const naechste = () => lebende.slice().sort((a, b) => (g.z.spott === b.id) - (g.z.spott === a.id) || abstand(g, a) - abstand(g, b) || a.tp - b.tp)[0];
    const startX = g.x, startY = g.y;
    const flieheVon = (quelle) => {
      const m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k] of m) { const [x, y] = k.split(",").map(Number); const dd = Math.min(...lebende.map((f) => abstand({ x, y }, f))); if (!best || dd > best.d) best = { x, y, d: dd }; }
      if (best) { g.x = best.x; g.y = best.y; }
    };
    // Verängstigt: weg, kein Angriff
    if (g.z.veraengstigt) { flieheVon(); st.log.push({ t: `${g.name} weicht ängstlich zurück.`, art: "gegner" }); fangschuss(st, g, startX, startY); if (!st.ende) weiter(st); return; }
    // Im Netz: befreien
    if (g.z.festgehalten && g.z.festgehalten.netz) {
      const w = W(st.r, 20) + mod(g.werte.STR);
      if (w >= g.z.festgehalten.flucht) { delete g.z.festgehalten; st.log.push({ t: `${g.name} reißt das Netz auf.`, art: "gegner" }); }
      else st.log.push({ t: `${g.name} zerrt am Netz (${w}).`, art: "gegner" });
      weiter(st); return;
    }
    // Kobold flieht bei wenig TP
    if (d.flieht && g.tp < d.flieht) { flieheVon(); st.log.push({ t: `${g.name} flieht.`, art: "gegner" }); fangschuss(st, g, startX, startY); if (!st.ende) weiter(st); return; }
    // Pilzbrut: Sporen auf alle Nachbarn
    if (d.sporen) {
      const nach = lebende.filter((f) => abstand(g, f) <= 1);
      for (const f of nach) {
        const rw = rettung(st, f, "KON", d.sporen.sg);
        if (rw.erfolg) st.log.push({ t: `${g.name}: Sporen – ${f.name} hält die Luft an.`, art: "gegner" });
        else { const s = roll(st.r, d.sporen.schaden).total; f.z.vergiftet = 1; st.log.push({ t: `${g.name}: Sporen – ${f.name} hustet, ${s} Schaden, vergiftet.`, art: "gegner" }); schaden(st, f, s); }
      }
      if (!st.ende) weiter(st); return;
    }
    let ziel = naechste();
    // Aschehund: Glutatem
    if (d.atem && g.atemBereit && abstand(g, ziel) <= 3) {
      const betroffen = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && abstand(g, f) <= 3 && abstand(g, f) >= 1 && (() => { const vx = ziel.x - g.x, vy = ziel.y - g.y, fx = f.x - g.x, fy = f.y - g.y; return (vx * fx + vy * fy) / (Math.hypot(vx, vy) * Math.hypot(fx, fy) || 1) >= 0.7; })());
      const teile = [];
      for (const f of betroffen) { const rw = rettung(st, f, "GES", d.atem.sg); let s = roll(st.r, d.atem.schaden).total; if (rw.erfolg) s = Math.floor(s / 2); teile.push(`${f.name} ${s}`); schaden(st, f, s); }
      g.atemBereit = false; g.atemRunde = st.runde;
      st.log.push({ t: `${g.name}: Glutatem – ${teile.join(", ")}.`, art: "gegner" });
      if (!st.ende) weiter(st); return;
    }
    // Netzweber: Netz auf Entfernung
    if (d.netz && !g.netzGenutzt && abstand(g, ziel) > 1 && abstand(g, ziel) <= d.netz.reichweite && sicht(st, g, ziel)) {
      g.netzGenutzt = true;
      const erg = angriffswurf(st, g, ziel, { name: "Netz", bonus: d.netz.bonus, schaden: "0W1", fest: 0, nah: false, nachTreffer: () => { ziel.z.festgehalten = { netz: true, flucht: d.netz.sg }; st.log.push({ t: `${ziel.name} hängt im Netz.`, art: "gegner" }); } });
      if (erg && !st.ende) weiter(st); return;
    }
    // Bewegen und angreifen
    if (abstand(g, ziel) > 1 && st.zug.bewegung > 0) {
      const m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const dist = Math.min(...lebende.map((f) => abstand({ x, y }, f) + (g.z.spott === f.id ? -1 : 0))); if (!best || dist < best.dist || (dist === best.dist && c < best.c)) best = { x, y, dist, c }; }
      if (best) { g.x = best.x; g.y = best.y; brandFeld(st, g); }
      if (!lebt(g)) { if (!st.ende) weiter(st); return; }
      lebende = zieleFuerGegner(st, g); ziel = naechste();
      fangschuss(st, g, startX, startY);
      if (!lebt(g) || st.ende) { if (!st.ende) weiter(st); return; }
    }
    if (ziel && abstand(g, ziel) <= 1 && d.angriff) gegnerAngriff(st, g, ziel);
    if (!st.ende) weiter(st);
  }
  /** Fangschuss: bewegt sich das markierte Ziel des Kopfgeldjägers, schießt er einmal */
  function fangschuss(st, g, sx, sy) {
    if (g.x === sx && g.y === sy) return;
    const k = st.figuren.find((o) => istFig(o, "kopfgeldjaeger") && lebt(o) && o.reaktion > 0 && g.z.mal_jaeger === o.id && abstand(o, g) <= 16 && sicht(st, o, g));
    if (!k || !lebt(g)) return;
    k.reaktion--; st.log.push({ t: `${k.name} schießt ${g.name} hinterher (Fangschuss).` });
    spielerAngriff(st, k, findeAktion(k, "armbrust").a, g, { reaktion: true });
  }

  /* ---------- Steuerung ohne Spieler (Tests, „Tisch steuert“) ---------- */
  function erwarteterSchaden(st, f, a, z) {
    if (a.art === "angriff") {
      const bonus = mod(f.werte[a.attr]) + UEBUNG, v = vorteil(st, f, z, { fern: a.fern, ruecksichtslos: a.ruecksichtslos }).v;
      let p = Math.max(0.05, Math.min(0.95, (21 - (rkEff(st, z, f, { fern: a.fern }) - bonus)) / 20));
      if (v > 0) p = 1 - (1 - p) ** 2; if (v < 0) p = p * p;
      let dmg = mittel(a.schaden) + (a.ohneMod ? 0 : mod(f.werte[a.attr]));
      if (z.z.mal_jaeger === f.id) dmg += 3; if (z.z.brandmal === f.id) dmg += 3.5; if (f.klasse === "schurke" && !st.zug.hinterhalt) dmg += 3.5 * p;
      if (a.doppel) dmg *= 1.5;
      return p * dmg;
    }
    if (a.art === "geschoss") return 10.5;
    const pf = (attr) => Math.max(0.05, Math.min(0.95, (SG(f, a.attr || attr) - 1 - mod(z.werte[a.rettung || attr])) / 20));
    if (a.art === "rettungswurf") return pf() * (mittel(a.schaden) + (a.plusAttr ? mod(f.werte[a.attr]) : 0));
    if (a.art === "flaeche") { const b = flaecheZiele(st, f, a, z); return b.reduce((s, o) => s + Math.min(o.tp, mittel(a.schaden) * (pf() + (1 - pf()) / 2)), 0); }
    if (a.art === "albtraum") return 2 * pf() * 9;
    return 0;
  }
  const bedrohung = (g) => (GEGNER[g.art].angriff ? mittel(GEGNER[g.art].angriff.schaden) : 4);
  function wertAktion(st, f, a, z) {
    const slot = (brauchtPlatz(f, a) ? (a.platz === 2 ? 5 : 3) : 0) * st.sparen, begrenzt = (a.pro ? 1.5 : 0) * st.sparen;
    switch (a.art) {
      case "angriff": case "geschoss": case "rettungswurf": case "flaeche": case "albtraum": {
        let v = erwarteterSchaden(st, f, a, z);
        if (v >= z.tp) v += 4;
        if (a.fesseln) v += 2; if (a.zustand && a.art === "rettungswurf") v += 1;
        return v - slot - begrenzt;
      }
      case "kontrolle": {
        if (z.tp < 8) return -1;
        const pfail = Math.max(0.05, Math.min(0.95, (SG(f, a.attr) - 1 - mod(z.werte[a.rettung])) / 20));
        const runden = a.zustand === "netz" ? 2 : a.dauer || 1;
        const wirkung = a.zustand === "geblendet" ? 0.6 : a.zustand === "festgehalten" || a.zustand === "netz" ? 0.6 : a.zustand === "zeitriss" ? 0.6 : 1;
        const betroffen = a.radius ? flaecheZiele(st, f, { form: "kreis", groesse: a.radius }, z).filter((o) => o.tp >= 6) : [z];
        return betroffen.reduce((s, o) => s + pfail * bedrohung(o) * runden * wirkung * 0.9, 0) + (a.zustand === "verbannt" ? 4 : 0) - slot - begrenzt;
      }
      case "stoss": case "entwaffnen": return z.tp > 8 ? 3.5 - begrenzt : -1;
      case "heilung": return z.tp <= 0 ? 15 : z.tp < z.tpMax * 0.45 ? Math.min(z.tpMax - z.tp, 7) - slot * 0.5 : -1;
      case "aufrichten": return 15;
      case "segen": { const n = spielerFiguren(st).filter((o) => o.tp > 0 && !o.z.segen && abstand(f, o) <= 6).slice(0, 3).length; return n >= 2 ? n * 2.4 * Math.max(1, 4 - st.runde) / 2 - slot : -1; }
      case "schutzkreis": return spielerFiguren(st).filter((o) => o.tp > 0 && abstand(o, f) <= 2).length * 2.5 - slot;
      case "spiegelbilder": return f.tp < f.tpMax && gegnerFiguren(st).some((g) => lebt(g) && abstand(g, f) <= 7) ? 6 - slot : -1;
      case "vertreiben": return gegnerFiguren(st).filter((o) => lebt(o) && GEGNER[o.art].untot && abstand(o, f) <= 6).length * 5 - begrenzt;
      case "bewahren": return spielerFiguren(st).some((o) => o.tp < o.tpMax * 0.5) ? 5 * f.stufe * 0.8 - begrenzt : -1;
      case "bannkreis": return gegnerFiguren(st).filter((o) => lebt(o) && abstand(o, z) <= 2).length * 3 - slot;
      case "rauch": return -1;
      default: return -1;
    }
  }
  function besteAktion(st, f, typ) {
    let best = null;
    for (const a of aktionenVon(f, st)) {
      if ((a.typ || "aktion") !== typ || !verfuegbar(st, a.id)) continue;
      for (const z of ziele(st, a.id)) { const v = wertAktion(st, f, a, z); if (v > 0.3 && (!best || v > best.v)) best = { a, z, v }; }
    }
    return best;
  }
  function versuche(st, id, z) { if (verfuegbar(st, id)) { const zs = ziele(st, id); const t = z && zs.includes(z) ? z : zs[0]; if (t) handeln(st, id, t.id); return true; } return false; }
  function autoZug(st) {
    const f = aktiv(st); if (!f || f.seite !== "spieler" || st.ende) return;
    const gegner = () => gegnerFiguren(st).filter(lebt);
    const freundeAmBoden = () => spielerFiguren(st).filter((o) => o.tp <= 0 && !o.tot && !(st.schwierigkeit === "hardcore" && o.stabil));
    const kann = (id) => verfuegbar(st, id);
    const eigeneAkt = aktionenVon(f, st);
    const nahAngriff = eigeneAkt.find((a) => a.art === "angriff" && a.reichweite === 1 && !a.ruecksichtslos);
    const fernAngriff = eigeneAkt.find((a) => (a.art === "angriff" && a.reichweite > 1 && !a.nachDolch && !a.fesseln && !a.doppel) || (a.art === "rettungswurf" && !a.platz));
    // 1. Notfall-Heilung als Bonusaktion
    for (const id of ["heilendes_wort", "massenheilwort"]) { const zs = kann(id) ? ziele(st, id) : []; const z = zs.find((o) => o.tp <= 0) || zs.find((o) => o.tp < o.tpMax * 0.35); if (z) handeln(st, id, z.id); }
    if (f.tp < f.tpMax * 0.4) { if (!versuche(st, "zweiter_atem")) versuche(st, "heiltrank"); }
    if (st.ende) return;
    // Ziel wählen: angeschlagen und nah
    const zielWahl = () => gegner().sort((a, b) => (a.tp / a.tpMax + abstand(f, a) * 0.08) - (b.tp / b.tpMax + abstand(f, b) * 0.08))[0];
    let ziel = zielWahl(); if (!ziel) return zugEnde(st);
    if (kann("raserei") && gegner().some((g) => abstand(g, f) <= 8)) handeln(st, "raserei", f.id);
    // 2. Bewegen
    const nah = Boolean(nahAngriff) && (!fernAngriff || ["krieger"].includes(f.klasse) || ["inquisitor", "assassine", "schattenlaeufer", "tiergefaehrte"].includes(f.fid));
    const m = bewegungsfelder(st, f);
    const nebenGegner = (x, y) => gegner().some((g) => abstand(g, { x, y }) <= 1);
    if (nah) {
      // zum besten erreichbaren Gegner
      let best = null;
      for (const g of gegner()) for (const [k, c] of m) {
        const [x, y] = k.split(",").map(Number); if (abstand({ x, y }, g) > 1) continue;
        const wert = g.tp / g.tpMax + (c === "schritt" ? 0.2 : c * 0.02) + (spielerFiguren(st).some((o) => o !== f && lebt(o) && abstand(o, g) <= 1) ? -0.15 : 0);
        if (!best || wert < best.wert) best = { x, y, g, wert };
      }
      if (best) { if (!(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y); ziel = best.g; }
      else if (abstand(f, ziel) > 1) {
        // nicht erreichbar: so nah wie möglich, ggf. Fernkampf
        let näher = null; for (const [k, c] of m) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = abstand({ x, y }, ziel); if (!näher || d < näher.d) näher = { x, y, d }; }
        if (näher && !(näher.x === f.x && näher.y === f.y)) bewegen(st, näher.x, näher.y);
      }
    } else {
      const fernR = fernAngriff ? fernAngriff.reichweite : 12;
      const gut = (x, y) => !nebenGegner(x, y) && gegner().some((g) => abstand(g, { x, y }) <= fernR && sicht(st, { x, y }, g));
      if (!gut(f.x, f.y) || nebenGegner(f.x, f.y)) {
        if (nebenGegner(f.x, f.y)) versuche(st, "rueckzug") || versuche(st, "schattenschritt");
        const m2 = bewegungsfelder(st, f); let best = null;
        for (const [k, c] of m2) {
          const [x, y] = k.split(",").map(Number); if (!gut(x, y)) continue;
          const dmin = Math.min(...gegner().map((g) => abstand(g, { x, y })));
          const wert = (c === "schritt" ? 1 : c * 0.1) - Math.min(dmin, 4) * 0.5;
          if (!best || wert < best.wert) best = { x, y, wert };
        }
        const bleiben = nebenGegner(f.x, f.y) && nahAngriff && f.tp < f.tpMax * 0.5 && !f.z.rueckzug;
        if (best && !bleiben && !(nebenGegner(f.x, f.y) && istFig(f, "wildnislaeufer"))) bewegen(st, best.x, best.y);
        else if (!best && !nebenGegner(f.x, f.y)) {
          let näher = null; for (const [k, c] of m2) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = Math.min(...gegner().map((g) => abstand(g, { x, y }))); if (d >= 2 && (!näher || d < näher.d)) näher = { x, y, d }; }
          if (näher) bewegen(st, näher.x, näher.y);
        }
      }
    }
    if (st.ende || f.tp <= 0) { if (!st.ende) zugEnde(st); return; }
    // 3. Bonusaktionen vor dem Angriff
    ziel = gegner().filter((g) => abstand(f, g) <= 1).sort((a, b) => a.tp - b.tp)[0] || zielWahl();
    if (ziel) {
      if (kann("jaegermal")) versuche(st, "jaegermal", ziel);
      else if (kann("brandmal") && (f.genutzt.brandmal_frei || 0) < 1) versuche(st, "brandmal", ziel);
      if (kann("analyse")) versuche(st, "analyse", ziel);
      if (kann("finte") && abstand(f, ziel) <= 1 && ziel.tp > 6) versuche(st, "finte");
      if (kann("gift") && ziel.tp > 5) versuche(st, "gift");
      if (kann("trick") && abstand(f, ziel) <= 1 && ziel.tp > 6) versuche(st, "trick", ziel);
      if (kann("spott") && gegner().some((g) => abstand(g, f) <= 2 && g.tp > 6)) { const s = gegner().filter((g) => abstand(g, f) <= 6 && sicht(st, f, g)).sort((a, b) => abstand(a, f) - abstand(b, f))[0]; if (s) handeln(st, "spott", s.id); }
      if (kann("wolf_befehl") || kann("wolf_umreissen")) { const id = kann("wolf_umreissen") && ziel.tp > 8 ? "wolf_umreissen" : "wolf_befehl"; versuche(st, id, ziel); }
      if (kann("schild_glaube")) { const fr = ziele(st, "schild_glaube").sort((a, b) => b.rk - a.rk)[0]; if (fr && gegner().some((g) => abstand(g, fr) <= 3)) handeln(st, "schild_glaube", fr.id); }
    }
    // 4. Aktion: am Boden liegende Freunde zuerst
    const amBoden = freundeAmBoden();
    if (amBoden.length) { if (!versuche(st, "lebenshauch", amBoden.find((o) => abstand(o, f) <= 6))) versuche(st, "stabilisieren", amBoden.find((o) => abstand(o, f) <= 1)); }
    for (let runde = 0; runde < 2 && !st.ende; runde++) {
      if (st.zug.aktion) {
        const b = besteAktion(st, f, "aktion");
        if (b) handeln(st, b.a.id, b.z.id);
        else if (nah && !gegner().some((g) => abstand(g, f) <= 1) && kann("spurt_aktion")) {
          handeln(st, "spurt_aktion", f.id);
          const m3 = bewegungsfelder(st, f); let best = null;
          for (const [k, c] of m3) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = Math.min(...gegner().map((g) => abstand(g, { x, y }))); if (!best || d < best.d) best = { x, y, d }; }
          if (best && !(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y);
        }
      }
      if (!st.zug.aktion && kann("tatendrang") && gegner().some((g) => abstand(g, f) <= 1)) handeln(st, "tatendrang", f.id); else break;
    }
    if (st.ende) return;
    // 5. Bonusaktionen danach
    if (kann("zweiter_dolch")) { const z = ziele(st, "zweiter_dolch").sort((a, b) => a.tp - b.tp)[0]; if (z) handeln(st, "zweiter_dolch", z.id); }
    if (kann("wolf_befehl")) { const z = ziele(st, "wolf_befehl").sort((a, b) => a.tp - b.tp)[0]; if (z) handeln(st, "wolf_befehl", z.id); }
    if (f.tp < f.tpMax * 0.5) { if (!versuche(st, "zweiter_atem")) versuche(st, "heiltrank"); }
    for (const id of ["heilendes_wort", "massenheilwort"]) { const zs = kann(id) ? ziele(st, id) : []; const z = zs.find((o) => o.tp <= 0 || o.tp < o.tpMax * 0.4); if (z) handeln(st, id, z.id); }
    if (kann("aus_dem_schatten")) versuche(st, "aus_dem_schatten"); else if (kann("verstecken")) versuche(st, "verstecken");
    // 6. Fernkämpfer: nach dem Schuss leichtfüßig weg
    if (!nah && lebt(f) && nebenGegner(f.x, f.y) && (st.zug.leicht > 0 || f.z.rueckzug)) {
      const m4 = bewegungsfelder(st, f); let best = null;
      for (const [k, c] of m4) { if (c === "schritt" || c > Math.max(st.zug.leicht, f.z.rueckzug ? 99 : 0)) continue; const [x, y] = k.split(",").map(Number); if (!nebenGegner(x, y) && (!best || c < best.c)) best = { x, y, c }; }
      if (best) bewegen(st, best.x, best.y);
    }
    if (!st.ende) zugEnde(st);
  }

  /* ---------- Zwischen Kämpfen: Zustand mitnehmen, rasten ---------- */
  /** Zustand der Spielerfiguren nach einem Kampf (am Boden in Normal: 1 TP) */
  function nachKampf(st) {
    const out = {};
    for (const f of spielerFiguren(st)) out[f.fid] = { stufe: f.stufe, tp: f.tot ? 0 : Math.max(1, f.tp), tot: Boolean(f.tot), plaetze: f.plaetze.slice(), genutzt: Object.assign({}, f.genutzt), rucksack: JSON.parse(JSON.stringify(f.rucksack)) };
    return out;
  }
  /** Kurze Rast: halbe fehlende TP, „je Rast“ und „je Kampf“ kommen zurück */
  function kurzeRast(zust) {
    for (const fid of Object.keys(zust)) {
      const z = zust[fid]; if (z.tot) continue;
      const max = FD.tpVon(fid, z.stufe || 1);
      z.tp = Math.min(max, z.tp + Math.floor((max - z.tp) / 2));
      for (const a of FD.faehigVon(fid, 3)) if (a.pro && (a.pro.rast != null || a.pro.kampf != null)) delete z.genutzt[a.id];
      delete z.genutzt.glueckspilz; delete z.genutzt.gedankenstuetze; delete z.genutzt.erlegen; delete z.genutzt.brandmal_frei;
      if (z.genutzt.raserei) z.genutzt.raserei--;
    }
    return zust;
  }
  /** Zwischen zwei Kämpfen ohne Rast: nur „je Kampf“ kommt zurück */
  function neuerKampf(zust) {
    for (const fid of Object.keys(zust)) { const z = zust[fid]; for (const a of FD.faehigVon(fid, 3)) if (a.pro && a.pro.kampf != null) delete z.genutzt[a.id]; delete z.genutzt.glueckspilz; delete z.genutzt.erlegen; delete z.genutzt.brandmal_frei; }
    return zust;
  }

  /* ---------- Speichern und öffentliche Ansicht ---------- */
  function speichern(st) {
    const o = Object.assign({}, st); delete o.r;
    o.karte = { name: st.karte.name, b: st.karte.b, h: st.karte.h, hindernisse: st.karte.hindernisse, start: st.karte.start };
    return JSON.parse(JSON.stringify(o));
  }
  function laden(o) {
    const st = JSON.parse(JSON.stringify(o));
    st.karte.block = new Set(st.karte.hindernisse.map(([, x, y]) => key(x, y)));
    st.zonen = st.zonen || []; st.brand = st.brand || [];
    return zufall(st);
  }
  /** Was Handys sehen: Figuren, Zug, Möglichkeiten der aktiven Figur, letzte Einträge */
  function ansicht(st, nLog = 8) {
    const f = aktiv(st), optionen = [];
    if (!st.ende && f.seite === "spieler" && f.tp > 0) {
      for (const a of aktionenVon(f, st)) {
        const g = grund(st, a.id);
        optionen.push({ id: a.id, ok: !g, grund: g, rest: rest(f, a) === Infinity ? null : rest(f, a), ziele: g ? [] : ziele(st, a.id).map((z) => ({ id: z.id, name: z.name, tp: z.tp, tpMax: z.tpMax, seite: z.seite })) });
      }
    }
    return {
      runde: st.runde, ende: st.ende, aktiv: f.id, zug: st.zug, reihe: st.reihe, schwierigkeit: st.schwierigkeit, stufe: st.stufe,
      figuren: st.figuren.map((o) => ({ id: o.id, seite: o.seite, fid: o.fid || null, art: o.art || null, besitzer: o.besitzer || null, klasse: o.klasse || null, name: o.name, titel: o.titel || null, stufe: o.stufe || null,
        tp: o.tp, tpMax: o.tpMax, rk: o.rk, plaetze: o.plaetze || null, plaetzeMax: o.plaetzeMax || null, genutzt: o.genutzt, rucksack: o.rucksack || [], zustaende: zustaende(st, o), tot: Boolean(o.tot), stabil: Boolean(o.stabil), todes: o.todes || null })),
      optionen, log: st.log.slice(-nLog), nLog: st.log.length,
    };
  }

  const API = { nachKampf, kurzeRast, neuerKampf, rng, roll, parse, mittel, mod, SG, DINGE, TRANK, STABIL, SPURT, GEGNER, KARTE_GARTEN, FD, zufall, speichern, laden, ansicht, trankZahl,
    neuesSpiel, aktiv, fig, wolfVon, lebt, erreichbar, bewegungsfelder, sicht, deckung, abstand, bewegen, ziele, grund, verfuegbar, handeln, zugEnde, gegnerZug, autoZug,
    findeAktion, aktionenVon, faehigkeiten, flaecheZiele, rest, rkEff, vorteil, zustaende, key, spielerFiguren, gegnerFiguren };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABR = API;
})(typeof window !== "undefined" ? window : globalThis);
