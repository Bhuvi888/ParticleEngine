import { ParticleStore } from "./ParticleStore.js";
import { ParticleRenderer } from "./ParticleRenderer.js";

/**
 * ParticleEngine - Core animation loop and event handling.
 * Sizes itself to its canvas element (not the window), so it can be embedded
 * in any container. Tracks the mouse relative to the canvas.
 */
export class ParticleEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.store = new ParticleStore(options.count || 1500);
    this.renderer = new ParticleRenderer(canvas, {
      transparent: options.transparent,
      fov: options.fov,
    });

    this.rafId = null;
    this.isRunning = false;
    this.interactive = options.interactive !== false;

    // Mouse position in canvas-centered coordinates
    this.mouse = { x: 0, y: 0 };

    // Bind methods
    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Initial resize
    this.handleResize();

    // Resize with the canvas element itself (container-driven)
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", this.handleResize);
    }

    if (this.interactive) {
      window.addEventListener("mousemove", this.handleMouseMove, {
        passive: true,
      });
    }
  }

  start(onUpdate) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onUpdate = onUpdate;
    this.lastTime = performance.now();
    this.loop();
  }

  /** Draw a single static frame (used for prefers-reduced-motion). */
  renderOnce(onUpdate) {
    this.stop();
    if (onUpdate) onUpdate(performance.now() / 1000, 0, this.mouse);
    this.renderer.tick(0);
    this.renderer.clear();
    this.renderer.draw(this.store);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop() {
    if (!this.isRunning) return;

    const time = performance.now();
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Update callback (Controller)
    if (this.onUpdate) {
      this.onUpdate(time / 1000, dt, this.mouse);
    }

    // Render
    this.renderer.tick(dt);
    this.renderer.clear();
    this.renderer.draw(this.store);

    this.rafId = requestAnimationFrame(this.loop);
  }

  handleResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (
      width === this.renderer.width &&
      height === this.renderer.height &&
      dpr === this.renderer.dpr
    ) {
      return;
    }

    this.renderer.resize(width, height, dpr);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Normalize to canvas-centered coordinates
    this.mouse.x = e.clientX - rect.left - rect.width / 2;
    this.mouse.y = e.clientY - rect.top - rect.height / 2;
  }

  dispose() {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }
}
