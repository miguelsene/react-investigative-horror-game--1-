import React, { useEffect, useRef, useState } from 'react';
import {
  ArcRotateCamera, Color3, Color4, DynamicTexture, Engine, HemisphericLight,
  Mesh, MeshBuilder, Scene, StandardMaterial, Vector3,
} from '@babylonjs/core';

interface Props { onComplete: () => void }
const TOTAL = 6;
const makeTone = () => 1.25 + Math.random() * 0.65;
const SHEET = '/images/gabriela_sheet.png';

/** Babylon nightmare: the environments are 3D, while Gabriela and her copies use the game's 2D sprite. */
export const DreamBabylonScene: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [tone, setTone] = useState(makeTone);
  const [phase, setPhase] = useState<'playing' | 'failed' | 'complete'>('playing');
  const stateRef = useRef({ round, hits, misses, tone, phase });
  stateRef.current = { round, hits, misses, tone, phase };
  const lastStrikeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: Engine;
    try { engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, powerPreference: 'high-performance' }); }
    catch { return; }
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.95, 0.97, 0.99, 1);
    const camera = new ArcRotateCamera('dream-camera', -Math.PI / 2, 1.05, 21, new Vector3(0, 0.8, 0), scene);
    camera.lowerRadiusLimit = 21; camera.upperRadiusLimit = 21; camera.inputs.clear();
    new HemisphericLight('white-room-light', new Vector3(0.2, 1, -0.2), scene).intensity = 1.1;
    const floor = MeshBuilder.CreateGround('endless-white-floor', { width: 80, height: 80 }, scene);
    const floorMat = new StandardMaterial('floor-white', scene); floorMat.diffuseColor = new Color3(0.98, 0.985, 0.99); floorMat.specularColor = Color3.Black(); floor.material = floorMat;

    const heroPos = new Vector3(0, 0, 0);
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
    const shadowTexture = new DynamicTexture('shadow-sprite', { width: 1, height: 1 }, scene, false);
    const player = makeSprite('gabriela-player', playerTexture, false, heroPos);
    const copies = Array.from({ length: TOTAL }, (_, i) => {
      const angle = i / TOTAL * Math.PI * 2;
      return makeSprite(`shadow-copy-${i + 1}`, shadowTexture, true, new Vector3(Math.cos(angle) * 8, 1.12, Math.sin(angle) * 8));
    });
    const sheetTextureFor = (texture: DynamicTexture, image: HTMLImageElement, shadow: boolean) => {
      const c = document.createElement('canvas'); c.width = image.naturalWidth; c.height = image.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const white = Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
        if (white > 218) pixels.data[i + 3] = 0;
        else if (shadow) { pixels.data[i] = 0; pixels.data[i + 1] = 0; pixels.data[i + 2] = 0; }
      }
      ctx.putImageData(pixels, 0, 0);
      texture.scaleTo(c.width, c.height);
      texture.getContext().drawImage(c, 0, 0); texture.update(true);
      texture.hasAlpha = true; texture.wrapU = texture.wrapV = 0; texture.anisotropicFilteringLevel = 1;
      texture.updateSamplingMode(2);
    };
    const image = new Image(); image.src = SHEET;
    image.onload = () => { sheetTextureFor(playerTexture, image, false); sheetTextureFor(shadowTexture, image, true); };

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
      ring.position.set(Math.cos(angle) * 7.5, 1.45 + (i % 2) * 0.55, Math.sin(angle) * 7.5);
      ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
      ring.material = anomalyMats[i % anomalyMats.length];
      return ring;
    });

    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { e.preventDefault(); keys.add(key); } };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    let elapsed = 0;
    engine.runRenderLoop(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); elapsed += dt;
      const s = stateRef.current;
      camera.target.copyFromFloats(heroPos.x, 0.8, heroPos.z);
      scene.clearColor = s.phase === 'playing' ? new Color4(0.95 - s.round * 0.02, 0.97 - s.round * 0.02, 0.99 - s.round * 0.015, 1) : new Color4(0.002, 0.003, 0.006, 1);
      const dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      const len = Math.hypot(dx, dz) || 1;
      heroPos.x = Math.max(-5.7, Math.min(5.7, heroPos.x + dx / len * dt * 3.5));
      heroPos.z = Math.max(-5.2, Math.min(5.2, heroPos.z + dz / len * dt * 3.5));
      player.position.x = heroPos.x; player.position.z = heroPos.z;
      player.position.y = 1.12 + Math.abs(Math.sin(elapsed * 9)) * (dx || dz ? 0.12 : 0.025);
      player.rotation.z = dx ? Math.sign(dx) * Math.sin(elapsed * 10) * 0.035 : 0;
      const row = dz < -0.1 ? 1 : dz > 0.1 ? 0 : 2;
      const col = dx < -0.1 ? 1 : dx > 0.1 ? 2 : Math.floor(elapsed * 3) % 2;
      const playerMat = player.material as StandardMaterial;
      const playerTex = playerMat.diffuseTexture as DynamicTexture;
      playerTex.uScale = 0.25; playerTex.vScale = 1 / 3; playerTex.uOffset = col * 0.25; playerTex.vOffset = 1 - (row + 1) / 3;
      const chaseBoost = 1 + s.misses * 0.35;
      copies.forEach((copy, i) => {
        anomalies[i].setEnabled(i >= s.hits && s.phase === 'playing');
        const vx = heroPos.x - copy.position.x; const vz = heroPos.z - copy.position.z;
        const distance = Math.hypot(vx, vz) || 1;
        const speed = (0.23 + s.misses * 0.21) * chaseBoost;
        copy.position.x += vx / distance * Math.min(distance, dt * speed);
        copy.position.z += vz / distance * Math.min(distance, dt * speed);
        copy.position.y = 1.12 + Math.abs(Math.sin(elapsed * 8 + i)) * 0.1;
        copy.rotation.z = Math.sin(elapsed * 4 + i) * 0.025;
        const tex = (copy.material as StandardMaterial).diffuseTexture as DynamicTexture;
        tex.uScale = 0.25; tex.vScale = 1 / 3; tex.uOffset = (Math.floor(elapsed * 3 + i) % 2) * 0.25; tex.vOffset = 1 - 1 / 3;
      });
      scene.render();
    });
    const resize = () => engine.resize(); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); engine.stopRenderLoop(); scene.dispose(); engine.dispose(); };
  }, []);

  useEffect(() => { if (phase !== 'playing') return; const id = window.setInterval(() => setTone(makeTone()), 500); return () => window.clearInterval(id); }, [round, phase]);
  const strike = () => {
    if (phase !== 'playing') return;
    const now = performance.now(); if (now - lastStrikeRef.current < 500) return; lastStrikeRef.current = now;
    const s = stateRef.current; const success = Math.abs(s.tone - 1.6) < 0.22;
    const nextHits = s.hits + Number(success); const nextMisses = s.misses + Number(!success); const nextRound = s.round + 1;
    setHits(nextHits); setMisses(nextMisses); setRound(nextRound);
    if (nextMisses >= 4) setPhase('failed'); else if (nextRound >= TOTAL) setPhase('complete');
  };
  const retry = () => { lastStrikeRef.current = 0; setRound(0); setHits(0); setMisses(0); setTone(makeTone()); setPhase('playing'); };
  return <div className="fixed inset-0 z-[70] bg-black text-white">
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Gabriela foge de cópias sombrias no espaço branco" />
    <div aria-hidden="true" className="dream-warp-layer absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 18% 26%, rgba(255,110,225,.22), transparent 38%), radial-gradient(ellipse at 80% 74%, rgba(90,220,255,.2), transparent 42%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.025) 0 1px, transparent 2px 6px)' }} />
    {phase === 'playing' && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(255,255,255,${0.025 + round * 0.045})` }}>
      <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-sm border border-white/50 bg-black/55 px-5 py-3 text-center font-serif-jp text-sm tracking-wide text-white shadow-xl">WASD / setas: fuja. Cada acerto apaga uma anomalia. Clique quando o círculo fechar.</div>
      <button onClick={strike} className="pointer-events-auto absolute bottom-24 right-10 grid h-32 w-32 place-items-center rounded-full border-2 border-white bg-black/35 shadow-[0_0_60px_rgba(255,255,255,.5)]" aria-label="Acertar o tempo">
        <span className="absolute rounded-full border border-white/80 transition-all duration-500 ease-in-out" style={{ width: `${Math.max(25, tone * 42)}%`, height: `${Math.max(25, tone * 42)}%` }} /><span className="h-3 w-3 rounded-full bg-red-300 shadow-[0_0_20px_#fca5a5]" />
      </button>
      <div className="absolute bottom-12 right-7 font-serif-jp text-xs tracking-[0.3em]">ACERTOS {hits}/6 <span className="mx-3 text-red-300">ERROS {misses}/4</span></div>
    </div>}
    {phase === 'failed' && <div className="absolute inset-0 grid place-items-center bg-black text-center"><div><p className="font-serif-jp text-sm tracking-[0.3em] text-neutral-400">TUDO FICA PRETO</p><p className="mt-3 text-2xl">As sombras alcançaram Gabriela.</p><button onClick={retry} className="mt-8 border border-neutral-500 px-6 py-3 font-serif-jp text-sm hover:bg-white hover:text-black">Tentar novamente</button></div></div>}
    {phase === 'complete' && <button onClick={onComplete} className="absolute inset-0 grid place-items-center bg-black text-center" aria-label="Continuar para o Capítulo 1"><span><span className="block font-serif-jp text-xs tracking-[0.5em] text-neutral-500">A MANHÃ DESAPARECE</span><span className="mt-5 block font-title text-4xl tracking-[0.25em]">CAPÍTULO 1</span><span className="mt-8 block font-serif-jp text-xs tracking-[0.3em] text-neutral-500">CLIQUE PARA CONTINUAR</span></span></button>}
  </div>;
};
