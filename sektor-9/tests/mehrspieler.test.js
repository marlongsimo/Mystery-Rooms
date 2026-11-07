/*
 * SEKTOR 9 – Gemeinsam spielen (echte Supabase-Datenbank der Plattform, zwei getrennte Browserprofile)
 * Host erstellt Sitzung → Gast tritt mit Code bei → beide lesen den Auftrag → Host startet →
 * Gast öffnet das Handrad → Host sieht die Tür offen und fährt ins Kommando · Positionen und Helmlampe ·
 * Funk in beide Richtungen · Fund nur bei sich, dann ins Team-Archiv teilen · Neuladen behält den Stand · Sitzung verlassen.
 * Aufruf: python3 -m http.server 8765 &  ·  node sektor-9/tests/mehrspieler.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const shot = (p, name) => (process.env.SHOTS ? p.screenshot({ path: OUT + 's9mp-' + name + '.png', timeout: 90000 }) : Promise.resolve());
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctxH = await b.newContext({ viewport: { width: 1000, height: 700 } }), ctxG = await b.newContext({ viewport: { width: 1000, height: 700 } });
  const H = await ctxH.newPage(), G = await ctxG.newPage(); const errs = []; let ok = true;
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  [[H, 'Host'], [G, 'Gast']].forEach(([p, n]) => { p.setDefaultTimeout(60000); p.on('pageerror', (e) => errs.push(n + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(n + ' console: ' + m.text().slice(0, 200)); }); });
  const st = (p) => p.evaluate(() => SEKTOR9.engine.state());
  const dlg = (p) => p.evaluate(() => (document.querySelector('#dialog').open ? document.querySelector('#dlgTitle').textContent : null));
  const closeDlg = async (p) => { for (let i = 0; i < 3 && (await dlg(p)); i++) { await p.click('#closeDialog'); await p.waitForTimeout(300); } };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(400); } return false; };
  const focus = (p) => p.evaluate(() => { const f = SEKTOR9.view3d.focusInfo(); return f && !f.leaving ? f : null; });
  const settle = async (p) => { for (let i = 0; i < 120; i++) { const f = await focus(p); if (f && f.arrived) { await p.waitForTimeout(250); return f; } await p.waitForTimeout(250); } return focus(p); };
  const click = async (p, id) => { const pt = await p.evaluate((id) => SEKTOR9.view3d.aimAt(id), id); if (!pt) return false; await p.waitForTimeout(200); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(500); return true; };

  for (const p of [H, G]) { await p.goto(BASE + '/sektor-9/index.html?q=low&mp=1'); await p.waitForTimeout(800); }
  check(Boolean(await H.$('#mpEntry .mp-root, #mpEntry *')), 'Lobby auf dem Titel');
  // Host erstellt
  await H.click('#mpEntry [data-mp="open"]').catch(() => {}); await H.waitForTimeout(300);
  await H.fill('#mpEntry [data-mp-input="name"]', 'Alex');
  await H.click('#mpEntry [data-mp="create"]');
  const gotCode = await until(H, () => /[A-Z0-9]{4}-?[A-Z0-9]{4,}/.test(document.querySelector('#mpEntry').textContent) && Boolean(window.SEKTOR9.multiplayer.client.session), null, 30000);
  const errText = await H.evaluate(() => (document.querySelector('#mpEntry .mp-status') || {}).textContent || '');
  check(gotCode, 'Host: Sitzung erstellt' + (gotCode ? '' : ` – Meldung: „${errText}“`));
  if (!gotCode) { console.log(errs.join('\n')); await b.close(); process.exit(1); }
  const code = await H.evaluate(() => SEKTOR9.multiplayer.client.session.room_code); console.log('  Code:', code);
  // Gast tritt bei
  await G.click('#mpEntry [data-mp="open"]').catch(() => {}); await G.waitForTimeout(300);
  await G.fill('#mpEntry [data-mp-input="name"]', 'Bo'); await G.fill('#mpEntry [data-mp-input="code"]', code.toLowerCase().replace('-', ''));
  await G.click('#mpEntry [data-mp="join"]');
  check(await until(H, () => SEKTOR9.multiplayer.client.players.length === 2), 'Host sieht 2 Spieler in der Lobby');
  await shot(H, 'lobby');
  // beide lesen den Auftrag (Vorbereitung)
  for (const p of [H, G]) { const prep = await p.$('#mpEntry [data-mp="prepare"]'); if (prep) { await prep.click(); await p.waitForTimeout(600); await closeDlg(p); } }
  await H.waitForTimeout(1500);
  await H.click('#mpEntry [data-mp="start"]');
  check(await until(G, () => SEKTOR9.engine.inGame()), 'Gast startet automatisch mit');
  check(await until(H, () => SEKTOR9.engine.inGame()), 'Host ist im Spiel');
  for (const p of [H, G]) await closeDlg(p);
  await H.waitForTimeout(3000); await closeDlg(H); await closeDlg(G);
  check(await until(H, () => document.querySelectorAll('#teamBox li .mate').length === 1), 'Host: Teamliste zeigt den Gast');
  check(await until(H, () => /2 AKTIVE SITZUNGEN/.test(SEKTOR9.engine.state().echo.map((e) => e.text).join(' '))) || /2 AKTIVE/.test(await H.evaluate(() => document.querySelector('#echoToast').textContent)), 'ECHO zählt 2 aktive Sitzungen');
  // Gast öffnet das Handrad
  await click(G, 'v_tuer_a'); let f = await settle(G);
  check(Boolean(f) && f.id === 'v_tuer_a', 'Gast: Nahansicht Handrad');
  for (let i = 0; i < 3; i++) { const w = (await focus(G)).parts[0]; await G.mouse.click(w.x, w.y); await G.waitForTimeout(150); }
  check(await until(G, () => SEKTOR9.engine.isSolved('handrad')), 'Gast: Handrad gelöst');
  await closeDlg(G);
  check(await until(H, () => SEKTOR9.engine.isSolved('handrad')), 'Host: Tür ist auch bei ihm offen (gemeinsamer Stand)');
  check(await until(H, () => /Handrad|Panzertür/.test(document.querySelector('.mp-toast').textContent)), 'Host: Meldung „' + (await H.evaluate(() => document.querySelector('.mp-toast').textContent)).slice(0, 60) + '“');
  await G.waitForTimeout(2500); await click(G, 'v_tuer_a_offen'); await G.waitForTimeout(2000);
  check((await st(G)).hall === 'kommando', 'Gast geht ins Kommando');
  check(await until(H, () => /Kommando/.test(document.querySelector('#teamBox').textContent)), 'Host sieht: Gast im Kommando · Leitstand');
  await H.waitForTimeout(2000); await click(H, 'v_tuer_a_offen'); await H.waitForTimeout(2500);
  check(await until(H, () => SEKTOR9.engine.state().hall === 'kommando'), 'Host folgt ins Kommando');
  await shot(H, 'kommando-zu-zweit');
  // Fund nur bei sich, dann teilen
  await click(G, 'k_lagetisch'); await closeDlg(G);
  check((await st(G)).docs.includes('fernmeldeplan') && !(await st(H)).docs.includes('fernmeldeplan') && !(await st(H)).teamDocs.includes('fernmeldeplan'), 'Fernmeldeplan liegt nur beim Gast');
  await G.click('#archiveBtn'); await G.click('[data-doc="fernmeldeplan"]'); await G.click('[data-share="fernmeldeplan"]'); await G.waitForTimeout(300); await G.click('#archiveOv .ov-close');
  check(await until(H, () => SEKTOR9.engine.state().teamDocs.includes('fernmeldeplan')), 'Nach dem Teilen: Fernmeldeplan im Team-Archiv des Hosts');
  // Funk
  await H.click('#chatBtn'); await H.fill('#chatInput', 'Code am Gitter ist die Betriebsfrequenz?'); await H.click('[data-chat-send]'); await H.click('#chatOv .ov-close');
  check(await until(G, () => /Betriebsfrequenz/.test(document.querySelector('#chatCount').textContent + JSON.stringify(SEKTOR9.engine.state()) ) || document.querySelector('#chatCount').textContent === '1'), 'Gast: neue Funknachricht angezeigt');
  await G.click('#chatBtn'); check(/Betriebsfrequenz/.test(await G.textContent('#chatOv .chat-log')), 'Gast liest den Funkspruch des Hosts');
  await G.fill('#chatInput', 'Ja, 4625.'); await G.click('[data-chat-send]'); await G.click('#chatOv .ov-close');
  check(await until(H, () => document.querySelector('#chatCount').textContent === '1'), 'Host: Antwort kommt an');
  await shot(H, 'team');
  // Neuladen
  await G.reload(); await G.waitForTimeout(4000);
  check(await until(G, () => SEKTOR9.engine.inGame() && SEKTOR9.engine.state().hall === 'kommando' && SEKTOR9.engine.isSolved('handrad'), null, 40000), 'Gast lädt neu → wieder in der Sitzung, Stand erhalten');
  // Verlassen
  await G.evaluate(() => SEKTOR9.multiplayer.lobby.leave()); await G.waitForTimeout(1500);
  check(await until(H, () => SEKTOR9.multiplayer.client.players.length === 1, null, 30000), 'Gast verlässt → Host sieht nur noch sich');
  await H.evaluate(() => SEKTOR9.multiplayer.lobby.leave()); await H.waitForTimeout(1500);
  check(!(await H.evaluate(() => SEKTOR9.multiplayer.client.session)), 'Host beendet die Sitzung');
  // Einzelspieler-Stand unberührt
  check(await H.evaluate(() => !localStorage.getItem('sektor9_save_v1') || !JSON.parse(localStorage.getItem('sektor9_save_v1')).solved.includes('handrad')), 'Einzelspieler-Spielstand unberührt');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nGemeinsam spielen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
