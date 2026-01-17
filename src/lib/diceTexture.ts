import * as THREE from 'three';
import { DiceCustomization } from '@/types/dice';

// 기본 주사위 색상
const DEFAULT_DICE_COLOR = '#f5f5f5';

// D6 면 배치 (Three.js BoxGeometry 순서: +X, -X, +Y, -Y, +Z, -Z)
const D6_FACE_VALUES = [3, 4, 1, 6, 2, 5];


// 텍스트 텍스처 생성
function createTextTexture(text: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 배경색
  ctx.fillStyle = DEFAULT_DICE_COLOR;
  ctx.fillRect(0, 0, size, size);

  // 텍스트 설정
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 텍스트 길이에 따라 폰트 크기 조정
  const maxFontSize = 200;
  const minFontSize = 60;
  let fontSize = maxFontSize;

  if (text.length > 1) {
    fontSize = Math.max(minFontSize, maxFontSize - (text.length - 1) * 30);
  }

  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 주사위 눈 텍스처 생성
function createDiceDotTexture(value: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 배경색
  ctx.fillStyle = DEFAULT_DICE_COLOR;
  ctx.fillRect(0, 0, size, size);

  // 눈 색상
  ctx.fillStyle = '#1a1a1a';
  
  // 눈 반지름과 간격
  const dotRadius = 35;
  const margin = 10;
  const spacing = (size - margin * 2) / 3;

  // 각 면에 맞는 눈 패턴 그리기
  switch (value) {
    case 1:
      // 중앙 1개
      drawDot(ctx, size / 2, size / 2, dotRadius);
      break;
    
    case 2:
      // 대각선 2개
      drawDot(ctx, margin + spacing, margin + spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, size - margin - spacing, dotRadius);
      break;
    
    case 3:
      // 대각선 3개
      drawDot(ctx, margin + spacing, margin + spacing, dotRadius);
      drawDot(ctx, size / 2, size / 2, dotRadius);
      drawDot(ctx, size - margin - spacing, size - margin - spacing, dotRadius);
      break;
    
    case 4:
      // 네 모서리 4개
      drawDot(ctx, margin + spacing, margin + spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, margin + spacing, dotRadius);
      drawDot(ctx, margin + spacing, size - margin - spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, size - margin - spacing, dotRadius);
      break;
    
    case 5:
      // 네 모서리 4개 + 중앙 1개
      drawDot(ctx, margin + spacing, margin + spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, margin + spacing, dotRadius);
      drawDot(ctx, size / 2, size / 2, dotRadius);
      drawDot(ctx, margin + spacing, size - margin - spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, size - margin - spacing, dotRadius);
      break;
    
    case 6:
      // 좌우 3개씩 2줄
      // 왼쪽 열
      drawDot(ctx, margin + spacing, margin + spacing, dotRadius);
      drawDot(ctx, margin + spacing, size / 2, dotRadius);
      drawDot(ctx, margin + spacing, size - margin - spacing, dotRadius);
      // 오른쪽 열
      drawDot(ctx, size - margin - spacing, margin + spacing, dotRadius);
      drawDot(ctx, size - margin - spacing, size / 2, dotRadius);
      drawDot(ctx, size - margin - spacing, size - margin - spacing, dotRadius);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 원형 눈 그리기 헬퍼 함수
function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
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
  const { faceImages, faceTexts } = customization;

  return D6_FACE_VALUES.map((value) => {
    const faceImage = faceImages?.[value];
    const faceText = faceTexts?.[value];

    let texture: THREE.CanvasTexture;

    if (faceImage) {
      // 이미지가 있으면 이미지 텍스처
      texture = createImageTexture(faceImage);
    } else if (faceText && faceText.trim() !== '') {
      // 커스텀 텍스트가 있으면 텍스트 텍스처
      texture = createTextTexture(faceText);
    } else {
      // 기본값: 주사위 눈 텍스처
      texture = createDiceDotTexture(value);
    }

    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.4,
      flatShading: true,
    });
  });
}

// 메인 함수 (D6만 지원)
export function createDiceMaterials(
  customization: DiceCustomization
): THREE.MeshStandardMaterial[] | null {
  // D6는 항상 면별 텍스처 지원 (눈 패턴 포함)
  if (customization.type === 'D6') {
    return createD6Materials(customization);
  }

  return null;
}
