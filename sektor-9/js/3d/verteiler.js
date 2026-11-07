/*
 * SEKTOR 9 – Verteilerhalle: Betonraum mit vier Panzertüren (A West, B Nord, C Ost, D Süd), ECHO-Terminal, Anlagenplan.
 * Die Westtür (Kommando) öffnet man am Handrad selbst (Nahansicht, gegen den Uhrzeigersinn drehen oder antippen).
 */
import { THREE, defineRoom, ready, box, cyl, plane, group, ZONE, canvasTex } from "./core.js?v=1";
import { twister } from "./interact.js?v=3";
import { mats, shellBox, blastDoor, crt, termText, cageLamp, pipe, label, stencil, MONO } from "./s9kit.js?v=1";

defineRoom("verteiler", (ctx) => {
  const { add, hs, state, anim, lerp } = ctx;
  const M = mats(), snd = ctx.sound, eng = ctx.engine;
  const W = 9, D = 9, H = 4.6, hole = { x: 0, y: 0, w: 1.9, h: 2.5 };
  shellBox(ctx, { W, D, H, M, holes: { n: [hole], e: [hole], s: [hole], w: [hole] } });
  // Säulen in den Ecken, Rohre unter der Decke
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => add(box(0.6, H, 0.6, M.wall, sx * (W / 2 - 0.3), H / 2, sz * (D / 2 - 0.3))));
  add(pipe(M, W, 0.09, 0, H - 0.3, -D / 2 + 0.5), pipe(M, W, 0.06, 0, H - 0.5, -D / 2 + 0.75), pipe(M, D, 0.08, W / 2 - 0.5, H - 0.35, 0, Math.PI / 2));

  // Vier Panzertüren; dahinter je ein kurzer dunkler Gang
  const doors = {};
  const mk = (key, pos, rotY, opts) => {
    const d = blastDoor(M, { w: 1.5, h: 2.3, ...opts }); d.g.position.set(...pos); d.g.rotation.y = rotY;
    const tun = group(box(1.9, 0.05, 4, M.ceil, 0, 2.5, -2), box(0.05, 2.5, 4, M.wall, -0.95, 1.25, -2), box(0.05, 2.5, 4, M.wall, 0.95, 1.25, -2), box(1.9, 2.5, 0.05, new THREE.MeshBasicMaterial({ color: 0x020202 }), 0, 1.25, -4));
    d.g.add(tun); doors[key] = d; return d;
  };
  mk("a", [-W / 2, 0, 0], Math.PI / 2, { text: "KOMMANDO A", plate: "PANZERTÜR WEST" });
  mk("b", [0, 0, -D / 2], 0, { text: "PERSONAL B", plate: "PANZERTÜR NORD", wheel: false, reader: true });
  mk("c", [W / 2, 0, 0], -Math.PI / 2, { text: "FORSCHUNG C", plate: "PANZERTÜR OST", wheel: false });
  mk("d", [0, 0, D / 2], Math.PI, { text: "SICHERHEIT D", plate: "PANZERTÜR SÜD", wheel: false });
  Object.values(doors).forEach((d) => add(d.g));
  // Licht im Gang hinter der Westtür (sichtbar, sobald sie offen ist)
  const aLight = new THREE.PointLight(0xffc98a, 0, 6, 2); aLight.position.set(0, 1.8, -2.2); doors.a.g.add(aLight);
  // Rotes Lämpchen über jeder Tür
  Object.values(doors).forEach((d) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd0473a, toneMapped: false })); l.position.set(0, 2.75, 0.25); d.g.add(l); d.top = l; });

  // Handrad an der Westtür: selbst drehen
  const wh = doors.a.wheel; let turn = 0, fired = false; const tw = twister(ctx, () => wh);
  const NEED = Math.PI * 3;
  const done = () => { if (!fired && turn >= NEED) { fired = true; snd("lever"); setTimeout(() => eng().hotspot("v_tuer_a"), 400); } };
  const wheelSpec = { when: (id) => id === "v_tuer_a" && !eng().isSolved("handrad"), cam: [0, 1.3, 1.55], center: [0, 1.15, 0.25], fov: 46, exitDelay: 1600,
    hint: "Handrad gegen den Uhrzeigersinn drehen (oder antippen)", value: () => (turn / NEED).toFixed(2), enter: () => { if (!fired) turn = 0; },
    parts: () => [{ obj: wh, name: "handrad", tap: () => { turn = Math.min(NEED, turn + Math.PI); snd("creak"); done(); }, drag: (dx, dy, pt) => { turn = Math.max(0, Math.min(NEED, turn - tw.delta(pt))); if (Math.random() < 0.08) snd("creak"); done(); }, release: () => tw.reset() }] };
  hs(["v_tuer_a_offen", "v_tuer_a"], doors.a.g, { focus: wheelSpec, aimLocal: [0, 1.2, 0.3] });
  hs(["v_tuer_b_offen", "v_tuer_b"], doors.b.g, { aimLocal: [0, 1.2, 0.3] });
  hs(["v_tuer_c_offen", "v_tuer_c"], doors.c.g, { aimLocal: [0, 1.2, 0.3] });
  hs(["v_tuer_d_offen", "v_tuer_d"], doors.d.g, { aimLocal: [0, 1.2, 0.3] });
  let aOpen = false, bOpen = false, cOpen = false, dOpen = false;
  state(() => { aOpen = eng().isSolved("handrad"); bOpen = eng().has("tuer_b"); cOpen = eng().has("tuer_c"); dOpen = eng().has("tuer_d"); doors.c.top.material.color.setHex(cOpen ? 0x8fd19e : 0xd0473a); doors.d.top.material.color.setHex(dOpen ? 0x8fd19e : 0xd0473a); doors.a.top.material.color.setHex(aOpen ? 0x8fd19e : 0xd0473a); doors.b.top.material.color.setHex(bOpen ? 0x8fd19e : 0xd0473a); if (doors.b.led) doors.b.led.material.color.setHex(bOpen ? 0x8fd19e : 0xd0473a); aLight.intensity = aOpen ? 3 : 0; });
  anim((dt) => {
    wh.rotation.z = fired || aOpen ? wh.rotation.z + (aOpen ? 0 : dt * 2) : turn; // gegen den Uhrzeigersinn = positive Drehung um +z
    doors.a.pivot.rotation.y = lerp(doors.a.pivot.rotation.y, aOpen ? -1.45 : 0, Math.min(1, dt * 1.2));
    doors.b.pivot.rotation.y = lerp(doors.b.pivot.rotation.y, bOpen ? -1.45 : 0, Math.min(1, dt * 1.2));
    doors.c.pivot.rotation.y = lerp(doors.c.pivot.rotation.y, cOpen ? -1.45 : 0, Math.min(1, dt * 1.2));
    doors.d.pivot.rotation.y = lerp(doors.d.pivot.rotation.y, dOpen ? -0.35 : 0, Math.min(1, dt * 0.6)); // Süd: nur einen Spalt
  });

  // ECHO-Terminal in der Mitte (Blick nach Norden)
  const desk = group(box(1.3, 0.9, 0.7, M.paint, 0, 0.45, 0), box(1.36, 0.04, 0.76, M.steelDark, 0, 0.92, 0));
  const t = crt(M, 0.52, 0.4); t.g.position.set(0, 1.2, -0.05); t.g.rotation.x = -0.08; desk.add(t.g);
  desk.add(box(0.6, 0.03, 0.22, M.black, 0, 0.95, 0.18)); // Tastatur
  desk.position.set(-2.1, 0, -1.9); desk.rotation.y = 0.55; add(hs("v_terminal", desk)); // seitlich, damit die Nordtür frei bleibt
  let blink = 0;
  const paintTerm = () => t.paint((g, w, h) => { termText(g, ["ANLAGE KESSELBERG", "", "VERSUCHSGRUPPE ERKANNT.", "STATUS: 1 AKTIVE SITZUNG.", "", "WARTUNGSASSISTENZ BEREIT." + (blink % 2 ? " _" : "")], { size: 17, step: 30, y: 36 }); });
  paintTerm(); anim((dt) => { blink += dt * 2; if (Math.floor(blink) !== Math.floor(blink - dt * 2)) paintTerm(); });
  const termL = new THREE.PointLight(0x8fd19e, 1.4, 4, 2); termL.position.set(-1.6, 1.3, -1.3); add(termL);

  // Anlagenplan an der Westwand (rechts neben der Tür A)
  const planTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = "#d6cfb6"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a2a2a"; g.lineWidth = 3; g.font = `500 18px ${MONO}`; g.fillStyle = "#2a2a2a";
    g.fillText("ANLAGE KESSELBERG · ÜBERSICHT", 20, 30);
    const r = (x, y, ww, hh, t) => { g.strokeRect(x, y, ww, hh); g.fillText(t, x + 8, y + 24); };
    r(196, 54, 120, 56, "B"); r(40, 160, 120, 56, "A"); r(352, 160, 120, 56, "C"); r(196, 266, 120, 56, "D"); r(214, 160, 84, 56, "V");
    g.beginPath(); g.moveTo(256, 110); g.lineTo(256, 160); g.moveTo(160, 188); g.lineTo(214, 188); g.moveTo(298, 188); g.lineTo(352, 188); g.moveTo(256, 216); g.lineTo(256, 266); g.stroke();
    g.setLineDash([6, 6]); g.beginPath(); g.moveTo(256, 322); g.lineTo(256, 360); g.stroke(); g.setLineDash([]);
    g.fillText("Rechenkern", 270, 356); g.fillStyle = "#555"; g.font = "italic 34px serif"; g.fillText("9", 380, 360); g.fillRect(376, 366, 30, 2); g.fillRect(376, 371, 30, 2);
  });
  const plan = group(box(1.3, 1.0, 0.04, M.steelDark, 0, 0, 0), plane(1.2, 0.9, new THREE.MeshLambertMaterial({ map: planTex }), 0, 0, 0.022));
  plan.position.set(-W / 2 + 0.06, 1.6, -2.4); plan.rotation.y = Math.PI / 2; add(hs("v_plan", plan));

  // Licht: Notbeleuchtung (warm, schwach), eine Käfiglampe in der Mitte
  const lamp = cageLamp(M, 0xffb060, 4.5, 9); lamp.g.position.set(0, H - 0.25, 0.6); lamp.light.userData.shadow = true; add(lamp.g);
  add(new THREE.AmbientLight(0x30363a, 0.6));
  let fl = 1; anim((dt) => { if (Math.random() < 0.015) fl = 0.4 + Math.random() * 0.3; fl = lerp(fl, 1, dt * 3); lamp.light.intensity = 4.5 * fl; lamp.bulb.material.emissiveIntensity = 2 * fl; });
  // Schriftzug am Boden vor Tür D
  const warn = plane(2.2, 0.35, stencil("SEKTOR 9 · KEIN ZUTRITT", 1024, 160, "#b8452f", 80)); warn.rotation.x = -Math.PI / 2; warn.position.set(0, 0.012, D / 2 - 1.3); warn.rotation.z = Math.PI; add(warn);
  return { eyes: { mitte: [0, 1.65, 0.6] }, hd: true, R: 4.5, H, env: 0.18 };
});
ready();
