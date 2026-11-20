import { useEffect, useRef, useMemo, useState } from "react";
import { ParticleEngine } from "./ParticleEngine.js";
import { ParticleController } from "./ParticleController.js";
import { ParticlesProvider } from "./useParticles.js";
import { generateFormation } from "./utils.js";

/**
 * Particles - Reusable particle system React component
 *
 * @param {object} props
 * @param {number} props.count - Number of particles (default: 1500)
 * @param {string|object} props.theme - 'light' | 'dark' | custom { bg, particle, colorPalette }
 * @param {object} props.formations - Named formations { name: Float32Array }
 * @param {string} props.initialFormation - Formation to start with
 * @param {object} props.physics - Physics config { gravity, turbulence, settlingForce, friction }
 * @param {"absolute"|"fixed"|"none"} props.position - How the wrapper is positioned (default: "absolute")
 * @param {boolean} props.transparent - Skip painting the theme background (default: true)
 * @param {boolean} props.interactive - React to the cursor (default: true)
 * @param {number} props.zIndex - Wrapper z-index (default: 0)
 * @param {string} props.className - Additional CSS classes
 * @param {object} props.style - Additional inline styles
 * @param {function} props.onReady - Callback with controller reference
 * @param {React.ReactNode} props.children - Child components (can use useParticles hook)
 */
export default function Particles({
  count = 1500,
  theme = "light",
  formations = {},
  initialFormation,
  physics = {},
  className = "",
  style,
  position = "absolute",
  transparent = true,
  interactive = true,
  zIndex = 0,
  onReady,
  children,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const controllerRef = useRef(null);
  const [controller, setController] = useState(null);

  // Create default random formation if none provided
  const allFormations = useMemo(() => {
    const defaults = {
      random: generateFormation.random(count),
    };
    return { ...defaults, ...formations };
  }, [count, formations]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize engine
    const engine = new ParticleEngine(canvasRef.current, {
      count,
      interactive,
      transparent,
    });

    // Initialize controller
    const ctrl = new ParticleController(engine.store, physics);
    ctrl.renderer = engine.renderer;

    // Set theme and formations
    ctrl.setTheme(theme, { animate: false });
    ctrl.setFormations(allFormations);

    // Snap to initial formation
    const startFormation = initialFormation || Object.keys(allFormations)[0];
    if (startFormation && allFormations[startFormation]) {
      ctrl.snapTo(startFormation);
    }

    engineRef.current = engine;
    controllerRef.current = ctrl;
    setController(ctrl);

    // Respect reduced-motion preferences: render a static frame instead
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      if (motionQuery?.matches) {
        engine.renderOnce();
      } else {
        engine.start((time, dt, mouse) => ctrl.update(time, dt, mouse));
      }
    };
    updateMotion();
    motionQuery?.addEventListener?.("change", updateMotion);

    if (onReady) {
      onReady(ctrl);
    }

    return () => {
      motionQuery?.removeEventListener?.("change", updateMotion);
      engine.dispose();
      engineRef.current = null;
      controllerRef.current = null;
    };
  }, [count]); // Only recreate on count change

  // Update theme when prop changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setTheme(theme);
    }
  }, [theme]);

  // Update formations when prop changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setFormations(allFormations);
    }
  }, [allFormations]);

  // Update physics when prop changes
  useEffect(() => {
    if (controllerRef.current && physics) {
      controllerRef.current.setPhysics(physics);
    }
  }, [physics]);

  // Toggle transparent background
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.renderer.setTransparent(transparent);
    }
  }, [transparent]);

  return (
    <ParticlesProvider value={controller}>
      <div
        className={className}
        style={{
          position: position === "none" ? "relative" : position,
          inset: position === "none" ? undefined : 0,
          overflow: "hidden",
          zIndex,
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
          }}
        />
        {children}
      </div>
    </ParticlesProvider>
  );
}
