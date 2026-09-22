import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';
import { buildSchool, SchoolDoor, SchoolNpc } from '../three/schoolMap';
import { createGabrielaSprite, preloadGabrielaSprite } from '../three/gabrielaSprite';
import { softCircle } from '../three/textures';
import { ExplorationCamera } from '../three/cameraRig';
import { DialogueBox } from './DialogueBox';

import { SchoolSpot } from '../three/schoolMap';

interface Props {
  paused: boolean;
  cameraMotionEnabled: boolean;
  onSitAtDesk: () => void;
  onTriggerDialogue: (dialogueId: string, label?: string) => void;
}

const hit = (x: number, z: number, colliders: { x: number; z: number; w: number; d: number; enabled?: boolean }[]) =>
  colliders.some((c) => c.enabled !== false && Math.abs(x - c.x) < c.w / 2 + 0.24 && Math.abs(z - c.z) < c.d / 2 + 0.24);

export const SchoolWorld: React.FC<Props> = ({ paused, cameraMotionEnabled, onSitAtDesk, onTriggerDialogue }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const live = useRef({ paused, cameraMotionEnabled, onSitAtDesk, onTriggerDialogue });
  useEffect(() => {
    live.current = { paused, cameraMotionEnabled, onSitAtDesk, onTriggerDialogue };
  });

  const [talkingTo, setTalkingTo] = useState<SchoolNpc | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [hud, setHud] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const zoomLevelRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Shadows disabled in school — too many PointLights make it prohibitively expensive
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020304);
    scene.fog = new THREE.FogExp2(0x090807, 0.045);
    // Hemisphere for ambient fill — cheap
    scene.add(new THREE.HemisphereLight(0xffe7b0, 0x121822, 1.3));
    // One directional key light — no shadow (school is interior, lit by ceiling strips)
    const sun = new THREE.DirectionalLight(0xffd68a, 0.5);
    sun.position.set(-10, 11, 8);
    sun.castShadow = false;
    scene.add(sun);
    // No fill or key PointLight — school room lights handle ambiance per-room

    const school = buildSchool();
    // Do NOT cast/receive shadows per-mesh — too expensive with ~900 meshes and no shadow map
    scene.add(school.group);
    // 3 corridor accent lights instead of 6 — halves the room light count from SchoolWorld side
    [[-16, -12, 0xffd299], [-2, -12, 0xffc072], [17, -12, 0xffd39c]].forEach(([x, z, color]) => {
      const lamp = new THREE.PointLight(color as number, 0.45, 12, 2);
      lamp.position.set(x as number, 3.05, z as number);
      scene.add(lamp);
    });
    // Static dust — no per-frame buffer upload
    const dustPositions = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) { dustPositions[i * 3] = -25 + Math.random() * 50; dustPositions[i * 3 + 1] = 0.6 + Math.random() * 2.7; dustPositions[i * 3 + 2] = -17 + Math.random() * 22; }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xf2d9ae, size: 0.04, transparent: true, opacity: 0.22, depthWrite: false }));
    scene.add(dust);
    const signMeshes: THREE.Mesh[] = (school.group as any).userData.signs || [];
    let lastRoom: string | null = null;

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 90);
    // Start at entrance near getabako
    const pos = new THREE.Vector3(-22, 0, 1.2);
    const rig = new ExplorationCamera(camera, pos, zoomLevelRef.current, { height: 7.2, distance: 10.4, look: 0.7 });

    const keys: Record<string, boolean> = {};
    let character: ReturnType<typeof createGabrielaSprite> | null = null;
    let disposed = false;
    preloadGabrielaSprite().then((texture) => {
      if (disposed) return;
      character = createGabrielaSprite(texture);
      character.sprite.position.set(pos.x, 0, pos.z);
      scene.add(character.sprite);
    });

    const shadowTex = softCircle('rgba(0,0,0,.5)');
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.4, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(pos.x, 0.04, pos.z);
    scene.add(shadow);

    let facing: 'down' | 'up' | 'left' | 'right' = 'right';
    let frame = 0;
    let frameTime = 0;
    let nearestNpc: SchoolNpc | null = null;
    let nearestSpot: SchoolSpot | null = null;
    let nearestDoor: SchoolDoor | null = null;
    let nearDeskLocal = false;
    let currentMotionSpeed = 0;

    const talk = () => {
      if (live.current.paused) return;
      if (nearestDoor) {
        school.toggleDoor(nearestDoor.id);
        soundManager.playDoorCreak();
        return;
      }
      if (nearDeskLocal && currentMotionSpeed < 0.3) {
        soundManager.playClueDiscovered();
        live.current.onSitAtDesk();
        return;
      }
      if (nearestNpc) {
        soundManager.playClockTick();
        if (nearestNpc.dialogueNodeId) {
          live.current.onTriggerDialogue(nearestNpc.dialogueNodeId, nearestNpc.name);
        } else {
          setTalkingTo(nearestNpc);
          setLineIndex(0);
        }
        return;
      }
      if (nearestSpot) {
        soundManager.playClockTick();
        if (nearestSpot.dialogueNodeId) {
          live.current.onTriggerDialogue(nearestSpot.dialogueNodeId, nearestSpot.name);
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input,textarea,select')) return;
      const key = e.key.toLowerCase();
      keys[key] = true;
      if (e.key.startsWith('Arrow')) e.preventDefault();
      if (key === 'e' && !e.repeat) talk();
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
      keys[e.key.toLowerCase()] = false;
    };
    const onBlur = () => Object.keys(keys).forEach((k) => (keys[k] = false));
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      const next = Math.min(2, Math.max(0, zoomLevelRef.current + delta));
      if (next !== zoomLevelRef.current) {
        zoomLevelRef.current = next;
        setZoomLevel(next);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Timer();
    clock.connect(document);
    let raf = 0;
    let stepTimer = 0;
    // Throttle occlusion updates — every 3rd frame is enough (saves ~60 damp calls/frame)
    let occlusionFrame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsed();
      if (document.hidden) return;
      school.animate(t, dt);
      // Dust is static — no per-frame upload needed

      const oldX = pos.x;
      const oldZ = pos.z;
      let dx = 0;
      let dz = 0;
      if (!live.current.paused) {
        const speed = 3.4 * dt;
        if (keys.w || keys.arrowup) dz -= speed;
        if (keys.s || keys.arrowdown) dz += speed;
        if (keys.a || keys.arrowleft) dx -= speed;
        if (keys.d || keys.arrowright) dx += speed;
      }
      if (dx && dz) {
        dx *= 0.7071;
        dz *= 0.7071;
      }
      const b = school.bounds();
      const nx = THREE.MathUtils.clamp(pos.x + dx, b.minX, b.maxX);
      if (!hit(nx, pos.z, school.colliders)) pos.x = nx;
      const nz = THREE.MathUtils.clamp(pos.z + dz, b.minZ, b.maxZ);
      if (!hit(pos.x, nz, school.colliders)) pos.z = nz;

      const vx = (pos.x - oldX) / Math.max(dt, 0.001);
      const vz = (pos.z - oldZ) / Math.max(dt, 0.001);
      currentMotionSpeed = Math.hypot(vx, vz);
      const moving = currentMotionSpeed > 0.02;
      if (moving) {
        facing = Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? 'right' : 'left') : vz > 0 ? 'down' : 'up';
        frameTime += dt;
        if (frameTime > 0.13) {
          frameTime = 0;
          frame = (frame + 1) % 4;
        }
        stepTimer += dt;
        if (stepTimer > 0.34) {
          stepTimer = 0;
          soundManager.playFootstep('wood');
        }
      } else frame = 0;
      character?.setFrame(facing, frame, moving);
      character?.sprite.position.set(pos.x, 0, pos.z);
      shadow.position.set(pos.x, 0.035, pos.z);

      rig.update(pos, vx, vz, dt, t, zoomLevelRef.current, live.current.cameraMotionEnabled, live.current.paused);
      // Run occlusion every 3 frames — imperceptible latency, saves ~60 material.opacity damps/frame
      occlusionFrame++;
      if (occlusionFrame % 3 === 0) school.updateCameraOcclusion(camera, pos);

      // Nearest interactable NPC
      let bestDoor: SchoolDoor | null = null;
      let bestDoorDist = 1.35;
      school.doors.forEach((door) => {
        const d = Math.hypot(door.x - pos.x, door.z - pos.z);
        if (d < bestDoorDist) {
          bestDoorDist = d;
          bestDoor = door;
        }
      });
      nearestDoor = bestDoor;

      let bestNpc: SchoolNpc | null = null;
      let bestNpcDist = 1.9;
      school.npcs.forEach((npc) => {
        const d = Math.hypot(npc.x - pos.x, npc.z - pos.z);
        if (d < bestNpcDist) {
          bestNpcDist = d;
          bestNpc = npc;
        }
      });
      nearestNpc = bestNpc;

      // Nearest interactable spot
      let bestSpot: SchoolSpot | null = null;
      let bestSpotDist = 1.9;
      school.spots.forEach((sp) => {
        const d = Math.hypot(sp.x - pos.x, sp.z - pos.z);
        if (d < bestSpotDist) {
          bestSpotDist = d;
          bestSpot = sp;
        }
      });
      nearestSpot = bestSpot;

      const dDesk = Math.hypot(pos.x - school.deskAt[0], pos.z - school.deskAt[1]);
      nearDeskLocal = dDesk < 1.35;

      setHud(() => {
        if (bestDoor) return `${bestDoor.isOpen ? 'FECHAR' : 'ABRIR'}: Porta da sala`;
        if (nearDeskLocal && currentMotionSpeed < 0.3) return 'SENTAR NA CARTEIRA: Sala 2-B';
        if (bestNpc) return `CONVERSAR: ${bestNpc.name}`;
        if (bestSpot) return `${bestSpot.type}: ${bestSpot.name}`;
        return null;
      });

      const updater = (school.group as unknown as { updateBubbles?: (x: number, z: number) => void }).updateBubbles;
      updater?.(pos.x, pos.z);

      // Determine current room by player position
      const getRoomForPos = (x: number, z: number): string | null => {
        // Library
        if (x >= -8 && x <= 0 && z >= -18 && z <= -6) return 'library';
        // Infirmary
        if (x >= 2 && x <= 8 && z >= -18 && z <= -6) return 'infirmary';
        // Secretary
        if (x >= -16 && x <= -10 && z >= -18 && z <= -6) return 'secretary';
        // Computer lab
        if (x >= -24 && x <= -18 && z >= -18 && z <= -6) return 'computer';
        // Art & Music
        if (x >= 10 && x <= 16 && z >= -18 && z <= -6) return 'art';
        // Classroom 2-B
        if (x >= 17 && x <= 26 && z >= -18 && z <= -6) return '2-b';
        // Entrance area
        if (x >= -26 && x <= -18 && z >= -2 && z <= 6) return 'entrance';
        return null;
      };

      const currentRoom = getRoomForPos(pos.x, pos.z);
      if (currentRoom !== lastRoom) {
        lastRoom = currentRoom;
        // Toggle sign visibility: show only signs that match current room
        signMeshes.forEach((m) => {
          m.visible = !!(m.userData.room && currentRoom === m.userData.room);
        });
      }

      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clock.dispose();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      character?.dispose();
      school.dispose();
      shadowTex.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      dustGeometry.dispose();
      (dust.material as THREE.Material).dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const npcLine = talkingTo ? talkingTo.lines[lineIndex % talkingTo.lines.length] : '';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />

      {hud && !talkingTo && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 proximity-prompt pointer-events-none">
          <span className="proximity-dot" />
          <span className="proximity-caption">
            <span className="proximity-action"><kbd>E</kbd>{hud.split(':')[0].toLowerCase()}</span>
            <span className="proximity-name">{hud.includes(':') ? hud.split(':')[1].trim() : 'Minha mesa'}</span>
          </span>
        </div>
      )}

      {talkingTo && (
        <DialogueBox
          node={{
            id: `npc_${talkingTo.id}_${lineIndex}`,
            speaker: 'Desconhecido',
            speakerTitle: talkingTo.name,
            avatar: 'unknown_shadow',
            text: npcLine,
          }}
          onSelectOption={() => undefined}
          onNext={() => {
            if (lineIndex + 1 < talkingTo.lines.length) {
              setLineIndex(lineIndex + 1);
              soundManager.playClockTick();
            } else {
              setTalkingTo(null);
            }
          }}
          onClose={() => setTalkingTo(null)}
        />
      )}

      <div className="absolute bottom-5 right-28 z-20 flex items-center gap-1.5 bg-black/60 border border-neutral-800/80 px-2.5 py-1 rounded-full backdrop-blur-md">
        <button
          onClick={() => {
            const next = Math.max(0, zoomLevel - 1);
            zoomLevelRef.current = next;
            setZoomLevel(next);
            soundManager.playClockTick();
          }}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center font-bold text-xs text-neutral-300"
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
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center font-bold text-xs text-neutral-300"
          title="Aproximar [+]"
        >
          +
        </button>
      </div>
    </div>
  );
};
