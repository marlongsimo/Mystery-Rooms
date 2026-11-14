/*
 * Mythara – Kampagnen-Werkzeug (ein Werkzeug für alle Abenteuer in daten/*.js)
 *
 *   node abenteuer/tools/kampagne.js pruefen [id|alle]
 *       Statische Prüfung: Start/Niederlage vorhanden, Verweise ins Leere, Sackgassen, nie erreichbare Szenen,
 *       unbekannte Begegnungen, fehlende Bilder, Enden passend zu js/enden.js (Heldensammlung).
 *   node abenteuer/tools/kampagne.js durchlauf <id|alle> [N=200] [--hardcore]
 *       Spielt das Abenteuer N-mal mit zufälligen Gruppen (META.min–max) und zufälligen Entscheidungen durch.
 *       Kämpfe steuert die eingebaute KI; manchmal gibt die Gruppe auf (damit auch Niederlage-Wege vorkommen).
 *   node abenteuer/tools/kampagne.js kaempfe <id> [N=150] [--hardcore] [--nur=a,b] [--helden] [--kalibrieren]
 *       Siegquote, übriges Leben und Runden je Kampf und Gruppengröße, so wie die Szenen die Kämpfe aufbauen.
 *       --helden: zusätzlich Ranking der Helden. --kalibrieren: Lebensfaktor je Gruppengröße so suchen, dass die
 *       Zielquote erreicht wird (META.zielquoten[szene], sonst 0,8) und in js/regeln.js schreiben.
 *       Warnt (⚠), wenn der Faktor am Anschlag ist (zu wenige oder zu viele Gegner), der Kampf über 12 Runden
 *       dauert oder die Nachmessung mehr als 10 Punkte neben dem Ziel liegt.
 *   node abenteuer/tools/kampagne.js enden
 *       Schreibt js/enden.js (reguläre Enden aller Abenteuer für die Heldensammlung) und gibt die SQL-Zeilen
 *       für rpg_adventure_endings aus (im Supabase SQL Editor ausführen, sobald ein neues Abenteuer live geht).
 *
 *   node abenteuer/tools/kampagne.js aufbau <id> [N=60] [--hardcore] [--nur=a,b]
 *       Schlägt je Kampf eine Gegnerzahl vor: probiert mehrere Mengen (60 % bis 200 % der eingetragenen Zahl),
 *       kalibriert jede kurz und zeigt, bei welcher Menge der Kampf 5–9 Runden dauert und der Lebensfaktor
 *       im gesunden Bereich bleibt. Schreibt nichts; die Zahlen trägt man in js/regeln.js ein und kalibriert dann.
 *   node abenteuer/tools/kampagne.js alles <id> [--kalibrieren] [--ohne-browser]
 *       Alles nacheinander: prüfen, 200 Durchläufe, Kämpfe (Normal und Hardcore), Karten-Kontrolle, Browsertest.
 *       Mit --kalibrieren werden die Kämpfe vorher für Normal und Hardcore kalibriert. Am Ende eine Zusammenfassung.
 *   node abenteuer/tools/kampagne.js freigeben <id>
 *       Freigabe in einem Schritt: entfernt META.entwurf, erzeugt js/enden.js, ergänzt die Enden in Migration 006
 *       und im lokalen Datenbanktest, zählt die Versionsnummern in index.html/handy.html hoch und gibt die
 *       SQL-Zeile für Supabase aus (nur die neuen Enden dieses Abenteuers).
 *
 * Reguläres Ende = Szene mit art "ende", nicht D.NIEDERLAGE und nicht als niederlage: true markiert.
 */
"use strict";
const fs = require("fs"), path = require("path");
const WURZEL = path.join(__dirname, "..");
const R = require("../js/regeln.js"), S = require("../js/szenen.js"), F = R.FD;

/* ---------- Abenteuer laden ---------- */
const ALLE = {};
for (const f of fs.readdirSync(path.join(WURZEL, "daten")).filter((f) => f.endsWith(".js")).sort()) {
  const D = require(path.join(WURZEL, "daten", f));
  if (D && D.SZENEN) ALLE[(D.META && D.META.id) || f.replace(/\.js$/, "")] = D;
}
const ids = () => Object.keys(ALLE);
function daten(id) { const D = ALLE[id]; if (!D) throw new Error(`Unbekanntes Abenteuer „${id}“. Vorhanden: ${ids().join(", ")}`); return D; }

/* ---------- Enden ---------- */
const istRegulaeresEnde = (D, id) => D.SZENEN[id].art === "ende" && id !== D.NIEDERLAGE && !D.SZENEN[id].niederlage;
function endenVon(id) {
  const D = daten(id);
  return Object.keys(D.SZENEN).filter((s) => istRegulaeresEnde(D, s)).map((s) => ({ id: s, titel: D.SZENEN[s].titel }));
}
function endenTabelle() {
  const t = {};
  // Reihenfolge wie im Hub: leichtere Abenteuer zuerst
  const reihe = ids().sort((a, b) => (ALLE[a].META.schwierigkeit || 1) - (ALLE[b].META.schwierigkeit || 1) || (ALLE[a].META.reihe || 0) - (ALLE[b].META.reihe || 0));
  for (const id of reihe) { const D = ALLE[id]; if (D.META && D.META.entwurf) continue; t[id] = { titel: D.META.titel, ehrentitel: D.META.ehrentitel || "", enden: Object.fromEntries(endenVon(id).map((e) => [e.id, e.titel])) }; }
  return t;
}
function endenDatei(t = endenTabelle()) {
  return `/*
 * Mythara – reguläre Enden aller Abenteuer (für die Heldensammlung, js/sammlung.js)
 * NICHT VON HAND ÄNDERN: wird aus daten/*.js erzeugt mit  node abenteuer/tools/kampagne.js enden
 * Muss zu public.rpg_adventure_endings in der Datenbank passen (dieselbe Ausgabe liefert die SQL-Zeilen).
 */
(function (root) {
  "use strict";
  root.ABENDEN = ${JSON.stringify(t, null, 2).replace(/\n/g, "\n  ")};
})(typeof window !== "undefined" ? window : globalThis);
`;
}
function endenSql(t = endenTabelle()) {
  const zeilen = Object.entries(t).flatMap(([ab, v]) => Object.keys(v.enden).map((e) => `('${ab}', '${e}')`));
  return `insert into public.rpg_adventure_endings (adventure, ending) values\n  ${zeilen.join(",\n  ")}\non conflict do nothing;`;
}

