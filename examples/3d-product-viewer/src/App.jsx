import { useMemo, useState } from 'react';
import Scene from './components/Scene';
import WebGLGate from './components/WebGLGate';
import './App.css';

const COLORS = [
  { name: 'Cobalt', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
];

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function App() {
  const [color, setColor] = useState(COLORS[0].hex);
  const [autoRotate, setAutoRotate] = useState(true);

  const isMobile = useMemo(isMobileDevice, []);
  const dpr = isMobile ? 1 : [1, 2];

  return (
    <div className="app">
      <header className="hero">
        <h1>AI Orb Configurator</h1>
        <p>A sample 3D product viewer built with React Three Fiber — drag to orbit, pick a finish.</p>
      </header>

      <div className="viewer">
        <WebGLGate
          fallback={
            <div className="webgl-fallback">
              <img src="/fallback-orb.svg" alt="Static preview of the AI orb" width={160} height={160} />
              <p>Your browser doesn't support WebGL, so here's a static preview instead.</p>
            </div>
          }
        >
          <Scene color={color} autoRotate={autoRotate} dpr={dpr} lowPower={isMobile} />
        </WebGLGate>
      </div>

      <div className="controls">
        <div className="swatches" role="group" aria-label="Finish color">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`swatch ${c.hex === color ? 'active' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setColor(c.hex)}
              aria-label={`Set finish to ${c.name}`}
              aria-pressed={c.hex === color}
            />
          ))}
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(event) => setAutoRotate(event.target.checked)}
          />
          Auto-rotate
        </label>
      </div>
    </div>
  );
}
