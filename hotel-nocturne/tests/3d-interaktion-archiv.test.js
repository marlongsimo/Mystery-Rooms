/*
 * Hotel Nocturne – 3D-Testmodus: Archiv direkt bedienen.
 * Handlungen (Protokollbuch, Schreibmaschine, Leselampe, Karton, Akte, Protokolle) → danach der gewohnte Text · Chiffrierscheibe
 * selbst drehen (falsch: 23 → Engine-Text; richtig: 3) · Fach WESTGANG an acht Rädern · Schublade W mit dem Schraubendreher aufhebeln ·
 * Tastenfeld: 2009 falsch → Engine-Text, 1897 → Stahltür offen.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-interaktion-archiv.test.js   (ca. 6 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SAVE = { v: 2, started: true, finished: false, current: 'archiv', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], completed: ['rezeption', 'zimmer217', 'gepaecklager'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen'],
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
  // Handlungen, dann der Text der Engine
  for (const id of ['protokollbuch_regal', 'schreibmaschine', 'leselampe', 'personalkasten', 'akte_elias', 'protokoll_a']) {
    const want = await p.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id);
    await aimClick(id);
    if (id === 'akte_elias') { await p.waitForTimeout(700); await p.screenshot({ path: OUT + 'ar2-akte.png', timeout: 90000 }); }
    let t = null; for (let i = 0; i < 30 && !t; i++) { await p.waitForTimeout(250); t = await dlg(); }
    check(t === want, `${id}: Handlung, dann „${t}“`); await closeDlg(); await p.waitForTimeout(900);
  }
  // Chiffrierscheibe: falsche Richtung (23), dann 3
  await aimClick('chiffrierscheibe'); let f = await settle();
  check(Boolean(f) && f.id === 'chiffrierscheibe', 'Chiffrierscheibe → Nahansicht mit drehbarem Ring');
  await tapPart('ring', 23); console.log('  eingestellt:', (await focus()).value); await tapPart('pruefen'); await p.waitForTimeout(500);
  check(/Falsche Richtung/.test(await narr()), 'Stellung 23 geprüft → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  // per Drehgeste weiter (eine Vierteldrehung im Uhrzeigersinn ≈ 6–7 Stellen), danach auf 3 antippen
  const r0 = await part('ring'); const R = 60; await p.mouse.move(r0.x + R, r0.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { const a = (i / 32) * Math.PI * 2; await p.mouse.move(r0.x + R * Math.cos(a), r0.y + R * Math.sin(a)); await p.waitForTimeout(30); } await p.mouse.up(); await p.waitForTimeout(300);
  const afterDrag = Number((await focus()).value); console.log('  nach Drehgeste:', afterDrag); check(afterDrag !== 23, 'Drehgeste verstellt den Ring');
  await tapPart('ring', ((3 - afterDrag) % 26 + 26) % 26); console.log('  eingestellt:', (await focus()).value);
  await p.screenshot({ path: OUT + 'ar2-scheibe.png', timeout: 90000 });
  await tapPart('pruefen'); for (let i = 0; i < 20 && !(await st()).solved.includes('chiffre'); i++) await p.waitForTimeout(250);
  check((await st()).solved.includes('chiffre'), 'Stellung 3 → Brief entschlüsselt (chiffre)'); await waitMoment(); await closeDlg(); await p.waitForTimeout(2500);
  // Fach: WESTGANG
  await aimClick('schreibtischfach'); f = await settle();
  check(Boolean(f) && f.id === 'schreibtischfach', 'Schreibtischfach → Nahansicht mit acht Buchstabenrädern');
  const word = 'WESTGANG'; for (let i = 0; i < 8; i++) { const c = word.charCodeAt(i) - 65; if (c <= 13) await tapPart('rad' + i, c, 1); else await tapPart('rad' + i, 26 - c, -1); }
  console.log('  eingestellt:', (await focus()).value); await p.screenshot({ path: OUT + 'ar2-fach.png', timeout: 90000 });
  await tapPart('griff'); for (let i = 0; i < 20 && !(await st()).flags.includes('fach_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('fach_offen'), 'WESTGANG am Objekt → Fach offen'); await waitMoment(); await closeDlg(); await p.waitForTimeout(2500);
  // Schublade W: Schraubendreher wählen, aufhebeln
  await p.click('[data-slot="schraubendreher"]'); await p.waitForTimeout(200);
  await aimClick('schublade_w'); f = await settle();
  check(Boolean(f) && f.id === 'schublade_w', 'Schraubendreher an Schublade W → Nahansicht, Klinge im Spalt');
  const h = await part('hebel'); await p.mouse.move(h.x, h.y); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(h.x, h.y + i * 14); await p.waitForTimeout(30); } await p.mouse.up();
  for (let i = 0; i < 24 && !(await st()).flags.includes('fachw_offen'); i++) await p.waitForTimeout(250);
  const s2 = await st(); check(s2.flags.includes('fachw_offen') && s2.inv.includes('backupband'), 'Aufgehebelt → Schublade W offen, Band im Rucksack'); await waitMoment(); await closeDlg(); await p.waitForTimeout(2500);
  // Tastenfeld: 2009 falsch, dann 1897
  await aimClick('stahltuer'); f = await settle();
  check(Boolean(f) && f.id === 'stahltuer', 'Stahltür → Nahansicht am Tastenfeld');
  for (const k of '2009') await tapPart('taste' + k); await p.waitForTimeout(600);
  check(/Jahr der Nacht/.test(await narr()), '2009 → Text der Engine („' + (await narr()).slice(0, 50) + '…“)');
  await p.waitForTimeout(800); for (const k of '189') await tapPart('taste' + k);
  console.log('  Anzeige:', (await focus()).value); await p.screenshot({ path: OUT + 'ar2-pin.png', timeout: 90000 }); await tapPart('taste7');
  for (let i = 0; i < 20 && !(await st()).flags.includes('sicherheit_offen'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('sicherheit_offen'), '1897 → Stahltür offen');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nArchiv direkt bedienen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
