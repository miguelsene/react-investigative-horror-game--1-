import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as Mo from './models';

/* ============================================================
   SHARED PROP REGISTRY
   ------------------------------------------------------------
   Every inspectable object is defined exactly once here. The
   house and the inspection view both resolve through this module,
   so what you examine is always the object standing in the room.

   Remote entries are real CC0 assets from Poly Haven, verified
   against their API. If a download fails the local model is used
   for BOTH views, so the two can never drift apart.
   ============================================================ */

export interface PropSource {
  build: () => THREE.Group;
  credit: string;
  remote: boolean;
  /** Height in metres the prop should occupy when placed in the house. */
  sceneHeight: number;
}

interface RemoteAsset {
  id: string;
  name: string;
  authors: string;
}

interface PropSpec {
  sceneHeight: number;
  local: () => THREE.Group;
  localCredit: string;
  remote?: RemoteAsset;
  /** Extra detail laid onto the downloaded model (photo inside a frame...). */
  decorate?: (model: THREE.Group, size: THREE.Vector3) => void;
}

const SPECS: Record<string, PropSpec> = {
  bedroom_clock: {
    sceneHeight: 0.2,
    local: () => Mo.bedsideClock().group,
    localCredit: 'Despertador — modelo do projeto',
    remote: { id: 'alarm_clock_01', name: 'Alarm Clock 01', authors: 'James Ray Cock, Yann Kervran' },
  },
  study_photo: {
    sceneHeight: 0.42,
    local: () => Mo.framedPhoto().group,
    localCredit: 'Retrato emoldurado — modelo do projeto',
    remote: { id: 'hanging_picture_frame_03', name: 'Hanging Picture Frame 03', authors: 'James Ray Cock' },
    decorate: (model, size) => {
      // Lay the 1974 photograph into the frame opening, front and back.
      const front = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x * 0.54, size.y * 0.64),
        new THREE.MeshBasicMaterial({ map: Mo.photoFrontTexture(), toneMapped: false }),
      );
      front.position.z = size.z / 2 + 0.003;
      model.add(front);
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x * 0.54, size.y * 0.64),
        new THREE.MeshBasicMaterial({ map: Mo.photoBackTexture(), toneMapped: false }),
      );
      back.rotation.y = Math.PI;
      back.position.z = -size.z / 2 - 0.003;
      model.add(back);
    },
  },
  kitchen_clock: {
    sceneHeight: 0.86,
    local: () => Mo.wallClock(6, 43, 17, true).group,
    localCredit: 'Relógio de parede — modelo do projeto',
  },
  study_clock: {
    sceneHeight: 0.86,
    local: () => Mo.wallClock(3, 17, 0, false).group,
    localCredit: 'Relógio do escritório — modelo do projeto',
  },
  rotary_phone: {
    sceneHeight: 0.22,
    local: () => Mo.rotaryPhone().group,
    localCredit: 'Telefone de disco — modelo do projeto',
  },
  calendar_kyoto: {
    sceneHeight: 0.98,
    local: () => Mo.calendar().group,
    localCredit: 'Calendário — modelo do projeto',
  },
  living_tv: {
    sceneHeight: 0.62,
    local: () => Mo.crtTV().group,
    localCredit: 'Televisor — modelo do projeto',
    remote: { id: 'Television_01', name: 'Television 01', authors: 'Gabriel Radić' },
  },
  cedar_box: {
    sceneHeight: 0.3,
    local: () => Mo.cedarBox().group,
    localCredit: 'Caixa de cedro — modelo do projeto',
    remote: { id: 'CheeseBox_01', name: 'CheeseBox 01', authors: 'Gabriel Radić' },
  },
};

const gltfUrl = (id: string) => `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/${id}/${id}_1k.gltf`;

