import * as THREE from 'three';
import * as T from './textures';
import * as MT from './materialTextures';
import * as AT from './advancedTextures';
import { texturedMat, basicTexturedMat } from './assets';
import { soundManager } from '../audio/soundManager';
import { createVovoSprite, preloadVovoSprite } from './vovoSprite';

/* ============================================================
   PROCEDURAL 3D MODEL LIBRARY — every furniture / decor piece
   of the Kyoto machiya. Each builder returns a Group at origin
   plus an optional per-frame animation (physics, flicker...).
   ============================================================ */

export type Anim = (t: number, dt: number) => void;
export interface Built {
  group: THREE.Group;
  animate?: Anim;
}

let seed = 7;
export const resetSeed = (s = 7) => {
  seed = s;
};
export const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <X,>(arr: X[]): X => arr[Math.floor(rnd() * arr.length)];

export const std = (color: number, roughness = 0.8, metalness = 0.02, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const glow = (color: number, emissive: number, intensity = 1) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.9 });
const basic = (map: THREE.Texture, extra: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ map, ...extra });

/* ---------- Textured material factory (every furniture piece uses these) ---------- */
const woodMat = (o: MT.WoodOpts, rough = 0.62, rx = 1, ry = 1) => {
  const w = MT.woodTexture(o);
  const map = MT.repeat(w.map, rx, ry);
  const roughnessMap = MT.repeat(w.roughnessMap, rx, ry);
  return new THREE.MeshStandardMaterial({ map, roughnessMap, roughness: rough, metalness: 0.03 });
};
const texMat = (map: THREE.Texture, roughness: number, metalness = 0.02, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ map, roughness, metalness, ...extra });

export const MAT = {
  beam: woodMat({ base: 0x2a1a11, dark: 0x140b07, light: 0x3d2a1c, grainScale: 0.05 }, 0.6, 1, 3),
  darkWood: woodMat({ base: 0x33221a, dark: 0x1a100b, light: 0x4a3426, grainScale: 0.04 }, 0.58),
  walnut: woodMat({ base: 0x4a3524, dark: 0x2b1c12, light: 0x6a4e37, grainScale: 0.038 }, 0.55),
  oak: woodMat({ base: 0x7d5d3d, dark: 0x54391f, light: 0xa0805a, grainScale: 0.05 }, 0.66),
  brass: texMat(MT.brushedMetalTexture(0xb08d3e), 0.32, 0.85),
  steel: texMat(MT.brushedMetalTexture(0xb9c0c9), 0.28, 0.8),
  iron: texMat(MT.brushedMetalTexture(0x2a2b2e), 0.55, 0.6),
  black: texMat(MT.plasticTexture(0x141519), 0.5, 0.1),
  cream: texMat(MT.fabricTexture(0xe9e2d2, 0.06), 0.95),
  paper: texMat(MT.washiTexture(0xefe8d8), 0.95),
  white: texMat(MT.ceramicTexture(0xf3f1ea, false), 0.5),
  quilt: texMat(MT.quiltTexture(0x6b2528, 0xd9b89a), 0.95),
  indigo: texMat(MT.quiltTexture(0x27334f, 0xa9b6d0), 0.92),
  cloth: texMat(MT.fabricTexture(0x8a8f98, 0.14), 0.95),
  navy: texMat(MT.fabricTexture(0x1c2333, 0.12), 0.92),
  ceramic: texMat(MT.ceramicTexture(0xf1efe8), 0.32),
  ceramicBlue: texMat(MT.ceramicTexture(0x3f5a8a), 0.3),
  leaf: std(0x4f7a46, 0.8, 0, { side: THREE.DoubleSide }),
  leafDark: std(0x2f5a34, 0.85, 0, { side: THREE.DoubleSide }),
  maple: std(0xb8452b, 0.85, 0, { side: THREE.DoubleSide }),
  soil: texMat(MT.stoneTexture(0x2a221c), 1),
  stone: texMat(MT.stoneTexture(0x6a707a), 0.95),
  gravel: texMat(MT.repeat(MT.stoneTexture(0x3a3f3b), 4, 4), 0.95),
  moss: texMat(MT.fabricTexture(0x2f4a2a, 0.2), 1),
  terracotta: texMat(MT.ceramicTexture(0x9a5b3c, false), 0.8),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1 }),
  mirror: std(0x9aa4b0, 0.05, 1),
  red: texMat(MT.lacquerTexture(0xa32626), 0.35, 0.15),
  gold: texMat(MT.brushedMetalTexture(0xd4af37), 0.28, 0.9),
  orange: texMat(MT.ceramicTexture(0xe08a2e, false), 0.6),
  leather: texMat(MT.leatherTexture(0x4a2f22), 0.6),
  lacquerBlack: texMat(MT.lacquerTexture(0x15120f), 0.22, 0.2),
  straw: texMat(MT.strawTexture(), 0.95),
};

const BOOK_MATS = [0x6b2528, 0x2c4a3f, 0x3a3f5c, 0x7a5c2e, 0x4a3a4a, 0x20303f, 0x5c4630, 0x8a6a3a, 0x1f3a4a].map((c) => texMat(MT.leatherTexture(c, 64), 0.85));

export const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D): THREE.Mesh => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
};
export const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D) =>
  mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
export const cyl = (rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D, seg = 14) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent);
export const sph = (r: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D, seg = 12) =>
  mesh(new THREE.SphereGeometry(r, seg, seg), mat, x, y, z, parent);
export const plane = (w: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D) => {
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent);
  m.castShadow = false;
  return m;
};
const torus = (r: number, tube: number, mat: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D, arc = Math.PI * 2) =>
  mesh(new THREE.TorusGeometry(r, tube, 10, 24, arc), mat, x, y, z, parent);

const G = () => new THREE.Group();
const B = (g: THREE.Group): Built => ({ group: g });

/* ---------- shared micro-systems ---------- */
export const steamEmitter = (parent: THREE.Object3D, x: number, y: number, z: number, count = 8, size = 0.2, rise = 0.8): Anim => {
  const tex = T.softCircle('rgba(230,238,245,0.9)');
  const items = Array.from({ length: count }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.2, depthWrite: false }));
    s.position.set(x, y, z);
    parent.add(s);
    return { s, life: rnd(), speed: 0.22 + rnd() * 0.2 };
  });
  return (t, dt) =>
    items.forEach((it) => {
      it.life += it.speed * dt;
      if (it.life > 1) it.life = 0;
      it.s.position.set(x + Math.sin(t * 2 + it.speed * 20) * 0.04 * (1 + it.life), y + it.life * rise, z);
      it.s.scale.setScalar(size * (0.6 + it.life * 1.6));
      (it.s.material as THREE.SpriteMaterial).opacity = 0.22 * (1 - it.life);
    });
};

const bookRow = (parent: THREE.Object3D, x: number, y: number, z: number, len: number) => {
  let cursor = -len / 2 + 0.04;
  while (cursor < len / 2 - 0.08) {
    const bw = 0.04 + rnd() * 0.05;
    const bh = 0.22 + rnd() * 0.1;
    const b = box(bw, bh, 0.19, pick(BOOK_MATS), x + cursor + bw / 2, y + bh / 2, z, parent);
    if (rnd() > 0.82) b.rotation.z = 0.1;
    cursor += bw + 0.01;
  }
};

const bamboo = (parent: THREE.Object3D, x: number, z: number, hgt: number) => {
  const mat = std(0x4a6741, 0.7);
  const segs = 4;
  for (let s = 0; s < segs; s++) {
    const r = 0.05 - s * 0.007;
    cyl(r, r + 0.01, hgt / segs, mat, x, (hgt / segs) * (s + 0.5), z, parent, 8);
    const ring = torus(r + 0.012, 0.01, mat, x, (hgt / segs) * (s + 1), z, parent);
    ring.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 6; i++) {
    const leaf = plane(0.18, 0.05, MAT.leaf, x + (rnd() - 0.5) * 0.35, hgt - 0.2 + rnd() * 0.3, z + (rnd() - 0.5) * 0.35, parent);
    leaf.rotation.set(rnd() * 0.6, rnd() * 3, rnd() * 0.6);
  }
};

/* ============================================================
   STRUCTURE
   ============================================================ */
export const tatamiFloor = (w: number, d: number, cols: number, rows: number): Built => {
  const g = G();
  const mw = w / cols;
  const md = d / rows;
  const mat = texturedMat('tatami', 1.3, 1.0, 0x97976a);
  const edge = std(0x2f3a2c, 0.9);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + mw * (c + 0.5);
      const z = -d / 2 + md * (r + 0.5);
      box(mw - 0.03, 0.16, md - 0.03, mat, x, 0.08, z, g).castShadow = false;
      box(mw - 0.03, 0.02, 0.06, edge, x, 0.165, z - md / 2 + 0.05, g).castShadow = false;
      box(mw - 0.03, 0.02, 0.06, edge, x, 0.165, z + md / 2 - 0.05, g).castShadow = false;
    }
  return B(g);
};

export const woodFloor = (w: number, d: number): Built => {
  const g = G();
  box(w, 0.14, d, texturedMat('wood', w / 1.5, d / 1.7, 0x4a3527), 0, 0.07, 0, g).castShadow = false;
  return B(g);
};

export const stoneFloor = (w: number, d: number): Built => {
  const g = G();
  box(w, 0.08, d, texMat(MT.repeat(MT.stoneTexture(0x2c3038), w / 0.9, d / 0.9), 0.5, 0.12), 0, 0.04, 0, g).castShadow = false;
  const grout = std(0x1b1e24, 0.8);
  for (let x = -w / 2 + 0.6; x < w / 2; x += 0.6) box(0.02, 0.005, d, grout, x, 0.083, 0, g).castShadow = false;
  for (let z = -d / 2 + 0.6; z < d / 2; z += 0.6) box(w, 0.005, 0.02, grout, 0, 0.083, z, g).castShadow = false;
  return B(g);
};

export const wall = (w: number, h: number, d = 0.16): Built => {
  const g = G();
  box(w, h, d, texturedMat('plaster', w / 2.4, h / 2.4, 0xd5cfbf), 0, h / 2, 0, g);
  box(w, 0.12, d + 0.04, MAT.beam, 0, 0.06, 0, g);
  return B(g);
};
export const lintel = (w: number): Built => {
  const g = G();
  box(w, 0.28, 0.2, MAT.beam, 0, 0, 0, g);
  return B(g);
};
export const pillar = (h: number): Built => {
  const g = G();
  box(0.24, h, 0.24, MAT.beam, 0, h / 2, 0, g);
  return B(g);
};
export const beam = (len: number): Built => {
  const g = G();
  box(len, 0.22, 0.22, MAT.beam, 0, 0, 0, g);
  return B(g);
};

export const fusuma = (w: number, h: number): Built => {
  const g = G();
  box(w, h, 0.05, new THREE.MeshStandardMaterial({ map: T.fusumaTex(), roughness: 0.95 }), 0, h / 2, 0, g);
  box(w, 0.08, 0.08, MAT.beam, 0, 0.04, 0, g);
  box(w, 0.08, 0.08, MAT.beam, 0, h - 0.04, 0, g);
  box(0.08, h, 0.08, MAT.beam, -w / 2 + 0.04, h / 2, 0, g);
  box(0.08, h, 0.08, MAT.beam, w / 2 - 0.04, h / 2, 0, g);
  mesh(new THREE.CircleGeometry(0.05, 12), MAT.black, w / 2 - 0.25, h * 0.4, 0.03, g);
  return B(g);
};

export const shojiPanel = (w: number, h: number): Built => {
  const g = G();
  plane(w, h, texturedMat('shoji', w / 1.2, h / 2.4, 0xe6ddcb, { side: THREE.DoubleSide }), 0, 0, 0, g);
  const nV = Math.max(2, Math.round(w / 0.5));
  const nH = Math.max(2, Math.round(h / 0.6));
  for (let i = 0; i <= nV; i++) box(0.035, h, 0.045, MAT.beam, -w / 2 + (w / nV) * i, 0, 0.025, g);
  for (let j = 0; j <= nH; j++) box(w, 0.035, 0.045, MAT.beam, 0, -h / 2 + (h / nH) * j, 0.025, g);
  box(w + 0.06, 0.09, 0.07, MAT.beam, 0, -h / 2, 0.02, g);
  box(w + 0.06, 0.09, 0.07, MAT.beam, 0, h / 2, 0.02, g);
  return B(g);
};

export const shojiWindow = (w: number, h: number): Built => {
  const b = shojiPanel(w, h);
  plane(w - 0.05, h - 0.05, glow(0xf5eedb, 0xffe3b0, 0.35), 0, 0, -0.01, b.group);
  return b;
};

export const eave = (len: number): Built => {
  const g = G();
  [-len / 2 + 0.2, 0, len / 2 - 0.2].forEach((x) => box(0.16, 2.9, 0.16, MAT.beam, x, 1.45, 0, g));
  box(len, 0.18, 0.18, MAT.beam, 0, 2.85, 0, g);
  const roofMat = std(0x1f232b, 0.8);
  const ridgeMat = std(0x2a2f3a, 0.7);
  const roof = box(len + 0.4, 0.1, 1.3, roofMat, 0, 3.05, -0.35, g);
  roof.rotation.x = 0.22;
  for (let x = -len / 2; x < len / 2; x += 0.5) {
    const r = box(0.08, 0.05, 1.3, ridgeMat, x, 3.12, -0.35, g);
    r.rotation.x = 0.22;
  }
  return B(g);
};

