/*
 * HOTEL NOCTURNE – Prolog (Inhalt)
 * 1. Fallakte: drei Seiten, jede/r liest im eigenen Tempo. Erzählt nur die OFFIZIELLE
 *    Version – genau die, die im Spiel widerlegt wird.
 * 2. Ankunft: kurze Szene (ca. 30 s), läuft von selbst, „Überspringen“ jederzeit.
 * Sprecher: Ist in config.js `introVoice: true` gesetzt, spielt die Engine zu jeder Seite/Szene
 * assets/audio/intro/<voice>.mp3 ab. Ohne Dateien funktioniert alles mit Text (Sprechertexte:
 * assets/audio/intro/SPRECHERTEXTE.md).
 */
(() => {
  const N = window.NOCTURNE;

  /* ---------- Szenenbilder ---------- */
  const rain = (n, x0, w, y0, h) => `<g stroke="#9fb2c4" stroke-opacity=".28" stroke-width="1.4" class="pz-rain">${Array.from({ length: n }, (_, i) => `<line x1="${x0 + (i * 53) % w}" y1="${y0 + (i * 37) % h}" x2="${x0 + (i * 53) % w - 10}" y2="${y0 + (i * 37) % h + 40}"/>`).join("")}</g>`;
  const svg = (body) => `<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;

  const zufahrt = svg(`
    <defs><linearGradient id="pz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070a"/><stop offset="1" stop-color="#1a1714"/></linearGradient>
      <radialGradient id="pz-win" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f3c77e" stop-opacity=".55"/><stop offset="1" stop-color="#f3c77e" stop-opacity="0"/></radialGradient>
      <linearGradient id="pz-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8dcc0" stop-opacity=".22"/><stop offset="1" stop-color="#e8dcc0" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="700" fill="url(#pz-sky)"/>
    <g class="pz-hotel"><polygon points="420,420 420,190 600,130 780,190 780,420" fill="#120f0c" stroke="#3a2e24" stroke-width="2"/>
      <text x="600" y="176" text-anchor="middle" fill="#8e7656" font-family="Playfair Display, serif" font-size="22" letter-spacing="6">NOCTURNE</text>
      <g fill="#0b0907">${[450, 520, 640, 710].map((x) => [220, 290, 350].map((y) => `<rect x="${x}" y="${y}" width="36" height="44"/>`).join("")).join("")}</g>
      <ellipse cx="658" cy="310" rx="60" ry="60" fill="url(#pz-win)" class="flicker"/><rect x="640" y="290" width="36" height="44" fill="#e7b46a" class="flicker"/></g>
    <polygon points="0,700 520,430 680,430 1200,700" fill="#0d0c0b"/><path d="M600 440 V700" stroke="#3a3428" stroke-width="4" stroke-dasharray="26 30"/>
    <polygon points="360,700 560,440 640,440 840,700" fill="url(#pz-beam)"/>
    ${rain(26, 60, 1100, 20, 600)}`);

  const eingang = svg(`
    <rect width="1200" height="700" fill="#0b0a09"/><rect x="300" y="60" width="600" height="640" fill="#17120e" stroke="#3a2e24" stroke-width="3"/>
    <path d="M430 220 a170 140 0 0 1 340 0" fill="none" stroke="#5b4430" stroke-width="5"/>
    <rect x="430" y="220" width="340" height="480" fill="#050403"/>
    <g class="pz-door-l"><rect x="430" y="220" width="170" height="480" fill="#2a1f16" stroke="#5b4430" stroke-width="3"/><rect x="560" y="440" width="10" height="50" fill="#b69a6d"/></g>
    <g class="pz-door-r"><rect x="600" y="220" width="170" height="480" fill="#2a1f16" stroke="#5b4430" stroke-width="3"/><rect x="630" y="440" width="10" height="50" fill="#b69a6d"/></g>
    <circle cx="350" cy="250" r="16" fill="#f3c77e" opacity=".5" class="flicker"/><circle cx="850" cy="250" r="16" fill="#f3c77e" opacity=".15"/>
    ${rain(20, 0, 1200, 0, 640)}`);

  const schwarz = svg(`<rect width="1200" height="700" fill="#000"/>`);

  /* ---------- Inhalt ---------- */
  N.prolog = {
    casefile: [
      {
        kicker: "FALL 014-10 · TEIL 1", title: "Die Nacht vom 14. Oktober 2009", voice: "01_die_nacht",
        html: `<p>Ein schweres Unwetter zieht über das Tal. Im Hotel Nocturne dringt Wasser in die unteren Geschosse.</p>
          <p>Um <b>23:17 Uhr</b> fällt der Strom aus.</p>
          <p>Als am Morgen die Feuerwehr eintrifft, ist das Hotel leer. Sechs Gäste fehlen. Und der Nachtmanager <b>Elias Voss</b>.</p>`,
      },
      {
        kicker: "FALL 014-10 · TEIL 2", title: "Die offizielle Version", voice: "02_offizielle_version",
        html: `<p>In den folgenden Tagen tauchen alle sechs Gäste wieder auf – unterkühlt, verstört, verstreut über die umliegenden Orte.</p>
          <p>Sie erinnern sich an völlige Dunkelheit. An eiskaltes Wasser. Und an einen Mann mit einer Taschenlampe, der sie durch einen engen Gang trieb.</p>
          <p>Eigentümer <b>Viktor Lehn</b> ist sicher: Voss habe den Strom abgestellt und die Gäste in den überfluteten Keller geführt. Um sie umzubringen.</p>
          <p>Gegen Elias Voss wird wegen versuchten Mordes in sechs Fällen ermittelt. Gefunden wird er nie. Das Hotel bleibt geschlossen.</p>`,
      },
      {
        kicker: "FALL 014-10 · TEIL 3", title: "Siebzehn Jahre später", voice: "03_einladung",
        html: `<p>Ein Umschlag ohne Absender. Darin eine Reservierung – auf deinen Namen.</p>
          <div class="pz-card"><p class="doc-head">HOTEL NOCTURNE<br><small>SEIT 1897</small></p>
            <table class="doc-kv"><tr><th>Reservierung</th><td>{name}</td></tr><tr><th>Zimmer</th><td>217</td></tr><tr><th>Check-in</th><td>14. Oktober, 23:17 Uhr</td></tr></table>
            <p class="handwriting">Vertrauen Sie nicht den offiziellen Aufzeichnungen.</p><p class="handwriting sign">– Elias Voss</p></div>`,
      },
    ],
    arrival: [
      { scene: zufahrt, text: "Kurz vor Mitternacht. Regen auf der Windschutzscheibe. Am Ende der Zufahrt brennt ein einziges Fenster.", ms: 6500, sound: "rumble", voice: "04_zufahrt" },
      { scene: eingang, text: "Die Eingangstür ist nicht verschlossen. Sie gibt nach, als hätte jemand gewartet.", ms: 6000, sound: "door", sceneClass: "open", voice: "05_eingang" },
      { scene: "lobby", text: "Die Lobby. Staub und Stille. Die Uhr über dem Empfang zeigt 23:17. Ihr Zeiger bewegt sich nicht.", ms: 6500, voice: "06_lobby" },
      { scene: schwarz, text: "Hinter dir fällt die Tür ins Schloss. Ein schwerer Riegel rastet ein.", ms: 4800, sound: ["door", "lever"], flash: true, voice: "07_riegel" },
    ],
  };

  /* Die Fallakte liegt danach auch in der Akte (für alle, die sie im Multiplayer übersprungen haben) */
  N.docs.fallakte = {
    title: "Fallakte 014-10 – die offizielle Version", kind: "letter", pageLabels: N.prolog.casefile.map((c) => c.title),
    pages: N.prolog.casefile.map((c) => `<p class="doc-head">${c.title}</p>${c.html}`),
  };
})();
