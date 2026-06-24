import { Canvas } from '@react-three/fiber';
import TrustOrb from './TrustOrb';
import ParallaxRig from './ParallaxRig';

export default function Scene({ dpr, lowPower, coinCount, barCount }) {
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0.6, 6], fov: 42 }}
      performance={{ min: 0.5 }}
      gl={{ antialias: !lowPower, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />

      <ParallaxRig intensity={0.22}>
        <TrustOrb coinCount={coinCount} barCount={barCount} />
      </ParallaxRig>
    </Canvas>
  );
}