export const engawa = (len: number): Built => {
  const g = G();
  const pm = std(0x5a4030, 0.75);
  const dark = std(0x3e2b1f, 0.8);
  for (let x = -len / 2; x < len / 2; x += 0.3) box(0.28, 0.12, 0.8, pm, x + 0.15, 0.06, 0, g).castShadow = false;
  box(len, 0.16, 0.08, dark, 0, 0.04, 0.42, g);
  box(len, 0.06, 0.06, dark, 0, -0.1, 0.4, g);
  return B(g);
};

export const stepBoard = (len: number): Built => {
  const g = G();
  box(0.35, 0.18, len, MAT.walnut, 0, 0.09, 0, g);
  return B(g);
};

export const rug = (w: number, d: number, kind: 'red' | 'blue' = 'red'): Built => {
  const g = G();
  const p = plane(w, d, new THREE.MeshStandardMaterial({ map: T.rugTex(kind), roughness: 0.95 }), 0, 0.01, 0, g);
  p.rotation.x = -Math.PI / 2;
  return B(g);
};

export const doorPlateSign = (text: string): Built => {
  const g = G();
  plane(0.4, 0.14, basic(T.doorPlate(text)), 0, 0, 0, g);
  return B(g);
};

export const missingPainting = (): Built => {
  const g = G();
  const frameMat = std(0x4a3423, 0.6);
  box(0.95, 0.07, 0.06, frameMat, 0, 0.33, 0, g);
  box(0.95, 0.07, 0.06, frameMat, 0, -0.33, 0, g);
  box(0.07, 0.73, 0.06, frameMat, -0.45, 0, 0, g);
  box(0.07, 0.73, 0.06, frameMat, 0.45, 0, 0, g);
  box(0.8, 0.6, 0.02, std(0xcfc7b2, 0.95), 0, 0, -0.01, g);
  const nail = cyl(0.012, 0.012, 0.1, std(0x1c1917, 0.4, 0.6), 0, 0.4, 0.04, g, 6);
  nail.rotation.z = 0.28;
  return B(g);
};

export const doorClosed = (w: number, h: number, plateText?: string): Built => {
  const g = G();
  box(w + 0.16, 0.1, 0.12, MAT.beam, 0, h + 0.05, 0.02, g);
  box(0.1, h, 0.12, MAT.beam, -w / 2 - 0.05, h / 2, 0.02, g);
  box(0.1, h, 0.12, MAT.beam, w / 2 + 0.05, h / 2, 0.02, g);
  box(w, h, 0.06, MAT.walnut, 0, h / 2, 0, g);
  box(w - 0.2, h * 0.38, 0.02, MAT.darkWood, 0, h * 0.72, 0.035, g);
  box(w - 0.2, h * 0.38, 0.02, MAT.darkWood, 0, h * 0.27, 0.035, g);
  const knob = sph(0.035, MAT.brass, w / 2 - 0.12, h * 0.48, 0.06, g, 10);
  knob.scale.z = 0.7;
  if (plateText) plane(0.34, 0.12, basic(T.doorPlate(plateText)), 0, h + 0.2, 0.04, g);
  return B(g);
};

export const frontDoor = (): Built => {
  const g = G();
  const w = 1.0;
  const h = 2.15;
  box(w + 0.2, 0.12, 0.16, MAT.beam, 0, h + 0.06, 0, g);
  box(0.12, h, 0.16, MAT.beam, -w / 2 - 0.06, h / 2, 0, g);
  box(0.12, h, 0.16, MAT.beam, w / 2 + 0.06, h / 2, 0, g);
  box(w, h, 0.07, MAT.darkWood, 0, h / 2, 0, g);
  plane(w - 0.3, 0.7, glow(0xdfe6ee, 0x9fb7d6, 0.25), 0, h * 0.7, 0.04, g);
  box(0.04, 0.7, 0.02, MAT.beam, 0, h * 0.7, 0.045, g);
  box(w - 0.3, 0.04, 0.02, MAT.beam, 0, h * 0.7, 0.045, g);
  box(0.05, 0.28, 0.05, MAT.brass, w / 2 - 0.14, h * 0.45, 0.07, g);
  plane(0.36, 0.12, basic(T.doorPlate('篠原')), w / 2 + 0.36, h * 0.72, 0.02, g);
  box(0.18, 0.12, 0.14, MAT.iron, 0, h + 0.28, 0.14, g);
  const lamp = sph(0.05, glow(0xffe6c0, 0xffc27a, 1.6), 0, h + 0.2, 0.14, g, 8);
  lamp.castShadow = false;
  return B(g);
};

export const doormat = (): Built => {
  const g = G();
  const p = plane(0.75, 0.48, std(0x4a3b2a, 0.95), 0, 0, 0, g);
  p.rotation.x = -Math.PI / 2;
  const border = plane(0.66, 0.4, std(0x6b5236, 0.95), 0, 0.001, 0, g);
  border.rotation.x = -Math.PI / 2;
  return B(g);
};

export const mirror = (w: number, h: number): Built => {
  const g = G();
  box(w + 0.08, h + 0.08, 0.04, MAT.walnut, 0, 0, 0, g);
  plane(w, h, MAT.mirror, 0, 0, 0.025, g);
  return B(g);
};

export const wallFrame = (tex: THREE.Texture, w: number, h: number): Built => {
  const g = G();
  box(w + 0.08, h + 0.08, 0.03, MAT.darkWood, 0, 0, 0, g);
  plane(w, h, basic(tex), 0, 0, 0.02, g);
  return B(g);
};

export const poster = (tex: THREE.Texture, w: number, h: number): Built => {
  const g = G();
  plane(w, h, basic(tex), 0, 0, 0, g);
  const tape = std(0xf5f2e6, 0.6, 0, { transparent: true, opacity: 0.8 });
  [[-w / 2, h / 2], [w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]].forEach(([x, y]) => {
    const tp = plane(0.08, 0.04, tape, x, y, 0.003, g);
    tp.rotation.z = x * y > 0 ? -0.7 : 0.7;
  });
  return B(g);
};

export const corkboard = (): Built => {
  const g = G();
  box(1.34, 0.94, 0.04, MAT.oak, 0, 0, 0, g);
  plane(1.26, 0.86, basic(T.corkboardTex()), 0, 0, 0.025, g);
  return B(g);
};

export const calendar = (): Built => {
  const g = G();
  plane(0.78, 0.98, basic(T.calendarTex()), 0, 0, 0, g);
  sph(0.02, MAT.brass, 0, 0.48, 0.01, g, 8);
  return B(g);
};

export const wallClock = (h: number, m: number, s: number, swing = true): Built => {
  const g = G();
  box(0.6, 0.86, 0.14, MAT.walnut, 0, 0, 0, g);
  box(0.66, 0.06, 0.18, MAT.darkWood, 0, 0.45, 0, g);
  const dialMaterial = basic(T.clockDial(h, m, s));
  mesh(new THREE.CircleGeometry(0.24, 32), dialMaterial, 0, 0.12, 0.075, g);
  let current = `${h}:${m}`;
  g.userData.setTime = (hours: number, minutes: number) => {
    const next = `${hours}:${minutes}`;
    if (next === current) return;
    current = next;
    dialMaterial.map?.dispose();
    dialMaterial.map = T.clockDial(hours, minutes, 0);
    dialMaterial.needsUpdate = true;
  };
  torus(0.24, 0.018, MAT.brass, 0, 0.12, 0.08, g);
  mesh(new THREE.CircleGeometry(0.24, 32), MAT.glass, 0, 0.12, 0.09, g);
  box(0.4, 0.34, 0.02, MAT.glass, 0, -0.26, 0.075, g);
  const pend = G();
  pend.position.set(0, -0.08, 0.04);
  cyl(0.007, 0.007, 0.3, MAT.brass, 0, -0.15, 0, pend, 6);
  const bob = cyl(0.075, 0.075, 0.03, MAT.brass, 0, -0.3, 0, pend, 20);
  bob.rotation.x = Math.PI / 2;
  g.add(pend);
  let a = swing ? 0.2 : 0.02;
  let v = 0;
  const animate: Anim = (_t, dt) => {
    if (!swing) return;
    v += -Math.sin(a) * 8 * dt;
    a += v * dt;
    pend.rotation.z = a;
  };
  return { group: g, animate };
};

export const pendantLamp = (shadow = false, color = 0xffb066): Built => {
  const g = G();
  cyl(0.012, 0.012, 0.7, MAT.black, 0, -0.35, 0, g, 6).castShadow = false;
  const shade = cyl(0.26, 0.36, 0.28, glow(0xf3e6c8, 0xffc27a, 0.55), 0, -0.82, 0, g, 24);
  shade.castShadow = false;
  const rim = torus(0.36, 0.015, MAT.beam, 0, -0.96, 0, g);
  rim.rotation.x = Math.PI / 2;
  sph(0.05, glow(0xfff3d6, 0xffe1a8, 2), 0, -0.9, 0, g, 8).castShadow = false;
  const light = new THREE.PointLight(color, 1.15, 12, 2.2);
  light.position.set(0, -1.0, 0);
  light.castShadow = shadow;
  if (shadow) {
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.002;
  }
  g.add(light);
  let ax = 0.03;
  let vx = 0;
  let az = 0.02;
  let vz = 0;
  let next = 3 + rnd() * 5;
  const animate: Anim = (t, dt) => {
    next -= dt;
    if (next <= 0) {
      vx += (rnd() - 0.5) * 0.25;
      vz += (rnd() - 0.5) * 0.25;
      next = 4 + rnd() * 7;
    }
    vx += (-ax * 9.5 - vx * 0.35) * dt;
    ax += vx * dt;
    vz += (-az * 9.5 - vz * 0.35) * dt;
    az += vz * dt;
    g.rotation.x = ax;
    g.rotation.z = az;
    light.intensity = 1.15 + (Math.sin(t * 9.7) + Math.sin(t * 5.3 + 1.4) * 0.6) * 0.08;
  };
  return { group: g, animate };
};

export const floorLamp = (): Built => {
  const g = G();
  cyl(0.18, 0.2, 0.04, MAT.iron, 0, 0.02, 0, g, 16);
  cyl(0.015, 0.015, 1.3, MAT.iron, 0, 0.67, 0, g, 8);
  cyl(0.16, 0.16, 0.5, glow(0xf3e6c8, 0xffc27a, 0.5), 0, 1.35, 0, g, 20).castShadow = false;
  const light = new THREE.PointLight(0xffd0a0, 0.65, 6.5, 2.2);
  light.position.set(0, 1.35, 0);
  g.add(light);
  const animate: Anim = (t) => {
    light.intensity = 0.65 + Math.sin(t * 7.3) * 0.04;
  };
  return { group: g, animate };
};

export const moths = (count: number, radius: number): Built => {
  const g = G();
  const tex = T.softCircle('rgba(255,240,200,1)', 32);
  const items = Array.from({ length: count }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false }));
    s.scale.set(0.06, 0.06, 1);
    g.add(s);
    return { s, a: i * 2.1, b: 1.7 + i * 0.6, ph: i * 1.3 };
  });
  const animate: Anim = (t) =>
    items.forEach((it) => {
      it.s.position.set(Math.sin(t * it.a * 0.6 + it.ph) * radius, Math.sin(t * it.b + it.ph) * 0.18, Math.cos(t * it.a * 0.45 + it.ph) * radius);
    });
  return { group: g, animate };
};

/* ============================================================
   LIVING ROOM
   ============================================================ */
export const kotatsu = (): Built => {
  const g = G();
  box(1.7, 0.09, 1.7, MAT.darkWood, 0, 0.52, 0, g);
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => box(0.09, 0.5, 0.09, MAT.darkWood, x, 0.25, z, g));
  box(2.15, 0.4, 2.15, MAT.quilt, 0, 0.29, 0, g);
  box(2.25, 0.08, 2.25, std(0x7d2f32, 0.95), 0, 0.47, 0, g);
  const pot = sph(0.13, MAT.ceramic, -0.35, 0.68, -0.2, g);
  pot.scale.y = 0.8;
  cyl(0.02, 0.03, 0.16, MAT.ceramic, -0.2, 0.7, -0.2, g, 8).rotation.z = -1.1;
  torus(0.09, 0.012, MAT.brass, -0.35, 0.78, -0.2, g, Math.PI);
  [[0.1, -0.35], [0.3, 0.1]].forEach(([x, z]) => {
    cyl(0.05, 0.04, 0.07, MAT.ceramicBlue, x, 0.6, z, g);
    cyl(0.045, 0.045, 0.005, std(0x7a5a2a, 0.6), x, 0.635, z, g);
  });
  cyl(0.2, 0.14, 0.08, MAT.ceramicBlue, -0.05, 0.6, 0.45, g);
  for (let i = 0; i < 4; i++) sph(0.055, MAT.orange, -0.05 + Math.cos(i * 1.6) * 0.08, 0.68, 0.45 + Math.sin(i * 1.6) * 0.08, g, 8);
  const np = box(0.42, 0.012, 0.3, std(0xd9d4c4, 0.95), 0.45, 0.57, -0.45, g);
  np.rotation.y = 0.3;
  return B(g);
};

export const zabuton = (color = 0x8a8f98): Built => {
  const g = G();
  box(0.55, 0.09, 0.55, std(color, 0.95), 0, 0.045, 0, g);
  const c = sph(0.2, std(color, 0.95), 0, 0.07, 0, g, 10);
  c.scale.set(1.2, 0.25, 1.2);
  return B(g);
};

