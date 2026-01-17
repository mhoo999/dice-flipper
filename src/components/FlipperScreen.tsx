'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiceStore } from '@/store/diceStore';
import { playThrowSound, playClickSound } from '@/lib/sound';

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
  const isMuted = useDiceStore((state) => state.isMuted);
  const toggleMute = useDiceStore((state) => state.toggleMute);
  const setIsCharging = useDiceStore((state) => state.setIsCharging);
  const toggleDiceEnabled = useDiceStore((state) => state.toggleDiceEnabled);
  const toggleDiceLocked = useDiceStore((state) => state.toggleDiceLocked);
  const toggleAllDiceEnabled = useDiceStore((state) => state.toggleAllDiceEnabled);

  // 파워 게이지 상태
  const [power, setPower] = useState(0);
  const [isChargingLocal, setIsChargingLocal] = useState(false);
  const chargeInterval = useRef<NodeJS.Timeout | null>(null);

  // 차징 시작
  const startCharging = useCallback(() => {
    if (isRolling) return;
    setIsChargingLocal(true);
    setIsCharging(true);
    setPower(0);

    chargeInterval.current = setInterval(() => {
      setPower((prev) => {
        if (prev >= 100) return 100;
        return prev + 2; // 50프레임 = 약 1.6초에 100%
      });
    }, 32);
  }, [isRolling, setIsCharging]);

  // 차징 종료 및 던지기
  const stopChargingAndRoll = useCallback(() => {
    if (!isChargingLocal) return;
    setIsChargingLocal(false);
    setIsCharging(false);

    if (chargeInterval.current) {
      clearInterval(chargeInterval.current);
      chargeInterval.current = null;
    }

    // 현재 파워로 던지기 (최소 10%)
    const finalPower = Math.max(10, power);
    playThrowSound(isMuted);
    rollAllDice(finalPower);
    setPower(0);
  }, [isChargingLocal, power, rollAllDice, isMuted, setIsCharging]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (chargeInterval.current) {
        clearInterval(chargeInterval.current);
      }
    };
  }, []);

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
  
  // 활성화된 주사위가 있는지 확인
  const hasEnabledDice = diceInPlay.some((d) => d.enabled && !d.locked);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gray-50">
      {/* 상단 헤더 - 고정 */}
      <header className="flex-shrink-0 p-3 sm:p-4 bg-white border-b border-black">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <span className="text-lg sm:text-xl">&larr;</span>
            <span className="text-sm sm:text-base">주사위 선택</span>
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-black">Dice Flipper</h1>

          {/* 음소거 버튼 */}
          <button
            onClick={() => {
              playClickSound(isMuted);
              toggleMute();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-black hover:bg-gray-100 transition-colors"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 캔버스 영역 - 남은 공간 채움 */}
      <main className="flex-1 relative overflow-hidden">
        {/* 3D 씬 */}
        <DiceScene />

        {/* 결과 표시 패널 */}
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-4 bg-white border border-black px-3 sm:px-6 py-2 sm:py-4">
            {/* 전체 온/오프 버튼 */}
            <button
              onClick={() => {
                playClickSound(isMuted);
                toggleAllDiceEnabled();
              }}
              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium bg-white text-black border border-black hover:bg-gray-100 transition-colors whitespace-nowrap"
              title="모든 주사위 활성화/비활성화"
            >
              전체 {diceInPlay.every((d) => d.enabled) ? 'OFF' : 'ON'}
            </button>
            <div className="w-px h-6 sm:h-8 bg-gray-300" />
            {diceInPlay.map((dice) => {
              const resultImage = dice.result && dice.customization.faceImages?.[dice.result];
              const resultText = dice.result && dice.customization.faceTexts?.[dice.result];
              const isDisabled = !dice.enabled || dice.locked;

              const handleDiceClick = () => {
                playClickSound(isMuted);
                if (dice.result !== null) {
                  toggleDiceLocked(dice.id);
                } else {
                  toggleDiceEnabled(dice.id);
                }
              };

              return (
                <div
                  key={dice.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={handleDiceClick}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold mb-1 border border-black overflow-hidden transition-opacity ${
                      isDisabled ? 'opacity-30 bg-gray-100' : 'bg-gray-50'
                    }`}
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
                  <span className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dice.customization.type}
                  </span>
                </div>
              );
            })}

            {numericDice.length > 1 && (
              <>
                <div className="w-px h-10 sm:h-12 bg-gray-300" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-10 sm:w-14 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold bg-black text-white">
                    {isRolling ? '?' : totalResult || '-'}
                  </div>
                  <span className="text-xs text-gray-600">합계</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 안내 텍스트 */}
        {!allDiceHaveResults && !isRolling && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-gray-400 text-base sm:text-lg">버튼을 눌러 주사위를 굴리세요</p>
            <p className="text-gray-300 text-xs sm:text-sm mt-2">마우스로 카메라를 돌릴 수 있습니다</p>
          </div>
        )}

        {/* FAB - 개발자 커피 한잔 사주기 */}
        <a
          href="https://hoons-service-archive.vercel.app/#coffee"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-3 py-2 sm:px-4 sm:py-3 bg-white text-black font-medium border border-black hover:bg-gray-100 transition-colors text-xs sm:text-sm shadow-md"
        >
          개발자 커피 한잔 사주기
        </a>
      </main>

      {/* 하단 컨트롤 - 고정 */}
      <footer className="flex-shrink-0 p-4 sm:p-6 bg-white border-t border-black">
        <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
          {/* 굴리기 버튼 (파워 게이지) */}
          <button
            onMouseDown={startCharging}
            onMouseUp={stopChargingAndRoll}
            onMouseLeave={stopChargingAndRoll}
            onTouchStart={startCharging}
            onTouchEnd={stopChargingAndRoll}
            disabled={isRolling || !hasEnabledDice}
            className={`relative w-full py-4 sm:py-5 font-bold text-xl sm:text-2xl border overflow-hidden transition-colors ${
              isRolling || !hasEnabledDice
                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-black text-white border-black'
            }`}
          >
            {/* 파워 게이지 (가운데서 양쪽으로 채워짐) */}
            {isChargingLocal && (
              <div
                className="absolute inset-0 bg-white/30 transition-all"
                style={{
                  left: `${50 - power / 2}%`,
                  right: `${50 - power / 2}%`,
                }}
              />
            )}
            <span className="relative z-10">
              {isRolling ? '굴리는 중...' : isChargingLocal ? `${power}%` : '꾹 눌러서 굴리기'}
            </span>
          </button>

          {/* 결과 메시지 */}
          {allDiceHaveResults && !isRolling && numericDice.length > 0 && (
            <div className="text-center text-black animate-fade-in">
              <p>
                숫자 합계: <span className="text-xl sm:text-2xl font-bold">{totalResult}</span>
                {numericDice.length > 1 && (
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">
                    ({numericDice.map((d) => d.result).join(' + ')})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default FlipperScreen;
