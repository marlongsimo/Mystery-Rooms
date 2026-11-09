/*
 * Hotel Nocturne – 3D-Testmodus: Keller.
 * Startet im Keller (Räume 1–5 geschafft). Prüft die Dunkelheit (ohne Licht nur die Treppe), vergleicht mit Taschenlampe jeden
 * Hotspot 3D ↔ 2D und spielt in 3D: Sicherung F3 → Generator (Hahn, Choke, Zündung, Starter) → Hebel C-A-D-B (Licht, dann das
 * Flacker-Ereignis) → Schraubendreher am Wäscheschrank → Stahltür → durch den Gang ins Büro.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-keller.test.js   (ca. 4 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Räume 1–5 gelöst, Spieler steht im Keller
const SAVE = { v: 2, started: true, finished: false, current: 'keller', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin', 'band', 'zeitleiste', 'datei5', 'sicherung'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen', 'band_eingelegt', 'monitor2_gesehen', 'zeitleiste_ok', 'datei5_offen', 'taken_sicherung'],
  inventory: ['hotelplan', 'schraubendreher', 'sicherung'],
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
const light = async (p) => { await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); if (await p.evaluate(() => document.querySelector('#dialog').open)) await p.click('#closeDialog'); };
(async () => {
  const b = await chromium.launch(ARGS); const errs = [];
  const p2 = await b.newPage({ viewport: { width: 1280, height: 860 } }); p2.on('pageerror', (e) => errs.push('2D ' + e.message));
  await enter(p2, BASE + '/hotel-nocturne/index.html?2d', 'nocturne_save_v2');
  console.log('2D ohne Licht, sichtbare Hotspots:', (await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs))).join(','));
  await light(p2);
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { if (/^(k_treppe|durchgang)$/.test(id)) continue; ref[id] = await p2.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id); /* Titel aus den Raumdaten: der 2D-Klick auf die Mitte trifft teils überlagerte Flächen */ }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  console.log('3D aktiv im Keller:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(700); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // kurze Handlungen öffnen den Text erst danach; bedienbare Objekte öffnen die Nahansicht → hier den klassischen Dialog nehmen
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(600); }
    return pt; };
  await p.waitForTimeout(1500); await p.screenshot({ path: OUT + 'ke-dunkel.png', timeout: 90000 });
  const darkGen = await click3d('generator'); console.log('Ohne Licht: Generator anklickbar?', Boolean(darkGen && await dlgTitle(p))); await closeDlg(p);
  await click3d('k_treppe'); await p.waitForTimeout(400); console.log('Ohne Licht: Treppe →', JSON.parse(await p.evaluate(() => localStorage.getItem('nocturne_save_3d_v2'))).current);
  await p.close();
  // frische Seite (Treppe hat in den Überwachungsraum geführt) – Spielstand neu setzen
  const q = await b.newPage({ viewport: { width: 1280, height: 860 } }); q.setDefaultTimeout(15000);
  q.on('pageerror', (e) => errs.push('3D ' + e.message)); q.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(q, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  await play(q, ref, errs);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
async function play(p, ref, errs) {
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(700); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // kurze Handlungen öffnen den Text erst danach; bedienbare Objekte öffnen die Nahansicht → hier den klassischen Dialog nehmen
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(600); }
    return pt; };
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { inv: s.inventory.join(','), flags: s.flags.filter((f) => !f.startsWith('evt_')), room: s.current }; });
  const waitMoment = () => p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 15000 }).catch(() => {});
  console.log('Zweite Seite:', await p.textContent('#location'));
  await light(p);
  console.log('Licht an:', await p.evaluate(() => NOCTURNE.engine.isLight()));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}ke-licht-${i}.png`, timeout: 90000 }); await p.click('#turnRight'); }
  let same = 0; const diff = [];
  for (const id of Object.keys(ref)) { const pt = await click3d(id); let t = await dlgTitle(p); for (let i = 0; i < 12 && !t; i++) { await p.waitForTimeout(250); t = await dlgTitle(p); } if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“${pt ? '' : ' (kein Objekt)'}`); await closeDlg(p); await p.waitForTimeout(700); }
  console.log(`Hotspots mit Taschenlampe: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  await p.click('[data-slot="sicherung"]'); await click3d('sicherungsfach'); await p.waitForTimeout(800); await closeDlg(p); await waitMoment(); await closeDlg(p);
  console.log('Sicherung F3 →', (await st()).flags.includes('f3_drin'));
  await click3d('bedienfeld'); for (const s of ['hahn', 'choke', 'zuendung', 'starter']) { await p.click(`[data-seq="${s}"]`); await p.waitForTimeout(450); }
  await p.waitForTimeout(1500); await closeDlg(p); await waitMoment(); await closeDlg(p);
  console.log('Generator →', (await st()).flags.includes('gen_laeuft'));
  await p.evaluate(() => NOCTURNE.view3d.aimAt('generator')); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + 'ke-gen.png', timeout: 90000 });
  await click3d('schalttafel'); for (const s of ['C', 'A', 'D', 'B']) { await p.click(`[data-seq="${s}"]`); await p.waitForTimeout(450); }
  await p.waitForTimeout(1500); await closeDlg(p);
  console.log('Hebel C-A-D-B → strom:', (await st()).flags.includes('strom'));
  await p.waitForTimeout(2600); console.log('Flackern (Licht kurz aus):', (await st()).flags.includes('flackern'));
  await p.waitForTimeout(5000); await waitMoment(); await closeDlg(p); console.log('danach Licht zurück:', !(await st()).flags.includes('flackern'));
  // Taschenlampe aus, Raum mit Strom
  await light(p);
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}ke-strom-${i}.png`, timeout: 90000 }); await p.click('#turnRight'); }
  await p.click('[data-slot="schraubendreher"]'); await click3d('waescheschrank'); await p.waitForTimeout(2600); await closeDlg(p); await waitMoment(); await closeDlg(p);
  console.log('Wäscheschrank →', (await st()).flags.includes('schrank_weg'));
  // warten, bis der Schrank zur Seite gerutscht ist (im Software-Rendering langsam)
  for (let k = 0; k < 30; k++) { const ok = await p.evaluate(() => { const pt = NOCTURNE.view3d.aimAt('stahltuer_auf'); return pt && NOCTURNE.view3d.pickAt(pt.x, pt.y) === 'stahltuer_auf'; }); if (ok) break; await p.waitForTimeout(1000); }
  await click3d('stahltuer_auf'); await p.waitForTimeout(1500); await closeDlg(p); await waitMoment(); await closeDlg(p);
  console.log('Stahltür →', (await st()).flags.includes('tuer_offen'));
  await p.waitForTimeout(1500); await p.evaluate(() => NOCTURNE.view3d.aimAt('durchgang')); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'ke-tuer.png', timeout: 90000 });
  await click3d('durchgang'); await p.waitForTimeout(1500);
  console.log('Durch die Stahltür →', (await st()).room);
}
