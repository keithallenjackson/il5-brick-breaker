export class SoundSystem {
  private audioContext: AudioContext | null = null;
  private muted = false;
  private volume = 0.3;
  private initialized = false;

  init(): void {
    try {
      this.audioContext = new AudioContext();
      this.initialized = true;

      // Handle browser autoplay policy
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      }
    } catch {
      // AudioContext not available
      this.initialized = false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playPaddleHit(hitPosition: number): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const freq = 220 + hitPosition * 660; // 220-880 Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playBrickBreak(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);

    // Sine component
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    oscGain.gain.setValueAtTime(this.volume * 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playWallBounce(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  playPowerUpCollect(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.06;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * noteDuration);

      const start = now + i * noteDuration;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + noteDuration + 0.01);
    });
  }

  playLifeLost(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.5);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playLevelComplete(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    const noteDuration = 0.2;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const start = now + i * noteDuration;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + noteDuration + 0.01);
    });
  }

  playGameOver(): void {
    if (!this.canPlay()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const notes = [261.63, 207.65, 174.61]; // C4, Ab3, F3 (descending minor)
    const noteDuration = 0.4;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const start = now + i * noteDuration;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + noteDuration + 0.01);
    });
  }

  private canPlay(): boolean {
    return this.initialized && !this.muted && this.audioContext !== null;
  }
}
