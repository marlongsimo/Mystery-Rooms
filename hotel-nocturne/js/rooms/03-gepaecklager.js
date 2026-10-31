/*
 * STATION 3 – DAS GEPÄCKLAGER (Untergeschoss)
 * Umsetzung von „Raum 3 – Gepäcklager, Stand 1.1“ (siehe RAETSELDESIGN.md).
 * 3 Haupträtsel (Ausgabe, Truhe, Notiz) und 2 Übergänge (Käfig, Archivtür).
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    kaefigschluessel: { name: "Käfigschlüssel", icon: "⚿", text: "Ein kleiner, schwerer Schlüssel mit Messingmarke: „Wertgepäck – Käfig“." },
    archivschluessel: { name: "Archivschlüssel", icon: "⚷", text: "Ein langer Bartschlüssel. Auf dem Lederanhänger, mit Kugelschreiber: „Archiv – nur E.V.“" },
  });

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_schal: { from: "Unbekannte Nummer", text: "Den Schal hat er mir zum achtzehnten Geburtstag geschenkt. Ich habe ihn in jener Nacht hier zurückgelassen." },
    m_name: { from: "Unbekannte Nummer", text: "Du hast gefunden, was im Register fehlte. Ein Name kann aus einer Akte verschwinden. Aus einer Erinnerung nicht." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    verzeichnis_reste: {
      title: "Gepäckverzeichnis (beschädigt)", kind: "register",
      html: `<p class="doc-head">WERTGEPÄCK<br><small>14. OKTOBER 2009</small></p>
        <p class="doc-banner">Nur vier Stücke eingelagert.<br><span>Die übrigen Gäste haben ihre Koffer vor der Evakuierung zurückerhalten.</span></p>
        <p class="mono">Die <b>Schachfigur</b> gehört dem Gast, der von diesen vier zuerst ankam.</p>
        <p class="mono smudge">▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒▒▒ ▒▒ ▒▒▒▒▒▒ ▒▒▒</p>
        <p class="mono">Das <b>Notenblatt</b> gehört zu Zimmer 214.</p>
        <p class="mono">Der <b>Kompass</b> gehört dem Gast, der von diesen vier zuletzt ankam.</p>
        <p class="mono dim">Namen und Ankunftszeiten: vom Wasser unleserlich.</p>`,
    },
    gepaeckverzeichnis: {
      title: "Originales Gepäckverzeichnis", kind: "register",
      html: `<p class="doc-head">WERTGEPÄCK – ORIGINAL<br><small>NACHT 14./15. OKTOBER 2009</small></p>
        <table class="doc-table"><thead><tr><th>Nr.</th><th>Gast</th><th>Zimmer</th><th>Kennzeichen</th></tr></thead><tbody>
          <tr><td>2</td><td>L. Berger</td><td>201</td><td>Schachfigur</td></tr>
          <tr><td>6</td><td>M. Vale</td><td>217</td><td>Blauer Schal</td></tr>
          <tr><td>9</td><td>J. Winter</td><td>214</td><td>Notenblatt</td></tr>
          <tr><td>4</td><td>A. Stern</td><td>220</td><td>Kompass</td></tr></tbody></table>
        <p class="handwriting margin">M. Vale – tatsächlicher Name: <b>Mara Voss</b>.</p>`,
    },
    mara_notizbuch: {
      title: "Maras Notizbuch", kind: "letter",
      html: `<p class="handwriting other">Papa sagt, das Hotel hat mehr Türen, als auf dem Plan stehen.</p>
        <p class="handwriting other">Er sagt, ich soll mir merken, welche davon wirklich nach draußen führen.</p>`,
    },
    elias_notiz: {
      title: "Elias’ zerrissene Notiz", kind: "note",
      html: `<p class="handwriting">Band Kamera 3 gesichert.<br>Liegt im Archiv, Fach W.<br>Lehn darf es nie finden.<br>Ich bin erst zurück, als alle draußen waren.</p><p class="handwriting sign">– E.</p>`,
    },
  });

  /* ---------- Keller-Grundgerüst: Beton statt Tapete, Wasserflecken bis Kniehöhe ---------- */
  const keller = (p, body) => scene(p, `
  <rect width="1200" height="760" fill="#191a18"/>
  <g fill="#ffffff" opacity=".018"><rect x="0" y="120" width="1200" height="2"/><rect x="0" y="260" width="1200" height="2"/><rect x="0" y="400" width="1200" height="2"/><rect x="300" y="0" width="2" height="760"/><rect x="700" y="0" width="2" height="760"/><rect x="1050" y="0" width="2" height="760"/></g>
  <path d="M0 590 q60 -14 120 0 t120 2 t120 -6 t120 4 t120 -2 t120 6 t120 -4 t120 2 t120 -4 t120 4 v170 h-1200 z" fill="#0f100e" opacity=".75"/>
  <path d="M0 590 q60 -14 120 0 t120 2 t120 -6 t120 4 t120 -2 t120 6 t120 -4 t120 2 t120 -4 t120 4" fill="none" stroke="#3a3428" stroke-width="2" opacity=".6"/>
  <rect y="760" width="1200" height="140" fill="#0b0c0b"/><rect y="760" width="1200" height="140" fill="#8aa0b8" opacity=".04"/>
  <rect y="34" width="1200" height="14" fill="#2a2620"/><circle cx="1090" cy="48" r="5" fill="#8aa0b8" opacity=".5"/>
  ${body}`, { wainscot: false });

  /* ---------- NORD: Treppe und Archivtür ---------- */
  const nord = keller("gn", `
  <rect x="430" y="110" width="340" height="250" fill="#141513"/>
  <g>
    <rect x="530" y="112" width="140" height="196" fill="#2a2016" stroke="#4d3826" stroke-width="3"/>
    <rect x="548" y="128" width="104" height="110" fill="#c9d1cf" opacity=".22"/>
    <rect x="548" y="128" width="104" height="110" fill="#e7c48a" opacity=".35" data-if="archiv_offen"/>
    <text x="600" y="190" text-anchor="middle" fill="#d6dcda" opacity=".75" font-family="DM Mono, monospace" font-size="15" letter-spacing="4">ARCHIV</text>
    <rect x="648" y="246" width="10" height="26" rx="3" fill="url(#gn-brass)"/>
    <ellipse cx="600" cy="230" rx="140" ry="110" fill="url(#gn-glow)" data-if="archiv_offen"/>
  </g>
  <rect x="300" y="250" width="110" height="26" fill="#cdbd9b" opacity=".65"/><text x="355" y="268" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="11">← REZEPTION</text>
  <g>
    <rect x="440" y="308" width="320" height="22" fill="#2a2620"/>
    <rect x="425" y="352" width="350" height="26" fill="#2c2822"/><rect x="410" y="400" width="380" height="30" fill="#2f2b24"/><rect x="395" y="452" width="410" height="34" fill="#322d26"/>
    <rect x="380" y="510" width="440" height="38" fill="#352f27"/><rect x="362" y="574" width="476" height="42" fill="#38322a"/><rect x="344" y="644" width="512" height="46" fill="#3a342b"/><rect x="326" y="720" width="548" height="50" fill="#3c362d"/>
    <g fill="#8aa0b8" opacity=".09"><rect x="400" y="452" width="400" height="6"/><rect x="370" y="574" width="460" height="6"/><rect x="335" y="720" width="530" height="6"/></g>
    <path d="M800 770 L740 300" stroke="url(#gn-brass)" stroke-width="6"/><path d="M400 770 L460 300" stroke="#3a3226" stroke-width="5"/>
  </g>
  <g><rect x="890" y="270" width="64" height="40" rx="4" fill="#2a2620" stroke="#5a4a33"/><rect x="898" y="278" width="48" height="16" fill="#f3e6b8" class="flicker"/><ellipse class="flicker" cx="922" cy="300" rx="160" ry="140" fill="url(#gn-glow)"/><rect x="900" y="298" width="40" height="8" fill="#cdbd9b" opacity=".6"/></g>
  `);

  /* ---------- OST: Regale ---------- */
  const ost = keller("go", `
  <path d="M0 80 H1200" stroke="#3a342b" stroke-width="18"/><path d="M1100 80 v40" stroke="#3a342b" stroke-width="12"/>
  <g stroke="#4a4a44" stroke-width="10"><line x1="150" y1="250" x2="150" y2="790"/><line x1="1050" y1="250" x2="1050" y2="790"/><line x1="600" y1="250" x2="600" y2="790"/></g>
  <g fill="#3d3d38"><rect x="140" y="292" width="920" height="14"/><rect x="140" y="502" width="920" height="14"/><rect x="140" y="702" width="920" height="14"/></g>
  <g data-if="koffer_gerutscht">
    <rect x="790" y="588" width="210" height="6" fill="#d9b23a"/><text x="895" y="578" text-anchor="middle" fill="#d9b23a" font-family="DM Mono, monospace" font-size="13">14.10.2009 · 23:10</text>
    <text x="895" y="614" text-anchor="middle" fill="#d9b23a" opacity=".8" font-family="DM Mono, monospace" font-size="10" letter-spacing="2">WASSERSTAND KNIEHÖHE</text>
  </g>
  <g><rect x="220" y="400" width="200" height="102" rx="8" fill="#4a3424" stroke="#2a1d14" stroke-width="3"/><rect x="300" y="388" width="40" height="14" rx="5" fill="#2a1d14"/>
    <path d="M330 398 q-8 -30 6 -44 q14 2 12 18 l-6 8 l8 18 z" fill="#d8cdb6" stroke="#6b5a44" stroke-width="2"/><circle cx="244" cy="440" r="13" fill="url(#go-brass)"/><text x="244" y="445" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="13">2</text></g>
  <g><rect x="500" y="380" width="200" height="122" rx="8" fill="#243330" stroke="#121a17" stroke-width="3"/><rect x="580" y="368" width="40" height="14" rx="5" fill="#121a17"/>
    <rect x="530" y="356" width="80" height="40" fill="#efe6d2" transform="rotate(-6 570 376)"/><g stroke="#3a3a3a" stroke-width="1" transform="rotate(-6 570 376)"><line x1="534" y1="364" x2="606" y2="364"/><line x1="534" y1="370" x2="606" y2="370"/><line x1="534" y1="376" x2="606" y2="376"/><line x1="534" y1="384" x2="606" y2="384"/><line x1="534" y1="390" x2="606" y2="390"/></g>
    <circle cx="676" cy="432" r="13" fill="url(#go-brass)"/><text x="676" y="437" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="13">9</text></g>
  <g data-unless="koffer_gerutscht"><rect x="780" y="560" width="200" height="142" rx="8" fill="#1a1918" stroke="#0a0a0a" stroke-width="3"/><rect x="860" y="548" width="40" height="14" rx="5" fill="#0a0a0a"/>
    <circle cx="840" cy="610" r="20" fill="url(#go-brass)"/><circle cx="840" cy="610" r="14" fill="#e8dcc0"/><line x1="840" y1="610" x2="848" y2="598" stroke="#8e3b36" stroke-width="2"/>
    <circle cx="956" cy="600" r="13" fill="url(#go-brass)"/><text x="956" y="605" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="13">4</text></g>
  <g data-if="koffer_gerutscht" transform="rotate(-9 860 760)"><rect x="760" y="712" width="200" height="88" rx="8" fill="#1a1918" stroke="#0a0a0a" stroke-width="3"/><circle cx="820" cy="750" r="18" fill="url(#go-brass)"/><circle cx="936" cy="740" r="12" fill="url(#go-brass)"/></g>
  <g><rect x="1060" y="700" width="90" height="96" fill="#3a3a36" stroke="#22221f" stroke-width="3"/><ellipse cx="1105" cy="702" rx="45" ry="8" fill="#5a6a72" opacity=".6"/><line x1="1105" y1="120" x2="1105" y2="160" stroke="#8aa0b8" stroke-width="2" stroke-dasharray="3 20" opacity=".5"/></g>
  `);

  /* ---------- SÜD: Ausgabetresen ---------- */
  const sued = keller("gs", `
  <rect x="440" y="196" width="320" height="30" fill="#cdbd9b" opacity=".7"/><text x="600" y="216" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="12" letter-spacing="1">AUSGABE NUR GEGEN GEPÄCKSCHEIN</text>
  <rect x="470" y="240" width="260" height="240" fill="#0a0b0a" stroke="#4a4a44" stroke-width="6"/>
  <g data-unless="koffer_da"><rect x="476" y="246" width="248" height="228" fill="#4a4a44"/><g stroke="#3a3a35" stroke-width="3"><line x1="476" y1="290" x2="724" y2="290"/><line x1="476" y1="335" x2="724" y2="335"/><line x1="476" y1="380" x2="724" y2="380"/><line x1="476" y1="425" x2="724" y2="425"/></g>
    <g fill="#5d5d56"><circle cx="490" cy="260" r="4"/><circle cx="710" cy="260" r="4"/><circle cx="490" cy="460" r="4"/><circle cx="710" cy="460" r="4"/></g></g>
  <g data-if="koffer_da"><rect x="476" y="246" width="248" height="34" fill="#4a4a44"/><rect x="476" y="280" width="248" height="194" fill="#050505"/></g>
  <rect x="150" y="480" width="900" height="24" fill="#3b2b1e"/><rect x="170" y="504" width="860" height="276" fill="url(#gs-wood)"/>
  <rect x="560" y="474" width="80" height="10" fill="#050505" stroke="url(#gs-brass)" stroke-width="2"/>
  <g data-if="koffer_da">
    <polygon points="480,380 720,380 708,300 492,300" fill="#3a2c20" stroke="#22170f" stroke-width="2"/>
    <rect x="470" y="380" width="260" height="100" rx="6" fill="#4a3424" stroke="#22170f" stroke-width="3"/><rect x="484" y="392" width="232" height="76" fill="#2a1d14"/>
    <path d="M488 396 q60 30 120 6 t104 20 v40 h-224 z" fill="#2f5d8a"/><circle cx="700" cy="404" r="12" fill="url(#gs-brass)"/><text x="700" y="409" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="12">6</text>
    <rect x="508" y="430" width="52" height="34" fill="#5b2a24" stroke="#2a1d14"/>
    <g data-unless="taken_kaefigschluessel"><circle cx="660" cy="446" r="8" fill="none" stroke="url(#gs-brass)" stroke-width="4"/><rect x="666" y="443" width="26" height="6" fill="url(#gs-brass)"/></g>
  </g>
  <g><ellipse cx="300" cy="478" rx="28" ry="5" fill="#1f1710"/><path d="M276 476 a24 21 0 0 1 48 0 z" fill="url(#gs-brass)"/><rect x="296" y="448" width="8" height="7" rx="2" fill="#b69a6d"/></g>
  <g transform="rotate(-4 870 468)"><rect x="800" y="452" width="150" height="30" fill="#b9ad90"/><rect x="800" y="452" width="150" height="30" fill="#6a5a40" opacity=".35"/><g stroke="#4f4434" stroke-width="1.5"><line x1="812" y1="462" x2="930" y2="462"/><line x1="812" y1="470" x2="900" y2="470"/></g></g>
  <g><path d="M1056 676 h92 l-10 120 h-72 z" fill="none" stroke="#5a5a52" stroke-width="3"/><g stroke="#5a5a52" stroke-width="1.5"><line x1="1070" y1="680" x2="1076" y2="794"/><line x1="1090" y1="680" x2="1092" y2="794"/><line x1="1110" y1="680" x2="1108" y2="794"/><line x1="1130" y1="680" x2="1124" y2="794"/></g>
    <g fill="#e6dcc3"><rect x="1070" y="664" width="40" height="10" transform="rotate(-12 1090 669)"/><rect x="1094" y="660" width="38" height="9" transform="rotate(8 1113 664)"/><rect x="1078" y="672" width="44" height="8" transform="rotate(3 1100 676)"/></g></g>
  `);

  /* ---------- WEST: Gitterkäfig und Truhe ---------- */
  const bars = (x1, x2) => Array.from({ length: Math.floor((x2 - x1) / 28) + 1 }, (_, i) => `<line x1="${x1 + i * 28}" y1="160" x2="${x1 + i * 28}" y2="800"/>`).join("");
  const west = keller("gw", `
  <g>
    <rect x="455" y="560" width="290" height="200" rx="6" fill="#4a3424" stroke="#22170f" stroke-width="3"/>
    <g fill="url(#gw-brass)"><rect x="455" y="600" width="290" height="10"/><rect x="455" y="710" width="290" height="10"/></g>
    <g data-unless="truhe_offen"><polygon points="450,560 750,560 735,520 465,520" fill="#5a4230" stroke="#22170f" stroke-width="3"/>
      <rect x="566" y="626" width="68" height="40" rx="3" fill="#120e0b" stroke="url(#gw-brass)" stroke-width="2"/><g fill="#b69a6d" font-family="DM Mono, monospace" font-size="11"><text x="573" y="651">0</text><text x="588" y="651">0</text><text x="603" y="651">0</text><text x="618" y="651">0</text></g></g>
    <g data-if="truhe_offen"><polygon points="455,560 745,560 760,430 470,430" fill="#3a2a1e" stroke="#22170f" stroke-width="3"/><rect x="470" y="566" width="260" height="30" fill="#0a0807"/><rect x="520" y="560" width="70" height="20" fill="#e6dcc3" transform="rotate(-5 555 570)"/></g>
  </g>
  <rect x="240" y="150" width="720" height="16" fill="#3d3d38"/><rect x="240" y="784" width="720" height="16" fill="#3d3d38"/>
  <g stroke="#55554e" stroke-width="5">${bars(250, 510)}${bars(706, 950)}</g>
  <g data-unless="kaefig_offen"><g stroke="#5f5f57" stroke-width="5">${bars(530, 690)}</g><rect x="520" y="166" width="6" height="618" fill="#3d3d38"/><rect x="690" y="166" width="6" height="618" fill="#3d3d38"/>
    <rect x="664" y="450" width="44" height="54" rx="4" fill="#2a2a26" stroke="url(#gw-brass)" stroke-width="2"/><circle cx="686" cy="472" r="5" fill="#0a0a0a"/></g>
  <g data-if="kaefig_offen" stroke="#5f5f57" stroke-width="5"><polygon points="520,166 430,200 430,750 520,784" fill="none"/><line x1="460" y1="188" x2="460" y2="762"/><line x1="490" y1="177" x2="490" y2="773"/></g>
  <rect x="500" y="176" width="200" height="34" fill="#cdbd9b" opacity=".75"/><text x="600" y="199" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="14" letter-spacing="4">WERTGEPÄCK</text>
  `);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "gepaecklager",
    name: "Gepäcklager",
    title: "Das Gepäcklager",
    kicker: "UNTERGESCHOSS / SERVICEBEREICH",
    story: "Feuchter Beton, Wasserflecken bis Kniehöhe. Irgendwo tropft es. Es riecht nach nassem Stein und altem Leder.",
    ambient: "drip",
    exitLabel: "Ins Hotelarchiv",
    exitVia: "door",
    views: [
      {
        id: "nord", dir: "NORD", name: "Treppe", scene: nord,
        desc: "Die nasse Treppe, über die du gekommen bist. Oben auf dem Absatz: eine Milchglastür mit der Aufschrift ARCHIV.",
        hotspots: [
          { id: "treppe", label: "Treppe hinauf (Rezeption)", x: 31.7, y: 62.2, w: 36.7, h: 26.7, go: "rezeption", via: "door" },
          { id: "archivtuer", label: "Archivtür", x: 44.2, y: 12.4, w: 11.7, h: 21.8, unless: "archiv_offen", title: "Die Archivtür", text: "Milchglas, dahinter Dunkelheit. Die Tür ist abgeschlossen. Unter der Klinke ein altes Bartschloss.", use: "archivtuer" },
          { id: "archivtuer_offen", label: "Ins Archiv", x: 44.2, y: 12.4, w: 11.7, h: 21.8, if: "archiv_offen", go: "archiv", via: "door" },
          { id: "notlicht", label: "Notbeleuchtung", x: 73.5, y: 29.5, w: 6.5, h: 5.5, title: "Die Notbeleuchtung", text: "Die Lampe flackert unregelmäßig. Auf dem Typenschild: <b>„Notstromkreis W · geprüft 09/2009“</b>." },
          { id: "wasserflecken", label: "Wasserflecken", x: 3, y: 65, w: 22, h: 14, title: "Wasserflecken", text: "Ein dunkler Rand zieht sich auf Kniehöhe um den ganzen Raum. So hoch stand das Wasser hier unten einmal." },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Regale", scene: ost,
        desc: "Ein schweres Metallregal mit drei Koffern. An jedem hängt ein Gegenstand mit Messinganhänger.",
        hotspots: [
          { id: "koffer2", label: "Koffer mit Schachfigur", x: 18.3, y: 39, w: 16.7, h: 17, title: "Ein brauner Lederkoffer", text: "Auf dem Deckel ist eine dunkle Springerfigur festgebunden. Messinganhänger: <b>2</b>. Das Namensschild ist vom Wasser aufgeweicht und unleserlich." },
          { id: "koffer9", label: "Koffer mit Notenblatt", x: 41.7, y: 39, w: 16.7, h: 17, title: "Ein grüner Koffer", text: "Unter dem Riemen steckt ein Notenblatt: ein Chopin-Nocturne mit Bleistift-Fingersatz. Messinganhänger: <b>9</b>. Kein lesbarer Name." },
          { id: "koffer4", label: "Koffer mit Kompass", x: 65, y: 61, w: 16.7, h: 17, unless: "koffer_gerutscht", title: "Ein schwarzer Koffer", text: "Am Griff hängt ein alter Messingkompass mit eingravierten Initialen, die nicht mehr zu lesen sind. Messinganhänger: <b>4</b>." },
          { id: "koffer4_boden", label: "Heruntergerutschter Koffer", x: 63.3, y: 78, w: 16.7, h: 11, if: "koffer_gerutscht", title: "Der schwarze Koffer", text: "Er liegt schräg auf dem nassen Boden. Niemand hat ihn angefasst – jedenfalls nicht, solange du hingesehen hast." },
          { id: "wassermarke", label: "Wasserstandsmarke", x: 65.5, y: 62.5, w: 18.5, h: 6.5, if: "koffer_gerutscht", title: "Eine Wasserstandsmarke", text: "Ein gelber Strich, darüber mit Lackstift: <b>„14.10.2009 · 23:10 – Wasserstand Kniehöhe“</b>. Sieben Minuten, bevor der Strom ausfiel, stand das Wasser hier unten schon so hoch." },
          { id: "eimer", label: "Tropfendes Rohr", x: 87, y: 74, w: 9, h: 15, title: "Ein Eimer unter dem Rohr", text: "Wasser fällt Tropfen für Tropfen in einen randvollen Eimer. Als du ihn berührst, schwappt es über deine Schuhe." },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Ausgabe", scene: sued,
        desc: "Der Ausgabetresen. Eine verschlossene Metallklappe, darunter ein schmaler Schlitz für Gepäckscheine.",
        hotspots: [
          { id: "klappe", label: "Ausgabeklappe", x: 39.2, y: 21.8, w: 21.7, h: 32, unless: "koffer_da", title: "Die Ausgabeklappe", text: "Eine genietete Stahlklappe. Darüber: <i>„Ausgabe nur gegen Gepäckschein“</i>. Darunter ein Schlitz, gerade breit genug für einen Schein.", use: "ausgabe" },
          { id: "koffer6", label: "Koffer mit blauem Schal", x: 39.2, y: 40, w: 21.7, h: 13, if: "koffer_da", title: "Der ausgegebene Koffer", text: "Ein brauner Koffer mit Kofferanhänger: <b>„M. Vale · Zimmer 217 · Nr. 6“</b>. Obenauf liegt ein blauer Wollschal. Der Koffer ist nicht verschlossen." },
          { id: "notizbuch", label: "Notizbuch", x: 42, y: 47.5, w: 6, h: 4.5, if: "koffer_da", secret: true, title: "Ein Notizbuch", text: "Ein kleines rotes Notizbuch. Du schlägst es auf.", doc: "mara_notizbuch" },
          { id: "kaefigschluessel", label: "Schlüssel", x: 54, y: 48, w: 5, h: 4, if: "koffer_da", unless: "taken_kaefigschluessel", take: "kaefigschluessel", takeText: "Unter dem Schal liegt ein kleiner, schwerer Schlüssel: „Wertgepäck – Käfig“. An der Marke ein Zettel in Elias’ Handschrift: <i>„Für M., falls du zurückkommst.“</i> Du nimmst ihn mit." },
          { id: "verzeichnis", label: "Gepäckverzeichnis", x: 65.8, y: 49, w: 14, h: 5, title: "Das Gepäckverzeichnis", text: "Wasserflecken haben die Tinte verlaufen lassen. Ein paar Zeilen sind noch lesbar.", doc: "verzeichnis_reste" },
          { id: "klingel3", label: "Tischklingel", x: 22.5, y: 48, w: 6, h: 5.5, title: "Die Tischklingel", text: "<i>Ding.</i> Der Ton verklingt ungewöhnlich lange im Beton. Niemand antwortet.", sound: "bell" },
          { id: "papierkorb", label: "Papierkorb", x: 87.5, y: 72, w: 9, h: 16, title: "Der Papierkorb", text: "Zwischen alten Quittungen liegen fünf schmale Papierstreifen – eine zerrissene Notiz.", lock: "schnipsel" },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Gitterkäfig", scene: west,
        desc: "Ein Gitterkäfig „Wertgepäck“. Darin steht eine schwere Holztruhe.",
        hotspots: [
          { id: "kaefigtuer", label: "Käfigtür", x: 43.3, y: 17.8, w: 15, h: 70, unless: "kaefig_offen", title: "Die Käfigtür", text: "Die Gittertür ist mit einem Kastenschloss gesichert. Durch die Stäbe siehst du eine Truhe; in den Deckel ist etwas eingebrannt, aber von hier nicht lesbar.", use: "kaefig" },
          { id: "truhe", label: "Truhe", x: 37.5, y: 57, w: 25, h: 27, if: "kaefig_offen", title: "Die Truhe", lock: "truhe" },
          { id: "kaefig_seite", label: "Gitterkäfig", x: 21, y: 18, w: 18, h: 70, title: "Der Gitterkäfig", text: "Dicke Stäbe, tief im Beton verankert. Hier kommt niemand ohne Schlüssel hinein." },
        ],
      },
    ],
    events: [
      {
        id: "pegel", view: "ost", ifSolved: "truhe", delay: 700,
        actions: [{ flag: "koffer_gerutscht" }, { sound: "drop" }],
        narrate: "Ein Scharren, dann ein dumpfer Schlag: Der schwarze Koffer ist vom Regal gerutscht. Dahinter wird an der Wand eine gelbe Markierung sichtbar.",
      },
    ],
    puzzles: {
      ausgabe: {
        type: "use", item: "gepaeckschein", title: "Ausgabeklappe", quiet: true,
        wrongItem: "Der Schlitz ist nur so breit wie ein Gepäckschein.",
        noItems: "Ohne Gepäckschein bleibt die Klappe zu.",
        objective: "Lass dir an der Ausgabe dein Gepäck aushändigen.",
        hints: [
          "Hier wird Gepäck nur gegen einen Nachweis ausgegeben.",
          "Den passenden Schein hast du in Zimmer 217 unter dem Bett gefunden.",
          "Benutze den Gepäckschein Nr. 6 am Schlitz der Ausgabeklappe im Süden.",
        ],
        success: "Der Schein verschwindet im Schlitz. Ein mechanisches Klicken – dann Stille.",
        onSolve: [
          { remove: "gepaeckschein" }, { sound: "key" },
          { later: { ms: 2200, actions: [{ sound: "rumble" }, { flag: "koffer_da" }, { sound: "steps_far" }, { message: "m_schal" }],
            narrate: "Hinter der Wand setzt sich etwas Schweres in Bewegung. Die Metallklappe hebt sich knarrend, ein Koffer rollt aus dem Schacht. Für einen Moment hörst du Schritte auf der anderen Seite der Wand. Dann ist es still." } },
        ],
      },
      kaefig: {
        type: "use", step: true, item: "kaefigschluessel", title: "Käfigtür", quiet: true,
        wrongItem: "Das passt nicht in das Kastenschloss.",
        noItems: "Ohne Schlüssel bleibt der Käfig zu.",
        objective: "Öffne den Gitterkäfig.",
        hints: [
          "Im ausgegebenen Koffer lag ein weiterer Schlüssel.",
          "Der Schlüssel ist für den Gitterkäfig im Westen bestimmt.",
          "Benutze den Käfigschlüssel an der Käfigtür.",
        ],
        success: "Der Schlüssel dreht sich nur mit Mühe. Das Schloss gibt mit einem dumpfen metallischen Klicken nach, die Gittertür schwingt auf. Dahinter steht eine schwere Holztruhe.",
        onSolve: [{ flag: "kaefig_offen" }, { sound: "gate" }],
      },
      truhe: {
        type: "code", length: 4, title: "Die Truhe",
        prompt: "Ein vierstelliges Zahlenschloss. In den Deckel ist eingebrannt: <i>„Ihre Anhänger – in der Reihenfolge, in der sie ankamen.“</i>",
        answers: ["2694"],
        wrong: {
          "2469": "Das ist nur die Reihenfolge der Anhängernummern. Die Truhe fragt nach der Ankunft.",
          "2964": "Nach Zimmernummern sortiert? Die Truhe will wissen, wer zuerst ankam.",
          "4962": "Genau umgekehrt.",
        },
        objective: "Öffne die Truhe im Gitterkäfig.",
        hints: [
          "Die Uhrzeiten fehlen hier – aber du hast sie schon einmal gesehen. Es zählen nur die vier Gäste mit Wertgepäck.",
          "Im Gästeregister in deiner Akte stehen Berger 20:14, Vale 21:17, Winter 21:31 und Stern 22:08. Ordne jedem Gast sein Gepäckstück zu.",
          "Schachfigur 2 · Schal 6 · Notenblatt 9 · Kompass 4. In Ankunftsreihenfolge lautet der Code 2694.",
        ],
        success: "Das Schloss springt auf, der schwere Deckel knarrt nach oben. Darin liegen ein Bündel Papiere und ein langer Bartschlüssel.",
        onSolve: [{ flag: "truhe_offen" }, { doc: "gepaeckverzeichnis" }, { give: "archivschluessel" }, { message: "m_name" }],
      },
      schnipsel: {
        type: "sort", title: "Die zerrissene Notiz",
        prompt: "Fünf Papierstreifen in einer vertrauten Handschrift. Die Risskanten passen nur in einer Reihenfolge aufeinander.",
        items: [
          { id: "s1", text: "Band Kamera 3 gesichert." },
          { id: "s2", text: "Liegt im Archiv, Fach W." },
          { id: "s3", text: "Lehn darf es nie finden." },
          { id: "s4", text: "Ich bin erst zurück, als alle draußen waren." },
          { id: "s5", text: "– E." },
        ],
        answer: ["s1", "s2", "s3", "s4", "s5"],
        start: ["s3", "s5", "s1", "s4", "s2"],
        objective: "Setze die zerrissene Notiz aus dem Papierkorb zusammen.",
        hints: [
          "Im Papierkorb ist mehr als Müll.",
          "Die Streifen passen an den Risskanten zusammen. Achte darauf, dass die Zeilen durchgehend Sinn ergeben.",
          "Reihenfolge: „Band Kamera 3 gesichert“ → „Liegt im Archiv, Fach W“ → „Lehn darf es nie finden“ → „Ich bin erst zurück, als alle draußen waren“ → „– E.“",
        ],
        success: "Die Kanten greifen ineinander. Elias’ Handschrift, hastig, aber klar lesbar.",
        onSolve: [{ doc: "elias_notiz" }],
      },
      archivtuer: {
        type: "use", step: true, item: "archivschluessel", title: "Archivtür",
        wrongItem: "Der passt nicht in dieses Bartschloss.",
        noItems: "Du hast keinen passenden Schlüssel.",
        objective: "Öffne die Archivtür auf dem Treppenabsatz.",
        hints: [
          "Der Schlüssel aus der Truhe muss zu einer Tür in diesem Bereich gehören.",
          "Auf dem Treppenabsatz im Norden befindet sich eine Tür mit der Aufschrift ARCHIV.",
          "Benutze den Archivschlüssel an der Archivtür im Norden.",
        ],
        success: "Der Schlüssel dreht sich schwer im Schloss. Hinter dem Milchglas geht ein schwaches Licht an. Es riecht nach altem Papier und Staub.",
        // Die Tür schaltet das Archiv selbst frei – so entsteht keine Sackgasse, falls die Notiz noch fehlt.
        onSolve: [{ flag: "archiv_offen" }, { sound: "door" }, { unlock: "archiv" }],
      },
    },
    completeWhen: ["truhe", "schnipsel", "archivtuer"],
  });
})();