/**
 * Poly Haven keeps a glTF beside its BIN but stores its referenced JPG maps
 * under Models/jpg, not under Models/gltf. GLTFLoader normally resolves the
 * glTF's `textures/foo.jpg` URI next to the glTF, which returns an error and
 * leaves the otherwise valid mesh white. Rewrite only those image requests.
 */
const polyHavenLoader = (assetId: string) => {
  let textureFailed = false;
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((request) => {
    const marker = `/Models/gltf/1k/${assetId}/textures/`;
    const at = request.indexOf(marker);
    if (at < 0) return request;
    const file = request.slice(at + marker.length).split(/[?#]/)[0];
    return `https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/${assetId}/${file}`;
  });
  manager.onError = (request) => {
    if (/\.(jpe?g|png|webp)(?:$|[?#])/i.test(request)) textureFailed = true;
  };
  const loader = new GLTFLoader(manager);
  loader.setCrossOrigin('anonymous');
  return { loader, textureFailed: () => textureFailed };
};

/** Refuse a remote model unless at least one real base-colour map loaded. */
const hasReadyTextures = (root: THREE.Object3D) => {
  let textured = false;
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const map = (material as THREE.MeshStandardMaterial).map;
      const image = map?.image as { width?: number; height?: number } | undefined;
      if (map && (image?.width ?? 0) > 0 && (image?.height ?? 0) > 0) textured = true;
    });
  });
  return textured;
};

const withTimeout = <T,>(task: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    task.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });

/** Centre the model on its own origin and normalise it to a known height. */
const normalise = (source: THREE.Object3D, targetHeight: number) => {
  const holder = new THREE.Group();
  holder.add(source);
  const bounds = new THREE.Box3().setFromObject(holder);
  const size = bounds.getSize(new THREE.Vector3());
  holder.scale.setScalar(targetHeight / Math.max(size.y, 0.0001));
  const scaled = new THREE.Box3().setFromObject(holder);
  holder.position.sub(scaled.getCenter(new THREE.Vector3()));
  holder.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  const wrapper = new THREE.Group();
  wrapper.add(holder);
  return { wrapper, size: scaled.getSize(new THREE.Vector3()) };
};

const resolved = new Map<string, Promise<PropSource>>();

/**
 * Resolves a prop once and caches it. Because the house and the
 * inspection view share this promise, both always render the same object.
 */
export const resolveProp = (id: string): Promise<PropSource> => {
  const cached = resolved.get(id);
  if (cached) return cached;

  const spec = SPECS[id];
  if (!spec) {
    const missing = Promise.resolve<PropSource>({
      build: () => new THREE.Group(),
      credit: '',
      remote: false,
      sceneHeight: 1,
    });
    resolved.set(id, missing);
    return missing;
  }

  const localSource = (): PropSource => ({
    build: () => spec.local(),
    credit: spec.localCredit,
    remote: false,
    sceneHeight: spec.sceneHeight,
  });

  const task = (async (): Promise<PropSource> => {
    if (!spec.remote) return localSource();
    try {
      const remote = polyHavenLoader(spec.remote.id);
      const gltf = await withTimeout(remote.loader.loadAsync(gltfUrl(spec.remote.id)), 20000);
      if (remote.textureFailed() || !hasReadyTextures(gltf.scene)) {
        throw new Error(`Texturas incompletas em ${spec.remote.id}`);
      }
      const { wrapper, size } = normalise(gltf.scene, spec.sceneHeight);
      spec.decorate?.(wrapper, size);
      return {
        build: () => wrapper.clone(true),
        credit: `${spec.remote.name} · ${spec.remote.authors} · Poly Haven (CC0)`,
        remote: true,
        sceneHeight: spec.sceneHeight,
      };
    } catch {
      return localSource();
    }
  })();

  resolved.set(id, task);
  return task;
};

/** Immediately usable local stand-in, identical to the registry fallback. */
export const localProp = (id: string): THREE.Group | null => {
  const spec = SPECS[id];
  return spec ? spec.local() : null;
};
