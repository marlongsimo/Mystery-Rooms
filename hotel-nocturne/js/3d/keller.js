/*
 * STATION 6 – DER KELLER in 3D (HD)
 * Aufbau nach den 2D-Ansichten (js/rooms/06-keller.js): Nord Metalltreppe/Wasserstandsmarken/Rohre · Ost Notstromaggregat West ·
 * Süd Hauptverteilung mit Hebeln A–D und Lehns Wandplan · West alte Wäscherei mit Mangel, Wäscheschrank und verborgener Stahltür.
 * 5,6 × 5,6 m, 3,6 m hoch, Wasser knöcheltief. Der Raum ist dunkel, bis der Strom verteilt ist (darkUntil „strom“):
 * ohne Strom kein Grundlicht, nur die Taschenlampe. „flackern“ (Ereignis nach den Hebeln) schaltet das Licht kurz ganz aus.
 * Zustände: f3_drin · gen_laeuft (Motor vibriert, Zeiger, Kontrollleuchte grün) · strom (Käfiglampen, Hebel unten, W2 230 V,
 * Magnetschloss grün) · schrank_weg (Schrank rutscht zur Seite) · tuer_offen.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, basic, ZONE, box, cyl, plane, group } from "./core.js?v=4";
import { textTex, plaqueTex, shell } from "./kit.js?v=3";
import { woodMat, brassMat, std, rbox, panel } from "./hd.js?v=3";
import { tag } from "./gfx.js?v=2";
import { lift, twister } from "./interact.js?v=4";

const R = 2.8, H = 3.6, WATER = 0.12, LAND = 1.33;
const MONO = "DM Mono, monospace";

/* ---------- Texturen ---------- */
const wallTex = () => { const t = canvasTex(256, 1024, (g, w, h) => { // Beton, Kachel 1 m breit über die volle Höhe; Flutrand bei ≈ 1 m
  g.fillStyle = "#3a3a35"; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.22; for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() > 0.5 ? "#1a1a17" : "#5c5a52"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.18; for (let i = 0; i < 4; i++) { g.fillStyle = "#000"; g.fillRect(0, h * (0.18 + i * 0.22), w, 2); } // Schalungsfugen
  g.globalAlpha = 1; const y = h * (1 - 1.0 / H);
  const gr = g.createLinearGradient(0, y - 30, 0, h); gr.addColorStop(0, "rgba(14,13,10,0)"); gr.addColorStop(0.06, "rgba(14,13,10,.7)"); gr.addColorStop(0.1, "rgba(30,28,22,.45)"); gr.addColorStop(1, "rgba(10,12,10,.7)"); g.fillStyle = gr; g.fillRect(0, y - 30, w, h - y + 30);
  g.strokeStyle = "rgba(8,8,6,.8)"; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.07) * 4); g.stroke();
  g.globalAlpha = 0.12; for (let i = 0; i < 2; i++) { const x = Math.random() * w; g.fillStyle = "#1a1a14"; g.fillRect(x, 0, 2 + Math.random() * 3, h * (0.2 + Math.random() * 0.3)); } // vereinzelte Feuchtigkeitsläufe
  g.globalAlpha = 0.16; for (let i = 0; i < 18; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#6a6a60"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 24, 4 + Math.random() * 16, 0, 0, Math.PI * 2); g.fill(); } // Flecken, Lunker
}); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1 / H); return t; }; // eine Kachel über die volle Raumhöhe
const floorTex = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#24241f"; g.fillRect(0, 0, w, h); g.globalAlpha = 0.3; for (let i = 0; i < 5000; i++) { g.fillStyle = Math.random() > 0.5 ? "#0e0e0c" : "#4a4a42"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, { repeat: [1, 1] });
const rippleTex = () => canvasTex(512, 512, (g, w, h) => { // Helligkeit = Wellenhöhe (daraus macht gfx.toPBR die Normalenkarte)
  g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) { const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, Math.random() > 0.5 ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.25)"); gr.addColorStop(1, "rgba(128,128,128,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
}, { repeat: [1, 1] });
const marksTex = () => textTex(128, 512, "#22231f", (g, w, h) => { // Pegellatte 0–1,4 m (unten = Boden)
  const ym = (m) => h - (m / 1.4) * h;
  g.strokeStyle = "#8a8a80"; g.lineWidth = 3; for (let i = 0; i <= 14; i++) { g.beginPath(); g.moveTo(0, ym(i / 10)); g.lineTo(i % 5 ? 26 : 46, ym(i / 10)); g.stroke(); }
  const mark = (m, txt, col, font) => { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(0, ym(m)); g.lineTo(w, ym(m)); g.stroke(); g.fillStyle = col; g.font = font; g.fillText(txt, 8, ym(m) - 8); };
  mark(0.18, "1987", "#b6c8d0", `600 22px ${MONO}`); mark(0.3, "2002", "#b6c8d0", `600 22px ${MONO}`);
  mark(0.98, "14.10.09", "#c0574a", "italic 22px Georgia, serif"); g.fillStyle = "#c0574a"; g.font = "italic 22px Georgia, serif"; g.fillText("23:50 E.", 8, ym(0.98) + 26);
});
const carveTex = () => canvasTex(512, 64, (g, w, h) => { g.fillStyle = "#3b3a33"; g.fillRect(0, 0, w, h); g.globalAlpha = 0.4; for (let i = 0; i < 1500; i++) { g.fillStyle = Math.random() > 0.5 ? "#5a3a22" : "#1a1a16"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.globalAlpha = 0.75; g.fillStyle = "#8a8a7a"; g.font = "italic 30px Georgia, serif"; g.fillText("T.+E. – 1999", 150, 44); });
const gaugeTex = () => textTex(256, 256, null, (g, w) => {
  const c = w / 2; g.fillStyle = "#e8e0c8"; g.beginPath(); g.arc(c, c, 120, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2a2e2a"; g.lineWidth = 4; g.beginPath(); g.arc(c, c + 20, 92, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.15 + i * 0.07); g.beginPath(); g.moveTo(c + Math.cos(a) * 92, c + 20 + Math.sin(a) * 92); g.lineTo(c + Math.cos(a) * (i % 5 ? 80 : 72), c + 20 + Math.sin(a) * (i % 5 ? 80 : 72)); g.stroke(); }
  g.fillStyle = "#2a2e2a"; g.font = `600 28px ${MONO}`; g.textAlign = "center"; g.fillText("V", c, c + 70);
});
const manualTex = () => textTex(256, 384, "#d8ccb0", (g, w, h) => {
  g.fillStyle = "#2a2119"; g.fillRect(0, 0, w, 44); g.fillStyle = "#d8ccb0"; g.font = `600 17px ${MONO}`; g.textAlign = "center"; g.fillText("INBETRIEBNAHME", w / 2, 29); g.textAlign = "left";
  g.fillStyle = "#3a3026"; g.font = `13px ${MONO}`; ["1 Kraftstoffhahn öffnen", "2 Choke ziehen", "3 Zündung EIN", "4 Starter drücken"].forEach((t, i) => g.fillText(t, 16, 92 + i * 36));
  g.fillStyle = "rgba(138,122,88,.45)"; g.beginPath(); g.ellipse(80, 132, 70, 26, 0.2, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(190, 300, 46, 60, 0, 0, Math.PI * 2); g.fill(); // Wasserflecken
  g.fillStyle = "#2c2a5a"; g.font = "italic 15px Georgia, serif"; g.fillText("Reihenfolge einhalten! – T.", 16, 260);
});
const planTex = () => textTex(256, 340, "#ede5d2", (g, w) => {
  g.fillStyle = "#5d2f2a"; g.fillRect(0, 0, w, 36); g.fillStyle = "#ede5d2"; g.font = `600 14px ${MONO}`; g.textAlign = "center"; g.fillText("NOTSTROMVERTEILUNG", w / 2, 24);
  g.fillStyle = "#2a2119"; g.font = `600 22px ${MONO}`; ["A", "B", "C", "D"].forEach((l, i) => { g.strokeStyle = "#2a2119"; g.lineWidth = 2; g.strokeRect(24 + i * 56, 70, 40, 40); g.fillText(l, 44 + i * 56, 98); });
  g.font = `16px ${MONO}`; g.fillText("A → B → C → D", w / 2, 150);
  g.fillStyle = "#6b2420"; g.font = "italic 20px Georgia, serif"; g.fillText("Tor W2: stillgelegt.", w / 2, 220);
  g.fillStyle = "#2c2a5a"; g.font = "italic 18px Georgia, serif"; g.fillText("V. Lehn", w * 0.7, 300);
});
const keyLabel = (t) => plaqueTex(t, 192, 64, "#9aa39a", "#1a1f1b", `600 24px ${MONO}`, 2);

defineRoom("keller", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const snd = ctx.sound, eng = ctx.engine;
  const inner = (g) => { const a = new THREE.Group(); while (g.children.length) a.add(g.children[0]); g.add(a); return a; };
  const pulse = (dur, fn) => { let t = -1; anim((dt) => { if (t < 0) return; t += dt; fn(Math.min(1, t / dur), t); if (t >= dur) { fn(1, t); t = -1; } }); return () => { t = 0; }; };
  const wt = wallTex();
  const M = {
    wall: tag(lambert(0xffffff, { map: wt }), { roughness: 0.92, normal: 1.4 }), floor: tag(lambert(0xffffff, { map: floorTex() }), { roughness: 0.9 }),
    ceil: tag(lambert(0x1c1c19), { roughness: 0.95 }), trim: std(0x262622, { roughness: 0.8 }),
    concrete: tag(lambert(0x4a4a44, { map: floorTex() }), { roughness: 0.9 }), steel: std(0x4a4c46, { metalness: 0.65, roughness: 0.5 }), steelDark: std(0x2a2b28, { metalness: 0.6, roughness: 0.55 }),
    rust: std(0x4a3426, { metalness: 0.4, roughness: 0.75 }), genGreen: std(0x2f3a33, { roughness: 0.45, metalness: 0.3 }), black: std(0x0d0e0d, { roughness: 0.6 }),
    red: std(0xb03a2e, { roughness: 0.4 }), wood: woodMat("#3b2b1e", "#1a130d"), brass: brassMat(), cloth: std(0xcfc6b0, { roughness: 1 }),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim,
    holes: { n: [{ x: -R + 2 * R * 0.6, y: LAND, w: 0.9, h: 2.05 }], w: [{ x: -R + 2 * R * 0.74, y: 0, w: 0.9, h: 2.15 }] },
  });
  // Wasser: knöcheltief, leicht bewegt, man sieht den Boden durch
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R), tag(lambert(0x0b1213, { map: rippleTex(), transparent: true, opacity: 0.82, depthWrite: false }), { roughness: 0.06, metalness: 0.25, normal: 3.5, envMapIntensity: 1 }));
  water.material.map.repeat.set(3, 3); water.rotation.x = -Math.PI / 2; water.position.y = WATER; water.renderOrder = 2; add(water);
  anim((dt, t) => { const m = water.material; if (m.map) { m.map.offset.set(Math.sin(t * 0.1) * 0.2, t * 0.012); } if (m.normalMap) { m.normalMap.offset.copy(m.map.offset); m.normalMap.repeat.copy(m.map.repeat); } });
  // Rohre unter der Decke
  [[-1.9, 0.11], [-1.55, 0.07]].forEach(([z, r]) => { const p = cyl(r, r, 2 * R, M.rust, 0, H - 0.3 - r, z); p.rotation.z = Math.PI / 2; add(p); });

  /* ---------- Licht: ohne Strom dunkel (Grundlicht der Szene fast aus), Käfiglampen erst mit „strom“ ---------- */
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  const cages = [], cageLights = [];
  const cageLamp = (wall, u, d) => {
    const g = group(box(0.26, 0.05, 0.26, M.steelDark, 0, 0, 0), new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshStandardMaterial({ color: 0x3a3a32, emissive: 0xf3d79a, emissiveIntensity: 0 })));
    g.children[1].position.y = -0.12;
    for (let i = 0; i < 4; i++) { const b = cyl(0.004, 0.004, 0.2, M.steelDark, Math.cos(i * Math.PI / 2) * 0.085, -0.12, Math.sin(i * Math.PI / 2) * 0.085); g.add(b); }
    add(place(g, wall, u, H - 0.03, d)); cages.push(g);
    const l = new THREE.PointLight(0xffd9a0, 0, 0, 2); place(l, wall, u, H - 0.3, d + 0.15); add(l); cageLights.push(l);
  };
  cageLamp("n", 0.5, 1.2); cageLamp("e", 0.47, 1.2); cageLamp("s", 0.5, 1.2); cageLamp("w", 0.4, 1.2);
  cageLights[1].userData.shadow = true;
  let lit = false;
  state((has) => { lit = has("strom") && !has("flackern"); if (hemi) hemi.intensity = lit ? 0.7 : 0.012; });
  anim((dt, t) => {
    scene.environmentIntensity = lit ? 0.22 : 0.008;
    cageLights.forEach((l, i) => { const f = lit ? (0.92 + Math.sin(t * 9 + i) * 0.04 + (Math.random() < 0.01 ? -0.5 : 0)) : 0; l.intensity = lerp(l.intensity, 5 * f, Math.min(1, dt * 12)); cages[i].children[1].material.emissiveIntensity = l.intensity / 3; });
  });

  /* ================= NORD · Metalltreppe hinauf, Wasserstandsmarken, Rohr mit Ritzung ================= */
  // Die Treppe führt gerade auf die Tür zu (nichts steht zwischen Podest und Tür); Geländer nur an den Seiten
  const stair = new THREE.Group(), nSteps = 7, run = 1.3, LD = 0.8, SW = 0.9, U = 0.53;
  const stepM = std(0x4a4c46, { metalness: 0.7, roughness: 0.6 }), slope = Math.atan2(LAND, run), len = Math.hypot(run, LAND);
  for (let i = 0; i < nSteps; i++) stair.add(box(SW, 0.04, run / nSteps + 0.02, stepM, 0, (i + 1) * (LAND / nSteps) - 0.02, LD + run - (i + 0.5) * (run / nSteps)));
  stair.add(box(SW + 0.2, 0.05, LD, stepM, 0, LAND - 0.025, LD / 2)); // Podest vor der Tür
  [-1, 1].forEach((sd) => {
    const x = sd * (SW / 2 + 0.03);
    const st = box(0.04, 0.18, len + 0.1, M.steelDark, x, LAND / 2 - 0.08, LD + run / 2); st.rotation.x = slope; stair.add(st); // Wange
    const hr = cyl(0.018, 0.018, len + 0.1, M.steelDark, x + sd * 0.03, LAND / 2 + 0.95, LD + run / 2); hr.rotation.x = -Math.atan2(run, LAND); stair.add(hr); // Handlauf
    stair.add(cyl(0.018, 0.018, LD, M.steelDark, x + sd * 0.07, LAND + 0.95, LD / 2).rotateX(Math.PI / 2)); // Geländer am Podest
    [[LD + run, 0], [LD, LAND], [0.05, LAND]].forEach(([z, y0]) => stair.add(cyl(0.012, 0.012, 0.95, M.steelDark, x + sd * (z === LD + run ? 0.03 : 0.07), y0 + 0.47, z)));
    stair.add(cyl(0.03, 0.03, LAND, M.steelDark, sd * (SW / 2 + 0.07), LAND / 2, LD - 0.05)); // Stütze unter dem Podest
  });
  add(place(stair, "n", U, 0, 0));
  // Tür oben auf dem Podest (zum Sicherheitsbereich), Schild
  const uDoor = group(rbox(0.86, 2.0, 0.06, std(0x3d3f3a, { metalness: 0.6, roughness: 0.5 }), 0, 1.0, -0.02, 0.01), plane(0.5, 0.12, lambert(0xffffff, { map: plaqueTex("SICHERHEITSBEREICH", 384, 90, "#2a2119", "#e6c48a", `600 30px ${MONO}`, 2) }), 0, 1.7, 0.012), rbox(0.05, 0.25, 0.06, M.steelDark, 0.32, 0.95, 0.03, 0.01));
  uDoor.add(box(0.06, 2.1, 0.08, M.steelDark, -0.46, 1.05, 0), box(0.06, 2.1, 0.08, M.steelDark, 0.46, 1.05, 0), box(0.98, 0.06, 0.08, M.steelDark, 0, 2.08, 0));
  add(place(uDoor, "n", U, LAND, 0));
  // Klickflächen: schräg über den Stufen + Podest mit Tür
  const sZone = box(SW, 0.5, len + 0.15, ZONE, 0, LAND / 2 + 0.2, LD + run / 2); sZone.rotation.x = slope;
  add(place(hs("k_treppe", group(sZone, box(SW + 0.2, 2.3, LD, ZONE, 0, LAND + 1.0, LD / 2)), { aimLocal: [0, LAND + 1.0, LD / 2] }), "n", U, 0, 0));
  // Wasserstandsmarken (Pegellatte)
  const marks = group(plane(0.3, 1.4, lambert(0xffffff, { map: marksTex() }), 0, 0.7, 0), box(0.34, 1.44, 0.02, ZONE, 0, 0.7, 0.01));
  add(place(hs("wassermarken", marks), "n", 0.075, 0, 0.012));
  // Rohr mit Ritzung „T.+E. – 1999“ (rechts oben)
  const pipe = cyl(0.13, 0.13, 2.0, std(0xffffff, { map: carveTex(), metalness: 0.4, roughness: 0.7 }), 0, 0, 0, 24); pipe.rotation.z = Math.PI / 2;
  const pipeG = group(pipe); [-0.7, 0.2, 0.9].forEach((x) => pipeG.add(box(0.06, 0.4, 0.06, M.steelDark, x, 0.25, -0.1)));
  pipeG.add(box(2.0, 0.34, 0.34, ZONE, 0, 0, 0));
  add(place(hs("rohr", pipeG), "n", 0.82, H - 0.75, 0.25));
  // Wasser (Klickfläche rechts vorn)
  add(place(hs("k_wasser", group(box(1.0, 0.2, 1.2, ZONE, 0, WATER, 0))), "n", 0.72, 0, 1.6)); // rechts neben der Treppe
  // Tropfen
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), std(0x9ab4c8, { roughness: 0.1 })); add(place(drop, "n", 0.9, H - 0.6, 0.6));
  anim((dt) => { drop.position.y -= dt * 3.4; if (drop.position.y < WATER) drop.position.y = H - 0.6; });

  /* ================= OST · Notstromaggregat West ================= */
  const gen = group(rbox(2.5, 0.3, 1.2, M.concrete, 0, 0.15, 0, 0.02)); // Sockel
  const body = group(rbox(2.2, 1.15, 0.95, M.genGreen, 0, 0.88, 0, 0.06), rbox(2.2, 0.16, 0.95, std(0x38463d, { roughness: 0.45 }), 0, 1.4, 0, 0.05),
    plane(0.9, 0.11, lambert(0xffffff, { map: plaqueTex("AGGREGAT WEST", 512, 64, "#9fb3a2", "#38463d", `600 30px ${MONO}`, 6) }), 0, 1.4, 0.478));
  for (let i = 0; i < 9; i++) body.add(rbox(0.11, 0.11, 0.02, M.black, 0.62 + (i % 3) * 0.14, 0.62 + Math.floor(i / 3) * 0.14, 0.48, 0.01)); // Lüftungsgitter
  const exhaust = cyl(0.06, 0.06, 2.1, M.rust, -0.75, 2.4, -0.25); body.add(exhaust);
  gen.add(body);
  let knock = 0; const genGo = pulse(0.5, (k, t) => { knock = Math.sin(t * 70) * 0.006 * (1 - k); });
  add(place(hs("generator", gen, { aimLocal: [0.76, 0.62, 0.49], act: { play: () => { genGo(); snd("drop"); return 500; } } }), "e", 0.47, 0, 0.75));
  // Bedienfeld vorn links: Starter, Zündung, Hahn, Choke
  const ctl = group(rbox(0.92, 0.48, 0.04, std(0x1a1f1b, { roughness: 0.5 }), 0, 0, 0, 0.01));
  const starter = cyl(0.045, 0.045, 0.04, M.red, -0.33, 0.04, 0.04); starter.rotation.x = Math.PI / 2; ctl.add(rbox(0.1, 0.14, 0.03, std(0x7a2620), -0.33, 0.04, 0.025, 0.01), starter);
  const key = group(cyl(0.05, 0.05, 0.02, std(0x2a2e2a, { metalness: 0.5 }), 0, 0, 0).rotateX(Math.PI / 2), box(0.016, 0.06, 0.02, std(0xc9a466, { metalness: 0.8, roughness: 0.3 }), 0, 0.0, 0.02)); key.position.set(-0.11, 0.04, 0.02); ctl.add(key);
  const valve = group(cyl(0.03, 0.03, 0.03, M.steel, 0, 0, 0).rotateX(Math.PI / 2), box(0.16, 0.025, 0.02, M.red, 0, 0, 0.025)); valve.position.set(0.11, 0.04, 0.02); ctl.add(valve);
  const choke = group(cyl(0.008, 0.008, 0.08, M.steel, 0, 0, 0.04).rotateX(Math.PI / 2), new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), std(0xd8d0b8))); choke.children[1].position.z = 0.08; choke.position.set(0.33, 0.04, 0.02); ctl.add(choke);
  ["STARTER", "ZÜNDUNG", "HAHN", "CHOKE"].forEach((t, i) => ctl.add(plane(0.17, 0.05, lambert(0xffffff, { map: keyLabel(t) }), -0.33 + i * 0.22, -0.16, 0.022)));
  const redLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a2a24, toneMapped: false })); redLed.position.set(0.4, 0.2, 0.03); ctl.add(redLed);
  // Bedienelemente selbst betätigen (Generator-Reihenfolge, Prüfung durch die Engine wie im Dialog: jeder Schritt sofort)
  const ctlOn = { starter: 0, zuendung: 0, hahn: 0, choke: 0 }; let gSeq = [], gLock = false, startT = -1;
  const ctlObj = { starter: ctl.children[2], zuendung: key, hahn: valve, choke };
  const ctlZone = (o) => { o.add(box(0.15, 0.17, 0.12, ZONE, 0, 0, 0.03)); return o; };
  const gReset = () => { gSeq = []; Object.keys(ctlOn).forEach((k) => { ctlOn[k] = 0; }); gLock = false; };
  const gPress = (id) => { if (gLock || ctlOn[id] || eng().has("gen_laeuft")) return; ctlOn[id] = 1; gSeq.push(id); if (id === "starter") startT = 0;
    const r = eng().tryLock("generator", gSeq.join(","));
    if (r.ok) setTimeout(() => { ctlOn.choke = 0; snd("valve"); }, 700); else if (!r.partial) { gLock = true; setTimeout(gReset, 900); } };
  const genSpec = { when: (id) => id === "bedienfeld" && !eng().has("gen_laeuft"), cam: [0, 0.04, 0.95], center: [0, 0, 0], fov: 40, exitDelay: 2200,
    hint: "Bedienelemente in der richtigen Reihenfolge betätigen", value: () => gSeq.join(","), enter: gReset,
    parts: () => Object.keys(ctlObj).map((id) => ({ obj: ctlObj[id], name: id, tap: () => gPress(id) })) };
  Object.values(ctlObj).forEach(ctlZone);
  add(place(hs(["bedienfeld_an", "bedienfeld", "bedienfeld_tot"], ctl, { focus: genSpec }), "e", 0.47 - 0.42 / (2 * R), 0.82, 1.24));
  // Messgerät und Kontrollleuchte
  const needle = box(0.006, 0.075, 0.004, std(0xa3302a), 0, 0.035, 0); const needlePv = new THREE.Group(); needlePv.add(needle); needlePv.position.set(0, 0.02, 0.025);
  const gauge = group(cyl(0.11, 0.11, 0.04, M.genGreen, 0, 0, 0, 32).rotateX(Math.PI / 2), plane(0.19, 0.19, new THREE.MeshStandardMaterial({ map: gaugeTex(), transparent: true, roughness: 0.3 }), 0, 0, 0.022), needlePv);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3a2a24, toneMapped: false })); lamp.position.set(0, -0.2, 0.02); gauge.add(lamp);
  let twitch = 0; const gaugeGo = pulse(0.9, (k, t) => { twitch = Math.sin(t * 20) * 0.25 * (1 - k); });
  add(place(hs(["messgeraet2", "messgeraet"], gauge, { act: { play: () => { gaugeGo(); snd("click"); return 600; } } }), "e", 0.47 + 0.55 / (2 * R), 1.12, 1.24));
  const lampL = new THREE.PointLight(0x9fe0b0, 0, 1.8, 2); place(lampL, "e", 0.47 + 0.55 / (2 * R), 0.95, 1.5); add(lampL);
  // Sicherungsfach F3 an der Wand rechts
  const fuseFill = group(rbox(0.06, 0.14, 0.05, std(0xc9a466, { roughness: 0.5 }), 0, 0, 0, 0.02), box(0.065, 0.04, 0.052, std(0xe6dcc3), 0, 0, 0));
  const fach = group(rbox(0.3, 0.44, 0.12, M.steel, 0, 0, 0, 0.015), plane(0.22, 0.06, lambert(0xffffff, { map: plaqueTex("F3 · 30 A", 256, 64, "#2a2119", "#e6c48a", `600 30px ${MONO}`, 2) }), 0, 0.15, 0.062), box(0.12, 0.22, 0.02, M.black, 0, -0.04, 0.055));
  fuseFill.position.set(0, -0.04, 0.07); fach.add(fuseFill);
  // Ersatzsicherung (gewählt) selbst einsetzen: hineindrücken (wischen oder antippen)
  const fuseHand = group(rbox(0.06, 0.14, 0.05, std(0xc9a466, { roughness: 0.5 }), 0, 0, 0, 0.02), box(0.065, 0.04, 0.052, std(0xe6dcc3), 0, 0, 0), box(0.12, 0.2, 0.1, ZONE, 0, 0, 0));
  fuseHand.visible = false; fach.add(fuseHand);
  let fPush = 0, fFired = false;
  const fDone = () => { if (!fFired && fPush >= 1) { fFired = true; snd("lever"); setTimeout(() => { fuseHand.visible = false; eng().hotspot("sicherungsfach"); }, 350); } };
  anim(() => { if (fuseHand.visible) fuseHand.position.set(0, -0.04, 0.07 + (1 - fPush) * 0.22); });
  const fuseSpec = { useItem: "sicherung", when: () => !eng().has("f3_drin"), cam: [0.05, 0.02, 0.62], center: [0, -0.04, 0.1], fov: 40, exitDelay: 1500,
    hint: "Sicherung ins Fach drücken (wischen oder antippen)", value: () => fPush.toFixed(2),
    enter: () => { fPush = 0; fFired = false; fuseHand.visible = true; }, exit: () => { if (!fFired) fuseHand.visible = false; },
    parts: () => [{ obj: fuseHand, name: "sicherung", tap: () => { fPush = Math.min(1, fPush + 0.5); snd("click"); fDone(); }, drag: (dx, dy) => { fPush = Math.min(1, fPush + Math.hypot(dx, dy) * 0.006); fDone(); } }] };
  add(place(hs(["sicherungsfach2", "sicherungsfach"], fach, { focus: fuseSpec }), "e", 0.8, 1.15, 0.06));
  // Startanleitung (laminiert)
  const manual = plane(0.42, 0.62, std(0xffffff, { map: manualTex(), roughness: 0.25 })); manual.rotation.z = -0.025;
  const manG = group(manual); const manA = inner(manG); const manGo = lift(ctx, (k) => { manA.position.set(0, -0.2 * k, 0.5 * k); }, 0.7);
  add(place(hs("anleitung", manG, { act: { play: () => { manGo(); snd("paper"); return 750; } } }), "e", 0.9, 1.9, 0.012));
  let f3 = false, run_ = false;
  state((has) => { f3 = has("f3_drin"); run_ = has("gen_laeuft"); fuseFill.visible = f3; lamp.material.color.setHex(run_ ? 0x9fe0b0 : 0x3a2a24); redLed.material.color.setHex(f3 && !run_ ? 0xd4443a : 0x3a2a24); });
  anim((dt, t) => {
    const target = run_ ? -0.3 + Math.sin(t * 13) * 0.03 + Math.sin(t * 5.3) * 0.02 : -1.08;
    needlePv.rotation.z = lerp(needlePv.rotation.z, target, Math.min(1, dt * 3)) + twitch * 0.1;
    body.position.set((run_ ? (Math.random() - 0.5) * 0.004 : 0) + knock, run_ ? (Math.random() - 0.5) * 0.004 : 0, 0);
    const k = Math.min(1, dt * 10), on = (id) => run_ ? (id === "choke" ? 0 : 1) : ctlOn[id];
    valve.rotation.z = lerp(valve.rotation.z, on("hahn") ? Math.PI / 2 : 0, k); key.rotation.z = lerp(key.rotation.z, on("zuendung") ? -0.8 : 0, k);
    choke.position.z = lerp(choke.position.z, on("choke") ? 0.06 : 0.02, k);
    if (startT >= 0) { startT += dt; if (startT > 0.35) startT = -1; } ctlObj.starter.position.z = startT >= 0 ? 0.025 : 0.04;
    lampL.intensity = run_ ? 0.35 * (0.85 + Math.random() * 0.2) : 0;
  });

  /* ================= SÜD · Hauptverteilung, Wandplan ================= */
  const board = group(rbox(2.7, 2.15, 0.22, std(0x3a3f3a, { metalness: 0.4, roughness: 0.55 }), 0, 1.65, 0.11, 0.02),
    plane(1.6, 0.1, lambert(0xffffff, { map: plaqueTex("HAUPTVERTEILUNG UG", 512, 48, "#b6c0b2", "#2a2d29", `600 26px ${MONO}`, 6) }), 0, 2.57, 0.223));
  [-1.15, 1.15].forEach((x) => board.add(box(0.1, 0.58, 0.1, M.steelDark, x, 0.29, 0.12))); // Füße über dem Wasser
  const display = screenTex();
  const disp = plane(1.1, 0.16, new THREE.MeshBasicMaterial({ map: display.tex, toneMapped: false }), 0, 1.0, 0.224); board.add(disp);
  const levers = [], lamps = [];
  ["A", "B", "C", "D"].forEach((l, i) => {
    const x = -0.9 + i * 0.6;
    board.add(plane(0.26, 0.2, lambert(0xffffff, { map: plaqueTex(l, 128, 96, "#2a2119", "#e6dcc3", `600 56px ${MONO}`, 0) }), x, 2.25, 0.223));
    board.add(rbox(0.08, 0.86, 0.04, M.black, x, 1.6, 0.235, 0.02));
    const lv = new THREE.Group(); lv.position.set(x, 1.6, 0.25);
    lv.add(box(0.05, 0.42, 0.04, std(0x8a8f88, { metalness: 0.7, roughness: 0.4 }), 0, 0.21, 0.03), rbox(0.24, 0.1, 0.1, M.red, 0, 0.42, 0.05, 0.03));
    board.add(lv); levers.push(lv);
    const lp = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3a2a24, toneMapped: false })); lp.position.set(x, 2.06, 0.24); board.add(lp); lamps.push(lp);
  });
  // Hebel selbst umlegen; nach dem vierten prüft die Engine (Rätsel „hebel“), falsch → alle schnappen zurück
  const down = [0, 0, 0, 0]; let hSeq = [], hLock = false;
  levers.forEach((lv) => lv.add(box(0.3, 0.55, 0.16, ZONE, 0, 0.25, 0.05)));
  const hReset = () => { hSeq = []; down.fill(0); hLock = false; };
  const hPull = (i) => { if (hLock || down[i] || eng().has("strom")) return; down[i] = 1; hSeq.push("ABCD"[i]);
    const r = eng().tryLock("hebel", hSeq.join(",")); if (!r.ok && !r.partial) { hLock = true; setTimeout(hReset, 700); } };
  const leverSpec = { when: (id) => id === "schalttafel" && !eng().has("strom"), cam: [0, 1.75, 2.3], center: [0, 1.7, 0.25], fov: 45, exitDelay: 2200,
    hint: "Hebel in der richtigen Reihenfolge umlegen", value: () => hSeq.join(","), enter: () => { if (!hLock) hReset(); },
    parts: () => levers.map((lv, i) => ({ obj: lv, name: "hebel" + "ABCD"[i], tap: () => hPull(i), drag: (dx, dy) => { if (dy > 4) hPull(i); } })) };
  add(place(hs(["schalttafel_an", "schalttafel", "schalttafel_tot"], board, { focus: leverSpec }), "s", 0.47, 0, 0.02));
  const plan = plane(0.52, 0.69, std(0xffffff, { map: planTex(), roughness: 0.2 })); plan.rotation.z = 0.02;
  const planG = group(plan); const planA = inner(planG); const planGo = lift(ctx, (k) => { planA.position.set(0, -0.25 * k, 0.6 * k); }, 0.7);
  add(place(hs("wandplan", planG, { act: { play: () => { planGo(); snd("paper"); return 750; } } }), "s", 0.84, 1.95, 0.012));
  // schwaches Arbeitslicht an der Schalttafel, sobald der Generator läuft (damit alle vier Hebel zu sehen sind)
  const pilot = new THREE.PointLight(0xffd8a0, 0, 3.2, 2); pilot.position.set(0, 2.5, 0.9); board.add(pilot);
  let strom = false;
  state((has) => { strom = has("strom"); pilot.intensity = has("gen_laeuft") && !strom ? 1.4 : 0; lamps.forEach((l) => l.material.color.setHex(strom ? 0x9fe0b0 : 0x3a2a24)); display.paint(strom); });
  anim((dt) => { levers.forEach((lv, i) => { lv.rotation.x = lerp(lv.rotation.x, strom || down[i] ? Math.PI * 0.9 : 0, Math.min(1, dt * (hLock ? 12 : 6))); }); });

  /* ================= WEST · alte Wäscherei: Mangel, Säcke, Wäscheschrank, Stahltür ================= */
  add(place(plane(1.2, 0.18, new THREE.MeshStandardMaterial({ map: plaqueTex("WÄSCHEREI", 512, 76, "#7a786e", "#3a3a35", `600 40px ${MONO}`, 14), roughness: 0.9 })), "w", 0.28, 2.75, 0.012));
  const mangel = group(rbox(1.4, 0.1, 0.6, M.steelDark, 0, 0.92, 0, 0.02), cyl(0.18, 0.18, 1.25, std(0x55574f, { metalness: 0.5, roughness: 0.6 }), 0, 1.12, 0.05).rotateZ(Math.PI / 2), rbox(1.3, 0.08, 0.5, M.steelDark, 0, 1.36, -0.05, 0.02));
  [[-0.62, -0.25], [0.62, -0.25], [-0.62, 0.25], [0.62, 0.25]].forEach(([x, z]) => mangel.add(box(0.07, 0.88, 0.07, M.steelDark, x, 0.44, z)));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 24), M.steel); wheel.rotation.y = Math.PI / 2; wheel.position.set(0.8, 1.12, 0.05); mangel.add(wheel);
  const mgGo = pulse(1.2, (k) => { wheel.rotation.x = Math.sin(k * Math.PI) * 0.35; mangel.children[1].rotation.x = Math.sin(k * Math.PI) * 0.05; });
  add(place(hs("mangel", mangel, { aimLocal: [0, 1.12, 0.2], act: { play: () => { mgGo(); snd("creak"); return 900; } } }), "w", 0.26, 0, 0.55));
  [[0.08, 0.3, 0.32], [0.14, 0.42, 0.26], [0.05, 0.62, 0.22]].forEach(([u, d, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), M.cloth); s.scale.set(1.2, 0.7, 1); add(place(s, "w", u, r * 0.5, d)); });
  // Hinter dem Schrank: Stahltür ohne Klinke, Magnetschloss; dahinter ein schmaler Gang bergauf
  const gang = group(box(0.9, 0.04, 3.4, M.ceil, 0, 2.3, -1.7), box(0.04, 2.6, 3.4, M.wall, -0.45, 1.3, -1.7), box(0.04, 2.6, 3.4, M.wall, 0.45, 1.3, -1.7), box(0.9, 2.6, 0.04, basic(0x020202), 0, 1.3, -3.4));
  const ramp = box(0.9, 0.04, 3.4, M.concrete, 0, 0.25, -1.7); ramp.rotation.x = -0.14; gang.add(ramp);
  const gangL = new THREE.PointLight(0xbfd0ff, 0, 3, 2); gangL.position.set(0, 1.6, -2.6); gang.add(gangL);
  const sPv = new THREE.Group(); sPv.position.set(-0.44, 0, -0.02);
  const sDoor = group(rbox(0.88, 2.12, 0.06, std(0x4a4c46, { metalness: 0.6, roughness: 0.5 }), 0.44, 1.06, 0, 0.01), plane(0.56, 0.09, lambert(0xffffff, { map: plaqueTex("W-GANG · NUR NOTFALL", 512, 80, "#9aa39a", "#2a2b28", `600 34px ${MONO}`, 3) }), 0.44, 1.75, 0.032));
  sPv.add(sDoor);
  const mag = group(rbox(0.07, 0.24, 0.05, M.steelDark, 0, 0, 0, 0.01)); const magLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0x5a2a24, toneMapped: false })); magLed.position.set(0, 0.07, 0.03); mag.add(magLed); mag.position.set(0.5, 1.1, 0.03);
  add(place(group(gang, sPv, mag, box(0.06, 2.2, 0.08, M.steelDark, -0.47, 1.1, 0), box(0.06, 2.2, 0.08, M.steelDark, 0.47, 1.1, 0), box(1.0, 0.06, 0.08, M.steelDark, 0, 2.18, 0)), "w", 0.74, 0, 0));
  let sRat = -1; anim((dt) => { if (sRat < 0) return; sRat += dt; sDoor.position.z = Math.sin(sRat * 60) * 0.005 * (1 - sRat / 0.5); if (sRat > 0.5) { sRat = -1; sDoor.position.z = 0; } });
  add(place(hs(["durchgang", "stahltuer_auf", "stahltuer"], group(box(0.9, 2.15, 0.3, ZONE, 0, 1.08, 0)), { act: { when: (id) => id === "stahltuer", play: () => { sRat = 0; snd("click"); return 550; } } }), "w", 0.74, 0, 0));
  // Wäscheschrank, mit vier Winkeln an die Wand geschraubt; rutscht nach dem Schraubendreher zur Seite
  const cab = group(rbox(1.4, 2.5, 0.6, M.wood, 0, 1.25, 0, 0.02), rbox(1.48, 0.08, 0.66, M.wood, 0, 2.52, 0.01, 0.015));
  [-0.34, 0.34].forEach((x) => { cab.add(panel(0.6, 2.3, M.wood, x, 1.25, 0.305, 0.06, 0.01)); cab.add(box(0.03, 0.22, 0.03, std(0x806040, { metalness: 0.6, roughness: 0.4 }), x > 0 ? 0.06 : -0.06, 1.25, 0.34)); });
  const brackets = group(), screws = [];
  [[-0.72, 2.3], [0.72, 2.3], [-0.72, 0.25], [0.72, 0.25]].forEach(([x, y]) => { brackets.add(box(0.08, 0.1, 0.1, std(0x5a5c55, { metalness: 0.7, roughness: 0.5 }), x, y, 0.05));
    const sc = group(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.brass), box(0.006, 0.034, 0.006, M.black, 0, 0, 0.02), box(0.42, 0.42, 0.1, ZONE, 0, 0, 0)); // große Greiffläche: Drehgeste darf neben dem Kopf beginnen
    sc.position.set(x + (x > 0 ? 0.03 : -0.03), y, 0.1); brackets.add(sc); screws.push({ g: sc, out: 0, turn: 0 }); });
  cab.add(brackets);
  // Mit dem Schraubendreher (gewählt) die vier Schrauben herausdrehen: gegen den Uhrzeigersinn drehen oder je zweimal antippen
  let scFired = false; const scTw = screws.map((s) => twister(ctx, () => s.g));
  const scDone = () => { if (!scFired && screws.every((s) => s.out >= 1)) { scFired = true; snd("screws"); setTimeout(() => eng().hotspot("waescheschrank"), 500); } };
  const scStep = (s, a) => { s.turn += a; s.out = Math.min(1, s.turn / (Math.PI * 2)); if (s.out >= 1) snd("click"); scDone(); };
  anim((dt) => { screws.forEach((s) => { s.g.rotation.z = s.turn; s.g.position.z = 0.1 + s.out * 0.05; s.g.visible = s.out < 1 || s.g.position.z < 0.14; }); });
  const cabSpec = { useItem: "schraubendreher", when: () => !eng().has("schrank_weg"), cam: [0, 1.35, 2.9], center: [0, 1.3, 0.3], fov: 66, exitDelay: 1800,
    hint: "Vier Schrauben herausdrehen (gegen den Uhrzeigersinn oder antippen)", value: () => screws.filter((s) => s.out >= 1).length + "/4",
    enter: () => { scFired = false; screws.forEach((s) => { s.out = 0; s.turn = 0; }); },
    parts: () => screws.map((s, i) => ({ obj: s.g, name: "schraube" + i, tap: () => { scStep(s, Math.PI + 0.01); snd("key"); }, drag: (dx, dy, pt) => scStep(s, Math.max(0, -scTw[i].delta(pt))), release: () => scTw[i].reset() })) };
  add(place(hs(["schrank_weg", "waescheschrank"], cab, { focus: cabSpec }), "w", 0.73, 0, 0.32));
  const cabFrom = cab.position.clone();
  const tmp = new THREE.Object3D(); place(tmp, "w", 0.515, 0, 0.32); const cabAway = tmp.position.clone();
  let weg = false, offen = false;
  state((has) => { weg = has("schrank_weg"); offen = has("tuer_offen"); brackets.visible = !weg; magLed.material.color.setHex(has("strom") ? 0x9fe0b0 : 0x5a2a24); gangL.intensity = offen ? 1.2 : 0; });
  anim((dt) => { cab.position.lerp(weg ? cabAway : cabFrom, Math.min(1, dt * 1.5)); sPv.rotation.y = lerp(sPv.rotation.y, offen ? 1.3 : 0, Math.min(1, dt * 2)); });
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.22 };
});

/* Anzeige „AUSGANG W2“ (0 V / 230 V) */
function screenTex() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 72; const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, paint(on) { g.fillStyle = "#1a1d1a"; g.fillRect(0, 0, 512, 72); g.fillStyle = on ? "#9fe0b0" : "#5f6a5f"; g.font = `600 34px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(on ? "AUSGANG W2 · 230 V" : "AUSGANG W2 · 0 V", 256, 38); t.needsUpdate = true; } };
}
ready();
