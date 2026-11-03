/*
 * Hotel Nocturne – 3D-Testmodus: Keller direkt bedienen.
 * Taschenlampe an · Stichproben (Anleitung, Generator) → danach der gewohnte Text · Sicherung selbst einsetzen ·
 * Generator: Choke zuerst (falsch → Engine-Text, alles zurück), dann Hahn–Choke–Zündung–Starter · Hebel A-B-C-D (falsch → zurück),
 * dann C-A-D-B · vier Schrauben am Wäscheschrank (antippen / drehen) → Schrank rutscht weg.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-keller.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const shot = (pg, o) => (process.env.SHOTS ? pg.screenshot(o) : Promise.resolve()); // Bildschirmfotos nur mit SHOTS=1
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'keller', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin', 'band', 'zeitleiste', 'datei5', 'sicherung'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen', 'band_eingelegt', 'monitor2_gesehen', 'zeitleiste_ok', 'datei5_offen', 'taken_sicherung'],
  inventory: ['hotelplan', 'schraubendreher', 'sicherung'],
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
  // Taschenlampe an (Keller ist dunkel)
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); await closeDlg();
  // Stichproben: Handlung, dann der Text der Engine
  for (const id of ['anleitung', 'generator']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    await aimClick(id); let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(900);
  }
  // Sicherung selbst einsetzen
  await p.click('[data-slot="sicherung"]'); await p.waitForTimeout(200);
  await aimClick('sicherungsfach'); let f = await settle();
  check(Boolean(f) && f.id === 'sicherungsfach', 'Sicherung am Fach → Nahansicht');
  await shot(p, { path: OUT + 'ke2-sicherung.png', timeout: 90000 });
  await tapPart('sicherung', 2); for (let i = 0; i < 24 && !(await st()).flags.includes('f3_drin'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('f3_drin'), 'Sicherung hineingedrückt → f3_drin'); await waitMoment(); await closeDlg(); await p.waitForTimeout(2500);
  // Generator: erst falsch (Choke zuerst), dann richtig
  await aimClick('bedienfeld'); f = await settle();
  check(Boolean(f) && f.id === 'bedienfeld', 'Bedienfeld → Nahansicht mit vier Bedienelementen');
  await tapPart('choke'); await p.waitForTimeout(600);
  check(/trocken/.test(await narr()), 'Choke zuerst → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  await p.waitForTimeout(800); check((await focus()).value === '', 'Bedienelemente springen zurück');
  for (const id of ['hahn', 'choke', 'zuendung']) { await tapPart(id); await p.waitForTimeout(300); }
  console.log('  Reihenfolge:', (await focus()).value); await shot(p, { path: OUT + 'ke2-bedienfeld.png', timeout: 90000 }); await tapPart('starter');
  for (let i = 0; i < 24 && !(await st()).flags.includes('gen_laeuft'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('gen_laeuft'), 'Hahn–Choke–Zündung–Starter → Generator läuft'); await p.waitForTimeout(1500); await waitMoment(); await closeDlg(); await p.waitForTimeout(2500);
  // Schalttafel: erst A-B-C-D (falsch), dann C-A-D-B
  await aimClick('schalttafel'); f = await settle();
  check(Boolean(f) && f.id === 'schalttafel', 'Schalttafel → Nahansicht mit vier Hebeln');
  for (const l of 'ABCD') { await tapPart('hebel' + l); await p.waitForTimeout(300); } await p.waitForTimeout(600);
  check(/Wandplan beschreibt nicht/.test(await narr()), 'A-B-C-D → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  await p.waitForTimeout(900);
  for (const l of 'CAD') { await tapPart('hebel' + l); await p.waitForTimeout(300); }
  console.log('  Reihenfolge:', (await focus()).value); await shot(p, { path: OUT + 'ke2-hebel.png', timeout: 90000 }); await tapPart('hebelB');
  for (let i = 0; i < 24 && !(await st()).flags.includes('strom'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('strom'), 'C-A-D-B → Strom'); await p.waitForTimeout(9000); await waitMoment(); await closeDlg(); await closeDlg();
  // Wäscheschrank: vier Schrauben
  await p.click('[data-slot="schraubendreher"]'); await p.waitForTimeout(200);
  await aimClick('waescheschrank'); f = await settle();
  check(Boolean(f) && f.id === 'waescheschrank', 'Schraubendreher am Wäscheschrank → Nahansicht');
  const sc = await part('schraube0'); const r = 26; await p.mouse.move(sc.x + r, sc.y); await p.mouse.down();
  for (let i = 1; i <= 18; i++) { const a = -(i / 16) * Math.PI * 2; await p.mouse.move(sc.x + r * Math.cos(a), sc.y + r * Math.sin(a)); await p.waitForTimeout(25); } await p.mouse.up();
  console.log('  nach Drehen:', (await focus()).value);
  for (const n of ['schraube1', 'schraube2', 'schraube3']) await tapPart(n, 2);
  for (let i = 0; i < 24 && !(await st()).flags.includes('schrank_weg'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('schrank_weg'), 'Vier Schrauben heraus → Schrank rutscht zur Seite');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nKeller direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
