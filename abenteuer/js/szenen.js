/*
 * Case Unlocked · Abenteuer – Szenen-Engine (ohne Darstellung, testbar in Node)
 * Führt ein Abenteuer aus Szenen-Daten (daten/grauwacht.js): Erzählung, Gespräch, Abstimmung, Proben,
 * geheime Entscheidungen je Figur, Merker, die Glocke, Lagerfeuer (Rast, Aufstieg, Speicherpunkt) und Kämpfe.
 * Kämpfe selbst laufen in regeln.js; hier stehen nur Start und Auswertung.
 *
 * Szenen-Arten:
 *   erzaehlung  Text, dann weiter
 *   gespraech   Text + Optionen, die einzeln gewählt werden (jede höchstens einmal), bis eine Option „weiter“ führt
 *   wahl        Gruppenentscheidung: jede Figur stimmt ab, Mehrheit gilt, Gleichstand entscheidet der Würfel
 *   probe       eine Figur (oder die Gruppe) würfelt gegen SG: erfolg / knapp (bis 3 daneben) / fehl
 *   geheim      jede Figur entscheidet für sich (z. B. vom Brunnen trinken); niemand sieht die Antwort der anderen am Tisch
 *   kampf       Kampf mit Begegnung und Karte; Sieg / Rückzug (Normal) / Niederlage (Hardcore)
 *   lager       Lagerfeuer: lange Rast, ggf. Aufstieg, Speicherpunkt
 *   ende        Abschluss mit Epilog
 */
