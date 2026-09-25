import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Anim } from './models';
import * as T from './textures';
import { createSilhouette } from './silhouetteSprite';
import * as Mo from './models';


export interface SchoolNpc {
  id: string;
  name: string;
  role?: string;
  x: number;
  z: number;
  dialogueNodeId?: string;
  lines: string[];
}

export interface SchoolSpot {
  id: string;
  name: string;
  type: 'INSPECIONAR' | 'EXAMINAR' | 'CONVERSAR' | 'ABRIR';
  x: number;
  z: number;
  dialogueNodeId?: string;
  action?: () => void;
}

export interface SchoolDoor {
  id: string;
  x: number;
  z: number;
  isOpen: boolean;
}

export interface SchoolBuild {
  group: THREE.Group;
  colliders: { x: number; z: number; w: number; d: number; enabled?: boolean }[];
  bounds: () => { minX: number; maxX: number; minZ: number; maxZ: number };
  animate: Anim;
  npcs: SchoolNpc[];
  spots: SchoolSpot[];
  doors: SchoolDoor[];
  toggleDoor: (id: string) => void;
  updateCameraOcclusion: (camera: THREE.Camera, player: THREE.Vector3, dt?: number) => void;
  cameraBlockers?: THREE.Object3D[];
  deskAt: [number, number];
  dispose: () => void;
}

