'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiceStore } from '@/store/diceStore';

const DiceScene = dynamic(() => import('./dice/DiceScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-white text-xl animate-pulse">3D 엔진 로딩 중...</div>
    </div>
  ),
});

export function FlipperScreen() {
  const router = useRouter();

  const selectedDice = useDiceStore((state) => state.selectedDice);
  const diceInPlay = useDiceStore((state) => state.diceInPlay);
  const isRolling = useDiceStore((state) => state.isRolling);
  const initializePlay = useDiceStore((state) => state.initializePlay);
  const rollAllDice = useDiceStore((state) => state.rollAllDice);

  // 플레이 초기화
  useEffect(() => {
    if (selectedDice.length === 0) {
      router.push('/');
      return;
    }
    initializePlay();
  }, [selectedDice, initializePlay, router]);

  const totalResult = diceInPlay.reduce((sum, d) => sum + (d.result || 0), 0);
  const allDiceHaveResults = diceInPlay.length > 0 && diceInPlay.every((d) => d.result !== null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 3D 씬 */}
      <DiceScene />

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <span className="text-2xl">←</span>
            <span>주사위 선택</span>
          </button>

          <h1 className="text-2xl font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
              Dice Flipper
            </span>
          </h1>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* 결과 표시 패널 */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4">
          {diceInPlay.map((dice) => (
            <div key={dice.id} className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold mb-1"
                style={{
                  backgroundColor: dice.customization.color,
                  color: dice.customization.numberColor,
                  opacity: dice.customization.opacity,
                }}
              >
                {dice.isRolling ? (
                  <span className="animate-spin">?</span>
                ) : (
                  dice.result || '-'
                )}
              </div>
              <span className="text-xs text-gray-400">{dice.customization.type}</span>
            </div>
          ))}

          {diceInPlay.length > 1 && (
            <>
              <div className="w-px h-12 bg-white/20" />
              <div className="flex flex-col items-center">
                <div className="w-14 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  {isRolling ? '?' : totalResult || '-'}
                </div>
                <span className="text-xs text-gray-400">합계</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-md mx-auto space-y-4">
          {/* 굴리기 버튼 */}
          <button
            onClick={rollAllDice}
            disabled={isRolling}
            className={`w-full py-5 rounded-2xl font-bold text-2xl transition-all transform ${
              isRolling
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isRolling ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-bounce">🎲</span>
                굴리는 중...
                <span className="animate-bounce delay-100">🎲</span>
              </span>
            ) : (
              '🎲 주사위 굴리기!'
            )}
          </button>

          {/* 결과 메시지 */}
          {allDiceHaveResults && !isRolling && (
            <div className="text-center text-white/80 animate-fade-in">
              {diceInPlay.length === 1 ? (
                <p>결과: <span className="text-2xl font-bold text-yellow-400">{totalResult}</span></p>
              ) : (
                <p>
                  총합: <span className="text-2xl font-bold text-yellow-400">{totalResult}</span>
                  <span className="text-sm text-gray-400 ml-2">
                    ({diceInPlay.map((d) => d.result).join(' + ')})
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 안내 텍스트 */}
      {!allDiceHaveResults && !isRolling && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-white/30 text-lg">버튼을 눌러 주사위를 굴리세요</p>
          <p className="text-white/20 text-sm mt-2">마우스로 카메라를 돌릴 수 있습니다</p>
        </div>
      )}
    </div>
  );
}

export default FlipperScreen;
