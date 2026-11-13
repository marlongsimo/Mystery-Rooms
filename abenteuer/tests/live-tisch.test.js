/*
 * Mythara – Einladen-Schritt, Gäste-Code und Spieltisch-Wechsel gegen die echte Datenbank (Migration 004).
 * Tisch T (Gast) startet „Spieltisch + Handys“ → Einladen: Name ändern, Gäste-Code (XXXX-XXXX-XXXX) →
 * Handy G tritt mit dem Code bei → T gibt den Tisch per Tisch-Code an Gerät N ab (QR-Link ?tisch=) →
 * G verbindet sich von selbst mit N → N wechselt im Spiel den Tisch an Gerät M (Code über „Als Spieltisch verbinden“).
 * Aufräumen: Kampagne löschen.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-tisch.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch()); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (name, w = 1280) => { const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const CODE = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  let kid = null;
  const T = await page('T');
  try {
    await T.goto(BASE + '/abenteuer/index.html'); await T.click('#my-gast-start');
    await T.click('.hub-kachel[data-hub="neu"]'); await T.click('[data-neu-abenteuer="hochwacht"]');
    await T.waitForSelector('#kodex:not([hidden])');
    for (let i = 0; i < 6; i++) await T.click('#kodex-weiter');
    await T.click('#live');
    check(await until(T, () => !document.querySelector('#einladen').hidden && Boolean(document.querySelector('#ei-weiter'))), 'Nach „Spieltisch + Handys“ kommt der Einladen-Schritt');
    kid = await T.evaluate(() => window.KAMPAGNE.aktuell().id);
    const gast = await T.evaluate(() => document.querySelector('.ei-karte:nth-child(2) .code')?.textContent || '');
    check(CODE.test(gast), `Gäste-Code im neuen Format: ${gast || '(keiner – Migration 004 aktuell?)'}`);
    check(await T.evaluate(() => /Mit einem Spielerkonto/.test(document.querySelector('.ei-karte').textContent)), 'Gast: Freunde-Bereich verweist aufs Konto');
    await T.fill('#ei-titel', 'Tischtest'); await T.press('#ei-titel', 'Tab');
    check(await until(T, () => window.KAMPAGNE.aktuell().titel === 'Tischtest'), 'Kampagne umbenannt in „Tischtest“');

    // Gast-Handy tritt mit dem Code bei
    const G = await page('G', 400);
    await G.goto(BASE + '/abenteuer/handy.html?k=' + encodeURIComponent(gast));
    await G.fill('#name', 'Gina'); await G.click('#rein');
    check(await until(G, () => document.querySelectorAll('.banner[data-klasse]').length === 5), 'Gast-Handy ist mit dem Code dabei (Heldenwahl)');
    check(await until(T, () => /Gina/.test(document.querySelector('#ei-da').textContent), null, 15000), 'Einladen-Schritt zeigt „Schon da: Gina“');

    // Tisch an Gerät N abgeben (QR-Link ?tisch=)
    await T.click('[data-ei-tisch="anders"]');
    await T.waitForSelector('.ei-warte');
    const tcode = await T.evaluate(() => document.querySelector('.ei-karte:nth-child(3) .code').textContent);
    check(CODE.test(tcode), 'Tisch-Code angezeigt: ' + tcode);
    const N = await page('N');
    await N.goto(BASE + '/abenteuer/index.html'); await N.evaluate(() => window.AB.abenteuerWaehlen('rabenmoor'));
    await N.goto(BASE + '/abenteuer/index.html?tisch=' + encodeURIComponent(tcode) + '&ab=' + await T.evaluate(() => window.AB.SETUP().abenteuer));
    check(await until(N, () => !document.querySelector('#lobby').hidden && window.AB.liveAn(), null, 40000), 'N ist der neue Spieltisch (Heldenwahl mit eigenem Raum)');
    check(await N.evaluate(() => window.AB.SETUP().abenteuer === 'hochwacht' && /Pass/.test(document.querySelector('#abenteuer-los').textContent)), 'N zeigt das gewählte Abenteuer (Hochwacht), obwohl die Kampagne umbenannt wurde und N zuletzt etwas anderes hatte');
    check(await N.evaluate((k) => window.KAMPAGNE.aktuell().id === k && !location.search.includes('tisch='), kid), 'N spielt dieselbe Kampagne, der Code ist aus der Adresse entfernt');
    check(await until(T, () => /Spieltisch übergeben/.test(document.querySelector('#qr-overlay').textContent) && !window.AB.liveAn(), null, 20000), 'T: „Spieltisch übergeben“, Runde hier beendet');
    check(await T.evaluate(() => Boolean(document.querySelector('#ab-mitspielen'))), 'T kann mit diesem Gerät mitspielen');
    check(await until(N, () => window.AB.LIVE.client.players.some((p) => p.player_name === 'Gina'), null, 45000), 'Gina hat sich von selbst mit dem neuen Tisch verbunden');
    const rolle = await N.evaluate((k) => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => (l.find((c) => c.id === k) || {}).role), kid);
    check(rolle === 'tisch', 'N steht als „Spieltisch“ in seinen Kampagnen');

    // Im Spiel den Tisch wechseln: N → M über „Als Spieltisch verbinden“ auf der Startseite
    await N.evaluate(() => window.KAMPAGNE.tischWechseln());
    await N.waitForSelector('#tw-titel');
    const mcode = await N.evaluate(() => document.querySelector('#qr-overlay .code').textContent);
    const M = await page('M');
    await M.goto(BASE + '/abenteuer/index.html'); await M.click('#my-tisch-zeigen');
    await M.fill('#my-code-feld', mcode.replace(/-/g, '').toLowerCase());
    check(await M.evaluate(() => document.querySelector('#my-code-feld').value), 'Eingabe wird formatiert');
    await M.click('#my-beitreten');
    const okM = await until(M, () => !document.querySelector('#lobby').hidden && window.AB.liveAn(), null, 40000);
    if (!okM) console.log('    M:', await M.evaluate(() => [document.querySelector('#my-code-feld').value, document.querySelector('#my-code-fb').textContent, document.querySelector('#mythara').hidden, document.querySelector('#lobby').hidden]));
    check(okM, 'M ist über den eingegebenen Code der Spieltisch');
    check(await until(N, () => /Spieltisch übergeben/.test(document.querySelector('#qr-overlay').textContent) && !window.KAMPAGNE.aktuell(), null, 20000), 'N gibt ab');
    check(await until(M, () => window.AB.LIVE.client.players.some((p) => p.player_name === 'Gina'), null, 45000), 'Gina ist jetzt am Tisch M');
  } catch (e) { check(false, 'Ablauf: ' + e.message); }
  if (kid) { const r = await T.evaluate((k) => window.AB.liveClient().rpc('rpg_delete_campaign', { p_campaign_id: k }).then(() => 'ok', (e) => e.message), kid); check(r === 'ok', 'Aufgeräumt: Kampagne gelöscht (' + r + ')'); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(ok ? 'TISCH IN ORDNUNG' : 'TISCH FEHLER'); process.exit(ok ? 0 : 1);
})();
