import React, { useMemo } from 'react';
import { Panel } from './ui/Panel';
import { HOUSE_CLOCKS } from '../data/houseClocks';

interface Props {
  found: string[];
  onClose: () => void;
  onFinish: () => void;
}

const PlanRoom: React.FC<{ x: number; y: number; w: number; h: number; label: string; big?: boolean }> = ({ x, y, w, h, label, big }) => (
  <>
    <rect x={x} y={y} width={w} height={h} fill={big ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)'} stroke="rgba(255,255,255,.22)" strokeWidth="0.7" />
    <text x={x + w / 2} y={y + h - 3} textAnchor="middle" fill="rgba(255,255,255,.42)" fontSize="5" fontFamily="Shippori Mincho, serif">
      {label}
    </text>
  </>
);

export const ClockHunt: React.FC<Props> = ({ found, onClose, onFinish }) => {
  const total = HOUSE_CLOCKS.length;
  const foundCount = useMemo(() => HOUSE_CLOCKS.filter((c) => found.includes(c.id)).length, [found]);
  const complete = foundCount === total;

  const renderFloor = (floor: 1 | 2) => {
    const clocks = HOUSE_CLOCKS.filter((c) => c.floor === floor);
    return (
      <figure className="flex-1">
        <figcaption className="font-serif-jp text-[10px] tracking-[0.3em] text-neutral-500 uppercase mb-2">
          {floor === 2 ? 'Segundo andar' : 'Térreo'} · {clocks.filter((c) => found.includes(c.id)).length}/{clocks.length}
        </figcaption>
        <svg viewBox="0 0 100 58" className="w-full border border-neutral-800 bg-black/40">
          {floor === 2 ? (
            <>
              <PlanRoom x={2} y={6} w={38} h={26} label="Quarto" big />
              <PlanRoom x={40} y={6} w={18} h={26} label="Corredor" />
              <PlanRoom x={58} y={6} w={40} h={26} label="Escritório" big />
              <rect x={2} y={32} width={96} height={20} fill="rgba(255,255,255,.015)" stroke="rgba(255,255,255,.16)" strokeWidth="0.7" />
              <text x="50" y="45" textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize="5" fontFamily="Shippori Mincho, serif">Escada · banheiro</text>
            </>
          ) : (
            <>
              <PlanRoom x={2} y={6} w={22} h={26} label="Quarto da avó" big />
              <PlanRoom x={24} y={6} w={40} h={26} label="Sala" big />
              <PlanRoom x={64} y={6} w={24} h={26} label="Cozinha" big />
              <PlanRoom x={88} y={6} w={10} h={26} label="Entrada" />
              <rect x={2} y={32} width={98} height={20} fill="rgba(120,160,120,.07)" stroke="rgba(255,255,255,.16)" strokeWidth="0.7" />
              <text x="50" y="44" textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize="5" fontFamily="Shippori Mincho, serif">Varanda · jardim</text>
            </>
          )}
          {clocks.map((clock) => {
            const done = found.includes(clock.id);
            return (
              <g key={clock.id}>
                <circle
                  cx={(clock.plan.x / 100) * 100}
                  cy={(clock.plan.y / 100) * 58}
                  r={done ? 2.6 : 3.1}
                  fill={done ? '#6ee7b7' : '#e8e6df'}
                  stroke="rgba(0,0,0,.5)"
                  strokeWidth="0.6"
                />
                {!done && <circle cx={(clock.plan.x / 100) * 100} cy={(clock.plan.y / 100) * 58} r="5.2" fill="none" stroke="rgba(232,230,223,.35)" strokeWidth="0.5" />}
              </g>
            );
          })}
        </svg>
      </figure>
    );
  };

  return (
    <Panel title="RELÓGIOS DA CASA" jp="時計直し" subtitle={`${foundCount}/${total} ajustados para 07:00`} onClose={onClose} width="max-w-3xl">
      <p className="font-serif-jp text-sm text-neutral-400 leading-relaxed mb-5">
        Chiyo pediu para acertar os relógios antes da escola. Os sete estão presos em 03:17. Vá até cada um — o ajuste só pode ser feito com o relógio à frente.
      </p>

      <div className="flex flex-col sm:flex-row gap-5 mb-6">
        {renderFloor(2)}
        {renderFloor(1)}
      </div>

      <div className="grid gap-2">
        {HOUSE_CLOCKS.map((clock, i) => {
          const done = found.includes(clock.id);
          return (
            <div
              key={clock.id}
              className={`text-left border px-4 py-3 font-serif-jp flex justify-between gap-4 ${done ? 'border-neutral-700 text-neutral-500' : 'border-neutral-800 text-neutral-200'}`}
            >
              <span>
                <span className="font-title text-xs tracking-widest mr-3">{String(i + 1).padStart(2, '0')}</span>
                {clock.name}
                <span className="block text-[11px] text-neutral-500 mt-1">{clock.clue}</span>
              </span>
              <span className="self-center text-right">
                {done ? <span className="text-sm text-emerald-200">07:00 ✓</span> : <span className="text-[10px] tracking-widest text-neutral-500">{clock.floor}º ANDAR · {clock.label.toUpperCase()}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {!complete && (
        <p className="mt-5 font-serif-jp text-[11px] text-neutral-500 italic">
          O cruzamento de cada ponteiro precisa chegar exatamente a 07:00. Use os controles do painel de ajuste.
        </p>
      )}

      {complete && (
        <div className="mt-6 border-t border-neutral-700 pt-5 text-center">
          <p className="font-serif-jp text-sm text-neutral-200">Sete relógios ajustados. A casa marca a manhã.</p>
          <button className="inspection-action justify-center mx-auto" onClick={onFinish}>Fechar a lista →</button>
        </div>
      )}
    </Panel>
  );
};
