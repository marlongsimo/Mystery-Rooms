/*
 * Hotel Nocturne – 3D-Testmodus: Büro direkt bedienen.
 * Stichproben (Brief, Bild) → danach der gewohnte Text · Taschenlampe an, Messingriegel selbst zurückschieben →
 * Schublade mit dem Foto · Abschlussbericht im Dialog · Tor W2 am Ende der Rampe: 2317 → Engine-Text, 2324 → Tor offen.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-buero.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const shot = (pg, o) => (process.env.SHOTS ? pg.screenshot(o) : Promise.resolve()); // Bildschirmfotos nur mit SHOTS=1
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'buero', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller', 'buero'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller', 'buero'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin', 'band', 'zeitleiste', 'datei5', 'sicherung', 'f3', 'generator', 'hebel', 'waescheschrank', 'tuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen', 'band_eingelegt', 'monitor2_gesehen', 'zeitleiste_ok', 'datei5_offen', 'taken_sicherung', 'f3_drin', 'gen_laeuft', 'strom', 'schrank_weg', 'tuer_offen'],
  inventory: ['hotelplan', 'schraubendreher'],
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
  // Stichproben: Handlung, dann der Text der Engine
  for (const id of ['b_brief', 'b_bild']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    await aimClick(id); let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(900);
  }
  // Taschenlampe an, Riegel zurückschieben
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); await closeDlg();
  await aimClick('b_riegel'); let f = await settle();
  check(Boolean(f) && f.id === 'b_riegel', 'Mit Licht: Riegel unter der Platte → Nahansicht');
  await shot(p, { path: OUT + 'bu2-riegel.png', timeout: 90000 });
  const rg = await part('riegel'); await p.mouse.move(rg.x, rg.y); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(rg.x + i * 12, rg.y); await p.waitForTimeout(30); } await p.mouse.up();
  let t = null; for (let i = 0; i < 24 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
  check(t === 'Ein kleiner Riegel' && (await p.evaluate(() => JSON.parse(localStorage.getItem('nocturne_save_3d_v2')).docs.includes('foto_2005'))), 'Riegel geschoben → Text der Engine, Foto in der Akte');
  await closeDlg(); await p.waitForTimeout(2500);
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); await closeDlg();
  // Abschlussbericht (bleibt Dialog; vorher dreht die Wählscheibe)
  await aimClick('b_tresor'); for (let i = 0; i < 16 && !(await p.$('.lock-multi')); i++) await p.waitForTimeout(250);
  const vals = ['Westgang', '6', 'Elias Voss', 'M. Vale', 'Viktor Lehn'];
  const inputs = await p.$$('.lock-multi .multi-field input'); for (let i = 0; i < inputs.length; i++) await inputs[i].fill(vals[i]);
  await p.click('.lock-multi .submit-button'); await p.waitForTimeout(1500); await closeDlg(); await waitMoment(); await closeDlg();
  check((await st()).flags.includes('tunnel_offen'), 'Bericht eingereicht → Tunnel offen'); await p.waitForTimeout(2500);
  // Tor W2: Kamera fährt die Rampe hinauf
  await aimClick('b_tunnel'); f = await settle();
  check(Boolean(f) && f.id === 'b_tunnel', 'Tunnel → Nahansicht am Tastenfeld von Tor W2');
  for (const k of '2317') await tapPart('taste' + k); await p.waitForTimeout(700);
  check(/23:17 fiel der Strom/.test(await narr()), '2317 → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  await p.waitForTimeout(800); for (const k of '232') await tapPart('taste' + k);
  console.log('  Anzeige:', (await focus()).value); await shot(p, { path: OUT + 'bu2-tor.png', timeout: 90000 }); await tapPart('taste4');
  for (let i = 0; i < 24 && !(await st()).flags.includes('tor_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('tor_offen'), '2324 → Tor W2 offen');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nBüro direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
