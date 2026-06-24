import { useMemo } from 'react';
import Scene from '../components/hero3d/Scene';
import WebGLGate from '../components/WebGLGate';
import { isMobileDevice } from '../utils/device';

export default function Hero() {
  const isMobile = useMemo(isMobileDevice, []);
  const dpr = isMobile ? 1 : [1, 2];
  const coinCount = isMobile ? 8 : 14;
  const barCount = isMobile ? 4 : 6;

  return (
    <section className="hero">
      <div className="hero-3d">
        <WebGLGate fallback={<div className="hero-3d-fallback" aria-hidden="true" />}>
          <Scene dpr={dpr} lowPower={isMobile} coinCount={coinCount} barCount={barCount} />
        </WebGLGate>
      </div>

      <div className="hero-content">
        <span className="kicker">Infrastructure for modern finance</span>
        <h1>Move money at the speed of the internet.</h1>
        <p>
          Meridian gives fintechs and banks a single API for payments, ledgers, and
          compliance — built to settle in milliseconds, not days.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#contact">Start building</a>
          <a className="btn btn-ghost" href="#features">See how it works</a>
        </div>
        <div className="trust-badges">
          <span>SOC 2 Type II</span>
          <span>256-bit encryption</span>
          <span>99.99% uptime SLA</span>
        </div>
      </div>
    </section>
  );
}
