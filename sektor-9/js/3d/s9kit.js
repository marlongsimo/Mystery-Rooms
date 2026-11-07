/*
 * SEKTOR 9 – 3D-Baukasten für den Bunker: Beton, Stahl, Panzertüren mit Handrad, Standpunkt-Markierungen,
 * Röhrenbildschirme, Lampen. Alles aus Code (keine Fremdmodelle).
 */
import { THREE, canvasTex, box, cyl, plane, group, wallMesh } from "./core.js?v=1";
import { tag } from "./gfx.js?v=1";
import { plaqueTex } from "./kit.js?v=2";

export const MONO = "DM Mono, monospace";
const rnd = (() => { let s = 1987; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

/** Beton mit Schalungsfugen, Flecken und Rissen. */
export function concreteTex(base = "#6f716b", rep = [1, 1], { joints = true, stains = 1 } = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = Math.floor(rnd() * 40 - 20); g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 400})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
    for (let i = 0; i < 14 * stains; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(20,18,14,${0.08 + rnd() * 0.1})`); gr.addColorStop(1, "rgba(20,18,14,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 6 * stains; i++) { const x = rnd() * w; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(60,40,20,.18)"); gr.addColorStop(1, "rgba(60,40,20,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2 + rnd() * 6, h * (0.3 + rnd() * 0.6)); }
    if (joints) { g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
      g.fillStyle = "rgba(0,0,0,.35)"; [[w * 0.25, h * 0.25], [w * 0.75, h * 0.25], [w * 0.25, h * 0.75], [w * 0.75, h * 0.75]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }); }
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; for (let i = 0; i < 3; i++) { let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rnd() * 30 - 15; y += rnd() * 24; g.lineTo(x, y); } g.stroke(); }
  }, { repeat: rep });
}
/** Betonboden mit Fugen und gelber Markierung optional. */
export function floorTex(rep = [4, 4]) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#4a4c47"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) { const v = rnd(); g.fillStyle = `rgba(${v > 0.5 ? "255,255,255" : "0,0,0"},${rnd() * 0.06})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    for (let i = 0; i < 10; i++) { const x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 80, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(10,10,8,.2)"); gr.addColorStop(1, "rgba(10,10,8,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
  }, { repeat: rep });
}
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });
export function mats() {
  return {
    wall: tag(new THREE.MeshLambertMaterial({ color: 0xffffff, map: concreteTex("#71736c", [2, 1]) }), { roughness: 0.92, normal: 1.6 }),
    wallLow: std(0x3a4a3c, { roughness: 0.6 }), // grün gestrichener Sockel
    floor: tag(new THREE.MeshLambertMaterial({ color: 0xffffff, map: floorTex([6, 5]) }), { roughness: 0.7, normal: 0.8 }),
    ceil: tag(new THREE.MeshLambertMaterial({ color: 0xffffff, map: concreteTex("#55574f", [3, 3], { joints: false }) }), { roughness: 0.95, normal: 1.2 }),
    steel: std(0x5a5e58, { metalness: 0.75, roughness: 0.42 }), steelDark: std(0x2e322e, { metalness: 0.6, roughness: 0.5 }),
    paint: std(0x3d5a44, { roughness: 0.55, metalness: 0.2 }), paintGrey: std(0x6c706a, { roughness: 0.5, metalness: 0.3 }),
    rust: std(0x7a4a2c, { roughness: 0.85, metalness: 0.3 }), red: std(0x9a2a22, { roughness: 0.5 }), yellow: std(0xc9a030, { roughness: 0.6 }),
    black: std(0x0b0c0b, { roughness: 0.6 }), rubber: std(0x151615, { roughness: 0.9 }), paper: std(0xe4dcc6, { roughness: 0.95 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9fb7a8, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, depthWrite: false }),
    wood: std(0x4a3a2a, { roughness: 0.7 }),
  };
}
export const label = (text, w = 512, h = 96, fg = "#e8e2cc", bg = "#2d3a30", px = 40) => new THREE.MeshLambertMaterial({ map: plaqueTex(text, w, h, fg, bg, `500 ${px}px ${MONO}`, 4) });
export const stencil = (text, w = 1024, h = 160, fg = "#d8d0b4", px = 110) => new THREE.MeshLambertMaterial({ transparent: true, map: canvasTex(w, h, (g) => { g.fillStyle = fg; g.font = `600 ${px}px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.globalAlpha = 0.85; g.fillText(text, w / 2, h / 2 + 4); g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 900; i++) { g.globalAlpha = rnd() * 0.5; g.fillRect(rnd() * w, rnd() * h, 2, 2); } }) });

/** Raum als Kasten: Boden, Decke, vier Wände (Vorderseite nach innen) mit Öffnungen { n:[{x,y,w,h}], … } in Wandkoordinaten (x von links, wie man davor steht). */
export function shellBox(ctx, { W, D, H, M, holes = {}, base = 1.1 }) {
  const { add } = ctx;
  const fl = plane(W, D, M.floor); fl.rotation.x = -Math.PI / 2; add(fl);
  const ce = plane(W, D, M.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = H; add(ce);
  const side = (key, len, pos, rotY) => {
    const w = wallMesh(len, H, holes[key] || [], M.wall); w.position.set(...pos); w.rotation.y = rotY; add(w);
    const s = wallMesh(len, base, (holes[key] || []).filter((o) => o.y < base).map((o) => ({ ...o, h: Math.min(o.h, base - o.y) })), M.wallLow); s.position.set(pos[0], 0, pos[2]); s.position.add(new THREE.Vector3(0, 0, 0.004).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)); s.rotation.y = rotY; add(s);
  };
  side("n", W, [0, 0, -D / 2], 0); side("s", W, [0, 0, D / 2], Math.PI); side("e", D, [W / 2, 0, 0], -Math.PI / 2); side("w", D, [-W / 2, 0, 0], Math.PI / 2);
}

/** Panzertür (Schott) mit Rahmen, Riegeln und Handrad. Rückgabe: { g, pivot (Türblatt, dreht um die linke Kante), wheel }. Lokal: Front +z, Unterkante y=0. */
export function blastDoor(M, { w = 1.5, h = 2.3, text = "", plate = null, wheel = true, reader = false } = {}) {
  const g = new THREE.Group();
  const fr = 0.18;
  g.add(box(w + 2 * fr, fr, 0.4, M.steelDark, 0, h + fr / 2, 0), box(fr, h + fr, 0.4, M.steelDark, -w / 2 - fr / 2, (h + fr) / 2, 0), box(fr, h + fr, 0.4, M.steelDark, w / 2 + fr / 2, (h + fr) / 2, 0));
  g.add(box(w + 2 * fr + 0.3, 0.06, 0.5, M.yellow, 0, 0.03, 0.05)); // Schwelle
  const pivot = new THREE.Group(); pivot.position.set(-w / 2, 0, 0.12); g.add(pivot);
  const leaf = new THREE.Group(); leaf.position.x = w / 2; pivot.add(leaf);
  leaf.add(box(w, h, 0.16, M.steel, 0, h / 2, 0));
  [0.25, h - 0.25].forEach((y) => leaf.add(box(w - 0.1, 0.06, 0.04, M.steelDark, 0, y, 0.1)));
  for (let i = 0; i < 6; i++) leaf.add(cyl(0.025, 0.025, 0.02, M.steelDark, -w / 2 + 0.12 + (i % 2) * (w - 0.24), 0.4 + Math.floor(i / 2) * (h - 0.8) / 2, 0.09, 10).rotateX(Math.PI / 2));
  if (text) { const t = plane(w * 0.8, w * 0.8 * 0.16, stencil(text)); t.position.set(0, h - 0.55, 0.085); leaf.add(t); }
  if (plate) { const p = plane(0.5, 0.11, label(plate, 512, 112, "#e8e2cc", "#2d3a30", 44)); p.position.set(0, h - 0.82, 0.085); leaf.add(p); }
  let wh = null;
  if (wheel) {
    wh = new THREE.Group(); wh.position.set(0, h * 0.5, 0.2);
    wh.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 10, 32), M.rust));
    for (let i = 0; i < 4; i++) { const s = box(0.56, 0.035, 0.035, M.rust); s.rotation.z = (i * Math.PI) / 4; wh.add(s); }
    wh.add(cyl(0.06, 0.06, 0.12, M.steelDark, 0, 0, -0.04, 16).rotateX(Math.PI / 2));
    wh.add(box(0.66, 0.66, 0.1, new THREE.MeshBasicMaterial({ visible: false }), 0, 0, 0)); // Greiffläche
    leaf.add(wh);
  }
  let led = null;
  if (reader) {
    const r = group(box(0.14, 0.22, 0.06, M.black, 0, 0, 0), box(0.1, 0.012, 0.02, M.steelDark, 0, 0.03, 0.035));
    led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd0473a, toneMapped: false })); led.position.set(0, -0.07, 0.035); r.add(led);
    r.position.set(w / 2 + fr + 0.22, 1.3, 0.05); g.add(r);
  }
  return { g, pivot, wheel: wh, led };
}

/** Standpunkt-Markierung: leuchtender Ring am Boden und ein Schild. Rückgabe: Gruppe (als Hotspot binden). */
export function stationMark(text, { sign = true, signY = 2.2 } = {}) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.4, 40), new THREE.MeshBasicMaterial({ color: 0x8fd19e, transparent: true, opacity: 0.55, toneMapped: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ color: 0x8fd19e, transparent: true, opacity: 0.12, toneMapped: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.019; g.add(disc);
  if (sign) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.18), new THREE.MeshBasicMaterial({ map: plaqueTex("▸ " + text, 512, 100, "#8fd19e", "#0b120d", `500 40px ${MONO}`, 4), toneMapped: false, transparent: true, opacity: 0.92 })); s.position.y = signY; s.userData.billboard = true; g.add(s); }
  g.add(box(0.9, signY + 0.2, 0.9, new THREE.MeshBasicMaterial({ visible: false }), 0, (signY + 0.2) / 2, 0)); // Klickfläche
  g.userData.ring = ring;
  return g;
}
/** Schilder an Standpunkten drehen sich zur Kamera; Ringe pulsieren. */
export function animateMarks(ctx, marks) {
  ctx.anim((dt, t) => { const cam = ctx.scene.children.find((c) => c.isCamera); marks.forEach((m, i) => { m.children.forEach((c) => { if (c.userData.billboard && cam) { const p = cam.getWorldPosition(new THREE.Vector3()); const q = c.getWorldPosition(new THREE.Vector3()); c.rotation.y = Math.atan2(p.x - q.x, p.z - q.z) - (m.rotation.y || 0); } }); if (m.userData.ring) m.userData.ring.material.opacity = 0.35 + Math.sin(t * 2 + i) * 0.2; }); });
}

/** Röhrenbildschirm: { g, paint(fn(g, w, h)) } – Gehäuse grau, Bild grün. */
export function crt(M, w = 0.5, h = 0.38, res = [320, 240]) {
  const c = document.createElement("canvas"); c.width = res[0]; c.height = res[1]; const g2 = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const gg = group(box(w + 0.12, h + 0.12, 0.42, M.paintGrey, 0, 0, -0.2), box(w + 0.04, h + 0.04, 0.03, M.black, 0, 0, 0.015));
  const scr = plane(w, h, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.032; gg.add(scr);
  const paint = (fn) => { g2.save(); g2.fillStyle = "#020803"; g2.fillRect(0, 0, c.width, c.height); fn(g2, c.width, c.height); g2.restore();
    g2.fillStyle = "rgba(0,0,0,.25)"; for (let y = 0; y < c.height; y += 3) g2.fillRect(0, y, c.width, 1);
    const v = g2.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.3, c.width / 2, c.height / 2, c.height * 0.8); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.6)"); g2.fillStyle = v; g2.fillRect(0, 0, c.width, c.height); tex.needsUpdate = true; };
  return { g: gg, paint, screen: scr };
}
export const termText = (g, lines, { x = 16, y = 34, step = 30, size = 20, col = "#8fd19e" } = {}) => { g.font = `500 ${size}px ${MONO}`; g.shadowColor = col; g.shadowBlur = 6; lines.forEach((l, i) => { g.fillStyle = Array.isArray(l) ? l[1] : col; g.fillText(Array.isArray(l) ? l[0] : l, x, y + i * step); }); g.shadowBlur = 0; };

/** Käfiglampe an der Wand/Decke mit Punktlicht (warm). Rückgabe: { g, light, bulb }. */
export function cageLamp(M, color = 0xffc070, intensity = 3, dist = 7) {
  const g = new THREE.Group();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: color, emissiveIntensity: 2 }));
  g.add(cyl(0.09, 0.09, 0.05, M.steelDark, 0, 0.05, 0, 16), bulb);
  for (let i = 0; i < 4; i++) { const r = box(0.008, 0.16, 0.008, M.steelDark, Math.cos(i * Math.PI / 2) * 0.08, -0.04, Math.sin(i * Math.PI / 2) * 0.08); g.add(r); }
  const light = new THREE.PointLight(color, intensity, dist, 2); light.position.y = -0.08; g.add(light);
  return { g, light, bulb };
}
/** Leuchtstoffröhre (Deckenleuchte). */
export function tube(M, len = 1.4) {
  const g = new THREE.Group(); const glow = new THREE.MeshStandardMaterial({ color: 0xe8f0e8, emissive: 0xdfeee0, emissiveIntensity: 0 });
  g.add(box(len + 0.1, 0.06, 0.18, M.paintGrey, 0, 0.03, 0)); const t = cyl(0.025, 0.025, len, glow, 0, -0.02, 0, 10); t.rotation.z = Math.PI / 2; g.add(t);
  const light = new THREE.PointLight(0xe0efe4, 0, 9, 2); light.position.y = -0.2; g.add(light);
  return { g, glow, light };
}
/** Rohrleitung entlang x. */
export const pipe = (M, len, r, x, y, z, rotY = 0) => { const p = cyl(r, r, len, M.rust, 0, 0, 0, 14); p.rotation.z = Math.PI / 2; const g = group(p); g.position.set(x, y, z); g.rotation.y = rotY; return g; };
/** Papierblatt mit Textur (liegend). */
export function sheet(w, h, draw, M, tilt = 0) {
  const m = plane(w, h, new THREE.MeshLambertMaterial({ map: canvasTex(256, Math.round(256 * h / w), (g, W, H) => { g.fillStyle = "#e6dfca"; g.fillRect(0, 0, W, H); draw && draw(g, W, H); }) }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = tilt; return m;
}
export const lines = (g, W, H, n = 12, x0 = 16, y0 = 30) => { g.fillStyle = "#2a2a2a"; for (let i = 0; i < n; i++) g.fillRect(x0, y0 + i * ((H - y0 - 10) / n), (W - 2 * x0) * (0.5 + ((i * 37) % 50) / 100), 3); };
