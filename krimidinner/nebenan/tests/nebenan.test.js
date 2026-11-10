/*
 * Krimidinner Fall 04 „Nebenan – Der stille Kreis“ auf der gemeinsamen Engine – Ablauf im Browser
 * 5 Personen anlegen → Codes v2 → alle Rollen öffnen (Varianten, kein Kreis-Wissen bei Nicht-Mitgliedern vor Runde 2) →
 * Reiter „Haus“ → LEITER, STILLE, VORDRUCK, FADEN, ZURÜCK → bedingte Karten B19/B20 → geführter Ablauf → Druck →
 * 10 Personen (R06–R10 beide Varianten) → Codes anderer Fälle.
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/nebenan/tests/nebenan.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/krimidinner/nebenan/index.html';
const { chromium } = require('playwright');
const OPEN = /\[[^\]]* \/ [^\]]*\]|\{R\d\d:/;
const KREIS = /Stille[rn]? (Kreis|Stunde)|Formular G|\bPat(e|in|en)\b|Geständnisarchiv/;
const MEMBERS = ['R01', 'R03', 'R04', 'R10'];
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const cardIds = (p) => p.$$eval('.ecard:not(.npc-card) header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  const unlock = async (p, w) => { await p.fill('#word', w); await p.click('#unl'); await p.waitForTimeout(150); };
  // Charakter, Kleidung, Vertraulich und Runde 1 lesen (alles, was vor STILLE offen ist)
  const beforeR2 = async (P) => { let t = await P.textContent('.doc'); await P.click('[data-tab="p1"]'); t += await P.textContent('.doc'); await P.click('[data-tab="p2"]'); if (await P.$('#s4')) await P.click('#s4'); t += await P.textContent('.doc'); return t; };

  const H = await page();
  await H.goto(URL);
  check(/Nebenan/.test(await H.textContent('h1')) && /5–10 Personen/.test(await H.textContent('.lead')), 'Startseite: Titel und 5–10 Personen');
  await H.click('a[href="#anlegen"]'); await H.waitForSelector('[data-name]');
  check((await H.$$('[data-name]')).length === 5, 'Anlegen beginnt mit 5 Personen');
  const names = ['Anna', 'Ben', 'Cem', 'Dora', 'Emil'];
  for (let i = 0; i < 5; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await H.click('[data-v="1|1"]');
  await H.click('[data-deal]'); await H.waitForSelector('.bigcode');
  const host = await H.evaluate(() => JSON.parse(localStorage.getItem('kd_neb_host')));
  check(host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)), 'Codes im Format XXX-XXX-XXX');
  const dec = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  check(JSON.stringify(dec.map((d) => d.role).sort()) === JSON.stringify(['R01', 'R02', 'R03', 'R04', 'R05']), 'Besetzung für 5: R01–R05, Täterrolle R03 dabei');

  const by = {};
  for (let i = 0; i < 5; i++) {
    const P = await page();
    await P.goto(URL + '#c=' + host.people[i].code.replace(/-/g, '')); await P.waitForSelector('.doc');
    const d = dec[i]; by[d.role] = P;
    const pre = await beforeR2(P);
    check(!OPEN.test(pre), `${d.role} „${await P.textContent('h1')}“: offene Teile ohne Variantenklammern`);
    if (!MEMBERS.includes(d.role)) check(!KREIS.test(pre), `${d.role}: kein Wissen über den Kreis vor Runde 2`);
  }
  const A = by.R02;
  const tabs = await A.$$eval('.tabs button', (x) => x.map((y) => y.textContent.trim()));
  check(JSON.stringify(tabs.slice(0, 5)) === JSON.stringify(['Charakter', 'Kleidung', 'Vertraulich', 'Regeln', 'Haus']) && tabs.filter((t) => /Runde \d/.test(t)).length === 4, 'Reiter: …, Regeln, Haus, Runde 1–4');
  await A.click('[data-tab="haus"]');
  const plan = await A.textContent('#pane');
  check(Boolean(await A.$('.plan-wrap svg')) && /Beratungsraum/.test(plan) && !/Aktenvernichter|Archiv/.test(plan), 'Hausplan sofort sichtbar, ohne Archiv und Aktenvernichter');

  await A.click('[data-tab="bew"]');
  await unlock(A, 'leiter');
  check(JSON.stringify(await cardIds(A)) === JSON.stringify(['B1', 'B2', 'B3', 'B4']), 'LEITER → B1–B4');
  check(await A.$eval('.ecard:has(header:has-text("B1")) .plan-wrap svg', (s) => /ZURÜCK/.test(s.textContent)).catch(() => false), 'B1 zeigt die Fundskizze mit dem Karton „ZURÜCK“');
  await A.click('[data-tab="p3"]'); check(/Der Sturz/.test(await A.textContent('.doc')), 'LEITER öffnet Runde 1 im Rollenblatt');
  check(/🔒/.test(await A.textContent('[data-tab="p4"]')), 'Runde 2 bleibt zu');
  await A.click('[data-tab="bew"]'); await unlock(A, 'STILLE');
  let ids = await cardIds(A);
  check(['B5', 'B6', 'B7', 'B8'].every((x) => ids.includes(x)) && !ids.includes('B9'), 'STILLE → B5–B8');
  await unlock(A, 'VORDRUCK'); ids = await cardIds(A);
  check(['B9', 'B10', 'B11', 'B13', 'B14'].every((x) => ids.includes(x)) && !ids.includes('B12') && !ids.includes('B15'), 'VORDRUCK → B9–B11, B13, B14, die Streifen B12 noch nicht');
  await unlock(A, 'STREIFEN'); ids = await cardIds(A);
  check(ids.includes('B12') && !ids.includes('B15'), 'STREIFEN → B12 (Seiferts Moment)');
  await A.click('[data-tab="p6"]'); check(/🔒/.test(await A.textContent('[data-tab="p6"]')), 'STREIFEN öffnet keinen Rollenteil');
  await A.click('[data-tab="bew"]'); await unlock(A, 'FADEN'); ids = await cardIds(A);
  check(['B15', 'B16', 'B18', 'B19', 'B20', 'B22'].every((x) => ids.includes(x)) && !ids.includes('B17') && !ids.includes('B21'), 'FADEN → B15, B16, B18–B20, B22, die Rückseite B17 noch nicht');
  check(!/Linde/.test(await A.textContent('.ecard:has(header:has-text("B18"))')), 'B18 nennt niemanden');
  await unlock(A, 'rueckseite'); ids = await cardIds(A);
  check(ids.includes('B17') && !ids.includes('B21'), 'RÜCKSEITE (auch als RUECKSEITE) → B17 (Kranz’ Moment), Finale zu');
  check(!OPEN.test(await A.textContent('.cardlist')), 'Karten ohne offene Klammern');
  for (const [rid, P] of Object.entries(by)) {
    if (P !== A) { await P.click('[data-tab="bew"]'); await unlock(P, 'RÜCKSEITE'); }
    let txt = '';
    for (const k of [3, 4, 5, 6]) { await P.click(`[data-tab="p${k}"]`); txt += await P.textContent('.doc'); }
    check(!OPEN.test(txt), `${rid}: Runde 1–4 offen, ohne Klammern`);
  }
  await by.R03.click('[data-tab="p2"]');
  check(/Du hast Hanno Rabe getötet/.test(await by.R03.textContent('.doc')), 'R03: Tat im vertraulichen Teil');

  // Spielleitung
  await H.goto(URL + '#leitung'); await H.waitForSelector('.steps');
  const steps = await H.$$eval('.steps button', (x) => x.map((y) => y.textContent));
  check(steps.length === 10 && steps.includes('P4b') && steps.includes('P5b'), 'Geführter Ablauf: 10 Schritte mit P4b (Streifen) und P5b (Rückseite)');
  await H.click('[data-step="9"]'); H.once('dialog', (dl) => dl.accept()); await H.click('[data-round="7"]');
  check(/ZUR/.test(await H.textContent('.round .word')) && /B21/.test(await H.textContent('.round')), 'Finale: ZURÜCK öffnet B21');
  await H.click('[data-tab="loesung"]'); H.once('dialog', (dl) => dl.accept()); await H.click('#sol');
  check(/Linde/.test(await H.textContent('.hostdoc')) && !OPEN.test(await H.textContent('.hostdoc')), 'Lösung nennt Linde, ohne Klammern');
  await H.evaluate(() => { window.print = () => {}; });
  await H.click('[data-tab="druck"]'); await H.click('[data-p="cards"]');
  check((await H.$$eval('#print .ecard:not(.npc-card)', (c) => c.length)) === 22, 'Druck bei 5 Personen: 22 Beweiskarten');

  const t = await H.evaluate(() => [5, 7, 9, 10].map((n) => ({ n, b19: KD.cardsFor(5, n, false).includes('B19'), b20: KD.cardsFor(5, n, false).includes('B20'), b22: KD.cardsFor(5, n, false).includes('B22') })));
  check(t[0].b19 && t[0].b20 && t[1].b19 && !t[1].b20 && !t[2].b19 && !t[3].b19 && !t[3].b20 && t.every((x) => x.b22), 'B19 nach Wiesner, B20 nach Özdemir, B22 immer');

  // 10 Personen: R06–R10 vollständig lesbar, Nicht-Mitglieder ohne Kreis-Wissen vor Runde 2
  for (const [ri, rid] of [[5, 'R06'], [6, 'R07'], [7, 'R08'], [8, 'R09'], [9, 'R10']]) {
    for (const v of [0, 1023]) {
      const code = await H.evaluate(([ri, v]) => KD.encode({ host: false, role: ri, n: 10, variants: v }), [ri, v]);
      const P = await page(); await P.goto(URL + '#c=' + code.replace(/-/g, '')); await P.waitForSelector('.doc');
      const pre = await beforeR2(P);
      await P.click('[data-tab="bew"]'); await unlock(P, 'RÜCKSEITE');
      let txt = pre; for (const k of [3, 4, 5, 6]) { await P.click(`[data-tab="p${k}"]`); txt += await P.textContent('.doc'); }
      check(!OPEN.test(txt) && (MEMBERS.includes(rid) || !KREIS.test(pre)), `${rid} (${v ? 'männlich' : 'weiblich'}, 10 Personen): alle Teile ohne Klammern${MEMBERS.includes(rid) ? '' : ', kein Kreis-Wissen vor Runde 2'}`);
      await P.context().close();
    }
  }

  // Codes über Fallgrenzen
  const S = await page(); await S.goto(BASE + '/krimidinner/mirage/index.html#code'); await S.fill('#codeIn', host.people[0].code); await S.click('#open');
  check(/gehört zu „Nebenan – Der stille Kreis“/.test(await S.textContent('#fb')), 'Nebenan-Code auf der Mirage-Seite: Hinweis auf „Nebenan“');

  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nNebenan in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
