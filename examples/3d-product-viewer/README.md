# AI Orb Configurator

Sample site demonstrating the `3d-web-experience` skill: a React Three Fiber
product viewer with a color configurator.

## Stack

- React + Vite
- `@react-three/fiber` + `@react-three/drei`

## What it shows

- **Product configurator pattern** — color swatches re-tint the product mesh live.
- **Loading indicator** — `Suspense` fallback (`src/components/Loader.jsx`) shown while
  the (simulated) 3D asset loads.
- **WebGL fallback** — `src/components/WebGLGate.jsx` detects WebGL support and renders
  a static SVG preview if it's unavailable.
- **Mobile performance** — lower device pixel ratio and disabled antialiasing on
  mobile user agents (`src/App.jsx`), plus `performance={{ min: 0.5 }}` to allow
  frame-rate scaling under load.
- **Instancing** — orbiting satellites use `<Instances>`/`<Instance>` instead of
  separate meshes per object.

The "product" itself is procedural geometry (icosahedron core + torus rings +
instanced satellites) so the demo runs with no external 3D model assets.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. Drag to orbit, scroll to zoom, and use the
swatches below the viewer to change the finish color.

## Build

```bash
npm run build
```
