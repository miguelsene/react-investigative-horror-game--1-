import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ============================================================
   READY-MADE 3D MODELS (CC0, Poly Haven) for inspectable items.
   Each inspectable id maps to an ordered list of candidate Poly
   Haven asset ids; the first one that loads wins. If none loads
   (offline, blocked network...) the caller keeps its procedural
   model, so the game never shows an empty inspection view.
   ============================================================ */

export interface ReadyModel {
  group: THREE.Group;
  credit: string;
  /** front-face bounding box (after normalisation) */
  box: THREE.Box3;
}

const CANDIDATES: Record<string, { id: string; name: string; rotY?: number; fit?: number }[]> = {
  bedroom_clock: [{ id: 'alarm_clock_01', name: 'Alarm Clock 01', fit: 1.7 }],
  study_photo: [{ id: 'hanging_picture_frame_03', name: 'Hanging Picture Frame 03', fit: 2.0 }],
  calendar_kyoto: [{ id: 'fancy_picture_frame_01', name: 'Fancy Picture Frame 01', fit: 2.0 }],
  kitchen_clock: [
    { id: 'wall_clock_01', name: 'Wall Clock 01', fit: 1.8 },
    { id: 'vintage_wall_clock_01', name: 'Vintage Wall Clock 01', fit: 1.8 },
  ],
  rotary_phone: [
    { id: 'rotary_phone_01', name: 'Rotary Phone 01', fit: 1.8 },
    { id: 'vintage_telephone_01', name: 'Vintage Telephone 01', fit: 1.8 },
    { id: 'old_telephone_01', name: 'Old Telephone 01', fit: 1.8 },
  ],
};

const url = (id: string) => `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/${id}/${id}_1k.gltf`;

const cache = new Map<string, Promise<ReadyModel | null>>();
const loader = new GLTFLoader();
loader.setCrossOrigin('anonymous');

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });

const normalise = (scene: THREE.Object3D, fit: number, rotY: number) => {
  const g = new THREE.Group();
  scene.rotation.y = rotY;
  g.add(scene);
  const box = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = fit / Math.max(size.x, size.y, size.z, 0.001);
  g.scale.setScalar(s);
  const box2 = new THREE.Box3().setFromObject(g);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  g.position.sub(center);
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.8;
    }
  });
  return { group: g, box: new THREE.Box3().setFromObject(g) };
};

export const loadReadyModel = (inspectableId: string): Promise<ReadyModel | null> => {
  if (cache.has(inspectableId)) return cache.get(inspectableId)!;
  const list = CANDIDATES[inspectableId] ?? [];
  const p = (async () => {
    for (const cand of list) {
      try {
        const gltf = await withTimeout(loader.loadAsync(url(cand.id)), 12000);
        const { group, box } = normalise(gltf.scene, cand.fit ?? 1.8, cand.rotY ?? 0);
        return { group, box, credit: `${cand.name} · Poly Haven (CC0)` };
      } catch {
        /* try the next candidate */
      }
    }
    return null;
  })();
  cache.set(inspectableId, p);
  return p;
};

/** Returns a fresh clone so the same cached model can be shown repeatedly. */
export const cloneReadyModel = (m: ReadyModel): THREE.Group => m.group.clone(true);
