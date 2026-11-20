# Particle Morph

A zero-dependency particle engine with shape morphing, 3D projection, and text/image formations. Works as a React component, as a plain ES module, or as a `<script>` tag on any page.

Live demos: [dark showcase](https://particle-morph-demo-quzcxs30d0g.qoder.website/demo/index.html) · [ink on paper](https://particle-morph-demo-quzcxs30d0g.qoder.website/demo/light/index.html) · [React component](https://particle-morph-demo-quzcxs30d0g.qoder.website/examples/react-demo/index.html)

- **Zero dependencies** — no GSAP, no runtime libraries
- **Shape morphing** — smooth tweens between formations with built-in easing
- **Text & image formations** — sample any text or image into particles
- **Yin-yang formation** — a taijitu sampled as the dark half, ideal for ink-style dark-on-light designs
- **3D projection** — depth via field-of-view scaling on a 2D canvas
- **Circular particles** — anti-aliased discs, batched per color into a single fill pass
- **Container-aware** — sizes to its element, supports multiple instances per page
- **Retina-ready** — device-pixel-ratio aware rendering
- **Themeable** — light/dark presets, custom colors, color palettes, smooth transitions
- **Accessible** — respects `prefers-reduced-motion`
- **~12 KB minified** for the script-tag build

## Quick start (React)

```bash
npm install particle-morph
```

```jsx
import { Particles, useParticles, generateFormation } from "particle-morph";

const formations = {
  sphere: generateFormation.sphere(1500, 220),
  ring: generateFormation.ring(1500, 240, 30),
  text: generateFormation.fromText("HELLO", 1500, { fontSize: 160 }),
};

function Controls() {
  const { isReady, morphTo } = useParticles();
  return (
    <button onClick={() => morphTo("sphere", 1.2)} disabled={!isReady}>
      Morph
    </button>
  );
}

export default function Hero() {
  return (
    <section style={{ position: "relative", height: 480 }}>
      <Particles
        count={1500}
        theme="dark"
        formations={formations}
        initialFormation="sphere"
        transparent
      >
        <Controls />
      </Particles>
    </section>
  );
}
```

The wrapper is `position: absolute; inset: 0` by default, so give the parent a size. Use `position="fixed"` for a full-page background.

## Quick start (script tag, no build step)

```html
<div id="stage" style="position: fixed; inset: 0">
  <canvas id="particles" style="width: 100%; height: 100%"></canvas>
</div>
<script src="dist/particle-morph.global.js"></script>
<script>
  const { ParticleEngine, ParticleController, generateFormation } =
    window.ParticleMorph;

  const engine = new ParticleEngine(document.getElementById("particles"), {
    count: 2000,
    transparent: true,
  });
  const controller = new ParticleController(engine.store);
  controller.renderer = engine.renderer;
  controller.setTheme("dark", { animate: false });
  controller.setFormations({
    sphere: generateFormation.sphere(2000, 240),
    grid: generateFormation.grid(2000, 900, 600, 60),
  });
  controller.snapTo("sphere");
  engine.start((time, dt, mouse) => controller.update(time, dt, mouse));
</script>
```

The canvas must have a CSS size (`width`/`height`), as shown above.

## React props

| Prop               | Type                          | Default    | Description                                              |
| ------------------ | ----------------------------- | ---------- | -------------------------------------------------------- |
| `count`            | number                        | 1500       | Number of particles                                      |
| `theme`            | string \| object              | "light"    | `"light"`, `"dark"`, or custom theme config              |
| `formations`       | object                        | {}         | Named formations `{ name: Float32Array }`                |
| `initialFormation` | string                        | first one  | Formation to start with                                  |
| `physics`          | object                        | {}         | `{ gravity, turbulence, settlingForce, friction }`       |
| `position`         | "absolute" \| "fixed" \| "none" | "absolute" | How the wrapper is positioned                            |
| `transparent`      | boolean                       | true       | Skip painting the theme background                       |
| `interactive`      | boolean                       | true       | Particles react to the cursor                            |
| `zIndex`           | number                        | 0          | Wrapper stacking order                                   |
| `className`        | string                        | ""         | Extra classes on the wrapper                             |
| `style`            | object                        | -          | Extra inline styles on the wrapper                       |
| `onReady`          | function                      | -          | Called with the controller when mounted                  |
| `children`         | ReactNode                     | -          | Children can use the `useParticles` hook                 |

### Theme config

```jsx
theme={{
  bg: { r: 12, g: 14, b: 24, a: 1 },          // used when transparent={false}
  particle: { r: 255, g: 200, b: 90 },
  colorPalette: [                               // optional per-particle variation
    { r: 255, g: 214, b: 120 },
    { r: 255, g: 176, b: 64 },
  ],
}}
```

Pass `colorPalette: []` to turn variation back off.

### Physics config

```jsx
physics={{
  gravity: 8.0,        // downward pull when away from target
  turbulence: 2.0,     // idle random motion
  settlingForce: 0.15, // spring toward target
  friction: 0.92,      // velocity damping
}}
```

## useParticles

Available to children of `<Particles>`:

| Method                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `snapTo(name)`               | Jump instantly to a formation            |
| `morphTo(name, s, ease)`     | Animate to a formation                   |
| `formText(text, options)`    | Morph into a text shape                  |
| `setTheme(config, options)`  | Change theme (`{ animate: false }` snaps) |
| `setFormations(formations)`  | Add or replace formations                |
| `setPhysics(config)`         | Update physics                           |
| `isReady`                    | `true` once the controller is mounted    |
| `controller`                 | The raw controller instance              |

Easing names: `linear`, `power2.inOut`, `power3.out`, `expo.out`.

## Formation utilities

```js
import { generateFormation } from "particle-morph";

generateFormation.fromText("HELLO", 1500, { fontSize: 160, font: "Arial" });
await generateFormation.fromImage("/logo.svg", 1500, { size: 400, scale: 1.2 });
generateFormation.random(count, spread);
generateFormation.sphere(count, radius);
generateFormation.grid(count, width, height, cols);
generateFormation.ring(count, radius, thickness);
generateFormation.helix(count, height, radius, turns);
generateFormation.yinYang(count, radius, { eyeRatio }); // dark half of a taijitu
```

Every formation returns a `Float32Array` of `count * 3` positions (`x, y, z`).

`formText` and `fromText` sample the text using the canvas that renders the particles, so text fits the component rather than the viewport.

## Vanilla API

```js
import { ParticleEngine, ParticleController, generateFormation } from "particle-morph/vanilla";
```

- `new ParticleEngine(canvas, { count, transparent, interactive, fov })` — owns the render loop, resize handling (ResizeObserver) and mouse tracking.
- `engine.store` — typed-array particle data (`x, y, z, vx, vy, vz, a, size, mass`).
- `engine.renderer` — canvas renderer; assign it to the controller.
- `new ParticleController(store, physicsOptions)` — formations, morph tweens, physics.
- `engine.start((time, dt, mouse) => controller.update(time, dt, mouse))`.
- `engine.renderOnce()` — draw one static frame (reduced-motion fallback).
- `engine.dispose()` — stop the loop and remove listeners.

## Development

```bash
npm install
npm run build   # dist/*.js + examples/react-demo/app.js
npm run demo    # serves demo/ and examples/react-demo/ on http://localhost:5173
```

| Path                        | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `ParticleStore.js`          | Typed-array particle data                 |
| `ParticleController.js`     | Formations, morph tween, physics          |
| `ParticleRenderer.js`       | Canvas drawing, themes, DPR               |
| `ParticleEngine.js`         | Render loop, resize, mouse tracking       |
| `Particles.jsx`             | React component                           |
| `useParticles.js`           | Context + hook                            |
| `utils.js`                  | Formation generators                      |
| `demo/`                     | Standalone demo (script-tag build)        |
| `demo/light/`               | Japanese ink-on-paper demo (yin-yang)     |
| `examples/react-demo/`      | React demo (embedded sections)            |
| `tools/build.mjs`           | esbuild build script                      |
| `tools/serve.js`            | Zero-dependency static server             |
| `tools/check-demo.mjs`      | Headless Chrome smoke tests               |

## License

Commercial license — see [LICENSE.txt](LICENSE.txt) for direct purchases.
Purchases through CodeCanyon are governed by the Envato Regular/Extended
License and Envato's support policy.
