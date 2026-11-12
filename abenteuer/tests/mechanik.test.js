/*
 * Mechaniken für „Die Krone unter dem Eis“ (KONZEPT-KRONE.md K6): Ziel-Objekte, Verstärkungswellen, angekündigte Flächen,
 * brüchiges Eis und Eiswände, Rückstoß, Boss-Phasen, Schutzfeld, Rufer, Nester, Durchbruch – und ein ganzer Probekampf mit der Automatik.
 * Aufruf: python3 -m http.server 8765 &  ·  node abenteuer/tests/mechanik.test.js
 */
const R = require('../js/regeln.js');
let ok = true;
const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };
const KARTE = { name: 'Probeplatz', b: 12, h: 9, boden: 'stein',
  hindernisse: ['MMMMMMMMMMMM', 'M..........M', 'M..........M', 'M..........M', '...........M', 'M..........M', 'M..........M', 'M..........M', 'MMMMMMMMMMMM'].flatMap((z, y) => [...z].map((c, x) => (c === 'M' ? ['M', x, y] : null)).filter(Boolean)),
  start: { spieler: [[1, 4], [1, 3], [1, 5], [2, 4], [2, 3], [2, 5]], wolf: [[3, 4], [3, 3], [3, 5], [3, 2]], gegner: [[10, 4], [10, 2], [10, 6], [9, 3], [9, 5], [10, 1]] } };
// Prüfgegner: Puppen ohne Angriff, die sich nicht bewegen
R.GEGNER.testpuppe = { name: 'Puppe', tp: 50, rk: 5, werte: { STR: 10, GES: 10, KON: 10, INT: 10, WEI: 10, CHA: 10 }, bewegung: 0, xp: 0 };
R.GEGNER.testrufer = Object.assign({}, R.GEGNER.testpuppe, { name: 'Rufer' });
R.GEGNER.testhammer = Object.assign({}, R.GEGNER.testpuppe, { name: 'Hammer', flaeche: { name: 'Stampfer', form: 'kreis', radius: 1, schaden: '2W6', sg: 40, alle: 3, reichweite: 9 } });
const neu = (seed, mechanik, gegner, extra = {}) => R.neuesSpiel(seed, Object.assign({ figuren: ['schildwaechter', 'lichtbringer'], stufe: 2, karte: KARTE, keinAnfuehrer: true, zusatzGegner: 0, mechanik, gegner }, extra));
const held = (st, i = 0) => st.figuren.filter((f) => f.seite === 'spieler' && f.art !== 'wolf')[i];
// Bis die Figur dran ist: Gegner handeln, Helden beenden ihren Zug sofort
const bis = (st, id) => { let k = 0; while (!st.ende && k++ < 300 && R.aktiv(st).id !== id) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.zugEnde(st); } };
const runde = (st, n) => { let k = 0; while (!st.ende && st.runde < n && k++ < 500) { if (R.aktiv(st).seite === 'gegner') R.gegnerZug(st); else R.zugEnde(st); } };
const log = (st) => st.log.map((l) => l.t).join('\n');
const setze = (f, x, y) => { f.x = x; f.y = y; };

