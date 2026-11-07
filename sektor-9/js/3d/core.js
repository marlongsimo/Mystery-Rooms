/*
 * SEKTOR 9 – 3D-Ansicht (three.js), Grundlage: Kern aus Hotel Nocturne, erweitert um Standpunkte.
 *
 * Reine Darstellungsschicht: Die Engine (js/engine.js) bleibt die einzige Wahrheit.
 * Eine Halle (defineRoom) ist eine durchgehende Szene mit mehreren Standpunkten (eyes). Wechselt die Engine den
 * Standpunkt in derselben Halle, gleitet die Kamera dorthin, ohne neu zu laden.
 * Jedes anklickbare Objekt ist an eine oder mehrere Hotspot-IDs gebunden; ein Klick ruft N.engine.hotspot(id).
 *
 * Bedienung: Ziehen (Maus/Finger) = umsehen · Klick/Tippen = untersuchen · Mausrad/zwei Finger = Zoom.
 * Die Pfeile ‹ › drehen um 90° (= die vier Blickrichtungen der Raumdatei).
 */
import * as THREE from "../../../platform/vendor/three-0.170.0/three.module.min.js";
import * as GFX from "./gfx.js?v=1";

const N = window.SEKTOR9;
const E = () => N.engine;
const BUILDERS = {};
export { THREE };
export function defineRoom(id, build) { BUILDERS[id] = build; }

/* ---------- Hilfen für Raumdateien ---------- */
export function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
export const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
export const phong = (color, o = {}) => new THREE.MeshPhongMaterial({ color, shininess: 50, specular: 0x6a5a3a, ...o });
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
export const ZONE = new THREE.MeshBasicMaterial({ visible: false }); // unsichtbare Klickfläche
export function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); return m; }
export function plane(w, h, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); return m; }
export function group(...children) { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; }

/** Wand (Breite w, Höhe h) mit rechteckigen/runden Öffnungen. Lokale Koordinaten: x −w/2…w/2, y 0…h, Vorderseite +z. */
export function wallMesh(w, h, holes, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  holes.forEach((o) => {
    const p = new THREE.Path();
    if (o.arch) { const r = o.w / 2; p.moveTo(o.x - r, o.y); p.lineTo(o.x + r, o.y); p.lineTo(o.x + r, o.y + o.h - r); p.absarc(o.x, o.y + o.h - r, r, 0, Math.PI, false); p.lineTo(o.x - r, o.y); }
    else { p.moveTo(o.x - o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y); }
    s.holes.push(p);
  });
  return new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
}

/* Wände eines quadratischen Raums (Kantenlänge 2·R): Objekte werden „auf die Nordwand“ gebaut
   (Vorderseite +z) und mit place() an die richtige Wand gedreht. u = 0…1 von links nach rechts,
   wie man vor der Wand steht (entspricht x in den 2D-Ansichten), y = Höhe, d = Abstand von der Wand. */
export function walls(R) {
  const W = {
    n: { o: [0, -R], r: [1, 0], i: [0, 1], rot: 0 },
    e: { o: [R, 0], r: [0, 1], i: [-1, 0], rot: -Math.PI / 2 },
    s: { o: [0, R], r: [-1, 0], i: [0, -1], rot: Math.PI },
    w: { o: [-R, 0], r: [0, -1], i: [1, 0], rot: Math.PI / 2 },
  };
  const place = (obj, wall, u, y = 0, d = 0) => {
    const k = W[wall], lx = -R + 2 * R * u;
    obj.position.set(k.o[0] + lx * k.r[0] + d * k.i[0], y, k.o[1] + lx * k.r[1] + d * k.i[1]);
    obj.rotation.y += k.rot;
    return obj;
  };
  return { place, W };
}

