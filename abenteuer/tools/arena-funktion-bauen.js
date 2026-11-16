/*
 * Mythara – baut die Edge Function „arena“ (Serverkampf der Arena) als EINE Datei:
 *   abenteuer/supabase/functions/arena/index.ts
 * Hinein kommen: die Heldendaten (js/figuren.js), die Regeln (js/regeln.js), die Arena-Karten (aus daten/grauwacht.js),
 * der Rechenkern (server/arena-kern.js) und der Netzteil (server/arena-funktion.js).
 * Nach jeder Änderung an den Regeln oder Helden neu bauen und die Function neu ausrollen – sonst rechnet der Server
 * mit alten Regeln. Die Versionsnummer der Regeln (aus index.html) steht im Kopf der gebauten Datei.
 * Aufruf: node abenteuer/tools/arena-funktion-bauen.js
 */
const fs = require("fs"), path = require("path");
const wurzel = path.join(__dirname, ".."), lies = (p) => fs.readFileSync(path.join(wurzel, p), "utf8");
const KARTEN = require(path.join(wurzel, "daten/grauwacht.js")).KARTEN;
const html = lies("index.html"), ver = (name) => (new RegExp(name.replace(".", "\\.") + "\\?v=(\\d+)").exec(html) || [])[1] || "?";
const teile = [
  "// @ts-nocheck",
  "// Mythara – Edge Function „arena“: Der Server rechnet den Arena-Kampf. GEBAUTE DATEI – nicht von Hand ändern.",
  "// Quelle: abenteuer/server/*.js und abenteuer/js/{figuren,regeln}.js · bauen mit: node abenteuer/tools/arena-funktion-bauen.js",
  `// Stand der Regeln: regeln.js v${ver("regeln.js")}, figuren.js v${ver("figuren.js")}`,
  "", "/* ===== js/figuren.js ===== */", lies("js/figuren.js"),
  "", "/* ===== js/regeln.js ===== */", lies("js/regeln.js"),
  "", "/* ===== Arena-Karten (aus daten/grauwacht.js) ===== */", "const ARENA_KARTEN = " + JSON.stringify(KARTEN) + ";",
  "", "/* ===== server/arena-kern.js ===== */", lies("server/arena-kern.js"),
  "", "/* ===== server/arena-funktion.js ===== */", lies("server/arena-funktion.js"), ""];
const ziel = path.join(wurzel, "supabase/functions/arena/index.ts");
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, teile.join("\n"));
console.log(`geschrieben: ${path.relative(path.join(wurzel, ".."), ziel)} (${Math.round(fs.statSync(ziel).size / 1024)} KB, Regeln v${ver("regeln.js")})`);
