/*
 * SEKTOR 9 – Abschnitt 3 (Forschungs-Halle) mit einem Spielstand nach Abschnitt 2 durchspielen, in 3D und direkt am Objekt.
 * ECHO-Uhr, Versuchsplan → Beobachtungstür mit Ostrowskis Ausweis → Spiegelglas, Monitor, Protokoll, Band 4, Schleusenkarte
 * → Druckschleuse (erst falsche, dann richtige Reihenfolge) → Datenarchiv: Verzeichnis, Terminal (3 2258 falsch / 3 2251) → Ende von Abschnitt 3.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/abschnitt3.test.js   (SHOTS=1 für Bildschirmfotos)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const shot = (p, name) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9c-' + name + '.png', timeout: 90000 }) : Promise.resolve());
const SAVE = { v: 1, started: true, finished: false, hall: 'verteiler', station: 'mitte', view: 1,
  flags: ['briefed', 'entered_kommando', 'entered_personal', 'taken_notstromschluessel', 'taken_band1', 'galerie', 'notstrom', 'tuer_b', 'taken_band2', 'buero', 'taken_band3', 'taken_archivschluessel', 'kaefig', 'taken_ausweis_ostrowski', 'tunnel_ab', 'tuer_c'],
  solved: ['handrad', 'galerie', 'notstrom', 'band1', 'kassette', 'tuer_b', 'buero', 'kaefig', 'spind_nowak', 'tunnel_ab', 'band2', 'band3', 'tuer_c'], inventory: ['notstromschluessel', 'ausweis_ostrowski', 'vierkant'],
  docs: ['auftrag', 'fernmeldeplan', 'funkprotokoll', 'band1', 'lagetafel', 'nowak1', 'befehlsbuch', 'dienstplan', 'band3'], newDocs: [], seen: [], hints: {}, echo: [{ t: '01:10', text: 'WILLKOMMEN ZURÜCK, DR. OSTROWSKI.' }], playMs: 4200000, sound: false, teamDocs: [], gone: { items: ['band1', 'band2', 'band3'] } };
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

  await click('v_tuer_c_offen'); await p.waitForTimeout(2500);
  check((await st()).hall === 'forschung' && (await st()).station === 'labor', 'Osttür → Forschungs-Halle, Labor'); await shot(p, 'labor');
  await p.waitForTimeout(1500); check(/FORSCHUNG C/.test(await echoText()), 'ECHO: „' + (await echoText()).slice(0, 60) + '“');
  await read('c_uhr', 'Die ECHO-Uhr'); await read('c_plan'); check((await st()).docs.includes('versuchsplan'), 'Versuchsplan Lauf 08 im Archiv'); await read('c_tische');
  // Beobachtungsraum
  await click('st_beobachtung'); await p.waitForTimeout(600); check((await st()).station === 'labor' && /verschlossen/.test(await narr()), 'Beobachtungsraum noch zu: „' + (await narr()).slice(0, 40) + '“');
  await p.click('[data-slot="ausweis_ostrowski"]'); await click('c_beob_tuer'); check((await st()).flags.includes('beobachtung'), 'Ostrowskis Ausweis am Leser → Beobachtungsraum offen'); await closeDlg(); await p.waitForTimeout(2200);
  await click('st_beobachtung'); await waitGlide(); check((await st()).station === 'beobachtung', 'Standpunkt Beobachtungsraum'); await shot(p, 'beobachtung');
  await read('c_spiegel', 'Der Versuchsraum'); await read('c_monitor', 'Die Monitore'); await read('c_protokoll'); await read('c_asservat'); await read('c_schleusenkarte');
  check((await st()).inventory.includes('band4') && (await st()).docs.includes('schleusenkarte') && (await st()).docs.includes('beobachtung'), 'Band 4, Schleusenkarte, Beobachtungsprotokoll');
  // Druckschleuse
  await click('st_labor'); await waitGlide();
  await click('c_schleuse'); let f = await settle(); check(Boolean(f) && f.id === 'c_schleuse', 'Druckschleuse → Nahansicht mit vier Tasten'); await shot(p, 'schleuse');
  for (const k of ['druck', 'siegel', 'spuelen', 'oeffnen']) { await tap('taste_' + k); await p.waitForTimeout(250); } await p.waitForTimeout(600);
  check(/Zischen/.test(await narr()) && !(await st()).flags.includes('schleuse'), 'Falsche Reihenfolge → „' + (await narr()).slice(0, 40) + '…“, alles zurück');
  await p.waitForTimeout(1200); for (const k of ['siegel', 'druck', 'spuelen', 'oeffnen']) { await tap('taste_' + k); await p.waitForTimeout(250); }
  for (let i = 0; i < 20 && !(await st()).flags.includes('schleuse'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('schleuse'), 'Siegel–Druck–Spülen–Öffnen → Schleuse offen'); await closeDlg(); await p.waitForTimeout(2600);
  // Datenarchiv
  await click('st_datenarchiv'); await waitGlide(); check((await st()).station === 'datenarchiv', 'Standpunkt Datenarchiv'); await shot(p, 'datenarchiv');
  await read('c_baender'); await read('c_verzeichnis'); check((await st()).docs.includes('laeufe'), 'Verzeichnis der Läufe (Lauf 09: Anwerbung per Funksignal)');
  await click('c_terminal'); f = await settle(); check(Boolean(f) && f.id === 'c_terminal', 'Terminal → Nahansicht: Einträge und Tastenfeld');
  await tap('zeile3'); for (const k of '2258') await tap('taste' + k); await p.waitForTimeout(800);
  check(/Systemzeit/.test(await narr()), 'Eintrag 3 + 2258 → „' + (await narr()).slice(0, 50) + '…“');
  await p.waitForTimeout(1000); for (const k of '225') await tap('taste' + k);
  await shot(p, 'terminal'); await tap('taste1');
  for (let i = 0; i < 20 && !(await st()).flags.includes('tuer_d'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('tuer_d'), 'Eintrag 3 + 2251 → Protokoll korrigiert, Sektor D entriegelt'); await closeDlg();
  await p.waitForTimeout(5000); check(/DAS WAR NICHT ICH/.test(await echoText()), 'ECHO: „SEKTOR D ENTRIEGELT. DAS WAR NICHT ICH.“'); await shot(p, 'ende');
  console.log('  Archiv:', (await st()).docs.length, 'Dokumente · ECHO:', (await st()).echo.map((e) => e.text).slice(1).join(' | '));
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbschnitt 3 in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
