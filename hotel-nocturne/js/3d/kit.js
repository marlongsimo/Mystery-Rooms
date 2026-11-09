/*
 * HOTEL NOCTURNE – 3D-Baukasten für Räume (ab Zimmer 217)
 * Texturen und Raumhülle, die mehrere Räume teilen. Die Rezeption hat ihre Helfer noch lokal.
 */
import { THREE, canvasTex, lambert, box, plane, wallMesh, walls } from "./core.js?v=4";

export const textTex = (w, h, bg, draw) => canvasTex(w, h, (g) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } draw(g, w, h); });

/** Streifentapete (eine Kachel = 1 m). */
export const wallpaper = (base, stripe, line) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = stripe; g.fillRect(x, 0, 14, h); g.fillStyle = line; g.fillRect(x + 14, 0, 2, h); }
  g.globalAlpha = 0.16; for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#5a4a44"; g.fillRect(Math.random() * w, Math.random() * h, 1, 2); }
}, { repeat: [1, 1] });

export const woodTex = (base = "#3a271a", line = "#2a1b11", rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.strokeStyle = line; g.globalAlpha = 0.25 + Math.random() * 0.35; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke(); }
}, { repeat: rep });

/** Dielenboden (Kachel 1 m, 5 Dielen). */
export const plankTex = (base = "#2a1d14", line = "#140d08") => canvasTex(256, 256, (g, w, h) => {
  const n = 5, s = h / n;
  for (let i = 0; i < n; i++) { const l = 22 + Math.random() * 10; g.fillStyle = `hsl(25, 30%, ${l * 0.5}%)`; g.fillRect(0, i * s, w, s); g.fillStyle = base; g.globalAlpha = 0.55; g.fillRect(0, i * s, w, s); g.globalAlpha = 1; }
  g.strokeStyle = line; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  for (let i = 0; i < n; i++) { const x = Math.random() * w; g.beginPath(); g.moveTo(x, i * s); g.lineTo(x, (i + 1) * s); g.stroke(); }
  g.globalAlpha = 0.18; for (let k = 0; k < 120; k++) { g.strokeStyle = "#000"; const y = Math.random() * h; g.beginPath(); g.moveTo(Math.random() * w, y); g.lineTo(Math.random() * w, y + 1); g.stroke(); }
}, { repeat: [1, 1] });

export const plaqueTex = (text, w = 512, h = 96, fg = "#b69a6d", bg = "#1a120c", font = "500 44px Georgia, serif", spacing = 10) => textTex(w, h, bg, (g) => {
  g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
  if ("letterSpacing" in g) g.letterSpacing = spacing + "px";
  g.fillText(text, w / 2, h / 2 + 2);
});

/** Regen vor dunklem Himmel (Offset in anim() verschieben). */
export const rainTex = () => canvasTex(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0d1622"); gr.addColorStop(1, "#1a2433"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(190,210,240,.45)"; g.lineWidth = 1.2;
  for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h, l = 12 + Math.random() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + l); g.stroke(); }
}, { repeat: [1, 1] });

/**
 * Raumhülle: Boden, Decke, vier Wände mit Öffnungen, Sockelleiste, Stuckleiste.
 * holes: { n: [{x, y, w, h, arch?}], e: [...], s: [...], w: [...] } in Wandkoordinaten (x von −R bis R).
 */
export function shell(ctx, { R, H, holes = {}, wallMat, floorMat, ceilMat, trimMat, wainscot = null }) {
  const { add } = ctx; const { place } = walls(R);
  const floor = plane(2 * R, 2 * R, floorMat); floor.rotation.x = -Math.PI / 2; add(floor);
  if (floorMat.map) floorMat.map.repeat.set(2 * R, 2 * R);
  const ceil = plane(2 * R, 2 * R, ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; add(ceil);
  for (const k of ["n", "e", "s", "w"]) {
    const hs = holes[k] || [];
    add(place(wallMesh(2 * R, H, hs, wallMat), k, 0.5, 0, 0));
    const segs = []; let from = -R;
    [...hs].filter((o) => o.y < 0.05).sort((a, b) => a.x - b.x).forEach((o) => { segs.push([from, o.x - o.w / 2]); from = o.x + o.w / 2; });
    segs.push([from, R]);
    segs.forEach(([a, b]) => {
      if (b - a < 0.05) return; const u = (a + b) / 2 / (2 * R) + 0.5;
      if (wainscot) add(place(box(b - a, wainscot.h, 0.03, wainscot.mat, 0, wainscot.h / 2, 0.015), k, u, 0, 0));
      add(place(box(b - a, 0.12, 0.04, trimMat, 0, 0.06, 0.02), k, u, 0, 0));
    });
    add(place(box(2 * R, 0.12, 0.1, trimMat, 0, H - 0.06, 0.05), k, 0.5, 0, 0));
  }
  return { place };
}

export { THREE, lambert };