/* ---------- Zustand der Ansicht ---------- */
let renderer = null, webgl = true, scene = null, camera = null, canvas = null, wrap = null, tip = null, hintEl = null;
let built = null, roomId = null, stationId = null, glide = null, lastIndex = null, running = false, fx = null, dustP = null;
let yaw = 0, pitch = -0.04, targetYaw = null, fov = 68;
let flash = null, flashTarget = null, flashAim = new THREE.Vector2(0, 0), boltLight = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const clock = new THREE.Clock();
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

function init() {
  if (renderer || !webgl) return Boolean(renderer);
  try {
    canvas = document.createElement("canvas");
    canvas.className = "n3d";
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) { webgl = false; renderer = null; return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch() ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (GFX.Q.level === "low") renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  camera = new THREE.PerspectiveCamera(fov, 4 / 3, 0.05, 40);
  wrap = document.createElement("div"); wrap.className = "n3d-wrap"; wrap.appendChild(canvas);
  tip = document.createElement("div"); tip.className = "n3d-tip"; wrap.appendChild(tip);
  hintEl = document.createElement("div"); hintEl.className = "n3d-hint";
  hintEl.innerHTML = isTouch() ? "Wischen zum Umsehen · Antippen zum Untersuchen" : "Ziehen zum Umsehen · Klicken zum Untersuchen · Mausrad: Zoom";
  wrap.appendChild(hintEl); setTimeout(() => hintEl.classList.add("gone"), 9000);
  focusUI = document.createElement("div"); focusUI.className = "n3d-focus";
  focusUI.innerHTML = `<button type="button" data-f="back">‹ Zurück</button><span class="n3d-focus-hint"></span><button type="button" data-f="classic" title="Rätsel im gewohnten Fenster lösen">Klassisch lösen</button>`;
  focusUI.addEventListener("click", (ev) => { const b = ev.target.closest("[data-f]"); if (!b || !focus) return; const id = focus.id; exitFocus(); if (b.dataset.f === "classic") E().hotspot(id); });
  wrap.appendChild(focusUI);
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && focus && !E().blocked()) exitFocus(); });
  bindInput();
  new ResizeObserver(resize).observe(wrap);
  // Blitz der Engine (body.flash) auch im 3D-Raum
  new MutationObserver(() => { if (document.body.classList.contains("flash") && boltLight) boltLight.intensity = 9; }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  return true;
}
function resize() {
  if (!wrap || !renderer) return;
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (fx) fx.comp.setSize(w, h);
}

