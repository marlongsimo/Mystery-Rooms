/*
 * BEREICH 5 – WARTUNGSGANG U-4 (unter der Bühne) · ca. 13 Min. · FINALE
 * Rätsel 13 Das Versteck (Taschenlampe, Bodengitter → P-4) · 14 Die Kammer (4417) · 15 Die Beweisführung (Pinnwand).
 * Der Gang ist stockdunkel: ohne Taschenlampe sind nur Tür, Klopfen und Kammer zu finden.
 */
(() => {
  const N = window.MRGAME;
  const { T, door } = N.draw;
  const scene = (p, body) => N.svgScene(p, body, { top: "#050605", mid: "#121513", bot: "#0a0c0b", base: "#1a1d1b", line: "#2a2e2b", floorA: "#121311", floorB: "#040404" });
  const DARK = { x: 0, y: 5, w: 100, h: 95 };

  Object.assign(N.messages, {
    m_wessel3: { from: "Dr. Wessel", text: "Ich habe Ihren Bericht gelesen. Ich schicke eine Streife. Und einen Krankenwagen." },
  });
  Object.assign(N.docs, {
    tuch: {
      title: "Tuch aus dem Werkzeugschrank", kind: "photo", card: { kind: "photo", sub: "Stempel „Verwaltung“, leer",
        art: `<svg viewBox="0 0 130 150" preserveAspectRatio="xMidYMid slice"><rect width="130" height="150" fill="#1d1f24"/><path d="M20 40 q45 -20 90 0 l-6 80 q-40 14 -80 0 z" fill="#e6dcc3"/><path d="M60 50 l6 60" stroke="#c9bfa8" stroke-width="7"/><rect x="34" y="96" width="44" height="14" fill="none" stroke="#2c5a8a" stroke-width="2"/></svg>` },
      html: `<p>Ein weißes Baumwolltuch, in der Ecke ein blauer Stempel: <b>„Verwaltung – Stadttheater Velden“</b>. In der Mitte zeichnet sich die Form eines langen Stifts ab – ein Ölrand, mehr nicht. Was darin eingewickelt war, ist weg.</p>`,
    },
    p4: {
      title: "Sicherungsstift P-4", kind: "photo", card: { kind: "photo", sub: "aus dem Wartungsgang, Spitze verbogen",
        art: `<svg viewBox="0 0 130 150" preserveAspectRatio="xMidYMid slice"><rect width="130" height="150" fill="#1d1f24"/><rect x="58" y="20" width="12" height="100" rx="4" fill="#9a9c94"/><path d="M58 118 q6 18 18 14" stroke="#9a9c94" stroke-width="8" fill="none"/><circle cx="64" cy="22" r="12" fill="#c9a466"/><text x="64" y="27" text-anchor="middle" font-size="12" fill="#2a2119" font-family="monospace">P-4</text></svg>` },
      html: `<p class="doc-head">FUNDSTÜCK · WARTUNGSGANG U-4</p><p>Sicherungsstift <b>P-4</b>, Messingkopf, die Spitze verbogen – genau wie die Verriegelung am Handablass von Zug 12. Versteckt unter dem Bodengitter, darüber in die Wand geritzt: <b>„H. ↓“</b>.</p><p class="dim">Hagedorn hat ihn gefunden, bevor Keller ihn wiederholen konnte.</p>`,
    },
    notizbuch: {
      title: "Hagedorns Notizbuch, erste Seite", kind: "note",
      html: `<p class="doc-head">FALL REUTER<br><small>MO 9.11. · 23:40</small></p><p class="handwriting big"><s>Unfall?</s><br>Nein.</p><p class="handwriting">Wer stellt einen Intendanten genau unter den Mond – und löscht dann das Licht?</p>`,
    },
  });

  /* ---------- Szenen ---------- */
  const pipes = `<g stroke="#3a3c37" stroke-width="18" fill="none"><path d="M0 120 H1200"/><path d="M0 170 H1200" stroke-width="10"/></g><g fill="#2a2b28">${[200, 520, 840].map((x) => `<rect x="${x}" y="104" width="20" height="34"/>`).join("")}</g>`;
  const nord = scene("u5n", `${pipes}
  ${door(440, 220, 320, 420, { fill: "#3d4248", stroke: "#24272b", handle: "#9a9c94", sign: "U-4 · NUR TECHNIK", signFill: "#e8c84a" })}
  <path d="M600 200 l0 -20" stroke="#5a5c55" stroke-width="3"/>`);
  const ost = scene("u5o", `${pipes}
  <rect x="380" y="200" width="300" height="440" fill="#3d4248" stroke="#24272b" stroke-width="5"/><rect x="380" y="200" width="300" height="440" fill="#2a2d33" data-unless="schrank_offen"/>
  <g data-if="schrank_offen"><rect x="392" y="212" width="276" height="416" fill="#0d0e0d"/>${[320, 440, 560].map((y) => `<rect x="392" y="${y}" width="276" height="8" fill="#3d4248"/>`).join("")}<path d="M440 430 q80 -20 160 0 l-10 10 q-70 10 -140 0 z" fill="#e6dcc3"/><g fill="#5a4a33"><rect x="440" y="520" width="40" height="34" rx="6"/><rect x="490" y="520" width="40" height="34" rx="6"/></g></g>
  ${T(530, 190, "W-1", { fill: "#e8c84a", size: 16, ls: 4 })}<rect x="640" y="400" width="12" height="40" rx="3" fill="#9a9c94"/>
  <g stroke="#3a3c37" stroke-width="3">${[800, 860, 920].map((x) => `<line x1="${x}" y1="300" x2="${x}" y2="640"/>`).join("")}</g>`);
  const sued = scene("u5s", `${pipes}
  <polygon points="300,760 520,300 680,300 900,760" fill="#121311"/><rect x="520" y="200" width="160" height="100" fill="#050505"/>
  <g transform="translate(860,330)"><rect x="-6" y="0" width="12" height="80" fill="#5a5c55"/><path d="M-6 0 h40 v12 h-28" fill="#5a5c55"/><circle cx="30" cy="20" r="4" fill="#7fa0b0" class="drip-dot"/></g>
  <rect x="760" y="640" width="200" height="60" fill="#1d1f1c" stroke="#3a3c37" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${772 + i * 22}" y1="644" x2="${772 + i * 22}" y2="696" stroke="#3a3c37" stroke-width="4"/>`).join("")}
  <g data-unless="versteck_leer"><rect x="848" y="676" width="54" height="8" rx="3" fill="#c9a466" opacity=".9"/></g>
  <g stroke="#9a9c94" stroke-width="4" fill="none" opacity=".75"><path d="M860 480 v90 m-16 -18 l16 18 l16 -18"/></g>${T(904, 520, "H.", { fill: "#9a9c94", size: 28, hand: true })}`);
  const west = scene("u5w", `${pipes}
  <rect x="320" y="220" width="320" height="420" fill="#2a1f16" stroke="#1a130d" stroke-width="6"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="${320 + i * 64}" y1="222" x2="${320 + i * 64}" y2="638" stroke="#1a130d" stroke-width="3"/>`).join("")}
  <g data-unless="hagedorn_frei"><rect x="600" y="400" width="60" height="18" fill="#5a5c55"/><rect x="644" y="410" width="34" height="44" rx="5" fill="#2a2b28" stroke="#9a9c94" stroke-width="3"/><path d="M652 410 v-14 a9 9 0 0 1 18 0 v14" stroke="#9a9c94" stroke-width="4" fill="none"/>${T(661, 444, "4", { fill: "#e8c84a", size: 10 })}</g>
  <g data-if="hagedorn_frei"><rect x="320" y="220" width="320" height="420" fill="#0d0b09"/><polygon points="320,220 240,250 240,620 320,640" fill="#2a1f16" stroke="#1a130d" stroke-width="4"/>
    <rect x="400" y="520" width="180" height="90" fill="#3b2b1e"/><circle cx="490" cy="420" r="30" fill="#8a7a6a"/><path d="M450 470 q40 -20 80 0 l14 60 h-108 z" fill="#3a3326"/><rect x="540" y="500" width="22" height="30" fill="#c9d6e0" opacity=".7"/>
    <rect x="420" y="560" width="50" height="34" fill="#e6dcc3" transform="rotate(-8 445 577)"/></g>
  ${T(480, 200, "KAMMER", { fill: "#8a8f88", size: 13, ls: 4 })}`);

  /* ---------- Finale ---------- */
  const svg = (b) => `<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${b}</svg>`;
  const fWand = svg(`<rect width="1200" height="700" fill="#0b0c0e"/><rect x="150" y="90" width="900" height="520" fill="#5a3f27"/><rect x="164" y="104" width="872" height="492" fill="#a97e52"/>
    ${[[230, 380], [420, 470], [700, 470], [520, 140], [300, 160], [760, 160]].map(([x, y]) => `<path d="M${x + 34} ${y + 44} Q${(x + 940) / 2} ${(y + 400) / 2 + 40} 940 400" stroke="#2e8a55" stroke-width="4" fill="none" class="fz-thread"/>`).join("")}
    ${[[230, 380], [420, 470], [700, 470], [520, 140], [300, 160], [760, 160]].map(([x, y]) => `<rect x="${x}" y="${y}" width="68" height="88" fill="#f4efe3"/>`).join("")}
    <rect x="900" y="340" width="90" height="118" fill="#f7f4ee"/><rect x="908" y="348" width="74" height="80" fill="#2a2d33"/><circle cx="945" cy="380" r="16" fill="#c9a07a"/>
    <g transform="rotate(-14 945 400)"><rect x="890" y="384" width="112" height="32" fill="none" stroke="#b3261e" stroke-width="4"/><text x="946" y="408" text-anchor="middle" fill="#b3261e" font-family="DM Mono, monospace" font-size="17" font-weight="700">ÜBERFÜHRT</text></g>`);
  const fHagedorn = svg(`<rect width="1200" height="700" fill="#070807"/><ellipse cx="600" cy="380" rx="420" ry="300" fill="#e7c88a" opacity=".07"/>
    <rect x="460" y="460" width="280" height="120" fill="#3b2b1e"/><circle cx="600" cy="300" r="56" fill="#8a7a6a"/><path d="M520 380 q80 -40 160 0 l30 90 h-220 z" fill="#3a3326"/>
    <rect x="700" y="400" width="36" height="52" fill="#c9d6e0" opacity=".75"/><g stroke="#3a3c37" stroke-width="18"><path d="M0 120 H1200"/></g>`);
  const fTheater = svg(`<rect width="1200" height="700" fill="#06070a"/><polygon points="300,600 300,260 600,150 900,260 900,600" fill="#141113" stroke="#3a2e2a" stroke-width="2"/>
    <text x="600" y="240" text-anchor="middle" fill="#d9bd8d" font-family="Playfair Display, serif" font-size="30" letter-spacing="6">STADTTHEATER</text>
    <rect x="720" y="430" width="80" height="170" fill="#0a0808" stroke="#5b4430" stroke-width="2"/>
    <g class="fz-blue"><ellipse cx="420" cy="560" rx="300" ry="160" fill="#3b76c4" opacity=".25"/><ellipse cx="980" cy="560" rx="260" ry="140" fill="#3b76c4" opacity=".18"/></g>
    <rect x="300" y="560" width="190" height="60" rx="10" fill="#1c2430"/><rect x="350" y="548" width="80" height="18" rx="4" fill="#3b76c4"/>
    <g fill="#0c0c0e"><circle cx="760" cy="520" r="14"/><rect x="746" y="534" width="28" height="64" rx="6"/><circle cx="820" cy="520" r="14"/><rect x="806" y="534" width="28" height="64" rx="6"/><circle cx="700" cy="524" r="13"/><rect x="687" y="537" width="26" height="60" rx="6"/></g>
    <rect y="600" width="1200" height="100" fill="#0d0c0b"/>`);
  const fVorhang = svg(`<rect width="1200" height="700" fill="#0b0405"/><rect x="0" y="0" width="1200" height="700" fill="#3a0d10"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 76}" y="0" width="38" height="700" fill="#6b1a1e" opacity=".55"/>`).join("")}<rect x="0" y="0" width="1200" height="80" fill="#2a090b"/>`);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "wartungsgang",
    name: "Wartungsgang U-4",
    title: "Wartungsgang U-4",
    kicker: "STADTTHEATER / UNTER DER UNTERBÜHNE",
    story: "Stockdunkel. Es riecht nach Öl und kaltem Beton. Irgendwo tropft ein Wasserhahn. Und von weiter hinten im Gang: Klopfen. Dreimal. Pause. Dreimal.",
    ambient: "drip",
    final: true,
    darkUntil: "gang_hell",
    views: [
      {
        id: "nord", dir: "NORD", name: "Tür U-4", scene: nord, dark: DARK,
        desc: "Die Stahltür, durch die du gekommen bist. Ohne Licht siehst du die Hand vor Augen nicht.",
        descLit: "Die Stahltür U-4.",
        hotspots: [
          { id: "u5_tuer", label: "Zurück zur Bühne", x: 36, y: 22, w: 27, h: 50, go: "buehne", via: "door", always: true },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Werkzeugschrank W-1", scene: ost, dark: DARK,
        desc: "Etwas Großes aus Metall steht hier. Mehr erkennst du im Dunkeln nicht.",
        hotspots: [
          { id: "u5_schrank", label: "Werkzeugschrank W-1", x: 31.5, y: 22, w: 25, h: 49, unless: "schrank_offen", title: "Werkzeugschrank W-1", text: "Die Tür ist nur angelehnt, das Schloss (K-4) offen. Jemand hat es eilig gehabt. Du ziehst sie auf.", actions: [{ flag: "schrank_offen" }, { sound: "open" }], doc: "tuch" },
          { id: "u5_schrank2", label: "Werkzeugschrank W-1", x: 31.5, y: 22, w: 25, h: 49, if: "schrank_offen", title: "Der offene Schrank", text: "Arbeitshandschuhe, Ölkännchen – und das leere Tuch mit dem Stempel der Verwaltung. Hier lag P-4. Keller hat ihn Montagnacht hier versteckt. Und dann war er weg.", doc: "tuch" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Der Gang", scene: sued, dark: DARK,
        desc: "Der Gang. Du hörst das Tropfen eines Wasserhahns – links? rechts? Im Dunkeln verlierst du die Richtung.",
        hotspots: [
          { id: "u5_hahn", label: "Wasserhahn", x: 70, y: 36, w: 7, h: 10, title: "Ein Wasserhahn", text: "Er tropft. Daneben ein Plastikbecher. Hier hat jemand getrunken – in den letzten zwei Tagen." },
          { id: "u5_pfeil", label: "Zeichen an der Wand", x: 69, y: 52, w: 10, h: 13, title: "In die Wand geritzt", text: "Ein Pfeil nach unten. Daneben, mit etwas Spitzem in den Putz gekratzt: <b>H.</b>" },
          { id: "u5_gitter", label: "Bodengitter", x: 63, y: 71, w: 17, h: 7, unless: "versteck_leer", solves: "versteck", title: "Das Bodengitter" },
          { id: "u5_gitter2", label: "Bodengitter", x: 63, y: 71, w: 17, h: 7, if: "versteck_leer", title: "Das Bodengitter", text: "Darunter nur noch Staub. Den Stift hast du." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Kammer", scene: west, dark: DARK,
        desc: "Hier ist das Klopfen am lautesten. Eine Holztür – du ertastest einen Riegel und ein Vorhängeschloss.",
        descLit: "Eine Holztür mit Riegel und Vorhängeschloss mit vier Rädchen. Von innen: Klopfen.",
        hotspots: [
          { id: "u5_kammer", label: "Holztür", x: 26.5, y: 24, w: 27, h: 47, unless: "hagedorn_frei", always: true, sound: "knock", title: "Die Kammer", lock: "kammer" },
          { id: "u5_hagedorn", label: "Hagedorn", x: 33, y: 29, w: 19, h: 40, if: "hagedorn_frei", always: true, title: "Rainer Hagedorn", text: "„Den Stift hat er nicht gefunden? Gut.“ Er trinkt, die Hand zittert. „Hast du den Rest? Dann zeig es mir – so, dass Wessel es nicht wegwischen kann.“", lock: "beweisfuehrung" },
          { id: "u5_notizbuch", label: "Notizbuch", x: 34.5, y: 61, w: 6, h: 5, if: "hagedorn_frei", always: true, secret: true, title: "Hagedorns Notizbuch", text: "Er hält es dir hin, ohne etwas zu sagen. Die erste Seite.", doc: "notizbuch" },
        ],
      },
    ],
    puzzles: {
      versteck: {
        title: "Das Versteck",
        objective: "Finde heraus, wo P-4 geblieben ist.",
        hints: [
          "Das Tuch ist leer – jemand war schneller als Keller.",
          "Hagedorn hinterlässt Zeichen mit „H.“ – hier unten siehst du ohne Licht nichts.",
          "Taschenlampe an, im Gang (Süden) das Bodengitter unter dem Pfeil.",
        ],
        success: "Du hebst das Gitter an. Darunter, in einer Pfütze aus Staub: ein Metallstift mit Messingkopf. <b>P-4</b>, die Spitze verbogen. Hagedorn hat ihn hier versteckt, bevor Keller kam.",
        onSolve: [{ flag: "versteck_leer" }, { evidence: "p4" }, { sound: "pickup" }],
      },
      kammer: {
        type: "code", length: 4, title: "Die Kammer",
        prompt: "Ein Vorhängeschloss mit vier Rädchen. Von innen klopft es wieder – schwächer. Hagedorns Frage an der Wand: „Benutzt K. überall dieselbe Nummer?“",
        answers: ["4417"],
        wrong: { 2144: "Das ist Hagedorns Code, nicht Kellers.", 2127: "Kellers Uhrzeit – nicht seine Nummer.", 1011: "Das war Reuters Tresor." },
        wrongDefault: "Das Schloss bleibt zu. Von innen, heiser: „Seine Nummer …“",
        objective: "Öffne die Kammer am Ende des Gangs.",
        hints: [
          "Hagedorn hatte einen Verdacht über Kellers Zahlen – steht als Notiz an der Wand.",
          "Eine Nummer von Keller steht in einem Protokoll im Foyer – und im Zahlungsbuch.",
          "4417.",
        ],
        success: "Das Schloss springt auf. Du schiebst den Riegel zurück. Auf einer Kiste sitzt <b>Rainer Hagedorn</b> – unrasiert, blass, die Augen zusammengekniffen gegen dein Licht. „Na endlich“, sagt er. „Du hast meine Wand mitgebracht?“",
        onSolve: [{ flag: "hagedorn_frei" }, { sound: "door" }],
      },
      beweisfuehrung: {
        type: "wall", focus: "proof", title: "Die Beweisführung", button: "Beweisführung öffnen",
        prompt: "Hagedorn: „Vier Dinge braucht Wessel: wie er reinkam, dass er da war, womit – und warum. Und keinen einzigen falschen Verdacht mehr an der Wand.“",
        objective: "Schick Dr. Wessel die Beweisführung gegen den Täter – von der Pinnwand.",
        hints: [
          "Jedes Feld braucht einen Beweis, keine Vermutung. Vorher müssen alle drei roten Fäden widerlegt sein.",
          "Schlüssel, Uhrzeit, Stift, Geld – häng die passenden Beweise an die Wand.",
          "Zugang: Durchschlag · Gelegenheit: Zeitabgleich Pforte · Mittel: Sicherungsstift P-4 · Motiv: Reuters Notiz.",
        ],
        success: "Bericht verschickt.",
        onSolve: [{ message: "m_wessel3" }],
      },
    },
    completeWhen: ["versteck", "kammer", "beweisfuehrung"],
    finale: {
      steps: [
        { scene: fWand, text: "An der Wand laufen die Fäden zusammen. Alle zu einem Namen: Jannis Keller.", ms: 6000, sound: "stamp" },
        { scene: fHagedorn, text: "Hagedorn, auf der Kiste, den Becher in beiden Händen: „Zwei Nächte habe ich gezählt, wie oft der Inspizient ‚Achtung Mondszene‘ gerufen hätte.“", ms: 8000 },
        { message: "m_wessel3", ms: 7000, sound: "buzz" },
        { scene: fTheater, text: "Blaulicht vor dem Theater. Keller kommt aus der Seitentür – Karte 4417 in der Hand. In seiner Tasche: Schlüssel K-4 und der Generalschlüssel des Hauses.", ms: 9000, sound: "siren", sceneClass: "blue" },
        { scene: fVorhang, text: "Der letzte Vorhang fällt.", ms: 5000, big: true, music: null },
        { end: "Fall abschließen" },
      ],
    },
  });
})();
