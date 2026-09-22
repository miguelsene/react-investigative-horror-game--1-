import * as THREE from 'three';

/* ============================================================
   ILLUSTRATED CHARACTER RENDERER (soft anime painting)
   ------------------------------------------------------------
   Characters are drawn with anti-aliased Bezier curves, soft
   gradients and a hairline ink outline on a 192×268 canvas —
   no pixel grid. Reads like a painted character sheet.
     Gabriela: walk 8 frames × 4 dirs, idle 6 frames × 4 dirs
     Chiyo:    idle 8 frames (breathing, blinking, stirring)
   ============================================================ */

export type Dir = 'down' | 'up' | 'left' | 'right';
const W = 160;
const H = 224;
export const ART_ASPECT = W / H;
const INK = 'rgba(18,12,16,0.78)';
type Ctx = CanvasRenderingContext2D;

const mkTex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  return t;
};

const shape = (
  ctx: Ctx,
  path: (c: Ctx) => void,
  fill: string | CanvasGradient,
  o: { shadeX?: [number, number]; shadeA?: number; line?: number; stroke?: boolean; shadeY?: [number, number]; soft?: boolean } = {}
) => {
  ctx.beginPath();
  path(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (o.shadeX || o.shadeY) {
    ctx.save();
    ctx.clip();
    const g = o.shadeX
      ? ctx.createLinearGradient(o.shadeX[0], 0, o.shadeX[1], 0)
      : ctx.createLinearGradient(0, o.shadeY![0], 0, o.shadeY![1]);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${o.shadeA ?? 0.28})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // soft highlight band on the lit side
    if (o.soft !== false) {
      const h = o.shadeX
        ? ctx.createLinearGradient(o.shadeX[1], 0, o.shadeX[0], 0)
        : ctx.createLinearGradient(0, o.shadeY![1], 0, o.shadeY![0]);
      h.addColorStop(0, 'rgba(255,255,255,0)');
      h.addColorStop(1, 'rgba(255,245,235,0.10)');
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
  if (o.stroke !== false) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = o.line ?? 1.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
};

/** thick rounded stroke = limb; ink underlay + colour + soft shade band */
const limb = (ctx: Ctx, pts: number[][], r: number, color: string, shade: string, ink = true) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      // smooth through midpoints for less polygonal limbs
      if (i < pts.length - 1) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      } else {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
    }
  };
  if (ink) {
    trace();
    ctx.lineWidth = r * 2 + 2.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  trace();
  ctx.lineWidth = r * 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  // soft shade band
  ctx.save();
  ctx.translate(r * 0.28, r * 0.08);
  trace();
  ctx.lineWidth = r * 0.9;
  ctx.strokeStyle = shade;
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.restore();
  // soft highlight
  ctx.save();
  ctx.translate(-r * 0.22, -r * 0.06);
  trace();
  ctx.lineWidth = r * 0.55;
  ctx.strokeStyle = 'rgba(255,245,235,0.18)';
  ctx.stroke();
  ctx.restore();
};

const ell = (cx: number, cy: number, rx: number, ry: number) => (c: Ctx) => c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
const rrect = (x: number, y: number, w: number, h: number, r: number) => (c: Ctx) => {
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
};

/* ---------------- palettes ---------------- */
const G = {
  hair: '#2b1c14',
  hairS: '#170e0a',
  hairL: '#5b3f2d',
  skin: '#f8e3d2',
  skinS: '#e3c0a9',
  coat: '#1d2740',
  coatS: '#111827',
  coatL: '#33416a',
  shirt: '#f7f7f9',
  tie: '#a3252c',
  skirt: '#171d2c',
  skirtS: '#0b0e16',
  tight: '#2a3142',
  tightS: '#181c27',
  shoe: '#0c0d12',
  shoeL: '#3a3d48',
  clip: '#d1262e',
  clipL: '#ff7b7b',
  watch: '#cfd8e2',
  iris: '#1d2b45',
  mouth: '#b97b76',
  blush: 'rgba(233,150,140,0.35)',
};

const C = {
  hair: '#b9c0ca',
  hairS: '#8f98a5',
  hairL: '#e9edf2',
  pin: '#7a4f2c',
  skin: '#f3dccb',
  skinS: '#d9b8a2',
  kimono: '#33425e',
  kimonoS: '#212b40',
  kimonoL: '#4a5b7e',
  apron: '#f3f4f6',
  apronS: '#d3d8df',
  obi: '#7d2e2e',
  ladle: '#6b4a2c',
  ladleL: '#a07a4e',
  iris: '#2e3646',
  mouth: '#9f6c60',
  wrinkle: 'rgba(150,110,90,0.55)',
};

