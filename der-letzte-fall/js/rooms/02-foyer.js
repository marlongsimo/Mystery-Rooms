/*
 * BEREICH 2 – FOYER UND PFORTE (Stadttheater) · ca. 12 Min.
 * Rätsel 3 Durchschlag (Bleistift am Register) · 4 Die falsche Uhrzeit (2127) · 5 Schlüsselkasten (B-1).
 * Was du erfährst: Keller hat das Haus nicht verlassen, als er sagte – und er hatte den Schlüssel zur Technik.
 */
(() => {
  const N = window.MRGAME;
  const { T, sheet, tape, door } = N.draw;
  const scene = (p, body) => N.svgScene(p, body, { top: "#0d0a0b", mid: "#2a1d1e", bot: "#170f10", base: "#3a2622", line: "#6b4e33", floorA: "#1a1210", floorB: "#070504" });

  Object.assign(N.items, {
    b1: { name: "Bühnenschlüssel B-1", icon: "⚿", text: "Ein Messingschlüssel mit rotem Anhänger: „B-1 · Bühne“. Er sperrt die Bühnentür im Foyer." },
  });
  Object.assign(N.messages, {
    m_mahler: { from: "Unbekannte Nummer", text: "Den Durchschlag hat noch nie jemand angeschaut. Außer Ihrem Kollegen.<br><span class=\"dim\">– K. Mahler, Pforte</span>" },
  });

  Object.assign(N.docs, {
    uhrzettel: {
      title: "Wartungszettel Foyeruhr", kind: "note", card: { kind: "doc", sub: "„geht 6 Min. vor“" },
      html: `<p class="doc-head">HAUSTECHNIK<br><small>WARTUNGSZETTEL · FOYERUHR</small></p><p class="mono">02.11.2026 – Uhr geht <b>6 Min. vor</b>.<br>Ersatzteil bestellt. Bis dahin bitte nicht verstellen!</p><p class="handwriting sign">Hausmeister Pohl</p>`,
    },
    pfoertner: {
      title: "Pförtnerbuch", kind: "register", card: { kind: "doc", sub: "Keller geht 21:33" },
      html: `<p class="doc-head">PFÖRTNERBUCH<br><small>STADTTHEATER VELDEN · ZEITEN NACH FOYERUHR</small></p>
        <table class="doc-table"><thead><tr><th>Datum</th><th>Zeit</th><th>Name</th><th>Vermerk</th></tr></thead><tbody>
        <tr><td>Mo 9.11.</td><td>18:12</td><td>Hartwig Bühnenbau (2 P.)</td><td>Monteure, Zug 12</td></tr>
        <tr><td>Mo 9.11.</td><td><b>21:33</b></td><td><b>J. Keller</b></td><td>geht – „Feierabend“</td></tr>
        <tr><td>Mo 9.11.</td><td>21:52</td><td>Notruf</td><td>Unfall Bühne</td></tr>
        <tr><td>Mi 11.11.</td><td>20:45</td><td>KHK Hagedorn</td><td>Generalschlüssel ausgegeben</td></tr>
        <tr class="struck"><td>Mi 11.11.</td><td></td><td>Generalschlüssel</td><td>Rückgabe –</td></tr>
        </tbody></table><p class="dim">Die Rückgabe des Generalschlüssels ist nie eingetragen worden.</p>`,
    },
    seitentuer: {
      title: "Protokoll Seitentür", kind: "log", card: { kind: "doc", sub: "Karte 4417 · 21:29" },
      html: `<p class="mono">ZUTRITT SEITENTÜR · SERVERZEIT (FUNKUHR)<br>────────────────────────</p>
        <p class="mono">09.11. 18:05 &nbsp;Karte 2210 &nbsp;Brandt, T.<br>09.11. 18:20 &nbsp;Karte 3302 &nbsp;Seidel, M.<br>09.11. <b>21:29</b> &nbsp;Karte <b>4417</b> &nbsp;<b>Keller, J.</b><br>11.11. 20:51 &nbsp;Generalschl. &nbsp;—</p>
        <p class="mono dim">Nur Eintritte werden protokolliert.</p>`,
    },
    register: {
      title: "Schlüsselregister (Original)", kind: "register",
      html: `<p class="doc-head">SCHLÜSSELREGISTER<br><small>AUSGABE UND RÜCKGABE</small></p>
        <table class="doc-table"><thead><tr><th>Zeit</th><th>Schlüssel</th><th>Empfänger</th><th>Rückgabe</th></tr></thead><tbody>
        <tr><td>Mo 17:40</td><td>B-1</td><td>Brandt</td><td>22:30 ✓</td></tr>
        <tr><td>Mo 20:58</td><td>K-4</td><td><span class="blackened">J. Keller</span></td><td>—</td></tr>
        </tbody></table>
        <p class="dim">Der Name in der zweiten Zeile ist mit schwarzem Filzstift übermalt. Unter dem Blatt steckt ein Durchschreibeblock – das Blatt darunter wirkt leer, aber man sieht feine Eindrücke.</p>`,
    },
    durchschlag: {
      title: "Schlüsselregister, Durchschlag", kind: "register", card: { kind: "doc", sub: "20:58 – K-4 an J. Keller" },
      html: `<p class="doc-head">DURCHSCHLAG<br><small>MIT BLEISTIFT SICHTBAR GEMACHT</small></p>
        <p class="mono">Mo 9.11. · <b>20:58</b> · Schlüssel <b>K-4</b><br>Technik – Schnürboden, Unterbühne, U-4, W-1<br>Empfänger: <b>J. Keller</b> · Rückgabe: —</p>
        <p class="dim">Keller hat seinen Namen oben geschwärzt. Den Durchschlag darunter hat er übersehen.</p>`,
    },
    zeitabgleich: {
      title: "Zeitabgleich Pforte", kind: "note", card: { kind: "doc", sub: "Abgang 21:27 · zurück 21:29" },
      html: `<p class="doc-head">ZEITABGLEICH<br><small>EIGENE NOTIZ</small></p>
        <p>Pförtnerbuch: Keller geht um <b>21:33</b> – nach der Foyeruhr, die <b>6 Minuten vorgeht</b>.<br>→ Er ging tatsächlich um <b>21:27</b>.</p>
        <p>Seitentür (Serverzeit): Karte 4417 um <b>21:29</b>.</p>
        <p class="handwriting">Zwei Minuten nach dem „Feierabend“ war er wieder im Haus.</p>`,
    },
    theaterplan: {
      title: "Fluchtplan Stadttheater", kind: "plan",
      html: `<svg viewBox="0 0 600 380" class="plan-svg" role="img" aria-label="Fluchtplan des Stadttheaters">
        <text x="20" y="28" class="plan-title">ERDGESCHOSS</text>
        <rect x="40" y="45" width="520" height="170" class="plan-wall"/>
        <rect x="40" y="45" width="150" height="170" class="plan-room"/><text x="115" y="125" class="plan-label">FOYER</text><text x="115" y="141" class="plan-small">Pforte · Seitentür</text>
        <rect x="190" y="45" width="230" height="170" class="plan-room"/><text x="305" y="120" class="plan-label">BÜHNE</text><text x="305" y="136" class="plan-small">Lichtregie · Seitenbühne</text>
        <rect x="420" y="45" width="140" height="80" class="plan-room"/><text x="490" y="85" class="plan-label">WERKSTATT</text><text x="490" y="101" class="plan-small">Kostüme</text>
        <rect x="420" y="125" width="140" height="90" class="plan-room"/><text x="490" y="168" class="plan-label">VERWALTUNG</text><text x="490" y="184" class="plan-small">Reuter · Keller</text>
        <text x="20" y="250" class="plan-title">UNTERBÜHNE</text>
        <rect x="190" y="265" width="230" height="60" class="plan-wall"/><rect x="190" y="265" width="230" height="60" class="plan-room dark"/><text x="305" y="300" class="plan-label">UNTERBÜHNE</text>
        <rect x="420" y="285" width="140" height="22" class="plan-tunnel"/><text x="490" y="300" class="plan-small warn">U-4 · Wartungsgang</text>
        <text x="305" y="355" class="plan-small">Darüber: Schnürboden (nur über Technikaufgang, K-4)</text>
      </svg>`,
    },
    theaterzettel: {
      title: "Theaterzettel von 1987", kind: "news",
      html: `<p class="news-head">STADTTHEATER VELDEN · SPIELZEIT 1987/88</p><h4 class="news-title">Der Kommissar</h4><p class="news-sub">Kriminalstück in drei Akten</p><p>In der Titelrolle: <b>Anton Reuter</b></p><p class="handwriting margin">Meine erste große Rolle. Ich wollte immer einmal den lösen, der den Fall löst. – A.R.</p>`,
    },
  });

  /* ---------- Szenen ---------- */
  const clock = (cx, cy, r) => `<g transform="translate(${cx},${cy})"><circle r="${r + 14}" fill="#2a1d14"/><circle r="${r}" fill="#e6dcc3" stroke="url(#f2o-brass)" stroke-width="8"/>
    ${Array.from({ length: 12 }, (_, i) => `<line y1="${-r + 8}" y2="${-r + 20}" stroke="#2a2119" stroke-width="${i % 3 ? 2 : 4}" transform="rotate(${i * 30})"/>`).join("")}
    <line y2="${-r * 0.5}" stroke="#17110b" stroke-width="7" stroke-linecap="round" transform="rotate(${(22 * 30 + 13 * 0.5) % 360})"/><line y2="${-r * 0.78}" stroke="#17110b" stroke-width="4" stroke-linecap="round" transform="rotate(${13 * 6})"/><circle r="7" fill="#17110b"/></g>`;

  const nord = scene("f2n", `
  <rect x="120" y="60" width="960" height="40" fill="#3a2622"/>${T(600, 88, "KASSE · GARDEROBE", { fill: "#d4bc90", size: 16, ls: 6 })}
  <rect x="160" y="300" width="460" height="340" fill="#2a1a16" stroke="#6b4e33" stroke-width="4"/><rect x="180" y="200" width="420" height="100" fill="#120c0a" stroke="#6b4e33" stroke-width="3"/>
  ${T(390, 260, "ABENDKASSE", { fill: "#8e7656", size: 18, ls: 5 })}
  <g>${[0, 1, 2].map((i) => `<rect x="${220 + i * 18}" y="${282 - i * 4}" width="90" height="16" fill="${["#7a2620", "#e6dcc3", "#7a2620"][i]}" transform="rotate(${-4 + i * 3} 265 290)"/>`).join("")}</g>
  <rect x="680" y="180" width="380" height="460" fill="#1a1210"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${700 + i * 40}" y1="200" x2="${700 + i * 40}" y2="240" stroke="#9a9c94" stroke-width="3"/><path d="M${690 + i * 40} 240 q10 140 -4 300 l26 0 q-8 -150 0 -300 z" fill="${["#2c3a44", "#3a2622", "#1f2a22", "#3b3326"][i % 4]}" opacity="${i % 3 === 1 ? 0 : 1}"/>`).join("")}
  <rect x="980" y="110" width="120" height="70" fill="#f4efe3" stroke="#2a2119" stroke-width="3"/>${T(1040, 134, "FLUCHTPLAN", { size: 10 })}<rect x="996" y="142" width="88" height="28" fill="none" stroke="#2c7a3a" stroke-width="2"/><path d="M1000 160 h30 v-10 h30" stroke="#2c7a3a" stroke-width="2" fill="none"/>
  ${tape(120, 560, 1080, 520)}`);

  const ost = scene("f2o", `
  ${clock(420, 270, 120)}
  ${T(420, 450, "FOYERUHR · 1912", { fill: "#8e7656", size: 12, ls: 4 })}
  <g transform="rotate(4 600 330)">${sheet(560, 280, 90, 100, { fill: "#f3e58a" })}</g>
  <path d="M760 640 L760 560 L820 560 L820 500 L880 500 L880 440 L940 440 L940 380 L1000 380 L1000 320 L1200 320 L1200 640 Z" fill="#2a1a16" stroke="#6b4e33" stroke-width="3"/>
  <path d="M740 640 L1000 300" stroke="#b69a6d" stroke-width="5"/>
  ${T(980, 280, "RANG ↑", { fill: "#8e7656", size: 13, ls: 3 })}`);

  const sued = scene("f2s", `
  <rect x="120" y="140" width="960" height="500" fill="#24181a" stroke="#6b4e33" stroke-width="4"/>
  <rect x="160" y="170" width="520" height="210" fill="#0d1416" stroke="#6b4e33" stroke-width="4"/><rect x="170" y="180" width="500" height="190" fill="#141c1e"/>
  ${T(420, 160, "PFORTE", { fill: "#d4bc90", size: 14, ls: 6 })}
  <ellipse cx="420" cy="300" rx="220" ry="90" fill="url(#f2s-glow)"/>
  <rect x="120" y="430" width="620" height="24" fill="#3b2b1e"/>
  <g transform="rotate(-3 260 420)"><rect x="190" y="400" width="150" height="34" fill="#2c3e5a"/><rect x="196" y="404" width="138" height="26" fill="#e6dcc3"/><line x1="265" y1="404" x2="265" y2="430" stroke="#2a2119"/></g>
  <g transform="rotate(2 470 418)"><rect x="400" y="398" width="140" height="38" fill="#e6dcc3"/><rect x="400" y="398" width="140" height="10" fill="#7a2620"/><rect x="412" y="420" width="60" height="5" fill="#111"/>${T(470, 446, "REGISTER", { fill: "#8a8f88", size: 9 })}</g>
  <rect x="780" y="190" width="240" height="300" fill="#2a1d14" stroke="#806040" stroke-width="5"/>${T(900, 214, "SCHLÜSSEL", { fill: "#d4bc90", size: 13, ls: 4 })}
  ${[["B-1", 0, true], ["B-2", 1, true], ["K-4", 2, false], ["V-1", 3, true], ["W-3", 4, true], ["H-2", 5, true]].map(([n, i, has]) => { const x = 820 + (i % 3) * 70, y = 260 + Math.floor(i / 3) * 110; return `<circle cx="${x}" cy="${y}" r="5" fill="url(#f2s-brass)"/>${T(x, y + 82, n, { fill: "#d4bc90", size: 12 })}${has ? `<rect x="${x - 5}" y="${y + 6}" width="10" height="40" rx="2" fill="${n === "B-1" ? "#c9a466" : "#8c6c40"}"/><rect x="${x - 9}" y="${y + 44}" width="18" height="16" rx="3" fill="${n === "B-1" ? "#b3261e" : "#5a4a33"}"/>` : ""}`; }).join("")}
  <rect x="790" y="510" width="110" height="80" rx="6" fill="#1c1f23" stroke="#3d4248" stroke-width="3"/><rect x="800" y="520" width="90" height="34" fill="#0b2a1e"/>${T(845, 542, "SEITENTÜR", { fill: "#9fe0b0", size: 10 })}
  ${Array.from({ length: 6 }, (_, i) => `<rect x="${806 + (i % 3) * 28}" y="${560 + Math.floor(i / 3) * 14}" width="22" height="10" rx="2" fill="#3d4248"/>`).join("")}`);

  const west = scene("f2w", `
  ${door(170, 200, 260, 440, { fill: "#2a1d14", window: "#0b111888", sign: "AUSGANG" })}
  <g transform="rotate(-1 590 330)"><rect x="500" y="150" width="190" height="270" fill="#14161c"/><rect x="510" y="160" width="170" height="250" fill="#3a0d10"/><circle cx="595" cy="250" r="44" fill="#e6c48a" opacity=".85"/>${T(595, 340, "Die Nacht", { fill: "#e6dcc3", serif: true, size: 22, italic: true })}${T(595, 368, "der Masken", { fill: "#e6dcc3", serif: true, size: 22, italic: true })}<rect x="508" y="380" width="174" height="26" fill="#e6dcc3" transform="rotate(-8 595 393)"/>${T(595, 398, "VERSCHOBEN", { fill: "#7a2620", size: 13, ls: 3, rot: -8 })}</g>
  <rect x="740" y="200" width="120" height="150" fill="#1a1210" stroke="url(#f2w-brass)" stroke-width="5"/><rect x="752" y="212" width="96" height="126" fill="#2a2d33"/><circle cx="800" cy="260" r="22" fill="#9a8a78"/><rect x="778" y="282" width="44" height="50" rx="10" fill="#2a2421"/>
  <rect x="735" y="360" width="130" height="20" fill="#3b2b1e"/>${[760, 800, 840].map((x) => `<rect x="${x - 5}" y="${340}" width="10" height="20" fill="#e6dcc3"/><ellipse cx="${x}" cy="336" rx="4" ry="7" fill="#f3c77e" class="flicker"/>`).join("")}
  ${T(800, 400, "Anton Reuter · 1965–2026", { fill: "#d4bc90", size: 11 })}
  ${door(920, 230, 200, 410, { fill: "#3a0d10", sign: "BÜHNE · B-1", signFill: "#2a1d14", signText: "#d4bc90" })}`);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "foyer",
    name: "Foyer und Pforte",
    title: "Foyer und Pforte",
    kicker: "STADTTHEATER VELDEN / ERDGESCHOSS",
    story: "Das Stadttheater. Hagedorns Schlüssel passt. Im Foyer riecht es nach Staub und Lilien – vor Reuters Bild brennen Kerzen. Das Haus ist versiegelt, aber die Pforte ist beleuchtet.",
    ambient: "tick",
    exitVia: "door",
    exitLabel: "Weiter: auf die Bühne",
    views: [
      {
        id: "nord", dir: "NORD", name: "Kasse und Garderobe", scene: nord,
        desc: "Abendkasse und Garderobe, quer davor Absperrband. Auf dem Tresen liegen noch Programmhefte. An der Wand ein Fluchtplan.",
        hotspots: [
          { id: "f2_plan", label: "Fluchtplan", x: 81.5, y: 12, w: 10.5, h: 8.5, title: "Fluchtplan", text: "Du fotografierst den Plan. Ab jetzt zeigt ihn die Karten-App im Telefon.", doc: "theaterplan" },
          { id: "f2_kasse", label: "Abendkasse", x: 14, y: 22, w: 37, h: 18, title: "Abendkasse", text: "Ein Stapel Programmhefte, darauf Karten für die Premiere am Samstag – sie wird nicht stattfinden." },
          { id: "f2_garderobe", label: "Garderobe", x: 57, y: 20, w: 31, h: 40, title: "Garderobe", text: "Leere Bügel. Ein einzelner Mantel hängt noch da, im Kragen ein Namensschild: „A. Reuter“." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Foyeruhr und Treppe", scene: ost,
        desc: "Eine große Uhr von 1912 über dem Foyer. Daneben klebt ein gelber Zettel. Rechts führt die Treppe zum Rang.",
        hotspots: [
          { id: "f2_uhr", label: "Foyeruhr", x: 24, y: 14, w: 22, h: 32, title: "Die Foyeruhr", text: "Sie läuft. Die Zeiger stehen ein paar Minuten weiter als die Uhr auf deinem Telefon." },
          { id: "f2_zettel", label: "Gelber Zettel", x: 46, y: 30.5, w: 8.5, h: 12.5, title: "Ein Zettel neben der Uhr", doc: "uhrzettel" },
          { id: "f2_treppe", label: "Treppe zum Rang", x: 64, y: 34, w: 35, h: 37, title: "Treppe zum Rang", text: "Abgesperrt. Vom Rang aus sieht man nur Zuschauerraum – mit der Tat hat er nichts zu tun." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Pforte", scene: sued,
        desc: "Die Pforte. Auf dem Tresen das Pförtnerbuch und das Schlüsselregister mit Durchschreibeblock. Daneben der Schlüsselkasten und das Terminal der Seitentür.",
        hotspots: [
          { id: "f2_buch", label: "Pförtnerbuch", x: 16, y: 43.5, w: 13, h: 5.5, title: "Das Pförtnerbuch", doc: "pfoertner" },
          { id: "f2_register", label: "Schlüsselregister", x: 33, y: 43, w: 12.5, h: 6.5, title: "Das Schlüsselregister", doc: "register", use: "durchschlag" },
          { id: "f2_kasten", label: "Schlüsselkasten", x: 65, y: 20.5, w: 20.5, h: 34, title: "Der Schlüsselkasten", lock: "schluesselkasten" },
          { id: "f2_terminal", label: "Terminal Seitentür", x: 65.5, y: 56.5, w: 9.5, h: 9.5, title: "Terminal Seitentür", doc: "seitentuer", lock: "uhrzeit" },
          { id: "f2_fenster", label: "Pfortenfenster", x: 13.5, y: 19, w: 43, h: 23, title: "Hinter der Scheibe", text: "Die Pförtnerloge ist leer. Herr Mahler hat Feierabend – die Lampe hat er für die Polizei brennen lassen." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Eingang und Plakate", scene: west,
        desc: "Der Haupteingang, durch den du gekommen bist. Ein Plakat der verschobenen Premiere, ein Gedenkbild mit Kerzen – und die Bühnentür.",
        hotspots: [
          { id: "f2_ausgang", label: "Zurück ins Präsidium", x: 13, y: 21, w: 23, h: 50, go: "buero", via: "door" },
          { id: "f2_plakat", label: "Plakat", x: 41.5, y: 16.5, w: 16, h: 30, title: "Premierenplakat", text: "„Die Nacht der Masken“ – ein riesiger Mond über einer Frau mit Maske. Quer darüber: VERSCHOBEN." },
          { id: "f2_gedenk", label: "Gedenkbild", x: 61.5, y: 22, w: 10, h: 17, secret: true, title: "Hinter dem Gedenkbild", text: "Du hebst das Bild kurz an. Dahinter klemmt ein vergilbter Theaterzettel.", doc: "theaterzettel" },
          { id: "f2_buehne", label: "Bühnentür", x: 76.5, y: 25.5, w: 17, h: 46, go: "buehne", via: "door", title: "Die Bühnentür", text: "Abgeschlossen. Auf dem Schild: „Bühne – Schließung B-1“." },
        ],
      },
    ],
    puzzles: {
      durchschlag: {
        type: "use", item: "bleistift", title: "Der Durchschlag",
        wrongItem: "Damit drückst du nur noch mehr ein. Du brauchst etwas, das abfärbt.",
        objective: "Finde heraus, wessen Name im Schlüsselregister geschwärzt wurde.",
        hints: [
          "Ein Name wurde geschwärzt – aber Register werden mit Durchschlag geführt.",
          "Das Blatt darunter wirkt leer. Mit einem weichen Stift kann man eingedrückte Schrift sichtbar machen.",
          "Bleistift aus Hagedorns Büro am Schlüsselregister benutzen.",
        ],
        success: "Du schraffierst vorsichtig über das leere Blatt. Graue Linien, dann Buchstaben: <b>20:58 – K-4 – J. Keller</b>. Rückgabe: keine.",
        onSolve: [{ sound: "pencil" }, { evidence: "durchschlag" }, { message: "m_mahler" }],
      },
      uhrzeit: {
        type: "code", length: 4, title: "Die falsche Uhrzeit",
        prompt: "Das Terminal hat eine Funktion <b>ABGLEICH</b>: „Tatsächliche Uhrzeit des Abgangs eingeben (hhmm).“ – Wann verließ Keller das Haus wirklich?",
        answers: ["2127"],
        wrong: { 2139: "Die Uhr geht vor – nicht nach.", 2133: "Das ist die Zeit der Foyeruhr.", 2129: "Das ist die Zeit an der Seitentür." },
        wrongDefault: "Das passt zu keinem der Belege.",
        objective: "Gleiche Kellers Abgang im Pförtnerbuch mit der echten Uhrzeit ab.",
        hints: [
          "Zwei Uhren, zwei Zeiten – nur eine geht richtig.",
          "Neben der Foyeruhr hängt ein Wartungszettel; das Seitentür-Terminal nutzt die Serverzeit.",
          "21:33 minus 6 Minuten: 2127.",
        ],
        success: "Abgang 21:27 – und um 21:29 öffnet Kellers Karte 4417 die Seitentür. <b>Zwei Minuten nach seinem „Feierabend“ war er wieder im Haus.</b> Du notierst dir den Zeitabgleich.",
        onSolve: [{ evidence: "zeitabgleich" }],
      },
      schluesselkasten: {
        type: "choice", title: "Der Schlüsselkasten",
        prompt: "Der Kasten ist offen. Sechs Haken, einer ist leer. Die Bühnentür im Foyer hat die Schließung, die auf ihrem Schild steht.",
        steps: [{ question: "Welchen Schlüssel nimmst du?", pick: 1, answer: ["b1"], options: [{ id: "b1", label: "B-1 · Bühne" }, { id: "b2", label: "B-2 · Bühne Seiteneingang" }, { id: "k4", label: "K-4 · Technik, Unterbühne, Gänge" }, { id: "v1", label: "V-1 · Verwaltung" }], wrong: "Schau dir das Schild an der Bühnentür an." }],
        button: "Nehmen",
        objective: "Finde den Schlüssel für die Bühnentür.",
        hints: [
          "Im Schlüsselkasten hängt, was du brauchst – und es fehlt etwas Wichtiges.",
          "Achte auf die Beschriftung der Haken – und auf das Schild an der Bühnentür.",
          "Nimm B-1; der Haken K-4 ist leer, und im Register fehlt die Rückgabe.",
        ],
        success: "Du nimmst <b>B-1</b>. Der Haken daneben ist leer: <b>K-4 – Technik, Unterbühne, Gänge</b>. Laut Register nie zurückgegeben.",
        onSolve: [{ give: "b1" }, { sound: "pickup" }],
      },
    },
    completeWhen: ["durchschlag", "uhrzeit", "schluesselkasten"],
  });
})();
