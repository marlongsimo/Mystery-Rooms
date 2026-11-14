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
 *
 * Folgen sichtbar machen (Erzähltiefe):
 *   folge: "…"          an einer Option / einem Probenergebnis / einer geheimen Antwort: kurze Zeile, was das bewirkt.
 *                       Erscheint sofort (im Gespräch) oder als „Nachhall“ über der nächsten Szene, steht im Verlauf
 *                       und in der Rückschau am Ende. Auch als Funktion (A, hilfen[, fid]) möglich.
 *   Text mit „↳ “ vorn  Absatz, der nur wegen einer früheren Entscheidung dasteht – wird als Folge hervorgehoben.
 *   wichtig: true       Gesprächsoption, die man nicht versehentlich überspringen soll (nur in Gesprächen ohne Zeitgrenze markiert).
 *   fragen: 3           Gespräch mit begrenzter Zeit: so viele Fragen sind möglich (Zahl oder Funktion). Danach drängt die Lage weiter.
 *                       ueberzug: true – weitere Fragen sind erlaubt, kosten aber je einen Schritt der Uhr.
 *                       draengt: "…" – Satz, der erscheint, wenn die Zeit um ist. frei: true an einer Option – zählt nicht mit.
 *   rueckschau(A, h)    an einer Ende-Szene: Zeilen „Was ihr getan habt“. Ohne Angabe: die gesammelten Folgen.
 *   META.endeHinweise   { endeId: "Hinweis ohne Spoiler" } – am Ende für die Enden, die man nicht gesehen hat.
 */
