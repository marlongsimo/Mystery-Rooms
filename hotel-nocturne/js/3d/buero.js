/*
 * STATION 7 – DAS MANAGERBÜRO in 3D (HD) · letzter Raum vor dem Finale
 * Aufbau nach den 2D-Ansichten (js/rooms/07-buero.js): Nord Schreibtisch (Lampe, Brief, Kalender, Uhr, dunkler Bereich unter der Platte) ·
 * Ost Bücherregal mit Lücke, offene Regaltür zum W-Gang, Fluchtplan · Süd Wandtresor, Formular, Bild · West Fenster zum Innenhof,
 * Stahltür Servicetunnel W.  5,2 × 5,2 m, 3 m hoch. Licht: grüne Schreibtischlampe (Notstrom), Regen am Fenster.
 * Zustände: Taschenlampe (Riegel unter der Platte) · tresor_offen (Tür offen, Schalter „TUNNEL W – ENTRIEGELT“) ·
 * tunnel_offen (Stahltür offen, dahinter die Rampe mit grünem Schimmer).
 */
import { THREE, defineRoom, ready, canvasTex, lambert, basic, ZONE, box, cyl, plane, group } from "./core.js?v=3";
import { textTex, plankTex, plaqueTex, rainTex, shell } from "./kit.js?v=2";
import { woodMat, brassMat, velvetMat, std, damask, persian, rbox, panel, turnedLeg, ornateFrame } from "./hd.js?v=2";
import { tag } from "./gfx.js?v=1";
import { lift } from "./interact.js?v=3";

const R = 2.6, H = 3.0;
const MONO = "DM Mono, monospace";

/* ---------- Texturen ---------- */
const clockTex = () => textTex(256, 256, null, (g, w) => {
  const c = w / 2; g.fillStyle = "#cdbd9b"; g.beginPath(); g.arc(c, c, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#17110b"; g.font = "600 26px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ["XII", "III", "VI", "IX"].forEach((t, i) => { const a = i * Math.PI / 2; g.fillText(t, c + Math.sin(a) * 92, c - Math.cos(a) * 92); });
  const hand = (a, l, wd) => { g.strokeStyle = "#17110b"; g.lineWidth = wd; g.lineCap = "round"; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); g.stroke(); };
  hand(((11 + 17 / 60) / 12) * Math.PI * 2, 54, 9); hand((17 / 60) * Math.PI * 2, 84, 5); // 23:17
});
const letterTex = () => textTex(256, 180, "#ece2c8", (g) => {
  g.strokeStyle = "#2c2a5a"; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = 26 + i * 20; g.beginPath(); g.moveTo(16, y); for (let x = 16; x < 70 + ((i * 53) % 160); x += 6) g.lineTo(x, y + Math.sin(x * 0.5) * 2); g.stroke(); }
  g.fillStyle = "rgba(44,42,90,.35)"; g.beginPath(); g.ellipse(120, 92, 26, 12, 0.3, 0, Math.PI * 2); g.fill(); // verlaufene Tinte
  g.fillStyle = "#2c2a5a"; g.font = "italic 16px Georgia, serif"; g.fillText("E. V.", 190, 168);
});
const calTex = () => textTex(128, 128, "#e6dcc3", (g, w) => { g.fillStyle = "#7a2620"; g.fillRect(0, 0, w, 30); g.fillStyle = "#e6dcc3"; g.font = `600 15px ${MONO}`; g.textAlign = "center"; g.fillText("OKTOBER", w / 2, 21); g.fillStyle = "#2a2119"; g.font = "600 58px Georgia, serif"; g.fillText("14", w / 2, 92); g.font = `11px ${MONO}`; g.fillText("MITTWOCH", w / 2, 116); });
const formTex = () => textTex(200, 260, "#e6dcc3", (g, w) => { g.fillStyle = "#2a2119"; g.font = `600 13px ${MONO}`; g.textAlign = "center"; g.fillText("ABSCHLUSSBERICHT", w / 2, 28); g.fillText("FALL 014-10", w / 2, 46); g.textAlign = "left"; g.strokeStyle = "#6c5a44"; for (let i = 1; i <= 5; i++) { g.fillText(i + ".", 14, 66 + i * 30); g.beginPath(); g.moveTo(32, 68 + i * 30); g.lineTo(186, 68 + i * 30); g.stroke(); } g.fillStyle = "#2c2a5a"; g.font = "italic 12px Georgia, serif"; g.fillText("…erst, wenn der Bericht stimmt.", 12, 248); });
const sketchTex = () => textTex(256, 300, "#e6dcc3", (g) => { g.strokeStyle = "#2a2119"; g.lineWidth = 3; g.setLineDash([10, 7]); g.beginPath(); g.moveTo(30, 250); g.lineTo(80, 200); g.lineTo(150, 200); g.lineTo(190, 120); g.lineTo(220, 80); g.stroke(); g.setLineDash([]); g.strokeStyle = "#7a2620"; g.strokeRect(200, 50, 40, 30); g.fillStyle = "#7a2620"; g.font = `600 16px ${MONO}`; g.fillText("W2", 205, 72); g.fillStyle = "#2a2119"; g.font = "italic 13px Georgia, serif"; g.fillText("T. / E.", 24, 286); });
const hotelPicTex = () => textTex(320, 220, "#1d2423", (g, w, h) => { g.fillStyle = "#14100c"; g.fillRect(70, 70, 180, 110); g.fillRect(140, 44, 40, 30); g.fillStyle = "#806040"; g.font = "italic 18px Georgia, serif"; g.textAlign = "center"; g.fillText("Hotel Nocturne 1897", w / 2, 208); });
const courtTex = () => textTex(512, 448, "#0d1416", (g, w, h) => { // Blick aus dem Fenster: Hofmauer mit Tor W2, grünes Tastenfeld, nasses Pflaster
  const sky = g.createLinearGradient(0, 0, 0, h * 0.5); sky.addColorStop(0, "#0a1014"); sky.addColorStop(1, "#1b2224"); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.5);
  g.fillStyle = "#1b2224"; g.fillRect(0, h * 0.42, w, h * 0.3); g.fillStyle = "#121a1b"; g.fillRect(0, h * 0.7, w, h * 0.3);
  g.globalAlpha = 0.25; for (let i = 0; i < 400; i++) { g.fillStyle = "#3a4446"; g.fillRect(Math.random() * w, h * 0.72 + Math.random() * h * 0.28, 6, 2); } g.globalAlpha = 1;
  g.fillStyle = "#0a0e0f"; g.fillRect(330, 200, 70, 110); g.strokeStyle = "#5f7a66"; g.lineWidth = 3; g.strokeRect(330, 200, 70, 110); g.fillStyle = "#5f7a66"; g.font = `600 18px ${MONO}`; g.fillText("W2", 348, 190);
  g.fillStyle = "#9fe0b0"; g.fillRect(410, 240, 12, 16); const gl = g.createRadialGradient(416, 248, 0, 416, 248, 40); gl.addColorStop(0, "rgba(159,224,176,.35)"); gl.addColorStop(1, "rgba(159,224,176,0)"); g.fillStyle = gl; g.fillRect(376, 208, 80, 80);
});

