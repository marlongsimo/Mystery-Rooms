/*
 * SEKTOR 9 – Abstimmung im Rechenkern zu zweit (echte Supabase-Datenbank, zwei Browserprofile)
 * Ausgangslage: Nowaks Schaltung gelöst, beide im Rechenkern. Runde 1: Host ABSCHALTEN, Gast FORTSETZEN → ECHO meldet
 * Uneinigkeit, neue Runde. Runde 2: beide ABSCHALTEN → Ende A bei beiden, Auswertung nennt die Runden und wer zuerst
 * FORTSETZEN gewählt hat → Sitzung verlassen.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/mehrspieler-abstimmung.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const PRE = { flags: ['galerie', 'notstrom', 'tuer_b', 'tuer_c', 'tuer_d', 'schaltbuch', 'rz', 'tuer9', 'k3'], solved: ['handrad', 'galerie', 'notstrom', 'tuer_b', 'tuer_c', 'k1', 'rz', 'k3'] };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const H = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage(), G = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
  const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  [[H, 'Host'], [G, 'Gast']].forEach(([p, n]) => { p.setDefaultTimeout(60000); p.on('pageerror', (e) => errs.push(n + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(n + ' console: ' + m.text().slice(0, 200)); }); });
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(400); } return false; };
  const closeDlg = async (p) => { for (let i = 0; i < 3 && (await p.evaluate(() => document.querySelector('#dialog').open)); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const focus = (p) => p.evaluate(() => { const f = SEKTOR9.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async (p) => { for (let i = 0; i < 120; i++) { const f = await focus(p); if (f && f.arrived) { await p.waitForTimeout(250); return f; } await p.waitForTimeout(250); } return focus(p); };
  const click = async (p, id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); if (!pt) return false; await p.waitForTimeout(300); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(600); return true; };
  for (const p of [H, G]) { await p.goto(BASE + '/sektor-9/index.html?q=low'); await p.waitForTimeout(800); }
  await H.click('#mpEntry [data-mp="open"]').catch(() => {}); await H.fill('#mpEntry [data-mp-input="name"]', 'Alex'); await H.click('#mpEntry [data-mp="create"]');
  check(await until(H, () => Boolean(SEKTOR9.multiplayer.client.session)), 'Host: Sitzung erstellt');
  const code = await H.evaluate(() => SEKTOR9.multiplayer.client.session.room_code);
  await G.click('#mpEntry [data-mp="open"]').catch(() => {}); await G.fill('#mpEntry [data-mp-input="name"]', 'Bo'); await G.fill('#mpEntry [data-mp-input="code"]', code); await G.click('#mpEntry [data-mp="join"]');
  check(await until(H, () => SEKTOR9.multiplayer.client.players.length === 2), 'Gast beigetreten (' + code + ')');
  await H.click('#mpEntry [data-mp="start"]');
  check(await until(G, () => SEKTOR9.engine.inGame()) && await until(H, () => SEKTOR9.engine.inGame()), 'beide im Spiel');
  await H.waitForTimeout(2500); for (const p of [H, G]) await closeDlg(p);
  await H.evaluate((pre) => { SEKTOR9.engine.applyShared(pre); }, PRE);
  check(await until(G, () => SEKTOR9.engine.isSolved('k3')), 'Gast hat denselben Stand (Schaltung gelöst)');
  for (const p of [H, G]) await p.evaluate(() => SEKTOR9.engine.goHall('sektor9', 'kern', 0));
  await H.waitForTimeout(3500); for (const p of [H, G]) await closeDlg(p);
  const vote = async (p, id) => { await click(p, id); const lbl = await p.textContent('[data-confirm]'); await p.click('[data-confirm]'); await p.waitForTimeout(600); return lbl; };
  const echoes = (p) => p.evaluate(() => SEKTOR9.engine.state().echo.map((e) => e.text).join(' | '));
  // Runde 1: uneinig
  const l1 = await vote(H, 'n_a'); check(/Stimme: ABSCHALTEN/.test(l1), 'Host: Taste ABSCHALTEN gibt eine Stimme ab („' + l1.trim() + '“)');
  check(await until(G, () => /ALEX/.test(document.querySelector('#voteBox').textContent) && /ABSCHALTEN/.test(document.querySelector('#voteBox').textContent)), 'Gast sieht die Stimme des Hosts in der Anzeige');
  check(!(await H.evaluate(() => SEKTOR9.engine.has('ende'))), 'Eine Stimme allein beendet nichts');
  await vote(G, 'n_c');
  check(await until(H, () => SEKTOR9.engine.state().voteRound === 1) && await until(G, () => SEKTOR9.engine.state().voteRound === 1), 'Uneinigkeit → beide in Runde 2');
  check(/UNEINIGKEIT/.test(await echoes(H)) && /UNEINIGKEIT/.test(await echoes(G)), 'ECHO kommentiert die Uneinigkeit bei beiden');
  console.log('  ECHO:', (await echoes(G)).split(' | ').filter((x) => /UNEINIG/.test(x))[0]);
  await G.screenshot({ path: OUT + 's9mp-abstimmung.png' });
  check(!(await H.evaluate(() => SEKTOR9.engine.has('ende'))), 'Noch kein Ende');
  // Runde 2: einig
  await vote(G, 'n_a'); await vote(H, 'n_a');
  check(await until(H, () => document.querySelector('#endOv').classList.contains('show')) && await until(G, () => document.querySelector('#endOv').classList.contains('show')), 'Beide wählen ABSCHALTEN → Ende bei beiden');
  const tH = await H.textContent('#endOv'), tG = await G.textContent('#endOv');
  check(/ENDE A/.test(tH) && /ENDE A/.test(tG), 'Ende A bei Host und Gast');
  check(/Abstimmung: 2 Runden/.test(tG) && /Zuerst FORTSETZEN gewählt hat: BO/.test(tG), 'Auswertung: „2 Runden · zuerst FORTSETZEN: Bo“');
  await G.screenshot({ path: OUT + 's9mp-ende.png' });
  for (const p of [G, H]) { await p.evaluate(() => SEKTOR9.multiplayer.lobby.leave()); await p.waitForTimeout(1500); }
  check(!(await H.evaluate(() => SEKTOR9.multiplayer.client.session)), 'Sitzung beendet');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbstimmung zu zweit in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
