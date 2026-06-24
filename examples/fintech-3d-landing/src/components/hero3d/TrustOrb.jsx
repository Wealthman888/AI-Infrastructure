import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';

export default function TrustOrb({ coinCount = 14, barCount = 6 }) {
  const core = useRef();
  const coinsA = useRef();
  const coinsB = useRef();
  const bars = useRef();

  const ringBCount = Math.round(coinCount * 0.6);

  const ringA = useMemo(
    () =>
      Array.from({ length: coinCount }, (_, i) => {
        const angle = (i / coinCount) * Math.PI * 2;
        return { angle, radius: 2.1, y: Math.sin(angle * 3) * 0.15 };
      }),
    [coinCount]
  );

  const ringB = useMemo(
    () =>
      Array.from({ length: ringBCount }, (_, i) => {
        const angle = (i / ringBCount) * Math.PI * 2;
        return { angle, radius: 2.7, y: Math.cos(angle * 2) * 0.2 };
      }),
    [ringBCount]
  );

  const barData = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        x: (i - (barCount - 1) / 2) * 0.32,
        base: 0.4 + Math.random() * 0.3,
        speed: 0.6 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      })),
    [barCount]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) core.current.rotation.y += delta * 0.15;
    if (coinsA.current) coinsA.current.rotation.y -= delta * 0.25;
    if (coinsB.current) coinsB.current.rotation.y += delta * 0.18;

    if (bars.current) {
      bars.current.children.forEach((mesh, i) => {
        const { base, speed, phase } = barData[i];
        const h = base + Math.sin(t * speed + phase) * 0.25 + 0.35;
        mesh.scale.y = h;
        mesh.position.y = h / 2 - 1.1;
      });
    }
  });

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#10b981" wireframe emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.08} />
      </mesh>

      <group ref={coinsA}>
        <Instances limit={ringA.length}>
          <cylinderGeometry args={[0.16, 0.16, 0.045, 20]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.25} />
          {ringA.map((c, i) => (
            <Instance
              key={i}
              position={[Math.cos(c.angle) * c.radius, c.y, Math.sin(c.angle) * c.radius]}
              rotation={[Math.PI / 2, 0, c.angle]}
            />
          ))}
        </Instances>
      </group>

      <group ref={coinsB}>
        <Instances limit={ringB.length}>
          <cylinderGeometry args={[0.11, 0.11, 0.035, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.7} roughness={0.3} />
          {ringB.map((c, i) => (
            <Instance
              key={i}
              position={[Math.cos(c.angle) * c.radius, c.y, Math.sin(c.angle) * c.radius]}
              rotation={[Math.PI / 2, 0, c.angle]}
            />
          ))}
        </Instances>
      </group>

      <group ref={bars} position={[2.3, 0, -1.4]}>
        {barData.map((b, i) => (
          <mesh key={i} position={[b.x, 0, 0]}>
            <boxGeometry args={[0.18, 1, 0.18]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
