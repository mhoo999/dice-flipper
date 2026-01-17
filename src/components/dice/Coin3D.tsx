'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useDiceStore } from '@/store/diceStore';
import { playResultSound, playCoinSound, vibrate } from '@/lib/sound';

export function Coin3D() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isStable, setIsStable] = useState(false);
  const stableFrames = useRef(0);
  const lastBounceTime = useRef(0);

  const coin = useDiceStore((state) => state.coin);
  const setCoinResult = useDiceStore((state) => state.setCoinResult);
  const isMuted = useDiceStore((state) => state.isMuted);

  const { isFlipping, position, rotation } = coin;

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

      // 위로 던지면서 스핀
      const force = {
        x: (Math.random() - 0.5) * 3,
        y: 8 + Math.random() * 4,
        z: (Math.random() - 0.5) * 3,
      };

      const torque = {
        x: (Math.random() - 0.5) * 50 + 30,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 50,
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
  }, [isFlipping, position, rotation, isMuted]);

  // 매 프레임 처리
  useFrame(() => {
    if (!rigidBodyRef.current || !isFlipping) return;

    const rb = rigidBodyRef.current;

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
  const coinThickness = 0.05;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[2.5, 0.5, 0]}
      restitution={0.5}
      friction={0.8}
      linearDamping={0.3}
      angularDamping={0.3}
      onCollisionEnter={handleCollision}
      ccd={true}
    >
      <CylinderCollider args={[coinThickness / 2, coinRadius]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh ref={meshRef} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[coinRadius, coinRadius, coinThickness, 32]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.8}
          roughness={0.2}
          emissive="#8b7500"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* 앞면 - 자유의 여신상 패턴 */}
      <mesh position={[0, coinThickness / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[coinRadius * 0.85, 32]} />
        <meshStandardMaterial
          color="#c5a028"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      {/* 뒷면 - 독수리 패턴 */}
      <mesh position={[0, -coinThickness / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[coinRadius * 0.85, 32]} />
        <meshStandardMaterial
          color="#b8962a"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
    </RigidBody>
  );
}

export default Coin3D;
