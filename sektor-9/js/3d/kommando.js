/*
 * SEKTOR 9 – Kommando-Halle (Sektor A): eine Halle, drei Standpunkte.
 *   Leitstand (unten, Mitte): Lagetisch, Konsole mit Schlüsselschalter NOTSTROM A, Befehlsbuch, Bodenluke, Gittertür zur Treppe.
 *   Funkstation (Galerie hinter Glas): Funkgeräte, Schreibtisch mit Funkprotokoll, Band 1 und Schublade, Tonbandgerät, Funkuhr.
 *   Lagezentrum (Seitenschiff West, erst mit Notstrom hell): Lagekarte, Lagetafel, Kassette mit Tastenfeld, Kartenschrank.
 * Koordinaten: x −8…8 (West…Ost), z −6…6 (Nord…Süd), Höhe 7,5 m. Galerie: Boden y = 3,2, z −6…−2,4.
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { combinationLock, keyTurn, keyMesh } from "./interact.js?v=3";
import { mats, shellBox, crt, termText, cageLamp, tube, pipe, label, stencil, stationMark, animateMarks, sheet, lines, MONO, std } from "./s9kit.js?v=1";

defineRoom("kommando", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const W = 16, D = 12, H = 7.5, GY = 3.2;
  const hemi = scene.children.find((c) => c.isHemisphereLight); if (hemi) hemi.intensity = 0.32;
  shellBox(ctx, { W, D, H, M, holes: { s: [{ x: 4.5, y: 0, w: 1.9, h: 2.5 }, { x: 6.4, y: 0, w: 1.1, h: 1.5 }] } }); // Ausgang · Wartungsgang hinter dem Kartenschrank
  add(pipe(M, W, 0.12, 0, H - 0.4, 5.4), pipe(M, W, 0.07, 0, H - 0.65, 5.7), pipe(M, D, 0.1, 7.4, H - 0.4, 0, Math.PI / 2));
  for (let i = 0; i < 5; i++) add(box(0.4, H, 0.25, M.wall, -6 + i * 3, H / 2, 5.88)); // Wandpfeiler Süd

  /* ===== Galerie mit Funkstation hinter Glas ===== */
  add(box(8.4, 0.25, 3.6, M.ceil, 0, GY - 0.125, -4.2)); // Galerieboden
  add(box(8.4, 0.25, 3.6, M.ceil, 0, 6.0, -4.2)); // Decke der Funkstation
  [-4, 0, 4].forEach((x) => add(box(0.35, GY, 0.35, M.paintGrey, x, GY / 2, -2.6))); // Stützen
  add(box(8.4, 0.9, 0.12, M.paint, 0, GY + 0.45, -2.45)); // Brüstung
  const glass = plane(8.4, 1.9, M.glass, 0, GY + 0.9 + 0.95, -2.44); add(glass);
  for (let i = 0; i <= 6; i++) add(box(0.06, 1.95, 0.08, M.steelDark, -4.2 + i * 1.4, GY + 1.85, -2.44));
  add(box(8.4, 0.08, 0.1, M.steelDark, 0, GY + 2.82, -2.44));
  add(box(0.12, 2.8, 3.6, M.wall, -4.2, GY + 1.4, -4.2));
  const eastWall = group(box(0.12, 2.8, 1.2, M.wall, 0, 1.4, -1.2), box(0.12, 2.8, 1.2, M.wall, 0, 1.4, 1.2), box(0.12, 0.6, 1.2, M.wall, 0, 2.5, 0)); eastWall.position.set(4.2, GY, -4.2); add(eastWall);
  const fsign = plane(1.6, 0.3, label("FUNKSTATION", 512, 96, "#8fd19e", "#0b120d", 46), 0, GY + 0.45, -2.38); add(fsign);
  // Funkgeräte-Regal an der Nordwand
  const rack = group(box(4.2, 2.1, 0.6, M.paintGrey, 0, 1.05, 0));
  const meterTex = canvasTex(128, 80, (g) => { g.fillStyle = "#e8e0c0"; g.fillRect(0, 0, 128, 80); g.strokeStyle = "#222"; g.beginPath(); g.arc(64, 78, 58, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); g.save(); g.translate(64, 78); g.rotate(-0.4); g.fillStyle = "#a02020"; g.fillRect(-1, -54, 2, 54); g.restore(); });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = -1.5 + c * 1.0, y = 0.45 + r * 0.6;
    rack.add(box(0.9, 0.5, 0.04, M.steelDark, x, y, 0.31));
    rack.add(plane(0.24, 0.15, new THREE.MeshLambertMaterial({ map: meterTex }), x - 0.22, y + 0.06, 0.335));
    [0.1, 0.25].forEach((dx) => rack.add(cyl(0.035, 0.035, 0.04, M.black, x + dx, y - 0.04, 0.34, 14).rotateX(Math.PI / 2)));
  }
  const rackLeds = []; for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0x3a1a14, toneMapped: false })); l.position.set(-1.8 + i * 0.7, 1.95, 0.32); rack.add(l); rackLeds.push(l); }
  const tag4625 = plane(0.3, 0.08, new THREE.MeshLambertMaterial({ map: canvasTex(256, 64, (g) => { g.fillStyle = "#f0e6b8"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#2a2a6a"; g.font = "italic 30px serif"; g.fillText("4625 – nicht umstellen!", 8, 42); }) }), 0.5, 1.6, 0.335); rack.add(tag4625);
  rack.position.set(0, GY, -5.65); add(hs("f_funkgeraet", rack));
  // Schreibtisch mit Funkprotokoll, Band 1, Schublade
  const desk = group(box(2.6, 0.06, 0.85, M.wood, 0, 0.76, 0), box(0.06, 0.74, 0.8, M.steelDark, -1.25, 0.37, 0), box(0.06, 0.74, 0.8, M.steelDark, 1.25, 0.37, 0), box(0.7, 0.55, 0.8, M.paintGrey, 0.85, 0.46, 0));
  desk.position.set(0, GY, -4.55); add(desk);
  const proto = group(sheet(0.3, 0.42, (g, w, h) => { g.fillStyle = "#222"; g.font = `500 13px ${MONO}`; g.fillText("FUNKPROTOKOLL 17.02.87", 12, 22); lines(g, w, h, 14, 12, 40); }, M, 0.12), box(0.36, 0.03, 0.46, ZONE, 0, 0.01, 0));
  proto.position.set(-0.65, GY + 0.795, -4.5); add(hs("f_protokoll", proto));
  const spool = group(cyl(0.11, 0.11, 0.025, M.black, 0, 0.012, 0, 24), cyl(0.03, 0.03, 0.03, M.paper, 0, 0.02, 0, 12), box(0.26, 0.06, 0.26, ZONE, 0, 0.03, 0));
  spool.position.set(0.05, GY + 0.79, -4.4); add(hs("f_band1", spool, { hideWhenHidden: true }));
  const drawer = group(box(0.62, 0.16, 0.04, M.paint, 0, 0, 0), box(0.18, 0.03, 0.03, M.steel, 0, 0, 0.03)); drawer.position.set(0.85, GY + 0.62, -4.13); add(hs("f_schublade", drawer));
  // Tonbandgerät auf dem Beistelltisch (Ost)
  const tableE = group(box(1.0, 0.06, 0.7, M.wood, 0, 0.72, 0), box(0.9, 0.68, 0.6, M.paintGrey, 0, 0.36, 0)); tableE.position.set(3.4, GY, -4.0); add(tableE);
  const rec = group(box(0.7, 0.18, 0.5, M.paintGrey, 0, 0.09, 0), box(0.66, 0.02, 0.46, M.black, 0, 0.185, 0));
  const reels = [-0.17, 0.17].map((x) => { const r = group(cyl(0.13, 0.13, 0.015, M.steel, 0, 0, 0, 28), cyl(0.03, 0.03, 0.02, M.black, 0, 0.005, 0, 10)); r.position.set(x, 0.2, -0.05); rec.add(r); return r; });
  const recTape = cyl(0.1, 0.1, 0.018, M.black, 0, 0.004, 0, 24); recTape.visible = false; reels[0].add(recTape);
  [-0.15, 0, 0.15].forEach((x) => rec.add(box(0.08, 0.03, 0.05, M.black, x, 0.2, 0.19)));
  rec.rotation.y = -Math.PI / 2; rec.position.set(3.4, GY + 0.75, -4.0); add(hs("f_tonband", group(rec, box(0.6, 0.4, 0.8, ZONE, 3.4, GY + 0.9, -4.0))));
  // Funkuhr an der Westwand der Funkstation (23:41)
  const clockTex = canvasTex(256, 256, (g) => { g.fillStyle = "#f2efe4"; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.fillStyle = "#111"; for (let i = 0; i < 60; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI / 30); g.fillRect(-1.5, -118, 3, i % 5 ? 8 : 18); g.restore(); }
    const hand = (a, l, w) => { g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-w / 2, -l, w, l + 14); g.restore(); }; hand((23 % 12 + 41 / 60) * Math.PI / 6, 62, 8); hand(41 * Math.PI / 30, 96, 5);
    g.fillStyle = "#a02020"; g.font = `500 14px ${MONO}`; g.fillText("FUNKZEIT", 92, 190); });
  const fclock = group(cyl(0.26, 0.26, 0.06, M.black, 0, 0, 0, 36).rotateX(Math.PI / 2), plane(0.48, 0.48, new THREE.MeshLambertMaterial({ map: clockTex, transparent: true }), 0, 0, 0.032));
  fclock.position.set(-4.12, GY + 1.85, -4.0); fclock.rotation.y = Math.PI / 2; add(hs("f_funkuhr", fclock));
  // Licht in der Funkstation: Schreibtischlampe, grünes Leuchten der Geräte
  const dl = cageLamp(M, 0xffd090, 2.2, 5); dl.g.position.set(-1.4, GY + 2.6, -4.4); add(dl.g);
  const rackGlow = new THREE.PointLight(0x8fd19e, 0.8, 4, 2); rackGlow.position.set(0, GY + 1.4, -4.9); add(rackGlow);

  /* ===== Treppe (Ostseite) mit Gittertür ===== */
  const stairs = new THREE.Group();
  const n = 16, run = 5.4 / n, rise = GY / n;
  for (let i = 0; i < n; i++) stairs.add(box(1.4, 0.06, run + 0.02, M.steelDark, 0, rise * (i + 1) - 0.03, -i * run - run / 2));
  [-0.7, 0.7].forEach((x) => { const s = box(0.06, 0.12, 6.3, M.steelDark, x, GY / 2, -2.7); s.rotation.x = Math.atan2(GY, 5.4); stairs.add(s); });
  stairs.position.set(6.5, 0, 3.0); add(stairs);
  add(box(3.0, 0.25, 1.8, M.ceil, 5.7, GY - 0.125, -3.3)); // Podest oben, zur Funkstation
  // Gitterkäfig um den Treppenfuß, Tür nach Westen
  const meshTex = canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.strokeStyle = "#8a8f88"; g.lineWidth = 5; for (let i = -128; i < 256; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); } }, { repeat: [3, 4] });
  const meshMat = new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, alphaTest: 0.4, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
  add(plane(1.6, 2.4, meshMat, 6.5, 1.2, 3.9)); const sideMesh = plane(1.6, 2.4, meshMat, 7.3, 1.2, 3.1); sideMesh.rotation.y = Math.PI / 2; add(sideMesh);
  const gate = new THREE.Group(); gate.position.set(5.75, 0, 3.1); gate.rotation.y = -Math.PI / 2; // Front zeigt nach Westen (zum Leitstand)
  const gPivot = new THREE.Group(); gPivot.position.x = -0.75; gate.add(gPivot);
  const gLeaf = group(plane(1.5, 2.3, meshMat, 0.75, 1.15, 0), box(1.5, 0.06, 0.06, M.steelDark, 0.75, 2.3, 0), box(1.5, 0.06, 0.06, M.steelDark, 0.75, 0.03, 0), box(0.06, 2.3, 0.06, M.steelDark, 0.03, 1.15, 0), box(0.06, 2.3, 0.06, M.steelDark, 1.47, 1.15, 0)); gPivot.add(gLeaf);
  const gSign = plane(0.62, 0.12, label("FUNKSTATION – NUR FERNMELDEPERSONAL", 1024, 128, "#e8e2cc", "#6b2a22", 40), 0, 1.95, 0.05); gate.add(gSign);
  const lock = combinationLock(ctx, { pid: "galerie", count: 4, brass: M.steel, dark: M.black, handle: "buegel" });
  lock.group.scale.setScalar(0.55); lock.group.position.set(0.45, 1.15, 0.06); gLeaf.add(lock.group);
  const gateSpec = { when: () => !eng().isSolved("galerie"), cam: [0.45, 1.25, 0.75], center: [0.45, 1.15, 0.05], fov: 42, exitDelay: 1600,
    hint: "Räder oben/unten antippen oder wischen · Bügel ziehen", value: lock.value, parts: lock.parts };
  add(hs("k_gitter", group(gate, box(0.3, 2.4, 1.6, ZONE, 5.75, 1.2, 3.1)), { focus: { ...gateSpec, cam: [4.95, 1.25, 2.8], center: [5.72, 1.15, 2.8] } })); // Gruppe im Ursprung: Kamera in Hallenkoordinaten
  const gl = cageLamp(M, 0xffc890, 2.2, 4); gl.g.position.set(5.2, 2.7, 2.8); add(gl.g); // Lampe über der Gittertür
  let gOpen = false; state(() => { gOpen = eng().isSolved("galerie"); lock.group.visible = !gOpen; });
  anim((dt) => { gPivot.rotation.y = lerp(gPivot.rotation.y, gOpen ? 1.6 : 0, Math.min(1, dt * 1.5)); });

  /* ===== Leitstand: Lagetisch, Konsole, Befehlsbuch, Bodenluke ===== */
  const mapTex = canvasTex(1024, 576, (g, w, h) => { g.fillStyle = "#c9c6a8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a8a7a"; g.lineWidth = 2; for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += Math.random() * 80 - 40; y += Math.random() * 80 - 40; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = "#556"; g.lineWidth = 1; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
  const table = group(box(3.2, 0.85, 1.8, M.paint, 0, 0.425, 0), box(3.3, 0.04, 1.9, M.steelDark, 0, 0.87, 0), plane(3.1, 1.7, new THREE.MeshLambertMaterial({ map: mapTex }), 0, 0.895, 0));
  table.children[2].rotation.x = -Math.PI / 2;
  const glassTop = plane(3.1, 1.7, M.glass, 0, 0.9, 0); glassTop.rotation.x = -Math.PI / 2; table.add(glassTop);
  const fplan = sheet(0.32, 0.44, (g, w, h) => { g.fillStyle = "#222"; g.font = `500 12px ${MONO}`; g.fillText("FERNMELDEPLAN · A", 12, 22); g.fillText("4625", 30, 70); g.fillText("3870", 30, 100); g.fillText("2182", 30, 130); lines(g, w, h, 6, 100, 60); }, M, -0.2);
  fplan.position.set(0.6, 0.905, 0.35); table.add(fplan);
  [[-0.9, 0.2, 0.4], [-0.4, -0.4, -0.3], [1.1, -0.3, 0.9]].forEach(([x, z, r]) => { const s = sheet(0.3, 0.4, (g, w, h) => lines(g, w, h, 10), M, r); s.position.set(x, 0.903, z); table.add(s); });
  table.add(box(3.4, 1.2, 2.0, ZONE, 0, 0.6, 0));
  table.position.set(0, 0, 0.2); add(hs("k_lagetisch", table));
  // Konsole an der Südseite (Front nach Norden zum Spieler)
  const con = new THREE.Group(); con.position.set(0.6, 0, 4.7); con.rotation.y = Math.PI;
  con.add(box(4.2, 0.95, 0.9, M.paintGrey, 0, 0.475, 0));
  const slope = box(4.2, 0.06, 0.6, M.paint, 0, 1.08, 0.1); slope.rotation.x = 0.45; con.add(slope);
  const lampsC = [];
  for (let i = 0; i < 18; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a3020, emissive: 0x000000 })); l.position.set(-1.9 + (i % 9) * 0.3, 1.1 + Math.floor(i / 9) * 0.08, 0.2 - Math.floor(i / 9) * 0.12); con.add(l); lampsC.push(l); }
  for (let i = 0; i < 10; i++) { const s = box(0.03, 0.06, 0.03, M.black, -1.5 + i * 0.22, 1.12, 0.32); s.rotation.x = 0.45; con.add(s); }
  // Schlüsselschalter NOTSTROM A
  const swPlate = group(box(0.3, 0.3, 0.04, M.steelDark, 0, 0, 0), cyl(0.05, 0.05, 0.03, M.steel, 0, 0, 0.03, 18).rotateX(Math.PI / 2), plane(0.26, 0.06, label("NOTSTROM A", 512, 112, "#e8e2cc", "#6b2a22", 50), 0, 0.11, 0.025));
  swPlate.position.set(1.4, 0.7, 0.47); con.add(swPlate);
  const key = keyMesh(M.steel, 1.2); key.position.set(0, 0, 0.04); swPlate.add(key);
  const keySpec = keyTurn(ctx, { key, item: "notstromschluessel", hotspot: "k_konsole", when: () => !eng().has("notstrom"), cam: [0, 0.05, 0.6], center: [0, 0, 0], fov: 40 });
  swPlate.add(box(0.5, 0.5, 0.2, ZONE, 0, 0, 0.1));
  add(con);
  hs(["k_konsole_an", "k_konsole"], swPlate, { focus: keySpec });
  // Zweiter Schalter für Nowaks Abschaltung: SPEISUNG RECHENKERN (Kippschalter unter roter Schutzkappe)
  const sp = group(box(0.3, 0.3, 0.04, M.steelDark, 0, 0, 0), plane(0.28, 0.06, label("SPEISUNG RECHENKERN", 512, 100, "#e8e2cc", "#6b2a22", 40), 0, 0.11, 0.025), box(0.04, 0.1, 0.04, M.steel, 0, -0.02, 0.04), box(0.45, 0.45, 0.2, ZONE, 0, 0, 0.1));
  const capPv = new THREE.Group(); capPv.position.set(0, 0.04, 0.05); capPv.add(box(0.12, 0.02, 0.14, std(0xc0392b, { transparent: true, opacity: 0.8 }), 0, 0, -0.06)); sp.add(capPv);
  sp.position.set(-0.4, 0.7, 0.47); con.add(sp);
  let spOn = false; state(() => { spOn = eng().has("k3") || Boolean(eng().state().relay && eng().state().relay.a && Date.now() - eng().state().relay.a < 90000); });
  anim((dt) => { capPv.rotation.x = lerp(capPv.rotation.x, spOn ? -1.6 : 0, Math.min(1, dt * 5)); sp.children[2].rotation.x = lerp(sp.children[2].rotation.x, spOn ? 0.6 : -0.6, Math.min(1, dt * 8)); });
  hs(["k_speisung_ok", "k_speisung"], sp, { act: { when: (id) => id === "k_speisung", play: () => { spOn = true; snd("click"); return 600; } } });
  // Befehlsbuch auf der Konsole
  const book = group(box(0.34, 0.05, 0.46, M.red, 0, 0.025, 0), box(0.32, 0.01, 0.44, M.paper, 0, 0.052, 0), box(0.45, 0.15, 0.55, ZONE, 0, 0.05, 0));
  book.position.set(-1.2, 0.97, 4.4); book.rotation.y = 0.2; add(hs("k_befehlsbuch", book));
  // Bodenluke A–D
  const hatch = group(box(1.0, 0.04, 1.0, M.steel, 0, 0.02, 0), plane(0.7, 0.12, stencil("NOTWEG A–D", 1024, 160, "#d8d0b4", 100), 0, 0.045, 0));
  hatch.children[1].rotation.x = -Math.PI / 2; [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].forEach(([x, z]) => hatch.add(cyl(0.03, 0.03, 0.03, M.steelDark, x, 0.05, z, 10)));
  hatch.add(box(1.1, 0.2, 1.1, ZONE, 0, 0.1, 0)); hatch.position.set(3.4, 0, 3.6); add(hs("k_luke", hatch));
  // Ausgang zur Verteilerhalle (Südwand, x = −4,5)
  const exitD = group(box(1.9, 2.5, 0.1, new THREE.MeshBasicMaterial({ color: 0x070807 }), 0, 1.25, 0), plane(1.4, 0.24, stencil("VERTEILER", 1024, 160, "#d8d0b4", 110), 0, 2.75, 0.06), box(1.9, 2.5, 0.4, ZONE, 0, 1.25, 0));
  exitD.position.set(-4.5, 0, 5.93); exitD.rotation.y = Math.PI; add(hs("k_ausgang", exitD));
  const exitL = new THREE.PointLight(0xffc98a, 1.2, 4, 2); exitL.position.set(-4.5, 2, 5.2); add(exitL);

  /* ===== Lagezentrum (West) ===== */
  const lageTex = canvasTex(1024, 640, (g, w, h) => { g.fillStyle = "#b8c4b0"; g.fillRect(0, 0, w, h); g.fillStyle = "#9fb0a0"; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 120, 20 + Math.random() * 70, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "#445"; g.lineWidth = 1; for (let x = 0; x < w; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = "#b02020"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(420 + Math.random() * 300, 60 + Math.random() * 140, 7, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#222"; g.font = `500 22px ${MONO}`; g.fillText("LAGE MITTE · 17.02.1987", 24, 36); });
  const lmap = group(box(4.0, 2.6, 0.06, M.steelDark, 0, 0, 0), plane(3.86, 2.46, new THREE.MeshLambertMaterial({ map: lageTex }), 0, 0, 0.035));
  lmap.position.set(-7.93, 2.3, -0.8); lmap.rotation.y = Math.PI / 2; add(hs("l_karte", lmap));
  const tafel = crt(M, 1.4, 0.9, [512, 330]); tafel.g.children[0].scale.set(1, 1, 0.3);
  tafel.paint((g) => termText(g, [["LAGETAFEL · SYSTEMZEIT", "#e0b45a"], "21:47  UEBUNG AKTIV", "22:19  RADARKONTAKT NORD", "22:58  FREIGABE STUFE 2 · ALBERS", "23:12  AUSSENLEITUNG GESTOERT", "23:45  ABRIEGELUNG BESTAETIGT"], { size: 24, step: 46, y: 46 }));
  const sticker = plane(0.5, 0.1, new THREE.MeshLambertMaterial({ map: canvasTex(512, 100, (g) => { g.fillStyle = "#efe3b4"; g.fillRect(0, 0, 512, 100); g.fillStyle = "#222"; g.font = `500 22px ${MONO}`; g.fillText("Kassette Schichtwechsel:", 12, 36); g.fillText("Code = Uhrzeit letzter FUNKSPRUCH", 12, 74); }) }), 0, -0.6, 0.04);
  tafel.g.add(sticker); tafel.g.position.set(-7.75, 2.1, 3.2); tafel.g.rotation.y = Math.PI / 2; add(hs("l_tafel", tafel.g));
  const tafelOn = tafel.screen; // ohne Strom dunkel
  // Kassette mit Tastenfeld (Nordwand des Lagezentrums)
  const kas = new THREE.Group(); kas.position.set(-6.4, 1.35, -5.9);
  kas.add(box(0.5, 0.5, 0.18, M.paintGrey, 0, 0, 0.09));
  const kDoor = new THREE.Group(); kDoor.position.set(-0.24, 0, 0.19); kas.add(kDoor);
  kDoor.add(box(0.46, 0.46, 0.03, M.paintGrey, 0.23, 0, 0));
  const pad = new THREE.Group(); pad.position.set(0.3, 0, 0.02); kDoor.add(pad);
  const dC = document.createElement("canvas"); dC.width = 128; dC.height = 40; const dT = new THREE.CanvasTexture(dC); dT.colorSpace = THREE.SRGBColorSpace;
  const dDraw = (txt, col = "#8fd19e") => { const g = dC.getContext("2d"); g.fillStyle = "#06140b"; g.fillRect(0, 0, 128, 40); g.fillStyle = col; g.font = `600 26px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 22); dT.needsUpdate = true; };
  dDraw("– – – –"); pad.add(plane(0.12, 0.035, new THREE.MeshBasicMaterial({ map: dT, toneMapped: false }), 0, 0.12, 0.012));
  const kTexs = {}; const kTex = (k) => kTexs[k] ??= canvasTex(64, 64, (g) => { g.fillStyle = "#2b2f2b"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#d8dccf"; g.font = `600 36px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(k, 32, 34); });
  const keys = "123456789*0#".split("").map((k, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.012), [M.black, M.black, M.black, M.black, new THREE.MeshStandardMaterial({ map: kTex(k), roughness: 0.6 }), M.black]); b.position.set(-0.04 + (i % 3) * 0.04, 0.065 - Math.floor(i / 3) * 0.036, 0.01); b.userData.k = k; pad.add(b); return b; });
  let entry = "", press = {};
  const tapKey = (b) => { const k = b.userData.k; press[k] = 0; snd("key"); if (!eng().has("notstrom")) { dDraw(""); return; } if (!/\d/.test(k)) { entry = ""; dDraw("– – – –"); return; }
    entry += k; dDraw(entry.padEnd(4, "–").split("").join(" "));
    if (entry.length === 4) { const v = entry; entry = ""; setTimeout(() => { const r = eng().tryLock("kassette", v); if (r.ok) dDraw("OFFEN"); else { dDraw("FEHLER", "#d0473a"); setTimeout(() => dDraw("– – – –"), 900); } }, 250); } };
  anim((dt) => { keys.forEach((b) => { const t = press[b.userData.k]; if (t === undefined) return; press[b.userData.k] = t + dt; b.position.z = t < 0.15 ? 0.005 : 0.01; if (t > 0.2) delete press[b.userData.k]; }); });
  const kasSpec = { when: (id) => id === "l_kassette" && !eng().isSolved("kassette"), cam: [0.3, 0.02, 0.6], center: [0.3, 0, 0.1], fov: 38, exitDelay: 1800,
    hint: "Vier Ziffern eintippen · * löscht", value: () => entry, enter: () => { entry = ""; dDraw("– – – –"); }, parts: () => keys.map((b) => ({ obj: b, name: "taste" + b.userData.k, tap: () => tapKey(b) })) };
  add(hs(["l_kassette_offen", "l_kassette"], group(kas, box(0.6, 0.6, 0.4, ZONE, -6.4, 1.35, -5.75)), { focus: { ...kasSpec, cam: [-6.34, 1.37, -5.05], center: [-6.34, 1.35, -5.69] } }));
  let kOpen = false; state(() => { kOpen = eng().isSolved("kassette"); });
  anim((dt) => { kDoor.rotation.y = lerp(kDoor.rotation.y, kOpen ? -1.7 : 0, Math.min(1, dt * 2)); });
  // Kartenschrank (Südwand des Lagezentrums)
  const ks = group(box(1.8, 1.1, 0.9, M.paintGrey, 0, 0.55, 0));
  for (let i = 0; i < 6; i++) ks.add(box(1.7, 0.14, 0.02, M.paint, 0, 0.12 + i * 0.17, 0.46), box(0.2, 0.03, 0.03, M.steel, 0, 0.12 + i * 0.17, 0.48));
  ks.position.set(-6.4, 0, 5.4); ks.rotation.y = Math.PI; add(hs(["l_tunnel", "l_schrank"], ks));
  // dahinter: Wartungsgang A–B (öffnet sich von der Personal-Seite); der Schrank rollt dann zur Seite
  const tunA = group(box(1.1, 0.05, 3, M.ceil, 0, 1.5, 1.5), box(0.05, 1.5, 3, M.wall, -0.55, 0.75, 1.5), box(0.05, 1.5, 3, M.wall, 0.55, 0.75, 1.5), box(1.1, 1.5, 0.05, new THREE.MeshBasicMaterial({ color: 0x020202 }), 0, 0.75, 3));
  tunA.position.set(-6.4, 0, 6); add(tunA);
  const tunAL = new THREE.PointLight(0xffc98a, 0, 3, 2); tunAL.position.set(-6.4, 0.9, 6.8); add(tunAL);
  let abOpen = false; state(() => { abOpen = eng().has("tunnel_ab"); tunAL.intensity = abOpen ? 1.4 : 0; });
  anim((dt) => { ks.position.x = lerp(ks.position.x, abOpen ? -4.6 : -6.4, Math.min(1, dt * 1.5)); });
  // Leuchtstoffröhren im Lagezentrum (erst mit Notstrom)
  const tubes = [[-6.3, -2.5], [-6.3, 0.5], [-6.3, 3.5]].map(([x, z]) => { const t = tube(M, 1.6); t.g.position.set(x, 4.2, z); t.g.rotation.y = Math.PI / 2; t.light.distance = 8; add(t.g); return t; });

  /* ===== Licht: Notbeleuchtung, nach NOTSTROM A heller ===== */
  const nl1 = cageLamp(M, 0xffb060, 5, 12); nl1.g.position.set(0.5, 5.4, 1.6); nl1.light.userData.shadow = true; add(nl1.g);
  const nl2 = cageLamp(M, 0xff9a50, 2.4, 7); nl2.g.position.set(6.6, 2.9, 4.6); add(nl2.g);
  const red1 = new THREE.PointLight(0xd0473a, 1.2, 6, 2); red1.position.set(-4.5, 3.0, 5.4); add(red1);
  add(new THREE.AmbientLight(0x2a3030, 0.5));
  let power = false, pT = 0;
  state(() => { power = eng().has("notstrom"); });
  anim((dt, t) => {
    if (power) pT += dt;
    const flick = pT > 0 && pT < 1.4 ? (Math.random() < 0.5 ? 0 : 1) : 1;
    tubes.forEach((tb, i) => { const on = power && pT > 0.3 + i * 0.25 ? flick : 0; tb.glow.emissiveIntensity = on * 2.2; tb.light.intensity = on * 7; });
    tafelOn.material.color.setScalar(power ? 1 : 0.04);
    lampsC.forEach((l, i) => { l.material.emissive.setHex(power && ((i * 7 + Math.floor(t * 2)) % 5) ? (i % 3 ? 0xe0b45a : 0x8fd19e) : 0x000000); l.material.emissiveIntensity = 1.6; });
    rackLeds.forEach((l, i) => l.material.color.setHex(power && (Math.floor(t * 3) + i) % 4 ? 0x8fd19e : 0x3a1a14));
    nl1.light.intensity = (power ? 6.5 : 5) * (0.94 + Math.random() * 0.06);
  });

  /* ===== Bänder: Spulen drehen sich, nachdem Band 1 eingelegt wurde ===== */
  let spin = 0, played = false;
  state(() => { const s = eng().isSolved("band1"); if (s && !played) { played = true; spin = 7; } recTape.visible = s; });
  anim((dt) => { if (spin > 0) { spin -= dt; reels.forEach((r, i) => { r.rotation.y += dt * (i ? 5 : 3.5); }); } });

  /* ===== Standpunkte ===== */
  const mL = stationMark("LEITSTAND", { signY: 2.3 }); mL.position.set(0, 0, 2.6); add(hs("st_leitstand", mL, { aimLocal: [0, 2.3, 0] }));
  const mF = stationMark("FUNKSTATION", { signY: 1.9 }); mF.position.set(0, GY, -3.4); add(hs("st_funkstation", mF, { aimLocal: [0, 1.9, 0] }));
  const mZ = stationMark("LAGEZENTRUM", { signY: 2.3 }); mZ.position.set(-5.2, 0, 0.4); add(hs("st_lagezentrum", mZ, { aimLocal: [0, 2.3, 0] }));
  const marks = { leitstand: mL, funkstation: mF, lagezentrum: mZ };
  animateMarks(ctx, Object.values(marks));
  anim(() => { const here = eng().state().station; Object.entries(marks).forEach(([k, m]) => { m.visible = k !== here; }); });

  // Schriftzüge an den Wänden
  const big = plane(4.2, 0.6, stencil("KOMMANDO A", 1024, 160, "#cfc7aa", 120)); big.position.set(2.5, 5.6, 5.9); big.rotation.y = Math.PI; add(big);
  const lz = plane(2.6, 0.38, stencil("LAGEZENTRUM", 1024, 160, "#cfc7aa", 110)); lz.position.set(-7.92, 4.5, -0.8); lz.rotation.y = Math.PI / 2; add(lz);
  return { eyes: { leitstand: [0, 1.65, 2.6], funkstation: [0, GY + 1.65, -3.4], lagezentrum: [-5.2, 1.65, 0.4] }, hd: true, R: 7, H, env: 0.16 };
});
ready();
