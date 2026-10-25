// Web Audio API Synthesizer & Sound Design Engine for TailorFit Motion Film
// Generates 124 BPM rhythmic groove and synchronized UI sound effects in real time.

class MotionAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private nextBeatTime: number = 0;
  private currentStep: number = 0;
  private schedulerTimer: number | null = null;
  private isRunning: boolean = false;
  private tempo: number = 124; // 124 BPM

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
  }

  // --- UI Sound Effects ---

  // Mechanical switch / crisp mouse click
  public playClick(pitch: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 * pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80 * pitch, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // High-frequency metric tick (when numbers increment)
  public playMetricTick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // Velvet cloth / pneumatic 360° rotation swoosh
  public playSwoosh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(ctx.currentTime + 0.42);
  }

  // Sub-bass impact drop
  public playSubDrop() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  }

  // Harmonic luxury outro bell/chime
  public playOutroChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (C Major chord)
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      const startTime = ctx.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 2.6);
    });
  }

  // --- 124 BPM Soundtrack Sequencer ---
  public startMusic(currentSeconds: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    this.isRunning = true;
    this.nextBeatTime = ctx.currentTime + 0.05;
    const stepDuration = 60 / this.tempo / 4; // 16th notes
    this.currentStep = Math.floor(currentSeconds / stepDuration);

    const schedule = () => {
      if (!this.isRunning || !ctx) return;
      while (this.nextBeatTime < ctx.currentTime + 0.15) {
        this.scheduleStep(this.currentStep, this.nextBeatTime);
        this.nextBeatTime += stepDuration;
        this.currentStep++;
      }
      this.schedulerTimer = window.setTimeout(schedule, 25);
    };

    schedule();
  }

  public stopMusic() {
    this.isRunning = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private scheduleStep(step: number, time: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const stepInMeasure = step % 16;
    const measure = Math.floor(step / 16);

    // Warm electronic kick drum on beats 1, 5, 9, 13 (four-on-the-floor)
    if (stepInMeasure % 4 === 0 && measure > 1 && measure < 30) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.frequency.setValueAtTime(130, time);
      kickOsc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.15);
    }

    // Snappy closed hat on off-beats (steps 2, 6, 10, 14)
    if (stepInMeasure % 4 === 2 && measure > 2 && measure < 30) {
      const hatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const data = hatBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12;

      const hatSource = ctx.createBufferSource();
      hatSource.buffer = hatBuffer;
      const hatFilter = ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7000, time);

      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(0.18, time);
      hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.masterGain);
      hatSource.start(time);
      hatSource.stop(time + 0.045);
    }

    // Melodic deep bass note on measure starts
    if (stepInMeasure === 0 && measure > 1 && measure < 30) {
      const bassNotes = [55, 65.41, 73.42, 49]; // A1, C2, D2, G1 progression
      const note = bassNotes[measure % bassNotes.length];

      const bassOsc = ctx.createOscillator();
      const bassFilter = ctx.createBiquadFilter();
      const bassGain = ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(note, time);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, time);
      bassFilter.frequency.exponentialRampToValueAtTime(180, time + 0.4);

      bassGain.gain.setValueAtTime(0.25, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(time);
      bassOsc.stop(time + 0.5);
    }
  }
}

export const audioEngine = new MotionAudioEngine();
