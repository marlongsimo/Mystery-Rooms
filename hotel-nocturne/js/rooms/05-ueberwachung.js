/*
 * STATION 5 – DER ÜBERWACHUNGSRAUM (Untergeschoss, Sicherheitsbereich)
 * Rätsel 14 Band einlegen · 15 Zeitleiste (mit Prüfknopf) · 16 Datei 5 (Kennwort MARA)
 * + Suche nach der Ersatzsicherung, Übergang durch die Tür „Technik“.
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    sicherung: { name: "Ersatzsicherung F3", icon: "⌁", text: "Eine schwere Schmelzsicherung, 30 A. Auf dem Etikett in Tomasz’ Handschrift: „F3 – Generator West“." },
  });

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_k3: { from: "Unbekannte Nummer", text: "Sieh genau hin. Die Dritte, die sich am Tor festhält – sie hatte in jener Nacht schreckliche Angst." },
    m_kennwort: { from: "Unbekannte Nummer", text: "Er hat dieses Kennwort nie geändert. Siebzehn Jahre nicht." },
  });

  /* ---------- kleine Bildschirmbilder ---------- */
  const thumb = (body, code) => `<svg viewBox="0 0 92 60" aria-hidden="true"><rect width="92" height="60" fill="#0b100d"/>${body}<rect width="92" height="60" fill="none" stroke="#2c3a30"/><text x="86" y="56" text-anchor="end" fill="#e6f5c9" font-family="DM Mono, monospace" font-size="9">#${code}</text></svg>`;
  const T = {
    A: thumb(`<rect x="10" y="30" width="72" height="14" fill="#1b231e"/><circle cx="46" cy="16" r="8" fill="none" stroke="#5f7a66"/><text x="6" y="10" fill="#b6e0c4" font-family="DM Mono, monospace" font-size="8">23:17</text><rect width="92" height="60" fill="#000" opacity=".45"/>`, 5),
    B: thumb(`<rect x="22" y="22" width="48" height="26" fill="#26302a"/><circle cx="62" cy="28" r="4" fill="#d4443a"/><rect x="28" y="28" width="22" height="4" fill="#3a4a3f"/><text x="6" y="10" fill="#5f7a66" font-family="DM Mono, monospace" font-size="8">--:--</text>`, 2),
    C: thumb(`<rect x="6" y="20" width="12" height="28" fill="none" stroke="#9fc0a8"/>${[26, 38, 50, 62, 72, 82].map((x) => `<rect x="${x}" y="32" width="5" height="14" rx="2" fill="#9fc0a8"/>`).join("")}<text x="6" y="10" fill="#b6e0c4" font-family="DM Mono, monospace" font-size="8">23:24</text>`, 8),
    D: thumb(`<rect x="8" y="12" width="30" height="36" fill="#1b231e"/><rect x="12" y="16" width="22" height="6" fill="#3a4a3f"/><rect x="56" y="24" width="7" height="22" rx="3" fill="#9fc0a8"/><rect x="66" y="38" width="16" height="8" fill="#5f7a66"/><text x="6" y="10" fill="#5f7a66" font-family="DM Mono, monospace" font-size="8">--:--</text>`, 1),
  };

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    dienstplan: {
      title: "Dienstplan 14.10.2009", kind: "register",
      html: `<p class="doc-head">DIENSTPLAN<br><small>MITTWOCH, 14. OKTOBER 2009</small></p>
        <table class="doc-table"><thead><tr><th>Name</th><th>Bereich</th><th>Schicht</th></tr></thead><tbody>
          <tr><td>Greta</td><td>Küche</td><td>bis 22:00</td></tr><tr><td>Ilse</td><td>Empfang</td><td>bis 22:00</td></tr>
          <tr><td>Tomasz</td><td>Haustechnik</td><td>Bereitschaft <span class="handwriting">– krank gemeldet, E.</span></td></tr>
          <tr><td>Elias Voss</td><td>Nachtmanager</td><td>22:00–06:00</td></tr></tbody></table>
        <p class="handwriting margin">M. kommt heute. Zimmer 217 freihalten. – E.</p>`,
    },
    leere_huelle: {
      title: "Leere Bandhülle Kamera 3", kind: "note",
      html: `<p class="mono">KAMERA 3 – INNENHOF<br>14.10.2009<br><b>GELÖSCHT</b></p><p class="handwriting margin">gelöscht 15.10.2009 – V.L.</p><p class="mono dim">Die Hülle ist leer. Ein Zettel am Regal: „Sicherheitskopien werden nach 30 Tagen überschrieben.“</p>`,
    },
    aufnahme_k3: {
      title: "Aufnahme Kamera 3 – Innenhof, 23:24", kind: "screen",
      html: `<svg viewBox="0 0 400 240" role="img" aria-label="Sechs Personen verlassen den Innenhof durch ein Tor im Westen">
          <rect width="400" height="240" fill="#0a0f0c"/><rect y="170" width="400" height="70" fill="#121a15"/>
          <rect x="30" y="80" width="56" height="96" fill="#050806" stroke="#7fa08a" stroke-width="2"/><text x="58" y="72" text-anchor="middle" fill="#7fa08a" font-family="DM Mono, monospace" font-size="11">W2</text>
          <g stroke="#7fa08a" stroke-opacity=".25">${Array.from({ length: 14 }, (_, i) => `<line x1="${30 + i * 28}" y1="0" x2="${20 + i * 28}" y2="60"/>`).join("")}</g>
          ${[0, 1.1, 2.2, 3.3, 4.4, 5.5].map((d, i) => `<g class="walker" style="animation-delay:${d}s"><circle cx="372" cy="${132 - (i % 2) * 3}" r="7" fill="#b6e0c4"/><rect x="365" y="${140 - (i % 2) * 3}" width="14" height="32" rx="5" fill="#b6e0c4"/></g>`).join("")}
          <text x="10" y="20" class="ts" fill="#e6f5c9" font-family="DM Mono, monospace" font-size="13">CAM 3 · 14.10.2009 · 23:24:18</text>
          <rect width="400" height="240" fill="#b6e0c4" opacity=".04" class="scan-noise"/>
        </svg>
        <p>Sechs Personen gehen im Regen nacheinander durch Tor W2. Die dritte hält sich kurz am Tor fest. Danach erscheint ein Mann in Uniform, prüft das Tor, blickt kurz in die Kamera – und geht allein zurück ins Gebäude.</p>
        <p class="dim">Erkenntnis: Der Mann mit der Taschenlampe hat die Gäste nicht in den Keller geführt, sondern durch Tor W2 hinaus – und ist allein zurückgegangen.</p>`,
    },
    datei5: {
      title: "Datei 5 – Elias Voss", kind: "screen",
      html: `<svg viewBox="0 0 400 220" role="img" aria-label="Elias sitzt vor einem Regal und blickt in die Kamera">
          <rect width="400" height="220" fill="#0a0f0c"/><rect x="40" y="30" width="150" height="150" fill="#121a15"/>
          ${Array.from({ length: 5 }, (_, i) => `<rect x="${50 + i * 26}" y="40" width="20" height="60" fill="#1b2620"/>`).join("")}<rect x="140" y="40" width="0" height="60"/>
          <rect x="230" y="140" width="110" height="20" fill="#2a3a30"/><rect x="250" y="126" width="70" height="16" fill="#5f7a66"/>
          <circle cx="200" cy="96" r="22" fill="#9fc0a8"/><path d="M160 200 q40 -80 80 0 z" fill="#7fa08a"/>
          <text x="10" y="18" fill="#e6f5c9" font-family="DM Mono, monospace" font-size="12">DATEI 5 · BÜRO · 14.10.2009 · 23:41</text>
          <rect width="400" height="220" fill="#b6e0c4" opacity=".04" class="scan-noise"/>
        </svg>
        <p class="sub">„Falls jemand diese Aufnahme gefunden hat,</p>
        <p class="sub">ist es endlich an der Zeit, die Wahrheit zu erfahren.</p>
        <p class="sub">Der Keller ist der Schlüssel.</p>
        <p class="sub">Nicht die Tür, die Sie sehen.</p>
        <p class="sub">Die Tür, die Sie niemals sehen sollten.“</p>
        <p class="dim">Hinter Elias liegt ein dickes Buch auf dem Tisch: „Originales Wartungsregister“. Die Aufnahme endet abrupt.</p>`,
    },
    loeschprotokoll: {
      title: "Systemprotokoll des Rekorders", kind: "screen",
      html: `<p class="ts">SICHERHEITSREKORDER · SYSTEMPROTOKOLL</p>
        <p>14.10.2009 · 23:17 · STROMAUSFALL – AUFZEICHNUNG AUF NOTSTROM</p>
        <p>14.10.2009 · 23:58 · BACKUP CAM 3 ERSTELLT · BENUTZER: E. VOSS</p>
        <p><b>15.10.2009 · 08:12 · LÖSCHUNG CAM 3 (14.10.) · BENUTZER: V. LEHN (EIGENTÜMER)</b></p>
        <p>15.10.2009 · 08:13 · BACKUP CAM 3 NICHT AUFFINDBAR</p>
        <p class="dim">Ein Thermopapierstreifen, halb aus dem Drucker gezogen und abgerissen. Den Rest hat offenbar niemand gelesen.</p>`,
    },
    kennwortzettel: { title: "Zettel am Terminal", kind: "note", html: `<p class="handwriting big">Kennwort wie immer:<br>der Name, der in keinem Register stehen durfte.</p><p class="handwriting sign">– E.</p>` },
  });

  /* ---------- Grundgerüst: kahler Sicherheitsraum ---------- */
  const sec = (p, body) => scene(p, `<rect width="1200" height="760" fill="#161917"/><rect y="560" width="1200" height="200" fill="#121412"/><rect y="556" width="1200" height="4" fill="#2c302c"/>${body}`, { wainscot: false });
  const crt = (x, y, inner, id) => `<g><rect x="${x - 10}" y="${y - 10}" width="210" height="170" rx="10" fill="#2a2d29" stroke="#3a3f3a" stroke-width="2"/><rect x="${x}" y="${y}" width="190" height="150" rx="14" fill="#060908"/>${inner}<rect x="${x}" y="${y}" width="190" height="150" rx="14" fill="none" stroke="#000" stroke-width="6"/><text x="${x + 182}" y="${y + 172}" text-anchor="end" fill="#6e756e" font-family="DM Mono, monospace" font-size="10">${id}</text></g>`;

  /* ---------- NORD: Eingang ---------- */
  const nord = sec("un", `
  <rect x="470" y="200" width="260" height="600" fill="#0a0b0a"/><rect x="482" y="212" width="236" height="588" fill="#4a4a44" stroke="#2a2a26" stroke-width="3"/>
  <g fill="#5d5d56"><circle cx="500" cy="230" r="5"/><circle cx="700" cy="230" r="5"/><circle cx="500" cy="780" r="5"/><circle cx="700" cy="780" r="5"/></g><rect x="690" y="480" width="16" height="60" rx="5" fill="#2a2a26"/>
  <rect x="560" y="150" width="80" height="30" rx="4" fill="#2a2620"/><rect x="568" y="156" width="64" height="14" fill="#f3e6b8" class="flicker"/>
  <ellipse class="flicker" cx="600" cy="200" rx="200" ry="140" fill="url(#un-glow)"/>
  <g><rect x="820" y="300" width="160" height="190" fill="#e6dcc3"/><rect x="820" y="300" width="160" height="22" fill="#2a2119"/><text x="900" y="316" text-anchor="middle" fill="#e6dcc3" font-family="DM Mono, monospace" font-size="11">DIENSTPLAN</text>
    <g stroke="#6c5a44" stroke-width="1.5">${Array.from({ length: 6 }, (_, i) => `<line x1="834" y1="${342 + i * 20}" x2="966" y2="${342 + i * 20}"/>`).join("")}</g><path d="M834 470 q30 -8 60 0 t60 -4" fill="none" stroke="#2c2a5a" stroke-width="1.5"/></g>
  <g><rect x="230" y="330" width="70" height="110" rx="6" fill="#2a2d29" stroke="#3a3f3a" stroke-width="2"/><rect x="246" y="344" width="38" height="16" fill="#0a0b0a"/><path d="M265 440 q-6 40 10 70 q14 30 -4 60" fill="none" stroke="#1a1a18" stroke-width="5"/></g>
  <g transform="translate(330,225)"><circle r="32" fill="#1a1a18"/><circle r="26" fill="#cdbd9b"/><line y2="-13" stroke="#1a1a18" stroke-width="4" transform="rotate(338.5)"/><line y2="-21" stroke="#1a1a18" stroke-width="2.5" transform="rotate(102)"/></g>
  `);

  /* ---------- OST: Monitorwand ---------- */
  const ost = sec("uo", `
  <rect x="120" y="190" width="960" height="250" fill="#1d201d"/>
  ${crt(160, 230, `<rect x="175" y="300" width="160" height="40" fill="#121a15"/><circle cx="255" cy="270" r="16" fill="none" stroke="#3f5a46"/><text x="172" y="250" fill="#b6e0c4" font-family="DM Mono, monospace" font-size="12">CAM 1 · 23:17</text><rect x="160" y="230" width="190" height="150" rx="14" fill="#000" opacity=".4"/>`, "1 · LOBBY")}
  ${crt(390, 230, `<g class="scan-noise">${Array.from({ length: 18 }, (_, i) => `<rect x="${396 + (i * 37) % 170}" y="${238 + i * 8}" width="${20 + (i * 13) % 50}" height="2" fill="#b6e0c4" opacity="${0.15 + (i % 4) * 0.08}"/>`).join("")}</g>
    <g data-if="monitor2_live"><rect x="390" y="230" width="190" height="150" rx="14" fill="#0e1712"/><rect x="400" y="320" width="170" height="40" fill="#18241c"/><circle cx="520" cy="290" r="8" fill="#d8f0de"/><rect x="513" y="298" width="14" height="34" rx="5" fill="#d8f0de"/><text x="400" y="250" fill="#e6f5c9" font-family="DM Mono, monospace" font-size="11">CAM 2 · LIVE</text><text x="400" y="372" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="10">14.10.2026</text></g>`, "2 · FLUR")}
  ${crt(620, 230, `<g data-unless="band_eingelegt"><text x="715" y="300" text-anchor="middle" fill="#d4443a" font-family="DM Mono, monospace" font-size="14">KEIN SIGNAL</text><text x="715" y="320" text-anchor="middle" fill="#7a3a34" font-family="DM Mono, monospace" font-size="9">KAMERA 3 – SIGNAL UNTERBROCHEN</text></g>
    <g data-if="band_eingelegt"><rect x="630" y="310" width="170" height="60" fill="#121a15"/><rect x="638" y="280" width="20" height="40" fill="none" stroke="#9fc0a8"/>${[690, 712, 734, 756, 776].map((x) => `<rect x="${x}" y="300" width="8" height="20" rx="3" fill="#9fc0a8"/>`).join("")}<text x="632" y="250" fill="#e6f5c9" font-family="DM Mono, monospace" font-size="11">CAM 3 · 23:24:18</text></g>`, "3 · INNENHOF")}
  ${crt(850, 230, `<rect x="868" y="248" width="60" height="80" fill="#121a15"/><rect x="980" y="300" width="40" height="40" fill="#1b2620"/><text x="862" y="372" fill="#5f7a66" font-family="DM Mono, monospace" font-size="11">CAM 4 · --:--</text>`, "4 · BÜRO")}
  <rect x="240" y="300" width="0" height="0"/>
  <rect x="120" y="470" width="960" height="70" fill="#2a2d29" stroke="#3a3f3a" stroke-width="2"/>
  ${[255, 485, 715, 945].map((x, i) => `<circle cx="${x}" cy="505" r="8" fill="${i === 2 ? "#d4443a" : "#7fa36d"}"${i === 2 ? ' data-unless="band_eingelegt"' : ""}/>${i === 2 ? `<circle cx="${x}" cy="505" r="8" fill="#7fa36d" data-if="band_eingelegt"/>` : ""}`).join("")}
  <rect x="660" y="400" width="110" height="20" fill="#cdbd9b" opacity=".75"/><text x="715" y="414" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="8">NUR ÜBER REKORDER</text>
  `);

  /* ---------- SÜD: Bandarchiv und Rekorder ---------- */
  const tapes = () => {
    let out = "";
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) {
      const x = 140 + i * 46, y = 222 + r * 120, empty = (i * 3 + r * 5) % 7 === 0;
      if (r === 2 && i === 6) continue;
      out += `<rect x="${x}" y="${y}" width="36" height="96" fill="${empty ? "#121412" : "#1d1f1d"}" stroke="#2f332f"/>${empty ? "" : `<rect x="${x + 6}" y="${y + 10}" width="24" height="30" fill="#cdbd9b" opacity=".5"/>`}`;
    }
    return out;
  };
  const sued = sec("us", `
  <rect x="120" y="200" width="460" height="500" fill="#0f110f" stroke="#2f332f" stroke-width="4"/><g fill="#2f332f"><rect x="120" y="320" width="460" height="6"/><rect x="120" y="440" width="460" height="6"/><rect x="120" y="560" width="460" height="6"/></g>${tapes()}
  <g><rect x="416" y="462" width="36" height="96" fill="#2a1414" stroke="#7a2a24" stroke-width="2"/><rect x="420" y="472" width="28" height="40" fill="#d8cdb6"/><text x="434" y="488" text-anchor="middle" fill="#7a2a24" font-family="DM Mono, monospace" font-size="7">CAM 3</text><text x="434" y="500" text-anchor="middle" fill="#7a2a24" font-family="DM Mono, monospace" font-size="6">GELÖSCHT</text></g>
  <rect x="640" y="560" width="440" height="22" fill="#3b2b1e"/><rect x="660" y="582" width="16" height="190" fill="#2a1d14"/><rect x="1044" y="582" width="16" height="190" fill="#2a1d14"/>
  <g><rect x="680" y="480" width="360" height="80" rx="6" fill="#2a2d29" stroke="#3a3f3a" stroke-width="2"/><rect x="720" y="506" width="160" height="14" rx="3" fill="#050605"/><rect x="900" y="500" width="100" height="22" fill="#0b2a1e"/>
    <text x="950" y="516" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="11" data-unless="band_eingelegt">--:--:--</text><text x="950" y="516" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="11" data-if="band_eingelegt">▶ 23:24</text>
    <g fill="#4a4f48"><circle cx="720" cy="545" r="6"/><circle cx="745" cy="545" r="6"/><circle cx="770" cy="545" r="6"/></g><rect x="728" y="500" width="144" height="8" fill="#1d1f1d" data-if="band_eingelegt"/><path d="M890 482 q4 -20 -6 -40 q-6 -14 4 -30" fill="none" stroke="#e8e2cf" stroke-width="9"/></g>
  <g><rect x="760" y="330" width="200" height="130" rx="10" fill="#2a2d29"/><rect x="772" y="342" width="176" height="106" rx="8" fill="#060908"/><text x="860" y="400" text-anchor="middle" fill="#b6e0c4" font-family="DM Mono, monospace" font-size="12">EINGANG REKORDER</text></g>
  `);

  /* ---------- WEST: Schaltpult und Tür „Technik“ ---------- */
  const screenText = (lines, cond) => `<g ${cond}>${lines.map((l, i) => `<text x="482" y="${270 + i * 22}" fill="${l[1] || "#b6e0c4"}" font-family="DM Mono, monospace" font-size="13">${l[0]}</text>`).join("")}</g>`;
  const west = sec("uw", `
  <g><rect x="460" y="220" width="280" height="200" rx="10" fill="#2a2d29"/><rect x="470" y="230" width="260" height="180" rx="8" fill="#060908"/>
    ${screenText([["INDEXTERMINAL"], ["DATENSATZ CAM 3", "#d4443a"], ["FEHLT"]], 'data-unless="band_eingelegt"')}
    <g data-if="band_eingelegt">${screenText([["INDEXTERMINAL"], ["4 AUFNAHMEN"], ["ORDNEN …"]], 'data-unless="zeitleiste_ok"')}</g>
    <g data-if="zeitleiste_ok">${screenText([["DATEI 5 · IDX 5281"], ["GESPERRT", "#d4443a"], ["KENNWORT?", "#e6c48a"]], 'data-unless="datei5_offen"')}</g>
    <g data-if="datei5_offen">${screenText([["TÜR TECHNIK"], ["FREIGEGEBEN", "#9fe0b0"], ["F3 FEHLT!", "#e6c48a"]], "")}</g>
    <rect x="684" y="388" width="40" height="18" fill="#e6dcc3" transform="rotate(6 704 397)"/></g>
  <polygon points="80,560 800,560 760,470 120,470" fill="#2a2d29" stroke="#3a3f3a" stroke-width="2"/><rect x="80" y="560" width="720" height="30" fill="#232622"/>
  ${[180, 260, 340, 420].map((x, i) => `<rect x="${x}" y="495" width="54" height="34" rx="4" fill="#3a3f3a"/><text x="${x + 27}" y="517" text-anchor="middle" fill="#b6e0c4" font-family="DM Mono, monospace" font-size="11">CAM${i + 1}</text>`).join("")}
  <rect x="560" y="492" width="140" height="40" rx="4" fill="#3a3f3a"/><text x="630" y="517" text-anchor="middle" fill="#e6c48a" font-family="DM Mono, monospace" font-size="11">TECHNIK</text>
  <rect x="90" y="590" width="700" height="210" fill="#060706"/>
  <g data-unless="taken_sicherung"><rect x="380" y="730" width="90" height="46" rx="4" fill="#3a3f3a" stroke="#5a5f58"/><rect x="398" y="744" width="54" height="16" rx="6" fill="#c9a466"/><text x="425" y="790" text-anchor="middle" fill="#8a8f88" font-family="DM Mono, monospace" font-size="9">ERSATZTEILE T.</text></g>
  <g><rect x="850" y="180" width="250" height="620" fill="#0a0b0a"/>
    <g data-unless="datei5_offen"><rect x="862" y="192" width="226" height="608" fill="#3d3f3a" stroke="#2a2a26" stroke-width="3"/><rect x="900" y="230" width="150" height="34" fill="#e6c48a"/><text x="975" y="253" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="14" letter-spacing="3">TECHNIK</text>
      <circle cx="1060" cy="500" r="7" fill="#d4443a" data-unless="datei5_offen"/><circle cx="1060" cy="500" r="7" fill="#7fa36d" data-if="datei5_offen"/></g>
    <g data-if="datei5_offen"><rect x="862" y="192" width="226" height="608" fill="#020202"/><polygon points="862,192 812,214 812,778 862,800" fill="#3d3f3a" stroke="#2a2a26" stroke-width="3"/></g></g>
  `);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "ueberwachung",
    name: "Überwachungsraum",
    title: "Der Überwachungsraum",
    kicker: "UNTERGESCHOSS / SICHERHEIT",
    story: "Alte Röhrenmonitore, Staub und warme Elektronik. Die Technik läuft noch – aber nicht mehr zuverlässig.",
    ambient: "static",
    exitLabel: "Durch die Tür „Technik“",
    exitVia: "door",
    views: [
      {
        id: "nord", dir: "NORD", name: "Eingang", scene: nord,
        desc: "Die Stahltür zum Archiv, ein Dienstplan an der Wand, ein Wandtelefon mit abgerissenem Kabel und eine stehen gebliebene Uhr.",
        hotspots: [
          { id: "ue_tuer", label: "Zurück ins Archiv", x: 39.2, y: 22.2, w: 21.7, h: 66.7, go: "archiv", via: "door" },
          { id: "dienstplan", label: "Dienstplan", x: 68.3, y: 33.3, w: 13.3, h: 21.1, secret: true, title: "Der Dienstplan", text: "Der Dienstplan jener Nacht. Am unteren Rand steht etwas in Elias’ Handschrift.", doc: "dienstplan" },
          { id: "wandtelefon", label: "Wandtelefon", x: 19.2, y: 36.7, w: 5.8, h: 12.2, title: "Das Wandtelefon", text: "Das Kabel ist abgerissen, nicht durchgeschnitten. Jemand hat es in Eile herausgezogen." },
          { id: "ue_uhr", label: "Uhr", x: 24.8, y: 21.5, w: 5.4, h: 7.2, title: "Die Wanduhr", text: "Auch hier: <b>23:17</b>. Alle Uhren im Haus sind zur selben Minute stehen geblieben." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Monitorwand", scene: ost,
        desc: "Vier Röhrenmonitore. Auf Monitor 3 steht in Rot: KEIN SIGNAL.",
        hotspots: [
          { id: "monitor1", label: "Monitor 1 – Lobby", x: 13.3, y: 25.6, w: 15.8, h: 16.7, title: "Monitor 1 – Lobby", text: "Ein Standbild: die Lobby im Dunkeln, die Uhr über dem Empfang. Zeitstempel <b>23:17</b>." },
          { id: "monitor2", label: "Monitor 2 – Flur", x: 32.5, y: 25.6, w: 15.8, h: 16.7, unless: "monitor2_gesehen", title: "Monitor 2 – Flur", text: "Nur Rauschen und Bildstörungen." },
          { id: "monitor2_live", label: "Monitor 2 – LIVE", x: 32.5, y: 25.6, w: 15.8, h: 16.7, if: "monitor2_live", title: "Monitor 2 – LIVE", text: "Ein klares Bild: der Flur zur Lobby, <b>heute, 14.10.2026</b>. Jemand steht dort und sieht direkt in die Kamera – dann flackert das Bild." },
          { id: "monitor2b", label: "Monitor 2 – Flur", x: 32.5, y: 25.6, w: 15.8, h: 16.7, if: "monitor2_gesehen", title: "Monitor 2 – Flur", text: "Wieder nur Rauschen. Aber eben war da ein Bild – <b>und das war keine alte Aufnahme. Das Bild war live.</b>" },
          { id: "monitor3", label: "Monitor 3 – Innenhof", x: 51.7, y: 25.6, w: 15.8, h: 16.7, unless: "band_eingelegt", title: "Monitor 3 – Innenhof", text: "<b>KAMERA 3 – SIGNAL UNTERBROCHEN.</b> Darunter ein Aufkleber: „Aufzeichnung nur über Sicherheitsrekorder wiederherstellbar.“" },
          { id: "monitor3b", label: "Monitor 3 – Innenhof", x: 51.7, y: 25.6, w: 15.8, h: 16.7, if: "band_eingelegt", title: "Monitor 3 – Innenhof", doc: "aufnahme_k3" },
          { id: "monitor4", label: "Monitor 4 – Büro", x: 70.8, y: 25.6, w: 15.8, h: 16.7, title: "Monitor 4 – Büro", text: "Ein Standbild ohne Zeitangabe: ein leeres Büro, ein Regal, eine Lücke zwischen den Büchern." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Rekorder", scene: sued,
        desc: "Ein Regal voller Videokassetten, viele Hüllen leer. Auf dem Tisch ein alter Sicherheitsrekorder.",
        hotspots: [
          { id: "bandregal", label: "Bandregal", x: 10, y: 22.2, w: 38.3, h: 55.6, title: "Das Bandregal", text: "Hunderte Kassetten, nach Kamera und Datum sortiert. Viele Hüllen sind leer." },
          { id: "huelle", label: "Hülle „CAM 3“", x: 34.2, y: 51, w: 4.5, h: 11, title: "Eine leere Hülle", doc: "leere_huelle" },
          { id: "rekorder", label: "Rekorder", x: 56.7, y: 53, w: 30, h: 9.5, title: "Der Sicherheitsrekorder", text: "Ein schwerer Bandrekorder. Der Bandschacht ist leer, das Display zeigt --:--:--.", use: "band" },
          { id: "loeschprotokoll", label: "Druckerstreifen", x: 72, y: 45, w: 4.5, h: 9, title: "Ein Druckerstreifen", text: "Aus dem Rekorder hängt ein vergilbter Thermopapierstreifen.", doc: "loeschprotokoll", actions: [{ evidence: "loeschprotokoll" }] },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Schaltpult", scene: west,
        desc: "Ein Schaltpult mit Indexterminal und Kameratasten. Rechts die Tür „Technik“. Unter dem Pult ist es stockdunkel.",
        dark: { x: 7.5, y: 65.5, w: 58.3, h: 23.5 },
        hotspots: [
          { id: "terminal_leer", label: "Indexterminal", x: 38.3, y: 24.4, w: 23.3, h: 22.2, unless: "band_eingelegt", title: "Das Indexterminal", text: "„DATENSATZ CAM 3 FEHLT.“ Ohne alle vier Kameras startet die Rekonstruktion nicht." },
          { id: "terminal", label: "Indexterminal", x: 38.3, y: 24.4, w: 23.3, h: 22.2, if: "band_eingelegt", unless: "zeitleiste_ok", title: "Das Indexterminal", lock: "zeitleiste" },
          { id: "terminal_datei5", label: "Datei 5", x: 38.3, y: 24.4, w: 23.3, h: 22.2, if: "zeitleiste_ok", title: "Datei 5", text: "Am Rand des Bildschirms klebt ein Zettel in Elias’ Handschrift.", doc: "kennwortzettel", lock: "datei5" },
          { id: "pult", label: "Schaltpult", x: 10, y: 52.5, w: 56, h: 12, title: "Das Schaltpult", text: "Vier Kameratasten und eine Taste „TECHNIK“. Sie leuchtet erst, wenn Datei 5 geöffnet ist." },
          { id: "unter_pult", label: "Unter dem Pult", x: 8, y: 66, w: 57, h: 22, unless: "licht", title: "Unter dem Pult", text: "Pechschwarz. Du ertastest kalte Kabel – und etwas Kantiges. Ohne Licht siehst du nichts." },
          { id: "sicherung", label: "Ersatzteilkiste", x: 31.7, y: 80.5, w: 7.5, h: 6, if: "licht", unless: "taken_sicherung", take: "sicherung", solves: "sicherung", takeText: "Im Lichtkegel: eine Metallkiste „Ersatzteile T.“. Darin eine schwere Schmelzsicherung, beschriftet „F3 – Generator West“. Du nimmst sie mit." },
          { id: "technik_zu", label: "Tür „Technik“", x: 70.8, y: 20, w: 20.8, h: 68.9, unless: "datei5_offen", title: "Die Tür „Technik“", text: "Verriegelt. Ein rotes Lämpchen. Die Freigabe erfolgt über das Pult." },
          { id: "technik", label: "Durch die Tür „Technik“", x: 70.8, y: 20, w: 20.8, h: 68.9, if: "datei5_offen", go: "keller", via: "door" },
        ],
      },
    ],
    events: [
      {
        id: "live", view: "ost", ifSolved: "band", delay: 900,
        actions: [{ flag: "monitor2_live" }, { sound: "relay" }, { later: { ms: 2200, actions: [{ unflag: "monitor2_live" }, { flag: "monitor2_gesehen" }], narrate: "Rauschen. Monitor 2 zeigt wieder nur Störungen.", view: "ost" } }],
        narrate: "Monitor 2 flackert – für einen Moment ein klares Bild: der Flur zur Lobby, mit dem Datum von <b>heute</b>. Jemand steht dort und sieht in die Kamera.",
      },
    ],
    puzzles: {
      band: {
        type: "use", item: "backupband", title: "Bandschacht", quiet: true,
        wrongItem: "Das passt nicht in den Bandschacht.",
        noItems: "Du hast kein Band, das du einlegen könntest.",
        objective: "Stelle die Aufnahme von Kamera 3 wieder her.",
        hints: [
          "Ein Monitor hat kein Bild. Vielleicht fehlt etwas, das du bereits gefunden hast.",
          "Die leere Hülle im Süden trägt dieselbe Bezeichnung wie das Band aus dem Archiv.",
          "Benutze das Backup-Band am Rekorder im Süden.",
        ],
        success: "Der Rekorder zieht das Band langsam ein. Ein mechanisches Klicken – irgendwo hinter dir springt ein Monitor an.",
        onSolve: [
          { remove: "backupband" }, { flag: "band_eingelegt" }, { sound: "tape" }, { evidence: "leere_huelle" }, { evidence: "aufnahme_k3" }, { message: "m_k3" },
          { later: { ms: 1500, actions: [{ open: "aufnahme_k3" }], narrate: "Monitor 3 zeigt wieder ein Bild: den Innenhof in jener Nacht." } },
        ],
      },
      zeitleiste: {
        type: "sort", title: "Rekonstruktion der Nacht", plain: true, checkButton: true, button: "Rekonstruktion prüfen",
        help: "Ziehe die Aufnahmen in zeitliche Reihenfolge – oder verschiebe sie mit ▲ ▼. Dann prüfen.",
        prompt: "Das Terminal zeigt vier Standbilder. Nicht alle tragen einen Zeitstempel. Bring sie in die Reihenfolge, in der sie aufgenommen wurden.",
        items: [
          { id: "A", text: "A · Lobby · 23:17 – der Strom fällt aus", html: T.A },
          { id: "B", text: "B · Generatorraum – Notstrom läuft an (ohne Zeit)", html: T.B },
          { id: "C", text: "C · Innenhof · 23:24 – sechs Personen gehen durch Tor W2", html: T.C },
          { id: "D", text: "D · Managerbüro – Elias allein (ohne Zeit)", html: T.D },
        ],
        answer: ["A", "B", "C", "D"],
        start: ["D", "C", "A", "B"],
        wrongOrders: {
          "A,C,B,D": "Ohne Notstrom öffnet sich Tor W2 nicht.",
          "A,C,D,B": "Ohne Notstrom öffnet sich Tor W2 nicht.",
          "A,B,D,C": "Elias kam erst zurück, als alle draußen waren.",
          "A,D,B,C": "Elias kam erst zurück, als alle draußen waren.",
          "B,A,C,D": "Der Generator springt an, weil der Strom ausfällt – nicht vorher.",
        },
        wrongDefault: "So kann es nicht gewesen sein. Zwei Dokumente aus früheren Räumen helfen dir.",
        objective: "Rekonstruiere die Nacht am Indexterminal.",
        hints: [
          "Zwei Dokumente aus früheren Räumen helfen: Eines beschreibt, was Tor W2 braucht, das andere Elias’ Rückkehr.",
          "Tomasz’ Prüfprotokoll: „Tor W2 öffnet nur mit Notstrom.“ Elias’ Notiz: „Ich bin erst zurück, als alle draußen waren.“",
          "A → B → C → D.",
        ],
        success: "Das Terminal rattert: <b>DATEI 5 · INDEX 5281 · DATENSATZ GEFUNDEN.</b> Darunter, in Rot: <b>ZUGRIFF GESPERRT – PERSÖNLICHES KENNWORT ERFORDERLICH.</b>",
        onSolve: [{ flag: "zeitleiste_ok" }, { sound: "relay" }],
      },
      datei5: {
        type: "wheels", length: 4, title: "Datei 5 – Kennwort", quiet: true,
        prompt: "DATEI 5 (Index 5281) ist gefunden, aber gesperrt: <b>PERSÖNLICHES KENNWORT ERFORDERLICH.</b> Daneben Elias’ Zettel: <i>„Kennwort wie immer: der Name, der in keinem Register stehen durfte.“</i>",
        answers: ["MARA"],
        wrong: { VALE: "Das ist der Name, unter dem sie im Register stand.", VOSS: "Der Nachname stand in jedem Register.", ELIA: "Sein eigener Name stand auf jedem Dienstplan." },
        wrongDefault: "ZUGRIFF VERWEIGERT.",
        objective: "Öffne Datei 5.",
        hints: [
          "Welcher Name durfte in keinem offiziellen Register stehen? Denk an das Gepäcklager.",
          "Im originalen Gepäckverzeichnis steht, wer M. Vale wirklich war.",
          "MARA.",
        ],
        success: "ZUGRIFF GEWÄHRT. Das Pult gibt einen tiefen Signalton von sich. Auf dem Terminal: <b>TÜR TECHNIK – FREIGEGEBEN.</b> Darunter blinkt gelb: <b>WARNUNG: GENERATOR WEST OHNE SICHERUNG F3.</b>",
        onSolve: [
          { flag: "datei5_offen" }, { sound: "relay" }, { unlock: "keller" }, { evidence: "datei5" }, { message: "m_kennwort" },
          { later: { ms: 600, actions: [{ open: "datei5" }] } },
        ],
      },
      sicherung: {
        type: "event", step: true, title: "Ersatzsicherung",
        objective: "Besorge eine Sicherung für den Generator.",
        hints: [
          "Das Terminal warnt: Dem Generator fehlt die Sicherung F3. Tomasz hatte Ersatzteile irgendwo hier.",
          "Unter dem Schaltpult (Westen) ist es stockdunkel. Dein Telefon hat eine Taschenlampe.",
          "Schalte die Taschenlampe ein und leuchte unter das Schaltpult. Nimm die Sicherung aus der Kiste „Ersatzteile T.“.",
        ],
        success: "Du hast die Ersatzsicherung F3.",
      },
    },
    completeWhen: ["band", "zeitleiste", "datei5", "sicherung"],
  });
})();
