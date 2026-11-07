/*
 * SEKTOR 9 – Forschungs-Halle (Sektor C): weißes Labor, drei Standpunkte.
 *   Labor (West/Mitte): ECHO-Uhr (läuft: Ortszeit + 7 Minuten), Labortische, Versuchsplan, Ausgang.
 *   Beobachtungsraum (Nordost, Kartenleser): Spiegelglas in den Versuchsraum „VERSUCHSGRUPPE 09“, Monitore, Protokoll, Asservatenkiste (Band 4), Schleusenkarte.
 *   Datenarchiv (Südost, hinter der Druckschleuse: vier Tasten selbst drücken): Bandschränke, Verzeichnis, Terminal Protokollprüfung (K1: Eintrag antippen + Funkzeit tippen).
 * Koordinaten: x −8…8 (West…Ost), z −5,5…5,5 (Nord…Süd), Höhe 4,6 m. Eingang Westwand (z = 0).
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { lift } from "./interact.js?v=3";
import { mats, shellBox, crt, termText, tube, label, stencil, stationMark, animateMarks, sheet, lines, keypad, MONO, std } from "./s9kit.js?v=1";

defineRoom("forschung", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const W = 16, D = 11, H = 4.6;
  const hemi = scene.children.find((c) => c.isHemisphereLight); if (hemi) hemi.intensity = 0.45;
  // weiße Fliesen statt Beton
  const tileTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#d9dcd4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#a9ada4"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }, { repeat: [8, 2.4] });
  M.wall = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.35, metalness: 0 });
  M.wallLow = std(0x8a9a90, { roughness: 0.5 });
  shellBox(ctx, { W, D, H, M, holes: { w: [{ x: 0, y: 0, w: 1.9, h: 2.5 }], n: [{ x: 5, y: 1.0, w: 3.2, h: 1.4 }] } });
  const wallM = M.wall;
  const wbox = (w, h, d, x, y, z) => add(box(w, h, d, wallM, x, y, z));

  /* ===== Labor ===== */
  // ECHO-Uhr: Ortszeit + 7 Minuten (wer auf die eigene Uhr schaut, merkt es)
  const cC = document.createElement("canvas"); cC.width = 512; cC.height = 140; const cT = new THREE.CanvasTexture(cC); cT.colorSpace = THREE.SRGBColorSpace;
  const drawClock = () => { const g = cC.getContext("2d"), d = new Date(Date.now() + 7 * 60000); g.fillStyle = "#120404"; g.fillRect(0, 0, 512, 140); g.fillStyle = "#ff3b2a"; g.shadowColor = "#ff3b2a"; g.shadowBlur = 18; g.font = `600 96px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText([d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"), 256, 66); g.shadowBlur = 0; g.fillStyle = "#7a2a22"; g.font = `500 18px ${MONO}`; g.fillText("SYSTEMZEIT ECHO", 256, 126); cT.needsUpdate = true; };
  drawClock(); let ct = 0; anim((dt) => { ct += dt; if (ct > 1) { ct = 0; drawClock(); } });
  const clock = group(box(1.9, 0.62, 0.12, M.black, 0, 0, 0), plane(1.8, 0.5, new THREE.MeshBasicMaterial({ map: cT, toneMapped: false }), 0, 0, 0.062),
    plane(0.5, 0.06, new THREE.MeshLambertMaterial({ map: canvasTex(512, 64, (g) => { g.fillStyle = "#efe3b4"; g.fillRect(0, 0, 512, 64); g.fillStyle = "#2a2a6a"; g.font = "italic 30px serif"; g.fillText("Geht 7 Min. vor der Funkuhr. Absichtlich? – P.N.", 8, 44); }) }), 0.55, -0.37, 0.065));
  clock.position.set(-3.2, 3.2, -5.43); add(hs("c_uhr", clock));
  const clockL = new THREE.PointLight(0xff3b2a, 0.8, 3, 2); clockL.position.set(-3.2, 3.0, -4.8); add(clockL);
  // Labortische an Nord- und Südwand
  const bench = (z, rot) => { const g = group(box(4.2, 0.9, 0.8, std(0xe8eae4, { roughness: 0.4 }), 0, 0.45, 0), box(4.3, 0.04, 0.85, std(0x2a2e2c, { roughness: 0.3 }), 0, 0.92, 0));
    for (let i = 0; i < 3; i++) { const o = crt(M, 0.28, 0.2, [160, 120]); o.paint((c, w, h) => { c.strokeStyle = "#8fd19e"; c.lineWidth = 3; c.beginPath(); for (let x = 0; x < w; x += 4) c.lineTo(x, h / 2 + Math.sin(x * (0.05 + i * 0.03)) * 30); c.stroke(); }); o.g.scale.setScalar(0.9); o.g.position.set(-1.4 + i * 1.3, 1.15, -0.1); g.add(o.g); }
    g.add(box(0.5, 0.18, 0.35, M.paintGrey, 1.6, 1.03, 0.1)); g.position.set(-4.2, 0, z); g.rotation.y = rot; return g; };
  const bN = bench(-4.85, 0), bS = bench(4.85, Math.PI);
  add(hs("c_tische", group(bN, bS, box(4.4, 1.4, 0.9, ZONE, -4.2, 0.7, 4.85)), { aimLocal: [-4.2, 1.0, 4.6] }));
  const clip = group(box(0.26, 0.012, 0.34, M.wood, 0, 0.006, 0), sheet(0.22, 0.3, (g, w, h) => { g.fillStyle = "#222"; g.font = `600 13px ${MONO}`; g.fillText("LAUF 08 · ABLAUF", 12, 22); lines(g, w, h, 10, 12, 40); }, M, 0), box(0.06, 0.02, 0.03, M.steel, 0, 0.018, -0.15), box(0.34, 0.06, 0.42, ZONE, 0, 0.02, 0));
  clip.children[1].position.y = 0.014; clip.position.set(-4.6, 0.95, -4.7); clip.rotation.y = 0.2; add(hs("c_plan", clip));
  const exitD = group(box(1.9, 2.5, 0.1, new THREE.MeshBasicMaterial({ color: 0x070807 }), 0, 1.25, 0), plane(1.4, 0.24, stencil("VERTEILER", 1024, 160, "#5a6a60", 110), 0, 2.75, 0.06), box(1.9, 2.5, 0.4, ZONE, 0, 1.25, 0));
  exitD.position.set(-7.93, 0, 0); exitD.rotation.y = Math.PI / 2; add(hs("c_ausgang", exitD));

  /* ===== Beobachtungsraum (Nordost) ===== */
  wbox(0.65, H, 0.15, 2.325, H / 2, -1.425); wbox(4.25, H, 0.15, 5.875, H / 2, -1.425); wbox(1.1, H - 2.2, 0.15, 3.2, 2.2 + (H - 2.2) / 2, -1.425); // Südwand mit Türöffnung
  wbox(0.15, H, 4, 2, H / 2, -3.5); // Westwand
  // Türöffnung: Wandstück ersetzen – Tür als Schiebetür vor der Wand
  const bDoor = group(box(1.1, 2.2, 0.08, M.steel, 0, 1.1, 0), plane(0.5, 0.1, label("BEOBACHTUNG", 512, 96, "#e8e2cc", "#7a6a20", 46), 0, 1.75, 0.045));
  bDoor.position.set(3.2, 0, -1.38); add(bDoor);
  const reader = group(box(0.14, 0.22, 0.06, M.black, 0, 0, 0), box(0.16, 0.24, 0.02, std(0xc9a030), 0, 0, -0.03)); const bLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd0473a, toneMapped: false })); bLed.position.set(0, -0.07, 0.035); reader.add(bLed);
  reader.position.set(4.05, 1.3, -1.32); add(reader);
  add(hs(["c_beob_tuer"], group(box(1.6, 2.3, 0.3, ZONE, 3.45, 1.15, -1.25)), {}));
  let bOpen = false; state(() => { bOpen = eng().has("beobachtung"); bLed.material.color.setHex(bOpen ? 0x8fd19e : 0xd0473a); });
  anim((dt) => { bDoor.position.x = lerp(bDoor.position.x, bOpen ? 2.1 : 3.2, Math.min(1, dt * 2)); });
  // Spiegelglas und Versuchsraum dahinter
  const mirror = plane(3.2, 1.4, new THREE.MeshPhysicalMaterial({ color: 0x1a2a24, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.6, depthWrite: false }), 5, 1.7, -5.48); add(mirror);
  add(hs("c_spiegel", group(box(3.2, 1.4, 0.1, ZONE, 5, 1.7, -5.45))));
  const vr = new THREE.Group(); vr.position.set(5, 0, -7.3);
  vr.add(box(4.6, 0.05, 3.6, std(0xd8dad2), 0, 0, 0), box(4.6, 0.05, 3.6, std(0xe8eae4), 0, 3.0, 0), box(0.05, 3, 3.6, std(0xe8eae4), -2.3, 1.5, 0), box(0.05, 3, 3.6, std(0xe8eae4), 2.3, 1.5, 0), box(4.6, 3, 0.05, std(0xe8eae4), 0, 1.5, -1.8));
  vr.add(box(1.8, 0.05, 1.0, std(0xc8c4b8), 0, 0.76, 0), ...[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([x, z]) => box(0.04, 0.74, 0.04, M.steelDark, x, 0.37, z)));
  [[-0.5, -0.8], [0.5, -0.8], [-0.5, 0.8], [0.5, 0.8]].forEach(([x, z]) => vr.add(group(box(0.4, 0.05, 0.4, M.steelDark, x, 0.45, z), box(0.4, 0.45, 0.04, M.steelDark, x, 0.7, z + (z > 0 ? 0.18 : -0.18)))));
  vr.add(box(0.2, 0.08, 0.15, M.red, 0.6, 0.82, 0.1), plane(0.5, 0.12, label("VERSUCHSGRUPPE 09", 512, 110, "#1a1a1a", "#e8e2cc", 44), 0, 0.92, 0.3));
  const lageScr = crt(M, 1.4, 0.8, [320, 180]); lageScr.paint((g, w, h) => termText(g, [["LAGE", "#e0b45a"], "STUFE 3", "ZEIT BIS FREIGABE: 10:00"], { size: 20, step: 34, y: 40 })); lageScr.g.position.set(0, 1.9, -1.7); vr.add(lageScr.g);
  const vrL = new THREE.PointLight(0xfff4e0, 6, 7, 2); vrL.position.set(0, 2.7, 0); vr.add(vrL); add(vr);
  // Konsole unter der Scheibe, Monitore an der Westwand, Asservate und Schleusenkarte an der Ostwand
  add(box(3.4, 0.9, 0.6, M.paintGrey, 5, 0.45, -5.15));
  const prot = group(sheet(0.24, 0.32, (g, w, h) => { g.fillStyle = "#222"; g.font = `600 12px ${MONO}`; g.fillText("BEOBACHTUNG LAUF 08", 10, 20); lines(g, w, h, 10, 10, 36); }, M, -0.1), box(0.32, 0.05, 0.4, ZONE, 0, 0.02, 0));
  prot.position.set(4.4, 0.91, -5.0); add(hs("c_protokoll", prot));
  const mon = crt(M, 0.7, 0.52, [320, 240]); let monT = 0;
  const paintMon = () => mon.paint((g, w, h) => { g.fillStyle = "#0b1a10"; g.fillRect(0, 0, w, h); g.strokeStyle = "#3f6b4a"; g.strokeRect(40, 60, 240, 150); g.fillStyle = "#8fd19e"; g.beginPath(); g.arc(70 + Math.sin(monT) * 4, 150, 8, 0, Math.PI * 2); g.fill(); g.fillRect(64 + Math.sin(monT) * 4, 158, 12, 26); termText(g, ["KAMERA C-2 · LABOR", "PERSONEN IM BILD: 1"], { size: 15, step: 22, y: 24 }); });
  paintMon(); anim((dt) => { monT += dt; if (Math.floor(monT * 2) !== Math.floor((monT - dt) * 2)) paintMon(); });
  mon.g.position.set(2.35, 1.5, -3.4); mon.g.rotation.y = Math.PI / 2; add(hs("c_monitor", mon.g));
  const kiste = group(box(0.6, 0.35, 0.4, M.paintGrey, 0, 0.175, 0), plane(0.4, 0.08, label("ASSERVAT · BRANDT", 512, 100, "#222", "#d8d0b4", 40), 0, 0.22, 0.201));
  const lid = new THREE.Group(); lid.position.set(0, 0.35, -0.2); lid.add(box(0.62, 0.04, 0.42, M.paintGrey, 0, 0.02, 0.2)); kiste.add(lid);
  const reel = cyl(0.08, 0.08, 0.02, M.black, 0.05, 0.3, 0, 18); kiste.add(reel, box(0.7, 0.5, 0.5, ZONE, 0, 0.25, 0));
  kiste.position.set(7.4, 0.9, -3.2); kiste.rotation.y = -Math.PI / 2; add(box(0.6, 0.9, 1.4, M.paintGrey, 7.5, 0.45, -3.2)); add(hs("c_asservat", kiste));
  state(() => { const t = eng().has("taken_band4"); reel.visible = !t; lid.rotation.x = t ? -1.2 : 0; });
  const card = group(box(0.5, 0.36, 0.02, M.steelDark, 0, 0, 0), plane(0.46, 0.32, new THREE.MeshLambertMaterial({ map: canvasTex(320, 220, (g, w, h) => { g.fillStyle = "#e6dfca"; g.fillRect(0, 0, w, h); g.fillStyle = "#222"; g.font = `600 18px ${MONO}`; g.fillText("DRUCKSCHLEUSE · BEDIENUNG", 12, 28); ["1 SIEGEL", "2 DRUCK", "3 SPÜLEN", "4 ÖFFNEN"].forEach((t, i) => g.fillText(t, 30, 74 + i * 34)); }) }), 0, 0, 0.012));
  card.position.set(7.92, 1.7, -2.3); card.rotation.y = -Math.PI / 2; add(hs("c_schleusenkarte", card));
  const bl = tube(M, 1.2); bl.g.position.set(5, H - 0.3, -3.4); add(bl.g);

  /* ===== Datenarchiv (Südost) hinter der Druckschleuse ===== */
  wbox(1.3, H, 0.15, 2.65, H / 2, 1.425); wbox(3.3, H, 0.15, 6.35, H / 2, 1.425); wbox(1.4, H - 2.0, 0.15, 4.0, 2.0 + (H - 2.0) / 2, 1.425); wbox(1.4, 0.4, 0.15, 4.0, 0.2, 1.425); // Nordwand mit Schleusenöffnung
  wbox(0.15, H, 4, 2, H / 2, 3.5);
  const sch = new THREE.Group(); sch.position.set(4, 0, 1.34); add(sch);
  sch.add(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 12, 40), M.steel)); sch.children[0].position.y = 1.2;
  const sDoor = group(cyl(0.66, 0.66, 0.1, M.steel, 0, 0, 0, 40), new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 24), M.steelDark), plane(0.3, 0.3, M.glass, 0, 0, 0.06));
  sDoor.children[0].rotation.x = Math.PI / 2; sDoor.children[1].position.z = 0.06; sDoor.position.set(0, 1.2, 0.04); sch.add(sDoor);
  sch.add(plane(0.9, 0.12, label("DATENARCHIV – KLIMATISIERT", 768, 100, "#e8e2cc", "#2d3a30", 40), 0, 2.15, 0.02));
  // vier Tasten (Reihenfolge auf der Tafel: SPÜLEN, ÖFFNEN, SIEGEL, DRUCK)
  const order = ["spuelen", "oeffnen", "siegel", "druck"], names = { spuelen: "SPÜLEN", oeffnen: "ÖFFNEN", siegel: "SIEGEL", druck: "DRUCK" };
  const panelG = group(box(0.5, 0.7, 0.06, M.paintGrey, 0, 0, 0)); panelG.position.set(5.15, 1.25, 1.36); add(panelG);
  const sLamp = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd0473a, toneMapped: false })); sLamp.position.set(0, 0.29, 0.04); panelG.add(sLamp);
  const btns = order.map((id, i) => { const b = group(cyl(0.05, 0.05, 0.04, std(0xc9a030, { emissive: 0x000000 }), 0, 0, 0.03, 20), plane(0.2, 0.05, label(names[id], 320, 80, "#e8e2cc", "#2d3a30", 40), 0, -0.075, 0.035), box(0.16, 0.16, 0.08, ZONE, 0, 0, 0.04)); b.children[0].rotation.x = Math.PI / 2; b.position.set(i % 2 ? 0.12 : -0.12, 0.1 - Math.floor(i / 2) * 0.24, 0); b.userData.id = id; panelG.add(b); return b; });
  let seq = [], sLock = false;
  const press = (b) => { const id = b.userData.id; if (sLock || seq.includes(id) || eng().isSolved("schleuse")) return; seq.push(id); snd("valve");
    const r = eng().tryLock("schleuse", seq.join(",")); if (!r.ok && !r.partial) { sLock = true; setTimeout(() => { seq = []; sLock = false; }, 900); } };
  anim((dt, t) => { btns.forEach((b) => { const on = seq.includes(b.userData.id) || eng().isSolved("schleuse"); b.children[0].material.emissive.setHex(on ? 0x8a6a10 : 0x000000); b.children[0].position.z = on ? 0.018 : 0.03; }); sLamp.material.color.setHex(eng().isSolved("schleuse") ? 0x8fd19e : sLock && Math.sin(t * 20) > 0 ? 0xff6050 : 0xd0473a); });
  const schSpec = { when: () => !eng().isSolved("schleuse"), cam: [5.0, 1.3, 1.95], center: [5.1, 1.25, 1.36], fov: 40, exitDelay: 2200,
    hint: "Tasten in der richtigen Reihenfolge drücken", value: () => seq.join(","), enter: () => { if (!sLock) seq = []; }, parts: () => btns.map((b) => ({ obj: b, name: "taste_" + b.userData.id, tap: () => press(b) })) };
  add(hs("c_schleuse", group(box(1.7, 1.7, 0.3, ZONE, 4, 1.2, 1.45), box(0.6, 0.8, 0.2, ZONE, 5.15, 1.25, 1.45)), { focus: schSpec }));
  let sOpen = false; state(() => { sOpen = eng().has("schleuse"); });
  anim((dt) => { sDoor.position.x = lerp(sDoor.position.x, sOpen ? -1.2 : 0, Math.min(1, dt * 1.5)); });
  // Bandschränke (Ost), Verzeichnis (West-Regal), Terminal (Süd)
  const cab = new THREE.Group();
  for (let i = 0; i < 3; i++) { const c = group(box(1.0, 2.0, 0.6, M.paintGrey, 0, 1.0, 0), box(0.9, 1.8, 0.02, M.glass, 0, 1.0, 0.31)); for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) c.add(cyl(0.12, 0.12, 0.03, M.black, -0.3 + k * 0.3, 0.4 + r * 0.42, 0.1, 16).rotateX(Math.PI / 2)); c.position.set(0, 0, -1.2 + i * 1.1); cab.add(c); }
  cab.position.set(7.55, 0, 3.6); cab.rotation.y = -Math.PI / 2; add(hs("c_baender", group(cab, box(0.7, 2.0, 3.3, ZONE, 7.55, 1.0, 3.6))));
  const shelf = group(box(0.4, 1.6, 1.4, M.paintGrey, 0, 0.8, 0)); for (let i = 0; i < 8; i++) shelf.add(box(0.28, 0.32, 0.07, std([0x3d4a5a, 0x5a3a3a, 0x4a5a3a][i % 3]), 0.02, 1.25, -0.55 + i * 0.15));
  shelf.add(box(0.3, 0.04, 0.42, std(0x6b2a22), 0.02, 0.82, 0.2)); shelf.position.set(2.3, 0, 3.6); add(hs("c_verzeichnis", group(shelf, box(0.6, 1.7, 1.5, ZONE, 2.3, 0.85, 3.6))));
  const tdesk = group(box(1.6, 0.75, 0.7, M.paintGrey, 0, 0.375, 0)); tdesk.position.set(5, 0, 5.05); add(tdesk);
  const term = crt(M, 0.6, 0.45, [400, 300]); term.g.position.set(5, 1.08, 5.05); term.g.rotation.y = Math.PI; add(term.g);
  const entries = ["21:47 UEBUNG AKTIV", "22:19 RADARKONTAKT NORD", "22:58 FREIGABE STUFE 2 · ALBERS", "23:12 AUSSENLEITUNG GESTOERT", "23:45 ABRIEGELUNG BESTAETIGT"];
  let mark = 0;
  const paintTerm = () => term.paint((g, w, h) => {
    termText(g, [["PROTOKOLLPRUEFUNG · LAUF 08", "#e0b45a"]], { size: 17, y: 28 });
    entries.forEach((t, i) => { if (mark === i + 1) { g.fillStyle = "#1f4a2a"; g.fillRect(8, 48 + i * 34, w - 16, 30); } termText(g, [[`${i + 1}  ${t}`, mark === i + 1 ? "#e8ffe8" : "#8fd19e"]], { size: 15, y: 68 + i * 34, x: 14 }); });
    termText(g, [eng().isSolved("k1") ? ["EINTRAG 3 UNGUELTIG · 22:51 ABBRUCH", "#e0b45a"] : [mark ? `MARKIERT: ${mark} · FUNKZEIT EINGEBEN` : "EINTRAG ANTIPPEN · FUNKZEIT EINGEBEN", "#e0b45a"]], { size: 14, y: 250 }); });
  paintTerm();
  // Zeilen auf dem Bildschirm als antippbare Teile (unsichtbare Leisten vor dem Glas)
  const rowParts = entries.map((t, i) => { const r = box(0.56, 0.05, 0.02, ZONE, 0, 0.45 / 2 - (48 + 15 + i * 34) / 300 * 0.45, 0.04); term.g.add(r); r.userData.i = i + 1; return r; });
  const kp = keypad(ctx, M, { pid: "k1", prefix: () => (mark ? String(mark) : ""), size: 1.3 });
  kp.g.position.set(5.0, 0.79, 4.66); kp.g.rotation.set(-1.2, Math.PI, 0, "YXZ"); add(kp.g); // liegt schräg, Tasten zum Spieler
  const k1Spec = { when: () => !eng().isSolved("k1"), cam: [5.0, 1.5, 3.95], center: [5.0, 0.98, 4.85], fov: 46, exitDelay: 3000,
    hint: "Gefälschten Eintrag antippen · Funkzeit eintippen", value: () => mark + "|" + kp.value(), enter: () => { kp.reset(); },
    parts: () => [...rowParts.map((r) => ({ obj: r, name: "zeile" + r.userData.i, tap: () => { mark = r.userData.i; snd("key"); paintTerm(); } })), ...kp.parts()] };
  add(hs(["c_terminal_ok", "c_terminal"], group(box(1.6, 1.0, 0.8, ZONE, 5, 1.0, 5.0)), { focus: k1Spec }));
  state(() => paintTerm());
  const dl = tube(M, 1.2); dl.g.position.set(5, H - 0.3, 3.4); add(dl.g);

  /* ===== Licht ===== */
  const lt = [[-5.5, -2], [-5.5, 2], [-1.5, 0]].map(([x, z]) => { const t = tube(M, 1.6); t.g.position.set(x, H - 0.3, z); add(t.g); return t; });
  anim((dt, t) => { [...lt, bl, dl].forEach((tb, i) => { const on = i === 2 ? (Math.sin(t * 9) > -0.5 ? 1 : 0.2) : 1; tb.glow.emissiveIntensity = 2 * on; tb.light.intensity = 6 * on; }); });
  add(new THREE.AmbientLight(0x3a4440, 0.6));

  /* ===== Standpunkte ===== */
  const mL = stationMark("LABOR", { signY: 2.9 }); mL.position.set(-3.5, 0, 0.2); add(hs("st_labor", mL, { aimLocal: [0, 2.9, 0] }));
  const mB = stationMark("BEOBACHTUNG", { signY: 2.9 }); mB.position.set(5, 0, -2.6); add(hs("st_beobachtung", mB, { aimLocal: [0, 2.9, 0] }));
  const mD = stationMark("DATENARCHIV", { signY: 2.9 }); mD.position.set(5, 0, 3.0); add(hs("st_datenarchiv", mD, { aimLocal: [0, 2.9, 0] }));
  const marks = { labor: mL, beobachtung: mB, datenarchiv: mD };
  animateMarks(ctx, Object.values(marks));
  anim(() => { const here = eng().state().station; Object.entries(marks).forEach(([k, m]) => { m.visible = k !== here; }); });
  const big = plane(4.2, 0.55, stencil("FORSCHUNG C", 1024, 160, "#7a8a80", 120)); big.position.set(-3.2, 4.0, -5.47); add(big);
  return { eyes: { labor: [-3.5, 1.65, 0.2], beobachtung: [5, 1.65, -2.6], datenarchiv: [5, 1.65, 3.0] }, hd: true, R: 7, H, env: 0.3 };
});
ready();