/* ---------------- shared face bits ---------------- */
const eye = (ctx: Ctx, x: number, y: number, w: number, h: number, iris: string, blink: boolean, lookX = 0) => {
  if (blink) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, y + 1);
    ctx.quadraticCurveTo(x, y + 4, x + w, y + 1);
    ctx.stroke();
    return;
  }
  // white
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y - h * 1.4, x + w, y);
  ctx.quadraticCurveTo(x, y + h, x - w, y);
  ctx.closePath();
  ctx.fillStyle = '#fbfbfd';
  ctx.fill();
  // iris
  ctx.save();
  ctx.clip();
  const g = ctx.createRadialGradient(x + lookX, y + 1, 1, x + lookX, y + 1, h * 0.95);
  g.addColorStop(0, '#5d76a6');
  g.addColorStop(0.6, iris);
  g.addColorStop(1, '#0d1320');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x + lookX, y + 1, h * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0e17';
  ctx.beginPath();
  ctx.arc(x + lookX, y + 1.2, h * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(x + lookX - h * 0.35, y - h * 0.2, h * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // lashes (heavier upper lid gives the cool, half-lidded look)
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x - w - 1, y + 0.5);
  ctx.quadraticCurveTo(x, y - h * 1.35, x + w + 1, y + 0.5);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(24,16,22,0.5)';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.7, y + h * 0.6);
  ctx.quadraticCurveTo(x, y + h * 0.95, x + w * 0.7, y + h * 0.6);
  ctx.stroke();
};

const brow = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
};

/* ============================================================
   GABRIELA
   ============================================================ */
interface Pose {
  swing: number; // -1..1  (legs/arms)
  bob: number; // 0..1 vertical bounce
  breath: number; // -1..1
  blink: boolean;
  sway: number; // hair sway px
  moving: boolean;
}

