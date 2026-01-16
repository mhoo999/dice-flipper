import * as THREE from 'three';
import { DiceCustomization } from '@/types/dice';

// 기본 주사위 색상
const DEFAULT_DICE_COLOR = '#f5f5f5';

// D6 면 배치 (Three.js BoxGeometry 순서: +X, -X, +Y, -Y, +Z, -Z)
const D6_FACE_VALUES = [3, 4, 1, 6, 2, 5];

// 빈 면 텍스처 생성 (보더 없이 단색)
function createEmptyFaceTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = DEFAULT_DICE_COLOR;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 커스텀 이미지가 있는 면 텍스처 생성 (보더 없이)
function createImageTexture(imageUrl: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 배경색
  ctx.fillStyle = DEFAULT_DICE_COLOR;
  ctx.fillRect(0, 0, size, size);

  // 이미지 로드
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const margin = 20;
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

// D6용 머티리얼 배열 생성
export function createD6Materials(customization: DiceCustomization): THREE.MeshStandardMaterial[] {
  const { faceImages } = customization;

  return D6_FACE_VALUES.map((value) => {
    const faceImage = faceImages?.[value];

    const texture = faceImage
      ? createImageTexture(faceImage)
      : createEmptyFaceTexture();

    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.4,
      flatShading: true,
    });
  });
}

// 메인 함수
export function createDiceMaterials(
  customization: DiceCustomization
): THREE.MeshStandardMaterial[] | null {
  // D6만 면별 텍스처 (이미지가 있을 때)
  if (customization.type === 'D6') {
    const hasImages = customization.faceImages && Object.keys(customization.faceImages).length > 0;
    if (hasImages) {
      return createD6Materials(customization);
    }
  }
  // 나머지는 null 반환 (Edges만 사용)
  return null;
}
