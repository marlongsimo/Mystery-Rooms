/*
 * HOTEL NOCTURNE – Gegenstände genauer ansehen (3D-Testmodus)
 * Aus dem Rucksack: „Genauer ansehen“ öffnet den Gegenstand groß vor dunklem Hintergrund. Ziehen dreht, Mausrad/zwei Finger zoomen.
 * Eigenes kleines Bild (eigener Renderer, wird beim Schließen freigegeben). Inhalte nur aus den vorhandenen Gegenstandstexten.
 * Modelle: key217 (Anhänger vorn „217“, hinten „gilt auch für den Aufzug“), schraubendreher.
 */
import { THREE, canvasTex } from "./core.js?v=4";

const N = window.NOCTURNE;
const brass = () => new THREE.MeshStandardMaterial({ color: 0xc09a58, metalness: 1, roughness: 0.28 });
const engraved = (w, h, draw) => canvasTex(w, h, (g) => { g.fillStyle = "#b8924e"; g.fillRect(0, 0, w, h); g.globalAlpha = 0.18; for (let i = 0; i < 1600; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#fff"; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); } g.globalAlpha = 1; draw(g, w, h); });

const MODELS = {
  key217() {
    const g = new THREE.Group(), m = brass();
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 14, 36), m); bow.position.x = -0.1; g.add(bow);
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.17, 16), m); shank.rotation.z = Math.PI / 2; shank.position.x = 0.03; g.add(shank);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16), m); collar.rotation.z = Math.PI / 2; collar.position.x = -0.045; g.add(collar);
    [[0.08, 0.02, 0.012], [0.095, 0.028, 0.012], [0.11, 0.016, 0.012]].forEach(([x, h, w]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.006), m); b.position.set(x, -0.012 - h / 2, 0); g.add(b); }); // Bart
    // Ring und Anhänger: vorn „217“, hinten „gilt auch für den Aufzug“ (wie im Gegenstandstext)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 8, 24), m); ring.position.set(-0.155, -0.02, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
    const tagG = new THREE.Group(); tagG.position.set(-0.16, -0.1, 0); tagG.rotation.z = -0.08; g.add(tagG);
    const shape = new THREE.Shape(); const w = 0.07, h = 0.11, r = 0.012;
    shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const hole = new THREE.Path(); hole.absarc(0, h / 2 - 0.014, 0.005, 0, Math.PI * 2, true); shape.holes.push(hole);
    tagG.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 2 }), m));
    const front = engraved(256, 384, (c, W, H) => { c.fillStyle = "#4a3418"; c.font = "700 120px Georgia, serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("217", W / 2, H * 0.58); c.font = "600 26px Georgia, serif"; c.fillText("NOCTURNE", W / 2, H * 0.84); });
    const back = engraved(256, 384, (c, W, H) => { c.fillStyle = "#4a3418"; c.font = "italic 30px Georgia, serif"; c.textAlign = "center"; c.fillText("gilt auch", W / 2, H * 0.5); c.fillText("für den", W / 2, H * 0.6); c.fillText("Aufzug", W / 2, H * 0.7); });
    const fm = (t) => new THREE.MeshStandardMaterial({ map: t, metalness: 0.85, roughness: 0.35 });
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.8), fm(front)); pf.position.set(0, -0.006, 0.0058); tagG.add(pf);
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.8), fm(back)); pb.position.set(0, -0.006, -0.0018); pb.rotation.y = Math.PI; tagG.add(pb);
    g.userData.size = 0.32; return g;
  },
  schraubendreher() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0x8a2a1c, roughness: 0.35 })); handle.rotation.z = Math.PI / 2; handle.position.x = -0.07; g.add(handle);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 10), handle.material); cap.position.x = -0.12; g.add(cap);
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 1, roughness: 0.25 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 12), steel); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.045; g.add(shaft);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.0015), steel); tip.position.x = 0.115; g.add(tip);
    g.userData.size = 0.26; return g;
  },
};

