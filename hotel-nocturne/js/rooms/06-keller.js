/*
 * STATION 6 – KELLER / TECHNIK (Untergeschoss, alte Wäscherei)
 * Rätsel 17 Generator (Sicherung F3 + Startfolge) · 18 Der Plan lügt (Hebel C–A–D–B)
 * · 19 Die Tür, die niemand sehen sollte (Schraubendreher + Magnetschloss).
 * Der ganze Raum ist dunkel, bis der Strom richtig verteilt ist (darkUntil: "strom").
 * Schrank und Hebel lassen sich in beliebiger Reihenfolge angehen; die Stahltür hinter
 * dem Schrank öffnet erst, wenn beides erledigt ist.
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_strom: { from: "Unbekannte Nummer", text: "Er hat diesen Plan aufhängen lassen. Damit niemand mehr nach dem Weg fragt." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    startanleitung: {
      title: "Startanleitung Notstromaggregat West", kind: "register",
      html: `<p class="doc-head">NOTSTROMAGGREGAT WEST<br><small>INBETRIEBNAHME VON HAND</small></p>
        <p class="mono"><b>Vor dem Start:</b> Sicherung F3 (30 A) eingesetzt?</p>
        <ol class="mono steps">
          <li>Kraftstoffhahn öffnen (Hebel senkrecht)</li>
          <li><span class="stain">Choke ziehen</span></li>
          <li>Zündung <b>EIN</b></li>
          <li>Starter drücken, bis der Motor läuft</li>
        </ol>
        <p class="mono dim">Choke nach 30 Sekunden zurückschieben. Danach Verteilung an der Schalttafel (Süd) schalten.</p>
        <p class="handwriting margin">Reihenfolge einhalten, sonst säuft er ab! – T.</p>`,
    },
    wandplan: {
      title: "Wandplan Notstromverteilung", kind: "register",
      html: `<p class="doc-head">NOTSTROMVERTEILUNG – TOR W2<br><small>HAUPTVERTEILUNG UG · STAND 10/2009</small></p>
        <p class="mono big-seq">GENERATOR → A → B → C → D</p>
        <p class="handwriting other">Tor W2: stillgelegt.</p>
        <p class="stamp">FREIGEGEBEN · DIREKTION</p><p class="handwriting sign">V. Lehn</p>
        <p class="dim">Das Papier ist neuer als alles andere hier unten. Die Ecken sind kaum vergilbt.</p>`,
    },
    alte_verbindung: {
      title: "Eine alte Verbindung", kind: "note",
      html: `<p class="mono">Ins Rohr geritzt, unter Rost und Kalk:</p>
        <p class="handwriting big">T. + E. – 1999 –<br>hier unten hört uns keiner</p>
        <p class="dim">Tomasz und Elias kannten diesen Keller offenbar schon zehn Jahre vor jener Nacht.</p>`,
    },
  });

  /* ---------- Grundgerüst: nasser Betonkeller ---------- */
  const water = (p) => `
  <rect y="716" width="1200" height="184" fill="#0b1213"/><rect y="716" width="1200" height="184" fill="#7c98a8" opacity=".05"/>
  <g stroke="#9fb6c4" stroke-opacity=".14" stroke-width="2" fill="none" class="ripple">
    <path d="M60 744 q40 -6 80 0 t80 0"/><path d="M420 770 q50 -6 100 0 t100 0"/><path d="M820 752 q40 -5 80 0 t80 0"/><path d="M240 820 q60 -7 120 0 t120 0"/><path d="M760 850 q60 -7 120 0 t120 0"/>
  </g>
  <rect y="714" width="1200" height="3" fill="#9fb6c4" opacity=".18"/>`;
  const cellar = (p, body, after = "") => scene(p, `
  <rect width="1200" height="760" fill="#191a18"/>
  <g fill="#ffffff" opacity=".02"><rect y="160" width="1200" height="2"/><rect y="320" width="1200" height="2"/><rect y="480" width="1200" height="2"/><rect y="640" width="1200" height="2"/></g>
  <g fill="#000" opacity=".22"><path d="M140 0 q20 160 -10 300 q-12 80 6 160 v300 h40 v-320 q-20 -90 -4 -170 q16 -120 -2 -270 z"/><path d="M1040 0 q-12 120 14 220 q10 60 -8 120 h26 q16 -70 2 -130 q-20 -100 -4 -210 z"/></g>
  <rect y="34" width="1200" height="16" fill="#252622"/>
  ${body}
  ${water(p)}
  ${after}
  <g data-if="strom"><ellipse cx="600" cy="90" rx="420" ry="200" fill="url(#${p}-glow)" opacity=".55"/></g>
  <rect width="1200" height="900" fill="#000" opacity=".96" data-if="flackern"/>`, { wainscot: false });
  const cage = (x, y) => `<g><rect x="${x - 26}" y="${y}" width="52" height="10" fill="#2f312d"/><path d="M${x - 22} ${y + 10} q22 46 44 0" fill="#1a1b19" stroke="#4a4c46" stroke-width="2"/>
    <ellipse cx="${x}" cy="${y + 22}" rx="11" ry="13" fill="#3a3a32" data-unless="strom"/><ellipse cx="${x}" cy="${y + 22}" rx="11" ry="13" fill="#f3d79a" data-if="strom" class="flicker"/>
    <g stroke="#4a4c46" stroke-width="2"><line x1="${x - 12}" y1="${y + 10}" x2="${x - 8}" y2="${y + 40}"/><line x1="${x + 12}" y1="${y + 10}" x2="${x + 8}" y2="${y + 40}"/></g></g>`;

  /* ---------- NORD: Treppe und Wasser ---------- */
  const steps = Array.from({ length: 9 }, (_, i) => `<rect x="${236 + i * 40}" y="${712 - i * 44}" width="64" height="9" fill="#4a4c46" stroke="#2a2b28"/>`).join("");
  const nord = cellar("kn", `
  ${cage(600, 50)}
  <rect x="560" y="330" width="300" height="14" fill="#3a3c37" stroke="#2a2b28"/>
  <rect x="612" y="150" width="150" height="180" fill="#0d0e0d"/><rect x="620" y="158" width="134" height="172" fill="#3d3f3a" stroke="#2a2a26" stroke-width="3"/>
  <rect x="640" y="176" width="94" height="26" fill="#e6c48a"/><text x="687" y="194" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="9" letter-spacing="1">SICHERHEITSBEREICH</text>
  <rect x="736" y="244" width="10" height="34" rx="3" fill="#6a6c64"/>
  ${steps}
  <line x1="230" y1="724" x2="570" y2="338" stroke="#2a2b28" stroke-width="10"/><line x1="300" y1="724" x2="630" y2="338" stroke="#2a2b28" stroke-width="6"/>
  <g stroke="#5a5c55" stroke-width="5" fill="none"><path d="M250 640 L580 270 L860 270"/></g><g stroke="#5a5c55" stroke-width="4">${[0, 1, 2, 3].map((i) => `<line x1="${280 + i * 90}" y1="${606 - i * 101}" x2="${280 + i * 90}" y2="${680 - i * 101}"/>`).join("")}<line x1="860" y1="270" x2="860" y2="330"/></g>
  <g><rect x="62" y="420" width="96" height="300" fill="#22231f"/><g stroke="#8a8a80" stroke-width="2">${Array.from({ length: 13 }, (_, i) => `<line x1="62" y1="${420 + i * 23}" x2="${i % 2 ? 82 : 96}" y2="${420 + i * 23}"/>`).join("")}</g>
    <line x1="62" y1="690" x2="158" y2="690" stroke="#b6c8d0" stroke-width="2"/><text x="100" y="684" fill="#9aa8ac" font-family="DM Mono, monospace" font-size="12">1987</text>
    <line x1="62" y1="650" x2="158" y2="650" stroke="#b6c8d0" stroke-width="2"/><text x="100" y="644" fill="#9aa8ac" font-family="DM Mono, monospace" font-size="12">2002</text>
    <line x1="58" y1="540" x2="164" y2="540" stroke="#c0574a" stroke-width="3"/><text x="96" y="532" fill="#c0574a" font-family="Georgia, serif" font-style="italic" font-size="15">14.10.09</text></g>
  <g><rect x="840" y="272" width="360" height="26" fill="#3b3a33"/><rect x="840" y="326" width="360" height="20" fill="#34332d"/>
    <g fill="#4a483f">${[880, 1010, 1140].map((x) => `<rect x="${x}" y="266" width="14" height="38"/><rect x="${x + 20}" y="320" width="12" height="32"/>`).join("")}</g>
    <text x="930" y="290" fill="#5a5a50" font-family="Georgia, serif" font-style="italic" font-size="12" opacity=".7">T.+E. – 1999</text>
    <path d="M980 298 q4 10 0 22 q-4 12 2 24" stroke="#8aa0b8" stroke-opacity=".35" stroke-width="3" fill="none"/></g>`);

  /* ---------- OST: Generator ---------- */
  const control = (x, art, label) => `<g transform="translate(${x},520)">${art}<text y="58" text-anchor="middle" fill="#9aa39a" font-family="DM Mono, monospace" font-size="10">${label}</text></g>`;
  const ost = cellar("ko", `
  ${cage(560, 50)}
  <g stroke="#3a3c37" stroke-width="12" fill="none"><path d="M380 380 V60"/><path d="M780 420 q0 -60 80 -60 H1200"/></g>
  <rect x="250" y="680" width="620" height="60" fill="#2a2b28" stroke="#3a3b37"/>
  <rect x="300" y="380" width="520" height="300" rx="14" fill="#2f3a33" stroke="#1d241f" stroke-width="4"/>
  <rect x="300" y="380" width="520" height="40" rx="14" fill="#38463d"/><text x="560" y="406" text-anchor="middle" fill="#9fb3a2" font-family="DM Mono, monospace" font-size="13" letter-spacing="4">AGGREGAT WEST</text>
  <g fill="#1d241f">${Array.from({ length: 9 }, (_, i) => `<rect x="${700 + (i % 3) * 34}" y="${560 + Math.floor(i / 3) * 34}" width="26" height="26" rx="3"/>`).join("")}</g>
  <rect x="380" y="450" width="250" height="150" rx="6" fill="#1a1f1b" stroke="#465247" stroke-width="2"/>
  ${control(420, `<rect x="-12" y="-20" width="24" height="40" rx="6" fill="#7a2620"/><circle r="9" fill="#c0392b"/>`, "STARTER")}
  ${control(480, `<circle r="16" fill="#2a2e2a" stroke="#6a706a" stroke-width="3"/><rect x="-3" y="-12" width="6" height="18" fill="#c9a466"/>`, "ZÜNDUNG")}
  ${control(540, `<circle r="18" fill="none" stroke="#b03a2e" stroke-width="5"/><line x1="-18" y1="0" x2="18" y2="0" stroke="#b03a2e" stroke-width="4" data-unless="gen_laeuft"/><line x1="0" y1="-18" x2="0" y2="18" stroke="#b03a2e" stroke-width="4" data-if="gen_laeuft"/>`, "HAHN")}
  ${control(600, `<rect x="-4" y="-6" width="8" height="26" fill="#6a706a"/><circle cy="-10" r="10" fill="#d8d0b8"/>`, "CHOKE")}
  <g transform="translate(680,480)"><circle r="40" fill="#e8e0c8" stroke="#465247" stroke-width="5"/><path d="M-30 12 A32 32 0 0 1 30 12" fill="none" stroke="#2a2e2a" stroke-width="2"/><text y="26" text-anchor="middle" fill="#2a2e2a" font-family="DM Mono, monospace" font-size="9">V</text>
    <line y2="-30" stroke="#a3302a" stroke-width="3" transform="rotate(-62)" data-unless="gen_laeuft"/><line y2="-30" stroke="#a3302a" stroke-width="3" transform="rotate(18)" data-if="gen_laeuft"/><circle r="4" fill="#2a2e2a"/></g>
  <circle cx="680" cy="560" r="9" fill="#3a2a24" data-unless="gen_laeuft"/><circle cx="680" cy="560" r="9" fill="#9fe0b0" data-if="gen_laeuft" class="flicker"/>
  <g><rect x="862" y="430" width="76" height="110" rx="4" fill="#3a3c37" stroke="#2a2b28" stroke-width="3"/><rect x="872" y="440" width="56" height="16" fill="#e6c48a"/><text x="900" y="452" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="10">F3 · 30 A</text>
    <rect x="884" y="470" width="32" height="56" rx="3" fill="#0a0b0a"/><g data-if="f3_drin"><rect x="888" y="474" width="24" height="48" rx="8" fill="#c9a466"/><rect x="888" y="490" width="24" height="16" fill="#e6dcc3"/></g></g>
  <g transform="rotate(-1.5 1030 290)"><rect x="950" y="160" width="160" height="250" fill="#d8ccb0"/><rect x="950" y="160" width="160" height="30" fill="#2a2119"/><text x="1030" y="180" text-anchor="middle" fill="#d8ccb0" font-family="DM Mono, monospace" font-size="10">INBETRIEBNAHME</text>
    <g stroke="#6c5a44" stroke-width="1.5">${Array.from({ length: 8 }, (_, i) => `<line x1="964" y1="${214 + i * 22}" x2="${1096 - (i % 3) * 18}" y2="${214 + i * 22}"/>`).join("")}</g>
    <ellipse cx="1000" cy="260" rx="44" ry="30" fill="#8a7a58" opacity=".35"/><ellipse cx="1070" cy="360" rx="30" ry="40" fill="#8a7a58" opacity=".3"/></g>`);

  /* ---------- SÜD: Schalttafel ---------- */
  const lever = (x, l) => `<g><rect x="${x - 30}" y="250" width="60" height="44" fill="#e6dcc3"/><text x="${x}" y="283" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="28">${l}</text>
    <circle cx="${x}" cy="226" r="9" fill="#3a2a24" data-unless="strom"/><circle cx="${x}" cy="226" r="9" fill="#9fe0b0" data-if="strom"/>
    <rect x="${x - 10}" y="320" width="20" height="200" rx="8" fill="#0d0e0d"/>
    <g data-unless="strom"><rect x="${x - 6}" y="330" width="12" height="70" fill="#8a8f88"/><rect x="${x - 26}" y="316" width="52" height="24" rx="10" fill="#b03a2e"/></g>
    <g data-if="strom"><rect x="${x - 6}" y="440" width="12" height="70" fill="#8a8f88"/><rect x="${x - 26}" y="500" width="52" height="24" rx="10" fill="#b03a2e"/></g></g>`;
  const sued = cellar("ks", `
  ${cage(600, 50)}
  <g stroke="#2e2f2b" stroke-width="10" fill="none"><path d="M300 170 V60 H0"/><path d="M820 170 V80 H1200"/></g>
  <rect x="260" y="170" width="600" height="480" fill="#3a3f3a" stroke="#2a2d29" stroke-width="5"/>
  <rect x="280" y="186" width="560" height="22" fill="#2a2d29"/><text x="560" y="202" text-anchor="middle" fill="#b6c0b2" font-family="DM Mono, monospace" font-size="12" letter-spacing="4">HAUPTVERTEILUNG UG</text>
  ${lever(340, "A")}${lever(460, "B")}${lever(580, "C")}${lever(700, "D")}
  <g transform="translate(560,590)"><rect x="-120" y="-24" width="240" height="40" fill="#1a1d1a"/><text y="2" text-anchor="middle" fill="#5f6a5f" font-family="DM Mono, monospace" font-size="13" data-unless="strom">AUSGANG W2 · 0 V</text><text y="2" text-anchor="middle" fill="#9fe0b0" font-family="DM Mono, monospace" font-size="13" data-if="strom">AUSGANG W2 · 230 V</text></g>
  <rect x="300" y="650" width="20" height="66" fill="#2a2d29"/><rect x="800" y="650" width="20" height="66" fill="#2a2d29"/>
  <g transform="rotate(1.2 1010 285)"><rect x="910" y="150" width="200" height="270" fill="#ede5d2"/><rect x="910" y="150" width="200" height="28" fill="#5d2f2a"/><text x="1010" y="169" text-anchor="middle" fill="#ede5d2" font-family="DM Mono, monospace" font-size="10">NOTSTROMVERTEILUNG</text>
    <g font-family="DM Mono, monospace" font-size="15" fill="#2a2119">${["A", "B", "C", "D"].map((l, i) => `<rect x="${928 + i * 44}" y="216" width="32" height="32" fill="none" stroke="#2a2119"/><text x="${944 + i * 44}" y="238" text-anchor="middle">${l}</text>`).join("")}
      <text x="1010" y="276" text-anchor="middle" font-size="12">A → B → C → D</text></g>
    <text x="1010" y="330" text-anchor="middle" fill="#6b2420" font-family="Georgia, serif" font-style="italic" font-size="16">Tor W2: stillgelegt.</text>
    <text x="1080" y="398" text-anchor="end" fill="#2c2a5a" font-family="Georgia, serif" font-style="italic" font-size="15">V. Lehn</text></g>`);

  /* ---------- WEST: alte Wäscherei, Wäscheschrank ---------- */
  const cabinet = (x) => `<rect x="${x}" y="170" width="300" height="550" fill="#3b2b1e" stroke="#1a130d" stroke-width="5"/><rect x="${x + 14}" y="186" width="130" height="520" fill="#33251a" stroke="#1a130d" stroke-width="3"/><rect x="${x + 156}" y="186" width="130" height="520" fill="#33251a" stroke="#1a130d" stroke-width="3"/>
    <rect x="${x + 134}" y="420" width="8" height="46" fill="#806040"/><rect x="${x + 158}" y="420" width="8" height="46" fill="#806040"/><rect x="${x - 6}" y="160" width="312" height="14" fill="#2a1f16"/>`;
  const west = cellar("kw", `
  ${cage(420, 50)}
  <text x="340" y="150" text-anchor="middle" fill="#5a5850" font-family="DM Mono, monospace" font-size="14" letter-spacing="6" opacity=".7">WÄSCHEREI</text>
  <g><rect x="170" y="560" width="290" height="20" fill="#3a3c37"/><rect x="190" y="490" width="250" height="70" rx="34" fill="#55574f" stroke="#2a2b28" stroke-width="3"/><rect x="200" y="470" width="230" height="16" fill="#3a3c37"/>
    <rect x="186" y="580" width="16" height="140" fill="#2a2b28"/><rect x="428" y="580" width="16" height="140" fill="#2a2b28"/><circle cx="460" cy="520" r="26" fill="none" stroke="#6a6c64" stroke-width="6"/></g>
  <g fill="#cfc6b0" opacity=".55"><ellipse cx="90" cy="700" rx="60" ry="40"/><ellipse cx="140" cy="680" rx="44" ry="32"/><ellipse cx="60" cy="660" rx="36" ry="26"/></g>
  <g data-unless="schrank_weg">${cabinet(700)}
    <g fill="#c9a466">${[[704, 200], [996, 200], [704, 690], [996, 690]].map(([x, y]) => `<rect x="${x - 10}" y="${y - 6}" width="20" height="12" fill="#5a5c55"/><circle cx="${x}" cy="${y}" r="5"/>`).join("")}</g>
    <rect x="1000" y="180" width="8" height="540" fill="#3a4040" opacity=".6"/></g>
  <g data-if="schrank_weg">${cabinet(470)}
    <rect x="790" y="210" width="200" height="510" fill="#101211"/>
    <g data-unless="tuer_offen"><rect x="800" y="220" width="180" height="500" fill="#4a4c46" stroke="#2a2b28" stroke-width="3"/><rect x="826" y="300" width="128" height="22" fill="#2a2b28"/><text x="890" y="316" text-anchor="middle" fill="#9aa39a" font-family="DM Mono, monospace" font-size="11">W-GANG · NUR NOTFALL</text>
      <rect x="956" y="420" width="18" height="60" rx="3" fill="#2a2b28"/><circle cx="965" cy="436" r="5" fill="#5a2a24" data-unless="strom"/><circle cx="965" cy="436" r="5" fill="#9fe0b0" data-if="strom"/></g>
    <g data-if="tuer_offen"><polygon points="800,220 760,240 760,700 800,720" fill="#4a4c46" stroke="#2a2b28" stroke-width="3"/><path d="M820 700 L860 520 L940 520 L960 700 Z" fill="#1a1d1a"/><rect x="866" y="300" width="68" height="220" fill="#0a0b0a"/><ellipse cx="900" cy="330" rx="50" ry="40" fill="url(#kw-glow)" opacity=".5"/></g></g>`);

  /* ---------- Raum ---------- */
  const DARK = { x: 0, y: 0, w: 100, h: 100, until: "strom" };
  N.rooms.push({
    id: "keller",
    name: "Keller",
    title: "Der Keller",
    kicker: "UNTERGESCHOSS / TECHNIK",
    story: "Feuchter Beton, kaltes Wasser bis über die Knöchel. Hier unten ist es vollkommen dunkel.",
    ambient: "drip",
    ambientAfter: { flag: "gen_laeuft", name: "generator" },
    darkUntil: "strom",
    exitLabel: "Durch den Gang nach Westen",
    exitVia: "door",
    views: [
      {
        id: "nord", dir: "NORD", name: "Treppe", scene: nord, dark: DARK,
        desc: "Stockdunkel. Wasser schwappt um deine Knöchel, irgendwo tropft es. Hinter dir führt die Metalltreppe zurück nach oben – ohne Licht siehst du sonst nichts.",
        descLit: "Die Metalltreppe hinauf zum Sicherheitsbereich, Wasserstandsmarken an der Wand und dicke Rohre unter der Decke.",
        hotspots: [
          { id: "k_treppe", label: "Treppe nach oben", x: 18.3, y: 15, w: 52, h: 66, always: true, go: "ueberwachung", via: "door" },
          { id: "wassermarken", label: "Wasserstandsmarken", x: 4.5, y: 55, w: 10, h: 26, title: "Wasserstandsmarken", text: "Mit Farbe gezogene Striche, daneben Jahreszahlen: 1987, 2002 – beide nur knapp über dem Boden. Weit darüber ein roter Strich, mit der Hand geschrieben: <b>14.10.09</b>. In jener Nacht stand das Wasser hier fast hüfthoch." },
          { id: "rohr", label: "Rohrleitung", x: 70, y: 29, w: 30, h: 10, secret: true, title: "Ein altes Rohr", text: "Unter Rost und Kalk sind Buchstaben ins Metall geritzt.", doc: "alte_verbindung" },
          { id: "k_wasser", label: "Wasser", x: 72, y: 82, w: 26, h: 14, title: "Das Wasser", text: "Kalt und trüb. Generator und Schalttafel stehen auf Betonsockeln – jemand hat damit gerechnet, dass es hier unten nass wird." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Generator", scene: ost, dark: DARK,
        desc: "Völlige Dunkelheit. Im Osten ahnst du die Umrisse einer großen Maschine.",
        descLit: "Das Notstromaggregat West brummt gleichmäßig auf seinem Sockel. Daneben das Sicherungsfach und die Startanleitung.",
        hotspots: [
          { id: "generator", label: "Generator", x: 25, y: 42, w: 43, h: 34, title: "Das Notstromaggregat", text: "„AGGREGAT WEST“. Ein schwerer Dieselmotor, Baujahr 1974. Die Lackschicht ist frischer als der Rest – jemand hat ihn gepflegt." },
          { id: "messgeraet", label: "Messgerät", x: 53, y: 48, w: 7.5, h: 10, unless: "gen_laeuft", title: "Das Messgerät", text: "Der Zeiger steht auf null. Darunter eine erloschene Kontrollleuchte." },
          { id: "messgeraet2", label: "Messgerät", x: 53, y: 48, w: 7.5, h: 10, if: "gen_laeuft", title: "Das Messgerät", text: "Der Zeiger zittert knapp über der Mitte. Die Kontrollleuchte ist grün. Strom ist da – er kommt nur noch nirgendwo an." },
          { id: "bedienfeld_tot", label: "Bedienfeld", x: 31.7, y: 50, w: 20.8, h: 16.7, unless: "f3_drin", title: "Das Bedienfeld", text: "Starter, Zündung, Kraftstoffhahn, Choke. Du drückst auf den Starter – nichts. Kein Klicken, kein Licht. Dem Aggregat fehlt etwas." },
          { id: "bedienfeld", label: "Bedienfeld", x: 31.7, y: 50, w: 20.8, h: 16.7, if: "f3_drin", unless: "gen_laeuft", title: "Das Bedienfeld", lock: "generator" },
          { id: "bedienfeld_an", label: "Bedienfeld", x: 31.7, y: 50, w: 20.8, h: 16.7, if: "gen_laeuft", title: "Das Bedienfeld", text: "Der Motor läuft. Lieber nichts mehr anfassen." },
          { id: "sicherungsfach", label: "Sicherungsfach F3", x: 71.7, y: 47.8, w: 6.7, h: 12.2, unless: "f3_drin", title: "Das Sicherungsfach", text: "„GENERATOR WEST – SICHERUNG F3 – 30 A“. Das Fach ist leer.", use: "f3" },
          { id: "sicherungsfach2", label: "Sicherungsfach F3", x: 71.7, y: 47.8, w: 6.7, h: 12.2, if: "f3_drin", title: "Das Sicherungsfach", text: "Die Ersatzsicherung sitzt fest im Fach. Tomasz’ Etikett zeigt nach vorn." },
          { id: "anleitung", label: "Startanleitung", x: 79, y: 17.8, w: 13.5, h: 28, title: "Die Startanleitung", text: "Ein laminiertes Blatt, an den Rändern aufgequollen.", doc: "startanleitung" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Schalttafel", scene: sued, dark: DARK,
        desc: "Dunkelheit. Irgendwo vor dir glänzt Metall.",
        descLit: "Die Hauptverteilung mit den vier Hebeln A bis D, daneben Lehns Wandplan. Über Ausgang W2 liegt jetzt Spannung.",
        hotspots: [
          { id: "schalttafel_tot", label: "Schalttafel", x: 21.7, y: 19, w: 50, h: 53, unless: "gen_laeuft", title: "Die Schalttafel", text: "Vier schwere Hebel: A, B, C, D. Sie lassen sich bewegen, aber nichts geschieht – auf der Schiene liegt keine Spannung. Erst muss der Generator laufen." },
          { id: "schalttafel", label: "Schalttafel", x: 21.7, y: 19, w: 50, h: 53, if: "gen_laeuft", unless: "strom", title: "Die Schalttafel", lock: "hebel" },
          { id: "schalttafel_an", label: "Schalttafel", x: 21.7, y: 19, w: 50, h: 53, if: "strom", title: "Die Schalttafel", text: "Alle vier Lampen grün. Ausgang W2: 230 Volt. Der Strom fließt dorthin, wo er laut Plan gar nicht hinsollte." },
          { id: "wandplan", label: "Wandplan", x: 75.5, y: 16.7, w: 17.5, h: 30, title: "Der Wandplan", text: "Ein Plan hinter Folie, deutlich neuer als alles andere hier.", doc: "wandplan" },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Wäscheschrank", scene: west, dark: DARK,
        desc: "Schwarz. Ein kühler Luftzug streift dein Gesicht – er kommt von links, wo eigentlich nur Wand sein dürfte.",
        descLit: "Die alte Hotelwäscherei: eine Mangel, Wäschesäcke und der schwere Schrank. Von hier kommt der Luftzug.",
        hotspots: [
          { id: "mangel", label: "Wäschemangel", x: 14, y: 52, w: 25, h: 27, title: "Die Wäschemangel", text: "Bevor die Wäsche außer Haus ging, war hier unten die Hotelwäscherei. Die Mangel ist festgerostet, daneben liegen vergessene Säcke mit Bettwäsche." },
          { id: "waescheschrank", label: "Wäscheschrank", x: 58.3, y: 18.5, w: 25, h: 61.5, unless: "schrank_weg", title: "Der Wäscheschrank", text: "Ein schwerer Schrank voller vergilbter Tischdecken. Seltsam: Er ist mit vier Winkeln und Schrauben <b>an der Wand</b> befestigt. Am rechten Rand spürst du einen kalten Luftzug.", use: "waescheschrank" },
          { id: "schrank_weg", label: "Wäscheschrank", x: 39.2, y: 18.5, w: 25, h: 61.5, if: "schrank_weg", title: "Der Wäscheschrank", text: "Zur Seite geschoben. Auf dem Boden dahinter: Schleifspuren, älter als deine." },
          { id: "stahltuer", label: "Stahltür", x: 66.2, y: 24, w: 16, h: 56, if: "schrank_weg", unless: "strom", title: "Eine Stahltür", text: "Keine Klinke, kein Schloss – nur ein Magnetschloss am Rahmen. Die Kontrollleuchte ist dunkel. Eingeprägt: <b>W-GANG · NUR NOTFALL</b>. Ohne Strom bewegt sich diese Tür keinen Millimeter." },
          { id: "stahltuer_auf", label: "Stahltür", title: "Die Stahltür", x: 66.2, y: 24, w: 16, h: 56, if: ["schrank_weg", "strom"], unless: "tuer_offen", solves: "tuer" },
          { id: "durchgang", label: "Durch die Stahltür", x: 66.2, y: 24, w: 16, h: 56, if: "tuer_offen", go: "buero", via: "door" },
        ],
      },
    ],
    puzzles: {
      f3: {
        type: "use", item: "sicherung", title: "Sicherungsfach F3",
        wrongItem: "In das Fach gehört eine Sicherung: F3, 30 A.",
        noItems: "Das Fach ist leer. Ohne Sicherung F3 startet hier nichts.",
        objective: "Bring den Generator in Gang – ihm fehlt die Sicherung F3.",
        hints: [
          "Ohne Licht findest du hier nichts. Schalte die Taschenlampe deines Telefons ein und sieh dir den Generator im Osten an.",
          "Rechts neben dem Generator ist ein leeres Sicherungsfach: F3, 30 A. Die passende Sicherung liegt im Überwachungsraum – unter dem Schaltpult, falls du sie noch nicht hast.",
          "Benutze die Ersatzsicherung F3 am Sicherungsfach rechts neben dem Generator.",
        ],
        success: "Die Sicherung rastet mit einem satten Klacken ein. Am Bedienfeld glimmt ein winziges rotes Lämpchen auf.",
        quiet: true,
        onSolve: [{ remove: "sicherung" }, { flag: "f3_drin" }, { sound: "lever" }],
      },
      generator: {
        type: "sequence", title: "Generator starten", checkEach: true,
        prompt: "Vier Bedienelemente, schwarz vor Öl. Die Reihenfolge auf dem Bedienfeld ist nicht die Reihenfolge, in der man sie benutzt.",
        help: "Betätige die Bedienelemente nacheinander.",
        items: [
          { id: "starter", label: "Starter", short: "Starter", html: `<svg viewBox="0 0 64 96"><rect x="12" y="20" width="40" height="56" rx="8" fill="#3a2a24"/><g class="seq-handle"><circle cx="32" cy="48" r="14" fill="#c0392b" stroke="#7a2620" stroke-width="3"/></g><circle class="seq-lamp" cx="32" cy="10" r="5"/></svg>`, vars: "--ty:3px" },
          { id: "zuendung", label: "Zündung", short: "Zündung", html: `<svg viewBox="0 0 64 96"><circle cx="32" cy="48" r="22" fill="#2a2e2a" stroke="#6a706a" stroke-width="3"/><g class="seq-handle"><rect x="28" y="30" width="8" height="24" rx="2" fill="#c9a466"/></g><text x="10" y="84" fill="#8a8f88" font-size="9" font-family="monospace">AUS</text><text x="40" y="84" fill="#8a8f88" font-size="9" font-family="monospace">EIN</text><circle class="seq-lamp" cx="32" cy="10" r="5"/></svg>`, vars: "--rot:70deg;--origin:50% 75%" },
          { id: "hahn", label: "Kraftstoffhahn", short: "Hahn", html: `<svg viewBox="0 0 64 96"><circle cx="32" cy="48" r="10" fill="#6a706a"/><g class="seq-handle"><rect x="10" y="44" width="44" height="8" rx="4" fill="#b03a2e"/></g><circle class="seq-lamp" cx="32" cy="10" r="5"/></svg>`, vars: "--rot:90deg" },
          { id: "choke", label: "Choke", short: "Choke", html: `<svg viewBox="0 0 64 96"><rect x="26" y="40" width="12" height="40" fill="#1a1d1a"/><g class="seq-handle"><rect x="29" y="44" width="6" height="22" fill="#8a8f88"/><circle cx="32" cy="44" r="11" fill="#d8d0b8"/></g><circle class="seq-lamp" cx="32" cy="10" r="5"/></svg>`, vars: "--ty:-16px" },
        ],
        answer: ["hahn", "choke", "zuendung", "starter"],
        pressSound: "valve", failSound: "cough",
        release: ["choke"], // Motor läuft → Choke zurück, wie in der Anleitung
        wrongStep: {
          starter: "Der Anlasser jault, der Motor hustet einmal – und erstirbt. Alles springt zurück.",
          zuendung: "Die Kontrollleuchte zuckt kurz und erlischt. Etwas fehlt noch vor der Zündung. Alles zurück auf Anfang.",
          choke: "Du ziehst den Choke – aber die Leitung ist noch trocken. Der Motor bekommt so keinen Tropfen. Zurück auf Anfang.",
        },
        wrongDefault: "Der Motor hustet und geht aus.",
        objective: "Starte den Generator.",
        hints: [
          "Neben dem Generator hängt eine Startanleitung.",
          "Die Anleitung nennt vier Schritte. Auf dem Bedienfeld sind die Elemente in einer anderen Reihenfolge angeordnet.",
          "Kraftstoffhahn → Choke → Zündung → Starter.",
        ],
        success: "Der Anlasser jault, der Motor hustet – und fängt sich. Ein tiefes, unregelmäßiges Brummen füllt den Keller, dann wird es gleichmäßig. Du schiebst den Choke zurück, wie es auf der Anleitung steht. Die Kontrollleuchte springt auf Grün. <b>Das Licht bleibt trotzdem aus.</b>",
        onSolve: [{ flag: "gen_laeuft" }, { sound: "engine" }],
      },
      hebel: {
        type: "sequence", title: "Schalttafel", panel: "levers",
        parallel: "zugang", parallelObjective: "Stelle die Stromversorgung wieder her und finde den verborgenen Zugang.",
        prompt: "Vier schwere Hebel. Laut Wandplan läuft der Strom A → B → C → D. Lege sie in der Reihenfolge um, in der der Strom sie durchlaufen soll.",
        help: "Lege die Hebel nacheinander um. Geprüft wird, wenn alle vier unten sind.",
        items: ["A", "B", "C", "D"].map((l) => ({
          id: l, label: l, short: l,
          html: `<svg viewBox="0 0 64 96"><circle class="seq-lamp" cx="32" cy="8" r="5"/><rect x="26" y="18" width="12" height="74" rx="5" fill="#0d0e0d"/><g class="seq-handle"><rect x="29" y="22" width="6" height="30" fill="#8a8f88"/><rect x="14" y="16" width="36" height="14" rx="6" fill="#b03a2e"/></g></svg>`,
          vars: "--ty:52px",
        })),
        answer: ["C", "A", "D", "B"],
        pressSound: "lever",
        wrongOrders: {
          "A,B,C,D": "Ein Relais klackt, dann nichts. Alle Hebel schnappen zurück. Der Wandplan beschreibt nicht den tatsächlichen Stromweg.",
          "D,C,B,A": "Funken an der Schiene, die Hebel schnappen zurück. Den Plan einfach umzudrehen, führt auch nicht ans Ziel.",
        },
        wrongDefault: "Funken an der Schiene, dann schnappen alle Hebel zurück. Der Strom läuft so ins Leere.",
        objective: "Verteile den Strom an der Schalttafel richtig.",
        hints: [
          "Elias hat dich gleich am Anfang gewarnt: „Vertrauen Sie nicht den offiziellen Aufzeichnungen.“ Der Wandplan ist so eine.",
          "Im Archiv hast du zwei Prüfprotokolle gefunden. Das echte – PR-09/118, von Tomasz – nennt eine Schaltfolge für Tor W2.",
          "C → A → D → B.",
        ],
        success: "Ein Relais schlägt hörbar an. Die Lampen über den Hebeln springen nacheinander auf Grün, unter der Decke flackern die Käfigleuchten – und bleiben an. <b>Zum ersten Mal siehst du den ganzen Keller.</b>",
        onSolve: [
          { flag: "strom" }, { sound: "power" }, { evidence: "wandplan" }, { message: "m_strom" },
          // Unerklärtes Ereignis: Licht weg, Schritte auf der Metalltreppe, oben fällt eine Tür zu.
          { later: { here: true, ms: 3800, actions: [{ flag: "flackern" }, { sound: "light" }], narrate: "Das Licht erlischt. Völlige Dunkelheit." } },
          { later: { here: true, ms: 4700, actions: [{ sound: "step" }] } },
          { later: { here: true, ms: 5300, actions: [{ sound: "step" }] } },
          { later: { here: true, ms: 6200, actions: [{ sound: "door" }] } },
          { later: { here: true, ms: 7400, actions: [{ unflag: "flackern" }, { sound: "power" }], narrate: "Für einen Augenblick war alles still. Dann Schritte auf der Metalltreppe – und oben fiel die Tür zum Sicherheitsbereich ins Schloss. Das Licht ist zurück. Jetzt hörst du nur noch den Generator." } },
        ],
      },
      waescheschrank: {
        type: "use", item: "schraubendreher", title: "Wäscheschrank",
        parallel: "zugang", parallelObjective: "Stelle die Stromversorgung wieder her und finde den verborgenen Zugang.",
        wrongItem: "Damit bekommst du die Schrauben nicht los.",
        noItems: "Mit bloßen Fingern lassen sich die Schrauben nicht lösen.",
        objective: "Finde die Tür, die niemand sehen sollte.",
        hints: [
          "Elias schrieb: „Nicht die Tür, die Sie sehen. Die Tür, die Sie niemals sehen sollten.“ Was steht hier unten, das nicht hierher gehört?",
          "Der Wäscheschrank im Westen ist an die Wand geschraubt – und an seinem Rand zieht es.",
          "Benutze den Schraubendreher aus der Rezeption am Wäscheschrank.",
        ],
        success: "Vier Schrauben, eine nach der anderen. Dann stemmst du dich gegen den Schrank – er rutscht knirschend zur Seite. Dahinter: <b>eine Stahltür ohne Klinke</b>, eingeprägt „W-GANG · NUR NOTFALL“.",
        onSolve: [{ flag: "schrank_weg" }, { sound: "screws" }, { later: { here: true, ms: 1900, actions: [{ sound: "slide" }] } }],
      },
      tuer: {
        type: "event", title: "Die Tür, die niemand sehen sollte",
        objective: "Öffne die Stahltür hinter dem Wäscheschrank.",
        hints: [
          "Die Stahltür hat kein Schloss, nur ein Magnetschloss. Es braucht Strom.",
          "Tomasz’ Protokoll: „Tor W2 öffnet nur mit Notstrom.“ Das gilt auch für diese Tür.",
          "Starte den Generator, schalte die Hebel C – A – D – B und tippe dann die Stahltür an.",
        ],
        success: "Das Magnetschloss gibt mit einem dumpfen Schlag nach. Die Stahltür schwingt auf. Dahinter führt ein schmaler Gang bergauf – nach Westen, dorthin, wo das Hotel nie einen Flur hatte.",
        onSolve: [{ flag: "tuer_offen" }, { sound: "door" }],
      },
    },
    completeWhen: ["f3", "generator", "hebel", "waescheschrank", "tuer"],
  });
})();
