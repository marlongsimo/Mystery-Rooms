/*
 * Krimidinner Fall 03 „Vorhang aus Lügen“ auf der gemeinsamen Engine – Ablauf im Browser
 * 6 Personen anlegen → Codes v2 → alle Rollen öffnen (Varianten, Vorwissen) → Reiter „Theater“ →
 * VORHANG, KULISSE (gestaffelt, ohne Rollenteil), KLAPPE, TONBAND, VEILCHEN, APPLAUS → bedingte Karten B9/B10, B17/B18 →
 * Aussagekarten R07–R10 → geführter Ablauf (9 Schritte, „P2b“) → Druck → 10 Personen → Codes anderer Fälle.
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/mirage/tests/mirage.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/krimidinner/mirage/index.html';
const { chromium } = require('playwright');
const OPEN = /\[[^\]]* \/ [^\]]*\]|\{R\d\d:/;
const LEAK = /Mord|Ermittlung|Leiche|Tatzeit|Tatwaffe|Alibi|verdächtig|Polizei|\btot\b/i;
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const cardIds = (p) => p.$$eval('.ecard:not(.npc-card) header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  const npcCount = (p) => p.$$eval('.npc-card', (s) => s.length);
  const unlock = async (p, w) => { await p.fill('#word', w); await p.click('#unl'); await p.waitForTimeout(150); };

  const H = await page();
  await H.goto(URL);
  check(/Vorhang aus Lügen/.test(await H.textContent('h1')) && /6–10 Personen/.test(await H.textContent('.lead')), 'Startseite: Titel und 6–10 Personen');
  await H.click('a[href="#anlegen"]'); await H.waitForSelector('[data-name]');
  check((await H.$$('[data-name]')).length === 6, 'Anlegen beginnt mit 6 Personen');
  const names = ['Anna', 'Ben', 'Cem', 'Dora', 'Emil', 'Fritzi'];
  for (let i = 0; i < 6; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await H.click('[data-v="1|1"]');
  await H.click('[data-deal]'); await H.waitForSelector('.bigcode');
  const host = await H.evaluate(() => JSON.parse(localStorage.getItem('kd_mira_host')));
  check(host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)), 'Codes im Format XXX-XXX-XXX');
  const dec = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  check(JSON.stringify(dec.map((d) => d.role).sort()) === JSON.stringify(['R01', 'R02', 'R03', 'R04', 'R05', 'R06']), 'Besetzung für 6: R01–R06, Täterrolle R06 dabei');

  const by = {};
  for (let i = 0; i < 6; i++) {
    const P = await page();
    await P.goto(URL + '#c=' + host.people[i].code.replace(/-/g, '')); await P.waitForSelector('.doc');
    const d = dec[i]; by[d.role] = P;
    let pre = await P.textContent('.doc');
    await P.click('[data-tab="p1"]'); pre += await P.textContent('.doc');
    await P.click('[data-tab="p2"]'); await P.click('#s4'); pre += await P.textContent('.doc');
    check(!OPEN.test(pre), `${d.role} „${await P.textContent('h1')}“: offene Teile ohne Variantenklammern`);
    if (d.role !== 'R06') check(!LEAK.test(pre), `${d.role}: nichts aus der Nacht vor Runde 1`);
  }
  const A = by.R01;
  const tabs = await A.$$eval('.tabs button', (x) => x.map((y) => y.textContent.trim()));
  check(JSON.stringify(tabs.slice(0, 5)) === JSON.stringify(['Charakter', 'Kleidung', 'Vertraulich', 'Regeln', 'Theater']) && tabs.filter((t) => /Runde \d/.test(t)).length === 4, 'Reiter: …, Regeln, Theater, Runde 1–4');
  await A.click('[data-tab="haus"]');
  check(Boolean(await A.$('.plan-wrap svg')) && !/Künstlergang/.test(await A.textContent('#pane')), 'Theaterplan sofort sichtbar, ohne den alten Künstlergang');

  await A.click('[data-tab="bew"]');
  await unlock(A, 'vorhang');
  check(JSON.stringify(await cardIds(A)) === JSON.stringify(['B1', 'B2', 'B3']) && (await npcCount(A)) === 4, 'VORHANG → B1–B3 und 4 Aussagekarten (R07–R10)');
  await A.click('[data-tab="p3"]'); check(/Runde 1|Deine Nacht/.test(await A.textContent('.doc')), 'VORHANG öffnet Runde 1 im Rollenblatt');
  check(/🔒/.test(await A.textContent('[data-tab="p4"]')), 'Runde 2 bleibt zu');
  await A.click('[data-tab="bew"]'); await unlock(A, 'KULISSE');
  let ids = await cardIds(A);
  check(ids.includes('B4') && ids.includes('B5') && !ids.includes('B6'), 'KULISSE → B4, B5 (gestaffelt)');
  check(/🔒/.test(await A.textContent('[data-tab="p4"]')), 'KULISSE öffnet keinen Rollenteil');
  await unlock(A, 'KLAPPE'); ids = await cardIds(A);
  check(ids.includes('B8') && ids.includes('B10') && !ids.includes('B9'), 'KLAPPE → B6–B8 und B10 (Malven fehlt), nicht B9');
  await unlock(A, 'TONBAND'); ids = await cardIds(A);
  check(['B11', 'B12', 'B13', 'B14'].every((x) => ids.includes(x)), 'TONBAND → B11–B14');
  await unlock(A, 'VEILCHEN'); ids = await cardIds(A);
  check(ids.includes('B15') && ids.includes('B16') && ids.includes('B18') && !ids.includes('B17') && !ids.includes('B19'), 'VEILCHEN → B15, B16, B18 (Thier fehlt), Finale zu');
  check((await npcCount(A)) === 11, 'Alle 11 Aussagekarten von R07–R10');
  check(await A.$eval('.ecard:has(header:has-text("B15")) .plan-wrap svg', (s) => /KÜNSTLERGANG/.test(s.textContent)).catch(() => false) && await A.$eval('.ecard:has(header:has-text("B4")) .plan-wrap svg', (s) => /LÄNGSSCHNITT/.test(s.textContent) && /ÄNDERUNGEN/.test(s.textContent) && !/KÜNSTLERGANG/.test(s.textContent)).catch(() => false), 'B4 Bauamtsplan mit Schnitt und Änderungsfeld, ohne Gang · B15 mit dem Plan von 1938, mit Gang');
  check(!OPEN.test(await A.textContent('.cardlist')), 'Karten und Aussagen ohne offene Klammern');
  const b10 = await A.textContent('.ecard:has(header:has-text("B10"))');
  check(/Das Original ist hier im Haus\. Nach dem letzten Vorhang sagen Sie, wer die Klappe öffnen ließ, oder die Presse bekommt es\./.test(b10) && /Dann zeigen Sie es mir\. Um neun\. Unten\. Wo alles angefangen hat\./.test(b10), 'B10: Wortlaut der Minifon-Aufnahme wie im Fallbuch');
  for (const [rid, P] of Object.entries(by)) {
    if (P !== A) { await P.click('[data-tab="bew"]'); await unlock(P, 'VEILCHEN'); }
    let txt = '';
    for (const k of [3, 4, 5, 6]) { await P.click(`[data-tab="p${k}"]`); txt += await P.textContent('.doc'); }
    check(!OPEN.test(txt), `${rid}: Runde 1–4 offen, ohne Klammern`);
  }
  await by.R06.click('[data-tab="p2"]');
  check(/Du hast Aurel Varn getötet/.test(await by.R06.textContent('.doc')), 'R06: Tat im vertraulichen Teil');

  // Spielleitung
  await H.goto(URL + '#leitung'); await H.waitForSelector('.steps');
  const steps = await H.$$eval('.steps button', (x) => x.map((y) => y.textContent));
  check(steps.length === 9 && steps.includes('P2b'), 'Geführter Ablauf: 9 Schritte mit „P2b“ (Kulisse)');
  await H.click('[data-step="4"]'); await H.click('[data-round="2"]');
  check((await H.textContent('.round .word')) === 'KULISSE' && !/im Rollenblatt/.test(await H.textContent('.round')), 'Schritt Kulisse: Losungswort KULISSE, kein Rollenteil');
  await H.click('[data-step="8"]'); H.once('dialog', (dl) => dl.accept()); await H.click('[data-round="6"]');
  check((await H.textContent('.round .word')) === 'APPLAUS' && /B19/.test(await H.textContent('.round')), 'Finale: APPLAUS öffnet B19');
  await H.click('[data-tab="loesung"]'); H.once('dialog', (dl) => dl.accept()); await H.click('#sol');
  check(/Velten/.test(await H.textContent('.hostdoc')) && !OPEN.test(await H.textContent('.hostdoc')), 'Lösung nennt Velten, ohne Klammern');
  await H.evaluate(() => { window.print = () => {}; });
  await H.click('[data-tab="druck"]'); await H.click('[data-p="cards"]');
  check((await H.$$eval('#print .ecard:not(.npc-card)', (c) => c.length)) === 17 && (await H.$$eval('#print .npc-card', (c) => c.length)) === 11, 'Druck bei 6 Personen: 17 Beweiskarten und 11 Aussagekarten');

  const t = await H.evaluate(() => [6, 7, 9, 10].map((n) => ({ n, b9: KD.cardsFor(3, n, false).includes('B9'), b10: KD.cardsFor(3, n, false).includes('B10'), b17: KD.cardsFor(5, n, false).includes('B17'), b18: KD.cardsFor(5, n, false).includes('B18') })));
  check(t[0].b10 && !t[0].b9 && t[1].b9 && !t[1].b10 && t[2].b17 && !t[2].b18 && t[3].b9 && t[3].b17 && !t[0].b17 && t[0].b18, 'B9/B10 nach Malven, B17/B18 nach Thier');

  // 10 Personen: auch R07–R10 vollständig lesbar
  for (const [ri, rid] of [[6, 'R07'], [7, 'R08'], [8, 'R09'], [9, 'R10']]) {
    for (const v of [0, 1023]) {
      const code = await H.evaluate(([ri, v]) => KD.encode({ host: false, role: ri, n: 10, variants: v }), [ri, v]);
      const P = await page(); await P.goto(URL + '#c=' + code.replace(/-/g, '')); await P.waitForSelector('.doc');
      let pre = await P.textContent('.doc'); await P.click('[data-tab="p1"]'); pre += await P.textContent('.doc'); await P.click('[data-tab="p2"]'); await P.click('#s4'); pre += await P.textContent('.doc');
      await P.click('[data-tab="bew"]'); await unlock(P, 'VEILCHEN');
      let txt = pre; for (const k of [3, 4, 5, 6]) { await P.click(`[data-tab="p${k}"]`); txt += await P.textContent('.doc'); }
      check(!OPEN.test(txt) && !LEAK.test(pre), `${rid} (${v ? 'männlich' : 'weiblich'}, 10 Personen): alle Teile ohne Klammern, kein Vorwissen`);
      await P.context().close();
    }
  }

  // Codes über Fallgrenzen
  const S = await page(); await S.goto(BASE + '/krimidinner/silberkamm/index.html#code'); await S.fill('#codeIn', host.people[0].code); await S.click('#open');
  check(/gehört zu „Vorhang aus Lügen“/.test(await S.textContent('#fb')), 'Mirage-Code auf der Silberkamm-Seite: Hinweis auf „Vorhang aus Lügen“');

  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nVorhang aus Lügen in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
