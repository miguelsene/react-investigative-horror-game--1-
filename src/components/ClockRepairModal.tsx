import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Panel } from './ui/Panel';
import { Minus, Plus, Check } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { makeEnamelClockDial } from '../three/advancedTextures';

interface Props {
  clockId: string;
  name: string;
  room: string;
  wrong: string;
  target: string;
  alreadyFixed: boolean;
  onClose: () => void;
  onFixed: (clockId: string) => void;
}

const parseTime = (text: string) => {
  const [h, m] = text.split(':').map(Number);
  return { h, m };
};

export const ClockRepairModal: React.FC<Props> = ({ clockId, name, room, wrong, target, alreadyFixed, onClose, onFixed }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const faceMaterial = useRef<THREE.MeshBasicMaterial | null>(null);
  const [hours, setHours] = useState(parseTime(alreadyFixed ? target : wrong).h);
  const [minutes, setMinutes] = useState(parseTime(alreadyFixed ? target : wrong).m);
  const [fixed, setFixed] = useState(alreadyFixed);

  const goal = parseTime(target);
  const label = () => {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m}`;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setClearColor(0, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 20);
    camera.position.set(0, 0, 3);
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.5);
    key.position.set(2, 3, 3);
    scene.add(key);

    const group = new THREE.Group();
    scene.add(group);
    const caseMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.82, 48),
      new THREE.MeshStandardMaterial({ color: 0x2b1c14, roughness: 0.55, metalness: 0.1 }),
    );
    caseMesh.position.z = -0.02;
    group.add(caseMesh);

    const material = new THREE.MeshBasicMaterial({ map: makeEnamelClockDial(hours, minutes, 0), toneMapped: false });
    faceMaterial.current = material;
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), material));

    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 48),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05 }),
    );
    glass.position.z = 0.015;
    group.add(glass);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      group.rotation.y = Math.sin(performance.now() * 0.0007) * 0.09;
      renderer.render(scene, camera);
    };
    draw();

    const resize = new ResizeObserver(() => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      faceMaterial.current = null;
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((m) => {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // The dial texture is refreshed by the effect below, not here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const material = faceMaterial.current;
    if (!material) return;
    const previous = material.map;
    material.map = makeEnamelClockDial(hours, minutes, 0);
    material.needsUpdate = true;
    previous?.dispose();
  }, [hours, minutes]);

  useEffect(() => {
    if (fixed || (hours === goal.h && minutes === goal.m)) {
      if (!fixed) {
        setFixed(true);
        soundManager.playClueDiscovered();
        onFixed(clockId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, minutes]);

  const step = (kind: 'h' | 'm10' | 'm1', direction: 1 | -1) => {
    soundManager.playClockTick();
    if (kind === 'h') setHours((v) => ((v - 1 + direction + 12) % 12) + 1);
    else if (kind === 'm10') setMinutes((v) => (v + direction * 10 + 60) % 60);
    else setMinutes((v) => (v + direction + 60) % 60);
  };

  const Control: React.FC<{ label: string; kind: 'h' | 'm10' | 'm1' }> = ({ label: text, kind }) => (
    <div className="flex items-center justify-between border border-neutral-800 px-3 py-2">
      <span className="font-serif-jp text-[12px] text-neutral-400">{text}</span>
      <span className="flex items-center gap-1">
        <button aria-label={`Atrasar ${text}`} onClick={() => step(kind, -1)} className="p-1 text-neutral-400 hover:text-white">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button aria-label={`Adiantar ${text}`} onClick={() => step(kind, 1)} className="p-1 text-neutral-400 hover:text-white">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  );

  return (
    <Panel title="AJUSTAR RELÓGIO" jp="時計" subtitle={`${name} · ${room}`} onClose={onClose} width="max-w-3xl">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="h-72 inspection-view">
          <div ref={mountRef} className="inspection-canvas" />
        </div>
        <div className="font-serif-jp">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Ponteiros</p>
          <p className={`text-5xl font-title mt-3 ${fixed ? 'text-emerald-200' : 'text-red-200'}`}>{label()}</p>
          <p className="text-sm text-neutral-400 mt-4 leading-relaxed">
            {fixed
              ? 'O relógio está certo. A casa volta a marcar a manhã.'
              : `A avó pediu ${target}. Este estava em ${wrong}.`}
          </p>

          {!fixed && (
            <div className="grid gap-2 mt-6">
              <Control label="Hora" kind="h" />
              <Control label="10 minutos" kind="m10" />
              <Control label="1 minuto" kind="m1" />
            </div>
          )}

          {fixed && (
            <p className="mt-6 flex items-center gap-2 text-sm text-emerald-200">
              <Check className="w-4 h-4" /> Registrado no diário.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
};
