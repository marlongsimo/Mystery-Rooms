/*
 * HOTEL NOCTURNE – persönliche Einstellungen
 * -------------------------------------------
 * Hier wird das Spiel für die Person angepasst, die es spielen soll.
 * Nur diese Datei muss dafür bearbeitet werden.
 */
window.NOCTURNE = window.NOCTURNE || { rooms: [], docs: {}, items: {} };

window.NOCTURNE.config = {
  // Name auf der Reservierungsbestätigung.
  playerName: "",  // leer = „Verehrter Gast“

  // Persönliche Nachricht auf dem letzten Bildschirm (Zeilenumbrüche mit \n).
  personalMessage:
    "Du hast jedes Geheimnis gelöst.\n" +
    "Es gibt allerdings noch einen Ort, den du nicht untersucht hast:\n" +
    "den Menschen, der dieses Spiel für dich vorbereitet hat.",

  // Gemeinsam spielen (Supabase-Verbindung steht für alle Spiele in
  // platform/multiplayer/mp-config.js – dort nur der öffentliche Publishable Key).
  multiplayer: {
    gameSlug: "hotel-nocturne",   // Eintrag in der Tabelle game_catalog
    maxPlayers: 4,
    // Zustände, die nur die eigene Sicht betreffen und nicht geteilt werden
    // (Ereignis-Flags „evt_…“ sind immer lokal).
    localFlags: ["monitor2_live", "flackern"],
  },
};
