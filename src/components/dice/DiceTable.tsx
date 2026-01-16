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
  const wallHeight = 1;
  const wallThickness = 0.2;

  return (
    <group>
      {/* 테이블 바닥 */}
      <RigidBody type="fixed" friction={1} restitution={0.2}>
        <CuboidCollider args={[size / 2, height / 2, size / 2]} position={[0, -height / 2, 0]} />
        <mesh receiveShadow position={[0, -height / 2, 0]}>
          <boxGeometry args={[size, height, size]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* 벽 - 전면 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.5}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, size / 2 + wallThickness / 2]}
        />
        <mesh position={[0, wallHeight / 2, size / 2 + wallThickness / 2]} castShadow>
          <boxGeometry args={[size, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 벽 - 후면 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.5}>
        <CuboidCollider
          args={[size / 2, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, -size / 2 - wallThickness / 2]}
        />
        <mesh position={[0, wallHeight / 2, -size / 2 - wallThickness / 2]} castShadow>
          <boxGeometry args={[size, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 벽 - 좌측 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.5}>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, size / 2 + wallThickness]}
          position={[-size / 2 - wallThickness / 2, wallHeight / 2, 0]}
        />
        <mesh position={[-size / 2 - wallThickness / 2, wallHeight / 2, 0]} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, size + wallThickness * 2]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 벽 - 우측 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.5}>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, size / 2 + wallThickness]}
          position={[size / 2 + wallThickness / 2, wallHeight / 2, 0]}
        />
        <mesh position={[size / 2 + wallThickness / 2, wallHeight / 2, 0]} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, size + wallThickness * 2]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
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
