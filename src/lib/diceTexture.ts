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

// 숫자 텍스처 생성 (다른 주사위 타입용)
function createNumberTexture(value: number, faceCount: number, type?: string, faceIndex?: number): THREE.CanvasTexture {
  try {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return createEmptyTexture();
    }

    // 배경색
    ctx.fillStyle = DEFAULT_DICE_COLOR;
    ctx.fillRect(0, 0, size, size);

    // 숫자 색상
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 면 개수에 따라 폰트 크기 조정 (더 작게 - 숫자가 잘리지 않도록)
    let fontSize = 90;
    if (faceCount > 10) {
      fontSize = 80; // D10, D12, D20
    } else if (faceCount > 6) {
      fontSize = 85; // D8
    } else {
      fontSize = 90; // D4
    }

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    
    // 텍스트 위치 계산
    // D4 면별 오프셋: 1은 오른쪽으로, 2는 위로, 3은 아래로, 4는 왼쪽으로
    let textX = size / 2;
    let textY = size / 2;
    
    if (type === 'D4' && faceIndex !== undefined) {
      // 면별 미세 조정
      const offset = size * 0.1; // 기본 오프셋
      if (value === 1) {
        textX += offset * 0.5; // 오른쪽으로 살짝
        textY -= offset * 0.5; // 위로 살짝
      } else if (value === 2) {
        // 뒤틀려보이는 문제 해결을 위해 조정
        textX -= offset * 0.3; // 살짝 왼쪽
        textY -= offset * 0.3; // 살짝 위
      } else if (value === 3) {
        // 뒤틀려보이는 문제 해결을 위해 조정
        textX += offset * 0.3; // 살짝 오른쪽
        textY += offset * 0.3; // 살짝 아래
      } else if (value === 4) {
        textX -= offset * 0.5; // 왼쪽으로 살짝
        textY += offset * 0.5; // 아래로 살짝
      }
    }
    
    ctx.fillText(value.toString(), textX, textY);
    
    // 디버깅: 실제로 그려진 텍스트 크기 확인
    const metrics = ctx.measureText(value.toString());
    
    // 디버깅: 실제로 그려진 텍스트 크기 확인
    console.log(`Number texture for ${value}: fontSize=${fontSize}, width=${metrics.width}, x=${textX}, y=${textY}`);

    // 6과 9 구분을 위한 밑줄
    if (value < 10 && (value === 6 || value === 9)) {
      const underlineWidth = fontSize * 0.4;
      const underlineHeight = fontSize * 0.05;
      ctx.fillRect(
        size / 2 - underlineWidth / 2,
        size / 2 + fontSize * 0.3,
        underlineWidth,
        underlineHeight
      );
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    // 텍스처가 면을 넘어가지 않도록 설정
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    return texture;
  } catch (error) {
    console.error('Error creating number texture for value', value, error);
    return createEmptyTexture();
  }
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

// 빈 면 텍스처 생성 헬퍼 함수
function createEmptyTexture(): THREE.CanvasTexture {
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

// 다른 주사위 타입용 머티리얼 배열 생성
function createOtherDiceMaterials(customization: DiceCustomization): THREE.MeshStandardMaterial[] {
  try {
    const { type, faceImages, faceTexts } = customization;
    // 실제 지오메트리 면 개수 사용 (D10은 dodecahedronGeometry로 12면 사용)
    const geometryFaceCount = type === 'D4' ? 4 : type === 'D8' ? 8 : type === 'D10' ? 12 : type === 'D12' ? 12 : 20;
    // 표시할 숫자 범위 (DICE_CONFIGS의 faces 사용)
    const displayFaceCount = type === 'D4' ? 4 : type === 'D8' ? 8 : type === 'D10' ? 10 : type === 'D12' ? 12 : 20;

    console.log('Creating materials for', type, 'geometryFaceCount:', geometryFaceCount, 'displayFaceCount:', displayFaceCount);

    const materials = Array.from({ length: geometryFaceCount }, (_, index) => {
    // D10의 경우 12면이지만 1-10 숫자만 사용 (나머지는 빈 텍스처)
    const value = index < displayFaceCount ? index + 1 : null;
    const faceImage = value ? faceImages?.[value] : undefined;
    const faceText = value ? faceTexts?.[value] : undefined;

    let texture: THREE.CanvasTexture;

    if (faceImage) {
      // 이미지가 있으면 이미지 텍스처
      texture = createImageTexture(faceImage);
    } else if (faceText && faceText.trim() !== '') {
      // 커스텀 텍스트가 있으면 텍스트 텍스처
      texture = createTextTexture(faceText);
    } else {
      // 숫자 텍스처 제거 - 모든 다면체 주사위에서 숫자 표시 안 함
      // D10의 경우 11-12번 면도 빈 텍스처 (dodecahedronGeometry는 12면)
      texture = createEmptyTexture();
    }

    // 텍스처를 map으로 사용
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.4,
      flatShading: true,
    });
    
    // 텍스처 설정
    if (texture) {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(1, 1);
      
      // 텍스처 설정
      texture.offset.set(0, 0);
    }
    
    // 디버깅: 각 material 검증
    if (!texture || !texture.image) {
      console.warn('Material texture issue at index', index, 'for', type, 'value:', value);
    }
    
    return material;
    });

    // 디버깅: materials 배열 검증
    const validMaterials = materials.filter(m => m && m.map);
    console.log('Created', materials.length, 'materials for', type, '- valid:', validMaterials.length);
    if (validMaterials.length !== materials.length) {
      console.warn('Some materials are invalid for', type);
    }
    
    return materials;
  } catch (error) {
    console.error('Error creating materials for', customization.type, error);
    // 에러 발생 시 기본 재질 배열 반환
    const geometryFaceCount = customization.type === 'D4' ? 4 : customization.type === 'D8' ? 8 : customization.type === 'D10' ? 12 : customization.type === 'D12' ? 12 : 20;
    return Array.from({ length: geometryFaceCount }, () => {
      return new THREE.MeshStandardMaterial({
        color: DEFAULT_DICE_COLOR,
        metalness: 0.1,
        roughness: 0.4,
        flatShading: true,
      });
    });
  }
}

// 메인 함수
export function createDiceMaterials(
  customization: DiceCustomization
): THREE.MeshStandardMaterial[] | null {
  // D6는 항상 면별 텍스처 지원 (눈 패턴 포함)
  if (customization.type === 'D6') {
    return createD6Materials(customization);
  }

  // 다른 주사위 타입들도 숫자 텍스처 지원
  if (['D4', 'D8', 'D10', 'D12', 'D20'].includes(customization.type)) {
    return createOtherDiceMaterials(customization);
  }

  return null;
}
