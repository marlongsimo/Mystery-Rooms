/*
 * STATION 4 – DAS HOTELARCHIV in 3D (HD)
 * Aufbau nach den 2D-Ansichten (js/rooms/04-archiv.js): Nord Eingang/Regal/Lesetisch · Ost Schreibtisch · Süd Aktenschrank · West Planschrank/Stahltür.
 * Erdgeschoss, trocken, 5,6 × 5,6 m, 3,2 m hoch. Licht: grüne Bankerlampe (brennt), schwache Hängelampe, Staub im Licht.
 * Zustände: archiv_ereignis (Milchglastür fällt zu, Protokollbuch liegt aufgeschlagen auf dem Lesetisch) · fach_offen ·
 * fachw_offen · planlade_offen · sicherheit_offen.
 * Bildhinweise: Jahresordner (2009 dünn) · „Wohin?“ + acht Buchstabenräder · Brief „GHU ZHVWJDQJ LVW RIIHQ“ · Chiffrierscheibe ·
 * Schublade W mit Kratzspuren · Karton „PERSONAL 2009“ · Akte „VOSS, E.“ · Protokolle „A · 117“ / „B · 118“ ·
 * „SICHERHEITSBEREICH UG – ZUTRITT NUR PERSONAL“ · Zahlenfeld mit rotem/grünem Lämpchen.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, basic, ZONE, box, cyl, plane, group } from "./core.js?v=3";
import { textTex, plankTex, plaqueTex, shell } from "./kit.js?v=2";
import { woodMat, brassMat, velvetMat, std, damask, persian, rbox, panel, turnedLeg, ornateFrame } from "./hd.js?v=2";
import { tag } from "./gfx.js?v=1";
import { combinationLock, twister, lift } from "./interact.js?v=3";

const R = 2.8, H = 3.2;
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ---------- Texturen ---------- */
const spineTex = (color, label = "", thin = false) => textTex(64, 256, color, (g, w, h) => {
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
  g.fillStyle = "#cdbd9b"; g.globalAlpha = 0.8; g.fillRect(thin ? 18 : 10, 40, thin ? 28 : 44, 70); g.globalAlpha = 1;
  g.beginPath(); g.fillStyle = "#1a120c"; g.arc(32, 200, thin ? 7 : 11, 0, Math.PI * 2); g.fill(); // Griffloch
  if (label) { g.save(); g.translate(32, 75); g.rotate(-Math.PI / 2); g.fillStyle = "#2a2119"; g.font = `600 ${thin ? 20 : 26}px DM Mono, monospace`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(label, 0, 0); g.restore(); }
  g.globalAlpha = 0.15; for (let i = 0; i < 300; i++) { g.fillStyle = "#000"; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
});
const boxTex = (label) => textTex(256, 128, "#6b5a44", (g, w, h) => {
  g.strokeStyle = "#3a2c1b"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = "#cfc3a6"; g.fillRect(48, 34, 160, 56);
  g.fillStyle = "#2a2119"; g.font = "600 24px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(label, 128, 63);
});
const frostTex = () => textTex(256, 384, "#c8c0a8", (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 220); gr.addColorStop(0, "#ddd6c2"); gr.addColorStop(1, "#8a8676"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w, 0); g.scale(-1, 1); // von innen gelesen: spiegelverkehrt
  g.fillStyle = "#5a5648"; g.font = "500 34px DM Mono, monospace"; g.textAlign = "center"; if ("letterSpacing" in g) g.letterSpacing = "10px"; g.fillText("ARCHIV", w / 2 + 5, h / 2); g.restore();
});
const dustTex = () => textTex(256, 128, null, (g, w, h) => {
  g.fillStyle = "rgba(150,140,120,.32)"; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.3; for (let i = 0; i < 1500; i++) { g.fillStyle = "#c8bca0"; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
  g.globalAlpha = 1; g.clearRect(78, 30, 100, 66); // sauberes Rechteck: hier lag ein Buch
  g.strokeStyle = "rgba(190,180,160,.5)"; g.lineWidth = 2; g.strokeRect(78, 30, 100, 66);
});
const bookPageTex = () => textTex(256, 180, "#e3d4b4", (g) => {
  g.fillStyle = "#2a2119"; g.font = "600 13px DM Mono, monospace"; g.fillText("PROTOKOLLBUCH 2009", 18, 22);
  g.font = "12px DM Mono, monospace";
  [["PR-09/116", "Heizung"], ["PR-09/117", "Aufzug, Jahresprüfung"], ["PR-09/118", "Servicetunnel West"], ["PR-09/119", "Notstrom"]].forEach(([n, t], i) => {
    if (i === 1) { g.fillStyle = "rgba(190,60,40,.25)"; g.fillRect(12, 44 + i * 26, 232, 20); g.fillStyle = "#2a2119"; }
    g.fillText(n, 18, 58 + i * 26); g.fillText(t, 110, 58 + i * 26);
  });
});
const letterTex = () => textTex(256, 190, "#efe6d2", (g) => {
  g.fillStyle = "#4a4a5a"; g.font = "13px DM Mono, monospace"; g.fillText("Elias – 27.09.2009", 18, 26);
  g.fillStyle = "#2a2a6a"; g.font = "600 21px DM Mono, monospace"; g.fillText("GHU ZHVWJDQJ", 18, 74); g.fillText("LVW RIIHQ", 18, 102);
  g.fillStyle = "#4a4a5a"; g.font = "13px DM Mono, monospace"; g.fillText("– T.", 18, 132);
  g.fillStyle = "#6a3a2a"; g.font = "italic 13px Georgia, serif"; g.fillText("Er liest unsere Post mit. Deshalb so.", 18, 172);
});
const typeSheetTex = () => textTex(256, 200, "#f1ead8", (g) => {
  g.fillStyle = "#2a2a2a"; g.font = "15px DM Mono, monospace"; g.fillText("Hiermit kündige ich", 20, 150); g.fillText("zum –", 20, 172);
});
const cipherTex = (r0, r1, bg, fg, hub) => canvasTex(512, 512, (g, w) => {
  const c = w / 2; g.clearRect(0, 0, w, w);
  g.fillStyle = bg; g.beginPath(); g.arc(c, c, r0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#3a2c1b"; g.lineWidth = 4; g.stroke();
  g.fillStyle = fg; g.font = `600 ${Math.round((r0 - r1) * 0.55)}px DM Mono, monospace`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2 - Math.PI / 2, rr = (r0 + r1) / 2; g.save(); g.translate(c + rr * Math.cos(a), c + rr * Math.sin(a)); g.rotate(a + Math.PI / 2); g.fillText(ABC[i], 0, 0); g.restore(); }
  if (hub) { g.fillStyle = hub; g.beginPath(); g.arc(c, c, r1 * 0.8, 0, Math.PI * 2); g.fill(); g.fillStyle = "#e6d2a0"; g.font = "600 22px Georgia, serif"; g.fillText("NOCTURNE", c, c); }
});
const wheelsTex = () => textTex(512, 120, "#120e0b", (g) => {
  g.strokeStyle = "#b69a6d"; g.lineWidth = 4; g.strokeRect(2, 2, 508, 116);
  for (let i = 0; i < 8; i++) { g.fillStyle = "#2a2016"; g.fillRect(16 + i * 61, 14, 52, 92); g.fillStyle = "#e0c896"; g.font = "600 46px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A", 42 + i * 61, 62); }
});
const carveTex = () => plaqueTex("Wohin?", 384, 96, "#c9a86a", "#2a1d14", "italic 52px Georgia, serif", 2);
const drawerLabel = (c) => textTex(96, 72, "#cdbd9b", (g, w, h) => {
  g.strokeStyle = "#6e5632"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = "#2a2119"; g.font = "600 44px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(c, w / 2, h / 2 + 2);
});
const scratchTex = () => textTex(128, 64, null, (g) => {
  g.strokeStyle = "rgba(225,205,160,.9)"; g.lineWidth = 2;
  [[20, 18, 40, 34], [70, 12, 96, 40], [50, 26, 62, 48], [88, 20, 108, 30]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
});
const protoTex = (label) => textTex(256, 180, "#efe6d2", (g) => {
  g.fillStyle = "#3a2a1e"; g.font = "600 22px DM Mono, monospace"; g.fillText(label, 20, 34);
  g.fillStyle = "#6c5a44"; for (let i = 0; i < 6; i++) g.fillRect(20, 60 + i * 18, 80 + ((i * 53) % 130), 3);
  g.strokeStyle = "rgba(140,40,40,.6)"; g.lineWidth = 3; g.beginPath(); g.ellipse(196, 150, 34, 18, -0.2, 0, Math.PI * 2); g.stroke(); // Stempel
});
const planTex = () => textTex(512, 320, "#e8dec6", (g, w, h) => {
  g.strokeStyle = "#2a3a5a"; g.lineWidth = 2; g.globalAlpha = 0.7;
  g.strokeRect(160, 60, 300, 120); g.beginPath(); g.moveTo(250, 60); g.lineTo(250, 180); g.moveTo(400, 60); g.lineTo(400, 180); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(160, 140); g.lineTo(90, 140); g.lineTo(50, 210); g.lineTo(26, 210); g.stroke();
  g.globalAlpha = 1; g.fillStyle = "#2a3a5a"; g.font = "600 16px DM Mono, monospace"; g.fillText("BESTANDSPLAN 1998", 170, 36);
});
const keypadTex = () => textTex(128, 200, "#1a1a18", (g) => {
  g.strokeStyle = "#5d5d56"; g.lineWidth = 4; g.strokeRect(2, 2, 124, 196);
  g.fillStyle = "#0b2a1e"; g.fillRect(16, 14, 96, 30);
  g.fillStyle = "#4a4a44"; g.font = "600 20px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  "123456789*0#".split("").forEach((k, i) => { const x = 28 + (i % 3) * 36, y = 66 + Math.floor(i / 3) * 32; g.fillStyle = "#3d3d38"; g.fillRect(x - 14, y - 12, 28, 26); g.fillStyle = "#b8b8a8"; g.fillText(k, x, y + 1); });
});
const steelTex = () => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = "#4a4a44"; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.18; for (let i = 0; i < 3000; i++) { g.fillStyle = Math.random() > 0.5 ? "#222" : "#777"; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
  g.globalAlpha = 0.35; g.fillStyle = "#5a3a22"; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(Math.random() * w, h - Math.random() * 120, 20, 8, 0, 0, Math.PI * 2); g.fill(); } // Rost unten
});

