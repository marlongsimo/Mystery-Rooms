/*
 * HOTEL NOCTURNE – Bausteine für die direkte Bedienung in 3D (Nahansicht, core.js)
 * combinationLock: Messingschloss mit Rollen (Ziffern oder Buchstaben). Oben antippen +1, unten −1, wischen dreht frei und rastet ein.
 *   Ein Griff/Bügel prüft über die Engine (engine.tryLock) – Fehlertexte, Erfolg und Folgen kommen von dort, wie beim Dialog.
 * Rückgabe: { group, parts(), value(), shake() } – group an das Möbelstück hängen, parts/value in die focus-Angabe von hs() übernehmen.
 */
import { THREE, canvasTex } from "./core.js?v=3";

const N = window.NOCTURNE;
const snd = (n) => N.audio && N.audio.play && N.audio.play(n);

export function combinationLock(ctx, { pid, symbols = "0123456789", count = 4, brass, dark, handle = "buegel", wheelWidth = 0.056, gap = 0.022 }) {
  const n = symbols.length, STEP = (Math.PI * 2) / n;
  const R = Math.max(0.042, (0.024 * n) / (Math.PI * 2)); // je Zeichen ≈ 2,4 cm Bogen (bei 10 Ziffern r = 4,2 cm wie in der Rezeption)
  const symH = ((Math.PI * 2 * R) / n) * 0.96, symW = wheelWidth * 0.9;
  const tex = (c) => canvasTex(128, Math.max(32, Math.round((128 * symH) / symW)), (g, w, h) => { g.fillStyle = "#1a120c"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8d2a0"; g.font = `600 ${Math.round(h * 0.78)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(c, w / 2, h / 2 + h * 0.05); });
  const mats = [...symbols].map((c) => new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.5 }));
  const group = new THREE.Group();
  const pitch = wheelWidth + gap, width = count * pitch + 0.06;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(width, R * 2 + 0.16, 0.03), brass); plate.position.z = 0.015; group.add(plate);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, R * 1.4, 0.012), dark); slot.position.z = 0.032; group.add(slot);
  const wheels = [], val = Array(count).fill(0), ang = Array(count).fill(0);
  for (let i = 0; i < count; i++) {
    const w = new THREE.Group(); w.position.set(-((count - 1) * pitch) / 2 + i * pitch, 0, R * 0.55);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, wheelWidth, Math.max(24, n * 2)), dark); drum.rotation.z = Math.PI / 2; w.add(drum);
    for (let k = 0; k < n; k++) { const a = k * STEP; const pl = new THREE.Mesh(new THREE.PlaneGeometry(symW, symH), mats[k]); pl.position.set(0, R * Math.sin(a), R * Math.cos(a)); pl.rotation.x = -a; w.add(pl); }
    [-1, 1].forEach((s) => { const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.005, 32), brass); rim.rotation.z = Math.PI / 2; rim.position.x = (s * wheelWidth) / 2; w.add(rim); });
    group.add(w); wheels.push(w);
  }
  // Griff/Bügel unter den Rollen
  const pull = new THREE.Group(); pull.position.set(0, -(R + 0.09), 0.035);
  if (handle === "buegel") { const t = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 10, 24, Math.PI), brass); t.rotation.z = Math.PI; pull.add(t); }
  else { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.05, 16), brass); k.rotation.x = Math.PI / 2; k.position.z = 0.02; pull.add(k); }
  const zone = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.06), new THREE.MeshBasicMaterial({ visible: false })); zone.position.y = handle === "buegel" ? -0.025 : 0; pull.add(zone);
  group.add(pull);
  let dragging = -1, pullT = -1, shakeT = -1;
  const set = (i, v) => { val[i] = ((v % n) + n) % n; snd("key"); };
  const value = () => val.map((v) => symbols[v]).join("");
  ctx.anim((dt) => {
    wheels.forEach((w, i) => { if (dragging !== i) ang[i] += (val[i] * STEP - ang[i]) * Math.min(1, dt * 12); w.rotation.x = ang[i]; });
    if (pullT >= 0) { pullT += dt; pull.position.y = -(R + 0.09) - Math.sin(Math.min(1, pullT * 3) * Math.PI) * 0.02; if (pullT > 0.4) pullT = -1; }
    if (shakeT >= 0) { shakeT += dt; group.position.x = (group.userData.x0 ??= group.position.x) + Math.sin(shakeT * 60) * 0.004 * (1 - shakeT / 0.4); if (shakeT > 0.4) { shakeT = -1; group.position.x = group.userData.x0; } }
  });
  const parts = () => [
    ...wheels.map((w, i) => ({ obj: w, name: "rad" + i, tap: (h, info) => set(i, val[i] + (info && !info.above ? -1 : 1)),
      drag: (dx, dy) => { dragging = i; ang[i] += dy * 0.03; }, release: (moved) => { dragging = -1; if (moved) set(i, Math.round(ang[i] / STEP)); } })),
    { obj: pull, name: "griff", tap: () => { pullT = 0; const r = ctx.engine().tryLock(pid, value()); if (!r.ok) shakeT = 0; } },
  ];
  return { group, parts, value, radius: R, width };
}
