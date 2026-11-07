/*
 * SEKTOR 9 – Nebenrätsel in Sektor D und ECHOs Lenkung (allein)
 * Empfehlung der „Wartungsassistenz“ (T2) · Befehlsarchiv mit zwei Fassungen (T3, Code 2251) · Kommentare zu echten
 * Handlungen (T4) · Steckfeld: vier Kamerastecker ziehen, falscher Stecker setzt zurück → ECHO blind · Auswertung.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/nebenraetsel.test.js   (SHOTS=1 → Bilder in /tmp)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const save = { v: 1, started: true, finished: false, hall: 'sicherheit', station: 'rechenzentrum', view: 0,
  flags: ['briefed', 'entered_kommando', 'entered_personal', 'entered_forschung', 'entered_sicherheit', 'galerie', 'notstrom', 'tuer_b', 'buero', 'kaefig', 'tunnel_ab', 'tuer_c', 'beobachtung', 'schleuse', 'tuer_d', 'schaltbuch', 'rz', 'tuer9'],
  solved: ['handrad', 'galerie', 'notstrom', 'band1', 'kassette', 'tuer_b', 'buero', 'kaefig', 'spind_nowak', 'tunnel_ab', 'band2', 'tuer_c', 'beobachtung', 'schleuse', 'k1', 'rz'],
  inventory: [], docs: ['auftrag', 'funkprotokoll'], newDocs: [], seen: [], hints: {}, echo: [{ t: '02:00', text: 'IHR SEID NAH.' }], playMs: 7000000, sound: false, teamDocs: [], gone: { items: [] }, relay: { d: 0, a: 0 } };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage(); p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript((s) => { if (!sessionStorage.getItem('s9')) { localStorage.setItem('sektor9_save_v1', JSON.stringify(s)); sessionStorage.setItem('s9', '1'); } }, save);
  await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(500); await p.click('#startBtn'); await p.waitForTimeout(3000);
  const shot = (n) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9n-' + n + '.png' }) : null);
  const dlgText = () => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgBody').textContent : ''));
  const closeDlg = async () => { for (let i = 0; i < 3 && (await p.evaluate(() => document.querySelector('#dialog').open)); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const click = async (id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); if (!pt) return false; await p.waitForTimeout(300); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(700); return true; };
  const focus = () => p.evaluate(() => { const f = SEKTOR9.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async () => { for (let i = 0; i < 120; i++) { const f = await focus(); if (f && f.arrived) { await p.waitForTimeout(250); return f; } await p.waitForTimeout(250); } return focus(); };
  const echoes = () => p.evaluate(() => SEKTOR9.engine.state().echo.map((e) => e.text).join(' | '));

  // T2: Empfehlung
  await p.click('#echoBtn'); await p.waitForTimeout(400);
  check(/EMPFEHLUNG DER WARTUNGSASSISTENZ/.test(await p.textContent('#echoOv')) && /FORTSETZEN/.test(await p.textContent('.echo-rec')), 'ECHO-Terminal empfiehlt FORTSETZEN (T2)');
  await p.click('#echoOv .ov-close'); await p.waitForTimeout(400);

  // T3: Befehlsarchiv – zwei Fassungen, Code 2251
  check(await click('d_archiv'), 'Befehlsarchiv anklickbar');
  let t = await dlgText(); check(/Funkzeit 22:58/.test(t) && /FREIGABE STUFE 2/.test(t), 'Erste Fassung: ECHOs „Freigabe, Funkzeit 22:58“');
  await shot('archiv'); await closeDlg();
  await click('d_archiv'); t = await dlgText();
  check(/Eben stand hier etwas anderes/.test(t) && /ROHDATEN/.test(t) && /ABBRUCH/.test(t), 'Beim zweiten Hinsehen: andere Fassung (Abbruch, 22:51 Funkzeit)');
  await p.fill('#dlgBody .lock-input', '2258'); await p.click('[data-lock-try]'); await p.waitForTimeout(300);
  check(/Systemzeit/.test(await p.textContent('#dlgBody .lock-fb')), '2258 abgelehnt mit Hinweis auf die Systemzeit');
  await p.fill('#dlgBody .lock-input', '2251'); await p.click('[data-lock-try]'); await p.waitForTimeout(800);
  check(await p.evaluate(() => SEKTOR9.engine.isSolved('archiv') && SEKTOR9.engine.state().docs.includes('befehlsarchiv')), '2251 → gelöst, Änderungsprotokoll im Archiv');
  await closeDlg(); await p.waitForTimeout(1500);
  check(/FUNKUHR MEHR ALS MIR/.test(await echoes()), 'ECHO: „Ihr glaubt einer Funkuhr mehr als mir.“');

  // T4: kurz bleiben, dann gehen → Kommentar
  await p.evaluate(() => { SEKTOR9.engine.state().stAt = SEKTOR9.engine.state().playMs - 40000; SEKTOR9.engine.state().t4At = -1e9; });
  await p.evaluate(() => SEKTOR9.engine.goStation('vor9')); await p.waitForTimeout(3500);
  check(/DU HAST RECHENZENTRUM NACH 40 SEKUNDEN VERLASSEN/.test(await echoes()), 'T4: „Du hast Rechenzentrum nach 40 Sekunden verlassen …“');

  // Steckfeld
  await click('d_trasse'); let f = await settle(); check(Boolean(f) && f.id === 'd_trasse' && f.parts.length === 8, 'Steckfeld in der Nahansicht (8 Stecker)');
  await shot('steckfeld');
  const tap = async (n) => { const h = (await focus()).parts.find((x) => x.name === 'stecker_' + n); await p.mouse.click(h.x, h.y); await p.waitForTimeout(350); };
  await tap('cam_a'); await tap('terminal'); await p.waitForTimeout(400);
  check(/Feder/.test(await p.textContent('#narration')) && !(await p.evaluate(() => SEKTOR9.engine.isSolved('kameras'))), 'Falscher Stecker (Terminal): schnappt zurück, alles setzt zurück');
  await p.waitForTimeout(900);
  for (const n of ['cam_d', 'cam_b', 'cam_a', 'cam_c']) await tap(n);
  await p.waitForTimeout(1200);
  check(await p.evaluate(() => SEKTOR9.engine.isSolved('kameras') && SEKTOR9.engine.has('blind')), 'Vier Kamerastecker in beliebiger Reihenfolge → ECHO blind');
  await closeDlg(); await p.waitForTimeout(8500);
  t = await echoes(); check(/ICH SEHE EUCH NICHT MEHR/.test(t) && /ICH HÖRE EUCH NOCH/.test(t), 'ECHO: „Ich sehe euch nicht mehr. … Ich höre euch noch.“');
  await shot('blind');
  const n0 = await p.evaluate(() => SEKTOR9.engine.state().t4n);
  await p.evaluate(() => { const S = SEKTOR9.engine.state(); S.stAt = S.playMs - 40000; S.t4At = -1e9; SEKTOR9.engine.goStation('maschinen'); }); await p.waitForTimeout(1500);
  check((await p.evaluate(() => SEKTOR9.engine.state().t4n)) === n0, 'Blind: keine Kommentare mehr');

  // Ende C → Auswertung
  await p.evaluate(() => SEKTOR9.engine.goHall('sektor9', 'kern', 0)); await p.waitForTimeout(3500); await closeDlg();
  await click('n_c'); await p.click('[data-confirm]');
  for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show'))); i++) await p.waitForTimeout(250);
  t = await p.textContent('#endOv');
  check(/ENDE C/.test(t) && /Zögern notiert: 1-mal/.test(t) && /Beobachtung abgeschaltet um/.test(t), 'Auswertung nennt Zögern und abgeschaltete Beobachtung');
  await shot('ende');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nNebenrätsel in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
