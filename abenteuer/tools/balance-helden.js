/*
 * Balance-Analyse der Helden je Kampagne (Normal, optional --hardcore).
 *
 * Aufbau wie tools/auswertung-helden.js, aber mit gleichverteilt gemischten Gruppen (Fisher-Yates): Jede Kampfszene einer Kampagne wird so gebaut wie im Spiel (S.kampfOptionen),
 * je Gruppengröße 3–6 mit N zufälligen Gruppen, gesteuert von der eingebauten Helden-KI (R.autoZug) und Gegner-KI.
 *
 * Gemessen wird über Schnappschüsse vor/nach jedem Zug und – über R.beobachter – vor/nach jeder einzelnen Aktion:
 *  - verursachter Schaden: TP-Verlust der Gegner während des eigenen Zugs (ohne Overkill; Wolf zählt zum Tiergefährten)
 *  - erlittener Schaden: jeder TP-Verlust des Helden, egal in wessen Zug (ohne Overkill)
 *  - Heilung: TP-Gewinn von Helden während des eigenen Zugs (getrennt: andere / selbst), Aufrichten (von 0 auf > 0)
 *  - Unterstützung: neue Effekte auf Verbündeten (z. B. Segen, Schild) · Kontrolle: neue Effekte auf Gegnern (Spott, Furcht, Mal …)
 *  - Fähigkeiten: jede ausgeführte Aktion; „mit Wirkung“ = Treffer, Heilung, neuer Effekt, Fortschritt an einem Kampfziel,
 *    eigene Bewegung/Position oder zurückgewonnene Aktion
 *  - Spezialfähigkeit = begrenzt (x-mal je Kampf/Rast) oder kostet einen Zauberplatz
 *  - Überlebensrate = am Kampfende auf den Beinen · „nie am Boden“ = kein einziges Mal auf 0 TP
 *
 * Aufruf: node abenteuer/tools/balance-helden.js [N=40] [--nur=krone,…] [--hardcore] [--csv=datei] [--md=datei]
 *  --csv: eine Zeile je Held und Kampf (zum Nachrechnen) · --md: Bericht als Markdown
 */
"use strict";
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), F = R.FD;
for (const d of ["grauwacht", "rabenmoor", "hochwacht", "krone"]) require("../daten/" + d + ".js");
const N = +process.argv.find((a) => /^\d+$/.test(a)) || 40, HARD = process.argv.includes("--hardcore");
const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : null; };
const NUR = (arg("nur") || "rabenmoor,grauwacht,hochwacht,krone").split(",");
const GROESSEN = [3, 4, 5, 6];

/* ---------- Schnappschuss und Unterschied ---------- */
const norm = (z) => String(z).replace(/\s*\([^)]*\)/g, "").replace(/\d+/g, "").trim();
const ownerFid = (o) => (o.seite !== "spieler" ? null : o.fid || null); // Wolf trägt die fid seines Tiergefährten
const aktivKeys = (z) => new Set(Object.entries(z || {}).filter(([, v]) => v && (typeof v !== "number" || v > 0)).map(([k]) => k));
function snap(st) {
  const m = new Map();
  for (const o of st.figuren) m.set(o.id, { tp: Math.max(0, o.tp), z: aktivKeys(o.z), zr: JSON.stringify(o.z || {}), pos: o.x + "," + o.y, seite: o.seite, fid: o.fid || null, art: o.art || null, held: o.seite === "spieler" && o.fid && o.art !== "wolf" });
  const zug = st.zug || {};
  return { m, bew: (zug.bewegung || 0) + (zug.schritt || 0), aktion: Boolean(zug.aktion), bonus: Boolean(zug.bonus), ziele: JSON.stringify([st.mech ? st.mech.ziele : null, st.siegel || null, st.mech ? st.mech.gerettet : 0]) };
}
/** Was hat sich zwischen a und b getan? (aus Sicht der Figur mit id „wer“) */
function diff(a, b, wer) {
  const d = { schaden: 0, heilAndere: 0, heilSelbst: 0, auf: 0, kontrolle: 0, unterst: 0, ziel: a.ziele !== b.ziele, eigen: false };
  for (const [id, y] of b.m) {
    const x = a.m.get(id); if (!x) continue;
    const neu = [...y.z].filter((z) => !x.z.has(z)).length;
    if (y.seite === "gegner") { d.schaden += Math.max(0, x.tp - y.tp); d.kontrolle += neu; continue; }
    if (y.tp > x.tp) { if (id === wer) d.heilSelbst += y.tp - x.tp; else d.heilAndere += y.tp - x.tp; }
    if (x.tp <= 0 && y.tp > 0 && id !== wer) d.auf++;
    if (id !== wer) d.unterst += neu;
    if (id === wer && (neu || x.zr !== y.zr || x.pos !== y.pos)) d.eigen = true;
  }
  if (b.bew > a.bew || (b.aktion && !a.aktion) || (b.bonus && !a.bonus)) d.eigen = true;
  return d;
}