export const crtTV = (): Built => {
  const g = G();
  const stat = T.tvStatic();
  box(1.1, 0.45, 0.6, MAT.walnut, 0, 0.225, 0, g);
  box(1.1, 0.03, 0.6, MAT.darkWood, 0, 0.46, 0, g);
  box(0.7, 0.12, 0.42, MAT.black, 0, 0.53, 0, g);
  box(0.2, 0.02, 0.01, std(0x333333, 0.5), 0.15, 0.55, 0.215, g);
  const led = plane(0.03, 0.012, new THREE.MeshBasicMaterial({ color: 0x2bff5a }), -0.25, 0.55, 0.216, g);
  box(0.95, 0.78, 0.62, std(0x2a2a2f, 0.6), 0, 0.98, 0, g);
  box(0.8, 0.6, 0.02, MAT.black, 0, 1.0, 0.315, g);
  plane(0.72, 0.52, basic(stat.texture), 0, 1.0, 0.33, g);
  [0.36, 0.36].forEach((x, i) => {
    const k = cyl(0.03, 0.03, 0.02, MAT.steel, x, 0.78 + i * 0.1, 0.32, g, 12);
    k.rotation.x = Math.PI / 2;
  });
  const a1 = cyl(0.006, 0.006, 0.55, MAT.steel, -0.1, 1.6, 0, g, 6);
  a1.rotation.z = 0.5;
  const a2 = cyl(0.006, 0.006, 0.55, MAT.steel, 0.1, 1.6, 0, g, 6);
  a2.rotation.z = -0.4;
  const light = new THREE.PointLight(0x9fd0ff, 0.35, 4.2, 2.2);
  light.position.set(0, 1.0, 0.8);
  g.add(light);
  const animate: Anim = (t) => {
    stat.update();
    light.intensity = 0.28 + Math.abs(Math.sin(t * 23)) * 0.18 + Math.random() * 0.04;
    (led.material as THREE.MeshBasicMaterial).color.setHex(Math.floor(t * 2) % 2 ? 0x2bff5a : 0x1a8f36);
  };
  return { group: g, animate };
};

export const phoneTable = (): Built => {
  const g = G();
  box(0.85, 0.06, 0.85, MAT.walnut, 0, 0.75, 0, g);
  [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(([x, z]) => box(0.06, 0.75, 0.06, MAT.walnut, x, 0.375, z, g));
  box(0.7, 0.03, 0.7, MAT.walnut, 0, 0.25, 0, g);
  const p = G();
  p.position.set(0, 0.78, 0);
  box(0.52, 0.15, 0.42, MAT.black, 0, 0.075, 0, p);
  cyl(0.14, 0.14, 0.035, MAT.black, 0, 0.165, 0.02, p, 24);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cyl(0.014, 0.014, 0.04, new THREE.MeshBasicMaterial({ color: 0x050505 }), Math.sin(a) * 0.08, 0.165, 0.02 + Math.cos(a) * 0.08, p, 8);
  }
  box(0.3, 0.055, 0.08, MAT.black, 0, 0.14, -0.12, p);
  [-0.17, 0.17].forEach((x) => {
    const ear = mesh(new THREE.CapsuleGeometry(0.055, 0.09, 4, 8), MAT.black, x, 0.15, -0.1, p);
    ear.rotation.z = Math.PI / 2;
  });
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push(new THREE.Vector3(Math.sin(t * 26) * 0.028, 0.12 + t * 0.04, 0.1 + t * 0.16 + Math.sin(t * 26) * 0.01));
  }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.009, 6), MAT.black, 0, 0, 0, p);
  g.add(p);
  box(0.2, 0.012, 0.26, MAT.paper, 0.28, 0.79, 0.15, g).rotation.y = -0.3;
  cyl(0.006, 0.006, 0.16, std(0x8a1f23, 0.5), 0.3, 0.8, 0.1, g, 6).rotation.z = Math.PI / 2;
  return B(g);
};

export const radio = (): Built => {
  const g = G();
  box(0.42, 0.24, 0.16, std(0x5a3b28, 0.6), 0, 0.12, 0, g);
  plane(0.18, 0.09, basic(T.radioDialTex()), -0.08, 0.14, 0.081, g);
  for (let i = 0; i < 5; i++) box(0.015, 0.14, 0.01, std(0xd9c9a8, 0.8), 0.09 + i * 0.025, 0.12, 0.081, g);
  cyl(0.02, 0.02, 0.02, MAT.brass, -0.14, 0.06, 0.085, g, 10).rotation.x = Math.PI / 2;
  cyl(0.004, 0.004, 0.35, MAT.steel, 0.15, 0.4, -0.05, g, 6).rotation.z = -0.4;
  const led = plane(0.02, 0.02, new THREE.MeshBasicMaterial({ color: 0xffb040 }), -0.17, 0.2, 0.082, g);
  const animate: Anim = (t) => {
    (led.material as THREE.MeshBasicMaterial).color.setHSL(0.08, 1, 0.45 + Math.sin(t * 3) * 0.1);
  };
  return { group: g, animate };
};

export const tansu = (): Built => {
  const g = G();
  box(1.6, 0.95, 0.5, MAT.walnut, 0, 0.475, 0, g);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 2; c++) {
      box(0.72, 0.24, 0.02, MAT.darkWood, -0.39 + c * 0.78, 0.2 + r * 0.28, 0.26, g);
      box(0.1, 0.03, 0.03, MAT.brass, -0.39 + c * 0.78, 0.2 + r * 0.28, 0.28, g);
    }
  const r = radio();
  r.group.position.set(-0.45, 0.95, 0);
  g.add(r.group);
  const d = sph(0.11, MAT.red, 0.2, 1.06, 0, g);
  d.scale.y = 1.15;
  const face = sph(0.07, MAT.cream, 0.2, 1.08, 0.07, g, 8);
  face.scale.z = 0.5;
  const f1 = wallFrame(T.familyPhotoTex(), 0.28, 0.21);
  f1.group.position.set(0.58, 1.08, 0.02);
  f1.group.rotation.set(-0.15, -0.2, 0);
  g.add(f1.group);
  cyl(0.05, 0.04, 0.16, MAT.ceramicBlue, -0.05, 1.03, -0.1, g, 12);
  cyl(0.004, 0.004, 0.22, MAT.leafDark, -0.05, 1.2, -0.1, g, 4);
  sph(0.03, MAT.white, -0.05, 1.32, -0.1, g, 8);
  return { group: g, animate: r.animate };
};

export const butsudan = (): Built => {
  const g = G();
  box(1.0, 1.5, 0.55, MAT.darkWood, 0, 0.75, 0, g);
  box(0.8, 1.1, 0.4, std(0x3a2a1a, 0.8), 0, 0.85, 0.08, g);
  plane(0.7, 0.9, new THREE.MeshStandardMaterial({ color: 0xc9a44a, metalness: 0.75, roughness: 0.35 }), 0, 0.9, 0.09, g);
  box(0.76, 0.04, 0.34, MAT.gold, 0, 0.42, 0.1, g);
  const dl = box(0.42, 1.2, 0.03, MAT.darkWood, -0.62, 0.85, 0.42, g);
  dl.rotation.y = 1.15;
  const dr = box(0.42, 1.2, 0.03, MAT.darkWood, 0.62, 0.85, 0.42, g);
  dr.rotation.y = -1.15;
  const ph = wallFrame(T.familyPhotoTex(), 0.22, 0.17);
  ph.group.position.set(0, 0.95, 0.12);
  g.add(ph.group);
  const flameTex = T.softCircle('rgba(255,190,90,1)', 32);
  const flames: THREE.Sprite[] = [];
  [-0.24, 0.24].forEach((x) => {
    cyl(0.02, 0.02, 0.16, MAT.cream, x, 0.52, 0.22, g, 8);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, opacity: 0.9, depthWrite: false }));
    f.scale.set(0.07, 0.12, 1);
    f.position.set(x, 0.64, 0.22);
    g.add(f);
    flames.push(f);
  });
  cyl(0.06, 0.045, 0.05, MAT.ceramicBlue, 0, 0.465, 0.24, g, 12);
  cyl(0.003, 0.003, 0.14, std(0x3a2a1a), 0.01, 0.55, 0.24, g, 4);
  cyl(0.05, 0.035, 0.05, MAT.brass, 0.15, 0.465, 0.3, g, 12);
  const light = new THREE.PointLight(0xffa24a, 0.45, 3, 2.2);
  light.position.set(0, 0.85, 0.55);
  g.add(light);
  const smoke = steamEmitter(g, 0.01, 0.62, 0.24, 4, 0.06, 0.45);
  const animate: Anim = (t, dt) => {
    flames.forEach((f, i) => {
      const k = 1 + Math.sin(t * 17 + i * 2) * 0.12 + Math.sin(t * 29 + i) * 0.06;
      f.scale.set(0.07 * k, 0.12 * k, 1);
    });
    light.intensity = 0.45 + Math.sin(t * 13) * 0.05 + Math.sin(t * 31) * 0.03;
    smoke(t, dt);
  };
  return { group: g, animate };
};

export const tokonoma = (): Built => {
  const g = G();
  box(1.8, 0.14, 0.9, MAT.walnut, 0, 0.07, 0, g);
  box(1.8, 2.7, 0.06, std(0xcfc3a8, 0.95), 0, 1.5, -0.42, g);
  box(0.16, 2.7, 0.16, MAT.beam, -0.9, 1.5, -0.35, g);
  box(0.16, 2.7, 0.16, MAT.beam, 0.9, 1.5, -0.35, g);
  plane(0.5, 1.5, basic(T.kakejiku()), 0.25, 1.7, -0.38, g);
  cyl(0.02, 0.02, 0.58, MAT.darkWood, 0.25, 2.46, -0.37, g, 8).rotation.z = Math.PI / 2;
  cyl(0.025, 0.025, 0.58, MAT.darkWood, 0.25, 0.94, -0.37, g, 8).rotation.z = Math.PI / 2;
  cyl(0.1, 0.13, 0.28, MAT.ceramicBlue, -0.5, 0.28, 0.05, g, 16);
  const br = std(0x3a2a1c, 0.9);
  [[0.25, 0.4], [-0.35, 0.55], [0.05, 0.7]].forEach(([rz, hgt]) => {
    const s = cyl(0.008, 0.012, hgt, br, -0.5, 0.42 + hgt / 2, 0.05, g, 6);
    s.rotation.z = rz;
    s.rotation.x = rz * 0.5;
  });
  sph(0.05, MAT.red, -0.3, 0.9, 0.08, g, 8);
  sph(0.045, MAT.white, -0.72, 1.0, 0.0, g, 8);
  sph(0.04, MAT.red, -0.48, 1.12, 0.1, g, 8);
  plane(0.14, 0.05, MAT.leafDark, -0.62, 0.7, 0.1, g).rotation.set(0.4, 0.5, 0.3);
  cyl(0.05, 0.05, 0.04, MAT.brass, 0.6, 0.16, 0.2, g, 12);
  return B(g);
};

export const heater = (): Built => {
  const g = G();
  box(0.55, 0.62, 0.55, std(0xd8d6cc, 0.5, 0.2), 0, 0.31, 0, g);
  box(0.42, 0.34, 0.02, MAT.black, 0, 0.36, 0.27, g);
  const core = plane(0.36, 0.28, new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, 0.36, 0.285, g);
  for (let i = 0; i < 7; i++) box(0.42, 0.012, 0.01, std(0x555a60, 0.4, 0.6), 0, 0.24 + i * 0.04, 0.29, g);
  box(0.55, 0.02, 0.55, std(0x5a5f66, 0.5, 0.5), 0, 0.63, 0, g);
  cyl(0.12, 0.15, 0.2, MAT.iron, 0, 0.74, 0, g, 14);
  torus(0.08, 0.012, MAT.brass, 0, 0.86, 0, g, Math.PI);
  const light = new THREE.PointLight(0xff8a2a, 0.55, 4, 2.2);
  light.position.set(0, 0.4, 0.6);
  g.add(light);
  const steam = steamEmitter(g, 0, 0.88, 0, 5, 0.14, 0.5);
  const animate: Anim = (t, dt) => {
    light.intensity = 0.55 + Math.sin(t * 11) * 0.07 + Math.sin(t * 3.1) * 0.05;
    (core.material as THREE.MeshBasicMaterial).color.setHSL(0.06, 1, 0.5 + Math.sin(t * 7) * 0.06);
    steam(t, dt);
  };
  return { group: g, animate };
};

