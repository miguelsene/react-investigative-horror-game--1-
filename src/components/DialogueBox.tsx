import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DialogueNode, DialogueOption } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface DialogueBoxProps {
  node: DialogueNode;
  onSelectOption: (option: DialogueOption) => void;
  onNext: () => void;
  onClose: () => void;
  cinematic?: boolean;
}

type Voice = 'gabriela' | 'chiyo' | 'unknown' | 'thought';
const GLITCH_CHARS = '▓▒░#%&@0317アイウエオカキクケコ';

const voiceOf = (speaker: DialogueNode['speaker']): Voice =>
  speaker === 'Gabriela' ? 'gabriela' : speaker === 'Chiyo (Avó)' ? 'chiyo' : speaker === 'Pensamento' ? 'thought' : 'unknown';

const portraitOf = (voice: Voice) => {
  if (voice === 'gabriela' || voice === 'thought') return { img: '/images/gabriela_portrait.png', border: 'border-sky-800/70', label: 'GABRIELA' };
  if (voice === 'chiyo') return { img: '/images/chiyo_portrait.png', border: 'border-amber-800/70', label: 'CHIYO' };
  return { img: '/images/shadow_portrait.png', border: 'border-red-900/80', label: '???' };
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({ node, onSelectOption, onNext, onClose, cinematic = false }) => {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  const [glitch, setGlitch] = useState<string | null>(null);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const voice = voiceOf(node.speaker);
  const isGlitch = voice === 'unknown';
  const portrait = portraitOf(voice);

  useEffect(() => {
    if (node.soundCue === 'sting') soundManager.playAnomalySting();
    if (node.soundCue === 'phone') soundManager.playPhoneRing();
    if (node.soundCue === 'static') soundManager.playRadioStatic(0.8);
    if (node.soundCue === 'tick') soundManager.playClockTick();
    if (node.soundCue === 'creak') soundManager.playDoorCreak();
  }, [node.id, node.soundCue]);

  /* Typewriter with punctuation pauses + per-character voice blips */
  useEffect(() => {
    idxRef.current = 0;
    doneRef.current = false;
    setShown('');
    setDone(false);
    const text = node.text;
    const step = () => {
      const i = idxRef.current + 1;
      idxRef.current = i;
      setShown(text.slice(0, i));
      const ch = text[i - 1];
      if (ch && ch !== ' ' && i % 2 === 0) soundManager.playVoiceBlip(voice);
      if (i >= text.length) {
        doneRef.current = true;
        setDone(true);
        return;
      }
      let delay = voice === 'thought' ? 17 : 24;
      if (ch === ',' || ch === ';') delay = 150;
      else if ('.!?…'.includes(ch)) delay = 320;
      else if (ch === '—') delay = 220;
      timerRef.current = window.setTimeout(step, delay);
    };
    timerRef.current = window.setTimeout(step, 140);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [node.id, node.text, voice]);

  /* Corrupt characters while an unknown voice is speaking */
  useEffect(() => {
    if (!isGlitch || done) {
      setGlitch(null);
      return;
    }
    const id = window.setInterval(() => {
      const s = shown.split('');
      for (let k = 0; k < 3; k++) {
        const j = Math.floor(Math.random() * s.length);
        if (s[j] && s[j] !== ' ') s[j] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      setGlitch(s.join(''));
    }, 90);
    return () => clearInterval(id);
  }, [isGlitch, shown, done]);

  const skipOrAdvance = useCallback(() => {
    if (!doneRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      idxRef.current = node.text.length;
      doneRef.current = true;
      setShown(node.text);
      setDone(true);
      return;
    }
    if (node.options && node.options.length > 0) return;
    if (node.next) onNext();
    else onClose();
  }, [node, onNext, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === ' ' || k === 'e') {
        e.preventDefault();
        skipOrAdvance();
      } else if (done && node.options && /^[1-9]$/.test(k)) {
        const opt = node.options[Number(k) - 1];
        if (opt) {
          soundManager.playClockTick();
          onSelectOption(opt);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skipOrAdvance, done, node.options, onSelectOption]);

  const displayText = isGlitch && glitch !== null && !done ? glitch : shown;

  return (
    <>
      <div className="letterbox top-0" />
      <div className="letterbox bottom-0" />
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-6 sm:pb-8 pointer-events-none">
        <div onClick={skipOrAdvance} className={`pointer-events-auto w-full ${cinematic ? 'max-w-6xl px-2 py-2 sm:px-4 sm:py-4' : 'max-w-4xl'} dlg-box cursor-pointer fade-up`}>
          <div className="flex gap-4 sm:gap-5 items-start">
            {/* Portrait */}
            <div className={`relative ${cinematic ? 'w-24 h-24 sm:w-32 sm:h-32' : 'w-20 h-20 sm:w-24 sm:h-24'} shrink-0 rounded-sm border ${portrait.border} bg-black overflow-hidden ${!done ? 'talking' : ''}`}>
              <img
                src={portrait.img}
                alt={portrait.label}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated', filter: voice === 'thought' ? 'grayscale(0.7) brightness(0.7)' : 'none' }}
                draggable={false}
              />
              <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black to-transparent" />
              <span className="absolute bottom-1 inset-x-0 text-center font-serif-jp text-[9px] tracking-[0.3em] text-neutral-300">{portrait.label}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1.5">
                <span className={`font-title text-sm tracking-[0.25em] ${isGlitch ? 'text-red-400' : voice === 'chiyo' ? 'text-amber-200' : 'text-neutral-100'}`}>
                  {node.speaker.toUpperCase()}
                </span>
                {node.speakerTitle && <span className="font-serif-jp text-[10px] tracking-[0.2em] text-neutral-500">{node.speakerTitle}</span>}
                <span className="ml-auto font-serif-jp text-[10px] tracking-[0.2em] text-neutral-600">{done ? 'ENTER ▸' : '···'}</span>
              </div>

              <p className={`font-serif-jp ${cinematic ? 'text-lg sm:text-2xl min-h-[4rem]' : 'text-[15px] sm:text-lg min-h-[3.2rem]'} leading-relaxed text-neutral-100 ${isGlitch ? 'glitch-text' : ''} ${voice === 'thought' ? 'italic text-neutral-300' : ''}`}>
                {displayText}
                {!done && <span className="caret" />}
              </p>

              {done && node.gabrielaAnalysis && (
                <div className="mt-3 pl-3 border-l border-red-700/70 font-serif-jp text-[12px] leading-relaxed text-neutral-400 fade-up">
                  <span className="text-red-400/90 tracking-[0.2em] text-[10px] uppercase block mb-0.5">Observação</span>
                  {node.gabrielaAnalysis}
                </div>
              )}

              {done && node.options && node.options.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5 fade-up" onClick={(e) => e.stopPropagation()}>
                  {node.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundManager.playClockTick();
                        onSelectOption(opt);
                      }}
                      className={`group text-left font-serif-jp ${cinematic ? 'text-base sm:text-lg py-2' : 'text-sm py-1'} text-neutral-300 hover:text-white transition-colors flex items-baseline gap-3`}
                    >
                      <span className="text-[10px] text-neutral-600 group-hover:text-red-400 tracking-widest w-4">{idx + 1}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-red-500 -ml-2 transition-opacity">▸</span>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {done && (!node.options || node.options.length === 0) && <div className="mt-2 text-right text-red-500/80 text-xs blink-slow">▼</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
