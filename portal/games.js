/*
 * MYSTERY ROOMS – Spielekatalog
 * Ein neuer Escape Room = ein neuer Eintrag in dieser Liste.
 *
 * status:     "spielbar" | "vorschau" (spielbar, aber noch im Ausbau) | "geplant"
 * difficulty: 1 = leicht, 2 = mittel, 3 = anspruchsvoll, 4 = schwer
 * art:        Name der Titelgrafik (siehe ART in portal.js)
 * saveKey:    localStorage-Schlüssel des Spiels, um „Weiterspielen“ anzuzeigen
 * featured:   true = großes Hauptabenteuer auf der Startseite (genau eines)
 * tagline, puzzles, minutes, shots, poster: zusätzliche Angaben für das Hauptabenteuer
 */
window.MR_GAMES = [
  {
    id: "hotel-nocturne",
    title: "Hotel Nocturne",
    subtitle: "Die letzte Nacht",
    category: "mystery",
    categoryLabel: "Mystery-Thriller",
    teaser: "In einer stürmischen Oktobernacht verschwinden sechs Gäste – und tauchen Tage später verstört wieder auf. Der Nachtmanager soll versucht haben, sie zu töten. 17 Jahre später liegt eine Reservierung für dich bereit: Zimmer 217, Check-in 23:17 Uhr.",
    duration: "ca. 100 Min.",
    difficulty: 3,
    players: "1–4 Personen",
    age: "ab 12 Jahren",
    rooms: 7,
    status: "spielbar",
    statusNote: "Alle sieben Räume fertig · allein oder gemeinsam mit bis zu vier Personen",
    isNew: true,
    url: "hotel-nocturne/index.html",
    art: "hotel",
    saveKey: "nocturne_save_v2",
    // Hauptabenteuer: große Präsentationsfläche auf der Startseite
    featured: true,
    tagline: "Die Wahrheit wartet hinter verschlossenen Türen.",
    puzzles: 21,
    minutes: "~100",
    shots: [
      { src: "portal/img/hotel-rezeption.jpg", label: "Die Rezeption" },
      { src: "portal/img/hotel-zimmer217.jpg", label: "Zimmer 217" },
      { src: "portal/img/hotel-gepaecklager.jpg", label: "Das Gepäcklager" },
      { src: "portal/img/hotel-archiv.jpg", label: "Das Hotelarchiv" },
    ],
    poster: "portal/img/hotel-fassade.jpg",
  },
  {
    id: "der-letzte-fall",
    title: "Der letzte Fall",
    subtitle: "Der letzte Vorhang",
    category: "krimi",
    categoryLabel: "Krimi",
    teaser: "Ein Theaterdirektor ist tot. Ein Kommissar verschwunden. Seine letzte Ermittlung wartet auf dich – mit richtigen Spuren, falschen Fäden und einer gemeinsamen Ermittlungswand.",
    duration: "75–90 Min.",
    difficulty: 2,
    players: "1–4 Personen",
    age: "ab 12 Jahren",
    status: "vorschau",
    isNew: true,
    statusNote: "Alle fünf Bereiche spielbar · Hagedorns Wand als Pinnwand auf dem Tablet",
    url: "der-letzte-fall/index.html",
    art: "krimi",
  },
  {
    id: "geheimnis-pyramide",
    title: "Das Geheimnis der Pyramide",
    subtitle: "Die vergessene Grabkammer",
    category: "abenteuer",
    categoryLabel: "Abenteuer",
    teaser: "Eine verschüttete Grabkammer, rätselhafte Hieroglyphen und ein Schatz, den seit Jahrtausenden niemand gesehen hat.",
    duration: "ca. 45 Min.",
    difficulty: 1,
    players: "1–4 Personen",
    age: "ab 10 Jahren",
    status: "geplant",
    art: "pyramide",
  },
  {
    id: "projekt-schattenlabor",
    title: "Projekt Schattenlabor",
    subtitle: "Das Experiment",
    category: "mystery",
    categoryLabel: "Mystery / Science-Fiction",
    teaser: "Ein verlassenes Labor. Eine verschwundene Wissenschaftlerin. Und eine Entdeckung, die niemals ans Licht kommen sollte.",
    duration: "ca. 60 Min.",
    difficulty: 4,
    players: "1–4 Personen",
    age: "ab 14 Jahren",
    status: "geplant",
    art: "labor",
  },
];