console.log('Ziel-Objekte');
{
  const st = neu(1, { ziele: [{ id: 's1', name: 'Siegelstein Nord', art: 'siegelstein', x: 5, y: 4, runden: 2, aktion: 'Siegelstein abschalten' }, { id: 's2', name: 'Siegelstein Süd', art: 'siegelstein', x: 5, y: 6 }], sieg: { ziele: 2, text: 'Beide Steine schweigen.' } }, [{ art: 'testpuppe', anzahl: 1 }]);
  const h = held(st); bis(st, h.id); setze(h, 4, 4); setze(held(st, 1), 1, 1);
  check(R.erreichbar(st, h, 6).has('5,4') === false && st.karte.block.has('5,4'), 'Ein Ziel steht im Weg wie ein Hindernis');
  check(R.aktionenVon(h, st).some((a) => a.id === 'ziel' && a.name === 'Siegelstein abschalten'), 'Neben dem Ziel gibt es die Aktion – mit eigenem Namen');
  R.handeln(st, 'ziel', h.id);
  check(st.mech.ziele[0].fortschritt === 1 && !st.mech.ziele[0].fertig, 'Zwei Aktionen nötig: nach der ersten 1/2');
  check(R.grund(st, 'ziel') === 'Aktion schon verbraucht.', 'Nur einmal pro Zug');
  R.zugEnde(st); bis(st, h.id); R.handeln(st, 'ziel', h.id);
  check(st.mech.ziele[0].fertig && !st.ende, 'Nach der zweiten Aktion ist das Ziel erledigt');
  R.zugEnde(st); bis(st, h.id); setze(h, 4, 6); R.handeln(st, 'ziel', h.id);
  check(st.ende === 'sieg' && /Beide Steine schweigen/.test(log(st)), 'Zwei erledigte Ziele: Sieg, auch wenn noch Gegner stehen');
  const st2 = R.laden(R.speichern(st)); check(st2.mech.ziele[0].fertig && st2.karte.block.has('5,4'), 'Speichern und Laden behalten Ziele und ihre Felder');
}
{
  const st = neu(2, { ziele: [{ id: 'e1', name: 'Eisblock', x: 5, y: 4, ruhe: true }] }, [{ art: 'testpuppe', anzahl: 1 }]);
  const h = held(st); bis(st, h.id); setze(h, 4, 4); const p = st.figuren.find((f) => f.art === 'testpuppe'); setze(p, 4, 5);
  check(R.ziele(st, 'ziel').length === 0, '„Ruhe“: Mit einem Gegner direkt daneben geht es nicht');
  setze(p, 9, 7); check(R.ziele(st, 'ziel').length === 1, 'Ohne Gegner daneben geht es');
}
{
  const st = neu(3, { ziele: [{ id: 'e1', name: 'Eisblock', x: 6, y: 2, frist: 3, wirkung: { gerettet: true, verlorenText: 'Das Eis wird trüb.' } }] }, [{ art: 'testpuppe', anzahl: 1 }]);
  runde(st, 4);
  check(st.mech.ziele[0].verloren && /Eisblock: zu spät\. Das Eis wird trüb/.test(log(st)) && !R.aktionenVon(held(st), st).some((a) => a.id === 'ziel'), 'Frist abgelaufen: Ziel verloren, keine Aktion mehr');
}

console.log('Verstärkungswellen');
{
  const st = neu(4, { wellen: [{ id: 'w', name: 'Die Hauszugänge', kurz: 'aus den Häusern', quellen: [[10, 4]], gegner: [['testpuppe', 0, 2, 2]], alle: 2, ab: 3, max: 2, text: 'Hinter den Türen kratzt es' }] }, [{ art: 'testpuppe', anzahl: 1 }]);
  runde(st, 2); const vor = st.figuren.length;
  check(/Hinter den Türen kratzt es – nächste Runde kommt Verstärkung/.test(log(st)) && st.figuren.length === vor, 'Eine Runde vorher angekündigt, noch niemand da');
  runde(st, 3); check(st.figuren.length === vor + 2 && st.figuren.slice(-2).every((g) => /aus den Häusern/.test(g.name) && Math.max(Math.abs(g.x - 10), Math.abs(g.y - 4)) <= 3), 'In Runde 3 kommen zwei an den Zugängen');
  check(st.reihe.includes(st.figuren[st.figuren.length - 1].id), 'Die Neuen stehen in der Zugreihe');
  runde(st, 7); check(st.figuren.length === vor + 4, 'Obergrenze: höchstens zwei Wellen');
}
{
  const st = neu(5, { ziele: [{ id: 't', name: 'Tür', x: 9, y: 4, wirkung: { welleAus: 'w' } }], wellen: [{ id: 'w', name: 'Die Hauszugänge', quellen: [[10, 4]], gegner: [['testpuppe', 0, 2, 1]], alle: 2, ab: 3, max: 5 }] }, [{ art: 'testpuppe', anzahl: 1 }]);
  const h = held(st); bis(st, h.id); setze(h, 8, 4); R.handeln(st, 'ziel', h.id); const vor = st.figuren.length;
  runde(st, 6); check(st.figuren.length === vor && /Die Hauszugänge: versiegt/.test(log(st)), 'Ein erledigtes Ziel stoppt die Welle');
}
{
  const st = neu(6, { wellen: [{ id: 'w', name: 'Der Ruf', quellen: [[10, 4]], gegner: [['testpuppe', 0, 1, 1]], alle: 2, ab: 3, max: 5, an: 'testrufer' }] }, [{ art: 'testrufer', anzahl: 1 }, { art: 'testpuppe', anzahl: 1 }]);
  R.schaden(st, st.figuren.find((f) => f.art === 'testrufer'), 999); const vor = st.figuren.length;
  runde(st, 4); check(st.figuren.length === vor && /Niemand ruft mehr Verstärkung/.test(log(st)), 'Ist der Rufer besiegt, kommt keine Welle mehr');
}

