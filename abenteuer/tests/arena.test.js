/*
 * Mythara – Arena im Browser: zwei Spieler (zwei Browser-Kontexte) vom Erstellen bis zum Ergebnis.
 * Die Arena-Funktionen der Datenbank (Migration 008) sind hier nachgebildet; die Live-Verbindung zwischen den
 * beiden Geräten ist echt. Die Datenbankfunktionen selbst prüft supabase/tests/008_rpg_arena_test.sql.
 * Aufruf: node abenteuer/tests/arena.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
const MODUS = process.env.MODUS || "arena", MODUSNAME = { arena: "Arena", koenig: "Königsmord", horde: "Die Horde", duell: "Duell" }[MODUS]; // MODUS=koenig|horde: Das Los (die Zufallszahl des Kampfes) fällt auf diesen Modus
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
// Nachgebildeter Server
const DB = { match: null, wallet: { A: 0, B: 0 }, xp: { A: { schildwaechter: 1350, lichtbringer: 260 }, B: { berserker: 850 } } };
const stufe = (xp) => { const bis = [100, 150, 250, 350, 500, 700, 900, 1200, 1500]; let s = 1, r = xp || 0; while (s < 10 && r >= bis[s - 1]) { r -= bis[s - 1]; s++; } return s; };
const team = (ich, helden) => helden.map((h) => ({ held: h, stufe: stufe(DB.xp[ich][h]) }));
const schnitt = (t) => Math.round(t.reduce((a, h) => a + h.stufe, 0) / t.length * 10) / 10;
function sicht(ich) {
  const m = DB.match; if (!m) return null; const seite = m.hostWer === ich ? 1 : 2;
  return { id: m.id, status: m.status, seite, host: { name: m.host.name, schnitt: m.host.schnitt, team: seite === 1 || m.gast ? m.host.team : null }, gast: m.gast || null, karte: m.karte, begegnung: m.begegnung, seed: m.seed, room_code: m.room,
    kampfstufe: Math.round(Math.max(m.host.schnitt, m.gast ? m.gast.schnitt : m.host.schnitt)), sieger: m.sieger || null, grund: m.grund || null, punkte: m.punkte || null, runden: m.runden || null, belohnung: (m.lohn || {})[ich] || null };
}
function server(ich, name, args) {
  const m = DB.match, fehler = (t) => ({ fehler: t });
  if (name === "rpg_my_wallet") return { konto: true, waehrung: DB.wallet[ich] };
  if (name === "rpg_arena_list") return { konto: true, waehrung: DB.wallet[ich], heute: Number(process.env.HEUTE || 0), nur_siege: true, offen: m && m.status === "offen" && m.hostWer !== ich ? [{ id: m.id, name: m.host.name, schnitt: m.host.schnitt, erstellt: new Date().toISOString() }] : [],
    mein: m && (m.hostWer === ich || m.gastWer === ich) && ["offen", "bereit", "laeuft"].includes(m.status) ? sicht(ich) : null };
  if (name === "rpg_arena_modes") return m && (args.p_ids || []).includes(m.id) ? { [m.id]: m.modus || "arena" } : {};
  if (name === "rpg_arena_set_mode") { if (!m || m.hostWer !== ich || m.status !== "offen") return fehler("Der Modus lässt sich nicht mehr ändern."); m.modus = args.p_modus; return args.p_modus; }
  if (name === "rpg_arena_create") { const t = team(ich, args.p_team); DB.match = { id: "00000000-0000-0000-0000-00000000aaaa", status: "offen", hostWer: ich, host: { name: "Spieler " + ich, schnitt: schnitt(t), team: t } }; return sicht(ich); }
  if (!m) return fehler("Diesen Kampf gibt es nicht.");
  if (name === "rpg_arena_join") { const t = team(ich, args.p_team), s = schnitt(t); if (Math.abs(s - m.host.schnitt) > 1) return fehler("Dein Team liegt zu weit entfernt.");
    Object.assign(m, { status: "bereit", gastWer: ich, gast: { name: "Spieler " + ich, schnitt: s, team: t }, karte: "gruft", begegnung: "kobolde", seed: { arena: 4712, koenig: 4713, horde: 4714, duell: 4715 }[MODUS] }); return sicht(ich); }
  if (name === "rpg_arena_get") return sicht(ich);
  if (name === "rpg_arena_room") { m.room = args.p_code; m.status = "laeuft"; return sicht(ich); }
  if (name === "rpg_arena_cancel") { if (m.status === "laeuft") { const seite = m.hostWer === ich ? 1 : 2; Object.assign(m, { status: "beendet", sieger: 3 - seite, grund: "aufgabe" }); } else m.status = "abgebrochen"; return sicht(ich); }
  if (name === "rpg_arena_report") { m.meldung = m.meldung || {}; m.meldung[ich] = args;
    if (m.meldung.A && m.meldung.B && m.status === "laeuft") { const gleich = m.meldung.A.p_sieger === m.meldung.B.p_sieger;
      if (!gleich) m.status = "abgebrochen"; else { Object.assign(m, { status: "beendet", sieger: args.p_sieger, grund: args.p_grund, punkte: args.p_punkte, runden: args.p_runden });
        m.lohn = {}; for (const w of ["A", "B"]) { const seite = m.hostWer === w ? 1 : 2, sieg = m.sieger === seite, t = seite === 1 ? m.host.team : m.gast.team; if (sieg) DB.wallet[w] += 25;
          m.lohn[w] = { sieg, gewertet: true, waehrung: sieg ? 25 : 0, angebot: null, xp: t.map((h) => ({ held: h.held, xp: sieg ? 25 : 8, vorher: h.stufe, stufe: h.stufe, gesamt: (DB.xp[w][h.held] || 0) + (sieg ? 25 : 8), neu: true })) }; } } }
    return sicht(ich); }
  return fehler("unbekannt: " + name);
}
async function spieler(b, ich) {
  const ctx = await b.newContext({ viewport: ich === "B" && process.env.MOBIL ? { width: 390, height: 800 } : { width: 1200, height: 900 } }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message + " @ " + String(e.stack).split("\n").slice(1, 3).join(" < "))); p.on("dialog", (d) => d.accept());
  const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler " + ich, avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: DB.xp[ich] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z_]+|my_wallet)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(ich, name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.dorf-ort[data-hub="arena"]', { timeout: 20000 });
  return { p, fehler, ich };
}
const warte = (p, fn, arg, t = 30000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true, () => false);
(async () => {
  const b = await chromium.launch();
  const A = await spieler(b, "A"), B = await spieler(b, "B");
  check(await A.p.evaluate(() => /Arena/.test(document.querySelector('.dorf-ort[data-hub="arena"] b').textContent) && !document.querySelector('#hub-start [data-hub="beitreten"]')), "Startseite: „Arena“ statt „Kampagne beitreten“");
  // A erstellt einen Kampf
  await A.p.click('.dorf-ort[data-hub="arena"]'); await A.p.waitForSelector("#arena-erstellen"); await A.p.click("#arena-erstellen");
  for (const f of ["schildwaechter", "lichtbringer", "wildnislaeufer"]) await A.p.click(`[data-arena-held="${f}"]`);
  const schnittA = await A.p.textContent(".arena-schnitt");
  check(/3 von 3/.test(schnittA) && /3,3/.test(schnittA), "Heldenwahl: Stufen 6, 3, 1 → Durchschnitt 3,3 wird oben angezeigt");
  check(await A.p.evaluate(() => !document.querySelector("[data-arena-modus]") && !document.querySelector("[data-arena-anf]")), "Kampf erstellen: kein Modus zur Wahl – das Los entscheidet");
  await A.p.click("#arena-wahl-ok"); await A.p.waitForSelector(".arena-mein");
  await A.p.click("#arena-info");
  const info = await A.p.textContent("#arena-info-text");
  check(/Arena/.test(info) && /Königsmord/.test(info) && /Die Horde/.test(info) && /So gewinnst du/.test(info) && /eine Minute Zugzeit/.test(info) && /ausgelost/.test(info), "„i“ in der Arena: Ablauf, Zugzeit, Belohnung und alle drei Modi mit Siegbedingungen");
  check(/wartet auf einen Gegner/.test(await A.p.textContent(".arena-mein")), "Ersteller: Kampf wartet auf einen Gegner");
  // B sieht ihn nach dem Aktualisieren – ohne Helden
  await B.p.click('.dorf-ort[data-hub="arena"]'); await B.p.waitForSelector("#arena-neu-laden"); await B.p.click("#arena-neu-laden"); await B.p.waitForSelector("[data-arena-bei]");
  { const voll = Number(process.env.HEUTE || 0) >= 5, da = await B.p.isVisible(".arena-grenze");
    check(da === voll, voll ? "Tagesgrenze erreicht: Die Warnung steht schon in der Arena-Übersicht" : "Tagesgrenze nicht erreicht: keine Warnung in der Übersicht");
    if (process.env.SHOT_DIR) await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-liste.png" }); }
  const zeile = await B.p.textContent(".arena-liste li");
  check(/Spieler A/.test(zeile) && /3,3/.test(zeile) && !/Torvald|Elara|Kael/.test(zeile), "Übersicht des anderen: Name und Durchschnittsstufe, keine Helden (" + zeile.replace(/\s+/g, " ").trim() + ")");
  await B.p.click("[data-arena-bei]");
  for (const f of ["trickser", "elementarist", "duellant"]) await B.p.click(`[data-arena-held="${f}"]`);
  check(await B.p.evaluate(() => document.querySelector("#arena-wahl-ok").disabled && document.querySelector(".arena-schnitt").classList.contains("schlecht")), "Beitreten mit Schnitt 1,0 gegen 3,3: gesperrt, Hinweis auf die Spanne");
  await B.p.click('[data-arena-held="duellant"]'); await B.p.click('[data-arena-held="berserker"]');
  check(await B.p.evaluate(() => !document.querySelector("#arena-wahl-ok").disabled && /2,3/.test(document.querySelector(".arena-schnitt").textContent)), "Mit Ragnar (Stufe 5): Schnitt 2,3 passt");
  await B.p.click("#arena-wahl-ok"); await B.p.waitForSelector(".arena-gegenueber");
  const mt = (await B.p.textContent("#arena-modus-text")).replace(/\s+/g, " ");
  check(/Das Los hat entschieden/.test(mt) && new RegExp(MODUSNAME).test(mt) && /So gewinnst du/.test(mt) && (MODUS === "horde" ? /nach 30 Runden/ : MODUS === "koenig" ? /gegnerischen Anführer zu Boden/ : /5 je gefälltem Helden/).test(mt), "Vor dem Start: ausgeloster Modus (" + MODUSNAME + ") mit Erklärung und Siegbedingungen");
  if (MODUS === "koenig") { await B.p.click('[data-arena-anf="berserker"]'); await A.p.waitForSelector('[data-arena-anf="lichtbringer"]', { timeout: 20000 }); await A.p.click('[data-arena-anf="lichtbringer"]');
    check(await B.p.evaluate(() => /♛ Ragnar/.test(document.querySelector("[data-arena-anf].an").textContent)) && await A.p.evaluate(() => /♛ Elara/.test(document.querySelector("[data-arena-anf].an").textContent)), "Königsmord: Beide bestimmen vor dem Start ihren Anführer"); }
  if (process.env.SHOT_DIR) await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-aufstellung.png", fullPage: true });
  const zaehlt = await warte(B.p, () => /beginnt in \d+/.test((document.querySelector("#arena-status") || {}).textContent || ""), null, 30000);
  check(zaehlt, "Sind beide verbunden, läuft ein kurzer Countdown bis zum Start");
  const auf = await B.p.textContent(".arena-gegenueber");
  check(/Torvald/.test(auf) && /Stufe 6/.test(auf) && /Ragnar/.test(auf) && /Stufe 5/.test(auf) && /Gruft/.test(await B.p.textContent("[data-arena]")), "Aufstellung: beide Teams mit den Stufen der einzelnen Helden, Karte gelost");
  // Beide landen im Kampf
  const imKampf = (await warte(A.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 45000)) && (await warte(B.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 45000));
  check(imKampf, "Beide Geräte sind im Kampf (Ersteller rechnet, der andere bekommt den Stand)");
  if (imKampf) {
    const start = await B.p.evaluate(() => { const st = window.AB.st; return { teams: st.figuren.filter((f) => f.team).length, monster: st.figuren.filter((f) => !f.team && f.seite === "gegner" && f.tp > 0).length, reihe: document.querySelector("#reihe").textContent + " | " + document.querySelector("#kampf-kopf").textContent, bild: Boolean(st.karte.bild) }; });
    check(start.teams === 6 && (MODUS === "duell" ? start.monster === 0 : start.monster > 0 && start.monster <= 5) && new RegExp("von " + (MODUS === "horde" ? 30 : 15)).test(start.reihe) && new RegExp(MODUSNAME).test(start.reihe) && /Spieler A gegen Spieler B/.test(start.reihe) && /Punkte\s*0 : 0/.test(start.reihe) && start.bild, `Kampf: sechs Helden, ${start.monster} Monster (wenige, schwache), Kopfzeile „Arena · Spieler A gegen Spieler B · Runde 1 von 15 · Punkte 0 : 0“, Kartenbild auch beim Beigetretenen`);
    await B.p.waitForTimeout(1200);
    // Zugreihe: eigene Helden gelb, die des Gegners blau, überall der Spielername; Zugzeit sichtbar
    for (const S of [A, B]) {
      const r = await S.p.evaluate(() => { const farbe = (s) => [...document.querySelectorAll("#reihe span." + s + " .mini")].map((e) => getComputedStyle(e).borderTopColor);
        return { eh: farbe("eh"), gh: farbe("gh"), namen: [...document.querySelectorAll("#reihe span.eh small, #reihe span.gh small")].map((e) => e.textContent), uhr: (document.querySelector("#arena-uhr") || {}).textContent || "", uhrDa: Boolean(document.querySelector("#arena-uhr") && !document.querySelector("#arena-uhr").hidden),
          krone: [...document.querySelectorAll("#reihe .krone")].map((e) => e.parentElement.textContent), koenig: window.AB.st.arena.koenig }; });
      check(r.eh.length === 3 && r.eh.every((c) => c === "rgb(245, 200, 66)") && r.gh.length === 3 && r.gh.every((c) => c === "rgb(79, 140, 255)") && r.namen.length === 6, `Spieler ${S.ich}: Zugreihe – drei eigene Helden gelb, drei gegnerische blau, bei allen der Spielername`);
      if (S === B && process.env.MOBIL) check(await B.p.evaluate(() => { const e = document.querySelector("#arena-uhr .au-punkte"), q = e && e.getBoundingClientRect(); return Boolean(q && q.width > 0 && q.right <= innerWidth && /Du\s*0\s*:\s*0/.test(e.textContent)); }), "Handy hochkant: Punktestand steht sichtbar oben in der Leiste (Du 0 : 0)");
      check(r.uhrDa && /Zugzeit\s*(1:00|0:5\d)/.test(r.uhr), `Spieler ${S.ich}: Zugzeit läuft sichtbar von einer Minute herunter (${r.uhr.trim()})`);
      if (MODUS === "koenig") check(r.krone.length === 1 && new RegExp(S === A ? "Elara" : "Ragnar").test(r.krone[0]) && (S === A ? r.koenig[1] && r.koenig[2] : r.koenig[1] === null && r.koenig[2]), `Spieler ${S.ich}: Krone nur am eigenen Anführer (${r.krone.join()})${S === B ? "; der Anführer des Gegners wird nicht übertragen" : ""}`);
    }
    { // Zugzeit abgelaufen: der Ersteller beendet den Zug – auch den des Gegners
      // (im Test nur bei einem Helden des Erstellers: Die Uhr des Gegners vorzudrehen wäre Schummeln und fiele beim Mitrechnen auf)
      for (let i = 0; i < 60; i++) { const tm = await A.p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); return a.tp > 0 ? window.AB.R.teamVon(st, a) : 0; }); if (tm === 1) break;
        if (tm === 2) await B.p.evaluate(() => { const b = document.querySelector("#ende-zug") || document.querySelector('[data-l="ende"]'); if (b && !b.disabled) b.click(); }); await A.p.waitForTimeout(400); }
      const vor = await A.p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); st.arena.zugBis = Date.now() - 1; return a.id; });
      const weiter = await warte(A.p, (alt) => window.AB.R.aktiv(window.AB.st).id !== alt && window.AB.st.log.some((l) => /Zugzeit von .* ist abgelaufen/.test(l.t)), vor, 8000);
      check(weiter, "Läuft die Zugzeit ab, endet der Zug von selbst (Eintrag in der Chronik)");
    }
    const sichtB = await B.p.evaluate(() => { const st = window.AB.st; const el = (id) => document.querySelector(`#karte g.fig[data-id="${id}"]`);
      return st.figuren.filter((f) => f.team).map((f) => ({ id: f.id, team: f.team, seite: f.seite, x: f.x, y: f.y, da: Boolean(el(f.id)), klasse: el(f.id) ? el(f.id).getAttribute("class") : "", blau: el(f.id) ? /4f8cff/.test(el(f.id).innerHTML) : false })); });
    if (process.env.DEBUG) console.log(JSON.stringify(sichtB));
    check(sichtB.filter((f) => f.team === 2).every((f) => f.da && !f.blau && f.y <= 4) && sichtB.filter((f) => f.team === 1).every((f) => f.da && f.blau && f.y >= 6), "Beigetretener: eigene Helden oben auf der Karte, die drei Gegenspieler unten und blau markiert");
    if (process.env.SHOT_DIR) { await B.p.waitForTimeout(600); await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-kampf-gast.png" }); await A.p.screenshot({ path: process.env.SHOT_DIR + "/arena-kampf-ersteller.png" }); }
    // Züge: Wer dran ist, bewegt sich einmal (wenn möglich) und beendet den Zug. Der Beigetretene schickt seine Züge an den Ersteller.
    const dran = (S) => S.p.evaluate((seite) => { const st = window.AB.st; if (!st || st.ende) return null; const a = window.AB.R.aktiv(st); return window.AB.R.teamVon(st, a) === seite && a.tp > 0 ? a.id : null; }, S.ich === "A" ? 1 : 2);
    let gastBewegt = null, zuege = 0, geschummelt = false;
    for (let i = 0; i < 400; i++) {
      if (await A.p.evaluate(() => Boolean(document.querySelector("#arena-ende") && !document.querySelector("#arena-ende").hidden)) ) break;
      let gezogen = false;
      // SCHUMMELN=1: Der Ersteller ändert nach ein paar Zügen heimlich die Lebenspunkte eines gegnerischen Helden
      if (process.env.SCHUMMELN && !geschummelt && zuege >= 4) { geschummelt = true; await A.p.evaluate(() => { const f = window.AB.st.figuren.find((x) => x.team === 2 && x.tp > 1); f.tp = 1; }); }
      for (const S of [A, B]) {
        const id = await dran(S); if (!id) continue;
        if (S === B && !gastBewegt) { // einmal prüfen: Bewegung des Beigetretenen kommt beim Ersteller an
          const ziel = await B.p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); const f = [...window.AB.R.bewegungsfelder(st, a).keys()][0]; return f ? { id: a.id, x: +f.split(",")[0], y: +f.split(",")[1] } : null; });
          if (ziel) { await B.p.evaluate((z) => document.querySelector(`.feld[data-x="${z.x}"][data-y="${z.y}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), ziel);
            gastBewegt = (await warte(A.p, (z) => { const f = window.AB.R.fig(window.AB.st, z.id); return f && f.x === z.x && f.y === z.y; }, ziel, 15000)) ? "ja" : "nein"; }
        }
        // KI=1: Beide Seiten setzen ihre Fähigkeiten ein (Ersteller über den Vorschlag der Regeln, der Beigetretene schickt ihn als Wunsch)
        if (process.env.KI && S === A && !process.env.FALL) await A.p.evaluate(() => window.AB.auto());
        else if (process.env.KI) { for (let n = 0; n < 3; n++) { const mehr = await B.p.evaluate((alt) => { const st = window.AB.st, R = window.AB.R; if (!st || st.ende || R.aktiv(st).id !== alt) return false; const v = R.vorschlag(st); if (!v || !v.aktion) return false; window.AB.arenaSende({ typ: "aktion", aktion: v.aktion, ziel: v.ziel }); return true; }, id); if (!mehr) break; await B.p.waitForTimeout(900); } }
        await S.p.evaluate(() => { const b = document.querySelector("#ende-zug") || document.querySelector('[data-l="ende"]'); if (b && !b.disabled) b.click(); });
        await warte(S.p, (alt) => { const st = window.AB.st; return !st || st.ende || window.AB.R.aktiv(st).id !== alt; }, id, 15000); gezogen = true; zuege++;
      }
      if (!gezogen) await A.p.waitForTimeout(250);
    }
    check(gastBewegt === "ja", "Der Beigetretene bewegt einen Helden: Die Bewegung kommt beim Ersteller an");
    const endeDa = (await warte(A.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && document.querySelector("#arena-ende-zu"); }, null, 60000)) && (await warte(B.p, () => { const e = document.querySelector("#arena-ende"); return e && !e.hidden && document.querySelector("#arena-ende-zu"); }, null, 60000));
    check(endeDa, `Der Kampf endet auf beiden Geräten (${zuege} Züge gespielt)`);
    if (endeDa) {
      const tA = (await A.p.textContent("#arena-ende")).replace(/\s+/g, " "), tB = (await B.p.textContent("#arena-ende")).replace(/\s+/g, " ");
      const pr = await B.p.evaluate(() => window.AB.arenaPruef());
      if (process.env.DEBUG) console.log("    Ende:", await A.p.evaluate(() => window.AB.st.arena.grund + " | Sieger " + window.AB.st.arena.sieger));
      if (process.env.SCHUMMELN) {
        check(pr && !pr.ok && /weicht/.test(pr.grund), "Mitrechnen: Der Beigetretene bemerkt die Manipulation (" + (pr && pr.grund) + ")");
        check(/Nicht gewertet|Abgebrochen/.test(tB) && /Abgebrochen/.test(tA) && !/Seelensplitter/.test(tA + tB) && !/XP/.test(tA + tB) && DB.match.status === "abgebrochen" && DB.wallet.A === 0 && DB.wallet.B === 0, "Der manipulierte Kampf endet ohne Wertung: keine Seelensplitter, keine Erfahrung");
        if (process.env.SHOT_DIR) await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-nicht-gewertet.png" });
      } else {
      check(pr && pr.ok && pr.schritte > 10, `Mitrechnen: Der Beigetretene hat alle ${pr && pr.schritte} Schritte nachgerechnet, ohne Abweichung${pr && !pr.ok ? " – ABWEICHUNG: " + pr.grund : ""}`);
      const siegA = /Sieg/.test(tA) && !/Niederlage/.test(tA), siegB = /Sieg/.test(tB) && !/Niederlage/.test(tB);
      check(siegA !== siegB && /Niederlage/.test(siegA ? tB : tA), "Ein Gerät zeigt „Sieg“, das andere „Niederlage“");
      check(/\+25 Seelensplitter/.test(siegA ? tA : tB) && !/Seelensplitter/.test(siegA ? tB : tA) && /XP/.test(tA) && /XP/.test(tB), "Sieger: +25 Seelensplitter; beide sehen die Erfahrung ihrer Helden");
      if (process.env.SHOT_DIR) { await A.p.screenshot({ path: process.env.SHOT_DIR + "/arena-ende-a.png" }); await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-ende-b.png" }); }
      const S = siegA ? A : B;
      await S.p.click("#arena-ende-zu");
      const zurueck = await warte(S.p, () => !document.querySelector("#hub").hidden && document.querySelector("#hub-waehrung") && /25/.test(document.querySelector("#hub-waehrung").textContent), null, 20000);
      check(zurueck, "„Zur Startseite“: zurück im Hub, neben dem Profilbild stehen 25 Seelensplitter");
      }
    }
  }
  check(!A.fehler.length && !B.fehler.length, "keine Skriptfehler" + (A.fehler.concat(B.fehler).length ? ": " + A.fehler.concat(B.fehler).slice(0, 3).join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nARENA IN ORDNUNG" : "\nARENA: FEHLER"); process.exit(ok ? 0 : 1);
})();