/* ---------- Raum aufbauen ---------- */
function buildRoom(r) {
  if (scene) scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; [].concat(m || []).forEach((x) => { if (x.map) x.map.dispose(); x.dispose && x.dispose(); }); });
  scene = new THREE.Scene();
  scene.add(camera);
  const pick = [], states = [], anims = [];
  const ctx = {
    THREE, scene,
    add: (...o) => o.forEach((x) => scene.add(x)),
    /** Objekt an Hotspot-IDs binden. ids: Reihenfolge = Vorrang, falls mehrere gleichzeitig sichtbar sind. */
    hs(ids, obj, opts = {}) { const e = { ids: [].concat(ids), obj, ...opts }; obj.userData.owner = e; obj.traverse((m) => { if (m.isMesh) m.userData.owner = e; }); pick.push(e); return obj; },
    /** Zusätzliche Bedienung ohne Hotspot (z. B. Schubladen): reine Optik. */
    prop(label, obj, onClick) { const e = { ids: [], label, onClick, obj }; obj.userData.owner = e; obj.traverse((m) => { if (m.isMesh) m.userData.owner = e; }); pick.push(e); return obj; },
    /** fn(has, light) – wird bei jeder Zustandsänderung aufgerufen (Türen, sichtbare Gegenstände …). */
    state: (fn) => states.push(fn),
    /** fn(dt, t) – jedes Bild (Animationen, Flackern, Regen). */
    anim: (fn) => anims.push(fn),
    lerp: (cur, to, k) => cur + (to - cur) * k,
    /** GLB aus assets/3d/models (siehe gfx.model); Rückgabe sofort, Inhalt kommt nach dem Laden. */
    model: GFX.model, tag: GFX.tag, quality: GFX.Q,
    /** Bildschirmpunkt eines Objekts oder Weltpunkts (für Drehgesten um eine Schraube, einen Schlüssel …). */
    screenOf(o) { const v = o.isVector3 ? o.clone() : o.getWorldPosition(new THREE.Vector3()); v.project(camera); const rc = canvas.getBoundingClientRect(); return { x: rc.left + (v.x + 1) / 2 * rc.width, y: rc.top + (1 - v.y) / 2 * rc.height }; },
    engine: () => E(), sound: (n) => N.audio && N.audio.play && N.audio.play(n),
  };
  // Grundlicht, Taschenlampe, Blitz
  scene.add(new THREE.HemisphereLight(0x6a7890, 0x221810, 1.1));
  flash = new THREE.SpotLight(0xfff0d0, 0, 12, 0.42, 0.5, 1.2);
  flashTarget = new THREE.Object3D(); flashTarget.position.set(0, 0, -1);
  camera.add(flash); camera.add(flashTarget); flash.position.set(0, -0.05, 0); flash.target = flashTarget;
  boltLight = new THREE.DirectionalLight(0xbcd2ff, 0); boltLight.position.set(0, 3, 6); scene.add(boltLight);
  const b = BUILDERS[r.id](ctx);
  built = { pick, states, anims, eyes: (b && b.eyes) || { main: (b && b.eye) || [0, 1.6, 0] }, eye: null, markers: null, hd: Boolean(b && b.hd) };
  built.eye = (built.eyes[r.station] || Object.values(built.eyes)[0]).slice();
  fx = null; dustP = null;
  if (built.hd) { // Grafikstufe HD (Rezeption, Zimmer 217): PBR, Umgebung, Schatten, Leuchten, Staub
    GFX.prepareScene(scene);
    GFX.setupFlashlight(flash);
    const sc = scene; GFX.environment(renderer).then((env) => { if (env && sc === scene) { sc.environment = env; sc.environmentIntensity = (b && b.env) ?? 0.35; } });
    if (GFX.Q.level !== "low") { dustP = GFX.dust((b && b.R) || 3, (b && b.H) || 3); scene.add(dustP); }
    fx = GFX.composer(renderer, scene, camera); resize();
  }
  camera.position.set(...built.eye);
  roomId = r.id; stationId = r.station || null; glide = null;
}
/** Standpunkt in derselben Halle wechseln: Kamera gleitet (leicht angehoben) zum neuen Augenpunkt. */
function moveTo(station, yawTo) {
  const to = built.eyes[station]; if (!to) return;
  stationId = station; built.eye = to.slice();
  glide = { from: camera.position.clone(), to: new THREE.Vector3(...to), t: 0, dur: Math.min(2.6, 0.9 + camera.position.distanceTo(new THREE.Vector3(...to)) * 0.16) };
  if (yawTo !== undefined) { let y = yawTo; while (y - yaw > Math.PI) y -= 2 * Math.PI; while (yaw - y > Math.PI) y += 2 * Math.PI; targetYaw = y; }
}

