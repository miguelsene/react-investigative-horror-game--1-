import * as THREE from 'three';
import { preloadGabrielaSprite } from './gabrielaSprite';

/* ============================================================
   Asset cache + preloader. Textures are loaded ONCE and shared
   across floor rebuilds so switching rooms / opening dialogues
   never re-downloads anything.
   ============================================================ */

export type TexKey = 'wood' | 'tatami' | 'shoji' | 'plaster' | 'windowNight';

const PATHS: Record<TexKey, string> = {
  wood: '/textures/wood_floor.jpg',
  tatami: '/textures/tatami.jpg',
  shoji: '/textures/shoji.jpg',
  plaster: '/textures/plaster.jpg',
  windowNight: '/textures/window_night.jpg',
};

const cache: Partial<Record<TexKey, THREE.Texture>> = {};
let ready = false;
let preloadPromise: Promise<void> | null = null;

export const preloadAssets = (onProgress?: (p: number) => void): Promise<void> => {
  if (preloadPromise) {
    preloadPromise.then(() => onProgress?.(1));
    return preloadPromise;
  }
  preloadPromise = new Promise<void>((resolve) => {
    const loader = new THREE.TextureLoader();
    const keys = Object.keys(PATHS) as TexKey[];
    const images = ['/images/gabriela_portrait.png', '/images/chiyo_portrait.png', '/images/shadow_portrait.png', '/images/menu_bg.jpg'];
    const total = keys.length + 1 + images.length;
    let done = 0;
    const tick = () => {
      done++;
      onProgress?.(Math.min(1, done / total));
      if (done >= total) {
        ready = true;
        resolve();
      }
    };
    keys.forEach((k) =>
      loader.load(
        PATHS[k],
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = 4;
          cache[k] = t;
          tick();
        },
        undefined,
        () => tick()
      )
    );
    preloadGabrielaSprite().then(tick, tick);
    images.forEach((src) => {
      const im = new Image();
      im.onload = () => tick();
      im.onerror = () => tick();
      im.src = src;
    });
  });
  return preloadPromise;
};

export const assetsReady = () => ready;
export const getTex = (k: TexKey): THREE.Texture | null => cache[k] ?? null;

const withTex = (k: TexKey, apply: (t: THREE.Texture) => void) => {
  const t = getTex(k);
  if (t) apply(t);
  else
    preloadAssets().then(() => {
      const tt = getTex(k);
      if (tt) apply(tt);
    });
};

export const texturedMat = (
  k: TexKey,
  rx: number,
  ry: number,
  fallback: number,
  extra: THREE.MeshStandardMaterialParameters = {}
): THREE.MeshStandardMaterial => {
  const mat = new THREE.MeshStandardMaterial({ color: fallback, roughness: 0.9, metalness: 0.02, ...extra });
  withTex(k, (t) => {
    const c = t.clone();
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    mat.map = c;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  return mat;
};

export const basicTexturedMat = (k: TexKey, fallback: number): THREE.MeshBasicMaterial => {
  const mat = new THREE.MeshBasicMaterial({ color: fallback });
  withTex(k, (t) => {
    mat.map = t;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  return mat;
};

