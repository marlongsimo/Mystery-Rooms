/*
 * DER LETZTE FALL – Ermittlung, Prototyp Kapitel 2 (Foyer und Pforte)
 * Inhalte nach ERMITTLUNGSDESIGN.md: Fragen F1 (bereits gesichert), F3–F5, Personen,
 * Vernehmungen, Zeitleiste. Dokumente aus js/rooms/01-buero.js und 02-foyer.js werden mitbenutzt.
 */
(() => {
  const N = window.MRGAME;

  /* ---------- Vernehmungen (Hagedorn, Di 10.11.) ---------- */
  const vern = (who, rows) => `<p class="doc-head">VERNEHMUNG · DI 10.11.2026<br><small>${who} · AUFGENOMMEN VON KHK HAGEDORN</small></p>${rows.map(([q, a]) => `<p class="mono dim">${q}</p><p>„${a}“</p>`).join("")}`;
  Object.assign(N.docs, {
    vern_keller: { title: "Vernehmung Jannis Keller", kind: "register", html: vern("JANNIS KELLER, VERWALTUNGSDIREKTOR", [
      ["Wann haben Sie am Montag das Haus verlassen?", "Gegen halb zehn. Ganz normal über die Pforte, Herr Mahler hat mich ausgetragen. Danach war ich zu Hause."],
      ["Ihr Verhältnis zu Herrn Reuter?", "Kollegial. Wir haben das Haus seit sechs Jahren zusammen geführt."],
      ["Hatten Sie Zugang zur Bühnentechnik?", "Einen Schlüssel zur Technik? Den habe ich nie gebraucht. Ich bin Verwaltungsdirektor, kein Techniker."],
    ]) + `<p class="handwriting margin">Zu glatt. – H.</p>` },
    vern_mahler: { title: "Vernehmung Kurt Mahler", kind: "register", html: vern("KURT MAHLER, PFÖRTNER", [
      ["Wann ist Herr Keller gegangen?", "Steht im Buch. Ich trage ein, was die Uhr im Foyer zeigt. So machen wir das seit Jahren."],
      ["Ist Ihnen etwas aufgefallen?", "Er war eilig. Hat nicht mal Gute Nacht gesagt. Und dann hat es zwanzig Minuten später gekracht."],
      ["Wer gibt Schlüssel aus?", "Ich. Alles kommt ins Register, mit Durchschlag. Rückgabe wird abgehakt."],
    ]) },
    vern_mira: { title: "Vernehmung Mira Seidel", kind: "register", html: vern("MIRA SEIDEL, SCHAUSPIELERIN", [
      ["Sie hatten Streit mit Herrn Reuter?", "Ja. Er wollte mir die Rolle wegnehmen. Ich war wütend – aber doch nicht so."],
      ["Wo waren Sie im Blackout?", "An der Rampe links. Ich habe meinen Monolog gesprochen, wie jede Probe."],
    ]) },
    vern_timo: { title: "Vernehmung Timo Brandt", kind: "register", html: vern("TIMO BRANDT, BELEUCHTER", [
      ["Die Sicherheitskontrolle?", "Um 21:10, wie immer. Der Stift steckte, ich habe es abgehakt."],
      ["Wo waren Sie im Blackout?", "Am Pult. Ich habe auf die Freigabe vom Inspizienten gewartet."],
    ]) },
    vern_ruth: { title: "Vernehmung Ruth Eilers", kind: "register", html: vern("RUTH EILERS, KOSTÜMBILDNERIN", [
      ["Rote Fasern am Mond – von Ihnen?", "Natürlich. Ich habe am Nachmittag die Samtkante erneuert."],
      ["Und während der Probe?", "Ab halb sieben war ich in der Werkstatt. Säume für Bild 5."],
    ]) },
  });

  /* ---------- Personen ---------- */
  const P = {
    keller: { name: "Jannis Keller", role: "Verwaltungsdirektor", rel: "führte das Haus mit Reuter", doc: "vern_keller", suspicion: "gelber Faden: „Schlüssel?“",
      checks: [{ q: "f_anwesend", text: "Aussage „danach zu Hause“ – widerlegt: 21:29 wieder im Haus" }, { q: "f_k4", text: "Aussage „Schlüssel nie gebraucht“ – widerlegt: K-4 um 20:58" }] },
    mahler: { name: "Kurt Mahler", role: "Pförtner", rel: "trägt alle Zeiten nach der Foyeruhr ein", doc: "vern_mahler", suspicion: null,
      checks: [{ q: "f_abgang", text: "Aussage bestätigt: Einträge folgen der Foyeruhr (6 Min. vor)" }] },
    mira: { name: "Mira Seidel", role: "Hauptdarstellerin", rel: "Streit mit Reuter am Vormittag", doc: "vern_mira", suspicion: "roter Faden: „Streit am Vormittag. Motiv!“", checks: [{ q: null, text: "Alibi wird in Kapitel 3 geprüft" }] },
    timo: { name: "Timo Brandt", role: "Beleuchter", rel: "Sicherheitskontrolle 21:10", doc: "vern_timo", suspicion: "roter Faden: „Zugang Technik, Kontrolle 21:10“", checks: [{ q: null, text: "Alibi wird in Kapitel 3 geprüft" }] },
    ruth: { name: "Ruth Eilers", role: "Kostümbildnerin", rel: "hat am Mond genäht", doc: "vern_ruth", suspicion: "roter Faden: „Rote Fasern am Mond“", checks: [{ q: null, text: "Alibi wird in Kapitel 4 geprüft" }] },
    reuter: { name: "Anton Reuter", role: "Intendant · Opfer", rel: "stand im Blackout auf Markierung Mitte", doc: null, suspicion: null, checks: [] },
    hagedorn: { name: "Rainer Hagedorn", role: "Hauptkommissar", rel: "seit Mittwochabend verschwunden", doc: null, suspicion: null, checks: [{ q: "f_zweifel", text: "Zweifelte am Unfall: Bremse, nicht Motor" }] },
  };

  /* ---------- Zeitleiste (Mo 9.11.) ----------
     clock: server (Funkuhr) · foyer (geht 6 Min. vor) · est (Aussage/geschätzt) */
  const TL = [
    { id: "b1", t: "17:40", text: "B-1 an Brandt ausgegeben", doc: "register", clock: "foyer" },
    { id: "k2210", t: "18:05", text: "Karte 2210 (Brandt) – Seitentür", doc: "seitentuer", clock: "server" },
    { id: "hartwig", t: "18:12", text: "Hartwig-Monteure kommen", doc: "pfoertner", clock: "foyer" },
    { id: "k3302", t: "18:20", text: "Karte 3302 (Seidel) – Seitentür", doc: "seitentuer", clock: "server" },
    { id: "k4aus", t: "20:58", text: "K-4 ausgegeben an ███████", textIf: { q: "x_durchschlag", text: "K-4 ausgegeben an J. Keller (Durchschlag)" }, doc: "register", clock: "foyer" },
    { id: "kaussage", t: "≈ 21:30", sort: "21:30", text: "Keller: „gegen halb zehn gegangen, danach zu Hause“", doc: "vern_keller", clock: "est" },
    { id: "k4417", t: "21:29", text: "Karte 4417 (Keller) – Seitentür", doc: "seitentuer", clock: "server" },
    { id: "kgeht", t: "21:33", text: "Keller geht – „Feierabend“", doc: "pfoertner", clock: "foyer", strikeIf: "f_abgang" },
    { id: "kgeht_korr", t: "21:27", text: "Keller geht – korrigiert", clock: "server", onlyIf: "f_abgang", fixed: true },
    { id: "mond", t: "≈ 21:44", sort: "21:44", text: "Der Mond fällt", doc: "unfallakte", clock: "est" },
    { id: "notruf", t: "21:52", text: "Notruf – Unfall Bühne", doc: "pfoertner", clock: "foyer" },
  ];
  /* Zwei Einträge antippen → „Widerspruch melden“ */
  const CONTRA = [
    { pair: ["kgeht", "k4417"], q: "f_abgang", text: "Keller geht um 21:33 – und ist um 21:29 an der Seitentür? Welche Uhr stimmt?" },
    { pair: ["kaussage", "k4417"], q: "f_anwesend", text: "„Danach zu Hause“ – aber seine Karte öffnet um 21:29 die Seitentür." },
    { pair: ["kgeht_korr", "k4417"], q: "f_anwesend", text: "21:27 gegangen, 21:29 wieder drin." },
    { pair: ["k4aus", "kaussage"], q: "f_k4", text: "Wer hatte K-4 – und was sagt Keller dazu?" },
  ];

  /* ---------- Fragen ---------- */
  const Q = [
    {
      id: "f_zweifel", chapter: 1, title: "Woran zweifelte Hagedorn?", solvedAtStart: true,
      finding: "Der Mond fiel nicht durch einen Motordefekt – jemand hat die Bremse gelöst.",
    },
    {
      id: "f_abgang", chapter: 2, title: "Wann verließ Keller das Haus wirklich?",
      answer: { type: "time", accept: ["2127"] },
      evidence: { need: 2, sets: [["pfoertner", "uhrzettel"], ["vern_mahler", "uhrzettel"]] },
      wrongAnswer: { "2133": "Das ist die Zeit der Foyeruhr – stimmt die Foyeruhr?", "2129": "Das ist die Seitentür – da kam jemand herein, nicht hinaus.", "2139": "Die Uhr geht vor, nicht nach.", "2130": "„Gegen halb zehn“ ist Kellers Aussage. Was zeigen die Belege?" },
      wrongEvidence: { seitentuer: "Die Seitentür sagt, wann er hereinkam – nicht, wann er ging.", vern_keller: "Keller sagt „gegen halb zehn“. Das ist eine Aussage, keine Messung." },
      missingEvidence: "Woher weißt du das? Wessel will eine Quelle – und die Erklärung für die Abweichung.",
      finding: "Keller ging um 21:27. Die Foyeruhr – nach der Mahler einträgt – geht sechs Minuten vor.",
      unlocks: ["f_anwesend"],
      hints: ["Im Pförtnerbuch steht 21:33. Aber nach welcher Uhr trägt Mahler ein?", "Neben der Foyeruhr hängt ein Wartungszettel. Belege: Pförtnerbuch und Wartungszettel.", "21:33 minus 6 Minuten = 21:27 · Belege: Pförtnerbuch + Wartungszettel."],
    },
    {
      id: "f_anwesend", chapter: 2, title: "War Keller zur Tatzeit im Haus?", hiddenUntil: "f_abgang",
      answer: { type: "claim", accept: ["zurueck"], options: [
        { id: "weg", text: "Nein – er war um 21:27 gegangen und blieb weg." },
        { id: "zurueck", text: "Ja – zwei Minuten nach seinem Abgang kam er durch die Seitentür zurück." },
        { id: "fehler", text: "Unklar – das Protokoll der Seitentür geht falsch." },
        { id: "geliehen", text: "Nein – jemand anderes hat seine Karte benutzt." },
      ] },
      evidence: { need: 2, sets: [["seitentuer", "zeitabgleich"]] },
      wrongAnswer: { weg: "Laut Pförtnerbuch war er weg – oder? Was sagt die Seitentür?", fehler: "Die Seitentür läuft auf Serverzeit (Funkuhr). Ungenau ist eine andere Uhr.", geliehen: "Möglich – aber dafür bräuchtest du einen Beleg. Hast du einen?" },
      wrongEvidence: { pfoertner: "Das Pförtnerbuch zeigt nur den Abgang – nicht die Rückkehr.", uhrzettel: "Der Zettel erklärt die Uhr. Dass er zurückkam, zeigt er nicht." },
      missingEvidence: "Du brauchst beides: wann er ging – und wann er wiederkam.",
      finding: "Keller ging um 21:27 und war um 21:29 durch die Seitentür wieder im Haus. Gelegenheit: ja.",
      field: "gelegenheit", fieldText: "21:27 gegangen, 21:29 wieder im Haus", thread: "t-zeit",
      hints: ["Zwei Zeitpunkte, zwei Uhren: Abgang (korrigiert) und Seitentür.", "Belege: Protokoll Seitentür und dein Zeitabgleich.", "„Ja – er kam durch die Seitentür zurück“ · Belege: Protokoll Seitentür + Zeitabgleich Pforte."],
    },
    {
      id: "f_k4", chapter: 2, title: "Wer hatte Schlüssel K-4 – und wer lügt darüber?",
      answer: { type: "person", accept: ["keller"] },
      evidence: { need: 2, sets: [["durchschlag", "vern_keller"]] },
      wrongAnswer: { mahler: "Mahler gibt die Schlüssel aus – er hat sie nicht.", timo: "Timo hatte B-1 – und gab ihn um 22:30 zurück.", hagedorn: "Hagedorn hatte am Mittwoch den Generalschlüssel, nicht K-4." },
      wrongEvidence: { register: "Im Register ist der Name geschwärzt. Lässt sich das Blatt darunter lesen?", pfoertner: "Das Pförtnerbuch verzeichnet keine Schlüssel.", seitentuer: "Die Seitentür öffnet man mit einer Karte, nicht mit K-4." },
      missingEvidence: "Wer K-4 hatte, ist nur die halbe Frage. Wer hat darüber gelogen – und womit belegst du das?",
      finding: "Keller hatte K-4 seit 20:58 und nie zurückgegeben. In der Vernehmung sagte er, er habe nie einen Technikschlüssel gebraucht. Zugang: ja.",
      field: "zugang", fieldText: "K-4 seit 20:58 bei Keller – nie zurückgegeben", thread: "t-keller",
      hints: ["Im Register ist ein Name geschwärzt – aber Register werden mit Durchschlag geführt.", "Untersuche das Schlüsselregister im Beweisarchiv. Vergleiche das Ergebnis mit Kellers Vernehmung.", "Keller · Belege: Durchschlag + Vernehmung Keller."],
    },
  ];

  /* Fäden an Hagedorns Wand → Frage */
  const THREADS = { "t-zeit": "f_anwesend", "t-keller": "f_k4", "t-mira": null, "t-timo": null, "t-ruth": null };

  /* Untersuchungen im Beweisarchiv */
  const ACTIONS = {
    register: { id: "x_durchschlag", label: "✎ Mit Bleistift über den Durchschlag schraffieren", gives: "durchschlag", text: "Graue Linien, dann Buchstaben: 20:58 – K-4 – J. Keller. Rückgabe: keine." },
  };

  N.case = {
    title: "ERMITTLUNG 02 · THEATER VELDEN", subtitle: "Foyer und Pforte",
    persons: P, timeline: TL, contradictions: CONTRA, questions: Q, threads: THREADS, actions: ACTIONS,
    /* was im Beweisarchiv liegt (Prototyp: alles aus Kapitel 1 und 2 ist schon gefunden) */
    archive: [
      { id: "unfallakte", place: "Präsidium" }, { id: "programm", place: "Präsidium" },
      { id: "vern_keller", place: "Präsidium" }, { id: "vern_mahler", place: "Präsidium" }, { id: "vern_mira", place: "Präsidium" }, { id: "vern_timo", place: "Präsidium" }, { id: "vern_ruth", place: "Präsidium" },
      { id: "pfoertner", place: "Foyer" }, { id: "uhrzettel", place: "Foyer" }, { id: "seitentuer", place: "Foyer" }, { id: "register", place: "Foyer" }, { id: "theaterplan", place: "Foyer" },
      { id: "durchschlag", place: "Foyer", ifFound: "x_durchschlag" },
      { id: "zeitabgleich", place: "Erkenntnis", ifSolved: "f_abgang" },
    ],
    fields: [
      { id: "zugang", label: "Zugang", open: "Wie kam der Täter an die Technik?" },
      { id: "gelegenheit", label: "Gelegenheit", open: "War er zur Tatzeit im Haus?" },
      { id: "mittel", label: "Mittel", open: "Kapitel 3 – Tathergang" },
      { id: "motiv", label: "Motiv", open: "Kapitel 4 – Motive" },
    ],
  };
})();