(function (root) {
  "use strict";
  const R = root.ABR || (typeof require === "function" ? require("./regeln.js") : null);
  const F = R.FD;
  // Abenteuerdaten je Abenteuer (daten/<id>.js registriert sich in ABD_ALLE); ohne Angabe: Grauwacht
  const ALLE = () => root.ABD_ALLE || {};
  function datenVon(id) {
    id = id || "grauwacht";
    if (!ALLE()[id] && typeof require === "function") { try { require("../daten/" + id + ".js"); } catch (e) { /* unbekannt */ } }
    return ALLE()[id] || ALLE().grauwacht || root.ABD;
  }
  const DATEN = (A) => datenVon(A && A.abenteuer);
  /** Kenndaten eines Abenteuers: Titel, Gruppengröße, „Uhr“ (Glocke, Lichter …), Texte für Tisch und Handy */
  const metaVon = (id) => Object.assign({ id: id || "grauwacht", min: 3, max: 6, uhr: { name: "Glocke", max: 7, mehr: "Die Glocke schlägt.", weniger: "Die Glocke verstummt ein wenig." } }, (datenVon(id) || {}).META || {});

  /* ---------- Hilfen für die Daten ---------- */
  const hat = (A, fid) => A.gruppe.includes(fid) && !(A.zust && A.zust[fid] && A.zust[fid].tot);
  const m = (A, k) => A.merker[k];
  const name = (A, fid) => F.FIGUREN[fid].name;

  function neu(seed, opts = {}) {
    const A = {
      seed, rs: seed >>> 0 || 1, abenteuer: opts.abenteuer || "grauwacht", szene: null, merker: {}, glocke: 0, stufe: 1,
      schwierigkeit: opts.schwierigkeit === "hardcore" ? "hardcore" : "normal",
      gruppe: (opts.gruppe || []).slice(0, 6), zust: null, lagerZust: null, lagerSzene: null,
      gewaehlt: {}, stimmen: {}, geheim: {}, probe: null, ergebnis: null, protokoll: [], gefallen: [],
    };
    R.zufall(A);
    A.zust = startZustand(A);
    geheZu(A, DATEN(A).START);
    return A;
  }
  function startZustand(A) {
    const z = {};
    for (const fid of A.gruppe) z[fid] = frisch(fid, A.stufe);
    return z;
  }
  function frisch(fid, stufe) {
    const k = F.KLASSEN[F.FIGUREN[fid].klasse];
    return { stufe, tp: F.tpVon(fid, stufe), tot: false, plaetze: k.plaetze ? F.PLAETZE[stufe].slice() : [0, 0], genutzt: {}, rucksack: [{ id: "heiltrank", n: 1 }] };
  }
  const szene = (A) => DATEN(A).SZENEN[A.szene];
  const text = (A, s = szene(A)) => (typeof s.text === "function" ? s.text(A, hilfen) : s.text || []).filter(Boolean);
  /** Zieht ein noch nicht erlebtes Ereignis für diesen Haltepunkt; danach geht es zu „danach“ weiter */
  function ereignis(A, punkt, danach) {
    const E = DATEN(A).EREIGNISSE || [];
    A.erlebt = A.erlebt || [];
    const moegl = E.filter((e) => e.punkte.includes(punkt) && !A.erlebt.includes(e.id) && (!e.wenn || e.wenn(A, hilfen)));
    if (!moegl.length) return danach;
    const e = moegl[Math.floor(A.r() * moegl.length)];
    A.erlebt.push(e.id); A.ereignisZiel = danach;
    return e.id;
  }
  /** Erste lebende Figur einer Klasse in der Gruppe (oder undefined) */
  const klasse = (A, k) => A.gruppe.find((f) => hat(A, f) && F.FIGUREN[f].klasse === k);
  const hilfen = { hat, m, name, ereignis, klasse, lebende: (A) => lebende(A) };

  function notiz(A, t, art) { A.protokoll.push({ t, art: art || "" }); if (A.protokoll.length > 200) A.protokoll.shift(); }
  /** Wirkung einer Option/eines Ergebnisses anwenden */
  function wirke(A, w) {
    if (!w) return;
    if (w.setzt) for (const [k, v] of Object.entries(typeof w.setzt === "function" ? w.setzt(A, hilfen) : w.setzt)) {
      if (typeof v === "number" && typeof A.merker[k] === "number" && w.addiere) A.merker[k] += v; else A.merker[k] = v;
    }
    if (w.plus) for (const [k, v] of Object.entries(w.plus)) A.merker[k] = (A.merker[k] || 0) + v;
    if (w.glocke) glocke(A, w.glocke);
    if (w.tranke) for (let i = 0; i < w.tranke; i++) { const fid = A.gruppe.filter((f) => !A.zust[f].tot)[i % Math.max(1, A.gruppe.length)]; if (fid) A.zust[fid].rucksack[0].n++; }
    if (w.heilen) for (const fid of lebende(A)) { const max = F.tpVon(fid, A.stufe), z = A.zust[fid]; z.tp = Math.min(max, z.tp + Math.ceil(max * w.heilen)); }
    if (w.schaden) for (const fid of lebende(A)) { const z = A.zust[fid]; z.tp = Math.max(1, z.tp - R.roll(A.r, w.schaden).total); }
    if (w.schadenFig && A.zust[w.schadenFig.fid] && !A.zust[w.schadenFig.fid].tot) { const z = A.zust[w.schadenFig.fid]; z.tp = Math.max(1, z.tp - R.roll(A.r, w.schadenFig.wurf).total); }
    if (w.trankWeg) for (let i = 0; i < w.trankWeg; i++) { const t = lebende(A).map((f) => A.zust[f].rucksack.find((d) => d.id === "heiltrank")).filter((d) => d && d.n > 0).sort((a, b) => b.n - a.n)[0]; if (t) t.n--; }
    if (w.gegenstandWeg) { const traeger = lebende(A).filter((f) => getragen(A, f).length); if (traeger.length) { const f = traeger[Math.floor(A.r() * traeger.length)], id = getragen(A, f)[0]; A.zust[f].rucksack.find((d) => d.id === id).n = 0; notiz(A, `${name(A, f)} gibt ${R.GEGENSTAENDE[id].name} her.`, "schlecht"); } }
    if (w.naechsterKampf) A.kampfMod = (A.kampfMod || 1) * w.naechsterKampf;
    if (w.beute) beuteZiehen(A);
    if (w.notiz) notiz(A, typeof w.notiz === "function" ? w.notiz(A, hilfen) : w.notiz, "gut");
  }
  function glocke(A, n) {
    A.glocke = Math.max(0, Math.min(7, A.glocke + n));
    const u = metaVon(A.abenteuer).uhr;
    notiz(A, `${n > 0 ? u.mehr : u.weniger} (${A.glocke} von 7)`, n > 0 ? "schlecht" : "gut");
  }
  function geheZu(A, id) {
    if (!DATEN(A).SZENEN[id]) throw new Error("Unbekannte Szene: " + id);
    A.szene = id; A.gewaehlt = A.gewaehlt || {}; A.stimmen = {}; A.geheim = {}; A.probe = null; A.ergebnis = null;
    const s = szene(A);
    if (s.abschnitt) A.abschnitt = s.abschnitt;
    if (s.beimEintritt) wirke(A, s.beimEintritt(A, hilfen));
    if (s.art === "lager") lagerfeuer(A, s);
    if (s.art === "probe") A.probe = { wer: s.probe.wer === "gruppe" ? "gruppe" : null, wuerfe: {} };
    if (s.art === "gespraech") A.gewaehlt[id] = A.gewaehlt[id] || [];
    if (s.art === "raetsel") A.raetsel = { folge: [] };
    if (s.art === "kampf") anfuehrerFestlegen(A, typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf);
  }
  /** Optionen, die gerade sichtbar sind */
  function optionen(A) {
    const s = szene(A), schon = A.gewaehlt[A.szene] || [];
    return (s.optionen || []).filter((o) => (!o.wenn || o.wenn(A, hilfen)) && !(s.art === "gespraech" && (!o.weiter || o.einmal) && schon.includes(o.id)));
  }
  function ziel(A, w) { const z = typeof w.weiter === "function" ? w.weiter(A, hilfen) : w.weiter; if (z) geheZu(A, z); }

  /* ---------- Erzählung und Gespräch ---------- */
  function weiter(A) {
    if (A.beute) return { fehler: "Erst die Beute verteilen." };
    const s = szene(A);
    if (A.aufstieg) A.aufstieg = null;
    if (s.art === "erzaehlung") return ziel(A, s), { ok: true };
    if (s.art === "probe" && A.ergebnis) { const e = s.probe[A.ergebnis.stufe]; wirke(A, e); ziel(A, e); return { ok: true }; }
    if (s.art === "lager") { A.ersatzOffen = []; return ziel(A, s), { ok: true }; }
    if (s.art === "geheim" && alleGeheim(A)) return geheimAuswerten(A), { ok: true };
    if (s.art === "wahl" && Object.keys(A.stimmen).length) return auswerten(A), { ok: true };
    return { fehler: "Hier geht es nicht einfach weiter." };
  }
  /** Gespräch: eine Option wählen (am Tisch). Bei „wahl“ entscheidet der Tisch damit sofort für alle. */
  function waehle(A, optId) {
    const s = szene(A), o = optionen(A).find((x) => x.id === optId);
    if (!o) return { fehler: "Diese Möglichkeit gibt es gerade nicht." };
    if (s.art === "gespraech") {
      A.gewaehlt[A.szene].push(o.id);
      A.antwort = typeof o.antwort === "function" ? o.antwort(A, hilfen) : o.antwort || null;
      A.dialog = A.dialog || {}; A.dialog[A.szene] = A.dialog[A.szene] || [];
      if (!o.weiter) A.dialog[A.szene].push({ frage: o.frage || o.text, wer: o.wer || null, antwort: A.antwort, probe: o.probe ? o.probe.name : null, offen: Boolean(o.probe) });
      wirke(A, o);
      if (o.probe) { A.zwischenprobe = { opt: o.id, wuerfe: {}, wer: null }; return { ok: true, probe: true }; }
      if (o.weiter) { A.antwort = null; ziel(A, o); }
      return { ok: true };
    }
    if (s.art === "wahl") { A.letzteAbstimmung = null; A.letzteStimmen = null; entscheide(A, o); return { ok: true }; }
    return { fehler: "Hier wird nicht gewählt." };
  }
  function entscheide(A, o) {
    notiz(A, `Entscheidung: ${o.text}`, "runde");
    wirke(A, o);
    ziel(A, o);
  }

  /* ---------- Abstimmung ---------- */
  function stimme(A, fid, optId) {
    const s = szene(A); if (s.art !== "wahl") return { fehler: "Gerade wird nicht abgestimmt." };
    if (!hat(A, fid)) return { fehler: "Diese Figur ist nicht dabei." };
    if (!optionen(A).some((o) => o.id === optId)) return { fehler: "Diese Möglichkeit gibt es nicht." };
    A.stimmen[fid] = optId; return { ok: true };
  }
  const lebende = (A) => A.gruppe.filter((f) => !A.zust[f].tot);
  function auswerten(A) {
    const s = szene(A), zaehl = {};
    for (const o of Object.values(A.stimmen)) zaehl[o] = (zaehl[o] || 0) + 1;
    const max = Math.max(...Object.values(zaehl)), vorne = Object.keys(zaehl).filter((k) => zaehl[k] === max);
    const gew = vorne.length > 1 ? vorne[Math.floor(A.r() * vorne.length)] : vorne[0];
    const o = optionen(A).find((x) => x.id === gew);
    A.letzteAbstimmung = { szene: A.szene, zaehl, gewinner: gew, wuerfel: vorne.length > 1 };
    A.letzteStimmen = Object.assign({}, A.stimmen);
    if (vorne.length > 1) notiz(A, "Gleichstand – der Würfel entscheidet.");
    entscheide(A, o);
    return { ok: true, gewinner: gew };
  }

  /* ---------- Proben ---------- */
  /** Bonus einer Figur auf eine Probe: Attributsmodifikator + 2, wenn geübt */
  function bonus(A, fid, p) {
    const d = F.FIGUREN[fid], attr = typeof p.attr === "function" ? p.attr(A, fid) : p.attr;
    const geuebt = (p.geuebt || []).some((x) => x === fid || x === d.klasse) ? 2 : 0;
    return { attr, wert: R.mod(d.werte[attr]) + geuebt, geuebt: Boolean(geuebt) };
  }
  // Die Schwierigkeit (sg) darf eine Funktion sein: z. B. leichter, je mehr die Gruppe vorher erreicht hat
  const sgVon = (A, p) => (typeof p.sg === "function" ? p.sg(A, hilfen) : p.sg);
  const aktuelleProbe = (A) => { const p = A.zwischenprobe ? szene(A).optionen.find((o) => o.id === A.zwischenprobe.opt).probe : szene(A).probe; return p && Object.assign({}, p, { sg: sgVon(A, p) }); };
  const probeZustand = (A) => A.zwischenprobe || A.probe;
  /** Wer würfelt (nur bei Proben für eine Figur) */
  function probeWer(A, fid) {
    const pz = probeZustand(A); if (!pz) return { fehler: "Keine Probe." };
    if (!hat(A, fid)) return { fehler: "Diese Figur ist nicht dabei." };
    if (pz.wer === "gruppe") return { fehler: "Hier würfeln alle." };
    if (Object.keys(pz.wuerfe).length) return { fehler: "Schon gewürfelt." };
    pz.wer = fid; return { ok: true };
  }
  function probeWurf(A, fid) {
    const pz = probeZustand(A), p = aktuelleProbe(A); if (!pz) return { fehler: "Keine Probe." };
    if (pz.wer !== "gruppe" && pz.wer !== fid) return { fehler: "Eine andere Figur würfelt." };
    if (pz.wuerfe[fid]) return { fehler: "Schon gewürfelt." };
    const b = bonus(A, fid, p), v = p.vorteil ? p.vorteil(A, hilfen, fid) : 0;
    const a = 1 + Math.floor(A.r() * 20), c = 1 + Math.floor(A.r() * 20);
    const w = v > 0 ? Math.max(a, c) : v < 0 ? Math.min(a, c) : a;
    pz.wuerfe[fid] = { w, gesamt: w + b.wert, bonus: b.wert, attr: b.attr, vorteil: v };
    notiz(A, `${name(A, fid)}: ${p.name || "Probe"} – W20 ${w}${v > 0 ? " (Vorteil)" : v < 0 ? " (Nachteil)" : ""} ${b.wert >= 0 ? "+" : "−"} ${Math.abs(b.wert)} = ${w + b.wert} gegen SG ${p.sg}`, "wurf");
    const fertig = pz.wer === "gruppe" ? lebende(A).every((f) => pz.wuerfe[f]) : true;
    if (fertig) probeAuswerten(A);
    return { ok: true, fertig };
  }
  function probeAuswerten(A) {
    const pz = probeZustand(A), p = aktuelleProbe(A);
    let stufe;
    if (pz.wer === "gruppe") {
      const ok = Object.values(pz.wuerfe).filter((x) => x.gesamt >= p.sg).length, n = Object.keys(pz.wuerfe).length;
      stufe = ok * 2 >= n ? "erfolg" : ok * 2 >= n - 1 ? "knapp" : "fehl";
    } else {
      const x = Object.values(pz.wuerfe)[0];
      stufe = x.w === 20 || x.gesamt >= p.sg ? "erfolg" : x.w !== 1 && x.gesamt >= p.sg - 3 ? "knapp" : "fehl";
    }
    if (!p.knapp && stufe === "knapp") stufe = "fehl";
    const e = p[stufe];
    const t = typeof e.text === "function" ? e.text(A, hilfen, pz) : e.text;
    notiz(A, { erfolg: "Geschafft", knapp: "Knapp daneben", fehl: "Misslungen" }[stufe] + (t ? ": " + t : "."), stufe === "erfolg" ? "gut" : "schlecht");
    if (A.zwischenprobe) {
      A.antwort = t; wirke(A, e); A.zwischenprobe = null;
      const d = A.dialog && A.dialog[A.szene] && A.dialog[A.szene][A.dialog[A.szene].length - 1];
      if (d && d.offen) { d.offen = false; d.antwort = t; d.stufe = stufe; d.wurf = Object.values(pz.wuerfe)[0]; d.werWuerfelt = Object.keys(pz.wuerfe)[0]; d.sg = p.sg; }
      if (e.weiter) { A.antwort = null; ziel(A, e); }
    } else A.ergebnis = { stufe, text: t };
  }

  /* ---------- Geheime Entscheidungen ---------- */
  /** Frage und Antworten für eine Figur (Szenen können je Figur verschieden fragen) */
  function geheimFuer(A, fid) {
    const s = szene(A);
    return { frage: typeof s.frage === "function" ? s.frage(A, hilfen, fid) : s.frage, antworten: typeof s.antworten === "function" ? s.antworten(A, hilfen, fid) : s.antworten };
  }
  function geheim(A, fid, antwort) {
    const s = szene(A); if (s.art !== "geheim") return { fehler: "Gerade gibt es nichts zu entscheiden." };
    if (!hat(A, fid)) return { fehler: "Diese Figur ist nicht dabei." };
    if (!geheimFuer(A, fid).antworten.some((x) => x.id === antwort)) return { fehler: "Unbekannte Antwort." };
    A.geheim[fid] = antwort; return { ok: true };
  }
  const alleGeheim = (A) => lebende(A).every((f) => A.geheim[f]);
  function geheimAuswerten(A) {
    const s = szene(A);
    for (const [fid, ant] of Object.entries(A.geheim)) { const a = geheimFuer(A, fid).antworten.find((x) => x.id === ant); if (a && a.setzt) wirke(A, { setzt: a.setzt(fid) }); }
    notiz(A, (typeof s.abschluss === "function" ? s.abschluss(A, hilfen) : s.abschluss) || "Jede Person hat für sich entschieden.");
    ziel(A, s);
  }

  /* ---------- Lagerfeuer ---------- */
  function lagerfeuer(A, s) {
    if (s.aufstieg && A.stufe < s.aufstieg) {
      const von = A.stufe; A.stufe = s.aufstieg; notiz(A, `Aufstieg: Die Gruppe erreicht Stufe ${A.stufe}.`, "gut");
      // Was jede Figur dazugewinnt (für den Aufstiegsbildschirm)
      A.aufstieg = { von, auf: A.stufe, helden: {} };
      for (const fid of A.gruppe) {
        if (A.zust[fid].tot) continue;
        const alt = F.faehigVon(fid, von).map((a) => a.id), neu = F.faehigVon(fid, A.stufe).filter((a) => !alt.includes(a.id));
        const k = F.KLASSEN[F.FIGUREN[fid].klasse];
        A.aufstieg.helden[fid] = { tp: [F.tpVon(fid, von), F.tpVon(fid, A.stufe)], neu: neu.map((a) => ({ name: a.name, text: a.text, typ: a.typ })),
          plaetze: k.plaetze ? [F.PLAETZE[von], F.PLAETZE[A.stufe]] : null };
      }
    }
    for (const fid of A.gruppe) {
      const z = A.zust[fid]; if (z.tot) continue;
      const neuZ = frisch(fid, A.stufe), anteil = A.glocke >= 3 ? 0.75 : 1;
      if ((z.rucksack || []).some((d) => d.id === "manastein" && d.n > 0)) neuZ.plaetze[0]++;
      A.zust[fid] = Object.assign(neuZ, { tp: Math.max(z.tp, Math.floor(neuZ.tp * anteil)), rucksack: z.rucksack });
    }
    A.lagerZust = JSON.parse(JSON.stringify(A.zust)); A.lagerSzene = A.szene;
    // Hardcore: Wer gefallen ist, wählt am Lagerfeuer eine neue Figur
    A.ersatzOffen = A.gruppe.filter((f) => A.zust[f].tot);
    notiz(A, `Lagerfeuer: lange Rast${A.glocke >= 3 ? ` (${metaVon(A.abenteuer).uhr.unruhe || "das Flüstern lässt niemanden ganz schlafen"}: TP bis ¾)` : ""}. Gespeichert.`, "gut");
  }
  /** Kurze Rast zwischen Kämpfen (nur Normal): halbe fehlende TP, Glocke schlägt */
  function kurzeRast(A) {
    if (A.schwierigkeit === "hardcore") return { fehler: "In Hardcore gibt es keine kurze Rast." };
    if (A.merker["kurz_" + (szene(A).abschnitt || A.abschnitt || 1)]) return { fehler: "In diesem Abschnitt habt ihr schon gerastet." };
    const z = R.kurzeRast(A.zust); for (const fid of Object.keys(z)) z[fid].stufe = A.stufe;
    A.merker["kurz_" + (szene(A).abschnitt || A.abschnitt || 1)] = true; glocke(A, 1); notiz(A, "Kurze Rast: Wunden verbunden.", "gut");
    return { ok: true };
  }

  /* ---------- Rätsel: Glocken in der richtigen Reihenfolge ---------- */
  /** Hinweise je Figur: Platte i geht an Figur i mod n; Zusatzhinweise (z. B. Lyra) obendrauf */
  function raetselHinweise(A) {
    const s = szene(A); if (s.art !== "raetsel") return {};
    const leb = lebende(A), out = {};
    leb.forEach((f) => { out[f] = []; });
    s.hinweise.forEach((h, i) => { if (leb.length) out[leb[i % leb.length]].push(h); });
    if (s.zusatz) for (const [fid, t] of Object.entries(s.zusatz)) if (out[fid]) out[fid].push(t);
    return out;
  }
  function raetselTipp(A, glockeId) {
    const s = szene(A); if (s.art !== "raetsel") return { fehler: "Hier gibt es kein Rätsel." };
    if (!s.glocken.some((g) => g.id === glockeId)) return { fehler: "Diese Glocke gibt es nicht." };
    A.raetsel.folge.push(glockeId);
    notiz(A, `${s.tippText || "Ihr schlagt die Glocke"} „${s.glocken.find((g) => g.id === glockeId).name}“.`);
    if (A.raetsel.folge.length < s.loesung.length) return { ok: true };
    if (A.raetsel.folge.join() === s.loesung.join()) { notiz(A, s.richtig, "gut"); wirke(A, s.erfolg); ziel(A, s.erfolg); return { ok: true, geloest: true }; }
    A.merker[A.szene + "_fehl"] = (A.merker[A.szene + "_fehl"] || 0) + 1; A.raetsel.folge = [];
    notiz(A, s.falsch, "schlecht"); glocke(A, 1);
    if (s.waechter && A.merker[A.szene + "_fehl"] % 2 === 0) geheZu(A, s.waechter);
    return { ok: true, falsch: true };
  }
  function raetselNeu(A) { if (A.raetsel) A.raetsel.folge = []; return { ok: true }; }
  function raetselAufgeben(A) { const s = szene(A); if (s.art !== "raetsel") return { fehler: "Kein Rätsel." }; notiz(A, "Ihr gebt das Rätsel auf."); wirke(A, s.aufgeben); ziel(A, s.aufgeben); return { ok: true }; }

  /* ---------- Ersatzfigur (Hardcore) ---------- */
  const freieFiguren = (A) => F.REIHE.filter((f) => !A.gruppe.includes(f) && !A.gefallen.includes(f));
  function ersatz(A, alt, neu) {
    if (!(A.ersatzOffen || []).includes(alt)) return { fehler: "Diese Figur braucht keinen Ersatz." };
    if (!freieFiguren(A).includes(neu)) return { fehler: "Diese Figur ist nicht frei." };
    A.gruppe[A.gruppe.indexOf(alt)] = neu; A.zust[neu] = frisch(neu, A.stufe); A.lagerZust[neu] = JSON.parse(JSON.stringify(A.zust[neu]));
    A.ersatzOffen = A.ersatzOffen.filter((f) => f !== alt);
    notiz(A, `${name(A, neu)} stößt am Lagerfeuer zur Gruppe. ${name(A, alt)} wird nicht vergessen.`, "gut");
    return { ok: true };
  }

  /* ---------- Beute: nach jedem Sieg 3 Gegenstände zur Wahl, einer geht an eine Figur ---------- */
  const MAX_GETRAGEN = 2;
  const getragen = (A, fid) => (A.zust[fid].rucksack || []).filter((d) => R.GEGENSTAENDE[d.id] && !R.GEGENSTAENDE[d.id].verbrauch && d.n > 0).map((d) => d.id);
  function darfTragen(A, fid, ding) {
    const g = R.GEGENSTAENDE[ding], z = A.zust[fid]; if (!g || !z || z.tot) return false;
    if (g.nur && !g.nur.includes(F.FIGUREN[fid].klasse)) return false;
    if (g.verbrauch) return true;
    const t = getragen(A, fid); return !t.includes(ding) && t.length < MAX_GETRAGEN;
  }
  function beuteZiehen(A) {
    const vergeben = A.gruppe.flatMap((f) => getragen(A, f));
    // Was einmal gezeigt wurde, ist weg: liegen gelassene Dinge tauchen nicht wieder auf
    A.gezeigt = A.gezeigt || [];
    const hc = A.schwierigkeit === "hardcore";
    const topf = Object.keys(R.GEGENSTAENDE).filter((id) => id !== "reliquie" && !A.gezeigt.includes(id) && !vergeben.includes(id)).filter((id) => lebende(A).some((f) => darfTragen(A, f, id)));
    const zug = [];
    // Hardcore: Ist jemand gefallen und hat die Gruppe keine Reliquie, liegt sie sicher in der Beute
    const reliquieDa = A.gruppe.some((f) => (A.zust[f].rucksack || []).some((d) => d.id === "reliquie" && d.n > 0));
    if (hc && A.gefallen.some((f) => A.gruppe.includes(f) && A.zust[f].tot) && !reliquieDa) zug.push("reliquie");
    while (zug.length < 3 && topf.length) zug.push(topf.splice(Math.floor(A.r() * topf.length), 1)[0]);
    A.gezeigt.push(...zug);
    A.beute = zug.length ? { dinge: zug } : null;
  }
  function beuteGeben(A, ding, fid) {
    if (!A.beute || !A.beute.dinge.includes(ding)) return { fehler: "Diesen Gegenstand gibt es gerade nicht." };
    if (!hat(A, fid)) return { fehler: "Diese Figur ist nicht dabei." };
    if (!darfTragen(A, fid, ding)) return { fehler: `${name(A, fid)} kann das nicht mehr tragen.` };
    const r = A.zust[fid].rucksack;
    if (ding === "heiltraenke") { const t = r.find((x) => x.id === "heiltrank"); if (t) t.n += 2; else r.push({ id: "heiltrank", n: 2 }); }
    else { const d = r.find((x) => x.id === ding); if (d) d.n++; else r.push({ id: ding, n: 1 }); }
    if (ding === "manastein" && A.zust[fid].plaetze) A.zust[fid].plaetze[0]++;
    notiz(A, `${name(A, fid)} nimmt ${R.GEGENSTAENDE[ding].name}.`, "gut");
    A.beute = null; return { ok: true };
  }
  /** Hardcore: Reliquie der Brüder – eine gefallene Figur kehrt nach dem Kampf zurück */
  function reliquieTraeger(A) { return lebende(A).find((f) => (A.zust[f].rucksack || []).some((d) => d.id === "reliquie" && d.n > 0)) || null; }
  function wiederbeleben(A, fid) {
    const z = A.zust[fid], t = reliquieTraeger(A);
    if (!z || !z.tot) return { fehler: "Diese Figur ist nicht gefallen." };
    if (!t) return { fehler: "Niemand trägt eine Reliquie der Brüder." };
    A.zust[t].rucksack.find((d) => d.id === "reliquie" && d.n > 0).n--;
    z.tot = false; z.tp = Math.ceil(F.tpVon(fid, A.stufe) / 2);
    A.gefallen = A.gefallen.filter((f) => f !== fid);
    if (A.ersatzOffen) A.ersatzOffen = A.ersatzOffen.filter((f) => f !== fid);
    if (A.lagerZust && A.lagerZust[fid]) A.lagerZust[fid] = JSON.parse(JSON.stringify(z));
    notiz(A, `${name(A, t)} legt die Reliquie der Brüder auf ${name(A, fid)}. Ein Atemzug, dann noch einer: ${name(A, fid)} lebt.`, "gut");
    return { ok: true };
  }
  function beuteLassen(A) { if (!A.beute) return { fehler: "Keine Beute." }; notiz(A, "Ihr lasst die Beute liegen."); A.beute = null; return { ok: true }; }

  /* ---------- Kampf ---------- */
  /** Anführer je Kampfszene einmal festlegen (beim Betreten, damit die Vorschau ihn schon kennt) */
  function anfuehrerFestlegen(A, k) {
    if (k.gegner || k.boss || k.keinAnfuehrer) return false;
    const key = "anfuehrer_" + A.szene; if (A.merker[key] == null) A.merker[key] = A.r() < 0.33;
    return A.merker[key];
  }
  /** Gegnervorschau vor dem Kampf: ohne Nebenwirkungen, Schwächen nur mit der passenden Klasse */
  function gegnerVorschau(A) {
    const s = szene(A); if (s.art !== "kampf") return null;
    const k = typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf;
    const o = Object.assign({ figuren: A.gruppe.filter((f) => !A.zust[f].tot), stufe: A.stufe, schwierigkeit: A.schwierigkeit }, k, { mischen: false, anfuehrer: false });
    if (A.kampfMod) o.skalaMal = (o.skalaMal || 1) * A.kampfMod;
    const st = R.neuesSpiel(1, o), arten = [], W = DATEN(A).WISSEN || {};
    for (const g of R.gegnerFiguren(st)) {
      let a = arten.find((x) => x.art === g.art);
      if (!a) {
        const d = R.GEGNER[g.art], w = W[g.art], wer = w && w.klassen.map((kl) => klasse(A, kl)).find(Boolean);
        a = { art: g.art, name: g.name.replace(/\s+\d+$/, ""), anzahl: 0, tp: 0, rk: g.rk, bewegung: d.bewegung != null ? d.bewegung : 6, boss: Boolean(d.boss),
          angriff: d.angriff ? { name: d.angriff.name, schaden: d.angriff.schaden, reichweite: d.angriff.reichweite || 1 } : null,
          zeichen: [d.untot && "Untot", d.boss && "Ruft Tote herbei", d.sporen && "Sporen", d.netz && "Netz", d.atem && !d.boss && "Glutatem", d.bewegung === 0 && "Bewegt sich nicht"].filter(Boolean),
          wissen: wer ? { wer, name: name(A, wer), text: w.text } : null, verdeckt: Boolean(w && !wer), kenner: w ? w.klassen.map((kl) => F.KLASSEN[kl].name) : [] };
        arten.push(a);
      }
      a.anzahl++; a.tp = Math.max(a.tp, g.tpMax);
    }
    return { arten, anfuehrer: A.merker["anfuehrer_" + A.szene] === true, ueberraschung: Boolean(o.ueberraschung), siegel: Boolean(k.boss) };
  }
  function kampfOptionen(A) {
    const s = szene(A), k = typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf;
    const vorher = {}; for (const fid of A.gruppe) vorher[fid] = Object.assign({}, A.zust[fid], { stufe: A.stufe });
    const o = Object.assign({ figuren: A.gruppe.filter((f) => !A.zust[f].tot), stufe: A.stufe, schwierigkeit: A.schwierigkeit, vorher }, k);
    // Abwechslung: gemischte Startplätze, in etwa jedem dritten Kampf ein Anführer (nicht im Duell und nicht beim Endgegner)
    if (!o.gegner && !o.boss) { o.mischen = true; o.anfuehrer = anfuehrerFestlegen(A, k); }
    if (A.kampfMod) { o.skalaMal = (o.skalaMal || 1) * A.kampfMod; }
    return o;
  }
  /** Nach dem Kampf: Ergebnis übernehmen und weiter */
  function kampfEnde(A, st) {
    const s = szene(A), k = typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf;
    for (const f of R.spielerFiguren(st)) if (f.tot && !A.gefallen.includes(f.fid)) { A.gefallen.push(f.fid); notiz(A, `${f.name} ist gefallen.`, "schlecht"); }
    if (st.ereignisse) for (const e of st.ereignisse) if (s.ereignisse && s.ereignisse[e]) wirke(A, s.ereignisse[e]);
    if (st.ende === "sieg") {
      const nz = R.nachKampf(st);
      for (const fid of A.gruppe) if (nz[fid]) A.zust[fid] = Object.assign(A.zust[fid], nz[fid], { stufe: A.stufe }); else if (A.gefallen.includes(fid)) A.zust[fid].tot = true;
      for (const fid of A.gefallen) if (A.zust[fid]) A.zust[fid].tot = true;
      R.neuerKampf(A.zust); A.kampfMod = null;
      wirke(A, k.sieg); ziel(A, k.sieg || {});
      if (k.beute !== false) beuteZiehen(A);
      return { ok: true, ergebnis: "sieg" };
    }
    // Eskorte: Die Begleiterin wurde verschleppt – die Geschichte geht anders weiter (Rettungsabschnitt), kein Rückzug
    if (st.ende === "gefangen" && k.gefangen) {
      const nz = R.nachKampf(st);
      for (const fid of A.gruppe) if (nz[fid]) { A.zust[fid] = Object.assign(A.zust[fid], nz[fid], { stufe: A.stufe }); if (!A.zust[fid].tot && A.zust[fid].tp < 1) A.zust[fid].tp = 1; }
      for (const fid of A.gefallen) if (A.zust[fid]) A.zust[fid].tot = true;
      R.neuerKampf(A.zust); A.kampfMod = null;
      wirke(A, k.gefangen); ziel(A, k.gefangen);
      return { ok: true, ergebnis: "gefangen" };
    }
    if (k.verloren && st.ende !== "sieg") {
      const nz = R.nachKampf(st);
      for (const fid of A.gruppe) if (nz[fid]) { A.zust[fid] = Object.assign(A.zust[fid], nz[fid], { stufe: A.stufe }); if (!A.zust[fid].tot && A.zust[fid].tp < 1) A.zust[fid].tp = 1; }
      for (const fid of A.gefallen) if (A.zust[fid]) A.zust[fid].tot = true;
      R.neuerKampf(A.zust);
      wirke(A, k.verloren); ziel(A, k.verloren);
      return { ok: true, ergebnis: "verloren" };
    }
    if (st.ende === "rueckzug") {
      notiz(A, "Rückzug zum Lagerfeuer.", "schlecht"); glocke(A, 1);
      A.zust = JSON.parse(JSON.stringify(A.lagerZust || startZustand(A)));
      return { ok: true, ergebnis: "rueckzug" }; // gleiche Szene beginnt neu
    }
    for (const fid of A.gruppe) A.zust[fid].tot = true;
    geheZu(A, DATEN(A).NIEDERLAGE);
    return { ok: true, ergebnis: "niederlage" };
  }

  /* ---------- Ansicht für Tisch und Handys ---------- */
  function ansicht(A) {
    const s = szene(A), pz = probeZustand(A), p = pz ? aktuelleProbe(A) : null;
    return {
      dialog: (A.dialog && A.dialog[A.szene]) || [],
      szene: A.szene, art: s.art, titel: s.titel, ort: s.ort || "", abschnitt: s.abschnitt || A.abschnitt || 1, text: text(A), antwort: A.antwort || null,
      glocke: A.glocke, stufe: A.stufe, schwierigkeit: A.schwierigkeit, abenteuer: A.abenteuer || "grauwacht", uhr: metaVon(A.abenteuer).uhr,
      optionen: optionen(A).map((o) => ({ id: o.id, text: o.text, wer: o.wer || null, probe: o.probe ? { name: o.probe.name, attr: typeof o.probe.attr === "string" ? o.probe.attr : "", sg: sgVon(A, o.probe) } : null, weiter: Boolean(o.weiter) })),
      stimmen: s.art === "wahl" ? A.stimmen : null,
      geheimFrage: s.art === "geheim" ? { frage: typeof s.frage === "string" ? s.frage : "Jede Person entscheidet für sich.", antworten: Array.isArray(s.antworten) ? s.antworten.map((a) => ({ id: a.id, text: a.text })) : [],
        proFigur: Object.fromEntries(lebende(A).map((f) => { const q = geheimFuer(A, f); return [f, { frage: q.frage, antworten: q.antworten.map((a) => ({ id: a.id, text: a.text })) }]; })), fertig: Object.keys(A.geheim) } : null,
      probe: p ? { name: p.name, attr: p.attr, sg: p.sg, wer: pz.wer, wuerfe: pz.wuerfe, gruppe: pz.wer === "gruppe",
        boni: Object.fromEntries(lebende(A).map((f) => [f, bonus(A, f, p).wert])), ergebnis: A.ergebnis } : null,
      raetsel: s.art === "raetsel" ? { symbol: s.symbol || "glocke", hinweisName: s.hinweisName || "Grabplatte", glocken: s.glocken, folge: A.raetsel.folge, fehl: A.merker[A.szene + "_fehl"] || 0, laenge: s.loesung.length, hinweise: raetselHinweise(A) } : null,
      ersatz: (A.ersatzOffen || []).length ? { offen: A.ersatzOffen, frei: freieFiguren(A) } : null,
      reliquie: reliquieTraeger(A) ? { traeger: reliquieTraeger(A), gefallen: A.gruppe.filter((f) => A.zust[f].tot) } : null,
      beute: A.beute ? { dinge: A.beute.dinge.map((id) => Object.assign({ id }, R.GEGENSTAENDE[id])), max: MAX_GETRAGEN,
        helden: Object.fromEntries(lebende(A).map((f) => [f, { getragen: getragen(A, f), darf: Object.fromEntries(A.beute.dinge.map((id) => [id, darfTragen(A, f, id)])) }])) } : null,
      aufstieg: A.aufstieg || null,
      vorschau: s.art === "kampf" ? gegnerVorschau(A) : null,
      zust: A.zust, gruppe: A.gruppe, gefallen: A.gefallen, protokoll: A.protokoll.slice(-6),
    };
  }
  function speichern(A) { const o = Object.assign({}, A); delete o.r; return JSON.parse(JSON.stringify(o)); }
  function laden(o) { return R.zufall(JSON.parse(JSON.stringify(o))); }

  const API = { metaVon, datenVon, wiederbeleben, reliquieTraeger, beuteGeben, beuteLassen, darfTragen, getragen, geheimFuer, raetselTipp, raetselNeu, raetselAufgeben, raetselHinweise, ersatz, freieFiguren, neu, szene, text, optionen, waehle, stimme, auswerten, weiter, probeWer, probeWurf, bonus, aktuelleProbe, probeZustand, geheim, alleGeheim, kurzeRast,
    kampfOptionen, gegnerVorschau, kampfEnde, ansicht, speichern, laden, glocke, hilfen, lebende };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABS = API;
})(typeof window !== "undefined" ? window : globalThis);
