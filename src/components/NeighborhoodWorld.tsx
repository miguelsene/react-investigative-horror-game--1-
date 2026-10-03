import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';
import { buildStreet } from '../three/street';
import { createGabrielaSprite, preloadGabrielaSprite } from '../three/gabrielaSprite';
import { ExplorationCamera } from '../three/cameraRig';
import { applyAreaCameraCinematic } from '../three/areaCameraCinematic';
import { softCircle } from '../three/textures';
import { STREET, STREET_MONOLOGUES, RETURN_MONOLOGUES, SCHOOL_X, progressAt, walkZ } from '../data/streetRoute';

interface Props {
  paused: boolean;
  cameraMotionEnabled: boolean;
  cameraCinematic?: boolean;
  direction?: 'toSchool' | 'home';
  onProgress: (progress: number) => void;
  onMonologue: (text: string) => void;
  monologues?: { at: number; text: string }[];
  onArriveSchool: () => void;
  onArriveHome?: () => void;
}

const blocked = (x: number, z: number, colliders: { x: number; z: number; w: number; d: number }[]) =>
  colliders.some((c) => Math.abs(x - c.x) < c.w / 2 + 0.26 && Math.abs(z - c.z) < c.d / 2 + 0.26);

export const NeighborhoodWorld: React.FC<Props> = ({ paused, cameraMotionEnabled, cameraCinematic, direction = 'toSchool', onProgress, onMonologue, monologues, onArriveSchool, onArriveHome }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const touchInteractRef = useRef<HTMLButtonElement>(null);
  const enterSchoolRef = useRef<() => void>(() => {});
  const touchKeysRef = useRef<Record<string, boolean>>({});
  const zoomRef = useRef(0);
  const [zoomLevel, setZoomLevel] = React.useState(0);
  const setZoom = (value: number) => {
    const next = THREE.MathUtils.clamp(value, 0, 2);
    zoomRef.current = next;
    setZoomLevel(next);
  };
  const live = useRef({ paused, cameraMotionEnabled, cameraCinematic, direction, onProgress, onMonologue, monologues, onArriveSchool, onArriveHome });
  useEffect(() => {
    live.current = { paused, cameraMotionEnabled, cameraCinematic, direction, onProgress, onMonologue, monologues, onArriveSchool, onArriveHome };
  });

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8b95a2);
    scene.fog = new THREE.FogExp2(0x97a2ae, 0.019);
    scene.add(new THREE.HemisphereLight(0xd6e4f0, 0x302b2a, 1.12));
    const sun = new THREE.DirectionalLight(0xffe3bd, 0.78);
    sun.position.set(-6, 12, 9);
    scene.add(sun);

    const street = buildStreet();
    scene.add(street.group);

    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.1, 140);
    const startX = direction === 'home' ? STREET.maxX - 3.5 : STREET.minX + 1.5;
    const pos = new THREE.Vector3(startX, 0, walkZ(startX));
    const rig = new ExplorationCamera(camera, pos, 0, { height: 4.4, distance: 7.6, look: 0.62, zoomScale: [1, 0.76, 0.56], zoomHeightScale: [1, 0.84, 0.68] });

    const keys: Record<string, boolean> = {};
    let character: ReturnType<typeof createGabrielaSprite> | null = null;
    let disposed = false;
    preloadGabrielaSprite().then((texture) => {
      if (disposed) return;
      character = createGabrielaSprite(texture);
      character.sprite.position.set(pos.x, 0.11, pos.z);
      scene.add(character.sprite);
    });

    const shadowTex = softCircle('rgba(0,0,0,.7)');
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.44),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.38, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(pos.x, 0.12, pos.z);
    scene.add(shadow);

    let facing: 'down' | 'up' | 'left' | 'right' = 'right';
    let frame = 0;
    let frameTime = 0;
    let stepTimer = 0;
    let lastProgress = -1;
    const fired = new Set<number>();
    let nearGate = false;

    const enterSchool = () => {
      if (live.current.paused) return;
      soundManager.playDoorCreak();
      if (live.current.direction === 'home') {
        if (nearGate) live.current.onArriveHome?.();
      } else if (nearGate) live.current.onArriveSchool();
    };
    enterSchoolRef.current = enterSchool;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'e') {
        e.preventDefault();
        enterSchool();
      }
      if (k === '+' || k === '=') setZoom(zoomRef.current + 1);
      if (k === '-' || k === '_') setZoom(zoomRef.current - 1);
      if (k.startsWith('arrow')) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    const onBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
      Object.keys(touchKeysRef.current).forEach((k) => { touchKeysRef.current[k] = false; });
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(zoomRef.current + (e.deltaY < 0 ? 1 : -1));
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    mount.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Timer();
    clock.connect(document);
    let cameraSequenceStartedAt = 0;
    const cameraSequenceStart = new THREE.Vector3();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsed();
      if (document.hidden) return;
      street.animate(t, dt);

      const oldX = pos.x;
      const oldZ = pos.z;
      let dx = 0;
      let dz = 0;
      const locked = live.current.paused;
      if (!locked) {
        const speed = 3.5 * dt;
        if (keys.w || keys.arrowup || touchKeysRef.current.w) dz -= speed;
        if (keys.s || keys.arrowdown || touchKeysRef.current.s) dz += speed;
        if (keys.a || keys.arrowleft || touchKeysRef.current.a) dx -= speed;
        if (keys.d || keys.arrowright || touchKeysRef.current.d) dx += speed;
      }
      if (dx !== 0 && dz !== 0) {
        dx *= 0.7071;
        dz *= 0.7071;
      }
      const bounds = street.bounds();
      const nx = THREE.MathUtils.clamp(pos.x + dx, bounds.minX, bounds.maxX);
      if (!blocked(nx, pos.z, street.colliders)) pos.x = nx;
      const nz = THREE.MathUtils.clamp(pos.z + dz, bounds.minZ, bounds.maxZ);
      if (!blocked(pos.x, nz, street.colliders)) pos.z = nz;

      const vx = (pos.x - oldX) / Math.max(dt, 0.001);
      const vz = (pos.z - oldZ) / Math.max(dt, 0.001);
      const moving = Math.hypot(vx, vz) > 0.02;
      if (moving) {
        facing = Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? 'right' : 'left') : vz > 0 ? 'down' : 'up';
        frameTime += dt;
        if (frameTime > 0.12) {
          frameTime = 0;
          frame = (frame + 1) % 4;
        }
        stepTimer += dt;
        if (stepTimer > 0.36) {
          stepTimer = 0;
          soundManager.playFootstep('stone');
        }
      } else {
        frame = 0;
      }
      if (character) {
        character.setFrame(facing, frame, moving);
        character.sprite.position.set(pos.x, 0.12, pos.z);
      }
      shadow.position.set(pos.x, 0.118, pos.z);

      rig.update(pos, vx, vz, dt, t, zoomRef.current, live.current.cameraMotionEnabled, locked);
      if (live.current.cameraCinematic) {
        if (!cameraSequenceStartedAt) { cameraSequenceStartedAt = performance.now(); cameraSequenceStart.copy(camera.position); }
        applyAreaCameraCinematic(camera, pos, cameraSequenceStart, Math.min(1, (performance.now() - cameraSequenceStartedAt) / 2800), 'street');
      } else cameraSequenceStartedAt = 0;

      // Monologues are keyed to real street coordinates; the walk home reads
      // them in reverse so the reflections still follow the journey.
      const source = live.current.monologues ?? STREET_MONOLOGUES;
      const ordered = live.current.direction === 'home' && !live.current.monologues
        ? RETURN_MONOLOGUES
        : live.current.direction === 'home'
          ? [...source].reverse()
          : source;
      for (let i = 0; i < ordered.length; i++) {
        const key = source.indexOf(ordered[i]);
        if (fired.has(key)) continue;
        const reached = live.current.direction === 'home' ? pos.x <= ordered[i].at : pos.x >= ordered[i].at;
        if (reached) {
          fired.add(key);
          live.current.onMonologue(ordered[i].text);
        }
      }

      nearGate = live.current.direction === 'home' ? pos.x < STREET.minX + 3.2 : pos.x > SCHOOL_X - 3.2;
      if (promptRef.current) promptRef.current.hidden = !nearGate || locked;
      if (touchInteractRef.current) touchInteractRef.current.hidden = !nearGate || locked;

      const progress = live.current.direction === 'home' ? 1 - progressAt(pos.x) : progressAt(pos.x);
      if (Math.abs(progress - lastProgress) > 0.004) {
        lastProgress = progress;
        live.current.onProgress(progress);
      }

      renderer.render(scene, camera);
    };
    loop();

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clock.dispose();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      character?.dispose();
      street.dispose();
      shadowTex.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const pressTouchKey = (event: React.PointerEvent<HTMLButtonElement>, key: string) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchKeysRef.current[key] = true;
  };
  const releaseTouchKey = (key: string) => { touchKeysRef.current[key] = false; };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute right-5 bottom-24 z-20 flex flex-col gap-2" aria-label="Zoom da câmera">
        <button type="button" onClick={() => setZoom(zoomLevel + 1)} disabled={zoomLevel >= 2} aria-label="Aproximar câmera" className="grid h-10 w-10 place-items-center border border-white/30 bg-black/65 text-xl text-white backdrop-blur-sm transition hover:bg-black/85 disabled:opacity-35">+</button>
        <button type="button" onClick={() => setZoom(zoomLevel - 1)} disabled={zoomLevel <= 0} aria-label="Afastar câmera" className="grid h-10 w-10 place-items-center border border-white/30 bg-black/65 text-xl text-white backdrop-blur-sm transition hover:bg-black/85 disabled:opacity-35">−</button>
      </div>
      <div className="touch-only absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 flex-col items-center gap-1 select-none" aria-label="Controles de movimento">
        <button className="dpad h-12 w-12 rounded-xl bg-black/65 text-lg" onPointerDown={(event) => pressTouchKey(event, 'w')} onPointerUp={() => releaseTouchKey('w')} onPointerCancel={() => releaseTouchKey('w')} onLostPointerCapture={() => releaseTouchKey('w')} aria-label="Andar para frente">▲</button>
        <div className="flex gap-1">
          <button className="dpad h-12 w-12 rounded-xl bg-black/65 text-lg" onPointerDown={(event) => pressTouchKey(event, 'a')} onPointerUp={() => releaseTouchKey('a')} onPointerCancel={() => releaseTouchKey('a')} onLostPointerCapture={() => releaseTouchKey('a')} aria-label="Andar para esquerda">◀</button>
          <button className="dpad h-12 w-12 rounded-xl bg-black/65 text-lg" onPointerDown={(event) => pressTouchKey(event, 's')} onPointerUp={() => releaseTouchKey('s')} onPointerCancel={() => releaseTouchKey('s')} onLostPointerCapture={() => releaseTouchKey('s')} aria-label="Andar para trás">▼</button>
          <button className="dpad h-12 w-12 rounded-xl bg-black/65 text-lg" onPointerDown={(event) => pressTouchKey(event, 'd')} onPointerUp={() => releaseTouchKey('d')} onPointerCancel={() => releaseTouchKey('d')} onLostPointerCapture={() => releaseTouchKey('d')} aria-label="Andar para direita">▶</button>
        </div>
      </div>
      <button ref={touchInteractRef} hidden onClick={() => enterSchoolRef.current()} className="touch-only absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 min-h-12 items-center justify-center rounded-full border border-red-100/45 bg-black/75 px-5 font-serif-jp text-[10px] tracking-[0.16em] text-white shadow-xl backdrop-blur-md">INTERAGIR</button>
      <button ref={promptRef} hidden onClick={() => enterSchoolRef.current()} className="absolute left-1/2 top-[38%] -translate-x-1/2 proximity-prompt pointer-events-auto">
        <span className="proximity-dot" />
        <span className="proximity-caption">
          <span className="proximity-action"><kbd>E</kbd>{direction === 'home' ? 'voltar para casa' : 'entrar no portão'}</span>
          <span className="proximity-name">{direction === 'home' ? 'Casa dos Cedros' : 'Escola Municipal de Kyoto'}</span>
        </span>
      </button>
    </div>
  );
};
