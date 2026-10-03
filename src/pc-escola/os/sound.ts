import type { Settings } from './types';

let ctx: AudioContext | null = null;

const TONES: Record<string, [number, number][]> = {
  open: [[660, 0.05]],
  close: [[440, 0.05]],
  notify: [[880, 0.08], [1175, 0.1]],
  trash: [[300, 0.06], [220, 0.08]],
  error: [[220, 0.15]],
  success: [[784, 0.08], [988, 0.08], [1319, 0.14]],
  boot: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.25]],
  click: [[1000, 0.02]],
};

export function playSound(kind: keyof typeof TONES | string, settings: Pick<Settings, 'volume' | 'muted'>) {
  if (settings.muted || settings.volume <= 0) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const tones = TONES[kind] ?? TONES.click;
    let t = ctx.currentTime;
    const vol = (settings.volume / 100) * 0.08;
    for (const [freq, dur] of tones) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
      t += dur;
    }
  } catch {
    /* audio unavailable */
  }
}
