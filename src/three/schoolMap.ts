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
  updateCameraOcclusion: (camera: THREE.Camera, player: THREE.Vector3) => void;
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
    const occlusionWalls: THREE.Group[] = [];
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
    
    // NPC dialogue nodes that will be referenced
    const npcDialogues = {
      entrance_student: 'school_entrance_student',
      librarian_yumi: 'librarian_yumi',
      emi_hall: 'emi_hall',
      ken_hall: 'ken_hall',
      hana_art: 'hana_art',
      ryo_class: 'ryo_class',
      nurse_reiko: 'nurse_reiko',
      secretary_mei: 'secretary_mei',
      computer_teacher: 'computer_teacher',
      courtyard_keeper: 'courtyard_keeper',
    };
    const tiledWall = (w: number, h: number, x: number, z: number, ry = 0) => {
      const group = new THREE.Group();
      // A neutral ceramic finish reads more naturally under the school's mixed warm/cool light.
      const tileMaterial = new THREE.MeshStandardMaterial({ color: 0xdedbd3, roughness: 0.62, metalness: 0.03 });
      tileMaterial.transparent = true;
      const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), tileMaterial);
      face.position.y = h / 2;
      group.add(face);
      occlusionTargets.push(face);

      // Thin grout strips turn the Pinterest stone texture into individual wall tiles.
      const grout = new THREE.MeshStandardMaterial({ color: 0x97938c, roughness: 0.95 });
      grout.transparent = true;
      for (let gx = -w / 2 + 0.55; gx < w / 2; gx += 0.55) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.024, h, 0.018), grout);
        line.position.set(gx, h / 2, 0.091);
        group.add(line);
      }
      for (let gy = 0.48; gy < h; gy += 0.48) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(w, 0.024, 0.018), grout);
        line.position.set(0, gy, 0.091);
        group.add(line);
      }
      const baseboardMaterial = Mo.MAT.beam.clone();
      baseboardMaterial.transparent = true;
      const baseboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.12, 0.2), baseboardMaterial);
      baseboard.position.y = 0.06;
      group.add(baseboard);
      group.position.set(x, 0, z);
      group.rotation.y = ry;
      root.add(group);
      occlusionWalls.push(group);
      group.userData.fadeMaterials = [tileMaterial, grout, baseboardMaterial];
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
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.42, 14), Mo.MAT.steel);
      body.position.y = 0.21;
      g.add(body);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.035, 14), Mo.MAT.iron);
      lid.position.y = 0.43;
      g.add(lid);
      return { group: g };
    };
    const ceilingLight = (x: number, z: number) => {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.38), new THREE.MeshStandardMaterial({ color: 0xfff9de, emissive: 0xffe6ac, emissiveIntensity: 1.4 }));
      fixture.position.set(x, 3.85, z);
      root.add(fixture);
      const light = new THREE.PointLight(0xffedc4, 0.48, 8, 2);
      light.position.set(x, 3.55, z);
      root.add(light);
    };
    const pendantLamp = (x: number, z: number) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8), Mo.MAT.iron);
      cable.position.set(x, 3.38, z);
      root.add(cable);
      // Darker, more atmospheric shade
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({ 
        color: 0x3a2518, 
        roughness: 0.6, 
        metalness: 0.3, 
        side: THREE.DoubleSide 
      }));
      shade.position.set(x, 2.68, z);
      shade.rotation.x = Math.PI;
      root.add(shade);
      // Warmer, more visible bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), new THREE.MeshStandardMaterial({ 
        color: 0xffe0a0, 
        emissive: 0xffa040, 
        emissiveIntensity: 2.5, 
        roughness: 0.2 
      }));
      bulb.position.set(x, 2.58, z);
      root.add(bulb);
      // Brighter light with shadows for atmospheric effect
      const light = new THREE.PointLight(0xffb060, 1.8, 9, 2.2);
      light.position.set(x, 2.55, z);
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      light.shadow.bias = -0.003;
      light.shadow.radius = 4;
      root.add(light);
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
      const daylight = new THREE.PointLight(0xb7c8dc, 0.42, 5, 2);
      daylight.position.set(x, 2.2, z + (ry === 0 ? 0.45 : 0));
      root.add(daylight);
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

    // Generate interior partitions + doors for all named rooms (skip entrance/courtyard)
    for (const r of rooms) {
      if (r.id === 'entrance' || r.id === 'courtyard') continue;
      const roomW = r.maxX - r.minX;
      const cx = (r.minX + r.maxX) / 2;
      const frontZ = r.maxZ; // front face adjacent to corridor
      addFrontPartition(cx, roomW, frontZ, r.id, 1.0, 3.2);
    }

    // Tiled, solid perimeter walls.
    tiledWall(56, 4.2, 0, -18.2);
    tiledWall(56, 4.2, 0, 6.2);
    tiledWall(24.4, 4.2, -27, -6, Math.PI / 2);
    tiledWall(24.4, 4.2, 27, -6, Math.PI / 2);

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

    // Secretary room furniture
    put(Mo.desk(), -13.5, 0, -15.5, Math.PI, [2.2, 1]);
    put(Mo.chair('leather'), -13.5, 0, -14.15, Math.PI, [0.6, 0.6]);
    put(cabinet(1.5), -13.8, 0, -16.8, 0, [1.5, 0.55]);
    put(Mo.telephone(), -12.8, 0, -15.5, 0, [0.4, 0.4]);
    put(Mo.fileCabinet(2.2), -15.5, 0, -15.8, 0, [1.2, 0.55]);
    put(Mo.plant('monstera'), -11.5, 0, -16.2, 0, [0.5, 0.5]);
    put(noticeBoard(1.2), -14.5, 1.1, -16.5, 0, [1.2, 0.12]);
    
    // Computer room furniture - organized in blocks
    // Block 1: Computer desks row (back wall)
    put(Mo.computerDesk(1.4), -21, 0, -15.5, 0, [1.4, 0.8]);
    put(Mo.computerDesk(1.4), -22.5, 0, -15.5, 0, [1.4, 0.8]);
    put(Mo.computerDesk(1.4), -24, 0, -15.5, 0, [1.4, 0.8]);
    
    // Block 2: Chairs in front of each desk
    put(Mo.chair('leather'), -21, 0, -14.5, 0, [0.6, 0.6]);
    put(Mo.chair('leather'), -22.5, 0, -14.5, 0, [0.6, 0.6]);
    put(Mo.chair('leather'), -24, 0, -14.5, 0, [0.6, 0.6]);
    
    // Block 3: Printer station (side)
    put(Mo.printer(), -19.05, 0, -16.3, Math.PI / 2, [0.8, 0.5]);
    
    // Block 4: Storage and teaching tools
    put(cabinet(1.2), -25.5, 0, -15.8, Math.PI / 2, [1.2, 0.5]);
    put(Mo.whiteboard(), -25, 1.2, -13, Math.PI, [1.8, 0.08]);
    put(noticeBoard(1.0), -22, 1.15, -12.5, 0, [1.0, 0.12]);
    
    // Art room furniture - organized in blocks
    // Block 1: Easels area (left side)
    put(Mo.easel(), 12.5, 0, -15.5, 0, [0.5, 0.5]);
    put(Mo.easel(), 14.5, 0, -15.5, Math.PI / 2, [0.5, 0.5]);
    
    // Block 2: Display area (center, on wall)
    put(Mo.paintingDisplay(), 13.5, 1.15, -14.8, Math.PI, [1.2, 0.12]);
    
    // Block 3: Storage cabinets (right side)
    put(cabinet(1.5), 15.5, 0, -14.5, Math.PI / 2, [1.5, 0.55]);
    put(Mo.artSuppliesCabinet(), 15, 0, -15.8, 0, [1.2, 0.55]);
    put(Mo.sculptureDisplay(), 14.5, 0, -13.5, 0, [0.5, 0.5]);
    
    // Block 4: Lighting and utility
    put(Mo.lightFixture(), 13, 2.8, -13.5, 0, [0.5, 0.5]);
    put(Mo.sinkUnit(), 11.5, 0, -14.5, 0, [1.0, 0.8]);
    put(noticeBoard(1.2), 12, 1.2, -12.5, Math.PI, [1.2, 0.12]);
    
    // Infirmary furniture
    put(Mo.examinationTable(), 4.5, 0, -15.2, 0, [1.2, 0.8]);
    put(Mo.medicalCabinet(), 6.2, 0, -14.8, Math.PI / 2, [0.8, 0.5]);
    put(Mo.bed(), 3.2, 0, -16.2, 0, [1.8, 2.2]);
    put(Mo.firstAidKit(), 5.5, 0, -16.5, 0, [0.4, 0.4]);
    put(Mo.stool(), 5.2, 0, -14.8, 0, [0.35, 0.35]);
    put(cabinet(1.8), 7.5, 0, -15.5, Math.PI / 2, [1.8, 0.55]);
    put(Mo.sinkUnit(), 7, 0, -16.5, Math.PI / 2, [1.0, 0.8]);
    put(noticeBoard(1.0), 5, 1.15, -17, 0, [1.0, 0.12]);
    put(Mo.plant('cactus'), 2.5, 0, -14.5, 0, [0.3, 0.3]);

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

    // Lived-in school details: lockers, benches, bins, notices and warm ceiling lighting.
    put(lockers(8), -20.5, 0, 5.5, 0, [5.8, 0.55]);
    put(lockers(10), 11.5, 0, 5.5, 0, [7.2, 0.55]);
    put(bench(), -10.5, 0, 4.75, Math.PI, [2.1, 0.6]);
    put(bench(), 2.5, 0, 4.75, Math.PI, [2.1, 0.6]);
    put(bin(), -7.2, 0, 5.25, 0, [0.4, 0.4]);
    put(bin(), 7.5, 0, 5.25, 0, [0.4, 0.4]);
    poster(-14, 6.07, 'CLUBE DE ARTES');
    poster(-9, 6.07, 'FESTIVAL ESCOLAR');
    poster(5, 6.07, 'REGRAS DO CORREDOR');
    poster(15, 6.07, 'BEM-VINDOS');
    for (let x = -23; x <= 25; x += 5) ceilingLight(x, 1.3);
    [-13, -3, 5, 13, 21].forEach((x) => ceilingLight(x, -10));

    // Library: spacious layout with larger shelves, proper furniture spacing, and atmospheric lighting
    // Organized to prevent chair-table collisions and create a cozy study atmosphere
    
    // Larger bookshelves along the walls (scaled up from original)
    const libraryShelves = [
      { x: -7.72, z: -7.5, ry: Math.PI / 2, name: 'Mistérios e romances policiais', dialogueNodeId: 'library_shelf_mystery', scale: 1.4 },
      { x: -7.72, z: -10.2, ry: Math.PI / 2, name: 'Poesia japonesa', dialogueNodeId: 'library_shelf_poetry', scale: 1.4 },
      { x: -7.72, z: -12.9, ry: Math.PI / 2, name: 'Astronomia e espaço', dialogueNodeId: 'library_shelf_astronomy', scale: 1.4 },
      { x: -7.72, z: -15.6, ry: Math.PI / 2, name: 'História de Kyoto', dialogueNodeId: 'library_shelf_history', scale: 1.4 },
      { x: -0.28, z: -7.5, ry: -Math.PI / 2, name: 'Ciências naturais', dialogueNodeId: 'library_shelf_science', scale: 1.4 },
      { x: -0.28, z: -10.2, ry: -Math.PI / 2, name: 'Filosofia', dialogueNodeId: 'library_shelf_philosophy', scale: 1.4 },
      { x: -0.28, z: -12.9, ry: -Math.PI / 2, name: 'Literatura estrangeira', dialogueNodeId: 'library_shelf_foreign', scale: 1.4 },
      { x: -0.28, z: -15.6, ry: -Math.PI / 2, name: 'Arquivo escolar', dialogueNodeId: 'library_shelf_archive', scale: 1.4 },
    ];
    libraryShelves.forEach((shelf) => {
      colliders.push({ x: shelf.x, z: shelf.z, w: 0.7, d: 1.4 });
      spots.push({ id: `library_${shelf.dialogueNodeId}`, name: shelf.name, type: 'EXAMINAR', x: shelf.x + (shelf.x < -4 ? 0.85 : -0.85), z: shelf.z, dialogueNodeId: shelf.dialogueNodeId });
    });
    shelfLoader.load('/models/polyhaven/shelf/Shelf_01_1k.gltf', (asset) => {
      libraryShelves.forEach((slot) => {
        const shelf = asset.scene.clone(true);
        shelf.position.set(slot.x, 0, slot.z);
        shelf.rotation.y = slot.ry;
        shelf.scale.setScalar(slot.scale);
        root.add(shelf);
      });
    });

    // Reading tables in a strict two-by-two grid; chairs sit in the clear aisles.
    // Table 1: Left side
    put(readingTable(), -5.1, 0, -11.6, 0, [1.6, 1]);
    // Table 2: Right side  
    put(readingTable(), -2.7, 0, -11.6, 0, [1.6, 1]);
    // Table 3: Back left
    put(readingTable(), -5.1, 0, -14.7, 0, [1.6, 1]);
    // Table 4: Back right
    put(readingTable(), -2.7, 0, -14.7, 0, [1.6, 1]);

    [[-6.25, -11.6], [-4.0, -11.6], [-3.8, -11.6], [-1.55, -11.6], [-6.25, -14.7], [-4.0, -14.7], [-3.8, -14.7], [-1.55, -14.7]]
      .forEach(([x, z]) => put(Mo.chair('wood'), x, 0, z, Math.PI / 2, [0.55, 0.55]));

    // Armchairs in the front area (near the entrance)
    put(Mo.armchair(), -5.25, 0, -8.6, 0, [0.9, 0.9]);
    put(Mo.armchair(), -3.8, 0, -8.6, 0, [0.9, 0.9]);

    // Cabinet against back wall
    put(cabinet(2.1), -4.5, 0, -17.15, 0, [2.2, 0.55]);

    // Teacher's desk at the front - positioned with space for chair
    put(Mo.desk(), -2.1, 0, -17.05, Math.PI, [2.2, 1]);
    put(Mo.chair('leather'), -2.1, 0, -15.8, Math.PI, [0.6, 0.6]); // Chair positioned in front, not overlapping

    // Pendant lamps with better positioning for atmospheric lighting
    pendantLamp(-5.1, -11.6);
    pendantLamp(-2.7, -14.7);

    // Additional library furniture: small side tables with lamps
    put(Mo.sideTable(), -6.5, 0, -9.5, 0, [0.5, 0.5]);
    put(Mo.sideTable(), -1.5, 0, -9.5, Math.PI, [0.5, 0.5]);

    // Additional ambient lighting for library atmosphere - wall sconces
    // Left wall sconce
    const wallSconceLeft = (x: number, z: number) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), Mo.MAT.iron);
      bracket.position.set(x, 2.4, z);
      root.add(bracket);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({
        color: 0xffe0a0,
        emissive: 0xffa040,
        emissiveIntensity: 1.8,
        roughness: 0.2
      }));
      bulb.position.set(x, 2.2, z);
      root.add(bulb);
      const light = new THREE.PointLight(0xffb060, 0.7, 4, 2);
      light.position.set(x, 2.25, z);
      root.add(light);
    };
    wallSconceLeft(-7.0, -8.5);
    wallSconceLeft(-7.0, -12.0);
    wallSconceLeft(-7.0, -15.5);
    
    // Right wall sconce
    wallSconceLeft(-0.28, -8.5);
    wallSconceLeft(-0.28, -12.0);
    wallSconceLeft(-0.28, -15.5);

    // Subtle floor glow for atmosphere
    const floorGlowLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 3),
      new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.03, side: THREE.DoubleSide })
    );
    floorGlowLeft.position.set(-4, 0.02, -12);
    floorGlowLeft.rotation.x = -Math.PI / 2;
    root.add(floorGlowLeft);

    const floorGlowRight = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 3),
      new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.03, side: THREE.DoubleSide })
    );
    floorGlowRight.position.set(-3, 0.02, -12);
    floorGlowRight.rotation.x = -Math.PI / 2;
    root.add(floorGlowRight);

    // More layers of everyday school life in the corridor and classrooms.
    [-24, -16, -8, 0, 8, 16, 24].forEach((x, i) => {
      put(noticeBoard(1.25), x, 1.15, 5.98, Math.PI, [1.3, 0.12]);
      if (i % 2 === 0) put(bin(), x + 1.05, 0, 4.95, 0, [0.4, 0.4]);
    });
    [[-23, 3.85], [-18, 3.85], [-3, 3.85], [11, 3.85], [20, 3.85]].forEach(([x, z]) => put(bench(), x, 0, z, Math.PI, [2.1, 0.6]));
    [[-22.5, -16.8], [-19.5, -16.8], [-14.5, -16.8], [-11.5, -16.8], [-5, -16.6], [-1.5, -16.6], [3.6, -16.7], [6.7, -16.7], [11.5, -16.8], [14.5, -16.8]].forEach(([x, z], i) => put(cabinet(i % 3 === 0 ? 1.8 : 1.25), x, 0, z, 0, [1.6, 0.55]));
    [[-6.7, -14], [-6.7, -9.5], [7.7, -14], [15.8, -14], [25.8, -14], [25.8, -10]].forEach(([x, z], i) => rainyWindow(x, z, Math.PI / 2, i < 2 ? 1.5 : 1.35));
    rainyWindow(-3.5, -17.9, 0, 2.2);
    rainyWindow(4.8, -17.9, 0, 1.7);
    rainyWindow(13, -17.9, 0, 1.7);
    rainyWindow(22, -17.9, 0, 2.2);
    put(noticeBoard(1.7), 22, 1.1, -17.86, 0, [1.8, 0.12]);
    put(cabinet(2.3), 22, 0, -17.15, 0, [2.4, 0.55]);

    const deskPositions: [number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dx = 19 + col * 2.55;
        const dz = -9.3 - row * 2.6;
        deskPositions.push([dx, dz]);
        put(schoolDesk(), dx, 0, dz, 0, [1.2, 1.5]);
      }
    }

    const deskAt: [number, number] = [deskPositions[0][0], deskPositions[0][1] + 0.8];
    sign('SHINOHARA', deskPositions[0][0], 0.82, deskPositions[0][1] - 0.34, 0.62, 0.16, Math.PI, '2-b');

    // Seat ring marker
    const seatRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 28), new THREE.MeshBasicMaterial({ color: 0x4f9be8, transparent: true, opacity: 0.85 }));
    seatRing.rotation.x = -Math.PI / 2;
    seatRing.position.set(deskAt[0], 0.03, deskAt[1]);
    root.add(seatRing);
    anims.push((t) => {
      const s = 1 + Math.sin(t * 2.8) * 0.1;
      seatRing.scale.set(s, s, 1);
    });

    spots.push({ id: 'sabrina_desk_seat', name: 'Sua carteira (2-B)', type: 'EXAMINAR', x: deskAt[0], z: deskAt[1] });

    // Courtyard: small shrine
    put(Mo.box(4.0, 0.02, 3.5, Mo.MAT.gravel || Mo.std(0x7a7974)), -5, 0.01, 3.5);
    put(Mo.pillar(2.8), -6.2, 1.4, 2.5);
    put(Mo.pillar(2.8), -3.8, 1.4, 2.5);

    // NPC sprites
    const npcSprites: { sprite: THREE.Sprite; npc: SchoolNpc; x: number; z: number; phase: number; collider: { x: number; z: number; w: number; d: number } }[] = [];
    // simple NPCs for demo
    npcs.push({ id: 'entrance_student', name: 'Aluno apressado', role: 'Estudante', x: -21, z: 0.5, lines: ['Bom dia!'], dialogueNodeId: 'school_entrance_student' });
    npcs.push({ id: 'yumi_tanaka', name: 'Yumi Tanaka', role: 'Bibliotecária', x: 0.5, z: -7.5, lines: ['Sabrina. Bom dia.'], dialogueNodeId: 'librarian_yumi' });

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
      { id: 'walk_haru', name: 'Haru', role: 'Estudante', x: 23, z: 1.2, lines: ['Bom dia, Sabrina.'] },
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
      { id: 'chat_mio', name: 'Mio Kurosawa', role: 'Amiga de Gabriela', x: -12, z: -7.5, lines: ['Ei, Sabrina! Vi que você gosta de livros.'], dialogueNodeId: 'chat_mio' },
      { id: 'chat_aya', name: 'Aya Minamoto', role: 'Estudante', x: 10.5, z: -15.5, lines: ['Você pode me ajudar com este problema de matemática?'], dialogueNodeId: 'chat_aya' },
      { id: 'chat_ren', name: 'Ren Watanabe', role: 'Estudante', x: 15.8, z: -14.2, lines: ['A professora vai chegar em breve.'], dialogueNodeId: 'chat_ren' },
      { id: 'chat_sora', name: 'Sora Yamamoto', role: 'Clube de Fotografia', x: -22.5, z: -14.8, lines: ['Liest meus fotos do festival ontem.'], dialogueNodeId: 'chat_sora' },
      { id: 'chat_nana', name: 'Nana Suzuki', role: 'Estudante', x: 20, z: -10.5, lines: ['Você viu o novo episódio do anime?'], dialogueNodeId: 'chat_nana' },
      { id: 'chat_hana', name: 'Hana Yoshida', role: 'Artista', x: 14.2, z: -13.8, lines: ['Estou trabalhando em uma nova pintura.'], dialogueNodeId: 'chat_hana' }
    );

    // Nurse NPC in infirmary
    npcs.push(
      { id: 'nurse_reiko', name: 'Reiko Arai', role: 'Enfermeira', x: 3.5, z: -14.5, lines: ['Está tudo bem, Sabrina? Você parece pálida.'], dialogueNodeId: 'nurse_reiko' }
    );

    // Secretary NPC
    npcs.push(
      { id: 'secretary_mei', name: 'Mei Chen', role: 'Secretária', x: -13.5, z: -15.5, lines: ['Formulários de inscrição estão na mesa.'], dialogueNodeId: 'secretary_mei' }
    );

    // Computer room teacher
    npcs.push(
      { id: 'computer_teacher', name: 'Prof. Tanaka', role: 'Professor de Informática', x: -20.5, z: -14.5, lines: ['Os computadores estão atualizados hoje.'], dialogueNodeId: 'computer_teacher' }
    );

    // Courtyard shrine keeper
    npcs.push(
      { id: 'courtyard_keeper', name: 'Velho Kashimoto', role: 'Guardião do Santuário', x: -4.5, z: 3.5, lines: ['Que bom ver jovens visitando o santuário.'], dialogueNodeId: 'courtyard_keeper' }
    );

    const updateCameraOcclusion = (camera: THREE.Camera, player: THREE.Vector3) => {
      occlusionWalls.forEach((wall) => {
        const materials = wall.userData.fadeMaterials as THREE.MeshStandardMaterial[];
        materials.forEach((material) => { material.opacity = THREE.MathUtils.damp(material.opacity, 1, 14, 1 / 60); });
      });
      root.updateMatrixWorld();
      const direction = player.clone().sub(camera.position);
      const distance = direction.length();
      if (distance < 0.01) return;
      occlusionRay.set(camera.position, direction.normalize());
      const hit = occlusionRay.intersectObjects(occlusionTargets, false)[0];
      if (hit && hit.distance < distance - 0.25) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent && !occlusionWalls.includes(parent as THREE.Group)) parent = parent.parent;
        if (parent) {
          const materials = (parent as THREE.Group).userData.fadeMaterials as THREE.MeshStandardMaterial[];
          materials?.forEach((material) => { material.opacity = THREE.MathUtils.damp(material.opacity, 0.14, 18, 1 / 60); });
        }
      }
    };

    const bounds = () => ({ minX: -26.5, maxX: 26.5, minZ: -18.2, maxZ: 6.2 });
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
