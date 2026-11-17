/*
 * Mythara – Grau (Fayes Wolf): beißt nur gerade neben dem Ziel (nicht schräg), läuft höchstens 8 Felder (schräg 1,5),
 * und der Befehl lässt sich nur auf Gegner geben, an die er wirklich herankommt – die Bonusaktion verpufft nicht mehr.
 * Aufruf: node abenteuer/tests/grau.test.js
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js"); const botF = require("../server/arena-bot.js");
const K = kern(R, D.KARTEN, botF), BOT = botF(R);
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const weite = (a, b) => { const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y); return Math.max(dx, dy) + 0.5 * Math.min(dx, dy); };
let befehle = 0, gerade = 0, schraeg = 0, zuWeit = 0, verpufft = 0, bisse = 0, ausgeschlossen = 0, nahAberUnerreichbar = 0, maxWeg = 0, eingespieltSchraeg = 0;
console.log("Grau: Befehl, Reichweite, Biss");
for (let n = 0; n < 24; n++) {
  const gegner = [["duellant", "schildwaechter", "lichtbringer"], ["berserker", "inquisitor", "tiergefaehrte"], ["assassine", "gelehrter", "wanderheiler"]][n % 3];
  const m = { staerke: 1, seed: 300 + n * 17, modus: "duell", karte: ["garten", "turm", "gruft", "pilze", "schacht", "halle", "siegel"][n % 7], begegnung: "kobolde", kampfstufe: [1, 5, 10][n % 3], host_name: "A", guest_name: "B", bot: true,
    host_team: ["tiergefaehrte", "schildwaechter", "wanderheiler"].map((held) => ({ held, stufe: [1, 5, 10][n % 3] })), guest_team: gegner.map((held) => ({ held, stufe: [1, 5, 10][n % 3] })) };
  let jetzt = 1e6; const st = K.start(m, 0, 0, jetzt).st; let merk = { lauf: 0 }, wer = null;
  for (let i = 0; i < 5000 && !st.ende; i++) {
    const a = R.aktiv(st), tm = R.teamVon(st, a); if (!tm) break; const key = a.id + ":" + st.runde;
    // Faye (Team 1) am Zug, Bonusaktion frei: jedes wählbare Ziel an einer Kopie des Stands ausprobieren
    if (tm === 1 && a.fid === "tiergefaehrte" && st.zug.bonus && wer !== key) {
      const w0 = st.figuren.find((o) => o.art === "wolf" && o.besitzer === a.id);
      if (w0 && w0.tp > 0) { const ziele = R.ziele(st, "wolf_befehl"), feinde = st.figuren.filter((o) => o.seite !== a.seite && o.tp > 0);
        ausgeschlossen += feinde.length - ziele.length; nahAberUnerreichbar += feinde.filter((o) => !ziele.includes(o) && weite(w0, o) <= 9).length;
        for (const z of ziele) { const k = R.laden(R.speichern(st)), l0 = k.log.length; const r = R.handeln(k, "wolf_befehl", z.id); befehle++;
          const w = k.figuren.find((o) => o.id === w0.id), zz = k.figuren.find((o) => o.id === z.id), neu = k.log.slice(l0).map((e) => e.t || "").join(" | ");
          if (r && r.fehler) { verpufft++; continue; }
          if (/kommt nicht an/.test(neu)) verpufft++; if (/Biss/.test(neu)) bisse++;
          const d = weite(w, zz); if (d <= 1) gerade++; else schraeg++;
          const weg = weite(w0, w); maxWeg = Math.max(maxWeg, weg); if (weg > 8) zuWeit++; } } }
    if (tm === 2) { jetzt = Math.max(jetzt, st.arena.bot.bis) + 50; if (!K.zeit(st, jetzt).schritte.length) break; }
    else { if (wer !== key) { wer = key; merk = { lauf: 0 }; } jetzt += 1500; const w = BOT.entscheide(st, merk); if (w.typ === "bewegen") merk.lauf++; const l0 = st.log.length; let r = K.zug(st, 1, w, jetzt); if (r.fehler) r = K.zug(st, 1, { typ: "ende" }, jetzt); if (r.fehler) break; }
    wer = key;
  }
}
check(befehle > 60 && verpufft === 0 && bisse === befehle, `Jeder wählbare Befehl führt zu einem Biss – die Bonusaktion verpufft nicht mehr (${bisse} von ${befehle} Befehlen, ${verpufft} ohne Biss)`);
check(schraeg === 0 && gerade === befehle, `Grau steht beim Biss immer gerade neben dem Ziel, nie schräg (${gerade} gerade, ${schraeg} schräg)`);
check(zuWeit === 0 && maxWeg > 4, `Grau läuft höchstens 8 Felder, schräge Schritte zählen 1,5 (weitester Lauf: ${maxWeg})`);
check(ausgeschlossen > 0, `Gegner, an die Grau nicht herankommt, lassen sich gar nicht erst wählen (${ausgeschlossen}× ausgeschlossen, davon ${nahAberUnerreichbar}× in der Nähe, aber versperrt oder zu weit)`);
const F = R.FD.FIGUREN.tiergefaehrte;
check(/schräge Schritte zählen 1,5/.test(F.faehig.find((x) => x.id === "wolf_befehl").text) && /gerade neben/.test(F.faehig.find((x) => x.id === "eingespielt").text), "Die Heldenkarte beschreibt die Regeln so");
console.log(ok ? "\nGRAU IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
