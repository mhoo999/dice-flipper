'use client';

import { RigidBody, CuboidCollider } from '@react-three/rapier';

interface DiceTableProps {
  size?: number;
  height?: number;
}

export function DiceTable({
  size = 10, // 테이블 크기 증가 (8 -> 10) - 주사위가 많을 때 맵 밖으로 나가는 것 방지
  height = 0.2,
}: DiceTableProps) {
  const wallHeight = 12;
  const wallThickness = 0.3;
  const coinFloorHeight = 2; // 코인 전용 바닥 높이
  const coinFloorThickness = 0.05; // 코인 바닥 두께

  return (
    <group>
      {/* 테이블 바닥 (주사위용) */}
      <RigidBody type="fixed" friction={0.6} restitution={0.4}>
        <CuboidCollider args={[size / 2, height / 2, size / 2]} position={[0, -height / 2, 0]} />
        <mesh receiveShadow position={[0, -height / 2, 0]}>
          <boxGeometry args={[size, height, size]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* 투명 벽 - 전면 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.5}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, size / 2 + wallThickness / 2]}
        />
      </RigidBody>

      {/* 투명 벽 - 후면 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.5}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, -size / 2 - wallThickness / 2]}
        />
      </RigidBody>

      {/* 투명 벽 - 좌측 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.5}>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, size / 2 + wallThickness]}
          position={[-size / 2 - wallThickness / 2, wallHeight / 2, 0]}
        />
      </RigidBody>

      {/* 투명 벽 - 우측 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.5}>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, size / 2 + wallThickness]}
          position={[size / 2 + wallThickness / 2, wallHeight / 2, 0]}
        />
      </RigidBody>

      {/* 투명 지붕 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.9}>
        <CuboidCollider
          args={[size / 2 + wallThickness, wallThickness / 2, size / 2 + wallThickness]}
          position={[0, wallHeight, 0]}
        />
      </RigidBody>

      {/* 테이블 패드 (표면) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[size - 0.5, size - 0.5]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* 코인 전용 바닥 (투명) */}
      <RigidBody type="fixed" friction={0.6} restitution={0.4}>
        <CuboidCollider
          args={[size / 2, coinFloorThickness / 2, size / 2]}
          position={[0, coinFloorHeight, 0]}
        />
      </RigidBody>
    </group>
  );
}

export default DiceTable;
