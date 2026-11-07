/*
 * SEKTOR 9 – (Grundlage aus Hotel Nocturne) Grafikstufe „HD“ für die 3D-Räume (Rezeption, Zimmer 217)
 *
 * - Qualitätsstufen: high (Computer) · medium (Tablet) · low (Handy); ?q=low|medium|high erzwingt eine Stufe.
 *   Läuft es zu langsam (> 40 ms je Bild über 3 s), schaltet die Ansicht selbst eine Stufe herunter.
 * - PBR: Lambert/Phong-Materialien werden zu MeshStandard/MeshPhysical; aus den Canvas-Texturen entstehen
 *   Normalenkarten (Holzmaserung, Tapetenprägung, Fugen). Materialien lassen sich mit tag(mat, {…}) gezielt einstellen.
 * - Umgebung: HDRI „lobby“ (Poly Haven, CC0, 512 px) für Spiegelungen auf Messing, Lack und Glas.
 * - Schatten: Taschenlampe immer (ab medium), dazu ein Hauptlicht je Raum (nur high).
 * - Nachbearbeitung: Leuchten (Bloom) an Lampen, Vignette und Filmkorn.
 * - GLB-Modelle (Meshopt + WebP) mit Zwischenspeicher, automatisch auf Zielgröße skaliert.
 */
import * as THREE from "../../../platform/vendor/three-0.170.0/three.module.min.js";
import { GLTFLoader } from "../../../platform/vendor/three-0.170.0/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "../../../platform/vendor/three-0.170.0/addons/loaders/EXRLoader.js";
import { MeshoptDecoder } from "../../../platform/vendor/three-0.170.0/addons/libs/meshopt_decoder.module.js";
import { EffectComposer } from "../../../platform/vendor/three-0.170.0/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../../../platform/vendor/three-0.170.0/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../../platform/vendor/three-0.170.0/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "../../../platform/vendor/three-0.170.0/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "../../../platform/vendor/three-0.170.0/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "../../../platform/vendor/three-0.170.0/addons/geometries/RoundedBoxGeometry.js";

export { RoundedBoxGeometry };
const ASSETS = "assets/3d/";

/* ---------- Qualitätsstufe ---------- */
const LEVELS = ["low", "medium", "high"];
export function detectQuality() {
  const q = new URLSearchParams(location.search).get("q");
  if (LEVELS.includes(q)) return q;
  const touch = window.matchMedia("(pointer: coarse)").matches, small = Math.min(screen.width, screen.height) < 700;
  return touch ? (small ? "low" : "medium") : "high";
}
export const Q = { level: detectQuality() };
const at = (lvl) => LEVELS.indexOf(Q.level) >= LEVELS.indexOf(lvl);

/* ---------- Materialien ---------- */
/** Material für die HD-Umwandlung markieren: { roughness, metalness, clearcoat, sheen, sheenColor, normal (Stärke), envMapIntensity }. */
export function tag(mat, opts) { mat.userData.pbr = { ...(mat.userData.pbr || {}), ...opts }; return mat; }

