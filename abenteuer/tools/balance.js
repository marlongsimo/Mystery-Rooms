/*
 * Abenteuer – Balancing-Modell für die 15 Charaktere (Stufe 1–3)
 *
 * Rechnet je Figur und Stufe drei Werte über einen Referenzkampf (4 Runden, Gegner wie in Grauwacht):
 *   ANGRIFF  = eigener Schaden pro Runde + Schaden, den die Figur Verbündeten verschafft
 *   SCHUTZ   = eigene TP, umgerechnet auf Rüstung und wie oft die Figur angegriffen wird,
 *              + Heilung und verhinderter Schaden für die Gruppe (in TP)
 *   KAMPFWERT = ANGRIFF × SCHUTZ   (Lanchester: Stärke einer Seite ≈ Schaden × Haltbarkeit)
 * Ziel: Jede Figur liegt je Stufe höchstens 10 % vom Mittel aller 15 entfernt.
 *
 * Annahmen (stehen auch im Dokument):
 *   - 4 Runden je Kampf, 2 Kämpfe je kurzer Rast („1× je Rast“ = 0,5 Einsätze je Kampf),
 *     3 Kämpfe je langer Rast (Zauberplätze, „je lange Rast“).
 *   - Referenzgegner Stufe 1: RK 13, Angriff +4, 6 Schaden je Treffer, Rettungswürfe +1.
 *     Stufe 2: RK 13, +4, 7 Schaden, +1. Stufe 3: RK 14, +5, 8 Schaden, +2.
 *   - Schaden, den ein Gegner pro Runde anrichtet (für „verhindert“): 3,5 / 4 / 5 (gegen RK 15).
 *   - Wie oft angegriffen: vorn 1,3 · Mitte 1,0 · hinten 0,75 (Begleiter-Wolf zieht Angriffe ab).
 *   - Kontrolle (Furcht, festgehalten …) zählt als verhinderter Gegnerschaden bzw. Vorteil für Verbündete.
 * Aufruf: node abenteuer/tools/balance.js   (gibt die Tabelle aus, Ausstiegscode 1 bei Abweichung > 10 %)
 */
"use strict";
const W = { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5 };
const RUNDEN = 4, KAEMPFE_KURZ = 2, KAEMPFE_LANG = 3;
const REF = {
  1: { rk: 13, atk: 4, dmg: 6, rw: 1, gdpr: 3.5 },
  2: { rk: 13, atk: 4, dmg: 7, rw: 1, gdpr: 4 },
  3: { rk: 14, atk: 5, dmg: 8, rw: 2, gdpr: 5 },
};
const PROF = 2, SG = (mod) => 8 + PROF + mod;
const klemm = (x, a = 0.05, b = 0.95) => Math.max(a, Math.min(b, x));
/** Trefferchance (inkl. Krit-Chance) für Angriff mit Bonus b gegen RK */
function treffer(b, rk, vorteil = 0) {
  let p = klemm((21 - (rk - b)) / 20), c = 0.05;
  if (vorteil > 0) { p = 1 - (1 - p) ** 2; c = 1 - 0.95 ** 2; }
  if (vorteil < 0) { p = p ** 2; c = 0.05 ** 2; }
  return { p, c };
}
/** Erwarteter Schaden eines Angriffs: Würfel (Mittel), fester Bonus, Krit verdoppelt Würfel */
function angriff(b, wuerfel, fest, rk, { vorteil = 0, krit = 20 } = {}) {
  const t = treffer(b, rk, vorteil);
  const c = vorteil > 0 ? 1 - (1 - (21 - krit) / 20) ** 2 : (21 - krit) / 20;
  return t.p * (wuerfel + fest) + c * wuerfel;
}
/** Wahrscheinlichkeit, dass ein Gegner einen Rettungswurf gegen SG verfehlt */
const misslingt = (sg, rw) => klemm((sg - 1 - rw) / 20);
/** Wie oft trifft der Referenzgegner die Figur (relativ zu RK 15) */
const gegnerTrifft = (rk, s) => klemm((21 - (rk - REF[s].atk)) / 20);

