/*
 * Hotel Nocturne – 3D-Testmodus: Überwachungsraum.
 * Startet im Überwachungsraum (Räume 1–4 geschafft), vergleicht jeden Hotspot 3D ↔ 2D und spielt in 3D:
 * Backup-Band in den Rekorder → Monitor 3 zeigt den Innenhof, Blick zur Monitorwand (Ereignis: Monitor 2 kurz live) →
 * Zeitleiste A-B-C-D am Terminal → Datei 5 MARA → Taschenlampe unter das Pult, Sicherung → durch die Tür „Technik“.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-ueberwachung.test.js   (ca. 4 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Räume 1–4 gelöst, Spieler steht im Überwachungsraum
const SAVE = { v: 2, started: true, finished: false, current: 'ueberwachung', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen'],
  inventory: ['hotelplan', 'schraubendreher', 'backupband'],
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
    for (const id of ids) { if (/^(ue_tuer|technik)$/.test(id)) continue; await p2.click(`#stage [data-hs="${id}"]`, { force: true }); await p2.waitForTimeout(250); ref[id] = await dlgTitle(p2); await closeDlg(p2); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  console.log('3D aktiv im Überwachungsraum:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}ue-${i}.png`, timeout: 90000 }); await p.click('#turnRight'); }
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
  const move = async (i, d) => { await p.click(`[data-move="${d}"][data-i="${i}"]`); await p.waitForTimeout(150); };
  // Band in den Rekorder
  await p.click('[data-slot="backupband"]'); await click3d('rekorder'); await p.waitForTimeout(2500); await closeDlg(p); await waitMoment().catch(() => {}); await closeDlg(p);
  console.log('Band eingelegt →', (await st()).flags.includes('band_eingelegt'));
  // Blick zur Monitorwand → Ereignis „live“
  await p.evaluate(() => { NOCTURNE.view3d.aimAt('monitor1'); NOCTURNE.view3d.sync(); }); await p.waitForTimeout(1300);
  console.log('Monitor 2 live:', (await st()).flags.includes('monitor2_live')); await p.screenshot({ path: OUT + 'ue-live.png', timeout: 90000 });
  await p.waitForTimeout(2500); await waitMoment().catch(() => {}); await closeDlg(p);
  console.log('Monitor 2 danach gesehen:', (await st()).flags.includes('monitor2_gesehen'));
  for (const id of ['monitor3b', 'monitor2b']) { await click3d(id); console.log(id, '→', await dlgTitle(p)); await closeDlg(p); }
  await p.evaluate(() => NOCTURNE.view3d.aimAt('monitor3b')); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'ue-k3.png', timeout: 90000 });
  // Zeitleiste: Start D,C,A,B → A,B,C,D
  await click3d('terminal'); await move(2, -1); await move(1, -1); await move(3, -1); await move(2, -1); await move(3, -1);
  await p.click('[data-sort-check]'); await p.waitForTimeout(1500); await closeDlg(p); await waitMoment().catch(() => {});
  console.log('Zeitleiste →', (await st()).flags.includes('zeitleiste_ok'));
  // Datei 5: MARA
  await click3d('terminal_datei5'); await p.click('[data-pick="0"]'); for (const c of 'MARA') await p.click(`[data-letter="${c}"]`);
  await p.click('[data-wheels-open]'); await p.waitForTimeout(1500); await closeDlg(p); await waitMoment().catch(() => {}); await closeDlg(p);
  console.log('Datei 5 MARA →', (await st()).flags.includes('datei5_offen'));
  // Taschenlampe, unter das Pult
  const un = await click3d('unter_pult'); console.log('unter_pult (ohne Licht) →', un ? await dlgTitle(p) : null); await closeDlg(p);
  await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(600);
  const k = await p.evaluate(() => NOCTURNE.view3d.aimAt('sicherung')); if (k) { await p.mouse.move(k.x, k.y); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'ue-kiste.png', timeout: 90000 }); }
  await click3d('sicherung'); await p.waitForTimeout(500); await closeDlg(p);
  console.log('Sicherung →', (await st()).inv.includes('sicherung'));
  await p.waitForTimeout(1500); await p.evaluate(() => NOCTURNE.view3d.aimAt('technik')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'ue-tuer.png', timeout: 90000 });
  await click3d('technik'); await p.waitForTimeout(1500);
  console.log('Durch die Tür „Technik“ →', (await st()).room);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
