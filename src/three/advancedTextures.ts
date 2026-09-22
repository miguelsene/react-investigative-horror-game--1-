import * as THREE from 'three';

/* ============================================================
   CANVAS HELPERS FOR HIGH RESOLUTION PROCEDURAL TEXTURES
   ============================================================ */
export const mkCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export const mkTex = (c: HTMLCanvasElement, pixel = false): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (pixel) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
  } else {
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
  }
  return t;
};

const g2d = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D;

/* Subtle noise injection for authentic material feel */
const addGrain = (ctx: CanvasRenderingContext2D, w: number, h: number, count: number, maxAlpha: number, dark = true) => {
  for (let i = 0; i < count; i++) {
    const v = dark ? Math.floor(Math.random() * 50) : 200 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * maxAlpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};

/* --- 1. Dark Aged Cedar Wood Plank Texture --- */
export const makeCedarWoodTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#2b1b12';
  ctx.fillRect(0, 0, 512, 512);

  // Planks lines
  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = '#180e08';
    ctx.fillRect(0, y, 512, 3);
    // Subtle wood grain streaks
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 38, 25, 0.45)' : 'rgba(20, 12, 8, 0.55)';
      const h = 1 + Math.random() * 2;
      ctx.fillRect(0, y + 4 + i * 2, 512, h);
    }
  }
  addGrain(ctx, 512, 512, 3000, 0.08);
  const t = mkTex(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

/* --- 2. Traditional Tatami Mat Texture --- */
export const makeTatamiTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#8f9473';
  ctx.fillRect(0, 0, 512, 512);

  // Tight woven straw horizontal bands
  for (let y = 0; y < 512; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#7a7f60' : '#9ea382';
    ctx.fillRect(0, y, 512, 2);
    // Cross stitch vertical highlights
    for (let x = 0; x < 512; x += 16) {
      ctx.fillStyle = (x + y) % 32 === 0 ? 'rgba(60,65,45,0.35)' : 'rgba(180,185,150,0.2)';
      ctx.fillRect(x, y, 3, 4);
    }
  }
  addGrain(ctx, 512, 512, 2000, 0.06);
  const t = mkTex(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

/* --- 3. Shoji Washi Paper Grid Texture --- */
export const makeShojiTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  // Translucent glowing cream washi
  ctx.fillStyle = '#eae2d3';
  ctx.fillRect(0, 0, 512, 512);

  // Fiber cloudiness
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(255, 250, 240, 0.12)';
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 50, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark cedar lattice wooden grid
  ctx.fillStyle = '#22150e';
  // Vertical wood bars
  for (let x = 0; x <= 512; x += 64) {
    ctx.fillRect(x - 3, 0, 6, 512);
  }
  // Horizontal wood bars
  for (let y = 0; y <= 512; y += 128) {
    ctx.fillRect(0, y - 3, 512, 6);
  }
  // Outer frame
  ctx.fillRect(0, 0, 512, 10);
  ctx.fillRect(0, 502, 512, 10);
  ctx.fillRect(0, 0, 10, 512);
  ctx.fillRect(502, 0, 10, 512);

  const t = mkTex(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

/* --- 4. Japanese Traditional Clay Roof Tiles (Kawara) --- */
export const makeRoofKawaraTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#1c2028';
  ctx.fillRect(0, 0, 512, 512);

  // Cylindrical ridges
  for (let x = 0; x < 512; x += 40) {
    const grd = ctx.createLinearGradient(x, 0, x + 40, 0);
    grd.addColorStop(0, '#0d0f14');
    grd.addColorStop(0.3, '#333b49');
    grd.addColorStop(0.7, '#252b36');
    grd.addColorStop(1, '#0f1217');
    ctx.fillStyle = grd;
    ctx.fillRect(x, 0, 38, 512);

    // Overlapping tile seam lines
    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y, 38, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, y + 3, 38, 1);
    }
  }
  const t = mkTex(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

/* --- 5. High-Resolution Sepia Photograph (1974) --- */
export const makeDetailed1974Photo = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 640);
  const ctx = g2d(c);

  // White aged border
  ctx.fillStyle = '#e8dfcd';
  ctx.fillRect(0, 0, 512, 640);

  // Photo inner area
  const pw = 452;
  const ph = 540;
  const px = 30;
  const py = 30;

  // Sepia moody Kyoto sky and rainy rain gradient
  const skyGrd = ctx.createLinearGradient(0, py, 0, py + ph);
  skyGrd.addColorStop(0, '#786754');
  skyGrd.addColorStop(0.4, '#8c7a65');
  skyGrd.addColorStop(0.8, '#524536');
  skyGrd.addColorStop(1, '#2c231b');
  ctx.fillStyle = skyGrd;
  ctx.fillRect(px, py, pw, ph);

  // Two-story Kyoto Machiya Townhouse facade in 1974
  ctx.fillStyle = '#3a2d22';
  ctx.fillRect(px + 40, py + 120, pw - 80, ph - 160);

  // Slanted tile roof overhang
  ctx.fillStyle = '#1a130e';
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 130);
  ctx.lineTo(px + pw / 2, py + 50);
  ctx.lineTo(px + pw - 20, py + 130);
  ctx.lineTo(px + pw - 10, py + 155);
  ctx.lineTo(px + 10, py + 155);
  ctx.closePath();
  ctx.fill();

  // Second-floor Window
  ctx.fillStyle = '#16100c';
  ctx.fillRect(px + pw - 170, py + 175, 95, 120);
  ctx.fillStyle = '#bfae95';
  ctx.fillRect(px + pw - 165, py + 180, 85, 110);

  // THE EERIE FIGURE (Gabriela lookalike in 1974)
  ctx.fillStyle = '#16120e'; // Dark coat silhouette
  ctx.fillRect(px + pw - 142, py + 225, 42, 65);
  // White collar visible
  ctx.fillStyle = '#e5ddcc';
  ctx.fillRect(px + pw - 128, py + 220, 14, 6);
  // Head
  ctx.beginPath();
  ctx.arc(px + pw - 121, py + 206, 17, 0, Math.PI * 2);
  ctx.fill();
  // Neatly parted hair bangs
  ctx.fillStyle = '#0f0c09';
  ctx.fillRect(px + pw - 138, py + 195, 34, 18);
  // Tiny crimson hairclip visible under magnifying glass!
  ctx.fillStyle = '#8f2323';
  ctx.fillRect(px + pw - 110, py + 202, 5, 4);

  // Ground floor entrance & noren
  ctx.fillStyle = '#221811';
  ctx.fillRect(px + 70, py + 330, 90, 170);
  ctx.fillStyle = '#4a3b2b';
  ctx.fillRect(px + 80, py + 350, 70, 70);

  // Rain streaks on the vintage film
  for (let i = 0; i < 90; i++) {
    const rx = px + Math.random() * pw;
    const ry = py + Math.random() * ph;
    ctx.strokeStyle = 'rgba(255, 245, 230, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 8, ry + 28);
    ctx.stroke();
  }

  // Authentic film scratches & vignette
  addGrain(ctx, 512, 640, 4500, 0.22, true);
  const vig = ctx.createRadialGradient(256, 320, 160, 256, 320, 360);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(25, 18, 12, 0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(px, py, pw, ph);

  // Dated stamp on photo corner: 17.IV.1974
  ctx.fillStyle = '#a83232';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText('17.04.1974', px + pw - 130, py + ph - 16);

  return mkTex(c);
};

