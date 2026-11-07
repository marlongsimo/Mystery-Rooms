/*
 * SEKTOR 9 – Sicherheits-Halle (Sektor D): Maschinenhalle, drei Standpunkte.
 *   Maschinenhalle (Nord/West): zwei Generatoren, Trennschalter AUSSEN-3, Werkbank (Schaltbuch, Nowaks Werkzeugkiste mit Band 5),
 *     Schaltpult mit drei Hebeln (KERN 2 – KERN 1 – NETZ D → Zeitrelais 90 s; zweiter Schalter im Leitstand A).
 *   Rechenzentrum (Ost, Glaskasten mit Tastenfeld 2305): Rechnerschränke, Konsole, Prozessliste, Band 6 (Quellmaterial), Sendeanlage.
 *   Vor Sektor 9 (Süd): runde Panzertür 9 (öffnet sich von innen, sobald man im Rechenzentrum ist), Kabeltrasse.
 * Koordinaten: x −9…9 (West…Ost), z −6…6 (Nord…Süd), Höhe 6,5 m. Eingang Nordwand (x = 0).
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { mats, shellBox, crt, termText, cageLamp, tube, pipe, label, stencil, stationMark, animateMarks, sheet, lines, keypad, MONO, std } from "./s9kit.js?v=1";

defineRoom("sicherheit", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const W = 18, D = 12, H = 6.5;
  const hemi = scene.children.find((c) => c.isHemisphereLight); if (hemi) hemi.intensity = 0.3;
  shellBox(ctx, { W, D, H, M, holes: { n: [{ x: 0, y: 0, w: 1.9, h: 2.5 }], s: [{ x: 0, y: 0.2, w: 2.6, h: 2.6 }] } });
  [-1.6, 0.4, 2.4].forEach((z, i) => add(pipe(M, W, 0.12 - i * 0.02, 0, H - 0.4 - i * 0.3, z)));
  for (let i = 0; i < 8; i++) add(box(0.06, 0.06, D, M.black, -3 + i * 0.12, H - 0.9, 0)); // Kabelbündel

  /* ===== Maschinenhalle ===== */
  const gen = (z) => { const g = group(box(1.8, 0.3, 3.4, M.ceil, 0, 0.15, 0), box(1.6, 1.8, 3.0, M.paint, 0, 1.2, 0), box(1.62, 0.2, 3.02, M.steelDark, 0, 2.15, 0), cyl(0.12, 0.12, 2.6, M.rust, 0.4, 3.4, -1, 14));
    for (let i = 0; i < 6; i++) g.add(box(0.02, 1.2, 0.2, M.black, 0.81, 1.2, -1.2 + i * 0.45));
    const gauge = cyl(0.12, 0.12, 0.03, std(0xe8e0c0), 0.82, 1.7, 1.1, 20); gauge.rotation.z = Math.PI / 2; g.add(gauge); g.position.set(-6.6, 0, z); return g; };
  const g1 = gen(-0.6), g2 = gen(3.6); add(hs("d_generator", group(g1, g2, box(2.0, 2.4, 7.6, ZONE, -6.6, 1.2, 1.5))));
  let vib = 0; anim((dt, t) => { vib = Math.sin(t * 60) * 0.003; g1.position.x = -6.6 + vib; });
  const trenner = group(box(0.7, 1.0, 0.25, M.paintGrey, 0, 0, 0), box(0.1, 0.4, 0.1, M.red, 0.15, -0.25, 0.18), plane(0.5, 0.1, label("AUSSEN-3", 512, 100, "#e8e2cc", "#6b2a22", 50), 0, 0.38, 0.13));
  trenner.children[1].rotation.x = 0.9; trenner.position.set(-3.6, 1.6, -5.85); add(hs("d_trenner", trenner));
  // Werkbank an der Westwand (Nordteil): Schaltbuch, Werkzeugkiste
  const bench = group(box(0.8, 0.9, 2.4, M.wood, 0, 0.45, 0), box(0.85, 0.05, 2.45, M.steelDark, 0, 0.92, 0)); bench.position.set(-8.5, 0, -4.4); add(bench);
  const book = group(box(0.3, 0.05, 0.4, std(0x2d3a30), 0, 0.025, 0), box(0.28, 0.01, 0.38, M.paper, 0, 0.052, 0), box(0.4, 0.15, 0.5, ZONE, 0, 0.05, 0)); book.position.set(-8.45, 0.95, -5.0); book.rotation.y = 0.3; add(hs("d_schaltbuch", book));
  const tbox = group(box(0.5, 0.25, 0.3, M.red, 0, 0.125, 0), box(0.52, 0.04, 0.32, M.steelDark, 0, 0.26, 0), plane(0.36, 0.06, label("P. NOWAK – FINGER WEG", 512, 90, "#222", "#d8d0b4", 34), 0, 0.15, 0.152), box(0.6, 0.4, 0.4, ZONE, 0, 0.15, 0));
  tbox.position.set(-8.45, 0.95, -3.7); tbox.rotation.y = Math.PI / 2; add(hs("d_werkzeug", tbox));
  // Schaltpult mit drei Hebeln (Front nach Norden)
  const pult = new THREE.Group(); pult.position.set(-2.4, 0, 0.6); pult.rotation.y = Math.PI; add(pult);
  pult.add(box(2.0, 1.1, 0.6, M.paintGrey, 0, 0.55, 0), plane(1.6, 0.14, label("ABSCHALTUNG RECHENKERN – NUR MIT LEITSTAND A", 1024, 100, "#e8e2cc", "#6b2a22", 34), 0, 1.0, 0.305));
  const LV = [["netz", "NETZ D"], ["kern1", "KERN 1"], ["kern2", "KERN 2"]];
  const levers = LV.map(([id, name], i) => { const pv = new THREE.Group(); pv.position.set(-0.6 + i * 0.6, 0.62, 0.32); pv.add(box(0.05, 0.35, 0.05, M.steel, 0, 0.17, 0), box(0.14, 0.08, 0.08, M.red, 0, 0.34, 0), box(0.22, 0.45, 0.18, ZONE, 0, 0.2, 0));
    pult.add(pv, plane(0.32, 0.06, label(name, 320, 70, "#e8e2cc", "#2d3a30", 36), -0.6 + i * 0.6, 0.48, 0.305)); pv.userData.id = id; return pv; });
  const rC = document.createElement("canvas"); rC.width = 256; rC.height = 64; const rT = new THREE.CanvasTexture(rC); rT.colorSpace = THREE.SRGBColorSpace;
  pult.add(plane(0.5, 0.12, new THREE.MeshBasicMaterial({ map: rT, toneMapped: false }), 0.7, 0.86, 0.305));
  let seq = [], sLock = false;
  const relayLeft = () => { const d = eng().state().relay.d; return d ? Math.max(0, 90 - (Date.now() - d) / 1000) : 0; };
  const pull = (pv) => { const id = pv.userData.id; if (sLock || seq.includes(id) || eng().isSolved("k3") || relayLeft() > 0) return; seq.push(id); snd("lever");
    const r = eng().tryLock("k3d", seq.join(",")); if (!r.ok && !r.partial) { sLock = true; setTimeout(() => { seq = []; sLock = false; }, 800); } };
  let rAcc = 0;
  anim((dt) => {
    const left = relayLeft(), done = eng().isSolved("k3");
    if (!done && left <= 0 && seq.length === 3) seq = []; // Relais abgelaufen: Hebel springen zurück
    levers.forEach((pv) => { const down = done || seq.includes(pv.userData.id) || left > 0; pv.rotation.x = lerp(pv.rotation.x, down ? 1.2 : 0, Math.min(1, dt * 8)); });
    rAcc += dt; if (rAcc > 0.25) { rAcc = 0; const c = rC.getContext("2d"); c.fillStyle = "#120404"; c.fillRect(0, 0, 256, 64); c.fillStyle = done ? "#8fd19e" : left > 0 ? "#ff3b2a" : "#5a2a22"; c.font = `600 36px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(done ? "SCHARF" : left > 0 ? `${Math.ceil(left)} s` : "-- s", 128, 34); rT.needsUpdate = true; }
  });
  const pultSpec = { when: (id) => id === "d_pult" && eng().has("schaltbuch") && !eng().isSolved("k3"), cam: [-2.4, 1.75, -1.55], center: [-2.4, 0.85, 0.35], fov: 46, exitDelay: 2600,
    hint: "Hebel in der Reihenfolge aus dem Schaltbuch umlegen", value: () => seq.join(","), enter: () => { if (!sLock && relayLeft() <= 0) seq = []; },
    parts: () => levers.map((pv) => ({ obj: pv, name: "hebel_" + pv.userData.id, tap: () => pull(pv), drag: (dx, dy) => { if (dy > 4) pull(pv); } })) };
  add(hs(["d_pult_ok", "d_pult"], group(box(2.2, 1.3, 0.8, ZONE, -2.4, 0.65, 0.6)), { focus: pultSpec }));
  const exitD = group(box(1.9, 2.5, 0.1, new THREE.MeshBasicMaterial({ color: 0x070807 }), 0, 1.25, 0), plane(1.4, 0.24, stencil("VERTEILER", 1024, 160, "#d8d0b4", 110), 0, 2.75, 0.06), box(1.9, 2.5, 0.4, ZONE, 0, 1.25, 0));
  exitD.position.set(0, 0, -5.93); add(hs("d_ausgang", exitD));

  /* ===== Rechenzentrum (Glaskasten Ost) ===== */
  const x0 = 3, z0 = -5.2, z1 = 0.6;
  const gw = plane(z1 - z0, 3.0, M.glass); gw.rotation.y = -Math.PI / 2; gw.position.set(x0, 1.5, (z0 + z1) / 2); add(gw);
  const gs = plane(W / 2 - x0, 3.0, M.glass); gs.position.set((x0 + 9) / 2, 1.5, z1); add(gs);
  add(box(0.08, 3.0, 0.08, M.steelDark, x0, 1.5, z1), box(9 - x0, 0.15, z1 - z0, M.paintGrey, (x0 + 9) / 2, 3.05, (z0 + z1) / 2));
  for (let i = 0; i < 5; i++) add(box(0.06, 3.0, 0.06, M.steelDark, x0, 1.5, z0 + i * 1.45));
  const rDoor = group(plane(1.1, 2.3, M.glass, 0, 1.15, 0), box(1.1, 0.06, 0.05, M.steelDark, 0, 2.3, 0), box(0.05, 2.3, 0.05, M.steelDark, 0.55, 1.15, 0), box(0.05, 2.3, 0.05, M.steelDark, -0.55, 1.15, 0));
  rDoor.position.set(x0 - 0.02, 0, -2.2); rDoor.rotation.y = -Math.PI / 2; add(rDoor);
  const rkp = keypad(ctx, M, { pid: "rz" }); rkp.g.position.set(x0 - 0.05, 1.35, -1.25); rkp.g.rotation.y = -Math.PI / 2; add(rkp.g);
  const note = plane(0.22, 0.12, new THREE.MeshLambertMaterial({ map: canvasTex(256, 140, (g) => { g.fillStyle = "#efe3b4"; g.fillRect(0, 0, 256, 140); g.fillStyle = "#2a2a6a"; g.font = "italic 20px serif"; ["Kennung = die Minute,", "in der ich die Leitung", "gekappt habe. Funkzeit,", "nicht ihre. – P.N."].forEach((t, i) => g.fillText(t, 10, 28 + i * 30)); }) }), 0, 0, 0);
  note.position.set(x0 - 0.04, 1.62, -1.25); note.rotation.y = -Math.PI / 2; add(note);
  const rzSpec = { when: (id) => id === "d_rz_tuer" && !eng().isSolved("rz"), cam: [x0 - 0.62, 1.45, -1.25], center: [x0 - 0.05, 1.42, -1.25], fov: 40, exitDelay: 2200,
    hint: "Vier Ziffern eintippen · * löscht", value: rkp.value, enter: rkp.reset, parts: rkp.parts };
  add(hs("d_rz_tuer", group(box(0.3, 2.4, 1.2, ZONE, x0 - 0.1, 1.2, -2.2), box(0.2, 0.5, 0.4, ZONE, x0 - 0.1, 1.45, -1.25)), { focus: rzSpec }));
  let rOpen = false; state(() => { rOpen = eng().isSolved("rz"); });
  anim((dt) => { rDoor.position.z = lerp(rDoor.position.z, rOpen ? -3.4 : -2.2, Math.min(1, dt * 2)); });
  // Rechnerschränke an der Ostwand, Konsole, Prozessliste, Quellband, Sendeanlage
  const racks = new THREE.Group(); const leds = [];
  for (let i = 0; i < 5; i++) { const r = group(box(0.8, 2.1, 0.9, M.paintGrey, 0, 1.05, 0)); for (let k = 0; k < 2; k++) { const reel = cyl(0.18, 0.18, 0.03, M.black, -0.2 + k * 0.4, 1.4, 0.46, 18); reel.rotation.x = Math.PI / 2; r.add(reel); reel.userData.spin = true; }
    for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshBasicMaterial({ color: 0x8fd19e, toneMapped: false })); l.position.set(-0.3 + k * 0.12, 0.6, 0.46); r.add(l); leds.push(l); }
    r.position.set(8.4, 0, -4.4 + i * 1.0); r.rotation.y = -Math.PI / 2; racks.add(r); }
  add(racks);
  anim((dt, t) => { racks.traverse((o) => { if (o.userData.spin) o.rotation.y += dt * 2; }); leds.forEach((l, i) => l.material.color.setHex((Math.floor(t * 4) + i * 3) % 5 ? 0x8fd19e : 0x0a2a10)); });
  const con = crt(M, 0.7, 0.5, [320, 220]); con.paint((g) => termText(g, ["LAUF 09", "VERSUCHSGRUPPE", "IN SEKTOR D", "", ["NAECHSTER REIZ:", "#e0b45a"], ["ENTSCHEIDUNG", "#e0b45a"]], { size: 20, step: 30, y: 34 }));
  const conG = group(box(1.4, 0.8, 0.6, M.paintGrey, 0, 0.4, 0), con.g); con.g.position.set(0, 1.12, 0); conG.position.set(6.8, 0, -1.6); conG.rotation.y = -Math.PI / 2; add(hs("d_konsole", conG));
  const plist = group(sheet(0.3, 0.42, (g, w, h) => { g.fillStyle = "#222"; g.font = `600 12px ${MONO}`; g.fillText("PROZESSE ECHO", 10, 20); lines(g, w, h, 12, 10, 36); }, M, 0.4), box(0.4, 0.05, 0.5, ZONE, 0, 0.02, 0));
  plist.position.set(6.55, 0.82, -1.1); add(hs("d_prozesse", plist));
  const qshelf = group(box(1.2, 1.6, 0.4, M.paintGrey, 0, 0.8, 0), box(1.1, 0.03, 0.38, M.steelDark, 0, 1.0, 0.01));
  const qband = cyl(0.12, 0.12, 0.03, M.black, 0, 1.13, 0, 18); qband.rotation.x = Math.PI / 2; qshelf.add(qband, plane(0.4, 0.06, label("Q-L09 · BRANDT", 400, 70, "#222", "#d8d0b4", 34), 0, 0.85, 0.205), box(1.2, 1.6, 0.5, ZONE, 0, 0.8, 0));
  qshelf.position.set(5.6, 0, -4.9); add(hs("d_quellband", qshelf));
  state(() => { qband.visible = !eng().has("taken_band6"); });
  const sender = group(box(1.6, 1.8, 0.7, M.paintGrey, 0, 0.9, 0)); const tubesS = [];
  for (let i = 0; i < 4; i++) { const tb = cyl(0.06, 0.06, 0.3, new THREE.MeshStandardMaterial({ color: 0x3a1a10, emissive: 0xff7a30, emissiveIntensity: 1.2, transparent: true, opacity: 0.85 }), -0.5 + i * 0.33, 1.95, 0, 12); sender.add(tb); tubesS.push(tb); }
  sender.add(plane(0.9, 0.12, label("SENDEN NUR AUS SEKTOR 9", 768, 100, "#e8e2cc", "#6b2a22", 40), 0, 1.4, 0.355), box(1.7, 2.3, 0.8, ZONE, 0, 1.1, 0));
  sender.position.set(6.0, 0, 0.0); sender.rotation.y = Math.PI; add(hs("d_sender", sender));
  anim((dt, t) => tubesS.forEach((tb, i) => { tb.material.emissiveIntensity = 1.0 + Math.sin(t * 3 + i) * 0.4; }));
  const rzL = new THREE.PointLight(0x9fe0b0, 2.0, 7, 2); rzL.position.set(6, 2.6, -2.2); add(rzL);

  /* ===== Vor Sektor 9: runde Panzertür in der Südwand ===== */
  const vault = new THREE.Group(); vault.position.set(0, 1.5, 5.9); add(vault);
  vault.add(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.16, 16, 48), M.steelDark)); vault.children[0].rotation.y = Math.PI;
  const vPivot = new THREE.Group(); vPivot.position.set(-1.3, 0, -0.05); vault.add(vPivot);
  const vDoor = group(cyl(1.3, 1.3, 0.35, M.steel, 0, 0, 0, 48)); vDoor.children[0].rotation.x = Math.PI / 2; vDoor.position.x = 1.3; vPivot.add(vDoor);
  for (let i = 0; i < 8; i++) { const b = cyl(0.07, 0.07, 0.2, M.steelDark, Math.cos(i * Math.PI / 4) * 1.05, Math.sin(i * Math.PI / 4) * 1.05, -0.2, 10); b.rotation.x = Math.PI / 2; vDoor.add(b); }
  const paintOver = plane(1.6, 0.36, new THREE.MeshLambertMaterial({ map: canvasTex(512, 116, (g) => { g.fillStyle = "#5a5e58"; g.fillRect(0, 0, 512, 116); g.globalAlpha = 0.35; g.fillStyle = "#e8e2cc"; g.font = `600 64px ${MONO}`; g.textAlign = "center"; g.fillText("RECHENKERN 9", 256, 80); g.globalAlpha = 0.6; g.fillStyle = "#5a5e58"; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * 512, Math.random() * 116, 30 + Math.random() * 60, 10 + Math.random() * 20); }) }), 0, 0.45, -0.18);
  paintOver.rotation.y = Math.PI; vDoor.add(paintOver);
  const nine = plane(0.8, 0.8, stencil("9", 256, 256, "#b8452f", 220), 0, -0.35, -0.18); nine.rotation.y = Math.PI; vDoor.add(nine);
  const behind = group(box(2.6, 2.6, 0.1, new THREE.MeshBasicMaterial({ color: 0x1a0402 }), 0, 0, 0.6)); vault.add(behind);
  const vL = new THREE.PointLight(0xff3020, 0, 5, 2); vL.position.set(0, 0, 0.3); vault.add(vL);
  add(hs(["d_tuer9_offen", "d_tuer9"], group(box(2.8, 2.8, 0.6, ZONE, 0, 1.5, 5.7)), { aimLocal: [0, 1.5, 5.6] }));
  let v9 = false; state(() => { v9 = eng().has("tuer9"); });
  anim((dt) => { vPivot.rotation.y = lerp(vPivot.rotation.y, v9 ? 1.25 : 0, Math.min(1, dt * 0.5)); vL.intensity = v9 ? 3 : 0; });
  const trasse = group(); for (let i = 0; i < 10; i++) trasse.add(box(0.05, 0.05, 6, M.black, 2.0 + i * 0.07, 4.6 + (i % 3) * 0.08, 2.9));
  trasse.add(box(0.9, 0.4, 6, ZONE, 2.3, 4.6, 2.9)); add(hs("d_trasse", trasse));

  /* ===== Licht ===== */
  const lamps = [[-5, -3], [-5, 3], [0, 0], [0, 4]].map(([x, z]) => { const l = cageLamp(M, 0xffb060, 4, 10); l.g.position.set(x, H - 1.2, z); add(l.g); return l; });
  lamps[2].light.userData.shadow = true;
  anim((dt, t) => { lamps.forEach((l, i) => { l.light.intensity = 4 * (0.85 + Math.sin(t * (7 + i)) * 0.08); }); });
  add(new THREE.AmbientLight(0x2a2a30, 0.5));
  const warn = new THREE.PointLight(0xd0473a, 1.2, 8, 2); warn.position.set(0, 4.5, 4.8); add(warn);
  anim((dt, t) => { warn.intensity = 1.0 + Math.max(0, Math.sin(t * 2.5)) * 1.6; });

  /* ===== Standpunkte ===== */
  const mM = stationMark("MASCHINENHALLE", { signY: 3.0 }); mM.position.set(-2.5, 0, -2.6); add(hs("st_maschinen", mM, { aimLocal: [0, 3.0, 0] }));
  const mR = stationMark("RECHENZENTRUM", { signY: 3.4 }); mR.position.set(5.8, 0, -2.2); add(hs("st_rechenzentrum", mR, { aimLocal: [0, 3.4, 0] }));
  const m9 = stationMark("VOR SEKTOR 9", { signY: 3.0 }); m9.position.set(0, 0, 2.8); add(hs("st_vor9", m9, { aimLocal: [0, 3.0, 0] }));
  const marks = { maschinen: mM, rechenzentrum: mR, vor9: m9 };
  animateMarks(ctx, Object.values(marks));
  anim(() => { const here = eng().state().station; Object.entries(marks).forEach(([k, m]) => { m.visible = k !== here; }); });
  const big = plane(4.4, 0.6, stencil("SICHERHEIT D", 1024, 160, "#cfc7aa", 120)); big.position.set(-4.5, 4.6, -5.95); add(big);
  return { eyes: { maschinen: [-2.5, 1.65, -2.6], rechenzentrum: [5.8, 1.65, -2.2], vor9: [0, 1.65, 2.8] }, hd: true, R: 8, H, env: 0.14 };
});
ready();
