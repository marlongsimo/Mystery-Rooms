/*
 * STATION 4 – DAS HOTELARCHIV (Erdgeschoss, Verwaltung)
 * Umsetzung des überarbeiteten Raum-4-Konzepts (siehe RAETSELDESIGN.md).
 * 3 Haupträtsel (Chiffre + Schreibtischfach, Echt oder gefälscht, Fach W) und 1 Übergang (PIN-Tür).
 */
(() => {
  const N = window.NOCTURNE;
  const scene = N.svgScene;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    backupband: { name: "Backup-Band Kamera 3", icon: "▣", text: "Eine Videokassette. Etikett: „KAMERA 3 – INNENHOF · 14.10.2009 – BACKUP“. In Elias’ Handschrift." },
  });

  /* ---------- Nachrichten ---------- */
  Object.assign(N.messages, {
    m_lehn: { from: "Unbekannte Nummer", text: "Lehn hat nach jener Nacht alles verschwinden lassen, was ihm schaden konnte. Fast alles." },
    m_band: { from: "Unbekannte Nummer", text: "Siebzehn Jahre. Und es lag die ganze Zeit hier." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    tomasz_brief: {
      title: "Brief von Tomasz an Elias", kind: "letter", pageLabels: ["Vorderseite", "Rückseite"],
      pages: [
        `<p class="mono dim">Elias – 27.09.2009</p><p class="cipher-text">GHU ZHVWJDQJ LVW RIIHQ</p><p class="mono dim">– T.</p><p class="handwriting margin">Er liest unsere Post mit. Deshalb so.</p>`,
        `<p class="handwriting big">Tomasz war seiner Zeit<br>immer drei Schritte voraus.</p><p class="handwriting sign">– E.</p>`,
      ],
    },
    archiv_entschluesselt: { title: "Entschlüsselte Nachricht", kind: "note", html: `<p class="handwriting big">DER WESTGANG IST OFFEN</p><p class="mono dim">Brief von Tomasz an Elias, 27.09.2009 – mit der Chiffrierscheibe entschlüsselt (drei Stellen zurück).</p>` },
    archiv_bauakte: {
      title: "Bauakte „Bauliche Veränderungen – Oktober 2009“", kind: "letter",
      html: `<p class="doc-head">HOTEL NOCTURNE<br><small>BAULICHE VERÄNDERUNGEN · OKTOBER 2009</small></p>
        <p>Anweisung an die Verwaltung:</p>
        <p><b>Der westliche Servicetunnel ist nach außen hin als dauerhaft verschlossen zu dokumentieren. Eine tatsächliche Stilllegung wird nicht vorgenommen.</b></p>
        <p>Wartungskosten entfallen damit. Die Brandschutzbehörde ist entsprechend zu informieren.</p>
        <p class="handwriting sign">Viktor Lehn, Eigentümer</p>`,
    },
    protokollbuch: {
      title: "Protokollbuch 2009", kind: "register",
      html: `<p class="doc-head">PROTOKOLLBUCH<br><small>PRÜFUNGEN 2009 · AUSZUG SEPTEMBER</small></p>
        <table class="doc-table"><thead><tr><th>Nummer</th><th>Prüfgegenstand</th><th>Datum</th></tr></thead><tbody>
          <tr><td>PR-09/116</td><td>Heizung</td><td>21.09.2009</td></tr>
          <tr><td>PR-09/117</td><td>Aufzug, Jahresprüfung</td><td>28.09.2009</td></tr>
          <tr><td>PR-09/118</td><td>Servicetunnel West</td><td>28.09.2009</td></tr>
          <tr><td>PR-09/119</td><td>Notstromaggregat</td><td>29.09.2009</td></tr></tbody></table>
        <p class="mono dim">Eine nüchterne Liste. Alles wirkt ordentlich geführt.</p>`,
    },
    protokoll_a: {
      title: "Prüfprotokoll A (PR-09/117)", kind: "register",
      html: `<p class="doc-head">PRÜFPROTOKOLL<br><small>NR. PR-09/117 · 31.09.2009</small></p>
        <table class="doc-kv"><tr><th>Gegenstand</th><td>Servicetunnel West</td></tr><tr><th>Ergebnis</th><td>stillgelegt, technische Prüfung entfällt</td></tr><tr><th>Prüfer</th><td>Prüfung durch Eigentümer</td></tr></table>
        <p class="stamp">GEPRÜFT · HOTEL NOCTURNE</p><p class="handwriting sign">V. Lehn</p>`,
    },
    protokoll_b: {
      title: "Prüfprotokoll B (PR-09/118)", kind: "register",
      html: `<p class="doc-head">PRÜFPROTOKOLL<br><small>NR. PR-09/118 · 28.09.2009</small></p>
        <table class="doc-kv"><tr><th>Gegenstand</th><td>Servicetunnel West</td></tr><tr><th>Ergebnis</th><td>voll funktionsfähig. Tor W2 öffnet nur mit Notstrom.</td></tr><tr><th>Schaltfolge</th><td><b>Notstrom → Tor W2: C – A – D – B</b></td></tr><tr><th>Prüfer</th><td>Tomasz, Haustechnik</td></tr></table>
        <p class="stamp">GEPRÜFT · HOTEL NOCTURNE</p><p class="handwriting sign">Tomasz</p>`,
    },
    bauplan_1998: {
      title: "Bestandsplan 1998", kind: "plan",
      html: `<svg viewBox="0 0 600 360" class="plan-svg" role="img" aria-label="Bestandsplan 1998 mit Servicetunnel, Rampe und Tor W2">
          <text x="300" y="22" class="plan-label" style="font-size:13px">HOTEL NOCTURNE – GEGR. 1897 · BESTANDSPLAN 1998</text>
          <text x="20" y="54" class="plan-title">ERDGESCHOSS</text>
          <rect x="200" y="70" width="380" height="140" class="plan-wall"/>
          <rect x="200" y="70" width="110" height="140" class="plan-room dark"/><text x="255" y="140" class="plan-label">WESTFLÜGEL</text>
          <rect x="310" y="70" width="170" height="140" class="plan-room"/><text x="395" y="145" class="plan-label">EMPFANG</text>
          <rect x="480" y="70" width="100" height="140" class="plan-room"/><text x="530" y="145" class="plan-label">ARCHIV</text>
          <path d="M200 160 H120 L70 230 H40" fill="none" stroke="#2a2119" stroke-width="14"/><path d="M200 160 H120 L70 230 H40" fill="none" stroke="#f3ebd8" stroke-width="9"/>
          <text x="150" y="150" class="plan-small">Servicetunnel West</text><text x="110" y="210" class="plan-small">Rampe ↘</text>
          <rect x="20" y="218" width="24" height="26" fill="#8e3b36"/><text x="32" y="262" class="plan-small warn">TOR W2</text>
          <rect x="20" y="280" width="160" height="60" fill="none" stroke="#2a2119" stroke-dasharray="4 3"/><text x="100" y="315" class="plan-small">INNENHOF</text>
        </svg><p class="mono dim">Der Tunnel ist durchgehend als „in Betrieb“ eingetragen. Kein Hinweis auf eine Stilllegung.</p>`,
    },
    zettel_regel: { title: "Zettel aus Fach W", kind: "note", html: `<p class="handwriting big">Für den Sicherheitsraum gilt noch Tomasz’ alte Regel. Er hat sie nie geändert.</p><p class="handwriting sign">– E.</p>` },
    personalakten: {
      title: "Personalakten 2009", kind: "register", pageLabels: ["Greta – Küche", "Ilse – Empfang", "Tomasz – Haustechnik", "Viktor Lehn – Eigentümer"],
      pages: [
        `<p class="doc-head">GRETA<br><small>KÜCHE · SEIT 1994</small></p><p class="mono">Dienstzeiten 6–14 Uhr. Urlaubsantrag 19.–30.10.2009 – genehmigt.</p>`,
        `<p class="doc-head">ILSE<br><small>EMPFANG · SEIT 2003</small></p><p class="mono">Personalbogen mit handschriftlichen Korrekturen. Spätdienst bis 22 Uhr.</p>`,
        `<p class="doc-head">TOMASZ<br><small>HAUSTECHNIK · SEIT 1996</small></p><p class="mono">Zuständig: Heizung, Aufzug, Notstrom, Servicetunnel.</p><p class="handwriting margin">Sicherheitsraum: PIN = Gründungsjahr des Hauses.<br>(Damit es keiner vergisst.)</p>`,
        `<p class="doc-head">VIKTOR LEHN<br><small>EIGENTÜMER · SEIT 2001</small></p><p class="mono dim">Die Akte ist fast leer. Nicht einmal ein vollständiger Lebenslauf liegt darin.</p>`,
      ],
    },
    akte_elias: {
      title: "Personalakte Elias Voss", kind: "register",
      html: `<p class="doc-head">ELIAS VOSS<br><small>NACHTMANAGER · SEIT 1999</small></p>
        <p>Belobigung 2006: <b>„Für besonnenes Handeln beim Brandalarm im Ostflügel – alle Gäste unversehrt evakuiert.“</b></p>
        <p class="handwriting margin">Er hat es wieder getan.</p>`,
    },
  });

  /* ---------- Archiv-Grundgerüst: dunkles Holz, Bücherluft ---------- */
  const archiv = (p, body) => scene(p, `<rect width="1200" height="612" fill="#1a1712" opacity=".55"/>${body}`);

  /* ---------- NORD: Eingang, Wandregal, Lesetisch ---------- */
  const binders = () => {
    const cols = ["#4a1f1c", "#243330", "#54432b", "#33251c", "#2c3a33", "#5b4a2f", "#3a2a22", "#4a3424", "#2a2a3a"];
    let out = "";
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const x = 500 + i * 52, y = 166 + row * 150, h = 120 - ((i * 7 + row * 5) % 18);
      const thin = row === 2 && i === 8;
      out += `<rect x="${x}" y="${y + 120 - h}" width="${thin ? 18 : 44}" height="${h}" fill="${cols[(i + row * 2) % 9]}"/>`;
      out += `<rect x="${x + 6}" y="${y + 130 - h}" width="${thin ? 8 : 32}" height="14" fill="#cdbd9b" opacity=".55"/>`;
      if (row === 2) out += `<text x="${x + (thin ? 9 : 22)}" y="${y + 141 - h}" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="9">${2001 + i}</text>`;
    }
    return out;
  };
  const nord = archiv("an", `
  <g>
    <rect x="150" y="190" width="220" height="600" fill="#0a0807"/>
    <g data-unless="archiv_ereignis"><rect x="160" y="200" width="200" height="590" fill="#050404"/><rect x="170" y="600" width="180" height="20" fill="#2c2822"/><rect x="180" y="650" width="160" height="22" fill="#2f2b24"/>
      <polygon points="160,200 112,222 112,768 160,790" fill="#2a2016" stroke="#4d3826" stroke-width="2"/><polygon points="122,250 150,238 150,520 122,532" fill="#c9d1cf" opacity=".22"/></g>
    <g data-if="archiv_ereignis"><rect x="160" y="200" width="200" height="590" fill="#2a2016" stroke="#4d3826" stroke-width="2"/><rect x="180" y="230" width="160" height="260" fill="#c9d1cf" opacity=".2"/>
      <text x="260" y="370" text-anchor="middle" fill="#d6dcda" opacity=".6" font-family="DM Mono, monospace" font-size="15" letter-spacing="4">ARCHIV</text><rect x="330" y="500" width="10" height="28" rx="3" fill="url(#an-brass)"/></g>
  </g>
  <g><rect x="480" y="140" width="510" height="470" fill="#1d150e"/><g fill="#3b2b1e"><rect x="480" y="286" width="510" height="10"/><rect x="480" y="436" width="510" height="10"/><rect x="480" y="586" width="510" height="12"/></g>${binders()}
    <g data-unless="archiv_ereignis"><rect x="960" y="470" width="24" height="116" fill="#7a2a24"/><text x="972" y="530" text-anchor="middle" fill="#e6dcc3" font-family="DM Mono, monospace" font-size="8" transform="rotate(-90 972 530)">PROTOKOLLE 2009</text></g></g>
  <g><rect x="560" y="660" width="340" height="20" fill="#4a3424"/><rect x="580" y="680" width="16" height="100" fill="#2a1d14"/><rect x="864" y="680" width="16" height="100" fill="#2a1d14"/>
    <rect x="650" y="644" width="160" height="16" fill="none" stroke="#6b5a44" stroke-dasharray="3 3" opacity=".5" data-unless="archiv_ereignis"/>
    <g data-if="archiv_ereignis"><polygon points="650,660 730,652 730,630 656,636" fill="#e3d4b4"/><polygon points="810,660 730,652 730,630 804,636" fill="#d8c8a6"/><line x1="730" y1="630" x2="730" y2="654" stroke="#7a2a24" stroke-width="3"/></g></g>
  `);

  /* ---------- OST: Schreibtisch ---------- */
  const ost = archiv("ao", `
  <ellipse cx="300" cy="470" rx="320" ry="240" fill="url(#ao-glow)" class="flicker"/>
  <rect x="180" y="520" width="840" height="26" fill="#4a3424"/><rect x="200" y="546" width="800" height="230" fill="url(#ao-wood)"/>
  <rect x="520" y="560" width="280" height="90" fill="#2a1d14" stroke="#5a412b" stroke-width="2"/>
  <text x="660" y="582" text-anchor="middle" fill="#a8875a" font-family="Playfair Display, serif" font-style="italic" font-size="16">Wohin?</text>
  <g data-unless="fach_offen">${Array.from({ length: 8 }, (_, i) => `<rect x="${548 + i * 29}" y="596" width="22" height="36" rx="2" fill="#120e0b" stroke="url(#ao-brass)" stroke-width="1.5"/>`).join("")}</g>
  <g data-if="fach_offen"><rect x="514" y="566" width="292" height="96" fill="#3a2a1e" stroke="#5a412b" stroke-width="2"/><rect x="530" y="576" width="260" height="24" fill="#0a0807"/><rect x="560" y="572" width="80" height="18" fill="#e6dcc3"/></g>
  <g><rect x="254" y="400" width="14" height="120" fill="url(#ao-brass)"/><polygon points="210,404 312,404 290,350 232,350" fill="#2f4a3e" stroke="#1a2a22"/><ellipse cx="261" cy="520" rx="40" ry="6" fill="url(#ao-brass)"/></g>
  <g><rect x="390" y="452" width="170" height="68" rx="8" fill="#1f1c19" stroke="#3a3530" stroke-width="2"/><rect x="410" y="420" width="130" height="38" fill="#e8dfc8"/><line x1="420" y1="436" x2="510" y2="436" stroke="#3a3a3a" stroke-width="1.5"/>
    <g fill="#3a3530">${Array.from({ length: 10 }, (_, i) => `<circle cx="${408 + i * 15}" cy="${490 + (i % 2) * 10}" r="5"/>`).join("")}</g></g>
  <g><rect x="610" y="500" width="110" height="22" fill="#efe6d2" transform="rotate(-3 665 511)"/><g stroke="#3a3a7a" stroke-width="1.4" transform="rotate(-3 665 511)"><line x1="620" y1="508" x2="700" y2="508"/><line x1="620" y1="515" x2="690" y2="515"/></g></g>
  <g><circle cx="810" cy="498" r="42" fill="url(#ao-brass)" stroke="#3a2c1b" stroke-width="2"/><circle cx="810" cy="498" r="28" fill="#8a6e45" stroke="#3a2c1b"/><circle cx="810" cy="498" r="10" fill="#3a2c1b"/>
    <g fill="#2a1d14" font-family="DM Mono, monospace" font-size="8" text-anchor="middle"><text x="810" y="464">A</text><text x="846" y="501">G</text><text x="810" y="538">N</text><text x="774" y="501">T</text></g></g>
  <rect x="880" y="430" width="90" height="90" fill="#2a1d14" opacity=".9"/><g fill="#cdbd9b" opacity=".6"><rect x="890" y="440" width="70" height="8"/><rect x="890" y="456" width="70" height="8"/><rect x="890" y="472" width="70" height="8"/></g>
  `);

  /* ---------- SÜD: Aktenschrank ---------- */
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const drawers = () => ABC.split("").map((c, i) => {
    const x = 320 + (i % 6) * 92, y = 280 + Math.floor(i / 6) * 92, w = c === "W";
    return `<g${w ? ' data-unless="fachw_offen"' : ""}><rect x="${x}" y="${y}" width="86" height="86" fill="#2f2620" stroke="#4d3826" stroke-width="2"/><rect x="${x + 28}" y="${y + 50}" width="30" height="8" rx="3" fill="url(#as-brass)"/><rect x="${x + 30}" y="${y + 14}" width="26" height="22" fill="#cdbd9b" opacity=".75"/><text x="${x + 43}" y="${y + 31}" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="14">${c}</text>${w ? `<g stroke="#d9c8a0" stroke-width="1.2" opacity=".8"><line x1="${x + 24}" y1="${y + 62}" x2="${x + 34}" y2="${y + 68}"/><line x1="${x + 52}" y1="${y + 60}" x2="${x + 62}" y2="${y + 70}"/><line x1="${x + 40}" y1="${y + 64}" x2="${x + 46}" y2="${y + 72}"/></g>` : ""}</g>`;
  }).join("");
  const sued = archiv("as", `
  <rect x="300" y="262" width="580" height="500" fill="#1d150e" stroke="#3b2b1e" stroke-width="6"/>${drawers()}
  <g data-if="fachw_offen"><rect x="688" y="556" width="86" height="86" fill="#0a0807"/><polygon points="676,600 786,600 800,660 662,660" fill="#3a2a1e" stroke="#5a412b" stroke-width="2"/><rect x="700" y="610" width="40" height="22" fill="#1a1918"/></g>
  <rect x="872" y="556" width="0" height="0"/>
  <g><rect x="420" y="196" width="280" height="66" fill="#6b5a44" stroke="#3a2c1b" stroke-width="2"/><text x="560" y="236" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="13" letter-spacing="2">PERSONAL 2009</text>
    <g fill="#d8cdb6"><rect x="440" y="182" width="40" height="16"/><rect x="490" y="186" width="40" height="12"/><rect x="540" y="180" width="40" height="18"/><rect x="590" y="186" width="40" height="12"/><rect x="640" y="184" width="40" height="14"/></g></g>
  <g><rect x="720" y="236" width="160" height="22" fill="#cfc3a6" transform="rotate(-4 800 247)"/><text x="800" y="252" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="10" transform="rotate(-4 800 247)">VOSS, E.</text></g>
  `);

  /* ---------- WEST: Planschrank und Stahltür ---------- */
  const west = archiv("aw", `
  <rect x="150" y="520" width="500" height="260" fill="url(#aw-wood)" stroke="#3b2b1e" stroke-width="3"/>
  <g fill="none" stroke="#4d3826" stroke-width="2"><rect x="170" y="545" width="460" height="50"/><rect x="170" y="605" width="460" height="50"/><rect x="170" y="665" width="460" height="60"/></g>
  <g fill="url(#aw-brass)"><rect x="380" y="564" width="40" height="8" rx="3"/><rect x="380" y="624" width="40" height="8" rx="3"/></g>
  <g data-unless="planlade_offen"><rect x="380" y="688" width="40" height="8" rx="3" fill="url(#aw-brass)"/><circle cx="440" cy="692" r="7" fill="#120e0b" stroke="url(#aw-brass)" stroke-width="2"/></g>
  <g data-if="planlade_offen"><polygon points="160,660 640,660 670,740 130,740" fill="#3a2a1e" stroke="#5a412b" stroke-width="2"/><rect x="200" y="672" width="380" height="40" fill="#e8dec6" transform="rotate(-1 390 692)"/><g stroke="#6c5a44" stroke-width="1.5"><line x1="220" y1="684" x2="560" y2="684"/><line x1="220" y1="696" x2="480" y2="696"/></g></g>
  <g><rect x="200" y="496" width="110" height="26" fill="#efe6d2" transform="rotate(-4 255 509)"/><text x="255" y="514" text-anchor="middle" fill="#3a2a1e" font-family="DM Mono, monospace" font-size="11" transform="rotate(-4 255 509)">A · 117</text>
    <rect x="330" y="498" width="110" height="26" fill="#efe6d2" transform="rotate(3 385 511)"/><text x="385" y="516" text-anchor="middle" fill="#3a2a1e" font-family="DM Mono, monospace" font-size="11" transform="rotate(3 385 511)">B · 118</text></g>
  <g>
    <rect x="740" y="190" width="290" height="610" fill="#0a0807"/>
    <g data-unless="sicherheit_offen"><rect x="752" y="202" width="266" height="598" fill="#4a4a44" stroke="#2a2a26" stroke-width="3"/><g fill="#5d5d56"><circle cx="770" cy="220" r="5"/><circle cx="1000" cy="220" r="5"/><circle cx="770" cy="780" r="5"/><circle cx="1000" cy="780" r="5"/></g>
      <rect x="980" y="480" width="16" height="60" rx="5" fill="#2a2a26"/></g>
    <g data-if="sicherheit_offen"><rect x="752" y="202" width="266" height="598" fill="#050505"/><g fill="#1d1d1a"><rect x="770" y="700" width="230" height="16"/><rect x="790" y="650" width="200" height="14"/><rect x="810" y="604" width="170" height="12"/></g><polygon points="752,202 700,226 700,776 752,800" fill="#4a4a44" stroke="#2a2a26" stroke-width="3"/></g>
    <rect x="770" y="140" width="230" height="36" fill="#cdbd9b" opacity=".75"/><text x="885" y="155" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="10">SICHERHEITSBEREICH UG</text><text x="885" y="169" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="9">ZUTRITT NUR PERSONAL</text>
    <rect x="1050" y="430" width="60" height="96" rx="6" fill="#1a1a18" stroke="#5d5d56" stroke-width="2"/><rect x="1060" y="440" width="40" height="16" fill="#0b2a1e"/><g fill="#3d3d38">${Array.from({ length: 9 }, (_, i) => `<rect x="${1060 + (i % 3) * 14}" y="${462 + Math.floor(i / 3) * 18}" width="11" height="14" rx="2"/>`).join("")}</g>
    <circle cx="1080" cy="515" r="3" fill="#a3473c" data-unless="sicherheit_offen"/><circle cx="1080" cy="515" r="3" fill="#7fa36d" data-if="sicherheit_offen"/>
  </g>
  `);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "archiv",
    name: "Hotelarchiv",
    title: "Das Hotelarchiv",
    kicker: "ERDGESCHOSS / VERWALTUNG",
    story: "Trocken und still – der erste Raum ohne Regen. Regale bis unter die Decke, Staub im Lampenlicht. Die Schreibtischlampe brennt bereits.",
    ambient: "hum",
    exitLabel: "Hinab in den Sicherheitsbereich",
    exitVia: "door",
    views: [
      {
        id: "nord", dir: "NORD", name: "Eingang", scene: nord,
        desc: "Die Milchglastür zum Gepäcklager, ein hohes Regal mit Jahresordnern und ein kleiner Lesetisch.",
        hotspots: [
          { id: "archiv_eingang", label: "Zurück zum Gepäcklager", x: 12.5, y: 21, w: 18.3, h: 66.7, go: "gepaecklager", via: "door" },
          { id: "jahresordner", label: "Jahresordner", x: 40, y: 16, w: 38, h: 50, title: "Jahresordner 2001–2009", text: "Ordentlich beschriftete Ordner, Jahr für Jahr. Nur der Ordner <b>2009</b> ist auffallend dünn. Jemand hat hier aussortiert." },
          { id: "protokollbuch_regal", label: "Protokollbuch 2009", x: 80, y: 52, w: 3, h: 13, unless: "archiv_ereignis", title: "Das Protokollbuch 2009", text: "Ein rot gebundenes Buch mit allen Prüfungen des Jahres.", doc: "protokollbuch" },
          { id: "lesetisch", label: "Lesetisch", x: 46.7, y: 72, w: 28.3, h: 8, title: "Der Lesetisch", text: "Im Staub zeichnet sich ein Rechteck ab: Hier hat lange ein Buch gelegen.", unless: "archiv_ereignis" },
          { id: "protokollbuch_tisch", label: "Aufgeschlagenes Buch", x: 53, y: 68, w: 15, h: 6, if: "archiv_ereignis", title: "Das Protokollbuch – aufgeschlagen", text: "Eben stand es noch im Regal. Jetzt liegt es aufgeschlagen auf dem Lesetisch, bei <b>PR-09/117 – Aufzug, Jahresprüfung</b>. Die Milchglastür hinter dir ist zugefallen.", doc: "protokollbuch" },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Schreibtisch", scene: ost,
        desc: "Ein schwerer Schreibtisch unter der brennenden Lampe: Schreibmaschine, ein Brief, eine Chiffrierscheibe aus Messing.",
        hotspots: [
          { id: "leselampe", label: "Leselampe", x: 17, y: 38, w: 10, h: 20, title: "Die Leselampe", text: "Grünes Glas, Messingfuß. Der Schirm ist noch warm." },
          { id: "schreibmaschine", label: "Schreibmaschine", x: 32, y: 46, w: 15, h: 12, title: "Die Schreibmaschine", text: "Ein Blatt ist eingespannt: <i>„Hiermit kündige ich zum –“</i>. Der Satz bricht ab. Kein Name." },
          { id: "brief_tomasz", label: "Brief", x: 50.8, y: 54.4, w: 9.5, h: 4.5, title: "Ein Brief", text: "Ein Brief ohne lesbare Wörter. Auf der Rückseite steht etwas in einer anderen Handschrift.", doc: "tomasz_brief" },
          { id: "chiffrierscheibe", label: "Chiffrierscheibe", x: 63.9, y: 50.6, w: 7.2, h: 9.8, title: "Die Chiffrierscheibe", lock: "chiffre" },
          { id: "schreibtischfach", label: "Schreibtischfach", x: 43.3, y: 62.2, w: 23.3, h: 10, title: "Das Schreibtischfach", lock: "fach" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Aktenschrank", scene: sued,
        desc: "Ein Aktenschrank mit 26 Schubladen von A bis Z. Obendrauf ein Karton „Personal 2009“.",
        hotspots: [
          { id: "aktenschrank", label: "Aktenschrank", x: 25, y: 29, w: 49, h: 56, title: "Der Aktenschrank", text: "Lieferanten, Rechnungen, Versicherungen – Schublade für Schublade. Nur <b>W</b> klemmt." },
          { id: "schublade_w", label: "Schublade W", x: 57.3, y: 61.8, w: 7.2, h: 9.6, unless: "fachw_offen", title: "Schublade W", text: "Sie bewegt sich keinen Millimeter. Am Griff sind frische Kratzspuren – jemand hat es vor dir versucht.", use: "fachw" },
          { id: "personalkasten", label: "Personal 2009", x: 35, y: 20, w: 23.3, h: 9, title: "Karton „Personal 2009“", text: "Vier Personalakten stehen im Karton.", doc: "personalakten" },
          { id: "akte_elias", label: "Akte „Voss, E.“", x: 60, y: 25.5, w: 13.3, h: 4, secret: true, title: "Eine einzelne Akte", text: "Sie liegt quer auf dem Karton, als hätte jemand sie herausgenommen und nicht zurückgelegt.", doc: "akte_elias" },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Planschrank", scene: west,
        desc: "Ein flacher Planschrank mit zwei Prüfprotokollen obenauf. Daneben eine Stahltür mit Zahlenfeld.",
        hotspots: [
          { id: "planschrank", label: "Planschrank", x: 12.5, y: 58.5, w: 41.7, h: 28, title: "Der Planschrank", lock: "pruefung" },
          { id: "protokoll_a", label: "Protokoll A", x: 16.5, y: 54.2, w: 9.2, h: 4, title: "Prüfprotokoll A", doc: "protokoll_a" },
          { id: "protokoll_b", label: "Protokoll B", x: 27.5, y: 54.2, w: 9.2, h: 4, title: "Prüfprotokoll B", doc: "protokoll_b" },
          { id: "stahltuer", label: "Stahltür", x: 61.7, y: 21, w: 31, h: 68, unless: "sicherheit_offen", title: "Die Stahltür", text: "„Sicherheitsbereich UG – Zutritt nur Personal“. Daneben ein Zahlenfeld mit rotem Lämpchen.", lock: "pin" },
          { id: "stahltuer_offen", label: "Hinab in den Sicherheitsbereich", x: 61.7, y: 21, w: 31, h: 68, if: "sicherheit_offen", go: "ueberwachung", via: "door" },
        ],
      },
    ],
    events: [
      {
        id: "besuch", view: "nord", ifSolved: "pruefung", delay: 700,
        actions: [{ flag: "archiv_ereignis" }, { sound: "door" }],
        narrate: "Die Milchglastür ist zu – dabei stand sie eben noch offen. Und auf dem Lesetisch liegt jetzt ein aufgeschlagenes Buch.",
      },
    ],
    puzzles: {
      chiffre: {
        type: "cipher", shift: 3, probe: "G", title: "Die Chiffrierscheibe",
        prompt: "Zwei Messingringe. Der Brief auf dem Schreibtisch lautet: <b>GHU ZHVWJDQJ LVW RIIHQ</b>.",
        wrongShift: { 23: "Falsche Richtung: So verschlüsselt man – zum Lesen musst du zurückgehen." },
        objective: "Entschlüssle den Brief auf dem Schreibtisch.",
        hints: [
          "Der Brief verwendet eine alte Methode, bei der Buchstaben verschoben werden. Auf dem Schreibtisch liegt ein Werkzeug dafür.",
          "Die Rückseite des Briefs verrät die Anzahl der Schritte. Die Verschlüsselung verschiebt nach vorne – zum Lesen gehst du zurück: Aus G wird D.",
          "Drehe den inneren Ring auf Stellung 3 (G → D) und prüfe: DER WESTGANG IST OFFEN.",
        ],
        success: "Buchstabe für Buchstabe ergibt sich ein Satz: <b>DER WESTGANG IST OFFEN</b>.",
        onSolve: [{ doc: "archiv_entschluesselt" }],
      },
      fach: {
        type: "wheels", length: 8, title: "Das Schreibtischfach",
        prompt: "Acht Buchstabenräder. Darüber ist ein einziges Wort ins Holz geschnitzt: <i>„Wohin?“</i>",
        answers: ["WESTGANG"],
        wrong: { OFFENIST: "Das ist kein Ort.", ZHVWJDQJ: "Das ist noch der verschlüsselte Begriff." },
        wrongDefault: "Die Räder stehen nicht richtig. Wohin wollte Tomasz Elias führen?",
        objective: "Öffne das Schreibtischfach.",
        hints: [
          "Das Fach fragt nach einem Ort. Der Brief auf dem Schreibtisch nennt einen – sobald man ihn lesen kann.",
          "Entschlüssle den Brief mit der Chiffrierscheibe. Der Satz nennt einen Weg mit acht Buchstaben.",
          "WESTGANG.",
        ],
        success: "Die Räder rasten ein, das Fach springt auf. Darin: eine dünne Akte mit Lehns Unterschrift.",
        onSolve: [{ solve: "chiffre" }, { flag: "fach_offen" }, { doc: "archiv_bauakte" }, { evidence: "archiv_bauakte" }, { message: "m_lehn" }],
      },
      pruefung: {
        type: "choice", title: "Echt oder gefälscht?", button: "Urteil abgeben",
        prompt: "Zwei Prüfprotokolle zum selben Tunnel – sie können nicht beide stimmen. Vergleiche sie mit dem Protokollbuch.",
        steps: [
          { question: "Welches Prüfprotokoll ist gefälscht?", pick: 1, options: [{ id: "A", label: "Protokoll A (PR-09/117, V. Lehn)" }, { id: "B", label: "Protokoll B (PR-09/118, Tomasz)" }], answer: ["A"],
            wrong: "Tomasz’ Angaben passen zu allem, was du bisher weißt. Sieh dir das andere Protokoll genauer an." },
          { question: "Welche zwei Belege beweisen die Fälschung?", pick: 2,
            options: [{ id: "datum", label: "Datum" }, { id: "nummer", label: "Protokollnummer" }, { id: "unterschrift", label: "Fehlende Unterschrift" }, { id: "stempel", label: "Fehlender Prüfstempel" }, { id: "papier", label: "Anderes Briefpapier" }],
            answer: ["datum", "nummer"], feedback: { 0: "Keiner deiner beiden Belege erklärt die Widersprüche.", 1: "Einer deiner Belege trägt, der andere nicht." } },
        ],
        objective: "Finde heraus, welches Prüfprotokoll gefälscht ist.",
        hints: [
          "Vergleiche Nummern und Daten der beiden Protokolle mit den Einträgen im Protokollbuch (Regal im Norden).",
          "Wie viele Tage hat der September? Und welcher Prüfgegenstand gehört laut Protokollbuch zur Nummer PR-09/117?",
          "Protokoll A ist gefälscht. Belege: Das Datum 31.09. existiert nicht, und PR-09/117 gehört zur Aufzugsprüfung.",
        ],
        success: "Mit einem Klicken springt das Schloss der unteren Planschublade auf. Darin liegt ein großer, vergilbter Bauplan.",
        onSolve: [{ flag: "planlade_offen" }, { doc: "bauplan_1998" }, { evidence: "protokoll_b" }, { evidence: "bauplan_1998" }, { sound: "open" }],
      },
      fachw: {
        type: "use", item: "schraubendreher", title: "Schublade W",
        wrongItem: "Damit bekommst du die Schublade nicht auf.",
        noItems: "Mit bloßen Händen geht es nicht – du brauchst Werkzeug.",
        objective: "Öffne Fach W im Aktenschrank.",
        hints: [
          "Die zerrissene Notiz aus dem Gepäcklager nennt einen bestimmten Ort im Archiv.",
          "Im Aktenschrank (Süden) klemmt die Schublade W. Du hast Werkzeug dabei.",
          "Benutze den Schraubendreher an Schublade W.",
        ],
        success: "Das Holz gibt mit einem kurzen Knacken nach. In der Schublade: eine Videokassette und ein gefalteter Zettel.",
        onSolve: [{ flag: "fachw_offen" }, { sound: "drop" }, { give: "backupband" }, { evidence: "backupband" }, { doc: "zettel_regel" }, { message: "m_band" }],
      },
      pin: {
        type: "code", length: 4, title: "Zahlenfeld",
        prompt: "Ein Zahlenfeld mit vier Stellen. Darunter, in Tomasz’ Handschrift auf einem Klebestreifen: <i>„Wie immer.“</i>",
        answers: ["1897"],
        wrong: { "2009": "Das Jahr der Nacht – nicht das Jahr des Hauses.", "1998": "Das Jahr des Plans – nicht das Jahr des Hauses." },
        objective: "Öffne die Stahltür zum Sicherheitsbereich.",
        hints: [
          "Elias’ Zettel aus Fach W verweist auf Tomasz. Seine alte Regel steht in der Personalakte im Karton „Personal 2009“.",
          "Gesucht ist das Gründungsjahr des Hotels. Es steht auf deiner Reservierung und auf dem Bauplan von 1998.",
          "Die PIN lautet 1897.",
        ],
        success: "Ein kurzes grünes Licht. Das Schloss zieht sich mit einem schweren metallischen Klicken zurück. Dahinter führt eine schmale Treppe ins Untergeschoss.",
        // Die PIN funktioniert jederzeit; der Raum gilt aber erst mit Fach W als abgeschlossen.
        onSolve: [{ flag: "sicherheit_offen" }, { sound: "door" }, { unlock: "ueberwachung" }],
      },
    },
    completeWhen: ["fach", "pruefung", "fachw", "pin"],
  });
})();
