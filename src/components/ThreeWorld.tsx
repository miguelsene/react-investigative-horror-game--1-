import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LocationId } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { buildFloor, buildExterior, Collider } from '../three/house';
import { softCircle } from '../three/textures';
import { createGabrielaSprite, preloadGabrielaSprite } from '../three/gabrielaSprite';
import { ExplorationCamera } from '../three/cameraRig';

export interface WorldHotspot {
  id: string;
  name: string;
  type: 'INSPECIONAR' | 'CONVERSAR' | 'EXAMINAR' | 'ABRIR';
  position: [number, number, number];
  markerPosition?: [number, number, number];
  /** Walkable anchor in front of the object; bypasses the line-of-sight test. */
  reachFrom?: [number, number];
  room: LocationId;
  floor: 1 | 2;
  action: () => void;
}

interface ThreeWorldProps {
  currentFloor: 1 | 2;
  onFloorChange: (floor: 1 | 2) => void;
  onInteract: (hotspot: WorldHotspot) => void;
  isInspecting: boolean;
  isInDialogue: boolean;
  activeHotspots: WorldHotspot[];
  currentTime: string;
  cameraMotionEnabled?: boolean;
  canUseStairs?: boolean;
  blockedMessage?: string | null;
  fixedClockIds?: string[];
}

const PLAYER_R = 0.27;

const collides = (x: number, z: number, cols: Collider[]) => {
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (x + PLAYER_R > c.x - c.w / 2 && x - PLAYER_R < c.x + c.w / 2 && z + PLAYER_R > c.z - c.d / 2 && z - PLAYER_R < c.z + c.d / 2) return true;
  }
  return false;
};

