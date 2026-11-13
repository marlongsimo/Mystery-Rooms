/*
 * Mythara – Konten mit Benutzername und Passwort gegen die echte Datenbank.
 * Voraussetzung: Migration 002 eingespielt, in Supabase „Confirm email“ ausgeschaltet.
 * Gast spielt eine Kampagne → registriert sich (Kampagne bleibt) → Name ist für andere vergeben →
 * Abmelden → falsches Passwort → Anmelden (auch in einem anderen Browser: Kampagne da).
 * Testkonten heißen Test_xxxxxx; ihre Kampagnen werden gelöscht. Die Konten selbst bleiben (Löschen folgt mit dem Konto-Bereich).
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/live-konto.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = require('./alle-helden').alleHeldenFrei(await chromium.launch()); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const page = async (name) => { const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage(); p.setDefaultTimeout(30000); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept()); return p; };
  const until = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(300); } return false; };
  const NAME = 'Test_' + Math.random().toString(36).slice(2, 8), PW = 'Mythara-' + Math.random().toString(36).slice(2, 10);

  const A = await page('A');
  await A.goto(BASE + '/abenteuer/index.html?konten&kampagnen'); await A.evaluate(() => localStorage.clear()); await A.goto(BASE + '/abenteuer/index.html?konten&kampagnen');
  // Als Gast eine Kampagne anlegen
  const kid = await A.evaluate(() => window.AB.liveClient().rpc('rpg_create_campaign', { p_title: 'Kontotest' }));
  await A.click('#my-reg');
  await A.fill('#my-reg-name', NAME);
  check(await until(A, () => /ist frei/.test(document.querySelector('#my-name-info').textContent)), `Name „${NAME}“ wird als frei gemeldet`);
  await A.fill('#my-reg-pw', PW); await A.fill('#my-reg-pw2', PW); await A.click('#my-reg-form .my-knopf');
  check(await until(A, (n) => new RegExp('Angemeldet als ' + n).test(document.querySelector('#my-konto').textContent), NAME), 'Registriert: „Angemeldet als …“');
  const liste = await A.evaluate(() => window.AB.liveClient().rpc('rpg_my_campaigns', {}));
  check(liste.some((c) => c.id === kid), 'Die Gast-Kampagne gehört jetzt zum Konto');
  check(await A.evaluate(() => Object.keys(localStorage).some((k) => k === 'mr-rpg-auth') && !/@/.test(document.body.textContent)), 'Keine E-Mail-Adresse auf der Seite sichtbar');

  // Name ist für andere vergeben
  const B = await page('B');
  await B.goto(BASE + '/abenteuer/index.html?konten');
  await B.click('#my-reg'); await B.fill('#my-reg-name', NAME.toUpperCase());
  check(await until(B, () => /schon vergeben/.test(document.querySelector('#my-name-info').textContent)), 'Anderer Browser: Name (auch in Großbuchstaben) vergeben');

  // Abmelden, falsches Passwort, richtig anmelden
  check(await until(A, (n) => !document.querySelector('#hub').hidden && new RegExp('Willkommen zurück, ' + n).test(document.querySelector('#hub-gruss').textContent), NAME), 'Nach der Registrierung: Spielerseite „Willkommen zurück, …“');
  await A.click('#hub-profil-knopf'); await A.click('#hub-menue [data-profil="abmelden"]');
  check(await until(A, () => Boolean(document.querySelector('#my-name'))), 'Abgemeldet: wieder Anmeldeformular');
  await A.fill('#my-name', NAME); await A.fill('#my-pw', 'falsch-falsch'); await A.click('#my-anmelden .my-knopf');
  check(await until(A, () => /falsch/.test(document.querySelector('#my-konto-fb').textContent)), 'Falsches Passwort: „Benutzername oder Passwort ist falsch“');
  await A.fill('#my-name', 'Gibts_nicht_123'); await A.fill('#my-pw', PW); await A.click('#my-anmelden .my-knopf');
  check(await until(A, () => /falsch/.test(document.querySelector('#my-konto-fb').textContent)), 'Unbekannter Name: gleiche Meldung');
  await A.fill('#my-name', NAME.toLowerCase()); await A.fill('#my-pw', PW); await A.click('#my-anmelden .my-knopf');
  check(await until(A, (n) => new RegExp('Angemeldet als ' + n).test(document.querySelector('#my-konto').textContent), NAME), 'Anmelden (Groß/Klein egal) klappt');

  // Anderer Browser: Kampagne ist da
  await B.goto(BASE + '/abenteuer/index.html?konten');
  await B.fill('#my-name', NAME); await B.fill('#my-pw', PW); await B.click('#my-anmelden .my-knopf');
  check(await until(B, (n) => new RegExp('Angemeldet als ' + n).test(document.querySelector('#my-konto').textContent), NAME), 'Zweiter Browser: angemeldet');
  check(await B.evaluate((id) => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => l.some((c) => c.id === id)), kid), 'Zweiter Browser: dieselbe Kampagne verfügbar');

  await A.evaluate(() => window.AB.liveClient().rpc('rpg_my_campaigns', {}).then((l) => Promise.all(l.map((c) => window.AB.liveClient().rpc('rpg_delete_campaign', { p_campaign_id: c.id })))));
  console.log(`  (Testkonto ${NAME} bleibt bestehen)`);
  check(errs.length === 0, 'keine Seitenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nKONTEN IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
