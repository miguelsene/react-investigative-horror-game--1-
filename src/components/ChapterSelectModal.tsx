import React from 'react';
import { Chapter } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Lock, CheckCircle2, Play, X, BookOpen } from 'lucide-react';

interface ChapterSelectModalProps {
  chapters: Chapter[];
  currentChapter: number;
  onSelectChapter: (chapterNumber: number) => void;
  onClose: () => void;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  chapters,
  currentChapter,
  onSelectChapter,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#101216] border border-neutral-700/80 rounded-lg shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        
        {/* Header */}
        <div className="p-4 bg-[#161820] border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-title tracking-wider text-neutral-100 flex items-center gap-2">
                ARQUIVO DE CAPÍTULOS
                <span className="text-[11px] font-mono text-neutral-400 font-normal px-2 py-0.5 rounded bg-black/40 border border-neutral-800">
                  CRÔNICAS DE KYOTO
                </span>
              </h2>
              <p className="text-[11px] font-mono text-neutral-400">
                Selecione um capítulo desbloqueado para investigar os eventos da linha temporal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapters List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 font-mono">
          {chapters.map((ch) => {
            const isUnlocked = ch.isUnlocked;
            const isCurrent = ch.number === currentChapter;
            const moments = ch.number === 1 ? ['03:17 · O despertar', '07:00 · Os sete relógios', '18:07 · O retorno para casa'] : ['A pista que não deveria existir', 'Uma memória fora do lugar', 'O próximo passo da investigação'];

            return (
              <div
                key={ch.number}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : isUnlocked
                    ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    : 'border-neutral-900 bg-black/40 opacity-50'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img src={`/images/pin_${((ch.number - 1) % 5) + 1}.jpg`} alt="" className="h-32 w-full rounded object-cover opacity-80 sm:h-36 sm:w-56" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                        CAPÍTULO {ch.number}
                      </span>
                      <span className="text-xs text-neutral-500 font-serif-jp">— {ch.subtitle}</span>
                      {ch.isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
                          <CheckCircle2 className="w-3 h-3" /> CONCLUÍDO
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold font-title text-neutral-100">
                      {ch.title}
                    </h3>

                    <p className="text-xs text-neutral-400 font-serif-jp leading-relaxed pt-1">
                      {isUnlocked ? ch.description : 'Arquivo confidencial. Progrida na investigação para revelar as transcrições deste capítulo.'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-3">{moments.map((moment) => <span key={moment} className="border border-neutral-700/70 bg-black/30 px-2 py-1 text-[10px] tracking-wide text-neutral-400">{moment}</span>)}</div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playClueDiscovered();
                          onSelectChapter(ch.number);
                          onClose();
                        }}
                        className="py-1.5 px-3 bg-neutral-800 hover:bg-red-600 text-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {isCurrent ? 'Em Curso' : 'Iniciar'}
                      </button>
                    ) : (
                      <div className="p-2 rounded bg-neutral-900 text-neutral-600 border border-neutral-800">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
