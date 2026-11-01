/*
 * DER LETZTE FALL – Version 2 (Ermittlung): Umbau der Bereiche 1–3
 *
 * Lädt NACH js/rooms/01–03 und VOR der Engine. Die Raumdateien bleiben unverändert (Version 1
 * nutzt sie weiter); hier werden Hotspots und Rätsel für Version 2 ersetzt:
 * keine Zahlenschlösser mehr, Fortschritt nur über Fragen (Typ „question“) im Ermittlungs-Tablet.
 * Grundlage: ERMITTLUNGSDESIGN.md, Abschnitte 3–6.
 */
(() => {
  const N = window.MRGAME;
  const room = (id) => N.rooms.find((r) => r.id === id);
  const hs = (r, id) => r.views.flatMap((v) => v.hotspots).find((h) => h.id === id);
  const patchHs = (r, id, patch) => Object.assign(hs(r, id), patch);
  const dropKeys = (o, keys) => keys.forEach((k) => delete o[k]);

  /* =================== Neue Dokumente =================== */
  const vern = (who, rows) => `<p class="doc-head">VERNEHMUNG · DI 10.11.2026<br><small>${who} · AUFGENOMMEN VON KHK HAGEDORN</small></p>${rows.map(([q, a]) => `<p class="mono dim">${q}</p><p>„${a}“</p>`).join("")}`;
  Object.assign(N.docs, {
    sms: { title: "SMS von Hagedorns Telefon", kind: "note", html: `<p class="mono dim">MI 11.11.2026 · 21:58 · HAGEDORN</p><p class="handwriting big">Brauche ein paar Tage Abstand. Der Fall war ein Unfall. – R.H.</p>` },
    dienstplan_kw46: { title: "Dienstplan KW 46", kind: "register", html: `<p class="doc-head">DIENSTPLAN KW 46<br><small>KRIPO VELDEN · K1</small></p><table class="doc-table"><tbody><tr><td>Hagedorn</td><td>Mo–Mi Spätdienst</td></tr><tr><td>Hagedorn</td><td><span class="handwriting other">Do–Fr Urlaub</span></td></tr><tr><td>Partner/in</td><td>Fortbildung Mo–Fr</td></tr></tbody></table><p class="dim">Der Urlaub ist nachträglich eingetragen – nicht in Hagedorns Schrift. Hagedorn schreibt mit Füller und unterschreibt immer nur mit „H.“</p>` },
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

  /* =================== Bereich 1 · Ermittlungsbeginn =================== */
  const b = room("buero");
  patchHs(b, "b1_schublade", { take: "theaterschluessel", takeText: "Die Schublade ist nicht abgeschlossen. Obenauf: Hagedorns Theaterschlüssel – „Stadttheater, Haupteingang (Ermittlung)“.", unless: "taken_b1_schublade" });
  dropKeys(hs(b, "b1_schublade"), ["lock", "title"]);
  hs(b, "b1_schublade").label = "Schublade";
  patchHs(b, "b1_tablet", { takeText: "Hagedorns Dienst-Tablet. Kein Passwort, wie immer bei ihm. Ab jetzt ermittelst du damit – das Tablet findest du in der Seitenleiste." });
  patchHs(b, "b1_postit", { title: "Gelber Zettel am Bildschirm" });
  patchHs(b, "b1_schrank", { text: "Alte Fälle, nach Jahren sortiert. Ganz vorn: fünf dünne Mappen vom Dienstag – Hagedorns Vernehmungen zum Fall Reuter. Du legst sie im Tablet ab.", actions: [{ doc: "vern_keller" }, { doc: "vern_mahler" }, { doc: "vern_mira" }, { doc: "vern_timo" }, { doc: "vern_ruth" }] });
  patchHs(b, "b1_dienstplan", { doc: "dienstplan_kw46", text: "" });
  patchHs(b, "b1_tuer", { text: "Erst willst du verstehen, woran Hagedorn gezweifelt hat. Das Tablet zeigt die offene Frage." });
  b.completeWhen = ["foto", "f_zweifel"];
  b.puzzles = {
    foto: { ...b.puzzles.foto, step: true, success: "Klick. Das Tablet erkennt jede Karte, jede Notiz, jeden Faden – Hagedorns Wand liegt jetzt im Tablet, Reiter <b>Wand</b>." },
    f_zweifel: {
      type: "question", title: "Woran zweifelte Hagedorn?",
      prompt: "Hagedorn hat den Unfall nie geglaubt. Was genau hat ihn gestört?",
      answer: { type: "claim", accept: ["bremse"], options: [
        { id: "motor", text: "Der Motor von Zug 12 hatte schon einmal versagt – diesmal ist er durchgegangen." },
        { id: "bremse", text: "Es war kein Defekt: Jemand hat die Bremse von Zug 12 gelöst." },
        { id: "seil", text: "Der Mond war falsch aufgehängt, ein Seil ist gerissen." },
        { id: "licht", text: "Am Lichtpult wurde der falsche Befehl gegeben." },
      ] },
      evidence: { need: 1, sets: [["unfallakte"]] },
      wrongAnswer: { motor: "Die Störung am 26.10. betraf den Motor. Was sagt die Kriminaltechnik über die Bremse?", seil: "Von gerissenen Seilen steht nirgends etwas. Lies den Kurzbericht der Kriminaltechnik.", licht: "Licht kann keinen Mond abstürzen lassen." },
      wrongEvidence: { programm: "Das Programmheft erklärt die Mondszene – nicht, warum sie schiefging.", postit: "Der Zettel ist für die Schublade gedacht, nicht für den Fall." },
      missingEvidence: "Hagedorn hätte gesagt: Belege. Was in der Akte stützt das?",
      objective: "Finde heraus, woran Hagedorn gezweifelt hat (Tablet → Fall).",
      hints: ["Hagedorns Randnotizen stehen in der Akte Reuter auf dem Aktenschrank.", "„Motor ≠ Bremse!“ – und die Kriminaltechnik meldet einen fehlenden Sicherungsstift.", "„Jemand hat die Bremse gelöst“ · Beleg: Akte Reuter."],
      success: "Der Mond fiel nicht durch einen Motordefekt – jemand hat die Bremse gelöst. Hagedorns Ermittlung beginnt genau hier. <b>Neuer Ort: das Stadttheater.</b>",
      finding: "Der Mond fiel nicht durch einen Motordefekt – jemand hat die Bremse gelöst.",
    },
    f_sms: {
      type: "question", step: true, bonus: true, title: "Hat Hagedorn die SMS selbst geschrieben?",
      answer: { type: "claim", accept: ["nein"], options: [
        { id: "ja", text: "Ja – er war erschöpft und brauchte Abstand." },
        { id: "nein", text: "Nein – jemand anderes hat sie von seinem Telefon geschickt." },
        { id: "unklar", text: "Ja – aber unter Druck, jemand hat sie ihm diktiert." },
      ] },
      evidence: { need: 2, sets: [["sms", "postit"], ["sms", "programm"], ["sms", "dienstplan_kw46"]] },
      wrongAnswer: { ja: "Schau dir an, wie er unterschreibt.", unklar: "Dafür gibt es keinen Beleg. Was unterscheidet die SMS von allem, was er sonst schreibt?" },
      wrongEvidence: { unfallakte: "Die Akte sagt nichts über die SMS." },
      missingEvidence: "Vergleiche die SMS mit etwas, das Hagedorn wirklich geschrieben hat.",
      objective: "Zusatzfrage: Prüfe die SMS von Mittwoch.",
      hints: ["Wie unterschreibt Hagedorn sonst?", "Lege die SMS neben einen Zettel in seiner Schrift.", "„Nein“ · Belege: SMS + Post-it (oder Programmheft)."],
      success: "Hagedorn unterschreibt immer nur mit „H.“. Die SMS endet mit „R.H.“ – jemand anderes hat sie geschrieben. Er ist nicht im Urlaub. Er ist verschwunden.",
      finding: "Die SMS ist nicht von Hagedorn: Er unterschreibt nie mit „R.H.“. Er ist verschwunden.",
    },
  };

  /* =================== Bereich 2 · Zeitleiste =================== */
  const f = room("foyer");
  patchHs(f, "f2_terminal", { text: "Das Terminal protokolliert jede Karte an der Seitentür – auf Serverzeit." });
  dropKeys(hs(f, "f2_terminal"), ["lock"]);
  patchHs(f, "f2_kasten", { take: "b1", unless: "taken_f2_kasten", takeText: "Der Kasten ist offen. Du nimmst <b>B-1</b> für die Bühnentür. Daneben ein leerer Haken: <b>K-4 – Technik, Unterbühne, Gänge</b>." });
  dropKeys(hs(f, "f2_kasten"), ["lock", "title"]);
  f.views.find((v) => v.id === "sued").hotspots.push({ id: "f2_kasten_leer", label: "Schlüsselkasten", x: 65, y: 20.5, w: 20.5, h: 34, if: "taken_f2_kasten", title: "Der Schlüsselkasten", text: "Fünf Schlüssel hängen, einer fehlt: <b>K-4</b>. Im Register ist keine Rückgabe vermerkt." });
  patchHs(f, "f2_buehne", { text: "Abgeschlossen (Schließung B-1). Erst die offenen Fragen zu Keller klären – wohin ging er, als er angeblich gegangen war?" });
  f.completeWhen = ["f_abgang", "f_anwesend", "f_k4"];
  f.puzzles = {
    durchschlag: { ...f.puzzles.durchschlag, step: true, quiet: true, success: "Du schraffierst vorsichtig über das leere Blatt. Graue Linien, dann Buchstaben: <b>20:58 – K-4 – J. Keller</b>. Der Durchschlag liegt jetzt im Tablet." },
    f_abgang: {
      type: "question", title: "Wann verließ Keller das Haus wirklich?",
      answer: { type: "time", accept: ["2127"] },
      evidence: { need: 2, sets: [["pfoertner", "uhrzettel"], ["vern_mahler", "uhrzettel"]] },
      wrongAnswer: { "2133": "Das ist die Zeit der Foyeruhr – stimmt die Foyeruhr?", "2129": "Das ist die Seitentür – da kam jemand herein, nicht hinaus.", "2139": "Die Uhr geht vor, nicht nach.", "2130": "„Gegen halb zehn“ ist Kellers Aussage. Was zeigen die Belege?" },
      wrongEvidence: { seitentuer: "Die Seitentür sagt, wann er hereinkam – nicht, wann er ging.", vern_keller: "Keller sagt „gegen halb zehn“. Das ist eine Aussage, keine Messung." },
      missingEvidence: "Woher weißt du das? Wessel will eine Quelle – und die Erklärung für die Abweichung.",
      objective: "Rekonstruiere, wann Keller das Haus verlassen hat.",
      hints: ["Im Pförtnerbuch steht 21:33. Aber nach welcher Uhr trägt Mahler ein?", "Neben der Foyeruhr hängt ein Wartungszettel. Belege: Pförtnerbuch und Wartungszettel.", "21:27 · Belege: Pförtnerbuch + Wartungszettel."],
      success: "Keller ging um 21:27. Die Foyeruhr – nach der Mahler einträgt – geht sechs Minuten vor.",
      finding: "Keller ging um 21:27. Die Foyeruhr – nach der Mahler einträgt – geht sechs Minuten vor.",
      onSolve: [{ evidence: "zeitabgleich" }],
    },
    f_anwesend: {
      type: "question", title: "War Keller zur Tatzeit im Haus?", hiddenUntil: "f_abgang",
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
      objective: "Kläre, ob Keller zur Tatzeit im Haus war.",
      hints: ["Zwei Zeitpunkte, zwei Uhren: Abgang (korrigiert) und Seitentür.", "Belege: Protokoll Seitentür und dein Zeitabgleich.", "„Ja – er kam durch die Seitentür zurück“ · Belege: Protokoll Seitentür + Zeitabgleich Pforte."],
      success: "Keller ging um 21:27 und war um 21:29 durch die Seitentür wieder im Haus. <b>Gelegenheit: ja.</b>",
      finding: "Keller ging um 21:27 und war um 21:29 durch die Seitentür wieder im Haus. Gelegenheit: ja.",
      field: "gelegenheit", fieldText: "21:27 gegangen, 21:29 wieder im Haus", thread: "t-zeit",
    },
    f_k4: {
      type: "question", title: "Wer hatte Schlüssel K-4 – und wer lügt darüber?",
      answer: { type: "person", accept: ["keller"] },
      evidence: { need: 2, sets: [["durchschlag", "vern_keller"]] },
      wrongAnswer: { mahler: "Mahler gibt die Schlüssel aus – er hat sie nicht.", timo: "Timo hatte B-1 – und gab ihn um 22:30 zurück.", hagedorn: "Hagedorn hatte am Mittwoch den Generalschlüssel, nicht K-4." },
      wrongEvidence: { register: "Im Register ist der Name geschwärzt. Lässt sich das Blatt darunter lesen?", pfoertner: "Das Pförtnerbuch verzeichnet keine Schlüssel.", seitentuer: "Die Seitentür öffnet man mit einer Karte, nicht mit K-4." },
      missingEvidence: "Wer K-4 hatte, ist nur die halbe Frage. Wer hat darüber gelogen – und womit belegst du das?",
      objective: "Finde heraus, wer Schlüssel K-4 hatte.",
      hints: ["Im Register ist ein Name geschwärzt – aber Register werden mit Durchschlag geführt.", "Mit einem weichen Stift (aus Hagedorns Büro) lässt sich der Durchschlag lesen. Vergleiche mit Kellers Vernehmung.", "Keller · Belege: Durchschlag + Vernehmung Keller."],
      success: "Keller hatte K-4 seit 20:58 und gab ihn nie zurück – in der Vernehmung behauptete er, nie einen Technikschlüssel gebraucht zu haben. <b>Zugang: ja.</b>",
      finding: "Keller hatte K-4 seit 20:58 und nie zurückgegeben. In der Vernehmung sagte er, er habe nie einen Technikschlüssel gebraucht. Zugang: ja.",
      field: "zugang", fieldText: "K-4 seit 20:58 bei Keller – nie zurückgegeben", thread: "t-keller",
    },
  };

  /* =================== Bereich 3 · Tathergang =================== */
  const s = room("buehne");
  dropKeys(hs(s, "b3_schema"), ["lock"]);
  patchHs(s, "b3_gang", { go: null, title: "Gang zur Verwaltung", text: "<b>Vorschau:</b> Hier beginnt Kapitel 4 (Motive und Verdächtige). Version 2 endet vorerst an dieser Stelle – Kapitel 4 und 5 werden gerade umgebaut." });
  ["b3_falltuer", "b3_u4", "b3_u4_go"].forEach((id) => { const h = hs(s, id); h.if = "v2_kapitel5"; delete h.unless; delete h.use; delete h.go; });
  s.views[0].hotspots.push({ id: "b3_falltuer2", label: "Falltür", x: 73, y: 75, w: 11, h: 7, title: "Die Falltür", text: "Darunter führt eine Treppe in die Unterbühne. Stockdunkel. Wohin genau, verrät vielleicht Hagedorn selbst." });
  s.completeWhen = ["f_mond", "f_stift", "f_timo", "f_mira", "notiz"];
  s.puzzles = {
    letzte_probe: { ...s.puzzles.letzte_probe, step: true, success: "VR 21:38 – LS47 21:44:00 – <b>Z12-H 21:44:12</b> – AL 21:45:03. Die Zeiten stehen jetzt in deiner Zeitleiste – und das Steuerungsprotokoll mit Klartext im Tablet." },
    f_mond: {
      type: "question", title: "Wie ist der Mond gefallen?",
      answer: { type: "claim", accept: ["hand"], options: [
        { id: "motor", text: "Der Motor von Zug 12 hat den Mond ungebremst abgefahren." },
        { id: "hand", text: "Im Blackout hat jemand oben auf dem Schnürboden den Handablass gezogen." },
        { id: "pult", text: "Vom Lichtpult aus wurde Zug 12 versehentlich ausgelöst." },
        { id: "seil", text: "Die Seile von Zug 12 sind gerissen." },
      ] },
      evidence: { need: 2, sets: [["zugprotokoll", "zug12"]] },
      wrongAnswer: { motor: "Im Protokoll steht kein Motorbefehl – sondern „Z12-H“.", pult: "Das Lichtpult steuert Licht, keine Züge. Was heißt das H in Z12-H?", seil: "Die Seile hängen noch. Die Bremse hat nicht gehalten." },
      wrongEvidence: { protokolle: "Mit Kürzeln allein ist es nur eine Vermutung. Was bedeutet Z12-H im Klartext?", kontrollliste: "Die Kontrollliste sagt, dass um 21:10 alles gesichert war – nicht, was um 21:44 passierte." },
      missingEvidence: "Wo steht, was „Z12-H“ bedeutet – und wo sitzt dieser Hebel?",
      objective: "Rekonstruiere, wie der Mond gefallen ist.",
      hints: ["Bring die vier Regiezettel in der Lichtregie in die richtige Reihenfolge – das Steuerungsprotokoll hat Zeiten.", "Z12-H = Zug 12, Handablass. Das Schema zeigt, wo der Hebel sitzt.", "„Handablass auf dem Schnürboden“ · Belege: Zugprotokoll + Schema Zug 12."],
      success: "Zwölf Sekunden nach dem Blackout hat jemand oben auf dem Schnürboden von Hand die Bremse gelöst. <b>Mittel: der Handablass.</b>",
      finding: "21:44:12 – im Blackout hat jemand auf dem Schnürboden den Handablass von Zug 12 gezogen.",
      field: "mittel", fieldText: "Handablass Zug 12, 21:44:12 – Stift fehlt noch", thread: null,
    },
    f_stift: {
      type: "question", title: "Welcher Stift fehlt – und seit wann?",
      answer: { type: "claim", accept: ["p4_nach"], options: [
        { id: "p4_nach", text: "P-4 – nach der Kontrolle um 21:10 gezogen." },
        { id: "p4_nie", text: "P-4 – er war an diesem Abend nie gesteckt." },
        { id: "p2_nach", text: "P-2 – nach der Kontrolle um 21:10 gezogen." },
        { id: "p6_nach", text: "P-6 – nach der Kontrolle um 21:10 gezogen." },
      ] },
      evidence: { need: 2, sets: [["zug12", "kontrollliste"], ["zug12", "vern_timo"]] },
      wrongAnswer: { p4_nie: "Die Kontrollliste sagt etwas anderes – um 21:10 war der Stift drin.", p2_nach: "Folge der Linie von Zug 12 über die Bremse im Schema.", p6_nach: "Folge der Linie von Zug 12 über die Bremse im Schema." },
      wrongEvidence: { zugprotokoll: "Das Protokoll kennt den Hebel, nicht den Stift.", protokolle: "Das Protokoll kennt den Hebel, nicht den Stift." },
      missingEvidence: "Welcher Stift – und woher weißt du, dass er um 21:10 noch steckte?",
      objective: "Finde heraus, welcher Sicherungsstift fehlt.",
      hints: ["Die Kontrollliste nennt den Bremsstift ohne Nummer.", "Im Schema führt eine Linie von Zug 12 über die Bremse zu einem Steckplatz.", "„P-4, nach 21:10 gezogen“ · Belege: Schema Zug 12 + Kontrollliste."],
      success: "<b>P-4.</b> Um 21:10 steckte er noch. Wer ihn danach zog, kam nur mit Schlüssel K-4 auf den Schnürboden. Der Stift ist verschwunden.",
      finding: "Sicherungsstift P-4 wurde nach 21:10 gezogen – nur mit K-4 kam man auf den Schnürboden.",
    },
    f_timo: {
      type: "question", title: "Stimmt Timos Aussage?",
      answer: { type: "claim", accept: ["ja"], options: [
        { id: "ja", text: "Ja – er war um 21:44:08 am Lichtpult, nicht auf dem Schnürboden." },
        { id: "nein", text: "Nein – er hatte Zugang zur Technik und war oben." },
        { id: "unklar", text: "Nicht zu klären – im Dunkeln hat ihn niemand gesehen." },
      ] },
      evidence: { need: 1, sets: [["sprechanlage"]] },
      wrongAnswer: { nein: "Zugang ist noch keine Tat. Wo war Timo um 21:44:12?", unklar: "Gesehen nicht – aber gehört. Es gibt eine Aufnahme." },
      wrongEvidence: { kontrollliste: "Die Kontrollliste beweist, dass Timo um 21:10 am Zug war – nicht, wo er um 21:44 war.", vern_timo: "Seine eigene Aussage kann sich nicht selbst bestätigen.", zugprotokoll: "Das Protokoll zeigt den Handablass – nicht, wer ihn ausgelöst hat." },
      missingEvidence: "Womit belegst du, wo Timo war?",
      objective: "Prüfe Timos Aussage (Hagedorns roter Faden).",
      hints: ["Timo sagt: am Pult, wartend auf Freigabe. Gibt es eine Aufnahme aus der Lichtregie?", "Der Rekorder der Sprechanlage hat Zeitstempel – vergleiche mit 21:44:12.", "„Ja“ · Beleg: Mitschnitt Sprechanlage."],
      success: "Um 21:44:08 spricht Timo über die Sprechanlage – vom Lichtpult. Vier Sekunden später fällt der Mond. Den Hebel oben konnte er nicht ziehen. <b>Timo Brandt ist entlastet.</b>",
      finding: "Timo war um 21:44:08 am Lichtpult (Sprechanlage). Entlastet.",
      thread: "t-timo", refutes: true,
    },
    f_mira: {
      type: "question", title: "Stimmt Miras Aussage?",
      answer: { type: "claim", accept: ["ja"], options: [
        { id: "ja", text: "Ja – sie sprach im Blackout an der Rampe links ihren Monolog." },
        { id: "nein", text: "Nein – sie hatte ein Motiv und nutzte den Blackout." },
        { id: "unklar", text: "Nicht zu klären – ihr Monolog war vorher aufgenommen." },
      ] },
      evidence: { need: 1, sets: [["probenmitschnitt"], ["regiebuch"]] },
      wrongAnswer: { nein: "Ein Streit erklärt ein Motiv. Wo war sie im Blackout?", unklar: "Hör genau hin: Sie schreit, als der Mond fällt – live." },
      wrongEvidence: { vern_mira: "Ihre eigene Aussage kann sich nicht selbst bestätigen.", sprechanlage: "Auf der Sprechanlage ist Timo, nicht Mira." },
      missingEvidence: "Womit belegst du, wo Mira war?",
      objective: "Prüfe Miras Aussage (Hagedorns roter Faden).",
      hints: ["Am Inspizientenpult läuft ein Bühnenmikrofon mit.", "Der Probenmitschnitt hat Zeitstempel. Auch das Regiebuch sagt, wo Mira steht.", "„Ja“ · Beleg: Probenmitschnitt (oder Regiebuch)."],
      success: "Um 21:44:05 spricht Mira an der Rampe links – gleich nah am Mikrofon, bis sie schreit. Auf den Schnürboden kam sie nicht. <b>Mira Seidel ist entlastet.</b>",
      finding: "Mira sprach im Blackout an der Rampe links (Probenmitschnitt). Entlastet.",
      thread: "t-mira", refutes: true,
    },
    notiz: { ...s.puzzles.notiz, step: true, objective: "Finde Hagedorns letzte Nachricht (Regiebuch).", success: "Zwischen den Seiten steckt ein Zettel in Hagedorns Schrift: <b>„… suche dort, wo kein Applaus ankommt. U-4.“</b> – U-4 ist laut Fluchtplan der Wartungsgang unter der Unterbühne." },
  };
  /* Version 2 endet vorerst nach Bereich 3 */
  N.rooms.splice(3);

  /* =================== Tablet-Daten =================== */
  N.case = {
    title: "ERMITTLUNG · FALL 0911-R",
    persons: {
      keller: { name: "Jannis Keller", role: "Verwaltungsdirektor", rel: "führte das Haus mit Reuter", doc: "vern_keller", suspicion: "gelber Faden: „Schlüssel?“",
        checks: [{ q: "f_anwesend", text: "„Danach zu Hause“ – widerlegt: 21:29 wieder im Haus" }, { q: "f_k4", text: "„Schlüssel nie gebraucht“ – widerlegt: K-4 seit 20:58" }] },
      mahler: { name: "Kurt Mahler", role: "Pförtner", rel: "trägt Zeiten nach der Foyeruhr ein", doc: "vern_mahler", checks: [{ q: "f_abgang", text: "Aussage bestätigt: Einträge folgen der Foyeruhr (6 Min. vor)" }] },
      mira: { name: "Mira Seidel", role: "Hauptdarstellerin", rel: "Streit mit Reuter am Vormittag", doc: "vern_mira", suspicion: "roter Faden: „Streit am Vormittag. Motiv!“", checks: [{ q: "f_mira", text: "Alibi bestätigt: Monolog an der Rampe links" }] },
      timo: { name: "Timo Brandt", role: "Beleuchter", rel: "Sicherheitskontrolle 21:10", doc: "vern_timo", suspicion: "roter Faden: „Zugang Technik, Kontrolle 21:10“", checks: [{ q: "f_timo", text: "Alibi bestätigt: 21:44:08 am Lichtpult" }] },
      ruth: { name: "Ruth Eilers", role: "Kostümbildnerin", rel: "hat am Mond genäht", doc: "vern_ruth", suspicion: "roter Faden: „Rote Fasern am Mond“", checks: [{ q: null, text: "wird in Kapitel 4 geprüft" }] },
      reuter: { name: "Anton Reuter", role: "Intendant · Opfer", rel: "stand im Blackout auf Markierung Mitte", checks: [] },
      hagedorn: { name: "Rainer Hagedorn", role: "Hauptkommissar", rel: "seit Mittwochabend verschwunden", checks: [{ q: "f_zweifel", text: "Zweifelte am Unfall: Bremse, nicht Motor" }, { q: "f_sms", text: "Die SMS „– R.H.“ stammt nicht von ihm" }] },
    },
    /* clock: server (Funkuhr/Steuerung) · foyer (geht 6 Min. vor) · est (Aussage/geschätzt) */
    timeline: [
      { id: "naht", t: "nachm.", sort: "16:00", text: "Ruth: Samtkante am Mond „am Nachmittag“ erneuert", doc: "vern_ruth", clock: "est" },
      { id: "b1", t: "17:40", text: "B-1 an Brandt ausgegeben", doc: "register", clock: "foyer" },
      { id: "k2210", t: "18:05", text: "Karte 2210 (Brandt) – Seitentür", doc: "seitentuer", clock: "server" },
      { id: "hartwig", t: "18:12", text: "Hartwig-Monteure kommen", doc: "pfoertner", clock: "foyer" },
      { id: "k3302", t: "18:20", text: "Karte 3302 (Seidel) – Seitentür", doc: "seitentuer", clock: "server" },
      { id: "k4aus", t: "20:58", text: "K-4 ausgegeben an ███████", textIfDoc: { doc: "durchschlag", text: "K-4 ausgegeben an J. Keller (Durchschlag)" }, doc: "register", clock: "foyer" },
      { id: "kontrolle", t: "21:10", text: "Kontrolle Zug 12 – Bremsstift gesteckt (T.B.)", doc: "kontrollliste", clock: "est" },
      { id: "regie", t: "21:15", text: "Reuter will selbst auf „Mitte“ stehen", doc: "regiebuch", clock: "est" },
      { id: "k4417", t: "21:29", text: "Karte 4417 (Keller) – Seitentür", doc: "seitentuer", clock: "server" },
      { id: "kaussage", t: "≈ 21:30", sort: "21:30", text: "Keller: „gegen halb zehn gegangen, danach zu Hause“", doc: "vern_keller", clock: "est" },
      { id: "kgeht", t: "21:33", text: "Keller geht – „Feierabend“", doc: "pfoertner", clock: "foyer", strikeIf: "f_abgang" },
      { id: "kgeht_korr", t: "21:27", text: "Keller geht – korrigiert", clock: "server", onlyIf: "f_abgang", fixed: true },
      { id: "vr", t: "21:38:00", text: "VR – Vorbereitungsruf Mondszene", doc: "zugprotokoll", clock: "server" },
      { id: "ls47", t: "21:44:00", text: "LS47 – Blackout", doc: "zugprotokoll", clock: "server" },
      { id: "mira", t: "21:44:05", text: "Mira spricht ihren Monolog (Rampe links)", doc: "probenmitschnitt", clock: "server" },
      { id: "timo", t: "21:44:08", text: "Timo: „Blackout steht“ – vom Lichtpult", doc: "sprechanlage", clock: "server" },
      { id: "z12h", t: "21:44:12", text: "Z12-H – Handablass Zug 12 (Schnürboden)", doc: "zugprotokoll", clock: "server" },
      { id: "al", t: "21:45:03", text: "AL – Arbeitslicht", doc: "zugprotokoll", clock: "server" },
      { id: "notruf", t: "21:52", text: "Notruf – Unfall Bühne", doc: "pfoertner", clock: "foyer" },
    ],
    contradictions: [
      { pair: ["kgeht", "k4417"], q: "f_abgang", text: "Keller geht um 21:33 – und ist um 21:29 an der Seitentür? Welche Uhr stimmt?" },
      { pair: ["kaussage", "k4417"], q: "f_anwesend", text: "„Danach zu Hause“ – aber seine Karte öffnet um 21:29 die Seitentür." },
      { pair: ["kgeht_korr", "k4417"], q: "f_anwesend", text: "21:27 gegangen, 21:29 wieder drin." },
      { pair: ["k4aus", "kaussage"], q: "f_k4", text: "Wer hatte K-4 – und was sagt Keller dazu?" },
      { pair: ["kontrolle", "z12h"], q: "f_stift", text: "Um 21:10 war der Stift drin – um 21:44:12 ließ sich der Hebel ziehen." },
      { pair: ["timo", "z12h"], q: "f_timo", text: "Vier Sekunden vor dem Handablass spricht Timo vom Lichtpult." },
      { pair: ["mira", "z12h"], q: "f_mira", text: "Mira spricht an der Rampe, als oben der Hebel gezogen wird." },
      { pair: ["ls47", "z12h"], q: "f_mond", text: "Zwölf Sekunden nach dem Blackout: Z12-H. Was ist das H?" },
    ],
    fields: [
      { id: "zugang", label: "Zugang", open: "Wie kam der Täter an die Technik?" },
      { id: "gelegenheit", label: "Gelegenheit", open: "War er zur Tatzeit im Haus?" },
      { id: "mittel", label: "Mittel", open: "Wie fiel der Mond?" },
      { id: "motiv", label: "Motiv", open: "Kapitel 4 – Motive" },
    ],
    /* Ort im Beweisarchiv (sonst „Akte“) */
    places: {
      fallakte: "Akte", sms: "Präsidium", unfallakte: "Präsidium", programm: "Präsidium", postit: "Präsidium", dienstplan_kw46: "Präsidium", erster_fall: "Präsidium",
      vern_keller: "Vernehmungen", vern_mahler: "Vernehmungen", vern_mira: "Vernehmungen", vern_timo: "Vernehmungen", vern_ruth: "Vernehmungen",
      pfoertner: "Foyer", uhrzettel: "Foyer", seitentuer: "Foyer", register: "Foyer", durchschlag: "Foyer", theaterplan: "Foyer", theaterzettel: "Foyer", zeitabgleich: "Erkenntnis",
      protokolle: "Bühne", zugprotokoll: "Bühne", kontrollliste: "Bühne", zug12: "Bühne", regiebuch: "Bühne", probenmitschnitt: "Bühne", sprechanlage: "Bühne", hagedorn_notiz: "Bühne",
    },
    hiddenDocs: ["wand_foto"],
    /* Hagedorns Fäden → Frage (null: späteres Kapitel) */
    threads: { "t-zeit": "f_anwesend", "t-keller": "f_k4", "t-timo": "f_timo", "t-mira": "f_mira", "t-ruth": null },
  };
})();
