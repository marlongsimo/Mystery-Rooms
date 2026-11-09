/*
 * HOTEL NOCTURNE – Ankunft als 3D-Kamerafahrt (nur 3D-Testmodus)
 * Ersetzt die vier Standbilder der Prolog-Ankunft (Texte aus js/prolog.js, gleiche Reihenfolge) durch eine Fahrt:
 *   A  0–15 s  Durch die Windschutzscheibe die Zufahrt hinauf (Wischer, Scheinwerfer, Blitz zeigt kurz die Westmauer mit Tor W2)
 *   B 15–31 s  Zu Fuß mit der Taschenlampe zum Eingang, die Tür geht von selbst auf, hinein
 *   C 31–40 s  Durch die Lobby, Blick auf die stehende Uhr (23:17), das Ticken hört auf
 *   D 40–46 s  Umdrehen – die Tür schlägt zu, Riegel, Schwarz
 *   E 46–49 s  Aufblenden auf die Startansicht der Rezeption, die Kinobalken fahren weg → das Spiel beginnt in genau diesem Bild
 * Außen (Fassade, Zufahrt, Bäume, Regen) wird nur für das Intro gebaut und danach wieder entfernt; innen ist es
 * dieselbe Szene, die das Spiel benutzt (core.cinemaHost). Überspringen jederzeit; bei „Bewegung reduzieren“ oder ohne WebGL
 * läuft die bisherige Bildfolge.
 */
import { THREE, canvasTex, cinemaHost } from "./core.js?v=4";

const N = window.NOCTURNE;
const A = () => N.audio;
const host = cinemaHost();
const DOOR_Z = 3.2, FACADE_Z = 3.45, GROUND = -0.5; // Rezeption: R = 3,2, Südwand = Eingang
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const span = (t, a, b) => ease((t - a) / (b - a));
const mix = (a, b, k) => a + (b - a) * k;

