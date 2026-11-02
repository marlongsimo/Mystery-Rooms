/*
 * STATION 5 – DER ÜBERWACHUNGSRAUM in 3D (HD)
 * Aufbau nach den 2D-Ansichten (js/rooms/05-ueberwachung.js): Nord Stahltür/Dienstplan/Wandtelefon/Uhr · Ost Monitorwand ·
 * Süd Bandregal und Rekorder · West Schaltpult mit Indexterminal, dunkler Bereich darunter, Tür „Technik“.
 * Untergeschoss, 5,2 × 5,2 m, 2,8 m hoch. Licht: Käfiglampe über der Tür (flackert), Monitore, Terminal.
 * Zustände: band_eingelegt (Monitor 3 zeigt den Innenhof, Rekorder „▶ 23:24“, Lämpchen grün) · monitor2_live / monitor2_gesehen ·
 * zeitleiste_ok · datei5_offen (Tür „Technik“ offen, Taste TECHNIK leuchtet) · taken_sicherung · Taschenlampe (unter dem Pult).
 * Bildhinweise: Uhr 23:17 · „CAM 3“-Hülle (rot) · „NUR ÜBER REKORDER“ · Terminaltexte wie in 2D · „ERSATZTEILE T.“.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, basic, ZONE, box, cyl, plane, group } from "./core.js?v=3";
import { textTex, plaqueTex, shell } from "./kit.js?v=2";
import { brassMat, std, rbox, panel } from "./hd.js?v=2";
import { tag } from "./gfx.js?v=1";

const R = 2.6, H = 2.8;
const MONO = "DM Mono, monospace";

/* ---------- Texturen ---------- */
const blockWall = () => canvasTex(512, 512, (g, w, h) => { // gestrichene Betonsteine: unten dunkler Ölsockel, oben blasses Grün
  g.fillStyle = "#4a5249"; g.fillRect(0, 0, w, h);
  const bh = h / 8, bw = w / 2;
  g.strokeStyle = "#353b34"; g.lineWidth = 3;
  for (let r = 0; r < 8; r++) { g.beginPath(); g.moveTo(0, r * bh); g.lineTo(w, r * bh); g.stroke(); for (let x = (r % 2) * bw / 2; x < w; x += bw / 2) { g.beginPath(); g.moveTo(x, r * bh); g.lineTo(x, r * bh + bh); g.stroke(); } }
  g.globalAlpha = 0.2; for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() > 0.5 ? "#20241f" : "#6a7268"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.25; for (let i = 0; i < 10; i++) { const x = Math.random() * w; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(40,30,20,0)"); gr.addColorStop(1, "rgba(40,30,20,.7)"); g.fillStyle = gr; g.fillRect(x, 0, 4 + Math.random() * 10, h); } // Wasserläufe
}, { repeat: [1, 1] });
const linoTex = () => canvasTex(512, 512, (g, w, h) => {
  const s = w / 4;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#26291f" : "#30332a"; g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = "#15170f"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  g.globalAlpha = 0.25; for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() > 0.5 ? "#0a0b08" : "#5a5c50"; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
}, { repeat: [1, 1] });
const clockTex = () => textTex(256, 256, null, (g, w) => {
  const c = w / 2; g.fillStyle = "#cdbd9b"; g.beginPath(); g.arc(c, c, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1a1a18"; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(c + Math.sin(a) * 100 - 3, c - Math.cos(a) * 100 - 9, 6, 18); }
  const hand = (a, l, wd) => { g.strokeStyle = "#1a1a18"; g.lineWidth = wd; g.lineCap = "round"; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); g.stroke(); };
  hand(((11 + 17 / 60) / 12) * Math.PI * 2, 56, 10); hand((17 / 60) * Math.PI * 2, 88, 6); // 23:17
});
const rosterTex = () => textTex(256, 320, "#e6dcc3", (g, w) => {
  g.fillStyle = "#2a2119"; g.fillRect(0, 0, w, 40); g.fillStyle = "#e6dcc3"; g.font = `600 18px ${MONO}`; g.textAlign = "center"; g.fillText("DIENSTPLAN", w / 2, 27);
  g.fillStyle = "#3a3026"; g.font = `11px ${MONO}`; g.fillText("MITTWOCH, 14.10.2009", w / 2, 60); g.textAlign = "left";
  [["Greta", "bis 22:00"], ["Ilse", "bis 22:00"], ["Tomasz", "Bereitschaft"], ["Elias Voss", "22–06"]].forEach(([n, s], i) => { g.fillText(n, 16, 96 + i * 34); g.fillText(s, 140, 96 + i * 34); g.strokeStyle = "#8a7a62"; g.beginPath(); g.moveTo(12, 104 + i * 34); g.lineTo(244, 104 + i * 34); g.stroke(); });
  g.fillStyle = "#2c2a5a"; g.font = "italic 15px Georgia, serif"; g.fillText("M. kommt heute. Zimmer 217", 14, 262); g.fillText("freihalten. – E.", 14, 284);
});
const scan = (g, w, h, a = 0.18) => { g.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); };
const vignette = (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.75)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
const label = (text) => plaqueTex(text, 320, 64, "#2a2119", "#cdbd9b", `600 26px ${MONO}`, 3);
const tapeLabel = () => textTex(64, 128, "#2a1414", (g, w, h) => { g.strokeStyle = "#7a2a24"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = "#d8cdb6"; g.fillRect(8, 10, 48, 54); g.fillStyle = "#7a2a24"; g.font = `600 13px ${MONO}`; g.textAlign = "center"; g.fillText("CAM 3", 32, 32); g.font = `10px ${MONO}`; g.fillText("14.10.", 32, 50); });
const stripTex = () => textTex(64, 256, "#e8e2cf", (g) => { g.fillStyle = "#5a5446"; for (let i = 0; i < 14; i++) g.fillRect(8, 12 + i * 17, 20 + ((i * 29) % 30), 3); });

