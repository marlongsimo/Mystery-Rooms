/*
 * Hotel Nocturne – 3D-Testmodus: Archiv.
 * Startet direkt im Archiv (Räume 1–3 geschafft), vergleicht jeden Hotspot 3D ↔ 2D und spielt in 3D:
 * Chiffrierscheibe (3 zurück) → Schreibtischfach WESTGANG → Planschrank (Protokoll A · Datum + Nummer) → Blick nach Norden
 * (Ereignis: Tür zu, Buch auf dem Lesetisch) → Schraubendreher an Schublade W → Stahltür 1897 → hinab in den Sicherheitsbereich.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-archiv.test.js   (ca. 3 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Rezeption, Zimmer 217 und Gepäcklager gelöst, Spieler steht im Archiv
const SAVE = { v: 2, started: true, finished: false, current: 'archiv', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], completed: ['rezeption', 'zimmer217', 'gepaecklager'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen'],
  inventory: ['hotelplan', 'schraubendreher'],
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
  await enter(p2, BASE + '/hotel-nocturne/index.html?2d', 'nocturne_save_v2');
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { if (/eingang|_offen/.test(id)) continue; await p2.click(`#stage [data-hs="${id}"]`, { force: true }); await p2.waitForTimeout(250); ref[id] = await dlgTitle(p2); await closeDlg(p2); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  console.log('3D aktiv im Archiv:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}ar-${i}.png`, timeout: 90000 }); await p.click('#turnRight'); }
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(700); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // kurze Handlungen öffnen den Text erst danach; bedienbare Objekte öffnen die Nahansicht → hier den klassischen Dialog nehmen
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(600); }
    return pt; };
  let same = 0; const diff = [];
  for (const id of Object.keys(ref)) { const pt = await click3d(id); let t = await dlgTitle(p); for (let i = 0; i < 12 && !t; i++) { await p.waitForTimeout(250); t = await dlgTitle(p); } if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“${pt ? '' : ' (kein Objekt)'}`); await closeDlg(p); await p.waitForTimeout(700); }
  console.log(`Hotspots im Startzustand: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory.join(','), flags: s.flags.filter((f) => !f.startsWith('evt_')).join(','), solved: s.solved, room: s.current }; });
  const waitMoment = () => p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 15000 });
  // Chiffrierscheibe: 3 Stellen
  await click3d('chiffrierscheibe'); for (let i = 0; i < 3; i++) await p.click('[data-turn="1"]'); await p.click('[data-cipher-check]'); await p.waitForTimeout(600); await closeDlg(p); await waitMoment();
  console.log('Chiffre →', (await st()).solved.includes('chiffre'));
  // Schreibtischfach WESTGANG
  await click3d('schreibtischfach'); await p.click('[data-pick="0"]'); for (const c of 'WESTGANG') await p.click(`[data-letter="${c}"]`);
  await p.click('[data-wheels-open]'); await p.waitForTimeout(600); await closeDlg(p); await waitMoment();
  console.log('Fach WESTGANG →', (await st()).flags.includes('fach_offen'));
  await p.waitForTimeout(1200); await p.evaluate(() => NOCTURNE.view3d.aimAt('schreibtischfach')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ar-fach.png', timeout: 90000 });
  // Planschrank: Protokoll A, Belege Datum + Nummer
  await click3d('planschrank'); await p.check('input[name="step0"][value="A"]'); await p.click('.lock-choice .submit-button'); await p.waitForTimeout(400);
  await p.check('input[name="step1"][value="datum"]'); await p.check('input[name="step1"][value="nummer"]'); await p.click('.lock-choice .submit-button'); await p.waitForTimeout(600); await closeDlg(p); await waitMoment();
  console.log('Planschrank →', (await st()).flags.includes('planlade_offen'));
  await p.waitForTimeout(1200); await p.evaluate(() => NOCTURNE.view3d.aimAt('planschrank')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ar-plan.png', timeout: 90000 });
  // Blick nach Norden → Ereignis
  await p.evaluate(() => { NOCTURNE.view3d.aimAt('jahresordner'); NOCTURNE.view3d.sync(); }); await p.waitForTimeout(2500); await waitMoment(); await closeDlg(p);
  console.log('Blick nach Norden → archiv_ereignis:', (await st()).flags.includes('archiv_ereignis'));
  await p.waitForTimeout(1500);
  for (const id of ['protokollbuch_tisch', 'protokollbuch_regal', 'lesetisch']) { const pt = await click3d(id); console.log(id, '→', pt ? await dlgTitle(p) : '(nicht da)'); await closeDlg(p); }
  await p.evaluate(() => NOCTURNE.view3d.aimAt('jahresordner')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ar-ereignis.png', timeout: 90000 });
  // Schublade W mit dem Schraubendreher
  await p.click('[data-slot="schraubendreher"]'); await click3d('schublade_w'); await p.waitForTimeout(600); await closeDlg(p); await waitMoment();
  const s1 = await st(); console.log('Schublade W →', s1.flags.includes('fachw_offen'), '| Band:', s1.inv.includes('backupband'));
  await p.waitForTimeout(1200); await p.evaluate(() => NOCTURNE.view3d.aimAt('aktenschrank')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ar-w.png', timeout: 90000 });
  // Stahltür 1897
  await click3d('stahltuer'); for (const k of '1897') await p.click(`[data-key="${k}"]`); await p.waitForTimeout(600); await closeDlg(p); await waitMoment();
  console.log('Stahltür 1897 →', (await st()).flags.includes('sicherheit_offen'));
  await p.waitForTimeout(2000); await p.evaluate(() => NOCTURNE.view3d.aimAt('stahltuer_offen')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ar-tuer.png', timeout: 90000 });
  await click3d('stahltuer_offen'); await p.waitForTimeout(1500);
  console.log('Durch die Stahltür →', (await st()).room);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
