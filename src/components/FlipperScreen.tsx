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
  const coin = useDiceStore((state) => state.coin);
  const flipCoin = useDiceStore((state) => state.flipCoin);
  const setCoinCharging = useDiceStore((state) => state.setCoinCharging);

  // 파워 게이지 상태 (주사위)
  const [power, setPower] = useState(0);
  const [isChargingLocal, setIsChargingLocal] = useState(false);
  const chargeInterval = useRef<NodeJS.Timeout | null>(null);

  // 파워 게이지 상태 (코인)
  const [coinPower, setCoinPower] = useState(0);
  const [isCoinCharging, setIsCoinCharging] = useState(false);
  const coinChargeInterval = useRef<NodeJS.Timeout | null>(null);

  // 결과 패널 펼치기/접기
  const [isResultExpanded, setIsResultExpanded] = useState(false);

  // 화면 크기 감지
  const [windowWidth, setWindowWidth] = useState(0);

  // 캔버스 높이 측정을 위한 ref와 state
  const canvasRef = useRef<HTMLElement>(null);
  const [canvasHeight, setCanvasHeight] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      setWindowWidth(window.innerWidth);
      if (canvasRef.current) {
        setCanvasHeight(canvasRef.current.clientHeight);
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

  // 코인 차징 시작
  const startCoinCharging = useCallback(() => {
    // 버튼이 이미 disabled={coin.isFlipping}으로 비활성화됨
    setIsCoinCharging(true);
    setCoinPower(0);
    setCoinCharging(true, 0); // 스토어에 차징 상태 전달 (3D 코인 진동용)

    coinChargeInterval.current = setInterval(() => {
      setCoinPower((prev) => {
        const newPower = prev >= 100 ? 100 : prev + 2;
        setCoinCharging(true, newPower); // 파워도 함께 전달
        return newPower;
      });
    }, 32);
  }, [setCoinCharging]);

  // 코인 차징 종료 및 던지기
  const stopCoinChargingAndFlip = useCallback(() => {
    if (!isCoinCharging) return;
    setIsCoinCharging(false);
    setCoinCharging(false, 0); // 차징 종료

    if (coinChargeInterval.current) {
      clearInterval(coinChargeInterval.current);
      coinChargeInterval.current = null;
    }

    // 현재 파워로 던지기 (최소 10%)
    const finalPower = Math.max(10, coinPower);
    flipCoin(finalPower);
    setCoinPower(0);
  }, [isCoinCharging, coinPower, flipCoin, setCoinCharging]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (chargeInterval.current) {
        clearInterval(chargeInterval.current);
      }
      if (coinChargeInterval.current) {
        clearInterval(coinChargeInterval.current);
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
  
  // 총 표시 항목 수 (합계 박스 1개 + 주사위 개수)
  const totalItems = 1 + diceInPlay.length;
  const currentGridColumns = 5; // 항상 5컬럼
  // 한 줄에 모든 항목이 표시되면 펼침 버튼 숨김
  const shouldShowExpandButton = totalItems > currentGridColumns;

  return (
    <div
      className="flex flex-col w-screen overflow-hidden bg-gray-50"
      style={{ height: 'calc(100dvh - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* 상단 헤더 - 고정 */}
      <header
        className="flex-shrink-0 p-3 sm:p-4 bg-white border-b border-black"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="relative flex items-center justify-center max-w-4xl mx-auto">
          {/* 뒤로가기 버튼 - 왼쪽 */}
          <button
            onClick={() => router.push('/')}
            className="absolute left-0 p-2 text-gray-600 hover:text-black transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* 로고 - 가운데 */}
          <h1 className="text-lg sm:text-xl font-bold text-black">Dice Flipper</h1>

          {/* 음소거 버튼 - 오른쪽 */}
          <button
            onClick={() => {
              playClickSound(isMuted);
              toggleMute();
            }}
            className="absolute right-0 p-2 text-gray-600 hover:text-black transition-colors"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 캔버스 영역 - 남은 공간 채움 */}
      <main ref={canvasRef} className="flex-1 relative overflow-hidden">
        {/* 3D 씬 */}
        <DiceScene />

        {/* 결과 표시 패널 */}
        <div className="absolute top-2 sm:top-4 lg:top-6 left-2 right-2 sm:left-4 sm:right-4 lg:left-6 lg:right-6">
          <div className="relative flex items-center justify-start max-w-4xl">
            <div className="relative bg-white border border-black shadow-lg w-auto">
            {/* 주사위 그리드 */}
            <div className={`overflow-hidden transition-all ${isResultExpanded ? 'max-h-[400px]' : 'max-h-[88px] lg:max-h-[92px]'}`}>
              <div className="grid grid-cols-5 gap-2 p-3">
                {/* 합계 박스 - 첫 번째 위치 */}
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 flex items-center justify-center text-base font-bold bg-black text-white">
                    {isRolling ? '?' : (numericDice.length > 0 ? totalResult : '-')}
                  </div>
                  <span className="text-[10px] text-gray-600">합계</span>
                </div>

                {/* 주사위들 */}
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
                        className={`w-11 h-11 flex items-center justify-center text-sm font-bold border border-black overflow-hidden transition-opacity ${
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
                          <span className={resultText && resultText.length > 2 ? 'text-[10px]' : ''}>
                            {resultText || dice.result || '-'}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                        {dice.customization.type}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>
          </div>

          {/* 펼침 토글 - 컨테이너 아래 우측 */}
          {shouldShowExpandButton && (
            <div className="relative flex items-center justify-start max-w-4xl">
              <div className="flex justify-end mr-2 -mt-[1px]">
                <button
                  onClick={() => setIsResultExpanded(!isResultExpanded)}
                  className="px-3 py-1 bg-white border border-t-0 border-black hover:bg-gray-50 transition-colors text-xs flex items-center gap-1 relative z-10"
                >
                  <span>{isResultExpanded ? '접기' : '펼침'}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isResultExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 안내 텍스트 */}
        {!allDiceHaveResults && !isRolling && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-gray-400 text-base sm:text-lg">버튼을 눌러 주사위를 굴리세요</p>
            <p className="text-gray-300 text-xs sm:text-sm mt-2">마우스로 카메라를 돌릴 수 있습니다</p>
          </div>
        )}

        {/* 하단 FAB 영역 */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-none">
          <div className="relative flex items-center justify-center max-w-4xl mx-auto">
            <div className="w-full flex justify-between items-end pointer-events-none">
          {/* 왼쪽: 개발자 커피 */}
          <a
            href="https://hoons-service-archive.vercel.app/#coffee"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-3 py-2 sm:px-4 sm:py-3 bg-white text-black font-medium border border-black hover:bg-gray-100 transition-colors text-xs sm:text-sm shadow-md"
          >
            개발자 커피 한잔 사주기
          </a>

          {/* 오른쪽: 코인 토스 + 전체 활성화/비활성화 */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            {/* 코인 토스 버튼 (원형) */}
            <button
              onMouseDown={startCoinCharging}
              onMouseUp={stopCoinChargingAndFlip}
              onMouseLeave={stopCoinChargingAndFlip}
              onTouchStart={startCoinCharging}
              onTouchEnd={stopCoinChargingAndFlip}
              disabled={coin.isFlipping}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full font-bold border-2 border-yellow-600 shadow-lg bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 overflow-hidden select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            >
              {/* 파워 게이지 (원형 채우기) */}
              {isCoinCharging && (
                <div
                  className="absolute inset-0 bg-yellow-200 rounded-full"
                  style={{
                    clipPath: `inset(${100 - coinPower}% 0 0 0)`,
                  }}
                />
              )}
              <span className="relative z-10 text-xs sm:text-sm leading-tight">
                {coin.isFlipping ? '...' : isCoinCharging ? `${coinPower}%` : (coin.result === 'heads' ? '앞면' : coin.result === 'tails' ? '뒷면' : '코인')}
              </span>
            </button>

            {/* 전체 활성화/비활성화 */}
            <button
              onClick={() => {
                playClickSound(isMuted);
                toggleAllDiceEnabled();
              }}
              className={`px-3 py-2 sm:px-4 sm:py-3 font-medium border border-black transition-colors text-xs sm:text-sm shadow-md ${
                diceInPlay.every((d) => d.enabled)
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {diceInPlay.every((d) => d.enabled) ? '전체 비활성화' : '전체 활성화'}
            </button>
          </div>
            </div>
          </div>
        </div>
      </main>

      {/* 하단 컨트롤 - 고정 */}
      <footer
        className="flex-shrink-0 p-4 sm:p-6 bg-white border-t border-black"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
          {/* 굴리기 버튼 (파워 게이지) */}
          <button
            onMouseDown={startCharging}
            onMouseUp={stopChargingAndRoll}
            onMouseLeave={stopChargingAndRoll}
            onTouchStart={startCharging}
            onTouchEnd={stopChargingAndRoll}
            disabled={isRolling || !hasEnabledDice}
            className={`relative w-full py-4 sm:py-5 font-bold text-xl sm:text-2xl border overflow-hidden transition-colors select-none ${
              isRolling || !hasEnabledDice
                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-black text-white border-black'
            }`}
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
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
        </div>
      </footer>
    </div>
  );
}

export default FlipperScreen;
