import * as THREE from 'three';
import * as Mo from './models';
import type { Anim } from './models';
import { makeCedarWoodTex } from './advancedTextures';
import * as T from './textures';

interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
type RoomResolver = (x: number, z: number) => string;

export interface MapBuild {
  group: THREE.Group;
  colliders: { x: number; z: number; w: number; d: number }[];
  stairs: { x: number; z: number; r: number };
  bounds: () => MapBounds;
  spawn: [number, number];
  roomOf: RoomResolver;
  updateFocus?: (room: string, dt: number) => void;
  animate: Anim;
  dispose: () => void;
}

const groupOf = (objects: THREE.Object3D[]) => {
  const g = new THREE.Group();
  objects.forEach((o) => g.add(o));
  return g;
};

/* Small, readable 2.5D slice of the walk to school. */
export const buildNeighborhood = (variant: 'morning' | 'evening'): MapBuild => {
  const root = new THREE.Group();
  const colliders: MapBuild['colliders'] = [];
  const anims: Anim[] = [];

  // Wet asphalt street with raised sidewalks, not an interior floor material.
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x242a31, roughness: 0.32, metalness: 0.18 });
  const road = Mo.box(18, 0.1, 8, asphalt, 0, 0.05, 1, root);
  road.receiveShadow = true;
  Mo.box(18, 0.14, 1.5, Mo.std(0x555a60, 0.8), 0, 0.12, -2.75, root);
  Mo.box(18, 0.14, 1.0, Mo.std(0x555a60, 0.8), 0, 0.12, 4.45, root);
  // Thin wet highlights in the road.
  [-1.5, 0.2, 1.8, 3.1].forEach((z) => {
    const patch = Mo.plane(3.2, 0.28, new THREE.MeshBasicMaterial({ color: 0x6d8195, transparent: true, opacity: 0.12 }), -4 + Math.random() * 8, 0.105, z, root);
    patch.rotation.x = -Math.PI / 2;
  });
  colliders.push(...[
    // storefronts to the north (negative z)
    { x: -6, z: -3.1, w: 3.0, d: 0.5 },
    { x: -2.3, z: -3.1, w: 2.2, d: 0.5 },
    { x: 1.2, z: -3.1, w: 2.4, d: 0.5 },
    { x: 5.1, z: -3.1, w: 2.8, d: 0.5 },
  ]);

  const stoneMat = Mo.std(0x22252b, 0.9);
  const woodMat = Mo.std(0x3b2d24, 0.8);
  const signMat = new THREE.MeshStandardMaterial({ color: variant === 'morning' ? 0xb8413a : 0x6d3431, roughness: 0.65 });

  // Early shop
  const shop = groupOf([
    Mo.mesh(new THREE.BoxGeometry(2.6, 2.35, 0.5), woodMat, 0, 1.18, 0),
    Mo.mesh(new THREE.BoxGeometry(1.1, 0.55, 0.54), signMat, -0.1, 1.9, 0.02),
    Mo.plane(1.4, 0.9, new THREE.MeshBasicMaterial({ map: T.norenTex() }), 0, 1.05, 0.28),
    Mo.mesh(new THREE.BoxGeometry(0.45, 0.28, 0.4), Mo.MAT.steel, 0.9, 0.35, 0.35),
  ]);
  shop.position.set(-6, 0, -2.7);
  root.add(shop);

  // Vending machine
  const vending = groupOf([
    Mo.mesh(new THREE.BoxGeometry(0.75, 1.75, 0.55), Mo.MAT.steel, 0, 0.88, 0),
    Mo.mesh(new THREE.PlaneGeometry(0.55, 1.0), new THREE.MeshBasicMaterial({ color: variant === 'morning' ? 0x8fc6dd : 0x35505f }), 0, 1.0, 0.285),
  ]);
  vending.position.set(-2.3, 0, -2.72);
  root.add(vending);

  // Bookstore
  const bookstore = groupOf([
    Mo.mesh(new THREE.BoxGeometry(2.1, 2.1, 0.5), woodMat, 0, 1.05, 0),
    Mo.plane(1.3, 0.38, new THREE.MeshBasicMaterial({ map: T.doorPlate('本屋') }), 0, 1.7, 0.28),
    Mo.mesh(new THREE.BoxGeometry(1.2, 1.1, 0.06), Mo.std(0x1c2228, 0.35, 0.05), 0, 0.85, 0.28),
  ]);
  bookstore.position.set(1.2, 0, -2.72);
  root.add(bookstore);

  // Shrine gate down the side street
  const toriiMat = Mo.std(0x7a2724, 0.75);
  const torii = groupOf([
    Mo.mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), toriiMat, -0.75, 1.1, 0),
    Mo.mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), toriiMat, 0.75, 1.1, 0),
    Mo.mesh(new THREE.BoxGeometry(2.2, 0.18, 0.2), toriiMat, 0, 2.05, 0),
    Mo.mesh(new THREE.BoxGeometry(1.8, 0.14, 0.18), toriiMat, 0, 2.32, 0),
    Mo.mesh(new THREE.BoxGeometry(0.18, 0.18, 3.2), stoneMat, 0, 0.09, 1.55),
  ]);
  torii.position.set(5.1, 0, -2.7);
  root.add(torii);

  // Small school gate at the far east end
  const gateMat = Mo.std(0x2f343b, 0.8);
  const gate = groupOf([
    Mo.mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), gateMat, -1, 1.25, 0),
    Mo.mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), gateMat, 1, 1.25, 0),
    Mo.mesh(new THREE.BoxGeometry(2.5, 0.2, 0.2), gateMat, 0, 2.45, 0),
    Mo.plane(1.8, 0.42, new THREE.MeshBasicMaterial({ map: T.doorPlate('学校') }), 0, 2.78, 0.05),
  ]);
  gate.position.set(8.0, 0, 1.1);
  root.add(gate);

  // Street lamps and wet patches
  [-6.8, -2.4, 2.2, 6.4].forEach((x, i) => {
    Mo.cyl(0.035, 0.05, 3.2, Mo.MAT.steel, x, 1.6, 3.2, root, 8);
    const light = new THREE.PointLight(variant === 'morning' ? 0xdfe8ff : 0xffc77d, variant === 'morning' ? 0.15 : 0.8, 5.5, 2);
    light.position.set(x, 3.0, 3.2);
    root.add(light);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softCircle(variant === 'morning' ? 'rgba(220,230,255,.55)' : 'rgba(255,200,130,.8)'), transparent: true, depthWrite: false }));
    glow.scale.set(0.7, 0.7, 1);
    glow.position.set(x, 3, 3.2);
    root.add(glow);
    if (i === 2 && variant === 'evening') {
      const flicker = { l: light, g: glow };
      anims.push((t) => {
        const f = Math.sin(t * 9) > 0.9 ? 0.5 : 1;
        flicker.l.intensity = (variant === 'evening' ? 0.8 : 0.15) * f;
      });
    }
  });

  // Rain in the morning, misty dusk in the evening
  const weather = new THREE.Group();
  root.add(weather);
  if (variant === 'morning') {
    const count = 140;
    const arr = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const x = -9 + Math.random() * 18;
      const y = Math.random() * 6;
      const z = -2 + Math.random() * 7;
      arr.set([x, y, z, x - 0.03, y - 0.22, z], i * 6);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9fb8d2, transparent: true, opacity: 0.35 }));
    weather.add(rain);
    anims.push((_, dt) => {
      rain.position.y -= dt * 3;
      if (rain.position.y < -1) rain.position.y = 1.5;
    });
  }

  const animate: Anim = (t, dt) => anims.forEach((a) => a(t, dt));
  return {
    group: root,
    colliders,
    stairs: { x: 0, z: 99, r: 0 },
    spawn: variant === 'morning' ? [-8.2, 2.2] : [8.1, 2.2],
    bounds: () => ({ minX: -8.8, maxX: 8.8, minZ: -2.0, maxZ: 4.2 }),
    roomOf: (x) => (x < -5 ? 'shop' : x < -0.8 ? 'vending' : x < 3.2 ? 'bookstore' : x < 6.7 ? 'shrine' : 'school_gate'),
    animate,
    dispose: () => {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      root.removeFromParent();
    },
  };
};

