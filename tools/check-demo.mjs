import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const failures = [];
const check = (name, cond, detail) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures.push(name);
};

await mkdir("demo", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});

const page = await browser.newPage();

// Screenshots double as marketing previews: freeze the HUD on the particle
// count so a software-rendered headless FPS reading doesn't end up in them.
const freezeStats = () =>
  page.evaluate(() => {
    const d = window.__particleDemo;
    d.engine.stop();
    document.getElementById("stats").textContent =
      `${d.engine.store.count.toLocaleString()} particles`;
  });
const resumeDemo = () =>
  page.evaluate(() => {
    const d = window.__particleDemo;
    d.engine.start(d.engine.onUpdate);
  });

const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

// ---------- Vanilla demo ----------
await page.goto(`${BASE}/demo/`, { waitUntil: "networkidle0" });
await page.waitForSelector("#stats");
await sleep(2500);

const vanilla = await page.evaluate(() => {
  const d = window.__particleDemo;
  const canvas = d.engine.canvas;
  return {
    ready: !!d,
    count: d.engine.store.count,
    running: d.engine.isRunning,
    formation: d.controller.currentFormation,
    css: { w: canvas.clientWidth, h: canvas.clientHeight },
    buffer: { w: canvas.width, h: canvas.height },
    dpr: d.engine.renderer.dpr,
    transparent: d.engine.renderer.transparent,
    fpsText: document.getElementById("stats").textContent,
    hasMotion: d.engine.store.x.slice(0, 200).some((v) => Math.abs(v) > 0.001),
  };
});
check("vanilla demo boots", vanilla.ready);
check("particle count", vanilla.count === 2400, String(vanilla.count));
check("animation loop running", vanilla.running);
check("auto-formed sphere", vanilla.formation === "sphere", vanilla.formation);
check(
  "canvas fills viewport",
  vanilla.css.w === 1440 && vanilla.css.h === 900,
  `${vanilla.css.w}x${vanilla.css.h}`
);
check("DPR applied", vanilla.dpr === 2 && vanilla.buffer.w === 2880, `dpr=${vanilla.dpr} buffer=${vanilla.buffer.w}x${vanilla.buffer.h}`);
check("transparent background", vanilla.transparent === true);
check("fps counter updates", /\d+ fps/.test(vanilla.fpsText), vanilla.fpsText);
const vanillaFps = Number(/(\d+) fps/.exec(vanilla.fpsText)?.[1] ?? 0);
check("frame rate stays interactive", vanillaFps >= 15, `${vanillaFps} fps`);

// Particle shape probe: one isolated disc. The bounding-box corner must stay
// empty, otherwise particles are being drawn as squares.
const shape = await page.evaluate(() => {
  const { ParticleEngine } = window.ParticleMorph;
  const canvas = document.createElement("canvas");
  const engine = new ParticleEngine(canvas, {
    count: 1,
    transparent: true,
    interactive: false,
  });
  engine.renderer.resize(200, 200, 1);
  const s = engine.store;
  s.x[0] = 0;
  s.y[0] = 0;
  s.z[0] = 0;
  s.size[0] = 24;
  s.a[0] = 1;
  engine.renderer.clear();
  engine.renderer.draw(s);
  const ctx = canvas.getContext("2d");
  const alphaAt = (x, y) => ctx.getImageData(x, y, 1, 1).data[3];
  const result = {
    center: alphaAt(100, 100),
    inside: alphaAt(112, 100),
    corner: alphaAt(112, 112),
  };
  engine.dispose();
  return result;
});
check(
  "particles render as discs",
  shape.center > 200 && shape.inside > 80 && shape.corner === 0,
  JSON.stringify(shape)
);

await freezeStats();
await page.screenshot({ path: "demo/preview.png" });
await resumeDemo();

// Morph to ring via the UI
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("#formations .btn")].find(
    (b) => b.textContent === "Ring"
  );
  btn.click();
});
await sleep(1800);
const ringInfo = await page.evaluate(() => ({
  formation: window.__particleDemo.controller.currentFormation,
  active: document.querySelector("#formations .btn.active")?.textContent,
}));
check("formation button morphs to ring", ringInfo.formation === "ring", ringInfo.formation);
check("active button tracks formation", ringInfo.active === "Ring", ringInfo.active);

// Text formation
await page.evaluate(() => {
  const input = document.getElementById("text-input");
  input.value = "HELLO WORLD";
  document.getElementById("text-btn").click();
});
await sleep(2400);
const textInfo = await page.evaluate(() => {
  const c = window.__particleDemo.controller;
  const { x, y } = c.store;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < c.count; i++) {
    if (x[i] < minX) minX = x[i];
    if (x[i] > maxX) maxX = x[i];
    if (y[i] < minY) minY = y[i];
    if (y[i] > maxY) maxY = y[i];
  }
  return { formation: c.currentFormation, spreadX: maxX - minX, spreadY: maxY - minY };
});
check("text formation applied", textInfo.formation === "text", textInfo.formation);
check(
  "text spreads across the canvas",
  textInfo.spreadX > 400 && textInfo.spreadY > 80,
  `x=${Math.round(textInfo.spreadX)} y=${Math.round(textInfo.spreadY)}`
);