export const floorFan = (): Built => {
  const g = G();
  cyl(0.2, 0.22, 0.04, std(0x2f3237, 0.5), 0, 0.02, 0, g, 16);
  cyl(0.02, 0.02, 0.6, MAT.steel, 0, 0.34, 0, g, 8);
  const head = G();
  head.position.set(0, 0.7, 0);
  cyl(0.06, 0.07, 0.16, std(0x2f3237, 0.5), 0, 0, -0.08, head, 12).rotation.x = Math.PI / 2;
  torus(0.26, 0.012, MAT.steel, 0, 0, 0.03, head);
  torus(0.14, 0.008, MAT.steel, 0, 0, 0.03, head);
  for (let i = 0; i < 8; i++) {
    const s = cyl(0.004, 0.004, 0.52, MAT.steel, 0, 0, 0.03, head, 4);
    s.rotation.z = (i / 8) * Math.PI;
  }
  const blades = G();
  const bm = std(0xaeb6c2, 0.4, 0.3, { side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const b = plane(0.1, 0.22, bm, 0, 0.13, 0, blades);
    const holder = G();
    holder.rotation.z = (i / 3) * Math.PI * 2;
    holder.add(b);
    blades.add(holder);
  }
  head.add(blades);
  g.add(head);
  const animate: Anim = (t, dt) => {
    blades.rotation.z -= dt * 18;
    head.rotation.y = Math.sin(t * 0.5) * 0.6;
  };
  return { group: g, animate };
};

export const plant = (kind: 'fern' | 'monstera' | 'bonsai' | 'cactus'): Built => {
  const g = G();
  if (kind === 'bonsai') {
    box(0.5, 0.08, 0.32, std(0x3b2b22, 0.8), 0, 0.04, 0, g);
    cyl(0.04, 0.06, 0.32, std(0x4a3626, 0.9), 0, 0.24, 0, g, 8).rotation.z = 0.25;
    cyl(0.025, 0.04, 0.26, std(0x4a3626, 0.9), 0.12, 0.44, 0, g, 8).rotation.z = -0.5;
    [[-0.1, 0.5, 0.16], [0.14, 0.6, 0.14], [0.04, 0.42, 0.12]].forEach(([x, y, r]) => {
      const s = sph(r, MAT.leafDark, x, y, 0, g, 10);
      s.scale.y = 0.55;
    });
    return B(g);
  }
  if (kind === 'cactus') {
    cyl(0.07, 0.05, 0.1, MAT.terracotta, 0, 0.05, 0, g, 12);
    cyl(0.04, 0.04, 0.2, MAT.leafDark, 0, 0.2, 0, g, 8);
    cyl(0.02, 0.02, 0.1, MAT.leafDark, 0.06, 0.24, 0, g, 6).rotation.z = -0.3;
    return B(g);
  }
  cyl(0.16, 0.12, 0.28, kind === 'fern' ? MAT.ceramic : MAT.terracotta, 0, 0.14, 0, g, 16);
  cyl(0.14, 0.14, 0.02, MAT.soil, 0, 0.28, 0, g, 16);
  const n = kind === 'fern' ? 12 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4;
    const hgt = kind === 'fern' ? 0.4 + rnd() * 0.25 : 0.55 + rnd() * 0.35;
    const stem = cyl(0.008, 0.012, hgt, MAT.leafDark, Math.cos(a) * 0.05, 0.28 + hgt / 2, Math.sin(a) * 0.05, g, 6);
    stem.rotation.z = Math.cos(a) * 0.5;
    stem.rotation.x = -Math.sin(a) * 0.5;
    const leaf = mesh(
      new THREE.CircleGeometry(kind === 'fern' ? 0.09 : 0.2, 8),
      kind === 'fern' ? MAT.leaf : MAT.leafDark,
      Math.cos(a) * (0.2 + hgt * 0.45),
      0.3 + hgt * 0.9,
      Math.sin(a) * (0.2 + hgt * 0.45),
      g
    );
    leaf.rotation.set(-0.9 + rnd() * 0.5, a, 0);
    leaf.scale.set(kind === 'fern' ? 0.5 : 1, kind === 'fern' ? 2.6 : 1.15, 1);
  }
  return B(g);
};

/* ============================================================
   GRANDMA'S ROOM
   ============================================================ */
export const futonFolded = (): Built => {
  const g = G();
  box(1.1, 0.22, 0.9, std(0xe4dccb, 0.95), 0, 0.11, 0, g);
  box(1.05, 0.2, 0.86, MAT.indigo, 0.02, 0.32, 0, g);
  box(1.0, 0.18, 0.8, std(0xe4dccb, 0.95), -0.02, 0.51, 0, g);
  box(0.5, 0.12, 0.3, std(0xf3f0e6, 0.95), 0.1, 0.66, -0.15, g);
  return B(g);
};

export const lowTable = (): Built => {
  const g = G();
  box(1.05, 0.06, 0.7, MAT.darkWood, 0, 0.33, 0, g);
  [[-0.45, -0.28], [0.45, -0.28], [-0.45, 0.28], [0.45, 0.28]].forEach(([x, z]) => box(0.06, 0.32, 0.06, MAT.darkWood, x, 0.16, z, g));
  cyl(0.09, 0.07, 0.12, MAT.ceramic, -0.3, 0.42, -0.1, g, 14);
  cyl(0.02, 0.025, 0.1, MAT.ceramic, -0.18, 0.44, -0.1, g, 6).rotation.z = -1.1;
  cyl(0.04, 0.035, 0.06, MAT.ceramicBlue, -0.05, 0.39, 0.15, g, 10);
  box(0.32, 0.14, 0.22, std(0x7a4e2a, 0.7), 0.3, 0.43, 0.05, g);
  const lid = box(0.32, 0.02, 0.22, std(0x7a4e2a, 0.7), 0.3, 0.56, -0.12, g);
  lid.rotation.x = -1.3;
  [0xc0262e, 0x2b5fb3, 0xe0a020, 0xf5f2e6].forEach((c, i) => cyl(0.018, 0.018, 0.05, std(c, 0.6), 0.2 + i * 0.065, 0.53, 0.06, g, 8));
  box(0.02, 0.005, 0.14, MAT.steel, 0.42, 0.51, 0.12, g).rotation.y = 0.4;
  return B(g);
};

export const sideTable = (): Built => {
  const g = G();
  // Small table base
  box(0.45, 0.05, 0.45, MAT.walnut, 0, 0.6, 0, g);
  [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => box(0.04, 0.55, 0.04, MAT.walnut, x, 0.3, z, g));
  // Table top
  box(0.5, 0.03, 0.5, MAT.walnut, 0, 0.88, 0, g);
  // Small lamp on the table
  const lampBase = cyl(0.04, 0.06, 0.06, MAT.ceramicBlue, 0.15, 0.96, -0.1, g, 12);
  const lampStem = cyl(0.015, 0.015, 0.15, MAT.brass, 0.15, 1.08, -0.1, g, 6);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 12, 1, true), new THREE.MeshStandardMaterial({
    color: 0xf5e8c8,
    emissive: 0xffd9a0,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  }));
  lampShade.position.set(0.15, 1.2, -0.1);
  lampShade.rotation.x = Math.PI;
  g.add(lampShade);
  // Light point from the lamp
  const lampLight = new THREE.PointLight(0xffd9a0, 0.5, 3, 2);
  lampLight.position.set(0.15, 1.15, -0.1);
  g.add(lampLight);
  return B(g);
};

export const kimonoStand = (): Built => {
  const g = G();
  box(0.6, 0.06, 0.3, MAT.darkWood, 0, 0.03, 0, g);
  cyl(0.025, 0.025, 1.7, MAT.darkWood, 0, 0.88, 0, g, 8);
  cyl(0.02, 0.02, 1.3, MAT.darkWood, 0, 1.7, 0, g, 8).rotation.z = Math.PI / 2;
  const km = new THREE.MeshStandardMaterial({ color: 0x2c3a5c, roughness: 0.9, side: THREE.DoubleSide });
  plane(0.7, 1.35, km, 0, 1.0, 0.03, g);
  plane(0.28, 0.6, km, -0.5, 1.4, 0.03, g);
  plane(0.28, 0.6, km, 0.5, 1.4, 0.03, g);
  plane(0.7, 0.18, std(0xa32626, 0.8, 0, { side: THREE.DoubleSide }), 0, 1.05, 0.035, g);
  for (let i = 0; i < 8; i++) sph(0.03, std(0xd9c39a, 0.8), -0.28 + rnd() * 0.56, 0.5 + rnd() * 1.0, 0.04, g, 6).scale.z = 0.3;
  return B(g);
};

/* ============================================================
   KITCHEN
   ============================================================ */
export const kitchenCounter = (len: number): Built => {
  const g = G();
  box(len, 0.86, 0.66, std(0x4a4f57, 0.6), 0, 0.43, 0, g);
  const doorMat = std(0x565c66, 0.55);
  const nDoors = Math.floor(len / 0.6);
  for (let i = 0; i < nDoors; i++) {
    const x = -len / 2 + 0.3 + i * (len / nDoors);
    box(len / nDoors - 0.06, 0.7, 0.02, doorMat, x, 0.42, 0.34, g);
    box(0.02, 0.14, 0.03, MAT.steel, x + 0.18, 0.55, 0.36, g);
  }
  box(len + 0.04, 0.05, 0.72, std(0xcdd3d8, 0.35, 0.3), 0, 0.885, 0, g);
  const sinkX = len * 0.22;
  box(0.62, 0.02, 0.46, std(0x6a7078, 0.3, 0.7), sinkX, 0.9, 0, g);
  box(0.6, 0.02, 0.44, std(0x3a4048, 0.3, 0.7), sinkX, 0.902, 0, g);
  cyl(0.02, 0.02, 0.26, MAT.steel, sinkX, 1.03, -0.25, g, 8);
  const arc = torus(0.13, 0.014, MAT.steel, sinkX, 1.16, -0.12, g, Math.PI);
  arc.rotation.y = Math.PI / 2;
  const stoveX = -len * 0.25;
  box(0.62, 0.03, 0.52, MAT.black, stoveX, 0.925, 0, g);
  [-0.15, 0.15].forEach((ox) => {
    torus(0.11, 0.012, MAT.iron, stoveX + ox, 0.95, 0, g).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const sp = box(0.24, 0.012, 0.012, MAT.iron, stoveX + ox, 0.95, 0, g);
      sp.rotation.y = (i / 4) * Math.PI;
    }
    cyl(0.03, 0.03, 0.02, std(0x333333, 0.5), stoveX + ox, 0.9, 0.3, g, 10).rotation.x = Math.PI / 2;
  });
  cyl(0.17, 0.22, 0.3, MAT.iron, stoveX - 0.15, 1.11, 0, g, 16);
  cyl(0.05, 0.07, 0.05, MAT.brass, stoveX - 0.15, 1.29, 0, g, 12);
  cyl(0.045, 0.02, 0.16, MAT.iron, stoveX + 0.07, 1.15, 0, g, 8).rotation.z = -1.1;
  torus(0.11, 0.016, MAT.brass, stoveX - 0.15, 1.27, 0, g, Math.PI);
  const rcX = len * 0.42;
  cyl(0.16, 0.16, 0.26, MAT.white, rcX, 1.04, 0, g, 20);
  cyl(0.15, 0.15, 0.03, std(0xd8dde3, 0.4), rcX, 1.18, 0, g, 20);
  plane(0.03, 0.02, new THREE.MeshBasicMaterial({ color: 0xff8a2a }), rcX, 1.0, 0.161, g);
  const rackX = len * 0.02;
  box(0.5, 0.02, 0.3, MAT.steel, rackX, 0.92, 0, g);
  for (let i = 0; i < 4; i++) {
    const pl = cyl(0.11, 0.11, 0.008, MAT.ceramic, rackX - 0.15 + i * 0.1, 1.03, 0, g, 20);
    pl.rotation.x = Math.PI / 2;
    pl.rotation.z = 0.15;
  }
  cyl(0.07, 0.05, 0.06, MAT.ceramicBlue, rackX + 0.2, 0.95, 0.1, g, 12);
  box(0.3, 0.02, 0.2, std(0xb08a5a, 0.8), -len * 0.05, 0.92, 0.1, g).rotation.y = 0.2;
  box(0.12, 0.2, 0.1, MAT.darkWood, len * 0.32, 1.01, -0.2, g);
  [0.3, 0.36].forEach((x) => box(0.02, 0.1, 0.005, MAT.steel, len * x, 1.15, -0.2, g));
  [0.1, 0.15, 0.2].forEach((fx, i) => {
    cyl(0.04, 0.04, 0.12, MAT.glass, len * fx, 0.97, -0.22, g, 10);
    cyl(0.035, 0.035, 0.08, std([0xc0262e, 0x6b4a2a, 0xe0c050][i], 0.9), len * fx, 0.95, -0.22, g, 10);
    cyl(0.042, 0.042, 0.02, MAT.black, len * fx, 1.04, -0.22, g, 10);
  });
  plane(0.16, 0.26, std(0xd9d4c4, 0.95, 0, { side: THREE.DoubleSide }), sinkX + 0.34, 0.5, 0.37, g);
  const steamA = steamEmitter(g, stoveX - 0.15, 1.32, 0, 8, 0.2, 0.9);
  const steamB = steamEmitter(g, rcX, 1.2, 0, 4, 0.12, 0.5);
  const animate: Anim = (t, dt) => {
    steamA(t, dt);
    steamB(t, dt);
  };
  return { group: g, animate };
};

export const kitchenShelf = (len: number): Built => {
  const g = G();
  [0, 0.5].forEach((y) => {
    box(len, 0.04, 0.28, MAT.walnut, 0, y, 0, g);
    [-len / 2 + 0.1, len / 2 - 0.1].forEach((x) => box(0.04, 0.14, 0.26, MAT.walnut, x, y - 0.09, 0, g));
  });
  for (let i = 0; i < 6; i++) {
    const x = -len / 2 + 0.2 + i * ((len - 0.4) / 5);
    cyl(0.06, 0.06, 0.18, MAT.glass, x, 0.11, 0, g, 12);
    cyl(0.055, 0.055, 0.12, std([0x8a5a2a, 0xd9c39a, 0x3f5a3a, 0xc0262e, 0xe0c050, 0x6b4a2a][i], 0.9), x, 0.08, 0, g, 12);
    cyl(0.062, 0.062, 0.02, MAT.black, x, 0.21, 0, g, 12);
  }
  for (let i = 0; i < 4; i++) {
    const bw = cyl(0.09, 0.06, 0.07, i % 2 ? MAT.ceramicBlue : MAT.ceramic, -len / 2 + 0.25 + i * 0.28, 0.56, 0, g, 12);
    bw.castShadow = false;
  }
  cyl(0.012, 0.012, len, MAT.iron, 0, -0.3, 0.12, g, 8).rotation.z = Math.PI / 2;
  [-0.5, 0.1, 0.55].forEach((x, i) => {
    const r = i === 1 ? 0.16 : 0.12;
    const pan = cyl(r, r, 0.03, MAT.iron, x, -0.42 - r, 0.12, g, 20);
    pan.rotation.x = Math.PI / 2;
    box(0.02, r + 0.16, 0.02, MAT.iron, x, -0.36 - r / 2, 0.12, g);
  });
  return B(g);
};

