/*
 * STATION 1 – DIE REZEPTION in 3D
 * Aufbau nach den vier 2D-Ansichten (js/rooms/01-rezeption.js): Nord Empfang · Ost Aufzug · Süd Eingang · West Sitzecke.
 * Raum 6,4 × 6,4 m, 3,4 m hoch, Kamera in der Mitte auf Augenhöhe.
 * Bildhinweise, die in 3D erkennbar bleiben müssen: Uhr steht auf 23:17 · Anzeige am Aufzug mit rot eingekreister 2 ·
 * nur das Porträt hängt gerade · lose Seite im Gästeregister · stockdunkle Ecke unter der Treppe (Taschenlampe).
 */
// Version im Import = Cache-Steuerung; core.js darf nur einmal (mit derselben URL) geladen werden
import { THREE, defineRoom, ready, canvasTex, lambert, phong, basic, ZONE, box, cyl, plane, group, wallMesh, walls } from "./core.js?v=3";
import { woodMat, brassMat, velvetMat, leatherMat, damask, marble, persian, rbox, panel, turnedLeg, ornateFrame, std, tableLamp } from "./hd.js?v=2";
import { tag } from "./gfx.js?v=1";

const R = 3.2, H = 3.4;

/* ---------- Texturen ---------- */
const wallpaper = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#16241f"; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = "#1c2e28"; g.fillRect(x, 0, 14, h); g.fillStyle = "#24382f"; g.fillRect(x + 14, 0, 2, h); }
  g.globalAlpha = 0.18; for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() > 0.5 ? "#000" : "#3a4a40"; g.fillRect(Math.random() * w, Math.random() * h, 1, 2); }
}, { repeat: [1, 1] });
const woodTex = (base = "#3a271a", line = "#2a1b11", rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.strokeStyle = line; g.globalAlpha = 0.25 + Math.random() * 0.35; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke(); }
}, { repeat: rep });
const floorTex = () => canvasTex(512, 512, (g, w, h) => {
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#1d1a17" : "#3b342b"; g.fillRect(i * s, j * s, s, s); }
  g.globalAlpha = 0.12; for (let k = 0; k < 40; k++) { g.strokeStyle = "#cfc4ae"; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + Math.random() * 80 - 40, y + Math.random() * 80 - 40); g.stroke(); }
  g.globalAlpha = 1; g.strokeStyle = "#0d0b09"; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
}, { repeat: [4, 4] });
const textTex = (w, h, bg, draw) => canvasTex(w, h, (g) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } draw(g, w, h); });

/* Uhr: steht seit 17 Jahren auf 23:17 – Glas gesprungen */
const clockTex = () => textTex(512, 512, null, (g, w) => {
  const c = w / 2;
  g.fillStyle = "#e3d6b8"; g.beginPath(); g.arc(c, c, 240, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#3a2a1a"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#2a2119"; g.font = "600 44px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((t, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(c + Math.cos(a) * 190, c + Math.sin(a) * 190); g.font = "600 34px Georgia, serif"; g.fillText(t, 0, 0); g.restore(); });
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(c + Math.cos(a) * 225, c + Math.sin(a) * 225); g.lineTo(c + Math.cos(a) * (i % 5 ? 214 : 205), c + Math.sin(a) * (i % 5 ? 214 : 205)); g.stroke(); }
  const hand = (ang, len, wid) => { g.save(); g.translate(c, c); g.rotate(ang); g.fillStyle = "#16100b"; g.beginPath(); g.moveTo(-wid, 18); g.lineTo(0, -len); g.lineTo(wid, 18); g.closePath(); g.fill(); g.restore(); };
  hand(((23 % 12) + 17 / 60) / 12 * Math.PI * 2, 120, 9);   // Stundenzeiger: 23 Uhr …
  hand((17 / 60) * Math.PI * 2, 185, 6);                   // … 17 Minuten
  g.fillStyle = "#16100b"; g.beginPath(); g.arc(c, c, 12, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(330, 90); g.lineTo(285, 200); g.lineTo(320, 260); g.moveTo(285, 200); g.lineTo(220, 230); g.stroke(); // Sprung im Glas
});
const plaqueTex = (text, w = 512, h = 96, fg = "#b69a6d", bg = "#1a120c", font = "500 44px Georgia, serif", spacing = 10) => textTex(w, h, bg, (g) => {
  g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
  if ("letterSpacing" in g) g.letterSpacing = spacing + "px";
  g.fillText(text, w / 2, h / 2 + 2);
});
const keyboxFace = () => textTex(256, 340, "#3a2a1c", (g, w) => {
  g.strokeStyle = "#7a5f3e"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, 320);
  g.fillStyle = "#c9b28a"; g.font = "600 24px Georgia, serif"; g.textAlign = "center"; if ("letterSpacing" in g) g.letterSpacing = "6px"; g.fillText("SCHLÜSSEL", w / 2, 62);
  g.fillStyle = "#b69a6d"; g.font = "italic 12px Georgia, serif"; g.fillText("NUR FÜR DAS PERSONAL", w / 2, 108); // Gravur über dem Zahlenschloss (3D-Objekt)
});
const photoTex = () => textTex(400, 280, "#cbb796", (g) => {
  g.fillStyle = "#9a8462"; g.fillRect(0, 170, 400, 110);
  g.fillStyle = "#3e3020"; for (let i = 0; i < 5; i++) { const x = 70 + i * 65, y = 120 + (i % 2) * 6; g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill(); g.fillRect(x - 24, y + 18, 48, 110); }
  g.fillStyle = "rgba(60,40,20,.25)"; g.fillRect(0, 0, 400, 280);
  g.fillStyle = "#2a2119"; g.font = "italic 16px Georgia, serif"; g.fillText("Personal, Sommer 2008", 14, 268); // wie Dokument „personalfoto“
});
const pageTex = (lines = 14, red = false) => textTex(256, 340, "#ece2c8", (g) => {
  g.strokeStyle = "#8a7d66"; g.lineWidth = 2;
  for (let i = 0; i < lines; i++) { const y = 40 + i * 20; g.beginPath(); g.moveTo(22, y); g.lineTo(80 + Math.random() * 150, y); g.stroke(); }
  if (red) { g.strokeStyle = "#8a2a20"; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 40); g.lineTo(200, 40); g.stroke(); }
});
const noteTex = () => textTex(256, 180, "#efe6cf", (g) => {
  g.fillStyle = "#2a2119"; g.font = "italic 22px Georgia, serif";
  ["Der Schlüssel liegt dort,", "wo der Gast eingecheckt hat.", "", "Die Uhr erinnert sich."].forEach((t, i) => g.fillText(t, 16, 40 + i * 32));
});
const dialTex = (needleTo2) => textTex(512, 256, "#1a120c", (g) => {
  g.strokeStyle = "#b69a6d"; g.lineWidth = 6; g.beginPath(); g.arc(256, 230, 200, Math.PI, 0); g.stroke();
  const pos = ["E", "1", "2", "3"]; g.fillStyle = "#d4bc90"; g.font = "600 46px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  pos.forEach((t, i) => { const a = Math.PI + (i + 0.5) / 4 * Math.PI; g.fillText(t, 256 + Math.cos(a) * 160, 230 + Math.sin(a) * 160); });
  const a2 = Math.PI + 2.5 / 4 * Math.PI; g.strokeStyle = "#d4362a"; g.lineWidth = 5; g.beginPath(); g.arc(256 + Math.cos(a2) * 160, 230 + Math.sin(a2) * 160, 36, 0, Math.PI * 2); g.stroke(); // rot eingekreiste 2
});
// Inhalt wie Dokument „zeitung“ (Seite 1): Lokalanzeiger, Freitag, 16. Oktober 2009
const newsTex = () => textTex(300, 400, "#e4dccb", (g) => {
  g.fillStyle = "#1b1612"; g.font = "700 30px Georgia, serif"; g.fillText("LOKALANZEIGER", 18, 44);
  g.fillRect(18, 56, 264, 3); g.font = "700 23px Georgia, serif";
  ["Hotel Nocturne nach", "Unwetternacht", "geschlossen"].forEach((t, i) => g.fillText(t, 18, 96 + i * 28));
  g.fillStyle = "#6a6052"; g.fillRect(18, 190, 120, 90);
  g.fillStyle = "#5a5246"; for (let i = 0; i < 14; i++) g.fillRect(150, 192 + i * 13, 120 - (i % 3) * 18, 5);
  for (let i = 0; i < 8; i++) g.fillRect(18, 296 + i * 12, 250 - (i % 4) * 30, 5);
  g.font = "13px Georgia, serif"; g.fillStyle = "#3a332a"; g.fillText("Freitag, 16. Oktober 2009", 18, 392);
});
const glassTex = () => canvasTex(512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = "rgba(230,220,200,.75)"; g.font = "500 72px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  if ("letterSpacing" in g) g.letterSpacing = "18px";
  g.save(); g.translate(w / 2, h / 2); g.scale(-1, 1); g.fillText("NOCTURNE", 0, 0); g.restore(); // von innen spiegelverkehrt
});
const rainTex = () => canvasTex(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#101a2a"); gr.addColorStop(0.7, "#1c2a3c"); gr.addColorStop(1, "#2a3446"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const lamp = g.createRadialGradient(w * 0.75, h * 0.35, 2, w * 0.75, h * 0.35, 90); lamp.addColorStop(0, "rgba(255,210,150,.55)"); lamp.addColorStop(1, "rgba(255,210,150,0)"); g.fillStyle = lamp; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(190,210,240,.5)"; g.lineWidth = 1.2;
  for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h, l = 12 + Math.random() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + l); g.stroke(); }
}, { repeat: [1, 1] });
const matTex = () => textTex(512, 128, "#2b2117", (g, w, h) => {
  g.strokeStyle = "#4a3a28"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = "#6a553c"; g.font = "600 40px DM Mono, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; if ("letterSpacing" in g) g.letterSpacing = "16px"; g.fillText("WILLKOMMEN", w / 2, h / 2 + 2);
});
const portraitTex = () => textTex(256, 320, "#1a1512", (g) => {
  const gr = g.createRadialGradient(128, 130, 10, 128, 150, 180); gr.addColorStop(0, "#3a2c22"); gr.addColorStop(1, "#120e0b"); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#6e5643"; g.beginPath(); g.ellipse(128, 128, 52, 66, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#2a201a"; g.beginPath(); g.moveTo(40, 320); g.quadraticCurveTo(128, 170, 216, 320); g.fill();
  g.fillStyle = "#1c1511"; g.fillRect(96, 104, 22, 6); g.fillRect(140, 104, 22, 6); // strenger Blick
  g.fillStyle = "#3b2c22"; g.fillRect(100, 158, 56, 5);
});
const binderLabel = (t) => textTex(64, 128, "#d6c9a6", (g) => { g.fillStyle = "#2a2119"; g.font = "600 16px DM Mono, monospace"; g.textAlign = "center"; g.fillText(t.split(" ")[0], 32, 52); g.fillText(t.split(" ")[1] || "", 32, 78); });

