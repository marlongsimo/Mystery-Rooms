/*
 * Hotel Nocturne – 3D-Testmodus: Gepäcklager.
 * Startet direkt im Gepäcklager (Rezeption und Zimmer 217 geschafft), vergleicht jeden Hotspot 3D ↔ 2D und spielt in 3D:
 * Gepäckschein in den Schlitz → Koffer Nr. 6 kommt → Käfigschlüssel → Käfigtür → Truhe 2694 → Blick zum Regal
 * (Ereignis: Koffer 4 rutscht, Wasserstandsmarke) → Archivschlüssel an der Archivtür → ins Archiv.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-gepaecklager.test.js   (ca. 3 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Rezeption und Zimmer 217 gelöst, Spieler steht im Gepäcklager
const SAVE = { v: 2, started: true, finished: false, current: 'gepaecklager', unlocked: ['rezeption', 'zimmer217', 'gepaecklager'], visited: ['rezeption', 'zimmer217', 'gepaecklager'], completed: ['rezeption', 'zimmer217'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open'],
  inventory: ['key217', 'hotelplan', 'schraubendreher', 'personalschluessel', 'gepaeckschein'],
  docs: ['reservierung', 'keyboxnotiz', 'personalfoto'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
async function enter(p, url, key) {
  // vor dem ersten Skript der Seite setzen (die Seite speichert beim Verlassen und würde den Stand sonst überschreiben)
  await p.addInitScript(([k, s]) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, [key, SAVE]);
  await p.goto(url); await p.waitForTimeout(400);
  await p.click('#startButton'); await p.waitForTimeout(1500);
  if (await p.$('#dialog[open] #closeDialog')) await p.click('#closeDialog');
}
const dlgTitle = (p) => p.evaluate(() => { const d = document.querySelector('#dialog'); return d.open ? document.querySelector('#dlgTitle').textContent : null; });
const closeDlg = async (p) => { if (await p.evaluate(() => document.querySelector('#dialog').open)) { await p.click('#closeDialog'); await p.waitForTimeout(900); } }; // angezeigte Anhänger gehen erst zurück
(async () => {
  const b = await chromium.launch(ARGS); const errs = [];
  const p2 = await b.newPage({ viewport: { width: 1280, height: 860 } }); p2.on('pageerror', (e) => errs.push('2D ' + e.message));
  await enter(p2, BASE + '/hotel-nocturne/index.html', 'nocturne_save_v2');
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { if (id === 'treppe') continue; await p2.click(`#stage [data-hs="${id}"]`, { force: true }); await p2.waitForTimeout(250); ref[id] = await dlgTitle(p2); await closeDlg(p2); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  console.log('3D aktiv im Gepäcklager:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}gl-${i}.png` }); await p.click('#turnRight'); }
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(120); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // kurze Handlungen öffnen den Text erst danach; bedienbare Objekte öffnen die Nahansicht → hier den klassischen Dialog nehmen
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(600); }
    return pt; };
  let same = 0; const diff = [];
  for (const id of Object.keys(ref)) { const pt = await click3d(id); const t = await dlgTitle(p); if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“${pt ? '' : ' (kein Objekt)'}`); await closeDlg(p); }
  console.log(`Hotspots im Startzustand: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory.join(','), flags: s.flags.filter((f) => !f.startsWith('evt_')).join(','), room: s.current }; });
  const waitMoment = () => p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 15000 });
  await p.click('[data-slot="gepaeckschein"]'); await click3d('klappe'); await p.waitForTimeout(3500); await closeDlg(p); await waitMoment();
  console.log('Gepäckschein in den Schlitz → koffer_da:', (await st()).flags.includes('koffer_da'));
  await p.evaluate(() => NOCTURNE.view3d.aimAt('koffer6')); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + 'gl-koffer6.png' });
  for (const id of ['koffer6', 'notizbuch']) { await click3d(id); console.log(id, '→', await dlgTitle(p)); await closeDlg(p); }
  await click3d('kaefigschluessel'); await closeDlg(p); console.log('Käfigschlüssel →', (await st()).inv.includes('kaefigschluessel'));
  await p.click('[data-slot="kaefigschluessel"]'); await click3d('kaefigtuer'); await closeDlg(p); await p.waitForTimeout(1500);
  console.log('Käfigtür →', (await st()).flags.includes('kaefig_offen'));
  await click3d('truhe'); for (const k of '2694') await p.click(`[data-key="${k}"]`); await p.waitForTimeout(500); await closeDlg(p);
  const s1 = await st(); console.log('Truhe 2694 →', s1.flags.includes('truhe_offen'), '| Archivschlüssel:', s1.inv.includes('archivschluessel'));
  await p.waitForTimeout(1200); await p.evaluate(() => NOCTURNE.view3d.aimAt('truhe')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'gl-truhe.png' });
  await waitMoment();
  await p.evaluate(() => { NOCTURNE.view3d.aimAt('eimer'); NOCTURNE.view3d.sync(); }); await p.waitForTimeout(2500); await waitMoment();
  console.log('Blick zum Regal → koffer_gerutscht:', (await st()).flags.includes('koffer_gerutscht'));
  await p.waitForTimeout(800); for (const id of ['wassermarke', 'koffer4_boden']) { await click3d(id); console.log(id, '→', await dlgTitle(p)); await closeDlg(p); }
  await p.evaluate(() => NOCTURNE.view3d.aimAt('wassermarke')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'gl-marke.png' });
  await p.click('[data-slot="archivschluessel"]'); await click3d('archivtuer'); await closeDlg(p); await p.waitForTimeout(1500);
  console.log('Archivtür →', (await st()).flags.includes('archiv_offen'));
  await p.evaluate(() => NOCTURNE.view3d.aimAt('archivtuer_offen')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'gl-archiv.png' });
  await click3d('archivtuer_offen'); await p.waitForTimeout(1500);
  console.log('Durch die Archivtür →', (await st()).room);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
