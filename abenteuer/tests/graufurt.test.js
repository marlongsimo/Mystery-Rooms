/*
 * Die Fähre von Graufurt (Kurzabenteuer, Entwurf) – im Browser von der Startseite bis zum Ende durchgespielt.
 * Hub nur mit ?entwurf, Reihenfolge Moor → Graufurt → Grauwacht, Einleitung, Szenen, alle Kämpfe auf gezeichneten Karten, Ende.
 * Die Engine (alle Szenen, alle Enden, Kämpfe) prüft tests/kampagnen.test.js und tools/kampagne.js.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/graufurt.test.js   (SHOTS=<Ordner> für Screenshots)
 */
const BASE = process.env.BASE || 'http://localhost:8765', SHOTS = process.env.SHOTS || '';
const { chromium } = require('playwright');
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch());
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: SHOTS ? 2 : 1 })).newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/graufurt-${n}.png` }); } };
  try {
    // Ohne ?entwurf nicht im Hub
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
    await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    check(!(await p.$('[data-neu-abenteuer="graufurt"]')), 'Ohne ?entwurf ist das Kurzabenteuer nicht im Hub');
    // Mit ?entwurf: zwischen Moor und Grauwacht
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf&entwurf'); await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    const reihe = await p.evaluate(() => [...document.querySelectorAll('[data-neu-abenteuer]')].map((x) => x.dataset.neuAbenteuer));
    check(reihe.indexOf('rabenmoor') < reihe.indexOf('graufurt') && reihe.indexOf('graufurt') < reihe.indexOf('grauwacht'), `Reihenfolge im Hub: ${reihe.join(' → ')}`);
    await shot('1-hub');
    await p.click('[data-neu-abenteuer="graufurt"]');
    await p.waitForSelector('#kodex:not([hidden])');
    for (let i = 0; i < 10 && await p.isVisible('#kodex-weiter'); i++) await p.click('#kodex-weiter');
    await p.click('#start');
    const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
    for (const f of ['schildwaechter', 'schattenlaeufer', 'lichtbringer']) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
    await p.click('#abenteuer-los');
    await p.waitForSelector('#einl-skip'); await shot('2-einleitung'); await p.click('#einl-skip');
    // Durchspielen: immer die erste Möglichkeit, Kämpfe mit der Automatik
    const gesehen = new Set(), kaempfe = []; let ende = null, fotoKampf = false, fotoSzene = false;
    for (let schritt = 0; schritt < 400 && !ende; schritt++) {
      await p.waitForTimeout(120);
      const A = await p.evaluate(() => { const a = window.ABT.A(); return a ? { szene: a.szene, art: (window.ABS.datenVon(a.abenteuer).SZENEN[a.szene] || {}).art } : null; });
      if (A) gesehen.add(A.szene);
      if (A && A.art === 'ende') { ende = A.szene; await shot('6-ende'); break; }
      if (A && A.szene === 'faehrhaus' && !fotoSzene) { fotoSzene = true; await shot('3-szene'); }
      const k = async (sel) => { const e = await p.$(sel); if (e && await e.isVisible() && await e.isEnabled()) { await e.click(); return true; } return false; };
      if (await p.isVisible('#karte') && await p.evaluate(() => Boolean(window.AB.st && !window.AB.st.ende))) {
        if (!fotoKampf) { fotoKampf = true; await shot('4-kampf'); }
        const s = await p.evaluate(() => window.AB.R.aktiv(window.AB.st).seite);
        if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(40);
        continue;
      }
      if (await k('#weiter-abenteuer')) { kaempfe.push(A && A.szene); continue; }
      if (await k('#beute-lassen') || await k('[data-geheim]')) continue;
      if (await p.$('[data-stimme]')) { const st = await p.$$('[data-stimme]'); for (const x of st) if (await x.isEnabled()) await x.click(); if (await k('#sz-auswerten')) continue; }
      if (await k('[data-opt]') || await k('[data-wer]') || await k('[data-wurf]') || await k('#sz-kampf') || await k('#sz-weiter')) continue;
    }
    if (!ende) console.log('    hängt in', await p.evaluate(() => JSON.stringify({ szene: window.ABT.A() && window.ABT.A().szene, sichtbar: [...document.querySelectorAll('section:not([hidden])')].map((x) => x.id), knoepfe: [...document.querySelectorAll('button')].filter((x) => x.offsetParent && !x.disabled).map((x) => x.id || x.className + ':' + x.textContent.trim().slice(0, 30)).slice(0, 25) })));
    check(Boolean(ende) && ['ende_norden', 'ende_wehre'].includes(ende), `Bis zum Ende durchgespielt: „${ende}“ (${gesehen.size} Szenen)`);
    check(kaempfe.length >= 2, `Kämpfe im Browser auf gezeichneten Karten: ${kaempfe.length}`);
    check(['faehrhaus', 'wegwahl', 'anderes_ufer', 'lager', 'turm_wahl', 'kampf_turm', 'turm_nach', 'splitter'].every((s) => gesehen.has(s)), 'Fährhaus, Weg über die Wehre, Lager, Zollturm und der graue Stein kommen vor');
    check(await p.evaluate(() => { const s = document.querySelector('#szene'); return Boolean(s && !s.hidden && /Siegel von Grauwacht/.test(s.textContent)); }), 'Das Ende verweist auf „Das Siegel von Grauwacht“');
  } catch (e) { check(false, 'Browser: ' + e.message.split('\n')[0]); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(ok ? '\nGRAUFURT IN ORDNUNG' : '\nGRAUFURT FEHLER'); process.exit(ok ? 0 : 1);
})();
