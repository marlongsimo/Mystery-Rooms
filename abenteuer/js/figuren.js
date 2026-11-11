/*
 * Case Unlocked · Abenteuer – die 15 Charaktere (Daten, ohne Regeln)
 * Werte, Fähigkeiten und Texte wie in CHARAKTERE.md; abgestimmt mit tools/balance.js.
 * Fähigkeiten: typ aktion | bonus | reaktion | passiv | frei, ab = ab welcher Stufe,
 * pro = { kampf | rast | lange: Anzahl } oder platz = Grad (1 oder 2). Die Wirkung steckt in regeln.js (art + Parameter).
 */
(function (root) {
  "use strict";
  const KLASSEN = {
    krieger: { bewegung: 3, tpJeStufe: 3, waffenMod: -1, festnageln: 1, merkmal: "Festnageln: Ein Waffentreffer verlangsamt den Gegner in seinem nächsten Zug (halbe Bewegung).", name: "Krieger", farbe: "#a8322a", wuerfel: 10, rettung: ["STR", "KON"], zeichen: "schild" },
    zauberer: { bewegung: 4, arkanSchild: 5, merkmal: "Arkaner Schild: Einmal je Kampf wendet ein Schild einen Treffer ab (+5 RK gegen diesen Angriff, automatisch).", name: "Zauberer", farbe: "#2f5fa8", wuerfel: 8, rettung: ["INT", "WEI"], zeichen: "buch", plaetze: true },
    schurke: { bewegung: 5, waffenExtra: "1W4", nachbluten: "1W4", merkmal: "Nachbluten: Ein Waffentreffer lässt den Gegner 3 Runden lang bluten (1W4 zu Beginn seines Zugs).", name: "Schurke", farbe: "#6b3fa0", wuerfel: 8, rettung: ["GES", "INT"], zeichen: "dolche" },
    kleriker: { bewegung: 4, beistand: 1, merkmal: "Beistand: Verbündete direkt neben dir bekommen +1 auf Rettungswürfe.", name: "Kleriker", farbe: "#c9a24a", wuerfel: 8, rettung: ["WEI", "CHA"], zeichen: "sonne", plaetze: true },
    waldlaeufer: { bewegung: 5, waffenExtra: "1W4", durchbrechen: 2, merkmal: "Durchbrechen: Ein Waffentreffer reißt die Rüstung auf, das Ziel hat 3 Runden lang −2 RK gegen alle.", name: "Waldläufer", farbe: "#3f7a3a", wuerfel: 10, rettung: ["STR", "GES"], zeichen: "pfote" },
  };
  /** Zauberplätze je Stufe: [Grad 1, Grad 2] */
  const PLAETZE = { 1: [3, 0], 2: [4, 0], 3: [3, 2] };

  // Klassenmerkmale (werden jeder Figur der Klasse hinzugefügt)
  const KLASSE_FAEHIG = {
    krieger: [
      { id: "zweiter_atem", name: "Zweiter Atem", typ: "bonus", ab: 1, art: "selbstheilung", heilung: "1W10", plusStufe: true, pro: { rast: 1 }, text: "Heilt dich um 1W10 + Stufe." },
      { id: "tatendrang", name: "Tatendrang", typ: "frei", ab: 2, art: "tatendrang", pro: { lange: 1 }, text: "Eine zusätzliche Aktion in diesem Zug, einmal je lange Rast." },
    ],
    zauberer: [
      { id: "arkaner_schutz", name: "Arkaner Schutz und Arkane Wucht", typ: "passiv", ab: 1, text: "RK 11 + GES ohne Rüstung. Deine Zaubertricks machen + INT Schaden." },
    ],
    schurke: [
      { id: "hinterhalt", name: "Hinterhalt", typ: "passiv", ab: 1, text: "Einmal je Zug +1W6 (ab Stufe 2 +2W6), wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht." },
      { id: "spurt", name: "Gerissener Spurt", typ: "bonus", ab: 2, art: "spurt", gerissen: true, text: "Gerissene Aktion: noch einmal so weit laufen, wie du ohnehin kannst." },
      { id: "verstecken", name: "Verstecken", typ: "bonus", ab: 2, art: "verstecken", gerissen: true, text: "Gerissene Aktion: Neben Deckung oder im Rauch verbirgst du dich. Dein nächster Angriff hat Vorteil, Gegner greifen lieber andere an." },
      { id: "rueckzug", name: "Rückzug", typ: "bonus", ab: 2, art: "rueckzug", gerissen: true, text: "Gerissene Aktion: Diesen Zug keine Gelegenheitsangriffe gegen dich." },
    ],
    kleriker: [
      { id: "heilendes_wort", name: "Heilendes Wort", typ: "bonus", ab: 1, art: "heilung", reichweite: 6, heilung: "1W4", plusAttr: "WEI", platz: 1, text: "Heilt eine Figur in 6 Feldern um 1W4 + WEI, auch am Boden." },
    ],
    waldlaeufer: [
      { id: "jaegermal", name: "Jägermal", typ: "bonus", ab: 1, art: "mal", mal: "jaeger", reichweite: 20, pro: { lange: [2, 3, 3] }, text: "Markiert einen Gegner bis Kampfende: +1W6 Schaden bei jedem deiner Treffer. Fällt das Ziel, kannst du das Mal ohne Einsatz weitergeben." },
      { id: "faehrtenleser", name: "Fährtenleser", typ: "passiv", ab: 1, text: "Vorteil auf Spuren und Wahrnehmung im Freien." },
    ],
  };

  const FIGUREN = {
    /* ============ Krieger ============ */
    schildwaechter: {
      name: "Torvald", titel: "Der Schildwächter", klasse: "krieger", rolle: "vorn, beschützt", spruch: "Niemand fällt, solange ich stehe.",
      werte: { STR: 16, KON: 14, WEI: 13, CHA: 12, GES: 10, INT: 8 }, rk: [18, 18, 18], ruestung: "Kettenpanzer und Schild", metall: true,
      faehig: [
        { id: "langschwert", name: "Langschwert", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "STR", schaden: "1W8", text: "Nahkampf." },
        { id: "schutzhaltung", name: "Schutzhaltung", typ: "passiv", ab: 1, text: "Reaktion, automatisch: Ein Angriff gegen einen Verbündeten neben dir erfolgt mit Nachteil (ab Stufe 3 zweimal je Runde)." },
        { id: "spott", name: "Spott", typ: "bonus", ab: 1, art: "spott", reichweite: 6, pro: { rast: 2 }, text: "Ein Gegner hat bis zu seinem nächsten Zug Nachteil gegen alle außer dir." },
        { id: "schildstoss", name: "Schildstoß", typ: "aktion", ab: 1, art: "stoss", reichweite: 1, rettung: "STR", attr: "STR", pro: { kampf: 1 }, wucht: true, text: "STR-Rettungswurf, sonst wird das Ziel 1 Feld weggestoßen und liegt." },
        { id: "bollwerk", name: "Bollwerk", typ: "passiv", ab: 3, text: "Schutzhaltung zweimal je Runde." },
      ],
      aussen: { name: "Stemmen", text: "Vorteil auf Stärke für Türen, Gitter, Trümmer; zieht Verbündete über Abgründe." },
      versuchung: "„Du kannst jeden beschützen, den du je verloren hast. Ich gebe sie dir zurück.“ Wahr, aber sie kehren als Schatten zurück, die nur leben, solange das Siegel offen ist.",
      moment: "Der Schacht: Er kann Tam halten, während die anderen kämpfen.",
    },
    berserker: {
      name: "Ragnar", titel: "Der Berserker", klasse: "krieger", rolle: "vorn, hoher Schaden", spruch: "Je mehr es wehtut, desto klarer sehe ich.",
      werte: { STR: 16, KON: 14, GES: 13, WEI: 12, CHA: 10, INT: 8 }, rk: [12, 12, 12], ruestung: "Fell", metall: false,
      faehig: [
        { id: "grossaxt", name: "Großaxt", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "STR", schaden: "1W12", text: "Nahkampf." },
        { id: "grossaxt_r", name: "Großaxt, rücksichtslos", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "STR", schaden: "1W12", ruecksichtslos: true, text: "Vorteil auf deinen Angriff, aber Angriffe gegen dich haben Vorteil bis zu deinem nächsten Zug." },
        { id: "blutrausch", name: "Blutrausch", typ: "passiv", ab: 1, text: "Unter halben TP: +1 Schaden und Vorteil auf Stärke-Proben." },
        { id: "raserei", name: "Raserei", typ: "bonus", ab: 1, art: "raserei", pro: { rast: 1 }, text: "Bis Kampfende: Waffenschaden gegen dich halbiert, +1 Schaden. Heilung wirkt nur halb." },
        { id: "unbaendig", name: "Unbändig", typ: "passiv", ab: 3, text: "Blutrausch gibt +2 statt +1 Schaden." },
      ],
      aussen: { name: "Einschüchtern", text: "Vorteil auf Drohungen; im Glockenturm ersetzt er die Charisma-Probe." },
      versuchung: "„Du wirst nie wieder Angst haben.“ Wahr: Er fühlt danach gar nichts mehr.",
      moment: "Coldric: Hält er ihm eine Runde allein stand, nimmt Coldric den Namen leichter an.",
    },
    duellant: {
      name: "Isolde", titel: "Die Duellantin", klasse: "krieger", rolle: "vorn, Einzelkampf", spruch: "Ein Fehler. Mehr brauche ich nicht.",
      werte: { GES: 16, KON: 14, CHA: 13, WEI: 12, STR: 10, INT: 8 }, rk: [15, 15, 15], ruestung: "beschlagenes Leder", metall: false,
      faehig: [
        { id: "rapier", name: "Rapier", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "GES", schaden: "1W8", text: "Nahkampf." },
        { id: "parade", name: "Parade", typ: "passiv", ab: 1, text: "Reaktion, automatisch: Verfehlt dich ein Nahangriff, greifst du sofort an." },
        { id: "finte", name: "Finte", typ: "bonus", ab: 1, art: "finte", pro: { rast: 2 }, text: "Dein nächster Angriff hat Vorteil und macht +1W6." },
        { id: "entwaffnen", name: "Entwaffnen", typ: "aktion", ab: 1, art: "entwaffnen", reichweite: 1, rettung: "STR", attr: "GES", pro: { kampf: 1 }, text: "STR-Rettungswurf, sonst macht das Ziel 2 Runden nur halben Schaden." },
        { id: "klingenmeister", name: "Klingenmeisterin", typ: "passiv", ab: 3, text: "Kritischer Treffer schon bei 19–20." },
      ],
      aussen: { name: "Ehrenkodex", text: "Vorteil bei Gesprächen mit Rittern und Kriegern, erkennt Kampfstile." },
      versuchung: "„Ich zeige dir den einen Gegner, den du nie besiegt hast, und lasse dich gewinnen.“ Wahr, aber der Sieg ersetzt alle anderen Erinnerungen.",
      moment: "Coldric: Sie kann ihn zum Ehrenduell fordern.",
    },

    /* ============ Zauberer ============ */
    gelehrter: {
      name: "Lyra", titel: "Die Gelehrte", klasse: "zauberer", rolle: "hinten, Schwächen aufdecken, schützen", spruch: "Alles hat eine Ordnung. Auch das hier.",
      werte: { INT: 16, GES: 14, KON: 13, WEI: 12, CHA: 10, STR: 8 }, rk: [13, 13, 13], ruestung: "Arkaner Schutz",
      faehig: [
        { id: "funke", name: "Arkaner Funke", typ: "aktion", ab: 1, art: "angriff", reichweite: 12, attr: "INT", schaden: "1W10", plusAttr: true, fern: true, magisch: true, text: "Zaubertrick." },
        { id: "analyse", name: "Analyse", typ: "bonus", ab: 1, art: "analyse", reichweite: 12, text: "Der nächste Angriff gegen den Gegner (bis Rundenende) trifft gegen −2 RK; seine Werte sind für alle sichtbar." },
        { id: "schutzglyphe", name: "Schutzglyphe", typ: "passiv", ab: 1, platzReaktion: 1, text: "Reaktion, automatisch, kostet einen Platz: +5 RK für einen Verbündeten in 6 Feldern gegen einen Treffer, wenn es ihn sonst schwer erwischt." },
        { id: "zeitriss", name: "Zeitriss", typ: "aktion", ab: 1, art: "kontrolle", zustand: "zeitriss", dauer: 2, reichweite: 12, rettung: "WEI", attr: "INT", platz: 1, text: "WEI-Rettungswurf, sonst 2 Runden verlangsamt, ohne Bonusaktion und −2 RK." },
        { id: "gedankenstuetze", name: "Gedankenstütze", typ: "passiv", ab: 2, pro: { rast: 2 }, text: "Automatisch, 2× je Rast: Ein Verbündeter wiederholt einen knapp misslungenen W20." },
        { id: "bannkreis", name: "Bannkreis", typ: "aktion", ab: 3, art: "bannkreis", reichweite: 12, radius: 2, dauer: 3, platz: 2, text: "Kreis mit 2 Feldern Radius um ein Ziel, 3 Runden: Gegner darin −2 RK." },
      ],
      aussen: { name: "Alte Schriften", text: "Liest jede Schrift der Abtei, zusätzlicher Hinweis bei Rätseln." },
      versuchung: "„Ich gebe dir Wissen, das niemand sonst besitzen darf.“ Wahr, aber man kann es nie wieder vergessen und nie jemandem sagen.",
      moment: "Bibliothek: Sie liest Anselms Tagebuch ohne Probe vollständig.",
    },
    elementarist: {
      name: "Vaelin", titel: "Der Elementarist", klasse: "zauberer", rolle: "hinten, Flächenschaden", spruch: "Feuer fragt nicht.",
      werte: { INT: 16, GES: 14, KON: 13, WEI: 12, CHA: 10, STR: 8 }, rk: [13, 13, 13], ruestung: "Arkaner Schutz",
      faehig: [
        { id: "glutpfeil", name: "Glutpfeil", typ: "aktion", ab: 1, art: "angriff", reichweite: 12, attr: "INT", schaden: "1W10", plusAttr: true, fern: true, magisch: true, brennt: true, text: "Zaubertrick. Das Feld des Ziels brennt 1 Runde (1W4)." },
        { id: "zauberformung", name: "Zauberformung", typ: "passiv", ab: 1, text: "Deine Flächenzauber treffen keine Verbündeten." },
        { id: "nachhall", name: "Elementarer Nachhall", typ: "passiv", ab: 2, text: "Glutpfeil macht +1W6." },
        { id: "frosthauch", name: "Frosthauch", typ: "aktion", ab: 1, art: "flaeche", form: "kreis", groesse: 1, reichweite: 12, schaden: "2W6", rettung: "KON", attr: "INT", halb: true, zustand: "verlangsamt", dauer: 1, platz: 1, text: "Eiswolke um ein Ziel (1 Feld Radius), 2W6 Kälte, Rettung halbiert; wer verfehlt, ist verlangsamt." },
        { id: "geschoss", name: "Magisches Geschoss", typ: "aktion", ab: 1, art: "geschoss", reichweite: 12, schaden: "1W4", plus: 1, anzahl: 3, platz: 1, text: "Drei Pfeile, je 1W4 + 1, treffen immer." },
        { id: "donnerwelle", name: "Donnerwelle", typ: "aktion", ab: 2, art: "flaeche", form: "kreis", groesse: 1, reichweite: 6, schaden: "2W8", rettung: "KON", attr: "INT", halb: true, stoss: 2, platz: 1, text: "Donnerschlag um ein Ziel in 6 Feldern (1 Feld Radius), 2W8, Rettung halbiert, wer verfehlt, wird 2 Felder weggestoßen." },
        { id: "glutsphaere", name: "Glutsphäre", typ: "aktion", ab: 3, art: "flaeche", form: "kreis", groesse: 2, reichweite: 12, schaden: "3W6", rettung: "GES", attr: "INT", halb: true, platz: 2, text: "3W6 Feuer in 2 Feldern Radius um ein Ziel, Rettung halbiert." },
      ],
      aussen: { name: "Elementarsinn", text: "Spürt Hitze, Kälte und Luftzug: findet Geheimgänge, entzündet und löscht Feuer." },
      versuchung: "„Ich gebe dir das Feuer, das nie erlischt.“ Wahr, aber es brennt in dir weiter.",
      moment: "Halle der Asche: Er kann die Glut im Boden löschen.",
    },
    schattenmagier: {
      name: "Morwen", titel: "Die Schattenmagierin", klasse: "zauberer", rolle: "hinten, Kontrolle", spruch: "Was du siehst, entscheide ich.",
      werte: { INT: 16, GES: 14, KON: 13, CHA: 12, WEI: 10, STR: 8 }, rk: [14, 14, 14], ruestung: "Arkaner Schutz und Schattenmantel",
      faehig: [
        { id: "schattenstich", name: "Schattenstich", typ: "aktion", ab: 1, art: "rettungswurf", reichweite: 12, rettung: "WEI", attr: "INT", schaden: "1W10", plusAttr: true, zustand: "stich", dauer: 1, text: "Zaubertrick. WEI-Rettungswurf, sonst Schaden und Nachteil auf den nächsten Angriff des Ziels." },
        { id: "trugbild", name: "Trugbild", typ: "passiv", ab: 1, text: "Der erste Angriff gegen dich in jeder Runde erfolgt mit Nachteil." },
        { id: "furcht", name: "Furcht", typ: "aktion", ab: 1, art: "kontrolle", zustand: "veraengstigt", dauer: 2, radius: 1, reichweite: 12, rettung: "WEI", attr: "INT", platz: 1, text: "Das Ziel und alle Gegner direkt daneben: WEI-Rettungswurf, sonst 2 Runden verängstigt." },
        { id: "fesseln", name: "Schattenfesseln", typ: "aktion", ab: 1, art: "kontrolle", zustand: "festgehalten", dauer: 2, reichweite: 12, rettung: "STR", attr: "INT", platz: 1, text: "STR-Rettungswurf, sonst 2 Runden festgehalten." },
        { id: "schattenschritt", name: "Schattenschritt", typ: "bonus", ab: 2, art: "schattenschritt", pro: { rast: 2 }, text: "Bis zu 6 Felder durch Schatten, über Hindernisse hinweg und ohne Gelegenheitsangriffe." },
        { id: "spiegelbilder", name: "Spiegelbilder", typ: "aktion", ab: 2, art: "spiegelbilder", platz: 1, text: "3 Bilder: Jeder Angriff trifft zu 50 % ein Bild statt dich." },
        { id: "albtraum", name: "Albtraum", typ: "aktion", ab: 3, art: "albtraum", reichweite: 12, radius: 1, rettung: "WEI", attr: "INT", schaden: "2W8", platz: 2, text: "Das Ziel und alle Gegner direkt daneben: WEI-Rettungswurf; bei Fehlschlag 2W8 und 1 Runde verängstigt, sonst 1W8." },
      ],
      aussen: { name: "Blendwerk", text: "Erzeugt Geräusche und Trugbilder als Ablenkung, erkennt Illusionen." },
      versuchung: "„Niemand wird je wieder sehen, wer du wirklich bist.“ Wahr, auch nicht die, die dich lieben.",
      moment: "Das Flüstern: Sie sieht, wer ein Angebot des Abts bekommen hat.",
    },

    /* ============ Schurken ============ */
    schattenlaeufer: {
      name: "Darian", titel: "Der Schattenläufer", klasse: "schurke", rolle: "Mitte, Fallen, Bewegung", spruch: "Ich war nie hier.",
      werte: { GES: 16, KON: 14, INT: 13, WEI: 12, CHA: 10, STR: 8 }, rk: [15, 15, 15], ruestung: "Leder",
      gerissenAb: 1,
      faehig: [
        { id: "kurzschwert", name: "Kurzschwert", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "GES", schaden: "1W6", text: "Nahkampf." },
        { id: "kurzbogen", name: "Kurzbogen", typ: "aktion", ab: 1, art: "angriff", reichweite: 16, attr: "GES", schaden: "1W6", fern: true, text: "Fernkampf." },
        { id: "leiser_schritt", name: "Leiser Schritt", typ: "passiv", ab: 1, text: "Du kannst dich auch ohne Deckung verstecken, solange kein Gegner neben dir steht. Gerissene Aktion schon ab Stufe 1." },
        { id: "rauchbombe", name: "Rauchbombe", typ: "aktion", ab: 1, art: "rauch", radius: 2, dauer: 2, pro: { rast: 1 }, text: "2 Felder Radius um dich, 2 Runden: Niemand sieht hinein oder hinaus." },
        { id: "schattenwirbel", name: "Schattenwirbel", typ: "aktion", ab: 1, art: "flaeche", form: "kreis", groesse: 1, reichweite: 1, schaden: "2W6", rettung: "GES", attr: "GES", halb: true, pro: { rast: 2 }, text: "Wirbel mit beiden Klingen um einen Gegner neben dir: er und alle direkt um ihn nehmen 2W6, GES-Rettung halbiert. Verbündete bleiben verschont. Zählt nicht als Waffentreffer (kein Nachbluten). Zweimal je Rast." },
        { id: "kletterer", name: "Kletterer", typ: "passiv", ab: 2, text: "Wände und Schächte ohne Probe." },
        { id: "schattenstoss", name: "Schattenstoß", typ: "passiv", ab: 2, text: "Greifst du aus dem Versteck an, machst du 1W6 mehr Schaden und triffst schon bei 19 kritisch." },
        { id: "fallensteller", name: "Fallensteller", typ: "passiv", ab: 3, text: "Vor einem Kampf, den die Gruppe kommen sieht, legt er eine Falle." },
      ],
      aussen: { name: "Fallen und Schlösser", text: "Entdeckt und entschärft Fallen, öffnet Schlösser ohne Schlüssel." },
      versuchung: "„Niemand wird dich jemals wieder finden.“ Wahr, auch nicht, wenn du gefunden werden willst.",
      moment: "Schmugglerpfad: Er findet ohne Nisk den Zugang zum Koboldlager.",
    },
    trickser: {
      name: "Silra", titel: "Die Trickserin", klasse: "schurke", rolle: "Mitte, Ablenkung", spruch: "Schau mal da drüben.",
      werte: { GES: 16, CHA: 14, KON: 13, INT: 12, WEI: 10, STR: 8 }, rk: [14, 14, 14], ruestung: "Leder",
      faehig: [
        { id: "dolch", name: "Dolch", typ: "aktion", ab: 1, art: "angriff", reichweite: 8, attr: "GES", schaden: "1W4", wurfwaffe: true, text: "Nah oder geworfen (8 Felder)." },
        { id: "zweiter_dolch", name: "Zweiter Dolch", typ: "bonus", ab: 1, art: "angriff", reichweite: 8, attr: "GES", schaden: "1W4", ohneMod: true, nachDolch: true, wurfwaffe: true, text: "Nach einem Dolchangriff: ein zweiter Dolch, 1W4." },
        { id: "glueckspilz", name: "Glückspilz", typ: "passiv", ab: 1, pro: { kampf: 1 }, text: "Automatisch, 1× je Kampf: einen knapp verfehlten eigenen Angriff wiederholen oder einen Gegner seinen Treffer gegen dich wiederholen lassen." },
        { id: "trick", name: "Schmutziger Trick", typ: "bonus", ab: 1, art: "kontrolle", zustand: "geblendet", dauer: 1, reichweite: 1, rettung: "GES", attr: "GES", pro: { rast: [2, 2, 3] }, text: "Ein Gegner neben dir: GES-Rettungswurf, sonst 1 Runde geblendet." },
        { id: "platztausch", name: "Platztausch", typ: "bonus", ab: 1, art: "tausch", reichweite: 6, pro: { rast: 1 }, text: "Tausche den Platz mit einem Verbündeten in 6 Feldern." },
      ],
      aussen: { name: "Täuschen", text: "Vorteil auf Lügen, Verkleiden, Taschendiebstahl." },
      versuchung: "„Ich mache, dass dir jeder glaubt.“ Wahr, du wirst nie wieder wissen, ob jemand dich mag oder nur glaubt.",
      moment: "Glockenturm: Sie lässt die Kobolde glauben, der Abt habe die Gruppe geschickt.",
    },
    assassine: {
      name: "Vex", titel: "Der Assassine", klasse: "schurke", rolle: "Mitte, Einzelziel", spruch: "Ein Schnitt. Kein Laut.",
      werte: { GES: 16, INT: 14, KON: 13, WEI: 12, CHA: 10, STR: 8 }, rk: [14, 14, 14], ruestung: "Leder",
      faehig: [
        { id: "klinge", name: "Klinge der Gilde", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "GES", schaden: "1W8", text: "Nahkampf." },
        { id: "armbrust", name: "Leichte Armbrust", typ: "aktion", ab: 1, art: "angriff", reichweite: 16, attr: "GES", schaden: "1W8", fern: true, text: "Fernkampf." },
        { id: "todesstoss", name: "Todesstoß", typ: "passiv", ab: 1, text: "Vorteil gegen Gegner, die im Kampf noch nicht gehandelt haben." },
        { id: "gift", name: "Gift", typ: "bonus", ab: 1, art: "gift", pro: { rast: 2 }, text: "Dein nächster Treffer macht +1W6 Gift (ab Stufe 2 +2W6), das Ziel ist 1 Runde vergiftet." },
        { id: "aus_dem_schatten", name: "Aus dem Schatten", typ: "bonus", ab: 1, art: "verstecken", text: "Neben Deckung oder im Rauch: verstecken." },
        { id: "hinrichtung", name: "Hinrichtung", typ: "passiv", ab: 3, text: "Gegner unter halben TP nehmen +1W6." },
      ],
      aussen: { name: "Lautlos", text: "Schaltet einen ahnungslosen Wächter ohne Kampf aus; verwischt Spuren." },
      versuchung: "„Nenn mir einen Namen. Ich nehme ihn, und niemand wird es je wissen.“ Wahr, und Halmbruck verliert jemanden.",
      moment: "Glockenturm: Er schaltet den Kobold am Glockenseil lautlos aus.",
    },

    /* ============ Kleriker ============ */
    lichtbringer: {
      name: "Elara", titel: "Die Lichtbringerin", klasse: "kleriker", rolle: "vorn/Mitte, gegen Untote", spruch: "Das Licht weicht nicht.",
      werte: { WEI: 16, KON: 14, STR: 13, CHA: 12, INT: 10, GES: 8 }, rk: [18, 18, 18], ruestung: "Kettenpanzer und Schild", metall: true,
      faehig: [
        { id: "heiliges_licht", name: "Heiliges Licht", typ: "aktion", ab: 1, art: "rettungswurf", reichweite: 12, rettung: "GES", attr: "WEI", schaden: "1W8", plusAttr: true, text: "Zaubertrick. GES-Rettungswurf, sonst 1W8 + WEI gleißender Schaden." },
        { id: "streitkolben", name: "Streitkolben", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "STR", schaden: "1W6", wucht: true, text: "Nahkampf." },
        { id: "aura", name: "Strahlende Aura", typ: "passiv", ab: 1, text: "Gegner neben dir nehmen zu Beginn ihres Zugs 1 gleißenden Schaden, Untote 2." },
        { id: "segen", name: "Segen", typ: "aktion", ab: 1, art: "segen", reichweite: 6, platz: 1, dauer: 3, text: "3 Runden lang: 3 Verbündete in 6 Feldern +1W4 auf Angriffe und Rettungswürfe. Nur ein Segen zur Zeit." },
        { id: "vertreiben", name: "Untote vertreiben", typ: "aktion", ab: 2, art: "vertreiben", reichweite: 6, rettung: "WEI", attr: "WEI", pro: { rast: 1 }, text: "Göttliche Macht: Untote in 6 Feldern fliehen 2 Runden (WEI-Rettungswurf)." },
        { id: "schutzkreis", name: "Schutzkreis", typ: "aktion", ab: 3, art: "schutzkreis", dauer: 3, platz: 2, text: "Verbündete in 2 Feldern um dich +2 RK, 3 Runden." },
      ],
      aussen: { name: "Geweihtes Wissen", text: "Erkennt Flüche und Untote; bringt schwache Untote ohne Kampf zur Ruhe." },
      versuchung: "„Ich mache den Tod eines Unschuldigen rückgängig. Wähle.“ Wahr, aber ein anderer Unschuldiger nimmt seinen Platz.",
      moment: "Gruft: Sie kann die Knochenwächter segnen statt zerschlagen.",
    },
    wanderheiler: {
      name: "Brogar", titel: "Der Wanderheiler", klasse: "kleriker", rolle: "Mitte, Heilung, Schutz", spruch: "Erst die Wunde. Dann die Frage.",
      werte: { WEI: 16, KON: 14, GES: 13, INT: 12, CHA: 10, STR: 8 }, rk: [15, 15, 15], ruestung: "Schuppenpanzer", metall: true,
      faehig: [
        { id: "dornenranke", name: "Dornenranke", typ: "aktion", ab: 1, art: "rettungswurf", reichweite: 8, rettung: "GES", attr: "WEI", schaden: "1W8", plusAttr: true, zustand: "verlangsamt", dauer: 1, text: "Zaubertrick. GES-Rettungswurf, sonst Schaden und 1 Runde verlangsamt." },
        { id: "gesegnete_heilung", name: "Gesegnete Heilung", typ: "passiv", ab: 1, text: "Deine Heilzauber heilen zusätzlich 2 + Grad des Platzes." },
        { id: "schild_glaube", name: "Schild des Glaubens", typ: "bonus", ab: 1, art: "schild", reichweite: 6, platz: 1, text: "Ein Verbündeter +2 RK bis Kampfende." },
        { id: "lebenshauch", name: "Lebenshauch", typ: "aktion", ab: 1, art: "aufrichten", reichweite: 6, pro: { kampf: 1 }, text: "Ein Verbündeter am Boden in 6 Feldern steht mit 1 TP auf." },
        { id: "bewahren", name: "Bewahren", typ: "aktion", ab: 2, art: "bewahren", reichweite: 6, pro: { rast: 1 }, text: "Göttliche Macht: 5 × Stufe TP auf Verbündete in 6 Feldern verteilen." },
        { id: "massenheilwort", name: "Massenheilwort", typ: "bonus", ab: 3, art: "massenheil", reichweite: 6, heilung: "1W4", plusAttr: "WEI", platz: 2, text: "3 Verbündete je 1W4 + 3 (+ Gesegnete Heilung)." },
      ],
      aussen: { name: "Kräuterkunde", text: "Erkennt Gifte und Flüche; nach jedem Kampf heilt die Gruppe je 1W4." },
      versuchung: "„Ich zeige dir, wie man jede Wunde schließt.“ Wahr, aber jede geschlossene Wunde öffnet sich bei dir.",
      moment: "Halmbruck: Er sieht sofort, dass Anselm Blut hustet.",
    },
    inquisitor: {
      name: "Seran", titel: "Der Inquisitor", klasse: "kleriker", rolle: "vorn, Flüche, Bann", spruch: "Ich frage nur einmal.",
      werte: { STR: 16, KON: 14, WEI: 14, INT: 10, CHA: 10, GES: 8 }, rk: [18, 18, 18], ruestung: "Kettenpanzer und Schild", metall: true,
      faehig: [
        { id: "kriegshammer", name: "Kriegshammer", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "STR", schaden: "1W8", wucht: true, text: "Nahkampf." },
        { id: "wahrheitsblick", name: "Wahrheitsblick", typ: "passiv", ab: 1, text: "Vorteil, Lügen zu erkennen; sieht Illusionen und Unsichtbares in 2 Feldern." },
        { id: "brandmal", name: "Brandmal", typ: "bonus", ab: 1, art: "mal", mal: "brand", reichweite: 12, platz: 1, freiJeKampf: 1, text: "1× je Kampf ohne Platz: Deine Treffer gegen das Ziel machen +1W4 (ab Stufe 3 +2W6)." },
        { id: "befehl", name: "Befehl: Flieh!", typ: "aktion", ab: 1, art: "kontrolle", zustand: "veraengstigt", dauer: 1, reichweite: 12, rettung: "WEI", attr: "WEI", platz: 1, text: "WEI-Rettungswurf, sonst flieht das Ziel 1 Runde." },
        { id: "bannen", name: "Bannen", typ: "aktion", ab: 2, art: "kontrolle", zustand: "verbannt", dauer: 2, nurUntot: true, reichweite: 12, rettung: "WEI", attr: "WEI", pro: { rast: 1 }, text: "Göttliche Macht: Ein Untoter oder Fluchwesen ist 2 Runden aus dem Kampf verbannt." },
        { id: "gerechter_zorn", name: "Gerechter Zorn", typ: "passiv", ab: 3, text: "Brandmal +2W6." },
      ],
      aussen: { name: "Verhör", text: "Erkennt Flüche, Pakte und Lügen; Vorteil, um Anselm zu durchschauen." },
      versuchung: "„Ich zeige dir jede Lüge, die man dir je erzählt hat.“ Wahr, alle, auch die gnädigen.",
      moment: "Das Flüstern: Er spürt, wer einen Pakt angenommen hat.",
    },

    /* ============ Waldläufer ============ */
    wildnislaeufer: {
      name: "Kael", titel: "Der Wildnisläufer", klasse: "waldlaeufer", rolle: "hinten, Fernkampf, Spuren", spruch: "Ich sehe dich, lange bevor du mich siehst.",
      werte: { GES: 16, WEI: 14, KON: 13, INT: 12, STR: 10, CHA: 8 }, rk: [14, 14, 14], ruestung: "Leder",
      faehig: [
        { id: "langbogen", name: "Langbogen", typ: "aktion", ab: 1, art: "angriff", reichweite: 20, attr: "GES", schaden: "1W8", fern: true, bogen: true, text: "Fernkampf, ab Stufe 2 +1 zum Treffen." },
        { id: "fesselpfeil", name: "Fesselnder Pfeil", typ: "aktion", ab: 1, art: "angriff", reichweite: 20, attr: "GES", schaden: "1W8", fern: true, bogen: true, fesseln: true, pro: { rast: 2 }, text: "Treffer und STR-Rettungswurf, sonst festgehalten (befreit sich mit Glück nach 1 Runde)." },
        { id: "scharfes_auge", name: "Scharfes Auge", typ: "passiv", ab: 1, text: "Ignoriert Deckung." },
        { id: "leichtfuessig", name: "Leichtfüßig", typ: "passiv", ab: 1, text: "Nach einem Schuss bis zu 2 Felder ohne Gelegenheitsangriff." },
        { id: "bogenschuetze", name: "Bogenschütze", typ: "passiv", ab: 2, text: "+1 auf Fernkampf." },
        { id: "doppelschuss", name: "Doppelschuss", typ: "aktion", ab: 3, art: "angriff", reichweite: 20, attr: "GES", schaden: "1W8", fern: true, bogen: true, doppel: true, pro: { rast: 2 }, text: "Zwei Ziele nebeneinander, je ein Angriff." },
      ],
      aussen: { name: "Fährtenleser", text: "Liest Spuren genau, findet sichere Wege." },
      versuchung: "„Du wirst nie wieder jemanden verlieren, den du beschützen willst.“ Wahr, weil du niemanden mehr nah genug heranlässt.",
      moment: "Halmbruck: Er liest an Tams Spuren, dass der Junge im Schlaf ging.",
    },
    tiergefaehrte: {
      name: "Faye", titel: "Die Tiergefährtin", klasse: "waldlaeufer", rolle: "Mitte, mit Wolf", spruch: "Grau geht vor. Ich folge.",
      werte: { GES: 16, WEI: 14, KON: 13, INT: 12, STR: 10, CHA: 8 }, rk: [14, 14, 14], ruestung: "Leder", tpMinus: 2,
      wolf: { name: "Grau", tp: [8, 12, 20], rk: 13, angriff: [4, 4, 5], schaden: "1W6", plus: 2, bewegung: 8 },
      faehig: [
        { id: "kurzschwert", name: "Kurzschwert", typ: "aktion", ab: 1, art: "angriff", reichweite: 1, attr: "GES", schaden: "1W6", text: "Nahkampf." },
        { id: "kurzbogen", name: "Kurzbogen", typ: "aktion", ab: 1, art: "angriff", reichweite: 16, attr: "GES", schaden: "1W6", fern: true, text: "Fernkampf." },
        { id: "rudeltaktik", name: "Rudeltaktik", typ: "passiv", ab: 1, text: "Du und Grau habt Vorteil gegen ein Ziel, neben dem der andere steht." },
        { id: "wolf_befehl", name: "Befehl an Grau", typ: "bonus", ab: 1, art: "wolf", reichweite: 20, text: "Grau läuft bis zu 8 Felder zum Ziel und beißt." },
        { id: "wolf_umreissen", name: "Grau: Umreißen", typ: "bonus", ab: 1, art: "wolf", umreissen: true, reichweite: 20, pro: { rast: 2 }, text: "Wie Befehl, dazu STR-Rettungswurf, sonst liegt das Ziel." },
        { id: "eingespielt", name: "Eingespielt", typ: "passiv", ab: 2, text: "Grau beißt am Ende deines Zugs auch ohne Befehl, wenn er neben einem Gegner steht, den du getroffen hast." },
        { id: "ein_rudel", name: "Ein Rudel", typ: "passiv", ab: 3, text: "Jägermal gilt auch für Grau, Grau +1 zum Treffen." },
      ],
      aussen: { name: "Witterung", text: "Grau riecht Untote und Hinterhalte. Die Gruppe kann nicht überrascht werden." },
      versuchung: "„Ich gebe deinem Wolf eine Stimme, und er wird nie sterben.“ Wahr, aber er wird nicht mehr dein Wolf sein.",
      moment: "Der Schacht: Grau findet Tam zuerst und beruhigt ihn.",
    },
    kopfgeldjaeger: {
      name: "Orin", titel: "Der Kopfgeldjäger", klasse: "waldlaeufer", rolle: "hinten, markiert und erlegt", spruch: "Jeder hat einen Preis. Und eine Schwäche.",
      werte: { GES: 16, WEI: 14, KON: 13, INT: 12, STR: 10, CHA: 8 }, rk: [15, 15, 15], ruestung: "beschlagenes Leder",
      faehig: [
        { id: "armbrust", name: "Leichte Armbrust", typ: "aktion", ab: 1, art: "angriff", reichweite: 16, attr: "GES", schaden: "1W8", fern: true, text: "Fernkampf." },
        { id: "schwachstelle", name: "Schwachstelle", typ: "passiv", ab: 1, text: "Gegen dein markiertes Ziel kritisch bei 19–20." },
        { id: "netz", name: "Netz", typ: "aktion", ab: 1, art: "kontrolle", zustand: "netz", reichweite: 6, rettung: "STR", attr: "GES", pro: { rast: 1 }, text: "STR-Rettungswurf, sonst festgehalten, bis es sich befreit (Aktion, STR gegen SG 13)." },
        { id: "fangschuss", name: "Fangschuss", typ: "passiv", ab: 1, text: "Reaktion, automatisch: Bewegt sich dein markiertes Ziel, schießt du einmal." },
        { id: "jagdvorbereitung", name: "Jagdvorbereitung", typ: "passiv", ab: 2, text: "Zu Beginn jedes Kampfes ist ein Gegner schon markiert (ohne Einsatz)." },
        { id: "erlegen", name: "Erlegen", typ: "passiv", ab: 3, pro: { kampf: 1 }, text: "1× je Kampf gegen dein markiertes Ziel unter halben TP: +2W6." },
      ],
      aussen: { name: "Steckbriefe", text: "Kennt Kreaturen: vor einem Kampf eine Schwäche des Gegners." },
      versuchung: "„Nenn mir den Einen, den du nie gefunden hast. Ich bringe ihn dir.“ Wahr, er steht vor dir und hat dein Gesicht.",
      moment: "Halmbruck: Er erkennt Wennas Vater auf einem alten Steckbrief.",
    },
  };
  const REIHE = ["schildwaechter", "berserker", "duellant", "gelehrter", "elementarist", "schattenmagier", "schattenlaeufer", "trickser", "assassine", "lichtbringer", "wanderheiler", "inquisitor", "wildnislaeufer", "tiergefaehrte", "kopfgeldjaeger"];

  const mod = (v) => Math.floor((v - 10) / 2);
  /** TP: Stufe 1 = Würfel + KON, je weitere Stufe halber Würfel + 1 + KON */
  function tpVon(fid, stufe) {
    const d = FIGUREN[fid], w = KLASSEN[d.klasse].wuerfel, kon = mod(d.werte.KON);
    return w + kon + (stufe - 1) * (w / 2 + 1 + kon) - (d.tpMinus || 0) + (KLASSEN[d.klasse].tpJeStufe || 0) * stufe;
  }
  /** Alle Fähigkeiten der Figur bis zur Stufe (Klasse + eigene), in Anzeige-Reihenfolge */
  function faehigVon(fid, stufe = 3) {
    const d = FIGUREN[fid];
    let k = KLASSE_FAEHIG[d.klasse].slice();
    if (d.gerissenAb) k = k.map((x) => (x.gerissen ? Object.assign({}, x, { ab: d.gerissenAb }) : x));
    const eigen = d.faehig.filter((x) => x.ab <= stufe), klasse = k.filter((x) => x.ab <= stufe);
    return eigen.filter((x) => x.typ !== "passiv").concat(klasse.filter((x) => x.typ !== "passiv")).concat(eigen.filter((x) => x.typ === "passiv")).concat(klasse.filter((x) => x.typ === "passiv"));
  }
  const bild = (fid) => "img/figuren/" + fid + ".jpg";

  const API = { KLASSEN, PLAETZE, KLASSE_FAEHIG, FIGUREN, REIHE, tpVon, faehigVon, bild, mod };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.ABF = API;
})(typeof window !== "undefined" ? window : globalThis);