/* ---------- Texturen ---------- */
const stoneTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#2a2622"; g.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -64 : 0;
    while (x < w) { const bw = 96 + Math.random() * 64, l = 14 + Math.random() * 8; g.fillStyle = `hsl(28, 8%, ${l}%)`; g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4); x += bw; }
  }
  g.globalAlpha = 0.25; for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#6a6058"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.35; for (let i = 0; i < 26; i++) { const x = Math.random() * w; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.8)"); g.fillStyle = gr; g.fillRect(x, Math.random() * h * 0.5, 3 + Math.random() * 6, h); } // Regenspuren
}, { repeat: [1, 1] });
const groundTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#121315"; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.35; for (let i = 0; i < 14000; i++) { g.fillStyle = Math.random() > 0.5 ? "#050506" : "#3a3a3c"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.6; for (let i = 0; i < 10; i++) { g.fillStyle = "#050608"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 12 + Math.random() * 30, Math.random(), 0, Math.PI * 2); g.fill(); } // Pfützen
}, { repeat: [1, 1] });
const skyTex = () => canvasTex(1024, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#020305"); gr.addColorStop(0.45, "#0b1018"); gr.addColorStop(0.52, "#161c26"); gr.addColorStop(1, "#05070a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.18; for (let i = 0; i < 60; i++) { g.fillStyle = "#3a4656"; g.beginPath(); g.ellipse(Math.random() * w, h * (0.15 + Math.random() * 0.3), 60 + Math.random() * 140, 14 + Math.random() * 30, 0, 0, Math.PI * 2); g.fill(); } // Wolken
  g.globalAlpha = 1; g.fillStyle = "#04050600"; g.fillStyle = "#030405"; g.beginPath(); g.moveTo(0, h * 0.53); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * (0.5 - Math.sin(x * 0.01) * 0.02 - Math.sin(x * 0.033) * 0.01)); g.lineTo(w, h); g.lineTo(0, h); g.fill(); // Hügel
});
const signTex = () => canvasTex(1024, 160, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = "#c9a86a"; g.font = "600 112px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; if ("letterSpacing" in g) g.letterSpacing = "28px"; g.fillText("NOCTURNE", w / 2 + 14, h / 2 + 6);
});
const w2Tex = () => canvasTex(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#cfd8e0"; g.font = "600 72px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("W2", w / 2, h / 2); });

/* ---------- Außenbereich ---------- */
function buildExterior() {
  const G = new THREE.Group();
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, envMapIntensity: 0.15, ...o });
  const stone = stoneTex(); stone.repeat.set(0.3, 0.3);
  const M = {
    stone: std(0xffffff, { map: stone, roughness: 0.92 }), dark: std(0x141210), trim: std(0x3a342c, { roughness: 0.85 }),
    roof: std(0x15171a, { roughness: 0.55 }), glass: std(0x0a0e14, { roughness: 0.08, metalness: 0.6, envMapIntensity: 0.5 }),
    iron: std(0x16171a, { metalness: 0.7, roughness: 0.5 }), leaf: std(0x0b120d, { roughness: 1, flatShading: true }), bark: std(0x16110c),
  };
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); G.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);

  // Fassade (Kontur mit Mittelgiebel), Eingangsbogen deckungsgleich mit dem Eingang der Rezeption
  const sh = new THREE.Shape(); [[-15, 0], [15, 0], [15, 10.5], [4, 10.5], [4, 12], [0, 14.5], [-4, 12], [-4, 10.5], [-15, 10.5]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const arch = new THREE.Path(), r = 0.95, ay = -GROUND; arch.moveTo(-r, ay); arch.lineTo(r, ay); arch.lineTo(r, ay + 2.8 - r); arch.absarc(0, ay + 2.8 - r, r, 0, Math.PI, false); arch.lineTo(-r, ay); sh.holes.push(arch);
  add(new THREE.ShapeGeometry(sh), M.stone, 0, GROUND, FACADE_Z);
  // Laibung des Bogens (Wandstärke), Schwelle
  box(0.04, 1.85, FACADE_Z - DOOR_Z, M.trim, -r, 0.925, (FACADE_Z + DOOR_Z) / 2); box(0.04, 1.85, FACADE_Z - DOOR_Z, M.trim, r, 0.925, (FACADE_Z + DOOR_Z) / 2);
  const archG = new THREE.CylinderGeometry(r, r, FACADE_Z - DOOR_Z, 24, 1, true, Math.PI / 2, Math.PI); archG.rotateX(Math.PI / 2);
  add(archG, new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: 0.85, side: THREE.DoubleSide }), 0, 1.85, (FACADE_Z + DOOR_Z) / 2);
  box(2.0, 0.04, FACADE_Z - DOOR_Z + 0.02, M.trim, 0, -0.02, (FACADE_Z + DOOR_Z) / 2);
  // Gebäudekörper und Dach (Vorderseite offen: dahinter liegt die Lobby)
  const bodyMats = [M.stone, M.stone, M.roof, M.dark, new THREE.MeshBasicMaterial({ visible: false }), M.dark];
  add(new THREE.BoxGeometry(30, 10.5, 16), bodyMats, 0, GROUND + 5.25, FACADE_Z - 8.01);
  const tri = new THREE.Shape(); tri.moveTo(-8.2, 0); tri.lineTo(8.2, 0); tri.lineTo(0, 4.2); tri.lineTo(-8.2, 0);
  const roof = add(new THREE.ExtrudeGeometry(tri, { depth: 30.4, bevelEnabled: false }), M.roof, -15.2, GROUND + 10.5, FACADE_Z - 8); roof.rotation.y = Math.PI / 2;
  [[-9, 1], [9, 1], [-3, 2]].forEach(([x, k]) => box(0.7, 2.4, 0.7, M.dark, x, GROUND + 13 + k * 0.3, FACADE_Z - 6)); // Schornsteine
  // Gesimse, Sockel
  [3.9, 7.1, 10.4].forEach((y) => box(30.4, 0.22, 0.3, M.trim, 0, GROUND + y, FACADE_Z + 0.12));
  box(30.4, 0.6, 0.12, M.dark, 0, GROUND + 0.3, FACADE_Z + 0.06);
  // Fenster: dunkles Glas mit Rahmen und Sims; eines brennt (zweiter Stock)
  let lit = null;
  const win = (x, y, w = 1.3, h = 1.9) => {
    const g = new THREE.Group(); g.position.set(x, GROUND + y, FACADE_Z + 0.01);
    const isLit = x === 5.5 && y > 7;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), isLit ? new THREE.MeshStandardMaterial({ color: 0x3a2410, emissive: 0xe7a85a, emissiveIntensity: 1.1, roughness: 0.6 }) : M.glass);
    g.add(pane);
    [[0, h / 2 + 0.06, w + 0.24, 0.12], [0, -h / 2 - 0.06, w + 0.4, 0.12]].forEach(([fx, fy, fw, fh]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.22), M.trim); b.position.set(fx, fy, 0.08); g.add(b); });
    [-1, 1].forEach((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.14), M.trim); b.position.set(s * (w / 2 + 0.05), 0, 0.05); g.add(b); });
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.06), M.dark); cross.position.z = 0.02; g.add(cross);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.06), M.dark); cross2.position.set(0, h * 0.18, 0.02); g.add(cross2);
    if (isLit) { lit = pane; const curtain = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.35, h), new THREE.MeshBasicMaterial({ color: 0x1a0c06, transparent: true, opacity: 0.85 })); curtain.position.set(-w * 0.33, 0, 0.005); g.add(curtain); }
    G.add(g);
  };
  [-12.5, -9, -5.5, 5.5, 9, 12.5].forEach((x) => win(x, 1.9));
  [-12.5, -9, -5.5, -2, 2, 5.5, 9, 12.5].forEach((x) => { win(x, 5.4); win(x, 8.7); });
  const rose = add(new THREE.CircleGeometry(0.7, 32), M.glass, 0, GROUND + 12, FACADE_Z + 0.02);
  add(new THREE.TorusGeometry(0.72, 0.08, 8, 32), M.trim, 0, GROUND + 12, FACADE_Z + 0.04); void rose;
  const litL = new THREE.PointLight(0xffb060, 14, 9, 2); litL.position.set(5.5, GROUND + 8.7, FACADE_Z + 1.6); G.add(litL);
  // Vordach, Schriftzug, Laternen (eine brennt, eine ist tot), Treppe
  box(3.4, 0.14, 1.7, M.iron, 0, 3.15, FACADE_Z + 0.85);
  [-1.5, 1.5].forEach((x) => { const rod = box(0.03, 0.03, 2.0, M.iron, x, 3.75, FACADE_Z + 0.75); rod.rotation.x = 0.6; });
  add(new THREE.PlaneGeometry(4.2, 0.66), new THREE.MeshStandardMaterial({ map: signTex(), transparent: true, metalness: 0.9, roughness: 0.35, color: 0xffffff, emissive: 0x2a1c08, envMapIntensity: 0.6 }), 0, 3.62, FACADE_Z + 0.03);
  const lanterns = [];
  [-1.55, 1.55].forEach((x, i) => {
    const on = i === 0;
    box(0.06, 0.06, 0.3, M.iron, x, 2.45, FACADE_Z + 0.15);
    const glass = box(0.2, 0.32, 0.2, on ? new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffc070, emissiveIntensity: 1.4 }) : std(0x1a1c1e, { roughness: 0.2, metalness: 0.4 }), x, 2.4, FACADE_Z + 0.32);
    box(0.26, 0.05, 0.26, M.iron, x, 2.58, FACADE_Z + 0.32); box(0.24, 0.04, 0.24, M.iron, x, 2.23, FACADE_Z + 0.32);
    if (on) { const l = new THREE.PointLight(0xffb565, 6, 8, 2); l.position.set(x, 2.3, FACADE_Z + 0.7); G.add(l); lanterns.push({ l, glass }); }
  });
  for (let k = 0; k < 3; k++) { const top = -k * (-GROUND / 3); box(3.0 + k * 0.4, top - GROUND, (k + 1) * 0.4, M.trim, 0, (top + GROUND) / 2, FACADE_Z + (k + 1) * 0.2); } // drei Stufen hinauf zur Schwelle
  // Boden: nasser Asphalt, Kies der Zufahrt, Rasen
  const gt = groundTex(); gt.repeat.set(30, 30);
  const ground = add(new THREE.PlaneGeometry(240, 240), std(0x9a9a9a, { map: gt, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.03 }), 0, GROUND - 0.005, 0); ground.rotation.x = -Math.PI / 2;
  [-1, 1].forEach((s) => { const lawn = add(new THREE.PlaneGeometry(60, 100), std(0x090c08, { roughness: 1, envMapIntensity: 0.02 }), s * 34, GROUND, 52); lawn.rotation.x = -Math.PI / 2; });
  // Allee
  const tree = (x, z, k) => {
    const g = new THREE.Group(); g.position.set(x, GROUND, z);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * k, 0.24 * k, 4 * k, 7), M.bark); tr.position.y = 2 * k; g.add(tr);
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry((1.4 + Math.random() * 0.8) * k, 1), M.leaf); c.position.set((Math.random() - 0.5) * 1.6 * k, (4.2 + Math.random() * 2) * k, (Math.random() - 0.5) * 1.6 * k); c.rotation.set(Math.random(), Math.random(), 0); g.add(c); }
    G.add(g);
  };
  for (let z = 13; z < 90; z += 7.5) { tree(-6.5 - Math.random() * 0.6, z + Math.random(), 0.9 + Math.random() * 0.3); tree(6.5 + Math.random() * 0.6, z + 3 + Math.random(), 0.9 + Math.random() * 0.3); }
  for (let i = 0; i < 40; i++) tree((Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 40), -10 + Math.random() * 110, 1.1 + Math.random() * 0.6);
  // Torpfeiler am Beginn der Zufahrt
  [-4, 4].forEach((x) => { box(0.8, 2.6, 0.8, M.stone, x, GROUND + 1.3, 78); box(1.0, 0.2, 1.0, M.trim, x, GROUND + 2.7, 78); });
  // Westmauer mit dem schmalen Tor W2 – nur im Blitz richtig zu sehen
  box(26, 3.2, 0.5, M.stone, -28, GROUND + 1.6, 1.5);
  const gate = box(1.0, 2.3, 0.08, M.iron, -24, GROUND + 1.15, 1.8);
  for (let i = 0; i < 6; i++) box(0.03, 2.3, 0.05, std(0x2a2c30, { metalness: 0.8, roughness: 0.4 }), -24.4 + i * 0.16, GROUND + 1.15, 1.86);
  add(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ map: w2Tex(), transparent: true, roughness: 0.6 }), -24, GROUND + 2.75, 1.78); void gate;
  // Himmel (ohne Nebel), Mondlicht
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false });
  const sky = add(new THREE.SphereGeometry(110, 32, 16), skyMat, 0, 0, 0);
  const moon = new THREE.DirectionalLight(0x7a8aa8, 0.35); moon.position.set(-20, 30, 40); G.add(moon);
  return { G, lit, litL, lanterns, sky, skyMat };
}

