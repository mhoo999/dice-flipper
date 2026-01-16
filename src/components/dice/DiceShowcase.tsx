'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { DiceCustomization } from '@/types/dice';
import { createDiceMaterials } from '@/lib/diceTexture';

interface DiceShowcaseProps {
  customization: DiceCustomization;
}

function DiceMesh({ customization }: { customization: DiceCustomization }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 텍스처 생성
  const materials = useMemo(() => {
    return createDiceMaterials(customization);
  }, [customization]);

  // 자동 회전
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  const scale = 1.2;

  // D6는 6개 면에 각각 다른 머티리얼 (이미지가 있을 때)
  if (customization.type === 'D6' && Array.isArray(materials)) {
    return (
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} castShadow receiveShadow material={materials}>
          <boxGeometry args={[scale, scale, scale]} />
        </mesh>
      </Float>
    );
  }

  // 다른 다면체들 - flatShading으로 면 구분
  const renderGeometry = () => {
    switch (customization.type) {
      case 'D4':
        return <tetrahedronGeometry args={[scale, 0]} />;
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
        <meshStandardMaterial color="#f5f5f5" metalness={0.1} roughness={0.4} flatShading />
      </mesh>
    </Float>
  );
}

export function DiceShowcaseScene({ customization }: DiceShowcaseProps) {
  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1.5}
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#88aaff" />
      <pointLight position={[0, -5, 0]} intensity={0.4} color="#ff8888" />

      {/* 환경맵 */}
      <Environment preset="city" />

      {/* 주사위 */}
      <DiceMesh customization={customization} />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate
        autoRotateSpeed={1}
      />
    </>
  );
}

export default DiceShowcaseScene;