console.log('Angekündigte Flächen');
{
  const st = neu(7, {}, [{ art: 'testhammer', anzahl: 1 }]);
  const g = st.figuren.find((f) => f.art === 'testhammer'), a = held(st), b = held(st, 1);
  bis(st, g.id); setze(g, 9, 4); setze(a, 5, 4); setze(b, 5, 5); for (const w of st.figuren.filter((f) => f.art === 'wolf')) setze(w, 1, 1);
  R.gegnerZug(st);
  const mk = st.mech.marken[0];
  check(mk && mk.felder.some(([x, y]) => x === 5 && y === 4) && mk.felder.some(([x, y]) => x === 5 && y === 5) && /Stampfer! \d+ Felder leuchten auf/.test(log(st)), 'Der Gegner kündigt an: die Felder um zwei Helden sind markiert');
  check(R.gefahrFelder(st).has('5,4'), 'Markierte Felder sind als Gefahr bekannt');
  bis(st, a.id); R.bewegen(st, 3, 4); bis(st, g.id); const ta = a.tp, tb = b.tp; R.gegnerZug(st);
  check(a.tp === ta && b.tp < tb && st.mech.marken.length === 0, 'Im nächsten Zug trifft es nur, wer stehen geblieben ist');
  bis(st, b.id); setze(b, 5, 4); R.autoZug(st); check(!R.gefahrFelder(st).has(b.x + ',' + b.y), 'Automatik: Ein Held auf einem markierten Feld geht herunter');
}

console.log('Gelände: brüchiges Eis und Eiswände');
{
  const st = neu(8, { eis: { felder: [[5, 4], [7, 7]], proRunde: 1, ab: 2 } }, [{ art: 'testpuppe', anzahl: 1 }]);
  const h = held(st); setze(h, 5, 4);
  runde(st, 2);
  check(/Das Eis knackt! Ein Feld bricht/.test(log(st)) && R.gefahrFelder(st).has('5,4'), 'Das Eis knackt zuerst dort, wo jemand steht – angekündigt');
  setze(h, 5, 4); runde(st, 3);
  check(st.karte.block.has('5,4') && st.karte.offen.has('5,4') && !(h.x === 5 && h.y === 4) && /bricht ein/.test(log(st)), 'Eine Runde später bricht es ein: Loch, wer dort stand, ist herausgeklettert');
  check(R.sicht(st, { x: 4, y: 4 }, { x: 6, y: 4 }), 'Über ein Loch hinweg sieht man');
  const st2 = R.laden(R.speichern(st)); check(st2.karte.block.has('5,4') && st2.karte.offen.has('5,4'), 'Speichern und Laden behalten das Loch');
}
{
  R.GEGNER.testleser = Object.assign({}, R.GEGNER.testpuppe, { name: 'Leser', feldzauber: { name: 'Runenlinie', anzahl: 3, dauer: 2, alle: 3, reichweite: 9 } });
  const st = neu(9, {}, [{ art: 'testleser', anzahl: 1 }]);
  const g = st.figuren.find((f) => f.art === 'testleser'); bis(st, g.id); setze(held(st), 5, 4); setze(held(st, 1), 5, 6); R.gegnerZug(st);
  check(st.mech.wandel.length === 1 && st.mech.wandel[0].typ === 'wand', 'Feldzauber: Eis wird neben zwei Helden angekündigt');
  check(!st.karte.hindernisse.some(([t]) => t === 'E'), 'Noch steht nichts – die Helden haben einen Zug Zeit');
  bis(st, g.id); R.gegnerZug(st); const r0 = st.runde, wand = st.karte.hindernisse.filter(([t]) => t === 'E');
  check(wand.length >= 1 && wand.every(([, x, y]) => !st.karte.offen.has(x + ',' + y)), 'Bei seinem nächsten Zug steht die Eiswand und versperrt die Sicht');
  runde(st, r0 + 2); check(!st.karte.hindernisse.some(([t]) => t === 'E'), 'Nach zwei Runden taut sie wieder');
}

