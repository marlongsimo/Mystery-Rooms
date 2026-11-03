/*
 * HOTEL NOCTURNE – Schlussszene als 3D-Kamerafahrt (nur 3D-Testmodus)
 * Ersetzt die Bilder der Finalszene (room.finale in js/rooms/07-buero.js); Texte, Mara-Nachricht, Elias’ Brief und „Weiter“
 * spielt weiter die Engine (playCinematic) darüber ab. Pro Schritt meldet die Engine shot(i) – die Kamera fährt zur Einstellung:
 *   0 Tastenfeld „2324“ in Nahaufnahme · 1 Tor W2 schwingt auf · 2 hinaus in den Innenhof, der Regen wird leiser ·
 *   3 Maras Nachricht: Blick hinauf zur Rückseite des Hotels, ein Fenster brennt · 4 Elias’ Brief: der Regen hört auf, Mondlicht ·
 *   5 Epilog: weite Einstellung, das Licht im Fenster erlischt · 6/7 Schlusstext, Abblende.
 * Eigenes Set (defineRoom „finale_hof“): Ende des Servicetunnels, Mauer mit Tor W2, Innenhof, Hotelrückseite. Ohne WebGL oder bei
 * „Bewegung reduzieren“ bleibt die bisherige Bildfolge.
 */
import { THREE, defineRoom, canvasTex, cinemaHost } from "./core.js?v=3";

const N = window.NOCTURNE;
const host = cinemaHost();
const MONO = "DM Mono, monospace";
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- Texturen ---------- */
const stoneTex = (base = "#2c2824") => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) { let x = r % 2 ? -50 : 0; while (x < w) { const bw = 80 + Math.random() * 60; g.fillStyle = `hsl(25, 7%, ${12 + Math.random() * 8}%)`; g.fillRect(x + 2, r * 64 + 2, bw - 4, 60); x += bw; } }
  g.globalAlpha = 0.25; for (let i = 0; i < 8000; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#5a524a"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
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
const skyTex = () => canvasTex(1024, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#04070a"); gr.addColorStop(0.5, "#141c22"); gr.addColorStop(1, "#05070a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.2; for (let i = 0; i < 50; i++) { g.fillStyle = "#3a4656"; g.beginPath(); g.ellipse(Math.random() * w, h * (0.12 + Math.random() * 0.3), 60 + Math.random() * 150, 12 + Math.random() * 30, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; g.fillStyle = "#e8e4d4"; g.beginPath(); g.arc(w * 0.62, h * 0.2, 14, 0, Math.PI * 2); g.fill(); // Mond
});

