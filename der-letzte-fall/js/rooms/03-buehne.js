/*
 * BEREICH 3 – BÜHNE UND LICHTREGIE · ca. 22 Min.
 * Rätsel 6 Die letzte Probe (Sortieren) · 7 Der fehlende Stift (P-4) · 8 Wer war im Blackout wo? (Pinnwand)
 * · 9 Hagedorns letzte Notiz (Regiebuch, Seite „Schlussvorhang“ → U-4).
 * Was du erfährst: Der Mond fiel nicht von selbst. Timo und Mira konnten es nicht gewesen sein.
 */
(() => {
  const N = window.MRGAME;
  const { T, sheet, tape, door } = N.draw;
  const scene = (p, body, pal = {}) => N.svgScene(p, body, { top: "#050506", mid: "#121214", bot: "#0b0b0c", base: "#17171a", line: "#2a2a2e", floorA: "#1b1612", floorB: "#080605", ...pal });

  Object.assign(N.docs, {
    protokolle: {
      title: "Licht- und Zugprotokoll (Auszug)", kind: "log",
      html: `<p class="mono">STEUERUNG · PROBE 09.11.2026<br>────────────────────────</p>
        <p class="mono">21:38:00 &nbsp;VR<br>21:44:00 &nbsp;LS47<br>21:44:12 &nbsp;Z12-H<br>21:45:03 &nbsp;AL</p>
        <p class="mono dim">Kürzel ohne Erklärung. Die Regiezettel am Pult haben Klartext, aber keine Uhrzeiten.</p>`,
    },
    zugprotokoll: {
      title: "Zugprotokoll Obermaschinerie", kind: "log", card: { kind: "doc", sub: "21:44:12 · Z12-H (Handablass)" },
      html: `<p class="mono">OBERMASCHINERIE · ZUG 12<br>────────────────────────</p>
        <p class="mono">21:38:00 &nbsp;VR &nbsp;&nbsp;&nbsp;Vorbereitungsruf Mondszene<br>21:44:00 &nbsp;LS47 &nbsp;Lichtstimmung 47 – Blackout<br><b>21:44:12 &nbsp;Z12-H &nbsp;Zug 12 – HANDABLASS (Schnürboden)</b><br>21:45:03 &nbsp;AL &nbsp;&nbsp;&nbsp;Arbeitslicht</p>
        <p class="handwriting margin">Kein Motor, kein Defekt: Jemand hat oben den Hebel gezogen – im Dunkeln.</p>`,
    },
    kontrollliste: {
      title: "Kontrollliste Zug 12", kind: "register", card: { kind: "doc", sub: "21:10 · Bremsstift gesteckt" },
      html: `<p class="doc-head">SICHERHEITSKONTROLLE<br><small>OBERMASCHINERIE · 9.11.2026</small></p>
        <table class="doc-table"><tbody><tr><td>21:10</td><td>Zug 12 – Bremsstift gesteckt ✓</td><td>T.B.</td></tr><tr><td>21:10</td><td>Zug 11 – ✓</td><td>T.B.</td></tr></tbody></table>
        <p class="dim">Welcher Stift, steht nicht da.</p>`,
    },
    zug12: {
      title: "Schema Zug 12", kind: "plan", card: { kind: "doc", sub: "Obermaschinerie" },
      html: `<svg viewBox="0 0 520 250" role="img" aria-label="Schema: Züge, Bremsen und Steckplätze" style="width:100%;height:auto">
        <g font-family="DM Mono, monospace" font-size="12" fill="#2a2119">
          ${["Zug 10", "Zug 11", "Zug 12", "Zug 13"].map((z, i) => `<text x="20" y="${44 + i * 50}">${z}</text>`).join("")}
          ${["B1", "B2", "B3", "B4"].map((b, i) => `<rect x="200" y="${28 + i * 50}" width="56" height="24" fill="none" stroke="#2a2119"/><text x="228" y="${45 + i * 50}" text-anchor="middle">${b}</text>`).join("")}
          ${["P-1", "P-2", "P-3", "P-4", "P-5", "P-6"].map((pp, i) => `<circle cx="420" cy="${28 + i * 38}" r="9" fill="none" stroke="#2a2119"/><text x="440" y="${32 + i * 38}">${pp}</text>`).join("")}
          <path d="M80 40 L200 40" stroke="#2a2119"/><path d="M80 90 L200 90" stroke="#2a2119"/><path d="M80 140 L200 140" stroke="#7a2620" stroke-width="2.5"/><path d="M80 190 L200 190" stroke="#2a2119"/>
          <path d="M256 40 Q340 40 411 66" stroke="#2a2119" fill="none"/><path d="M256 90 Q340 120 411 218" stroke="#2a2119" fill="none"/><path d="M256 140 Q340 130 411 142" stroke="#7a2620" stroke-width="2.5" fill="none"/><path d="M256 190 Q340 120 411 28" stroke="#2a2119" fill="none"/>
        </g></svg>
        <p class="mono">Bremse = Federspeicher. Notablass: Handhebel auf dem Schnürboden, im Probenbetrieb mit Stift blockiert.</p>`,
    },
    regiebuch: {
      title: "Regiebuch „Die Nacht der Masken“", kind: "letter", card: { kind: "doc", sub: "Mira: Rampe links · A.R. auf Mitte" },
      pageLabels: ["Bild 4 – Mondszene", "Bild 5 – Maskenball", "Bild 6 – Schlussvorhang"],
      pages: [
        `<p class="doc-head">BILD 4 · MONDSZENE</p><p class="mono">LS 47 – Blackout. Zug 12 fährt den Mond auf 3 m (Motor).</p><p><b>Mira</b> (Rampe links) spricht den Monolog im Dunkeln.</p><p class="handwriting">9.11., 21:15: A.R. steht heute selbst auf Markierung <b>Mitte</b> und prüft das Licht im Blackout. – Probenplan an Verw. (J.K.) zur Kenntnis</p>`,
        `<p class="doc-head">BILD 5 · MASKENBALL</p><p>Ensemble. Umbau hinter Gaze. Licht LS 52.</p>`,
        `<p class="doc-head">BILD 6 · SCHLUSSVORHANG</p><p>Alle an die Rampe. Vorhang. Applaus.</p><p class="dim">Zwischen den Seiten steckt etwas – man sieht es nur, wenn man genau diese Seite aufschlägt.</p>`,
      ],
    },
    probenmitschnitt: {
      title: "Probenmitschnitt (Abschrift)", kind: "log", card: { kind: "doc", sub: "21:44:05 · Miras Monolog" },
      html: `<p class="mono">BÜHNENMIKROFON RAMPE LINKS · 9.11.2026<br>────────────────────────</p>
        <p class="mono">21:44:05 &nbsp;Seidel: „Wenn der Mond fällt, fällt auch die Nacht …“<br>21:44:12 &nbsp;[lauter Schlag, Metall]<br>21:44:13 &nbsp;Seidel schreit.<br>21:44:40 &nbsp;Seidel: „Licht! Macht Licht!“</p>
        <p class="mono dim">Die Stimme ist die ganze Zeit gleich nah am Mikrofon.</p>`,
    },
    sprechanlage: {
      title: "Mitschnitt Sprechanlage (Abschrift)", kind: "log", card: { kind: "doc", sub: "21:44:08 · Lichtpult" },
      html: `<p class="mono">INSPIZIENZ ↔ LICHTPULT · 9.11.2026<br>────────────────────────</p>
        <p class="mono">21:38:00 &nbsp;Insp.: „Achtung Mondszene.“<br>21:44:08 &nbsp;<b>Brandt (Lichtpult)</b>: „Blackout steht, warte auf Freigabe.“<br>21:44:12 &nbsp;[Schlag]<br>21:44:15 &nbsp;Brandt: „Was war das? Arbeitslicht?“</p>`,
    },
    hagedorn_notiz: {
      title: "Hagedorns Zettel im Regiebuch", kind: "note",
      html: `<p class="handwriting big">… suche dort, wo kein Applaus ankommt.<br><b>U-4.</b></p><p class="handwriting sign">H. · Mi 20:50</p>`,
    },
  });

  /* ---------- Szenen ---------- */
  const nord = scene("b3n", `
  <rect x="0" y="44" width="160" height="716" fill="url(#b3n-velvet)"/><rect x="1040" y="44" width="160" height="716" fill="url(#b3n-velvet)"/>
  <rect x="0" y="44" width="1200" height="70" fill="#3a0d10"/>
  <ellipse cx="600" cy="560" rx="380" ry="180" fill="url(#b3n-cold)"/>
  <rect y="640" width="1200" height="120" fill="#2a2018"/><g stroke="#1a130d" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="640" x2="${i * 100 - 40}" y2="760"/>`).join("")}</g>
  <line x1="600" y1="44" x2="600" y2="480" stroke="#4a4c46" stroke-width="3"/><line x1="520" y1="44" x2="560" y2="470" stroke="#4a4c46" stroke-width="2"/>
  <g transform="rotate(-14 600 560)"><path d="M600 420 a150 150 0 1 0 0.1 0 Z M670 450 a115 115 0 1 1 -0.1 0 Z" fill="#d8cfa8" fill-rule="evenodd" stroke="#6b1a1e" stroke-width="9"/>
    <path d="M600 420 a150 150 0 0 0 -120 230 L600 560 Z" fill="#c9bf98" opacity=".6"/><path d="M520 470 l40 50 l-14 40 l36 30" stroke="#4a4232" stroke-width="5" fill="none"/><path d="M470 600 l50 -8" stroke="#4a4232" stroke-width="4"/></g>
  <ellipse cx="600" cy="690" rx="190" ry="18" fill="#000" opacity=".45"/>
  <path d="M520 700 l30 -10 l20 14 l-26 10 z" fill="#d8cfa8"/><path d="M700 690 l24 -6 l10 12 z" fill="#d8cfa8"/>
  <path d="M580 720 h40 M600 700 v40" stroke="#e8c84a" stroke-width="5"/>${T(600, 752, "MITTE", { fill: "#e8c84a", size: 11 })}
  ${tape(170, 610, 1030, 640)}
  <rect x="880" y="690" width="130" height="50" fill="#14100c" stroke="#3a2c22" stroke-width="3"/><rect x="938" y="708" width="16" height="10" rx="3" fill="#806040"/>${T(945, 682, "FALLTÜR", { fill: "#8a8f88", size: 10 })}`);

  const ost = scene("b3o", `
  <rect x="120" y="120" width="960" height="300" fill="#0d0f12" stroke="#2a2a2e" stroke-width="6"/>
  <rect x="140" y="140" width="920" height="260" fill="#11141a"/>${T(600, 200, "BLICK AUF DIE BÜHNE", { fill: "#3a3c40", size: 14, ls: 6 })}
  <rect x="160" y="440" width="560" height="120" fill="#1c1f23" stroke="#3d4248" stroke-width="3"/>
  ${Array.from({ length: 24 }, (_, i) => `<rect x="${180 + (i % 12) * 44}" y="${460 + Math.floor(i / 12) * 44}" width="10" height="34" fill="#2a2d33"/><rect x="${176 + (i % 12) * 44}" y="${470 + ((i * 7) % 18) + Math.floor(i / 12) * 44}" width="18" height="8" fill="#9a9c94"/>`).join("")}
  <rect x="740" y="330" width="220" height="150" rx="6" fill="#15171a" stroke="#3d4248" stroke-width="5"/><rect x="752" y="342" width="196" height="112" fill="#0b2a1e"/>
  ${T(850, 372, "VR · LS47", { fill: "#9fe0b0", size: 13 })}${T(850, 396, "Z12-H · AL", { fill: "#9fe0b0", size: 13 })}${T(850, 432, "PROTOKOLL", { fill: "#5a8a70", size: 10 })}
  <rect x="990" y="460" width="120" height="90" rx="6" fill="#2a2b28" stroke="#4a4c46" stroke-width="3"/><circle cx="1025" cy="505" r="18" fill="#141414" stroke="#5a5c55" stroke-width="3"/><circle cx="1075" cy="505" r="18" fill="#141414" stroke="#5a5c55" stroke-width="3"/>${T(1050, 572, "SPRECHANLAGE", { fill: "#8a8f88", size: 10 })}
  <g transform="rotate(-3 300 430)">${sheet(240, 400, 70, 40, { fill: "#f3e58a" })}${sheet(320, 402, 70, 40, { fill: "#f3e58a" })}${sheet(400, 398, 70, 40, { fill: "#f3e58a" })}${sheet(480, 404, 70, 40, { fill: "#f3e58a" })}</g>
  <path d="M600 520 l40 10" stroke="#5a5c55" stroke-width="2"/>`);

  const sued = scene("b3s", `
  <rect x="120" y="44" width="40" height="716" fill="#1c1f23"/>${Array.from({ length: 8 }, (_, i) => `<line x1="200" y1="44" x2="${200 + i * 40}" y2="640" stroke="#3d4248" stroke-width="2" opacity=".6"/>`).join("")}
  <rect x="220" y="260" width="300" height="300" rx="6" fill="#2a2d33" stroke="#4a4c46" stroke-width="5"/>${T(370, 290, "OBERMASCHINERIE", { fill: "#d4bc90", size: 12, ls: 3 })}
  <rect x="240" y="310" width="260" height="120" fill="#0b1418"/>${[0, 1, 2, 3].map((i) => `${T(270, 340 + i * 26, "Z" + (10 + i), { fill: "#9fe0b0", size: 12, anchor: false })}<rect x="320" y="${330 + i * 26}" width="${[120, 80, 150, 60][i]}" height="8" fill="#2a5a48"/>`).join("")}
  <rect x="250" y="450" width="240" height="90" fill="#e6dcc3"/>${T(370, 470, "SCHEMA ZUG 12", { size: 11 })}<path d="M270 500 h80 l40 -20 h60" stroke="#7a2620" stroke-width="2" fill="none"/>
  <rect x="580" y="220" width="160" height="230" fill="#5a3f27"/>${sheet(600, 240, 120, 170, { head: "#2c5a8a" })}${T(660, 432, "KONTROLLE", { fill: "#d4bc90", size: 11 })}
  ${door(820, 180, 230, 460, { fill: "#3d4248", sign: "SCHNÜRBODEN · K-4", signFill: "#e8c84a", stroke: "#24272b", handle: "#9a9c94" })}
  <g stroke="#e8c84a" stroke-width="6" opacity=".7"><line x1="830" y1="600" x2="1040" y2="600"/></g>`);

  const west = scene("b3w", `
  <rect x="140" y="300" width="540" height="300" fill="#1c1f23" stroke="#3d4248" stroke-width="4"/>${T(410, 330, "INSPIZIENZ", { fill: "#d4bc90", size: 12, ls: 4 })}
  <rect x="170" y="350" width="200" height="120" rx="4" fill="#0b1418" stroke="#3d4248" stroke-width="3"/><rect x="180" y="360" width="180" height="100" fill="#141c22"/><path d="M190 440 q60 -40 160 -10" stroke="#3a5a70" stroke-width="2" fill="none"/>
  <g transform="rotate(-4 470 410)"><rect x="400" y="370" width="150" height="90" fill="#3a0d10"/><rect x="408" y="374" width="138" height="82" fill="#e6dcc3"/><line x1="477" y1="374" x2="477" y2="456" stroke="#6c5a44" stroke-width="2"/>${T(442, 420, "REGIE", { size: 10 })}</g>
  <rect x="580" y="380" width="70" height="60" rx="4" fill="#2a2b28" stroke="#4a4c46"/><circle cx="615" cy="410" r="14" fill="#b3261e" class="flicker"/>${T(615, 456, "REC", { fill: "#8a8f88", size: 10 })}
  ${door(820, 220, 240, 420, { fill: "#2a2d33", window: "#e7c88a22", sign: "VERWALTUNG · WERKSTATT" })}
  <ellipse cx="940" cy="330" rx="120" ry="90" fill="url(#b3w-glow)"/>`);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "buehne",
    name: "Bühne und Lichtregie",
    title: "Bühne und Lichtregie",
    kicker: "STADTTHEATER / HAUPTBÜHNE",
    story: "Die Bühne. Nur das Notlicht brennt. In der Mitte liegt der Mond – gesprungen, hinter Absperrband. Hier ist Anton Reuter gestorben.",
    ambient: "hum",
    exitVia: "door",
    exitLabel: "Weiter: Verwaltung und Werkstatt",
    views: [
      {
        id: "nord", dir: "NORD", name: "Die Bühne", scene: nord,
        desc: "Der zerbrochene Mond hinter Absperrband, darüber die leeren Seile von Zug 12. Auf dem Boden eine Markierung: MITTE. Rechts eine Falltür zur Unterbühne.",
        hotspots: [
          { id: "b3_mond", label: "Der Mond", x: 38, y: 51, w: 25, h: 21, title: "Der Mond", text: "180 Kilo Holz, Stahl und Gaze. Die rote Samtkante ist an einer Stelle frisch vernäht – sauberer als der Rest. Die Seile darüber hängen schlaff: Die Bremse hat nicht gehalten." },
          { id: "b3_mitte", label: "Markierung MITTE", x: 46.5, y: 76, w: 7, h: 8, title: "Markierung „Mitte“", text: "Ein gelbes Kreuz auf dem Bühnenboden. Genau hier stand Reuter – nicht zufällig. Wer wusste, dass er an diesem Abend hier stehen würde?" },
          { id: "b3_seile", label: "Seile von Zug 12", x: 42, y: 6, w: 16, h: 44, title: "Zug 12", text: "Die Seile führen hoch zum Schnürboden. Dort oben – nur über den Technikaufgang erreichbar – sitzt der Handablass." },
          { id: "b3_falltuer", label: "Falltür", x: 73, y: 75, w: 11, h: 7, unless: "licht", title: "Die Falltür", text: "Darunter führt eine Treppe in die Unterbühne. Stockdunkel – ohne Licht siehst du nicht einmal die Stufen." },
          { id: "b3_u4", label: "Tür U-4 (Unterbühne)", x: 73, y: 75, w: 11, h: 7, if: "licht", unless: "u4_offen", title: "Unten: Tür U-4", text: "Im Lichtkegel: eine Stahltür am Ende der Unterbühne. Schild: <b>U-4 – nur Technik · Schließung K-4</b>.", use: "u4" },
          { id: "b3_u4_go", label: "Zum Wartungsgang U-4", x: 73, y: 75, w: 11, h: 7, if: "u4_offen", go: "wartungsgang", via: "door", always: true },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Lichtregie", scene: ost,
        desc: "Die Lichtregie hinter Glas. Das Lichtpult, ein Monitor mit Protokoll, ein Rekorder der Sprechanlage. Auf dem Pult liegen vier gelbe Regiezettel.",
        hotspots: [
          { id: "b3_pult", label: "Lichtpult", x: 13.5, y: 49, w: 46.5, h: 13, secret: true, title: "In das Lichtpult geritzt", text: "Unter einem Fader, klein in den Lack geritzt: <b>„Timo + Mira, Spielzeit 21/22“</b>. Nur Freunde, sagen alle. Und Miras Alibi kommt ohnehin nicht von Timo – sondern vom Mikrofon." },
          { id: "b3_zettel", label: "Regiezettel", x: 19.5, y: 43.5, w: 27, h: 6, title: "Vier Regiezettel", lock: "letzte_probe" },
          { id: "b3_monitor", label: "Monitor", x: 61.5, y: 36.5, w: 18.5, h: 17, title: "Monitor der Steuerung", doc: "protokolle" },
          { id: "b3_rekorder", label: "Sprechanlage", x: 82.5, y: 51, w: 10, h: 10, sound: "tape", title: "Rekorder der Sprechanlage", text: "Du spulst auf Montag, 21:44.", doc: "sprechanlage" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Seitenbühne", scene: sued,
        desc: "Die Seitenbühne. Die Steuerung der Obermaschinerie mit einem Schema daneben, am Brett die Kontrollliste. Hinten der Aufgang zum Schnürboden.",
        hotspots: [
          { id: "b3_steuerung", label: "Steuerung", x: 18.5, y: 29, w: 25, h: 19, title: "Steuerung Obermaschinerie", text: "Der Bildschirm zeigt die Züge 10 bis 13. Zug 12: <b>Bremse offen – Last abgelassen</b>." },
          { id: "b3_schema", label: "Schema Zug 12", x: 21, y: 50, w: 20, h: 10, title: "Schema Zug 12", doc: "zug12", lock: "stift" },
          { id: "b3_kontrolle", label: "Kontrollliste", x: 48.5, y: 24.5, w: 13.5, h: 26, title: "Kontrollliste", doc: "kontrollliste" },
          { id: "b3_schnuerboden", label: "Aufgang Schnürboden", x: 67.5, y: 19, w: 20, h: 52, title: "Technikaufgang", text: "Verschlossen – Schließung K-4. Laut Register hatte Keller das reguläre K-4 seit Montag 20:58." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Inspizientenpult", scene: west,
        desc: "Das Inspizientenpult: Monitor, aufgeschlagenes Regiebuch, ein Rekorder mit rotem Licht. Rechts geht es zur Verwaltung und in die Werkstatt.",
        hotspots: [
          { id: "b3_regiebuch", label: "Regiebuch", x: 33.5, y: 41, w: 12.5, h: 10, title: "Das Regiebuch", doc: "regiebuch", lock: "notiz" },
          { id: "b3_rec", label: "Probenmitschnitt", x: 48.5, y: 42, w: 6, h: 7, sound: "tape", title: "Rekorder Bühnenmikrofon", text: "Das Bühnenmikrofon an der Rampe links läuft bei jeder Probe mit.", doc: "probenmitschnitt" },
          { id: "b3_inspmon", label: "Monitor", x: 14, y: 39, w: 17, h: 13, title: "Monitor", text: "Infrarotbild der Bühne, live. Leer. Die Aufzeichnung vom Montag hat jemand gelöscht – nur der Ton blieb." },
          { id: "b3_gang", label: "Zur Verwaltung", x: 67.5, y: 24, w: 22, h: 47, go: "verwaltung", via: "door", title: "Gang zur Verwaltung", text: "Der Gang ist offen. Aber erst willst du verstehen, was hier passiert ist." },
        ],
      },
    ],
    puzzles: {
      letzte_probe: {
        type: "sort", plain: true, checkButton: true, title: "Die letzte Probe",
        prompt: "Vier lose Regiezettel ohne Uhrzeit. Das Protokoll am Monitor kennt die Zeiten – aber nur Kürzel: VR, LS47, Z12-H, AL. In welcher Reihenfolge ist es passiert?",
        help: "Bring die Zettel in die Reihenfolge des Abends – dann prüfen.",
        items: [
          { id: "al", text: "„Arbeitslicht“" },
          { id: "z12", text: "„Zug 12 fährt“" },
          { id: "vr", text: "„Vorbereitungsruf Mondszene“" },
          { id: "ls47", text: "„LS 47 – Blackout“" },
        ],
        answer: ["vr", "ls47", "z12", "al"],
        wrongOrders: { "vr,z12,ls47,al": "Dann wäre der Mond im hellen Licht gefallen – alle hätten es gesehen.", "vr,ls47,al,z12": "Nach dem Arbeitslicht war die Probe vorbei." },
        wrongDefault: "Die Zeiten im Protokoll passen so nicht zusammen.",
        objective: "Rekonstruiere den Ablauf der Mondszene.",
        hints: [
          "Die Protokolle benutzen Kürzel – vergleiche sie mit den Zetteln.",
          "LS47 ist eine Lichtstimmung, Z12 ist der Zug des Mondes, H steht für Hand.",
          "VR – LS47 – Z12-H – AL.",
        ],
        success: "VR 21:38 – LS47 21:44:00 – <b>Z12-H 21:44:12</b> – AL 21:45:03. „Z12-H“ heißt nicht „Zug 12 fährt“: Es ist der <b>Handablass</b>. Zwölf Sekunden nach dem Blackout hat jemand oben auf dem Schnürboden von Hand die Bremse gelöst.",
        onSolve: [{ evidence: "zugprotokoll" }],
      },
      stift: {
        type: "choice", title: "Der fehlende Stift",
        prompt: "Die Kontrollliste sagt: „Zug 12 – Bremsstift gesteckt ✓“ um 21:10. Aber welcher Stift sichert die Bremse von Zug 12? Am echten Hebel ist ein Loch leer.",
        steps: [{ question: "Welcher Stift fehlt?", pick: 1, answer: ["p4"], options: ["P-1", "P-2", "P-3", "P-4", "P-5", "P-6"].map((x) => ({ id: x.replace("-", "").toLowerCase(), label: x })), wrong: "Folge der Linie von Zug 12 über die Bremse im Schema." }],
        button: "Festhalten",
        objective: "Finde heraus, welcher Sicherungsstift die Bremse von Zug 12 blockiert.",
        hints: [
          "Die Kontrollliste nennt den Bremsstift ohne Nummer.",
          "Im Schema führt eine Linie von Zug 12 über die Bremse zu einem Steckplatz.",
          "P-4.",
        ],
        success: "<b>P-4.</b> Um 21:10 war er noch gesteckt. Wer ihn danach gezogen hat, konnte den Hebel lösen – und kam nur mit Schlüssel K-4 auf den Schnürboden. Der Stift ist verschwunden.",
        onSolve: [{ flag: "p4_fehlt" }],
      },
      blackout: {
        type: "wall", title: "Wer war im Blackout wo?", button: "Zur Pinnwand",
        prompt: "Hagedorns Frage an der Wand: Wer war im Blackout wo?",
        objective: "Prüfe Hagedorns rote Fäden zu Timo und Mira an der Pinnwand.",
        hints: [
          "Hagedorn fragte: Wer war im Blackout wo? Der Mond fiel um 21:44:12 – den Hebel kann man nur oben auf dem Schnürboden ziehen.",
          "Die Sprechanlage und der Probenmitschnitt haben Zeitstempel. Häng sie an die Wand und tippe auf Hagedorns roten Faden.",
          "Timo-Faden mit „Mitschnitt Sprechanlage“ widerlegen, Mira-Faden mit „Probenmitschnitt“.",
        ],
        success: "Timo stand um 21:44:08 am Lichtpult, Mira sprach an der Rampe links ihren Monolog. Keiner von beiden war auf dem Schnürboden. Hagedorns Verdacht war falsch – <b>zwei Namen weniger an der Wand.</b>",
        onSolve: [],
      },
      notiz: {
        type: "choice", title: "Hagedorns letzte Notiz",
        prompt: "An Hagedorns Wand hängt ein Zettel: <b>„Wenn du den letzten Vorhang siehst …“</b> – Das Regiebuch hat für jedes Bild eine Seite.",
        steps: [{ question: "Welche Seite schlägst du auf?", pick: 1, answer: ["schluss"], options: [{ id: "mond", label: "Bild 4 – Mondszene" }, { id: "maske", label: "Bild 5 – Maskenball" }, { id: "schluss", label: "Bild 6 – Schlussvorhang" }], wrong: "Auf dieser Seite steckt nichts. „Der letzte Vorhang“ – ein Theaterbegriff." }],
        button: "Aufschlagen",
        objective: "Finde Hagedorns letzte Nachricht.",
        hints: [
          "„Der letzte Vorhang“ ist ein Theaterbegriff – Hagedorns Zettel hängt an deiner Pinnwand.",
          "Im Regiebuch hat jede Szene eine Seite. Die letzte heißt „Schlussvorhang“.",
          "Regiebuch, Seite Schlussvorhang.",
        ],
        success: "Zwischen den Seiten steckt ein Zettel in Hagedorns Schrift: <b>„… suche dort, wo kein Applaus ankommt. U-4.“</b> Laut Fluchtplan ist U-4 der Wartungsgang unter der Unterbühne.",
        onSolve: [{ doc: "hagedorn_notiz" }, { sound: "paper" }],
      },
    },
    completeWhen: ["letzte_probe", "stift", "blackout", "notiz"],
  });
})();
