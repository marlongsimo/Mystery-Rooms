/*
 * HOTEL NOCTURNE – HD-Bausteine (Gothic/viktorianisch) für Rezeption und Zimmer 217
 * Texturen (Damast, Marmor, Perserteppich, Holz mit Maserung) und Formen (abgerundete Kanten, gedrechselte Beine,
 * Kassettenfüllungen, Zierrahmen) – alles aus Code, mit PBR-Einstellungen über tag() (siehe gfx.js).
 */
import { THREE, canvasTex } from "./core.js?v=4";
import { RoundedBoxGeometry, tag } from "./gfx.js?v=2";

/* ---------- Materialien ---------- */
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });
export const woodMat = (base = "#3a2416", line = "#1e120a", o = {}) => tag(new THREE.MeshLambertMaterial({ color: 0xffffff, map: woodGrain(base, line) }), { roughness: 0.5, clearcoat: 0.35, normal: 1.6, ...o });
export const brassMat = (c = 0xb08c52, rough = 0.32) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: rough });
export const velvetMat = (c = 0x5a1414, sheen = 0xc05050) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.85, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(sheen) });
export const leatherMat = (c = 0x3a2010) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 });

/* ---------- Texturen ---------- */
export const woodGrain = (base, line, rep = [1, 1]) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    g.strokeStyle = line; g.globalAlpha = 0.12 + Math.random() * 0.35; g.lineWidth = 0.6 + Math.random() * 2.4;
    const y = Math.random() * h, a = 4 + Math.random() * 10; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.012 + i) * a);
    g.stroke();
  }
  g.globalAlpha = 0.08; for (let i = 0; i < 6; i++) { g.fillStyle = "#000"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 18, 7, 0, 0, Math.PI * 2); g.fill(); } // Astlöcher
}, { repeat: rep });

/** Damasttapete: Ornament auf Streifengrund, Kachel 0,5 m. */
export const damask = (base = "#14231d", motif = "#21362c", gold = "#4a4a32", rep = [2, 2]) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 128) { g.fillStyle = motif; g.globalAlpha = 0.35; g.fillRect(x + 60, 0, 8, h); }
  g.globalAlpha = 1;
  const orn = (cx, cy, s) => {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = motif;
    for (const sx of [-1, 1]) { g.save(); g.scale(sx, 1);
      g.beginPath(); g.moveTo(0, -90); g.bezierCurveTo(40, -70, 50, -30, 18, -10); g.bezierCurveTo(55, 0, 60, 40, 22, 55); g.bezierCurveTo(30, 75, 12, 90, 0, 96); g.lineTo(0, -90); g.fill();
      g.beginPath(); g.arc(34, -42, 9, 0, Math.PI * 2); g.arc(40, 28, 7, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.strokeStyle = gold; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, -78); g.bezierCurveTo(22, -50, 22, 40, 0, 84); g.moveTo(0, -78); g.bezierCurveTo(-22, -50, -22, 40, 0, 84); g.stroke();
    g.restore();
  };
  orn(128, 128, 1); orn(384, 384, 1); orn(384, -128, 1); orn(128, 640, 1); orn(-128, 384, 1); orn(640, 128, 1);
  g.globalAlpha = 0.15; for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#6a6a54"; g.fillRect(Math.random() * w, Math.random() * h, 1, 2); } // Abnutzung
  g.globalAlpha = 0.25; const st = g.createLinearGradient(0, h * 0.85, 0, h); st.addColorStop(0, "rgba(0,0,0,0)"); st.addColorStop(1, "rgba(20,14,8,1)"); g.fillStyle = st; g.fillRect(0, 0, w, h);
}, { repeat: rep });

/** Marmorfliesen im Schachbrett (Kachel = 2 × 2 Fliesen à 0,5 m). */
export const marble = () => canvasTex(512, 512, (g, w, h) => {
  const s = w / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const dark = (i + j) % 2; g.fillStyle = dark ? "#16130f" : "#b9ad98"; g.fillRect(i * s, j * s, s, s);
    g.save(); g.beginPath(); g.rect(i * s, j * s, s, s); g.clip();
    for (let k = 0; k < 7; k++) { g.strokeStyle = dark ? "rgba(140,120,90,.35)" : "rgba(70,60,48,.45)"; g.lineWidth = 0.6 + Math.random() * 1.8; g.beginPath(); let x = i * s + Math.random() * s, y = j * s; g.moveTo(x, y); for (let t = 0; t < 10; t++) { x += Math.random() * 40 - 20; y += s / 10; g.lineTo(x, y); } g.stroke(); }
    g.restore();
  }
  g.strokeStyle = "#0a0806"; g.lineWidth = 3; g.strokeRect(0, 0, s, s); g.strokeRect(s, 0, s, s); g.strokeRect(0, s, s, s); g.strokeRect(s, s, s, s);
});

