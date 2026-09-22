import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { InspectionObjectData, InspectionHotspot } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { RotateCcw, ZoomIn, ZoomOut, Check, ArrowRight, FlipHorizontal } from 'lucide-react';
import { Panel, Hairline } from './ui/Panel';
import { resolveProp } from '../three/props';

interface InspectionModalProps {
  data: InspectionObjectData;
  onClose: () => void;
  onUnlockClue?: (clueId: string) => void;
  clueIds?: string[];
}

/** The inspection view and the house pull from the same registry entry. */
const PROP_FOR: Record<string, string> = {
  bedroom_clock: 'bedroom_clock',
  kitchen_clock: 'kitchen_clock',
  study_clock: 'study_clock',
  study_photo: 'study_photo',
  rotary_phone: 'rotary_phone',
  calendar_kyoto: 'calendar_kyoto',
};

export const InspectionModal: React.FC<InspectionModalProps> = ({ data, onClose, onUnlockClue, clueIds = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<InspectionHotspot | null>(data.hotspots[0] ?? null);
  const [inspectionTier, setInspectionTier] = useState(1);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [modelCredit, setModelCredit] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [viewerVersion, setViewerVersion] = useState(0);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectRef = useRef<THREE.Group | null>(null);
  const draggingRef = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const spin = useRef({ x: 0, y: 0 });
  const rotationTarget = useRef<{ x: number; y: number } | null>(null);
  const zoomTarget = useRef(3.4);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxTier = activeHotspot?.observationHidden || activeHotspot?.unlocksClueId ? 3 : 2;
  const missingClue = !!activeHotspot?.requiresClueId && !clueIds.includes(activeHotspot.requiresClueId);
  const complete = inspectionTier >= maxTier;

  useEffect(() => {
    setActiveHotspot(data.hotspots[0] ?? null);
    setInspectionTier(1);
    setLevels({});
    setDiscoveredClues([]);
    setNotification(null);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [data.id]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setStatus('error');
      return;
    }

    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 60);
    camera.position.set(0, 0, 3.4);
    cameraRef.current = camera;

    // Neutral studio light so the object's own textures read clearly.
    scene.add(new THREE.AmbientLight(0xc3c6d2, 0.85));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.1);
    key.position.set(2.5, 3.2, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x93a9c8, 0.7);
    fill.position.set(-3, -1, -2);
    scene.add(fill);

    const holder = new THREE.Group();
    scene.add(holder);
    objectRef.current = holder;

    let disposed = false;
    // Registry resources are cached and shared with the house. The inspection
    // view must never dispose their geometry, materials or textures.

    const frame = () => {
      const sphere = new THREE.Box3().setFromObject(holder).getBoundingSphere(new THREE.Sphere());
      if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      zoomTarget.current = (sphere.radius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.15;
      camera.position.z = zoomTarget.current;
    };

    setStatus('loading');
    resolveProp(PROP_FOR[data.id] ?? 'cedar_box').then((prop) => {
      if (disposed) return;
      const object = prop.build();
      // Scale the shared house prop up to a comfortable reading size.
      const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
      object.scale.setScalar(1.6 / Math.max(size.x, size.y, size.z, 0.001));
      holder.add(object);
      frame();
      setModelCredit(prop.credit);
      setStatus('ready');
    }).catch(() => { if (!disposed) setStatus('error'); });

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    let lastMove = 0;
    const onDown = (e: PointerEvent) => {
      if (!data.rotatable || e.button !== 0) return;
      e.preventDefault();
      dom.setPointerCapture(e.pointerId);
      draggingRef.current = true;
      rotationTarget.current = null;
      spin.current = { x: 0, y: 0 };
      prevPointer.current = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !objectRef.current) return;
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      objectRef.current.rotation.y += dx * 0.008;
      objectRef.current.rotation.x = THREE.MathUtils.clamp(objectRef.current.rotation.x + dy * 0.008, -1.35, 1.35);
      const now = performance.now();
      const elapsed = Math.max(0.016, (now - lastMove) / 1000);
      spin.current = {
        x: THREE.MathUtils.clamp((dy * 0.004) / elapsed, -2, 2),
        y: THREE.MathUtils.clamp((dx * 0.004) / elapsed, -3, 3),
      };
      lastMove = now;
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { draggingRef.current = false; };
    const onWheel = (e: WheelEvent) => {
      if (!data.zoomable || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      zoomTarget.current = THREE.MathUtils.clamp(zoomTarget.current + e.deltaY * 0.003, 1.4, 7);
    };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerup', onUp);
    dom.addEventListener('pointercancel', onUp);
    dom.addEventListener('lostpointercapture', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const resize = new ResizeObserver(() => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resize.observe(mount);

    const clock = new THREE.Timer();
    clock.connect(document);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      if (document.hidden) return;
      const object = objectRef.current;
      if (object && !draggingRef.current) {
        const target = rotationTarget.current;
        if (target) {
          const ease = 1 - Math.exp(-9 * dt);
          object.rotation.x += (target.x - object.rotation.x) * ease;
          object.rotation.y += (target.y - object.rotation.y) * ease;
        } else {
          object.rotation.y += spin.current.y * dt;
          object.rotation.x = THREE.MathUtils.clamp(object.rotation.x + spin.current.x * dt, -1.35, 1.35);
          spin.current.x *= Math.exp(-8 * dt);
          spin.current.y *= Math.exp(-8 * dt);
        }
      }
      camera.position.z += (zoomTarget.current - camera.position.z) * (1 - Math.exp(-10 * dt));
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clock.dispose();
      resize.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.removeEventListener('lostpointercapture', onUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      cameraRef.current = null;
      objectRef.current = null;
      if (mount.contains(dom)) mount.removeChild(dom);
    };
  }, [data.id, data.rotatable, data.zoomable, viewerVersion]);

  const selectHotspot = (hotspot: InspectionHotspot) => {
    soundManager.playClockTick();
    setActiveHotspot(hotspot);
    setInspectionTier(levels[hotspot.id] ?? 1);
    if (data.rotatable) {
      spin.current = { x: 0, y: 0 };
      rotationTarget.current = {
        x: hotspot.id.includes('base') ? -0.45 : 0,
        y: hotspot.id.includes('back') || hotspot.id.includes('cable') ? Math.PI : 0,
      };
    }
  };

  const deepen = () => {
    if (!activeHotspot || complete || (missingClue && inspectionTier >= 2)) return;
    const next = inspectionTier + 1;
    setInspectionTier(next);
    setLevels((prev) => ({ ...prev, [activeHotspot.id]: next }));
    soundManager.playClockTick();
    if (next >= maxTier && activeHotspot.unlocksClueId && !discoveredClues.includes(activeHotspot.unlocksClueId)) {
      setDiscoveredClues((prev) => [...prev, activeHotspot.unlocksClueId!]);
      onUnlockClue?.(activeHotspot.unlocksClueId);
      soundManager.playClueDiscovered();
      setNotification('Nova evidência registrada no diário.');
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setNotification(null), 4000);
    }
  };

  const zoom = (delta: number) => {
    if (!data.zoomable) return;
    zoomTarget.current = THREE.MathUtils.clamp(zoomTarget.current + delta, 1.4, 7);
  };

  return (
    <Panel
      title="INSPEÇÃO"
      subtitle={data.subtitle}
      onClose={onClose}
      width="max-w-6xl"
      surfaceClassName="inspection-panel"
      bodyClassName="inspection-panel-body"
      footer={<>
        <span role="status" aria-live="polite">{notification ?? 'Observe. Compare. Registre.'}</span>
        <span className="max-w-sm text-right text-[10px] tracking-wider">
          {status === 'loading' ? 'Carregando o modelo...' : status === 'error' ? 'Modo de leitura' : modelCredit}
        </span>
      </>}
    >
      <div className="inspection-layout">
        <section className="inspection-visual" aria-label="Objeto em três dimensões">
          <div>
            <span className="font-serif-jp text-[10px] tracking-[0.3em] text-neutral-500 uppercase">Objeto em exame</span>
            <h3 className="font-title text-xl tracking-[0.1em] text-neutral-100 mt-2">{data.title}</h3>
            {data.dateStr && <p className="font-mono text-[11px] tracking-wider text-neutral-400 mt-2">{data.dateStr}</p>}
          </div>

          <div className="inspection-view">
            <div ref={mountRef} className="inspection-canvas" />
            {status === 'error' && (
              <div className="absolute inset-0 grid place-content-center text-center px-6">
                <p className="inspection-note">A visualização 3D não está disponível.<br />Você ainda pode examinar os detalhes ao lado.</p>
                <button onClick={() => setViewerVersion((v) => v + 1)} className="inspection-action justify-center mt-4">
                  Tentar novamente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {status === 'loading' && (
              <div className="absolute inset-0 grid place-content-center pointer-events-none">
                <p className="inspection-note text-neutral-500">Preparando o objeto...</p>
              </div>
            )}
          </div>

          <div className="inspection-tools">
            <span className="font-serif-jp text-[11px] tracking-wider text-neutral-400">Arraste para girar · rolagem para aproximar</span>
            <div className="flex gap-1">
              <button className="inspection-tool" onClick={() => zoom(-0.45)} disabled={status !== 'ready' || !data.zoomable} aria-label="Aproximar"><ZoomIn className="w-4 h-4" /></button>
              <button className="inspection-tool" onClick={() => zoom(0.45)} disabled={status !== 'ready' || !data.zoomable} aria-label="Afastar"><ZoomOut className="w-4 h-4" /></button>
              <button
                className="inspection-tool"
                disabled={status !== 'ready' || !data.rotatable}
                aria-label="Ver o outro lado"
                onClick={() => {
                  if (!objectRef.current) return;
                  spin.current = { x: 0, y: 0 };
                  rotationTarget.current = { x: 0, y: (rotationTarget.current?.y ?? objectRef.current.rotation.y) + Math.PI };
                }}
              ><FlipHorizontal className="w-4 h-4" /></button>
              <button
                className="inspection-tool"
                disabled={status !== 'ready' || !data.rotatable}
                aria-label="Restaurar orientação"
                onClick={() => { spin.current = { x: 0, y: 0 }; rotationTarget.current = { x: 0, y: 0 }; }}
              ><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>
        </section>

        <aside className="inspection-reading" aria-label="Observações de Gabriela">
          <p className="font-serif-jp text-[10px] uppercase tracking-[0.3em] text-neutral-400">Pontos de interesse</p>
          <nav className="flex flex-wrap mb-7 mt-2" aria-label="Partes do objeto">
            {data.hotspots.map((hotspot) => (
              <button key={hotspot.id} className="inspection-part" aria-pressed={activeHotspot?.id === hotspot.id} onClick={() => selectHotspot(hotspot)}>
                {hotspot.label}
              </button>
            ))}
          </nav>

          {activeHotspot && (
            <div key={activeHotspot.id}>
              <div className="flex items-center justify-between gap-4 mb-5">
                <span className="font-serif-jp text-[11px] tracking-[0.14em] text-neutral-400">
                  {complete ? 'Exame concluído' : inspectionTier === 1 ? 'Primeiro olhar' : 'Um olhar mais atento'}
                </span>
                <span className="flex gap-1.5" aria-label={`Nível ${inspectionTier} de ${maxTier}`}>
                  {Array.from({ length: maxTier }, (_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${i < inspectionTier ? 'bg-neutral-200' : 'bg-neutral-700'}`} />
                  ))}
                </span>
              </div>

              <div className="space-y-5" aria-live="polite">
                <section className="inspection-observation">
                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5">01 / Observação</p>
                  <p className="inspection-note">{activeHotspot.observationBasic}</p>
                </section>
                {inspectionTier >= 2 && (
                  <section className="inspection-observation">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5">02 / Detalhe</p>
                    <p className="inspection-note">{activeHotspot.observationDetailed}</p>
                  </section>
                )}
                {inspectionTier >= 3 && activeHotspot.observationHidden && !missingClue && (
                  <section className="inspection-observation">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-neutral-400 mb-1.5">03 / Registro</p>
                    <p className="inspection-note text-neutral-100">{activeHotspot.observationHidden}</p>
                  </section>
                )}
              </div>

              {complete && !missingClue && (
                <div className="inspection-observation">
                  <Hairline label="Gabriela" />
                  <p className="inspection-note italic pl-3 border-l border-neutral-600">“{activeHotspot.gabrielaMonologue}”</p>
                </div>
              )}

              <div className="mt-7 pt-3 border-t border-neutral-700/40">
                {complete ? (
                  <span className="flex items-center gap-2 text-neutral-400 text-xs font-serif-jp py-3">
                    <Check className="w-3.5 h-3.5" />Este ponto foi examinado.
                  </span>
                ) : (
                  <button className="inspection-action" disabled={missingClue && inspectionTier >= 2} onClick={deepen}>
                    {missingClue && inspectionTier >= 2 ? 'É preciso encontrar outra pista' : inspectionTier === 1 ? 'Observar mais de perto' : 'Investigar o detalhe'}
                    {!(missingClue && inspectionTier >= 2) && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={onClose} className="block text-[11px] font-serif-jp tracking-wider text-neutral-500 hover:text-neutral-200 py-2">
                  Voltar à exploração
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </Panel>
  );
};