/* ---------- Auswahl (Raycasting) ---------- */
function ownerVisible(e) {
  if (e.onClick) return true;
  return e.ids.some((id) => E().isVisible(id));
}
function shown(o) { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; }
function hitAt(cx, cy) {
  if (!built) return null;
  const rc = canvas.getBoundingClientRect();
  ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(built.pick.map((e) => e.obj), true);
  for (const h of hits) {
    if (!shown(h.object)) continue;
    let o = h.object; while (o && !o.userData.owner) o = o.parent; // Modelle: Besitzer sitzt an der Gruppe
    const e = o && o.userData.owner; if (!e) continue;
    if (e.onClick) return { e };
    const id = e.ids.find((x) => E().isVisible(x));
    if (id) return { e, id };
    if (e.solid) return null; // verdeckt alles dahinter
  }
  return null;
}
export function pickAt(cx, cy) { const h = hitAt(cx, cy); return h && h.id ? h.id : null; }
function activate(cx, cy) {
  if (focus && !focus.leaving) { focusTap(cx, cy); return; }
  if (focus) endFocus(); // Klick während der Rückfahrt: sofort zurück und normal weiter
  const h = hitAt(cx, cy);
  if (!h) return;
  if (h.e.onClick) { h.e.onClick(); return; }
  hideHint();
  // Direkt bedienbares Objekt: Kamera fährt heran. Ohne Gegenstand (Zahlenschloss …) oder mit dem passenden (focus.useItem:
  // Schraubendreher an der Abdeckung, Schlüssel im Schalter). Ein falscher Gegenstand geht wie bisher an die Engine („passt nicht“).
  const sel = E().selectedItem(), fo = h.e.focus;
  if (fo && (sel ? fo.useItem === sel : !fo.useItem) && fo.when(h.id)) { enterFocus(h.e, h.id); return; }
  // „Erst handeln, dann lesen“: kurze Animation (Taste drücken, Matte anheben …), danach der gewohnte Text/Dialog der Engine
  if (h.e.act && !sel && (!h.e.act.when || h.e.act.when(h.id))) {
    if (actBusy) return; actBusy = true;
    const ms = h.e.act.play(h.id); const id = h.id;
    setTimeout(() => { actBusy = false; if (built) E().hotspot(id); }, ms ?? 700);
    return;
  }
  E().hotspot(h.id);
}

/* ---------- Nahansicht: Rätsel direkt am Objekt bedienen ----------
   hs(ids, obj, { focus: { when(id), cam:[x,y,z], center:[x,y,z] (lokal zum Objekt), fov, hint, parts: () => [{ obj, tap(hit), drag(dx, dy), release() }],
   enter(), exit() } }). Tippen/Ziehen wirkt in der Nahansicht nur auf die Teile, nicht auf den Raum. Der Dialog bleibt als „Klassisch lösen“. */
