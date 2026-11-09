/*
 * STATION 2 – ZIMMER 217 in 3D
 * Aufbau nach den vier 2D-Ansichten (js/rooms/02-zimmer217.js): Nord Zimmertür · Ost Bett · Süd Fenster · West Schreibtisch.
 * Raum 5,2 × 5,2 m, 3 m hoch.
 * Zustände aus der Engine: kommode_open · schrank_open · fenster_auf (Ereignis beim Blick zum Fenster, nachdem die
 * Kommode offen ist: Fenster schlägt auf, danach nasse Fußspuren und ein Blatt auf dem Schreibtisch) · taken_gepaeckschein.
 * Bildhinweise: Zimmernummer 217 · Ziffernschloss der Kommode (vier Stellen, 0000) · „Wer nachts wacht“ über dem Schrank ·
 * „für E.“ am Landschaftsbild · Kerze brennt · Gepäckschein „6“ unter dem Bett (nur im Lichtkegel) · Tor im Hof nur beim Blitz.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, phong, basic, ZONE, box, cyl, plane, group } from "./core.js?v=4";
import { textTex, wallpaper, woodTex, plankTex, plaqueTex, rainTex, shell } from "./kit.js?v=3";
import { woodMat, brassMat, velvetMat, std, damask, persian, rbox, panel, turnedLeg, ornateFrame, tableLamp } from "./hd.js?v=3";
import { tag } from "./gfx.js?v=2";
import { combinationLock } from "./interact.js?v=4";

const R = 2.6, H = 3.0;

/* ---------- Texturen ---------- */
const lakeTex = () => textTex(400, 260, "#1b2224", (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, "#141c22"); sky.addColorStop(1, "#3a4a48"); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
  g.fillStyle = "#e8e2c8"; g.beginPath(); g.arc(300, 60, 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1a2422"; g.beginPath(); g.moveTo(0, 140); g.quadraticCurveTo(90, 100, 180, 135); g.quadraticCurveTo(260, 110, 400, 140); g.lineTo(400, 150); g.lineTo(0, 150); g.fill();
  g.fillStyle = "#24302e"; g.fillRect(0, 145, w, h - 145);
  g.strokeStyle = "rgba(232,226,200,.5)"; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(280 - i * 3, 160 + i * 10); g.lineTo(320 + i * 3, 160 + i * 10); g.stroke(); }
  g.fillStyle = "rgba(220,210,180,.7)"; g.font = "italic 13px Georgia, serif"; g.fillText("für E.", 340, 246); // Signatur unten rechts
});
const numberPlate = () => plaqueTex("217", 256, 96, "#2a2119", "#c9ae7c", "600 60px Georgia, serif", 10);
const codeLockTex = () => textTex(256, 128, "#120e0b", (g) => {
  g.strokeStyle = "#b69a6d"; g.lineWidth = 6; g.strokeRect(4, 4, 248, 120);
  g.fillStyle = "#b69a6d"; g.font = "600 56px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  [0, 0, 0, 0].forEach((d, i) => { g.fillStyle = "#2a2016"; g.fillRect(22 + i * 56, 24, 46, 80); g.fillStyle = "#d4bc90"; g.fillText(String(d), 45 + i * 56, 66); });
});
const carveTex = () => plaqueTex("Wer nachts wacht", 640, 96, "#c9b28a", "#2a1d14", "italic 46px Georgia, serif", 2);
const wheelsTex = () => textTex(320, 96, "#16100b", (g) => {
  g.strokeStyle = "#b69a6d"; g.lineWidth = 4; g.strokeRect(2, 2, 316, 92);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#6e5632"; g.fillRect(16 + i * 60, 12, 48, 72); g.fillStyle = "#e0c896"; g.font = "600 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A", 40 + i * 60, 50); }
});
const ticketTex = () => textTex(160, 96, "#d8cdb6", (g) => {
  g.fillStyle = "#9a8a6a"; g.fillRect(56, 0, 48, 18);
  g.fillStyle = "#2a2119"; g.font = "600 46px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("6", 80, 58);
});
const letterTex = () => textTex(256, 180, "#ece2c8", (g) => {
  g.strokeStyle = "#8a7d66"; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = 40 + i * 22; g.beginPath(); g.moveTo(20, y); g.lineTo(60 + Math.random() * 160, y); g.stroke(); }
});
const sheetTex = () => textTex(200, 260, "#efe6cf", (g) => {
  g.strokeStyle = "#5a4e3e"; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = 40 + i * 26; g.beginPath(); g.moveTo(18, y); g.lineTo(40 + Math.random() * 130, y); g.stroke(); }
});
const portraitTex = () => textTex(200, 250, "#2a221b", (g) => {
  const gr = g.createRadialGradient(100, 110, 6, 100, 120, 140); gr.addColorStop(0, "#8a7458"); gr.addColorStop(1, "#2a221b"); g.fillStyle = gr; g.fillRect(0, 0, 200, 250);
  g.fillStyle = "#c9b296"; g.beginPath(); g.ellipse(100, 105, 38, 48, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#3a2c22"; g.beginPath(); g.moveTo(30, 250); g.quadraticCurveTo(100, 140, 170, 250); g.fill();
  g.fillStyle = "#2a1d14"; g.fillRect(80, 96, 14, 5); g.fillRect(108, 96, 14, 5);
});
const courtTex = () => canvasTex(512, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "rgba(169,191,214,.9)"; g.lineWidth = 6; g.strokeRect(190, 230, 120, 170); g.beginPath(); g.moveTo(250, 230); g.lineTo(250, 400); g.stroke(); // schmales Tor in der Westmauer
  g.fillStyle = "rgba(169,191,214,.85)"; g.font = "600 34px DM Mono, monospace"; g.textAlign = "center"; g.fillText("W2", 250, 216);
  g.fillStyle = "rgba(120,140,160,.5)"; g.fillRect(0, 400, w, 112);
});