export const ThreeWorld: React.FC<ThreeWorldProps> = (props) => {
  const { currentFloor } = props;
  const mountRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState<WorldHotspot | null>(null);
  const [nearStairs, setNearStairs] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [spriteStatus, setSpriteStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const retrySpriteRef = useRef<(() => void) | null>(null);
  const interactionTime = useRef(0);
  const cameraKick = useRef<(() => void) | null>(null);

  // Live props: the 3D scene reads these through a ref, so React
  // re-renders (dialogues, modals, flags) never rebuild the world.
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const nextSpawnRef = useRef<[number, number] | null>(null);
  const nearbyRef = useRef<WorldHotspot | null>(null);
  const stairsRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0); // 0 = standard, 1 = zoom in, 2 = close-up
  const zoomLevelRef = useRef<number>(0);

  const changeFloor = useCallback((to: 1 | 2) => {
    if (live.current.isInspecting || live.current.isInDialogue) return;
    if (live.current.canUseStairs === false) {
      soundManager.playAnomalySting();
      window.dispatchEvent(new CustomEvent('qvc:blocked', { detail: live.current.blockedMessage ?? 'Você ainda não pode passar.' }));
      return;
    }
    // Spawns with comfortable open-space clearance
    nextSpawnRef.current = to === 1 ? [7.2, 0.4] : [4.6, 0.5];
    soundManager.playDoorCreak();
    live.current.onFloorChange(to);
  }, []);

  const interact = useCallback(() => {
    const l = live.current;
    if (l.isInspecting || l.isInDialogue) return;
    const now = performance.now();
    if (now - interactionTime.current < 250) return;
    interactionTime.current = now;
    cameraKick.current?.();
    if (nearbyRef.current) {
      nearbyRef.current.action();
      l.onInteract(nearbyRef.current);
    } else if (stairsRef.current) {
      if (l.canUseStairs === false) {
        soundManager.playAnomalySting();
        if (l.blockedMessage) window.dispatchEvent(new CustomEvent('qvc:blocked', { detail: l.blockedMessage }));
        return;
      }
      changeFloor(l.currentFloor === 1 ? 2 : 1);
    }
  }, [changeFloor]);

  const setKey = (k: string, v: boolean) => {
    keysRef.current[k] = v;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    keysRef.current = {};
    nearbyRef.current = null;
    stairsRef.current = false;
    setNearby(null);
    setNearStairs(false);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04050a);
    scene.fog = new THREE.FogExp2(0x05070c, 0.038);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);

    /* ---------- LIGHTING: moody night interior — cool moon + sparse warm lamps ---------- */
    scene.add(new THREE.AmbientLight(0x2a3142, 0.28));
    scene.add(new THREE.HemisphereLight(0x3a4a62, 0x120e0c, 0.32));

    // Cool moonlight through rain — long soft shadows
    const moon = new THREE.DirectionalLight(0x6a84a8, 0.38);
    moon.position.set(7, 14, 4);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -12;
    moon.shadow.camera.right = 12;
    moon.shadow.camera.top = 9;
    moon.shadow.camera.bottom = -9;
    moon.shadow.bias = -0.001;
    moon.shadow.normalBias = 0.03;
    moon.shadow.radius = 2.5;
    scene.add(moon);

    // Very soft warm bounce from interior lamps
    const warmFill = new THREE.DirectionalLight(0xc48a5a, 0.12);
    warmFill.position.set(-3, 5, 6);
    scene.add(warmFill);

    // Cool rim — barely there, just separates silhouettes
    const rim = new THREE.DirectionalLight(0x4a6a8a, 0.1);
    rim.position.set(0, 4, -10);
    scene.add(rim);

    const exterior = buildExterior(scene);
    const house = buildFloor(currentFloor, scene);

    /* ---------- RAIN (outside the walls only) ---------- */
    const RAIN = 220;
    const rainPos = new Float32Array(RAIN * 6);
    const respawn = (i: number, top: boolean) => {
      const x = (Math.random() - 0.5) * 34;
      const front = Math.random() < 0.6;
      const z = front ? (currentFloor === 1 ? 3.6 : 2.9) + Math.random() * 6 : -9 + Math.random() * 6;
      const y = top ? 11 + Math.random() * 2 : Math.random() * 12;
      rainPos[i * 6] = x + 0.02;
      rainPos[i * 6 + 1] = y + 0.26;
      rainPos[i * 6 + 2] = z + 0.02;
      rainPos[i * 6 + 3] = x;
      rainPos[i * 6 + 4] = y;
      rainPos[i * 6 + 5] = z;
    };
    for (let i = 0; i < RAIN; i++) respawn(i, false);
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x93b4d8, transparent: true, opacity: 0.4 }));
    scene.add(rain);

    /* ---------- DUST MOTES (inside) ---------- */
    const DUST = 36;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 1] = 0.3 + Math.random() * 2.4;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd8cfa8, size: 0.03, transparent: true, opacity: 0.3, depthWrite: false })));

    /* ---------- RASTER SPRITE ---------- */
    const spawn = nextSpawnRef.current ?? house.spawn;
    nextSpawnRef.current = null;
    const pos = new THREE.Vector3(spawn[0], 0, spawn[1]);
    let facing: 'up' | 'down' | 'left' | 'right' = 'down';
    let walkFrame = 0;
    let walkTimer = 0;
    let bobT = 0;
    let lastStep = 0;
    let disposed = false;
    let character: ReturnType<typeof createGabrielaSprite> | null = null;
    const loadCharacter = () => {
      setSpriteStatus('loading');
      preloadGabrielaSprite().then((texture) => {
        if (disposed) return;
        character = createGabrielaSprite(texture);
        character.sprite.position.set(pos.x, 0.18, pos.z);
        scene.add(character.sprite);
        setSpriteStatus('ready');
      }).catch(() => {
        if (!disposed) setSpriteStatus('error');
      });
    };
    retrySpriteRef.current = loadCharacter;
    loadCharacter();

    const shadowTexture = softCircle('rgba(0,0,0,0.85)');
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.45, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(pos.x, 0.175, pos.z);
    scene.add(shadow);

    const cameraRig = new ExplorationCamera(camera, pos, zoomLevelRef.current);
    cameraKick.current = () => cameraRig.kick(0.85);
    const projected = new THREE.Vector3();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    const onMotionPreference = () => { reducedMotion = motionQuery.matches; };
    motionQuery.addEventListener('change', onMotionPreference);

    const canReach = (spot: WorldHotspot) => {
      if (house.roomOf(pos.x, pos.z) !== house.roomOf(spot.position[0], spot.position[2])) return false;
      // Only structural partitions block the approach line. A desk is the
      // object being examined, not an invisible wall in front of the prompt.
      return !house.colliders.some((c) => {
        if (c.w > 0.22 && c.d > 0.22) return false;
        for (let i = 1; i < 7; i++) {
          const x = pos.x + (spot.position[0] - pos.x) * i / 7;
          const z = pos.z + (spot.position[2] - pos.z) * i / 7;
          if (Math.abs(x - c.x) < c.w / 2 && Math.abs(z - c.z) < c.d / 2) return true;
        }
        return false;
      });
    };

    /* ---------- INPUT ---------- */
    const onKeyDown = (e: KeyboardEvent) => {
      const element = e.target as HTMLElement | null;
      if (element?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (live.current.isInspecting || live.current.isInDialogue || !character) return;
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k.startsWith('arrow')) e.preventDefault();
      if (e.repeat) return;
      if (k === 'e') interact();
      // Zoom controls: '+' / '=' to zoom in, '-' / '_' to zoom out (up to 2 levels)
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        const next = Math.min(2, zoomLevelRef.current + 1);
        zoomLevelRef.current = next;
        setZoomLevel(next);
        soundManager.playClockTick();
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        const next = Math.max(0, zoomLevelRef.current - 1);
        zoomLevelRef.current = next;
        setZoomLevel(next);
        soundManager.playClockTick();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const onBlur = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    /* ---------- LOOP ---------- */
    const clock = new THREE.Clock();
    let clockSignature = '';
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (document.hidden) return;
      const l = live.current;

      house.animate(t, dt);
      exterior.animate(t, dt);
      // Dynamic roof occlusion: when inside, roof is transparent; when outside (engawa/garden), roof is solid!
      house.updateRoofVisibility(pos.z, pos.x);
      const nextClockSignature = (l.fixedClockIds ?? []).slice().sort().join('|');
      if (nextClockSignature !== clockSignature) {
        clockSignature = nextClockSignature;
        house.updateClockTimes(new Set(l.fixedClockIds ?? []));
      }

      const rp = rainPos;
      for (let i = 0; i < RAIN; i++) {
        const dy = 10.5 * dt;
        rp[i * 6 + 1] -= dy;
        rp[i * 6 + 4] -= dy;
        if (rp[i * 6 + 4] < -0.1) respawn(i, true);
      }
      rainGeo.attributes.position.needsUpdate = true;

      for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] += Math.sin(t * 0.3 + i) * 0.0012;
        dustPos[i * 3 + 1] += Math.cos(t * 0.22 + i * 0.7) * 0.0008;
      }
      dustGeo.attributes.position.needsUpdate = true;

      const locked = l.isInspecting || l.isInDialogue || !character;
      if (locked) keysRef.current = {};

      const keys = keysRef.current;
      const speed = 2.9 * dt;
      let dx = 0;
      let dz = 0;
      if (!locked) {
        if (keys['w'] || keys['arrowup']) dz -= speed;
        if (keys['s'] || keys['arrowdown']) dz += speed;
        if (keys['a'] || keys['arrowleft']) dx -= speed;
        if (keys['d'] || keys['arrowright']) dx += speed;
      }
      const previousX = pos.x;
      const previousZ = pos.z;
      if (dx !== 0 || dz !== 0) {
        if (dx !== 0 && dz !== 0) {
          dx *= 0.7071;
          dz *= 0.7071;
        }
        facing = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz > 0 ? 'down' : 'up';
        const b = house.bounds(pos.x);
        const nx = THREE.MathUtils.clamp(pos.x + dx, b.minX, b.maxX);
        if (!collides(nx, pos.z, house.colliders)) pos.x = nx;
        const b2 = house.bounds(pos.x);
        const nz = THREE.MathUtils.clamp(pos.z + dz, b2.minZ, b2.maxZ);
        if (!collides(pos.x, nz, house.colliders)) pos.z = nz;
      }
      const vx = (pos.x - previousX) / Math.max(dt, 0.001);
      const vz = (pos.z - previousZ) / Math.max(dt, 0.001);
      const moving = Math.hypot(vx, vz) > 0.02;
      if (moving) {
        bobT += dt * 10;
        const now = performance.now();
        if (now - lastStep > 370) {
          soundManager.playFootstep(pos.x > 0.6 && currentFloor === 1 ? 'wood' : 'tatami');
          lastStep = now;
        }
        walkTimer += dt;
        if (walkTimer >= 0.13) {
          walkTimer %= 0.13;
          walkFrame = (walkFrame + 1) % 4;
        }
      } else {
        walkFrame = 0;
        walkTimer = 0;
      }
      if (character) {
        character.setFrame(facing, walkFrame, moving);
        const groundY = currentFloor === 1 && (pos.x > 6.4 || pos.z > 3.35) ? 0.09 : 0.18;
        character.sprite.position.set(pos.x, groundY, pos.z);
        shadow.position.y = groundY + 0.008;
      }
      shadow.scale.set(1 + (moving ? Math.abs(Math.sin(bobT)) * 0.035 : 0), 1, 1);
      shadow.position.x = pos.x;
      shadow.position.z = pos.z;

      // Room focus: fade every object outside the room Gabriela is standing in
      house.updateRoomFocus(house.roomOf(pos.x, pos.z), dt);

      cameraRig.update(pos, vx, vz, dt, t, zoomLevelRef.current, l.cameraMotionEnabled !== false && !reducedMotion, locked);

      if (!locked) {
        let closest: WorldHotspot | null = null;
        let minDist = 1.4;
        const spots = l.activeHotspots;
        for (let i = 0; i < spots.length; i++) {
          const s = spots[i];
          if (s.floor !== currentFloor) continue;
          if (s.reachFrom) {
            // Explicit standing spot: guaranteed clear of furniture.
            const d = Math.hypot(pos.x - s.reachFrom[0], pos.z - s.reachFrom[1]);
            if (d < 1.15 && d < minDist) {
              minDist = d;
              closest = s;
            }
            continue;
          }
          if (!canReach(s)) continue;
          const d = Math.hypot(pos.x - s.position[0], pos.z - s.position[2]);
          if (d < 1.4 && d < minDist) {
            minDist = d;
            closest = s;
          }
        }
        const st = house.stairs;
        const atStairs = !closest && Math.hypot(pos.x - st.x, pos.z - st.z) < st.r;
        if (atStairs && l.canUseStairs === false) {
          const msg = l.blockedMessage ?? 'Você ainda não pode passar.';
          stairsRef.current = false;
          setNearStairs(false);
          // Message is throttled so the player isn't spammed while standing on the trigger.
          if (performance.now() - interactionTime.current > 1200) {
            interactionTime.current = performance.now();
            soundManager.playAnomalySting();
            window.dispatchEvent(new CustomEvent('qvc:blocked', { detail: msg }));
          }
        } else if (atStairs !== stairsRef.current) {
          stairsRef.current = atStairs;
          setNearStairs(atStairs);
        }
        if ((closest?.id ?? null) !== (nearbyRef.current?.id ?? null)) {
          setNearby(closest);
        }
        nearbyRef.current = closest;
      }

      // One HTML prompt follows the nearby object's projected position.
      // Updating the DOM ref avoids a React render on every animation frame.
      const prompt = promptRef.current;
      if (prompt) {
        const target = nearbyRef.current;
        const hasTarget = !locked && (target || stairsRef.current);
        if (hasTarget) {
          if (target) {
            const p = target.markerPosition ?? [target.position[0], 1.1, target.position[2]];
            projected.set(p[0], p[1], p[2]);
          } else {
            projected.set(house.stairs.x, 0.85, house.stairs.z);
          }
          projected.project(camera);
          const x = (projected.x * 0.5 + 0.5) * mount.clientWidth;
          const y = (-projected.y * 0.5 + 0.5) * mount.clientHeight;
          const visible = projected.z > -1 && projected.z < 1 && x > 16 && x < mount.clientWidth - 16 && y > 64 && y < mount.clientHeight - 56;
          prompt.style.visibility = visible ? 'visible' : 'hidden';
          prompt.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          prompt.dataset.side = x > mount.clientWidth * 0.7 ? 'left' : 'right';
        } else {
          prompt.style.visibility = 'hidden';
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      retrySpriteRef.current = null;
      cameraKick.current = null;
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      motionQuery.removeEventListener('change', onMotionPreference);
      character?.dispose();
      shadowTexture.dispose();
      shadowMaterial.dispose();
      shadow.geometry.dispose();
      (rain.material as THREE.Material).dispose();
      house.dispose();
      exterior.dispose();
      rainGeo.dispose();
      dustGeo.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [currentFloor, interact]);

  /* ============ FALLBACK: 2D MODE (no WebGL) ============ */
  if (webglFailed) {
    const floorHotspots = props.activeHotspots.filter((h) => h.floor === currentFloor);
    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-[#07080b]">
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">MODO DE INVESTIGAÇÃO 2D — ACELERAÇÃO 3D INDISPONÍVEL</p>
            <h2 className="text-2xl font-title font-bold text-neutral-100 tracking-widest mt-1">
              {currentFloor === 1 ? 'CASA DE KYOTO — TÉRREO' : 'CASA DE KYOTO — 2º ANDAR'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
            {floorHotspots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => {
                  soundManager.playClockTick();
                  spot.action();
                  props.onInteract(spot);
                }}
                disabled={props.isInDialogue || props.isInspecting}
                className="p-4 text-left border-b border-neutral-800 hover:border-neutral-400 transition-colors disabled:opacity-40"
              >
                <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest"><span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-2" />{spot.type}</span>
                <span className="block text-sm font-mono font-bold text-neutral-100 mt-1">{spot.name}</span>
              </button>
            ))}
          </div>
          <button onClick={() => changeFloor(currentFloor === 1 ? 2 : 1)} className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded text-xs font-mono uppercase tracking-wider">
            {currentFloor === 1 ? '▲ Subir ao 2º Andar' : '▼ Descer ao Térreo'}
          </button>
        </div>
      </div>
    );
  }

  const locked = props.isInspecting || props.isInDialogue;

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Lightweight vignette, no full-screen backdrop blur. */}
      <div className="dof-blur" aria-hidden="true" />

      <div ref={promptRef} className="interaction-anchor" hidden={locked || (!nearby && !nearStairs)}>
        <button type="button" className="proximity-prompt" onClick={interact} aria-label={nearby ? `${nearby.type}: ${nearby.name}` : 'Usar escadas'}>
          <span className="proximity-dot" aria-hidden="true" />
          <span className="proximity-caption" key={nearby?.id ?? 'stairs'}>
            <span className="proximity-action"><kbd>E</kbd>{nearby ? nearby.type.toLowerCase() : currentFloor === 1 ? 'subir' : 'descer'}</span>
            <span className="proximity-name">{nearby?.name ?? (currentFloor === 1 ? 'Segundo andar' : 'Térreo')}</span>
          </span>
        </button>
      </div>

      {spriteStatus !== 'ready' && (
        <div className="absolute top-1/2 inset-x-0 z-30 text-center font-serif-jp text-sm text-neutral-300">
          {spriteStatus === 'loading' ? 'Carregando o sprite de Gabriela...' : <button onClick={() => retrySpriteRef.current?.()} className="underline underline-offset-4">Não foi possível carregar o sprite. Tentar novamente</button>}
        </div>
      )}

      {/* Zoom controls & indicator */}
      <div className="absolute bottom-5 right-28 z-20 flex items-center gap-1.5 bg-black/60 border border-neutral-800/80 px-2.5 py-1 rounded-full backdrop-blur-md">
        <button
          onClick={() => {
            const next = Math.max(0, zoomLevel - 1);
            zoomLevelRef.current = next;
            setZoomLevel(next);
            soundManager.playClockTick();
          }}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center font-bold text-xs text-neutral-300 disabled:opacity-30"
          disabled={zoomLevel === 0 || locked}
          title="Afastar [-]"
        >
          −
        </button>
        <span className="font-mono text-[10px] text-neutral-400 tracking-wider px-1">
          {zoomLevel === 0 ? '1x' : zoomLevel === 1 ? '1.5x' : '2.2x'}
        </span>
        <button
          onClick={() => {
            const next = Math.min(2, zoomLevel + 1);
            zoomLevelRef.current = next;
            setZoomLevel(next);
            soundManager.playClockTick();
          }}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center font-bold text-xs text-neutral-300 disabled:opacity-30"
          disabled={zoomLevel === 2 || locked}
          title="Aproximar Gabriela [+]"
        >
          +
        </button>
      </div>

      {/* Floor shortcut */}
      <button disabled={locked || props.canUseStairs === false} onClick={() => changeFloor(currentFloor === 1 ? 2 : 1)} className="absolute bottom-5 right-5 z-20 hud-btn text-[11px] font-serif-jp tracking-widest px-3 w-auto disabled:opacity-30" title="Usar escadas">
        {currentFloor === 1 ? '▲ 2º ANDAR' : '▼ TÉRREO'}
      </button>

      {/* Touch controls */}
      <div className="touch-only absolute bottom-5 left-5 z-20 flex-col items-center gap-1 select-none">
        <button className="dpad" onPointerDown={() => setKey('w', true)} onPointerUp={() => setKey('w', false)} onPointerLeave={() => setKey('w', false)}>▲</button>
        <div className="flex gap-1">
          <button className="dpad" onPointerDown={() => setKey('a', true)} onPointerUp={() => setKey('a', false)} onPointerLeave={() => setKey('a', false)}>◀</button>
          <button className="dpad" onPointerDown={() => setKey('s', true)} onPointerUp={() => setKey('s', false)} onPointerLeave={() => setKey('s', false)}>▼</button>
          <button className="dpad" onPointerDown={() => setKey('d', true)} onPointerUp={() => setKey('d', false)} onPointerLeave={() => setKey('d', false)}>▶</button>
        </div>
      </div>
    </div>
  );
};
