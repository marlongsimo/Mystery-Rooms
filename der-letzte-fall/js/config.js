/*
 * DER LETZTE FALL – persönliche Einstellungen und Spielrahmen
 * ------------------------------------------------------------
 * Name und persönliche Nachricht lassen sich hier anpassen.
 * Alle Texte funktionieren auch ohne Namen (die Spielfigur bleibt geschlechtsneutral).
 */
window.MRGAME = window.MRGAME || { rooms: [], docs: {}, items: {}, messages: {} };

window.MRGAME.config = {
  // Optional: Name der Spielerin / des Spielers (Hagedorns Partner/in bei der Kripo).
  playerName: "",  // optional; die Texte sprechen dich ohnehin mit „du“ an

  // Persönliche Nachricht auf dem letzten Bildschirm (Zeilenumbrüche mit \n).
  personalMessage:
    "Der Vorhang ist gefallen.\n" +
    "Hagedorn hätte nur gesagt: Gut gemacht. Mehr Lob gibt es bei ihm nicht.",

  /* ---------- Spielrahmen (für die Engine) ---------- */
  title: "Der letzte Fall",
  saveKey: "dlf_save_v1",
  version: "1",
  clockStart: 22 * 60,                    // Spielbeginn 22:00 Uhr
  phoneDate: "Freitag, 13. November",
  dateLine: "FREITAG, 13. NOVEMBER 2026 · NACH 22:00",
  caseLabel: "Fall 0911-R · Stadttheater Velden",
  planDoc: "theaterplan",                 // Dokument, das die Karten-App zeigt, sobald es in der Akte liegt
  music: null,                            // keine Musikschleife – Raumklang genügt
  prologAmbient: "rain",
  prologReady: "Ins Präsidium",
  finaleAmbient: null,
  endLabel: "Den Fall abschließen",
  startLabel: "Ermittlung aufnehmen",
  endingDoc: null,
  start: {
    kicker: "FREITAG, 13. NOVEMBER · 22:00", title: "Hagedorns Büro",
    text: "Das Präsidium ist fast leer. Hagedorns Tür war nicht abgeschlossen. Auf deinem Telefon: die Nachricht von Mittwoch. Die Fallakte liegt in deiner Akte.",
    button: "Das Büro ansehen",
    docs: ["fallakte"],
    message: "m_sms",
    messageDelay: 4000,
  },
  introVoice: false,

  multiplayer: {
    gameSlug: "der-letzte-fall",   // Eintrag in der Tabelle game_catalog (muss in Supabase angelegt sein)
    maxPlayers: 4,
    localFlags: [],
    texts: {
      title: "Gemeinsam ermitteln.",
      copy: "Erstellt eine gemeinsame Sitzung oder tretet mit einem Einladungscode bei. Jede/r bewegt sich frei – Rucksack, Akte, gelöste Rätsel und Hagedorns Wand teilt ihr.",
      lobbyKicker: "DER LETZTE FALL · PRIVATE SITZUNG",
      lobbyTitle: "Die Ermittlungsgruppe",
      codePlaceholder: "CODE-XXXXXX",
      hostWaiting: "Teile den Code mit deinem Team. Nur du kannst die Ermittlung starten.",
      guestWaiting: "Du bist dabei. Warte, bis der Host die Ermittlung startet.",
      start: "Ermittlung starten",
      running: "Eure Ermittlung läuft. Du kannst jederzeit zurückkehren.",
      enter: "Zurück zur Ermittlung",
      playersHead: "IM TEAM",
    },
  },
};