const gabrielaFront = (ctx: Ctx, p: Pose, back: boolean) => {
  const yb = -p.bob * 3 + p.breath * 1.2;
  const cx = 80;
  const s = p.swing;
  const flare = p.moving ? 4 : 0;

  // ---- legs ----
  const hipY = 168 + yb;
  const liftL = Math.max(0, -s);
  const liftR = Math.max(0, s);
  const legs = [
    { hx: cx - 10, lift: liftL, fwd: s > 0 },
    { hx: cx + 10, lift: liftR, fwd: s < 0 },
  ].sort((a, b) => (a.fwd ? 1 : 0) - (b.fwd ? 1 : 0)); // back leg first
  legs.forEach((L) => {
    const kneeY = 188 + yb - L.lift * 4;
    const ankleY = 207 - L.lift * 9;
    const kx = L.hx + (L.fwd ? 0 : (L.hx < cx ? -2 : 2));
    limb(ctx, [[L.hx, hipY], [kx, kneeY], [L.hx, ankleY]], 6.5, L.fwd ? G.tight : G.tightS, G.tightS);
    // shoe
    shape(ctx, rrect(L.hx - 8, ankleY - 3, 16, 9, 4), G.shoe, { line: 1.6 });
    shape(ctx, rrect(L.hx - 5, ankleY - 2, 6, 2.5, 1), G.shoeL, { stroke: false });
  });

  // ---- skirt ----
  const sy = 136 + yb;
  shape(
    ctx,
    (c) => {
      c.moveTo(cx - 21, sy);
      c.lineTo(cx + 21, sy);
      c.quadraticCurveTo(cx + 26 + flare, sy + 22, cx + 30 + flare, sy + 36);
      c.quadraticCurveTo(cx, sy + 42, cx - 30 - flare, sy + 36);
      c.quadraticCurveTo(cx - 26 - flare, sy + 22, cx - 21, sy);
    },
    G.skirt,
    { shadeX: [cx - 10, cx + 30] }
  );
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 8, sy + 2);
    ctx.lineTo(cx + i * (10 + flare * 0.6), sy + 35);
    ctx.stroke();
  }

  // ---- torso / blazer ----
  const ty = 90 + yb;
  shape(
    ctx,
    (c) => {
      c.moveTo(cx - 27, ty + 6);
      c.quadraticCurveTo(cx - 28, ty, cx - 20, ty - 2);
      c.lineTo(cx + 20, ty - 2);
      c.quadraticCurveTo(cx + 28, ty, cx + 27, ty + 6);
      c.lineTo(cx + 22, ty + 50);
      c.lineTo(cx - 22, ty + 50);
      c.closePath();
    },
    G.coat,
    { shadeX: [cx - 4, cx + 30] }
  );
  if (!back) {
    // shirt V + lapels + ribbon
    shape(
      ctx,
      (c) => {
        c.moveTo(cx - 11, ty - 2);
        c.lineTo(cx + 11, ty - 2);
        c.lineTo(cx, ty + 22);
      },
      G.shirt,
      { stroke: false }
    );
    shape(ctx, (c) => { c.moveTo(cx - 18, ty - 2); c.lineTo(cx - 10, ty - 2); c.lineTo(cx - 2, ty + 26); c.lineTo(cx - 14, ty + 18); }, G.coatL, { line: 1.4 });
    shape(ctx, (c) => { c.moveTo(cx + 18, ty - 2); c.lineTo(cx + 10, ty - 2); c.lineTo(cx + 2, ty + 26); c.lineTo(cx + 14, ty + 18); }, G.coatL, { line: 1.4 });
    // ribbon tie
    shape(ctx, (c) => { c.moveTo(cx, ty + 6); c.lineTo(cx - 7, ty + 2); c.lineTo(cx - 6, ty + 10); }, G.tie, { line: 1.2 });
    shape(ctx, (c) => { c.moveTo(cx, ty + 6); c.lineTo(cx + 7, ty + 2); c.lineTo(cx + 6, ty + 10); }, G.tie, { line: 1.2 });
    shape(ctx, rrect(cx - 2, ty + 8, 4, 12, 1.5), G.tie, { line: 1.2 });
    // buttons
    ctx.fillStyle = '#d7b34a';
    [ty + 28, ty + 40].forEach((by) => {
      ctx.beginPath();
      ctx.arc(cx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // pocket line
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + 8, ty + 28);
    ctx.lineTo(cx + 18, ty + 28);
    ctx.stroke();
  } else {
    // back seam + white collar edge
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, ty + 2);
    ctx.lineTo(cx, ty + 48);
    ctx.stroke();
    shape(ctx, rrect(cx - 12, ty - 6, 24, 6, 2), G.shirt, { line: 1.4 });
  }

  // ---- arms ----
  const armDef = [
    { sx: cx - 25, ex: cx - 31, sw: -s },
    { sx: cx + 25, ex: cx + 31, sw: s },
  ];
  armDef.forEach((a) => {
    const handY = 148 + yb + a.sw * 7;
    const elbowY = 122 + yb + a.sw * 3;
    const elbowX = a.ex + (a.sw > 0 ? (a.sx < cx ? 3 : -3) : 0);
    limb(ctx, [[a.sx, ty + 4], [elbowX, elbowY], [a.ex, handY]], 6.5, G.coat, G.coatS);
    // cuff + hand
    ctx.fillStyle = G.shirt;
    ctx.fillRect(a.ex - 5.5, handY - 3, 11, 3);
    shape(ctx, ell(a.ex, handY + 5, 5.5, 6), G.skin, { shadeX: [a.ex - 3, a.ex + 6], line: 1.6 });
    if (!back && a.sx < cx) {
      // wristwatch on left wrist
      shape(ctx, rrect(a.ex - 6, handY - 6, 12, 4, 1.5), G.watch, { line: 1.2 });
      ctx.fillStyle = '#1b2233';
      ctx.beginPath();
      ctx.arc(a.ex, handY - 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ---- neck ----
  shape(ctx, rrect(cx - 6, 76 + yb, 12, 16, 3), G.skinS, { stroke: false });

  // ---- hair back mass ----
  const hy = 50 + yb;
  const sw = p.sway;
  shape(ctx, (c) => {
    c.moveTo(cx - 34 + sw, hy + 10);
    c.quadraticCurveTo(cx - 36 + sw, hy - 30, cx, hy - 36);
    c.quadraticCurveTo(cx + 36 + sw, hy - 30, cx + 34 + sw, hy + 10);
    c.quadraticCurveTo(cx + 36 + sw * 1.4, hy + 55, cx + 26 + sw * 1.6, hy + 80);
    c.lineTo(cx + 12, hy + 74);
    c.lineTo(cx - 12, hy + 74);
    c.lineTo(cx - 26 + sw * 1.6, hy + 80);
    c.quadraticCurveTo(cx - 36 + sw * 1.4, hy + 55, cx - 34 + sw, hy + 10);
  }, back ? G.hair : G.hairS, { shadeX: [cx - 10, cx + 36] });

  if (!back) {
    // face
    shape(ctx, (c) => {
      c.moveTo(cx - 25, hy - 8);
      c.quadraticCurveTo(cx - 26, hy + 18, cx - 12, hy + 30);
      c.quadraticCurveTo(cx, hy + 38, cx + 12, hy + 30);
      c.quadraticCurveTo(cx + 26, hy + 18, cx + 25, hy - 8);
      c.quadraticCurveTo(cx + 22, hy - 30, cx, hy - 32);
      c.quadraticCurveTo(cx - 22, hy - 30, cx - 25, hy - 8);
    }, G.skin, { shadeX: [cx + 2, cx + 26], shadeA: 0.22 });
    // ears
    shape(ctx, ell(cx - 26, hy + 6, 4, 6), G.skin, { line: 1.4 });
    shape(ctx, ell(cx + 26, hy + 6, 4, 6), G.skin, { line: 1.4 });
    // blush, nose, mouth
    ctx.fillStyle = G.blush;
    ctx.beginPath();
    ctx.ellipse(cx - 15, hy + 14, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 15, hy + 14, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,70,0.7)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + 1, hy + 12);
    ctx.lineTo(cx + 2.5, hy + 16);
    ctx.stroke();
    ctx.strokeStyle = G.mouth;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 5, hy + 24);
    ctx.lineTo(cx + 5, hy + 24);
    ctx.stroke();
    // eyes + brows
    eye(ctx, cx - 12, hy + 4, 8, 5, G.iris, p.blink);
    eye(ctx, cx + 12, hy + 4, 8, 5, G.iris, p.blink);
    brow(ctx, cx - 20, hy - 6, cx - 6, hy - 7, G.hairS);
    brow(ctx, cx + 6, hy - 7, cx + 20, hy - 6, G.hairS);
    // bangs (middle part, two sweeping lobes) + side locks
    shape(ctx, (c) => {
      c.moveTo(cx, hy - 34);
      c.quadraticCurveTo(cx - 30, hy - 34, cx - 30, hy - 4);
      c.quadraticCurveTo(cx - 32, hy + 12, cx - 24, hy + 22);
      c.quadraticCurveTo(cx - 20, hy + 6, cx - 12, hy - 2);
      c.quadraticCurveTo(cx - 6, hy - 10, cx, hy - 18);
    }, G.hair, { shadeX: [cx - 30, cx - 6], shadeA: 0.18 });
    shape(ctx, (c) => {
      c.moveTo(cx, hy - 34);
      c.quadraticCurveTo(cx + 30, hy - 34, cx + 30, hy - 4);
      c.quadraticCurveTo(cx + 32, hy + 12, cx + 24, hy + 22);
      c.quadraticCurveTo(cx + 20, hy + 6, cx + 12, hy - 2);
      c.quadraticCurveTo(cx + 6, hy - 10, cx, hy - 18);
    }, G.hair, { shadeX: [cx + 6, cx + 32], shadeA: 0.35 });
    // sheen
    ctx.strokeStyle = 'rgba(255,225,200,0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 22, hy - 22);
    ctx.quadraticCurveTo(cx - 12, hy - 30, cx - 4, hy - 28);
    ctx.stroke();
    // side locks (long strands, sway)
    limb(ctx, [[cx - 28, hy + 2], [cx - 31 + sw, hy + 40], [cx - 29 + sw * 1.5, hy + 72]], 5, G.hair, G.hairS);
    limb(ctx, [[cx + 28, hy + 2], [cx + 31 + sw, hy + 40], [cx + 29 + sw * 1.5, hy + 72]], 5, G.hair, G.hairS);
    // crimson hair clip (her left temple)
    ctx.save();
    ctx.translate(cx - 22, hy - 4);
    ctx.rotate(-0.5);
    shape(ctx, rrect(-7, -2.2, 14, 4.4, 2), G.clip, { line: 1.2 });
    ctx.fillStyle = G.clipL;
    ctx.fillRect(-5, -1.4, 6, 1.4);
    ctx.restore();
  } else {
    // back of head: part + sheen + clip peeking on her left (viewer right)
    ctx.strokeStyle = G.hairS;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + sw * 0.3, hy - 36);
    ctx.lineTo(cx + sw * 0.3, hy - 12);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,225,200,0.28)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 22, hy - 16);
    ctx.quadraticCurveTo(cx, hy - 24, cx + 22, hy - 16);
    ctx.stroke();
    shape(ctx, rrect(cx + 24, hy - 2, 5, 9, 2), G.clip, { line: 1.2 });
  }
};

