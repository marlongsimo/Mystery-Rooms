/*
 * Abenteuer live: Tablet + drei Handys durch den Anfang von Abschnitt 1, gegen die echte Datenbank.
 * Prolog → Gespräch mit Probe (gewürfelt am Handy) → bitterer Brunnen (geheim, jedes Handy für sich) →
 * Klostergarten-Kampf → Abstimmung im Glockenturm über die Handys (Ergebnis erst, wenn alle abgestimmt haben) →
 * Tisch neu laden mitten im Abenteuer → Sitzung beenden.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-szenen.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOT = process.env.SHOT_DIR;
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (vp, name) => { const p = await (await b.newContext({ viewport: vp })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const szene = (T) => T.evaluate(() => window.ABT.A() && window.ABT.A().szene);

  const T = await page({ width: 1024, height: 900 }, 'Tisch');
  await T.goto(BASE + '/abenteuer/index.html?schnell'); await T.evaluate(() => localStorage.clear()); await T.reload();
  await T.click('#live');
  await until(T, () => Boolean(document.querySelector('.beitritt .code')));
  const code = (await T.textContent('.beitritt .code')).trim();
  const H = {}, fids = { Anna: 'wildnislaeufer', Ben: 'inquisitor', Cara: 'trickser' };
  for (const n of Object.keys(fids)) {
    const P = H[n] = await page({ width: 390, height: 844 }, n);
    await P.goto(BASE + '/abenteuer/handy.html#' + code); await P.evaluate(() => localStorage.clear()); await P.goto(BASE + '/abenteuer/handy.html#' + code);
    await P.fill('#name', n); await P.click('#rein');
    await until(P, () => document.querySelectorAll('.fkarte').length === 15);
    await P.click(`[data-fid="${fids[n]}"]`);
    await until(P, () => Boolean(document.querySelector('.bogen')));
  }
  check(await until(T, () => !document.querySelector('#abenteuer-los').disabled), 'Tisch: drei Handys, Kael, Seran und Silra, Abenteuer startbar');
  await T.click('#abenteuer-los');
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
  const nach = await szene(T);
  check(nach === 'garten_danach' || nach === 'garten', `Nach dem Kampf: Szene „${nach}“`);
  if (nach === 'garten_danach') {
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
  await T.evaluate(() => { const b = document.querySelector('#live-ende'); if (b) b.click(); else window.AB.LIVE.client.leave(); });
  check(await until(H.Anna, () => Boolean(document.querySelector('#rein')), null, 20000), 'Sitzung beendet');
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nLIVE-ABENTEUER IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
