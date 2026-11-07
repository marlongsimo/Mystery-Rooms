/*
 * SEKTOR 9 – Personal-Halle (Sektor B): eine lange Mannschaftshalle, drei Standpunkte.
 *   Unterkünfte (West): Spindreihe an der Westwand (2 Brandt, 7 Nowak mit Zahlenschloss), Feldbetten, Wartungsklappe, Dienstplan, Ausgang.
 *   Personalarchiv (Mitte): Gitterkäfig mit Regalen, Karteischrank, Aktentisch; Vorhängeschloss (Schlüssel drehen).
 *   Offiziersbüro (Ost): Glaswände, Tür mit Tastenfeld; Schreibtisch (Brief, Schublade mit Band 3, Tasse), Schlüsselbrett, Foto.
 * Koordinaten: x −9…9 (West…Ost), z −5…5 (Nord…Süd), Höhe 4,2 m. Eingang Südwand bei x = −3.
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { combinationLock, keyTurn, keyMesh } from "./interact.js?v=3";
import { mats, shellBox, cageLamp, tube, pipe, label, stencil, stationMark, animateMarks, sheet, lines, keypad, locker, MONO, std } from "./s9kit.js?v=1";

defineRoom("personal", (ctx) => {
  const { add, hs, state, anim, lerp, scene } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const W = 18, D = 10, H = 4.2;
  const hemi = scene.children.find((c) => c.isHemisphereLight); if (hemi) hemi.intensity = 0.38;
  shellBox(ctx, { W, D, H, M, holes: { s: [{ x: 3, y: 0, w: 1.9, h: 2.5 }], n: [{ x: -2.4, y: 0.15, w: 0.8, h: 0.8 }] } });
  add(pipe(M, W, 0.08, 0, H - 0.25, -4.6), pipe(M, W, 0.05, 0, H - 0.4, -4.75));
  for (let i = 0; i < 6; i++) add(box(0.3, 0.3, D, M.ceil, -7.5 + i * 3, H - 0.15, 0)); // Unterzüge

  /* ===== Unterkünfte ===== */
  // Spinde an der Westwand
  const names = ["HESSE, W.", "BRANDT, I.", "KRAMER, J.", "LENZ, M.", "WOLFF, T.", "BEHRENDT, K.", "NOWAK, P.", "SOMMER, A."];
  const lk = names.map((n, i) => { const l = locker(M, { name: n, nr: i + 1 }); l.g.position.set(-8.72, 0, -3.15 + i * 0.9); l.g.rotation.y = Math.PI / 2; add(l.g); return l; });
  [0, 2, 3, 4, 5, 7].forEach((i) => { lk[i].pivot.rotation.y = -0.12 - (i % 3) * 0.08; }); // leer geräumt, einen Spalt offen
  add(hs("b_spinde", group(box(0.2, 1.9, 6.6, ZONE, -8.8, 0.95, 0.0)), {})); // hinter den Einzel-Spinden, damit Spind 2 und 7 Vorrang haben
  const brandt = lk[1], nowak = lk[6];
  // Brandts Spind: innen Band und Tagebuchseite
  brandt.g.add(cyl(0.09, 0.09, 0.025, M.black, 0, 1.05, 0.05, 20).rotateX(Math.PI / 2));
  add(hs(["b_spind_brandt_offen", "b_spind_brandt"], group(brandt.g, box(0.8, 1.9, 0.3, ZONE, 0, 0.95, 0.3)), {}));
  // Gruppe neu positionieren (group() hat den Spind umgehängt)
  const bG = brandt.g.parent; bG.position.copy(brandt.g.position); bG.rotation.y = brandt.g.rotation.y; brandt.g.position.set(0, 0, 0); brandt.g.rotation.y = 0;
  let bOpen = false; state(() => { bOpen = eng().has("taken_band2"); });
  anim((dt) => { brandt.pivot.rotation.y = lerp(brandt.pivot.rotation.y, bOpen ? -1.7 : 0, Math.min(1, dt * 3)); });
  // Nowaks Spind: Zahlenschloss 4 Ziffern (Geburtstag TTMM)
  const nLock = combinationLock(ctx, { pid: "spind_nowak", count: 4, brass: M.steel, dark: M.black, handle: "buegel" });
  nLock.group.scale.setScalar(0.32); nLock.group.position.set(0.12, 0.95, 0.03); nowak.door.add(nLock.group);
  const nG = group(); nG.position.copy(nowak.g.position); nG.rotation.y = nowak.g.rotation.y; nowak.g.position.set(0, 0, 0); nowak.g.rotation.y = 0; nG.add(nowak.g, box(0.8, 1.9, 0.3, ZONE, 0, 0.95, 0.3)); add(nG);
  const nowakSpec = { when: () => !eng().isSolved("spind_nowak"), cam: [0.12, 1.0, 0.85], center: [0.12, 0.95, 0.25], fov: 40, exitDelay: 1600,
    hint: "Räder oben/unten antippen oder wischen · Bügel ziehen", value: nLock.value, parts: nLock.parts };
  hs(["b_spind_nowak_offen", "b_spind_nowak"], nG, { focus: nowakSpec });
  let nOpen = false; state(() => { nOpen = eng().isSolved("spind_nowak"); nLock.group.visible = !nOpen; });
  anim((dt) => { nowak.pivot.rotation.y = lerp(nowak.pivot.rotation.y, nOpen ? -1.7 : 0, Math.min(1, dt * 3)); });

  // Feldbetten (Doppelstock) an der Nordwand
  const beds = new THREE.Group();
  const blanket = std(0x4a5a3c, { roughness: 0.95 }), sheetM = std(0xd8d4c4, { roughness: 0.95 });
  for (let i = 0; i < 5; i++) {
    const bx = -8.0 + i * 0.95, b = new THREE.Group(); b.position.set(bx, 0, -4.0); // Kopfende an der Nordwand
    [[-0.42, -0.45], [0.42, -0.45], [-0.42, 0.45], [0.42, 0.45]].forEach(([x, z]) => b.add(cyl(0.025, 0.025, 1.7, M.steelDark, z, 0.85, x, 8)));
    [0.4, 1.35].forEach((y) => { b.add(box(0.85, 0.06, 1.9, M.steelDark, 0, y, 0)); b.add(box(0.8, 0.14, 1.85, sheetM, 0, y + 0.1, 0)); b.add(box(0.82, 0.05, 1.3, blanket, 0, y + 0.19, 0.25)); b.add(box(0.5, 0.1, 0.3, sheetM, 0, y + 0.22, -0.75)); });
    beds.add(b);
  }
  const paper = sheet(0.4, 0.3, (g, w, h) => { g.fillStyle = "#222"; g.font = `600 22px serif`; g.fillText("16. FEBRUAR 1987", 14, 34); lines(g, w, h, 8, 14, 50); }, M, 0.3); paper.position.set(-6.1, 0.66, -4.2); beds.add(paper);
  add(hs("b_betten", group(beds, box(4.7, 1.9, 1.9, ZONE, -6.1, 0.95, -4.0)), {})); // endet vor der Wartungsklappe
  // Wartungsklappe in der Nordwand (Vierkant)
  const hatchF = new THREE.Group(); hatchF.position.set(-2.4, 0.15, -4.98);
  hatchF.add(box(0.92, 0.08, 0.08, M.steelDark, 0, 0.84, 0), box(0.92, 0.08, 0.08, M.steelDark, 0, -0.04, 0), box(0.08, 0.92, 0.08, M.steelDark, -0.44, 0.4, 0), box(0.08, 0.92, 0.08, M.steelDark, 0.44, 0.4, 0));
  const hPivot = new THREE.Group(); hPivot.position.set(-0.4, 0, 0.03); hatchF.add(hPivot);
  const hLeaf = group(box(0.8, 0.8, 0.04, M.steel, 0.4, 0.4, 0), plane(0.5, 0.08, stencil("WARTUNG A", 1024, 160, "#d8d0b4", 110), 0.4, 0.68, 0.022)); hPivot.add(hLeaf);
  const dorn = box(0.04, 0.04, 0.05, M.steelDark, 0.68, 0.4, 0.04); hLeaf.add(dorn);
  const vkey = group(box(0.03, 0.03, 0.08, M.steel, 0, 0, 0.04), box(0.14, 0.025, 0.025, M.steel, 0, 0, 0.09)); vkey.position.set(0.68, 0.4, 0.06); hLeaf.add(vkey);
  const tunB = group(box(0.8, 0.05, 3, M.ceil, 0, 0.8, -1.5), box(0.05, 0.8, 3, M.wall, -0.4, 0.4, -1.5), box(0.05, 0.8, 3, M.wall, 0.4, 0.4, -1.5), box(0.8, 0.05, 3, M.floor, 0, 0, -1.5), box(0.8, 0.8, 0.05, new THREE.MeshBasicMaterial({ color: 0x020202 }), 0, 0.4, -3));
  hatchF.add(tunB);
  const tunL = new THREE.PointLight(0xffc98a, 0, 3, 2); tunL.position.set(0, 0.4, -1.2); hatchF.add(tunL);
  const vSpec = keyTurn(ctx, { key: vkey, item: "vierkant", hotspot: "b_klappe", when: () => !eng().has("tunnel_ab"), cam: [0.4, 0.55, 0.75], center: [0.5, 0.4, 0], fov: 44, hint: "Vierkant im Uhrzeigersinn drehen (oder antippen)" });
  add(hs(["b_tunnel", "b_klappe"], group(hatchF, box(1.0, 1.0, 0.3, ZONE, -2.4, 0.55, -4.85)), { focus: { ...vSpec, cam: [-2.25, 0.95, -3.85], center: [-2.3, 0.55, -4.95] } }));
  const hl = cageLamp(M, 0xffc890, 1.8, 3.5); hl.g.position.set(-2.4, 1.55, -4.75); add(hl.g); // Lampe über der Wartungsklappe
  let tOpen = false; state(() => { tOpen = eng().has("tunnel_ab"); tunL.intensity = tOpen ? 1.4 : 0; });
  anim((dt) => { hPivot.rotation.y = lerp(hPivot.rotation.y, tOpen ? -1.6 : 0, Math.min(1, dt * 2)); });
  // Dienstplan an der Südwand
  const dp = canvasTex(512, 384, (g, w, h) => { g.fillStyle = "#e4dcc4"; g.fillRect(0, 0, w, h); g.fillStyle = "#222"; g.font = `600 20px ${MONO}`; g.fillText("DIENSTPLAN · 17.02.1987", 18, 32);
    g.font = `500 15px ${MONO}`; ["ALBERS, K.  KDT   SPÄT  22:40-23:10 LZ", "BRANDT, I.        SPÄT  FUNK", "NOWAK, P.         NACHT TECHNIK D", "OSTROWSKI, H.     –     ECHO", "HESSE/KRAMER/LENZ SPÄT  LEITSTAND"].forEach((t, i) => g.fillText(t, 18, 72 + i * 34));
    g.fillText("FRÜH 05:30 · SPÄT 17:30 · NACHT 18:00", 18, 260); g.strokeStyle = "#222"; g.strokeRect(10, 46, w - 20, 180); });
  const dplan = group(box(1.2, 0.95, 0.04, M.steelDark, 0, 0, 0), plane(1.12, 0.86, new THREE.MeshLambertMaterial({ map: dp }), 0, 0, 0.022));
  dplan.position.set(-6.2, 1.6, 4.96); dplan.rotation.y = Math.PI; add(hs("b_dienstplan", dplan));
  // Ausgang zur Verteilerhalle (Südwand, x = −3)
  const exitD = group(box(1.9, 2.5, 0.1, new THREE.MeshBasicMaterial({ color: 0x070807 }), 0, 1.25, 0), plane(1.4, 0.24, stencil("VERTEILER", 1024, 160, "#d8d0b4", 110), 0, 2.75, 0.06), box(1.9, 2.5, 0.4, ZONE, 0, 1.25, 0));
  exitD.position.set(-3, 0, 4.93); exitD.rotation.y = Math.PI; add(hs("b_ausgang", exitD));

  /* ===== Personalarchiv: Gitterkäfig ===== */
  const meshTex = canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.strokeStyle = "#8a8f88"; g.lineWidth = 5; for (let i = -128; i < 256; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); } }, { repeat: [6, 3] });
  const meshMat = new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, alphaTest: 0.4, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
  const cx0 = -1.5, cx1 = 3.4, cz1 = 0.5;
  const front = plane(cx1 - cx0, 2.6, meshMat); front.position.set((cx0 + cx1) / 2, 1.3, cz1); add(front);
  const sideW = plane(5.5, 2.6, meshMat); sideW.position.set(cx0, 1.3, -2.25); sideW.rotation.y = Math.PI / 2; add(sideW);
  const sideE = plane(5.5, 2.6, meshMat); sideE.position.set(cx1, 1.3, -2.25); sideE.rotation.y = Math.PI / 2; add(sideE);
  [cx0, cx1].forEach((x) => [cz1, -5].forEach((z) => add(box(0.08, 2.7, 0.08, M.steelDark, x, 1.35, z))));
  add(box(cx1 - cx0, 0.08, 0.08, M.steelDark, (cx0 + cx1) / 2, 2.62, cz1));
  // Käfigtür mit Vorhängeschloss
  const cdoor = new THREE.Group(); cdoor.position.set(1.6, 0, cz1 + 0.02); // rechts in der Gitterwand: die Sichtlinie Unterkünfte → Büro bleibt frei
  const cPivot = new THREE.Group(); cdoor.add(cPivot);
  cPivot.add(plane(1.1, 2.3, meshMat, 0.55, 1.15, 0.01), box(1.1, 0.05, 0.05, M.steelDark, 0.55, 2.3, 0.02), box(0.05, 2.3, 0.05, M.steelDark, 1.08, 1.15, 0.02));
  const padlock = group(box(0.11, 0.09, 0.05, M.steel, 0, 0, 0), new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 16, Math.PI), M.steel));
  padlock.children[1].position.y = 0.045; padlock.position.set(1.05, 1.1, 0.07); cPivot.add(padlock);
  cPivot.add(plane(0.34, 0.08, label("ARCHIV – NUR KDT.", 512, 112, "#e8e2cc", "#6b2a22", 42), 0.55, 1.75, 0.04));
  const aKey = keyMesh(M.steel, 0.9); aKey.position.set(0, -0.015, 0.03); padlock.add(aKey);
  const cSpec = keyTurn(ctx, { key: aKey, item: "archivschluessel", hotspot: "b_kaefigtuer", when: () => !eng().has("kaefig"), cam: [0.4, 1.2, 1.3], center: [0.45, 1.1, 0.07], fov: 40 });
  add(hs("b_kaefigtuer", group(cdoor, box(1.2, 2.3, 0.3, ZONE, 2.15, 1.15, cz1 + 0.05)), { focus: { ...cSpec, cam: [2.65, 1.25, cz1 + 0.75], center: [2.65, 1.1, cz1 + 0.09] } }));
  let cOpen = false; state(() => { cOpen = eng().has("kaefig"); });
  anim((dt) => { cPivot.rotation.y = lerp(cPivot.rotation.y, cOpen ? 1.5 : 0, Math.min(1, dt * 2)); padlock.visible = !cOpen; });
  // Inhalt: Regale an der Nordwand, Karteischrank, Aktentisch
  const fileCols = [0x6b4a2a, 0x3d4a5a, 0x5a3a3a, 0x4a5a3a, 0x7a6a4a].map((c) => std(c, { roughness: 0.8 }));
  const shelf = new THREE.Group();
  [0.05, 0.75, 1.45, 2.15].forEach((y) => shelf.add(box(3.6, 0.04, 0.45, M.steelDark, 0, y, 0)));
  [-1.8, 1.8].forEach((x) => shelf.add(box(0.05, 2.3, 0.45, M.steelDark, x, 1.15, 0)));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 30; i++) shelf.add(box(0.08, 0.3 + ((i * 7 + r) % 4) * 0.03, 0.32, fileCols[(i + r) % 5], -1.7 + i * 0.115, 0.22 + r * 0.7, 0));
  shelf.position.set(0.95, 0, -4.7); add(hs("a_regal", group(shelf, box(3.7, 2.3, 0.6, ZONE, 0.95, 1.15, -4.65)), {}));
  const kartei = group(box(0.9, 1.3, 0.6, M.paintGrey, 0, 0.65, 0));
  for (let i = 0; i < 4; i++) kartei.add(box(0.8, 0.26, 0.02, M.paint, 0, 0.2 + i * 0.3, 0.31), box(0.16, 0.05, 0.03, M.steel, 0, 0.26 + i * 0.3, 0.33), plane(0.18, 0.06, label("A–K L–R S–Z ECHO".split(" ")[i] || "", 256, 80, "#222", "#e4dcc4", 32), 0, 0.17 + i * 0.3, 0.325));
  kartei.position.set(-0.9, 0, -3.4); kartei.rotation.y = Math.PI / 2; add(hs("a_kartei", kartei));
  const atable = group(box(1.6, 0.05, 0.8, M.wood, 0, 0.76, 0), ...[[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].map(([x, z]) => box(0.05, 0.74, 0.05, M.steelDark, x, 0.37, z)));
  atable.position.set(2.5, 0, -2.0); add(atable);
  const rl = group(sheet(0.3, 0.42, (g, w, h) => { g.fillStyle = "#222"; g.font = `500 13px ${MONO}`; g.fillText("RÄUMUNG 17.02.87", 12, 22); lines(g, w, h, 10, 12, 40); }, M, -0.15), box(0.4, 0.05, 0.5, ZONE, 0, 0.02, 0));
  rl.position.set(2.2, 0.79, -2.0); add(hs("a_raeumung", rl));
  const akte = group(box(0.26, 0.02, 0.34, std(0xd8cc9a, { roughness: 0.9 }), 0, 0.01, 0), box(0.09, 0.06, 0.003, std(0xe0b45a), 0.05, 0.02, 0.17), box(0.36, 0.06, 0.44, ZONE, 0, 0.02, 0));
  akte.position.set(2.85, 0.79, -1.9); akte.rotation.y = 0.3; add(hs("b_ausweis", akte, { hideWhenHidden: false }));
  const ausweisCard = akte.children[1]; state(() => { ausweisCard.visible = !eng().has("taken_ausweis_ostrowski"); });
  const cageBulb = cageLamp(M, 0xffd8a0, 2.2, 6); cageBulb.g.position.set(1.0, H - 0.3, -2.2); add(cageBulb.g);

  /* ===== Offiziersbüro: Glaswände, Tür mit Tastenfeld ===== */
  const ox0 = 4.6, oz1 = 0.5;
  const gWest = plane(5.5, 2.6, M.glass); gWest.position.set(ox0, 1.3, -2.25); gWest.rotation.y = -Math.PI / 2; add(gWest);
  const gSouthA = plane(0.5, 2.6, M.glass); gSouthA.position.set(ox0 + 0.25, 1.3, oz1); add(gSouthA);
  const gSouthB = plane(2.9, 2.6, M.glass); gSouthB.position.set(7.55, 1.3, oz1); add(gSouthB);
  add(box(4.4, 0.4, 0.1, M.paintGrey, 6.8, 2.8, oz1), box(0.1, 3.0, 0.1, M.steelDark, ox0, 1.5, oz1), box(0.1, 3.0, 0.1, M.steelDark, 6.1, 1.5, oz1), box(0.1, 3.0, 0.1, M.steelDark, 5.1, 1.5, oz1));
  for (let i = 0; i < 4; i++) add(box(0.06, 2.6, 0.06, M.steelDark, ox0, 1.3, -0.9 - i * 1.25));
  const odoor = new THREE.Group(); odoor.position.set(5.1, 0, oz1 + 0.01);
  const oPivot = new THREE.Group(); odoor.add(oPivot);
  oPivot.add(plane(1.0, 2.4, M.glass, 0.5, 1.2, 0), box(1.0, 0.06, 0.04, M.steelDark, 0.5, 2.4, 0), box(0.04, 2.4, 0.04, M.steelDark, 0.98, 1.2, 0), box(0.04, 0.3, 0.06, M.steel, 0.9, 1.05, 0.04), plane(0.4, 0.07, label("KOMMANDANT", 512, 90, "#e8e2cc", "#2d3a30", 44), 0.5, 1.7, 0.01));
  add(odoor);
  const okp = keypad(ctx, M, { pid: "buero" }); okp.g.position.set(6.3, 1.35, oz1 + 0.03); add(okp.g);
  const oSpec = { when: (id) => id === "b_buerotuer" && !eng().isSolved("buero"), cam: [6.3, 1.38, oz1 + 0.6], center: [6.3, 1.35, oz1 + 0.06], fov: 38, exitDelay: 1800,
    hint: "Vier Ziffern eintippen · * löscht", value: okp.value, enter: okp.reset, parts: okp.parts };
  add(hs("b_buerotuer", group(box(1.0, 2.4, 0.3, ZONE, 5.6, 1.2, oz1 + 0.1), box(0.3, 0.4, 0.2, ZONE, 6.3, 1.35, oz1 + 0.1)), { focus: oSpec }));
  let oOpen = false; state(() => { oOpen = eng().isSolved("buero"); });
  anim((dt) => { oPivot.rotation.y = lerp(oPivot.rotation.y, oOpen ? -1.4 : 0, Math.min(1, dt * 2)); });
  // Schreibtisch mit Brief, Schublade, Tasse, Lampe
  const desk = group(box(1.8, 0.06, 0.9, M.wood, 0, 0.76, 0), box(0.5, 0.72, 0.85, M.wood, 0.62, 0.37, 0), box(0.05, 0.72, 0.85, M.wood, -0.86, 0.37, 0));
  desk.position.set(6.8, 0, -3.8); add(desk);
  const chair = group(box(0.5, 0.06, 0.5, std(0x3a2a20), 0, 0.48, 0), box(0.5, 0.6, 0.06, std(0x3a2a20), 0, 0.8, -0.22), cyl(0.03, 0.03, 0.45, M.steelDark, 0, 0.24, 0)); chair.position.set(6.6, 0, -4.4); add(chair);
  const letter = group(sheet(0.24, 0.32, (g, w, h) => { g.fillStyle = "#223"; g.font = "italic 18px serif"; g.fillText("Liebe Anna,", 12, 26); lines(g, w, h, 9, 12, 46); }, M, 0.1), box(0.32, 0.04, 0.4, ZONE, 0, 0.02, 0));
  letter.position.set(6.5, 0.795, -3.65); add(hs("o_brief", letter));
  const drw = group(box(0.44, 0.16, 0.03, M.wood, 0, 0, 0), box(0.14, 0.025, 0.025, M.steel, 0, 0, 0.025)); drw.position.set(7.42, 0.62, -3.34); add(hs("o_schublade", drw));
  let dOpen = false; state(() => { dOpen = eng().has("taken_band3"); }); anim((dt) => { drw.position.z = lerp(drw.position.z, dOpen ? -3.0 : -3.34, Math.min(1, dt * 3)); });
  const cup = group(cyl(0.04, 0.035, 0.09, std(0xe8e2d2, { roughness: 0.4 }), 0, 0.045, 0, 16), new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12), std(0xe8e2d2)), box(0.14, 0.14, 0.14, ZONE, 0, 0.05, 0));
  cup.children[1].position.set(0.045, 0.05, 0); cup.children[1].rotation.y = Math.PI / 2; cup.position.set(7.1, 0.79, -3.9); add(hs("o_tasse", cup));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1e5a3a, emissive: 0x1e5a3a, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
  const dlamp = group(cyl(0.07, 0.08, 0.02, M.steel, 0, 0.01, 0), cyl(0.008, 0.008, 0.36, M.steel, 0, 0.19, 0), shade); shade.position.y = 0.38; dlamp.position.set(6.0, 0.79, -4.0); add(dlamp);
  const deskL = new THREE.PointLight(0xffd8a0, 2.4, 5, 2); deskL.position.set(6.0, 1.05, -3.8); deskL.userData.shadow = true; add(deskL);
  // Schlüsselbrett und Foto an der Ostwand
  const kb = group(box(0.6, 0.4, 0.03, M.wood, 0, 0, 0));
  for (let i = 0; i < 12; i++) kb.add(cyl(0.006, 0.006, 0.04, M.steel, -0.24 + (i % 6) * 0.096, 0.08 - Math.floor(i / 6) * 0.16, 0.03, 6).rotateX(Math.PI / 2));
  const hangKey = keyMesh(M.steel, 1.3); hangKey.rotation.x = Math.PI / 2; hangKey.position.set(0.24, -0.16, 0.04); kb.add(hangKey);
  kb.add(box(0.7, 0.5, 0.15, ZONE, 0, 0, 0.05)); kb.position.set(8.95, 1.5, -2.0); kb.rotation.y = -Math.PI / 2; add(hs("o_schluessel", kb));
  state(() => { hangKey.visible = !eng().has("taken_archivschluessel"); });
  const photoTex = canvasTex(512, 340, (g, w, h) => { g.fillStyle = "#b8b0a0"; g.fillRect(0, 0, w, h); g.fillStyle = "#4a4a48"; g.fillRect(150, 30, 220, 280); g.fillStyle = "#2a2a2a"; g.font = `600 16px ${MONO}`; g.fillText("RECHENKERN 9", 200, 80);
    for (let i = 0; i < 9; i++) { const x = 40 + i * 52; g.fillStyle = i === 4 ? "#3a3a3a" : "#2e3a30"; g.beginPath(); g.arc(x, 170, 16, 0, Math.PI * 2); g.fill(); g.fillRect(x - 18, 186, 36, 110); }
    g.globalAlpha = 0.3; g.fillStyle = "#f0e8d0"; g.fillRect(0, 0, w, h); g.globalAlpha = 1; g.fillStyle = "#222"; g.font = "italic 16px serif"; g.fillText("Einweihung Kesselberg · 12.09.1984", 20, 330); });
  const photo = group(box(0.62, 0.46, 0.03, M.wood, 0, 0, 0), plane(0.56, 0.38, new THREE.MeshLambertMaterial({ map: photoTex }), 0, 0, 0.017));
  photo.position.set(8.95, 1.7, -3.6); photo.rotation.y = -Math.PI / 2; add(hs("o_foto", photo));

  /* ===== Licht ===== */
  const tubes = [-6.5, -3, 0.9, 6.8].map((x) => { const t = tube(M, 1.4); t.g.position.set(x, H - 0.32, x > 4 ? -2.2 : 1.6); add(t.g); return t; });
  anim((dt, t) => tubes.forEach((tb, i) => { const on = i === 1 ? (Math.sin(t * 13) > -0.2 || Math.random() < 0.5 ? 1 : 0.1) : 1; tb.glow.emissiveIntensity = 1.8 * on; tb.light.intensity = (i === 3 ? 3 : 5) * on; }));
  add(new THREE.AmbientLight(0x30343a, 0.5));
  const exitL = new THREE.PointLight(0xffc98a, 1.2, 4, 2); exitL.position.set(-3, 2.2, 4.3); add(exitL);

  /* ===== Standpunkte ===== */
  // Schilder über Käfig und Glaswänden, damit sie von jedem Standpunkt aus frei anklickbar sind
  const mU = stationMark("UNTERKÜNFTE", { signY: 2.9 }); mU.position.set(-5, 0, 2.2); add(hs("st_unterkuenfte", mU, { aimLocal: [0, 2.9, 0] }));
  const mA = stationMark("PERSONALARCHIV", { signY: 2.9 }); mA.position.set(1.0, 0, -1.4); add(hs("st_archiv", mA, { aimLocal: [0, 2.9, 0] }));
  const mB = stationMark("OFFIZIERSBÜRO", { signY: 2.9 }); mB.position.set(6.8, 0, -1.6); add(hs("st_buero", mB, { aimLocal: [0, 2.9, 0] }));
  const marks = { unterkuenfte: mU, archiv: mA, buero: mB };
  animateMarks(ctx, Object.values(marks));
  anim(() => { const here = eng().state().station; Object.entries(marks).forEach(([k, m]) => { m.visible = k !== here; }); });
  const big = plane(4.0, 0.55, stencil("PERSONAL B", 1024, 160, "#cfc7aa", 120)); big.position.set(-5.5, 3.3, -4.97); add(big);
  return { eyes: { unterkuenfte: [-5, 1.65, 2.2], archiv: [1.0, 1.65, -1.4], buero: [6.8, 1.65, -1.6] }, hd: true, R: 7, H, env: 0.16 };
});
ready();
