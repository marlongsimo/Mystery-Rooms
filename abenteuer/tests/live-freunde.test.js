/*
 * Mythara – Freunde und Kampagnen-Einladungen gegen die echte Datenbank (Migration 003).
 * Zwei neue Testkonten A und B: A findet B über den Namen und schickt eine Anfrage → B sieht die Glocke mit 1 →
 * nimmt an → A startet eine neue Kampagne und lädt B ein → B sieht die Gruppenanfrage → nimmt an →
 * die Kampagne steht bei B als „Mitspieler“. Dazu: Gäste haben keine Freunde. Aufräumen: Kampagne und Freundschaft löschen.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-freunde.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (name) => { const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const PW = 'Mythara-Test-1', N = () => 'Test_' + Math.random().toString(36).slice(2, 8);
  const registrieren = async (p, name) => {
    await p.goto(BASE + '/abenteuer/index.html'); await p.click('#my-reg');
    await p.fill('#my-reg-name', name); await p.fill('#my-reg-pw', PW); await p.fill('#my-reg-pw2', PW); await p.click('#my-reg-form .my-knopf');
    return until(p, () => !document.querySelector('#hub').hidden);
  };
  const A = await page('A'), B = await page('B'), nA = N(), nB = N();
  check(await registrieren(A, nA) && await registrieren(B, nB), `Zwei Konten: ${nA} und ${nB}`);

  // Gast: keine Freunde
  const G = await page('Gast');
  await G.goto(BASE + '/abenteuer/index.html?testlauf'); await G.click('#my-gast-start'); await G.click('.hub-nav-punkt[data-hub="freunde"]');
  check(await until(G, () => /Spielerkonto/.test(document.querySelector('.kampagnen').textContent)), 'Gast: Freunde-Fenster verweist aufs Konto');

  // A sucht B und schickt eine Anfrage
  await A.click('.hub-nav-punkt[data-hub="freunde"]');
  await A.waitForSelector('#f-name'); await A.fill('#f-name', nB.slice(0, 7)); await A.click('#f-suche .btn');
  check(await until(A, () => /Niemanden/.test(document.querySelector('#f-fb').textContent)), 'Teil des Namens findet niemanden');
  await A.fill('#f-name', nB.toLowerCase()); await A.click('#f-suche .btn');
  check(await until(A, (n) => Boolean(document.querySelector('.f-liste.treffer')) && document.querySelector('.f-liste.treffer').textContent.includes(n), nB), 'Genauer Name (Groß/Klein egal) findet B');
  await A.click('[data-f="anfragen"]');
  check(await until(A, () => /Gesendet/.test(document.querySelector('.kampagnen').textContent)), 'Anfrage gesendet');

  // B sieht die Glocke
  await B.evaluate(() => window.MYTHARA.zeigeHub());
  check(await until(B, () => { const z = document.querySelector('#hub-glocke .hub-zahl'); return z && !z.hidden && z.textContent === '1'; }), 'B: Glocke zeigt 1 Anfrage');
  check(await B.evaluate(() => { const z = document.querySelector('[data-hub="freunde"] .hub-zahl'); return z && !z.hidden; }), 'B: Zahl auch bei „Freunde“');
  await B.click('#hub-glocke');
  await B.waitForSelector('[data-fa="ja"]'); await B.click('[data-fa="ja"]');
  check(await until(B, () => /Keine offenen Anfragen/.test(document.querySelector('.kampagnen').textContent)), 'B nimmt an, keine offenen Anfragen mehr');

  // A startet eine neue Kampagne und lädt B ein
  await A.click('#fenster-zu');
  await A.click('.hub-kachel[data-hub="neu"]');
  await A.waitForSelector('#f-titel'); await A.fill('#f-titel', 'Freundestest');
  check(await A.evaluate((n) => [...document.querySelectorAll('.f-liste.wahl input')].some((i) => i.value === n), nB), 'Neue Kampagne: B steht zur Auswahl');
  await A.check(`.f-liste.wahl input[value="${nB}"]`); await A.click('#f-neu .my-knopf');
  check(await until(A, () => !document.querySelector('#einleitung').hidden), 'Kampagne angelegt, das Abenteuer beginnt');
  const kid = await A.evaluate(() => window.KAMPAGNE.aktuell().id);

  // B nimmt die Gruppenanfrage an
  await B.click('#fenster-zu'); await B.evaluate(() => window.MYTHARA.zeigeHub());
  check(await until(B, () => { const z = document.querySelector('#hub-glocke .hub-zahl'); return z && !z.hidden; }), 'B: Glocke zeigt die Gruppenanfrage');
  await B.click('#hub-glocke'); await B.waitForSelector('[data-ka="ja"]');
  check(await B.evaluate(() => /Freundestest/.test(document.querySelector('.kampagnen').textContent)), 'Gruppenanfrage nennt die Kampagne „Freundestest“');
  await B.click('[data-ka="ja"]'); await B.waitForTimeout(800); await B.click('#fenster-zu');
  check(await until(B, () => /Freundestest/.test(document.querySelector('#hub-aktuell').textContent) && /Mitspieler/.test(document.querySelector('#hub-aktuell').textContent)), 'B: „Freundestest“ unter Aktuelle Kampagnen als Mitspieler');
  check(await A.evaluate((id) => window.AB.liveClient().rpc('rpg_load_campaign', { p_campaign_id: id }).then((d) => d.members.length === 2), kid), 'A: Kampagne hat jetzt zwei Mitglieder');

  // Aufräumen
  await A.evaluate((id) => window.AB.liveClient().rpc('rpg_delete_campaign', { p_campaign_id: id }), kid);
  await A.evaluate((n) => window.AB.liveClient().rpc('rpg_remove_friend', { p_handle: n }), nB);
  console.log(`  (Testkonten ${nA}, ${nB} bleiben bestehen)`);
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nFREUNDE IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
