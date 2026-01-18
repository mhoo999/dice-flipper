'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { useDiceStore } from '@/store/diceStore';
import { DiceType, DICE_CONFIGS, DiceCustomization } from '@/types/dice';
import { saveDiceSet, loadDiceSet } from '@/lib/supabase';

const DiceShowcaseScene = dynamic(
  () => import('./dice/DiceShowcase').then((mod) => mod.DiceShowcaseScene),
  { ssr: false }
);

const DICE_TYPES: DiceType[] = ['D6', 'D8', 'D10'];

export function TitleScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeTab, setCustomizeTab] = useState<'image' | 'text' | 'color'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDiceId, setSelectedDiceId] = useState<string | null>(null);

  const previewDice = useDiceStore((state) => state.previewDice);
  const selectedDice = useDiceStore((state) => state.selectedDice);
  const setPreviewDice = useDiceStore((state) => state.setPreviewDice);
  const setPreviewDiceFromCustomization = useDiceStore((state) => state.setPreviewDiceFromCustomization);
  const addToTray = useDiceStore((state) => state.addToTray);
  const removeFromTray = useDiceStore((state) => state.removeFromTray);
  const clearTray = useDiceStore((state) => state.clearTray);
  const setFaceImage = useDiceStore((state) => state.setFaceImage);
  const clearFaceImages = useDiceStore((state) => state.clearFaceImages);
  const setFaceText = useDiceStore((state) => state.setFaceText);
  const clearFaceTexts = useDiceStore((state) => state.clearFaceTexts);
  const setDiceColor = useDiceStore((state) => state.setDiceColor);
  const setNumberColor = useDiceStore((state) => state.setNumberColor);
  const setDiceMaterial = useDiceStore((state) => state.setDiceMaterial);
  const setDiceOpacity = useDiceStore((state) => state.setDiceOpacity);
  const loadDiceSetToTray = useDiceStore((state) => state.loadDiceSetToTray);

  // Supabase 관련 상태
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [shareId, setShareId] = useState<string | null>(null);
  const [savedSetName, setSavedSetName] = useState<string | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState(false);

  // URL 쿼리 파라미터에서 주사위 세트 불러오기
  useEffect(() => {
    const shareId = searchParams.get('share');
    if (shareId && !isLoadingShare) {
      const loadFromShare = async () => {
        setIsLoadingShare(true);
        try {
          const { data, error } = await loadDiceSet(shareId);
          
          if (error) {
            console.error('Error loading dice set from share:', error);
            alert('주사위 세트를 불러올 수 없습니다.');
            // URL에서 쿼리 파라미터 제거
            router.replace('/');
            return;
          }

          if (data) {
            loadDiceSetToTray(data.dice_data);
            setSavedSetName(data.name);
            setShareId(shareId);
            setShareUrl(`${window.location.origin}/?share=${shareId}`);
            // URL에서 쿼리 파라미터 제거 (히스토리 정리)
            router.replace('/');
          }
        } catch (err: any) {
          console.error('Error loading dice set from share:', err);
          alert('주사위 세트를 불러오는 중 오류가 발생했습니다.');
          router.replace('/');
        } finally {
          setIsLoadingShare(false);
        }
      };

      loadFromShare();
    }
  }, [searchParams, loadDiceSetToTray, router, isLoadingShare]);

  // 초기 주사위 설정
  useEffect(() => {
    if (!previewDice) {
      setPreviewDice('D6');
    }
  }, [previewDice, setPreviewDice]);

  // 주사위 세트 저장
  const handleSaveDiceSet = async () => {
    if (selectedDice.length === 0) {
      alert('저장할 주사위가 없습니다.');
      return;
    }

    if (!saveName.trim()) {
      alert('세트 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await saveDiceSet(saveName.trim(), selectedDice);
      
      if (error) {
        console.error('Error saving dice set:', error);
        alert('주사위 세트 저장 중 오류가 발생했습니다.');
        setIsSaving(false);
        return;
      }

      if (data) {
        // 메인 페이지 쿼리 파라미터 형식으로 공유 링크 생성
        const url = `${window.location.origin}/?share=${data.id}`;
        setShareUrl(url);
        setShareId(data.id);
        setSavedSetName(data.name);
        setSaveName('');
        alert('주사위 세트가 저장되었습니다!');
      }
    } catch (err) {
      console.error('Error saving dice set:', err);
      alert('주사위 세트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 공유 링크 복사
  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('공유 링크가 클립보드에 복사되었습니다!');
    }
  };

  // 주사위 세트 불러오기
  const handleLoadDiceSet = async () => {
    const input = prompt('주사위 세트의 URL을 입력하세요');
    if (!input || !input.trim()) {
      return;
    }

    // URL에서 UUID 추출
    let id = input.trim();
    
    // 전체 URL이면 UUID 부분만 추출
    if (id.includes('/share/')) {
      const match = id.match(/\/share\/([a-f0-9-]+)/i);
      if (match && match[1]) {
        id = match[1];
      }
    }
    
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      alert('올바른 UUID 형식이 아닙니다. 공유 링크의 ID 부분만 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await loadDiceSet(id);
      
      if (error) {
        console.error('Error loading dice set:', error);
        const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
        alert(`주사위 세트를 불러올 수 없습니다: ${errorMessage}`);
        return;
      }

      if (!data) {
        alert('주사위 세트를 찾을 수 없습니다.');
        return;
      }

      if (confirm(`"${data.name}" 주사위 세트를 불러오시겠습니까? (현재 트레이가 초기화됩니다)`)) {
        loadDiceSetToTray(data.dice_data);
        setSavedSetName(data.name);
        setShareId(id);
        setShareUrl(`${window.location.origin}/?share=${id}`);
        alert('주사위 세트가 불러와졌습니다!');
      }
    } catch (err: any) {
      console.error('Error loading dice set:', err);
      const errorMessage = err?.message || err?.toString() || '알 수 없는 오류';
      alert(`주사위 세트를 불러오는 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };

  const handleStartPlay = () => {
    if (selectedDice.length === 0) {
      alert('주사위를 최소 1개 이상 선택해주세요!');
      return;
    }
    router.push('/play');
  };

  // 이미지 압축 및 리사이즈 함수
  const compressImage = (file: File, maxWidth: number = 512, maxHeight: number = 512, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 원본 크기 확인
          let width = img.width;
          let height = img.height;

          // 비율 유지하며 리사이즈
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // 캔버스에 그리기
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context를 가져올 수 없습니다.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // JPEG로 압축 (PNG보다 작음)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(file);
    });
  };

  // localStorage 크기 확인 함수
  const checkLocalStorageSize = (): { used: number; available: number } => {
    let used = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (e) {
      console.error('localStorage 크기 확인 실패:', e);
    }
    // 대략적인 localStorage 제한 (브라우저마다 다름, 보통 5-10MB)
    const available = 5 * 1024 * 1024 - used; // 5MB 기준
    return { used, available };
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (faceNumber: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 파일 크기 제한 (10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        alert(`이미지 파일이 너무 큽니다. (최대 10MB)\n현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      try {
        // 이미지 압축 (512x512, quality 0.8)
        const compressedDataUrl = await compressImage(file, 512, 512, 0.8);
        
        // 압축된 이미지 크기 확인
        const compressedSize = compressedDataUrl.length;
        const { available } = checkLocalStorageSize();

        // localStorage 여유 공간 확인 (압축된 이미지 + 여유 공간 100KB)
        if (compressedSize > available - 100 * 1024) {
          alert(`저장 공간이 부족합니다.\n이미지가 너무 많거나 크면 저장되지 않을 수 있습니다.\n다른 이미지를 제거하거나 더 작은 이미지를 사용해주세요.`);
          return;
        }

        // 이미지 설정
        setFaceImage(faceNumber, compressedDataUrl);
      } catch (error) {
        console.error('이미지 처리 오류:', error);
        alert(`이미지를 처리하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };
    input.click();
  };

  // 텍스트 변경 처리
  const handleTextChange = (faceNumber: number, text: string) => {
    setFaceText(faceNumber, text);
  };

  // 트레이에 추가 (크기 확인 포함)
  const handleAddToTray = () => {
    if (!previewDice) return;

    // 이미지가 있는 경우 크기 확인
    const faceImages = previewDice.faceImages || {};
    const imageCount = Object.keys(faceImages).length;
    
    if (imageCount > 0) {
      // 현재 선택된 주사위의 총 이미지 크기 계산
      let totalImageSize = 0;
      Object.values(faceImages).forEach((imageUrl) => {
        if (imageUrl && imageUrl.startsWith('data:')) {
          totalImageSize += imageUrl.length;
        }
      });

      // 기존 트레이의 이미지 크기 계산
      selectedDice.forEach((dice) => {
        const images = dice.customization.faceImages || {};
        Object.values(images).forEach((imageUrl) => {
          if (imageUrl && imageUrl.startsWith('data:')) {
            totalImageSize += imageUrl.length;
          }
        });
      });

      // localStorage 여유 공간 확인
      const { available } = checkLocalStorageSize();
      const estimatedSize = totalImageSize + 50 * 1024; // 추가 여유 공간

      if (estimatedSize > available) {
        const shouldContinue = confirm(
          `저장 공간이 부족할 수 있습니다.\n` +
          `예상 크기: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB\n` +
          `여유 공간: ${(available / 1024 / 1024).toFixed(2)}MB\n\n` +
          `계속하시겠습니까? 저장이 실패할 수 있습니다.`
        );
        if (!shouldContinue) return;
      }
    }

    // 트레이에 추가
    try {
      addToTray();
    } catch (error) {
      console.error('트레이에 추가 실패:', error);
      alert('주사위를 트레이에 추가하는 중 오류가 발생했습니다. 저장 공간이 부족할 수 있습니다.');
    }
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

      // 탭 설정
      setCustomizeTab(hasImages ? 'image' : 'text');
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
      <header
        className="border-b border-black px-6 py-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
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
                <div className="grid grid-cols-3 gap-2">
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
                      <h2 className="text-lg font-bold">커스터마이징</h2>
                      {hasCustomization && (
                        <span className="text-xs bg-black text-white px-2 py-0.5">적용됨</span>
                      )}
                    </div>
                    <span className="text-xl">{isCustomizeOpen ? '−' : '+'}</span>
                  </button>

                  {/* 토글 컨텐츠 */}
                  {isCustomizeOpen && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                      {/* 탭 선택 (이미지 / 텍스트 / 컬러&재질) */}
                      <div className="flex border-b border-gray-200 mt-4">
                        {previewDice?.type === 'D6' && (
                          <button
                            onClick={() => {
                              setCustomizeTab('image');
                              clearFaceTexts();
                            }}
                            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                              customizeTab === 'image'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:text-black'
                            }`}
                          >
                            이미지
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCustomizeTab('text');
                            if (previewDice?.type === 'D6') {
                              clearFaceImages();
                            }
                          }}
                          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                            customizeTab === 'text'
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-500 hover:text-black'
                          }`}
                        >
                          텍스트
                        </button>
                        <button
                          onClick={() => setCustomizeTab('color')}
                          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                            customizeTab === 'color'
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-500 hover:text-black'
                          }`}
                        >
                          컬러&재질
                        </button>
                      </div>

                      {/* 이미지 탭 (D6 전용) */}
                      {previewDice?.type === 'D6' && customizeTab === 'image' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-600">
                              각 면에 이미지 추가 (6면)
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

                          <div className="grid grid-cols-6 gap-2">
                            {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
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

                      {/* 텍스트 탭 */}
                      {customizeTab === 'text' && (
                        <div className="pt-4">
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

                      {/* 컬러&재질 탭 */}
                      {customizeTab === 'color' && (
                        <div className="space-y-4 pt-4">
                          {/* 주사위 색상 */}
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">
                              주사위 색상
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={previewDice?.color || '#f5f5f5'}
                                onChange={(e) => setDiceColor(e.target.value)}
                                className="w-16 h-10 border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={previewDice?.color || '#f5f5f5'}
                                onChange={(e) => setDiceColor(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>

                          {/* 숫자 색상 */}
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">
                              숫자 색상
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={previewDice?.numberColor || '#1a1a1a'}
                                onChange={(e) => setNumberColor(e.target.value)}
                                className="w-16 h-10 border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={previewDice?.numberColor || '#1a1a1a'}
                                onChange={(e) => setNumberColor(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
                                placeholder="#000000"
                              />
                            </div>
                          </div>

                          {/* 재질 선택 */}
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">
                              재질
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['plastic', 'metal', 'glass', 'wood'] as const).map((material) => (
                                <button
                                  key={material}
                                  onClick={() => setDiceMaterial(material)}
                                  className={`py-2 px-3 text-sm font-medium border transition-colors ${
                                    previewDice?.material === material
                                      ? 'bg-black text-white border-black'
                                      : 'bg-white text-black border-gray-300 hover:border-black'
                                  }`}
                                >
                                  {material === 'plastic' && '플라스틱'}
                                  {material === 'metal' && '메탈'}
                                  {material === 'glass' && '글라스'}
                                  {material === 'wood' && '우드'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 투명도 */}
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">
                              투명도: {Math.round((previewDice?.opacity || 1) * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={previewDice?.opacity || 1}
                              onChange={(e) => setDiceOpacity(parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* 구분선 */}
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600 mb-2">저장/불러오기</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCustomization}
                            disabled={!hasCustomization || (previewDice?.type === 'D6' && customizeTab === 'image')}
                            className={`flex-1 px-3 py-2 text-sm font-medium border transition-colors ${
                              hasCustomization && !(previewDice?.type === 'D6' && customizeTab === 'image')
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
                  onClick={handleAddToTray}
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
                      onClick={() => {
                        clearTray();
                        setSavedSetName(null);
                        setShareUrl(null);
                        setShareId(null);
                      }}
                      className="text-sm text-gray-600 hover:text-black underline"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {/* 저장된 세트 이름 표시 */}
                {savedSetName && shareUrl ? (
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">저장된 세트:</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        alert('공유 링크가 클립보드에 복사되었습니다!');
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {savedSetName}
                    </button>
                  </div>
                ) : null}

                {selectedDice.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    주사위를 선택하고 트레이에 추가해주세요
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedDice.map((dice) => {
                      const hasImg = dice.customization.faceImages && Object.keys(dice.customization.faceImages).length > 0;
                      const hasTxt = dice.customization.faceTexts && Object.values(dice.customization.faceTexts).some(t => t && t.trim() !== '');
                      
                      // 현재 프리뷰에 선택된 주사위인지 확인 (클릭한 주사위의 id로 비교)
                      const isSelected = selectedDiceId === dice.id;
                      
                      // 1면 프리뷰 데이터
                      const face1Image = dice.customization.faceImages?.[1];
                      const face1Text = dice.customization.faceTexts?.[1];
                      
                      return (
                        <div
                          key={dice.id}
                          className="relative group"
                        >
                          <button
                            onClick={() => {
                              // 주사위 클릭 시 프리뷰로 로드 (커스터마이징 상태는 유지)
                              setPreviewDiceFromCustomization(dice.customization);
                              setSelectedDiceId(dice.id); // 선택된 주사위 id 저장
                              // isCustomizeOpen 상태는 그대로 유지 (강제로 변경하지 않음)
                            }}
                            className={`w-full aspect-square flex flex-col items-center justify-center text-sm font-bold transition-colors cursor-pointer overflow-hidden relative ${
                              isSelected 
                                ? 'bg-blue-100 border-2 border-blue-500 hover:bg-blue-200' 
                                : 'bg-gray-50 border border-black hover:bg-gray-100'
                            }`}
                            style={
                              face1Image
                                ? {
                                    backgroundImage: `url(${face1Image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }
                                : {}
                            }
                          >
                            {/* 1면 이미지가 있으면 이미지만 표시, 없으면 타입과 텍스트/숫자 표시 */}
                            {!face1Image && (
                              <>
                                <span className="text-xs mb-1">{dice.customization.type}</span>
                                {face1Text ? (
                                  <span className={`text-lg ${face1Text.length > 2 ? 'text-[10px]' : ''}`}>
                                    {face1Text}
                                  </span>
                                ) : (
                                  <span className="text-2xl">1</span>
                                )}
                              </>
                            )}
                            {/* 커스터마이징 표시 배지 */}
                            {(hasImg || hasTxt) && (
                              <span className="absolute bottom-1 right-1 text-[8px] bg-black text-white px-1 opacity-80">
                                {hasImg ? 'IMG' : 'TXT'}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromTray(dice.id);
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-10 rounded-full shadow-md transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 저장/불러오기 섹션 */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <h3 className="text-sm font-bold text-gray-600 mb-2">주사위 세트 저장/불러오기</h3>
                  
                  {/* 저장 (주사위가 있을 때만) */}
                  {selectedDice.length > 0 && (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          placeholder="세트 이름"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDiceSet();
                            }
                          }}
                        />
                        <button
                          onClick={handleSaveDiceSet}
                          disabled={isSaving || !saveName.trim()}
                          className={`px-4 py-2 text-sm font-medium border transition-colors ${
                            isSaving || !saveName.trim()
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-black border-black hover:bg-gray-100'
                          }`}
                        >
                          {isSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>

                      {/* 공유 링크 */}
                      {shareUrl && (
                        <div className="p-3 bg-gray-50 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">공유 링크:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={shareUrl}
                              readOnly
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 bg-white"
                            />
                            <button
                              onClick={handleCopyShareLink}
                              className="px-3 py-1 text-xs bg-black text-white hover:bg-gray-800 transition-colors"
                            >
                              복사
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 불러오기 (항상 표시) */}
                  <button
                    onClick={handleLoadDiceSet}
                    className="w-full px-4 py-2 text-sm font-medium bg-white text-black border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                  >
                    세트 불러오기
                  </button>
                </div>

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

      {/* 동적 푸터 */}
      <div id="hoons-footer"></div>
    </div>
  );
}

export default TitleScreen;