console.log('Rückstoß');
{
  let gestossen = false, gefallen = false;
  for (let s = 1; s < 60 && !(gestossen && gefallen); s++) {
    const st = neu(100 + s, {}, [{ art: 'kettenbestie', anzahl: 1 }]); const g = st.figuren.find((f) => f.art === 'kettenbestie'), h = held(st);
    for (const o of st.figuren) if (o !== g && o !== h) setze(o, 1, 1 + st.figuren.indexOf(o) % 2 * 6);
    if (s % 2) { st.karte.hindernisse.push(['Q', 3, 4]); st.karte.block.add('3,4'); st.karte.offen.add('3,4'); }
    bis(st, g.id); setze(g, 5, 4); setze(h, 4, 4); const tp = h.tp; R.gegnerZug(st);
    if (/stößt .* zurück/.test(log(st)) && h.x < 4) gestossen = true;
    if (s % 2 && /stürzt halb hinab/.test(log(st)) && h.tp < tp) gefallen = true;
  }
  check(gestossen, 'Die Kettenbestie stößt einen Helden zurück');
  check(gefallen, 'Hinter dem Helden ein Abgrund: Er stürzt halb hinab und nimmt Schaden');
}

console.log('Boss-Phasen und Schutzfeld');
{
  const st = neu(10, { ziele: [{ id: 'r1', name: 'Runensäule West', art: 'saeule', x: 6, y: 1, wirkung: { schild: true } }, { id: 'r2', name: 'Runensäule Ost', art: 'saeule', x: 6, y: 7, wirkung: { schild: true } }], schild: { art: 'eisenhirte', ziele: ['r1', 'r2'], halt: 12, pause: 2, text: 'Runenschild' } }, [{ art: 'eisenhirte', anzahl: 1 }]);
  const g = st.figuren.find((f) => f.art === 'eisenhirte'), tp0 = g.tp, halt = g.schild.halt;
  check(g.schild && g.schild.aktiv && /Runenschild umgeben/.test(log(st)), 'Der Eisenhirte beginnt mit Runenschild');
  R.schaden(st, g, 10); check(g.tp === tp0 - 5, 'Das Schild fängt die Hälfte ab');
  R.schaden(st, g, halt * 2); check(!g.schild.aktiv && /bricht zusammen/.test(log(st)), 'Genug Schaden: Das Schild bricht für einige Runden');
  const tp1 = g.tp; R.schaden(st, g, 4); check(g.tp === tp1 - 4, 'Ohne Schild trifft der volle Schaden');
  runde(st, st.runde + 3); check(g.schild.aktiv, 'Nach der Pause baut es sich wieder auf');
  const h = held(st); bis(st, h.id); setze(h, 6, 2); R.handeln(st, 'ziel', h.id); R.zugEnde(st); bis(st, h.id); setze(h, 6, 6); R.handeln(st, 'ziel', h.id);
  check(!g.schild.aktiv && g.schild.dauerhaftAus && /erlischt endgültig/.test(log(st)), 'Beide Runensäulen aus: Das Schild erlischt endgültig');
  const rk = g.rk; R.schaden(st, g, Math.ceil(g.tp - g.tpMax * 0.45)); check(g.phase === 1 && g.rk === rk - 1 && /Runen am Eisenhirten glühen/.test(log(st)), 'Unter halbem Leben: Phase 2 mit Ankündigung');
}

console.log('Rufer und Nester');
{
  const st = neu(11, { ziele: [{ id: 's', name: 'Siegelstein', x: 8, y: 4, umkehrbar: true, wirkung: { welleAus: 'w' } }], wellen: [{ id: 'w', name: 'Zugang', quellen: [[10, 1]], gegner: [['testpuppe', 0, 1, 1]], alle: 3, ab: 20, max: 3 }] }, [{ art: 'kaelterufer', anzahl: 1 }]);
  const g = st.figuren.find((f) => f.art === 'kaelterufer'), h = held(st);
  bis(st, h.id); setze(h, 7, 3); R.handeln(st, 'ziel', h.id); check(st.mech.ziele[0].fertig && st.mech.wellen[0].aus, 'Siegelstein aus, Welle versiegt');
  bis(st, g.id); setze(g, 9, 5); R.gegnerZug(st);
  check(!st.mech.ziele[0].fertig && !st.mech.wellen[0].aus && /Kälterufer \d* ?legt die Hand auf Siegelstein: Er erwacht wieder/.test(log(st)), 'Der Kälterufer weckt den Stein wieder – die Welle läuft wieder');
}
{
  const st = neu(12, {}, [{ art: 'glasnest', anzahl: 1 }]);
  for (const f of st.figuren.filter((o) => o.seite === 'spieler')) setze(f, 1, f.y);
  runde(st, 9); const n = st.figuren.filter((f) => f.art === 'glasschwaermer').length;
  check(n === 3 && /Schwärmernest \d* ?bricht auf/.test(log(st)), `Das Nest lässt bis zu drei Schwärmer schlüpfen (${n})`);
}

