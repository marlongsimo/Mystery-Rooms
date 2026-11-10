/*
 * Abenteuer – Tablet als Spieltisch, Handys als Charakterbogen, gegen die echte Datenbank (Kennung „abenteuer“).
 * Tisch eröffnet (QR, Code) → zwei Handys treten bei, wählen Figuren aus den 15 (eine schon in der Gruppe, eine neu
 * dazu; Doppelwahl gesperrt) → Sicherheit: fremde Einträge („wahl:“ eines anderen, gefälschtes „spiel“) werden ignoriert →
 * Kampf: Bewegen am Tisch, Aktion + Ziel + Würfeln am Handy, Zug beenden am Handy, nur Figuren der Handys →
 * Handy und Tisch neu laden mitten im Kampf → Kampf bis zum Ende → Tisch beendet, Handys werden getrennt.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-abenteuer.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const Q = process.env.LIVESLUG ? '&liveslug=' + process.env.LIVESLUG : '';
const QH = process.env.LIVESLUG ? '?liveslug=' + process.env.LIVESLUG : '';
const SHOT = process.env.SHOT_DIR;
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };

  const einstieg = async (p, modus) => {
    await p.click('#titel-start');
    await p.waitForSelector('#einleitung:not([hidden])');
    for (let i = 0; i < 3; i++) await p.click('#einl-weiter');
    for (let i = 0; i < 5; i++) await p.click('#kodex-weiter');
    await p.click(modus === 'live' ? '#live' : '#start');
  };
  const nimm = async (p, fid) => { await p.click(`[data-fid="${fid}"]`); await p.click('#f-waehlen'); };
  const page = async (vp, name) => { const ctx = await b.newContext({ viewport: vp, hasTouch: vp.width < 500 }); const p = await ctx.newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };

  // Tisch
  const T = await page({ width: 1024, height: 768 }, 'Tisch');
  await T.goto(BASE + '/abenteuer/index.html?seed=42&schnell' + Q);
  await T.evaluate(() => localStorage.clear()); await T.reload();
  await einstieg(T, 'live');
  check(await until(T, () => Boolean(document.querySelector('.beitritt .code'))), 'Tisch: Sitzung eröffnet, Gruppenwahl mit Code');
  const code = (await T.textContent('.beitritt .code')).trim();
  check(/^ABEN-|^KRIM-/.test(code) && await T.$('.beitritt .qr svg') !== null, `Tisch: QR-Code für ${code}`);
  check((await T.$$('.fkarte')).length === 15, 'Tisch: 15 Figuren zur Wahl');

  // Handys
  const A = await page({ width: 390, height: 844 }, 'Anna'), Bn = await page({ width: 390, height: 844 }, 'Ben'), C = await page({ width: 390, height: 844 }, 'Cara');
  for (const [P, n] of [[A, 'Anna'], [Bn, 'Ben'], [C, 'Cara']]) {
    await P.goto(BASE + '/abenteuer/handy.html' + QH + '#' + code);
    await P.evaluate(() => localStorage.clear());
    await P.goto(BASE + '/abenteuer/handy.html' + QH + '#' + code);
    check((await P.inputValue('#code')) === code, `${n}: Code aus dem Link vorausgefüllt`);
    await P.fill('#name', n); await P.click('#rein');
    check(await until(P, () => document.querySelectorAll('.fkarte').length === 15), `${n}: verbunden, 15 Figuren zur Wahl`);
  }
  if (SHOT) await A.screenshot({ path: SHOT + '/live-handy-wahl.png', fullPage: true });
  await A.click('[data-fid="schildwaechter"]'); await A.click('#f-spielen');
  check(await until(A, () => /Torvald/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Anna: Torvald gewählt, Charakterbogen offen');
  await until(Bn, () => /Anna/.test(document.querySelector('[data-fid="schildwaechter"]')?.textContent || ''));
  await Bn.click('[data-fid="schildwaechter"]');
  check(await until(Bn, () => document.querySelector('#f-spielen')?.disabled === true), 'Ben: Torvald ist für ihn gesperrt');
  await Bn.click('#f-zurueck'); await Bn.click('[data-fid="tiergefaehrte"]'); await Bn.click('#f-spielen');
  check(await until(Bn, () => /Faye/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Ben: Faye gewählt');
  check(await until(T, () => document.querySelectorAll('.fkarte.an').length === 2 && document.querySelector('#los').disabled && /noch 1/.test(document.querySelector('#lobby').textContent)), 'Tisch: nur die 2 gewählten Figuren in der Gruppe, Start gesperrt (mindestens 3)');
  await T.click('[data-fid="berserker"]');
  check(await T.evaluate(() => !document.querySelector('#f-waehlen') && document.querySelectorAll('.fkarte.an').length === 2), 'Tisch: Mit Handys kann der Tisch keine Figuren dazunehmen');
  await C.click('[data-fid="gelehrter"]'); await C.click('#f-spielen');
  check(await until(C, () => /Lyra/.test(document.querySelector('.bogen h1')?.textContent || '')), 'Cara: Lyra gewählt');
  check(await until(T, () => { const t = document.querySelector('.fkarten').textContent; return /Anna/.test(t) && /Ben/.test(t) && /Cara/.test(t) && document.querySelectorAll('.fkarte.an').length === 3 && !document.querySelector('#los').disabled; }), 'Tisch: Gruppe = genau die 3 Figuren der Handys, Start frei');
  if (SHOT) await T.screenshot({ path: SHOT + '/live-lobby.png', fullPage: true });

  // Sicherheit innerhalb der Sitzung
  const annaId = await A.evaluate(() => window.ABH.H.client.user.id);
  await Bn.evaluate((id) => window.ABH.H.client.writeOwn('wahl:' + id, { fid: null, at: Date.now() }), annaId);
  await Bn.evaluate(() => window.ABH.H.client.writeOwn('spiel', { phase: 'kampf', gefaelscht: true, besitz: {}, gruppe: [] }));
  await T.waitForTimeout(2500);
  check(await T.evaluate((id) => window.AB.LIVE.besitz.schildwaechter === id, annaId), 'Sicherheit: Ben kann Annas Figurenwahl nicht ändern');
  check(await A.evaluate(() => !window.ABH.H.spiel.gefaelscht && /Torvald/.test(document.querySelector('.bogen h1').textContent)), 'Sicherheit: Ein gefälschter Spielstand von Ben wird von Anna ignoriert');

  // Bogen: Fähigkeiten und Rucksack
  await A.click('[data-tab="faehig"]');
  const fae = await A.textContent('.tabinhalt');
  check(/Langschwert/.test(fae) && /Angriff \+5/.test(fae) && /Stärke 16/.test(fae) && /Schutzhaltung/.test(fae) && /Bollwerk/.test(fae) && /ab Stufe 3/.test(fae), 'Anna: Fähigkeiten mit Angriffsbonus, Werten, Passiven und gesperrter Stufe-3-Fähigkeit');
  await A.click('[data-tab="rucksack"]');
  check(/Heiltrank ×1/.test(await A.textContent('.tabinhalt')), 'Anna: Rucksack mit Heiltrank');
  await A.click('[data-tab="zug"]');
  if (SHOT) await Bn.screenshot({ path: SHOT + '/live-handy-bogen.png', fullPage: true });

  await T.click('.uebung summary'); await T.click('#los');
  check(await until(A, () => window.ABH.H.spiel && window.ABH.H.spiel.phase === 'kampf'), 'Kampf beginnt, Anna bekommt den Stand');
  check(await T.evaluate(() => window.AB.st.figuren.some((f) => f.art === 'wolf') && window.AB.R.spielerFiguren(window.AB.st).map((f) => f.fid).sort().join() === 'gelehrter,schildwaechter,tiergefaehrte'), 'Im Kampf nur Torvald, Faye (mit Grau) und Lyra');

  // Kampf
  const handys = { schildwaechter: A, tiergefaehrte: Bn, gelehrter: C };
  let handyAktion = false, bewegt = false, neuGeladen = false, tischNeu = false, Tc = T;
  for (let i = 0; i < 400; i++) {
    const s = await Tc.evaluate(() => { const st = window.AB.st; if (!st) return null; const f = window.AB.R.aktiv(st); return { ende: st.ende, id: f.id, fid: f.fid, seite: f.seite }; });
    if (!s) { await Tc.waitForTimeout(300); continue; }
    if (s.ende) break;
    if (s.seite === 'gegner') { await Tc.waitForTimeout(150); continue; }
    const P = handys[s.fid];
    if (!P) { await Tc.evaluate(() => window.AB.auto()); continue; }
    if (!(await until(P, (id) => window.ABH.H.spiel && window.ABH.H.spiel.aktiv === id && /Du bist dran/.test(document.body.textContent), s.id, 15000))) { check(false, `Handy für ${s.fid} merkt nicht, dass es dran ist`); break; }
    // Bewegen am Tisch: Richtung nächster Gegner
    const ziel = await Tc.evaluate(() => { const st = window.AB.st, R = window.AB.R, f = R.aktiv(st); const g = st.figuren.filter((o) => o.seite === 'gegner' && o.tp > 0).sort((a, c) => R.abstand(f, a) - R.abstand(f, c))[0]; if (!g || R.abstand(f, g) <= 1) return null; let best = null; for (const [k, c] of R.bewegungsfelder(st, f)) { if (c === 'schritt') continue; const [x, y] = k.split(',').map(Number); const d = R.abstand({ x, y }, g); if (!best || d < best.d) best = { x, y, d }; } return best && (best.x !== f.x || best.y !== f.y) ? best : null; });
    if (ziel) { await Tc.click(`#karte .feld[data-x="${ziel.x}"][data-y="${ziel.y}"]`, { force: true }); bewegt = true; await until(P, () => window.ABH.H.spiel.zug.bewegung < 6, null, 10000); }
    // Aktion am Handy: Angriff mit Gegner-Ziel
    const opt = await P.evaluate(() => { const o = (window.ABH.H.spiel.optionen || []).find((o) => o.ok && o.ziele.some((z) => z.seite === 'gegner') && /schwert|bogen|befehl|funke/.test(o.id)); return o && o.id; });
    if (opt) {
      const vorher = await Tc.evaluate(() => window.AB.st.log.length);
      await P.click(`[data-opt="${opt}"]`);
      const zielBtn = await P.$('.ziel:not(.freund)'); if (zielBtn) await zielBtn.click();
      if (!handyAktion && SHOT) await P.screenshot({ path: SHOT + '/live-handy-zug.png', fullPage: true });
      await P.click('#wuerfeln');
      const ging = await until(Tc, (v) => window.AB.st.log.length > v, vorher, 15000);
      const fertig = await until(P, () => !window.ABH.H.warte, null, 15000);
      if (!handyAktion) { check(ging && fertig, `Handy: „${opt}“ mit Ziel gewürfelt, Tisch hat es ausgeführt`); if (SHOT) await Tc.screenshot({ path: SHOT + '/live-tisch.png' }); }
      handyAktion = handyAktion || (ging && fertig);
      if (await Tc.evaluate(() => Boolean(window.AB.st.ende))) break;
    }
    if (handyAktion && !neuGeladen) {
      await P.reload();
      neuGeladen = await until(P, () => Boolean(document.querySelector('.bogen')) && /Du bist dran/.test(document.body.textContent), null, 20000);
      check(neuGeladen, 'Handy neu geladen: wieder verbunden, Bogen und Zug noch da');
    }
    if (await P.$('#zugende')) await P.click('#zugende');
    const weiter = await until(Tc, (id) => window.AB.st.ende || window.AB.R.aktiv(window.AB.st).id !== id, s.id, 15000);
    if (!weiter) { check(false, 'Zug beenden vom Handy kommt nicht am Tisch an'); break; }
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
  check(await until(A, () => /Sieg!|Rückzug|behält/.test(document.body.textContent), null, 15000), 'Anna sieht das Ende auf dem Handy');
  const tpT = await Tc.evaluate(() => window.AB.st.figuren.find((f) => f.fid === 'tiergefaehrte').tp);
  check(await until(Bn, (tp) => new RegExp('^' + tp + ' / ').test(document.querySelector('.tpbalken span').textContent), tpT, 10000), `Ben: TP auf dem Handy wie am Tisch (${tpT})`);

  await Tc.click('#live-ende');
  check(await until(A, () => Boolean(document.querySelector('#rein')), null, 20000), 'Tisch beendet die Sitzung: Anna ist wieder beim Beitreten');
  check(await until(Bn, () => Boolean(document.querySelector('#rein')), null, 20000) && await until(C, () => Boolean(document.querySelector('#rein')), null, 20000), 'Ben und Cara ebenso');

  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nLIVE IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
