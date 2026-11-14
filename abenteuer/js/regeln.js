/*
 * Case Unlocked · Abenteuer – Regeln (ohne Darstellung, testbar im Browser und in Node)
 * W20-Proben, Angriffe, Zustände, Flächen, Reaktionen, Bewegung auf dem Raster, Gegnerverhalten,
 * Todeswürfe (Hardcore) und eine einfache Steuerung für Figuren ohne Spielerin oder Spieler.
 * Die 15 Figuren stehen in figuren.js, ihre Zahlen sind mit tools/balance.js abgestimmt.
 */
(function (root) {
  "use strict";
  const FD = root.ABF || (typeof require === "function" ? require("./figuren.js") : null);

  /* ---------- Zufall (mit Startwert; Zustand in st.rs, damit er sich speichern lässt) ---------- */
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function zufall(st) {
    st.r = function () { st.rs = (st.rs + 0x6d2b79f5) >>> 0; let t = st.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return st;
  }
  const W = (r, n) => 1 + Math.floor(r() * n);
  /** „2W6+3“ → {n:2, s:6, b:3} */
  function parse(expr) { const m = /^(\d+)W(\d+)([+-]\d+)?$/.exec(expr); return { n: +m[1], s: +m[2], b: m[3] ? +m[3] : 0 }; }
  function roll(r, expr, crit = false) {
    const p = parse(expr), n = crit ? p.n * 2 : p.n, rolls = [];
    for (let i = 0; i < n; i++) rolls.push(W(r, p.s));
    return { total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + p.b), rolls, bonus: p.b };
  }
  const mittel = (expr) => { const p = parse(expr); return p.n * (p.s + 1) / 2 + p.b; };
  const mod = (v) => Math.floor((v - 10) / 2);
  const UEBUNG = 2;
  /* ---------- Gegenstände (Beute): getragen im Rucksack, wirken im Kampf ---------- */
  const GEGENSTAENDE = {
    stiefel: { name: "Stiefel des Wanderers", sym: "🥾", text: "+1 Feld Bewegung je Zug." },
    amulett: { name: "Amulett der Abtei", sym: "✠", text: "+1 Rüstungsklasse." },
    ring: { name: "Ring der Stärke", sym: "💍", text: "+1 auf Angriffe im Nahkampf." },
    feder: { name: "Falkenfeder", sym: "🪶", text: "+1 auf Angriffe auf Entfernung (Bogen, Wurf, Zauber)." },
    stab: { name: "Stab der Brüder", sym: "⚚", text: "Gegner haben es schwerer, deinen Zaubern zu widerstehen: Rettungswurf-SG +1.", nur: ["zauberer", "kleriker"] },
    gluecksbringer: { name: "Glücksbringer", sym: "🍀", text: "+1 auf alle Rettungswürfe." },
    silberdolch: { name: "Silberdolch", sym: "🗡", text: "Deine Treffer gegen Untote: +1W4 Schaden." },
    kerze: { name: "Gesegnete Kerze", sym: "🕯", text: "Untote greifen dich mit Nachteil an." },
    grosser_trank: { name: "Großer Heiltrank", sym: "⚗", verbrauch: true, text: "Einmal: Bonusaktion, heilt 4W4+4 TP." },
    rauchbeutel: { name: "Rauchbeutel", sym: "☁", verbrauch: true, text: "Einmal: Aktion, Rauchwolke um dich (1 Feld, 2 Runden). Niemand sieht hinein oder hinaus." },
    rune: { name: "Rune des Schutzes", sym: "ᛟ", text: "Zu Beginn jedes Kampfes 3 zusätzliche Trefferpunkte (verfallen danach)." },
    auge: { name: "Wachsames Auge", sym: "👁", text: "+3 auf die Initiative: Du handelst früher." },
    bernstein: { name: "Bernsteinanhänger", sym: "🔶", text: "Wenn du geheilt wirst, bekommst du 2 TP mehr." },
    wolfszahn: { name: "Wolfszahn", sym: "🦷", text: "Deine Treffer gegen Tiere und Käfer: +1W4 Schaden." },
    eulenmantel: { name: "Eulenmantel", sym: "🦉", text: "Angriffe auf Entfernung gegen dich haben Nachteil." },
    baerenguertel: { name: "Gürtel des Bären", sym: "🐻", text: "Vorteil auf Rettungswürfe für Stärke und Konstitution." },
    katzenbrosche: { name: "Katzenbrosche", sym: "🐈", text: "Vorteil auf Rettungswürfe für Geschicklichkeit." },
    wetzstein: { name: "Wetzstein", sym: "🪨", text: "Deine Angriffe sind schon bei 19 und 20 kritisch." },
    schleifstein: { name: "Geschliffene Klinge", sym: "⚔", text: "+1 Schaden im Nahkampf." },
    eisenspitzen: { name: "Eisenspitzen", sym: "➹", text: "+1 Schaden auf Entfernung (Bogen, Wurf, Zauber)." },
    manastein: { name: "Manastein", sym: "💠", text: "+1 Zauberplatz, nach jeder langen Rast wieder voll.", nur: ["zauberer", "kleriker"] },
    reliquie: { name: "Reliquie der Brüder", sym: "✝", verbrauch: true, nurHardcore: true, text: "Nach einem Kampf, nicht währenddessen: holt eine gefallene Figur mit halben Trefferpunkten zurück. Einmal." },
    heiltraenke: { name: "Zwei Heiltränke", sym: "🧪", verbrauch: true, text: "Zwei gewöhnliche Heiltränke für den Rucksack (je 2W4+2 TP)." },
  };
  const TIERE = new Set(["rostkaefer", "netzweber", "aschehund", "schlammkroete", "alte_unke"]);
  const GEGNER_TP = { wert: 1.05, zusatz: 1 }; // alle Gegner +5 % Leben; in Normal ein Gegner mehr je Kampf
  const hatDing = (f, id) => Boolean(f && (f.rucksack || []).some((d) => d.id === id && d.n > 0));
  const GROSS_TRANK = { id: "grosser_trank", name: "Großer Heiltrank", typ: "bonus", art: "trank", gross: true, heilung: "4W4+4", text: GEGENSTAENDE.grosser_trank.text };
  const RAUCH_DING = { id: "rauchbeutel", name: "Rauchbeutel werfen", typ: "aktion", art: "rauch", ding: "rauchbeutel", radius: 1, dauer: 2, text: GEGENSTAENDE.rauchbeutel.text };
  const SG = (f, attr) => 8 + UEBUNG + mod(f.werte[attr]) + (hatDing(f, "stab") ? 1 : 0);

  /* ---------- Gegenstände ---------- */
  const DINGE = {
    heiltrank: { name: "Heiltrank", text: "Rote, warme Flüssigkeit. Trinken ist eine Bonusaktion und heilt 2W4+2 TP.", heilung: "2W4+2" },
  };
  const TRANK = { id: "heiltrank", name: "Heiltrank trinken", typ: "bonus", art: "trank", heilung: "2W4+2", text: DINGE.heiltrank.text };
  const STABIL = { id: "stabilisieren", name: "Stabilisieren", typ: "aktion", art: "aufrichten", reichweite: 1, stabil: true, text: "Eine Figur am Boden neben dir: In Normal steht sie mit 1 TP auf, in Hardcore hören ihre Todeswürfe auf." };
  const SIEGEL_A = { id: "siegelstein", name: "Siegelstein berühren", typ: "aktion", art: "siegel", text: "Leg die Hand auf einen Siegelstein neben dir: Valdric verliert 2 RK und nimmt 2W6 gleißenden Schaden. Sind alle vier berührt, ist er gebunden und kann keine Toten mehr rufen." };
  const NAME_A = { id: "wahrer_name", name: "„Valdric!“ – den Namen rufen", typ: "aktion", art: "name", text: "Der Name, den Tam euch verraten hat: Valdric verliert seinen nächsten Zug und für den Rest des Kampfes 2 RK. Einmal." };
  const SILBER_A = { id: "silberglocke", name: "Die silberne Glocke läuten", typ: "bonus", art: "silber", text: "Knochenwächter in 6 Feldern machen einen WEI-Rettungswurf (SG 13), sonst zerfallen sie. Einmal." };
  const imPakt = (st, f) => Boolean(st && st.boss && (st.boss.pakt || []).includes(f.fid));
  const bossVon = (st) => st.figuren.find((g) => g.seite === "gegner" && GEGNER[g.art].boss && lebt(g));
  const SPURT = { id: "spurt_aktion", name: "Spurt", typ: "aktion", art: "spurt", text: "Statt einer Aktion: noch einmal so weit laufen, wie du ohnehin kannst." };

  /* ---------- Gegner (Grauwacht) ---------- */
  const GEGNER = {
    rostkaefer: { name: "Rostkäfer", tp: 9, rk: 13, werte: { STR: 12, GES: 12, KON: 13, INT: 1, WEI: 10, CHA: 3 }, angriff: { name: "Biss", bonus: 3, schaden: "1W6+1" }, rost: true, xp: 25 },
    schattenkobold: { name: "Schattenkobold", tp: 7, rk: 13, werte: { STR: 8, GES: 15, KON: 10, INT: 10, WEI: 8, CHA: 8 }, angriff: { name: "Dolch", bonus: 4, schaden: "1W4+2" }, flieht: 3, xp: 25 },
    knochenwaechter: { name: "Knochenwächter", tp: 13, rk: 13, werte: { STR: 10, GES: 14, KON: 15, INT: 6, WEI: 8, CHA: 5 }, angriff: { name: "Kurzschwert", bonus: 4, schaden: "1W6+2" }, untot: true, anfaellig: "wucht", xp: 50 },
    pilzbrut: { name: "Pilzbrut", tp: 18, rk: 5, werte: { STR: 6, GES: 1, KON: 14, INT: 1, WEI: 3, CHA: 1 }, sporen: { sg: 12, schaden: "1W8" }, bewegung: 0, xp: 50 },
    netzweber: { name: "Netzweber", tp: 26, rk: 14, werte: { STR: 14, GES: 16, KON: 12, INT: 2, WEI: 11, CHA: 4 }, angriff: { name: "Biss", bonus: 5, schaden: "1W10+3" }, netz: { bonus: 5, sg: 12, reichweite: 6 }, xp: 200 },
    aschehund: { name: "Aschehund", tp: 22, rk: 13, werte: { STR: 17, GES: 12, KON: 14, INT: 6, WEI: 12, CHA: 6 }, angriff: { name: "Biss", bonus: 5, schaden: "1W8+3" }, atem: { schaden: "3W6", sg: 12, alle: 3 }, xp: 200 },
    abt: { name: "Valdric", tp: 70, rk: 14, werte: { STR: 14, GES: 12, KON: 16, INT: 18, WEI: 16, CHA: 18 }, angriff: { name: "Fluchhand", bonus: 6, schaden: "2W8", reichweite: 6 }, boss: true, bewegung: 3, atem: { schaden: "3W6", sg: 14, alle: 2 }, xp: 1100 },
    // Das Moor der stummen Lichter
    irrlicht: { name: "Irrlicht", tp: 6, rk: 14, werte: { STR: 1, GES: 18, KON: 10, INT: 6, WEI: 12, CHA: 10 }, angriff: { name: "Kalter Funke", bonus: 4, schaden: "1W6+1", reichweite: 4 }, bewegung: 6, xp: 25 },
    moorleiche: { name: "Moorleiche", tp: 16, rk: 10, werte: { STR: 14, GES: 7, KON: 15, INT: 3, WEI: 6, CHA: 3 }, angriff: { name: "Nasser Griff", bonus: 4, schaden: "1W8+2" }, untot: true, bewegung: 4, xp: 50 },
    schlammkroete: { name: "Schlammkröte", tp: 18, rk: 11, werte: { STR: 15, GES: 12, KON: 14, INT: 2, WEI: 10, CHA: 3 }, angriff: { name: "Zunge", bonus: 4, schaden: "1W8+2", reichweite: 2 }, xp: 50 },
    // Weidenhain: Die alte Unke kündigt ihren Zungenschlag an (eine Reihe Felder leuchtet, getroffen wird beim nächsten Zug)
    alte_unke: { name: "Die alte Unke", tp: 34, rk: 12, werte: { STR: 17, GES: 10, KON: 16, INT: 3, WEI: 12, CHA: 5 }, angriff: { name: "Zunge", bonus: 5, schaden: "1W8+3", reichweite: 2 },
      flaeche: { name: "Zungenschlag", form: "linie", reichweite: 5, schaden: "2W6+2", sg: 12, rettung: "GES", alle: 2 }, xp: 150 },
    alwine: { name: "Alwine", tp: 52, rk: 13, werte: { STR: 8, GES: 14, KON: 14, INT: 12, WEI: 16, CHA: 18 }, angriff: { name: "Kalte Hand", bonus: 5, schaden: "2W6+2", reichweite: 4 }, atem: { name: "Wehklage", schaden: "3W6", sg: 13, alle: 3, rettung: "WEI" }, bewegung: 5, xp: 700 },
    // Die letzte Fackel von Hochwacht: Jäger haben es auf die Begleiterin abgesehen (jaeger: true)
    siegeljaeger: { name: "Siegeljäger", tp: 12, rk: 13, werte: { STR: 13, GES: 14, KON: 12, INT: 10, WEI: 12, CHA: 8 }, angriff: { name: "Hakenschwert", bonus: 4, schaden: "1W6+2" }, jaeger: true, bewegung: 6, xp: 50 },
    jaegerschuetze: { name: "Siegeljäger-Schütze", tp: 9, rk: 12, werte: { STR: 10, GES: 15, KON: 11, INT: 10, WEI: 13, CHA: 8 }, angriff: { name: "Kurzbogen", bonus: 4, schaden: "1W6+2", reichweite: 6 }, jaeger: true, xp: 50 },
    wachkonstrukt: { name: "Wachkonstrukt", tp: 30, rk: 16, werte: { STR: 18, GES: 8, KON: 16, INT: 3, WEI: 10, CHA: 1 }, angriff: { name: "Steinfaust", bonus: 5, schaden: "1W10+3" }, bewegung: 4, anfaellig: "wucht", xp: 200 },
    jaegerhauptmann: { name: "Jägerhauptmann", tp: 34, rk: 15, werte: { STR: 16, GES: 13, KON: 14, INT: 12, WEI: 12, CHA: 14 }, angriff: { name: "Kriegsaxt", bonus: 5, schaden: "1W12+3" }, jaeger: true, xp: 200 },
    funkenhund: { name: "Funkenhund", tp: 22, rk: 13, werte: { STR: 17, GES: 12, KON: 14, INT: 6, WEI: 12, CHA: 6 }, angriff: { name: "Biss", bonus: 5, schaden: "1W8+3" }, atem: { schaden: "3W6", sg: 12, alle: 3 }, jaeger: true, xp: 200 },
    fackelzehrer: { name: "Fackelzehrer", tp: 75, rk: 15, werte: { STR: 18, GES: 12, KON: 18, INT: 10, WEI: 14, CHA: 12 }, angriff: { name: "Glutklaue", bonus: 6, schaden: "2W8+3" }, atem: { name: "Aschesturm", schaden: "3W6", sg: 13, alle: 3, rettung: "WEI" }, jaeger: "wechsel", bewegung: 5, xp: 1100 },
    // Die Krone unter dem Eis: Rollen statt Lebenspunkte (Mechaniken siehe KONZEPT-KRONE.md K6)
    frostknecht: { name: "Frostknecht", tp: 18, rk: 15, werte: { STR: 16, GES: 9, KON: 15, INT: 5, WEI: 9, CHA: 5 }, angriff: { name: "Eisaxt", bonus: 4, schaden: "1W8+2" }, bewegung: 4, xp: 100 },
    eisgezeichneter: { name: "Eisgezeichneter", tp: 9, rk: 11, werte: { STR: 12, GES: 10, KON: 12, INT: 4, WEI: 8, CHA: 4 }, angriff: { name: "Klammergriff", bonus: 3, schaden: "1W6+1" }, untot: true, bewegung: 5, xp: 50 },
    glasschwaermer: { name: "Glasschwärmer", tp: 5, rk: 12, werte: { STR: 6, GES: 15, KON: 8, INT: 2, WEI: 10, CHA: 2 }, angriff: { name: "Splitter", bonus: 4, schaden: "1W4+2" }, bewegung: 6, xp: 25 },
    glasnest: { name: "Schwärmernest", tp: 16, rk: 10, werte: { STR: 1, GES: 1, KON: 14, INT: 1, WEI: 1, CHA: 1 }, nest: { art: "glasschwaermer", alle: 2, max: 3 }, bewegung: 0, xp: 100 },
    kaelterufer: { name: "Kälterufer", tp: 16, rk: 12, werte: { STR: 8, GES: 12, KON: 12, INT: 14, WEI: 14, CHA: 12 }, angriff: { name: "Frostlanze", bonus: 5, schaden: "1W8+2", reichweite: 6 }, rufer: { heilung: "1W8+2", reichweite: 6 }, bewegung: 5, xp: 150 },
    runenleser: { name: "Runenleser", tp: 24, rk: 13, werte: { STR: 9, GES: 12, KON: 12, INT: 16, WEI: 14, CHA: 10 }, angriff: { name: "Runenblitz", bonus: 5, schaden: "1W10+2", reichweite: 6 }, feldzauber: { name: "Runenlinie", anzahl: 3, dauer: 2, alle: 3, reichweite: 8 }, bewegung: 5, xp: 250 },
    kettenbestie: { name: "Kettenbestie", tp: 40, rk: 14, werte: { STR: 18, GES: 10, KON: 16, INT: 4, WEI: 10, CHA: 4 }, angriff: { name: "Kettenhieb", bonus: 6, schaden: "2W6+3" }, rueckstoss: { felder: 2, sg: 13 }, bewegung: 5, xp: 450 },
    splitterbrutmutter: { name: "Splitterbrutmutter", tp: 40, rk: 13, werte: { STR: 16, GES: 12, KON: 15, INT: 4, WEI: 10, CHA: 4 }, angriff: { name: "Splitterbiss", bonus: 5, schaden: "2W6+2" }, brut: { art: "glasschwaermer", alle: 2, max: 4 }, bewegung: 4, xp: 450 },
    eidwaechter: { name: "Eidwächter", tp: 40, rk: 15, werte: { STR: 17, GES: 9, KON: 16, INT: 8, WEI: 12, CHA: 8 }, angriff: { name: "Eidhammer", bonus: 5, schaden: "2W6+3" }, untot: true, bewegung: 4, xp: 450 },
    frostmatrone: { name: "Frostmatrone", tp: 60, rk: 14, werte: { STR: 14, GES: 12, KON: 16, INT: 14, WEI: 16, CHA: 14 }, angriff: { name: "Frostgriff", bonus: 6, schaden: "2W8+2", reichweite: 2 },
      feldzauber: { name: "Eiskorridor", anzahl: 3, dauer: 2, alle: 4, reichweite: 9 }, brut: { art: "glasschwaermer", alle: 2, max: 5 }, bewegung: 4,
      flaeche: { name: "Frostwelle", form: "kreis", radius: 1, schaden: "3W6", sg: 14, rettung: "KON", alle: 3, reichweite: 7 },
      phasen: [{ ab: 0.5, text: "Die Frostmatrone kreischt. Der Boden der Kammer überzieht sich mit Raureif, und die Nester glühen auf.", rk: 1 }], xp: 1100 },
    koenig: { name: "Der König unter dem Eis", tp: 90, rk: 16, werte: { STR: 20, GES: 10, KON: 18, INT: 14, WEI: 16, CHA: 18 }, angriff: { name: "Kronenschwert", bonus: 7, schaden: "2W8+4" }, rueckstoss: { felder: 1, sg: 14 }, bewegung: 4,
      flaeche: { name: "Kronenschlag", form: "linie", reichweite: 5, schaden: "4W6", sg: 14, rettung: "GES", alle: 3, phase: 1 },
      phasen: [{ ab: 0.66, text: "Die Krone des Königs bricht. Das Kronenherz öffnet drei Runenpunkte, und aus den Seitengängen tritt seine Ehrengarde. Phase II: Die gebrochene Krone.", welle: "garde" },
        { ab: 0.33, text: "Die Rüstung des Königs zerfällt zu Eis und Licht. Was bleibt, ist ein Schemen um einen pulsierenden Kern. Der Boden des Saals reißt auf. Phase III: Das Herz.", rk: -2, feld: { felder: [[5, 3], [5, 5], [7, 2], [7, 6], [6, 4]], typ: "loch", name: "Der Boden des Saals" } }], xp: 2000 },
    eisenhirte: { name: "Eisenhirte", tp: 70, rk: 16, werte: { STR: 20, GES: 8, KON: 18, INT: 6, WEI: 12, CHA: 6 }, angriff: { name: "Steinfaust", bonus: 6, schaden: "2W8+3" }, bewegung: 3,
      flaeche: { name: "Bodenstoß", form: "ring", radius: 2, schaden: "3W6", sg: 13, rettung: "GES", alle: 3, liegend: true },
      phasen: [{ ab: 0.5, text: "Die Runen am Eisenhirten glühen weiß: Er stampft schneller und wilder.", rk: -1 }], xp: 1100 },
    grabritter: { name: "Grabritter", tp: 45, rk: 17, werte: { STR: 18, GES: 11, KON: 16, INT: 10, WEI: 12, CHA: 12 }, angriff: { name: "Zweihänder", bonus: 6, schaden: "2W6+4" }, untot: true, xp: 450 },
  };
  const WOLF_WERTE = { STR: 12, GES: 15, KON: 12, INT: 3, WEI: 12, CHA: 6 };

  /* ---------- Begegnungen: Gegner je Figur, passend zur Gruppengröße ---------- */
  // gegner: [Art, Anzahl je Figur]. Die Anzahl wird gerundet, der Rundungsrest steckt in den TP der Gegner.
  const BEGEGNUNGEN = {
    garten: { name: "Rostkäfer im Klostergarten", stufe: 1, gegner: [["rostkaefer", 1.3]] },
    kobolde: { name: "Schattenkobolde", stufe: 1, gegner: [["schattenkobold", 1.95]] },
    kaefer_kobolde: { name: "Käfer und Kobolde", stufe: 1, gegner: [["rostkaefer", 0.75], ["schattenkobold", 1.0]] },
    gruft: { name: "Knochenwächter", stufe: 2, gegner: [["knochenwaechter", 1.75]] },
    pilze: { name: "Pilzbrut und Kobolde", stufe: 2, gegner: [["pilzbrut", 1.0], ["schattenkobold", 1.75]] },
    netz: { name: "Netzweber und Knochenwächter", stufe: 2, gegner: [["netzweber", 0.5], ["knochenwaechter", 1.0]] },
    asche: { name: "Aschehunde", stufe: 3, gegner: [["aschehund", 1.0]] },
    ritter: { name: "Grabritter mit Knochenwächtern", stufe: 3, gegner: [["grabritter", 0.25], ["knochenwaechter", 1.25]] },
    asche_knochen: { name: "Aschehunde und Knochenwächter", stufe: 3, gegner: [["aschehund", 0.75], ["knochenwaechter", 0.75]] },
    // Finale: eigener Faktor je Gruppengröße (mit tools/simulation kalibriert: Halle ≈ 85 %, Endkampf ≈ 65 % Sieg)
    halle: { name: "Coldric und die Aschehunde", stufe: 3, gegner: [["grabritter", 0.25], ["aschehund", 0.5]], faktor: { 3: 2.2, 4: 2.6, 5: 3.0, 6: 2.8 } },
    halle_asche: { name: "Die Aschehunde", stufe: 3, gegner: [["aschehund", 0.75]], faktor: { 3: 2.2, 4: 2.6, 5: 3.0, 6: 2.8 } },
    // Das Moor der stummen Lichter (ab 2 Helden): eigene Tabelle je Gruppengröße, mit tools/kalibrieren-moor.js bestimmt
    moor_rand: { name: "Kröten und Irrlichter", zusatzAb: 3, stufe: 1, gegner: [["schlammkroete", 0.5], ["irrlicht", 0.75]], skala: { 2: 1.49, 3: 1.57, 4: 2.78, 5: 3.47, 6: 4.8 }, skalaHC: { 2: 1.35, 3: 1.69, 4: 2.01, 5: 2.71, 6: 3.23 } },
    moor_kroeten: { name: "Schlammkröten", zusatzAb: 3, stufe: 1, gegner: [["schlammkroete", 0.85]], skala: { 2: 1.65, 3: 1.42, 4: 2.45, 5: 2.99, 6: 3.31 }, skalaHC: { 2: 1.61, 3: 1.91, 4: 2.71, 5: 2.92, 6: 2.92 } },
    moor_kroeten2: { name: "Schlammkröten im Ried", zusatzAb: 3, stufe: 2, gegner: [["schlammkroete", 1.0], ["irrlicht", 0.5]], skala: { 2: 1.49, 3: 1.42, 4: 2.06, 5: 2.11, 6: 2.22 }, skalaHC: { 2: 1.17, 3: 1.29, 4: 1.53, 5: 1.53, 6: 2.01 } },
    moor_tote: { name: "Die Ertrunkenen", zusatzAb: 3, stufe: 2, gegner: [["moorleiche", 1.0], ["irrlicht", 0.5]], skala: { 2: 1.82, 3: 1.57, 4: 2.58, 5: 2.85, 6: 3.23 }, skalaHC: { 2: 1.65, 3: 1.82, 4: 2.34, 5: 2.71, 6: 2.99 } },
    moor_schrein: { name: "Alwine, die Stumme", zusatzAb: 3, stufe: 2, gegner: [["alwine", 0.1, 1, 0.6], ["moorleiche", 0.5], ["irrlicht", 0.5]], skala: { 2: 0.75, 3: 0.84, 4: 1.78, 5: 2.45, 6: 3.23 }, skalaHC: { 2: 0.5, 3: 1, 4: 1.61, 5: 1.96, 6: 2.34 } },
    // Die letzte Fackel von Hochwacht (Prototyp): genau ein bis zwei Jäger, dazu Kobolde; Tabelle per tools/eskorte-sim.js
    pass: { name: "Hinterhalt am Pass", stufe: 1, zusatzAb: 99, gegner: [["siegeljaeger", 0.5, 4], ["jaegerschuetze", 0.2, 2], ["schattenkobold", 0.8]], skala: { 2: 2.71, 3: 2.28, 4: 2.23, 5: 2.28, 6: 2.65 }, skalaHC: { 2: 2.59, 3: 2.09, 4: 2.23, 5: 2.18, 6: 2.38 } },
    tor: { name: "Die Wächter aus Stein", stufe: 2, zusatzAb: 99, gegner: [["wachkonstrukt", 0.6, 4, 0.2], ["schattenkobold", 0.6]], skala: { 2: 1.22, 3: 1.49, 4: 2.17, 5: 3.15, 6: 2.99 }, skalaHC: { 2: 0.76, 3: 1.17, 4: 1.39, 5: 1.82, 6: 1.69 } },
    archiv: { name: "Jäger im Archiv", stufe: 2, zusatzAb: 99, gegner: [["siegeljaeger", 0.6, 4], ["jaegerschuetze", 0.2, 2], ["schattenkobold", 0.8]], skala: { 2: 1.78, 3: 4.13, 4: 4.65, 5: 4.67, 6: 5.3 }, skalaHC: { 2: 1.39, 3: 2.85, 4: 2.75, 5: 2.77, 6: 2.85 } },
    wacht: { name: "Die stumme Wacht", stufe: 2, zusatzAb: 99, gegner: [["siegeljaeger", 0.7, 5, 0.5], ["jaegerschuetze", 0.3, 3], ["wachkonstrukt", 0.15, 1, 0.3], ["schattenkobold", 0.6]], skala: { 2: 0.77, 3: 0.92, 4: 1.54, 5: 1.76, 6: 1.68 }, skalaHC: { 2: 0.71, 3: 0.84, 4: 1.41, 5: 1.65, 6: 1.76 } },
    hauptmann: { name: "Der Jägerhauptmann", stufe: 2, zusatzAb: 99, gegner: [["jaegerhauptmann", 0, 1, 1], ["siegeljaeger", 0.7, 5], ["jaegerschuetze", 0.35, 3]], skala: { 2: 1.07, 3: 2.16, 4: 3.27, 5: 3.99, 6: 4.76 }, skalaHC: { 2: 0.54, 3: 1.6, 4: 1.9, 5: 2.55, 6: 3.12 } },
    wehrgang: { name: "Der offene Wehrgang", stufe: 3, zusatzAb: 99, gegner: [["siegeljaeger", 0.6, 5, 0.5], ["jaegerschuetze", 0.3, 3], ["funkenhund", 0.4, 3, 0.5]], skala: { 2: 1.16, 3: 1.27, 4: 1.68, 5: 1.68, 6: 2.09 }, skalaHC: { 2: 1.21, 3: 1.27, 4: 1.68, 5: 1.54, 6: 2.01 } },
    finale: { name: "Das letzte Licht", stufe: 3, zusatzAb: 99, gegner: [["fackelzehrer", 0.1, 1, 0.6], ["funkenhund", 0.3, 3, 0.4], ["siegeljaeger", 0.45, 4, 0.3], ["jaegerschuetze", 0.15, 1]], skala: { 2: 0.51, 3: 0.88, 4: 1.13, 5: 1.74, 6: 2.06 }, skalaHC: { 2: 0.51, 3: 0.99, 4: 1.15, 5: 1.67, 6: 1.93 } },
    // Die Krone unter dem Eis, Akt I (Heldenstufe 1). Faktoren: tools/kampagne.js kaempfe krone --kalibrieren
    k_grat: { name: "Jagd auf die Fackel", stufe: 1, zusatzAb: 99, gegner: [["jaegerhauptmann", 0.25, 1, 0], ["siegeljaeger", 0.35, 3, 0.3], ["jaegerschuetze", 0.3, 2], ["funkenhund", 0.2, 2]], skala: { 2: 0.33, 3: 0.33, 4: 0.83, 5: 1.06, 6: 1.49 }, skalaHC: { 2: 0.28, 3: 0.28, 4: 0.52, 5: 0.89, 6: 1.37 } },
    k_stollen: { name: "Nest im Eis", stufe: 1, zusatzAb: 99, gegner: [["glasnest", 0, 2, 2], ["splitterbrutmutter", 0.25, 1, 0], ["glasschwaermer", 0.4, 3]], skala: { 2: 1.06, 3: 1.06, 4: 1.43, 5: 2.4, 6: 3.05 }, skalaHC: { 2: 0.61, 3: 0.61, 4: 1.31, 5: 1.81, 6: 2.35 } },
    k_pilger: { name: "Die namenlosen Pilger", stufe: 1, zusatzAb: 99, gegner: [["eidwaechter", 0.25, 1, 0], ["kaelterufer", 0.25, 1, 0], ["eisgezeichneter", 0.8, 5, -1]], skala: { 2: 2.02, 3: 2.02, 4: 2.92, 5: 2.8, 6: 3.96 }, skalaHC: { 2: 2.4, 3: 2.4, 4: 1.98, 5: 1.31, 6: 2.62 } },
    k_markt: { name: "Marktplatz der leeren Fenster", stufe: 1, zusatzAb: 99, gegner: [["kaelterufer", 0.25, 1, 0], ["jaegerschuetze", 0.2, 2, 0.6], ["frostknecht", 0.2, 2], ["eisgezeichneter", 0.7, 5]], skala: { 2: 0.43, 3: 0.43, 4: 0.87, 5: 1.18, 6: 1.34 }, skalaHC: { 2: 0.36, 3: 0.36, 4: 0.7, 5: 1.03, 6: 1.1 } },
    k_kammern: { name: "Die Kammern der Verschleppten", stufe: 1, zusatzAb: 99, gegner: [["frostknecht", 0.25, 2, 0.25], ["glasschwaermer", 0.5, 5]], skala: { 2: 0.89, 3: 0.89, 4: 1.63, 5: 2.16, 6: 2.92 }, skalaHC: { 2: 1.23, 3: 1.23, 4: 1.13, 5: 1.43, 6: 2.35 } },
    // Akt II (Heldenstufe 2) und III (Stufe 3)
    k_bruecke: { name: "Die Brücke über den Gletscherbruch", stufe: 2, zusatzAb: 99, gegner: [["kettenbestie", 0.25, 1, 0], ["jaegerschuetze", 0.5, 4, 0.2], ["siegeljaeger", 0.45, 3]], skala: { 2: 0.56, 3: 0.56, 4: 0.91, 5: 2.07, 6: 2.62 }, skalaHC: { 2: 0.25, 3: 0.25, 4: 0.71, 5: 1.46, 6: 1.34 } },
    k_tor: { name: "Das Tor der Kronenwache", stufe: 2, zusatzAb: 99, gegner: [["eisenhirte", 0.25, 1, 0], ["frostknecht", 0.6, 4], ["jaegerschuetze", 0.25, 2, -0.5]], skala: { 2: 0.49, 3: 0.49, 4: 1.15, 5: 0.93, 6: 1.43 }, skalaHC: { 2: 0.38, 3: 0.38, 4: 0.64, 5: 0.64, 6: 1.2 } },
    k_archiv: { name: "Das Archiv der Namen", stufe: 3, zusatzAb: 99, gegner: [["kaelterufer", 0.25, 1, 0], ["runenleser", 0.2, 1, 0.2], ["frostknecht", 0.3, 2, -0.5], ["jaegerschuetze", 0.25, 1, -0.5], ["eisgezeichneter", 0.8, 5], ["glasschwaermer", 0.3, 2]], skala: { 2: 1.46, 3: 1.46, 4: 1.49, 5: 1.59, 6: 2.4 }, skalaHC: { 2: 1.18, 3: 1.18, 4: 1.15, 5: 1.1, 6: 2.2 } },
    k_frost: { name: "Die Frostkammer", stufe: 3, zusatzAb: 99, gegner: [["frostmatrone", 0.25, 1, 0], ["glasnest", 0, 2, 2], ["glasschwaermer", 0.8, 6], ["frostknecht", 0.4, 3, -0.5]], skala: { 2: 0.51, 3: 0.51, 4: 1.15, 5: 1.59, 6: 2.3 }, skalaHC: { 2: 0.39, 3: 0.39, 4: 0.99, 5: 1.23, 6: 1.98 } },
    k_krone: { name: "Der Kronensaal", stufe: 3, zusatzAb: 99, gegner: [["koenig", 0.25, 1, 0], ["frostknecht", 0.5, 4, -1], ["jaegerschuetze", 0.3, 2, -0.5], ["kettenbestie", 0.5, 1, -2]], skala: { 2: 0.68, 3: 0.68, 4: 0.93, 5: 0.8, 6: 1.1 }, skalaHC: { 2: 0.43, 3: 0.43, 4: 0.51, 5: 0.42, 6: 0.6 } },
    // Die Fähre von Graufurt (Kurzabenteuer, Heldenstufe 1, 2–6 Helden). Faktoren: tools/kampagne.js kaempfe graufurt --kalibrieren
    f_kette: { name: "Rost am Anleger", stufe: 1, zusatzAb: 99, gegner: [["rostkaefer", 1.0, 6, 0.3], ["schattenkobold", 0.6, 4, -1]], skala: { 2: 3.6, 3: 3.6, 4: 4.3, 5: 4.1, 6: 3.4 }, skalaHC: { 2: 3.14, 3: 3.41, 4: 3.2, 5: 3.14, 6: 3.23 } },
    f_faehre: { name: "Kobolde an Bord", stufe: 1, zusatzAb: 99, gegner: [["schattenkobold", 1.5, 9, 0.5]], skala: { 2: 1.64, 3: 2.4, 4: 2.98, 5: 4.23, 6: 4.59 }, skalaHC: { 2: 1.78, 3: 1.98, 4: 2.75, 5: 2.67, 6: 3.9 } },
    f_furt: { name: "Auf der Kiesbank", stufe: 1, zusatzAb: 99, gegner: [["schattenkobold", 1.1, 7, 0.3], ["rostkaefer", 0.5, 3, -0.5]], skala: { 2: 1.88, 3: 2.98, 4: 2.98, 5: 3.9, 6: 4.35 }, skalaHC: { 2: 1.55, 3: 2.82, 4: 2.75, 5: 3.7, 6: 3.6 } },
    f_turm: { name: "Der Zöllner zählt", stufe: 1, zusatzAb: 99, gegner: [["knochenwaechter", 0.2, 2, 0.7], ["schattenkobold", 1.1, 7, 0.3]], skala: { 2: 0.9, 3: 2.46, 4: 2.4, 5: 3.8, 6: 4.59 }, skalaHC: { 2: 0.9, 3: 2.04, 4: 2.4, 5: 2.9, 6: 3.41 } },
    // Das Erntefest von Weidenhain (Einsteiger-Kurzabenteuer, Heldenstufe 1, die Unke mit Stufe 2, 2–6 Helden). Faktoren: tools/kampagne.js kaempfe weidenhain --kalibrieren
    w_speicher: { name: "Kröten im Korn", stufe: 1, zusatzAb: 99, gegner: [["schlammkroete", 1.1, 7, 0.2]], skala: { 2: 1.12, 3: 1.19, 4: 1.4, 5: 1.93, 6: 1.98 }, skalaHC: { 2: 1.04, 3: 0.75, 4: 0.88, 5: 1.15, 6: 1.29 } },
    w_muehle: { name: "Am Mühlgraben", stufe: 1, zusatzAb: 99, gegner: [["schlammkroete", 0.6, 4, 0.3], ["irrlicht", 0.5, 3, -0.5]], skala: { 2: 0.67, 3: 1.69, 4: 1.6, 5: 2.67, 6: 2.6 }, skalaHC: { 2: 0.53, 3: 1.12, 4: 1.32, 5: 1.64, 6: 1.6 } },
    w_unke: { name: "Die alte Unke", stufe: 2, zusatzAb: 99, gegner: [["alte_unke", 0, 1, 1], ["irrlicht", 1.2, 7, -0.6], ["schlammkroete", 0.6, 3, -1.3]], skala: { 2: 1.9, 3: 2.9, 4: 2.5, 5: 2.7, 6: 2.6 }, skalaHC: { 2: 1.69, 3: 2.9, 4: 2.67, 5: 2.67, 6: 2.67 } },
    siegel: { name: "Valdric, der Abt ohne Namen", stufe: 3, gegner: [["abt", 0.25], ["knochenwaechter", 0.5]], faktor: { 3: 2.0, 4: 3.3, 5: 3.4, 6: 2.4 } },
  };
  /**
   * Feinabstimmung nach Gruppengröße (Faktor auf die Gegner-TP), je Stufe der Figuren.
   * Mit tools/kalibrieren.js so bestimmt, dass Gruppen mit 3, 4, 5 und 6 Figuren gleich oft gewinnen.
   */
  const SKALA = { 1: { 3: 1.03, 4: 1.07, 5: 0.95, 6: 1.07 }, 2: { 3: 0.95, 4: 1.11, 5: 1.05, 6: 1.11 }, 3: { 3: 0.81, 4: 0.91, 5: 0.93, 6: 0.79 } };
  const SKALA_HARDCORE = { 1: { 3: 1.16, 4: 1.11, 5: 1.11, 6: 1.09 }, 2: { 3: 0.89, 4: 1.03, 5: 0.89, 6: 0.91 }, 3: { 3: 0.81, 4: 0.81, 5: 0.81, 6: 0.73 } };
  /** Gegnerliste für eine Begegnung und Gruppengröße: [{ art, anzahl, tpFaktor }] */
  function skalaK(begId, n, stufe, skala, hardcore) {
    const b = BEGEGNUNGEN[begId] || BEGEGNUNGEN.garten, s = stufe || b.stufe, tab = hardcore ? SKALA_HARDCORE : SKALA;
    // Begegnungen mit eigener Tabelle (z. B. im Moor, spielbar ab 2 Helden): Faktor je Gruppengröße 2–6
    const eigen = hardcore ? b.skalaHC || b.skala : b.skala;
    let k = skala != null ? skala : eigen ? eigen[Math.max(2, Math.min(6, n))] || 1 : (tab[s] && tab[s][Math.max(3, Math.min(6, n))]) || 1;
    if (b.faktor) k *= b.faktor[Math.max(3, Math.min(6, n))] || 1;
    return k;
  }
  function gegnerFuer(begId, n, stufe, skala, hardcore) {
    const b = BEGEGNUNGEN[begId] || BEGEGNUNGEN.garten, k = skalaK(begId, n, stufe, skala, hardcore);
    // [Art, Anzahl je Figur, höchstens, Grundwert]: z. B. genau eine Alwine, deren Leben nur leicht mit der Gruppe wächst (Grundwert + je Figur)
    // Negativer Grundwert: Diese Art kommt erst ab einer gewissen Gruppengröße (sonst gar nicht)
    return b.gegner.map(([art, je, max, basis]) => { const soll = (basis || 0) + je * n, anzahl = Math.min(max || Infinity, Math.max(basis < 0 ? 0 : 1, Math.round(soll))); return { art, anzahl, tpFaktor: anzahl ? k * soll / anzahl : k }; }).filter((g) => g.anzahl > 0);
  }

  /* ---------- Karte ---------- */
  const key = (x, y) => x + "," + y;
  const abstand = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const lebt = (f) => f.tp > 0 && !f.tot && !(f.z && f.z.verbannt);
  function blockiert(st, x, y) { return x < 0 || y < 0 || x >= st.karte.b || y >= st.karte.h || st.karte.block.has(key(x, y)); }
  /** Belegt ist ein Feld nur von stehenden Figuren: Wer am Boden liegt, versperrt keinen Platz (man kann über ihr stehen) */
  function belegt(st, x, y, ausser) { return st.figuren.some((f) => f !== ausser && !f.tot && !(f.z && f.z.verbannt) && f.tp > 0 && f.x === x && f.y === y); }
  const imRauch = (st, x, y) => st.zonen.some((z) => z.art === "rauch" && Math.max(Math.abs(z.x - x), Math.abs(z.y - y)) <= z.radius);

  /** Erreichbare Felder (8 Richtungen, keine Ecken durch Hindernisse), Map key → Kosten */
  function erreichbar(st, f, max) {
    const ziel = new Map([[key(f.x, f.y), 0]]), q = [[f.x, f.y, 0]];
    while (q.length) {
      const [x, y, d] = q.shift();
      if (d >= max) continue;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (blockiert(st, nx, ny)) continue;
        if (dx && dy && (blockiert(st, x + dx, y) || blockiert(st, x, y + dy))) continue;
        const k = key(nx, ny);
        const anderer = st.figuren.find((o) => o !== f && lebt(o) && o.x === nx && o.y === ny);
        if (anderer && anderer.seite !== f.seite) continue; // durch Gegner nicht hindurch
        if (ziel.has(k)) continue;
        ziel.set(k, d + 1); q.push([nx, ny, d + 1]);
      }
    }
    for (const k of [...ziel.keys()]) { const [x, y] = k.split(",").map(Number); if (belegt(st, x, y, f)) ziel.delete(k); }
    return ziel;
  }
  /** Bewegungsfelder des Zugs: normal plus Schattenschritt (über Hindernisse, Chebyshev) */
  function bewegungsfelder(st, f) {
    const m = erreichbar(st, f, st.zug ? st.zug.bewegung : 6);
    if (st.zug && st.zug.schritt > 0) {
      for (let dx = -st.zug.schritt; dx <= st.zug.schritt; dx++) for (let dy = -st.zug.schritt; dy <= st.zug.schritt; dy++) {
        const x = f.x + dx, y = f.y + dy, k = key(x, y);
        if (m.has(k) || blockiert(st, x, y) || belegt(st, x, y, f)) continue;
        m.set(k, "schritt");
      }
    }
    return m;
  }

  /** Sichtlinie: kein Hindernis und kein Rauch dazwischen; im Rauch sieht man nur Nachbarn */
  function sicht(st, a, b) {
    if (abstand(a, b) <= 1) return true;
    if (imRauch(st, a.x, a.y) || imRauch(st, b.x, b.y)) return false;
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 4;
    for (let i = 1; i < n; i++) {
      const x = Math.round(a.x + (b.x - a.x) * i / n), y = Math.round(a.y + (b.y - a.y) * i / n);
      if ((x !== a.x || y !== a.y) && (x !== b.x || y !== b.y) && ((st.karte.block.has(key(x, y)) && !(st.karte.offen && st.karte.offen.has(key(x, y)))) || imRauch(st, x, y))) return false;
    }
    return true;
  }
  /** Deckung: Hindernis direkt neben dem Ziel auf der Seite des Schützen */
  function deckung(st, a, z) {
    for (const k of st.karte.block) {
      if (st.karte.offen && st.karte.offen.has(k)) continue;
      const [x, y] = k.split(",").map(Number), o = { x, y };
      if (abstand(o, z) !== 1 || abstand(a, o) >= abstand(a, z)) continue;
      if ((o.x - z.x) * (a.x - z.x) + (o.y - z.y) * (a.y - z.y) > 0) return true;
    }
    return false;
  }

  /** Klostergarten als gemaltes Bild (12 × 9 Felder deckungsgleich). X = unsichtbare Mauer/Hindernis, das im Bild zu sehen ist */
  const KARTE_GARTEN = (() => {
    const X = (x, y) => ["X", x, y], rand = [];
    for (let x = 0; x < 12; x++) rand.push(X(x, 0), X(x, 8));
    for (let y = 1; y < 8; y++) rand.push(X(0, y), X(11, y));
    // Baum, Säulen, Brunnen mit Statue, Schutt und Torbogen, Bank, Kisten und Karren
    const innen = [X(1, 1), X(2, 1), X(4, 2), X(2, 3), X(3, 5), X(8, 4), X(5, 3), X(5, 4), X(6, 4), X(8, 1), X(9, 1), X(9, 2), X(10, 1), X(10, 2), X(1, 5), X(10, 6), X(10, 7), X(9, 7)];
    return { name: "Der Klostergarten", b: 12, h: 9, bild: "img/welt/klostergarten.webp", hindernisse: rand.concat(innen),
      start: { spieler: [[5, 7], [6, 7], [4, 7], [7, 7], [3, 7], [8, 7]], wolf: [[2, 7], [1, 7], [2, 6], [9, 6]],
        gegner: [[6, 2], [3, 2], [8, 2], [7, 1], [4, 1], [3, 3], [9, 3], [2, 2], [10, 3], [7, 3], [5, 2], [10, 4]] } };
  })();

  /* ---------- Figuren ---------- */
  const fig = (st, id) => st.figuren.find((f) => f.id === id);
  /** Grundbewegung einer Heldin, eines Helden: je Figur, sonst je Klasse, sonst 6 Felder */
  const bewegungVon = (f) => ((f.fid && FD.FIGUREN[f.fid] && FD.FIGUREN[f.fid].bewegung) || (f.klasse && FD.KLASSEN[f.klasse] && FD.KLASSEN[f.klasse].bewegung) || 6) + (hatDing(f, "stiefel") ? 1 : 0);
  const aktiv = (st) => fig(st, st.reihe[st.am]);
  const istFig = (f, fid) => f && f.fid === fid;
  const wolfVon = (st, f) => st.figuren.find((o) => o.art === "wolf" && o.besitzer === f.id);
  const spielerFiguren = (st) => st.figuren.filter((f) => f.seite === "spieler" && f.art !== "wolf" && f.art !== "begleiter");
  const begleiterVon = (st) => st.figuren.find((f) => f.art === "begleiter");
  const gegnerFiguren = (st) => st.figuren.filter((f) => f.seite === "gegner");

  function neueFigur(fid, i, stufe, x, y) {
    const d = FD.FIGUREN[fid], k = FD.KLASSEN[d.klasse], tp = FD.tpVon(fid, stufe);
    const pl = k.plaetze ? FD.PLAETZE[stufe].slice() : [0, 0];
    return {
      id: "f" + i, seite: "spieler", fid, klasse: d.klasse, name: d.name, titel: d.titel, stufe, x, y,
      tp, tpMax: tp, rk: d.rk[stufe - 1], rkBasis: d.rk[stufe - 1], metall: Boolean(d.metall), werte: d.werte,
      plaetze: pl, plaetzeMax: pl.slice(), genutzt: {}, rucksack: [{ id: "heiltrank", n: 1 }], z: {}, todes: { e: 0, f: 0 }, reaktion: 1,
    };
  }

  /**
   * Neuer Kampf.
   * opts.figuren: Liste von Figuren-IDs (3–6), opts.stufe 1–3, opts.schwierigkeit "normal" | "hardcore",
   * opts.gegner: [{ art, anzahl }] (Standard: so viele Rostkäfer wie Figuren), opts.karte
   */
  function neuesSpiel(seed, opts = {}) {
    const st = { sparen: opts.sparen != null ? opts.sparen : 1, seed, rs: seed >>> 0 || 1, karte: null, figuren: [], log: [], runde: 1, reihe: [], am: 0, zug: null, ende: null, xp: 0, zonen: [], brand: [],
      stufe: opts.stufe || 1, schwierigkeit: opts.schwierigkeit === "hardcore" ? "hardcore" : "normal", ereignisse: [], boss: opts.boss ? JSON.parse(JSON.stringify(opts.boss)) : null, siegel: [] };
    zufall(st);
    const r = st.r; let k = opts.karte || KARTE_GARTEN;
    st.siegel = k.hindernisse.filter(([t]) => t === "Z").map(([, x, y]) => ({ x, y, beruehrt: false }));
    st.karte = { name: k.name, boden: k.boden || null, b: k.b, h: k.h, bild: k.bild || null, hindernisse: k.hindernisse, start: k.start, block: new Set(k.hindernisse.map(([, x, y]) => key(x, y))), offen: new Set(k.hindernisse.filter(([t]) => t === "P" || t === "Q" || t === "L").map(([, x, y]) => key(x, y))) };
    if (opts.mechanik) mechanikStart(st, opts.mechanik, 1);
    const fids = (opts.figuren && opts.figuren.length ? opts.figuren : ["schildwaechter", "elementarist", "lichtbringer"]).slice(0, 6);
    fids.forEach((fid, i) => {
      const [x, y] = k.start.spieler[i];
      const f = neueFigur(fid, i, st.stufe, x, y);
      const v = opts.vorher && opts.vorher[fid];
      const extra = opts.ausruestung && opts.ausruestung[fid];
      if (extra) { f.rk += extra.rk || 0; f.rkBasis += extra.rk || 0; f.ausruestung = extra.name; st.log.push({ t: `${f.name} trägt ${extra.name}: RK ${f.rk}.`, art: "gut" }); }
      if (v) { f.tp = v.tot ? 0 : Math.max(v.tp, 1); f.tot = Boolean(v.tot); f.plaetze = v.plaetze.slice(); f.genutzt = Object.assign({}, v.genutzt); f.rucksack = JSON.parse(JSON.stringify(v.rucksack)); }
      st.figuren.push(f);
      if (hatDing(f, "rune") && !f.tot && f.tp > 0) { f.tp += 3; f.tpMax += 3; }
      if (hatDing(f, "manastein") && f.plaetzeMax) f.plaetzeMax[0]++;
      if (f.tot) { f.x = -1; f.y = -1; }
      const wd = FD.FIGUREN[fid].wolf;
      if (wd) {
        const frei = k.start.wolf.find(([wx, wy]) => !belegt(st, wx, wy));
        st.figuren.push({ id: "w" + i, seite: "spieler", art: "wolf", besitzer: f.id, name: wd.name, x: frei[0], y: frei[1], tp: wd.tp[st.stufe - 1], tpMax: wd.tp[st.stufe - 1], rk: wd.rk, rkBasis: wd.rk, werte: WOLF_WERTE, z: {}, reaktion: 1, genutzt: {} });
      }
    });
    // Eskorte: eine Begleiterin (z. B. Sera Venn) als eigene Figur auf Heldenseite – ohne Spielerzug, sie läuft in der Begleiterphase
    if (opts.begleiter) {
      const b = opts.begleiter;
      st.figuren.push({ id: "b0", seite: "spieler", art: "begleiter", name: b.name, titel: b.titel || "Begleiterin", x: b.start[0], y: b.start[1], tp: b.tp, tpMax: b.tp, rk: b.rk || 12, rkBasis: b.rk || 12,
        werte: b.werte || { STR: 8, GES: 12, KON: 10, INT: 13, WEI: 14, CHA: 13 }, z: {}, reaktion: 0, genutzt: {}, rucksack: [], todes: { e: 0, f: 0 }, gefesselt: Boolean(b.gefesselt) });
      st.eskorte = { route: b.route.map((p) => p.slice()), schritt: 0, ausgang: b.ausgang !== false && !b.aktivierung, aktivierung: b.aktivierung ? { runden: b.aktivierung.runden || 2, name: b.aktivierung.name || "das Gerät", fortschritt: 0, ununterbrochen: Boolean(b.aktivierung.ununterbrochen) } : null, jaegerSieg: Boolean(b.jaegerSieg), schrittweite: b.schrittweite || 2, warten: b.warten || 3, unten: null };
      st.log.push(b.gefesselt ? { t: `${b.name} liegt gefesselt bei den Jägern. Besiegt sie, um sie zu befreien.`, art: "gut" } : { t: `${b.name} ist bei euch. Bringt sie zum Ausgang – manche Gegner haben es auf sie abgesehen.`, art: "gut" });
    }
    // Gemischte Startplätze der Gegner (Abwechslung)
    if (opts.mischen) { const g = k.start.gegner.slice(); for (let i = g.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; } k = Object.assign({}, k, { start: Object.assign({}, k.start, { gegner: g }) }); }
    // Allgemeiner Faktor für das Leben aller Gegner (Ausgleich zur Klassenbalance)
    const tpGlobal = opts.tpGlobal != null ? opts.tpGlobal : GEGNER_TP.wert;
    // Ein zusätzlicher Gegner der häufigsten Art (nicht bei fest vorgegebenen Gegnern wie im Duell)
    const basis = opts.gegner ? opts.gegner : gegnerFuer(opts.begegnung || "garten", fids.length, st.stufe, opts.skala, st.schwierigkeit === "hardcore").map((g) => Object.assign({}, g));
    const zusatzN = opts.zusatzGegner != null ? opts.zusatzGegner : opts.schwierigkeit === "hardcore" ? 0 : GEGNER_TP.zusatz; // Zusatzgegner nur in Normal
    // Begegnungen mit „zusatzAb“ (Moor): der Zusatzgegner erst ab dieser Gruppengröße – bei 2 Helden zählt jeder Gegner doppelt
    const begZ = BEGEGNUNGEN[opts.begegnung || "garten"] || {};
    if (!opts.gegner && zusatzN && !(begZ.zusatzAb && fids.length < begZ.zusatzAb)) { const h = basis.filter((g) => !GEGNER[g.art].boss).sort((a, b) => b.anzahl - a.anzahl)[0]; if (h) h.anzahl += zusatzN; }
    const gruppen = basis.map((g) => Object.assign({}, g, { tpFaktor: (g.tpFaktor || 1) * (opts.skalaMal || 1) * tpGlobal })).concat(opts.zusatz || []);
    let gi = 0, ji = 0;
    for (const g of gruppen) for (let i = 0; i < g.anzahl; i++) {
      const d = GEGNER[g.art];
      let [x, y] = k.start.gegner[gi % k.start.gegner.length];
      // Eskorte: Jäger haben eigene Startplätze (z. B. auch hinter der Gruppe), damit große Gruppen von mehreren Seiten gefordert werden
      const jp = d.jaeger && k.start.jaeger && k.start.jaeger.find((p, n) => n >= ji && !belegt(st, p[0], p[1]));
      if (jp) { [x, y] = jp; ji = k.start.jaeger.indexOf(jp) + 1; }
      if (!jp && (gi >= k.start.gegner.length || belegt(st, x, y) || blockiert(st, x, y))) {
        // nächstes freies Feld auf der Gegnerseite
        let best = null;
        for (let yy = 0; yy < k.h; yy++) for (let xx = Math.floor(k.b * 0.6); xx < k.b; xx++) { if (blockiert(st, xx, yy) || belegt(st, xx, yy)) continue; const dd = Math.abs(xx - x) + Math.abs(yy - y) + (k.b - 1 - xx) * 0.1; if (!best || dd < best.dd) best = { xx, yy, dd }; }
        if (best) { x = best.xx; y = best.yy; }
      }
      const nr = gruppen.length === 1 || g.anzahl > 1 ? " " + (i + 1) : "";
      const gtp = Math.max(1, Math.round(d.tp * (g.tpFaktor || 1)));
      st.figuren.push({ id: "g" + gi, seite: "gegner", art: g.art, name: ((opts.namen && opts.namen[g.art]) || g.name || d.name) + nr, x, y, tp: gtp, tpMax: gtp, rk: d.rk, rkBasis: d.rk, werte: d.werte, z: {}, reaktion: 1, genutzt: {}, atemBereit: true });
      gi++;
    }
    // Mechaniken: Leben der Verstärkung wie die Begegnung; Gegner mit Sonderzügen brauchen den Mechanik-Zustand auch ohne Ziele
    const tpk = skalaK(opts.begegnung || "garten", fids.length, st.stufe, opts.skala, st.schwierigkeit === "hardcore") * (opts.skalaMal || 1) * tpGlobal;
    if (!st.mech && gegnerFiguren(st).some((g) => { const d = GEGNER[g.art]; return d.flaeche || d.nest || d.brut || d.feldzauber || d.rufer || d.phasen; })) mechanikStart(st, {}, tpk);
    if (st.mech) { st.mech.tpk = tpk; mechanikGegner(st); }
    // Anführer: der zäheste Gegner bekommt mehr Leben, bessere Rüstung und trifft besser
    if (opts.anfuehrer) { const a = gegnerFiguren(st).filter((g) => !GEGNER[g.art].boss).sort((x, y) => y.tpMax - x.tpMax)[0]; if (a) { a.tp = a.tpMax = Math.round(a.tpMax * (st.schwierigkeit === "hardcore" ? 1.4 : 1.6)); a.rk += 1; a.rkBasis += 1; a.anfuehrer = true; a.name = a.name.replace(/ \d+$/, "") + " (Anführer)"; st.log.push({ t: `Ein Anführer führt die Gegner: ${a.name}.`, art: "schlecht" }); } }
    // Zauberer haben die Zeichen gelesen: ein Siegelstein leuchtet schon zu Kampfbeginn
    if (opts.boss && opts.boss.stein && st.siegel && st.siegel.length) { const b = bossVon(st); if (b) { st.siegel[0].beruehrt = true; b.rk -= 2; st.log.push({ t: `Ein Siegelstein leuchtet schon: ${b.name} verliert 2 RK.`, art: "gut" }); } }
    // Überraschung: Gegner setzen die erste Runde aus. Läufer: ein Gegner rennt zu einem Feld (z. B. Glockenseil)
    if (opts.ueberraschung) for (const g of gegnerFiguren(st)) g.ueberrascht = true;
    if (opts.laeufer) {
      const kand = gegnerFiguren(st).filter((g) => g.art === opts.laeufer.art).sort((a, b) => abstand(b, { x: opts.laeufer.feld[0], y: opts.laeufer.feld[1] }) - abstand(a, { x: opts.laeufer.feld[0], y: opts.laeufer.feld[1] }));
      if (kand[0]) { kand[0].laeufer = { x: opts.laeufer.feld[0], y: opts.laeufer.feld[1], ereignis: opts.laeufer.ereignis, nah: opts.laeufer.nah != null ? opts.laeufer.nah : 1, warten: Boolean(opts.laeufer.warten) }; kand[0].name += " (rennt zum Seil)"; }
    }
    // Initiative (Wölfe handeln im Zug ihrer Besitzerin)
    const teil = st.figuren.filter((f) => f.art !== "wolf" && f.art !== "begleiter");
    for (const f of teil) { const w = W(r, 20); f.ini = w + mod(f.werte.GES) + (hatDing(f, "auge") ? 3 : 0); f.iniWurf = w; }
    st.reihe = teil.slice().sort((a, b) => b.ini - a.ini || mod(b.werte.GES) - mod(a.werte.GES) || (a.seite === "spieler" ? -1 : 1)).map((f) => f.id);
    st.log.push({ t: "Initiative: " + st.reihe.map((id) => { const f = fig(st, id); return `${f.name} (${f.ini})`; }).join(" · ") });
    if (st.schwierigkeit === "hardcore") st.log.push({ t: "Hardcore: Wer am Boden liegt, würfelt Todeswürfe. Der Tod ist endgültig.", art: "schlecht" });
    if (opts.ueberraschung) st.log.push({ t: "Überraschung! Die Gegner setzen die erste Runde aus.", art: "gut" });
    // Jagdvorbereitung: Kopfgeldjäger ab Stufe 2 beginnt mit einem markierten Gegner
    for (const f of spielerFiguren(st)) if (istFig(f, "kopfgeldjaeger") && f.stufe >= 1) {
      const z = gegnerFiguren(st).sort((a, b) => b.tp - a.tp)[0];
      if (z) { z.z.mal_jaeger = f.id; f.malZiel = z.id; st.log.push({ t: `${f.name} hat ${z.name} schon im Visier (Jagdvorbereitung).` }); }
    }
    beginneZug(st);
    return st;
  }

  /* ---------- Fähigkeiten einer Figur ---------- */
  function faehigkeiten(f) {
    if (!f || f.seite !== "spieler" || f.art === "wolf") return [];
    return FD.faehigVon(f.fid, f.stufe);
  }
  function findeAktion(f, id) {
    if (!f) return null;
    if (id === "heiltrank") return { a: TRANK, typ: "bonus" };
    if (id === "stabilisieren") return { a: STABIL, typ: "aktion" };
    if (id === "spurt_aktion") return { a: SPURT, typ: "aktion" };
    if (id === "siegelstein") return { a: SIEGEL_A, typ: "aktion" };
    if (id === "ziel") return { a: ZIEL_A, typ: "aktion" };
    if (id === "wahrer_name") return { a: NAME_A, typ: "aktion" };
    if (id === "silberglocke") return { a: SILBER_A, typ: "bonus" };
    if (id === "grosser_trank") return { a: GROSS_TRANK, typ: "bonus" };
    if (id === "rauchbeutel") return { a: RAUCH_DING, typ: "aktion" };
    const fid = f.fid, liste = fid ? FD.faehigVon(fid, f.stufe) : [];
    const a = liste.find((x) => x.id === id && x.typ !== "passiv");
    return a ? { a, typ: a.typ } : null;
  }
  /** Alle wählbaren Aktionen in fester Reihenfolge (für Tisch und Handy) */
  function aktionenVon(f, st) {
    const liste = faehigkeiten(f).filter((a) => a.typ === "aktion" || a.typ === "bonus" || a.typ === "frei");
    if (trankZahl(f)) liste.push(TRANK);
    if (hatDing(f, "grosser_trank")) liste.push(GROSS_TRANK);
    if (hatDing(f, "rauchbeutel")) liste.push(RAUCH_DING);
    if (!st || st.figuren.some((o) => o.seite === "spieler" && o.art !== "wolf" && o.tp <= 0 && !o.tot)) liste.push(STABIL);
    if (st && st.siegel && st.siegel.some((z) => !z.beruehrt) && !imPakt(st, f)) liste.push(SIEGEL_A);
    if (st && st.mech && st.mech.ziele.some(zielOffen)) { const zn = zielNeben(st, f); liste.push(zn && zn.aktion ? Object.assign({}, ZIEL_A, { name: zn.aktion }) : ZIEL_A); }
    if (st && st.boss && st.boss.name && !st.boss.nameGenutzt) liste.push(NAME_A);
    if (st && st.boss && st.boss.silber && !st.boss.silberGenutzt) liste.push(SILBER_A);
    liste.push(SPURT);
    return liste;
  }
  const trankZahl = (f) => { const t = (f.rucksack || []).find((d) => d.id === "heiltrank"); return t ? t.n : 0; };
  /** Wie oft eine Fähigkeit in diesem Kampf noch geht (Infinity = beliebig) */
  /** Begrenzte Fähigkeit: wie oft insgesamt und wofür ({ n, je }) oder null */
  function grenze(f, a) {
    if (a.id === "raserei") return { n: 1, je: "Rast" };
    if (!a.pro || a.id === "brandmal") return null;
    const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange;
    return { n: Array.isArray(v) ? v[(f.stufe || 1) - 1] : v, je: a.pro.kampf != null ? "Kampf" : a.pro.rast != null ? "Rast" : "lange Rast" };
  }
  function rest(f, a) {
    const gen = (f.genutzt || {})[a.id] || 0;
    if (a.id === "raserei") return 1 - gen;
    if (a.id === "brandmal") return Infinity; // erster frei, danach Platz
    if (!a.pro) return Infinity;
    const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange;
    const n = Array.isArray(v) ? v[f.stufe - 1] : v;
    return n - gen;
  }
  /** Platz finden: kleinster passender Grad, Rückgabe Index oder -1 */
  function platzIndex(f, grad) {
    for (let g = grad; g <= 2; g++) if ((f.plaetze || [0, 0])[g - 1] > 0) return g - 1;
    return -1;
  }
  function brauchtPlatz(f, a) {
    if (a.id === "brandmal") return ((f.genutzt || {}).brandmal_frei || 0) >= 1 ? 1 : 0;
    if (a.art === "mal" && a.mal === "jaeger") return 0;
    return a.platz || 0;
  }

  /* ---------- Zustände ---------- */
  const ZUSTAND_NAME = { verlangsamt: "verlangsamt", veraengstigt: "verängstigt", festgehalten: "festgehalten", geblendet: "geblendet", liegend: "liegt", vergiftet: "vergiftet", entwaffnet: "entwaffnet", zeitriss: "Zeitriss", verbannt: "verbannt", raserei: "Raserei", versteckt: "versteckt", segen: "gesegnet", schild: "Schild des Glaubens", spiegel: "Spiegelbilder", finte: "Finte", gift: "Gift bereit", spott: "verspottet", stich: "Schattenstich", ruecksichtslos: "rücksichtslos", rueckzug: "Rückzug", blutung: "blutet", bruch: "Rüstung durchbrochen" };
  function zustaende(st, f) {
    const z = f.z || {}, out = [];
    for (const k of Object.keys(ZUSTAND_NAME)) if (z[k]) out.push(k === "spiegel" ? `${ZUSTAND_NAME[k]} (${z[k]})` : ZUSTAND_NAME[k]);
    if (z.mal_jaeger) out.push("Jägermal");
    if (z.brandmal) out.push("Brandmal");
    if (z.analyse === st.runde) out.push("analysiert (−2 RK)");
    return out;
  }
  const dauer = (v) => (typeof v === "object" ? v.rest : v);

  /** Effektive Rüstungsklasse gegen einen Angriff */
  function rkEff(st, z, a, spec = {}) {
    let rk = z.rk + (hatDing(z, "amulett") ? 1 : 0);
    if (z.z.schild) rk += 2;
    if (z.seite === "spieler" && st.figuren.some((l) => istFig(l, "lichtbringer") && lebt(l) && l.z.schutzkreis > st.runde && abstand(l, z) <= 2)) rk += 2;
    if (z.z.analyse === st.runde) rk -= 2;
    if (z.z.zeitriss) rk -= 2;
    if (z.z.bruch && z.z.bruch.bis > st.runde) rk -= z.z.bruch.n; // Waldläufer: Durchbrechen
    if (z.seite === "gegner" && st.zonen.some((zo) => zo.art === "bann" && Math.max(Math.abs(zo.x - z.x), Math.abs(zo.y - z.y)) <= zo.radius)) rk -= 2;
    if (a && spec.fern && abstand(a, z) > 1 && !istFig(a, "wildnislaeufer") && deckung(st, a, z)) rk += 2;
    return rk;
  }
  /** Vorteil (+1), Nachteil (−1) oder neutral (0) mit Gründen */
  function vorteil(st, a, z, spec = {}) {
    const plus = [], minus = [];
    const nah = abstand(a, z) <= 1;
    if (z.z.festgehalten) plus.push("festgehalten");
    if (z.z.geblendet) plus.push("geblendet");
    if (z.z.liegend && nah) plus.push("liegt");
    if (z.z.liegend && !nah) minus.push("liegt (fern)");
    if (a.z.versteckt) plus.push("aus dem Versteck");
    if (a.z.finte) plus.push("Finte");
    if (spec.ruecksichtslos) plus.push("rücksichtslos");
    if (z.z.ruecksichtslos) plus.push("Ziel rücksichtslos");
    if (istFig(a, "assassine") && !z.gehandelt) plus.push("Todesstoß");
    if (istFig(a, "tiergefaehrte")) { const w = wolfVon(st, a); if (w && lebt(w) && abstand(w, z) <= 1) plus.push("Rudeltaktik"); }
    if (a.art === "wolf") { const b = fig(st, a.besitzer); if (b && lebt(b) && abstand(b, z) <= 1) plus.push("Rudeltaktik"); }
    if (a.z.geblendet) minus.push("geblendet");
    if (a.z.vergiftet) minus.push("vergiftet");
    if (a.z.liegend) minus.push("liegt");
    if (a.z.stich) minus.push("Schattenstich");
    if (a.z.spott && a.z.spott !== z.id) minus.push("verspottet");
    if (a.seite === "gegner" && GEGNER[a.art] && GEGNER[a.art].untot && hatDing(z, "kerze")) minus.push("Gesegnete Kerze");
    if (!nah && hatDing(z, "eulenmantel")) minus.push("Eulenmantel");
    if (istFig(z, "schattenmagier") && z.trugbildRunde !== st.runde) minus.push("Trugbild");
    if (spec.fern && a.seite === "spieler" && st.figuren.some((o) => o.seite !== a.seite && lebt(o) && abstand(o, a) <= 1)) minus.push("Gegner daneben");
    const v = plus.length && minus.length ? 0 : plus.length ? 1 : minus.length ? -1 : 0;
    return { v, plus, minus };
  }

  /* ---------- Würfe ---------- */
  function w20(st, v) {
    const a = W(st.r, 20);
    if (!v) return { w: a, alle: [a] };
    const b = W(st.r, 20);
    return { w: v > 0 ? Math.max(a, b) : Math.min(a, b), alle: [a, b] };
  }
  /** Gedankenstütze der Gelehrten: knapp misslungenen W20 eines Verbündeten wiederholen (2× je Rast) */
  function gedankenstuetze(st, wer, fehlt) {
    if (wer.seite !== "spieler" || fehlt > 3 || fehlt <= 0) return null;
    const g = st.figuren.find((o) => istFig(o, "gelehrter") && lebt(o) && o.stufe >= 2 && (o.genutzt.gedankenstuetze || 0) < 2 && abstand(o, wer) <= 12);
    if (!g) return null;
    g.genutzt.gedankenstuetze = (g.genutzt.gedankenstuetze || 0) + 1;
    return g;
  }
  /** Rettungswurf: {erfolg, w, total} */
  function rettung(st, z, attr, sg) {
    let v = 0; if (attr === "GES" && z.z.festgehalten) v = -1;
    if (((attr === "STR" || attr === "KON") && hatDing(z, "baerenguertel")) || (attr === "GES" && hatDing(z, "katzenbrosche"))) v += 1;
    let { w } = w20(st, v);
    const bon = () => mod(z.werte[attr]) + (z.seite === "spieler" && z.klasse && FD.KLASSEN[z.klasse].rettung.includes(attr) ? UEBUNG : 0);
    // Klassenmerkmal Kleriker: Beistand – Verbündete direkt neben einem Kleriker +1
    const glueck = (hatDing(z, "gluecksbringer") ? 1 : 0) + (z.seite === "spieler" && st.figuren.some((k) => k !== z && k.seite === "spieler" && lebt(k) && FD.KLASSEN[k.klasse] && FD.KLASSEN[k.klasse].beistand && abstand(k, z) <= 1) ? 1 : 0);
    let total = w + bon() + glueck + (z.z.segen ? W(st.r, 4) : 0);
    if (total < sg) { const g = gedankenstuetze(st, z, sg - total); if (g) { w = W(st.r, 20); total = w + bon() + (z.z.segen ? W(st.r, 4) : 0); st.log.push({ t: `${g.name}: Gedankenstütze – ${z.name} würfelt noch einmal.`, art: "gut" }); } }
    return { erfolg: total >= sg, w, total };
  }

  /* ---------- Schaden, Heilung, Ende ---------- */
  function schaden(st, z, n, opts = {}) {
    if (z.tot) return;
    if (z.seite === "gegner" && z.schild) n = schildAbfangen(st, z, n);
    if (z.seite === "spieler" && z.tp <= 0) {
      if (st.schwierigkeit === "hardcore" && z.art !== "wolf" && z.art !== "begleiter" && n > 0) {
        z.todes.f += opts.krit ? 2 : 1;
        st.log.push({ t: `${z.name} wird am Boden getroffen: Todeswurf misslungen (${z.todes.f}/3).`, art: "schlecht" });
        if (z.todes.f >= 3) stirbt(st, z);
      }
      return;
    }
    const ueber = n - z.tp;
    z.tp = Math.max(0, z.tp - n);
    if (z.tp === 0) {
      if (z.seite === "gegner") st.log.push({ t: `${z.name} ist besiegt.`, art: "gut" });
      else if (z.art === "wolf") { st.log.push({ t: `${z.name} bleibt winselnd liegen.`, art: "schlecht" }); if (st.schwierigkeit === "hardcore") z.tot = true; }
      else if (z.art === "begleiter") { z.stabil = false; z.z.liegend = true; if (st.eskorte) st.eskorte.unten = st.runde; st.log.push({ t: `${z.name} bricht zusammen! Stabilisiert sie bis zum Ende der nächsten Runde, sonst wird sie verschleppt.`, art: "schlecht" }); }
      else {
        z.todes = { e: 0, f: 0 }; z.stabil = false;
        for (const k of ["versteckt", "raserei", "finte", "gift", "rueckzug"]) delete z.z[k];
        z.z.liegend = true;
        if (st.schwierigkeit === "hardcore" && ueber >= z.tpMax) { stirbt(st, z); }
        else st.log.push({ t: `${z.name} geht zu Boden!`, art: "schlecht" });
      }
      for (const f of spielerFiguren(st)) if (f.malZiel === z.id) f.malFrei = true; // Jägermal darf weiter
    }
    if (z.seite === "gegner" && z.tp > 0 && GEGNER[z.art] && GEGNER[z.art].phasen) phasenPruefen(st, z);
    pruefeEnde(st);
  }
  function stirbt(st, z) {
    z.tot = true; z.tp = 0;
    st.log.push({ t: `${z.name} ist tot.`, art: "schlecht" });
  }
  function heilen(st, z, n, quelle) {
    if (z.tot) return 0;
    if (z.z.raserei) n = Math.floor(n / 2);
    if (hatDing(z, "bernstein")) n += 2;
    const vorher = z.tp; z.tp = Math.min(z.tpMax, z.tp + n);
    if (vorher === 0 && z.tp > 0) { z.todes = { e: 0, f: 0 }; z.stabil = false; }
    st.log.push({ t: `${quelle}: ${z.name} heilt ${z.tp - vorher} TP${vorher === 0 && z.tp > 0 ? " und steht wieder auf" : ""}.`, art: "gut" });
    return z.tp - vorher;
  }
  function pruefeEnde(st) {
    if (st.ende) return st.ende;
    if (st.mech) { mechSiegPruefen(st); if (st.ende) return st.ende; }
    const sp = spielerFiguren(st), ge = gegnerFiguren(st);
    // Eskorte mit „jaegerSieg“: Sind alle Jäger besiegt, ist die Begleiterin in Sicherheit
    const jaegerWeg = st.eskorte && st.eskorte.jaegerSieg && ge.some((f) => GEGNER[f.art].jaeger) && ge.filter((f) => GEGNER[f.art].jaeger).every((f) => f.tp <= 0);
    const zieleOffen = st.mech && st.mech.zieleZuerst && st.mech.ziele.some(zielOffen);
    if ((ge.every((f) => f.tp <= 0) && !zieleOffen) || jaegerWeg) {
      st.ende = "sieg"; st.xp = ge.reduce((a, g) => a + GEGNER[g.art].xp, 0);
      st.log.push({ t: `Sieg! Alle Gegner sind besiegt. Jede Figur erhält ${Math.floor(st.xp / sp.length)} EP.`, art: "ende" });
    } else if (sp.every((f) => f.tp <= 0)) {
      if (st.schwierigkeit === "hardcore") {
        st.ende = "niederlage";
        for (const f of sp) if (!f.tot && !f.stabil) f.tot = true;
        st.log.push({ t: "Die ganze Gruppe liegt am Boden. Niemand kommt, um sie zu holen.", art: "ende" });
      } else { st.ende = "rueckzug"; st.log.push({ t: "Die ganze Gruppe liegt am Boden. Ihr zieht euch zum Lagerfeuer zurück.", art: "ende" }); }
    }
    return st.ende;
  }

  /* ---------- Angriffe ---------- */
  /**
   * Ein Angriffswurf mit allen Reaktionen. spec: { name, bonus, schaden, fest, extra:[Würfel], nah, fern, magisch, wucht, krit, ruecksichtslos,
   *   hinterhalt: Würfel (nur Schurken), nachTreffer(treffer) }
   */
  function angriffswurf(st, a, z, spec) {
    // Spiegelbilder
    if (z.z.spiegel > 0 && W(st.r, 2) === 1) {
      z.z.spiegel--; if (!z.z.spiegel) delete z.z.spiegel;
      st.log.push({ t: `${a.name}: ${spec.name} trifft nur ein Spiegelbild von ${z.name}.`, art: a.seite === "gegner" ? "gegner" : "wurf" });
      nachAngriff(st, a, z);
      return { treffer: false, spiegel: true };
    }
    const vt = vorteil(st, a, z, spec);
    let v = vt.v;
    // Schutzhaltung: Angriff gegen Verbündeten neben dem Schildwächter
    if (a.seite === "gegner" && z.seite === "spieler") {
      const s = st.figuren.find((o) => istFig(o, "schildwaechter") && o !== z && lebt(o) && o.reaktion > 0 && abstand(o, z) <= 1);
      if (s) { s.reaktion--; vt.minus.push("Schutzhaltung"); v = vt.plus.length ? 0 : -1; st.log.push({ t: `${s.name} stellt sich mit dem Schild dazwischen (Schutzhaltung).` }); }
    }
    let rk = rkEff(st, z, a, spec);
    const kritAb = spec.krit || 20;
    let { w } = w20(st, v);
    const segen = () => (a.z.segen ? W(st.r, 4) : 0);
    let total = w + spec.bonus + segen();
    let treffer = w !== 1 && (w >= kritAb || total >= rk);
    // Glückspilz (Trickserin): eigener knapper Fehlwurf
    if (!treffer && istFig(a, "trickser") && rk - total <= 5 && (a.genutzt.glueckspilz || 0) < 1) {
      a.genutzt.glueckspilz = 1; w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk);
      st.log.push({ t: `${a.name} hat Glück und versucht es noch einmal.` });
    }
    // Gedankenstütze
    if (!treffer && a.seite === "spieler" && w !== 1) { const g = gedankenstuetze(st, a, rk - total); if (g) { w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk); st.log.push({ t: `${g.name}: Gedankenstütze – ${a.name} würfelt noch einmal.`, art: "gut" }); } }
    // Glückspilz: Gegner trifft die Trickserin
    if (treffer && w < kritAb && istFig(z, "trickser") && a.seite === "gegner" && (z.genutzt.glueckspilz || 0) < 1) {
      z.genutzt.glueckspilz = 1; w = w20(st, v).w; total = w + spec.bonus + segen(); treffer = w !== 1 && (w >= kritAb || total >= rk);
      st.log.push({ t: `${z.name} weicht im letzten Moment aus: ${a.name} muss neu würfeln.` });
    }
    // Schutzglyphe (Gelehrte): knapper Treffer, der viel kosten würde
    if (treffer && w < kritAb && a.seite === "gegner" && z.seite === "spieler" && total < rk + 5) {
      const g = st.figuren.find((o) => istFig(o, "gelehrter") && lebt(o) && o.reaktion > 0 && platzIndex(o, 1) >= 0 && abstand(o, z) <= 6);
      if (g && z.tp - mittel(spec.schaden) <= z.tpMax / 2) {
        g.reaktion--; g.plaetze[platzIndex(g, 1)]--; rk += 5; treffer = false;
        st.log.push({ t: `${g.name} wirft eine Schutzglyphe vor ${z.name}: RK ${rk}.`, art: "gut" });
      }
    }
    // Klassenmerkmal Zauberer: Arkaner Schild – einmal je Kampf, wenn er einen Treffer abwendet
    const ks = z.seite === "spieler" && FD.KLASSEN[z.klasse] && FD.KLASSEN[z.klasse].arkanSchild;
    if (ks && treffer && w < kritAb && a.seite === "gegner" && !z.arkanSchild && total < rk + ks) {
      z.arkanSchild = true; rk += ks; treffer = false;
      st.log.push({ t: `${z.name} reißt einen arkanen Schild hoch: RK ${rk}, der Angriff prallt ab.`, art: "gut" });
    }
    const krit = treffer && w >= kritAb;
    const vtext = v > 0 ? " (Vorteil)" : v < 0 ? " (Nachteil)" : "";
    let erg = { treffer, krit, w, total, schaden: 0 };
    if (treffer) {
      let s = roll(st.r, spec.schaden, krit).total + (spec.fest || 0);
      const extra = (spec.extra || []).slice();
      if (spec.hinterhalt && !st.zug.hinterhalt && (v > 0 || (v === 0 && st.figuren.some((o) => o.seite === a.seite && o !== a && lebt(o) && abstand(o, z) <= 1)))) { extra.push(spec.hinterhalt); st.zug.hinterhalt = true; }
      for (const e of extra) s += roll(st.r, e, krit).total;
      if (a.z.entwaffnet) s = Math.floor(s / 2);
      if (z.z.raserei && !spec.magisch) s = Math.floor(s / 2);
      if (z.seite === "gegner" && GEGNER[z.art].anfaellig === "wucht" && spec.wucht) s = Math.floor(s * 1.5);
      erg.schaden = s;
      st.log.push({ t: `${a.name}: ${spec.name} – W20 ${w}${vtext} + ${spec.bonus} = ${total} gegen RK ${rk}: ${krit ? "kritischer Treffer" : "Treffer"}, ${s} Schaden.${spec.zusatzText || ""}`, art: a.seite === "gegner" ? "gegner" : "wurf", wurf: w });
      schaden(st, z, s, { krit });
      if (spec.nachTreffer) spec.nachTreffer(erg);
      if (a.seite === "spieler" && st.zug) st.zug.getroffen.push(z.id);
    } else {
      st.log.push({ t: `${a.name}: ${spec.name} – W20 ${w}${vtext} + ${spec.bonus} = ${total} gegen RK ${rk}: verfehlt.`, art: a.seite === "gegner" ? "gegner" : "wurf", wurf: w });
      // Parade der Duellantin
      if (spec.nah && istFig(z, "duellant") && a.seite === "gegner" && lebt(z) && z.reaktion > 0) {
        z.reaktion--; st.log.push({ t: `${z.name} pariert und sticht zurück.` });
        spielerAngriff(st, z, findeAktion(z, "rapier").a, a, { reaktion: true });
      }
    }
    nachAngriff(st, a, z);
    return erg;
  }
  function nachAngriff(st, a, z) {
    delete a.z.versteckt; delete a.z.finte; delete a.z.stich;
    if (a.seite === "spieler" && z.z.analyse === st.runde) delete z.z.analyse;
    if (istFig(z, "schattenmagier")) z.trugbildRunde = st.runde;
  }

  /** Angriff einer Spielerfigur mit einer Waffe oder einem Angriffszauber */
  function spielerAngriff(st, f, a, z, opt = {}) {
    let bonus = mod(f.werte[a.attr]) + UEBUNG + (a.bogen && istFig(f, "wildnislaeufer") ? 1 : 0);
    bonus += abstand(f, z) <= 1 ? (hatDing(f, "ring") ? 1 : 0) : (hatDing(f, "feder") ? 1 : 0);
    // Klassenregler für Waffenangriffe (Stärke oder Geschick): fester Bonus/Malus und Zusatzwürfel
    const kl = FD.KLASSEN[f.klasse] || {}, waffe = a.attr === "STR" || a.attr === "GES";
    const fest = (a.ohneMod ? 0 : mod(f.werte[a.attr])) + (waffe ? kl.waffenMod || 0 : 0);
    const extra = [];
    if (waffe && kl.waffenExtra) extra.push(kl.waffenExtra);
    let krit = 20, zusatz = "";
    if (f.z.raserei && a.attr === "STR") extra.push("0W1+1");
    // Darian, Schattenstoß (ab Stufe 2): Angriff aus dem Versteck +1W6 und kritisch ab 19
    const schattenstoss = istFig(f, "schattenlaeufer") && f.stufe >= 2 && f.z.versteckt;
    if (schattenstoss) extra.push("1W6");
    if (istFig(f, "berserker") && f.tp < f.tpMax / 2) extra.push(f.stufe >= 3 ? "0W1+2" : "0W1+1");
    if (f.z.finte) extra.push("1W6");
    if (hatDing(f, "silberdolch") && GEGNER[z.art] && GEGNER[z.art].untot) extra.push("1W4");
    if (hatDing(f, "wolfszahn") && TIERE.has(z.art)) extra.push("1W4");
    if (abstand(f, z) <= 1 ? hatDing(f, "schleifstein") : hatDing(f, "eisenspitzen")) extra.push("0W1+1");
    if (f.z.gift) extra.push(f.stufe >= 2 ? "2W6" : "1W6");
    if (z.z.mal_jaeger === f.id) extra.push(FD.FIGUREN[f.fid].malWuerfel || "1W6");
    if (z.z.brandmal === f.id) extra.push(f.stufe >= 3 ? "2W6" : "1W4");
    if (istFig(f, "elementarist") && a.id === "glutpfeil" && f.stufe >= 2) extra.push("1W6");
    if (istFig(f, "assassine") && f.stufe >= 3 && z.tp < z.tpMax / 2) extra.push("1W6");
    if (istFig(f, "kopfgeldjaeger") && f.stufe >= 3 && z.z.mal_jaeger === f.id && z.tp < z.tpMax / 2 && !(f.genutzt.erlegen)) { extra.push("2W6"); f.genutzt.erlegen = 1; zusatz = " Erlegen!"; }
    if (istFig(f, "duellant") && f.stufe >= 3) krit = 19;
    if (schattenstoss) krit = Math.min(krit, 19);
    if (hatDing(f, "wetzstein")) krit = Math.min(krit, 19);
    if (istFig(f, "kopfgeldjaeger") && z.z.mal_jaeger === f.id) krit = 19;
    const giftAktiv = Boolean(f.z.gift);
    const spec = {
      name: a.name, bonus, schaden: a.schaden, fest, extra, krit, nah: abstand(f, z) <= 1, fern: Boolean(a.fern) || (a.wurfwaffe && abstand(f, z) > 1),
      magisch: Boolean(a.magisch), wucht: Boolean(a.wucht), ruecksichtslos: Boolean(a.ruecksichtslos), zusatzText: zusatz,
      hinterhalt: f.klasse === "schurke" ? (f.stufe >= 2 ? "2W6" : "1W6") : null,
      nachTreffer: () => {
        if (giftAktiv && lebt(z)) { z.z.vergiftet = 1; delete f.z.gift; }
        if (a.fesseln && lebt(z)) { const r = rettung(st, z, "STR", SG(f, "GES")); if (!r.erfolg) { z.z.festgehalten = { rest: 2, flucht: SG(f, "GES") }; st.log.push({ t: `${z.name} ist festgenagelt (Rettungswurf ${r.total}).` }); } }
        if (a.brennt && !blockiert(st, z.x, z.y)) st.brand.push({ x: z.x, y: z.y, bis: st.runde + 1 });
        // Klassenmerkmale bei Waffentreffern: Schurken lassen bluten, Waldläufer brechen die Rüstung auf (frischt auf, stapelt nicht)
        if (waffe && kl.nachbluten && lebt(z) && z.seite === "gegner") { if (!z.z.blutung) st.log.push({ t: `${z.name} blutet.` }); z.z.blutung = { rest: 3, w: kl.nachbluten, von: f.name }; }
        if (waffe && kl.festnageln && lebt(z) && z.seite === "gegner") { if (!z.z.verlangsamt) st.log.push({ t: `${f.name} nagelt ${z.name} fest: verlangsamt.` }); z.z.verlangsamt = Math.max(z.z.verlangsamt || 0, kl.festnageln); }
        if (waffe && kl.durchbrechen && lebt(z) && z.seite === "gegner") { if (!(z.z.bruch && z.z.bruch.bis > st.runde)) st.log.push({ t: `${f.name} bricht ${z.name}s Rüstung auf: −${kl.durchbrechen} RK.` }); z.z.bruch = { n: kl.durchbrechen, bis: st.runde + 3 }; }
      },
    };
    if (a.ruecksichtslos) f.z.ruecksichtslos = true;
    const erg = angriffswurf(st, f, z, spec);
    if (a.bogen && st.zug && st.zug.figur === f.id) st.zug.leicht = 2;
    if (a.doppel && !opt.zweites) {
      const zweit = gegnerFiguren(st).find((o) => o !== z && lebt(o) && abstand(o, z) <= 1 && abstand(f, o) <= a.reichweite && sicht(st, f, o));
      if (zweit) spielerAngriff(st, f, Object.assign({}, a, { doppel: false }), zweit, { zweites: true });
    }
    if (a.id === "dolch" && st.zug && st.zug.figur === f.id) st.zug.dolch = true;
    return erg;
  }

  /* ---------- Ziele ---------- */
  function flaecheZiele(st, f, a, z) {
    const out = [];
    for (const g of st.figuren) {
      if (!lebt(g) || g.seite === f.seite) continue; // Zauberformung: Verbündete bleiben verschont
      if (a.form === "kreis") { if (abstand(g, z) <= a.groesse) out.push(g); continue; }
      const d = abstand(f, g); if (d < 1 || d > a.groesse) continue;
      const vx = z.x - f.x, vy = z.y - f.y, gx = g.x - f.x, gy = g.y - f.y;
      const cos = (vx * gx + vy * gy) / (Math.hypot(vx, vy) * Math.hypot(gx, gy) || 1);
      if (cos >= 0.7) out.push(g);
    }
    return out;
  }
  function ziele(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId); if (!h || st.ende) return [];
    const a = h.a, gegner = st.figuren.filter((o) => o.seite !== f.seite && lebt(o));
    const freunde = st.figuren.filter((o) => o.seite === f.seite && !o.tot && !(o.z && o.z.verbannt));
    const inReich = (o, r) => abstand(f, o) <= (r || 1) && (abstand(f, o) <= 1 || sicht(st, f, o));
    switch (a.art) {
      case "angriff": if (a.nachDolch && !st.zug.dolch) return []; return gegner.filter((o) => inReich(o, a.reichweite));
      case "rettungswurf": case "geschoss": case "albtraum": case "bannkreis": case "spott": case "analyse":
        return gegner.filter((o) => inReich(o, a.reichweite));
      case "kontrolle": return gegner.filter((o) => inReich(o, a.reichweite) && (!a.nurUntot || GEGNER[o.art].untot) && !(a.zustand === "netz" && o.z.festgehalten));
      case "flaeche": return gegner.filter((o) => inReich(o, a.reichweite));
      case "stoss": case "entwaffnen": return gegner.filter((o) => abstand(f, o) <= 1);
      case "mal": {
        const feld = a.mal === "jaeger" ? "mal_jaeger" : "brandmal";
        const laufend = gegner.some((o) => o.z[feld] === f.id);
        if (laufend) return [];
        return gegner.filter((o) => inReich(o, a.reichweite));
      }
      case "heilung": return freunde.filter((o) => o.tp < o.tpMax && inReich(o, a.reichweite));
      case "selbstheilung": case "trank": return f.tp < f.tpMax ? [f] : [];
      case "aufrichten": return freunde.filter((o) => o.tp <= 0 && o.art !== "wolf" && !o.tot && !(a.stabil && o.stabil) && abstand(f, o) <= a.reichweite);
      case "schild": return freunde.filter((o) => o.tp > 0 && !o.z.schild && inReich(o, a.reichweite));
      case "tausch": return freunde.filter((o) => o !== f && o.tp > 0 && abstand(f, o) <= a.reichweite);
      case "wolf": { const w = wolfVon(st, f); if (!w || !lebt(w)) return []; return gegner.filter((o) => abstand(w, o) <= 9); }
      case "verstecken": {
        if (f.z.versteckt) return [];
        if (gegner.some((o) => abstand(o, f) <= 1)) return [];
        const deck = imRauch(st, f.x, f.y) || [...st.karte.block].some((k) => { const [x, y] = k.split(",").map(Number); return abstand({ x, y }, f) <= 1; });
        return deck || istFig(f, "schattenlaeufer") ? [f] : [];
      }
      case "raserei": return f.z.raserei ? [] : [f];
      case "finte": return f.z.finte ? [] : [f];
      case "gift": return f.z.gift ? [] : [f];
      case "rueckzug": return f.z.rueckzug ? [] : [f];
      case "schattenschritt": return st.zug.schritt ? [] : [f];
      case "spiegelbilder": return f.z.spiegel ? [] : [f];
      case "segen": return !st.figuren.some((o) => o.z && o.z.segen === f.id && lebt(o)) && freunde.some((o) => o.tp > 0 && o.art !== "wolf" && !o.z.segen && abstand(f, o) <= 6) ? [f] : [];
      case "schutzkreis": return f.z.schutzkreis > st.runde ? [] : [f];
      case "vertreiben": return gegner.some((o) => GEGNER[o.art].untot && abstand(f, o) <= a.reichweite) ? [f] : [];
      case "bewahren": case "massenheil": return freunde.some((o) => o.tp < o.tpMax && abstand(f, o) <= a.reichweite) ? [f] : [];
      case "rauch": case "spurt": return [f];
      case "tatendrang": return !st.zug.aktion && !st.zug.tatendrang ? [f] : [];
      case "siegel": return !imPakt(st, f) && st.siegel.some((z) => !z.beruehrt && abstand(z, f) <= 1) && bossVon(st) ? [f] : [];
      case "ziel": return zielNeben(st, f) ? [f] : [];
      case "name": { const b = bossVon(st); return b && !st.boss.nameGenutzt && abstand(f, b) <= 12 && sicht(st, f, b) ? [b] : []; }
      case "silber": return !st.boss.silberGenutzt && gegnerFiguren(st).some((g) => lebt(g) && g.art === "knochenwaechter" && abstand(g, f) <= 6) ? [f] : [];
      default: return [];
    }
  }
  /** Warum eine Aktion gerade nicht geht (oder null) */
  function grund(st, aktionId) {
    const f = aktiv(st), h = findeAktion(f, aktionId);
    if (!h || st.ende || f.seite !== "spieler") return "Nicht am Zug.";
    if (f.tp <= 0) return "Am Boden.";
    const a = h.a;
    if (h.typ === "aktion" && !st.zug.aktion) return "Aktion schon verbraucht.";
    if (h.typ === "bonus" && !st.zug.bonus) return f.z.zeitriss ? "Keine Bonusaktion (Zeitriss)." : "Bonusaktion schon verbraucht.";
    if (rest(f, a) <= 0 && !(a.art === "mal" && a.mal === "jaeger" && f.malFrei)) return "Schon aufgebraucht.";
    const p = brauchtPlatz(f, a);
    if (p && platzIndex(f, a.platz || 1) < 0) return "Kein Zauberplatz mehr.";
    if (!ziele(st, aktionId).length) return "Kein gültiges Ziel.";
    return null;
  }
  const verfuegbar = (st, aktionId) => grund(st, aktionId) === null;

  /* ---------- Handeln ---------- */
  function verbrauche(st, f, a, typ) {
    if (typ === "aktion") st.zug.aktion = false; else if (typ === "bonus") st.zug.bonus = false;
    if (a.id === "brandmal") {
      if ((f.genutzt.brandmal_frei || 0) < 1) f.genutzt.brandmal_frei = 1; else f.plaetze[platzIndex(f, 1)]--;
    } else if (a.platz) f.plaetze[platzIndex(f, a.platz)]--;
    if ((a.pro || a.id === "raserei") && !(a.art === "mal" && a.mal === "jaeger" && f.malFrei)) f.genutzt[a.id] = (f.genutzt[a.id] || 0) + 1;
  }
  function schieben(st, z, von, n) {
    const dx = Math.sign(z.x - von.x), dy = Math.sign(z.y - von.y);
    for (let i = 0; i < n; i++) { const nx = z.x + dx, ny = z.y + dy; if (blockiert(st, nx, ny) || belegt(st, nx, ny, z)) break; z.x = nx; z.y = ny; }
  }
  function setzeZustand(st, z, a, f) {
    const zu = a.zustand;
    if (zu === "netz") z.z.festgehalten = { netz: true, flucht: SG(f, a.attr) };
    else if (zu === "festgehalten") z.z.festgehalten = { rest: a.dauer };
    else if (zu === "veraengstigt") z.z.veraengstigt = { rest: a.dauer, von: f.id };
    else if (zu === "verbannt") { z.z.verbannt = a.dauer; }
    else z.z[zu] = a.dauer;
  }

  /** Beobachtungspunkt für Auswertungen (tools/): API.beobachter(art, st, f, aktionId, zielId, ergebnis). Ohne Beobachter keine Wirkung. */
  function handeln(st, aktionId, zielId) {
    const b = API.beobachter; if (!b) return handelnKern(st, aktionId, zielId);
    const f = aktiv(st); b("vor", st, f, aktionId, zielId);
    const e = handelnKern(st, aktionId, zielId); b("nach", st, f, aktionId, zielId, e); return e;
  }
  function handelnKern(st, aktionId, zielId) {
    const f = aktiv(st);
    const g = grund(st, aktionId); if (g) return { fehler: g };
    const { a, typ } = findeAktion(f, aktionId);
    const z = fig(st, zielId) || f;
    const zs = ziele(st, aktionId);
    if (!zs.includes(z) && !(zs.length === 1 && zs[0] === f)) return { fehler: "Kein gültiges Ziel." };
    const ziel = zs.includes(z) ? z : f;
    verbrauche(st, f, a, typ);
    const r = st.r;
    switch (a.art) {
      case "angriff": spielerAngriff(st, f, a, ziel); break;
      case "geschoss": {
        let sum = 0; const einzel = [];
        for (let i = 0; i < a.anzahl; i++) { const s = roll(r, a.schaden).total + a.plus; sum += s; einzel.push(s); }
        st.log.push({ t: `${f.name}: ${a.name} – drei Lichtpfeile treffen sicher (${einzel.join(" + ")}) = ${sum} Schaden.`, art: "wurf" });
        schaden(st, ziel, sum); break;
      }
      case "rettungswurf": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} widersteht (Rettungswurf ${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else {
          const s = roll(r, a.schaden).total + (a.plusAttr ? mod(f.werte[a.attr]) : 0);
          st.log.push({ t: `${f.name}: ${a.name} – Rettungswurf ${rw.total} gegen SG ${sg} misslingt, ${s} Schaden.`, art: "wurf" });
          schaden(st, ziel, s);
          if (a.zustand && lebt(ziel)) setzeZustand(st, ziel, a, f);
        }
        break;
      }
      case "kontrolle": {
        const sg = SG(f, a.attr), betroffen = a.radius ? flaecheZiele(st, f, { form: "kreis", groesse: a.radius }, ziel) : [ziel];
        for (const o of betroffen) {
          const rw = rettung(st, o, a.rettung, sg);
          if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${o.name} widersteht (${rw.total} gegen SG ${sg}).`, art: "wurf" });
          else { setzeZustand(st, o, a, f); st.log.push({ t: `${f.name}: ${a.name} – ${o.name} ist ${ZUSTAND_NAME[a.zustand === "netz" ? "festgehalten" : a.zustand]} (${rw.total} gegen SG ${sg}).`, art: "gut" }); }
        }
        break;
      }
      case "flaeche": {
        const sg = SG(f, a.attr), betroffen = flaecheZiele(st, f, a, ziel), teile = [];
        for (const o of betroffen) {
          const rw = rettung(st, o, a.rettung, sg); let s = roll(r, a.schaden).total; if (rw.erfolg && a.halb) s = Math.floor(s / 2);
          teile.push(`${o.name} ${s}${rw.erfolg ? " (halb)" : ""}`);
          schaden(st, o, s);
          if (!rw.erfolg && lebt(o)) { if (a.zustand) setzeZustand(st, o, a, f); if (a.stoss) schieben(st, o, f, a.stoss); }
        }
        st.log.push({ t: `${f.name}: ${a.name} – ${teile.join(", ") || "niemand getroffen"}.`, art: "wurf" });
        break;
      }
      case "albtraum": {
        const sg = SG(f, a.attr);
        for (const o of flaecheZiele(st, f, { form: "kreis", groesse: a.radius || 1 }, ziel)) {
          const rw = rettung(st, o, a.rettung, sg), s = rw.erfolg ? roll(r, "1W8").total : roll(r, a.schaden).total;
          st.log.push({ t: `${f.name}: Albtraum – ${o.name} ${rw.erfolg ? "widersteht halb" : "schreit auf"}, ${s} Schaden.`, art: "wurf" });
          schaden(st, o, s); if (!rw.erfolg && lebt(o)) o.z.veraengstigt = { rest: 1, von: f.id };
        }
        break;
      }
      case "stoss": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} hält stand (${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else { schieben(st, ziel, f, 1); ziel.z.liegend = true; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} fliegt zurück und liegt am Boden.`, art: "gut" }); }
        break;
      }
      case "entwaffnen": {
        const sg = SG(f, a.attr), rw = rettung(st, ziel, a.rettung, sg);
        if (rw.erfolg) st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} hält fest (${rw.total} gegen SG ${sg}).`, art: "wurf" });
        else { ziel.z.entwaffnet = 2; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} verliert den Halt und macht 2 Runden nur halben Schaden.`, art: "gut" }); }
        break;
      }
      case "spott": ziel.z.spott = f.id; st.log.push({ t: `${f.name} verspottet ${ziel.name}.` }); break;
      case "analyse": ziel.z.analyse = st.runde; st.log.push({ t: `${f.name} analysiert ${ziel.name}: RK ${ziel.rk - 2} bis Rundenende, ${ziel.tp}/${ziel.tpMax} TP.` }); break;
      case "mal": {
        if (a.mal === "jaeger") { ziel.z.mal_jaeger = f.id; f.malZiel = ziel.id; f.malFrei = false; st.log.push({ t: `${f.name} markiert ${ziel.name} (Jägermal).` }); }
        else { ziel.z.brandmal = f.id; st.log.push({ t: `${f.name} brennt ${ziel.name} ein Mal ein (Brandmal).` }); }
        break;
      }
      case "heilung": {
        let n = roll(r, a.heilung).total + mod(f.werte[a.plusAttr || "WEI"]);
        if (istFig(f, "wanderheiler")) n += 1 + (a.platz || 1);
        heilen(st, ziel, n, `${f.name}: ${a.name}`); break;
      }
      case "selbstheilung": heilen(st, f, roll(r, a.heilung).total + (a.plusStufe ? f.stufe : 0), `${f.name}: ${a.name}`); break;
      case "trank": f.rucksack.find((d) => d.id === (a.gross ? "grosser_trank" : "heiltrank")).n -= 1; heilen(st, f, roll(r, a.heilung).total, `${f.name}: ${a.gross ? "Großer Heiltrank" : "Heiltrank"}`); break;
      case "aufrichten": {
        ziel.aufgerichtet = (ziel.aufgerichtet || 0) + 1;
        if (a.stabil && st.schwierigkeit === "hardcore") { ziel.stabil = true; st.log.push({ t: `${f.name} stabilisiert ${ziel.name}. Die Todeswürfe hören auf.`, art: "gut" }); }
        else { ziel.tp = 1; ziel.todes = { e: 0, f: 0 }; ziel.stabil = false; st.log.push({ t: `${f.name}: ${a.name} – ${ziel.name} steht mit 1 TP wieder auf.`, art: "gut" }); }
        break;
      }
      case "schild": ziel.z.schild = true; st.log.push({ t: `${f.name}: Schild des Glaubens auf ${ziel.name} (+2 RK).`, art: "gut" }); break;
      case "tausch": { const x = f.x, y = f.y; f.x = ziel.x; f.y = ziel.y; ziel.x = x; ziel.y = y; st.log.push({ t: `${f.name} tauscht den Platz mit ${ziel.name}.` }); break; }
      case "wolf": wolfBeisst(st, f, ziel, Boolean(a.umreissen)); break;
      case "verstecken": f.z.versteckt = true; st.log.push({ t: `${f.name} verschwindet im Schatten.` }); break;
      case "raserei": f.z.raserei = true; st.log.push({ t: `${f.name} gerät in Raserei!`, art: "gut" }); break;
      case "finte": f.z.finte = true; st.log.push({ t: `${f.name} täuscht einen Angriff an.` }); break;
      case "gift": f.z.gift = true; st.log.push({ t: `${f.name} bestreicht die Klinge mit Gift.` }); break;
      case "rueckzug": f.z.rueckzug = true; st.log.push({ t: `${f.name} zieht sich geschickt zurück.` }); break;
      case "spurt": st.zug.bewegung += st.zug.basis || 6; st.log.push({ t: `${f.name} spurtet.` }); break;
      case "schattenschritt": st.zug.schritt = 6; st.log.push({ t: `${f.name} tritt in die Schatten.` }); break;
      case "spiegelbilder": f.z.spiegel = 3; st.log.push({ t: `${f.name} teilt sich in drei Spiegelbilder.`, art: "gut" }); break;
      case "segen": {
        const zs2 = spielerFiguren(st).filter((o) => o.tp > 0 && !o.z.segen && abstand(f, o) <= 6).sort((x, y) => abstand(f, x) - abstand(f, y)).slice(0, 3);
        zs2.forEach((o) => { o.z.segen = f.id; o.z.segenBis = st.runde + (a.dauer || 99); });
        st.log.push({ t: `${f.name} segnet ${zs2.map((o) => o.name).join(", ")}.`, art: "gut" }); break;
      }
      case "schutzkreis": f.z.schutzkreis = st.runde + a.dauer; st.log.push({ t: `${f.name} zieht einen Schutzkreis: Verbündete in 2 Feldern +2 RK.`, art: "gut" }); break;
      case "vertreiben": {
        const sg = SG(f, a.attr);
        for (const o of gegnerFiguren(st).filter((o) => lebt(o) && GEGNER[o.art].untot && abstand(f, o) <= a.reichweite)) {
          const rw = rettung(st, o, "WEI", sg);
          if (!rw.erfolg) o.z.veraengstigt = { rest: 2, von: f.id };
          st.log.push({ t: `${f.name}: Untote vertreiben – ${o.name} ${rw.erfolg ? "widersteht" : "flieht"}.`, art: "wurf" });
        }
        break;
      }
      case "bewahren": {
        let topf = 5 * f.stufe;
        while (topf > 0) {
          const o = spielerFiguren(st).concat(st.figuren.filter((x) => x.art === "wolf")).filter((x) => !x.tot && x.tp < x.tpMax && abstand(f, x) <= a.reichweite).sort((x, y) => x.tp / x.tpMax - y.tp / y.tpMax)[0];
          if (!o) break;
          const n = Math.min(topf, Math.max(1, Math.ceil((o.tpMax - o.tp) / 2))); topf -= n; heilen(st, o, n, `${f.name}: Bewahren`);
        }
        break;
      }
      case "massenheil": {
        const zs3 = st.figuren.filter((o) => o.seite === "spieler" && !o.tot && o.tp < o.tpMax && abstand(f, o) <= a.reichweite).sort((x, y) => x.tp / x.tpMax - y.tp / y.tpMax).slice(0, 3);
        for (const o of zs3) heilen(st, o, roll(r, a.heilung).total + mod(f.werte.WEI) + 2 + 1, `${f.name}: Massenheilwort`);
        break;
      }
      case "bannkreis": st.zonen.push({ art: "bann", x: ziel.x, y: ziel.y, radius: a.radius, bis: st.runde + a.dauer }); st.log.push({ t: `${f.name} zieht einen Bannkreis um ${ziel.name}: Gegner darin −2 RK.`, art: "gut" }); break;
      case "rauch": if (a.ding) f.rucksack.find((d) => d.id === a.ding).n -= 1; st.zonen.push({ art: "rauch", x: f.x, y: f.y, radius: a.radius, bis: st.runde + a.dauer }); st.log.push({ t: `${f.name} wirft eine Rauchbombe.` }); break;
      case "siegel": {
        const z = st.siegel.find((x) => !x.beruehrt && abstand(x, f) <= 1), b = bossVon(st); z.beruehrt = true;
        const s = roll(r, "2W6").total; b.rk -= 2;
        st.log.push({ t: `${f.name} legt die Hand auf einen Siegelstein. Licht bricht aus dem Stein: ${b.name} verliert 2 RK und ${s} TP.`, art: "gut" });
        schaden(st, b, s);
        if (st.siegel.every((x) => x.beruehrt) && lebt(b)) { b.gebunden = true; st.log.push({ t: `Alle vier Steine leuchten. ${b.name} ist gebunden und kann keine Toten mehr rufen.${(st.boss.pakt || []).length ? " Und er weiß, wer ihn verraten hat." : ""}`, art: "gut" }); }
        break;
      }
      case "ziel": zielBedienen(st, f); break;
      case "name": ziel.z.betaeubt = 1; ziel.rk -= 2; st.boss.nameGenutzt = true; st.log.push({ t: `${f.name} ruft: „Valdric!“ Der Abt erstarrt. Zum ersten Mal seit dreihundert Jahren hört er seinen Namen.`, art: "gut" }); break;
      case "silber": {
        st.boss.silberGenutzt = true; st.log.push({ t: `${f.name} läutet die silberne Glocke. Ein reiner Ton füllt die Kammer.`, art: "gut" });
        for (const g of gegnerFiguren(st).filter((g) => lebt(g) && g.art === "knochenwaechter" && abstand(g, f) <= 6)) {
          const rw = rettung(st, g, "WEI", 13);
          if (rw.erfolg) st.log.push({ t: `${g.name} widersteht dem Klang.`, art: "wurf" }); else { st.log.push({ t: `${g.name} zerfällt zu Staub.`, art: "gut" }); schaden(st, g, g.tp); }
        }
        break;
      }
      case "tatendrang": st.zug.aktion = true; st.zug.tatendrang = true; st.log.push({ t: `${f.name}: Tatendrang – noch eine Aktion!`, art: "gut" }); break;
      default: return { fehler: "Unbekannte Fähigkeit." };
    }
    pruefeEnde(st);
    return { ok: true };
  }

  /** Grau läuft zum Ziel und beißt */
  function wolfBeisst(st, f, z, umreissen) {
    const w = wolfVon(st, f); if (!w || !lebt(w) || !lebt(z)) return;
    if (abstand(w, z) > 1) {
      const m = erreichbar(st, w, FD.FIGUREN[f.fid].wolf.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const d = abstand({ x, y }, z); if (!best || d < best.d || (d === best.d && c < best.c)) best = { x, y, d, c }; }
      if (best) { w.x = best.x; w.y = best.y; }
    }
    if (abstand(w, z) > 1) { st.log.push({ t: `${w.name} kommt nicht an ${z.name} heran.` }); return; }
    const wd = FD.FIGUREN[f.fid].wolf, extra = [];
    if (f.stufe >= 3 && z.z.mal_jaeger === f.id) extra.push("1W6");
    if (st.zug) st.zug.wolfBiss = true;
    angriffswurf(st, w, z, {
      name: umreissen ? "Biss (Umreißen)" : "Biss", bonus: wd.angriff[f.stufe - 1], schaden: wd.schaden, fest: wd.plus, extra, nah: true,
      nachTreffer: () => { if (umreissen && lebt(z)) { const rw = rettung(st, z, "STR", 12); if (!rw.erfolg) { z.z.liegend = true; st.log.push({ t: `${z.name} wird umgerissen.` }); } } },
    });
  }

  /* ---------- Bewegung ---------- */
  function bewegen(st, x, y) {
    const f = aktiv(st);
    if (st.ende || f.seite !== "spieler" || f.tp <= 0) return { fehler: "Nicht am Zug." };
    const m = bewegungsfelder(st, f), k = key(x, y);
    if (!m.has(k) || (x === f.x && y === f.y)) return { fehler: "Dorthin kommt " + f.name + " nicht." };
    const c = m.get(k), schritt = c === "schritt";
    // Gelegenheitsangriffe
    if (!schritt && !f.z.rueckzug && !(st.zug.leicht >= c)) {
      for (const g of gegnerFiguren(st)) {
        if (!lebt(g) || g.reaktion <= 0 || g.z.veraengstigt || g.z.festgehalten || !GEGNER[g.art].angriff) continue;
        if (abstand(g, f) <= 1 && abstand(g, { x, y }) > 1) { g.reaktion--; st.log.push({ t: `${g.name} nutzt die Lücke (Gelegenheitsangriff).`, art: "gegner" }); gegnerAngriff(st, g, f); if (f.tp <= 0) return { ok: true, gefallen: true }; }
      }
    }
    if (schritt) { st.zug.schritt = 0; } else { st.zug.bewegung -= c; st.zug.leicht = Math.max(0, (st.zug.leicht || 0) - c); }
    f.x = x; f.y = y;
    brandFeld(st, f);
    if (st.mech && st.mech.ausgang) ausgangPruefen(st);
    return { ok: true };
  }
  function brandFeld(st, f) {
    if (st.brand.some((b) => b.x === f.x && b.y === f.y) && lebt(f)) { const s = W(st.r, 4); st.log.push({ t: `${f.name} tritt in die Glut: ${s} Schaden.` }); schaden(st, f, s); }
  }

  /* ---------- Zugwechsel ---------- */
  function beginneZug(st) {
    for (let schutz = 0; schutz < 40; schutz++) {
      const f = aktiv(st);
      if (f.seite === "gegner") {
        if (f.tp <= 0) { weiter(st, true); continue; }
        if (f.ueberrascht) { delete f.ueberrascht; st.log.push({ t: `${f.name} ist überrascht und handelt nicht.` }); weiter(st, true); continue; }
        if (f.z.verbannt) { f.z.verbannt--; if (!f.z.verbannt) { delete f.z.verbannt; st.log.push({ t: `${f.name} kehrt aus der Verbannung zurück.` }); } else st.log.push({ t: `${f.name} ist noch verbannt.` }); weiter(st, true); continue; }
      } else {
        if (f.tot) { weiter(st, true); continue; }
        if (f.tp <= 0) {
          if (st.schwierigkeit === "hardcore" && !f.stabil) {
            const w = W(st.r, 20);
            if (w === 20) { f.tp = 1; f.todes = { e: 0, f: 0 }; st.log.push({ t: `${f.name}: Todeswurf 20 – steht mit 1 TP wieder auf!`, art: "gut", wurf: w }); }
            else {
              if (w >= 10) f.todes.e++; else f.todes.f += w === 1 ? 2 : 1;
              st.log.push({ t: `${f.name}: Todeswurf ${w} – ${w >= 10 ? "Erfolg" : "Fehlschlag"} (${f.todes.e} ✓ / ${f.todes.f} ✗).`, art: w >= 10 ? "gut" : "schlecht", wurf: w });
              if (f.todes.f >= 3) { stirbt(st, f); pruefeEnde(st); }
              else if (f.todes.e >= 3) { f.stabil = true; st.log.push({ t: `${f.name} ist stabil, bleibt aber bewusstlos.` }); }
              weiter(st, true); continue;
            }
          } else { weiter(st, true); continue; }
        }
      }
      break;
    }
    const f = aktiv(st);
    f.gehandelt = true;
    f.reaktion = istFig(f, "schildwaechter") && f.stufe >= 3 ? 2 : 1;
    delete f.z.ruecksichtslos;
    let bew = f.seite === "gegner" ? Math.round((GEGNER[f.art].bewegung != null ? GEGNER[f.art].bewegung : 6) * (st.gegnerTempo || 1)) : bewegungVon(f);
    const basis = bew;
    if (f.z.verlangsamt || f.z.zeitriss) bew = Math.floor(bew / 2);
    st.zug = { figur: f.id, bewegung: bew, basis, aktion: true, bonus: !f.z.zeitriss, hinterhalt: false, tatendrang: false, leicht: 0, schritt: 0, dolch: false, getroffen: [], wolfBiss: false };
    if (f.z.festgehalten) {
      const fg = f.z.festgehalten;
      if (fg.flucht && !fg.netz) { const rw = rettung(st, f, "STR", fg.flucht); if (rw.erfolg) { delete f.z.festgehalten; st.log.push({ t: `${f.name} reißt sich los.` }); } }
      if (f.z.festgehalten) st.zug.bewegung = 0;
    }
    if (f.z.liegend && f.tp > 0 && st.zug.bewegung >= 3) { st.zug.bewegung -= 3; delete f.z.liegend; }
    // Strahlende Aura gegen Untote
    if (f.seite === "gegner") for (const l of st.figuren) if (istFig(l, "lichtbringer") && lebt(l) && abstand(l, f) <= 1 && lebt(f)) { const n = GEGNER[f.art].untot ? 2 : 1; st.log.push({ t: `${l.name}s Aura sengt ${f.name}: ${n} Schaden.` }); schaden(st, f, n); }
    if (f.z.blutung && lebt(f)) { const b = f.z.blutung, s2 = roll(st.r, b.w).total; b.rest--; if (b.rest <= 0) delete f.z.blutung; st.log.push({ t: `${f.name} blutet: ${s2} Schaden.` }); schaden(st, f, s2); }
    if (f.z.bruch && f.z.bruch.bis <= st.runde) delete f.z.bruch;
    if (lebt(f)) brandFeld(st, f);
    if (st.ende) return;
    if (!lebt(f)) weiter(st);
  }
  function tick(f) {
    const z = f.z;
    for (const k of ["verlangsamt", "geblendet", "vergiftet", "entwaffnet", "zeitriss", "stich"]) if (z[k]) { z[k]--; if (z[k] <= 0) delete z[k]; }
    if (z.veraengstigt) { z.veraengstigt.rest--; if (z.veraengstigt.rest <= 0) delete z.veraengstigt; }
    if (z.festgehalten && z.festgehalten.rest != null) { z.festgehalten.rest--; if (z.festgehalten.rest <= 0) delete z.festgehalten; }
    delete z.spott; delete z.rueckzug;
  }
  function weiter(st, still) {
    const f = aktiv(st); if (f && !still) tick(f);
    st.am++;
    if (st.am >= st.reihe.length) {
      st.am = 0; st.runde++;
      st.zonen = st.zonen.filter((z) => z.bis > st.runde);
      st.brand = st.brand.filter((b) => b.bis > st.runde);
      const verblasst = st.figuren.filter((g) => g.z && g.z.segen && g.z.segenBis <= st.runde);
      if (verblasst.length) { verblasst.forEach((g) => { delete g.z.segen; delete g.z.segenBis; }); st.log.push({ t: `Der Segen verblasst bei ${verblasst.map((g) => g.name).join(", ")}.` }); }
      for (const g of st.figuren) if (g.seite === "gegner" && g.atemRunde && st.runde - g.atemRunde >= GEGNER[g.art].atem.alle) g.atemBereit = true;
      st.log.push({ t: `— Runde ${st.runde} —`, art: "runde" });
      if (st.mech) { mechanikRunde(st); if (st.ende) return; }
      if (st.eskorte) begleiterPhase(st);
    }
    if (!st.ende) beginneZug(st);
  }
  function zugEnde(st) {
    if (st.ende) return;
    const f = aktiv(st);
    // Eingespielt: Grau beißt ohne Befehl
    if (istFig(f, "tiergefaehrte") && f.stufe >= 2 && !st.zug.wolfBiss) {
      const w = wolfVon(st, f);
      const z = w && lebt(w) && gegnerFiguren(st).find((o) => lebt(o) && abstand(w, o) <= 1 && st.zug.getroffen.includes(o.id));
      if (z) wolfBeisst(st, f, z, false);
    }
    if (st.ende) return;
    weiter(st);
  }

  /* ---------- Gegner ---------- */
  function gegnerAngriff(st, g, z) {
    const d = GEGNER[g.art];
    z = abfangen(st, z);
    const metallVorher = z.rk;
    return angriffswurf(st, g, z, {
      name: d.angriff.name, bonus: d.angriff.bonus + (g.anfuehrer ? 1 : 0), schaden: d.angriff.schaden.replace(/[+-]\d+$/, ""), fest: parse(d.angriff.schaden).b, nah: abstand(g, z) <= 1, magisch: Boolean(d.boss),
      nachTreffer: () => { if (d.rost && z.metall && z.rk > z.rkBasis - 2 && metallVorher === z.rk) { z.rk -= 1; st.log.push({ t: `Die Rüstung von ${z.name} rostet: RK ${z.rk}.` }); } if (d.rueckstoss) rueckstoss(st, g, z, d.rueckstoss); },
    });
  }
  /* ---------- Eskorte: Begleiterin ---------- */
  /** Zu Beginn jeder Runde: Die Begleiterin geht bis zu 2 Felder ihren Weg entlang – nicht in bedrohte Felder, nicht ohne die Gruppe */
  function begleiterPhase(st) {
    const s = begleiterVon(st), e = st.eskorte; if (!s || st.ende || s.gefesselt) return;
    // Rettungsfenster abgelaufen: verschleppt
    if (s.tp <= 0) {
      if (!s.stabil && e.unten != null && st.runde >= e.unten + 2) { st.ende = "gefangen"; st.log.push({ t: `Die Jäger packen ${s.name} und verschwinden mit ihr. Ihr müsst sie zurückholen.`, art: "ende" }); }
      return;
    }
    const feinde = gegnerFiguren(st).filter(lebt), bedroht = (p) => feinde.some((g) => abstand(g, p) <= 1);
    const helden = spielerFiguren(st).filter(lebt);
    while (e.schritt < e.route.length && s.x === e.route[e.schritt][0] && s.y === e.route[e.schritt][1]) e.schritt++;
    // Am Ziel: ein Gerät bedienen – eine Runde Fortschritt, solange kein Gegner direkt neben ihr steht
    if (e.schritt >= e.route.length && e.aktivierung) {
      const a = e.aktivierung;
      if (bedroht(s)) { if (a.ununterbrochen) a.fortschritt = 0; st.log.push({ t: `${s.name} wird gestört – ${a.ununterbrochen ? `${a.name} erlischt, sie muss neu beginnen` : `${a.name} kommt nicht voran`} (${a.fortschritt}/${a.runden}).`, art: "schlecht" }); return; }
      a.fortschritt++;
      if (a.fortschritt >= a.runden) { st.ende = "sieg"; st.xp = gegnerFiguren(st).filter((g) => g.tp <= 0).reduce((x, g) => x + GEGNER[g.art].xp, 0); st.log.push({ t: `${s.name} vollendet ${a.name}. Geschafft!`, art: "ende" }); }
      else st.log.push({ t: `${s.name} arbeitet an ${a.name} (${a.fortschritt}/${a.runden}).`, art: "gut" });
      return;
    }
    if (e.schritt >= e.route.length) return;
    if (!helden.some((h) => abstand(h, s) <= e.warten)) { st.log.push({ t: `${s.name} wartet auf euch.` }); return; }
    const ziel = { x: e.route[e.schritt][0], y: e.route[e.schritt][1] };
    const m = erreichbar(st, s, e.schrittweite); let best = { x: s.x, y: s.y, w: abstand(s, ziel) + (bedroht(s) ? 50 : 0) };
    for (const [k] of m) { const [x, y] = k.split(",").map(Number), p = { x, y }; if (belegt(st, x, y, s)) continue; const w = abstand(p, ziel) + (bedroht(p) ? 50 : 0); if (w < best.w) best = { x, y, w }; }
    if (best.x === s.x && best.y === s.y) { if (bedroht(s)) st.log.push({ t: `${s.name} sitzt fest – Gegner neben ihr.`, art: "schlecht" }); return; }
    s.x = best.x; s.y = best.y; delete s.z.liegend;
    while (e.schritt < e.route.length && s.x === e.route[e.schritt][0] && s.y === e.route[e.schritt][1]) e.schritt++;
    if (e.schritt >= e.route.length && e.ausgang) { st.ende = "sieg"; st.xp = gegnerFiguren(st).filter((g) => g.tp <= 0).reduce((a, g) => a + GEGNER[g.art].xp, 0); st.log.push({ t: `${s.name} erreicht den Ausgang. Geschafft!`, art: "ende" }); }
    else st.log.push({ t: `${s.name} geht weiter (${e.schritt}/${e.route.length}).` });
  }
  /** Abfangen: Ein Held direkt neben der Begleiterin wirft sich mit seiner Reaktion vor einen gezielten Angriff (nicht gegen Flächenangriffe) */
  function abfangen(st, z) {
    if (!z || z.art !== "begleiter") return z;
    const h = spielerFiguren(st).filter((o) => lebt(o) && o.reaktion > 0 && abstand(o, z) <= 1 && !o.z.festgehalten && o.schuetzt !== false).sort((a, b) => b.rk - a.rk || b.tp - a.tp)[0];
    if (!h) return z;
    h.reaktion--; st.log.push({ t: `${h.name} wirft sich vor ${z.name} und fängt den Angriff ab.`, art: "gut" });
    return h;
  }
  function zieleFuerGegner(st, g) {
    // Jäger: die Begleiterin hat Vorrang, wenn sie steht und sichtbar ist
    const j = GEGNER[g.art].jaeger, s = j && (j !== "wechsel" || st.runde % 2 === 0) && begleiterVon(st);
    if (s && lebt(s) && !s.gefesselt && sicht(st, g, s)) { if (g.visier !== st.runde) { g.visier = st.runde; st.log.push({ t: `${g.name} nimmt ${s.name} ins Visier.`, art: "gegner" }); } return [s]; }
    const alle = st.figuren.filter((f) => f.seite === "spieler" && lebt(f));
    const sichtbar = alle.filter((f) => !f.z.versteckt);
    return sichtbar.length ? sichtbar : alle;
  }
  function gegnerZug(st) {
    const g = aktiv(st);
    if (!g || g.seite !== "gegner" || st.ende) return;
    const d = GEGNER[g.art];
    let lebende = zieleFuerGegner(st, g);
    if (!lebende.length || g.tp <= 0) { weiter(st); return; }
    const naechste = () => lebende.slice().sort((a, b) => (g.z.spott === b.id) - (g.z.spott === a.id) || abstand(g, a) - abstand(g, b) || a.tp - b.tp)[0];
    const startX = g.x, startY = g.y;
    const flieheVon = (quelle) => {
      const m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k] of m) { const [x, y] = k.split(",").map(Number); const dd = Math.min(...lebende.map((f) => abstand({ x, y }, f))); if (!best || dd > best.d) best = { x, y, d: dd }; }
      if (best) { g.x = best.x; g.y = best.y; }
    };
    if (d.boss) { bossZug(st, g); return; }
    if (st.mech && sonderZug(st, g, d)) return;
    // Verängstigt: weg, kein Angriff
    if (g.z.veraengstigt) { flieheVon(); st.log.push({ t: `${g.name} weicht ängstlich zurück.`, art: "gegner" }); fangschuss(st, g, startX, startY); if (!st.ende) weiter(st); return; }
    // Im Netz: befreien
    if (g.z.festgehalten && g.z.festgehalten.netz) {
      const w = W(st.r, 20) + mod(g.werte.STR);
      if (w >= g.z.festgehalten.flucht) { delete g.z.festgehalten; st.log.push({ t: `${g.name} reißt das Netz auf.`, art: "gegner" }); }
      else st.log.push({ t: `${g.name} zerrt am Netz (${w}).`, art: "gegner" });
      weiter(st); return;
    }
    // Kobold flieht bei wenig TP
    if (d.flieht && g.tp < d.flieht && !g.geflohen) { g.geflohen = true; flieheVon(); st.log.push({ t: `${g.name} flieht.`, art: "gegner" }); fangschuss(st, g, startX, startY); if (!st.ende) weiter(st); return; }
    // Pilzbrut: Sporen auf alle Nachbarn
    if (d.sporen) {
      const nach = lebende.filter((f) => abstand(g, f) <= 1);
      for (const f of nach) {
        const rw = rettung(st, f, "KON", d.sporen.sg);
        if (rw.erfolg) st.log.push({ t: `${g.name}: Sporen – ${f.name} hält die Luft an.`, art: "gegner" });
        else { const s = roll(st.r, d.sporen.schaden).total; f.z.vergiftet = 1; st.log.push({ t: `${g.name}: Sporen – ${f.name} hustet, ${s} Schaden, vergiftet.`, art: "gegner" }); schaden(st, f, s); }
      }
      if (!st.ende) weiter(st); return;
    }
    // Läufer: rennt zu seinem Feld, löst dort ein Ereignis aus
    if (g.laeufer) {
      const L = g.laeufer, m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const d = abstand({ x, y }, L); if (!best || d < best.d || (d === best.d && c < best.c)) best = { x, y, d, c }; }
      if (best) { g.x = best.x; g.y = best.y; brandFeld(st, g); }
      const amZiel = lebt(g) && abstand(g, L) <= (L.nah != null ? L.nah : 1);
      // Mit „warten“ greift er erst im nächsten Zug zu: Die Gruppe hat eine Runde, um ihn aufzuhalten
      if (amZiel && L.warten && !L.da) { L.da = true; st.log.push({ t: `${g.name} steht am Glockenseil und greift danach! Haltet ihn auf, bevor er zieht.`, art: "schlecht" }); }
      else if (amZiel) {
        st.ereignisse.push(L.ereignis); delete g.laeufer; g.name = g.name.replace(" (rennt zum Seil)", "");
        st.log.push({ t: `${g.name} reißt am Glockenseil! Die Glocke dröhnt.`, art: "schlecht" });
      } else if (lebt(g)) { L.da = false; st.log.push({ t: `${g.name} rennt zum Glockenseil.`, art: "gegner" }); }
      fangschuss(st, g, startX, startY);
      if (!st.ende) weiter(st); return;
    }
    let ziel = naechste();
    // Aschehund: Glutatem
    if (d.atem && g.atemBereit && abstand(g, ziel) <= 3) {
      const betroffen = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && abstand(g, f) <= 3 && abstand(g, f) >= 1 && (() => { const vx = ziel.x - g.x, vy = ziel.y - g.y, fx = f.x - g.x, fy = f.y - g.y; return (vx * fx + vy * fy) / (Math.hypot(vx, vy) * Math.hypot(fx, fy) || 1) >= 0.7; })());
      const teile = [];
      for (const f of betroffen) { const rw = rettung(st, f, d.atem.rettung || "GES", d.atem.sg); let s = roll(st.r, d.atem.schaden).total; if (rw.erfolg) s = Math.floor(s / 2); teile.push(`${f.name} ${s}`); schaden(st, f, s); }
      g.atemBereit = false; g.atemRunde = st.runde;
      st.log.push({ t: `${g.name}: ${d.atem.name || "Glutatem"} – ${teile.join(", ") || "niemand getroffen"}.`, art: "gegner" });
      if (!st.ende) weiter(st); return;
    }
    // Netzweber: Netz auf Entfernung
    if (d.netz && !g.netzGenutzt && abstand(g, ziel) > 1 && abstand(g, ziel) <= d.netz.reichweite && sicht(st, g, ziel)) {
      g.netzGenutzt = true;
      const erg = angriffswurf(st, g, ziel, { name: "Netz", bonus: d.netz.bonus, schaden: "0W1", fest: 0, nah: false, nachTreffer: () => { ziel.z.festgehalten = { netz: true, flucht: d.netz.sg }; st.log.push({ t: `${ziel.name} hängt im Netz.`, art: "gegner" }); } });
      if (erg && !st.ende) weiter(st); return;
    }
    // Fernkämpfer (Irrlicht, Kröte, Alwine): auf Reichweite gehen, mit Sicht angreifen, nicht unnötig nah heran
    const rw = d.angriff && d.angriff.reichweite > 1 ? d.angriff.reichweite : 0;
    if (rw) {
      const trifft = (pos, f) => abstand(pos, f) <= rw && sicht(st, Object.assign({}, g, pos), f);
      if (!trifft(g, ziel) && st.zug.bewegung > 0) {
        const m = erreichbar(st, g, st.zug.bewegung); let best = null;
        for (const [k, c] of m) {
          const [x, y] = k.split(",").map(Number), p = { x, y }, z2 = lebende.filter((f) => trifft(p, f)).sort((a, b) => a.tp - b.tp)[0];
          const wert = z2 ? 100 + abstand(p, z2) * 2 - c * 0.1 : -Math.min(...lebende.map((f) => abstand(p, f))) - c * 0.1;
          if (!best || wert > best.wert) best = { x, y, wert };
        }
        if (best) { g.x = best.x; g.y = best.y; brandFeld(st, g); }
        fangschuss(st, g, startX, startY);
        if (!lebt(g) || st.ende) { if (!st.ende) weiter(st); return; }
        lebende = zieleFuerGegner(st, g);
      }
      let z = lebende.filter((f) => trifft(g, f)).sort((a, b) => (g.z.spott === b.id) - (g.z.spott === a.id) || a.tp - b.tp)[0];
      if (!z && d.jaeger) z = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && f.art !== "begleiter" && trifft(g, f)).sort((a, b) => a.tp - b.tp)[0];
      if (z) gegnerAngriff(st, g, z);
      if (!st.ende) weiter(st); return;
    }
    // Bewegen und angreifen
    if (abstand(g, ziel) > 1 && st.zug.bewegung > 0) {
      const m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number); const dist = Math.min(...lebende.map((f) => abstand({ x, y }, f) + (g.z.spott === f.id ? -1 : 0))); if (!best || dist < best.dist || (dist === best.dist && c < best.c)) best = { x, y, dist, c }; }
      if (st.mech && best && best.dist > 1) best = wegKorrektur(st, g, ziel, best, m);
      if (best) { g.x = best.x; g.y = best.y; brandFeld(st, g); }
      if (!lebt(g)) { if (!st.ende) weiter(st); return; }
      lebende = zieleFuerGegner(st, g); ziel = naechste();
      if (d.jaeger && ziel && ziel.art === "begleiter" && abstand(g, ziel) > 1) { const daneben = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && f.art !== "begleiter" && abstand(g, f) <= 1); if (daneben.length) { lebende = daneben; ziel = naechste(); } }
      fangschuss(st, g, startX, startY);
      if (!lebt(g) || st.ende) { if (!st.ende) weiter(st); return; }
    }
    if (ziel && abstand(g, ziel) <= 1 && d.angriff) gegnerAngriff(st, g, ziel);
    if (!st.ende) weiter(st);
  }
  /** Valdric: Fluchhand auf Entfernung, ruft Tote, ab halben TP Phase 2 mit Fluchwelle; schont Paktierer, bis er gebunden ist */
  function bossZug(st, g) {
    const d = GEGNER[g.art];
    if (g.z.betaeubt) { delete g.z.betaeubt; st.log.push({ t: `${g.name} ringt um seinen Namen und handelt nicht.`, art: "gut" }); weiter(st); return; }
    if (!g.phase2 && g.tp <= g.tpMax / 2) { g.phase2 = true; g.atemBereit = true; st.log.push({ t: "Das Siegel bricht! Risse laufen durch den Boden, Flammen schlagen heraus. Valdric wird körperlich.", art: "schlecht" }); }
    if (!g.gebunden && st.runde % 2 === 0 && g.letzterRuf !== st.runde) { g.letzterRuf = st.runde; rufe(st, g, "knochenwaechter"); }
    let ziele = zieleFuerGegner(st, g);
    const pakt = (st.boss && st.boss.pakt) || [];
    if (!g.gebunden) { const ohne = ziele.filter((f) => !pakt.includes(f.fid)); if (ohne.length) ziele = ohne; }
    else { const verraeter = ziele.filter((f) => pakt.includes(f.fid)); if (verraeter.length) ziele = verraeter; }
    if (!ziele.length) { weiter(st); return; }
    const reich = d.angriff.reichweite || 1;
    const nah = () => ziele.slice().sort((a, b) => abstand(g, a) - abstand(g, b) || a.tp - b.tp)[0];
    let ziel = ziele.filter((f) => abstand(g, f) <= reich && sicht(st, g, f)).sort((a, b) => a.tp - b.tp)[0];
    if (g.phase2 && g.atemBereit && (ziel || nah())) {
      const z = ziel || nah(), betroffen = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && abstand(f, z) <= 1 && !(pakt.includes(f.fid) && !g.gebunden)), teile = [];
      for (const f of betroffen) { const rw = rettung(st, f, "WEI", d.atem.sg); let s = roll(st.r, d.atem.schaden).total; if (rw.erfolg) s = Math.floor(s / 2); teile.push(`${f.name} ${s}`); schaden(st, f, s); }
      g.atemBereit = false; g.atemRunde = st.runde;
      st.log.push({ t: `${g.name}: Fluchwelle – ${teile.join(", ") || "niemand"}.`, art: "gegner" });
      if (!st.ende) weiter(st); return;
    }
    if (!ziel && st.zug.bewegung > 0) {
      const m = erreichbar(st, g, st.zug.bewegung); let best = null;
      for (const [k, c] of m) { const [x, y] = k.split(",").map(Number), p = { x, y }; const ok = ziele.some((f) => abstand(p, f) <= reich && sicht(st, p, f)); const dd = Math.min(...ziele.map((f) => abstand(p, f))); const w = (ok ? 0 : 50) + dd + c * 0.1; if (!best || w < best.w) best = { x, y, w }; }
      if (best) { g.x = best.x; g.y = best.y; }
      ziel = ziele.filter((f) => abstand(g, f) <= reich && sicht(st, g, f)).sort((a, b) => a.tp - b.tp)[0];
    }
    if (ziel) { gegnerAngriff(st, g, ziel); if (g.phase2 && lebt(ziel) && !st.ende) gegnerAngriff(st, g, ziel); }
    if (!st.ende) weiter(st);
  }
  /** Ein Gegner wird herbeigerufen und handelt noch in dieser Runde */
  function rufe(st, g, art) {
    const d = GEGNER[art]; let feld = null;
    for (let r2 = 1; r2 <= 3 && !feld; r2++) for (let dx = -r2; dx <= r2 && !feld; dx++) for (let dy = -r2; dy <= r2 && !feld; dy++) { const x = g.x + dx, y = g.y + dy; if (!blockiert(st, x, y) && !belegt(st, x, y)) feld = { x, y }; }
    if (!feld) return;
    st.gerufen = (st.gerufen || 0) + 1;
    const n = { id: "r" + st.gerufen, seite: "gegner", art, name: d.name + " (gerufen)", x: feld.x, y: feld.y, tp: d.tp, tpMax: d.tp, rk: d.rk, rkBasis: d.rk, werte: d.werte, z: {}, reaktion: 1, genutzt: {}, ini: 0 };
    st.figuren.push(n); st.reihe.splice(st.am + 1, 0, n.id);
    st.log.push({ t: `${g.name} reißt die Hand hoch. Aus dem Boden steigt ein Knochenwächter.`, art: "schlecht" });
  }
  /** Fangschuss: bewegt sich das markierte Ziel des Kopfgeldjägers, schießt er einmal */
  function fangschuss(st, g, sx, sy) {
    if (g.x === sx && g.y === sy) return;
    const k = st.figuren.find((o) => istFig(o, "kopfgeldjaeger") && lebt(o) && o.reaktion > 0 && g.z.mal_jaeger === o.id && abstand(o, g) <= 16 && sicht(st, o, g));
    if (!k || !lebt(g)) return;
    k.reaktion--; st.log.push({ t: `${k.name} schießt ${g.name} hinterher (Fangschuss).` });
    spielerAngriff(st, k, findeAktion(k, "armbrust").a, g, { reaktion: true });
  }

  /* ---------- Mechaniken (Die Krone unter dem Eis): Ziel-Objekte, Verstärkungswellen, angekündigte Flächen, Gelände, Rückstoß, Phasen, Schild ----------
   * Eingeschaltet über opts.mechanik in neuesSpiel (siehe KONZEPT-KRONE.md K6). Ohne sie bleibt jeder Kampf wie bisher.
   * ziele:   [{ id, name, art, x, y, runden, ruhe, frist, umkehrbar, aktion, wirkung: { welleAus, schild, gerettet, verlorenText } }]
   * wellen:  [{ id, name, kurz, quellen: [[x, y]], gegner: [[art, je, max, basis]], alle, ab, max, an, aus, text }]
   * eis:     { felder: [[x, y]], proRunde, ab, bekannt }   ·   schild: { art, ziele, halt, pause, text }
   * sieg:    { ziele, art, besiegt: { art, n }, text }    ·   ausgang: { felder: [[x, y]], text }
   */
  const ZIEL_A = { id: "ziel", name: "Ziel bedienen", typ: "aktion", art: "ziel", text: "Arbeite an einem Ziel direkt neben dir (Siegelstein, Runensäule, Eisblock …). Manche brauchen mehrere Aktionen, manche gehen nur, wenn kein Gegner neben dir steht." };
  const zielOffen = (z) => !z.fertig && !z.verloren;
  function zielNeben(st, f) {
    if (!st.mech || !f) return null;
    const bedraengt = gegnerFiguren(st).some((g) => lebt(g) && abstand(g, f) <= 1);
    return st.mech.ziele.filter((z) => zielOffen(z) && abstand(z, f) <= 1 && !(z.ruhe && bedraengt)).sort((a, b) => b.fortschritt - a.fortschritt)[0] || null;
  }
  /** Felder, die im nächsten gegnerischen Zug getroffen werden oder sich verwandeln – Helden und Begleiter meiden sie */
  function gefahrFelder(st) {
    const s = new Set(); if (!st.mech) return s;
    for (const m of st.mech.marken) for (const [x, y] of m.felder) s.add(key(x, y));
    for (const c of st.mech.wandel) for (const [x, y] of c.felder) s.add(key(x, y));
    return s;
  }
  function mechanikStart(st, m, tpk) {
    st.karte.hindernisse = st.karte.hindernisse.slice();
    const mech = st.mech = { ziele: [], wellen: [], marken: [], wandel: [], wieder: [], gerettet: 0, stat: { getroffen: 0, ausgewichen: 0 }, tpk: tpk || 1, sieg: m.sieg || null, schild: m.schild || null, eis: null,
      ausgang: m.ausgang ? { felder: m.ausgang.felder.map((p) => p.slice()), text: m.ausgang.text || null } : null, zieleZuerst: Boolean(m.zieleZuerst) };
    for (const z of m.ziele || []) {
      mech.ziele.push({ id: z.id, name: z.name, art: z.art || "ziel", x: z.x, y: z.y, runden: z.runden || 1, fortschritt: Math.min(z.start || 0, (z.runden || 1) - 1), fertig: false, verloren: false, ruhe: Boolean(z.ruhe), frist: z.frist || null,
        umkehrbar: Boolean(z.umkehrbar), aktion: z.aktion || null, fertigText: z.fertigText || null, wirkung: z.wirkung || {} });
      st.karte.hindernisse.push(["O", z.x, z.y]); st.karte.block.add(key(z.x, z.y));
    }
    for (const w of m.wellen || []) mech.wellen.push({ id: w.id, name: w.name, kurz: w.kurz || "Verstärkung", quellen: w.quellen.map((p) => p.slice()), gegner: w.gegner, alle: w.alle || 3, naechste: w.ab != null ? w.ab : 3,
      max: w.max != null ? w.max : 3, an: w.an || null, aus: Boolean(w.aus), gekommen: 0, text: w.text || null });
    if (m.eis) mech.eis = { felder: m.eis.felder.map((p) => p.slice()), proRunde: m.eis.proRunde || 2, ab: m.eis.ab || 2, bekannt: Boolean(m.eis.bekannt), max: m.eis.max != null ? m.eis.max : Math.ceil(m.eis.felder.length / 2), gebrochen: 0 };
  }
  /** Nach dem Aufstellen der Gegner: Schutzfelder verteilen */
  function mechanikGegner(st) {
    const s = st.mech.schild; if (!s) return;
    for (const g of gegnerFiguren(st)) if (g.art === s.art) {
      const halt = Math.max(4, Math.round((s.halt || 20) * st.mech.tpk));
      g.schild = { aktiv: !s.startAus, ziele: (s.ziele || []).slice(), halt, rest: halt, pause: s.pause || 2, wieder: s.startAus ? st.runde + s.startAus : null, dauerhaftAus: false, text: s.text || "Schutzfeld" };
      st.log.push(s.startAus ? { t: `${g.name}s ${g.schild.text} ist gebrochen – für ${s.startAus} Runden ist er ungeschützt.`, art: "gut" } : { t: `${g.name} ist von einem ${g.schild.text} umgeben: Es fängt die Hälfte des Schadens ab.`, art: "schlecht" });
    }
  }
  function freiesFeldNahe(st, [qx, qy], max = 3) {
    for (let r2 = 0; r2 <= max; r2++) for (let dx = -r2; dx <= r2; dx++) for (let dy = -r2; dy <= r2; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r2) continue;
      const x = qx + dx, y = qy + dy; if (!blockiert(st, x, y) && !belegt(st, x, y)) return { x, y };
    }
    return null;
  }
  function neuerGegner(st, art, feld, zusatz) {
    const d = GEGNER[art]; st.gerufen = (st.gerufen || 0) + 1;
    const tp = Math.max(1, Math.round(d.tp * ((st.mech && st.mech.tpk) || 1)));
    const g = { id: "r" + st.gerufen, seite: "gegner", art, name: d.name + (zusatz ? ` (${zusatz})` : ""), x: feld.x, y: feld.y, tp, tpMax: tp, rk: d.rk, rkBasis: d.rk, werte: d.werte, z: {}, reaktion: 1, genutzt: {}, atemBereit: true, ini: 0 };
    st.figuren.push(g); st.reihe.push(g.id);
    return g;
  }
  function welleKommt(st, w) {
    const n = spielerFiguren(st).filter((f) => !f.tot).length, neu = [];
    for (const [art, je, max, basis] of w.gegner) {
      const anzahl = Math.min(max || Infinity, Math.max(1, Math.round((basis || 0) + je * n)));
      for (let i = 0; i < anzahl; i++) { const feld = freiesFeldNahe(st, w.quellen[(neu.length + w.gekommen) % w.quellen.length]); if (feld) neu.push(neuerGegner(st, art, feld, w.kurz).name); }
    }
    w.gekommen++; w.naechste = st.runde + w.alle;
    st.log.push({ t: `${w.name}: ${neu.length ? `${neu.join(", ")} ${neu.length === 1 ? "kommt" : "kommen"} hinzu` : "kein Platz – niemand kommt durch"}.`, art: "schlecht" });
  }
  function kreisFelder(st, cx, cy, r) {
    const f = []; for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { const x = cx + dx, y = cy + dy; if (!blockiert(st, x, y)) f.push([x, y]); }
    return f;
  }
  function linienFelder(st, a, b, laenge) {
    const f = [], n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) || 1, sx = (b.x - a.x) / n, sy = (b.y - a.y) / n;
    for (let i = 1; i <= laenge; i++) { const x = Math.round(a.x + sx * i), y = Math.round(a.y + sy * i); if (blockiert(st, x, y)) break; if (!f.some(([p, q]) => p === x && q === y)) f.push([x, y]); }
    return f;
  }
  /** Zu Beginn jeder Runde: Gelände verwandeln, Eis knacken lassen, Fristen, Wellen ankündigen und schicken, Schilde aufladen */
  function mechanikRunde(st) {
    const m = st.mech;
    m.marken = m.marken.filter((x) => { const g = fig(st, x.von); return g && lebt(g); });
    for (const w of m.wieder.filter((w) => w.bis <= st.runde)) feldZurueck(st, w);
    m.wieder = m.wieder.filter((w) => w.bis > st.runde);
    // Was ein Gegner angekündigt hat, entsteht bei seinem nächsten Zug (siehe sonderZug); stirbt er vorher, verfällt es
    m.wandel = m.wandel.filter((c) => !c.von || lebt(fig(st, c.von) || { tp: 0 }));
    const jetzt = m.wandel.filter((c) => !c.von && c.runde <= st.runde); m.wandel = m.wandel.filter((c) => c.von || c.runde > st.runde);
    for (const c of jetzt) { feldWandeln(st, c); if (st.ende) return; }
    if (m.eis && st.runde >= m.eis.ab && m.eis.gebrochen < m.eis.max) {
      const helden = spielerFiguren(st).filter(lebt), zuf = new Map();
      const kand = m.eis.felder.filter(([x, y]) => !st.karte.block.has(key(x, y)) && !m.wandel.some((c) => c.felder.some(([a, b]) => a === x && b === y)));
      for (const p of kand) zuf.set(p, st.r());
      const nah = (p) => Math.min(9, ...helden.map((h) => abstand(h, { x: p[0], y: p[1] })));
      kand.sort((a, b) => nah(a) - nah(b) || zuf.get(a) - zuf.get(b));
      const wahl = kand.slice(0, Math.min(m.eis.proRunde, m.eis.max - m.eis.gebrochen)); m.eis.gebrochen += wahl.length;
      if (wahl.length) { m.wandel.push({ felder: wahl, typ: "loch", runde: st.runde + 1, name: "Das Eis" }); st.log.push({ t: `Das Eis knackt! ${wahl.length === 1 ? "Ein Feld bricht" : `${wahl.length} Felder brechen`} zu Beginn der nächsten Runde ein.`, art: "schlecht" }); }
    }
    for (const z of m.ziele) if (zielOffen(z) && z.frist && st.runde > z.frist) { z.verloren = true; st.log.push({ t: `${z.name}: zu spät.${z.wirkung.verlorenText ? " " + z.wirkung.verlorenText : ""}`, art: "schlecht" }); }
    if (m.zieleZuerst) { pruefeEnde(st); if (st.ende) return; }
    for (const w of m.wellen) {
      if (w.aus || w.gekommen >= w.max) continue;
      if (w.an && !gegnerFiguren(st).some((g) => lebt(g) && g.art === w.an)) { w.aus = true; st.log.push({ t: `${w.name}: Niemand ruft mehr Verstärkung.`, art: "gut" }); continue; }
      if (st.runde >= w.naechste) welleKommt(st, w);
      else if (st.runde === w.naechste - 1) st.log.push({ t: `${w.name}: ${w.text || "Es regt sich etwas"} – nächste Runde kommt Verstärkung.`, art: "schlecht" });
    }
    for (const g of gegnerFiguren(st)) {
      const s = g.schild;
      if (s && !s.aktiv && !s.dauerhaftAus && s.wieder && st.runde >= s.wieder && lebt(g)) { s.aktiv = true; s.rest = s.halt; s.wieder = null; st.log.push({ t: `${g.name}: Das ${s.text} baut sich wieder auf.`, art: "schlecht" }); }
    }
  }
  /** Angekündigte Felder verwandeln sich: „loch“ (bricht ein, versperrt den Weg, nicht die Sicht) oder „wand“ (Eis, versperrt beides; mit dauer nur für einige Runden) */
  function feldWandeln(st, c) {
    const t = c.typ === "loch" ? "L" : "E"; let n = 0;
    for (const [x, y] of c.felder) {
      if (st.karte.block.has(key(x, y))) continue;
      st.karte.hindernisse.push([t, x, y]); st.karte.block.add(key(x, y)); if (t === "L") st.karte.offen.add(key(x, y)); n++;
      if (c.dauer) st.mech.wieder.push({ t, x, y, bis: st.runde + c.dauer });
      for (const f of st.figuren.filter((o) => !o.tot && o.x === x && o.y === y)) { verdraengen(st, f, t === "L"); if (st.ende) return; }
    }
    if (n) st.log.push({ t: t === "L" ? `${c.name || "Das Eis"} bricht ein.` : `${c.name || "Eis"} wächst aus dem Boden${c.dauer ? ` (${c.dauer} Runden)` : ""}.`, art: "schlecht" });
  }
  function feldZurueck(st, w) {
    const i = st.karte.hindernisse.findIndex(([t, x, y]) => t === w.t && x === w.x && y === w.y); if (i < 0) return;
    st.karte.hindernisse.splice(i, 1); st.karte.block.delete(key(w.x, w.y)); st.karte.offen.delete(key(w.x, w.y));
  }
  function verdraengen(st, f, fallen) {
    const feld = freiesFeldNahe(st, [f.x, f.y]);
    if (fallen && f.tp > 0) {
      const rw = rettung(st, f, "GES", 12);
      if (rw.erfolg) st.log.push({ t: `${f.name} springt rechtzeitig zur Seite.` });
      else { const s = roll(st.r, "2W6").total; f.z.liegend = true; st.log.push({ t: `${f.name} stürzt ins Eiswasser und zieht sich heraus: ${s} Schaden, liegt.`, art: "schlecht" }); if (feld) { f.x = feld.x; f.y = feld.y; } schaden(st, f, s); return; }
    }
    if (feld) { f.x = feld.x; f.y = feld.y; }
  }
  function zielBedienen(st, f) {
    const z = zielNeben(st, f); if (!z) return;
    z.fortschritt++;
    if (z.fortschritt < z.runden) { st.log.push({ t: `${f.name} arbeitet an ${z.name} (${z.fortschritt}/${z.runden}).`, art: "gut" }); return; }
    z.fertig = true; st.log.push({ t: `${f.name}: ${z.name} – ${z.fertigText || "geschafft"}.`, art: "gut" });
    const w = z.wirkung;
    for (const id of [].concat(w.welleAus || [])) { const q = st.mech.wellen.find((x) => x.id === id); if (q && !q.aus) { q.aus = true; st.log.push({ t: `${q.name}: versiegt.`, art: "gut" }); } }
    // Welle endet erst, wenn alle Ziele dieser Art erledigt sind (z. B. drei Runenpunkte)
    if (w.welleAusAlle && st.mech.ziele.filter((x) => x.art === z.art).every((x) => x.fertig)) { const q = st.mech.wellen.find((x) => x.id === w.welleAusAlle); if (q && !q.aus) { q.aus = true; st.log.push({ t: `${q.name}: versiegt.`, art: "gut" }); } }
    if (w.gerettet) st.mech.gerettet++;
    if (w.oeffnet) { feldZurueck(st, { t: "O", x: z.x, y: z.y }); st.log.push({ t: `${z.name}: Der Weg ist frei.`, art: "gut" }); } // Tür, Gitter: das Feld wird begehbar
    if (st.mech.zieleZuerst) pruefeEnde(st);
    if (w.schild) for (const g of gegnerFiguren(st)) if (g.schild && g.schild.ziele.includes(z.id) && g.schild.ziele.every((id) => (st.mech.ziele.find((x) => x.id === id) || {}).fertig)) {
      g.schild.aktiv = false; g.schild.dauerhaftAus = true; st.log.push({ t: `${g.name}: Das ${g.schild.text} erlischt endgültig.`, art: "gut" });
    }
    mechSiegPruefen(st);
  }
  /** Ein Rufer kehrt ein Ziel um: Welle wieder an, Schild wieder an */
  function zielZurueck(st, z) {
    const w = z.wirkung;
    for (const id of [].concat(w.welleAus || [])) { const q = st.mech.wellen.find((x) => x.id === id); if (q && q.aus && q.gekommen < q.max) { q.aus = false; q.naechste = Math.max(q.naechste, st.runde + 2); } }
    if (w.schild) for (const g of gegnerFiguren(st)) if (g.schild && g.schild.ziele.includes(z.id) && g.schild.dauerhaftAus) { g.schild.dauerhaftAus = false; g.schild.aktiv = true; g.schild.rest = g.schild.halt; }
  }
  function mechSiegPruefen(st) {
    const s = st.mech && st.mech.sieg; if (!s || st.ende) return;
    const ok = (s.ziele && st.mech.ziele.filter((z) => z.fertig && (!s.art || z.art === s.art)).length >= s.ziele) || [].concat(s.besiegt || []).some((b) => gegnerFiguren(st).filter((g) => g.art === b.art && g.tp <= 0).length >= b.n);
    if (!ok) return;
    st.ende = "sieg"; st.xp = gegnerFiguren(st).filter((g) => g.tp <= 0).reduce((a, g) => a + GEGNER[g.art].xp, 0);
    st.log.push({ t: s.text || "Ziel erreicht – der Weg ist frei!", art: "ende" });
  }
  /** Durchbruch: Stehen alle stehenden Helden auf den Ausgangsfeldern, ist der Kampf gewonnen (Verwundete werden mitgetragen) */
  function ausgangPruefen(st) {
    const a = st.mech && st.mech.ausgang; if (!a || st.ende) return;
    const sp = spielerFiguren(st).filter((f) => !f.tot && f.tp > 0); // wer am Boden liegt, wird mitgetragen
    if (!sp.length || !sp.every((f) => a.felder.some(([x, y]) => x === f.x && y === f.y))) return;
    st.ende = "sieg"; st.xp = gegnerFiguren(st).filter((g) => g.tp <= 0).reduce((s, g) => s + GEGNER[g.art].xp, 0);
    st.log.push({ t: a.text || "Ihr seid durch!", art: "ende" });
  }
  /** Schutzfeld: fängt die Hälfte ab, bis es erschöpft ist; danach Pause, bis es sich wieder aufbaut (es sei denn, seine Ziele sind erledigt) */
  function schildAbfangen(st, z, n) {
    const s = z.schild; if (!s || !s.aktiv || n <= 0) return n;
    const ab = Math.ceil(n / 2); s.rest -= ab;
    if (s.rest <= 0) { s.aktiv = false; s.wieder = st.runde + s.pause + 1; st.log.push({ t: `${z.name}: Das ${s.text} bricht zusammen! Für ${s.pause} Runden ist ${z.name} ungeschützt.`, art: "gut" }); }
    return n - ab;
  }
  /** Boss-Phasen nach TP-Schwellen: [{ ab: 0.66, text, rk, welle, feld: { felder, typ, name, dauer }, schild }] */
  function phasenPruefen(st, g) {
    const ph = GEGNER[g.art].phasen; if (!ph || !lebt(g)) return;
    g.phase = g.phase || 0;
    while (g.phase < ph.length && g.tp <= g.tpMax * ph[g.phase].ab) {
      const p = ph[g.phase]; g.phase++;
      st.log.push({ t: p.text, art: "schlecht" });
      if (p.rk) { g.rk += p.rk; g.rkBasis += p.rk; }
      if (p.welle && st.mech) { const w = st.mech.wellen.find((x) => x.id === p.welle); if (w && w.aus) { w.aus = false; w.naechste = st.runde + 2; } }
      if (p.feld && st.mech) st.mech.wandel.push({ felder: p.feld.felder.map((q) => q.slice()), typ: p.feld.typ || "loch", von: g.id, name: p.feld.name || null, dauer: p.feld.dauer || null });
      if (p.schild && g.schild) { g.schild.aktiv = true; g.schild.rest = g.schild.halt; g.schild.dauerhaftAus = false; }
    }
  }
  /** Rückstoß nach einem Treffer: STR-Rettung, sonst bis zu n Felder weg vom Angreifer; an Abgrund oder Loch: Sturz, an der Wand: Aufprall */
  function rueckstoss(st, g, z, rs) {
    if (!lebt(z)) return;
    const rw = rettung(st, z, "STR", rs.sg); if (rw.erfolg) { st.log.push({ t: `${z.name} stemmt sich gegen den Stoß.` }); return; }
    const dx = Math.sign(z.x - g.x), dy = Math.sign(z.y - g.y); let n = 0;
    for (; n < rs.felder; n++) {
      const x = z.x + dx, y = z.y + dy, k = key(x, y);
      if (st.karte.block.has(k) && st.karte.offen.has(k)) { const s = roll(st.r, "2W6").total; z.z.liegend = true; st.log.push({ t: `${g.name} stößt ${z.name} an die Kante – ${z.name} stürzt halb hinab und zieht sich hoch: ${s} Schaden, liegt.`, art: "schlecht" }); schaden(st, z, s); return; }
      if (blockiert(st, x, y)) { const s = W(st.r, 6); st.log.push({ t: `${g.name} schleudert ${z.name} gegen das Gestein: ${s} Schaden.`, art: "schlecht" }); schaden(st, z, s); return; }
      if (belegt(st, x, y, z)) break;
      z.x = x; z.y = y;
    }
    if (n) { st.log.push({ t: `${g.name} stößt ${z.name} ${n === 1 ? "ein Feld" : n + " Felder"} zurück.`, art: "gegner" }); brandFeld(st, z); }
  }
  /** Wegkarte: Schritte bis neben das Ziel, um Hindernisse herum (Figuren zählen nicht) */
  function wegKarte(st, z) {
    const d = new Map(), q = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const x = z.x + dx, y = z.y + dy; if ((dx || dy) && !blockiert(st, x, y)) { d.set(key(x, y), 0); q.push([x, y]); } }
    while (q.length) {
      const [x, y] = q.shift(), c = d.get(key(x, y));
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx, ny = y + dy, k2 = key(nx, ny);
        if ((!dx && !dy) || blockiert(st, nx, ny) || d.has(k2) || (dx && dy && (blockiert(st, x + dx, y) || blockiert(st, x, y + dy)))) continue;
        d.set(k2, c + 1); q.push([nx, ny]);
      }
    }
    return d;
  }
  /** Ausweg aus Sackgassen (nur mit Mechaniken, weil dort Löcher und Eiswände Wege verändern): bestes Feld nach echter Weglänge */
  function naeherAufWeg(st, f, z, felder) {
    const wk = wegKarte(st, z), jetzt = wk.has(key(f.x, f.y)) ? wk.get(key(f.x, f.y)) : Infinity; let best = null;
    for (const [k2, c] of felder) { if (c === "schritt") continue; const w = wk.get(k2); if (w == null || w >= jetzt) continue; if (!best || w < best.w || (w === best.w && c < best.c)) { const [x, y] = k2.split(",").map(Number); best = { x, y, w, c }; } }
    return best;
  }
  /** Bringt das gewählte Feld f auf dem echten Weg näher an z? Wenn nicht, das beste Feld nach Weglänge (sonst pendeln Figuren in Sackgassen) */
  function wegKorrektur(st, f, z, best, felder) {
    if (!best || !z) return best;
    const wk = wegKarte(st, z), jetzt = wk.has(key(f.x, f.y)) ? wk.get(key(f.x, f.y)) : Infinity, dort = wk.get(key(best.x, best.y));
    if (dort != null && dort < jetzt) return best;
    if (jetzt === 0) return best;
    return naeherAufWeg(st, f, z, felder) || best;
  }
  /** Sonderzüge der neuen Gegner. Gibt true zurück, wenn der Zug damit erledigt ist */
  function sonderZug(st, g, d) {
    const m = st.mech;
    // 1. Was dieser Gegner angekündigt hat, geschieht jetzt: Eis wächst, die Fläche trifft (danach handelt er normal weiter)
    if (m) {
      const wd = m.wandel.filter((c) => c.von === g.id);
      if (wd.length) { m.wandel = m.wandel.filter((c) => c.von !== g.id); for (const c of wd) { feldWandeln(st, c); if (st.ende) return true; } if (!lebt(g)) { weiter(st); return true; } }
      const mk = m.marken.find((x) => x.von === g.id);
      if (mk) {
        m.marken = m.marken.filter((x) => x !== mk);
        const getroffen = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && mk.felder.some(([x, y]) => x === f.x && y === f.y)), teile = [];
        for (const f of getroffen) { const rw = rettung(st, f, mk.rettung, mk.sg); let s = roll(st.r, mk.schaden).total; if (rw.erfolg) s = Math.floor(s / 2); else if (mk.liegend) f.z.liegend = true; teile.push(`${f.name} ${s}`); schaden(st, f, s); if (st.ende) return true; }
        m.stat.getroffen += teile.length; m.stat.ausgewichen += Math.max(0, (mk.n || 0) - teile.length);
        st.log.push({ t: `${g.name}: ${mk.name} – ${teile.length ? teile.join(", ") : "alle sind ausgewichen"}.`, art: teile.length ? "gegner" : "gut" });
        if (!lebt(g)) { weiter(st); return true; }
      }
    }
    // 2. Nest: bewegt sich nicht, lässt in festen Abständen Schwärmer schlüpfen
    if (d.nest) {
      const n = d.nest; g.nestN = g.nestN || 0;
      if (st.runde % n.alle === 0 && g.nestN < n.max) { const feld = freiesFeldNahe(st, [g.x, g.y], 2); if (feld) { const s = neuerGegner(st, n.art, feld, "geschlüpft"); g.nestN++; st.log.push({ t: `${g.name} bricht auf: ${s.name} kriecht heraus.`, art: "schlecht" }); } }
      weiter(st); return true;
    }
    // 2b. Brut: Die Mutter legt alle paar Runden einen Schwärmer neben sich und kämpft dann weiter
    if (d.brut && st.runde % d.brut.alle === 0 && (g.brutN || 0) < d.brut.max && g.brutRunde !== st.runde) {
      const feld = freiesFeldNahe(st, [g.x, g.y], 2); g.brutRunde = st.runde;
      if (feld) { const s = neuerGegner(st, d.brut.art, feld, "Brut"); g.brutN = (g.brutN || 0) + 1; st.log.push({ t: `${g.name} würgt ${s.name} hervor.`, art: "schlecht" }); }
    }
    // 3. Rufer: erweckt erledigte Ziele wieder oder stärkt Verbündete
    if (d.rufer && ruferZug(st, g, d.rufer)) return true;
    // 4. Fläche ankündigen (nicht, solange schon eine Marke dieses Gegners liegt)
    const fl = d.flaeche;
    if (m && fl && (g.phase || 0) >= (fl.phase || 0) && (g.flaecheRunde == null || st.runde - g.flaecheRunde >= fl.alle) && !m.marken.some((x) => x.von === g.id)) { if (flaecheAnkuendigen(st, g, fl)) { weiter(st); return true; } }
    // 5. Feldzauber: Eiswände trennen eine Heldengruppe
    const fz = d.feldzauber;
    if (m && fz && (g.feldRunde == null || st.runde - g.feldRunde >= fz.alle) && !m.wandel.some((c) => c.von === g.id)) { if (feldzauber(st, g, fz)) { weiter(st); return true; } }
    return false;
  }
  function flaecheAnkuendigen(st, g, fl) {
    const ziele = st.figuren.filter((f) => f.seite === "spieler" && lebt(f) && !f.z.versteckt), drin = (felder) => ziele.filter((f) => felder.some(([x, y]) => x === f.x && y === f.y)).length;
    let best = null;
    if (fl.form === "ring") { const felder = kreisFelder(st, g.x, g.y, fl.radius || 1).filter(([x, y]) => x !== g.x || y !== g.y); best = { felder, n: drin(felder) }; }
    else for (const z of ziele) {
      if (abstand(g, z) > (fl.reichweite || 6) || !sicht(st, g, z)) continue;
      const felder = fl.form === "linie" ? linienFelder(st, g, z, fl.reichweite || 6) : kreisFelder(st, z.x, z.y, fl.radius || 1), n = drin(felder);
      if (!best || n > best.n) best = { felder, n };
    }
    if (!best || best.n < (fl.mindestens || 1)) return false;
    st.mech.marken.push({ von: g.id, n: best.n, felder: best.felder, name: fl.name, schaden: fl.schaden, sg: fl.sg, rettung: fl.rettung || "GES", liegend: Boolean(fl.liegend) });
    g.flaecheRunde = st.runde;
    st.log.push({ t: `${g.name} holt aus: ${fl.name}! ${best.felder.length} Felder leuchten auf – wer bei seinem nächsten Zug dort steht, wird getroffen.`, art: "schlecht" });
    return true;
  }
  /** Eiswand: Die Felder neben dem Helden, der am dichtesten bei seinen Freunden steht, frieren zu (angekündigt, für einige Runden) */
  function feldzauber(st, g, fz) {
    const helden = spielerFiguren(st).filter((h) => lebt(h) && abstand(h, g) <= (fz.reichweite || 8) && sicht(st, g, h)); let best = null;
    for (const h of helden) {
      const freunde = helden.filter((o) => o !== h && abstand(o, h) <= 3).length; if (!freunde) continue;
      const felder = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const x = h.x + dx, y = h.y + dy; if ((dx || dy) && !blockiert(st, x, y) && !belegt(st, x, y) && !gefahrFelder(st).has(key(x, y))) felder.push([x, y]); }
      felder.sort((a, b) => helden.filter((o) => o !== h && abstand(o, { x: b[0], y: b[1] }) <= 2).length - helden.filter((o) => o !== h && abstand(o, { x: a[0], y: a[1] }) <= 2).length);
      if (felder.length && (!best || freunde > best.freunde)) best = { felder: felder.slice(0, fz.anzahl || 3), freunde, h };
    }
    if (!best) return false;
    st.mech.wandel.push({ felder: best.felder, typ: "wand", von: g.id, name: fz.name || "Eis", dauer: fz.dauer || 2 });
    g.feldRunde = st.runde;
    st.log.push({ t: `${g.name}: ${fz.name || "Eiswand"} – neben ${best.h.name} beginnt der Boden zu gefrieren. Bei ${g.name}s nächstem Zug wächst dort Eis.`, art: "schlecht" });
    return true;
  }
  function ruferZug(st, g, rf) {
    const m = st.mech;
    const bereit = g.ruferRunde == null || st.runde - g.ruferRunde >= 2; // nur jede zweite Runde
    const z = bereit && m && m.ziele.filter((x) => x.umkehrbar && !x.verloren && (x.fertig || x.fortschritt > 0)).sort((a, b) => abstand(a, g) - abstand(b, g))[0];
    if (z) {
      if (abstand(z, g) > 1 && st.zug.bewegung > 0) {
        const mm = erreichbar(st, g, st.zug.bewegung); let best = null;
        for (const [k2, c] of mm) { const [x, y] = k2.split(",").map(Number), dd = abstand({ x, y }, z); if (!best || dd < best.d || (dd === best.d && c < best.c)) best = { x, y, d: dd, c }; }
        if (best) { const sx = g.x, sy = g.y; g.x = best.x; g.y = best.y; brandFeld(st, g); fangschuss(st, g, sx, sy); }
      }
      if (lebt(g) && !st.ende && abstand(z, g) <= 1) {
        const war = z.fertig; z.fertig = false; g.ruferRunde = st.runde; z.fortschritt = Math.max(0, (war ? z.runden : z.fortschritt) - 1);
        st.log.push({ t: `${g.name} legt die Hand auf ${z.name}: ${war ? "Er erwacht wieder" : "Der Fortschritt schwindet"} (${z.fortschritt}/${z.runden}).`, art: "schlecht" });
        if (war) zielZurueck(st, z);
        if (!st.ende) weiter(st); return true;
      }
      if (!lebt(g) || st.ende) { if (!st.ende) weiter(st); return true; }
    }
    if (rf.heilung) {
      const v = gegnerFiguren(st).filter((o) => lebt(o) && o !== g && o.tp < o.tpMax * 0.6 && abstand(o, g) <= (rf.reichweite || 6)).sort((a, b) => a.tp / a.tpMax - b.tp / b.tpMax)[0];
      if (v) { const n = roll(st.r, rf.heilung).total, vor = v.tp; v.tp = Math.min(v.tpMax, v.tp + n); st.log.push({ t: `${g.name} haucht Kälte über ${v.name}: +${v.tp - vor} TP.`, art: "gegner" }); weiter(st); return true; }
    }
    return false;
  }

  /* ---------- Steuerung ohne Spieler (Tests, „Tisch steuert“) ---------- */
  function erwarteterSchaden(st, f, a, z) {
    if (a.art === "angriff") {
      const bonus = mod(f.werte[a.attr]) + UEBUNG, v = vorteil(st, f, z, { fern: a.fern, ruecksichtslos: a.ruecksichtslos }).v;
      let p = Math.max(0.05, Math.min(0.95, (21 - (rkEff(st, z, f, { fern: a.fern }) - bonus)) / 20));
      if (v > 0) p = 1 - (1 - p) ** 2; if (v < 0) p = p * p;
      let dmg = mittel(a.schaden) + (a.ohneMod ? 0 : mod(f.werte[a.attr]));
      if (z.z.mal_jaeger === f.id) dmg += 3; if (z.z.brandmal === f.id) dmg += 3.5; if (f.klasse === "schurke" && !st.zug.hinterhalt) dmg += 3.5 * p;
      if (a.doppel) dmg *= 1.5;
      return p * dmg;
    }
    if (a.art === "geschoss") return 10.5;
    const pf = (attr) => Math.max(0.05, Math.min(0.95, (SG(f, a.attr || attr) - 1 - mod(z.werte[a.rettung || attr])) / 20));
    if (a.art === "rettungswurf") return pf() * (mittel(a.schaden) + (a.plusAttr ? mod(f.werte[a.attr]) : 0));
    if (a.art === "flaeche") { const b = flaecheZiele(st, f, a, z); return b.reduce((s, o) => s + Math.min(o.tp, mittel(a.schaden) * (pf() + (1 - pf()) / 2)), 0); }
    if (a.art === "albtraum") return flaecheZiele(st, f, { form: "kreis", groesse: a.radius || 1 }, z).length * (pf() * 9 + (1 - pf()) * 4.5);
    return 0;
  }
  const bedrohung = (g) => (GEGNER[g.art].angriff ? mittel(GEGNER[g.art].angriff.schaden) : 4);
  function wertAktion(st, f, a, z) {
    const slot = (brauchtPlatz(f, a) ? (a.platz === 2 ? 5 : 3) : 0) * st.sparen, begrenzt = (a.pro ? 1.5 : 0) * st.sparen;
    switch (a.art) {
      case "angriff": case "geschoss": case "rettungswurf": case "flaeche": case "albtraum": {
        let v = erwarteterSchaden(st, f, a, z);
        if (v >= z.tp) v += 4;
        if (a.fesseln) v += 2; if (a.zustand && a.art === "rettungswurf") v += 1;
        return v - slot - begrenzt;
      }
      case "kontrolle": {
        if (z.tp < 8) return -1;
        const pfail = Math.max(0.05, Math.min(0.95, (SG(f, a.attr) - 1 - mod(z.werte[a.rettung])) / 20));
        const runden = a.zustand === "netz" ? 2 : a.dauer || 1;
        const wirkung = a.zustand === "geblendet" ? 0.6 : a.zustand === "netz" ? 1.2 : a.zustand === "festgehalten" ? 0.6 : a.zustand === "zeitriss" ? 0.6 : 1; // Netz: Gegner verliert Züge beim Befreien, Angriffe gegen ihn mit Vorteil
        const betroffen = a.radius ? flaecheZiele(st, f, { form: "kreis", groesse: a.radius }, z).filter((o) => o.tp >= 6) : [z];
        return betroffen.reduce((s, o) => s + pfail * bedrohung(o) * runden * wirkung * 0.9, 0) + (a.zustand === "verbannt" ? 4 : 0) - slot - begrenzt;
      }
      case "stoss": case "entwaffnen": return z.tp > 8 ? 3.5 - begrenzt : -1;
      case "heilung": return z.tp <= 0 ? 15 : z.tp < z.tpMax * 0.45 ? Math.min(z.tpMax - z.tp, 7) - slot * 0.5 : -1;
      case "aufrichten": return (z.aufgerichtet || 0) >= 3 ? -1 : 15; // Automatik: nicht endlos dieselbe Figur aufrichten
      case "segen": { const n = spielerFiguren(st).filter((o) => o.tp > 0 && !o.z.segen && abstand(f, o) <= 6).slice(0, 3).length; return n >= 2 ? n * 2.4 * Math.max(1, 4 - st.runde) / 2 - slot : -1; }
      case "schutzkreis": return spielerFiguren(st).filter((o) => o.tp > 0 && abstand(o, f) <= 2).length * 2.5 - slot;
      case "spiegelbilder": return f.tp < f.tpMax && gegnerFiguren(st).some((g) => lebt(g) && abstand(g, f) <= 7) ? 6 - slot : -1;
      case "vertreiben": return gegnerFiguren(st).filter((o) => lebt(o) && GEGNER[o.art].untot && abstand(o, f) <= 6).length * 5 - begrenzt;
      case "bewahren": return spielerFiguren(st).some((o) => o.tp < o.tpMax * 0.5) ? 5 * f.stufe * 0.8 - begrenzt : -1;
      case "bannkreis": return gegnerFiguren(st).filter((o) => lebt(o) && abstand(o, z) <= 2).length * 3 - slot;
      case "rauch": return -1;
      case "siegel": return 9;
      case "ziel": return 8;
      case "name": return 12;
      case "silber": return gegnerFiguren(st).filter((g) => lebt(g) && g.art === "knochenwaechter" && abstand(g, f) <= 6).length * 4;
      default: return -1;
    }
  }
  function besteAktion(st, f, typ) {
    let best = null;
    for (const a of aktionenVon(f, st)) {
      if ((a.typ || "aktion") !== typ || !verfuegbar(st, a.id)) continue;
      for (const z of ziele(st, a.id)) { const v = wertAktion(st, f, a, z); if (v > 0.3 && (!best || v > best.v)) best = { a, z, v }; }
    }
    return best;
  }
  function versuche(st, id, z) { if (verfuegbar(st, id)) { const zs = ziele(st, id); const t = z && zs.includes(z) ? z : zs[0]; if (t) handeln(st, id, t.id); return true; } return false; }
  function autoZug(st) {
    const f = aktiv(st); if (!f || f.seite !== "spieler" || st.ende) return;
    const gegner = () => gegnerFiguren(st).filter(lebt);
    const freundeAmBoden = () => spielerFiguren(st).filter((o) => o.tp <= 0 && !o.tot && !(st.schwierigkeit === "hardcore" && o.stabil));
    const kann = (id) => verfuegbar(st, id);
    const eigeneAkt = aktionenVon(f, st);
    const nahAngriff = eigeneAkt.find((a) => a.art === "angriff" && a.reichweite === 1 && !a.ruecksichtslos);
    const fernAngriff = eigeneAkt.find((a) => (a.art === "angriff" && a.reichweite > 1 && !a.nachDolch && !a.fesseln && !a.doppel) || (a.art === "rettungswurf" && !a.platz));
    // 1. Notfall-Heilung als Bonusaktion
    for (const id of ["heilendes_wort", "massenheilwort"]) { const zs = kann(id) ? ziele(st, id) : []; const z = zs.find((o) => o.tp <= 0) || zs.find((o) => o.tp < o.tpMax * 0.35); if (z) handeln(st, id, z.id); }
    if (f.tp < f.tpMax * 0.4) { if (!versuche(st, "zweiter_atem")) versuche(st, "heiltrank"); }
    if (st.ende) return;
    // Angekündigte Flächen und knackendes Eis meiden: Wer auf so einem Feld steht, geht zuerst herunter
    const gefahr = gefahrFelder(st);
    const bf = () => { const m0 = bewegungsfelder(st, f); return gefahr.size ? new Map([...m0].filter(([k2]) => !gefahr.has(k2))) : m0; };
    if (gefahr.has(key(f.x, f.y))) {
      let b = null;
      for (const [k2, c] of bf()) { if (c === "schritt") continue; const [x, y] = k2.split(",").map(Number), gg = gegner().some((g) => abstand(g, { x, y }) <= 1) ? 1 : 0; if (!b || gg < b.gg || (gg === b.gg && c < b.c)) b = { x, y, c, gg }; }
      if (b) bewegen(st, b.x, b.y);
      if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; }
    }
    // Ziel wählen: angeschlagen und nah
    // Rufer (erwecken Ziele, rufen Verstärkung) haben Vorrang
    const vorrang = (g) => (GEGNER[g.art].rufer || (st.mech && st.mech.wellen.some((w) => !w.aus && w.an === g.art)) ? -0.6 : 0);
    const zielWahl = () => gegner().sort((a, b) => (a.tp / a.tpMax + abstand(f, a) * 0.08 + vorrang(a)) - (b.tp / b.tpMax + abstand(f, b) * 0.08 + vorrang(b)))[0];
    let ziel = zielWahl(); if (!ziel && !(st.mech && st.mech.ziele.some(zielOffen))) return zugEnde(st);
    if (kann("raserei") && gegner().some((g) => abstand(g, f) <= 8)) handeln(st, "raserei", f.id);
    // Endkampf: freie Siegelsteine berühren, wenn erreichbar
    if (st.siegel && st.siegel.some((z) => !z.beruehrt) && bossVon(st) && !imPakt(st, f) && st.zug.aktion) {
      if (kann("siegelstein")) { handeln(st, "siegelstein", f.id); }
      else if (!gegner().some((g) => abstand(g, f) <= 1)) {
        let best = null;
        for (const [k, c] of bf()) { const [x, y] = k.split(",").map(Number); if (st.siegel.some((z) => !z.beruehrt && abstand(z, { x, y }) <= 1) && (!best || (c === "schritt" ? 0 : c) < best.c)) best = { x, y, c: c === "schritt" ? 0 : c }; }
        if (best) { bewegen(st, best.x, best.y); if (lebt(f) && kann("siegelstein")) handeln(st, "siegelstein", f.id); }
      }
      if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; }
    }
    // Ziele (Siegelsteine, Runensäulen, Eisblöcke …): Je offenes Ziel kümmert sich die nächste Figur darum – höchstens die Hälfte der Gruppe, die anderen kämpfen
    let zielGemacht = false, ausgangGemacht = false;
    if (st.mech && st.zug.aktion) {
      const offen = st.mech.ziele.filter(zielOffen);
      if (offen.length) {
        const helden = spielerFiguren(st).filter(lebt), plaetze = gegner().length ? Math.max(1, Math.ceil(helden.length / 2)) : helden.length, paare = [], zu = new Map(), vergeben = new Set();
        const ruferDran = (z) => z.umkehrbar && gegner().some((g) => GEGNER[g.art].rufer && abstand(g, z) <= 2);
        for (const z of offen) if (!ruferDran(z)) for (const h of helden) paare.push({ z, h, d: abstand(z, h) - (z.frist ? 2 : 0) });
        paare.sort((x, y) => x.d - y.d);
        for (const p of paare) { if (zu.size >= plaetze) break; if (zu.has(p.h) || vergeben.has(p.z)) continue; zu.set(p.h, p.z); vergeben.add(p.z); }
        const meins = zu.get(f);
        if (meins) {
          if (abstand(f, meins) > 1) {
            let best = null;
            for (const [k2, c] of bf()) { if (c === "schritt") continue; const [x, y] = k2.split(",").map(Number), d = abstand({ x, y }, meins); if (!best || d < best.d || (d === best.d && c < best.c)) best = { x, y, c, d }; }
            if (best && best.d > 1) best = wegKorrektur(st, f, meins, best, bf());
            if (best && !(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y);
            zielGemacht = true;
          }
          if (lebt(f) && !st.ende && kann("ziel")) { handeln(st, "ziel", f.id); zielGemacht = true; }
          if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; }
        }
      }
    }
    // Durchbruch: alle zum Ausgang – solange niemand am Boden liegt
    const aus = st.mech && st.mech.ausgang;
    if (aus && !zielGemacht && !freundeAmBoden().length) {
      if (aus.felder.some(([x, y]) => x === f.x && y === f.y)) ausgangGemacht = true;
      else {
        const frei = aus.felder.filter(([x, y]) => !belegt(st, x, y, f)); let best = null;
        for (const [k2, c] of bf()) { if (c === "schritt") continue; const [x, y] = k2.split(",").map(Number), d = Math.min(99, ...frei.map(([a2, b2]) => abstand({ x, y }, { x: a2, y: b2 }))); if (!best || d < best.d || (d === best.d && c < best.c)) best = { x, y, d, c }; }
        if (best && !(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y);
        ausgangGemacht = true;
        if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; }
      }
    }
    if (!ziel) { if (!st.ende) zugEnde(st); return; } // keine Gegner mehr, nur noch Ziele: wer keins hat, wartet
    // (Steht nur noch ein Nahkämpfer, bleibt er nicht als Leibwache stehen: Sonst erreicht er einen Schützen nie und der Kampf endet nicht.)
    // Eskorte: Wer Sera am nächsten ist, kümmert sich um sie – am Boden stabilisieren, sonst bei nahem Jäger neben sie stellen
    const sera = st.eskorte && begleiterVon(st);
    if (sera && st.zug.aktion) {
      const helden = spielerFiguren(st).filter(lebt), naechster = helden.sort((a, b) => abstand(a, sera) - abstand(b, sera))[0];
      const neben = () => { if (abstand(f, sera) <= 1) return true; let best = null; for (const [k, c] of bf()) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); if (abstand({ x, y }, sera) <= 1 && (!best || c < best.c)) best = { x, y, c }; } if (best) bewegen(st, best.x, best.y); return lebt(f) && abstand(f, sera) <= 1; };
      if (sera.tp <= 0 && !sera.stabil && naechster === f) { if (neben() && kann("stabilisieren")) handeln(st, "stabilisieren", sera.id); if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; } }
      else if (lebt(sera) && naechster === f && (helden.length > 1 || fernAngriff) && !helden.some((h) => h !== f && abstand(h, sera) <= 1) && gegner().some((g) => GEGNER[g.art].jaeger && abstand(g, sera) <= 6)) {
        neben(); if (st.ende || !lebt(f)) { if (!st.ende) zugEnde(st); return; }
        const z = gegner().filter((g) => abstand(g, f) <= 1).sort((a, b) => a.tp - b.tp)[0]; if (z) ziel = z;
        if (abstand(f, sera) <= 1) { // bleibt als Leibwache stehen: angreifen, was erreichbar ist, dann Zug beenden
          const a = nahAngriff && z ? nahAngriff : fernAngriff;
          if (a && st.zug.aktion) { const zz = ziele(st, a.id).find((o) => o === ziel) || ziele(st, a.id).sort((x, y) => x.tp - y.tp)[0]; if (zz) handeln(st, a.id, zz.id); }
          if (!st.ende) zugEnde(st); return;
        }
      }
    }
    // Schmutziger Trick, solange der Gegner noch neben einem steht (danach geht es weg)
    if (kann("trick") && st.zug.bonus) { const t = gegner().filter((g) => abstand(g, f) <= 1 && g.tp > 6).sort((a, b) => bedrohung(b) - bedrohung(a))[0]; if (t) versuche(st, "trick", t); }
    // 2. Bewegen
    const nah = Boolean(nahAngriff) && (!fernAngriff || ["krieger"].includes(f.klasse) || ["inquisitor", "assassine", "schattenlaeufer", "tiergefaehrte"].includes(f.fid));
    const m = bf();
    const nebenGegner = (x, y) => gegner().some((g) => abstand(g, { x, y }) <= 1);
    if (zielGemacht || ausgangGemacht) { /* schon gezogen: am Ziel oder am Ausgang bleiben */ }
    else if (nah) {
      // zum besten erreichbaren Gegner
      let best = null;
      for (const g of gegner()) for (const [k, c] of m) {
        const [x, y] = k.split(",").map(Number); if (abstand({ x, y }, g) > 1) continue;
        const wert = g.tp / g.tpMax + (c === "schritt" ? 0.2 : c * 0.02) + (spielerFiguren(st).some((o) => o !== f && lebt(o) && abstand(o, g) <= 1) ? -0.15 : 0);
        if (!best || wert < best.wert) best = { x, y, g, wert };
      }
      if (best) { if (!(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y); ziel = best.g; }
      else if (abstand(f, ziel) > 1) {
        // nicht erreichbar: so nah wie möglich, ggf. Fernkampf
        let näher = null; for (const [k, c] of m) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = abstand({ x, y }, ziel); if (!näher || d < näher.d) näher = { x, y, d }; }
        if (st.mech) näher = wegKorrektur(st, f, ziel, näher || { x: f.x, y: f.y }, m);
        if (näher && !(näher.x === f.x && näher.y === f.y)) bewegen(st, näher.x, näher.y);
      }
    } else {
      const fernR = fernAngriff ? fernAngriff.reichweite : 12;
      const gut = (x, y) => !nebenGegner(x, y) && gegner().some((g) => abstand(g, { x, y }) <= fernR && sicht(st, { x, y }, g));
      if (!gut(f.x, f.y) || nebenGegner(f.x, f.y)) {
        if (nebenGegner(f.x, f.y)) versuche(st, "rueckzug") || versuche(st, "schattenschritt");
        const m2 = bf(); let best = null;
        for (const [k, c] of m2) {
          const [x, y] = k.split(",").map(Number); if (!gut(x, y)) continue;
          const dmin = Math.min(...gegner().map((g) => abstand(g, { x, y })));
          const wert = (c === "schritt" ? 1 : c * 0.1) - Math.min(dmin, 4) * 0.5;
          if (!best || wert < best.wert) best = { x, y, wert };
        }
        const bleiben = nebenGegner(f.x, f.y) && nahAngriff && f.tp < f.tpMax * 0.5 && !f.z.rueckzug;
        if (best && !bleiben && !(nebenGegner(f.x, f.y) && istFig(f, "wildnislaeufer"))) bewegen(st, best.x, best.y);
        else if (!best && !nebenGegner(f.x, f.y)) {
          let näher = null; for (const [k, c] of m2) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = Math.min(...gegner().map((g) => abstand(g, { x, y }))); if (d >= 2 && (!näher || d < näher.d)) näher = { x, y, d }; }
          if (näher) bewegen(st, näher.x, näher.y);
        }
      }
    }
    if (st.ende || f.tp <= 0) { if (!st.ende) zugEnde(st); return; }
    // 3. Bonusaktionen vor dem Angriff
    ziel = gegner().filter((g) => abstand(f, g) <= 1).sort((a, b) => a.tp - b.tp)[0] || zielWahl();
    if (ziel) {
      if (kann("jaegermal")) versuche(st, "jaegermal", ziel);
      else if (kann("brandmal") && (f.genutzt.brandmal_frei || 0) < 1) versuche(st, "brandmal", ziel);
      if (kann("analyse")) versuche(st, "analyse", ziel);
      if (kann("finte") && abstand(f, ziel) <= 1 && ziel.tp > 6) versuche(st, "finte");
      if (kann("gift") && ziel.tp > 5) versuche(st, "gift");
      if (kann("trick") && abstand(f, ziel) <= 1 && ziel.tp > 6) versuche(st, "trick", ziel);
      if (kann("spott") && gegner().some((g) => abstand(g, f) <= 2 && g.tp > 6)) { const s = gegner().filter((g) => abstand(g, f) <= 6 && sicht(st, f, g)).sort((a, b) => abstand(a, f) - abstand(b, f))[0]; if (s) handeln(st, "spott", s.id); }
      if (kann("wolf_befehl") || kann("wolf_umreissen")) { const id = kann("wolf_umreissen") && ziel.tp > 8 ? "wolf_umreissen" : "wolf_befehl"; versuche(st, id, ziel); }
      if (kann("schild_glaube")) { const fr = ziele(st, "schild_glaube").sort((a, b) => b.rk - a.rk)[0]; if (fr && gegner().some((g) => abstand(g, fr) <= 3)) handeln(st, "schild_glaube", fr.id); }
    }
    // 4. Aktion: am Boden liegende Freunde zuerst
    const amBoden = freundeAmBoden();
    // (Automatik: dieselbe Figur höchstens dreimal aufrichten, sonst kann ein Kampf endlos kreisen)
    if (amBoden.length) { if (!versuche(st, "lebenshauch", amBoden.find((o) => abstand(o, f) <= 6))) { const k = amBoden.find((o) => abstand(o, f) <= 1 && (o.aufgerichtet || 0) < 3); if (k) versuche(st, "stabilisieren", k); } }
    for (let runde = 0; runde < 2 && !st.ende; runde++) {
      if (st.zug.aktion) {
        const b = besteAktion(st, f, "aktion");
        if (b) handeln(st, b.a.id, b.z.id);
        else if (nah && !zielGemacht && !ausgangGemacht && !gegner().some((g) => abstand(g, f) <= 1) && kann("spurt_aktion")) {
          handeln(st, "spurt_aktion", f.id);
          const m3 = bf(); let best = null;
          for (const [k, c] of m3) { if (c === "schritt") continue; const [x, y] = k.split(",").map(Number); const d = Math.min(...gegner().map((g) => abstand(g, { x, y }))); if (!best || d < best.d) best = { x, y, d }; }
          if (best && !(best.x === f.x && best.y === f.y)) bewegen(st, best.x, best.y);
        }
      }
      if (!st.zug.aktion && kann("tatendrang") && gegner().some((g) => abstand(g, f) <= 1)) handeln(st, "tatendrang", f.id); else break;
    }
    if (st.ende) return;
    // 5. Bonusaktionen danach
    if (kann("zweiter_dolch")) { const z = ziele(st, "zweiter_dolch").sort((a, b) => a.tp - b.tp)[0]; if (z) handeln(st, "zweiter_dolch", z.id); }
    if (kann("wolf_befehl")) { const z = ziele(st, "wolf_befehl").sort((a, b) => a.tp - b.tp)[0]; if (z) handeln(st, "wolf_befehl", z.id); }
    if (f.tp < f.tpMax * 0.5) { if (!versuche(st, "zweiter_atem") && !versuche(st, "heiltrank")) versuche(st, "grosser_trank"); }
    for (const id of ["heilendes_wort", "massenheilwort"]) { const zs = kann(id) ? ziele(st, id) : []; const z = zs.find((o) => o.tp <= 0 || o.tp < o.tpMax * 0.4); if (z) handeln(st, id, z.id); }
    if (kann("aus_dem_schatten")) versuche(st, "aus_dem_schatten"); else if (kann("verstecken")) versuche(st, "verstecken");
    // 6. Fernkämpfer: nach dem Schuss leichtfüßig weg
    if (!nah && !ausgangGemacht && lebt(f) && nebenGegner(f.x, f.y) && (st.zug.leicht > 0 || f.z.rueckzug)) {
      const m4 = bf(); let best = null;
      for (const [k, c] of m4) { if (c === "schritt" || c > Math.max(st.zug.leicht, f.z.rueckzug ? 99 : 0)) continue; const [x, y] = k.split(",").map(Number); if (!nebenGegner(x, y) && (!best || c < best.c)) best = { x, y, c }; }
      if (best) bewegen(st, best.x, best.y);
    }
    if (!st.ende) zugEnde(st);
  }

  /* ---------- Hilfen für die Oberfläche: Trefferchance, Vorschlag ---------- */
  /**
   * Wie wahrscheinlich gelingt eine Aktion gegen ein Ziel?
   * Rückgabe { p (0–1), art: "treffer" | "rettung" | "sicher" | null, text }
   */
  function chance(st, aktionId, zielId) {
    const f = aktiv(st), h = findeAktion(f, aktionId), z = fig(st, zielId);
    if (!h || !z) return { p: null, art: null, text: "" };
    const a = h.a, klemm = (x) => Math.max(0.05, Math.min(0.95, x));
    if (a.art === "angriff") {
      const bonus = mod(f.werte[a.attr]) + UEBUNG + (a.bogen && istFig(f, "wildnislaeufer") ? 1 : 0);
      const spec = { fern: Boolean(a.fern) || (a.wurfwaffe && abstand(f, z) > 1), ruecksichtslos: a.ruecksichtslos };
      const v = vorteil(st, f, z, spec).v, rk = rkEff(st, z, f, spec);
      let p = klemm((21 - (rk - bonus)) / 20);
      if (v > 0) p = 1 - (1 - p) ** 2; else if (v < 0) p = p * p;
      return { p, art: "treffer", text: `${Math.round(p * 100)} % Treffer${v > 0 ? " (Vorteil)" : v < 0 ? " (Nachteil)" : ""}` };
    }
    if (a.art === "geschoss") return { p: 1, art: "sicher", text: "trifft sicher" };
    if (a.rettung && a.attr) {
      const p = klemm((SG(f, a.attr) - 1 - mod(z.werte[a.rettung])) / 20);
      return { p, art: "rettung", text: `${Math.round(p * 100)} % wirkt` };
    }
    return { p: null, art: null, text: "" };
  }
  /** Ein sinnvoller nächster Schritt für die aktive Figur (für den Tipp-Knopf) */
  function vorschlag(st) {
    const f = aktiv(st); if (!f || f.seite !== "spieler" || st.ende || f.tp <= 0) return null;
    const b = st.zug.aktion ? besteAktion(st, f, "aktion") : null, bo = st.zug.bonus ? besteAktion(st, f, "bonus") : null;
    const wahl = b || bo;
    if (!wahl) {
      const angr = aktionenVon(f, st).filter((x) => x.art === "angriff" || x.art === "rettungswurf");
      const reich = Math.max(1, ...angr.map((x) => x.reichweite || 1));
      const gegner = gegnerFiguren(st).filter(lebt);
      if ((st.zug.bewegung > 0 || st.zug.schritt > 0) && gegner.length && st.zug.aktion) {
        let best = null;
        for (const [k, c] of bewegungsfelder(st, f)) {
          const [x, y] = k.split(",").map(Number), p = { x, y };
          const erreicht = gegner.some((g) => abstand(p, g) <= reich && (reich === 1 || sicht(st, p, g)));
          const neben = gegner.some((g) => abstand(p, g) <= 1);
          const d = Math.min(...gegner.map((g) => abstand(p, g)));
          const wert = (erreicht ? 0 : 100 + d) + (reich > 1 && neben ? 50 : 0) + (c === "schritt" ? 1 : c * 0.1);
          if (!best || wert < best.wert) best = { x, y, wert, erreicht };
        }
        if (best && !(best.x === f.x && best.y === f.y)) return { feld: { x: best.x, y: best.y }, text: best.erreicht ? "Vorschlag: Zieh auf das markierte Feld. Von dort erreichst du einen Gegner." : "Vorschlag: Zieh auf das markierte Feld, näher an die Gegner heran." };
      }
      return { text: "Hier gibt es gerade nichts Sinnvolles mehr zu tun. Beende den Zug." };
    }
    const c = chance(st, wahl.a.id, wahl.z.id);
    return { aktion: wahl.a.id, ziel: wahl.z.id, text: `Vorschlag: ${wahl.a.name}${wahl.z !== f ? " auf " + wahl.z.name : ""}${c.text ? " (" + c.text + ")" : ""}.` };
  }

  /* ---------- Zwischen Kämpfen: Zustand mitnehmen, rasten ---------- */
  /** Zustand der Spielerfiguren nach einem Kampf (am Boden in Normal: halbe TP) */
  function nachKampf(st) {
    const out = {};
    for (const f of spielerFiguren(st)) {
      const max = FD.tpVon(f.fid, f.stufe), amBoden = !f.tot && f.tp <= 0 && st.schwierigkeit !== "hardcore";
      out[f.fid] = { stufe: f.stufe, tp: f.tot ? 0 : amBoden ? Math.ceil(max / 2) : Math.max(1, Math.min(f.tp, max)), tot: Boolean(f.tot), plaetze: f.plaetze.slice(), genutzt: Object.assign({}, f.genutzt), rucksack: JSON.parse(JSON.stringify(f.rucksack)) };
    }
    return out;
  }
  /** Kurze Rast: halbe fehlende TP, „je Rast“ und „je Kampf“ kommen zurück */
  function kurzeRast(zust) {
    for (const fid of Object.keys(zust)) {
      const z = zust[fid]; if (z.tot) continue;
      const max = FD.tpVon(fid, z.stufe || 1);
      z.tp = Math.min(max, z.tp + Math.floor((max - z.tp) / 2));
      for (const a of FD.faehigVon(fid, 3)) if (a.pro && (a.pro.rast != null || a.pro.kampf != null)) delete z.genutzt[a.id];
      delete z.genutzt.glueckspilz; delete z.genutzt.gedankenstuetze; delete z.genutzt.erlegen; delete z.genutzt.brandmal_frei;
      if (z.genutzt.raserei) z.genutzt.raserei--;
    }
    return zust;
  }
  /** Zwischen zwei Kämpfen ohne Rast: nur „je Kampf“ kommt zurück */
  function neuerKampf(zust) {
    for (const fid of Object.keys(zust)) { const z = zust[fid]; for (const a of FD.faehigVon(fid, 3)) if (a.pro && a.pro.kampf != null) delete z.genutzt[a.id]; delete z.genutzt.glueckspilz; delete z.genutzt.erlegen; delete z.genutzt.brandmal_frei; }
    return zust;
  }

  /* ---------- Speichern und öffentliche Ansicht ---------- */
  function speichern(st) {
    const o = Object.assign({}, st); delete o.r;
    o.karte = { name: st.karte.name, b: st.karte.b, h: st.karte.h, hindernisse: st.karte.hindernisse, start: st.karte.start };
    return JSON.parse(JSON.stringify(o));
  }
  function laden(o) {
    const st = JSON.parse(JSON.stringify(o));
    st.karte.block = new Set(st.karte.hindernisse.map(([, x, y]) => key(x, y)));
    st.karte.offen = new Set(st.karte.hindernisse.filter(([t]) => t === "P" || t === "Q" || t === "L").map(([, x, y]) => key(x, y)));
    st.zonen = st.zonen || []; st.brand = st.brand || [];
    return zufall(st);
  }
  /** Was Handys sehen: Figuren, Zug, Möglichkeiten der aktiven Figur, letzte Einträge */
  function ansicht(st, nLog = 8) {
    const f = aktiv(st), optionen = [];
    if (!st.ende && f.seite === "spieler" && f.tp > 0) {
      for (const a of aktionenVon(f, st)) {
        const g = grund(st, a.id);
        optionen.push({ id: a.id, name: a.name, ok: !g, grund: g, rest: rest(f, a) === Infinity ? null : rest(f, a), ziele: g ? [] : ziele(st, a.id).map((z) => ({ id: z.id, name: z.name, tp: z.tp, tpMax: z.tpMax, seite: z.seite, chance: chance(st, a.id, z.id).text })) });
      }
    }
    return {
      runde: st.runde, ende: st.ende, aktiv: f.id, zug: st.zug, reihe: st.reihe, schwierigkeit: st.schwierigkeit, stufe: st.stufe,
      figuren: st.figuren.map((o) => ({ id: o.id, seite: o.seite, fid: o.fid || null, art: o.art || null, besitzer: o.besitzer || null, klasse: o.klasse || null, name: o.name, titel: o.titel || null, stufe: o.stufe || null,
        tp: o.tp, tpMax: o.tpMax, rk: o.rk, plaetze: o.plaetze || null, plaetzeMax: o.plaetzeMax || null, genutzt: o.genutzt, rucksack: o.rucksack || [], zustaende: zustaende(st, o), tot: Boolean(o.tot), stabil: Boolean(o.stabil), todes: o.todes || null })),
      optionen, log: st.log.slice(-nLog), nLog: st.log.length,
    };
  }

  const API = { begleiterVon, begleiterPhase, GEGNER_TP, TIERE, GEGENSTAENDE, hatDing, bewegungVon, chance, vorschlag, BEGEGNUNGEN, SKALA, SKALA_HARDCORE, gegnerFuer, nachKampf, kurzeRast, neuerKampf, rng, roll, parse, mittel, mod, SG, DINGE, TRANK, STABIL, SPURT, GEGNER, KARTE_GARTEN, FD, zufall, speichern, laden, ansicht, trankZahl,
    neuesSpiel, aktiv, fig, wolfVon, lebt, erreichbar, bewegungsfelder, sicht, deckung, abstand, bewegen, ziele, grund, verfuegbar, handeln, zugEnde, gegnerZug, autoZug,
    zielNeben, gefahrFelder, ZIEL_A, schaden, findeAktion, grenze, aktionenVon, faehigkeiten, flaecheZiele, rest, rkEff, vorteil, zustaende, key, spielerFiguren, gegnerFiguren };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABR = API;
})(typeof window !== "undefined" ? window : globalThis);