export const rangeHood = (): Built => {
  const g = G();
  box(0.8, 0.14, 0.5, std(0xaeb6c2, 0.35, 0.5), 0, 0, 0.05, g);
  box(0.4, 0.9, 0.4, std(0xaeb6c2, 0.35, 0.5), 0, 0.5, -0.05, g);
  plane(0.5, 0.2, glow(0xfff5e0, 0xffe1a8, 0.8), 0, -0.071, 0.1, g).rotation.x = Math.PI / 2;
  const light = new THREE.PointLight(0xfff0d0, 0.35, 3, 2.2);
  light.position.set(0, -0.2, 0.1);
  g.add(light);
  return B(g);
};

export const fridge = (): Built => {
  const g = G();
  const fm = std(0xd7dbe0, 0.3);
  box(0.95, 2.2, 0.95, fm, 0, 1.1, 0, g);
  box(0.97, 0.02, 0.97, std(0x9aa0a8), 0, 1.45, 0, g);
  box(0.05, 0.4, 0.04, MAT.steel, -0.4, 1.8, 0.5, g);
  box(0.05, 0.3, 0.04, MAT.steel, -0.4, 1.1, 0.5, g);
  [[0.2, 1.9, 0xc0262e], [0.3, 1.75, 0x2b5fb3], [0.1, 1.7, 0xe0a020]].forEach(([x, y, c]) => plane(0.05, 0.05, std(c as number, 0.5), x as number, y as number, 0.48, g));
  const note = plane(0.22, 0.22, basic(T.noteTex()), 0.15, 1.65, 0.479, g);
  note.rotation.z = -0.08;
  plane(0.16, 0.12, basic(T.familyPhotoTex()), -0.15, 1.95, 0.479, g);
  return B(g);
};

export const diningSet = (): Built => {
  const g = G();
  box(1.3, 0.06, 0.85, MAT.oak, 0, 0.72, 0, g);
  [[-0.58, -0.35], [0.58, -0.35], [-0.58, 0.35], [0.58, 0.35]].forEach(([x, z]) => box(0.06, 0.72, 0.06, MAT.oak, x, 0.36, z, g));
  [-0.75, 0.75].forEach((z) => {
    const ch = G();
    ch.position.set(0, 0, z);
    box(0.45, 0.05, 0.45, MAT.oak, 0, 0.45, 0, ch);
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([x, zz]) => box(0.04, 0.45, 0.04, MAT.oak, x, 0.225, zz, ch));
    box(0.45, 0.5, 0.04, MAT.oak, 0, 0.7, z > 0 ? 0.2 : -0.2, ch);
    g.add(ch);
  });
  [-0.32, 0.32].forEach((x) => {
    cyl(0.08, 0.06, 0.06, MAT.ceramic, x, 0.78, -0.12, g, 14);
    const rice = sph(0.06, MAT.white, x, 0.81, -0.12, g, 10);
    rice.scale.y = 0.5;
    cyl(0.07, 0.05, 0.06, std(0x5a1f1f, 0.5), x, 0.78, 0.14, g, 14);
    cyl(0.06, 0.06, 0.005, std(0x7a5a2a, 0.5), x, 0.81, 0.14, g, 14);
    cyl(0.04, 0.035, 0.07, MAT.ceramicBlue, x + 0.18, 0.785, 0.02, g, 10);
    box(0.2, 0.006, 0.006, MAT.darkWood, x, 0.755, 0.3, g).rotation.y = 0.1;
    box(0.2, 0.006, 0.006, MAT.darkWood, x, 0.755, 0.32, g).rotation.y = 0.1;
  });
  cyl(0.1, 0.09, 0.02, MAT.ceramic, 0, 0.76, 0, g, 16);
  sph(0.025, std(0xa32626, 0.6), -0.02, 0.79, 0, g, 8);
  sph(0.025, std(0xa32626, 0.6), 0.03, 0.79, 0.02, g, 8);
  const np = box(0.3, 0.01, 0.42, std(0xd9d4c4, 0.95), 0.5, 0.755, 0, g);
  np.rotation.y = -0.2;
  const steam = steamEmitter(g, -0.32, 0.84, 0.14, 4, 0.08, 0.35);
  const steam2 = steamEmitter(g, 0.32, 0.84, 0.14, 4, 0.08, 0.35);
  const animate: Anim = (t, dt) => {
    steam(t, dt);
    steam2(t, dt);
  };
  return { group: g, animate };
};

export const trashBin = (): Built => {
  const g = G();
  cyl(0.16, 0.14, 0.45, std(0xaeb6c2, 0.4, 0.4), 0, 0.225, 0, g, 16);
  cyl(0.17, 0.17, 0.03, std(0x8a929e, 0.4, 0.4), 0, 0.465, 0, g, 16);
  return B(g);
};

export const broom = (): Built => {
  const g = G();
  const stick = cyl(0.012, 0.012, 1.3, MAT.oak, 0, 0.7, 0, g, 6);
  stick.rotation.z = 0.12;
  const head = box(0.26, 0.18, 0.06, std(0xc9a55a, 0.95), -0.05, 0.1, 0, g);
  head.rotation.z = 0.12;
  return B(g);
};

// New furniture for school rooms

export const computerDesk = (w: number): Built => {
  const g = G();
  box(w, 0.08, 0.7, MAT.darkWood, 0, 0.75, 0, g);
  [[-w / 2 + 0.15, -0.25], [w / 2 - 0.15, -0.25]].forEach(([x, z]) => 
    box(0.06, 0.7, 0.06, MAT.iron, x, 0.38, z, g)
  );
  box(w * 0.4, 0.04, 0.35, MAT.steel, 0, 0.82, 0.25, g);
  box(w * 0.35, 0.25, 0.02, std(0x20242c, 0.4), 0, 0.97, 0.22, g);
  const screenGlow = plane(w * 0.3, 0.2, glow(0x1a2a3e, 0x3f6f9f, 0.5), 0, 0.97, 0.24, g);
  screenGlow.rotation.x = -Math.PI / 2;
  cyl(0.015, 0.015, 0.25, MAT.iron, 0, 0.5, 0.3, g, 6);
  return B(g);
};

export const printer = (): Built => {
  const g = G();
  box(0.5, 0.25, 0.4, std(0xd0d5dc, 0.3, 0.2), 0, 0.25, 0, g);
  box(0.45, 0.02, 0.35, std(0x2a2e35, 0.5), 0, 0.38, 0.05, g);
  [-0.2, 0.2].forEach((x) => box(0.03, 0.08, 0.03, MAT.black, x, 0.42, 0.15, g));
  cyl(0.02, 0.02, 0.18, std(0xff6040, 0.4), -0.15, 0.43, 0.12, g, 12);
  return B(g);
};

export const telephone = (): Built => {
  const g = G();
  box(0.15, 0.04, 0.15, MAT.walnut, 0, 0.72, 0, g);
  cyl(0.02, 0.02, 0.6, MAT.black, 0, 0.45, 0, g, 6);
  cyl(0.02, 0.01, 0.5, std(0x151a26, 0.9), 0.01, 0.82, 0.03, g, 10).rotation.x = 0.2;
  box(0.22, 0.06, 0.12, MAT.black, 0, 1.06, 0.05, g);
  [0.05, 0.08, -0.05, -0.08].forEach((x) => {
    const ear = cyl(0.035, 0.02, 0.04, MAT.black, x, 1.09, 0.08, g, 8);
    ear.rotation.x = Math.PI / 2;
  });
  const dial = plane(0.18, 0.18, basic(T.telephoneDialTex()), 0, 0.74, 0.07, g);
  return B(g);
};

export const fileCabinet = (w: number): Built => {
  const g = G();
  box(w, 1.4, 0.5, MAT.walnut, 0, 0.7, 0, g);
  const drawers = Math.floor(w / 0.5);
  for (let i = 0; i < drawers; i++) {
    const x = -w / 2 + 0.25 + i * 0.5;
    box(0.44, 0.3, 0.02, MAT.darkWood, x, 1.0, 0.25, g);
    box(0.02, 0.02, 0.02, MAT.brass, x + 0.12, 1.08, 0.26, g);
    box(0.02, 0.02, 0.02, MAT.brass, x - 0.12, 1.08, 0.26, g);
  }
  return B(g);
};

export const whiteboard = (): Built => {
  const g = G();
  box(1.8, 0.05, 1.0, MAT.walnut, 0, 0.55, 0, g);
  plane(1.7, 0.9, new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 }), 0, 0.55, 0.025, g);
  cyl(0.02, 0.02, 1.8, MAT.iron, 0, 1.0, 0, g, 8);
  return B(g);
};

export const easel = (): Built => {
  const g = G();
  cyl(0.02, 0.02, 1.4, MAT.darkWood, 0, 0.7, 0, g, 8).rotation.z = 0.08;
  cyl(0.025, 0.015, 1.2, MAT.darkWood, 0, 0.6, 0.05, g, 8).rotation.z = -0.08;
  box(0.85, 0.04, 0.6, MAT.darkWood, 0, 1.3, 0, g);
  plane(0.8, 0.6, std(0xefe8d8, 0.95, 0, { side: THREE.DoubleSide }), 0, 1.35, 0.02, g);
  return B(g);
};

export const paintingDisplay = (): Built => {
  const g = G();
  box(1.2, 0.04, 0.9, MAT.walnut, 0, 0.55, 0, g);
  plane(1.1, 0.8, basic(T.artDisplayTex()), 0, 0.55, 0.02, g);
  return B(g);
};

export const artSuppliesCabinet = (): Built => {
  const g = G();
  box(1.0, 1.2, 0.45, MAT.walnut, 0, 0.6, 0, g);
  [0.15, 0.38, 0.61].forEach((y) => {
    box(0.9, 0.03, 0.38, MAT.darkWood, 0, y, 0.22, g);
    box(0.02, 0.02, 0.02, MAT.brass, 0.22, y + 0.02, 0.23, g);
    box(0.02, 0.02, 0.02, MAT.brass, -0.22, y + 0.02, 0.23, g);
  });
  return B(g);
};

export const sculptureDisplay = (): Built => {
  const g = G();
  cyl(0.08, 0.1, 0.15, MAT.stone, 0, 0.12, 0, g, 12);
  cyl(0.06, 0.08, 0.2, MAT.stone, 0, 0.3, 0, g, 10);
  const head = sph(0.07, MAT.stone, 0, 0.42, 0, g, 10);
  head.scale.y = 0.85;
  return B(g);
};

export const lightFixture = (): Built => {
  const g = G();
  cyl(0.015, 0.015, 0.6, MAT.iron, 0, 0.3, 0, g, 6);
  sph(0.06, glow(0xfff0e0, 0xffd090, 1.5), 0, 0.05, 0, g, 10);
  const light = new THREE.PointLight(0xffd090, 0.6, 3, 2);
  light.position.set(0, 0.05, 0);
  g.add(light);
  return B(g);
};

export const sinkUnit = (): Built => {
  const g = G();
  box(0.8, 0.9, 0.55, MAT.ceramic, 0, 0.45, 0, g);
  box(0.75, 0.1, 0.5, std(0xe8e4dc, 0.2), 0, 0.85, 0.02, g);
  cyl(0.15, 0.12, 0.4, std(0xe8e4dc, 0.3), 0, 0.7, 0.22, g, 12);
  cyl(0.03, 0.02, 0.15, MAT.steel, 0, 0.88, 0.25, g, 8);
  return B(g);
};

export const examinationTable = (): Built => {
  const g = G();
  box(1.2, 0.08, 0.6, MAT.darkWood, 0, 0.8, 0, g);
  [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]].forEach(([x, z]) => 
    box(0.06, 0.76, 0.06, MAT.iron, x, 0.4, z, g)
  );
  box(0.5, 0.4, 0.35, std(0xf0f0f0, 0.3), 0.4, 0.5, 0.1, g);
  return B(g);
};

export const medicalCabinet = (): Built => {
  const g = G();
  box(0.8, 1.4, 0.45, MAT.walnut, 0, 0.7, 0, g);
  [0.25, 0.5, 0.75, 1.0].forEach((y) => {
    box(0.7, 0.2, 0.02, MAT.darkWood, 0, y, 0.22, g);
    box(0.02, 0.02, 0.02, MAT.brass, 0.2, y + 0.02, 0.23, g);
    box(0.02, 0.02, 0.02, MAT.brass, -0.2, y + 0.02, 0.23, g);
  });
  return B(g);
};

export const firstAidKit = (): Built => {
  const g = G();
  box(0.25, 0.12, 0.18, std(0xe0e0e0, 0.3), 0, 0.06, 0, g);
  plane(0.22, 0.15, basic(T.firstAidTex()), 0, 0.06, 0.005, g);
  return B(g);
};

