/*
 * SEKTOR 9 – Abschnitt 1 (Verteilerhalle, Kommando-Halle) einmal ganz durchspielen, in 3D und direkt am Objekt.
 * Handrad drehen → Kommando-Halle · Fernmeldeplan → Gitter 4625 (Zahlenschloss) → Funkstation (Schlüssel, Band, Tonbandgerät)
 * → Notstrom-Schlüssel drehen → Lagezentrum → Kassette 2345 (falsch) / 2338 → Karte B → Nordtür → Ende des Abschnitts.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/abschnitt1.test.js   (SHOTS=1 für Bildschirmfotos)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const shot = (p, name) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9-' + name + '.png', timeout: 90000 }) : Promise.resolve());
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.setDefaultTimeout(60000);
  const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s9')) { localStorage.removeItem('sektor9_save_v1'); sessionStorage.setItem('s9', '1'); } });
  await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(500);
  await p.click('#startBtn'); await p.waitForTimeout(2500);
  const dlg = () => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null));
  const closeDlg = async () => { for (let i = 0; i < 3 && (await dlg()); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  check((await dlg()) === 'Einsatzauftrag 26-117', 'Start: Einsatzauftrag erscheint'); await closeDlg();
  const st = () => p.evaluate(() => SEKTOR9.engine.state());
  const focus = () => p.evaluate(() => { const f = SEKTOR9.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async () => { for (let i = 0; i < 120; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(250); return f; } await p.waitForTimeout(250); } return focus(); };
  const part = async (n) => (await focus()).parts.find((x) => x.name === n);
  const tap = async (n, k = 1, dir = 0) => { for (let i = 0; i < k; i++) { const w = await part(n); await p.mouse.click(w.x, w.y + (dir > 0 ? -6 : dir < 0 ? 6 : 0)); await p.waitForTimeout(120); } };
  const aim = async (id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); await p.waitForTimeout(200); return pt; };
  const click = async (id) => { const pt = await aim(id); if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(500); return true; };
  const waitGlide = async () => { for (let i = 0; i < 100 && (await p.evaluate(() => SEKTOR9.view3d.gliding())); i++) await p.waitForTimeout(200); await p.waitForTimeout(300); };
  const echoText = () => p.evaluate(() => document.querySelector('#echoToast').textContent);
  const narr = () => p.evaluate(() => document.querySelector('#narration').textContent);
  await p.waitForTimeout(2000); check(/AKTIVE SITZUNG/.test(await echoText()), 'ECHO meldet sich: „' + (await echoText()).slice(0, 50) + '“');
  await shot(p, 'v-west');

  // Handrad
  await click('v_tuer_a'); let f = await settle();
  check(Boolean(f) && f.id === 'v_tuer_a', 'Panzertür West → Nahansicht am Handrad'); await shot(p, 'handrad');
  await tap('handrad', 3); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  check((await st()).solved.includes('handrad'), 'Handrad gedreht → Tür offen'); await closeDlg(); await p.waitForTimeout(2500);
  await click('v_tuer_a_offen'); await p.waitForTimeout(2500);
  check((await st()).hall === 'kommando' && (await st()).station === 'leitstand', 'Durch die Tür → Kommando-Halle, Leitstand'); await shot(p, 'leitstand');

  // Lagetisch, Gitter
  await click('k_lagetisch'); check((await dlg()) === 'Der Lagetisch', 'Lagetisch → Fernmeldeplan'); await closeDlg();
  await click('st_funkstation'); await p.waitForTimeout(600); check((await st()).station === 'leitstand' && /Gittertür/.test(await narr()), 'Funkstation noch gesperrt: „' + (await narr()).slice(0, 40) + '“');
  await click('k_gitter'); f = await settle(); check(Boolean(f) && f.id === 'k_gitter', 'Gittertür → Nahansicht mit Zahlenschloss'); await shot(p, 'gitter');
  await tap('rad0', 4, 1); await tap('rad1', 4, -1); await tap('rad2', 2, 1); await tap('rad3', 5, 1); console.log('  eingestellt:', (await focus()).value);
  await tap('griff'); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  check((await st()).solved.includes('galerie'), '4625 am Schloss → Gitter offen'); await closeDlg(); await p.waitForTimeout(2200);

  // Funkstation
  await click('st_funkstation'); await waitGlide();
  check((await st()).station === 'funkstation', 'Standpunkt Funkstation (Kamera gleitet hinauf)'); await shot(p, 'funkstation');
  for (const id of ['f_protokoll', 'f_funkuhr', 'f_schublade', 'f_band1']) { await click(id); console.log('  ' + id + ' →', await dlg()); await closeDlg(); }
  const inv = (await st()).inventory; check(inv.includes('notstromschluessel') && inv.includes('band1'), 'Schaltschlüssel und Band 1 eingesteckt');
  await p.click('[data-slot="band1"]'); await click('f_tonband'); check((await st()).docs.includes('band1'), 'Band 1 am Tonbandgerät → Abschrift im Archiv'); await closeDlg(); await p.waitForTimeout(1500);
  check(/BRANDT/.test(await echoText()), 'ECHO erkennt die Stimme');

  // Notstrom
  await click('st_leitstand'); await waitGlide(); check((await st()).station === 'leitstand', 'zurück zum Leitstand');
  await p.click('[data-slot="notstromschluessel"]'); await click('k_konsole'); f = await settle();
  check(Boolean(f) && f.id === 'k_konsole', 'Schlüssel am Schalter → Nahansicht'); await shot(p, 'schluessel');
  for (let i = 0; i < 3; i++) { await tap('schluessel'); await p.waitForTimeout(250); }
  for (let i = 0; i < 20 && !(await st()).flags.includes('notstrom'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('notstrom'), 'Schlüssel gedreht → Notstrom A'); await closeDlg(); await p.waitForTimeout(2500);

  // Lagezentrum
  await click('st_lagezentrum'); await waitGlide(); check((await st()).station === 'lagezentrum', 'Standpunkt Lagezentrum'); await p.waitForTimeout(1200); await shot(p, 'lagezentrum');
  await click('l_tafel'); check((await dlg()) === 'Die Lagetafel', 'Lagetafel lesen'); await closeDlg();
  await click('l_kassette'); f = await settle(); check(Boolean(f) && f.id === 'l_kassette', 'Kassette → Nahansicht am Tastenfeld');
  for (const k of '2345') await tap('taste' + k); await p.waitForTimeout(700);
  check(/Lagetafel/.test(await narr()), '2345 → Text der Engine („' + (await narr()).slice(0, 44) + '…“)');
  await p.waitForTimeout(900); for (const k of '2338') await tap('taste' + k);
  for (let i = 0; i < 20 && !(await st()).inventory.includes('karte_b'); i++) await p.waitForTimeout(250);
  check((await st()).inventory.includes('karte_b'), '2338 → Ausweiskarte Personal B'); await closeDlg(); await p.waitForTimeout(2200);

  // Karte (Übersicht), zurück, Nordtür
  await p.click('#mapBtn'); await p.waitForTimeout(300); await shot(p, 'karte');
  check(await p.evaluate(() => document.querySelectorAll('#mapOv [data-go]').length >= 3), 'Bunkerkarte zeigt erreichbare Standpunkte'); await p.click('#mapOv .ov-close'); await p.waitForTimeout(400);
  await click('st_leitstand'); await waitGlide(); await click('k_ausgang'); await p.waitForTimeout(2200);
  check((await st()).hall === 'verteiler', 'zurück in der Verteilerhalle');
  await p.click('[data-slot="karte_b"]'); await click('v_tuer_b'); await p.waitForTimeout(400);
  check((await st()).flags.includes('tuer_b'), 'Karte am Leser → Nordtür offen'); await closeDlg();
  for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show'))); i++) await p.waitForTimeout(250);
  check(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show')), 'Ende von Abschnitt 1 erscheint'); await shot(p, 'ende');
  console.log('  ECHO-Protokoll:', (await st()).echo.map((e) => e.text).join(' | '));
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbschnitt 1 in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
