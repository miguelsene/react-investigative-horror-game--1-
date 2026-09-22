import * as THREE from 'three';

/* ============================================================
   PROCEDURAL PBR-STYLE MATERIAL TEXTURES FOR FURNITURE & DECOR
   Each returns a tileable CanvasTexture (with optional matching
   roughness/bump map) so no model in the house is a flat solid.
   ============================================================ */

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const ctx2 = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D;
const tex = (c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

let seed = 1234;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const hexToRgb = (hex: number) => ({ r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255 });
const rgba = (hex: number, a: number, k = 1) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0},${a})`;
};

/* 1D value noise for grain */
const noise1 = (x: number, s: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = Math.sin(i * 12.9898 + s) * 43758.5453;
  const b = Math.sin((i + 1) * 12.9898 + s) * 43758.5453;
  const va = a - Math.floor(a);
  const vb = b - Math.floor(b);
  const u = f * f * (3 - 2 * f);
  return va * (1 - u) + vb * u;
};

/* ---------- WOOD (grain + rings + planks) ---------- */
export interface WoodOpts {
  base: number;
  dark: number;
  light: number;
  planks?: number; // number of vertical planks across the tile (0 = single slab)
  grainScale?: number;
  size?: number;
}
export const woodTexture = (o: WoodOpts): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } => {
  const S = o.size ?? 256;
  const c = mk(S, S);
  const g = ctx2(c);
  const rc = mk(S, S);
  const rg = ctx2(rc);
  const planks = o.planks ?? 0;
  const gs = o.grainScale ?? 0.045;
  seed = o.base ^ 0x5bd1e995;
  const img = g.createImageData(S, S);
  const rimg = rg.createImageData(S, S);
  const B = hexToRgb(o.base);
  const D = hexToRgb(o.dark);
  const L = hexToRgb(o.light);
  const plankW = planks > 0 ? S / planks : S;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const pi = planks > 0 ? Math.floor(x / plankW) : 0;
      const px = x - pi * plankW;
      const s = pi * 17.3;
      // grain along Y with wobble
      const wob = noise1(y * 0.02 + s, 3.1) * 8 + noise1(y * 0.11 + s, 7.7) * 2;
      const v = noise1((px + wob) * gs * 10 + s, 1.3) * 0.65 + noise1((px + wob) * gs * 37 + s, 5.9) * 0.35;
      const ring = Math.abs(Math.sin((px + wob) * gs * 3.2 + s)) > 0.92 ? 0.35 : 0;
      let t = v - ring;
      // plank edges
      const edge = planks > 0 && (px < 1.5 || px > plankW - 1.5) ? -0.5 : 0;
      t += edge;
      t = Math.max(0, Math.min(1, t));
      const r = t < 0.5 ? D.r + (B.r - D.r) * (t * 2) : B.r + (L.r - B.r) * ((t - 0.5) * 2);
      const gg = t < 0.5 ? D.g + (B.g - D.g) * (t * 2) : B.g + (L.g - B.g) * ((t - 0.5) * 2);
      const b = t < 0.5 ? D.b + (B.b - D.b) * (t * 2) : B.b + (L.b - B.b) * ((t - 0.5) * 2);
      const i = (y * S + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = gg;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
      const rv = 150 + (1 - t) * 70 + (edge ? 40 : 0);
      rimg.data[i] = rv;
      rimg.data[i + 1] = rv;
      rimg.data[i + 2] = rv;
      rimg.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  rg.putImageData(rimg, 0, 0);
  return { map: tex(c), roughnessMap: tex(rc, false) };
};

/* ---------- FABRIC (woven threads + slub) ---------- */
export const fabricTexture = (base: number, weaveContrast = 0.14, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x9e3779b9;
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const k = ((x + y) / 2) % 2 === 0 ? 1 + weaveContrast : 1 - weaveContrast;
      g.fillStyle = rgba(base, 0.9, k);
      g.fillRect(x, y, 2, 2);
    }
  }
  for (let i = 0; i < size * 3; i++) {
    g.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1);
  }
  return tex(c);
};

/* ---------- QUILT / FUTON (fabric + stitched diamond pattern) ---------- */
export const quiltTexture = (base: number, stitch: number, size = 256): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.drawImage(fabricTexture(base, 0.1, 128).image as HTMLCanvasElement, 0, 0, size, size);
  g.strokeStyle = rgba(stitch, 0.55);
  g.lineWidth = 1.5;
  g.setLineDash([3, 3]);
  const step = size / 4;
  for (let i = -size; i < size * 2; i += step) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + size, size);
    g.stroke();
    g.beginPath();
    g.moveTo(i + size, 0);
    g.lineTo(i, size);
    g.stroke();
  }
  g.setLineDash([]);
  // puffiness shading
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const gr = g.createRadialGradient(x * step + step / 2, y * step + step / 2, 4, x * step + step / 2, y * step + step / 2, step * 0.7);
      gr.addColorStop(0, 'rgba(255,255,255,0.10)');
      gr.addColorStop(1, 'rgba(0,0,0,0.18)');
      g.fillStyle = gr;
      g.fillRect(x * step, y * step, step, step);
    }
  return tex(c);
};

/* ---------- LACQUER (deep gloss with faint brush marks & gold flecks) ---------- */
export const lacquerTexture = (base: number, flecks = true, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x1234567;
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(255,255,255,${rnd() * 0.05})`;
    g.lineWidth = 1;
    const y = rnd() * size;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(size, y + (rnd() - 0.5) * 6);
    g.stroke();
  }
  if (flecks)
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(212,175,55,${0.25 + rnd() * 0.4})`;
      g.fillRect(rnd() * size, rnd() * size, 1, 1);
    }
  return tex(c);
};

/* ---------- CERAMIC GLAZE (speckle + crackle) ---------- */
export const ceramicTexture = (base: number, crackle = true, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  const gr = g.createLinearGradient(0, 0, 0, size);
  gr.addColorStop(0, rgba(base, 1, 1.06));
  gr.addColorStop(1, rgba(base, 1, 0.92));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x777;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(40,30,20,${rnd() * 0.18})`;
    g.fillRect(rnd() * size, rnd() * size, 1, 1);
  }
  if (crackle) {
    g.strokeStyle = 'rgba(60,50,40,0.22)';
    g.lineWidth = 0.7;
    for (let i = 0; i < 14; i++) {
      let x = rnd() * size;
      let y = rnd() * size;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (rnd() - 0.5) * 30;
        y += (rnd() - 0.5) * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  return tex(c);
};

/* ---------- BRUSHED METAL ---------- */
export const brushedMetalTexture = (base: number, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0xabcdef;
  for (let y = 0; y < size; y++) {
    const k = 0.9 + rnd() * 0.2;
    g.fillStyle = rgba(base, 0.6, k);
    g.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd() * 0.08})`;
    g.fillRect(rnd() * size, rnd() * size, 8 + rnd() * 30, 1);
  }
  return tex(c);
};

/* ---------- WASHI PAPER (fibres) ---------- */
export const washiTexture = (base = 0xeee6d6, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = 0x55aa;
  for (let i = 0; i < 400; i++) {
    g.strokeStyle = `rgba(120,100,70,${rnd() * 0.12})`;
    g.lineWidth = 0.6;
    const x = rnd() * size;
    const y = rnd() * size;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rnd() - 0.5) * 14, y + (rnd() - 0.5) * 14);
    g.stroke();
  }
  return tex(c);
};

/* ---------- STONE (granite speckle) ---------- */
export const stoneTexture = (base: number, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x3355;
  for (let i = 0; i < 1800; i++) {
    const k = rnd() > 0.5 ? 1.25 : 0.7;
    g.fillStyle = rgba(base, 0.7, k);
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  // moss patches
  for (let i = 0; i < 5; i++) {
    const gr = g.createRadialGradient(rnd() * size, rnd() * size, 1, rnd() * size, rnd() * size, 20);
    gr.addColorStop(0, 'rgba(60,90,50,0.35)');
    gr.addColorStop(1, 'rgba(60,90,50,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
  }
  return tex(c);
};

/* ---------- LEATHER (pores + creases) ---------- */
export const leatherTexture = (base: number, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x9911;
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(0,0,0,${rnd() * 0.2})`;
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, 0.6 + rnd() * 1.2, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 8; i++) {
    g.strokeStyle = 'rgba(255,255,255,0.06)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(rnd() * size, rnd() * size);
    g.lineTo(rnd() * size, rnd() * size);
    g.stroke();
  }
  return tex(c);
};

/* ---------- PLASTIC / BAKELITE (fine noise) ---------- */
export const plasticTexture = (base: number, size = 64): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  seed = base ^ 0x4242;
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`;
    g.fillRect(rnd() * size, rnd() * size, 1, 1);
  }
  return tex(c);
};

/* ---------- STRAW / BAMBOO WEAVE ---------- */
export const strawTexture = (base = 0x9c8a55, size = 128): THREE.CanvasTexture => {
  const c = mk(size, size);
  const g = ctx2(c);
  g.fillStyle = rgba(base, 1);
  g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 6) {
    for (let x = 0; x < size; x += 12) {
      const over = ((x / 12 + y / 6) | 0) % 2 === 0;
      g.fillStyle = rgba(base, 1, over ? 1.12 : 0.82);
      g.fillRect(x, y, 12, 6);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x, y + 5, 12, 1);
    }
  }
  return tex(c);
};

/* ---------- TILE-REPEAT helper ---------- */
export const repeat = <T extends THREE.Texture>(t: T, x: number, y: number): T => {
  const c = t.clone() as T;
  c.repeat.set(x, y);
  c.needsUpdate = true;
  return c;
};