export const stool = (): Built => {
  const g = G();
  cyl(0.04, 0.06, 0.5, MAT.walnut, 0, 0.28, 0, g, 10);
  box(0.35, 0.04, 0.35, MAT.walnut, 0, 0.56, 0, g);
  return B(g);
};

export const chiyo = (): Built => {
  const g = G();
  let sprite: ReturnType<typeof createVovoSprite> | null = null;
  preloadVovoSprite().then((texture) => {
    if (!g.parent) return;
    sprite = createVovoSprite(texture);
    sprite.center.set(0.5, 0);
    // The single PNG has generous transparent side padding; widen its plane
    // so Chiyo has the same visible body width as Gabriela.
    sprite.scale.set(2.1, 1.8, 1);
    sprite.position.y = 0.02;
    g.add(sprite);
  });

  const sh = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softCircle('rgba(0,0,0,0.85)'), transparent: true, opacity: 0.45, depthWrite: false }));
  sh.scale.set(0.8, 0.4, 1);
  sh.position.y = 0.02;
  g.add(sh);
  return B(g);
};

export const noren = (w: number): Built => {
  const g = G();
  const tex = T.norenTex();
  cyl(0.02, 0.02, w + 0.1, MAT.darkWood, 0, 0, 0, g, 8).rotation.z = Math.PI / 2;
  const n = 3;
  const sw = w / n - 0.03;
  const strips: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const tt = tex.clone();
    tt.repeat.set(1 / n, 1);
    tt.offset.set(i / n, 0);
    tt.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(sw, 1.0, 1, 4);
    geo.translate(0, -0.5, 0);
    const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tt, roughness: 0.95, side: THREE.DoubleSide }));
    s.position.set(-w / 2 + sw / 2 + i * (w / n), -0.02, 0);
    g.add(s);
    strips.push(s);
  }
  const animate: Anim = (t) => strips.forEach((s, i) => (s.rotation.x = Math.sin(t * 1.1 + i * 0.9) * 0.08));
  return { group: g, animate };
};

/* ============================================================
   GENKAN (ENTRANCE)
   ============================================================ */
export const coatRack = (): Built => {
  const g = G();
  cyl(0.2, 0.22, 0.04, MAT.darkWood, 0, 0.02, 0, g, 12);
  cyl(0.025, 0.025, 1.8, MAT.darkWood, 0, 0.92, 0, g, 8);
  for (let i = 0; i < 4; i++) {
    const h = cyl(0.012, 0.012, 0.18, MAT.brass, Math.cos((i / 4) * Math.PI * 2) * 0.09, 1.72, Math.sin((i / 4) * Math.PI * 2) * 0.09, g, 6);
    h.rotation.z = Math.PI / 2 - (i / 4) * Math.PI * 2;
    h.rotation.y = -(i / 4) * Math.PI * 2;
  }
  box(0.34, 0.85, 0.16, MAT.navy, 0.12, 1.25, 0.08, g);
  box(0.1, 0.5, 0.1, MAT.navy, -0.08, 1.4, 0.1, g);
  plane(0.1, 0.5, std(0xa32626, 0.9, 0, { side: THREE.DoubleSide }), -0.12, 1.4, 0.16, g);
  const umb = cyl(0.02, 0.02, 0.8, MAT.black, -0.14, 1.25, -0.08, g, 8);
  umb.rotation.x = 0.1;
  return B(g);
};

export const shoeRack = (): Built => {
  const g = G();
  box(1.3, 0.9, 0.42, MAT.walnut, 0, 0.45, 0, g);
  [0.3, 0.6].forEach((y) => box(1.24, 0.03, 0.4, MAT.darkWood, 0, y, 0.01, g));
  const shoe = (x: number, y: number, mat: THREE.Material, wet = false) => {
    [-0.07, 0.07].forEach((ox) => {
      box(0.1, 0.06, 0.26, mat, x + ox, y + 0.03, 0.05, g);
      box(0.1, 0.05, 0.1, mat, x + ox, y + 0.08, -0.03, g);
      if (wet) plane(0.12, 0.28, std(0x1e2430, 0.1, 0.6, { transparent: true, opacity: 0.5 }), x + ox, y + 0.001, 0.05, g).rotation.x = -Math.PI / 2;
    });
  };
  shoe(-0.42, 0.315, MAT.black);
  shoe(-0.05, 0.315, std(0xe8e4dc, 0.7));
  shoe(0.4, 0.615, std(0x6b4a2a, 0.8));
  [-0.07, 0.07].forEach((ox) => {
    box(0.09, 0.03, 0.24, std(0x8b6b4a, 0.8), -0.42 + ox, 0.63, 0.05, g);
    box(0.09, 0.05, 0.02, std(0x5c4630, 0.8), -0.42 + ox, 0.6, -0.02, g);
    box(0.09, 0.05, 0.02, std(0x5c4630, 0.8), -0.42 + ox, 0.6, 0.12, g);
    plane(0.11, 0.26, std(0x1e2430, 0.1, 0.6, { transparent: true, opacity: 0.55 }), -0.42 + ox, 0.616, 0.05, g).rotation.x = -Math.PI / 2;
  });
  box(0.3, 0.02, 0.2, MAT.ceramicBlue, 0.3, 0.92, 0, g);
  box(0.06, 0.012, 0.02, MAT.brass, 0.26, 0.94, 0.02, g).rotation.y = 0.4;
  box(0.06, 0.012, 0.02, MAT.brass, 0.34, 0.94, -0.02, g).rotation.y = -0.6;
  torus(0.03, 0.006, MAT.brass, 0.3, 0.945, 0.03, g).rotation.x = Math.PI / 2;
  return B(g);
};

export const schoolBag = (): Built => {
  const g = G();
  box(0.36, 0.42, 0.18, MAT.navy, 0, 0.21, 0, g);
  box(0.36, 0.12, 0.2, std(0x151a26, 0.9), 0, 0.4, 0.01, g);
  [-0.1, 0.1].forEach((x) => box(0.04, 0.3, 0.02, std(0x151a26, 0.9), x, 0.24, -0.1, g));
  box(0.05, 0.05, 0.05, MAT.brass, 0.15, 0.44, 0.08, g).rotation.set(0.3, 0.4, 0);
  return B(g);
};

export const umbrellaStand = (): Built => {
  const g = G();
  cyl(0.13, 0.11, 0.5, MAT.ceramicBlue, 0, 0.25, 0, g, 14);
  const u1 = cyl(0.045, 0.02, 0.85, MAT.navy, -0.04, 0.72, 0, g, 8);
  u1.rotation.z = 0.15;
  const u2 = cyl(0.04, 0.02, 0.8, std(0xd6dde6, 0.2, 0, { transparent: true, opacity: 0.6 }), 0.05, 0.7, 0.02, g, 8);
  u2.rotation.z = -0.1;
  torus(0.05, 0.008, MAT.oak, -0.13, 1.14, 0, g, Math.PI);
  return B(g);
};

export const rack = (w: number): Built => {
  const g = G();
  // Shoe rack with multiple tiers
  const tiers = Math.floor(w / 0.5);
  for (let i = 0; i < tiers; i++) {
    const x = -w / 2 + 0.25 + i * 0.5;
    box(0.45, 0.15, 0.45, MAT.walnut, x, 0.4, 0, g);
    box(0.45, 0.15, 0.45, MAT.walnut, x, 0.85, 0, g);
    box(0.45, 0.15, 0.45, MAT.walnut, x, 1.3, 0, g);
    // Dividers
    box(0.02, 0.12, 0.44, MAT.darkWood, x - 0.1, 0.47, 0, g);
    box(0.02, 0.12, 0.44, MAT.darkWood, x + 0.1, 0.47, 0, g);
    box(0.02, 0.12, 0.44, MAT.darkWood, x - 0.1, 0.92, 0, g);
    box(0.02, 0.12, 0.44, MAT.darkWood, x + 0.1, 0.92, 0, g);
    box(0.02, 0.12, 0.44, MAT.darkWood, x - 0.1, 1.37, 0, g);
    box(0.02, 0.12, 0.44, MAT.darkWood, x + 0.1, 1.37, 0, g);
  }
  // Legs
  [[-w / 2 + 0.1, -0.15], [w / 2 - 0.1, -0.15]].forEach(([x, z]) => 
    box(0.04, 0.4, 0.04, MAT.darkWood, x, 0.2, z, g)
  );
  return B(g);
};

export const slippers = (): Built => {
  const g = G();
  [-0.07, 0.07].forEach((x) => {
    box(0.1, 0.02, 0.25, std(0xb8a58a, 0.9), x, 0.01, 0, g);
    const top = box(0.1, 0.03, 0.09, std(0x8a7a5a, 0.9), x, 0.035, -0.06, g);
    top.rotation.x = -0.4;
  });
  return B(g);
};

export const geta = (): Built => {
  const g = G();
  [-0.07, 0.07].forEach((x) => {
    box(0.09, 0.025, 0.24, std(0x8b6b4a, 0.8), x, 0.06, 0, g);
    box(0.09, 0.05, 0.02, std(0x5c4630, 0.8), x, 0.025, -0.07, g);
    box(0.09, 0.05, 0.02, std(0x5c4630, 0.8), x, 0.025, 0.07, g);
  });
  return B(g);
};

export const stairs = (up: boolean, steps = 7): Built => {
  const g = G();
  const mat = std(0x4a3429, 0.7);
  const rise = 0.26;
  const run = 0.42;
  for (let s = 0; s < steps; s++) {
    const y = up ? 0.12 + s * rise : -0.12 - s * rise;
    const z = up ? -s * run : s * run;
    box(1.3, 0.24, run, mat, 0, y, z, g);
    box(1.3, rise, 0.03, MAT.darkWood, 0, y - rise / 2 + 0.02, z + run / 2 - 0.015, g);
  }
  const len = steps * run;
  [0, steps - 1].forEach((s) => {
    const y = up ? 0.12 + s * rise : -0.12 - s * rise;
    const z = up ? -s * run : s * run;
    cyl(0.03, 0.03, 0.9, MAT.darkWood, 0.62, y + 0.45, z, g, 8);
  });
  const midY = (up ? 0.12 + ((steps - 1) * rise) / 2 : -0.12 - ((steps - 1) * rise) / 2) + 0.9;
  const rail = box(0.05, 0.05, Math.hypot(len, steps * rise), MAT.walnut, 0.62, midY, ((up ? -1 : 1) * (steps - 1) * run) / 2, g);
  rail.rotation.x = -Math.atan2(steps * rise, len);
  return B(g);
};

/* ============================================================
   BEDROOM / STUDY
   ============================================================ */
export const bed = (): Built => {
  const g = G();
  box(1.75, 0.3, 2.55, MAT.darkWood, 0, 0.15, 0, g);
  [[-0.82, -1.22], [0.82, -1.22], [-0.82, 1.22], [0.82, 1.22]].forEach(([x, z]) => cyl(0.045, 0.045, 1.05, MAT.darkWood, x, 0.5, z, g, 8));
  box(1.7, 0.5, 0.08, MAT.darkWood, 0, 0.6, -1.25, g);
  box(1.6, 0.24, 2.4, std(0xe9e4d6, 0.9), 0, 0.42, 0, g);
  box(1.6, 0.1, 1.05, std(0x76859b, 0.95), 0, 0.56, 0.6, g);
  box(1.6, 0.04, 0.12, std(0x5f6d82, 0.95), 0, 0.62, 0.1, g);
  [-0.35, 0.35].forEach((x) => {
    const p = box(0.62, 0.13, 0.42, std(0xf3f0e6, 0.9), x, 0.6, -0.9, g);
    p.rotation.y = 0.04 * Math.sign(x);
  });
  box(0.5, 0.06, 0.34, MAT.navy, 0.4, 0.57, 1.0, g);
  box(0.5, 0.012, 0.06, MAT.white, 0.4, 0.6, 0.86, g);
  return B(g);
};

export const nightstand = (): Built => {
  const g = G();
  box(0.55, 0.5, 0.5, MAT.darkWood, 0, 0.25, 0, g);
  box(0.45, 0.16, 0.02, MAT.walnut, 0, 0.32, 0.26, g);
  box(0.08, 0.02, 0.03, MAT.brass, 0, 0.32, 0.28, g);
  // The alarm clock itself comes from the shared prop registry.
  cyl(0.06, 0.08, 0.03, MAT.brass, 0.17, 0.515, -0.1, g, 12);
  cyl(0.012, 0.012, 0.3, MAT.brass, 0.17, 0.68, -0.1, g, 6);
  cyl(0.1, 0.13, 0.16, glow(0xf3e6c8, 0xffc27a, 0.25), 0.17, 0.88, -0.1, g, 16).castShadow = false;
  cyl(0.035, 0.03, 0.1, MAT.glass, -0.18, 0.55, -0.12, g, 12);
  cyl(0.033, 0.028, 0.06, std(0x9fc4e8, 0.05, 0, { transparent: true, opacity: 0.6 }), -0.18, 0.53, -0.12, g, 12);
  box(0.16, 0.08, 0.1, MAT.white, 0.14, 0.54, 0.12, g);
  box(0.06, 0.03, 0.005, std(0xd8dde3, 0.9), 0.14, 0.585, 0.12, g);
  return B(g);
};

