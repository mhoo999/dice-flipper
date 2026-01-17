'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Dice3D } from './Dice3D';
import { DiceTable } from './DiceTable';
import { useDiceStore } from '@/store/diceStore';

function Scene() {
  const diceInPlay = useDiceStore((state) => state.diceInPlay);

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      {/* 환경맵 */}
      <Environment preset="apartment" />

      {/* 물리 시뮬레이션 */}
      <Physics gravity={[0, -20, 0]} timeStep="vary">
        {/* 테이블 */}
        <DiceTable />

        {/* 주사위들 (잠기지 않은 주사위만 표시) */}
        {diceInPlay.filter((dice) => !dice.locked).map((dice) => (
          <Dice3D key={dice.id} dice={dice} />
        ))}
      </Physics>

      {/* 그림자 */}
      <ContactShadows
        position={[0, -0.09, 0]}
        opacity={0.4}
        scale={12}
        blur={2}
        far={10}
      />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

export function DiceScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [0, 8, 10],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <color attach="background" args={['#f3f4f6']} />
        <fog attach="fog" args={['#f3f4f6', 20, 40]} />
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DiceScene;
