import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function GridParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!reducedMotion && pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#3b82f6"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function WireGrid({ reducedMotion }: { reducedMotion: boolean }) {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && gridRef.current) {
      gridRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 - 3;
    }
  });

  return (
    <group ref={gridRef} position={[0, -3, -5]} rotation={[1.2, 0, 0]}>
      <gridHelper args={[40, 40, '#3b82f6', '#1b202a']} />
    </group>
  );
}

export const SpatialBackground: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0e131d]">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', alpha: true, antialias: false }}
      >
        <ambientLight intensity={0.5} />
        <GridParticles reducedMotion={reducedMotion} />
        <WireGrid reducedMotion={reducedMotion} />
      </Canvas>
      {/* Subtle Vignette Gradient Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0e131d]/70 to-[#0e131d] pointer-events-none" />
    </div>
  );
};
