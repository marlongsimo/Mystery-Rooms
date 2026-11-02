/*
 * HOTEL NOCTURNE – 3D-Ansicht (Testmodus, three.js)
 *
 * Reine Darstellungsschicht: Die Engine (js/engine.js) bleibt die einzige Wahrheit.
 * Ein Raum mit 3D-Daten (defineRoom) wird statt der SVG-Bühne als 360°-Raum gezeichnet.
 * Jedes anklickbare Objekt ist an eine oder mehrere Hotspot-IDs der Raumdatei gebunden;
 * ein Klick ruft N.engine.hotspot(id) – Inventar, Rätsel, Dokumente, Raumwechsel laufen wie in 2D.
 *
 * Bedienung: Ziehen (Maus/Finger) = umsehen · Klick/Tippen = untersuchen · Mausrad/zwei Finger = Zoom.
 * Die Pfeile ‹ › drehen um 90° (= die vier Blickrichtungen der Raumdatei).
 */
import * as THREE from "../../../platform/vendor/three-0.170.0/three.module.min.js";

const N = window.NOCTURNE;
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
let built = null, roomId = null, lastIndex = null, running = false;
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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  camera = new THREE.PerspectiveCamera(fov, 4 / 3, 0.05, 40);
  wrap = document.createElement("div"); wrap.className = "n3d-wrap"; wrap.appendChild(canvas);
  tip = document.createElement("div"); tip.className = "n3d-tip"; wrap.appendChild(tip);
  hintEl = document.createElement("div"); hintEl.className = "n3d-hint";
  hintEl.innerHTML = isTouch() ? "Wischen zum Umsehen · Antippen zum Untersuchen" : "Ziehen zum Umsehen · Klicken zum Untersuchen · Mausrad: Zoom";
  wrap.appendChild(hintEl); setTimeout(() => hintEl.classList.add("gone"), 9000);
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
    hs(ids, obj, opts = {}) { const e = { ids: [].concat(ids), obj, ...opts }; obj.traverse((m) => { if (m.isMesh) m.userData.owner = e; }); pick.push(e); return obj; },
    /** Zusätzliche Bedienung ohne Hotspot (z. B. Schubladen): reine Optik. */
    prop(label, obj, onClick) { const e = { ids: [], label, onClick, obj }; obj.traverse((m) => { if (m.isMesh) m.userData.owner = e; }); pick.push(e); return obj; },
    /** fn(has, light) – wird bei jeder Zustandsänderung aufgerufen (Türen, sichtbare Gegenstände …). */
    state: (fn) => states.push(fn),
    /** fn(dt, t) – jedes Bild (Animationen, Flackern, Regen). */
    anim: (fn) => anims.push(fn),
    lerp: (cur, to, k) => cur + (to - cur) * k,
  };
  // Grundlicht, Taschenlampe, Blitz
  scene.add(new THREE.HemisphereLight(0x6a7890, 0x221810, 1.1));
  flash = new THREE.SpotLight(0xfff0d0, 0, 12, 0.42, 0.5, 1.2);
  flashTarget = new THREE.Object3D(); flashTarget.position.set(0, 0, -1);
  camera.add(flash); camera.add(flashTarget); flash.position.set(0, -0.05, 0); flash.target = flashTarget;
  boltLight = new THREE.DirectionalLight(0xbcd2ff, 0); boltLight.position.set(0, 3, 6); scene.add(boltLight);
  const b = BUILDERS[r.id](ctx);
  built = { pick, states, anims, eye: (b && b.eye) || [0, 1.6, 0], markers: null };
  camera.position.set(...built.eye);
  roomId = r.id;
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
    const e = h.object.userData.owner; if (!e) continue;
    if (e.onClick) return { e };
    const id = e.ids.find((x) => E().isVisible(x));
    if (id) return { e, id };
    if (e.solid) return null; // verdeckt alles dahinter
  }
  return null;
}
export function pickAt(cx, cy) { const h = hitAt(cx, cy); return h && h.id ? h.id : null; }
function activate(cx, cy) {
  const h = hitAt(cx, cy);
  if (!h) return;
  if (h.e.onClick) { h.e.onClick(); return; }
  hideHint();
  E().hotspot(h.id);
}

