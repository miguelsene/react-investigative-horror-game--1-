import * as THREE from 'three';
import { WorldHotspot } from '../components/ThreeWorld';
import { MapBuild } from './worldMaps';
import { buildExterior, Collider } from './house';

export interface PlayableMap {
  build: MapBuild;
  hasExterior: boolean;
  currentFloor: 1 | 2;
  stairsTo?: 1 | 2;
  groundHeight: (x: number, z: number) => number;
  spawn?: [number, number];
}

export const createHouseMap = (floor: 1 | 2): PlayableMap => {
  const scenePlaceholder = new THREE.Scene();
  const exterior = buildExterior(scenePlaceholder);
  return {
    // buildFloor needs the real scene; this shell is resolved by the caller.
    build: {
      group: new THREE.Group(),
      colliders: [],
      stairs: { x: 0, z: 0, r: 0 },
      spawn: floor === 1 ? [7.2, 0.4] : [-3.3, 0.9],
      bounds: () => ({ minX: -10, maxX: 10, minZ: -3, maxZ: 5 }),
      roomOf: () => 'bedroom',
      animate: () => {},
      dispose: () => exterior.dispose(),
    },
    hasExterior: true,
    currentFloor: floor,
    stairsTo: floor === 1 ? 2 : 1,
    groundHeight: (x, z) => (floor === 1 && (x > 6.4 || z > 3.35) ? 0.09 : 0.18),
  };
};

export const collidesMap = (x: number, z: number, colliders: Collider[], radius = 0.27) => {
  for (const c of colliders) {
    if (Math.abs(x - c.x) < c.w / 2 + radius && Math.abs(z - c.z) < c.d / 2 + radius) return true;
  }
  return false;
};

/** Structural-only line of sight check; furniture does not block prompts. */
export const canReachInMap = (from: THREE.Vector3, spot: WorldHotspot, map: MapBuild) => {
  if (map.roomOf(from.x, from.z) !== map.roomOf(spot.position[0], spot.position[2])) return false;
  return !map.colliders.some((c) => {
    if (c.w > 0.22 && c.d > 0.22) return false;
    for (let i = 1; i < 7; i++) {
      const x = from.x + (spot.position[0] - from.x) * (i / 7);
      const z = from.z + (spot.position[2] - from.z) * (i / 7);
      if (Math.abs(x - c.x) < c.w / 2 && Math.abs(z - c.z) < c.d / 2) return true;
    }
    return false;
  });
};