/* ---------- Set: Tunnelende, Mauer mit Tor W2, Innenhof, Hotelrückseite ---------- */
defineRoom("finale_hof", (ctx) => {
  const { add, scene } = ctx;
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const st = stoneTex(); st.repeat.set(0.4, 0.4); const stone = std(0xffffff, { map: st, roughness: 0.9 });
  const concrete = std(0x34342f, { roughness: 0.92 }), iron = std(0x2a2d29, { metalness: 0.7, roughness: 0.5 }), dark = std(0x0c0c0b);
  // Tunnel (z 0…8): Boden, Wände, Decke, eine schwache Lampe
  box(2.4, 0.1, 8, concrete, 0, -0.05, 4); box(0.2, 2.8, 8, concrete, -1.2, 1.4, 4); box(0.2, 2.8, 8, concrete, 1.2, 1.4, 4); box(2.4, 0.2, 8, concrete, 0, 2.8, 4);
  box(2.4, 2.8, 0.2, dark, 0, 1.4, 8.1);
  const tl = new THREE.PointLight(0xffd0a0, 1.4, 6, 2); tl.position.set(0, 2.5, 4); add(tl);
  // Mauer mit Toröffnung (2,0 × 2,6 m) und Schild W2
  const wall = new THREE.Shape(); wall.moveTo(-14, 0); wall.lineTo(14, 0); wall.lineTo(14, 3.6); wall.lineTo(-14, 3.6); wall.lineTo(-14, 0);
  const hole = new THREE.Path(); hole.moveTo(-1, 0); hole.lineTo(1, 0); hole.lineTo(1, 2.6); hole.lineTo(-1, 2.6); hole.lineTo(-1, 0); wall.holes.push(hole);
  const wg = new THREE.ShapeGeometry(wall); const wf = mesh(wg, stone, 0, 0, 0); wf.material.side = THREE.DoubleSide;
  box(28, 0.2, 0.5, stone, 0, 3.7, 0);
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshStandardMaterial({ map: plateTex("W2"), roughness: 0.6 }), 0, 2.95, 0.02);
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshStandardMaterial({ map: plateTex("W2"), roughness: 0.6 }), 0, 2.95, -0.02).rotation.y = Math.PI;
  // Torflügel (Gitter), öffnen nach außen
  const leaf = (s) => { const pv = new THREE.Group(); pv.position.set(s, 0, -0.05); const g = new THREE.Group(); g.position.x = -s * 0.5;
    [0.05, 2.5].forEach((y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), iron); b.position.y = y; g.add(b); });
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.5, 8), iron); b.position.set(-0.42 + i * 0.17, 1.27, 0); g.add(b); }
    pv.add(g); add(pv); return pv; };
  const gate = { l: leaf(-1), r: leaf(1) };
  // Tastenfeld rechts im Tunnel, kurz vor dem Tor
  const kp = mesh(new THREE.PlaneGeometry(0.26, 0.39), new THREE.MeshStandardMaterial({ map: keypadTex(), roughness: 0.5, emissive: 0x0b2a1e, emissiveIntensity: 0.4 }), 1.09, 1.4, 0.7); kp.rotation.y = -Math.PI / 2;
  const kl = new THREE.PointLight(0x9fe0b0, 0.8, 1.6, 2); kl.position.set(0.85, 1.5, 0.7); add(kl);
  // Innenhof (z < 0): Pflaster, Hotelrückseite links (x −9), niedrige Mauer rechts, Laterne
  const ct = cobbleTex(); ct.repeat.set(12, 12);
  const ground = mesh(new THREE.PlaneGeometry(40, 40), std(0xa0a0a0, { map: ct, roughness: 0.3, metalness: 0.1 }), 0, -0.002, -19.9); ground.rotation.x = -Math.PI / 2;
  const fs = stoneTex("#26221e"); fs.repeat.set(0.3, 0.3);
  const facade = mesh(new THREE.PlaneGeometry(26, 11), std(0xffffff, { map: fs, roughness: 0.9 }), -9, 5.5, -12); facade.rotation.y = Math.PI / 2;
  box(0.4, 0.3, 26, std(0x3a342c), -8.85, 3.7, -12); box(0.4, 0.3, 26, std(0x3a342c), -8.85, 7.1, -12); box(1.4, 1.2, 26.4, std(0x15171a), -9.4, 11.2, -12);
  const glass = std(0x0a0e14, { roughness: 0.1, metalness: 0.6 });
  let lit = null;
  for (const y of [1.9, 5.3, 8.6]) for (let z = -2; z > -23; z -= 3.2) {
    const isLit = y === 8.6 && Math.abs(z + 8.4) < 0.1;
    const w = mesh(new THREE.PlaneGeometry(1.2, 1.8), isLit ? new THREE.MeshStandardMaterial({ color: 0x3a2410, emissive: 0xe7a85a, emissiveIntensity: 1.2 }) : glass, -8.97, y, z); w.rotation.y = Math.PI / 2;
    box(0.2, 0.1, 1.5, std(0x3a342c), -8.88, y - 0.98, z);
    if (isLit) lit = w;
  }
  const litL = new THREE.PointLight(0xffb060, 10, 10, 2); litL.position.set(-7.6, 8.6, -8.4); add(litL);
  box(0.5, 2.2, 28, stone, 9, 1.1, -14); box(28, 3.2, 0.5, stone, 0, 1.6, -28);
  // Laterne
  box(0.1, 3.2, 0.1, iron, 3.2, 1.6, -6); const lantern = box(0.26, 0.36, 0.26, new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffc070, emissiveIntensity: 1.4 }), 3.2, 3.3, -6);
  const ll = new THREE.PointLight(0xffb565, 9, 14, 2); ll.position.set(3.2, 3.0, -6); add(ll);
  // Himmel, Mond
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false });
  mesh(new THREE.SphereGeometry(80, 32, 16), skyMat, 0, 0, -10);
  const moon = new THREE.DirectionalLight(0x8a9ab8, 0.2); moon.position.set(10, 30, -30); add(moon);
  const hemi = scene.children.find((o) => o.isHemisphereLight); if (hemi) hemi.intensity = 0.35;
  ctx.anim(() => {}); // Animation steuert das Drehbuch (play)
  scene.userData.finale = { gate, lit, litL, lantern, ll, moon, skyMat, kl, kp };
  return { eye: [0, 1.6, 3], hd: true, R: 6, H: 4, env: 0.05 };
});

