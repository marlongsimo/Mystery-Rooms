/*
 * Krimidinner „Der letzte Stern von Eichenfels“ – Ablauf im Browser
 * Abend für 5 Personen anlegen → Codes → jede Rolle öffnen (Varianten, Kleidungstabelle, Querverweise) →
 * kein Vorwissen über die Mordnacht in den offenen Teilen → Runden des Rollenblatts und Beweise mit Losungswörtern →
 * bedingte Karten → geführter Ablauf der Spielleitung (Schritte, Nebenfiguren, Losungswörter, Siegel) → Druck.
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/eichenfels/tests/krimidinner.test.js   (SHOTS=1 → Bilder in /tmp)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/krimidinner/eichenfels/index.html';
const OUT = require('os').tmpdir() + '/';
const { chromium } = require('playwright');
const IDS = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10'];
const OPEN = /\[[^\]]* \/ [^\]]*\]|\{R\d\d:/;
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  // jede Person: eigenes Gerät (eigener Browser-Kontext)
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const shot = (p, n) => (process.env.SHOTS ? p.screenshot({ path: OUT + 'kd-' + n + '.png' }) : null);
  const cardIds = (p) => p.$$eval('.ecard header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  const unlock = async (p, w) => { await p.fill('#word', w); await p.click('#unl'); await p.waitForTimeout(150); };

  // Spielleitung legt an
  const H = await page();
  await H.goto(URL); await H.click('a[href="#anlegen"]');
  const names = ['Anna', 'Ben', 'Cem', 'Dora', 'Emil'];
  await H.click('[data-add]');
  await H.click('[data-v="1|1"]'); await H.click('[data-v="3|1"]');
  for (let i = 0; i < 5; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await H.click('[data-deal]'); await H.waitForSelector('.bigcode');
  check(await H.isVisible('.bigcode'), 'Rollen verteilt, Spielleitungscode sichtbar');
  const host = await H.evaluate(() => JSON.parse(localStorage.getItem('kd_eich_host')));
  check(host.people.length === 5 && host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)), 'Fünf Codes im Format XXX-XXX');
  check(!(await H.textContent('main')).match(/R0\d|R10|Rademacher|Marwitz/), 'Die Spielleitung sieht keine Rollen, nur Codes');
  const decoded = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  check(JSON.stringify(decoded.map((d) => d.role).sort()) === JSON.stringify(['R01', 'R02', 'R08', 'R09', 'R10']), 'Besetzung für 5: R01, R02, R08, R09, R10');
  check(decoded.every((d) => d.variants === decoded[0].variants && d.n === 5), 'Alle Codes tragen dieselben Varianten und n = 5');
  check(await H.evaluate(() => KD.decode('ABC-DEF') === null && KD.decode('') === null), 'Falsche Codes werden abgelehnt');

  // Jede Person öffnet ihr Rollenblatt
  const by = {};
  for (let i = 0; i < 5; i++) {
    const P = await page();
    await P.goto(URL + '#c=' + host.people[i].code.replace('-', '')); await P.waitForSelector('.doc');
    const d = decoded[i], male = Boolean(d.variants & (1 << IDS.indexOf(d.role)));
    by[d.role] = { P, male, name: names[i] };
    let txt = await P.textContent('.doc');
    await P.click('[data-tab="p1"]'); txt += await P.textContent('.doc');
    await P.click('[data-tab="p2"]'); await P.click('#s4'); txt += await P.textContent('.doc');
    check(!OPEN.test(txt), `${names[i]} → ${d.role} „${await P.textContent('h1')}“: keine offenen Variantenklammern`);
    if (d.role !== 'R08') check(!/21:(0[3-9]|[1-3]\d)/.test(txt), `${d.role}: Charakter, Kleidung und Vertraulich verraten nichts aus der Mordnacht`);
    if (names[i] === 'Ben' || names[i] === 'Dora') check(male, `${names[i]} hat die männliche Variante`);
  }
  const A = by.R02.P;
  await A.click('[data-tab="p1"]');
  const heads = await A.$$eval('.doc thead th', (t) => t.map((x) => x.textContent.trim()));
  check(heads.length === 2 && heads[1] === 'Deine Variante', 'Kleidungstabelle zeigt nur die eigene Variante');
  // Runden des Rollenblatts
  await A.click('[data-tab="p3"]');
  check(await A.isVisible('.seal') && !(await A.$('.doc')), 'Runde 1 ist vor dem Losungswort gesperrt');
  check(/🔒/.test(await A.textContent('[data-tab="p4"]')), 'Runden 2 und 3 tragen ein Schloss');
  await unlock(A, 'falsch'); check(/kennt das Spiel nicht/.test(await A.textContent('#fb')), 'Falsches Losungswort abgelehnt');
  await unlock(A, 'kuppel');
  check(/Nach dem Fund/.test(await A.textContent('.doc')) && /21:0[2-9]|21:1/.test(await A.textContent('.doc')), 'KUPPEL öffnet Runde 1 mit dem Abend ab 20:40');
  check(/🔒/.test(await A.textContent('[data-tab="p4"]')), 'Runde 2 bleibt zu');
  await shot(A, 'runde1');
  // Täterrolle kennt die Tat von Anfang an
  const R8 = by.R08.P; await R8.click('[data-tab="p2"]');
  check(/Du hast Professor Theodor Sander getötet/.test(await R8.textContent('.doc')) && /Was heute Abend geschieht/.test(await R8.textContent('.doc')), 'R08: Tat und Ablauf schon im Teil „Vertraulich“');
  // Beweise
  await A.click('[data-tab="bew"]');
  check(JSON.stringify(await cardIds(A)) === JSON.stringify(['B1', 'B2', 'B3', 'B4']), 'Nach KUPPEL: Beweise B1–B4');
  await unlock(A, 'ORION');
  let ids = await cardIds(A);
  check(ids.includes('B8') && ids.includes('B5') && !ids.includes('B9'), 'ORION → B5–B8 (B8, weil R07 fehlt)');
  await A.click('[data-tab="p4"]'); check(/Jetzt fällt dir ein/.test(await A.textContent('.doc')), 'ORION öffnet auch Runde 2 im Rollenblatt');
  await A.click('[data-tab="bew"]'); await unlock(A, 'NEBEL');
  ids = await cardIds(A);
  check(ids.includes('B11') && ids.includes('B12') && !ids.includes('B13'), 'NEBEL → B9–B12 (B12, weil R04 fehlt), Finale noch zu');
  const b11 = await A.textContent('.ecard:has(header:has-text("B11"))');
  check(!/\{R0/.test(b11) && /(Mina|Emre)/.test(b11), 'B11: Name der Küchenfigur nach Variante aufgelöst');

  // Spielleitung: geführter Ablauf
  await H.click('a[href="#leitung"]'); await H.waitForSelector('.steps');
  check((await H.$$('.steps button')).length === 7, 'Geführter Ablauf: 7 Schritte (Vorbereitung, Start, Phase 1–4, Finale)');
  check(/Nebenfiguren: R03 · R04 · R05 · R06 · R07/.test(await H.textContent('#pane')), 'Vorbereitung nennt Besetzung und Nebenfiguren');
  await H.click('#next'); await H.click('#next');
  check(/Phase 1/.test(await H.textContent('.step-head h2')), 'Weiter → Phase 1');
  const npcIntro = await H.$$eval('.step-doc table', (ts) => { const t = ts.find((x) => x.querySelector('th') && x.querySelector('th').textContent.trim() === 'Nebenfigur'); return t ? [...t.querySelectorAll('tbody tr td:first-child')].map((x) => x.textContent.trim()) : []; });
  check(JSON.stringify(npcIntro) === JSON.stringify(['R03', 'R04', 'R05', 'R06', 'R07']), 'Phase 1: Vorstellung nur der fehlenden Rollen');
  await H.click('#next');
  check(/Phase 2/.test(await H.textContent('.step-head h2')) && !(await H.isVisible('.round .word')), 'Phase 2: Losungswort noch verdeckt');
  await H.click('[data-round="1"]'); check((await H.textContent('.round .word')) === 'KUPPEL', 'Phase 2: Losungswort KUPPEL angezeigt');
  const npc2 = await H.$$eval('.npc blockquote b', (x) => x.map((y) => y.textContent));
  check(JSON.stringify(npc2) === JSON.stringify(['R03', 'R04', 'R05', 'R05', 'R06']), 'Phase 2: Wissen genau der fehlenden Rollen (' + npc2.join(', ') + ')');
  check(!OPEN.test(await H.textContent('.npc')), 'Nebenfiguren-Texte ohne offene Klammern');
  await H.click('#tstart'); await H.waitForTimeout(1200);
  check(/0:0[1-9]/.test(await H.textContent('#tm')), 'Zeitnahme läuft');
  await shot(H, 'leitung-p2');
  await H.click('#next');
  const npc3 = await H.$$eval('.npc blockquote b', (x) => x.map((y) => y.textContent));
  check(JSON.stringify(npc3) === JSON.stringify(['R03', 'R05', 'R05', 'R07']), 'Phase 3: Ritter, Hollerbach, Seebach zum Vorlesen');
  check(await H.isVisible('.imp'), 'Phase 3: „Wenn es stockt“-Impulse');
  await H.click('#next'); await H.click('#next');
  check(/Finale/.test(await H.textContent('.step-head h2')), 'Weiter → Finale');
  H.once('dialog', (dl) => dl.dismiss()); await H.click('[data-round="4"]');
  check(!(await H.isVisible('.round .word')), 'Finale-Karten bleiben zu, wenn die Rückfrage abgelehnt wird');
  await H.reload(); await H.waitForSelector('.steps');
  check(/Finale/.test(await H.textContent('.step-head h2')), 'Nach dem Neuladen: wieder beim Finale');
  await H.click('[data-tab="loesung"]'); check(await H.isVisible('.seal'), 'Lösung versiegelt');
  H.once('dialog', (dl) => dl.accept()); await H.click('#sol');
  check(/Rademacher/.test(await H.textContent('.hostdoc')), 'Nach dem Siegelbruch: Teil B mit der Lösung');

  // Druck
  await H.evaluate(() => { window.print = () => {}; });
  await H.click('[data-tab="druck"]'); await H.click('[data-p="cards"]');
  check((await H.$$eval('#print .ecard', (c) => c.length)) === 14, 'Druck: alle 14 Beweiskarten (B3 als eigenes Blatt)');
  await H.click('[data-p="roles"]');
  check((await H.$$eval('#print .p-doc', (c) => c.length)) === 30, 'Druck: 5 Rollen × 6 Teile');
  const pr = await H.textContent('#print');
  check(!OPEN.test(pr) && /ERST ÖFFNEN, WENN DIE SPIELLEITUNG DAS LOSUNGSWORT DER RUNDE 1 NENNT/.test(pr), 'Druck: Runden mit Hinweis „Erst öffnen …“, keine offenen Klammern');

  // 8 Personen mit R04: B12 erst mit FUNK
  const n8 = await H.evaluate(() => KD.encode({ host: false, role: 3, n: 8, variants: 0 }));
  const Q = await page(); await Q.goto(URL + '#c=' + n8.replace('-', '')); await Q.waitForSelector('.doc');
  await Q.click('[data-tab="bew"]'); await unlock(Q, 'NEBEL');
  ids = await cardIds(Q);
  check(!ids.includes('B12') && ids.includes('B8'), '8 Personen (R04 besetzt, R07 nicht): B12 fehlt ohne FUNK, B8 ist dabei');
  await unlock(Q, 'FUNK'); check((await cardIds(Q)).includes('B12'), 'FUNK → B12');

  // Ein Gerät für Spielleitung und eigene Rolle
  await H.goto(URL + '#c=' + host.people[0].code.replace('-', '')); await H.waitForSelector('.doc');
  await H.goto(URL + '#leitung'); await H.waitForSelector('.tabs');
  check(/Der Abend/.test(await H.textContent('h1')), 'Spielleitung und eigenes Rollenblatt auf einem Gerät: beide erreichbar');

  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nKrimidinner in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