(function (root) {
  "use strict";
  const R = root.ABR || (typeof require === "function" ? require("./regeln.js") : null);
  const F = R.FD;
  const HM = root.ABHM || (typeof require === "function" ? require("./heldenmomente.js") : {});
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

  /* ---------- Zehn-Stufen-Modell (nur wenn F.STUFEN10.aktiv): Helden bringen ihre Stufe mit, Gegner wachsen mit ---------- */
  const modell10 = () => Boolean(F.STUFEN10 && F.STUFEN10.aktiv);
  /** Empfohlene Heldenstufe einer Kampagne – aus ihrer Schwierigkeit (1 Leicht → 1, 2 Normal → 3, 3 → 4, 4 → 6, 5 → 8) */
  const empfStufe = (id) => (F.SCHWIERIGKEIT[metaVon(id).schwierigkeit || 1] || F.SCHWIERIGKEIT[1]).stufe;
  /** Bedrohung eines Kampfes: Die Kampagne wird nach hinten schwerer (Abschnitt 1 = empfohlene Stufe, dann je Abschnitt +1).
   *  Zurück kommt der Abstand zu dem Wert, auf den die Begegnung bisher ausgelegt war (alte Stufe 1/2/3 ≈ Heldenstufe 1/3/6). */
  function bedrohung(A, s, k) {
    if (!modell10()) return 0;
    const alt = Math.max(1, Math.min(3, (s && s.stufe) || (R.BEGEGNUNGEN[k && k.begegnung] || {}).stufe || 1));
    return Math.min(F.STUFEN10.max, empfStufe(A.abenteuer) + alt - 1) - [1, 3, 6][alt - 1];
  }
  /** Abgestimmter Lebensfaktor dieses Kampfes im Zehn-Stufen-Modell (je Szene und Gruppengröße), falls vorhanden */
  function skala10(A, o) {
    if (!modell10()) return;
    const t = (R.SKALA10 || {})[(A.abenteuer || "grauwacht") + ":" + A.szene], k = t && t[Math.max(3, Math.min(6, (o.figuren || []).length))];
    if (!k) return;
    // Fest vorgegebene Gegner (z. B. das Duell): der Faktor wirkt direkt auf ihr Leben
    if (o.gegner && !o.begegnung) { o.gegner = o.gegner.map((g) => Object.assign({}, g, { tpFaktor: (g.tpFaktor || 1) * k })); o.skala10 = k; } else o.skala = k;
  }

  function neu(seed, opts = {}) {
    const A = {
      seed, rs: seed >>> 0 || 1, abenteuer: opts.abenteuer || "grauwacht", szene: null, merker: {}, glocke: 0, stufe: 1,
      schwierigkeit: opts.schwierigkeit === "hardcore" ? "hardcore" : "normal",
      gruppe: (opts.gruppe || []).slice(0, 6), zust: null, lagerZust: null, lagerSzene: null,
      gewaehlt: {}, stimmen: {}, geheim: {}, probe: null, ergebnis: null, protokoll: [], gefallen: [],
    };
    // Zehn-Stufen-Modell: Die Gruppe spielt die ganze Kampagne auf ihrer Heldenstufe (bis zur Speicherung am Konto: die empfohlene)
    if (modell10()) A.stufe = Math.max(1, Math.min(F.STUFEN10.max, opts.heldenstufe || empfStufe(A.abenteuer)));
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
    return { stufe, tp: F.tpVon(fid, stufe), tot: false, plaetze: k.plaetze ? F.plaetzeVon(stufe).slice() : [0, 0], genutzt: {}, rucksack: [{ id: "heiltrank", n: 1 }] };
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
  /** Was eine Figur in einer geheimen Szene geantwortet hat (oder undefined) */
  const geheimAntwort = (A, szeneId, fid) => ((A.geheimChronik || {})[szeneId] || {})[fid];
  /** Alle lebenden Figuren, die in einer geheimen Szene eine bestimmte Antwort gegeben haben */
  const geheimWer = (A, szeneId, ant) => lebende(A).filter((f) => geheimAntwort(A, szeneId, f) === ant);
  /** Namen als Aufzählung: „Torvald“, „Torvald und Elara“, „Torvald, Elara und Pim“ */
  const namen = (A, fids) => { const n = fids.map((f) => name(A, f)); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " und " + n[n.length - 1]; };
  /* ---------- Heldenmomente (heldenmomente.js): was nur diese eine Figur sagt oder denkt ---------- */
  /** Zeile einer Figur zu einer Lage (oder ""), z. B. moment("schildwaechter", "gold") */
  const moment = (fid, lage) => ((HM[fid] || {}).stimmen || {})[lage] || "";
  /** Auftritt einer Figur aus der Gruppe zu einer Lage – reihum, damit jede drankommt. Liefert einen Absatz „☙fid|Text“ (oder ""). */
  function heldenStimme(A, lage) {
    A.auftritte = A.auftritte || {}; A.rampe = A.rampe || {};
    const key = A.szene + ":" + lage;
    let fid = A.auftritte[key];
    if (!fid || !hat(A, fid)) {
      const kand = lebende(A).filter((f) => moment(f, lage));
      if (!kand.length) return "";
      const min = Math.min(...kand.map((f) => A.rampe[f] || 0)), erste = kand.filter((f) => (A.rampe[f] || 0) === min);
      fid = erste[Math.floor(A.r() * erste.length)];
      A.auftritte[key] = fid; A.rampe[fid] = (A.rampe[fid] || 0) + 1;
    }
    return "☙" + fid + "|" + moment(fid, lage);
  }
  /** runde: "feuer" (Weidenhain, Tebbe fragt), "nacht" (eine Frage an sich selbst), "weg" (warum man weitergeht).
   *  Persönliche Lagerfeuer-Frage einer Figur: { frage, antworten } für eine geheime Szene. Die Antwort steht danach in merker.feuer_<fid>. */
  function feuerFrage(fid, runde) {
    const rd = runde || "feuer", f = (HM[fid] || {})[rd];
    if (!f) return { frage: "Was erzählst du am Feuer von dir?", antworten: [{ id: "wenig", text: "„Nicht viel.“", echo: `${F.FIGUREN[fid].name} hat am Feuer wenig gesagt und viel zugehört.`, setzt: () => ({ [rd + "_" + fid]: "wenig" }) }] };
    return { frage: f.frage, antworten: f.antworten.map((a) => ({ id: a.id, text: a.text, echo: a.echo, setzt: () => ({ [rd + "_" + fid]: a.id }) })) };
  }
  /** Was eine Figur am Feuer erzählt hat (der Satz für die anderen), oder "" */
  const feuerEcho = (A, fid, runde) => { const rd = runde || "feuer", f = (HM[fid] || {})[rd], a = f && f.antworten.find((x) => x.id === A.merker[rd + "_" + fid]); return a ? a.echo : ""; };
  const hilfen = { hat, m, name, namen, ereignis, klasse, geheimAntwort, geheimWer, moment, stimme: heldenStimme, feuerFrage, feuerEcho, lebende: (A) => lebende(A) };

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
    if (w.folge) folge(A, typeof w.folge === "function" ? w.folge(A, hilfen) : w.folge);
  }
  /** Eine sichtbare Folge festhalten: Verlauf, Nachhall über der nächsten Szene, Rückschau am Ende */
  function folge(A, t, art) {
    if (!t) return;
    A.folgen = A.folgen || []; A.nachhallNeu = A.nachhallNeu || [];
    if (!art || art === "folge") { if (!A.folgen.includes(t)) A.folgen.push(t); notiz(A, t, "folge"); }
    if (!A.nachhallNeu.some((x) => x.t === t)) A.nachhallNeu.push({ art: art || "folge", t });
  }
  /** Folgen, die seit Index n dazukamen, gehören zur letzten Gesprächsantwort (dort anzeigen, nicht erst in der nächsten Szene) */
  function folgenInsGespraech(A, n) {
    const neu = (A.nachhallNeu || []).splice(n), d = A.dialog && A.dialog[A.szene] && A.dialog[A.szene][A.dialog[A.szene].length - 1];
    if (d && neu.length) d.folgen = (d.folgen || []).concat(neu.map((x) => x.t));
  }
  function glocke(A, n) {
    A.glocke = Math.max(0, Math.min(7, A.glocke + n));
    const u = metaVon(A.abenteuer).uhr;
    notiz(A, `${n > 0 ? u.mehr : u.weniger} (${A.glocke} von 7)`, n > 0 ? "schlecht" : "gut");
  }
  function geheZu(A, id) {
    if (!DATEN(A).SZENEN[id]) throw new Error("Unbekannte Szene: " + id);
    A.szene = id; A.gewaehlt = A.gewaehlt || {}; A.stimmen = {}; A.geheim = {}; A.probe = null; A.ergebnis = null;
    A.nachhall = A.nachhallNeu && A.nachhallNeu.length ? A.nachhallNeu : null; A.nachhallNeu = [];
    const s = szene(A);
    if (s.abschnitt) A.abschnitt = s.abschnitt;
    if (s.beimEintritt) wirke(A, s.beimEintritt(A, hilfen));
    if (s.art === "lager") lagerfeuer(A, s);
    if (s.art === "probe") A.probe = { wer: s.probe.wer === "gruppe" ? "gruppe" : null, wuerfe: {} };
    if (s.art === "gespraech") A.gewaehlt[id] = A.gewaehlt[id] || [];
    if (s.art === "raetsel") A.raetsel = { folge: [] };
    if (s.art === "kampf") anfuehrerFestlegen(A, typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf);
  }
  /** Gespräch mit begrenzter Zeit: { max, genutzt, rest, ueberzug, draengt } – oder null, wenn die Szene keine Grenze hat */
  function gespraechStand(A) {
    const s = szene(A); if (!s || s.art !== "gespraech") return null;
    const max = typeof s.fragen === "function" ? s.fragen(A, hilfen) : s.fragen; if (!(max > 0)) return null;
    const genutzt = (A.gewaehlt[A.szene] || []).filter((id) => { const o = (s.optionen || []).find((x) => x.id === id); return o && !o.weiter && !o.frei; }).length;
    return { max, genutzt, rest: Math.max(0, max - genutzt), ueberzug: Boolean(s.ueberzug), draengt: (typeof s.draengt === "function" ? s.draengt(A, hilfen) : s.draengt) || "" };
  }
  /** Optionen, die gerade sichtbar sind */
  function optionen(A) {
    const s = szene(A), schon = A.gewaehlt[A.szene] || [], st = gespraechStand(A), zu = st && st.rest === 0 && !st.ueberzug;
    return (s.optionen || []).filter((o) => (!o.wenn || o.wenn(A, hilfen)) && !(s.art === "gespraech" && (!o.weiter || o.einmal) && schon.includes(o.id)) && !(zu && !o.weiter && !o.frei));
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
      // Zeit um, aber Nachfragen erlaubt: Jede weitere Frage kostet einen Schritt der Uhr
      const st = gespraechStand(A);
      if (st && st.rest === 0 && !o.weiter && !o.frei) { notiz(A, "Ihr nehmt euch die Zeit für eine weitere Frage.", "schlecht"); glocke(A, 1); }
      A.gewaehlt[A.szene].push(o.id);
      A.antwort = typeof o.antwort === "function" ? o.antwort(A, hilfen) : o.antwort || null;
      A.dialog = A.dialog || {}; A.dialog[A.szene] = A.dialog[A.szene] || [];
      if (!o.weiter) A.dialog[A.szene].push({ frage: o.frage || o.text, wer: o.wer || null, antwort: A.antwort, probe: o.probe ? o.probe.name : null, offen: Boolean(o.probe) });
      const n0 = (A.nachhallNeu || []).length;
      wirke(A, o);
      if (!o.weiter) folgenInsGespraech(A, n0);
      if (o.probe) { A.zwischenprobe = { opt: o.id, wuerfe: {}, wer: null }; return { ok: true, probe: true }; }
      if (o.weiter) { A.antwort = null; ziel(A, o); }
      return { ok: true };
    }
    if (s.art === "wahl") { A.letzteAbstimmung = null; A.letzteStimmen = null; entscheide(A, o); return { ok: true }; }
    return { fehler: "Hier wird nicht gewählt." };
  }
  function entscheide(A, o) {
    notiz(A, `Entscheidung: ${o.text}`, "runde");
    folge(A, o.text, "entscheidung");
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
      const n0 = (A.nachhallNeu || []).length;
      A.antwort = t; wirke(A, e); A.zwischenprobe = null;
      if (!e.weiter) folgenInsGespraech(A, n0);
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
    const zaehl = {}, texte = {};
    A.geheimChronik = A.geheimChronik || {}; A.geheimChronik[A.szene] = Object.assign({}, A.geheim);
    for (const [fid, ant] of Object.entries(A.geheim)) {
      const a = geheimFuer(A, fid).antworten.find((x) => x.id === ant); if (!a) continue;
      zaehl[ant] = (zaehl[ant] || 0) + 1; texte[ant] = a.kurz || a.text;
      if (a.setzt) wirke(A, { setzt: a.setzt(fid) });
    }
    // Wie die Gruppe entschieden hat – ohne Namen. Wer was gesagt hat, bleibt geheim (bis die Geschichte es aufgreift).
    if (s.verteilung !== false && Object.keys(zaehl).length) folge(A, Object.entries(zaehl).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} × ${texte[k]}`).join(" · "), "geheim");
    const ab = (typeof s.abschluss === "function" ? s.abschluss(A, hilfen) : s.abschluss) || "";
    if (ab) folge(A, ab, "abschluss");
    for (const [fid, ant] of Object.entries(A.geheim)) {
      const a = geheimFuer(A, fid).antworten.find((x) => x.id === ant); if (!a) continue;
      if (a.folge) folge(A, typeof a.folge === "function" ? a.folge(A, hilfen, fid) : a.folge);
      if (a.echo) folge(A, "☙" + fid + "|" + (typeof a.echo === "function" ? a.echo(A, hilfen, fid) : a.echo), "moment");
    }
    notiz(A, ab || "Jede Person hat für sich entschieden.");
    ziel(A, s);
  }

  /* ---------- Lagerfeuer ---------- */
  function lagerfeuer(A, s) {
    if (s.aufstieg && A.stufe < s.aufstieg && !modell10()) {
      const von = A.stufe; A.stufe = s.aufstieg; notiz(A, `Aufstieg: Die Gruppe erreicht Stufe ${A.stufe}.`, "gut");
      // Was jede Figur dazugewinnt (für den Aufstiegsbildschirm)
      A.aufstieg = { von, auf: A.stufe, helden: {} };
      for (const fid of A.gruppe) {
        if (A.zust[fid].tot) continue;
        const alt = F.faehigVon(fid, von).map((a) => a.id), neu = F.faehigVon(fid, A.stufe).filter((a) => !alt.includes(a.id));
        const k = F.KLASSEN[F.FIGUREN[fid].klasse];
        A.aufstieg.helden[fid] = { tp: [F.tpVon(fid, von), F.tpVon(fid, A.stufe)], neu: neu.map((a) => ({ name: a.name, text: a.text, typ: a.typ })),
          plaetze: k.plaetze ? [F.plaetzeVon(von), F.plaetzeVon(A.stufe)] : null };
      }
    }
    // Normal: Das Lagerfeuer heilt immer ganz. Hardcore: bei fortgeschrittener Uhr (ab 3) nur bis ¾.
    const unruhig = A.schwierigkeit === "hardcore" && A.glocke >= 3;
    for (const fid of A.gruppe) {
      const z = A.zust[fid]; if (z.tot) continue;
      const neuZ = frisch(fid, A.stufe), anteil = unruhig ? 0.75 : 1;
      if ((z.rucksack || []).some((d) => d.id === "manastein" && d.n > 0)) neuZ.plaetze[0]++;
      A.zust[fid] = Object.assign(neuZ, { tp: Math.max(z.tp, Math.floor(neuZ.tp * anteil)), rucksack: z.rucksack });
    }
    A.lagerZust = JSON.parse(JSON.stringify(A.zust)); A.lagerSzene = A.szene;
    // Hardcore: Wer gefallen ist, wählt am Lagerfeuer eine neue Figur
    A.ersatzOffen = A.gruppe.filter((f) => A.zust[f].tot);
    notiz(A, `Lagerfeuer: lange Rast${unruhig ? ` (${metaVon(A.abenteuer).uhr.unruhe || "das Flüstern lässt niemanden ganz schlafen"}: TP bis ¾)` : ""}. Gespeichert.`, "gut");
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
    const o = Object.assign({ figuren: A.gruppe.filter((f) => !A.zust[f].tot), stufe: A.stufe, schwierigkeit: A.schwierigkeit, bedrohung: bedrohung(A, s, k) }, k, { mischen: false, anfuehrer: false });
    if (A.kampfMod) o.skalaMal = (o.skalaMal || 1) * A.kampfMod;
    skala10(A, o);
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
    const o = Object.assign({ figuren: A.gruppe.filter((f) => !A.zust[f].tot), stufe: A.stufe, schwierigkeit: A.schwierigkeit, vorher, bedrohung: bedrohung(A, s, k) }, k);
    // Abwechslung: gemischte Startplätze, in etwa jedem dritten Kampf ein Anführer (nicht im Duell und nicht beim Endgegner)
    if (!o.gegner && !o.boss) { o.mischen = k.mischen !== false; o.anfuehrer = anfuehrerFestlegen(A, k); } // feste Plätze (z. B. Nester): mischen: false
    if (A.kampfMod) { o.skalaMal = (o.skalaMal || 1) * A.kampfMod; }
    skala10(A, o);
    return o;
  }
  /** Nach dem Kampf: Ergebnis übernehmen und weiter */
  function kampfEnde(A, st) {
    const s = szene(A), k = typeof s.kampf === "function" ? s.kampf(A, hilfen) : s.kampf;
    for (const f of R.spielerFiguren(st)) if (f.tot && !A.gefallen.includes(f.fid)) { A.gefallen.push(f.fid); notiz(A, `${f.name} ist gefallen.`, "schlecht"); }
    if (st.ereignisse) for (const e of st.ereignisse) if (s.ereignisse && s.ereignisse[e]) wirke(A, s.ereignisse[e]);
    // Ergebnis aus dem Kampf übernehmen (z. B. wie viele Gefangene gerettet wurden), egal wie er endet
    if (typeof k.nachher === "function") wirke(A, k.nachher(st, A));
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
      // Bekam das letzte Lagerfeuer nachträglich einen Stufenaufstieg (laufende Spielstände), wird er hier nachgeholt
      const ls = A.lagerSzene && DATEN(A).SZENEN[A.lagerSzene];
      if (ls && ls.aufstieg && A.stufe < ls.aufstieg && !modell10()) {
        A.stufe = ls.aufstieg; notiz(A, `Aufstieg: Die Gruppe erreicht Stufe ${A.stufe}.`, "gut");
        for (const fid of A.gruppe) { const z = A.zust[fid]; if (z && !z.tot) A.zust[fid] = Object.assign(frisch(fid, A.stufe), { rucksack: z.rucksack }); }
        A.lagerZust = JSON.parse(JSON.stringify(A.zust));
      }
      // Normal: Nach einem Rückzug sind alle wieder bei vollen TP (auch wenn das Lagerfeuer nur bis ¾ geheilt hatte)
      for (const fid of A.gruppe) { const z = A.zust[fid]; if (z && !z.tot) z.tp = Math.max(z.tp, F.tpVon(fid, z.stufe || A.stufe)); }
      return { ok: true, ergebnis: "rueckzug" }; // gleiche Szene beginnt neu
    }
    for (const fid of A.gruppe) A.zust[fid].tot = true;
    geheZu(A, DATEN(A).NIEDERLAGE);
    return { ok: true, ergebnis: "niederlage" };
  }

  /* ---------- Ansicht für Tisch und Handys ---------- */
  /** Rückschau am Ende: was die Gruppe getan hat, und Hinweise auf die Enden, die sie nicht gesehen hat */
  function rueckschau(A, s) {
    const D = DATEN(A), M = D.META || {};
    if (A.szene === D.NIEDERLAGE || s.niederlage) return null;
    let zeilen = typeof s.rueckschau === "function" ? s.rueckschau(A, hilfen) : s.rueckschau;
    zeilen = (zeilen && zeilen.length ? zeilen : (A.folgen || []).slice(-7)).filter(Boolean);
    const enden = Object.entries(D.SZENEN).filter(([id, x]) => x.art === "ende" && id !== D.NIEDERLAGE && !x.niederlage).map(([id]) => id);
    const andere = enden.filter((id) => id !== A.szene).map((id) => (M.endeHinweise || {})[id]).filter(Boolean);
    return { zeilen, andere, enden: enden.length };
  }
  function ansicht(A) {
    const s = szene(A), pz = probeZustand(A), p = pz ? aktuelleProbe(A) : null;
    return {
      dialog: (A.dialog && A.dialog[A.szene]) || [],
      szene: A.szene, art: s.art, titel: s.titel, ort: s.ort || "", abschnitt: s.abschnitt || A.abschnitt || 1, text: text(A), antwort: A.antwort || null,
      glocke: A.glocke, stufe: A.stufe, schwierigkeit: A.schwierigkeit, abenteuer: A.abenteuer || "grauwacht", uhr: metaVon(A.abenteuer).uhr,
      nachhall: A.nachhall || null,
      offen: s.art === "gespraech" ? optionen(A).filter((o) => !o.weiter).map((o) => ({ text: o.text, wichtig: Boolean(o.wichtig) })) : null,
      fragen: gespraechStand(A),
      rueckschau: s.art === "ende" ? rueckschau(A, s) : null,
      optionen: optionen(A).map((o) => ({ id: o.id, text: o.text, wichtig: Boolean(o.wichtig), kostet: Boolean(!o.weiter && !o.frei && gespraechStand(A) && gespraechStand(A).rest === 0), wer: o.wer || null, probe: o.probe ? { name: o.probe.name, attr: typeof o.probe.attr === "string" ? o.probe.attr : "", sg: sgVon(A, o.probe) } : null, weiter: Boolean(o.weiter) })),
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

  const API = { metaVon, empfStufe, bedrohung, datenVon, wiederbeleben, reliquieTraeger, beuteGeben, beuteLassen, darfTragen, getragen, geheimFuer, raetselTipp, raetselNeu, raetselAufgeben, raetselHinweise, ersatz, freieFiguren, neu, szene, text, optionen, waehle, stimme, auswerten, weiter, probeWer, probeWurf, bonus, aktuelleProbe, probeZustand, geheim, alleGeheim, kurzeRast,
    kampfOptionen, gegnerVorschau, kampfEnde, ansicht, speichern, laden, glocke, hilfen, lebende };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABS = API;
})(typeof window !== "undefined" ? window : globalThis);