/* ---------- Regen ---------- */
function buildRain(n = 2200) {
  const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0x9fb2c4, transparent: true, opacity: 0.3, depthWrite: false });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false;
  const drop = (i, c, top) => { const x = c.x + (Math.random() - 0.5) * 22, z = c.z + (Math.random() - 0.5) * 22 - 5, y = top ? c.y + 6 + Math.random() * 3 : Math.random() * 9; const hide = z > -0.2; pos.set([x, hide ? -99 : y, z, x - 0.05, hide ? -99 : y - 0.5, z + 0.02], i * 6); };
  return { lines, m, reset(c) { for (let i = 0; i < n; i++) drop(i, c, false); g.attributes.position.needsUpdate = true; },
    tick(dt, c, density) { for (let i = 0; i < n; i++) { const k = i * 6; if (pos[k + 1] < -50) { if (Math.random() < 0.08 * density) drop(i, c, true); continue; } const d = dt * 14; pos[k + 1] -= d; pos[k + 4] -= d; if (pos[k + 4] < 0) { if (Math.random() < density) drop(i, c, true); else { pos[k + 1] = -99; pos[k + 4] = -99; } } } g.attributes.position.needsUpdate = true; } };
}

/* ---------- Einstellungen je Schritt (Kamera von → nach, Regen, Licht) ---------- */
const SHOTS = [
  { p0: V(0.45, 1.45, 1.15), l0: V(1.09, 1.42, 0.7), p: V(0.62, 1.43, 0.95), l: V(1.09, 1.42, 0.7), rain: 1 },                 // 0 Tastenfeld
  { p: V(0, 1.6, 3.0), l: V(0, 1.45, -8), rain: 1, gate: true },                                                                // 1 Tor öffnet
  { p: V(0.3, 1.6, -3.4), l: V(-1, 1.6, -14), rain: 0.45, gate: true },                                                        // 2 hinaus
  { p: V(0.6, 1.6, -4.4), l: V(-8.9, 8.2, -8.4), rain: 0.25, gate: true },                                                     // 3 Maras Nachricht: Blick zum Fenster
  { p: V(0.9, 1.62, -5.0), l: V(-3, 6, -14), rain: 0, gate: true, moon: 1 },                                                   // 4 Brief: Regen hört auf
  { p: V(6.5, 2.4, -15), l: V(-8.9, 6.5, -9), rain: 0, gate: true, moon: 1, dim: true },                                      // 5 Epilog: Fenster erlischt
  { p: V(7.2, 2.6, -16), l: V(-8.9, 6.2, -9), rain: 0, gate: true, moon: 1, dim: true, fade: 0.55 },                         // 6 Schlusstext
  { p: V(7.4, 2.7, -16.5), l: V(-8.9, 6.2, -9), rain: 0, gate: true, moon: 1, dim: true, fade: 0.7 },                        // 7 Ende
];