const gabrielaSide = (ctx: Ctx, p: Pose) => {
  const yb = -p.bob * 3 + p.breath * 1.2;
  const cx = 78;
  const s = p.swing;
  const lean = p.moving ? -3 : 0;
  const sw = p.sway;

  // far arm (behind)
  const ty = 90 + yb;
  {
    const handX = cx + 4 + s * 14;
    limb(ctx, [[cx + 6 + lean, ty + 4], [cx + 6 + s * 8, ty + 32], [handX, ty + 58]], 6, G.coatS, G.coatS);
    shape(ctx, ell(handX, ty + 63, 5, 5.5), G.skinS, { line: 1.4 });
  }
  // far leg (behind)
  const hipY = 168 + yb;
  {
    const f = -s; // far leg opposite
    const kneeX = cx + 2 - f * 9;
    const kneeY = 188 + yb - Math.max(0, f) * 4;
    const ankX = cx + 2 - f * 15;
    const ankY = 207 - Math.max(0, f) * 5;
    limb(ctx, [[cx + 2, hipY], [kneeX, kneeY], [ankX, ankY]], 6.5, G.tightS, G.tightS);
    shape(ctx, rrect(ankX - 13, ankY - 3, 21, 9, 4), G.shoe, { line: 1.6 });
  }
  // hair back mass (behind torso)
  const hy = 50 + yb;
  shape(ctx, (c) => {
    c.moveTo(cx - 8, hy - 34);
    c.quadraticCurveTo(cx + 34, hy - 34, cx + 30 + sw, hy + 10);
    c.quadraticCurveTo(cx + 30 + sw * 1.5, hy + 50, cx + 20 + sw * 2, hy + 84);
    c.lineTo(cx + 2 + sw, hy + 80);
    c.quadraticCurveTo(cx + 4, hy + 40, cx - 2, hy + 10);
  }, G.hairS, { shadeX: [cx, cx + 32] });

  // torso
  shape(ctx, (c) => {
    c.moveTo(cx - 18 + lean, ty - 2);
    c.lineTo(cx + 14 + lean, ty - 2);
    c.quadraticCurveTo(cx + 18 + lean, ty + 2, cx + 17, ty + 10);
    c.lineTo(cx + 14, ty + 50);
    c.lineTo(cx - 14, ty + 50);
    c.lineTo(cx - 19 + lean, ty + 10);
    c.quadraticCurveTo(cx - 20 + lean, ty + 2, cx - 18 + lean, ty - 2);
  }, G.coat, { shadeX: [cx - 6, cx + 18] });
  // collar / shirt sliver / tie
  shape(ctx, (c) => { c.moveTo(cx - 17 + lean, ty - 2); c.lineTo(cx - 6 + lean, ty - 2); c.lineTo(cx - 12 + lean, ty + 12); }, G.shirt, { line: 1.2 });
  shape(ctx, rrect(cx - 15 + lean, ty + 4, 3, 9, 1), G.tie, { line: 1 });
  ctx.fillStyle = '#d7b34a';
  ctx.beginPath();
  ctx.arc(cx - 13 + lean * 0.5, ty + 30, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // skirt (swings)
  const sy = 136 + yb;
  const kick = s * 4;
  shape(ctx, (c) => {
    c.moveTo(cx - 17, sy);
    c.lineTo(cx + 17, sy);
    c.quadraticCurveTo(cx + 22 - kick, sy + 22, cx + 26 - kick * 1.5, sy + 36);
    c.quadraticCurveTo(cx, sy + 41, cx - 26 - kick * 1.5, sy + 36);
    c.quadraticCurveTo(cx - 22 - kick, sy + 22, cx - 17, sy);
  }, G.skirt, { shadeX: [cx - 8, cx + 26] });
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 9, sy + 2);
    ctx.lineTo(cx + i * 11 - kick, sy + 35);
    ctx.stroke();
  }

  // near leg (front)
  {
    const f = s;
    const kneeX = cx - 2 - f * 9;
    const kneeY = 188 + yb - Math.max(0, f) * 4;
    const ankX = cx - 2 - f * 15;
    const ankY = 207 - Math.max(0, f) * 5;
    limb(ctx, [[cx - 2, hipY], [kneeX, kneeY], [ankX, ankY]], 6.5, G.tight, G.tightS);
    shape(ctx, rrect(ankX - 13, ankY - 3, 21, 9, 4), G.shoe, { line: 1.6 });
    shape(ctx, rrect(ankX - 9, ankY - 2, 7, 2.5, 1), G.shoeL, { stroke: false });
  }
  // near arm (front)
  {
    const handX = cx - 6 - s * 14;
    limb(ctx, [[cx - 6 + lean, ty + 4], [cx - 6 - s * 8, ty + 32], [handX, ty + 58]], 6.5, G.coat, G.coatS);
    ctx.fillStyle = G.shirt;
    ctx.fillRect(handX - 5.5, ty + 55, 11, 3);
    shape(ctx, ell(handX, ty + 63, 5.5, 6), G.skin, { shadeX: [handX - 3, handX + 6], line: 1.6 });
    shape(ctx, rrect(handX - 6, ty + 52, 12, 4, 1.5), G.watch, { line: 1.2 });
  }

  // neck + head (profile, facing left)
  shape(ctx, rrect(cx - 6, 76 + yb, 12, 16, 3), G.skinS, { stroke: false });
  shape(ctx, (c) => {
    c.moveTo(cx - 26, hy - 6); // forehead
    c.quadraticCurveTo(cx - 30, hy + 6, cx - 24, hy + 10); // nose bridge → tip
    c.lineTo(cx - 29, hy + 14);
    c.quadraticCurveTo(cx - 24, hy + 18, cx - 22, hy + 20); // under nose
    c.quadraticCurveTo(cx - 24, hy + 26, cx - 18, hy + 30); // lips / chin
    c.quadraticCurveTo(cx - 6, hy + 38, cx + 10, hy + 28);
    c.quadraticCurveTo(cx + 26, hy + 14, cx + 22, hy - 12);
    c.quadraticCurveTo(cx + 14, hy - 32, cx - 6, hy - 32);
    c.quadraticCurveTo(cx - 22, hy - 30, cx - 26, hy - 6);
  }, G.skin, { shadeX: [cx - 4, cx + 24], shadeA: 0.22 });
  shape(ctx, ell(cx + 14, hy + 6, 4.5, 6.5), G.skin, { line: 1.4 }); // ear
  ctx.fillStyle = G.blush;
  ctx.beginPath();
  ctx.ellipse(cx - 12, hy + 14, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = G.mouth;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(cx - 22, hy + 24);
  ctx.lineTo(cx - 15, hy + 24);
  ctx.stroke();
  eye(ctx, cx - 14, hy + 4, 6.5, 4.6, G.iris, p.blink, -1);
  brow(ctx, cx - 22, hy - 6, cx - 8, hy - 7, G.hairS);
  // bangs sweeping forward over the brow
  shape(ctx, (c) => {
    c.moveTo(cx + 12, hy - 34);
    c.quadraticCurveTo(cx - 22, hy - 38, cx - 30, hy - 8);
    c.quadraticCurveTo(cx - 34, hy + 8, cx - 28, hy + 20);
    c.quadraticCurveTo(cx - 24, hy + 4, cx - 14, hy - 4);
    c.quadraticCurveTo(cx - 2, hy - 14, cx + 8, hy - 8);
    c.quadraticCurveTo(cx + 18, hy - 2, cx + 24, hy + 6);
    c.quadraticCurveTo(cx + 30, hy - 20, cx + 12, hy - 34);
  }, G.hair, { shadeX: [cx - 10, cx + 30], shadeA: 0.3 });
  ctx.strokeStyle = 'rgba(255,225,200,0.33)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 18, hy - 26);
  ctx.quadraticCurveTo(cx - 4, hy - 32, cx + 6, hy - 28);
  ctx.stroke();
  // front side lock
  limb(ctx, [[cx - 8, hy + 6], [cx - 10 + sw * 0.5, hy + 30], [cx - 8 + sw, hy + 52]], 4.5, G.hair, G.hairS);
  // clip at the front temple
  ctx.save();
  ctx.translate(cx - 20, hy - 6);
  ctx.rotate(-0.7);
  shape(ctx, rrect(-6, -2, 12, 4, 2), G.clip, { line: 1.2 });
  ctx.fillStyle = G.clipL;
  ctx.fillRect(-4, -1.2, 5, 1.2);
  ctx.restore();
};

