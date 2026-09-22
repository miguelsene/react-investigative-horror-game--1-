import React from 'react';
import { soundManager } from '../audio/soundManager';

interface Props {
  onContinue: () => void;
}

export const CaseCompletedModal: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 text-center select-none animate-fade-in">
      <div className="max-w-xl w-full border border-neutral-800 p-8 sm:p-12 bg-[#090b0e] shadow-2xl relative">
        <div className="w-2 h-2 rounded-full bg-red-600 mx-auto mb-6 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" />
        <span className="font-serif-jp text-xs tracking-[0.4em] uppercase text-neutral-500 block mb-2">
          ARQUIVO DE INVESTIGAÇÃO
        </span>
        <h1 className="font-title font-black text-3xl sm:text-4xl text-neutral-100 tracking-[0.25em] mb-1">
          CAPÍTULO 1
        </h1>
        <h2 className="font-title text-xl sm:text-2xl text-red-400 tracking-[0.3em] mb-8">
          3:17
        </h2>

        <div className="border-t border-b border-neutral-800/80 py-5 my-6 font-mono text-xs text-neutral-300 space-y-2.5 text-left">
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">REGISTRO:</span>
            <span>CASO Nº 001</span>
          </div>
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">HORÁRIO RECORRENTE:</span>
            <span className="text-red-400 font-bold">03:17 AM</span>
          </div>
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">LOCAL:</span>
            <span>RESIDÊNCIA SHINOHARA · KYOTO</span>
          </div>
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">EVENTO:</span>
            <span>MARCA DE MÃO INTERNA NO VIDRO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">STATUS:</span>
            <span className="text-amber-400 font-bold">INCONCLUSIVO</span>
          </div>
        </div>

        <blockquote className="my-8 font-serif-jp text-sm sm:text-base italic text-neutral-300 leading-relaxed max-w-md mx-auto">
          “Algumas coisas não começam quando você as encontra.<br />
          Talvez elas já estivessem esperando por você.”
        </blockquote>

        <button
          onClick={() => {
            soundManager.playMenuSelect();
            onContinue();
          }}
          className="mt-4 px-8 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-700 hover:border-neutral-500 font-title text-xs tracking-[0.3em] uppercase transition-all hover:scale-105"
        >
          CONTINUAR [MENU PRINCIPAL]
        </button>
      </div>
    </div>
  );
};
