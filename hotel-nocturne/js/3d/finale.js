/*
 * HOTEL NOCTURNE – Schlussszene als 3D-Kamerafahrt (nur 3D-Testmodus)
 * Ersetzt die Bilder der Finalszene (room.finale in js/rooms/07-buero.js); Texte, Mara-Nachricht, Elias’ Brief und „Weiter“
 * spielt weiter die Engine (playCinematic) darüber ab. Pro Schritt meldet die Engine shot(i):
 *   0 Tastenfeld „2324“ (Tele, langsame Fahrt) · 1 Tor W2 schwingt auf (Vertigo: Kamera fährt heran, Brennweite wird weiter) ·
 *   2 hinaus in den Hof → RÜCKBLENDE 23:24 im Bild von Kamera 3: sechs Gestalten kommen durchs Tor, die dritte hält sich fest,
 *     ein Mann mit Taschenlampe prüft das Tor, blickt in die Kamera und geht allein zurück (wie die Aufnahme im Überwachungsraum) ·
 *   3 Maras Nachricht: Bogenfahrt, Blick hinauf zum einzigen brennenden Fenster ·
 *   4 Elias’ Brief: nah an das tropfende Gitter, dann hinauf zum Himmel – der Regen hört auf, die Morgendämmerung beginnt ·
 *   5 Epilog: Kranfahrt über die Hofmauer, das ganze Hotel im ersten Licht, das Fenster erlischt · 6/7 Schlusstext, Vögel, Abblende.
 * Kamerawege sind Kurven (Catmull-Rom) durch Stützpunkte; Brennweite je Einstellung. Ohne WebGL oder bei „Bewegung reduzieren“
 * bleibt die bisherige Bildfolge.
 */
import { THREE, defineRoom, canvasTex, cinemaHost } from "./core.js?v=4";

const N = window.NOCTURNE;
const A = () => N.audio;
const host = cinemaHost();
const MONO = "DM Mono, monospace";
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const GATE = V(0, 1.3, 0), WIN217 = V(-8.95, 8.6, -8.4), CAM3 = V(-4.6, 3.5, -8.2), EXIT = V(9.6, 0, -15.2);