let open = null;
function envFor(renderer) { // einfache Studio-Umgebung für Metallglanz
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x1a1612);
  const add = (w, h, c, x, y, z, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); p.position.set(x, y, z); p.rotation.y = ry; sc.add(p); };
  add(4, 2, 0xfff0d8, 0, 3, 0); add(3, 3, 0x8a7a64, -4, 1, 0, Math.PI / 2); add(2, 2, 0xffd8a0, 3, 1, 2, -Math.PI / 3);
  sc.children[0].rotation.x = Math.PI / 2;
  const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(sc, 0.04).texture; pm.dispose(); return t;
}

function inspect(id) {
  if (!MODELS[id]) return false;
  close();
  if (N.view3d.pause) N.view3d.pause(true); // Raumbild anhalten, solange der Gegenstand groß zu sehen ist
  const it = N.items[id] || { name: id };
  const el = document.createElement("div"); el.className = "n3d-inspect";
  el.innerHTML = `<div class="n3d-inspect-head"><b>${it.name}</b><button type="button" data-close aria-label="Schließen">✕</button></div><canvas></canvas><p class="n3d-inspect-hint">Ziehen zum Drehen · Mausrad oder zwei Finger zum Zoomen</p>`;
  document.body.appendChild(el);
  const canvas = el.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.environment = envFor(renderer);
  const cam = new THREE.PerspectiveCamera(35, 1, 0.01, 10);
  scene.add(new THREE.HemisphereLight(0xfff0e0, 0x201810, 0.6)); const key = new THREE.DirectionalLight(0xffe8c8, 2.2); key.position.set(1, 2, 2); scene.add(key);
  const model = MODELS[id](); const holder = new THREE.Group(); holder.add(model); scene.add(holder);
  const size = model.userData.size || 0.3; let dist = size * 2.4; const dMin = size * 0.9, dMax = size * 4;
  let rx = 0.25, ry = -0.5, vx = 0, vy = 0.35, drag = null; const ptrs = new Map(); let pinch = null;
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist }; drag = null; } else drag = { x: e.clientX, y: e.clientY }; vx = vy = 0; });
  canvas.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; dist = Math.max(dMin, Math.min(dMax, pinch.dist * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return; }
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    ry += dx * 0.01; rx = Math.max(-1.3, Math.min(1.3, rx + dy * 0.01)); vy = dx * 0.6; vx = dy * 0.6;
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; drag = null; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); dist = Math.max(dMin, Math.min(dMax, dist * (e.deltaY > 0 ? 1.08 : 0.92))); }, { passive: false });
  el.querySelector("[data-close]").onclick = close;
  const onKey = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", onKey);
  let run = true, last = performance.now();
  const loop = () => { if (!run) return; requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag) { ry += vy * dt; rx += vx * dt * 0.3; vy *= 0.96; vx *= 0.9; }
    holder.rotation.set(rx, ry, 0, "YXZ"); cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0); renderer.render(scene, cam); };
  loop();
  N.audio && N.audio.play && N.audio.play("pickup");
  open = { el, id, stop: () => { run = false; document.removeEventListener("keydown", onKey); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach((mm) => { if (mm.map) mm.map.dispose(); mm.dispose(); }); }); scene.environment && scene.environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); el.remove(); },
    info: () => ({ id, rx, ry, dist }) };
  return true;
}
function close() { if (open) { const o = open; open = null; o.stop(); if (N.view3d.pause) N.view3d.pause(false); } }

N.view3d.canInspect = (id) => Boolean(MODELS[id]);
N.view3d.inspect = (id) => { try { return inspect(id); } catch (e) { console.warn("[Hotel Nocturne 3D] Ansehen nicht möglich:", e); close(); return false; } };
N.view3d.inspectInfo = () => (open ? open.info() : null);
N.view3d.inspectClose = close;
