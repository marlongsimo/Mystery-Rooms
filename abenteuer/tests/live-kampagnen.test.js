/*
 * Mythara – Kampagnen gegen die echte Datenbank (Bauabschnitt A).
 * Allein: Abenteuer beginnen → Kampagne angelegt und gespeichert → Pause → Browser-Stand gelöscht →
 *   „Meine Kampagnen“ → Fortsetzen → zwei Tische gleichzeitig (Versionskonflikt) → Neu beginnen.
 * Mit Handys: Kampagne mit drei Handys → Mitspieler übernommen → Pausieren (Handys getrennt) →
 *   „Mit Handys fortsetzen“ (neuer Code) → Handy tritt wieder bei und spielt weiter.
 * Dazu: Fremde sehen nichts, die RPG-Anmeldung liegt unter eigenem Schlüssel. Am Ende werden alle Testkampagnen gelöscht.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-kampagnen.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (ctx, name) => { const p = await ctx.newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const zu = async (p, fid) => { if (!(await p.$(`[data-fid="${fid}"]`))) { const k = await p.evaluate((f) => window.ABF.FIGUREN[f].klasse, fid); await p.click(`[data-klasse="${k}"]`); } };
  const nimm = async (p, fid) => { await zu(p, fid); await p.click(`[data-fid="${fid}"]`); await p.click('#f-waehlen'); };
  const einstieg = async (p, modus) => {
    await p.click('#my-gast-start'); await p.click('.hub-kachel[data-hub="neu"]');
    await p.waitForSelector('#kodex:not([hidden])');
    for (let i = 0; i < 6; i++) await p.click('#kodex-weiter');
    await p.click(modus === 'live' ? '#live' : '#start');
  };
  const K = (p) => p.evaluate(() => window.KAMPAGNE && window.KAMPAGNE.aktuell());
  const gespeichert = (p, v) => until(p, (x) => { const k = window.KAMPAGNE.aktuell(); return k && k.version >= x && document.querySelector('#kampagne-status') && /gespeichert · Stand/.test(document.querySelector('#kampagne-status').textContent); }, v);
  const meine = (p) => p.evaluate(() => window.AB.liveClient().rpc('rpg_my_campaigns', {}));

  // ---------- Allein ----------
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const T = await page(ctx, 'Tisch');
  await T.goto(BASE + '/abenteuer/index.html?schnell&kampagnen'); await T.evaluate(() => localStorage.clear()); await T.goto(BASE + '/abenteuer/index.html?schnell&kampagnen');
  check(await T.isVisible('#my-gast-start'), 'Startbildschirm mit „Als Gast spielen“');
  await einstieg(T, 'allein');
  for (const f of ['schildwaechter', 'lichtbringer', 'wildnislaeufer']) await nimm(T, f);
  await T.click('#abenteuer-los'); await T.click('#einl-skip');
  check(await gespeichert(T, 1), 'Abenteuer begonnen: Kampagne angelegt und gespeichert (Stand 1)');
  const k1 = await K(T);
  await T.click('#sz-weiter');
  check(await until(T, () => window.ABT.A().szene === 'halmbruck') && await gespeichert(T, k1.version + 1), 'Szenenwechsel gespeichert');
  let liste = await meine(T);
  const eig = liste.find((c) => c.id === k1.id);
  check(eig && eig.checkpoint.titel === 'Am Brunnen' && eig.checkpoint.gruppe.join(',') === 'Torvald,Elara,Kael' && eig.status === 'aktiv', 'Bibliothek: „Am Brunnen“, Gruppe Torvald, Elara, Kael, Status aktiv');
  check(await T.evaluate(() => Object.keys(localStorage).some((k) => k === 'mr-rpg-auth') && !Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k))), 'RPG-Anmeldung liegt unter eigenem Schlüssel (mr-rpg-auth), nicht unter dem der anderen Spiele');

  // Pause, dann „anderer Tag“: Browser-Stand weg, nur Anmeldung und Schalter bleiben
  await T.click('#sz-pause');
  check(await until(T, async () => !document.querySelector('#hub').hidden) && await until(T, (id) => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => l.find((c) => c.id === id).status === 'pausiert'), k1.id), 'Pause: Kampagne pausiert');
  await T.evaluate(() => { for (const k of Object.keys(localStorage)) if (!['mr-rpg-auth', 'mr_kampagnen'].includes(k)) localStorage.removeItem(k); });
  await T.goto(BASE + '/abenteuer/index.html?schnell');
  check(await T.isVisible('#mythara') && !(await T.$('#fortsetzen')), 'Neuer Tag: kein Browser-Spielstand mehr');
  await until(T, () => !document.querySelector('#hub').hidden); await T.click('.hub-nav-punkt[data-hub="kampagnen"]');
  check(await until(T, (id) => Boolean(document.querySelector(`[data-kampagne="${id}"]`)) && /Pausiert/.test(document.querySelector(`[data-kampagne="${id}"]`).textContent), k1.id), 'Meine Kampagnen: Kampagne als „Pausiert“ gelistet');
  await T.click(`[data-k="allein"][data-id="${k1.id}"]`);
  check(await until(T, () => window.ABT.A() && window.ABT.A().szene === 'halmbruck' && !document.querySelector('#szene').hidden), 'Fortgesetzt: wieder am Brunnen');
  check(await until(T, (id) => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => l.find((c) => c.id === id).status === 'aktiv'), k1.id), 'Kampagne wieder aktiv');

  // Zweiter Tisch (gleiche Anmeldung) setzt dieselbe Kampagne fort: Versionskonflikt
  await T.waitForTimeout(3500); // Tisch 1 hat fertig gespeichert, bevor Tisch 2 lädt
  const T2 = await page(ctx, 'Tisch 2');
  await T2.goto(BASE + '/abenteuer/index.html?schnell');
  await until(T2, () => Boolean(window.KAMPAGNE)); await T2.evaluate(() => window.KAMPAGNE.bibliothek()); await until(T2, (id) => Boolean(document.querySelector(`[data-k="allein"][data-id="${id}"]`)), k1.id);
  await T2.click(`[data-k="allein"][data-id="${k1.id}"]`);
  await until(T2, () => window.ABT.A() && window.ABT.A().szene === 'halmbruck');
  const v2 = (await K(T2)).version;
  await T2.click('[data-opt="tam"]');
  check(await gespeichert(T2, v2 + 1), 'Tisch 2 speichert weiter (fragt nach Tam)');
  const dialog2 = JSON.stringify(await T2.evaluate(() => window.ABT.A().dialog.halmbruck.map((d) => d.frage)));
  await T.click('[data-opt="vater"]');
  check(await until(T, (d) => JSON.stringify(((window.ABT.A().dialog || {}).halmbruck || []).map((x) => x.frage)) === d && /anderen Gerät/.test((document.querySelector('.toast') || {}).textContent || ''), dialog2), 'Tisch 1 überschreibt nichts: lädt den neueren Stand von Tisch 2 und meldet es');
  const nachKonflikt = await T.evaluate((id) => window.AB.liveClient().rpc('rpg_load_campaign', { p_campaign_id: id }), k1.id);
  check(JSON.stringify(nachKonflikt.state.abenteuer.dialog.halmbruck.map((x) => x.frage)) === dialog2, 'In Supabase steht der Stand von Tisch 2, nicht der veraltete von Tisch 1');
  await T2.close();

  // Neu beginnen: gleiche Kampagne, Version 0, neues Abenteuer wird darin gespeichert
  await T.evaluate(() => window.KAMPAGNE.bibliothek());
  await until(T, (id) => Boolean(document.querySelector(`[data-k="neu"][data-id="${id}"]`)), k1.id);
  await T.click(`[data-k="neu"][data-id="${k1.id}"]`);
  check(await until(T, () => !document.querySelector('#kodex').hidden && !window.ABT.A()) && (await K(T)).version === 0, 'Neu beginnen: Spielstände gelöscht, das Abenteuer beginnt von vorn');
  for (let i = 0; i < 6; i++) await T.click('#kodex-weiter'); await T.click('#start');
  if (!(await T.evaluate(() => !document.querySelector('#abenteuer-los').disabled))) for (const f of ['schildwaechter', 'lichtbringer', 'wildnislaeufer']) await nimm(T, f);
  await T.click('#abenteuer-los'); await T.click('#einl-skip');
  check(await gespeichert(T, 1) && (await K(T)).id === k1.id, 'Neues Abenteuer wird in derselben Kampagne gespeichert (Stand 1)');

  // Fremder sieht nichts
  const ctxF = await b.newContext(); const Fp = await page(ctxF, 'Fremd');
  await Fp.goto(BASE + '/abenteuer/index.html?kampagnen');
  await Fp.click('#my-gast-start'); await Fp.click('.hub-nav-punkt[data-hub="kampagnen"]');
  check(await until(Fp, () => /Noch keine Kampagne/.test(document.querySelector('.kampagnen').textContent)), 'Fremder Browser: keine fremden Kampagnen');
  check(await Fp.evaluate((id) => window.AB.liveClient().rpc('rpg_load_campaign', { p_campaign_id: id }).then(() => false, (e) => /gehörst nicht/.test(e.message)), k1.id), 'Fremder kann die Kampagne nicht laden');
  await ctxF.close();

  // ---------- Mit Handys ----------
  const ctxL = await b.newContext({ viewport: { width: 1024, height: 900 } });
  const L = await page(ctxL, 'Live-Tisch');
  await L.goto(BASE + '/abenteuer/index.html?schnell&kampagnen');
  await einstieg(L, 'live');
  if (!(await until(L, () => Boolean(document.querySelector('.beitritt .code'))))) console.log('DIAG L', JSON.stringify(await L.evaluate(() => [(document.querySelector('#intro-fehler') || {}).textContent, [...document.querySelectorAll('main > section')].filter((x) => !x.hidden).map((x) => x.id)])));
  const code = (await L.textContent('.beitritt .code')).trim();
  const H = {}, fids = { Anna: 'wildnislaeufer', Ben: 'inquisitor', Cara: 'trickser' };
  for (const n of Object.keys(fids)) {
    const P = H[n] = await page(await b.newContext({ viewport: { width: 390, height: 844 } }), n);
    await P.goto(BASE + '/abenteuer/handy.html#' + code);
    await P.fill('#name', n); await P.click('#rein');
    await until(P, () => document.querySelectorAll('.banner[data-klasse]').length === 5);
    await zu(P, fids[n]); await P.click(`[data-fid="${fids[n]}"]`); await P.click('#f-spielen');
    await until(P, () => Boolean(document.querySelector('.bogen')));
  }
  await until(L, () => !document.querySelector('#abenteuer-los').disabled);
  await L.click('#abenteuer-los'); await L.click('#einl-skip');
  check(await gespeichert(L, 1), 'Live: Kampagne angelegt und gespeichert');
  const kl = await K(L);
  check(await until(L, (id) => window.AB.liveClient().rpc('rpg_load_campaign', { p_campaign_id: id }).then((d) => d.members.filter((m) => m.role === 'spieler').length === 3), kl.id), 'Drei Handys als Mitspieler mit ihren Figuren übernommen');
  check(await until(H.Anna, (id) => window.ABH.H.client.rpc('rpg_my_campaigns', {}).then((l) => l.some((c) => c.id === id && c.role === 'spieler')), kl.id), 'Die Kampagne steht auch in Annas Liste (als Mitspielerin)');
  await L.click('#sz-weiter');
  await until(L, () => window.ABT.A().szene === 'halmbruck');
  await L.click('#sz-kpause');
  check(await until(H.Anna, () => Boolean(document.querySelector('#rein')) || /pausiert/i.test(document.body.textContent), null, 20000), 'Pausieren: Handys sehen die Pause und werden getrennt');
  check(await until(L, () => !document.querySelector('#hub').hidden && !window.AB.liveAn()), 'Tisch zurück auf der Spielerseite, Live-Runde beendet');
  await L.click('.hub-nav-punkt[data-hub="kampagnen"]');
  await until(L, (id) => Boolean(document.querySelector(`[data-k="handys"][data-id="${id}"]`)), kl.id);
  await L.click(`[data-k="handys"][data-id="${kl.id}"]`);
  check(await until(L, () => window.AB.liveAn() && window.ABT.A() && window.ABT.A().szene === 'halmbruck' && Boolean(document.querySelector('#qr-overlay:not([hidden]) .beitritt .code'))), 'Mit Handys fortgesetzt: am Brunnen, neuer Code wird angezeigt');
  const code2 = (await L.textContent('#qr-overlay .beitritt .code')).trim();
  check(code2 !== code, `Neuer Code ${code2}`);
  await H.Anna.goto(BASE + '/abenteuer/handy.html#' + code2);
  await H.Anna.fill('#name', 'Anna'); await H.Anna.click('#rein');
  if (!(await until(H.Anna, () => Boolean(document.querySelector('[data-fid="wildnislaeufer"]'))))) console.log('DIAG Anna', JSON.stringify(await H.Anna.evaluate(() => [document.querySelector('#app').innerText.slice(0, 400), window.ABH.H.fehler, window.ABH.H.client && window.ABH.H.client.session, window.ABH.H.spiel && window.ABH.H.spiel.phase, location.hash])), JSON.stringify(await L.evaluate(() => [window.AB.LIVE.phase, window.AB.LIVE.client.players.map((p) => p.player_name), window.AB.LIVE.client.session && window.AB.LIVE.client.session.room_code])));
  await H.Anna.click('[data-fid="wildnislaeufer"]'); await H.Anna.click('#f-spielen', { timeout: 3000 }).catch(() => {});
  check(await until(H.Anna, () => { const sp = window.ABH.H.spiel; return sp && sp.phase === 'szene' && sp.besitz && sp.besitz.wildnislaeufer === window.ABH.H.client.user.id && Boolean(document.querySelector('.bogen')); }), 'Anna ist wieder dabei, spielt Kael und sieht ihren Bogen');
  if (!ok) console.log('DIAG Anna', JSON.stringify(await H.Anna.evaluate(() => [document.querySelector('#app').innerText.slice(0, 400), window.ABH.H.spiel && window.ABH.H.spiel.phase, window.ABH.H.spiel && window.ABH.H.spiel.besitz, window.ABH.H.fehler])));
  check(await until(L, () => /Am Brunnen/.test(document.querySelector('#szene').textContent) && Object.values(window.AB.LIVE.besitz).length === 1), 'Tisch: Anna wieder zugeordnet, Szene am Brunnen');

  // Aufräumen: alle Testkampagnen löschen
  for (const p of [T, L]) await p.evaluate(() => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => Promise.all(l.filter((c) => c.role === 'host').map((c) => window.AB.liveClient().rpc('rpg_delete_campaign', { p_campaign_id: c.id })))));
  liste = await meine(T);
  check(!liste.some((c) => c.id === k1.id), 'Testkampagnen gelöscht');
  await L.evaluate(() => window.AB.LIVE.client && window.AB.LIVE.client.leave().catch(() => {}));
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nKAMPAGNEN IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
