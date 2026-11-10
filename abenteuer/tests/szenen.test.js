/*
 * Abenteuer „Das Siegel von Grauwacht“ – Szenen (Abschnitt 1 und 2)
 * 1. Ohne Browser: 400 zufällige Durchläufe durch alle Entscheidungen (Normal/Hardcore, 3–6 Figuren) –
 *    jede Szene erreichbar, jeder Durchlauf endet, keine Fehler; Speichern/Laden mitten im Abenteuer.
 * 2. Browser, ein Gerät: Gruppe wählen → Abenteuer beginnen → Abschnitt 1 über die Oberfläche bis zum Ende
 *    (Gespräch, Probe, geheime Entscheidung, Abstimmung, Kämpfe, Lagerfeuer mit Aufstieg) → neu laden → fortsetzen.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/szenen.test.js
 */
const BASE = process.env.BASE || 'http://localhost:8765';
const { chromium } = require('playwright');
const R = require('../js/regeln.js'), S = require('../js/szenen.js'), D = require('../daten/grauwacht.js'), F = R.FD;
(async () => {
  let ok = true; const errs = [];
  const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };

  const einstieg = async (p, modus) => {
    await p.click('#titel-start');
    await p.waitForSelector('#einleitung:not([hidden])');
    for (let i = 0; i < 3; i++) await p.click('#einl-weiter');
    for (let i = 0; i < 5; i++) await p.click('#kodex-weiter');
    await p.click(modus === 'live' ? '#live' : '#start');
  };
  const nimm = async (p, fid) => { await p.click(`[data-fid="${fid}"]`); await p.click('#f-waehlen'); };

  // 1. Alle Wege
  const besucht = new Set(), enden = {}; let fehler = 0, haenger = 0, ersaetze = 0;
  function spiele(A, r) {
    for (let n = 0; n < 300; n++) {
      const s = S.szene(A); besucht.add(A.szene);
      if (s.art === 'ende') { enden[A.szene] = (enden[A.szene] || 0) + 1; return true; }
      if (s.art === 'lager' && A.ersatzOffen && A.ersatzOffen.length) { for (const alt of A.ersatzOffen.slice()) { const frei = S.freieFiguren(A); if (frei.length) S.ersatz(A, alt, frei[0]); } ersaetze++; }
      if (s.art === 'erzaehlung' || s.art === 'lager') { if (s.rastErlaubt && r() < 0.3) S.kurzeRast(A); S.weiter(A); continue; }
      if (s.art === 'raetsel') { const x = r(); if (x < 0.15) { S.raetselAufgeben(A); continue; } const folge = x < 0.45 ? s.glocken.map((g) => g.id).sort(() => r() - 0.5) : s.loesung; for (const g of folge) { if (S.szene(A).art !== 'raetsel') break; S.raetselTipp(A, g); } continue; }
      if (s.art === 'gespraech') {
        if (A.zwischenprobe) { const pz = S.probeZustand(A); if (!pz.wer) S.probeWer(A, S.lebende(A)[Math.floor(r() * S.lebende(A).length)]); S.probeWurf(A, pz.wer); continue; }
        const o = S.optionen(A); S.waehle(A, o[Math.floor(r() * o.length)].id); continue;
      }
      if (s.art === 'geheim') { for (const f of S.lebende(A)) S.geheim(A, f, r() < 0.5 ? 'trinken' : 'nicht'); S.weiter(A); continue; }
      if (s.art === 'wahl') { const o = S.optionen(A); for (const f of S.lebende(A)) S.stimme(A, f, o[Math.floor(r() * o.length)].id); S.auswerten(A); continue; }
      if (s.art === 'probe') { if (A.ergebnis) { S.weiter(A); continue; } const pz = S.probeZustand(A); if (pz.wer === 'gruppe') for (const f of S.lebende(A)) S.probeWurf(A, f); else { S.probeWer(A, S.lebende(A)[Math.floor(r() * S.lebende(A).length)]); S.probeWurf(A, pz.wer); } continue; }
      if (s.art === 'kampf') { const st = R.neuesSpiel(Math.floor(r() * 1e9), S.kampfOptionen(A)); let z = 0; while (!st.ende && z++ < 900) R.aktiv(st).seite === 'gegner' ? R.gegnerZug(st) : R.autoZug(st); if (!st.ende) return false; S.kampfEnde(A, st); continue; }
      throw new Error('Unbekannte Szenenart ' + s.art);
    }
    return false;
  }
  const rnd = R.rng(2024);
  for (let i = 0; i < 400; i++) {
    const n = 3 + (i % 4), gruppe = F.REIHE.slice().sort(() => rnd() - 0.5).slice(0, n);
    if (i % 5 === 0 && !gruppe.includes('trickser')) gruppe[0] = 'trickser';
    if (i % 7 === 0 && !gruppe.includes('assassine')) gruppe[1] = 'assassine';
    try {
      let A = S.neu(i + 1, { gruppe, schwierigkeit: i % 3 ? 'normal' : 'hardcore' });
      if (i % 10 === 0) { for (let k = 0; k < 3; k++) { const s = S.szene(A); if (s.art === 'erzaehlung') S.weiter(A); } A = S.laden(JSON.parse(JSON.stringify(S.speichern(A)))); }
      if (!spiele(A, R.rng(i * 13 + 5))) haenger++;
    } catch (e) { fehler++; if (fehler < 3) console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  }
  const alle = Object.keys(D.SZENEN), nie = alle.filter((k) => !besucht.has(k));
  check(ersaetze > 0, `Hardcore: Gefallene bekommen am Lagerfeuer eine Ersatzfigur (${ersaetze}×)`);
  check(fehler === 0 && haenger === 0, `400 Durchläufe ohne Fehler und ohne Hänger (Enden: ${Object.entries(enden).map(([k, v]) => k + ' ' + v).join(', ')})`);
  check(nie.length === 0, `alle ${alle.length} Szenen erreichbar` + (nie.length ? ' – nie erreicht: ' + nie.join(', ') : ''));
  // Folgen von Entscheidungen
  const A1 = S.neu(5, { gruppe: ['wanderheiler', 'kopfgeldjaeger', 'wildnislaeufer'] });
  S.weiter(A1);
  check(A1.merker.anselm_durchschaut === true, 'Brogar in der Gruppe: Anselm ist sofort durchschaut');
  S.waehle(A1, 'vater'); check(A1.merker.vater_steckbrief === true && /Jorek Hald/.test(A1.antwort), 'Orin erkennt Wennas Vater auf dem Steckbrief');
  S.waehle(A1, 'tam'); check(A1.merker.tam_schlaf === true, 'Kael liest an Tams Spuren, dass der Junge im Schlaf ging');
  check(S.optionen(A1).some((o) => o.id === 'versprechen'), 'Versprechen an Wenna wird erst nach ihrer Geschichte angeboten');

  // 2. Browser
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + '/abenteuer/index.html?schnell');
  await p.evaluate(() => localStorage.clear()); await p.reload();
  check(/Siegel von Grauwacht/.test(await p.textContent('h1')), 'Startseite: Das Siegel von Grauwacht');
  await einstieg(p, 'allein');
  for (const f of ['schildwaechter', 'elementarist', 'lichtbringer', 'trickser']) await nimm(p, f);
  await p.click('#abenteuer-los');
  check(await p.isVisible('#szene') && /Halmbruck/.test(await p.textContent('#szene h1')), 'Abenteuer beginnt in Halmbruck');
  const gesehen = new Set(); let kaempfe = 0, neuGeladen = false, i = 0;
  let raetselGeloest = false;
  for (; i < 900; i++) {
    if (await p.isVisible('#szene')) {
      const titel = (await p.textContent('#szene h1')).trim(); gesehen.add(titel);
      if (process.env.SHOT_DIR && titel === 'Am Brunnen' && !gesehen.has('shot1')) { gesehen.add('shot1'); await p.screenshot({ path: process.env.SHOT_DIR + '/szene-gespraech.png', fullPage: true }); }
      if (process.env.SHOT_DIR && titel === 'Der Glockenturm' && !gesehen.has('shot2')) { gesehen.add('shot2'); await p.screenshot({ path: process.env.SHOT_DIR + '/szene-wahl.png', fullPage: true }); }
      if (await p.$('#sz-schluss')) break;
      // nach der ersten Kampfszene einmal neu laden und fortsetzen
      if (kaempfe === 1 && !neuGeladen) { const vorher = await p.evaluate(() => window.ABT.A().szene); await p.reload(); await p.waitForSelector('#szene:not([hidden])'); neuGeladen = await p.evaluate(() => window.ABT.A().szene) === vorher; check(neuGeladen, 'Neu laden: das Abenteuer geht von selbst an derselben Stelle weiter');
        await p.click('#sz-pause'); await p.click('#fortsetzen'); check(await p.isVisible('#szene'), 'Pause → Titel → „Abenteuer fortsetzen“'); continue; }
      const klick = async (sel) => { const e = await p.$(sel); if (e && await e.isEnabled()) { await e.click(); return true; } return false; };
      if (await klick('[data-wurf]')) continue;
      if (await klick('[data-wer]')) continue;
      if (await p.$('[data-geheim]')) { for (const v of await p.$$eval('[data-geheim$=":trinken"]', (xs) => xs.map((x) => x.dataset.geheim))) await p.click(`[data-geheim="${v}"]`); await klick('#sz-weiter'); continue; }
      if (await klick('#sz-kampf')) { kaempfe++; continue; }
      if (await p.$('[data-glocke]')) { if (process.env.SHOT_DIR && !gesehen.has('shot3')) { gesehen.add('shot3'); await p.screenshot({ path: process.env.SHOT_DIR + '/szene-raetsel.png', fullPage: true }); } for (const g of D.SZENEN.gruft_raetsel.loesung) await p.click(`[data-glocke="${g}"]`); raetselGeloest = true; continue; }
      if (await klick('[data-ersatz]')) continue;
      if (await klick('#sz-weiter')) continue;
      // Gespräch: erst zwei Fragen, dann aufbrechen; Abstimmung: erste Option
      const opts = await p.$$eval('[data-opt]', (xs) => xs.map((x) => x.dataset.opt));
      const wahl = opts.includes('aufbrechen') ? ['spuren', 'brunnen', 'aufbrechen'].find((o) => opts.includes(o)) : opts.includes('schleichen') ? 'schleichen' : opts[0];
      if (wahl) { await p.click(`[data-opt="${wahl}"]`); continue; }
      await p.waitForTimeout(50);
    } else if (await p.isVisible('#spiel')) {
      if (await p.isVisible('#ende') && await p.$('#weiter-abenteuer')) { await p.click('#weiter-abenteuer'); continue; }
      const s = await p.evaluate(() => window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x');
      if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(30);
    } else await p.waitForTimeout(50);
  }
  const ende = await p.textContent('#szene h1').catch(() => '');
  check(/Ende von Abschnitt 2|Grauwacht behält/.test(ende), `Abschnitt 1 und 2 durchgespielt bis „${ende.trim()}“ (${gesehen.size - 3} Szenen, ${kaempfe} Kämpfe)`);
  check(raetselGeloest || /behält/.test(ende) || !gesehen.has('Das Glockenjoch'), 'Glockenrätsel über die Glocken am Tisch gelöst');
  check(['Der Abstieg', 'Der Schacht', 'Tam', 'Lagerfeuer in der Bibliothek', 'Anselms Tagebuch'].every((t) => gesehen.has(t)) || /behält/.test(ende), 'Abschnitt 2: Abstieg, Schacht, Tam, Bibliothek, Tagebuch gesehen');
  check(['Am Brunnen', 'Der bittere Brunnen', 'Der Klostergarten', 'Der Glockenturm', 'Nisk', 'Lagerfeuer im Kreuzgang'].every((t) => gesehen.has(t)) || /behält/.test(ende), 'Gespräch, geheime Entscheidung, Kampf, Abstimmung und Lagerfeuer gesehen');
  check(/Stufe 3/.test(await p.textContent('#szene')) || /behält/.test(ende), 'nach der Bibliothek Stufe 3');
  if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + '/szene-ende.png', fullPage: true });
  check(errs.length === 0, 'keine Konsolenfehler' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(ok ? '\nALLE PRÜFUNGEN BESTANDEN' : '\nFEHLER'); process.exit(ok ? 0 : 1);
})();