function finale(el) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  el.innerHTML = `<div class="c3-stage"></div><div class="c3-dark"></div><div class="c3-bar top"></div><div class="c3-bar bottom"></div><div class="c3-over"></div>`;
  const stage = el.querySelector(".c3-stage"), over = el.querySelector(".c3-over"), darkEl = el.querySelector(".c3-dark");
  let h = null, rain = null, F = null, shot = 0, shotT = 0, dur = 5, from = null, lastNow = 0, gateK = 0, rainD = 1, moonK = 0, dimK = 0, done = false;
  const look = new THREE.Vector3();
  const update = (dt) => {
    if (!h) return;
    const now = performance.now(), real = lastNow ? Math.min(0.25, (now - lastNow) / 1000) : 0; lastNow = now; shotT += real;
    const S = SHOTS[Math.min(shot, SHOTS.length - 1)], k = ease(shotT / Math.min(dur, shot >= 3 ? 9 : dur)); // lange Schritte: Bewegung nach ~9 s fertig, danach ruhig
    const p = from.p.clone().lerp(S.p, k); look.copy(from.l).lerp(S.l, k);
    p.y += Math.sin(now / 900) * 0.01; // leichte Handkamera
    h.camera.position.copy(p); h.camera.up.set(0, 1, 0); h.camera.lookAt(look);
    const a = Math.min(1, real * 1.2);
    gateK += ((S.gate ? 1 : 0) - gateK) * Math.min(1, real * 0.6); F.gate.l.rotation.y = gateK * 1.6; F.gate.r.rotation.y = -gateK * 1.6;
    rainD += (S.rain - rainD) * a * 0.5; rain.m.opacity = 0.3 * Math.max(0.15, rainD); rain.tick(real, h.camera.position, rainD);
    moonK += ((S.moon || 0) - moonK) * a * 0.3; F.moon.intensity = 0.2 + moonK * 0.9; F.skyMat.color.setScalar(1 + moonK * 0.6);
    dimK += ((S.dim ? 1 : 0) - dimK) * Math.min(1, real * (S.dim && shotT > 2 ? 0.8 : 0)); F.lit.material.emissiveIntensity = 1.2 * (1 - dimK); F.litL.intensity = 10 * (1 - dimK);
    F.ll.intensity = 9 * (0.95 + Math.random() * 0.08);
    darkEl.style.opacity = String(S.fade || 0);
    h.scene.environmentIntensity = 0.04;
    if (h.bolt.intensity > 0) F.skyMat.color.setScalar(1 + moonK * 0.6 + h.bolt.intensity / 3);
  };
  h = host.begin(stage, "finale_hof", update);
  if (!h) { el.innerHTML = ""; return null; }
  F = h.scene.userData.finale;
  h.scene.fog = new THREE.FogExp2(0x07090d, 0.03);
  rain = buildRain(host.quality.level === "low" ? 1200 : 2200); rain.reset(SHOTS[0].p0); h.scene.add(rain.lines);
  from = { p: SHOTS[0].p0.clone(), l: SHOTS[0].l0.clone() };
  const ctl = {
    over,
    shot: (i, st) => { // von der Engine pro Schritt
      if (done || !h) return;
      shot = i; shotT = 0; dur = Math.max(2, ((st && st.ms) || 7000) / 1000);
      from = { p: h.camera.position.clone(), l: look.lengthSq() ? look.clone() : SHOTS[0].l0.clone() };
      if (i === 0) from = { p: SHOTS[0].p0.clone(), l: SHOTS[0].l0.clone() };
      if (i === 1) { h.bolt.intensity = 6; }
    },
    stop: () => {
      if (done) return; done = true;
      if (h) { h.scene.remove(rain.lines); rain.lines.geometry.dispose(); rain.m.dispose(); h.scene.fog = null; host.end(); h = null; }
    },
    info: () => ({ shot, t: shotT, gate: gateK, rain: rainD, dim: dimK }),
  };
  N.view3d.finaleCtl = ctl;
  return ctl;
}

N.view3d.finale = (el) => { try { return finale(el); } catch (e) { console.warn("[Hotel Nocturne 3D] Finale nicht möglich:", e); try { host.end(); } catch (x) { /* egal */ } el.innerHTML = ""; return null; } };