const normalCache = new WeakMap();
/** Normalenkarte aus einer Canvas-Textur (Helligkeit = Höhe, Sobel). */
function normalFrom(tex, strength) {
  if (!tex || !tex.image || !(tex.image instanceof HTMLCanvasElement)) return null;
  const key = tex.image; if (normalCache.has(key)) return normalCache.get(key);
  const src = tex.image, w = src.width, h = src.height, g = src.getContext("2d");
  const d = g.getImageData(0, 0, w, h).data, hgt = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) hgt[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const o = c.getContext("2d"), img = o.createImageData(w, h);
  const H = (x, y) => hgt[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
    const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4; img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  const n = new THREE.CanvasTexture(c); n.colorSpace = THREE.NoColorSpace; n.wrapS = tex.wrapS; n.wrapT = tex.wrapT; n.repeat.copy(tex.repeat); n.offset.copy(tex.offset); n.anisotropy = 4;
  normalCache.set(key, n); return n;
}
const isBrassy = (c) => { const hsl = {}; c.getHSL(hsl); return hsl.s > 0.25 && hsl.h > 0.06 && hsl.h < 0.16 && hsl.l > 0.2; };
const converted = new WeakMap();
function toPBR(m) {
  if (!m || m.isMeshStandardMaterial || m.isMeshBasicMaterial || m.isSpriteMaterial || m.isPointsMaterial || m.visible === false) return m;
  if (converted.has(m)) return converted.get(m);
  const p = m.userData.pbr || {};
  const phong = m.isMeshPhongMaterial, metal = p.metalness ?? (phong && isBrassy(m.color) ? 0.9 : 0);
  const rough = p.roughness ?? (phong ? (m.shininess >= 90 ? 0.12 : metal ? 0.38 : 0.45) : 0.82);
  const Ctor = p.sheen || p.clearcoat ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const n = new Ctor({
    color: m.color, map: m.map, emissive: m.emissive, emissiveMap: m.emissiveMap, transparent: m.transparent, opacity: m.opacity,
    side: m.side, depthWrite: m.depthWrite, alphaTest: m.alphaTest, roughness: rough, metalness: metal, envMapIntensity: p.envMapIntensity ?? 1,
  });
  if (p.sheen) { n.sheen = p.sheen; n.sheenRoughness = 0.55; n.sheenColor = new THREE.Color(p.sheenColor ?? 0xffffff); }
  if (p.clearcoat) { n.clearcoat = p.clearcoat; n.clearcoatRoughness = 0.25; }
  const ns = p.normal ?? (m.map && !m.transparent ? 1.2 : 0);
  if (ns && m.map) { const nm = normalFrom(m.map, ns); if (nm) { n.normalMap = nm; n.normalScale.set(0.7, 0.7); } }
  n.userData = { ...m.userData };
  converted.set(m, n); return n;
}

/** HD-Aufbereitung eines fertig gebauten Raums: PBR-Materialien, Schatten. */
export function prepareScene(scene) {
  scene.traverse((o) => {
    if (o.isMesh) {
      o.material = Array.isArray(o.material) ? o.material.map(toPBR) : toPBR(o.material);
      const mat = [].concat(o.material)[0];
      const solid = mat && mat.visible !== false && !mat.isMeshBasicMaterial && !mat.transparent;
      o.castShadow = solid && at("high"); o.receiveShadow = solid && at("medium");
    }
    if (o.isLight && o.userData.shadow && at("high")) { o.castShadow = true; o.shadow.mapSize.set(512, 512); o.shadow.bias = -0.002; o.shadow.radius = 3; }
  });
}

/* ---------- Umgebung (HDRI) ---------- */
let envTex = null, envPromise = null;
export function environment(renderer) {
  if (envPromise) return envPromise;
  envPromise = new Promise((res) => {
    new EXRLoader().load(ASSETS + "env/lobby-512.exr", (hdr) => {
      const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromEquirectangular(hdr).texture; hdr.dispose(); pm.dispose(); res(envTex);
    }, undefined, () => res(null));
  });
  return envPromise;
}

/* ---------- Modelle ---------- */
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
/**
 * GLB laden und in eine (sofort zurückgegebene) Gruppe setzen.
 * fit: { h | w | d: Meter } – gleichmäßig skaliert, Unterkante auf y = 0, in x/z zentriert. rotY: Drehung des Modells.
 */
export function model(file, { fit = {}, rotY = 0, onLoad = null } = {}) {
  const holder = new THREE.Group(); holder.userData.model = file;
  if (!cache.has(file)) cache.set(file, new Promise((res, rej) => loader.load(ASSETS + "models/" + file, res, undefined, rej)));
  cache.get(file).then((gltf) => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      if (o.isLight) { o.visible = false; o.intensity = 0; } // Lichter im Modell: wir setzen eigene
      if (o.isMesh) {
        o.castShadow = at("high"); o.receiveShadow = at("medium");
        [].concat(o.material).forEach((m) => { if ("transmission" in m && m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity, 0.85); } });
      }
    });
    s.rotation.y = rotY; s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s), size = box.getSize(new THREE.Vector3());
    const k = fit.h ? fit.h / size.y : fit.w ? fit.w / size.x : fit.d ? fit.d / size.z : 1;
    s.scale.multiplyScalar(k); s.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(s), c = b2.getCenter(new THREE.Vector3());
    s.position.x -= c.x; s.position.z -= c.z; s.position.y -= b2.min.y;
    holder.add(s); holder.userData.loaded = true;
    if (onLoad) onLoad(s);
  }).catch((e) => { console.warn("[Sektor 9 3D] Modell nicht geladen:", file, e); holder.userData.failed = true; });
  return holder;
}
export const modelsPending = () => [...cache.values()].length;
export async function modelsReady() { await Promise.allSettled([...cache.values()]); }

