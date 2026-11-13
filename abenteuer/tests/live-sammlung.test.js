/*
 * Mythara Open Beta – Heldensammlung gegen die echte Datenbank (Migration 006 muss eingespielt sein).
 * Gast: nur das Starter-Set ist wählbar. Neues Konto: drei Startrunden → „Deine Helden sind eingebucht“ →
 * Startseite → Charaktere zeigt 3 frei / 12 gesperrt → Heldenwahl am Tisch sperrt, was fehlt →
 * falscher Freischalt-Code wird abgewiesen → kein Admin-Menü für normale Konten.
 * Testkonten heißen Test_xxxxxx und bleiben bestehen (wie in live-konto.test.js).
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-sammlung.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
const STARTER = ['schildwaechter', 'elementarist', 'trickser', 'lichtbringer', 'wildnislaeufer'];
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (name) => { const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  /** Heldenwahl am Tisch öffnen und für jede Klasse die gesperrten/freien Helden auslesen */
  const wahl = async (p) => {
    await p.evaluate(() => window.AB.zeigeSetup());
    await until(p, () => window.ABSAMMLUNG.tischBekannt());
    await p.waitForTimeout(500);
    const frei = [], zu = [];
    for (const k of ['krieger', 'zauberer', 'schurke', 'kleriker', 'waldlaeufer']) {
      await p.evaluate((k) => document.querySelector(`#lobby [data-klasse="${k}"]`).click(), k); await p.waitForTimeout(250);
      const r = await p.evaluate(() => [...document.querySelectorAll('#lobby .fkarte[data-fid]')].map((x) => [x.dataset.fid, x.classList.contains('gesperrt')]));
      r.forEach(([f, g]) => (g ? zu : frei).push(f));
    }
    return { frei, zu };
  };

  // ---------- Gast: Starter-Set ----------
  const G = await page('Gast');
  await G.goto(BASE + '/abenteuer/index.html'); await G.evaluate(() => localStorage.clear()); await G.goto(BASE + '/abenteuer/index.html');
  await G.click('#my-gast-start');
  const g = await wahl(G);
  check(g.frei.length === 5 && STARTER.every((f) => g.frei.includes(f)) && g.zu.length === 10, `Gast: genau das Starter-Set ist wählbar (${g.frei.join(', ')})`);
  await G.evaluate(() => document.querySelector('#lobby [data-klasse="krieger"]').click()); await G.waitForTimeout(200);
  await G.evaluate(() => document.querySelector('#lobby [data-fid="berserker"]').click()); await G.waitForTimeout(300);
  check(await G.evaluate(() => !document.querySelector('#f-waehlen') && /Gesperrt/.test(document.querySelector('.wahl-detail').textContent)), 'Gast: gesperrter Held zeigt den Hinweis statt „in die Gruppe“');
  check(await G.evaluate(() => window.AB.SETUP().gruppe.every((f) => window.ABSAMMLUNG.tischFrei(f))), 'Gast: keine gesperrten Helden in der Gruppe');

  // ---------- Neues Konto: drei Startrunden ----------
  const NAME = 'Test_' + Math.random().toString(36).slice(2, 8), PW = 'Mythara-' + Math.random().toString(36).slice(2, 10);
  const A = await page('Konto');
  await A.goto(BASE + '/abenteuer/index.html'); await A.evaluate(() => localStorage.clear()); await A.goto(BASE + '/abenteuer/index.html');
  await A.click('#my-reg'); await A.fill('#my-reg-name', NAME);
  await until(A, () => /ist frei/.test(document.querySelector('#my-name-info').textContent));
  await A.fill('#my-reg-pw', PW); await A.fill('#my-reg-pw2', PW); await A.click('#my-reg-form .my-knopf');
  check(await until(A, () => { const b = document.querySelector('#sm-buehne'); return b && !b.hidden && /Runde 1 von 3/.test(b.textContent); }), 'Nach der Registrierung: Startrunde 1 von 3');
  const gewaehlt = [], gesehen = [];
  for (let r = 1; r <= 3; r++) {
    await until(A, (r) => new RegExp(`Runde ${r} von 3`).test(document.querySelector('#sm-buehne').textContent) && document.querySelectorAll('#sm-reihe .sm-karte:not(.verdeckt)').length === 3, r);
    const karten = await A.evaluate(() => [...document.querySelectorAll('#sm-reihe .sm-karte')].map((k) => k.dataset.smFid));
    gesehen.push(...karten);
    const klassen = new Set(await A.evaluate((ks) => ks.map((f) => window.ABF.FIGUREN[f].klasse), karten));
    check(karten.length === 3 && klassen.size === 3, `Runde ${r}: drei Helden aus drei Klassen (${karten.join(', ')})`);
    await A.click(`.sm-karte[data-sm-fid="${karten[r - 1]}"]`);
    await A.waitForSelector('#sm-ein'); await A.click('#sm-ein'); gewaehlt.push(karten[r - 1]);
  }
  check(new Set(gesehen).size === 9, 'In den drei Runden kommt kein Held doppelt vor (9 verschiedene)');
  check(await until(A, () => /Deine Helden sind eingebucht/.test(document.querySelector('#sm-buehne').textContent)), 'Übersicht: „Deine Helden sind eingebucht“');
  check(await A.evaluate((g) => g.every((f) => document.querySelector(`#sm-buehne .sm-karte[data-sm-fid="${f}"]`)), gewaehlt), 'Übersicht zeigt die drei gewählten Helden');
  await A.click('#sm-weiter');
  check(await until(A, (n) => document.querySelector('#sm-buehne').hidden && !document.querySelector('#hub').hidden && new RegExp('Willkommen zurück, ' + n).test(document.querySelector('#hub-gruss').textContent), NAME), '„Weiter“ führt zur Startseite');
  const S = await A.evaluate(() => window.AB.liveClient().rpc('rpg_my_heroes', {}));
  check(S.konto && S.helden.length === 3 && gewaehlt.every((f) => S.helden.includes(f)) && !S.start_offen && S.admin === false, 'Datenbank: 3 Helden in der Sammlung, Startrunden erledigt, kein Admin');

  // Neu laden: keine Startrunden mehr
  await A.reload(); await until(A, () => !document.querySelector('#hub').hidden); await A.waitForTimeout(1500);
  check(await A.evaluate(() => { const b = document.querySelector('#sm-buehne'); return !b || b.hidden; }), 'Neu laden: keine Startrunden mehr');

  // Charaktere: 3 frei, 12 gesperrt
  await A.evaluate(() => document.querySelector('[data-hub="helden"]').click());
  check(await until(A, () => /3 von 15 Helden freigeschaltet/.test(document.querySelector('#hub-seite').textContent)), 'Charaktere: „3 von 15 Helden freigeschaltet“ und Enden je Kampagne');
  const a = await wahl(A);
  check(a.frei.length === 3 && gewaehlt.every((f) => a.frei.includes(f)) && a.zu.length === 12, 'Heldenwahl am Tisch: genau die eigenen 3 Helden wählbar');

  // Code einlösen: falscher Code
  await A.evaluate(() => window.MYTHARA.zeigeHub()); await A.waitForTimeout(500);
  await A.click('#hub-profil-knopf');
  check(await A.evaluate(() => !document.querySelector('[data-profil="codes"]') && Boolean(document.querySelector('[data-profil="code"]'))), 'Profilmenü: „Freischalt-Code“ ja, „Code-Übersicht“ nein (kein Admin)');
  await A.click('#hub-menue [data-profil="code"]');
  await A.fill('#dlg-sm-code-feld', 'aaaabbbbcccc'); await A.click('#dlg-sm-code button');
  check(await until(A, () => /ungültig/.test(document.querySelector('#dlg-sm-code-fb').textContent)), 'Falscher Code: „Dieser Code ist ungültig.“');
  const fehl = await A.evaluate(() => window.AB.liveClient().rpc('rpg_admin_create_code', { p_label: 'Versuch' }).then(() => 'angelegt', (e) => e.message));
  check(/Nur Admins/.test(fehl), 'Normales Konto kann über die Datenbank keine Codes anlegen');

  console.log(`  (Testkonto ${NAME} bleibt bestehen)`);
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nSAMMLUNG IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
