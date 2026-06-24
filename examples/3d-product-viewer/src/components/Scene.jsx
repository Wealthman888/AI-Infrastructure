import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import Product from './Product';
import Loader from './Loader';

export default function Scene({ color, autoRotate, dpr, lowPower }) {
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [3.2, 1.6, 3.2], fov: 45 }}
      performance={{ min: 0.5 }}
      gl={{ antialias: !lowPower }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 2]} intensity={1.1} castShadow />

      <Suspense fallback={<Loader />}>
        <Product color={color} autoRotate={autoRotate} />
        <ContactShadows position={[0, -1.4, 0]} opacity={0.35} scale={8} blur={2.4} far={2} />
      </Suspense>

      <OrbitControls enablePan={false} enableZoom minDistance={2.5} maxDistance={6} enableDamping />
    </Canvas>
  );
}
