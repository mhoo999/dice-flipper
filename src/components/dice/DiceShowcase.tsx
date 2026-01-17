'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { DiceCustomization } from '@/types/dice';
import { createDiceMaterials } from '@/lib/diceTexture';

interface DiceShowcaseProps {
  customization: DiceCustomization;
}

function DiceMesh({ customization, isUserInteracting }: { customization: DiceCustomization; isUserInteracting: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseRotationRef = useRef({ y: 0, x: 0 });

  // 커스터마이징 키 생성 (실시간 업데이트용)
  const customizationKey = useMemo(() => {
    const imgEntries = Object.entries(customization.faceImages || {})
      .map(([k, v]) => `${k}:${v?.length || 0}`)
      .join(',');
    const txtEntries = Object.entries(customization.faceTexts || {})
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${customization.type}-${imgEntries}-${txtEntries}`;
  }, [customization.type, customization.faceImages, customization.faceTexts]);

  // 텍스처 생성
  const materials = useMemo(() => {
    return createDiceMaterials(customization);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizationKey, customization]);

  // 자동 회전 (사용자가 조작 중이 아닐 때만)
  useFrame((state) => {
    if (meshRef.current) {
      if (!isUserInteracting) {
        // 자동 회전
        const elapsedTime = state.clock.elapsedTime;
        baseRotationRef.current.y = elapsedTime * 0.5;
        baseRotationRef.current.x = Math.sin(elapsedTime * 0.3) * 0.2;
      }
      // 마지막 회전 상태 유지
      meshRef.current.rotation.y = baseRotationRef.current.y;
      meshRef.current.rotation.x = baseRotationRef.current.x;
    }
  });

  const scale = 1.2;

  // D6는 6개 면에 각각 다른 머티리얼
  if (customization.type === 'D6' && Array.isArray(materials)) {
    return (
      <Float speed={isUserInteracting ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh key={customizationKey} ref={meshRef} castShadow receiveShadow material={materials}>
          <boxGeometry args={[scale, scale, scale]} />
        </mesh>
      </Float>
    );
  }

  // 다른 다면체들
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
    <Float speed={isUserInteracting ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial color="#f5f5f5" metalness={0.1} roughness={0.4} flatShading />
      </mesh>
    </Float>
  );
}

export function DiceShowcaseScene({ customization }: DiceShowcaseProps) {
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // DiceMesh 컴포넌트 재마운트를 위한 키 생성
  const meshKey = useMemo(() => {
    const imgEntries = Object.entries(customization.faceImages || {})
      .map(([k, v]) => `${k}:${v?.length || 0}`)
      .join(',');
    const txtEntries = Object.entries(customization.faceTexts || {})
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${customization.type}-${imgEntries}-${txtEntries}`;
  }, [customization.type, customization.faceImages, customization.faceTexts]);

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1.2}
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />
      <pointLight position={[0, -5, 0]} intensity={0.3} />

      {/* 환경맵 */}
      <Environment preset="apartment" />

      {/* 주사위 */}
      <DiceMesh key={meshKey} customization={customization} isUserInteracting={isUserInteracting} />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={!isUserInteracting}
        autoRotateSpeed={1}
        onStart={() => setIsUserInteracting(true)}
        onEnd={() => setIsUserInteracting(false)}
      />
    </>
  );
}

export default DiceShowcaseScene;