/** Perserteppich mit Bordüre und Medaillon. */
export const persian = (red = "#5a1612", navy = "#1a2238", gold = "#b0884a") => canvasTex(1024, 768, (g, w, h) => {
  g.fillStyle = red; g.fillRect(0, 0, w, h);
  const band = (inset, c, wd) => { g.strokeStyle = c; g.lineWidth = wd; g.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset); };
  band(20, navy, 34); band(44, gold, 4); band(70, navy, 18); band(86, gold, 3);
  for (let x = 30; x < w - 20; x += 36) { g.fillStyle = gold; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 9, 30); g.lineTo(x, 40); g.lineTo(x - 9, 30); g.fill(); g.beginPath(); g.moveTo(x, h - 40); g.lineTo(x + 9, h - 30); g.lineTo(x, h - 20); g.lineTo(x - 9, h - 30); g.fill(); }
  g.save(); g.translate(w / 2, h / 2);
  g.fillStyle = navy; g.beginPath(); g.ellipse(0, 0, 230, 160, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 210, 142, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = red; for (let k = 0; k < 12; k++) { g.save(); g.rotate((k / 12) * Math.PI * 2); g.beginPath(); g.ellipse(120, 0, 46, 14, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = gold; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
  g.restore();
  for (const [cx, cy] of [[160, 150], [w - 160, 150], [160, h - 150], [w - 160, h - 150]]) { g.fillStyle = navy; g.beginPath(); g.arc(cx, cy, 42, 0, Math.PI * 2); g.fill(); g.strokeStyle = gold; g.lineWidth = 3; g.stroke(); }
  g.globalAlpha = 0.18; for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#e0c090"; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); } // Flor, abgetreten
  g.globalAlpha = 0.25; const gr = g.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 420); gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); // Laufspur in der Mitte
});

/* ---------- Formen ---------- */
/** Kiste mit gerundeten Kanten (Radius r). */
export function rbox(w, h, d, mat, x = 0, y = 0, z = 0, r = 0.015) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat); m.position.set(x, y, z); return m;
}
/** Kassettenfüllung: Rahmen + erhabenes Feld mit Fase. Vorderseite +z. */
export function panel(w, h, mat, x = 0, y = 0, z = 0, frame = 0.06, raise = 0.012) {
  const g = new THREE.Group();
  g.add(rbox(w, h, 0.02, mat, 0, 0, 0, 0.004));
  g.add(rbox(w - 2 * frame, h - 2 * frame, 0.02 + raise * 2, mat, 0, 0, raise, 0.012));
  g.position.set(x, y, z); return g;
}
/** Gedrechseltes Bein (Lathe), Höhe hgt, Radius r. */
export function turnedLeg(hgt, r, mat) {
  const pts = [[0, 0], [r * 0.7, 0], [r * 0.8, hgt * 0.04], [r * 0.55, hgt * 0.12], [r * 0.9, hgt * 0.3], [r * 0.6, hgt * 0.42], [r * 0.6, hgt * 0.78], [r, hgt * 0.84], [r, hgt * 0.96], [r * 0.85, hgt], [0, hgt]];
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 18), mat);
}
/** Zierrahmen (Gold/Holz) mit innerer Fase, Bild (Material) in der Mitte. */
export function ornateFrame(w, h, picMat, frameMat, depth = 0.05, border = 0.07) {
  const g = new THREE.Group();
  const bar = (bw, bh, x, y) => g.add(rbox(bw, bh, depth, frameMat, x, y, 0, 0.018));
  bar(w, border, 0, h / 2 - border / 2); bar(w, border, 0, -h / 2 + border / 2); bar(border, h, -w / 2 + border / 2, 0); bar(border, h, w / 2 - border / 2, 0);
  const inner = (bw, bh, x, y) => g.add(rbox(bw, bh, depth * 0.5, frameMat, x, y, depth * 0.1, 0.006));
  const b2 = border * 0.35, iw = w - 2 * border, ih = h - 2 * border;
  inner(iw, b2, 0, ih / 2 - b2 / 2); inner(iw, b2, 0, -ih / 2 + b2 / 2); inner(b2, ih, -iw / 2 + b2 / 2, 0); inner(b2, ih, iw / 2 - b2 / 2, 0);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(iw - b2, ih - b2), picMat); pic.position.z = -depth * 0.1; g.add(pic);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.01), new THREE.MeshStandardMaterial({ color: 0x0a0806 })); back.position.z = -depth / 2; g.add(back);
  return g;
}

/** Tischlampe aus Code: gedrechselter Messingfuß, Stoffschirm, warm leuchtend (Bloom). Höhe ca. hgt. */
export function tableLamp(hgt = 0.55, shadeColor = 0x8a5a34, brass = brassMat()) {
  const g = new THREE.Group();
  const base = [[0, 0], [0.09, 0], [0.095, 0.015], [0.06, 0.035], [0.03, 0.06], [0.022, hgt * 0.25], [0.04, hgt * 0.32], [0.02, hgt * 0.4], [0.014, hgt * 0.6], [0, hgt * 0.6]];
  g.add(new THREE.Mesh(new THREE.LatheGeometry(base.map(([a, b]) => new THREE.Vector2(a, b)), 20), brass));
  const shadeMat = new THREE.MeshStandardMaterial({ color: shadeColor, emissive: 0xff9a40, emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(hgt * 0.2, hgt * 0.36, hgt * 0.38, 28, 1, true), shadeMat); shade.position.y = hgt * 0.74; g.add(shade);
  const trim = (r, y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 28), brass); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); };
  trim(hgt * 0.2, hgt * 0.93); trim(hgt * 0.36, hgt * 0.55);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(hgt * 0.07, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff0c8 })); bulb.position.y = hgt * 0.68; g.add(bulb);
  return g;
}
