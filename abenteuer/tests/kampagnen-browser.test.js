/*
 * Mythara – allgemeiner Browsertest für ALLE Abenteuer in daten/*.js (auch Entwürfe, über ?entwurf).
 * Jedes Abenteuer wird von der Startseite bis zu einem Ende durchgespielt: Hub, Regeln, Heldenwahl, Einleitung,
 * alle Szenenarten (Gespräch, Abstimmung, Probe, geheime Entscheidung, Rätsel, Lager), Kämpfe mit der Automatik.
 * Eine neue Kampagne ist damit ohne eigenen Testcode im Browser geprüft. Die Engine prüft tests/kampagnen.test.js.
 *
 * Aufruf: python3 -m http.server 8765 &
 *   node abenteuer/tests/kampagnen-browser.test.js                 alle Abenteuer
 *   node abenteuer/tests/kampagnen-browser.test.js graufurt krone  nur diese
 *   SHOTS=<Ordner> node …                                          zusätzlich Screenshots (Hub, Szene, Kampf, Ende)
 */
const BASE = process.env.BASE || 'http://localhost:8765', SHOTS = process.env.SHOTS || '';
const { chromium } = require('playwright');
const K = require('../tools/kampagne.js');
(async () => {
  let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const wunsch = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const ids = K.ids().filter((id) => !wunsch.length || wunsch.includes(id));
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch());

  // Reihenfolge im Hub: nach Schwierigkeit, dann META.reihe; Entwürfe nur mit ?entwurf
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
    await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    const reihe = await p.evaluate(() => [...document.querySelectorAll('[data-neu-abenteuer]')].map((x) => x.dataset.neuAbenteuer));
    const soll = K.ids().filter((id) => !K.ALLE[id].META.entwurf).sort((x, y) => (K.ALLE[x].META.schwierigkeit || 1) - (K.ALLE[y].META.schwierigkeit || 1) || (K.ALLE[x].META.reihe || 0) - (K.ALLE[y].META.reihe || 0));
    check(JSON.stringify(reihe) === JSON.stringify(soll), `Hub zeigt alle freigegebenen Abenteuer in der richtigen Reihenfolge: ${reihe.join(' → ')}`);
    await p.context().close();
  }

  for (const id of ids) {
    const D = K.ALLE[id], META = D.META, errs = [];
    console.log(`\n${META.titel} (${id})${META.entwurf ? ' · Entwurf' : ''}`);
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: SHOTS ? 2 : 1 })).newPage();
    p.setDefaultTimeout(20000);
    p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
    const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/${id}-${n}.png` }); } };
    try {
      await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf&entwurf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
      await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
      await shot('1-hub');
      await p.click(`[data-neu-abenteuer="${id}"]`);
      await p.waitForSelector('#kodex:not([hidden])');
      for (let i = 0; i < 12 && await p.isVisible('#kodex-weiter'); i++) await p.click('#kodex-weiter');
      await p.click('#start');
      const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
      const gruppe = ['schildwaechter', 'schattenlaeufer', 'lichtbringer', 'elementarist'].slice(0, Math.max(META.min || 3, 3) + (id === 'krone' || id === 'hochwacht' ? 1 : 0));
      for (const f of gruppe) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
      await p.click('#abenteuer-los');
      await p.waitForSelector('#einl-skip'); await p.click('#einl-skip');
      // Durchspielen: immer die erste Möglichkeit, Kämpfe mit der Automatik
      const gesehen = new Set(), arten = new Set(); let ende = null, kaempfe = 0, fotoKampf = false, fotoSzene = false, gleich = 0, zuletzt = '';
      for (let schritt = 0; schritt < 2500 && !ende; schritt++) {
        await p.waitForTimeout(100);
        const A = await p.evaluate(() => { const a = window.ABT.A(); if (!a) return null; const s = window.ABS.datenVon(a.abenteuer).SZENEN[a.szene] || {}; return { szene: a.szene, art: s.art, loesung: s.loesung || null }; });
        if (A) { gesehen.add(A.szene); arten.add(A.art); }
        if (A && A.art === 'ende') { ende = A.szene; await shot('4-ende'); break; }
        if (A && A.art === 'gespraech' && !fotoSzene) { fotoSzene = true; await shot('2-szene'); }
        const k = async (sel) => { const e = await p.$(sel); if (e && await e.isVisible() && await e.isEnabled()) { await e.click(); return true; } return false; };
        if (await p.isVisible('#karte') && await p.evaluate(() => Boolean(window.AB.st && !window.AB.st.ende))) {
          if (!fotoKampf) { fotoKampf = true; await shot('3-kampf'); }
          const s = await p.evaluate(() => window.AB.R.aktiv(window.AB.st).seite);
          if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(30);
          continue;
        }
        // Hängt der Ablauf (lange dieselbe Szene ohne Kampf)? Dann abbrechen und melden
        const jetzt = (A && A.szene) + '|' + kaempfe; if (jetzt === zuletzt) gleich++; else { gleich = 0; zuletzt = jetzt; } if (gleich > 150) break;
        if (await k('#weiter-abenteuer')) { kaempfe++; continue; }
        if (await k('#beute-lassen')) continue;
        if (await k('[data-ersatz]')) continue;
        // Rätsel: die Lösung in der richtigen Reihenfolge antippen
        if (A && A.art === 'raetsel' && A.loesung && await p.$('[data-glocke]')) { for (const g of A.loesung) { const e = await p.$(`[data-glocke="${g}"]`); if (e) { await e.click(); await p.waitForTimeout(120); } } continue; }
        // Geheime Entscheidung am Tisch: je Figur (Zeile) eine Antwort, dann weiter
        if (await p.$('[data-geheim]')) {
          await p.evaluate(() => document.querySelectorAll('.opt-zeile').forEach((z) => { const x = z.querySelector('[data-geheim]'); if (x && !z.querySelector('[data-geheim]:not(.ghost)')) x.click(); }));
          await p.waitForTimeout(150);
          if (await k('#sz-weiter')) continue;
        }
        if (await p.$('[data-stimme]')) { for (const x of await p.$$('[data-stimme]')) if (await x.isEnabled()) await x.click(); if (await k('#sz-auswerten')) continue; }
        if (await k('[data-opt]') || await k('[data-wer]') || await k('[data-wurf]') || await k('#sz-kampf') || await k('#sz-weiter')) continue;
      }
      if (!ende) console.log('    hängt in', await p.evaluate(() => JSON.stringify({ szene: window.ABT.A() && window.ABT.A().szene, knoepfe: [...document.querySelectorAll('button')].filter((x) => x.offsetParent && !x.disabled).map((x) => x.id || x.className + ':' + x.textContent.trim().slice(0, 30)).slice(0, 20) })));
      const regulaer = ende && K.istRegulaeresEnde(D, ende);
      check(Boolean(ende), `Bis zu einem Ende durchgespielt: „${ende}“${ende ? (regulaer ? ' (reguläres Ende)' : ' (Niederlage)') : ''} · ${gesehen.size} Szenen, ${kaempfe} Kämpfe`);
      check(kaempfe >= 1, 'Mindestens ein Kampf läuft im Browser bis zum Ergebnis');
      check(['gespraech', 'kampf'].every((a) => arten.has(a)), `Szenenarten im Durchlauf: ${[...arten].filter(Boolean).join(', ')}`);
      if (ende) check(await p.evaluate(() => { const s = document.querySelector('#szene'); return Boolean(s && !s.hidden && s.textContent.trim().length > 80); }), 'Das Ende wird mit Text angezeigt');
    } catch (e) { check(false, 'Browser: ' + e.message.split('\n')[0]); }
    check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
    await p.context().close();
  }
  await b.close();
  console.log(ok ? '\nKAMPAGNEN IM BROWSER IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