/* ---------- Regen (Linien um die Kamera; nie im Haus) ---------- */
function buildRain(n = 2600) {
  const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0x9fb2c4, transparent: true, opacity: 0.32, depthWrite: false });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false;
  const drop = (i, c, top) => {
    const x = c.x + (Math.random() - 0.5) * 22, z = c.z + (Math.random() - 0.5) * 22 - 6, y = top ? c.y + 6 + Math.random() * 3 : GROUND + Math.random() * 10;
    const hidden = z < FACADE_Z + 0.3;
    pos.set([x, hidden ? -99 : y, z, x - 0.05, hidden ? -99 : y - 0.55, z + 0.02], i * 6);
  };
  return {
    lines,
    reset(c) { for (let i = 0; i < n; i++) drop(i, c, false); g.attributes.position.needsUpdate = true; },
    tick(dt, c) {
      for (let i = 0; i < n; i++) {
        const k = i * 6; if (pos[k + 1] < -50) { if (Math.random() < 0.08) drop(i, c, true); continue; }
        const d = dt * 15; pos[k + 1] -= d; pos[k + 4] -= d; pos[k] -= dt * 0.8; pos[k + 3] -= dt * 0.8;
        if (pos[k + 4] < GROUND) drop(i, c, true);
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}

/* ---------- Windschutzscheibe: Tropfen, Wischer, Armaturenbrett (eine Textur vor der Kamera) ---------- */
function buildWindshield() {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
  mesh.renderOrder = 999; mesh.frustumCulled = false;
  const drops = []; let acc = 0, wipe = 0;
  const W = c.width, H = c.height, piv = [[W * 0.3, H * 1.02], [W * 0.78, H * 1.02]], len = H * 0.95;
  const draw = (t, alpha) => {
    g.clearRect(0, 0, W, H);
    g.globalAlpha = alpha;
    drops.forEach((d) => { const gr = g.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r); gr.addColorStop(0, "rgba(220,230,245,.55)"); gr.addColorStop(0.6, "rgba(120,140,170,.18)"); gr.addColorStop(1, "rgba(10,14,20,.45)"); g.fillStyle = gr; g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.fill(); if (d.run) { g.fillStyle = "rgba(160,180,210,.12)"; g.fillRect(d.x - d.r * 0.4, d.y - d.run, d.r * 0.8, d.run); } });
    // Wischer: zwei Arme, gemeinsamer Takt
    const a = -Math.PI * 0.08 - Math.PI * 0.62 * (0.5 - 0.5 * Math.cos(wipe));
    g.strokeStyle = "rgba(4,4,5,.95)"; g.lineCap = "round";
    piv.forEach(([px, py]) => { g.lineWidth = 9; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(px + Math.cos(a) * len * 0.35, py + Math.sin(a) * len * 0.35); g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); g.stroke(); });
    // Rahmen: A-Säulen, Dachkante, Armaturenbrett mit schwachem Instrumentenlicht
    g.fillStyle = "rgb(3,3,4)";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.1, 0); g.lineTo(0, H * 0.9); g.fill();
    g.beginPath(); g.moveTo(W, 0); g.lineTo(W * 0.9, 0); g.lineTo(W, H * 0.9); g.fill();
    g.fillRect(0, 0, W, H * 0.06);
    g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.84); g.quadraticCurveTo(W * 0.5, H * 0.76, W, H * 0.84); g.lineTo(W, H); g.fill();
    const glow = g.createRadialGradient(W * 0.28, H * 0.92, 2, W * 0.28, H * 0.92, 70); glow.addColorStop(0, "rgba(120,200,160,.35)"); glow.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = glow; g.fillRect(W * 0.18, H * 0.82, W * 0.2, H * 0.18);
    g.globalAlpha = 1; tex.needsUpdate = true;
    return a;
  };
  let skip = 0;
  return {
    mesh,
    tick(dt, t, alpha) {
      acc += dt; wipe += dt * Math.PI / 0.75; // ein Wischzyklus ≈ 1,5 s
      while (acc > 0.025) { acc -= 0.025; if (drops.length < 140) drops.push({ x: Math.random() * W, y: Math.random() * H * 0.85, r: 2 + Math.random() * 6, run: Math.random() < 0.15 ? 10 + Math.random() * 30 : 0 }); }
      if (++skip % 2) return; // Textur nur jedes zweite Bild neu zeichnen
      const a = draw(t, alpha);
      // vom Wischer überstrichene Tropfen verschwinden
      for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; if (piv.some(([px, py]) => { const da = Math.atan2(d.y - py, d.x - px); return Math.abs(da - a) < 0.06 && Math.hypot(d.x - px, d.y - py) < len; })) drops.splice(i, 1); }
    },
    fit(camera) { const h = 2 * 0.3 * Math.tan(camera.fov * Math.PI / 360); mesh.scale.set(h * camera.aspect, h, 1); mesh.position.set(0, 0, -0.3); },
  };
}