/* ---------- Texturen ---------- */
const stoneTex = (base = "#2c2824") => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) { let x = r % 2 ? -50 : 0; while (x < w) { const bw = 80 + Math.random() * 60; g.fillStyle = `hsl(25, 7%, ${12 + Math.random() * 8}%)`; g.fillRect(x + 2, r * 64 + 2, bw - 4, 60); x += bw; } }
  g.globalAlpha = 0.25; for (let i = 0; i < 8000; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#5a524a"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.3; for (let i = 0; i < 14; i++) { g.fillStyle = "#1a2a16"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h * 0.4, 20 + Math.random() * 50, 30 + Math.random() * 70, 0, 0, Math.PI * 2); g.fill(); } // Efeu, Moos
}, { repeat: [1, 1] });
const cobbleTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#0e1011"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) { g.fillStyle = `hsl(200, 5%, ${10 + Math.random() * 9}%)`; g.beginPath(); g.ellipse(x + 16, y + 16, 14, 13, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 0.5; for (let i = 0; i < 8; i++) { g.fillStyle = "#06080a"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 60, 18 + Math.random() * 30, Math.random(), 0, Math.PI * 2); g.fill(); } // Pfützen
}, { repeat: [1, 1] });
const keypadTex = () => canvasTex(256, 384, (g, w, h) => {
  g.fillStyle = "#2a2b28"; g.fillRect(0, 0, w, h); g.strokeStyle = "#4a4c46"; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = "#0b2a1e"; g.fillRect(28, 30, 200, 70); g.fillStyle = "#9fe0b0"; g.font = `600 52px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("2324", w / 2, 68);
  "123456789*0#".split("").forEach((k, i) => { const x = 50 + (i % 3) * 78, y = 140 + Math.floor(i / 3) * 58; g.fillStyle = "#4a4c46"; g.fillRect(x - 28, y - 22, 56, 44); g.fillStyle = "#b8b8a8"; g.font = `600 24px ${MONO}`; g.fillText(k, x, y + 1); });
  g.fillStyle = "#8a8f88"; g.font = `600 13px ${MONO}`; g.fillText("NOTAUSGANG · FREIGABE ERTEILT", w / 2, h - 18);
});
const plateTex = (t) => canvasTex(256, 96, (g, w, h) => { g.fillStyle = "#1a1c19"; g.fillRect(0, 0, w, h); g.fillStyle = "#8a8f88"; g.font = `600 52px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; if ("letterSpacing" in g) g.letterSpacing = "16px"; g.fillText(t, w / 2 + 8, h / 2 + 2); });
const skyTex = () => { const t = canvasTex(1024, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#04070a"); gr.addColorStop(0.5, "#141c22"); gr.addColorStop(1, "#05070a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.22; for (let i = 0; i < 60; i++) { g.fillStyle = "#3a4656"; g.beginPath(); g.ellipse(Math.random() * w, h * (0.1 + Math.random() * 0.32), 60 + Math.random() * 150, 12 + Math.random() * 30, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; g.fillStyle = "#e8e4d4"; g.beginPath(); g.arc(w * 0.62, h * 0.2, 14, 0, Math.PI * 2); g.fill();
}); t.wrapS = THREE.RepeatWrapping; return t; };
const dawnTex = () => canvasTex(1024, 512, (g, w, h) => { // Morgendämmerung: oben tiefblau, am Horizont rosa-gold (im Osten heller)
  const gr = g.createLinearGradient(0, 0, 0, h * 0.52); gr.addColorStop(0, "#1c2a44"); gr.addColorStop(0.6, "#5a6a8a"); gr.addColorStop(0.85, "#c89a8a"); gr.addColorStop(1, "#f0c48a"); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.52);
  const sun = g.createRadialGradient(w * 0.25, h * 0.5, 0, w * 0.25, h * 0.5, w * 0.3); sun.addColorStop(0, "rgba(255,214,150,.75)"); sun.addColorStop(1, "rgba(255,214,150,0)"); g.fillStyle = sun; g.fillRect(0, 0, w, h * 0.52);
  g.fillStyle = "#2a2a30"; g.fillRect(0, h * 0.52, w, h * 0.48);
  g.globalAlpha = 0.35; for (let i = 0; i < 30; i++) { g.fillStyle = "#8a7a8a"; g.beginPath(); g.ellipse(Math.random() * w, h * (0.15 + Math.random() * 0.25), 80 + Math.random() * 160, 8 + Math.random() * 16, 0, 0, Math.PI * 2); g.fill(); }
});

