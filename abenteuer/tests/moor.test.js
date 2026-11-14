/*
 * Abenteuer „Das Moor der stummen Lichter“ – ein Gerät, nur zwei Helden, im Browser bis zum Ende.
 * Spielerseite: Abenteuerwahl zeigt das Moor → Kodex mit den Lichtern → Heldenwahl ab 2 → Einleitung des Moors →
 * Szenen (Gespräch, Proben, geheime Entscheidungen, Abstimmung, Lichter-Rätsel, Kämpfe auf Moorkarten) → Ende.
 * Dazu die Engine ohne Browser: 200 Durchläufe mit 2–6 Helden (tools/kampagne.js durchlauf rabenmoor).
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/moor.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const D = require('../daten/rabenmoor.js');
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const until = async (p, fn, arg, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(250); } return false; };
  // 1. Engine
  try { const out = execFileSync('node', [__dirname + '/../tools/kampagne.js', 'durchlauf', 'rabenmoor', '200'], { encoding: 'utf8' }); check(/alle Szenen erreicht/.test(out) && /alle regulären Enden erreicht/.test(out), 'Engine: 200 Durchläufe mit 3–6 Helden ohne Fehler, Szenen erreichbar · ' + out.split('\n').filter((z) => /Enden:/.test(z)).join('').trim()); }
  catch (e) { check(false, 'Engine-Durchlauf: ' + (e.stdout || e.message).slice(0, 400)); }

  try { const out = execFileSync('node', [__dirname + '/../tools/karten-pruefen.js', 'rabenmoor'], { encoding: 'utf8' }); check(true, 'Karten: alle Startplätze erreichbar · ' + out.trim().split('\n').map((z) => z.split(':')[0]).join(', ')); }
  catch (e) { check(false, 'Karten: ' + (e.stdout || e.message).slice(0, 400)); }
  // 2. Browser
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch()), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.setDefaultTimeout(20000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.click('#my-gast-start'); await p.click('.hub-nav-punkt[data-hub="welt"]');
  check(await until(p, () => Boolean(document.querySelector('[data-welt="rabenmoor"]'))), 'Kampagnenwelt listet das Moor');
  await p.click('[data-welt="rabenmoor"]');
  check(await until(p, () => /Drei Nächte, drei Kinder/.test(document.body.textContent) && /3–6/.test(document.body.textContent)), 'Moor-Seite: Einleitung und 3–6 Helden');
  await p.click('[data-neu-start="rabenmoor"]');
  await p.waitForSelector('#kodex:not([hidden])');
  check(await p.evaluate(() => /Die Lichter/.test(document.querySelector('#kodex .seite[data-seite="3"]').textContent)), 'Kodex erklärt die Lichter statt der Glocke');
  for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
  await p.click('#start');
  check(await p.evaluate(() => /Retter von Rabenmoor/.test(document.querySelector('#lobby').textContent)), 'Heldenwahl fürs Moor');
  const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  for (const f of ['schildwaechter', 'lichtbringer', 'wildnislaeufer']) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
  check(await p.evaluate(() => !document.querySelector('#abenteuer-los').disabled && /Ins Schwarzmoor/.test(document.querySelector('#abenteuer-los').textContent)), 'Mit drei Helden ist „Ins Schwarzmoor“ frei');
  await p.click('#abenteuer-los');
  check(await until(p, () => !document.querySelector('#einleitung').hidden && /Drei Nächte, drei Kinder/.test(document.querySelector('#einleitung').textContent) && !/Grauwacht/.test(document.querySelector('#einleitung').textContent)), 'Einleitung des Moors (nicht Grauwacht)');
  await p.click('#einl-skip');
  check(await until(p, () => window.ABT.A() && window.ABT.A().abenteuer === 'rabenmoor' && /Lichter 0\/7/.test(document.querySelector('#szene').textContent)), 'Erste Szene: Rabenmoor, Lichter statt Glocke');
  const gesehen = new Set(); let kaempfe = 0, i = 0, karteGezeichnet = false, raetsel = false;
  const klick = async (sel) => { const e = await p.$(sel); if (e && await e.isEnabled()) { await e.click(); return true; } return false; };
  for (; i < 4000; i++) {
    if (await p.isVisible('#szene')) {
      gesehen.add((await p.textContent('#szene h1')).trim());
      if (await p.$('#sz-schluss')) break;
      if (await p.$('[data-beute-ding]')) { if (!(await p.$('[data-beute]'))) await p.click('[data-beute-ding]'); if (!(await klick('[data-beute]:not([disabled])'))) await klick('#beute-lassen'); continue; }
      if (await klick('[data-wurf]')) continue;
      if (await klick('[data-wer]')) continue;
      if (await p.$('[data-geheim]')) { for (const v of await p.$$eval('[data-geheim]', (xs) => { const erst = {}; for (const x of xs) { const f = x.dataset.geheim.split(':')[0]; if (!erst[f]) erst[f] = x.dataset.geheim; } return Object.values(erst); })) await p.click(`[data-geheim="${v}"]`); await klick('#sz-weiter'); continue; }
      if (await klick('#sz-kampf')) { kaempfe++; continue; }
      if (await p.$('[data-glocke]')) { raetsel = true; for (const g of D.SZENEN.lichterweg.loesung) await p.click(`[data-glocke="${g}"]`); continue; }
      if (await klick('[data-ersatz]')) continue;
      if (await klick('#sz-weiter')) continue;
      const opts = await p.$$eval('[data-opt]', (xs) => xs.map((x) => x.dataset.opt));
      // Fragen, die zur Erlösung führen, dann weiter
      const wahl = ['ilse', 'bertold', 'grete', 'spuren', 'beruhigen', 'alwine', 'schuetzen', 'tee', 'name', 'pfeife', 'erloesen', 'aufbrechen', 'weiter', 'bohlen', 'stellen', 'kampf', 'hedda', 'verstecken'].find((o) => opts.includes(o)) || opts[0];
      if (wahl) { await p.click(`[data-opt="${wahl}"]`); continue; }
      await p.waitForTimeout(50);
    } else if (await p.isVisible('#spiel')) {
      if (!karteGezeichnet) karteGezeichnet = await p.evaluate(() => document.querySelectorAll('#karte .gegner, #karte g').length > 0 && /Bohlenweg|Ried|Totenpfad|Schrein/.test(window.AB.st.karte.name));
      if (await p.isVisible('#ende') && await p.$('#weiter-abenteuer')) { await p.click('#weiter-abenteuer'); continue; }
      const s = await p.evaluate(() => window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x');
      if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(30);
    } else await p.waitForTimeout(50);
  }
  const endeArt = await p.evaluate(() => { const A = window.ABT.A(); return A && window.ABS.szene(A).art === 'ende' ? A.szene : null; });
  check(/^ende_|moor_behaelt/.test(endeArt || ''), `Moor mit zwei Helden bis zum Ende „${endeArt}“ (${gesehen.size} Szenen, ${kaempfe} Kämpfe)`);
  check(karteGezeichnet, 'Kämpfe auf den gezeichneten Moorkarten');
  check(raetsel || !gesehen.has('Die vier Lichter'), 'Lichter-Rätsel über die Laternen gelöst');
  check(['Der Dorfplatz', 'Mutter Hedda', 'Der versunkene Schrein'].every((t) => gesehen.has(t)), 'Dorfplatz, Hedda und Schrein gesehen');
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); console.log(ok ? '\nMOOR IN ORDNUNG' : '\nMOOR FEHLER'); process.exit(ok ? 0 : 1);
})();
