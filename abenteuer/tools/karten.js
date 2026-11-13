/*
 * Mythara – Karten-Kontrolle: legt Raster, Hindernisse und Startplätze über die Kampfkarten eines Abenteuers.
 * Damit lassen sich die unsichtbaren Hindernisse am gemalten Bild ausrichten (statt nach Augenmaß im Spiel).
 *
 *   node abenteuer/tools/karten.js <id> [Ordner]            je Karte ein Kontrollbild <Ordner>/<id>-<KARTE>.png
 *   node abenteuer/tools/karten.js <id> [Ordner] --raster   nur Raster mit Koordinaten (für ein neues Bild)
 *   node abenteuer/tools/karten.js --bild=pfad.png [Ordner] Raster über ein beliebiges Bild (noch ohne Daten)
 *
 * Farben: rot Mauer/Fels (M) · orange Kiste/Sack (K) · grün Baum/Schilf (T) · blau Wasser (Q/~)
 *         weiß Helden · hellblau Wolf · rot gefüllt Gegner · gelb Begleitung
 * Prüft nebenbei: Startplätze auf Hindernissen, doppelte Startplätze, abgeschnittene Bereiche (kein Weg von den Helden zu den Gegnern).
 * Braucht Playwright (wie die Browsertests). Ohne Ordner landen die Bilder in ./karten-kontrolle/.
 */
"use strict";
const fs = require("fs"), path = require("path");
const WURZEL = path.join(__dirname, "..");
const args = process.argv.slice(2), flag = (n) => args.includes("--" + n);
const wert = (n) => { const x = args.find((y) => y.startsWith("--" + n + "=")); return x ? x.split("=").slice(1).join("=") : ""; };
const frei = args.filter((a) => !a.startsWith("--"));
const FARBE = { M: "rgba(255,40,40,.45)", K: "rgba(255,160,0,.5)", T: "rgba(40,200,40,.42)", Q: "rgba(40,120,255,.38)" };

function dataUrl(datei) {
  const typ = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[path.extname(datei).toLowerCase()] || "image/png";
  return `data:${typ};base64,${fs.readFileSync(datei).toString("base64")}`;
}
function html(K, bildDatei, nurRaster) {
  const B = K.b || 12, H = K.h || 9, Z = 120, w = B * Z, h = H * Z;
  let o = `<div style="position:relative;width:${w}px;height:${h}px;background:#2a2f38 ${bildDatei ? `url('${dataUrl(bildDatei)}') 0 0 / 100% 100%` : ""};font:600 15px sans-serif">`;
  if (!nurRaster) for (const [t, x, y] of K.hindernisse || []) o += `<div style="position:absolute;left:${x * Z + 2}px;top:${y * Z + 2}px;width:${Z - 4}px;height:${Z - 4}px;background:${FARBE[t] || FARBE.M}"></div>`;
  for (let x = 0; x < B; x++) for (let y = 0; y < H; y++) o += `<div style="position:absolute;left:${x * Z}px;top:${y * Z}px;width:${Z}px;height:${Z}px;box-sizing:border-box;border:1px solid rgba(255,255,0,.75);color:#ffe14d;text-shadow:0 0 3px #000,0 0 3px #000;padding:3px 5px">${x},${y}</div>`;
  if (!nurRaster && K.start) {
    const punkt = (p, farbe, text) => { o += `<div style="position:absolute;left:${p[0] * Z + 30}px;top:${p[1] * Z + 30}px;width:60px;height:60px;border-radius:50%;background:${farbe};border:3px solid #000;display:grid;place-items:center;color:#000">${text}</div>`; };
    (K.start.spieler || []).forEach((p, i) => punkt(p, "#fff", "H" + (i + 1)));
    (K.start.wolf || []).forEach((p) => punkt(p, "#9fd8ff", "W"));
    (K.start.gegner || []).forEach((p, i) => punkt(p, "#e02020", i + 1));
    if (K.start.begleiter) punkt(K.start.begleiter, "#ffd400", "B");
  }
  return `<html><body style="margin:0;background:#111">${o}</div></body></html>`;
}
/** Startplätze auf Hindernissen, doppelte Plätze, kein Weg von den Helden zu den Gegnern */
function pruefeKarte(K) {
  const B = K.b || 12, H = K.h || 9, zu = new Set((K.hindernisse || []).map(([, x, y]) => x + "," + y)), meld = [], hinweise = [];
  const s = K.start || {}, alle = [...(s.spieler || []), ...(s.wolf || []), ...(s.gegner || []), ...(s.begleiter ? [s.begleiter] : [])];
  alle.filter(([x, y]) => zu.has(x + "," + y)).forEach((p) => meld.push(`Startplatz ${p.join(",")} liegt auf einem Hindernis`));
  alle.filter(([x, y]) => x < 0 || y < 0 || x >= B || y >= H).forEach((p) => meld.push(`Startplatz ${p.join(",")} liegt außerhalb der Karte`));
  if (new Set(alle.map(String)).size !== alle.length) meld.push("Startplätze sind doppelt vergeben");
  if ((s.spieler || []).length < 6) meld.push(`nur ${(s.spieler || []).length} Startplätze für Helden (6 nötig)`);
  if ((s.gegner || []).length < 10) hinweise.push(`nur ${(s.gegner || []).length} Startplätze für Gegner (für große Gruppen sind 10–12 besser)`);
  if ((s.spieler || []).length) {
    const sicht = new Set([String(s.spieler[0])]), offen = [s.spieler[0]];
    while (offen.length) { const [x, y] = offen.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (nx < 0 || ny < 0 || nx >= B || ny >= H || zu.has(k) || sicht.has(k)) continue; sicht.add(k); offen.push([nx, ny]); } }
    const ab = [...(s.spieler || []), ...(s.gegner || [])].filter((p) => !sicht.has(String(p)));
    if (ab.length) meld.push(`kein Weg vom ersten Heldenplatz zu: ${ab.map((p) => p.join(",")).join(" · ")}`);
  }
  return { meld, hinweise };
}

