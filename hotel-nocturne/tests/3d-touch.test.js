/*
 * Hotel Nocturne – 3D-Testmodus: Touch (iPhone quer/hochkant emuliert): Tippen untersucht, Wischen dreht die Kamera ohne Fehlauslösung.
 * Aufruf (aus dem Repository-Wurzelordner):
 *   python3 -m http.server 8765 &
 *   node hotel-nocturne/tests/3d-touch.test.js
 * Braucht Playwright mit Chromium (Software-Rendering per SwiftShader reicht, ist aber langsam: ca. 3 Minuten).
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  for (const dev of ['iPhone 13 landscape', 'iPhone 13']) {
    const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage(); p.setDefaultTimeout(20000); p.on('pageerror', e => errs.push(dev + ' ' + e.message));
    await p.goto(BASE + '/hotel-nocturne/3d.html?q=' + QUAL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.tap('#startButton'); await p.waitForTimeout(500);
    for (let i = 0; i < 10; i++) { const n = await p.$('[data-pz="next"]'); if (!n) break; await n.tap(); await p.waitForTimeout(200); }
    await p.waitForTimeout(300); if (await p.$('.cine-btn')) await p.tap('.cine-btn'); await p.waitForTimeout(800);
    if (await p.$('#dialog[open] [data-close]')) await p.tap('#dialog[open] [data-close]'); await p.waitForTimeout(500);
    const rh = await p.$('#rotateHint.show button'); if (rh && await rh.isVisible()) { await rh.tap(); await p.waitForTimeout(300); }
    const pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('register')); await p.waitForTimeout(200);
    await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(600);
    const t = await p.evaluate(() => document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null);
    await p.screenshot({ path: require('os').tmpdir() + `/touch-${dev.replace(/\W+/g, '_')}.png` });
    if (t) await p.tap('#closeDialog'); await p.waitForTimeout(300);
    const cdp = await ctx.newCDPSession(p); const c = await p.$eval('canvas.n3d', (x) => { const r = x.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const v0 = await p.textContent('#viewName');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
    for (let i = 1; i <= 15; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x + i * 12, y: c.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    console.log(dev, '| Tipp auf Register →', t, '| Wischen:', v0, '→', await p.textContent('#viewName'), '| Dialog nach Wischen offen?', await p.evaluate(() => document.querySelector('#dialog').open));
    await ctx.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close(); })();
