/*
 * Die Krone unter dem Eis (Entwurf, Akt I): Karten mit Ziel-Objekten, alle Szenen im Durchlauf, im Browser bis in den Pfadkampf.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/krone.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
const R = require('../js/regeln.js'), S = require('../js/szenen.js'), D = require('../daten/krone.js'), F = R.FD;
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  // 1. Jede Kampfszene: Karte zusammenhängend (mit Objekten), Startplätze frei, jedes Ziel erreichbar
  for (const [id, s] of Object.entries(D.SZENEN)) {
    if (s.art !== 'kampf') continue;
    const A = S.neu(1, { gruppe: F.REIHE.slice(0, 6), abenteuer: 'krone' }); A.szene = id;
    const st = R.neuesSpiel(5, S.kampfOptionen(A)), k = st.karte, frei = (x, y) => x >= 0 && y >= 0 && x < k.b && y < k.h && !k.block.has(x + ',' + y);
    const s0 = st.figuren[0], weg = new Set([s0.x + ',' + s0.y]), q = [[s0.x, s0.y]];
    while (q.length) { const [x, y] = q.shift(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const nx = x + dx, ny = y + dy; if ((!dx && !dy) || !frei(nx, ny) || weg.has(nx + ',' + ny) || (dx && dy && (!frei(x + dx, y) || !frei(x, y + dy)))) continue; weg.add(nx + ',' + ny); q.push([nx, ny]); } }
    const figurenOk = st.figuren.every((f) => weg.has(f.x + ',' + f.y));
    const zieleOk = !st.mech || st.mech.ziele.every((z) => [...weg].some((w) => { const [x, y] = w.split(',').map(Number); return Math.max(Math.abs(x - z.x), Math.abs(y - z.y)) <= 1; }));
    check(figurenOk && zieleOk, `${id}: alle Figuren auf erreichbaren Feldern, jedes Ziel erreichbar`);
  }
  // 2. Szenen-Verweise
  const fehlt = []; for (const [id, s] of Object.entries(D.SZENEN)) for (const o of [].concat(s.optionen || [], s.weiter ? [{ weiter: s.weiter }] : [])) if (typeof o.weiter === 'string' && !D.SZENEN[o.weiter]) fehlt.push(id + '→' + o.weiter);
  check(!fehlt.length, 'Alle Szenenverweise gibt es' + (fehlt.length ? ': ' + fehlt.join(', ') : ''));
  // 3. Durchlauf: alle Szenen, alle Wege
  try { const out = require('child_process').execFileSync('node', [__dirname + '/../tools/durchlauf-krone.js', '100'], { encoding: 'utf8' }); check(/Alle Szenen erreicht/.test(out), 'Akt I: 100 Durchläufe ohne Fehler, alle Szenen erreicht (alle drei Wege, auch nach Niederlagen)'); }
  catch (e) { check(false, 'Durchlauf: ' + String(e.stdout || e.message).slice(0, 400)); }
  // 4. Kammern: Der Kampf endet erst, wenn alle Eisblöcke offen oder verloren sind
  {
    const A = S.neu(3, { gruppe: F.REIHE.slice(0, 4), abenteuer: 'krone' }); A.szene = 'kampf_kammern';
    const st = R.neuesSpiel(11, S.kampfOptionen(A));
    for (const g of R.gegnerFiguren(st)) R.schaden(st, g, 999);
    check(!st.ende && st.mech.ziele.every((z) => !z.fertig), 'Kammern: Gegner besiegt, aber Eisblöcke noch zu – der Kampf geht weiter');
    let k = 0; while (!st.ende && k++ < 3000) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.autoZug(st); }
    check(st.ende === 'sieg' && st.mech.ziele.every((z) => z.fertig || z.verloren) && st.mech.gerettet >= 1, `Kammern: Danach schlagen die Helden das Eis auf (${st.mech.gerettet} gerettet)`);
    S.kampfEnde(A, st); check(A.merker.s4_verschleppte === st.mech.gerettet && A.szene === 'kammern_nach', 'Die Zahl der Geretteten wird für die Geschichte gemerkt');
  }
  // 5. Browser: Hub (nur mit ?entwurf), Pilgerstraße bis in den Kampf, Grablichter und Schutzkreis zu sehen, Kampf zu Ende
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch()), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  try {
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
    await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    check(Boolean(await p.$('[data-neu-abenteuer="krone"]')), 'Die Krone ist im Hub regulär zu sehen (Stufe 4)');
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    await p.click('[data-neu-abenteuer="krone"]');
    await p.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
    await p.click('#start');
    const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
    for (const f of ['schildwaechter', 'lichtbringer', 'kopfgeldjaeger', 'elementarist']) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
    await p.click('#abenteuer-los'); await p.click('#einl-skip');
    for (let i = 0; i < 60 && !(await p.$('#sz-kampf')); i++) {
      await p.waitForTimeout(250);
      const k = async (sel) => { const e = await p.$(sel); if (e && await e.isEnabled()) { await e.click(); return true; } return false; };
      if (await k('[data-opt="nicht"]') || await k('[data-opt="pilger"]') || await k('[data-opt="kampf"]') || await k('[data-opt="los"]') || await k('[data-wer]') || await k('[data-wurf]') || await k('#sz-weiter')) continue;
    }
    const szene = await p.evaluate(() => window.ABT.A() && window.ABT.A().szene);
    check(['kampf_pilger'].includes(szene) || (await p.$('#sz-kampf')), `Über Vorgeschichte und Routenwahl bis in den Pfadkampf („${szene}“)`);
    await p.click('#sz-kampf'); await p.waitForTimeout(400);
    check(await p.evaluate(() => document.querySelectorAll('#karte .ziel-objekt').length === 3 && document.querySelectorAll('#karte .schild-ring').length === 1), 'Pilgerstraße: drei Grablichter und der Schutzkreis des Eidwächters auf der Karte');
    for (let i = 0; i < 3000; i++) {
      if (await p.isVisible('#ende') && await p.$('#weiter-abenteuer')) { await p.click('#weiter-abenteuer'); break; }
      const s = await p.evaluate(() => window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x');
      if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(30);
    }
    const ende = await p.evaluate(() => window.ABT.A() && window.ABT.A().szene);
    check(['pilger_nach', 'pfad_rueckzug'].includes(ende), `Kampf zu Ende, die Geschichte geht weiter: „${ende}“`);
  } catch (e) { check(false, 'Browser: ' + e.message.split('\n')[0]); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(ok ? '\nKRONE IN ORDNUNG' : '\nKRONE FEHLER');
  process.exit(ok ? 0 : 1);
})();
