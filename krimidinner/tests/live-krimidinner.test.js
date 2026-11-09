/*
 * Live über die gemeinsame Kennung „krimidinner“ gegen die echte Datenbank – beide Fälle, ohne Test-Kennung.
 * Je Fall: Spielleitung eröffnet (KRIM-Code, Geräte laut fall.json), Gast verbindet sich, Runde 1 öffnet sich von selbst.
 * Dazu: Ein Eichenfels-Gast wird in einer Silberkamm-Sitzung abgewiesen.
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/tests/live-krimidinner.test.js
 */
const BASE = 'http://localhost:8765/krimidinner/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await p.waitForTimeout(400); } return false; };
  const rooms = {};
  for (const [fall, store, n, role] of [['silberkamm', 'kd_silb_', 6, 1], ['eichenfels', 'kd_eich_', 5, 1]]) {
    const U = BASE + fall + '/index.html';
    const H = await page(); await H.goto(U);
    const hc = await H.evaluate((n) => KD.encode({ host: true, n, variants: 0 }), n);
    const gc = await H.evaluate(([n, role]) => KD.encode({ host: false, role, n, variants: 0 }), [n, role]);
    await H.evaluate(([s, c]) => localStorage.setItem(s + 'host', JSON.stringify({ code: c, people: [], seen: {}, step: 3 })), [store, hc]);
    await H.goto(U + '#leitung'); await H.reload(); await H.waitForSelector('#liveStart'); await H.click('#liveStart');
    check(await until(H, () => Boolean(document.querySelector('.live.on .lcode'))), `${fall}: Live-Sitzung eröffnet`);
    const room = (await H.textContent('.live.on .lcode')).trim(), max = await H.textContent('.live.on');
    const slug = await H.evaluate(() => KD.live().session.game_slug);
    check(/^KRIM-/.test(room) && slug === 'krimidinner' && (fall === 'eichenfels' ? /max\. 11/ : /max\. 9/).test(max), `${fall}: Kennung krimidinner, Code ${room}, Geräte laut fall.json`);
    rooms[fall] = { H, room, gc, U };
    const G = await page(); await G.goto(U + '#c=' + gc.replace(/-/g, '')); await G.waitForSelector('.doc');
    await G.click('.live summary'); await G.fill('#liveCode', room); await G.fill('#liveName', 'Gast'); await G.click('#liveJoin');
    check(await until(G, () => Boolean(document.querySelector('.live.on'))), `${fall}: Gast verbunden`);
    await H.click('[data-round="1"]');
    check(await until(G, () => !/🔒/.test(document.querySelector('[data-tab="p3"]').textContent)), `${fall}: Runde 1 öffnet sich beim Gast von selbst`);
    rooms[fall].G = G;
  }
  // Gast von Eichenfels versucht die Silberkamm-Sitzung
  const X = await page(); await X.goto(rooms.eichenfels.U + '#c=' + rooms.eichenfels.gc.replace(/-/g, '')); await X.waitForSelector('.doc');
  await X.click('.live summary'); await X.fill('#liveCode', rooms.silberkamm.room); await X.fill('#liveName', 'Falsch'); await X.click('#liveJoin');
  await until(X, () => /anderen Krimidinner/.test(document.body.textContent) && !document.querySelector('.live.on'), 20000);
  check(/anderen Krimidinner/.test(await X.textContent('body')) && !(await X.$('.live.on')), 'Eichenfels-Gast in der Silberkamm-Sitzung: abgewiesen („anderen Krimidinner“)');
  for (const f of Object.values(rooms)) { await f.H.click('#liveEnd'); }
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nLive über krimidinner in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