export const readingTable = (): Built => {
  const g = G();
  // Simple wooden table for library reading
  box(1.6, 0.06, 1.0, MAT.walnut, 0, 0.72, 0, g);
  // Table legs
  [[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.42], [0.72, 0.42]].forEach(([x, z]) => 
    box(0.05, 0.7, 0.05, MAT.walnut, x, 0.35, z, g)
  );
  // Small book on the table
  box(0.25, 0.04, 0.35, pick(BOOK_MATS), 0.3, 0.76, 0.2, g);
  box(0.25, 0.04, 0.33, pick(BOOK_MATS), 0.3, 0.76, -0.25, g);
  // Coffee cup
  cyl(0.05, 0.05, 0.08, MAT.ceramicBlue, -0.35, 0.77, 0.15, g, 12);
  cyl(0.04, 0.04, 0.01, MAT.white, -0.35, 0.82, 0.15, g, 10);
  return B(g);
};

export const desk = (): Built => {
  const g = G();
  box(2.15, 0.08, 0.95, MAT.darkWood, 0, 0.78, 0, g);
  [[-1.0, -0.4], [-1.0, 0.4]].forEach(([x, z]) => box(0.08, 0.78, 0.08, MAT.darkWood, x, 0.39, z, g));
  box(0.6, 0.72, 0.85, MAT.walnut, 0.75, 0.36, 0, g);
  [0.2, 0.42, 0.62].forEach((y) => box(0.06, 0.02, 0.03, MAT.brass, 0.75, y, 0.44, g));
  box(0.52, 0.03, 0.38, MAT.steel, -0.25, 0.84, 0, g);
  const scr = box(0.52, 0.34, 0.02, std(0x20242c, 0.4), -0.25, 1.02, -0.15, g);
  scr.rotation.x = -0.32;
  const scrGlow = plane(0.46, 0.28, glow(0x1a2a3e, 0x3f6f9f, 0.6), -0.25, 1.02, -0.135, g);
  scrGlow.rotation.x = -0.32;
  box(0.5, 0.012, 0.36, std(0xf1efe6), 0.35, 0.83, 0.05, g).rotation.y = -0.15;
  cyl(0.004, 0.004, 0.16, std(0x8a1f23, 0.5), 0.3, 0.845, 0.2, g, 6).rotation.z = Math.PI / 2;
  cyl(0.05, 0.045, 0.12, MAT.ceramicBlue, -0.85, 0.88, -0.3, g, 12);
  [0, 1, 2, 3].forEach((i) => {
    const p = cyl(0.006, 0.006, 0.2, std([0xe0c050, 0xc0262e, 0x2b5fb3, 0x333333][i], 0.6), -0.85 + (i - 1.5) * 0.02, 1.0, -0.3, g, 6);
    p.rotation.z = (i - 1.5) * 0.12;
  });
  torus(0.06, 0.01, MAT.brass, -0.55, 0.83, 0.3, g).rotation.x = Math.PI / 2;
  cyl(0.012, 0.012, 0.14, MAT.darkWood, -0.45, 0.83, 0.3, g, 6).rotation.z = Math.PI / 2;
  const pile = [[0x3a3f5c, 0.04], [0x6b2528, 0.035], [0x2c4a3f, 0.045]];
  let py = 0.82;
  pile.forEach(([c, h]) => {
    box(0.36, h as number, 0.26, std(c as number, 0.85), 0.75, py + (h as number) / 2, -0.25, g).rotation.y = 0.1;
    py += h as number;
  });
  cyl(0.02, 0.025, 0.04, MAT.iron, 0.4, 0.84, -0.3, g, 8);
  cyl(0.008, 0.008, 0.2, MAT.iron, 0.4, 0.95, -0.3, g, 6);
  sph(0.1, std(0x2b5fb3, 0.4), 0.4, 1.12, -0.3, g, 14);
  [[0.05, 0.05], [-0.06, 0.03], [0.02, -0.07]].forEach(([ox, oz]) => sph(0.04, std(0x3f7a46, 0.7), 0.4 + ox, 1.14, -0.3 + oz, g, 6).scale.z = 0.6);
  const lampArm = cyl(0.012, 0.012, 0.5, MAT.black, 0.98, 1.05, -0.3, g, 6);
  lampArm.rotation.z = 0.3;
  const lampHead = cyl(0.03, 0.11, 0.16, MAT.black, 0.88, 1.3, -0.3, g, 12);
  lampHead.rotation.z = 0.7;
  box(0.12, 0.04, 0.12, MAT.black, 1.0, 0.84, -0.3, g);
  const light = new THREE.PointLight(0xffd9a0, 0.45, 3.5, 2.2);
  light.position.set(0.8, 1.25, -0.2);
  g.add(light);
  return B(g);
};

export const chair = (kind: 'wood' | 'leather' = 'wood'): Built => {
  const g = G();
  const m = kind === 'leather' ? MAT.leather : MAT.darkWood;
  box(0.55, 0.08, 0.55, m, 0, 0.5, 0, g);
  box(0.55, 0.6, 0.07, m, 0, 0.85, 0.25, g);
  [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(([x, z]) => box(0.05, 0.5, 0.05, MAT.darkWood, x, 0.25, z, g));
  if (kind === 'leather') {
    box(0.5, 0.06, 0.5, std(0x5a3a2a, 0.7), 0, 0.57, 0, g);
    [-0.28, 0.28].forEach((x) => box(0.05, 0.06, 0.5, MAT.leather, x, 0.72, 0, g));
  }
  return B(g);
};

export const bookshelf = (w: number, h: number, rows: number): Built => {
  const g = G();
  box(w, h, 0.06, MAT.walnut, 0, h / 2, -0.2, g);
  box(0.05, h, 0.44, MAT.walnut, -w / 2 + 0.025, h / 2, 0, g);
  box(0.05, h, 0.44, MAT.walnut, w / 2 - 0.025, h / 2, 0, g);
  box(w, 0.05, 0.44, MAT.walnut, 0, h - 0.025, 0, g);
  const gap = (h - 0.1) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 0.05 + r * gap;
    box(w - 0.1, 0.04, 0.42, MAT.walnut, 0, y, 0, g);
    // Always add books to every shelf row for a fuller look
    bookRow(g, 0, y + 0.02, 0.02, w - 0.2 - (r % 2) * 0.4);
    if (r % 2 === 1) {
      box(0.3, 0.04, 0.22, pick(BOOK_MATS), w / 2 - 0.3, y + 0.04, 0.02, g);
      box(0.28, 0.04, 0.2, pick(BOOK_MATS), w / 2 - 0.3, y + 0.08, 0.02, g);
    }
  }
  const pb = plant('bonsai');
  pb.group.position.set(-w / 4, h, 0);
  g.add(pb.group);
  const fr = wallFrame(T.familyPhotoTex(), 0.26, 0.2);
  fr.group.position.set(w / 4, h + 0.13, 0);
  fr.group.rotation.x = -0.1;
  g.add(fr.group);
  return B(g);
};

export const windowUnit = (w = 2.6, h = 1.9): Built => {
  const g = G();
  box(w, h, 0.14, MAT.beam, 0, 0, 0, g);
  plane(w - 0.3, h - 0.3, basicTexturedMat('windowNight', 0x27334a), 0, 0, 0.075, g);
  const streak = T.rainStreaks();
  plane(w - 0.3, h - 0.3, new THREE.MeshBasicMaterial({ map: streak, transparent: true, opacity: 0.5, depthWrite: false }), 0, 0, 0.082, g);
  box(0.06, h - 0.3, 0.05, MAT.beam, 0, 0, 0.1, g);
  box(w - 0.3, 0.06, 0.05, MAT.beam, 0, 0, 0.1, g);
  plane(w - 0.3, h - 0.3, MAT.glass, 0, 0, 0.11, g);
  box(w + 0.2, 0.07, 0.3, MAT.walnut, 0, -h / 2 - 0.03, 0.1, g);
  const cactus = plant('cactus');
  cactus.group.position.set(w / 2 - 0.35, -h / 2, 0.12);
  g.add(cactus.group);
  cyl(0.02, 0.02, w + 0.5, MAT.brass, 0, h / 2 + 0.12, 0.2, g, 8).rotation.z = Math.PI / 2;
  const cm = std(0x6e7a8f, 0.95, 0, { side: THREE.DoubleSide });
  const cl = plane(0.45, h + 0.2, cm, -w / 2 + 0.1, -0.05, 0.2, g);
  const cr = plane(0.45, h + 0.2, cm, w / 2 - 0.1, -0.05, 0.2, g);
  const light = new THREE.PointLight(0x6d8fc9, 0.4, 5.5, 2.2);
  light.position.set(0, -0.2, 0.6);
  g.add(light);
  const animate: Anim = (t, dt) => {
    streak.offset.y -= dt * 0.35;
    cl.rotation.y = Math.sin(t * 0.9) * 0.08;
    cr.rotation.y = -Math.sin(t * 0.9 + 1) * 0.08;
    cl.position.z = 0.2 + Math.sin(t * 0.9) * 0.03;
    cr.position.z = 0.2 + Math.sin(t * 0.9 + 1) * 0.03;
  };
  return { group: g, animate };
};

export const studyDesk = (): Built => {
  const g = G();
  box(1.9, 0.08, 1.0, MAT.walnut, 0, 0.8, 0, g);
  [[-0.65, 0], [0.65, 0]].forEach(([x]) => box(0.5, 0.76, 0.9, MAT.darkWood, x, 0.38, 0, g));
  [0.25, 0.5].forEach((y) => [-0.65, 0.65].forEach((x) => box(0.08, 0.02, 0.03, MAT.brass, x, y, 0.46, g)));
  box(0.42, 0.14, 0.34, std(0x1e1f24, 0.45), -0.35, 0.91, -0.1, g);
  box(0.4, 0.06, 0.2, std(0x1e1f24, 0.45), -0.35, 1.0, -0.2, g);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) cyl(0.012, 0.012, 0.02, std(0xd9d4c4, 0.5), -0.35 - 0.14 + c * 0.04 + (r % 2) * 0.02, 0.99 + r * 0.02, 0.06 - r * 0.07, g, 6);
  plane(0.3, 0.32, MAT.paper, -0.35, 1.18, -0.3, g).rotation.x = -0.15;
  // The cedar box itself comes from the shared prop registry.
  cyl(0.04, 0.04, 0.06, std(0x1a1a1a, 0.1, 0.2, { transparent: true, opacity: 0.85 }), 0.2, 0.87, -0.35, g, 10);
  const quill = cyl(0.004, 0.004, 0.24, std(0xd9d4c4, 0.8), 0.24, 0.98, -0.34, g, 4);
  quill.rotation.z = -0.5;
  torus(0.06, 0.01, MAT.brass, -0.05, 0.85, 0.3, g).rotation.x = Math.PI / 2;
  cyl(0.012, 0.012, 0.14, MAT.darkWood, 0.06, 0.85, 0.3, g, 6).rotation.z = Math.PI / 2;
  for (let i = 0; i < 5; i++) box(0.3, 0.008, 0.4, std(0xe9e0c8, 0.95), -0.7 + i * 0.01, 0.845 + i * 0.008, 0.2, g).rotation.y = (rnd() - 0.5) * 0.2;
  box(0.16, 0.04, 0.16, MAT.brass, 0.72, 0.86, -0.3, g);
  cyl(0.012, 0.012, 0.32, MAT.brass, 0.72, 1.04, -0.3, g, 6);
  const shade = box(0.32, 0.12, 0.2, std(0x2f6b4a, 0.2, 0.2, { transparent: true, opacity: 0.85 }), 0.72, 1.2, -0.28, g);
  shade.rotation.x = 0.25;
  const light = new THREE.PointLight(0xbfe6c8, 0.45, 3.5, 2.2);
  light.position.set(0.72, 1.1, -0.15);
  g.add(light);
  const animate: Anim = (t) => {
    light.intensity = 0.45 + Math.sin(t * 60) * 0.015 + (Math.sin(t * 1.3) > 0.97 ? -0.15 : 0);
  };
  return { group: g, animate };
};

export const armchair = (): Built => {
  const g = G();
  box(0.9, 0.42, 0.9, MAT.leather, 0, 0.21, 0, g);
  box(0.9, 0.55, 0.2, MAT.leather, 0, 0.7, -0.35, g);
  [-0.38, 0.38].forEach((x) => box(0.14, 0.3, 0.9, MAT.leather, x, 0.55, 0, g));
  box(0.6, 0.1, 0.6, std(0x5a3a2a, 0.7), 0, 0.47, 0.05, g);
  const throwB = box(0.5, 0.04, 0.7, std(0x7a2f32, 0.95), 0.3, 0.72, 0.1, g);
  throwB.rotation.z = -0.6;
  return B(g);
};

export const globe = (): Built => {
  const g = G();
  cyl(0.2, 0.22, 0.04, MAT.walnut, 0, 0.02, 0, g, 16);
  cyl(0.02, 0.02, 0.9, MAT.walnut, 0, 0.47, 0, g, 8);
  const arc = torus(0.28, 0.012, MAT.brass, 0, 1.2, 0, g, Math.PI);
  arc.rotation.z = Math.PI / 2 + 0.4;
  sph(0.24, std(0x2b5fb3, 0.4), 0, 1.2, 0, g, 18);
  for (let i = 0; i < 6; i++) {
    const s = sph(0.08 + rnd() * 0.06, std(0x4f7a46, 0.8), 0, 1.2, 0, g, 6);
    s.position.setFromSphericalCoords(0.235, rnd() * Math.PI, rnd() * Math.PI * 2).add(new THREE.Vector3(0, 1.2, 0));
    s.scale.setScalar(0.6);
  }
  return B(g);
};

