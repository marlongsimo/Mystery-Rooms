/*
 * Krimidinner Fall 02 „Der letzte Halt“ auf der gemeinsamen Engine – Ablauf im Browser
 * Abend für 6 Personen (Spielleitung kann jede Rolle bekommen) → Codes v2 → jede Rolle öffnen (Varianten, Vorwissen, alle vier Runden) →
 * Zug-Plan → Losungswörter (auch LAEUTWERK) → bedingte Karten B8 (present R03) und B13 (missing R05) → Aussagekarten →
 * geführter Ablauf mit 8 Schritten → Finale B16 → Druck → Codes eines anderen Falls → Live (sektor-9).
 * Aufruf: python3 -m http.server 8765 &  ·  node krimidinner/silberkamm/tests/silberkamm.test.js   (LIVE=0 → ohne Datenbank)
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const URL = BASE + '/krimidinner/silberkamm/index.html';
const EURL = BASE + '/krimidinner/eichenfels/index.html';
const { chromium } = require('playwright');
const OPEN = /\[[^\]]* \/ [^\]]*\]|\{R\d\d:/;
const LEAK = /Mord|Ermittlung|Leiche|Tatzeit|Tatwaffe|Alibi|verdächtig|Polizei|tot /i;
(async () => {
  const b = await chromium.launch();
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const cardIds = (p) => p.$$eval('.ecard:not(.npc-card) header span:last-child', (s) => s.map((x) => x.textContent.split(' ')[0]));
  const npcCount = (p) => p.$$eval('.npc-card', (s) => s.length);
  const unlock = async (p, w) => { await p.fill('#word', w); await p.click('#unl'); await p.waitForTimeout(150); };

  // Spielleitung legt 6 Personen an und markiert sich selbst
  const H = await page();
  await H.goto(URL);
  check(/Der letzte Halt/.test(await H.textContent('h1')) && /6–8 Personen/.test(await H.textContent('.lead')), 'Startseite: Titel und 6–8 Personen aus fall.json');
  await H.click('a[href="#anlegen"]'); await H.waitForSelector('[data-name]');
  check((await H.$$('[data-name]')).length === 6, 'Anlegen beginnt mit 6 Personen (players.min)');
  const names = ['Anna', 'Ben', 'Cem', 'Dora', 'Emil', 'Fritzi'];
  for (let i = 0; i < 6; i++) await H.fill(`[data-name="${i}"]`, names[i]);
  await H.click('[data-v="1|1"]');
  check(!(await H.$('[data-host]')), 'Keine Markierung „Das bin ich“: Die Spielleitung kann jede Rolle bekommen');
  await H.click('[data-deal]'); await H.waitForSelector('.bigcode');
  const host = await H.evaluate(() => JSON.parse(localStorage.getItem('kd_silb_host')));
  check(host.people.length === 6 && host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)) && /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(host.code), 'Sechs Codes und Spielleitungscode im Format XXX-XXX-XXX');
  const dec = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  check(JSON.stringify(dec.map((d) => d.role).sort()) === JSON.stringify(['R01', 'R02', 'R04', 'R06', 'R07', 'R08']), 'Besetzung für 6: R01, R02, R04, R06, R07, R08');
  const share = await H.evaluate(() => { let k = 0; for (let i = 0; i < 600; i++) if (KD.assign(6, -1)[0] === 'R07') k++; return k / 600; });
  check(share > 0.1 && share < 0.25, `Täterrolle für jede Person gleich wahrscheinlich, auch für die Spielleitung (${Math.round(share * 100)} %, erwartet ~17 %)`);
  check(await H.evaluate(() => KD.decode('ABC-DEF') === null), 'Eichenfels-v1-Format gilt hier nicht');

  // Codes über Fallgrenzen
  const eCode = await (async () => { const E = await page(); await E.goto(EURL); const c = await E.evaluate(() => KD.encode({ host: false, role: 1, n: 5, variants: 0 })); return c; })();
  await H.goto(URL + '#code'); await H.fill('#codeIn', eCode); await H.click('#open');
  check(/gehört zu „Der letzte Stern von Eichenfels“/.test(await H.textContent('#fb')) && Boolean(await H.$('#fb a[href*="eichenfels/index.html#c="]')), 'Eichenfels-Code auf der Silberkamm-Seite: Hinweis mit Link zum richtigen Fall');
  const E2 = await page(); await E2.goto(EURL + '#code'); await E2.fill('#codeIn', host.people[1].code); await E2.click('#open');
  check(/gehört zu „Der letzte Halt“/.test(await E2.textContent('#fb')), 'Silberkamm-Code auf der Eichenfels-Seite: Hinweis auf „Der letzte Halt“');

  // Jede Person öffnet ihr Rollenblatt
  const by = {};
  for (let i = 0; i < 6; i++) {
    const P = await page();
    await P.goto(URL + '#c=' + host.people[i].code.replace(/-/g, '')); await P.waitForSelector('.doc');
    const d = dec[i]; by[d.role] = P;
    let pre = await P.textContent('.doc');
    await P.click('[data-tab="p1"]'); pre += await P.textContent('.doc');
    await P.click('[data-tab="p2"]'); await P.click('#s4'); pre += await P.textContent('.doc');
    check(!OPEN.test(pre), `${names[i]} → ${d.role} „${await P.textContent('h1')}“: offene Teile ohne Variantenklammern`);
    if (d.role !== 'R07') check(!LEAK.test(pre), `${d.role}: Charakter, Kleidung und Vertraulich verraten nichts aus der Nacht`);
  }
  check(/Pascal|Emil|Heinrich|Viktor|Ludwig|Paul|Jakob/.test(await by[dec[1].role].textContent('h1')), 'Ben hat die männliche Variante');
  const A = by.R02;
  const tabs = await A.$$eval('.tabs button', (x) => x.map((y) => y.textContent.trim()));
  check(JSON.stringify(tabs.slice(0, 5)) === JSON.stringify(['Charakter', 'Kleidung', 'Vertraulich', 'Regeln', 'Zug']) && tabs.filter((t) => /Runde \d/.test(t)).length === 4, 'Reiter: Charakter, Kleidung, Vertraulich, Regeln, Zug, dann Runde 1–4');
  await A.click('[data-tab="haus"]');
  check(Boolean(await A.$('.plan-wrap svg')) && /DER ZUG/.test(await A.textContent('#pane')), 'Reiter „Zug“: Wagenplan sofort sichtbar');
  // Runden
  await A.click('[data-tab="p3"]'); check(await A.isVisible('.seal'), 'Runde 1 vor dem Losungswort gesperrt');
  await unlock(A, 'salon');
  check(/Deine Nacht ab 22 Uhr/.test(await A.textContent('.doc')), 'SALON öffnet Runde 1 im Rollenblatt');
  await A.click('[data-tab="bew"]');
  check(JSON.stringify(await cardIds(A)) === JSON.stringify(['B1', 'B2', 'B3', 'B4']) && (await npcCount(A)) === 2, 'SALON → B1–B4 und 2 Aussagekarten (Lorenz, Bell fehlen)');
  await unlock(A, 'SIGNAL'); let ids = await cardIds(A);
  check(ids.includes('B7') && !ids.includes('B8'), 'SIGNAL → B5–B7, B8 fehlt (Bell nicht besetzt)');
  await unlock(A, 'laeutwerk'); ids = await cardIds(A);
  check(ids.includes('B12') && ids.includes('B13'), 'LAEUTWERK (ohne Umlaut) → B9–B12 und B13 (Lorenz nicht besetzt)');
  await unlock(A, 'KILOMETER'); ids = await cardIds(A);
  check(ids.includes('B14') && ids.includes('B15') && !ids.includes('B16'), 'KILOMETER → B14, B15, Finale noch zu');
  check((await npcCount(A)) === 7, 'Alle 7 Aussagekarten von Lorenz und Bell nach Runde 4');
  check(!OPEN.test(await A.textContent('.cardlist')), 'Karten und Aussagen ohne offene Klammern');
  // alle Runden aller Rollen ohne offene Klammern
  for (const [rid, P] of Object.entries(by)) {
    if (P !== A) { await P.click('[data-tab="bew"]'); await unlock(P, 'KILOMETER'); }
    let txt = '';
    for (const k of [3, 4, 5, 6]) { await P.click(`[data-tab="p${k}"]`); txt += await P.textContent('.doc'); }
    check(!OPEN.test(txt) && /Runde 4|Die Wahrheit|Finale/.test(txt), `${rid}: Runde 1–4 offen, ohne Klammern`);
  }
  const R7 = by.R07; await R7.click('[data-tab="p2"]');
  check(/Du hast Konstantin von Auen getötet/.test(await R7.textContent('.doc')), 'R07: Tat im vertraulichen Teil');

  // Spielleitung: geführter Ablauf
  await H.goto(URL + '#leitung'); await H.waitForSelector('.steps');
  check((await H.$$('.steps button')).length === 8, 'Geführter Ablauf: 8 Schritte (Vorbereitung, Start, Phase 1–5, Finale)');
  check(/Nebenfiguren: R03 · R05/.test(await H.textContent('#pane')), 'Vorbereitung nennt Nebenfiguren R03 und R05');
  await H.click('[data-step="2"]');
  const intro = await H.$$eval('.step-doc table', (ts) => { const t = ts.find((x) => x.querySelector('th') && x.querySelector('th').textContent.trim() === 'Nebenfigur'); return t ? [...t.querySelectorAll('tbody tr td:first-child')].map((x) => x.textContent.trim()) : []; });
  check(JSON.stringify(intro) === JSON.stringify(['R03', 'R05']), 'Phase 1: Vorstellung von Bell und Lorenz als Nebenfiguren');
  await H.click('[data-step="5"]'); await H.click('[data-round="3"]');
  check((await H.textContent('.round .word')) === 'LÄUTWERK' && /B13/.test(await H.textContent('.round')), 'Phase 4: LÄUTWERK, öffnet auch B13');
  await H.click('[data-step="7"]');
  H.once('dialog', (dl) => dl.accept()); await H.click('[data-round="5"]');
  check((await H.textContent('.round .word')) === 'SCHNEE' && /B16/.test(await H.textContent('.round')), 'Finale: SCHNEE öffnet B16');
  await H.click('[data-tab="loesung"]'); H.once('dialog', (dl) => dl.accept()); await H.click('#sol');
  check(/Brandl/.test(await H.textContent('.hostdoc')) && !OPEN.test(await H.textContent('.hostdoc')), 'Lösung: Teil B nennt Brandl, keine offenen Klammern');
  await A.click('[data-tab="bew"]'); await unlock(A, 'schnee');
  check((await cardIds(A)).includes('B16'), 'Gast: SCHNEE → B16');
  // Druck
  await H.evaluate(() => { window.print = () => {}; });
  await H.click('[data-tab="druck"]'); await H.click('[data-p="cards"]');
  check((await H.$$eval('#print .ecard:not(.npc-card)', (c) => c.length)) === 15 && (await H.$$eval('#print .npc-card', (c) => c.length)) === 7, 'Druck bei 6 Personen: 15 Beweiskarten und 7 Aussagekarten');
  await H.click('[data-p="roles"]');
  check((await H.$$eval('#print .p-doc', (c) => c.length)) === 42, 'Druck: 6 Rollen × 7 Teile');

  // 7 und 8 Personen
  const t = await H.evaluate(() => [6, 7, 8].map((n) => ({ n, b8: KD.cardsFor(2, n, false).includes('B8'), b13: KD.cardsFor(3, n, false).includes('B13'), r07: KD.cast(n).includes('R07') })));
  check(t[0].b13 && !t[0].b8 && !t[1].b13 && !t[1].b8 && t[2].b8 && !t[2].b13 && t.every((x) => x.r07), 'B8 nur mit Bell (8 Personen), B13 nur ohne Lorenz (6 Personen), R07 immer besetzt');

  // Live über die gemeinsame Kennung (Test über sektor-9, damit unabhängig vom Katalog)
  if (process.env.LIVE !== '0') {
    const L = URL + '?liveslug=sektor-9';
    const LH = await page(); LH.on('dialog', (dl) => dl.accept()); await LH.goto(L);
    await LH.evaluate((c) => localStorage.setItem('kd_silb_host', JSON.stringify({ code: c, people: [], seen: {}, step: 3 })), host.code);
    await LH.goto(L + '#leitung'); await LH.reload(); await LH.waitForSelector('#liveStart'); await LH.click('#liveStart');
    await LH.waitForSelector('.live.on .lcode', { timeout: 30000 });
    const room = (await LH.textContent('.live.on .lcode')).trim();
    const LG = await page(); await LG.goto(L + '#c=' + host.people[2].code.replace(/-/g, '')); await LG.waitForSelector('.doc');
    await LG.click('.live summary'); await LG.fill('#liveCode', room); await LG.fill('#liveName', 'Cem'); await LG.click('#liveJoin');
    await LG.waitForSelector('.live.on', { timeout: 30000 });
    await LH.click('[data-round="1"]');
    let opened = false; for (let k = 0; k < 60 && !opened; k++) { await LG.waitForTimeout(500); opened = !/🔒/.test(await LG.textContent('[data-tab="p3"]')); }
    check(opened, `Live (${room}): Runde 1 öffnet sich beim Gast von selbst`);
    const fallState = await LG.evaluate(() => KD.live().states.fall);
    check(fallState && fallState.id === 'silberkamm' && fallState.nr === 2, 'Live: Sitzungsstand nennt den Fall (silberkamm, 2)');
    await LH.click('#liveEnd');
  }

  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nDer letzte Halt in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