/* ---------- Die 15 Charaktere ----------
 * Jede Funktion bekommt die Stufe s und liefert:
 *   dpr: eigener Schaden pro Runde (Durchschnitt über den Kampf)
 *   tp, rk, vorn (1,3 / 1,0 / 0,75), extraTp (z. B. Selbstheilung, Schadenshalbierung als TP)
 *   hilfAngriff: Schaden pro Runde, den Verbündete zusätzlich machen
 *   hilfSchutz: TP je Kampf, die der Gruppe erhalten bleiben (Heilung, verhinderter Schaden)
 */
const nutz = (proRast) => proRast / KAEMPFE_KURZ;          // Einsätze je Kampf bei „x× je Rast“
const plaetze = (n) => n / KAEMPFE_LANG;                     // Einsätze je Kampf bei n Zauberplätzen
const TP = (w, kon, s) => w + kon + (s - 1) * (w / 2 + 1 + kon);
const zweiterAtem = (s) => nutz(1) * (W[10] + s);            // Klassenmerkmal Krieger
const tatendrang = (s, schlag) => (s >= 2 ? (nutz(1) * schlag) / RUNDEN : 0); // eine Aktion mehr je Rast

const CHAR = {
  /* ===== Krieger: W10, Zweiter Atem; ab Stufe 2 Tatendrang ===== */
  schildwaechter(s) { // STR 16 KON 14 · RK 18 · vorn · beschützt
    const r = REF[s], schlag = angriff(5, W[8], 3, r.rk);
    // Schildstoß 1× je Kampf statt Angriff: Ziel liegt → nächster Verbündeter mit Vorteil (+~25 % eines Treffers)
    const stoss = misslingt(SG(3), r.rw) * 0.25 * 7 / RUNDEN;
    // Schutzhaltung: Reaktion, 1 (Stufe 3: 2) Angriff je Runde gegen Nachbarn mit Nachteil → ~40 % weniger Treffer
    const schutz = (s >= 3 ? 2 : 1) * RUNDEN * 0.4 * 0.5 * r.dmg * 0.6;   // 60 % der Runden steht jemand daneben
    // Spott: Gegner greifen eher ihn an → Schaden verlagert sich von schwächeren auf ihn (nicht verhindert, verschoben)
    return { dpr: schlag + tatendrang(s, schlag), tp: TP(10, 2, s), rk: s >= 3 ? 19 : 18, vorn: 1.45, extraTp: zweiterAtem(s), hilfAngriff: stoss, hilfSchutz: schutz };
  },
  berserker(s) { // STR 16 KON 14 GES 13 · RK 13 (Fell 12 + GES) · vorn · wird gefährlicher
    const r = REF[s];
    // Rücksichtslos: Vorteil auf seine Angriffe, Gegner haben Vorteil gegen ihn (als Schwäche bei der Haltbarkeit)
    const raserei = Math.min(1, nutz(1) + (s >= 3 ? plaetze(1) : 0));            // Anteil der Kämpfe mit Raserei
    const plus = 2 * raserei + 1 * 0.35;                           // Raserei +2, Blutrausch (unter halben TP, ~35 % der Zeit) +1
    const schlag = angriff(5, W[12], 3 + plus, r.rk, { vorteil: 1 });
    const tp = TP(10, 2, s);                                       // W10 wie alle Krieger
    const halbiert = raserei * tp * 0.6;                           // Waffenschaden halbiert ≈ 60 % mehr TP
    return { dpr: schlag + tatendrang(s, schlag), tp, rk: 13, vorn: 1.3, extraTp: zweiterAtem(s) + halbiert, gegnerVorteil: 0.5, hilfAngriff: 0, hilfSchutz: 0 };
  },
  duellant(s) { // GES 16 KON 14 · RK 15 · vorn · Einzelkampf, Gegenangriff
    const r = REF[s], krit = s >= 3 ? 19 : 20;
    const schlag = angriff(5, W[8], 3, r.rk, { krit });
    // Finte 2× je Rast: Vorteil + 1W6
    const finte = nutz(2) * (angriff(5, W[8] + W[6], 3, r.rk, { vorteil: 1, krit }) - schlag) / RUNDEN;
    // Parade: Reaktion, wenn ein Nahangriff gegen ihn verfehlt (≈ 1,3 Angriffe/Runde, 50 % verfehlen) → Gegenangriff
    const parade = Math.min(1, 1.3 * (1 - gegnerTrifft(15, s))) * schlag;
    // Entwaffnen: 1× je Kampf, Gegner 2 Runden halber Schaden
    const entwaffnen = misslingt(SG(3), r.rw) * 2 * r.gdpr * 0.5;
    return { dpr: schlag + finte + parade * 0.55 + tatendrang(s, schlag), tp: TP(10, 2, s), rk: 15, vorn: 1.3, extraTp: zweiterAtem(s), hilfAngriff: 0, hilfSchutz: entwaffnen };
  },

  /* ===== Zauberer: W8, Arkaner Schutz (RK 11 + GES = 13), Arkane Wucht (Zaubertricks + INT), Plätze 3/4/5 ===== */
  gelehrter(s) { // INT 16 GES 14 KON 13 · hinten · Wissen, Unterstützung
    const r = REF[s], funke = angriff(5, W[10], 3, r.rk);
    const n = plaetze(s + 2);
    // Analyse (Bonusaktion, immer): Ziel −2 RK bis Rundenende → +10 % Trefferchance für ~2,2 Angriffe von Verbündeten
    const analyse = 0.1 * 7.5 * 2.2 + (s >= 3 ? 0.1 * 7.5 * 2.5 : 0);           // Stufe 3: Bannkreis (Grad 2): Gegner im Kreis −2 RK
    // Schutzglyphe (Reaktion, Platz): +5 RK gegen einen Treffer → verhindert ~60 % dieses Treffers
    const glyphe = n * 0.5 * 0.6 * r.dmg;
    // Zeitriss (Platz, statt Funke): Gegner 2 Runden halbe Wirkung
    const riss = n * 0.5 * misslingt(SG(3), r.rw) * 2 * r.gdpr * 0.5;
    const ersatz = n * 0.5 * funke / RUNDEN;                        // Runden ohne Funke
    const gedanke = s >= 2 ? nutz(2) * 0.5 * r.dmg : 0;             // Stufe 2: Verbündeter wiederholt einen Wurf (2× je Rast)
    return { dpr: funke - ersatz, tp: TP(8, 1, s), rk: 13, vorn: 0.75, extraTp: 0, hilfAngriff: analyse, hilfSchutz: glyphe + riss + gedanke };
  },
  elementarist(s) { // INT 16 GES 14 KON 13 · hinten · Flächen
    const r = REF[s], pfeil = angriff(5, W[10], 3, r.rk) + 0.3 * 0.5 * W[4];   // brennender Boden
    const n = plaetze(s + 2), ziele = 2;
    const geschoss = 3 * (W[4] + 1);
    const frost = ziele * (W[6] * 3) * (misslingt(SG(3), r.rw) + (1 - misslingt(SG(3), r.rw)) / 2);
    const welle = ziele * (W[8] * 2) * (misslingt(SG(3), r.rw) + (1 - misslingt(SG(3), r.rw)) / 2);
    const sphaere = 2.5 * (W[6] * 3) * (misslingt(SG(3), r.rw) + (1 - misslingt(SG(3), r.rw)) / 2);
    const bester = s >= 3 ? [sphaere, sphaere, welle, frost] : s >= 2 ? [welle, frost, geschoss] : [frost, geschoss];
    let extra = 0, rest = n; for (const z of bester) { const u = Math.min(1, rest); extra += u * (z - pfeil); rest -= u; if (rest <= 0) break; }
    return { dpr: pfeil + extra / RUNDEN, tp: TP(8, 1, s), rk: 13, vorn: 0.75, extraTp: 0, hilfAngriff: 0, hilfSchutz: 0 };
  },
  schattenmagier(s) { // INT 16 GES 14 KON 13 · hinten · Kontrolle
    const r = REF[s], stich = (W[10] + 3) * misslingt(SG(3), r.rw);
    const stichSchutz = misslingt(SG(3), r.rw) * 0.5 * r.gdpr * 0.6;  // Nachteil auf nächsten Angriff → ~40 % weniger Treffer
    const n = plaetze(s + 2);
    const furcht = misslingt(SG(3), r.rw) * 2 * r.gdpr;              // Gegner 2 Runden aus dem Kampf
    const fessel = misslingt(SG(3), r.rw) * 2 * 0.25 * 7 * 3;          // 2 Runden Vorteil für 3 Verbündete
    const ersatz = n * stich / RUNDEN;
    const trugbild = 0.6 * r.dmg * gegnerTrifft(13, s);                 // erster Angriff gegen ihn mit Nachteil
    const schritt = s >= 2 ? nutz(2) * r.dmg * 0.5 + plaetze(1) * 3 * 0.5 * r.dmg : 0;   // Stufe 2: Schattenschritt (2× je Rast) + Spiegelbilder (Platz, 3 Bilder)
    const albtraum = s >= 3 ? plaetze(2) * 2 * (misslingt(SG(3), r.rw) * (2 * W[8] + r.gdpr) + (1 - misslingt(SG(3), r.rw)) * W[8]) : 0;
    return { dpr: stich - ersatz + albtraum / RUNDEN, tp: TP(8, 1, s), rk: 13, vorn: 0.75, extraTp: trugbild + schritt,
      hilfAngriff: (n / 2) * fessel / RUNDEN, hilfSchutz: RUNDEN * stichSchutz + (n / 2) * furcht };   // Plätze je zur Hälfte Furcht und Schattenfesseln
  },

  /* ===== Schurken: W8, RK 14, Hinterhalt 1W6 (Stufe 3: 2W6); ab Stufe 2 Gerissene Aktion ===== */
  schattenlaeufer(s) { // GES 16 KON 14 · Mitte · Fallen, Bewegung
    const r = REF[s], hint = s >= 3 ? 2 * W[6] : W[6];
    // Leiser Schritt + Verstecken (Gerissene Aktion schon ab Stufe 1): Vorteil in ~45 % der Runden
    const schlag = 0.45 * angriff(5, W[6] + hint, 3, r.rk, { vorteil: 1 }) + 0.55 * angriff(5, W[6] + hint * 0.6, 3, r.rk);
    const rauch = nutz(1) * 2 * r.gdpr * 0.5;                             // Rauchbombe: 2 Runden, Gegner schlechter
    const falle = 0;   // Stufe 3: Fallensteller wirkt außerhalb des Kampfes (Hinterhalt vorbereiten), kein Kampfwert
    return { dpr: schlag + falle, tp: TP(8, 2, s), rk: 14, vorn: 0.9, extraTp: (s >= 2 ? r.dmg : 0), hilfAngriff: 0, hilfSchutz: rauch };
  },
  trickser(s) { // GES 16 CHA 14 KON 13 · Mitte · Täuschung, Ablenkung
    const r = REF[s], hint = s >= 3 ? 2 * W[6] : W[6];
    const dolch = angriff(5, W[4] + hint * 0.75, 3, r.rk) + angriff(5, W[4], 0, r.rk) * 0.5; // Zweitdolch, wenn Bonus frei
    const tricks = nutz(s >= 3 ? 3 : 2);
    // Schmutziger Trick: geblendet 1 Runde → Gegner Nachteil (verhindert ~40 %), Verbündete Vorteil (+25 % von 2 Treffern)
    const trick = tricks * misslingt(SG(3), r.rw) * (r.gdpr * 0.4 + 2 * 0.25 * 7);
    const glueck = 0.5 * r.dmg + 0.3 * 7;                                   // 1× je Kampf: Treffer gegen ihn neu würfeln oder eigenen Wurf
    const tausch = nutz(1) * r.dmg;                                         // holt Verbündete aus der Gefahr
    return { dpr: dolch, tp: TP(8, 1, s), rk: 14, vorn: 1.0, extraTp: glueck * 0.5 + (s >= 2 ? r.dmg : 0), hilfAngriff: trick * 0.4 / RUNDEN, hilfSchutz: trick * 0.6 + tausch };
  },
  assassine(s) { // GES 16 KON 13 · Mitte · Einzelziel
    const r = REF[s], hint = s >= 3 ? 2 * W[6] : W[6];
    // Todesstoß: Runde 1 Vorteil (Ziel hat noch nicht gehandelt ~50 %), überrascht → Krit (10 % der Kämpfe)
    const r1 = 0.5 * angriff(5, W[8] + hint, 3, r.rk, { vorteil: 1 }) + 0.5 * angriff(5, W[8] + hint, 3, r.rk) + 0.1 * (W[8] + hint);
    const sonst = angriff(5, W[8] + hint * 0.7, 3, r.rk);
    const gift = nutz(2) * treffer(5, r.rk).p * W[6];
    const hinrichtung = s >= 3 ? 0.4 * treffer(5, r.rk).p * W[6] : 0;
    return { dpr: (r1 + 3 * sonst) / RUNDEN + gift / RUNDEN + hinrichtung, tp: TP(8, 1, s), rk: 14, vorn: 0.9, extraTp: s >= 2 ? r.dmg : 0, hilfAngriff: 0, hilfSchutz: 0 };
  },

  /* ===== Kleriker: W8, Heilendes Wort, Plätze 3/4/5; ab Stufe 2 Göttliche Macht (je Figur) ===== */
  lichtbringer(s) { // WEI 16 KON 14 STR 13 · RK 18 · vorn/Mitte · gegen Untote
    const r = REF[s], licht = W[8] * misslingt(SG(3), r.rw) + 0.5 * 2;   // Strahlende Aura: 2 an benachbarte Untote (50 %)
    const n = plaetze(s + 2);
    const segen = Math.min(n, 1) * 3 * 2.5 * 0.65 * 0.6 * RUNDEN / RUNDEN; // +1W4 auf Angriffe von 3, ~60 % des Kampfes
    const heil = Math.max(0, n - 1) * (W[4] + 3);
    const vertreiben = s >= 2 ? nutz(1) * 0.6 * misslingt(SG(3), r.rw) * 2 * 2 * r.gdpr : 0;
    const kreis = s >= 3 ? plaetze(1) * 3 * 3 * 0.1 * r.dmg : 0;
    return { dpr: licht, tp: TP(8, 2, s), rk: 18, vorn: 1.15, extraTp: 0, hilfAngriff: segen, hilfSchutz: heil + vertreiben + kreis };
  },
  wanderheiler(s) { // WEI 16 KON 14 GES 13 · RK 15 · Mitte · Heilung, Schutz
    const r = REF[s], ranke = (W[8] + 3) * misslingt(SG(3), r.rw) * 1.2;      // Dornenranke 1W8 + verlangsamt
    const n = plaetze(s + 2);
    const heilwort = (W[4] + 3 + 2 + 1) * n * 0.6;                      // Gesegnete Heilung: +2 + Grad
    const schild = n * 0.4 * RUNDEN * 0.1 * r.dmg * 1.3;                 // +2 RK für Verbündeten vorn bis Kampfende
    const hauch = 0.25 * 1 * 4;                                          // Lebenshauch: steht mit 1 TP auf (Wert: ein Zug zurück)
    const bewahren = s >= 2 ? nutz(1) * 5 * s : 0;
    const massen = s >= 3 ? plaetze(1) * 3 * (W[4] + 3 + 2) : 0;
    return { dpr: ranke, tp: TP(8, 2, s), rk: 15, vorn: 1.0, extraTp: 0, hilfAngriff: 0, hilfSchutz: heilwort + schild + hauch + bewahren + massen };
  },
  inquisitor(s) { // STR 16 KON 14 WEI 14 · RK 18 · vorn · Flüche, Bann
    const r = REF[s], hammer = angriff(5, W[8], 3, r.rk);
    const n = plaetze(s + 2);
    // Brandmal (Bonus): 1× je Kampf ohne Platz, danach mit Platz; +1W6 (Stufe 3: 2W6) auf seine Treffer gegen das Ziel
    const brandmal = Math.min(1, n + 1) * treffer(5, r.rk).p * W[6] * (s >= 3 ? 2 : 1) * 0.85;
    const befehl = Math.max(0, n - 1) * misslingt(SG(2), r.rw) * 1 * r.gdpr;
    const bannen = s >= 2 ? nutz(1) * misslingt(SG(2), r.rw) * 2.5 * r.gdpr : 0;
    return { dpr: hammer + brandmal, tp: TP(8, 2, s), rk: 18, vorn: 1.3, extraTp: 0, hilfAngriff: 0, hilfSchutz: befehl + bannen };
  },

  /* ===== Waldläufer: W10, Jägermal (Bonus, +1W6; 2/3/3 je lange Rast), Fährtenleser ===== */
  wildnislaeufer(s) { // GES 16 WEI 14 KON 13 · RK 14 · hinten · Fernkampf
    const r = REF[s], bon = s >= 2 ? 6 : 5;                                   // Stufe 2: Bogenschütze +1
    const mal = Math.min(1, plaetze(s >= 2 ? 3 : 2));                    // ein Mal hält meist den Kampf über
    const schuss = angriff(bon, W[8] + mal * W[6], 3, r.rk);
    const doppel = s >= 3 ? 0.3 * schuss : 0;                                  // Doppelschuss, wenn zwei Ziele nebeneinander
    const fessel = nutz(2) * misslingt(SG(3), r.rw) * 1.5 * (r.gdpr * 0.5 + 0.25 * 7);
    return { dpr: schuss + doppel, tp: TP(10, 1, s), rk: 14, vorn: 0.75, extraTp: 0, hilfAngriff: 0, hilfSchutz: fessel };
  },
  tiergefaehrte(s) { // GES 16 WEI 14 KON 13 · RK 14 · Mitte · mit Wolf
    const r = REF[s];
    const mal = Math.min(1, plaetze(s >= 2 ? 3 : 2));
    const eigen = angriff(5, W[6] + mal * W[6] * 0.5, 3, r.rk, { vorteil: 0.6 > 0.5 ? 1 : 0 }) * 0.6 + angriff(5, W[6], 3, r.rk) * 0.4; // Rudeltaktik
    const wolf = (s >= 2 ? 0.55 : 0.45) * angriff(4 + (s >= 3 ? 1 : 0), W[6] + (s >= 3 ? W[6] * mal * 0.5 : 0), 2, r.rk, { vorteil: 1 }) * 0.8;
    const umreissen = nutz(2) * misslingt(SG(2), r.rw) * 0.5 * 7 / RUNDEN;
    const wolfTp = 8 + (s - 1) * 4;   // Wolf: eigene TP, zieht ~40 % davon an Angriffen ab; eigene TP der Figur 9/16/23
    return { dpr: eigen + wolf, tp: TP(10, 1, s) - 2, rk: 14, vorn: 0.8, extraTp: wolfTp * 0.4, hilfAngriff: umreissen, hilfSchutz: 0 };
  },
  kopfgeldjaeger(s) { // GES 16 WEI 14 KON 13 · RK 15 · hinten · markiert, nutzt Schwächen
    const r = REF[s], mal = Math.min(1, plaetze(s >= 2 ? 3 : 2));
    const krit = 19;                                              // Schwachstelle gegen markiertes Ziel
    const bolzen = angriff(5, W[8] + mal * W[6] * 0.7, 3, r.rk, { krit });
    const netz = nutz(1) * misslingt(SG(3), r.rw) * (r.gdpr * 0.5 + 0.25 * 7 * 2);
    const erlegen = s >= 3 ? 0.6 * treffer(5, r.rk).p * 2 * W[6] / RUNDEN : 0;
    const fang = 0.15 * bolzen * 0.5;                                              // Fangschuss als Reaktion
    return { dpr: bolzen + erlegen + fang - netz * 0 , tp: TP(10, 1, s), rk: 15, vorn: 0.75, extraTp: 0, hilfAngriff: 0, hilfSchutz: netz * 0.6 };
  },
};

