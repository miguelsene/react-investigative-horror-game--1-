import * as THREE from 'three';

/* ============================================================
   PIXEL-ART CHARACTER RENDERER (48x64 logical grid → 4x scale)
   ------------------------------------------------------------
   Every character is painted on a small logical pixel grid with
   a palette of 3-tone shading (shadow / base / light) plus a
   dark outline pass, then upscaled with NearestFilter so it
   stays crisp. Animations are frame-based:
     - Gabriela: idle (4 frames: breathing + blink), walk (6 frames:
       legs, arm swing, hair sway, head bob, skirt flare) ×4 dirs
     - Chiyo:    idle (6 frames: breathing, blink, stirring ladle)
   ============================================================ */

type Dir = 'down' | 'up' | 'left' | 'right';
const GW = 48;
const GH = 64;
const SCALE = 4;

class Px {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: (string | null)[];
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GW * SCALE;
    this.canvas.height = GH * SCALE;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.grid = new Array(GW * GH).fill(null);
  }
  set(x: number, y: number, c: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    this.grid[y * GW + x] = c;
  }
  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return null;
    return this.grid[y * GW + x];
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** rectangle with 3-tone vertical shading: light on the left band, shadow on the right band */
  shadedRect(x: number, y: number, w: number, h: number, base: string, light: string, shadow: string, lightW = 1, shadowW = 1) {
    this.rect(x, y, w, h, base);
    if (w > 2) {
      this.rect(x, y, lightW, h, light);
      this.rect(x + w - shadowW, y, shadowW, h, shadow);
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0) this.set(cx + x, cy + y, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  /** dark outline around every opaque pixel (classic pixel-art readability) */
  outline(color: string) {
    const src = this.grid.slice();
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        if (src[y * GW + x]) continue;
        const n = (src[(y - 1) * GW + x] && y > 0) || (y < GH - 1 && src[(y + 1) * GW + x]) || (x > 0 && src[y * GW + x - 1]) || (x < GW - 1 && src[y * GW + x + 1]);
        if (n) this.grid[y * GW + x] = color;
      }
  }
  toTexture(): THREE.CanvasTexture {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        const c = this.grid[y * GW + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    const t = new THREE.CanvasTexture(this.canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
}

/* ---------- Palettes ---------- */
const G = {
  outline: '#0b0a0f',
  hairS: '#1a120d',
  hair: '#2f2118',
  hairL: '#513a2a',
  hairHi: '#70543e',
  skinS: '#d9b59d',
  skin: '#f6dfcd',
  skinL: '#fff0e4',
  eye: '#182236',
  eyeHi: '#ffffff',
  mouth: '#b47f74',
  blush: '#e8b8ad',
  clip: '#c8262c',
  clipL: '#f05a5a',
  coatS: '#0f1420',
  coat: '#1b2336',
  coatL: '#2a3650',
  lapel: '#33405e',
  shirt: '#f4f5f8',
  shirtS: '#cfd3dc',
  tie: '#8e1f24',
  button: '#d5b046',
  skirtS: '#0a0d14',
  skirt: '#141a26',
  skirtL: '#222b3c',
  tightS: '#171b25',
  tight: '#262d3c',
  tightL: '#333c4e',
  shoe: '#07080b',
  shoeL: '#2a2c33',
  watch: '#9aa6b5',
  watchL: '#dfe6ee',
  bag: '#3e2a1c',
};

const C = {
  outline: '#0b0a0f',
  hairS: '#8b93a0',
  hair: '#b7bfca',
  hairL: '#e2e7ee',
  pin: '#7a4f2c',
  skinS: '#d8b9a3',
  skin: '#f2dccb',
  skinL: '#fbece0',
  eye: '#2f3646',
  mouth: '#9d6d60',
  wrinkle: '#c9a892',
  kimonoS: '#222c40',
  kimono: '#33425e',
  kimonoL: '#49597a',
  apronS: '#cfd5dd',
  apron: '#f2f4f7',
  apronL: '#ffffff',
  obi: '#7a2b2b',
  ladle: '#6b4a2c',
  ladleL: '#9a7248',
  geta: '#8a6540',
  getaS: '#5a3f24',
};

/* ---------- Helpers shared by characters ---------- */
const drawShoe = (p: Px, x: number, y: number, w: number, dirFlip = false) => {
  p.rect(x, y, w, 3, G.shoe);
  p.rect(dirFlip ? x + w - 2 : x, y, 2, 1, G.shoeL);
};

/* ============================================================
   GABRIELA
   frames: walk 0..5  (0 = contact L, 3 = contact R), idle 0..3
   ============================================================ */
export const paintGabrielaSprite = (facing: Dir, frame: number, moving: boolean): THREE.CanvasTexture => {
  const p = new Px();
  const f = ((frame % 6) + 6) % 6;

  // ---- animation curves ----
  // walk phase 0..1, contact poses at 0 and 0.5; passing poses at 0.25/0.75
  const ph = moving ? f / 6 : 0;
  const swing = moving ? Math.sin(ph * Math.PI * 2) : 0; // -1..1 legs / arms
  const bob = moving ? (Math.abs(Math.cos(ph * Math.PI * 2)) < 0.5 ? 1 : 0) : 0; // head bob on passing pose
  const idleBreath = !moving && (f === 1 || f === 2) ? 1 : 0;
  const blink = !moving && f === 3;
  const hairSway = moving ? Math.round(swing) : 0; // -1..1
  const yOff = -bob + idleBreath; // vertical body offset

  const cx = 24;
  const legL = Math.round(swing * 3);
  const legR = -legL;
  const armL = -Math.round(swing * 3);
  const armR = -armL;

  if (facing === 'down' || facing === 'up') {
    const back = facing === 'up';

    // ---- LEGS (tights) ----
    // back leg slightly darker, front leg lighter; length shortened for the lifted one
    const lyBase = 48 + yOff;
    const legH = 9;
    const lLen = legH - Math.max(0, legL) * 0.6;
    const rLen = legH - Math.max(0, legR) * 0.6;
    p.shadedRect(cx - 6, lyBase, 5, Math.round(lLen), G.tight, G.tightL, G.tightS);
    p.shadedRect(cx + 1, lyBase, 5, Math.round(rLen), G.tight, G.tightL, G.tightS);
    drawShoe(p, cx - 7, lyBase + Math.round(lLen), 7);
    drawShoe(p, cx + 0, lyBase + Math.round(rLen), 7, true);

    // ---- SKIRT (pleated, flares when walking) ----
    const flare = moving ? 1 : 0;
    const sy = 40 + yOff;
    p.shadedRect(cx - 9 - flare, sy, 18 + flare * 2, 9, G.skirt, G.skirtL, G.skirtS, 2, 2);
    for (let i = -6; i <= 6; i += 4) p.rect(cx + i, sy + 1, 1, 8, G.skirtS);
    // hem shadow
    p.rect(cx - 9 - flare, sy + 8, 18 + flare * 2, 1, G.skirtS);

    // ---- COAT / TORSO ----
    const ty = 26 + yOff;
    p.shadedRect(cx - 8, ty, 16, 15, G.coat, G.coatL, G.coatS, 2, 2);
    if (!back) {
      // lapels & shirt V
      p.rect(cx - 3, ty, 6, 1, G.shirt);
      p.line(cx - 3, ty, cx - 1, ty + 5, G.shirt);
      p.line(cx + 2, ty, cx, ty + 5, G.shirt);
      p.rect(cx - 1, ty + 1, 2, 4, G.shirt);
      p.line(cx - 5, ty, cx - 3, ty + 6, G.lapel);
      p.line(cx + 4, ty, cx + 2, ty + 6, G.lapel);
      // ribbon tie
      p.rect(cx - 2, ty + 2, 4, 2, G.tie);
      p.rect(cx - 1, ty + 4, 2, 3, G.tie);
      // buttons
      p.set(cx, ty + 8, G.button);
      p.set(cx, ty + 12, G.button);
      // breast pocket line
      p.rect(cx + 3, ty + 8, 3, 1, G.coatS);
    } else {
      // back seam + collar
      p.rect(cx, ty, 1, 14, G.coatS);
      p.rect(cx - 4, ty - 1, 8, 2, G.shirt);
      // small backpack strap hint
      p.rect(cx - 6, ty + 1, 1, 10, G.bag);
      p.rect(cx + 5, ty + 1, 1, 10, G.bag);
    }

    // ---- ARMS (swing opposite to legs) ----
    const armY = ty + 1;
    const lArmY = armY + armL * 0.5;
    const rArmY = armY + armR * 0.5;
    p.shadedRect(cx - 11, Math.round(lArmY), 3, 12, G.coat, G.coatL, G.coatS, 1, 1);
    p.shadedRect(cx + 8, Math.round(rArmY), 3, 12, G.coat, G.coatL, G.coatS, 1, 1);
    // cuffs
    p.rect(cx - 11, Math.round(lArmY) + 11, 3, 1, G.shirtS);
    p.rect(cx + 8, Math.round(rArmY) + 11, 3, 1, G.shirtS);
    // hands
    p.rect(cx - 11, Math.round(lArmY) + 12, 3, 3, G.skin);
    p.rect(cx + 8, Math.round(rArmY) + 12, 3, 3, G.skin);
    // wristwatch (left wrist, only from the front)
    if (!back) {
      p.rect(cx - 11, Math.round(lArmY) + 10, 3, 1, G.watch);
      p.set(cx - 10, Math.round(lArmY) + 10, G.watchL);
    }

    // ---- HEAD ----
    const hy = 8 + yOff;
    // hair back mass (long hair behind the head down to shoulders, sways)
    p.ellipse(cx + hairSway, hy + 9, 9, 10, G.hairS);
    p.rect(cx - 9 + hairSway, hy + 9, 18, 10, G.hairS);
    p.rect(cx - 8 + hairSway, hy + 18, 4, 3, G.hairS);
    p.rect(cx + 4 + hairSway, hy + 18, 4, 3, G.hairS);

    if (!back) {
      // face
      p.ellipse(cx, hy + 9, 7, 8, G.skin);
      p.rect(cx - 7, hy + 6, 14, 8, G.skin);
      p.rect(cx - 7, hy + 6, 1, 8, G.skinS);
      p.rect(cx + 6, hy + 6, 1, 8, G.skinS);
      // neck
      p.rect(cx - 2, hy + 17, 4, 2, G.skinS);
      // eyes — cold, half-lidded analytical look
      if (blink) {
        p.rect(cx - 5, hy + 10, 3, 1, G.eye);
        p.rect(cx + 2, hy + 10, 3, 1, G.eye);
      } else {
        p.rect(cx - 5, hy + 9, 3, 3, G.eye);
        p.rect(cx + 2, hy + 9, 3, 3, G.eye);
        p.set(cx - 5, hy + 9, G.eyeHi);
        p.set(cx + 2, hy + 9, G.eyeHi);
        // upper lid line (gives the "cold" expression)
        p.rect(cx - 5, hy + 8, 3, 1, G.hairS);
        p.rect(cx + 2, hy + 8, 3, 1, G.hairS);
      }
      // brows: flat, slightly lowered
      p.rect(cx - 6, hy + 6, 4, 1, G.hairS);
      p.rect(cx + 2, hy + 6, 4, 1, G.hairS);
      // nose & mouth (neutral)
      p.set(cx, hy + 12, G.skinS);
      p.rect(cx - 1, hy + 14, 3, 1, G.mouth);
      // faint blush
      p.set(cx - 6, hy + 12, G.blush);
      p.set(cx + 5, hy + 12, G.blush);

      // front hair: neat middle part, bangs framing
      p.ellipse(cx, hy + 4, 9, 5, G.hair);
      p.rect(cx - 9, hy + 3, 18, 4, G.hair);
      // part line
      p.rect(cx, hy, 1, 5, G.hairS);
      // bangs sweep left/right
      p.line(cx - 1, hy + 1, cx - 7, hy + 8, G.hair);
      p.line(cx + 1, hy + 1, cx + 7, hy + 8, G.hair);
      p.rect(cx - 8, hy + 5, 4, 4, G.hair);
      p.rect(cx + 4, hy + 5, 4, 4, G.hair);
      // highlights
      p.rect(cx - 6, hy + 1, 3, 1, G.hairHi);
      p.rect(cx + 3, hy + 1, 3, 1, G.hairHi);
      p.rect(cx - 7, hy + 2, 2, 1, G.hairL);
      p.rect(cx + 5, hy + 2, 2, 1, G.hairL);
      // side locks (sway)
      p.rect(cx - 9 + hairSway, hy + 7, 2, 12, G.hair);
      p.rect(cx + 7 + hairSway, hy + 7, 2, 12, G.hair);
      p.rect(cx - 9 + hairSway, hy + 7, 1, 12, G.hairL);
      // crimson hairclip (left side, always visible)
      p.rect(cx - 7, hy + 5, 3, 1, G.clip);
      p.rect(cx - 7, hy + 6, 3, 1, G.clip);
      p.set(cx - 6, hy + 5, G.clipL);
    } else {
      // back of the head: full hair with part + highlight band
      p.ellipse(cx + hairSway, hy + 8, 9, 9, G.hair);
      p.rect(cx - 9 + hairSway, hy + 8, 18, 11, G.hair);
      p.rect(cx + hairSway, hy, 1, 6, G.hairS);
      p.rect(cx - 6 + hairSway, hy + 3, 12, 1, G.hairHi);
      p.rect(cx - 8 + hairSway, hy + 4, 3, 1, G.hairL);
      p.rect(cx + 5 + hairSway, hy + 4, 3, 1, G.hairL);
      // clip visible on the left side
      p.rect(cx - 9, hy + 6, 2, 2, G.clip);
    }
  } else {
    /* ---------------- PROFILE (left; right = mirrored on GPU) ---------------- */
    const lyBase = 48 + yOff;
    // legs: front/back stride
    const stride = Math.round(swing * 4);
    // back leg
    p.shadedRect(cx - 2 - stride, lyBase, 5, 9 - Math.max(0, -stride) * 0.4, G.tightS, G.tight, G.tightS);
    drawShoe(p, cx - 4 - stride, lyBase + 9 - Math.round(Math.max(0, -stride) * 0.4), 7);
    // front leg
    p.shadedRect(cx - 2 + stride, lyBase, 5, 9 - Math.max(0, stride) * 0.4, G.tight, G.tightL, G.tightS);
    drawShoe(p, cx - 5 + stride, lyBase + 9 - Math.round(Math.max(0, stride) * 0.4), 7);

    // skirt
    const sy = 40 + yOff;
    const flare = moving ? 1 : 0;
    p.shadedRect(cx - 7 - flare, sy, 13 + flare * 2, 9, G.skirt, G.skirtL, G.skirtS, 2, 2);
    for (let i = -4; i <= 4; i += 4) p.rect(cx + i, sy + 1, 1, 8, G.skirtS);

    // torso (coat) — slightly leaning forward when walking
    const ty = 26 + yOff;
    const lean = moving ? -1 : 0;
    p.shadedRect(cx - 6 + lean, ty, 12, 15, G.coat, G.coatL, G.coatS, 2, 2);
    p.rect(cx - 6 + lean, ty, 3, 3, G.shirt); // collar
    p.rect(cx - 5 + lean, ty + 3, 1, 2, G.tie);
    p.set(cx - 5 + lean, ty + 8, G.button);

    // far arm (behind torso, darker)
    const farA = Math.round(-swing * 4);
    p.rect(cx - 1 + farA, ty + 2, 3, 11, G.coatS);
    p.rect(cx - 1 + farA, ty + 13, 3, 3, G.skinS);
    // near arm
    const nearA = Math.round(swing * 4);
    p.shadedRect(cx - 4 + nearA, ty + 2, 3, 11, G.coat, G.coatL, G.coatS, 1, 1);
    p.rect(cx - 4 + nearA, ty + 12, 3, 1, G.shirtS);
    p.rect(cx - 4 + nearA, ty + 13, 3, 3, G.skin);
    p.rect(cx - 4 + nearA, ty + 11, 3, 1, G.watch);
    p.set(cx - 3 + nearA, ty + 11, G.watchL);

    // head (profile facing left)
    const hy = 8 + yOff;
    // hair mass behind (long, sways opposite)
    p.ellipse(cx + 2 - hairSway, hy + 9, 8, 10, G.hairS);
    p.rect(cx - 2 - hairSway, hy + 8, 10, 11, G.hairS);
    p.rect(cx + 3 - hairSway, hy + 18, 4, 3, G.hairS);
    // face
    p.ellipse(cx - 2, hy + 9, 6, 8, G.skin);
    p.rect(cx - 8, hy + 7, 6, 7, G.skin);
    p.rect(cx - 8, hy + 8, 1, 5, G.skinS); // nose bridge shade
    p.set(cx - 9, hy + 11, G.skin); // nose tip
    p.rect(cx - 2, hy + 17, 3, 2, G.skinS); // neck
    // eye (profile)
    if (blink) p.rect(cx - 6, hy + 10, 3, 1, G.eye);
    else {
      p.rect(cx - 6, hy + 9, 3, 3, G.eye);
      p.set(cx - 6, hy + 9, G.eyeHi);
      p.rect(cx - 6, hy + 8, 3, 1, G.hairS);
    }
    p.rect(cx - 7, hy + 6, 4, 1, G.hairS); // brow
    p.rect(cx - 7, hy + 14, 2, 1, G.mouth);
    p.set(cx - 4, hy + 12, G.blush);
    // hair top & bangs
    p.ellipse(cx, hy + 4, 9, 5, G.hair);
    p.rect(cx - 8, hy + 3, 17, 4, G.hair);
    p.line(cx - 3, hy + 1, cx - 9, hy + 8, G.hair);
    p.rect(cx - 9, hy + 5, 3, 3, G.hair);
    p.rect(cx - 4, hy + 1, 5, 1, G.hairHi);
    p.rect(cx + 2, hy + 2, 3, 1, G.hairL);
    // long side lock in front of ear
    p.rect(cx - 4, hy + 8, 2, 8, G.hair);
    // clip (front-left)
    p.rect(cx - 8, hy + 5, 3, 2, G.clip);
    p.set(cx - 7, hy + 5, G.clipL);
    // hair tail behind (sways)
    p.rect(cx + 6 - hairSway, hy + 10, 3, 10, G.hair);
    p.rect(cx + 6 - hairSway, hy + 10, 1, 10, G.hairL);
  }

  p.outline(G.outline);
  return p.toTexture();
};

/* ============================================================
   CHIYO (grandmother) — idle animation, 6 frames:
   breathing, blink, stirring a ladle in a pot of miso soup
   ============================================================ */
export const paintGrandmaChiyoSprite = (frame: number): THREE.CanvasTexture => {
  const p = new Px();
  const f = ((frame % 6) + 6) % 6;
  const breath = f === 2 || f === 3 ? 1 : 0;
  const blink = f === 4;
  const stir = Math.round(Math.sin((f / 6) * Math.PI * 2) * 2); // ladle sway
  const cx = 24;
  const yOff = breath;

  // ---- geta & feet ----
  p.rect(cx - 7, 57, 6, 2, C.geta);
  p.rect(cx + 1, 57, 6, 2, C.geta);
  p.rect(cx - 6, 59, 4, 2, C.getaS);
  p.rect(cx + 2, 59, 4, 2, C.getaS);
  // white tabi socks
  p.rect(cx - 6, 54, 5, 3, C.apron);
  p.rect(cx + 1, 54, 5, 3, C.apron);

  // ---- kimono body (slightly stooped, narrow shoulders) ----
  const ty = 24 + yOff;
  p.shadedRect(cx - 9, ty, 18, 31, C.kimono, C.kimonoL, C.kimonoS, 2, 3);
  // kimono collar (V)
  p.line(cx - 4, ty - 2, cx, ty + 6, C.apronL);
  p.line(cx + 4, ty - 2, cx, ty + 6, C.apronS);
  // ---- kappogi apron over kimono ----
  p.shadedRect(cx - 7, ty + 7, 14, 22, C.apron, C.apronL, C.apronS, 2, 2);
  // apron ties at neck
  p.rect(cx - 1, ty + 4, 2, 3, C.apron);
  // pocket
  p.rect(cx - 4, ty + 18, 8, 6, C.apronS);
  p.rect(cx - 3, ty + 19, 6, 4, C.apron);
  // obi hint under apron edge
  p.rect(cx - 9, ty + 12, 2, 3, C.obi);
  p.rect(cx + 7, ty + 12, 2, 3, C.obi);
  // subtle lace hem
  for (let i = -6; i <= 6; i += 2) p.set(cx + i, ty + 29, C.apronL);

  // ---- arms & hands (holding ladle, right arm stirs) ----
  // left arm (kimono sleeve, wide)
  p.shadedRect(cx - 13, ty + 6, 5, 12, C.kimono, C.kimonoL, C.kimonoS, 1, 1);
  p.rect(cx - 12, ty + 18, 3, 3, C.skin);
  // right arm (sleeve moves with the stir)
  const ax = cx + 8 + Math.round(stir * 0.5);
  p.shadedRect(ax, ty + 6, 5, 12, C.kimono, C.kimonoL, C.kimonoS, 1, 1);
  p.rect(ax + 1, ty + 18, 3, 3, C.skin);
  // ladle
  p.line(ax + 2, ty + 20, ax + 4 + stir, ty + 8, C.ladle);
  p.set(ax + 4 + stir, ty + 7, C.ladleL);
  p.ellipse(ax + 5 + stir, ty + 6, 2, 1, C.ladle);

  // ---- head ----
  const hy = 6 + yOff;
  // bun + hairpin
  p.ellipse(cx, hy - 1, 4, 3, C.hair);
  p.rect(cx - 3, hy - 3, 6, 2, C.hairS);
  p.rect(cx - 6, hy - 1, 12, 1, C.pin);
  p.set(cx + 6, hy - 1, C.ladleL);
  // hair sides (grey, pulled back)
  p.ellipse(cx, hy + 6, 8, 7, C.hair);
  p.rect(cx - 8, hy + 6, 16, 5, C.hair);
  p.rect(cx - 6, hy + 1, 12, 1, C.hairL);
  p.rect(cx - 8, hy + 3, 1, 8, C.hairS);
  p.rect(cx + 7, hy + 3, 1, 8, C.hairS);
  // face
  p.ellipse(cx, hy + 9, 6, 7, C.skin);
  p.rect(cx - 6, hy + 6, 12, 8, C.skin);
  p.rect(cx - 6, hy + 6, 1, 8, C.skinS);
  p.rect(cx + 5, hy + 6, 1, 8, C.skinS);
  p.rect(cx - 2, hy + 16, 4, 2, C.skinS); // neck
  // eyes: kind, crescent when smiling
  if (blink) {
    p.rect(cx - 5, hy + 10, 3, 1, C.eye);
    p.rect(cx + 2, hy + 10, 3, 1, C.eye);
  } else {
    p.rect(cx - 5, hy + 9, 3, 2, C.eye);
    p.rect(cx + 2, hy + 9, 3, 2, C.eye);
    p.set(cx - 4, hy + 9, C.apronL);
    p.set(cx + 3, hy + 9, C.apronL);
  }
  // brows (soft)
  p.rect(cx - 5, hy + 7, 3, 1, C.hairS);
  p.rect(cx + 2, hy + 7, 3, 1, C.hairS);
  // laugh lines & wrinkles
  p.set(cx - 6, hy + 11, C.wrinkle);
  p.set(cx + 5, hy + 11, C.wrinkle);
  p.set(cx - 3, hy + 6, C.wrinkle);
  p.set(cx + 2, hy + 6, C.wrinkle);
  // gentle smile
  p.rect(cx - 2, hy + 13, 4, 1, C.mouth);
  p.set(cx - 3, hy + 12, C.mouth);
  p.set(cx + 2, hy + 12, C.mouth);
  // cheeks
  p.set(cx - 5, hy + 12, '#e6bfb0');
  p.set(cx + 4, hy + 12, '#e6bfb0');

  p.outline(C.outline);
  return p.toTexture();
};

/* ============================================================
   Frame banks (built once, cached)
   ============================================================ */
export interface GabrielaFrames {
  walk: Record<Dir, THREE.CanvasTexture[]>;
  idle: Record<Dir, THREE.CanvasTexture[]>;
}
let gabCache: GabrielaFrames | null = null;
export const getGabrielaFrames = (): GabrielaFrames => {
  if (gabCache) return gabCache;
  const dirs: Dir[] = ['down', 'up', 'left', 'right'];
  const walk = {} as Record<Dir, THREE.CanvasTexture[]>;
  const idle = {} as Record<Dir, THREE.CanvasTexture[]>;
  dirs.forEach((d) => {
    const src: Dir = d === 'right' ? 'left' : d;
    walk[d] = Array.from({ length: 6 }, (_, i) => paintGabrielaSprite(src, i, true));
    idle[d] = Array.from({ length: 4 }, (_, i) => paintGabrielaSprite(src, i, false));
    if (d === 'right') {
      // mirror horizontally via texture transform
      [...walk[d], ...idle[d]].forEach((t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.repeat.x = -1;
        t.offset.x = 1;
        t.needsUpdate = true;
      });
    }
  });
  gabCache = { walk, idle };
  return gabCache;
};

let chiyoCache: THREE.CanvasTexture[] | null = null;
export const getChiyoFrames = (): THREE.CanvasTexture[] => {
  if (chiyoCache) return chiyoCache;
  chiyoCache = Array.from({ length: 6 }, (_, i) => paintGrandmaChiyoSprite(i));
  return chiyoCache;
};

/* Sprite aspect: 48x64 grid → width/height = 0.75 */
export const SPRITE_ASPECT = GW / GH;
