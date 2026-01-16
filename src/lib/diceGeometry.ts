import * as THREE from 'three';
import { DiceType, DICE_CONFIGS } from '@/types/dice';

// 다면체별 면 방향 벡터 (결과 계산용)
export const FACE_NORMALS: Record<DiceType, THREE.Vector3[]> = {
  D4: [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -0.333, 0.943),
    new THREE.Vector3(0.816, -0.333, -0.471),
    new THREE.Vector3(-0.816, -0.333, -0.471),
  ],
  D6: [
    new THREE.Vector3(0, 0, 1),   // 1
    new THREE.Vector3(0, 0, -1),  // 6
    new THREE.Vector3(0, 1, 0),   // 2
    new THREE.Vector3(0, -1, 0),  // 5
    new THREE.Vector3(1, 0, 0),   // 3
    new THREE.Vector3(-1, 0, 0),  // 4
  ],
  D8: [
    new THREE.Vector3(0.577, 0.577, 0.577),
    new THREE.Vector3(0.577, 0.577, -0.577),
    new THREE.Vector3(0.577, -0.577, 0.577),
    new THREE.Vector3(0.577, -0.577, -0.577),
    new THREE.Vector3(-0.577, 0.577, 0.577),
    new THREE.Vector3(-0.577, 0.577, -0.577),
    new THREE.Vector3(-0.577, -0.577, 0.577),
    new THREE.Vector3(-0.577, -0.577, -0.577),
  ],
  D10: generateD10Normals(),
  D12: generateD12Normals(),
  D20: generateD20Normals(),
};

function generateD10Normals(): THREE.Vector3[] {
  const normals: THREE.Vector3[] = [];
  const angle = (2 * Math.PI) / 5;

  for (let i = 0; i < 5; i++) {
    const theta = i * angle;
    normals.push(new THREE.Vector3(Math.cos(theta), 0.5, Math.sin(theta)).normalize());
  }
  for (let i = 0; i < 5; i++) {
    const theta = i * angle + angle / 2;
    normals.push(new THREE.Vector3(Math.cos(theta), -0.5, Math.sin(theta)).normalize());
  }

  return normals;
}

function generateD12Normals(): THREE.Vector3[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const normals: THREE.Vector3[] = [];

  const coords = [
    [0, phi, 1], [0, phi, -1], [0, -phi, 1], [0, -phi, -1],
    [1, 0, phi], [-1, 0, phi], [1, 0, -phi], [-1, 0, -phi],
    [phi, 1, 0], [phi, -1, 0], [-phi, 1, 0], [-phi, -1, 0],
  ];

  for (const [x, y, z] of coords) {
    normals.push(new THREE.Vector3(x, y, z).normalize());
  }

  return normals;
}

function generateD20Normals(): THREE.Vector3[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const normals: THREE.Vector3[] = [];

  // 20면체의 중심에서 각 면 중심으로의 방향
  const faceDirections = [
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    [0, 1 / phi, phi], [0, 1 / phi, -phi], [0, -1 / phi, phi], [0, -1 / phi, -phi],
    [1 / phi, phi, 0], [1 / phi, -phi, 0], [-1 / phi, phi, 0], [-1 / phi, -phi, 0],
    [phi, 0, 1 / phi], [phi, 0, -1 / phi], [-phi, 0, 1 / phi], [-phi, 0, -1 / phi],
  ];

  for (const [x, y, z] of faceDirections) {
    normals.push(new THREE.Vector3(x, y, z).normalize());
  }

  return normals;
}

// 주사위가 정지했을 때 상단 면 결과 계산
export function calculateDiceResult(
  diceType: DiceType,
  quaternion: THREE.Quaternion
): number {
  const config = DICE_CONFIGS[diceType];
  const upVector = new THREE.Vector3(0, 1, 0);
  const normals = FACE_NORMALS[diceType];

  let maxDot = -Infinity;
  let resultIndex = 0;

  normals.forEach((normal, index) => {
    const rotatedNormal = normal.clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(upVector);

    if (dot > maxDot) {
      maxDot = dot;
      resultIndex = index;
    }
  });

  // D4는 특별한 번호 배치
  if (diceType === 'D4') {
    return resultIndex + 1;
  }

  // D6의 반대면 합이 7 규칙 적용
  if (diceType === 'D6') {
    const faceValues = [1, 6, 2, 5, 3, 4];
    return faceValues[resultIndex];
  }

  // 일반적인 경우
  return resultIndex + 1;
}

// 면에 숫자/이미지를 그리는 캔버스 텍스처 생성
export function createDiceTexture(
  faceCount: number,
  color: string,
  numberColor: string,
  faceImages?: Record<number, string>
): THREE.CanvasTexture[] {
  const textures: THREE.CanvasTexture[] = [];
  const size = 256;

  for (let i = 1; i <= faceCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 배경색
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    if (faceImages && faceImages[i]) {
      // 커스텀 이미지가 있으면 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.src = faceImages[i];
    } else {
      // 숫자 그리기
      ctx.fillStyle = numberColor;
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), size / 2, size / 2);

      // 6과 9 구분을 위한 밑줄
      if (i === 6 || i === 9) {
        ctx.fillRect(size / 2 - 40, size / 2 + 60, 80, 8);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    textures.push(texture);
  }

  return textures;
}

// D4용 특별 텍스처 (꼭짓점에 숫자가 표시됨)
export function createD4Texture(
  color: string,
  numberColor: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = numberColor;
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';

  // D4는 각 면의 모서리에 숫자를 표시
  const positions = [
    { x: size / 2, y: size * 0.25 },
    { x: size * 0.25, y: size * 0.75 },
    { x: size * 0.75, y: size * 0.75 },
  ];

  positions.forEach((pos, index) => {
    ctx.fillText(((index % 4) + 1).toString(), pos.x, pos.y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
