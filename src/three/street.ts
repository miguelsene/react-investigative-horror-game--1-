import * as THREE from 'three';
import type { Anim } from './models';
import * as T from './textures';
import { STREET, roadZ, walkZ } from '../data/streetRoute';
import { createSilhouette, setSilhouetteFrame } from './silhouetteSprite';
import { asphaltTexture, concreteTexture, facadeTexture, shopTexture } from './facadeTextures';

/* ============================================================
   KYOTO RESIDENTIAL STREET — long, decorated, alive.
   A single curving road from Sabrina's house to the school gate,
   lined with houses, shops, a shrine, poles, trees, signs,
   pedestrians and small street furniture.
   ============================================================ */

export interface StreetBuild {
  group: THREE.Group;
  colliders: { x: number; z: number; w: number; d: number }[];
  bounds: () => { minX: number; maxX: number; minZ: number; maxZ: number };
  animate: Anim;
  dispose: () => void;
}

// Shared unit geometries — every prop is scaled from these, so the whole
// street costs a handful of geometries instead of hundreds.
const U = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  sphere: new THREE.SphereGeometry(0.5, 10, 8),
  sphereLow: new THREE.SphereGeometry(0.5, 6, 5),
  cone: new THREE.ConeGeometry(0.5, 1, 12),
  capsule: new THREE.CapsuleGeometry(0.26, 0.62, 3, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.06, 6, 14),
};

const mat = (color: number, roughness = 0.85, metalness = 0.03) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const glow = (color: number, emissive: number, intensity = 1.1) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.7 });

