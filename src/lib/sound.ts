// 주사위 효과음 유틸리티 (Web Audio API 사용)

let audioContext: AudioContext | null = null;

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

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
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

  gainNode.gain.setValueAtTime(0.2 * intensity, ctx.currentTime);
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
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
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

// 동전 던지는 소리 (동전이 테이블에 떨어지며 튕기는 소리)
export function playCoinSound(isMuted: boolean) {
  if (isMuted) return;

  const ctx = getAudioContext();

  // 동전 튕기는 소리 - 점점 빨라지고 작아지는 "딩딩딩" 소리
  const bounces = [0, 0.15, 0.27, 0.36, 0.43, 0.48, 0.52, 0.55];
  const volumes = [0.3, 0.25, 0.2, 0.15, 0.12, 0.08, 0.05, 0.03];

  bounces.forEach((delay, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    const startTime = ctx.currentTime + delay;
    const freq = 4000 + Math.random() * 500;

    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(freq * 0.3, startTime + 0.08);

    gainNode.gain.setValueAtTime(volumes[i], startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  });
}
