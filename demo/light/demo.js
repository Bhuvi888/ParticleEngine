/* Ink demo - black particles on washi paper, taijitu by default */
(() => {
  const { ParticleEngine, ParticleController, generateFormation } =
    window.ParticleMorph;

  const canvas = document.getElementById("canvas");
  const stats = document.getElementById("stats");
  const formationBar = document.getElementById("formations");
  const textInput = document.getElementById("text-input");
  const textBtn = document.getElementById("text-btn");
  const themeBtn = document.getElementById("theme-btn");
  const gravity = document.getElementById("gravity");
  const turbulence = document.getElementById("turbulence");

  const COUNT = 2600;

  const engine = new ParticleEngine(canvas, { count: COUNT, transparent: true });
  const controller = new ParticleController(engine.store, {
    gravity: 6,
    turbulence: 1.5,
    settlingForce: 0.2,
  });
  controller.renderer = engine.renderer;

  const width = engine.renderer.width || window.innerWidth;
  const height = engine.renderer.height || window.innerHeight;
  const R = Math.max(120, Math.min(width, height) * 0.34);

  const formations = {
    scatter: generateFormation.random(COUNT, 2400),
    yinyang: generateFormation.yinYang(COUNT, R),
    ring: generateFormation.ring(COUNT, R * 0.86, R * 0.1),
    grid: generateFormation.grid(COUNT, width * 0.78, height * 0.66, 64),
    helix: generateFormation.helix(COUNT, height * 0.76, R * 0.62, 4),
  };
  controller.setFormations(formations);

  const LABELS = {
    scatter: "Scatter",
    yinyang: "Yin-Yang",
    ring: "Enso",
    grid: "Grid",
    helix: "Helix",
  };

  const THEMES = {
    ink: {
      particle: { r: 22, g: 22, b: 22 },
      colorPalette: [
        { r: 30, g: 30, b: 30 },
        { r: 64, g: 60, b: 54 },
        { r: 12, g: 12, b: 12 },
      ],
    },
    vermilion: {
      particle: { r: 178, g: 58, b: 46 },
      colorPalette: [
        { r: 178, g: 58, b: 46 },
        { r: 205, g: 88, b: 66 },
        { r: 138, g: 40, b: 32 },
      ],
    },
    indigo: {
      particle: { r: 44, g: 62, b: 110 },
      colorPalette: [
        { r: 44, g: 62, b: 110 },
        { r: 74, g: 98, b: 152 },
        { r: 26, g: 38, b: 78 },
      ],
    },
  };
  const themeOrder = ["ink", "vermilion", "indigo"];
  const themeLabels = {
    ink: "Ink · 墨",
    vermilion: "Vermilion · 朱",
    indigo: "Indigo · 藍",
  };
  let themeIndex = 0;

  const setActive = (name) => {
    for (const btn of formationBar.children) {
      btn.classList.toggle("active", btn.dataset.formation === name);
    }
  };

  for (const name of Object.keys(formations)) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = LABELS[name] || name;
    btn.dataset.formation = name;
    btn.addEventListener("click", () => {
      controller.morphTo(name, 1.6, "power2.inOut");
      setActive(name);
    });
    formationBar.appendChild(btn);
  }

  const applyText = () => {
    const text = (textInput.value || "ZEN").trim().toUpperCase();
    const fontSize = Math.min(180, engine.renderer.width * 0.16);
    controller.formText(text, { fontSize, duration: 1.8 });
    setActive(null);
  };
  textBtn.addEventListener("click", applyText);
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyText();
  });

  themeBtn.addEventListener("click", () => {
    themeIndex = (themeIndex + 1) % themeOrder.length;
    const key = themeOrder[themeIndex];
    controller.setTheme(THEMES[key]);
    themeBtn.textContent = themeLabels[key];
  });

  gravity.addEventListener("input", () => {
    controller.setPhysics({ gravity: Number(gravity.value) });
  });
  turbulence.addEventListener("input", () => {
    controller.setPhysics({ turbulence: Number(turbulence.value) });
  });

  controller.setTheme(THEMES.ink, { animate: false });

  let frames = 0;
  let lastFpsAt = performance.now();

  const onUpdate = (time, dt, mouse) => {
    controller.update(time, dt, mouse);
    frames++;
    const now = performance.now();
    if (now - lastFpsAt >= 500) {
      const fps = Math.round((frames * 1000) / (now - lastFpsAt));
      frames = 0;
      lastFpsAt = now;
      stats.textContent = `${COUNT.toLocaleString()} particles · ${fps} fps`;
    }
  };

  window.__particleDemo = { engine, controller };

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduced?.matches) {
    controller.snapTo("yinyang");
    setActive("yinyang");
    engine.renderOnce();
    stats.textContent = `${COUNT.toLocaleString()} particles · reduced motion`;
  } else {
    controller.snapTo("scatter");
    setActive("scatter");
    setTimeout(() => {
      controller.morphTo("yinyang", 2.0, "power3.out");
      setActive("yinyang");
    }, 500);
    engine.start(onUpdate);
  }
})();
