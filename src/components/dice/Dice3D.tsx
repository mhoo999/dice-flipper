'use client';

import { useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { DICE_CONFIGS } from '@/types/dice';
import { calculateDiceResult } from '@/lib/diceGeometry';
import { createDiceMaterials } from '@/lib/diceTexture';
import { useDiceStore, DiceInPlay } from '@/store/diceStore';
import { playResultSound, playBounceSound, vibrate } from '@/lib/sound';

interface Dice3DProps {
  dice: DiceInPlay;
}

export function Dice3D({ dice }: Dice3DProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isStable, setIsStable] = useState(false);
  const diceInPlay = useDiceStore((state) => state.diceInPlay);
  
  // 주사위 개수에 따라 테이블 크기 동적 계산 (DiceScene과 동일한 로직)
  const diceCount = diceInPlay.filter(d => d.enabled && !d.locked).length;
  const tableSize = Math.min(16, Math.max(10, 10 + Math.ceil((diceCount - 10) * 0.3)));
  const tableHalfSize = tableSize / 2;
  const stableFrames = useRef(0);

  const setDiceResult = useDiceStore((state) => state.setDiceResult);
  const rollPower = useDiceStore((state) => state.rollPower);
  const isMuted = useDiceStore((state) => state.isMuted);
  const isCharging = useDiceStore((state) => state.isCharging);
  const diceInPlayCount = useDiceStore((state) => state.diceInPlay.length);

  const { customization, position, rotation, isRolling } = dice;
  const shakeStartTime = useRef<number>(0);
  const diceIndex = useRef<number>(0);
  const lastShakeSound = useRef<number>(0);

  // 텍스처/머티리얼 생성
  const materials = useMemo(() => {
    return createDiceMaterials(customization);
  }, [customization]);

  // 차징 시작 시 주사위를 모아서 흔들기 시작
  useEffect(() => {
    if (isCharging && rigidBodyRef.current) {
      shakeStartTime.current = Date.now();
      // 주사위 인덱스 계산 (간단히 id 해시)
      diceIndex.current = dice.id.charCodeAt(0) % 10;
    }
  }, [isCharging, dice.id]);

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

      const baseSpeed = 10 + 8 * powerMultiplier;
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

  // 매 프레임 처리
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // 차징 중일 때 흔들기
    if (isCharging && !dice.isRolling) {
      const now = Date.now();
      const time = now * 0.01;
      const idx = diceIndex.current;

      // 중앙 근처에 모여서 흔들림
      const baseX = (idx % 3 - 1) * 0.4;
      const baseZ = 2.5;
      const baseY = 1.2;

      // 랜덤한 흔들림
      const shakeX = Math.sin(time * 15 + idx * 2) * 0.15;
      const shakeY = Math.cos(time * 18 + idx * 3) * 0.1;
      const shakeZ = Math.sin(time * 12 + idx * 5) * 0.15;

      rb.setTranslation(
        { x: baseX + shakeX, y: baseY + shakeY, z: baseZ + shakeZ },
        true
      );

      // 회전도 흔들림
      const rotX = Math.sin(time * 20 + idx) * 0.3;
      const rotY = Math.cos(time * 25 + idx * 2) * 0.3;
      const rotZ = Math.sin(time * 22 + idx * 3) * 0.3;

      rb.setRotation(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ)),
        true
      );

      // 속도 초기화 (물리 시뮬레이션 방지)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 흔들리는 동안 간헐적으로 부딪히는 소리 (첫 번째 주사위만)
      if (idx === 0 && now - lastShakeSound.current > 80 + Math.random() * 100) {
        playBounceSound(isMuted, 0.3 + Math.random() * 0.3);
        lastShakeSound.current = now;
      }

      return;
    }

    // 맵 밖으로 나간 주사위 감지 및 리셋 (동적 테이블 크기)
    const translation = rb.translation();
    if (Math.abs(translation.x) > tableHalfSize || Math.abs(translation.z) > tableHalfSize || translation.y < -2 || translation.y > 15) {
      // 맵 밖으로 나갔으면 중앙으로 리셋
      rb.setTranslation({ x: 0, y: 1, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // 안정성 체크 (굴리는 중일 때만)
    if (isStable || !dice.isRolling) return;

    const linvel = rb.linvel();
    const angvel = rb.angvel();

    const velocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const angularVelocity = new THREE.Vector3(angvel.x, angvel.y, angvel.z);

    // 다면체 주사위는 더 빠르게 멈춘 것으로 판단 (임계값 완화)
    const isPolyhedral = ['D4', 'D8', 'D10', 'D12', 'D20'].includes(customization.type);
    const velocityThreshold = isPolyhedral ? 0.3 : 0.1;
    const angularThreshold = isPolyhedral ? 0.3 : 0.1;
    const isSlowEnough =
      velocity.length() < velocityThreshold && angularVelocity.length() < angularThreshold;

    if (isSlowEnough) {
      stableFrames.current++;

      // 다면체 주사위는 더 빨리 멈춘 것으로 판단 (프레임 수 대폭 줄임)
      const requiredStableFrames = isPolyhedral ? 8 : 30;

      if (stableFrames.current > requiredStableFrames) {
        const quaternion = new THREE.Quaternion();
        const rot = rb.rotation();
        quaternion.set(rot.x, rot.y, rot.z, rot.w);

        const result = calculateDiceResult(customization.type, quaternion);
        setDiceResult(dice.id, result);
        setIsStable(true);
        playResultSound(isMuted);
      }
    } else {
      stableFrames.current = 0;
    }
  });

  const scale = 0.5;
  const lastBounceTime = useRef(0);

  // 충돌 시 효과음 + 진동
  const handleCollision = () => {
    // 굴리는 중이 아닐 때는 stable 체크, 차징 중일 때는 무시
    if (!isCharging && isStable) return;

    const now = Date.now();
    // 너무 자주 소리/진동이 나지 않도록 50ms 간격 제한
    if (now - lastBounceTime.current > 50) {
      const rb = rigidBodyRef.current;
      if (rb) {
        const linvel = rb.linvel();
        const speed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2);
        // 차징 중일 때는 고정 강도, 굴리는 중일 때는 속도 기반 강도
        const intensity = isCharging
          ? 0.4 + Math.random() * 0.3
          : Math.min(1, speed / 10);
        if (intensity > 0.1) {
          // 소리 (음소거가 아닐 때, 주사위 2개 이상)
          if (!isMuted && diceInPlayCount >= 2) {
            playBounceSound(isMuted, intensity);
          }
          // 진동 (모바일) - 강도에 비례하여 10~30ms
          vibrate(Math.round(10 + intensity * 20));
          lastBounceTime.current = now;
        }
      }
    }
  };

  // 다면체 주사위에 geometry.groups 설정 (materials 배열 작동을 위해 필수)
  useLayoutEffect(() => {
    if (meshRef.current && materials && Array.isArray(materials) && materials.length > 0 && customization.type !== 'D6') {
      const mesh = meshRef.current;
      if (mesh.geometry) {
        const geometry = mesh.geometry;
        const faceCount = materials.length;
        
        if (!geometry.groups || geometry.groups.length === 0) {
          const totalCount = geometry.index 
            ? geometry.index.count 
            : (geometry.attributes.position?.count || 0);
          
          const indicesPerFace = Math.floor(totalCount / faceCount);
          
          geometry.clearGroups();
          for (let i = 0; i < faceCount; i++) {
            const start = i * indicesPerFace;
            const count = i === faceCount - 1 ? totalCount - start : indicesPerFace;
            geometry.addGroup(start, count, i);
          }
          mesh.material = materials;
        }
      }
    }
  }, [meshRef, materials, customization.type]);

  // 모든 주사위 타입에 면별 텍스처 적용
  if (materials && Array.isArray(materials) && materials.length > 0) {
    const renderGeometry = () => {
      switch (customization.type) {
        case 'D4':
          return <tetrahedronGeometry args={[scale * 1.2, 0]} />;
        case 'D6':
          return <boxGeometry args={[scale, scale, scale]} />;
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
      if (customization.type === 'D6') {
        return <CuboidCollider args={[0.25, 0.25, 0.25]} />;
      }
      // D8, D10는 mesh 기반 convex hull collider 사용 (면 접촉을 위해)
      if (customization.type === 'D8' || customization.type === 'D10') {
        return null; // mesh ref로 collider 생성
      }
      return <BallCollider args={[0.35]} />;
    };

    // 다면체 주사위는 매우 높은 damping과 마찰 적용 (빠르게 멈추도록)
    const isPolyhedral = ['D8', 'D10', 'D12', 'D20'].includes(customization.type);
    const isD4 = customization.type === 'D4';
    const isD8OrD10 = customization.type === 'D8' || customization.type === 'D10';
    // D4는 조금 더 굴러가도록 damping과 friction을 약간 낮춤
    // D8, D10은 D6만큼 튕겨지도록 restitution 높게 설정
    const linearDamping = isD4 ? 0.5 : (isPolyhedral ? 0.7 : 0.05);
    const angularDamping = isD4 ? 0.6 : (isPolyhedral ? 0.8 : 0.05);
    const restitution = isD8OrD10 ? 0.7 : (isD4 ? 0.35 : (isPolyhedral ? 0.25 : 0.7)); // D8, D10은 D6와 동일한 반발
    const friction = isD4 ? 0.9 : (isPolyhedral ? 1.2 : 0.3); // D4는 마찰 약간 감소

    return (
      <RigidBody
          ref={rigidBodyRef}
          position={position}
          rotation={rotation}
          restitution={restitution}
          friction={friction}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          colliders={(customization.type === 'D8' || customization.type === 'D10') ? 'hull' : false}
          onCollisionEnter={handleCollision}
          ccd={true}
        >
          {renderCollider()}
          <mesh ref={meshRef} castShadow receiveShadow material={materials}>
            {renderGeometry()}
          </mesh>
        </RigidBody>
    );
  }

  // 텍스처가 없는 경우 (fallback)
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
    if (customization.type === 'D6') {
      return <CuboidCollider args={[0.25, 0.25, 0.25]} />;
    }
    // D4, D10는 mesh 기반 convex hull collider 사용 (면 접촉을 위해)
    if (customization.type === 'D4' || customization.type === 'D10') {
      return null; // mesh ref로 collider 생성
    }
    return <BallCollider args={[0.35]} />;
  };

  // 다면체 주사위는 매우 높은 damping과 마찰 적용 (빠르게 멈추도록)
  const isPolyhedral = ['D8', 'D10', 'D12', 'D20'].includes(customization.type);
  const isD4 = customization.type === 'D4';
  const isD8OrD10 = customization.type === 'D8' || customization.type === 'D10';
  // D4는 조금 더 굴러가도록 damping과 friction을 약간 낮춤
  // D8, D10은 D6만큼 튕겨지도록 restitution 높게 설정
  const linearDamping = isD4 ? 0.5 : (isPolyhedral ? 0.7 : 0.05);
  const angularDamping = isD4 ? 0.6 : (isPolyhedral ? 0.8 : 0.05);
  const restitution = isD8OrD10 ? 0.7 : (isD4 ? 0.35 : (isPolyhedral ? 0.25 : 0.7)); // D8, D10은 D6와 동일한 반발
  const friction = isD4 ? 0.9 : (isPolyhedral ? 1.2 : 0.3); // D4는 마찰 약간 감소

  return (
    <RigidBody
        ref={rigidBodyRef}
        position={position}
        rotation={rotation}
        restitution={restitution}
        friction={friction}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        colliders={(customization.type === 'D4' || customization.type === 'D10') ? 'hull' : false}
        onCollisionEnter={handleCollision}
        ccd={true}
      >
        {renderCollider()}
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
      </RigidBody>
  );
}

export default Dice3D;
