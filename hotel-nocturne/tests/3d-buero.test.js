/*
 * Hotel Nocturne – 3D-Testmodus: Managerbüro und Finale.
 * Startet im Büro (Räume 1–6 geschafft): jeder Hotspot 3D ↔ 2D (Titel aus den Raumdaten), Riegel unter der Platte nur mit
 * Taschenlampe, Abschlussbericht am Tresor → Servicetunnel → Tor W2 2324 → Finale als 3D-Kamerafahrt (alle Schritte mit „Weiter“)
 * → Abschlussbildschirm. Bilder im Temp-Ordner (bu-*.png, fi-*.png).
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-buero.test.js   (ca. 4 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const QUAL = process.env.Q || 'low'; // Grafikstufe; low = schnell im Software-Rendering, high/medium für Gerätetests
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
// Spielstand: Räume 1–6 gelöst, Spieler steht im Büro
const SAVE = { v: 2, started: true, finished: false, current: 'buero', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller', 'buero'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller', 'buero'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung', 'keller'], views: {},
  solved: ['keybox', 'werkzeug', 'cover', 'elevator', 'anordnung', 'schrank', 'gepaeckschein', 'personaltuer', 'ausgabe', 'kaefig', 'truhe', 'schnipsel', 'archivtuer', 'chiffre', 'fach', 'pruefung', 'fachw', 'pin', 'band', 'zeitleiste', 'datei5', 'sicherung', 'f3', 'generator', 'hebel', 'waescheschrank', 'tuer'],
  flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open', 'kommode_open', 'evt_fenster', 'fenster_auf', 'schrank_open', 'taken_gepaeckschein', 'personal_open', 'koffer_da', 'taken_kaefigschluessel', 'kaefig_offen', 'truhe_offen', 'koffer_gerutscht', 'archiv_offen', 'fach_offen', 'planlade_offen', 'archiv_ereignis', 'fachw_offen', 'sicherheit_offen', 'band_eingelegt', 'monitor2_gesehen', 'zeitleiste_ok', 'datei5_offen', 'taken_sicherung', 'f3_drin', 'gen_laeuft', 'strom', 'schrank_weg', 'tuer_offen'],
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
const light = async (p) => { await p.click('#phoneButton'); await p.waitForTimeout(300); await p.click('[data-app="licht"]'); await p.waitForTimeout(500); if (await p.evaluate(() => document.querySelector('#dialog').open)) await p.click('#closeDialog'); };
(async () => {
  const b = await chromium.launch(ARGS); const errs = [];
  const p2 = await b.newPage({ viewport: { width: 1280, height: 860 } }); p2.on('pageerror', (e) => errs.push('2D ' + e.message));
  await enter(p2, BASE + '/hotel-nocturne/index.html?2d', 'nocturne_save_v2');
  const ref = {};
  for (let v = 0; v < 4; v++) {
    const ids = await p2.$$eval('#stage [data-hs]', (x) => x.map((y) => y.dataset.hs));
    for (const id of ids) { if (id === 'b_wgang') continue; ref[id] = await p2.evaluate((id) => NOCTURNE.engine.hotspotData(id).title, id); }
    await p2.click('#turnRight'); await p2.waitForTimeout(700);
  }
  await p2.close();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errs.push('3D ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('3D console ' + m.text()); });
  await enter(p, BASE + '/hotel-nocturne/3d.html?q=' + QUAL, 'nocturne_save_3d_v2');
  console.log('3D aktiv im Büro:', await p.evaluate(() => document.querySelector('#scene').classList.contains('is3d')), '|', await p.textContent('#location'));
  const click3d = async (id) => { const pt = await p.evaluate((id) => NOCTURNE.view3d.aimAt(id), id); if (!pt) return null; await p.waitForTimeout(700); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(350);
    // kurze Handlungen öffnen den Text erst danach; bedienbare Objekte öffnen die Nahansicht → hier den klassischen Dialog nehmen
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => document.querySelector('#dialog').open || Boolean(NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo()))) break; await p.waitForTimeout(250); }
    if (await p.evaluate(() => { const f = NOCTURNE.view3d.focusInfo && NOCTURNE.view3d.focusInfo(); return Boolean(f && !f.leaving); })) { await p.waitForTimeout(500); await p.click('.n3d-focus [data-f="classic"]'); await p.waitForTimeout(600); }
    return pt; };
  const st = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('nocturne_save_3d_v2')); return { flags: s.flags, room: s.current, finished: s.finished }; });
  const waitMoment = () => p.waitForFunction(() => !document.querySelector('#moment').classList.contains('show'), null, { timeout: 15000 }).catch(() => {});
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}bu-${i}.png`, timeout: 90000 }); await p.click('#turnRight'); }
  let same = 0; const diff = [];
  for (const id of Object.keys(ref)) { const pt = await click3d(id); let t = await dlgTitle(p); for (let i = 0; i < 12 && !t; i++) { await p.waitForTimeout(250); t = await dlgTitle(p); } if (t === ref[id]) same++; else diff.push(`${id}: 2D „${ref[id]}“ / 3D „${t}“${pt ? '' : ' (kein Objekt)'}`); await closeDlg(p); await p.waitForTimeout(700); }
  console.log(`Hotspots im Startzustand: ${same} von ${Object.keys(ref).length} gleich wie 2D`); diff.forEach((d) => console.log('  ≠', d));
  // Taschenlampe: Riegel unter der Platte
  await light(p);
  const rg = await p.evaluate(() => NOCTURNE.view3d.aimAt('b_riegel')); if (rg) { await p.mouse.move(rg.x, rg.y); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'bu-riegel.png', timeout: 90000 }); }
  await click3d('b_riegel'); console.log('Riegel (mit Licht) →', await dlgTitle(p)); await closeDlg(p); await light(p);
  // Abschlussbericht
  await click3d('b_tresor'); const vals = ['Westgang', '6', 'Elias Voss', 'M. Vale', 'Viktor Lehn'];
  const inputs = await p.$$('.lock-multi .multi-field input'); for (let i = 0; i < inputs.length; i++) await inputs[i].fill(vals[i]);
  await p.click('.lock-multi .submit-button'); await p.waitForTimeout(1500); await closeDlg(p); await waitMoment(); await closeDlg(p);
  const s1 = await st(); console.log('Tresor →', s1.flags.includes('tresor_offen'), '| Tunnel offen:', s1.flags.includes('tunnel_offen'));
  await p.waitForTimeout(1500); await p.evaluate(() => NOCTURNE.view3d.aimAt('b_tresor_offen')); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'bu-tresor.png', timeout: 90000 });
  // Tor W2
  await click3d('b_tunnel'); for (const k of '2324') await p.click(`[data-key="${k}"]`); await p.waitForTimeout(400);
  if (await p.isVisible('.lock-code [data-key="✓"]').catch(() => false)) await p.click('.lock-code [data-key="✓"]');
  await p.waitForTimeout(1500); console.log('Tor 2324 →', (await st()).flags.includes('tor_offen'));
  await closeDlg(p);
  await p.waitForSelector('#finale.show', { timeout: 30000 });
  console.log('Finale in 3D:', await p.evaluate(() => Boolean(document.querySelector('#finale .c3-stage .n3d-wrap'))));
  for (let i = 0; i < 10; i++) {
    if (await p.evaluate(() => !document.querySelector('#ending').classList.contains('hidden'))) break;
    await p.waitForTimeout(1200);
    const info = await p.evaluate(() => ({ shot: NOCTURNE.view3d.finaleCtl.info(), text: (document.querySelector('#finale .cine-text.show, #finale .cine-msg.show, #finale .cine-letter.show') || {}).textContent || '' }));
    console.log(`  Schritt ${i}: Einstellung ${info.shot.shot} · Tor ${info.shot.gate.toFixed(2)} · Regen ${info.shot.rain.toFixed(2)} · Fenster aus ${info.shot.dim.toFixed(2)} · „${info.text.trim().slice(0, 50)}“`);
    await p.evaluate(() => NOCTURNE.view3d.finaleCtl && 0); await p.screenshot({ path: `${OUT}fi-${i}.png`, timeout: 90000 }).catch(() => {});
    await p.evaluate(() => { const btn = document.querySelector('#finale .cine-btn'); if (btn) btn.click(); });
  }
  await p.waitForTimeout(2000);
  console.log('Abschluss:', JSON.stringify({ ending: await p.evaluate(() => !document.querySelector('#ending').classList.contains('hidden')), finished: (await st()).finished }));
  await p.screenshot({ path: OUT + 'fi-ende.png', timeout: 90000 });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
