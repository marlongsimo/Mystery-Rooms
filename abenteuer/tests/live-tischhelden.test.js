/*
 * Abenteuer live: Zwei Handys + ein Held, den der Tisch steuert (gegen die echte Datenbank, ohne Kampagne).
 * Heldenwahl: Tisch lässt Branka „vom Tisch spielen“ → Gruppe 3, Abenteuer startbar → geheime Entscheidung am Brunnen:
 * Handys auf dem Handy, Tisch für Branka → weiter. Danach kommt ein drittes Handy dazu und übernimmt Branka.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-tischhelden.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (vp, name) => { const p = await (await b.newContext({ viewport: vp })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const zu = async (p, fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  const T = await page({ width: 1100, height: 900 }, 'Tisch'), H = {};
  const beitreten = async (n, code) => { const P = H[n] = await page({ width: 390, height: 844 }, n); await P.goto(BASE + '/abenteuer/handy.html#' + code); await P.fill('#name', n); await P.click('#rein'); return P; };
  try {
    await T.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await T.evaluate(() => localStorage.clear()); await T.reload();
    await T.click('#my-gast-start'); await T.click('.hub-kachel[data-hub="neu"]'); await T.click('[data-neu-abenteuer="grauwacht"]');
    await T.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await T.click('#kodex-weiter');
    await T.click('#live'); await until(T, () => Boolean(document.querySelector('.beitritt .code')));
    const code = (await T.textContent('.beitritt .code')).trim();
    for (const [n, fid] of [['Anna', 'wildnislaeufer'], ['Ben', 'inquisitor']]) {
      const P = await beitreten(n, code);
      await until(P, () => document.querySelectorAll('.banner[data-klasse]').length === 5);
      await zu(P, fid); await P.click(`[data-fid="${fid}"]`); await P.click('#f-spielen');
      await until(P, () => Boolean(document.querySelector('.bogen')));
    }
    check(await until(T, () => window.AB.SETUP().gruppe.length === 2 && document.querySelector('#abenteuer-los').disabled), 'Zwei Handys: Gruppe 2, Start noch gesperrt');
    await zu(T, 'schildwaechter'); await T.click('[data-fid="schildwaechter"]');
    check(/vom Tisch spielen lassen/.test(await T.textContent('#f-tisch')), 'Tisch bietet „vom Tisch spielen lassen“ an');
    await T.click('#f-tisch');
    check(await until(T, () => window.AB.SETUP().gruppe.length === 3 && window.AB.SETUP().gruppe.includes('schildwaechter') && !document.querySelector('#abenteuer-los').disabled), 'Branka spielt vom Tisch: Gruppe 3, Abenteuer startbar');
    check(await until(H.Anna, () => (window.ABH.H.spiel.gruppe || []).includes('schildwaechter')), 'Handys sehen Branka in der Gruppe');
    await T.click('#abenteuer-los'); await T.click('#einl-skip');
    await until(T, () => window.ABT.A() && window.ABT.A().szene === 'prolog'); await T.click('#sz-weiter');
    await T.click('[data-opt="brunnen"]');
    check(await until(T, () => Boolean(document.querySelector('[data-geheim^="schildwaechter:"]'))), 'Brunnen: Tisch entscheidet für Branka');
    for (const n of ['Anna', 'Ben']) { await until(H[n], () => Boolean(document.querySelector('[data-gantwort]'))); await H[n].click('[data-gantwort="nicht"]'); }
    await T.waitForTimeout(800);
    check(await T.evaluate(() => window.ABT.A().szene === 'brunnen'), 'Ohne Brankas Antwort geht es noch nicht weiter');
    await T.click('[data-geheim="schildwaechter:trinken"]');
    check(await until(T, () => window.ABT.A().szene === 'halmbruck' && window.ABT.A().merker.wasser_schildwaechter === true), 'Alle haben entschieden (Branka am Tisch): zurück am Brunnen');
    // Drittes Handy übernimmt Branka
    const C = await beitreten('Cara', code);
    check(await until(C, () => /Tisch – übernehmbar/.test(document.body.textContent)), 'Neues Handy sieht Branka als „Tisch – übernehmbar“');
    await C.click('[data-fid="schildwaechter"]'); await C.click('#f-spielen');
    check(await until(T, () => window.AB.spielerName(window.AB.LIVE.besitz.schildwaechter) === 'Cara'), 'Cara spielt jetzt Branka');
    await T.evaluate(() => window.AB.LIVE.client.leave().catch(() => {}));
  } catch (e) { check(false, 'Ablauf: ' + e.message); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? 'TISCHHELDEN IN ORDNUNG' : 'TISCHHELDEN FEHLER'); process.exit(ok ? 0 : 1);
})();
