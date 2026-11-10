/*
 * Abenteuer – Tablet als Spieltisch, Handys als Charakterbogen, gegen die echte Datenbank.
 * Tisch eröffnet (QR, Code) → zwei Handys treten bei, wählen Figuren (Doppelwahl gesperrt) →
 * Sicherheit: fremde Einträge („wahl:“ eines anderen, gefälschtes „spiel“) werden ignoriert →
 * Kampf: Bewegen am Tisch, Aktion + Ziel + Würfeln am Handy, Zug beenden am Handy, freie Figur am Tisch →
 * Handy und Tisch neu laden mitten im Kampf → Kampf bis zum Ende → Tisch beendet, Handys werden getrennt.
 * Aufruf: python3 -m http.server 8765 &  ·  LIVESLUG=krimidinner node abenteuer/tests/live-abenteuer.test.js
 * (ohne LIVESLUG wird die Kennung „abenteuer“ verwendet; sie muss in game_catalog eingetragen sein)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const Q = process.env.LIVESLUG ? '&liveslug=' + process.env.LIVESLUG : '';
const QH = process.env.LIVESLUG ? '?liveslug=' + process.env.LIVESLUG : '';
const SHOT = process.env.SHOT_DIR;
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (vp, name) => { const ctx = await b.newContext({ viewport: vp, hasTouch: vp.width < 500 }); const p = await ctx.newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };

  // Tisch
  const T = await page({ width: 1024, height: 768 }, 'Tisch');
  await T.goto(BASE + '/abenteuer/index.html?seed=42&schnell' + Q);
  await T.click('#live');
  check(await until(T, () => Boolean(document.querySelector('.beitritt .code'))), 'Tisch: Sitzung eröffnet, Lobby mit Code');
  const code = (await T.textContent('.beitritt .code')).trim();
  check(await T.$('.beitritt .qr svg') !== null, `Tisch: QR-Code für ${code}`);
  if (SHOT) await T.screenshot({ path: SHOT + '/live-lobby.png' });

  // Handys
  const A = await page({ width: 390, height: 844 }, 'Anna'), Bn = await page({ width: 390, height: 844 }, 'Ben');
  for (const [P, n] of [[A, 'Anna'], [Bn, 'Ben']]) {
    await P.goto(BASE + '/abenteuer/handy.html' + QH + '#' + code);
    check((await P.inputValue('#code')) === code, `${n}: Code aus dem Link vorausgefüllt`);
    await P.fill('#name', n); await P.click('#rein');
    check(await until(P, () => /Wähle deine Figur/.test(document.body.textContent)), `${n}: verbunden, Figurenwahl sichtbar`);
  }
  await A.click('[data-fig="f0"]');
  check(await until(A, () => /Schildwächter/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Anna: Schildwächter gewählt, Charakterbogen offen');
  check(await until(Bn, () => document.querySelector('[data-fig="f0"]')?.disabled === true), 'Ben: Schildwächter ist für ihn gesperrt');
  await Bn.click('[data-fig="f2"]');
  check(await until(Bn, () => /Lichtbringer/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Ben: Lichtbringer gewählt');
  check(await until(T, () => /Anna/.test(document.querySelector('.figwahl').textContent) && /Ben/.test(document.querySelector('.figwahl').textContent) && /steuert der Tisch/.test(document.querySelector('.figwahl').textContent)), 'Tisch: Lobby zeigt Anna, Ben und eine Tisch-Figur');

  // Sicherheit innerhalb der Sitzung
  const annaId = await A.evaluate(() => window.ABH.H.client.user.id);
  await Bn.evaluate((id) => window.ABH.H.client.writeOwn('wahl:' + id, { fig: null, at: Date.now() }), annaId);
  await Bn.evaluate(() => window.ABH.H.client.writeOwn('spiel', { phase: 'kampf', gefaelscht: true, besitz: {}, liste: [] }));
  await T.waitForTimeout(2500);
  check(await T.evaluate((id) => window.AB.LIVE.besitz.f0 === id, annaId), 'Sicherheit: Ben kann Annas Figurenwahl nicht ändern');
  check(await A.evaluate(() => !window.ABH.H.spiel.gefaelscht && /Schildwächter/.test(document.querySelector('.bogen h1').textContent)), 'Sicherheit: Ein gefälschter Spielstand von Ben wird von Anna ignoriert');

  // Bogen: Fähigkeiten und Rucksack
  await A.click('[data-tab="faehig"]');
  check(/Langschwert/.test(await A.textContent('.faehig')) && /Angriff \+5/.test(await A.textContent('.faehig')) && /Stärke 16/.test(await A.textContent('.attr')), 'Anna: Fähigkeiten mit Angriffsbonus und Werten');
  await A.click('[data-tab="rucksack"]');
  check(/Heiltrank ×1/.test(await A.textContent('.faehig')) && /Seil/.test(await A.textContent('.faehig')), 'Anna: Rucksack mit Heiltrank und Seil');
  await A.click('[data-tab="zug"]');

  await T.click('#los');
  check(await until(A, () => window.ABH.H.spiel && window.ABH.H.spiel.phase === 'kampf'), 'Kampf beginnt, Anna bekommt den Stand');

  // Kampf
  const handys = { f0: A, f2: Bn };
  let handyAktion = false, bewegt = false, neuGeladen = false, tischNeu = false, Tc = T;
  for (let i = 0; i < 400; i++) {
    const s = await Tc.evaluate(() => { const st = window.AB.st; if (!st) return null; const f = window.AB.R.aktiv(st); return { ende: st.ende, id: f.id, seite: f.seite, runde: st.runde }; });
    if (!s) { await Tc.waitForTimeout(300); continue; }
    if (s.ende) break;
    if (s.seite === 'gegner') { await Tc.waitForTimeout(150); continue; }
    const P = handys[s.id];
    if (!P) { await Tc.evaluate(() => window.AB.auto()); continue; }
    // Handy ist dran: warten, bis es das weiß
    if (!(await until(P, (id) => window.ABH.H.spiel && window.ABH.H.spiel.aktiv === id && /Du bist dran/.test(document.body.textContent), s.id, 15000))) { check(false, `Handy für ${s.id} merkt nicht, dass es dran ist`); break; }
    // Bewegen am Tisch: Richtung nächster Gegner
    const ziel = await Tc.evaluate(() => { const st = window.AB.st, R = window.AB.R, f = R.aktiv(st); const g = st.figuren.filter((o) => o.seite === 'gegner' && o.tp > 0).sort((a, c) => R.abstand(f, a) - R.abstand(f, c))[0]; if (!g || R.abstand(f, g) <= 1) return null; let best = null; for (const [k] of R.erreichbar(st, f, st.zug.bewegung)) { const [x, y] = k.split(',').map(Number); const d = R.abstand({ x, y }, g); if (!best || d < best.d) best = { x, y, d }; } return best && (best.x !== f.x || best.y !== f.y) ? best : null; });
    if (ziel) { await Tc.click(`#karte .feld[data-x="${ziel.x}"][data-y="${ziel.y}"]`, { force: true }); bewegt = true; }
    if (ziel) await until(P, (b) => window.ABH.H.spiel.zug.bewegung < b, 6, 10000);
    // Aktion am Handy
    const opt = await P.evaluate(() => { const o = (window.ABH.H.spiel.optionen || []).find((o) => o.ok && o.ziele.length && o.id !== 'heiltrank' && o.id !== 'zweiter_atem'); return o && o.id; });
    if (opt) {
      const vorher = await Tc.evaluate(() => window.AB.st.log.length);
      await P.click(`[data-opt="${opt}"]`);
      const zielBtn = await P.$('[data-ziel]'); if (zielBtn) await zielBtn.click();
      if (!handyAktion && SHOT) await P.screenshot({ path: SHOT + '/live-handy-zug.png', fullPage: true });
      await P.click('#wuerfeln');
      const ging = await until(Tc, (v) => window.AB.st.log.length > v, vorher, 15000);
      const ergebnis = await until(P, () => Boolean(document.querySelector('.ergebnis')) && !window.ABH.H.warte, null, 15000);
      if (!handyAktion) { check(ging && ergebnis, `Handy: „${opt}“ mit Ziel gewürfelt, Tisch hat es ausgeführt, Ergebnis auf dem Handy`); if (SHOT) await P.screenshot({ path: SHOT + '/live-handy-ergebnis.png', fullPage: true }); if (SHOT) await Tc.screenshot({ path: SHOT + '/live-tisch.png' }); }
      handyAktion = handyAktion || (ging && ergebnis);
      if (await Tc.evaluate(() => Boolean(window.AB.st.ende))) break;
    }
    // Handy einmal mitten im Kampf neu laden
    if (handyAktion && !neuGeladen) {
      await P.reload();
      neuGeladen = await until(P, () => Boolean(document.querySelector('.bogen')) && /Du bist dran/.test(document.body.textContent), null, 20000);
      check(neuGeladen, 'Handy neu geladen: wieder verbunden, Bogen und Zug noch da');
    }
    await P.click('#zugende');
    const weiter = await until(Tc, (id) => window.AB.st.ende || window.AB.R.aktiv(window.AB.st).id !== id, s.id, 15000);
    if (!weiter) { check(false, 'Zug beenden vom Handy kommt nicht am Tisch an'); break; }
    // Tisch einmal neu laden (nach einem Handy-Zug)
    if (neuGeladen && !tischNeu) {
      const vor = await Tc.evaluate(() => JSON.stringify(window.AB.R.speichern(window.AB.st).figuren.map((f) => [f.id, f.tp, f.x, f.y])));
      await Tc.reload();
      tischNeu = await until(Tc, () => Boolean(window.AB.st) && !document.querySelector('#spiel').hidden, null, 20000);
      const nach = await Tc.evaluate(() => JSON.stringify(window.AB.R.speichern(window.AB.st).figuren.map((f) => [f.id, f.tp, f.x, f.y])));
      check(tischNeu && vor === nach, 'Tisch neu geladen: Sitzung und Kampf wiederhergestellt');
    }
  }
  check(bewegt, 'Figuren der Handys wurden am Tisch bewegt');
  check(handyAktion, 'mindestens eine Aktion vom Handy ausgeführt');
  const ende = await Tc.evaluate(() => window.AB.st && window.AB.st.ende);
  check(Boolean(ende), `Kampf endet (${ende})`);
  check(await until(A, () => /Sieg!|Rückzug/.test(document.body.textContent), null, 15000), 'Anna sieht das Ende auf dem Handy');
  // TP auf dem Handy = TP am Tisch
  const tpT = await Tc.evaluate(() => window.AB.R.fig(window.AB.st, 'f2').tp);
  check(await until(Bn, (tp) => new RegExp('^' + tp + ' / ').test(document.querySelector('.tpbalken span').textContent), tpT, 10000), `Ben: TP auf dem Handy wie am Tisch (${tpT})`);

  // Beenden
  await Tc.click('#live-ende');
  check(await until(A, () => Boolean(document.querySelector('#rein')), null, 20000), 'Tisch beendet die Sitzung: Anna ist wieder beim Beitreten');
  check(await until(Bn, () => Boolean(document.querySelector('#rein')), null, 20000), 'Ben ebenso');

  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nLIVE IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
