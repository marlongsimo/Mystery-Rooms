/*
 * Mythara – Grau (Fayes Wolf): beißt nur gerade neben dem Ziel (nicht schräg), läuft höchstens 8 Felder (schräg 1,5),
 * und der Befehl lässt sich nur auf Gegner geben, an die er wirklich herankommt – die Bonusaktion verpufft nicht mehr.
 * Aufruf: node abenteuer/tests/grau.test.js
 */
const R = require("../js/regeln.js"); const D = require("../daten/grauwacht.js"); const kern = require("../server/arena-kern.js"); const botF = require("../server/arena-bot.js");
const K = kern(R, D.KARTEN, botF), BOT = botF(R);
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const weite = (a, b) => { const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y); return Math.max(dx, dy) + 0.5 * Math.min(dx, dy); };
let laeufe = 0, laufFehler = 0, nurLauf = 0, befehle = 0, gerade = 0, schraeg = 0, zuWeit = 0, verpufft = 0, bisse = 0, ausgeschlossen = 0, nahAberUnerreichbar = 0, maxWeg = 0, eingespieltSchraeg = 0;
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
        // „Grau: Heranlaufen“: läuft näher, beißt nicht, höchstens 8 Felder
        for (const z of R.ziele(st, "wolf_lauf")) { const k = R.laden(R.speichern(st)), l0 = k.log.length, d0 = weite(w0, z); const r = R.handeln(k, "wolf_lauf", z.id); laeufe++;
          const w = k.figuren.find((o) => o.id === w0.id), zz = k.figuren.find((o) => o.id === z.id), neu = k.log.slice(l0).map((e) => e.t || "").join(" | ");
          if ((r && r.fehler) || !(weite(w, zz) < d0) || /Biss/.test(neu) || !/läuft auf/.test(neu) || k.zug.bonus || weite(w0, w) > 8) laufFehler++; }
        if (!ziele.length && R.ziele(st, "wolf_lauf").length) nurLauf++;
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
check(laeufe > 60 && laufFehler === 0, `„Grau: Heranlaufen“: Grau kommt dem gewählten Gegner näher, beißt nicht, läuft höchstens 8 Felder, die Bonusaktion ist verbraucht (${laeufe} Läufe, ${laufFehler} Abweichungen)`);
check(nurLauf > 0, `Ist kein Gegner für den Biss erreichbar, bleibt das Heranlaufen als Möglichkeit (${nurLauf}× so vorgekommen)`);
const F = R.FD.FIGUREN.tiergefaehrte;
check(/schräge Schritte zählen 1,5/.test(F.faehig.find((x) => x.id === "wolf_befehl").text) && /gerade neben/.test(F.faehig.find((x) => x.id === "eingespielt").text), "Die Heldenkarte beschreibt die Regeln so");
// Faye am Boden: Grau zieht allein – halbe Laufweite, halber Schaden, sonst nichts
{ console.log("Grau ohne Herrin");
  let zuege = 0, andereAktion = 0, bewegt = 0, weitMax = 0, bisseA = 0, schadenMax = 0, schadenVollMax = 0, botZiehtGrau = 0, ohneWolfUebersprungen = true, steht = 0, endet = 0;
  for (let n = 0; n < 12; n++) { const stufe = [1, 4, 10][n % 3];
    const m = { staerke: 1, seed: 900 + n * 13, modus: "duell", karte: ["garten", "gruft", "pilze", "halle"][n % 4], begegnung: "kobolde", kampfstufe: stufe, host_name: "A", guest_name: "B", bot: true,
      host_team: ["tiergefaehrte", "schildwaechter", "wanderheiler"].map((held) => ({ held, stufe })), guest_team: ["tiergefaehrte", "duellant", "lichtbringer"].map((held) => ({ held, stufe })) };
    let jetzt = 1e6; const st = K.start(m, 0, 0, jetzt).st; let merk = { lauf: 0 }, wer = null, gefaellt = false, wolfWeg = n % 4 === 3;
    for (let i = 0; i < 4000 && !st.ende; i++) {
      const a = R.aktiv(st), tm = R.teamVon(st, a); if (!tm) break; const key = a.id + ":" + st.runde; if (wer !== key) { wer = key; merk = { lauf: 0 }; }
      if (st.runde >= 2) { const neu = !gefaellt; gefaellt = true; // beide Fayes bleiben am Boden (der Rechner richtet sie sonst gleich wieder auf)
        for (const f of st.figuren) if ((f.fid || f.fidA) === "tiergefaehrte" && f.tp > 0) f.tp = 0; if (wolfWeg) for (const w of st.figuren) if (/wolf/.test(w.art || "")) w.tp = 0;
        if (a.tp <= 0 && (neu || !R.kannZiehen(st, a))) { K.zug(st, tm, { typ: "ende" }, ++jetzt); if (R.aktiv(st) === a) R.zugEnde(st); continue; } }
      if (a.fid === "tiergefaehrte" && a.tp <= 0) {
        if (wolfWeg && st.runde >= 2) ohneWolfUebersprungen = false; // in Runde 1 steht Grau noch
        zuege++; const w0 = R.wolfVon(st, a), vx = w0.x, vy = w0.y;
        if (R.kannZiehen(st, a) && st.zug.allein && !st.zug.aktion && st.zug.bewegung === 0) steht++;
        for (const x of ["kurzbogen", "kurzschwert", "spurt", "jaegermal", "trank"]) if (R.verfuegbar(st, x)) andereAktion++;
        if (R.bewegungsfelder(st, a).size > 1 || !K.zug(st, tm, { typ: "bewegen", x: a.x + 1, y: a.y }, ++jetzt).fehler) bewegt++;
        for (const k2 of R.wolfFelder(st, a).keys()) { const [x, y] = k2.split(",").map(Number); weitMax = Math.max(weitMax, weite({ x: vx, y: vy }, { x, y })); }
        const w = tm === 2 ? BOT.entscheide(st, merk) : (() => { for (const id of ["wolf_befehl", "wolf_lauf"]) { const z = R.verfuegbar(st, id) && R.ziele(st, id)[0]; if (z) return { typ: "aktion", aktion: id, ziel: z.id }; } return { typ: "ende" }; })();
        if (tm === 2 && w.typ === "aktion") botZiehtGrau++;
        const l0 = st.log.length; const r = K.zug(st, tm, w, ++jetzt);
        for (const e of st.log.slice(l0)) { const t = e.t || "", mm = /Grau.*Biss.*Treffer, (\d+) Schaden/.exec(t); if (mm) { bisseA++; schadenMax = Math.max(schadenMax, Number(mm[1])); } }
        if (!r.fehler && w.typ !== "ende" && R.aktiv(st) === a) { K.zug(st, tm, { typ: "ende" }, ++jetzt); endet++; }
        continue;
      }
      if (a.fid === "tiergefaehrte") { /* steht noch */ }
      const w = BOT.entscheide(st, merk); if (w.typ === "bewegen") merk.lauf++; const l0 = st.log.length; const r = K.zug(st, tm, w, ++jetzt); if (r.fehler) K.zug(st, tm, { typ: "ende" }, ++jetzt);
      for (const e of st.log.slice(l0)) { const mm = /Grau.*Biss.*Treffer, (\d+) Schaden/.exec(e.t || ""); if (mm) schadenVollMax = Math.max(schadenVollMax, Number(mm[1])); }
    }
  }
  check(zuege > 30 && steht === zuege, `Liegt Faye am Boden und steht Grau, bekommt sie weiter ihren Zug – ohne Aktion, ohne Bewegung, nur mit der Bonusaktion (${zuege} Züge)`);
  check(andereAktion === 0 && bewegt === 0, "Faye selbst kann dabei nichts tun: kein Angriff, kein Trank, kein Schritt");
  check(weitMax > 2 && weitMax <= 4, `Grau läuft ohne Herrin höchstens 4 Felder (weitestes Feld: ${weitMax})`);
  check(bisseA > 5 && schadenMax <= 7, `Graus Biss macht ohne Herrin halben Schaden (${bisseA} Treffer, höchster Schaden ${schadenMax})`);
  check(botZiehtGrau > 3, `Auch der Rechner-Gegner führt Grau allein weiter (${botZiehtGrau}×)`);
  check(ohneWolfUebersprungen, "Liegt auch Grau am Boden, wird Fayes Zug wie bisher übersprungen");
}
// Grau am Boden: Ein Verbündeter daneben kann ihn stabilisieren
{ const m = { staerke: 1, seed: 77, modus: "duell", karte: "garten", begegnung: "kobolde", kampfstufe: 4, host_name: "A", guest_name: "B", bot: true,
    host_team: ["assassine", "tiergefaehrte", "wanderheiler"].map((held) => ({ held, stufe: 4 })), guest_team: ["duellant", "schildwaechter", "lichtbringer"].map((held) => ({ held, stufe: 4 })) };
  let jetzt = 1e6; const st = K.start(m, 0, 0, jetzt).st; let erg = null;
  for (let i = 0; i < 400 && !st.ende && !erg; i++) { const a = R.aktiv(st), tm = R.teamVon(st, a);
    if (tm === 1 && a.fid === "assassine") { const w = st.figuren.find((o) => o.art === "wolf"); w.tp = 0; w.x = a.x + 1; w.y = a.y; for (const o of st.figuren) if (o !== w && o !== a && o.x === w.x && o.y === w.y) { o.x = 0; o.y = 0; }
      const kann = R.ziele(st, "stabilisieren").includes(w), r = K.zug(st, 1, { typ: "aktion", aktion: "stabilisieren", ziel: w.id }, ++jetzt); erg = { kann, fehler: r.fehler || null, tp: w.tp }; }
    else K.zug(st, tm, { typ: "ende" }, ++jetzt); }
  check(erg && erg.kann && !erg.fehler && erg.tp === 1, "Vex kann Grau stabilisieren: Er steht mit 1 TP wieder auf");
}
console.log(ok ? "\nGRAU IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