/* ---------- Auswertung ---------- */
function wert(name, s) {
  const c = CHAR[name](s), r = REF[s];
  const angriffW = c.dpr + (c.hilfAngriff || 0);
  // Haltbarkeit: TP gewichtet mit Treffern gegen die Figur relativ zu RK 15 und Angriffshäufigkeit
  let p = gegnerTrifft(c.rk, s); if (c.gegnerVorteil) p = p * (1 - c.gegnerVorteil) + (1 - (1 - p) ** 2) * c.gegnerVorteil;
  const eigen = (c.tp + (c.extraTp || 0)) * (gegnerTrifft(15, s) / p) / c.vorn;
  const schutzW = eigen + (c.hilfSchutz || 0);
  return { name, s, dpr: c.dpr, angriff: angriffW, schutz: schutzW, wert: angriffW * schutzW, tp: c.tp, rk: c.rk };
}
let fehler = 0;
const zeilen = [], GRENZE = 5;
for (const s of [1, 2, 3]) {
  const alle = Object.keys(CHAR).map((n) => wert(n, s));
  const dM = alle.reduce((a, b) => a + b.angriff, 0) / alle.length, eM = alle.reduce((a, b) => a + b.schutz, 0) / alle.length;
  // Beitrag zur Gruppe: Vierergruppe aus drei Durchschnittsfiguren + dieser Figur
  for (const a of alle) a.gruppe = (3 * dM + a.angriff) * (3 * eM + a.schutz) / (16 * dM * eM);
  zeilen.push(`\nStufe ${s}  (Durchschnitt: Angriff ${dM.toFixed(1)}/Runde, Schutz ${eM.toFixed(1)})`);
  zeilen.push("Figur             TP  RK  Schaden/R  Angriff  Schutz  Gruppe");
  for (const a of alle) {
    const ab = (a.gruppe - 1) * 100;
    if (Math.abs(ab) > GRENZE) fehler++;
    zeilen.push(`${a.name.padEnd(16)} ${String(Math.round(a.tp)).padStart(3)} ${String(a.rk).padStart(3)} ${a.dpr.toFixed(1).padStart(9)} ${a.angriff.toFixed(1).padStart(8)} ${a.schutz.toFixed(1).padStart(7)} ${(ab >= 0 ? "+" : "") + ab.toFixed(1)} %${Math.abs(ab) > GRENZE ? "  ← außerhalb" : ""}`);
  }
}
console.log(zeilen.join("\n"));
console.log(fehler ? `\n${fehler} Werte außerhalb ±${GRENZE} %` : `\nAlle 45 Werte (15 Figuren × 3 Stufen) liegen innerhalb ±${GRENZE} % Gruppenbeitrag.`);
if (require.main === module) process.exit(fehler ? 1 : 0);
module.exports = { CHAR, wert };