// Orientation probe: an upright "F" has its top bar to the right and nothing
// in the lower-right quadrant. A flipped formation fails one of these.
const orient = await page.evaluate(() => {
  const { generateFormation } = window.ParticleMorph;
  const pos = generateFormation.fromText("F", 4000, {
    width: 800,
    height: 800,
    fontSize: 500,
  });
  let topRight = 0;
  let bottomRight = 0;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] > 60 && pos[i + 1] < -60) topRight++;
    if (pos[i] > 60 && pos[i + 1] > 60) bottomRight++;
  }
  return { topRight, bottomRight };
});
check(
  "text formation is upright (not flipped)",
  orient.topRight > 20 && orient.bottomRight < 5,
  `topRight=${orient.topRight} bottomRight=${orient.bottomRight}`
);

await freezeStats();
await page.screenshot({ path: "demo/preview-text.png" });
await resumeDemo();

// Theme switch
await page.evaluate(() => document.getElementById("theme-btn").click());
await sleep(900);
const themeInfo = await page.evaluate(() => {
  const t = window.__particleDemo.engine.renderer.theme;
  return {
    target: t.targetParticle,
    current: t.particleColor,
    label: document.getElementById("theme-btn").textContent,
  };
});
check("theme switch targets ice palette", themeInfo.target.r === 148 && themeInfo.target.b === 255, JSON.stringify(themeInfo.target));
check("theme label updates", themeInfo.label === "Palette: Ice", themeInfo.label);
check(
  "theme transition completed",
  Math.abs(themeInfo.current.b - themeInfo.target.b) < 1,
  `b=${themeInfo.current.b.toFixed(1)}`
);

// Mouse interaction: push particles near the cursor
await page.mouse.move(720, 450);
await sleep(120);
await page.mouse.move(740, 460);
await sleep(400);
const mouseInfo = await page.evaluate(() => {
  const d = window.__particleDemo;
  return { mouse: { ...d.engine.mouse } };
});
check(
  "mouse coords are canvas-centered",
  Math.abs(mouseInfo.mouse.x - 20) < 5 && Math.abs(mouseInfo.mouse.y - 10) < 5,
  JSON.stringify(mouseInfo.mouse)
);

// ---------- React demo ----------
await page.goto(`${BASE}/examples/react-demo/`, { waitUntil: "networkidle0" });
await sleep(1600);

const react = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll("canvas")];
  const stage = document.querySelector(".stage");
  const mini = document.querySelector(".mini");
  return {
    canvasCount: canvases.length,
    status: document.querySelector(".status")?.textContent,
    stage: { w: stage.clientWidth, h: stage.clientHeight },
    mini: { w: mini.clientWidth, h: mini.clientHeight },
    canvases: canvases.map((c) => ({
      cw: c.clientWidth,
      ch: c.clientHeight,
      bw: c.width,
      bh: c.height,
    })),
  };
});
check("two independent instances", react.canvasCount === 2, String(react.canvasCount));
check("useParticles context ready", react.status === "controller ready", react.status);
check(
  "instance sized to its section, not viewport",
  react.canvases[0].cw === react.stage.w &&
    react.canvases[0].ch === react.stage.h &&
    react.canvases[0].cw < 1440,
  `canvas=${react.canvases[0].cw}x${react.canvases[0].ch} stage=${react.stage.w}x${react.stage.h}`
);
check(
  "second instance has its own size",
  react.canvases[1].cw === react.mini.w && react.canvases[1].ch === react.mini.h,
  `canvas=${react.canvases[1].cw}x${react.canvases[1].ch} mini=${react.mini.w}x${react.mini.h}`
);

await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".stage .btn")].find(
    (b) => b.textContent === "Form text"
  );
  btn.click();
});
await sleep(2200);
await page.screenshot({ path: "demo/react-preview.png" });

// ---------- Light "ink" demo ----------
await page.goto(`${BASE}/demo/light/`, { waitUntil: "networkidle0" });
await sleep(3000);

const light = await page.evaluate(() => {
  const d = window.__particleDemo;
  const canvas = d.engine.canvas;
  return {
    formation: d.controller.currentFormation,
    transparent: d.engine.renderer.transparent,
    particle: d.engine.renderer.theme.particleColor,
    bg: getComputedStyle(document.body).backgroundColor,
    css: { w: canvas.clientWidth, h: canvas.clientHeight },
    running: d.engine.isRunning,
  };
});
check("light demo forms the yin-yang", light.formation === "yinyang", light.formation);
check("paper background", light.bg === "rgb(244, 241, 233)", light.bg);
check(
  "ink particles are dark",
  light.particle.r < 40 && light.particle.g < 40 && light.particle.b < 40,
  JSON.stringify(light.particle)
);
check(
  "light demo renders at viewport size",
  light.css.w === 1440 && light.css.h === 900,
  `${light.css.w}x${light.css.h}`
);

