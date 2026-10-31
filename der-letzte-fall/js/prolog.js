/*
 * DER LETZTE FALL – Prolog (Inhalt)
 * 1. Fallakte: drei Seiten, jede/r liest im eigenen Tempo – die offizielle Version und die SMS.
 * 2. Ankunft: kurze Szene, läuft von selbst, „Überspringen“ jederzeit.
 */
(() => {
  const N = window.MRGAME;
  const rain = (n) => `<g stroke="#9fb2c4" stroke-opacity=".25" stroke-width="1.4" class="pz-rain">${Array.from({ length: n }, (_, i) => `<line x1="${(i * 53) % 1200}" y1="${(i * 37) % 640}" x2="${(i * 53) % 1200 - 10}" y2="${(i * 37) % 640 + 40}"/>`).join("")}</g>`;
  const svg = (body) => `<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;

  const praesidium = svg(`<rect width="1200" height="700" fill="#07080b"/>
    <rect x="300" y="140" width="600" height="440" fill="#14171b" stroke="#2b2f33" stroke-width="3"/>
    <g fill="#0b0d10">${[340, 440, 540, 640, 740, 820].map((x) => [180, 280, 380].map((y) => `<rect x="${x}" y="${y}" width="56" height="64"/>`).join("")).join("")}</g>
    <rect x="740" y="180" width="56" height="64" fill="#e7c88a" class="flicker"/><ellipse cx="768" cy="212" rx="70" ry="60" fill="#e7c88a" opacity=".12"/>
    <rect x="520" y="480" width="160" height="100" fill="#0a0b0d" stroke="#3d4248" stroke-width="3"/><text x="600" y="130" text-anchor="middle" fill="#8a8f88" font-family="DM Mono, monospace" font-size="16" letter-spacing="8">POLIZEI</text>
    <rect y="580" width="1200" height="120" fill="#0d0c0b"/>${rain(26)}`);
  const flur = svg(`<rect width="1200" height="700" fill="#0b0c0e"/><polygon points="0,0 480,220 480,520 0,700" fill="#16191d"/><polygon points="1200,0 720,220 720,520 1200,700" fill="#16191d"/>
    <rect x="480" y="220" width="240" height="300" fill="#0a0b0d"/><rect x="560" y="300" width="80" height="220" fill="#e7c88a" opacity=".55" class="flicker"/>
    <text x="600" y="290" text-anchor="middle" fill="#8a8f88" font-family="DM Mono, monospace" font-size="12" letter-spacing="3">321</text>
    <polygon points="0,700 480,520 720,520 1200,700" fill="#101214"/>`);
  const schwarz = svg(`<rect width="1200" height="700" fill="#000"/>`);

  N.prolog = {
    casefile: [
      {
        kicker: "FALL 0911-R · TEIL 1", title: "Montag, 9. November 2026",
        html: `<p>Stadttheater Velden, Abendprobe von „Die Nacht der Masken“. Um <b>21:44 Uhr</b> geht für die Mondszene das Licht aus.</p>
          <p>Zwölf Sekunden später stürzt der „Mond“ herab – 180 Kilogramm, aufgehängt an Zug 12 – und erschlägt Intendant <b>Anton Reuter</b>.</p>
          <p>Zwei Wochen vorher hatte Zug 12 eine Störung. Für die Dienststelle ist der Fall klar: ein technischer Defekt.</p>`,
      },
      {
        kicker: "FALL 0911-R · TEIL 2", title: "Der Kommissar, der zweifelt",
        html: `<p>Hauptkommissar <b>Rainer Hagedorn</b> glaubt nicht an den Unfall. Zwei Tage lang baut er in seinem Büro eine Wand auf: Fotos, Protokolle, Fäden.</p>
          <p>Am Mittwochabend fährt er allein ins Theater. Danach ist er nicht mehr zu erreichen.</p>
          <p>Um 21:58 Uhr kommt von seinem Telefon eine Nachricht an dich:</p>
          <div class="pz-card"><p class="handwriting">Brauche ein paar Tage Abstand. Der Fall war ein Unfall. – R.H.</p></div>
          <p>Am Donnerstag schließt Kriminalrat Dr. Wessel die Akte.</p>`,
      },
      {
        kicker: "FALL 0911-R · TEIL 3", title: "Freitagnacht",
        html: `<p>Du warst die ganze Woche auf einer Fortbildung, dein Diensthandy lag im Büro. Heute Abend bist du zurück.</p>
          <p>Seit zwölf Jahren unterschreibt Hagedorn jede Notiz mit einem einzigen Buchstaben: <b>„H.“</b> Nie mit „R.H.“.</p>
          <p>Es ist Freitag, 22:00 Uhr. Das Präsidium ist fast leer. In seinem Büro brennt noch Licht.</p>`,
      },
    ],
    arrival: [
      { scene: praesidium, text: "Freitag, 22:00. Regen. Im dritten Stock brennt ein einziges Fenster.", ms: 6000, sound: "rumble" },
      { scene: flur, text: "Der Flur ist leer. Zimmer 321 – Hagedorns Tür ist nur angelehnt.", ms: 5500, sound: "step" },
      { scene: "lobby", text: "Seine Wand. Fäden, Fotos, Notizen. Und quer darunter, in seiner Schrift: „Mond fällt 21:44“.", ms: 6500 },
      { scene: schwarz, text: "Dein Telefon vibriert nicht mehr. Die letzte Nachricht ist zwei Tage alt.", ms: 4500 },
    ],
  };

  N.docs.fallakte = {
    title: "Fallakte 0911-R – die offizielle Version", kind: "letter", pageLabels: N.prolog.casefile.map((c) => c.title),
    pages: N.prolog.casefile.map((c) => `<p class="doc-head">${c.title}</p>${c.html}`),
  };
})();
