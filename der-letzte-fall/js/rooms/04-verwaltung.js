/*
 * BEREICH 4 – KOSTÜMWERKSTATT UND VERWALTUNG · ca. 18 Min.
 * Rätsel 10 Die Stoffspur (Musterbuch → Ruth-Faden widerlegen) · 11 Die doppelte Rechnung (drei Stufen)
 * · 12 Reuters Tresor (1011 → Ersatzschlüssel K-4). Danach: Tür U-4 in der Unterbühne (Zwischenschritt).
 * Was du erfährst: Ruth hat nichts damit zu tun. Und Reuter musste sterben, weil er Keller durchschaut hatte.
 */
(() => {
  const N = window.MRGAME;
  const { T, sheet, door, lamp } = N.draw;
  const scene = (p, body) => N.svgScene(p, body, { top: "#0d0c0a", mid: "#24201a", bot: "#151310", base: "#2e2820", line: "#4a3f30" });

  Object.assign(N.items, {
    k4: { name: "Ersatzschlüssel K-4", icon: "⚿", text: "Aus Reuters Tresor. Anhänger: „K-4 Reserve – Technik, Unterbühne, U-4, W-1“. Das reguläre K-4 hat Keller." },
  });
  Object.assign(N.messages, {
    m_wessel2: { from: "Dr. Wessel", text: "Sind Sie etwa im Theater? Das Haus ist versiegelt. Ich erwarte Sie Montag um acht in meinem Büro." },
  });

  const swatch = (name, code, col) => `<div style="background:${col}">${code}</div>`;
  Object.assign(N.docs, {
    naehprotokoll: {
      title: "Nähprotokoll", kind: "register", card: { kind: "doc", sub: "17:05 · Samtkante Mond" },
      html: `<p class="doc-head">KOSTÜMWERKSTATT<br><small>NÄHPROTOKOLL · 9.11.2026</small></p>
        <table class="doc-table"><tbody><tr><td>14:20</td><td>Maske Mira, Gummizug neu</td><td>R.E.</td></tr><tr><td><b>17:05</b></td><td><b>Mond, Samtkante erneuert – Bordeaux, Charge 0917</b></td><td>R.E.</td></tr><tr><td>18:10</td><td>Ensemble, Säume Bild 5</td><td>R.E.</td></tr></tbody></table>
        <p class="dim">Ab 18:30 (Probenbeginn) war Ruth laut Dienstplan in der Werkstatt, nicht auf der Bühne.</p>`,
    },
    musterbuch: {
      title: "Stoffmusterbuch Samt", kind: "photo",
      html: `<p class="doc-head">STOFFMUSTER · SAMT ROT</p><div class="swatches">${swatch("Kirsch", "0412", "#a1162a")}${swatch("Bordeaux", "0917", "#5e1424")}${swatch("Karmin", "0733", "#8f1d2c")}${swatch("Rost", "0305", "#8a3324")}${swatch("Purpur", "1102", "#6a1446")}</div>
        <p class="mono">0412 Kirsch · <b>0917 Bordeaux</b> · 0733 Karmin · 0305 Rost · 1102 Purpur</p>`,
    },
    zahlungsbuch: {
      title: "Zahlungsbuch Auftrag T-17", kind: "register",
      html: `<p class="doc-head">ZAHLUNGSBUCH<br><small>AUFTRAG T-17 · INSTANDHALTUNG OBERMASCHINERIE</small></p>
        <table class="doc-table"><thead><tr><th>Jahr</th><th>Firma</th><th>Rechn.</th><th>Summe</th><th>Freigabe</th></tr></thead><tbody>
        <tr><td>2023</td><td>Hartwig Bühnenbau</td><td>4</td><td>52.800 €</td><td>A.R.</td></tr><tr><td>2023</td><td>BTW Theatertechnik</td><td>4</td><td>52.800 €</td><td>J.K.</td></tr>
        <tr><td>2024</td><td>Hartwig Bühnenbau</td><td>5</td><td>61.200 €</td><td>A.R.</td></tr><tr><td>2024</td><td>BTW Theatertechnik</td><td>5</td><td>61.200 €</td><td>J.K.</td></tr>
        <tr><td>2025</td><td>Hartwig Bühnenbau</td><td>6</td><td>72.400 €</td><td>A.R.</td></tr><tr><td>2025</td><td>BTW Theatertechnik</td><td>6</td><td>72.400 €</td><td>J.K.</td></tr>
        </tbody></table>
        <p class="mono">IBAN Hartwig: DE21 4405 0199 0001 2280 33<br>IBAN BTW: DE88 3702 0500 0081 <b>4417 02</b></p>`,
    },
    rechnungen: {
      title: "Ordner T-17 (Rechnungen)", kind: "letter", pageLabels: ["Hartwig Bühnenbau", "BTW Theatertechnik"],
      pages: [
        `<p class="doc-head">HARTWIG BÜHNENBAU GMBH<br><small>RECHNUNG 2026-1044 · 12.10.2026</small></p><p>Reparatur Antriebsmotor Zug 12 (Störung vom 26.10. vorgezogen – Notdienst). Monteure: 2.</p><p class="mono">St.-Nr. 21/402/11873 · 4.800,00 €</p><p class="dim">abgezeichnet: A.R.</p>`,
        `<p class="doc-head">BTW THEATERTECHNIK<br><small>RECHNUNG 1544 · 14.10.2026</small></p><p>Reparatur Antriebsmotor Zug 12. Wartung Obermaschinerie.</p><p class="mono">Postfach 1144, Velden · keine Steuernummer · 4.800,00 €</p><p class="dim">freigegeben: <b>J.K.</b></p><p class="handwriting margin">Dieselbe Reparatur, zweimal? Hartwig war doch da. – A.R.</p>`,
      ],
    },
    reisekosten: {
      title: "Reisekostenabrechnung J. Keller", kind: "register",
      html: `<p class="doc-head">REISEKOSTEN<br><small>J. KELLER · OKTOBER 2026</small></p><table class="doc-kv"><tr><th>Anlass</th><td>Bühnentechnik-Messe, Köln</td></tr><tr><th>Betrag</th><td>412,60 €</td></tr><tr><th>Erstattung an</th><td class="mono">DE88 3702 0500 0081 4417 02</td></tr></table><p class="dim">Kontoinhaber laut Abrechnung: Jannis Keller.</p>`,
    },
    reuternotiz: {
      title: "Reuters Notiz", kind: "note", card: { kind: "doc", sub: "„Zahlung stoppen. Morgen melden.“" },
      html: `<p class="doc-head">A. REUTER<br><small>9.11.2026</small></p><p class="handwriting big">Zahlung T-17 stoppen.<br><b>Morgen</b> melden.</p>`,
    },
    kalender_reuter: {
      title: "Reuters Tischkalender", kind: "note",
      html: `<p class="doc-head">NOVEMBER 2026</p><p class="mono">Mo 9.11. &nbsp;18:30 Probe Mondszene<br>Di <b>10.11.</b> &nbsp;<b>09:00 Kulturamt – Prüfung T-17</b><br>Sa 14.11. &nbsp;19:30 Premiere</p>`,
    },
    rechnungsvergleich: {
      title: "Rechnungsvergleich T-17", kind: "note", card: { kind: "doc", sub: "186.400 € an Keller" },
      html: `<p class="doc-head">RECHNUNGSVERGLEICH T-17<br><small>EIGENE NOTIZ</small></p>
        <p>15 Rechnungen „BTW Theatertechnik“ (2023–2025), jede kopiert eine echte Leistung von Hartwig: zusammen <b>186.400 €</b>.</p>
        <p>Freigegeben von <b>J.K.</b> – Die IBAN von BTW ist dieselbe wie auf Kellers Reisekostenabrechnung.</p>
        <p class="handwriting">Reuter hat es gemerkt. Am Tag darauf hätte er es gemeldet.</p>`,
    },
    mappe_t17: {
      title: "Reuters Mappe „T-17“", kind: "letter",
      html: `<p class="doc-head">MAPPE T-17<br><small>AUS REUTERS TRESOR</small></p><p>Kopien aller BTW-Rechnungen, jede mit Bleistift neben eine Hartwig-Rechnung gelegt. Obenauf ein Entwurf:</p><p class="handwriting">An das Kulturamt Velden – Verdacht auf Untreue im Auftrag T-17. Ich bitte um ein Gespräch am 10.11. – A. Reuter</p>`,
    },
  });

  /* ---------- Szenen ---------- */
  const nord = scene("v4n", `
  ${lamp("v4n", 520, 120, 220)}
  <rect x="200" y="470" width="760" height="24" fill="#3b2b1e"/><rect x="230" y="494" width="700" height="150" fill="#2c2017"/>
  <g><rect x="300" y="380" width="230" height="90" rx="10" fill="#d8d4c8"/><rect x="300" y="350" width="70" height="40" rx="6" fill="#d8d4c8"/><rect x="480" y="360" width="40" height="40" fill="#b8b4a8"/><rect x="330" y="400" width="140" height="10" fill="#9a9c94"/></g>
  <g transform="rotate(3 640 450)">${sheet(600, 420, 90, 52)}</g>
  <g transform="rotate(-4 800 440)"><rect x="740" y="410" width="130" height="58" fill="#5e1424"/><rect x="746" y="416" width="118" height="46" fill="#e6dcc3"/><g>${["#a1162a", "#5e1424", "#8f1d2c", "#8a3324", "#6a1446"].map((c, i) => `<rect x="${752 + i * 22}" y="422" width="18" height="34" fill="${c}"/>`).join("")}</g></g>
  <g fill="#c9c2b0">${[0, 1, 2].map((i) => `<circle cx="${250 + i * 18}" cy="460" r="7"/>`).join("")}</g>`);

  const ost = scene("v4o", `
  <rect x="100" y="150" width="1000" height="10" fill="#9a9c94"/>
  ${Array.from({ length: 11 }, (_, i) => `<line x1="${140 + i * 86}" y1="160" x2="${140 + i * 86}" y2="190" stroke="#9a9c94" stroke-width="3"/><path d="M${116 + i * 86} 190 h48 l12 330 h-72 z" fill="${["#2c3a44", "#3a2622", "#1f2a22", "#3b3326", "#5e1424", "#24242c"][i % 6]}"/>`).join("")}
  <g><path d="M620 300 a110 110 0 1 1 0 200 a80 80 0 1 0 0 -200" fill="#d8cfa8" stroke="#5e1424" stroke-width="12" transform="rotate(10 620 400)"/></g>
  <rect x="940" y="420" width="140" height="44" fill="#e6dcc3" transform="rotate(-3 1010 442)"/>${T(1010, 446, "A. REUTER", { size: 12, rot: -3 })}`);

  const sued = scene("v4s", `
  <rect x="140" y="160" width="300" height="460" fill="#2a2d33" stroke="#1a1c20" stroke-width="5"/>${[0, 1, 2, 3].map((i) => `<rect x="156" y="${180 + i * 108}" width="268" height="6" fill="#3d4248"/>`).join("")}
  ${Array.from({ length: 10 }, (_, i) => `<rect x="${166 + i * 24}" y="220" width="20" height="62" fill="${["#2c5a8a", "#3a3c40", "#7a2620"][i % 3]}"/>`).join("")}
  <rect x="300" y="300" width="70" height="80" fill="#1d3a5a"/>${T(335, 344, "T-17", { fill: "#e6dcc3", size: 12 })}
  <rect x="540" y="470" width="560" height="24" fill="#3b2b1e"/><rect x="570" y="494" width="500" height="150" fill="#2c2017"/>
  <rect x="700" y="330" width="180" height="130" rx="6" fill="#15171a" stroke="#3d4248" stroke-width="5"/><rect x="712" y="342" width="156" height="100" fill="#0d1a24"/>
  <rect x="920" y="440" width="120" height="30" fill="#c9c2b0"/>${sheet(930, 418, 100, 36, { fill: "#e6dcc3" })}
  ${T(800, 300, "VERWALTUNGSDIREKTOR", { fill: "#8e7656", size: 11, ls: 3 })}`);

  const west = scene("v4w", `
  <rect x="140" y="140" width="340" height="230" fill="#3b2b1e"/><rect x="152" y="152" width="316" height="206" fill="#1d2423"/>${T(310, 270, "Spielzeit 1987/88", { fill: "#806040", serif: true, size: 16, italic: true })}
  <rect x="160" y="470" width="760" height="24" fill="#3b2b1e"/><rect x="190" y="494" width="700" height="150" fill="#2c2017"/>
  <g transform="rotate(-6 330 452)">${sheet(290, 432, 80, 40, { fill: "#f4efe3" })}</g>
  <rect x="420" y="400" width="100" height="70" fill="#e6dcc3" stroke="#3b2b1e" stroke-width="3"/><rect x="420" y="400" width="100" height="16" fill="#7a2620"/>${T(470, 412, "NOVEMBER", { fill: "#e6dcc3", size: 9 })}${T(470, 452, "10", { serif: true, size: 26 })}
  <rect x="600" y="380" width="90" height="92" fill="#1d3a5a"/>${T(645, 430, "T-17", { fill: "#e6dcc3", size: 13 })}
  <rect x="960" y="250" width="180" height="200" fill="#120f0c"/><rect x="970" y="260" width="160" height="180" rx="6" fill="#3a3c37" stroke="#22231f" stroke-width="5"/>
  <circle cx="1050" cy="350" r="36" fill="#2a2b28" stroke="#5a5c55" stroke-width="4"/>${Array.from({ length: 10 }, (_, i) => `<line x1="1050" y1="318" x2="1050" y2="326" stroke="#9a9c94" stroke-width="2" transform="rotate(${i * 36} 1050 350)"/>`).join("")}
  ${door(40, 200, 60, 440, { fill: "#2a2d33" })}`);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "verwaltung",
    name: "Werkstatt und Verwaltung",
    title: "Kostümwerkstatt und Verwaltung",
    kicker: "STADTTHEATER / HINTERHAUS",
    story: "Hinter der Bühne: die Kostümwerkstatt, dahinter die Büros. Es riecht nach Stoff und Kaffee. In Kellers Büro ist alles gerade ausgerichtet – zu ordentlich.",
    ambient: "tick",
    exitVia: "door",
    exitLabel: "Weiter: Wartungsgang U-4",
    views: [
      {
        id: "nord", dir: "NORD", name: "Nähtisch", scene: nord,
        desc: "Ruths Nähtisch unter der Lampe: Nähmaschine, ein aufgeschlagenes Protokoll, ein Musterbuch mit roten Samtproben.",
        hotspots: [
          { id: "v4_protokoll", label: "Nähprotokoll", x: 50, y: 46, w: 8, h: 7, title: "Das Nähprotokoll", doc: "naehprotokoll" },
          { id: "v4_muster", label: "Stoffmusterbuch", x: 61.5, y: 45, w: 11.5, h: 7.5, title: "Das Stoffmusterbuch", doc: "musterbuch", lock: "stoffprobe" },
          { id: "v4_maschine", label: "Nähmaschine", x: 25, y: 38.5, w: 19.5, h: 14, title: "Die Nähmaschine", text: "Noch roter Faden eingefädelt. Ruth hat Montag am späten Nachmittag hier genäht – das sieht man an den Fusseln." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Kostümlager", scene: ost,
        desc: "Kleiderstangen voller Kostüme. Dazwischen hängt das Ersatzteil des Mondes mit roter Samtkante. Ganz rechts ein Kostüm mit Namensschild.",
        hotspots: [
          { id: "v4_mondkostuem", label: "Ersatzteil Mond", x: 44, y: 32, w: 18, h: 26, title: "Ersatzteil des Mondes", text: "Dieselbe rote Samtkante wie am Mond. Fasern davon hängen überall in der Werkstatt – an Ruth, an Mira, an jedem, der hier durchgegangen ist." },
          { id: "v4_abschied", label: "Kostüm mit Namensschild", x: 78, y: 45, w: 12, h: 8, secret: true, title: "„A. Reuter – Abschiedsvorstellung“", text: "Ein Mantel, Hut und ein kleiner Stern am Revers. Ruth hat heimlich ein Kostüm für Reuters letzte Rolle genäht – er wollte nach dieser Spielzeit aufhören. Sie hat es niemandem gezeigt." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Kellers Büro", scene: sued,
        desc: "Kellers Büro. Regal mit Ordnern, darunter ein Zahlungsbuch. Auf dem leeren Schreibtisch nur ein Monitor und eine Ablage.",
        hotspots: [
          { id: "v4_regal", label: "Regal", x: 12, y: 18, w: 25, h: 50, title: "Das Regal", text: "Haushaltspläne, Verträge, Probenpläne – alles abgezeichnet „J.K.“. Auch der Probenplan vom 9.11.: Reuter auf Mitte, 21:44." },
          { id: "v4_zahlungsbuch", label: "Zahlungsbuch", x: 25, y: 33, w: 6, h: 9, title: "Zahlungsbuch T-17", doc: "zahlungsbuch" },
          { id: "v4_ablage", label: "Ablage", x: 76.5, y: 46, w: 10, h: 6, title: "Die Ablage", text: "Ganz oben: Kellers Reisekostenabrechnung, schon abgezeichnet.", doc: "reisekosten" },
          { id: "v4_monitor", label: "Monitor", x: 58.5, y: 37, w: 15, h: 14.5, title: "Kellers Monitor", text: "Gesperrt. Als Hintergrundbild: der Mond aus „Die Nacht der Masken“. Keller hat den Umbau von Zug 12 selbst genehmigt." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Reuters Büro", scene: west,
        desc: "Reuters Büro. Ein Theaterbild an der Wand, auf dem Schreibtisch eine Notiz, ein Kalender und der Ordner T-17. Rechts ein kleiner Wandtresor.",
        hotspots: [
          { id: "v4_notiz", label: "Notiz", x: 24, y: 47.5, w: 7, h: 5, title: "Ein Zettel auf dem Schreibtisch", doc: "reuternotiz" },
          { id: "v4_kalender", label: "Kalender", x: 35, y: 44.5, w: 8.5, h: 8, title: "Reuters Kalender", doc: "kalender_reuter" },
          { id: "v4_ordner", label: "Ordner T-17", x: 50, y: 42, w: 7.5, h: 10.5, title: "Ordner T-17", doc: "rechnungen", lock: "rechnung" },
          { id: "v4_tresor", label: "Wandtresor", x: 80.5, y: 28.5, w: 14, h: 21, title: "Reuters Tresor", lock: "tresor" },
          { id: "v4_bild", label: "Bild", x: 11.5, y: 15.5, w: 28.5, h: 25.5, title: "Ein Bühnenfoto", text: "Ein junger Reuter in Trenchcoat und Hut, Spielzeit 1987/88." },
          { id: "v4_zurueck", label: "Zurück zur Bühne", x: 2, y: 21, w: 8, h: 50, go: "buehne", via: "door" },
        ],
      },
    ],
    puzzles: {
      stoffprobe: {
        type: "choice", step: true, title: "Die Stoffspur",
        prompt: "Die Kriminaltechnik fand rote Samtfasern am Mond, „Charge unbekannt“. Welche Probe aus dem Musterbuch passt zur Samtkante, die Ruth am Montag am Mond erneuert hat?",
        steps: [{ question: "Welche Probe?", pick: 1, answer: ["0917"], options: [{ id: "0412", label: "Kirsch 0412" }, { id: "0917", label: "Bordeaux 0917" }, { id: "0733", label: "Karmin 0733" }, { id: "0305", label: "Rost 0305" }, { id: "1102", label: "Purpur 1102" }], wrong: "Das Nähprotokoll nennt Farbe und Charge." }],
        button: "Vergleichen",
        objective: "Finde heraus, woher die roten Fasern am Mond stammen.",
        hints: ["Wann kamen die Fasern an den Mond?", "Das Nähprotokoll nennt Uhrzeit und Charge.", "Bordeaux 0917."],
        success: "<b>Bordeaux 0917</b> – dieselbe Charge wie die Samtkante, die Ruth um 17:05 erneuert hat. Die Fasern am Mond sind vier Stunden vor dem Absturz dorthin gekommen. Hagedorns roter Faden zu Ruth hält nicht.",
        onSolve: [],
      },
      stoffspur: {
        type: "wall", title: "Ruth entlasten", button: "Zur Pinnwand",
        prompt: "Hagedorns roter Faden: Ruth Eilers – „Rote Fasern am Mond“.",
        objective: "Widerlege Hagedorns Verdacht gegen Ruth an der Pinnwand.",
        hints: ["Wann kamen die Fasern an den Mond?", "Das Nähprotokoll nennt Uhrzeit und Charge. Häng es an die Wand.", "Ruth-Faden mit dem Nähprotokoll widerlegen."],
        success: "Die Fasern stammen von Ruths Reparatur um 17:05. <b>Ruth Eilers ist entlastet.</b> Von Hagedorns roten Fäden hängt keiner mehr.",
        onSolve: [{ solve: "stoffprobe" }],
      },
      rechnung: {
        type: "choice", title: "Die doppelte Rechnung",
        prompt: "Im Ordner T-17 liegen zwei Rechnungen für dieselbe Reparatur. Beide wurden bezahlt.",
        steps: [
          { question: "Welche ist die Scheinrechnung?", pick: 1, answer: ["btw"], options: [{ id: "hartwig", label: "Hartwig Bühnenbau" }, { id: "btw", label: "BTW Theatertechnik" }], feedback: { 0: "Hartwig hat gearbeitet – im Pförtnerbuch stehen ihre Monteure." }, next: "BTW – ohne Steuernummer, nur ein Postfach." },
          { question: "Wer hat sie freigegeben?", pick: 1, answer: ["keller"], options: [{ id: "reuter", label: "Anton Reuter (A.R.)" }, { id: "keller", label: "Jannis Keller (J.K.)" }, { id: "mahler", label: "Kurt Mahler (Pforte)" }], wrong: "Das Freigabe-Kürzel steht auf der Rechnung und im Zahlungsbuch.", next: "Freigabe: J.K. – Keller selbst." },
          { question: "Wohin floss das Geld?", pick: 1, answer: ["konto_keller"], options: [{ id: "firma_btw", label: "An eine echte Firma BTW" }, { id: "zurueck_hartwig", label: "Zurück an Hartwig" }, { id: "konto_keller", label: "Auf Kellers eigenes Konto" }], wrong: "Vergleiche die IBAN mit allen Unterlagen aus der Verwaltung." },
        ],
        button: "Prüfen",
        objective: "Finde heraus, was Reuter im Ordner T-17 entdeckt hat.",
        hints: [
          "Zwei Firmen, ein Auftrag – nur eine hat gearbeitet.",
          "Das Freigabe-Kürzel steht unten auf der Rechnung; die IBAN steht im Zahlungsbuch. Wo taucht dieselbe IBAN noch auf?",
          "BTW – freigegeben von Keller – IBAN wie auf Kellers Reisekostenabrechnung.",
        ],
        success: "Die IBAN von BTW endet auf <b>…4417 02</b> – dieselbe wie auf Kellers Reisekostenabrechnung. Fünfzehn Rechnungen in drei Jahren: <b>186.400 €</b>. Reuter hat es im Oktober bemerkt.",
        onSolve: [{ evidence: "rechnungsvergleich" }, { message: "m_wessel2" }],
      },
      tresor: {
        type: "code", length: 4, title: "Reuters Tresor",
        prompt: "Ein kleiner Wandtresor, vier Ziffern. Reuter hat ihn erst vor kurzem neu eingestellt – der Aufkleber mit dem Werkscode ist abgerissen.",
        answers: ["1011"],
        wrong: { "0911": "Das ist der Tag der Notiz – er wollte es morgen melden.", "0900": "Die Uhrzeit des Termins – gesucht ist der Tag.", "0910": "Fast – aber in der Reihenfolge, wie man ein Datum schreibt." },
        wrongDefault: "Der Tresor piept zweimal.",
        objective: "Öffne Reuters Tresor.",
        hints: ["Reuter wollte etwas am nächsten Tag tun.", "Sein Kalender zeigt den Termin.", "1011."],
        success: "Der Tresor springt auf. Darin: eine Mappe „T-17“ – und ein Schlüssel mit Anhänger <b>„K-4 Reserve“</b>. Der zweite Schlüssel zur Technik, zur Unterbühne – und zu U-4.",
        onSolve: [{ give: "k4" }, { doc: "mappe_t17" }, { sound: "open" }],
      },
      u4: {
        type: "use", item: "k4", step: true, title: "Tür U-4",
        wrongItem: "Der passt nicht. Schild: Schließung K-4.",
        objective: "Öffne Tür U-4 in der Unterbühne (über die Falltür auf der Bühne).",
        hints: ["Hagedorns Zettel: U-4. Laut Plan liegt der Wartungsgang unter der Unterbühne.", "Auf der Bühne führt eine Falltür hinunter – es ist dunkel. Das Telefon hat eine Taschenlampe.", "Taschenlampe an, Falltür auf der Bühne, Ersatzschlüssel K-4 an der Tür U-4 benutzen."],
        success: "Der Ersatzschlüssel dreht sich schwer. Die Stahltür U-4 geht auf. Dahinter: kalte Luft, ein Gang ohne Licht. Und irgendwo weiter hinten – ein Klopfen.",
        onSolve: [{ flag: "u4_offen" }, { sound: "door" }, { later: { here: true, ms: 1600, actions: [{ sound: "knock" }] } }],
      },
    },
    completeWhen: ["stoffspur", "rechnung", "tresor", "u4"],
  });
})();
