/*
 * Hotel Nocturne – 3D-Testmodus: Zimmer 217 direkt bedienen.
 * Handlungen (Sanduhr, Kerzenständer, alter Schlüssel, Porträt, Mantel, Vorhang, Nachttisch, Schreibtisch) → danach der gewohnte Text ·
 * Kommode: Zahlenschloss am Objekt (4137 → Fehlertext der Engine, 4173 → offen) · Kleiderschrank: Buchstabenräder ELIAS → offen,
 * Personalschlüssel im Rucksack. Bilder im Temp-Ordner (z2-*.png).
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-217.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'zimmer217', unlocked: ['rezeption', 'zimmer217'], visited: ['rezeption', 'zimmer217'], completed: ['rezeption'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator'], flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open'],
  inventory: ['key217', 'hotelplan', 'schraubendreher'], docs: ['reservierung'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
(async () => {
  const b = await chromium.launch(ARGS); const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.setDefaultTimeout(90000);
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('nocturne_save_3d_v2', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, SAVE);
  await p.goto(BASE + '/hotel-nocturne/3d.html?q=' + QUAL, { timeout: 90000 }); await p.waitForTimeout(500);
  await p.click('#startButton'); await p.waitForTimeout(1500); if (await p.$('#dialog[open] #closeDialog')) await p.click('#closeDialog');
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory, flags: s.flags }; });
  const dlg = () => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null));
  const closeDlg = async () => { if (await dlg()) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const focus = () => p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async () => { for (let i = 0; i < 160; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(300); return f; } await p.waitForTimeout(250); } return focus(); };
  const narr = () => p.evaluate(() => document.querySelector('#narration').textContent);
  // Handlungen, dann der Text der Engine
  for (const id of ['sanduhr', 'kerzenstaender', 'alterschluessel', 'portraet217', 'mantel', 'vorhang', 'nachttisch', 'schreibtisch']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); await p.waitForTimeout(150); await p.mouse.click(pt.x, pt.y);
    if (['sanduhr', 'kerzenstaender', 'alterschluessel', 'portraet217'].includes(id)) { await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}z2-${id}.png`, timeout: 90000 }); }
    let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(500);
  }
  const tap = async (name, n, dir) => { for (let i = 0; i < n; i++) { const w = (await focus()).parts.find((x) => x.name === name); await p.mouse.click(w.x, w.y + (dir > 0 ? -6 : 6)); await p.waitForTimeout(110); } };
  const pull = async () => { const g = (await focus()).parts.find((x) => x.name === 'griff'); await p.mouse.click(g.x, g.y); await p.waitForTimeout(1000); };
  // Kommode: 4137 (falsch), dann 4173
  let pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('kommode')); await p.mouse.click(pt.x, pt.y); let f = await settle();
  check(Boolean(f) && f.id === 'kommode' && !(await dlg()), 'Kommode → Nahansicht mit Zahlenschloss');
  await tap('rad0', 4, 1); await tap('rad1', 1, 1); await tap('rad2', 3, 1); await tap('rad3', 3, -1); // 4 1 3 7
  console.log('  eingestellt:', (await focus()).value); await p.screenshot({ path: OUT + 'z2-kommode.png', timeout: 90000 });
  await pull(); check(/Fast/.test(await narr()) && !(await st()).flags.includes('kommode_open'), `4137 → Text der Engine („${(await narr()).slice(0, 45)}…“)`);
  await tap('rad2', 4, 1); await tap('rad3', 4, -1); // 4 1 7 3
  console.log('  eingestellt:', (await focus()).value);
  await pull(); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('kommode_open'), '4173 am Objekt → Kommode offen'); await closeDlg(); await p.waitForTimeout(2500);
  // Schrank: ELIAS (E +4, L +11, I +8, A 0, S −8)
  pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('schrank')); await p.mouse.click(pt.x, pt.y); f = await settle();
  check(Boolean(f) && f.id === 'schrank' && f.parts.length === 6, 'Kleiderschrank → Nahansicht mit 5 Buchstabenrädern');
  await tap('rad0', 4, 1); await tap('rad1', 11, 1); await tap('rad2', 8, 1); await tap('rad4', 8, -1);
  console.log('  eingestellt:', (await focus()).value); await p.screenshot({ path: OUT + 'z2-schrank.png', timeout: 90000 });
  await pull(); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  const s1 = await st(); check(s1.flags.includes('schrank_open') && s1.inv.includes('personalschluessel'), 'ELIAS am Objekt → Schrank offen, Personalschlüssel im Rucksack');
  await closeDlg(); await p.waitForTimeout(2500);
  await p.evaluate(() => NOCTURNE.view3d.aimAt('schrank')); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'z2-schrank-offen.png', timeout: 90000 });
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nZimmer 217 direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
