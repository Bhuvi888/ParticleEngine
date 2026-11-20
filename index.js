// Reusable Particle Engine Component
// Drop this folder into any React project to use

// Main component
export { default as Particles } from "./Particles.jsx";
export { default } from "./Particles.jsx";

// Hook for controlling particles
export { useParticles, ParticlesProvider } from "./useParticles.js";

// Formation utilities
export { generateFormation } from "./utils.js";

// Core classes (for advanced/vanilla usage)
export { ParticleEngine } from "./ParticleEngine.js";
export { ParticleController } from "./ParticleController.js";
export { ParticleRenderer } from "./ParticleRenderer.js";
export { ParticleStore } from "./ParticleStore.js";
