/* Vanilla demo - drives the core engine directly (no React) */
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

  const COUNT = 2400;

  const engine = new ParticleEngine(canvas, { count: COUNT, transparent: true });
  const controller = new ParticleController(engine.store);
  controller.renderer = engine.renderer;

  const formations = {
    scatter: generateFormation.random(COUNT, 2400),
    sphere: generateFormation.sphere(COUNT, 250),
    grid: generateFormation.grid(COUNT, 1120, 660, 64),
    ring: generateFormation.ring(COUNT, 260, 36),
    helix: generateFormation.helix(COUNT, 760, 170, 4),
    yinyang: generateFormation.yinYang(COUNT, 280),
  };
  controller.setFormations(formations);

  const LABELS = { yinyang: "Yin-Yang" };

  const THEMES = {
    gold: {
      particle: { r: 255, g: 201, b: 92 },
      colorPalette: [
        { r: 255, g: 214, b: 120 },
        { r: 255, g: 176, b: 64 },
        { r: 255, g: 236, b: 184 },
      ],
    },
    ice: {
      particle: { r: 148, g: 205, b: 255 },
      colorPalette: [
        { r: 130, g: 190, b: 255 },
        { r: 174, g: 232, b: 255 },
        { r: 96, g: 150, b: 255 },
      ],
    },
    mono: {
      particle: { r: 240, g: 244, b: 255 },
      colorPalette: [],
    },
  };
  const themeOrder = ["gold", "ice", "mono"];
  const themeLabels = { gold: "Gold", ice: "Ice", mono: "Mono" };
  let themeIndex = 0;

  const setActive = (name) => {
    for (const btn of formationBar.children) {
      btn.classList.toggle("active", btn.dataset.formation === name);
    }
  };

  for (const name of Object.keys(formations)) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = LABELS[name] || name[0].toUpperCase() + name.slice(1);
    btn.dataset.formation = name;
    btn.addEventListener("click", () => {
      controller.morphTo(name, 1.4, "power2.inOut");
      setActive(name);
    });
    formationBar.appendChild(btn);
  }

  const applyText = () => {
    const text = (textInput.value || "HELLO").trim().toUpperCase();
    controller.formText(text, { fontSize: 170, duration: 1.8 });
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
    themeBtn.textContent = `Palette: ${themeLabels[key]}`;
  });

  gravity.addEventListener("input", () => {
    controller.setPhysics({ gravity: Number(gravity.value) });
  });
  turbulence.addEventListener("input", () => {
    controller.setPhysics({ turbulence: Number(turbulence.value) });
  });

  controller.setTheme(THEMES.gold, { animate: false });
  controller.snapTo("scatter");
  setActive("scatter");
  setTimeout(() => {
    controller.morphTo("sphere", 1.8, "power3.out");
    setActive("sphere");
  }, 500);

  let frames = 0;
  let lastFpsAt = performance.now();
  let fps = 0;

  const onUpdate = (time, dt, mouse) => {
    controller.update(time, dt, mouse);
    frames++;
    const now = performance.now();
    if (now - lastFpsAt >= 500) {
      fps = Math.round((frames * 1000) / (now - lastFpsAt));
      frames = 0;
      lastFpsAt = now;
      stats.textContent = `${COUNT.toLocaleString()} particles · ${fps} fps`;
    }
  };

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduced?.matches) {
    engine.renderOnce();
    stats.textContent = `${COUNT.toLocaleString()} particles · reduced motion`;
  } else {
    engine.start(onUpdate);
  }

  // Expose for quick debugging / automated checks
  window.__particleDemo = { engine, controller };
})();