/* ---------- Ablauf ---------- */
const T = { driveEnd: 15, walkStart: 15.6, steps: 23, doorOpen: 23.6, inside: 31, lobbyEnd: 40, turn: 40.2, slam: 42.2, black: 43.1, fadeIn: 46, end: 49 };
const PATH_DRIVE = (k) => new THREE.Vector3(Math.sin(k * 3) * 0.25 * (1 - k), GROUND + 1.15, mix(74, 13.5, 1 - Math.pow(1 - k, 2.2)));

function play(el, { steps = [], voice = () => {}, onDone = () => {} } = {}) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  el.innerHTML = `<div class="c3-stage"></div><div class="c3-fade on"></div><div class="c3-bar top"></div><div class="c3-bar bottom"></div>
    <div class="cine-text" aria-live="polite"></div><button class="cine-btn" type="button">Überspringen ›</button>`;
  const stage = el.querySelector(".c3-stage"), fade = el.querySelector(".c3-fade"), txt = el.querySelector(".cine-text"), btn = el.querySelector(".cine-btn");
  const bars = el.querySelectorAll(".c3-bar");
  const cues = []; let done = false, time = 0, paused = false, lastNow = 0, envBase = null, ext = null, rain = null, ws = null, leaves = null, hidden = [], heads = [], lastStep = 0, ticks = 0, bolts = [4.2, 11.3, 37.5];
  const say = (i) => { const st = steps[i]; if (!st || done) return; txt.classList.remove("show"); void txt.offsetWidth; txt.innerHTML = `<p>${st.text}</p>`; txt.classList.add("show"); voice(st.voice); };
  const unsay = () => txt.classList.remove("show");
  // Drehbuch läuft in Bildzeit (pausiert mit dem Tab, bleibt bei langsamen Geräten synchron zur Kamera)
  const at = (s, fn) => { cues.push({ s, fn }); cues.sort((a, b) => a.s - b.s); };
  const snd = (n) => A() && A().play(n);
  let h = null;
  const update = (dt) => {
    if (!h) return;
    const now = performance.now(), real = lastNow ? Math.min(0.25, (now - lastNow) / 1000) : 0; lastNow = now; // Echtzeit, aber höchstens 0,25 s pro Bild (Tab im Hintergrund = Pause)
    if (!paused) time += real;
    const t = time, cam = h.camera;
    while (cues.length && cues[0].s <= t && !done) cues.shift().fn();
    if (!h) return;
    let pos, look, fl = 0;
    if (t < T.driveEnd + 0.6) { // A: Fahrt
      const k = Math.min(1, t / T.driveEnd); pos = PATH_DRIVE(k); pos.y += Math.sin(t * 9) * 0.008 * (1 - k) + Math.sin(t * 2.1) * 0.006;
      look = new THREE.Vector3(mix(-2.5, 0, span(t, 3, 12)), mix(3.5, 2.2, k), FACADE_Z);
      heads.forEach(([l, tg, dx]) => { l.position.set(pos.x + dx, GROUND + 0.7, pos.z - 1.5); tg.position.set(pos.x + dx * 2, GROUND, pos.z - 22); });
      if (ws) { ws.mesh.visible = true; ws.fit(cam); ws.tick(dt, t, 1); }
    } else {
      if (ws) ws.mesh.visible = false;
      if (t < T.inside) { // B: zu Fuß
        const k1 = span(t, T.walkStart, T.steps), k2 = span(t, T.doorOpen + 1.2, T.inside);
        pos = new THREE.Vector3(mix(0.8, 0, k1), GROUND + 1.62, mix(12.5, FACADE_Z + 1.6, k1));
        if (k2 > 0) { pos.z = mix(FACADE_Z + 1.6, 1.4, k2); pos.y = mix(GROUND + 1.62, 1.62, span(t, T.doorOpen + 1.2, T.doorOpen + 3.6)); }
        const moving = (t > T.walkStart && t < T.steps) || (t > T.doorOpen + 1.2);
        if (moving) { pos.y += Math.abs(Math.sin(t * 5.6)) * 0.035; pos.x += Math.sin(t * 2.8) * 0.02; if (t - lastStep > 0.56) { lastStep = t; snd("step"); } }
        look = new THREE.Vector3(mix(0.4, 0, span(t, T.walkStart, T.steps)), mix(1.2, 1.5, span(t, T.walkStart, T.inside)), pos.z - 6);
        fl = 30 * span(t, T.walkStart, T.walkStart + 1.5);
      } else if (t < T.turn) { // C: Lobby, Blick auf die Uhr
        const k = span(t, T.inside, T.inside + 5);
        pos = new THREE.Vector3(0, 1.62, mix(1.4, h.eye[2], k));
        const up = span(t, T.inside + 1.5, T.inside + 5) * (1 - span(t, T.lobbyEnd - 2.5, T.lobbyEnd));
        look = new THREE.Vector3(0, mix(1.45, 2.6, up), -3.2);
        fl = 30;
      } else { // D/E: umdrehen, Tür, Schwarz, Startansicht
        pos = new THREE.Vector3(0, 1.62, h.eye[2]);
        const k = span(t, T.turn, T.turn + 1.6);
        const a = k * Math.PI; look = new THREE.Vector3(Math.sin(a) * 4, 1.5, pos.z - Math.cos(a) * 4);
        if (t > T.black + 0.5) look = new THREE.Vector3(0, 1.62 - 0.04 * 4, pos.z - 4); // Startansicht
        fl = t < T.black ? 30 : 0;
      }
    }
    cam.position.copy(pos);
    if (t > T.black + 0.5) { cam.rotation.set(-0.04, 0, 0, "YXZ"); } else { cam.up.set(0, 1, 0); cam.lookAt(look); }
    h.flash.intensity += (fl - h.flash.intensity) * Math.min(1, dt * 4);
    // Türflügel
    if (leaves) { const open = t > T.doorOpen && t < T.slam ? 1 : 0, k = Math.min(1, dt * (open ? 1.1 : 14)); leaves.l.rotation.y = mix(leaves.l.rotation.y, open * 1.25, k); leaves.r.rotation.y = mix(leaves.r.rotation.y, -open * 1.25, k); }
    // Licht, Nebel, Regen
    if (ext) {
      ext.lanterns.forEach(({ l, glass }) => { const f = Math.random() < 0.04 ? 0.25 : 1; l.intensity = mix(l.intensity, 6 * f, 0.5); glass.material.emissiveIntensity = 1.4 * (l.intensity / 6); });
      ext.litL.intensity = 14 * (0.92 + Math.sin(t * 13) * 0.04 + Math.random() * 0.04); ext.lit.material.emissiveIntensity = 1.1 * (ext.litL.intensity / 14);
      const bright = h.bolt.intensity / 9; ext.skyMat.color.setScalar(1 + bright * 3);
      // Umgebungskarte (Lobby) spiegelt sich sonst draußen im nassen Boden: außen fast aus, beim Eintreten auf den Lobbywert
      if (h.scene.environment && envBase === null) envBase = h.scene.environmentIntensity;
      if (envBase !== null) h.scene.environmentIntensity = mix(0.03, envBase, span(t, T.doorOpen + 1.5, T.inside));
      if (h.scene.fog) h.scene.fog.density = mix(0.03, 0.0, span(t, T.doorOpen + 2, T.inside));
      rain.tick(dt, cam.position); rain.lines.visible = t < T.lobbyEnd + 4;
    }
    while (bolts.length && t > bolts[0]) { bolts.shift(); h.bolt.intensity = 9; document.body.classList.add("flash"); setTimeout(() => document.body.classList.remove("flash"), 140); setTimeout(() => snd("thunder"), 900); }
    if (t > T.inside && t < T.inside + 6 && t - ticks > 1) { ticks = t; snd("tick"); } // die Uhr tickt … und hört auf
  };
  let sceneClean = false;
  const cleanScene = () => { // Außenbereich weg, Eingang wieder wie im Spiel – passiert schon in der Schwarzblende
    if (sceneClean || !h) return; sceneClean = true;
    const sc = h.scene;
    [ext && ext.G, rain && rain.lines, ...(heads.map((x) => x[0])), ...(heads.map((x) => x[1])), leaves && leaves.g].forEach((o) => { if (!o) return; sc.remove(o); o.traverse && o.traverse((m) => { if (m.geometry) m.geometry.dispose(); [].concat(m.material || []).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }); });
    if (ws) { h.camera.remove(ws.mesh); ws.mesh.geometry.dispose(); ws.mesh.material.map.dispose(); ws.mesh.material.dispose(); }
    hidden.forEach((o) => { o.visible = true; });
    sc.fog = null; if (envBase !== null) sc.environmentIntensity = envBase; h.flash.intensity = 0; h.bolt.intensity = 0; ext = null; leaves = null; ws = null; rain = null; heads = [];
  };
  const cleanup = () => { cues.length = 0; if (!h) return; cleanScene(); host.end(); h = null; };
  const finish = () => { if (done) return; done = true; cleanup(); onDone(); };
  btn.onclick = finish;

  h = host.begin(stage, "rezeption", update);
  if (!h) { el.innerHTML = ""; return null; }
  // Außen dazubauen
  ext = buildExterior(); host.prepare(ext.G); h.scene.add(ext.G);
  h.scene.fog = new THREE.FogExp2(0x07090d, 0.03);
  h.bolt.position.set(-30, 40, 60);
  rain = buildRain(host.quality.level === "low" ? 1400 : 2600); rain.reset(PATH_DRIVE(0)); h.scene.add(rain.lines);
  ws = buildWindshield(); h.camera.add(ws.mesh);
  heads = [-0.7, 0.7].map((dx) => { const l = new THREE.SpotLight(0xdfe4ec, 14, 55, 0.28, 0.7, 1.5), tg = new THREE.Object3D(); l.target = tg; h.scene.add(l, tg); return [l, tg, dx]; });
  // Eingang der Rezeption: Glas, Mittelpfosten, Griffe und das „Regenbild“ ausblenden, eigene Flügel, die aufgehen
  const door = h.objOf("eingangstuer");
  if (door) [0, 1, 5, 6, 7].forEach((i) => { const c = door.children[i]; if (c) { c.visible = false; hidden.push(c); } });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9ab4c8, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.5 }), brassM = new THREE.MeshStandardMaterial({ color: 0xb08c52, metalness: 1, roughness: 0.3 });
  const leaf = (s) => { const pv = new THREE.Group(); pv.position.set(s * 0.95, 0, DOOR_Z); const g = new THREE.Group(); g.position.x = -s * 0.475;
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.85, 2.2), glassM)); g.children[0].position.y = 1.15;
    [[0, 0.03, 0.95, 0.06], [0, 2.27, 0.95, 0.06], [-0.45, 1.15, 0.05, 2.3], [0.45, 1.15, 0.05, 2.3]].forEach(([x, y, w, hh]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.05), frameM); b.position.set(x, y, 0); g.add(b); });
    const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 10), brassM); hd.position.set(-s * 0.36, 1.15, -0.04); g.add(hd); pv.add(g); return pv; };
  leaves = { l: leaf(-1), r: leaf(1), g: new THREE.Group() };
  const transom = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5), glassM); transom.position.set(0, 2.55, DOOR_Z);
  leaves.g.add(leaves.l, leaves.r, transom); h.scene.add(leaves.g);

  // Drehbuch: Untertitel (Texte aus js/prolog.js), Töne, Blenden
  at(0.2, () => fade.classList.remove("on"));
  at(0.3, () => snd("rumble"));
  at(1.6, () => say(0)); at(9, unsay);
  at(13.6, () => snd("engine"));
  at(T.driveEnd - 0.4, () => fade.classList.add("on")); at(T.walkStart - 0.2, () => fade.classList.remove("on"));
  at(T.doorOpen - 1.6, () => say(1)); at(T.doorOpen, () => snd("door")); at(T.doorOpen + 0.5, () => snd("creak")); at(T.inside - 1.5, unsay);
  at(T.inside + 1, () => say(2)); at(T.lobbyEnd - 0.5, unsay);
  at(T.slam, () => { snd("door"); say(3); });
  at(T.black, () => { fade.classList.add("on", "fast"); });
  at(T.black + 0.6, () => snd("lever")); at(T.black + 0.9, cleanScene);
  at(T.fadeIn, () => { fade.classList.remove("fast"); fade.classList.remove("on"); unsay(); });
  at(T.fadeIn + 1, () => bars.forEach((b) => b.classList.add("gone")));
  at(T.end, finish);
  const ctl = {
    stop: () => { if (done) return; done = true; cleanup(); },
    info: () => ({ t: time, active: !done, paused }),
    /** Für Tests: an eine Stelle springen (Ereignisse davor laufen ab) und anhalten/weiterlaufen. */
    seek: (s, hold = true) => { time = s; paused = hold; },
    resume: () => { paused = false; },
    scene: () => h && h.scene, // Fehlersuche
  };
  N.view3d.cinemaCtl = ctl;
  return ctl;
}

N.view3d.cinema = (el, opts) => { try { return play(el, opts); } catch (e) { console.warn("[Hotel Nocturne 3D] Intro nicht möglich:", e); try { host.end(); } catch (x) { /* egal */ } el.innerHTML = ""; return null; } };