/* Stylised school: hall and a single classroom set. */
export const buildSchool = (): MapBuild => {
  const root = new THREE.Group();
  const colliders: MapBuild['colliders'] = [];

  // Hall floor and classroom floor
  const hall = Mo.woodFloor(12, 4.2);
  hall.group.position.set(-1.2, 0, 0);
  root.add(hall.group);
  const room = Mo.woodFloor(5.2, 4.2);
  room.group.position.set(6.8, 0, 0);
  root.add(room.group);

  const wallMat = Mo.std(0x2b2e34, 0.9);
  // Corridor lockers and classroom door wall
  [-5.4, -4.0, -2.6, -1.2, 0.2].forEach((x) => {
    const locker = Mo.mesh(new THREE.BoxGeometry(0.7, 1.7, 0.35), Mo.MAT.steel, x, 0.85, -1.85);
    root.add(locker);
    colliders.push({ x, z: -1.65, w: 0.75, d: 0.45 });
  });
  Mo.mesh(new THREE.BoxGeometry(12.4, 2.8, 0.16), wallMat, -1.2, 1.4, -2.1, root);
  Mo.mesh(new THREE.BoxGeometry(12.4, 2.8, 0.16), wallMat, -1.2, 1.4, 2.1, root);

  // Classroom: desks in rows
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 5.7 + col * 1.1;
      const z = -1.0 + row * 1.0;
      const desk = Mo.mesh(new THREE.BoxGeometry(0.72, 0.08, 0.5), Mo.MAT.walnut, x, 0.72, z);
      root.add(desk);
      Mo.mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), Mo.MAT.darkWood, x - 0.28, 0.35, z - 0.18, root);
      Mo.mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), Mo.MAT.darkWood, x + 0.28, 0.35, z - 0.18, root);
      if (Math.random() > 0.45) Mo.mesh(new THREE.BoxGeometry(0.28, 0.025, 0.2), Mo.std(0xd9d3c5, 0.85), x, 0.78, z);
    }
  }
  // Blackboard
  Mo.mesh(new THREE.BoxGeometry(3.1, 1.55, 0.1), Mo.std(0x111513, 0.9), 6.8, 1.45, -1.95, root);
  const boardTex = makeCedarWoodTex();
  boardTex.wrapS = THREE.RepeatWrapping;
  boardTex.wrapT = THREE.RepeatWrapping;
  boardTex.repeat.set(2, 1);
  Mo.plane(2.85, 1.3, new THREE.MeshBasicMaterial({ map: boardTex, color: 0x20382d }), 6.8, 1.45, -1.88, root);

  const animate: Anim = () => {};
  return {
    group: root,
    colliders,
    stairs: { x: -6.6, z: 0.2, r: 1.1 },
    spawn: [-6.6, 0.2],
    bounds: () => ({ minX: -6.9, maxX: 9.1, minZ: -1.75, maxZ: 1.75 }),
    roomOf: (x) => (x < 4.2 ? 'school_hall' : 'classroom'),
    animate,
    dispose: () => {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      root.removeFromParent();
    },
  };
};
