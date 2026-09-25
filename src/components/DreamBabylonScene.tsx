import React, { useEffect, useRef, useState } from 'react';
import {
  ArcRotateCamera, Color3, Color4, DynamicTexture, Engine, HemisphericLight,
  Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3,
} from '@babylonjs/core';
import { DialogueBox } from './DialogueBox';
import { DialogueNode, DialogueOption } from '../types/game';

interface Props { onComplete: () => void; initialPhase?: 'dialogue' | 'playing' | 'boss' }
const TOTAL = 6;
const SHEET = '/images/gabriela_sheet.png';
const SHADOW_DIALOGUE = [
  { question: 'Você realmente acha que está tudo bem?', choices: [['Quero entender o que está acontecendo.', 'Entender tudo não apaga o que você sente.'], ['Estou cansada. Só isso.', 'Você sempre encontra um nome simples para coisas difíceis.'], ['Não fale como se me conhecesse.', 'Eu conheço o que você tenta esconder.']] },
  { question: 'Você sente falta deles?', choices: [['Sim. Do meu pai e da minha mãe.', 'Então por que guarda a saudade como se fosse um segredo?'], ['Às vezes não lembro de tudo.', 'Esquecer detalhes também assusta, não é?'], ['Não quero falar sobre isso.', 'Você não precisa dizer em voz alta para continuar sentindo.']] },
  { question: 'Sua avó percebe quando você finge.', choices: [['Não quero preocupar ela.', 'E quem cuida de você quando decide cuidar de todos?'], ['Ela não precisa saber de tudo.', 'Mesmo assim, ela percebe quando você se afasta.'], ['Cale a boca.', 'Então me faça calar.']] },
] as const;
type Cue = { x: number; y: number; id: number; duration: number };
type Facing = 'down' | 'up' | 'left' | 'right';
const spriteCell = (direction: Facing, frame: number, moving: boolean) => {
  if (!moving) return direction === 'down' ? 0 : direction === 'up' ? 4 : 9;
  const step = frame % 4;
  if (direction === 'down') return [0, 1, 0, 2][step];
  if (direction === 'up') return [4, 3, 4, 7][step];
  return [9, 6, 9, 11][step];
};
const spriteMirror = (direction: Facing) => direction === 'right';

