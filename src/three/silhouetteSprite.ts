import * as THREE from 'three';

/* Black human silhouette sprites, drawn once and reused for every
   pedestrian. Front, left and right variants; the engine flips for
   the opposite direction. */

const W = 96;
const H = 160;

const drawPerson = (facing: 'down' | 'left' | 'right', umbrella: boolean) => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;
  c.clearRect(0, 0, W, H);
  const flip = facing === 'right' ? -1 : 1;
  c.save();
  c.translate(W / 2, H);
  c.scale(flip, 1);

  const body = 'rgba(8,9,12,0.96)';
  const soft = 'rgba(14,15,19,0.9)';
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fill();
  };

  c.fillStyle = body;
  rr(-15, -64, 12, 60, 5);
  c.fillStyle = soft;
  rr(4, -62, 12, 58, 5);

  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-21, -120);
  c.quadraticCurveTo(-25, -78, -18, -60);
  c.lineTo(19, -60);
  c.quadraticCurveTo(25, -80, 20, -120);
  c.quadraticCurveTo(6, -130, -1, -128);
  c.quadraticCurveTo(-9, -130, -21, -120);
  c.fill();

  if (umbrella) {
    c.fillRect(14, -124, 5, 46);
  } else {
    rr(-24, -116, 9, 44, 4);
    rr(16, -116, 9, 44, 4);
  }

  c.fillStyle = body;
  c.beginPath();
  c.arc(0, -138, 13, 0, Math.PI * 2);
  c.fill();
  c.restore();

  if (umbrella) {
    c.fillStyle = 'rgba(20,22,28,0.92)';
    c.beginPath();
    c.moveTo(W / 2 - 34, 56);
    c.quadraticCurveTo(W / 2, 18, W / 2 + 34, 56);
    c.lineTo(W / 2 + 30, 60);
    c.lineTo(W / 2 - 30, 60);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(220,228,240,0.18)';
    c.beginPath();
    c.moveTo(W / 2 - 28, 56);
    c.quadraticCurveTo(W / 2, 26, W / 2 + 28, 56);
    c.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
};

let cache: Record<string, THREE.Texture> | null = null;

export const silhouetteTextures = () => {
  if (cache) return cache;
  cache = {
    downU: drawPerson('down', true),
    down: drawPerson('down', false),
    leftU: drawPerson('left', true),
    left: drawPerson('left', false),
    rightU: drawPerson('right', true),
    right: drawPerson('right', false),
  };
  return cache;
};

/** A reusable black pedestrian silhouette sprite. */
export const createSilhouette = (umbrella: boolean, height = 1.7) => {
  const tex = umbrella ? silhouetteTextures().downU : silhouetteTextures().down;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: true,
    alphaTest: 0.08,
    color: 0xffffff,
  });
  const sprite = new THREE.Sprite(mat);
  const aspect = W / H;
  sprite.scale.set(height * aspect, height, 1);
  sprite.center.set(0.5, 0);
  return sprite;
};

/** Swap the texture for direction / umbrella. */
export const setSilhouetteFrame = (sprite: THREE.Sprite, facing: 'down' | 'left' | 'right', umbrella: boolean) => {
  const key = `${facing}${umbrella ? 'U' : ''}` as keyof ReturnType<typeof silhouetteTextures>;
  const tex = silhouetteTextures()[key] ?? silhouetteTextures().down;
  const mat = sprite.material as THREE.SpriteMaterial;
  if (mat.map !== tex) {
    mat.map = tex;
    mat.needsUpdate = true;
  }
};
