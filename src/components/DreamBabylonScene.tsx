import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArcRotateCamera, Color3, Color4, DirectionalLight, DynamicTexture, Engine, Matrix,
  HemisphericLight, Mesh, MeshBuilder, PointLight, Scene, StandardMaterial,
  TransformNode, Vector3,
} from '@babylonjs/core';
import { DialogueBox } from './DialogueBox';
import { DialogueNode, DialogueOption } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface Props { onComplete: () => void; initialPhase?: 'dialogue' | 'playing' | 'boss' }
type Phase = 'dialogue' | 'transition' | 'playing' | 'boss' | 'failed' | 'complete';
type Facing = 'down' | 'up' | 'left' | 'right';
type Cue = { x: number; y: number; id: number; duration: number; markerIndex: number };
type AttackStage = 'warning' | 'impact' | 'recovery';
type BossPattern = {
  phase: 0 | 1 | 2 | 3 | 4;
  lane: number;
  paths: { x: number; z: number }[][];
  pools: { x: number; z: number }[];
  startedAt: number;
  warningMs: number;
  impactMs: number;
  recoveryMs: number;
};
type DreamState = {
  round: number; hits: number; misses: number; sanity: number; cue: Cue | null; phase: Phase;
  bossHits: number; darkness: number; bossStep: number;
  bossPattern: BossPattern | null; bossAttackStage: AttackStage;
};

const TOTAL_CUES = 8;
const BOSS_PHASES = 5;
const ATTACKS_PER_PHASE = 5;
const BOSS_ATTACKS = BOSS_PHASES * ATTACKS_PER_PHASE;
const SPRITE_PATH = '/images/gabriela_sheet.png';
const SHADOW_DIALOGUE = [
  { question: 'Você realmente acha que está tudo bem?', choices: [['Quero entender o que está acontecendo.', 'Entender tudo não apaga o que você sente.'], ['Estou cansada. Só isso.', 'Você sempre encontra um nome simples para coisas difíceis.'], ['Não fale como se me conhecesse.', 'Eu conheço o que você tenta esconder.']] },
  { question: 'Você sente falta deles?', choices: [['Sim. Do meu pai e da minha mãe.', 'Então por que guarda a saudade como se fosse um segredo?'], ['Às vezes não lembro de tudo.', 'Esquecer detalhes também assusta, não é?'], ['Não quero falar sobre isso.', 'Você não precisa dizer em voz alta para continuar sentindo.']] },
  { question: 'Sua avó percebe quando você finge.', choices: [['Não quero preocupar ela.', 'E quem cuida de você quando decide cuidar de todos?'], ['Ela não precisa saber de tudo.', 'Mesmo assim, ela percebe quando você se afasta.'], ['Cale a boca.', 'Então me faça calar.']] },
] as const;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const facingCell = (direction: Facing, frame: number, moving: boolean) => {
  if (!moving) return direction === 'down' ? 0 : direction === 'up' ? 4 : 9;
  const step = frame % 4;
  if (direction === 'left' || direction === 'right') return [6, 10, 11, 6][step];
  if (direction === 'down') return [0, 1, 0, 2][step];
  if (direction === 'up') return [4, 3, 4, 7][step];
  return 9;
};
const spriteMirror = (direction: Facing, moving: boolean) => moving ? direction === 'left' : direction === 'right';
const smokePathPoint = (path: { x: number; z: number }[], progress: number) => {
  const lengths = path.slice(1).map((point, index) => Math.hypot(point.x - path[index].x, point.z - path[index].z));
  const totalLength = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let remaining = clamp(progress, 0, 1) * totalLength;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const a = path[i]; const b = path[i + 1]; const t = clamp(remaining / (lengths[i] || 1), 0, 1);
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    remaining -= lengths[i];
  }
  return path[path.length - 1];
};

