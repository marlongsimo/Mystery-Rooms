/*
 * Hotel Nocturne – 3D-Testmodus: Sichtbare Texte in 3D müssen zur Geschichte passen (Rezeption, Zimmer 217).
 * Jeder Text, den die 3D-Rezeption auf eine Textur schreibt, muss (sinngemäß gleich) in der
 * Original-Raumdatei vorkommen – Dokumente oder SVG-Szenen. Aufruf: node hotel-nocturne/tests/3d-hinweise.test.js
 */
const fs = require("fs"), path = require("path");
const room = fs.readFileSync(path.join(__dirname, "../js/rooms/01-rezeption.js"), "utf8");
const scene = fs.readFileSync(path.join(__dirname, "../js/3d/rezeption.js"), "utf8");
const flat = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toUpperCase();
const R = flat(room);
// [Text in der 3D-Szene, Text in den Originaldaten]
const PAIRS = [
  ["Personal, Sommer 2008", "Sommer 2008"],
  ["LOKALANZEIGER", "LOKALANZEIGER"],
  ['"Hotel Nocturne nach", "Unwetternacht", "geschlossen"', "Hotel Nocturne nach Unwetternacht geschlossen"],
  ["Freitag, 16. Oktober 2009", "FREITAG, 16. OKTOBER 2009"],
  ['plaqueTex("REZEPTION")', "REZEPTION"],
  ['"V. LEHN"', "V. LEHN"],
  ['"ABR. 10/09"', "ABR. 10/09"],
  ['"WILLKOMMEN"', "WILLKOMMEN"],
  ['"SCHLÜSSEL"', "SCHLÜSSEL"],
  ['"Der Schlüssel liegt dort,", "wo der Gast eingecheckt hat."', "Der Schlüssel liegt dort, wo der Gast eingecheckt hat."],
  ['"Die Uhr erinnert sich."', "Die Uhr erinnert sich."],
  ['plaqueTex("PERSONAL"', "Personal"],
  ["(23 % 12) + 17 / 60", "23:17"], // Uhrzeiger
];
// Zimmer 217
const room2 = flat(fs.readFileSync(path.join(__dirname, "../js/rooms/02-zimmer217.js"), "utf8"));
const scene2 = fs.readFileSync(path.join(__dirname, "../js/3d/zimmer217.js"), "utf8");
const PAIRS2 = [
  ['plaqueTex("217"', "217"],
  ['"für E."', "für E."],
  ['"Wer nachts wacht"', "Wer nachts wacht"],
  ['fillText("6"', "Nr. 6"],
  ['fillText("W2"', "W2"],
  ["[0, 0, 0, 0]", "0"], // Ziffernschloss der Kommode zeigt 0000
];
let fail = 0;
for (const [inScene, inStory] of PAIRS2) {
  const a = scene2.includes(inScene), b = room2.includes(flat(inStory));
  console.log(`${a && b ? "  ✓" : "  ✗"} Zimmer 217: ${inStory}${a ? "" : "  (fehlt in 3D)"}${b ? "" : "  (nicht in der Geschichte)"}`);
  if (!(a && b)) fail++;
}
for (const [inScene, inStory] of PAIRS) {
  const a = scene.includes(inScene), b = R.includes(flat(inStory));
  console.log(`${a && b ? "  ✓" : "  ✗"} ${inStory}${a ? "" : "  (fehlt in 3D)"}${b ? "" : "  (nicht in der Geschichte)"}`);
  if (!(a && b)) fail++;
}
// Keine erfundenen Zeitungsnamen oder Daten
for (const bad of ["Kurier", "15. Oktober", "Sommer 2009"]) { const hit = scene.includes(bad); console.log(`${hit ? "  ✗" : "  ✓"} kein „${bad}“ in der 3D-Szene`); if (hit) fail++; }
console.log(fail ? `\n${fail} Abweichung(en).` : "\nAlle sichtbaren Texte stimmen mit der Geschichte überein.");
process.exit(fail ? 1 : 0);