/* --- 6. Back of Photo with Nan-Kin Handwritten Ink Note --- */
export const makeDetailedPhotoBack = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 640);
  const ctx = g2d(c);

  // Yellowed back paper
  ctx.fillStyle = '#ded3be';
  ctx.fillRect(0, 0, 512, 640);
  addGrain(ctx, 512, 640, 3000, 0.12, true);

  // Water stain ring
  ctx.strokeStyle = 'rgba(120, 95, 60, 0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(380, 220, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Handwritten Japanese and Western fountain pen ink
  ctx.fillStyle = '#221915';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('京都 · 杉の町家', 256, 170);

  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('17 de Abril de 1974', 256, 220);

  ctx.fillStyle = '#6b1b1b';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText('“Ela continua vigiando as 03:17”', 256, 340);

  ctx.fillStyle = '#3a2d25';
  ctx.font = '14px serif';
  ctx.fillText('Arquivo da família Shinohara — Não destruir.', 256, 420);

  return mkTex(c);
};

/* --- 7. Wall Clock Dial (Vintage Enamel with Brass Rim) --- */
export const makeEnamelClockDial = (h: number, m: number, s: number): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);

  // Enamel off-white plate
  const grd = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  grd.addColorStop(0, '#fffbf2');
  grd.addColorStop(0.85, '#ede4cf');
  grd.addColorStop(1, '#c5b595');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  // Minute ticks
  ctx.strokeStyle = '#2d2218';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isHour = i % 5 === 0;
    const r1 = isHour ? 200 : 218;
    ctx.lineWidth = isHour ? 6 : 2.5;
    ctx.beginPath();
    ctx.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1);
    ctx.lineTo(256 + Math.sin(a) * 232, 256 - Math.cos(a) * 232);
    ctx.stroke();
  }

  // Roman numerals
  ctx.fillStyle = '#1f160f';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  numerals.forEach((num, idx) => {
    const a = (idx / 12) * Math.PI * 2;
    ctx.fillText(num, 256 + Math.sin(a) * 162, 256 - Math.cos(a) * 162);
  });

  // Center logo
  ctx.font = 'italic 16px serif';
  ctx.fillStyle = '#5c4a3b';
  ctx.fillText('KYOTO CLOCK CO.', 256, 310);

  // Hands (frozen at exact time)
  const hourA = ((h + m / 60) / 12) * Math.PI * 2;
  const minA = (m / 60) * Math.PI * 2;
  const secA = (s / 60) * Math.PI * 2;

  // Hour hand
  ctx.strokeStyle = '#120d09';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.sin(hourA) * 105, 256 - Math.cos(hourA) * 105);
  ctx.stroke();

  // Minute hand
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.sin(minA) * 180, 256 - Math.cos(minA) * 180);
  ctx.stroke();

  // Crimson second hand
  ctx.strokeStyle = '#b01e1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256 - Math.sin(secA) * 35, 256 + Math.cos(secA) * 35);
  ctx.lineTo(256 + Math.sin(secA) * 195, 256 - Math.cos(secA) * 195);
  ctx.stroke();

  // Center brass nut
  ctx.fillStyle = '#8f7238';
  ctx.beginPath();
  ctx.arc(256, 256, 12, 0, Math.PI * 2);
  ctx.fill();

  return mkTex(c);
};

