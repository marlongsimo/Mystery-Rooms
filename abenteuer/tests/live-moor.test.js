/*
 * Moor live: Tisch + zwei Handys (gegen die echte Datenbank, ohne Kampagne). Zwei Handys reichen für das Moor,
 * die Handys zeigen „Lichter“ statt „Glocke“, eine Abstimmung läuft über beide Handys.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-moor.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch()); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (vp, name) => { const p = await (await b.newContext({ viewport: vp })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const zu = async (p, fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  const T = await page({ width: 1100, height: 900 }, 'Tisch'), H = {};
  try {
    await T.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await T.evaluate(() => localStorage.clear()); await T.reload();
    await T.click('#my-gast-start'); await T.click('.hub-kachel[data-hub="neu"]'); await T.click('[data-neu-abenteuer="rabenmoor"]');
    await T.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await T.click('#kodex-weiter');
    await T.click('#live'); await until(T, () => Boolean(document.querySelector('.beitritt .code')));
    const code = (await T.textContent('.beitritt .code')).trim();
    for (const [n, fid] of [['Anna', 'wildnislaeufer'], ['Ben', 'inquisitor']]) {
      const P = H[n] = await page({ width: 390, height: 844 }, n);
      await P.goto(BASE + '/abenteuer/handy.html#' + code); await P.fill('#name', n); await P.click('#rein');
      await until(P, () => document.querySelectorAll('.banner[data-klasse]').length === 5);
      await zu(P, fid); await P.click(`[data-fid="${fid}"]`); await P.click('#f-spielen');
      await until(P, () => Boolean(document.querySelector('.bogen')));
    }
    check(await until(T, () => window.AB.SETUP().gruppe.length === 2 && !document.querySelector('#abenteuer-los').disabled), 'Moor: zwei Handys reichen, Start frei');
    await T.click('#abenteuer-los'); await T.click('#einl-skip');
    check(await until(H.Anna, () => /Lichter 0\/7/.test(document.body.textContent)), 'Handy zeigt „Lichter 0/7“');
    // bis zur Abstimmung über den Weg: Dorfplatz → aufbrechen → geheime Entscheidung am Ufer (beide Handys) → Wegwahl
    await until(T, () => window.ABT.A().szene === 'prolog'); await T.click('#sz-weiter');
    await T.click('[data-opt="aufbrechen"]');
    for (const n of ['Anna', 'Ben']) { await until(H[n], () => Boolean(document.querySelector('[data-gantwort]'))); await H[n].click('[data-gantwort="schweigen"]'); }
    check(await until(T, () => window.ABT.A().szene === 'wegwahl'), 'Geheime Entscheidung am Ufer über beide Handys');
    for (const n of ['Anna', 'Ben']) { await until(H[n], () => Boolean(document.querySelector('[data-stimme="ried"]'))); await H[n].click('[data-stimme="ried"]'); }
    check(await until(T, () => window.ABT.A().szene === 'ried'), 'Abstimmung: beide fürs Ried');
    await T.evaluate(() => window.AB.LIVE.client.leave().catch(() => {}));
  } catch (e) { check(false, 'Ablauf: ' + e.message); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? 'LIVE-MOOR IN ORDNUNG' : 'LIVE-MOOR FEHLER'); process.exit(ok ? 0 : 1);
})();
