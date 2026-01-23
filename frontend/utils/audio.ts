let audioCtx: AudioContext | null = null;
let muted = false;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleMute = () => {
  muted = !muted;
  return muted;
};

const playOscillator = (freq: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth', duration: number, gainVal: number) => {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playTick = () => {
  // Clear, crisp mechanical click
  playOscillator(1200, 'sine', 0.03, 0.05);
};

export const playWin = (multiplier: number) => {
  if (!audioCtx || muted) return;
  
  // Celebratory chord for wins
  const baseFreq = multiplier > 2 ? 523.25 : 261.63; // C5 or C4
  const majorChord = [1, 1.25, 1.5, 2]; // Major intervals
  
  majorChord.forEach((interval, i) => {
    setTimeout(() => {
      playOscillator(baseFreq * interval, 'triangle', 0.4, 0.1);
    }, i * 60);
  });
};

export const playLoss = () => {
    // Subtle low thud
    playOscillator(100, 'sawtooth', 0.15, 0.05);
}