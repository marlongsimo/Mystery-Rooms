/*
 * STATION 3 – DAS GEPÄCKLAGER in 3D
 * Aufbau nach den 2D-Ansichten (js/rooms/03-gepaecklager.js): Nord Treppe · Ost Regale · Süd Ausgabe · West Gitterkäfig.
 * Keller, 5,6 × 5,6 m, 3 m hoch, nass; Licht nur von der flackernden Notbeleuchtung und einer Käfiglampe.
 * Zustände: koffer_da (Klappe hoch, Koffer Nr. 6 mit Schal, Notizbuch, Käfigschlüssel) · taken_kaefigschluessel ·
 * kaefig_offen · truhe_offen · koffer_gerutscht (Ereignis: Koffer 4 rutscht vom Regal, Wasserstandsmarke wird sichtbar) · archiv_offen.
 * Bildhinweise: Messinganhänger 2 · 9 · 4 (Regal) und 6 (Ausgabe) mit Springer, Notenblatt, Kompass · Truhenschloss 0000 ·
 * „ARCHIV“ auf der Milchglastür · „← REZEPTION“ · „AUSGABE NUR GEGEN GEPÄCKSCHEIN“ · „WERTGEPÄCK“ ·
 * Wasserstandsmarke „14.10.2009 · 23:10 – WASSERSTAND KNIEHÖHE“ · Wasserrand auf Kniehöhe rundum.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, phong, basic, ZONE, box, cyl, plane, group } from "./core.js?v=3";
import { textTex, woodTex, plaqueTex, shell } from "./kit.js?v=2";
import { std, rbox, panel, leatherMat, brassMat, woodMat } from "./hd.js?v=2";
import { tag as pbr } from "./gfx.js?v=1"; // „tag“ heißen hier die Messinganhänger der Koffer

const R = 2.8, H = 3.0;

/* ---------- Texturen ---------- */
const concrete = (base = "#3a3a36", stain = true) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.22; for (let i = 0; i < 1600; i++) { g.fillStyle = Math.random() > 0.5 ? "#1a1a18" : "#5a5a54"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 0.12; for (let i = 0; i < 14; i++) { g.fillStyle = "#000"; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 6 + Math.random() * 18, 0, 0, Math.PI * 2); g.fill(); }
  if (stain) { g.globalAlpha = 0.5; const gr = g.createLinearGradient(0, h * 0.78, 0, h); gr.addColorStop(0, "rgba(10,10,8,0)"); gr.addColorStop(0.15, "rgba(10,10,8,.65)"); gr.addColorStop(1, "rgba(20,18,14,.4)"); g.fillStyle = gr; g.fillRect(0, h * 0.78, w, h * 0.22); }
}, { repeat: [1, 1] });
// Wand: Kachel 1 m breit, aber über die volle Höhe (Wasserrand auf Kniehöhe ≈ 0,5 m)
const wallTex = () => { const t = canvasTex(256, 768, (g, w, h) => {
  g.fillStyle = "#3d3c37"; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.2; for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() > 0.5 ? "#1e1d1a" : "#5c5a52"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.globalAlpha = 1; const y = h * (1 - 0.5 / 3.0); // Kniehöhe
  const gr = g.createLinearGradient(0, y - 18, 0, h); gr.addColorStop(0, "rgba(16,14,10,0)"); gr.addColorStop(0.08, "rgba(16,14,10,.75)"); gr.addColorStop(0.12, "rgba(30,26,20,.45)"); gr.addColorStop(1, "rgba(18,16,12,.55)"); g.fillStyle = gr; g.fillRect(0, y - 18, w, h - y + 18);
  g.strokeStyle = "rgba(10,9,7,.8)"; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.09) * 3); g.stroke();
}); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1 / 3.0); return t; };
const tagTex = (n) => textTex(96, 128, "#b08c52", (g) => { g.strokeStyle = "#6e5632"; g.lineWidth = 6; g.strokeRect(3, 3, 90, 122); g.fillStyle = "#1a120c"; g.beginPath(); g.arc(48, 18, 7, 0, Math.PI * 2); g.fill(); g.font = "700 64px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 48, 76); });
const sheetMusic = () => textTex(200, 140, "#efe6cf", (g) => {
  g.strokeStyle = "#3a332a"; g.lineWidth = 1.5; for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) { const y = 22 + s * 40 + l * 5; g.beginPath(); g.moveTo(10, y); g.lineTo(190, y); g.stroke(); }
  g.fillStyle = "#2a2119"; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(16 + i * 7, 24 + (i % 3) * 40 + ((i * 7) % 5) * 2.5, 2.6, 2, -0.4, 0, Math.PI * 2); g.fill(); }
  g.font = "italic 11px Georgia, serif"; g.fillText("Nocturne", 140, 12);
});
const frostTex = () => textTex(256, 384, "#c8c0a8", (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 220); gr.addColorStop(0, "#e2d8bc"); gr.addColorStop(1, "#8a8270"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#5a5244"; g.font = "500 34px DM Mono, monospace"; g.textAlign = "center"; if ("letterSpacing" in g) g.letterSpacing = "10px"; g.fillText("ARCHIV", w / 2 + 5, h / 2);
});
const markTex = () => textTex(512, 120, null, (g) => {
  g.fillStyle = "#e8c22a"; g.fillRect(0, 70, 512, 14);
  g.fillStyle = "#e8c22a"; g.font = "600 30px DM Mono, monospace"; g.fillText("14.10.2009 · 23:10", 6, 40);
  g.font = "600 22px DM Mono, monospace"; g.fillText("WASSERSTAND KNIEHÖHE", 6, 112);
});
const lockTex = () => textTex(256, 112, "#120e0b", (g) => {
  g.strokeStyle = "#b69a6d"; g.lineWidth = 5; g.strokeRect(4, 4, 248, 104);
  g.font = "600 52px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < 4; i++) { g.fillStyle = "#2a2016"; g.fillRect(22 + i * 56, 18, 46, 76); g.fillStyle = "#d4bc90"; g.fillText("0", 45 + i * 56, 58); }
});
const ledgerTex = () => textTex(300, 160, "#d8cdb6", (g) => {
  g.strokeStyle = "#7a6e58"; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const y = 20 + i * 17; g.beginPath(); g.moveTo(12, y); g.lineTo(288, y); g.stroke(); }
  g.fillStyle = "rgba(60,70,90,.35)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(40 + Math.random() * 220, 30 + Math.random() * 110, 30, 14, 0, 0, Math.PI * 2); g.fill(); } // verlaufene Tinte
  g.fillStyle = "#3a3226"; for (let i = 0; i < 7; i++) g.fillRect(16, 26 + i * 17, 40 + Math.random() * 180, 3);
});

