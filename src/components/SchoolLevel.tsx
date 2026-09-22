import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';
import { createGabrielaSprite, preloadGabrielaSprite } from '../three/gabrielaSprite';
import { createSilhouette } from '../three/silhouetteSprite';
import { softCircle } from '../three/textures';
import { ExplorationCamera } from '../three/cameraRig';
import { DialogueBox } from './DialogueBox';
import { SCHOOL_NPCS, LESSONS, QUIZZES, gradeFor, type LessonId } from '../data/school';
import type { DialogueNode, DialogueOption } from '../types/game';

type Phase = 'explore' | 'quiz' | 'report' | 'menu';

interface Props {
  paused: boolean;
  cameraMotionEnabled: boolean;
  onDone: (report: string[]) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];

const HIT = (x: number, z: number, cx: number, cz: number, cw: number, cd: number) =>
  Math.abs(x - cx) < cw / 2 + 0.24 && Math.abs(z - cz) < cd / 2 + 0.24;

export const SchoolLevel: React.FC<Props> = ({ paused, cameraMotionEnabled, onDone }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const live = useRef({ paused, cameraMotionEnabled });
  useEffect(() => { live.current = { paused, cameraMotionEnabled }; });

  const [dialogue, setDialogue] = useState<DialogueNode | null>(null);
  const [phase, setPhase] = useState<Phase>('explore');
  const [lesson, setLesson] = useState<LessonId>('biology');
  const [report, setReport] = useState<string[]>([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const interactRef = useRef<(() => void) | null>(null);

  const lastTalk = useRef<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e4dd);
    scene.fog = new THREE.FogExp2(0xe8e4dd, 0.02);
    scene.add(new THREE.HemisphereLight(0xfff8ea, 0x706558, 1.35));
    const sun = new THREE.DirectionalLight(0xfff3de, 0.8);
    sun.position.set(-4, 10, 8);
    scene.add(sun);
    for (let x = -18; x <= 18; x += 6) {
      const l = new THREE.PointLight(0xffe9c4, 0.35, 8, 2);
      l.position.set(x, 3.4, 0);
      scene.add(l);
    }

    // Shared geometry
    const BOX = new THREE.BoxGeometry(1, 1, 1);
    const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    const PLN = new THREE.PlaneGeometry(1, 1);
    const M = {
      wall: new THREE.MeshStandardMaterial({ color: 0xded8c8, roughness: 0.92 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x9c8b73, roughness: 0.82 }),
      runner: new THREE.MeshStandardMaterial({ color: 0x6e6354, roughness: 0.85 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xefeade, roughness: 1 }),
      wainscot: new THREE.MeshStandardMaterial({ color: 0x4f6153, roughness: 0.85 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8f6b45, roughness: 0.6 }),
      woodD: new THREE.MeshStandardMaterial({ color: 0x5b4026, roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.3, metalness: 0.6 }),
      board: new THREE.MeshStandardMaterial({ color: 0x203a2c, roughness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xc4dcea, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.45 }),
      paper: new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.9 }),
      plant: new THREE.MeshStandardMaterial({ color: 0x40603c, roughness: 0.9 }),
      pot: new THREE.MeshStandardMaterial({ color: 0x7c3a31, roughness: 0.8 }),
      torii: new THREE.MeshStandardMaterial({ color: 0x9c2a22, roughness: 0.7 }),
      grass: new THREE.MeshStandardMaterial({ color: 0x4a6345, roughness: 0.9 }),
      gravel: new THREE.MeshStandardMaterial({ color: 0x7a7974, roughness: 0.9 }),
      lit: new THREE.MeshStandardMaterial({ color: 0xfff2cf, emissive: 0xffdca0, emissiveIntensity: 0.9 }),
    };

    const geo = new THREE.Group();
    scene.add(geo);
    const colliders: { x: number; z: number; w: number; d: number }[] = [];
    const put = (mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, collide = true) => {
      const m = new THREE.Mesh(BOX, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      geo.add(m);
      if (collide) colliders.push({ x, z, w: sx, d: sz });
      return m;
    };
    const sign = (text: string, x: number, y: number, z: number, w: number, h: number, ry = 0) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#26221c';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#c9a44a';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#e6dfc8';
      ctx.font = 'bold 44px "Shippori Mincho", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(PLN, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
      m.position.set(x, y, z);
      m.scale.set(w, h, 1);
      m.rotation.y = ry;
      geo.add(m);
      return m;
    };

    // ============ ESTRUTURA DA ESCOLA (corredor x:-20..20, z:-6..6) ============
    // Piso e teto
    put(M.floor, 0, -0.05, 0, 40, 0.1, 12, false);
    put(M.runner, 0, 0.01, 0, 40, 0.02, 6, false);
    put(M.ceiling, 0, 4.2, 0, 40, 0.2, 12, false);

    // Parede sul (janelas grandes)
    put(M.wall, 0, 2.1, 5.9, 40, 4.2, 0.2);
    put(M.wainscot, 0, 0.7, 5.78, 40, 1.4, 0.06, false);
    for (let i = 0; i < 12; i++) {
      put(M.glass, -18 + i * 3.2, 2.3, 5.74, 2.4, 1.9, 0.06, false);
    }

    // Parede norte (armários e entradas de salas)
    put(M.wall, 0, 2.1, -5.9, 40, 4.2, 0.2);
    put(M.wainscot, 0, 0.7, -5.78, 40, 1.4, 0.06, false);
    for (let i = 0; i < 24; i++) {
      const x = -18.5 + i * 1.6;
      const cm = new THREE.MeshStandardMaterial({
        color: [0x4d6a82, 0x5d6b78, 0x556350, 0x6d5b48][i % 4],
        roughness: 0.45,
        metalness: 0.3,
      });
      put(cm, x, 1.05, -5.6, 1.5, 2.1, 0.5);
    }

    // Pontas do corredor
    put(M.wall, -20, 2.1, 0, 0.2, 4.2, 12);
    put(M.wall, 20, 2.1, 0, 0.2, 4.2, 12);

    // ========== ENTRADA (lado oeste) ==========
    sign('京都市立東山高等学校', -19.9, 3.2, 0, 3.0, 0.5, Math.PI / 2);
    put(M.glass, -19.8, 1.6, 0, 0.05, 3.2, 3.5, false);
    // Getabako (sapateiras)
    put(M.woodD, -17, 0.85, 3.5, 3.2, 1.7, 0.7);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      put(M.wood, -18.1 + c * 0.7, 0.32 + r * 0.5, 3.5, 0.62, 0.4, 0.72, false);
    }

    // ========== MURAL + FOTO + RELÓGIO (parede sul) ==========
    put(M.woodD, -12, 2.0, 5.7, 3.2, 1.9, 0.08, false);
    put(M.paper, -12.7, 2.1, 5.65, 1.0, 1.3, 0.02, false);
    put(M.paper, -11.4, 1.85, 5.65, 1.2, 0.9, 0.02, false);
    // Foto antiga
    put(M.woodD, -9, 2.1, 5.7, 1.5, 1.1, 0.08, false);
    put(M.board, -9, 2.1, 5.65, 1.2, 0.8, 0.02, false);
    // Relógio
    put(M.woodD, -6, 3.0, 5.7, 0.85, 0.85, 0.1, false);
    const clockTex = (() => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#f0ece2';
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a2620';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(70, 100); ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(180, 128); ctx.stroke();
      ctx.beginPath(); ctx.arc(128, 128, 4, 0, Math.PI * 2); ctx.fillStyle = '#2a2620'; ctx.fill();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const clockFace = new THREE.Mesh(PLN, new THREE.MeshBasicMaterial({ map: clockTex }));
    clockFace.position.set(-6, 3.0, 5.63);
    clockFace.scale.set(0.7, 0.7, 1);
    clockFace.rotation.y = Math.PI;
    geo.add(clockFace);
    sign('10:17', -6, 3.4, 5.65, 0.5, 0.15, Math.PI);

    // Máquina de bebidas
    put(M.metal, -3, 1.2, 5.5, 1.3, 2.3, 0.8);
    put(new THREE.MeshStandardMaterial({ color: 0x2d68a8, emissive: 0x143d6b, emissiveIntensity: 0.5 }), -3, 1.4, 5.08, 1.1, 1.3, 0.06, false);

    // ========== ÁREA DA BIBLIOTECA (x -11..-5, z -6..-3) ==========
    put(M.woodD, -8, 1.6, -5.5, 5.5, 3.2, 0.5);
    for (let i = 0; i < 4; i++) put(M.wood, -10 + i * 1.2, 1.0, -4.9, 1.0, 1.8, 0.4, true);
    put(M.wood, -8, 0.75, -3.8, 2.2, 0.1, 1.0);
    sign('図書室 · BIBLIOTECA', -8, 3.2, -2.8, 2.4, 0.32);

    // ========== ENFERMARIA (x -5..-3) ==========
    put(M.paper, -4, 0.45, -5, 1.4, 0.7, 2.2);
    put(M.wall, -2.8, 1.8, -5, 0.05, 3.0, 2.5, false);
    sign('保健室 · ENFERMARIA', -4, 3.2, -2.8, 2.4, 0.32);

    // ========== SECRETARIA (x -2..1) ==========
    put(M.woodD, -0.5, 0.85, -5.4, 2.4, 1.7, 0.6);
    put(M.metal, -0.5, 1.3, -5.1, 0.4, 0.3, 0.2, false);
    sign('事務室 · SECRETARIA', -0.5, 3.2, -2.8, 2.2, 0.32);

    // ========== LABORATÓRIO DE INFORMÁTICA (x 2..5) ==========
    for (let i = 0; i < 4; i++) {
      put(M.wood, 2.2 + i * 0.8, 0.75, -5.4, 0.7, 0.08, 0.5, true);
      put(M.metal, 2.2 + i * 0.8, 1.0, -5.5, 0.35, 0.28, 0.05, false);
      put(M.board, 2.2 + i * 0.8, 1.0, -5.47, 0.3, 0.22, 0.01, false);
    }
    sign('情報教室 · INFORMÁTICA', 3.5, 3.2, -2.8, 2.4, 0.32);

    // ========== SALA DE ARTES & MÚSICA (x 6..9) ==========
    put(M.woodD, 7.5, 1.2, -5.4, 1.2, 1.6, 0.6);
    put(M.paper, 7.5, 1.3, -5.1, 0.7, 0.9, 0.02, false);
    put(M.woodD, 8.8, 0.9, -5.2, 1.8, 1.1, 1.2);
    sign('美術・音楽 · ARTES & MÚSICA', 7.5, 3.2, -2.8, 2.8, 0.32);

    // ========== SALA 2-B (x 11..19, z -6..-3) ==========
    put(M.wood, 15, 1.4, -2.9, 1.8, 2.8, 0.15, false);
    sign('2-B · SALA DE AULA', 15, 3.2, -2.8, 2.2, 0.32);
    put(M.wall, 11, 2.1, -4.5, 0.2, 4.2, 3.5, true);
    put(M.wall, 19, 2.1, -4.5, 0.2, 4.2, 3.5, true);
    put(M.wall, 15, 2.1, -6.2, 8.2, 4.2, 0.2, true);
    put(M.floor, 15, -0.05, -4.5, 8, 0.1, 3.5, false);
    put(M.board, 15, 2.5, -6.05, 6.0, 1.8, 0.1, false);
    put(M.woodD, 15, 0.8, -5.3, 2.0, 0.1, 0.9);
    // Carteiras
    const desks: [number, number][] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const dx = 12.5 + c * 2.2;
        const dz = -5.4 + r * 1.4;
        desks.push([dx, dz]);
        put(M.wood, dx, 0.74, dz, 1.1, 0.08, 0.65);
        put(M.metal, dx - 0.4, 0.37, dz - 0.2, 0.06, 0.7, 0.06, false);
        put(M.metal, dx + 0.4, 0.37, dz - 0.2, 0.06, 0.7, 0.06, false);
      }
    }
    // Carteira de Sabrina: fileira mais próxima da janela, perto do canto
    const deskAt: [number, number] = [desks[6][0], desks[6][1] + 0.8];
    sign('SHINOHARA', desks[6][0], 0.82, desks[6][1] - 0.32, 0.6, 0.14, Math.PI);
    put(new THREE.MeshStandardMaterial({ color: 0x2b3a52, roughness: 0.8 }), desks[6][0], 0.8, desks[6][1], 0.5, 0.05, 0.35, false);
    // Marco luminoso da carteira
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.55, 28),
      new THREE.MeshBasicMaterial({ color: 0x4f9be8, transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(deskAt[0], 0.03, deskAt[1]);
    geo.add(ring);

    // ========== ÁREA DE SAÍDA (porta oeste) ==========
    put(M.wood, -19.5, 1.4, 0, 0.15, 2.8, 3.0, false);
    sign('SAÍDA · EXIT', -19.3, 3.0, 0, 0.6, 0.18, Math.PI / 2);

    // ========== PÁTIO & SANTUÁRIO (z 3..5) ==========
    put(M.grass, -10, 0.0, 4.5, 3.0, 0.05, 2.5, false);
    put(M.gravel, -8, 0.0, 4.5, 2.0, 0.05, 2.0, false);
    put(M.torii, -8.5, 1.2, 3.8, 0.15, 2.4, 0.15, true);
    put(M.torii, -7.5, 1.2, 3.8, 0.15, 2.4, 0.15, true);
    put(M.torii, -8, 2.5, 3.8, 1.6, 0.2, 0.25, false);
    put(M.woodD, -8, 1.0, 5.0, 1.4, 1.3, 1.2, true);
    put(M.woodD, -8, 1.7, 5.0, 1.8, 0.2, 1.5, false);
    // Bancos do pátio
    put(M.wood, 0, 0.5, 4.5, 1.8, 0.1, 0.5, true);
    put(M.wood, 4, 0.5, 4.5, 1.8, 0.1, 0.5, true);
    // Plantas
    for (const [px, pz] of [[-3, 4.5], [1.5, 4.5], [6, 4.5]] as [number, number][]) {
      const pot = new THREE.Mesh(CYL, M.pot);
      pot.position.set(px, 0.3, pz);
      pot.scale.set(0.6, 0.6, 0.6);
      geo.add(pot);
      const leaves = new THREE.Mesh(BOX, M.plant);
      leaves.position.set(px, 1.0, pz);
      leaves.scale.set(0.7, 1.2, 0.7);
      geo.add(leaves);
    }
    // Máquina de bebidas do pátio
    put(M.metal, 6, 1.2, 4.5, 1.3, 2.3, 0.8);
    put(new THREE.MeshStandardMaterial({ color: 0x2d68a8, emissive: 0x143d6b, emissiveIntensity: 0.5 }), 6, 1.4, 4.08, 1.1, 1.3, 0.06, false);
    // Arquibancada
    put(M.wood, 12, 0.3, 4.5, 3.0, 0.5, 1.0, true);
    put(M.wood, 12, 0.8, 5.5, 3.0, 0.5, 1.0, true);

    // Arquivos restritos (canto oeste do pátio)
    put(M.woodD, -13, 1.2, 4.5, 2.0, 2.4, 0.5);
    sign('ARQUIVO · ACESSO RESTRITO', -13, 2.5, 4.3, 1.2, 0.2, Math.PI);

    // ============ NPCs ============
    const npcSprites: { s: THREE.Sprite; npc: SchoolNpc; x: number; z: number; ph: number }[] = [];
    SCHOOL_NPCS.forEach((npc, i) => {
      const s = createSilhouette(false, 1.6);
      s.position.set(npc.x, 0, npc.z);
      geo.add(s);
      colliders.push({ x: npc.x, z: npc.z, w: 0.6, d: 0.6 });
      npcSprites.push({ s, npc, x: npc.x, z: npc.z, ph: i * 1.2 });
    });

    // Balões de fala (renderizados em sprites e só perto)
    const bubbleTex = (text: string) => {
      const c = document.createElement('canvas');
      c.width = 420;
      c.height = 140;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(252,250,244,0.97)';
      ctx.strokeStyle = 'rgba(18,20,24,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 8);
      ctx.arcTo(412, 8, 412, 88, 14);
      ctx.lineTo(412, 88);
      ctx.lineTo(130, 88);
      ctx.lineTo(100, 118);
      ctx.lineTo(98, 88);
      ctx.arcTo(8, 88, 8, 8, 14);
      ctx.arcTo(8, 8, 30, 8, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1c1f24';
      ctx.font = '600 17px "Shippori Mincho", serif';
      const words = text.split(' ');
      const lines: string[] = [];
      let cur = '';
      words.forEach((w) => {
        const test = `${cur} ${w}`.trim();
        if (ctx.measureText(test).width > 330 && cur) { lines.push(cur); cur = w; } else cur = test;
      });
      if (cur) lines.push(cur);
      lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 22, 36 + i * 22));
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const bubbles = npcSprites.map((n) => {
      const mat = new THREE.SpriteMaterial({ map: bubbleTex(n.npc.bubble), transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(mat);
      s.scale.set(3.2, 1.05, 1);
      geo.add(s);
      return s;
    });

    // ============ PLAYER ============
    const pos = new THREE.Vector3(-17, 0, 0);
    const cam = new THREE.PerspectiveCamera(45, Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight), 0.1, 100);
    const rig = new ExplorationCamera(cam, pos, 0, { height: 7.0, distance: 10.5, look: 0.7 });

    let disposed = false;
    let character: ReturnType<typeof createGabrielaSprite> | null = null;
    preloadGabrielaSprite().then((tex) => {
      if (disposed) return;
      const spr = createGabrielaSprite(tex);
      spr.sprite.position.set(pos.x, 0, pos.z);
      geo.add(spr.sprite);
      character = spr;
    });

    const shadowTex = softCircle('rgba(0,0,0,.5)');
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.35, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(pos.x, 0.035, pos.z);
    geo.add(shadow);

    // ============ INTERAÇÕES ============
  const handleInteract = () => {
    if (live.current.paused) return;
      let bestIdx = -1;
      let bd = 1.7;
      npcSprites.forEach((n, i) => {
        const d = Math.hypot(n.x - pos.x, n.z - pos.z);
        if (d < bd) { bd = d; bestIdx = i; }
      });
      if (bestIdx >= 0) {
        const npc = SCHOOL_NPCS[bestIdx];
        soundManager.playClockTick();
        lastTalk.current = npc.id;
        const first = npc.talk[0];
        const talkNode: DialogueNode = { id: first.id, speaker: npc.speaker, speakerTitle: first.speakerTitle, avatar: npc.portrait, text: first.text, next: first.next, gabrielaAnalysis: first.analysis };
        setDialogue(talkNode);
        return;
      }
      // desk
      const dDesk = Math.hypot(pos.x - deskAt[0], pos.z - deskAt[1]);
      if (dDesk < 1.2) {
        soundManager.playClueDiscovered();
        setQuestionIdx(0);
        setScore(0);
        setPicked(null);
        setPhase('quiz');
        return;
      }
      // saída
      if (pos.x < -18.5 && Math.abs(pos.z) < 1.6 && phase !== 'explore') {
        setExitOpen(true);
      }
    };
    interactRef.current = handleInteract;

    const keys: Record<string, boolean> = {};
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input,textarea,select,[contenteditable]')) return;
      if (e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (k === 'e') {
        e.preventDefault();
        if (!e.repeat) handleInteract();
        return;
      }
      if (k.startsWith('arrow')) e.preventDefault();
      keys[k] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    const onBlur = () => Object.keys(keys).forEach((k) => (keys[k] = false));
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // ============ LOOP ============
    const clock = new THREE.Timer();
    clock.connect(document);
    let raf = 0;
    let stepTimer = 0;
    let facing: 'up' | 'down' | 'left' | 'right' = 'right';
    let frame = 0;
    let frameT = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsed();
      if (document.hidden) return;

      // Animação dos NPCs
      npcSprites.forEach((n, i) => {
        n.x = n.npc.x + Math.sin(t * 0.2 + n.ph) * 0.8;
        n.z = n.npc.z + Math.cos(t * 0.15 + n.ph) * 0.4;
        n.s.position.set(n.x, Math.abs(Math.sin(t * 2 + i)) * 0.03, n.z);
        const b = bubbles[i];
        b.position.set(n.x, 2.5 + Math.sin(t * 1.2 + i) * 0.05, n.z);
        const d = Math.hypot(n.x - pos.x, n.z - pos.z);
        const target = d < 3.5 ? 1 : d < 5.5 ? 0.3 : 0;
        (b.material as THREE.SpriteMaterial).opacity += (target - (b.material as THREE.SpriteMaterial).opacity) * 0.1;
      });
      // Marca da carteira
      const rs = 1 + Math.sin(t * 2.5) * 0.1;
      ring.scale.set(rs, rs, 1);

      const locked = live.current.paused;
      let dx = 0;
      let dz = 0;
      if (!locked) {
        const sp = 3.2 * dt;
        if (keys.w || keys.arrowup) dz -= sp;
        if (keys.s || keys.arrowdown) dz += sp;
        if (keys.a || keys.arrowleft) dx -= sp;
        if (keys.d || keys.arrowright) dx += sp;
      }
      if (dx && dz) { dx *= 0.7071; dz *= 0.7071; }
      const nx = THREE.MathUtils.clamp(pos.x + dx, -19.3, 19.3);
      if (!colliders.some((c) => HIT(nx, pos.z, c.x, c.z, c.w, c.d))) pos.x = nx;
      const nz = THREE.MathUtils.clamp(pos.z + dz, -5.6, 5.4);
      if (!colliders.some((c) => HIT(pos.x, nz, c.x, c.z, c.w, c.d))) pos.z = nz;

      const vx = dx / Math.max(dt, 0.001);
      const vz = dz / Math.max(dt, 0.001);
      const moving = Math.hypot(vx, vz) > 0.02;
      if (moving) {
        facing = Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? 'right' : 'left') : vz > 0 ? 'down' : 'up';
        frameT += dt;
        if (frameT > 0.13) { frameT = 0; frame = (frame + 1) % 4; }
        stepTimer += dt;
        if (stepTimer > 0.34) { stepTimer = 0; soundManager.playFootstep('wood'); }
      } else frame = 0;
      character?.setFrame(facing, frame, moving);
      character?.sprite.position.set(pos.x, 0, pos.z);
      shadow.position.set(pos.x, 0.035, pos.z);

      rig.update(pos, vx, vz, dt, t, 0, live.current.cameraMotionEnabled, locked);

      // Atualiza o prompt de interação
      const el = promptRef.current;
      if (el) {
        let label = '';
        let bestD = 1.7;
        npcSprites.forEach((n) => {
          const d = Math.hypot(n.x - pos.x, n.z - pos.z);
          if (d < bestD) { bestD = d; label = `Conversar com ${n.npc.name}`; }
        });
        const dDesk = Math.hypot(pos.x - deskAt[0], pos.z - deskAt[1]);
        if (dDesk < 1.2) label = `Sentar e estudar — ${LESSONS.find((l) => l.id === lesson)?.name ?? ''}`;
        if (pos.x < -18.5 && Math.abs(pos.z) < 1.6 && phase !== 'explore') label = 'Sair da escola';
        el.style.visibility = label && !locked ? 'visible' : 'hidden';
        el.textContent = label;
      }

      renderer.render(scene, cam);
    };
    loop();

    const onResize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clock.dispose();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      character?.dispose();
      shadowTex.dispose();
      (shadow.material as THREE.Material).dispose();
      shadow.geometry.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [lesson, phase]);

  // --- Diálogo handling ---
  const advanceNode = (nextId: string | null) => {
    if (nextId) {
      const npc = SCHOOL_NPCS.find((n) => n.talk.some((t) => t.id === nextId));
      const nextTalk = npc?.talk.find((t) => t.id === nextId);
      if (nextTalk && npc) {
        setDialogue({ id: nextTalk.id, speaker: npc.speaker, speakerTitle: nextTalk.speakerTitle, avatar: npc.portrait, text: nextTalk.text, next: nextTalk.next, gabrielaAnalysis: nextTalk.analysis });
        return;
      }
    }
    setDialogue(null);
  };

  const handleOption = (opt: DialogueOption) => advanceNode(opt.nextNodeId);

  // --- Quiz ---
  const questions = QUIZZES[lesson];
  const q = questions[questionIdx];
  const quizDone = questionIdx >= questions.length;
  const grade = quizDone ? gradeFor(score, questions.length) : null;

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />

      {/* Prompt de interação */}
      <div ref={promptRef} className="absolute left-1/2 top-[36%] -translate-x-1/2 z-30 bg-white/95 text-[#111] font-serif-jp text-sm px-5 py-2 rounded-full shadow-2xl border-2 border-neutral-900 pointer-events-none" style={{ visibility: 'hidden' }} />

      {/* Painel de aulas (esquerda) */}
      <div className="absolute top-5 left-5 z-20 w-56 space-y-1.5">
        <div className="text-[10px] tracking-[0.35em] text-neutral-300/80 font-serif-jp uppercase mb-2">AULAS DE HOJE</div>
        {LESSONS.map((l, i) => {
          const done = report[i];
          const active = lesson === l.id && !done;
          return (
            <div key={l.id} className={`px-3 py-2 rounded border text-xs font-serif-jp backdrop-blur ${active ? 'bg-white/95 text-black border-white' : 'bg-black/45 text-neutral-200 border-neutral-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold">{i + 1}. {l.name}</span>
                {done && <span className="text-emerald-300 font-bold">{done}</span>}
              </div>
              <div className="opacity-70 text-[10px] mt-0.5">{l.time} · {l.room}</div>
            </div>
          );
        })}
      </div>

      {/* Diálogo */}
      {dialogue && (
        <DialogueBox
          node={dialogue}
          onSelectOption={handleOption}
          onNext={() => advanceNode(dialogue.next ?? null)}
          onClose={() => advanceNode(null)}
        />
      )}

      {/* Quiz */}
      {!dialogue && phase === 'quiz' && !quizDone && q && (
        <div className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-[#0e1116] border border-neutral-700 p-8 rounded">
            <div className="text-[10px] tracking-[0.35em] text-neutral-400 uppercase font-serif-jp">
              {LESSONS.find((l) => l.id === lesson)?.name} · Pergunta {questionIdx + 1}/{questions.length}
            </div>
            <h3 className="font-serif-jp text-lg text-neutral-100 mt-3 mb-5">{q.q}</h3>
            <div className="grid gap-2">
              {q.a.map((ans, i) => {
                const answered = picked !== null;
                const isRight = i === q.correct;
                const cls =
                  answered
                    ? isRight
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : i === picked
                        ? 'border-red-500 bg-red-500/10 text-red-200'
                        : 'border-neutral-800 text-neutral-500'
                    : 'border-neutral-700 hover:border-white hover:bg-white/5';
                return (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => {
                      setPicked(i);
                      if (i === q.correct) { setScore((s) => s + 1); soundManager.playClueDiscovered(); }
                      else soundManager.playAnomalySting();
                    }}
                    className={`text-left border px-4 py-3 text-sm font-serif-jp flex items-center gap-3 transition-colors ${cls}`}
                  >
                    <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${answered && isRight ? 'bg-emerald-500 text-black' : answered && i === picked ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1">{ans}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-5 border-t border-neutral-800 pt-4 flex items-center justify-between gap-3">
                <span className={`font-serif-jp text-sm ${picked === q.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                  {picked === q.correct ? '✓ Correto.' : `Resposta correta: ${LETTERS[q.correct]}`}
                </span>
                <button
                  onClick={() => { setPicked(null); setQuestionIdx((i) => i + 1); soundManager.playClockTick(); }}
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-100 px-5 py-2 font-serif-jp text-xs tracking-widest rounded"
                >
                  {questionIdx + 1 < questions.length ? 'Próxima pergunta →' : 'Finalizar aula →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boletim */}
      {!dialogue && phase === 'quiz' && quizDone && grade && (
        <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6">
          <div className="text-center max-w-md font-serif-jp">
            <p className="text-[10px] tracking-[0.35em] text-neutral-500 uppercase">Boletim — {LESSONS.find((l) => l.id === lesson)?.name}</p>
            <p className={`text-8xl font-title mt-4 ${grade === 'A+' || grade === 'A' ? 'text-emerald-200' : grade === 'A-' || grade === 'B' ? 'text-sky-200' : grade === 'C' || grade === 'D' ? 'text-amber-200' : 'text-red-300'}`}>
              {grade}
            </p>
            <p className="text-neutral-300 text-sm mt-2">{score}/{questions.length} acertos</p>
            <p className="mt-5 text-neutral-400 italic leading-relaxed">
              {grade === 'A+' ? 'Perfeito. Ainda assim, não consigo sentir alívio.' :
                grade === 'A' ? 'Quase. Um erro é suficiente para eu repetir a matéria na cabeça.' :
                grade === 'A-' ? 'Aceitável. Não é como eu queria começar o dia.' :
                grade === 'B' ? 'Bom. Mas as vozes no corredor não vão esquecer que alguém passou de mim.' :
                grade === 'C' ? 'Mediano. Isso não combina com o que eu espero de mim.' :
                grade === 'D' ? 'Eu sabia a resposta. Por que hesitei?' :
                'Não fui eu. Ou fui? Não reconheço essa prova.'}
            </p>
            <button
              onClick={() => {
                const newReport = [...report];
                newReport[LESSONS.findIndex((l) => l.id === lesson)] = grade;
                setReport(newReport);
                const idx = LESSONS.findIndex((l) => l.id === lesson);
                if (idx < LESSONS.length - 1) {
                  setLesson(LESSONS[idx + 1].id);
                  setQuestionIdx(0);
                  setScore(0);
                  setPicked(null);
                  setPhase('explore');
                  setDialogue({
                    id: `interval_${idx}`,
                    speaker: 'Desconhecido',
                    speakerTitle: 'Emi Takahashi',
                    avatar: 'emi',
                    text: `Aula de ${LESSONS[idx + 1].name} é logo ali. Anda!`,
                  });
                } else {
                  setPhase('explore');
                  setDialogue({
                    id: 'school_end',
                    speaker: 'Pensamento',
                    avatar: 'gabriela_calm',
                    text: '16:32. A escola está esvaziando. Só os meus passos ecoam no corredor... Hora de voltar para casa.',
                  });
                  setExitOpen(true);
                }
                soundManager.playClueDiscovered();
              }}
              className="mt-6 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-100 px-6 py-3 font-serif-jp text-xs tracking-widest rounded"
            >
              {lesson === 'physics' ? 'Encerrar o dia escolar →' : 'Continuar o dia →'}
            </button>
          </div>
        </div>
      )}

      {/* Sair da escola */}
      {exitOpen && !dialogue && (
        <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6">
          <div className="text-center max-w-md font-serif-jp">
            <p className="text-[10px] tracking-[0.35em] text-neutral-500 uppercase">Saída da escola</p>
            <h3 className="text-2xl font-title text-neutral-100 mt-3">FIM DO PERÍODO ESCOLAR</h3>
            <div className="mt-6 space-y-1.5 text-left">
              {LESSONS.map((l, i) => (
                <div key={l.id} className="flex justify-between border-b border-neutral-800 pb-1.5 text-xs">
                  <span className="text-neutral-300">{l.name}</span>
                  <span className="text-emerald-300 font-bold">{report[i] ?? '-'}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onDone(report)}
              className="mt-6 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-100 px-6 py-3 font-serif-jp text-xs tracking-widest rounded"
            >
              Pegar a mochila e voltar para casa →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