/* ---------- Set: Tunnelende, Mauer mit Tor W2, Innenhof, Hotelrückseite ---------- */
defineRoom("finale_hof", (ctx) => {
  const { add, scene } = ctx;
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const st = stoneTex(); st.repeat.set(0.4, 0.4); const stone = std(0xffffff, { map: st, roughness: 0.9 });
  const concrete = std(0x34342f, { roughness: 0.92 }), iron = std(0x2a2d29, { metalness: 0.7, roughness: 0.45 }), dark = std(0x0c0c0b);
  // Tunnel (z 0…8)
  box(2.4, 0.1, 8, concrete, 0, -0.05, 4); box(0.2, 2.8, 8, concrete, -1.2, 1.4, 4); box(0.2, 2.8, 8, concrete, 1.2, 1.4, 4); box(2.4, 0.2, 8, concrete, 0, 2.8, 4);
  box(2.4, 2.8, 0.2, dark, 0, 1.4, 8.1);
  const tl = new THREE.PointLight(0xffd0a0, 1.4, 6, 2); tl.position.set(0, 2.5, 4); add(tl);
  // Mauer mit Toröffnung und Schild W2
  const wall = new THREE.Shape(); wall.moveTo(-14, 0); wall.lineTo(14, 0); wall.lineTo(14, 3.6); wall.lineTo(-14, 3.6); wall.lineTo(-14, 0);
  const hole = new THREE.Path(); hole.moveTo(-1, 0); hole.lineTo(1, 0); hole.lineTo(1, 2.6); hole.lineTo(-1, 2.6); hole.lineTo(-1, 0); wall.holes.push(hole);
  mesh(new THREE.ShapeGeometry(wall), stone, 0, 0, 0).material.side = THREE.DoubleSide;
  box(28, 0.2, 0.5, stone, 0, 3.7, 0);
  [0.02, -0.02].forEach((z, i) => { const pl = mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshStandardMaterial({ map: plateTex("W2"), roughness: 0.6 }), 0, 2.95, z); if (i) pl.rotation.y = Math.PI; });
  // Torflügel (Gitter), öffnen nach außen
  const leaf = (s) => { const pv = new THREE.Group(); pv.position.set(s, 0, -0.05); const g = new THREE.Group(); g.position.x = -s * 0.5;
    [0.05, 2.5].forEach((y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), iron); b.position.y = y; g.add(b); });
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.5, 8), iron); b.position.set(-0.42 + i * 0.17, 1.27, 0); g.add(b); }
    pv.add(g); add(pv); return pv; };
  const gate = { l: leaf(-1), r: leaf(1) };
  // Tastenfeld
  const kp = mesh(new THREE.PlaneGeometry(0.26, 0.39), new THREE.MeshStandardMaterial({ map: keypadTex(), roughness: 0.5, emissive: 0x0b2a1e, emissiveIntensity: 0.4 }), 1.09, 1.4, 0.7); kp.rotation.y = -Math.PI / 2;
  const kl = new THREE.PointLight(0x9fe0b0, 0.8, 1.6, 2); kl.position.set(0.85, 1.5, 0.7); add(kl);
  // Innenhof: Pflaster (spiegelnd nass), Hotelrückseite, Mauern mit Hofausfahrt, Laterne, Bank
  const ct = cobbleTex(); ct.repeat.set(30, 30);
  const groundMat = std(0xa0a0a0, { map: ct, roughness: 0.28, metalness: 0.15 });
  const ground = mesh(new THREE.PlaneGeometry(100, 100), groundMat, 0, -0.002, -40); ground.rotation.x = -Math.PI / 2;
  const fs = stoneTex("#26221e"); fs.repeat.set(0.3, 0.3);
  const facade = mesh(new THREE.PlaneGeometry(26, 11), std(0xffffff, { map: fs, roughness: 0.9 }), -9, 5.5, -12); facade.rotation.y = Math.PI / 2;
  box(0.4, 0.3, 26, std(0x3a342c), -8.85, 3.7, -12); box(0.4, 0.3, 26, std(0x3a342c), -8.85, 7.1, -12); box(0.4, 0.3, 26, std(0x3a342c), -8.85, 10.4, -12);
  box(10, 11, 26, std(0x1a1816), -14.2, 5.5, -12); // Baukörper (von oben sichtbar)
  const roofG = new THREE.CylinderGeometry(0.01, 6.2, 4, 4, 1); roofG.rotateY(Math.PI / 4); const roof = mesh(roofG, std(0x15171a, { roughness: 0.5 }), -13.6, 13, -12); roof.scale.set(1.15, 1, 3.0);
  [[-11, -5], [-13, -18], [-16, -10]].forEach(([x, z]) => box(0.8, 2.2, 0.8, std(0x1a1816), x, 15.6, z)); // Schornsteine
  const glass = std(0x0a0e14, { roughness: 0.08, metalness: 0.7 });
  let lit = null; const otherLit = [];
  for (const y of [1.9, 5.3, 8.6]) for (let z = -2; z > -23; z -= 3.2) {
    const isLit = y === 8.6 && Math.abs(z + 8.4) < 0.1;
    const w = mesh(new THREE.PlaneGeometry(1.2, 1.8), isLit ? new THREE.MeshStandardMaterial({ color: 0x3a2410, emissive: 0xe7a85a, emissiveIntensity: 1.2 }) : glass.clone(), -8.97, y, z); w.rotation.y = Math.PI / 2;
    box(0.2, 0.1, 1.5, std(0x3a342c), -8.88, y - 0.98, z);
    if (isLit) lit = w; else otherLit.push(w);
  }
  const litL = new THREE.PointLight(0xffb060, 10, 10, 2); litL.position.set(-7.6, 8.6, -8.4); add(litL);
  box(0.5, 2.6, 13.6, stone, 9.25, 1.3, -6.8); box(0.5, 2.6, 11.2, stone, 9.25, 1.3, -22.4); box(0.6, 0.3, 3.2, stone, 9.25, 2.75, -15.2); // rechte Mauer mit Hofausfahrt (z ≈ −15)
  box(28, 3.2, 0.5, stone, 0, 1.6, -28);
  box(0.1, 3.2, 0.1, iron, 3.2, 1.6, -6); const lantern = box(0.26, 0.36, 0.26, new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffc070, emissiveIntensity: 1.4 }), 3.2, 3.3, -6);
  const ll = new THREE.PointLight(0xffb565, 9, 14, 2); ll.position.set(3.2, 3.0, -6); add(ll);
  const bench = new THREE.Group(); [0.45, 0.85].forEach((y, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, i ? 0.06 : 0.4), std(0x3a2a1c, { roughness: 0.6 })); b.position.set(0, y, i ? -0.2 : 0); bench.add(b); });
  [-0.7, 0.7].forEach((x) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), iron); l.position.set(x, 0.22, 0); bench.add(l); }); bench.position.set(-7.6, 0, -15); bench.rotation.y = Math.PI / 2; add(bench);
  // Bäume hinter der Hofmauer (Silhouetten, sichtbar bei der Kranfahrt)
  const leafM = std(0x0b120d, { roughness: 1, flatShading: true });
  for (let i = 0; i < 14; i++) { const t = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + Math.random() * 1.2, 0), leafM); t.position.set(-6 + i * 2.2 + Math.random(), 4 + Math.random() * 1.5, -31 - Math.random() * 3); add(t); }
  // Himmel: Nacht + Dämmerung darüber (überblendet), Mondlicht
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false });
  mesh(new THREE.SphereGeometry(80, 32, 16), skyMat, 0, 0, -10);
  const dawnMat = new THREE.MeshBasicMaterial({ map: dawnTex(), side: THREE.BackSide, fog: false, transparent: true, opacity: 0, depthWrite: false });
  const dawnSky = mesh(new THREE.SphereGeometry(79, 32, 16), dawnMat, 0, 0, -10); dawnSky.rotation.y = -0.4;
  const moon = new THREE.DirectionalLight(0x8a9ab8, 0.2); moon.position.set(10, 30, -30); add(moon);
  const hemi = scene.children.find((o) => o.isHemisphereLight); if (hemi) hemi.intensity = 0.35;
  // Tropfen vom Torbalken
  const drops = []; const dm = new THREE.MeshStandardMaterial({ color: 0xbfd4e4, roughness: 0.05, metalness: 0.2 });
  for (let i = 0; i < 10; i++) { const d = mesh(new THREE.SphereGeometry(0.01, 6, 5), dm, -0.9 + i * 0.2, 2.5, -0.35); d.userData.v = Math.random() * 2; drops.push(d); }
  // Rückblende: sechs Gestalten und der Mann mit der Taschenlampe (nur im Bild von Kamera 3)
  const ghostM = new THREE.MeshBasicMaterial({ color: 0xd8f0de, transparent: true, opacity: 0.78, depthWrite: false, fog: false });
  const person = (h = 1, dark = false) => { const g = new THREE.Group(); const m = dark ? new THREE.MeshBasicMaterial({ color: 0x8aa894, transparent: true, opacity: 0.85, fog: false }) : ghostM;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17 * h, 0.75 * h, 4, 10), m); body.position.y = 0.95 * h; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * h, 12, 10), m); head.position.y = 1.6 * h; g.add(head);
    const legs = [-0.08, 0.08].map((x) => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * h, 0.42 * h, 3, 6), m); l.position.set(x, 0.35 * h, 0); g.add(l); return l; });
    g.userData.legs = legs; g.visible = false; add(g); return g; };
  const guests = [1, 0.92, 0.96, 1.03, 0.88, 1.0].map((h) => person(h));
  const elias = person(1.04, true); const torch = new THREE.SpotLight(0xfff0d0, 0, 12, 0.35, 0.5, 1.2); torch.position.set(0.2, 1.3, 0.2); torch.target.position.set(0, 0.2, 3); elias.add(torch, torch.target);
  const ir = new THREE.PointLight(0xffffff, 0, 40, 1.1); ir.position.copy(CAM3); add(ir); // Infrarot-Strahler der Überwachungskamera (nur in der Rückblende)
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  void beam;
  scene.userData.finale = { gate, lit, otherLit, litL, lantern, ll, moon, skyMat, dawnMat, kl, kp, hemi, drops, guests, elias, torch, groundMat, ir };
  return { eye: [0, 1.6, 3], hd: true, R: 6, H: 4, env: 0.05 };
});

