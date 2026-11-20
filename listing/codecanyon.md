# CodeCanyon Submission Kit — Particle Morph

## Item title (max ~70 chars)

1. Particle Morph - Interactive Particle Animation Engine for Websites
2. Particle Morph - Particle Animation & Text Morphing for React & HTML

## Category

CodeCanyon → JavaScript → Miscellaneous
(Confirm against Envato's current taxonomy at upload time.)

## Pricing

- Regular License: **$19**
- Extended License: **$95**
- Non-exclusive author share applies (roughly half; exact rate set by Envato).

## Item description (paste into the description editor)

Particle Morph is a zero-dependency particle engine that turns your hero
section into a living animation. Particles fly in, settle into a shape, react
to the visitor's cursor, and morph smoothly between formations — including
your own text or logo.

It ships as a React component, a vanilla JavaScript module, and a single
script-tag build, so it fits any stack: React, Next.js, plain HTML,
WordPress, or a static landing page.

### Key features

- Smooth morphing between formations with built-in easing
- Text and image formations — sample any word, logo (PNG/SVG) into particles
- Seven ready-made formations: sphere, grid, ring, helix, yin-yang, scatter,
  plus text and image sampling
- Circular particles — anti-aliased discs batched into one fill pass per color
- Mouse interaction — particles push away from the cursor
- 3D depth via field-of-view projection on a 2D canvas
- Themeable: light/dark presets, custom colors, per-particle color palettes,
  smooth theme transitions
- Container-aware — sizes to its element with ResizeObserver; multiple
  instances per page
- Retina-ready — device-pixel-ratio aware, capped at 2x for performance
- Accessible — respects `prefers-reduced-motion` with a static fallback
- Zero dependencies — no GSAP, no three.js, nothing to audit
- ~12 KB minified script-tag build; 2,400 particles at 60+ fps in the demo

### What you get

- Full source code (React component + vanilla engine)
- Prebuilt ESM, vanilla ESM, and global `<script>` bundles
- Three working demos: a dark full-page showcase, a Japanese ink-on-paper
  showcase with a yin-yang formation, and an embedded React example
- Build tooling (esbuild) and a zero-dependency local server
- Documentation (README + license)
- 6 months of support

### Technical specifications

- React 18+ (peer dependency only; vanilla build has no React requirement)
- Modern browsers with Canvas 2D and ResizeObserver (Chrome, Edge, Firefox,
  Safari; fallback to window resize where ResizeObserver is unavailable)
- No build step required for the script-tag build
- No runtime dependencies

### Customization at a glance

```js
// React
<Particles count={1500} theme="dark" formations={formations}
  initialFormation="sphere" transparent />

// Vanilla
controller.morphTo("ring", 1.4);
controller.formText("YOUR BRAND", { fontSize: 160 });
controller.setTheme({ particle: { r: 255, g: 200, b: 90 } });
controller.setPhysics({ gravity: 8, turbulence: 2 });
```

### Installation

React: import the component and pass formations (see documentation).
HTML: include the 12 KB script, create a sized canvas, and start the engine
(about 10 lines — full example in the documentation and in `demo/`).

### Support policy

Bug fixes and integration questions for 6 months from purchase, answered
within 2 business days. Custom development and redesigns are not included.

### Changelog

**1.0.0 — 2026-11-14**
- Initial release: React + vanilla engine, seven formations (including
  yin-yang), text/image sampling, circular batched rendering, theming,
  reduced-motion support, container-aware sizing.

## Tags (up to 15)

particles, particle animation, particle background, canvas animation,
morphing, react component, text particles, logo particles, hero background,
interactive background, javascript animation, landing page, zero
dependencies, web animation, 3d particles

## Required assets before submission

- [ ] Thumbnail 80×80 (JPG/PNG) — use the badge mark or a particle sphere
- [ ] Main preview image 590×300 JPG — `demo/preview.png` cropped
- [ ] Optional screenshots: `demo/preview-text.png`,
      `demo/light-preview.png`, `demo/light-text.png`,
      `demo/react-preview.png`
- [x] Live demo URL: https://particleengine-demo.vercel.app/demo/index.html
      (ink demo: `/demo/light/index.html`, React: `/examples/react-demo/index.html`)
- [ ] Documentation (convert README.md to HTML or PDF)
- [ ] Item ZIP (exclude `node_modules`, `.git`, `package-lock.json`);
      include: source files, `dist/`, `demo/`, `examples/`, `tools/build.mjs`,
      `README.md`, `LICENSE.txt`, `package.json`
- [ ] Envato account, payout details, and tax form completed
- [ ] Choose **non-exclusive** distribution (required for the planned
      ThemeForest/Shopify/widget channels)

## Pre-submission checklist

- [ ] Re-run `node tools/check-demo.mjs` (40 checks) after any change
- [ ] Preview images show upright text (regenerate after any sampling change)
- [ ] Test the ZIP on a clean folder: `npm install && npm run build && npm run demo`
- [ ] Confirm `LICENSE.txt` has your name and jurisdiction filled in
- [ ] Support email/contact resolved at least once a week
