/*
 * DER LETZTE FALL – Hagedorns Ermittlungswand (Startzustand) und Testbeweise für den Prototyp.
 * Inhalte laut RAETSELDESIGN.md, Abschnitt 5.1.
 */
(() => {
  "use strict";
  const portrait = (hair, coat, skin = "#c8a98a") => `<svg viewBox="0 0 130 150" preserveAspectRatio="xMidYMid slice"><rect width="130" height="150" fill="#2a2d33"/><rect width="130" height="150" fill="#000" opacity=".15"/>
    <path d="M20 150 q4 -46 45 -50 q41 4 45 50 z" fill="${coat}"/><ellipse cx="65" cy="66" rx="24" ry="29" fill="${skin}"/>${hair}
    <rect width="130" height="150" fill="#d8c8a8" opacity=".12"/></svg>`;
  const docArt = (lines) => `<svg viewBox="0 0 180 80" preserveAspectRatio="xMidYMid meet"><g stroke="#8a7a62" stroke-width="2">${lines.map((w, i) => `<line x1="6" y1="${10 + i * 14}" x2="${w}" y2="${10 + i * 14}"/>`).join("")}</g></svg>`;
  const paper = (html) => `<article class="pv-paper">${html}</article>`;

  window.DLF_WALL = {
    cards: [
      { id: "mond", kind: "photo", x: 1180, y: 110, rot: -2, title: "Der Mond, 21:45", sub: "Tatortfoto, Bühne Mitte",
        art: `<svg viewBox="0 0 130 150" preserveAspectRatio="xMidYMid slice"><rect width="130" height="150" fill="#111"/><rect y="105" width="130" height="45" fill="#2a2018"/><ellipse cx="62" cy="112" rx="40" ry="14" fill="#c9b98a"/><path d="M30 108 l20 -8 l14 10 l22 -6" stroke="#6b5a3a" stroke-width="2" fill="none"/><rect x="58" y="20" width="2" height="70" fill="#555"/><circle cx="20" cy="20" r="30" fill="#fff" opacity=".08"/></svg>`,
        body: paper(`<p class="pv-head">TATORTFOTO · 9.11.2026 · 21:45</p><p>Bühne Mitte. Das Bühnenelement „Mond“ (Zug 12, ca. 180 kg) liegt auf der Markierung „Mitte“. Die Aufhängung ist intakt, die Bremse offen.</p><p class="pv-hand">Kein Seilriss. Wer lässt so etwas „von selbst“ fallen? – H.</p>`) },
      { id: "mira", kind: "photo", x: 420, y: 760, rot: 3, title: "Mira Seidel", sub: "Hauptdarstellerin",
        art: portrait(`<path d="M40 60 q2 -34 25 -36 q24 2 26 36 q-6 -14 -26 -16 q-19 2 -25 16 z" fill="#5b2a20"/><path d="M40 60 q-4 30 6 52 M90 60 q4 30 -6 52" stroke="#5b2a20" stroke-width="9" fill="none"/>`, "#3a2333"),
        body: paper(`<p class="pv-head">VERNEHMUNG M. SEIDEL · 10.11.</p><p>„Ja, wir haben uns am Vormittag gestritten. Er wollte mir die Rolle wegnehmen. Aber ich stand im Blackout an der Rampe und habe meinen Monolog gesprochen.“</p>`) },
      { id: "timo", kind: "photo", x: 860, y: 860, rot: -3, title: "Timo Brandt", sub: "Beleuchter, Bühnentechnik",
        art: portrait(`<path d="M42 52 q6 -26 23 -26 q20 0 24 26 q-12 -8 -24 -8 q-13 0 -23 8 z" fill="#2b2b2b"/>`, "#2e3b30"),
        body: paper(`<p class="pv-head">VERNEHMUNG T. BRANDT · 10.11.</p><p>„Ich habe um 21:10 die Sicherheitskontrolle gemacht, alles war gesteckt. Im Blackout war ich am Lichtpult, wie immer.“</p>`) },
      { id: "ruth", kind: "photo", x: 1560, y: 860, rot: 2, title: "Ruth Eilers", sub: "Kostümbildnerin",
        art: portrait(`<path d="M38 66 q0 -40 27 -42 q28 2 27 42 q-6 -20 -27 -22 q-21 2 -27 22 z" fill="#9a9a9a"/><circle cx="65" cy="30" r="10" fill="#9a9a9a"/>`, "#4a2a2a", "#d2b398"),
        body: paper(`<p class="pv-head">VERNEHMUNG R. EILERS · 10.11.</p><p>„Rote Fasern? Ich nähe in diesem Haus seit zwanzig Jahren alles, was rot ist.“</p>`) },
      { id: "keller", kind: "photo", x: 2040, y: 760, rot: -2, title: "Jannis Keller", sub: "Verwaltungsdirektor",
        art: portrait(`<path d="M42 54 q4 -28 23 -28 q22 0 24 28 q-4 -12 -24 -12 q-19 0 -23 12 z" fill="#6b5236"/><rect x="48" y="62" width="34" height="8" rx="4" fill="none" stroke="#222" stroke-width="2"/>`, "#22262e"),
        body: paper(`<p class="pv-head">VERNEHMUNG J. KELLER · 10.11.</p><p>„Ich habe das Haus gegen halb zehn verlassen, der Pförtner hat mich gesehen. Vom Unfall habe ich erst zu Hause erfahren.“</p>`) },
      { id: "dienstplan", kind: "doc", x: 170, y: 200, rot: -1, title: "Dienstplan Probe", sub: "Montag, 9.11.2026",
        art: docArt([150, 120, 160, 100]),
        body: paper(`<p class="pv-head">DIENSTPLAN ABENDPROBE · 9.11.2026</p><table class="pv-table"><tr><td>Reuter</td><td>Regie, Mondszene selbst</td></tr><tr><td>Seidel</td><td>Hauptrolle</td></tr><tr><td>Brandt</td><td>Lichtpult</td></tr><tr><td>Eilers</td><td>Kostüm bis 18:00</td></tr><tr><td>Keller</td><td>Verwaltung, bis ca. 21:30</td></tr></table>`) },
      { id: "zug12", kind: "doc", x: 1720, y: 230, rot: 2, title: "Schema Zug 12", sub: "Obermaschinerie",
        art: `<svg viewBox="0 0 180 80" preserveAspectRatio="xMidYMid meet"><g stroke="#2a2119" stroke-width="2" fill="none"><line x1="20" y1="10" x2="160" y2="10"/><line x1="90" y1="10" x2="90" y2="50"/><circle cx="90" cy="60" r="12"/><rect x="130" y="40" width="30" height="20"/></g><text x="134" y="54" font-size="10" fill="#2a2119">B3</text></svg>`,
        body: paper(`<p class="pv-head">SCHEMA ZUG 12 · „MOND“</p><p>Motorzug, Federspeicherbremse B3. Handablass auf dem Schnürboden, im Probenbetrieb gesichert mit Steckstift.</p><p class="pv-hand">Welcher Stift? – H.</p>`) },
      { id: "pfoertner", kind: "doc", x: 1660, y: 1250, rot: -2, title: "Pförtnerbuch", sub: "Keller geht 21:33",
        art: docArt([120, 160, 140]),
        body: paper(`<p class="pv-head">PFÖRTNERBUCH · 9.11.</p><table class="pv-table"><tr><td>21:33</td><td>Keller, Verwaltung – „Feierabend“</td></tr></table><p class="pv-small">Zeit nach der Foyeruhr eingetragen.</p>`) },
      { id: "seitentuer", kind: "doc", x: 2160, y: 1280, rot: 3, title: "Protokoll Seitentür", sub: "Karte 4417 · 21:29",
        art: docArt([160, 90, 150]),
        body: paper(`<p class="pv-head">ZUTRITT SEITENTÜR · SERVERZEIT</p><table class="pv-table"><tr><td>21:29:41</td><td>Karte 4417 – Keller, J.</td></tr></table>`) },
      { id: "n-blackout", type: "note", author: "hagedorn", x: 190, y: 470, rot: -4, color: "#f3e58a", text: "Wer war im Blackout wo?" },
      { id: "n-uhr", type: "note", author: "hagedorn", x: 1980, y: 1500, rot: 3, color: "#f3e58a", text: "Foyeruhr prüfen!" },
      { id: "n-reuter", type: "note", author: "hagedorn", x: 830, y: 140, rot: 2, color: "#f3e58a", text: "Warum stand Reuter genau dort?" },
      { id: "n-nummer", type: "note", author: "hagedorn", x: 2320, y: 960, rot: -3, color: "#f3e58a", text: "Benutzt K. überall dieselbe Nummer?" },
    ],
    threads: [
      { id: "t-mira", from: "mira", to: "mond", color: "red", label: "Streit am Vormittag. Motiv!" },
      { id: "t-timo", from: "timo", to: "zug12", color: "red", label: "Zugang Technik, Kontrolle 21:10" },
      { id: "t-ruth", from: "ruth", to: "mond", color: "red", label: "Rote Fasern am Mond" },
      { id: "t-keller", from: "keller", to: "zug12", color: "yellow", label: "Schlüssel?" },
      { id: "t-zeit", from: "pfoertner", to: "seitentuer", color: "blue", label: "21:33 / 21:29 – passt nicht?" },
    ],
  };

  /* Beweise, die man im Prototyp aus der „Akte“ aufhängen kann */
  window.DLF_EVIDENCE = [
    { id: "uhrzettel", kind: "doc", title: "Wartungszettel Foyeruhr", sub: "„geht 6 Min. vor“", art: docArt([140, 80]),
      body: paper(`<p class="pv-head">HAUSTECHNIK · WARTUNG</p><p>Foyeruhr geht 6 Minuten vor. Ersatzteil bestellt. – Mahler</p>`) },
    { id: "durchschlag", kind: "doc", title: "Schlüsselregister, Durchschlag", sub: "20:58 – K-4", art: docArt([160, 130, 60]),
      body: paper(`<p class="pv-head">SCHLÜSSELREGISTER · DURCHSCHLAG</p><table class="pv-table"><tr><td>20:58</td><td>J. Keller</td><td>K-4</td><td>Rückgabe: –</td></tr></table>`) },
    { id: "naehprotokoll", kind: "doc", title: "Nähprotokoll", sub: "17:05 · Samtkante Mond", art: docArt([150, 110, 130]),
      body: paper(`<p class="pv-head">KOSTÜMWERKSTATT · 9.11.</p><p>17:05 – Mond, Samtkante erneuert – Bordeaux, Charge 0917 – R.E.</p>`) },
    { id: "sprechanlage", kind: "doc", title: "Mitschnitt Sprechanlage", sub: "21:44:08 · Lichtpult", art: docArt([120, 160, 90]),
      body: paper(`<p class="pv-head">SPRECHANLAGE · ABSCHRIFT</p><table class="pv-table"><tr><td>21:44:00</td><td>Inspizienz: „Blackout – jetzt.“</td></tr><tr><td>21:44:08</td><td>Lichtpult (Brandt): „Blackout steht, warte auf Freigabe.“</td></tr></table>`) },
  ];
})();
