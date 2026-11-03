/*
 * Hotel Nocturne – 3D-Testmodus: Überwachungsraum direkt bedienen.
 * Handlungen (Dienstplan, Telefon, Monitor, Hülle, Druckerstreifen, Pult, Tür „Technik“) → danach der gewohnte Text ·
 * Backup-Band selbst in den Rekorder schieben · Zeitleiste klassisch · Datei 5 an der Tastatur: VALE → Engine-Text, MARA → Tür frei.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-ue.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const shot = (pg, o) => (process.env.SHOTS ? pg.screenshot(o) : Promise.resolve()); // Bildschirmfotos nur mit SHOTS=1
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'ueberwachung', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen'],
  inventory: ['hotelplan', 'schraubendreher', 'backupband'],
  docs: ['reservierung', 'keyboxnotiz', 'personalfoto'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
(async () => {
  const b = await chromium.launch(ARGS); const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.setDefaultTimeout(90000);
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('nocturne_save_3d_v2', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, SAVE);
  await p.goto(BASE + '/hotel-nocturne/3d.html?q=' + QUAL, { timeout: 90000 }); await p.waitForTimeout(500);
  await p.click('#startButton'); await p.waitForTimeout(1500); if (await p.$('#dialog[open] #closeDialog')) await p.click('#closeDialog');
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory, flags: s.flags, solved: s.solved }; });
  const dlg = () => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null));
  const closeDlg = async () => { if (await dlg()) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const focus = () => p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async () => { for (let i = 0; i < 160; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(300); return f; } await p.waitForTimeout(250); } return focus(); };
  const narr = () => p.evaluate(() => document.querySelector('#narration').textContent);
  const waitMoment = () => p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 30000 }).catch(() => {});
  const part = async (name) => (await focus()).parts.find((x) => x.name === name);
  const tapPart = async (name, n = 1, dir = 0) => { for (let i = 0; i < n; i++) { const w = await part(name); await p.mouse.click(w.x, w.y + (dir > 0 ? -6 : dir < 0 ? 6 : 0)); await p.waitForTimeout(110); } };
  const aimClick = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); await p.waitForTimeout(150); await p.mouse.click(pt.x, pt.y); };
  // Handlungen, dann der Text der Engine
  for (const id of ['dienstplan', 'monitor1']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    await aimClick(id); await p.waitForTimeout(0);
    if (id === 'dienstplan') { await p.waitForTimeout(600); await shot(p, { path: OUT + 'ue2-plan.png', timeout: 90000 }); }
    let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(900);
  }
  // Backup-Band selbst in den Schacht
  await p.click('[data-slot="backupband"]'); await p.waitForTimeout(200);
  await aimClick('rekorder'); let f = await settle();
  check(Boolean(f) && f.id === 'rekorder', 'Backup-Band am Rekorder → Nahansicht, Band vor dem Schacht');
  await shot(p, { path: OUT + 'ue2-band.png', timeout: 90000 });
  const bd = await part('band'); await p.mouse.move(bd.x, bd.y); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(bd.x, bd.y - i * 14); await p.waitForTimeout(30); } await p.mouse.up();
  for (let i = 0; i < 24 && !(await st()).flags.includes('band_eingelegt'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('band_eingelegt'), 'Band hineingeschoben → band_eingelegt'); await closeDlg(); await p.waitForTimeout(2500);
  await p.evaluate(() => { NOCTURNE.view3d.aimAt('monitor1'); NOCTURNE.view3d.sync(); }); await p.waitForTimeout(4000); await waitMoment(); await closeDlg(); await p.waitForTimeout(500); await closeDlg();
  // Zeitleiste klassisch (bleibt ein Dialog)
  await aimClick('terminal'); for (let i = 0; i < 12 && !(await dlg()); i++) await p.waitForTimeout(250);
  const move = async (i, d) => { await p.click(`[data-move="${d}"][data-i="${i}"]`); await p.waitForTimeout(150); };
  await move(2, -1); await move(1, -1); await move(3, -1); await move(2, -1); await move(3, -1);
  await p.click('[data-sort-check]'); await p.waitForTimeout(1500); await closeDlg(); await waitMoment(); await closeDlg();
  check((await st()).flags.includes('zeitleiste_ok'), 'Zeitleiste geordnet (Dialog)'); await p.waitForTimeout(1500);
  // Datei 5 an der Tastatur
  await aimClick('terminal_datei5'); f = await settle();
  check(Boolean(f) && f.id === 'terminal_datei5', 'Datei 5 → Nahansicht mit Tastatur und Zettel');
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('nocturne_save_3d_v2')).docs.includes('kennwortzettel')), 'Zettel liegt in der Akte (wie beim Dialog)');
  for (const c of 'VALE') await tapPart('taste' + c); await p.waitForTimeout(700);
  check(/Register/.test(await narr()), 'VALE → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  await p.waitForTimeout(1300); for (const c of 'MAR') await tapPart('taste' + c);
  console.log('  Eingabe:', (await focus()).value); await shot(p, { path: OUT + 'ue2-tastatur.png', timeout: 90000 }); await tapPart('tasteA');
  for (let i = 0; i < 24 && !(await st()).flags.includes('datei5_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('datei5_offen'), 'MARA → Datei 5 offen, Tür „Technik“ frei');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nÜberwachungsraum direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
