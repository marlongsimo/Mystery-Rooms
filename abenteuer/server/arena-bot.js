/*
 * Mythara – Arena, Serverkampf: der Rechner-Gegner. Entscheidet für den Helden am Zug genau EINEN Schritt
 * (bewegen, Aktion mit Ziel oder Zugende) – der Kern (arena-kern.js) führt ihn wie den Zug eines Spielers aus.
 *
 * Wie er entscheidet:
 *   • Jede erlaubte Aktion mit jedem erlaubten Ziel wird mehrmals mit frischen Würfeln durchgespielt (auf Kopien des Stands);
 *     gewählt wird, was die Lage im Schnitt am meisten verbessert. So nutzt er alle Fähigkeiten, die ein Held hat –
 *     Angriffe, Zauber, Kontrolle, Stärkungen, Heilung, Tränke, Aufrichten –, ohne dass sie hier einzeln aufgezählt sind.
 *   • Er kennt die kommenden Würfel NICHT (die Kopien würfeln neu) und den verdeckten Anführer des Gegners auch nicht.
 *   • Bewegung: erst dorthin, wo die beste Aktion möglich ist (Fernkämpfer auf Abstand, Nahkämpfer heran, Heiler zu Verletzten),
 *     nach der Aktion gehen Fernkämpfer und Angeschlagene aus der Reichweite.
 *   • Spielstärke (merk.staerke, 0 bis 1; 1 = so gut er kann): Je niedriger, desto öfter greift er daneben – er schätzt ungenauer,
 *     nimmt manchmal irgendeine brauchbare Aktion statt der besten, verteilt seine Angriffe und lässt das Stellungsspiel aus.
 * Benutzt nur die öffentliche Schnittstelle der Regeln (js/regeln.js).
 */
