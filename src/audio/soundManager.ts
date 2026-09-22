// High-fidelity procedural Web Audio engine for GABRIELA
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private musicVol: number = 0.6;
  private sfxVol: number = 0.7;

  // Active ambient nodes
  private rainNode: AudioNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private isRainPlaying: boolean = false;
  private isDronePlaying: boolean = false;
  private clockInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : this.masterVol, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setVolume(master: number, music?: number, sfx?: number) {
    this.masterVol = master;
    if (music !== undefined) this.musicVol = music;
    if (sfx !== undefined) this.sfxVol = sfx;

    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(master, this.ctx.currentTime);
    }
    if (this.ctx && this.musicGain && music !== undefined) {
      this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    }
    if (this.ctx && this.sfxGain && sfx !== undefined) {
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
  }

  // --- AMBIENCE: RAIN ---
  public startRain() {
    if (this.isRainPlaying || !this.ctx || !this.ambientGain) return;
    this.isRainPlaying = true;

    // Buffer noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for deep muffled rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    // Subtle gentle gain
    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.ambientGain);

    whiteNoise.start();
    this.rainNode = whiteNoise;
  }

  public stopRain() {
    if (this.rainNode) {
      try {
        (this.rainNode as AudioScheduledSourceNode).stop();
      } catch {}
      this.rainNode = null;
    }
    this.isRainPlaying = false;
  }

  // --- AMBIENCE: HORROR DRONE ---
  public startDrone(pitch: number = 48) {
    if (this.isDronePlaying || !this.ctx || !this.musicGain) return;
    this.isDronePlaying = true;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(pitch, this.ctx.currentTime); // e.g. low C

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(pitch * 1.01, this.ctx.currentTime); // microtonal detune

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    // LFO to slowly sweep filter
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);

    lfo.connect(filter.frequency);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.musicGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
  }

  public stopDrone() {
    if (this.droneOsc1) {
      try { this.droneOsc1.stop(); } catch {}
      this.droneOsc1 = null;
    }
    if (this.droneOsc2) {
      try { this.droneOsc2.stop(); } catch {}
      this.droneOsc2 = null;
    }
    this.isDronePlaying = false;
  }

  // --- AMBIENCE: CLOCK TICKING ---
  public startClock(speedMs: number = 1000) {
    if (this.clockInterval) clearInterval(this.clockInterval);
    let tickAlt = false;
    this.clockInterval = window.setInterval(() => {
      this.playClockTick(tickAlt);
      tickAlt = !tickAlt;
    }, speedMs);
  }

  public stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  public playClockTick(tickAlt: boolean = false) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(tickAlt ? 1300 : 1050, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // --- SFX: FOOTSTEP ---
  public playFootstep(material: 'tatami' | 'wood' | 'stone' = 'wood') {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const freq = material === 'tatami' ? 85 : material === 'wood' ? 140 : 210;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime( material === 'stone' ? 500 : 250, this.ctx.currentTime );

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // --- SFX: CLUE DISCOVERED ---
  public playClueDiscovered() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 eerie chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.06, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.65);
    });
  }

  // --- SFX: ANOMALY / DISSONANCE STING ---
  public playAnomalySting() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Tritone dissonance
    [130.81, 185.00, 370.00, 523.25].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  // --- SFX: TELEPHONE RING (03:17) ---
  public playPhoneRing() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Japanese rotary telephone dual cadence (400Hz + 450Hz, 1s ring, 2s pause)
    [400, 450].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Ring pulse
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.setValueAtTime(0.09, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  // --- SFX: DOOR CREAK / OPEN ---
  public playDoorCreak() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(115, now + 0.35);
    osc.frequency.linearRampToValueAtTime(60, now + 0.7);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  // --- SFX: DIALOGUE TYPING ---
  public playTypewriter() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // --- SFX: RADIO STATIC / GLITCH ---
  public playRadioStatic(durationSec: number = 0.5) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * durationSec;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.3 ? 0.8 : 0.1);
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationSec);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start();
  }

  // --- BACKGROUND MUSIC: calm generative koto / piano over a soft pad ---
  private musicTimer: number | null = null;
  private musicNodes: AudioNode[] = [];
  private musicOn = false;

  public startMusic() {
    if (!this.ctx || !this.musicGain || this.musicOn) return;
    this.musicOn = true;
    const ctx = this.ctx;

    // bus with a gentle feedback delay ("room")
    const bus = ctx.createGain();
    bus.gain.value = 0.9;
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.46;
    const fb = ctx.createGain();
    fb.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    bus.connect(this.musicGain);
    bus.connect(delay);
    delay.connect(fb);
    fb.connect(lp);
    lp.connect(delay);
    delay.connect(wet);
    wet.connect(this.musicGain);
    this.musicNodes.push(bus, delay, fb, wet, lp);

    // soft pad: two detuned triangles, slow swell
    const padGain = ctx.createGain();
    padGain.gain.value = 0.0;
    const padLp = ctx.createBiquadFilter();
    padLp.type = 'lowpass';
    padLp.frequency.value = 520;
    padGain.connect(padLp);
    padLp.connect(bus);
    const padOscs: OscillatorNode[] = [];
    [146.83, 220.0, 293.66].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? 'sine' : 'triangle';
      o.frequency.value = f * (1 + (i - 1) * 0.0015);
      const g = ctx.createGain();
      g.gain.value = i === 1 ? 0.028 : 0.018;
      o.connect(g);
      g.connect(padGain);
      o.start();
      padOscs.push(o);
      this.musicNodes.push(o, g);
    });
    padGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 6);
    const padLfo = ctx.createOscillator();
    padLfo.frequency.value = 0.05;
    const padLfoG = ctx.createGain();
    padLfoG.gain.value = 180;
    padLfo.connect(padLfoG);
    padLfoG.connect(padLp.frequency);
    padLfo.start();
    this.musicNodes.push(padGain, padLp, padLfo, padLfoG);

    // koto-like pluck
    const pluck = (freq: number, when: number, vel: number) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, when);
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(freq * 2.01, when);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(freq * 6, when);
      f.frequency.exponentialRampToValueAtTime(freq * 1.5, when + 1.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vel, when + 0.012);
      g.gain.exponentialRampToValueAtTime(vel * 0.35, when + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 2.6);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vel * 0.22, when);
      g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
      o.connect(f);
      f.connect(g);
      g.connect(bus);
      o2.connect(g2);
      g2.connect(bus);
      o.start(when);
      o2.start(when);
      o.stop(when + 2.8);
      o2.stop(when + 0.6);
    };

    // D minor pentatonic phrases (yo/in-scale flavour), slow & sparse
    const scale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99];
    let step = 0;
    let lastIdx = 3;
    const schedule = () => {
      if (!this.musicOn || !this.ctx) return;
      const now = this.ctx.currentTime;
      // pick a nearby scale degree (stepwise melodies feel calmer)
      const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
      lastIdx = Math.max(0, Math.min(scale.length - 1, lastIdx + move));
      const vel = 0.05 + Math.random() * 0.035;
      pluck(scale[lastIdx], now + 0.05, vel);
      // occasional soft harmony a fifth/octave below
      if (step % 4 === 0 && Math.random() > 0.4) pluck(scale[Math.max(0, lastIdx - 4)] / 2, now + 0.2, vel * 0.5);
      step++;
      const rest = step % 8 === 7 ? 3.4 : 1.15 + Math.random() * 1.5;
      this.musicTimer = window.setTimeout(schedule, rest * 1000);
    };
    this.musicTimer = window.setTimeout(schedule, 1800);
  }

  public stopMusic() {
    this.musicOn = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicNodes.forEach((n) => {
      try {
        (n as OscillatorNode).stop?.();
      } catch {}
      try {
        n.disconnect();
      } catch {}
    });
    this.musicNodes = [];
  }

  // --- VOICE BLIPS (speech effect, one timbre per character) ---
  public playVoiceBlip(voice: 'gabriela' | 'chiyo' | 'unknown' | 'thought') {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (voice === 'thought') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + Math.random() * 120, now);
      gain.gain.setValueAtTime(0.007, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.045);
      return;
    }
    if (voice === 'unknown') {
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(600 + Math.random() * 900, now);
      f.Q.setValueAtTime(6, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, now);
      src.connect(f);
      f.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      return;
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = voice === 'chiyo' ? 'triangle' : 'sine';
    const base = voice === 'gabriela' ? 540 : 320;
    const f0 = base * (0.94 + Math.random() * 0.14);
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.82, now + 0.05);
    gain.gain.setValueAtTime(voice === 'chiyo' ? 0.03 : 0.026, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // --- SFX: FURIN WIND CHIME ---
  public playChime() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [2093, 3136, 4186].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.004), now);
      gain.gain.setValueAtTime(0.045 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 - i * 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  // --- UI: MENU NAVIGATION ---
  public playMenuMove() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1180, now);
    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playMenuSelect() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [660, 990].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      gain.gain.setValueAtTime(0.04, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    });
  }

  // --- SFX: HEARTBEAT (PANIC / COMBAT) ---
  public playHeartbeat() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.14].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 55 : 45, now + offset);
      osc.frequency.exponentialRampToValueAtTime(25, now + offset + 0.15);

      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }
}

export const soundManager = new SoundManager();
