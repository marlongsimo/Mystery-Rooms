/*
 * Mythara-Startbildschirm: Gastzugang, Einladungscode, Rückweg, Testschalter für Konten, Handy-Breite.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/mythara.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let ok = true; const errs = [];
  const until = async (p, fn, arg, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(250); } return false; };
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
  const neu = async (vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };

  const p = await neu({ width: 1280, height: 900 });
  await p.goto(BASE + '/abenteuer/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload();
  check(await p.isVisible('#mythara') && !(await p.isVisible('#intro')), 'Start: Mythara-Bildschirm, Abenteuer-Titel verborgen');
  check(await p.title() === 'Mythara – Das digitale Rollenspiel | Case Unlocked', 'Seitentitel Mythara');
  check(await p.evaluate(() => { const i = document.querySelector('.my-logo img'); return i.complete && i.naturalWidth > 0; }), 'Logo geladen');
  check(await p.isVisible('#my-name') && await p.isVisible('#my-gast-start'), 'Anmeldung und „Als Gast spielen“ sichtbar');
  // Einladungscode
  await p.click('#my-code-zeigen');
  check(await p.isVisible('#my-code-feld') && await p.isVisible('#my-beitreten'), '„Mit Einladungscode beitreten“ öffnet das Codefeld');
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
  check(await p.isVisible('#hub') && !(await p.isVisible('#mythara')), 'Als Gast spielen → Spielerseite');
  check(/Gast/.test(await p.textContent('#hub-profil')) && await p.isVisible('#hub-gast-hinweis'), 'Spielerseite zeigt „Gast“ und den Hinweis aufs Konto');
  check(await until(p, () => /Noch keine laufende Kampagne/.test(document.querySelector('#hub-aktuell').textContent)), 'Aktuelle Kampagnen: leer für neuen Gast');
  await p.reload();
  check(await until(p, () => !document.querySelector('#hub').hidden), 'Neu laden: Gast bleibt in dieser Gerätesitzung auf der Spielerseite');
  // Eigene Seiten: Helden, Regeln, Kampagnenwelt – ohne Spielablauf
  await p.click('.hub-nav-punkt[data-hub="helden"]');
  check(await p.isVisible('#hub-seite .klassen-banner') && !(await p.isVisible('#hub-start')) && !(await p.isVisible('.hub-seite')), 'Helden: eigene Seite mit den fünf Klassen');
  await p.click('#hub-seite [data-klasse="schurke"]'); await p.click('#hub-seite [data-fid="trickser"]');
  check(/Silra/.test(await p.textContent('#hub-seite .held h2')) && !(await p.isVisible('#lobby')), 'Helden: Klasse und Held ansehen, ohne Gruppenwahl');
  await p.click('.hub-nav-punkt[data-hub="regeln"]');
  check(await p.evaluate(() => document.querySelectorAll('#hub-seite .seite').length === 6 && document.querySelectorAll('[id="live"]').length === 1 && !/Tippe den Würfel/.test(document.querySelector('#hub-seite').textContent)), 'Regeln: alle sechs Kodex-Seiten zum Lesen, ohne Spielknöpfe');
  await p.click('.hub-nav-punkt[data-hub="welt"]'); await p.click('[data-welt="grauwacht"]');
  check(await p.evaluate(() => document.querySelectorAll('#hub-seite .einleitung .seite').length === 3 && /5/.test(document.querySelector('.hub-fakten').textContent)), 'Kampagnenwelt: Grauwacht mit Vorgeschichte und Eckdaten');
  await p.click('#hub-seite > .hub-zurueck');
  check(await p.isVisible('#hub-start') && !(await p.isVisible('#einleitung')), '„Zur Übersicht“ führt zurück, kein Spiel gestartet');
  await p.click('.hub-kachel[data-hub="beitreten"]');
  check(await p.isVisible('#bt-code'), 'Kampagne beitreten: Codefeld');
  await p.click('#bt-zu');
  await p.click('.hub-nav-punkt[data-hub="regeln"]');
  check(await p.isVisible('#hub-seite .kodex') && !(await p.isVisible('#kodex')), 'Hilfe & Regeln: eigene Seite, nicht der Spielablauf');
  await p.goto(BASE + '/abenteuer/index.html');
  await until(p, () => !document.querySelector('#hub').hidden);
  await p.click('#hub-profil-knopf'); await p.click('#hub-menue [data-profil="anmelden"]');
  check(await p.isVisible('#mythara') && await p.isVisible('#my-name'), 'Profilmenü → Anmelden führt zur Startseite');
  // QR: ohne Kamera-Unterstützung eine Erklärung
  await p.evaluate(() => sessionStorage.clear()); await p.goto(BASE + '/abenteuer/index.html');
  await p.click('#my-qr');
  check(/Kamera deines Handys/.test(await p.textContent('#my-scanner')), 'QR-Code scannen: Hinweis zur Handy-Kamera');
  // Konten: Benutzername und Passwort
  await p.goto(BASE + '/abenteuer/index.html');
  check(await p.isVisible('#my-name') && await p.isVisible('#my-pw') && await p.isVisible('#my-reg') && !(await p.$('#my-mail')), 'Anmeldung mit Benutzername und Passwort (keine E-Mail)');
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
