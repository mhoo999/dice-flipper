'use client';

import dynamic from 'next/dynamic';
import { ControlPanel } from './ui/ControlPanel';

// Dynamic import for Three.js components (SSR 비활성화)
const DiceScene = dynamic(() => import('./dice/DiceScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-white text-xl animate-pulse">3D 엔진 로딩 중...</div>
    </div>
  ),
});

export function DiceApp() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 3D 씬 */}
      <DiceScene />

      {/* 컨트롤 패널 */}
      <ControlPanel />

      {/* 헤더 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
            Dice Flipper
          </span>
        </h1>
        <div className="text-sm text-gray-400">
          보드게임 주사위 시뮬레이터
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="absolute top-16 left-0 right-0 text-center pointer-events-none">
        <p className="text-gray-500 text-sm">
          주사위를 클릭해서 선택하고 커스터마이징하세요
        </p>
      </div>
    </div>
  );
}

export default DiceApp;
