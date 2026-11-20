import { generateFormation } from "./utils.js";

const EASES = {
  linear: (t) => t,
  "power2.inOut": (t) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  "power3.out": (t) => 1 - Math.pow(1 - t, 3),
  "expo.out": (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

/**
 * ParticleController - Motion control and physics simulation.
 * Handles formations, morphing, and particle physics with no external deps.
 */
export class ParticleController {
  constructor(store, options = {}) {
    this.store = store;
    this.count = store.count;
    this.renderer = null; // Set externally

    // Formation targets - can be set dynamically
    this.formations = {};
    this.currentFormation = null;

    // Transition state
    this.transitionObj = { progress: 0 };
    this.tween = null;
    this.startPositions = new Float32Array(this.count * 3);
    this.endPositions = null;

    // Physics configuration
    this.physics = {
      gravity: options.gravity ?? 8.0,
      friction: options.friction ?? 0.92,
      turbulence: options.turbulence ?? 2.0,
      settlingForce: options.settlingForce ?? 0.15,
      windX: 0,
      windZ: 0,
    };

    // Mouse interaction
    this.mouseRadius = options.mouseRadius ?? 200;
    this.mousePushStrength = options.mousePushStrength ?? 80;
  }

  /**
   * Set available formations
   * @param {Object} formations - { name: Float32Array(count * 3), ... }
   */
  setFormations(formations) {
    this.formations = { ...this.formations, ...formations };
  }

  /**
   * Set theme on the renderer
   * @param {string|object} config - 'light' | 'dark' | { bg, particle, colorPalette }
   * @param {object} options - { animate?: boolean }
   */
  setTheme(config, options) {
    if (this.renderer) {
      this.renderer.setTheme(config, options);
    }
  }

  /**
   * Instantly snap to a formation
   * @param {string} formationKey - Name of the formation
   */
  snapTo(formationKey) {
    const target = this.formations[formationKey];
    if (!target) {
      console.warn(`Formation "${formationKey}" not found`);
      return;
    }

    this.currentFormation = formationKey;
    this.endPositions = target;
    this.tween = null;
    this.transitionObj.progress = 1;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.store.x[i] = target[i3];
      this.store.y[i] = target[i3 + 1];
      this.store.z[i] = target[i3 + 2];
      this.store.vx[i] = 0;
      this.store.vy[i] = 0;
      this.store.vz[i] = 0;
    }
  }

  /**
   * Smoothly morph to a formation
   * @param {string} formationKey - Name of the formation
   * @param {number} duration - Animation duration in seconds
   * @param {string} ease - Ease name ('linear' | 'power2.inOut' | 'power3.out' | 'expo.out')
   */
  morphTo(formationKey, duration = 1.0, ease = "power2.inOut") {
    const target = this.formations[formationKey];
    if (!target) {
      console.warn(`Formation "${formationKey}" not found`);
      return;
    }

    this.currentFormation = formationKey;
    this.morphToTarget(target, duration, ease);
  }

  /**
   * Morph directly to a target position array
   * @param {Float32Array} target - Position array (count * 3)
   * @param {number} duration
   * @param {string} ease
   */
  morphToTarget(target, duration = 1.0, ease = "power2.inOut") {
    // Capture current positions as start
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.startPositions[i3] = this.store.x[i];
      this.startPositions[i3 + 1] = this.store.y[i];
      this.startPositions[i3 + 2] = this.store.z[i];
    }

    this.endPositions = target;
    this.transitionObj.progress = 0;
    this.tween = {
      elapsed: 0,
      duration: Math.max(duration, 0.001),
      ease: EASES[ease] || EASES["power2.inOut"],
    };
  }

  /**
   * Form text shape from canvas
   * @param {string} text - Text to form
   * @param {object} options - { fontSize, font, width, height, duration, ease }
   */
  formText(text, options = {}) {
    const width = options.width ?? this.renderer?.width ?? window.innerWidth;
    const height =
      options.height ?? this.renderer?.height ?? window.innerHeight;

    const pos = generateFormation.fromText(text, this.count, {
      ...options,
      width,
      height,
    });

    this.currentFormation = "text";
    this.morphToTarget(pos, options.duration ?? 1.5, options.ease ?? "expo.out");
  }

  /**
   * Update physics config
   */
  setPhysics(config) {
    Object.assign(this.physics, config);
  }

  /**
   * Main update loop - called every frame by ParticleEngine
   */
  update(time, dt, mouse) {
    const safeDt = Math.min(dt, 0.05);

    // Advance the morph tween
    if (this.tween) {
      this.tween.elapsed += safeDt;
      const p = Math.min(this.tween.elapsed / this.tween.duration, 1);
      this.transitionObj.progress = this.tween.ease(p);
      if (p >= 1) {
        this.tween = null;
        this.transitionObj.progress = 1;
      }
    }

    const t = this.transitionObj.progress;
    const { gravity, friction, turbulence, settlingForce } = this.physics;

    // Update wind
    this.physics.windX = Math.sin(time * 0.3) * 2 + Math.sin(time * 0.7) * 1;
    this.physics.windZ = Math.cos(time * 0.4) * 1.5;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const mass = this.store.mass[i];

      // Calculate target position
      let targetX, targetY, targetZ;
      if (!this.endPositions) {
        targetX = this.store.x[i];
        targetY = this.store.y[i];
        targetZ = this.store.z[i];
      } else if (t >= 1) {
        targetX = this.endPositions[i3];
        targetY = this.endPositions[i3 + 1];
        targetZ = this.endPositions[i3 + 2];
      } else if (t <= 0) {
        targetX = this.startPositions[i3];
        targetY = this.startPositions[i3 + 1];
        targetZ = this.startPositions[i3 + 2];
      } else {
        targetX =
          this.startPositions[i3] +
          (this.endPositions[i3] - this.startPositions[i3]) * t;
        targetY =
          this.startPositions[i3 + 1] +
          (this.endPositions[i3 + 1] - this.startPositions[i3 + 1]) * t;
        targetZ =
          this.startPositions[i3 + 2] +
          (this.endPositions[i3 + 2] - this.startPositions[i3 + 2]) * t;
      }

      // Current state
      let px = this.store.x[i];
      let py = this.store.y[i];
      let pz = this.store.z[i];
      let vx = this.store.vx[i];
      let vy = this.store.vy[i];
      let vz = this.store.vz[i];

      // Settling force (spring toward target)
      const dx = targetX - px;
      const dy = targetY - py;
      const dz = targetZ - pz;
      const distToTarget = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const springForce = settlingForce * (1 + distToTarget * 0.001);

      vx += dx * springForce * safeDt * 60;
      vy += dy * springForce * safeDt * 60;
      vz += dz * springForce * safeDt * 60;

      // Gravity (when not at target)
      if (distToTarget > 5) {
        vy += gravity * mass * safeDt;
      }

      // Wind
      vx += this.physics.windX * safeDt * 2;
      vz += this.physics.windZ * safeDt * 2;

      // Turbulence
      const turbX = (Math.sin(time * 2.1 + i * 0.37) * 2 - 1) * turbulence;
      const turbY = (Math.cos(time * 1.8 + i * 0.53) * 2 - 1) * turbulence;
      const turbZ = (Math.sin(time * 2.4 + i * 0.71) * 2 - 1) * turbulence;
      vx += turbX * safeDt * 10;
      vy += turbY * safeDt * 10;
      vz += turbZ * safeDt * 10;

      // Mouse interaction
      if (mouse) {
        const mdx = px - mouse.x;
        const mdy = py - mouse.y;
        const mdistSq = mdx * mdx + mdy * mdy;
        const mradiusSq = this.mouseRadius * this.mouseRadius;

        if (mdistSq < mradiusSq && mdistSq > 1) {
          const mdist = Math.sqrt(mdistSq);
          const force = 1 - mdist / this.mouseRadius;
          const angle = Math.atan2(mdy, mdx);
          const pushStrength = force * force * this.mousePushStrength;

          vx += Math.cos(angle) * pushStrength * safeDt;
          vy += Math.sin(angle) * pushStrength * safeDt;
          vz += force * 20 * safeDt;
        }
      }

      // Friction
      vx *= friction;
      vy *= friction;
      vz *= friction;

      // Velocity clamping
      const maxVel = 100;
      const velMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (velMag > maxVel) {
        const scale = maxVel / velMag;
        vx *= scale;
        vy *= scale;
        vz *= scale;
      }

      // Update position
      px += vx * safeDt * 60;
      py += vy * safeDt * 60;
      pz += vz * safeDt * 60;

      // Write back
      this.store.x[i] = px;
      this.store.y[i] = py;
      this.store.z[i] = pz;
      this.store.vx[i] = vx;
      this.store.vy[i] = vy;
      this.store.vz[i] = vz;
    }
  }
}
