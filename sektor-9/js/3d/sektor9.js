/*
 * SEKTOR 9 – Rechenkern (Sektor 9): runder Raum, ein Standpunkt.
 *   Mitte: der Kernspeicher (ECHO) – Schränke im Kreis, Bänder, atmende Lämpchen.
 *   Nord: Entscheidungspult mit drei Tasten ABSCHALTEN · SENDEN · FORTSETZEN (Bedingungen und Bestätigung in der Engine).
 *   Ost: Ostrowskis Schreibtisch mit Diktiergerät und Brille. Süd: Panzertür zurück.
 * Nach der Entscheidung: Licht und Maschine verändern sich (A erlischt, B Sender glüht, C pulsiert rot).
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { mats, label, stencil, cageLamp, sheet, lines, MONO, std } from "./s9kit.js?v=1";

defineRoom("sektor9", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const R = 4.6, H = 4.2;
  const hemi = scene.children.find((c) => c.isHemisphereLight); if (hemi) hemi.intensity = 0.2;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), M.wall); wall.material = M.wall.clone(); wall.material.side = THREE.BackSide; wall.position.y = H / 2; add(wall);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(R, 48), M.floor); fl.rotation.x = -Math.PI / 2; add(fl);
  const ce = new THREE.Mesh(new THREE.CircleGeometry(R, 48), M.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = H; add(ce);
  // Kernspeicher in der Mitte
  const core = new THREE.Group(); add(core);
  const coreLeds = [], reels = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, c = group(box(0.8, 2.2, 0.5, M.paintGrey, 0, 1.1, 0));
    for (let k = 0; k < 2; k++) { const r = cyl(0.16, 0.16, 0.03, M.black, -0.18 + k * 0.36, 1.5, 0.26, 16); r.rotation.x = Math.PI / 2; c.add(r); reels.push(r); }
    for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3b2a, toneMapped: false })); l.position.set(-0.3 + (k % 4) * 0.2, 0.7 + Math.floor(k / 4) * 0.12, 0.26); c.add(l); coreLeds.push(l); }
    c.position.set(Math.sin(a) * 1.25, 0, Math.cos(a) * 1.25); c.rotation.y = a; core.add(c);
  }
  core.add(cyl(0.9, 0.9, 0.1, M.steelDark, 0, 2.35, 0, 32), plane(1.2, 0.3, stencil("ECHO", 512, 128, "#d0473a", 110), 0, 2.55, 1.0));
  const coreL = new THREE.PointLight(0xff3b2a, 3, 6, 2); coreL.position.set(0, 1.6, 0); core.add(coreL);
  add(hs("n_kern", group(core, box(3.2, 2.6, 3.2, ZONE, 0, 1.3, 0)), { aimLocal: [0, 1.5, 1.2] }));
  // Entscheidungspult (zwischen Spieler und Maschine, Front nach Süden)
  const pult = new THREE.Group(); pult.position.set(0, 0, 1.75); add(pult);
  pult.add(box(2.2, 0.95, 0.6, M.paintGrey, 0, 0.475, 0));
  const top = box(2.2, 0.05, 0.55, M.paint, 0, 1.0, 0.05); top.rotation.x = -0.35; pult.add(top);
  const mkBtn = (x, col, text, id) => { const b = group(cyl(0.075, 0.075, 0.05, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.4 }), 0, 0, 0, 24), plane(0.46, 0.08, label(text, 512, 92, "#e8e2cc", "#1a1d1a", 44), 0, 0.14, 0.0), box(0.5, 0.4, 0.2, ZONE, 0, 0.04, 0)); // Beschriftung über der Taste
    b.children[0].rotation.x = Math.PI / 2; b.children[1].position.z = 0.002; b.position.set(x, 1.05, 0.34); b.rotation.x = -0.35; pult.add(b); hs(id, b); return b; }; // Taste bleibt am Pult
  const bA = mkBtn(-0.7, 0x6b7a70, "ABSCHALTEN", "n_a"), bB = mkBtn(0, 0xc9a030, "SENDEN", "n_b"), bC = mkBtn(0.7, 0xd0473a, "FORTSETZEN", "n_c");
  // Ostrowskis Schreibtisch (Ost)
  const desk = group(box(1.4, 0.06, 0.7, M.wood, 0, 0.76, 0), box(0.06, 0.74, 0.66, M.steelDark, -0.65, 0.37, 0), box(0.06, 0.74, 0.66, M.steelDark, 0.65, 0.37, 0));
  desk.position.set(3.4, 0, 0.6); desk.rotation.y = -Math.PI / 2; add(desk);
  const chair = group(box(0.45, 0.05, 0.45, std(0x2a2a2a), 0, 0.46, 0), box(0.45, 0.5, 0.05, std(0x2a2a2a), 0, 0.72, -0.2), cyl(0.03, 0.03, 0.44, M.steelDark, 0, 0.23, 0)); chair.position.set(3.9, 0, 0.9); chair.rotation.y = -Math.PI / 2 - 0.4; add(chair);
  const dict = group(box(0.16, 0.04, 0.24, M.black, 0, 0.02, 0), box(0.1, 0.012, 0.06, M.steelDark, 0, 0.045, 0.04), box(0.26, 0.12, 0.32, ZONE, 0, 0.05, 0));
  dict.position.set(3.3, 0.79, 0.4); add(hs("n_diktat", dict));
  const glasses = group(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), M.steelDark), new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), M.steelDark)); glasses.children[0].position.x = -0.035; glasses.children[1].position.x = 0.035; glasses.rotation.x = -Math.PI / 2; glasses.position.set(3.35, 0.8, 0.85); add(glasses);
  const papers = sheet(0.3, 0.4, (g, w, h) => lines(g, w, h, 14), M, 0.2); papers.position.set(3.5, 0.795, 0.75); add(papers);
  // Panzertür zurück (Süd)
  const back = group(box(2.2, 2.4, 0.1, new THREE.MeshBasicMaterial({ color: 0x0a0605 }), 0, 1.2, 0), box(2.2, 2.4, 0.4, ZONE, 0, 1.2, 0)); back.position.set(0, 0, R - 0.1); add(hs("n_ausgang", back));
  // Licht und Wandel nach der Entscheidung
  const lamp = cageLamp(M, 0xffb060, 2.2, 7); lamp.g.position.set(3.2, H - 0.5, 0.6); add(lamp.g);
  add(new THREE.AmbientLight(0x30202a, 0.35));
  let ending = null; state(() => { ending = eng().isSolved("ende_a") ? "a" : eng().isSolved("ende_b") ? "b" : eng().isSolved("ende_c") ? "c" : null; });
  let fade = 1;
  anim((dt, t) => {
    if (ending === "a" || ending === "b") fade = Math.max(0, fade - dt * 0.25);
    const breath = ending === "c" ? 0.5 + Math.abs(Math.sin(t * 3)) : 0.75 + Math.sin(t * 1.3) * 0.25;
    coreL.intensity = 3 * breath * fade; coreLeds.forEach((l, i) => l.material.color.setHex(fade > 0.05 && (Math.floor(t * (ending === "c" ? 9 : 3)) + i * 5) % 7 ? (ending === "c" ? 0xff2010 : 0xff3b2a) : 0x200404));
    reels.forEach((r, i) => { r.rotation.y += dt * (ending === "c" ? 4 : 1.2) * fade * (i % 2 ? 1 : -1); });
    [bA, bB, bC].forEach((b, i) => { const on = ending ? (ending === "abc"[i] ? 1.2 : 0.05) : i === 2 ? 0.6 + Math.sin(t * 3) * 0.4 : 0.25; b.children[0].material.emissiveIntensity = on; });
  });
  return { eyes: { kern: [0, 1.65, 3.6] }, hd: true, R, H, env: 0.1 };
});
ready();
