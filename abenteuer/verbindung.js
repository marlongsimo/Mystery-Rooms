/*
 * Mythara – Verbindung zu Supabase (Kopie von platform/multiplayer/mp-config.js, damit das Spiel ohne Dateien
 * außerhalb seines Ordners läuft und sich unter eigener Adresse ausliefern lässt).
 *
 * Hier steht ausschließlich der öffentliche Publishable Key. Er ist dafür gedacht, im Browser zu stehen; was ein
 * Spieler darf, regeln die RLS-Richtlinien und Datenbankfunktionen in Supabase. Niemals einen Secret- oder
 * Service-Role-Key in eine Datei dieses Projekts schreiben.
 */
window.MR_MULTIPLAYER_CONFIG = {
  supabaseUrl: "https://jxtxatmydlfemzjeupri.supabase.co",
  supabasePublishableKey: "sb_publishable_5n9mj2rEONDIJC4oZXCrdw_FXi6JvJ_",
};