const formationSizes = await page.evaluate(() => {
  const formations = window.__particleDemo.controller.formations;
  const extent = (arr) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < arr.length; i += 3) {
      minX = Math.min(minX, arr[i]);
      maxX = Math.max(maxX, arr[i]);
      minY = Math.min(minY, arr[i + 1]);
      maxY = Math.max(maxY, arr[i + 1]);
    }
    return { w: Math.round(maxX - minX), h: Math.round(maxY - minY) };
  };
  return { grid: extent(formations.grid), helix: extent(formations.helix) };
});
check(
  "grid formation fills the stage",
  formationSizes.grid.w > 1000 && formationSizes.grid.h > 520,
  `${formationSizes.grid.w}x${formationSizes.grid.h}`
);
check(
  "helix formation is tall and wide",
  formationSizes.helix.w > 340 && formationSizes.helix.h > 640,
  `${formationSizes.helix.w}x${formationSizes.helix.h}`
);

await freezeStats();
await page.screenshot({ path: "demo/light-preview.png" });
await resumeDemo();

// Taijitu geometry probes (head at +R/2 because the engine's y axis points down)
const yy = await page.evaluate(() => {
  const { generateFormation } = window.ParticleMorph;
  const R = 240;
  const pos = generateFormation.yinYang(4000, R);
  const eye = R / 6;
  const inC = (x, y, cy, r) => x * x + (y - cy) * (y - cy) <= r * r;
  let outside = 0;
  let darkHead = 0;
  let lightEye = 0;
  let darkEye = 0;
  let lightHead = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    if (x * x + y * y > (R + 4) * (R + 4)) outside++;
    if (x > 0.25 * R && x < 0.45 * R && y > 0.33 * R && y < 0.5 * R) darkHead++;
    if (inC(x, y, R / 2, eye * 0.6)) lightEye++;
    if (inC(x, y, -R / 2, eye * 0.6)) darkEye++;
    if (x > 0.2 * R && x < 0.4 * R && y < -0.3 * R && y > -0.45 * R) lightHead++;
  }
  return { outside, darkHead, lightEye, darkEye, lightHead };
});
check("yin-yang stays inside the circle", yy.outside === 0, `outside=${yy.outside}`);
check("yin-yang dark head is filled", yy.darkHead > 30, `darkHead=${yy.darkHead}`);
check("yin-yang light eye is empty", yy.lightEye < 3, `lightEye=${yy.lightEye}`);
check("yin-yang dark eye is filled", yy.darkEye > 20, `darkEye=${yy.darkEye}`);
check("yin-yang light head is empty", yy.lightHead < 3, `lightHead=${yy.lightHead}`);

await page.evaluate(() => {
  const input = document.getElementById("text-input");
  input.value = "ZEN";
  document.getElementById("text-btn").click();
});
await sleep(2400);
const lightText = await page.evaluate(
  () => window.__particleDemo.controller.currentFormation
);
check("light demo forms text", lightText === "text", lightText);
await freezeStats();
await page.screenshot({ path: "demo/light-text.png" });
await resumeDemo();

// ---------- Reduced motion ----------
const rm = await browser.newPage();
await rm.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await rm.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await rm.goto(`${BASE}/demo/`, { waitUntil: "networkidle0" });
await sleep(900);
const rmInfo = await rm.evaluate(() => ({
  running: window.__particleDemo.engine.isRunning,
  stats: document.getElementById("stats").textContent,
}));
check("reduced motion stops the loop", rmInfo.running === false, `running=${rmInfo.running}`);

// ---------- Mobile viewport ----------
await rm.emulateMediaFeatures([]);
await rm.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
await rm.goto(`${BASE}/demo/`, { waitUntil: "networkidle0" });
await sleep(1500);
const mobile = await rm.evaluate(() => {
  const d = window.__particleDemo;
  const c = d.engine.canvas;
  return {
    css: { w: c.clientWidth, h: c.clientHeight },
    buffer: { w: c.width, h: c.height },
    dpr: d.engine.renderer.dpr,
    running: d.engine.isRunning,
  };
});
check(
  "mobile canvas sizes correctly",
  mobile.css.w === 390 && mobile.css.h === 844,
  `${mobile.css.w}x${mobile.css.h}`
);
check(
  "DPR capped at 2 on mobile",
  mobile.dpr === 2 && mobile.buffer.w === 780,
  `dpr=${mobile.dpr} buffer=${mobile.buffer.w}`
);

// ---------- Console / page errors ----------
check("no page errors", pageErrors.length === 0, pageErrors.join(" | "));
check("no console errors", consoleErrors.length === 0, consoleErrors.join(" | "));

await browser.close();

console.log(
  "\nScreenshots: demo/preview.png, demo/preview-text.png, demo/react-preview.png, demo/light-preview.png, demo/light-text.png"
);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
