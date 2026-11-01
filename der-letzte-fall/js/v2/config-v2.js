/*
 * DER LETZTE FALL – Version 2 (Ermittlung): Abweichungen von js/config.js
 * Eigener Spielstand und eigene Sitzungen, damit Version 1 unberührt bleibt.
 */
(() => {
  const C = window.MRGAME.config;
  Object.assign(C, {
    saveKey: "dlf_save_v2",
    version: "2 (Vorschau)",
    docFoundLabel: "Im Tablet abgelegt (Beweise)",
    startLabel: "Ermittlung aufnehmen",
    start: {
      kicker: "FREITAG, 13. NOVEMBER · 22:00", title: "Hagedorns Büro",
      text: "Das Präsidium ist fast leer. Hagedorns Tür war nicht abgeschlossen. Auf seinem Schreibtisch liegt sein Dienst-Tablet – damit ermittelst du: Fragen beantworten, Beweise vergleichen, Zeiten prüfen. Fortschritt gibt es nur für das, was du belegen kannst.",
      button: "Das Büro ansehen",
      docs: ["fallakte", "sms"],
      message: "m_sms",
      messageDelay: 4000,
    },
  });
  Object.assign(C.multiplayer, { storeKey: "mr_mp_session_v1:der-letzte-fall-v2", savePrefix: "dlf_v2_mp_" });
})();
