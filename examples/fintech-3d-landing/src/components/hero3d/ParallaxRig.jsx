import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Tilts toward the pointer instead of OrbitControls, so the canvas never
// captures drag/scroll gestures on the page.
export default function ParallaxRig({ children, intensity = 0.22 }) {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    const targetX = -state.pointer.y * intensity;
    const targetY = state.pointer.x * intensity;
    const ease = Math.min(delta * 4, 1);
    group.current.rotation.x += (targetX - group.current.rotation.x) * ease;
    group.current.rotation.y += (targetY - group.current.rotation.y) * ease;
  });

  return <group ref={group}>{children}</group>;
}
