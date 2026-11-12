/*
 * Hochwacht-Prototyp (Eskorte): Regeln ohne Browser und ein ganzer Kampf am Pass im Browser.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/hochwacht.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
const R = require('../js/regeln.js'), D = require('../daten/hochwacht.js'), P = D.KARTEN.PASS;
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const neu = (seed, extra = {}) => R.neuesSpiel(seed, Object.assign({ figuren: ['schildwaechter', 'lichtbringer', 'kopfgeldjaeger'], stufe: 1, begegnung: 'pass', karte: P, keinAnfuehrer: true,
    begleiter: { name: 'Sera Venn', tp: 14, start: P.start.begleiter, route: P.route } }, extra));
  // 1. Aufbau
  let st = neu(1); const sera = () => R.begleiterVon(st);
  check(sera() && sera().seite === 'spieler' && !st.reihe.includes(sera().id) && !R.spielerFiguren(st).includes(sera()), 'Sera ist eine eigene Figur auf Heldenseite, ohne eigenen Zug und nicht als Held gezählt');
  // 2. Jäger zielen auf Sera
  let visier = false; for (let s = 0; s < 30 && !visier; s++) { st = neu(100 + s); let k = 0; while (!st.ende && k++ < 400) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.autoZug(st); if (st.log.some((l) => /nimmt Sera Venn ins Visier/.test(l.t))) { visier = true; break; } } }
  check(visier, 'Ein Jäger nimmt Sera ins Visier (Meldung am Tisch)');
  // 3. Abfangen: ein Held direkt neben Sera mit freier Reaktion
  st = neu(2); const s3 = sera(), h = R.spielerFiguren(st)[0], j = R.gegnerFiguren(st).find((g) => g.art === 'siegeljaeger');
  h.x = s3.x + 1; h.y = s3.y; h.reaktion = 1; j.x = s3.x; j.y = s3.y - 1; st.reihe = [j.id].concat(st.reihe.filter((id) => id !== j.id)); st.am = 0;
  const vorher = s3.tp; R.gegnerZug(st);
  check(st.log.some((l) => /wirft sich vor Sera Venn/.test(l.t)) && s3.tp === vorher && h.reaktion === 0, 'Abfangen: Der Held daneben fängt den Angriff auf Sera ab (Reaktion verbraucht)');
  // 4. Sera fällt → Stabilisieren hilft; ohne Hilfe wird sie nach dem Rettungsfenster verschleppt
  st = neu(3); sera().tp = 1; R.schaden ? null : null;
  const fallen = () => { const s = sera(); s.tp = 0; s.z.liegend = true; st.eskorte.unten = st.runde; };
  fallen(); const held = R.spielerFiguren(st)[0]; held.x = sera().x + 1; held.y = sera().y;
  st.reihe = [held.id].concat(st.reihe.filter((id) => id !== held.id)); st.am = 0; st.zug = Object.assign({}, st.zug, { figur: held.id, aktion: true });
  R.handeln(st, 'stabilisieren', sera().id);
  check(sera().tp >= 1 || sera().stabil, 'Stabilisieren: Sera steht wieder (Normal: mit 1 TP)');
  st = neu(4); fallen(); st.runde += 2; R.begleiterPhase(st);
  check(st.ende === 'gefangen', 'Ohne Hilfe bis zum Ende der nächsten Runde: Sera wird verschleppt (Kampfende „gefangen“)');
  // 5. Ausgang erreicht → Sieg
  st = neu(5); const sz = sera(); sz.x = 10; sz.y = 4; st.eskorte.schritt = 3; for (const g of R.gegnerFiguren(st)) { g.x = 9; g.y = 1; } R.gegnerFiguren(st).forEach((g, i) => { g.x = [8, 9, 10][i % 3]; g.y = i < 3 ? 1 : 7; });
  R.spielerFiguren(st)[0].x = 9; R.spielerFiguren(st)[0].y = 4; R.begleiterPhase(st);
  check(st.ende === 'sieg' && st.log.some((l) => /erreicht den Ausgang/.test(l.t)), 'Sera erreicht den Ausgang: Sieg, auch wenn noch Gegner stehen');
  // 6. Speichern/Laden
  st = neu(6); for (let k = 0; k < 15; k++) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.autoZug(st); }
  const st2 = R.laden(JSON.parse(JSON.stringify(R.speichern(st))));
  check(JSON.stringify(st2.eskorte) === JSON.stringify(st.eskorte) && R.begleiterVon(st2).tp === R.begleiterVon(st).tp && R.begleiterVon(st2).x === R.begleiterVon(st).x, 'Speichern/Laden: Seras LP, Position und Wegfortschritt bleiben erhalten');
  // 7. Andere Abenteuer unberührt: Moor-Kampf ohne Begleiterin
  const m = R.neuesSpiel(7, { figuren: ['schildwaechter', 'lichtbringer'], stufe: 1, begegnung: 'moor_rand', karte: require('../daten/rabenmoor.js').KARTEN.BOHLENWEG });
  check(!R.begleiterVon(m) && !m.eskorte, 'Moor-Kampf: keine Begleiterin, keine Eskorte');

  // Durchlauf aller bisherigen Szenen (Akt I inkl. Rettungsweg)
  try { const out = require('child_process').execFileSync('node', [__dirname + '/../tools/durchlauf-hochwacht.js', '120'], { encoding: 'utf8' }); check(/Alle Szenen erreicht/.test(out), 'Akt I–III: 120 Durchläufe ohne Fehler, alle Szenen und alle Enden erreicht (auch die Rettungen)'); }
  catch (e) { check(false, 'Durchlauf: ' + (e.stdout || e.message).slice(0, 300)); }
  // 8. Browser
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.setDefaultTimeout(20000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  try {
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload();
    await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    check(!(await p.$('[data-neu-abenteuer="hochwacht"]')), 'Ohne ?entwurf ist Hochwacht im Hub nicht zu sehen');
    await p.goto(BASE + '/abenteuer/index.html?schnell&testlauf&entwurf'); await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    await p.click('[data-neu-abenteuer="hochwacht"]');
    await p.waitForSelector('#kodex:not([hidden])'); for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
    await p.click('#start');
    const zu = async (fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
    for (const f of ['schildwaechter', 'lichtbringer', 'kopfgeldjaeger', 'elementarist']) { await zu(f); await p.click(`[data-fid="${f}"]`); await p.click('#f-waehlen'); }
    await p.click('#abenteuer-los'); await p.click('#einl-skip');
    // Akt I bis zum Kampf: Vorgeschichte → Wegstation → Weg hinauf (Probe) → Kampf
    for (let i = 0; i < 40 && !(await p.$('#sz-kampf')); i++) {
      await p.waitForTimeout(250);
      const k = async (sel) => { const e = await p.$(sel); if (e && await e.isEnabled()) { await e.click(); return true; } return false; };
      if (await k('[data-opt="nicht"]') || await k('[data-opt="los"]') || await k('[data-wer]') || await k('[data-wurf]') || await k('#sz-weiter')) continue;
    }
    await p.click('#sz-kampf');
    check(await p.evaluate(() => Boolean(document.querySelector('#karte .ausgang')) && window.AB.st.figuren.some((f) => f.art === 'begleiter')), 'Kampf am Pass: Sera, Weg und Ausgang auf der Karte');
    for (let i = 0; i < 3000; i++) {
      if (await p.isVisible('#ende') && await p.$('#weiter-abenteuer')) { await p.click('#weiter-abenteuer'); break; }
      const s = await p.evaluate(() => window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x');
      if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(30);
    }
    const ende = await p.evaluate(() => window.ABT.A() && window.ABT.A().szene);
    check(['wachmann', 'verschleppt', 'kampf_pass'].includes(ende), `Kampf zu Ende, die Geschichte geht weiter: „${ende}“ (bei Rückzug: derselbe Kampf neu)`);
  } catch (e) { check(false, 'Browser: ' + e.message); }
  check(!errs.length, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nHOCHWACHT IN ORDNUNG' : '\nHOCHWACHT FEHLER'); process.exit(ok ? 0 : 1);
})();