/* ---------- Statische Prüfung ---------- */
// Schlüssel, deren Text-Wert eine Szene sein MUSS (richtig/falsch/abschluss sind bei Rätseln und Proben Texte)
const ZIEL_SCHLUESSEL = new Set(["weiter", "sieg", "verloren", "gefangen", "niederlage"]);
const ARTEN = new Set(["erzaehlung", "gespraech", "wahl", "geheim", "probe", "kampf", "lager", "raetsel", "ende"]);
const sid_regulaer = (D, x) => x !== D.SZENEN[D.NIEDERLAGE] && !x.niederlage;
const enden_anzahl = (D) => Object.values(D.SZENEN).filter((x) => x.art === "ende" && sid_regulaer(D, x)).length;
function pruefen(id) {
  const D = daten(id), sz = D.SZENEN, fehler = [], hinweise = [], kanten = {};
  const istSzene = (x) => typeof x === "string" && Object.prototype.hasOwnProperty.call(sz, x);
  const quelleZiele = (fn) => (String(fn).match(/["'`]([a-z0-9_]+)["'`]/g) || []).map((q) => q.slice(1, -1)).filter(istSzene);
  const begegnungen = new Set();
  // Zufallsereignisse (D.EREIGNISSE) zieht der Spielkern über hilfen.ereignis(); zurück geht es über A.ereignisZiel
  const ereignisIds = (D.EREIGNISSE || []).map((e) => e.id).filter(istSzene);
  for (const e of D.EREIGNISSE || []) if (!istSzene(e.id)) fehler.push(`Ereignis „${e.id}“ hat keine Szene`);
  for (const [sid, s] of Object.entries(sz)) {
    const ziele = new Set();
    if (!ARTEN.has(s.art)) fehler.push(`${sid}: unbekannte Art „${s.art}“`);
    if (!s.titel) hinweise.push(`${sid}: ohne Titel`);
    if (s.text == null) fehler.push(`${sid}: ohne Text`);
    const lauf = (v, weg, schluessel) => {
      if (typeof v === "function") { quelleZiele(v).forEach((z) => ziele.add(z)); (String(v).match(/begegnung:\s*["'`]([a-z0-9_]+)["'`]/g) || []).forEach((m) => begegnungen.add(m.replace(/.*["'`]([a-z0-9_]+)["'`].*/, "$1"))); return; }
      if (Array.isArray(v)) { v.forEach((x, i) => lauf(x, `${weg}[${i}]`, schluessel)); return; }
      if (v && typeof v === "object") { for (const [k, x] of Object.entries(v)) { if (k === "begegnung" && typeof x === "string") begegnungen.add(x); lauf(x, `${weg}.${k}`, k); } return; }
      if (typeof v === "string") {
        if (ZIEL_SCHLUESSEL.has(schluessel)) { if (istSzene(v)) ziele.add(v); else fehler.push(`${sid}: Verweis ins Leere ${weg} → „${v}“`); }
        else if (istSzene(v) && v !== sid) ziele.add(v);
      }
    };
    for (const [k, v] of Object.entries(s)) if (k !== "titel" && k !== "ort") lauf(v, k, k);
    const fns = [], sammleFn = (v) => { if (typeof v === "function") fns.push(String(v)); else if (Array.isArray(v)) v.forEach(sammleFn); else if (v && typeof v === "object") Object.values(v).forEach(sammleFn); };
    sammleFn(s); const quelle = fns.join("\n");
    if (/\bereignis\(/.test(quelle)) ereignisIds.forEach((e) => ziele.add(e));
    if (/ereignisZiel/.test(quelle)) ziele.add("@ereignisZiel");
    ziele.delete(sid);
    kanten[sid] = ziele;
    if (s.art !== "ende" && !ziele.size && s.art !== "kampf") fehler.push(`${sid}: Sackgasse (kein Weg hinaus)`);
  }
  if (!istSzene(D.START)) fehler.push(`START „${D.START}“ gibt es nicht`);
  if (!istSzene(D.NIEDERLAGE)) fehler.push(`NIEDERLAGE „${D.NIEDERLAGE}“ gibt es nicht`);
  // Erreichbarkeit ab dem Start (Niederlage ist immer erreichbar: jeder Kampf kann verloren gehen)
  const erreicht = new Set([D.START, D.NIEDERLAGE]), offen = [D.START];
  while (offen.length) { const x = offen.pop(); for (const z of kanten[x] || []) if (istSzene(z) && !erreicht.has(z)) { erreicht.add(z); offen.push(z); } }
  const nie = Object.keys(sz).filter((x) => !erreicht.has(x));
  if (nie.length) hinweise.push(`statisch nie erreichbar (bitte mit „durchlauf“ prüfen): ${nie.join(", ")}`);
  for (const b of begegnungen) if (!R.BEGEGNUNGEN[b]) fehler.push(`Begegnung „${b}“ gibt es nicht in js/regeln.js`);
  // Bilder: jeder Pfad img/… in den Daten muss als Datei existieren
  const bilder = new Set(), sammle = (v) => { if (typeof v === "string") { if (/^img\/.+\.(webp|jpe?g|png)$/.test(v)) bilder.add(v); } else if (Array.isArray(v)) v.forEach(sammle); else if (v && typeof v === "object") Object.values(v).forEach(sammle); };
  sammle(D.META); sammle(D.KARTEN || {});
  for (const b of bilder) if (!fs.existsSync(path.join(WURZEL, b))) (D.META.entwurf ? hinweise : fehler).push(`Bild fehlt: ${b}`);
  // Enden für die Heldensammlung
  const enden = endenVon(id);
  if (!enden.length) fehler.push("kein reguläres Ende");
  // Erzähltiefe: Merker, die eine Entscheidung setzt und die nie wieder jemand liest – die Entscheidung bleibt folgenlos
  {
    const src = fs.readFileSync(path.join(WURZEL, "daten", id + ".js"), "utf8"), gesetzt = new Set(), gelesen = new Set();
    for (const m of src.matchAll(/setzt:\s*(?:\([^)]*\)\s*=>\s*\(?\s*)?\{([^}]*)\}/g)) for (const k of m[1].matchAll(/(?:\[\s*"([a-z_0-9]+)"\s*\+|(?:^|,)\s*([a-z_0-9]+)\s*:)/g)) gesetzt.add(k[1] ? k[1] + "*" : k[2]);
    for (const m of src.matchAll(/merker\.([a-z_0-9]+)/g)) gelesen.add(m[1]);
    for (const m of src.matchAll(/merker\[\s*"([a-z_0-9]+)"\s*\+/g)) gelesen.add(m[1] + "*");
    for (const m of src.matchAll(/\bm\.([a-z_0-9]+)/g)) gelesen.add(m[1]);
    for (const m of src.matchAll(/startsWith\("([a-z_0-9]+)"\)/g)) gelesen.add(m[1] + "*");
    const stumm = [...gesetzt].filter((k) => !gelesen.has(k));
    if (stumm.length) hinweise.push(`Folgenlose Entscheidungen: Diese Merker werden gesetzt, aber nie gelesen: ${stumm.join(", ")}. Entweder später darauf reagieren oder die Entscheidung streichen.`);
    const ohneFolge = (src.match(/setzt:/g) || []).length - (src.match(/folge:/g) || []).length;
    if (!/folge:/.test(src)) hinweise.push("Keine einzige sichtbare Folge („folge: …“): Die Gruppe sieht nicht, was ihre Entscheidungen bewirken.");
    else if (ohneFolge > 6) hinweise.push(`Etwa ${ohneFolge} Entscheidungen setzen einen Merker ohne sichtbare Folge („folge: …“).`);
    if (Object.values(sz).some((x) => x.art === "ende" && sid_regulaer(D, x)) && !D.META.endeHinweise && enden_anzahl(D) > 1) hinweise.push("META.endeHinweise fehlt: Am Ende erfährt die Gruppe nicht, woran die anderen Enden hängen.");
  }
  if (!D.META.ehrentitel) hinweise.push("META.ehrentitel fehlt (Kampagnentitel, wenn alle Enden gefunden sind)");
  if (!D.META.entwurf) {
    const gen = loadEndenDatei(), soll = Object.fromEntries(enden.map((e) => [e.id, e.titel]));
    if (!gen || !gen[id] || JSON.stringify(gen[id].enden) !== JSON.stringify(soll)) fehler.push("js/enden.js passt nicht zu den Daten – bitte „node abenteuer/tools/kampagne.js enden“ ausführen (und die SQL-Zeilen in Supabase)");
  }
  return { id, titel: D.META.titel, szenen: Object.keys(sz).length, kaempfe: Object.values(sz).filter((s) => s.art === "kampf").length, enden, begegnungen: [...begegnungen], bilder: bilder.size, fehler, hinweise };
}
function loadEndenDatei() {
  const p = path.join(WURZEL, "js/enden.js"); if (!fs.existsSync(p)) return null;
  const sandbox = {}; new Function("window", "globalThis", fs.readFileSync(p, "utf8"))(sandbox, sandbox); return sandbox.ABENDEN;
}

/* ---------- Durchlauf ---------- */
function durchlauf(id, N = 200, o = {}) {
  const D = daten(id), min = Math.max(2, D.META.min || 3), max = D.META.max || 6;
  const besucht = new Set(), enden = {}, fehler = [], durch = {};
  function spiel(seed, n) {
    const r = R.rng(seed), z = (k) => Math.floor(r() * k);
    const A = S.neu(seed, { gruppe: F.REIHE.slice().sort(() => r() - 0.5).slice(0, n), schwierigkeit: o.hardcore ? "hardcore" : "normal", abenteuer: id });
    for (let schritt = 0; schritt < 500; schritt++) {
      const s = S.szene(A); besucht.add(A.szene);
      // Jede Szene muss sich anzeigen lassen: Text nur aus Zeichenketten (fängt z. B. vertauschte Hilfsfunktionen ab)
      { const v = S.ansicht(A), kaputt = v.text.find((t) => typeof t !== "string"); if (kaputt !== undefined) throw new Error("Text ist keine Zeichenkette in " + A.szene + ": " + JSON.stringify(kaputt)); }
      if (A.beute) { const d = A.beute.dinge[0], f = S.lebende(A).find((x) => S.darfTragen(A, x, d)); if (f) S.beuteGeben(A, d, f); else S.beuteLassen(A); continue; }
      if (A.aufstieg) A.aufstieg = null;
      if (A.ersatzOffen && A.ersatzOffen.length && s.art === "lager") { for (const alt of A.ersatzOffen.slice()) S.ersatz(A, alt, S.freieFiguren(A)[0]); continue; }
      if (s.art === "ende") return A.szene;
      if (s.art === "erzaehlung" || s.art === "lager") { if (s.rastErlaubt && r() < 0.3) S.kurzeRast(A); S.weiter(A); continue; }
      if (s.art === "gespraech") {
        if (A.zwischenprobe) { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); continue; }
        const opt = S.optionen(A), frag = opt.filter((x) => !x.weiter), w = opt.filter((x) => x.weiter);
        S.waehle(A, (frag.length && r() < 0.7 ? frag[z(frag.length)] : w[z(w.length)]).id); continue;
      }
      if (s.art === "wahl") { for (const f of S.lebende(A)) { const opt = S.optionen(A); S.stimme(A, f, opt[z(opt.length)].id); } S.auswerten(A); continue; }
      if (s.art === "geheim") { for (const f of S.lebende(A)) { const q = S.geheimFuer(A, f); S.geheim(A, f, q.antworten[z(q.antworten.length)].id); } S.weiter(A); continue; }
      if (s.art === "probe") {
        if (A.ergebnis) { S.weiter(A); continue; }
        if (A.probe.wer === "gruppe") for (const f of S.lebende(A)) S.probeWurf(A, f); else { const f = S.lebende(A)[z(S.lebende(A).length)]; S.probeWer(A, f); S.probeWurf(A, f); }
        continue;
      }
      if (s.art === "raetsel") {
        if (r() < 0.6) for (const x of s.loesung) S.raetselTipp(A, x); else for (const x of s.glocken.map((g) => g.id).sort(() => r() - 0.5)) S.raetselTipp(A, x);
        continue;
      }
      if (s.art === "kampf") {
        const st = R.neuesSpiel(seed + schritt, S.kampfOptionen(A)); let k = 0;
        // manchmal gibt die Gruppe auf oder lässt eine Begleitung im Stich, damit auch diese Wege vorkommen
        const aufgeben = r() < 0.12, stich = r() < 0.2;
        while (!st.ende && k++ < 4000) {
          if (aufgeben && st.runde >= 3) { for (const f of R.spielerFiguren(st)) R.schaden(st, f, 999); if (st.ende) break; }
          const b = R.begleiterVon && R.begleiterVon(st);
          if (R.aktiv(st).seite === "gegner") R.gegnerZug(st);
          else if (stich && b && b.tp > 0 && !b.gefesselt && st.eskorte) { b.tp = 0; st.eskorte.unten = st.runde; R.zugEnde(st); }
          else R.autoZug(st);
        }
        if (!st.ende) throw new Error("Kampf endet nicht: " + A.szene + " · Runde " + st.runde + " · " + st.figuren.filter((f) => f.tp > 0).map((f) => `${f.name}@${f.x},${f.y} ${f.tp}TP${Object.keys(f.z || {}).length ? " [" + Object.keys(f.z).join(",") + "]" : ""}`).join("; ") + " · zuletzt: " + st.log.slice(-6).map((l) => l.t).join(" / "));
        S.kampfEnde(A, st); continue;
      }
      throw new Error("Unbekannte Szenenart " + s.art + " in " + A.szene);
    }
    throw new Error("Zu viele Schritte, hängt in " + A.szene);
  }
  for (let i = 0; i < N; i++) {
    const n = min + (i % (max - min + 1));
    try { const e = spiel(1000 + i * 7 + id.length, n); enden[e] = (enden[e] || 0) + 1; durch[n] = durch[n] || { s: 0, n: 0 }; durch[n].n++; if (istRegulaeresEnde(D, e)) durch[n].s++; }
    catch (e) { fehler.push(`Lauf ${i} (${n} Helden): ${e.stack.split("\n").slice(0, 3).join(" | ")}`); }
  }
  // Niederlage-Szene erreicht man im Normalmodus nur, wenn das Abenteuer sie dort vorsieht: nicht als Fehler werten
  const nie = Object.keys(D.SZENEN).filter((x) => !besucht.has(x) && x !== D.NIEDERLAGE);
  const fehlendeEnden = endenVon(id).map((e) => e.id).filter((e) => !enden[e]);
  return { id, N, enden, durch, nie, fehlendeEnden, fehler };
}

/* ---------- Kämpfe ---------- */
function kaempfe(id, N = 150, o = {}) {
  const D = daten(id), GR = [];
  for (let n = Math.max(2, D.META.min || 3); n <= (D.META.max || 6); n++) GR.push(n);
  const liste = Object.keys(D.SZENEN).filter((s) => D.SZENEN[s].art === "kampf" && (!o.nur || !o.nur.length || o.nur.includes(s)));
  const ziel = (s) => (D.META.zielquoten && D.META.zielquoten[s]) || 0.8;
  const held = {}; for (const f of F.REIHE) held[f] = { k: 0, s: 0, tp: 0, boden: 0 };
  function kampf(sid, n, i, skala, zaehlen) {
    const r = R.rng(sid.length * 7919 + n * 104729 + i), gruppe = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
    const A = S.neu(9e5 + i * 17 + n, { gruppe, abenteuer: id, schwierigkeit: o.hardcore ? "hardcore" : "normal" });
    // Stufe: aus der Szene, sonst die der Begegnung (so stark ist die Gruppe dort im echten Spiel)
    A.szene = sid; A.stufe = D.SZENEN[sid].stufe || (R.BEGEGNUNGEN[S.kampfOptionen(A).begegnung] || {}).stufe || A.stufe || 1;
    // Helden ausgeruht auf dieser Stufe (volle TP und Zauberplätze der Stufe, wie nach dem Aufstieg im echten Spiel)
    for (const f of gruppe) Object.assign(A.zust[f], { stufe: A.stufe, tp: F.tpVon(f, A.stufe), plaetze: F.KLASSEN[F.FIGUREN[f].klasse].plaetze ? F.PLAETZE[A.stufe].slice() : [0, 0] });
    const opt = S.kampfOptionen(A); if (skala != null) opt.skala = skala;
    const st = R.neuesSpiel(7e6 + i * 31 + n * 7 + sid.length, opt), unten = {}; let k = 0;
    while (!st.ende && k++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); if (zaehlen) for (const f of R.spielerFiguren(st)) if (f.tp <= 0) unten[f.fid] = true; }
    const sp = R.spielerFiguren(st), sieg = st.ende === "sieg";
    if (zaehlen) for (const f of sp) { const h = held[f.fid]; if (!h) continue; h.k++; if (sieg) h.s++; h.tp += sieg ? Math.max(0, f.tp) / f.tpMax : 0; if (unten[f.fid]) h.boden++; }
    return { sieg, leben: sieg ? sp.reduce((a, f) => a + Math.max(0, f.tp) / f.tpMax, 0) / sp.length : 0, runden: st.runde, haengt: !st.ende, begegnung: opt.begegnung };
  }
  function messen(sid, n, skala, m = N, zaehlen) {
    let s = 0, l = 0, r = 0, h = 0, beg = null;
    for (let i = 0; i < m; i++) { const e = kampf(sid, n, i, skala, zaehlen); s += e.sieg; l += e.leben; r += e.runden; h += e.haengt; beg = e.begegnung; }
    return { sieg: s / m, leben: l / m, runden: r / m, haengt: h, begegnung: beg };
  }
  const ergebnis = [];
  for (const sid of liste) {
    if (o.kalibrieren) {
      const tab = {}, warnungen = []; let beg = null;
      for (const n of GR) {
        let lo = 0.25, hi = 8;
        for (let it = 0; it < 7; it++) { const mid = Math.sqrt(lo * hi), e = messen(sid, n, mid, Math.max(40, Math.round(N / 2))); beg = e.begegnung; if (e.sieg > ziel(sid)) lo = mid; else hi = mid; }
        tab[n] = +Math.sqrt(lo * hi).toFixed(2);
        // Nachmessen und warnen, wenn der Faktor allein das Ziel nicht sinnvoll erreicht
        const e = messen(sid, n, tab[n], Math.max(60, Math.round(N / 2)));
        if (tab[n] >= 5.5) warnungen.push(`${n} Helden: Faktor ${tab[n]} ist sehr hoch – die Gegner werden zu zähen Brocken. Besser mehr Gegner je Held einplanen (Anzahl oder Höchstzahl in der Begegnung erhöhen).`);
        else if (tab[n] <= 0.45) warnungen.push(`${n} Helden: Faktor ${tab[n]} ist sehr niedrig – die Begegnung ist für diese Gruppe zu groß. Besser weniger oder schwächere Gegner einplanen.`);
        if (e.runden > 12) warnungen.push(`${n} Helden: Der Kampf dauert im Schnitt ${e.runden.toFixed(1)} Runden – das zieht sich. Mehr Gegner mit weniger Leben oder ein kürzerer Weg zueinander helfen.`);
        if (Math.abs(e.sieg - ziel(sid)) > 0.1) warnungen.push(`${n} Helden: Nachmessung ${Math.round(e.sieg * 100)} % statt Ziel ${Math.round(ziel(sid) * 100)} % – mit mehr Läufen wiederholen oder den Faktor von Hand nachziehen.`);
        if (e.haengt) warnungen.push(`${n} Helden: ${e.haengt} simulierte Kämpfe finden kein Ende (Karte oder Gegner prüfen).`);
      }
      if (!tab[2]) tab[2] = tab[Math.min(...GR)];
      const datei = path.join(WURZEL, "js/regeln.js"); let txt = fs.readFileSync(datei, "utf8");
      const feld = o.hardcore ? "skalaHC" : "skala", neu = `${feld}: { ${[2, 3, 4, 5, 6].map((n) => `${n}: ${tab[n] != null ? tab[n] : tab[Math.max(...GR)]}`).join(", ")} }`;
      const re = new RegExp(`(    ${beg}: \\{[^\\n]*?)${feld}: \\{[^}]*\\}`);
      if (!re.test(txt)) { ergebnis.push({ sid, fehler: `Begegnung ${beg}: kein Feld ${feld} in js/regeln.js gefunden – bitte einmal von Hand anlegen` }); continue; }
      fs.writeFileSync(datei, txt.replace(re, `$1${neu}`));
      ergebnis.push({ sid, begegnung: beg, kalibriert: tab, feld, warnungen });
    } else {
      const je = {}; let beg = null;
      for (const n of GR) { const e = messen(sid, n, null, N, o.helden); je[n] = e; beg = e.begegnung; }
      ergebnis.push({ sid, begegnung: beg, ziel: ziel(sid), je });
    }
  }
  const ranking = o.helden ? F.REIHE.map((f) => ({ f, q: held[f].k ? held[f].s / held[f].k : 0, tp: held[f].k ? held[f].tp / held[f].k : 0, b: held[f].k ? held[f].boden / held[f].k : 0 })).sort((a, b) => b.q - a.q || b.tp - a.tp) : null;
  return { id, GR, ergebnis, ranking };
}

/* ---------- Aufbau: Gegnerzahl vorschlagen ---------- */
function aufbau(id, N = 60, o = {}) {
  const D = daten(id), GR = [];
  for (let n = Math.max(2, D.META.min || 3); n <= (D.META.max || 6); n++) GR.push(n);
  const liste = Object.keys(D.SZENEN).filter((s) => D.SZENEN[s].art === "kampf" && (!o.nur || !o.nur.length || o.nur.includes(s)));
  const ziel = (s) => (D.META.zielquoten && D.META.zielquoten[s]) || 0.8;
  const MENGEN = [0.6, 0.8, 1, 1.3, 1.6, 2];
  function kampf(sid, n, i, skala) {
    const r = R.rng(sid.length * 7919 + n * 104729 + i), gruppe = F.REIHE.slice().sort(() => r() - 0.5).slice(0, n);
    const A = S.neu(9e5 + i * 17 + n, { gruppe, abenteuer: id, schwierigkeit: o.hardcore ? "hardcore" : "normal" });
    A.szene = sid; A.stufe = D.SZENEN[sid].stufe || (R.BEGEGNUNGEN[S.kampfOptionen(A).begegnung] || {}).stufe || 1;
    for (const f of gruppe) Object.assign(A.zust[f], { stufe: A.stufe, tp: F.tpVon(f, A.stufe), plaetze: F.KLASSEN[F.FIGUREN[f].klasse].plaetze ? F.PLAETZE[A.stufe].slice() : [0, 0] });
    const opt = S.kampfOptionen(A); opt.skala = skala;
    const st = R.neuesSpiel(7e6 + i * 31 + n * 7 + sid.length, opt); let k = 0;
    while (!st.ende && k++ < 4000) { if (R.aktiv(st).seite === "gegner") R.gegnerZug(st); else R.autoZug(st); }
    return { sieg: st.ende === "sieg", runden: st.runde, begegnung: opt.begegnung, gegner: st.figuren.filter((f) => f.seite === "gegner").length };
  }
  const messen = (sid, n, skala, m) => { let s = 0, r = 0, g = 0, beg = null; for (let i = 0; i < m; i++) { const e = kampf(sid, n, i, skala); s += e.sieg; r += e.runden; g += e.gegner; beg = e.begegnung; } return { sieg: s / m, runden: r / m, gegner: g / m, begegnung: beg }; };
  const out = [];
  for (const sid of liste) {
    const beg = messen(sid, GR[0], 1, 1).begegnung, B = R.BEGEGNUNGEN[beg];
    if (!B || !B.gegner) { out.push({ sid, fehler: "Kampf ohne Begegnung (feste Gegner): kein Vorschlag möglich" }); continue; }
    const original = B.gegner, zeilen = [];
    for (const m of MENGEN) {
      // Genau festgelegte Gegner (Anführer, Bosse: „je Figur 0“) bleiben, alle anderen skalieren mit
      B.gegner = original.map(([art, je, max, basis]) => (je === 0 ? [art, je, max, basis] : [art, +(je * m).toFixed(2), max ? Math.max(1, Math.round(max * Math.max(1, m))) : max, basis]));
      let strafe = 0; const je = {};
      for (const n of GR) {
        let lo = 0.25, hi = 8;
        for (let it = 0; it < 5; it++) { const mid = Math.sqrt(lo * hi); if (messen(sid, n, mid, Math.max(24, Math.round(N / 2))).sieg > ziel(sid)) lo = mid; else hi = mid; }
        const fk = +Math.sqrt(lo * hi).toFixed(2), e = messen(sid, n, fk, N);
        je[n] = { faktor: fk, runden: e.runden, sieg: e.sieg, gegner: e.gegner };
        strafe += Math.max(0, 5 - e.runden) + Math.max(0, e.runden - 9) * 1.5 + Math.max(0, fk - 3.5) * 2 + Math.max(0, 0.7 - fk) * 6 + Math.abs(e.sieg - ziel(sid)) * 10;
      }
      zeilen.push({ menge: m, gegner: B.gegner, je, strafe: strafe / GR.length });
    }
    B.gegner = original;
    const beste = zeilen.slice().sort((a, b) => a.strafe - b.strafe)[0];
    out.push({ sid, begegnung: beg, ziel: ziel(sid), zeilen, beste });
  }
  return { id, GR, ergebnis: out };
}

/* ---------- Freigabe in einem Schritt ---------- */
function freigeben(id) {
  const D = daten(id), schritte = []; let neuFrei = false;
  const datei = path.join(WURZEL, "daten", id + ".js"); let txt = fs.readFileSync(datei, "utf8");
  if (/entwurf:\s*true,?\s*/.test(txt)) { fs.writeFileSync(datei, txt.replace(/entwurf:\s*true,?\s*/, "")); D.META.entwurf = false; neuFrei = true; schritte.push("META.entwurf entfernt"); }
  else schritte.push("war schon freigegeben (kein META.entwurf)");
  const p = pruefenOhneEnden(id); if (p.length) return { id, fehler: p };
  const t = endenTabelle(); fs.writeFileSync(path.join(WURZEL, "js/enden.js"), endenDatei(t)); schritte.push("js/enden.js erzeugt");
  // Migration 006: fehlende Enden an die Liste hängen
  const mig = path.join(WURZEL, "supabase/006_rpg_heldensammlung.sql"); let sql = fs.readFileSync(mig, "utf8");
  const neu = Object.keys(t[id].enden).filter((e) => !sql.includes(`('${id}', '${e}')`));
  if (neu.length) {
    const re = /(insert into public\.rpg_adventure_endings \(adventure, ending\) values[\s\S]*?)\n(on conflict do nothing;)/;
    if (!re.test(sql)) return { id, fehler: ["Liste der Enden in Migration 006 nicht gefunden"] };
    fs.writeFileSync(mig, sql.replace(re, `$1,\n  ${neu.map((e) => `('${id}', '${e}')`).join(", ")}\n$2`)); schritte.push(`Migration 006: ${neu.length} Enden ergänzt`);
  }
  // Lokaler Datenbanktest zählt die Enden
  const test = path.join(WURZEL, "supabase/tests/006_rpg_heldensammlung_test.sql");
  if (fs.existsSync(test)) {
    const gesamt = Object.values(t).reduce((a, v) => a + Object.keys(v.enden).length, 0); let tt = fs.readFileSync(test, "utf8");
    const re2 = /rpg_adventure_endings\) = \d+, 'Katalog: 15 Helden, \d+ Enden'/;
    if (re2.test(tt)) { fs.writeFileSync(test, tt.replace(re2, `rpg_adventure_endings) = ${gesamt}, 'Katalog: 15 Helden, ${gesamt} Enden'`)); schritte.push(`Datenbanktest erwartet jetzt ${gesamt} Enden`); }
  }
  // Versionsnummern hochzählen, damit Browser die neuen Dateien laden
  if (neuFrei || neu.length) for (const h of ["index.html", "handy.html"]) {
    const hp = path.join(WURZEL, h); if (!fs.existsSync(hp)) continue; let html = fs.readFileSync(hp, "utf8"), geaendert = false;
    for (const f of [`daten/${id}.js`, "js/enden.js"]) html = html.replace(new RegExp(`(${f.replace(/[.\/]/g, "\\$&")}\\?v=)(\\d+)`), (_, a, n) => { geaendert = true; return a + (+n + 1); });
    if (geaendert) { fs.writeFileSync(hp, html); schritte.push(`${h}: Versionsnummern erhöht`); }
  }
  const zeilen = Object.keys(t[id].enden).map((e) => `('${id}', '${e}')`);
  return { id, schritte, sql: `insert into public.rpg_adventure_endings (adventure, ending) values\n  ${zeilen.join(",\n  ")}\non conflict do nothing;` };
}
/** Prüfung vor der Freigabe: alles außer „js/enden.js passt nicht“ (das erledigt die Freigabe selbst) */
function pruefenOhneEnden(id) { return pruefen(id).fehler.filter((f) => !/js\/enden\.js passt nicht/.test(f)); }

/* ---------- Befehlszeile ---------- */
module.exports = { ALLE, ids, pruefen, durchlauf, kaempfe, aufbau, freigeben, endenVon, endenTabelle, endenDatei, endenSql, loadEndenDatei, istRegulaeresEnde };
if (require.main === module) {
  const a = process.argv.slice(2), befehl = a[0], ziel = a[1] && !a[1].startsWith("--") && !/^\d+$/.test(a[1]) ? a[1] : "alle";
  const N = +(a.find((x) => /^\d+$/.test(x)) || 0) || undefined, flag = (n) => a.includes("--" + n);
  const wert = (n) => { const x = a.find((y) => y.startsWith("--" + n + "=")); return x ? x.split("=")[1] : ""; };
  const welche = ziel === "alle" ? ids() : [ziel];
  let schlecht = false;
  if (befehl === "pruefen") {
    for (const id of welche) {
      const p = pruefen(id);
      console.log(`\n${p.titel} (${id}): ${p.szenen} Szenen, ${p.kaempfe} Kämpfe, ${p.enden.length} reguläre Enden, ${p.begegnungen.length} Begegnungen, ${p.bilder} Bilder`);
      p.fehler.forEach((f) => console.log("  ✗ " + f)); p.hinweise.forEach((h) => console.log("  · " + h));
      if (!p.fehler.length) console.log("  ✓ keine Fehler");
      schlecht = schlecht || p.fehler.length > 0;
    }
  } else if (befehl === "durchlauf") {
    for (const id of welche) {
      const d = durchlauf(id, N || 200, { hardcore: flag("hardcore") });
      console.log(`\n${daten(id).META.titel} · ${d.N} Durchläufe${flag("hardcore") ? " · Hardcore" : ""}`);
      console.log("  Enden: " + Object.entries(d.enden).map(([e, n]) => `${e} ${n}`).join(" · "));
      console.log("  Reguläres Ende erreicht je Gruppengröße: " + Object.entries(d.durch).map(([n, q]) => `${n}: ${Math.round(q.s / q.n * 100)} %`).join(" · "));
      console.log(d.nie.length ? "  · nie erreicht: " + d.nie.join(", ") : "  ✓ alle Szenen erreicht");
      console.log(d.fehlendeEnden.length ? "  ✗ nie erreichte Enden: " + d.fehlendeEnden.join(", ") : "  ✓ alle regulären Enden erreicht");
      if (d.fehler.length) { console.log(`  ✗ ${d.fehler.length} Fehler:\n    ` + d.fehler.slice(0, 5).join("\n    ")); }
      schlecht = schlecht || d.fehler.length > 0 || d.fehlendeEnden.length > 0;
    }
  } else if (befehl === "kaempfe") {
    for (const id of welche) {
      const k = kaempfe(id, N || 150, { hardcore: flag("hardcore"), helden: flag("helden"), kalibrieren: flag("kalibrieren"), nur: wert("nur").split(",").filter(Boolean) });
      console.log(`\n${daten(id).META.titel} · ${flag("hardcore") ? "Hardcore" : "Normal"} · ${flag("kalibrieren") ? "Kalibrierung" : (N || 150) + " Kämpfe je Größe"} · Sieg % (übriges Leben %, Runden)`);
      for (const e of k.ergebnis) {
        if (e.fehler) { console.log(`  ✗ ${e.sid}: ${e.fehler}`); schlecht = true; continue; }
        if (e.kalibriert) { console.log(`  ${e.sid} → ${e.begegnung}.${e.feld} = ${JSON.stringify(e.kalibriert)}`); (e.warnungen || []).forEach((w) => console.log("    ⚠ " + w)); continue; }
        console.log(`  ${(e.sid + " [" + e.begegnung + "]").padEnd(40)} Ziel ${Math.round(e.ziel * 100)} % · ` + k.GR.map((n) => { const x = e.je[n]; return `${n}: ${Math.round(x.sieg * 100)} % (${Math.round(x.leben * 100)}, ${x.runden.toFixed(1)})${x.haengt ? " HÄNGT " + x.haengt : ""}${Math.abs(x.sieg - e.ziel) > 0.1 || x.runden > 12 ? " ⚠" : ""}`; }).join(" · "));
        const auff = k.GR.filter((n) => Math.abs(e.je[n].sieg - e.ziel) > 0.1), lang = k.GR.filter((n) => e.je[n].runden > 12);
        if (auff.length) console.log(`    ⚠ mehr als 10 Punkte neben dem Ziel bei ${auff.join(", ")} Helden`);
        if (lang.length) console.log(`    ⚠ über 12 Runden bei ${lang.join(", ")} Helden – der Kampf zieht sich`);
      }
      if (k.ranking) { console.log("\n  Helden-Ranking: Siegquote · übriges Leben · am Boden"); k.ranking.forEach((x, i) => console.log(`  ${String(i + 1).padStart(2)}. ${(F.FIGUREN[x.f].name + " (" + F.KLASSEN[F.FIGUREN[x.f].klasse].name + ")").padEnd(28)} ${(x.q * 100).toFixed(1).padStart(5)} %  ${(x.tp * 100).toFixed(0).padStart(3)} %  ${(x.b * 100).toFixed(0).padStart(3)} %`)); }
    }
  } else if (befehl === "aufbau") {
    for (const id of welche) {
      const a2 = aufbau(id, N || 60, { hardcore: flag("hardcore"), nur: wert("nur").split(",").filter(Boolean) });
      console.log(`\n${daten(id).META.titel} · Vorschlag für die Gegnerzahl${flag("hardcore") ? " · Hardcore" : ""} (Ziel: 5–9 Runden, Lebensfaktor 0,7–3,5)`);
      for (const e of a2.ergebnis) {
        if (e.fehler) { console.log(`  · ${e.sid}: ${e.fehler}`); continue; }
        console.log(`\n  ${e.sid} [${e.begegnung}] · Ziel ${Math.round(e.ziel * 100)} %`);
        for (const z of e.zeilen) console.log(`    ${z === e.beste ? "→" : " "} ${String(Math.round(z.menge * 100)).padStart(3)} % Gegner · ` + a2.GR.map((n) => `${n}: ${z.je[n].gegner.toFixed(0)} Gegner, ${z.je[n].runden.toFixed(1)} R., Faktor ${z.je[n].faktor}`).join(" · "));
        console.log(e.beste.menge === 1 ? "    ✓ Die eingetragene Gegnerzahl passt." : `    ⚠ Vorschlag: ${Math.round(e.beste.menge * 100)} % der Gegner → gegner: ${JSON.stringify(e.beste.gegner)}`);
      }
    }
  } else if (befehl === "freigeben") {
    if (ziel === "alle") { console.log("Bitte ein Abenteuer nennen: freigeben <id>"); process.exit(1); }
    const f = freigeben(ziel);
    if (f.fehler) { console.log(`✗ ${ziel} kann nicht freigegeben werden:`); f.fehler.forEach((x) => console.log("  ✗ " + x)); schlecht = true; }
    else { console.log(`${daten(ziel).META.titel} freigegeben:`); f.schritte.forEach((x) => console.log("  ✓ " + x)); console.log("\nSQL für Supabase (SQL Editor, darf mehrfach laufen):\n\n" + f.sql + "\n\nDanach: node abenteuer/tests/kampagnen.test.js"); }
  } else if (befehl === "alles") {
    if (ziel === "alle") { console.log("Bitte ein Abenteuer nennen: alles <id>"); process.exit(1); }
    const { spawnSync } = require("child_process"), lauf = (argv) => spawnSync("node", argv, { encoding: "utf8", cwd: WURZEL });
    const bericht = [], merke = (name, ok, text) => { bericht.push({ name, ok, text }); console.log(`\n===== ${name} =====\n${text.trim()}`); };
    const selbst = path.join(__dirname, "kampagne.js");
    if (flag("kalibrieren")) for (const m of [[], ["--hardcore"]]) { const r = lauf([selbst, "kaempfe", ziel, "120", "--kalibrieren", ...m]); merke("Kalibrieren" + (m.length ? " (Hardcore)" : ""), r.status === 0 && !/⚠/.test(r.stdout), r.stdout + r.stderr); }
    let r = lauf([selbst, "pruefen", ziel]); merke("Prüfen", r.status === 0, r.stdout + r.stderr);
    r = lauf([selbst, "durchlauf", ziel, "200"]); merke("Durchlauf", r.status === 0, r.stdout + r.stderr);
    for (const m of [[], ["--hardcore"]]) { r = lauf([selbst, "kaempfe", ziel, "100", ...m]); merke("Kämpfe" + (m.length ? " (Hardcore)" : ""), r.status === 0 && !/⚠/.test(r.stdout), r.stdout + r.stderr); }
    r = lauf([path.join(__dirname, "karten.js"), ziel, wert("ordner") || "karten-kontrolle"]); merke("Karten", r.status === 0, r.stdout + r.stderr);
    if (!flag("ohne-browser")) { r = lauf([path.join(WURZEL, "tests/kampagnen-browser.test.js"), ziel]); merke("Browser", r.status === 0, r.stdout + r.stderr); }
    console.log(`\n===== Zusammenfassung: ${daten(ziel).META.titel} =====`);
    bericht.forEach((x) => console.log(`  ${x.ok ? "✓" : "⚠"} ${x.name}${x.ok ? "" : " – bitte oben nachsehen"}`));
    schlecht = bericht.some((x) => !x.ok && !/^Kämpfe|^Kalibrieren/.test(x.name));
  } else if (befehl === "enden") {
    const t = endenTabelle();
    fs.writeFileSync(path.join(WURZEL, "js/enden.js"), endenDatei(t));
    console.log("js/enden.js geschrieben: " + Object.entries(t).map(([ab, v]) => `${ab} ${Object.keys(v.enden).length}`).join(", "));
    console.log("\nSQL für Supabase (SQL Editor, darf mehrfach laufen):\n\n" + endenSql(t));
  } else {
    console.log("Befehle: pruefen [id|alle] · durchlauf <id|alle> [N] [--hardcore] · kaempfe <id> [N] [--hardcore] [--nur=a,b] [--helden] [--kalibrieren] · aufbau <id> · alles <id> [--kalibrieren] [--ohne-browser] · freigeben <id> · enden");
    console.log("Abenteuer: " + ids().join(", "));
  }
  process.exit(schlecht ? 1 : 0);
}
