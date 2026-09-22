import * as THREE from 'three';

/* ============================================================
   CHIYO — raster sprite pipeline (same approach as Gabriela).
   Reads a drawn sheet from /images/chiyo_sheet.png and selects
   UV frames. Nothing about her is painted by Canvas or CSS here.

   The sheet is not in the repository yet, so `loadChiyoSheet`
   resolves to null and the caller keeps its existing art. As soon
   as the file is added this module drives her automatically.
   ============================================================ */

export const CHIYO_SHEET_URL = '/images/chiyo_sheet.png';

/** Cells of the expected 4x3 sheet: front idle, front stir, side, back. */
const POSES = {
  idle: [0, 2],
  stir: [1, 3],
} as const;

const COLS = 4;
const ROWS = 3;

let atlas: THREE.Texture | null = null;
let attempted = false;
let pending: Promise<THREE.Texture | null> | null = null;

export function loadChiyoSheet(): Promise<THREE.Texture | null> {
  if (atlas) return Promise.resolve(atlas);
  if (attempted) return Promise.resolve(null);
  if (pending) return pending;

  pending = new THREE.TextureLoader()
    .loadAsync(CHIYO_SHEET_URL)
    .then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      atlas = texture;
      return texture;
    })
    .catch(() => {
      // Expected until the drawing is supplied; the caller falls back.
      attempted = true;
      return null;
    });

  return pending;
}

export interface ChiyoSprite {
  sprite: THREE.Sprite;
  setFrame: (frame: number, stirring: boolean) => void;
  dispose: () => void;
}

export function createChiyoSprite(source: THREE.Texture): ChiyoSprite {
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

  // Drop the sheet's near-white matte at sample time.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       #ifdef USE_MAP
         vec3 paper = texture2D(map, vMapUv).rgb;
         float white = min(paper.r, min(paper.g, paper.b));
         diffuseColor.a *= 1.0 - smoothstep(0.79, 0.92, white);
       #endif`,
    );
  };
  material.customProgramCacheKey = () => 'chiyo-raster-matte-v1';

  const sprite = new THREE.Sprite(material);
  sprite.name = 'Chiyo - pixel art raster';
  sprite.center.set(0.5, 0);

  const image = source.image as HTMLImageElement;
  const cropW = 0.52 / COLS;
  const cropH = 0.97 / ROWS;
  const height = 1.62;
  sprite.scale.set((height * (image.width * cropW)) / (image.height * cropH), height, 1);

  let last = -1;
  const setFrame = (frame: number, stirring: boolean) => {
    const cells = stirring ? POSES.stir : POSES.idle;
    const cell = cells[frame % cells.length];
    if (cell === last) return;
    last = cell;
    const col = cell % COLS;
    const row = Math.floor(cell / COLS);
    texture.repeat.set(cropW, cropH);
    texture.offset.set((col + 0.24) / COLS, 1 - (row + 0.985) / ROWS);
    texture.updateMatrix();
  };
  setFrame(0, false);

  return {
    sprite,
    setFrame,
    dispose: () => {
      material.dispose();
      texture.dispose();
    },
  };
}
