import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DiceState, DiceCustomization, DiceType, RollResult, DEFAULT_PRESETS } from '@/types/dice';

interface DiceStore {
  // 주사위 목록
  dice: DiceState[];

  // 굴리기 기록
  rollHistory: RollResult[];

  // UI 상태
  isRolling: boolean;
  selectedDiceId: string | null;

  // 액션
  addDice: (type: DiceType, customization?: Partial<DiceCustomization>) => void;
  removeDice: (id: string) => void;
  updateDiceCustomization: (id: string, customization: Partial<DiceCustomization>) => void;
  rollDice: () => void;
  rollSingleDice: (id: string) => void;
  setDiceResult: (id: string, result: number) => void;
  setDiceRolling: (id: string, isRolling: boolean) => void;
  selectDice: (id: string | null) => void;
  clearDice: () => void;
  clearHistory: () => void;
  applyPreset: (id: string, presetId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useDiceStore = create<DiceStore>()(
  persist(
    (set, get) => ({
      dice: [],
      rollHistory: [],
      isRolling: false,
      selectedDiceId: null,

      addDice: (type, customization = {}) => {
        const id = generateId();
        const defaultPreset = DEFAULT_PRESETS[0].customization;

        const newDice: DiceState = {
          id,
          customization: {
            id,
            type,
            color: defaultPreset.color,
            numberColor: defaultPreset.numberColor,
            material: defaultPreset.material,
            opacity: defaultPreset.opacity,
            ...customization,
          },
          position: [
            (Math.random() - 0.5) * 2,
            3 + Math.random() * 2,
            (Math.random() - 0.5) * 2,
          ],
          rotation: [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
          ],
          result: null,
          isRolling: false,
        };

        set((state) => ({
          dice: [...state.dice, newDice],
        }));
      },

      removeDice: (id) => {
        set((state) => ({
          dice: state.dice.filter((d) => d.id !== id),
          selectedDiceId: state.selectedDiceId === id ? null : state.selectedDiceId,
        }));
      },

      updateDiceCustomization: (id, customization) => {
        set((state) => ({
          dice: state.dice.map((d) =>
            d.id === id
              ? { ...d, customization: { ...d.customization, ...customization } }
              : d
          ),
        }));
      },

      rollDice: () => {
        const { dice } = get();
        set({ isRolling: true });

        dice.forEach((d) => {
          set((state) => ({
            dice: state.dice.map((dice) =>
              dice.id === d.id
                ? {
                    ...dice,
                    isRolling: true,
                    result: null,
                    position: [
                      (Math.random() - 0.5) * 3,
                      4 + Math.random() * 2,
                      (Math.random() - 0.5) * 3,
                    ],
                    rotation: [
                      Math.random() * Math.PI * 2,
                      Math.random() * Math.PI * 2,
                      Math.random() * Math.PI * 2,
                    ],
                  }
                : dice
            ),
          }));
        });
      },

      rollSingleDice: (id) => {
        set((state) => ({
          dice: state.dice.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isRolling: true,
                  result: null,
                  position: [
                    (Math.random() - 0.5) * 2,
                    4 + Math.random() * 2,
                    (Math.random() - 0.5) * 2,
                  ],
                  rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                  ],
                }
              : d
          ),
        }));
      },

      setDiceResult: (id, result) => {
        const dice = get().dice.find((d) => d.id === id);
        if (!dice) return;

        const rollResult: RollResult = {
          diceId: id,
          value: result,
          timestamp: Date.now(),
        };

        set((state) => ({
          dice: state.dice.map((d) =>
            d.id === id ? { ...d, result, isRolling: false } : d
          ),
          rollHistory: [rollResult, ...state.rollHistory].slice(0, 100),
        }));

        // 모든 주사위가 멈췄는지 확인
        const allStopped = get().dice.every((d) => !d.isRolling);
        if (allStopped) {
          set({ isRolling: false });
        }
      },

      setDiceRolling: (id, isRolling) => {
        set((state) => ({
          dice: state.dice.map((d) =>
            d.id === id ? { ...d, isRolling } : d
          ),
        }));
      },

      selectDice: (id) => {
        set({ selectedDiceId: id });
      },

      clearDice: () => {
        set({ dice: [], selectedDiceId: null });
      },

      clearHistory: () => {
        set({ rollHistory: [] });
      },

      applyPreset: (id, presetId) => {
        const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;

        set((state) => ({
          dice: state.dice.map((d) =>
            d.id === id
              ? {
                  ...d,
                  customization: {
                    ...d.customization,
                    ...preset.customization,
                  },
                }
              : d
          ),
        }));
      },
    }),
    {
      name: 'dice-flipper-storage',
      partialize: (state) => ({
        dice: state.dice.map((d) => ({
          ...d,
          isRolling: false,
          result: null,
        })),
      }),
    }
  )
);
