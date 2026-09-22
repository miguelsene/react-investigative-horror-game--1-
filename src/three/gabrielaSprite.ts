import * as THREE from 'three';

export type SpriteDirection = 'down' | 'up' | 'left' | 'right';
export const GABRIELA_SHEET_URL = '/images/gabriela_sheet.png';

// These are the actual cells of the supplied raster, not a generated character.
const POSES = {
  down: { idle: 0, walk: [0, 1, 0, 2], mirrorIdle: false, mirrorWalk: false },
  up: { idle: 4, walk: [4, 3, 4, 7], mirrorIdle: false, mirrorWalk: false },
  left: { idle: 9, walk: [9, 6, 9, 11], mirrorIdle: false, mirrorWalk: true },
  right: { idle: 9, walk: [9, 6, 9, 11], mirrorIdle: true, mirrorWalk: false },
} as const;

let atlas: THREE.Texture | null = null;
let pending: Promise<THREE.Texture> | null = null;

export function preloadGabrielaSprite(): Promise<THREE.Texture> {
  if (atlas) return Promise.resolve(atlas);
  if (pending) return pending;
  pending = new THREE.TextureLoader().loadAsync(GABRIELA_SHEET_URL).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    atlas = texture;
    return texture;
  }).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

export function createGabrielaSprite(source: THREE.Texture) {
  const texture = source.clone();
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.35,
    depthWrite: true,
    toneMapped: false,
    color: 0xc9c5c2,
  });

  // The existing image has a white matte. Remove only that matte in the
  // texture sample; the character itself is never painted by Canvas or CSS.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       #ifdef USE_MAP
         vec3 paperSample = texture2D(map, vMapUv).rgb;
         float paperWhite = min(paperSample.r, min(paperSample.g, paperSample.b));
         diffuseColor.a *= 1.0 - smoothstep(0.79, 0.92, paperWhite);
       #endif`,
    );
  };
  material.customProgramCacheKey = () => 'gabriela-raster-matte-v1';

  const sprite = new THREE.Sprite(material);
  sprite.name = 'Gabriela - pixel art raster';
  sprite.center.set(0.5, 0);
  const image = source.image as HTMLImageElement;
  const cropWidth = 0.52 / 4;
  const cropHeight = 0.97 / 3;
  const height = 1.73;
  sprite.scale.set(height * (image.width * cropWidth) / (image.height * cropHeight), height, 1);

  let lastPose = '';
  const setFrame = (direction: SpriteDirection, frame: number, moving: boolean) => {
    const poses = POSES[direction];
    const cell = moving ? poses.walk[frame % poses.walk.length] : poses.idle;
    // Cell 9 is drawn facing left; all other side poses face right.
    const mirror = moving && (direction === 'left' || direction === 'right')
      ? (cell === 9 ? direction === 'right' : poses.mirrorWalk)
      : poses.mirrorIdle;
    const key = `${cell}:${mirror}`;
    if (key === lastPose) return;
    lastPose = key;
    const col = cell % 4;
    const row = Math.floor(cell / 4);
    const left = (col + 0.24) / 4;
    const bottom = 1 - (row + 0.985) / 3;
    texture.repeat.set(mirror ? -cropWidth : cropWidth, cropHeight);
    texture.offset.set(mirror ? left + cropWidth : left, bottom);
    texture.updateMatrix();
  };
  setFrame('down', 0, false);

  return {
    sprite,
    setFrame,
    dispose: () => {
      material.dispose();
      texture.dispose();
    },
  };
}