defineRoom("zimmer217", (ctx) => {
  const { add, hs, prop, state, anim, lerp } = ctx;
  const snd = ctx.sound, eng = ctx.engine;
  // Gegenstand kurz anheben/zeigen und wieder zurück, sobald der Text geschlossen ist (apply(k), k 0…1)
  const lift = (apply, rise = 0.8, minHold = 1.8) => { const st = { t: -1 }; anim((dt) => { if (st.t < 0) return; st.t += dt;
    const out = st.t < rise ? st.t / rise : (eng().blocked() || st.t < minHold ? 1 : Math.max(0, 1 - (st.t - minHold) * 1.6)); apply(out * out * (3 - 2 * out));
    if (out <= 0 && st.t > minHold) { st.t = -1; apply(0); } }); return () => { st.t = 0; }; };
  const inner = (g) => { const a = new THREE.Group(); while (g.children.length) a.add(g.children[0]); g.add(a); return a; }; // innen animieren, außen bleibt die Wandposition
  const label = (txt, w, h, font, col = "#2a2119", bg = null) => plane(w, h, new THREE.MeshStandardMaterial({ map: textTex(256, Math.round(256 * h / w), bg, (g, W, H) => { g.fillStyle = col; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, W / 2, H / 2 + 2); }), transparent: !bg, roughness: 0.7 }));
  const M = {
    // HD: Damast in Bordeaux, gewachste Dielen, Nussholz, Messing, Samt
    wall: tag(lambert(0xffffff, { map: damask("#2c161a", "#3e2028", "#5e4c32") }), { roughness: 0.85, normal: 0.9 }), floor: tag(lambert(0xffffff, { map: plankTex() }), { roughness: 0.5, clearcoat: 0.25, normal: 1.6, envMapIntensity: 0.5 }),
    ceil: tag(lambert(0x18120e), { roughness: 0.95 }), trim: woodMat("#20140c", "#0e0804"), wood: woodMat("#3e2616", "#1e1008"),
    woodDark: woodMat("#2a180c", "#120a04"), brass: brassMat(), brassDark: brassMat(0x6e5632, 0.45),
    black: tag(lambert(0x0c0a09), { roughness: 0.4 }), linen: std(0xd8cfbd, { roughness: 0.92 }), red: velvetMat(0x4e1414, 0xa04040), velvet: velvetMat(0x5a1414, 0xb04848), paper: lambert(0xe9dfc6),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim,
    holes: { n: [{ x: 0, y: 0, w: 1.0, h: 2.2 }], s: [{ x: 0, y: 0.8, w: 1.5, h: 1.6 }] },
  });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.012, 1.8), tag(lambert(0xffffff, { map: persian("#4a1418", "#1a2030", "#a07a40") }), { roughness: 0.95, normal: 2.2 })); rug.position.set(-0.2, 0.006, -0.3); add(rug);

  /* ================= NORD · Zimmertür ================= */
  const door = group(box(1.0, 2.2, 0.05, M.woodDark, 0, 1.1, -0.03),
    plane(0.34, 0.13, lambert(0xffffff, { map: numberPlate() }), 0, 1.88, 0.012),
    panel(0.7, 0.6, M.wood, 0, 1.45, 0.0), panel(0.7, 0.75, M.wood, 0, 0.6, 0.0));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), M.brass); knob.position.set(0.38, 1.0, 0.03); door.add(knob);
  const peep = cyl(0.012, 0.012, 0.02, M.brass, 0, 1.58, 0.01); peep.rotation.x = Math.PI / 2; door.add(peep);
  door.add(box(0.08, 2.28, 0.06, M.trim, -0.54, 1.14, 0.0), box(0.08, 2.28, 0.06, M.trim, 0.54, 1.14, 0.0), box(1.16, 0.08, 0.06, M.trim, 0, 2.24, 0.0));
  add(place(hs("tuer217", door), "n", 0.5, 0, 0.02));
  // Garderobe mit dunkelgrünem Damenmantel (Geheimnis: Kinokarte)
  const coat = group(cyl(0.02, 0.025, 1.8, M.woodDark, 0, 0.9, 0), cyl(0.18, 0.2, 0.03, M.woodDark, 0, 0.015, 0),
    cyl(0.16, 0.24, 1.05, lambert(0x1f3a2c), 0, 1.15, 0.06, 16), new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x1f3a2c)));
  coat.children[3].position.set(0, 1.66, 0.06); coat.children[3].scale.set(1.3, 0.6, 1);
  const ticketC = group(plane(0.07, 0.04, std(0xd8c99e, { roughness: 0.8 }))); ticketC.position.set(0.1, 0.95, 0.27); ticketC.visible = false; coat.add(ticketC);
  const coatGo = lift((k) => { ticketC.visible = k > 0.02; ticketC.position.set(0.1 - 0.05 * k, 0.95 + 0.25 * k, 0.27 + 0.35 * k); ticketC.rotation.set(-0.3 * k, 0, 0.2 * k); coat.children[2].rotation.z = Math.sin(k * Math.PI) * 0.05; });
  add(place(hs("mantel", coat, { act: { play: () => { coatGo(); snd("paper"); return 800; } } }), "n", 0.2, 0, 0.35));
  // Spiegel, darunter an einer Kordel der alte Schlüssel
  const mirror = ornateFrame(0.62, 0.9, std(0x9aa4a8, { metalness: 1, roughness: 0.06 }), brassMat(0x9a7434, 0.35), 0.05, 0.07); // Spiegel spiegelt die Umgebung
  add(place(hs("spiegel", mirror), "n", 0.77, 1.6, 0.02));
  const oldKey = group(cyl(0.003, 0.003, 0.16, M.black, 0, 0.08, 0),
    new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 16), M.brass), cyl(0.006, 0.006, 0.12, M.brass, 0, -0.08, 0), box(0.03, 0.025, 0.006, M.brass, 0.015, -0.13, 0));
  const seven = label("7", 0.026, 0.022, "700 150px Georgia, serif", "#3a2a10"); seven.rotation.y = Math.PI; seven.position.set(0.015, -0.13, -0.0035); oldKey.add(seven); // in den Bart eingeschlagen (Rückseite)
  oldKey.add(box(0.08, 0.3, 0.04, ZONE, 0, -0.02, 0));
  const keyA = inner(oldKey);
  const keyGo = lift((k) => { keyA.position.set(-1.0 * k, 0.45 * k, 1.9 * k); keyA.rotation.set(0, Math.PI * Math.min(1, k * 1.4), 0); keyA.scale.setScalar(1 + k * 1.5); }, 1.0);
  add(place(hs("alterschluessel", oldKey, { act: { play: () => { keyGo(); snd("pickup"); return 1100; } } }), "n", 0.775, 1.04, 0.04));
  add(place(box(0.08, 0.12, 0.015, lambert(0xcfc6b2), 0, 0, 0), "n", 0.9, 1.35, 0.01)); // Lichtschalter
  // Nasse Fußspuren von der Tür zum Schreibtisch (erst nach dem Fensterereignis)
  const steps = new THREE.Group(), stepMat = new THREE.MeshLambertMaterial({ color: 0x0a0c10, transparent: true, opacity: 0.75, depthWrite: false });
  const from = new THREE.Vector2(0.1, -R + 0.5), to = new THREE.Vector2(-R + 0.75, 0.9);
  for (let i = 0; i < 10; i++) {
    const t = i / 9, x = from.x + (to.x - from.x) * t, z = from.y + (to.y - from.y) * t, side = i % 2 ? 0.08 : -0.08;
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), stepMat); s.scale.set(0.7, 1.4, 1); s.rotation.set(-Math.PI / 2, 0, Math.atan2(to.x - from.x, to.y - from.y));
    s.position.set(x + side * Math.cos(0.6), 0.006, z + side * Math.sin(0.6)); steps.add(s);
  }
  const stepZone = box(2.6, 0.04, 0.5, ZONE, (from.x + to.x) / 2, 0.02, (from.y + to.y) / 2); stepZone.rotation.y = -Math.atan2(to.y - from.y, to.x - from.x); steps.add(stepZone);
  add(hs("fussspuren", steps, { hideWhenHidden: true }));

  /* ================= OST · Bett ================= */
  // Bettkasten hoch genug, dass man darunter leuchten und tippen kann (Spalt 26 cm)
  // Kopfteil mit Kassetten und geschwungenem Aufsatz, gedrechselte Pfosten, Samt-Tagesdecke
  const crest = new THREE.Shape(); crest.moveTo(-0.85, 0); crest.lineTo(0.85, 0); crest.lineTo(0.85, 0.12); crest.quadraticCurveTo(0.4, 0.14, 0.2, 0.3); crest.quadraticCurveTo(0, 0.42, -0.2, 0.3); crest.quadraticCurveTo(-0.4, 0.14, -0.85, 0.12); crest.lineTo(-0.85, 0);
  const crestM = new THREE.Mesh(new THREE.ExtrudeGeometry(crest, { depth: 0.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), M.woodDark); crestM.position.set(0, 1.24, 0.01);
  const bed = group(rbox(1.7, 1.0, 0.08, M.woodDark, 0, 0.74, 0.04, 0.02), crestM, panel(0.7, 0.5, M.wood, -0.4, 0.95, 0.09), panel(0.7, 0.5, M.wood, 0.4, 0.95, 0.09),
    rbox(1.7, 0.24, 2.0, M.woodDark, 0, 0.38, 1.0, 0.03), rbox(1.6, 0.18, 1.9, M.linen, 0, 0.59, 1.0, 0.06), rbox(1.7, 0.09, 1.42, M.red, 0, 0.7, 1.28, 0.04), rbox(1.7, 0.16, 0.04, M.red, 0, 0.6, 1.98, 0.02),
    rbox(1.7, 0.42, 0.06, M.woodDark, 0, 0.5, 2.02, 0.02));
  [-0.42, 0.42].forEach((x) => bed.add(rbox(0.62, 0.13, 0.36, M.linen, x, 0.74, 0.3, 0.06)));
  [[-0.86, 0.04, 1.5], [0.86, 0.04, 1.5], [-0.86, 2.02, 0.85], [0.86, 2.02, 0.85]].forEach(([x, z, hgt]) => { const l = turnedLeg(hgt, 0.05, M.woodDark); l.position.set(x, 0, z); bed.add(l); });
  add(place(hs("bett", bed), "e", 0.5, 0, 0.0));
  // Brief auf der Tagesdecke
  const letter = plane(0.26, 0.18, lambert(0xffffff, { map: letterTex() })); letter.rotation.set(-Math.PI / 2, 0, 0.3);
  add(place(hs("brief_bett", group(letter, box(0.3, 0.05, 0.24, ZONE, 0, 0.02, 0))), "e", 0.64, 0.745, 1.2));
  // Landschaftsbild über dem Bett („für E.“)
  const lake = ornateFrame(0.96, 0.66, lambert(0xffffff, { map: lakeTex() }), brassMat(0x8a6830, 0.38), 0.05, 0.08);
  add(place(hs("bild_bett", lake), "e", 0.5, 1.78, 0.02));
  // Nachttische: links mit Lampe, rechts (Hotspot) mit Sanduhr
  // Nachttisch links mit Tischlampe – Hauptlicht mit Schatten
  const nsL = group(rbox(0.45, 0.55, 0.4, M.woodDark, 0, 0.275, 0, 0.02), panel(0.36, 0.2, M.wood, 0, 0.4, 0.2), tableLamp(0.48, 0x7a4a2a));
  nsL.children[2].position.y = 0.55;
  add(place(nsL, "e", 0.13, 0, 0.25));
  const lampL = new THREE.PointLight(0xffb066, 6, 0, 2); place(lampL, "e", 0.13, 0.95, 0.35); lampL.userData.shadow = true; add(lampL);
  const nsR = group(rbox(0.45, 0.55, 0.4, M.woodDark, 0, 0.275, 0, 0.02), panel(0.36, 0.16, M.wood, 0, 0.38, 0.2), cyl(0.014, 0.014, 0.03, M.brass, 0, 0.38, 0.235).rotateX(Math.PI / 2));
  const nsDrawer = new THREE.Group(); const nsFront = nsR.children[1], nsKnob = nsR.children[2]; nsDrawer.add(nsFront); nsDrawer.add(nsKnob); // Front + Knopf
  nsDrawer.add(box(0.34, 0.12, 0.34, M.woodDark, 0, 0.38, 0.02), box(0.12, 0.03, 0.17, std(0x2a1a14, { roughness: 0.6 }), -0.06, 0.45, 0.04), box(0.11, 0.006, 0.15, std(0xe6dcc3), 0.08, 0.442, 0.04)); nsR.add(nsDrawer); // Bibel, Briefbogen
  const nsGo = lift((k) => { nsDrawer.position.z = 0.22 * k; }, 0.5);
  add(place(hs("nachttisch", nsR, { act: { play: () => { nsGo(); snd("click"); return 600; } } }), "e", 0.88, 0, 0.25));
  const glassMat = new THREE.MeshPhongMaterial({ color: 0xc8d4dc, transparent: true, opacity: 0.35, shininess: 90 });
  const hg = group(cyl(0.06, 0.06, 0.02, M.wood, 0, 0.01, 0), cyl(0.06, 0.06, 0.02, M.wood, 0, 0.23, 0),
    cyl(0.045, 0.008, 0.1, glassMat, 0, 0.17, 0), cyl(0.008, 0.045, 0.1, glassMat, 0, 0.07, 0), cyl(0.008, 0.04, 0.05, lambert(0xc8a86a), 0, 0.045, 0),
    cyl(0.006, 0.006, 0.22, M.woodDark, 0.05, 0.12, 0), cyl(0.006, 0.006, 0.22, M.woodDark, -0.05, 0.12, 0));
  const four = label("4", 0.08, 0.08, "700 170px Georgia, serif", "#2a1408"); four.rotation.x = Math.PI / 2; four.position.y = -0.0015; hg.add(four);
  const hgA = inner(hg);
  const hgGo = lift((k) => { hgA.position.set(0, 0.3 * k, 0.25 * k); hgA.rotation.x = -1.5 * k; });
  add(place(hs("sanduhr", hg, { act: { play: () => { hgGo(); return 900; } } }), "e", 0.87, 0.55, 0.25));
  // Unter dem Bett: ohne Licht schwarz; Gepäckschein „6“ nur im Lichtkegel
  const under = group(), darkMat = basic(0x020202), litMat = lambert(0x231a14);
  const ub = plane(1.6, 1.9, darkMat); ub.rotation.x = -Math.PI / 2; ub.position.set(0, 0.003, 1.0); under.add(ub);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.26), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.95, depthWrite: false }));
  shade.rotation.y = -Math.PI / 2; const shades = [];
  [[0, 0.13, 2.0, 0], [-0.83, 0.13, 1.0, Math.PI / 2], [0.83, 0.13, 1.0, Math.PI / 2]].forEach(([x, y, z, r]) => { const s = shade.clone(); s.rotation.set(0, r, 0); if (r) s.scale.x = 1.1; s.position.set(x, y, z); under.add(s); shades.push(s); });
  const ubZone = box(1.6, 0.26, 2.1, ZONE, 0, 0.13, 1.05); under.add(ubZone);
  add(place(under, "e", 0.5, 0, 0.0));
  hs("unterbett", ubZone, { aimLocal: [0, 0, 1.04] }); // Testhilfe: auf den Spalt an der Vorderkante zielen
  const ticket = plane(0.13, 0.08, lambert(0xffffff, { map: ticketTex(), side: THREE.DoubleSide })); ticket.rotation.set(-Math.PI / 2, 0, 0.15);
  const tk = group(ticket, box(0.22, 0.1, 0.18, ZONE, 0, 0.05, 0)); ticket.position.y = 0.012;
  // an der Vorderkante, halb unter dem Bett – von oben nur im Spalt sichtbar (wie in 2D)
  add(place(hs("gepaeckschein", tk, { hideWhenHidden: true }), "e", 0.5, 0, 2.02));
  state((has, light) => { ub.material = light ? litMat : darkMat; shades.forEach((s) => { s.visible = !light; }); });

  /* ================= SÜD · Fenster ================= */
  // Draußen: Regen, im Blitz kurz die Westmauer mit dem schmalen Tor
  const outside = plane(2.2, 2.2, basic(0xffffff, { map: rainTex() }), 0, 1.6, -0.9);
  const court = plane(1.6, 1.6, new THREE.MeshBasicMaterial({ map: courtTex(), transparent: true, opacity: 0, depthWrite: false }), 0, 1.45, -0.85);
  anim((dt) => { outside.material.map.offset.y += dt * 0.9; const f = document.body.classList.contains("flash"); court.material.opacity = f ? 1 : Math.max(0, court.material.opacity - dt * 3); });
  const winGlass = new THREE.MeshLambertMaterial({ color: 0x9ab4c8, transparent: true, opacity: 0.1, depthWrite: false });
  const sash = (sx) => { const pv = new THREE.Group(); pv.position.set(sx * 0.75, 0, 0); const g = group(plane(0.72, 1.56, winGlass, -sx * 0.37, 1.6, 0), box(0.04, 1.6, 0.05, M.trim, -sx * 0.73, 1.6, 0), box(0.04, 1.6, 0.05, M.trim, -sx * 0.02, 1.6, 0), box(0.72, 0.04, 0.05, M.trim, -sx * 0.37, 2.38, 0), box(0.72, 0.04, 0.05, M.trim, -sx * 0.37, 0.82, 0), box(0.72, 0.03, 0.04, M.trim, -sx * 0.37, 1.6, 0)); pv.add(g); return pv; };
  const sashL = sash(-1), sashR = sash(1);
  const win = group(outside, court, sashL, sashR, box(1.62, 0.06, 0.18, M.trim, 0, 0.78, 0.06), box(1.62, 0.06, 0.08, M.trim, 0, 2.43, 0));
  add(place(hs(["fenster_offen", "fenster"], win), "s", 0.5, 0, 0.0));
  let winOpen = false; state((has) => { winOpen = has("fenster_auf"); });
  anim((dt) => { sashL.rotation.y = lerp(sashL.rotation.y, winOpen ? -1.25 : 0, Math.min(1, dt * 5)); });
  // Vorhänge (roter Samt), wehen bei offenem Fenster
  const curtain = (u) => { const c = group(); for (let i = 0; i < 7; i++) c.add(cyl(0.045, 0.05, 2.5, M.velvet, -0.24 + i * 0.08, 1.3, (i % 2) * 0.03, 12)); return place(c, "s", u, 0, 0.12); };
  const cL = curtain(0.31), cR = curtain(0.69);
  const mp = label("M + P", 0.12, 0.04, "italic 120px Georgia, serif", "#2a2a6a"); mp.position.set(0.0, 0.12, 0.06); mp.visible = false; cL.add(mp);
  const vGo = lift((k) => { mp.visible = k > 0.3; cL.children.forEach((c, i) => { if (c !== mp) { c.position.x = (c.userData.x0 ??= c.position.x) * (1 - 0.45 * k) - 0.1 * k; c.rotation.x = (i === 3 ? -0.35 : 0) * k; } }); }, 0.7);
  add(hs("vorhang", cL, { act: { play: () => { vGo(); snd("paper"); return 750; } } }), cR);
  add(place(box(2.4, 0.03, 0.03, M.brassDark, 0, 0, 0), "s", 0.5, 2.62, 0.12)); // Vorhangstange
  anim((dt, t) => { const k = winOpen ? 0.12 : 0.01; cL.children.forEach((b, i) => { b.rotation.x = Math.sin(t * 2.3 + i) * k; }); cR.children.forEach((b, i) => { b.rotation.x = Math.sin(t * 2.1 + i * 1.3) * k; }); });
  // Heizkörper (Ventil auf 0)
  const rad = group(); for (let i = 0; i < 10; i++) rad.add(box(0.08, 0.55, 0.08, lambert(0x2a2622), -0.45 + i * 0.1, 0.42, 0));
  rad.add(box(1.0, 0.04, 0.05, lambert(0x2a2622), 0, 0.68, 0), box(1.0, 0.04, 0.05, lambert(0x2a2622), 0, 0.16, 0));
  const valve = cyl(0.04, 0.04, 0.05, M.brassDark, 0.56, 0.5, 0); valve.rotation.z = Math.PI / 2; rad.add(valve);
  add(place(hs("heizung", rad), "s", 0.5, 0, 0.12));

  /* ================= WEST · Schreibtisch, Kommode, Schrank ================= */
  const desk = group(rbox(1.24, 0.05, 0.64, M.wood, 0, 0.76, 0, 0.015), rbox(1.12, 0.12, 0.54, M.woodDark, 0, 0.67, 0, 0.01));
  [[-0.56, -0.26], [0.56, -0.26], [-0.56, 0.26], [0.56, 0.26]].forEach(([x, z]) => { const l = turnedLeg(0.62, 0.035, M.woodDark); l.position.set(x, 0, z); desk.add(l); });
  const drawer = group(box(0.5, 0.11, 0.5, M.woodDark, 0, 0, -0.25), cyl(0.015, 0.015, 0.02, M.brass, 0, 0, 0.01)); drawer.children[1].rotation.x = Math.PI / 2;
  drawer.position.set(0.15, 0.67, 0.3); desk.add(drawer);
  add(place(desk, "w", 0.3, 0, 0.32));
  drawer.add(box(0.2, 0.004, 0.28, std(0xe9dfc6), -0.08, 0.06, -0.2), box(0.015, 0.004, 0.18, std(0xb8bcc0, { metalness: 1, roughness: 0.3 }), 0.1, 0.062, -0.2)); // Briefpapier, Brieföffner
  const dGo = lift((k) => { drawer.position.z = 0.3 + 0.28 * k; }, 0.5);
  add(place(hs("schreibtisch", group(box(0.52, 0.14, 0.06, ZONE, 0.15, 0.67, 0.62)), { act: { play: () => { dGo(); snd("click"); return 600; } } }), "w", 0.3, 0, 0.0));
  const chair = group(rbox(0.46, 0.06, 0.46, M.woodDark, 0, 0.46, 0, 0.015), rbox(0.42, 0.06, 0.42, M.velvet, 0, 0.5, 0, 0.025), rbox(0.46, 0.5, 0.04, M.woodDark, 0, 0.75, -0.21, 0.015), rbox(0.3, 0.3, 0.02, M.velvet, 0, 0.78, -0.19, 0.01));
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => { const l = turnedLeg(0.44, 0.024, M.woodDark); l.position.set(x, 0, z); chair.add(l); });
  chair.rotation.y = Math.PI; add(place(chair, "w", 0.32, 0, 1.0));
  // Kerzenständer mit brennender Kerze
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 10), basic(0xffd27a));
  const candle = group(cyl(0.06, 0.07, 0.02, M.brass, 0, 0.01, 0), cyl(0.012, 0.016, 0.22, M.brass, 0, 0.12, 0), cyl(0.04, 0.03, 0.03, M.brass, 0, 0.24, 0), cyl(0.02, 0.02, 0.14, lambert(0xefe6d2), 0, 0.32, 0), flame);
  flame.position.y = 0.42; candle.add(box(0.14, 0.5, 0.14, ZONE, 0, 0.22, 0));
  const one = label("1", 0.06, 0.06, "700 170px Georgia, serif", "#2a2119", "#e6dcc3"); one.rotation.x = Math.PI / 2; one.position.y = -0.0015; candle.add(one);
  const cA = inner(candle);
  const cGo = lift((k) => { cA.position.set(0, 0.32 * k, 0.28 * k); cA.rotation.x = -1.35 * k; });
  add(place(hs("kerzenstaender", candle, { act: { play: () => { cGo(); return 900; } } }), "w", 0.19, 0.785, 0.28));
  const candleL = new THREE.PointLight(0xffb45a, 4, 0, 2); place(candleL, "w", 0.19, 1.25, 0.32); add(candleL);
  anim((dt, t) => { const f = 0.85 + Math.sin(t * 17) * 0.06 + Math.sin(t * 7.3) * 0.05 + (Math.random() - 0.5) * 0.08; candleL.intensity = 4 * f; flame.scale.set(1, f, 1); });
  // Blatt auf dem Schreibtisch (erst nach dem Fensterereignis)
  const sheet = plane(0.21, 0.28, lambert(0xffffff, { map: sheetTex() })); sheet.rotation.set(-Math.PI / 2, 0, -0.2);
  add(place(hs("blatt", group(sheet, box(0.26, 0.04, 0.3, ZONE, 0, 0.02, 0)), { hideWhenHidden: true }), "w", 0.31, 0.79, 0.4));
  // Kommode mit Ziffernschloss; darauf das Porträtfoto
  const kom = group(rbox(1.1, 0.95, 0.5, M.wood, 0, 0.5, 0, 0.015), rbox(1.18, 0.04, 0.56, M.woodDark, 0, 0.99, 0.01, 0.012), rbox(1.12, 0.08, 0.52, M.woodDark, 0, 0.04, 0, 0.01));
  [0.62, 0.34].forEach((y) => { kom.add(panel(1.0, 0.24, M.woodDark, 0, y, 0.255, 0.04, 0.008)); [-0.3, 0.3].forEach((x) => kom.add(cyl(0.016, 0.016, 0.03, M.brass, x, y, 0.29).rotateX(Math.PI / 2))); });
  const top = group(rbox(1.0, 0.2, 0.46, M.woodDark, 0, 0, -0.22, 0.012), cyl(0.015, 0.015, 0.02, M.brass, -0.3, 0, 0.01), cyl(0.015, 0.015, 0.02, M.brass, 0.3, 0, 0.01));
  top.children[1].rotation.x = top.children[2].rotation.x = Math.PI / 2; top.position.set(0, 0.86, 0.255); kom.add(top);
  // Ziffernschloss direkt bedienen (Nahansicht), Prüfung durch die Engine (Rätsel „anordnung“)
  const kLock = combinationLock(ctx, { pid: "anordnung", brass: M.brass, dark: std(0x120e0b, { roughness: 0.6 }) });
  const lock = kLock.group; lock.scale.setScalar(0.42); lock.position.set(0, 0, 0.012); top.add(lock);
  const komSpec = { when: () => !eng().isSolved("anordnung"), cam: [0, 0.86, 0.66], center: [0, 0.86, 0.27], fov: 38, exitDelay: 1600,
    hint: "Rollen antippen oder wischen · Bügel ziehen zum Öffnen", value: kLock.value, parts: kLock.parts };
  add(place(hs("kommode", kom, { focus: komSpec }), "w", 0.61, 0, 0.25));
  let komOpen = false; state((has) => { komOpen = has("kommode_open"); lock.visible = !komOpen; });
  anim((dt) => { top.position.z = lerp(top.position.z, komOpen ? 0.6 : 0.255, Math.min(1, dt * 4)); });
  const photo = group(ornateFrame(0.2, 0.26, lambert(0xffffff, { map: portraitTex() }), brassMat(0x9a7434, 0.35), 0.02, 0.025)); photo.children[0].position.y = 0.13;
  photo.rotation.x = -0.12;
  const three = label("3", 0.14, 0.18, "600 210px Georgia, serif", "#efe9da", "#3a2c22"); three.rotation.y = Math.PI; three.position.set(0, 0.13, -0.012); photo.add(three); // Kreide auf der Rückseite
  const phA = inner(photo);
  const phGo = lift((k) => { phA.position.set(0.6 * k, 0.55 * k, 1.5 * k); phA.rotation.set(0.12 * k, Math.PI * Math.min(1, k * 1.3), 0); phA.scale.setScalar(1 + k * 0.6); }, 1.0);
  add(place(hs(["portraet217_mara", "portraet217"], photo, { act: { play: () => { phGo(); snd("paper"); return 1100; } } }), "w", 0.6, 1.0, 0.22));
  // Kleiderschrank mit Buchstabenrädern und Schnitzerei „Wer nachts wacht“
  // Kleiderschrank: Korpus, Kranzgesims, gedrechselte Füße, Türen mit Kassetten – Schnitzerei (2,16 m) und Buchstabenräder (1,3 m) bleiben frei
  const ward = group(rbox(1.15, 2.2, 0.58, M.woodDark, 0, 1.2, 0, 0.02), rbox(1.27, 0.08, 0.66, M.trim, 0, 2.34, 0.02, 0.02), rbox(1.33, 0.06, 0.7, M.trim, 0, 2.41, 0.03, 0.02), rbox(1.2, 0.08, 0.62, M.trim, 0, 0.14, 0.01, 0.02));
  [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.24], [0.5, 0.24]].forEach(([x, z]) => { const l = turnedLeg(0.1, 0.04, M.woodDark); l.position.set(x, 0, z); ward.add(l); });
  const carve = plane(0.92, 0.14, lambert(0xffffff, { map: carveTex() }), 0, 2.16, 0.292); ward.add(carve);
  const doorPv = (sx) => { const pv = new THREE.Group(); pv.position.set(sx * 0.57, 0, 0.292); pv.add(rbox(0.56, 1.95, 0.03, M.wood, -sx * 0.28, 1.1, 0.015, 0.008), panel(0.44, 0.6, M.woodDark, -sx * 0.28, 1.66, 0.032, 0.05, 0.008), panel(0.44, 0.68, M.woodDark, -sx * 0.28, 0.62, 0.032, 0.05, 0.008)); pv.add(box(0.02, 0.2, 0.03, M.brass, -sx * 0.52, 1.1, 0.04)); ward.add(pv); return pv; };
  const wdL = doorPv(-1), wdR = doorPv(1);
  // Buchstabenschloss direkt bedienen (Rätsel „schrank“), darüber die Schnitzerei „Wer nachts wacht“
  const wLock = combinationLock(ctx, { pid: "schrank", symbols: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", count: 5, brass: M.brass, dark: std(0x120e0b, { roughness: 0.6 }), handle: "knopf" });
  const wheels = wLock.group; wheels.scale.setScalar(0.42); wheels.position.set(0, 1.3, 0.325); ward.add(wheels);
  const wardSpec = { when: () => !eng().isSolved("schrank"), cam: [0, 1.32, 0.86], center: [0, 1.3, 0.34], fov: 40, exitDelay: 1600,
    hint: "„Wer nachts wacht“ · Räder antippen oder wischen · Knopf drücken", value: wLock.value, parts: wLock.parts };
  ward.add(box(1.0, 0.03, 0.02, M.brassDark, 0, 1.85, 0.0)); // Kleiderstange innen
  add(place(hs("schrank", ward, { focus: wardSpec }), "w", 0.87, 0, 0.3));
  let wOpen = false; state((has) => { wOpen = has("schrank_open"); wheels.visible = !wOpen; });
  anim((dt) => { const k = Math.min(1, dt * 3); wdL.rotation.y = lerp(wdL.rotation.y, wOpen ? -1.7 : 0, k); wdR.rotation.y = lerp(wdR.rotation.y, wOpen ? 1.7 : 0, k); });

  // Deckenleuchte (schwach), Grundstimmung
  const ceilLamp = group(cyl(0.18, 0.1, 0.08, lambert(0xd8c9a8, { emissive: 0x5a4424 }), 0, -0.05, 0));
  ceilLamp.position.set(0, H, 0); add(ceilLamp);
  const ceilL = new THREE.PointLight(0xffc98a, 9, 0, 2); ceilL.position.set(0, H - 0.4, 0); add(ceilL);
  // Wandleuchte neben der Tür (Nordseite liegt sonst im Dunkeln)
  const wl = group(box(0.07, 0.14, 0.04, M.brassDark), cyl(0.05, 0.09, 0.13, lambert(0xd9b98a, { emissive: 0x8a5a24 }), 0, 0.1, 0.09, 16));
  add(place(wl, "n", 0.33, 2.0, 0.02));
  const wlL = new THREE.PointLight(0xffb36b, 4, 0, 2); place(wlL, "n", 0.33, 2.1, 0.35); add(wlL);
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.3 };
});
ready();
