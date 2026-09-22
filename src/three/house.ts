import * as THREE from 'three';
import * as Mo from './models';
import * as T from './textures';
import { Built, Anim } from './models';
import { makeRoofKawaraTex } from './advancedTextures';
import { resolveProp, localProp } from './props';

export interface Collider {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface RoomZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface HouseBuild {
  group: THREE.Group;
  animate: Anim;
  colliders: Collider[];
  bounds: (x: number) => { minX: number; maxX: number; minZ: number; maxZ: number };
  stairs: { x: number; z: number; r: number };
  spawn: [number, number];
  rooms: RoomZone[];
  roomOf: (x: number, z: number) => string;
  /** Fades objects that belong to rooms other than `roomId` (dim + desaturate). */
  updateRoomFocus: (roomId: string, dt: number) => void;
  updateRoofVisibility: (playerZ: number, playerX: number) => void;
  updateClockTimes: (fixedIds: ReadonlySet<string>) => void;
  dispose: () => void;
}

/* Per-object focus state: each material gets a cloned copy so fading one room
   never affects shared materials in another. */
interface FocusEntry {
  obj: THREE.Object3D;
  room: string;
  mats: { m: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.SpriteMaterial; baseColor: THREE.Color; baseEmissive?: THREE.Color; baseOpacity: number }[];
  lights: { l: THREE.Light; base: number }[];
  focus: number; // 1 = in focus, 0 = fully faded
}



const disposeGroup = (root: THREE.Object3D) => {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
  root.parent?.remove(root);
};

/* ============================================================
   EXTERIOR: street, neighbours, wires, lamp — seen over walls
   ============================================================ */
export const buildExterior = (scene: THREE.Scene): { group: THREE.Group; animate: Anim; dispose: () => void } => {
  Mo.resetSeed(99);
  const g = new THREE.Group();
  scene.add(g);
  const ground = Mo.plane(90, 90, Mo.std(0x0c0f13, 0.85), 0, -0.08, 0, g);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const houseMat = Mo.std(0x14171d, 0.9);
  const roofMat = Mo.std(0x1a1e26, 0.8);
  const wins: { m: THREE.Mesh; on: boolean; next: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const w = 3.2 + Mo.rnd() * 2.2;
    const h = 3.4 + Mo.rnd() * 2.6;
    const d = 3;
    const x = -16 + i * 4.7 + Mo.rnd();
    const z = -7.5 - Mo.rnd() * 3.5;
    Mo.box(w, h, d, houseMat, x, h / 2 - 0.1, z, g);
    const s1 = Mo.box(w + 0.6, 0.12, d * 0.62, roofMat, x, h + 0.42, z - d * 0.27, g);
    s1.rotation.x = 0.55;
    const s2 = Mo.box(w + 0.6, 0.12, d * 0.62, roofMat, x, h + 0.42, z + d * 0.27, g);
    s2.rotation.x = -0.55;
    const nw = 1 + Math.floor(Mo.rnd() * 3);
    for (let k = 0; k < nw; k++) {
      const on = Mo.rnd() > 0.3;
      const m = Mo.plane(0.5, 0.6, new THREE.MeshBasicMaterial({ color: Mo.rnd() > 0.35 ? 0xffd9a0 : 0x9fc4ff }), x - w / 2 + 0.8 + (k * (w - 1.6)) / Math.max(1, nw - 1), 1.2 + Mo.rnd() * (h - 2), z + d / 2 + 0.02, g);
      m.visible = on;
      wins.push({ m, on, next: 5 + Mo.rnd() * 20 });
    }
  }
  Mo.box(6, 4.5, 8, houseMat, -16.5, 2.1, 0, g);
  Mo.box(6, 5.2, 8, houseMat, 16.5, 2.5, 0, g);
  const poleMat = Mo.std(0x2a2723, 0.9);
  Mo.cyl(0.08, 0.11, 8, poleMat, -11.5, 3.9, 4.2, g, 8);
  Mo.box(1.4, 0.08, 0.08, poleMat, -11.5, 7.2, 4.2, g);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x090a0d });
  [[-0.6, 0.2], [0.6, -0.2]].forEach(([ox, oz]) => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-11.5 + ox, 7.2, 4.2 + oz), new THREE.Vector3(2, 6.4, 5.5 + oz), new THREE.Vector3(16, 7.0, 4.6 + oz)]);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), wireMat));
  });
  const lampMat = Mo.std(0x30343a, 0.6, 0.5);
  Mo.cyl(0.05, 0.07, 3.8, lampMat, 5.5, 1.9, 7.2, g, 8);
  Mo.box(0.5, 0.12, 0.25, lampMat, 5.7, 3.8, 7.2, g);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softCircle('rgba(255,225,170,0.9)', 128), transparent: true, opacity: 0.5, depthWrite: false }));
  lampGlow.scale.set(2.2, 2.2, 1);
  lampGlow.position.set(5.75, 3.7, 7.2);
  g.add(lampGlow);
  const sl = new THREE.PointLight(0xffe0a8, 1.3, 12, 2);
  sl.position.set(5.75, 3.6, 7.2);
  g.add(sl);
  const animate: Anim = (t, dt) => {
    wins.forEach((w) => {
      w.next -= dt;
      if (w.next <= 0) {
        w.on = !w.on;
        w.m.visible = w.on;
        w.next = 6 + Mo.rnd() * 25;
      }
    });
    sl.intensity = 1.3 + (Math.sin(t * 0.7) > 0.85 ? Math.sin(t * 40) * 0.25 : 0);
  };
  return { group: g, animate, dispose: () => disposeGroup(g) };
};