/** The dream sequence: a fractured shrine, a sprite chase, then a telegraphed three-part boss fight. */
export const DreamBabylonScene: React.FC<Props> = ({ onComplete, initialPhase = 'dialogue' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [sanity, setSanity] = useState(100);
  const [cue, setCue] = useState<Cue | null>(null);
  const [zoom, setZoom] = useState(16);
  const [bossHits, setBossHits] = useState(0);
  const [bossStep, setBossStep] = useState(0);
  const [bossPattern, setBossPattern] = useState<BossPattern | null>(null);
  const [bossAttackStage, setBossAttackStage] = useState<AttackStage>('warning');
  const [damageNotice, setDamageNotice] = useState<string | null>(null);
  const [darkness, setDarkness] = useState(initialPhase === 'boss' ? 1 : 0);
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [transitionTarget, setTransitionTarget] = useState<'playing' | 'boss' | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [sceneRevision, setSceneRevision] = useState(0);
  const [shadowReply, setShadowReply] = useState<{ answer: string; response: string; showingResponse: boolean } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const runtimeRef = useRef<DreamState>({ round, hits, misses, sanity, cue, phase, bossHits, darkness, bossStep, bossPattern, bossAttackStage });
  runtimeRef.current = { round, hits, misses, sanity, cue, phase, bossHits, darkness, bossStep, bossPattern, bossAttackStage };
  const heroPositionRef = useRef(new Vector3(0, 0, 2));
  const markScreensRef = useRef<{ x: number; y: number }[]>([]);
  const bossCollisionRef = useRef(false);
  const smokeHitRef = useRef(false);
  const spikesHitRef = useRef(false);
  const bossResultRef = useRef<number | null>(null);
  const lastStrikeRef = useRef(0);
  const resolveRef = useRef<(success: boolean) => void>(() => {});
  const touchKeysRef = useRef<Record<string, boolean>>({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    if (phase !== 'transition' || !transitionTarget) return;
    const timer = window.setTimeout(() => {
      runtimeRef.current.phase = transitionTarget;
      if (transitionTarget === 'boss') setBossStep(0);
      setPhase(transitionTarget);
      setTransitionTarget(null);
    }, 1900);
    return () => window.clearTimeout(timer);
  }, [phase, transitionTarget]);

  useEffect(() => {
    if (phase === 'playing' || phase === 'boss') soundManager.setMusicOverlayFile('/musicas/combate_sono.mp3', 0.48);
    else soundManager.stopMusicOverlay(450);
  }, [phase]);

  useEffect(() => () => soundManager.stopMusicOverlay(180), []);

  const resolveCue = useCallback((success: boolean) => {
    const current = runtimeRef.current;
    if (current.phase !== 'playing' || !current.cue) return;
    const nextRound = current.round + 1;
    const nextHits = current.hits + Number(success);
    const nextMisses = current.misses + Number(!success);
    const nextSanity = clamp(current.sanity - (success ? 0 : 5), 0, 100);
    const nextDarkness = clamp(current.darkness + (success ? -1.35 : 1.15), 0, 8);
    runtimeRef.current = { ...current, round: nextRound, hits: nextHits, misses: nextMisses, sanity: nextSanity, cue: null, darkness: nextDarkness };
    setRound(nextRound); setHits(nextHits); setMisses(nextMisses); setSanity(nextSanity); setCue(null); setDarkness(nextDarkness);
    if (nextSanity <= 0) { runtimeRef.current.phase = 'failed'; setPhase('failed'); }
    else if (nextRound >= TOTAL_CUES) {
      runtimeRef.current.phase = 'transition'; runtimeRef.current.darkness = Math.max(1, nextDarkness);
      setDarkness(Math.max(1, nextDarkness)); setTransitionTarget('boss'); setPhase('transition');
    }
  }, []);
  resolveRef.current = resolveCue;

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      const current = runtimeRef.current;
      if (current.phase !== 'playing') return;
      const nextDarkness = clamp(current.darkness + 0.12, 0, 8);
      runtimeRef.current.darkness = nextDarkness;
      setDarkness(nextDarkness);
    }, 500);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let openTimer = 0; let expireTimer = 0;
    openTimer = window.setTimeout(() => {
      if (runtimeRef.current.phase !== 'playing') return;
      const duration = 700 + Math.random() * 350;
      const markerIndex = runtimeRef.current.round % TOTAL_CUES;
      const point = markScreensRef.current[markerIndex] ?? { x: 50, y: 50 };
      const nextCue = { ...point, markerIndex, id: performance.now(), duration };
      runtimeRef.current.cue = nextCue; setCue(nextCue);
      expireTimer = window.setTimeout(() => resolveRef.current(false), duration);
    }, 700 + Math.random() * 650);
    return () => { window.clearTimeout(openTimer); window.clearTimeout(expireTimer); };
  }, [phase, round]);

  useEffect(() => {
    if (phase !== 'boss') return;
    if (bossStep >= BOSS_ATTACKS) { runtimeRef.current.phase = 'complete'; setPhase('complete'); return; }
    const phaseIndex = Math.floor(bossStep / ATTACKS_PER_PHASE) as BossPattern['phase'];
    const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const lane = [-9, -6, -2, 2, 6, 9][Math.floor(Math.random() * 6)];
    const startX = direction > 0 ? -14 : 14; const endX = -startX;
    const secondLane = clamp(lane + (Math.random() < 0.5 ? -5 : 5), -9, 9);
    const paths = [
      [{ x: startX, z: lane }, { x: endX, z: lane }],
      [{ x: startX, z: secondLane }, { x: endX, z: secondLane }],
      [{ x: startX, z: -9 }, { x: endX, z: 9 }],
      [{ x: startX, z: 9 }, { x: endX, z: -9 }],
    ];
    const poolCount = phaseIndex >= 1 ? 8 : 0;
    const pools = Array.from({ length: poolCount }, () => ({ x: Math.round((Math.random() * 18 - 9) * 10) / 10, z: Math.round((Math.random() * 14 - 7) * 10) / 10 }));
    const warningMs = 1050 + Math.random() * 350;
    const impactMs = phaseIndex >= 3 ? 850 + Math.random() * 250 : 950 + Math.random() * 300;
    const recoveryMs = 250 + Math.random() * 250;
    const pattern: BossPattern = {
      phase: phaseIndex, lane, paths, pools, startedAt: performance.now(), warningMs, impactMs, recoveryMs,
    };
    setDamageNotice(null);
    bossCollisionRef.current = false; smokeHitRef.current = false; spikesHitRef.current = false; bossResultRef.current = null;
    runtimeRef.current.bossPattern = pattern; runtimeRef.current.bossAttackStage = 'warning';
    setBossPattern(pattern); setBossAttackStage('warning');

    const impactTimer = window.setTimeout(() => {
      if (runtimeRef.current.phase !== 'boss') return;
      runtimeRef.current.bossAttackStage = 'impact'; setBossAttackStage('impact');
    }, warningMs);
    const recoveryTimer = window.setTimeout(() => {
      if (runtimeRef.current.phase !== 'boss') return;
      runtimeRef.current.bossAttackStage = 'recovery'; setBossAttackStage('recovery');
      const current = runtimeRef.current;
      if (bossResultRef.current === bossStep) return;
      bossResultRef.current = bossStep;
      const nextMisses = current.misses + Number(bossCollisionRef.current);
      const nextHits = current.bossHits + Number(!bossCollisionRef.current);
      const damage = Number(smokeHitRef.current) * 10 + Number(spikesHitRef.current) * 10;
      const nextSanity = clamp(current.sanity - damage, 0, 100);
      if (damage > 0) {
        const sources = [smokeHitRef.current && 'FUMAÇA', spikesHitRef.current && 'ESPINHOS'].filter(Boolean).join(' + ');
        setDamageNotice(`${sources}  −${damage} SANIDADE`);
      }
      const nextDarkness = clamp(current.darkness + (bossCollisionRef.current ? 1 : -1), 0, 8);
      runtimeRef.current = { ...current, misses: nextMisses, bossHits: nextHits, sanity: nextSanity, darkness: nextDarkness };
      setMisses(nextMisses); setBossHits(nextHits); setSanity(nextSanity); setDarkness(nextDarkness);
      if (nextSanity <= 0) { runtimeRef.current.phase = 'failed'; setPhase('failed'); }
    }, warningMs + impactMs);
    const advanceTimer = window.setTimeout(() => {
      if (runtimeRef.current.phase === 'boss') setBossStep((step) => step + 1);
    }, warningMs + impactMs + recoveryMs + 220);
    return () => { window.clearTimeout(impactTimer); window.clearTimeout(recoveryTimer); window.clearTimeout(advanceTimer); };
  }, [phase, bossStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: Engine;
    try { engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance' }); }
    catch { return; }
    engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.15 : 1);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.035, 0.028, 0.055, 1);
    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogColor = new Color3(0.035, 0.028, 0.055); scene.fogDensity = 0.011;
    const camera = new ArcRotateCamera('dream-camera', -Math.PI / 2, 0.82, 16, new Vector3(0, 0.7, 0), scene);
    camera.lowerRadiusLimit = 11; camera.upperRadiusLimit = 30; camera.radius = zoomRef.current; camera.inputs.clear(); camera.fov = 0.82;
    const flatDirection = (direction: Vector3) => new Vector3(direction.x, 0, direction.z).normalize();
    const cameraRight = flatDirection(camera.getDirection(new Vector3(1, 0, 0)));
    const cameraForward = flatDirection(camera.getDirection(new Vector3(0, 0, 1)));
    const ambient = new HemisphericLight('moon-ambient', new Vector3(0.15, 1, -0.1), scene); ambient.intensity = 0.75; ambient.diffuse = new Color3(0.7, 0.75, 1); ambient.groundColor = new Color3(0.12, 0.1, 0.2);
    const keyLight = new DirectionalLight('dream-moonlight', new Vector3(-0.5, -1, 0.4), scene); keyLight.position.set(10, 18, -8); keyLight.intensity = 0.55; keyLight.diffuse = new Color3(0.76, 0.81, 1);
    const redLight = new PointLight('shadow-red-light', new Vector3(0, 4, -8), scene); redLight.diffuse = new Color3(0.65, 0.06, 0.2); redLight.intensity = 0.2; redLight.range = 25;

    // Black water and an elevated, cracked courtyard make the dream read as a place.
    const water = MeshBuilder.CreateGround('dream-abyss-water', { width: 180, height: 180, subdivisions: 2 }, scene); water.position.y = -0.72;
    const waterMat = new StandardMaterial('dream-water-material', scene); waterMat.diffuseColor = new Color3(0.018, 0.022, 0.045); waterMat.emissiveColor = new Color3(0.015, 0.02, 0.045); waterMat.specularColor = new Color3(0.28, 0.25, 0.45); waterMat.specularPower = 96; water.material = waterMat;
    const arenaBase = MeshBuilder.CreateCylinder('fractured-shrine-platform', { height: 0.8, diameter: 37, tessellation: 12 }, scene); arenaBase.position.y = -0.18;
    const stone = new StandardMaterial('pale-dream-stone', scene); stone.diffuseColor = new Color3(0.42, 0.43, 0.53); stone.specularColor = new Color3(0.12, 0.13, 0.2); stone.specularPower = 42; arenaBase.material = stone;
    const floor = MeshBuilder.CreateGround('walkable-dream-court', { width: 30, height: 21, subdivisions: 2 }, scene); floor.position.y = 0.235;
    const tileTexture = new DynamicTexture('cracked-ivory-tile-texture', { width: 512, height: 512 }, scene, false);
    const tileCtx = tileTexture.getContext() as unknown as CanvasRenderingContext2D;
    tileCtx.fillStyle = '#918d98'; tileCtx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) {
      const shade = 137 + ((x * 3 + y * 7) % 22); tileCtx.fillStyle = `rgb(${shade},${shade - 4},${shade + 5})`; tileCtx.fillRect(x + 2, y + 2, 124, 124);
      tileCtx.strokeStyle = 'rgba(28,22,40,.62)'; tileCtx.lineWidth = 2; tileCtx.beginPath(); tileCtx.moveTo(x + 95, y + 20); tileCtx.lineTo(x + 84, y + 56); tileCtx.lineTo(x + 101, y + 73); tileCtx.lineTo(x + 67, y + 119); tileCtx.stroke();
      tileCtx.strokeStyle = 'rgba(235,224,235,.16)'; tileCtx.lineWidth = 1; tileCtx.strokeRect(x + 5, y + 5, 118, 118);
    }
    tileTexture.uScale = 4; tileTexture.vScale = 3; tileTexture.update(true);
    const floorMat = new StandardMaterial('dream-tile-material', scene); floorMat.diffuseTexture = tileTexture; floorMat.diffuseColor = new Color3(0.78, 0.78, 0.85); floorMat.specularColor = Color3.Black(); floor.material = floorMat; floor.isPickable = true;

    // Broken gate, leaning monoliths and suspended paper charms frame the fight arena.
    const gateStone = new StandardMaterial('gate-stone-material', scene); gateStone.diffuseColor = new Color3(0.23, 0.21, 0.31); gateStone.emissiveColor = new Color3(0.035, 0.018, 0.055); gateStone.specularColor = Color3.Black();
    const gateGlow = new StandardMaterial('gate-seal-material', scene); gateGlow.diffuseColor = Color3.Black(); gateGlow.emissiveColor = new Color3(0.31, 0.045, 0.21); gateGlow.specularColor = Color3.Black();
    const leftPost = MeshBuilder.CreateBox('broken-gate-left-post', { width: 1.05, height: 9.5, depth: 1.15 }, scene); leftPost.position.set(-8.2, 4.8, -9.1); leftPost.rotation.z = -0.035; leftPost.material = gateStone;
    const rightPost = MeshBuilder.CreateBox('broken-gate-right-post', { width: 1.05, height: 8.4, depth: 1.15 }, scene); rightPost.position.set(8.2, 4.25, -9.1); rightPost.rotation.z = 0.045; rightPost.material = gateStone;
    const gateLintel = MeshBuilder.CreateBox('fractured-gate-lintel', { width: 18.5, height: 1.05, depth: 1.2 }, scene); gateLintel.position.set(-0.45, 9.15, -9.1); gateLintel.rotation.z = -0.035; gateLintel.material = gateStone;
    const seal = MeshBuilder.CreateTorus('floating-gate-seal', { diameter: 3.3, thickness: 0.08, tessellation: 48 }, scene); seal.position.set(0, 6.5, -8.45); seal.material = gateGlow;
    const columns = Array.from({ length: 8 }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1; const row = Math.floor(i / 2); const z = -6 + row * 3.8;
      const mesh = MeshBuilder.CreateBox(`broken-court-column-${i}`, { width: 0.75 + (i % 3) * 0.18, height: 3.2 + (i % 4) * 0.7, depth: 0.85 }, scene);
      mesh.position.set(side * (12.2 + (row % 2) * 0.4), mesh.scaling.y + 1.25, z); mesh.rotation.z = side * (0.018 + i * 0.003); mesh.material = gateStone; return mesh;
    });
    const rubble = Array.from({ length: 12 }, (_, i) => {
      const shard = MeshBuilder.CreateBox(`floating-tile-shard-${i}`, { width: 0.8 + (i % 3) * 0.45, height: 0.12, depth: 0.65 + (i % 2) * 0.5 }, scene);
      const side = i % 2 === 0 ? -1 : 1; shard.position.set(side * (16 + (i % 3) * 1.2), 0.2 + (i % 4) * 0.72, -8 + Math.floor(i / 2) * 2.8); shard.rotation.set(i * 0.08, i * 0.31, side * 0.12); shard.material = gateStone; return shard;
    });
    const charmMat = new StandardMaterial('hanging-paper-charm', scene); charmMat.diffuseColor = new Color3(0.88, 0.78, 0.68); charmMat.emissiveColor = new Color3(0.12, 0.055, 0.035); charmMat.backFaceCulling = false;
    const charms = Array.from({ length: 9 }, (_, i) => {
      const charm = MeshBuilder.CreatePlane(`paper-charm-${i}`, { width: 0.38, height: 1.0 }, scene); charm.position.set(-10 + i * 2.5, 6.4 + Math.sin(i * 2) * 1.7, -8.1); charm.material = charmMat; charm.billboardMode = Mesh.BILLBOARDMODE_ALL; return charm;
    });
    const waterRipples = Array.from({ length: 5 }, (_, i) => {
      const ripple = MeshBuilder.CreateTorus(`abyss-ripple-${i}`, { diameter: 20 + i * 11, thickness: 0.035, tessellation: 96 }, scene); ripple.rotation.x = Math.PI / 2; ripple.position.y = -0.67 + i * 0.002; ripple.material = gateGlow; ripple.visibility = 0.32; return ripple;
    });

    const heroPosition = new Vector3(0, 0, 2);
    let sourceSprite: HTMLImageElement | null = null;
    let disposed = false;
    const drawFrame = (texture: DynamicTexture, cell: number, silhouette: boolean, mirror = false) => {
      const width = 128; const height = 192;
      if (texture.getSize().width !== width || texture.getSize().height !== height) texture.scaleTo(width, height);
      const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, width, height);
      if (sourceSprite) {
        const col = cell % 4; const row = Math.floor(cell / 4);
        const sw = sourceSprite.naturalWidth * 0.13; const sh = sourceSprite.naturalHeight * (0.97 / 3);
        if (mirror) { ctx.save(); ctx.translate(width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(sourceSprite, (col + 0.24) / 4 * sourceSprite.naturalWidth, (row + 0.015) / 3 * sourceSprite.naturalHeight, sw, sh, 0, 0, width, height);
        if (mirror) ctx.restore();
        const pixels = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) > 218) pixels.data[i + 3] = 0;
          if (silhouette && pixels.data[i + 3] > 0) { pixels.data[i] = 5; pixels.data[i + 1] = 3; pixels.data[i + 2] = 12; }
        }
        ctx.putImageData(pixels, 0, 0);
      } else {
        ctx.fillStyle = silhouette ? '#080611' : '#c8d7e8'; ctx.beginPath(); ctx.ellipse(64, 35, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = silhouette ? '#090711' : '#354459'; ctx.beginPath(); ctx.moveTo(43, 61); ctx.lineTo(85, 61); ctx.lineTo(103, 151); ctx.lineTo(25, 151); ctx.closePath(); ctx.fill();
        ctx.fillStyle = silhouette ? '#090711' : '#202938'; ctx.fillRect(34, 145, 20, 42); ctx.fillRect(68, 145, 20, 42);
      }
      texture.hasAlpha = true; texture.update(true);
    };
    const makeSprite = (name: string, pos: Vector3, silhouette = false) => {
      const texture = new DynamicTexture(`${name}-texture`, { width: 128, height: 192 }, scene, false);
      texture.updateSamplingMode(1); drawFrame(texture, silhouette ? 9 : 0, silhouette);
      const plane = MeshBuilder.CreatePlane(name, { width: 1.55, height: 2.3 }, scene); plane.position.copyFrom(pos); plane.position.y = 1.36; plane.billboardMode = Mesh.BILLBOARDMODE_ALL; plane.isPickable = false;
      const material = new StandardMaterial(`${name}-material`, scene); material.diffuseTexture = texture; material.opacityTexture = texture; material.useAlphaFromDiffuseTexture = true; material.diffuseColor = silhouette ? new Color3(0.035, 0.025, 0.055) : Color3.White(); material.emissiveColor = silhouette ? new Color3(0.025, 0.008, 0.035) : new Color3(0.11, 0.11, 0.13); material.specularColor = Color3.Black(); material.backFaceCulling = false; material.transparencyMode = StandardMaterial.MATERIAL_ALPHATESTANDBLEND; plane.material = material;
      const shadow = MeshBuilder.CreateDisc(`${name}-ground-shadow`, { radius: 0.72, tessellation: 24 }, scene); shadow.rotation.x = Math.PI / 2; shadow.position.set(pos.x, 0.255, pos.z); shadow.scaling.y = 0.48;
      const shadowMaterial = new StandardMaterial(`${name}-shadow-material`, scene); shadowMaterial.diffuseColor = Color3.Black(); shadowMaterial.emissiveColor = Color3.Black(); shadowMaterial.alpha = silhouette ? 0.48 : 0.3; shadowMaterial.specularColor = Color3.Black(); shadowMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND; shadow.material = shadowMaterial;
      return { plane, texture, material, shadow };
    };
    const player = makeSprite('gabriela-dream-sprite', heroPosition);
    const firstShadow = makeSprite('shadow-before-the-fight', new Vector3(0, 0, -4.5), true);
    const copyCount = 5;
    const copies = Array.from({ length: copyCount }, (_, i) => {
      const angle = i / copyCount * Math.PI * 2;
      const copy = makeSprite(`memory-copy-${i}`, new Vector3(Math.cos(angle) * 16, 0, Math.sin(angle) * 12), true);
      copy.plane.setEnabled(false); copy.shadow.setEnabled(false); copy.material.alpha = 0;
      return { ...copy, x: Math.cos(angle) * 16, z: Math.sin(angle) * 12 };
    });
    const spriteImage = new Image(); spriteImage.onload = () => {
      if (disposed) return;
      sourceSprite = spriteImage;
      drawFrame(player.texture, 0, false); drawFrame(firstShadow.texture, 9, true);
      copies.forEach((copy) => drawFrame(copy.texture, 9, true));
    };
    spriteImage.src = SPRITE_PATH;

    // One animated atlas is the boss's only body; it fades out between runs and in the spike phase.
    const smokeTexture = new DynamicTexture('smoke-boss-eight-frame-sprite', { width: 768, height: 384 }, scene, false);
    const smokeCtx = smokeTexture.getContext() as unknown as CanvasRenderingContext2D;
    for (let frame = 0; frame < 8; frame++) {
      const ox = frame % 4 * 192; const oy = Math.floor(frame / 4) * 192;
      smokeCtx.save(); smokeCtx.translate(ox, oy); smokeCtx.clearRect(0, 0, 192, 192);
      const lobes = [[40, 105, 37], [75, 78, 48], [116, 91, 48], [151, 111, 34], [91, 126, 42], [128, 55, 29]];
      lobes.forEach(([x, y, radius], index) => {
        const px = x + Math.sin(frame * 0.9 + index * 1.7) * 11; const py = y + Math.cos(frame * 0.75 + index * 2.1) * 9; const r = radius * (0.86 + ((frame + index) % 3) * 0.11);
        const gradient = smokeCtx.createRadialGradient(px, py, 2, px, py, r); gradient.addColorStop(0, 'rgba(2,2,7,.98)'); gradient.addColorStop(0.48, 'rgba(7,6,14,.88)'); gradient.addColorStop(0.82, 'rgba(20,12,30,.48)'); gradient.addColorStop(1, 'rgba(12,9,18,0)');
        smokeCtx.fillStyle = gradient; smokeCtx.beginPath(); smokeCtx.arc(px, py, r, 0, Math.PI * 2); smokeCtx.fill();
      });
      smokeCtx.filter = 'blur(7px)'; smokeCtx.strokeStyle = 'rgba(105,71,132,.42)'; smokeCtx.lineWidth = 8; smokeCtx.beginPath(); smokeCtx.moveTo(14, 136); smokeCtx.bezierCurveTo(58, 44 + frame * 2, 127, 152 - frame, 180, 67 + Math.cos(frame) * 12); smokeCtx.stroke(); smokeCtx.restore();
    }
    smokeTexture.hasAlpha = true; smokeTexture.update(true); smokeTexture.uScale = 0.25; smokeTexture.vScale = 0.5; smokeTexture.updateSamplingMode(1);
    const smokeMaterial = new StandardMaterial('smoke-boss-material', scene); smokeMaterial.diffuseTexture = smokeTexture; smokeMaterial.opacityTexture = smokeTexture; smokeMaterial.useAlphaFromDiffuseTexture = true; smokeMaterial.diffuseColor = new Color3(0.78, 0.73, 0.86); smokeMaterial.emissiveColor = new Color3(0.035, 0.018, 0.05); smokeMaterial.alpha = 0; smokeMaterial.specularColor = Color3.Black(); smokeMaterial.backFaceCulling = false; smokeMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    const smokeRoots = Array.from({ length: 4 }, (_, i) => {
      const root = new TransformNode(`smoke-boss-root-${i}`, scene); root.setEnabled(false);
      const sprite = MeshBuilder.CreatePlane(`smoke-boss-animated-billboard-${i}`, { width: 6.6, height: 4.8 }, scene); sprite.parent = root; sprite.billboardMode = Mesh.BILLBOARDMODE_ALL; sprite.material = smokeMaterial; sprite.isPickable = false;
      return root;
    });
    const smokeShadows = Array.from({ length: 4 }, (_, i) => {
      const shadow = MeshBuilder.CreateDisc(`smoke-boss-ground-shadow-${i}`, { radius: 3.8, tessellation: 40 }, scene); shadow.rotation.x = Math.PI / 2; shadow.position.y = 0.26; shadow.scaling.y = 0.48;
      return shadow;
    });
    const smokeShadowMaterial = new StandardMaterial('smoke-boss-shadow-material', scene); smokeShadowMaterial.diffuseColor = Color3.Black(); smokeShadowMaterial.emissiveColor = new Color3(0.012, 0.006, 0.02); smokeShadowMaterial.alpha = 0.48; smokeShadowMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND; smokeShadows.forEach((shadow) => { shadow.material = smokeShadowMaterial; shadow.isPickable = false; });

    const warningMat = new StandardMaterial('boss-telegraph-material', scene); warningMat.diffuseColor = Color3.Black(); warningMat.emissiveColor = new Color3(1, 0.12, 0.22); warningMat.alpha = 0.94; warningMat.disableLighting = true; warningMat.specularColor = Color3.Black(); warningMat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    const spikeMat = new StandardMaterial('black-spike-material', scene); spikeMat.diffuseColor = new Color3(0.012, 0.009, 0.02); spikeMat.emissiveColor = new Color3(0.18, 0.02, 0.12); spikeMat.specularColor = Color3.Black();
    let sweepLines: Mesh[] = [];
    const warningRings = Array.from({ length: 8 }, (_, i) => {
      const rings = [2.8, 4.0].map((diameter, j) => {
        const ring = MeshBuilder.CreateTorus(`boss-spike-warning-${i}-${j}`, { diameter, thickness: 0.045, tessellation: 40 }, scene); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; ring.material = warningMat; ring.isPickable = false; ring.setEnabled(false); return ring;
      }); return rings;
    });
    const spikes = Array.from({ length: 8 }, (_, i) => {
      const spike = MeshBuilder.CreateCylinder(`rising-abyss-spike-${i}`, { height: 2.3, diameterTop: 0.025, diameterBottom: 0.78, tessellation: 5 }, scene); spike.position.y = 0.3; spike.material = spikeMat; spike.isPickable = false; spike.setEnabled(false); return spike;
    });
    const memoryMarks = Array.from({ length: TOTAL_CUES }, (_, i) => {
      const angle = i / TOTAL_CUES * Math.PI * 2;
      const mark = MeshBuilder.CreateTorus(`memory-mark-${i}`, { diameter: 1.1, thickness: 0.045, tessellation: 24 }, scene); mark.rotation.x = Math.PI / 2; mark.position.set(Math.cos(angle) * 11, 0.31, Math.sin(angle) * 8); mark.material = gateGlow; mark.isPickable = false; return mark;
    });

    const keys = new Set<string>();
    const collisionCircles = [...columns.map((column) => ({ x: column.position.x, z: column.position.z, r: 0.9 })), { x: -8.2, z: -9.1, r: 1.15 }, { x: 8.2, z: -9.1, r: 1.15 }];
    let walkTarget: Vector3 | null = null;
    let elapsed = 0;
    let cameraCutStartedAt: number | null = null;
    let cameraCutStartAlpha = camera.alpha;
    let cameraCutBaseRadius = camera.radius;
    let cameraCutBaseBeta = camera.beta;
    let lastSeenMisses = 0;
    let lastHeroFrame = '';
    let lastHeroFacing: Facing = 'down';
    const lastCopyFrames = Array(copyCount).fill('');
    let lastPatternKey = '';
    let smokeOpacity = 0;
    let lastSmokeFrame = -1;
    const identityMatrix = Matrix.Identity();
    const moveToPointer = (event: PointerEvent) => {
      const current = runtimeRef.current;
      if (current.phase === 'playing' && current.cue) { resolveRef.current(false); return; }
      if (current.phase !== 'playing' && current.phase !== 'boss') return;
      const rect = canvas.getBoundingClientRect();
      const pick = scene.pick((event.clientX - rect.left) * engine.getRenderWidth() / rect.width, (event.clientY - rect.top) * engine.getRenderHeight() / rect.height, (mesh) => mesh === floor);
      if (pick?.hit && pick.pickedPoint) walkTarget = new Vector3(clamp(pick.pickedPoint.x, -13.8, 13.8), 0, clamp(pick.pickedPoint.z, -9.2, 9.2));
    };
    canvas.addEventListener('pointerdown', moveToPointer);
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { event.preventDefault(); keys.add(key); }
      if (key === '+' || key === '=') setZoom((value) => clamp(value - 2, 11, 30));
      if (key === '-' || key === '_') setZoom((value) => clamp(value + 2, 11, 30));
    };
    const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const clearTouchKeys = () => Object.keys(touchKeysRef.current).forEach((key) => { touchKeysRef.current[key] = false; });
    window.addEventListener('blur', clearTouchKeys);
    const wheel = (event: WheelEvent) => { event.preventDefault(); setZoom((value) => clamp(value + Math.sign(event.deltaY) * 2, 11, 30)); };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); canvas.addEventListener('wheel', wheel, { passive: false });

    engine.runRenderLoop(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); elapsed += dt;
      const current = runtimeRef.current;
      if (current.phase === 'playing' && current.misses > lastSeenMisses) {
        const missCount = current.misses - lastSeenMisses;
        copies.forEach((copy) => {
          const dx = heroPosition.x - copy.x; const dz = heroPosition.z - copy.z; const distance = Math.hypot(dx, dz) || 1;
          const step = Math.min(distance * 0.82, missCount * 2.6);
          copy.x += dx / distance * step; copy.z += dz / distance * step;
          copy.plane.position.x = copy.x; copy.plane.position.z = copy.z;
          copy.shadow.position.x = copy.x; copy.shadow.position.z = copy.z;
          copy.plane.setEnabled(true); copy.shadow.setEnabled(true); copy.material.alpha = 0.78;
        });
      }
      lastSeenMisses = current.misses;
      const live = current.phase === 'playing' || current.phase === 'boss';
      scene.clearColor = live ? new Color4(0.045 + current.misses * 0.006, 0.035 + current.misses * 0.003, 0.075 + current.misses * 0.004, 1) : new Color4(0.018, 0.012, 0.03, 1);
      scene.fogDensity = 0.009 + current.misses * 0.0035 + (current.phase === 'boss' ? current.bossStep * 0.00032 : 0);
      camera.radius += (zoomRef.current - camera.radius) * (1 - Math.exp(-dt * 5));
      if (current.phase === 'transition') {
        if (cameraCutStartedAt === null) {
          cameraCutStartedAt = elapsed;
          cameraCutStartAlpha = camera.alpha;
          cameraCutBaseRadius = zoomRef.current;
          cameraCutBaseBeta = camera.beta;
        }
        const cutProgress = clamp((elapsed - cameraCutStartedAt) / 1.9, 0, 1);
        const cutEase = cutProgress * cutProgress * (3 - 2 * cutProgress);
        camera.alpha = cameraCutStartAlpha + Math.PI * 2 * cutEase;
        camera.radius = cameraCutBaseRadius + Math.sin(Math.PI * cutEase) * 7;
        camera.beta = cameraCutBaseBeta - Math.sin(Math.PI * cutEase) * 0.1;
      } else cameraCutStartedAt = null;

      const keyX = Number(keys.has('d') || keys.has('arrowright') || touchKeysRef.current.d) - Number(keys.has('a') || keys.has('arrowleft') || touchKeysRef.current.a);
      const keyY = Number(keys.has('w') || keys.has('arrowup') || touchKeysRef.current.w) - Number(keys.has('s') || keys.has('arrowdown') || touchKeysRef.current.s);
      let dx = keyX * cameraRight.x + keyY * cameraForward.x;
      let dz = keyX * cameraRight.z + keyY * cameraForward.z;
      if (keyX || keyY) walkTarget = null;
      else if (walkTarget) {
        dx = walkTarget.x - heroPosition.x; dz = walkTarget.z - heroPosition.z;
        if (Math.hypot(dx, dz) < 0.17) { walkTarget = null; dx = dz = 0; }
      }
      const requestedMove = live && Math.hypot(dx, dz) > 0.001;
      const previousX = heroPosition.x; const previousZ = heroPosition.z;
      if (requestedMove) {
        const length = Math.hypot(dx, dz); const speed = 5.5 + current.misses * 0.18;
        const nextX = clamp(heroPosition.x + dx / length * speed * dt, -13.8, 13.8);
        const nextZ = clamp(heroPosition.z + dz / length * speed * dt, -9.2, 9.2);
        const blocked = (x: number, z: number) => collisionCircles.some((item) => Math.hypot(x - item.x, z - item.z) < item.r);
        if (!blocked(nextX, heroPosition.z)) heroPosition.x = nextX;
        if (!blocked(heroPosition.x, nextZ)) heroPosition.z = nextZ;
      }
      const actualX = heroPosition.x - previousX; const actualZ = heroPosition.z - previousZ;
      const moving = Math.hypot(actualX, actualZ) > 0.0005;
      const screenX = actualX * cameraRight.x + actualZ * cameraRight.z;
      const screenY = actualX * cameraForward.x + actualZ * cameraForward.z;
      if (moving) lastHeroFacing = Math.abs(screenX) > Math.abs(screenY) ? screenX < 0 ? 'left' : 'right' : screenY > 0 ? 'up' : 'down';
      heroPositionRef.current.copyFrom(heroPosition);
      player.plane.position.x = heroPosition.x; player.plane.position.z = heroPosition.z;
      player.shadow.position.x = heroPosition.x; player.shadow.position.z = heroPosition.z;
      player.plane.position.y = 1.4 + (moving ? Math.abs(Math.sin(elapsed * 13)) * 0.17 : Math.sin(elapsed * 2.1) * 0.035);
      player.plane.rotation.z = moving && Math.abs(screenX) > Math.abs(screenY) ? -Math.sign(screenX) * 0.055 : Math.sin(elapsed * 1.8) * 0.012;
      player.shadow.scaling.x = moving ? 0.94 + Math.sin(elapsed * 13) * 0.08 : 1;
      const heroCell = facingCell(lastHeroFacing, Math.floor(elapsed * (moving ? 12 : 2)), moving);
      const heroMirror = spriteMirror(lastHeroFacing, moving);
      const heroKey = `${heroCell}:${heroMirror}:${lastHeroFacing}`;
      if (heroKey !== lastHeroFrame) { drawFrame(player.texture, heroCell, false, heroMirror); lastHeroFrame = heroKey; }

      copies.forEach((copy, i) => {
        const active = current.phase === 'playing' && (elapsed > i * 0.52 || current.misses > 0);
        copy.plane.setEnabled(active); copy.shadow.setEnabled(active);
        copy.material.alpha += ((active ? 0.68 : 0) - copy.material.alpha) * Math.min(1, dt * 2.8);
        if (!active) return;
        const vx = heroPosition.x - copy.x; const vz = heroPosition.z - copy.z; const distance = Math.hypot(vx, vz) || 1;
        const speed = 0.8 + current.misses * 0.48;
        copy.x += vx / distance * Math.min(distance, speed * dt); copy.z += vz / distance * Math.min(distance, speed * dt);
        copy.plane.position.x = copy.x; copy.plane.position.z = copy.z; copy.shadow.position.x = copy.x; copy.shadow.position.z = copy.z;
        copy.plane.position.y = 1.36 + Math.sin(elapsed * 7 + i) * 0.09; copy.plane.rotation.z = Math.sin(elapsed * 4 + i) * 0.035;
        const face: Facing = Math.abs(vx) > Math.abs(vz) ? (vx < 0 ? 'left' : 'right') : vz < 0 ? 'up' : 'down';
        const cell = facingCell(face, Math.floor(elapsed * 11 + i), true); const mirror = spriteMirror(face, true); const key = `${cell}:${mirror}`;
        if (key !== lastCopyFrames[i]) { drawFrame(copy.texture, cell, true, mirror); lastCopyFrames[i] = key; }
      });
      firstShadow.plane.setEnabled(current.phase === 'dialogue'); firstShadow.shadow.setEnabled(current.phase === 'dialogue');
      firstShadow.plane.position.y = 1.36 + Math.sin(elapsed * 1.7) * 0.05;
      columns.forEach((column, i) => { column.position.y = column.getBoundingInfo().boundingBox.extendSize.y + 0.65 + Math.sin(elapsed * 0.7 + i) * 0.08; });
      rubble.forEach((shard, i) => { shard.position.y = 0.2 + (i % 4) * 0.72 + Math.sin(elapsed * 0.9 + i) * 0.14; });
      charms.forEach((charm, i) => { charm.rotation.z = Math.sin(elapsed * 1.7 + i * 1.8) * 0.18; charm.position.y = 6.4 + Math.sin(i * 2) * 1.7 + Math.sin(elapsed * 2 + i) * 0.28; });
      waterRipples.forEach((ripple, i) => { ripple.scaling.setAll(0.96 + Math.sin(elapsed * 0.55 + i) * 0.035); ripple.visibility = 0.18 + (Math.sin(elapsed * 0.8 + i) + 1) * 0.07; });
      memoryMarks.forEach((mark, i) => { mark.setEnabled(current.phase === 'playing' && i >= current.hits); mark.scaling.setAll(1 + Math.sin(elapsed * 3 + i) * 0.12); });

      const pattern = current.bossPattern;
      const stage = current.bossAttackStage;
      const smokeActive = current.phase === 'boss' && !!pattern && pattern.phase !== 1 && stage !== 'recovery';
      smokeOpacity += ((smokeActive ? 0.96 : 0) - smokeOpacity) * Math.min(1, dt * 3.3);
      smokeRoots.forEach((root) => root.setEnabled(smokeOpacity > 0.015)); smokeMaterial.alpha = smokeOpacity;
      smokeShadowMaterial.alpha = 0.48 * smokeOpacity;
      if (smokeOpacity > 0.015 && pattern) {
        const attackProgress = clamp((performance.now() - pattern.startedAt - pattern.warningMs) / pattern.impactMs, 0, 1);
        smokeRoots.forEach((root, i) => {
          const path = pattern.paths[i];
          const smokePoint = stage === 'impact' ? smokePathPoint(path, attackProgress) : stage === 'recovery' ? path[path.length - 1] : path[0];
          root.position.set(smokePoint.x, 2.15 + Math.sin(elapsed * 6 + i) * 0.18, smokePoint.z);
          root.rotation.y = Math.sin(elapsed * 5 + i) * 0.24; root.scaling.setAll(0.9 + Math.sin(elapsed * 7 + i) * 0.09);
          smokeShadows[i].position.x = smokePoint.x; smokeShadows[i].position.z = smokePoint.z;
        });
        const frame = Math.floor(elapsed * 13) % 8;
        if (frame !== lastSmokeFrame) { lastSmokeFrame = frame; smokeTexture.uOffset = frame % 4 * 0.25; smokeTexture.vOffset = Math.floor(frame / 4) * 0.5; }
      }

      if (current.phase === 'boss' && pattern && stage === 'impact') {
        const now = performance.now(); const progress = clamp((now - pattern.startedAt - pattern.warningMs) / pattern.impactMs, 0, 1);
        if (pattern.phase !== 1) {
          pattern.paths.forEach((path) => {
            const smokePoint = smokePathPoint(path, progress);
            if (Math.hypot(heroPosition.x - smokePoint.x, heroPosition.z - smokePoint.z) < 3.2) { bossCollisionRef.current = true; smokeHitRef.current = true; }
          });
        }
        if (pattern.phase !== 0 && pattern.pools.some((pool) => Math.hypot(heroPosition.x - pool.x, heroPosition.z - pool.z) < 1.65)) { bossCollisionRef.current = true; spikesHitRef.current = true; }
      }

      const patternKey = pattern ? `${current.bossStep}-${pattern.phase}-${pattern.lane}` : '';
      if (pattern && patternKey !== lastPatternKey) {
        lastPatternKey = patternKey;
        sweepLines.forEach((line) => line.dispose());
        sweepLines = pattern.paths.map((path, i) => {
          const line = MeshBuilder.CreateLines(`boss-smoke-path-${i}`, { points: path.map((point) => new Vector3(point.x, 0.32, point.z)) }, scene);
          line.color = i < 2 ? new Color3(1, 0.12, 0.22) : new Color3(0.76, 0.22, 0.48); line.isPickable = false; line.setEnabled(false); return line;
        });
        pattern.pools.forEach((pool, i) => {
          warningRings[i].forEach((ring) => { ring.position.x = pool.x; ring.position.z = pool.z; });
          spikes[i].position.x = pool.x; spikes[i].position.z = pool.z;
        });
      }
      sweepLines.forEach((line) => line.setEnabled(!!pattern && current.phase === 'boss' && stage === 'warning' && pattern.phase !== 1));
      warningRings.forEach((rings, i) => rings.forEach((ring, j) => {
        const warning = current.phase === 'boss' && !!pattern && stage === 'warning' && pattern.phase !== 0;
        ring.setEnabled(warning); const scale = 0.88 + (Math.sin(elapsed * 7 + i * 1.6 + j) + 1) * 0.12; ring.scaling.set(scale, scale, scale);
      }));
      spikes.forEach((spike, i) => {
        const visible = current.phase === 'boss' && !!pattern && stage === 'impact' && pattern.phase !== 0 && (i === 0 || i < pattern.pools.length);
        spike.setEnabled(visible);
        if (visible) { const rise = 0.75 + (Math.sin(elapsed * 14 + i * 2) + 1) * 0.28; spike.scaling.y = rise; spike.position.y = 0.3 + rise * 0.95; }
      });
      if (current.phase !== 'boss') { lastPatternKey = ''; sweepLines.forEach((line) => line.setEnabled(false)); warningRings.forEach((rings) => rings.forEach((ring) => ring.setEnabled(false))); spikes.forEach((spike) => spike.setEnabled(false)); }

      const impactShake = current.phase === 'boss' && stage === 'impact' ? 0.08 + (pattern?.phase ?? 0) * 0.035 : 0;
      camera.target.copyFromFloats(heroPosition.x + Math.sin(elapsed * 43) * impactShake, 0.9 + Math.cos(elapsed * 37) * impactShake * 0.7, heroPosition.z - 0.8 + Math.sin(elapsed * 31) * impactShake);
      redLight.intensity = current.phase === 'boss' ? (stage === 'impact' ? 0.78 + (pattern?.phase ?? 0) * 0.11 : 0.24 + current.bossStep * 0.018) : 0.2;
      redLight.position.set(pattern?.paths[0]?.[0]?.x ?? 0, 4, pattern?.lane ?? -7);
      scene.render();
      const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
      const transform = scene.getTransformMatrix();
      markScreensRef.current = memoryMarks.map((mark) => {
        const pixel = Vector3.Project(mark.position, identityMatrix, transform, viewport);
        return { x: clamp(pixel.x / engine.getRenderWidth() * 100, 8, 92), y: clamp(pixel.y / engine.getRenderHeight() * 100, 14, 86) };
      });
    });
    const resize = () => engine.resize(); window.addEventListener('resize', resize);
    return () => {
      disposed = true; window.removeEventListener('resize', resize); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', clearTouchKeys); canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('pointerdown', moveToPointer);
      engine.stopRenderLoop(); scene.dispose(); engine.dispose();
    };
  }, [sceneRevision]);

  const strike = () => {
    if (phase !== 'playing') return;
    const now = performance.now(); if (now - lastStrikeRef.current < 160) return;
    lastStrikeRef.current = now; resolveRef.current(true);
  };
  const retry = () => {
    lastStrikeRef.current = 0; bossCollisionRef.current = false; smokeHitRef.current = false; spikesHitRef.current = false; bossResultRef.current = null;
    const startDarkness = initialPhase === 'boss' ? 1 : 0;
    const fresh: DreamState = { round: 0, hits: 0, misses: 0, sanity: 100, cue: null, phase: initialPhase, bossHits: 0, darkness: startDarkness, bossStep: 0, bossPattern: null, bossAttackStage: 'warning' };
    runtimeRef.current = fresh; setRound(0); setHits(0); setMisses(0); setSanity(100); setBossHits(0); setBossStep(0); setBossPattern(null); setBossAttackStage('warning'); setDarkness(startDarkness); setCue(null); setPhase(initialPhase); setDialogueIndex(0); setShadowReply(null); setZoom(16); heroPositionRef.current.set(0, 0, 2);
    setSceneRevision((revision) => revision + 1);
  };
  const currentShadowLine = SHADOW_DIALOGUE[dialogueIndex];
  const shadowNode: DialogueNode | null = phase !== 'dialogue' ? null : shadowReply ? {
    id: `dream-shadow-${shadowReply.showingResponse ? 'reply' : 'answer'}-${dialogueIndex}`,
    speaker: shadowReply.showingResponse ? 'Desconhecido' : 'Gabriela', speakerTitle: shadowReply.showingResponse ? 'A Sombra' : undefined,
    avatar: shadowReply.showingResponse ? 'unknown_shadow' : 'gabriela', text: shadowReply.showingResponse ? shadowReply.response : shadowReply.answer,
    next: shadowReply.showingResponse ? 'dream-continue' : 'dream-reply',
  } : {
    id: `dream-shadow-question-${dialogueIndex}`, speaker: 'Desconhecido', speakerTitle: 'A Sombra', avatar: 'unknown_shadow',
    text: currentShadowLine.question,
    options: currentShadowLine.choices.map(([answer], index) => ({ text: answer, nextNodeId: String(index) })),
  };
  const chooseShadowAnswer = (option: DialogueOption) => {
    const choice = currentShadowLine.choices[Number(option.nextNodeId)];
    if (choice) setShadowReply({ answer: choice[0], response: choice[1], showingResponse: false });
  };
  const advanceShadowDialogue = () => {
    if (!shadowReply) return;
    if (!shadowReply.showingResponse) { setShadowReply({ ...shadowReply, showingResponse: true }); return; }
    if (dialogueIndex + 1 >= SHADOW_DIALOGUE.length) {
      setShadowReply(null); runtimeRef.current.phase = 'transition'; runtimeRef.current.darkness = 0;
      setDarkness(0); setTransitionTarget('playing'); setPhase('transition'); return;
    }
    setDialogueIndex((index) => index + 1); setShadowReply(null);
  };

  const phaseName = ['INVESTIDA E RICOCHETE', 'ONDAS DE ESPINHOS', 'FUMAÇA + ESPINHOS', 'CRUZAMENTO TRIPLO', 'A CAÇADA FINAL'][bossPattern?.phase ?? 0];
  return <div className="fixed inset-0 z-[70] overflow-hidden bg-[#08060e] text-white">
    <canvas key={sceneRevision} ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Arena fragmentada do sonho de Gabriela em Babylon.js" />
    <div aria-hidden="true" className="dream-warp-layer absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 16% 27%, rgba(255,44,75,${0.08 + misses * 0.07}), transparent 40%), radial-gradient(ellipse at 82% 72%, rgba(98,72,220,${0.1 + misses * 0.06}), transparent 44%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.035) 0 1px, transparent 2px 6px)`, mixBlendMode: 'screen', opacity: 0.38 + misses * 0.1, backdropFilter: `blur(${0.25 + misses * 0.38}px) saturate(${0.9 - misses * 0.055})` }} />
    {(phase === 'playing' || phase === 'boss') && <div aria-hidden="true" className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `radial-gradient(ellipse at center, transparent ${Math.max(9, 52 - darkness * 5.2)}%, rgba(0,0,0,${Math.min(0.98, 0.46 + darkness * 0.065)}) 100%)`, transition: 'background 650ms ease-out' }} />}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-5">
      <div className="min-w-[min(92vw,32rem)] border border-white/15 bg-[#09070f]/78 px-5 py-3 text-center shadow-[0_16px_60px_rgba(0,0,0,.35)] backdrop-blur-sm">
        <p className="font-serif-jp text-[9px] tracking-[.48em] text-rose-200/75">{phase === 'boss' ? `A SOMBRA · FASE ${bossPattern ? bossPattern.phase + 1 : 1}/${BOSS_PHASES}` : 'SONHO · MEMÓRIA INSTÁVEL'}</p>
        <p className="mt-1 font-serif-jp text-xs tracking-[.06em] text-neutral-100">{phase === 'boss' ? phaseName : phase === 'playing' ? 'Toque nas marcas antes que desapareçam.' : 'As pedras se movem sob os pés de Gabriela.'}</p>
        {phase === 'boss' && <div className="mt-2 h-[2px] overflow-hidden bg-white/10"><div className={`h-full ${bossAttackStage === 'warning' ? 'bg-rose-300' : bossAttackStage === 'impact' ? 'bg-red-500' : 'bg-violet-300'}`} style={{ width: bossAttackStage === 'warning' ? '100%' : bossAttackStage === 'impact' ? '50%' : '16%', transition: 'width 250ms ease-out' }} /></div>}
      </div>
    </div>
    {shadowNode && <DialogueBox cinematic node={shadowNode} onSelectOption={chooseShadowAnswer} onNext={advanceShadowDialogue} onClose={advanceShadowDialogue} />}
    {phase === 'transition' && <div className="pointer-events-none absolute inset-0 z-30 text-center" aria-live="polite"><div className="absolute inset-x-0 top-0 h-[13vh] bg-gradient-to-b from-black/85 to-transparent" /><div className="absolute inset-x-0 bottom-0 h-[27vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent" /><div className="absolute inset-x-4 bottom-[8vh] mx-auto max-w-xl animate-pulse drop-shadow-[0_2px_12px_rgba(0,0,0,.95)]"><span className="font-mono text-[9px] tracking-[.55em] text-rose-200/90">03:17 · MEMÓRIA EM COLAPSO</span><h2 className="mt-2 font-title text-3xl tracking-[.2em] text-white sm:text-5xl">{transitionTarget === 'boss' ? 'A SOMBRA SE REVELA' : 'O SONHO COMEÇA'}</h2><p className="mx-auto mt-2 max-w-md font-serif-jp text-xs leading-6 text-neutral-100/90 sm:mt-3 sm:text-sm sm:leading-7">{transitionTarget === 'boss' ? 'A fumaça se adensa. O chão se abre e a perseguição começa.' : 'A lembrança se desfaz. Gabriela precisa encontrar uma saída.'}</p></div></div>}
    {(phase === 'playing' || phase === 'boss') && <div className="absolute inset-0 z-20 pointer-events-none">
      {phase === 'playing' && cue && <button onClick={strike} className="pointer-events-auto absolute z-10 grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-rose-100/90 bg-rose-950/65 shadow-[0_0_45px_rgba(255,55,75,.8)] animate-pulse" style={{ left: `${cue.x}%`, top: `${cue.y}%` }} aria-label="Toque a marca luminosa">
        <span className="absolute inset-1 rounded-full border border-white/75" /><span className="h-2 w-2 rounded-full bg-white shadow-[0_0_14px_#fff]" /><span className="absolute -bottom-2 left-1 right-1 h-1 overflow-hidden rounded bg-black/60"><span className="block h-full origin-left bg-rose-200" style={{ animation: `dreamCueDrain ${cue.duration}ms linear forwards` }} /></span>
      </button>}
      {phase === 'boss' && <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded border border-white/15 bg-black/55 px-4 py-2 text-center font-serif-jp text-[10px] tracking-[.1em] text-white/80 backdrop-blur-sm">
        {bossAttackStage === 'warning' ? bossPattern?.phase === 0 ? 'A linha mostra a investida e o ricochete. Saia de todo o percurso.' : bossPattern?.phase === 1 ? 'Ondas no chão: afaste-se dos círculos antes dos espinhos.' : bossPattern?.phase === 2 ? 'A fumaça cruza enquanto os espinhos cercam a arena.' : bossPattern?.phase === 3 ? 'Três cruzamentos em sequência: continue se movendo.' : 'A caçada final combina todos os golpes. Não pare.' : bossAttackStage === 'impact' ? 'DESVIE — o golpe está atravessando a arena.' : 'A fumaça se desfaz e o próximo golpe se forma.'}
      </div>}
      {phase === 'boss' && bossAttackStage === 'recovery' && damageNotice && <div className="absolute left-1/2 top-40 -translate-x-1/2 rounded border border-rose-300/35 bg-rose-950/75 px-4 py-2 font-serif-jp text-[10px] tracking-[.15em] text-rose-100">{damageNotice}</div>}
      <div className="absolute bottom-28 left-4 flex items-center gap-3 rounded border border-white/10 bg-black/55 px-3 py-2 font-serif-jp text-[9px] tracking-[.12em] backdrop-blur-sm sm:bottom-5 sm:left-5 sm:px-4 sm:py-3 sm:text-[10px] sm:tracking-[.2em]">
        <span>{phase === 'boss' ? `DESVIOS ${bossHits}/${bossStep}` : `MARCAS ${hits}/${TOTAL_CUES}`}</span><span className="h-4 w-px bg-white/20" /><span className="text-rose-200">SANIDADE {sanity}%</span>
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 font-mono text-[10px] pointer-events-auto backdrop-blur-sm sm:bottom-5 sm:right-5">
        <button onClick={() => setZoom((value) => clamp(value + 2, 11, 30))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15" aria-label="Afastar câmera">−</button><span className="min-w-10 text-center">{(16 / zoom).toFixed(1)}×</span><button onClick={() => setZoom((value) => clamp(value - 2, 11, 30))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15" aria-label="Aproximar câmera">+</button>
      </div>
      <div className="hidden absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 font-serif-jp text-[9px] tracking-[.2em] text-white/50 sm:block">WASD / SETAS · CLIQUE PARA ANDAR</div>
    </div>}
    {(phase === 'playing' || phase === 'boss') && <div className="absolute bottom-4 left-4 z-30 flex flex-col items-center gap-1 sm:hidden" aria-label="Controles de movimento">
      <button style={{ touchAction: 'none' }} className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/75 text-xl text-white shadow-lg backdrop-blur active:bg-rose-900/80" onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); touchKeysRef.current.w = true; }} onPointerUp={() => { touchKeysRef.current.w = false; }} onPointerCancel={() => { touchKeysRef.current.w = false; }} onLostPointerCapture={() => { touchKeysRef.current.w = false; }} aria-label="Mover para cima">↑</button>
      <div className="flex gap-1">{([['a','←','Mover para esquerda'],['s','↓','Mover para baixo'],['d','→','Mover para direita']] as const).map(([key, glyph, label]) => <button key={key} style={{ touchAction: 'none' }} className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/75 text-xl text-white shadow-lg backdrop-blur active:bg-rose-900/80" onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); touchKeysRef.current[key] = true; }} onPointerUp={() => { touchKeysRef.current[key] = false; }} onPointerCancel={() => { touchKeysRef.current[key] = false; }} onLostPointerCapture={() => { touchKeysRef.current[key] = false; }} aria-label={label}>{glyph}</button>)}</div>
    </div>}
    {phase === 'failed' && <div className="absolute inset-0 z-40 grid place-items-center bg-black/95 px-5 text-center"><div className="max-w-lg"><p className="font-serif-jp text-[10px] tracking-[.55em] text-rose-300/70">A MEMÓRIA SE FECHA</p><h2 className="mt-4 font-title text-3xl tracking-[.2em]">TUDO FICA PRETO</h2><p className="mt-4 font-serif-jp text-sm leading-7 text-neutral-400">As sombras alcançaram Gabriela. O sonho recomeça no instante antes da queda.</p><button onClick={retry} className="mt-8 border border-white/30 px-7 py-3 font-serif-jp text-[10px] tracking-[.3em] transition hover:border-rose-200 hover:bg-rose-950/50">TENTAR NOVAMENTE</button></div></div>}
    {phase === 'complete' && <button onClick={onComplete} className="absolute inset-0 z-40 grid place-items-center bg-[#050409]/95 px-5 text-center" aria-label="Acordar e continuar"><span><span className="block font-serif-jp text-[9px] tracking-[.6em] text-violet-200/65">A FUMAÇA SE DESFAZ</span><span className="mt-5 block font-title text-4xl tracking-[.25em]">GABRIELA ACORDA</span><span className="mt-5 block font-serif-jp text-sm leading-7 text-neutral-400">A luz cinzenta da manhã toca o quarto. O sonho fica para trás — mas a sensação não.</span><span className="mt-8 block font-serif-jp text-[9px] tracking-[.35em] text-neutral-500">CLIQUE PARA ABRIR OS OLHOS</span></span></button>}
  </div>;
};