/* ---------- Regen ---------- */
function buildRain(n = 2200) {
  const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0x9fb2c4, transparent: true, opacity: 0.3, depthWrite: false });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false;
  const drop = (i, c, top) => { const x = c.x + (Math.random() - 0.5) * 24, z = c.z + (Math.random() - 0.5) * 24 - 5, y = top ? c.y + 6 + Math.random() * 3 : Math.random() * 9; const hide = z > -0.2; pos.set([x, hide ? -99 : y, z, x - 0.05, hide ? -99 : y - 0.5, z + 0.02], i * 6); };
  return { lines, m, reset(c) { for (let i = 0; i < n; i++) drop(i, c, false); g.attributes.position.needsUpdate = true; },
    tick(dt, c, density) { for (let i = 0; i < n; i++) { const k = i * 6; if (pos[k + 1] < -50) { if (Math.random() < 0.08 * density) drop(i, c, true); continue; } const d = dt * 14; pos[k + 1] -= d; pos[k + 4] -= d; if (pos[k + 4] < 0) { if (Math.random() < density) drop(i, c, true); else { pos[k + 1] = -99; pos[k + 4] = -99; } } } g.attributes.position.needsUpdate = true; } };
}

/* ---------- Einstellungen: Stützpunkte (Kurve), Blickpunkte, Brennweite, Stimmung ---------- */
const SHOTS = [
  { start: { p: V(0.15, 1.5, 1.6), l: V(1.09, 1.42, 0.72), fov: 52 }, path: [V(0.3, 1.47, 1.3), V(0.45, 1.44, 1.05)], look: [V(1.09, 1.42, 0.7)], fov: 40, rain: 1 },     // 0 Tastenfeld
  { start: { p: V(0, 1.55, 5.2), l: GATE, fov: 30 }, path: [V(0, 1.55, 4.0), V(0, 1.58, 2.2)], look: [GATE, V(0, 1.4, -3)], fov: 72, rain: 1, gate: true, move: 5 },          // 1 Tor (Vertigo)
  { path: [V(0.1, 1.6, 0.6), V(0.25, 1.62, -1.6), V(0.4, 1.62, -2.8)], look: [V(0, 1.5, -6), V(-1, 1.6, -12)], fov: 64, rain: 0.8, gate: true, flash: 1.2, move: 4 },     // 2 hinaus → Rückblende
  { path: [V(0.8, 1.62, -4.0), V(1.8, 1.7, -5.8), V(2.4, 1.78, -7.2)], look: [V(-3, 4, -9), WIN217], fov: 52, rain: 0.25, gate: true, move: 12 },                        // 3 Maras Nachricht
  { path: [V(1.8, 1.6, -4.6), V(1.0, 1.45, -1.6), V(0.6, 1.4, -0.75)], look: [V(0.3, 1.8, 0), V(0, 2.45, -0.3), V(0, 2.6, -0.3), V(0.6, 9, -6), V(-2, 12, -14)], fov: 46, rain: 0, gate: true, dawn: 0.65, move: 34 }, // 4 Brief: Gitter, Tropfen, Himmel
  { path: [V(1.5, 3.2, -4.0), V(3.0, 7.5, -9.0), V(5.5, 12.5, -16.5)], look: [WIN217, V(-9, 6.5, -11), V(-11, 5, -13)], fov: 55, rain: 0, gate: true, dawn: 1, dim: true, move: 9 },  // 5 Epilog: Kran
  { path: [V(6.2, 13.6, -18.5)], look: [V(-11, 5, -13)], fov: 52, rain: 0, gate: true, dawn: 1, dim: true, fade: 0.5, move: 7 },                                         // 6 Schlusstext
  { path: [V(6.6, 14.2, -19.5)], look: [V(-11, 5, -13)], fov: 50, rain: 0, gate: true, dawn: 1, dim: true, fade: 0.7, move: 12 },                                        // 7 Ende
];
const curve = (pts) => (pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, "centripetal") : { getPoint: () => pts[0].clone() });

