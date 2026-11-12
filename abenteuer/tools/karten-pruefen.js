/*
 * Karten prüfen: Sind alle begehbaren Felder miteinander verbunden (8 Richtungen, keine Ecken durch Hindernisse,
 * wie in regeln.js)? Liegen alle Startplätze auf freien Feldern? Aufruf: node abenteuer/tools/karten-pruefen.js [rabenmoor]
 */
"use strict";
const id = process.argv[2] || "rabenmoor", D = require("../daten/" + id + ".js");
let fehler = 0;
for (const [name, k] of Object.entries(D.KARTEN)) {
  const block = new Set(k.hindernisse.map(([, x, y]) => x + "," + y)), frei = (x, y) => x >= 0 && y >= 0 && x < k.b && y < k.h && !block.has(x + "," + y);
  const start = k.start.spieler[0], weg = new Set([start.join(",")]), q = [start];
  while (q.length) { const [x, y] = q.shift(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!frei(nx, ny) || weg.has(nx + "," + ny)) continue; if (dx && dy && (!frei(x + dx, y) || !frei(x, y + dy))) continue; weg.add(nx + "," + ny); q.push([nx, ny]); } }
  const alle = []; for (let y = 0; y < k.h; y++) for (let x = 0; x < k.b; x++) if (frei(x, y)) alle.push(x + "," + y);
  const ab = alle.filter((p) => !weg.has(p)), starts = [...k.start.spieler, ...k.start.gegner, ...k.start.wolf].map((p) => p.join(","));
  const schlecht = starts.filter((p) => !weg.has(p));
  console.log(`${name}: ${alle.length} freie Felder, ${ab.length} abgeschnitten${ab.length ? " (" + ab.join(" ") + ")" : ""}${schlecht.length ? " · Startplätze nicht erreichbar: " + schlecht.join(" ") : ""}`);
  if (schlecht.length) fehler++;
}
process.exit(fehler ? 1 : 0);
