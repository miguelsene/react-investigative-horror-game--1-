import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  hasSavedGame: boolean;
  loadProgress: number;
  ready: boolean;
  onContinue: (slot: number) => void;
  onNewGame: (slot: number) => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onExtra: () => void;
  onDeveloper: () => void;
  onAudioStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  loadProgress,
  ready,
  onContinue,
  onNewGame,
  onOpenChapters,
  onOpenSettings,
  onExtra,
  onDeveloper,
  onAudioStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'attract' | 'menu'>('attract');
  const [selected, setSelected] = useState<number>(hasSavedGame ? 0 : 1);
  const [subliminal, setSubliminal] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [slotPicker, setSlotPicker] = useState<'new' | 'continue' | null>(null);

  /* ---- Fog + film grain canvas (Silent Hill-style attract) ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360;
    const H = 200;
    canvas.width = W;
    canvas.height = H;
    const noise = document.createElement('canvas');
    noise.width = W;
    noise.height = H;
    const nctx = noise.getContext('2d')!;
    const nimg = nctx.createImageData(W, H);
    const blobs = Array.from({ length: 16 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 60 + Math.random() * 90,
      s: 0.12 + Math.random() * 0.3,
      p: Math.random() * Math.PI * 2,
      a: 0.05 + Math.random() * 0.08,
      dir: i % 2 ? 1 : -1,
    }));
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = (now - t0) / 1000;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5,6,9,0.42)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach((b) => {
        const raw = b.x + Math.sin(t * b.s + b.p) * 40 + t * 5 * b.dir;
        const x = ((raw % (W + 240)) + W + 240) % (W + 240) - 120;
        const y = b.y + Math.cos(t * b.s * 0.7 + b.p) * 18;
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, `rgba(150,160,180,${b.a})`);
        g.addColorStop(1, 'rgba(150,160,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      const d = nimg.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 255;
      }
      nctx.putImageData(nimg, 0, 0);
      ctx.globalAlpha = 0.085;
      ctx.drawImage(noise, 0, 0);
      ctx.globalAlpha = 1;
      const roll = (t * 30) % (H + 40);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, roll - 20, W, 6);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- Subliminal 03:17 flash ---- */
  useEffect(() => {
    let timeout = 0;
    const loop = () => {
      timeout = window.setTimeout(() => {
        setSubliminal(true);
        soundManager.playRadioStatic(0.12);
        window.setTimeout(() => setSubliminal(false), 110);
        loop();
      }, 7000 + Math.random() * 9000);
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  const start = useCallback(() => {
    soundManager.init();
    soundManager.resume();
    soundManager.startRain();
    soundManager.startDrone(42);
    soundManager.playRadioStatic(0.6);
    onAudioStart();
    setPhase('menu');
  }, [onAudioStart]);

  const items = [
    { id: 'continue', label: 'CONTINUAR', sub: 'Retomar o caso salvo', disabled: !hasSavedGame },
    { id: 'new', label: 'NOVO JOGO', sub: 'Capítulo 1 — A Casa', disabled: false },
    { id: 'chapters', label: 'CAPÍTULOS', sub: 'Arquivo de casos', disabled: false },
    { id: 'options', label: 'OPÇÕES', sub: 'Áudio, vídeo e dados', disabled: false },
    { id: 'extra', label: 'EXTRA', sub: 'Simulação de encontro noturno', disabled: false },
    { id: 'developer', label: 'ENTRAR COMO DEV', sub: 'Pular diálogos e missões domésticas', disabled: false },
  ];

  const run = useCallback(
    (idx: number) => {
      const it = items[idx];
      if (!it || it.disabled) return;
      soundManager.playMenuSelect();
      if (it.id === 'new') {
        setSlotPicker('new');
      } else if (it.id === 'continue') setSlotPicker('continue');
      else if (it.id === 'chapters') onOpenChapters();
      else if (it.id === 'options') onOpenSettings();
      else if (it.id === 'extra') onExtra();
      else onDeveloper();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSavedGame, confirmNew, onNewGame, onContinue, onOpenChapters, onOpenSettings, onExtra, onDeveloper]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ready) return;
      if (phase === 'attract') {
        start();
        return;
      }
      const k = e.key.toLowerCase();
      if (confirmNew) {
        if (k === 'enter') {
          setConfirmNew(false);
          soundManager.playMenuSelect();
          setSlotPicker('new');
        } else if (k === 'escape') setConfirmNew(false);
        return;
      }
      if (k === 'arrowdown' || k === 's') {
        setSelected((s) => (s + 1) % items.length);
        soundManager.playMenuMove();
      } else if (k === 'arrowup' || k === 'w') {
        setSelected((s) => (s - 1 + items.length) % items.length);
        soundManager.playMenuMove();
      } else if (k === 'enter' || k === ' ' || k === 'e') {
        run(selected);
      } else if (k === 'escape') {
        setPhase('attract');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ready, selected, confirmNew, run, start]);

  return (
    <div
      className="title-screen fixed inset-0 bg-black overflow-hidden select-none"
      onClick={() => {
        if (ready && phase === 'attract') start();
      }}
    >
      <img
        src="/images/menu_bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.9, filter: 'saturate(.72) brightness(.74) contrast(1.12)' }}
        draggable={false}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ mixBlendMode: 'screen', opacity: 0.32 }} />
      <div className="vignette" aria-hidden="true" />

      {subliminal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span className="font-title text-[22vw] text-red-700/20 tracking-widest">03:17</span>
        </div>
      )}

      {/* Title */}
      <div className="title-screen-heading absolute left-[7%] right-auto top-[9%] sm:top-[7%] flex w-[min(36rem,82vw)] flex-col items-start text-left z-20 pointer-events-none px-0">
        <span className="font-serif-jp text-[11px] tracking-[0.55em] text-neutral-400 uppercase fade-up">京都 · 未解決</span>
        <h1 className="title-in title-glow title-screen-name font-title font-black text-[clamp(2.5rem,8vw,5.7rem)] leading-[0.95] text-[#e8e4dc] mt-3 tracking-[0.04em]">
          Quem é você?
        </h1>
        <div className="mt-5 h-px w-44 bg-gradient-to-r from-transparent via-red-700/90 to-transparent" />
        {/* Ordem Paranormal brand mark */}
        <div className="title-brand mt-5 hidden" style={{ animationDelay: '0.8s' }}>
            <img
              src="/images/op_logo.png"
              alt="Op Logo"
              className="opacity-90 drop-shadow-[0_0_18px_rgba(198,40,40,0.25)]"
              style={{ width: '500px', height: '450px' }}
              draggable={false}
            />
        </div>
        <span className="font-serif-jp text-xs tracking-[0.35em] text-neutral-500 mt-4 uppercase fade-up" style={{ animationDelay: '1.2s' }}>
          Terror investigativo · Kyoto
        </span>
      </div>

      {/* Attract / Loading */}
      {phase === 'attract' && (
        <div className="absolute left-[7%] right-auto bottom-[12%] flex flex-col items-start z-20 pointer-events-none">
          {!ready ? (
            <div className="flex flex-col items-center gap-3">
              <span className="font-serif-jp text-xs tracking-[0.4em] text-neutral-500 uppercase">Carregando arquivos do caso</span>
              <div className="w-56 h-px bg-neutral-800 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-neutral-300 transition-all duration-300" style={{ width: `${Math.round(loadProgress * 100)}%` }} />
              </div>
            </div>
          ) : (
            <span className="blink-slow font-serif-jp text-sm tracking-[0.45em] text-neutral-300 uppercase">Pressione qualquer tecla</span>
          )}
        </div>
      )}

      {slotPicker && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-5 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
        <section className="w-full max-w-3xl border border-white/20 bg-[#0a0b10]/95 p-6 sm:p-9 text-[#eee8dc] shadow-2xl">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-serif-jp text-[10px] tracking-[.4em] text-rose-200/70">ARQUIVO PESSOAL</p><h2 className="mt-2 font-title text-2xl tracking-[.15em]">{slotPicker === 'new' ? 'ESCOLHA UM ESPAÇO' : 'RETOMAR INVESTIGAÇÃO'}</h2></div><button onClick={() => setSlotPicker(null)} className="text-neutral-400 hover:text-white">FECHAR ×</button></div>
          <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(slot => { const exists = !!localStorage.getItem(`gabriela_game_save_${slot}`) || (slot === 1 && !!localStorage.getItem('gabriela_game_save')); return <button key={slot} disabled={slotPicker === 'continue' && !exists} onClick={() => { const mode = slotPicker; setSlotPicker(null); if (mode === 'new') onNewGame(slot); else onContinue(slot); }} className="min-h-28 border border-white/15 bg-white/[.035] p-4 text-left transition hover:border-rose-200/60 hover:bg-rose-950/20 disabled:opacity-30"><span className="font-title text-lg tracking-[.18em]">SLOT 0{slot}</span><span className="mt-2 block font-serif-jp text-xs text-neutral-400">{exists ? 'Caso salvo · continuar de onde parou' : 'Novo arquivo · vazio'}</span></button>})}</div>
        </section>
      </div>}
      {/* Menu */}
      {phase === 'menu' && (
        <div className="absolute left-[7%] right-auto top-[43%] sm:top-[38%] bottom-auto flex max-h-[48vh] flex-col items-start overflow-y-auto z-20 fade-up">
          {confirmNew ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="font-serif-jp text-sm tracking-[0.25em] text-neutral-200">Apagar o progresso atual e recomeçar?</span>
              <div className="flex gap-8 font-title text-sm tracking-[0.3em]">
                <button
                  className="text-red-300 hover:text-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmNew(false);
                    soundManager.playMenuSelect();
                    setSlotPicker('new');
                  }}
                >
                  SIM <span className="text-neutral-600 text-[10px]">[ENTER]</span>
                </button>
                <button
                  className="text-neutral-300 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmNew(false);
                  }}
                >
                  NÃO <span className="text-neutral-600 text-[10px]">[ESC]</span>
                </button>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col items-start gap-1 sm:gap-2.5">
              {items.map((it, idx) => {
                const active = idx === selected;
                return (
                  <li key={it.id} className="relative">
                    <button
                      disabled={it.disabled}
                      onMouseEnter={() => {
                        if (!it.disabled && selected !== idx) {
                          setSelected(idx);
                          soundManager.playMenuMove();
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        run(idx);
                      }}
                      className={`font-title text-xs sm:text-base tracking-[0.2em] sm:tracking-[0.28em] uppercase transition-all duration-200 pl-6 pr-3 py-1 ${
                        it.disabled ? 'text-neutral-700 cursor-not-allowed' : active ? 'text-red-200 title-glow scale-105' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className={`absolute -left-1 transition-opacity ${active && !it.disabled ? 'opacity-100 text-red-500' : 'opacity-0'}`}>▸</span>
                      {it.label}
                    </button>
                    {active && !it.disabled && (
                      <div className="hidden sm:block absolute left-full top-1/2 ml-5 -translate-y-1/2 font-serif-jp text-[9px] tracking-[0.2em] text-neutral-400/70 uppercase whitespace-nowrap">{it.sub}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="absolute bottom-[8%] left-[5.4%] flex flex-col gap-2 font-serif-jp text-[10px] tracking-[0.3em] text-neutral-300/55 uppercase z-20 pointer-events-none">
        <span>Caso 74-0317 · Arquivos de Kyoto</span>
        <span className="text-base tracking-[0.4em]">03:17</span>
        <span className="text-[8px] tracking-[0.2em]">— Algumas coisas</span>
        <span className="pl-8 text-[8px] tracking-[0.2em]">não deveriam ser lembradas.</span>
      </div>
    </div>
  );
};
