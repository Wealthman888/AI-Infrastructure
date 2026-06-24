import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import getDemoLoadResource from '../utils/demoLoadResource';

const SATELLITE_COUNT = 8;

export default function Product({ color, autoRotate }) {
  getDemoLoadResource();

  const group = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  const satellites = useMemo(
    () =>
      Array.from({ length: SATELLITE_COUNT }, (_, i) => {
        const angle = (i / SATELLITE_COUNT) * Math.PI * 2;
        return [Math.cos(angle) * 2.4, Math.sin(angle * 2) * 0.4, Math.sin(angle) * 2.4];
      }),
    []
  );

  useFrame((_, delta) => {
    if (!autoRotate) return;
    group.current.rotation.y += delta * 0.25;
    ring1.current.rotation.x += delta * 0.4;
    ring2.current.rotation.z += delta * 0.3;
  });

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.25}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      <mesh ref={ring1} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 16, 96]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh ref={ring2} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[2.1, 0.03, 16, 96]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
      </mesh>

      <Instances limit={SATELLITE_COUNT}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        {satellites.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>
    </group>
  );
}
