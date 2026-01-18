'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useDiceStore } from '@/store/diceStore';
import { playResultSound, playCoinSound, playCoinSpinSound, vibrate } from '@/lib/sound';

export function Coin3D() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isStable, setIsStable] = useState(false);
  const stableFrames = useRef(0);
  const lastBounceTime = useRef(0);

  const coin = useDiceStore((state) => state.coin);
  const setCoinResult = useDiceStore((state) => state.setCoinResult);
  const isMuted = useDiceStore((state) => state.isMuted);

  const { isFlipping, isCharging, chargingPower, position, rotation, power } = coin;
  const wobbleTime = useRef(0);
  const lastSpinSoundTime = useRef(0);

  // 차징 중일 때 제자리에서 진동
  useEffect(() => {
    if (isCharging && rigidBodyRef.current) {
      const rb = rigidBodyRef.current;
      // 고정 위치에 배치
      rb.setTranslation({ x: 0, y: 2.15, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      wobbleTime.current = 0;
    }
  }, [isCharging]);

  // 코인 플립 시작
  useEffect(() => {
    if (isFlipping && rigidBodyRef.current) {
      const rb = rigidBodyRef.current;

      // 초기 위치 설정
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

      // 파워에 따라 수직으로 위로 던지기
      const powerMultiplier = power / 100;
      const force = {
        x: 0,
        y: 5 + powerMultiplier * 15,
        z: 0,
      };

      const torque = {
        x: 30 + powerMultiplier * 50,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 20,
      };

      rb.setLinvel(force, true);
      rb.setAngvel(torque, true);

      setIsStable(false);
      stableFrames.current = 0;

      // 사운드
      if (!isMuted) {
        playCoinSound(isMuted);
      }
      vibrate(30);
    }
  }, [isFlipping, position, rotation, isMuted, power]);

  // 매 프레임 처리
  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // 차징 중: 비행기처럼 흔들리기 (파워가 높을수록 강한 진동)
    if (isCharging) {
      wobbleTime.current += delta * 20; // 진동 속도

      // 파워에 따라 진동 강도 증가 (0~100 → 0.02~0.15)
      const intensity = 0.02 + (chargingPower / 100) * 0.13;
      // 파워에 따라 진동 빈도도 증가
      const frequency = 1 + (chargingPower / 100) * 2;

      // 불규칙한 흔들림 (여러 사인파 조합)
      const wobbleX = Math.sin(wobbleTime.current * frequency) * intensity;
      const wobbleZ = Math.cos(wobbleTime.current * frequency * 1.3) * intensity * 0.7;
      const wobbleY = Math.sin(wobbleTime.current * frequency * 2.1) * intensity * 0.3;

      // 위치 흔들림
      rb.setTranslation({
        x: wobbleX * 0.5,
        y: 2.15 + Math.abs(wobbleY) * 0.2,
        z: wobbleZ * 0.5
      }, true);

      // 회전 흔들림 (기울어지는 느낌)
      rb.setRotation(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(wobbleZ * 2, 0, wobbleX * 2)
        ),
        true
      );

      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 스핀 소리 (파워에 따라 빈도 증가: 200ms → 80ms)
      const now = Date.now();
      const soundInterval = 200 - (chargingPower / 100) * 120;
      if (now - lastSpinSoundTime.current > soundInterval) {
        if (!isMuted) {
          playCoinSpinSound(isMuted);
        }
        lastSpinSoundTime.current = now;
      }

      return;
    }

    if (!isFlipping) return;

    if (isStable) return;

    const linvel = rb.linvel();
    const angvel = rb.angvel();

    const velocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const angularVelocity = new THREE.Vector3(angvel.x, angvel.y, angvel.z);

    const isSlowEnough = velocity.length() < 0.1 && angularVelocity.length() < 0.1;

    if (isSlowEnough) {
      stableFrames.current++;

      if (stableFrames.current > 30) {
        // 결과 계산 - 코인의 위쪽 면 확인
        const quaternion = new THREE.Quaternion();
        const rot = rb.rotation();
        quaternion.set(rot.x, rot.y, rot.z, rot.w);

        // 위쪽 방향 벡터
        const upVector = new THREE.Vector3(0, 1, 0);
        upVector.applyQuaternion(quaternion);

        // Y 성분이 양수면 앞면, 음수면 뒷면
        const result = upVector.y > 0 ? 'heads' : 'tails';

        setCoinResult(result);
        setIsStable(true);
        if (!isMuted) {
          playResultSound(isMuted);
        }
        vibrate(50);
      }
    } else {
      stableFrames.current = 0;
    }
  });

  // 충돌 효과
  const handleCollision = () => {
    if (isStable) return;

    const now = Date.now();
    if (now - lastBounceTime.current > 80) {
      if (!isMuted) {
        playCoinSound(isMuted);
      }
      vibrate(15);
      lastBounceTime.current = now;
    }
  };

  const coinRadius = 0.4;
  const coinThickness = 0.06;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 2.1, 0]}
      restitution={0.3}
      friction={0.8}
      linearDamping={0.1}
      angularDamping={0.1}
      mass={2}
      onCollisionEnter={handleCollision}
      ccd={true}
    >
      <CylinderCollider args={[coinThickness / 2, coinRadius]} />
      <group ref={groupRef}>
        {/* 코인 본체 - 옆면 */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[coinRadius, coinRadius, coinThickness, 32]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* 앞면 (위) */}
        <mesh position={[0, coinThickness / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[coinRadius, 32]} />
          <meshStandardMaterial
            color="#c5a028"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {/* 뒷면 (아래) */}
        <mesh position={[0, -coinThickness / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[coinRadius, 32]} />
          <meshStandardMaterial
            color="#b8962a"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

export default Coin3D;
