/*
 * Mythara – Wiedereinstieg gegen die echte Datenbank: Ein Handy fällt mitten im Abenteuer raus und kommt zurück →
 * es bekommt seinen Helden automatisch wieder (ohne neue Wahl). Danach: Kampagne pausieren und mit Handys fortsetzen
 * (neuer Raum) → wer mit dem neuen Code beitritt, spielt sofort wieder seinen Helden. Aufräumen: Kampagne löschen.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-wiedereinstieg.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (name, w = 1200) => { const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const zu = async (p, fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  const fids = { Anna: 'wildnislaeufer', Ben: 'inquisitor', Cara: 'trickser' }, H = {};
  const beitreten = async (P, code, n) => { await P.goto('about:blank'); await P.goto(BASE + '/abenteuer/handy.html#' + code); await P.fill('#name', n); await P.click('#rein'); };
  const meinHeld = (P, fid) => until(P, (f) => window.ABH.H.spiel && window.ABH.H.spiel.besitz && window.ABH.H.spiel.besitz[f] === window.ABH.H.client.user.id && !document.querySelector('.banner[data-klasse]'), fid, 40000);
  let kid = null;
  const L = await page('Tisch');
  try {
    await L.goto(BASE + '/abenteuer/index.html?schnell'); await L.click('#my-gast-start'); await L.click('.hub-kachel[data-hub="neu"]'); await L.click('[data-neu-abenteuer="grauwacht"]');
    await L.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await L.click('#kodex-weiter');
    await L.click('#live'); await L.waitForSelector('#ei-weiter'); await L.click('#ei-weiter');
    await L.waitForSelector('.beitritt .code'); const code = (await L.textContent('.beitritt .code')).trim();
    for (const n of Object.keys(fids)) {
      const P = H[n] = await page(n, 390); await beitreten(P, code, n);
      await until(P, () => document.querySelectorAll('.banner[data-klasse]').length === 5);
      await zu(P, fids[n]); await P.click(`[data-fid="${fids[n]}"]`); await P.click('#f-spielen');
      await until(P, () => Boolean(document.querySelector('.bogen')));
    }
    await until(L, () => !document.querySelector('#abenteuer-los').disabled);
    await L.click('#abenteuer-los'); await L.click('#einl-skip');
    check(await until(L, () => window.ABT.laeuft() && window.AB.LIVE.phase === 'szene'), 'Abenteuer läuft mit drei Handys');
    kid = await L.evaluate(() => window.KAMPAGNE.aktuell().id);

    // Anna fällt raus (verlässt die Sitzung) und kommt mit demselben Handy zurück
    await H.Anna.evaluate(() => window.ABH.H.client.leave());
    check(await until(L, () => !window.AB.LIVE.besitz.wildnislaeufer), 'Tisch: Annas Held ist frei, nachdem ihr Handy weg ist');
    await beitreten(H.Anna, code, 'Anna');
    check(await meinHeld(H.Anna, 'wildnislaeufer'), 'Anna ist zurück und hat ihren Helden automatisch wieder (keine neue Wahl)');
    check(await L.evaluate(() => window.AB.LIVE.besitz.wildnislaeufer && window.AB.spielerName(window.AB.LIVE.besitz.wildnislaeufer) === 'Anna'), 'Tisch ordnet den Helden wieder Anna zu');

    // Pause und Fortsetzen mit Handys: neuer Raum, Ben tritt mit dem neuen Code bei
    await L.evaluate(() => window.KAMPAGNE.pausieren());
    check(await until(L, () => !window.AB.liveAn() && window.KAMPAGNE.aktuell().status === 'pausiert'), 'Kampagne pausiert');
    await L.evaluate((k) => window.KAMPAGNE.fortsetzen(k, true), kid);
    check(await until(L, () => window.AB.liveAn() && window.ABT.laeuft()), 'Mit Handys fortgesetzt (neuer Raum)');
    const code2 = await L.evaluate(() => window.AB.LIVE.client.session.room_code);
    check(code2 !== code, 'Neuer Raum-Code ' + code2);
    await beitreten(H.Ben, code2, 'Ben');
    check(await meinHeld(H.Ben, 'inquisitor'), 'Ben tritt dem neuen Raum bei und spielt sofort wieder seinen Helden');
  } catch (e) { check(false, 'Ablauf: ' + e.message); }
  if (kid) { const r = await L.evaluate((k) => window.AB.liveClient().rpc('rpg_delete_campaign', { p_campaign_id: k }).then(() => 'ok', (e) => e.message), kid); check(r === 'ok', 'Aufgeräumt: Kampagne gelöscht'); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? 'WIEDEREINSTIEG IN ORDNUNG' : 'WIEDEREINSTIEG FEHLER'); process.exit(ok ? 0 : 1);
})();
