/*
 * Krimidinner „Der letzte Gast“ – Ablauf im Browser
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
  check(host.people.length === 5 && host.people.every((p) => /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(p.code)), 'Fünf Codes im Format XXX-XXX-XXX (Code v2)');
  check(!(await H.textContent('main')).match(/R0\d|R10|Rademacher|Marwitz/), 'Die Spielleitung sieht keine Rollen, nur Codes');
  const decoded = await H.evaluate((h) => h.people.map((p) => KD.decode(p.code)), host);
  check(JSON.stringify(decoded.map((d) => d.role).sort()) === JSON.stringify(['R01', 'R02', 'R08', 'R09', 'R10']), 'Besetzung für 5: R01, R02, R08, R09, R10');
  check(decoded.every((d) => d.variants === decoded[0].variants && d.n === 5), 'Alle Codes tragen dieselben Varianten und n = 5');
  check(await H.evaluate(() => KD.decode('ABC-DEF') === null && KD.decode('') === null && KD.decode('ABC-DEF-GHJ') === null), 'Falsche Codes werden abgelehnt');
  // alte 6-Zeichen-Codes (v1) gelten weiter
  const v1 = await H.evaluate(() => { const c = KD.encodeV1({ host: false, role: 7, n: 5, variants: 1 << 7 }); const d = KD.decode(c); return { c, d }; });
  check(/^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(v1.c) && v1.d && v1.d.role === 'R08' && v1.d.n === 5 && v1.d.v === 1 && (v1.d.variants & (1 << 7)), 'Alter 6-Zeichen-Code (v1) öffnet weiter dieselbe Rolle');
  check(await H.evaluate(() => [...Array(200)].every(() => { const v = Math.floor(Math.random() * 1024), n = 4 + Math.floor(Math.random() * 7), r = KD.cast(n)[Math.floor(Math.random() * n)], i = ['R01','R02','R03','R04','R05','R06','R07','R08','R09','R10'].indexOf(r); const d = KD.decode(KD.encode({ host: false, role: i, n, variants: v })); return d && d.role === r && d.n === n && d.variants === v && d.v === 2; })), 'Code v2: 200 zufällige Codes hin und zurück');
  check(await H.evaluate(() => { const c = KD.encode({ host: false, role: 1, n: 5, variants: 0 }).replace(/-/g, ''); let bad = 0; for (let i = 0; i < c.length; i++) for (const ch of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') { if (ch === c[i]) continue; const d = KD.decode(c.slice(0, i) + ch + c.slice(i + 1)); if (d && !d.other) bad++; } return bad < 4; }), 'Code v2: Tippfehler in einem Zeichen werden (fast) immer erkannt');

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
    if (d.role !== 'R08') check(!/21:(0[3-9]|[1-3]\d)/.test(txt) && !/Mord|Ermittlung|Kalender steht|Leiche|Tatzeit|Tatwaffe|Alibi|verdächtig\b/i.test(txt.replace(/verdächtig\./g, '')), `${d.role}: Charakter, Kleidung und Vertraulich verraten nichts aus der Mordnacht`);
    if (names[i] === 'Ben' || names[i] === 'Dora') check(male, `${names[i]} hat die männliche Variante`);
  }
  const A = by.R02.P;
  await A.click('[data-tab="p1"]');
  const heads = await A.$$eval('.doc thead th', (t) => t.map((x) => x.textContent.trim()));
  check(heads.length === 2 && heads[1] === 'Deine Variante', 'Kleidungstabelle zeigt nur die eigene Variante');
  // Regeln und Grundriss für alle, sofort
  const tabOrder = await A.$$eval('.tabs button', (b) => b.map((x) => x.dataset.tab));
  check(tabOrder.indexOf('anl') === 3 && tabOrder.indexOf('haus') === 4, 'Reiter „Regeln“ und „Haus“ direkt nach „Vertraulich“, vor den Runden');
  await A.click('[data-tab="haus"]');
  check(Boolean(await A.$('.plan-wrap svg')) && !/Sammlungsschutz|verriegelt, auch/.test(await A.textContent('#pane')), 'Haus: Grundriss sofort sichtbar, Schließregeln erst auf B3');
  await A.click('[data-tab="anl"]');
  const rl = await A.textContent('#pane');
  check(/Regel 2/.test(rl) && /Losungswort/.test(rl) && /Anklage/.test(rl), 'Regeln: fünf Regeln, Ablauf und Anklage sofort sichtbar');
  check(!/Worum es geht|Die Spielleitung trägt alle Namen ein/.test(rl), 'Regeln im Rollenblatt ohne Klappentext und Vorbereitung');
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
  const r8v = await R8.textContent('.doc');
  check(r8v.indexOf('Spickzettel') >= 0 && r8v.indexOf('Spickzettel') < r8v.indexOf('Du hast Professor'), 'R08: Spickzettel ganz vorn im vertraulichen Teil');
  check(/Zweite Linie/.test(r8v) && /Den Verkauf gibst du zu, den Mord nie/.test(r8v), 'R08: zweite Verteidigungslinie vorhanden');
  // Beweise
  await A.click('[data-tab="bew"]');
  check(JSON.stringify((await cardIds(A)).filter((x) => /^B/.test(x))) === JSON.stringify(['B1', 'B2', 'B3', 'B4']), 'Nach KUPPEL: Beweise B1–B4');
  const npcR1 = await A.$$eval('.npc-card h4', (h) => h.map((x) => x.textContent));
  check(npcR1.length === 5 && npcR1.every((x) => /^Aussage · /.test(x)) && !(await A.textContent('.cardlist')).match(/\{R0|\[[^\]]* \/ /), 'Nach KUPPEL: 5 Aussagekarten der fehlenden Rollen (' + npcR1.map((x) => x.replace('Aussage · ', '')).join(', ') + ')');
  check(!npcR1.some((x) => /Marwitz|Rademacher|Faber|Falk|Sander$/.test(x) && !/Leonie|Leon /.test(x)), 'Keine Aussagekarte einer besetzten Rolle');
  await unlock(A, 'ORION');
  let ids = await cardIds(A);
  check(ids.includes('B8') && ids.includes('B5') && !ids.includes('B9'), 'ORION → B5–B8 (B8, weil R07 fehlt)');
  check((await A.$$('.npc-card')).length === 9, 'Nach ORION: 4 weitere Aussagekarten (zusammen 9)');
  await A.click('[data-tab="p4"]'); check(/Jetzt fällt dir ein/.test(await A.textContent('.doc')), 'ORION öffnet auch Runde 2 im Rollenblatt');
  await A.click('[data-tab="bew"]'); await unlock(A, 'NEBEL');
  ids = await cardIds(A);
  check(ids.includes('B11') && ids.includes('B12') && !ids.includes('B13'), 'NEBEL → B9–B12 (B12, weil R04 fehlt), Finale noch zu');
  check((await A.$$('.npc-card')).length === 11, 'Nach NEBEL: 2 weitere Aussagekarten (zusammen 11 bei 5 Personen)');
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
  check((await H.$$eval('#print .ecard:not(.npc-card)', (c) => c.length)) === 14 && (await H.$$eval('#print .npc-card', (c) => c.length)) === 11, 'Druck: 14 Beweiskarten (B3 als eigenes Blatt) und 11 Aussagekarten');
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

  // Alle Besetzungen 4–10: Zusatzkarten und Wissen der Nebenfiguren
  const table = await Q.evaluate(() => [4, 5, 6, 7, 8, 9, 10].map((n) => { const c = KD.cast(n), miss = ['R01','R02','R03','R04','R05','R06','R07','R08','R09','R10'].filter((r) => !c.includes(r));
    return { n, b8: KD.cardsFor(2, n, false).includes('B8'), b12: KD.cardsFor(3, n, false).includes('B12'), npc: window.KD_CONTENT.npc.filter((x) => miss.includes(x.role)).length, core: ['R02','R08','R09','R10'].every((r) => c.includes(r)) }; }));
  console.log('    ' + table.map((t) => `${t.n}P: B8 ${t.b8 ? 'ja' : '–'} · B12 ${t.b12 ? 'ja' : '–'} · Nebenfiguren-Sätze ${t.npc}`).join('\n    '));
  check(table.every((t) => t.core), 'Alle Besetzungen enthalten R02, R08, R09, R10 (Täterrolle immer dabei)');
  check(table.find((t) => t.n === 4).npc === 13 && table.find((t) => t.n === 10).npc === 0, '4 Personen: alle 13 Nebenfiguren-Sätze · 10 Personen: keiner');
  check(table.every((t) => t.b8 === (t.n < 10) && t.b12 === (t.n < 8)), 'B8 nur ohne R07 (unter 10), B12 automatisch nur ohne R04 (unter 8)');
  // Männliche Variante von R03 in den Nebenfiguren-Sätzen
  const hm = await H.evaluate(() => KD.encode({ host: true, n: 4, variants: 1 << 2 }));
  await H.evaluate((c) => localStorage.setItem('kd_eich_host', JSON.stringify({ code: c, people: [], seen: {}, step: 4 })), hm);
  await H.goto(URL + '#leitung'); await H.reload(); await H.waitForSelector('.npc');
  const t3 = await H.textContent('.npc');
  check(/Der Termin mit ihm war um 22:30/.test(t3) && !OPEN.test(t3), '4 Personen, Ritter männlich: „Der Termin mit ihm“');
  check((await H.$$('.npc blockquote')).length === 5, '4 Personen, Phase 3: fünf Sätze fehlender Rollen (R01, R03, R05 ×2, R07)');

  // Ein Gerät für Spielleitung und eigene Rolle
  await H.goto(URL + '#c=' + host.people[0].code.replace('-', '')); await H.waitForSelector('.doc');
  await H.goto(URL + '#leitung'); await H.waitForSelector('.tabs');
  check(/Der Abend/.test(await H.textContent('h1')), 'Spielleitung und eigenes Rollenblatt auf einem Gerät: beide erreichbar');

  console.log(errs.join('\n') || '  ✓ keine Fehler'); if (errs.length) ok = false;
  await b.close(); console.log(ok ? '\nKrimidinner in Ordnung.' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
