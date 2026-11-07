/*
 * SEKTOR 9 – Falscher Countdown in Sektor D (T5): startet beim ersten Betreten mit 10:00, läuft mit der Spielzeit,
 * zählt Standpunktwechsel, bei null passiert nichts außer ECHOs Kommentar; lässt sich ausblenden; steht in der Auswertung.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/countdown.test.js   (SHOTS=1 → Bild in /tmp)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const save = (extra = {}) => ({ v: 1, started: true, finished: false, hall: 'verteiler', station: 'mitte', view: 2,
  flags: ['briefed', 'entered_kommando', 'entered_personal', 'entered_forschung', 'galerie', 'notstrom', 'tuer_b', 'tuer_c', 'tuer_d'],
  solved: ['handrad', 'galerie', 'notstrom', 'tuer_b', 'tuer_c', 'k1'], inventory: [], docs: ['auftrag'], newDocs: [], seen: [], hints: {},
  echo: [{ t: '01:00', text: '…' }], playMs: 5000000, sound: false, teamDocs: [], gone: { items: [] }, relay: { d: 0, a: 0 }, ...extra });
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  async function open(s) {
    const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage(); p.setDefaultTimeout(60000);
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript((s) => { if (!sessionStorage.getItem('s9')) { localStorage.setItem('sektor9_save_v1', JSON.stringify(s)); sessionStorage.setItem('s9', '1'); } }, s);
    await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(500); await p.click('#startBtn'); await p.waitForTimeout(2500); return p;
  }
  const echoes = (p) => p.evaluate(() => SEKTOR9.engine.state().echo.map((e) => e.text).join(' | '));
  const box = (p) => p.evaluate(() => { const el = document.querySelector('#fakeBox'); return el.classList.contains('show') ? el.textContent : ''; });

  const p = await open(save());
  check(!(await box(p)), 'Vor Sektor D: kein Countdown');
  await p.evaluate(() => SEKTOR9.engine.goHall('sicherheit', 'maschinen', 2)); await p.waitForTimeout(9500);
  let t = await box(p); check(/DRUCKABFALL SEKTOR D · (10:00|9:[0-5]\d)/.test(t), 'Beim Betreten: Countdown läuft („' + t.replace('ausblenden', '').trim() + '“)');
  check(/DRUCKABFALL SEKTOR D IN 10:00/.test(await echoes(p)), 'ECHO-Warnung „Druckabfall in 10:00“');
  if (process.env.SHOTS) await p.screenshot({ path: OUT + 's9c-countdown.png' });
  await p.evaluate(() => { SEKTOR9.engine.goStation('vor9'); }); await p.waitForTimeout(1500); await p.evaluate(() => { SEKTOR9.engine.goStation('maschinen'); }); await p.waitForTimeout(1500);
  check((await p.evaluate(() => SEKTOR9.engine.state().fake.moves)) === 2, 'Standpunktwechsel werden gezählt (2)');
  await p.evaluate(() => { const S = SEKTOR9.engine.state(); S.fake.end = S.playMs + 2000; }); await p.waitForTimeout(11000);
  t = await echoes(p);
  check(!(await box(p)) && /ES GAB NIE EINEN DRUCKABFALL/.test(t) && /2-MAL DEN STANDPUNKT GEWECHSELT/.test(t), 'Bei null: nichts passiert, ECHO: „Es gab nie einen Druckabfall … 2-mal … gerannt“');
  check(await p.evaluate(() => SEKTOR9.engine.state().hall === 'sicherheit' && !SEKTOR9.engine.state().finished), 'Spiel läuft normal weiter');
  // Auswertung
  await p.evaluate(() => { const S = SEKTOR9.engine.state(); ['tuer9', 'rz', 'entered_sektor9'].forEach((f) => S.flags.push(f)); SEKTOR9.engine.goHall('sektor9', 'kern', 0); }); await p.waitForTimeout(3000);
  await p.evaluate(() => SEKTOR9.engine.hotspot('n_c')); await p.waitForTimeout(500); await p.click('[data-confirm]');
  for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show'))); i++) await p.waitForTimeout(250);
  check(/Countdown Sektor D: 2-mal den Standpunkt gewechselt/.test(await p.textContent('#endOv')), 'Auswertung nennt den Countdown');
  // Ausblenden
  await p.close(); const q = await open(save());
  await q.evaluate(() => SEKTOR9.engine.goHall('sicherheit', 'maschinen', 2)); await q.waitForTimeout(2500);
  check(Boolean(await box(q)), 'Neuer Einsatz: Countdown sichtbar');
  await q.evaluate(() => document.querySelector('#fakeBox [data-nocount]').click()); await q.waitForTimeout(1500);
  check(!(await box(q)) && (await q.evaluate(() => SEKTOR9.engine.state().noCountdown)), '„ausblenden“ blendet den Countdown aus');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nCountdown in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
