import * as THREE from 'three';
import type { Anim } from './models';
import * as T from './textures';
import { createSilhouette } from './silhouetteSprite';
import { facadeTexture } from './facadeTextures';

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

export interface SchoolBuild {
  group: THREE.Group;
  colliders: { x: number; z: number; w: number; d: number }[];
  bounds: () => { minX: number; maxX: number; minZ: number; maxZ: number };
  animate: Anim;
  npcs: SchoolNpc[];
  spots: SchoolSpot[];
  deskAt: [number, number];
  dispose: () => void;
}

export const buildSchool = (): SchoolBuild => {
  const root = new THREE.Group();
  const colliders: SchoolBuild['colliders'] = [];
  const anims: Anim[] = [];
  const npcs: SchoolNpc[] = [];
  const spots: SchoolSpot[] = [];

  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    sphere: new THREE.SphereGeometry(0.5, 8, 6),
    plane: new THREE.PlaneGeometry(1, 1),
  };

  const concrete = new THREE.MeshStandardMaterial({ map: facadeTexture('#a9a49a', '#efe9dc', 2), roughness: 0.95 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.95 });
  const wainscot = new THREE.MeshStandardMaterial({ color: 0x4f6153, roughness: 0.85 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x9c8b73, roughness: 0.8 });
  const floorCorridor = new THREE.MeshStandardMaterial({ color: 0x6e6354, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8f6b45, roughness: 0.65 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x5b4026, roughness: 0.65 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.35, metalness: 0.6 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x203a2c, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xbcd6e8, roughness: 0.15, metalness: 0.25, transparent: true, opacity: 0.5 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x3f6039, roughness: 0.9 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x7c3a31, roughness: 0.8 });
  const toriiMat = new THREE.MeshStandardMaterial({ color: 0x992420, roughness: 0.75 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x486443, roughness: 0.9 });
  const gravelMat = new THREE.MeshStandardMaterial({ color: 0x7a7974, roughness: 0.9 });

  const box = (material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, collide = true) => {
    const mesh = new THREE.Mesh(geo.box, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collide) colliders.push({ x, z, w: sx, d: sz });
    return mesh;
  };

  const sign = (text: string, x: number, y: number, z: number, w: number, h: number, ry: number) => {
    const mesh = new THREE.Mesh(geo.plane, new THREE.MeshBasicMaterial({ map: T.doorPlate(text), toneMapped: false }));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, 1);
    mesh.rotation.y = ry;
    root.add(mesh);
  };

  // ==================== 1. MAIN CORRIDOR (X: -26 to +26, Z: -5 to +5) ====================
  // Floors
  box(floorMat, 0, -0.05, 0, 56, 0.1, 14, false);
  box(floorCorridor, 0, 0.01, 0, 54, 0.02, 6, false); // Center walkway
  box(new THREE.MeshStandardMaterial({ color: 0xece8dd, roughness: 1 }), 0, 4.2, 0, 56, 0.2, 14, false);

  // Outer South Wall with Lockers
  box(concrete, 0, 2.1, 6.9, 56, 4.2, 0.24);
  box(wainscot, 0, 0.7, 6.78, 56, 1.4, 0.06, false);
  for (let i = 0; i < 34; i++) {
    const x = -24 + i * 1.45;
    const c = i % 4;
    const lockerMat = new THREE.MeshStandardMaterial({
      color: c === 0 ? 0x4d6a82 : c === 1 ? 0x5d6b78 : c === 2 ? 0x556350 : 0x6d5b48,
      roughness: 0.5,
      metalness: 0.3,
    });
    box(lockerMat, x, 1.05, 6.62, 1.35, 2.1, 0.45, true);
  }

  // End Walls
  box(wallMat, -27.5, 2.1, 0, 0.24, 4.2, 14);
  box(wallMat, 27.5, 2.1, 0, 0.24, 4.2, 14);

  // Ceiling Lights in Corridor
  for (let x = -24; x <= 24; x += 4) {
    box(new THREE.MeshStandardMaterial({ color: 0xfff7e4, emissive: 0xffe8bd, emissiveIntensity: 1.2 }), x, 4.02, 0, 2.2, 0.08, 0.7, false);
    const l = new THREE.PointLight(0xffe9c4, 0.4, 8, 2);
    l.position.set(x, 3.7, 0);
    root.add(l);
  }

  // ==================== 2. MAIN ENTRANCE & GETABAKO (X: -26 to -18) ====================
  // Entrance Glass Doors & School Plaque
  box(concrete, -25.5, 2.1, -2, 0.3, 4.2, 6, true);
  sign('京都市立東山高等学校', -25.3, 2.6, 0, 1.8, 0.5, Math.PI / 2);
  sign('HIGASHIYAMA HIGH', -25.3, 2.0, 0, 1.8, 0.3, Math.PI / 2);
  box(glassMat, -25.3, 1.6, -1.2, 0.05, 3.2, 3.0, false);

  // Getabako (Shoe lockers)
  box(woodDark, -21.5, 0.9, 4.2, 4.5, 1.8, 0.8, true);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      box(new THREE.MeshStandardMaterial({ color: 0x3d2c1e }), -23.2 + c * 0.7, 0.35 + r * 0.42, 4.2, 0.6, 0.35, 0.82, false);
    }
  }

  spots.push({
    id: 'getabako_spot',
    name: 'Armário de sapatos (Sabrina)',
    type: 'EXAMINAR',
    x: -21.5,
    z: 3.2,
    dialogueNodeId: 'getabako_locker_note',
  });

  // Entrance Student NPC
  npcs.push({
    id: 'entrance_student',
    name: 'Aluno apressado',
    role: 'Estudante',
    x: -21,
    z: 0.5,
    dialogueNodeId: 'school_entrance_student',
    lines: ['Bom dia! Você parece cansada.', 'Vai perder a primeira aula?', 'Corre!'],
  });

  // ==================== 3. CORRIDOR BULLETIN & CLOCK (X: -16 to -10) ====================
  // Bulletin Board (Mural de Avisos)
  box(new THREE.MeshStandardMaterial({ color: 0xb58b57, roughness: 0.9 }), -14, 2.1, 6.55, 3.2, 1.8, 0.08, false);
  box(new THREE.MeshStandardMaterial({ color: 0xf5f3eb }), -14.6, 2.2, 6.5, 0.8, 1.0, 0.09, false); // Poster
  box(new THREE.MeshStandardMaterial({ color: 0xdf8a84 }), -13.5, 2.0, 6.5, 0.9, 0.7, 0.09, false); // Flyer

  spots.push({
    id: 'bulletin_spot',
    name: 'Mural de Avisos da Higashiyama',
    type: 'EXAMINAR',
    x: -14,
    z: 5.5,
    dialogueNodeId: 'mural_bulletin_inspect',
  });

  // Old School Photo
  box(woodDark, -10.5, 2.2, 6.55, 1.4, 1.0, 0.08, false);
  box(new THREE.MeshBasicMaterial({ color: 0x222222 }), -10.5, 2.2, 6.5, 1.2, 0.8, 0.09, false);

  spots.push({
    id: 'old_photo_spot',
    name: 'Fotografia antiga da escola (1960)',
    type: 'EXAMINAR',
    x: -10.5,
    z: 5.5,
    dialogueNodeId: 'old_photo_school_inspect',
  });

  // Corridor Wall Clock (marking 10:17 AM!)
  box(woodDark, -12, 3.2, 6.55, 0.8, 0.8, 0.1, false);
  box(new THREE.MeshBasicMaterial({ map: T.clockDial(10, 17, 0) }), -12, 3.2, 6.49, 0.65, 0.65, 0.02, false);

  // Vending Machines in Corridor
  box(metalMat, -8, 1.2, 6.35, 1.4, 2.4, 0.8, true);
  box(new THREE.MeshBasicMaterial({ color: 0x2d68a8 }), -8, 1.4, 5.92, 1.2, 1.4, 0.06, false);

  spots.push({
    id: 'vending_spot',
    name: 'Máquina de bebidas',
    type: 'EXAMINAR',
    x: -8,
    z: 5.2,
    dialogueNodeId: 'vending_school_chat',
  });

  // ==================== 4. BIBLIOTECA (X: -6 to 2, Z: -12 to -6) ====================
  // Entrance Door
  box(woodMat, -2, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('図書室 · BIBLIOTECA', -2, 3.1, -5.75, 2.2, 0.38, 0);

  // Library Walls
  box(wallMat, -6, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, 2, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, -2, 2.1, -12, 8.2, 4.2, 0.2, true);
  box(floorMat, -2, -0.05, -9, 8, 0.1, 6, false);

  // Bookshelves in Library
  for (let b = 0; b < 3; b++) {
    box(woodDark, -4.5 + b * 2.5, 1.6, -10.5, 1.8, 3.2, 0.6, true);
  }
  // Reading table & chairs
  box(woodMat, -2, 0.75, -8, 3.0, 0.1, 1.2, true);

  spots.push({
    id: 'library_suspense_spot',
    name: 'Estante: Romances Policiais & Mistério',
    type: 'EXAMINAR',
    x: -4.5,
    z: -8.8,
    dialogueNodeId: 'inspect_book_suspense',
  });

  spots.push({
    id: 'library_parents_spot',
    name: 'Livro de Poesia Britânica (anotação da mãe)',
    type: 'EXAMINAR',
    x: -2,
    z: -8.5,
    dialogueNodeId: 'inspect_book_parents',
  });

  npcs.push({
    id: 'yumi_tanaka',
    name: 'Yumi Tanaka (Bibliotecária, 51)',
    role: 'Bibliotecária',
    x: 0.5,
    z: -7.5,
    dialogueNodeId: 'librarian_yumi',
    lines: ['Sabrina. Bom dia.', 'Você terminou aquele livro de suspense?', 'Deixei outro reservado para você.'],
  });

  // ==================== 5. ENFERMARIA (X: 3 to 9, Z: -12 to -6) ====================
  box(woodMat, 6, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('保健室 · ENFERMARIA', 6, 3.1, -5.75, 2.2, 0.38, 0);

  box(wallMat, 3, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, 9, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, 6, 2.1, -12, 6.2, 4.2, 0.2, true);
  box(floorMat, 6, -0.05, -9, 6, 0.1, 6, false);

  // Clinic Bed & White Curtain
  box(new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), 4.5, 0.45, -10, 1.2, 0.7, 2.2, true);
  box(new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.85 }), 5.4, 1.8, -10, 0.05, 3.0, 2.4, false);

  npcs.push({
    id: 'nurse_reiko',
    name: 'Reiko Arai (Enfermeira)',
    role: 'Enfermeira',
    x: 7.5,
    z: -8.5,
    dialogueNodeId: 'nurse_reiko',
    lines: ['Está tudo bem, Sabrina?', 'Você parece pálida.', 'Venha deitar se a cabeça latejar.'],
  });

  // ==================== 6. SECRETARIA (X: -16 to -10, Z: -12 to -6) ====================
  box(woodMat, -13, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('事務室 · SECRETARIA', -13, 3.1, -5.75, 2.2, 0.38, 0);

  npcs.push({
    id: 'secretary_michiko',
    name: 'Michiko Watanabe (Secretária)',
    role: 'Secretária',
    x: -12,
    z: -3.5,
    dialogueNodeId: 'secretary_michiko',
    lines: ['Sabrina... sua avó Chiyo ligou hoje?', 'Achei ter ouvido a voz dela na linha externa.'],
  });

  // ==================== 7. LABORATÓRIO DE INFORMÁTICA (X: -24 to -18, Z: -12 to -6) ====================
  box(woodMat, -21, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('情報教室 · INFORMÁTICA', -21, 3.1, -5.75, 2.4, 0.38, 0);

  // PC Terminal with Sync Error
  box(woodDark, -19.5, 0.75, -8.5, 2.0, 0.1, 1.0, true);
  box(metalMat, -19.5, 1.05, -8.7, 0.5, 0.4, 0.08, false);
  box(new THREE.MeshBasicMaterial({ color: 0x0a1628 }), -19.5, 1.05, -8.65, 0.46, 0.34, 0.01, false);

  spots.push({
    id: 'pc_glitch_spot',
    name: 'Terminal 04 (ERRO DE SINCRONIZAÇÃO)',
    type: 'INSPECIONAR',
    x: -19.5,
    z: -7.5,
    dialogueNodeId: 'pc_sync_glitch',
  });

  // ==================== 8. SALA DE ARTES & MÚSICA (X: 10 to 16, Z: -12 to -6) ====================
  box(woodMat, 13, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('美術・音楽 · ARTES & MÚSICA', 13, 3.1, -5.75, 2.8, 0.38, 0);

  // Easel & Canvases in Art area
  box(woodDark, 11.5, 1.2, -8.5, 0.8, 1.6, 0.6, true);
  box(new THREE.MeshBasicMaterial({ color: 0xdedede }), 11.5, 1.3, -8.2, 0.7, 0.9, 0.02, false);

  npcs.push({
    id: 'art_hana',
    name: 'Hana Fujimoto (Clube de Arte)',
    role: 'Estudante',
    x: 12.2,
    z: -7.2,
    dialogueNodeId: 'art_hana',
    lines: ['Sabrina! Posso desenhar você?', 'Fica paradinha com essa cara séria!'],
  });

  // Piano in Music area
  box(new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }), 15, 0.9, -9.5, 2.2, 1.1, 1.4, true);

  spots.push({
    id: 'piano_spot',
    name: 'Piano de cauda da sala de música',
    type: 'EXAMINAR',
    x: 14.8,
    z: -8.0,
    dialogueNodeId: 'music_room_piano',
  });

  // ==================== 9. SALA 2-B (SABRINA'S CLASSROOM) (X: 18 to 26, Z: -12 to -6) ====================
  box(woodMat, 22, 1.4, -5.9, 1.8, 2.8, 0.15, false);
  sign('2-B · SALA DE AULA', 22, 3.1, -5.75, 2.2, 0.38, 0);

  // Classroom Shell
  box(wallMat, 17.5, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, 26.5, 2.1, -9, 0.2, 4.2, 6, true);
  box(wallMat, 22, 2.1, -12, 9.2, 4.2, 0.2, true);
  box(floorMat, 22, -0.05, -9, 9, 0.1, 6, false);

  // Blackboard & Teacher Podium
  box(boardMat, 22, 2.4, -11.85, 6.5, 1.8, 0.1, false);
  box(woodDark, 22, 0.8, -10.5, 2.0, 0.1, 0.9, true);

  // Student Desks in Rows
  const deskPositions: [number, number][] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const dx = 19.5 + col * 2.4;
      const dz = -9.8 + row * 1.5;
      deskPositions.push([dx, dz]);
      box(woodMat, dx, 0.74, dz, 1.1, 0.08, 0.65, true);
      box(metalMat, dx - 0.4, 0.37, dz - 0.22, 0.06, 0.72, 0.06, false);
      box(metalMat, dx + 0.4, 0.37, dz - 0.22, 0.06, 0.72, 0.06, false);
    }
  }

  // Sabrina's Desk (front row, next to window!)
  const deskAt: [number, number] = [deskPositions[0][0], deskPositions[0][1] + 0.8];
  sign('SHINOHARA', deskPositions[0][0], 0.82, deskPositions[0][1] - 0.34, 0.62, 0.16, Math.PI);

  // Floor target ring on Sabrina's seat
  const seatRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.5, 28),
    new THREE.MeshBasicMaterial({ color: 0x4f9be8, transparent: true, opacity: 0.85 }),
  );
  seatRing.rotation.x = -Math.PI / 2;
  seatRing.position.set(deskAt[0], 0.03, deskAt[1]);
  root.add(seatRing);
  anims.push((t) => {
    const s = 1 + Math.sin(t * 2.8) * 0.1;
    seatRing.scale.set(s, s, 1);
  });

  spots.push({
    id: 'sabrina_desk_seat',
    name: 'Sua carteira (2-B)',
    type: 'EXAMINAR',
    x: deskAt[0],
    z: deskAt[1],
  });

  // Classmates in 2-B
  npcs.push({
    id: 'emi_classmate',
    name: 'Emi Takahashi',
    role: 'Colega de classe',
    x: deskPositions[1][0],
    z: deskPositions[1][1] + 0.9,
    dialogueNodeId: 'emi_corridor_chat',
    lines: ['Você viu que a prova de Química mudou?', 'Trinta por cento da nota!'],
  });

  npcs.push({
    id: 'ken_classmate',
    name: 'Ken',
    role: 'Colega de classe',
    x: deskPositions[3][0],
    z: deskPositions[3][1] + 0.9,
    dialogueNodeId: 'ken_talk',
    lines: ['Sabrina, posso copiar a quatro de matemática?'],
  });

  npcs.push({
    id: 'mika_classmate',
    name: 'Mika',
    role: 'Colega estudiosa',
    x: deskPositions[5][0],
    z: deskPositions[5][1] + 0.9,
    dialogueNodeId: 'mika_talk',
    lines: ['Sabrina, você estudou para a revisão de Química?'],
  });

  npcs.push({
    id: 'ryo_classmate',
    name: 'Ryo',
    role: 'Colega brincalhão',
    x: deskPositions[7][0],
    z: deskPositions[7][1] + 0.9,
    dialogueNodeId: 'ryo_talk',
    lines: ['Sabrina, você está viva? ...Foi uma piada?'],
  });

  // ==================== 10. PÁTIO INTERNO, SANTUÁRIO & QUADRA (Z: 0 to 6) ====================
  // Sports Court / Field (X: 18 to 25, Z: 1 to 5)
  npcs.push({
    id: 'daichi_soccer',
    name: 'Daichi Mori (Futebol)',
    role: 'Clube de Futebol',
    x: 23,
    z: 2.5,
    dialogueNodeId: 'soccer_daichi',
    lines: ['Sabrina! Você vai assistir ao nosso jogo na sexta?'],
  });

  // School Shinto Shrine in Courtyard (X: -14 to -8, Z: 0 to 4)
  box(gravelMat, -5, 0.01, 3.5, 4.0, 0.02, 3.5, false);
  // Torii Gate
  box(toriiMat, -6.2, 1.4, 2.5, 0.22, 2.8, 0.22, true);
  box(toriiMat, -3.8, 1.4, 2.5, 0.22, 2.8, 0.22, true);
  box(toriiMat, -5.0, 2.8, 2.5, 3.2, 0.26, 0.3, false);
  // Small Shinto Shrine Structure
  box(woodDark, -5.0, 1.2, 4.4, 1.8, 1.6, 1.4, true);
  box(new THREE.MeshStandardMaterial({ color: 0x33251c }), -5.0, 2.1, 4.4, 2.4, 0.25, 1.8, false);

  spots.push({
    id: 'shrine_school_spot',
    name: 'Pequeno santuário xintoísta escolar',
    type: 'EXAMINAR',
    x: -5.0,
    z: 2.8,
    dialogueNodeId: 'shrine_school_talk',
  });

  // Sprite animation loop
  const npcSprites: { sprite: THREE.Sprite; x: number; z: number; phase: number }[] = [];
  npcs.forEach((npc, idx) => {
    const sprite = createSilhouette(false, 1.58);
    sprite.position.set(npc.x, 0, npc.z);
    root.add(sprite);
    npcSprites.push({ sprite, x: npc.x, z: npc.z, phase: idx * 1.1 });
    colliders.push({ x: npc.x, z: npc.z, w: 0.6, d: 0.6 });
  });

  anims.push((t) => {
    npcSprites.forEach((ns) => {
      ns.sprite.position.y = Math.abs(Math.sin(t * 2.2 + ns.phase)) * 0.03;
    });
  });

  const bounds = () => ({ minX: -26.5, maxX: 26.5, minZ: -12.2, maxZ: 6.2 });
  const animate: Anim = (t, dt) => anims.forEach((a) => a(t, dt));

  return {
    group: root,
    colliders,
    npcs,
    spots,
    deskAt,
    bounds,
    animate,
    dispose: () => {
      const sharedGeos = Object.values(geo) as THREE.BufferGeometry[];
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry && !sharedGeos.includes(mesh.geometry)) {
          mesh.geometry.dispose();
        }
      });
      [concrete, wallMat, wainscot, floorMat, floorCorridor, woodMat, woodDark, metalMat, boardMat, glassMat, plantMat, potMat, toriiMat, grassMat, gravelMat].forEach((m) => m.dispose());
      sharedGeos.forEach((g) => g.dispose());
      root.removeFromParent();
    },
  };
};
