import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { Particles, useParticles, generateFormation } from "../../index.js";

const COUNT = 1400;
const MINI_COUNT = 600;

function Controls() {
  const { isReady, morphTo, formText } = useParticles();
  const [text, setText] = useState("HELLO");

  return (
    <div className="controls">
      <div className="group">
        {["sphere", "ring", "grid", "scatter"].map((name) => (
          <button
            key={name}
            className="btn"
            onClick={() => morphTo(name, 1.2, "power2.inOut")}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="group">
        <input
          value={text}
          maxLength={14}
          aria-label="Text formation"
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="btn primary"
          onClick={() => formText(text || "HELLO", { fontSize: 130 })}
        >
          Form text
        </button>
        <span className={isReady ? "status ok" : "status"}>
          {isReady ? "controller ready" : "initializing"}
        </span>
      </div>
    </div>
  );
}

function App() {
  const formations = useMemo(
    () => ({
      sphere: generateFormation.sphere(COUNT, 210),
      ring: generateFormation.ring(COUNT, 235, 30),
      grid: generateFormation.grid(COUNT, 720, 440, 44),
      scatter: generateFormation.random(COUNT, 1800),
    }),
    []
  );

  const miniFormations = useMemo(
    () => ({
      sphere: generateFormation.sphere(MINI_COUNT, 80),
      helix: generateFormation.helix(MINI_COUNT, 180, 40, 3),
    }),
    []
  );

  return (
    <main className="page">
      <header>
        <span className="kicker">React component demo</span>
        <h1>Embedded particle section</h1>
        <p>
          The same engine constrained to a section instead of the viewport. It
          sizes itself to its container, supports multiple instances on one
          page, and exposes controls through the <code>useParticles</code> hook.
        </p>
      </header>

      <section className="stage">
        <Particles
          count={COUNT}
          theme="dark"
          formations={formations}
          initialFormation="sphere"
          transparent
          zIndex={1}
        >
          <Controls />
        </Particles>
      </section>

      <h2>Multiple instances, container-sized</h2>
      <p className="sub">
        Each instance is independent and resizes with its own container.
      </p>
      <div className="mini">
        <Particles
          count={MINI_COUNT}
          theme={{
            particle: { r: 255, g: 200, b: 90 },
            colorPalette: [
              { r: 255, g: 214, b: 120 },
              { r: 255, g: 176, b: 64 },
              { r: 255, g: 236, b: 184 },
            ],
          }}
          formations={miniFormations}
          initialFormation="helix"
          transparent
        />
      </div>

      <h2>Usage</h2>
      <pre>
        <span className="tag">import</span> {"{ Particles, useParticles }"}{" "}
        <span className="tag">from</span> {"'particle-morph'"};\n
        {"\n"}
        {"<section style={{ position: 'relative', height: 400 }}>"}
        {"\n  "}
        {"<Particles count={1400} formations={formations} transparent />"}
        {"\n"}
        {"</section>"}
      </pre>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
