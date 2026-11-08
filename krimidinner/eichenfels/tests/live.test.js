/*
 * Krimidinner Eichenfels – Live-Verbindung gegen die echte Datenbank (zwei Browserprofile)
 * Spielleitung eröffnet eine Live-Sitzung → Gast verbindet sich vom Rollenblatt aus → Spielleitung öffnet Runde 1 →
 * beim Gast öffnet sich Runde 1 von selbst → Anklage digital → Spielleitung sieht sie, nach der Lösung mit ✓ → Ende.
 * Solange „krimidinner-eichenfels“ nicht in game_catalog steht, läuft der Test über LIVE_SLUG (Standard: sektor-9).
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/eichenfels/tests/live.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const SLUG = process.env.LIVE_SLUG || 'sektor-9';
const URL = BASE + '/krimidinner/eichenfels/index.html?liveslug=' + SLUG;
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 25000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(400); } return false; };

  // Ohne Katalogeintrag: freundliche Meldung, nichts bricht
  const X = await page(); await X.goto(BASE + '/krimidinner/eichenfels/index.html');
  const hc0 = await X.evaluate(() => KD.encode({ host: true, n: 5, variants: 0 }));
  await X.evaluate((c) => localStorage.setItem('kd_eich_host', JSON.stringify({ code: c, people: [], seen: {} })), hc0);
  await X.goto(BASE + '/krimidinner/eichenfels/index.html#leitung'); await X.waitForSelector('#liveStart');
  await X.click('#liveStart'); await until(X, () => !document.querySelector('#liveStart') || document.querySelector('#liveStart').disabled === false && document.querySelector('.live .fb'));
  const msg = await X.evaluate(() => (document.querySelector('.live .fb') || {}).textContent || (document.querySelector('.live.on') ? 'verbunden' : ''));
  console.log('    ohne game_catalog-Eintrag:', msg);
  check(msg && msg !== 'verbunden', 'Ohne Katalogeintrag: Meldung statt Fehler, Losungswörter bleiben');
  if (msg === 'verbunden') await X.click('#liveEnd');

  // Spielleitung
  const H = await page(); await H.goto(URL);
  const hc = await H.evaluate(() => KD.encode({ host: true, n: 5, variants: 0 }));
  const gc = await H.evaluate(() => KD.encode({ host: false, role: 1, n: 5, variants: 0 })); // R02
  await H.evaluate((c) => localStorage.setItem('kd_eich_host', JSON.stringify({ code: c, people: [], seen: {} })), hc);
  await H.goto(URL + '#leitung'); await H.reload(); await H.waitForSelector('#liveStart');
  await H.click('#liveStart');
  check(await until(H, () => Boolean(document.querySelector('.live.on .lcode'))), 'Spielleitung: Live-Sitzung eröffnet');
  const room = (await H.textContent('.live.on .lcode')).trim();
  console.log('    Live-Code:', room);

  // Gast
  const G = await page(); await G.goto(URL + '#c=' + gc.replace('-', '')); await G.waitForSelector('.doc');
  await G.click('.live summary'); await G.fill('#liveCode', room); await G.fill('#liveName', 'Bo'); await G.click('#liveJoin');
  check(await until(G, () => Boolean(document.querySelector('.live.on'))), 'Gast: vom Rollenblatt aus verbunden');
  check(await until(H, () => /2 Geräte/.test(document.querySelector('.live.on').textContent)), 'Spielleitung sieht 2 Geräte');
  check(/🔒/.test(await G.textContent('[data-tab="p3"]')), 'Gast: Runde 1 noch gesperrt');

  // Runde 1 öffnen
  await H.evaluate(() => { const h = JSON.parse(localStorage.getItem('kd_eich_host')); h.step = 3; localStorage.setItem('kd_eich_host', JSON.stringify(h)); }); await H.reload(); await H.waitForSelector('[data-round="1"]');
  await H.click('[data-round="1"]');
  check(await until(G, () => !/🔒/.test(document.querySelector('[data-tab="p3"]').textContent), null, 30000), 'Gast: Runde 1 öffnet sich von selbst (ohne Losungswort)');
  check(await G.evaluate(() => (document.querySelector('#toast') || {}).textContent || '').then((t) => /Runde 1 ist offen/.test(t)), 'Gast: Meldung „Runde 1 ist offen …“');
  await G.click('[data-tab="bew"]');
  check((await G.$$('.ecard')).length === 4, 'Gast: Beweise B1–B4 da');

  // Anklage
  await H.evaluate(() => { const h = JSON.parse(localStorage.getItem('kd_eich_host')); h.step = 6; localStorage.setItem('kd_eich_host', JSON.stringify(h)); }); await H.reload(); await H.waitForSelector('#accOpen');
  await H.click('#accOpen');
  check(await until(G, () => Boolean(document.querySelector('[data-tab="acc"]')), null, 30000), 'Gast: Tab „Anklage“ erscheint');
  await G.click('[data-tab="acc"]'); await G.selectOption('#accWho', 'R08'); await G.fill('#accWhy', 'Verkauf der Originalblätter'); await G.fill('#accProof', 'Karte 21:24 Restaurierung');
  await G.click('#accSend');
  check(await until(G, () => /ABGEGEBEN/.test(document.querySelector('#pane').textContent)), 'Gast: Anklage abgegeben');
  check(await until(H, () => /1 von 1/.test((document.querySelector('.live.on') && document.body.textContent) || ''), null, 30000), 'Spielleitung: „1 von 1 abgegeben“');
  await H.click('#accShow');
  check(/Bo/.test(await H.textContent('table.acc')) && /Rademacher/.test(await H.textContent('table.acc')), 'Spielleitung: Anklage von Bo gegen Rademacher');
  check(!/✓/.test(await H.textContent('table.acc')), 'Vor der Lösung kein ✓');
  await H.click('[data-tab="loesung"]'); await H.click('#sol');
  check(await until(H, () => /Richtig angeklagt: 1 von 1/.test(document.body.textContent)), 'Nach der Lösung: „Richtig angeklagt: 1 von 1“');

  // Ende
  await H.click('[data-tab="ablauf"]'); await H.click('#liveEnd');
  check(await until(H, () => Boolean(document.querySelector('#liveStart'))), 'Live-Sitzung beendet');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nLive-Verbindung in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
