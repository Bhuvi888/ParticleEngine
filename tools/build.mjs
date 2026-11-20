import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const shared = { bundle: true, logLevel: "info" };

// React ESM build (react stays external)
await build({
  ...shared,
  entryPoints: ["index.js"],
  format: "esm",
  platform: "neutral",
  packages: "external",
  jsx: "automatic",
  outfile: "dist/particle-morph.esm.js",
});

// Vanilla ESM build
await build({
  ...shared,
  entryPoints: ["vanilla.js"],
  format: "esm",
  outfile: "dist/particle-morph.vanilla.esm.js",
});

// Script-tag build (no React, no dependencies)
await build({
  ...shared,
  entryPoints: ["vanilla.js"],
  format: "iife",
  globalName: "ParticleMorph",
  minify: true,
  outfile: "dist/particle-morph.global.js",
});

// React example app
await build({
  ...shared,
  entryPoints: ["examples/react-demo/main.jsx"],
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  outfile: "examples/react-demo/app.js",
});
