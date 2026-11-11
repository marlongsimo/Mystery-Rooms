/*
 * Mythara-Startbildschirm: Gastzugang, Einladungscode, Rückweg, Testschalter für Konten, Handy-Breite.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/mythara.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const neu = async (vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };

  const p = await neu({ width: 1280, height: 900 });
  await p.goto(BASE + '/abenteuer/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload();
  check(await p.isVisible('#mythara') && !(await p.isVisible('#intro')), 'Start: Mythara-Bildschirm, Abenteuer-Titel verborgen');
  check(await p.title() === 'Mythara – Das digitale Rollenspiel | Case Unlocked', 'Seitentitel Mythara');
  check(await p.evaluate(() => { const i = document.querySelector('.my-logo img'); return i.complete && i.naturalWidth > 0; }), 'Logo geladen');
  check(!(await p.isVisible('#my-mail')) && /kommen bald/.test(await p.textContent('#my-konto')), 'Ohne ?konten: Konto-Hinweis statt Formular');
  // Einladungscode
  await p.click('#my-beitreten');
  check(await p.isVisible('#my-code-feld'), '„Spiel beitreten“ öffnet das Codefeld');
  await p.fill('#my-code-feld', 'aben12');
  check(await p.inputValue('#my-code-feld') === 'ABEN-12', 'Code wird formatiert (ABEN-12)');
  await p.click('#my-beitreten');
  check(/vollständigen Code/.test(await p.textContent('#my-code-fb')), 'Unvollständiger Code: Hinweis');
  await p.fill('#my-code-feld', 'aben123456');
  await Promise.all([p.waitForURL(/handy\.html#ABEN-123456$/), p.click('#my-beitreten')]);
  check(/handy\.html#ABEN-123456$/.test(p.url()), 'Vollständiger Code führt zur Handy-Ansicht mit Code');
  // Gast ohne Registrierung und zurück
  await p.goto(BASE + '/abenteuer/index.html');
  await p.click('#my-gast-start');
  check(await p.isVisible('#intro') && !(await p.isVisible('#mythara')), 'Ohne Registrierung starten → Abenteuer-Titel');
  await p.click('#titel-mythara');
  check(await p.isVisible('#mythara'), '„Zurück zum Start“ führt zu Mythara');
  // QR: ohne Kamera-Unterstützung eine Erklärung
  await p.click('#my-qr');
  check(/Kamera deines Handys/.test(await p.textContent('#my-scanner')), 'QR-Code scannen: Hinweis zur Handy-Kamera');
  // Testschalter Konten: Benutzername und Passwort
  await p.goto(BASE + '/abenteuer/index.html?konten');
  check(await p.isVisible('#my-name') && await p.isVisible('#my-pw') && await p.isVisible('#my-reg') && !(await p.$('#my-mail')), '?konten: Anmeldung mit Benutzername und Passwort (keine E-Mail)');
  await p.click('[data-auge="my-pw"]');
  check(await p.getAttribute('#my-pw', 'type') === 'text', 'Passwort anzeigen');
  await p.click('#my-vergessen');
  check(/nicht zurücksetzen/.test(await p.textContent('#my-konto-fb')), 'Passwort vergessen: ehrlicher Hinweis');
  await p.click('#my-reg');
  check(await p.isVisible('#my-reg-name') && await p.isVisible('#my-reg-pw2'), 'Registrieren: Benutzername, Passwort, Wiederholung');
  await p.fill('#my-reg-name', 'zwei worte');
  check(/keine Leerzeichen/.test(await p.textContent('#my-name-info')), 'Ungültiger Name wird sofort gemeldet');
  await p.fill('#my-reg-name', 'Gültig_1'); await p.fill('#my-reg-pw', 'kurz'); await p.fill('#my-reg-pw2', 'kurz');
  await p.click('#my-reg-form .my-knopf');
  check(/mindestens 8/.test(await p.textContent('#my-konto-fb')), 'Zu kurzes Passwort abgewiesen');
  await p.fill('#my-reg-pw', 'langesPasswort1'); await p.fill('#my-reg-pw2', 'anderesPasswort1'); await p.click('#my-reg-form .my-knopf');
  check(/stimmen nicht überein/.test(await p.textContent('#my-konto-fb')), 'Abweichende Wiederholung abgewiesen');
  // Handy
  const h = await neu({ width: 390, height: 844 });
  await h.goto(BASE + '/abenteuer/index.html');
  check(await h.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Handy: kein seitliches Scrollen');
  check(await h.evaluate(() => document.querySelector('#my-gast-titel').getBoundingClientRect().top < document.querySelector('#my-konto-titel').getBoundingClientRect().top), 'Handy: Gastzugang steht oben');
  check(errs.length === 0, 'keine Konsolenfehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(ok ? '\nMYTHARA IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
