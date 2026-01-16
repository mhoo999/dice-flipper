// 주사위 타입 정의
export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';

export interface DiceConfig {
  type: DiceType;
  faces: number;
  name: string;
  description: string;
}

export const DICE_CONFIGS: Record<DiceType, DiceConfig> = {
  D4: { type: 'D4', faces: 4, name: '4면체', description: '정사면체 (Tetrahedron)' },
  D6: { type: 'D6', faces: 6, name: '6면체', description: '정육면체 (Cube)' },
  D8: { type: 'D8', faces: 8, name: '8면체', description: '정팔면체 (Octahedron)' },
  D10: { type: 'D10', faces: 10, name: '10면체', description: '오각반면체 (Pentagonal Trapezohedron)' },
  D12: { type: 'D12', faces: 12, name: '12면체', description: '정십이면체 (Dodecahedron)' },
  D20: { type: 'D20', faces: 20, name: '20면체', description: '정이십면체 (Icosahedron)' },
};

// 주사위 커스터마이징 옵션
export interface DiceCustomization {
  id: string;
  type: DiceType;
  color: string;
  numberColor: string;
  material: 'plastic' | 'metal' | 'glass' | 'wood';
  opacity: number;
  faceImages?: Record<number, string>; // 면 번호 → 이미지 URL
}

// 주사위 상태
export interface DiceState {
  id: string;
  customization: DiceCustomization;
  position: [number, number, number];
  rotation: [number, number, number];
  result: number | null;
  isRolling: boolean;
}

// 굴리기 결과
export interface RollResult {
  diceId: string;
  value: number;
  timestamp: number;
}

// 프리셋 테마
export interface DicePreset {
  id: string;
  name: string;
  customization: Omit<DiceCustomization, 'id' | 'type'>;
}

export const DEFAULT_PRESETS: DicePreset[] = [
  {
    id: 'classic-white',
    name: '클래식 화이트',
    customization: {
      color: '#ffffff',
      numberColor: '#000000',
      material: 'plastic',
      opacity: 1,
    },
  },
  {
    id: 'classic-red',
    name: '클래식 레드',
    customization: {
      color: '#dc2626',
      numberColor: '#ffffff',
      material: 'plastic',
      opacity: 1,
    },
  },
  {
    id: 'midnight-blue',
    name: '미드나잇 블루',
    customization: {
      color: '#1e3a5f',
      numberColor: '#ffd700',
      material: 'plastic',
      opacity: 1,
    },
  },
  {
    id: 'crystal-clear',
    name: '크리스탈 클리어',
    customization: {
      color: '#88ccff',
      numberColor: '#ffffff',
      material: 'glass',
      opacity: 0.7,
    },
  },
  {
    id: 'golden-metal',
    name: '골든 메탈',
    customization: {
      color: '#ffd700',
      numberColor: '#000000',
      material: 'metal',
      opacity: 1,
    },
  },
  {
    id: 'wooden-oak',
    name: '오크 우드',
    customization: {
      color: '#8b4513',
      numberColor: '#f5f5dc',
      material: 'wood',
      opacity: 1,
    },
  },
];
