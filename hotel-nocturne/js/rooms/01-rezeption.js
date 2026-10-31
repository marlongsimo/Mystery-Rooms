/*
 * STATION 1 – DIE REZEPTION
 * Musterraum mit vier Blickrichtungen. Vorlage für alle weiteren Räume.
 *
 * Aufbau eines Raums:
 *   views        – vier Blickrichtungen (Szene 1200 × 900, Hotspots in Prozent).
 *                  dark: {x,y,w,h} = Bereich, der nur mit Taschenlampe sichtbar ist.
 *   hotspot      – text | doc | lock (Rätsel) | use (Gegenstand benutzen) | take (mitnehmen) | go (Tür)
 *                  if / unless: nur sichtbar, wenn ein Zustand (nicht) gesetzt ist.
 *                  Sonderzustand "licht" = Taschenlampe ist an.
 *   puzzles      – Rätsel mit drei Hinweisstufen; Reihenfolge = Reihenfolge der Ziele.
 *   completeWhen – Rätsel, die den nächsten Raum freischalten.
 *   SVG-Elemente mit data-if / data-unless reagieren ebenfalls auf den Spielzustand.
 */
(() => {
  const N = window.NOCTURNE;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    key217: { name: "Schlüssel 217", icon: "⚿", text: "Ein schwerer Messingschlüssel. Auf dem Anhänger ist „217“ eingeprägt, auf der Rückseite klein: „gilt auch für den Aufzug“." },
    hotelplan: { name: "Hotelplan", icon: "▦", text: "Ein gefalteter Gebäudeplan des Hotel Nocturne, Stand 2009. Er ist jetzt auch in der Karten-App deines Telefons gespeichert.", doc: "hotelplan" },
    schraubendreher: { name: "Schraubendreher", icon: "⚒", text: "Ein alter Schraubendreher mit rotem Holzgriff. In den Griff sind die Buchstaben „E.V.“ geritzt." },
  });

  /* ---------- Nachrichten aufs Telefon ---------- */
  N.messages = Object.assign(N.messages || {}, {
    m_start: { from: "Unbekannte Nummer", text: "Willkommen zurück im Hotel Nocturne. Ihr Zimmer ist vorbereitet. Der Schlüssel liegt bereit – Sie müssen ihn nur finden." },
    m_licht: { from: "Unbekannte Nummer", text: "Sie haben den Schlüssel. Gut. Manche Dinge in diesem Haus sieht man allerdings nur, wenn man selbst Licht mitbringt." },
    m_aufzug: { from: "Unbekannte Nummer", text: "Zimmer 217 erwartet Sie. Seit siebzehn Jahren." },
  });

  /* ---------- Dokumente ---------- */
  Object.assign(N.docs, {
    reservierung: {
      title: "Reservierungsbestätigung", kind: "letter",
      html: `<p class="doc-head">HOTEL NOCTURNE<br><small>SEIT 1897</small></p>
        <table class="doc-kv"><tr><th>Reservierung</th><td>{name}</td></tr><tr><th>Zimmer</th><td>217</td></tr><tr><th>Check-in</th><td>23:17 Uhr</td></tr><tr><th>Check-out</th><td><em>Nicht vorgesehen.</em></td></tr></table>
        <p class="handwriting">Wenn Sie diese Nachricht lesen, hat das Hotel wieder jemanden aufgenommen. Finden Sie heraus, was in jener Nacht geschehen ist. Vertrauen Sie nicht den offiziellen Aufzeichnungen.</p>
        <p class="handwriting sign">– Elias Voss</p>`,
    },
    tresenzettel: { title: "Zettel auf dem Tresen", kind: "note", html: `<p class="handwriting big">Der Schlüssel liegt dort,<br>wo der Gast eingecheckt hat.<br><br>Die Uhr erinnert sich.</p>` },
    gaesteregister: {
      title: "Gästeregister, 14.10.2009", kind: "register",
      html: `<p class="doc-head">GÄSTEREGISTER<br><small>MITTWOCH, 14. OKTOBER 2009</small></p>
        <table class="doc-table"><thead><tr><th>Gast</th><th>Zimmer</th><th>Check-in</th><th>Vermerk</th></tr></thead><tbody>
          <tr class="struck"><td>H. Marquardt</td><td>217</td><td>16:40</td><td>storniert</td></tr>
          <tr><td>R. Hallström</td><td>208</td><td>19:52</td><td></td></tr>
          <tr><td>L. Berger</td><td>201</td><td>20:14</td><td></td></tr>
          <tr><td>M. Vale</td><td>217</td><td>21:17</td><td>bar, im Voraus</td></tr>
          <tr><td>J. Winter</td><td>214</td><td>21:31</td><td></td></tr>
          <tr><td>A. Stern</td><td>220</td><td>22:08</td><td></td></tr>
          <tr><td>K. Doran</td><td>211</td><td>22:46</td><td>Spätanreise</td></tr>
        </tbody></table>
        <p class="handwriting margin">Manchmal steckt die Antwort schon in der Zimmernummer. Zählt nur die letzte Buchung, die genau zum Zimmer passt.</p>`,
    },
    anrufbeantworter: {
      title: "Anrufbeantworter, Nachricht 1", kind: "log",
      html: `<p class="mono dim">NACHRICHT 1 VON 1 · 14.10.2009 · 22:51</p><p class="mono">[Rauschen. Regen im Hintergrund.]</p>
        <p class="mono">„Hier ist Elias. Hör zu – falls jemand nach Zimmer 217 fragt: Der Gast steht im Buch, aber nicht unter dem richtigen Namen. Die Buchung von heute Nachmittag ist storniert, die zählt nicht. Und verlass dich nicht auf die Uhr über dem Empfang. Die geht nur noch so lange, bis …“</p>
        <p class="mono">[Die Aufnahme bricht ab.]</p>`,
    },
    abrechnung: {
      title: "Abrechnungsordner Oktober 2009", kind: "register",
      html: `<p class="doc-head">ABRECHNUNG<br><small>NACHT 14./15. OKTOBER 2009</small></p>
        <table class="doc-table"><thead><tr><th>Zimmer</th><th>Gast</th><th>Betrag</th><th>Status</th></tr></thead><tbody>
          <tr><td>201</td><td>L. Berger</td><td>189,00 €</td><td>offen</td></tr><tr><td>208</td><td>R. Hallström</td><td>164,00 €</td><td>offen</td></tr>
          <tr><td>211</td><td>K. Doran</td><td>164,00 €</td><td>offen</td></tr><tr><td>214</td><td>J. Winter</td><td>189,00 €</td><td>offen</td></tr>
          <tr><td>220</td><td>A. Stern</td><td>212,00 €</td><td>offen</td></tr></tbody></table>
        <p class="mono dim">Summe: 5 Zimmer · keiner der Gäste hat ausgecheckt.</p>`,
    },
    keyboxnotiz: { title: "Notiz aus dem Schlüsselkasten", kind: "note", html: `<p class="handwriting big">Nicht jeder Gast, der eincheckt,<br>erscheint später in der Abrechnung.</p>` },
    personalfoto: {
      title: "Personalfoto, Sommer 2008", kind: "photo",
      pages: [
        `<svg viewBox="0 0 400 260" class="photo-svg" role="img" aria-label="Sepiafoto von fünf Personen vor dem Hotel">
          <rect width="400" height="260" fill="#8a7458"/><rect width="400" height="150" fill="#a58d6c"/><rect y="150" width="400" height="110" fill="#6e5a43"/>
          <rect x="40" y="20" width="320" height="130" fill="#7d6950"/><text x="200" y="50" text-anchor="middle" fill="#3b2f22" font-family="Playfair Display,serif" font-size="22" letter-spacing="6">NOCTURNE</text>
          <g fill="#2f261c"><circle cx="90" cy="135" r="15"/><rect x="72" y="150" width="36" height="80" rx="10"/><circle cx="150" cy="128" r="15"/><rect x="132" y="143" width="36" height="87" rx="10"/>
          <circle cx="210" cy="122" r="16"/><rect x="190" y="138" width="40" height="92" rx="10"/><circle cx="272" cy="126" r="15"/><rect x="254" y="141" width="36" height="89" rx="10"/><circle cx="330" cy="136" r="14"/><rect x="314" y="150" width="32" height="80" rx="10"/></g>
          <rect width="400" height="260" fill="#3a2a15" opacity=".18"/></svg>
          <p class="caption-line">Personal des Hotel Nocturne · Sommer 2008</p>`,
        `<p class="handwriting">v. l. n. r.: Greta (Küche) · Tomasz (Haustechnik) · V. Lehn · Elias Voss (Nacht) · Ilse (Empfang)</p>
          <p class="handwriting big">Für M. – damit du weißt,<br>wo ich nachts bin.</p><p class="handwriting sign">E.</p>`,
      ],
    },
    kinderzeichnung: {
      title: "Kinderzeichnung im Gästeregister", kind: "photo",
      html: `<svg viewBox="0 0 360 240" role="img" aria-label="Kinderzeichnung: das Hotel, ein Mann und ein Mädchen, an der Seite eine kleine Tür mit Pfeil"><rect width="360" height="240" fill="#f4ecd6"/>
          <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
            <path d="M80 200 V90 L180 40 L280 90 V200 Z" stroke="#6b4a3a"/><path d="M160 200 v-40 h40 v40" stroke="#6b4a3a"/>
            ${[[105, 105], [215, 105], [105, 145], [215, 145]].map(([x, y]) => `<rect x="${x}" y="${y}" width="30" height="24" stroke="#2f5d8a"/>`).join("")}
            <path d="M60 200 v-24 h16 v24" stroke="#c0574a"/><path d="M40 170 q10 -14 22 -6" stroke="#c0574a"/><path d="M58 160 l6 4 l-7 3" stroke="#c0574a"/>
            <circle cx="300" cy="170" r="8" stroke="#2a2119"/><path d="M300 178 v18 M292 186 h16 M300 196 l-6 10 M300 196 l6 10" stroke="#2a2119"/>
            <circle cx="322" cy="182" r="6" stroke="#2a2119"/><path d="M322 188 v12 M316 194 h12 M322 200 l-4 8 M322 200 l4 8" stroke="#2a2119"/>
            <path d="M20 210 H340" stroke="#4f7a4a"/></g>
          <text x="180" y="28" text-anchor="middle" fill="#2a2119" font-family="Georgia, serif" font-style="italic" font-size="16">HOTEL NOKTURNE</text>
          <text x="36" y="226" fill="#c0574a" font-family="Georgia, serif" font-style="italic" font-size="11">Papas Tür</text>
          <text x="340" y="232" text-anchor="end" fill="#2a2119" font-family="Georgia, serif" font-style="italic" font-size="12">für Papa – M., 9 Jahre</text></svg>
        <p class="dim">Ein Haus mit vielen Fenstern, zwei Figuren davor. Links an der Seite, klein und rot: eine Tür, die auf keinem Plan des Hotels eingezeichnet ist.</p>`,
    },
    zeitung: {
      title: "Zeitungsartikel vom 16. und 21.10.2009", kind: "news", pageLabels: ["16. Oktober 2009", "21. Oktober 2009 – Folgeartikel"],
      pages: [
        `<p class="news-head">LOKALANZEIGER · FREITAG, 16. OKTOBER 2009</p>
        <h4 class="news-title">Hotel Nocturne nach Unwetternacht geschlossen</h4>
        <p class="news-sub">Sechs Gäste vermisst – Nachtmanager verschwunden</p>
        <p>In der Nacht zum Donnerstag fiel im traditionsreichen Hotel Nocturne um 23:17 Uhr der Strom aus. Als die Feuerwehr am Morgen eintraf, waren sechs Gäste verschwunden. Auch der Nachtmanager Elias V. ist seither nicht auffindbar.</p>
        <p>Eigentümer Viktor Lehn wies jede Verantwortung zurück: „Der Westflügel ist seit Jahren gesperrt. Dort gibt es keinen Ausgang. Wer in dieser Nacht Dienst hatte, muss sich erklären.“</p>`,
        `<p class="news-head">LOKALANZEIGER · MITTWOCH, 21. OKTOBER 2009</p>
        <h4 class="news-title">Vermisste Hotelgäste lebend aufgefunden</h4>
        <p class="news-sub">Ermittlungen gegen Nachtmanager wegen versuchten Mordes</p>
        <p>Alle sechs Gäste des Hotel Nocturne sind wieder aufgetaucht – unterkühlt, erschöpft und verstört, verstreut über die umliegenden Orte. Übereinstimmend berichten sie von völliger Dunkelheit, eiskaltem Wasser und einem Mann mit einer Taschenlampe, der sie durch einen engen Gang trieb. Wie sie aus dem Gebäude kamen, kann keiner sagen.</p>
        <p>Eigentümer Lehn hat eine Erklärung: „Voss hat den Strom abgestellt und die Gäste in den überfluteten Keller geführt. Dort gibt es keinen Ausgang. Dass sie herausgefunden haben, ist ein Wunder.“ Die Polizei fahndet nach Elias V. wegen versuchten Mordes in sechs Fällen.</p>`,
      ],
    },
    hotelplan: {
      title: "Hotelplan (Stand 2009)", kind: "plan",
      html: `<svg viewBox="0 0 600 400" class="plan-svg" role="img" aria-label="Gebäudeplan des Hotel Nocturne">
          <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#6b4a3a" stroke-width="3"/></pattern></defs>
          <text x="20" y="28" class="plan-title">ERDGESCHOSS</text><rect x="120" y="45" width="460" height="150" class="plan-wall"/>
          <rect x="120" y="45" width="110" height="150" class="plan-room dark"/><text x="175" y="115" class="plan-label">WESTFLÜGEL</text><text x="175" y="131" class="plan-small">Verwaltung</text>
          <rect x="230" y="45" width="190" height="150" class="plan-room"/><text x="325" y="120" class="plan-label">EMPFANGSHALLE</text>
          <rect x="420" y="45" width="80" height="150" class="plan-room"/><text x="460" y="115" class="plan-label">ARCHIV</text>
          <rect x="500" y="45" width="80" height="150" class="plan-room"/><text x="540" y="110" class="plan-label">AUFZUG</text><text x="540" y="126" class="plan-small">Treppe</text>
          <text x="20" y="232" class="plan-title">UNTERGESCHOSS</text><rect x="120" y="250" width="460" height="110" class="plan-wall"/>
          <rect x="20" y="100" width="100" height="40" fill="url(#hatch)" class="plan-tunnel"/><text x="70" y="94" class="plan-small">Rampe ↗</text>
          <rect x="120" y="250" width="170" height="110" class="plan-room"/><text x="205" y="310" class="plan-label">TECHNIK</text>
          <rect x="290" y="250" width="170" height="110" class="plan-room"/><text x="375" y="310" class="plan-label">GEPÄCKLAGER</text>
          <rect x="460" y="250" width="120" height="110" class="plan-room"/><text x="520" y="305" class="plan-label">SICHERHEIT</text><text x="520" y="321" class="plan-small">Kameras</text>
          <text x="20" y="156" class="plan-small warn" style="text-anchor:start">◤ SERVICETUNNEL</text><text x="20" y="168" class="plan-small warn" style="text-anchor:start">WEST · DAUERHAFT</text><text x="20" y="180" class="plan-small warn" style="text-anchor:start">VERSCHLOSSEN</text>
        </svg><p class="mono dim">Obergeschosse 1–3: Gästezimmer 101–320 (nicht abgebildet).</p>`,
    },
  });

  /* ---------- Szenen-Grundgerüst (Wand, Boden, Vignette) ---------- */
  const scene = (p, body, { wainscot = true } = {}) => `
<svg viewBox="0 0 1200 900" class="scene-art" aria-hidden="true">
  <defs>
    <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0d0d"/><stop offset=".55" stop-color="#1d2423"/><stop offset="1" stop-color="#121615"/></linearGradient>
    <linearGradient id="${p}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16120f"/><stop offset="1" stop-color="#060505"/></linearGradient>
    <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2b1e"/><stop offset="1" stop-color="#171411"/></linearGradient>
    <linearGradient id="${p}-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4b885"/><stop offset=".5" stop-color="#806040"/><stop offset="1" stop-color="#b69a6d"/></linearGradient>
    <radialGradient id="${p}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e7b46a" stop-opacity=".4"/><stop offset="1" stop-color="#e7b46a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-vig" cx=".5" cy=".45" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
    <pattern id="${p}-paper" width="56" height="900" patternUnits="userSpaceOnUse"><line x1="28" y1="0" x2="28" y2="900" stroke="#ffffff" stroke-opacity=".022" stroke-width="12"/><line x1="4" y1="0" x2="4" y2="900" stroke="#000" stroke-opacity=".12" stroke-width="2"/></pattern>
  </defs>
  <rect width="1200" height="900" fill="url(#${p}-wall)"/>
  <rect width="1200" height="760" fill="url(#${p}-paper)"/>
  <rect width="1200" height="40" fill="#090a0c"/><rect y="40" width="1200" height="5" fill="#4a3a28"/>
  ${wainscot ? `<rect y="616" width="1200" height="144" fill="url(#${p}-wood)"/><rect y="612" width="1200" height="6" fill="#4a3a28"/>` : ""}
  <rect y="760" width="1200" height="140" fill="url(#${p}-floor)"/>
  <g stroke="#221b15" stroke-width="2" opacity=".8"><line x1="0" y1="800" x2="1200" y2="800"/><line x1="0" y1="850" x2="1200" y2="850"/><line x1="160" y1="760" x2="40" y2="900"/><line x1="440" y1="760" x2="400" y2="900"/><line x1="760" y1="760" x2="800" y2="900"/><line x1="1040" y1="760" x2="1160" y2="900"/></g>
  ${body}
  <rect width="1200" height="900" fill="url(#${p}-vig)"/>
</svg>`;

  N.svgScene = scene; // Grundgerüst auch für die anderen Räume

  /* ---------- Blickrichtung NORD: Empfang ---------- */
  const nord = scene("rn", `
  <g transform="translate(600,150)">
    <circle r="80" fill="#1a140f"/><circle r="70" fill="#cdbd9b" stroke="url(#rn-brass)" stroke-width="9"/>
    <g stroke="#33281c" stroke-width="3"><line y1="-60" y2="-50"/><line y1="60" y2="50"/><line x1="-60" x2="-50"/><line x1="60" x2="50"/></g>
    <line y2="-35" stroke="#17110b" stroke-width="7" stroke-linecap="round" transform="rotate(338.5)"/>
    <line y2="-55" stroke="#17110b" stroke-width="4" stroke-linecap="round" transform="rotate(102)"/>
    <circle r="6" fill="#17110b"/><path d="M-38 28 L36 -30" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
  </g>
  <text x="600" y="262" text-anchor="middle" fill="#7f6c51" font-family="DM Mono, monospace" font-size="14" letter-spacing="6">REZEPTION</text>

  <g>
    <rect x="128" y="208" width="204" height="264" fill="#0a0807"/>
    <rect x="136" y="216" width="188" height="248" fill="#221811" stroke="#5a412b" stroke-width="3"/>
    <g fill="url(#rn-brass)"><circle cx="170" cy="262" r="4"/><circle cx="214" cy="262" r="4"/><circle cx="258" cy="262" r="4"/><circle cx="298" cy="262" r="4"/><circle cx="170" cy="340" r="4"/><circle cx="214" cy="340" r="4"/><circle cx="258" cy="340" r="4"/><circle cx="298" cy="340" r="4"/><circle cx="170" cy="418" r="4"/><circle cx="214" cy="418" r="4"/><circle cx="258" cy="418" r="4"/><circle cx="298" cy="418" r="4"/></g>
    <g fill="#8c6c40"><rect x="166" y="268" width="8" height="34" rx="2"/><rect x="210" y="268" width="8" height="34" rx="2"/><rect x="294" y="268" width="8" height="34" rx="2"/><rect x="166" y="346" width="8" height="34" rx="2"/><rect x="294" y="346" width="8" height="34" rx="2"/><rect x="214" y="424" width="8" height="34" rx="2"/><rect x="254" y="424" width="8" height="34" rx="2"/></g>
    <text x="258" y="322" text-anchor="middle" fill="#b69a6d" font-family="DM Mono, monospace" font-size="12">217</text>
    <g data-unless="keybox_open">
      <rect x="136" y="216" width="188" height="248" fill="#30231a" stroke="#6b4e33" stroke-width="3"/><rect x="152" y="232" width="156" height="216" fill="none" stroke="#4d3826" stroke-width="2"/>
      <text x="230" y="270" text-anchor="middle" fill="#9a7f55" font-family="DM Mono, monospace" font-size="13" letter-spacing="4">SCHLÜSSEL</text>
      <rect x="196" y="300" width="68" height="86" rx="4" fill="#120e0b" stroke="url(#rn-brass)" stroke-width="3"/>
      <g fill="#5d4a31"><rect x="205" y="311" width="14" height="11"/><rect x="223" y="311" width="14" height="11"/><rect x="241" y="311" width="14" height="11"/><rect x="205" y="327" width="14" height="11"/><rect x="223" y="327" width="14" height="11"/><rect x="241" y="327" width="14" height="11"/><rect x="205" y="343" width="14" height="11"/><rect x="223" y="343" width="14" height="11"/><rect x="241" y="343" width="14" height="11"/><rect x="223" y="359" width="14" height="11"/></g>
      <circle cx="254" cy="376" r="3" fill="#a3473c"/>
    </g>
    <g data-if="keybox_open"><polygon points="136,216 92,234 92,446 136,464" fill="#30231a" stroke="#6b4e33" stroke-width="3"/><circle cx="258" cy="350" r="15" fill="none" stroke="#d4b885" stroke-width="2" stroke-dasharray="4 4"/></g>
  </g>

  <g>
    <rect x="878" y="218" width="184" height="146" fill="url(#rn-brass)"/><rect x="890" y="230" width="160" height="122" fill="#5f503d"/>
    <rect x="890" y="230" width="160" height="60" fill="#7a674e"/>
    <g fill="#2f261c"><circle cx="918" cy="292" r="8"/><rect x="909" y="300" width="18" height="44" rx="5"/><circle cx="946" cy="288" r="8"/><rect x="937" y="296" width="18" height="48" rx="5"/><circle cx="974" cy="285" r="9"/><rect x="964" y="294" width="20" height="50" rx="5"/><circle cx="1002" cy="288" r="8"/><rect x="993" y="296" width="18" height="48" rx="5"/><circle cx="1028" cy="293" r="7"/><rect x="1020" y="300" width="16" height="44" rx="5"/></g>
  </g>

  <ellipse class="flicker" cx="960" cy="470" rx="230" ry="180" fill="url(#rn-glow)"/>
  <rect x="952" y="462" width="16" height="60" fill="url(#rn-brass)"/><polygon points="912,464 1008,464 986,414 934,414" fill="#4f3824" stroke="#22170f"/>

  <rect x="140" y="518" width="920" height="28" fill="#4a3424"/><rect x="140" y="518" width="920" height="4" fill="#7c5d3d"/>
  <rect x="160" y="546" width="880" height="262" fill="url(#rn-wood)"/>
  <g fill="none" stroke="#4d3826" stroke-width="2"><rect x="190" y="580" width="190" height="196"/><rect x="410" y="580" width="190" height="196"/><rect x="630" y="580" width="190" height="196"/><rect x="850" y="580" width="160" height="196"/></g>

  <g>
    <rect x="298" y="486" width="94" height="36" rx="8" fill="#14100d" stroke="#33281e"/>
    <path d="M294 486 q50 -36 102 0 l-15 5 q-36 -20 -72 0 z" fill="#1d1612" stroke="#33281e"/>
    <circle cx="345" cy="504" r="11" fill="#28201a" stroke="#4d3b2b"/>
    <circle cx="378" cy="498" r="4" fill="#d4443a"><animate attributeName="opacity" values="1;.15;1" dur="1.6s" repeatCount="indefinite"/></circle>
  </g>

  <g>
    <polygon points="500,522 590,515 590,480 508,486" fill="#dccdae"/><polygon points="680,522 590,515 590,480 672,486" fill="#cfbf9f"/>
    <g stroke="#867353" stroke-width="1.5" opacity=".8"><line x1="518" y1="494" x2="580" y2="489"/><line x1="518" y1="502" x2="580" y2="497"/><line x1="518" y1="510" x2="576" y2="505"/><line x1="600" y1="489" x2="662" y2="494"/><line x1="600" y1="497" x2="662" y2="502"/><line x1="600" y1="505" x2="656" y2="510"/></g>
    <rect x="585" y="514" width="9" height="15" fill="#7a2a24"/>
    <g data-unless="kinderzeichnung_gesehen"><polygon points="492,500 520,494 524,512 496,518" fill="#efe4c4" stroke="#8a7a58" stroke-width="1"/><path d="M500 510 l6 -8 l6 8" stroke="#c0574a" stroke-width="1.5" fill="none"/></g>
  </g>

  <g transform="rotate(-6 755 510)"><rect x="722" y="496" width="70" height="30" fill="#e8dcc0"/><g stroke="#6c5a44" stroke-width="1.3"><line x1="730" y1="506" x2="782" y2="506"/><line x1="730" y1="514" x2="772" y2="514"/></g></g>

  <g><ellipse cx="852" cy="520" rx="30" ry="5" fill="#1f1710"/><path d="M826 518 a26 23 0 0 1 52 0 z" fill="url(#rn-brass)"/><rect x="848" y="489" width="8" height="7" rx="2" fill="#b69a6d"/></g>
  `, { wainscot: false });

  /* ---------- Blickrichtung OST: Aufzug ---------- */
  const ost = scene("ro", `
  <line x1="600" y1="45" x2="600" y2="80" stroke="#3a2e22" stroke-width="3"/>
  <ellipse class="flicker" cx="600" cy="120" rx="260" ry="160" fill="url(#ro-glow)"/>
  <polygon points="570,80 630,80 650,108 550,108" fill="#4f3824"/>

  <g transform="translate(600,190)">
    <path d="M-62 0 A62 62 0 0 1 62 0" fill="none" stroke="url(#ro-brass)" stroke-width="6"/>
    <g fill="#9a7f55" font-family="DM Mono, monospace" font-size="13" text-anchor="middle"><text x="-50" y="-14">E</text><text x="-22" y="-46">1</text><text x="22" y="-46">2</text><text x="50" y="-14">3</text></g>
    <circle cx="22" cy="-51" r="13" fill="none" stroke="#a3473c" stroke-width="2"/>
    <line x1="0" y1="0" x2="-44" y2="-30" stroke="#d4b885" stroke-width="3" data-unless="elevator_open"/>
    <line x1="0" y1="0" x2="20" y2="-50" stroke="#d4b885" stroke-width="3" data-if="elevator_open"/>
    <circle r="5" fill="#d4b885"/>
  </g>

  <rect x="410" y="214" width="380" height="590" fill="#090706"/>
  <rect x="424" y="226" width="352" height="578" fill="url(#ro-brass)" opacity=".5"/>
  <g data-unless="elevator_open">
    <rect x="440" y="240" width="158" height="564" fill="#33271b" stroke="#6e5537" stroke-width="2"/><rect x="602" y="240" width="158" height="564" fill="#33271b" stroke="#6e5537" stroke-width="2"/>
    <rect x="460" y="280" width="118" height="480" fill="none" stroke="#4d3826"/><rect x="622" y="280" width="118" height="480" fill="none" stroke="#4d3826"/>
  </g>
  <g data-if="elevator_open">
    <rect x="440" y="240" width="320" height="564" fill="#2a2014"/><rect x="440" y="240" width="320" height="564" fill="#f0c27a" opacity=".28"/>
    <rect x="480" y="300" width="240" height="380" fill="none" stroke="#6e5537"/><rect x="440" y="240" width="22" height="564" fill="#33271b"/><rect x="738" y="240" width="22" height="564" fill="#33271b"/>
  </g>

  <g data-unless="cover_open">
    <rect x="812" y="440" width="56" height="110" rx="4" fill="url(#ro-brass)"/>
    <g fill="#4f3c27"><circle cx="822" cy="450" r="4"/><circle cx="858" cy="450" r="4"/><circle cx="822" cy="540" r="4"/><circle cx="858" cy="540" r="4"/></g>
    <text x="840" y="500" text-anchor="middle" fill="#4f3c27" font-family="DM Mono, monospace" font-size="9">GÄSTE</text>
  </g>
  <g data-if="cover_open">
    <rect x="812" y="440" width="56" height="110" rx="4" fill="#0a0807" stroke="url(#ro-brass)" stroke-width="2"/>
    <circle cx="840" cy="478" r="13" fill="url(#ro-brass)"/><rect x="837" y="468" width="6" height="20" fill="#1a1410"/>
    <circle cx="840" cy="522" r="5" fill="#a3473c" data-unless="elevator_open"/><circle cx="840" cy="522" r="5" fill="#7fa36d" data-if="elevator_open"/>
    <rect x="806" y="770" width="60" height="22" rx="3" fill="url(#ro-brass)" transform="rotate(-8 836 781)"/>
  </g>

  <g>
    <polygon points="226,690 334,690 320,800 240,800" fill="#3a2b1e"/><rect x="220" y="680" width="120" height="14" fill="#4a3727"/>
    <g fill="none" stroke="#5a4a2e" stroke-width="6" stroke-linecap="round"><path d="M280 682 q-60 -80 -100 -60"/><path d="M280 682 q-10 -120 -50 -170"/><path d="M280 682 q40 -110 90 -130"/><path d="M280 682 q70 -40 100 10"/></g>
  </g>

  <g>
    <rect x="958" y="256" width="164" height="548" fill="#0a0807"/>
    <g data-unless="personal_open">
      <rect x="966" y="264" width="148" height="540" fill="#251a12" stroke="#4d3826" stroke-width="2"/>
      <rect x="990" y="310" width="100" height="32" fill="#cdbd9b"/><text x="1040" y="331" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="12" letter-spacing="2">PERSONAL</text>
      <rect x="980" y="560" width="10" height="34" rx="3" fill="url(#ro-brass)"/>
    </g>
    <g data-if="personal_open">
      <rect x="966" y="264" width="148" height="540" fill="#050404"/>
      <g fill="#1d1712"><rect x="980" y="700" width="120" height="14"/><rect x="990" y="660" width="110" height="12"/><rect x="1000" y="624" width="100" height="10"/><rect x="1010" y="592" width="90" height="8"/></g>
      <ellipse cx="1050" cy="640" rx="60" ry="90" fill="#e7b46a" opacity=".07"/>
      <polygon points="966,264 930,280 930,790 966,804" fill="#251a12" stroke="#4d3826" stroke-width="2"/>
    </g>
  </g>
  `);

  /* ---------- Blickrichtung SÜD: Eingang ---------- */
  const sued = scene("rs", `
  <defs>
    <linearGradient id="rs-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05080d"/><stop offset="1" stop-color="#101820"/></linearGradient>
    <clipPath id="rs-glass"><rect x="412" y="172" width="182" height="628"/><rect x="606" y="172" width="182" height="628"/></clipPath>
  </defs>
  <rect x="390" y="150" width="420" height="660" fill="#090706"/>
  <path d="M390 150 Q600 60 810 150 Z" fill="#090706"/>
  <rect x="412" y="172" width="182" height="628" fill="url(#rs-night)"/><rect x="606" y="172" width="182" height="628" fill="url(#rs-night)"/>
  <g clip-path="url(#rs-glass)">
    <g class="rain-lines" stroke="#8aa0b8" stroke-opacity=".28" stroke-width="1.4">
      <line x1="430" y1="150" x2="420" y2="220"/><line x1="470" y1="300" x2="460" y2="370"/><line x1="520" y1="180" x2="510" y2="250"/><line x1="560" y1="420" x2="550" y2="490"/><line x1="440" y1="560" x2="430" y2="630"/><line x1="510" y1="660" x2="500" y2="730"/>
      <line x1="630" y1="240" x2="620" y2="310"/><line x1="680" y1="140" x2="670" y2="210"/><line x1="720" y1="380" x2="710" y2="450"/><line x1="760" y1="200" x2="750" y2="270"/><line x1="650" y1="520" x2="640" y2="590"/><line x1="740" y1="620" x2="730" y2="690"/>
    </g>
    <rect class="lightning" x="400" y="150" width="400" height="660" fill="#cfe1ff"/>
    <text x="600" y="300" text-anchor="middle" fill="#b69a6d" opacity=".45" font-family="Playfair Display, serif" font-size="46" letter-spacing="10" transform="translate(1200,0) scale(-1,1)">NOCTURNE</text>
  </g>
  <g fill="url(#rs-brass)"><rect x="570" y="430" width="10" height="120" rx="4"/><rect x="620" y="430" width="10" height="120" rx="4"/></g>
  <rect x="598" y="172" width="4" height="628" fill="#2a2016"/>

  <g><rect x="250" y="300" width="14" height="40" fill="url(#rs-brass)"/><ellipse class="flicker" cx="257" cy="300" rx="120" ry="110" fill="url(#rs-glow)"/><polygon points="236,300 278,300 270,272 244,272" fill="#e6c48c" opacity=".7"/></g>

  <g>
    <rect x="246" y="650" width="78" height="150" rx="6" fill="#2a2016" stroke="#4d3826" stroke-width="2"/><ellipse cx="285" cy="650" rx="39" ry="8" fill="#1a130d"/>
    <line x1="292" y1="652" x2="306" y2="540" stroke="#141010" stroke-width="7"/><path d="M306 540 q4 -26 -16 -26" fill="none" stroke="#5b3f27" stroke-width="7" stroke-linecap="round"/>
  </g>

  <g>
    <rect x="898" y="258" width="184" height="226" fill="#2a1d14"/><rect x="910" y="270" width="160" height="202" fill="#d6cbb0"/>
    <rect x="922" y="282" width="136" height="10" fill="#3a2f24"/><rect x="922" y="300" width="100" height="6" fill="#5a4e3e"/>
    <rect x="922" y="316" width="60" height="50" fill="#7d705c"/>
    <g fill="#8a7c66"><rect x="990" y="318" width="68" height="4"/><rect x="990" y="328" width="68" height="4"/><rect x="990" y="338" width="60" height="4"/><rect x="990" y="348" width="68" height="4"/><rect x="922" y="378" width="136" height="4"/><rect x="922" y="388" width="136" height="4"/><rect x="922" y="398" width="120" height="4"/><rect x="922" y="408" width="136" height="4"/><rect x="922" y="418" width="100" height="4"/></g>
  </g>

  <polygon points="440,812 760,812 790,860 410,860" fill="#2b2117"/>
  <text x="600" y="845" text-anchor="middle" fill="#4f3e2c" font-family="DM Mono, monospace" font-size="16" letter-spacing="8">WILLKOMMEN</text>
  `);

  /* ---------- Blickrichtung WEST: Sitzecke ---------- */
  const west = scene("rw", `
  <g>
    <rect x="150" y="214" width="320" height="10" fill="#3b2b1e"/><rect x="150" y="470" width="320" height="12" fill="#3b2b1e"/>
    <rect x="172" y="260" width="30" height="210" fill="#4a1f1c"/><rect x="206" y="270" width="26" height="200" fill="#243330"/><rect x="236" y="250" width="36" height="220" fill="#54432b"/>
    <rect x="276" y="276" width="24" height="194" fill="#33251c"/><rect x="304" y="262" width="30" height="208" fill="#4a1f1c"/><polygon points="338,470 352,290 382,294 372,470" fill="#2a221b"/>
    <rect x="390" y="300" width="60" height="170" fill="#243330"/>
    <rect x="240" y="300" width="28" height="44" fill="#cdbd9b" opacity=".85"/><text x="254" y="317" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="9">ABR.</text><text x="254" y="333" text-anchor="middle" fill="#2a2119" font-family="DM Mono, monospace" font-size="9">10/09</text>
  </g>

  <g>
    <rect x="636" y="240" width="168" height="200" fill="url(#rw-brass)"/><rect x="648" y="252" width="144" height="160" fill="#1a1512"/>
    <ellipse cx="720" cy="318" rx="34" ry="42" fill="#5a4636"/><path d="M670 412 q50 -70 100 0 z" fill="#26201b"/>
    <rect x="684" y="418" width="72" height="16" fill="#2a2016"/><text x="720" y="430" text-anchor="middle" fill="#b69a6d" font-family="DM Mono, monospace" font-size="9">V. LEHN</text>
  </g>

  <g>
    <rect x="160" y="560" width="400" height="110" rx="22" fill="#3e1a17"/><rect x="150" y="650" width="420" height="80" rx="10" fill="#4a201c"/>
    <rect x="130" y="610" width="50" height="120" rx="14" fill="#3e1a17"/><rect x="540" y="610" width="50" height="120" rx="14" fill="#3e1a17"/>
    <line x1="290" y1="660" x2="290" y2="728" stroke="#2d1311" stroke-width="3"/><line x1="430" y1="660" x2="430" y2="728" stroke="#2d1311" stroke-width="3"/>
    <rect x="160" y="730" width="10" height="34" fill="#1a120c"/><rect x="550" y="730" width="10" height="34" fill="#1a120c"/>
  </g>

  <g><rect x="596" y="640" width="54" height="10" fill="#3b2b1e"/><rect x="618" y="650" width="10" height="110" fill="#2a1f16"/><rect x="616" y="590" width="14" height="50" fill="#5b4430"/><polygon points="596,592 650,592 640,556 606,556" fill="#33281e"/></g>

  <g>
    <rect x="672" y="590" width="150" height="90" rx="16" fill="#2f2a24"/><rect x="662" y="660" width="170" height="70" rx="10" fill="#38312a"/>
    <rect x="652" y="620" width="34" height="110" rx="10" fill="#2f2a24"/><rect x="808" y="620" width="34" height="110" rx="10" fill="#2f2a24"/>
  </g>

  <polygon points="840,900 840,770 1200,290 1200,900" fill="#0b0909"/>
  <g fill="#1a1411"><polygon points="840,770 1200,290 1200,312 858,770"/></g>
  <g stroke="#2a2016" stroke-width="4"><line x1="900" y1="690" x2="900" y2="900"/><line x1="1020" y1="530" x2="1020" y2="900"/><line x1="1140" y1="370" x2="1140" y2="900"/></g>
  <g data-unless="taken_schraubendreher">
    <rect x="960" y="790" width="40" height="13" rx="6" fill="#8e2f26"/><line x1="1000" y1="796" x2="1062" y2="796" stroke="#a7a39a" stroke-width="5" stroke-linecap="round"/>
  </g>
  `);

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "rezeption",
    name: "Rezeption",
    title: "Die Rezeption",
    kicker: "ERDGESCHOSS",
    story: "Die Lobby ist still. Draußen prasselt Regen gegen die Scheiben. Die Uhr über dem Empfang steht – und doch hört man irgendwo ein leises Ticken.",
    ambient: "tick",
    weather: "storm",
    exitLabel: "In den Aufzug steigen",
    views: [
      {
        id: "nord", dir: "NORD", name: "Empfang", scene: nord,
        desc: "Der Empfangstresen. Hinter dem Tresen blinkt am Telefon ein rotes Licht, darüber hängt die stehende Uhr.",
        hotspots: [
          { id: "uhr", label: "Wanduhr", x: 43.3, y: 7.8, w: 13.3, h: 17.8, title: "Die Wanduhr", text: "Die Zeiger stehen auf <b>23:17</b>. Das Glas ist gesprungen, das Pendel hängt still. Vier Ziffern, festgehalten seit siebzehn Jahren – die Uhr erinnert sich an die Nacht, in der der Strom ausfiel." },
          { id: "schluesselkasten", label: "Schlüsselkasten", x: 10, y: 22.2, w: 18.3, h: 31.1, title: "Der Schlüsselkasten", lock: "keybox" },
          { id: "personalfoto", label: "Gerahmtes Foto", x: 72.5, y: 23.3, w: 16.7, h: 17.8, title: "Ein gerahmtes Foto", text: "Ein Gruppenfoto des Personals, leicht ausgeblichen. Du nimmst es kurz von der Wand und drehst es um.", doc: "personalfoto" },
          { id: "telefon", label: "Telefon", x: 23.75, y: 51.7, w: 10, h: 7.8, title: "Das Telefon", text: "Ein altes Tischtelefon mit Anrufbeantworter. Das rote Lämpchen blinkt. Du drückst auf Wiedergabe.", doc: "anrufbeantworter", sound: "phone" },
          { id: "register", label: "Gästeregister", x: 40.8, y: 51.7, w: 16.7, h: 7.8, title: "Das Gästeregister", text: "Das Buch ist beim 14. Oktober 2009 aufgeschlagen. Ein rotes Lesebändchen markiert die Seite.", doc: "gaesteregister" },
          { id: "kinderzeichnung", label: "Lose Seite", x: 40, y: 54, w: 4.5, h: 4.5, secret: true, title: "Eine lose Seite", text: "Zwischen den Seiten des Registers steckt ein gefaltetes Blatt, viel älter als der Rest.", doc: "kinderzeichnung", actions: [{ flag: "kinderzeichnung_gesehen" }] },
          { id: "zettel", label: "Zettel", x: 58.75, y: 53.9, w: 7.9, h: 5.6, title: "Ein Zettel auf dem Tresen", doc: "tresenzettel" },
          { id: "klingel", label: "Tischklingel", x: 67.9, y: 53.3, w: 6.25, h: 6.1, title: "Die Tischklingel", text: "<i>Ding.</i> Niemand kommt. Irgendwo tief im Haus antwortet – sehr leise – ein zweites Klingeln.", sound: "bell" },
        ],
      },
      {
        id: "ost", dir: "OST", name: "Aufzug", scene: ost,
        desc: "Der Aufzug. Die Messingtüren sind geschlossen, die Anzeige darüber steht auf E.",
        hotspots: [
          { id: "aufzug", label: "Aufzugtüren", x: 36.7, y: 25.6, w: 26.7, h: 63.3, unless: "elevator_open", title: "Der Aufzug", text: "Die Türen sind geschlossen, der Rufknopf ist tot. Rechts neben der Tür sitzt eine verschraubte Messingabdeckung mit der Prägung „GÄSTE“." },
          { id: "aufzug_offen", label: "Aufzug betreten", x: 36.7, y: 25.6, w: 26.7, h: 63.3, if: "elevator_open", go: "zimmer217", via: "elevator" },
          { id: "abdeckung", label: "Messingabdeckung", x: 66.7, y: 47.8, w: 6.7, h: 15.6, unless: "cover_open", title: "Die Messingabdeckung", text: "Eine Messingplatte, an allen vier Ecken verschraubt. Dahinter vermutest du den Schlüsselschalter für die Gäste.", use: "cover" },
          { id: "schalter", label: "Schlüsselschalter", x: 66.7, y: 47.8, w: 6.7, h: 15.6, if: "cover_open", title: "Der Schlüsselschalter", text: "Ein Schlüsselschalter. Darunter leuchtet ein rotes Lämpchen.", use: "elevator" },
          { id: "anzeige", label: "Stockwerksanzeige", x: 44.2, y: 11.1, w: 11.7, h: 11.1, title: "Die Stockwerksanzeige", text: "Der Zeiger steht auf <b>E</b>. Jemand hat die <b>2</b> mit rotem Stift eingekreist." },
          { id: "palme", label: "Vertrocknete Palme", x: 15.8, y: 57.8, w: 13.3, h: 31.1, title: "Eine vertrocknete Palme", text: "Die Erde ist staubtrocken. Hier hat seit Jahren niemand mehr gegossen." },
          { id: "personaltuer", label: "Tür „Personal“", x: 80, y: 28.9, w: 13.3, h: 60, unless: "personal_open", title: "Tür „Personal“", text: "Abgeschlossen. Unter dem Schild steht kleiner: <i>Archiv · Verwaltung · Treppe UG</i>. Das Schloss ist alt und schwer – ein Zimmerschlüssel passt hier nicht.", use: "personaltuer" },
          { id: "personaltreppe", label: "Treppe ins Untergeschoss", x: 80, y: 28.9, w: 13.3, h: 60, if: "personal_open", go: "gepaecklager", via: "door" },
        ],
      },
      {
        id: "sued", dir: "SÜD", name: "Eingang", scene: sued,
        desc: "Der Haupteingang. Hinter dem Glas nur Regen und Dunkelheit.",
        hotspots: [
          { id: "eingangstuer", label: "Eingangstür", x: 33.3, y: 17.8, w: 33.3, h: 71.1, title: "Die Eingangstür", text: "Verschlossen. Du rüttelst an den Griffen – nichts. Draußen nur Regen, die Straßenlaternen sind aus. Der Weg führt nicht hinaus, sondern tiefer hinein." },
          { id: "zeitung", label: "Gerahmter Zeitungsartikel", x: 74.2, y: 27.8, w: 16.7, h: 26.7, title: "Ein gerahmter Zeitungsartikel", text: "Jemand hat den Artikel ausgeschnitten und gerahmt – als sollte ihn jeder Gast beim Hinausgehen sehen.", doc: "zeitung" },
          { id: "schirmstaender", label: "Schirmständer", x: 19.2, y: 56, w: 9.2, h: 33, title: "Der Schirmständer", text: "Ein einzelner schwarzer Schirm. In den Holzgriff sind die Buchstaben <b>E.V.</b> geritzt." },
          { id: "fussmatte", label: "Fußmatte", x: 35.8, y: 89, w: 28.3, h: 6.7, title: "Die Fußmatte", text: "„WILLKOMMEN“. Du hebst sie an. Darunter liegt nur Staub." },
        ],
      },
      {
        id: "west", dir: "WEST", name: "Sitzecke", scene: west,
        desc: "Die Sitzecke. Rechts verschwindet die Treppe nach oben – darunter ist es stockdunkel.",
        dark: { x: 68, y: 30, w: 32, h: 70, clip: "polygon(0% 100%, 0% 82%, 6% 79%, 100% 3%, 100% 100%)" },
        hotspots: [
          { id: "regal", label: "Aktenregal", x: 12.5, y: 23.3, w: 26.7, h: 31.1, title: "Das Aktenregal", text: "Zwischen verstaubten Ordnern steckt einer mit der Aufschrift „ABR. 10/09“.", doc: "abrechnung" },
          { id: "portraet", label: "Porträt", x: 52.5, y: 26.7, w: 15, h: 22, title: "Ein Ölporträt", text: "Ein Mann mit strengem Blick. Auf dem Messingschild: <b>Viktor Lehn – Eigentümer seit 2001</b>. Das Bild hängt als einziges gerade." },
          { id: "sofa", label: "Sofa", x: 12.5, y: 62.2, w: 35, h: 22.2, title: "Das Sofa", text: "Roter Samt, abgewetzt. Zwischen den Polstern steckt eine leere Bonbondose. Sonst nichts." },
          { id: "sessel", label: "Sessel", x: 54.5, y: 64, w: 16, h: 18, title: "Der Sessel", text: "Ein schwerer Ledersessel. Er ist so gedreht, dass man von hier den Eingang im Blick hat." },
          { id: "ecke", label: "Dunkle Ecke", x: 72, y: 62, w: 26, h: 34, unless: "licht", title: "Unter der Treppe", text: "Unter der Treppe ist es so dunkel, dass du nicht einmal deine eigene Hand erkennst. Ohne Licht kommst du hier nicht weiter." },
          { id: "schraubendreher", label: "Schraubendreher", x: 79, y: 85, w: 10.5, h: 7.5, if: "licht", unless: "taken_schraubendreher", take: "schraubendreher", solves: "werkzeug", takeText: "Im Lichtkegel blitzt Metall auf: ein Schraubendreher mit rotem Griff. Du steckst ihn in den Rucksack." },
        ],
      },
    ],
    puzzles: {
      keybox: {
        type: "code", length: 4, title: "Zahlenschloss",
        prompt: "Ein vierstelliges Zahlenschloss aus Messing. Darüber eingraviert: „NUR FÜR DAS PERSONAL“.",
        answers: ["2117"],
        wrong: {
          "2317": "Das Schloss bleibt zu. Die Uhr erinnert sich an den Stromausfall – nicht an den Gast.",
          "1640": "Ein trockenes Klicken. Diese Buchung wurde storniert.",
          "0217": "Nichts. Eine Zimmernummer allein reicht nicht.",
        },
        objective: "Öffne den Schlüsselkasten.",
        hints: [
          "Der Zettel auf dem Tresen spricht von einem Gast und einem Check-in. Die Uhr verrät dir, in welcher Form der Code geschrieben ist: als Uhrzeit.",
          "Welcher Gast? Deine Reservierung nennt dein Zimmer. Suche im Gästeregister die gültige Buchung für genau dieses Zimmer – die stornierte zählt nicht.",
          "Zimmer 217 gehörte M. Vale, Check-in um 21:17 Uhr. Der Code lautet 2117.",
        ],
        success: "Mit einem satten Klacken springt die Tür auf. Am Haken 217 hängt ein schwerer Schlüssel. Dahinter steckt ein gefalteter Hotelplan – und eine Notiz.",
        onSolve: [{ flag: "keybox_open" }, { give: "key217" }, { give: "hotelplan" }, { doc: "keyboxnotiz" }, { message: "m_licht" }],
      },
      werkzeug: {
        type: "event", title: "Werkzeug",
        objective: "Finde etwas, um die Abdeckung am Aufzug zu lösen.",
        hints: [
          "Neben dem Aufzug sitzt eine verschraubte Messingabdeckung. Du brauchst Werkzeug – und vielleicht Licht.",
          "In der Sitzecke (Westen) ist es unter der Treppe stockdunkel. Dein Telefon hat eine Taschenlampe.",
          "Öffne das Telefon, schalte die Taschenlampe ein und leuchte in der Sitzecke unter die Treppe. Dort liegt ein Schraubendreher.",
        ],
        success: "Du hast einen Schraubendreher gefunden.",
      },
      cover: {
        type: "use", item: "schraubendreher", title: "Messingabdeckung",
        wrongItem: "Damit bekommst du die Schrauben nicht los.",
        noItems: "Mit bloßen Fingern lassen sich die Schrauben nicht lösen.",
        objective: "Löse die Messingabdeckung am Aufzug.",
        hints: [
          "Werkzeug benutzt du, indem du es im Rucksack antippst und dann auf die Stelle im Raum tippst – oder es dorthin ziehst.",
          "Die Abdeckung ist rechts neben den Aufzugtüren (Osten).",
          "Wähle den Schraubendreher im Rucksack aus und tippe auf die Messingabdeckung.",
        ],
        success: "Eine Schraube nach der anderen löst sich knirschend. Die Platte fällt scheppernd zu Boden. Dahinter: ein Schlüsselschalter.",
        onSolve: [{ flag: "cover_open" }, { sound: "drop" }],
      },
      elevator: {
        type: "use", item: "key217", title: "Schlüsselschalter",
        wrongItem: "Das passt nicht in den Schlüsselschalter.",
        noItems: "Du hast nichts, was in den Schlüsselschalter passen würde.",
        objective: "Bring den Aufzug in Gang.",
        hints: [
          "Der Schalter braucht einen Schlüssel. Auf welchem Anhänger stand etwas vom Aufzug?",
          "Schau dir den Schlüssel 217 im Rucksack genauer an.",
          "Benutze den Schlüssel 217 am Schlüsselschalter.",
        ],
        success: "Der Schlüssel dreht sich schwer. Irgendwo über dir setzt sich ein Motor in Bewegung, die Messingtüren gleiten auseinander. Der Zeiger wandert langsam auf die 2.",
        onSolve: [{ flag: "elevator_open" }, { sound: "elevator" }, { message: "m_aufzug" }],
      },
    },
    completeWhen: ["elevator"],
  });
})();
