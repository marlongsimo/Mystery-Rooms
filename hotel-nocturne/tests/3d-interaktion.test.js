/*
 * Hotel Nocturne – 3D-Testmodus: Rätsel direkt am Objekt (Rezeption).
 * Schlüsselkasten: Nahansicht statt Dialog · Ziehen am Rad dreht nicht den Raum · „Klassisch lösen“ öffnet den gewohnten Dialog ·
 * Esc verlässt die Nahansicht · Ziffernrollen per Antippen (oben +1, unten −1) · falscher Code 2317 → Text der Engine, Schloss wackelt ·
 * 2117 → Kasten offen, Nahansicht schließt sich · Schraubendreher an der Abdeckung (Schrauben, Platte fällt) · Schlüssel im Schalter ·
 * Schlüssel 217 „Genauer ansehen“ (drehen, Rückseite) · Gegenprobe normale Version: Zahlenschloss im Dialog wie bisher.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion.test.js   (ca. 3 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const { chromium, devices } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
async function enter(p, url) {
  await p.goto(url, { timeout: 60000 }); await p.evaluate(() => localStorage.clear()); await p.reload({ timeout: 60000 }); await p.waitForTimeout(400);
  await p.click('#startButton'); await p.waitForTimeout(500);
  if (await p.$('.cf-cold .cine-btn')) { await p.click('.cf-cold .cine-btn'); await p.waitForTimeout(400); }
  for (let i = 0; i < 10; i++) { const n = await p.$('[data-pz="next"]'); if (!n) break; await n.click(); await p.waitForTimeout(200); }
  await p.waitForTimeout(300); if (await p.$('.cine-btn')) await p.click('.cine-btn'); await p.waitForTimeout(900);
  if (await p.$('#dialog[open] [data-close]')) await p.click('#dialog[open] [data-close]'); await p.waitForTimeout(300);
}
const dlgOpen = (p) => p.evaluate(() => document.querySelector('#dialog').open);
const closeDlg = async (p) => { if (await dlgOpen(p)) { await p.click('#closeDialog'); await p.waitForTimeout(250); } };
(async () => {
  const b = await chromium.launch(ARGS); const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL);
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory, flags: s.flags }; });
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(120); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(400); return pt; };
  const focus = () => p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo(); return f && !f.leaving ? f : null; }); // auf dem Rückweg = geschlossen
  const settle = async () => { for (let i = 0; i < 120; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(300); return focus(); } await p.waitForTimeout(250); } return focus(); }; // Kamera angekommen
  const narr = () => p.evaluate(() => document.querySelector('#narration').textContent);

  // Nahansicht statt Dialog
  await click3d('schluesselkasten');
  let f = await settle();
  check(Boolean(f) && !(await dlgOpen(p)), `Schlüsselkasten → Nahansicht (${f ? f.parts.length : 0} Teile), kein Dialog`);
  await p.screenshot({ path: OUT + 'ia-nah.png', timeout: 90000 });
  // Ziehen am Rad dreht nicht den Raum
  const view0 = await p.textContent('#viewName');
  const w3 = f.parts.find((x) => x.name === 'rad3');
  await p.mouse.move(w3.x, w3.y); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(w3.x + 2, w3.y + i * 10); await p.waitForTimeout(40); } await p.mouse.up(); await p.waitForTimeout(500);
  check(Boolean(await focus()) && (await p.textContent('#viewName')) === view0, 'Ziehen am Rad: Nahansicht bleibt, Raum dreht sich nicht');
  // Klassisch lösen → Dialog
  await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(800);
  check(await p.evaluate(() => Boolean(document.querySelector('#dialog[open] .lock-code'))), '„Klassisch lösen“ öffnet das Zahlenschloss im Dialog');
  await closeDlg(p); await p.waitForTimeout(1500);
  // Esc
  await click3d('schluesselkasten'); await settle(); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
  check(!(await focus()), 'Esc verlässt die Nahansicht');
  // Code per Antippen: erst alle Räder auf 0 (Ziehen vorhin hat Rad 4 verstellt), dann 2317 (falsch)
  await click3d('schluesselkasten'); f = await settle();
  const tap = async (name, n, dir) => { const w = (await focus()).parts.find((x) => x.name === name); for (let i = 0; i < n; i++) { await p.mouse.click(w.x, w.y + (dir > 0 ? -7 : 7)); await p.waitForTimeout(120); } };
  // Rad 4 steht nach dem Ziehen auf unbekannter Ziffer: per „Klassisch“-freiem Weg zurücksetzen = so oft +1, bis wir 2317 und 2117 über den Fehlertext erkennen, ist zu aufwendig → Seite neu laden
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL);
  await click3d('schluesselkasten'); await settle();
  await tap('rad0', 2, 1); await tap('rad1', 3, 1); await tap('rad2', 1, 1); await tap('rad3', 3, -1); // 2 3 1 7  (7 = drei zurück)
  await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'ia-2317.png', timeout: 90000 });
  console.log('  eingestellt:', (await focus()).value);
  const bg = (await focus()).parts.find((x) => x.name === 'buegel'); await p.mouse.click(bg.x, bg.y); await p.waitForTimeout(800);
  const n1 = await narr();
  check(/Uhr erinnert/.test(n1) && !(await st()).flags.includes('keybox_open'), `Falscher Code 2317 → Text der Engine („${n1.slice(0, 50)}…“)`);
  // 2117: Rad 2 von 3 auf 1 (zwei zurück)
  await tap('rad1', 2, -1); await p.waitForTimeout(600); console.log('  eingestellt:', (await focus()).value);
  const bg2 = (await focus()).parts.find((x) => x.name === 'buegel'); await p.mouse.click(bg2.x, bg2.y); await p.waitForTimeout(1200);
  const s1 = await st();
  check(s1.flags.includes('keybox_open') && s1.inv.includes('key217'), 'Code 2117 am Objekt → Kasten offen, Schlüssel 217 im Rucksack');
  await closeDlg(p); await p.waitForTimeout(2500);
  check(!(await focus()), 'Nahansicht schließt sich nach dem Lösen');
  await p.evaluate(() => NOCTURNE.view3d.aimAt('schluesselkasten')); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'ia-offen.png', timeout: 90000 });
  // Schraubendreher (Licht), Abdeckung
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500);
  await click3d('schraubendreher'); await closeDlg(p);
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); await closeDlg(p);
  await p.click('[data-slot="schraubendreher"]'); await p.waitForTimeout(200); await click3d('abdeckung'); await p.waitForTimeout(300); await closeDlg(p);
  check((await st()).flags.includes('cover_open'), 'Schraubendreher an der Abdeckung → cover_open');
  await p.evaluate(() => NOCTURNE.view3d.aimAt('schalter')); await p.waitForTimeout(700); await p.screenshot({ path: OUT + 'ia-schrauben.png', timeout: 90000 });
  await p.waitForTimeout(4000); await p.screenshot({ path: OUT + 'ia-platte.png', timeout: 90000 });
  await p.click('[data-slot="key217"]'); await p.waitForTimeout(200); await click3d('schalter'); await p.waitForTimeout(300); await closeDlg(p);
  check((await st()).flags.includes('elevator_open'), 'Schlüssel im Schalter → elevator_open');
  await p.evaluate(() => NOCTURNE.view3d.aimAt('schalter')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'ia-schluessel.png', timeout: 90000 });
  // Genauer ansehen
  await p.click('[data-slot="key217"]'); await p.waitForTimeout(200); await p.click('[data-slot="key217"]'); await p.waitForTimeout(500);
  check(Boolean(await p.$('#dialog[open] [data-inspect3d="key217"]')), 'Rucksack: Schlüssel 217 hat „Genauer ansehen“');
  await p.click('[data-inspect3d="key217"]'); await p.waitForTimeout(1500);
  const i0 = await p.evaluate(() => NOCTURNE.view3d.inspectInfo());
  check(Boolean(i0) && Boolean(await p.$('.n3d-inspect canvas')), 'Ansicht geöffnet');
  await p.screenshot({ path: OUT + 'ia-key-vorn.png', timeout: 90000 });
  const box = await p.$eval('.n3d-inspect canvas', (c) => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(box.x + i * 30, box.y); await p.waitForTimeout(30); } await p.mouse.up(); await p.waitForTimeout(400);
  await p.evaluate(() => { const c = document.querySelector('.n3d-inspect canvas'); c.dispatchEvent(new WheelEvent('wheel', { deltaY: -300, bubbles: true, cancelable: true })); c.dispatchEvent(new WheelEvent('wheel', { deltaY: -300, bubbles: true, cancelable: true })); });
  await p.waitForTimeout(1500);
  const i1 = await p.evaluate(() => NOCTURNE.view3d.inspectInfo());
  check(Math.abs(i1.ry - i0.ry) > 1.5 && i1.dist < i0.dist, `Ziehen dreht (${i0.ry.toFixed(2)} → ${i1.ry.toFixed(2)}), Mausrad zoomt (${i0.dist.toFixed(2)} → ${i1.dist.toFixed(2)})`);
  await p.screenshot({ path: OUT + 'ia-key-hinten.png', timeout: 90000 });
  await p.click('.n3d-inspect [data-close]'); await p.waitForTimeout(400);
  check(!(await p.$('.n3d-inspect')), 'Ansicht geschlossen');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await p.close();
  // Gegenprobe normale Version: Zahlenschloss im Dialog
  const q = await b.newPage({ viewport: { width: 1280, height: 860 } }); const e2 = []; q.on('pageerror', (e) => e2.push(e.message));
  await enter(q, BASE + '/hotel-nocturne/index.html');
  await q.click('#stage [data-hs="schluesselkasten"]', { force: true }); await q.waitForTimeout(400);
  for (const k of '2317') await q.click(`[data-key="${k}"]`); await q.waitForTimeout(600);
  const fb = await q.evaluate(() => (document.querySelector('.lock-feedback') || {}).textContent || '');
  for (const k of '2117') await q.click(`[data-key="${k}"]`); await q.waitForTimeout(800);
  const s2 = await q.evaluate(() => JSON.parse(localStorage.getItem('nocturne_save_v2')).flags);
  check(/Uhr erinnert/.test(fb) && s2.includes('keybox_open') && !e2.length, 'Normale Version: Dialog-Zahlenschloss wie bisher (Fehlertext, dann 2117 offen)');
  // iPad (Touch): Nahansicht per Fingertipp, Rolle antippen
  const ctx = await b.newContext({ ...devices['iPad Pro 11 landscape'], deviceScaleFactor: 1 }); const t3 = await ctx.newPage(); t3.setDefaultTimeout(30000); const e3 = []; t3.on('pageerror', (e) => e3.push(e.message));
  await t3.goto(BASE + '/hotel-nocturne/3d.html?q=' + QUAL, { timeout: 60000 }); await t3.evaluate(() => localStorage.clear()); await t3.reload({ timeout: 60000 }); await t3.waitForTimeout(400);
  const js = (sel) => t3.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return Boolean(e); }, sel); // Vorbereitung per Skript (Touch nur im 3D-Bild)
  await js('#startButton'); await t3.waitForTimeout(800); await js('.cf-cold .cine-btn'); await t3.waitForTimeout(600);
  for (let i = 0; i < 10; i++) { if (!(await js('[data-pz="next"]'))) break; await t3.waitForTimeout(300); }
  await t3.waitForTimeout(500); await js('.cine-btn'); await t3.waitForTimeout(1500); await js('#dialog[open] [data-close]'); await t3.waitForTimeout(600);
  const kp = await t3.evaluate(() => NOCTURNE.view3d.aimAt('schluesselkasten')); await t3.waitForTimeout(150); await t3.touchscreen.tap(kp.x, kp.y);
  let tf = null; for (let i = 0; i < 120; i++) { tf = await t3.evaluate(() => NOCTURNE.view3d.focusInfo()); if (tf && tf.arrived) break; await t3.waitForTimeout(250); }
  const r0 = tf && tf.parts.find((x) => x.name === 'rad0');
  if (r0) { await t3.touchscreen.tap(r0.x, r0.y - 8); await t3.waitForTimeout(500); await t3.touchscreen.tap(r0.x, r0.y - 8); await t3.waitForTimeout(500); }
  const v = await t3.evaluate(() => { const f = NOCTURNE.view3d.focusInfo(); return f ? f.value : null; });
  await t3.screenshot({ path: OUT + 'ia-ipad.png', timeout: 90000 });
  check(Boolean(tf) && v === '2000' && !e3.length, `iPad: Fingertipp öffnet die Nahansicht, zwei Tipps auf Rolle 1 → ${v}`);
  await ctx.close();
  await b.close();
  console.log(ok ? '\nDirekte Bedienung in der Rezeption in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
