'use client';

import { useState } from 'react';
import { useDiceStore } from '@/store/diceStore';
import { DiceType, DICE_CONFIGS, DEFAULT_PRESETS } from '@/types/dice';

const DICE_TYPES: DiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

export function ControlPanel() {
  const [showCustomization, setShowCustomization] = useState(false);

  const dice = useDiceStore((state) => state.dice);
  const selectedDiceId = useDiceStore((state) => state.selectedDiceId);
  const isRolling = useDiceStore((state) => state.isRolling);
  const addDice = useDiceStore((state) => state.addDice);
  const removeDice = useDiceStore((state) => state.removeDice);
  const rollDice = useDiceStore((state) => state.rollDice);
  const clearDice = useDiceStore((state) => state.clearDice);
  const selectDice = useDiceStore((state) => state.selectDice);
  const updateDiceCustomization = useDiceStore((state) => state.updateDiceCustomization);
  const applyPreset = useDiceStore((state) => state.applyPreset);

  const selectedDice = dice.find((d) => d.id === selectedDiceId);
  const totalResult = dice.reduce((sum, d) => sum + (d.result || 0), 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
      <div className="max-w-4xl mx-auto">
        {/* 결과 표시 */}
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-4 bg-white/10 rounded-xl px-6 py-3 backdrop-blur-sm">
            {dice.map((d) => (
              <div
                key={d.id}
                className={`flex flex-col items-center cursor-pointer transition-transform ${
                  selectedDiceId === d.id ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => selectDice(d.id)}
              >
                <span className="text-xs text-gray-400">{d.customization.type}</span>
                <span
                  className={`text-2xl font-bold ${
                    d.isRolling ? 'animate-pulse text-yellow-400' : 'text-white'
                  }`}
                >
                  {d.isRolling ? '?' : d.result || '-'}
                </span>
              </div>
            ))}
            {dice.length > 1 && (
              <div className="flex flex-col items-center border-l border-white/20 pl-4">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-2xl font-bold text-green-400">
                  {isRolling ? '?' : totalResult || '-'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 주사위 추가 버튼 */}
        <div className="flex justify-center gap-2 mb-4">
          {DICE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => addDice(type)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
              disabled={isRolling}
            >
              +{type}
            </button>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={rollDice}
            disabled={dice.length === 0 || isRolling}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
          >
            {isRolling ? '굴리는 중...' : '주사위 굴리기!'}
          </button>

          {dice.length > 0 && (
            <button
              onClick={clearDice}
              disabled={isRolling}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>

        {/* 커스터마이징 패널 */}
        {selectedDice && (
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">
                {selectedDice.customization.type} 커스터마이징
              </h3>
              <button
                onClick={() => {
                  removeDice(selectedDice.id);
                  selectDice(null);
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                삭제
              </button>
            </div>

            {/* 프리셋 */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">프리셋</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(selectedDice.id, preset.id)}
                    className="px-3 py-1 rounded-lg text-sm transition-colors"
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

            {/* 색상 설정 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">주사위 색상</label>
                <input
                  type="color"
                  value={selectedDice.customization.color}
                  onChange={(e) =>
                    updateDiceCustomization(selectedDice.id, { color: e.target.value })
                  }
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">숫자 색상</label>
                <input
                  type="color"
                  value={selectedDice.customization.numberColor}
                  onChange={(e) =>
                    updateDiceCustomization(selectedDice.id, { numberColor: e.target.value })
                  }
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 재질 설정 */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">재질</label>
              <div className="flex gap-2">
                {(['plastic', 'metal', 'glass', 'wood'] as const).map((material) => (
                  <button
                    key={material}
                    onClick={() =>
                      updateDiceCustomization(selectedDice.id, { material })
                    }
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedDice.customization.material === material
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
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

            {/* 투명도 설정 */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                투명도: {Math.round(selectedDice.customization.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                value={selectedDice.customization.opacity}
                onChange={(e) =>
                  updateDiceCustomization(selectedDice.id, {
                    opacity: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
