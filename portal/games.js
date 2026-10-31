/*
 * MYSTERY ROOMS – Spielekatalog
 * Ein neuer Escape Room = ein neuer Eintrag in dieser Liste.
 *
 * status:     "spielbar" | "vorschau" (spielbar, aber noch im Ausbau) | "geplant"
 * difficulty: 1 = leicht, 2 = mittel, 3 = anspruchsvoll, 4 = schwer
 * art:        Name der Titelgrafik (siehe ART in portal.js)
 * saveKey:    localStorage-Schlüssel des Spiels, um „Weiterspielen“ anzuzeigen
 */
window.MR_GAMES = [
  {
    id: "hotel-nocturne",
    title: "Hotel Nocturne",
    subtitle: "Die letzte Nacht",
    category: "mystery",
    categoryLabel: "Mystery-Thriller",
    teaser: "Sechs Gäste verschwanden in einer stürmischen Oktobernacht. 17 Jahre später liegt eine Reservierung für dich bereit: Zimmer 217, Check-in 23:17 Uhr.",
    duration: "90–120 Min.",
    difficulty: 3,
    players: "1 Person",
    age: "ab 12 Jahren",
    rooms: 7,
    status: "vorschau",
    statusNote: "Rezeption als begehbarer Raum mit vier Blickrichtungen fertig, Räume 2–7 spielbar in Vorabfassung",
    isNew: true,
    url: "hotel-nocturne/index.html",
    art: "hotel",
    saveKey: "nocturne_save_v2",
  },
  {
    id: "der-letzte-fall",
    title: "Der letzte Fall",
    subtitle: "Ein Kommissar ermittelt ein letztes Mal",
    category: "krimi",
    categoryLabel: "Krimi",
    teaser: "Ein mysteriöser Mordfall, widersprüchliche Zeugenaussagen und eine Akte, die nie geschlossen wurde. Finde die Wahrheit in den Beweisen.",
    duration: "ca. 60 Min.",
    difficulty: 2,
    players: "1–4 Personen",
    age: "ab 12 Jahren",
    status: "geplant",
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
