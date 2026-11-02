/*
 * Hotel Nocturne – 3D-Testmodus: Grafikstufe HD (Rezeption, Zimmer 217).
 * Prüft je Raum und Stufe (high · medium · low): HD aktiv, Umgebungslicht, Leuchten/Schatten passend zur Stufe,
 * alle Modelle geladen (kein 404), keine Fehler; legt Bilder aller vier Blickrichtungen im Temp-Ordner ab.
 * Aufruf: python3 -m http.server 8765 &  ·  node hotel-nocturne/tests/3d-hd.test.js   (ca. 4 Minuten)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const ARGS = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const base = { v: 2, started: true, finished: false, views: {}, docs: ['reservierung'], newDocs: [], messages: [], unread: [], secrets: [], pending: [], evidence: [], gone: { items: [], flags: [] }, hints: {}, puzzleStart: {}, playMs: 600000, notes: '', sound: false, music: false, showHotspots: false, goals: {} };
const SAVES = {
  rezeption: { ...base, current: 'rezeption', unlocked: ['rezeption'], visited: ['rezeption'], completed: [], solved: [], flags: [], inventory: [] },
  zimmer217: { ...base, current: 'zimmer217', unlocked: ['rezeption', 'zimmer217'], visited: ['rezeption', 'zimmer217'], completed: ['rezeption'], solved: ['keybox', 'werkzeug', 'cover', 'elevator'], flags: ['keybox_open', 'taken_schraubendreher', 'cover_open', 'elevator_open'], inventory: ['key217', 'hotelplan', 'schraubendreher'] },
  archiv: { ...base, current: 'archiv', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], completed: ['rezeption', 'zimmer217', 'gepaecklager'], solved: [], flags: ['archiv_offen'], inventory: ['hotelplan', 'schraubendreher'] },
  ueberwachung: { ...base, current: 'ueberwachung', unlocked: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], visited: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv', 'ueberwachung'], completed: ['rezeption', 'zimmer217', 'gepaecklager', 'archiv'], solved: [], flags: ['sicherheit_offen'], inventory: ['backupband'] },
};
const EXPECT = { high: { bloom: true, shadows: true }, medium: { bloom: true, shadows: true }, low: { bloom: false, shadows: false } };
(async () => {
  const b = await chromium.launch(ARGS); let fail = 0;
  for (const room of Object.keys(SAVES)) for (const q of ['high', 'medium', 'low']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); p.setDefaultTimeout(30000); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    p.on('console', (m) => { if (m.type() === 'error' || /Modell nicht geladen/.test(m.text())) errs.push(m.text()); });
    await p.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('nocturne_save_3d_v2', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, SAVES[room]);
    await p.goto(`${BASE}/hotel-nocturne/3d.html?q=${q}`); await p.waitForTimeout(400);
    await p.click('#startButton'); await p.waitForTimeout(2000); if (await p.$('#dialog[open] #closeDialog')) await p.click('#closeDialog');
    await p.evaluate(() => NOCTURNE.view3d.modelsReady()); await p.waitForTimeout(1500);
    const i = await p.evaluate(() => NOCTURNE.view3d.info()), e = EXPECT[q];
    const ok = i.hd && i.env && i.bloom === e.bloom && i.shadows === e.shadows && !errs.length;
    console.log(`${ok ? '  ✓' : '  ✗'} ${room} · ${q}: hd ${i.hd} · Umgebung ${i.env} · Leuchten ${i.bloom} · Schatten ${i.shadows}${errs.length ? ' · Fehler: ' + errs.join(' | ') : ''}`);
    if (!ok) fail++;
    if (q === 'high') for (let v = 0; v < 4; v++) { await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}hd-${room}-${v}.png` }); await p.click('#turnRight'); }
    await p.close();
  }
  console.log(fail ? `\n${fail} Abweichung(en).` : '\nHD-Grafik in allen Stufen in Ordnung.'); await b.close(); process.exit(fail ? 1 : 0);
})();