let focus = null, focusUI = null, actBusy = false;
function focusParts() { return focus ? focus.parts : []; }
function partAt(cx, cy) {
  const rc = canvas.getBoundingClientRect();
  ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const ps = focusParts(); if (!ps.length) return null;
  const hits = ray.intersectObjects(ps.map((p) => p.obj), true);
  for (const h of hits) { let o = h.object; while (o && !o.userData.part) o = o.parent; if (o && shown(o)) return { part: o.userData.part, hit: h }; }
  return null;
}
function focusTap(cx, cy) {
  const r = partAt(cx, cy); if (!r || !r.part.tap) return;
  // „über/unter der Achse“ nach Bildschirmposition (unabhängig vom Blickwinkel)
  const rc = canvas.getBoundingClientRect(), o = r.part.obj.getWorldPosition(new THREE.Vector3()).project(camera);
  r.part.tap(r.hit, { above: cy < rc.top + (1 - o.y) / 2 * rc.height });
}
function enterFocus(e, id) {
  const sp = e.focus; e.obj.updateMatrixWorld(true);
  const parts = sp.parts ? sp.parts() : [];
  parts.forEach((p) => { p.obj.userData.part = p; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
  focus = { e, id, sp, parts, camPos: e.obj.localToWorld(new THREE.Vector3(...(sp.cam || [0, 0, 0.6]))), look: e.obj.localToWorld(new THREE.Vector3(...(sp.center || [0, 0, 0]))),
    curLook: camera.position.clone().add(fwd.multiplyScalar(2)), fov0: fov, fov: sp.fov || 50, leaving: false, exitTimer: null };
  hideTip(); hideHint(); targetYaw = null;
  if (focusUI) { focusUI.querySelector(".n3d-focus-hint").textContent = sp.hint || ""; focusUI.classList.add("show"); }
  if (sp.enter) sp.enter();
}
function exitFocus(immediate = false) {
  if (!focus || focus.leaving) { if (immediate && focus) endFocus(); return; }
  clearTimeout(focus.exitTimer);
  focus.leaving = true;
  focus.back = camera.position.clone().set(...built.eye).add(new THREE.Vector3(0, 0, -2).applyEuler(new THREE.Euler(pitch, yaw, 0, "YXZ")));
  if (focusUI) focusUI.classList.remove("show");
  if (focus.sp.exit) focus.sp.exit();
  if (immediate) endFocus();
}
function endFocus() { if (!focus) return; focus.parts.forEach((p) => { delete p.obj.userData.part; }); fov = focus.fov0; focus = null; camera.position.set(...built.eye); camera.rotation.set(pitch, yaw, 0, "YXZ"); camera.fov = fov; camera.updateProjectionMatrix(); if (focusUI) focusUI.classList.remove("show"); }
function focusCamera(dt) {
  const k = Math.min(1, dt * 5);
  const toPos = focus.leaving ? new THREE.Vector3(...built.eye) : focus.camPos, toLook = focus.leaving ? focus.back : focus.look, toFov = focus.leaving ? focus.fov0 : focus.fov;
  camera.position.lerp(toPos, k); focus.curLook.lerp(toLook, k); camera.lookAt(focus.curLook);
  camera.fov += (toFov - camera.fov) * k; camera.updateProjectionMatrix();
  if (focus.leaving && camera.position.distanceTo(toPos) < 0.02) endFocus();
}

/* ---------- Eingabe: Ziehen = umsehen, Tippen = untersuchen ---------- */
const ptrs = new Map();
let drag = null, pinch0 = null;
function bindInput() {
  canvas.addEventListener("pointerdown", (e) => {
    if (cine) return; // Intro läuft: Kamera gehört dem Drehbuch
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), fov }; drag = null; return; }
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 };
    if (focus) { const r = partAt(e.clientX, e.clientY); drag.part = r && r.part.drag ? r.part : null; } // Nahansicht: Teil greifen statt umsehen
    targetYaw = null;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch0 && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; setFov(pinch0.fov * pinch0.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y))); return; }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (focus) { if (drag.part) drag.part.drag(dx, dy, { x: e.clientX, y: e.clientY }); return; } // in der Nahansicht dreht sich der Raum nicht
      const k = (e.pointerType === "touch" ? 0.0062 : 0.0045) * fov / 68;
      yaw += dx * k; pitch = Math.max(-1.05, Math.min(1.0, pitch + dy * k));
      if (drag.moved > 8) { hideTip(); hideHint(); }
      return;
    }
    if (e.pointerType === "mouse" && !cine) hover(e.clientX, e.clientY);
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (!drag) return;
    const d = drag; drag = null;
    if (d.part && d.part.release) d.part.release(d.moved >= 8);
    if (d.moved < 8 && performance.now() - d.t < (focus ? 2000 : 700)) activate(e.clientX, e.clientY); // Nahansicht: großzügiger (Rollen antippen)
    syncView();
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); drag = null; pinch0 = null; });
  canvas.addEventListener("pointerleave", () => { if (!drag) hideTip(); });
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); if (cine || focus) return; setFov(fov * (e.deltaY > 0 ? 1.07 : 0.93)); }, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
function setFov(v) { fov = Math.max(34, Math.min(80, v)); camera.fov = fov; camera.updateProjectionMatrix(); }
function hover(cx, cy) {
  if (focus) { const r = partAt(cx, cy); canvas.style.cursor = r ? (r.part.drag ? "ns-resize" : "pointer") : "default"; hideTip(); return; }
  const rc = canvas.getBoundingClientRect();
  flashAim.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1);
  const h = hitAt(cx, cy);
  if (!h) { hideTip(); canvas.style.cursor = "grab"; return; }
  const sel = E().selectedItem(), it = sel && N.items[sel], d = h.e.onClick ? null : E().hotspotData(h.id) || {};
  const label = h.e.onClick ? h.e.label : (d.go ? "→ " : "") + (d.label || "");
  tip.textContent = it && !h.e.onClick ? `${it.name} benutzen: ${d.label || ""}` : label;
  tip.style.left = cx - rc.left + "px"; tip.style.top = cy - rc.top + "px";
  tip.classList.add("show"); canvas.style.cursor = "pointer";
}
const hideTip = () => tip && tip.classList.remove("show");
const hideHint = () => hintEl && hintEl.classList.add("gone");

