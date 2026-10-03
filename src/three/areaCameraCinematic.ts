import * as THREE from 'three';

export type AreaCameraStyle = 'house' | 'street' | 'school';

const SHOTS: Record<AreaCameraStyle, [number, number, number][]> = {
  house: [[5.5, 6.2, 6.2], [-6.8, 6.4, 3.5], [-4.6, 5.5, -6.5]],
  street: [[10.5, 7.2, 12], [-11, 6.5, 6], [-2.5, 3.6, -11]],
  school: [[5.2, 3.35, 6.2], [-5.4, 3.15, 5.4], [4.5, 2.8, -6]],
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Sweeps the camera around the current scene, then blends back to its follow shot. */
export const applyAreaCameraCinematic = (
  camera: THREE.PerspectiveCamera,
  focus: THREE.Vector3,
  startPosition: THREE.Vector3,
  progress: number,
  style: AreaCameraStyle,
) => {
  const followPosition = camera.position.clone();
  const followRotation = camera.quaternion.clone();
  const shots = SHOTS[style].map(([x, y, z]) => new THREE.Vector3(focus.x + x, focus.y + y, focus.z + z));
  const route = [startPosition, ...shots];
  const travel = Math.min(1, Math.max(0, progress) / 0.78) * (route.length - 1);
  const index = Math.min(route.length - 2, Math.floor(travel));
  const localT = smooth(travel - index);
  const shotPosition = route[index].clone().lerp(route[index + 1], localT);
  const target = focus.clone().add(new THREE.Vector3(0, style === 'street' ? 0.7 : 0.85, 0));

  camera.position.copy(shotPosition);
  camera.lookAt(target);
  camera.updateMatrixWorld();

  if (progress > 0.78) {
    const returnT = smooth(Math.min(1, (progress - 0.78) / 0.22));
    camera.position.lerp(followPosition, returnT);
    camera.quaternion.slerp(followRotation, returnT);
    camera.updateMatrixWorld();
  }
};
