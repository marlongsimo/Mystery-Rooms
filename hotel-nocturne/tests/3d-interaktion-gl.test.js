/*
 * Hotel Nocturne – 3D-Testmodus: Gepäcklager direkt bedienen.
 * Handlungen (Kofferanhänger 2/9/4, Eimer, Notbeleuchtung, Klingel) → danach der gewohnte Text · Gepäckschein selbst in den Schlitz
 * schieben → Koffer 6 · Käfigschlüssel drehen → Käfig offen · Truhe: Zahlenschloss 2694 am Objekt · Archivschlüssel mit Drehgeste.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-gl.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const shot = (pg, o) => (process.env.SHOTS ? pg.screenshot(o) : Promise.resolve()); // Bildschirmfotos nur mit SHOTS=1
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'gepaecklager', unlocked: ['rezeption', 'zimmer217', 'gepaecklager'], visited: ['rezeption', 'zimmer217', 'gepaecklager'], completed: ['rezeption', 'zimmer217'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open'],
  inventory: ['key217', 'hotelplan', 'schraubendreher', 'personalschluessel', 'gepaeckschein'],
  docs: ['reservierung', 'keyboxnotiz', 'personalfoto'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
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
  for (const id of ['koffer9', 'eimer']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); await p.waitForTimeout(150); await p.mouse.click(pt.x, pt.y);
    if (id === 'koffer9') { await p.waitForTimeout(600); await shot(p, { path: OUT + 'gl2-anhaenger.png', timeout: 90000 }); }
    let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(900);
  }
  const tap = async (name, n, dir) => { for (let i = 0; i < n; i++) { const w = (await focus()).parts.find((x) => x.name === name); await p.mouse.click(w.x, w.y + (dir > 0 ? -6 : 6)); await p.waitForTimeout(110); } };
  const pull = async () => { const g = (await focus()).parts.find((x) => x.name === 'griff'); await p.mouse.click(g.x, g.y); await p.waitForTimeout(1000); };
  // Gepäckschein selbst in den Schlitz
  await p.click('[data-slot="gepaeckschein"]'); await p.waitForTimeout(200);
  let pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('klappe')); await p.mouse.click(pt.x, pt.y); let f = await settle();
  check(Boolean(f) && f.id === 'klappe', 'Gepäckschein an der Klappe → Nahansicht, Schein liegt am Schlitz');
  await shot(p, { path: OUT + 'gl2-schein.png', timeout: 90000 });
  const sc = f.parts[0]; await p.mouse.move(sc.x, sc.y); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(sc.x, sc.y + i * 14); await p.waitForTimeout(30); } await p.mouse.up();
  for (let i = 0; i < 24 && !(await st()).flags.includes('koffer_da'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('koffer_da'), 'Schein nach unten geschoben → Koffer Nr. 6 kommt (koffer_da)');
  for (let i = 0; i < 24 && !(await dlg()); i++) await p.waitForTimeout(250); await closeDlg(); await p.waitForTimeout(3000); await closeDlg();
  // Käfigschlüssel nehmen und selbst drehen
  pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('kaefigschluessel')); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(800); await closeDlg();
  check((await st()).inv.includes('kaefigschluessel'), 'Käfigschlüssel genommen');
  await p.click('[data-slot="kaefigschluessel"]'); await p.waitForTimeout(200);
  pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('kaefigtuer')); await p.mouse.click(pt.x, pt.y); f = await settle();
  check(Boolean(f) && f.id === 'kaefigtuer', 'Käfigschlüssel an der Käfigtür → Nahansicht');
  for (let i = 0; i < 3; i++) { const k = (await focus()).parts[0]; await p.mouse.click(k.x, k.y); await p.waitForTimeout(350); }
  for (let i = 0; i < 24 && !(await st()).flags.includes('kaefig_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('kaefig_offen'), 'Schlüssel gedreht → Käfig offen'); await closeDlg(); await p.waitForTimeout(3000);
  // Truhe: 2694
  pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('truhe')); await p.mouse.click(pt.x, pt.y); f = await settle();
  check(Boolean(f) && f.id === 'truhe', 'Truhe → Nahansicht mit Zahlenschloss');
  await tap('rad0', 2, 1); await tap('rad1', 4, -1); await tap('rad2', 1, -1); await tap('rad3', 4, 1);
  console.log('  eingestellt:', (await focus()).value); await shot(p, { path: OUT + 'gl2-truhe.png', timeout: 90000 });
  await pull(); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  const s1 = await st(); check(s1.flags.includes('truhe_offen') && s1.inv.includes('archivschluessel'), '2694 am Objekt → Truhe offen, Archivschlüssel im Rucksack');
  await closeDlg(); await p.waitForTimeout(3000);
  // Archivschlüssel mit Drehgeste
  await p.click('[data-slot="archivschluessel"]'); await p.waitForTimeout(200);
  pt = await p.evaluate(() => NOCTURNE.view3d.aimAt('archivtuer')); await p.mouse.click(pt.x, pt.y); f = await settle();
  check(Boolean(f) && f.id === 'archivtuer', 'Archivschlüssel an der Archivtür → Nahansicht');
  await shot(p, { path: OUT + 'gl2-archivtuer.png', timeout: 90000 });
  const k = f.parts[0], r = 28; await p.mouse.move(k.x, k.y); await p.mouse.down(); await p.mouse.move(k.x + r, k.y);
  for (let i = 1; i <= 7; i++) { const a = (i / 16) * Math.PI * 2; await p.mouse.move(k.x + r * Math.cos(a), k.y + r * Math.sin(a)); await p.waitForTimeout(30); } await p.mouse.up();
  for (let i = 0; i < 24 && !(await st()).flags.includes('archiv_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('archiv_offen'), 'Schlüssel im Uhrzeigersinn gedreht → Archivtür offen');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nGepäcklager direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
