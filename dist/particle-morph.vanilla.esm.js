// ParticleStore.js
var ParticleStore = class {
  constructor(count = 1500) {
    this.count = count;
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.z = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.vz = new Float32Array(count);
    this.r = new Float32Array(count);
    this.g = new Float32Array(count);
    this.b = new Float32Array(count);
    this.a = new Float32Array(count);
    this.size = new Float32Array(count);
    this.mass = new Float32Array(count);
    this.init();
  }
  init() {
    for (let i = 0; i < this.count; i++) {
      this.resetParticle(i);
    }
  }
  resetParticle(i) {
    this.x[i] = (Math.random() - 0.5) * 2e3;
    this.y[i] = (Math.random() - 0.5) * 2e3;
    this.z[i] = (Math.random() - 0.5) * 1e3;
    this.vx[i] = 0;
    this.vy[i] = 0;
    this.vz[i] = 0;
    this.r[i] = 0;
    this.g[i] = 0;
    this.b[i] = 0;
    this.a[i] = 1;
    this.size[i] = 1 + Math.random() * 3;
    this.mass[i] = 0.5 + Math.random();
  }
};

// ParticleRenderer.js
var ParticleRenderer = class {
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
      transitioning: false
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
          ...config.particle
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
    const k = 1 - Math.pow(1e-4, Math.min(dt, 0.05));
    const lerp = (a, b) => a + (b - a) * k;
    bgColor.r = lerp(bgColor.r, targetBg.r);
    bgColor.g = lerp(bgColor.g, targetBg.g);
    bgColor.b = lerp(bgColor.b, targetBg.b);
    bgColor.a = lerp(bgColor.a, targetBg.a);
    particleColor.r = lerp(particleColor.r, targetParticle.r);
    particleColor.g = lerp(particleColor.g, targetParticle.g);
    particleColor.b = lerp(particleColor.b, targetParticle.b);
    const done = Math.abs(bgColor.r - targetBg.r) < 0.5 && Math.abs(bgColor.g - targetBg.g) < 0.5 && Math.abs(bgColor.b - targetBg.b) < 0.5 && Math.abs(bgColor.a - targetBg.a) < 5e-3 && Math.abs(particleColor.r - targetParticle.r) < 0.5 && Math.abs(particleColor.g - targetParticle.g) < 0.5 && Math.abs(particleColor.b - targetParticle.b) < 0.5;
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
      const scale = fov / (fov + z[i]);
      if (scale <= 0) continue;
      const px = x[i] * scale + cx;
      const py = y[i] * scale + cy;
      const radius = Math.max(0.5, size[i] * scale * 0.55);
      const bucket = useVariation ? i % palette.length * 30 + (i * 17 % 30 + 15) : 0;
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
};