export const buildStreet = (): StreetBuild => {
  const root = new THREE.Group();
  const colliders: StreetBuild['colliders'] = [];
  const anims: Anim[] = [];

  const palette = {
    asphalt: new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.34, metalness: 0.16 }),
    sidewalk: new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.9 }),
    curb: mat(0x6b6f74, 0.9),
    plasterA: mat(0x8d8375, 0.9),
    plasterB: mat(0x6f6a63, 0.9),
    plasterC: mat(0x9c9184, 0.9),
    wood: mat(0x3f2f24, 0.75),
    woodDark: mat(0x2a1f18, 0.7),
    roof: mat(0x22262e, 0.8),
    roofTile: mat(0x2b3038, 0.75),
    metal: mat(0x8b929b, 0.4, 0.6),
    darkMetal: mat(0x2a2d33, 0.5, 0.4),
    white: mat(0xd8d6cf, 0.8),
    red: mat(0xa5302c, 0.7),
    woodRed: mat(0x7a2724, 0.78),
    leaf: mat(0x415a3a, 0.9),
    leafLight: mat(0x4f6b44, 0.9),
    trunk: mat(0x3b2b21, 0.9),
    glassLit: glow(0xffe3b4, 0xffca7d, 0.75),
    glassCold: glow(0xdfe6ef, 0xa9c3e0, 0.35),
    sign: mat(0xe8e2d2, 0.85),
    awning: mat(0x35465c, 0.85),
  };

  const put = (
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    ry = 0,
    parent: THREE.Object3D = root,
  ) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.y = ry;
    m.castShadow = false;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const signPlane = (text: string, x: number, y: number, z: number, w: number, h: number, ry = 0) => {
    const mesh = new THREE.Mesh(U.plane, new THREE.MeshBasicMaterial({ map: T.doorPlate(text), toneMapped: false }));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, 1);
    mesh.rotation.y = ry;
    root.add(mesh);
    return mesh;
  };

  /* ---------------- ROAD, SIDEWALKS, CURBS ---------------- */
  const SEG = 2.4;
  for (let x = STREET.minX; x <= STREET.maxX; x += SEG) {
    const z = roadZ(x);
    const nextZ = roadZ(x + SEG);
    const angle = Math.atan2(nextZ - z, SEG);
    const cz = (z + nextZ) / 2;

    const road = put(U.box, palette.asphalt, x + SEG / 2, 0.05, cz, SEG + 0.15, 0.1, STREET.roadHalf * 2, -angle);
    road.receiveShadow = true;

    // Curbs and sidewalks on both sides
    [-1, 1].forEach((side) => {
      const off = side * (STREET.roadHalf + 0.55);
      put(U.box, palette.curb, x + SEG / 2, 0.09, cz + off * Math.cos(angle), SEG + 0.15, 0.18, 0.5, -angle);
      put(U.box, palette.sidewalk, x + SEG / 2, 0.07, cz + side * (STREET.roadHalf + 1.85), SEG + 0.15, 0.14, 2.1, -angle);
    });
  }

  // Wet reflections and puddles
  for (let i = 0; i < 22; i++) {
    const x = STREET.minX + Math.random() * (STREET.maxX - STREET.minX);
    const side = Math.random() > 0.5 ? 1 : -1;
    const puddle = put(
      U.plane,
      new THREE.MeshBasicMaterial({ color: 0x7e93a8, transparent: true, opacity: 0.07 + Math.random() * 0.07 }),
      x,
      0.101,
      roadZ(x) + side * (0.6 + Math.random() * 2),
      1.2 + Math.random() * 2.4,
      0.5 + Math.random() * 0.9,
      1,
    );
    puddle.rotation.x = -Math.PI / 2;
  }

  // Crosswalks
  [0, 18, -18].forEach((cx) => {
    for (let i = -3; i <= 3; i++) {
      const z = roadZ(cx) + i * 0.82;
      const stripe = put(U.box, palette.white, cx, 0.115, z, 2.6, 0.012, 0.42);
      stripe.receiveShadow = false;
    }
  });

  /* ---------------- BUILDINGS ---------------- */
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const addHouse = (x: number, side: 1 | -1, variant: number) => {
    const w = 4.6 + rnd() * 2.2;
    const d = 4.4 + rnd() * 1.4;
    const h = 3.1 + rnd() * 2.1;
    const z = roadZ(x) + side * (STREET.buildingLine + d / 2);
    const face = side === -1 ? 1 : -1; // direction the facade faces
    const wallColors = ['#8d8175', '#706b63', '#9a8d7d'];
    const trimColors = ['#e7dfcf', '#d8d0c0', '#efe7d8'];
    const facadeMat = new THREE.MeshStandardMaterial({
      map: facadeTexture(wallColors[variant % 3], trimColors[variant % 3], h > 4.2 ? 3 : 2),
      roughness: 0.92,
    });
    const base = new THREE.Group();
    root.add(base);

    put(U.box, facadeMat, x, h / 2, z, w, h, d, 0, base);
    put(U.box, palette.wood, x, 0.34, z + face * (d / 2 + 0.02), w, 0.55, 0.12, 0, base);

    // Roof: shallow gable from two slabs
    const slabDepth = d * 0.62;
    const roofA = put(U.box, palette.roofTile, x, h + 0.42, z + face * d * 0.27, w + 0.6, 0.12, slabDepth, 0, base);
    roofA.rotation.x = face * 0.42;
    const roofB = put(U.box, palette.roofTile, x, h + 0.42, z - face * d * 0.27, w + 0.6, 0.12, slabDepth, 0, base);
    roofB.rotation.x = -face * 0.42;

    // Windows on the road-facing wall
    const rows = h > 4.2 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      const wy = 1.5 + r * 1.5;
      const count = w > 5.4 ? 2 : 1;
      for (let c = 0; c < count; c++) {
        const wx = x + (count === 1 ? 0 : c === 0 ? -w * 0.22 : w * 0.22);
        const lit = rnd() > 0.42;
        const rotY = face === -1 ? Math.PI : 0;
        // Frame sits behind the pane so the lit glass is never covered.
        put(U.plane, palette.woodDark, wx, wy, z + face * (d / 2 + 0.012), 1.26, 1.22, 1, rotY, base);
        put(U.plane, lit ? palette.glassLit : palette.glassCold, wx, wy, z + face * (d / 2 + 0.03), 1.05, 1.0, 1, rotY, base);
      }
    }

    // Door, mailbox, AC unit, potted plants
    put(U.box, palette.woodDark, x + w * 0.3, 1.05, z + face * (d / 2 + 0.05), 0.95, 2.1, 0.1, 0, base);
    put(U.box, palette.metal, x - w * 0.36, 0.5, z + face * (d / 2 + 0.14), 0.34, 0.5, 0.28, 0, base);
    put(U.box, palette.white, x + w * 0.05, h - 0.75, z + face * (d / 2 + 0.16), 0.8, 0.6, 0.36, 0, base);
    for (let p = 0; p < 2; p++) {
      const px = x - w * 0.42 + p * 0.5;
      put(U.cyl, palette.red, px, 0.22, z + face * (d / 2 + 0.28), 0.36, 0.4, 0.36, 0, base);
      put(U.sphereLow, palette.leaf, px, 0.55, z + face * (d / 2 + 0.28), 0.7, 0.6, 0.7, 0, base);
    }

    colliders.push({ x, z, w, d });
  };

  const addShop = (x: number, side: 1 | -1, text: string) => {
    const w = 6.4 + rnd() * 1.6;
    const d = 5.2;
    const h = 3.4;
    const z = roadZ(x) + side * (STREET.buildingLine + d / 2);
    const face = side === -1 ? 1 : -1;
    const g = new THREE.Group();
    root.add(g);
    const facade = new THREE.MeshStandardMaterial({ map: shopTexture(text, '#746c62'), roughness: 0.82 });
    put(U.box, palette.plasterB, x, h / 2, z, w, h, d, 0, g);
    put(U.box, palette.woodDark, x, h + 0.25, z, w + 0.5, 0.5, d + 0.5, 0, g);
    // Detailed shopfront texture on the road-facing wall
    put(U.plane, facade, x, 1.62, z + face * (d / 2 + 0.03), w - 0.6, 2.8, 1, face === -1 ? Math.PI : 0, g);
    put(U.box, palette.wood, x, 2.55, z + face * (d / 2 + 0.03), w - 0.4, 0.22, 0.24, 0, g);
    // Awning
    const awning = put(U.box, palette.awning, x, 2.9, z + face * (d / 2 + 0.7), w - 0.6, 0.1, 1.5, 0, g);
    awning.rotation.x = face * 0.18;
    put(U.box, palette.wood, x, 1.05, z + face * (d / 2 + 0.05), 1.0, 2.1, 0.1, 0, g);
    signPlane(text, x, 3.35, z + face * (d / 2 + 0.08), 2.3, 0.62, face === -1 ? Math.PI : 0);
    colliders.push({ x, z, w, d });
  };

  const addApartment = (x: number, side: 1 | -1) => {
    const w = 6.8;
    const d = 5.4;
    const h = 7.6;
    const z = roadZ(x) + side * (STREET.buildingLine + d / 2);
    const face = side === -1 ? 1 : -1;
    const g = new THREE.Group();
    root.add(g);
    put(U.box, palette.plasterC, x, h / 2, z, w, h, d, 0, g);
    put(U.box, palette.roof, x, h + 0.18, z, w + 0.5, 0.36, d + 0.5, 0, g);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const wx = x - w * 0.3 + c * (w * 0.3);
        const wy = 1.6 + r * 2.1;
        const rotY = face === -1 ? Math.PI : 0;
        put(U.plane, palette.woodDark, wx, wy, z + face * (d / 2 + 0.012), 1.2, 1.4, 1, rotY, g);
        put(U.plane, rnd() > 0.5 ? palette.glassLit : palette.glassCold, wx, wy, z + face * (d / 2 + 0.03), 1.0, 1.2, 1, rotY, g);
        put(U.box, palette.metal, wx, wy - 1.0, z + face * (d / 2 + 0.16), 1.1, 0.5, 0.34, 0, g);
      }
    }
    colliders.push({ x, z, w, d });
  };

  const addConvenienceStore = (x: number, side: 1 | -1) => {
    const w = 9;
    const d = 5.6;
    const h = 3.2;
    const z = roadZ(x) + side * (STREET.buildingLine + d / 2);
    const face = side === -1 ? 1 : -1;
    const g = new THREE.Group();
    root.add(g);
    put(U.box, palette.plasterB, x, h / 2, z, w, h, d, 0, g);
    put(U.box, glow(0xdfe9f2, 0xbcd7ef, 0.6), x, 1.55, z + face * (d / 2 + 0.03), w - 1, 1.7, 0.06, 0, g);
    put(U.box, palette.sign, x, 2.85, z + face * (d / 2 + 0.06), w - 0.6, 0.75, 0.2, 0, g);
    signPlane('便利', x, 2.85, z + face * (d / 2 + 0.18), 1.7, 0.6, face === -1 ? Math.PI : 0);
    // Shelves glimpsed through the glass
    for (let i = 0; i < 3; i++) put(U.box, palette.metal, x - 2.2 + i * 2.2, 0.9, z + face * (d / 2 - 0.8), 1.4, 1.4, 0.5, 0, g);
    colliders.push({ x, z, w, d });
  };

  const addShrine = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.buildingLine + 2.6);
    const g = new THREE.Group();
    root.add(g);
    // Torii gate
    put(U.box, palette.woodRed, x - 1.3, 1.5, z, 0.26, 3, 0.26, 0, g);
    put(U.box, palette.woodRed, x + 1.3, 1.5, z, 0.26, 3, 0.26, 0, g);
    put(U.box, palette.woodRed, x, 3.15, z, 3.4, 0.28, 0.34, 0, g);
    put(U.box, palette.woodRed, x, 2.55, z, 3.0, 0.22, 0.3, 0, g);
    // Steps and small hall behind
    put(U.box, palette.sidewalk, x, 0.2, z + side * 1.6, 4.4, 0.4, 3.2, 0, g);
    put(U.box, palette.plasterC, x, 1.6, z + side * 3.6, 3.6, 2.4, 2.6, 0, g);
    put(U.box, palette.roof, x, 3.0, z + side * 3.6, 4.4, 0.32, 3.4, 0, g);
    put(U.box, glow(0xffe3b4, 0xffca7d, 0.5), x, 1.4, z + side * 2.35, 1.1, 1.4, 0.06, 0, g);
    addTree(x + 2.9, side, 4.6);
    colliders.push({ x, z: z + side * 1.6, w: 4.4, d: 3 });
  };

  const addTree = (x: number, side: 1 | -1, height = 4.2) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 1.5);
    const g = new THREE.Group();
    root.add(g);
    put(U.cyl6, palette.trunk, x, height * 0.34, z, 0.3, height * 0.68, 0.3, 0, g);
    put(U.sphereLow, palette.leaf, x, height * 0.72, z, 2.3, 1.9, 2.3, 0, g);
    put(U.sphereLow, palette.leafLight, x - 0.6, height * 0.9, z + 0.3, 1.5, 1.2, 1.5, 0, g);
    put(U.sphereLow, palette.leaf, x + 0.7, height * 0.85, z - 0.3, 1.3, 1.1, 1.3, 0, g);
    const sway = (t: number) => {
      g.rotation.z = Math.sin(t * 0.7 + x) * 0.012;
    };
    anims.push(sway);
    colliders.push({ x, z, w: 0.6, d: 0.6 });
  };

  const addHedge = (x: number, side: 1 | -1, len: number) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 1.9);
    put(U.box, palette.leaf, x, 0.5, z, len, 0.95, 0.8);
    put(U.box, palette.sidewalk, x, 0.12, z, len + 0.2, 0.24, 1);
  };

  const addHillVariety = () => {
    // Ground strip behind the north buildings so the skyline isn't empty.
    put(U.box, mat(0x1d2228, 0.95), 0, 3.4, roadZ(0) - 22, 90, 6.8, 26);
    put(U.box, mat(0x171b20, 0.95), 0, 5.2, roadZ(0) - 40, 110, 10, 30);
  };
  addHillVariety();

  /* ---------------- STREET FURNITURE ---------------- */
  const addUtilityPole = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 2.6);
    put(U.cyl, palette.woodDark, x, 3.1, z, 0.26, 6.2, 0.26);
    put(U.box, palette.woodDark, x, 5.5, z, 2.6, 0.14, 0.16);
    put(U.box, palette.woodDark, x, 5.0, z, 2.2, 0.12, 0.14);
    colliders.push({ x, z, w: 0.45, d: 0.45 });
    return z;
  };

  const poleXs: number[] = [];
  for (let x = STREET.minX + 2; x <= STREET.maxX - 2; x += 8.5) poleXs.push(x);
  const poleZ = poleXs.map((x) => addUtilityPole(x, -1));
  const wireMat = new THREE.LineBasicMaterial({ color: 0x0f1216, transparent: true, opacity: 0.85 });
  for (let i = 0; i < poleXs.length - 1; i++) {
    [0, -0.5].forEach((offset) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(poleXs[i], 5.5 + offset, poleZ[i]),
        new THREE.Vector3((poleXs[i] + poleXs[i + 1]) / 2, 5.0 + offset, (poleZ[i] + poleZ[i + 1]) / 2),
        new THREE.Vector3(poleXs[i + 1], 5.5 + offset, poleZ[i + 1]),
      ]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(10)), wireMat);
      root.add(line);
    });
  }

  const addStreetLamp = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.roadHalf + 1.1);
    put(U.cyl, palette.darkMetal, x, 2.4, z, 0.14, 4.8, 0.14);
    put(U.box, palette.darkMetal, x, 4.72, z, 1.0, 0.12, 0.16);
    const head = put(U.box, glow(0xf2ead6, 0xffca7d, 0.8), x + 0.45, 4.6, z, 0.5, 0.16, 0.34);
    head.rotation.z = 0.06;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: T.softCircle('rgba(255,206,140,0.75)'), transparent: true, depthWrite: false }),
    );
    sprite.scale.set(2.4, 2.4, 1);
    sprite.position.set(x + 0.45, 4.55, z);
    root.add(sprite);
    colliders.push({ x, z, w: 0.4, d: 0.4 });
  };
  for (let x = STREET.minX + 5; x <= STREET.maxX - 3; x += 11) addStreetLamp(x, 1);
  for (let x = STREET.minX + 10.5; x <= STREET.maxX - 3; x += 11) addStreetLamp(x, -1);

  const addTrafficLight = (x: number) => {
    const z = roadZ(x) + (STREET.roadHalf + 0.9);
    put(U.cyl, palette.darkMetal, x - 0.1, 2.6, z, 0.16, 5.2, 0.16);
    put(U.box, palette.darkMetal, x - 0.1, 5.1, z, 2.6, 0.14, 0.16);
    const housing = put(U.box, palette.darkMetal, x + 1.0, 4.85, z, 1.1, 0.42, 0.3);
    const lensR = put(U.cyl, glow(0x8c2320, 0x8c2320, 1.4), x + 0.72, 4.85, z + 0.17, 0.24, 0.06, 0.24);
    const lensY = put(U.cyl, glow(0x6b6222, 0x6b6222, 1.4), x + 1.0, 4.85, z + 0.17, 0.24, 0.06, 0.24);
    const lensG = put(U.cyl, glow(0x245c2a, 0x245c2a, 1.4), x + 1.28, 4.85, z + 0.17, 0.24, 0.06, 0.24);
    [lensR, lensY, lensG].forEach((l) => (l.rotation.x = Math.PI / 2));
    housing.receiveShadow = false;
    let phase = 0;
    anims.push((t) => {
      const cycle = (t * 0.35 + phase) % 1;
      const state = cycle < 0.42 ? 0 : cycle < 0.55 ? 1 : 2;
      (lensR.material as THREE.MeshStandardMaterial).emissiveIntensity = state === 0 ? 2.4 : 0.25;
      (lensY.material as THREE.MeshStandardMaterial).emissiveIntensity = state === 1 ? 2.4 : 0.25;
      (lensG.material as THREE.MeshStandardMaterial).emissiveIntensity = state === 2 ? 2.4 : 0.25;
    });
  };
  addTrafficLight(0.6);

  const addBusStop = (x: number) => {
    const side: 1 | -1 = 1;
    const z = roadZ(x) + side * (STREET.roadHalf + 1.0);
    put(U.cyl, palette.darkMetal, x, 1.5, z, 0.12, 3, 0.12);
    const sign = new THREE.Mesh(U.plane, new THREE.MeshBasicMaterial({ map: T.doorPlate('バス'), toneMapped: false }));
    sign.position.set(x, 2.85, z);
    sign.scale.set(1.2, 0.5, 1);
    root.add(sign);
    // Bench
    put(U.box, palette.wood, x + 1.9, 0.55, z, 1.7, 0.1, 0.5);
    put(U.box, palette.wood, x + 1.9, 0.95, z + 0.22, 1.7, 0.5, 0.1);
    put(U.box, palette.darkMetal, x + 1.35, 0.3, z, 0.1, 0.5, 0.45);
    put(U.box, palette.darkMetal, x + 2.45, 0.3, z, 0.1, 0.5, 0.45);
    colliders.push({ x: x + 1.9, z, w: 1.9, d: 0.7 });
  };
  addBusStop(-12);

  const addHydrant = (x: number) => {
    const z = roadZ(x) + (STREET.roadHalf + 0.7);
    put(U.cyl, palette.red, x, 0.34, z, 0.26, 0.68, 0.26);
    put(U.sphereLow, palette.red, x, 0.74, z, 0.3, 0.24, 0.3);
    put(U.box, palette.red, x, 0.5, z, 0.5, 0.12, 0.14);
    colliders.push({ x, z, w: 0.4, d: 0.4 });
  };
  addHydrant(6.5);
  addHydrant(-24);

  const addPostBox = (x: number) => {
    const z = roadZ(x) + (STREET.roadHalf + 0.9);
    put(U.cyl, palette.red, x, 0.4, z, 0.42, 0.8, 0.42);
    put(U.sphereLow, palette.red, x, 0.86, z, 0.8, 0.5, 0.8);
    put(U.box, palette.white, x, 0.72, z + 0.35, 0.44, 0.14, 0.02);
    colliders.push({ x, z, w: 0.5, d: 0.5 });
  };
  addPostBox(-6.5);

  const addVending = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 1.1);
    put(U.box, palette.metal, x, 0.95, z, 1.1, 1.9, 0.72);
    const front = glow(0xbcd9ef, 0x8fc6dd, 0.85);
    put(U.box, front, x, 1.15, z + (side === -1 ? 0.38 : -0.38), 0.9, 1.2, 0.03);
    put(U.box, glow(0xf0e6cf, 0xffd9a0, 0.5), x, 1.85, z + (side === -1 ? 0.38 : -0.38), 0.9, 0.24, 0.03);
    colliders.push({ x, z, w: 1.2, d: 0.8 });
  };
  addVending(-2.5, -1);
  addVending(10.5, 1);

  const addBicycle = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 1.4);
    put(U.torus, palette.darkMetal, x - 0.45, 0.34, z, 0.68, 0.68, 0.16, Math.PI / 2);
    put(U.torus, palette.darkMetal, x + 0.45, 0.34, z, 0.68, 0.68, 0.16, Math.PI / 2);
    put(U.box, palette.metal, x, 0.52, z, 1.0, 0.06, 0.06);
    put(U.box, palette.metal, x - 0.3, 0.72, z, 0.06, 0.42, 0.06);
    put(U.box, palette.red, x + 0.3, 0.66, z, 0.4, 0.14, 0.06);
  };

  const addPottedPlant = (x: number, side: 1 | -1) => {
    const z = roadZ(x) + side * (STREET.buildingLine - 1.8);
    put(U.cyl, palette.red, x, 0.26, z, 0.5, 0.5, 0.5);
    put(U.sphereLow, palette.leaf, x, 0.72, z, 0.95, 0.8, 0.95);
  };

  /* ---------------- LAYOUT ALONG THE STREET ---------------- */
  const northTexts = ['茶', '菓子', '印刷', '道具'];
  const southTexts = ['そば', '書', '花', '米'];
  let ni = 0;
  let si = 0;
  for (let x = STREET.minX + 3.5; x <= STREET.maxX - 6; x += 8.2) {
    const variant = Math.floor(rnd() * 3);
    if (rnd() > 0.72) addShop(x, -1, northTexts[ni++ % northTexts.length]);
    else if (rnd() > 0.85) addApartment(x, -1);
    else addHouse(x, -1, variant);
  }
  for (let x = STREET.minX + 7.5; x <= STREET.maxX - 4; x += 8.6) {
    const variant = Math.floor(rnd() * 3);
    if (rnd() > 0.75) addShop(x, 1, southTexts[si++ % southTexts.length]);
    else if (rnd() > 0.88) addApartment(x, 1);
    else addHouse(x, 1, variant);
  }

  addConvenienceStore(-21, -1);
  addShrine(13.5, -1);
  addHedge(-8.5, 1, 4.4);
  addHedge(4.5, 1, 5.2);
  addBicycle(-9.5, 1);
  addBicycle(2.5, -1);
  addBicycle(20.5, -1);
  addPottedPlant(-14, 1);
  addPottedPlant(3.5, 1);
  addPottedPlant(17, 1);
  addPottedPlant(24, -1);
  for (let x = STREET.minX + 9; x <= STREET.maxX - 6; x += 13) addTree(x, 1, 4.4);
  for (let x = STREET.minX + 16; x <= STREET.maxX - 6; x += 15) addTree(x, -1, 5.0);

  /* ---------------- SCHOOL GATE (destination) ---------------- */
  const gateX = STREET.maxX - 1.5;
  // The school closes the end of the street, with the opening aligned to the
  // sidewalk so the walk ends exactly at the gate.
  const wz = walkZ(gateX);
  const gate = new THREE.Group();
  root.add(gate);
  put(U.box, palette.plasterC, gateX, 2.1, wz - 10, 1.3, 4.2, 15, 0, gate);
  put(U.box, palette.plasterC, gateX, 2.1, wz + 10, 1.3, 4.2, 16, 0, gate);
  put(U.box, palette.roof, gateX, 4.34, wz - 10, 1.7, 0.3, 15.2, 0, gate);
  put(U.box, palette.roof, gateX, 4.34, wz + 10, 1.7, 0.3, 16.2, 0, gate);
  for (let i = 0; i < 5; i++) {
    const zz = wz - 8 + i * 5;
    if (Math.abs(zz - wz) < 2.6) continue;
    put(U.plane, palette.woodDark, gateX - 0.64, 2.4, zz, 1.3, 1.5, 1, -Math.PI / 2, gate);
    put(U.plane, i % 2 === 0 ? palette.glassCold : palette.glassLit, gateX - 0.62, 2.4, zz, 1.1, 1.3, 1, -Math.PI / 2, gate);
  }
  put(U.box, palette.plasterC, gateX, 2.6, wz - 1.7, 1.7, 5.2, 1.7, 0, gate);
  put(U.box, palette.plasterC, gateX, 2.6, wz + 1.7, 1.7, 5.2, 1.7, 0, gate);
  put(U.box, palette.darkMetal, gateX, 4.7, wz, 2.1, 0.3, 4.8, 0, gate);
  signPlane('学校', gateX - 1.1, 5.45, wz, 1.8, 0.72, -Math.PI / 2);
  colliders.push({ x: gateX, z: wz - 10, w: 1.8, d: 15.4 });
  colliders.push({ x: gateX, z: wz + 10, w: 1.8, d: 16.4 });
  colliders.push({ x: gateX, z: wz - 1.7, w: 1.9, d: 1.9 });
  colliders.push({ x: gateX, z: wz + 1.7, w: 1.9, d: 1.9 });
  // Courtyard behind the gate
  for (let i = 0; i < 4; i++) {
    put(U.box, i % 2 === 0 ? palette.plasterA : palette.plasterC, gateX + 12, 3.2, wz - 12 + i * 8, 9, 6.4, 6, 0, gate);
    put(U.box, palette.roof, gateX + 12, 6.5, wz - 12 + i * 8, 9.6, 0.34, 6.6, 0, gate);
  }
  for (let i = 0; i < 4; i++) {
    const tz = wz + (i % 2 === 0 ? -3.4 : 3.4);
    const g = new THREE.Group();
    root.add(g);
    put(U.cyl6, palette.trunk, gateX + 3 + i * 0.9, 1.7, tz, 0.32, 3.4, 0.32, 0, g);
    put(U.sphereLow, palette.leaf, gateX + 3 + i * 0.9, 4.1, tz, 2.6, 2.2, 2.6, 0, g);
  }

  // Ground plane under everything
  const ground = put(U.plane, mat(0x1b1f24, 0.95), 0, 0.02, roadZ(0) - 6, 120, 44, 1);
  ground.rotation.x = -Math.PI / 2;

  /* ---------------- PEDESTRIANS (black silhouettes) ---------------- */
  interface Walker {
    sprite: THREE.Sprite;
    x: number;
    dir: 1 | -1;
    speed: number;
    side: 1 | -1;
    bob: number;
    umbrella: boolean;
  }
  const walkers: Walker[] = [];

  for (let i = 0; i < 16; i++) {
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const dir: 1 | -1 = i % 4 < 2 ? 1 : -1;
    const x = STREET.minX + 4 + Math.random() * (STREET.maxX - STREET.minX - 8);
    const umbrella = i % 3 !== 2;
    const sprite = createSilhouette(umbrella, 1.55 + Math.random() * 0.25);
    root.add(sprite);
    walkers.push({
      sprite,
      x,
      dir,
      speed: 0.55 + Math.random() * 0.45,
      side,
      bob: Math.random() * 6,
      umbrella,
    });
  }
  anims.push((t, dt) => {
    walkers.forEach((w) => {
      w.x += w.dir * w.speed * dt;
      if (w.x > STREET.maxX - 1) w.dir = -1;
      if (w.x < STREET.minX + 1) w.dir = 1;
      const z = walkZ(w.x) + w.side * (0.9 + Math.random() * 0.01);
      w.sprite.position.set(w.x, 0.12 + Math.abs(Math.sin(t * 4.5 + w.bob)) * 0.05, z);
      // Sprites are billboards; scale.x flips the facing without rebuilding.
      setSilhouetteFrame(w.sprite, w.dir > 0 ? 'right' : 'left', w.umbrella);
    });
  });

  /* ---------------- RAIN ---------------- */
  const RAIN = 260;
  const rainPos = new Float32Array(RAIN * 6);
  for (let i = 0; i < RAIN; i++) {
    const x = STREET.minX + Math.random() * (STREET.maxX - STREET.minX);
    const y = Math.random() * 10;
    const z = roadZ(x) + (Math.random() - 0.5) * 16;
    rainPos.set([x, y + 0.22, z, x - 0.05, y, z], i * 6);
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(
    rainGeo,
    new THREE.LineBasicMaterial({ color: 0xa8c0d8, transparent: true, opacity: 0.32 }),
  );
  root.add(rain);
  const steam = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: T.softCircle('rgba(210,222,236,0.5)', 128), transparent: true, opacity: 0.18, depthWrite: false }),
  );
  steam.scale.set(60, 20, 1);
  steam.position.set(0, 4, roadZ(0));
  root.add(steam);

  anims.push((_t, dt) => {
    const arr = rainGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < RAIN; i++) {
      const dy = 13 * dt;
      arr[i * 6 + 1] -= dy;
      arr[i * 6 + 4] -= dy;
      if (arr[i * 6 + 4] < 0) {
        arr[i * 6 + 4] = 10;
        arr[i * 6 + 1] = 10.22;
      }
    }
    rainGeo.attributes.position.needsUpdate = true;
  });

  /* ---------------- LIGHTS (kept few on purpose) ---------------- */
  const lamp1 = new THREE.PointLight(0xffca7d, 0.7, 11, 2.2);
  lamp1.position.set(-8, 4.4, roadZ(-8) + STREET.roadHalf + 1.1);
  root.add(lamp1);
  const lamp2 = new THREE.PointLight(0xffca7d, 0.7, 11, 2.2);
  lamp2.position.set(14, 4.4, roadZ(14) + STREET.roadHalf + 1.1);
  root.add(lamp2);
  const storeLight = new THREE.PointLight(0xbcd7ef, 0.6, 10, 2.2);
  storeLight.position.set(-21, 2.2, roadZ(-21) + STREET.buildingLine + 1.5);
  root.add(storeLight);
  const lamp3 = new THREE.PointLight(0xffca7d, 0.55, 10, 2.2);
  lamp3.position.set(26, 4.4, roadZ(26) - STREET.roadHalf - 1.1);
  root.add(lamp3);
  anims.push((t) => {
    lamp1.intensity = 0.7 + Math.sin(t * 6.2) * 0.03;
    lamp3.intensity = Math.sin(t * 11) > 0.93 ? 0.25 : 0.55;
  });

  const animate: Anim = (t, dt) => {
    for (let i = 0; i < anims.length; i++) anims[i](t, dt);
  };

  return {
    group: root,
    colliders,
    bounds: () => ({ minX: STREET.minX - 0.5, maxX: STREET.maxX + 1, minZ: roadZ(0) - 8, maxZ: roadZ(0) + 8 }),
    animate,
    dispose: () => {
      const shared = Object.values(U) as THREE.BufferGeometry[];
      root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry && !shared.includes(mesh.geometry)) mesh.geometry.dispose();
      });
      shared.forEach((geo) => geo.dispose());
      rainGeo.dispose();
      rain.material.dispose();
      steam.material.map?.dispose();
      steam.material.dispose();
      root.removeFromParent();
    },
  };
};