/** Gleichverteiltes Mischen (Fisher-Yates) – jede Gruppe gleich wahrscheinlich, jeder Held gleich oft dabei */
function mischen(liste, r) { const a = liste.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** Automatische Reaktionen und Passive aus dem Kampfprotokoll: [Muster, Spezial? (begrenzt/kostet Platz)] */
const REAKTIONEN = [[/^(.+?) stellt sich mit dem Schild dazwischen/, false, "Schutzhaltung"], [/^(.+?) pariert und sticht zurück/, false, "Parade"], [/^(.+?) schießt .+ hinterher \(Fangschuss\)/, false, "Fangschuss"],
  [/^(.+?) wirft eine Schutzglyphe/, true, "Schutzglyphe"], [/^(.+?) reißt einen arkanen Schild/, true, "Arkaner Schild"], [/^(.+?): Gedankenstütze/, true, "Gedankenstütze"], [/^(.+?) hat Glück und versucht/, true, "Glückspilz"]];
const leer = () => ({ k: 0, sieg: 0, steht: 0, nieBoden: 0, runden: 0, schadenAus: 0, schadenEin: 0, heilAndere: 0, heilSelbst: 0, auf: 0, kontrolle: 0, unterst: 0,
  akt: 0, aktWirkung: 0, reakt: 0, spez: 0, spezWirkung: 0, kSpezMoeglich: 0, kSpezSinnvoll: 0, groesse: { 3: 0, 4: 0, 5: 0, 6: 0 }, siegGroesse: { 3: 0, 4: 0, 5: 0, 6: 0 }, faehig: {} });
const zeilen = [], bericht = {};
const fmt = (x, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : "–");
const proz = (x, d = 0) => fmt(x * 100, d) + " %";
/** 95-%-Vertrauensbereich (Wilson) für eine Quote */
function wilson(s, n) { if (!n) return [0, 0]; const z = 1.96, p = s / n, m = (p + z * z / (2 * n)) / (1 + z * z / n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n); return [m - h, m + h]; }

for (const ab of NUR) {
  const D = globalThis.ABD_ALLE[ab]; if (!D) { console.error("Unbekannte Kampagne:", ab); continue; }
  const held = Object.fromEntries(F.REIHE.map((f) => [f, leer()]));
  const gruppe = { kaempfe: 0, siege: 0, groesse: {}, klasse: {} }; // klasse: Siegquote mit/ohne Klasse in der Gruppe
  const sonst = { schadenGegnerZug: 0, schadenBegleiter: 0, schadenHelden: 0 };
  const szenen = Object.entries(D.SZENEN).filter(([, s]) => s.art === "kampf");
  for (const [id, s] of szenen) for (const n of GROESSEN) for (let i = 0; i < N; i++) {
    const r = R.rng(id.length * 7919 + n * 104729 + i * 31 + ab.length), grp = mischen(F.REIHE, r).slice(0, n);
    const A = S.neu(3e5 + i * 17 + n + id.length, { gruppe: grp, abenteuer: ab, schwierigkeit: HARD ? "hardcore" : "normal" });
    A.szene = id; A.stufe = s.stufe || Math.min(3, s.abschnitt || 1);
    let o; try { o = S.kampfOptionen(A); } catch (e) { continue; }
    if (!o.stufe || s.stufe) o.stufe = A.stufe; else o.stufe = (R.BEGEGNUNGEN[o.begegnung] || {}).stufe || A.stufe;
    const st = R.neuesSpiel(5e6 + i * 13 + n * 7 + id.length, o);
    // je Held in diesem Kampf
    const k = {}; for (const f of R.spielerFiguren(st)) if (f.fid && f.art !== "wolf") k[f.fid] = { boden: false, schadenAus: 0, schadenEin: 0, heilAndere: 0, heilSelbst: 0, auf: 0, kontrolle: 0, unterst: 0, akt: 0, aktWirkung: 0, reakt: 0, spez: 0, spezWirkung: 0, spezMoeglich: false, faehig: {} };
    const namen = {}; for (const f of R.spielerFiguren(st)) if (k[f.fid]) namen[f.name] = f.fid;
    for (const f of R.spielerFiguren(st)) if (k[f.fid]) k[f.fid].spezMoeglich = R.aktionenVon(f, st).some((a) => a.platz || R.grenze(f, a)) || Boolean(f.plaetzeMax && f.plaetzeMax[0]);
    let vorAktion = null;
    R.beobachter = (art, st2, f, aktionId, zielId, e) => {
      if (art === "vor") { vorAktion = snap(st2); return; }
      const fid = ownerFid(f); if (!fid || !k[fid] || (e && e.fehler) || !vorAktion) return;
      const def = R.findeAktion(f, aktionId), a = def && def.a; if (!a) return;
      const d = diff(vorAktion, snap(st2), f.id), wirkung = d.schaden > 0 || d.heilAndere > 0 || d.heilSelbst > 0 || d.auf > 0 || d.kontrolle > 0 || d.unterst > 0 || d.ziel || d.eigen;
      const spez = Boolean(a.platz || R.grenze(f, a)), h = k[fid];
      h.akt++; if (wirkung) h.aktWirkung++;
      if (spez) { h.spez++; if (wirkung) h.spezWirkung++; }
      const fa = h.faehig[a.id] || (h.faehig[a.id] = { name: a.name, n: 0, w: 0, spez }); fa.n++; if (wirkung) fa.w++;
    };
    let schritte = 0;
    while (!st.ende && schritte++ < 4000) {
      const akt = R.aktiv(st), vor = snap(st), logVor = st.log.length;
      if (akt.seite === "gegner") R.gegnerZug(st); else R.autoZug(st);
      const nach = snap(st);
      // Reaktionen und automatische Passive der Helden (stehen nur im Protokoll)
      const reagiert = new Set();
      for (const l of st.log.slice(logVor)) for (const [re, spez, rname] of REAKTIONEN) {
        const m = re.exec(l.t || ""), fidR = m && namen[m[1]]; if (!fidR || !k[fidR]) continue;
        const h = k[fidR]; h.reakt++; reagiert.add(fidR);
        if (spez) { h.spez++; h.spezWirkung++; const fa = h.faehig["passiv:" + rname] || (h.faehig["passiv:" + rname] = { name: rname + " (automatisch)", n: 0, w: 0, spez: true }); fa.n++; fa.w++; }
      }
      // erlittener Schaden: jeder Held, in jedem Zug
      for (const [fid2, h] of Object.entries(k)) for (const [oid, y] of nach.m) if (y.held && y.fid === fid2) { const x = vor.m.get(oid); if (x) h.schadenEin += Math.max(0, x.tp - y.tp); if (y.tp <= 0) h.boden = true; }
      const fid = ownerFid(akt);
      if (akt.seite === "gegner") {
        let sch = 0; for (const [oid, y] of nach.m) { const x = vor.m.get(oid); if (x && y.seite === "gegner") sch += Math.max(0, x.tp - y.tp); }
        // Schaden im Gegnerzug: eindeutig einem reagierenden Helden zuordnen (Parade, Fangschuss), sonst „nicht zugeordnet“
        if (sch && reagiert.size === 1) k[[...reagiert][0]].schadenAus += sch; else sonst.schadenGegnerZug += sch;
        continue;
      }
      const d = diff(vor, nach, akt.id);
      if (!fid || !k[fid]) { sonst.schadenBegleiter += d.schaden; continue; }
      const h = k[fid];
      h.schadenAus += d.schaden; h.heilAndere += d.heilAndere; h.heilSelbst += d.heilSelbst; h.auf += d.auf; h.kontrolle += d.kontrolle; h.unterst += d.unterst;
    }
    R.beobachter = null;
    const sieg = st.ende === "sieg";
    gruppe.kaempfe++; if (sieg) gruppe.siege++;
    const g = gruppe.groesse[n] || (gruppe.groesse[n] = { k: 0, s: 0 }); g.k++; if (sieg) g.s++;
    const klassen = new Set(grp.map((f) => F.FIGUREN[f].klasse));
    for (const kl of Object.keys(F.KLASSEN)) { const e = gruppe.klasse[kl] || (gruppe.klasse[kl] = { mit: { k: 0, s: 0 }, ohne: { k: 0, s: 0 } }), t = klassen.has(kl) ? e.mit : e.ohne; t.k++; if (sieg) t.s++; }
    for (const f of R.spielerFiguren(st)) {
      if (!k[f.fid] || f.art === "wolf") continue;
      const x = k[f.fid], h = held[f.fid];
      h.k++; if (sieg) h.sieg++; if (f.tp > 0 && !f.tot) h.steht++; if (!x.boden) h.nieBoden++; h.runden += st.runde;
      h.groesse[n]++; if (sieg) h.siegGroesse[n]++;
      for (const key of ["schadenAus", "schadenEin", "heilAndere", "heilSelbst", "auf", "kontrolle", "unterst", "akt", "aktWirkung", "reakt", "spez", "spezWirkung"]) h[key] += x[key];
      if (x.spezMoeglich) h.kSpezMoeglich++;
      if (x.spezWirkung > 0) h.kSpezSinnvoll++;
      for (const [aid, fa] of Object.entries(x.faehig)) { const t = h.faehig[aid] || (h.faehig[aid] = { name: fa.name, n: 0, w: 0, spez: fa.spez }); t.n += fa.n; t.w += fa.w; }
      zeilen.push([ab, id, n, grp.join("+"), f.fid, sieg ? 1 : 0, f.tp > 0 && !f.tot ? 1 : 0, x.boden ? 1 : 0, st.runde, x.schadenAus, x.schadenEin, x.heilAndere, x.heilSelbst, x.auf, x.kontrolle, x.unterst, x.akt, x.aktWirkung, x.spez, x.spezWirkung].join(";"));
    }
  }
  bericht[ab] = { titel: D.META.titel, szenen: szenen.length, gruppe, held, sonst };
}

/* ---------- Ausgabe ---------- */
const name = (f) => `${F.FIGUREN[f].name} (${F.KLASSEN[F.FIGUREN[f].klasse].name})`;
let md = `# Balance-Analyse der Helden (${HARD ? "Hardcore" : "Normal"})\n\nErzeugt mit \`node abenteuer/tools/balance-helden.js ${N}${HARD ? " --hardcore" : ""}\`. Gesteuert von der eingebauten KI, nicht von Menschen.\n`;
md += `Je Kampfszene und Gruppengröße (3, 4, 5, 6) ${N} zufällige Gruppen. Werte „je Kampf“ sind Durchschnitte über alle Kämpfe, in denen der Held dabei war.\n\n`;
md += `**Spalten:** Kämpfe = Anzahl Simulationen mit dem Held · Ø Gruppe = durchschnittliche Gruppengröße · Sieg = Siegquote seiner Gruppen (95-%-Bereich) · Δ ohne = Siegquote mit ihm minus Siegquote aller Kämpfe ohne ihn (Prozentpunkte; misst seinen Beitrag unabhängig von der Kampagnenschwere) · Steht = am Kampfende auf den Beinen · Nie 0 = nie auf 0 TP · Schaden aus/ein = verursacht/erlitten je Kampf (ohne Overkill) · Heilung = an anderen (+ selbst) je Kampf · Auf = Verbündete aufgerichtet je Kampf · Unterst./Kontr. = neue Zustände auf Verbündeten/Gegnern je Kampf · Aktionen = ausgeführte Aktionen je Kampf, davon mit Wirkung · Reakt. = automatische Reaktionen/Passive je Kampf (Schutzhaltung, Parade, Fangschuss, Schutzglyphe, Arkaner Schild, Gedankenstütze, Glückspilz) · Spezial = Spezialfähigkeiten (begrenzt oder Zauberplatz, auch automatische wie Schutzglyphe) je Kampf, davon mit Wirkung · Spezial sinnvoll = Anteil der Kämpfe mit mindestens einer wirksamen Spezialfähigkeit.\n`;
for (const [ab, b] of Object.entries(bericht)) {
  const g = b.gruppe, liste = F.REIHE.filter((f) => b.held[f].k).sort((x, y) => b.held[y].sieg / b.held[y].k - b.held[x].sieg / b.held[x].k);
  md += `\n## ${b.titel}\n\n${b.szenen} Kampfszenen · ${g.kaempfe} Kämpfe · Sieg gesamt ${proz(g.siege / g.kaempfe, 1)}\n\n`;
  md += `**Gruppengröße:** ${GROESSEN.map((n) => `${n} Helden: ${g.groesse[n] ? g.groesse[n].k : 0} Kämpfe, Sieg ${g.groesse[n] ? proz(g.groesse[n].s / g.groesse[n].k) : "–"}`).join(" · ")}\n\n`;
  md += `**Klasse in der Gruppe:** ${Object.entries(g.klasse).map(([kl, e]) => `${F.KLASSEN[kl].name} mit ${proz(e.mit.s / e.mit.k)} / ohne ${proz(e.ohne.s / e.ohne.k)}`).join(" · ")}\n\n`;
  const schadenHelden = liste.reduce((s, f) => s + b.held[f].schadenAus, 0), alle = schadenHelden + b.sonst.schadenGegnerZug + b.sonst.schadenBegleiter;
  md += `**Zuordnung des Gegnerschadens:** ${proz(schadenHelden / alle)} direkt im Zug eines Helden · ${proz(b.sonst.schadenGegnerZug / alle)} im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · ${proz(b.sonst.schadenBegleiter / alle)} durch Begleiter.\n\n`;
  md += `| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Reakt. | Spezial (Wirkung) | Spezial sinnvoll |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  liste.forEach((f, i) => {
    const h = b.held[f], q = h.sieg / h.k, [lo, hi] = wilson(h.sieg, h.k), og = GROESSEN.reduce((s, n) => s + n * h.groesse[n], 0) / h.k;
    md += `| ${i + 1} | ${name(f)} | ${h.k} | ${fmt(og, 1)} | ${proz(q, 1)} (${fmt(lo * 100)}–${fmt(hi * 100)}) | ${(() => { const ohne = (g.siege - h.sieg) / (g.kaempfe - h.k), d = (q - ohne) * 100; return (d >= 0 ? "+" : "−") + fmt(Math.abs(d), 1); })()} | ${proz(h.steht / h.k)} | ${proz(h.nieBoden / h.k)} | ${fmt(h.schadenAus / h.k, 1)} | ${fmt(h.schadenEin / h.k, 1)} | ${fmt(h.heilAndere / h.k, 1)} (+${fmt(h.heilSelbst / h.k, 1)}) | ${fmt(h.auf / h.k, 2)} | ${fmt(h.unterst / h.k, 1)} | ${fmt(h.kontrolle / h.k, 1)} | ${fmt(h.akt / h.k, 1)} (${proz(h.aktWirkung / Math.max(1, h.akt))}) | ${fmt(h.reakt / h.k, 1)} | ${fmt(h.spez / h.k, 1)} (${proz(h.spezWirkung / Math.max(1, h.spez))}) | ${proz(h.kSpezSinnvoll / h.k)} |\n`;
  });
  md += `\n<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>\n\n`;
  for (const f of liste) {
    const fa = Object.values(b.held[f].faehig).sort((x, y) => y.n - x.n);
    md += `- **${name(f)}:** ${fa.map((x) => `${x.name}${x.spez ? "★" : ""} ${x.n}× (${proz(x.w / x.n)})`).join(" · ") || "–"}\n`;
  }
  md += `\n★ = Spezialfähigkeit\n</details>\n`;
  console.log(`\n${b.titel} · ${g.kaempfe} Kämpfe · Sieg ${proz(g.siege / g.kaempfe, 1)}`);
  liste.forEach((f, i) => { const h = b.held[f]; const dd = (h.sieg / h.k - (g.siege - h.sieg) / (g.kaempfe - h.k)) * 100; console.log(`${String(i + 1).padStart(2)}. ${name(f).padEnd(26)} n=${String(h.k).padStart(4)}  Sieg ${proz(h.sieg / h.k, 1).padStart(7)}  Δ ${(dd >= 0 ? "+" : "") + dd.toFixed(1)}  aus ${fmt(h.schadenAus / h.k, 1).padStart(5)}  ein ${fmt(h.schadenEin / h.k, 1).padStart(5)}  Heil ${fmt(h.heilAndere / h.k, 1).padStart(4)}  steht ${proz(h.steht / h.k).padStart(5)}  Spez.sinnv. ${proz(h.kSpezSinnvoll / h.k).padStart(5)}`); });
}
if (arg("md")) require("fs").writeFileSync(arg("md"), md);
if (arg("csv")) require("fs").writeFileSync(arg("csv"), "kampagne;szene;gruppengroesse;gruppe;held;sieg;steht_am_ende;war_am_boden;runden;schaden_aus;schaden_ein;heilung_andere;heilung_selbst;aufgerichtet;kontrolle;unterstuetzung;aktionen;aktionen_mit_wirkung;spezial;spezial_mit_wirkung\n" + zeilen.join("\n") + "\n");
