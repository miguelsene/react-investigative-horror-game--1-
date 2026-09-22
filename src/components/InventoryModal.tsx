import React, { useState } from 'react';
import { InventoryItem } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Panel, Hairline } from './ui/Panel';
import { Watch, BookOpen, Search, Key, Mic, Image as ImageIcon, FileText, Rotate3d, Combine } from 'lucide-react';

interface InventoryModalProps {
  items: InventoryItem[];
  onClose: () => void;
  onCombineItems?: (a: string, b: string) => void;
  onInspectItem3D?: (modelType: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  Watch: <Watch className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Search: <Search className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  Mic: <Mic className="w-4 h-4" />,
  ImageIcon: <ImageIcon className="w-4 h-4" />,
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ items, onClose, onCombineItems, onInspectItem3D }) => {
  const [sel, setSel] = useState(items[0]?.id ?? '');
  const [combining, setCombining] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const item = items.find((i) => i.id === sel);

  const pick = (id: string) => {
    soundManager.playMenuMove();
    if (combining && combining !== id) {
      onCombineItems?.(combining, id);
      setCombining(null);
      setMsg('Correlação registrada nas notas.');
      setTimeout(() => setMsg(null), 2500);
      return;
    }
    setSel(id);
  };

  return (
    <Panel title="INVENTÁRIO" jp="所持品" subtitle={`${items.length} itens · Gabriela`} onClose={onClose} hotkey="I" footer={<><span>{msg ?? 'Selecione um item para ler a avaliação'}</span><span>↑↓ navegar</span></>}>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)] gap-8">
        {/* list */}
        <ul className="space-y-0.5">
          {items.map((it, idx) => {
            const active = it.id === sel;
            const comb = it.id === combining;
            return (
              <li key={it.id}>
                <button
                  onClick={() => pick(it.id)}
                  className={`group w-full flex items-center gap-3 py-2.5 px-2 text-left border-l-2 transition-colors ${
                    comb ? 'border-amber-400 text-amber-200' : active ? 'border-red-500 text-neutral-100 bg-white/[0.03]' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-title text-[10px] text-neutral-600 w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <span className={`${active ? 'text-red-400' : 'text-neutral-500 group-hover:text-neutral-300'}`}>{ICONS[it.icon] ?? <FileText className="w-4 h-4" />}</span>
                  <span className="font-serif-jp text-sm flex-1 truncate">{it.name}</span>
                  <span className="font-serif-jp text-[10px] tracking-[0.25em] uppercase text-neutral-600">{it.category}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* detail */}
        {item && (
          <div className="fade-up">
            <span className="font-serif-jp text-[10px] tracking-[0.4em] uppercase text-neutral-500">{item.category}</span>
            <h3 className="font-title text-lg tracking-[0.15em] text-neutral-100 mt-1">{item.name}</h3>
            <Hairline label="Relatório" />
            <p className="font-serif-jp text-sm leading-relaxed text-neutral-300">{item.description}</p>
            {item.detailedDescription && (
              <>
                <Hairline label="Avaliação de Gabriela" />
                <p className="font-serif-jp text-sm italic leading-relaxed text-neutral-400 border-l border-red-700/60 pl-4">“{item.detailedDescription}”</p>
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-6 font-serif-jp text-[12px] tracking-[0.25em] uppercase">
              {item.modelType && onInspectItem3D && (
                <button onClick={() => onInspectItem3D(item.modelType!)} className="flex items-center gap-2 text-neutral-300 hover:text-white">
                  <Rotate3d className="w-4 h-4 text-red-400" /> Examinar em 3D
                </button>
              )}
              <button
                onClick={() => {
                  soundManager.playClockTick();
                  setCombining(combining ? null : item.id);
                  setMsg(combining ? null : 'Escolha o segundo item…');
                }}
                className={`flex items-center gap-2 ${combining ? 'text-amber-300' : 'text-neutral-300 hover:text-white'}`}
              >
                <Combine className="w-4 h-4 text-sky-400" /> {combining ? 'Cancelar' : 'Combinar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};
