import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DiceCustomization, DiceType, RollResult } from '@/types/dice';

// 선택된 주사위 (트레이에 담긴 주사위)
export interface SelectedDice {
  id: string;
  customization: DiceCustomization;
}

// 플리퍼에서 사용되는 주사위 상태
export interface DiceInPlay {
  id: string;
  customization: DiceCustomization;
  position: [number, number, number];
  rotation: [number, number, number];
  result: number | null;
  isRolling: boolean;
}

interface DiceStore {
  // 현재 프리뷰 중인 주사위 (타이틀 화면)
  previewDice: DiceCustomization | null;

  // 선택된 주사위 트레이
  selectedDice: SelectedDice[];

  // 플레이 중인 주사위들 (플리퍼 화면)
  diceInPlay: DiceInPlay[];

  // 굴리기 기록
  rollHistory: RollResult[];

  // UI 상태
  isRolling: boolean;

  // 사운드 설정
  isMuted: boolean;
  toggleMute: () => void;

  // 타이틀 화면 액션
  setPreviewDice: (type: DiceType) => void;
  setFaceImage: (faceNumber: number, imageUrl: string) => void;
  clearFaceImages: () => void;
  setFaceText: (faceNumber: number, text: string) => void;
  clearFaceTexts: () => void;
  addToTray: () => void;
  removeFromTray: (id: string) => void;
  clearTray: () => void;

  // 플리퍼 화면 액션
  initializePlay: () => void;
  rollAllDice: (power?: number) => void;
  rollSingleDice: (id: string) => void;
  rollPower: number;
  setDiceResult: (id: string, result: number) => void;
  clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultCustomization = (type: DiceType): DiceCustomization => {
  return {
    id: generateId(),
    type,
    color: '#f5f5f5',
    numberColor: '#1a1a1a',
    material: 'plastic',
    opacity: 1,
    faceImages: {},
    faceTexts: {},
  };
};

export const useDiceStore = create<DiceStore>()(
  persist(
    (set, get) => ({
      previewDice: null,
      selectedDice: [],
      diceInPlay: [],
      rollHistory: [],
      isRolling: false,
      rollPower: 0,
      isMuted: false,

      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },

      // 프리뷰 주사위 설정
      setPreviewDice: (type) => {
        set({ previewDice: createDefaultCustomization(type) });
      },

      // 면에 이미지 설정
      setFaceImage: (faceNumber, imageUrl) => {
        const { previewDice } = get();
        if (!previewDice) return;
        set({
          previewDice: {
            ...previewDice,
            faceImages: {
              ...previewDice.faceImages,
              [faceNumber]: imageUrl,
            },
          },
        });
      },

      // 모든 면 이미지 제거
      clearFaceImages: () => {
        const { previewDice } = get();
        if (!previewDice) return;
        set({
          previewDice: {
            ...previewDice,
            faceImages: {},
          },
        });
      },

      // 면에 텍스트 설정
      setFaceText: (faceNumber, text) => {
        const { previewDice } = get();
        if (!previewDice) return;
        set({
          previewDice: {
            ...previewDice,
            faceTexts: {
              ...previewDice.faceTexts,
              [faceNumber]: text,
            },
          },
        });
      },

      // 모든 면 텍스트 제거
      clearFaceTexts: () => {
        const { previewDice } = get();
        if (!previewDice) return;
        set({
          previewDice: {
            ...previewDice,
            faceTexts: {},
          },
        });
      },

      // 트레이에 추가
      addToTray: () => {
        const { previewDice, selectedDice } = get();
        if (!previewDice) return;

        const newDice: SelectedDice = {
          id: generateId(),
          customization: {
            ...previewDice,
            id: generateId(),
            faceImages: previewDice.faceImages ? { ...previewDice.faceImages } : {},
            faceTexts: previewDice.faceTexts ? { ...previewDice.faceTexts } : {},
          },
        };

        set({
          selectedDice: [...selectedDice, newDice],
        });
      },

      // 트레이에서 제거
      removeFromTray: (id) => {
        set((state) => ({
          selectedDice: state.selectedDice.filter((d) => d.id !== id),
        }));
      },

      // 트레이 비우기
      clearTray: () => {
        set({ selectedDice: [] });
      },

      // 플레이 초기화 (트레이 → 플레이)
      initializePlay: () => {
        const { selectedDice } = get();

        const diceInPlay: DiceInPlay[] = selectedDice.map((d, index) => ({
          id: d.id,
          customization: d.customization,
          // 테이블 중앙 바닥에 배치
          position: [
            (index % 3 - 1) * 1,
            0.5,
            Math.floor(index / 3) * 1,
          ] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          result: null,
          isRolling: false,
        }));

        set({ diceInPlay, isRolling: false });
      },

      // 모든 주사위 굴리기
      rollAllDice: (power = 100) => {
        set({ isRolling: true, rollPower: power });

        set((state) => ({
          diceInPlay: state.diceInPlay.map((d, index) => {
            // 플레이어(카메라) 쪽에서 시작 - 약간씩 다른 위치
            const spreadX = (index - (state.diceInPlay.length - 1) / 2) * 0.5;
            const randomX = (Math.random() - 0.5) * 0.3;
            const randomZ = Math.random() * 0.3;
            return {
              ...d,
              isRolling: true,
              result: null,
              // 앞쪽(z=3)에서 시작, 중앙을 향해 던져질 예정
              position: [
                spreadX + randomX,
                1.5 + Math.random() * 0.5,
                3 + randomZ,
              ] as [number, number, number],
              rotation: [
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
              ] as [number, number, number],
            };
          }),
        }));
      },

      // 단일 주사위 굴리기
      rollSingleDice: (id) => {
        set((state) => ({
          diceInPlay: state.diceInPlay.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isRolling: true,
                  result: null,
                  position: [
                    (Math.random() - 0.5) * 2,
                    2 + Math.random() * 1,
                    (Math.random() - 0.5) * 2,
                  ] as [number, number, number],
                  rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                  ] as [number, number, number],
                }
              : d
          ),
        }));
      },

      // 결과 설정
      setDiceResult: (id, result) => {
        const dice = get().diceInPlay.find((d) => d.id === id);
        if (!dice) return;

        const rollResult: RollResult = {
          diceId: id,
          value: result,
          timestamp: Date.now(),
        };

        set((state) => ({
          diceInPlay: state.diceInPlay.map((d) =>
            d.id === id ? { ...d, result, isRolling: false } : d
          ),
          rollHistory: [rollResult, ...state.rollHistory].slice(0, 100),
        }));

        // 모든 주사위가 멈췄는지 확인
        const allStopped = get().diceInPlay.every((d) => !d.isRolling || d.id === id);
        if (allStopped) {
          set({ isRolling: false });
        }
      },

      // 히스토리 지우기
      clearHistory: () => {
        set({ rollHistory: [] });
      },
    }),
    {
      name: 'dice-flipper-storage',
      partialize: (state) => ({
        selectedDice: state.selectedDice,
        previewDice: state.previewDice,
        isMuted: state.isMuted,
      }),
    }
  )
);
