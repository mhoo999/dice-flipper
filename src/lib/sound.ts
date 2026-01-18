// 주사위 효과음 유틸리티 (Web Audio API 사용)

let audioContext: AudioContext | null = null;

// 진동 함수 (모바일)
export function vibrate(duration: number = 50) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// 주사위 던지는 소리 (휙 소리)
export function playThrowSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

  gainNode.gain.setValueAtTime(0.25, ctx.currentTime); // 전체 볼륨 조정
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

// 주사위 충돌/굴러가는 소리
export function playBounceSound(isMuted: boolean, intensity: number = 1) {
  if (isMuted) return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // 낮은 톤의 "통통" 소리
  oscillator.type = 'triangle';
  const baseFreq = 80 + Math.random() * 60;
  oscillator.frequency.setValueAtTime(baseFreq * intensity, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.08);

  gainNode.gain.setValueAtTime(0.15 * intensity, ctx.currentTime); // 전체 볼륨 조정
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.08);
}

// 주사위 멈춤 소리 (결과 확정)
export function playResultSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();

  // 두 개의 톤으로 "딩" 소리
  [523.25, 659.25].forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    const startTime = ctx.currentTime + i * 0.05;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.02); // 전체 볼륨 조정
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
}

// 버튼 클릭 소리
export function playClickSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
}

// 동전 충돌 소리 (금속성 "칭" 소리)
export function playCoinSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // 금속성 동전 소리 - 여러 하모닉스 조합
  const fundamentalFreq = 2500 + Math.random() * 300;
  const harmonics = [1, 2.4, 3.8, 5.2]; // 비정수 배음으로 금속 느낌
  const harmonicGains = [0.15, 0.08, 0.04, 0.02]; // 전체 볼륨 조정 (기존의 약 50%)

  harmonics.forEach((harmonic, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(fundamentalFreq * harmonic, now);

    // 하이패스 필터로 금속 느낌 강조
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(1, now);

    // 빠른 어택, 빠른 디케이
    gainNode.gain.setValueAtTime(harmonicGains[i], now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  });

  // 충격 노이즈 (초기 임팩트)
  const bufferSize = ctx.sampleRate * 0.02;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();

  noiseSource.buffer = noiseBuffer;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(3000, now);
  noiseFilter.Q.setValueAtTime(2, now);

  noiseGain.gain.setValueAtTime(0.08, now); // 전체 볼륨 조정 (기존의 약 50%)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  noiseSource.start(now);
  noiseSource.stop(now + 0.03);
}

// 동전 스핀 소리 (차징 중 흔들림)
export function playCoinSpinSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1800 + Math.random() * 400, now);

  gainNode.gain.setValueAtTime(0.05, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  oscillator.start(now);
  oscillator.stop(now + 0.05);
}
