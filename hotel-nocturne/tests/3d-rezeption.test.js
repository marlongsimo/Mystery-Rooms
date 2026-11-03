/*
 * Hotel Nocturne – 3D-Testmodus: Vergleich 3D ↔ 2D für alle Hotspots der Rezeption und kompletter Durchlauf in 3D bis Zimmer 217 (ebenfalls 3D).
 * Aufruf (aus dem Repository-Wurzelordner):
 *   python3 -m http.server 8765 &
 *   node hotel-nocturne/tests/3d-rezeption.test.js
 * Braucht Playwright mit Chromium (Software-Rendering per SwiftShader reicht, ist aber langsam: ca. 3 Minuten).
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const { chromium, devices } = require('playwright');
const OUT = require('os').tmpdir() + '/';
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
async function enter(p, url) {
  await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.click('#startButton'); await p.waitForTimeout(500);
  if (await p.$('.cf-cold .cine-btn')) { await p.click('.cf-cold .cine-btn'); await p.waitForTimeout(400); } // Vorspann (filmische Fallakte)
  for (let i = 0; i < 10; i++) { const n = await p.$('[data-pz="next"]'); if (!n) break; await n.click(); await p.waitForTimeout(200); }
  await p.waitForTimeout(300); if (await p.$('.cine-btn')) await p.click('.cine-btn'); await p.waitForTimeout(700);
  if (await p.$('#dialog[open] [data-close]')) await p.click('#dialog[open] [data-close]'); await p.waitForTimeout(300);
}
const dlgTitle = (p) => p.evaluate(() => { const d = document.querySelector('#dialog'); return d.open ? document.querySelector('#dlgTitle').textContent : null; });
const closeDlg = async (p) => { if (await p.evaluate(() => document.querySelector('#dialog').open)) { await p.click('#closeDialog'); await p.waitForTimeout(250); } };
(async () => {
  const b = await chromium.launch(ARGS); const errs = [];
  // ---- 2D: Referenz-Titel je Hotspot
  const p2 = await b.newPage({ viewport: { width: 1280, height: 860 } }); p2.on('pageerror', e => errs.push('2D ' + e.message));
  await enter(p2, BASE + '/hotel-nocturne/index.html');
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { await p2.click(`#stage [data-hs="${id}"]`, { force: true }); await p2.waitForTimeout(250); ref[id] = await dlgTitle(p2); await closeDlg(p2); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  // ---- 3D
  await p2.close(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', e => errs.push('3D ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL);
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return 'kein Objekt'; await p.waitForTimeout(120); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // Objekte mit kurzer Handlung öffnen den Text erst danach
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    // direkt bedienbare Objekte öffnen die Nahansicht – für den Vergleich mit 2D den klassischen Dialog nehmen
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(500); }
    return pt; };
  let same = 0, diff = [];
  for (const id of Object.keys(ref)) {
    const pt = await click3d(id); const t = await dlgTitle(p);
    if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“ ${pt === 'kein Objekt' ? '(kein Objekt)' : ''}`);
    await closeDlg(p);
  }
  console.log(`Hotspots im Startzustand: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  // ---- Durchspielen in 3D
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory.join(','), flags: s.flags.filter((f) => !f.startsWith('evt_')).join(','), room: s.current }; });
  await click3d('schluesselkasten'); for (const k of '2117') await p.click(`[data-key="${k}"]`); await p.waitForTimeout(500);
  console.log('Code 2117 →', JSON.stringify(await st())); await closeDlg(p); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + 'p-keybox.png', timeout: 90000 });
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500);
  console.log('Taschenlampe an:', await p.evaluate(() => NOCTURNE.engine.isLight()));
  const pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('schraubendreher')); await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + 'p-light.png', timeout: 90000 });
  await click3d('schraubendreher'); console.log('Schraubendreher →', (await st()).inv); await closeDlg(p);
  await p.click('[data-slot="schraubendreher"]'); await p.waitForTimeout(200); await click3d('abdeckung'); await p.waitForTimeout(300);
  console.log('Abdeckung →', (await st()).flags); await closeDlg(p);
  await p.click('[data-slot="key217"]'); await p.waitForTimeout(200); await click3d('schalter'); await p.waitForTimeout(300);
  console.log('Schalter →', (await st()).flags); await closeDlg(p); await p.waitForTimeout(2500);
  await p.evaluate(() => NOCTURNE.view3d.aimAt('aufzug_offen')); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'p-elevator.png', timeout: 90000 });
  // Schublade (reine Optik)
  const dr = await p.evaluate(() => NOCTURNE.view3d.aimAt('Schublade')); await p.mouse.click(dr.x, dr.y); await p.waitForTimeout(600);
  console.log('Schublade:', (await p.textContent('#narration')).slice(0, 60));
  // Ziehen dreht die Kamera und die Ansicht
  await p.evaluate(() => NOCTURNE.view3d.aimAt('uhr')); const c = await p.$eval('canvas.n3d', (x) => { const r = x.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x, c.y); await p.mouse.down(); for (let i = 1; i <= 20; i++) await p.mouse.move(c.x - i * 18, c.y); await p.mouse.up(); await p.waitForTimeout(300);
  console.log('Nach Ziehen:', await p.textContent('#viewName'));
  // Neu laden: Zustand bleibt, normaler Spielstand unberührt
  await p.reload(); await p.waitForTimeout(400); await p.click('#startButton'); await p.waitForTimeout(1200);
  console.log('Nach Neuladen 3D:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), JSON.stringify(await st()), '| normaler Spielstand vorhanden:', await p.evaluate(() => !!localStorage.getItem('nocturne_save_v2')));
  // Aufzug betreten → Zimmer 217 (2D)
  await click3d('aufzug_offen'); await p.waitForTimeout(1800);
  console.log('Aufzug →', (await st()).room, '| Zimmer 217 in 3D:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
