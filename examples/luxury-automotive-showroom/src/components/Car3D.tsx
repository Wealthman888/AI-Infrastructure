import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import type { Group } from 'three'

function CarBody() {
  const ref = useRef<Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.25
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05
  })

  return (
    <group ref={ref} position={[0, 0.4, 0]}>
      {/* lower chassis */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.6, 0.35, 1.1]} />
        <meshStandardMaterial color="#0d0d0f" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* cabin */}
      <mesh position={[-0.1, 0.32, 0]} castShadow>
        <boxGeometry args={[1.3, 0.32, 0.95]} />
        <meshStandardMaterial color="#15151a" metalness={0.85} roughness={0.1} />
      </mesh>
      {/* nose taper */}
      <mesh position={[1.3, -0.02, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.55, 0.6, 4]} />
        <meshStandardMaterial color="#0d0d0f" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* accent strip */}
      <mesh position={[0, 0.05, 0.56]}>
        <boxGeometry args={[2.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#c9a95c" emissive="#c9a95c" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.05, -0.56]}>
        <boxGeometry args={[2.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#1fe0c8" emissive="#1fe0c8" emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[20, 20]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={50}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.6}
      />
    </mesh>
  )
}

export default function Car3D({ className = '' }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [3.2, 1.6, 3.2], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 2]} intensity={1.6} color="#e4cf9a" castShadow />
        <pointLight position={[-3, 1, -2]} intensity={3} color="#1fe0c8" />
        <pointLight position={[2, 2, -3]} intensity={1.5} color="#ffffff" />
        <CarBody />
        <ReflectiveFloor />
      </Canvas>
    </div>
  )
}