/** Babylon nightmare: the environments are 3D, while Gabriela and her copies use the game's 2D sprite. */
export const DreamBabylonScene: React.FC<Props> = ({ onComplete, initialPhase = 'dialogue' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [cue, setCue] = useState<Cue | null>(null);
  const [zoom, setZoom] = useState(27);
  const [bossHits, setBossHits] = useState(0);
  const [phase, setPhase] = useState<'dialogue' | 'playing' | 'boss' | 'failed' | 'complete'>(initialPhase);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [shadowReply, setShadowReply] = useState<{ answer: string; response: string; showingResponse: boolean } | null>(null);
  const stateRef = useRef({ round, hits, misses, cue, phase, bossHits });
  stateRef.current = { round, hits, misses, cue, phase, bossHits };
  const lastStrikeRef = useRef(0);
  const resolveRef = useRef<(success: boolean) => void>(() => {});
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  useEffect(() => { if (cameraRef.current) cameraRef.current.radius = zoom; }, [zoom]);
  const resolveCue = React.useCallback((success: boolean) => {
    const s = stateRef.current;
    if (!['playing', 'boss'].includes(s.phase) || !s.cue) return;
    const nextHits = s.hits + Number(success);
    const nextMisses = s.misses + Number(!success);
    const nextRound = s.round + Number(s.phase === 'playing');
    const nextBossHits = s.bossHits + Number(success && s.phase === 'boss');
    stateRef.current = { ...s, hits: nextHits, misses: nextMisses, round: nextRound, bossHits: nextBossHits, cue: null };
    setHits(nextHits); setMisses(nextMisses); setRound(nextRound); setBossHits(nextBossHits); setCue(null);
    if (nextMisses >= 4) { stateRef.current.phase = 'failed'; setPhase('failed'); }
    else if (s.phase === 'playing' && nextRound >= TOTAL) { stateRef.current.phase = 'boss'; setPhase('boss'); }
    else if (s.phase === 'boss' && nextBossHits >= 3) { stateRef.current.phase = 'complete'; setPhase('complete'); }
  }, []);
  resolveRef.current = resolveCue;

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'boss') return;
    let openTimer = 0; let expireTimer = 0;
    openTimer = window.setTimeout(() => {
      if (!['playing', 'boss'].includes(stateRef.current.phase)) return;
      const duration = phase === 'boss' ? 900 : 600 + Math.random() * 700;
      const nextCue = { x: 12 + Math.random() * 76, y: 19 + Math.random() * 62, id: performance.now(), duration };
      stateRef.current.cue = nextCue; setCue(nextCue);
      expireTimer = window.setTimeout(() => resolveRef.current(false), duration);
    }, 800 + Math.random() * 1250);
    return () => { window.clearTimeout(openTimer); window.clearTimeout(expireTimer); };
  }, [phase, round, bossHits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: Engine;
    try { engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, powerPreference: 'high-performance' }); }
    catch { return; }
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.95, 0.97, 0.99, 1);
    const camera = new ArcRotateCamera('dream-camera', -Math.PI / 2, 1.05, 27, new Vector3(0, 0.8, 0), scene);
    cameraRef.current = camera;
    camera.lowerRadiusLimit = 10; camera.upperRadiusLimit = 38; camera.radius = 27; camera.inputs.clear();
    new HemisphericLight('white-room-light', new Vector3(0.2, 1, -0.2), scene).intensity = 1.1;
    const floor = MeshBuilder.CreateGround('endless-white-floor', { width: 120, height: 120 }, scene);
    const floorMat = new StandardMaterial('floor-white', scene); floorMat.diffuseColor = new Color3(0.79, 0.81, 0.86); floorMat.specularColor = Color3.Black(); floor.material = floorMat;

    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogColor = new Color3(0.78, 0.8, 0.86); scene.fogDensity = 0.009;
    // Faint concentric scars make the dream feel like a much larger, broken space.
    const scarMat = new StandardMaterial('dream-scar-material', scene);
    scarMat.diffuseColor = Color3.Black(); scarMat.emissiveColor = new Color3(0.16, 0.18, 0.24); scarMat.alpha = 0.34; scarMat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND; scarMat.specularColor = Color3.Black();
    [18, 25, 33].forEach((diameter, i) => {
      const scar = MeshBuilder.CreateTorus(`dream-floor-scar-${i}`, { diameter, thickness: 0.035, tessellation: 96 }, scene);
      scar.position.y = 0.025 + i * 0.004; scar.rotation.x = Math.PI / 2; scar.material = scarMat;
    });
    const heroPos = new Vector3(0, 0, 0);
    let spriteImage: HTMLImageElement | null = null;
    const drawSpriteFrame = (texture: DynamicTexture, cell: number, black: boolean, mirror: boolean) => {
      if (!spriteImage) return;
      const sourceW = spriteImage.naturalWidth * 0.13;
      const sourceH = spriteImage.naturalHeight * (0.97 / 3);
      const width = Math.max(1, Math.round(sourceW)); const height = Math.max(1, Math.round(sourceH));
      if (texture.getSize().width !== width || texture.getSize().height !== height) texture.scaleTo(width, height);
      const ctx = texture.getContext(); ctx.clearRect(0, 0, width, height);
      if (mirror) { ctx.save(); ctx.translate(width, 0); ctx.scale(-1, 1); }
      const col = cell % 4; const row = Math.floor(cell / 4);
      ctx.drawImage(spriteImage, (col + 0.24) / 4 * spriteImage.naturalWidth, (row + 0.015) / 3 * spriteImage.naturalHeight,
        sourceW, sourceH, 0, 0, width, height);
      if (mirror) ctx.restore();
      const pixels = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        if (Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) > 218) pixels.data[i + 3] = 0;
        if (black && pixels.data[i + 3] > 0) pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0;
      }
      ctx.putImageData(pixels, 0, 0); texture.hasAlpha = true; texture.update(true);
    };
    const makeSprite = (name: string, texture: DynamicTexture, black: boolean, pos: Vector3): Mesh => {
      const plane = MeshBuilder.CreatePlane(name, { width: 1.8, height: 3.0 }, scene);
      plane.position.copyFrom(pos); plane.position.y = 1.12; plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      const mat = new StandardMaterial(`${name}-mat`, scene);
      mat.diffuseTexture = texture; mat.opacityTexture = texture; mat.useAlphaFromDiffuseTexture = true;
      mat.diffuseColor = black ? new Color3(0.015, 0.018, 0.025) : Color3.White();
      mat.emissiveColor = black ? new Color3(0.008, 0.009, 0.012) : new Color3(0.08, 0.08, 0.08);
      mat.specularColor = Color3.Black(); mat.backFaceCulling = false; mat.disableLighting = false; mat.alphaCutOff = 0.06;
      plane.material = mat;
      return plane;
    };
    const playerTexture = new DynamicTexture('gabriela-sprite', { width: 1, height: 1 }, scene, false);
    const player = makeSprite('gabriela-player', playerTexture, false, heroPos);
    const shadowTexture = new DynamicTexture('first-shadow-sprite', { width: 1, height: 1 }, scene, false);
    const firstShadow = makeSprite('first-shadow', shadowTexture, true, new Vector3(0, 1.12, -4.5));
    const giant = new TransformNode('giant-shadow-root', scene);
    const bossMat = new StandardMaterial('giant-shadow-material', scene);
    bossMat.diffuseColor = new Color3(0.018, 0.022, 0.035); bossMat.emissiveColor = new Color3(0.025, 0.018, 0.04); bossMat.specularColor = Color3.Black();
    const bossRim = new StandardMaterial('giant-shadow-rim', scene);
    bossRim.diffuseColor = Color3.Black(); bossRim.emissiveColor = new Color3(0.28, 0.08, 0.24); bossRim.specularColor = Color3.Black();
    const bossPart = (name: string, mesh: Mesh, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, material = bossMat) => {
      mesh.name = name; mesh.parent = giant; mesh.position.set(x, y, z); mesh.scaling.set(sx, sy, sz); mesh.material = material; return mesh;
    };
    bossPart('giant-coat', MeshBuilder.CreateCylinder('giant-coat', { height: 5.5, diameterTop: 1.35, diameterBottom: 3.25, tessellation: 7 }, scene), 0, 3.6, 0, 1, 1, 0.72);
    bossPart('giant-neck', MeshBuilder.CreateCylinder('giant-neck', { height: 0.65, diameter: 0.7, tessellation: 8 }, scene), 0, 6.2, 0);
    bossPart('giant-head', MeshBuilder.CreateSphere('giant-head', { diameter: 1.8, segments: 8 }, scene), 0, 7.35, 0, 0.78, 1.15, 0.75);
    bossPart('giant-hair', MeshBuilder.CreateSphere('giant-hair', { diameter: 2.0, segments: 7 }, scene), 0, 7.8, -0.22, 0.92, 0.76, 0.9);
    [-1, 1].forEach((side, i) => {
      bossPart(`giant-arm-${i}`, MeshBuilder.CreateCylinder(`giant-arm-${i}`, { height: 4.25, diameterTop: 0.38, diameterBottom: 0.58, tessellation: 7 }, scene), side * 1.65, 3.9, 0.05, 1, 1, 1).rotation.z = side * -0.12;
      bossPart(`giant-leg-${i}`, MeshBuilder.CreateCylinder(`giant-leg-${i}`, { height: 2.35, diameter: 0.68, tessellation: 7 }, scene), side * 0.62, 0.8, 0);
      const eye = bossPart(`giant-eye-${i}`, MeshBuilder.CreateBox(`giant-eye-${i}`, { width: 0.34, height: 0.075, depth: 0.05 }, scene), side * 0.32, 7.38, 0.69, 1, 1, 1, bossRim);
      eye.rotation.z = side * -0.08;
    });
    giant.position.set(0, -8, -8); giant.setEnabled(false);
    const riftMat = new StandardMaterial('rift-glow-material', scene); riftMat.diffuseColor = Color3.Black(); riftMat.emissiveColor = new Color3(0.22, 0.035, 0.2); riftMat.specularColor = Color3.Black();
    const rift = MeshBuilder.CreateTorus('boss-rift', { diameter: 5.4, thickness: 0.16, tessellation: 48 }, scene);
    rift.rotation.x = Math.PI / 2; rift.position.set(0, 0.06, -8); rift.material = riftMat; rift.setEnabled(false);
    const copyTextures: DynamicTexture[] = [];
    const copies = Array.from({ length: TOTAL }, (_, i) => {
      const angle = i / TOTAL * Math.PI * 2;
      const texture = new DynamicTexture(`shadow-sprite-${i}`, { width: 1, height: 1 }, scene, false);
      copyTextures.push(texture);
      return makeSprite(`shadow-copy-${i + 1}`, texture, true, new Vector3(Math.cos(angle) * 16, 1.12, Math.sin(angle) * 16));
    });
    let lastHeroCell = '';
    const lastCopyCell = Array(TOTAL).fill('');
    const image = new Image(); image.src = SHEET;
    image.onload = () => {
      spriteImage = image;
      [playerTexture, shadowTexture, ...copyTextures].forEach((texture) => { texture.wrapU = texture.wrapV = 0; texture.anisotropicFilteringLevel = 1; texture.updateSamplingMode(1); });
      drawSpriteFrame(playerTexture, 0, false, false);
      drawSpriteFrame(shadowTexture, 9, true, false);
      copyTextures.forEach((texture) => drawSpriteFrame(texture, 9, true, false));
    };

    const anomalyMats = [0xf3a6ff, 0x97e8ff].map((color, i) => {
      const material = new StandardMaterial(`dream-anomaly-glow-${i}`, scene);
      material.diffuseColor = Color3.Black();
      material.emissiveColor = Color3.FromHexString(`#${color.toString(16)}`);
      material.specularColor = Color3.Black();
      return material;
    });
    const anomalies = Array.from({ length: TOTAL }, (_, i) => {
      const angle = i / TOTAL * Math.PI * 2;
      const ring = MeshBuilder.CreateTorus(`dream-anomaly-${i + 1}`, { diameter: 1.05, thickness: 0.055, tessellation: 16 }, scene);
      ring.position.set(Math.cos(angle) * 10.5, 1.45 + (i % 2) * 0.55, Math.sin(angle) * 10.5);
      ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
      ring.material = anomalyMats[i % anomalyMats.length];
      return ring;
    });

    const keys = new Set<string>();
    let walkTarget: Vector3 | null = null;
    const clickMove = (event: PointerEvent) => {
      if (!['playing', 'boss'].includes(stateRef.current.phase)) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * engine.getRenderWidth() / rect.width;
      const y = (event.clientY - rect.top) * engine.getRenderHeight() / rect.height;
      const pick = scene.pick(x, y, (mesh) => mesh === floor);
      if (!pick?.hit || !pick.pickedPoint) return;
      walkTarget = new Vector3(Math.max(-13, Math.min(13, pick.pickedPoint.x)), 0, Math.max(-12, Math.min(12, pick.pickedPoint.z)));
    };
    canvas.addEventListener('pointerdown', clickMove);
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === '+' || key === '=') { e.preventDefault(); setZoom((v) => Math.max(10, v - 2)); }
      else if (key === '-' || key === '_') { e.preventDefault(); setZoom((v) => Math.min(38, v + 2)); }
      else if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { e.preventDefault(); keys.add(key); }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const wheel = (e: WheelEvent) => { e.preventDefault(); setZoom((v) => Math.max(10, Math.min(38, v + Math.sign(e.deltaY) * 1.5))); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    let elapsed = 0;
    let bossRise = 0;
    engine.runRenderLoop(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); elapsed += dt;
      const s = stateRef.current;
      camera.target.copyFromFloats(heroPos.x, 0.8, heroPos.z);
      scene.clearColor = s.phase === 'playing' || s.phase === 'boss' ? new Color4(0.97 - s.misses * 0.055, 0.975 - s.misses * 0.07, 0.99 - s.misses * 0.055, 1) : new Color4(0.002, 0.003, 0.006, 1);
      scene.fogDensity = 0.012 + s.misses * 0.008;
      let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      let dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      if (dx || dz) walkTarget = null;
      else if (walkTarget) {
        dx = walkTarget.x - heroPos.x; dz = walkTarget.z - heroPos.z;
        if (Math.hypot(dx, dz) < 0.16) { walkTarget = null; dx = dz = 0; }
      }
      const len = Math.hypot(dx, dz) || 1;
      const speed = 3.8 + s.misses * 0.25;
      const moveX = dx / len * dt * speed; const moveZ = dz / len * dt * speed;
      heroPos.x = Math.max(-13, Math.min(13, heroPos.x + moveX));
      heroPos.z = Math.max(-12, Math.min(12, heroPos.z + moveZ));
      player.position.x = heroPos.x; player.position.z = heroPos.z;
      const playerMoving = Boolean(moveX || moveZ);
      player.position.y = 1.12 + Math.abs(Math.sin(elapsed * 9)) * (playerMoving ? 0.12 : 0.025);
      player.rotation.z = playerMoving && dx ? Math.sign(dx) * Math.sin(elapsed * 10) * 0.025 : 0;
      let playerFacing: Facing = lastHeroCell ? lastHeroCell.split(':')[2] as Facing : 'down';
      if (playerMoving) playerFacing = Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : dz < 0 ? 'up' : 'down';
      const playerFrame = Math.floor(elapsed * 9) % 4;
      const playerCell = spriteCell(playerFacing, playerFrame, playerMoving);
      const mirror = spriteMirror(playerFacing);
      const heroKey = `${playerCell}:${mirror}:${playerFacing}`;
      if (spriteImage && heroKey !== lastHeroCell) { drawSpriteFrame(playerTexture, playerCell, false, mirror); lastHeroCell = heroKey; }
      const chaseBoost = 1 + s.misses * 0.24;
      copies.forEach((copy, i) => {
        copy.setEnabled(s.phase === 'playing' && elapsed > i * 0.48);
        anomalies[i].setEnabled(i >= s.hits && s.phase === 'playing');
        const vx = heroPos.x - copy.position.x; const vz = heroPos.z - copy.position.z;
        const distance = Math.hypot(vx, vz) || 1;
        const speed = (0.28 + s.misses * 0.34) * chaseBoost;
        if (s.phase === 'playing' && elapsed > i * 0.48) {
          copy.position.x += vx / distance * Math.min(distance, dt * speed);
          copy.position.z += vz / distance * Math.min(distance, dt * speed);
        }
        copy.position.y = 1.12 + Math.abs(Math.sin(elapsed * 8 + i)) * 0.1;
        copy.rotation.z = Math.sin(elapsed * 9 + i) * 0.045;
        const facing: Facing = Math.abs(vx) > Math.abs(vz) ? (vx < 0 ? 'left' : 'right') : vz < 0 ? 'up' : 'down';
        const cell = spriteCell(facing, Math.floor(elapsed * 9 + i) % 4, true);
        const mirror = spriteMirror(facing);
        const key = `${cell}:${mirror}`;
        if (spriteImage && key !== lastCopyCell[i]) { drawSpriteFrame(copyTextures[i], cell, true, mirror); lastCopyCell[i] = key; }
        copy.rotation.y = Math.sin(elapsed * 5 + i) * 0.05;
      });
      firstShadow.setEnabled(s.phase === 'dialogue');
      giant.setEnabled(s.phase === 'boss'); rift.setEnabled(s.phase === 'boss');
      if (s.phase === 'boss') {
        bossRise = Math.min(3, bossRise + dt);
        giant.position.x = heroPos.x + Math.sin(elapsed * 0.65) * 0.7;
        giant.position.z = heroPos.z - 8;
        giant.position.y = -8 + bossRise * 2.65;
        giant.rotation.z = Math.sin(elapsed * 1.2) * 0.025;
        rift.position.x = giant.position.x; rift.position.z = giant.position.z;
        camera.radius += (Math.max(17, zoom - 5) - camera.radius) * Math.min(1, dt * 1.3);
      }
      camera.target.copyFromFloats(heroPos.x + Math.sin(elapsed * 31) * s.misses * 0.04, 0.8, heroPos.z + Math.cos(elapsed * 27) * s.misses * 0.04);
      camera.fov = 0.88 + s.misses * 0.022;
      scene.render();
    });
    const resize = () => engine.resize(); window.addEventListener('resize', resize);
    return () => { cameraRef.current = null; window.removeEventListener('resize', resize); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('pointerdown', clickMove); engine.stopRenderLoop(); scene.dispose(); engine.dispose(); };
  }, []);

  const strike = () => {
    if (phase !== 'playing' && phase !== 'boss') return;
    const now = performance.now(); if (now - lastStrikeRef.current < 180) return; lastStrikeRef.current = now;
    resolveRef.current(true);
  };
  const retry = () => {
    lastStrikeRef.current = 0;
    stateRef.current = { round: 0, hits: 0, misses: 0, cue: null, phase: initialPhase, bossHits: 0 };
    setRound(0); setHits(0); setMisses(0); setBossHits(0); setCue(null); setPhase(initialPhase); setDialogueIndex(0); setShadowReply(null); setZoom(27);
  };
  const currentShadowLine = SHADOW_DIALOGUE[dialogueIndex];
  const shadowNode: DialogueNode | null = phase !== 'dialogue' ? null : shadowReply
    ? {
        id: `shadow-${shadowReply.showingResponse ? 'reaction' : 'answer'}-${dialogueIndex}`,
        speaker: shadowReply.showingResponse ? 'Desconhecido' : 'Gabriela',
        speakerTitle: shadowReply.showingResponse ? 'A Sombra' : undefined,
        avatar: shadowReply.showingResponse ? 'unknown_shadow' : 'gabriela',
        text: shadowReply.showingResponse ? shadowReply.response : shadowReply.answer,
        next: shadowReply.showingResponse ? 'shadow-continue' : 'shadow-reaction',
      }
    : {
        id: `shadow-question-${dialogueIndex}`,
        speaker: 'Desconhecido', speakerTitle: 'A Sombra', avatar: 'unknown_shadow',
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
      setShadowReply(null); stateRef.current.phase = 'playing'; setPhase('playing'); return;
    }
    setDialogueIndex((index) => index + 1); setShadowReply(null);
  };
  return <div className="fixed inset-0 z-[70] bg-black text-white">
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Gabriela foge de cópias sombrias no espaço branco" />
    <div aria-hidden="true" className="dream-warp-layer absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 18% 26%, rgba(255,55,85,${0.08 + misses * 0.07}), transparent 42%), radial-gradient(ellipse at 80% 74%, rgba(105,90,255,${0.08 + misses * 0.06}), transparent 45%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.04) 0 1px, transparent 2px 5px)`, mixBlendMode: 'screen', opacity: 0.45 + misses * 0.12, backdropFilter: `blur(${0.6 + misses * 0.55}px) saturate(${0.75 - misses * 0.04})` }} />
    {shadowNode && <DialogueBox cinematic node={shadowNode} onSelectOption={chooseShadowAnswer} onNext={advanceShadowDialogue} onClose={advanceShadowDialogue} />}
    {(phase === 'playing' || phase === 'boss') && <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-sm border border-white/50 bg-black/65 px-5 py-3 text-center font-serif-jp text-sm tracking-wide text-white shadow-xl">{phase === 'boss' ? (['A sombra ergue o braço.', 'O chão treme sob os passos dela.', 'A fenda se abre ainda mais.'][bossHits] ?? 'A sombra se prepara para atacar.') : 'Clique no chão para caminhar ou use WASD / setas. Toque nas marcas antes que desapareçam.'}</div>
      {cue && <button onClick={strike} className="pointer-events-auto absolute z-10 grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-red-100/90 bg-red-950/55 shadow-[0_0_42px_rgba(255,55,75,.9)] animate-pulse" style={{ left: `${cue.x}%`, top: `${cue.y}%` }} aria-label="Toque rápido: acerte o evento no tempo">
        <span className="absolute inset-1 rounded-full border border-white/80" /><span className="h-2 w-2 rounded-full bg-white shadow-[0_0_14px_#fff]" />
        <span className="absolute -bottom-2 left-1 right-1 h-1 overflow-hidden rounded bg-black/60"><span className="block h-full origin-left bg-red-200" style={{ animation: `dreamCueDrain ${cue.duration}ms linear forwards` }} /></span>
      </button>}
      {!cue && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded border border-white/20 bg-black/35 px-4 py-2 font-serif-jp text-[11px] tracking-[0.2em] text-white/60">NÃO OLHE PARA TRÁS</div>}
      <div className="absolute bottom-7 right-7 flex items-center gap-2 rounded-full border border-white/30 bg-black/65 px-3 py-2 pointer-events-auto">
        <button onClick={() => setZoom((v) => Math.min(38, v + 2))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15" aria-label="Afastar zoom">−</button>
        <span className="min-w-12 text-center font-mono text-[10px]">{(27 / zoom).toFixed(1)}×</span>
        <button onClick={() => setZoom((v) => Math.max(10, v - 2))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15" aria-label="Aproximar zoom">+</button>
      </div>
      <div className="absolute bottom-5 left-6 font-serif-jp text-xs tracking-[0.3em]">{phase === 'boss' ? `BOSS ${bossHits}/3` : `ACERTOS ${hits}/6`} <span className="mx-3 text-red-300">SAN {Math.max(0, 100 - misses * 10)}/100</span></div>
    </div>}
    {phase === 'failed' && <div className="absolute inset-0 grid place-items-center bg-black text-center"><div><p className="font-serif-jp text-sm tracking-[0.3em] text-neutral-400">TUDO FICA PRETO</p><p className="mt-3 text-2xl">As sombras alcançaram Gabriela.</p><button onClick={retry} className="mt-8 border border-neutral-500 px-6 py-3 font-serif-jp text-sm hover:bg-white hover:text-black">Tentar novamente</button></div></div>}
    {phase === 'complete' && <button onClick={onComplete} className="absolute inset-0 grid place-items-center bg-black text-center" aria-label="Continuar para o Capítulo 1"><span><span className="block font-serif-jp text-xs tracking-[0.5em] text-neutral-500">A MANHÃ DESAPARECE</span><span className="mt-5 block font-title text-4xl tracking-[0.25em]">CAPÍTULO 1</span><span className="mt-8 block font-serif-jp text-xs tracking-[0.3em] text-neutral-500">CLIQUE PARA CONTINUAR</span></span></button>}
  </div>;
};