(function (root) {
  "use strict";
  const SCHLECHT = new Set(["festgehalten", "liegend", "verbannt", "spott", "bruch", "mal_jaeger", "verlangsamt", "veraengstigt", "brandmal", "blutung", "analyse", "zeitriss", "vergiftet", "betaeubt", "stich", "geblendet", "entwaffnet"]);
  const GUT = new Set(["segen", "versteckt", "spiegel", "rueckzug", "schutzkreis", "raserei", "finte", "schild", "gift"]);
  const PROBEN = 5, SCHWELLE = 0.8, PATZER = 0.5;

  function bot(R) {
    const zahl = (c) => (c === "schritt" ? 0 : c);
    /** Stand als Vorlage für Proben: ohne Chronik (spart Zeit), ohne den verdeckten Anführer des Gegners */
    function vorlage(st, tm) {
      const j = R.speichern(st); j.log = [];
      if (j.arena && j.arena.koenig) { j.arena = Object.assign({}, j.arena, { koenig: Object.assign({}, j.arena.koenig) }); j.arena.koenig[3 - tm] = null; }
      return j;
    }
    const probe = (j) => { const c = R.laden(j); c.rs = Math.floor(Math.random() * 4294967296) >>> 0; return c; };
    /** Wie gut steht Team tm da? */
    function wert(st, tm) {
      const a = st.arena;
      if (st.ende) return a.sieger === tm ? 1000 : -1000;
      let w = ((a.punkte[tm] || 0) - (a.punkte[3 - tm] || 0)) * 4;
      for (const f of st.figuren) {
        const t = R.teamVon(st, f); if (!t) continue;
        const held = Boolean(f.team); let v = 0;
        if (f.tot) v = 0;
        else if (f.tp <= 0) v = held ? 4 : 0;
        else { v = (held ? 12 : 4) + (held ? 22 : 8) * Math.min(1, f.tp / f.tpMax); for (const k in f.z || {}) if (f.z[k]) v += SCHLECHT.has(k) ? -3 : GUT.has(k) ? 2 : 0; }
        if (a.koenig && t === tm && a.koenig[tm] === f.id) v *= 2.2; // der eigene Anführer zählt doppelt
        w += t === tm ? v : -v;
      }
      return w;
    }
    /** Alle Aktionen mit Ziel, die jetzt gehen */
    function wahlen(st, f) {
      const aus = [];
      for (const a of R.aktionenVon(f, st)) {
        if (!R.verfuegbar(st, a.id)) continue;
        for (const z of R.ziele(st, a.id)) {
          // Heilen lohnt erst, wenn wirklich etwas fehlt
          if ((a.art === "heilung" || a.art === "selbstheilung" || a.art === "trank") && z.tp > z.tpMax * 0.65) continue;
          aus.push({ a, z });
        }
      }
      return aus;
    }
    /** Beste Aktion nach Proben: { aktion, ziel, gewinn, typ } oder null */
    function besteAktion(j, st, f, tm, basis, s) {
      let best = null; const gut = [], proben = s > 0.8 ? PROBEN : 3, rauschen = 0.6 + (1 - s) * 7;
      for (const { a, z } of wahlen(st, f)) {
        if (a.art === "spurt") continue; // Spurt bringt allein nichts; siehe unten
        let sum = 0, n = 0;
        for (let i = 0; i < proben; i++) { const c = probe(j); const r = R.handeln(c, a.id, z.id); if (r && r.fehler) break; sum += wert(c, tm) - basis; n++; }
        if (!n) continue;
        const echt = sum / n, g = echt + Math.random() * rauschen, k = { aktion: a.id, ziel: z.id, gewinn: g, echt, typ: a.typ || "aktion", art: a.art };
        if (echt > SCHWELLE) gut.push(k);
        if (!best || g > best.gewinn) best = k;
      }
      // Fehlgriff: irgendeine brauchbare Aktion statt der besten
      if (gut.length > 1 && Math.random() < (1 - s) * 0.45) best = gut[Math.floor(Math.random() * gut.length)];
      if (best) best.gewinn = Math.max(best.gewinn, best.echt);
      return best;
    }
    /** Was ließe sich von einem Feld aus mit der Aktion anfangen? (ohne zu würfeln) */
    function potenzial(c, f) {
      let best = 0;
      for (const a of R.aktionenVon(f, c)) {
        if ((a.typ || "aktion") !== "aktion" || a.art === "spurt" || !R.verfuegbar(c, a.id)) continue;
        for (const z of R.ziele(c, a.id)) {
          let p;
          if (z.seite !== f.seite) { const ch = R.chance(c, a.id, z.id).p; p = (ch == null ? 0.6 : ch) * (1 + (1 - Math.max(0, z.tp) / z.tpMax) * 0.8) * (R.teamVon(c, z) ? 1 : 0.45); }
          else if (a.art === "aufrichten") p = 2.2;
          else if (a.art === "heilung") p = z === f ? 0 : z.tp < z.tpMax * 0.55 ? 1.6 : 0;
          else p = 0;
          if (p > best) best = p;
        }
      }
      return best;
    }
    /** Felder bewerten. Zurück: { hier, best: { x, y, s, pot } } */
    function felder(j, st, f, tm, aktionFrei) {
      const c = probe(j), g = R.aktiv(c), x0 = g.x, y0 = g.y;
      const feinde = c.figuren.filter((o) => o.seite !== g.seite && R.lebt(o)), helden = feinde.filter((o) => R.teamVon(c, o));
      const reich = Math.max(1, ...R.aktionenVon(g, c).filter((a) => a.art === "angriff" || a.art === "rettungswurf" || a.art === "geschoss" || a.art === "flaeche").map((a) => a.reichweite || 1));
      const fern = reich >= 4, schwach = g.tp < g.tpMax * 0.4;
      const amBoden = c.figuren.filter((o) => o.seite === g.seite && o !== g && o.tp <= 0 && !o.tot && o.team);
      const nebenJetzt = feinde.filter((o) => R.abstand(o, { x: x0, y: y0 }) <= 1);
      const gefahrGewicht = (fern ? 1.2 : 0.15) * (schwach ? 1.8 : 1);
      const note = (x, y, kosten) => {
        g.x = x; g.y = y;
        const pot = aktionFrei ? potenzial(c, g) : 0;
        let gefahr = 0; for (const o of feinde) { const d = R.abstand(o, g); gefahr += d <= 1 ? 1 : d <= 3 ? 0.25 : 0; }
        let s = pot * 3 - gefahr * gefahrGewicht - kosten * 0.03;
        // sich von einem Gegner lösen kostet meist einen Gelegenheitsangriff
        if (!(g.z && g.z.rueckzug) && nebenJetzt.some((o) => R.abstand(o, g) > 1)) s -= fern ? 0.6 : 1.1;
        if (aktionFrei && pot === 0) {
          const zu = amBoden.length ? amBoden : helden.length ? helden : feinde;
          if (zu.length) s -= 0.5 * Math.min(...zu.map((o) => R.abstand(o, g)));
        }
        return { x, y, s, pot };
      };
      const hier = note(x0, y0, 0); let best = null;
      for (const [k, kosten] of R.bewegungsfelder(st, f)) {
        const [x, y] = k.split(",").map(Number); if (x === x0 && y === y0) continue;
        const n = note(x, y, zahl(kosten)); n.s += Math.random() * 0.15;
        if (!best || n.s > best.s) best = n;
      }
      g.x = x0; g.y = y0;
      return { hier, best };
    }

    /**
     * Ein Schritt für den Helden am Zug. merk: { lauf } zählt die Bewegungen dieses Zugs (der Kern setzt es je Zug zurück).
     * Zurück: { typ: "bewegen", x, y } | { typ: "aktion", aktion, ziel } | { typ: "ende" }
     */
    function entscheide(st, merk) {
      const f = R.aktiv(st), tm = f ? R.teamVon(st, f) : 0;
      if (!f || !tm || st.ende || f.tp <= 0 || f.seite !== "spieler") return { typ: "ende" };
      merk = merk || {};
      const s = merk.staerke == null ? 1 : Math.max(0, Math.min(1, merk.staerke)), traege = Math.random() < (1 - s) * 0.6; // träge: kein Stellungsspiel in diesem Schritt
      // Verschenkter Zug: Je schwächer, desto öfter bleibt die Aktion eines Helden ungenutzt (er läuft nur). Einmal je Zug ausgelost.
      const zugKey = f.id + ":" + st.runde; if (merk.patzKey !== zugKey) { merk.patzKey = zugKey; merk.patzt = Math.random() < (1 - s) * PATZER; }
      const j = vorlage(st, tm), basis = wert(probe(j), tm);
      const aktionFrei = Boolean(st.zug.aktion), kannLaufen = (st.zug.bewegung > 0 || st.zug.schritt > 0) && (merk.lauf || 0) < 3;
      let akt = besteAktion(j, st, f, tm, basis, s);
      if (merk.patzt && akt && akt.typ === "aktion" && !/aufrichten|heilung|trank/.test(akt.art)) akt = null;
      const lohnt = akt && akt.gewinn > SCHWELLE;
      const fd = kannLaufen ? felder(j, st, f, tm, aktionFrei) : null;
      const geh = (b) => ({ typ: "bewegen", x: b.x, y: b.y }), tu = (a) => ({ typ: "aktion", aktion: a.aktion, ziel: a.ziel });
      if (aktionFrei) {
        // erst in Stellung gehen, wenn von dort deutlich mehr möglich ist
        if (fd && fd.best && fd.best.pot > fd.hier.pot * 1.15 + 0.2 && fd.best.s > fd.hier.s && !(traege && fd.hier.pot > 0)) return geh(fd.best);
        if (lohnt) return tu(akt);
        if (fd && fd.best && fd.best.s > fd.hier.s + 0.3) return geh(fd.best);
        // niemand erreichbar: spurten und weiterlaufen
        if (!(st.zug.bewegung > 0) && (merk.lauf || 0) < 3 && R.SPURT && R.verfuegbar(st, R.SPURT.id) && R.ziele(st, R.SPURT.id).length) return { typ: "aktion", aktion: R.SPURT.id, ziel: f.id };
        return { typ: "ende" };
      }
      if (lohnt) return tu(akt); // Bonusaktionen und freie Aktionen
      if (fd && fd.best && fd.best.s > fd.hier.s + 0.5 && !traege) return geh(fd.best);
      return { typ: "ende" };
    }
    /** Königsmord: Der Anführer ist der zäheste der eigenen Helden (Platz 0–2) */
    function anfuehrer(st, tm) {
      const h = st.figuren.filter((f) => f.team === tm); let best = 0;
      h.forEach((f, i) => { if (f.tpMax * (f.rk || 10) > h[best].tpMax * (h[best].rk || 10)) best = i; });
      return Math.max(0, Math.min(2, best));
    }
    return { entscheide, anfuehrer, wert };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = bot;
  else root.ABARENABOT = bot;
})(typeof window !== "undefined" ? window : globalThis);
