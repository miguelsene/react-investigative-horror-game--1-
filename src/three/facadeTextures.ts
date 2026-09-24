import * as THREE from 'three';

/* Procedural facade / shopfront textures so the long street reads as
   painted buildings rather than flat-coloured boxes. */

// Procedural textures are deterministic per call; per-building variation
// is passed by the caller (base colour, floors and shop sign).

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const noise = (ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) => {
  for (let i = 0; i < w * h * 0.08; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
};

const toTex = (c: HTMLCanvasElement, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  return t;
};

export const facadeTexture = (base = '#8d8175', trim = '#e7dfcf', floors = 3) => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  noise(ctx, 256, 256, 0.05);
  // Horizontal floor lines and vertical siding
  ctx.strokeStyle = 'rgba(0,0,0,.18)';
  ctx.lineWidth = 2;
  for (let f = 1; f < floors; f++) {
    const y = (256 / floors) * f;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  // windows per floor
  for (let f = 0; f < floors; f++) {
    const fy = 18 + f * (256 / floors);
    for (let x = 24; x < 240; x += 64) {
      ctx.fillStyle = 'rgba(28,34,40,.82)';
      ctx.fillRect(x, fy, 34, 30);
      ctx.fillStyle = 'rgba(255,224,170,.25)';
      ctx.fillRect(x + 4, fy + 4, 13, 22);
      ctx.strokeStyle = trim;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, fy - 2, 38, 34);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 17, fy);
      ctx.lineTo(x + 17, fy + 30);
      ctx.stroke();
    }
  }
  // Fine plaster mottling and a restrained darker band at the building base.
  const plaster = ctx.createLinearGradient(0, 0, 256, 256);
  plaster.addColorStop(0, 'rgba(255,255,255,.09)'); plaster.addColorStop(1, 'rgba(30,26,22,.12)');
  ctx.fillStyle = plaster; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(50,43,35,.12)'; ctx.fillRect(0, 238, 256, 18);
  return toTex(c);
};

export const barkTexture = () => {
  const c = canvas(128, 256); const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#594331'; ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 128; const width = 1 + Math.random() * 5;
    ctx.fillStyle = i % 2 ? 'rgba(24,17,12,.32)' : 'rgba(213,174,119,.16)';
    ctx.fillRect(x, 0, width, 256);
  }
  for (let i = 0; i < 16; i++) {
    ctx.strokeStyle = 'rgba(30,21,14,.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); const x = Math.random() * 128; ctx.moveTo(x, Math.random() * 256); ctx.lineTo(x + (Math.random() - .5) * 10, 256); ctx.stroke();
  }
  return toTex(c, 1, 2);
};

export const foliageTexture = () => {
  const c = canvas(128, 128); const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#40583a'; ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const shade = ['#263e2e', '#58744a', '#70845a', '#344b35'][i % 4];
    ctx.fillStyle = shade; ctx.globalAlpha = 0.12 + Math.random() * 0.24;
    ctx.beginPath(); ctx.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return toTex(c);
};

export const roofTileTexture = () => {
  const c = canvas(256, 128); const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#292e35'; ctx.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 128; y += 32) for (let x = (y / 32 % 2) * 24 - 24; x < 256; x += 48) {
    const shade = 42 + Math.random() * 24;
    ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
    ctx.beginPath(); ctx.roundRect(x + 2, y + 2, 44, 28, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(5,7,10,.58)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(205,213,222,.16)'; ctx.beginPath(); ctx.moveTo(x + 6, y + 5); ctx.lineTo(x + 38, y + 5); ctx.stroke();
  }
  return toTex(c, 2, 2);
};

export const shopTexture = (sign = '茶', wall = '#786f66', lit = true) => {
  const c = canvas(384, 256);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 384, 256);
  noise(ctx, 384, 256, 0.06);

  // Sign board
  ctx.fillStyle = '#242833';
  ctx.fillRect(0, 18, 384, 62);
  ctx.fillStyle = '#f3ead7';
  ctx.font = 'bold 40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sign, 192, 50);

  // Awning stripes
  for (let x = 0; x < 384; x += 32) {
    ctx.fillStyle = x % 64 === 0 ? '#31445c' : '#d9d3c5';
    ctx.beginPath();
    ctx.moveTo(x, 92);
    ctx.lineTo(x + 32, 92);
    ctx.lineTo(x + 24, 122);
    ctx.lineTo(x - 8, 122);
    ctx.closePath();
    ctx.fill();
  }

  // Glass
  ctx.fillStyle = lit ? 'rgba(255,220,160,.55)' : 'rgba(40,55,70,.6)';
  ctx.fillRect(28, 134, 144, 98);
  ctx.fillRect(212, 134, 144, 98);
  ctx.strokeStyle = '#171a20';
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 134, 144, 98);
  ctx.strokeRect(212, 134, 144, 98);
  // Shelves inside
  ctx.strokeStyle = 'rgba(40,26,16,.8)';
  ctx.lineWidth = 3;
  [164, 190, 214].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(166, y);
    ctx.moveTo(218, y);
    ctx.lineTo(350, y);
    ctx.stroke();
  });
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = ['#a5302c', '#e0d3a2', '#315d72', '#556b3c'][i % 4];
    const side = i < 9 ? 34 : 218;
    const x = side + (i % 3) * 42 + 8;
    const y = 144 + Math.floor((i % 9) / 3) * 26;
    ctx.fillRect(x, y, 12, 18);
  }
  // Door
  ctx.fillStyle = '#2a211b';
  ctx.fillRect(180, 140, 24, 92);
  return toTex(c);
};

export const concreteTexture = () => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#55595e';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  return toTex(c, 18, 1);
};

export const asphaltTexture = () => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#22272d';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7000; i++) {
    const shade = 60 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 8},${Math.random() * 0.18})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  // cracks
  ctx.strokeStyle = 'rgba(10,12,14,.45)';
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 50;
      y += 20 + Math.random() * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return toTex(c, 30, 2);
};