defineRoom("gepaecklager", (ctx) => {
  const { add, hs, state, anim, lerp } = ctx;
  const M = {
    // HD: rauer Beton mit Flutrand, nasser glänzender Boden, Stahl mit Rost, Holz mit Maserung, Messing
    wall: pbr(lambert(0xffffff, { map: wallTex() }), { roughness: 0.92, normal: 1.6 }), floor: pbr(lambert(0xffffff, { map: concrete("#2c2c29", false) }), { roughness: 0.3, clearcoat: 0.6, normal: 1.4, envMapIntensity: 0.6 }),
    ceil: pbr(lambert(0x1a1a18), { roughness: 0.95 }), trim: std(0x222220, { roughness: 0.8 }), metal: std(0x4a4c4e, { metalness: 0.75, roughness: 0.45 }), rust: std(0x5a3e2a, { metalness: 0.45, roughness: 0.8 }),
    wood: woodMat("#3a2a1c", "#22170e"), brass: brassMat(), brassDark: brassMat(0x6e5632, 0.45), black: std(0x0f0f0e, { roughness: 0.6 }),
  };
  if (M.floor.map) M.floor.map.repeat.set(2 * R, 2 * R);
  const { place } = shell(ctx, { R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim, holes: { n: [{ x: 0, y: 0, w: 1.7, h: 2.8 }] } });
  // Pfützen (glänzend)
  [[0.6, 0.9, 0.9], [-1.1, -0.4, 0.6], [1.6, -1.4, 0.7]].forEach(([x, z, r]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshStandardMaterial({ color: 0x0c1014, roughness: 0.03, metalness: 0.4, transparent: true, opacity: 0.85, envMapIntensity: 1.2 })); p.rotation.x = -Math.PI / 2; p.scale.y = 0.6; p.position.set(x, 0.004, z); add(p); });
  // Rohre unter der Decke
  [[-0.9, 0.09], [-0.55, 0.06]].forEach(([z, r]) => { const p = cyl(r, r, 2 * R, M.rust, 0, H - 0.25 - r, z); p.rotation.z = Math.PI / 2; add(p); });
  const pipeE = cyl(0.05, 0.05, 2 * R, M.rust, R - 0.2, H - 0.22, 0); pipeE.rotation.x = Math.PI / 2; add(pipeE);

  /* ================= NORD · Treppe zur Rezeption, oben die Archivtür ================= */
  // Treppenschacht hinter der Wandöffnung: 9 Stufen nach oben, Absatz, Milchglastür ARCHIV
  const well = group(box(1.7, 0.05, 3.4, M.ceil, 0, 3.6, -1.7), box(0.05, 3.6, 3.4, M.wall, -0.85, 1.8, -1.7), box(0.05, 3.6, 3.4, M.wall, 0.85, 1.8, -1.7));
  const steps = new THREE.Group();
  for (let i = 0; i < 9; i++) { steps.add(box(1.6, 0.06, 0.3, lambert(0x4a463e), 0, 0.2 * (i + 1) - 0.03, -0.15 - i * 0.3)); steps.add(box(1.6, 0.2, 0.03, lambert(0x2e2c28), 0, 0.2 * i + 0.1, -0.015 - i * 0.3)); }
  steps.add(box(1.6, 0.06, 0.9, lambert(0x4a463e), 0, 1.8 - 0.03, -3.15)); // Absatz
  const railL = box(0.04, 0.04, 2.9, M.rust, -0.72, 1.4, -1.35); railL.rotation.x = Math.atan2(1.8, 2.7); steps.add(railL);
  const railR = railL.clone(); railR.position.x = 0.72; steps.add(railR);
  // Milchglastür oben (öffnet nach dem Archivschlüssel)
  const doorPv = new THREE.Group(); doorPv.position.set(-0.45, 1.8, -3.55);
  const aDoor = group(box(0.9, 2.0, 0.05, lambert(0x3a3026), 0.45, 1.0, 0), plane(0.62, 0.9, lambert(0xffffff, { map: frostTex(), emissive: 0x2a2416 }), 0.45, 1.35, 0.03));
  const handle = box(0.12, 0.03, 0.04, M.brass, 0.8, 0.95, 0.05); aDoor.add(handle);
  doorPv.add(aDoor);
  const behind = box(0.9, 2.0, 0.05, basic(0x050505), 0, 2.8, -3.75);
  const doorLamp = new THREE.PointLight(0xffd6a0, 3.2, 0, 2); doorLamp.position.set(0, 3.3, -3.2);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), basic(0xffe2b0)); lampBulb.position.set(0, 3.4, -3.3);
  const stair = group(well, steps, doorPv, behind, doorLamp, lampBulb);
  add(place(stair, "n", 0.5, 0, 0));
  // Klickflächen: Treppe (zurück in die Rezeption) und Tür oben
  const stairZone = box(1.6, 1.0, 1.4, ZONE, 0, 0.5, -0.5);
  add(place(hs("treppe", group(stairZone)), "n", 0.5, 0, 0));
  const doorZone = box(0.95, 2.05, 0.2, ZONE, 0, 2.8, -3.5);
  add(place(hs(["archivtuer_offen", "archivtuer"], group(doorZone)), "n", 0.5, 0, 0));
  let aOpen = false; state((has) => { aOpen = has("archiv_offen"); });
  anim((dt) => { doorPv.rotation.y = lerp(doorPv.rotation.y, aOpen ? 1.5 : 0, Math.min(1, dt * 3)); });
  // Schild „← REZEPTION“ links an der Wand
  add(place(plane(0.5, 0.11, lambert(0xffffff, { map: plaqueTex("← REZEPTION", 384, 84, "#2a2826", "#c8c0a8", "500 34px DM Mono, monospace", 4) })), "n", 0.25, 1.95, 0.01));
  // Notbeleuchtung (flackert) rechts neben der Treppe
  const emer = group(box(0.3, 0.14, 0.08, lambert(0x2a2a28)), plane(0.24, 0.08, basic(0xfff0c0), 0, 0, 0.041));
  add(place(hs("notlicht", emer), "n", 0.77, 2.3, 0.04));
  const emL = new THREE.PointLight(0xffe0a8, 5, 0, 2); place(emL, "n", 0.77, 2.2, 0.4); add(emL);
  let flick = 1; anim((dt, t) => { if (Math.random() < 0.035) flick = Math.random() < 0.5 ? 0.15 : 1; flick = lerp(flick, 1, dt * 2); emL.intensity = 5 * flick; emer.children[1].material.color.setScalar(0.3 + 0.7 * flick); });
  // Wasserflecken (Wasserrand auf Kniehöhe) – Klickfläche unten links
  add(place(hs("wasserflecken", group(box(1.3, 0.5, 0.05, ZONE, 0, 0.35, 0.03))), "n", 0.14, 0, 0.0));

  /* ================= OST · Regale mit Koffern ================= */
  const shelf = new THREE.Group();
  [[-1.9], [0], [1.9]].forEach(([x]) => shelf.add(box(0.06, 2.4, 0.06, M.metal, x, 1.2, 0.0), box(0.06, 2.4, 0.06, M.metal, x, 1.2, 0.55)));
  [0.35, 1.15, 1.95].forEach((y) => shelf.add(box(3.9, 0.04, 0.6, M.metal, 0, y, 0.28)));
  add(place(shelf, "e", 0.5, 0, 0.05));
  // Lederkoffer: runde Kanten, zwei Riemen, Messingecken, Griff mit Bügel
  const suitcase = (w, h, d, color) => {
    const s = group(rbox(w, h, d, leatherMat(color), 0, 0, 0, 0.035));
    const strap = leatherMat(0x2a2016);
    [-w / 2 + 0.08, w / 2 - 0.08].forEach((x) => s.add(rbox(0.045, h + 0.008, d + 0.008, strap, x, 0, 0, 0.01), rbox(0.05, 0.035, 0.012, M.brass, x, 0.0, d / 2 + 0.008, 0.004)));
    [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => s.add(rbox(0.05, 0.05, d + 0.012, M.brass, sx * (w / 2 - 0.02), sy * (h / 2 - 0.02), 0, 0.012))));
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), leatherMat(0x1a120c)); hd.position.y = h / 2 + 0.005; s.add(hd, box(w * 0.3, 0.02, 0.04, M.brassDark, 0, h / 2 + 0.005, 0));
    return s;
  };
  const tag = (n) => { const t = group(cyl(0.004, 0.004, 0.08, M.black, 0, 0.04, 0), plane(0.075, 0.1, lambert(0xffffff, { map: tagTex(n) }), 0, -0.04, 0.003)); return t; };
  // Koffer 2: braunes Leder, Springerfigur
  const k2 = suitcase(0.62, 0.36, 0.42, 0x5a3a22);
  const knight = group(cyl(0.035, 0.045, 0.03, lambert(0x1a1612), 0, 0.2, 0), box(0.04, 0.09, 0.07, lambert(0x1a1612), 0, 0.26, 0.0), box(0.035, 0.05, 0.08, lambert(0x1a1612), 0, 0.31, 0.02));
  k2.add(knight); const t2 = tag(2); t2.position.set(0.24, 0.0, 0.215); k2.add(t2);
  add(place(hs("koffer2", k2), "e", 0.27, 1.17 + 0.18, 0.33));
  // Koffer 9: grün, Notenblatt unter dem Riemen
  const k9 = suitcase(0.62, 0.36, 0.42, 0x2a3e34);
  const notes = plane(0.24, 0.17, lambert(0xffffff, { map: sheetMusic() })); notes.rotation.x = -Math.PI / 2; notes.position.set(0, 0.182, 0); k9.add(notes);
  const t9 = tag(9); t9.position.set(0.24, 0.0, 0.215); k9.add(t9);
  add(place(hs("koffer9", k9), "e", 0.5, 1.17 + 0.18, 0.33));
  // Koffer 4: schwarz, Kompass am Griff – rutscht beim Ereignis vom Regal
  const k4 = suitcase(0.62, 0.34, 0.42, 0x141414);
  const comp = group(cyl(0.05, 0.05, 0.015, M.brass), plane(0.08, 0.08, lambert(0xd8cfb8)));
  comp.rotation.x = Math.PI / 2; comp.children[1].rotation.x = -Math.PI / 2; comp.children[1].position.y = 0.009; comp.position.set(-0.15, 0.0, 0.22); k4.add(comp);
  const t4 = tag(4); t4.position.set(0.24, 0.0, 0.215); k4.add(t4);
  const k4Holder = group(k4); add(place(hs(["koffer4_boden", "koffer4"], k4Holder), "e", 0.73, 0, 0.33));
  const onShelf = new THREE.Vector3(0, 0.37 + 0.17, 0), onFloor = new THREE.Vector3(-0.05, 0.17, 0.75);
  k4.position.copy(onShelf);
  let slid = false; state((has) => { slid = has("koffer_gerutscht"); });
  anim((dt) => { const k = Math.min(1, dt * 6); k4.position.lerp(slid ? onFloor : onShelf, k); k4.rotation.z = lerp(k4.rotation.z, slid ? 0.35 : 0, k); k4.rotation.y = lerp(k4.rotation.y, slid ? -0.3 : 0, k); });
  // Wasserstandsmarke hinter Koffer 4 (an der Wand, erst sichtbar, wenn er gerutscht ist)
  const mark = plane(0.7, 0.17, new THREE.MeshLambertMaterial({ map: markTex(), transparent: true }));
  add(place(hs("wassermarke", group(mark), { hideWhenHidden: true }), "e", 0.73, 0.5, 0.012));
  // Eimer unter dem tropfenden Rohr
  const bucket = group(cyl(0.18, 0.14, 0.34, std(0x5a5c5e, { metalness: 0.7, roughness: 0.4 }), 0, 0.17, 0), new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), new THREE.MeshStandardMaterial({ color: 0x10161c, roughness: 0.03, metalness: 0.4 })));
  bucket.children[1].rotation.x = -Math.PI / 2; bucket.children[1].position.y = 0.32;
  add(place(hs("eimer", bucket), "e", 0.9, 0, 0.45));
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), phong(0x9ab4c8, { shininess: 120 })); add(place(drop, "e", 0.9, H - 0.3, 0.45));
  anim((dt) => { drop.position.y -= dt * 3.2; if (drop.position.y < 0.34) drop.position.y = H - 0.3; });

  /* ================= SÜD · Ausgabe ================= */
  const counter = group(rbox(3.4, 1.0, 0.7, M.wood, 0, 0.5, 0, 0.015), rbox(3.5, 0.05, 0.8, woodMat("#4a3622", "#2a1c10"), 0, 1.025, 0.02, 0.012));
  [-1.1, 0, 1.1].forEach((x) => counter.add(panel(0.9, 0.7, M.wood, x, 0.5, 0.355, 0.05, 0.01))); // Kassettenfront
  add(place(counter, "s", 0.5, 0, 0.75));
  // Ausgabefenster in der Wand hinter dem Tresen: Stahlklappe, darunter Schlitz; dahinter die Kammer mit Koffer Nr. 6
  const hatchFrame = group(box(1.2, 0.08, 0.1, M.metal, 0, 1.97, 0.05), box(0.08, 0.95, 0.1, M.metal, -0.56, 1.5, 0.05), box(0.08, 0.95, 0.1, M.metal, 0.56, 1.5, 0.05), box(1.2, 0.04, 0.12, M.metal, 0, 1.03, 0.05));
  const slot = box(0.3, 0.015, 0.02, M.black, 0, 1.08, 0.11); hatchFrame.add(slot);
  const flapPv = new THREE.Group(); flapPv.position.set(0, 1.95, 0.08);
  const flap = rbox(1.04, 0.86, 0.03, std(0x585a5c, { metalness: 0.7, roughness: 0.5 }), 0, -0.43, 0, 0.008);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), M.metal); r.position.set(-0.45 + i * 0.3, -0.1 - j * 0.33, 0.02); flapPv.add(r); }
  flapPv.add(flap);
  const sign = plane(1.1, 0.1, lambert(0xffffff, { map: plaqueTex("AUSGABE NUR GEGEN GEPÄCKSCHEIN", 768, 70, "#2a2826", "#c8c0a8", "500 30px DM Mono, monospace", 3) }), 0, 2.1, 0.02);
  const chamber = group(box(1.04, 0.05, 0.6, M.wood, 0, 1.04, -0.3), box(1.04, 0.9, 0.04, basic(0x0a0a0a), 0, 1.5, -0.6));
  const hatch = group(hatchFrame, flapPv, sign, chamber);
  add(place(hs("klappe", hatch), "s", 0.5, 0, 0.02));
  // Koffer Nr. 6 (Mara Vale), blauer Schal, rotes Notizbuch, Käfigschlüssel
  const k6 = suitcase(0.7, 0.3, 0.45, 0x5a3a22);
  const scarf = box(0.5, 0.05, 0.3, lambert(0x2a4a8a), 0, 0.17, 0); k6.add(scarf);
  const t6 = tag(6); t6.position.set(0.28, 0.0, 0.23); k6.add(t6);
  const k6Holder = group(k6); k6.position.set(0, 1.04 + 0.15, -0.25);
  add(place(hs("koffer6", k6Holder, { hideWhenHidden: true }), "s", 0.5, 0, 0.02));
  const book = box(0.12, 0.025, 0.17, lambert(0x8a1e18), 0, 0, 0);
  const bookG = group(book, box(0.16, 0.06, 0.2, ZONE, 0, 0.02, 0));
  add(place(hs("notizbuch", bookG, { hideWhenHidden: true }), "s", 0.43, 1.06, 0.95));
  const ckey = group(new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 8, 14), M.brass), box(0.09, 0.012, 0.012, M.brass, 0.06, 0, 0), box(0.012, 0.025, 0.012, M.brass, 0.1, -0.012, 0));
  ckey.rotation.x = -Math.PI / 2; ckey.position.y = 0.008;
  const ckeyG = group(ckey, box(0.16, 0.05, 0.12, ZONE, 0.04, 0.02, 0));
  add(place(hs("kaefigschluessel", ckeyG, { hideWhenHidden: true }), "s", 0.57, 1.05, 0.95));
  let kDa = false; state((has) => { kDa = has("koffer_da"); });
  anim((dt) => { const k = Math.min(1, dt * 2.5); flapPv.rotation.x = lerp(flapPv.rotation.x, kDa ? -1.45 : 0, k); k6.position.z = lerp(k6.position.z, kDa ? 0.45 : -0.25, k); });
  // Tischklingel, Gepäckverzeichnis
  const bell = group(cyl(0.07, 0.08, 0.02, M.brassDark, 0, 0.01, 0), new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.brass));
  bell.children[1].position.y = 0.02;
  add(place(hs("klingel3", bell), "s", 0.25, 1.05, 0.9));
  const ledger = plane(0.42, 0.24, lambert(0xffffff, { map: ledgerTex() })); ledger.rotation.set(-Math.PI / 2, 0, 0.08);
  add(place(hs("verzeichnis", group(ledger, box(0.44, 0.04, 0.26, ZONE, 0, 0.02, 0))), "s", 0.73, 1.056, 0.9));
  // Papierkorb mit Streifen
  const bin = group(cyl(0.17, 0.13, 0.42, lambert(0x2a2a28, { side: THREE.DoubleSide }), 0, 0.21, 0));
  [0.05, -0.04, 0.02].forEach((x, i) => { const s = box(0.2, 0.004, 0.03, lambert(0xe2d8c0), x, 0.43 + i * 0.006, (i - 1) * 0.04); s.rotation.y = i * 0.6; bin.add(s); });
  add(place(hs("papierkorb", bin), "s", 0.82, 0, 0.4));
  // Hängelampe über dem Tresen
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), basic(0xffe6b8)); add(place(bulb, "s", 0.5, 2.55, 1.0));
  add(place(cyl(0.005, 0.005, 0.4, M.black, 0, 0, 0), "s", 0.5, 2.8, 1.0));
  const counterL = new THREE.PointLight(0xffd4a0, 4.5, 0, 2); place(counterL, "s", 0.5, 2.4, 1.0); add(counterL);

  /* ================= WEST · Gitterkäfig mit Truhe ================= */
  const cage = new THREE.Group(), barMat = std(0x3a3c3e, { metalness: 0.75, roughness: 0.42 });
  const cx0 = -1.35, cx1 = 1.5, depth = 1.15; // links Platz für den Papierkorb in der Südwest-Ecke
  for (let x = cx0; x <= cx1 + 0.001; x += 0.16) { if (x > -0.42 && x < 0.42) continue; cage.add(cyl(0.012, 0.012, 2.5, barMat, x, 1.25, depth)); }
  for (let z = 0.16; z < depth; z += 0.16) { cage.add(cyl(0.012, 0.012, 2.5, barMat, cx0, 1.25, z), cyl(0.012, 0.012, 2.5, barMat, cx1, 1.25, z)); }
  [0.05, 2.5].forEach((y) => { const b = box(cx1 - cx0, 0.04, 0.04, barMat, (cx0 + cx1) / 2, y, depth); cage.add(b); });
  cage.add(plane(0.9, 0.14, lambert(0xffffff, { map: plaqueTex("WERTGEPÄCK", 512, 80, "#2a2826", "#c8c0a8", "500 40px DM Mono, monospace", 10) }), 0.3, 2.3, depth + 0.02));
  // Käfigtür (Gitter, Kastenschloss) – schwingt nach dem Käfigschlüssel auf
  const gatePv = new THREE.Group(); gatePv.position.set(-0.42, 0, depth);
  const gate = new THREE.Group(); for (let x = 0.08; x < 0.84; x += 0.16) gate.add(cyl(0.012, 0.012, 2.4, barMat, x, 1.25, 0));
  gate.add(box(0.84, 0.04, 0.04, barMat, 0.42, 0.1, 0), box(0.84, 0.04, 0.04, barMat, 0.42, 2.4, 0), box(0.08, 0.11, 0.05, M.brassDark, 0.75, 1.1, 0.03));
  gatePv.add(gate); cage.add(gatePv);
  // Truhe mit Zahlenschloss 0000
  const chest = group(rbox(0.9, 0.42, 0.5, M.wood, 0, 0.21, 0, 0.015), box(0.92, 0.04, 0.04, M.brassDark, 0, 0.1, 0.25), box(0.92, 0.04, 0.04, M.brassDark, 0, 0.36, 0.25), panel(0.36, 0.2, M.wood, -0.22, 0.22, 0.252, 0.03, 0.006), panel(0.36, 0.2, M.wood, 0.22, 0.22, 0.252, 0.03, 0.006));
  const lidPv = new THREE.Group(); lidPv.position.set(0, 0.42, -0.25);
  lidPv.add(rbox(0.92, 0.12, 0.52, M.wood, 0, 0.06, 0.25, 0.03), box(0.94, 0.03, 0.04, M.brassDark, 0, 0.06, 0.51)); chest.add(lidPv);
  const cl = plane(0.18, 0.08, lambert(0xffffff, { map: lockTex() }), 0, 0.3, 0.255); chest.add(cl);
  chest.position.set(0, 0, 0.55); cage.add(chest);
  add(place(cage, "w", 0.5, 0, 0));
  // Klickflächen: Käfigtür, Käfigseite, Truhe (erst bei offener Tür)
  add(place(hs("kaefigtuer", group(box(0.84, 2.4, 0.1, ZONE, 0, 1.25, depth))), "w", 0.5, 0, 0));
  add(place(hs("kaefig_seite", group(box(0.9, 2.4, 0.1, ZONE, -0.9, 1.25, depth))), "w", 0.5, 0, 0));
  const chestZone = group(box(0.95, 0.6, 0.55, ZONE, 0, 0.3, 0.55));
  add(place(hs("truhe", chestZone), "w", 0.5, 0, 0));
  let gOpen = false, cOpen = false; state((has) => { gOpen = has("kaefig_offen"); cOpen = has("truhe_offen"); cl.visible = !cOpen; });
  anim((dt) => { const k = Math.min(1, dt * 3); gatePv.rotation.y = lerp(gatePv.rotation.y, gOpen ? -1.9 : 0, k); lidPv.rotation.x = lerp(lidPv.rotation.x, cOpen ? -1.2 : 0, k); });
  const cageBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), basic(0xffe6b8)); add(place(cageBulb, "w", 0.5, 2.6, 0.55));
  const cageL = new THREE.PointLight(0xffd0a0, 5.5, 0, 2); place(cageL, "w", 0.5, 2.3, 0.7); cageL.userData.shadow = true; add(cageL);
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.2 };
});
ready();