defineRoom("buero", (ctx) => {
  const { add, hs, state, anim, lerp } = ctx;
  const snd = ctx.sound, eng = ctx.engine;
  const inner = (g) => { const a = new THREE.Group(); while (g.children.length) a.add(g.children[0]); g.add(a); return a; };
  const pulse = (dur, fn) => { let t = -1; anim((dt) => { if (t < 0) return; t += dt; fn(Math.min(1, t / dur), t); if (t >= dur) { fn(1, t); t = -1; } }); return () => { t = 0; }; };
  const liftAct = (g, apply, ms = 750, sound = "paper") => { const a = inner(g); const go = lift(ctx, (k) => apply(a, k), ms / 1000 - 0.05); return { play: () => { go(); snd(sound); return ms; } }; };
  const M = {
    wall: tag(lambert(0xffffff, { map: damask("#221a14", "#30251c", "#5a4a32") }), { roughness: 0.85, normal: 0.9 }),
    floor: tag(lambert(0xffffff, { map: plankTex("#2a1d14", "#120b06") }), { roughness: 0.5, clearcoat: 0.25, normal: 1.6, envMapIntensity: 0.4 }),
    ceil: tag(lambert(0x16110c), { roughness: 0.95 }), trim: woodMat("#20140c", "#0e0804"), wood: woodMat("#3e2616", "#1e1008"),
    woodDark: woodMat("#2a180c", "#120a04"), brass: brassMat(), brassDark: brassMat(0x6e5632, 0.45), paper: std(0xe9dfc6, { roughness: 0.95 }),
    steel: std(0x4a4c46, { metalness: 0.65, roughness: 0.45 }), black: std(0x0c0a09, { roughness: 0.5 }), velvet: velvetMat(0x3a1414, 0x8a4040),
  };
  const { place } = shell(ctx, {
    R, H, wallMat: M.wall, floorMat: M.floor, ceilMat: M.ceil, trimMat: M.trim, wainscot: { h: 1.0, mat: M.woodDark },
    holes: { s: [{ x: 0, y: 1.0, w: 0.7, h: 0.7 }], e: [{ x: -R + 2 * R * 0.62, y: 0, w: 0.95, h: 2.3 }], w: [{ x: -R + 2 * R * 0.32, y: 0.85, w: 2.0, h: 1.75 }, { x: -R + 2 * R * 0.745, y: 0, w: 0.98, h: 2.2 }] },
  });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.012, 1.8), tag(lambert(0xffffff, { map: persian("#3a1a14", "#1a2030", "#8a6a3a") }), { roughness: 0.95, normal: 2.2 })); rug.position.set(0, 0.006, -0.2); add(rug);

  /* ================= NORD · Schreibtisch ================= */
  const desk = group(rbox(2.2, 0.07, 0.9, M.wood, 0, 0.78, 0, 0.02), rbox(0.55, 0.72, 0.84, M.woodDark, -0.8, 0.37, 0, 0.015), rbox(0.55, 0.72, 0.84, M.woodDark, 0.8, 0.37, 0, 0.015), rbox(1.05, 0.04, 0.84, M.woodDark, 0, 0.57, -0.05, 0.01));
  [-0.8, 0.8].forEach((x) => [0.58, 0.24].forEach((y) => { desk.add(panel(0.46, 0.28, M.wood, x, y, 0.425, 0.04, 0.008)); desk.add(cyl(0.012, 0.012, 0.03, M.brass, x, y, 0.45).rotateX(Math.PI / 2)); }));
  desk.add(rbox(2.1, 0.03, 0.62, std(0x2a3a2a, { roughness: 0.75 }), 0, 0.825, 0.02, 0.008)); // Schreibunterlage
  desk.add(rbox(1.05, 0.66, 0.04, M.black, 0, 0.33, -0.4)); // Rückwand des Fußraums
  add(place(desk, "n", 0.5, 0, 0.5));
  // Mittelschublade (klemmt) – Klickfläche
  const drawer = group(panel(0.9, 0.18, M.wood, 0, 0, 0, 0.03, 0.006), cyl(0.012, 0.012, 0.03, M.brass, 0, 0, 0.03).rotateX(Math.PI / 2));
  drawer.position.set(0, 0.67, 0.43);
  let drOut = 0, drRat = -1;
  anim((dt) => { if (drRat >= 0) { drRat += dt; if (drRat > 0.5) drRat = -1; } drawer.position.z = 0.43 + drOut * 0.32 + (drRat >= 0 ? Math.abs(Math.sin(drRat * 40)) * 0.01 * (1 - drRat / 0.5) : 0); });
  add(place(hs("b_schublade", group(drawer, box(0.92, 0.2, 0.06, ZONE, 0, 0.67, 0.44)), { act: { play: () => { drRat = 0; snd("click"); return 550; } } }), "n", 0.5, 0, 0.5));
  // Unter der Platte: ohne Licht schwarz; mit Taschenlampe der kleine Messingriegel
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.95, depthWrite: false }));
  shade.position.set(0, 0.28, 0.42); add(place(group(shade), "n", 0.5, 0, 0.5));
  const riegel = group(rbox(0.12, 0.025, 0.05, M.brass, 0, 0, 0, 0.008), cyl(0.012, 0.012, 0.04, M.brass, 0.03, -0.02, 0), box(0.3, 0.2, 0.3, ZONE, 0, -0.05, 0));
  // Mit Licht: den Messingriegel selbst zurückschieben (zur Seite wischen oder antippen) → Schublade gleitet auf
  let rK = 0, rFired = false; const bolt = riegel.children[0], knob = riegel.children[1];
  const rDone = () => { if (!rFired && rK >= 1) { rFired = true; snd("click"); setTimeout(() => { snd("slide"); eng().hotspot("b_riegel"); }, 300); } };
  anim((dt) => { bolt.position.x = 0.07 * rK; knob.position.x = 0.03 + 0.07 * rK; if (rFired) drOut = lerp(drOut, 1, Math.min(1, dt * 3)); });
  const rSpec = { when: () => !rFired, cam: [0.05, -0.32, 0.42], center: [0.02, -0.01, 0], fov: 40, exitDelay: 1600,
    hint: "Riegel zur Seite schieben (wischen oder antippen)", value: () => rK.toFixed(2), enter: () => { rK = 0; },
    parts: () => [{ obj: riegel, name: "riegel", tap: () => { rK = Math.min(1, rK + 0.5); snd("key"); rDone(); }, drag: (dx) => { rK = Math.max(0, Math.min(1, rK + Math.abs(dx) * 0.01)); rDone(); } }] };
  add(place(hs("b_riegel", riegel, { hideWhenHidden: true, focus: rSpec }), "n", 0.5, 0.545, 0.62));
  state((has, light) => { shade.visible = !light; });
  // Grüne Bankerlampe – Hauptlicht mit Schatten
  const shadeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.34, 24, 1, true, 0, Math.PI); shadeGeo.rotateZ(Math.PI / 2);
  const lamp = group(rbox(0.26, 0.04, 0.16, M.brass, 0, 0.02, 0, 0.01), cyl(0.012, 0.012, 0.36, M.brass, 0, 0.22, -0.04), new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0x1e5a3a, emissive: 0x2a8a50, emissiveIntensity: 0.6, roughness: 0.15, side: THREE.DoubleSide })));
  lamp.children[2].position.set(0, 0.42, 0.04);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), basic(0xfff0c8)); bulb.position.set(0, 0.37, 0.05); lamp.add(bulb, box(0.36, 0.5, 0.26, ZONE, 0, 0.25, 0));
  let lFl = 0; const lampGo = pulse(0.6, (k, t) => { lFl = k < 1 && Math.sin(t * 45) > 0.2 ? 1 : 0; });
  add(place(hs("b_lampe", lamp, { act: { play: () => { lampGo(); snd("click"); return 650; } } }), "n", 0.28, 0.84, 0.55));
  const lampL = new THREE.PointLight(0xffd8a0, 6, 0, 2); place(lampL, "n", 0.28, 1.15, 0.7); lampL.userData.shadow = true; add(lampL);
  anim((dt, t) => { lampL.intensity = lFl ? 0.4 : 6 * (0.96 + Math.sin(t * 11) * 0.02 + (Math.random() - 0.5) * 0.03); });
  // Brief, Tintenfass mit Feder, Tischkalender
  const letter = plane(0.24, 0.17, lambert(0xffffff, { map: letterTex() })); letter.rotation.set(-Math.PI / 2, 0, 0.07);
  const briefG = group(letter, box(0.28, 0.03, 0.21, ZONE, 0, 0.01, 0));
  add(place(hs("b_brief", briefG, { act: liftAct(briefG, (a, k) => { a.position.set(0, 0.35 * k, 0.25 * k); a.rotation.x = 1.2 * k; }) }), "n", 0.51, 0.843, 0.6));
  const ink = group(cyl(0.035, 0.04, 0.05, std(0x15120f, { roughness: 0.2 }), 0, 0.025, 0), cyl(0.003, 0.002, 0.24, std(0xe6dcc3), 0.03, 0.12, 0)); ink.children[1].rotation.z = -0.5;
  add(place(ink, "n", 0.4, 0.84, 0.55));
  const cal = group(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.08), [M.woodDark, M.woodDark, M.woodDark, M.woodDark, lambert(0xffffff, { map: calTex() }), M.woodDark]));
  cal.children[0].position.y = 0.065; cal.children[0].rotation.x = -0.25; cal.rotation.y = -0.2;
  add(place(hs("b_kalender", cal, { act: liftAct(cal, (a, k) => { a.position.set(0, 0.22 * k, 0.25 * k); a.rotation.x = 0.35 * k; }) }), "n", 0.66, 0.84, 0.55));
  // Wanduhr über dem Schreibtisch (23:17)
  const clock = group(cyl(0.25, 0.25, 0.05, M.woodDark, 0, 0, 0, 40).rotateX(Math.PI / 2), new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 10, 40), M.brass), plane(0.4, 0.4, new THREE.MeshStandardMaterial({ map: clockTex(), transparent: true, roughness: 0.4 }), 0, 0, 0.028));
  clock.children[1].position.z = 0.028;
  add(place(hs("b_uhr", clock), "n", 0.5, 2.3, 0.03));

  /* ================= OST · Bücherregal, offene Regaltür (W-Gang), Fluchtplan ================= */
  const shelf = group(rbox(2.2, 2.6, 0.04, M.woodDark, 0, 1.3, 0.02, 0.01), rbox(0.06, 2.6, 0.42, M.woodDark, -1.1, 1.3, 0.21, 0.01), rbox(0.06, 2.6, 0.42, M.woodDark, 1.1, 1.3, 0.21, 0.01), rbox(2.3, 0.08, 0.48, M.trim, 0, 2.64, 0.24, 0.01));
  const rows = [0.12, 0.74, 1.36, 1.98];
  rows.forEach((y) => shelf.add(rbox(2.16, 0.035, 0.4, M.woodDark, 0, y, 0.21, 0.006)));
  const cols = [0x5b2a22, 0x2f3a33, 0x3b2b1e, 0x4a3f2a, 0x2a2d3a, 0x5a4a2f];
  const bookMats = cols.map((c) => std(c, { roughness: 0.7 }));
  let gapX = 0;
  rows.forEach((y, r) => { let x = -1.04; let i = 0; while (x < 1.0) { const w = 0.05 + ((i * 7 + r * 3) % 4) * 0.012, h = 0.36 + ((i * 5 + r) % 5) * 0.03; if (r === 2 && i === 13) { gapX = x + 0.06; x += 0.12; i++; continue; } shelf.add(box(w, h, 0.26, bookMats[(i + r) % cols.length], x + w / 2, y + 0.018 + h / 2, 0.24)); x += w + 0.006; i++; } });
  const dustM = new THREE.MeshBasicMaterial({ color: 0x8a7a60, transparent: true, opacity: 0.35, depthWrite: false });
  const dustRect = plane(0.11, 0.24, dustM); dustRect.rotation.x = -Math.PI / 2; dustRect.position.set(gapX, rows[2] + 0.019, 0.24); shelf.add(dustRect);
  add(place(hs("b_regal", shelf), "e", 0.3, 0, 0.02));
  add(place(hs("b_luecke", group(box(0.14, 0.42, 0.3, ZONE, 0, 0.21, 0))), "e", 0.3 + gapX / (2 * R), rows[2] + 0.02, 0.24));
  // Offene Regaltür (Rückseite „W-GANG“) und der dunkle Gang dahinter
  const gang = group(box(0.95, 0.04, 3.2, M.ceil, 0, 2.3, -1.6), box(0.04, 2.3, 3.2, std(0x3a3a35, { roughness: 0.9 }), -0.47, 1.15, -1.6), box(0.04, 2.3, 3.2, std(0x3a3a35, { roughness: 0.9 }), 0.47, 1.15, -1.6), box(0.95, 2.3, 0.04, basic(0x030303), 0, 1.15, -3.2));
  const ramp = box(0.95, 0.04, 3.2, std(0x2a2a26), 0, -0.2, -1.6); ramp.rotation.x = 0.14; gang.add(ramp);
  const doorPv = new THREE.Group(); doorPv.position.set(0.47, 0, 0.02);
  const sDoor = group(rbox(0.92, 2.28, 0.4, M.woodDark, -0.46, 1.14, 0.2, 0.01));
  [0.4, 1.0, 1.6].forEach((y) => { sDoor.add(rbox(0.86, 0.03, 0.36, M.woodDark, -0.46, y, 0.2, 0.005)); for (let i = 0; i < 12; i++) { const w = 0.05 + (i % 3) * 0.01; sDoor.add(box(w, 0.32, 0.25, bookMats[i % cols.length], -0.86 + i * 0.066, y + 0.18, 0.25)); } });
  const back = plane(0.86, 0.16, lambert(0xffffff, { map: plaqueTex("W-GANG", 320, 60, "#8a8f88", "#22190f", `600 34px ${MONO}`, 10) })); back.rotation.y = Math.PI; back.position.set(-0.46, 1.2, -0.005); sDoor.add(back);
  doorPv.add(sDoor); doorPv.rotation.y = 1.15; // steht offen wie eine Tür
  add(place(group(gang, doorPv), "e", 0.62, 0, 0));
  add(place(hs("b_wgang", group(box(0.95, 2.3, 0.3, ZONE, 0, 1.15, 0))), "e", 0.62, 0, 0));
  // Gerahmte Skizze (Fluchtplan)
  const fpG = ornateFrame(0.5, 0.6, lambert(0xffffff, { map: sketchTex() }), M.woodDark, 0.04, 0.05);
  add(place(hs("b_fluchtplan", fpG, { act: liftAct(fpG, (a, k) => { a.position.set(0, -0.15 * k, 0.45 * k); }, 750, "click") }), "e", 0.88, 1.75, 0.02));

  /* ================= SÜD · Wandtresor, Formular, Bild ================= */
  const safeIn = std(0x0d0b09, { roughness: 0.6 }); // offener Innenraum hinter der Wandöffnung
  const frameS = group(box(0.82, 0.06, 0.06, M.trim, 0, 0.38, 0), box(0.82, 0.06, 0.06, M.trim, 0, -0.38, 0), box(0.06, 0.82, 0.06, M.trim, -0.38, 0, 0), box(0.06, 0.82, 0.06, M.trim, 0.38, 0, 0));
  const safe = group(frameS, box(0.7, 0.7, 0.02, safeIn, 0, 0, -0.3), box(0.02, 0.7, 0.3, safeIn, -0.35, 0, -0.15), box(0.02, 0.7, 0.3, safeIn, 0.35, 0, -0.15), box(0.7, 0.02, 0.3, safeIn, 0, 0.35, -0.15), box(0.7, 0.02, 0.3, safeIn, 0, -0.35, -0.15));
  const sw = group(rbox(0.26, 0.15, 0.06, std(0x2a2b28, { metalness: 0.5 }), 0, 0, 0, 0.01), plane(0.22, 0.1, new THREE.MeshBasicMaterial({ map: plaqueTex("TUNNEL W · ENTRIEGELT", 384, 160, "#9fe0b0", "#2a2b28", `600 30px ${MONO}`, 1), toneMapped: false }), 0, 0, 0.032));
  sw.position.set(0.12, 0.12, -0.25); safe.add(sw, box(0.68, 0.02, 0.28, std(0x2a2b28), 0, -0.08, -0.14));
  const sPv = new THREE.Group(); sPv.position.set(-0.35, 0, 0.04);
  const sDoorS = group(rbox(0.7, 0.7, 0.08, std(0x3a3c37, { metalness: 0.7, roughness: 0.4 }), 0.35, 0, 0, 0.02));
  const dial = group(cyl(0.12, 0.12, 0.04, std(0x2a2b28, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, 32).rotateX(Math.PI / 2), cyl(0.035, 0.035, 0.06, std(0x5a5c55, { metalness: 0.8 }), 0, 0, 0.02, 16).rotateX(Math.PI / 2));
  dial.position.set(0.35, 0, 0.06); sDoorS.add(dial, rbox(0.06, 0.16, 0.05, std(0x5a5c55, { metalness: 0.8 }), 0.6, 0, 0.06, 0.01));
  sPv.add(sDoorS); safe.add(sPv);
  const dialGo = pulse(0.7, (k) => { dial.rotation.z = Math.sin(k * Math.PI) * 2.2; });
  add(place(hs(["b_tresor_offen", "b_tresor"], group(safe, box(0.85, 0.85, 0.2, ZONE, 0, 0, 0.08)), { act: { when: (id) => id === "b_tresor", play: () => { dialGo(); [0, 180, 360].forEach((ms) => setTimeout(() => snd("tick"), ms)); return 750; } } }), "s", 0.5, 1.35, 0.02));
  let tOpen = false; state((has) => { tOpen = has("tresor_offen"); });
  anim((dt) => { sPv.rotation.y = lerp(sPv.rotation.y, tOpen ? -1.6 : 0, Math.min(1, dt * 2)); });
  const form = plane(0.32, 0.42, lambert(0xffffff, { map: formTex() })); form.rotation.z = -0.03;
  const formG = group(form);
  add(place(hs("b_formular", formG, { act: liftAct(formG, (a, k) => { a.position.set(0, -0.2 * k, 0.5 * k); }) }), "s", 0.7, 1.55, 0.012));
  // Bild: am oberen Rand von der Wand abheben – dahinter nur Wand
  const bildG = ornateFrame(0.62, 0.46, lambert(0xffffff, { map: hotelPicTex() }), M.woodDark, 0.04, 0.05);
  add(place(hs("b_bild", bildG, { act: liftAct(bildG, (a, k) => { a.position.set(0, 0.04 * k, 0.12 * k); a.rotation.x = -0.55 * k; }, 800, "click") }), "s", 0.22, 1.95, 0.02));
  // Ledersessel (Deko)
  const chair = group(rbox(0.7, 0.42, 0.7, M.velvet, 0, 0.3, 0, 0.08), rbox(0.7, 0.7, 0.16, M.velvet, 0, 0.7, -0.28, 0.08), rbox(0.14, 0.5, 0.7, M.velvet, -0.34, 0.5, 0, 0.06), rbox(0.14, 0.5, 0.7, M.velvet, 0.34, 0.5, 0, 0.06));
  [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([x, z]) => { const l = turnedLeg(0.1, 0.03, M.woodDark); l.position.set(x, 0, z); chair.add(l); });
  chair.rotation.y = 0.5; add(place(chair, "s", 0.9, 0, 0.7));

  /* ================= WEST · Fenster zum Innenhof, Stahltür Servicetunnel W ================= */
  const outside = plane(2.4, 2.1, basic(0xffffff, { map: courtTex() }), 0, 1.72, -0.9);
  const rainP = plane(2.2, 1.9, new THREE.MeshBasicMaterial({ map: rainTex(), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 1.72, -0.35);
  anim((dt) => { rainP.material.map.offset.y += dt * 1.1; });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9ab4c8, transparent: true, opacity: 0.08, roughness: 0.05, depthWrite: false });
  const win = group(outside, rainP, plane(2.0, 1.75, glassM, 0, 1.725, -0.05), box(2.12, 0.08, 0.14, M.trim, 0, 2.64, 0), box(2.2, 0.06, 0.24, M.trim, 0, 0.83, 0.06), box(0.08, 1.8, 0.12, M.trim, -1.03, 1.72, 0), box(0.08, 1.8, 0.12, M.trim, 1.03, 1.72, 0), box(0.05, 1.75, 0.06, M.trim, 0, 1.72, -0.03), box(2.0, 0.05, 0.06, M.trim, 0, 1.94, -0.03));
  add(place(hs("b_fenster", win), "w", 0.32, 0, 0));
  // Vorhänge
  [-1.25, 1.25].forEach((x) => { const c = group(); for (let i = 0; i < 5; i++) c.add(cyl(0.045, 0.05, 2.3, M.velvet, -0.16 + i * 0.08, 1.4, (i % 2) * 0.03, 12)); c.position.x = x; add(place(c, "w", 0.32, 0, 0.14)); });
  const greenL = new THREE.PointLight(0x9fe0b0, 0.5, 4, 2); place(greenL, "w", 0.32, 1.7, 0.4); add(greenL);
  // Stahltür Servicetunnel W; dahinter die Rampe hinauf mit grünem Schimmer (Tastenfeld an Tor W2)
  const tun = group(box(1.0, 0.04, 3.0, std(0x2a2a26), 0, 2.25, -1.5), box(0.04, 2.3, 3.0, std(0x3a3a35, { roughness: 0.9 }), -0.5, 1.15, -1.5), box(0.04, 2.3, 3.0, std(0x3a3a35, { roughness: 0.9 }), 0.5, 1.15, -1.5), box(1.0, 2.3, 0.04, basic(0x020302), 0, 1.15, -3.0));
  const tRamp = box(1.0, 0.04, 3.0, std(0x2a2a26), 0, 0.2, -1.5); tRamp.rotation.x = -0.14; tun.add(tRamp);
  const tunL = new THREE.PointLight(0x9fe0b0, 0, 3.5, 2); tunL.position.set(0, 1.6, -2.6); tun.add(tunL);
  const tPv = new THREE.Group(); tPv.position.set(-0.47, 0, -0.02);
  tPv.add(group(rbox(0.94, 2.16, 0.06, M.steel, 0.47, 1.08, 0, 0.01), plane(0.62, 0.12, lambert(0xffffff, { map: plaqueTex("SERVICETUNNEL W", 384, 72, "#2a2119", "#e6c48a", `600 32px ${MONO}`, 3) }), 0.47, 1.8, 0.032)));
  const tLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd4443a, toneMapped: false })); tLed.position.set(0.62, 1.25, 0.05);
  add(place(group(tun, tPv, tLed, box(0.06, 2.24, 0.1, M.steel, -0.52, 1.12, 0), box(0.06, 2.24, 0.1, M.steel, 0.52, 1.12, 0), box(1.1, 0.06, 0.1, M.steel, 0, 2.22, 0)), "w", 0.745, 0, 0));
  // Am Ende der Rampe: Tor W2 mit Plakette und Tastenfeld (Rätsel „tor“); die Kamera fährt in der Nahansicht den Gang hinauf
  const gate = group(rbox(0.96, 2.1, 0.05, std(0x3d403a, { metalness: 0.6, roughness: 0.55 }), 0, 1.05 + 0.42, -2.95, 0.01),
    plane(0.5, 0.1, lambert(0xffffff, { map: plaqueTex("NOTAUSGANG – ZUTRITT NUR MIT FREIGABE", 512, 96, "#2a2119", "#e6c48a", `600 24px ${MONO}`, 3) }), -0.12, 1.85, -2.92),
    plane(0.22, 0.08, lambert(0xffffff, { map: plaqueTex("TOR W2", 256, 80, "#2a2119", "#cdbd9b", `600 40px ${MONO}`, 3) }), -0.12, 2.05, -2.92));
  tun.add(gate);
  const tpad = new THREE.Group(); tpad.position.set(0.3, 1.62, -2.9); tun.add(tpad);
  tpad.add(rbox(0.14, 0.2, 0.025, std(0x2a2b28, { metalness: 0.5, roughness: 0.5 }), 0, 0, 0, 0.006));
  const tdC = document.createElement("canvas"); tdC.width = 128; tdC.height = 40; const tdT = new THREE.CanvasTexture(tdC); tdT.colorSpace = THREE.SRGBColorSpace;
  const tdDraw = (txt, col = "#9fe0b0") => { const g = tdC.getContext("2d"); g.fillStyle = "#0b2a1e"; g.fillRect(0, 0, 128, 40); g.fillStyle = col; g.font = `600 26px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 22); tdT.needsUpdate = true; };
  tdDraw("– – – –"); tpad.add(plane(0.1, 0.03, new THREE.MeshBasicMaterial({ map: tdT, toneMapped: false }), 0, 0.072, 0.014));
  const tkTex = {}; const tkt = (k) => tkTex[k] ??= canvasTex(64, 64, (g) => { g.fillStyle = "#3d3d38"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#d8d8c8"; g.font = `600 36px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(k, 32, 34); });
  const tKeys = "123456789*0#".split("").map((k, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.026, 0.01), [M.steel, M.steel, M.steel, M.steel, new THREE.MeshStandardMaterial({ map: tkt(k), roughness: 0.5 }), M.steel]);
    b.position.set(-0.038 + (i % 3) * 0.038, 0.03 - Math.floor(i / 3) * 0.033, 0.016); b.userData.k = k; tpad.add(b); return b; });
  const tpL = new THREE.PointLight(0x9fe0b0, 0, 1.2, 2); tpL.position.set(0.3, 1.7, -2.6); tun.add(tpL);
  let torIn = "", tPress = {};
  const torPress = (b) => { const k = b.userData.k; tPress[k] = 0; snd("key"); if (!/\d/.test(k)) { torIn = ""; tdDraw("– – – –"); return; }
    torIn += k; tdDraw(torIn.padEnd(4, "–").split("").join(" "));
    if (torIn.length === 4) { const v = torIn; torIn = ""; setTimeout(() => { const r = eng().tryLock("tor", v); if (r.ok) tdDraw("OFFEN"); else { tdDraw("– – – –", "#e05a4a"); setTimeout(() => tdDraw("– – – –"), 900); } }, 250); } };
  anim((dt) => { tKeys.forEach((b) => { const t = tPress[b.userData.k]; if (t === undefined) return; tPress[b.userData.k] = t + dt; b.position.z = t < 0.15 ? 0.012 : 0.016; if (t > 0.2) delete tPress[b.userData.k]; }); });
  const torSpec = { when: (id) => id === "b_tunnel" && !eng().isSolved("tor"), cam: [0.1, 1.76, -2.22], center: [0.1, 1.72, -2.92], fov: 45, exitDelay: 2600,
    hint: "Vier Ziffern eintippen · * löscht", value: () => torIn, enter: () => { torIn = ""; tdDraw("– – – –"); }, parts: () => tKeys.map((b) => ({ obj: b, name: "taste" + b.userData.k, tap: () => torPress(b) })) };
  let tRat = -1; anim((dt) => { if (tRat < 0) return; tRat += dt; tPv.position.z = -0.02 + Math.sin(tRat * 60) * 0.005 * (1 - tRat / 0.5); if (tRat > 0.5) { tRat = -1; tPv.position.z = -0.02; } });
  add(place(hs(["b_tunnel", "b_tunnel_zu"], group(box(0.98, 2.2, 0.3, ZONE, 0, 1.1, 0)), { focus: torSpec, act: { when: (id) => id === "b_tunnel_zu", play: () => { tRat = 0; snd("click"); return 550; } } }), "w", 0.745, 0, 0));
  let tun_ = false; state((has) => { tun_ = has("tunnel_offen"); tLed.material.color.setHex(tun_ ? 0x7fa36d : 0xd4443a); tunL.intensity = tun_ ? 1.2 : 0; tpL.intensity = tun_ ? 0.8 : 0; });
  anim((dt) => { tPv.rotation.y = lerp(tPv.rotation.y, tun_ ? 1.3 : 0, Math.min(1, dt * 2)); });

  // Deckenleuchte (schwach)
  const ceilL = new THREE.PointLight(0xffc98a, 3, 0, 2); ceilL.position.set(0, H - 0.5, 0); add(ceilL);
  add(group(cyl(0.18, 0.1, 0.08, std(0xd8c9a8, { emissive: 0x5a4424, emissiveIntensity: 0.6 }), 0, H - 0.05, 0)));
  return { eye: [0, 1.62, 0], hd: true, R, H, env: 0.28 };
});
ready();
