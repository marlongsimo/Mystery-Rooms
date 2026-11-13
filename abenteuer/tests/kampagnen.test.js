/*
 * Mythara – allgemeiner Test für ALLE Abenteuer in daten/*.js (ohne Browser, ohne Datenbank).
 * Eine neue Kampagne ist damit automatisch geprüft:
 *   • statische Prüfung (Verweise, Sackgassen, Begegnungen, Bilder, Ehrentitel)
 *   • 200 Durchläufe mit festen Zufallszahlen: keine Fehler, alle Szenen und alle regulären Enden erreicht
 *   • js/enden.js passt zu den Daten, und Migration 006 enthält alle Enden (für neue Datenbanken)
 * Aufruf: node abenteuer/tests/kampagnen.test.js [N=200]
 */
const fs = require('fs'), path = require('path');
const K = require('../tools/kampagne.js');
const N = +process.argv[2] || 200;
let ok = true;
const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) ok = false; };

const tabelle = K.endenTabelle(), datei = K.loadEndenDatei();
check(datei && JSON.stringify(datei) === JSON.stringify(tabelle), 'js/enden.js ist aktuell (sonst: node abenteuer/tools/kampagne.js enden)');
const sql = fs.readFileSync(path.join(__dirname, '../supabase/006_rpg_heldensammlung.sql'), 'utf8');
const fehlen = Object.entries(tabelle).flatMap(([ab, v]) => Object.keys(v.enden).filter((e) => !sql.includes(`('${ab}', '${e}')`)).map((e) => ab + '/' + e));
check(!fehlen.length, 'Migration 006 enthält alle regulären Enden' + (fehlen.length ? ': fehlt ' + fehlen.join(', ') + ' (SQL aus „kampagne.js enden“ in Supabase ausführen und in 006 ergänzen)' : ''));

for (const id of K.ids()) {
  const p = K.pruefen(id);
  console.log(`\n${p.titel} (${id})`);
  check(!p.fehler.length, `Statische Prüfung: ${p.szenen} Szenen, ${p.kaempfe} Kämpfe, ${p.enden.length} Enden` + (p.fehler.length ? ' – ' + p.fehler.join(' | ') : ''));
  check(Boolean(K.ALLE[id].META.ehrentitel) || K.ALLE[id].META.entwurf, 'Ehrentitel für alle gefundenen Enden');
  const d = K.durchlauf(id, N);
  check(!d.fehler.length, `${N} Durchläufe ohne Fehler` + (d.fehler.length ? ': ' + d.fehler.slice(0, 2).join(' | ') : ''));
  check(!d.nie.length, 'Alle Szenen erreicht' + (d.nie.length ? ': nie ' + d.nie.join(', ') : ''));
  check(!d.fehlendeEnden.length, 'Alle regulären Enden erreicht (' + Object.entries(d.enden).map(([e, n]) => `${e} ${n}`).join(', ') + ')');
}
console.log(ok ? '\nKAMPAGNEN IN ORDNUNG' : '\nFEHLER'); process.exit(ok ? 0 : 1);
