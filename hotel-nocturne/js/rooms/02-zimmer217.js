/*
 * STATION 2 – ZIMMER 217 (2. Etage)
 * Rätsel 5–7 aus RAETSELDESIGN.md plus Übergang über die Tür „Personal“ in der Rezeption.
 * Aufbau wie 01-rezeption.js.
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    personalschluessel: { name: "Personalschlüssel", icon: "⚷", text: "Ein schwerer Bartschlüssel an Elias’ Schlüsselbund. Auf dem Anhänger: „P – Personal / Treppe UG“." },
    gepaeckschein: { name: "Gepäckschein Nr. 6", icon: "№", text: "Ein vergilbter Gepäckschein des Hotel Nocturne: „Wertgepäck · Nr. 6 · 14.10.2009“. Auf der Rückseite mit Bleistift: „UG“." },
  });

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_papa: { from: "Unbekannte Nummer", text: "Vor Gästen durfte ich ihn nie „Papa“ nennen. Er meinte, das gehöre sich nicht für einen Nachtmanager." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    brief_bett: {
      title: "Brief auf dem Bett", kind: "letter",
      html: `<p class="handwriting">Ich habe alles zurückgelassen.<br>Doch nichts davon war zufällig platziert.</p>
        <p class="handwriting">Zuerst das, was die Zeit festhält.<br>Danach das, was Licht spendet.<br>Anschließend das, was Türen öffnet.<br>Zuletzt das, was Erinnerungen bewahrt.</p>`,
    },
    brief_mara: {
      title: "Brief an Mara", kind: "letter",
      html: `<p class="handwriting">Mara,<br><br>falls du jemals zurückkehrst, erinnere dich daran: Dein Name stand niemals in den offiziellen Aufzeichnungen. Das war meine Entscheidung.<br><br>Ihr wart sechs – und keiner von euch war allein.</p><p class="handwriting sign">E.</p>`,
    },
    foto_mara: {
      title: "Foto von Mara", kind: "photo",
      pages: [
        `<svg viewBox="0 0 400 260" class="photo-svg" role="img" aria-label="Foto einer jungen Frau mit Schirm vor dem Hoteleingang">
          <rect width="400" height="260" fill="#7d6a52"/><rect width="400" height="170" fill="#9a8466"/><rect y="170" width="400" height="90" fill="#5f4e3b"/>
          <rect x="120" y="30" width="160" height="150" fill="#6b5944"/><path d="M120 30 Q200 -10 280 30" fill="#6b5944"/>
          <text x="200" y="60" text-anchor="middle" fill="#3b2f22" font-family="Playfair Display,serif" font-size="16" letter-spacing="5">NOCTURNE</text>
          <g fill="#2f261c"><circle cx="200" cy="120" r="15"/><path d="M180 136 h40 l10 90 h-60 z"/></g>
          <path d="M150 120 a42 30 0 0 1 84 0 z" fill="#1f1914"/><line x1="192" y1="120" x2="192" y2="170" stroke="#1f1914" stroke-width="3"/>
          <rect x="300" y="110" width="40" height="120" fill="#2f261c" opacity=".55"/>
          <rect width="400" height="260" fill="#3a2a15" opacity=".16"/></svg>
          <p class="caption-line">Eine junge Frau unter einem schwarzen Schirm. Am rechten Bildrand, abgeschnitten, ein Mann in Uniform.</p>`,
        `<p class="handwriting big">Mara – 14.10.2009</p><p class="handwriting">Wer nachts wacht, passt auf dich auf.</p>`,
      ],
    },
    schrankbrief: { title: "Zettel im Kleiderschrank", kind: "note", html: `<p class="handwriting big">Wenn du das findest,<br>nimm die Treppe, nicht den Aufzug.</p><p class="handwriting sign">– Papa</p>` },
    blatt: { title: "Ein Blatt auf dem Schreibtisch", kind: "note", html: `<p class="handwriting other big">Unter dem Bett.</p><p class="handwriting other">Er hat immer gesagt, das Wichtigste liegt dort, wo keiner hinsieht.</p><p class="mono dim">Die Tinte ist noch nicht ganz trocken.</p>` },
    kinokarte: {
      title: "Kinokarte", kind: "news",
      html: `<p class="news-head">LICHTSPIELE AM MARKT</p><p class="mono">Mittwoch, 14.10.2009 · 19:30 Uhr<br>Reihe 7 · Platz 17 · 1 Person<br><b>– entwertet –</b></p><p class="handwriting">Papa hat wieder Nachtschicht. Dann eben allein.</p>`,
    },
  });

  /* ---------- NORD: Zimmertür ---------- */
  const nord = scene("zn", `
  <rect width="1200" height="612" fill="#3a1a1a" opacity=".32"/>
  <g>
    <rect x="460" y="160" width="280" height="620" fill="#0a0807"/>
    <rect x="474" y="172" width="252" height="608" fill="#33241a" stroke="#5a412b" stroke-width="2"/>
    <rect x="500" y="200" width="200" height="230" fill="none" stroke="#4d3826" stroke-width="2"/><rect x="500" y="460" width="200" height="290" fill="none" stroke="#4d3826" stroke-width="2"/>
    <rect x="566" y="232" width="68" height="30" rx="3" fill="url(#zn-brass)"/><text x="600" y="253" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="16" letter-spacing="3">217</text>
    <circle cx="600" cy="300" r="6" fill="#0a0807" stroke="url(#zn-brass)" stroke-width="2"/>
    <rect x="690" y="470" width="14" height="44" rx="5" fill="url(#zn-brass)"/>
    <path d="M700 420 q-30 30 -10 60" fill="none" stroke="#9a8a6a" stroke-width="2" stroke-dasharray="3 3"/>
  </g>
  <g>
    <line x1="245" y1="230" x2="245" y2="780" stroke="#2a1f16" stroke-width="10"/><ellipse cx="245" cy="782" rx="60" ry="10" fill="#1a130d"/>
    <path d="M245 240 l-40 10 M245 240 l40 10" stroke="#5a4630" stroke-width="5"/>
    <path d="M205 250 h80 l20 300 q-60 20 -120 0 z" fill="#1d2a26"/><path d="M245 250 v290" stroke="#121a17" stroke-width="3"/>
    <rect x="255" y="420" width="34" height="40" fill="#162220" stroke="#121a17"/>
  </g>
  <g>
    <rect x="850" y="220" width="160" height="300" rx="6" fill="url(#zn-brass)"/><rect x="862" y="232" width="136" height="276" rx="4" fill="#1a2221"/>
    <path d="M870 250 l40 -10 l-30 80 z" fill="#ffffff" opacity=".05"/>
    <line x1="930" y1="520" x2="930" y2="548" stroke="#9a8a6a" stroke-width="2"/>
    <circle cx="930" cy="556" r="9" fill="none" stroke="#a8875a" stroke-width="4"/><rect x="927" y="563" width="6" height="22" fill="#a8875a"/><rect x="933" y="576" width="8" height="5" fill="#a8875a"/>
  </g>
  <rect x="1080" y="400" width="26" height="40" rx="3" fill="#cdbd9b" opacity=".6"/>
  `);

  /* ---------- OST: Bett ---------- */
  const ost = scene("zo", `
  <rect width="1200" height="612" fill="#3a1a1a" opacity=".32"/>
  <g><rect x="480" y="170" width="240" height="130" fill="url(#zo-brass)"/><rect x="490" y="180" width="220" height="110" fill="#3a3a2c"/><path d="M490 260 q60 -40 110 -10 t110 -20 v60 h-220 z" fill="#2a2b20"/><circle cx="660" cy="210" r="12" fill="#cbb98f" opacity=".5"/></g>
  <g><rect x="90" y="560" width="120" height="200" fill="url(#zo-wood)"/><rect x="132" y="470" width="14" height="90" fill="url(#zo-brass)"/><polygon points="100,472 178,472 162,420 116,420" fill="#4f3824"/></g>
  <rect x="250" y="330" width="700" height="180" rx="10" fill="#2a1d14" stroke="#4d3826" stroke-width="3"/>
  <g fill="none" stroke="#4d3826" stroke-width="2"><rect x="290" y="360" width="190" height="120"/><rect x="505" y="360" width="190" height="120"/><rect x="720" y="360" width="190" height="120"/></g>
  <rect x="300" y="450" width="250" height="70" rx="22" fill="#d8cdb6"/><rect x="650" y="450" width="250" height="70" rx="22" fill="#d8cdb6"/>
  <path d="M230 500 h740 v200 q-370 30 -740 0 z" fill="#4a1f1c"/><path d="M230 520 h740" stroke="#5e2a25" stroke-width="6"/>
  <rect x="236" y="700" width="728" height="22" fill="#2a1d14"/>
  <rect x="250" y="722" width="14" height="70" fill="#1a120c"/><rect x="936" y="722" width="14" height="70" fill="#1a120c"/>
  <rect x="264" y="722" width="672" height="70" fill="#050404"/>
  <g data-unless="taken_gepaeckschein"><rect x="578" y="742" width="46" height="24" fill="#d8cdb6" transform="rotate(-4 600 754)"/><rect x="590" y="738" width="22" height="8" fill="#9a8a6a" opacity=".7"/><text x="600" y="760" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="10">6</text></g>
  <g><rect x="700" y="540" width="80" height="34" fill="#e8dcc0" transform="rotate(8 740 557)"/><path d="M702 542 l38 18 l38 -10" fill="none" stroke="#b8a780" transform="rotate(8 740 557)"/></g>
  <g><rect x="985" y="540" width="140" height="220" fill="url(#zo-wood)"/><rect x="995" y="580" width="120" height="60" fill="none" stroke="#4d3826"/><circle cx="1055" cy="610" r="5" fill="url(#zo-brass)"/>
    <rect x="1020" y="470" width="44" height="8" fill="url(#zo-brass)"/><rect x="1020" y="532" width="44" height="8" fill="url(#zo-brass)"/>
    <path d="M1026 478 h32 l-14 26 l14 28 h-32 l14 -28 z" fill="#cfe1e6" opacity=".35" stroke="#b69a6d"/><path d="M1032 520 h20 l-10 -10 z" fill="#d9b77a"/></g>
  `);

  /* ---------- SÜD: Fenster ---------- */
  const sued = scene("zs", `
  <defs><linearGradient id="zs-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070b"/><stop offset="1" stop-color="#0f161c"/></linearGradient>
    <clipPath id="zs-glass"><rect x="396" y="156" width="408" height="468"/></clipPath></defs>
  <rect width="1200" height="612" fill="#3a1a1a" opacity=".32"/>
  <rect x="380" y="140" width="440" height="500" fill="#1a130d"/>
  <rect x="396" y="156" width="408" height="468" fill="url(#zs-night)"/>
  <g clip-path="url(#zs-glass)">
    <polygon points="396,520 560,500 560,460 700,460 700,500 804,510 804,624 396,624" fill="#07090c"/>
    <g class="lightning-only"><rect x="430" y="470" width="70" height="90" fill="none" stroke="#a9bfd6" stroke-width="3"/><line x1="465" y1="470" x2="465" y2="560" stroke="#a9bfd6" stroke-width="2"/><text x="465" y="462" text-anchor="middle" fill="#a9bfd6" font-family="DM Mono, monospace" font-size="12">W2</text></g>
    <g class="rain-lines" stroke="#8aa0b8" stroke-opacity=".3" stroke-width="1.4"><line x1="420" y1="150" x2="410" y2="220"/><line x1="480" y1="300" x2="470" y2="370"/><line x1="540" y1="180" x2="530" y2="250"/><line x1="600" y1="380" x2="590" y2="450"/><line x1="660" y1="220" x2="650" y2="290"/><line x1="720" y1="140" x2="710" y2="210"/><line x1="780" y1="330" x2="770" y2="400"/><line x1="450" y1="480" x2="440" y2="550"/><line x1="700" y1="500" x2="690" y2="570"/></g>
    <rect class="lightning" x="396" y="156" width="408" height="468" fill="#cfe1ff"/>
  </g>
  <g data-unless="fenster_auf"><rect x="596" y="156" width="8" height="468" fill="#1a130d"/><rect x="396" y="386" width="408" height="8" fill="#1a130d"/></g>
  <g data-if="fenster_auf"><polygon points="396,156 520,190 520,600 396,624" fill="#0c1116" stroke="#1a130d" stroke-width="8" opacity=".9"/><rect x="420" y="640" width="360" height="12" fill="#8aa0b8" opacity=".15"/></g>
  <path d="M300 120 h110 q-20 260 10 540 h-120 z" fill="#4a1f1c"/><path d="M790 120 h110 v540 h-120 q30 -280 10 -540 z" fill="#4a1f1c"/>
  <rect x="290" y="112" width="620" height="12" rx="6" fill="url(#zs-brass)"/>
  <g><rect x="430" y="680" width="340" height="80" rx="6" fill="#2a2420"/><g stroke="#1a1612" stroke-width="6"><line x1="460" y1="684" x2="460" y2="756"/><line x1="500" y1="684" x2="500" y2="756"/><line x1="540" y1="684" x2="540" y2="756"/><line x1="580" y1="684" x2="580" y2="756"/><line x1="620" y1="684" x2="620" y2="756"/><line x1="660" y1="684" x2="660" y2="756"/><line x1="700" y1="684" x2="700" y2="756"/><line x1="740" y1="684" x2="740" y2="756"/></g></g>
  `);

  /* ---------- WEST: Schreibtisch und Schrank ---------- */
  const west = scene("zw", `
  <rect width="1200" height="612" fill="#3a1a1a" opacity=".32"/>
  <g>
    <rect x="100" y="470" width="420" height="22" fill="#4a3424"/><rect x="116" y="492" width="20" height="276" fill="#2a1d14"/><rect x="484" y="492" width="20" height="276" fill="#2a1d14"/>
    <rect x="300" y="492" width="200" height="70" fill="url(#zw-wood)"/><circle cx="400" cy="527" r="5" fill="url(#zw-brass)"/>
    <rect x="182" y="455" width="68" height="15" rx="3" fill="url(#zw-brass)"/><rect x="210" y="380" width="12" height="76" fill="url(#zw-brass)"/><rect x="196" y="372" width="40" height="10" rx="3" fill="url(#zw-brass)"/>
    <rect x="207" y="320" width="18" height="52" fill="#e8dcc0"/><path d="M216 300 q-6 10 0 20 q6 -10 0 -20" fill="#e7b46a" class="flicker"/>
    <ellipse class="flicker" cx="216" cy="330" rx="140" ry="120" fill="url(#zw-glow)"/>
    <g data-if="fenster_auf"><rect x="330" y="450" width="70" height="20" fill="#efe6d2" transform="rotate(-10 365 460)"/><g stroke="#3a3a7a" stroke-width="1.5" transform="rotate(-10 365 460)"><line x1="338" y1="456" x2="390" y2="456"/><line x1="338" y1="463" x2="380" y2="463"/></g></g>
    <path d="M200 600 h120 v170 M200 600 v170" fill="none" stroke="#2a1d14" stroke-width="10"/><rect x="190" y="580" width="140" height="24" fill="#3a2a1e"/>
  </g>
  <g>
    <rect x="580" y="480" width="300" height="300" fill="url(#zw-wood)" stroke="#4d3826" stroke-width="2"/>
    <rect x="600" y="500" width="260" height="80" fill="none" stroke="#4d3826" stroke-width="2"/><rect x="600" y="595" width="260" height="80" fill="none" stroke="#4d3826" stroke-width="2"/><rect x="600" y="690" width="260" height="70" fill="none" stroke="#4d3826" stroke-width="2"/>
    <g data-unless="kommode_open"><rect x="702" y="522" width="56" height="34" rx="3" fill="#120e0b" stroke="url(#zw-brass)" stroke-width="2"/><g fill="#b69a6d" font-family="DM Mono, monospace" font-size="11"><text x="707" y="544">0</text><text x="719" y="544">0</text><text x="731" y="544">0</text><text x="743" y="544">0</text></g></g>
    <g data-if="kommode_open"><rect x="596" y="490" width="268" height="94" fill="#3a2a1e" stroke="#5a412b" stroke-width="2"/><rect x="610" y="500" width="240" height="20" fill="#0a0807"/></g>
    <rect x="690" y="382" width="90" height="98" fill="url(#zw-brass)"/><rect x="698" y="390" width="74" height="82" fill="#3a3025"/><ellipse cx="735" cy="424" rx="16" ry="20" fill="#7a6650"/><path d="M712 472 q23 -34 46 0 z" fill="#2a221b"/>
  </g>
  <g>
    <rect x="930" y="170" width="230" height="630" fill="#0a0807"/>
    <g data-unless="schrank_open"><rect x="938" y="178" width="106" height="614" fill="#33241a" stroke="#5a412b" stroke-width="2"/><rect x="1046" y="178" width="106" height="614" fill="#33241a" stroke="#5a412b" stroke-width="2"/>
      <rect x="1018" y="440" width="54" height="80" rx="3" fill="#120e0b" stroke="url(#zw-brass)" stroke-width="2"/><g fill="#b69a6d"><rect x="1024" y="450" width="6" height="60"/><rect x="1033" y="450" width="6" height="60"/><rect x="1042" y="450" width="6" height="60"/><rect x="1051" y="450" width="6" height="60"/><rect x="1060" y="450" width="6" height="60"/></g></g>
    <g data-if="schrank_open"><rect x="938" y="178" width="214" height="614" fill="#070605"/><line x1="950" y1="230" x2="1140" y2="230" stroke="#3a2a1e" stroke-width="5"/><path d="M990 232 l20 0 l-6 120 h-10 z" fill="#2a2522"/><polygon points="938,178 900,196 900,780 938,792" fill="#33241a" stroke="#5a412b" stroke-width="2"/><polygon points="1152,178 1190,196 1190,780 1152,792" fill="#33241a" stroke="#5a412b" stroke-width="2"/></g>
    <text x="1045" y="210" text-anchor="middle" fill="#8a6c45" font-family="Playfair Display, serif" font-style="italic" font-size="15" data-unless="schrank_open">Wer nachts wacht</text>
  </g>
  `);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "zimmer217",
    name: "Zimmer 217",
    title: "Zimmer 217",
    kicker: "2. ETAGE / OSTFLÜGEL",
    story: "Der Raum ist unberührt, als hätte jemand gerade erst ausgecheckt. Auf dem Bett liegt ein Brief. Draußen tobt das Gewitter.",
    weather: "storm",
    exitLabel: "Die Treppe hinuntergehen",
    exitVia: "door",
    views: [
      {
        id: "nord", dir: "NORD", name: "Zimmertür", scene: nord,
        desc: "Die Zimmertür mit der Messingnummer 217. Daneben eine Garderobe mit einem dunklen Mantel und ein Spiegel.",
        hotspots: [
          { id: "tuer217", label: "Zurück zum Aufzug", x: 38.3, y: 17.8, w: 23.3, h: 68.9, go: "rezeption", via: "elevator" },
          { id: "mantel", label: "Mantel", x: 15, y: 26.7, w: 10.8, h: 36.7, secret: true, title: "Ein dunkelgrüner Mantel", text: "Ein Damenmantel, viel zu leicht für Oktober. In der Tasche steckt eine Kinokarte.", doc: "kinokarte" },
          { id: "spiegel", label: "Spiegel", x: 70.8, y: 24.4, w: 13.3, h: 33.3, title: "Der Spiegel", text: "Dein Gesicht, blass im Dämmerlicht. Für einen Herzschlag meinst du, hinter dir etwas zu sehen – aber da ist nur die Tür. Am unteren Rahmen hängt an einer Kordel ein alter Schlüssel." },
          { id: "alterschluessel", label: "Alter Schlüssel", x: 74.5, y: 59, w: 6, h: 7.5, title: "Ein alter Schlüssel", text: "Ein verzierter Schlüssel, der zu keinem Schloss in diesem Zimmer passt – reine Dekoration. Du drehst ihn um: In den Bart ist eine <b>7</b> eingeschlagen." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Bett", scene: ost,
        desc: "Das Doppelbett, sorgfältig gemacht. Auf der Tagesdecke liegt ein Brief, auf dem Nachttisch eine Sanduhr. Unter dem Bett ist es pechschwarz.",
        dark: { x: 21.5, y: 80, w: 57, h: 8.5 },
        hotspots: [
          { id: "bett", label: "Bett", x: 21, y: 37, w: 59, h: 41, title: "Das Bett", text: "Das Kissen hat noch eine leichte Mulde, als hätte hier vor Kurzem jemand gelegen. Die Decke ist kalt." },
          { id: "brief_bett", label: "Brief", x: 57.5, y: 59, w: 8.3, h: 5.6, title: "Ein Brief auf dem Bett", doc: "brief_bett" },
          { id: "sanduhr", label: "Sanduhr", x: 84.2, y: 50.6, w: 5.5, h: 10, title: "Die Sanduhr", text: "Der Sand ist vor langer Zeit durchgelaufen. Du hebst die Sanduhr an: In den Holzboden ist eine <b>4</b> eingebrannt." },
          { id: "nachttisch", label: "Nachttisch", x: 82, y: 61, w: 12, h: 23, title: "Der Nachttisch", text: "In der Schublade liegen eine Bibel, ein Hotelbleistift und ein Briefbogen ohne Text." },
          { id: "bild_bett", label: "Gemälde", x: 40, y: 18.9, w: 20, h: 14.4, title: "Ein Landschaftsbild", text: "Ein See bei Mondschein. Unten rechts, kaum lesbar: <i>„für E.“</i>" },
          { id: "unterbett", label: "Unter dem Bett", x: 22, y: 80, w: 56, h: 8.5, unless: "licht", title: "Unter dem Bett", text: "Unter dem Bett ist es so dunkel, dass du nichts erkennst. Mit bloßer Hand hineinzugreifen, traust du dich nicht." },
          { id: "gepaeckschein", label: "Gepäckschein", x: 46.5, y: 80.5, w: 7.5, h: 5, if: "licht", unless: "taken_gepaeckschein", take: "gepaeckschein", solves: "gepaeckschein", takeText: "Im Lichtkegel klebt etwas unter dem Lattenrost: ein Gepäckschein mit der Nummer <b>6</b>. Daneben ist „UG“ ins Holz geritzt. Du nimmst den Schein mit." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Fenster", scene: sued,
        desc: "Das Fenster zum Innenhof. Regen läuft in Strömen über das Glas.",
        hotspots: [
          { id: "fenster", label: "Fenster", x: 31.7, y: 15.6, w: 36.7, h: 55.6, unless: "fenster_auf", title: "Das Fenster", text: "Unten liegt der Innenhof, fast völlig dunkel. Bei jedem Blitz siehst du für einen Augenblick die westliche Mauer – und darin ein schmales Tor, das auf keinem Plan zu stehen scheint." },
          { id: "fenster_offen", label: "Offenes Fenster", x: 31.7, y: 15.6, w: 36.7, h: 55.6, if: "fenster_auf", title: "Das offene Fenster", text: "Das Fenster ist aufgeschlagen, Regen weht herein. Der Riegel ist nicht gebrochen – er war offen. Jemand muss ihn gelöst haben. Du schließt das Fenster, so gut es geht." },
          { id: "vorhang", label: "Vorhang", x: 24, y: 13, w: 9, h: 60, title: "Der Vorhang", text: "Schwerer roter Samt, staubig. Am Saum hat jemand mit Kugelschreiber winzig „M + P“ geschrieben." },
          { id: "heizung", label: "Heizkörper", x: 35.8, y: 75.6, w: 28.3, h: 8.9, title: "Der Heizkörper", text: "Eiskalt. Auf dem Ventil ist die Zahl 0 eingestellt." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Schreibtisch", scene: west,
        desc: "Schreibtisch mit Kerzenständer, eine Kommode mit Ziffernschloss und ein schwerer Kleiderschrank.",
        hotspots: [
          { id: "kerzenstaender", label: "Kerzenständer", x: 14.2, y: 33, w: 7.5, h: 20, title: "Der Kerzenständer", text: "Die Kerze brennt – jemand muss sie vor Kurzem angezündet haben. Du hebst den Ständer vorsichtig an: Unter dem Fuß klebt ein Etikett mit einer <b>1</b>." },
          { id: "schreibtisch", label: "Schreibtischschublade", x: 25, y: 55.5, w: 16.7, h: 7, title: "Die Schreibtischschublade", text: "Hotelbriefpapier, ein Brieföffner und ein Fahrplan der Regionalbahn von 2009. Nichts davon scheint wichtig." },
          { id: "blatt", label: "Blatt Papier", x: 26.7, y: 48.9, w: 7.5, h: 4.4, if: "fenster_auf", title: "Ein Blatt auf dem Schreibtisch", text: "Eben lag es noch nicht hier.", doc: "blatt" },
          { id: "portraet217", label: "Porträtfoto", x: 56.7, y: 41.1, w: 8.3, h: 11.7, title: "Ein Porträtfoto", text: "Eine Frau mit Maras Augen – vielleicht ihre Mutter. Du drehst den Rahmen um: Auf der Rückseite steht mit Kreide eine <b>3</b>." },
          { id: "kommode", label: "Kommode", x: 48.3, y: 54.4, w: 25, h: 32.2, title: "Die Kommode", lock: "anordnung" },
          { id: "schrank", label: "Kleiderschrank", x: 77.5, y: 18.9, w: 19.2, h: 70, title: "Der Kleiderschrank", lock: "schrank" },
        ],
      },
    ],
    events: [
      {
        id: "fenster", view: "sued", ifSolved: "anordnung", flash: true,
        actions: [{ flag: "fenster_auf" }, { sound: "drop" }],
        narrate: "Ein greller Blitz – und mit einem Knall schlägt das Fenster auf. Kalter Regen weht herein. Irgendwo im Flur fällt eine Tür ins Schloss.",
      },
    ],
    puzzles: {
      anordnung: {
        type: "code", length: 4, title: "Die Kommode",
        prompt: "Die oberste Schublade hat ein vierstelliges Ziffernschloss. Vielleicht hilft der Brief auf dem Bett.",
        answers: ["4173"],
        wrong: { "1234": "Nichts. Die Ziffern liegen irgendwo im Zimmer.", "4137": "Fast. Prüfe die Reihenfolge noch einmal genau." },
        objective: "Öffne die Kommode.",
        hints: [
          "Der Brief auf dem Bett beschreibt vier Dinge, die irgendwo in diesem Zimmer stehen. Sieh dich in alle Richtungen um und untersuche alles genau.",
          "Die Zahlen stehen auf den Gegenständen selbst. Zeit = Sanduhr (Bett), Licht = Kerzenständer (Schreibtisch), Türen = alter Schlüssel (Spiegel), Erinnerungen = Porträtfoto (Kommode).",
          "4 – 1 – 7 – 3.",
        ],
        success: "Die Schublade gleitet auf. Darin liegen ein Brief an jemanden namens Mara und ein Foto. Du nimmst beides an dich.",
        onSolve: [{ flag: "kommode_open" }, { doc: "brief_mara" }, { doc: "foto_mara" }],
      },
      schrank: {
        type: "wheels", length: 5, title: "Das Buchstabenschloss",
        prompt: "Fünf Buchstabenräder aus Messing. In das Holz über den Türen ist geschnitzt: <i>„Wer nachts wacht“</i>.",
        answers: ["ELIAS"],
        wrong: {
          MARAS: "Nein. Nicht die, die schläft – der, der wacht.",
          VOSSE: "Die Räder wollen einen Vornamen.",
          VOSSS: "Die Räder wollen einen Vornamen.",
          VALEE: "Ein falscher Name öffnet keinen echten Schrank.",
        },
        objective: "Öffne den Kleiderschrank.",
        hints: [
          "„Wer nachts wacht“ – wer hatte in diesem Hotel nachts Dienst? Lies die Rückseite des Fotos aus der Kommode.",
          "Auf der Rückseite des Personalfotos aus der Rezeption steht, wer Nachtdienst hatte. Es liegt in deiner Akte.",
          "ELIAS.",
        ],
        success: "Die Räder rasten ein, die Schranktüren springen auf. Auf dem Boden liegt ein Schlüsselbund – und ein Zettel in vertrauter Handschrift.",
        onSolve: [{ flag: "schrank_open" }, { give: "personalschluessel" }, { doc: "schrankbrief" }, { message: "m_papa" }],
      },
      gepaeckschein: {
        type: "event", title: "Unter dem Bett",
        objective: "Durchsuche das Zimmer gründlich – auch dort, wo kein Licht hinkommt.",
        hints: [
          "Ein Teil dieses Zimmers liegt völlig im Dunkeln.",
          "Schalte im Telefon die Taschenlampe ein und leuchte unter das Bett (Osten).",
          "Unter dem Lattenrost klebt ein Gepäckschein – tippe ihn im Lichtkegel an.",
        ],
        success: "Du hast den Gepäckschein Nr. 6 gefunden.",
      },
      personaltuer: {
        type: "use", item: "personalschluessel", title: "Tür „Personal“",
        wrongItem: "Der passt nicht in dieses alte Schloss.",
        noItems: "Du hast keinen passenden Schlüssel.",
        objective: "Öffne in der Rezeption die Tür „Personal“.",
        hints: [
          "„Nimm die Treppe, nicht den Aufzug.“ Wo hast du im Hotel eine verschlossene Tür gesehen, die zu einer Treppe führt?",
          "Fahr mit dem Aufzug zurück in die Rezeption. Die Tür „Personal“ ist im Osten neben dem Aufzug.",
          "Benutze den Personalschlüssel an der Tür „Personal“ in der Rezeption.",
        ],
        success: "Der schwere Schlüssel dreht sich mit einem Ruck. Dahinter riecht es nach nassem Stein. Eine schmale Treppe führt hinab ins Untergeschoss.",
        onSolve: [{ flag: "personal_open" }, { sound: "door" }, { unlock: "gepaecklager" }],
      },
    },
    completeWhen: ["personaltuer"],
  });
})();
