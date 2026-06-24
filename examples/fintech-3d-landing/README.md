# Meridian — Fintech 3D Landing Page

A one-page fintech marketing site built with the `3d-web-experience` skill: a
React Three Fiber hero scene behind standard marketing sections.

## Stack

- React + Vite
- `@react-three/fiber` + `@react-three/drei`

## Page structure (single page, top to bottom)

1. **Navbar** — sticky, blurred over the hero.
2. **Hero** — full-viewport 3D scene (`TrustOrb`) behind the headline/CTA.
3. **Features** — bank-grade security, real-time settlement, global payouts.
4. **Stats** — volume/uptime/coverage numbers.
5. **CTA** — closing call to action.
6. **Footer**.

## The 3D scene (`src/components/hero3d`)

- `TrustOrb.jsx` — a wireframe "vault" core, two instanced rings of coins
  spinning at different speeds, and a small cluster of animated growth bars.
  All procedural geometry, no external 3D model assets.
- `ParallaxRig.jsx` — tilts the scene toward the pointer using R3F's built-in
  `state.pointer`. Deliberately **not** `OrbitControls`: a marketing page
  scrolls, and drag-to-orbit controls capture the gestures users need for
  that, so the hero just gets a subtle parallax tilt instead.
- `Scene.jsx` — sets up the `Canvas`, lighting (ambient + one directional —
  3D lighting is expensive, so keep it minimal), and per-device performance
  knobs (`dpr`, antialiasing, instance counts) passed down from `Hero.jsx`
  based on a mobile user-agent check.
- `WebGLGate.jsx` — detects WebGL support and swaps in a static gradient
  panel if it's unavailable, so the hero copy is never blocked by a broken
  canvas.

## Run it

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
