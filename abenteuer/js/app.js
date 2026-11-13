/* Mythara als App: meldet den Service Worker an (sw.js). Nicht in Tests (?schnell) und nur über https oder lokal. */
(() => {
  if (!("serviceWorker" in navigator) || new URLSearchParams(location.search).has("schnell")) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* ohne App-Speicher läuft alles wie bisher */ }); });
})();