// ParticleEngine.js
var ParticleEngine = class {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.store = new ParticleStore(options.count || 1500);
    this.renderer = new ParticleRenderer(canvas, {
      transparent: options.transparent,
      fov: options.fov
    });
    this.rafId = null;
    this.isRunning = false;
    this.interactive = options.interactive !== false;
    this.mouse = { x: 0, y: 0 };
    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", this.handleResize);
    }
    if (this.interactive) {
      window.addEventListener("mousemove", this.handleMouseMove, {
        passive: true
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
    if (onUpdate) onUpdate(performance.now() / 1e3, 0, this.mouse);
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
    const dt = Math.min((time - this.lastTime) / 1e3, 0.1);
    this.lastTime = time;
    if (this.onUpdate) {
      this.onUpdate(time / 1e3, dt, this.mouse);
    }
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
    if (width === this.renderer.width && height === this.renderer.height && dpr === this.renderer.dpr) {
      return;
    }
    this.renderer.resize(width, height, dpr);
  }
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
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
};

// utils.js
var generateFormation = {
  /**
   * Generate positions from canvas text
   * @param {string} text - Text to render
   * @param {number} count - Number of particles
   * @param {object} options - { fontSize, font, width, height }
   */
  fromText(text, count, options = {}) {
    const {
      fontSize = 160,
      font = "Space Grotesk",
      width = window.innerWidth,
      height = window.innerHeight
    } = options;
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    cvs.width = width;
    cvs.height = height;
    ctx.font = `900 ${fontSize}px "${font}", sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const validPoints = [];
    const skip = 4;
    for (let y = 0; y < height; y += skip) {
      for (let x = 0; x < width; x += skip) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 128) {
          validPoints.push({
            x: x - width / 2,
            y: y - height / 2,
            z: 0
          });
        }
      }
    }
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const p = validPoints[Math.floor(Math.random() * validPoints.length)] || {
        x: 0,
        y: 0,
        z: 0
      };
      pos[i3] = p.x + (Math.random() - 0.5) * 5;
      pos[i3 + 1] = p.y + (Math.random() - 0.5) * 5;
      pos[i3 + 2] = p.z + (Math.random() - 0.5) * 5;
    }
    return pos;
  },
  /**
   * Generate from image or SVG
   * @param {HTMLImageElement|string} src - Image element or URL
   * @param {number} count - Number of particles
   * @param {object} options - { size, scale }
   */
  async fromImage(src, count, options = {}) {
    const { size = 400, scale = 1.2 } = options;
    const img = typeof src === "string" ? await loadImage(src) : src;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const points = [];
    const skip = 2;
    for (let y = 0; y < size; y += skip) {
      for (let x = 0; x < size; x += skip) {
        const idx = (y * size + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 50) {
          points.push({
            x: (x - size / 2) * scale,
            y: (y - size / 2) * scale
          });
        }
      }
    }
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (points.length > 0) {
        const p = points[Math.floor(Math.random() * points.length)];
        pos[i3] = p.x + (Math.random() - 0.5) * 4;
        pos[i3 + 1] = p.y + (Math.random() - 0.5) * 4;
        pos[i3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    return pos;
  },
  /**
   * Generate random scatter
   */
  random(count, spread = 2e3) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (spread / 2);
    }
    return pos;
  },
  /**
   * Generate filled sphere
   */
  sphere(count, radius = 200) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = radius * Math.pow(Math.random(), 1 / 3);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }
    return pos;
  },
  /**
   * Generate structured grid
   */
  grid(count, width = 1e3, height = 600, cols = 50) {
    const pos = new Float32Array(count * 3);
    const rows = Math.ceil(count / cols);
    const spacingX = width / cols;
    const spacingY = height / rows;
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      pos[i * 3] = (col - cols / 2) * spacingX;
      pos[i * 3 + 1] = (row - rows / 2) * spacingY;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  },
  /**
   * Generate ring/circle
   */
  ring(count, radius = 200, thickness = 20) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = i / count * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * thickness;
      pos[i3] = Math.cos(angle) * r;
      pos[i3 + 1] = Math.sin(angle) * r;
      pos[i3 + 2] = (Math.random() - 0.5) * thickness;
    }
    return pos;
  },
  /**
   * Generate DNA helix
   */
  helix(count, height = 800, radius = 60, turns = 4) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = i / count;
      const y = (t - 0.5) * height;
      const angle = t * Math.PI * 2 * turns;
      const strandOffset = i % 2 === 0 ? 0 : Math.PI;
      const thickness = Math.random() * 10;
      pos[i3] = Math.cos(angle + strandOffset) * (radius + thickness);
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(angle + strandOffset) * (radius + thickness);
    }
    return pos;
  },
  /**
   * Generate the dark half of the taijitu (yin-yang) symbol.
   * Designed for dark particles on a light background: the light half is
   * left unsampled, with both small counter-colored eyes included.
   * @param {number} count - Number of particles
   * @param {number} radius - Outer radius
   * @param {object} options - { eyeRatio }
   */
  yinYang(count, radius = 240, options = {}) {
    const eyeRatio = options.eyeRatio ?? 1 / 6;
    const R = radius;
    const headY = R / 2;
    const eyeR = R * eyeRatio;
    const inCircle = (x, y, cy, r) => {
      const dx = x;
      const dy = y - cy;
      return dx * dx + dy * dy <= r * r;
    };
    const pos = new Float32Array(count * 3);
    let i = 0;
    let attempts = 0;
    const maxAttempts = count * 80;
    while (i < count && attempts < maxAttempts) {
      attempts++;
      const x = (Math.random() * 2 - 1) * R;
      const y = (Math.random() * 2 - 1) * R;
      if (!inCircle(x, y, 0, R)) continue;
      const inHead = inCircle(x, y, headY, R / 2);
      const inTail = inCircle(x, y, -headY, R / 2);
      let dark = inHead || x < 0 && !inTail;
      if (dark && inCircle(x, y, headY, eyeR)) dark = false;
      else if (!inHead && inCircle(x, y, -headY, eyeR)) dark = true;
      if (!dark) continue;
      const i3 = i * 3;
      pos[i3] = x + (Math.random() - 0.5) * 2;
      pos[i3 + 1] = y + (Math.random() - 0.5) * 2;
      pos[i3 + 2] = (Math.random() - 0.5) * 10;
      i++;
    }
    while (i < count) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (R / 2);
      const i3 = i * 3;
      pos[i3] = Math.cos(angle) * r;
      pos[i3 + 1] = headY + Math.sin(angle) * r;
      pos[i3 + 2] = 0;
      i++;
    }
    return pos;
  }
};
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ParticleController.js
var EASES = {
  linear: (t) => t,
  "power2.inOut": (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  "power3.out": (t) => 1 - Math.pow(1 - t, 3),
  "expo.out": (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
};
var ParticleController = class {
  constructor(store, options = {}) {
    this.store = store;
    this.count = store.count;
    this.renderer = null;
    this.formations = {};
    this.currentFormation = null;
    this.transitionObj = { progress: 0 };
    this.tween = null;
    this.startPositions = new Float32Array(this.count * 3);
    this.endPositions = null;
    this.physics = {
      gravity: options.gravity ?? 8,
      friction: options.friction ?? 0.92,
      turbulence: options.turbulence ?? 2,
      settlingForce: options.settlingForce ?? 0.15,
      windX: 0,
      windZ: 0
    };
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
  morphTo(formationKey, duration = 1, ease = "power2.inOut") {
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
  morphToTarget(target, duration = 1, ease = "power2.inOut") {
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
      duration: Math.max(duration, 1e-3),
      ease: EASES[ease] || EASES["power2.inOut"]
    };
  }
  /**
   * Form text shape from canvas
   * @param {string} text - Text to form
   * @param {object} options - { fontSize, font, width, height, duration, ease }
   */
  formText(text, options = {}) {
    const width = options.width ?? this.renderer?.width ?? window.innerWidth;
    const height = options.height ?? this.renderer?.height ?? window.innerHeight;
    const pos = generateFormation.fromText(text, this.count, {
      ...options,
      width,
      height
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
    this.physics.windX = Math.sin(time * 0.3) * 2 + Math.sin(time * 0.7) * 1;
    this.physics.windZ = Math.cos(time * 0.4) * 1.5;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const mass = this.store.mass[i];
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
        targetX = this.startPositions[i3] + (this.endPositions[i3] - this.startPositions[i3]) * t;
        targetY = this.startPositions[i3 + 1] + (this.endPositions[i3 + 1] - this.startPositions[i3 + 1]) * t;
        targetZ = this.startPositions[i3 + 2] + (this.endPositions[i3 + 2] - this.startPositions[i3 + 2]) * t;
      }
      let px = this.store.x[i];
      let py = this.store.y[i];
      let pz = this.store.z[i];
      let vx = this.store.vx[i];
      let vy = this.store.vy[i];
      let vz = this.store.vz[i];
      const dx = targetX - px;
      const dy = targetY - py;
      const dz = targetZ - pz;
      const distToTarget = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const springForce = settlingForce * (1 + distToTarget * 1e-3);
      vx += dx * springForce * safeDt * 60;
      vy += dy * springForce * safeDt * 60;
      vz += dz * springForce * safeDt * 60;
      if (distToTarget > 5) {
        vy += gravity * mass * safeDt;
      }
      vx += this.physics.windX * safeDt * 2;
      vz += this.physics.windZ * safeDt * 2;
      const turbX = (Math.sin(time * 2.1 + i * 0.37) * 2 - 1) * turbulence;
      const turbY = (Math.cos(time * 1.8 + i * 0.53) * 2 - 1) * turbulence;
      const turbZ = (Math.sin(time * 2.4 + i * 0.71) * 2 - 1) * turbulence;
      vx += turbX * safeDt * 10;
      vy += turbY * safeDt * 10;
      vz += turbZ * safeDt * 10;
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
      vx *= friction;
      vy *= friction;
      vz *= friction;
      const maxVel = 100;
      const velMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (velMag > maxVel) {
        const scale = maxVel / velMag;
        vx *= scale;
        vy *= scale;
        vz *= scale;
      }
      px += vx * safeDt * 60;
      py += vy * safeDt * 60;
      pz += vz * safeDt * 60;
      this.store.x[i] = px;
      this.store.y[i] = py;
      this.store.z[i] = pz;
      this.store.vx[i] = vx;
      this.store.vy[i] = vy;
      this.store.vz[i] = vz;
    }
  }
};
export {
  ParticleController,
  ParticleEngine,
  ParticleRenderer,
  ParticleStore,
  generateFormation
};
