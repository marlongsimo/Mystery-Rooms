/*
 * Case Unlocked · Abenteuer – Regeln (ohne Darstellung, testbar im Browser und in Node)
 * W20-Proben, Angriffe, Schaden, Bewegung auf dem Raster, Sichtlinie, Gegnerverhalten.
 * Alle Zahlen kommen aus KLASSEN und GEGNER, damit Balancing an einer Stelle passiert.
 */
(function (root) {
  "use strict";

  /* ---------- Zufall (mit Startwert, damit Tests wiederholbar sind) ---------- */
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const W = (r, n) => 1 + Math.floor(r() * n);
  /** „2W6+3“ → {n:2, s:6, b:3} */
  function parse(expr) { const m = /^(\d+)W(\d+)([+-]\d+)?$/.exec(expr); return { n: +m[1], s: +m[2], b: m[3] ? +m[3] : 0 }; }
  function roll(r, expr, crit = false) {
    const p = parse(expr), n = crit ? p.n * 2 : p.n, rolls = [];
    for (let i = 0; i < n; i++) rolls.push(W(r, p.s));
    return { total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + p.b), rolls, bonus: p.b };
  }
  const mod = (v) => Math.floor((v - 10) / 2);
  const UEBUNG = 2;

  /* ---------- Klassen (Stufe 1) ---------- */
  const KLASSEN = {
    schildwaechter: {
      name: "Schildwächter", klasse: "Krieger", farbe: "#c9a24a", zeichen: "schild",
      werte: { STR: 16, GES: 12, KON: 15, INT: 8, WEI: 10, CHA: 11 }, tp: 12, rk: 18, metall: true,
      rucksack: [["heiltrank", 1], ["seil", 1], ["fackel", 2]],
      aktionen: [
        { id: "langschwert", name: "Langschwert", art: "angriff", reichweite: 1, attr: "STR", schaden: "1W8+3", text: "Nahkampf gegen ein Ziel direkt neben dir." },
      ],
      bonus: [
        { id: "zweiter_atem", name: "Zweiter Atem", art: "selbstheilung", heilung: "1W10+1", proRast: 1, text: "Du holst tief Luft und heilst dich selbst. Einmal pro Kampf." },
      ],
    },
    elementarist: {
      name: "Elementarist", klasse: "Magier", farbe: "#d0603a", zeichen: "flamme",
      werte: { STR: 8, GES: 14, KON: 13, INT: 16, WEI: 12, CHA: 10 }, tp: 7, rk: 12, metall: false, plaetze: 2,
      rucksack: [["heiltrank", 1], ["zauberbuch", 1], ["kreide", 1]],
      aktionen: [
        { id: "glutpfeil", name: "Glutpfeil", art: "angriff", reichweite: 12, attr: "INT", schaden: "1W10", fern: true, text: "Ein Funke aus Feuer gegen ein Ziel in Sichtweite. Beliebig oft." },
        { id: "magisches_geschoss", name: "Magisches Geschoss", art: "geschoss", reichweite: 12, schaden: "1W4+1", anzahl: 3, platz: 1, text: "Drei Lichtpfeile treffen immer. Kostet einen Zauberplatz." },
      ],
      bonus: [],
    },
    lichtbringer: {
      name: "Lichtbringer", klasse: "Kleriker", farbe: "#e8d8a0", zeichen: "sonne",
      werte: { STR: 14, GES: 10, KON: 14, INT: 10, WEI: 16, CHA: 12 }, tp: 10, rk: 18, metall: true, plaetze: 2,
      rucksack: [["heiltrank", 1], ["symbol", 1], ["verband", 3]],
      aktionen: [
        { id: "streitkolben", name: "Streitkolben", art: "angriff", reichweite: 1, attr: "STR", schaden: "1W6+2", text: "Nahkampf gegen ein Ziel direkt neben dir." },
        { id: "heiliges_licht", name: "Heiliges Licht", art: "rettungswurf", reichweite: 12, attr: "WEI", rettung: "GES", schaden: "1W8", fern: true, text: "Strahlendes Licht. Das Ziel muss ausweichen (Geschicklichkeit), sonst nimmt es Schaden." },
      ],
      bonus: [
        { id: "heilendes_wort", name: "Heilendes Wort", art: "heilung", reichweite: 6, heilung: "1W4+3", platz: 1, text: "Heilt eine Figur bis 6 Felder entfernt, auch wenn sie am Boden liegt. Kostet einen Zauberplatz." },
      ],
    },
  };

  /* ---------- Gegenstände ---------- */
  const DINGE = {
    heiltrank: { name: "Heiltrank", text: "Rote, warme Flüssigkeit. Trinken ist eine Bonusaktion und heilt 2W4+2 TP.", heilung: "2W4+2" },
    seil: { name: "Seil, 15 m", text: "Hanfseil mit Knoten alle zwei Meter." },
    fackel: { name: "Fackel", text: "Brennt etwa eine Stunde." },
    zauberbuch: { name: "Zauberbuch", text: "Deine Zauber in enger Handschrift, mit Brandflecken." },
    kreide: { name: "Kreide", text: "Zum Markieren von Wegen und Türen." },
    symbol: { name: "Heiliges Symbol", text: "Eine Sonnenscheibe aus Messing, dein Fokus für Zauber." },
    verband: { name: "Verband", text: "Für die Rast nach dem Kampf." },
  };
  const TRANK = { id: "heiltrank", name: "Heiltrank trinken", art: "trank", heilung: DINGE.heiltrank.heilung, text: DINGE.heiltrank.text };

  /* ---------- Gegner ---------- */
  const GEGNER = {
    rostkaefer: { name: "Rostkäfer", tp: 9, rk: 13, werte: { STR: 12, GES: 12, KON: 13, INT: 1, WEI: 10, CHA: 3 }, angriff: { name: "Biss", bonus: 3, schaden: "1W6+1" }, rost: true, xp: 25 },
  };

  /* ---------- Karte ---------- */
  function key(x, y) { return x + "," + y; }
  function blockiert(st, x, y) { return x < 0 || y < 0 || x >= st.karte.b || y >= st.karte.h || st.karte.block.has(key(x, y)); }
  function belegt(st, x, y, ausser) { return st.figuren.some((f) => f !== ausser && f.tp > 0 && f.x === x && f.y === y); }
  const abstand = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

  /** Erreichbare Felder (8 Richtungen, keine Ecken durch Hindernisse), Rückgabe Map key → Kosten */
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
        // durch Verbündete darf man hindurch, durch Gegner nicht
        const anderer = st.figuren.find((o) => o !== f && o.tp > 0 && o.x === nx && o.y === ny);
        if (anderer && anderer.seite !== f.seite) continue;
        if (ziel.has(k)) continue;
        ziel.set(k, d + 1); q.push([nx, ny, d + 1]);
      }
    }
    // Endfelder dürfen nicht belegt sein
    for (const k of [...ziel.keys()]) { const [x, y] = k.split(",").map(Number); if (belegt(st, x, y, f)) ziel.delete(k); }
    return ziel;
  }

  /** Sichtlinie: Strecke von Feldmitte zu Feldmitte darf kein Hindernis schneiden */
  function sicht(st, a, b) {
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 4;
    for (let i = 1; i < n; i++) {
      const x = Math.round(a.x + (b.x - a.x) * i / n), y = Math.round(a.y + (b.y - a.y) * i / n);
      if ((x !== a.x || y !== a.y) && (x !== b.x || y !== b.y) && st.karte.block.has(key(x, y))) return false;
    }
    return true;
  }

  /* ---------- Spielzustand ---------- */
  const KARTE_GARTEN = {
    name: "Der Klostergarten", b: 12, h: 9,
    // Grabsteine (G), Mauerreste (M), Brunnen (B)
    hindernisse: [
      ["G", 4, 1], ["G", 4, 3], ["G", 7, 2], ["G", 7, 6], ["G", 4, 7],
      ["M", 6, 4], ["M", 6, 5], ["B", 9, 4],
    ],
    start: { spieler: [[1, 3], [1, 5], [2, 4]], gegner: [[10, 1], [10, 7], [11, 4]] },
  };

  function neuesSpiel(seed, opts = {}) {
    const st = { seed, rs: seed >>> 0 || 1, karte: null, figuren: [], log: [], runde: 1, reihe: [], am: 0, zug: null, ende: null, xp: 0 };
    zufall(st);
    const r = st.r;
    const k = opts.karte || KARTE_GARTEN;
    const karte = { name: k.name, b: k.b, h: k.h, hindernisse: k.hindernisse, block: new Set(k.hindernisse.map(([, x, y]) => key(x, y))) };
    st.karte = karte;
    const klassen = opts.klassen || ["schildwaechter", "elementarist", "lichtbringer"];
    const figuren = st.figuren;
    klassen.forEach((id, i) => {
      const c = KLASSEN[id], [x, y] = k.start.spieler[i];
      figuren.push({ id: "f" + i, seite: "spieler", klasse: id, name: c.name, farbe: c.farbe, zeichen: c.zeichen, x, y, tp: c.tp, tpMax: c.tp, rk: c.rk, rkBasis: c.rk, metall: c.metall, werte: c.werte, plaetze: c.plaetze || 0, genutzt: {}, rucksack: (c.rucksack || []).map(([id, n]) => ({ id, n })) });
    });
    const anzahl = opts.gegner || klassen.length; // Gegner wachsen mit der Gruppe
    for (let i = 0; i < anzahl; i++) {
      const g = GEGNER.rostkaefer, [x, y] = k.start.gegner[i % k.start.gegner.length];
      figuren.push({ id: "g" + i, seite: "gegner", art: "rostkaefer", name: g.name + " " + (i + 1), x, y, tp: g.tp, tpMax: g.tp, rk: g.rk, werte: g.werte, genutzt: {} });
    }
    // Initiative
    for (const f of figuren) { const w = W(r, 20); f.ini = w + mod(f.werte.GES); f.iniWurf = w; }
    st.reihe = figuren.slice().sort((a, b) => b.ini - a.ini || mod(b.werte.GES) - mod(a.werte.GES) || (a.seite === "spieler" ? -1 : 1)).map((f) => f.id);
    st.log.push({ t: "Initiative: " + st.reihe.map((id) => { const f = fig(st, id); return `${f.name} (${f.ini})`; }).join(" · ") });
    beginneZug(st);
    return st;
  }
  /** Zufallsfolge an den Spielstand binden (Zustand st.rs, damit er sich speichern lässt) */
  function zufall(st) {
    st.r = function () { st.rs = (st.rs + 0x6d2b79f5) >>> 0; let t = st.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return st;
  }
  /** Spielstand als JSON (z. B. für localStorage) und zurück */
  function speichern(st) {
    const o = Object.assign({}, st); delete o.r;
    o.karte = { name: st.karte.name, b: st.karte.b, h: st.karte.h, hindernisse: st.karte.hindernisse };
    return JSON.parse(JSON.stringify(o));
  }
  function laden(o) {
    const st = JSON.parse(JSON.stringify(o));
    st.karte.block = new Set(st.karte.hindernisse.map(([, x, y]) => key(x, y)));
    return zufall(st);
  }
  /** Was Handys sehen dürfen: Figuren, Zug, Möglichkeiten der aktiven Figur, letzte Einträge */
  function ansicht(st, nLog = 8) {
    const f = aktiv(st), optionen = [];
    if (!st.ende && f.seite === "spieler") {
      const alle = KLASSEN[f.klasse].aktionen.map((a) => [a, "aktion"]).concat(KLASSEN[f.klasse].bonus.map((a) => [a, "bonus"]));
      if (trankZahl(f)) alle.push([TRANK, "bonus"]);
      for (const [a] of alle) {
        const ok = verfuegbar(st, a.id);
        optionen.push({ id: a.id, ok, ziele: ok ? ziele(st, a.id).map((z) => ({ id: z.id, name: z.name, tp: z.tp, tpMax: z.tpMax })) : [] });
      }
    }
    return {
      runde: st.runde, ende: st.ende, aktiv: f.id, zug: st.zug,
      reihe: st.reihe,
      figuren: st.figuren.map((o) => ({ id: o.id, seite: o.seite, klasse: o.klasse || null, name: o.name, tp: o.tp, tpMax: o.tpMax, rk: o.rk, plaetze: o.plaetze || 0, genutzt: o.genutzt, rucksack: o.rucksack || [] })),
      optionen,
      log: st.log.slice(-nLog),
      nLog: st.log.length,
    };
  }
  const trankZahl = (f) => { const t = (f.rucksack || []).find((d) => d.id === "heiltrank"); return t ? t.n : 0; };
  const fig = (st, id) => st.figuren.find((f) => f.id === id);
  const aktiv = (st) => fig(st, st.reihe[st.am]);

  function beginneZug(st) {
    let schutz = 0;
    while (aktiv(st).tp <= 0 && schutz++ < 20) weiter(st, true);
    const f = aktiv(st);
    st.zug = { figur: f.id, bewegung: 6, aktion: true, bonus: true };
  }
  function weiter(st, still) {
    st.am++;
    if (st.am >= st.reihe.length) { st.am = 0; st.runde++; if (!still) st.log.push({ t: `— Runde ${st.runde} —`, art: "runde" }); }
    if (!still) beginneZug(st);
  }
  function pruefeEnde(st) {
    const sp = st.figuren.filter((f) => f.seite === "spieler"), ge = st.figuren.filter((f) => f.seite === "gegner");
    if (ge.every((f) => f.tp <= 0)) { st.ende = "sieg"; st.xp = ge.length * GEGNER.rostkaefer.xp; st.log.push({ t: `Sieg! Alle Rostkäfer sind besiegt. Jede Figur erhält ${Math.floor(st.xp / sp.length)} EP.`, art: "ende" }); }
    else if (sp.every((f) => f.tp <= 0)) { st.ende = "rueckzug"; st.log.push({ t: "Die ganze Gruppe liegt am Boden. Ihr zieht euch zum Lagerfeuer zurück.", art: "ende" }); }
    return st.ende;
  }

  /* ---------- Handlungen der Spielerfiguren ---------- */
  function bewegen(st, x, y) {
    const f = aktiv(st);
    if (st.ende || f.seite !== "spieler") return { fehler: "Nicht am Zug." };
    const m = erreichbar(st, f, st.zug.bewegung), k = key(x, y);
    if (!m.has(k) || (x === f.x && y === f.y)) return { fehler: "Dorthin kommt " + f.name + " nicht." };
    st.zug.bewegung -= m.get(k); f.x = x; f.y = y;
    return { ok: true };
  }

  function findeAktion(f, id) {
    const c = KLASSEN[f.klasse];
    const a = c.aktionen.find((x) => x.id === id); if (a) return { a, typ: "aktion" };
    const b = c.bonus.find((x) => x.id === id); if (b) return { a: b, typ: "bonus" };
    if (id === "heiltrank" && f.rucksack) return { a: TRANK, typ: "bonus" };
    return null;
  }
  /** Ziele, die für eine Aktion gerade gültig sind */
  function ziele(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId); if (!h) return [];
    const a = h.a;
    if (a.art === "selbstheilung") return [f];
    if (a.art === "trank") return f.tp < f.tpMax ? [f] : [];
    if (a.art === "heilung") return st.figuren.filter((o) => o.seite === "spieler" && o.tp < o.tpMax && abstand(f, o) <= a.reichweite && sicht(st, f, o));
    return st.figuren.filter((o) => o.seite === "gegner" && o.tp > 0 && abstand(f, o) <= a.reichweite && (a.reichweite === 1 || sicht(st, f, o)));
  }
  function verfuegbar(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId); if (!h) return false;
    if (h.typ === "aktion" && !st.zug.aktion) return false;
    if (h.typ === "bonus" && !st.zug.bonus) return false;
    if (h.a.platz && f.plaetze < h.a.platz) return false;
    if (h.a.proRast && (f.genutzt[h.a.id] || 0) >= h.a.proRast) return false;
    if (h.a.art === "trank" && !trankZahl(f)) return false;
    return ziele(st, aktionId).length > 0;
  }

  function schaden(st, ziel, n, quelle) {
    ziel.tp = Math.max(0, ziel.tp - n);
    if (ziel.tp === 0) st.log.push({ t: ziel.seite === "gegner" ? `${ziel.name} ist besiegt.` : `${ziel.name} geht zu Boden!`, art: ziel.seite === "gegner" ? "gut" : "schlecht" });
  }

  function handeln(st, aktionId, zielId) {
    const f = aktiv(st);
    if (st.ende || f.seite !== "spieler") return { fehler: "Nicht am Zug." };
    if (!verfuegbar(st, aktionId)) return { fehler: "Das geht gerade nicht." };
    const { a, typ } = findeAktion(f, aktionId);
    const z = fig(st, zielId);
    if (!z || !ziele(st, aktionId).includes(z)) return { fehler: "Kein gültiges Ziel." };
    if (typ === "aktion") st.zug.aktion = false; else st.zug.bonus = false;
    if (a.platz) f.plaetze -= a.platz;
    if (a.proRast) f.genutzt[a.id] = (f.genutzt[a.id] || 0) + 1;
    const r = st.r;
    if (a.art === "angriff") {
      const w = W(r, 20), bon = mod(f.werte[a.attr]) + UEBUNG, ges = w + bon;
      const krit = w === 20, trifft = w !== 1 && (krit || ges >= z.rk);
      if (trifft) { const s = roll(r, a.schaden, krit); schaden(st, z, s.total); st.log.push({ t: `${f.name}: ${a.name} – W20 ${w} + ${bon} = ${ges} gegen RK ${z.rk}: ${krit ? "kritischer Treffer" : "Treffer"}, ${s.total} Schaden.`, art: "wurf", wurf: w }); }
      else st.log.push({ t: `${f.name}: ${a.name} – W20 ${w} + ${bon} = ${ges} gegen RK ${z.rk}: verfehlt.`, art: "wurf", wurf: w });
    } else if (a.art === "geschoss") {
      let sum = 0; const einzel = [];
      for (let i = 0; i < a.anzahl; i++) { const s = roll(r, a.schaden); sum += s.total; einzel.push(s.total); }
      schaden(st, z, sum); st.log.push({ t: `${f.name}: ${a.name} – drei Lichtpfeile treffen sicher (${einzel.join(" + ")}) = ${sum} Schaden.`, art: "wurf" });
    } else if (a.art === "rettungswurf") {
      const sg = 8 + UEBUNG + mod(f.werte[a.attr]), w = W(r, 20), ges = w + mod(z.werte[a.rettung]);
      if (ges >= sg) st.log.push({ t: `${f.name}: ${a.name} – ${z.name} weicht aus (Rettungswurf ${ges} gegen SG ${sg}).`, art: "wurf" });
      else { const s = roll(r, a.schaden); schaden(st, z, s.total); st.log.push({ t: `${f.name}: ${a.name} – Rettungswurf ${ges} gegen SG ${sg} misslingt, ${s.total} Schaden.`, art: "wurf" }); }
    } else if (a.art === "heilung" || a.art === "selbstheilung" || a.art === "trank") {
      if (a.art === "trank") f.rucksack.find((d) => d.id === "heiltrank").n -= 1;
      const s = roll(r, a.heilung), vorher = z.tp; z.tp = Math.min(z.tpMax, z.tp + s.total);
      st.log.push({ t: `${f.name}: ${a.name} – ${z.id === f.id ? "heilt sich um" : z.name + " heilt"} ${z.tp - vorher} TP${vorher === 0 ? " und steht wieder auf" : ""}.`, art: "gut" });
    }
    pruefeEnde(st);
    return { ok: true };
  }

  function zugEnde(st) { if (st.ende) return; weiter(st); }

  /* ---------- Gegnerzug ---------- */
  function gegnerZug(st) {
    const g = aktiv(st);
    if (g.seite !== "gegner" || st.ende) return;
    const d = GEGNER[g.art], lebende = st.figuren.filter((f) => f.seite === "spieler" && f.tp > 0);
    // Ziel: nächste Figur, bei Gleichstand die mit weniger TP
    lebende.sort((a, b) => abstand(g, a) - abstand(g, b) || a.tp - b.tp);
    let ziel = lebende[0];
    if (ziel && abstand(g, ziel) > 1) {
      const m = erreichbar(st, g, 6); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const dist = Math.min(...lebende.map((f) => abstand({ x, y }, f))); if (!best || dist < best.dist || (dist === best.dist && c < best.c)) best = { x, y, dist, c }; }
      if (best) { g.x = best.x; g.y = best.y; }
      lebende.sort((a, b) => abstand(g, a) - abstand(g, b) || a.tp - b.tp); ziel = lebende[0];
    }
    if (ziel && abstand(g, ziel) <= 1) {
      const w = W(st.r, 20), ges = w + d.angriff.bonus, krit = w === 20, trifft = w !== 1 && (krit || ges >= ziel.rk);
      if (trifft) {
        const s = roll(st.r, d.angriff.schaden, krit); schaden(st, ziel, s.total);
        let rost = "";
        if (d.rost && ziel.metall && ziel.rk > ziel.rkBasis - 2) { ziel.rk -= 1; rost = ` Die Rüstung rostet: RK ${ziel.rk}.`; }
        st.log.push({ t: `${g.name}: ${d.angriff.name} auf ${ziel.name} – W20 ${w} + ${d.angriff.bonus} = ${ges} gegen RK ${ziel.rk + (rost ? 1 : 0)}: ${krit ? "kritisch, " : ""}${s.total} Schaden.${rost}`, art: "gegner", wurf: w });
      } else st.log.push({ t: `${g.name}: ${d.angriff.name} auf ${ziel.name} – W20 ${w} + ${d.angriff.bonus} = ${ges}: verfehlt.`, art: "gegner", wurf: w });
    }
    if (!pruefeEnde(st)) weiter(st);
  }

  /* ---------- Einfache Steuerung für Spielerfiguren (für Tests und „Automatisch“) ---------- */
  function autoZug(st) {
    const f = aktiv(st); if (f.seite !== "spieler" || st.ende) return;
    const c = KLASSEN[f.klasse];
    // heilen, wenn jemand am Boden liegt oder Selbstheilung nötig
    for (const b of c.bonus) {
      if (b.art === "heilung" && verfuegbar(st, b.id)) { const z = ziele(st, b.id).sort((a, x) => a.tp - x.tp)[0]; if (z && z.tp <= z.tpMax / 2) handeln(st, b.id, z.id); }
      if (b.art === "selbstheilung" && f.tp <= f.tpMax / 2 && verfuegbar(st, b.id)) handeln(st, b.id, f.id);
    }
    const nahe = () => st.figuren.filter((g) => g.seite === "gegner" && g.tp > 0).sort((a, b) => abstand(f, a) - abstand(f, b))[0];
    const fern = c.aktionen.find((a) => a.reichweite > 1 && a.art !== "geschoss");
    const nah = c.aktionen.find((a) => a.reichweite === 1);
    let ziel = nahe(); if (!ziel || st.ende) return;
    if (nah && abstand(f, ziel) > 1) {
      const m = erreichbar(st, f, st.zug.bewegung); let best = null;
      for (const [k, cost] of m) { const [x, y] = k.split(",").map(Number); const dd = abstand({ x, y }, ziel); if (!best || dd < best.dd || (dd === best.dd && cost < best.cost)) best = { x, y, dd, cost }; }
      if (best && (best.x !== f.x || best.y !== f.y)) bewegen(st, best.x, best.y);
    }
    ziel = nahe();
    const reihen = [c.aktionen.find((a) => a.art === "geschoss" && f.plaetze > 0 && ziel && ziel.tp > 6), nah, fern].filter(Boolean);
    for (const a of reihen) { if (st.ende) break; const zs = ziele(st, a.id); if (zs.length && verfuegbar(st, a.id)) { handeln(st, a.id, zs.sort((x, y) => x.tp - y.tp)[0].id); break; } }
    if (!st.ende) zugEnde(st);
  }

  const API = { rng, roll, DINGE, TRANK, zufall, speichern, laden, ansicht, trankZahl, mod, parse, KLASSEN, GEGNER, KARTE_GARTEN, neuesSpiel, aktiv, fig, erreichbar, sicht, abstand, bewegen, ziele, verfuegbar, handeln, zugEnde, gegnerZug, autoZug, findeAktion, key };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABR = API;
})(typeof window !== "undefined" ? window : globalThis);
