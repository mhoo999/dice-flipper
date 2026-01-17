'use client';

import { RigidBody, CuboidCollider } from '@react-three/rapier';

interface DiceTableProps {
  size?: number;
  height?: number;
}

export function DiceTable({
  size = 8,
  height = 0.2,
}: DiceTableProps) {
  const wallHeight = 3;
  const wallThickness = 0.3;

  return (
    <group>
      {/* 테이블 바닥 */}
      <RigidBody type="fixed" friction={0.6} restitution={0.4}>
        <CuboidCollider args={[size / 2, height / 2, size / 2]} position={[0, -height / 2, 0]} />
        <mesh receiveShadow position={[0, -height / 2, 0]}>
          <boxGeometry args={[size, height, size]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* 투명 벽 - 전면 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.8}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, size / 2 + wallThickness / 2]}
        />
      </RigidBody>

      {/* 투명 벽 - 후면 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.8}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, -size / 2 - wallThickness / 2]}
        />
      </RigidBody>

      {/* 투명 벽 - 좌측 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.8}>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, size / 2 + wallThickness]}
          position={[-size / 2 - wallThickness / 2, wallHeight / 2, 0]}
        />
      </RigidBody>

      {/* 투명 벽 - 우측 */}
      <RigidBody type="fixed" friction={0.2} restitution={0.8}>
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
    </group>
  );
}

export default DiceTable;
