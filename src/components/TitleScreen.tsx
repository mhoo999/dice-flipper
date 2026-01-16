'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiceStore } from '@/store/diceStore';
import { DiceType, DICE_CONFIGS, DEFAULT_PRESETS } from '@/types/dice';

const DiceShowcaseScene = dynamic(
  () => import('./dice/DiceShowcase').then((mod) => mod.DiceShowcaseScene),
  { ssr: false }
);

const DICE_TYPES: DiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-white/50 animate-pulse">로딩 중...</div>
    </div>
  );
}

export function TitleScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewDice = useDiceStore((state) => state.previewDice);
  const selectedDice = useDiceStore((state) => state.selectedDice);
  const setPreviewDice = useDiceStore((state) => state.setPreviewDice);
  const updatePreviewCustomization = useDiceStore((state) => state.updatePreviewCustomization);
  const applyPresetToPreview = useDiceStore((state) => state.applyPresetToPreview);
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
  const isD6 = previewDice?.type === 'D6';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] text-white">
      {/* 헤더 */}
      <header className="p-6 text-center">
        <h1 className="text-5xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
            Dice Flipper
          </span>
        </h1>
        <p className="text-gray-400">보드게임을 위한 3D 주사위 시뮬레이터</p>
      </header>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 주사위 프리뷰 */}
          <div className="space-y-6">
            {/* 3D 쇼케이스 */}
            <div className="bg-black/30 rounded-2xl overflow-hidden aspect-square border border-white/10">
              {previewDice && (
                <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
                  <color attach="background" args={['#0a0a1a']} />
                  <Suspense fallback={null}>
                    <DiceShowcaseScene customization={previewDice} />
                  </Suspense>
                </Canvas>
              )}
            </div>

            {/* 주사위 타입 선택 */}
            <div>
              <h3 className="text-sm text-gray-400 mb-3">주사위 타입</h3>
              <div className="grid grid-cols-6 gap-2">
                {DICE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setPreviewDice(type)}
                    className={`py-3 rounded-xl font-bold text-lg transition-all ${
                      previewDice?.type === type
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-105'
                        : 'bg-white/10 hover:bg-white/20'
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
              <div className="bg-white/5 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-bold">커스터마이징</h2>

                {/* 프리셋 */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">프리셋</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DEFAULT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPresetToPreview(preset.id)}
                        className="px-3 py-2 rounded-lg text-sm transition-all hover:scale-105"
                        style={{
                          backgroundColor: preset.customization.color,
                          color: preset.customization.numberColor,
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 색상 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">주사위 색상</label>
                    <input
                      type="color"
                      value={previewDice.color}
                      onChange={(e) => updatePreviewCustomization({ color: e.target.value })}
                      className="w-full h-12 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">숫자/점 색상</label>
                    <input
                      type="color"
                      value={previewDice.numberColor}
                      onChange={(e) => updatePreviewCustomization({ numberColor: e.target.value })}
                      className="w-full h-12 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* 재질 */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">재질</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['plastic', 'metal', 'glass', 'wood'] as const).map((material) => (
                      <button
                        key={material}
                        onClick={() => updatePreviewCustomization({ material })}
                        className={`py-2 rounded-lg text-sm transition-all ${
                          previewDice.material === material
                            ? 'bg-purple-500'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {material === 'plastic' && '플라스틱'}
                        {material === 'metal' && '메탈'}
                        {material === 'glass' && '유리'}
                        {material === 'wood' && '나무'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 투명도 */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    투명도: {Math.round(previewDice.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={previewDice.opacity}
                    onChange={(e) => updatePreviewCustomization({ opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* D6 커스텀 이미지 업로드 */}
                {isD6 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">면에 커스텀 이미지</label>
                      {Object.keys(faceImages).length > 0 && (
                        <button
                          onClick={clearFaceImages}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          모두 제거
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleImageUpload(num)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all overflow-hidden ${
                            faceImages[num]
                              ? 'ring-2 ring-green-400'
                              : 'bg-white/10 hover:bg-white/20'
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
                )}

                {/* 트레이에 추가 버튼 */}
                <button
                  onClick={addToTray}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg transition-all hover:scale-[1.02]"
                >
                  + 트레이에 추가
                </button>
              </div>
            )}

            {/* 선택된 주사위 트레이 */}
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  선택된 주사위 ({selectedDice.length})
                </h2>
                {selectedDice.length > 0 && (
                  <button
                    onClick={clearTray}
                    className="text-red-400 hover:text-red-300 text-sm"
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
                      <div
                        className="aspect-square rounded-xl flex items-center justify-center text-lg font-bold border-2 border-white/10"
                        style={{
                          backgroundColor: dice.customization.color,
                          color: dice.customization.numberColor,
                          opacity: dice.customization.opacity,
                        }}
                      >
                        {dice.customization.type}
                        {dice.customization.faceImages && Object.keys(dice.customization.faceImages).length > 0 && (
                          <span className="absolute bottom-1 right-1 text-xs bg-green-500 text-white px-1 rounded">
                            IMG
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromTray(dice.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 플레이 시작 버튼 */}
              <button
                onClick={handleStartPlay}
                disabled={selectedDice.length === 0}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-xl transition-all ${
                  selectedDice.length > 0
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-[1.02]'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {selectedDice.length > 0
                  ? `주사위 굴리러 가기 →`
                  : '주사위를 선택해주세요'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TitleScreen;
