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
    { id: 'developer', label: 'MODO DESENVOLVEDOR', sub: 'Acesso rápido para desenvolvimento', disabled: false },
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
      else onDeveloper();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSavedGame, confirmNew, onNewGame, onContinue, onOpenChapters, onOpenSettings, onDeveloper]
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
      <div className="absolute left-[7%] right-[7%] top-[9%] z-10 flex flex-col items-start text-left pointer-events-none sm:top-1/2 sm:right-auto sm:w-[min(54vw,46rem)] sm:-translate-y-1/2">
        <span className="font-serif-jp text-[10px] sm:text-[11px] tracking-[0.38em] sm:tracking-[0.55em] text-neutral-300/75 uppercase fade-up">KYOTO · ARQUIVO 74-0317</span>
        <h1 className="title-in title-glow title-screen-name mt-4 font-title font-black text-[clamp(2.8rem,13vw,7.5rem)] leading-[0.9] text-[#eee8dc] tracking-[0.02em] sm:mt-6">
          QUEM É<br className="sm:hidden" /> VOCÊ?
        </h1>
        <div className="mt-5 h-px w-36 sm:w-52 bg-gradient-to-r from-red-500/90 via-red-300/30 to-transparent" />
        <p className="mt-4 max-w-sm font-serif-jp text-xs sm:text-sm leading-6 tracking-[0.12em] text-neutral-200/75 fade-up sm:mt-6">
          Algumas lembranças não pertencem a quem as recorda.
        </p>
        <div className="mt-5 flex items-center gap-3 font-mono text-[9px] tracking-[0.28em] text-neutral-300/55 sm:mt-8">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.9)]" />
          <span>KYOTO · 03:17 · CASO NÃO RESOLVIDO</span>
        </div>
        {phase === 'attract' && (
          <div className="pointer-events-auto mt-8 sm:mt-10">
            {!ready ? (
              <div className="flex w-64 flex-col gap-3">
                <span className="font-serif-jp text-[10px] tracking-[0.3em] text-neutral-300/75 uppercase">Carregando os arquivos</span>
                <div className="relative h-px overflow-hidden bg-white/15"><div className="absolute inset-y-0 left-0 bg-red-300 transition-all duration-300" style={{ width: `${Math.round(loadProgress * 100)}%` }} /></div>
              </div>
            ) : (
              <button onClick={(event) => { event.stopPropagation(); start(); }} className="group flex min-h-12 items-center gap-4 border border-white/35 bg-black/35 px-5 py-3 font-serif-jp text-[10px] tracking-[0.28em] text-white backdrop-blur-sm transition hover:border-red-200/80 hover:bg-red-950/45 sm:px-7">
                <span className="text-red-300 transition-transform group-hover:translate-x-1">▶</span> ABRIR O ARQUIVO <span className="text-neutral-500">↵</span>
              </button>
            )}
          </div>
        )}
      </div>

      {slotPicker && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3 sm:p-5 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
        <section className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-white/20 bg-[#0a0b10]/95 p-4 sm:p-9 text-[#eee8dc] shadow-2xl">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-serif-jp text-[10px] tracking-[.4em] text-rose-200/70">ARQUIVO PESSOAL</p><h2 className="mt-2 font-title text-2xl tracking-[.15em]">{slotPicker === 'new' ? 'ESCOLHA UM ESPAÇO' : 'RETOMAR INVESTIGAÇÃO'}</h2></div><button onClick={() => setSlotPicker(null)} className="text-neutral-400 hover:text-white">FECHAR ×</button></div>
          <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(slot => { const exists = !!localStorage.getItem(`gabriela_game_save_${slot}`) || (slot === 1 && !!localStorage.getItem('gabriela_game_save')); return <button key={slot} disabled={slotPicker === 'continue' && !exists} onClick={() => { const mode = slotPicker; setSlotPicker(null); if (mode === 'new') onNewGame(slot); else onContinue(slot); }} className="min-h-28 border border-white/15 bg-white/[.035] p-4 text-left transition hover:border-rose-200/60 hover:bg-rose-950/20 disabled:opacity-30"><span className="font-title text-lg tracking-[.18em]">SLOT 0{slot}</span><span className="mt-2 block font-serif-jp text-xs text-neutral-400">{exists ? 'Caso salvo · continuar de onde parou' : 'Novo arquivo · vazio'}</span></button>})}</div>
        </section>
      </div>}
      {/* Menu */}
      {phase === 'menu' && (
        <section className="absolute inset-x-4 bottom-[4svh] z-20 max-h-[54svh] overflow-y-auto border-t border-white/20 bg-black/45 px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,.4)] backdrop-blur-xl fade-up sm:inset-y-auto sm:bottom-auto sm:left-auto sm:right-[7%] sm:top-1/2 sm:w-[min(26rem,34vw)] sm:max-h-[78vh] sm:-translate-y-1/2 sm:border-t-0 sm:border-l sm:border-white/20 sm:bg-black/35 sm:px-6 sm:py-5">
          <div className="mb-3 flex items-end justify-between border-b border-white/15 pb-3 sm:mb-5 sm:pb-4">
            <div>
              <span className="font-mono text-[8px] tracking-[0.32em] text-red-300/80">MENU PRINCIPAL</span>
              <h2 className="mt-1 font-title text-base tracking-[0.18em] text-neutral-100 sm:text-lg">INVESTIGAÇÃO</h2>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-neutral-500">03:17</span>
          </div>
          {confirmNew ? (
            <div className="flex flex-col items-start gap-4 py-2 text-left sm:items-center sm:text-center">
              <span className="font-serif-jp text-sm leading-6 text-neutral-200">Apagar o progresso atual e recomeçar?</span>
              <div className="flex w-full gap-3 font-title text-xs tracking-[0.2em] sm:justify-center sm:text-sm sm:tracking-[0.3em]">
                <button
                  className="min-h-11 flex-1 border border-red-300/50 px-3 text-red-200 hover:bg-red-950/40 sm:flex-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmNew(false);
                    soundManager.playMenuSelect();
                    setSlotPicker('new');
                  }}
                >
                  SIM <span className="text-neutral-500 text-[9px]">[ENTER]</span>
                </button>
                <button
                  className="min-h-11 flex-1 border border-white/15 px-3 text-neutral-300 hover:bg-white/5 sm:flex-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmNew(false);
                  }}
                >
                  NÃO <span className="text-neutral-500 text-[9px]">[ESC]</span>
                </button>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-1 sm:gap-2">
              {items.map((it, idx) => {
                const active = idx === selected;
                return (
                  <li key={it.id} className="w-full">
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
                      className={`group flex min-h-11 w-full items-center gap-3 border-b px-2 py-2 text-left transition-all duration-200 sm:min-h-[3.25rem] sm:px-3 ${
                        it.disabled ? 'border-white/5 text-neutral-600 cursor-not-allowed' : active ? 'border-rose-200/55 bg-white/[.07] text-white' : 'border-white/10 text-neutral-300 hover:border-white/25 hover:bg-white/[.04]'
                      }`}
                    >
                      <span className={`w-3 shrink-0 text-xs transition-colors ${active && !it.disabled ? 'text-red-300' : 'text-neutral-600'}`}>▸</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-title text-[10px] tracking-[0.16em] sm:text-xs sm:tracking-[0.22em]">{it.label}</span>
                        <span className="mt-0.5 block truncate font-serif-jp text-[9px] tracking-[0.04em] text-neutral-500 sm:text-[10px]">{it.sub}</span>
                      </span>
                      {it.id === 'continue' && <span className="font-mono text-[8px] tracking-widest text-neutral-500">{hasSavedGame ? 'SALVO' : 'VAZIO'}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="absolute bottom-[4%] left-[7%] z-10 hidden items-center gap-3 font-mono text-[8px] tracking-[0.28em] text-neutral-400/55 sm:flex pointer-events-none">
        <span>GABRIELA · CAPÍTULO 01</span><span className="h-px w-8 bg-red-400/50" /><span>ALGUMAS COISAS NÃO DEVERIAM SER LEMBRADAS</span>
      </div>
    </div>
  );
};
