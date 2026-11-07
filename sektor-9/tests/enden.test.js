/*
 * SEKTOR 9 – Die drei Enden und ihre Bedingungen (Rechenkern, Spielstand vor der Entscheidung)
 * Ohne Nowaks Schaltung: ABSCHALTEN und SENDEN gesperrt, FORTSETZEN geht → Ende C.
 * Mit Schaltung, ohne alle Bänder: ABSCHALTEN geht → Ende A, SENDEN bleibt gesperrt. (Ende B: tests/abschnitt4.test.js)
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/enden.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const base = (extraFlags, extraSolved) => ({ v: 1, started: true, finished: false, hall: 'sektor9', station: 'kern', view: 0,
  flags: ['briefed', 'entered_kommando', 'entered_personal', 'entered_forschung', 'entered_sicherheit', 'entered_sektor9', 'galerie', 'notstrom', 'tuer_b', 'buero', 'kaefig', 'tunnel_ab', 'tuer_c', 'beobachtung', 'schleuse', 'tuer_d', 'schaltbuch', 'rz', 'tuer9', ...extraFlags],
  solved: ['handrad', 'galerie', 'notstrom', 'band1', 'kassette', 'tuer_b', 'buero', 'kaefig', 'spind_nowak', 'tunnel_ab', 'band2', 'tuer_c', 'beobachtung', 'schleuse', 'k1', 'rz', ...extraSolved],
  inventory: ['ausweis_ostrowski'], docs: ['auftrag'], newDocs: [], seen: [], hints: {}, echo: [{ t: '02:00', text: 'WILLKOMMEN IN SEKTOR 9.' }], playMs: 7200000, sound: false, teamDocs: [], gone: { items: [] }, relay: { d: 0, a: 0 } });
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  async function open(save) {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } }); const p = await ctx.newPage(); p.setDefaultTimeout(60000);
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript((s) => { if (!sessionStorage.getItem('s9')) { localStorage.setItem('sektor9_save_v1', JSON.stringify(s)); sessionStorage.setItem('s9', '1'); } }, save);
    await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(500); await p.click('#startBtn'); await p.waitForTimeout(3000);
    return p;
  }
  const dlgText = (p) => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgBody').textContent : ''));
  const closeDlg = async (p) => { for (let i = 0; i < 3 && (await p.evaluate(() => document.querySelector('#dialog').open)); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const click = async (p, id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); await p.waitForTimeout(300); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(600); };
  const endShown = async (p) => { for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#endOv').classList.contains('show'))); i++) await p.waitForTimeout(250); return p.textContent('#endOv'); };

  // ohne Schaltung
  const p1 = await open(base([], []));
  await p1.screenshot({ path: OUT + 's9e-pult.png' });
  await click(p1, 'n_a'); check(/Nowaks Schaltung/.test(await dlgText(p1)) && !(await p1.$('[data-confirm]')), 'Ohne Schaltung: ABSCHALTEN gesperrt'); await closeDlg(p1);
  await click(p1, 'n_b'); check(/QUELLEN UNVOLLSTÄNDIG/.test(await dlgText(p1)), 'Ohne Schaltung: SENDEN gesperrt'); await closeDlg(p1);
  await click(p1, 'n_c'); check(Boolean(await p1.$('[data-confirm]')), 'FORTSETZEN → Bestätigung');
  await p1.click('[data-confirm]'); let t = await endShown(p1);
  check(/ENDE C/.test(t) && /WILLKOMMEN ZURÜCK/.test(t) && /Ihr habt mich nicht gefragt/.test(t), 'Ende C mit Auswertung (ohne Hinweise: „Ihr habt mich nicht gefragt …“)');
  await p1.screenshot({ path: OUT + 's9e-ende-c.png' });
  check(await p1.evaluate(() => SEKTOR9.engine.state().finished), 'Spiel beendet');
  // mit Schaltung, nicht alle Bänder
  const p2 = await open(base(['k3'], ['k3']));
  await click(p2, 'n_b'); check(/QUELLEN UNVOLLSTÄNDIG/.test(await dlgText(p2)), 'Mit Schaltung, ohne alle sechs Bänder: SENDEN gesperrt'); await closeDlg(p2);
  await click(p2, 'n_a'); check(Boolean(await p2.$('[data-confirm]')), 'Mit Schaltung: ABSCHALTEN → Bestätigung');
  await p2.click('[data-confirm]'); t = await endShown(p2);
  check(/ENDE A/.test(t) && /KEINE AKTIVEN SITZUNGEN/.test(t), 'Ende A: „ECHO BEENDET. KEINE AKTIVEN SITZUNGEN.“');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nEnden in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
