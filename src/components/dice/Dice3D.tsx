'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { DICE_CONFIGS } from '@/types/dice';
import { calculateDiceResult } from '@/lib/diceGeometry';
import { createDiceMaterials } from '@/lib/diceTexture';
import { useDiceStore, DiceInPlay } from '@/store/diceStore';

interface Dice3DProps {
  dice: DiceInPlay;
}

export function Dice3D({ dice }: Dice3DProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isStable, setIsStable] = useState(false);
  const stableFrames = useRef(0);

  const setDiceResult = useDiceStore((state) => state.setDiceResult);
  const rollPower = useDiceStore((state) => state.rollPower);

  const { customization, position, rotation, isRolling } = dice;

  // 텍스처/머티리얼 생성
  const materials = useMemo(() => {
    return createDiceMaterials(customization);
  }, [customization]);

  // 주사위 굴리기 시작
  useEffect(() => {
    if (isRolling && rigidBodyRef.current) {
      const rb = rigidBodyRef.current;

      rb.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true
      );

      rb.setRotation(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation[0], rotation[1], rotation[2])
        ),
        true
      );

      // 파워에 따른 힘 조절 (최소 20%, 최대 100%)
      const powerMultiplier = Math.max(0.2, rollPower / 100);

      // 중앙 한 포인트(0, 0, 0)를 향해 던지기
      const targetX = 0;
      const targetZ = 0;
      const dirX = targetX - position[0];
      const dirZ = targetZ - position[2];
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      const normalizedX = dirX / length;
      const normalizedZ = dirZ / length;

      const baseSpeed = 15 + 12 * powerMultiplier;
      const force = {
        x: normalizedX * baseSpeed,
        y: 1 + Math.random() * 2 * powerMultiplier,
        z: normalizedZ * baseSpeed,
      };

      const torque = {
        x: (Math.random() - 0.5) * 80 * powerMultiplier,
        y: (Math.random() - 0.5) * 80 * powerMultiplier,
        z: (Math.random() - 0.5) * 80 * powerMultiplier,
      };

      rb.setLinvel({ x: force.x, y: force.y, z: force.z }, true);
      rb.setAngvel({ x: torque.x, y: torque.y, z: torque.z }, true);

      setIsStable(false);
      stableFrames.current = 0;
    }
  }, [isRolling, position, rotation, rollPower]);

  // 매 프레임 안정성 체크
  useFrame(() => {
    if (!rigidBodyRef.current || isStable || !dice.isRolling) return;

    const rb = rigidBodyRef.current;
    const linvel = rb.linvel();
    const angvel = rb.angvel();

    const velocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const angularVelocity = new THREE.Vector3(angvel.x, angvel.y, angvel.z);

    const isSlowEnough =
      velocity.length() < 0.1 && angularVelocity.length() < 0.1;

    if (isSlowEnough) {
      stableFrames.current++;

      if (stableFrames.current > 30) {
        const quaternion = new THREE.Quaternion();
        const rot = rb.rotation();
        quaternion.set(rot.x, rot.y, rot.z, rot.w);

        const result = calculateDiceResult(customization.type, quaternion);
        setDiceResult(dice.id, result);
        setIsStable(true);
      }
    } else {
      stableFrames.current = 0;
    }
  });

  const scale = 0.5;

  // D6는 면별 텍스처 적용 (이미지가 있을 때)
  if (customization.type === 'D6' && Array.isArray(materials)) {
    return (
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        rotation={rotation}
        restitution={0.7}
        friction={0.3}
        linearDamping={0.05}
        angularDamping={0.05}
        colliders={false}
      >
        <CuboidCollider args={[0.25, 0.25, 0.25]} />
        <mesh ref={meshRef} castShadow receiveShadow material={materials}>
          <boxGeometry args={[scale, scale, scale]} />
        </mesh>
      </RigidBody>
    );
  }

  // 다른 다면체들 - flatShading으로 면 구분
  const renderGeometry = () => {
    switch (customization.type) {
      case 'D4':
        return <tetrahedronGeometry args={[scale * 1.2, 0]} />;
      case 'D8':
        return <octahedronGeometry args={[scale * 0.7, 0]} />;
      case 'D10':
        return <dodecahedronGeometry args={[scale * 0.6, 0]} />;
      case 'D12':
        return <dodecahedronGeometry args={[scale * 0.65, 0]} />;
      case 'D20':
        return <icosahedronGeometry args={[scale * 0.65, 0]} />;
      default:
        return <boxGeometry args={[scale, scale, scale]} />;
    }
  };

  const renderCollider = () => {
    switch (customization.type) {
      case 'D6':
        return <CuboidCollider args={[0.25, 0.25, 0.25]} />;
      default:
        return <BallCollider args={[0.35]} />;
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      restitution={0.7}
      friction={0.3}
      linearDamping={0.05}
      angularDamping={0.05}
      colliders={false}
    >
      {renderCollider()}
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial color="#f5f5f5" metalness={0.1} roughness={0.4} flatShading />
      </mesh>
    </RigidBody>
  );
}

export default Dice3D;