/* ---------- Eingabe: Ziehen = umsehen, Tippen = untersuchen ---------- */
const ptrs = new Map();
let drag = null, pinch0 = null;
function bindInput() {
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), fov }; drag = null; return; }
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 };
    targetYaw = null;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch0 && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; setFov(pinch0.fov * pinch0.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y))); return; }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      const k = (e.pointerType === "touch" ? 0.0062 : 0.0045) * fov / 68;
      yaw += dx * k; pitch = Math.max(-1.05, Math.min(1.0, pitch + dy * k));
      if (drag.moved > 8) { hideTip(); hideHint(); }
      return;
    }
    if (e.pointerType === "mouse") hover(e.clientX, e.clientY);
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved < 8 && performance.now() - d.t < 700) activate(e.clientX, e.clientY);
    syncView();
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); drag = null; pinch0 = null; });
  canvas.addEventListener("pointerleave", () => { if (!drag) hideTip(); });
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); setFov(fov * (e.deltaY > 0 ? 1.07 : 0.93)); }, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
function setFov(v) { fov = Math.max(34, Math.min(80, v)); camera.fov = fov; camera.updateProjectionMatrix(); }
function hover(cx, cy) {
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
  if (!canvas.isConnected) { running = false; return; }
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (targetYaw !== null) {
    const d = targetYaw - yaw; yaw += d * Math.min(1, dt * 7);
    if (Math.abs(d) < 0.002) { yaw = targetYaw; targetYaw = null; }
  }
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  // Taschenlampe: am Computer folgt sie der Maus, am Handy zeigt sie geradeaus
  const L = E().isLight();
  flash.intensity += ((L ? 40 : 0) - flash.intensity) * Math.min(1, dt * 10);
  const aim = isTouch() ? new THREE.Vector2(0, 0) : flashAim;
  flashTarget.position.set(aim.x * Math.tan(camera.fov * Math.PI / 360) * camera.aspect, aim.y * Math.tan(camera.fov * Math.PI / 360), -1);
  if (boltLight.intensity > 0) boltLight.intensity = Math.max(0, boltLight.intensity - dt * 22);
  built.anims.forEach((fn) => fn(dt, t));
  renderer.render(scene, camera);
}
function startLoop() { if (running) return; running = true; clock.getDelta(); requestAnimationFrame(frame); }
document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else if (canvas && canvas.isConnected) startLoop(); });

/* ---------- Schnittstelle für die Engine ---------- */
function applyState() {
  const has = (f) => E().has(f), L = E().isLight();
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
function render(stage, r, i) {
  if (!init()) return;
  if (!wrap.isConnected || wrap.parentNode !== stage) { stage.innerHTML = ""; stage.appendChild(wrap); }
  if (roomId !== r.id) { buildRoom(r); yaw = yawOf(i); pitch = -0.04; targetYaw = null; lastIndex = i; }
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
  const e = built.pick.find((x) => x.ids.includes(id) || x.label === id); if (!e) return null;
  const c = e.aimLocal ? e.obj.localToWorld(new THREE.Vector3(...e.aimLocal)) : new THREE.Box3().setFromObject(e.obj).getCenter(new THREE.Vector3());
  const d = c.clone().sub(camera.position);
  yaw = Math.atan2(-d.x, -d.z); pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); targetYaw = null;
  camera.rotation.set(pitch, yaw, 0, "YXZ"); camera.updateMatrixWorld();
  const p = c.clone().project(camera), rc = canvas.getBoundingClientRect();
  return { x: rc.left + (p.x + 1) / 2 * rc.width, y: rc.top + (1 - p.y) / 2 * rc.height };
}
N.view3d = { supports, render, pickAt, aimAt, sync: () => syncView() };
// Falls das Spiel schon läuft, als die Module fertig geladen waren: jetzt auf 3D umschalten
export function ready() { if (N.engine && N.engine.refresh) N.engine.refresh(); }