const drawGabriela = (dir: Dir, frame: number, moving: boolean): THREE.CanvasTexture => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  let pose: Pose;
  if (moving) {
    const ph = (frame % 8) / 8;
    pose = {
      swing: Math.sin(ph * Math.PI * 2),
      bob: Math.abs(Math.cos(ph * Math.PI * 2)) < 0.4 ? 1 : 0,
      breath: 0,
      blink: false,
      sway: Math.sin(ph * Math.PI * 2 + 0.6) * 3,
      moving: true,
    };
  } else {
    const f = frame % 6; // 0..5 breathing loop, 4 = blink
    const br = Math.sin((f / 6) * Math.PI * 2);
    pose = { swing: 0, bob: 0, breath: br, blink: f === 4, sway: br * 0.6, moving: false };
  }
  if (dir === 'down') gabrielaFront(ctx, pose, false);
  else if (dir === 'up') gabrielaFront(ctx, pose, true);
  else gabrielaSide(ctx, pose);
  return mkTex(c);
};

/* ============================================================
   CHIYO — grandmother, idle 8 frames
   ============================================================ */
const drawChiyo = (frame: number): THREE.CanvasTexture => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const f = frame % 8;
  const br = Math.sin((f / 8) * Math.PI * 2);
  const yb = br * 1.6;
  const stir = Math.sin((f / 8) * Math.PI * 2 + 1) * 0.35; // ladle angle
  const blink = f === 6;
  const cx = 80;

  // geta + tabi
  [cx - 12, cx + 12].forEach((x) => {
    shape(ctx, rrect(x - 9, 204, 18, 6, 2), '#8a6540', { line: 1.4 });
    shape(ctx, rrect(x - 7, 192, 14, 12, 4), '#f1f1f3', { line: 1.4 });
  });
  // kimono body (stooped, slightly wider at hem)
  const ty = 92 + yb;
  shape(ctx, (c2) => {
    c2.moveTo(cx - 26, ty);
    c2.quadraticCurveTo(cx, ty - 8, cx + 26, ty);
    c2.lineTo(cx + 34, ty + 104);
    c2.lineTo(cx - 34, ty + 104);
    c2.closePath();
  }, C.kimono, { shadeX: [cx - 6, cx + 34] });
  // kimono pattern (tiny seigaiha dots)
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let y = ty + 10; y < ty + 100; y += 12) for (let x = cx - 30 + ((y / 12) % 2) * 6; x < cx + 30; x += 12) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
  // collar V
  shape(ctx, (c2) => { c2.moveTo(cx - 12, ty - 4); c2.lineTo(cx, ty + 20); c2.lineTo(cx + 12, ty - 4); c2.lineTo(cx + 6, ty - 4); c2.lineTo(cx, ty + 10); c2.lineTo(cx - 6, ty - 4); }, C.apron, { line: 1.2 });
  // apron (kappogi)
  shape(ctx, (c2) => {
    c2.moveTo(cx - 20, ty + 22);
    c2.lineTo(cx + 20, ty + 22);
    c2.lineTo(cx + 26, ty + 96);
    c2.quadraticCurveTo(cx, ty + 102, cx - 26, ty + 96);
    c2.closePath();
  }, C.apron, { shadeX: [cx - 4, cx + 28], shadeA: 0.18 });
  // apron straps + pocket + lace hem
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, ty + 22);
  ctx.lineTo(cx - 10, ty + 2);
  ctx.moveTo(cx + 20, ty + 22);
  ctx.lineTo(cx + 10, ty + 2);
  ctx.stroke();
  shape(ctx, rrect(cx - 12, ty + 56, 24, 18, 3), C.apronS, { line: 1.2 });
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  for (let x = cx - 24; x <= cx + 24; x += 6) ctx.arc(x, ty + 97, 3, Math.PI, 0, true);
  ctx.stroke();
  // obi peeking
  shape(ctx, rrect(cx - 30, ty + 40, 8, 10, 1), C.obi, { line: 1.2 });
  shape(ctx, rrect(cx + 22, ty + 40, 8, 10, 1), C.obi, { line: 1.2 });

  // arms: left holds pot handle, right stirs ladle
  limb(ctx, [[cx - 24, ty + 8], [cx - 36, ty + 36], [cx - 26, ty + 58]], 9, C.kimono, C.kimonoS);
  shape(ctx, ell(cx - 24, ty + 62, 6, 6.5), C.skin, { line: 1.5 });
  const ax = cx + 26;
  const ay = ty + 8;
  const hx = ax + 10 + Math.sin(stir) * 10;
  const hyH = ty + 56 - Math.cos(stir) * 4;
  limb(ctx, [[ax, ay], [ax + 16, ty + 34], [hx, hyH]], 9, C.kimono, C.kimonoS);
  shape(ctx, ell(hx, hyH + 4, 6, 6.5), C.skin, { line: 1.5 });
  // ladle
  ctx.save();
  ctx.translate(hx, hyH + 2);
  ctx.rotate(stir - 0.4);
  limb(ctx, [[0, 0], [0, -46]], 2.2, C.ladleL, C.ladle);
  shape(ctx, ell(0, -50, 7, 5), C.ladle, { line: 1.4 });
  ctx.restore();

  // neck
  shape(ctx, rrect(cx - 7, 80 + yb, 14, 14, 3), C.skinS, { stroke: false });
  // hair (back) + bun + pin
  const hy = 56 + yb;
  shape(ctx, ell(cx, hy - 2, 27, 30), C.hair, { shadeX: [cx, cx + 28], shadeA: 0.25 });
  shape(ctx, ell(cx, hy - 34, 11, 9), C.hairS, { shadeX: [cx - 4, cx + 12] });
  ctx.strokeStyle = C.pin;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 20, hy - 36);
  ctx.lineTo(cx + 16, hy - 30);
  ctx.stroke();
  ctx.fillStyle = '#c94a4a';
  ctx.beginPath();
  ctx.arc(cx + 17, hy - 30, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // face (rounder, soft jaw)
  shape(ctx, (c2) => {
    c2.moveTo(cx - 23, hy - 6);
    c2.quadraticCurveTo(cx - 24, hy + 20, cx - 10, hy + 30);
    c2.quadraticCurveTo(cx, hy + 36, cx + 10, hy + 30);
    c2.quadraticCurveTo(cx + 24, hy + 20, cx + 23, hy - 6);
    c2.quadraticCurveTo(cx + 20, hy - 26, cx, hy - 28);
    c2.quadraticCurveTo(cx - 20, hy - 26, cx - 23, hy - 6);
  }, C.skin, { shadeX: [cx + 2, cx + 24], shadeA: 0.22 });
  // hairline (grey, pulled back)
  shape(ctx, (c2) => {
    c2.moveTo(cx - 24, hy - 4);
    c2.quadraticCurveTo(cx - 22, hy - 30, cx, hy - 30);
    c2.quadraticCurveTo(cx + 22, hy - 30, cx + 24, hy - 4);
    c2.quadraticCurveTo(cx + 16, hy - 16, cx, hy - 18);
    c2.quadraticCurveTo(cx - 16, hy - 16, cx - 24, hy - 4);
  }, C.hair, { shadeX: [cx - 10, cx + 26], shadeA: 0.22 });
  ctx.strokeStyle = C.hairL;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, hy - 22);
  ctx.quadraticCurveTo(cx - 4, hy - 27, cx + 6, hy - 25);
  ctx.stroke();
  // eyes: gentle, crescent smile-eyes when blinking
  if (blink) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    [cx - 11, cx + 11].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x - 6, hy + 5);
      ctx.quadraticCurveTo(x, hy - 1, x + 6, hy + 5);
      ctx.stroke();
    });
  } else {
    eye(ctx, cx - 11, hy + 4, 6.5, 3.6, C.iris, false);
    eye(ctx, cx + 11, hy + 4, 6.5, 3.6, C.iris, false);
  }
  brow(ctx, cx - 18, hy - 6, cx - 5, hy - 8, C.hairS);
  brow(ctx, cx + 5, hy - 8, cx + 18, hy - 6, C.hairS);
  // wrinkles + smile
  ctx.strokeStyle = C.wrinkle;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, hy + 6);
  ctx.lineTo(cx - 23, hy + 10);
  ctx.moveTo(cx + 20, hy + 6);
  ctx.lineTo(cx + 23, hy + 10);
  ctx.moveTo(cx - 10, hy + 18);
  ctx.quadraticCurveTo(cx - 12, hy + 24, cx - 8, hy + 27);
  ctx.moveTo(cx + 10, hy + 18);
  ctx.quadraticCurveTo(cx + 12, hy + 24, cx + 8, hy + 27);
  ctx.stroke();
  ctx.strokeStyle = C.mouth;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(cx - 6, hy + 22);
  ctx.quadraticCurveTo(cx, hy + 27, cx + 6, hy + 22);
  ctx.stroke();
  ctx.fillStyle = 'rgba(233,150,140,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - 15, hy + 14, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 15, hy + 14, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  return mkTex(c);
};

