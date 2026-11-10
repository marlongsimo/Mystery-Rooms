/*
 * Abenteuer – Kampf-Prototyp im Browser
 * Regeln (300 Seeds, ohne Browser) → Start → Bewegen per Antippen → Aktion mit Ziel → Zug beenden → Gegner ziehen →
 * restliche Züge automatisch bis zum Ende → Endbildschirm → Neustart. Handy- und Desktopbreite, keine Konsolenfehler.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/abenteuer.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/abenteuer/index.html';
const { chromium } = require('playwright');
const R = require('../js/regeln.js');
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };

  // 1. Regeln ohne Browser
  let siege = 0, runden = 0, haenger = 0;
  for (let s = 1; s <= 300; s++) {
    const st = R.neuesSpiel(s); let n = 0;
    while (!st.ende && n++ < 400) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.autoZug(st); }
    if (!st.ende) haenger++; if (st.ende === 'sieg') siege++; runden += st.runde;
  }
  check(haenger === 0, `Regeln: 300 Kämpfe enden alle (${siege} Siege, Ø ${(runden / 300).toFixed(1)} Runden)`);
  check(siege > 200 && siege < 300, 'Regeln: Kampf ist gewinnbar, aber nicht immer');

  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 860 }]) {
    const p = await (await b.newContext({ viewport: vp })).newPage();
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(URL + '?seed=42&schnell');
    check(/Klostergarten/.test(await p.textContent('h1')), `${vp.width}px: Startseite`);
    await p.click('#start');
    await p.waitForFunction(() => window.AB.st && window.AB.R.aktiv(window.AB.st).seite === 'spieler');
    check(await p.isVisible('#karte'), `${vp.width}px: Karte sichtbar`);
    check((await p.$$('#karte .feld')).length === 12 * 9, `${vp.width}px: 12×9 Felder`);
    const name0 = await p.evaluate(() => window.AB.R.aktiv(window.AB.st).name);
    const ziel = await p.evaluate(() => { const st = window.AB.st, f = window.AB.R.aktiv(st); for (const [k] of window.AB.R.erreichbar(st, f, st.zug.bewegung)) { const [x, y] = k.split(',').map(Number); if (x > f.x) return { x, y }; } });
    await p.click(`#karte .feld[data-x="${ziel.x}"][data-y="${ziel.y}"]`, { force: true });
    const pos = await p.evaluate(() => { const f = window.AB.R.aktiv(window.AB.st); return { x: f.x, y: f.y, bew: window.AB.st.zug.bewegung }; });
    check(pos.x === ziel.x && pos.y === ziel.y && pos.bew < 6, `${vp.width}px: ${name0} bewegt sich per Antippen`);
    const aktion = await p.evaluate(() => { const st = window.AB.st, f = window.AB.R.aktiv(st), c = window.AB.R.KLASSEN[f.klasse]; const a = [...c.aktionen, ...c.bonus].find((a) => a.art !== 'selbstheilung' && window.AB.R.verfuegbar(st, a.id) && window.AB.R.ziele(st, a.id).length); return a && a.id; });
    if (aktion) {
      await p.click(`#aktionen [data-a="${aktion}"]`);
      check(/Ziel antippen/.test(await p.textContent('#hinweis')), `${vp.width}px: Aktion gewählt, Hinweis erscheint`);
      const z = await p.evaluate((id) => { const t = window.AB.R.ziele(window.AB.st, id)[0]; return { x: t.x, y: t.y }; }, aktion);
      const vorher = await p.evaluate(() => window.AB.st.log.length);
      await p.click(`#karte .feld[data-x="${z.x}"][data-y="${z.y}"]`, { force: true });
      check(await p.evaluate((v) => window.AB.st.log.length > v, vorher), `${vp.width}px: Aktion ausgeführt, Protokoll wächst`);
    } else console.log(`  · ${vp.width}px: keine Aktion mit Ziel in Reichweite`);
    await p.click('#ende-zug');
    await p.waitForFunction((n) => window.AB.st.ende || window.AB.R.aktiv(window.AB.st).name !== n, name0);
    check(true, `${vp.width}px: Zug beendet, nächste Figur am Zug`);
    let geklickt = false;
    for (let i = 0; i < 400; i++) {
      const s = await p.evaluate(() => window.AB.st.ende ? 'ende' : window.AB.R.aktiv(window.AB.st).seite);
      if (s === 'ende') break;
      if (s === 'spieler' && !geklickt) {
        const a = await p.evaluate(() => { const st = window.AB.st, f = window.AB.R.aktiv(st), c = window.AB.R.KLASSEN[f.klasse]; const a = c.aktionen.find((a) => window.AB.R.verfuegbar(st, a.id) && window.AB.R.ziele(st, a.id).length); return a && a.id; });
        if (a) {
          await p.click(`#aktionen [data-a="${a}"]`);
          const hinweis = /Ziel antippen/.test(await p.textContent('#hinweis'));
          const z = await p.evaluate((id) => { const t = window.AB.R.ziele(window.AB.st, id)[0]; return { x: t.x, y: t.y }; }, a);
          const vorher = await p.evaluate(() => window.AB.st.log.length);
          await p.click(`#karte .feld[data-x="${z.x}"][data-y="${z.y}"]`, { force: true });
          const nachher = await p.evaluate((v) => window.AB.st.log.length > v && !window.AB.st.zug.aktion, vorher);
          check(hinweis && nachher, `${vp.width}px: Aktion „${a}“ per Knopf und Ziel antippen ausgeführt`);
          geklickt = true;
          if (!(await p.evaluate(() => window.AB.st.ende))) await p.click('#ende-zug');
          continue;
        }
      }
      if (s === 'spieler') await p.evaluate(() => window.AB.auto());
      else await p.waitForTimeout(20);
    }
    check(geklickt, `${vp.width}px: mindestens eine Aktion per Antippen gespielt`);
    const ende = await p.evaluate(() => window.AB.st.ende);
    check(!!ende, `${vp.width}px: Kampf endet (${ende})`);
    check(await p.isVisible('#ende') && /Sieg|Rückzug/.test(await p.textContent('#ende h2')), `${vp.width}px: Endbildschirm`);
    await p.click('#neu');
    check(await p.evaluate(() => !window.AB.st.ende && window.AB.st.runde === 1) && await p.isHidden('#ende'), `${vp.width}px: Neustart`);
    check(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${vp.width}px: kein seitliches Scrollen`);
    if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/abenteuer-${vp.width}.png`, fullPage: true });
  }
  check(errs.length === 0, 'keine Konsolenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(ok ? '\nALLE PRÜFUNGEN BESTANDEN' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
