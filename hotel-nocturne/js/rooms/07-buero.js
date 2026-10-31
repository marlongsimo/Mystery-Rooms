/*
 * STATION 7 – DAS MANAGERBÜRO (Westflügel, Erdgeschoss) · FINALE
 * Rätsel 20 Abschlussbericht (fünf Fragen, nur „x von 5“) · 21 Tor W2 (Minute, in der alle draußen waren).
 * Man kommt durch das Bücherregal herein – es ist die Geheimtür am Ende des W-Gangs.
 * Kein neues Pflichtdokument: alles Nötige liegt bereits in der Akte.
 * Nach dem Tor folgt die Finalszene (room.finale), danach der Abschlussbildschirm.
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_mara: {
      from: "Unbekannte Nummer",
      text: "Du hast die Wahrheit gefunden.<br><br>Mein Name ist <b>Mara Voss</b>. M. Vale war nie mein richtiger Name. Ich war eine der sechs, die mein Vater in jener Nacht hinausgebracht hat.<br><br>Alles, was ich gefunden hätte, hätte man als Fälschung abgetan – die Tochter, die ihren Vater reinwaschen will. Ich brauchte jemanden, der die Beweise selbst findet. Ich habe dir Türen geöffnet. Jeden Beweis hast du selbst entdeckt.<br><br>Danke, dass du meinem Vater geglaubt hast.",
    },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    brief_schreibtisch: {
      title: "Brief auf dem Schreibtisch", kind: "letter",
      html: `<p>Sie haben die einzelnen Teile gefunden. Jetzt müssen Sie verstehen, was sie gemeinsam bedeuten.</p>
        <p>Wer bis hierher gekommen ist, kennt die Wahrheit bereits. Ich habe die Gäste hinausgebracht. Erst als alle draußen waren, bin ich zurückgekehrt. <span class="smudge">Lehn wird sagen, dass</span> <span class="smudge">niemand hätte überleben</span> …</p>
        <p>Den Code des Tores habe ich noch in derselben Nacht neu gesetzt. <b>Das Tor merkt sich die Minute, in der alle draußen waren.</b></p>
        <p>Der Tresor öffnet sich nur für jemanden, der den ganzen Bericht schreiben kann.</p>
        <p class="sign">E. V.</p>`,
    },
    kalender: {
      title: "Tischkalender, 14. Oktober 2009", kind: "note",
      html: `<p class="doc-head">MITTWOCH<br><small>14. OKTOBER 2009</small></p>
        <p class="mono">18:00 Übergabe Ilse<br>21:30 Anruf Lehn (Kosten Westtrakt)<br>22:00 Dienstbeginn</p>
        <p class="handwriting">23:17 Strom weg → Notstrom.<br>Westgang!</p>
        <p class="dim">Die letzte Zeile ist in Eile geschrieben, die Tinte ist verwischt.</p>`,
    },
    fluchtplan: {
      title: "Fluchtplan Westflügel", kind: "register",
      html: `<p class="doc-head">FLUCHTWEG WESTFLÜGEL<br><small>HANDSKIZZE · T. / E.</small></p>
        <svg viewBox="0 0 420 210" role="img" aria-label="Skizze: Keller, W-Gang, Managerbüro, Servicetunnel, Rampe, Tor W2" style="width:100%;height:auto">
          <g font-family="DM Mono, monospace" font-size="11" fill="#2a2119">
            <rect x="10" y="150" width="90" height="40" fill="none" stroke="#2a2119"/><text x="55" y="174" text-anchor="middle">KELLER</text>
            <path d="M100 170 L150 120" stroke="#2a2119" stroke-width="2" stroke-dasharray="5 4" fill="none"/><text x="104" y="136">W-Gang ↗</text>
            <rect x="150" y="90" width="100" height="44" fill="none" stroke="#2a2119"/><text x="200" y="110" text-anchor="middle">BÜRO</text><text x="200" y="124" text-anchor="middle" font-size="9">(Regal = Tür)</text>
            <path d="M250 112 H320" stroke="#2a2119" stroke-width="2" fill="none"/><text x="256" y="104" font-size="9">Servicetunnel</text>
            <path d="M320 112 L360 60" stroke="#2a2119" stroke-width="2" fill="none"/><text x="330" y="96" font-size="9">Rampe</text>
            <rect x="350" y="30" width="58" height="30" fill="none" stroke="#6b2420" stroke-width="2"/><text x="379" y="50" text-anchor="middle" fill="#6b2420">W2</text>
            <text x="250" y="190" font-size="10">Notstrom: C – A – D – B</text>
          </g>
        </svg>
        <p class="handwriting margin">Nur im Notfall. Nicht in die Pläne der Direktion. – T.</p>`,
    },
    wartungsregister: {
      title: "Originales Wartungsregister", kind: "register",
      html: `<p class="doc-head">WARTUNGSREGISTER<br><small>HAUSTECHNIK · 2007–2009</small></p>
        <table class="doc-table"><thead><tr><th>Datum</th><th>Anlage</th><th>Eintrag</th></tr></thead><tbody>
          <tr><td>28.09.2009</td><td>Servicetunnel W</td><td>geprüft, voll funktionsfähig – T.</td></tr>
          <tr><td>01.10.2009</td><td>Servicetunnel W</td><td><span class="handwriting other">laut Direktion „stillgelegt“ – V.L.</span></td></tr>
          <tr><td>14.10.2009</td><td>Notstrom West</td><td>23:19 von Hand gestartet – E.V.</td></tr>
          <tr><td>14.10.2009</td><td>Tor W2</td><td><span class="handwriting">23:21 Evakuierung über Westgang. 6 Personen. – E.V.</span></td></tr>
        </tbody></table>
        <p class="dim">Das Buch hat genau die Maße der Lücke im Bücherregal.</p>`,
    },
    umschlag: {
      title: "Umschlag aus dem Tresor", kind: "note",
      html: `<p class="handwriting big">Für den Fall, dass jemand die Wahrheit findet.</p>
        <p class="mono dim">Auf der Rückseite, kleiner: „Bitte erst draußen öffnen.“</p>`,
    },
    foto_2005: {
      title: "Foto: Elias und Mara, Sommer 2005", kind: "photo", pageLabels: ["Vorderseite", "Rückseite"],
      pages: [
        `<svg viewBox="0 0 360 240" role="img" aria-label="Ein Mann in Hoteluniform und ein Mädchen vor einem Tor in einer Mauer, Sommer"><rect width="360" height="240" fill="#c9b48e"/><rect x="0" y="150" width="360" height="90" fill="#a8946c"/>
          <rect x="40" y="40" width="280" height="130" fill="#8e7a58"/><rect x="200" y="70" width="70" height="100" fill="#3a3024"/><text x="235" y="62" text-anchor="middle" fill="#3a3024" font-family="DM Mono, monospace" font-size="12">W2</text>
          <g fill="#2e261c"><circle cx="120" cy="96" r="13"/><rect x="104" y="110" width="32" height="66" rx="8"/><circle cx="160" cy="118" r="10"/><rect x="148" y="129" width="24" height="46" rx="7"/></g>
          <rect width="360" height="240" fill="#f3e2b8" opacity=".18"/></svg>`,
        `<p class="handwriting big">Sommer 2005.<br>Wer nachts wacht, findet den Weg.</p><p class="handwriting sign">Papa</p>`,
      ],
    },
  });

  /* ---------- Grundgerüst: holzvertäfeltes Büro ---------- */
  const office = (p, body) => scene(p, `
  <rect width="1200" height="616" fill="#1b1714"/><rect width="1200" height="616" fill="url(#${p}-paper)" opacity=".7"/>
  <g stroke="#2a221b" stroke-width="2" opacity=".6">${[150, 450, 750, 1050].map((x) => `<line x1="${x}" y1="60" x2="${x}" y2="600"/>`).join("")}</g>
  ${body}`);

  /* ---------- NORD: Schreibtisch ---------- */
  const nord = office("bn", `
  <g transform="translate(600,170)"><circle r="52" fill="#1a140f"/><circle r="44" fill="#cdbd9b" stroke="url(#bn-brass)" stroke-width="6"/>
    <line y2="-22" stroke="#17110b" stroke-width="5" stroke-linecap="round" transform="rotate(338.5)"/><line y2="-34" stroke="#17110b" stroke-width="3" stroke-linecap="round" transform="rotate(102)"/><circle r="4" fill="#17110b"/></g>
  <ellipse cx="350" cy="420" rx="260" ry="200" fill="url(#bn-glow)" class="flicker"/>
  <rect x="200" y="470" width="800" height="26" fill="#3b2b1e" stroke="#1a130d" stroke-width="3"/>
  <rect x="230" y="496" width="740" height="150" fill="#2c2017" stroke="#1a130d" stroke-width="3"/>
  <rect x="520" y="514" width="160" height="44" fill="#33251a" stroke="#1a130d" stroke-width="2"/><rect x="584" y="532" width="32" height="8" rx="3" fill="#806040"/>
  <rect x="230" y="646" width="30" height="110" fill="#22190f"/><rect x="940" y="646" width="30" height="110" fill="#22190f"/>
  <g><path d="M330 470 v-110" stroke="#806040" stroke-width="6"/><ellipse cx="330" cy="470" rx="34" ry="8" fill="#806040"/><path d="M286 362 L374 362 L352 318 L308 318 Z" fill="#2f5a3a" stroke="#1d3a25" stroke-width="2"/><ellipse cx="330" cy="366" rx="40" ry="6" fill="#f3d79a" opacity=".55"/></g>
  <g transform="rotate(-4 610 462)"><rect x="560" y="446" width="110" height="26" fill="#e6dcc3"/><g stroke="#6c5a44" stroke-width="1.2">${[452, 458, 464].map((y) => `<line x1="568" y1="${y}" x2="660" y2="${y}"/>`).join("")}</g></g>
  <g><rect x="760" y="400" width="90" height="72" fill="#e6dcc3" stroke="#3b2b1e" stroke-width="3"/><rect x="760" y="400" width="90" height="18" fill="#7a2620"/><text x="805" y="413" text-anchor="middle" fill="#e6dcc3" font-family="DM Mono, monospace" font-size="10">OKTOBER</text><text x="805" y="452" text-anchor="middle" fill="#2a2119" font-family="Playfair Display, serif" font-size="30">14</text><path d="M772 462 h66" stroke="#7a2620" stroke-width="2"/></g>
  <g><rect x="460" y="446" width="26" height="24" rx="4" fill="#15120f" stroke="#806040"/><path d="M482 448 l30 -26" stroke="#2a2119" stroke-width="4"/></g>
  <g fill="#c9a466" opacity=".0" data-if="licht"><rect x="586" y="652" width="28" height="8" rx="2" opacity="1"/></g>`);

  /* ---------- OST: Bücherregal = Geheimtür zum W-Gang ---------- */
  const books = (x0, y, n, gap = -1) => Array.from({ length: n }, (_, i) => i === gap ? "" : `<rect x="${x0 + i * 26}" y="${y - 70 - (i * 7) % 18}" width="22" height="${70 + (i * 7) % 18}" fill="${["#5b2a22", "#2f3a33", "#3b2b1e", "#4a3f2a", "#2a2d3a"][i % 5]}"/>`).join("");
  const ost = office("bo", `
  <rect x="200" y="110" width="440" height="560" fill="#2a1f16" stroke="#1a130d" stroke-width="5"/>
  ${[230, 350, 470, 590].map((y) => `<rect x="214" y="${y}" width="412" height="10" fill="#3b2b1e"/>`).join("")}
  ${books(222, 230, 15)}${books(222, 350, 15, 8)}${books(222, 470, 15)}${books(222, 590, 15)}
  <rect x="430" y="344" width="26" height="6" fill="#4a3f30" opacity=".8"/>
  <rect x="640" y="110" width="220" height="560" fill="#050505"/>
  <path d="M660 670 L700 420 L800 420 L840 670 Z" fill="#14120f"/><rect x="712" y="300" width="76" height="120" fill="#0a0908"/>
  <polygon points="860,110 960,150 960,690 860,670" fill="#22190f" stroke="#1a130d" stroke-width="4"/>
  <text x="910" y="400" text-anchor="middle" fill="#8a8f88" font-family="DM Mono, monospace" font-size="14" transform="rotate(90 910 400)">W-GANG</text>
  <g><rect x="990" y="190" width="160" height="200" fill="#3b2b1e"/><rect x="1004" y="204" width="132" height="172" fill="#e6dcc3"/>
    <path d="M1018 340 L1046 310 L1080 310 L1100 270 L1120 250" stroke="#2a2119" stroke-width="3" fill="none" stroke-dasharray="6 4"/><rect x="1108" y="232" width="20" height="16" fill="none" stroke="#7a2620" stroke-width="2"/></g>`);

  /* ---------- SÜD: Wandtresor ---------- */
  const sued = office("bs", `
  <rect x="440" y="230" width="320" height="320" fill="#120f0c"/>
  <g data-unless="tresor_offen"><rect x="460" y="250" width="280" height="280" rx="6" fill="#3a3c37" stroke="#22231f" stroke-width="5"/>
    <circle cx="600" cy="390" r="60" fill="#2a2b28" stroke="#5a5c55" stroke-width="5"/>${Array.from({ length: 20 }, (_, i) => `<line x1="600" y1="336" x2="600" y2="346" stroke="#9a9c94" stroke-width="2" transform="rotate(${i * 18} 600 390)"/>`).join("")}<circle cx="600" cy="390" r="16" fill="#5a5c55"/>
    <rect x="690" y="370" width="30" height="40" rx="4" fill="#5a5c55"/></g>
  <g data-if="tresor_offen"><rect x="460" y="250" width="280" height="280" fill="#0d0b09"/><rect x="470" y="380" width="260" height="8" fill="#2a2b28"/>
    <rect x="610" y="300" width="90" height="50" rx="4" fill="#2a2b28"/><text x="655" y="320" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="10">TUNNEL W</text><text x="655" y="336" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="10">ENTRIEGELT</text>
    <polygon points="460,250 380,280 380,520 460,530" fill="#3a3c37" stroke="#22231f" stroke-width="4"/></g>
  <g transform="rotate(2 840 340)"><rect x="780" y="260" width="130" height="170" fill="#e6dcc3"/><text x="845" y="284" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="10">ABSCHLUSSBERICHT</text>
    <g stroke="#6c5a44" stroke-width="1.2">${[1, 2, 3, 4, 5].map((i) => `<text x="792" y="${300 + i * 22}" fill="#2a2119" font-family="DM Mono, monospace" font-size="10">${i}.</text><line x1="806" y1="${302 + i * 22}" x2="896" y2="${302 + i * 22}"/>`).join("")}</g></g>
  <rect x="160" y="180" width="200" height="140" fill="#3b2b1e"/><rect x="172" y="192" width="176" height="116" fill="#1d2423"/><text x="260" y="256" text-anchor="middle" fill="#806040" font-family="Playfair Display, serif" font-size="16" font-style="italic">Hotel Nocturne 1897</text>`);

  /* ---------- WEST: Fenster zum Innenhof, Tür zum Servicetunnel ---------- */
  const rain = Array.from({ length: 22 }, (_, i) => `<line x1="${150 + (i * 47) % 470}" y1="${140 + (i * 31) % 300}" x2="${140 + (i * 47) % 470}" y2="${180 + (i * 31) % 300}"/>`).join("");
  const west = office("bw", `
  <rect x="120" y="120" width="520" height="440" fill="#3b2b1e"/>
  <rect x="136" y="136" width="488" height="408" fill="#0d1416"/>
  <rect x="136" y="400" width="488" height="144" fill="#121a1b"/><rect x="136" y="300" width="488" height="110" fill="#1b2224"/>
  <rect x="460" y="330" width="70" height="80" fill="#0a0e0f" stroke="#5f7a66" stroke-width="2"/><text x="495" y="324" text-anchor="middle" fill="#5f7a66" font-family="DM Mono, monospace" font-size="12">W2</text>
  <rect x="536" y="360" width="10" height="14" fill="#9fe0b0" class="flicker"/>
  <g stroke="#9fb2c4" stroke-opacity=".25" stroke-width="1.4" class="rain-lines">${rain}</g>
  <rect x="376" y="136" width="8" height="408" fill="#3b2b1e"/><rect x="136" y="336" width="488" height="8" fill="#3b2b1e"/>
  <g><rect x="780" y="180" width="230" height="580" fill="#0d0e0d"/>
    <g data-unless="tunnel_offen"><rect x="790" y="190" width="210" height="570" fill="#4a4c46" stroke="#2a2b28" stroke-width="3"/><rect x="820" y="250" width="150" height="26" fill="#e6c48a"/><text x="895" y="268" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="11">SERVICETUNNEL W</text><rect x="960" y="460" width="18" height="50" rx="3" fill="#2a2b28"/><circle cx="969" cy="474" r="5" fill="#5a2a24"/></g>
    <g data-if="tunnel_offen"><polygon points="790,190 740,214 740,740 790,760" fill="#4a4c46" stroke="#2a2b28" stroke-width="3"/><path d="M800 760 L860 480 L930 480 L990 760 Z" fill="#1a1d1a"/><rect x="866" y="330" width="58" height="150" fill="#0a0b0a"/><ellipse cx="895" cy="360" rx="44" ry="30" fill="#9fe0b0" opacity=".12"/></g></g>`);

  /* ---------- Finalszene: Rampe, Tor W2, Innenhof ---------- */
  const finaleScene = (code) => `<svg viewBox="0 0 1200 700" class="finale-art" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="fz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1418"/><stop offset="1" stop-color="#2a3236"/></linearGradient>
      <radialGradient id="fz-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e7d7b0" stop-opacity=".35"/><stop offset="1" stop-color="#e7d7b0" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="700" fill="#070807"/>
    <g class="fz-yard"><rect x="420" y="150" width="360" height="380" fill="url(#fz-sky)"/><rect x="420" y="430" width="360" height="100" fill="#20282a"/>
      <ellipse cx="600" cy="300" rx="260" ry="200" fill="url(#fz-glow)"/>
      <g stroke="#9fb2c4" stroke-opacity=".3" stroke-width="1.4" class="fz-rain">${Array.from({ length: 16 }, (_, i) => `<line x1="${440 + i * 22}" y1="${160 + (i * 37) % 200}" x2="${432 + i * 22}" y2="${196 + (i * 37) % 200}"/>`).join("")}</g></g>
    <polygon points="0,700 420,530 780,530 1200,700" fill="#141614"/><g stroke="#2a2d29" stroke-width="2">${[0, 1, 2, 3, 4].map((i) => `<line x1="${120 + i * 240}" y1="700" x2="${470 + i * 65}" y2="530"/>`).join("")}</g>
    <polygon points="0,0 420,150 420,530 0,700" fill="#1a1c19"/><polygon points="1200,0 780,150 780,530 1200,700" fill="#1a1c19"/><polygon points="0,0 1200,0 780,150 420,150" fill="#121412"/>
    <g class="fz-gate-l"><rect x="420" y="150" width="180" height="380" fill="#2a2d29" stroke="#4a4c46" stroke-width="4"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${438 + i * 32}" y="166" width="10" height="348" fill="#3a3c37"/>`).join("")}</g>
    <g class="fz-gate-r"><rect x="600" y="150" width="180" height="380" fill="#2a2d29" stroke="#4a4c46" stroke-width="4"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${622 + i * 32}" y="166" width="10" height="348" fill="#3a3c37"/>`).join("")}</g>
    <text x="600" y="134" text-anchor="middle" fill="#8a8f88" font-family="DM Mono, monospace" font-size="20" letter-spacing="8">W2</text>
    <g transform="translate(860,330)"><rect width="56" height="80" rx="4" fill="#2a2b28" stroke="#4a4c46" stroke-width="2"/><rect x="8" y="8" width="40" height="12" fill="#0b2a1e"/><text x="28" y="18" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="9" class="fz-code">${code}</text>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${9 + (i % 3) * 13}" y="${28 + Math.floor(i / 3) * 15}" width="10" height="11" rx="2" fill="#4a4c46"/>`).join("")}</g>
  </svg>`;

  /* Wer das Foto in der Schublade gefunden hat, bekommt im Abspann einen zusätzlichen Satz */
  N.config.endingBonus = (N.config.endingBonus || []).concat([{ secret: "b_riegel", text: "Manche Erinnerungen bleiben länger als jedes Protokoll." }]);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "buero",
    name: "Managerbüro",
    title: "Das Managerbüro",
    kicker: "WESTFLÜGEL / ERDGESCHOSS",
    story: "Ein letztes Stück des Hotels. Das Managerbüro – seit Jahren nicht betreten. Eine Schreibtischlampe brennt. Draußen peitscht der Regen gegen das Fenster.",
    ambient: "rain",
    final: true,
    views: [
      {
        id: "nord", dir: "NORD", name: "Schreibtisch", scene: nord,
        desc: "Ein schwerer Schreibtisch unter einer grünen Lampe. Ein Brief, ein Tischkalender, Tinte und Feder. Unter der Platte ist es dunkel.",
        dark: { x: 19, y: 72, w: 62, h: 12 },
        hotspots: [
          { id: "b_brief", label: "Brief", x: 46.5, y: 48.5, w: 9.5, h: 4.5, title: "Ein Brief auf dem Schreibtisch", text: "Die Schrift kennst du inzwischen. An einer Stelle ist die Tinte verlaufen.", doc: "brief_schreibtisch" },
          { id: "b_kalender", label: "Tischkalender", x: 63, y: 44, w: 8, h: 8.5, title: "Der Tischkalender", doc: "kalender" },
          { id: "b_lampe", label: "Schreibtischlampe", x: 23.5, y: 35, w: 8, h: 18, title: "Die Lampe", text: "Sie brennt. Das Kabel führt zu einer Steckdose am Notstromkreis – seit du im Keller die Hebel umgelegt hast, hat dieses Büro wieder Licht." },
          { id: "b_uhr", label: "Wanduhr", x: 45.5, y: 13, w: 9, h: 12, title: "Die Wanduhr", text: "<b>23:17</b>. Wie jede Uhr in diesem Haus." },
          { id: "b_schublade", label: "Schublade", x: 43, y: 57, w: 14, h: 5, unless: "licht", title: "Die Schublade", text: "Sie klemmt. Irgendetwas hält sie von unten fest – aber unter der Tischplatte ist es zu dunkel, um zu sehen, was." },
          { id: "b_riegel", label: "Unter der Platte", x: 47, y: 71, w: 7, h: 4, if: "licht", secret: true, title: "Ein kleiner Riegel", text: "Im Lichtkegel: ein Messingriegel unter der Platte. Du schiebst ihn zurück, die Schublade gleitet auf. Darin liegt nur ein einziges Foto.", doc: "foto_2005" },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Bücherregal", scene: ost,
        desc: "Das Bücherregal, durch das du hereingekommen bist. Ein Teil davon steht offen wie eine Tür. Daneben hängt eine gerahmte Skizze.",
        hotspots: [
          { id: "b_regal", label: "Bücherregal", x: 17, y: 12, w: 36, h: 62, title: "Das Bücherregal", text: "Hotelchroniken, Personalhandbücher, Jahrgänge der Gästezeitung. Der rechte Teil des Regals ist keine Wand, sondern eine Tür – auf seiner Rückseite steht <b>W-GANG</b>." },
          { id: "b_luecke", label: "Lücke im Regal", x: 34.5, y: 30, w: 6, h: 9, title: "Eine Lücke", text: "Ein Staubrand zeichnet die Umrisse eines dicken, gebundenen Buches nach. Dieses Regal hast du schon einmal gesehen – auf <b>Monitor 4</b> im Überwachungsraum, als Standbild ohne Zeitangabe." },
          { id: "b_wgang", label: "Zurück durch den W-Gang", x: 53.5, y: 12, w: 19, h: 64, go: "keller", via: "door" },
          { id: "b_fluchtplan", label: "Gerahmte Skizze", x: 82.5, y: 21, w: 13.5, h: 23, title: "Eine gerahmte Skizze", text: "Bleistift auf Karton, hinter Glas. Zwei Handschriften.", doc: "fluchtplan" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Tresor", scene: sued,
        desc: "Ein Wandtresor in der Täfelung. Daneben klebt ein Formular: „Abschlussbericht“.",
        hotspots: [
          { id: "b_tresor", label: "Tresor", x: 38, y: 27, w: 24, h: 32, unless: "tresor_offen", title: "Der Tresor", lock: "bericht" },
          { id: "b_tresor_offen", label: "Tresor", x: 31.5, y: 27, w: 30.5, h: 32, if: "tresor_offen", title: "Der offene Tresor", text: "Leer bis auf einen Schalter: <b>TUNNEL W – ENTRIEGELT</b>." },
          { id: "b_formular", label: "Formular", x: 65, y: 28.5, w: 11, h: 19, title: "Das Formular", text: "Mit Schreibmaschine: <b>ABSCHLUSSBERICHT FALL 014-10</b>, fünf leere Zeilen. Darunter in Elias’ Handschrift: „Der Tresor öffnet sich erst, wenn der Bericht stimmt.“" },
          { id: "b_bild", label: "Bild", x: 13, y: 20, w: 17, h: 16, title: "Ein gerahmter Druck", text: "„Hotel Nocturne 1897“. Dahinter nur Wand. Manchmal ist ein Bild einfach ein Bild." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Fenster", scene: west,
        desc: "Ein hohes Fenster zum Innenhof. Drüben in der Mauer: Tor W2, daneben ein schwach leuchtendes Tastenfeld. Rechts eine Stahltür.",
        hotspots: [
          { id: "b_fenster", label: "Fenster", x: 10, y: 13, w: 43, h: 49, title: "Der Innenhof", text: "Regen auf nassem Pflaster. Genau hier sind sie um 23:24 Uhr gegangen – sechs Menschen, einer nach dem anderen. Das Tastenfeld neben Tor W2 leuchtet grün: Es hat Strom." },
          { id: "b_tunnel_zu", label: "Stahltür", x: 65.5, y: 20, w: 18.5, h: 64, unless: "tunnel_offen", title: "Servicetunnel West", text: "Verriegelt. Kein Schloss von dieser Seite, nur ein rotes Lämpchen. Die Entriegelung liegt woanders." },
          { id: "b_tunnel", label: "Durch den Servicetunnel", x: 65.5, y: 20, w: 18.5, h: 64, if: "tunnel_offen", title: "Am Ende der Rampe", lock: "tor" },
        ],
      },
    ],
    puzzles: {
      bericht: {
        type: "multi", title: "Abschlussbericht", akte: true, button: "Bericht einreichen",
        prompt: "Der Tresor hat kein Zahlenschloss, sondern fünf Eingabezeilen. Darüber: <b>„Der Fall kann erst geschlossen werden, wenn der Ablauf vollständig rekonstruiert ist.“</b>",
        fields: [
          { label: "Über welchen Ausgang wurden die Gäste evakuiert?", answers: ["WESTGANG", "W-GANG", "SERVICETUNNEL", "SERVICETUNNEL WEST", "WESTLICHER SERVICETUNNEL", "TUNNEL", "TOR W2", "W2", "WESTTOR"] },
          { label: "Wie viele Gäste verließen das Hotel?", answers: ["6", "SECHS"] },
          { label: "Wer kehrte danach allein ins Hotel zurück?", answers: ["ELIAS VOSS", "ELIAS", "VOSS", "E VOSS", "DER NACHTMANAGER", "NACHTMANAGER"] },
          { label: "Unter welchem Namen stand Mara im Gästeregister?", answers: ["M VALE", "VALE", "MARA VALE", "M. VALE"] },
          { label: "Wer ließ die Unterlagen fälschen?", answers: ["VIKTOR LEHN", "LEHN", "V LEHN", "DIREKTOR LEHN"] },
        ],
        wrongCount: "Der Tresor bleibt verschlossen. {n} von 5 Angaben sind korrekt.",
        objective: "Schreib den Abschlussbericht am Tresor.",
        hints: [
          "Alles, was du brauchst, liegt in deiner Akte. Im Tresor kannst du sie jederzeit aufschlagen – deine Eingaben bleiben stehen.",
          "Ausgang: Prüfprotokoll B und Bauakte · Anzahl und Rückkehr: Aufnahme Kamera 3 · Name: Gepäckverzeichnis · Fälschung: Systemprotokoll und Wandplan.",
          "Westgang · 6 · Elias Voss · M. Vale · Viktor Lehn.",
        ],
        success: "Ein leises Klicken. Die Tür schwingt auf. Darin liegt ein dickes, gebundenes Buch – das <b>originale Wartungsregister</b> – und ein Umschlag: „Für den Fall, dass jemand die Wahrheit findet.“ Daneben ein Schalter: TUNNEL W. Du legst ihn um. Hinter dir, im Westen, springt ein Schloss auf.",
        onSolve: [{ flag: "tresor_offen" }, { flag: "tunnel_offen" }, { sound: "unlock" }, { evidence: "wartungsregister" }, { doc: "umschlag" }, { later: { here: true, ms: 1400, actions: [{ sound: "gate" }] } }],
      },
      tor: {
        type: "code", length: 4, title: "Tor W2",
        prompt: `<span class="lock-scene">${finaleScene("– – – –")}</span>Der Gang führt über eine Rampe nach oben. Am Ende: Tor W2, nass vom Regen. Daneben ein altes Tastenfeld. Eine Plakette: <b>NOTAUSGANG – ZUTRITT NUR MIT FREIGABE</b>.`,
        answers: ["2324"],
        wrong: {
          2317: "Um 23:17 fiel der Strom aus. Da war noch niemand draußen.",
          2321: "23:21 – der Eintrag im Register. Da begann die Evakuierung erst.",
          1410: "Das Datum ist es nicht. Das Tor merkt sich eine Minute.",
        },
        wrongDefault: "Das Tastenfeld piept kurz. Nichts bewegt sich.",
        objective: "Öffne Tor W2.",
        hints: [
          "Lies den letzten Satz von Elias’ Brief auf dem Schreibtisch noch einmal.",
          "Welche Minute zeigte die Aufnahme von Kamera 3, als alle sechs draußen waren?",
          "2324.",
        ],
        success: "Das Tastenfeld leuchtet grün.",
        onSolve: [{ flag: "tor_offen" }, { sound: "gate" }],
      },
    },
    completeWhen: ["bericht", "tor"],
    /* Finalszene nach dem Tor (engine: startFinale) – im Multiplayer für alle */
    finale: {
      scene: finaleScene("2324"),
      steps: [
        { text: "Das Tastenfeld leuchtet grün. Tief in der Mauer setzt sich ein Mechanismus in Gang.", ms: 4200, sound: "rumble" },
        { text: "Tor W2 schwingt auf. Kalte Luft, nasses Pflaster – der Innenhof.", ms: 5200, sceneClass: "open", sound: "gate" },
        { text: "Der Regen wird leiser. Hier haben sie gestanden, sechs Menschen, um 23:24 Uhr.", ms: 5600, sceneClass: "calm" },
        { message: "m_mara", ms: 12000 },
        { text: "Sechs Gäste gerettet. Ein Mann zu Unrecht beschuldigt. Siebzehn Jahre Schweigen.", ms: 6500, big: true },
        { end: "Den Umschlag öffnen" },
      ],
    },
  });
})();
