import * as THREE from 'three';

export type SpriteDirection = 'down' | 'up' | 'left' | 'right';
export const VOVO_SHEET_URL = '/images/vovo_avental.png';
export const VOVO_SILHOUETTE_URL = '/images/silhueta.png';

// Poses para a avó (similar estrutura ao de Gabriela)
const VOVO_POSES = {
  down: { idle: 0, walk: [0, 1, 0, 2], mirrorIdle: false, mirrorWalk: false },
  up: { idle: 4, walk: [4, 3, 4, 7], mirrorIdle: false, mirrorWalk: false },
  left: { idle: 9, walk: [9, 6, 9, 11], mirrorIdle: false, mirrorWalk: true },
  right: { idle: 9, walk: [9, 6, 9, 11], mirrorIdle: true, mirrorWalk: false },
} as const;

let vovoAtlas: THREE.Texture | null = null;
let vovoPending: Promise<THREE.Texture> | null = null;

export function preloadVovoSprite(): Promise<THREE.Texture> {
  if (vovoAtlas) return Promise.resolve(vovoAtlas);
  if (vovoPending) return vovoPending;
  vovoPending = new THREE.TextureLoader().loadAsync(VOVO_SHEET_URL).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    vovoAtlas = texture;
    return texture;
  }).catch((error: unknown) => {
    vovoPending = null;
    throw error;
  });
  return vovoPending;
}

export function createVovoSprite(source: THREE.Texture) {
  const texture = source.clone();
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.35,
    depthWrite: true,
    toneMapped: false,
    color: 0xe8dcc8, // Tom mais quente para a avó
  });

  // Remove white matte similar to Gabriela sprite
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#ifdef GL_ES\nprecision ${GL_ES_VERSION} float;\n#endif\n',
      '#ifdef GL_ES\nprecision ${GL_ES_VERSION} float;\n#endif\nuniform sampler2D tMatCap;\n'
    );
  };

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 1.6, 1);
  sprite.userData.poses = VOVO_POSES;
  return sprite;
}

// Função para criar silhueta da avó
let silhouetteAtlas: THREE.Texture | null = null;
let silhouettePending: Promise<THREE.Texture> | null = null;

export function preloadSilhouetteSprite(): Promise<THREE.Texture> {
  if (silhouetteAtlas) return Promise.resolve(silhouetteAtlas);
  if (silhouettePending) return silhouettePending;
  silhouettePending = new THREE.TextureLoader().loadAsync(VOVO_SILHOUETTE_URL).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    silhouetteAtlas = texture;
    return texture;
  }).catch((error: unknown) => {
    silhouettePending = null;
    throw error;
  });
  return silhouettePending;
}

export function createSilhouetteSprite(source: THREE.Texture, dark = false) {
  const texture = source.clone();
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.35,
    depthWrite: true,
    toneMapped: false,
    color: dark ? 0x1a1a2e : 0xe8e0d5,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 1.6, 1);
  return sprite;
}
