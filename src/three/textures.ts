import * as THREE from 'three';

/* ============================================================
   Procedural canvas textures (no external assets needed)
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
  }
  return t;
};

const g2d = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D;

const speckle = (ctx: CanvasRenderingContext2D, w: number, h: number, n: number, rgb: string, maxA: number) => {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rgb},${Math.random() * maxA})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};

export const softCircle = (color: string, size = 64): THREE.CanvasTexture => {
  const c = mkCanvas(size, size);
  const ctx = g2d(c);
  const g = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return mkTex(c);
};

export const clockDial = (h: number, m: number, s: number): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#efe8d8';
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.fill();
  speckle(ctx, 512, 512, 900, '90,70,40', 0.08);
  ctx.strokeStyle = '#372e24';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = i % 5 === 0 ? 206 : 224;
    ctx.lineWidth = i % 5 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1);
    ctx.lineTo(256 + Math.sin(a) * 238, 256 - Math.cos(a) * 238);
    ctx.stroke();
  }
  ctx.fillStyle = '#372e24';
  ctx.font = 'bold 60px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', 256, 66);
  ctx.fillText('3', 450, 256);
  ctx.fillText('6', 256, 450);
  ctx.fillText('9', 66, 256);
  const hourA = ((h + m / 60) / 12) * Math.PI * 2;
  const minA = (m / 60) * Math.PI * 2;
  const secA = (s / 60) * Math.PI * 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1c1510';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.sin(hourA) * 118, 256 - Math.cos(hourA) * 118);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.sin(minA) * 188, 256 - Math.cos(minA) * 188);
  ctx.stroke();
  ctx.strokeStyle = '#b3222c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256 - Math.sin(secA) * 30, 256 + Math.cos(secA) * 30);
  ctx.lineTo(256 + Math.sin(secA) * 205, 256 - Math.cos(secA) * 205);
  ctx.stroke();
  ctx.fillStyle = '#1c1510';
  ctx.beginPath();
  ctx.arc(256, 256, 12, 0, Math.PI * 2);
  ctx.fill();
  return mkTex(c);
};

export const digitalClock = (text: string): THREE.CanvasTexture => {
  const c = mkCanvas(256, 128);
  const ctx = g2d(c);
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ff3b30';
  ctx.font = 'bold 84px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff3b30';
  ctx.shadowBlur = 22;
  ctx.fillText(text, 128, 66);
  return mkTex(c);
};

export const calendarTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(440, 560);
  const ctx = g2d(c);
  ctx.fillStyle = '#f2ecdd';
  ctx.fillRect(0, 0, 440, 560);
  ctx.fillStyle = '#6b2528';
  ctx.fillRect(0, 0, 440, 64);
  ctx.fillStyle = '#f2ecdd';
  ctx.font = 'bold 34px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('京都 2019 · 四月', 220, 44);
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  ctx.font = 'bold 22px Georgia';
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? '#b3222c' : '#6b2528';
    ctx.fillText(days[i], 40 + i * 58, 104);
  }
  ctx.font = '22px Georgia';
  for (let day = 1; day <= 30; day++) {
    const idx = day;
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = 40 + col * 58;
    const y = 160 + row * 62;
    ctx.fillStyle = col === 0 ? '#b3222c' : '#33302a';
    ctx.fillText(String(day), x, y);
    if (day === 17) {
      ctx.strokeStyle = '#b3222c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 8, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 8, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#b3222c';
      ctx.font = '18px Georgia';
      ctx.fillText('霧', x, y + 22);
      ctx.fillText('門', x, y + 44);
      ctx.font = '22px Georgia';
    }
  }
  return mkTex(c);
};

export const photoFront = (): THREE.CanvasTexture => {
  const c = mkCanvas(384, 480);
  const ctx = g2d(c);
  ctx.fillStyle = '#9a8a74';
  ctx.fillRect(0, 0, 384, 480);
  ctx.fillStyle = '#5d5346';
  ctx.fillRect(0, 380, 384, 100);
  ctx.fillStyle = '#4a4138';
  ctx.fillRect(40, 120, 300, 260);
  ctx.fillStyle = '#372f28';
  ctx.beginPath();
  ctx.moveTo(20, 130);
  ctx.lineTo(190, 60);
  ctx.lineTo(360, 130);
  ctx.lineTo(360, 150);
  ctx.lineTo(20, 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#cfc4ae';
  ctx.fillRect(230, 170, 76, 96);
  ctx.fillStyle = '#8d8069';
  ctx.fillRect(238, 178, 60, 80);
  ctx.fillStyle = '#241d17';
  ctx.fillRect(252, 210, 28, 48);
  ctx.beginPath();
  ctx.arc(266, 200, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(256, 188, 20, 8);
  ctx.fillStyle = '#2e2822';
  ctx.fillRect(80, 250, 60, 130);
  ctx.fillStyle = '#cfc4ae';
  ctx.fillRect(90, 260, 40, 60);
  speckle(ctx, 384, 480, 1600, '40,30,20', 0.16);
  const g = ctx.createRadialGradient(192, 240, 120, 192, 240, 320);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,12,6,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 384, 480);
  return mkTex(c);
};

export const photoBack = (): THREE.CanvasTexture => {
  const c = mkCanvas(384, 480);
  const ctx = g2d(c);
  ctx.fillStyle = '#d8cbb0';
  ctx.fillRect(0, 0, 384, 480);
  ctx.fillStyle = '#3a2f22';
  ctx.textAlign = 'center';
  ctx.font = '28px Georgia';
  ctx.fillText('17 / 04 / 1974', 192, 200);
  ctx.font = 'italic 22px Georgia';
  ctx.fillText('Kyoto, Casa dos Cedros', 192, 245);
  ctx.fillStyle = '#7a2a2a';
  ctx.font = 'italic 20px Georgia';
  ctx.fillText('Ela continua vigiando as 03:17', 192, 320);
  speckle(ctx, 384, 480, 500, '120,95,50', 0.1);
  return mkTex(c);
};

export const tvStatic = (): { texture: THREE.CanvasTexture; update: () => void } => {
  const c = mkCanvas(96, 72);
  const ctx = g2d(c);
  const img = ctx.createImageData(96, 72);
  const texture = mkTex(c, true);
  let frame = 0;
  const update = () => {
    frame++;
    if (frame % 3 !== 0) return;
    const d = img.data;
    const bar = (frame * 2) % 90;
    for (let y = 0; y < 72; y++) {
      for (let x = 0; x < 96; x++) {
        const i = (y * 96 + x) * 4;
        let v = Math.random() * 200 + 20;
        if (y % 2 === 0) v *= 0.7;
        if (Math.abs(y - bar) < 4) v = Math.min(255, v + 70);
        d[i] = v * 0.82;
        d[i + 1] = v * 0.9;
        d[i + 2] = v;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    texture.needsUpdate = true;
  };
  update();
  return { texture, update };
};

export const kakejiku = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 768);
  const ctx = g2d(c);
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 0, 256, 768);
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 60, 256, 30);
  ctx.fillRect(0, 678, 256, 30);
  ctx.fillStyle = '#e9e1cf';
  ctx.fillRect(24, 90, 208, 588);
  for (let k = 2; k >= 0; k--) {
    ctx.fillStyle = `rgba(30,30,35,${0.85 - k * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(24, 430 + k * 50);
    ctx.lineTo(80 + k * 25, 260 + k * 45);
    ctx.lineTo(140 + k * 10, 370 + k * 40);
    ctx.lineTo(196, 300 + k * 55);
    ctx.lineTo(232, 430 + k * 50);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(233,225,207,0.75)';
  ctx.fillRect(24, 410, 208, 16);
  ctx.fillRect(24, 470, 208, 10);
  ctx.fillStyle = 'rgba(233,225,207,0.9)';
  ctx.beginPath();
  ctx.arc(70, 190, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,20,25,0.9)';
  ctx.font = 'bold 40px serif';
  ctx.textAlign = 'center';
  ctx.fillText('静', 196, 150);
  ctx.fillText('夜', 196, 200);
  ctx.fillStyle = '#b3222c';
  ctx.fillRect(40, 610, 26, 26);
  ctx.fillStyle = '#e9e1cf';
  ctx.font = '16px serif';
  ctx.fillText('印', 53, 629);
  return mkTex(c);
};

export const kyotoMap = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 384);
  const ctx = g2d(c);
  ctx.fillStyle = '#e8dfc8';
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = '#ddd2b8';
  for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * 512, Math.random() * 384, 20 + Math.random() * 40, 14 + Math.random() * 30);
  ctx.strokeStyle = '#b9ad92';
  ctx.lineWidth = 2;
  for (let x = 24; x < 512; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 20; y < 384; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#a49a80';
  ctx.lineWidth = 6;
  [168, 360].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(512, 180);
  ctx.stroke();
  ctx.strokeStyle = '#7fa0c4';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(70, 0);
  ctx.quadraticCurveTo(90, 200, 150, 384);
  ctx.stroke();
  ctx.fillStyle = '#4a4038';
  ctx.font = '13px Georgia';
  ctx.fillText('鴨川', 100, 90);
  ctx.fillText('御所', 250, 60);
  ctx.fillText('東山', 430, 250);
  ctx.fillText('左京区', 300, 330);
  const pins: [number, number][] = [[210, 120], [330, 96], [400, 210], [260, 260], [190, 300]];
  ctx.strokeStyle = '#b3222c';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  pins.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
  pins.forEach(([x, y]) => {
    ctx.fillStyle = '#b3222c';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = '#b3222c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(300, 200, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#b3222c';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('CASA', 322, 204);
  ctx.fillText('03:17', 440, 370);
  ctx.strokeStyle = '#4a4038';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(470, 40, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#4a4038';
  ctx.font = 'bold 12px Georgia';
  ctx.fillText('N', 465, 26);
  return mkTex(c);
};

export const corkboardTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 320);
  const ctx = g2d(c);
  ctx.fillStyle = '#b8895a';
  ctx.fillRect(0, 0, 512, 320);
  speckle(ctx, 512, 320, 5000, '70,40,20', 0.25);
  const cards: [number, number, number, string][] = [
    [40, 40, -0.05, '06:43 despertar'],
    [200, 30, 0.04, '07:00 café · obaasan'],
    [360, 50, -0.03, '16:20 retorno'],
    [90, 180, 0.06, '18:00 investigação'],
    [300, 190, -0.04, '23:00 luzes apagadas'],
  ];
  const pinPts: [number, number][] = [];
  cards.forEach(([x, y, rot, text]) => {
    ctx.save();
    ctx.translate(x + 60, y + 40);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-58, -36, 124, 84);
    ctx.fillStyle = '#f5f1e6';
    ctx.fillRect(-60, -40, 124, 84);
    ctx.strokeStyle = '#9db6d6';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-52, -12 + i * 18);
      ctx.lineTo(56, -12 + i * 18);
      ctx.stroke();
    }
    ctx.fillStyle = '#2b2b33';
    ctx.font = '11px monospace';
    ctx.fillText(text, -52, -16);
    ctx.restore();
    pinPts.push([x + 60, y + 4]);
  });
  ctx.strokeStyle = '#c0262e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  pinPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  pinPts.forEach(([x, y], i) => {
    ctx.fillStyle = ['#c0262e', '#2b5fb3', '#e0a020', '#c0262e', '#2f8f4a'][i];
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  return mkTex(c);
};

export const norenTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#25324d';
  ctx.fillRect(0, 0, 256, 512);
  speckle(ctx, 256, 512, 2500, '255,255,255', 0.05);
  ctx.strokeStyle = '#eef0f4';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(128, 200, 62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#eef0f4';
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('茶', 128, 204);
  return mkTex(c);
};

export const familyPhotoTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 192);
  const ctx = g2d(c);
  const grd = ctx.createLinearGradient(0, 0, 0, 192);
  grd.addColorStop(0, '#9c8c76');
  grd.addColorStop(1, '#6f6253');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = '#4a4138';
  ctx.fillRect(40, 60, 180, 90);
  ctx.fillStyle = '#5d5346';
  ctx.fillRect(0, 150, 256, 42);
  const fig = (x: number, h: number, w: number) => {
    ctx.fillStyle = '#2b241f';
    ctx.fillRect(x - w / 2, 160 - h, w, h);
    ctx.beginPath();
    ctx.arc(x, 160 - h - 10, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
  };
  fig(90, 70, 26);
  fig(128, 78, 28);
  fig(165, 44, 18);
  speckle(ctx, 256, 192, 900, '40,30,20', 0.16);
  ctx.strokeStyle = '#efe6d2';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 256, 192);
  return mkTex(c);
};

export const radioDialTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 96);
  const ctx = g2d(c);
  ctx.fillStyle = '#e6dcc3';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#3a3128';
  ctx.font = '14px monospace';
  ['88', '92', '96', '100', '104', '108'].forEach((n, i) => ctx.fillText(n, 14 + i * 40, 34));
  ctx.strokeStyle = '#3a3128';
  for (let x = 10; x < 250; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 46);
    ctx.lineTo(x, x % 40 === 10 ? 66 : 56);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c0262e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 8);
  ctx.lineTo(150, 88);
  ctx.stroke();
  return mkTex(c);
};

export const rugTex = (kind: 'red' | 'blue'): THREE.CanvasTexture => {
  const c = mkCanvas(256, 512);
  const ctx = g2d(c);
  ctx.fillStyle = kind === 'red' ? '#6b2528' : '#2f3f5f';
  ctx.fillRect(0, 0, 256, 512);
  speckle(ctx, 256, 512, 3000, '0,0,0', 0.15);
  ctx.strokeStyle = kind === 'red' ? '#d9c39a' : '#c9d2e3';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 228, 484);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, 188, 444);
  ctx.strokeStyle = kind === 'red' ? '#b8894f' : '#8fa3c7';
  for (let y = 80; y < 470; y += 60) {
    ctx.beginPath();
    ctx.moveTo(128, y - 22);
    ctx.lineTo(160, y);
    ctx.lineTo(128, y + 22);
    ctx.lineTo(96, y);
    ctx.closePath();
    ctx.stroke();
  }
  return mkTex(c);
};

export const rainStreaks = (): THREE.CanvasTexture => {
  const c = mkCanvas(128, 256);
  const ctx = g2d(c);
  ctx.clearRect(0, 0, 128, 256);
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 256;
    const len = 18 + Math.random() * 50;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(210,230,255,0)');
    g.addColorStop(0.7, 'rgba(210,230,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1.5, len);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x + 0.7, y + len, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = mkTex(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

export const doorPlate = (text: string): THREE.CanvasTexture => {
  const c = mkCanvas(256, 96);
  const ctx = g2d(c);
  ctx.fillStyle = '#5a3f2a';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let y = 6; y < 96; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f0e6d2';
  ctx.font = 'bold 40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 50);
  return mkTex(c);
};

export const scheduleTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 384);
  const ctx = g2d(c);
  ctx.fillStyle = '#f1ecdf';
  ctx.fillRect(0, 0, 256, 384);
  ctx.fillStyle = '#2b2b33';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('ROTINA', 22, 40);
  ctx.fillRect(22, 48, 90, 2);
  const rows = ['06:43  despertar', '07:00  café', '07:40  saída', '08:10  aula', '16:20  retorno', '18:00  investigar', '23:00  dormir'];
  ctx.font = '15px monospace';
  rows.forEach((r, i) => {
    ctx.fillStyle = '#2b2b33';
    ctx.fillText(r, 22, 90 + i * 36);
    ctx.strokeStyle = '#c0262e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(214, 84 + i * 36);
    ctx.lineTo(220, 92 + i * 36);
    ctx.lineTo(232, 76 + i * 36);
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(192,38,46,0.6)';
  ctx.font = 'italic 13px monospace';
  ctx.fillText('sem desvios: 214 dias', 22, 352);
  return mkTex(c);
};

export const fusumaTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(512, 512);
  const ctx = g2d(c);
  ctx.fillStyle = '#e8dfc9';
  ctx.fillRect(0, 0, 512, 512);
  speckle(ctx, 512, 512, 1500, '120,100,60', 0.06);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = 'rgba(203,177,122,0.35)';
    ctx.beginPath();
    ctx.ellipse(60 + Math.random() * 400, 80 + Math.random() * 360, 90 + Math.random() * 60, 24 + Math.random() * 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#3f5a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 420);
  ctx.quadraticCurveTo(180, 300, 300, 330);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const x = 120 + i * 13;
    const y = 372 - i * 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y - 24);
    ctx.stroke();
  }
  return mkTex(c);
};

export const noteTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(128, 128);
  const ctx = g2d(c);
  ctx.fillStyle = '#f5e27a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#3a3128';
  ctx.font = '12px serif';
  ['Gabriela —', 'o guarda-chuva', 'está na entrada.', '', '— Obaasan'].forEach((l, i) => ctx.fillText(l, 10, 26 + i * 18));
  return mkTex(c);
};

export const catFrames = (): { walk: THREE.CanvasTexture[]; sit: THREE.CanvasTexture } => {
  const draw = (pose: 'w0' | 'w1' | 'sit') => {
    const c = mkCanvas(32, 24);
    const ctx = g2d(c);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#111114';
    if (pose === 'sit') {
      ctx.fillRect(10, 8, 12, 12);
      ctx.fillRect(8, 3, 10, 9);
      ctx.fillRect(8, 1, 3, 3);
      ctx.fillRect(15, 1, 3, 3);
      ctx.fillRect(22, 14, 6, 3);
      ctx.fillStyle = '#e8e2d5';
      ctx.fillRect(12, 12, 6, 6);
      ctx.fillStyle = '#e6c04a';
      ctx.fillRect(10, 6, 2, 2);
      ctx.fillRect(14, 6, 2, 2);
    } else {
      ctx.fillRect(6, 10, 18, 8);
      ctx.fillRect(20, 5, 9, 9);
      ctx.fillRect(21, 3, 3, 3);
      ctx.fillRect(26, 3, 3, 3);
      ctx.fillRect(2, 6, 4, 6);
      ctx.fillRect(1, 4, 3, 3);
      const a = pose === 'w0' ? 0 : 2;
      ctx.fillRect(8 + a, 18, 3, 5);
      ctx.fillRect(13 - a, 18, 3, 5);
      ctx.fillRect(17 + a, 18, 3, 5);
      ctx.fillRect(21 - a, 18, 3, 5);
      ctx.fillStyle = '#e8e2d5';
      ctx.fillRect(14, 14, 5, 4);
      ctx.fillStyle = '#e6c04a';
      ctx.fillRect(26, 8, 2, 2);
    }
    return mkTex(c, true);
  };
  return { walk: [draw('w0'), draw('w1')], sit: draw('sit') };
};

export const chiyoTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(64, 96);
  const ctx = g2d(c);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c7ced8';
  ctx.fillRect(24, 6, 16, 10);
  ctx.fillRect(22, 12, 20, 16);
  ctx.fillStyle = '#aab2bf';
  ctx.fillRect(22, 12, 4, 16);
  ctx.fillStyle = '#f2dfcc';
  ctx.fillRect(25, 18, 14, 14);
  ctx.fillStyle = '#334155';
  ctx.fillRect(27, 24, 3, 2);
  ctx.fillRect(34, 24, 3, 2);
  ctx.fillStyle = '#c9a08a';
  ctx.fillRect(27, 28, 10, 1);
  ctx.fillStyle = '#4d5a6b';
  ctx.fillRect(20, 32, 24, 48);
  ctx.fillStyle = '#5d6c80';
  ctx.fillRect(20, 32, 5, 48);
  ctx.fillStyle = '#eef1f4';
  ctx.fillRect(24, 38, 16, 40);
  ctx.fillStyle = '#d8dde3';
  ctx.fillRect(24, 38, 16, 4);
  ctx.fillStyle = '#8b6b4a';
  ctx.fillRect(23, 82, 7, 4);
  ctx.fillRect(34, 82, 7, 4);
  return mkTex(c, true);
};

export const gabrielaFallback = (facing: string, walk: number): THREE.CanvasTexture => {
  const c = mkCanvas(64, 96);
  const ctx = g2d(c);
  ctx.imageSmoothingEnabled = false;
  const isOdd = walk % 2 !== 0;
  ctx.fillStyle = '#2a1d16';
  ctx.fillRect(19, 8, 26, 24);
  ctx.fillStyle = '#1f1510';
  ctx.fillRect(17, 10, 5, 28);
  ctx.fillRect(42, 10, 5, 28);
  if (facing === 'up') {
    ctx.fillStyle = '#241812';
    ctx.fillRect(19, 12, 26, 20);
  } else {
    ctx.fillStyle = '#f6e3d3';
    ctx.fillRect(22, 16, 20, 18);
    ctx.fillStyle = '#1e293b';
    if (facing === 'down') {
      ctx.fillRect(25, 23, 4, 3);
      ctx.fillRect(35, 23, 4, 3);
    } else if (facing === 'left') {
      ctx.fillRect(24, 23, 4, 3);
    } else {
      ctx.fillRect(36, 23, 4, 3);
    }
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(facing === 'right' ? 25 : 37, 12, 4, 3);
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(28, 34, 8, 4);
  ctx.fillStyle = '#1c2333';
  ctx.fillRect(18, 38, 28, 28);
  ctx.fillStyle = '#252e44';
  ctx.fillRect(18, 38, 6, 28);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(31, 45, 2, 2);
  ctx.fillRect(31, 53, 2, 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(15, 50, 4, 3);
  ctx.fillStyle = '#0e1526';
  ctx.fillRect(20, 66, 24, 10);
  ctx.fillStyle = '#1a2338';
  for (let i = 0; i < 4; i++) ctx.fillRect(22 + i * 6, 66, 2, 10);
  const lo = walk ? (isOdd ? 3 : -3) : 0;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(24, 76, 6, 12 + lo);
  ctx.fillRect(34, 76, 6, 12 - lo);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(23, 87 + lo, 8, 5);
  ctx.fillRect(33, 87 - lo, 8, 5);
  return mkTex(c, true);
};

export const artDisplayTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(256, 192);
  const ctx = g2d(c);
  // Abstract art display
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, 256, 192);
  // Colorful abstract shapes
  const colors = ['#c0262e', '#2b5fb3', '#e0a020', '#3f7a46', '#8a6a3a'];
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    const x = 20 + i * 45 + Math.random() * 20;
    const y = 30 + Math.random() * 120;
    const w = 40 + Math.random() * 30;
    const h = 30 + Math.random() * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  });
  // Brush strokes texture
  ctx.strokeStyle = 'rgba(100,80,60,0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 192);
    ctx.lineTo(Math.random() * 256, Math.random() * 192);
    ctx.stroke();
  }
  return mkTex(c);
};

export const firstAidTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(128, 96);
  const ctx = g2d(c);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, 128, 96);
  ctx.fillStyle = '#c0262e';
  ctx.fillRect(10, 10, 108, 76);
  ctx.fillStyle = '#f5f5f5';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', 64, 48);
  return mkTex(c);
};

export const telephoneDialTex = (): THREE.CanvasTexture => {
  const c = mkCanvas(128, 128);
  const ctx = g2d(c);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fill();
  // Numbers around the dial
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  numbers.forEach((n, i) => {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = 64 + Math.cos(angle) * 35;
    const y = 64 + Math.sin(angle) * 35;
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n, x, y);
  });
  return mkTex(c);
};
