/*
 * STATION 2 – ZIMMER 217 in 3D
 * Aufbau nach den vier 2D-Ansichten (js/rooms/02-zimmer217.js): Nord Zimmertür · Ost Bett · Süd Fenster · West Schreibtisch.
 * Raum 5,2 × 5,2 m, 3 m hoch.
 * Zustände aus der Engine: kommode_open · schrank_open · fenster_auf (Ereignis beim Blick zum Fenster, nachdem die
 * Kommode offen ist: Fenster schlägt auf, danach nasse Fußspuren und ein Blatt auf dem Schreibtisch) · taken_gepaeckschein.
 * Bildhinweise: Zimmernummer 217 · Ziffernschloss der Kommode (vier Stellen, 0000) · „Wer nachts wacht“ über dem Schrank ·
 * „für E.“ am Landschaftsbild · Kerze brennt · Gepäckschein „6“ unter dem Bett (nur im Lichtkegel) · Tor im Hof nur beim Blitz.
 */
import { THREE, defineRoom, ready, canvasTex, lambert, phong, basic, ZONE, box, cyl, plane, group } from "./core.js?v=2";
import { textTex, wallpaper, woodTex, plankTex, plaqueTex, rainTex, shell } from "./kit.js?v=1";

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
  const M = {
    wall: lambert(0xffffff, { map: wallpaper("#3a2a2a", "#46323a", "#5a4248") }), floor: lambert(0xffffff, { map: plankTex() }),
    ceil: lambert(0x100c0b), trim: lambert(0x1e140e), wood: lambert(0xffffff, { map: woodTex("#3a271a", "#24170e") }),
    woodDark: lambert(0xffffff, { map: woodTex("#2a1c12", "#180f09") }), brass: phong(0xb08c52), brassDark: phong(0x6e5632),
    black: lambert(0x0c0a09), linen: lambert(0xd8cfbd), red: lambert(0x5a1a18), velvet: lambert(0x5a1616), paper: lambert(0xe9dfc6),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim,
    holes: { n: [{ x: 0, y: 0, w: 1.0, h: 2.2 }], s: [{ x: 0, y: 0.8, w: 1.5, h: 1.6 }] },
  });
  const rug = plane(2.6, 1.8, lambert(0x3a1714)); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.2, 0.004, -0.3); add(rug);

  /* ================= NORD · Zimmertür ================= */
  const door = group(box(1.0, 2.2, 0.05, M.woodDark, 0, 1.1, -0.03),
    plane(0.34, 0.13, lambert(0xffffff, { map: numberPlate() }), 0, 1.88, 0.012),
    box(0.7, 0.6, 0.01, M.wood, 0, 1.45, 0.0), box(0.7, 0.75, 0.01, M.wood, 0, 0.6, 0.0));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), M.brass); knob.position.set(0.38, 1.0, 0.03); door.add(knob);
  const peep = cyl(0.012, 0.012, 0.02, M.brass, 0, 1.58, 0.01); peep.rotation.x = Math.PI / 2; door.add(peep);
  door.add(box(0.08, 2.28, 0.06, M.trim, -0.54, 1.14, 0.0), box(0.08, 2.28, 0.06, M.trim, 0.54, 1.14, 0.0), box(1.16, 0.08, 0.06, M.trim, 0, 2.24, 0.0));
  add(place(hs("tuer217", door), "n", 0.5, 0, 0.02));
  // Garderobe mit dunkelgrünem Damenmantel (Geheimnis: Kinokarte)
  const coat = group(cyl(0.02, 0.025, 1.8, M.woodDark, 0, 0.9, 0), cyl(0.18, 0.2, 0.03, M.woodDark, 0, 0.015, 0),
    cyl(0.16, 0.24, 1.05, lambert(0x1f3a2c), 0, 1.15, 0.06, 16), new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x1f3a2c)));
  coat.children[3].position.set(0, 1.66, 0.06); coat.children[3].scale.set(1.3, 0.6, 1);
  add(place(hs("mantel", coat), "n", 0.2, 0, 0.35));
  // Spiegel, darunter an einer Kordel der alte Schlüssel
  const mirror = group(box(0.6, 0.86, 0.04, phong(0x8a6a34)), plane(0.5, 0.76, phong(0x1a2426, { shininess: 120, specular: 0x8899aa }), 0, 0, 0.021));
  add(place(hs("spiegel", mirror), "n", 0.77, 1.6, 0.02));
  const oldKey = group(cyl(0.003, 0.003, 0.16, M.black, 0, 0.08, 0),
    new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 16), M.brass), cyl(0.006, 0.006, 0.12, M.brass, 0, -0.08, 0), box(0.03, 0.025, 0.006, M.brass, 0.015, -0.13, 0));
  oldKey.add(box(0.08, 0.3, 0.04, ZONE, 0, -0.02, 0));
  add(place(hs("alterschluessel", oldKey), "n", 0.775, 1.04, 0.04));
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
  const bed = group(box(1.7, 1.25, 0.08, M.woodDark, 0, 0.63, 0.04), box(1.7, 0.24, 2.0, M.woodDark, 0, 0.38, 1.0),
    box(1.6, 0.18, 1.9, M.linen, 0, 0.59, 1.0), box(1.66, 0.08, 1.4, M.red, 0, 0.7, 1.28), box(1.66, 0.14, 0.02, M.red, 0, 0.62, 1.98));
  [-0.42, 0.42].forEach((x) => { const p = box(0.62, 0.12, 0.34, M.linen, x, 0.74, 0.3); bed.add(p); });
  bed.add(box(0.5, 0.06, 0.02, lambert(0x1a1210), -0.4, 0.92, 0.09), box(0.5, 0.06, 0.02, lambert(0x1a1210), 0.4, 0.92, 0.09));
  [[-0.8, 0.1], [0.8, 0.1], [-0.8, 1.95], [0.8, 1.95]].forEach(([x, z]) => bed.add(box(0.07, 0.26, 0.07, M.woodDark, x, 0.13, z)));
  add(place(hs("bett", bed), "e", 0.5, 0, 0.0));
  // Brief auf der Tagesdecke
  const letter = plane(0.26, 0.18, lambert(0xffffff, { map: letterTex() })); letter.rotation.set(-Math.PI / 2, 0, 0.3);
  add(place(hs("brief_bett", group(letter, box(0.3, 0.05, 0.24, ZONE, 0, 0.02, 0))), "e", 0.64, 0.745, 1.2));
  // Landschaftsbild über dem Bett („für E.“)
  const lake = group(box(0.9, 0.6, 0.04, phong(0x7a5a2c)), plane(0.8, 0.5, lambert(0xffffff, { map: lakeTex() }), 0, 0, 0.022));
  add(place(hs("bild_bett", lake), "e", 0.5, 1.78, 0.02));
  // Nachttische: links mit Lampe, rechts (Hotspot) mit Sanduhr
  const nsL = group(box(0.45, 0.55, 0.4, M.woodDark, 0, 0.275, 0), cyl(0.07, 0.09, 0.04, M.brassDark, 0, 0.57, 0), cyl(0.012, 0.012, 0.3, M.brass, 0, 0.72, 0), cyl(0.1, 0.18, 0.18, lambert(0xa8875a, { emissive: 0x5a3a14 }), 0, 0.92, 0, 20));
  add(place(nsL, "e", 0.13, 0, 0.25));
  const lampL = new THREE.PointLight(0xffb066, 6, 0, 2); place(lampL, "e", 0.13, 1.0, 0.35); add(lampL);
  const nsR = group(box(0.45, 0.55, 0.4, M.woodDark, 0, 0.275, 0), box(0.36, 0.14, 0.02, M.wood, 0, 0.38, 0.205), cyl(0.012, 0.012, 0.02, M.brass, 0, 0.38, 0.22));
  add(place(hs("nachttisch", nsR), "e", 0.88, 0, 0.25));
  const glassMat = new THREE.MeshPhongMaterial({ color: 0xc8d4dc, transparent: true, opacity: 0.35, shininess: 90 });
  const hg = group(cyl(0.06, 0.06, 0.02, M.wood, 0, 0.01, 0), cyl(0.06, 0.06, 0.02, M.wood, 0, 0.23, 0),
    cyl(0.045, 0.008, 0.1, glassMat, 0, 0.17, 0), cyl(0.008, 0.045, 0.1, glassMat, 0, 0.07, 0), cyl(0.008, 0.04, 0.05, lambert(0xc8a86a), 0, 0.045, 0),
    cyl(0.006, 0.006, 0.22, M.woodDark, 0.05, 0.12, 0), cyl(0.006, 0.006, 0.22, M.woodDark, -0.05, 0.12, 0));
  add(place(hs("sanduhr", hg), "e", 0.87, 0.55, 0.25));
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
  const curtain = (u) => { const c = group(); for (let i = 0; i < 6; i++) c.add(box(0.09, 2.5, 0.05, M.velvet, -0.22 + i * 0.09, 1.3, (i % 2) * 0.04)); return place(c, "s", u, 0, 0.12); };
  const cL = curtain(0.31), cR = curtain(0.69);
  add(hs("vorhang", cL), cR);
  add(place(box(2.4, 0.03, 0.03, M.brassDark, 0, 0, 0), "s", 0.5, 2.62, 0.12)); // Vorhangstange
  anim((dt, t) => { const k = winOpen ? 0.12 : 0.01; cL.children.forEach((b, i) => { b.rotation.x = Math.sin(t * 2.3 + i) * k; }); cR.children.forEach((b, i) => { b.rotation.x = Math.sin(t * 2.1 + i * 1.3) * k; }); });
  // Heizkörper (Ventil auf 0)
  const rad = group(); for (let i = 0; i < 10; i++) rad.add(box(0.08, 0.55, 0.08, lambert(0x2a2622), -0.45 + i * 0.1, 0.42, 0));
  rad.add(box(1.0, 0.04, 0.05, lambert(0x2a2622), 0, 0.68, 0), box(1.0, 0.04, 0.05, lambert(0x2a2622), 0, 0.16, 0));
  const valve = cyl(0.04, 0.04, 0.05, M.brassDark, 0.56, 0.5, 0); valve.rotation.z = Math.PI / 2; rad.add(valve);
  add(place(hs("heizung", rad), "s", 0.5, 0, 0.12));

  /* ================= WEST · Schreibtisch, Kommode, Schrank ================= */
  const desk = group(box(1.2, 0.05, 0.6, M.wood, 0, 0.76, 0));
  [[-0.56, -0.26], [0.56, -0.26], [-0.56, 0.26], [0.56, 0.26]].forEach(([x, z]) => desk.add(box(0.05, 0.74, 0.05, M.woodDark, x, 0.37, z)));
  const drawer = group(box(0.5, 0.11, 0.5, M.woodDark, 0, 0, -0.25), cyl(0.015, 0.015, 0.02, M.brass, 0, 0, 0.01)); drawer.children[1].rotation.x = Math.PI / 2;
  drawer.position.set(0.15, 0.67, 0.3); desk.add(drawer);
  add(place(desk, "w", 0.3, 0, 0.32));
  add(place(hs("schreibtisch", group(box(0.52, 0.14, 0.06, ZONE, 0.15, 0.67, 0.62))), "w", 0.3, 0, 0.0));
  const chair = group(box(0.45, 0.05, 0.45, M.woodDark, 0, 0.46, 0), box(0.45, 0.5, 0.04, M.woodDark, 0, 0.73, -0.21));
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => chair.add(box(0.04, 0.46, 0.04, M.woodDark, x, 0.23, z)));
  chair.rotation.y = Math.PI; add(place(chair, "w", 0.32, 0, 1.0));
  // Kerzenständer mit brennender Kerze
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 10), basic(0xffd27a));
  const candle = group(cyl(0.06, 0.07, 0.02, M.brass, 0, 0.01, 0), cyl(0.012, 0.016, 0.22, M.brass, 0, 0.12, 0), cyl(0.04, 0.03, 0.03, M.brass, 0, 0.24, 0), cyl(0.02, 0.02, 0.14, lambert(0xefe6d2), 0, 0.32, 0), flame);
  flame.position.y = 0.42; candle.add(box(0.14, 0.5, 0.14, ZONE, 0, 0.22, 0));
  add(place(hs("kerzenstaender", candle), "w", 0.19, 0.785, 0.28));
  const candleL = new THREE.PointLight(0xffb45a, 4, 0, 2); place(candleL, "w", 0.19, 1.25, 0.32); add(candleL);
  anim((dt, t) => { const f = 0.85 + Math.sin(t * 17) * 0.06 + Math.sin(t * 7.3) * 0.05 + (Math.random() - 0.5) * 0.08; candleL.intensity = 4 * f; flame.scale.set(1, f, 1); });
  // Blatt auf dem Schreibtisch (erst nach dem Fensterereignis)
  const sheet = plane(0.21, 0.28, lambert(0xffffff, { map: sheetTex() })); sheet.rotation.set(-Math.PI / 2, 0, -0.2);
  add(place(hs("blatt", group(sheet, box(0.26, 0.04, 0.3, ZONE, 0, 0.02, 0)), { hideWhenHidden: true }), "w", 0.31, 0.79, 0.4));
  // Kommode mit Ziffernschloss; darauf das Porträtfoto
  const kom = group(box(1.1, 1.0, 0.5, M.wood, 0, 0.5, 0));
  [0.62, 0.34].forEach((y) => kom.add(box(1.0, 0.24, 0.02, M.woodDark, 0, y, 0.255)));
  const top = group(box(1.0, 0.2, 0.46, M.woodDark, 0, 0, -0.22), cyl(0.015, 0.015, 0.02, M.brass, -0.3, 0, 0.01), cyl(0.015, 0.015, 0.02, M.brass, 0.3, 0, 0.01));
  top.children[1].rotation.x = top.children[2].rotation.x = Math.PI / 2; top.position.set(0, 0.86, 0.255); kom.add(top);
  const lock = plane(0.16, 0.08, lambert(0xffffff, { map: codeLockTex() }), 0, 0, 0.012); top.add(lock);
  add(place(hs("kommode", kom), "w", 0.61, 0, 0.25));
  let komOpen = false; state((has) => { komOpen = has("kommode_open"); lock.visible = !komOpen; });
  anim((dt) => { top.position.z = lerp(top.position.z, komOpen ? 0.6 : 0.255, Math.min(1, dt * 4)); });
  const photo = group(box(0.2, 0.26, 0.02, phong(0x8a6a34), 0, 0.13, 0), plane(0.16, 0.21, lambert(0xffffff, { map: portraitTex() }), 0, 0.135, 0.011));
  photo.rotation.x = -0.12;
  add(place(hs("portraet217", photo), "w", 0.6, 1.0, 0.22));
  // Kleiderschrank mit Buchstabenrädern und Schnitzerei „Wer nachts wacht“
  const ward = group(box(1.15, 2.3, 0.58, M.woodDark, 0, 1.15, 0), box(1.25, 0.14, 0.64, M.trim, 0, 2.37, 0.02));
  const carve = plane(0.92, 0.14, lambert(0xffffff, { map: carveTex() }), 0, 2.16, 0.292); ward.add(carve);
  const doorPv = (sx) => { const pv = new THREE.Group(); pv.position.set(sx * 0.57, 0, 0.292); pv.add(box(0.56, 1.95, 0.03, M.wood, -sx * 0.28, 1.04, 0.015)); pv.add(box(0.02, 0.2, 0.03, M.brass, -sx * 0.52, 1.1, 0.04)); ward.add(pv); return pv; };
  const wdL = doorPv(-1), wdR = doorPv(1);
  const wheels = plane(0.3, 0.09, lambert(0xffffff, { map: wheelsTex() }), 0, 1.3, 0.33); ward.add(wheels);
  ward.add(box(1.0, 0.03, 0.02, M.brassDark, 0, 1.85, 0.0)); // Kleiderstange innen
  add(place(hs("schrank", ward), "w", 0.87, 0, 0.3));
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
  return { eye: [0, 1.62, 0] };
});
ready();
