'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiceStore } from '@/store/diceStore';

const DiceScene = dynamic(() => import('./dice/DiceScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-black text-xl">3D 엔진 로딩 중...</div>
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

  // 숫자 주사위만 합계 계산 (이미지/텍스트 커스텀이 없는 주사위)
  const numericDice = diceInPlay.filter((d) => {
    if (!d.result) return false;
    const hasImage = d.customization.faceImages?.[d.result];
    const hasText = d.customization.faceTexts?.[d.result];
    return !hasImage && !hasText;
  });
  const totalResult = numericDice.reduce((sum, d) => sum + (d.result || 0), 0);
  const allDiceHaveResults = diceInPlay.length > 0 && diceInPlay.every((d) => d.result !== null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* 3D 씬 */}
      <DiceScene />

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-white border-b border-black">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <span className="text-xl">&larr;</span>
            <span>주사위 선택</span>
          </button>

          <h1 className="text-xl font-bold text-black">Dice Flipper</h1>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* 결과 표시 패널 */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4 bg-white border border-black px-6 py-4">
          {diceInPlay.map((dice) => {
            const resultImage = dice.result && dice.customization.faceImages?.[dice.result];
            const resultText = dice.result && dice.customization.faceTexts?.[dice.result];
            return (
              <div key={dice.id} className="flex flex-col items-center">
                <div
                  className="w-12 h-12 flex items-center justify-center text-lg font-bold mb-1 bg-gray-50 border border-black overflow-hidden"
                  style={
                    !dice.isRolling && resultImage
                      ? {
                          backgroundImage: `url(${resultImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {}
                  }
                >
                  {dice.isRolling ? (
                    <span className="animate-spin">?</span>
                  ) : resultImage ? null : (
                    <span className={resultText && resultText.length > 2 ? 'text-xs' : ''}>
                      {resultText || dice.result || '-'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{dice.customization.type}</span>
              </div>
            );
          })}

          {numericDice.length > 1 && (
            <>
              <div className="w-px h-12 bg-gray-300" />
              <div className="flex flex-col items-center">
                <div className="w-14 h-12 flex items-center justify-center text-xl font-bold bg-black text-white">
                  {isRolling ? '?' : totalResult || '-'}
                </div>
                <span className="text-xs text-gray-600">합계</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-black">
        <div className="max-w-md mx-auto space-y-4">
          {/* 굴리기 버튼 */}
          <button
            onClick={rollAllDice}
            disabled={isRolling}
            className={`w-full py-5 font-bold text-2xl border transition-colors ${
              isRolling
                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-black text-white border-black hover:bg-gray-800'
            }`}
          >
            {isRolling ? '굴리는 중...' : '주사위 굴리기'}
          </button>

          {/* 결과 메시지 */}
          {allDiceHaveResults && !isRolling && numericDice.length > 0 && (
            <div className="text-center text-black animate-fade-in">
              {numericDice.length === 1 ? (
                <p>결과: <span className="text-2xl font-bold">{totalResult}</span></p>
              ) : (
                <p>
                  총합: <span className="text-2xl font-bold">{totalResult}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({numericDice.map((d) => d.result).join(' + ')})
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
          <p className="text-gray-400 text-lg">버튼을 눌러 주사위를 굴리세요</p>
          <p className="text-gray-300 text-sm mt-2">마우스로 카메라를 돌릴 수 있습니다</p>
        </div>
      )}

      {/* FAB - 개발자 커피 한잔 사주기 */}
      <a
        href="https://buymeacoffee.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-24 left-6 px-4 py-3 bg-white text-black font-medium border border-black hover:bg-gray-100 transition-colors text-sm"
      >
        개발자 커피 한잔 사주기
      </a>
    </div>
  );
}

export default FlipperScreen;
