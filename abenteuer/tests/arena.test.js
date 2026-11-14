/*
 * Mythara – Arena im Browser: zwei Spieler (zwei Browser-Kontexte) vom Erstellen bis zum Ergebnis.
 * Die Arena-Funktionen der Datenbank (Migration 008) sind hier nachgebildet; die Live-Verbindung zwischen den
 * beiden Geräten ist echt. Die Datenbankfunktionen selbst prüft supabase/tests/008_rpg_arena_test.sql.
 * Aufruf: node abenteuer/tests/arena.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const { ALLE } = require("./alle-helden");
const URL = "http://localhost:8765/abenteuer/index.html?schnell";
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
  if (name === "rpg_arena_list") return { konto: true, waehrung: DB.wallet[ich], heute: 0, offen: m && m.status === "offen" && m.hostWer !== ich ? [{ id: m.id, name: m.host.name, schnitt: m.host.schnitt, erstellt: new Date().toISOString() }] : [],
    mein: m && (m.hostWer === ich || m.gastWer === ich) && ["offen", "bereit", "laeuft"].includes(m.status) ? sicht(ich) : null };
  if (name === "rpg_arena_create") { const t = team(ich, args.p_team); DB.match = { id: "00000000-0000-0000-0000-00000000aaaa", status: "offen", hostWer: ich, host: { name: "Spieler " + ich, schnitt: schnitt(t), team: t } }; return sicht(ich); }
  if (!m) return fehler("Diesen Kampf gibt es nicht.");
  if (name === "rpg_arena_join") { const t = team(ich, args.p_team), s = schnitt(t); if (Math.abs(s - m.host.schnitt) > 1) return fehler("Dein Team liegt zu weit entfernt.");
    Object.assign(m, { status: "bereit", gastWer: ich, gast: { name: "Spieler " + ich, schnitt: s, team: t }, karte: "gruft", begegnung: "kobolde", seed: 4711 }); return sicht(ich); }
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
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message + " @ " + String(e.stack).split("\n").slice(1, 3).join(" < "))); p.on("dialog", (d) => d.accept());
  const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await p.route(/\/rest\/v1\/rpc\/rpg_my_profile(\?|$)/, (r) => json(r, { konto: true, handle: "Spieler " + ich, avatar_key: null, created_at: new Date().toISOString() }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/, (r) => json(r, { konto: true, helden: ALLE, start_offen: false, angebote: [], enden: [], alle_enden: {}, titel: [] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_hero_levels(\?|$)/, (r) => json(r, { konto: true, xp: DB.xp[ich] }));
  await p.route(/\/rest\/v1\/rpc\/rpg_(my_inbox|my_campaigns)(\?|$)/, (r) => json(r, r.request().url().includes("inbox") ? { freunde: [], kampagnen: [] } : []));
  await p.route(/\/rest\/v1\/rpc\/rpg_(arena_[a-z]+|my_wallet)(\?|$)/, (r) => { const name = /rpc\/(rpg_[a-z_]+)/.exec(r.request().url())[1]; let args = {}; try { args = JSON.parse(r.request().postData() || "{}"); } catch (e) { /* leer */ }
    const e = server(ich, name, args); return e && e.fehler ? r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "P0001", message: e.fehler }) }) : json(r, e); });
  await p.goto(URL); await p.waitForSelector('.hub-kachel[data-hub="arena"]', { timeout: 20000 });
  return { p, fehler, ich };
}
const warte = (p, fn, arg, t = 30000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true, () => false);
(async () => {
  const b = await chromium.launch();
  const A = await spieler(b, "A"), B = await spieler(b, "B");
  check(await A.p.evaluate(() => /Arena/.test(document.querySelector('.hub-kachel[data-hub="arena"] b').textContent) && !document.querySelector('.hub-kachel[data-hub="beitreten"]')), "Startseite: „Arena“ statt „Kampagne beitreten“");
  // A erstellt einen Kampf
  await A.p.click('.hub-kachel[data-hub="arena"]'); await A.p.waitForSelector("#arena-erstellen"); await A.p.click("#arena-erstellen");
  for (const f of ["schildwaechter", "lichtbringer", "wildnislaeufer"]) await A.p.click(`[data-arena-held="${f}"]`);
  const schnittA = await A.p.textContent(".arena-schnitt");
  check(/3 von 3/.test(schnittA) && /3,3/.test(schnittA), "Heldenwahl: Stufen 6, 3, 1 → Durchschnitt 3,3 wird oben angezeigt");
  await A.p.click("#arena-wahl-ok"); await A.p.waitForSelector(".arena-mein");
  check(/wartet auf einen Gegner/.test(await A.p.textContent(".arena-mein")), "Ersteller: Kampf wartet auf einen Gegner");
  // B sieht ihn nach dem Aktualisieren – ohne Helden
  await B.p.click('.hub-kachel[data-hub="arena"]'); await B.p.waitForSelector("#arena-neu-laden"); await B.p.click("#arena-neu-laden"); await B.p.waitForSelector("[data-arena-bei]");
  const zeile = await B.p.textContent(".arena-liste li");
  check(/Spieler A/.test(zeile) && /3,3/.test(zeile) && !/Torvald|Elara|Kael/.test(zeile), "Übersicht des anderen: Name und Durchschnittsstufe, keine Helden (" + zeile.replace(/\s+/g, " ").trim() + ")");
  await B.p.click("[data-arena-bei]");
  for (const f of ["trickser", "elementarist", "duellant"]) await B.p.click(`[data-arena-held="${f}"]`);
  check(await B.p.evaluate(() => document.querySelector("#arena-wahl-ok").disabled && document.querySelector(".arena-schnitt").classList.contains("schlecht")), "Beitreten mit Schnitt 1,0 gegen 3,3: gesperrt, Hinweis auf die Spanne");
  await B.p.click('[data-arena-held="duellant"]'); await B.p.click('[data-arena-held="berserker"]');
  check(await B.p.evaluate(() => !document.querySelector("#arena-wahl-ok").disabled && /2,3/.test(document.querySelector(".arena-schnitt").textContent)), "Mit Ragnar (Stufe 5): Schnitt 2,3 passt");
  await B.p.click("#arena-wahl-ok"); await B.p.waitForSelector(".arena-gegenueber");
  const auf = await B.p.textContent(".arena-gegenueber");
  check(/Torvald/.test(auf) && /Stufe 6/.test(auf) && /Ragnar/.test(auf) && /Stufe 5/.test(auf) && /Gruft/.test(await B.p.textContent("[data-arena]")), "Aufstellung: beide Teams mit den Stufen der einzelnen Helden, Karte gelost");
  // Beide landen im Kampf
  const imKampf = (await warte(A.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 45000)) && (await warte(B.p, () => window.AB.arenaAn() && window.AB.st && !document.querySelector("#spiel").hidden, null, 45000));
  check(imKampf, "Beide Geräte sind im Kampf (Ersteller rechnet, der andere bekommt den Stand)");
  if (imKampf) {
    const start = await B.p.evaluate(() => { const st = window.AB.st; return { teams: st.figuren.filter((f) => f.team).length, monster: st.figuren.filter((f) => !f.team && f.seite === "gegner" && f.tp > 0).length, reihe: document.querySelector("#reihe").textContent + " | " + document.querySelector("#kampf-kopf").textContent, bild: Boolean(st.karte.bild) }; });
    check(start.teams === 6 && start.monster > 0 && start.monster <= 5 && /von 15/.test(start.reihe) && /Arena/.test(start.reihe) && /Spieler A gegen Spieler B/.test(start.reihe) && /Punkte\s*0 : 0/.test(start.reihe) && start.bild, `Kampf: sechs Helden, ${start.monster} Monster (wenige, schwache), Kopfzeile „Arena · Spieler A gegen Spieler B · Runde 1 von 15 · Punkte 0 : 0“, Kartenbild auch beim Beigetretenen`);
    if (process.env.SHOT_DIR) { await B.p.waitForTimeout(600); await B.p.screenshot({ path: process.env.SHOT_DIR + "/arena-kampf-gast.png" }); await A.p.screenshot({ path: process.env.SHOT_DIR + "/arena-kampf-ersteller.png" }); }
    // Züge: Wer dran ist, bewegt sich einmal (wenn möglich) und beendet den Zug. Der Beigetretene schickt seine Züge an den Ersteller.
    const dran = (S) => S.p.evaluate((seite) => { const st = window.AB.st; if (!st || st.ende) return null; const a = window.AB.R.aktiv(st); return window.AB.R.teamVon(st, a) === seite && a.tp > 0 ? a.id : null; }, S.ich === "A" ? 1 : 2);
    let gastBewegt = null, zuege = 0;
    for (let i = 0; i < 400; i++) {
      if (await A.p.evaluate(() => Boolean(document.querySelector("#arena-ende") && !document.querySelector("#arena-ende").hidden)) ) break;
      let gezogen = false;
      for (const S of [A, B]) {
        const id = await dran(S); if (!id) continue;
        if (S === B && !gastBewegt) { // einmal prüfen: Bewegung des Beigetretenen kommt beim Ersteller an
          const ziel = await B.p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); const f = [...window.AB.R.bewegungsfelder(st, a).keys()][0]; return f ? { id: a.id, x: +f.split(",")[0], y: +f.split(",")[1] } : null; });
          if (ziel) { await B.p.evaluate((z) => document.querySelector(`.feld[data-x="${z.x}"][data-y="${z.y}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), ziel);
            gastBewegt = (await warte(A.p, (z) => { const f = window.AB.R.fig(window.AB.st, z.id); return f && f.x === z.x && f.y === z.y; }, ziel, 15000)) ? "ja" : "nein"; }
        }
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
  check(!A.fehler.length && !B.fehler.length, "keine Skriptfehler" + (A.fehler.concat(B.fehler).length ? ": " + A.fehler.concat(B.fehler).slice(0, 3).join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nARENA IN ORDNUNG" : "\nARENA: FEHLER"); process.exit(ok ? 0 : 1);
})();