/* Bildschirm: Canvas, das sich je nach Zustand neu zeichnet (Rauschen läuft) */
function screen(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, paint(...a) { g.save(); draw(g, w, h, ...a); g.restore(); scan(g, w, h); vignette(g, w, h); t.needsUpdate = true; } };
}
const ts = (g, text, col = "#e6f5c9", x = 10, y = 22) => { g.fillStyle = col; g.font = `600 15px ${MONO}`; g.fillText(text, x, y); };
const noise = (g, w, h, k = 1) => { for (let i = 0; i < 900 * k; i++) { const v = Math.random() * 200; g.fillStyle = `rgb(${v * 0.7},${v},${v * 0.8})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1 + Math.random() * 2); } for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(182,224,196,.18)"; g.fillRect(0, Math.random() * h, w, 2 + Math.random() * 6); } };

defineRoom("ueberwachung", (ctx) => {
  const { add, hs, state, anim, lerp } = ctx;
  const wt = blockWall(); wt.repeat.set(1, 1);
  const M = {
    wall: tag(lambert(0xffffff, { map: wt }), { roughness: 0.9, normal: 1.4 }),
    floor: tag(lambert(0xffffff, { map: linoTex() }), { roughness: 0.55, clearcoat: 0.15, normal: 0.8, envMapIntensity: 0.4 }),
    ceil: tag(lambert(0x2a2d29), { roughness: 0.95 }), trim: std(0x262a25, { roughness: 0.7 }),
    steel: std(0x4a4c47, { metalness: 0.7, roughness: 0.45 }), steelDark: std(0x2e302c, { metalness: 0.6, roughness: 0.5 }),
    plastic: std(0x3a3d38, { roughness: 0.55 }), plasticLight: std(0x8a877a, { roughness: 0.6 }), black: std(0x0a0b0a, { roughness: 0.6 }),
    wood: std(0x3b2b1e, { roughness: 0.7 }), paper: std(0xe6dcc3, { roughness: 0.95 }), brass: brassMat(),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim,
    holes: { n: [{ x: 0, y: 0, w: 1.04, h: 2.2 }], w: [{ x: -R + 2 * R * 0.81, y: 0, w: 1.04, h: 2.2 }] },
  });
  // Rohre und Kabeltrasse unter der Decke
  [[-1.6, 0.07], [-1.35, 0.045]].forEach(([z, r]) => { const p = cyl(r, r, 2 * R, std(0x4a3a2a, { roughness: 0.6, metalness: 0.4 }), 0, H - 0.2 - r, z); p.rotation.z = Math.PI / 2; add(p); });
  add(box(0.3, 0.04, 2 * R, M.steelDark, R - 0.5, H - 0.25, 0));
  for (let i = 0; i < 6; i++) add(cyl(0.012, 0.012, 2 * R, M.black, R - 0.6 + i * 0.04, H - 0.22, 0).rotateX(Math.PI / 2));

  /* ================= NORD · Stahltür zum Archiv, Dienstplan, Wandtelefon, Uhr ================= */
  const stairs = group(box(1.04, 0.05, 2.8, M.ceil, 0, 3.6, -1.4), box(0.05, 3.6, 2.8, M.wall, -0.52, 1.8, -1.4), box(0.05, 3.6, 2.8, M.wall, 0.52, 1.8, -1.4));
  for (let i = 0; i < 9; i++) stairs.add(box(1.0, 0.05, 0.3, lambert(0x3a3c38), 0, 0.2 * (i + 1) - 0.03, -0.15 - i * 0.3));
  const nDoor = group(rbox(1.0, 2.18, 0.06, M.steel, 0, 1.09, -0.02, 0.01), rbox(0.05, 0.28, 0.06, M.steelDark, 0.4, 1.05, 0.03, 0.01));
  [[-0.42, 0.12], [0.42, 0.12], [-0.42, 2.06], [0.42, 2.06]].forEach(([x, y]) => nDoor.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M.steel).translateX(x).translateY(y).translateZ(0.015)));
  nDoor.add(box(0.08, 2.26, 0.1, M.steelDark, -0.54, 1.13, 0), box(0.08, 2.26, 0.1, M.steelDark, 0.54, 1.13, 0), box(1.16, 0.08, 0.1, M.steelDark, 0, 2.24, 0));
  add(place(stairs, "n", 0.5, 0, 0));
  add(place(hs("ue_tuer", nDoor), "n", 0.5, 0, 0.02));
  // Käfiglampe über der Tür (flackert)
  const cage = group(rbox(0.3, 0.12, 0.08, M.steelDark, 0, 0, 0, 0.01), new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xf3e6b8, emissive: 0xf3e6b8, emissiveIntensity: 1.5 })));
  cage.children[1].rotation.z = Math.PI / 2; cage.children[1].position.z = 0.08;
  for (let i = 0; i < 5; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.004, 4, 16), M.steelDark); ring.rotation.y = Math.PI / 2; ring.position.set(-0.1 + i * 0.05, 0, 0.08); cage.add(ring); }
  add(place(cage, "n", 0.5, 2.42, 0.02));
  const doorL = new THREE.PointLight(0xffe2a8, 4, 0, 2); place(doorL, "n", 0.5, 2.3, 0.45); doorL.userData.shadow = true; add(doorL);
  let flick = 1; anim((dt) => { if (Math.random() < 0.03) flick = Math.random() < 0.5 ? 0.12 : 1; flick = lerp(flick, 1, dt * 2.5); doorL.intensity = 4 * flick; cage.children[1].material.emissiveIntensity = 1.5 * flick; });
  // Dienstplan
  const roster = group(plane(0.42, 0.52, lambert(0xffffff, { map: rosterTex() })), box(0.03, 0.03, 0.02, M.brass, 0, 0.24, 0.01)); roster.rotation.z = 0.02;
  add(place(hs("dienstplan", roster), "n", 0.76, 1.45, 0.01));
  // Wandtelefon mit herausgerissenem Kabel
  const phone = group(rbox(0.2, 0.32, 0.09, M.plastic, 0, 0, 0, 0.02), rbox(0.07, 0.26, 0.06, M.black, -0.04, 0.0, 0.07, 0.025), box(0.08, 0.05, 0.01, std(0x0a0b0a), 0.05, 0.08, 0.05));
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.0, -0.15, 0.04), new THREE.Vector3(-0.05, -0.4, 0.06), new THREE.Vector3(0.06, -0.62, 0.05), new THREE.Vector3(-0.02, -0.82, 0.07)]), 24, 0.008, 6), M.black);
  phone.add(cable, box(0.24, 0.6, 0.1, ZONE, 0, -0.18, 0.04));
  add(place(hs("wandtelefon", phone), "n", 0.215, 1.35, 0.05));
  // Uhr (23:17)
  const clock = group(cyl(0.17, 0.17, 0.04, M.black, 0, 0, 0, 32).rotateX(Math.PI / 2), plane(0.28, 0.28, new THREE.MeshStandardMaterial({ map: clockTex(), transparent: true, roughness: 0.4 }), 0, 0, 0.022));
  add(place(hs("ue_uhr", clock), "n", 0.275, 2.25, 0.03));

  /* ================= OST · Monitorwand ================= */
  const rack = group(rbox(4.2, 1.2, 0.5, M.steelDark, 0, 1.75, 0.25, 0.02), rbox(4.2, 0.4, 0.6, M.plastic, 0, 0.9, 0.3, 0.02), rbox(4.2, 0.05, 0.62, M.steelDark, 0, 1.12, 0.3, 0.01));
  for (const x of [-2.0, 2.0]) rack.add(box(0.06, 0.9, 0.5, M.steelDark, x, 0.45, 0.3));
  add(place(rack, "e", 0.5, 0, 0));
  const monW = 0.62, monH = 0.47;
  const crt = (draw) => {
    const sc = screen(320, 240, draw);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(monW, monH), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false }));
    const g = group(rbox(monW + 0.14, monH + 0.12, 0.42, M.plastic, 0, 0, -0.16, 0.05), rbox(monW + 0.04, monH + 0.03, 0.04, M.black, 0, 0, 0.04, 0.03));
    glass.position.z = 0.062; g.add(glass);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(monW, monH), new THREE.MeshStandardMaterial({ color: 0x0a0c0b, transparent: true, opacity: 0.18, roughness: 0.08, metalness: 0.3, depthWrite: false }));
    sheen.position.z = 0.066; g.add(sheen);
    return { g, sc };
  };
  const us = [0.21, 0.405, 0.595, 0.79];
  const mons = [
    crt((g, w, h) => { g.fillStyle = "#0b100d"; g.fillRect(0, 0, w, h); g.fillStyle = "#121a15"; g.fillRect(20, 140, 280, 70); g.strokeStyle = "#3f5a46"; g.lineWidth = 3; g.beginPath(); g.arc(160, 90, 30, 0, Math.PI * 2); g.stroke(); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, w, h); ts(g, "CAM 1 · 23:17", "#b6e0c4"); }),
    crt((g, w, h, live) => {
      g.fillStyle = "#0b100d"; g.fillRect(0, 0, w, h);
      if (live) { g.fillStyle = "#0e1712"; g.fillRect(0, 0, w, h); g.fillStyle = "#18241c"; g.beginPath(); g.moveTo(0, h); g.lineTo(110, 120); g.lineTo(210, 120); g.lineTo(w, h); g.fill(); g.fillStyle = "#d8f0de"; g.beginPath(); g.arc(200, 96, 13, 0, Math.PI * 2); g.fill(); g.fillRect(189, 110, 22, 56); ts(g, "CAM 2 · LIVE · 14.10.2026"); noise(g, w, h, 0.15); }
      else { noise(g, w, h, 1.4); ts(g, "CAM 2", "#5f7a66"); }
    }),
    crt((g, w, h, band, t = 0) => {
      g.fillStyle = "#0a0f0c"; g.fillRect(0, 0, w, h);
      if (!band) { g.fillStyle = "#d4443a"; g.font = `600 26px ${MONO}`; g.textAlign = "center"; g.fillText("KEIN SIGNAL", w / 2, 116); g.fillStyle = "#7a3a34"; g.font = `12px ${MONO}`; g.fillText("KAMERA 3 – SIGNAL UNTERBROCHEN", w / 2, 144); return; }
      g.fillStyle = "#121a15"; g.fillRect(0, 170, w, 70); g.strokeStyle = "#7fa08a"; g.lineWidth = 3; g.strokeRect(24, 70, 46, 100); g.fillStyle = "#7fa08a"; g.font = `13px ${MONO}`; g.fillText("W2", 34, 62);
      g.strokeStyle = "rgba(127,160,138,.25)"; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const x = (i * 27 + t * 140) % w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 10, 60); g.stroke(); }
      for (let i = 0; i < 6; i++) { const p = ((t * 0.12 + i * 0.16) % 1), x = 300 - p * 250; if (x < 50) continue; g.fillStyle = "#b6e0c4"; g.beginPath(); g.arc(x, 120 - (i % 2) * 3, 6, 0, Math.PI * 2); g.fill(); g.fillRect(x - 6, 127 - (i % 2) * 3, 12, 30); }
      ts(g, "CAM 3 · 14.10.2009 · 23:24:18");
    }),
    crt((g, w, h) => { g.fillStyle = "#0b100d"; g.fillRect(0, 0, w, h); g.fillStyle = "#121a15"; g.fillRect(20, 40, 110, 150); g.fillStyle = "#1b2620"; for (let i = 0; i < 4; i++) if (i !== 2) g.fillRect(28 + i * 26, 50, 20, 60); g.fillRect(190, 130, 90, 60); ts(g, "CAM 4 · --:--", "#5f7a66", 10, 228); }),
  ];
  const monNames = ["1 · LOBBY", "2 · FLUR", "3 · INNENHOF", "4 · BÜRO"];
  const monIds = [["monitor1"], ["monitor2_live", "monitor2b", "monitor2"], ["monitor3b", "monitor3"], ["monitor4"]];
  mons.forEach((m, i) => {
    m.g.add(plane(0.3, 0.06, lambert(0xffffff, { map: label(monNames[i]) }), 0, -monH / 2 - 0.1, 0.005));
    add(place(hs(monIds[i], m.g), "e", us[i], 1.75, 0.52));
  });
  // Lämpchen unter den Monitoren (Monitor 3 rot, nach dem Band grün), Hinweis „NUR ÜBER REKORDER“
  const leds = us.map((u, i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: i === 2 ? 0xd4443a : 0x7fa36d, toneMapped: false })); add(place(l, "e", u, 0.98, 0.61)); return l; });
  add(place(plane(0.36, 0.06, lambert(0xffffff, { map: label("NUR ÜBER REKORDER") })), "e", 0.595, 1.21, 0.535));
  const monL = new THREE.PointLight(0x9fd8b0, 2.2, 0, 2); place(monL, "e", 0.5, 1.75, 1.3); add(monL);
  let band = false, live = false, seen2 = false, tt = 0, acc = 0;
  state((has) => { band = has("band_eingelegt"); live = has("monitor2_live"); seen2 = has("monitor2_gesehen"); leds[2].material.color.setHex(band ? 0x7fa36d : 0xd4443a); mons[0].sc.paint(); mons[3].sc.paint(); mons[2].sc.paint(band, tt); mons[1].sc.paint(live); });
  void seen2;
  anim((dt) => { tt += dt; acc += dt; if (acc < 0.11) return; acc = 0; mons[1].sc.paint(live); if (band) mons[2].sc.paint(true, tt); monL.intensity = 2.2 * (0.9 + Math.random() * 0.15); });

  /* ================= SÜD · Bandregal und Rekorder ================= */
  const shelf = group(box(2.1, 0.04, 0.34, M.steelDark, 0, 2.1, 0.17));
  [-1.03, 1.03].forEach((x) => shelf.add(box(0.04, 2.1, 0.34, M.steelDark, x, 1.05, 0.17)));
  [0.08, 0.6, 1.1, 1.6].forEach((y) => shelf.add(box(2.06, 0.03, 0.32, M.steelDark, 0, y, 0.17)));
  const caseMat = std(0x1d1f1d, { roughness: 0.5 }), lblMat = std(0xcdbd9b, { roughness: 0.9 }), emptyMat = std(0x0e100e, { roughness: 0.6 });
  [0.08, 0.6, 1.1, 1.6].forEach((y, r) => {
    for (let i = 0; i < 18; i++) {
      const x = -0.94 + i * 0.11; if (r === 2 && i === 14) continue; // Platz der CAM-3-Hülle
      const empty = (i * 3 + r * 5) % 7 === 0;
      const c = box(0.032, 0.2, 0.19, empty ? emptyMat : caseMat, x, y + 0.115, 0.2); shelf.add(c);
      if (!empty) shelf.add(plane(0.02, 0.1, lblMat, x, y + 0.14, 0.296).rotateY(0));
    }
  });
  add(place(hs("bandregal", shelf), "s", 0.29, 0, 0.02));
  const huelle = group(box(0.034, 0.2, 0.19, std(0x2a1414, { roughness: 0.5 }), 0, 0.1, 0), plane(0.03, 0.18, lambert(0xffffff, { map: tapeLabel() }), 0, 0.1, 0.0955));
  huelle.rotation.z = 0.08; huelle.add(box(0.08, 0.26, 0.22, ZONE, 0, 0.1, 0));
  add(place(hs("huelle", huelle), "s", 0.29 + (-0.94 + 14 * 0.11) / (2 * R), 1.115, 0.22));
  // Tisch mit Rekorder, Eingangsmonitor, Druckerstreifen
  const table = group(rbox(1.9, 0.05, 0.75, M.wood, 0, 0.76, 0, 0.01));
  [[-0.88, -0.32], [0.88, -0.32], [-0.88, 0.32], [0.88, 0.32]].forEach(([x, z]) => table.add(box(0.05, 0.74, 0.05, M.steelDark, x, 0.37, z)));
  add(place(table, "s", 0.72, 0, 0.4));
  const recDisp = screen(160, 40, (g, w, h, b) => { g.fillStyle = "#0b2a1e"; g.fillRect(0, 0, w, h); g.fillStyle = "#9fe0b0"; g.font = `600 22px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b ? "▶ 23:24" : "--:--:--", w / 2, h / 2 + 1); });
  const rec = group(rbox(1.0, 0.16, 0.5, M.plastic, 0, 0.08, 0, 0.015), box(0.42, 0.03, 0.01, M.black, -0.18, 0.1, 0.251), plane(0.24, 0.06, new THREE.MeshBasicMaterial({ map: recDisp.tex, toneMapped: false }), 0.28, 0.1, 0.252));
  [-0.36, -0.29, -0.22].forEach((x) => rec.add(cyl(0.016, 0.016, 0.02, std(0x4a4f48), x, 0.045, 0.252).rotateX(Math.PI / 2)));
  const tapeIn = box(0.4, 0.024, 0.06, M.black, -0.18, 0.1, 0.24); rec.add(tapeIn);
  rec.add(box(1.04, 0.22, 0.54, ZONE, 0, 0.1, 0));
  add(place(hs("rekorder", rec), "s", 0.72, 0.785, 0.4));
  state((has) => { const b = has("band_eingelegt"); tapeIn.visible = b; recDisp.paint(b); });
  // Druckerstreifen: aus dem Rekorder nach oben gerollt und über die Kante gebogen
  const sg = new THREE.PlaneGeometry(0.05, 0.36, 1, 12), pp = sg.attributes.position;
  for (let i = 0; i < pp.count; i++) { const y = pp.getY(i) + 0.18; pp.setZ(i, Math.sin(y * 7) * 0.05 - y * 0.05); pp.setY(i, y); }
  sg.computeVertexNormals();
  const strip = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: stripTex(), roughness: 0.9, side: THREE.DoubleSide }));
  add(place(hs("loeschprotokoll", group(strip, box(0.1, 0.38, 0.12, ZONE, 0, 0.18, 0))), "s", 0.72 + 0.25 / (2 * R), 0.95, 0.5));
  // Eingangsmonitor auf dem Rekorder
  const inMon = screen(256, 160, (g, w, h) => { g.fillStyle = "#060908"; g.fillRect(0, 0, w, h); g.fillStyle = "#b6e0c4"; g.font = `600 17px ${MONO}`; g.textAlign = "center"; g.fillText("EINGANG REKORDER", w / 2, h / 2 + 6); }); inMon.paint();
  const im = group(rbox(0.5, 0.36, 0.34, M.plastic, 0, 0.18, -0.12, 0.04), plane(0.42, 0.27, new THREE.MeshBasicMaterial({ map: inMon.tex, toneMapped: false }), 0, 0.18, 0.052));
  add(place(im, "s", 0.72 - 0.15 / (2 * R), 0.945, 0.3));

  /* ================= WEST · Schaltpult, Indexterminal, dunkler Bereich, Tür „Technik“ ================= */
  const pw = 3.0, pu = 0.37;
  const desk = group(rbox(pw, 1.1, 0.26, M.plastic, 0, 0.55, 0.13, 0.015));
  const slope = rbox(pw, 0.05, 0.66, M.plasticLight, 0, 0, 0, 0.012); slope.rotation.x = 0.28; slope.position.set(0, 1.0, 0.56); desk.add(slope);
  desk.add(rbox(pw, 0.08, 0.06, M.plastic, 0, 0.9, 0.88, 0.01), box(pw, 0.88, 0.04, M.black, 0, 0.44, 0.27)); // Vorderkante, Rückwand des Fußraums
  [-pw / 2 + 0.03, pw / 2 - 0.03].forEach((x) => desk.add(box(0.06, 0.9, 0.62, M.plastic, x, 0.45, 0.58)));
  // Kameratasten und TECHNIK auf der Schräge
  const keys = new THREE.Group(); keys.position.copy(slope.position); keys.rotation.x = 0.28; desk.add(keys);
  const keyTex = (t, c) => plaqueTex(t, 192, 96, c, "#3a3f3a", `600 34px ${MONO}`, 2);
  [0, 1, 2, 3].forEach((i) => keys.add(rbox(0.18, 0.035, 0.12, new THREE.MeshStandardMaterial({ map: keyTex("CAM" + (i + 1), "#b6e0c4"), roughness: 0.5 }), -1.0 + i * 0.26, 0.035, 0.0, 0.01)));
  const techKeyMat = new THREE.MeshStandardMaterial({ map: keyTex("TECHNIK", "#e6c48a"), roughness: 0.5, emissive: 0x000000 });
  keys.add(rbox(0.42, 0.035, 0.12, techKeyMat, 0.35, 0.035, 0.0, 0.01));
  add(place(desk, "w", pu, 0, 0));
  add(place(hs("pult", group(box(pw - 0.2, 0.2, 0.66, ZONE, 0, 1.0, 0.56))), "w", pu, 0, 0));
  // Indexterminal (Text je nach Fortschritt wie in 2D)
  const term = screen(320, 240, (g, w, h, s) => {
    g.fillStyle = "#060908"; g.fillRect(0, 0, w, h); g.font = `600 22px ${MONO}`;
    const L = s.d ? [["TÜR TECHNIK"], ["FREIGEGEBEN", "#9fe0b0"], ["F3 FEHLT!", "#e6c48a"]] : s.z ? [["DATEI 5 · IDX 5281"], ["GESPERRT", "#d4443a"], ["KENNWORT?", "#e6c48a"]] : s.b ? [["INDEXTERMINAL"], ["4 AUFNAHMEN"], ["ORDNEN …"]] : [["INDEXTERMINAL"], ["DATENSATZ CAM 3", "#d4443a"], ["FEHLT"]];
    L.forEach(([t, c], i) => { g.fillStyle = c || "#b6e0c4"; g.fillText(t, 18, 60 + i * 40); });
    if (Math.floor(performance.now() / 500) % 2) { g.fillStyle = "#b6e0c4"; g.fillRect(18, 60 + L.length * 40 - 18, 12, 20); }
  });
  const tm = crt(() => {}); tm.g.children[2].material.map = term.tex; // gleiches Gehäuse wie die Monitore, eigenes Bild
  const note = plane(0.09, 0.06, lambert(0xe6dcc3), monW / 2 - 0.08, -monH / 2 + 0.05, 0.07); note.rotation.z = 0.1; tm.g.add(note);
  add(place(hs(["terminal_datei5", "terminal", "terminal_leer"], tm.g), "w", 0.5, 1.42, 0.2));
  const termL = new THREE.PointLight(0x9fe0b0, 1.6, 0, 2); place(termL, "w", 0.5, 1.4, 0.9); add(termL);
  let tS = { b: false, z: false, d: false }, tAcc = 0;
  state((has) => { tS = { b: has("band_eingelegt"), z: has("zeitleiste_ok"), d: has("datei5_offen") }; term.paint(tS); techKeyMat.emissive.setHex(tS.d ? 0x8a6a20 : 0x000000); });
  anim((dt) => { tAcc += dt; if (tAcc > 0.5) { tAcc = 0; term.paint(tS); } });
  // Unter dem Pult: ohne Licht schwarz (Abdeckung), mit Taschenlampe die Kiste „Ersatzteile T.“
  const under = group(), shade = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.14, 0.86), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.96, depthWrite: false }));
  shade.position.set(0, 0.44, 0.9); under.add(shade);
  const uZone = box(pw - 0.2, 0.86, 0.6, ZONE, 0, 0.44, 0.6); under.add(uZone);
  add(place(hs("unter_pult", under), "w", pu, 0, 0));
  const kiste = group(rbox(0.5, 0.24, 0.32, M.steel, 0, 0.12, 0, 0.015), plane(0.3, 0.06, lambert(0xffffff, { map: label("ERSATZTEILE T.") }), 0, 0.15, 0.162));
  const fuse = group(cyl(0.035, 0.035, 0.22, std(0xc9a466, { roughness: 0.5 }), 0, 0, 0), cyl(0.04, 0.04, 0.03, M.brass, 0, 0.11, 0), cyl(0.04, 0.04, 0.03, M.brass, 0, -0.11, 0));
  fuse.rotation.z = Math.PI / 2; fuse.position.set(0, 0.27, 0.0); kiste.add(fuse, box(0.56, 0.36, 0.4, ZONE, 0, 0.16, 0));
  add(place(hs("sicherung", kiste, { hideWhenHidden: true }), "w", 0.354, 0, 0.55));
  state((has, light) => { shade.visible = !light; });
  // Tür „Technik“ (öffnet nach Datei 5), dahinter ein dunkler Gang
  const corr = group(box(1.04, 0.05, 3.0, M.ceil, 0, 2.2, -1.5), box(0.05, 2.2, 3.0, M.wall, -0.52, 1.1, -1.5), box(0.05, 2.2, 3.0, M.wall, 0.52, 1.1, -1.5), box(1.04, 2.2, 0.05, basic(0x020202), 0, 1.1, -3.0));
  const tPv = new THREE.Group(); tPv.position.set(-0.5, 0, -0.02);
  const tDoor = group(rbox(1.0, 2.18, 0.06, std(0x3d3f3a, { metalness: 0.6, roughness: 0.5 }), 0.5, 1.09, 0, 0.01), plane(0.6, 0.14, lambert(0xffffff, { map: plaqueTex("TECHNIK", 384, 90, "#2a2119", "#e6c48a", `600 44px ${MONO}`, 8) }), 0.5, 1.85, 0.032), rbox(0.05, 0.28, 0.06, M.steelDark, 0.9, 1.05, 0.04, 0.01));
  tPv.add(tDoor);
  const tLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd4443a, toneMapped: false })); tLed.position.set(0.66, 1.3, 0.04);
  const tFrame = group(box(0.08, 2.26, 0.1, M.steelDark, -0.54, 1.13, 0), box(0.08, 2.26, 0.1, M.steelDark, 0.54, 1.13, 0), box(1.16, 0.08, 0.1, M.steelDark, 0, 2.24, 0));
  add(place(group(corr, tPv, tFrame, tLed), "w", 0.81, 0, 0));
  add(place(hs(["technik", "technik_zu"], group(box(1.0, 2.2, 0.3, ZONE, 0, 1.1, 0))), "w", 0.81, 0, 0));
  let tOpen = false; state((has) => { tOpen = has("datei5_offen"); tLed.material.color.setHex(tOpen ? 0x7fa36d : 0xd4443a); });
  anim((dt) => { tPv.rotation.y = lerp(tPv.rotation.y, tOpen ? 1.3 : 0, Math.min(1, dt * 2)); });

  // Grundlicht: Leuchtstoffröhre an der Decke (meist aus, zuckt gelegentlich)
  const tube = group(box(1.3, 0.06, 0.16, M.steelDark, 0, 0, 0), cyl(0.025, 0.025, 1.2, new THREE.MeshStandardMaterial({ color: 0xdfe8e0, emissive: 0xdfe8e0, emissiveIntensity: 0 }), 0, -0.05, 0));
  tube.children[1].rotation.z = Math.PI / 2; tube.position.set(0, H - 0.05, 0.3); add(tube);
  const tubeL = new THREE.PointLight(0xe0f0e8, 0, 0, 2); tubeL.position.set(0, H - 0.4, 0.3); add(tubeL);
  let zap = 0; anim((dt) => { zap -= dt; if (zap < -6 && Math.random() < 0.01) zap = 0.35; const on = zap > 0 && Math.random() < 0.6; tube.children[1].material.emissiveIntensity = on ? 2 : 0.05; tubeL.intensity = on ? 6 : 0.4; });
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.25 };
});
ready();
