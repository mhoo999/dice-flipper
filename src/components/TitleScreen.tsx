'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { useDiceStore } from '@/store/diceStore';
import { DiceType, DICE_CONFIGS, DiceCustomization } from '@/types/dice';

const DiceShowcaseScene = dynamic(
  () => import('./dice/DiceShowcase').then((mod) => mod.DiceShowcaseScene),
  { ssr: false }
);

const DICE_TYPES: DiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

export function TitleScreen() {
  const router = useRouter();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeMode, setCustomizeMode] = useState<'image' | 'text'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewDice = useDiceStore((state) => state.previewDice);
  const selectedDice = useDiceStore((state) => state.selectedDice);
  const setPreviewDice = useDiceStore((state) => state.setPreviewDice);
  const addToTray = useDiceStore((state) => state.addToTray);
  const removeFromTray = useDiceStore((state) => state.removeFromTray);
  const clearTray = useDiceStore((state) => state.clearTray);
  const setFaceImage = useDiceStore((state) => state.setFaceImage);
  const clearFaceImages = useDiceStore((state) => state.clearFaceImages);
  const setFaceText = useDiceStore((state) => state.setFaceText);
  const clearFaceTexts = useDiceStore((state) => state.clearFaceTexts);

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

  // 텍스트 변경 처리
  const handleTextChange = (faceNumber: number, text: string) => {
    setFaceText(faceNumber, text);
  };

  // CSV로 커스터마이징 저장
  const handleSaveCustomization = () => {
    if (!previewDice) return;

    const faceCount = DICE_CONFIGS[previewDice.type].faces;
    const faceImages = previewDice.faceImages || {};
    const faceTexts = previewDice.faceTexts || {};

    // 헤더 생성
    const headers = Array.from({ length: faceCount }, (_, i) => `${i + 1}면`).join(',');

    // 데이터 생성 (이미지 URL 또는 텍스트)
    const values = Array.from({ length: faceCount }, (_, i) => {
      const faceNum = i + 1;
      const image = faceImages[faceNum];
      const text = faceTexts[faceNum];

      // 이미지가 base64면 내보낼 수 없음 (URL만 지원)
      if (image && image.startsWith('http')) {
        return image;
      } else if (text) {
        return text;
      }
      return '';
    }).join(',');

    const csvContent = `${headers}\n${values}`;

    // 파일 다운로드
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${previewDice.type}_customization.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 파일에서 데이터 추출 후 적용
  const applyLoadedData = (headers: string[], values: string[]) => {
    const columnCount = headers.length;

    // 컬럼 수로 주사위 타입 결정
    const faceToType: Record<number, DiceType> = {
      4: 'D4',
      6: 'D6',
      8: 'D8',
      10: 'D10',
      12: 'D12',
      20: 'D20',
    };

    const diceType = faceToType[columnCount];
    if (!diceType) {
      alert(`지원하지 않는 면 수입니다: ${columnCount}개\n(4, 6, 8, 10, 12, 20면만 지원)`);
      return;
    }

    // 주사위 타입 변경
    setPreviewDice(diceType);

    // 약간의 지연 후 커스터마이징 적용 (타입 변경 반영 대기)
    setTimeout(() => {
      // 기존 데이터 초기화
      clearFaceImages();
      clearFaceTexts();

      let hasImages = false;

      // 각 면에 값 적용
      values.forEach((value, index) => {
        const faceNum = index + 1;
        if (faceNum > columnCount || !value) return;

        const strValue = String(value).trim();
        if (!strValue) return;

        // URL이면 이미지로, 아니면 텍스트로 처리
        if (strValue.startsWith('http://') || strValue.startsWith('https://')) {
          setFaceImage(faceNum, strValue);
          hasImages = true;
        } else {
          setFaceText(faceNum, strValue);
        }
      });

      // 모드 설정
      setCustomizeMode(hasImages ? 'image' : 'text');
      setIsCustomizeOpen(true);
    }, 100);
  };

  // CSV/Excel에서 커스터마이징 불러오기
  const handleLoadCustomization = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      // Excel 파일 처리
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            alert('올바른 Excel 파일이 아닙니다.');
            return;
          }

          const headers = jsonData[0].map(h => String(h));
          const values = jsonData[1].map(v => String(v || ''));
          applyLoadedData(headers, values);

        } catch (error) {
          alert('파일을 불러오는 중 오류가 발생했습니다.');
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV 파일 처리
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const lines = csvText.trim().split('\n');

          if (lines.length < 2) {
            alert('올바른 CSV 파일이 아닙니다.');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const values = lines[1].split(',').map(v => v.trim());
          applyLoadedData(headers, values);

        } catch (error) {
          alert('파일을 불러오는 중 오류가 발생했습니다.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const faceImages = previewDice?.faceImages || {};
  const faceTexts = previewDice?.faceTexts || {};
  const faceCount = previewDice ? DICE_CONFIGS[previewDice.type].faces : 0;

  // 커스터마이징 여부 확인
  const hasCustomization =
    Object.keys(faceImages).length > 0 ||
    Object.values(faceTexts).some(text => text && text.trim() !== '');

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
              {/* 커스터마이징 패널 (토글) */}
              {previewDice && (
                <div className="border border-black">
                  {/* 토글 헤더 */}
                  <button
                    onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">면 커스터마이징</h2>
                      {hasCustomization && (
                        <span className="text-xs bg-black text-white px-2 py-0.5">적용됨</span>
                      )}
                    </div>
                    <span className="text-xl">{isCustomizeOpen ? '−' : '+'}</span>
                  </button>

                  {/* 토글 컨텐츠 */}
                  {isCustomizeOpen && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                      {/* 모드 선택 탭 */}
                      <div className="flex border-b border-gray-200 mt-4">
                        <button
                          onClick={() => {
                            setCustomizeMode('image');
                            clearFaceTexts();
                          }}
                          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                            customizeMode === 'image'
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-500 hover:text-black'
                          }`}
                        >
                          이미지
                        </button>
                        <button
                          onClick={() => {
                            setCustomizeMode('text');
                            clearFaceImages();
                          }}
                          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                            customizeMode === 'text'
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-500 hover:text-black'
                          }`}
                        >
                          텍스트
                        </button>
                      </div>

                      {/* 이미지 모드 */}
                      {customizeMode === 'image' && (
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
                      )}

                      {/* 텍스트 모드 */}
                      {customizeMode === 'text' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-600">
                              각 면에 텍스트 입력 ({faceCount}면)
                            </label>
                            {Object.values(faceTexts).some(t => t && t.trim() !== '') && (
                              <button
                                onClick={clearFaceTexts}
                                className="text-xs text-gray-600 hover:text-black underline"
                              >
                                모두 제거
                              </button>
                            )}
                          </div>

                          <div className={`grid gap-2 ${faceCount <= 6 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {Array.from({ length: faceCount }, (_, i) => i + 1).map((num) => (
                              <div key={num} className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 w-5 shrink-0">{num}:</span>
                                <input
                                  type="text"
                                  value={faceTexts[num] || ''}
                                  onChange={(e) => handleTextChange(num, e.target.value)}
                                  placeholder={String(num)}
                                  className="w-full min-w-0 px-2 py-1 text-sm border border-gray-300 focus:border-black focus:outline-none"
                                  maxLength={10}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            비워두면 기본 숫자가 표시됩니다
                          </p>
                        </div>
                      )}

                      {/* 구분선 */}
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600 mb-2">저장/불러오기</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCustomization}
                            disabled={!hasCustomization}
                            className={`flex-1 px-3 py-2 text-sm font-medium border transition-colors ${
                              hasCustomization
                                ? 'bg-white text-black border-black hover:bg-gray-100'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            CSV 저장
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleLoadCustomization}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3 py-2 text-sm font-medium bg-white text-black border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                          >
                            불러오기
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          http로 시작하면 이미지, 아니면 텍스트로 인식
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 트레이에 추가 버튼 */}
              {previewDice && (
                <button
                  onClick={addToTray}
                  className="w-full py-4 bg-black text-white font-bold text-lg border border-black hover:bg-gray-800 transition-colors"
                >
                  + 트레이에 추가
                </button>
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
                    {selectedDice.map((dice) => {
                      const hasImg = dice.customization.faceImages && Object.keys(dice.customization.faceImages).length > 0;
                      const hasTxt = dice.customization.faceTexts && Object.values(dice.customization.faceTexts).some(t => t && t.trim() !== '');
                      return (
                        <div
                          key={dice.id}
                          className="relative group"
                        >
                          <div className="aspect-square flex items-center justify-center text-lg font-bold bg-gray-50 border border-black">
                            {dice.customization.type}
                            {(hasImg || hasTxt) && (
                              <span className="absolute bottom-1 right-1 text-xs bg-black text-white px-1">
                                {hasImg ? 'IMG' : 'TXT'}
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
                      );
                    })}
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
