/*
 * Hotel Nocturne – filmische Fallakte (3D-Testmodus, config.cineCasefile).
 * Vorspann (Funkprotokoll → Titel) → drei Seiten am Schreibtisch: Text vollständig und unverändert, Requisiten,
 * Stempel, Handschrift; „Zurück“ zeigt eine gesehene Seite ohne erneute Animation; Handy-Ansicht.
 * Gegenprobe: normale Version (index.html) ohne Vorspann und ohne Requisiten. Bilder im Temp-Ordner (fa-*.png).
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-fallakte.test.js   (ca. 2 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
async function open(b, page, vp) {
  const p = await b.newPage({ viewport: vp }); p.setDefaultTimeout(20000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await p.goto(BASE + '/hotel-nocturne/' + page + '?q=low'); await p.waitForTimeout(1200);
  await p.click('#startButton'); return { p, errs };
}
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch(ARGS); let ok = true; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const { p, errs } = await open(b, '3d.html', { width: 1280, height: 800 });
  await p.waitForTimeout(3500); await p.screenshot({ path: OUT + 'fa-funk.png' });
  check(await p.$('.prolog.cf-cold') !== null, 'Vorspann läuft');
  const lines = await p.$$eval('.cf-radio-line', (x) => x.length); check(lines >= 1, `Funkspruch tippt (${lines} Zeilen nach 3,5 s)`);
  await p.waitForSelector('.cf-titled', { timeout: 30000 }); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'fa-titel.png' });
  check(true, 'Titel erscheint');
  await p.waitForSelector('.prolog.cinefile', { timeout: 15000 });
  const src = await p.evaluate(() => NOCTURNE.prolog.casefile.map((c) => ({ title: c.title, html: c.html.replaceAll('{name}', document.querySelector('#introName').textContent) })));
  const waits = [5000, 7000, 10000];
  for (let i = 0; i < 3; i++) {
    await p.waitForTimeout(waits[i]); await p.screenshot({ path: OUT + `fa-seite${i + 1}.png` });
    const got = await p.evaluate(() => ({ title: document.querySelector('.pz-file h2').textContent, body: document.querySelector('.pz-body').innerHTML, props: document.querySelectorAll('.cf-props > *').length }));
    check(got.title === src[i].title, `Seite ${i + 1}: Überschrift vollständig („${got.title}“)`);
    check(plain(got.body) === plain(src[i].html), `Seite ${i + 1}: Text unverändert`);
    check(got.props > 0, `Seite ${i + 1}: Requisiten (${got.props})`);
    if (i === 1) check(await p.$eval('.cf-stamp', (e) => +getComputedStyle(e).opacity > 0.5), 'Stempel „Fahndung ohne Ergebnis“ sichtbar');
    if (i === 2) check(await p.$$eval('.pz-card .handwriting', (x) => x.every((e) => { const m = getComputedStyle(e).clipPath.match(/inset\(0px ([\d.e+-]+)/); return !m || parseFloat(m[1]) < 0.5; })), 'Handschrift und Unterschrift ausgeschrieben');
    if (i < 2) { await p.click('[data-pz="next"]'); }
  }
  await p.click('[data-pz="back"]'); await p.waitForTimeout(400);
  check(await p.$('.prolog.cinefile.seen') !== null && (await p.$eval('.pz-file h2', (e) => e.textContent)) === src[1].title, 'Zurück: Seite sofort vollständig');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false; await p.close();
  // Handy
  const m = await open(b, '3d.html', { width: 390, height: 844 });
  await m.p.click('.cf-cold .cine-btn'); await m.p.waitForTimeout(6000); await m.p.screenshot({ path: OUT + 'fa-handy.png' });
  check(await m.p.evaluate(() => document.querySelector('.pz-file').getBoundingClientRect().width > 300), 'Handy: Text in voller Breite');
  await m.p.close();
  // Gegenprobe normale Version
  const n = await open(b, 'index.html', { width: 1280, height: 800 }); await n.p.waitForTimeout(800);
  check(await n.p.$('.cf-cold') === null && await n.p.$('.prolog.casefile') !== null && await n.p.$('.cf-desk') === null, 'Normale Version: Fallakte wie bisher (kein Vorspann, keine Requisiten)');
  await n.p.close(); await b.close();
  console.log(ok ? '\nFilmische Fallakte in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