/* Blickrichtung ↔ die vier Ansichten der Raumdatei (0 Nord, 1 Ost, 2 Süd, 3 West) */
const yawOf = (i) => -i * Math.PI / 2;
const sector = () => (((Math.round(-yaw / (Math.PI / 2))) % 4) + 4) % 4;
function syncView() { const i = sector(); if (i !== lastIndex) { lastIndex = i; E().setView(i); } }

/* ---------- Bildschleife ---------- */
function frame() {
  if (!running) return;
  if (paused || !canvas.isConnected) { running = false; return; }
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (cine) cine.update(dt, t); // Intro: Kamera, Taschenlampe und Licht kommen aus dem Drehbuch
  else {
    if (focus) focusCamera(dt);
    else {
      if (glide) { // Fahrt zum neuen Standpunkt (sanft an- und auslaufen, kleiner Bogen nach oben)
        glide.t += dt / glide.dur; const k = Math.min(1, glide.t), e = k * k * (3 - 2 * k);
        camera.position.lerpVectors(glide.from, glide.to, e); camera.position.y += Math.sin(e * Math.PI) * 0.25;
        if (k >= 1) { camera.position.copy(glide.to); glide = null; }
      }
      if (targetYaw !== null) {
        const d = targetYaw - yaw; yaw += d * Math.min(1, dt * 7);
        if (Math.abs(d) < 0.002) { yaw = targetYaw; targetYaw = null; }
      }
      camera.rotation.set(pitch, yaw, 0, "YXZ");
    }
    // Taschenlampe: am Computer folgt sie der Maus, am Handy zeigt sie geradeaus
    const L = E().isLight();
    flash.intensity += ((L ? 40 : 0) - flash.intensity) * Math.min(1, dt * 10);
    const aim = isTouch() ? new THREE.Vector2(0, 0) : flashAim;
    flashTarget.position.set(aim.x * Math.tan(camera.fov * Math.PI / 360) * camera.aspect, aim.y * Math.tan(camera.fov * Math.PI / 360), -1);
  }
  if (boltLight.intensity > 0) boltLight.intensity = Math.max(0, boltLight.intensity - dt * 22);
  built.anims.forEach((fn) => fn(dt, t));
  if (dustP) dustP.userData.tick(dt, t);
  if (fx) { fx.vg.uniforms.uTime.value = t % 10; fx.comp.render(dt); GFX.watchPerformance(dt, lowerQuality); }
  else renderer.render(scene, camera);
}
/** Zu langsam? Erst Leuchten und Punktschatten aus, dann alle Schatten, Staub und höhere Auflösung. */
function lowerQuality(level) {
  console.info("[Sektor 9 3D] Qualität reduziert auf", level);
  scene.traverse((o) => { if (o.isLight && o !== flash) o.castShadow = false; if (o.isMesh) o.castShadow = false; });
  if (level === "low") { if (fx && fx.bloom) fx.bloom.enabled = false; flash.castShadow = false; renderer.setPixelRatio(1); if (dustP) dustP.visible = false; resize(); }
}
/* Mitspieler: farbige Helmlampe am Standpunkt (für den Mehrspieler-Modus; players = [{ id, color, station }]) */
const others = new Map();
function setPlayers(players) {
  if (!scene || !built) return;
  const seen = new Set();
  (players || []).forEach((p) => {
    const at = built.eyes[p.station]; if (!at) return; seen.add(p.id);
    let o = others.get(p.id);
    if (!o || o.parent !== scene) { o = new THREE.Group(); o.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: p.color, toneMapped: false })), new THREE.PointLight(p.color, 1.2, 3, 2)); scene.add(o); others.set(p.id, o); }
    o.position.set(at[0] + 0.35, at[1] + 0.05, at[2]);
  });
  others.forEach((o, id) => { if (!seen.has(id)) { scene.remove(o); others.delete(id); } });
}
let paused = false; // z. B. während ein Gegenstand groß angesehen wird (inspect.js): Raumbild anhalten, spart Leistung
function setPaused(v) { paused = Boolean(v); if (!paused && canvas && canvas.isConnected) startLoop(); }
function startLoop() { if (running || paused) return; running = true; clock.getDelta(); requestAnimationFrame(frame); }
document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else if (canvas && canvas.isConnected) startLoop(); });