/* ============================================================
   ENGAWA / GARDEN
   ============================================================ */
export const furin = (): Built => {
  const g = G();
  cyl(0.004, 0.004, 0.35, MAT.cloth, 0, -0.175, 0, g, 4).castShadow = false;
  cyl(0.03, 0.08, 0.1, new THREE.MeshPhysicalMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.55, roughness: 0.1 }), 0, -0.4, 0, g, 12);
  sph(0.012, MAT.brass, 0, -0.47, 0, g, 6);
  const strip = plane(0.05, 0.22, std(0xf3ede0, 0.95, 0, { side: THREE.DoubleSide }), 0, -0.6, 0, g);
  plane(0.03, 0.03, std(0xa32626, 0.9, 0, { side: THREE.DoubleSide }), 0, -0.56, 0.001, g);
  let a = 0.05;
  let v = 0;
  let next = 2;
  let cool = 0;
  const animate: Anim = (t, dt) => {
    next -= dt;
    cool -= dt;
    if (next <= 0) {
      v += (rnd() - 0.5) * 1.2;
      next = 3 + rnd() * 6;
    }
    v += (-a * 12 - v * 0.6) * dt;
    a += v * dt;
    g.rotation.z = a;
    g.rotation.x = Math.sin(t * 1.7) * 0.08;
    strip.rotation.y = Math.sin(t * 2.3) * 0.5;
    if (Math.abs(v) > 0.9 && cool <= 0) {
      soundManager.playChime();
      cool = 1.4 + rnd() * 2;
    }
  };
  return { group: g, animate };
};

export const laundryPole = (): Built => {
  const g = G();
  [-0.9, 0.9].forEach((x) => cyl(0.025, 0.025, 1.7, MAT.steel, x, 0.85, 0, g, 8));
  cyl(0.02, 0.02, 1.9, std(0x8a6b45, 0.8), 0, 1.68, 0, g, 8).rotation.z = Math.PI / 2;
  const cm = std(0xe8e4dc, 0.95, 0, { side: THREE.DoubleSide });
  const items: THREE.Mesh[] = [];
  [-0.55, 0.0, 0.55].forEach((x, i) => {
    const geo = new THREE.PlaneGeometry(i === 1 ? 0.5 : 0.36, i === 1 ? 0.6 : 0.5, 1, 3);
    geo.translate(0, -(i === 1 ? 0.3 : 0.25), 0);
    const m = new THREE.Mesh(geo, i === 1 ? std(0x7a8aa0, 0.95, 0, { side: THREE.DoubleSide }) : cm);
    m.position.set(x, 1.66, 0.02);
    g.add(m);
    items.push(m);
  });
  const animate: Anim = (t) => items.forEach((m, i) => (m.rotation.x = Math.sin(t * 1.4 + i) * 0.12));
  return { group: g, animate };
};

export const wateringCan = (): Built => {
  const g = G();
  cyl(0.11, 0.1, 0.24, std(0x6b8a3a, 0.5, 0.3), 0, 0.12, 0, g, 14);
  const sp = cyl(0.015, 0.03, 0.3, std(0x6b8a3a, 0.5, 0.3), 0.2, 0.2, 0, g, 8);
  sp.rotation.z = -1.0;
  torus(0.08, 0.012, std(0x6b8a3a, 0.5, 0.3), 0, 0.26, 0, g, Math.PI);
  return B(g);
};

export const garden = (w: number, d: number): Built => {
  const g = G();
  box(w, 0.1, d, MAT.gravel, 0, -0.05, 0, g).castShadow = false;
  for (let z = -d / 2 + 0.15; z < d / 2; z += 0.18) box(w - 0.4, 0.004, 0.02, std(0x454b46, 0.9), 0, 0.003, z, g).castShadow = false;
  [[-w * 0.3, 0.2, 0.4], [w * 0.1, -0.3, 0.3], [w * 0.35, 0.3, 0.35]].forEach(([x, z, r]) => (cyl(r, r, 0.03, MAT.moss, x, 0.015, z, g, 12).castShadow = false));
  for (let i = 0; i < 7; i++) {
    const s = mesh(new THREE.DodecahedronGeometry(0.16 + rnd() * 0.2, 0), MAT.stone, -w / 2 + 0.5 + rnd() * (w - 1), 0.08, -d / 2 + 0.3 + rnd() * (d - 0.6), g);
    s.scale.y = 0.55;
    s.rotation.y = rnd() * 3;
  }
  const lx = -w * 0.08;
  const lz = 0.15;
  box(0.5, 0.16, 0.5, MAT.stone, lx, 0.08, lz, g);
  cyl(0.09, 0.12, 0.7, MAT.stone, lx, 0.51, lz, g, 8);
  box(0.44, 0.1, 0.44, MAT.stone, lx, 0.9, lz, g);
  box(0.34, 0.3, 0.34, glow(0xffd9a0, 0xffb060, 1.2), lx, 1.1, lz, g);
  const cap = mesh(new THREE.ConeGeometry(0.36, 0.24, 4), MAT.stone, lx, 1.37, lz, g);
  cap.rotation.y = Math.PI / 4;
  const ll = new THREE.PointLight(0xffc27a, 0.75, 5.5, 2.2);
  ll.position.set(lx, 1.15, lz);
  g.add(ll);
  const tx = w * 0.32;
  const tz = 0.2;
  cyl(0.07, 0.11, 1.4, std(0x4a3626, 0.9), tx, 0.7, tz, g, 8);
  [[0, 1.6, 0.55], [-0.35, 1.35, 0.4], [0.35, 1.4, 0.42], [0.1, 1.9, 0.35]].forEach(([x, y, r]) => {
    const s = sph(r, MAT.maple, tx + x, y, tz + (rnd() - 0.5) * 0.3, g, 9);
    s.scale.y = 0.7;
  });
  for (let i = 0; i < 12; i++) plane(0.06, 0.06, MAT.maple, tx + (rnd() - 0.5) * 1.6, 0.01, tz + (rnd() - 0.5) * 1.2, g).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) bamboo(g, -w / 2 + 0.4 + rnd() * 0.5, (rnd() - 0.5) * d * 0.8, 2.2 + rnd() * 0.8);
  cyl(0.22, 0.26, 0.28, MAT.stone, w * 0.12, 0.14, -0.3, g, 12);
  cyl(0.17, 0.17, 0.02, std(0x1f2a33, 0.1, 0.4), w * 0.12, 0.28, -0.3, g, 12);
  const spout = cyl(0.03, 0.03, 0.4, std(0x8a6b45, 0.8), w * 0.12 + 0.2, 0.42, -0.3, g, 8);
  spout.rotation.z = 1.2;
  const fz = d / 2 - 0.05;
  const fm = std(0x8a6b45, 0.8);
  for (let x = -w / 2; x <= w / 2; x += 0.5) cyl(0.03, 0.03, 1.0, fm, x, 0.5, fz, g, 6);
  [0.35, 0.75].forEach((y) => (cyl(0.02, 0.02, w, fm, 0, y, fz, g, 6).rotation.z = Math.PI / 2));
  const count = 26;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const phase: number[] = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rnd() - 0.5) * w;
    pos[i * 3 + 1] = 0.3 + rnd() * 1.3;
    pos[i * 3 + 2] = (rnd() - 0.5) * d;
    phase.push(rnd() * 6.28);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(pts);
  const animate: Anim = (t) => {
    for (let i = 0; i < count; i++) {
      const b = Math.pow(Math.max(0, Math.sin(t * 1.3 + phase[i])), 3);
      col[i * 3] = 0.75 * b;
      col[i * 3 + 1] = 0.95 * b;
      col[i * 3 + 2] = 0.35 * b;
      pos[i * 3] += Math.sin(t * 0.5 + phase[i]) * 0.0015;
      pos[i * 3 + 1] += Math.cos(t * 0.7 + phase[i]) * 0.001;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    ll.intensity = 0.75 + Math.sin(t * 6.1) * 0.06 + Math.sin(t * 2.3) * 0.07;
  };
  return { group: g, animate };
};

export const cat = (xMin: number, xMax: number, z: number, y = 0.16): Built => {
  const g = G();
  const f = T.catFrames();
  const mat = new THREE.SpriteMaterial({ map: f.walk[0], transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.62, 0.42, 1);
  s.position.set(xMin + 0.5, y + 0.21, z);
  g.add(s);
  const shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softCircle('rgba(0,0,0,0.8)'), transparent: true, opacity: 0.35, depthWrite: false }));
  shadow.scale.set(0.5, 0.25, 1);
  shadow.position.set(s.position.x, y + 0.02, z);
  g.add(shadow);
  let dir = 1;
  let state: 'walk' | 'sit' = 'walk';
  let timer = 2 + rnd() * 3;
  let frame = 0;
  let ft = 0;
  const animate: Anim = (_t, dt) => {
    timer -= dt;
    if (state === 'walk') {
      s.position.x += dir * 0.45 * dt;
      ft += dt;
      if (ft > 0.18) {
        ft = 0;
        frame = 1 - frame;
        mat.map = f.walk[frame];
      }
      if (s.position.x > xMax) dir = -1;
      if (s.position.x < xMin) dir = 1;
      s.scale.x = 0.62 * dir;
      if (timer <= 0) {
        state = 'sit';
        mat.map = f.sit;
        timer = 2.5 + rnd() * 4;
      }
    } else if (timer <= 0) {
      state = 'walk';
      mat.map = f.walk[0];
      timer = 3 + rnd() * 5;
      if (rnd() > 0.5) dir *= -1;
    }
    shadow.position.x = s.position.x;
  };
  return { group: g, animate };
};

/* ============================================================
   STANDALONE INSPECTABLE PROPS
   Centred on their own origin so the same object can be placed
   in the house and shown in the inspection view.
   ============================================================ */

export const photoFrontTexture = () => AT.makeDetailed1974Photo();
export const photoBackTexture = () => AT.makeDetailedPhotoBack();

/** Bedside alarm clock with a glowing display. */
export const bedsideClock = (initial = '03:17'): Built => {
  const g = G();
  const shell = std(0x16181c, 0.45, 0.12);
  box(0.34, 0.2, 0.14, shell, 0, 0, 0, g);
  const ledMaterial = new THREE.MeshBasicMaterial({ map: AT.makeDigitalLedTex(initial), toneMapped: false });
  plane(0.28, 0.14, ledMaterial, 0, 0, 0.071, g);
  let current = initial;
  g.userData.setTime = (hours: number, minutes: number) => {
    const next = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    if (next === current) return;
    current = next;
    ledMaterial.map?.dispose();
    ledMaterial.map = AT.makeDigitalLedTex(next);
    ledMaterial.needsUpdate = true;
  };
  [-0.1, 0, 0.1].forEach((x) => box(0.05, 0.02, 0.05, MAT.darkWood, x, 0.11, 0, g));
  [-0.13, 0.13].forEach((x) => [-0.045, 0.045].forEach((z) => cyl(0.015, 0.015, 0.02, shell, x, -0.11, z, g, 10)));
  return B(g);
};

/** Framed photograph, front and back readable. */
export const framedPhoto = (): Built => {
  const g = G();
  box(0.34, 0.42, 0.022, MAT.walnut, 0, 0, 0, g);
  plane(0.26, 0.33, new THREE.MeshBasicMaterial({ map: AT.makeDetailed1974Photo(), toneMapped: false }), 0, 0, 0.013, g);
  const back = plane(0.26, 0.33, new THREE.MeshBasicMaterial({ map: AT.makeDetailedPhotoBack(), toneMapped: false }), 0, 0, -0.013, g);
  back.rotation.y = Math.PI;
  return B(g);
};

/** Showa rotary telephone, centred. */
export const rotaryPhone = (): Built => {
  const g = G();
  box(0.52, 0.15, 0.42, MAT.black, 0, -0.03, 0, g);
  const dial = cyl(0.14, 0.14, 0.035, MAT.black, 0, 0.055, 0.02, g, 24);
  dial.rotation.x = 0.12;
  plane(0.24, 0.24, new THREE.MeshBasicMaterial({ map: AT.makeRotaryDialTex(), toneMapped: false }), 0, 0.074, 0.02, g).rotation.x = -Math.PI / 2 + 0.12;
  box(0.3, 0.055, 0.08, MAT.black, 0, 0.03, -0.12, g);
  [-0.17, 0.17].forEach((x) => {
    const ear = mesh(new THREE.CapsuleGeometry(0.055, 0.09, 4, 8), MAT.black, x, 0.04, -0.1, g);
    ear.rotation.z = Math.PI / 2;
  });
  const cord: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    cord.push(new THREE.Vector3(Math.sin(t * 26) * 0.028, -0.09 + t * 0.03, 0.1 + t * 0.14));
  }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 48, 0.009, 6), MAT.black, 0, 0, 0, g);
  return B(g);
};

/** Small cedar keepsake box with a brass latch. */
export const cedarBox = (): Built => {
  const g = G();
  box(0.4, 0.2, 0.28, MAT.walnut, 0, -0.05, 0, g);
  box(0.42, 0.06, 0.3, MAT.darkWood, 0, 0.08, 0, g);
  box(0.07, 0.05, 0.02, MAT.brass, 0, 0.02, 0.15, g);
  [-0.16, 0.16].forEach((x) => [-0.1, 0.1].forEach((z) => box(0.03, 0.025, 0.03, MAT.darkWood, x, -0.16, z, g)));
  return B(g);
};
