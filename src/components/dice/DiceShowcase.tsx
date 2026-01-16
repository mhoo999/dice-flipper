'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { DiceCustomization, DiceType, DICE_CONFIGS } from '@/types/dice';

interface DiceShowcaseProps {
  customization: DiceCustomization;
  autoRotate?: boolean;
}

// 재질별 머티리얼 속성
const MATERIAL_PROPS = {
  plastic: { metalness: 0.1, roughness: 0.4 },
  metal: { metalness: 0.9, roughness: 0.2 },
  glass: { metalness: 0.1, roughness: 0.05, transparent: true },
  wood: { metalness: 0, roughness: 0.8 },
};

function DiceMesh({ customization }: { customization: DiceCustomization }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialProps = MATERIAL_PROPS[customization.material];

  // 자동 회전
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  const renderGeometry = () => {
    const scale = 1.2;
    switch (customization.type) {
      case 'D4':
        return <tetrahedronGeometry args={[scale, 0]} />;
      case 'D6':
        return <boxGeometry args={[scale, scale, scale]} />;
      case 'D8':
        return <octahedronGeometry args={[scale * 0.85, 0]} />;
      case 'D10':
        return <dodecahedronGeometry args={[scale * 0.75, 0]} />;
      case 'D12':
        return <dodecahedronGeometry args={[scale * 0.8, 0]} />;
      case 'D20':
        return <icosahedronGeometry args={[scale * 0.8, 0]} />;
      default:
        return <boxGeometry args={[scale, scale, scale]} />;
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial
          color={customization.color}
          {...materialProps}
          opacity={customization.opacity}
          transparent={customization.opacity < 1}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
}

export function DiceShowcaseScene({ customization }: DiceShowcaseProps) {
  const config = DICE_CONFIGS[customization.type];

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#88aaff" />

      {/* 환경맵 */}
      <Environment preset="city" />

      {/* 주사위 */}
      <DiceMesh customization={customization} />

      {/* 바닥 반사 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#111122"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 카메라 컨트롤 */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default DiceShowcaseScene;
