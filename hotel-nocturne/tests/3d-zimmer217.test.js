/*
 * Hotel Nocturne – 3D-Testmodus: Zimmer 217.
 * Startet direkt im Zimmer 217 (Rezeption gilt als geschafft), vergleicht jeden Hotspot 3D ↔ 2D und spielt das Zimmer in 3D durch:
 * Kommode 4173 → Blick zum Fenster (Ereignis: Fenster schlägt auf, Fußspuren, Blatt) → Taschenlampe → Gepäckschein unter dem Bett →
 * Schrank ELIAS → Tür 217 zurück in die Rezeption (3D).
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-zimmer217.test.js   (ca. 3 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Rezeption gelöst, Spieler steht in Zimmer 217
const SAVE = { v: 2, started: true, finished: false, current: 'zimmer217', unlocked: ['rezeption', 'zimmer217'], visited: ['rezeption', 'zimmer217'], completed: ['rezeption'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator'], flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open'], inventory: ['key217', 'hotelplan', 'schraubendreher'],
  docs: ['reservierung', 'keyboxnotiz', 'personalfoto'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
async function enter(p, url, key) {
  // vor dem ersten Skript der Seite setzen (die Seite speichert beim Verlassen und würde den Stand sonst überschreiben)
  await p.addInitScript(([k, s]) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, [key, SAVE]);
  await p.goto(url); await p.waitForTimeout(400);
  await p.click('#startButton'); await p.waitForTimeout(1500);
  if (await p.$('#dialog[open] #closeDialog')) await p.click('#closeDialog');
}
const dlgTitle = (p) => p.evaluate(() => { const d = document.querySelector('#dialog'); return d.open ? document.querySelector('#dlgTitle').textContent : null; });
const closeDlg = async (p) => { if (await p.evaluate(() => document.querySelector('#dialog').open)) { await p.click('#closeDialog'); await p.waitForTimeout(250); } };
(async () => {
  const b = await chromium.launch(ARGS); const errs = [];
  const p2 = await b.newPage({ viewport: { width: 1280, height: 860 } }); p2.on('pageerror', (e) => errs.push('2D ' + e.message));
  await enter(p2, BASE + '/hotel-nocturne/index.html', 'nocturne_save_v2');
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { if (id === 'tuer217') continue; await p2.click(`#stage [data-hs="${id}"]`, { force: true }); await p2.waitForTimeout(250); ref[id] = await dlgTitle(p2); await closeDlg(p2); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html', 'nocturne_save_3d_v2');
  console.log('3D aktiv in Zimmer 217:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}z217-${i}.png` }); await p.click('#turnRight'); }
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(120); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350); return pt; };
  let same = 0; const diff = [];
  for (const id of Object.keys(ref)) { const pt = await click3d(id); const t = await dlgTitle(p); if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“${pt ? '' : ' (kein Objekt)'}`); await closeDlg(p); }
  console.log(`Hotspots im Startzustand: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory.join(','), flags: s.flags.filter((f) => !f.startsWith('evt_')).join(','), room: s.current, solved: s.solved.join(',') }; });
  await click3d('kommode'); for (const k of '4173') await p.click(`[data-key="${k}"]`); await p.waitForTimeout(500);
  console.log('Kommode 4173 →', (await st()).flags); await closeDlg(p); await p.waitForTimeout(800);
  // Blick zum Fenster: Ereignis
  await p.evaluate(() => { NOCTURNE.view3d.aimAt('heizung'); NOCTURNE.view3d.sync(); }); await p.waitForTimeout(3000);
  console.log('Blick Süden →', await p.textContent('#viewName'), '| fenster_auf:', (await st()).flags.includes('fenster_auf'));
  await p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 15000 }); // Erzähltext des Ereignisses abwarten
  await closeDlg(p); await p.evaluate(() => NOCTURNE.view3d.aimAt('fenster_offen')); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'z217-fenster.png' });
  for (const id of ['fussspuren', 'blatt']) { await click3d(id); console.log(id, '→', await dlgTitle(p)); await closeDlg(p); }
  await p.evaluate(() => NOCTURNE.view3d.aimAt('blatt')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'z217-blatt.png' });
  // Taschenlampe, Gepäckschein
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500);
  const g = await p.evaluate(() => NOCTURNE.view3d.aimAt('gepaeckschein')); await p.mouse.move(g.x, g.y); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'z217-schein.png' });
  await click3d('gepaeckschein'); console.log('Gepäckschein →', (await st()).inv); await closeDlg(p);
  // Schrank ELIAS
  await click3d('schrank'); await p.click('[data-pick="0"]'); for (const c of 'ELIAS') await p.click(`[data-letter="${c}"]`); // Auswahl springt selbst zum nächsten Rad
  await p.click('[data-wheels-open]'); await p.waitForTimeout(500);
  const s2 = await st(); console.log('Schrank ELIAS →', s2.flags.includes('schrank_open'), '| Schlüssel:', s2.inv.includes('personalschluessel')); await closeDlg(p); await p.waitForTimeout(1500);
  await p.evaluate(() => NOCTURNE.view3d.aimAt('schrank')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'z217-schrank.png' });
  // Zurück in die Rezeption
  await click3d('tuer217'); await p.waitForTimeout(1500); await closeDlg(p);
  console.log('Tür 217 →', (await st()).room, '| 3D:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