/* ---------- Nachbearbeitung ---------- */
const VignetteGrain = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmount: { value: 0.035 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uAmount; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.25, length(d * vec2(1.1, 1.0)));
      c.rgb *= mix(0.55, 1.0, v); c.rgb += (rnd(vUv * 900.0) - 0.5) * uAmount * c.rgb; gl_FragColor = c; }`,
};
export function composer(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const comp = new EffectComposer(renderer);
  comp.addPass(new RenderPass(scene, camera));
  let bloom = null;
  if (at("medium")) { bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.6, 0.82); comp.addPass(bloom); }
  const vg = new ShaderPass(VignetteGrain); comp.addPass(vg);
  comp.addPass(new OutputPass());
  return { comp, bloom, vg };
}

/* ---------- Taschenlampe: Lichtkegel mit Ring und Schatten ---------- */
export function flashlightCookie() {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  gr.addColorStop(0, "#fff8e8"); gr.addColorStop(0.35, "#f4e6c8"); gr.addColorStop(0.52, "#fff2d8"); gr.addColorStop(0.6, "#b8a888"); gr.addColorStop(0.85, "#4a4234"); gr.addColorStop(1, "#000");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.globalAlpha = 0.06; for (let i = 0; i < 300; i++) { g.fillStyle = "#000"; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 6, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function setupFlashlight(spot) {
  spot.map = flashlightCookie();
  if (at("medium")) { spot.castShadow = true; spot.shadow.mapSize.set(at("high") ? 1024 : 512, at("high") ? 1024 : 512); spot.shadow.bias = -0.0015; spot.shadow.camera.near = 0.1; spot.shadow.camera.far = 12; spot.shadow.radius = 2; }
}

/* ---------- Staub im Licht ---------- */
export function dust(R, H, n = 260) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() * 2 - 1) * R; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() * 2 - 1) * R; }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xffe6c0, size: 0.006, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m);
  p.userData.tick = (dt, t) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3 + 1] += Math.sin(t * 0.3 + i) * dt * 0.02; a[i * 3] += Math.cos(t * 0.2 + i * 1.7) * dt * 0.015; } g.attributes.position.needsUpdate = true; };
  return p;
}

/* ---------- Automatisch herunterschalten ---------- */
let slow = 0, sampleT = 0, frames = 0;
export function watchPerformance(dt, onDown) {
  sampleT += dt; frames++;
  if (sampleT < 3) return;
  const avg = sampleT / frames; sampleT = 0; frames = 0;
  if (avg > 0.04 && Q.level !== "low" && !new URLSearchParams(location.search).get("q")) { if (++slow >= 2) { slow = 0; Q.level = LEVELS[LEVELS.indexOf(Q.level) - 1]; onDown(Q.level); } }
  else slow = 0;
}
