/*
 * Abenteuer live: Tablet + drei Handys durch den Anfang von Abschnitt 1, gegen die echte Datenbank.
 * Prolog → Gespräch mit Probe (gewürfelt am Handy) → bitterer Brunnen (geheim, jedes Handy für sich) →
 * Klostergarten-Kampf → Abstimmung im Glockenturm über die Handys (Ergebnis erst, wenn alle abgestimmt haben) →
 * Tisch neu laden mitten im Abenteuer → Rätsel → Hardcore-Ersatz → Flüstern (eigene Versuchung je Handy) → Sitzung beenden.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-szenen.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOT = process.env.SHOT_DIR;
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };

  const einstieg = async (p, modus) => {
    await p.click('#my-gast-start');
    await p.click('.hub-kachel[data-hub="neu"]');
    await p.waitForSelector('#kodex:not([hidden])');
    for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
    await p.click(modus === 'live' ? '#live' : '#start');
  };
  const zu = async (p, fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  const nimm = async (p, fid) => { await zu(p, fid); await p.click(`[data-fid="${fid}"]`); await p.click('#f-waehlen'); };
  const page = async (vp, name) => { const p = await (await b.newContext({ viewport: vp })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const szene = (T) => T.evaluate(() => window.ABT.A() && window.ABT.A().szene);

  const T = await page({ width: 1024, height: 900 }, 'Tisch');
  await T.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await T.evaluate(() => localStorage.clear()); await T.reload();
  await einstieg(T, 'live');
  await until(T, () => Boolean(document.querySelector('.beitritt .code')));
  const code = (await T.textContent('.beitritt .code')).trim();
  const H = {}, fids = { Anna: 'wildnislaeufer', Ben: 'inquisitor', Cara: 'trickser' };
  for (const n of Object.keys(fids)) {
    const P = H[n] = await page({ width: 390, height: 844 }, n);
    await P.goto(BASE + '/abenteuer/handy.html#' + code); await P.evaluate(() => localStorage.clear()); await P.goto(BASE + '/abenteuer/handy.html#' + code);
    await P.fill('#name', n); await P.click('#rein');
    await until(P, () => document.querySelectorAll('.banner[data-klasse]').length === 5);
    await zu(P, fids[n]); await P.click(`[data-fid="${fids[n]}"]`); await P.click('#f-spielen');
    await until(P, () => Boolean(document.querySelector('.bogen')));
  }
  check(await until(T, () => !document.querySelector('#abenteuer-los').disabled), 'Tisch: drei Handys, Kael, Seran und Silra, Abenteuer startbar');
  await T.click('#abenteuer-los');
  check(await T.isVisible('#einleitung') && /Splitterlande/.test(await T.textContent('#einleitung .seite:not([hidden])')), 'Nach der Heldenwahl: Intro der Kampagne');
  await T.click('#einl-skip');
  check(await until(H.Anna, () => window.ABH.H.spiel && window.ABH.H.spiel.phase === 'szene' && /Halmbruck/.test(document.body.textContent)), 'Handys zeigen die erste Szene');
  await T.click('#sz-weiter');
  // Probe im Gespräch: Spuren untersuchen, Anna würfelt am Handy
  await T.click('[data-opt="spuren"]');
  check(await until(H.Anna, () => Boolean(document.querySelector('#probe-wer'))), 'Probe: Handy bietet „Ich versuche es“');
  await H.Anna.click('#probe-wer');
  check(await until(H.Anna, () => Boolean(document.querySelector('#probe-wurf'))), 'Anna ist dran: Würfeln-Knopf auf dem Handy');
  await H.Anna.click('#probe-wurf');
  check(await until(T, () => /Wahrnehmung – W20/.test(document.querySelector('#szene').textContent) && document.querySelectorAll('[data-opt]').length > 0), 'Tisch: Wurf von Annas Handy ausgewertet, Gespräch geht weiter');
  if (SHOT) await H.Anna.screenshot({ path: SHOT + '/live-szene-handy.png', fullPage: true });
  // Geheime Entscheidung am Brunnen
  await T.click('[data-opt="brunnen"]');
  for (const [n, a] of [['Anna', 'trinken'], ['Ben', 'nicht'], ['Cara', 'trinken']]) {
    check(await until(H[n], () => Boolean(document.querySelector('[data-gantwort]'))), `${n}: geheime Frage auf dem Handy`);
    await H[n].click(`[data-gantwort="${a}"]`);
  }
  check(await until(T, () => window.ABT.A().szene === 'halmbruck'), 'Alle haben entschieden: zurück am Brunnen');
  const m = await T.evaluate(() => window.ABT.A().merker);
  check(m.wasser_wildnislaeufer === true && m.wasser_trickser === true && !m.wasser_inquisitor, 'Merker: Kael und Silra haben getrunken, Seran nicht');
  const pub = await H.Ben.evaluate(() => JSON.stringify(window.ABH.H.spiel.abenteuer));
  check(!/trinken/.test(pub.replace(/"id":"trinken"/g, '')), 'Im öffentlichen Stand steht nicht, wer getrunken hat');
  await T.click('[data-opt="aufbrechen"]'); await T.click('#sz-weiter');
  // Kampf im Klostergarten (am Tisch automatisch)
  await T.click('#sz-kampf');
  check(await until(H.Ben, () => window.ABH.H.spiel.phase === 'kampf'), 'Kampf im Klostergarten beginnt, Handys im Kampfmodus');
  for (let i = 0; i < 400; i++) {
    if (await T.$('#weiter-abenteuer')) { await T.click('#weiter-abenteuer'); break; }
    const s = await T.evaluate(() => window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x');
    if (s === 'spieler') await T.evaluate(() => window.AB.auto()); else await T.waitForTimeout(100);
  }
  if (await until(T, () => Boolean(document.querySelector('[data-beute-ding]')), null, 8000)) {
    check(await until(H.Ben, () => /Beute!/.test(document.body.textContent)), 'Beute: Handys sehen, was es gibt');
    await T.click('[data-beute-ding]'); await T.click('[data-beute]:not([disabled])');
    check(await until(T, () => !document.querySelector('[data-beute-ding]')), 'Beute am Tisch verteilt');
  }
  const nach = await szene(T);
  check(nach === 'garten_danach' || nach === 'garten', `Nach dem Kampf: Szene „${nach}“`);
  if (nach === 'garten_danach') {
    await T.evaluate(() => { window.ABT.A().erlebt = window.ABD.EREIGNISSE.map((e) => e.id); }); // hier ohne Zufallsereignis direkt zum Turm
    await T.click('#sz-weiter');
    // Tisch neu laden mitten im Abenteuer
    await T.reload();
    check(await until(T, () => window.ABT && window.ABT.A() && window.ABT.A().szene === 'turm' && !document.querySelector('#szene').hidden), 'Tisch neu geladen: Abenteuer steht wieder im Glockenturm');
    // Abstimmung über die Handys
    for (const [n, o] of [['Anna', 'schleichen'], ['Ben', 'angreifen']]) { await until(H[n], () => Boolean(document.querySelector('[data-stimme]'))); await H[n].click(`[data-stimme="${o}"]`); }
    await T.waitForTimeout(2500);
    check(await T.evaluate(() => window.ABT.A().szene === 'turm' && /2 von 3/.test(document.querySelector('#szene').textContent)), 'Tisch: 2 von 3 haben abgestimmt, noch kein Ergebnis');
    await until(H.Cara, () => Boolean(document.querySelector('[data-stimme]'))); await H.Cara.click('[data-stimme="schleichen"]');
    check(await until(T, () => window.ABT.A().szene === 'turm_schleichen'), 'Alle haben abgestimmt: Mehrheit „Anschleichen“ gilt');
    check(await until(H.Ben, () => Boolean(document.querySelector('#probe-wurf'))), 'Gruppenprobe: jedes Handy würfelt selbst');
  }
  // Glockenrätsel: jedes Handy sieht eine andere Grabplatte
  await T.evaluate(() => { const o = window.ABT.speichern(); o.szene = 'gruft_raetsel'; o.raetsel = { folge: [] }; o.stufe = 2; window.ABT.laden(o); window.ABT.zeige(); });
  const platten = [];
  for (const n of Object.keys(fids)) { await until(H[n], () => Boolean(document.querySelector('.platte'))); platten.push(await H[n].textContent('.tabinhalt .platte')); }
  check(platten.length === 3 && new Set(platten).size === 3, 'Rätsel: drei Handys, drei verschiedene Grabplatten');
  if (SHOT) await H.Ben.screenshot({ path: SHOT + '/live-platte.png', fullPage: true });
  for (const g of ['rabe', 'lamm', 'taube', 'wolf']) await T.click(`[data-glocke="${g}"]`);
  check(await until(T, () => window.ABT.A().szene === 'gruft_nischen' && window.ABT.A().merker.silberglocke), 'Rätsel am Tisch gelöst: silberne Glocke gefunden');
  // Hardcore-Ersatz: Kael ist gefallen, Anna wählt am Lagerfeuer eine neue Figur auf dem Handy
  await T.evaluate(() => { const o = window.ABT.speichern(); o.schwierigkeit = 'hardcore'; o.zust.wildnislaeufer.tot = true; o.gefallen = ['wildnislaeufer']; o.lagerZust = JSON.parse(JSON.stringify(o.zust)); o.ersatzOffen = ['wildnislaeufer']; o.szene = 'bibliothek'; window.ABT.laden(o); window.ABT.zeige(); });
  check(await until(H.Anna, () => /Wen spielst du jetzt/.test(document.body.textContent) && document.querySelectorAll('.tabinhalt [data-fid]').length >= 10), 'Ersatz: Annas Handy bietet die freien Figuren an');
  await H.Anna.click('.tabinhalt [data-fid="duellant"]');
  check(await until(T, () => window.ABT.A().gruppe.includes('duellant') && !window.ABT.A().gruppe.includes('wildnislaeufer')), 'Tisch: Isolde ersetzt Kael in der Gruppe');
  check(await until(H.Anna, () => /Isolde/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Annas Handy zeigt jetzt Isoldes Bogen');
  // Das Flüstern: jedes Handy hört seine eigene Versuchung
  await T.evaluate(() => { const o = window.ABT.speichern(); o.szene = 'fluestern'; o.geheim = {}; o.stufe = 3; o.merker.wasser_trickser = true; window.ABT.laden(o); window.ABT.zeige(); });
  const fragen = {};
  for (const n of ['Anna', 'Ben', 'Cara']) { await until(H[n], () => Boolean(document.querySelector('[data-gantwort="annehmen"]'))); fragen[n] = await H[n].textContent('.tabinhalt .info.dran'); }
  check(/dass dir jeder glaubt/.test(fragen.Cara) && /bitteren Brunnen/.test(fragen.Cara), 'Flüstern: Silra (hat getrunken) hört ihr persönliches Angebot');
  check(/wie durch Wasser/.test(fragen.Ben) && !/bitteren Brunnen/.test(fragen.Ben), 'Flüstern: Seran (hat nicht getrunken) hört nur ein fernes Angebot');
  if (SHOT) await H.Cara.screenshot({ path: SHOT + '/live-fluestern.png', fullPage: true });
  for (const [n, a] of [['Anna', 'ablehnen'], ['Ben', 'ablehnen'], ['Cara', 'annehmen']]) await H[n].click(`[data-gantwort="${a}"]`);
  check(await until(T, () => window.ABT.A().szene === 'abt_kampf'), 'Alle haben geantwortet: Endkampf gegen Valdric steht bevor');
  const m3 = await T.evaluate(() => window.ABT.A().merker);
  check(m3.pakt_trickser === true && !m3.pakt_inquisitor && !m3.pakt_duellant, 'Merker: nur Silra hat den Pakt angenommen');
  check(await T.evaluate(() => /Seran spürt/.test(JSON.stringify(window.ABT.A().protokoll))), 'Seran spürt, dass jemand Ja gesagt hat');
  await T.evaluate(() => { const b = document.querySelector('#live-ende'); if (b) b.click(); else window.AB.LIVE.client.leave(); });
  check(await until(H.Anna, () => Boolean(document.querySelector('#rein')), null, 20000), 'Sitzung beendet');
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nLIVE-ABENTEUER IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
