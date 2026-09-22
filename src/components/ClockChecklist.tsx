import React from 'react';
import { HOUSE_CLOCKS } from '../data/houseClocks';

interface Props {
  found: string[];
  onOpen: () => void;
}

export const ClockChecklist: React.FC<Props> = ({ found, onOpen }) => (
  <aside className="absolute top-24 right-6 z-20 w-60 pointer-events-auto">
    <button onClick={onOpen} className="w-full text-left bg-black/55 border border-white/10 backdrop-blur px-4 py-3 hover:border-white/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-title text-[11px] tracking-[0.25em] text-neutral-200">RELÓGIOS</span>
        <span className="font-mono text-[11px] text-neutral-400">{found.length}/{HOUSE_CLOCKS.length}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {HOUSE_CLOCKS.map((clock) => {
          const done = found.includes(clock.id);
          return (
            <li key={clock.id} className={`flex items-center gap-2 text-[11px] font-serif-jp ${done ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-300' : 'bg-neutral-600'}`} />
              {clock.name}
            </li>
          );
        })}
      </ul>
      <span className="block mt-3 text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Abrir lista →</span>
    </button>
  </aside>
);
