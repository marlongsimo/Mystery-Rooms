/*
 * Mythara – Karten-Kontrolle: legt Raster, Hindernisse und Startplätze über die Kampfkarten eines Abenteuers.
 * Damit lassen sich die unsichtbaren Hindernisse am gemalten Bild ausrichten (statt nach Augenmaß im Spiel).
 *
 *   node abenteuer/tools/karten.js <id> [Ordner]            je Karte ein Kontrollbild <Ordner>/<id>-<KARTE>.png
 *   node abenteuer/tools/karten.js <id> [Ordner] --raster   nur Raster mit Koordinaten (für ein neues Bild)
 *   node abenteuer/tools/karten.js --bild=pfad.png [Ordner] Raster über ein beliebiges Bild (noch ohne Daten)
 *
 *   node abenteuer/tools/karten.js --bild=pfad.png [Ordner] --vorschlag
 *       Schlägt die Hindernisse für ein neues Bild vor (als Raster-Text zum Einfügen in daten/<id>.js und als
 *       Kontrollbild). Das Werkzeug lernt dafür aus allen Karten, die schon von Hand ausgerichtet sind.
 *       Der Vorschlag ist ein erster Entwurf: bitte am Kontrollbild prüfen und korrigieren.
 *   node abenteuer/tools/karten.js --guete
 *       Misst, wie gut der Vorschlag ist: sagt jede vorhandene Karte vorher, ohne sie selbst zum Lernen zu benutzen.
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

/* ---------- Hindernis-Vorschlag: lernt aus den schon ausgerichteten Karten (nächste Nachbarn) ---------- */
/** Merkmale je Feld aus dem Bild: Farbe (absolut und gegen den Bilddurchschnitt), Unruhe, Sättigung, Randnähe, Nachbarschaft */
async function merkmale(page, bildDatei, B, H) {
  const roh = await page.evaluate(async ({ url, B, H }) => {
    const img = new Image(); img.src = url; await img.decode();
    const S = 16, c = document.createElement("canvas"); c.width = B * S; c.height = H * S;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data, out = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
      let r = 0, gr = 0, b = 0, l1 = 0, l2 = 0, n = 0, kante = 0, dunkel = 0; const q = [0, 0, 0, 0], L2 = [];
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = ((y * S + j) * c.width + x * S + i) * 4, R = d[k] / 255, G = d[k + 1] / 255, Bl = d[k + 2] / 255, L = 0.3 * R + 0.59 * G + 0.11 * Bl; r += R; gr += G; b += Bl; l1 += L; l2 += L * L; n++; q[(j < S / 2 ? 0 : 2) + (i < S / 2 ? 0 : 1)] += L; L2.push(L); if (L < 0.12) dunkel++; }
      for (let j = 0; j < S - 1; j++) for (let i = 0; i < S - 1; i++) kante += Math.abs(L2[j * S + i] - L2[j * S + i + 1]) + Math.abs(L2[j * S + i] - L2[(j + 1) * S + i]);
      r /= n; gr /= n; b /= n; l1 /= n;
      const qm = q.map((v) => v / (n / 4));
      out.push({ x, y, r, g: gr, b, l: l1, std: Math.sqrt(Math.max(0, l2 / n - l1 * l1)), sat: Math.max(r, gr, b) - Math.min(r, gr, b), kante: kante / (S * S), dunkel: dunkel / n, qd: Math.max(...qm) - Math.min(...qm) });
    }
    return out;
  }, { url: dataUrl(bildDatei), B, H });
  const med = (k) => { const a = roh.map((z) => z[k]).sort((p, q) => p - q); return a[a.length >> 1]; };
  const m = { r: med("r"), g: med("g"), b: med("b"), l: med("l"), std: med("std"), kante: med("kante") };
  const bei = (x, y) => roh[Math.max(0, Math.min(H - 1, y)) * B + Math.max(0, Math.min(B - 1, x))];
  return roh.map((z) => {
    const nb = [bei(z.x - 1, z.y), bei(z.x + 1, z.y), bei(z.x, z.y - 1), bei(z.x, z.y + 1)], nl = nb.reduce((a, q) => a + q.l, 0) / 4;
    const rand = Math.min(z.x, z.y, B - 1 - z.x, H - 1 - z.y);
    const nstd = nb.reduce((a, q) => a + q.std, 0) / 4;
    return [z.r, z.g, z.b, (z.r - m.r) * 2, (z.g - m.g) * 2, (z.b - m.b) * 2, z.std * 4, (z.std - m.std) * 4, z.sat * 1.5, (z.b - z.r) * 2, (z.g - (z.r + z.b) / 2) * 2, Math.min(rand, 3) / 5, (z.l - nl) * 2,
      z.kante * 6, (z.kante - m.kante) * 6, z.dunkel * 0.8, z.qd * 3, (z.l - m.l) * 2, nstd * 3];
  });
}
/** Alle Karten mit Bild und Hindernissen als Lernbeispiele */
async function lernen(page) {
  const beispiele = [];
  for (const f of fs.readdirSync(path.join(WURZEL, "daten")).filter((x) => x.endsWith(".js")).sort()) {
    const D = require(path.join(WURZEL, "daten", f));
    for (const [name, K] of Object.entries(D.KARTEN || {})) {
      if (!K.bild || !fs.existsSync(path.join(WURZEL, K.bild)) || (K.b || 12) !== 12 || (K.h || 9) !== 9) continue;
      // Nur die vier Grundarten lernen; alles andere (Sonderfelder einzelner Abenteuer) zählt als Mauer
      const typ = {}; for (const [t, x, y] of K.hindernisse || []) typ[x + "," + y] = ZEICHEN[t] ? t : "M";
      const m = await merkmale(page, path.join(WURZEL, K.bild), 12, 9);
      m.forEach((v, i) => beispiele.push({ karte: f + ":" + name, v, t: typ[(i % 12) + "," + Math.floor(i / 12)] || "." }));
    }
  }
  return beispiele;
}
function vorhersage(beispiele, v, ohneKarte) {
  const k = 9, best = [];
  for (const e of beispiele) {
    if (e.karte === ohneKarte) continue;
    let d = 0; for (let i = 0; i < v.length; i++) { const x = v[i] - e.v[i]; d += x * x; }
    if (best.length < k || d < best[best.length - 1].d) { best.push({ d, t: e.t }); best.sort((a, b) => a.d - b.d); if (best.length > k) best.pop(); }
  }
  const stimmen = {}; for (const q of best) stimmen[q.t] = (stimmen[q.t] || 0) + 1 / (0.02 + q.d);
  const reihe = Object.entries(stimmen).sort((a, b) => b[1] - a[1]), summe = reihe.reduce((a, q) => a + q[1], 0);
  return { t: reihe[0][0], sicher: reihe[0][1] / summe };
}
const ZEICHEN = { Q: "~", T: "T", K: "K", M: "M", ".": "." };

