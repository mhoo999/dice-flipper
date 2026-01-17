'use client';

import { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
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
    return `${customization.type}-${imgEntries}-${txtEntries}-${customization.color}-${customization.material}-${customization.opacity}`;
  }, [customization.type, customization.faceImages, customization.faceTexts, customization.color, customization.material, customization.opacity]);

  // 텍스처 생성
  const materials = useMemo(() => {
    if (!customization || !customization.type) {
      console.warn('Customization not ready:', customization);
      return null;
    }
    const result = createDiceMaterials(customization);
    // 디버깅: materials 생성 확인
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.warn('Materials not created for', customization.type, 'result:', result, 'customization:', customization);
    } else {
      console.log('DiceShowcase: Successfully got materials for', customization.type, 'length:', result.length);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizationKey, customization]);

  const scale = 1.2;

  // 모든 주사위 타입에 면별 텍스처 적용
  const shouldUseMaterials = materials && Array.isArray(materials) && materials.length > 0;

  // 다면체 지오메트리에 face groups 설정 (materials 배열 작동을 위해 필수)
  useLayoutEffect(() => {
    console.log('useLayoutEffect check:', {
      hasMesh: !!meshRef.current,
      shouldUseMaterials,
      hasMaterials: !!materials,
      type: customization.type,
      isNotD6: customization.type !== 'D6'
    });
    
    if (meshRef.current && shouldUseMaterials && materials && customization.type !== 'D6') {
      const mesh = meshRef.current;
      console.log('Mesh check:', {
        hasGeometry: !!mesh.geometry,
        hasIndex: !!mesh.geometry?.index,
        groupsCount: mesh.geometry?.groups?.length || 0,
        positionCount: mesh.geometry?.attributes?.position?.count
      });
      
      if (mesh.geometry) {
        const geometry = mesh.geometry;
        const faceCount = materials.length;
        
        // geometry.groups가 없거나 비어있으면 설정
        // index가 없어도 position attribute를 기반으로 계산 가능
        if (!geometry.groups || geometry.groups.length === 0) {
          // position count를 기반으로 계산 (non-indexed geometry)
          // 또는 index가 있으면 index count 사용
          const totalCount = geometry.index 
            ? geometry.index.count 
            : (geometry.attributes.position?.count || 0);
          
          // polyhedron은 각 면이 여러 삼각형으로 구성됨
          // 일반적으로 각 면은 여러 삼각형을 가지지만, 우선 균등하게 분배
          const indicesPerFace = Math.floor(totalCount / faceCount);
          
          console.log('Setting geometry groups:', {
            type: customization.type,
            totalCount,
            faceCount,
            indicesPerFace,
            hasIndex: !!geometry.index
          });
          
          geometry.clearGroups();
          for (let i = 0; i < faceCount; i++) {
            const start = i * indicesPerFace;
            const count = i === faceCount - 1 ? totalCount - start : indicesPerFace;
            geometry.addGroup(start, count, i); // material index
            console.log(`Group ${i}: start=${start}, count=${count}, materialIndex=${i}`);
          }
        }
        
        // D4의 경우 각 면의 UV를 조정하여 숫자 위치 맞추기
        if (customization.type === 'D4' && geometry.attributes.uv) {
          const uv = geometry.attributes.uv;
          const uvArray = uv.array as Float32Array;
          
          // 각 그룹(면)별로 UV 중앙 조정
          for (let i = 0; i < geometry.groups.length; i++) {
            const group = geometry.groups[i];
            // 각 그룹의 모든 vertex에 대해 UV를 조정
            for (let j = 0; j < group.count; j++) {
              const vertexIdx = group.start + j;
              const uvIdx = vertexIdx * 2; // UV는 (u, v) 쌍
              
              if (uvIdx < uvArray.length - 1) {
                // 현재 UV 값을 읽어서
                const currentU = uvArray[uvIdx];
                const currentV = uvArray[uvIdx + 1];
                
                // 각 면별로 오프셋 적용 (면 크기의 10% 정도)
                const offset = 0.1;
                let newU = currentU;
                let newV = currentV;
                
                // 1: 오른쪽 위, 2: 왼쪽 위, 3: 오른쪽 아래, 4: 왼쪽 아래
                if (i === 0) { // 1번 면
                  newU = currentU + offset * 0.5;
                  newV = currentV - offset * 0.5;
                } else if (i === 1) { // 2번 면
                  newU = currentU - offset * 0.3;
                  newV = currentV - offset * 0.3;
                } else if (i === 2) { // 3번 면
                  newU = currentU + offset * 0.3;
                  newV = currentV + offset * 0.3;
                } else if (i === 3) { // 4번 면
                  newU = currentU - offset * 0.5;
                  newV = currentV + offset * 0.5;
                }
                
                uvArray[uvIdx] = newU;
                uvArray[uvIdx + 1] = newV;
              }
            }
          }
          uv.needsUpdate = true;
          console.log('Adjusted UV coordinates for D4 faces');
        }
        
        // materials 배열 설정
        mesh.material = materials;
        console.log('Applied materials array:', {
          type: customization.type,
          materialsLength: materials.length,
          groupsCount: geometry.groups?.length
        });
        
        materials.forEach((mat, idx) => {
          if (mat.map) {
            // 텍스처 강제 업데이트
            mat.map.needsUpdate = true;
            if (mat.map.image) {
              // CanvasTexture의 경우 이미지를 다시 설정하여 강제 업데이트
              mat.map.source.needsUpdate = true;
            }
            console.log(`Material ${idx} has texture:`, mat.map.image ? 'yes' : 'no');
          }
          mat.needsUpdate = true;
        });
      }
    }
  }, [meshRef, shouldUseMaterials, materials, customization.type]);

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
  console.log('DiceShowcase render check:', {
    type: customization.type,
    hasMaterials: !!materials,
    isArray: Array.isArray(materials),
    length: materials?.length,
    shouldUseMaterials
  });

  const renderGeometry = () => {
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

  // materials 배열 사용
  if (shouldUseMaterials) {
    // D6는 material prop 사용, 다른 주사위는 useLayoutEffect로 groups 설정 후 적용
    return (
      <Float speed={isUserInteracting ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh 
          ref={meshRef} 
          castShadow 
          receiveShadow 
          material={customization.type === 'D6' ? materials : undefined}
        >
          {renderGeometry()}
        </mesh>
      </Float>
    );
  }

  // 텍스처가 없는 경우 (fallback)
  return (
    <Float speed={isUserInteracting ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial 
          color={customization.color || "#f5f5f5"} 
          metalness={customization.material === 'metal' ? 0.9 : customization.material === 'glass' ? 0.0 : customization.material === 'wood' ? 0.0 : 0.1}
          roughness={customization.material === 'metal' ? 0.1 : customization.material === 'glass' ? 0.0 : customization.material === 'wood' ? 0.8 : 0.4}
          opacity={customization.opacity ?? 1}
          transparent={(customization.opacity ?? 1) < 1}
          flatShading 
        />
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