defineRoom("rezeption", (ctx) => {
  const { add, hs, prop, state, anim, lerp } = ctx;
  const snd = ctx.sound, eng = ctx.engine;
  let tNow = 0; anim((dt, t) => { tNow = t; });
  // Drehgeste um einen Punkt auf dem Bildschirm (Schraube, Schlüssel): liefert die Winkeländerung je Zeigerbewegung (Bildschirm: y nach unten → Uhrzeigersinn = positiv)
  const twister = (objFn) => { let last = null; return { delta(p) { const c = ctx.screenOf(objFn()); const a = Math.atan2(p.y - c.y, p.x - c.x); let d = 0; if (last !== null) { d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; } last = a; return d; }, reset() { last = null; } }; };
  const { place } = walls(R);
  // HD-Materialien (PBR): Damasttapete, poliertes Nussholz, Messing, Samt, Leder
  const M = {
    wall: tag(lambert(0xffffff, { map: damask() }), { roughness: 0.85, normal: 0.9 }), wood: woodMat("#3a2416", "#1c1008"), dark: tag(lambert(0x1b130d), { roughness: 0.6 }),
    woodLight: woodMat("#4e2e18", "#24140a", { clearcoat: 0.3, roughness: 0.45, envMapIntensity: 0.45 }), brass: brassMat(), brassDark: brassMat(0x6e5632, 0.45),
    black: tag(lambert(0x0e0c0b), { roughness: 0.4 }), velvet: velvetMat(0x4a1010, 0xb04040), leather: leatherMat(0x3a1e10), paper: lambert(0xe9dfc6), ceiling: tag(lambert(0x16120e), { roughness: 0.95 }),
  };

  /* ---------- Hülle: Boden, Decke, Wände mit Öffnungen ---------- */
  const fm = marble(); fm.wrapS = fm.wrapT = THREE.RepeatWrapping; fm.repeat.set(R * 2, R * 2);
  const floor = plane(2 * R, 2 * R, tag(lambert(0xffffff, { map: fm }), { roughness: 0.22, clearcoat: 0.6, normal: 0.4 })); floor.rotation.x = -Math.PI / 2; add(floor); // polierter Marmor
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.012, 2.3), tag(lambert(0xffffff, { map: persian() }), { roughness: 0.95, normal: 2.2 })); rug.position.y = 0.006; add(rug); // Perserteppich
  const ceil = plane(2 * R, 2 * R, M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; add(ceil);
  const holes = {
    n: [], s: [{ x: 0, y: 0, w: 1.9, h: 2.8, arch: true }],
    e: [{ x: 0, y: 0, w: 1.5, h: 2.5 }, { x: 2.3, y: 0, w: 1.0, h: 2.3 }], w: [],
  };
  for (const k of ["n", "e", "s", "w"]) {
    add(place(wallMesh(2 * R, H, holes[k], M.wall), k, 0.5, 0, 0));
    // Holzvertäfelung unten + Stuckleiste oben, an Öffnungen unterbrochen
    const segs = []; let from = -R;
    [...holes[k]].sort((a, b) => a.x - b.x).forEach((o) => { segs.push([from, o.x - o.w / 2]); from = o.x + o.w / 2; });
    segs.push([from, R]);
    segs.forEach(([a, b]) => { if (b - a < 0.05) return; const u = (a + b) / 2 / (2 * R) + 0.5; add(place(box(b - a, 1.0, 0.04, M.wood, 0, 0.5, 0.02), k, u, 0, 0)); add(place(box(b - a, 0.06, 0.07, M.dark, 0, 1.03, 0.03), k, u, 0, 0)); });
    add(place(box(2 * R, 0.14, 0.12, M.dark, 0, H - 0.07, 0.06), k, 0.5, 0, 0));
  }

  /* ================= NORD · Empfang ================= */
  // Tresen über fast die ganze Wand, mit zwei Schubladen (reine Optik)
  // Empfangstresen: Sockel, Kassettenfront mit Pilastern, polierte Platte mit Messingkante, Fußleiste aus Messing
  const counter = group(rbox(3.9, 0.96, 0.7, M.wood, 0, 0.56, 0, 0.02), rbox(4.0, 0.1, 0.78, M.dark, 0, 0.05, 0.0, 0.02),
    rbox(4.1, 0.07, 0.86, M.woodLight, 0, 1.075, 0.04, 0.03), rbox(4.12, 0.02, 0.88, M.brass, 0, 1.035, 0.04, 0.008));
  [-1.45, -0.48, 0.48, 1.45].forEach((x) => counter.add(panel(0.8, 0.62, M.wood, x, 0.5, 0.36)));
  [-1.94, -0.965, 0, 0.965, 1.94].forEach((x) => counter.add(rbox(0.09, 0.86, 0.05, M.woodLight, x, 0.55, 0.37, 0.012)));
  const footRail = cyl(0.018, 0.018, 3.8, M.brass, 0, 0.2, 0.48); footRail.rotation.z = Math.PI / 2; counter.add(footRail);
  [-1.6, 0, 1.6].forEach((x) => counter.add(cyl(0.012, 0.012, 0.13, M.brass, x, 0.2, 0.42).rotateX(Math.PI / 2)));
  add(place(counter, "n", 0.56, 0, 1.15)); // endet vor der Treppe in der Nordwest-Ecke
  ["links", "rechts"].forEach((side, i) => {
    const dr = group(box(0.9, 0.18, 0.5, M.woodLight, 0, 0, -0.24), box(0.18, 0.03, 0.03, M.brass, 0, 0, 0.02));
    dr.position.set(i ? 0.97 : -0.97, 0.88, 0.36); const holder = group(dr); place(holder, "n", 0.56, 0, 1.15); add(holder);
    let open = false;
    prop("Schublade", dr, () => { open = !open; const N = window.NOCTURNE; N.audio && N.audio.play && N.audio.play("click"); N.engine.say(open ? (i ? "Die Schublade klemmt kurz, dann gleitet sie auf. Gummibänder, eine leere Stempelkissendose. Nichts von Bedeutung." : "Quittungsblöcke, ein vertrockneter Kugelschreiber, Staub. Wer hier gearbeitet hat, ist vor langer Zeit gegangen.") : ""); });
    anim((dt) => { dr.position.z = lerp(dr.position.z, open ? 0.62 : 0.36, Math.min(1, dt * 8)); });
  });
  // Telefon mit blinkendem Anrufbeantworter
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), basic(0xff2a1a));
  const phone = group(box(0.3, 0.08, 0.22, M.black, 0, 0.04, 0), box(0.26, 0.05, 0.07, M.black, 0, 0.1, -0.04), cyl(0.04, 0.04, 0.05, M.black, -0.11, 0.1, -0.04), cyl(0.04, 0.04, 0.05, M.black, 0.11, 0.1, -0.04), led);
  led.position.set(0.1, 0.085, 0.07);
  // Anrufbeantworter: Wiedergabetaste und Kassettenfenster mit zwei Spulen
  const playBtn = rbox(0.05, 0.02, 0.03, std(0x3a3a38, { roughness: 0.5 }), -0.07, 0.085, 0.07, 0.006); phone.add(playBtn);
  const reels = [-0.035, 0.035].map((x) => { const r = new THREE.Group(); r.position.set(x, 0.081, 0.0); r.add(cyl(0.018, 0.018, 0.004, std(0x1a1a18), 0, 0, 0, 12)); for (let k = 0; k < 3; k++) r.add(box(0.03, 0.005, 0.004, std(0xcfc6b0), 0, 0.003, 0).rotateY(k * Math.PI / 3)); phone.add(r); return r; });
  let played = false, pressT = -1, reelT = -1;
  anim((dt, t) => { led.material.color.setHex(played ? 0x3a0806 : Math.sin(t * 6) > 0 ? 0xff2a1a : 0x3a0806);
    if (pressT >= 0) { pressT += dt; playBtn.position.y = 0.085 - Math.sin(Math.min(1, pressT * 4) * Math.PI) * 0.008; if (pressT > 0.3) pressT = -1; }
    if (reelT >= 0) { reelT += dt; reels.forEach((r) => { r.rotation.y += dt * 6; }); if (reelT > 8) reelT = -1; } });
  add(place(hs("telefon", phone, { act: { play: () => { pressT = 0; reelT = 0; played = true; snd("click"); return 650; } } }), "n", 0.33, 1.11, 1.25));
  // Gästeregister (aufgeschlagen) + lose Seite (Geheimnis)
  const book = group(box(0.62, 0.03, 0.42, lambert(0x4a1414), 0, 0.015, 0));
  const pl = plane(0.29, 0.39, lambert(0xffffff, { map: pageTex(14) })); pl.rotation.set(-Math.PI / 2, 0, 0.04); pl.position.set(-0.15, 0.036, 0); book.add(pl);
  const pr = plane(0.29, 0.39, lambert(0xffffff, { map: pageTex(10, true) })); pr.rotation.set(-Math.PI / 2, 0, -0.04); pr.position.set(0.15, 0.036, 0); book.add(pr);
  book.add(box(0.012, 0.004, 0.3, lambert(0x8a1a14), 0.02, 0.04, 0.05)); // Lesebändchen
  // Selbst blättern (Nahansicht): rechte Seite antippen = vor, linke = zurück; auf der Seite vom 14. Oktober öffnet die linke Seite das Register zum Lesen.
  // Beim Umblättern rutscht die lose Seite (Geheimnis) zwischen den Seiten hervor.
  const leftTex = [pl.material.map, pageTex(12), pageTex(0)], rightTex = [pr.material.map, pageTex(3), pageTex(0)];
  const flipPv = new THREE.Group(); flipPv.position.set(0, 0.037, 0); flipPv.visible = false; book.add(flipPv);
  const flipFront = plane(0.29, 0.39, lambert(0xffffff, { map: rightTex[0] })); flipFront.rotation.x = -Math.PI / 2; flipFront.position.x = 0.15;
  const flipBack = plane(0.29, 0.39, lambert(0xffffff, { map: leftTex[1] })); flipBack.rotation.x = Math.PI / 2; flipBack.rotation.z = Math.PI; flipBack.position.set(0.15, -0.001, 0);
  flipPv.add(flipFront, flipBack);
  let regK = 0, flipT = -1, flipDir = 1;
  const setMap = (m, t) => { m.material.map = t; m.material.needsUpdate = true; };
  const flip = (dir) => {
    if (flipT >= 0) return; const to = regK + dir; if (to < 0 || to > 2) return;
    flipDir = dir; flipT = 0; flipPv.visible = true; snd("paper");
    if (dir > 0) { setMap(flipFront, rightTex[regK]); setMap(flipBack, leftTex[to]); setMap(pr, rightTex[to]); }
    else { setMap(flipFront, rightTex[to]); setMap(flipBack, leftTex[regK]); setMap(pl, leftTex[to]); }
    regK = to;
  };
  anim((dt) => {
    if (flipT < 0) return; flipT += dt; const k = Math.min(1, flipT / 0.6), e = k * k * (3 - 2 * k);
    flipPv.rotation.z = flipDir > 0 ? e * Math.PI : (1 - e) * Math.PI; flipPv.position.y = 0.037 + Math.sin(e * Math.PI) * 0.01;
    if (k >= 1) { flipT = -1; flipPv.visible = false; if (flipDir > 0) setMap(pl, leftTex[regK]); else setMap(pr, rightTex[regK]); }
  });
  const regSpec = {
    when: () => true, cam: [0, 0.52, 0.32], center: [0, 0.03, -0.02], fov: 50,
    hint: "Rechte Seite: weiterblättern · linke Seite: zurück bzw. lesen", value: () => String(regK),
    parts: () => [
      { obj: pr, name: "rechts", tap: () => flip(1) },
      { obj: pl, name: "links", tap: () => { if (regK === 0) eng().hotspot("register"); else flip(-1); } },
      ...(loose.visible ? [{ obj: looseG, name: "lose", tap: () => eng().hotspot("kinderzeichnung") }] : []),
    ],
  };
  add(place(hs("register", book, { focus: regSpec }), "n", 0.49, 1.11, 1.3));
  const loose = plane(0.1, 0.12, lambert(0xd8c99e, { side: THREE.DoubleSide })); loose.rotation.set(-Math.PI / 2 + 0.5, 0, 0.3);
  const looseZone = box(0.16, 0.08, 0.16, ZONE, 0, 0.04, 0);
  const looseG = group(loose, looseZone); loose.position.set(0, 0.05, 0);
  add(place(hs("kinderzeichnung", looseG), "n", 0.443, 1.15, 1.46));
  state((has) => { loose.visible = !has("kinderzeichnung_gesehen"); });
  // nach dem Umblättern rutscht sie weiter heraus und liegt auf der rechten Seite
  const looseHome = looseG.position.clone(), looseRot = looseG.rotation.y; let looseOut = 0;
  anim((dt) => { const to = regK > 0 && loose.visible ? 1 : 0; looseOut += (to - looseOut) * Math.min(1, dt * 3); if (looseOut < 0.001 && to === 0) return;
    const tgt = book.localToWorld(new THREE.Vector3(0.12, 0.0, 0.05)).sub(new THREE.Vector3(0, 0.04, 0));
    looseG.position.lerpVectors(looseHome, tgt, looseOut); looseG.rotation.y = looseRot + looseOut * 0.4; loose.rotation.x = -Math.PI / 2 + 0.5 * (1 - looseOut); });
  // Zettel, Tischklingel
  const note = plane(0.24, 0.17, lambert(0xffffff, { map: noteTex() })); note.rotation.set(-Math.PI / 2, 0, -0.12);
  add(place(hs("zettel", group(note, box(0.26, 0.04, 0.2, ZONE, 0, 0.02, 0))), "n", 0.64, 1.116, 1.35));
  const bell = group(cyl(0.07, 0.08, 0.02, M.brassDark, 0, 0.01, 0), new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.brass), cyl(0.008, 0.008, 0.03, M.brass, 0, 0.075, 0));
  bell.children[1].position.y = 0.02;
  let bellT = -1; anim((dt) => { if (bellT >= 0) { bellT += dt; bell.children[2].position.y = 0.075 - Math.sin(Math.min(1, bellT * 5) * Math.PI) * 0.012; if (bellT > 0.2) bellT = -1; } });
  add(place(hs("klingel", bell, { act: { play: () => { bellT = 0; return 200; } } }), "n", 0.73, 1.11, 1.35));
  // Tischlampe (warmes Licht)
  // Tischlampe aus Code; Hauptlicht der Rezeption mit Schatten
  const lamp = tableLamp(0.6, 0x7a4a26);
  add(place(lamp, "n", 0.84, 1.11, 1.1));
  const lampLight = new THREE.PointLight(0xffb066, 9, 0, 2); place(lampLight, "n", 0.84, 1.5, 1.2); lampLight.userData.shadow = true; add(lampLight);
  anim((dt, t) => { lampLight.intensity = 9 + Math.sin(t * 13) * 0.12 + (Math.random() < 0.004 ? -2 : 0); });
  // Schlüsselkasten (öffnet sich nach dem Code)
  const kb = group(box(0.72, 1.0, 0.12, M.wood, 0, 0, 0.06));
  const kbInner = group(box(0.66, 0.94, 0.01, M.dark, 0, 0, 0.125)); kbInner.position.z = 0.002;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const hook = cyl(0.008, 0.008, 0.05, M.brass, -0.24 + c * 0.16, 0.3 - r * 0.2, 0.15); hook.rotation.x = Math.PI / 2; kbInner.add(hook); if ((r * 4 + c) % 3 === 0) kbInner.add(box(0.03, 0.08, 0.005, M.brass, -0.24 + c * 0.16, 0.25 - r * 0.2, 0.16)); }
  kb.add(kbInner);
  const kbDoorPivot = new THREE.Group(); kbDoorPivot.position.set(-0.36, 0, 0.19); // vor den Haken (die ragen bis z ≈ 0,175)
  const kbDoor = plane(0.72, 1.0, lambert(0xffffff, { map: keyboxFace() })); kbDoor.position.x = 0.36; kbDoorPivot.add(kbDoor);
  const kbBack = plane(0.72, 1.0, M.dark); kbBack.rotation.y = Math.PI; kbBack.position.set(0.36, 0, -0.002); kbDoorPivot.add(kbBack);
  // Messing-Zahlenschloss mit vier Ziffernrollen und Bügel – direkt bedienbar (Nahansicht), Prüfung durch die Engine (tryLock)
  const lock = new THREE.Group(); lock.position.set(0.36, -0.08, 0.012); kbDoorPivot.add(lock);
  lock.add(rbox(0.38, 0.26, 0.03, M.brass, 0, 0, 0.015, 0.012), rbox(0.33, 0.1, 0.012, M.dark, 0, 0.0, 0.032, 0.004));
  const digitMats = Array.from({ length: 10 }, (_, d) => new THREE.MeshStandardMaterial({ map: textTex(64, 64, "#1a120c", (g) => { g.fillStyle = "#e8d2a0"; g.font = "600 46px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(d), 32, 35); }), roughness: 0.5 }));
  const wheels = [], digits = [0, 0, 0, 0], wheelAng = [0, 0, 0, 0], RW = 0.042, STEP = (Math.PI * 2) / 10;
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Group(); w.position.set(-0.117 + i * 0.078, 0, 0.03);
    const drum = cyl(RW * 0.92, RW * 0.92, 0.056, M.brassDark, 0, 0, 0, 24); drum.rotation.z = Math.PI / 2; w.add(drum);
    for (let d = 0; d < 10; d++) { const a = d * STEP; const pl = plane(0.05, 0.025, digitMats[d]); pl.position.set(0, RW * Math.sin(a), RW * Math.cos(a)); pl.rotation.x = -a; w.add(pl); }
    [-0.03, 0.03].forEach((x) => { const rim = cyl(RW * 1.05, RW * 1.05, 0.005, M.brass, x, 0, 0, 24); rim.rotation.z = Math.PI / 2; w.add(rim); });
    lock.add(w); wheels.push(w);
  }
  const shackle = group(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 10, 24, Math.PI), M.brass), box(0.12, 0.04, 0.03, ZONE, 0, 0.025, 0)); shackle.position.set(0, -0.15, 0.035); shackle.rotation.z = Math.PI; lock.add(shackle);
  const N3 = window.NOCTURNE, E3 = () => N3.engine, A3 = { play: (n) => N3.audio && N3.audio.play(n) };
  let dragging = -1;
  const turnTo = (i, d) => { digits[i] = ((d % 10) + 10) % 10; A3.play("key"); };
  let pullT = -1, shakeT = -1;
  const lockSpec = {
    when: () => !E3().isSolved("keybox"), cam: [0, -0.16, 0.8], center: [0, -0.16, 0.24], fov: 40, exitDelay: 1600,
    hint: "Rollen antippen oder wischen · Bügel ziehen zum Öffnen", value: () => digits.join(""),
    parts: () => [
      ...wheels.map((w, i) => ({ obj: w, name: "rad" + i, tap: (h, info) => turnTo(i, digits[i] + (info && !info.above ? -1 : 1)), // oben antippen: +1, unten: −1
        drag: (dx, dy) => { dragging = i; wheelAng[i] += dy * 0.03; }, release: (moved) => { dragging = -1; if (moved) turnTo(i, Math.round(wheelAng[i] / STEP)); } })),
      { obj: shackle, name: "buegel", tap: () => { pullT = 0; const r = E3().tryLock("keybox", digits.join("")); if (!r.ok) shakeT = 0; } },
    ],
  };
  kb.add(kbDoorPivot);
  add(place(hs("schluesselkasten", kb, { focus: lockSpec }), "n", 0.31, 1.9, 0.0));
  anim((dt) => {
    wheels.forEach((w, i) => { if (dragging !== i) wheelAng[i] += (digits[i] * STEP - wheelAng[i]) * Math.min(1, dt * 12); w.rotation.x = wheelAng[i]; });
    if (pullT >= 0) { pullT += dt; shackle.position.y = -0.15 - Math.sin(Math.min(1, pullT * 3) * Math.PI) * 0.025; if (pullT > 0.4) pullT = -1; }
    if (shakeT >= 0) { shakeT += dt; lock.position.x = 0.36 + Math.sin(shakeT * 60) * 0.004 * (1 - shakeT / 0.4); if (shakeT > 0.4) { shakeT = -1; lock.position.x = 0.36; } }
  });
  let kbOpen = false; state((has) => { kbOpen = has("keybox_open"); });
  anim((dt) => { kbDoorPivot.rotation.y = lerp(kbDoorPivot.rotation.y, kbOpen ? -1.75 : 0, Math.min(1, dt * 4)); });
  // Wanduhr (23:17) mit Messingrand und Schild
  const clockG = group(new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), lambert(0xffffff, { map: clockTex() })), new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 12, 48), M.brass));
  clockG.children[0].position.z = 0.03; clockG.children[1].position.z = 0.03;
  const clockSign = plane(0.62, 0.11, lambert(0xffffff, { map: plaqueTex("REZEPTION") })); clockSign.position.set(0, -0.5, 0.02); clockG.add(clockSign);
  add(place(hs("uhr", clockG), "n", 0.5, 2.68, 0.01));
  // Gerahmtes Personalfoto (hängt leicht schief)
  const photo = ornateFrame(0.8, 0.6, lambert(0xffffff, { map: photoTex() }), woodMat("#2a1a10", "#120a04"), 0.04, 0.06); photo.rotation.z = -0.035; // hängt leicht schief
  // In die Hand nehmen: das Foto kommt von der Wand vor die Augen und dreht sich um – Rückseite wie im Dokument „personalfoto“
  const photoBack = plane(0.68, 0.48, lambert(0xffffff, { map: textTex(512, 360, "#d8ccb0", (g, w, h) => {
    g.fillStyle = "#2c2a5a"; g.textAlign = "center"; g.font = "italic 19px Georgia, serif"; g.fillText("v. l. n. r.: Greta (Küche) · Tomasz (Haustechnik) ·", w / 2, 70); g.fillText("V. Lehn · Elias Voss (Nacht) · Ilse (Empfang)", w / 2, 100);
    g.font = "italic 34px Georgia, serif"; g.fillText("Für M. – damit du weißt,", w / 2, 190); g.fillText("wo ich nachts bin.", w / 2, 236); g.font = "italic 28px Georgia, serif"; g.fillText("E.", w * 0.78, 300); }) }));
  photoBack.rotation.y = Math.PI; photoBack.position.z = -0.03;
  const photoAnim = new THREE.Group(); while (photo.children.length) photoAnim.add(photo.children[0]); photoAnim.add(photoBack); photo.add(photoAnim);
  const photoHold = { t: -1 };
  anim((dt) => { if (photoHold.t < 0) return; photoHold.t += dt; const out = photoHold.t < 0.9 ? photoHold.t / 0.9 : (eng().blocked() || photoHold.t < 2 ? 1 : Math.max(0, 1 - (photoHold.t - 2) * 1.5)); const k = out * out * (3 - 2 * out);
    photoAnim.position.set(-1.2 * k, -0.62 * k, 2.55 * k); photoAnim.rotation.set(0, Math.PI * Math.min(1, Math.max(0, (photoHold.t - 0.45) / 0.5)) * (out >= 1 || photoHold.t < 2 ? 1 : out), 0.035 * k);
    if (out <= 0 && photoHold.t > 2) { photoHold.t = -1; photoAnim.position.set(0, 0, 0); photoAnim.rotation.set(0, 0, 0); } });
  add(place(hs("personalfoto", photo, { act: { play: () => { photoHold.t = 0; snd("paper"); return 1050; } } }), "n", 0.8, 2.3, 0.03));

  /* ================= OST · Aufzug ================= */
  // Kabine hinter der Wand, Türen gleiten auf
  const cab = group(box(1.5, 0.05, 1.4, lambert(0x2a2119), 0, 0, -0.7), box(1.5, 2.5, 0.05, lambert(0x6a4e30), 0, 1.25, -1.4), box(0.05, 2.5, 1.4, lambert(0x5a4228), -0.75, 1.25, -0.7), box(0.05, 2.5, 1.4, lambert(0x5a4228), 0.75, 1.25, -0.7), box(1.5, 0.05, 1.4, lambert(0x1a1410), 0, 2.5, -0.7), plane(0.7, 1.2, phong(0x3a4650, { shininess: 90 }), 0, 1.35, -1.37));
  const cabLight = new THREE.PointLight(0xffd28a, 0, 0, 2); cabLight.position.set(0, 2.3, -0.7); cab.add(cabLight);
  const cabZone = plane(1.5, 2.5, ZONE, 0, 1.25, -0.02); cab.add(cabZone);
  const doorMat = brassMat(0x4e3a22, 0.42), /* Bronze */ doorL = box(0.75, 2.5, 0.04, doorMat, -0.375, 1.25, -0.03), doorR = box(0.75, 2.5, 0.04, doorMat, 0.375, 1.25, -0.03);
  doorL.add(box(0.02, 2.3, 0.01, M.brassDark, 0.36, 0, 0.025)); doorR.add(box(0.02, 2.3, 0.01, M.brassDark, -0.36, 0, 0.025));
  const frame = group(box(0.12, 2.62, 0.08, M.brassDark, -0.81, 1.31, 0.03), box(0.12, 2.62, 0.08, M.brassDark, 0.81, 1.31, 0.03), box(1.74, 0.12, 0.08, M.brassDark, 0, 2.56, 0.03));
  const elev = group(cab, doorL, doorR, frame);
  add(place(hs(["aufzug_offen", "aufzug"], elev), "e", 0.5, 0, 0));
  let elOpen = false; state((has) => { elOpen = has("elevator_open"); });
  anim((dt) => { const k = Math.min(1, dt * 1.6); doorL.position.x = lerp(doorL.position.x, elOpen ? -1.1 : -0.375, k); doorR.position.x = lerp(doorR.position.x, elOpen ? 1.1 : 0.375, k); cabLight.intensity = lerp(cabLight.intensity, elOpen ? 4 : 0, k); });
  // Stockwerksanzeige mit eingekreister 2; Zeiger wandert nach dem Schlüsselschalter auf die 2
  const dial = group(plane(0.6, 0.3, lambert(0xffffff, { map: dialTex(), emissive: 0x241608 })));
  const needle = group(box(0.008, 0.2, 0.004, basic(0x1a120c), 0, 0.1, 0.01)); needle.position.set(0, -0.13, 0.005); dial.add(needle);
  const dialGlow = new THREE.PointLight(0xffcf8a, 0.6, 1.2, 2); dialGlow.position.set(0, 0, 0.3); dial.add(dialGlow);
  add(place(hs("anzeige", dial), "e", 0.5, 2.88, 0.02));
  const angE = (Math.PI / 2) - (0.5 / 4) * Math.PI, ang2 = (Math.PI / 2) - (2.5 / 4) * Math.PI;
  let needleTo = angE; state((has) => { needleTo = has("elevator_open") ? ang2 : angE; });
  anim((dt) => { needle.rotation.z = lerp(needle.rotation.z, needleTo, Math.min(1, dt * 0.8)); });
  // Messingabdeckung (verschraubt) → Schlüsselschalter
  const cover = group(box(0.2, 0.32, 0.02, M.brass, 0, 0, 0.01));
  [[-0.075, 0.13], [0.075, 0.13], [-0.075, -0.13], [0.075, -0.13]].forEach(([x, y]) => { const s = cyl(0.012, 0.012, 0.01, M.brassDark, x, y, 0.022); s.rotation.x = Math.PI / 2; cover.add(s); });
  const coverAnim = new THREE.Group(); while (cover.children.length) coverAnim.add(cover.children[0]); cover.add(coverAnim); // innen animieren, außen sitzt die Wandposition
  const sw = group(box(0.2, 0.32, 0.015, M.black, 0, 0, 0.008), cyl(0.035, 0.035, 0.02, M.brass, 0, 0.04, 0.02), new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), basic(0xff2a1a)));
  sw.children[1].rotation.x = Math.PI / 2; sw.children[2].position.set(0, -0.08, 0.02);
  // Selbst aufschrauben: Schraubendreher gewählt → Nahansicht; Schraube antippen setzt an, gegen den Uhrzeigersinn drehen (oder antippen) – nach vier Schrauben benutzt die Engine den Schraubendreher
  const sdHand = group(cyl(0.004, 0.004, 0.09, std(0xb8bcc0, { metalness: 1, roughness: 0.25 }), 0, 0, 0.045), cyl(0.016, 0.019, 0.1, std(0x8a2a1c, { roughness: 0.35 }), 0, 0, 0.14, 8));
  sdHand.children.forEach((c) => { c.rotation.x = Math.PI / 2; }); sdHand.visible = false; coverAnim.add(sdHand);
  const prog = [0, 0, 0, 0], fallT = [-1, -1, -1, -1]; let active = 0, unscrewed = false;
  const scr = () => coverAnim.children.slice(1, 5);
  const screwTwist = twister(() => scr()[active]);
  const loosen = (i, amt) => { if (prog[i] >= 1) return; active = i; prog[i] = Math.max(0, Math.min(1, prog[i] + amt)); if (prog[i] >= 1) { fallT[i] = 0; snd("drop"); if (prog.every((v) => v >= 1)) { unscrewed = true; setTimeout(() => eng().hotspot("abdeckung"), 700); } } };
  const coverSpec = {
    useItem: "schraubendreher", when: () => !eng().has("cover_open"), cam: [0, -0.03, 0.6], center: [0, -0.03, 0], fov: 45, exitDelay: 2600,
    hint: "Schraube antippen · gegen den Uhrzeigersinn drehen", value: () => prog.map((v) => v.toFixed(2)).join(" "),
    enter: () => { sdHand.visible = true; }, exit: () => { sdHand.visible = false; },
    parts: () => scr().map((sc, i) => ({ obj: sc, name: "schraube" + i, tap: () => { if (active !== i) { active = i; snd("click"); } else loosen(i, 0.25); },
      drag: (dx, dy, pt) => { active = i; const d = screwTwist.delta(pt); loosen(i, d < 0 ? -d / (Math.PI * 4) : -d / (Math.PI * 8)); }, release: () => screwTwist.reset() })),
  };
  anim((dt) => {
    const list = scr();
    if (!coverWas) list.forEach((sc, i) => { if (fallT[i] < 0) { sc.rotation.y = prog[i] * Math.PI * 4; sc.position.z = 0.022 + prog[i] * 0.03; } });
    fallT.forEach((t, i) => { if (t < 0) return; fallT[i] += dt; const sc = list[i]; sc.position.y += -dt * 2.2 * fallT[i] * 4; sc.position.z += dt * 0.4; if (fallT[i] > 0.6) { sc.visible = false; fallT[i] = -2; } });
    if (sdHand.visible) { const sc = list[active]; sdHand.position.set(sc.position.x, sc.position.y, sc.position.z); sdHand.rotation.z = prog[active] * Math.PI * 4; }
  });
  add(place(hs("abdeckung", cover, { focus: coverSpec }), "e", 0.7, 1.45, 0.0));
  // Schlüssel im Schalter selbst drehen (Schlüssel 217 gewählt): im Uhrzeigersinn um 90° oder antippen
  let swTurn = 0; const swTw = twister(() => swKey); // Drehpunkt = Schlüssel (nicht die Schaltermitte)
  let swFired = false;
  const swDone = () => { if (!swFired && swTurn >= Math.PI / 2 * 0.95 && !eng().has("elevator_open")) { swFired = true; swTurn = Math.PI / 2; snd("click"); setTimeout(() => eng().hotspot("schalter"), 350); } }; // nur einmal auslösen
  const swSpec = {
    useItem: "key217", when: () => eng().has("cover_open") && !eng().has("elevator_open"), cam: [0, 0.03, 0.38], center: [0, 0.03, 0], fov: 45, exitDelay: 1800,
    hint: "Schlüssel im Uhrzeigersinn drehen (oder antippen)", value: () => swTurn.toFixed(2),
    enter: () => { swTurn = 0; swFired = false; swKey.visible = true; swKey.rotation.z = 0; }, exit: () => { if (!eng().has("elevator_open")) swKey.visible = false; },
    parts: () => [{ obj: swKeyZone, name: "schluessel", tap: () => { swTurn = Math.min(Math.PI / 2, swTurn + Math.PI / 6); snd("key"); swDone(); },
      drag: (dx, dy, pt) => { swTurn = Math.max(0, Math.min(Math.PI / 2, swTurn + swTw.delta(pt))); swDone(); }, release: () => swTw.reset() }],
  };
  add(place(hs("schalter", sw, { hideWhenHidden: true, focus: swSpec }), "e", 0.7, 1.45, 0.0));
  // Sichtbare Handlung: Schrauben drehen sich nacheinander heraus, die Platte kippt und fällt zu Boden (beim Laden: liegt schon unten)
  const screws = coverAnim.children.slice(1, 5); let coverT = -1, coverWas = null;
  const plateDown = () => { coverAnim.position.y = -1.45 + 0.012; coverAnim.position.z = 0.35; coverAnim.rotation.set(-Math.PI / 2, 0, 0.4); screws.forEach((sc) => { sc.visible = false; }); };
  // Schlüssel im Schalter: steckt, dreht sich um 90°, wird nach kurzer Zeit wieder abgezogen
  const swKey = group(cyl(0.006, 0.006, 0.05, M.brass, 0, 0, 0.03), new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 8, 16), M.brass));
  swKey.children[0].rotation.x = Math.PI / 2; swKey.children[1].position.z = 0.06; swKey.position.set(0, 0.04, 0.02); swKey.visible = false; sw.add(swKey);
  const swKeyZone = box(0.14, 0.14, 0.1, ZONE, 0, 0.04, 0.05); sw.add(swKeyZone);
  anim(() => { if (keyT < 0 && swKey.visible) swKey.rotation.z = -swTurn; });
  let keyT = -1, elWas = null;
  state((has) => {
    sw.children[2].material.color.setHex(has("elevator_open") ? 0x36d06a : 0xff2a1a);
    const c = has("cover_open"); if (coverWas === null && c) plateDown(); else if (coverWas === false && c) coverT = unscrewed ? 1.5 : 0; coverWas = c;
    const el = has("elevator_open"); if (elWas === false && el) { keyT = 0; swKey.visible = true; } elWas = el;
  });
  anim((dt) => {
    if (coverT >= 0) {
      coverT += dt;
      screws.forEach((sc, i) => { const k = Math.min(1, Math.max(0, (coverT - i * 0.35) / 0.35)); sc.rotation.y = k * 9; sc.position.z = 0.022 + k * 0.03; if (k >= 1) sc.visible = false; });
      const f = Math.max(0, coverT - 1.5);
      if (f > 0) { const k = Math.min(1, f / 0.7); coverAnim.rotation.x = -k * k * Math.PI / 2; coverAnim.rotation.z = k * 0.4; coverAnim.position.z = k * 0.35; coverAnim.position.y = -k * k * (1.45 - 0.012); }
      if (f > 0.7) { plateDown(); coverT = -1; }
    }
    if (keyT >= 0) { keyT += dt; swKey.rotation.z = -Math.min(1, keyT / 0.6) * Math.PI / 2; if (keyT > 3) { swKey.visible = false; keyT = -1; } }
  });
  // Vertrocknete Palme
  const palm = group(cyl(0.24, 0.17, 0.5, lambert(0x2a2016), 0, 0.25, 0), cyl(0.22, 0.22, 0.02, lambert(0x1a130d), 0, 0.49, 0));
  for (let i = 0; i < 11; i++) { const f = box(0.022, 0.9 + (i % 3) * 0.12, 0.008, lambert(i % 2 ? 0x5a4a2c : 0x6b5a34), 0, 0, 0); const p = new THREE.Group(); p.add(f); f.position.y = 0.5; p.position.y = 0.5; p.rotation.set(0.35 + (i % 4) * 0.2, (i / 11) * Math.PI * 2, 0); palm.add(p); }
  palm.add(cyl(0.45, 0.3, 1.5, ZONE, 0, 0.75, 0)); // Klickfläche um Topf und Blätter
  add(place(hs("palme", palm), "e", 0.2, 0, 0.45));
  // Tür „Personal“ → Treppe ins Untergeschoss
  const stairsDown = group(box(1.0, 0.05, 1.6, lambert(0x0c0a08), 0, -0.1, -0.8), box(1.0, 2.3, 0.05, lambert(0x0c0a08), 0, 1.15, -1.6), box(0.05, 2.3, 1.6, lambert(0x100d0a), -0.5, 1.15, -0.8), box(0.05, 2.3, 1.6, lambert(0x100d0a), 0.5, 1.15, -0.8));
  for (let i = 0; i < 6; i++) stairsDown.add(box(0.9, 0.06, 0.25, lambert(0x2a221a), 0, -0.15 - i * 0.18, -0.2 - i * 0.25));
  stairsDown.add(plane(1.0, 2.3, ZONE, 0, 1.15, -0.03));
  const pdPivot = new THREE.Group(); pdPivot.position.set(0.5, 0, 0);
  const pDoor = box(1.0, 2.3, 0.05, lambert(0xffffff, { map: woodTex("#2e2117", "#1a120b") }), -0.5, 1.15, 0); pdPivot.add(pDoor);
  const pSign = plane(0.42, 0.1, lambert(0xffffff, { map: plaqueTex("PERSONAL", 384, 96, "#d4bc90", "#2a1d14", "600 40px Georgia, serif", 6) }), -0.5, 1.75, 0.03); pdPivot.add(pSign);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), M.brass); knob.position.set(-0.9, 1.05, 0.05); pdPivot.add(knob);
  // Schlüsselschild und Personalschlüssel (selbst drehen, wenn der Schlüssel gewählt ist)
  const escut = rbox(0.05, 0.1, 0.012, M.brass, -0.9, 0.9, 0.031, 0.006); pdPivot.add(escut); pdPivot.add(box(0.008, 0.026, 0.004, M.black, -0.9, 0.9, 0.038));
  const pKey = group(cyl(0.006, 0.006, 0.05, M.brassDark, 0, 0, 0.03), new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 16), M.brassDark), box(0.14, 0.14, 0.1, ZONE, 0, 0, 0.05));
  pKey.children[0].rotation.x = Math.PI / 2; pKey.children[1].position.z = 0.065; pKey.position.set(-0.9, 0.9, 0.035); pKey.visible = false; pdPivot.add(pKey);
  let pTurn = 0, pKeyT = -1; const pTw = twister(() => pKey);
  let pFired = false;
  const pDone = () => { if (!pFired && pTurn >= Math.PI / 2 * 0.95 && !eng().has("personal_open")) { pFired = true; pTurn = Math.PI / 2; snd("click"); setTimeout(() => eng().hotspot("personaltuer"), 350); pKeyT = 0; } };
  const doorSpec = {
    useItem: "personalschluessel", when: (id) => id === "personaltuer" && !eng().has("personal_open"), cam: [-0.4, 0.9, 0.5], center: [-0.4, 0.9, 0.04], fov: 45, exitDelay: 1500,
    hint: "Schlüssel im Uhrzeigersinn drehen (oder antippen)", value: () => pTurn.toFixed(2),
    enter: () => { pTurn = 0; pFired = false; pKey.visible = true; }, exit: () => { if (!eng().has("personal_open")) pKey.visible = false; },
    parts: () => [{ obj: pKey, name: "schluessel", tap: () => { pTurn = Math.min(Math.PI / 2, pTurn + Math.PI / 6); snd("key"); pDone(); },
      drag: (dx, dy, pt) => { pTurn = Math.max(0, Math.min(Math.PI / 2, pTurn + pTw.delta(pt))); pDone(); }, release: () => pTw.reset() }],
  };
  anim((dt) => { if (pKey.visible) pKey.rotation.z = -pTurn; if (pKeyT >= 0) { pKeyT += dt; if (pKeyT > 2.5) { pKey.visible = false; pKeyT = -1; } } });
  const pFrame = group(box(0.08, 2.38, 0.06, M.dark, -0.54, 1.19, 0.02), box(0.08, 2.38, 0.06, M.dark, 0.54, 1.19, 0.02), box(1.16, 0.08, 0.06, M.dark, 0, 2.34, 0.02));
  add(place(hs(["personaltreppe", "personaltuer"], group(stairsDown, pdPivot, pFrame), { focus: doorSpec }), "e", 0.86, 0, 0));
  let pOpen = false; state((has) => { pOpen = has("personal_open"); });
  anim((dt) => { pdPivot.rotation.y = lerp(pdPivot.rotation.y, pOpen ? 1.6 : 0, Math.min(1, dt * 3)); });
  // Hängeleuchte in der Raummitte
  const pend = group(cyl(0.008, 0.008, 0.8, M.black, 0, -0.4, 0), new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), basic(0xffd9a0)));
  pend.children[1].position.y = -0.85; pend.position.set(0.6, H, 0.3); add(pend);
  const pendLight = new THREE.PointLight(0xffc98a, 7, 0, 2); pendLight.position.set(0.6, H - 1.0, 0.3); add(pendLight);

  /* ================= SÜD · Eingang ================= */
  const outside = plane(2.4, 3.2, basic(0xffffff, { map: rainTex() }), 0, 1.5, -0.6);
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x9ab4c8, transparent: true, opacity: 0.08, depthWrite: false });
  const letters = plane(1.7, 0.42, new THREE.MeshBasicMaterial({ map: glassTex(), transparent: true, depthWrite: false }), 0, 2.15, -0.02);
  const door = group(outside, plane(1.9, 2.8, glassMat, 0, 1.4, -0.03), letters,
    box(0.08, 2.8, 0.1, M.dark, -0.95, 1.4, 0), box(0.08, 2.8, 0.1, M.dark, 0.95, 1.4, 0), box(0.06, 2.4, 0.08, M.dark, 0, 1.2, 0.01),
    cyl(0.015, 0.015, 0.5, M.brass, -0.12, 1.15, 0.07), cyl(0.015, 0.015, 0.5, M.brass, 0.12, 1.15, 0.07));
  let rattleT = -1; anim((dt) => { if (rattleT >= 0) { rattleT += dt; door.children.forEach((c, i) => { if (i >= 3) c.position.x = (c.userData.x0 ??= c.position.x) + Math.sin(rattleT * 55) * 0.006 * (1 - rattleT / 0.7); }); if (rattleT > 0.7) { rattleT = -1; door.children.forEach((c) => { if (c.userData.x0 !== undefined) c.position.x = c.userData.x0; }); } } });
  add(place(hs("eingangstuer", door, { act: { play: () => { rattleT = 0; snd("click"); setTimeout(() => snd("click"), 180); return 750; } } }), "s", 0.5, 0, 0.0));
  anim((dt) => { outside.material.map.offset.y += dt * 0.9; });
  // Schirmständer mit E.V.-Schirm
  const umb = group(cyl(0.13, 0.12, 0.55, lambert(0x22180f), 0, 0.275, 0), cyl(0.015, 0.03, 0.95, M.black, 0.02, 0.6, 0));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), lambert(0x4a2e1a)); handle.position.set(0.07, 1.08, 0); umb.add(handle);
  // In die Hand nehmen: Schirm hebt sich heraus, der Griff mit „E.V.“ dreht sich zur Kamera
  const umbAnim = new THREE.Group(); umb.remove(umb.children[1]); umb.remove(handle);
  const shaftU = cyl(0.015, 0.03, 0.95, M.black, 0, 0.6, 0); umbAnim.add(shaftU, handle);
  const ev = plane(0.06, 0.03, new THREE.MeshStandardMaterial({ map: textTex(128, 64, null, (g) => { g.fillStyle = "#d8b48a"; g.font = "italic 600 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("E.V.", 64, 34); }), transparent: true, roughness: 0.6 })); ev.position.set(0.07, 1.04, 0.013); umbAnim.add(ev);
  umbAnim.position.x = 0.02; shaftU.position.x = 0; handle.position.x = 0.05; ev.position.x = 0.05; umb.add(umbAnim);
  const umbHold = { t: -1 };
  anim((dt) => { if (umbHold.t < 0) return; umbHold.t += dt; const out = umbHold.t < 0.9 ? umbHold.t / 0.9 : (eng().blocked() || umbHold.t < 2 ? 1 : Math.max(0, 1 - (umbHold.t - 2) * 1.5)); const k = out * out * (3 - 2 * out);
    umbAnim.position.set(0.02 + 1.0 * k, 0.55 * k, 1.75 * k); umbAnim.rotation.set(0.25 * k, -0.5 * k, 0);
    if (out <= 0 && umbHold.t > 2) { umbHold.t = -1; umbAnim.position.set(0.02, 0, 0); umbAnim.rotation.set(0, 0, 0); } });
  add(place(hs("schirmstaender", umb, { act: { play: () => { umbHold.t = 0; snd("pickup"); return 1000; } } }), "s", 0.23, 0, 0.35));
  // Gerahmter Zeitungsartikel (schief)
  const news = group(box(0.62, 0.8, 0.04, M.dark), plane(0.52, 0.7, lambert(0xffffff, { map: newsTex() }), 0, 0, 0.022)); news.rotation.z = 0.03;
  add(place(hs("zeitung", news), "s", 0.82, 1.9, 0.03));
  // Fußmatte
  const mat = plane(1.4, 0.55, lambert(0xffffff, { map: matTex(), side: THREE.DoubleSide })); mat.rotation.x = -Math.PI / 2;
  const matPv = new THREE.Group(); matPv.position.z = -0.275; mat.position.z = 0.275; matPv.add(mat); // Drehpunkt an der hinteren Kante
  const dustUnder = plane(1.3, 0.5, new THREE.MeshLambertMaterial({ color: 0x8a7e68, transparent: true, opacity: 0.35, depthWrite: false })); dustUnder.rotation.x = -Math.PI / 2; dustUnder.position.y = -0.008;
  let matT = -1; anim((dt) => { if (matT >= 0) { matT += dt; const k = matT < 2.2 ? Math.min(1, matT * 3) : Math.max(0, 1 - (matT - 2.2) * 2); matPv.rotation.x = -k * 0.75; if (matT > 2.8 && !eng().blocked()) { matT = -1; matPv.rotation.x = 0; } else if (matT > 2.7 && eng().blocked()) matT = 2.2 - 0.01; } });
  add(place(hs("fussmatte", group(matPv, dustUnder, box(1.4, 0.03, 0.55, ZONE, 0, 0.015, 0)), { act: { play: () => { matT = 0; snd("paper"); return 600; } } }), "s", 0.5, 0.012, 0.75));
  // Wandleuchte
  const sconce = group(box(0.08, 0.16, 0.04, M.brassDark), cyl(0.06, 0.11, 0.16, lambert(0xd9b98a, { emissive: 0x8a5a24 }), 0, 0.12, 0.1, 18));
  add(place(sconce, "s", 0.21, 2.3, 0.02));
  const scL = new THREE.PointLight(0xffb36b, 6, 0, 2); place(scL, "s", 0.21, 2.35, 0.35); add(scL);

  /* ================= WEST · Sitzecke ================= */
  // Aktenregal mit Ordner „ABR. 10/09“
  const shelf = group(box(1.9, 0.04, 0.32, M.wood, 0, 0, 0), box(1.9, 0.04, 0.32, M.wood, 0, 0.62, 0), box(1.9, 0.04, 0.32, M.wood, 0, 1.24, 0), box(0.04, 1.28, 0.32, M.wood, -0.95, 0.62, 0), box(0.04, 1.28, 0.32, M.wood, 0.95, 0.62, 0));
  const cols = [0x4a1f1c, 0x243330, 0x54432b, 0x33251c, 0x4a1f1c, 0x243330, 0x3a3020];
  let x = -0.85; cols.forEach((c, i) => { const w = 0.11 + (i % 3) * 0.03; const hgt = 0.48 + (i % 2) * 0.06; shelf.add(box(w, hgt, 0.26, lambert(c), x + w / 2, 0.02 + hgt / 2, 0)); x += w + 0.015; });
  const abr = box(0.13, 0.52, 0.26, lambert(0x54432b), x + 0.07, 0.28, 0); shelf.add(abr);
  const abrL = plane(0.08, 0.16, lambert(0xffffff, { map: binderLabel("ABR. 10/09") })); abrL.position.set(x + 0.07, 0.32, 0.132); shelf.add(abrL);
  x += 0.16; [0x243330, 0x4a1f1c, 0x2a221b].forEach((c, i) => { shelf.add(box(0.12, 0.5, 0.26, lambert(c), x + 0.06, 0.27, 0)); x += 0.14; });
  for (let i = 0; i < 9; i++) shelf.add(box(0.13, 0.46 - (i % 3) * 0.05, 0.25, lambert(cols[(i + 2) % cols.length]), -0.85 + i * 0.15 + 0.065, 0.64 + 0.23 - (i % 3) * 0.025, 0));
  const abrG = group(); shelf.remove(abr); shelf.remove(abrL); abrG.add(abr, abrL); shelf.add(abrG);
  let abrT = -1; anim((dt) => { if (abrT >= 0) { abrT += dt; const out = abrT < 0.6 ? abrT / 0.6 : (eng().blocked() || abrT < 1.5 ? 1 : Math.max(0, 1 - (abrT - 1.5) * 2)); abrG.position.z = out * 0.2; abrG.rotation.z = out * 0.08; if (out <= 0 && abrT > 1.5) { abrT = -1; abrG.position.z = 0; abrG.rotation.z = 0; } } });
  add(place(hs("regal", shelf, { act: { play: () => { abrT = 0; snd("paper"); return 650; } } }), "w", 0.26, 1.2, 0.17));
  // Sofa (roter Samt)
  // Samtsofa: Polster mit runden Kanten, Armrollen, Knöpfe in der Lehne, Holzzarge, gedrechselte Füße; feste Klickfläche
  const sofa = group(rbox(1.9, 0.16, 0.8, M.velvet, 0, 0.42, 0.02, 0.07), rbox(1.95, 0.62, 0.22, M.velvet, 0, 0.74, -0.33, 0.09),
    rbox(1.98, 0.14, 0.82, M.wood, 0, 0.27, 0, 0.03), box(2.1, 0.95, 0.9, ZONE, 0, 0.47, 0));
  [-1, 1].forEach((sx) => { const arm = cyl(0.13, 0.13, 0.8, M.velvet, sx * 0.98, 0.62, 0.0, 24); arm.rotation.x = Math.PI / 2; sofa.add(arm, rbox(0.18, 0.36, 0.78, M.velvet, sx * 0.98, 0.44, 0, 0.06)); });
  for (let i = 0; i < 5; i++) sofa.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.brassDark).translateX(-0.7 + i * 0.35).translateY(0.82).translateZ(-0.21));
  [[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.32], [0.85, 0.32]].forEach(([x, z]) => { const l = turnedLeg(0.2, 0.035, M.wood); l.position.set(x, 0, z); sofa.add(l); });
  const cushion = sofa.children[0];
  const tin = group(cyl(0.05, 0.05, 0.03, std(0x8a2a2a, { metalness: 0.6, roughness: 0.4 }), 0, 0, 0, 20), cyl(0.051, 0.051, 0.008, std(0xc9a466, { metalness: 0.8, roughness: 0.3 }), 0, 0.016, 0, 20)); tin.position.set(0.35, 0.36, 0.1); tin.visible = false; sofa.add(tin);
  let cushT = -1; anim((dt) => { if (cushT >= 0) { cushT += dt; const up = cushT < 0.5 ? cushT / 0.5 : (eng().blocked() || cushT < 1.5 ? 1 : Math.max(0, 1 - (cushT - 1.5) * 2)); cushion.position.y = 0.42 + up * 0.12; cushion.rotation.x = -up * 0.25; tin.visible = up > 0.2; if (up <= 0 && cushT > 1.5) { cushT = -1; } } });
  add(place(hs("sofa", sofa, { act: { play: () => { cushT = 0; return 600; } } }), "w", 0.3, 0, 0.6));
  // Porträt Viktor Lehn – als einziges Bild exakt gerade
  const portrait = group(ornateFrame(0.8, 1.0, lambert(0xffffff, { map: portraitTex() }), brassMat(0x9a7434, 0.38)), plane(0.26, 0.06, lambert(0xffffff, { map: plaqueTex("V. LEHN", 256, 60, "#d4bc90", "#3a2a18", "600 30px Georgia, serif", 4) }), 0, -0.6, 0.0));
  add(place(hs("portraet", portrait), "w", 0.6, 2.25, 0.03));
  // Ledersessel, auf den Eingang gerichtet
  // Ohrensessel: gepolsterte Teile mit runden Kanten, gedrechselte Füße
  const chair = group(rbox(0.82, 0.18, 0.76, M.leather, 0, 0.36, 0.02, 0.07), rbox(0.82, 0.78, 0.2, M.leather, 0, 0.82, -0.3, 0.08),
    rbox(0.15, 0.36, 0.76, M.leather, -0.42, 0.5, 0, 0.07), rbox(0.15, 0.36, 0.76, M.leather, 0.42, 0.5, 0, 0.07),
    rbox(0.2, 0.42, 0.1, M.leather, -0.36, 1.0, -0.22, 0.05), rbox(0.2, 0.42, 0.1, M.leather, 0.36, 1.0, -0.22, 0.05), rbox(0.78, 0.12, 0.7, M.wood, 0, 0.24, 0.02, 0.02));
  [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.32], [0.35, 0.32]].forEach(([x, z]) => { const l = turnedLeg(0.2, 0.035, M.wood); l.position.set(x, 0, z); chair.add(l); });
  chair.rotation.y = -0.9; // schaut zum Eingang (Süden)
  add(place(hs("sessel", chair), "w", 0.52, 0, 1.55)); // frei vor der Treppe, damit man unter sie leuchten kann
  // Beistelltisch mit Lampe
  // Beistelltisch (gedrechselt) mit kleiner Tischlampe
  const side = group(cyl(0.24, 0.24, 0.035, M.woodLight, 0, 0.62, 0, 32), turnedLeg(0.6, 0.05, M.wood), cyl(0.18, 0.2, 0.03, M.wood, 0, 0.015, 0, 24), tableLamp(0.42, 0x8a6a40));
  side.children[3].position.y = 0.64;
  add(place(side, "w", 0.46, 0, 0.55));
  const sideL = new THREE.PointLight(0xffa860, 1.6, 0, 2); place(sideL, "w", 0.46, 1.0, 0.55); add(sideL);
  // Treppe nach oben (steigt Richtung Norden), darunter stockdunkel
  const stair = new THREE.Group();
  const steps = 12, sx0 = -R + 2 * R * 0.72, sx1 = R, rise = H / steps, run = (sx1 - sx0) / steps;
  for (let i = 0; i < steps; i++) { stair.add(box(run + 0.02, 0.06, 1.2, M.woodLight, sx0 + run * (i + 0.5), rise * (i + 1) - 0.03, 0.6)); stair.add(box(0.03, rise, 1.2, M.wood, sx0 + run * i + 0.015, rise * (i + 0.5), 0.6)); }
  const stringer = new THREE.Shape(); stringer.moveTo(sx0, 0); stringer.lineTo(sx1, H); stringer.lineTo(sx1, H - 0.25); stringer.lineTo(sx0 + 0.2, 0); stringer.lineTo(sx0, 0);
  const sg = new THREE.Mesh(new THREE.ShapeGeometry(stringer), M.dark); sg.position.z = 1.2; stair.add(sg);
  const rail = box(Math.hypot(sx1 - sx0, H), 0.05, 0.05, M.woodLight, (sx0 + sx1) / 2, H / 2 + 0.9, 1.22); rail.rotation.z = Math.atan2(H, sx1 - sx0); stair.add(rail);
  // Hohlraum unter der Treppe: ohne Licht schwarz, mit Taschenlampe beleuchtbar
  const cavLit = lambert(0x2a2219), cavDark = basic(0x020202);
  const cavBack = plane(sx1 - sx0, H, cavDark, (sx0 + sx1) / 2, H / 2, 0.01);
  const cavFloor = plane(sx1 - sx0, 1.2, cavDark, (sx0 + sx1) / 2, 0.004, 0.6); cavFloor.rotation.x = -Math.PI / 2;
  const under = new THREE.Shape(); under.moveTo(sx0, 0); under.lineTo(sx1, H - 0.3); under.lineTo(sx1, 0); under.lineTo(sx0, 0);
  const shadow = new THREE.Mesh(new THREE.ShapeGeometry(under), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.94, depthWrite: false }));
  shadow.position.z = 1.19; stair.add(cavBack, cavFloor, shadow);
  const cornerZone = box(sx1 - sx0, 1.4, 1.2, ZONE, (sx0 + sx1) / 2, 0.7, 0.6); stair.add(cornerZone);
  hs("ecke", cornerZone);
  // Schraubendreher (nur im Lichtkegel)
  // gut sichtbar, sobald der Lichtkegel darauf fällt: roter Griff, blanker Schaft, kleiner Glanzpunkt
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), basic(0xffffff));
  const sd = group(cyl(0.03, 0.03, 0.2, lambert(0xd0281a, { emissive: 0x2a0604 }), 0, 0, 0), cyl(0.009, 0.009, 0.24, phong(0xdfe3e8, { shininess: 120, specular: 0xffffff }), 0, 0.22, 0), glint);
  glint.position.set(0, 0.3, 0.01);
  sd.rotation.set(0, 0.5, Math.PI / 2); sd.position.set(sx0 + 1.0, 0.032, 0.85); stair.add(sd);
  sd.add(box(0.16, 0.5, 0.16, ZONE, 0, 0.12, 0));
  anim((dt, t) => { glint.scale.setScalar(0.7 + Math.abs(Math.sin(t * 2.2)) * 0.8); });
  hs("schraubendreher", sd, { hideWhenHidden: true });
  place(stair, "w", 0.5, 0, 0); add(stair);
  state((has, light) => {
    cavBack.material = cavFloor.material = light ? cavLit : cavDark;
    shadow.visible = !light; // ohne Licht: tiefschwarz, mit Taschenlampe sieht man hinein
  });

  // Hinweis auf den Spieler: ruhiges Atmen der Hängeleuchte (Sturm)
  anim((dt, t) => { pendLight.intensity = 7 + Math.sin(t * 0.7) * 0.3; });
  return { eye: [0, 1.62, 0.2], hd: true, R, H, env: 0.35 };
});
ready(); // läuft das Spiel schon, sofort auf 3D umschalten