(async () => {
  const { chromium } = require("playwright");
  if (flag("guete")) {
    const b0 = await chromium.launch(), p0 = await b0.newPage();
    const bsp = await lernen(p0); await b0.close();
    const karten = [...new Set(bsp.map((e) => e.karte))]; let gleich = 0, frei_ok = 0, n = 0; const je = [];
    for (const kn of karten) {
      const zellen = bsp.filter((e) => e.karte === kn); let g = 0, f2 = 0;
      for (const e of zellen) { const v = vorhersage(bsp, e.v, kn); if (v.t === e.t) g++; if ((v.t === ".") === (e.t === ".")) f2++; }
      gleich += g; frei_ok += f2; n += zellen.length; je.push([kn, f2 / zellen.length]);
    }
    console.log(`Güte des Hindernis-Vorschlags über ${karten.length} Karten (${n} Felder), jede Karte ohne sich selbst vorhergesagt:`);
    console.log(`  begehbar/versperrt richtig: ${(frei_ok / n * 100).toFixed(1)} %  ·  auch die Art richtig (Wasser, Baum, Kiste, Mauer): ${(gleich / n * 100).toFixed(1)} %`);
    je.sort((a, b) => a[1] - b[1]); console.log("  schwächste Karten: " + je.slice(0, 4).map(([k, q]) => `${k} ${(q * 100).toFixed(0)} %`).join(" · "));
    console.log("  beste Karten: " + je.slice(-4).map(([k, q]) => `${k} ${(q * 100).toFixed(0)} %`).join(" · "));
    process.exit(0);
  }
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
    if (flag("vorschlag")) {
      const bsp = await lernen(p), m = await merkmale(p, path.resolve(einzelbild), 12, 9);
      const vor = m.map((v) => vorhersage(bsp, v, null)), hind = [], zeilen = [];
      for (let y = 0; y < 9; y++) { let z = ""; for (let x = 0; x < 12; x++) { const q = vor[y * 12 + x]; z += ZEICHEN[q.t]; if (q.t !== ".") hind.push([q.t, x, y]); } zeilen.push(z); }
      const unsicher = vor.map((q, i) => (q.sicher < 0.6 ? `${i % 12},${Math.floor(i / 12)}` : null)).filter(Boolean);
      await p.setContent(html({ b: 12, h: 9, hindernisse: hind }, path.resolve(einzelbild), false));
      const ziel2 = path.join(ordner, "vorschlag-" + path.basename(einzelbild).replace(/\.[a-z]+$/i, "") + ".png");
      await p.screenshot({ path: ziel2 });
      console.log(`Vorschlag (gelernt aus ${new Set(bsp.map((e) => e.karte)).size} Karten): ${ziel2}\n\n    hindernisse: ausText([\n${zeilen.map((z) => `      "${z}",`).join("\n")}\n    ]),\n`);
      console.log(unsicher.length ? `Unsichere Felder (bitte am Bild prüfen): ${unsicher.join(" · ")}` : "Keine unsicheren Felder.");
      console.log("Der Vorschlag ist ein erster Entwurf: Kontrollbild ansehen, korrigieren, dann die Startplätze setzen.");
    }
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
