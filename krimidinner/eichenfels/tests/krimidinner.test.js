/*
 * Krimidinner „Der letzte Stern von Eichenfels“ – Ablauf im Browser
 * Abend für 5 Personen anlegen → Codes → jede Rolle öffnen (Varianten, Kleidungstabelle, Querverweise) →
 * Runden mit Losungswörtern → bedingte Karten → Spielleitung (Ablauf, Runden, Siegel) → Druckansichten.
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/eichenfels/tests/krimidinner.test.js   (SHOTS=1 → Bilder in /tmp)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/krimidinner/eichenfels/index.html';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  // jede Person: eigenes Gerät (eigener Browser-Kontext)
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const shot = (p, n) => (process.env.SHOTS ? p.screenshot({ path: OUT + 'kd-' + n + '.png', fullPage: false }) : null);

  // Spielleitung legt an
  const H = await page();
  await H.goto(URL); await H.click('a[href="#anlegen"]');
  const names = ['Anna', 'Ben', 'Cem', 'Dora', 'Emil'];
  await H.click('[data-add]');
  for (let i = 0; i < 5; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await H.click('[data-v="1|1"]'); await H.click('[data-v="3|1"]'); // Ben, Dora: männlich dargestellt
  for (let i = 0; i < 5; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await shot(H, 'anlegen');
  await H.click('[data-deal]'); await H.waitForSelector('.bigcode');
  check(await H.isVisible('.bigcode'), 'Rollen verteilt, Spielleitungscode sichtbar');
  const host = await H.evaluate(() => JSON.parse(localStorage.getItem('kd_eich_host')));
  check(host.people.length === 5 && host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)), 'Fünf Codes im Format XXX-XXX');
  check(!(await H.textContent('main')).match(/R0\d|R10|Rademacher|Marwitz/), 'Die Spielleitung sieht keine Rollen, nur Codes');
  const decoded = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  const roles = decoded.map((d) => d.role).sort();
  check(JSON.stringify(roles) === JSON.stringify(['R01', 'R02', 'R08', 'R09', 'R10']), 'Besetzung für 5: R01, R02, R08, R09, R10 (' + roles.join(', ') + ')');
  check(decoded.every((d) => d.variants === decoded[0].variants && d.n === 5), 'Alle Codes tragen dieselben Varianten und n = 5');
  check(await H.evaluate(() => KD.decode('ABC-DEF') === null && KD.decode('') === null), 'Falsche Codes werden abgelehnt');
  await shot(H, 'codes');

  // Jede Person öffnet ihr Rollenblatt über den Link
  const byRole = {};
  for (let i = 0; i < 5; i++) {
    const P = await page();
    await P.goto(URL + '#c=' + host.people[i].code.replace('-', ''));
    await P.waitForSelector('.doc');
    const d = decoded[i], male = Boolean(d.variants & (1 << ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10'].indexOf(d.role)));
    const h1 = await P.textContent('h1'), txt = await P.textContent('.doc');
    byRole[d.role] = { P, male, name: names[i] };
    check(!/\[[^\]]* \/ [^\]]*\]|\{R\d\d:/.test(txt), `${names[i]} → ${d.role} „${h1}“: keine offenen Variantenklammern`);
    if (names[i] === 'Ben' || names[i] === 'Dora') check(male, `${names[i]} hat die männliche Variante`);
  }
  // Kleidung: nur eigene Spalte
  const any = Object.values(byRole)[0];
  await any.P.click('[data-tab="s2"]');
  const heads = await any.P.$$eval('.doc thead th', (t) => t.map((x) => x.textContent.trim()));
  check(heads.length === 2 && heads[1] === 'Deine Variante', 'Kleidungstabelle zeigt nur die eigene Variante');
  // Vertraulich: erst nach Tippen
  await any.P.click('[data-tab="s4"]');
  check(await any.P.isVisible('.seal'), 'Seite 4 ist zuerst versiegelt');
  await any.P.click('#s4'); check(await any.P.isVisible('.doc.secret'), 'Seite 4 nach dem Öffnen sichtbar');
  // Täterrolle
  const R8 = byRole.R08.P; await R8.click('[data-tab="s4"]'); if (await R8.isVisible('#s4')) await R8.click('#s4');
  check(/Du hast Professor Theodor Sander getötet/.test(await R8.textContent('.doc')), 'R08 erfährt auf Seite 4, dass es die Täterrolle ist');
  await shot(R8, 'taeter');
  // Beweise: Losungswörter
  const P1 = byRole.R02.P; await P1.click('[data-tab="bew"]');
  check(/Noch keine Beweise/.test(await P1.textContent('#pane')), 'Ohne Losungswort keine Beweise');
  await P1.fill('#word', 'falsch'); await P1.click('#unl'); check(/kennt das Spiel nicht/.test(await P1.textContent('#fb')), 'Falsches Losungswort abgelehnt');
  await P1.fill('#word', 'kuppel'); await P1.click('#unl');
  let ids = await P1.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  check(JSON.stringify(ids) === JSON.stringify(['B1', 'B2', 'B3', 'B4']), 'KUPPEL → B1–B4');
  await P1.fill('#word', 'ORION'); await P1.click('#unl');
  ids = await P1.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  check(ids.includes('B8') && ids.includes('B5') && !ids.includes('B9'), 'ORION → B5–B8 (B8, weil R07 nicht besetzt ist)');
  await P1.fill('#word', 'NEBEL'); await P1.click('#unl');
  ids = await P1.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  check(ids.includes('B11') && ids.includes('B12'), 'NEBEL → B9–B12 (B12, weil R04 nicht besetzt ist)');
  const b11 = await P1.textContent('.ecard:has(header:has-text("B11"))');
  check(!/\{R0/.test(b11) && /(Mina|Emre)/.test(b11), 'B11: Name der Küchenfigur nach Variante aufgelöst');
  check(!ids.includes('B13'), 'Finale-Karten noch verborgen');
  await shot(P1, 'beweise');

  // Spielleitung
  await H.click('a[href="#leitung"]');
  check(/Teil A/.test(await H.textContent('.hostdoc')) && !/Rademacher hat das Archiv/.test(await H.textContent('.hostdoc')), 'Ablauf zeigt Teil A, nicht die Auflösung');
  const npc = await H.$$eval('.hostdoc table', (ts) => { const t = ts.find((x) => x.querySelector('th') && x.querySelector('th').textContent.trim() === 'Nebenfigur'); return t ? [...t.querySelectorAll('tbody tr td:first-child')].map((x) => x.textContent.trim()) : []; });
  check(JSON.stringify(npc) === JSON.stringify(['R03', 'R04', 'R05', 'R06', 'R07']), 'Nebenfiguren-Tabelle zeigt nur die unbesetzten Rollen (' + npc.join(', ') + ')');
  await H.click('[data-tab="runden"]');
  await H.click('[data-round="1"]'); check((await H.textContent('.round.r1 .word')) === 'KUPPEL', 'Runde 1 geöffnet: Losungswort KUPPEL');
  H.once('dialog', (dl) => dl.dismiss()); await H.click('[data-round="4"]');
  check(!(await H.isVisible('.round.r4 .word')), 'Finale bleibt zu, wenn die Rückfrage abgelehnt wird');
  await H.click('[data-tab="loesung"]'); check(await H.isVisible('.seal'), 'Lösung versiegelt');
  H.once('dialog', (dl) => dl.accept()); await H.click('#sol');
  check(/Rademacher/.test(await H.textContent('.hostdoc')), 'Nach dem Siegelbruch: Teil B mit der Lösung');
  await shot(H, 'loesung');

  // Druckansichten (ohne Dialog)
  await H.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await H.click('[data-tab="druck"]');
  await H.click('[data-p="cards"]');
  const nCards = await H.$$eval('#print .ecard', (c) => c.length);
  check(nCards === 14, 'Druck: Beweiskarten für diese Besetzung (' + nCards + ')');
  await H.click('[data-p="roles"]');
  check((await H.$$eval('#print .p-doc', (c) => c.length)) === 20, 'Druck: 5 Rollenblätter × 4 Seiten');
  check(!/\[[^\]]* \/ [^\]]*\]|\{R\d\d:/.test(await H.textContent('#print')), 'Druck: keine offenen Variantenklammern');
  await H.emulateMedia({ media: 'print' }); if (process.env.SHOTS) await H.pdf({ path: OUT + 'kd-rollen.pdf', format: 'A4' }).catch(() => {});
  await H.emulateMedia({ media: 'screen' });

  // Mitspielende Person mit R04 → B12 erst nach FUNK
  const n8 = await H.evaluate(() => { const v = 0; return KD.encode({ host: false, role: 3, n: 8, variants: v }); });
  const Q = await page(); await Q.goto(URL + '#c=' + n8.replace('-', '')); await Q.waitForSelector('.doc');
  await Q.click('[data-tab="bew"]'); await Q.fill('#word', 'NEBEL'); await Q.click('#unl');
  ids = await Q.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  check(!ids.includes('B12') && ids.includes('B8'), '8 Personen (R04 besetzt, R07 nicht): B12 fehlt ohne FUNK, B8 ist dabei');
  await Q.fill('#word', 'FUNK'); await Q.click('#unl');
  ids = await Q.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  check(ids.includes('B12'), 'FUNK → B12 freigegeben');

  // Ein Gerät für Spielleitung und eigene Rolle: beide Stände bleiben getrennt
  await H.goto(URL + '#c=' + host.people[0].code.replace('-', '')); await H.waitForSelector('.doc');
  await H.goto(URL + '#leitung'); await H.waitForSelector('.tabs');
  check(/Der Abend/.test(await H.textContent('h1')), 'Spielleitung und eigenes Rollenblatt auf einem Gerät: beide erreichbar');
  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nKrimidinner in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
