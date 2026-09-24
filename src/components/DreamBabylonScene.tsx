import React, { useEffect, useRef, useState } from 'react';
import {
  ArcRotateCamera, Color3, Color4, DynamicTexture, Engine, HemisphericLight,
  Mesh, MeshBuilder, Scene, StandardMaterial, Vector3,
} from '@babylonjs/core';

interface Props { onComplete: () => void }
const TOTAL = 6;
const SHEET = '/images/gabriela_sheet.png';
type Cue = { x: number; y: number; id: number; duration: number };
type Facing = 'down' | 'up' | 'left' | 'right';
const spriteCell = (direction: Facing, frame: number, moving: boolean) => {
  if (!moving) return direction === 'down' ? 0 : direction === 'up' ? 4 : 9;
  const step = frame % 4;
  if (direction === 'down') return [0, 1, 0, 2][step];
  if (direction === 'up') return [4, 3, 4, 7][step];
  return [9, 6, 9, 11][step];
};
const spriteMirror = (direction: Facing, cell: number) => direction === 'right' ? cell === 9 : direction === 'left' ? cell !== 9 : false;

/** Babylon nightmare: the environments are 3D, while Gabriela and her copies use the game's 2D sprite. */
export const DreamBabylonScene: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [cue, setCue] = useState<Cue | null>(null);
  const [zoom, setZoom] = useState(27);
  const [phase, setPhase] = useState<'playing' | 'failed' | 'complete'>('playing');
  const stateRef = useRef({ round, hits, misses, cue, phase });
  stateRef.current = { round, hits, misses, cue, phase };
  const lastStrikeRef = useRef(0);
  const resolveRef = useRef<(success: boolean) => void>(() => {});
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  useEffect(() => { if (cameraRef.current) cameraRef.current.radius = zoom; }, [zoom]);
  const resolveCue = React.useCallback((success: boolean) => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || !s.cue) return;
    const nextHits = s.hits + Number(success);
    const nextMisses = s.misses + Number(!success);
    const nextRound = s.round + 1;
    stateRef.current = { ...s, hits: nextHits, misses: nextMisses, round: nextRound, cue: null };
    setHits(nextHits); setMisses(nextMisses); setRound(nextRound); setCue(null);
    if (nextMisses >= 4) { stateRef.current.phase = 'failed'; setPhase('failed'); }
    else if (nextRound >= TOTAL) { stateRef.current.phase = 'complete'; setPhase('complete'); }
  }, []);
  resolveRef.current = resolveCue;

  useEffect(() => {
    if (phase !== 'playing') return;
    let openTimer = 0; let expireTimer = 0;
    openTimer = window.setTimeout(() => {
      if (stateRef.current.phase !== 'playing') return;
      const duration = 600 + Math.random() * 700;
      const nextCue = { x: 12 + Math.random() * 76, y: 19 + Math.random() * 62, id: performance.now(), duration };
      stateRef.current.cue = nextCue; setCue(nextCue);
      expireTimer = window.setTimeout(() => resolveRef.current(false), duration);
    }, 800 + Math.random() * 1250);
    return () => { window.clearTimeout(openTimer); window.clearTimeout(expireTimer); };
  }, [phase, round]);

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
      [playerTexture, ...copyTextures].forEach((texture) => { texture.wrapU = texture.wrapV = 0; texture.anisotropicFilteringLevel = 1; texture.updateSamplingMode(1); });
      drawSpriteFrame(playerTexture, 0, false, false);
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
    engine.runRenderLoop(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); elapsed += dt;
      const s = stateRef.current;
      camera.target.copyFromFloats(heroPos.x, 0.8, heroPos.z);
      scene.clearColor = s.phase === 'playing' ? new Color4(0.97 - s.misses * 0.055, 0.975 - s.misses * 0.07, 0.99 - s.misses * 0.055, 1) : new Color4(0.002, 0.003, 0.006, 1);
      scene.fogDensity = 0.012 + s.misses * 0.008;
      const dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      const len = Math.hypot(dx, dz) || 1;
      heroPos.x = Math.max(-13, Math.min(13, heroPos.x + dx / len * dt * (3.8 + s.misses * 0.25)));
      heroPos.z = Math.max(-12, Math.min(12, heroPos.z + dz / len * dt * (3.8 + s.misses * 0.25)));
      player.position.x = heroPos.x; player.position.z = heroPos.z;
      player.position.y = 1.12 + Math.abs(Math.sin(elapsed * 9)) * (dx || dz ? 0.12 : 0.025);
      player.rotation.z = dx ? Math.sign(dx) * Math.sin(elapsed * 10) * 0.035 : 0;
      const playerMoving = Boolean(dx || dz);
      const playerFacing: Facing = Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : dz < 0 ? 'up' : 'down';
      const playerFrame = Math.floor(elapsed * 9) % 4;
      const playerCell = spriteCell(playerFacing, playerFrame, playerMoving);
      const heroKey = `${playerCell}:${spriteMirror(playerFacing, playerCell)}`;
      if (spriteImage && heroKey !== lastHeroCell) { drawSpriteFrame(playerTexture, playerCell, false, spriteMirror(playerFacing, playerCell)); lastHeroCell = heroKey; }
      const chaseBoost = 1 + s.misses * 0.24;
      copies.forEach((copy, i) => {
        anomalies[i].setEnabled(i >= s.hits && s.phase === 'playing');
        const vx = heroPos.x - copy.position.x; const vz = heroPos.z - copy.position.z;
        const distance = Math.hypot(vx, vz) || 1;
        const speed = (0.28 + s.misses * 0.34) * chaseBoost;
        copy.position.x += vx / distance * Math.min(distance, dt * speed);
        copy.position.z += vz / distance * Math.min(distance, dt * speed);
        copy.position.y = 1.12 + Math.abs(Math.sin(elapsed * 8 + i)) * 0.1;
        copy.rotation.z = Math.sin(elapsed * 9 + i) * 0.045;
        const facing: Facing = Math.abs(vx) > Math.abs(vz) ? (vx < 0 ? 'left' : 'right') : vz < 0 ? 'up' : 'down';
        const cell = spriteCell(facing, Math.floor(elapsed * 9 + i) % 4, true);
        const mirror = spriteMirror(facing, cell);
        const key = `${cell}:${mirror}`;
        if (spriteImage && key !== lastCopyCell[i]) { drawSpriteFrame(copyTextures[i], cell, true, mirror); lastCopyCell[i] = key; }
        copy.rotation.y = Math.sin(elapsed * 5 + i) * 0.05;
      });
      camera.target.copyFromFloats(heroPos.x + Math.sin(elapsed * 31) * s.misses * 0.04, 0.8, heroPos.z + Math.cos(elapsed * 27) * s.misses * 0.04);
      camera.fov = 0.88 + s.misses * 0.022;
      scene.render();
    });
    const resize = () => engine.resize(); window.addEventListener('resize', resize);
    return () => { cameraRef.current = null; window.removeEventListener('resize', resize); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); canvas.removeEventListener('wheel', wheel); engine.stopRenderLoop(); scene.dispose(); engine.dispose(); };
  }, []);

  const strike = () => {
    if (phase !== 'playing') return;
    const now = performance.now(); if (now - lastStrikeRef.current < 180) return; lastStrikeRef.current = now;
    resolveRef.current(true);
  };
  const retry = () => {
    lastStrikeRef.current = 0;
    stateRef.current = { round: 0, hits: 0, misses: 0, cue: null, phase: 'playing' };
    setRound(0); setHits(0); setMisses(0); setCue(null); setPhase('playing'); setZoom(27);
  };
  return <div className="fixed inset-0 z-[70] bg-black text-white">
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Gabriela foge de cópias sombrias no espaço branco" />
    <div aria-hidden="true" className="dream-warp-layer absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 18% 26%, rgba(255,55,85,${0.08 + misses * 0.07}), transparent 42%), radial-gradient(ellipse at 80% 74%, rgba(105,90,255,${0.08 + misses * 0.06}), transparent 45%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.04) 0 1px, transparent 2px 5px)`, mixBlendMode: 'screen', opacity: 0.45 + misses * 0.12, backdropFilter: `blur(${0.6 + misses * 0.55}px) saturate(${0.75 - misses * 0.04})` }} />
    {phase === 'playing' && <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-sm border border-white/50 bg-black/65 px-5 py-3 text-center font-serif-jp text-sm tracking-wide text-white shadow-xl">WASD / setas: fuja. As marcas surgem por instantes; toque nelas antes que desapareçam.</div>
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
      <div className="absolute bottom-5 left-6 font-serif-jp text-xs tracking-[0.3em]">ACERTOS {hits}/6 <span className="mx-3 text-red-300">ERROS {misses}/4</span></div>
    </div>}
    {phase === 'failed' && <div className="absolute inset-0 grid place-items-center bg-black text-center"><div><p className="font-serif-jp text-sm tracking-[0.3em] text-neutral-400">TUDO FICA PRETO</p><p className="mt-3 text-2xl">As sombras alcançaram Gabriela.</p><button onClick={retry} className="mt-8 border border-neutral-500 px-6 py-3 font-serif-jp text-sm hover:bg-white hover:text-black">Tentar novamente</button></div></div>}
    {phase === 'complete' && <button onClick={onComplete} className="absolute inset-0 grid place-items-center bg-black text-center" aria-label="Continuar para o Capítulo 1"><span><span className="block font-serif-jp text-xs tracking-[0.5em] text-neutral-500">A MANHÃ DESAPARECE</span><span className="mt-5 block font-title text-4xl tracking-[0.25em]">CAPÍTULO 1</span><span className="mt-8 block font-serif-jp text-xs tracking-[0.3em] text-neutral-500">CLIQUE PARA CONTINUAR</span></span></button>}
  </div>;
};