/* ---------- Schnittstelle für die Engine ---------- */
function applyState() {
  const has = (f) => E().has(f), L = E().isLight();
  if (focus && !focus.leaving && !focus.exitTimer && !focus.sp.when(focus.id)) focus.exitTimer = setTimeout(() => exitFocus(), focus.sp.exitDelay ?? 1400); // gelöst → zurück
  built.states.forEach((fn) => fn(has, L));
  built.pick.forEach((e) => { if (e.hideWhenHidden) e.obj.visible = e.ids.some((id) => E().isVisible(id)); });
  // Hotspot-Hilfe (Menü „Hotspots anzeigen“): kleine Leuchtpunkte
  const on = document.querySelector("#scene").classList.contains("show-hotspots");
  if (on && !built.markers) {
    built.markers = built.pick.filter((e) => e.ids.length).map((e) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.85, depthTest: false }));
      const bx = new THREE.Box3().setFromObject(e.obj); bx.getCenter(s.position); s.scale.set(0.08, 0.08, 0.08); s.userData.e = e; scene.add(s); return s;
    });
  }
  if (built.markers) built.markers.forEach((s) => { s.visible = on && ownerVisible(s.userData.e) && shown(s.userData.e.obj); });
}
/** r = { id: Halle, station: Standpunkt }, i = Blickrichtung 0–3 */
function render(stage, r, i) {
  if (cine) return; // während des Intros nicht umhängen
  if (!init()) return;
  if (!wrap.isConnected || wrap.parentNode !== stage) { stage.innerHTML = ""; stage.appendChild(wrap); }
  if (focus && (roomId !== r.id || i !== lastIndex || (r.station && r.station !== stationId))) exitFocus(true);
  if (roomId !== r.id || (r.station && r.station !== stationId)) hideTip();
  if (roomId !== r.id) { buildRoom(r); yaw = yawOf(i); pitch = -0.04; targetYaw = null; lastIndex = i; }
  else if (r.station && r.station !== stationId) { lastIndex = i; moveTo(r.station, yawOf(i)); }
  else if (i !== lastIndex) { // ‹ › oder Tastatur: sanft auf die neue Ansicht drehen (kürzester Weg)
    lastIndex = i;
    if (sector() !== i) { let to = yawOf(i); while (to - yaw > Math.PI) to -= 2 * Math.PI; while (yaw - to > Math.PI) to += 2 * Math.PI; targetYaw = to; }
  }
  applyState();
  resize();
  startLoop();
}
function supports(r) { return Boolean(BUILDERS[r.id]) && webgl && (renderer || init()); }