console.log('Durchbruch');
{
  const st = neu(13, { ausgang: { felder: [[10, 3], [10, 4], [10, 5]], text: 'Ihr seid über die Brücke!' } }, [{ art: 'testpuppe', anzahl: 1 }]);
  const p = st.figuren.find((f) => f.art === 'testpuppe'); setze(p, 10, 1);
  const a = held(st), b = held(st, 1);
  setze(a, 10, 3); bis(st, b.id); setze(b, 8, 4); R.bewegen(st, 10, 4);
  check(st.ende === 'sieg' && /über die Brücke/.test(log(st)), 'Stehen alle Helden auf dem Ausgang, ist der Kampf gewonnen');
}

console.log('Probekampf mit allen Mechaniken (Automatik)');
{
  const P = require('../tools/mechanik-sim.js');
  const erg = P.lauf(120);
  check(erg.haengt === 0, `${erg.n} Kämpfe, keiner hängt`);
  check(erg.zielSiege > 0 && erg.zieleErledigt > 0, `Die Automatik erledigt Ziele (${erg.zieleErledigt} Ziele, ${erg.zielSiege} Siege über Ziele)`);
  check(erg.ausgewichen > erg.getroffen, `Angekündigte Flächen: Die Automatik weicht meist aus (${erg.ausgewichen} ausgewichen, ${erg.getroffen} getroffen)`);
  check(erg.wellen > 0 && erg.eisLoecher > 0, `Wellen kommen (${erg.wellen}), das Eis bricht (${erg.eisLoecher} Löcher)`);
  check(erg.sieg > 0.4 && erg.sieg < 1, `Siegquote im Probekampf ${Math.round(erg.sieg * 100)} %`);
}

(async () => {
  console.log('Im Browser (Server auf Port 8765)');
  const { chromium } = require('playwright'), P = require('../tools/mechanik-sim.js');
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1100, height: 950 } }), fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/abenteuer/index.html?schnell&testlauf');
  for (const name of ['markt', 'tor']) {
    const opts = Object.assign({ figuren: ['schildwaechter', 'elementarist', 'lichtbringer', 'kopfgeldjaeger'], stufe: 2, karte: P.PLATZ, keinAnfuehrer: true, zusatzGegner: 0 }, P.PROBE[name](4));
    await p.evaluate((o) => window.AB.kampfStarten(o, () => {}), opts); await p.waitForTimeout(300);
    const zaehle = () => p.evaluate(() => ({ ziele: document.querySelectorAll('#karte .ziel-objekt').length, gefahr: document.querySelectorAll('#karte .gefahr-feld, #karte .gefahr-eis').length, welle: document.querySelectorAll('#karte .welle-kommt').length, schild: document.querySelectorAll('#karte .schild-ring').length, ende: window.AB.st.ende }));
    const start = await zaehle(), max = { gefahr: 0, welle: 0, schild: start.schild }; let z = start;
    for (let i = 0; i < 600 && !z.ende; i++) {
      const s = await p.evaluate(() => (window.AB.st && !window.AB.st.ende ? window.AB.R.aktiv(window.AB.st).seite : 'x'));
      if (s === 'spieler') await p.evaluate(() => window.AB.auto()); else await p.waitForTimeout(40);
      z = await zaehle(); for (const k of ['gefahr', 'welle', 'schild']) max[k] = Math.max(max[k], z[k]);
    }
    if (name === 'markt') check(start.ziele === 3 && max.welle > 0 && z.ende, `Marktplatz im Browser: 3 Siegelsteine, angekündigte Verstärkung zu sehen, Kampf endet (${z.ende})`);
    else check(start.ziele === 2 && start.schild === 1 && max.gefahr > 0 && z.ende, `Tor im Browser: 2 Runensäulen, Runenschild, markierte Felder zu sehen, Kampf endet (${z.ende})`);
  }
  check(!fehler.length, 'keine Seitenfehler' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
  await b.close();
  console.log(ok ? '\nMECHANIK IN ORDNUNG' : '\nMECHANIK FEHLER');
  process.exit(ok ? 0 : 1);
})();
