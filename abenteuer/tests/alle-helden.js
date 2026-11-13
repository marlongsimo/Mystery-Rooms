/*
 * Testhilfe (Open Beta, Heldensammlung): Die Mechanik- und Ablauftests spielen als Gast mit beliebigen Helden.
 * Seit Migration 006 hätte ein Gast nur das Starter-Set. Diese Hilfe lässt die echte Datenbank antworten
 * und setzt in der Antwort nur „alle 15 Helden frei, keine offenen Startrunden oder Belohnungen“.
 * Die Sammlung selbst prüft tests/sammlung.test.js (ohne diese Hilfe).
 */
const ALLE = ["schildwaechter", "berserker", "duellant", "gelehrter", "elementarist", "schattenmagier", "schattenlaeufer", "trickser", "assassine",
  "lichtbringer", "wanderheiler", "inquisitor", "wildnislaeufer", "tiergefaehrte", "kopfgeldjaeger"];
const MUSTER = /\/rest\/v1\/rpc\/rpg_(my_heroes|campaign_heroes)(\?|$)/;
async function umleiten(ziel) {
  await ziel.route(MUSTER, async (route) => {
    let body = {};
    try { const r = await route.fetch(); if (r.ok()) body = await r.json(); } catch (e) { /* ohne Datenbank: trotzdem alle frei */ }
    if (!body || typeof body !== "object" || Array.isArray(body)) body = {};
    Object.assign(body, { konto: true, helden: ALLE, start_offen: false, angebote: [] });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}
/** Browser so einrichten, dass jede neue Seite alle Helden frei hat. Gibt den Browser zurück. */
function alleHeldenFrei(browser) {
  const ctx = browser.newContext.bind(browser), page = browser.newPage.bind(browser);
  browser.newContext = async (...a) => { const c = await ctx(...a); await umleiten(c); return c; };
  browser.newPage = async (...a) => { const p = await page(...a); await umleiten(p); return p; };
  return browser;
}
module.exports = { alleHeldenFrei, ALLE };