defineRoom("archiv", (ctx) => {
  const { add, hs, state, anim, lerp } = ctx;
  const snd = ctx.sound, eng = ctx.engine;
  const inner = (g) => { const a = new THREE.Group(); while (g.children.length) a.add(g.children[0]); g.add(a); return a; }; // innen animieren, außen bleibt die Platzierung
  const M = {
    wall: tag(lambert(0xffffff, { map: damask("#1e1a12", "#2c2618", "#4e4630") }), { roughness: 0.85, normal: 0.9 }),
    floor: tag(lambert(0xffffff, { map: plankTex("#2a1d14", "#120b06") }), { roughness: 0.55, clearcoat: 0.2, normal: 1.6, envMapIntensity: 0.4 }),
    ceil: tag(lambert(0x15110c), { roughness: 0.95 }), trim: woodMat("#20140c", "#0e0804"), wood: woodMat("#3e2616", "#1e1008"),
    woodDark: woodMat("#2a180c", "#120a04"), woodLight: woodMat("#5a3a20", "#2a1a0c"), brass: brassMat(), brassDark: brassMat(0x6e5632, 0.45),
    black: tag(lambert(0x0c0a09), { roughness: 0.4 }), paper: std(0xe9dfc6, { roughness: 0.95 }), card: std(0x6b5a44, { roughness: 0.9 }),
    steel: std(0xffffff, { map: steelTex(), metalness: 0.7, roughness: 0.5 }), velvet: velvetMat(0x2a3a2a, 0x6a8a6a),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim, wainscot: { h: 1.0, mat: M.woodDark },
    holes: { n: [{ x: -R + 2 * R * 0.22, y: 0, w: 1.0, h: 2.25 }], w: [{ x: -R + 2 * R * 0.74, y: 0, w: 1.0, h: 2.2 }] },
  });
  // Läufer, abgetreten
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.012, 1.6), tag(lambert(0xffffff, { map: persian("#3a2418", "#1a2422", "#8a6a3a") }), { roughness: 0.95, normal: 2.2 })); rug.position.set(0, 0.006, 0.1); add(rug);

  /* ================= NORD · Eingang, Regal mit Jahresordnern, Lesetisch ================= */
  // Treppe hinab ins Gepäcklager hinter der Milchglastür
  const well = group(box(1.0, 0.05, 2.6, M.ceil, 0, 2.6, -1.3), box(0.05, 2.6, 2.6, M.wall, -0.5, 1.3, -1.3), box(0.05, 2.6, 2.6, M.wall, 0.5, 1.3, -1.3), box(1.0, 2.6, 0.05, basic(0x050403), 0, 0.2, -2.6));
  for (let i = 0; i < 7; i++) well.add(box(0.95, 0.05, 0.3, lambert(0x3a3630), 0, -0.2 * (i + 1) + 0.02, -0.35 - i * 0.3));
  well.add(box(1.0, 0.04, 0.3, lambert(0x3a3630), 0, -0.01, -0.15));
  const doorPv = new THREE.Group(); doorPv.position.set(-0.5, 0, -0.03);
  const aDoor = group(rbox(0.98, 2.22, 0.05, M.woodDark, 0.49, 1.11, 0, 0.01), plane(0.66, 1.0, std(0xffffff, { map: frostTex(), roughness: 0.25, transparent: true, opacity: 0.92, side: THREE.DoubleSide }), 0.49, 1.42, 0.03));
  aDoor.add(cyl(0.012, 0.012, 0.14, M.brass, 0.86, 1.0, 0.05).rotateZ(Math.PI / 2));
  doorPv.add(aDoor);
  const frame = group(box(0.08, 2.3, 0.08, M.trim, -0.54, 1.15, 0), box(0.08, 2.3, 0.08, M.trim, 0.54, 1.15, 0), box(1.16, 0.08, 0.08, M.trim, 0, 2.29, 0));
  add(place(group(well, doorPv, frame), "n", 0.22, 0, 0));
  add(place(hs("archiv_eingang", group(box(1.0, 2.25, 0.3, ZONE, 0, 1.12, 0))), "n", 0.22, 0, 0));
  let ereignis = false; state((has) => { ereignis = has("archiv_ereignis"); });
  anim((dt) => { doorPv.rotation.y = lerp(doorPv.rotation.y, ereignis ? 0 : 1.05, Math.min(1, dt * (ereignis ? 9 : 3))); });

  // Wandregal bis unter die Decke
  const shelf = group(rbox(2.7, 3.0, 0.04, M.woodDark, 0, 1.5, 0.02, 0.01), rbox(0.06, 3.0, 0.42, M.woodDark, -1.35, 1.5, 0.21, 0.01), rbox(0.06, 3.0, 0.42, M.woodDark, 1.35, 1.5, 0.21, 0.01), rbox(2.8, 0.08, 0.48, M.trim, 0, 3.04, 0.24, 0.01));
  const boards = [0.1, 0.82, 1.54, 2.26];
  boards.forEach((y) => shelf.add(rbox(2.66, 0.035, 0.4, M.woodDark, 0, y, 0.21, 0.006)));
  const cols = ["#4a1f1c", "#243330", "#54432b", "#33251c", "#2c3a33", "#5b4a2f", "#3a2a22", "#4a3424", "#2a2a3a"];
  const genTex = cols.map((c) => spineTex(c));
  const binder = (x, y, w, h, tex) => { const b = group(box(w, h, 0.3, std(0xffffff, { map: tex, roughness: 0.8 }), 0, h / 2, 0)); b.position.set(x, y, 0.22); return b; };
  // Reihe in Augenhöhe-unten (Brett 0,82): Jahresordner 1995–2009, 2009 auffallend dünn; rechts das rote Protokollbuch
  let x = -1.24;
  for (let yr = 1995; yr <= 2009; yr++) { const thin = yr === 2009, w = thin ? 0.035 : 0.075; shelf.add(binder(x + w / 2, 0.84, w, 0.33 - ((yr * 7) % 4) * 0.01, spineTex(cols[yr % 9], String(yr), thin))); x += w + 0.008; }
  while (x < 1.0) { const w = 0.07 + Math.random() * 0.02; shelf.add(binder(x + w / 2, 0.84, w, 0.3 - Math.random() * 0.04, genTex[Math.floor(Math.random() * 9)])); x += w + 0.008; }
  // übrige Reihen: Ordner und Archivkartons
  [[0.12, 0], [1.56, 1], [2.28, 2]].forEach(([y, row]) => {
    let xx = -1.26;
    while (xx < 1.18) { if (row === 2 && xx > -0.2 && xx < 0.6) { shelf.add(group(box(0.38, 0.28, 0.34, M.card, 0, 0.14, 0), plane(0.3, 0.15, lambert(0xffffff, { map: boxTex("ARCHIV") }), 0, 0.14, 0.171)).translateX(xx + 0.19).translateY(y + 0.02).translateZ(0.22)); xx += 0.42; continue; }
      const w = 0.07 + Math.random() * 0.02; shelf.add(binder(xx + w / 2, y + 0.02, w, 0.3 - Math.random() * 0.04, genTex[Math.floor(Math.random() * 9)])); xx += w + 0.01; }
  });
  add(place(hs("jahresordner", shelf), "n", 0.63, 0, 0));
  // Protokollbuch 2009 (rot) rechts in der Jahresreihe – verschwindet beim Ereignis
  const pBook = group(box(0.05, 0.3, 0.24, std(0x7a2a24, { roughness: 0.6 }), 0, 0.15, 0), plane(0.03, 0.2, lambert(0xffffff, { map: textTex(32, 256, "#7a2a24", (g) => { g.save(); g.translate(16, 128); g.rotate(-Math.PI / 2); g.fillStyle = "#e6dcc3"; g.font = "600 15px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PROTOKOLLE 2009", 0, 0); g.restore(); }) }), 0, 0.15, 0.121));
  pBook.add(box(0.09, 0.34, 0.28, ZONE, 0, 0.16, 0));
  const pbA = inner(pBook); const pbGo = lift(ctx, (k) => { pbA.position.z = 0.16 * k; pbA.rotation.z = 0.12 * k; }, 0.5);
  add(place(hs("protokollbuch_regal", pBook, { hideWhenHidden: true, act: { play: () => { pbGo(); snd("paper"); return 600; } } }), "n", 0.63 + 1.12 / (2 * R), 0.86, 0.24));

  // Lesetisch vor dem Regal; Staubrechteck, nach dem Ereignis das aufgeschlagene Buch
  const table = group(rbox(1.3, 0.05, 0.66, M.wood, 0, 0.76, 0, 0.015), rbox(1.2, 0.1, 0.56, M.woodDark, 0, 0.68, 0, 0.01));
  [[-0.58, -0.26], [0.58, -0.26], [-0.58, 0.26], [0.58, 0.26]].forEach(([lx, lz]) => { const l = turnedLeg(0.64, 0.035, M.woodDark); l.position.set(lx, 0, lz); table.add(l); });
  const dust = plane(0.9, 0.45, new THREE.MeshLambertMaterial({ map: dustTex(), transparent: true, depthWrite: false })); dust.rotation.x = -Math.PI / 2; dust.position.set(0, 0.787, 0); table.add(dust);
  table.add(box(1.3, 0.8, 0.66, ZONE, 0, 0.4, 0)); // ganze Tischfläche klickbar (nicht nur die Platte)
  add(place(hs("lesetisch", table), "n", 0.6, 0, 1.15));
  const pageM = lambert(0xffffff, { map: bookPageTex() }), coverM = std(0x7a2a24, { roughness: 0.6 });
  const openBook = group();
  [-1, 1].forEach((s) => { const half = group(box(0.22, 0.012, 0.3, coverM, 0, 0, 0), box(0.2, 0.02, 0.28, M.paper, 0, 0.014, 0)); half.position.x = s * 0.11; half.rotation.z = -s * 0.06; openBook.add(half); });
  const pages = plane(0.4, 0.28, pageM); pages.rotation.x = -Math.PI / 2; pages.position.y = 0.028; openBook.add(pages);
  openBook.add(box(0.008, 0.002, 0.18, lambert(0x8a1e18), 0, 0.03, 0.18)); // Lesebändchen
  openBook.add(box(0.48, 0.08, 0.34, ZONE, 0, 0.03, 0)); openBook.rotation.y = 0.12;
  add(place(hs("protokollbuch_tisch", openBook, { hideWhenHidden: true }), "n", 0.6, 0.79, 1.15));
  state((has) => { dust.visible = !has("archiv_ereignis"); });

  /* ================= OST · Schreibtisch ================= */
  const desk = group(rbox(2.0, 0.06, 0.86, M.wood, 0, 0.78, 0, 0.02), rbox(0.5, 0.72, 0.8, M.woodDark, -0.72, 0.38, 0, 0.015), rbox(0.5, 0.72, 0.8, M.woodDark, 0.72, 0.38, 0, 0.015), rbox(0.94, 0.04, 0.8, M.woodDark, 0, 0.56, 0, 0.01));
  [[-0.72, 0.56], [-0.72, 0.22], [0.72, 0.56], [0.72, 0.22]].forEach(([dx, dy]) => { desk.add(panel(0.42, 0.28, M.wood, dx, dy, 0.405, 0.04, 0.008)); desk.add(cyl(0.012, 0.012, 0.03, M.brass, dx, dy, 0.43).rotateX(Math.PI / 2)); });
  desk.add(rbox(1.92, 0.035, 0.6, std(0x24402e, { roughness: 0.75 }), 0, 0.81, 0.02, 0.008)); // grüne Schreibunterlage (Leder)
  add(place(desk, "e", 0.5, 0, 0.45));
  // Mittelschublade mit acht Buchstabenrädern, darüber „Wohin?“
  const fach = group(rbox(0.9, 0.18, 0.76, M.wood, 0, 0, -0.38, 0.01), plane(0.38, 0.09, lambert(0xffffff, { map: wheelsTex() }), 0, -0.02, 0.012), plane(0.22, 0.055, lambert(0xffffff, { map: carveTex() }), 0, 0.055, 0.011));
  fach.add(rbox(0.5, 0.012, 0.32, M.paper, 0, 0.08, -0.25, 0.004)); // dünne Akte im Fach
  fach.position.set(0, 0.66, 0.41);
  // acht Buchstabenräder am Fach (Rätsel „fach“), direkt bedienbar
  fach.children[1].visible = false;
  const fLock = combinationLock(ctx, { pid: "fach", symbols: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", count: 8, brass: M.brass, dark: std(0x120e0b, { roughness: 0.6 }), handle: "knopf" });
  fLock.group.scale.setScalar(0.3); fLock.group.position.set(0, -0.03, 0.012); fach.add(fLock.group);
  const fachSpec = { when: () => !eng().isSolved("fach"), cam: [0, 0.67, 0.86], center: [0, 0.645, 0.42], fov: 34, exitDelay: 1600,
    hint: "„Wohin?“ · Räder antippen oder wischen · Knopf drücken", value: fLock.value, parts: fLock.parts };
  const fachG = group(fach); add(place(hs("schreibtischfach", fachG, { focus: fachSpec }), "e", 0.5, 0, 0.45));
  let fOpen = false; state((has) => { fOpen = has("fach_offen"); fLock.group.visible = !fOpen; });
  anim((dt) => { fach.position.z = lerp(fach.position.z, fOpen ? 0.78 : 0.41, Math.min(1, dt * 3)); });
  // Grüne Bankerlampe (brennt) – Hauptlicht mit Schatten
  const shadeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.34, 24, 1, true, 0, Math.PI); shadeGeo.rotateZ(Math.PI / 2);
  const shade = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0x1e5a3a, emissive: 0x2a8a50, emissiveIntensity: 0.6, roughness: 0.15, side: THREE.DoubleSide }));
  shade.position.set(0, 0.42, 0.04);
  const lamp = group(rbox(0.26, 0.04, 0.16, M.brass, 0, 0.02, 0, 0.01), cyl(0.012, 0.012, 0.36, M.brass, 0, 0.22, -0.04), shade, cyl(0.004, 0.004, 0.12, M.brass, 0.1, 0.3, 0.06));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), basic(0xfff0c8)); bulb.position.set(0, 0.37, 0.05); lamp.add(bulb);
  lamp.add(box(0.36, 0.5, 0.26, ZONE, 0, 0.25, 0));
  let lampOff = 0; const chain = lamp.children[3];
  const lampGo = () => { lampOff = 0.6; snd("click"); setTimeout(() => snd("click"), 500); };
  add(place(hs("leselampe", lamp, { act: { play: () => { lampGo(); return 700; } } }), "e", 0.5 - 0.72 / (2 * R), 0.83, 0.55));
  anim((dt) => { if (lampOff > 0) { lampOff -= dt; chain.position.y = 0.3 - (lampOff > 0.4 ? 0.03 : 0); } else chain.position.y = 0.3; });
  const lampL = new THREE.PointLight(0xffd8a0, 6, 0, 2); place(lampL, "e", 0.5 - 0.72 / (2 * R), 1.12, 0.7); lampL.userData.shadow = true; add(lampL);
  anim((dt, t) => { lampL.intensity = lampOff > 0.05 && lampOff < 0.5 ? 0.2 : 6 * (0.97 + Math.sin(t * 9) * 0.015 + (Math.random() - 0.5) * 0.02); });
  // Schreibmaschine mit eingespanntem Blatt
  const tw = group(rbox(0.42, 0.1, 0.32, std(0x1f1c19, { roughness: 0.35, metalness: 0.3 }), 0, 0.05, 0, 0.03), rbox(0.42, 0.08, 0.12, std(0x1f1c19, { roughness: 0.35, metalness: 0.3 }), 0, 0.12, -0.1, 0.03));
  const platen = cyl(0.03, 0.03, 0.46, M.black, 0, 0.17, -0.12); platen.rotation.z = Math.PI / 2; tw.add(platen);
  const sheet = plane(0.22, 0.17, lambert(0xffffff, { map: typeSheetTex(), side: THREE.DoubleSide }), 0, 0.25, -0.13); sheet.rotation.x = -0.25; tw.add(sheet);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) tw.add(cyl(0.011, 0.011, 0.012, std(0x3a3530, { roughness: 0.4 }), -0.16 + i * 0.04 + r * 0.01, 0.105 + r * 0.012, 0.11 - r * 0.045, 10));
  tw.rotation.y = 0.1; tw.add(box(0.48, 0.32, 0.36, ZONE, 0, 0.14, 0));
  const twKeys = tw.children.slice(4, 31); let typeT = -1;
  anim((dt) => { if (typeT < 0) return; typeT += dt; const n = Math.floor(typeT * 9); twKeys.forEach((k, i) => { k.position.y = (k.userData.y0 ??= k.position.y) - ((i * 7 + n * 5) % 27 === 0 && typeT < 1.1 ? 0.004 : 0); }); platen.position.x = -0.05 * Math.min(1, typeT); if (typeT > 1.4) { typeT = -1; platen.position.x = 0; } });
  add(place(hs("schreibmaschine", tw, { act: { play: () => { typeT = 0; [0, 110, 230, 340, 470, 600].forEach((ms) => setTimeout(() => snd("key"), ms)); return 800; } } }), "e", 0.5 - 0.3 / (2 * R), 0.83, 0.5));
  // Brief von Tomasz
  const letter = plane(0.22, 0.165, lambert(0xffffff, { map: letterTex() })); letter.rotation.set(-Math.PI / 2, 0, -0.08);
  add(place(hs("brief_tomasz", group(letter, box(0.26, 0.03, 0.2, ZONE, 0, 0.01, 0))), "e", 0.5 + 0.1 / (2 * R), 0.832, 0.62));
  // Chiffrierscheibe aus Messing: äußerer Ring, innerer Ring (drehbar), Nabe
  const discO = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 40), [M.brass, std(0xffffff, { map: cipherTex(250, 180, "#b08c52", "#2a1d14"), metalness: 0.6, roughness: 0.35, transparent: true }), M.brass]);
  const discI = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 40), [M.brassDark, std(0xffffff, { map: cipherTex(250, 150, "#8a6e45", "#1a120a", "#3a2c1b"), metalness: 0.5, roughness: 0.4, transparent: true }), M.brassDark]);
  discI.position.y = 0.008;
  const cipher = group(discO, discI, box(0.24, 0.05, 0.24, ZONE, 0, 0.02, 0));
  // Innerer Ring direkt drehen (rastet je Buchstabe ein), Prüfknopf aus Messing; Prüfung durch die Engine (Stellung, wie im Dialog)
  const CSTEP = (Math.PI * 2) / 26; let cK = 0, cAng = 0, cDrag = false; const cTw = twister(ctx, () => cipher);
  const chk = group(cyl(0.016, 0.018, 0.016, M.brass, 0, 0.008, 0, 20), cyl(0.011, 0.011, 0.01, M.brassDark, 0, 0.02, 0, 16)); chk.position.set(0.15, 0, 0.05); cipher.add(chk);
  const mark = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.02, 3), M.brassDark); mark.rotation.x = Math.PI / 2; mark.position.set(0, 0.012, -0.118); cipher.add(mark); // Markierung oben
  let chkT = -1;
  const cipherSpec = { when: () => !eng().isSolved("chiffre"), cam: [0, 0.36, 0.2], center: [0, 0, 0], fov: 42, exitDelay: 1600,
    hint: "Inneren Ring drehen · Knopf rechts prüft", value: () => String(cK),
    parts: () => [
      { obj: discI, name: "ring", tap: (h, info) => { cK = (cK + 1) % 26; snd("key"); }, drag: (dx, dy, pt) => { cDrag = true; cAng += cTw.delta(pt); }, release: (moved) => { cDrag = false; cTw.reset(); if (moved) { cK = ((Math.round(cAng / CSTEP) % 26) + 26) % 26; cAng = cK * CSTEP; snd("key"); } } },
      { obj: chk, name: "pruefen", tap: () => { chkT = 0; eng().tryLock("chiffre", cK); } },
    ] };
  add(place(hs("chiffrierscheibe", cipher, { focus: cipherSpec }), "e", 0.5 + 0.42 / (2 * R), 0.84, 0.55));
  anim((dt, t) => {
    if (!cDrag) { let target = cK * CSTEP; while (target - cAng > Math.PI) target -= Math.PI * 2; while (cAng - target > Math.PI) target += Math.PI * 2; cAng += (target - cAng) * Math.min(1, dt * 12); }
    discI.rotation.y = -cAng + (eng().isSolved("chiffre") || cK ? 0 : Math.sin(t * 0.3) * 0.05); // im Uhrzeigersinn = Stellung steigt (wie im Dialog)
    if (chkT >= 0) { chkT += dt; chk.children[1].position.y = 0.02 - Math.sin(Math.min(1, chkT * 5) * Math.PI) * 0.006; if (chkT > 0.2) chkT = -1; }
  });
  // Papierstapel (Deko)
  const stack = group(); for (let i = 0; i < 6; i++) { const s = rbox(0.24, 0.012, 0.32, M.paper, (Math.random() - 0.5) * 0.02, 0.006 + i * 0.013, (Math.random() - 0.5) * 0.02, 0.003); s.rotation.y = (Math.random() - 0.5) * 0.1; stack.add(s); }
  add(place(stack, "e", 0.5 + 0.75 / (2 * R), 0.83, 0.45));
  // Stuhl, leicht vom Schreibtisch weggeschoben (verdeckt das Fach nicht)
  const chair = group(rbox(0.46, 0.06, 0.46, M.woodDark, 0, 0.46, 0, 0.015), rbox(0.42, 0.06, 0.42, M.velvet, 0, 0.5, 0, 0.025), rbox(0.46, 0.5, 0.04, M.woodDark, 0, 0.75, -0.21, 0.015), rbox(0.3, 0.3, 0.02, M.velvet, 0, 0.78, -0.19, 0.01));
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([cx, cz]) => { const l = turnedLeg(0.44, 0.024, M.woodDark); l.position.set(cx, 0, cz); chair.add(l); });
  chair.rotation.y = Math.PI + 0.7; add(place(chair, "e", 0.86, 0, 1.25));
  // Bild über dem Schreibtisch: Hotel Nocturne 1897
  const hotelPic = textTex(320, 220, "#2a241c", (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4a4034"); gr.addColorStop(1, "#1e1a14"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#14100c"; g.fillRect(60, 70, 200, 120); g.fillRect(140, 40, 40, 30); g.fillStyle = "#c8a86a"; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.fillRect(76 + i * 30, 86 + j * 34, 12, 18); g.fillStyle = "#cdbd9b"; g.font = "italic 16px Georgia, serif"; g.textAlign = "center"; g.fillText("Hotel Nocturne · 1897", w / 2, 212); });
  add(place(ornateFrame(0.8, 0.58, lambert(0xffffff, { map: hotelPic }), brassMat(0x8a6830, 0.38), 0.05, 0.07), "e", 0.5, 1.85, 0.02));

  /* ================= SÜD · Aktenschrank A–Z ================= */
  const C = 0.34, ncol = 6, nrow = 5, y0 = 0.14, cw = ncol * C + 0.08;
  const cab = group(rbox(cw, nrow * C + 0.1, 0.62, M.woodDark, 0, y0 + (nrow * C) / 2, 0, 0.015), rbox(cw + 0.08, 0.05, 0.68, M.trim, 0, y0 + nrow * C + 0.07, 0.02, 0.015), rbox(cw + 0.04, 0.12, 0.64, M.trim, 0, 0.06, 0.01, 0.01));
  const front = (c) => { const d = group(panel(C - 0.025, C - 0.025, M.wood, 0, 0, 0, 0.03, 0.006)); if (c) d.add(plane(0.09, 0.065, lambert(0xffffff, { map: drawerLabel(c) }), 0, 0.08, 0.02)); const hd = rbox(0.11, 0.025, 0.03, M.brass, 0, -0.05, 0.025, 0.008); d.add(hd); return d; };
  let drawerW = null;
  for (let i = 0; i < ncol * nrow; i++) {
    const c = ABC[i] || "", col = i % ncol, row = Math.floor(i / ncol);
    const fx = -((ncol - 1) * C) / 2 + col * C, fy = y0 + nrow * C - (row + 0.5) * C;
    if (c === "W") { drawerW = group(rbox(C - 0.03, C - 0.03, 0.56, M.woodDark, 0, 0, -0.28, 0.005), front(c)); drawerW.children[1].position.z = 0.0; drawerW.add(plane(0.1, 0.05, new THREE.MeshBasicMaterial({ map: scratchTex(), transparent: true }), 0, -0.03, 0.035)); drawerW.position.set(fx, fy, 0.31); continue; }
    const f = front(c); f.position.set(fx, fy, 0.31); cab.add(f);
  }
  add(place(hs("aktenschrank", cab), "s", 0.5, 0, 0.32));
  const wHolder = group(drawerW, box(C, C, 0.1, ZONE, drawerW.position.x, drawerW.position.y, 0.33));
  // Mit dem Schraubendreher aufhebeln (Schraubendreher gewählt): Klinge im Spalt, nach unten drücken (oder dreimal antippen)
  const pry = group(cyl(0.004, 0.004, 0.09, std(0xb8bcc0, { metalness: 1, roughness: 0.25 }), 0, 0, 0.045), cyl(0.016, 0.019, 0.1, std(0x8a2a1c, { roughness: 0.35 }), 0, 0, 0.14, 8), box(0.06, 0.06, 0.24, ZONE, 0, 0, 0.12));
  pry.children[0].rotation.x = pry.children[1].rotation.x = Math.PI / 2; pry.position.set(drawerW.position.x, drawerW.position.y + C / 2 - 0.02, 0.33); pry.visible = false; wHolder.add(pry);
  let pryK = 0, pryFired = false;
  const pryDone = () => { if (!pryFired && pryK >= 1) { pryFired = true; snd("drop"); setTimeout(() => { pry.visible = false; eng().hotspot("schublade_w"); }, 400); } };
  const pryS = { useItem: "schraubendreher", when: () => !eng().has("fachw_offen"), cam: [drawerW.position.x, drawerW.position.y + 0.05, 0.85], center: [drawerW.position.x, drawerW.position.y, 0.32], fov: 40, exitDelay: 1500,
    hint: "Schraubendreher nach unten drücken (oder antippen)", value: () => pryK.toFixed(2),
    enter: () => { pryK = 0; pryFired = false; pry.visible = true; }, exit: () => { if (!pryFired) pry.visible = false; },
    parts: () => [{ obj: pry, name: "hebel", tap: () => { pryK = Math.min(1, pryK + 0.34); snd("creak"); pryDone(); }, drag: (dx, dy) => { pryK = Math.max(0, Math.min(1, pryK + dy * 0.008)); pryDone(); } }] };
  anim(() => { if (pry.visible) { pry.rotation.x = -0.6 * pryK; } });
  add(place(hs("schublade_w", wHolder, { focus: pryS }), "s", 0.5, 0, 0.32));
  let wOpen = false; state((has) => { wOpen = has("fachw_offen"); });
  anim((dt) => { drawerW.position.z = lerp(drawerW.position.z, wOpen ? 0.62 : 0.31 + (pry.visible ? pryK * 0.03 : 0), Math.min(1, dt * 4)); });
  // Karton „Personal 2009“ oben auf dem Schrank, quer darauf die Akte „Voss, E.“
  const kTop = y0 + nrow * C + 0.095;
  const karton = group(rbox(0.7, 0.26, 0.42, M.card, 0, 0.13, 0, 0.01), plane(0.42, 0.1, lambert(0xffffff, { map: plaqueTex("PERSONAL 2009", 384, 90, "#2a2119", "#cfc3a6", "600 36px DM Mono, monospace", 3) }), 0, 0.13, 0.212));
  for (let i = 0; i < 5; i++) karton.add(rbox(0.012, 0.08, 0.32, M.paper, -0.24 + i * 0.12, 0.27 + (i % 2) * 0.01, 0, 0.003));
  const files = karton.children.slice(2); const kGo = lift(ctx, (k) => { files.forEach((f, i) => { f.position.y = 0.27 + (i % 2) * 0.01 + k * (0.06 + i * 0.015); }); }, 0.5);
  add(place(hs("personalkasten", karton, { act: { play: () => { kGo(); snd("paper"); return 600; } } }), "s", 0.5 - 0.35 / (2 * R), kTop, 0.32));
  const akte = group(rbox(0.36, 0.02, 0.25, std(0xcfc3a6, { roughness: 0.9 }), 0, 0.01, 0, 0.004), plane(0.2, 0.045, lambert(0xffffff, { map: plaqueTex("VOSS, E.", 256, 60, "#2a2119", "#efe6d2", "600 30px DM Mono, monospace", 2) }), 0, 0.022, 0.06));
  akte.children[1].rotation.x = -Math.PI / 2; akte.add(box(0.4, 0.06, 0.3, ZONE, 0, 0.02, 0));
  // lehnt schräg am Karton (über Augenhöhe – flach liegend wäre sie von unten nicht zu sehen)
  akte.rotation.set(1.15, -0.12, 0.05);
  const akA = inner(akte); const akGo = lift(ctx, (k) => { akA.position.set(0, -0.9 * k, 1.5 * k); akA.rotation.x = -0.9 * k; }, 0.9);
  add(place(hs("akte_elias", akte, { act: { play: () => { akGo(); snd("paper"); return 950; } } }), "s", 0.5 + 0.22 / (2 * R), kTop + 0.12, 0.2));
  // Archivkartons in den Ecken (Deko)
  [[0.1, 0], [0.1, 0.31], [0.9, 0], [0.88, 0.31], [0.9, 0.62]].forEach(([u, y], i) => add(place(group(rbox(0.42, 0.3, 0.34, M.card, 0, 0.15, 0, 0.01), plane(0.3, 0.15, lambert(0xffffff, { map: boxTex(["RECHNUNGEN", "LIEFERANTEN", "GÄSTE 2008", "WARTUNG", "BANKETT"][i]) }), 0, 0.15, 0.171)).rotateY((i % 2 ? 0.08 : -0.06)), "s", u, y, 0.3)));

  /* ================= WEST · Planschrank und Stahltür ================= */
  const pc = group(rbox(1.7, 0.86, 0.95, M.wood, 0, 0.47, 0, 0.015), rbox(1.78, 0.04, 1.0, M.woodDark, 0, 0.92, 0.01, 0.012), rbox(1.72, 0.06, 0.96, M.woodDark, 0, 0.03, 0, 0.01));
  [0.75, 0.53].forEach((y) => { pc.add(panel(1.6, 0.18, M.woodDark, 0, y, 0.476, 0.03, 0.006)); pc.add(rbox(0.16, 0.025, 0.03, M.brass, 0, y, 0.5, 0.008)); });
  const planDrawer = group(rbox(1.6, 0.24, 0.9, M.woodDark, 0, 0, -0.45, 0.01), panel(1.6, 0.24, M.woodDark, 0, 0, 0, 0.03, 0.006), rbox(0.16, 0.025, 0.03, M.brass, 0, 0, 0.025, 0.008));
  const keyhole = cyl(0.016, 0.016, 0.02, M.brassDark, 0.16, 0, 0.02); keyhole.rotation.x = Math.PI / 2; planDrawer.add(keyhole);
  const plan = plane(1.0, 0.62, lambert(0xffffff, { map: planTex() })); plan.rotation.set(-Math.PI / 2, 0, 0.02); plan.position.set(0, 0.125, -0.45); planDrawer.add(plan);
  planDrawer.position.set(0, 0.25, 0.476); pc.add(planDrawer);
  add(place(hs("planschrank", pc), "w", 0.33, 0, 0.5));
  let pOpen = false; state((has) => { pOpen = has("planlade_offen"); keyhole.visible = !pOpen; });
  anim((dt) => { planDrawer.position.z = lerp(planDrawer.position.z, pOpen ? 1.05 : 0.476, Math.min(1, dt * 3)); });
  const proto = (label, rot) => { const pl = plane(0.24, 0.17, lambert(0xffffff, { map: protoTex(label) })); pl.rotation.set(-Math.PI / 2, 0, rot); return group(pl, box(0.28, 0.03, 0.22, ZONE, 0, 0.01, 0)); };
  const protoAct = (g) => { const a = inner(g); const go = lift(ctx, (k) => { a.position.set(0, 0.55 * k, 0.55 * k); a.rotation.x = 1.25 * k; }, 0.7); return { play: () => { go(); snd("paper"); return 750; } }; };
  const pA = proto("A · 117", 0.07), pB = proto("B · 118", -0.05);
  add(place(hs("protokoll_a", pA, { act: protoAct(pA) }), "w", 0.33 - 0.45 / (2 * R), 0.943, 0.45));
  add(place(hs("protokoll_b", pB, { act: protoAct(pB) }), "w", 0.33 - 0.12 / (2 * R), 0.943, 0.45));
  // Stahltür (Sicherheitsbereich UG), dahinter Treppe nach unten
  const down = group(box(1.0, 0.05, 2.6, M.ceil, 0, 2.2, -1.3), box(0.05, 2.6, 2.6, lambert(0x2a2a26), -0.5, 1.0, -1.3), box(0.05, 2.6, 2.6, lambert(0x2a2a26), 0.5, 1.0, -1.3), box(1.0, 3, 0.05, basic(0x030303), 0, 0, -2.6));
  for (let i = 0; i < 7; i++) down.add(box(0.95, 0.05, 0.3, lambert(0x2a2a26), 0, -0.2 * (i + 1) + 0.02, -0.35 - i * 0.3));
  down.add(box(1.0, 0.04, 0.3, lambert(0x2a2a26), 0, -0.01, -0.15));
  const sPv = new THREE.Group(); sPv.position.set(-0.5, 0, -0.02);
  const sDoor = group(rbox(0.98, 2.18, 0.07, M.steel, 0.49, 1.09, 0, 0.01));
  [[0.08, 0.1], [0.9, 0.1], [0.08, 2.08], [0.9, 2.08]].forEach(([bx, by]) => sDoor.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.steel).translateX(bx).translateY(by).translateZ(0.035)));
  sDoor.add(rbox(0.05, 0.3, 0.06, std(0x2a2a26, { metalness: 0.8, roughness: 0.4 }), 0.86, 1.05, 0.06, 0.01));
  sPv.add(sDoor);
  const sFrame = group(box(0.08, 2.26, 0.1, std(0x3a3a36, { metalness: 0.6, roughness: 0.5 }), -0.54, 1.13, 0), box(0.08, 2.26, 0.1, std(0x3a3a36, { metalness: 0.6, roughness: 0.5 }), 0.54, 1.13, 0), box(1.16, 0.08, 0.1, std(0x3a3a36, { metalness: 0.6, roughness: 0.5 }), 0, 2.24, 0));
  const signT = textTex(512, 128, "#cdbd9b", (g) => { g.fillStyle = "#2a2119"; g.font = "600 34px DM Mono, monospace"; g.textAlign = "center"; g.fillText("SICHERHEITSBEREICH UG", 256, 54); g.font = "500 28px DM Mono, monospace"; g.fillText("ZUTRITT NUR PERSONAL", 256, 100); });
  const sign = plane(0.78, 0.19, lambert(0xffffff, { map: signT }), 0, 2.48, 0.02);
  const pad = group(rbox(0.13, 0.2, 0.03, std(0x1a1a18, { metalness: 0.5, roughness: 0.4 }), 0, 0, 0, 0.008), plane(0.11, 0.17, lambert(0xffffff, { map: keypadTex() }), 0, 0, 0.016));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0xc0392b })); led.position.set(0.045, 0.085, 0.02); pad.add(led);
  // echtes Tastenfeld: zwölf Tasten, Anzeige mit den eingegebenen Ziffern; nach vier Ziffern prüft die Engine (Rätsel „pin“)
  pad.children[1].visible = false;
  const dispC = document.createElement("canvas"); dispC.width = 128; dispC.height = 40; const dispT = new THREE.CanvasTexture(dispC); dispT.colorSpace = THREE.SRGBColorSpace;
  const drawDisp = (txt, col = "#9fe0b0") => { const g = dispC.getContext("2d"); g.fillStyle = "#0b2a1e"; g.fillRect(0, 0, 128, 40); g.fillStyle = col; g.font = "600 28px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 22); dispT.needsUpdate = true; };
  let pinEntry = ""; drawDisp("– – – –");
  pad.add(plane(0.09, 0.028, new THREE.MeshBasicMaterial({ map: dispT, toneMapped: false }), -0.01, 0.07, 0.016));
  const keyTexs = {}; const keyTex = (k) => keyTexs[k] ??= canvasTex(64, 64, (g) => { g.fillStyle = "#3d3d38"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#d8d8c8"; g.font = "600 38px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(k, 32, 34); });
  const padKeys = "123456789*0#".split("").map((k, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.026, 0.01), [std(0x3d3d38), std(0x3d3d38), std(0x3d3d38), std(0x3d3d38), new THREE.MeshStandardMaterial({ map: keyTex(k), roughness: 0.5 }), std(0x3d3d38)]);
    b.position.set(-0.036 + (i % 3) * 0.036, 0.03 - Math.floor(i / 3) * 0.033, 0.02); b.userData.k = k; pad.add(b); return b; });
  let pressT = {};
  const pinPress = (b) => { pressT[b.userData.k] = 0; snd("key"); const k = b.userData.k; if (!/\d/.test(k)) { pinEntry = ""; drawDisp("– – – –"); return; }
    pinEntry += k; drawDisp(pinEntry.padEnd(4, "–").split("").join(" "));
    if (pinEntry.length === 4) { const v = pinEntry; pinEntry = ""; setTimeout(() => { const r = eng().tryLock("pin", v); if (!r.ok) { drawDisp("FEHLER", "#e05a4a"); setTimeout(() => drawDisp("– – – –"), 900); } else drawDisp("OFFEN"); }, 250); } };
  anim((dt) => { padKeys.forEach((b) => { const t = pressT[b.userData.k]; if (t === undefined) return; pressT[b.userData.k] = t + dt; b.position.z = 0.02 - (t < 0.15 ? 0.004 : 0); if (t > 0.2) delete pressT[b.userData.k]; }); });
  pad.position.set(0.78, 1.35, 0.02);
  const steel = group(down, sPv, sFrame, sign, pad);
  add(place(steel, "w", 0.74, 0, 0));
  const pinSpec = { when: (id) => id === "stahltuer" && !eng().has("sicherheit_offen"), cam: [0.78, 1.38, 0.42], center: [0.78, 1.35, 0.02], fov: 40, exitDelay: 1800,
    hint: "Vier Ziffern eintippen · * löscht", value: () => pinEntry, parts: () => padKeys.map((b) => ({ obj: b, name: "taste" + b.userData.k, tap: () => pinPress(b) })) };
  add(place(hs(["stahltuer_offen", "stahltuer"], group(box(1.0, 2.2, 0.3, ZONE, 0, 1.1, 0), box(0.2, 0.3, 0.1, ZONE, 0.78, 1.35, 0.03)), { focus: pinSpec }), "w", 0.74, 0, 0));
  let sOpen = false; state((has) => { sOpen = has("sicherheit_offen"); led.material.color.setHex(sOpen ? 0x6fbf5a : 0xc0392b); });
  anim((dt) => { sPv.rotation.y = lerp(sPv.rotation.y, sOpen ? 1.3 : 0, Math.min(1, dt * 2)); });
  const ledL = new THREE.PointLight(0xff4030, 0.4, 1.2, 2); place(ledL, "w", 0.74 + 0.78 / (2 * R), 1.3, 0.12); add(ledL);
  state((has) => { ledL.color.setHex(has("sicherheit_offen") ? 0x60ff60 : 0xff4030); });

  /* ---------- Licht: Hängelampe (schwach), Wandleuchten ---------- */
  const hang = group(cyl(0.004, 0.004, 0.6, M.black, 0, -0.3, 0), cyl(0.06, 0.22, 0.16, std(0x1e3a2a, { roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }), 0, -0.66, 0, 24));
  const hb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), basic(0xffe6b8)); hb.position.y = -0.72; hang.add(hb);
  hang.position.set(0, H, 0.1); add(hang);
  const ceilL = new THREE.PointLight(0xffc98a, 6, 0, 2); ceilL.position.set(0, H - 0.85, 0.1); add(ceilL);
  const sconce = (wall, u) => { const s = group(rbox(0.07, 0.16, 0.04, M.brassDark, 0, 0, 0, 0.01), cyl(0.05, 0.08, 0.12, std(0xd9b98a, { emissive: 0x8a5a24, emissiveIntensity: 0.8 }), 0, 0.1, 0.08, 16)); add(place(s, wall, u, 2.0, 0.02)); const l = new THREE.PointLight(0xffb36b, 2.6, 0, 2); place(l, wall, u, 2.1, 0.35); add(l); };
  sconce("s", 0.12); sconce("w", 0.06); sconce("n", 0.94);
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.3 };
});
ready();
