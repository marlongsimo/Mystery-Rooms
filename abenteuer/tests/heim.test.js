/*
 * Zur Startseite und Neuladen: MYTHARA oben rechts führt jederzeit zur Startseite (Abenteuer bleibt gespeichert).
 * Wer auf der Startseite neu lädt, bleibt dort; wer im Spiel neu lädt, spielt weiter.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/heim.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const until = async (p, fn, arg, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(200); } return false; };
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.setDefaultTimeout(15000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  const sichtbar = (id) => p.evaluate((id) => !document.querySelector('#' + id).hidden, id);
  try {
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
    await p.click('#my-gast-start');
    check(await sichtbar('hub'), 'Spielerseite (Startseite) offen');
    await p.click('#brand-heim');
    check(await sichtbar('hub'), 'MYTHARA auf der Startseite: bleibt auf der Startseite');
    await p.click('.hub-kachel[data-hub="neu"]'); await p.click('[data-neu-abenteuer="rabenmoor"]');
    await p.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
    await p.click('#start');
    const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
    for (const f of ['schildwaechter', 'lichtbringer']) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
    await p.click('#abenteuer-los'); await p.click('#einl-skip');
    check(await until(p, () => !document.querySelector('#szene').hidden), 'Abenteuer läuft');
    await p.click('#sz-weiter');
    const szene = await p.evaluate(() => window.ABT.A().szene);
    await p.click('#brand-heim');
    check(await until(p, () => !document.querySelector('#hub').hidden && document.querySelector('#szene').hidden), 'MYTHARA im Spiel: zurück zur Startseite');
    await p.reload(); await p.waitForTimeout(1500);
    check(await p.evaluate(() => !document.querySelector('#hub').hidden && document.querySelector('#szene').hidden), 'Neu laden auf der Startseite: bleibt auf der Startseite');
    check(await until(p, () => Boolean(document.querySelector('#hub-lokal-play'))), 'Startseite bietet das gespeicherte Abenteuer zum Weiterspielen an');
    await p.click('#hub-lokal-play');
    check(await until(p, (s) => !document.querySelector('#szene').hidden && window.ABT.A().szene === s, szene), 'Weiterspielen: dieselbe Szene wie vorher');
    await p.reload();
    check(await until(p, (s) => !document.querySelector('#szene').hidden && window.ABT.A() && window.ABT.A().szene === s, szene), 'Neu laden im Spiel: es geht direkt weiter');
  } catch (e) { check(false, 'Ablauf: ' + e.message); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? 'HEIM IN ORDNUNG' : 'HEIM FEHLER'); process.exit(ok ? 0 : 1);
})();