function finale(el) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  el.innerHTML = `<div class="c3-stage"></div><div class="c3-cam"><span class="c3-rec">● REC</span><span class="c3-ts">CAM 3 · 14.10.2009 · 23:24:18</span></div><div class="c3-dark"></div><div class="c3-bar top"></div><div class="c3-bar bottom"></div><div class="c3-over"></div>`;
  const stage = el.querySelector(".c3-stage"), over = el.querySelector(".c3-over"), darkEl = el.querySelector(".c3-dark"), tsEl = el.querySelector(".c3-ts");
  let h = null, rain = null, F = null, shot = -1, shotT = 0, lastNow = 0, gateK = 0, rainD = 1, moonK = 0, dimK = 0, dawnK = 0, done = false, chirpT = 0;
  let pathC = null, lookC = null, fov0 = 60, fov1 = 60, moveDur = 5;
  let fb = null; // Rückblende: { t }
  const lookNow = V(0, 1.5, -5);
  const plan = (S, from) => {
    const p0 = S.start ? S.start.p : from.p, l0 = S.start ? S.start.l : from.l;
    pathC = curve([p0.clone(), ...S.path]); lookC = curve([l0.clone(), ...S.look]);
    fov0 = S.start ? S.start.fov : h.camera.fov; fov1 = S.fov; moveDur = S.move || 5;
  };
  const setCam = (p, l, fov) => { h.camera.position.copy(p); h.camera.up.set(0, 1, 0); h.camera.lookAt(l); lookNow.copy(l); if (Math.abs(h.camera.fov - fov) > 0.01) { h.camera.fov = fov; h.camera.updateProjectionMatrix(); } };
  const walk = (g, from, to, k, t) => { g.position.lerpVectors(from, to, k); const d = to.clone().sub(from); g.rotation.y = Math.atan2(d.x, d.z); g.userData.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 7 + i * Math.PI) * 0.45; }); };
  const update = () => {
    if (!h || shot < 0) return;
    const now = performance.now(), real = lastNow ? Math.min(0.25, (now - lastNow) / 1000) : 0; lastNow = now;
    const S = SHOTS[Math.min(shot, SHOTS.length - 1)];
    // Rückblende im Bild von Kamera 3 (eigene Kamera, eigene Zeit)
    if (fb) {
      fb.t += real; const t = fb.t, gs = F.guests, gate = V(0, 0, -0.6);
      setCam(CAM3, V(1.6, 0.9, -3.2), 62); h.scene.fog.density = 0.012; if (F.hemi) { F.hemi.intensity = 2.4; F.hemi.color.setRGB(0.7, 0.75, 0.8); } F.ir.intensity = 60; // Restlichtverstärkung + Infrarot rain.tick(real, CAM3, 1);
      gs.forEach((g, i) => { const t0 = i * 0.75, k = (t - t0) / 5.2; g.visible = k > 0 && k < 1; if (!g.visible) return;
        const hold = i === 2 && k > 0.12 && k < 0.3; // die Dritte hält sich am Tor fest
        walk(g, gate.clone().add(V((i % 2 ? 0.35 : -0.25), 0, 0)), EXIT.clone().add(V(0, 0, (i % 3 - 1) * 0.5)), hold ? 0.12 + (k - 0.12) * 0.15 : k, hold ? 0 : t); if (hold) g.rotation.y += 0.6; });
      const e = F.elias, te = t - 7.2; e.visible = te > 0 && te < 5.2;
      if (e.visible) { const out = V(0.4, 0, -2.6); const k = te < 1.4 ? te / 1.4 : te < 3.6 ? 1 : 1 - (te - 3.6) / 1.6; e.position.lerpVectors(gate, out, Math.max(0, k));
        e.rotation.y = te < 1.4 ? Math.PI : te < 2.0 ? Math.PI + (te - 1.4) * 1.2 : te < 3.6 ? Math.atan2(CAM3.x - e.position.x, CAM3.z - e.position.z) : 0; // hinaus, Tor prüfen, in die Kamera blicken, zurück
        e.userData.legs.forEach((l, i) => { l.rotation.x = te < 1.4 || te > 3.6 ? Math.sin(t * 7 + i * Math.PI) * 0.45 : 0; }); F.torch.intensity = 30; }
      else F.torch.intensity = 0;
      const secs = 18 + Math.floor(t); tsEl.textContent = `CAM 3 · 14.10.2009 · 23:24:${String(Math.min(59, secs)).padStart(2, "0")}`;
      if (t > 12.6) { fb = null; el.classList.add("c3-glitch"); setTimeout(() => el.classList.remove("cam3", "c3-glitch"), 260); A() && A().play("glitch"); gs.forEach((g) => { g.visible = false; }); F.elias.visible = false; F.torch.intensity = 0; F.ir.intensity = 0;
        shotT = 0; plan(SHOTS[Math.max(shot, 3)], { p: V(0.4, 1.62, -2.8), l: V(-1, 1.6, -12) }); if (shot < 3) shot = 3; setCam(V(0.4, 1.62, -2.8), V(-1, 1.6, -12), 60); }
      return;
    }
    shotT += real;
    const k = ease(shotT / moveDur);
    setCam(pathC.getPoint(k).add(V(0, Math.sin(now / 900) * 0.01, 0)), lookC.getPoint(k), fov0 + (fov1 - fov0) * k);
    if (S.flash && shotT > S.flash && !S._fbDone) { S._fbDone = true; fb = { t: 0 }; el.classList.add("cam3", "c3-glitch"); setTimeout(() => el.classList.remove("c3-glitch"), 260); A() && A().play("glitch"); }
    // Tor, Regen, Licht, Dämmerung
    gateK += ((S.gate ? 1 : 0) - gateK) * Math.min(1, real * 0.55); F.gate.l.rotation.y = gateK * 1.6; F.gate.r.rotation.y = -gateK * 1.6;
    rainD += (S.rain - rainD) * Math.min(1, real * 0.6); rain.m.opacity = 0.3 * Math.max(0.15, rainD); rain.tick(real, h.camera.position, rainD);
    const dawnTo = S.dawn ? (shot === 4 ? S.dawn * ease(shotT / 30) : S.dawn) : 0; dawnK += (dawnTo - dawnK) * Math.min(1, real * 0.5);
    moonK += (((shot >= 4) ? 1 : 0) - moonK) * Math.min(1, real * 0.3);
    F.dawnMat.opacity = dawnK; F.skyMat.map.offset.x += real * 0.004; F.skyMat.color.setScalar(1 + moonK * 0.5);
    F.moon.intensity = 0.2 + moonK * 0.4 + dawnK * 0.8; F.moon.color.setHex(dawnK > 0.5 ? 0xd8c8b8 : 0x8a9ab8);
    if (F.hemi) { F.hemi.intensity = 0.35 + dawnK * 0.9; F.hemi.color.setRGB(0.42 + dawnK * 0.3, 0.47 + dawnK * 0.25, 0.56 + dawnK * 0.2); }
    h.scene.fog.color.setRGB(0.03 + dawnK * 0.22, 0.035 + dawnK * 0.22, 0.05 + dawnK * 0.26); h.scene.fog.density = 0.03 - dawnK * 0.018;
    const lampOn = dawnK < 0.6; F.ll.intensity = lampOn ? 9 * (0.95 + Math.random() * 0.08) : Math.max(0, F.ll.intensity - real * 6); F.lantern.material.emissiveIntensity = F.ll.intensity / 6.5;
    dimK += ((S.dim && shotT > 2.5 ? 1 : 0) - dimK) * Math.min(1, real * 0.9); F.lit.material.emissiveIntensity = 1.2 * (1 - dimK); F.litL.intensity = 10 * (1 - dimK);
    F.groundMat.roughness = 0.28 + dawnK * 0.3; // trocknet langsam
    F.drops.forEach((d) => { if (rainD < 0.3 && shot <= 5) { d.userData.v += real; d.position.y = 2.5 - d.userData.v * d.userData.v * 4.9; if (d.position.y < 0) { d.position.y = 2.5; d.userData.v = -Math.random() * 1.5; } if (d.userData.v < 0) d.position.y = 2.5; } });
    if (dawnK > 0.7) { chirpT -= real; if (chirpT < 0) { chirpT = 1.5 + Math.random() * 3; A() && A().play("chirp"); } }
    darkEl.style.opacity = String(S.fade || 0);
    h.scene.environmentIntensity = 0.04 + dawnK * 0.12;
    if (h.bolt.intensity > 0) F.skyMat.color.setScalar(1 + h.bolt.intensity / 3);
  };
  h = host.begin(stage, "finale_hof", update);
  if (!h) { el.innerHTML = ""; return null; }
  F = h.scene.userData.finale;
  h.scene.fog = new THREE.FogExp2(0x07090d, 0.03);
  rain = buildRain(host.quality.level === "low" ? 1200 : 2200); rain.reset(SHOTS[0].start.p); h.scene.add(rain.lines);
  SHOTS.forEach((S) => { delete S._fbDone; });
  setCam(SHOTS[0].start.p, SHOTS[0].start.l, SHOTS[0].start.fov);
  const ctl = {
    over,
    shot: (i) => { // von der Engine pro Schritt
      if (done || !h) return;
      if (fb) { shot = Math.max(shot, i); return; } // Rückblende läuft zu Ende, danach geht es mit der aktuellen Einstellung weiter
      shot = i; shotT = 0; plan(SHOTS[Math.min(i, SHOTS.length - 1)], { p: h.camera.position.clone(), l: lookNow.clone() });
      if (i === 1) { h.bolt.intensity = 5; }
    },
    stop: () => {
      if (done) return; done = true;
      if (h) { h.scene.remove(rain.lines); rain.lines.geometry.dispose(); rain.m.dispose(); h.scene.fog = null; host.end(); h = null; }
    },
    info: () => ({ shot, t: shotT, gate: gateK, rain: rainD, dim: dimK, dawn: dawnK, flashback: fb ? fb.t : null, fov: h ? h.camera.fov : 0 }),
  };
  N.view3d.finaleCtl = ctl;
  return ctl;
}

N.view3d.finale = (el) => { try { return finale(el); } catch (e) { console.warn("[Hotel Nocturne 3D] Finale nicht möglich:", e); try { host.end(); } catch (x) { /* egal */ } el.innerHTML = ""; return null; } };
