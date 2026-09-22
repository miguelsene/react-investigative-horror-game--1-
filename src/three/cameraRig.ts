import * as THREE from 'three';

const VIEWS = [
  { height: 7.2, distance: 8.2, look: 0.65 },
  { height: 4.9, distance: 5.4, look: 0.78 },
  { height: 3.1, distance: 3.5, look: 0.9 },
];

/**
 * Hand-held exploration camera.
 *
 * Layers, from largest to smallest:
 *   follow    — eases toward Gabriela
 *   lead      — leans slightly in the direction she walks
 *   breathing — slow idle drift, always present
 *   footsteps — vertical bob and lateral roll while walking
 *   drift     — very slow wandering so the frame is never perfectly still
 *   impulse   — a small settle after interacting or changing floor
 *
 * Everything scales with `motion`, which is off during reading and when the
 * player prefers reduced motion.
 */
export class ExplorationCamera {
  private anchor = new THREE.Vector3();
  private look = new THREE.Vector3();
  private lead = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private step = 0;
  private walk = 0;
  private gain = 0;
  private lookHeight = 0.65;
  private impulse = 0;
  private roll = 0;

  constructor(
    private camera: THREE.PerspectiveCamera,
    position: THREE.Vector3,
    zoom: number,
    private override?: { height: number; distance: number; look: number },
  ) {
    const view = this.viewFor(zoom);
    this.anchor.copy(position);
    this.lookHeight = view.look;
    camera.position.set(position.x, view.height, position.z + view.distance);
    camera.lookAt(position.x, view.look, position.z);
    camera.updateMatrixWorld();
  }

  /** A short settle, used when Gabriela interacts with something. */
  kick(strength = 1) {
    this.impulse = Math.min(1.4, this.impulse + strength);
  }

  private viewFor(zoom: number) {
    if (this.override && zoom === 0) return this.override;
    return VIEWS[zoom] ?? VIEWS[0];
  }

  update(
    position: THREE.Vector3,
    vx: number,
    vz: number,
    dt: number,
    time: number,
    zoom: number,
    motion: boolean,
    paused: boolean,
  ) {
    const view = this.viewFor(zoom);
    const follow = 1 - Math.exp(-7 * dt);
    const ease = 1 - Math.exp(-5 * dt);
    const speed = Math.hypot(vx, vz);
    const walking = Math.min(1, speed / 2.9);

    this.anchor.lerp(position, follow);
    this.walk += (walking - this.walk) * ease;
    this.gain += ((motion && !paused ? 1 : 0) - this.gain) * ease;
    this.lookHeight += (view.look - this.lookHeight) * ease;
    this.impulse *= Math.exp(-6 * dt);

    // Stride phase advances with real distance, so the bob matches the feet.
    this.step += (speed * 1.5 + 0.9) * dt;

    const g = this.gain;
    const w = this.walk;

    // Lead the camera a little ahead of her movement.
    this.lead.x += ((motion ? vx * 0.075 : 0) - this.lead.x) * ease;
    this.lead.z += ((motion ? vz * 0.055 : 0) - this.lead.z) * ease;

    // Breathing is always there; footsteps and drift layer on top.
    const breatheY = Math.sin(time * 0.62) * 0.016;
    const breatheX = Math.sin(time * 0.41) * 0.013;
    const bobY = Math.sin(this.step * 2) * 0.026 * w;
    const bobX = Math.sin(this.step) * 0.021 * w;
    const driftX = Math.sin(time * 0.17 + 1.3) * 0.02 + Math.sin(time * 0.071) * 0.014;
    const driftY = Math.cos(time * 0.13 + 0.7) * 0.015;
    const settle = Math.sin(this.impulse * Math.PI * 3) * this.impulse * 0.05;

    const offsetX = (breatheX + bobX + driftX) * g;
    const offsetY = (breatheY + bobY + driftY + settle) * g;

    this.desired.set(
      this.anchor.x + this.lead.x + offsetX,
      view.height + offsetY,
      this.anchor.z + view.distance + this.lead.z,
    );
    this.camera.position.lerp(this.desired, follow);

    this.look.set(
      this.anchor.x + this.lead.x * 0.45 + offsetX * 0.35,
      this.lookHeight + offsetY * 0.3,
      this.anchor.z + this.lead.z * 0.45,
    );
    this.camera.lookAt(this.look);

    // Gentle roll: leans into turns and rocks with the stride.
    const targetRoll = (Math.sin(this.step) * 0.0016 * w - vx * 0.0022 * (motion ? 1 : 0)) * g;
    this.roll += (targetRoll - this.roll) * ease;
    this.camera.rotation.z += this.roll;
    this.camera.updateMatrixWorld();
  }
}