/* ============================================================
   FLOORS
   ============================================================ */
export const buildFloor = (floor: 1 | 2, scene: THREE.Scene): HouseBuild => {
  Mo.resetSeed(floor * 131 + 7);
  const root = new THREE.Group();
  scene.add(root);
  const anims: Anim[] = [];
  const colliders: Collider[] = [];
  let updateRoofVisibility: (playerZ: number, playerX: number) => void = () => {};
  let disposed = false;

  /* ---------- Room zones (used for focus fading) ---------- */
  const rooms: RoomZone[] =
    floor === 1
      ? [
          { id: 'grandma', minX: -9.6, maxX: -5.4, minZ: -2.7, maxZ: 2.6 },
          { id: 'living', minX: -5.4, maxX: 0.5, minZ: -2.7, maxZ: 2.6 },
          { id: 'kitchen', minX: 0.5, maxX: 6.4, minZ: -2.7, maxZ: 2.6 },
          { id: 'genkan', minX: 6.4, maxX: 9.6, minZ: -2.7, maxZ: 2.6 },
          { id: 'garden', minX: -9.6, maxX: 0.5, minZ: 2.6, maxZ: 5.5 },
        ]
      : [
          { id: 'bedroom', minX: -7.0, maxX: 0.0, minZ: -2.7, maxZ: 2.6 },
          { id: 'hall', minX: 0.0, maxX: 3.2, minZ: -2.7, maxZ: 2.6 },
          { id: 'study', minX: 3.2, maxX: 7.0, minZ: -2.7, maxZ: 2.6 },
        ];
  const roomOf = (x: number, z: number): string => {
    for (const r of rooms) if (x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ) return r.id;
    // fallback: nearest by X
    let best = rooms[0];
    let bd = Infinity;
    for (const r of rooms) {
      const cx = (r.minX + r.maxX) / 2;
      const d = Math.abs(cx - x);
      if (d < bd) {
        bd = d;
        best = r;
      }
    }
    return best.id;
  };

  const focusEntries: FocusEntry[] = [];
  const registerFocus = (obj: THREE.Object3D, room: string, structural = false) => {
    if (structural) return; // walls/floors keep full lighting so the layout stays readable
    const entry: FocusEntry = { obj, room, mats: [], lights: [], focus: 1 };
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((o as THREE.Light).isLight) {
        const l = o as THREE.Light;
        entry.lights.push({ l, base: l.intensity });
        return;
      }
      if (!m.isMesh && !(o as THREE.Sprite).isSprite) return;
      const mat = m.material as THREE.Material;
      if (!mat || Array.isArray(mat)) return;
      // clone so per-room fading doesn't bleed into shared materials
      const cloned = mat.clone() as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.SpriteMaterial;
      m.material = cloned;
      const std = cloned as THREE.MeshStandardMaterial;
      entry.mats.push({
        m: cloned,
        baseColor: cloned.color.clone(),
        baseEmissive: std.emissive ? std.emissive.clone() : undefined,
        baseOpacity: cloned.opacity,
      });
    });
    focusEntries.push(entry);
  };

  const put = (b: Built, x: number, y: number, z: number, ry = 0, col?: [number, number], structural = false) => {
    b.group.position.set(x, y, z);
    b.group.rotation.y = ry;
    root.add(b.group);
    if (b.animate) anims.push(b.animate);
    if (col) colliders.push({ x, z, w: col[0], d: col[1] });
    registerFocus(b.group, roomOf(x, z), structural);
    return b;
  };
  const light = (color: number, intensity: number, dist: number, x: number, y: number, z: number) => {
    // Scale down authored intensities for a darker, more cinematic night look
    const i = intensity * 0.55;
    const l = new THREE.PointLight(color, i, dist * 1.05, 2.2);
    l.position.set(x, y, z);
    root.add(l);
    focusEntries.push({ obj: l, room: roomOf(x, z), mats: [], lights: [{ l, base: i }], focus: 1 });
    return l;
  };

  /**
   * Places an inspectable prop from the shared registry. The local model shows
   * immediately; if a textured CC0 model resolves, it replaces it here too —
   * so the object in the room is always the one the inspection view displays.
   */
  const putProp = (id: string, x: number, y: number, z: number, ry = 0, col?: [number, number]) => {
    const slot = new THREE.Group();
    slot.position.set(x, y, z);
    slot.rotation.y = ry;
    root.add(slot);
    if (col) colliders.push({ x, z, w: col[0], d: col[1] });

    const placeholder = localProp(id);
    if (placeholder) slot.add(placeholder);
    registerFocus(slot, roomOf(x, z));

    resolveProp(id).then((prop) => {
      if (disposed || !slot.parent) return;
      const next = prop.build();
      // Only rebuild when the registry resolved to something else.
      if (!prop.remote) return;
      [...slot.children].forEach((child) => {
        slot.remove(child);
        child.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
        });
      });
      slot.add(next);
      registerFocus(slot, roomOf(x, z));
    }).catch(() => { /* the local model stays in place */ });

    return slot;
  };

  const putClock = (id: string, x: number, y: number, z: number, digital = false) => {
    const built = digital ? Mo.bedsideClock('03:17') : Mo.wallClock(3, 17, 0, false);
    built.group.name = `house-clock:${id}`;
    return put(built, x, y, z);
  };

  // Cheap room focus: only runs while a room transition is in progress.
  // Uses simple intensity/opacity scaling instead of per-pixel colour lerps.
  let focusRoom = '';
  let focusSettling = true;
  const updateRoomFocus = (roomId: string, dt: number) => {
    if (roomId !== focusRoom) {
      focusRoom = roomId;
      focusSettling = true;
    }
    if (!focusSettling) return;
    const k = Math.min(1, dt * 3.2);
    let any = false;
    for (let i = 0; i < focusEntries.length; i++) {
      const e = focusEntries[i];
      const target = e.room === roomId ? 1 : 0.18;
      const d = target - e.focus;
      if (Math.abs(d) < 0.008) {
        if (e.focus !== target) e.focus = target;
        else continue;
      } else {
        e.focus += d * k;
        any = true;
      }
      const f = e.focus;
      // Lights: cheap
      for (let j = 0; j < e.lights.length; j++) e.lights[j].l.intensity = e.lights[j].base * (0.12 + f * 0.88);
      // Materials: only sprites get opacity fade; meshes just get a light dim via emissive
      for (let j = 0; j < e.mats.length; j++) {
        const mm = e.mats[j];
        if (mm.m instanceof THREE.SpriteMaterial) {
          mm.m.opacity = mm.baseOpacity * (0.28 + f * 0.72);
        } else {
          const std = mm.m as THREE.MeshStandardMaterial;
          // Soft dim: lerp colour toward a darker version of itself (once, cheap)
          mm.m.color.copy(mm.baseColor).multiplyScalar(0.35 + f * 0.65);
          if (mm.baseEmissive && std.emissive) std.emissive.copy(mm.baseEmissive).multiplyScalar(0.15 + f * 0.85);
        }
      }
    }
    if (!any) focusSettling = false;
  };

  if (floor === 1) {
    /* ---------- FLOORS ---------- */
    put(Mo.tatamiFloor(3.9, 4.9, 2, 3), -7.45, 0, 0, 0, undefined, true);
    put(Mo.tatamiFloor(5.7, 4.9, 3, 3), -2.55, 0, 0, 0, undefined, true);
    put(Mo.woodFloor(5.9, 4.9), 3.45, 0, 0, 0, undefined, true);
    put(Mo.stoneFloor(3.0, 4.9), 7.95, 0, 0, 0, undefined, true);
    put(Mo.engawa(9.3), -4.85, 0, 3.0, 0, undefined, true);
    put(Mo.garden(9.3, 1.8), -4.85, 0, 4.3);

    /* ---------- WALLS & PARTITIONS ---------- */
    put(Mo.wall(19.0, 3.0), 0, 0, -2.55, 0, undefined, true);
    put(Mo.wall(5.0, 3.0), -9.45, 0, 0, Math.PI / 2, undefined, true);
    put(Mo.wall(5.0, 3.0), 9.45, 0, 0, Math.PI / 2, undefined, true);
    put(Mo.fusuma(2.2, 2.7), -5.4, 0.16, -1.4, Math.PI / 2, [0.2, 2.2], true);
    put(Mo.fusuma(1.2, 2.7), -5.4, 0.16, 1.85, Math.PI / 2, [0.2, 1.2], true);
    put(Mo.lintel(1.6), -5.4, 2.86, 0.48, Math.PI / 2, undefined, true);
    put(Mo.wall(2.1, 3.0), 0.5, 0, -1.5, Math.PI / 2, [0.2, 2.1], true);
    put(Mo.wall(1.3, 3.0), 0.5, 0, 1.8, Math.PI / 2, [0.2, 1.3], true);
    put(Mo.lintel(1.7), 0.5, 2.86, 0.35, Math.PI / 2, undefined, true);
    put(Mo.noren(1.55), 0.5, 2.7, 0.35, Math.PI / 2);
    // Wide hallway opening between Genkan and Kitchen (z from -0.8 to 1.1)
    put(Mo.wall(1.6, 3.0), 6.4, 0, -1.75, Math.PI / 2, [0.2, 1.6], true);
    put(Mo.wall(1.3, 3.0), 6.4, 0, 1.8, Math.PI / 2, [0.2, 1.3], true);
    put(Mo.lintel(1.9), 6.4, 2.86, 0.15, Math.PI / 2, undefined, true);
    put(Mo.stepBoard(1.8), 6.4, 0, 0.15, 0, undefined, true);
    [-9.33, -5.4, 0.5, 6.4, 9.33].forEach((x) => put(Mo.pillar(3.1), x, 0, -2.4, 0, undefined, true));
    put(Mo.beam(19.0), 0, 3.1, -1.1, 0, undefined, true);
    put(Mo.beam(19.0), 0, 3.1, 1.3, 0, undefined, true);
    put(Mo.eave(9.6), -4.85, 0, 3.45, 0, undefined, true);

    /* ---------- GRANDMA'S ROOM ---------- */
    put(Mo.butsudan(), -8.7, 0.16, -2.05, 0, [1.1, 0.75]);
    putClock('grandma_clock', -8.85, 2.15, -2.42);
    put(Mo.wallFrame(T.familyPhotoTex(), 0.62, 0.46), -6.4, 1.75, -2.46);
    put(Mo.shojiWindow(1.3, 1.1), -7.4, 1.75, -2.46);
    put(Mo.futonFolded(), -6.35, 0.16, -1.55, 0, [1.15, 0.95]);
    put(Mo.lowTable(), -7.45, 0.16, 0.75, 0, [1.15, 0.85]);
    put(Mo.zabuton(0x6b7280), -7.45, 0.16, 1.55);
    put(Mo.kimonoStand(), -8.95, 0.16, 0.9, Math.PI / 2, [0.45, 1.35]);
    put(Mo.plant('fern'), -5.95, 0.16, 2.0, 0, [0.55, 0.55]);
    put(Mo.pendantLamp(false), -7.45, 3.0, 0.3);

    /* ---------- LIVING ROOM ---------- */
    put(Mo.tokonoma(), -4.35, 0.16, -2.05, 0, [1.85, 0.95]);
    putClock('living_clock', -2.6, 2.05, -2.42);
    put(Mo.tansu(), -1.55, 0.16, -2.22, 0, [1.7, 0.6]);
    put(Mo.phoneTable(), 0.0, 0.16, -2.12, 0, [0.9, 0.9]);
    put(Mo.kotatsu(), -2.6, 0.16, 0.3, 0, [2.35, 2.35]);
    put(Mo.zabuton(), -2.6, 0.16, 1.9);
    put(Mo.zabuton(), -4.2, 0.16, 0.3);
    put(Mo.zabuton(), -1.0, 0.16, 0.3);
    putProp('living_tv', -4.8, 0.62, 1.75, Math.PI / 2, [0.75, 1.2]);
    put(Mo.heater(), -0.35, 0.16, 1.5, -Math.PI / 2, [0.6, 0.7]);
    put(Mo.floorFan(), -4.75, 0.16, -1.0, Math.PI / 5, [0.5, 0.5]);
    put(Mo.plant('monstera'), 0.05, 0.16, 2.05, 0, [0.6, 0.6]);
    put(Mo.pendantLamp(true), -2.6, 3.0, 0.2);
    put(Mo.moths(3, 0.55), -2.6, 2.15, 0.2);
    put(Mo.cat(-4.2, -0.9, 1.9), 0, 0, 0);

    /* ---------- KITCHEN ---------- */

    /* ---------- KITCHEN ---------- */
    put(Mo.kitchenCounter(3.8), 2.8, 0.16, -2.12, 0, [3.8, 0.85]);
    put(Mo.kitchenShelf(2.0), 3.4, 1.95, -2.44);
    put(Mo.rangeHood(), 1.85, 2.05, -2.2);
    putClock('kitchen_clock', 2.55, 2.24, -2.44);
    put(Mo.fridge(), 5.35, 0.16, -2.02, 0, [0.95, 0.95]);
    // Dining set placed with clear 1.4m clearance to Genkan doorway
    put(Mo.diningSet(), 3.1, 0.16, 0.85, 0, [1.4, 1.6]);
    putProp('calendar_kyoto', 5.75, 1.75, -1.45, 0);
    put(Mo.trashBin(), 5.3, 0.16, -1.15, 0, [0.35, 0.35]);
    put(Mo.broom(), 0.8, 0.16, -1.85, 0);
    put(Mo.chiyo(), 2.2, 0.16, -1.15, 0, [0.55, 0.4]);
    put(Mo.pendantLamp(false), 3.1, 3.0, 0.85);

    /* ---------- GENKAN ---------- */
    put(Mo.coatRack(), 7.1, 0, -2.1, 0, [0.45, 0.45]);
    put(Mo.shoeRack(), 8.15, 0, -2.15, 0, [1.2, 0.5]);
    put(Mo.schoolBag(), 7.45, 0, -1.65, 0.5);
    put(Mo.frontDoor(), 9.36, 0, -1.35, -Math.PI / 2);
    put(Mo.doormat(), 8.85, 0.085, -1.35, Math.PI / 2);
    put(Mo.umbrellaStand(), 7.15, 0, 1.35, 0, [0.35, 0.35]);
    put(Mo.mirror(0.5, 1.1), 6.5, 1.5, -1.75, Math.PI / 2);
    put(Mo.slippers(), 7.0, 0.08, 0.15, 0.2);
    put(Mo.stairs(true, 7), 8.35, 0.08, 2.3, 0);
    putClock('hall_clock', 6.9, 2.1, -2.42);
    // Collider placed ONLY on the steep raised body of the staircase, not blocking the base!
    colliders.push({ x: 8.35, z: 0.85, w: 1.3, d: 1.4 });
    light(0xffd0a0, 1.1, 7, 7.8, 2.5, 0.2);

    /* ---------- ENGAWA / GARDEN DETAILS ---------- */
    put(Mo.furin(), -3.2, 2.72, 3.1);
    putClock('engawa_clock', -4.85, 1.5, 3.26);
    put(Mo.laundryPole(), -7.6, 0.1, 3.05);
    put(Mo.geta(), -2.1, 0.12, 2.95, 0.3);
    put(Mo.wateringCan(), -8.6, 0.12, 3.05, 0.7);

    /* ---------- TRADITIONAL ROOF (DYNAMIC OCCLUSION) ---------- */
    // When inside, roof fades to 0 opacity so the house interior is clearly visible.
    // When walking outside to the engawa or garden (playerZ > 2.65), roof becomes solid and covers interior.
    const roofGroup = new THREE.Group();
    root.add(roofGroup);
    roofGroup.position.set(0, 3.25, 0);

    const roofTex = makeRoofKawaraTex();
    roofTex.repeat.set(8, 3);
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      roughness: 0.65,
      metalness: 0.2,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    // Main roof pitch over house interior
    const roofLeft = Mo.mesh(new THREE.PlaneGeometry(19.5, 4.2), roofMat, 0, 0.7, -1.2, roofGroup);
    roofLeft.rotation.x = 0.35;
    const roofRight = Mo.mesh(new THREE.PlaneGeometry(19.5, 4.2), roofMat, 0, 0.7, 1.2, roofGroup);
    roofRight.rotation.x = -0.35;

    // Interior ceiling blocker (dark felt)
    const ceilingMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const ceilingBlocker = Mo.mesh(new THREE.PlaneGeometry(19.2, 5.4), ceilingMat, 0, -0.05, 0, roofGroup);
    ceilingBlocker.rotation.x = Math.PI / 2;

    updateRoofVisibility = (playerZ: number) => {
      // Engawa starts at z ~ 2.6; garden is z ~ 3.5 to 5.0
      const isOutside = playerZ > 2.65;
      const targetOpacity = isOutside ? 1.0 : 0.0;
      roofMat.opacity += (targetOpacity - roofMat.opacity) * 0.12;
      ceilingMat.opacity += (targetOpacity - ceilingMat.opacity) * 0.12;
      roofGroup.visible = roofMat.opacity > 0.02;
    };
  } else {
    /* ---------- FLOORS ---------- */
    put(Mo.tatamiFloor(6.7, 4.9, 3, 3), -3.4, 0, 0, 0, undefined, true);
    put(Mo.woodFloor(3.2, 4.9), 1.6, 0, 0, 0, undefined, true);
    put(Mo.woodFloor(3.7, 4.9), 5.05, 0, 0, 0, undefined, true);
    put(Mo.rug(0.9, 3.4, 'red'), 1.6, 0.15, 0.1);
    put(Mo.rug(1.7, 1.2, 'blue'), -3.3, 0.17, 0.95);

    /* ---------- WALLS ---------- */
    put(Mo.wall(13.8, 3.0), 0, 0, -2.55, 0, undefined, true);
    put(Mo.wall(5.0, 3.0), -6.85, 0, 0, Math.PI / 2, undefined, true);
    put(Mo.wall(5.0, 3.0), 6.85, 0, 0, Math.PI / 2, undefined, true);
    put(Mo.wall(2.1, 3.0), 0, 0, -1.5, Math.PI / 2, [0.2, 2.1], true);
    put(Mo.wall(1.4, 3.0), 0, 0, 1.75, Math.PI / 2, [0.2, 1.4], true);
    put(Mo.lintel(1.6), 0, 2.86, 0.3, Math.PI / 2, undefined, true);
    put(Mo.doorPlateSign('ガブリエラ'), 0.1, 2.35, -0.55, Math.PI / 2);
    put(Mo.wall(2.3, 3.0), 3.2, 0, -1.4, Math.PI / 2, [0.2, 2.3], true);
    put(Mo.wall(1.4, 3.0), 3.2, 0, 1.75, Math.PI / 2, [0.2, 1.4], true);
    put(Mo.lintel(1.4), 3.2, 2.86, 0.35, Math.PI / 2, undefined, true);
    [-6.75, 0, 3.2, 6.75].forEach((x) => put(Mo.pillar(3.1), x, 0, -2.4, 0, undefined, true));
    put(Mo.beam(13.8), 0, 3.1, -1.1, 0, undefined, true);
    put(Mo.beam(13.8), 0, 3.1, 1.3, 0, undefined, true);

    /* ---------- GABRIELA'S ROOM ---------- */
    put(Mo.windowUnit(2.6, 1.9), -3.3, 1.85, -2.44);
    put(Mo.bed(), -5.7, 0.16, -1.15, 0, [1.85, 2.65]);
    put(Mo.nightstand(), -4.15, 0.16, -2.05, 0, [0.6, 0.6]);
    putClock('bedroom_clock', -4.21, 0.79, -1.97, true);
    put(Mo.desk(), -1.7, 0.16, -1.95, 0, [2.2, 1.0]);
    put(Mo.chair(), -1.7, 0.16, -1.15, Math.PI, [0.55, 0.55]);
    put(Mo.corkboard(), -1.7, 1.95, -2.44);
    put(Mo.poster(T.kyotoMap(), 1.0, 0.75), -0.5, 1.6, -2.44);
    put(Mo.poster(T.scheduleTex(), 0.5, 0.72), -6.2, 1.75, -2.44);
    put(Mo.bookshelf(1.7, 2.3, 4), -6.55, 0.16, 0.9, Math.PI / 2, [0.6, 1.8]);
    put(Mo.coatRack(), -0.5, 0.16, 1.95, 0, [0.5, 0.5]);
    put(Mo.schoolBag(), -1.25, 0.16, 1.55, 0.6);
    put(Mo.slippers(), -4.6, 0.16, 0.45, 0);
    put(Mo.pendantLamp(true), -3.4, 3.0, 0.4);

    /* ---------- HALLWAY ---------- */
    put(Mo.missingPainting(), 0.9, 1.6, -2.44);
    put(Mo.doorClosed(0.9, 2.1, '浴室'), 2.3, 0.16, -2.47);
    put(Mo.wallFrame(T.familyPhotoTex(), 0.46, 0.36), 1.55, 1.95, -2.46);
    put(Mo.floorLamp(), 2.85, 0.16, -1.85, 0, [0.4, 0.4]);
    put(Mo.pendantLamp(false), 1.6, 3.0, 0.3);

    /* ---------- STUDY ---------- */
    put(Mo.studyDesk(), 4.75, 0.16, -1.85, 0, [2.0, 1.1]);
    putProp('cedar_box', 5.15, 1.12, -1.8, 0.25);
    putProp('study_photo', 4.35, 1.18, -2.2, 0.06);
    put(Mo.chair('leather'), 4.75, 0.16, -1.05, Math.PI, [0.55, 0.55]);
    put(Mo.bookshelf(1.9, 2.5, 4), 6.55, 0.16, 0.5, -Math.PI / 2, [0.6, 2.0]);
    put(Mo.armchair(), 4.1, 0.16, 1.25, 0.6, [1.05, 1.05]);
    put(Mo.globe(), 6.0, 0.16, -1.95, 0, [0.5, 0.5]);
    putClock('study_clock', 4.2, 2.24, -2.4);
    put(Mo.wallFrame(T.familyPhotoTex(), 0.4, 0.3), 5.5, 1.85, -2.46);
    put(Mo.wallFrame(T.familyPhotoTex(), 0.34, 0.26), 6.05, 1.9, -2.46);
    // Bedroom clock also starts wrong during the morning task and is fixed through its modal.
    put(Mo.stairs(false, 7), 6.1, 0.16, 1.0, 0);
    colliders.push({ x: 6.1, z: 2.0, w: 1.5, d: 1.4 });
    put(Mo.pendantLamp(false), 5.0, 3.0, 0.2);
  }

  const animate: Anim = (t, dt) => {
    for (let i = 0; i < anims.length; i++) anims[i](t, dt);
  };

  const bounds =
    floor === 1
      ? (x: number) => ({ minX: -9.15, maxX: 9.15, minZ: -2.1, maxZ: x < -0.5 ? 4.9 : 2.35 })
      : () => ({ minX: -6.55, maxX: 6.55, minZ: -2.1, maxZ: 2.35 });

  let clockSignature = '';
  const updateClockTimes = (fixedIds: ReadonlySet<string>) => {
    const signature = [...fixedIds].sort().join('|');
    if (signature === clockSignature) return;
    clockSignature = signature;
    root.traverse((object) => {
      if (!object.name.startsWith('house-clock:')) return;
      const id = object.name.slice('house-clock:'.length);
      const setter = object.userData.setTime as ((h: number, m: number) => void) | undefined;
      setter?.(fixedIds.has(id) ? 7 : 3, fixedIds.has(id) ? 0 : 17);
    });
  };

  return {
    group: root,
    animate,
    colliders,
    bounds,
    stairs: floor === 1 ? { x: 8.35, z: 2.1, r: 1.2 } : { x: 6.1, z: 0.9, r: 1.0 },
    spawn: floor === 1 ? [7.2, 0.4] : [-3.3, 0.9],
    rooms,
    roomOf,
    updateRoomFocus,
    updateRoofVisibility,
    updateClockTimes,
    dispose: () => {
      disposed = true;
      disposeGroup(root);
    },
  };
};
