/*
 * STATION 1 – DIE REZEPTION
 * Musterraum für alle weiteren Stationen.
 *
 * Aufbau eines Raums:
 *   scene     – Raumbild (SVG oder <img>). Elemente mit data-if="flag" / data-unless="flag"
 *               werden abhängig vom Spielzustand ein- bzw. ausgeblendet.
 *   hotspots  – anklickbare Bereiche (Koordinaten in Prozent der Szene).
 *   puzzles   – Rätsel des Raums, inklusive drei Hinweisstufen.
 *   completeWhen – Rätsel, die gelöst sein müssen, damit der nächste Raum freigeschaltet wird.
 */
(() => {
  const N = window.NOCTURNE;

  /* ---------- Gegenstände ---------- */
  Object.assign(N.items, {
    key217: {
      name: "Schlüssel 217",
      icon: "⚿",
      text: "Ein schwerer Messingschlüssel. Auf dem Anhänger ist „217“ eingeprägt, auf der Rückseite klein: „gilt auch für den Aufzug“.",
    },
    hotelplan: {
      name: "Hotelplan",
      icon: "▦",
      text: "Ein gefalteter Gebäudeplan des Hotel Nocturne, Stand 2009.",
      doc: "hotelplan",
    },
  });

  /* ---------- Dokumente (landen beim Lesen in der Beweismappe) ---------- */
  Object.assign(N.docs, {
    reservierung: {
      title: "Reservierungsbestätigung",
      kind: "letter",
      html: `
        <p class="doc-head">HOTEL NOCTURNE<br><small>SEIT 1897</small></p>
        <table class="doc-kv">
          <tr><th>Reservierung</th><td>{name}</td></tr>
          <tr><th>Zimmer</th><td>217</td></tr>
          <tr><th>Check-in</th><td>23:17 Uhr</td></tr>
          <tr><th>Check-out</th><td><em>Nicht vorgesehen.</em></td></tr>
        </table>
        <p class="handwriting">Wenn Sie diese Nachricht lesen, hat das Hotel wieder jemanden aufgenommen.
        Finden Sie heraus, was in jener Nacht geschehen ist.
        Vertrauen Sie nicht den offiziellen Aufzeichnungen.</p>
        <p class="handwriting sign">– Elias Voss</p>`,
    },
    tresenzettel: {
      title: "Zettel auf dem Tresen",
      kind: "note",
      html: `<p class="handwriting big">Der Schlüssel liegt dort,<br>wo der Gast eingecheckt hat.<br><br>Die Uhr erinnert sich.</p>`,
    },
    gaesteregister: {
      title: "Gästeregister, 14.10.2009",
      kind: "register",
      html: `
        <p class="doc-head">GÄSTEREGISTER<br><small>MITTWOCH, 14. OKTOBER 2009</small></p>
        <table class="doc-table">
          <thead><tr><th>Gast</th><th>Zimmer</th><th>Check-in</th><th>Vermerk</th></tr></thead>
          <tbody>
            <tr class="struck"><td>H. Marquardt</td><td>217</td><td>16:40</td><td>storniert</td></tr>
            <tr><td>R. Hallström</td><td>208</td><td>19:52</td><td></td></tr>
            <tr><td>L. Berger</td><td>201</td><td>20:14</td><td></td></tr>
            <tr><td>M. Vale</td><td>217</td><td>21:17</td><td>bar, im Voraus</td></tr>
            <tr><td>J. Winter</td><td>214</td><td>21:31</td><td></td></tr>
            <tr><td>A. Stern</td><td>220</td><td>22:08</td><td></td></tr>
            <tr><td>K. Doran</td><td>211</td><td>22:46</td><td>Spätanreise</td></tr>
          </tbody>
        </table>
        <p class="handwriting margin">Manchmal steckt die Antwort schon in der Zimmernummer.
        Zählt nur die letzte Buchung, die genau zum Zimmer passt.</p>`,
    },
    anrufbeantworter: {
      title: "Anrufbeantworter, Nachricht 1",
      kind: "log",
      html: `
        <p class="mono dim">NACHRICHT 1 VON 1 · 14.10.2009 · 22:51</p>
        <p class="mono">[Rauschen. Regen im Hintergrund.]</p>
        <p class="mono">„Hier ist Elias. Hör zu – falls jemand nach Zimmer 217 fragt:
        Der Gast steht im Buch, aber nicht unter dem richtigen Namen.
        Die Buchung von heute Nachmittag ist storniert, die zählt nicht.
        Und verlass dich nicht auf die Uhr über dem Empfang.
        Die geht nur noch so lange, bis …“</p>
        <p class="mono">[Die Aufnahme bricht ab.]</p>`,
    },
    abrechnung: {
      title: "Abrechnungsordner Oktober 2009",
      kind: "register",
      html: `
        <p class="doc-head">ABRECHNUNG<br><small>NACHT 14./15. OKTOBER 2009</small></p>
        <table class="doc-table">
          <thead><tr><th>Zimmer</th><th>Gast</th><th>Betrag</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>201</td><td>L. Berger</td><td>189,00 €</td><td>offen</td></tr>
            <tr><td>208</td><td>R. Hallström</td><td>164,00 €</td><td>offen</td></tr>
            <tr><td>211</td><td>K. Doran</td><td>164,00 €</td><td>offen</td></tr>
            <tr><td>214</td><td>J. Winter</td><td>189,00 €</td><td>offen</td></tr>
            <tr><td>220</td><td>A. Stern</td><td>212,00 €</td><td>offen</td></tr>
          </tbody>
        </table>
        <p class="mono dim">Summe: 5 Zimmer · keiner der Gäste hat ausgecheckt.</p>`,
    },
    keyboxnotiz: {
      title: "Notiz aus dem Schlüsselkasten",
      kind: "note",
      html: `<p class="handwriting big">Nicht jeder Gast, der eincheckt,<br>erscheint später in der Abrechnung.</p>`,
    },
    hotelplan: {
      title: "Hotelplan (Stand 2009)",
      kind: "plan",
      html: `
        <svg viewBox="0 0 600 400" class="plan-svg" role="img" aria-label="Gebäudeplan des Hotel Nocturne">
          <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#6b4a3a" stroke-width="3"/></pattern></defs>
          <text x="20" y="28" class="plan-title">ERDGESCHOSS</text>
          <rect x="120" y="45" width="460" height="150" class="plan-wall"/>
          <rect x="120" y="45" width="110" height="150" class="plan-room dark"/><text x="175" y="115" class="plan-label">WESTFLÜGEL</text><text x="175" y="131" class="plan-small">Verwaltung</text>
          <rect x="230" y="45" width="190" height="150" class="plan-room"/><text x="325" y="120" class="plan-label">EMPFANGSHALLE</text>
          <rect x="420" y="45" width="80" height="150" class="plan-room"/><text x="460" y="115" class="plan-label">ARCHIV</text>
          <rect x="500" y="45" width="80" height="150" class="plan-room"/><text x="540" y="110" class="plan-label">AUFZUG</text><text x="540" y="126" class="plan-small">Treppe</text>
          <text x="20" y="232" class="plan-title">UNTERGESCHOSS</text>
          <rect x="120" y="250" width="460" height="110" class="plan-wall"/>
          <rect x="20" y="285" width="100" height="40" fill="url(#hatch)" class="plan-tunnel"/>
          <rect x="120" y="250" width="170" height="110" class="plan-room"/><text x="205" y="310" class="plan-label">TECHNIK</text>
          <rect x="290" y="250" width="170" height="110" class="plan-room"/><text x="375" y="310" class="plan-label">GEPÄCKLAGER</text>
          <rect x="460" y="250" width="120" height="110" class="plan-room"/><text x="520" y="305" class="plan-label">SICHERHEIT</text><text x="520" y="321" class="plan-small">Kameras</text>
          <text x="20" y="384" class="plan-small warn" text-anchor="start" style="text-anchor:start">◤ SERVICETUNNEL WEST – DAUERHAFT VERSCHLOSSEN</text>
        </svg>
        <p class="mono dim">Obergeschosse 1–3: Gästezimmer 101–320 (nicht abgebildet).</p>`,
    },
  });

  /* ---------- Szene ---------- */
  const scene = `
<svg viewBox="0 0 1600 1000" class="scene-art" aria-hidden="true">
  <defs>
    <linearGradient id="rz-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16120f"/><stop offset=".6" stop-color="#2a2019"/><stop offset="1" stop-color="#1a140f"/></linearGradient>
    <linearGradient id="rz-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1511"/><stop offset="1" stop-color="#090706"/></linearGradient>
    <linearGradient id="rz-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3423"/><stop offset="1" stop-color="#1e140d"/></linearGradient>
    <linearGradient id="rz-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b67a"/><stop offset=".5" stop-color="#8e6a3a"/><stop offset="1" stop-color="#c9a466"/></linearGradient>
    <radialGradient id="rz-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f0c27a" stop-opacity=".42"/><stop offset="1" stop-color="#f0c27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rz-vignette" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <pattern id="rz-paper" width="60" height="1000" patternUnits="userSpaceOnUse"><rect width="60" height="1000" fill="none"/><line x1="30" y1="0" x2="30" y2="1000" stroke="#ffffff" stroke-opacity=".025" stroke-width="14"/></pattern>
  </defs>

  <!-- Wand, Tapete, Boden -->
  <rect width="1600" height="1000" fill="url(#rz-wall)"/>
  <rect width="1600" height="840" fill="url(#rz-paper)"/>
  <rect y="0" width="1600" height="56" fill="#100c0a"/>
  <rect y="56" width="1600" height="6" fill="#5b4430"/>
  <rect y="840" width="1600" height="160" fill="url(#rz-floor)"/>
  <g stroke="#2a2019" stroke-width="2" opacity=".7">
    <line x1="0" y1="880" x2="1600" y2="880"/><line x1="0" y1="935" x2="1600" y2="935"/>
    <line x1="200" y1="840" x2="60" y2="1000"/><line x1="560" y1="840" x2="500" y2="1000"/><line x1="1040" y1="840" x2="1100" y2="1000"/><line x1="1400" y1="840" x2="1540" y2="1000"/>
  </g>

  <!-- Wanduhr (steht auf 23:17) -->
  <g transform="translate(800,170)">
    <circle r="86" fill="#2c2117"/>
    <circle r="76" fill="#d8c8a6" stroke="url(#rz-brass)" stroke-width="9"/>
    <g stroke="#3a2c1e" stroke-width="3">
      <line y1="-66" y2="-56"/><line y1="66" y2="56"/><line x1="-66" x2="-56"/><line x1="66" x2="56"/>
      <line y1="-66" y2="-60" transform="rotate(30)"/><line y1="-66" y2="-60" transform="rotate(60)"/><line y1="-66" y2="-60" transform="rotate(120)"/><line y1="-66" y2="-60" transform="rotate(150)"/>
      <line y1="-66" y2="-60" transform="rotate(210)"/><line y1="-66" y2="-60" transform="rotate(240)"/><line y1="-66" y2="-60" transform="rotate(300)"/><line y1="-66" y2="-60" transform="rotate(330)"/>
    </g>
    <line y2="-38" stroke="#1d150e" stroke-width="7" stroke-linecap="round" transform="rotate(338.5)"/>
    <line y2="-60" stroke="#1d150e" stroke-width="4" stroke-linecap="round" transform="rotate(102)"/>
    <circle r="6" fill="#1d150e"/>
    <path d="M-40 30 L40 -32" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
  </g>
  <text x="800" y="290" text-anchor="middle" fill="#8e7656" font-family="DM Mono, monospace" font-size="15" letter-spacing="6">REZEPTION</text>

  <!-- Schlüsselkasten -->
  <g>
    <rect x="178" y="228" width="244" height="304" rx="4" fill="#120d0a"/>
    <rect x="186" y="236" width="228" height="288" fill="#2a1d14" stroke="#5a412b" stroke-width="3"/>
    <g fill="url(#rz-brass)">
      <circle cx="226" cy="290" r="5"/><circle cx="286" cy="290" r="5"/><circle cx="346" cy="290" r="5"/><circle cx="396" cy="290" r="5"/>
      <circle cx="226" cy="380" r="5"/><circle cx="286" cy="380" r="5"/><circle cx="346" cy="380" r="5"/><circle cx="396" cy="380" r="5"/>
      <circle cx="226" cy="470" r="5"/><circle cx="286" cy="470" r="5"/><circle cx="346" cy="470" r="5"/><circle cx="396" cy="470" r="5"/>
    </g>
    <g fill="#9c7a48" opacity=".9">
      <rect x="221" y="296" width="10" height="40" rx="2"/><rect x="281" y="296" width="10" height="40" rx="2"/><rect x="391" y="296" width="10" height="40" rx="2"/>
      <rect x="221" y="386" width="10" height="40" rx="2"/><rect x="341" y="386" width="10" height="40" rx="2"/><rect x="391" y="386" width="10" height="40" rx="2"/>
      <rect x="281" y="476" width="10" height="40" rx="2"/><rect x="341" y="476" width="10" height="40" rx="2"/><rect x="391" y="476" width="10" height="40" rx="2"/>
    </g>
    <text x="346" y="350" text-anchor="middle" fill="#c9a466" font-family="DM Mono, monospace" font-size="13">217</text>
    <!-- Tür geschlossen -->
    <g data-unless="keybox_open">
      <rect x="186" y="236" width="228" height="288" fill="#3a281b" stroke="#6b4e33" stroke-width="3"/>
      <rect x="206" y="256" width="188" height="248" fill="none" stroke="#5a412b" stroke-width="2"/>
      <text x="300" y="300" text-anchor="middle" fill="#a88a5c" font-family="DM Mono, monospace" font-size="15" letter-spacing="4">SCHLÜSSEL</text>
      <rect x="262" y="360" width="76" height="96" rx="4" fill="#15100c" stroke="url(#rz-brass)" stroke-width="3"/>
      <g fill="#6d5536"><rect x="272" y="372" width="16" height="12"/><rect x="292" y="372" width="16" height="12"/><rect x="312" y="372" width="16" height="12"/><rect x="272" y="390" width="16" height="12"/><rect x="292" y="390" width="16" height="12"/><rect x="312" y="390" width="16" height="12"/><rect x="272" y="408" width="16" height="12"/><rect x="292" y="408" width="16" height="12"/><rect x="312" y="408" width="16" height="12"/><rect x="292" y="426" width="16" height="12"/></g>
      <circle cx="330" cy="446" r="3" fill="#a3473c"/>
    </g>
    <!-- Tür offen -->
    <g data-if="keybox_open">
      <polygon points="186,236 136,256 136,504 186,524" fill="#3a281b" stroke="#6b4e33" stroke-width="3"/>
      <circle cx="346" cy="380" r="16" fill="none" stroke="#e0c085" stroke-width="2" stroke-dasharray="4 4"/>
    </g>
  </g>

  <!-- Regal mit Ordnern -->
  <g>
    <rect x="1050" y="250" width="260" height="10" fill="#4b3423"/>
    <rect x="1050" y="420" width="260" height="14" fill="#4b3423"/>
    <rect x="1070" y="290" width="34" height="130" fill="#4a1f1c"/><rect x="1108" y="296" width="30" height="124" fill="#2c3a33"/>
    <rect x="1142" y="284" width="38" height="136" fill="#5b4a2f"/><rect x="1184" y="300" width="28" height="120" fill="#3b2a22"/>
    <rect x="1216" y="292" width="34" height="128" fill="#4a1f1c"/><polygon points="1256,420 1270,300 1300,304 1290,420" fill="#2f2620"/>
    <rect x="1147" y="320" width="28" height="44" fill="#d8c8a6" opacity=".85"/>
    <text x="1161" y="336" text-anchor="middle" fill="#2c2117" font-family="DM Mono, monospace" font-size="9">ABR.</text>
    <text x="1161" y="352" text-anchor="middle" fill="#2c2117" font-family="DM Mono, monospace" font-size="9">10/09</text>
  </g>

  <!-- Aufzug -->
  <g>
    <rect x="1372" y="246" width="196" height="594" fill="#0f0b09"/>
    <rect x="1382" y="256" width="176" height="584" fill="url(#rz-brass)" opacity=".55"/>
    <path d="M1420 225 A50 50 0 0 1 1520 225" fill="none" stroke="url(#rz-brass)" stroke-width="5"/>
    <line x1="1470" y1="225" x2="1446" y2="190" stroke="#c9a466" stroke-width="3"/>
    <text x="1470" y="170" text-anchor="middle" fill="#a88a5c" font-family="DM Mono, monospace" font-size="12" letter-spacing="3">AUFZUG</text>
    <g data-unless="elevator_open">
      <rect x="1392" y="266" width="77" height="574" fill="#3d2e20" stroke="#7a5e3c" stroke-width="2"/>
      <rect x="1471" y="266" width="77" height="574" fill="#3d2e20" stroke="#7a5e3c" stroke-width="2"/>
      <rect x="1404" y="300" width="53" height="500" fill="none" stroke="#5a412b"/><rect x="1483" y="300" width="53" height="500" fill="none" stroke="#5a412b"/>
    </g>
    <g data-if="elevator_open">
      <rect x="1392" y="266" width="156" height="574" fill="#e8c27e" opacity=".22"/>
      <rect x="1392" y="266" width="18" height="574" fill="#3d2e20"/><rect x="1530" y="266" width="18" height="574" fill="#3d2e20"/>
    </g>
    <rect x="1340" y="520" width="26" height="70" rx="3" fill="#1d150e" stroke="url(#rz-brass)" stroke-width="2"/>
    <circle cx="1353" cy="540" r="6" fill="#c9a466"/><rect x="1351" y="556" width="4" height="22" fill="#c9a466"/>
  </g>

  <!-- Lampe -->
  <ellipse cx="1180" cy="520" rx="260" ry="200" fill="url(#rz-glow)"/>
  <rect x="1172" y="510" width="16" height="78" fill="url(#rz-brass)"/>
  <polygon points="1130,512 1230,512 1206,456 1154,456" fill="#5b3f27" stroke="#2d1f14"/>

  <!-- Tresen -->
  <rect x="200" y="584" width="1200" height="30" fill="#5c412b"/>
  <rect x="200" y="584" width="1200" height="4" fill="#8c6a45"/>
  <rect x="226" y="614" width="1148" height="290" fill="url(#rz-wood)"/>
  <g fill="none" stroke="#5a412b" stroke-width="2">
    <rect x="260" y="650" width="240" height="210"/><rect x="540" y="650" width="240" height="210"/><rect x="820" y="650" width="240" height="210"/><rect x="1100" y="650" width="240" height="210"/>
  </g>

  <!-- Telefon -->
  <g>
    <rect x="432" y="548" width="104" height="40" rx="8" fill="#1a1411" stroke="#3b2d22"/>
    <path d="M428 548 q54 -40 112 0 l-16 6 q-40 -22 -80 0 z" fill="#241b15" stroke="#3b2d22"/>
    <circle cx="484" cy="568" r="12" fill="#2e241d" stroke="#5a4532"/>
    <circle cx="520" cy="560" r="4" fill="#d4443a"><animate attributeName="opacity" values="1;.15;1" dur="1.6s" repeatCount="indefinite"/></circle>
    <path d="M536 572 q20 10 6 20 t10 18" fill="none" stroke="#241b15" stroke-width="3"/>
  </g>

  <!-- Gästeregister -->
  <g>
    <polygon points="640,596 752,588 752,548 650,556" fill="#e3d4b4"/>
    <polygon points="864,596 752,588 752,548 854,556" fill="#d8c8a6"/>
    <g stroke="#8a7656" stroke-width="1.5" opacity=".8">
      <line x1="664" y1="566" x2="740" y2="560"/><line x1="664" y1="574" x2="740" y2="568"/><line x1="664" y1="582" x2="736" y2="577"/>
      <line x1="764" y1="560" x2="840" y2="566"/><line x1="764" y1="568" x2="840" y2="574"/><line x1="764" y1="576" x2="834" y2="581"/>
    </g>
    <line x1="752" y1="548" x2="752" y2="590" stroke="#6b5538" stroke-width="2"/>
    <rect x="745" y="586" width="10" height="16" fill="#7a2a24"/>
  </g>

  <!-- Zettel -->
  <g transform="rotate(-6 945 584)">
    <rect x="905" y="566" width="82" height="34" fill="#efe4ca"/>
    <g stroke="#6c5a44" stroke-width="1.4"><line x1="914" y1="577" x2="976" y2="577"/><line x1="914" y1="586" x2="966" y2="586"/></g>
  </g>

  <!-- Klingel -->
  <g>
    <ellipse cx="1044" cy="590" rx="34" ry="6" fill="#2a1f16"/>
    <path d="M1014 588 a30 26 0 0 1 60 0 z" fill="url(#rz-brass)"/>
    <rect x="1040" y="556" width="8" height="8" rx="2" fill="#c9a466"/>
  </g>

  <rect width="1600" height="1000" fill="url(#rz-vignette)"/>
</svg>`;

  /* ---------- Raum ---------- */
  N.rooms.push({
    id: "rezeption",
    name: "Rezeption",
    title: "Die Rezeption",
    kicker: "HOTEL NOCTURNE / ERDGESCHOSS",
    story:
      "Die Lobby ist still. Draußen prasselt Regen gegen die Fenster. Die Uhr über dem Empfang steht – " +
      "und doch hört man irgendwo ein leises Ticken. Am Telefon blinkt ein rotes Licht.",
    ambient: "tick",
    scene,
    hotspots: [
      {
        id: "uhr", label: "Wanduhr", x: 45.5, y: 7.5, w: 9, h: 18,
        title: "Die Wanduhr",
        text: "Die Zeiger stehen auf <b>23:17</b>. Das Glas ist gesprungen, das Pendel hängt still. " +
          "Vier Ziffern, festgehalten seit siebzehn Jahren – die Uhr erinnert sich an die Nacht, in der der Strom ausfiel.",
      },
      {
        id: "zettel", label: "Zettel", x: 55.5, y: 55, w: 7, h: 6.5,
        title: "Ein Zettel auf dem Tresen",
        doc: "tresenzettel",
      },
      {
        id: "register", label: "Gästeregister", x: 39.5, y: 53.5, w: 15, h: 8,
        title: "Das Gästeregister",
        text: "Das Buch ist beim 14. Oktober 2009 aufgeschlagen. Ein rotes Lesebändchen markiert die Seite.",
        doc: "gaesteregister",
      },
      {
        id: "telefon", label: "Telefon", x: 26.5, y: 51, w: 8, h: 8.5,
        title: "Das Telefon",
        text: "Ein altes Tischtelefon mit eingebautem Anrufbeantworter. Das rote Lämpchen blinkt. Du drückst auf Wiedergabe.",
        doc: "anrufbeantworter",
        sound: "phone",
      },
      {
        id: "schluesselkasten", label: "Schlüsselkasten", x: 11, y: 22.5, w: 15.5, h: 31,
        title: "Der Schlüsselkasten",
        lock: "keybox",
      },
      {
        id: "regal", label: "Aktenregal", x: 65.5, y: 24, w: 16.5, h: 19,
        title: "Das Aktenregal",
        text: "Zwischen verstaubten Ordnern steckt einer mit der Aufschrift „ABR. 10/09“.",
        doc: "abrechnung",
      },
      {
        id: "klingel", label: "Tischklingel", x: 63, y: 54, w: 5.5, h: 6.5,
        title: "Die Tischklingel",
        text: "<i>Ding.</i> Niemand kommt. Irgendwo tief im Haus antwortet – sehr leise – ein zweites Klingeln.",
        sound: "bell",
      },
      {
        id: "aufzug", label: "Aufzug", x: 83.5, y: 16, w: 15.5, h: 68,
        title: "Der Aufzug",
        text: "Die Messingtüren sind geschlossen. Der Rufknopf reagiert nicht. Daneben sitzt ein Schlüsselschalter mit der Gravur „NUR FÜR GÄSTE“.",
        use: "elevator",
      },
    ],
    puzzles: {
      keybox: {
        type: "code",
        length: 4,
        title: "Zahlenschloss",
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
        success: "Mit einem satten Klacken springt die Tür auf. Am Haken mit der Nummer 217 hängt ein schwerer Schlüssel. Dahinter steckt ein gefalteter Hotelplan – und eine Notiz.",
        onSolve: [{ flag: "keybox_open" }, { give: "key217" }, { give: "hotelplan" }, { doc: "keyboxnotiz" }],
      },
      elevator: {
        type: "use",
        item: "key217",
        title: "Schlüsselschalter",
        wrongItem: "Das passt nicht in den Schlüsselschalter.",
        noItems: "Du hast nichts, was in den Schlüsselschalter passen würde.",
        objective: "Finde einen Weg in die zweite Etage.",
        hints: [
          "Der Aufzug braucht einen Schlüssel. Hast du schon alles an der Rezeption geöffnet?",
          "Im Schlüsselkasten war etwas für dich. Untersuche danach den Aufzug.",
          "Benutze den Schlüssel 217 am Schlüsselschalter des Aufzugs.",
        ],
        success: "Der Schlüssel dreht sich schwer. Irgendwo über dir setzt sich ein Motor in Bewegung, die Messingtüren gleiten auseinander. Der Zeiger über der Tür wandert langsam auf die 2.",
        onSolve: [{ flag: "elevator_open" }, { sound: "elevator" }],
      },
    },
    completeWhen: ["elevator"],
  });
})();
