'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { DiceState, DiceType, DICE_CONFIGS } from '@/types/dice';
import { calculateDiceResult } from '@/lib/diceGeometry';
import { useDiceStore } from '@/store/diceStore';

interface Dice3DProps {
  dice: DiceState;
  onSelect?: () => void;
}

// 재질별 머티리얼 속성
const MATERIAL_PROPS = {
  plastic: {
    metalness: 0.1,
    roughness: 0.4,
  },
  metal: {
    metalness: 0.9,
    roughness: 0.2,
  },
  glass: {
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
  },
  wood: {
    metalness: 0,
    roughness: 0.8,
  },
};

export function Dice3D({ dice, onSelect }: Dice3DProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isStable, setIsStable] = useState(false);
  const lastVelocity = useRef<THREE.Vector3>(new THREE.Vector3());
  const stableFrames = useRef(0);

  const setDiceResult = useDiceStore((state) => state.setDiceResult);
  const setDiceRolling = useDiceStore((state) => state.setDiceRolling);
  const selectedDiceId = useDiceStore((state) => state.selectedDiceId);

  const { customization, position, rotation, isRolling } = dice;
  const config = DICE_CONFIGS[customization.type];
  const materialProps = MATERIAL_PROPS[customization.material];

  // 텍스처 생성
  const textures = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = customization.color;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [customization.color]);

  // 주사위 굴리기 시작
  useEffect(() => {
    if (isRolling && rigidBodyRef.current) {
      const rb = rigidBodyRef.current;

      // 위치 리셋
      rb.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true
      );

      // 랜덤 회전
      rb.setRotation(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation[0], rotation[1], rotation[2])
        ),
        true
      );

      // 힘 적용 (야추처럼 던지기)
      const force = {
        x: (Math.random() - 0.5) * 15,
        y: -5,
        z: (Math.random() - 0.5) * 15,
      };

      const torque = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
      };

      rb.setLinvel({ x: force.x, y: force.y, z: force.z }, true);
      rb.setAngvel({ x: torque.x, y: torque.y, z: torque.z }, true);

      setIsStable(false);
      stableFrames.current = 0;
    }
  }, [isRolling, position, rotation]);

  // 매 프레임 안정성 체크
  useFrame(() => {
    if (!rigidBodyRef.current || isStable) return;

    const rb = rigidBodyRef.current;
    const linvel = rb.linvel();
    const angvel = rb.angvel();

    const velocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const angularVelocity = new THREE.Vector3(angvel.x, angvel.y, angvel.z);

    const isSlowEnough =
      velocity.length() < 0.1 && angularVelocity.length() < 0.1;

    if (isSlowEnough) {
      stableFrames.current++;

      // 30프레임 동안 안정적이면 결과 확정
      if (stableFrames.current > 30 && dice.isRolling) {
        const quaternion = new THREE.Quaternion();
        const rotation = rb.rotation();
        quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

        const result = calculateDiceResult(customization.type, quaternion);
        setDiceResult(dice.id, result);
        setIsStable(true);
      }
    } else {
      stableFrames.current = 0;
    }

    lastVelocity.current = velocity;
  });

  // 주사위 타입별 형태 렌더링
  const renderDiceGeometry = () => {
    const { type } = customization;
    const scale = 0.5;

    switch (type) {
      case 'D4':
        return <tetrahedronGeometry args={[scale * 1.2, 0]} />;
      case 'D6':
        return <boxGeometry args={[scale, scale, scale]} />;
      case 'D8':
        return <octahedronGeometry args={[scale * 0.7, 0]} />;
      case 'D10':
        // D10은 특별한 지오메트리 필요 - 간략화해서 dodecahedron 사용
        return <dodecahedronGeometry args={[scale * 0.6, 0]} />;
      case 'D12':
        return <dodecahedronGeometry args={[scale * 0.65, 0]} />;
      case 'D20':
        return <icosahedronGeometry args={[scale * 0.65, 0]} />;
      default:
        return <boxGeometry args={[scale, scale, scale]} />;
    }
  };

  // Collider 형태
  const renderCollider = () => {
    const { type } = customization;

    switch (type) {
      case 'D6':
        return <CuboidCollider args={[0.25, 0.25, 0.25]} />;
      default:
        return <BallCollider args={[0.35]} />;
    }
  };

  const isSelected = selectedDiceId === dice.id;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      restitution={0.3}
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
      colliders={false}
    >
      {renderCollider()}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        castShadow
        receiveShadow
      >
        {renderDiceGeometry()}
        <meshStandardMaterial
          color={customization.color}
          {...materialProps}
          opacity={customization.opacity}
          transparent={customization.opacity < 1}
          emissive={isSelected ? customization.color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* 결과 표시 */}
      {dice.result && !dice.isRolling && (
        <sprite position={[0, 0.8, 0]} scale={[0.5, 0.5, 0.5]}>
          <spriteMaterial color="white" opacity={0.9} transparent />
        </sprite>
      )}
    </RigidBody>
  );
}

export default Dice3D;
