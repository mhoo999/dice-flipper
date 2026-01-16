import * as THREE from 'three';
import { DiceCustomization, DICE_CONFIGS } from '@/types/dice';

// 재질별 머티리얼 속성
const MATERIAL_PROPS = {
  plastic: { metalness: 0.1, roughness: 0.4 },
  metal: { metalness: 0.9, roughness: 0.2 },
  glass: { metalness: 0.1, roughness: 0.05 },
  wood: { metalness: 0, roughness: 0.8 },
};

// D6 면 배치 (Three.js BoxGeometry 순서: +X, -X, +Y, -Y, +Z, -Z)
// 전통적인 주사위: 반대편 합이 7
const D6_FACE_VALUES = [3, 4, 1, 6, 2, 5]; // Three.js 면 순서에 맞춤

// 커스텀 이미지가 있는 면 텍스처 생성
function createImageTexture(
  imageUrl: string,
  color: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 배경색
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // 이미지 로드
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // 정사각형 영역에 이미지 맞추기
    const margin = 30;
    const drawSize = size - margin * 2;

    // 이미지 비율 유지하면서 중앙 배치
    const aspectRatio = img.width / img.height;
    let drawWidth = drawSize;
    let drawHeight = drawSize;

    if (aspectRatio > 1) {
      drawHeight = drawSize / aspectRatio;
    } else {
      drawWidth = drawSize * aspectRatio;
    }

    const x = (size - drawWidth) / 2;
    const y = (size - drawHeight) / 2;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    texture.needsUpdate = true;
  };
  img.src = imageUrl;

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 점(pip) 스타일 D6 텍스처 생성
function createD6PipTexture(
  value: number,
  color: string,
  pipColor: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 배경색 (라운드 사각형)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 40);
  ctx.fill();

  // 테두리
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, size - 16, size - 16, 36);
  ctx.stroke();

  // 점 위치 정의
  const pipRadius = size * 0.09;
  const margin = size * 0.24;
  const center = size / 2;

  const pipPositions: Record<number, [number, number][]> = {
    1: [[center, center]],
    2: [[margin, margin], [size - margin, size - margin]],
    3: [[margin, margin], [center, center], [size - margin, size - margin]],
    4: [[margin, margin], [margin, size - margin], [size - margin, margin], [size - margin, size - margin]],
    5: [[margin, margin], [margin, size - margin], [center, center], [size - margin, margin], [size - margin, size - margin]],
    6: [[margin, margin], [margin, center], [margin, size - margin], [size - margin, margin], [size - margin, center], [size - margin, size - margin]],
  };

  // 점 그리기
  ctx.fillStyle = pipColor;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  pipPositions[value]?.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// D6용 머티리얼 배열 생성
export function createD6Materials(customization: DiceCustomization): THREE.MeshStandardMaterial[] {
  const { color, numberColor, material, opacity, faceImages } = customization;
  const matProps = MATERIAL_PROPS[material];

  return D6_FACE_VALUES.map((value) => {
    const faceImage = faceImages?.[value];

    // 커스텀 이미지가 있으면 이미지 텍스처, 없으면 점 텍스처
    const texture = faceImage
      ? createImageTexture(faceImage, color)
      : createD6PipTexture(value, color, numberColor);

    return new THREE.MeshStandardMaterial({
      map: texture,
      ...matProps,
      opacity,
      transparent: opacity < 1,
    });
  });
}

// 일반 다면체용 단일 머티리얼 생성
export function createPolyhederalMaterial(customization: DiceCustomization): THREE.MeshStandardMaterial {
  const { color, material, opacity } = customization;
  const matProps = MATERIAL_PROPS[material];

  return new THREE.MeshStandardMaterial({
    color,
    ...matProps,
    opacity,
    transparent: opacity < 1,
  });
}

// 메인 함수: 주사위 타입에 따라 적절한 머티리얼 반환
export function createDiceMaterials(
  customization: DiceCustomization
): THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] {
  if (customization.type === 'D6') {
    return createD6Materials(customization);
  }
  return createPolyhederalMaterial(customization);
}
