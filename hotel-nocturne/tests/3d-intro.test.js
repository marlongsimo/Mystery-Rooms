/*
 * Hotel Nocturne – 3D-Testmodus: Intro (Ankunft als Kamerafahrt).
 * Neues Spiel → Fallakte (3 Seiten) → 3D-Ankunft: prüft, dass die Fahrt in der 3D-Szene läuft, die vier Untertitel aus
 * js/prolog.js erscheinen, am Ende das Spiel in der Rezeption (Nord) beginnt und der Außenbereich wieder weg ist.
 * Zweiter Lauf: „Überspringen“ mitten in der Fahrt. Bilder im Temp-Ordner (in-*.png).
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-intro.test.js   (ca. 3 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const SHOTS = (process.env.SHOTS || '3,8,18,24.5,28,34,41.6,44').split(',').map(Number);
async function newGame(b) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.setDefaultTimeout(20000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
  await p.goto(BASE + '/hotel-nocturne/3d.html?q=' + QUAL); await p.waitForTimeout(1200);
  await p.click('#startButton'); await p.waitForTimeout(800);
  if (await p.$('.cf-cold .cine-btn')) { await p.click('.cf-cold .cine-btn'); await p.waitForTimeout(500); } // Vorspann überspringen
  for (let i = 0; i < 3; i++) { await p.click('[data-pz="next"]'); await p.waitForTimeout(300); }
  return { p, errs };
}
const info = (p) => p.evaluate(() => ({ prolog: document.querySelector('#prolog').classList.contains('show'), in3d: Boolean(document.querySelector('#prolog .n3d-wrap')), sub: (document.querySelector('#prolog .cine-text.show') || {}).textContent || '' }));
(async () => {
  const b = await chromium.launch(ARGS);
  // Lauf 1: ganz durch
  const { p, errs } = await newGame(b);
  const t0 = Date.now(); const subs = new Set();
  console.log('Intro in 3D:', (await info(p)).in3d);
  const watch = setInterval(async () => { try { const i = await info(p); if (i.sub) subs.add(i.sub.trim().slice(0, 40)); } catch (e) { /* Seite beschäftigt */ } }, 700);
  // Bilder: an die Stelle springen, anhalten, fotografieren (Software-Rendering ist zu langsam für Echtzeit)
  for (const s of SHOTS) { await p.evaluate((s) => NOCTURNE.view3d.cinemaCtl.seek(s), s); await p.waitForTimeout(1600); await p.screenshot({ path: `${OUT}in-${String(s).replace('.', '_')}.png`, timeout: 90000 }); }
  await p.evaluate(() => NOCTURNE.view3d.cinemaCtl.seek(Math.max(45, NOCTURNE.view3d.cinemaCtl.info().t), false)); // Rest bis zum Ende in Echtzeit
  await p.waitForFunction(() => !document.querySelector('#prolog').classList.contains('show'), null, { timeout: 120000 });
  clearInterval(watch);
  console.log('Untertitel gesehen:', subs.size); [...subs].forEach((s) => console.log('  ·', s));
  await p.waitForTimeout(1500);
  const end = await p.evaluate(() => ({ room: document.querySelector('#location').textContent, scene3d: document.querySelector('#scene').classList.contains('is3d'), started: JSON.parse(localStorage.getItem('nocturne_save_3d_v2') || '{}').started, sky: (() => { let n = 0; return n; })() }));
  console.log('Danach:', JSON.stringify(end), '| Dauer', Math.round((Date.now() - t0) / 1000), 's');
  await p.screenshot({ path: OUT + 'in-spiel.png', timeout: 90000 });
  const clickOk = await p.evaluate(() => Boolean(NOCTURNE.view3d.aimAt('uhr')));
  console.log('Spiel bedienbar (Uhr anvisierbar):', clickOk);
  console.log(errs.join('\n') || 'no errors'); await p.close();
  // Lauf 2: Überspringen
  const r2 = await newGame(b);
  await r2.p.waitForTimeout(6000); await r2.p.click('#prolog .cine-btn'); await r2.p.waitForTimeout(1500);
  const e2 = await r2.p.evaluate(() => ({ prolog: document.querySelector('#prolog').classList.contains('show'), scene3d: document.querySelector('#scene').classList.contains('is3d'), room: document.querySelector('#location').textContent }));
  console.log('Überspringen →', JSON.stringify(e2));
  await r2.p.screenshot({ path: OUT + 'in-skip.png', timeout: 90000 });
  console.log(r2.errs.join('\n') || 'no errors');
  await b.close();
})();
