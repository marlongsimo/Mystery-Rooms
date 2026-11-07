/*
 * SEKTOR 9 – Abschnitte 4–5 (Sicherheits-Halle, Sektor 9) mit einem Spielstand nach Abschnitt 3 bis zum Ende B durchspielen, in 3D und direkt am Objekt.
 * Südtür → Schaltbuch, Band 5 → Glastür 2312 (falsch) / 2305 → Rechenzentrum: Prozessliste, Band 6 → Schaltpult (falsch, dann
 * KERN 2–KERN 1–NETZ D) → über die Karte in den Leitstand, SPEISUNG umlegen (Relais) → Bänder 5 und 6 → Sektor 9: Ostrowski, SENDEN → Ende B.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/abschnitt4.test.js   (SHOTS=1 für Bildschirmfotos)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const shot = (p, name) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9d-' + name + '.png', timeout: 90000 }) : Promise.resolve());
const SAVE = { v: 1, started: true, finished: false, hall: 'verteiler', station: 'mitte', view: 2,
  flags: ['briefed', 'entered_kommando', 'entered_personal', 'entered_forschung', 'taken_notstromschluessel', 'taken_band1', 'galerie', 'notstrom', 'tuer_b', 'taken_band2', 'buero', 'taken_band3', 'taken_archivschluessel', 'kaefig', 'taken_ausweis_ostrowski', 'tunnel_ab', 'tuer_c', 'beobachtung', 'taken_band4', 'schleuse', 'tuer_d'],
  solved: ['handrad', 'galerie', 'notstrom', 'band1', 'kassette', 'tuer_b', 'buero', 'kaefig', 'spind_nowak', 'tunnel_ab', 'band2', 'band3', 'tuer_c', 'beobachtung', 'band4', 'schleuse', 'k1'], inventory: ['notstromschluessel', 'ausweis_ostrowski', 'vierkant'],
  docs: ['auftrag', 'funkprotokoll', 'befehlsbuch', 'dienstplan', 'band3', 'versuchsplan', 'laeufe'], newDocs: [], seen: [], hints: { k1: 2 }, echo: [{ t: '01:40', text: 'SEKTOR D ENTRIEGELT. DAS WAR NICHT ICH.' }], playMs: 6000000, sound: false, teamDocs: [], gone: { items: ['band1', 'band2', 'band3', 'band4'] } };
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

  const mapGo = async (hs) => { await p.click('#mapBtn'); await p.waitForTimeout(300); await p.click(`#mapOv [data-go="${hs}"]`); await p.waitForTimeout(2500); };
  await click('v_tuer_d_offen'); await p.waitForTimeout(2500);
  check((await st()).hall === 'sicherheit' && (await st()).station === 'maschinen', 'Südtür → Sicherheits-Halle, Maschinenhalle'); await shot(p, 'maschinen');
  await p.waitForTimeout(1500); check(/GEWARTET/.test(await echoText()), 'ECHO: „' + (await echoText()).slice(0, 60) + '“');
  await click('d_pult'); check(/Nowak etwas aufgeschrieben/.test(await p.evaluate(() => document.querySelector('#dlgBody').textContent)), 'Schaltpult ohne Schaltbuch: noch gesperrt'); await closeDlg();
  await read('d_schaltbuch'); check((await st()).flags.includes('schaltbuch'), 'Nowaks Schaltbuch gelesen');
  await read('d_werkzeug'); await read('d_generator'); await read('d_trenner'); check((await st()).inventory.includes('band5'), 'Band 5 aus der Werkzeugkiste');
  // Glastür Rechenzentrum
  await click('d_rz_tuer'); let f = await settle(); check(Boolean(f) && f.id === 'd_rz_tuer', 'Glastür → Nahansicht am Tastenfeld');
  for (const k of '2312') await tap('taste' + k); await p.waitForTimeout(700);
  check(/Systemzeit/.test(await narr()), '2312 → „' + (await narr()).slice(0, 50) + '…“');
  await p.waitForTimeout(1000); for (const k of '2305') await tap('taste' + k);
  for (let i = 0; i < 20 && !(await st()).flags.includes('rz'); i++) await p.waitForTimeout(250);
  check((await st()).flags.includes('rz') && (await st()).flags.includes('tuer9'), '2305 → Rechenzentrum offen, Panzertür 9 öffnet sich'); await closeDlg(); await p.waitForTimeout(2500);
  await click('st_rechenzentrum'); await waitGlide(); check((await st()).station === 'rechenzentrum', 'Standpunkt Rechenzentrum'); await shot(p, 'rechenzentrum');
  await read('d_prozesse'); check((await st()).flags.includes('assist_entlarvt'), 'Prozessliste: die Wartungsassistenz ist ECHO');
  await read('d_quellband'); await read('d_konsole'); await read('d_sender'); check((await st()).inventory.includes('band6'), 'Band 6 (Quellmaterial) eingesteckt');
  // Nowaks Schaltung: erst falsch, dann richtig
  await click('st_maschinen'); await waitGlide();
  await click('d_pult'); f = await settle(); check(Boolean(f) && f.id === 'd_pult', 'Schaltpult → Nahansicht mit drei Hebeln'); await shot(p, 'pult');
  for (const k of ['netz', 'kern1', 'kern2']) { await tap('hebel_' + k); await p.waitForTimeout(250); } await p.waitForTimeout(600);
  check(/Schaltbuch/.test(await narr()) && !(await st()).relay.d, 'Falsche Reihenfolge → „' + (await narr()).slice(0, 40) + '…“');
  await p.waitForTimeout(1200); for (const k of ['kern2', 'kern1', 'netz']) { await tap('hebel_' + k); await p.waitForTimeout(250); }
  for (let i = 0; i < 20 && !(await st()).relay.d; i++) await p.waitForTimeout(250);
  check((await st()).relay.d > 0, 'KERN 2 – KERN 1 – NETZ D → Zeitrelais läuft');
  check(await p.evaluate(() => document.querySelector('#relayBox').classList.contains('show')), 'Anzeige: „' + (await p.textContent('#relayBox')) + '“');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
  await mapGo('kommando|leitstand'); check((await st()).hall === 'kommando', 'über die Karte in den Leitstand');
  await click('k_speisung'); await p.waitForTimeout(900);
  for (let i = 0; i < 20 && !(await st()).solved.includes('k3'); i++) await p.waitForTimeout(250);
  check((await st()).solved.includes('k3'), 'SPEISUNG RECHENKERN umgelegt (innerhalb von 90 s) → Nowaks Schaltung scharf'); await closeDlg(); await p.waitForTimeout(1500);
  // Bänder 5 und 6
  await mapGo('kommando|funkstation');
  await p.click('[data-slot="band5"]'); await click('f_tonband'); check((await st()).docs.includes('band5'), 'Band 5 → Nowak: „Ich hab AUSSEN-3 gezogen“'); await closeDlg(); await p.waitForTimeout(1200);
  await p.click('[data-slot="band6"]'); await click('f_tonband'); check((await st()).docs.includes('band6'), 'Band 6 → der Satz aus dem Funksignal, 1987 zu Nowak gesagt'); await closeDlg(); await p.waitForTimeout(1200);
  // Sektor 9
  await mapGo('sicherheit|vor9'); check((await st()).station === 'vor9', 'vor Sektor 9'); await shot(p, 'vor9');
  await click('d_tuer9_offen'); await p.waitForTimeout(3000);
  check((await st()).hall === 'sektor9', 'durch Panzertür 9 → Rechenkern'); await shot(p, 'kern');
  await p.waitForTimeout(1500); check(/SEKTOR 9/.test(await echoText()), 'ECHO: „WILLKOMMEN IN SEKTOR 9.“');
  await read('n_diktat'); check((await st()).docs.includes('ostrowski'), 'Ostrowskis letzte Aufzeichnung');
  await read('n_kern');
  await click('n_b'); check((await dlg()) === 'SENDEN' && Boolean(await p.$('[data-confirm]')), 'SENDEN → Bestätigung'); await shot(p, 'entscheidung');
  await p.click('[data-confirm]');
  for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show'))); i++) await p.waitForTimeout(250);
  const endText = await p.textContent('#endOv');
  check(/ENDE B/.test(endText) && /AUSWERTUNG/.test(endText) && /Jeder davon kam von mir/.test(endText), 'Ende B mit ECHOs Auswertung („Jeder davon kam von mir“)'); await shot(p, 'ende');
  check((await st()).finished === true, 'Spiel als beendet gespeichert');
  console.log('  Archiv:', (await st()).docs.length, 'Dokumente · ECHO:', (await st()).echo.map((e) => e.text).slice(1).join(' | '));
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbschnitte 4–5 in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
