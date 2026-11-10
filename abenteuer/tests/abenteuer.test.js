/*
 * Abenteuer – Kampf auf einem Gerät im Browser, mit den 15 Charakteren
 * Regeln (ohne Browser): alle 15 Figuren auf allen Stufen, Normal und Hardcore, keine Fehler, keine Hänger.
 * Browser: Start → Gruppe wählen (15 Porträts, 3–6) → Stufe/Schwierigkeit/Gegner → Kampf → Bewegen per Antippen →
 * Aktion mit Ziel → Selbst-Aktion → Zug beenden → Rest automatisch → Endbildschirm → Neustart → Gruppe ändern.
 * Handy- und Desktopbreite, keine Konsolenfehler, alle Bilder geladen.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/abenteuer.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/abenteuer/index.html';
const { chromium } = require('playwright');
const R = require('../js/regeln.js'), F = R.FD;
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const nimm = async (p, fid) => { await p.click('[data-fid="' + fid + '"]'); await p.click('#f-waehlen'); };

  // 1. Regeln ohne Browser: jede Figur auf jeder Stufe, beide Schwierigkeiten
  check(F.REIHE.length === 15 && F.REIHE.every((fid) => F.FIGUREN[fid].name && F.FIGUREN[fid].titel), '15 Figuren mit Namen und Titel');
  let kaempfe = 0, haenger = 0, fehler = 0, genutzt = new Set();
  const rnd = R.rng(99);
  for (const stufe of [1, 2, 3]) for (const fid of F.REIHE) for (const hard of [false, true]) {
    const gruppe = [fid].concat(F.REIHE.filter((x) => x !== fid).sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 4)));
    try {
      const st = R.neuesSpiel(stufe * 1000 + F.REIHE.indexOf(fid) * 10 + (hard ? 1 : 0), { figuren: gruppe, stufe, schwierigkeit: hard ? 'hardcore' : 'normal', gegner: [{ art: ['rostkaefer', 'knochenwaechter', 'aschehund'][stufe - 1], anzahl: gruppe.length }] });
      const H = R.handeln; let n = 0;
      while (!st.ende && n++ < 800) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.autoZug(st); }
      for (const l of st.log) { const m = /^([^:]+): ([^–(]+?)(?: –|$| \()/.exec(l.t); if (m) genutzt.add(m[2].trim()); }
      if (!st.ende) haenger++; kaempfe++;
    } catch (e) { fehler++; console.log(e.stack.split('\n').slice(0, 3).join('\n')); }
  }
  check(fehler === 0 && haenger === 0, `Regeln: ${kaempfe} Kämpfe (15 Figuren × 3 Stufen × Normal/Hardcore) ohne Fehler und Hänger`);
  check(genutzt.size >= 25, `Regeln: ${genutzt.size} verschiedene Fähigkeiten wurden im Kampf eingesetzt`);
  // Speichern/Laden ergibt denselben Verlauf
  const a = R.neuesSpiel(5, { figuren: ['tiergefaehrte', 'gelehrter', 'inquisitor', 'trickser'], stufe: 3 });
  for (let i = 0; i < 6; i++) R.aktiv(a).seite === 'gegner' ? R.gegnerZug(a) : R.autoZug(a);
  const b = R.laden(R.speichern(a));
  for (let i = 0; i < 40 && !a.ende; i++) for (const s of [a, b]) R.aktiv(s).seite === 'gegner' ? R.gegnerZug(s) : R.autoZug(s);
  check(JSON.stringify(R.speichern(a)) === JSON.stringify(R.speichern(b)), 'Speichern und Laden ergibt denselben Kampfverlauf (inkl. Wolf und Zustände)');

  const br = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 860 }]) {
    const p = await (await br.newContext({ viewport: vp })).newPage();
    const kaputt = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('response', (r) => { if (r.status() >= 400) kaputt.push(r.url()); });
    await p.goto(URL + '?seed=42&schnell');
    await p.evaluate(() => localStorage.clear()); await p.reload();
    check(/Grauwacht/.test(await p.textContent('h1')), `${vp.width}px: Startseite`);
    check(await p.isVisible('#titel-start') && await p.isVisible('.titel-bild'), `${vp.width}px: Titelbild mit Szene`);
    await p.click('#titel-start');
    check(await p.isVisible('#einleitung') && /Splitterlande/.test(await p.textContent('#einleitung .seite:not([hidden])')), `${vp.width}px: Einleitung, Seite 1`);
    for (let i = 0; i < 3; i++) await p.click('#einl-weiter');
    check(await p.isVisible('#kodex') && /Euer Tisch/.test(await p.textContent('#kodex .seite:not([hidden])')), `${vp.width}px: Kodex beginnt mit „Euer Tisch“`);
    await p.click('#kodex-weiter'); await p.click('#w20'); await p.waitForTimeout(800);
    check(/gegen SG 13|immer/.test(await p.textContent('#w20-text')), `${vp.width}px: Würfel im Kodex zum Ausprobieren`);
    for (let i = 0; i < 4; i++) await p.click('#kodex-weiter');
    await p.click('[data-schwer-wahl="hardcore"]'); await p.click('[data-schwer-wahl="normal"]');
    if (process.env.SHOT_DIR && vp.width === 1280) await p.screenshot({ path: process.env.SHOT_DIR + '/kodex-ende.png' });
    await p.click('#start');
    check((await p.$$('.fkarte')).length === 15, `${vp.width}px: Gruppenwahl mit 15 Karten`);
    const bilder = await p.$$eval('.fkarte img', (xs) => Promise.all(xs.map((x) => x.complete ? x.naturalWidth : new Promise((r) => { x.onload = () => r(x.naturalWidth); x.onerror = () => r(0); }))));
    check(bilder.every((w) => w > 100), `${vp.width}px: alle 15 Porträts geladen`);
    // Gruppe: Standard 3, dazu Faye (Wolf) und Silra; Torvald raus und wieder rein
    check(await p.isVisible('.held h2') && (await p.$$('.platz.leer')).length === 6, `${vp.width}px: Vorstellung eines Helden, 6 leere Plätze`);
    for (const f of ['schildwaechter', 'elementarist', 'lichtbringer', 'tiergefaehrte', 'trickser']) await nimm(p, f);
    await p.click('[data-fid="schildwaechter"]'); await p.click('#f-waehlen');
    check(!(await p.$eval('[data-fid="schildwaechter"]', (x) => x.classList.contains('an'))), `${vp.width}px: Figur abwählen`);
    await p.click('#f-waehlen');
    await p.click('[data-filter="zauberer"]');
    check((await p.$$('.fkarte')).length === 3, `${vp.width}px: Filter Zauberer zeigt 3 Helden`);
    await p.click('[data-filter="alle"]');
    check(/5 von 3–6/.test(await p.textContent('.wahl-fuss h2')), `${vp.width}px: 5 Figuren in der Gruppe`);
    await p.click('.uebung summary');
    await p.click('[data-stufe="2"]'); await p.click('[data-schwer="hardcore"]'); await p.selectOption('#begegnung', 'gruft');
    check(/Hardcore/.test(await p.textContent('#lobby')), `${vp.width}px: Hardcore gewählt, Hinweis sichtbar`);
    if (vp.width === 1280 && process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + '/gruppe-1280.png', fullPage: true });
    if (vp.width === 390 && process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + '/gruppe-390.png', fullPage: true });
    await p.click('#los');
    await p.waitForFunction(() => window.AB.st && window.AB.R.aktiv(window.AB.st).seite === 'spieler', null, { timeout: 15000 });
    const info = await p.evaluate(() => ({ n: window.AB.R.spielerFiguren(window.AB.st).length, wolf: window.AB.st.figuren.some((f) => f.art === 'wolf'), stufe: window.AB.st.stufe, hard: window.AB.st.schwierigkeit, gegner: window.AB.st.figuren.filter((f) => f.seite === 'gegner').map((f) => f.art) }));
    check(info.n === 5 && info.wolf && info.stufe === 2 && info.hard === 'hardcore' && info.gegner.every((g) => g === 'knochenwaechter'), `${vp.width}px: Kampf mit 5 Figuren + Wolf, Stufe 2, Hardcore, Knochenwächter`);
    check((await p.$$('#karte image')).length >= 6, `${vp.width}px: Porträts auf der Karte`);
    const name0 = await p.evaluate(() => window.AB.R.aktiv(window.AB.st).name);
    const ziel = await p.evaluate(() => { const st = window.AB.st, f = window.AB.R.aktiv(st); for (const [k, c] of window.AB.R.bewegungsfelder(st, f)) { if (c === 'schritt') continue; const [x, y] = k.split(',').map(Number); if (x > f.x) return { x, y }; } });
    if (ziel) {
      await p.click(`#karte .feld[data-x="${ziel.x}"][data-y="${ziel.y}"]`, { force: true });
      const pos = await p.evaluate(() => { const f = window.AB.R.aktiv(window.AB.st); return { x: f.x, y: f.y }; });
      check(pos.x === ziel.x && pos.y === ziel.y, `${vp.width}px: ${name0} bewegt sich per Antippen`);
    }
    // Aktion per Knopf + Ziel, sobald möglich; Selbst-Aktion (Trank o. Ä.) wenn möglich
    let geklickt = false, selbst = false;
    for (let i = 0; i < 400; i++) {
      const s = await p.evaluate(() => window.AB.st.ende ? 'ende' : window.AB.R.aktiv(window.AB.st).seite);
      if (s === 'ende') break;
      if (s === 'spieler' && !geklickt) {
        const a = await p.evaluate(() => { const st = window.AB.st, R = window.AB.R, f = R.aktiv(st); const a = R.aktionenVon(f, st).find((a) => a.typ === 'aktion' && R.verfuegbar(st, a.id) && R.ziele(st, a.id).some((z) => z.seite === 'gegner')); return a && a.id; });
        if (a) {
          await p.click(`#aktionen [data-a="${a}"]`);
          const hinweis = /leuchtendes Ziel/.test(await p.textContent('#hinweis'));
          const z = await p.evaluate((id) => { const t = window.AB.R.ziele(window.AB.st, id).find((z) => z.seite === 'gegner'); return { x: t.x, y: t.y }; }, a);
          const vorher = await p.evaluate(() => window.AB.st.log.length);
          await p.click(`#karte .feld[data-x="${z.x}"][data-y="${z.y}"]`, { force: true });
          check(hinweis && await p.evaluate((v) => window.AB.st.log.length > v && !window.AB.st.zug.aktion, vorher), `${vp.width}px: Aktion „${a}“ per Knopf und Ziel ausgeführt`);
          geklickt = true;
        }
      }
      if (s === 'spieler' && !selbst) {
        const id = await p.evaluate(() => { const st = window.AB.st, R = window.AB.R, f = R.aktiv(st); const a = R.aktionenVon(f, st).find((a) => ['raserei', 'finte', 'gift', 'verstecken', 'spurt', 'segen', 'spiegelbilder', 'rueckzug'].includes(a.art) && R.verfuegbar(st, a.id)); return a && a.id; });
        if (id) { const v = await p.evaluate(() => window.AB.st.log.length); await p.click(`#aktionen [data-a="${id}"]`); check(await p.evaluate((v) => window.AB.st.log.length > v, v), `${vp.width}px: Selbst-Aktion „${id}“ mit einem Tipp`); selbst = true; }
      }
      if (s === 'spieler') { if (!(await p.evaluate(() => window.AB.st.ende))) await p.evaluate(() => window.AB.auto()); }
      else await p.waitForTimeout(20);
    }
    check(geklickt, `${vp.width}px: mindestens eine Aktion per Antippen gespielt`);
    const ende = await p.evaluate(() => window.AB.st.ende);
    check(Boolean(ende), `${vp.width}px: Kampf endet (${ende})`);
    check(await p.isVisible('#ende') && /Sieg|Rückzug|behält/.test(await p.textContent('#ende h2')), `${vp.width}px: Endbildschirm`);
    if (process.env.SHOT_DIR && vp.width === 1280) await p.screenshot({ path: process.env.SHOT_DIR + '/ende-1280.png' });
    await p.click('#neu');
    check(await p.evaluate(() => !window.AB.st.ende && window.AB.st.runde === 1), `${vp.width}px: Noch einmal (gleiche Gruppe)`);
    if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + `/kampf-${vp.width}.png`, fullPage: true });
    // bis zum Ende und dann Gruppe ändern
    for (let i = 0; i < 400; i++) { const s = await p.evaluate(() => window.AB.st.ende ? 'ende' : window.AB.R.aktiv(window.AB.st).seite); if (s === 'ende') break; if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(20); }
    await p.click('#gruppe');
    check(await p.isVisible('#lobby') && (await p.$$('.fkarte.an')).length === 5, `${vp.width}px: Gruppe ändern behält die Auswahl`);
    check(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${vp.width}px: kein seitliches Scrollen`);
    check(kaputt.length === 0, `${vp.width}px: alle Dateien geladen` + (kaputt.length ? ': ' + kaputt.join(', ') : ''));
  }
  check(errs.length === 0, 'keine Konsolenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close();
  console.log(ok ? '\nALLE PRÜFUNGEN BESTANDEN' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
