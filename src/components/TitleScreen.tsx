'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiceStore } from '@/store/diceStore';
import { DiceType, DICE_CONFIGS } from '@/types/dice';

const DiceShowcaseScene = dynamic(
  () => import('./dice/DiceShowcase').then((mod) => mod.DiceShowcaseScene),
  { ssr: false }
);

const DICE_TYPES: DiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

export function TitleScreen() {
  const router = useRouter();

  const previewDice = useDiceStore((state) => state.previewDice);
  const selectedDice = useDiceStore((state) => state.selectedDice);
  const setPreviewDice = useDiceStore((state) => state.setPreviewDice);
  const addToTray = useDiceStore((state) => state.addToTray);
  const removeFromTray = useDiceStore((state) => state.removeFromTray);
  const clearTray = useDiceStore((state) => state.clearTray);
  const setFaceImage = useDiceStore((state) => state.setFaceImage);
  const clearFaceImages = useDiceStore((state) => state.clearFaceImages);

  // 초기 주사위 설정
  useEffect(() => {
    if (!previewDice) {
      setPreviewDice('D6');
    }
  }, [previewDice, setPreviewDice]);

  const handleStartPlay = () => {
    if (selectedDice.length === 0) {
      alert('주사위를 최소 1개 이상 선택해주세요!');
      return;
    }
    router.push('/play');
  };

  // 이미지 업로드 처리
  const handleImageUpload = (faceNumber: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setFaceImage(faceNumber, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const faceImages = previewDice?.faceImages || {};
  const faceCount = previewDice ? DICE_CONFIGS[previewDice.type].faces : 0;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-black px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Dice Flipper</h1>
          <p className="text-sm text-gray-600">보드게임을 위한 3D 주사위 시뮬레이터</p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 왼쪽: 주사위 프리뷰 */}
            <div className="space-y-6">
              {/* 3D 쇼케이스 */}
              <div className="bg-gray-50 border border-black aspect-square">
                {previewDice && (
                  <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
                    <color attach="background" args={['#f9fafb']} />
                    <Suspense fallback={null}>
                      <DiceShowcaseScene customization={previewDice} />
                    </Suspense>
                  </Canvas>
                )}
              </div>

              {/* 주사위 타입 선택 */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">주사위 타입</h3>
                <div className="grid grid-cols-6 gap-2">
                  {DICE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setPreviewDice(type)}
                      className={`py-3 font-bold text-lg border transition-colors ${
                        previewDice?.type === type
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {previewDice && (
                  <p className="text-xs text-gray-500 mt-2">
                    {DICE_CONFIGS[previewDice.type].description}
                  </p>
                )}
              </div>
            </div>

            {/* 오른쪽: 커스터마이징 & 트레이 */}
            <div className="space-y-6">
              {/* 커스터마이징 패널 */}
              {previewDice && (
                <div className="border border-black p-6 space-y-6">
                  <h2 className="text-lg font-bold border-b border-black pb-3">면 커스터마이징</h2>

                  {/* 커스텀 이미지 업로드 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm text-gray-600">
                        각 면에 이미지 추가 ({faceCount}면)
                      </label>
                      {Object.keys(faceImages).length > 0 && (
                        <button
                          onClick={clearFaceImages}
                          className="text-xs text-gray-600 hover:text-black underline"
                        >
                          모두 제거
                        </button>
                      )}
                    </div>

                    <div className={`grid gap-2 ${faceCount <= 6 ? 'grid-cols-6' : faceCount <= 12 ? 'grid-cols-6' : 'grid-cols-5'}`}>
                      {Array.from({ length: faceCount }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => handleImageUpload(num)}
                          className={`aspect-square flex items-center justify-center text-sm font-bold transition-all overflow-hidden border ${
                            faceImages[num]
                              ? 'border-black border-2'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-black'
                          }`}
                          style={
                            faceImages[num]
                              ? {
                                  backgroundImage: `url(${faceImages[num]})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : {}
                          }
                        >
                          {!faceImages[num] && num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      클릭해서 해당 면에 이미지를 추가하세요
                    </p>
                  </div>

                  {/* 트레이에 추가 버튼 */}
                  <button
                    onClick={addToTray}
                    className="w-full py-4 bg-black text-white font-bold text-lg border border-black hover:bg-gray-800 transition-colors"
                  >
                    + 트레이에 추가
                  </button>
                </div>
              )}

              {/* 선택된 주사위 트레이 */}
              <div className="border border-black p-6">
                <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
                  <h2 className="text-lg font-bold">
                    선택된 주사위 ({selectedDice.length})
                  </h2>
                  {selectedDice.length > 0 && (
                    <button
                      onClick={clearTray}
                      className="text-sm text-gray-600 hover:text-black underline"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {selectedDice.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    주사위를 선택하고 트레이에 추가해주세요
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedDice.map((dice) => (
                      <div
                        key={dice.id}
                        className="relative group"
                      >
                        <div className="aspect-square flex items-center justify-center text-lg font-bold bg-gray-50 border border-black">
                          {dice.customization.type}
                          {dice.customization.faceImages && Object.keys(dice.customization.faceImages).length > 0 && (
                            <span className="absolute bottom-1 right-1 text-xs bg-black text-white px-1">
                              IMG
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromTray(dice.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 플레이 시작 버튼 */}
                <button
                  onClick={handleStartPlay}
                  disabled={selectedDice.length === 0}
                  className={`w-full mt-6 py-4 font-bold text-xl border transition-colors ${
                    selectedDice.length > 0
                      ? 'bg-black text-white border-black hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                  }`}
                >
                  {selectedDice.length > 0
                    ? `주사위 굴리러 가기`
                    : '주사위를 선택해주세요'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-300 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <a
              href="https://detail-page-builder.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-black font-medium border border-black hover:bg-gray-100 transition-colors"
            >
              다른 서비스 보러가기
            </a>
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-black font-medium border border-black hover:bg-gray-100 transition-colors"
            >
              개발자 커피 한잔 사주기
            </a>
          </div>
          <p className="text-sm text-gray-500">
            Made with Next.js & Three.js
          </p>
        </div>
      </footer>
    </div>
  );
}

export default TitleScreen;