const shelfLoader = new GLTFLoader();
  export const buildSchool = (): SchoolBuild => {
    Mo.resetSeed(47);
    const root = new THREE.Group();
    const colliders: SchoolBuild['colliders'] = [];
    const anims: Anim[] = [];
    const npcs: SchoolNpc[] = [];
    const spots: SchoolSpot[] = [];
    const doors: SchoolDoor[] = [];
    const doorParts: { door: SchoolDoor; pivot: THREE.Group; collider: { x: number; z: number; w: number; d: number; enabled?: boolean } }[] = [];
    const occlusionWalls: { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial }[] = [];
    const occlusionTargets: THREE.Object3D[] = [];
    const occlusionRay = new THREE.Raycaster();

    const signMeshes: THREE.Mesh[] = [];
    const sign = (text: string, x: number, y: number, z: number, w: number, h: number, ry: number, roomId?: string) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T.doorPlate(text), toneMapped: false, side: THREE.DoubleSide }));
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, 1);
      mesh.rotation.y = ry;
      mesh.userData.room = roomId ?? null;
      mesh.visible = false;
      root.add(mesh);
      signMeshes.push(mesh);
      return mesh;
    };

    // Simple layout helpers using the `models` builders for consistent style
    const put = (b: any, x: number, y: number, z: number, ry = 0, col?: [number, number]) => {
      // Accept either a Mo.Built (has `.group`) or a raw Object3D/Mesh
      let group: THREE.Group;
      if (b && b.group && (b.group as THREE.Group).isGroup) {
        group = b.group as THREE.Group;
      } else if (b && (b as THREE.Object3D).isObject3D) {
        group = new THREE.Group();
        group.add(b as THREE.Object3D);
      } else {
        // fallback: create empty group
        group = new THREE.Group();
      }
      group.position.set(x, y, z);
      group.rotation.y = ry;
      root.add(group);
      if (col) colliders.push({ x, z, w: col[0], d: col[1] });
      return b;
    };

    // Bounds and room zones (rectangular approximations)
    const rooms = [
      { id: 'entrance', minX: -26, maxX: -18, minZ: -3, maxZ: 3 },
      { id: 'library', minX: -8, maxX: 0, minZ: -18, maxZ: -6 },
      { id: 'infirmary', minX: 2, maxX: 8, minZ: -18, maxZ: -6 },
      { id: 'secretary', minX: -16, maxX: -10, minZ: -18, maxZ: -6 },
      { id: 'computer', minX: -24, maxX: -18, minZ: -18, maxZ: -6 },
      { id: 'art', minX: 10, maxX: 16, minZ: -18, maxZ: -6 },
      { id: '2-b', minX: 17, maxX: 26, minZ: -18, maxZ: -6 },
      { id: 'courtyard', minX: -8, maxX: 6, minZ: 0, maxZ: 6 },
    ];
    
    // Shared wall materials — created once, reused across ALL tiledWall calls
    // This alone cuts ~60 MeshStandardMaterial allocations down to 3.
    const wallTileCanvas = document.createElement('canvas');
    wallTileCanvas.width = wallTileCanvas.height = 512;
    const wallCtx = wallTileCanvas.getContext('2d')!;
    wallCtx.fillStyle = '#b9c5c8'; wallCtx.fillRect(0, 0, 512, 512);
    // Glazed ceramic tiles with cool grout, enamel highlights and subtle edge shading.
    for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
      wallCtx.fillStyle = (x / 64 + y / 64) % 2 ? '#e8ece8' : '#f4f2e9';
      wallCtx.fillRect(x + 2, y + 2, 60, 60);
      wallCtx.fillStyle = 'rgba(68,91,101,.19)'; wallCtx.fillRect(x, y, 64, 2); wallCtx.fillRect(x, y, 2, 64);
      wallCtx.fillStyle = 'rgba(255,255,255,.72)'; wallCtx.fillRect(x + 4, y + 4, 55, 3); wallCtx.fillRect(x + 4, y + 4, 3, 53);
      wallCtx.fillStyle = 'rgba(83,105,111,.08)'; wallCtx.fillRect(x + 5, y + 57, 54, 3); wallCtx.fillRect(x + 58, y + 5, 3, 52);
      wallCtx.fillStyle = 'rgba(255,255,255,.13)'; wallCtx.fillRect(x + 10, y + 12, 2, 18);
    }
    const wallTexture = new THREE.CanvasTexture(wallTileCanvas);
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);
    wallTexture.anisotropy = 8;
    const _sharedTileMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0xffffff, roughness: 0.32, metalness: 0.01, transparent: false, depthWrite: true, side: THREE.DoubleSide });
    const _sharedBaseboardMat = new THREE.MeshStandardMaterial({ color: 0x2a1a11, roughness: 0.6, metalness: 0.03, transparent: false, depthWrite: true });

    const tiledWall = (w: number, h: number, x: number, z: number, ry = 0) => {
      const group = new THREE.Group();
      // Single face mesh — shared material, no individual grout strips (those were ~300 extra draw calls)
      const wallMaterial = _sharedTileMat.clone();
      wallMaterial.map = wallTexture.clone();
      // The source texture contains an 8x8 tile sheet; repeat by sheet size so each tile stays ~42 cm.
      wallMaterial.map.repeat.set(w / (0.42 * 8), h / (0.42 * 8));
      wallMaterial.map.needsUpdate = true;
      wallMaterial.depthWrite = true;
      const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), wallMaterial);
      face.position.y = h / 2;
      face.castShadow = true;
      face.receiveShadow = true;
      group.add(face);
      occlusionWalls.push({ mesh: face, material: wallMaterial });
      occlusionTargets.push(face);

      // Baseboard — shared material
      const baseboardMaterial = _sharedBaseboardMat.clone();
      const baseboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.12, 0.2), baseboardMaterial);
      baseboard.position.y = 0.06;
      group.add(baseboard);

      group.position.set(x, 0, z);
      group.rotation.y = ry;
      root.add(group);
      colliders.push(ry === 0
        ? { x, z, w, d: 0.16 }
        : { x, z, w: 0.16, d: w });
    };

    const box = (g: THREE.Group, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    const schoolDesk = () => {
      const g = new THREE.Group();
      box(g, 1.18, 0.09, 0.68, Mo.MAT.oak, 0, 0.74, 0);
      [[-0.48, -0.25], [-0.48, 0.25], [0.48, -0.25], [0.48, 0.25]].forEach(([x, z]) => box(g, 0.06, 0.72, 0.06, Mo.MAT.iron, x, 0.36, z));
      box(g, 0.52, 0.07, 0.48, Mo.MAT.darkWood, 0, 0.4, 0.68);
      box(g, 0.52, 0.42, 0.06, Mo.MAT.darkWood, 0, 0.64, 0.9);
      [[-0.2, 0.52], [0.2, 0.52], [-0.2, 0.84], [0.2, 0.84]].forEach(([x, z]) => box(g, 0.045, 0.48, 0.045, Mo.MAT.iron, x, 0.24, z));
      return { group: g };
    };
    const readingTable = () => {
      const g = new THREE.Group();
      box(g, 1.55, 0.08, 0.92, Mo.MAT.oak, 0, 0.74, 0);
      [[-0.62, -0.32], [-0.62, 0.32], [0.62, -0.32], [0.62, 0.32]].forEach(([x, z]) => box(g, 0.08, 0.72, 0.08, Mo.MAT.darkWood, x, 0.36, z));
      box(g, 0.42, 0.035, 0.28, Mo.MAT.paper, -0.25, 0.8, 0.02);
      box(g, 0.36, 0.05, 0.25, Mo.std(0x653f33, 0.7), 0.3, 0.81, -0.1);
      return { group: g };
    };
    const lockers = (count: number) => {
      const g = new THREE.Group();
      const metal = Mo.std(0x60758a, 0.45, 0.55);
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * 0.72;
        box(g, 0.66, 1.85, 0.42, metal, x, 0.93, 0);
        box(g, 0.04, 0.55, 0.025, Mo.MAT.brass, x + 0.2, 1.08, 0.225);
        for (let s = 0; s < 3; s++) box(g, 0.2, 0.018, 0.025, Mo.MAT.iron, x, 1.46 + s * 0.1, 0.225);
      }
      return { group: g };
    };
    const bench = () => {
      const g = new THREE.Group();
      box(g, 2.1, 0.09, 0.52, Mo.MAT.oak, 0, 0.5, 0);
      box(g, 2.1, 0.48, 0.07, Mo.MAT.oak, 0, 0.92, -0.2);
      [-0.82, 0.82].forEach((x) => box(g, 0.07, 0.5, 0.07, Mo.MAT.iron, x, 0.25, 0));
      return { group: g };
    };
    const bin = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.42, 8), Mo.MAT.steel);
      body.position.y = 0.21;
      g.add(body);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.035, 8), Mo.MAT.iron);
      lid.position.y = 0.43;
      g.add(lid);
      return { group: g };
    };
    const ceilingLight = (x: number, z: number) => {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.38), _ceilLightMat);
      fixture.position.set(x, 3.85, z);
      root.add(fixture);
    };
    // Shared pendant materials — created once, reused for both pendantLamps
    const _pendantShadeMat = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide });
    const _pendantBulbMat  = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffa040, emissiveIntensity: 2.5, roughness: 0.2 });

    const pendantLamp = (x: number, z: number) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 5), Mo.MAT.iron);
      cable.position.set(x, 3.38, z);
      root.add(cable);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.22, 10, 1, true), _pendantShadeMat);
      shade.position.set(x, 2.68, z);
      shade.rotation.x = Math.PI;
      root.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 6), _pendantBulbMat);
      bulb.position.set(x, 2.58, z);
      root.add(bulb);
    };
    const poster = (x: number, z: number, text: string) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.72), new THREE.MeshBasicMaterial({ map: T.doorPlate(text), side: THREE.DoubleSide, toneMapped: false }));
      mesh.position.set(x, 2.05, z);
      root.add(mesh);
    };
    const rainyWindow = (x: number, z: number, ry = 0, w = 1.7) => {
      const g = new THREE.Group();
      const frame = Mo.MAT.beam;
      const pane = new THREE.MeshStandardMaterial({ color: 0x9eafbd, emissive: 0x657785, emissiveIntensity: 0.45, transparent: true, opacity: 0.7, roughness: 0.18 });
      box(g, w, 1.6, 0.1, pane, 0, 2.25, 0);
      box(g, w + 0.12, 0.09, 0.14, frame, 0, 1.43, 0);
      box(g, w + 0.12, 0.09, 0.14, frame, 0, 3.07, 0);
      [-w / 2, 0, w / 2].forEach((ox) => box(g, 0.08, 1.7, 0.14, frame, ox, 2.25, 0));
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      root.add(g);
    };
    const cabinet = (w = 1.5, h = 1.25) => {
      const g = new THREE.Group();
      box(g, w, h, 0.44, Mo.MAT.oak, 0, h / 2, 0);
      [-w * 0.24, w * 0.24].forEach((x) => {
        box(g, 0.025, h - 0.12, 0.02, Mo.MAT.beam, x, h / 2, 0.23);
        box(g, 0.05, 0.05, 0.04, Mo.MAT.brass, x + (x < 0 ? 0.12 : -0.12), h * 0.48, 0.25);
      });
      return { group: g };
    };
    const noticeBoard = (w = 1.5) => {
      const g = new THREE.Group();
      box(g, w + 0.12, 1.25, 0.08, Mo.MAT.oak, 0, 0.63, 0);
      box(g, w, 1.1, 0.025, Mo.std(0xb69062, 0.95), 0, 0.63, 0.06);
      [-0.3, 0, 0.3].forEach((x, i) => box(g, 0.22, 0.3, 0.012, Mo.std([0xe8d9b5, 0xc87f72, 0x9bb6cc][i], 0.9), x, 0.72 + (i % 2) * 0.12, 0.082));
      return { group: g };
    };

    // ── NEW HELPERS ──────────────────────────────────────────────────────────────

    // Shared ceiling-light / sconce materials — created once
    const _ceilFixMat     = new THREE.MeshStandardMaterial({ color: 0xfffbe8, emissive: 0xffe8a0, emissiveIntensity: 1.6 });
    const _ceilLightMat   = new THREE.MeshStandardMaterial({ color: 0xfff9de, emissive: 0xffe6ac, emissiveIntensity: 1.4 });
    const _infixMat       = new THREE.MeshStandardMaterial({ color: 0xf0f8ff, emissive: 0xe0f0ff, emissiveIntensity: 1.8 });
    const _sconceIronMat  = Mo.MAT.iron;
    const _sconceShadeMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e, side: THREE.DoubleSide, roughness: 0.7 });
    const _sconceBulbMat  = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffa040, emissiveIntensity: 2.2, roughness: 0.2 });

    // Ceiling panel (flat suspended ceiling over a room/corridor)
    const CEIL_Y = 4.0;
    const ceilingPanel = (cx: number, cz: number, w: number, d: number) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.14, d),
        new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.9 }),
      );
      m.position.set(cx, CEIL_Y, cz);
      m.receiveShadow = true;
      root.add(m);
    };

    // Room ceiling light — warm amber fluorescent strip
    const roomCeilingLight = (x: number, z: number, _col = 0xffeabb, _intensity = 1.1) => {
      const fix = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.36), _ceilFixMat);
      fix.position.set(x, CEIL_Y - 0.1, z);
      root.add(fix);
      // Repeated per-room point lights made every standard-material shader
      // evaluate dozens of lights. The luminous fixture keeps the warm look
      // while the school uses a small shared set of real lights.
    };

    // Infirmary: cooler white light
    const infirmaryLight = (x: number, z: number) => {
      const fix = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.28), _infixMat);
      fix.position.set(x, CEIL_Y - 0.08, z);
      root.add(fix);
    };

    // Wall sconce — bracket flush to wall, no floating
    const wallSconce = (wx: number, wz: number, onXWall: boolean) => {
      const ox = onXWall ? 0.12 : 0;
      const oz = onXWall ? 0 : 0.12;
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.14), _sconceIronMat);
      br.position.set(wx + ox, 2.45, wz + oz);
      root.add(br);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 0.18, 8, 1, true), _sconceShadeMat);
      sh.position.set(wx + ox * 2, 2.25, wz + oz * 2);
      sh.rotation.x = Math.PI;
      root.add(sh);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 5), _sconceBulbMat);
      bulb.position.set(wx + ox * 2, 2.25, wz + oz * 2);
      root.add(bulb);
    };

    // Drinking fountain (bebedouro)
    const waterFountain = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.38), Mo.MAT.steel);
      body.position.y = 0.425; g.add(body);
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.3), Mo.std(0xb0c4cc, 0.3, 0.5));
      basin.position.set(0, 0.88, 0.04); g.add(basin);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), Mo.MAT.steel);
      spout.position.set(0, 0.97, 0.06); spout.rotation.x = -0.5; g.add(spout);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.44), Mo.MAT.iron);
      base.position.y = 0.03; g.add(base);
      g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
      colliders.push({ x, z, w: 0.65, d: 0.5 });
    };

    // Corridor plant on stand — shared pot/soil materials, reduced segments
    const _potMat  = Mo.MAT.terracotta;
    const _soilMat = Mo.MAT.soil;
    const corridorPlant = (x: number, z: number) => {
      const g = new THREE.Group();
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 8), Mo.MAT.darkWood);
      stand.position.y = 0.36; g.add(stand);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.24, 8), _potMat);
      pot.position.y = 0.84; g.add(pot);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 8), _soilMat);
      soil.position.y = 0.98; g.add(soil);
      // 5 leaves instead of 7, simpler PlaneGeometry
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.07), Mo.MAT.leaf);
        leaf.position.set(Math.cos(i * 1.26) * 0.15, 1.08 + i * 0.04, Math.sin(i * 1.26) * 0.15);
        leaf.rotation.set(0.2, i * 1.26, 0.2);
        g.add(leaf);
      }
      g.position.set(x, 0, z); root.add(g);
      colliders.push({ x, z, w: 0.45, d: 0.45 });
    };

    // Door name plate small sign flush above door
    const doorPlate = (text: string, x: number, z: number, ry = 0) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.18),
        new THREE.MeshBasicMaterial({ map: T.doorPlate(text), toneMapped: false, side: THREE.DoubleSide }),
      );
      m.position.set(x, 2.42, z);
      m.rotation.y = ry;
      root.add(m);
    };

    // Infirmary bed with mattress, pillow, thin blanket fold
    const infirmaryBed = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      const bx = (bw: number, bh: number, bd: number, mat: THREE.Material, bx: number, by: number, bz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); m.position.set(bx, by, bz); m.castShadow = true; g.add(m);
      };
      bx(1.0, 0.12, 2.1, Mo.MAT.steel, 0, 0.30, 0);
      bx(1.05, 0.62, 0.06, Mo.MAT.steel, 0, 0.62, -1.02);
      bx(1.05, 0.36, 0.06, Mo.MAT.steel, 0, 0.48, 1.02);
      [[-0.46,-0.98],[-0.46,0.98],[0.46,-0.98],[0.46,0.98]].forEach(([lx,lz]) => bx(0.06,0.30,0.06,Mo.MAT.steel,lx,0.15,lz));
      bx(0.95, 0.14, 1.98, Mo.std(0xecebe4,0.95), 0, 0.43, 0);
      bx(0.82, 0.10, 0.44, Mo.std(0xf0ede6,0.92), 0, 0.52, -0.72);
      bx(0.92, 0.05, 0.72, Mo.std(0xb2c4d0,0.9), 0, 0.50, 0.55);
      g.position.set(x,0,z); g.rotation.y=ry; root.add(g);
      colliders.push({ x, z, w: 1.2, d: 2.3 });
    };

    // Curtain rail with fabric panels
    const curtainRail = (x: number, z: number, len: number, ry = 0) => {
      const g = new THREE.Group();
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,len,8), Mo.MAT.steel);
      rod.rotation.z = Math.PI / 2; rod.position.set(0, 2.15, 0); g.add(rod);
      const cm = new THREE.MeshStandardMaterial({ color:0xe8e4dc, roughness:0.95, side:THREE.DoubleSide, transparent:true, opacity:0.88 });
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(len/3-0.04, 2.1), cm);
        panel.position.set(-len/2+(i+0.5)*(len/3), 1.05, 0); g.add(panel);
      }
      g.position.set(x,0,z); g.rotation.y=ry; root.add(g);
    };

    // Wall canvas (framed painting)
    const wallCanvas = (x: number, y: number, z: number, ry: number, cw: number, ch: number, color: number) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(cw+0.08,ch+0.08,0.06), Mo.MAT.darkWood);
      frame.position.set(x,y,z); frame.rotation.y=ry; root.add(frame);
      const cv = new THREE.Mesh(new THREE.PlaneGeometry(cw,ch), new THREE.MeshStandardMaterial({ color, roughness:0.85 }));
      cv.position.set(x+Math.sin(ry)*0.04, y, z+Math.cos(ry)*0.04); cv.rotation.y=ry; root.add(cv);
    };

    // Sculpture on plinth
    const sculpture = (x: number, z: number) => {
      const g = new THREE.Group();
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.55,0.3), Mo.MAT.stone); pl.position.y=0.275; g.add(pl);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,0.32,12), Mo.std(0xddd8cc,0.6)); base.position.y=0.71; g.add(base);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1,12,8), Mo.std(0xddd8cc,0.6)); head.position.y=1.0; g.add(head);
      g.position.set(x,0,z); root.add(g);
      colliders.push({ x, z, w: 0.45, d: 0.45 });
    };

    // Art supply table
    const artTable = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      const bx = (bw: number, bh: number, bd: number, mat: THREE.Material, bx: number, by: number, bz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat); m.position.set(bx,by,bz); m.castShadow=true; g.add(m);
      };
      bx(1.4,0.07,0.72,Mo.MAT.oak,0,0.76,0);
      [[-0.6,-0.3],[0.6,-0.3],[-0.6,0.3],[0.6,0.3]].forEach(([lx,lz]) => bx(0.06,0.76,0.06,Mo.MAT.darkWood,lx,0.38,lz));
      [0xc83232,0x2855b8,0xf0c030,0x2a8a3a,0xe87820].forEach((c,i)=>{
        const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.024,0.18,8),Mo.std(c,0.7));
        tube.position.set(-0.3+i*0.14,0.86,-0.12); tube.rotation.z=0.35; g.add(tube);
      });
      const jar=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.055,0.18,12),Mo.MAT.ceramicBlue); jar.position.set(0.45,0.86,0.08); g.add(jar);
      for(let i=0;i<5;i++){
        const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.3,6),Mo.MAT.darkWood);
        stick.position.set(0.42+Math.cos(i*1.26)*0.025,1.02,0.08+Math.sin(i*1.26)*0.025); g.add(stick);
      }
      g.position.set(x,0,z); g.rotation.y=ry; root.add(g);
      colliders.push({ x, z, w:1.5, d:0.85 });
    };

    // Easel with canvas
    const easel = (x: number, z: number, ry = 0) => {
      const colors=[0xc8b89a,0x7a8c6a,0x4a6a8c,0x9c5a4a];
      const cc=colors[Math.floor(Mo.rnd()*colors.length)];
      const g = new THREE.Group();
      for(let i=0;i<3;i++){
        const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,1.6,6),Mo.MAT.darkWood);
        leg.position.set(Math.cos((i/3)*Math.PI*2)*0.2,0.8,Math.sin((i/3)*Math.PI*2)*0.2);
        leg.rotation.x=i===2?0.3:-0.15; g.add(leg);
      }
      const frame=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.04),Mo.MAT.darkWood); frame.position.set(0,1.25,0); g.add(frame);
      const cv=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.82),Mo.std(cc,0.88)); cv.position.set(0,1.25,0.03); g.add(cv);
      g.position.set(x,0,z); g.rotation.y=ry; root.add(g);
      colliders.push({ x, z, w:0.55, d:0.55 });
    };

    // Computer desk with monitor, keyboard, mouse
    const computerDesk = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      const bx = (bw: number, bh: number, bd: number, mat: THREE.Material, bx: number, by: number, bz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat); m.position.set(bx,by,bz); m.castShadow=true; g.add(m);
      };
      bx(1.35,0.06,0.72,Mo.MAT.oak,0,0.74,0);
      [[-0.6,-0.3],[0.6,-0.3],[-0.6,0.3],[0.6,0.3]].forEach(([lx,lz]) => bx(0.06,0.72,0.06,Mo.MAT.iron,lx,0.36,lz));
      bx(0.62,0.38,0.04,Mo.std(0x1e1e22,0.4),-0.1,1.0,-0.22);
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.32),new THREE.MeshStandardMaterial({color:0x0d1a2d,emissive:0x1a3a5c,emissiveIntensity:0.7}));
      screen.position.set(-0.1,1.0,-0.19); g.add(screen);
      bx(0.18,0.04,0.22,Mo.std(0x1e1e22,0.5),-0.1,0.80,-0.15);
      bx(0.48,0.018,0.16,Mo.std(0xd0cec8,0.6),-0.1,0.77,0.05);
      const mouse=new THREE.Mesh(new THREE.SphereGeometry(0.04,10,6),Mo.std(0xd0cec8,0.5));
      mouse.scale.set(1.1,0.55,1.4); mouse.position.set(0.28,0.765,0.04); g.add(mouse);
      g.position.set(x,0,z); g.rotation.y=ry; root.add(g);
      colliders.push({ x, z, w:1.45, d:0.85 });
    };

    // Student chair (simple)
    const studentChair = () => {
      const g = new THREE.Group();
      const bx = (bw: number, bh: number, bd: number, mat: THREE.Material, bx: number, by: number, bz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat); m.position.set(bx,by,bz); g.add(m);
      };
      bx(0.48,0.06,0.46,Mo.MAT.oak,0,0.46,0);
      bx(0.48,0.52,0.06,Mo.MAT.oak,0,0.73,0.22);
      [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]].forEach(([lx,lz]) => bx(0.04,0.46,0.04,Mo.MAT.iron,lx,0.23,lz));
      return { group: g };
    };

    // ── END NEW HELPERS ──────────────────────────────────────────────────────────

    // Helper to add a front partition with a door for a room.
    const addFrontPartition = (centerX: number, roomW: number, z: number, roomId: string, doorW = 1.0, wallH = 3.2) => {
      const leftW = (roomW - doorW) / 2;
      const rightW = leftW;
      const leftX = centerX - (doorW / 2 + leftW / 2);
      const rightX = centerX + (doorW / 2 + rightW / 2);
      if (leftW > 0.1) tiledWall(leftW, wallH, leftX, z);
      if (rightW > 0.1) tiledWall(rightW, wallH, rightX, z);
      // lintel above the opening
      put(Mo.lintel(doorW + 0.16), centerX, 2.1, z);
      // Fill solid wall above the door opening (no gap!)
      const fillH = wallH - 2.1;
      if (fillH > 0.05) {
        const fillMat = _sharedTileMat;
        const fillMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.04, fillH, 0.16), fillMat);
        fillMesh.position.set(centerX, 2.1 + fillH / 2, z);
        fillMesh.castShadow = false; fillMesh.receiveShadow = false;
        root.add(fillMesh);
      }
      // The leaf rotates around its left hinge; the frame remains in the wall.
      const pivot = new THREE.Group();
      pivot.position.set(centerX - doorW / 2, 0, z);
      const leaf = Mo.doorClosed(doorW, 2.1, roomId).group;
      leaf.position.x = doorW / 2;
      pivot.add(leaf);
      root.add(pivot);
      const collider = { x: centerX, z, w: doorW, d: 0.22, enabled: true };
      const door: SchoolDoor = { id: `door_${roomId}`, x: centerX, z, isOpen: false };
      colliders.push(collider);
      doors.push(door);
      doorParts.push({ door, pivot, collider });
    };

    // Corridor floor and a few structural elements
    put(Mo.woodFloor(56, 25), 0, 0, -5.5);
    put(Mo.box(56, 0.1, 25, Mo.std(0x666666)), 0, -0.05, -5.5);

    // ── CEILING PANELS ────────────────────────────────────────────────────────
    ceilingPanel(0,      0,    56,  12);   // corridor + entrance strip
    ceilingPanel(-4,   -12,   8.2, 12);   // library
    ceilingPanel( 5,   -12,   6.2, 12);   // infirmary
    ceilingPanel(-13,  -12,   6.2, 12);   // secretary
    ceilingPanel(-21,  -12,   6.2, 12);   // computer lab
    ceilingPanel( 13,  -12,   6.2, 12);   // art
    ceilingPanel(21.5, -12,   9.2, 12);   // classroom 2-b
    ceilingPanel(-22,   1.5,  8.0,  9);   // entrance hall

    // Generate interior partitions + doors for all named rooms (skip entrance/courtyard)
    for (const r of rooms) {
      if (r.id === 'entrance' || r.id === 'courtyard') continue;
      const roomW = r.maxX - r.minX;
      const cx = (r.minX + r.maxX) / 2;
      const frontZ = r.maxZ; // front face adjacent to corridor
      addFrontPartition(cx, roomW, frontZ, r.id, 1.6, 3.2);
    }

    // Tiled, solid perimeter walls.
    tiledWall(56, 4.2, 0, -18.2);
    tiledWall(56, 4.2, 0, 6.2);
    tiledWall(24.4, 4.2, -27, -6, Math.PI / 2);
    // Connect an eastern school annex through a wide doorway.
    tiledWall(8.5, 4.2, 27, -12.75, Math.PI / 2);
    tiledWall(12.5, 4.2, 27, 2.75, Math.PI / 2);
    tiledWall(24.4, 4.2, 43, -6, Math.PI / 2);
    tiledWall(16, 4.2, 35, -18.2);
    tiledWall(16, 4.2, 35, 6.2);

    // Entrance - Enhanced with more details
    // A double glass portal set into the west facade marks this as the school entrance.
    const entrance = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: 0xb8d9e8, metalness: 0.15, roughness: 0.18, transparent: true, opacity: 0.72 });
    [-0.64, 0.64].forEach((z) => {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.35, 1.15), glass);
      leaf.position.set(0, 1.18, z);
      entrance.add(leaf);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.05), Mo.MAT.brass);
      handle.position.set(-0.08, 1.12, z + (z < 0 ? 0.3 : -0.3));
      entrance.add(handle);
    });
    [[0, 2.42, 0, 0.18, 0.14, 2.65], [0, 0.06, 0, 0.18, 0.12, 2.65], [0, 1.2, -1.3, 0.18, 2.4, 0.12], [0, 1.2, 1.3, 0.18, 2.4, 0.12]].forEach(([x, y, z, w, h, d]) => {
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Mo.MAT.beam);
      part.position.set(x, y, z);
      entrance.add(part);
    });
    entrance.position.set(-26.88, 0, -1.35);
    root.add(entrance);
    sign('京都市立東山高等学校', -25.3, 2.6, 0, 1.8, 0.5, Math.PI / 2, 'entrance');
    sign('HIGASHIYAMA HIGH', -25.3, 2.0, 0, 1.8, 0.3, Math.PI / 2, 'entrance');

    // Entrance area furniture and details
    // Shoe rack near entrance
    put(Mo.rack(2.5), -22.5, 0, -1.5, 0, [2.5, 1.2]);
    // Welcome mat
    put(Mo.doormat(), -24, 0, 0.5, 0, [1.2, 0.7]);
    // Information board
    put(noticeBoard(1.5), -23, 1.15, -1.5, Math.PI, [1.5, 0.12]);
    // Umbrella stand with umbrellas
    put(Mo.umbrellaStand(), -24.5, 0, 1.2, 0, [0.5, 0.5]);
    // Potted plant
    put(Mo.plant('bamboo_large'), -22, 0, 1.8, 0, [0.6, 0.6]);
    
    // Spots for entrance
    spots.push({
      id: 'entrance_shoe_rack',
      name: 'Aparelho de sapatos',
      type: 'EXAMINAR',
      x: -22.5,
      z: -1.5,
      dialogueNodeId: 'entrance_shoe_rack'
    });
    spots.push({
      id: 'entrance_info_board',
      name: 'Cartaz informativo',
      type: 'EXAMINAR',
      x: -23,
      z: -1.5,
      dialogueNodeId: 'entrance_info_board'
    });
    spots.push({
      id: 'entrance_umbrella',
      name: 'Porte- guarda-chuvas',
      type: 'EXAMINAR',
      x: -24.5,
      z: 1.2,
      dialogueNodeId: 'entrance_umbrella'
    });

    // Secretary room furniture — reorganized, no overlaps, rug, awards
    put(Mo.desk(), -13.5, 0, -16.0, Math.PI, [2.2, 1]);
    put(Mo.chair('leather'), -13.5, 0, -14.8, Math.PI, [0.6, 0.6]);
    put(Mo.telephone(), -12.8, 0, -16.0, 0, [0.4, 0.4]);
    put(Mo.fileCabinet(2.2), -15.5, 0, -16.8, 0, [1.2, 0.55]);
    put(Mo.fileCabinet(2.2), -11.0, 0, -16.8, 0, [1.2, 0.55]);
    put(Mo.bookshelf(1.6, 2.1, 4), -14.8, 0, -17.85, 0, [1.7, 0.55]);
    put(Mo.bookshelf(1.6, 2.1, 4), -12.2, 0, -17.85, 0, [1.7, 0.55]);
    put(cabinet(1.5), -15.8, 0, -8.5, Math.PI / 2, [1.5, 0.55]);
    put(Mo.plant('bonsai'), -15.8, 0, -7.5, 0, [0.5, 0.5]);
    put(noticeBoard(1.3), -13.5, 1.1, -17.85, 0, [1.4, 0.12]);
    // Rug
    { const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 8.0), new THREE.MeshStandardMaterial({ color: 0x7a4f3a, roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-13, 0.015, -12.5); root.add(rug); }
    // Awards shelf + trophies
    { const sh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), Mo.MAT.walnut); sh.position.set(-11.5, 1.65, -17.85); root.add(sh); [0,1,2].forEach(i=>{ const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.22,10),Mo.MAT.gold); stem.position.set(-12.2+i*0.4,1.87,-17.85); root.add(stem); const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.04,0.1,10),Mo.MAT.gold); cup.position.set(-12.2+i*0.4,1.99,-17.85); root.add(cup); }); }
    // Framed certificates
    [-15.2,-13.5,-11.8].forEach((px,i) => { const fw=[0.5,0.7,0.55][i]; const fh=[0.7,0.5,0.65][i]; const fm=new THREE.Mesh(new THREE.BoxGeometry(fw+0.06,fh+0.06,0.04),Mo.MAT.darkWood); fm.position.set(px,2.0+i*0.05,-17.85); root.add(fm); const pp=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),Mo.MAT.paper); pp.position.set(px,2.0+i*0.05,-17.83); root.add(pp); });
    // Windows flush to walls
    rainyWindow(-13,   -17.9, 0,           2.2);
    rainyWindow(-10.3, -12.0, Math.PI / 2, 1.4);
    rainyWindow(-15.7, -12.0, Math.PI / 2, 1.4);
    // Secretary room lighting
    roomCeilingLight(-13, -10.0, 0xffdc90, 1.0);
    roomCeilingLight(-13, -15.5, 0xffdc90, 1.0);

    // Computer room furniture — 3 rows × 2 stations, chairs behind desks
    // Row 1 (back)
    computerDesk(-22.2, -16.0, 0); computerDesk(-20.0, -16.0, 0);
    put(studentChair(), -22.2, 0, -14.8, Math.PI, [0.55, 0.55]);
    put(studentChair(), -20.0, 0, -14.8, Math.PI, [0.55, 0.55]);
    // Row 2 (middle)
    computerDesk(-22.2, -13.0, 0); computerDesk(-20.0, -13.0, 0);
    put(studentChair(), -22.2, 0, -11.8, Math.PI, [0.55, 0.55]);
    put(studentChair(), -20.0, 0, -11.8, Math.PI, [0.55, 0.55]);
    // Row 3 (front)
    computerDesk(-22.2, -10.0, 0); computerDesk(-20.0, -10.0, 0);
    put(studentChair(), -22.2, 0, -8.8, Math.PI, [0.55, 0.55]);
    put(studentChair(), -20.0, 0, -8.8, Math.PI, [0.55, 0.55]);
    // Teacher station
    put(Mo.desk(), -19.5, 0, -7.5, 0, [2.2, 1.0]);
    put(Mo.chair('leather'), -19.5, 0, -8.6, Math.PI, [0.6, 0.6]);
    put(Mo.printer(), -24.5, 0, -10.5, Math.PI / 2, [0.8, 0.5]);
    put(cabinet(1.2), -24.5, 0, -13.5, Math.PI / 2, [1.2, 0.5]);
    put(Mo.plant('bonsai'), -18.8, 0, -8.4, 0, [0.45, 0.45]);
    put(Mo.whiteboard(), -21, 1.2, -18.0, 0, [1.8, 0.08]);
    put(noticeBoard(1.0), -23, 1.15, -18.0, 0, [1.0, 0.12]);
    // Windows flush to walls
    rainyWindow(-21,   -17.9, 0,           2.2);
    rainyWindow(-24.3, -12.0, Math.PI / 2, 1.4);
    rainyWindow(-18.3, -12.0, Math.PI / 2, 1.4);
    // Screen glow ambient
    { const sg = new THREE.PointLight(0x2244aa, 0.3, 8, 2); sg.position.set(-21, 1.5, -12); root.add(sg); }
    // Computer room lighting
    roomCeilingLight(-21, -10.0, 0xffe0aa, 1.0);
    roomCeilingLight(-21, -15.0, 0xffe0aa, 1.0);

    // Art room furniture — easels, tables, canvases, sculptures
    // Paintings on walls
    wallCanvas(-9.9, 2.2, -10.5, Math.PI / 2, 0.9, 0.7, 0x8b4513);
    wallCanvas(-9.9, 2.2, -13.0, Math.PI / 2, 0.7, 0.9, 0x2e5f8a);
    wallCanvas(-9.9, 2.2, -15.5, Math.PI / 2, 1.0, 0.6, 0x3a6b3a);
    wallCanvas(13,   2.3, -17.88, 0, 1.2, 0.8, 0xb06030);
    wallCanvas(11.5, 2.3, -17.88, 0, 0.7, 0.9, 0x4a3a8c);
    wallCanvas(14.5, 2.3, -17.88, 0, 0.8, 0.7, 0x8c4a3a);
    // Sculptures
    sculpture(11.2, -8.5);
    sculpture(14.8, -8.5);
    // Art supply tables (well spaced)
    artTable(12.5, -11.5, 0);
    artTable(12.5, -14.5, 0);
    put(studentChair(), 11.6, 0, -11.5, Math.PI / 2,  [0.55, 0.55]);
    put(studentChair(), 13.4, 0, -11.5, -Math.PI / 2, [0.55, 0.55]);
    put(studentChair(), 11.6, 0, -14.5, Math.PI / 2,  [0.55, 0.55]);
    put(studentChair(), 13.4, 0, -14.5, -Math.PI / 2, [0.55, 0.55]);
    // Easels (not touching walls)
    easel(15.2, -11.0, -Math.PI / 4);
    easel(15.2, -13.5,  Math.PI / 8);
    easel(15.2, -16.0,  0);
    put(cabinet(1.6), 15.8, 0, -17.5, 0, [1.7, 0.55]);
    put(Mo.sinkUnit(), 10.3, 0, -17.5, 0, [1.0, 0.8]);
    put(noticeBoard(1.3), 11.5, 1.15, -17.88, 0, [1.4, 0.12]);
    // Small rug
    { const ar = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 7.0), new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.95 })); ar.rotation.x = -Math.PI / 2; ar.position.set(13, 0.015, -13); root.add(ar); }
    // Windows
    rainyWindow(13,   -17.9, 0,           1.7);
    rainyWindow(15.85,-11.0, Math.PI / 2, 1.4);
    rainyWindow(15.85,-14.5, Math.PI / 2, 1.4);
    rainyWindow(10.15,-11.0, Math.PI / 2, 1.4);
    // Art room lighting
    { const ap = new THREE.PointLight(0xffd070, 1.0, 6, 2.2); ap.position.set(15.2, 3.2, -12.5); root.add(ap); }
    roomCeilingLight(13, -10.0, 0xffe090, 0.9);
    roomCeilingLight(13, -15.0, 0xffe090, 0.9);

    // Infirmary furniture — 2 beds with curtains, desk, sofa, cabinets
    infirmaryBed(3.2, -15.5, 0);
    curtainRail(3.2, -14.55, 1.1, 0);
    infirmaryBed(6.5, -15.5, 0);
    curtainRail(6.5, -14.55, 1.1, 0);
    put(Mo.medicalCabinet(), 7.4, 0, -17.2, 0,           [0.8, 0.55]);
    put(Mo.medicalCabinet(), 2.6, 0, -17.2, 0,           [0.8, 0.55]);
    put(Mo.desk(),           4.8, 0, -9.5,  0,           [2.2, 1.0] );
    put(Mo.chair('leather'), 4.8, 0, -8.4,  Math.PI,     [0.6, 0.6] );
    put(Mo.armchair(),       2.5, 0, -8.2,  Math.PI / 2, [0.9, 0.9] );
    put(Mo.armchair(),       2.5, 0, -9.5,  Math.PI / 2, [0.9, 0.9] );
    put(Mo.sideTable(),      2.5, 0, -8.85, 0,           [0.5, 0.5] );
    put(cabinet(1.8),        7.65, 0, -10.8, 0,          [1.9, 0.55]);
    put(Mo.firstAidKit(),    7.65, 0, -12.8, 0,          [0.4, 0.4] );
    put(Mo.plant('cactus'),  2.5, 0, -7.2,  0,           [0.3, 0.3] );
    put(bin(), 7.8, 0, -7.2, 0, [0.4, 0.4]);
    put(noticeBoard(1.1), 5.0, 1.15, -17.85, 0, [1.2, 0.12]);
    put(Mo.examinationTable(), 5.0, 0, -7.8, 0, [1.2, 0.8]);
    // Windows flush to walls
    rainyWindow(4.8,  -17.9, 0,           1.7);
    rainyWindow(7.85, -12.0, Math.PI / 2, 1.4);
    rainyWindow(7.85, -15.5, Math.PI / 2, 1.4);
    // Infirmary cool-white lighting
    infirmaryLight(5.0, -10.5);
    infirmaryLight(5.0, -15.0);

    // Courtyard spots
    spots.push({
      id: 'courtyard_shrine',
      name: 'Santuário do Jardim',
      type: 'EXAMINAR',
      x: -5,
      z: 3.2,
      dialogueNodeId: 'courtyard_shrine'
    });
    spots.push({
      id: 'courtyard_tree',
      name: 'Árvore Antiga',
      type: 'EXAMINAR',
      x: -5,
      z: 4.5,
      dialogueNodeId: 'courtyard_tree'
    });
    spots.push({
      id: 'courtyard_stone',
      name: 'Pedra Sagrada',
      type: 'EXAMINAR',
      x: -4.2,
      z: 3.8,
      dialogueNodeId: 'courtyard_stone'
    });

    // Corridor spots - additional notice boards and details
    spots.push({
      id: 'corridor_notices_main',
      name: 'Painel de Avisos Principal',
      type: 'EXAMINAR',
      x: 0,
      z: 5.8,
      dialogueNodeId: 'corridor_notices_main'
    });
    spots.push({
      id: 'corridor_trophy_case',
      name: 'Casa de Troféus',
      type: 'EXAMINAR',
      x: -10,
      z: 5.5,
      dialogueNodeId: 'corridor_trophy_case'
    });
    spots.push({
      id: 'corridor_fire_extinguisher',
      name: 'Extintor de Incêndio',
      type: 'EXAMINAR',
      x: 6,
      z: 5.2,
      dialogueNodeId: 'corridor_fire_extinguisher'
    });
    spots.push({
      id: 'corridor_clock',
      name: 'Relógio do Corredor',
      type: 'EXAMINAR',
      x: 12,
      z: 5.3,
      dialogueNodeId: 'corridor_clock'
    });

    // Secretary room spots
    spots.push({
      id: 'secretary_desk',
      name: 'Escrivaninha da Secretária',
      type: 'EXAMINAR',
      x: -13.5,
      z: -15.2,
      dialogueNodeId: 'secretary_desk'
    });
    spots.push({
      id: 'secretary_filing_cabinet',
      name: 'Arquivo de Documentos',
      type: 'EXAMINAR',
      x: -13.8,
      z: -16.8,
      dialogueNodeId: 'secretary_filing_cabinet'
    });
    spots.push({
      id: 'secretary_phone',
      name: 'Telefone da Secretária',
      type: 'EXAMINAR',
      x: -12.8,
      z: -15.5,
      dialogueNodeId: 'secretary_phone'
    });

    // Computer room spots
    spots.push({
      id: 'computer_lab_main_pc',
      name: 'Computador Principal',
      type: 'EXAMINAR',
      x: -21,
      z: -15.2,
      dialogueNodeId: 'computer_lab_main_pc'
    });
    spots.push({
      id: 'computer_lab_printer',
      name: 'Impressora',
      type: 'EXAMINAR',
      x: -22.5,
      z: -14.5,
      dialogueNodeId: 'computer_lab_printer'
    });
    spots.push({
      id: 'computer_lab_server',
      name: 'Servidor do Laboratório',
      type: 'EXAMINAR',
      x: -23.5,
      z: -15.5,
      dialogueNodeId: 'computer_lab_server'
    });

    // Art room spots
    spots.push({
      id: 'art_room_paintings',
      name: 'Quadros em Exibição',
      type: 'EXAMINAR',
      x: 13.5,
      z: -14.8,
      dialogueNodeId: 'art_room_paintings'
    });
    spots.push({
      id: 'art_room_sculpture',
      name: 'Escultura',
      type: 'EXAMINAR',
      x: 14.5,
      z: -13.5,
      dialogueNodeId: 'art_room_sculpture'
    });
    spots.push({
      id: 'art_room_easel',
      name: 'Tela de Pintura',
      type: 'EXAMINAR',
      x: 12.5,
      z: -15.5,
      dialogueNodeId: 'art_room_easel'
    });
    spots.push({
      id: 'art_room_supplies',
      name: 'Kit de Tintas',
      type: 'EXAMINAR',
      x: 15.2,
      z: -14.5,
      dialogueNodeId: 'art_room_supplies'
    });

    // Classroom 2-B spots - additional
    spots.push({
      id: 'classroom_blackboard',
      name: 'Quadro Negro',
      type: 'EXAMINAR',
      x: 21,
      z: -8.5,
      dialogueNodeId: 'classroom_blackboard'
    });
    spots.push({
      id: 'classroom Teacher_desk',
      name: 'Mesa do Professor',
      type: 'EXAMINAR',
      x: 24,
      z: -8.8,
      dialogueNodeId: 'classroom_teacher_desk'
    });
    spots.push({
      id: 'classroom_class_board',
      name: 'Painel de Aulas',
      type: 'EXAMINAR',
      x: 23,
      z: -11,
      dialogueNodeId: 'classroom_class_board'
    });
    spots.push({
      id: 'classroom_storage_closet',
      name: 'Armário de Materiais',
      type: 'EXAMINAR',
      x: 26.5,
      z: -10,
      dialogueNodeId: 'classroom_storage_closet'
    });

    // Infirmary spots
    spots.push({
      id: 'infirmary_examination_table',
      name: 'Mesa de Exame',
      type: 'EXAMINAR',
      x: 4.5,
      z: -15.2,
      dialogueNodeId: 'infirmary_examination_table'
    });
    spots.push({
      id: 'infirmary_medical_cabinet',
      name: 'Cofre Médico',
      type: 'EXAMINAR',
      x: 6.2,
      z: -14.8,
      dialogueNodeId: 'infirmary_medical_cabinet'
    });
    spots.push({
      id: 'infirmary_rest_bed',
      name: 'Leito de Repouso',
      type: 'EXAMINAR',
      x: 3.2,
      z: -16.2,
      dialogueNodeId: 'infirmary_rest_bed'
    });
    spots.push({
      id: 'infirmary_first_aid_kit',
      name: 'Kits de Primeiros Socorros',
      type: 'EXAMINAR',
      x: 5.5,
      z: -16.5,
      dialogueNodeId: 'infirmary_first_aid_kit'
    });

    // Library - additional spots already added in previous edits

    // Library
    tiledWall(8.2, 4.2, -2, -18);
    tiledWall(12, 4.2, -8, -12, Math.PI / 2);
    tiledWall(12, 4.2, 0, -12, Math.PI / 2);
    sign('図書室 · BIBLIOTECA', -2, 3.1, -5.75, 2.2, 0.38, 0, 'library');

    // Infirmary
    tiledWall(6.2, 4.2, 5, -18);
    tiledWall(12, 4.2, 2, -12, Math.PI / 2);
    tiledWall(12, 4.2, 8, -12, Math.PI / 2);
    sign('保健室 · ENFERMARIA', 6, 3.1, -5.75, 2.2, 0.38, 0, 'infirmary');

    // Secretary
    tiledWall(6.2, 4.2, -13, -18);
    tiledWall(12, 4.2, -16, -12, Math.PI / 2);
    tiledWall(12, 4.2, -10, -12, Math.PI / 2);
    sign('事務室 · SECRETARIA', -13, 3.1, -5.75, 2.2, 0.38, 0, 'secretary');

    // Computer room
    tiledWall(6.2, 4.2, -21, -18);
    tiledWall(12, 4.2, -24, -12, Math.PI / 2);
    tiledWall(12, 4.2, -18, -12, Math.PI / 2);
    sign('情報教室 · INFORMÁTICA', -21, 3.1, -5.75, 2.4, 0.38, 0, 'computer');

    // Art & Music
    tiledWall(6.2, 4.2, 13, -18);
    tiledWall(12, 4.2, 10, -12, Math.PI / 2);
    tiledWall(12, 4.2, 16, -12, Math.PI / 2);
    sign('美術・音楽 · ARTES & MÚSICA', 13, 3.1, -5.75, 2.8, 0.38, 0, 'art');

    // Classroom 2-B with desks
    tiledWall(9.2, 4.2, 21.5, -18);
    tiledWall(12, 4.2, 17, -12, Math.PI / 2);
    tiledWall(12, 4.2, 26, -12, Math.PI / 2);
    sign('2-B · SALA DE AULA', 22, 3.1, -5.75, 2.2, 0.38, 0, '2-b');

    // (corridor items already placed in first corridor block above)

    // ── LIBRARY FURNITURE ─────────────────────────────────────────────────────
    // Polyhaven shelves (async load)
    const libraryShelves = [
      { x: -7.72, z:  -7.5, ry:  Math.PI/2, scale: 1.4, name: 'Mistérios e romances policiais', dialogueNodeId: 'library_shelf_mystery'    },
      { x: -7.72, z: -10.2, ry:  Math.PI/2, scale: 1.4, name: 'Poesia japonesa',                dialogueNodeId: 'library_shelf_poetry'     },
      { x: -7.72, z: -12.9, ry:  Math.PI/2, scale: 1.4, name: 'Astronomia e espaço',            dialogueNodeId: 'library_shelf_astronomy'  },
      { x: -7.72, z: -15.6, ry:  Math.PI/2, scale: 1.4, name: 'História de Kyoto',              dialogueNodeId: 'library_shelf_history'    },
      { x: -0.28, z:  -7.5, ry: -Math.PI/2, scale: 1.4, name: 'Ciências naturais',              dialogueNodeId: 'library_shelf_science'    },
      { x: -0.28, z: -10.2, ry: -Math.PI/2, scale: 1.4, name: 'Filosofia',                      dialogueNodeId: 'library_shelf_philosophy' },
      { x: -0.28, z: -12.9, ry: -Math.PI/2, scale: 1.4, name: 'Literatura estrangeira',         dialogueNodeId: 'library_shelf_foreign'    },
      { x: -0.28, z: -15.6, ry: -Math.PI/2, scale: 1.4, name: 'Arquivo escolar',                dialogueNodeId: 'library_shelf_archive'    },
    ];
    libraryShelves.forEach((sl) => {
      colliders.push({ x: sl.x, z: sl.z, w: 0.7, d: 1.4 });
      spots.push({ id: `library_${sl.dialogueNodeId}`, name: sl.name, type: 'EXAMINAR',
        x: sl.x + (sl.x < -4 ? 0.85 : -0.85), z: sl.z, dialogueNodeId: sl.dialogueNodeId });
    });
    shelfLoader.load('/models/polyhaven/shelf/Shelf_01_1k.gltf', (asset) => {
      libraryShelves.forEach((slot) => {
        const shelf = asset.scene.clone(true);
        shelf.position.set(slot.x, 0, slot.z); shelf.rotation.y = slot.ry; shelf.scale.setScalar(slot.scale);
        shelf.traverse((o) => { (o as THREE.Mesh).castShadow = false; (o as THREE.Mesh).receiveShadow = false; });
        root.add(shelf);
      });
    });

    // Reading tables — chairs in aisles, never inside table footprint
    [[-5.1, -11.2], [-2.7, -11.2], [-5.1, -14.8], [-2.7, -14.8]].forEach(([tx, tz]) => {
      put(readingTable(), tx, 0, tz, 0, [1.6, 1.0]);
      put(Mo.chair('wood'), tx-0.52, 0, tz-0.76, 0,       [0.55, 0.55]);
      put(Mo.chair('wood'), tx+0.52, 0, tz-0.76, 0,       [0.55, 0.55]);
      put(Mo.chair('wood'), tx-0.52, 0, tz+0.76, Math.PI, [0.55, 0.55]);
      put(Mo.chair('wood'), tx+0.52, 0, tz+0.76, Math.PI, [0.55, 0.55]);
    });
    put(Mo.armchair(), -5.4, 0, -7.8, 0, [0.9, 0.9]);
    put(Mo.armchair(), -3.6, 0, -7.8, 0, [0.9, 0.9]);
    put(Mo.sideTable(), -4.5, 0, -7.8, 0, [0.5, 0.5]);
    put(cabinet(2.0), -5.5, 0, -17.2, 0, [2.1, 0.55]);
    put(Mo.desk(),          -2.2, 0, -17.1, Math.PI, [2.2, 1.0]);
    put(Mo.chair('leather'), -2.2, 0, -15.9, Math.PI, [0.6, 0.6]);
    put(Mo.sideTable(), -6.6, 0, -9.5, 0, [0.5, 0.5]);
    put(Mo.sideTable(), -1.5, 0, -9.5, 0, [0.5, 0.5]);
    // Windows flush to walls
    rainyWindow(-6.7, -17.9, 0, 1.5);
    rainyWindow(-3.5, -17.9, 0, 1.5);
    rainyWindow(-7.85, -10.0, Math.PI/2, 1.5);
    rainyWindow(-7.85, -14.5, Math.PI/2, 1.5);
    rainyWindow( 0.85, -10.0, Math.PI/2, 1.5);
    rainyWindow( 0.85, -14.5, Math.PI/2, 1.5);
    // Wall sconces flush to side walls (lateral walls run along Z axis — onXWall=true)
    wallSconce(-7.58, -8.5,  true);
    wallSconce(-7.58, -12.0, true);
    wallSconce(-7.58, -15.5, true);
    wallSconce( 0.58, -8.5,  true);
    wallSconce( 0.58, -12.0, true);
    wallSconce( 0.58, -15.5, true);
    pendantLamp(-5.1, -11.0);
    pendantLamp(-2.7, -14.5);
    roomCeilingLight(-4.0,  -8.5,  0xffd090, 0.65);
    roomCeilingLight(-4.0, -16.5,  0xffd090, 0.65);
    spots.push({ id: 'library_desk',      name: 'Mesa da Bibliotecária',    type: 'EXAMINAR', x: -2.2, z: -17.1, dialogueNodeId: 'library_desk'      });
    spots.push({ id: 'library_armchair',  name: 'Poltrona de Leitura',      type: 'EXAMINAR', x: -4.5, z:  -7.8, dialogueNodeId: 'library_armchair'  });
    spots.push({ id: 'library_date_book', name: 'Livro com anotação 17/03', type: 'EXAMINAR', x: -5.1, z: -14.8, dialogueNodeId: 'library_date_book' });

    // More corridor/back-room details
    // ── CORREDOR CENTRAL — DECORAÇÕES COMPLETAS ────────────────────────────────
    // Shared materials para decorações do corredor — evita alocações repetidas
    const _festivalBannerColors = [0xe8223a, 0x2255c8, 0xeec024, 0x2a7a3a, 0xdd5520].map((color) => new THREE.Color(color));
    const _bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide });
    const _bannerGeometry = new THREE.PlaneGeometry(0.28, 0.36);
    const _bannerTransform = new THREE.Object3D();
    const _metalLockerMat = Mo.std(0x60758a, 0.45, 0.55);
    const _cabinetIronMat = Mo.std(0x4a5560, 0.45, 0.6);
    const _tableTopMat    = Mo.MAT.oak;
    const _tableLegMat    = Mo.MAT.iron;

    // ── Mesa de refeitório (2 compridas de cada lado do corredor central)
    const cafeteriaTable = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      // tampo
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 0.88), _tableTopMat);
      top.position.y = 0.76; g.add(top);
      // pernas
      [[-1.48, -0.36],[1.48, -0.36],[-1.48, 0.36],[1.48, 0.36]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.74, 0.07), _tableLegMat);
        leg.position.set(lx, 0.37, lz); g.add(leg);
      });
      // bancos dos dois lados
      [-0.72, 0.72].forEach(bz => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.32), _tableTopMat);
        bench.position.set(0, 0.46, bz); g.add(bench);
        [[-1.3, bz],[1.3, bz]].forEach(([slx, slz]) => {
          const sl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.06), _tableLegMat);
          sl.position.set(slx, 0.22, slz); g.add(sl);
        });
      });
      g.position.set(x, 0, z); g.rotation.y = ry;
      root.add(g);
      colliders.push({ x, z, w: 3.4, d: 1.8 });
    };

    // ── Armário de ferro de corredor (pequeno, na parede)
    const ironLocker = (x: number, z: number, ry = 0, cols = 4) => {
      const g = new THREE.Group();
      const unitW = 0.42;
      for (let i = 0; i < cols; i++) {
        const cx = (i - (cols-1)/2) * unitW;
        const body = new THREE.Mesh(new THREE.BoxGeometry(unitW - 0.02, 1.72, 0.36), _cabinetIronMat);
        body.position.set(cx, 0.86, 0); g.add(body);
        // trinco
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), Mo.MAT.brass);
        latch.position.set(cx + unitW * 0.25, 0.9, 0.2); g.add(latch);
        // ventilação (2 fendas)
        [0.3, 0.5].forEach(vy => {
          const vent = new THREE.Mesh(new THREE.BoxGeometry(unitW * 0.55, 0.03, 0.04), Mo.MAT.iron);
          vent.position.set(cx, 0.86 + vy, 0.19); g.add(vent);
        });
      }
      g.position.set(x, 0, z); g.rotation.y = ry;
      root.add(g);
      colliders.push({ x, z, w: cols * unitW + 0.1, d: 0.45 });
    };

    // ── Bandeirinha de festival japonês (faixa de triângulos coloridos no teto)
    const festivalBanner = (x1: number, x2: number, y: number, z: number) => {
      const len = Math.abs(x2 - x1);
      const cx  = (x1 + x2) / 2;
      // fio
      const wire = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.012), Mo.MAT.iron);
      wire.position.set(cx, y, z); root.add(wire);
      // Instanced flags retain the festival colors with one draw call per span.
      const count = Math.floor(len / 0.7);
      const flags = new THREE.InstancedMesh(_bannerGeometry, _bannerMat, count);
      for (let i = 0; i < count; i++) {
        const bx = x1 + (i + 0.5) * (len / count);
        _bannerTransform.position.set(bx, y - 0.2, z);
        _bannerTransform.rotation.set(0.15 + (i % 3) * 0.08, 0, 0);
        _bannerTransform.updateMatrix();
        flags.setMatrixAt(i, _bannerTransform.matrix);
        flags.setColorAt(i, _festivalBannerColors[i % _festivalBannerColors.length]);
      }
      flags.instanceMatrix.needsUpdate = true;
      if (flags.instanceColor) flags.instanceColor.needsUpdate = true;
      root.add(flags);
    };

    // ── Cartaz de parede (mais elaborado que o poster simples)
    const wallPoster = (x: number, y: number, z: number, ry: number, label: string, color: number) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.6, 0.04), Mo.MAT.darkWood);
      frame.position.set(x, y, z); frame.rotation.y = ry; root.add(frame);
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.52),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
      bg.position.set(x + Math.sin(ry) * 0.022, y, z + Math.cos(ry) * 0.022);
      bg.rotation.y = ry; root.add(bg);
      const txt = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.46),
        new THREE.MeshBasicMaterial({ map: T.doorPlate(label), transparent: true, toneMapped: false, side: THREE.DoubleSide }));
      txt.position.set(x + Math.sin(ry) * 0.033, y, z + Math.cos(ry) * 0.033);
      txt.rotation.y = ry; root.add(txt);
    };

    // ── Extintor (detalhe de corredor)
    const fireExtinguisher = (x: number, z: number) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: 0xcc1a1a, roughness: 0.5, metalness: 0.4 }));
      body.position.y = 0.36; g.add(body);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.085, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.7 }));
      top.position.y = 0.61; g.add(top);
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), Mo.MAT.steel);
      bracket.position.set(0, 0.38, -0.14); g.add(bracket);
      g.position.set(x, 0, z); root.add(g);
    };

    // ── Quadro de avisos com texto de festival
    const festivalNoticeBoard = (x: number, z: number, ry = 0) => {
      const g = new THREE.Group();
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.1, 0.07), Mo.MAT.darkWood);
      board.position.y = 0.55; g.add(board);
      const cork = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.96),
        new THREE.MeshStandardMaterial({ color: 0xb87a44, roughness: 0.95 }));
      cork.position.set(0, 0.55, 0.04); g.add(cork);
      // papéis pregados
      [[-0.4, 0.12],[0.15, 0.2],[-0.28,-0.18],[0.38,-0.1]].forEach(([px, py], i) => {
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.28),
          new THREE.MeshBasicMaterial({ color: [0xf5f0e0,0xdce8f5,0xf5e4dc,0xe8f0dc][i], toneMapped: false }));
        paper.position.set(px, 0.55 + py, 0.052); g.add(paper);
      });
      // Texto do festival
      const title = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.22),
        new THREE.MeshBasicMaterial({ map: T.doorPlate('FESTIVAL CULTURAL · 文化祭'), transparent: true, toneMapped: false }));
      title.position.set(0, 0.97, 0.042); g.add(title);
      g.position.set(x, 1.05, z); g.rotation.y = ry; root.add(g);
      colliders.push({ x, z, w: 0.2, d: 0.2 });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // POSICIONAMENTO DE TODAS AS DECORAÇÕES NO CORREDOR
    // O corredor ocupa: x de -26 a +26, z de -6 a +6
    // Parede norte (z≈6.15): acessada com z=6.1, ry=Math.PI
    // Parede sul (z≈-6.15, lado das salas): acessada com z=-6.1, ry=0
    // ─────────────────────────────────────────────────────────────────────────

    // Mesas de refeitório — 4 mesas centrais, 2 de cada lado
    cafeteriaTable(-8.5,  2.2);
    cafeteriaTable(-8.5, -2.2);
    cafeteriaTable( 6.5,  2.2);
    cafeteriaTable( 6.5, -2.2);

    // Armários de ferro — ao longo da parede norte (z≈5.6)
    ironLocker(-23.0, 5.55, 0, 6);
    ironLocker(-14.5, 5.55, 0, 6);
    ironLocker(  2.5, 5.55, 0, 6);
    ironLocker( 18.5, 5.55, 0, 6);

    // Noticeboards existentes + novos cartazes de festival
    [-24, -16, -8, 0, 8, 16, 24].forEach((cx) => {
      put(noticeBoard(1.25), cx, 1.15, 5.98, Math.PI, [1.3, 0.12]);
    });

    // Cartazes de festival na parede norte
    wallPoster(-20.5, 2.0, 6.07, Math.PI, 'FESTIVAL · 10/10',  0x1a3a8a);
    wallPoster( -5.0, 2.0, 6.07, Math.PI, 'CLUBE DE TEATRO',   0x6a1a1a);
    wallPoster(  9.5, 2.0, 6.07, Math.PI, 'CIÊNCIAS · EXPO',   0x1a5a2a);
    wallPoster( 21.0, 2.0, 6.07, Math.PI, 'GINÁSTICA ESCOLAR', 0x5a3a10);

    // Quadros de festival
    festivalNoticeBoard(-10.5, 5.9, Math.PI);
    festivalNoticeBoard(  4.5, 5.9, Math.PI);
    festivalNoticeBoard( 17.5, 5.9, Math.PI);

    // Faixas de festival japonês (bandeirinhas coloridas no teto do corredor)
    festivalBanner(-25, -10, 3.72, 0.0);   // trecho oeste
    festivalBanner(-10,  4,  3.72, 0.0);   // trecho central-oeste
    festivalBanner(  4, 14,  3.72, 0.0);   // trecho central-leste
    festivalBanner( 14, 26,  3.72, 0.0);   // trecho leste
    festivalBanner( 29, 41,  3.58, -1.4);  // ala nova do refeitório
    festivalBanner(-7,   5,  3.58,  2.8);   // pátio interno

    // Lanternas de papel do matsuri, agrupadas em instâncias para não pesar
    // como dezenas de objetos separados no corredor.
    const lanternPositions = [-23.5, -16.8, -10.1, -3.4, 3.4, 10.1, 16.8, 23.5];
    const lanternGeometry = new THREE.SphereGeometry(0.23, 8, 6);
    const lanternCapGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.055, 6);
    const lanternCordGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.34, 4);
    const lanternColors = [0xc93245, 0xf1d99d, 0x46969b, 0xe98442];
    const lanternDummy = new THREE.Object3D();
    lanternColors.forEach((color, colorIndex) => {
      const positions = lanternPositions.filter((_, index) => index % lanternColors.length === colorIndex);
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.85 });
      const bodies = new THREE.InstancedMesh(lanternGeometry, material, positions.length);
      positions.forEach((x, i) => {
        lanternDummy.position.set(x, 3.0, 1.1);
        lanternDummy.rotation.set(0, 0, ((i + colorIndex) % 3 - 1) * 0.06);
        lanternDummy.scale.set(0.86, 1.25, 0.86);
        lanternDummy.updateMatrix(); bodies.setMatrixAt(i, lanternDummy.matrix);
      });
      bodies.instanceMatrix.needsUpdate = true; root.add(bodies);
    });
    const lanternCaps = new THREE.InstancedMesh(lanternCapGeometry, Mo.MAT.darkWood, lanternPositions.length);
    const lanternCords = new THREE.InstancedMesh(lanternCordGeometry, Mo.MAT.iron, lanternPositions.length);
    lanternPositions.forEach((x, i) => {
      lanternDummy.rotation.set(0, 0, 0); lanternDummy.scale.setScalar(1);
      lanternDummy.position.set(x, 3.29, 1.1); lanternDummy.updateMatrix(); lanternCaps.setMatrixAt(i, lanternDummy.matrix);
      lanternDummy.position.set(x, 3.64, 1.1); lanternDummy.updateMatrix(); lanternCords.setMatrixAt(i, lanternDummy.matrix);
    });
    lanternCaps.instanceMatrix.needsUpdate = true; lanternCords.instanceMatrix.needsUpdate = true;
    root.add(lanternCaps, lanternCords);
    [-18, 0, 18].forEach((x) => ceilingLight(x, 0));

    // Plantas decorativas — já existentes + novas posições
    corridorPlant(-14.5, 2.8);
    corridorPlant(  5.0, 2.5);
    corridorPlant( 22.0, 2.8);
    corridorPlant(-19.0, -4.8);  // perto da parede das salas
    corridorPlant(  0.0,  4.5);  // centro do corredor
    corridorPlant( 12.0, -4.5);

    // A few green corners inside classrooms break up the long corridor view.
    corridorPlant(-0.8, -16.8);  // library
    corridorPlant(-18.7, -16.8); // computer room
    corridorPlant( 15.0, -7.2); // art room
    corridorPlant( 17.8, -17.0); // classroom 2-B

    // Bebedouros
    waterFountain(-17.5, 5.65, 0);
    waterFountain(  9.0, 5.65, 0);

    // Waiting bench placed flush against the corridor wall to keep the walking lane open.
    put(bench(), -10.5, 0, 4.7, 0, [2.1, 0.65]);

    // Extintores de incêndio (junto às paredes)
    fireExtinguisher(-25.5, 4.8);
    fireExtinguisher(  0.5, 4.8);
    fireExtinguisher( 16.0, 4.8);
    fireExtinguisher( 25.5, 4.8);

    // Placas de nome das salas (corredor — acima das portas)
    doorPlate('図書室',    -4,   -5.86);
    doorPlate('保健室',     5,   -5.86);
    doorPlate('事務室',   -13,  -5.86);
    doorPlate('情報教室', -21,  -5.86);
    doorPlate('美術室',    13,  -5.86);
    doorPlate('2-B',      21.5, -5.86);

    // Spots de interação para as decorações
    spots.push({ id: 'cafeteria_table_w', name: 'Mesa do Refeitório', type: 'EXAMINAR', x: -8.5, z: 0, dialogueNodeId: 'cafeteria_table_w' });
    spots.push({ id: 'cafeteria_table_e', name: 'Mesa do Refeitório', type: 'EXAMINAR', x:  6.5, z: 0, dialogueNodeId: 'cafeteria_table_e' });
    spots.push({ id: 'corridor_banner_w', name: 'Faixa do Festival',  type: 'EXAMINAR', x:-17.5, z: 0, dialogueNodeId: 'corridor_banner_w' });
    spots.push({ id: 'corridor_banner_e', name: 'Faixa do Festival',  type: 'EXAMINAR', x:  9.0, z: 0, dialogueNodeId: 'corridor_banner_e' });
    // Connected east wing: cafeteria, kitchen and supply room.
    put(Mo.woodFloor(16, 24), 35, 0, -6);
    put(Mo.box(16, 0.1, 24, Mo.std(0x666666)), 35, -0.05, -6);
    addFrontPartition(35, 16, -5.6, 'annex_kitchen', 1.6, 3.2);
    addFrontPartition(35, 16, -11.8, 'annex_storage', 1.6, 3.2);
    ceilingPanel(35, -2.8, 16, 6.2);
    ceilingPanel(35, -8.8, 16, 6.2);
    ceilingPanel(35, -14.9, 16, 6.2);
    sign('食堂 · REFEITÓRIO', 35, 3.1, 5.82, 2.8, 0.42, Math.PI);
    sign('調理室 · COZINHA', 35, 3.1, -5.35, 2.5, 0.4, 0);
    sign('倉庫 · ALMOXARIFADO', 35, 3.1, -11.55, 2.8, 0.4, 0);
    const annexTable = (x: number, z: number) => cafeteriaTable(x, z);
    annexTable(31.5, 1.1); annexTable(38.5, 1.1); annexTable(31.5, -2.7); annexTable(38.5, -2.7);
    put(Mo.box(5.2, 0.12, 0.9, Mo.MAT.steel), 35, 0.92, -8.8, 0, [5.3, 1]);
    put(Mo.box(2.8, 1.6, 0.65, Mo.MAT.steel), 30.2, 0.8, -9.4, 0, [2.9, 0.8]);
    put(Mo.box(1.2, 1.2, 0.9, Mo.MAT.darkWood), 39.2, 0.6, -15.2, 0, [1.2, 1]);
    put(Mo.box(3.2, 0.08, 1.1, Mo.MAT.oak), 34.5, 1.05, -15.5, 0, [3.3, 1.2]);
    for (const [id, name, x, z] of [
      ['annex_cafeteria', 'Balcão do Refeitório', 35, 5.3],
      ['annex_kitchen', 'Bancada da Cozinha', 35, -8.8],
      ['annex_storage', 'Prateleiras do Almoxarifado', 34.5, -15.5],
    ] as const) spots.push({ id, name, type: 'EXAMINAR', x, z, dialogueNodeId: id });
    // Additional windows flush to perimeter walls (already handled per-room above,
    // these are the classroom back-wall windows)
    rainyWindow(22, -17.9, 0, 2.2);
    put(noticeBoard(1.7), 22, 1.1, -17.86, 0, [1.8, 0.12]);
    put(cabinet(2.3), 22, 0, -17.15, 0, [2.4, 0.55]);

    // ── CLASSROOM 2-B ──────────────────────────────────────────────────────────
    // Student desks in 3×3 grid with chairs BEHIND each desk
    const deskPositions: [number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dx = 19 + col * 2.55;
        const dz = -9.3 - row * 2.6;
        deskPositions.push([dx, dz]);
        put(schoolDesk(), dx, 0, dz, 0, [1.2, 1.5]);
        // Chair south of desk (student faces board = north)
        put(studentChair(), dx, 0, dz + 0.9, Math.PI, [0.5, 0.5]);
      }
    }
    // Additional NPCs seated in class
    npcs.push({ id: 'class_student_a', name: 'Aluna da 2-B', role: 'Aluna', x: deskPositions[1][0], z: deskPositions[1][1]+0.9, lines: ['Psiu... você está bem?'] });
    npcs.push({ id: 'class_student_b', name: 'Aluno da 2-B',  role: 'Aluno', x: deskPositions[3][0], z: deskPositions[3][1]+0.9, lines: ['A professora ainda não chegou.'] });
    npcs.push({ id: 'class_student_c', name: 'Aluna sonolenta', role: 'Aluna', x: deskPositions[5][0], z: deskPositions[5][1]+0.9, lines: ['...zzz...'] });

    // Teacher desk + whiteboard
    put(Mo.desk(),           24.5, 0, -7.8,  Math.PI, [2.2, 1.0]);
    put(Mo.chair('leather'), 24.5, 0, -9.0,  Math.PI, [0.6, 0.6]);
    put(Mo.whiteboard(),     21.5, 1.2, -17.85, 0, [1.8, 0.08]);
    put(Mo.plant('bonsai'), 25.1, 0, -7.1, 0, [0.45, 0.45]);

    // Alphabet/periodic table wall decorations
    [20.5, 22.0, 23.5, 25.0].forEach((px, i) => {
      const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.65), new THREE.MeshBasicMaterial({ map: T.doorPlate(['ALFABETO', 'TABUADA', 'MAPA', 'REGRAS'][i]), side: THREE.DoubleSide, toneMapped: false }));
      poster2.position.set(px, 2.2, -17.83);
      root.add(poster2);
    });

    // Windows
    rainyWindow(25.85, -10.5, Math.PI / 2, 1.4);
    rainyWindow(25.85, -14.5, Math.PI / 2, 1.4);

    // Classroom lighting
    roomCeilingLight(21.5, -10.0, 0xffd8a0, 1.0);
    roomCeilingLight(21.5, -15.0, 0xffd8a0, 1.0);

    const deskAt: [number, number] = [deskPositions[0][0], deskPositions[0][1] + 0.8];
    sign('SHINOHARA', deskPositions[0][0], 0.82, deskPositions[0][1] - 0.34, 0.62, 0.16, Math.PI, '2-b');

    // Seat ring marker
    const seatRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 28), new THREE.MeshBasicMaterial({ color: 0x4f9be8, transparent: true, opacity: 0.85 }));
    seatRing.rotation.x = -Math.PI / 2;
    seatRing.position.set(deskAt[0], 0.03, deskAt[1]);
    root.add(seatRing);
    anims.push((t) => { const s = 1 + Math.sin(t * 2.8) * 0.1; seatRing.scale.set(s, s, 1); });
    spots.push({ id: 'sabrina_desk_seat', name: 'Sua carteira (2-B)', type: 'EXAMINAR', x: deskAt[0], z: deskAt[1], dialogueNodeId: 'sabrina_desk_seat' });

    // Courtyard: small shrine
    put(Mo.box(4.0, 0.02, 3.5, Mo.MAT.gravel || Mo.std(0x7a7974)), -5, 0.01, 3.5);
    put(Mo.pillar(2.8), -6.2, 1.4, 2.5);
    put(Mo.pillar(2.8), -3.8, 1.4, 2.5);

    // NPC sprites
    const npcSprites: { sprite: THREE.Sprite; npc: SchoolNpc; x: number; z: number; phase: number; collider: { x: number; z: number; w: number; d: number } }[] = [];
    // simple NPCs for demo
    npcs.push({ id: 'entrance_student', name: 'Aluno apressado', role: 'Estudante', x: -21, z: 0.5, lines: ['Bom dia!'], dialogueNodeId: 'school_entrance_student' });
    npcs.push({ id: 'yumi_tanaka', name: 'Yumi Tanaka', role: 'Bibliotecária', x: 0.5, z: -7.5, lines: ['Gabriela. Bom dia.'], dialogueNodeId: 'librarian_yumi' });

    npcs.push(
      { id: 'emi_hall', name: 'Emi Takahashi', role: 'Estudante', x: -4.5, z: 2.2, lines: ['Você viu os cartazes do festival?'] },
      { id: 'ken_hall', name: 'Ken Mori', role: 'Estudante', x: 8.5, z: 2.1, lines: ['A aula já vai começar!'] },
      { id: 'hana_art', name: 'Hana Fujimoto', role: 'Clube de artes', x: 14.2, z: -12.8, lines: ['Estou preparando algo para o festival.'] },
      { id: 'ryo_class', name: 'Ryo Sato', role: 'Aluno da 2-B', x: 24.5, z: -15.6, lines: ['Essa sala parece maior hoje, né?'] },
    );

    npcs.push(
      { id: 'walk_aya', name: 'Aya', role: 'Estudante', x: -16, z: 1.1, lines: ['Com licença!'] },
      { id: 'walk_yuto', name: 'Yuto', role: 'Estudante', x: -11, z: 2.8, lines: ['Ainda está chovendo lá fora.'] },
      { id: 'walk_mio', name: 'Mio', role: 'Estudante', x: -1, z: 1.4, lines: ['O festival vai ser incrível.'] },
      { id: 'walk_sora', name: 'Sora', role: 'Estudante', x: 4, z: 2.7, lines: ['Esqueci meu guarda-chuva.'] },
      { id: 'walk_ren', name: 'Ren', role: 'Estudante', x: 12, z: 1.2, lines: ['A professora já chegou?'] },
      { id: 'walk_nana', name: 'Nana', role: 'Estudante', x: 18, z: 2.8, lines: ['Vou pegar um livro antes da aula.'] },
      { id: 'walk_haru', name: 'Haru', role: 'Estudante', x: 23, z: 1.2, lines: ['Bom dia, Gabriela.'] },
    );

    npcs.forEach((npc, idx) => {
      const sprite = createSilhouette(false, 1.58);
      sprite.position.set(npc.x, 0, npc.z);
      root.add(sprite);
      const collider = { x: npc.x, z: npc.z, w: 0.6, d: 0.6 };
      npcSprites.push({ sprite, npc, x: npc.x, z: npc.z, phase: idx * 1.1, collider });
      colliders.push(collider);
    });
    anims.push((t) => npcSprites.forEach((ns) => {
      const walking = ns.npc.id.startsWith('walk_');
      const x = walking ? ns.x + Math.sin(t * 0.45 + ns.phase) * 1.65 : ns.x;
      const z = walking ? ns.z + Math.cos(t * 0.9 + ns.phase) * 0.3 : ns.z;
      ns.sprite.position.set(x, Math.abs(Math.sin(t * (walking ? 5 : 2.2) + ns.phase)) * (walking ? 0.05 : 0.03), z);
      ns.npc.x = x;
      ns.npc.z = z;
      ns.collider.x = x;
      ns.collider.z = z;
    }));

    // Additional NPCs for more life in the school
    // Students hanging around different areas
    npcs.push(
      { id: 'chat_mio', name: 'Mio Kurosawa', role: 'Amiga de Gabriela', x: -12, z: -7.5, lines: ['Ei, Gabriela! Vi que você gosta de livros.'], dialogueNodeId: 'chat_mio' },
      { id: 'chat_aya', name: 'Aya Minamoto', role: 'Estudante', x: 10.5, z: -15.5, lines: ['Você pode me ajudar com este problema de matemática?'], dialogueNodeId: 'chat_aya' },
      { id: 'chat_ren', name: 'Ren Watanabe', role: 'Estudante', x: 15.8, z: -14.2, lines: ['A professora vai chegar em breve.'], dialogueNodeId: 'chat_ren' },
      { id: 'chat_sora', name: 'Sora Yamamoto', role: 'Clube de Fotografia', x: -22.5, z: -14.8, lines: ['Liest meus fotos do festival ontem.'], dialogueNodeId: 'chat_sora' },
      { id: 'chat_nana', name: 'Nana Suzuki', role: 'Estudante', x: 20, z: -10.5, lines: ['Você viu o novo episódio do anime?'], dialogueNodeId: 'chat_nana' },
      { id: 'chat_hana', name: 'Hana Yoshida', role: 'Artista', x: 14.2, z: -13.8, lines: ['Estou trabalhando em uma nova pintura.'], dialogueNodeId: 'chat_hana' }
    );

    // Nurse NPC in infirmary
    npcs.push(
      { id: 'nurse_reiko', name: 'Reiko Arai', role: 'Enfermeira', x: 3.5, z: -14.5, lines: ['Está tudo bem, Gabriela? Você parece pálida.'], dialogueNodeId: 'nurse_reiko' }
    );

    // Secretary NPC
    npcs.push(
      { id: 'secretary_mei', name: 'Mei Chen', role: 'Secretária', x: -13.5, z: -15.5, lines: ['Formulários de inscrição estão na mesa.'], dialogueNodeId: 'secretary_mei' },
      { id: 'director_akiyama', name: 'Diretora Akiyama', role: 'Diretora', x: -10.5, z: -15.5, lines: ['Gabriela, posso conversar com você um instante?'], dialogueNodeId: 'director_akiyama' }
    );

    // Computer room teacher
    npcs.push(
      { id: 'computer_teacher', name: 'Prof. Tanaka', role: 'Professor de Informática', x: -20.5, z: -14.5, lines: ['Os computadores estão atualizados hoje.'], dialogueNodeId: 'computer_teacher' }
    );

    // Courtyard shrine keeper
    npcs.push(
      { id: 'courtyard_keeper', name: 'Velho Kashimoto', role: 'Guardião do Santuário', x: -4.5, z: 3.5, lines: ['Que bom ver jovens visitando o santuário.'], dialogueNodeId: 'courtyard_keeper' }
    );

    // Fade just the first wall between the camera and Gabriela, then clamp the camera to its near side.
    const updateCameraOcclusion = (camera: THREE.Camera, player: THREE.Vector3, _dt = 1 / 60) => {
      const target = new THREE.Vector3(player.x, 0.95, player.z);
      const ray = camera.position.clone().sub(target);
      const distance = ray.length();
      if (distance < 0.01) return;
      ray.normalize();
      occlusionRay.set(target, ray);
      occlusionRay.far = distance;
      const first = occlusionRay.intersectObjects(occlusionTargets, false)[0];
      const blockedWall = first && first.distance < distance - 0.3 ? first.object : null;
      occlusionWalls.forEach(({ mesh, material }) => {
        const fade = mesh === blockedWall;
        material.transparent = fade;
        material.opacity = fade ? 0.2 : 1;
        material.depthWrite = !fade;
      });
      if (blockedWall && first) {
        camera.position.copy(first.point).addScaledVector(ray, -0.32);
        camera.lookAt(target);
        camera.updateMatrixWorld();
      }
    };

    const bounds = () => ({ minX: -26.5, maxX: 42.5, minZ: -18.2, maxZ: 6.2 });
    const animate: Anim = (t, dt) => {
      anims.forEach((a) => a(t, dt));
      doorParts.forEach(({ door, pivot }) => {
        const target = door.isOpen ? -Math.PI / 2 : 0;
        pivot.rotation.y = THREE.MathUtils.damp(pivot.rotation.y, target, 11, dt);
      });
    };

    const toggleDoor = (id: string) => {
      const part = doorParts.find(({ door }) => door.id === id);
      if (!part) return;
      part.door.isOpen = !part.door.isOpen;
      part.collider.enabled = !part.door.isOpen;
    };

    (root.userData as any).signs = signMeshes;

    return {
      group: root,
      colliders,
      npcs,
      spots,
      doors,
      toggleDoor,
      updateCameraOcclusion,
      cameraBlockers: occlusionTargets,
      deskAt,
      bounds,
      animate,
      dispose: () => {
        root.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry) try { m.geometry.dispose(); } catch {}
          if (m.material) try { (m.material as any).dispose?.(); } catch {}
        });
        root.removeFromParent();
      },
    };
  };
  // stray legacy call removed (was causing `box is not defined` at runtime)