/* --- 8. Glowing Digital LED Clock Face --- */
export const makeDigitalLedTex = (text: string): THREE.CanvasTexture => {
  const c = mkCanvas(512, 256);
  const ctx = g2d(c);
  // Dark smoked glass background
  ctx.fillStyle = '#06080c';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle segmented faint ghost grid
  ctx.fillStyle = 'rgba(255, 30, 30, 0.05)';
  ctx.font = 'bold 140px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('88:88', 256, 128);

  // Vivid crimson 7-segment LED glow
  ctx.shadowColor = '#ff2b2b';
  ctx.shadowBlur = 32;
  ctx.fillStyle = '#ff2222';
  ctx.fillText(text, 256, 128);

  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff9999';
  ctx.fillText(text, 256, 128);

  // Scanline glass overlay
  for (let y = 0; y < 256; y += 3) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, y, 512, 1);
  }

  return mkTex(c);
};

/* --- 9. Vintage Rotary Dial Number Disc --- */
export const makeRotaryDialTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);

  // Brass bevel
  ctx.fillStyle = '#9c8144';
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  // White enamel numeral ring
  ctx.fillStyle = '#f2ebe0';
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.fill();

  // Center black button
  ctx.fillStyle = '#16171a';
  ctx.beginPath();
  ctx.arc(256, 256, 80, 0, Math.PI * 2);
  ctx.fill();

  // Numbers 1 to 9, then 0 in classic Japanese Showa placement
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillStyle = '#1a1917';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  for (let i = 0; i < 10; i++) {
    // Rotated around right arc
    const a = 0.55 + (i / 10) * (Math.PI * 1.55);
    const nx = 256 + Math.cos(a) * 155;
    const ny = 256 + Math.sin(a) * 155;
    ctx.fillText(nums[i], nx, ny);
  }

  return mkTex(c);
};