(async () => {
  const { chromium } = require("playwright");
  const einzelbild = wert("bild");
  const id = einzelbild ? null : frei[0], ordner = path.resolve((einzelbild ? frei[0] : frei[1]) || "karten-kontrolle");
  if (!einzelbild && !id) { console.log("Aufruf: node abenteuer/tools/karten.js <id> [Ordner] [--raster]   oder   --bild=pfad.png [Ordner]"); process.exit(1); }
  fs.mkdirSync(ordner, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 1080 } });
  let schlecht = false;
  if (einzelbild) {
    await p.setContent(html({ b: 12, h: 9 }, path.resolve(einzelbild), true));
    const ziel = path.join(ordner, "raster-" + path.basename(einzelbild).replace(/\.[a-z]+$/i, "") + ".png");
    await p.screenshot({ path: ziel }); console.log("Raster: " + ziel);
  } else {
    const D = require(path.join(WURZEL, "daten", id + ".js"));
    for (const [name, K] of Object.entries(D.KARTEN || {})) {
      const bild = K.bild && fs.existsSync(path.join(WURZEL, K.bild)) ? path.join(WURZEL, K.bild) : null;
      await p.setViewportSize({ width: (K.b || 12) * 120, height: (K.h || 9) * 120 });
      await p.setContent(html(K, bild, flag("raster")));
      const ziel = path.join(ordner, `${id}-${name}.png`);
      await p.screenshot({ path: ziel });
      const { meld, hinweise } = pruefeKarte(K);
      console.log(`${name} (${K.name})${bild ? "" : " · ohne Bild"}: ${ziel}`);
      meld.forEach((m) => console.log("  ✗ " + m)); hinweise.forEach((m) => console.log("  · " + m)); if (!meld.length) console.log("  ✓ Startplätze frei, Helden und Gegner erreichen einander");
      schlecht = schlecht || meld.length > 0;
    }
  }
  await b.close();
  process.exit(schlecht ? 1 : 0);
})();
