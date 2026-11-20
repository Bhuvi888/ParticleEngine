/**
 * ParticleRenderer - 2D canvas rendering with 3D projection.
 * DPR-aware, supports transparent backgrounds and smooth theme transitions.
 */
export class ParticleRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.fov = options.fov ?? 800;
    this.transparent = options.transparent === true;

    this.theme = {
      bgColor: { r: 255, g: 255, b: 255, a: 1 },
      particleColor: { r: 0, g: 0, b: 0 },
      targetBg: { r: 255, g: 255, b: 255, a: 1 },
      targetParticle: { r: 0, g: 0, b: 0 },
      useColorVariation: false,
      colorPalette: [],
      transitioning: false,
    };
  }

  /**
   * Resize the backing store to width/height (CSS px) scaled by dpr.
   * The canvas CSS size is controlled by styles, never by this method.
   */
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setTransparent(transparent) {
    this.transparent = transparent === true;
  }

  /**
   * Set theme - accepts a preset string or a custom config object.
   * @param {string|object} config - 'light' | 'dark' | { bg, particle, colorPalette }
   * @param {object|number} options - { animate?: boolean } (a number is treated as legacy progress)
   */
  setTheme(config, options = {}) {
    if (typeof options === "number") options = { animate: options < 1 };

    if (typeof config === "string") {
      if (config === "dark") {
        this.theme.targetBg = { r: 10, g: 10, b: 10, a: 1 };
        this.theme.targetParticle = { r: 255, g: 255, b: 255 };
        this.theme.useColorVariation = false;
      } else {
        this.theme.targetBg = { r: 255, g: 255, b: 255, a: 1 };
        this.theme.targetParticle = { r: 0, g: 0, b: 0 };
        this.theme.useColorVariation = false;
      }
    } else if (config && typeof config === "object") {
      if (config.bg) {
        this.theme.targetBg = { ...this.theme.targetBg, ...config.bg };
      }
      if (config.particle) {
        this.theme.targetParticle = {
          ...this.theme.targetParticle,
          ...config.particle,
        };
      }
      if (config.colorPalette) {
        this.theme.colorPalette = config.colorPalette;
        this.theme.useColorVariation = config.colorPalette.length > 0;
      }
    }

    if (options.animate === false) {
      this.snapTheme();
    } else {
      this.theme.transitioning = true;
    }
  }

  snapTheme() {
    this.theme.bgColor = { ...this.theme.targetBg };
    this.theme.particleColor = { ...this.theme.targetParticle };
    this.theme.transitioning = false;
  }

  /** Exponential smoothing toward theme targets. Call once per frame. */
  tick(dt) {
    if (!this.theme.transitioning) return;

    const { bgColor, targetBg, particleColor, targetParticle } = this.theme;
    const k = 1 - Math.pow(0.0001, Math.min(dt, 0.05));
    const lerp = (a, b) => a + (b - a) * k;

    bgColor.r = lerp(bgColor.r, targetBg.r);
    bgColor.g = lerp(bgColor.g, targetBg.g);
    bgColor.b = lerp(bgColor.b, targetBg.b);
    bgColor.a = lerp(bgColor.a, targetBg.a);

    particleColor.r = lerp(particleColor.r, targetParticle.r);
    particleColor.g = lerp(particleColor.g, targetParticle.g);
    particleColor.b = lerp(particleColor.b, targetParticle.b);

    const done =
      Math.abs(bgColor.r - targetBg.r) < 0.5 &&
      Math.abs(bgColor.g - targetBg.g) < 0.5 &&
      Math.abs(bgColor.b - targetBg.b) < 0.5 &&
      Math.abs(bgColor.a - targetBg.a) < 0.005 &&
      Math.abs(particleColor.r - targetParticle.r) < 0.5 &&
      Math.abs(particleColor.g - targetParticle.g) < 0.5 &&
      Math.abs(particleColor.b - targetParticle.b) < 0.5;

    if (done) this.snapTheme();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.transparent) return;

    const { r, g, b, a } = this.theme.bgColor;
    this.ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(
      b
    )},${a})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  draw(store) {
    const { count, x, y, z, a, size } = store;
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const fov = this.fov;

    const { r: pr, g: pg, b: pb } = this.theme.particleColor;
    const palette = this.theme.colorPalette;
    const useVariation = this.theme.useColorVariation && palette.length > 0;
    const TAU = Math.PI * 2;

    // One path per (palette entry × brightness step), filled in a single pass.
    // Drawing thousands of individual arcs/images is far slower.
    const colorCount = useVariation ? palette.length * 30 : 1;
    const colors = new Array(colorCount);
    if (useVariation) {
      for (let p = 0; p < palette.length; p++) {
        const base = palette[p];
        for (let v = -15; v < 15; v++) {
          colors[p * 30 + (v + 15)] = `rgb(${Math.min(255, Math.max(0, Math.round(base.r + v)))},${Math.min(255, Math.max(0, Math.round(base.g + v * 0.7)))},${Math.min(255, Math.max(0, Math.round(base.b + v * 0.3)))})`;
        }
      }
    } else {
      colors[0] = `rgb(${Math.round(pr)},${Math.round(pg)},${Math.round(pb)})`;
    }

    const paths = new Array(colorCount);

    for (let i = 0; i < count; i++) {
      if (a[i] < 0.01) continue;

      // 3D projection
      const scale = fov / (fov + z[i]);
      if (scale <= 0) continue;

      const px = x[i] * scale + cx;
      const py = y[i] * scale + cy;
      // 1.1x the old square side keeps the same visual ink weight as a disc
      const radius = Math.max(0.5, size[i] * scale * 0.55);

      const bucket = useVariation
        ? (i % palette.length) * 30 + (((i * 17) % 30) + 15)
        : 0;
      let path = paths[bucket];
      if (!path) path = paths[bucket] = new Path2D();

      path.moveTo(px + radius, py);
      path.arc(px, py, radius, 0, TAU);
    }

    for (let b = 0; b < colorCount; b++) {
      if (!paths[b]) continue;
      ctx.fillStyle = colors[b];
      ctx.fill(paths[b]);
    }
  }
}