/* ============================================================
   Frame banks
   ============================================================ */
export interface GabrielaArt {
  walk: Record<Dir, THREE.CanvasTexture[]>;
  idle: Record<Dir, THREE.CanvasTexture[]>;
}
let gab: GabrielaArt | null = null;
export const getGabrielaArt = (): GabrielaArt => {
  if (gab) return gab;
  const walk = {} as Record<Dir, THREE.CanvasTexture[]>;
  const idle = {} as Record<Dir, THREE.CanvasTexture[]>;
  // Generate only left/down/up once; right is a mirrored clone of left
  (['down', 'up', 'left'] as Dir[]).forEach((d) => {
    walk[d] = Array.from({ length: 6 }, (_, i) => drawGabriela(d, i, true));
    idle[d] = Array.from({ length: 4 }, (_, i) => drawGabriela(d, i, false));
  });
  walk.right = walk.left.map((t) => {
    const c = t.clone();
    c.wrapS = THREE.RepeatWrapping;
    c.repeat.x = -1;
    c.offset.x = 1;
    c.needsUpdate = true;
    return c;
  });
  idle.right = idle.left.map((t) => {
    const c = t.clone();
    c.wrapS = THREE.RepeatWrapping;
    c.repeat.x = -1;
    c.offset.x = 1;
    c.needsUpdate = true;
    return c;
  });
  gab = { walk, idle };
  return gab;
};

let chiyo: THREE.CanvasTexture[] | null = null;
export const getChiyoArt = (): THREE.CanvasTexture[] => {
  if (chiyo) return chiyo;
  chiyo = Array.from({ length: 6 }, (_, i) => drawChiyo(i));
  return chiyo;
};
