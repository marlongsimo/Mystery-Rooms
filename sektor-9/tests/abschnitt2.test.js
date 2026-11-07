/*
 * SEKTOR 9 – Abschnitt 2 (Personal-Halle) mit einem Spielstand nach Abschnitt 1 durchspielen, in 3D und direkt am Objekt.
 * Brandts Spind (Band 2) → Dienstplan → Bürotür 1800 (falsch) / 1730 → Büro: Brief, Band 3, Archivschlüssel → Käfig (Schlüssel drehen)
 * → Akten, Räumungsliste, Ostrowskis Ausweis → Nowaks Spind 0311 → Vierkant an der Wartungsklappe → Wartungsgang ins Lagezentrum
 * → Bänder 2 und 3 in der Funkstation → Osttür mit Ostrowskis Ausweis → Ende von Abschnitt 2.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/abschnitt2.test.js   (SHOTS=1 für Bildschirmfotos)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const shot = (p, name) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9b-' + name + '.png', timeout: 90000 }) : Promise.resolve());
const SAVE = { v: 1, started: true, finished: false, hall: 'verteiler', station: 'mitte', view: 0,
  flags: ['briefed', 'entered_kommando', 'taken_notstromschluessel', 'taken_band1', 'galerie', 'notstrom', 'tuer_b'],
  solved: ['handrad', 'galerie', 'notstrom', 'band1', 'kassette', 'tuer_b'], inventory: ['notstromschluessel'],
  docs: ['auftrag', 'fernmeldeplan', 'funkprotokoll', 'band1', 'lagetafel', 'nowak1', 'befehlsbuch'], newDocs: [], seen: [], hints: {}, echo: [{ t: '00:30', text: 'VERSUCHSGRUPPE 09 · PHASE 1 ABGESCHLOSSEN.' }], playMs: 1800000, sound: false };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.setDefaultTimeout(60000);
  const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript((s) => { if (!sessionStorage.getItem('s9')) { localStorage.setItem('sektor9_save_v1', JSON.stringify(s)); sessionStorage.setItem('s9', '1'); } }, SAVE);
  await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(500);
  await p.click('#startBtn'); await p.waitForTimeout(2500);
  const dlg = () => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null));
  const closeDlg = async () => { for (let i = 0; i < 3 && (await dlg()); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const st = () => p.evaluate(() => SEKTOR9.engine.state());
  const focus = () => p.evaluate(() => { const f = SEKTOR9.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async () => { for (let i = 0; i < 120; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(250); return f; } await p.waitForTimeout(250); } return focus(); };
  const part = async (n) => (await focus()).parts.find((x) => x.name === n);
  const tap = async (n, k = 1, dir = 0) => { for (let i = 0; i < k; i++) { const w = await part(n); await p.mouse.click(w.x, w.y + (dir > 0 ? -6 : dir < 0 ? 6 : 0)); await p.waitForTimeout(120); } };
  const click = async (id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); if (!pt) return false; await p.waitForTimeout(200); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(500); return true; };
  const waitGlide = async () => { for (let i = 0; i < 100 && (await p.evaluate(() => SEKTOR9.view3d.gliding())); i++) await p.waitForTimeout(200); await p.waitForTimeout(300); };
  const echoText = () => p.evaluate(() => document.querySelector('#echoToast').textContent);
  const narr = () => p.evaluate(() => document.querySelector('#narration').textContent);
  const read = async (id, want) => { await click(id); const t = await dlg(); check(want ? t === want : Boolean(t), `${id} → „${t}“`); await closeDlg(); };
  await closeDlg();

  await click('v_tuer_b_offen'); await p.waitForTimeout(2500);
  check((await st()).hall === 'personal' && (await st()).station === 'unterkuenfte', 'Nordtür → Personal-Halle, Unterkünfte'); await shot(p, 'unterkuenfte');
  await p.waitForTimeout(1500); check(/PROFIL/.test(await echoText()), 'ECHO: „' + (await echoText()).slice(0, 60) + '“');
  await read('b_spind_brandt', 'Spind 2 · BRANDT, I.'); check((await st()).inventory.includes('band2') && (await st()).docs.includes('tagebuch_brandt'), 'Band 2 und Tagebuchseite');
  await read('b_dienstplan', 'Der Dienstplan'); await read('b_spinde'); await read('b_betten');
  // Bürotür
  await click('b_buerotuer'); let f = await settle(); check(Boolean(f) && f.id === 'b_buerotuer', 'Bürotür → Nahansicht am Tastenfeld'); await shot(p, 'buerotuer');
  for (const k of '1800') await tap('taste' + k); await p.waitForTimeout(700);
  check(/Nachtdienstes/.test(await narr()), '1800 → „' + (await narr()).slice(0, 50) + '…“');
  await p.waitForTimeout(900); for (const k of '1730') await tap('taste' + k);
  for (let i = 0; i < 20 && !(await st()).flags.includes('buero'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('buero'), '1730 → Büro offen'); await closeDlg(); await p.waitForTimeout(2200);
  // Büro
  await click('st_buero'); await waitGlide(); check((await st()).station === 'buero', 'Standpunkt Offiziersbüro'); await shot(p, 'buero');
  await read('o_brief'); await read('o_schublade'); await read('o_schluessel'); await read('o_foto'); await read('o_tasse');
  const inv = (await st()).inventory; check(inv.includes('band3') && inv.includes('archivschluessel'), 'Band 3 und Archivschlüssel eingesteckt');
  // Käfig
  await click('st_unterkuenfte'); await waitGlide();
  await p.click('[data-slot="archivschluessel"]'); await click('b_kaefigtuer'); f = await settle();
  check(Boolean(f) && f.id === 'b_kaefigtuer', 'Archivschlüssel am Käfig → Nahansicht, Schlüssel steckt'); await shot(p, 'kaefig');
  for (let i = 0; i < 3; i++) { await tap('schluessel'); await p.waitForTimeout(250); }
  for (let i = 0; i < 20 && !(await st()).flags.includes('kaefig'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('kaefig'), 'Schlüssel gedreht → Käfig offen'); await closeDlg(); await p.waitForTimeout(2500);
  await click('st_archiv'); await waitGlide(); check((await st()).station === 'archiv', 'Standpunkt Personalarchiv'); await shot(p, 'archiv');
  await read('a_kartei', 'Die Personalakten'); await read('a_raeumung', 'Die Räumungsliste'); await read('a_regal'); await read('b_ausweis');
  check((await st()).inventory.includes('ausweis_ostrowski'), 'Ostrowskis Dienstausweis eingesteckt');
  // Nowaks Spind
  await click('st_unterkuenfte'); await waitGlide();
  await click('b_spind_nowak'); f = await settle(); check(Boolean(f) && f.id === 'b_spind_nowak', 'Spind 7 → Nahansicht mit Zahlenschloss'); await shot(p, 'spind7');
  await tap('rad1', 3, 1); await tap('rad2', 1, 1); await tap('rad3', 1, 1); console.log('  eingestellt:', (await focus()).value);
  await tap('griff'); for (let i = 0; i < 20 && !(await dlg()); i++) await p.waitForTimeout(250);
  check((await st()).inventory.includes('vierkant') && (await st()).docs.includes('skizze_nowak'), '0311 → Vierkant, Wartungsplan, Skizze'); await closeDlg(); await p.waitForTimeout(2200);
  // Wartungsklappe
  await p.click('[data-slot="vierkant"]'); await click('b_klappe'); f = await settle();
  check(Boolean(f) && f.id === 'b_klappe', 'Vierkant an der Klappe → Nahansicht'); await shot(p, 'klappe');
  for (let i = 0; i < 3; i++) { await tap('schluessel'); await p.waitForTimeout(250); }
  for (let i = 0; i < 20 && !(await st()).flags.includes('tunnel_ab'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('tunnel_ab'), 'Klappe offen → Wartungsgang A–B'); await closeDlg(); await p.waitForTimeout(2500);
  await click('b_tunnel'); await p.waitForTimeout(2500);
  check((await st()).hall === 'kommando' && (await st()).station === 'lagezentrum', 'Durch den Wartungsgang → Lagezentrum'); await shot(p, 'tunnel-lagezentrum');
  // Bänder abspielen
  await click('st_funkstation'); await waitGlide(); check((await st()).station === 'funkstation', 'vom Lagezentrum direkt zur Funkstation');
  await p.click('[data-slot="band2"]'); await click('f_tonband'); check((await st()).docs.includes('band2'), 'Band 2 → Abschrift (die sieben Minuten)'); await closeDlg(); await p.waitForTimeout(1500);
  await p.click('[data-slot="band3"]'); await click('f_tonband'); check((await st()).docs.includes('band3'), 'Band 3 → Albers befiehlt den Abbruch'); await closeDlg(); await p.waitForTimeout(1800);
  check(/PROTOKOLL GILT/.test(await echoText()), 'ECHO: „' + (await echoText()).slice(0, 60) + '“');
  // Osttür
  await click('st_leitstand'); await waitGlide(); await click('k_ausgang'); await p.waitForTimeout(2200);
  check((await st()).hall === 'verteiler', 'zurück in der Verteilerhalle');
  await p.click('[data-slot="ausweis_ostrowski"]'); await click('v_tuer_c'); await p.waitForTimeout(400);
  check((await st()).flags.includes('tuer_c'), 'Ostrowskis Ausweis → Osttür offen'); await closeDlg();
  await p.waitForTimeout(2500); check(/OSTROWSKI/.test(await echoText()), 'ECHO: „WILLKOMMEN ZURÜCK, DR. OSTROWSKI.“');
  await click('v_tuer_c_offen'); await p.waitForTimeout(2500); check((await st()).hall === 'forschung', 'Durch die Osttür → Forschungs-Halle (Abschnitt 3)'); await shot(p, 'ende');
  console.log('  Archiv:', (await st()).docs.length, 'Dokumente · ECHO:', (await st()).echo.map((e) => e.text).slice(1).join(' | '));
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbschnitt 2 in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