/** Für automatische Tests: Kamera auf das Objekt eines Hotspots richten, Bildschirmpunkt zurückgeben. */
function aimAt(id) {
  if (!built) return null;
  if (focus && focus.leaving) endFocus(); // Rückfahrt abschließen, sonst passt der Bildschirmpunkt nicht zur Kamera
  const e = built.pick.find((x) => x.ids.includes(id) || x.label === id); if (!e) return null;
  const c = e.aimLocal ? e.obj.localToWorld(new THREE.Vector3(...e.aimLocal)) : new THREE.Box3().setFromObject(e.obj).getCenter(new THREE.Vector3());
  const d = c.clone().sub(camera.position);
  yaw = Math.atan2(-d.x, -d.z); pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); targetYaw = null;
  camera.rotation.set(pitch, yaw, 0, "YXZ"); camera.updateMatrixWorld();
  const p = c.clone().project(camera), rc = canvas.getBoundingClientRect();
  return { x: rc.left + (p.x + 1) / 2 * rc.width, y: rc.top + (1 - p.y) / 2 * rc.height };
}
/** Fehlersuche/Leistung: Umfang der Szene (sichtbare Objekte, Dreiecke, Lichter, Schatten), Texturspeicher grob. */
function sceneStats() {
  if (!scene) return {};
  let meshes = 0, tris = 0, lights = 0, shadowLights = 0; const mats = new Set(), tex = new Set();
  scene.traverse((o) => {
    if (o.isMesh && o.visible) { meshes++; const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0); [].concat(o.material).forEach((m) => { mats.add(m); ["map", "normalMap"].forEach((k) => m[k] && tex.add(m[k])); }); }
    if (o.isLight && o.visible && o.intensity > 0) { lights++; if (o.castShadow) shadowLights++; }
  });
  let texMB = 0; tex.forEach((t) => { const im = t.image; if (im && im.width) texMB += (im.width * im.height * 4 * 1.33) / 1048576; });
  return { meshes, tris: Math.round(tris), lights, shadowLights, materials: mats.size, textures: tex.size, texMB: Math.round(texMB), quality: GFX.Q.level, px: renderer ? renderer.getPixelRatio() : 0 };
}
/** Fehlersuche: alle Treffer eines Strahls (Besitzer-IDs, sichtbar?, Abstand). */
function debugHits(cx, cy) {
  if (!built) return [];
  const rc = canvas.getBoundingClientRect(); ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  return ray.intersectObjects(built.pick.map((e) => e.obj), true).slice(0, 6).map((h) => { let o = h.object; while (o && !o.userData.owner) o = o.parent; const e = o && o.userData.owner; return `${e ? e.ids.join("/") : "?"}${shown(h.object) ? "" : "(versteckt)"}@${h.distance.toFixed(2)}`; });
}
/** Für Tests: Nahansicht und Bildschirmpunkte ihrer Teile. */
function focusInfo() {
  if (!focus) return null; const rc = canvas.getBoundingClientRect();
  return { id: focus.id, leaving: focus.leaving, arrived: camera.position.distanceTo(focus.camPos) < 0.01, value: focus.sp.value ? focus.sp.value() : null, parts: focus.parts.map((p) => { const c = new THREE.Box3().setFromObject(p.obj).getCenter(new THREE.Vector3()).project(camera); return { name: p.name || "", x: rc.left + (c.x + 1) / 2 * rc.width, y: rc.top + (1 - c.y) / 2 * rc.height }; }) };
}
N.view3d = { setPlayers, supports, render, pickAt, aimAt, gliding: () => Boolean(glide), station: () => stationId, camPos: () => camera ? camera.position.toArray() : null, debugHits, focusInfo, focusExit: () => exitFocus(), pause: setPaused, sync: () => syncView(), quality: () => GFX.Q.level, modelsReady: GFX.modelsReady, info: () => ({ hd: Boolean(built && built.hd), bloom: Boolean(fx && fx.bloom && fx.bloom.enabled), shadows: Boolean(flash && flash.castShadow), env: Boolean(scene && scene.environment), calls: renderer ? renderer.info.render.calls : 0, triangles: renderer ? renderer.info.render.triangles : 0, ...sceneStats() }) };
let cine = null; // Kamerafahrten (Intro/Finale) folgen später
export function ready() { if (N.engine && N.engine.refresh) N.engine.refresh(); }
