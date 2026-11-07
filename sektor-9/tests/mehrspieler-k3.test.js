/*
 * SEKTOR 9 – Nowaks Abschaltung zu zweit (echte Supabase-Datenbank, zwei Browserprofile)
 * Ausgangslage: Team steht vor Abschnitt 4 (Stand wird beim Host eingespielt und über die Sitzung geteilt).
 * Host in der Maschinenhalle legt die drei Hebel um → Relais läuft bei beiden → Gast im Leitstand legt SPEISUNG um
 * → beide sehen „Nowaks Schaltung“ gelöst → Sitzung verlassen.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/mehrspieler-k3.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const PRE = { flags: ['galerie', 'notstrom', 'tuer_b', 'tuer_c', 'tuer_d', 'schaltbuch', 'rz', 'tuer9'], solved: ['handrad', 'galerie', 'notstrom', 'tuer_b', 'tuer_c', 'k1', 'rz'] };
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
  // Ausgangslage einspielen (wie nach Abschnitt 3) – über den gemeinsamen Stand auch beim Gast
  await H.evaluate((pre) => { SEKTOR9.engine.applyShared(pre); }, PRE);
  check(await until(G, () => SEKTOR9.engine.isSolved('k1') && SEKTOR9.engine.has('schaltbuch')), 'Gast hat denselben Stand (Sektor D offen, Schaltbuch bekannt)');
  await H.evaluate(() => SEKTOR9.engine.goHall('sicherheit', 'maschinen', 2)); await G.evaluate(() => SEKTOR9.engine.goHall('kommando', 'leitstand', 2));
  await H.waitForTimeout(3500); await G.waitForTimeout(3500); for (const p of [H, G]) await closeDlg(p);
  check(await until(H, () => /Kommando-Halle · Leitstand/.test(document.querySelector('#teamBox').textContent)), 'Host sieht: Bo im Leitstand');
  // Host: Hebel
  await click(H, 'd_pult'); const f = await settle(H); check(Boolean(f) && f.id === 'd_pult', 'Host: Schaltpult in der Nahansicht');
  for (const n of ['kern2', 'kern1', 'netz']) { const h = (await focus(H)).parts.find((x) => x.name === 'hebel_' + n); await H.mouse.click(h.x, h.y); await H.waitForTimeout(300); }
  check(await until(H, () => SEKTOR9.engine.state().relay.d > 0), 'Host: Relais D gesetzt');
  check(await until(G, () => SEKTOR9.engine.state().relay.d > 0 && document.querySelector('#relayBox').classList.contains('show'), null, 20000), 'Gast: Relais-Anzeige erscheint („' + (await G.textContent('#relayBox')) + '“)');
  await G.screenshot({ path: OUT + 's9mp-relais.png' });
  // Gast: Schalter im Leitstand
  await click(G, 'k_speisung'); await G.waitForTimeout(1200);
  check(await until(G, () => SEKTOR9.engine.isSolved('k3'), null, 20000), 'Gast: SPEISUNG umgelegt → Nowaks Schaltung gelöst');
  check(await until(H, () => SEKTOR9.engine.isSolved('k3'), null, 30000), 'Host: Schaltung auch bei ihm gelöst');
  console.log('  Host-Meldung:', (await H.evaluate(() => document.querySelector('.mp-toast').textContent)).slice(0, 80));
  for (const p of [G, H]) { await p.evaluate(() => SEKTOR9.multiplayer.lobby.leave()); await p.waitForTimeout(1500); }
  check(!(await H.evaluate(() => SEKTOR9.multiplayer.client.session)), 'Sitzung beendet');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nAbschaltung zu zweit in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
