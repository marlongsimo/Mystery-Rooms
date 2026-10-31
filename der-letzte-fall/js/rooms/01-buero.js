/*
 * BEREICH 1 – HAGEDORNS BÜRO (Polizeipräsidium) · ca. 10 Min.
 * Rätsel 1 Schublade (2144) · 2 Wand fotografieren (Tablet an der Wand).
 * Was du erfährst: Hagedorn hat am Unfall gezweifelt – und die SMS hat er nicht selbst geschrieben.
 */
(() => {
  const N = window.MRGAME;
  const { T, sheet, door, lamp } = N.draw;
  const scene = (p, body) => N.svgScene(p, body, { top: "#0c0e11", mid: "#22272c", bot: "#14171a", base: "#2b2f33", line: "#3d4248" });

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    tablet: { name: "Dienst-Tablet", icon: "▭", text: "Hagedorns Dienst-Tablet. Der Akku ist halb voll, die Kamera-App offen. Wie man ihn kennt: kein Passwort." },
    bleistift: { name: "Bleistift", icon: "✎", text: "Ein weicher Bleistift, 4B. Hagedorn spitzt seine Stifte mit dem Taschenmesser." },
    theaterschluessel: { name: "Theaterschlüssel", icon: "⚿", text: "Ein Schlüssel mit Anhänger: „Stadttheater – Haupteingang (Ermittlung)“. Hagedorn hat ihn nach der Tatnacht bekommen und nie zurückgegeben." },
  });

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_sms: { from: "Hagedorn", text: "Brauche ein paar Tage Abstand. Der Fall war ein Unfall. – R.H.<br><span class=\"dim\">Mittwoch, 21:58</span>" },
    m_wessel1: { from: "Dr. Wessel", text: "Hagedorn hat sich abgemeldet. Der Fall Reuter ist abgeschlossen. Gehen Sie nach Hause." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    unfallakte: {
      title: "Akte Reuter – Unfall (geschlossen)", kind: "register", pageLabels: ["Deckblatt", "Kriminaltechnik"],
      pages: [
        `<p class="doc-head">KRIPO VELDEN · AKTE 0911-R<br><small>TODESERMITTLUNG ANTON REUTER (61)</small></p>
        <table class="doc-kv"><tr><th>Tatort</th><td>Stadttheater Velden, Hauptbühne</td></tr><tr><th>Zeitpunkt</th><td>Mo 9.11.2026, 21:44 Uhr</td></tr><tr><th>Hergang</th><td>Bühnenelement „Mond“ (180 kg, Zug 12) während der Probe abgestürzt</td></tr><tr><th>Vorgeschichte</th><td>Störung an Zug 12 am 26.10. (Motor)</td></tr></table>
        <p class="stamp">GESCHLOSSEN · UNFALL</p>
        <p class="mono">Do 12.11.2026 · gez. Dr. Wessel, Kriminalrat</p>
        <p class="handwriting margin">Motor ≠ Bremse! Wer hat die Bremse gelöst? – H.</p>`,
        `<p class="doc-head">KRIMINALTECHNIK<br><small>KURZBERICHT · 10.11.2026</small></p>
        <p>Am Rand des Bühnenelements „Mond“ (Samtkante) <b>rote Samtfasern</b>, frisch, Charge unbekannt.</p>
        <p>Handablass-Hebel auf dem Schnürboden: Verriegelung beschädigt, <b>Sicherungsstift fehlt</b>. Verbleib unbekannt.</p>
        <p class="dim">Keine verwertbaren Fingerabdrücke (Handschuhe im Probenbetrieb üblich).</p>`,
      ],
    },
    postit: {
      title: "Post-it am Bildschirm", kind: "note",
      html: `<p class="handwriting big">Code wie immer:<br>die Uhrzeit, um die es geht.</p><p class="handwriting sign">H.</p>`,
    },
    programm: {
      title: "Programmheft „Die Nacht der Masken“", kind: "news",
      html: `<p class="news-head">STADTTHEATER VELDEN · SPIELZEIT 2026/27</p><h4 class="news-title">Die Nacht der Masken</h4><p class="news-sub">Premiere: Sa 14.11.2026 · <b>verschoben</b></p>
        <p>Intendanz: <b>Anton Reuter</b> · Verwaltungsdirektor: <b>Jannis Keller</b><br>Mit <b>Mira Seidel</b> (die Mondfrau) u. a.<br>Licht: <b>Timo Brandt</b> · Kostüme: <b>Ruth Eilers</b></p>
        <p class="dim">Im vierten Bild sinkt der Mond auf die Bühne – ein Effekt, für den das Haus eigens Zug 12 umgebaut hat.</p>
        <p class="handwriting margin">Mondszene 21:44 – Blackout. Wer war wo?? – H.</p>`,
    },
    erster_fall: {
      title: "Foto unter der Schreibtischunterlage", kind: "photo", pageLabels: ["Vorderseite", "Rückseite"],
      pages: [
        `<svg viewBox="0 0 360 240" role="img" aria-label="Zwei Menschen in Regenjacken vor einem Absperrband, Nacht"><rect width="360" height="240" fill="#2a2e33"/><rect y="170" width="360" height="70" fill="#1b1d20"/>
          <line x1="0" y1="150" x2="360" y2="140" stroke="#e8c84a" stroke-width="8"/><g fill="#14161a"><circle cx="140" cy="92" r="16"/><rect x="120" y="108" width="40" height="70" rx="10"/><circle cx="210" cy="98" r="14"/><rect x="192" y="112" width="36" height="66" rx="10"/></g>
          <rect width="360" height="240" fill="#c9d6e0" opacity=".08"/></svg>`,
        `<p class="handwriting big">Dein erster Fall.<br>Wir lassen niemanden zurück.</p><p class="handwriting sign">H.</p>`,
      ],
    },
    wand_foto: {
      title: "Hagedorns Wand (Foto)", kind: "photo",
      html: `<p>Das Foto der Wand liegt jetzt auf dem Tablet. Öffne die <b>Pinnwand</b> in der Seitenleiste, um daran weiterzuarbeiten – Beweise aufhängen, Fäden ziehen, Hagedorns Verdacht prüfen.</p>`,
    },
  });

  /* ---------- Szenen ---------- */
  // Kork mit Fotos und Fäden (Ansicht im Raum, nicht bedienbar)
  const cork = `
  <rect x="150" y="110" width="900" height="470" fill="#5a3f27"/><rect x="164" y="124" width="872" height="442" fill="#a97e52"/>
  <rect x="164" y="124" width="872" height="442" fill="#7d5a36" opacity=".18"/>
  <g stroke="#b3261e" stroke-width="3"><path d="M300 360 Q420 300 560 230"/><path d="M470 420 Q620 360 760 230"/><path d="M820 420 Q700 330 560 230"/></g>
  <path d="M930 360 Q880 300 790 230" stroke="#d9a91a" stroke-width="3" fill="none"/>
  <path d="M640 500 Q760 520 880 500" stroke="#3b76c4" stroke-width="3" fill="none"/>
  <g>${[[262, 330, -3], [432, 390, 2], [782, 390, -2], [892, 330, 3]].map(([x, y, r]) => `<g transform="rotate(${r} ${x + 34} ${y + 44})"><rect x="${x}" y="${y}" width="68" height="88" fill="#f7f4ee"/><rect x="${x + 6}" y="${y + 6}" width="56" height="58" fill="#2a2d33"/><circle cx="${x + 34}" cy="${y + 30}" r="12" fill="#c9a07a"/><circle cx="${x + 34}" cy="${y}" r="5" fill="#b3261e"/></g>`).join("")}</g>
  <g transform="rotate(2 560 200)"><rect x="520" y="160" width="80" height="80" fill="#f7f4ee"/><rect x="526" y="166" width="68" height="56" fill="#15171c"/><ellipse cx="560" cy="204" rx="22" ry="8" fill="#d8cfa8"/><circle cx="560" cy="160" r="5" fill="#b3261e"/></g>
  ${sheet(730, 180, 100, 70, { rot: 2 })}${sheet(200, 150, 90, 64, { rot: -2 })}${sheet(600, 470, 90, 60, { rot: -1 })}${sheet(870, 470, 90, 60, { rot: 2 })}
  <g>${[[340, 160, "#f3e58a"], [210, 240, "#f3e58a"], [960, 420, "#f3e58a"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="70" height="62" fill="${c}" transform="rotate(-3 ${x} ${y})"/>`).join("")}</g>
  ${T(600, 610, "MOND FÄLLT 21:44", { fill: "#e6dcc3", size: 30, hand: true, rot: -2 })}`;
  const nord = scene("b1n", `
  ${lamp("b1n", 600, 70, 260)}
  ${cork}
  <rect x="150" y="580" width="900" height="10" fill="#3b2b1e"/>`);

  const ost = scene("b1o", `
  <rect x="700" y="120" width="380" height="250" fill="#0c1218" stroke="#2b2f33" stroke-width="10"/>
  <g stroke="#9fb2c4" stroke-opacity=".22" stroke-width="1.3">${Array.from({ length: 16 }, (_, i) => `<line x1="${720 + (i * 41) % 340}" y1="${140 + (i * 29) % 200}" x2="${712 + (i * 41) % 340}" y2="${172 + (i * 29) % 200}"/>`).join("")}</g>
  <rect x="140" y="470" width="920" height="26" fill="#3b2b1e" stroke="#1a130d" stroke-width="3"/><rect x="170" y="496" width="860" height="150" fill="#2c2017" stroke="#1a130d" stroke-width="3"/>
  <rect x="560" y="514" width="180" height="48" fill="#33251a" stroke="#1a130d" stroke-width="2"/><rect x="630" y="532" width="40" height="10" rx="3" fill="#806040"/>
  <rect x="740" y="520" width="44" height="32" rx="3" fill="#15171a" stroke="#806040"/>${T(762, 541, "· · · ·", { fill: "#9fe0b0", size: 12 })}
  <rect x="300" y="458" width="420" height="16" fill="#1d3a2b" opacity=".85"/>
  <rect x="340" y="300" width="230" height="150" rx="6" fill="#15171a" stroke="#2b2f33" stroke-width="6"/><rect x="352" y="312" width="206" height="122" fill="#0d1a24"/><rect x="440" y="450" width="30" height="20" fill="#2b2f33"/>
  <rect x="520" y="306" width="46" height="40" fill="#f3e58a" transform="rotate(6 543 326)"/>
  <rect x="800" y="430" width="150" height="34" rx="4" fill="#1c1f23" stroke="#3d4248" stroke-width="2"/><rect x="808" y="436" width="134" height="22" fill="#26313a"/>
  <g><rect x="230" y="400" width="44" height="66" rx="4" fill="#2a2b28" stroke="#5a5c55"/><line x1="240" y1="400" x2="232" y2="352" stroke="#806040" stroke-width="5"/><line x1="252" y1="400" x2="258" y2="356" stroke="#2c5a8a" stroke-width="5"/><line x1="264" y1="400" x2="276" y2="360" stroke="#b3261e" stroke-width="5"/></g>
  <rect x="210" y="646" width="30" height="110" fill="#22190f"/><rect x="960" y="646" width="30" height="110" fill="#22190f"/>`);

  const sued = scene("b1s", `
  <rect x="160" y="160" width="330" height="480" fill="#3d4248" stroke="#24272b" stroke-width="5"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="176" y="${178 + i * 114}" width="298" height="100" fill="#4a4f56" stroke="#2b2f33" stroke-width="3"/><rect x="300" y="${218 + i * 114}" width="50" height="12" rx="4" fill="#9a9c94"/><rect x="196" y="${190 + i * 114}" width="60" height="18" fill="#e6dcc3"/>`).join("")}
  <g transform="rotate(-4 330 140)">${sheet(260, 110, 150, 46, { fill: "#d8c79a", head: "#7a2620" })}</g>
  ${door(700, 210, 230, 430, { fill: "#2f3438", window: "#9fb2c422", sign: "321 · HAGEDORN", signFill: "#e6dcc3" })}
  <rect x="980" y="300" width="120" height="160" fill="#e6dcc3"/>${T(1040, 330, "DIENSTPLAN", { size: 11 })}${T(1040, 352, "KW 46", { size: 10, fill: "#6c5a44" })}
  <g stroke="#6c5a44">${[0, 1, 2, 3, 4].map((i) => `<line x1="996" y1="${374 + i * 16}" x2="1084" y2="${374 + i * 16}"/>`).join("")}</g>`);

  const west = scene("b1w", `
  <rect x="140" y="130" width="460" height="400" fill="#2b2f33"/><rect x="156" y="146" width="428" height="368" fill="#0b1118"/>
  <rect x="156" y="400" width="428" height="114" fill="#11161c"/>
  <g fill="#1a1f26">${[[180, 330, 60, 70], [250, 300, 80, 100], [340, 340, 50, 60], [400, 280, 120, 120], [530, 320, 50, 80]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join("")}</g>
  <g fill="#e6c48a" opacity=".7">${[[270, 320], [300, 350], [440, 300], [470, 340], [430, 370]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="10"/>`).join("")}</g>
  <path d="M400 280 l60 -40 l60 40 z" fill="#1a1f26"/>${T(460, 272, "THEATER", { fill: "#8a7a5a", size: 9, ls: 2 })}
  <g stroke="#9fb2c4" stroke-opacity=".25" stroke-width="1.3">${Array.from({ length: 18 }, (_, i) => `<line x1="${170 + (i * 47) % 400}" y1="${150 + (i * 31) % 340}" x2="${162 + (i * 47) % 400}" y2="${182 + (i * 31) % 340}"/>`).join("")}</g>
  <rect x="366" y="146" width="8" height="368" fill="#2b2f33"/><rect x="156" y="326" width="428" height="8" fill="#2b2f33"/>
  <rect x="770" y="150" width="14" height="420" fill="#2a2b28"/><rect x="740" y="150" width="200" height="14" fill="#2a2b28"/>
  <path d="M800 170 q-40 30 -50 160 l10 220 l120 0 l10 -220 q-10 -130 -50 -160 z" fill="#3a3326" stroke="#22201a" stroke-width="3"/>
  <path d="M830 175 l0 380" stroke="#22201a" stroke-width="2"/><rect x="842" y="360" width="40" height="50" fill="#2e2a20" stroke="#22201a"/>
  <rect x="852" y="350" width="28" height="22" fill="#e6dcc3" transform="rotate(8 866 361)"/>
  <ellipse cx="810" cy="168" rx="36" ry="10" fill="#2a2b28"/>`);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "buero",
    name: "Hagedorns Büro",
    title: "Hagedorns Büro",
    kicker: "POLIZEIPRÄSIDIUM / 3. STOCK",
    story: "Hagedorns Büro. Die Schreibtischlampe brennt noch – er hat sie am Mittwoch nicht ausgeschaltet. An der Wand: seine Ermittlung, Fäden kreuz und quer.",
    ambient: "hum",
    exitVia: "door",
    exitLabel: "Weiter: zum Theater",
    views: [
      {
        id: "nord", dir: "NORD", name: "Die Wand", scene: nord,
        desc: "Hagedorns Ermittlungswand. Fotos, Dokumente, Notizen in seiner Handschrift – und rote Fäden. Groß quer darunter: „Mond fällt 21:44“.",
        hotspots: [
          { id: "b1_wand", label: "Hagedorns Wand", x: 13, y: 12, w: 74, h: 53, unless: "wand_foto", title: "Hagedorns Wand", text: "Drei rote Fäden: Mira Seidel, Timo Brandt, Ruth Eilers – Hagedorn hat alle drei verdächtigt. Ein gelber Faden bei Jannis Keller: „Schlüssel?“. Ein blauer zwischen Pförtnerbuch und Seitentür. Die Wand ist zu groß, um sie mitzunehmen – und abnehmen willst du sie nicht.", use: "foto" },
          { id: "b1_wand2", label: "Hagedorns Wand", x: 13, y: 12, w: 74, h: 53, if: "wand_foto", wall: true },
          { id: "b1_schrift", label: "„Mond fällt 21:44“", x: 34, y: 63, w: 32, h: 7, title: "Quer unter der Wand", text: "Mit dickem Filzstift, direkt auf die Wand geschrieben: <b>MOND FÄLLT 21:44</b>. Die Uhrzeit, um die sich alles dreht." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Schreibtisch", scene: ost,
        desc: "Der Schreibtisch. Ein Bildschirm mit gelbem Zettel, ein Stiftebecher, ein Tablet in der Ladeschale, eine Schublade mit Zahlenschloss.",
        hotspots: [
          { id: "b1_tablet", label: "Tablet", x: 66.5, y: 47.5, w: 13, h: 5, unless: "taken_b1_tablet", take: "tablet", takeText: "Du nimmst Hagedorns Dienst-Tablet aus der Ladeschale." },
          { id: "b1_stifte", label: "Stiftebecher", x: 18.5, y: 38.5, w: 5, h: 13, unless: "taken_b1_stifte", take: "bleistift", takeText: "Du nimmst einen weichen Bleistift aus dem Becher." },
          { id: "b1_postit", label: "Post-it", x: 43, y: 33.5, w: 4.5, h: 5, title: "Gelber Zettel am Bildschirm", doc: "postit" },
          { id: "b1_bildschirm", label: "Bildschirm", x: 28.5, y: 33.5, w: 14, h: 16, title: "Hagedorns Bildschirm", text: "Gesperrt. Auf dem Sperrbildschirm: drei verpasste Anrufe von dir. Montag, Dienstag, Mittwoch." },
          { id: "b1_schublade", label: "Schublade", x: 46.5, y: 57, w: 19, h: 6, title: "Die Schublade", lock: "schublade" },
          { id: "b1_unterlage", label: "Schreibtischunterlage", x: 25, y: 50.5, w: 35, h: 2.5, secret: true, title: "Unter der Schreibtischunterlage", text: "Unter der grünen Unterlage steckt ein altes Foto.", doc: "erster_fall" },
          { id: "b1_fenster", label: "Fenster", x: 58.5, y: 13.5, w: 31.5, h: 27.5, title: "Das Fenster", text: "Regen. Unten auf dem Hof steht noch Hagedorns Dienstwagen. Er ist nicht mit dem Auto weggefahren." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Aktenschrank und Tür", scene: sued,
        desc: "Ein grauer Aktenschrank, obenauf eine Akte mit rotem Stempel. Daneben die Tür zum Flur, am Brett der Dienstplan.",
        hotspots: [
          { id: "b1_akte", label: "Akte Reuter", x: 21, y: 11.5, w: 14, h: 7, title: "Akte Reuter", text: "Obenauf, als hätte Hagedorn sie zuletzt in der Hand gehabt.", doc: "unfallakte" },
          { id: "b1_schrank", label: "Aktenschrank", x: 14, y: 19.5, w: 26, h: 50, title: "Der Aktenschrank", text: "Alte Fälle, nach Jahren sortiert. Die Schublade „2026“ ist fast leer – den Fall Reuter hatte er draußen." },
          { id: "b1_dienstplan", label: "Dienstplan", x: 81.5, y: 33, w: 10, h: 18, title: "Dienstplan KW 46", text: "Hagedorn: Mo–Mi Spätdienst, Do–Fr „Urlaub“ – nachträglich eingetragen, nicht in seiner Schrift. Du: Fortbildung Mo–Fr." },
          { id: "b1_tuer", label: "Zum Theater", x: 57.5, y: 22, w: 20, h: 50, go: "foyer", via: "door", title: "Die Tür", text: "Ins Theater kommst du nachts nur mit einem Schlüssel. Hagedorn hatte einen – irgendwo hier." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Fenster und Garderobe", scene: west,
        desc: "Ein zweites Fenster – über den Dächern sieht man das Stadttheater. An der Garderobe hängt Hagedorns Mantel.",
        hotspots: [
          { id: "b1_mantel", label: "Hagedorns Mantel", x: 61, y: 18, w: 13, h: 44, title: "Hagedorns Mantel", text: "Sein Mantel. Im November ist er ohne ihn gegangen – also wollte er nur kurz weg. In der Innentasche steckt ein Programmheft.", doc: "programm" },
          { id: "b1_theater", label: "Blick zum Theater", x: 13, y: 16, w: 37, h: 41, title: "Über den Dächern", text: "Das Stadttheater. Seit Montag ist es versiegelt. In einem einzigen Fenster im Erdgeschoss brennt Licht – die Pforte." },
        ],
      },
    ],
    puzzles: {
      schublade: {
        type: "code", length: 4, title: "Die Schublade",
        prompt: "Ein Zahlenschloss mit vier Rädchen. Hagedorn benutzt immer denselben Typ Code.",
        answers: ["2144"],
        wrong: { 2145: "Fast. Hagedorn rundet nicht.", "0911": "Das Datum ist es nicht – sein Zettel sagt: die Uhrzeit." },
        wrongDefault: "Das Schloss bleibt zu.",
        objective: "Öffne Hagedorns Schreibtischschublade.",
        hints: [
          "Hagedorn benutzt immer denselben Typ Code – steht auf dem gelben Zettel.",
          "Auf der Wand steht groß die wichtigste Uhrzeit des Falls.",
          "2144.",
        ],
        success: "Die Schublade springt auf. Darin: ein Schlüssel mit Anhänger „Stadttheater – Haupteingang (Ermittlung)“. Hagedorn hat ihn nie zurückgegeben.",
        onSolve: [{ give: "theaterschluessel" }, { sound: "open" }],
      },
      foto: {
        type: "use", item: "tablet", title: "Die Wand mitnehmen",
        wrongItem: "Damit kannst du die Wand nicht mitnehmen.",
        objective: "Nimm Hagedorns Wand mit, ohne sie abzunehmen.",
        hints: [
          "Die Wand bleibt hier – aber du brauchst sie im Theater.",
          "Das Tablet auf dem Schreibtisch hat eine Kamera.",
          "Tablet aus dem Rucksack an der Wand benutzen.",
        ],
        success: "Klick. Das Tablet erkennt jede Karte, jede Notiz, jeden Faden – Hagedorns Wand liegt jetzt als <b>Pinnwand</b> auf dem Tablet. Du findest sie in der Seitenleiste.",
        onSolve: [{ flag: "wand_foto" }, { sound: "camera" }, { doc: "wand_foto" }, { message: "m_wessel1" }],
      },
    },
    completeWhen: ["schublade", "foto"],
  });
})();
