import React, { useMemo, useRef, useState } from 'react';
import { EvidenceNode, EvidenceConnection } from '../types/game';
import { soundManager } from '../audio/soundManager';

/* ============================================================
   THE CORKBOARD — a literal wall board: cork texture in a wooden
   frame, post-it notes and polaroids pinned with push-pins, red
   yarn strung between pins (sagging under gravity). Notes can be
   dragged around; click two pins to tie a string between them.
   ============================================================ */

interface Props {
  nodes: EvidenceNode[];
  connections: EvidenceConnection[];
  onConnect: (fromId: string, toId: string) => void;
  onRemoveConnection: (id: string) => void;
  onMoveNode?: (id: string, x: number, y: number) => void;
  onClose: () => void;
}

const DEDUCTIONS: Record<string, string> = {
  'node_clock_freeze-node_time_0317': 'Os dois relógios desafiam a causalidade: 06:43 congelado é o espelho da hora morta, 03:17.',
  'node_house-node_photo_1974': 'A casa em 1974 é estruturalmente idêntica à de hoje — a mesma janela, o mesmo cedro.',
  'node_chiyo-node_photo_1974': 'Chiyo tinha 24 anos em 1974 e já vivia aqui. Ela sabe quem está na janela.',
  'node_gabriela-node_clock_freeze': 'Só a atenção obsessiva de Gabriela registrou a discrepância de 60 segundos.',
};

const NOTE_W = 190;
const NOTE_H = 132;

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const paperFor = (cat: string) =>
  cat === 'timeline' ? { bg: '#f7e27a', edge: '#e3c85a', ink: '#3b2f10' } : cat === 'people' ? { bg: '#f9c9d4', edge: '#e9a7b6', ink: '#3a1f28' } : cat === 'location' ? { bg: '#bfe6c7', edge: '#9ccfa8', ink: '#16321f' } : { bg: '#f4efe4', edge: '#d9d1bf', ink: '#1f1c17' };

const pinColorFor = (cat: string) => (cat === 'timeline' ? '#d33a3a' : cat === 'people' ? '#2a62c9' : cat === 'location' ? '#2f8f4a' : '#e0a020');

export const EvidenceBoard: React.FC<Props> = ({ nodes, connections, onConnect, onRemoveConnection, onMoveNode, onClose }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const [local, setLocal] = useState<Record<string, { x: number; y: number }>>({});

  const pos = (n: EvidenceNode) => local[n.id] ?? { x: n.x, y: n.y };
  const pinOf = (n: EvidenceNode) => {
    const p = pos(n);
    return { x: p.x + NOTE_W / 2, y: p.y + 10 };
  };

  const boardXY = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPinClick = (n: EvidenceNode) => {
    soundManager.playClockTick();
    if (!selected) {
      setSelected(n.id);
      return;
    }
    if (selected === n.id) {
      setSelected(null);
      return;
    }
    const key = DEDUCTIONS[`${selected}-${n.id}`] || DEDUCTIONS[`${n.id}-${selected}`];
    onConnect(selected, n.id);
    setSelected(null);
    if (key) {
      soundManager.playClueDiscovered();
      setFeedback(key);
    } else {
      soundManager.playDoorCreak();
      setFeedback('Hipótese amarrada. Nada prova a ligação — ainda.');
    }
    setTimeout(() => setFeedback(null), 6000);
  };

  const startDrag = (e: React.PointerEvent, n: EvidenceNode) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    const p = pos(n);
    const m = boardXY(e);
    setDrag({ id: n.id, dx: m.x - p.x, dy: m.y - p.y, moved: false });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const m = boardXY(e);
    setMouse(m);
    if (!drag) return;
    const r = boardRef.current!.getBoundingClientRect();
    const x = Math.max(6, Math.min(r.width - NOTE_W - 6, m.x - drag.dx));
    const y = Math.max(6, Math.min(r.height - NOTE_H - 6, m.y - drag.dy));
    setLocal((s) => ({ ...s, [drag.id]: { x, y } }));
    if (!drag.moved) setDrag({ ...drag, moved: true });
  };
  const endDrag = () => {
    if (drag) {
      const p = local[drag.id];
      if (p && drag.moved) {
        onMoveNode?.(drag.id, p.x, p.y);
        soundManager.playFootstep('wood');
      }
    }
    setDrag(null);
  };

  const strings = useMemo(
    () =>
      connections
        .map((c) => {
          const a = nodes.find((n) => n.id === c.from);
          const b = nodes.find((n) => n.id === c.to);
          if (!a || !b) return null;
          const p1 = pinOf(a);
          const p2 = pinOf(b);
          const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const sag = 14 + d * 0.09;
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2 + sag;
          return { id: c.id, p1, p2, mx, my, verified: !!(DEDUCTIONS[`${c.from}-${c.to}`] || DEDUCTIONS[`${c.to}-${c.from}`]) };
        })
        .filter(Boolean) as { id: string; p1: { x: number; y: number }; p2: { x: number; y: number }; mx: number; my: number; verified: boolean }[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connections, nodes, local]
  );

  const selNode = selected ? nodes.find((n) => n.id === selected) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[3px] p-3 sm:p-6 select-none fade-up" onClick={onClose}>
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[840px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* header (HUD style) */}
        <div className="flex items-end justify-between pb-2 px-1">
          <div className="flex items-baseline gap-3">
            <span className="w-1.5 h-1.5 bg-red-500 translate-y-[-3px]" />
            <h2 className="font-title text-xl tracking-[0.3em] text-neutral-100">QUADRO</h2>
            <span className="font-serif-jp text-xs tracking-[0.35em] text-neutral-500">仮説盤</span>
            <span className="font-serif-jp text-[11px] text-neutral-500 ml-4 hidden sm:inline">arraste as notas · clique em dois alfinetes para amarrar um fio</span>
          </div>
          <button onClick={onClose} className="font-serif-jp text-[11px] tracking-[0.3em] text-neutral-500 hover:text-white">Q / ESC ✕</button>
        </div>

        {/* wooden frame */}
        <div className="relative flex-1 rounded-[3px] p-[14px] shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ background: 'linear-gradient(135deg,#5a3a22,#3b2414 40%,#4a2f1b 70%,#2c1a0e)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.6), inset 0 0 0 4px rgba(255,220,180,.06), 0 30px 80px rgba(0,0,0,.8)' }}>
          {/* cork */}
          <div
            ref={boardRef}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className="relative w-full h-full overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 20% 30%, rgba(255,230,190,.08), transparent 40%), radial-gradient(circle at 75% 70%, rgba(0,0,0,.25), transparent 45%), repeating-radial-gradient(circle at 37% 61%, #b8895a 0 1px, #a97a4c 1px 3px, #b8895a 3px 4px), #b07f52',
              boxShadow: 'inset 0 0 90px rgba(0,0,0,.65)',
              cursor: drag ? 'grabbing' : 'default',
            }}
          >
            {/* cork speckle */}
            <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(#6b4a2a 0.8px, transparent 0.9px), radial-gradient(#d6a978 0.7px, transparent 0.8px)', backgroundSize: '9px 9px, 13px 13px', backgroundPosition: '0 0, 4px 6px' }} />

            {/* header card taped to the board */}
            <div className="absolute left-6 top-5 rotate-[-2deg] bg-[#f4efe4] text-[#1f1c17] px-4 py-2 shadow-[3px_5px_10px_rgba(0,0,0,.45)]" style={{ fontFamily: "'Caveat', 'Shippori Mincho', cursive" }}>
              <span className="absolute -top-2 left-4 w-10 h-4 bg-[rgba(255,255,255,.55)] rotate-[-8deg] shadow-sm" />
              <div className="text-xl leading-none">Caso 74-0317 — Kyoto</div>
              <div className="text-sm opacity-70">o que se repete não é coincidência</div>
            </div>

            {/* yarn */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <filter id="yarnShadow" x="-10%" y="-10%" width="120%" height="140%">
                  <feDropShadow dx="1.5" dy="3" stdDeviation="1.6" floodColor="#000" floodOpacity="0.55" />
                </filter>
              </defs>
              {strings.map((s) => (
                <g key={s.id} filter="url(#yarnShadow)" className="pointer-events-auto cursor-pointer" onClick={() => { onRemoveConnection(s.id); soundManager.playDoorCreak(); }}>
                  <path d={`M ${s.p1.x} ${s.p1.y} Q ${s.mx} ${s.my} ${s.p2.x} ${s.p2.y}`} fill="none" stroke="#7a1010" strokeWidth="4.2" strokeLinecap="round" opacity="0.6" />
                  <path d={`M ${s.p1.x} ${s.p1.y} Q ${s.mx} ${s.my} ${s.p2.x} ${s.p2.y}`} fill="none" stroke={s.verified ? '#e02a2a' : '#c43b3b'} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={s.verified ? undefined : '7 3'} />
                  <path d={`M ${s.p1.x} ${s.p1.y} Q ${s.mx} ${s.my} ${s.p2.x} ${s.p2.y}`} fill="none" stroke="rgba(255,190,190,.55)" strokeWidth="0.8" strokeLinecap="round" />
                </g>
              ))}
              {selNode && mouse && (
                <path d={`M ${pinOf(selNode).x} ${pinOf(selNode).y} Q ${(pinOf(selNode).x + mouse.x) / 2} ${(pinOf(selNode).y + mouse.y) / 2 + 24} ${mouse.x} ${mouse.y}`} fill="none" stroke="#e02a2a" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 4" opacity="0.85" />
              )}
            </svg>

            {/* notes */}
            {nodes.map((n) => {
              const p = pos(n);
              const h = hash(n.id);
              const rot = ((h % 9) - 4) * 0.55;
              const paper = paperFor(n.category);
              const isSel = selected === n.id;
              const polaroid = n.category === 'evidence';
              return (
                <div
                  key={n.id}
                  onPointerDown={(e) => startDrag(e, n)}
                  style={{ left: p.x, top: p.y, width: NOTE_W, transform: `rotate(${isSel ? rot * 0.3 : rot}deg)`, zIndex: drag?.id === n.id ? 30 : isSel ? 20 : 10, cursor: drag?.id === n.id ? 'grabbing' : 'grab' }}
                  className="absolute transition-transform duration-150"
                >
                  {/* paper */}
                  {polaroid ? (
                    <div className="bg-[#f6f3ec] p-2 pb-8 shadow-[4px_8px_16px_rgba(0,0,0,.55)] border border-black/10" style={{ minHeight: NOTE_H }}>
                      <div className="h-[86px] w-full relative overflow-hidden" style={{ background: 'radial-gradient(circle at 60% 40%, #8c7b68, #3a3129 70%, #1b1611)' }}>
                        <div className="absolute right-4 top-3 w-6 h-8 bg-[#d6c8ad] opacity-80" />
                        <div className="absolute right-5 top-4 w-3 h-6 bg-[#231c16]" />
                        <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(#000 0.6px, transparent 0.7px)', backgroundSize: '3px 3px' }} />
                      </div>
                      <div className="mt-2 text-[#2b2620] leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
                        <div className="text-[19px]">{n.title}</div>
                        {n.time && <div className="text-[13px] text-red-800">{n.time}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="relative px-3.5 pt-5 pb-3 shadow-[4px_8px_16px_rgba(0,0,0,.5)]" style={{ minHeight: NOTE_H, background: `linear-gradient(180deg, ${paper.bg}, ${paper.edge})`, color: paper.ink }}>
                      <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.08))' }} />
                      <div className="leading-tight" style={{ fontFamily: "'Caveat', 'Shippori Mincho', cursive" }}>
                        <div className="text-[19px] flex items-baseline justify-between gap-2"><span>{n.title}</span>{n.time && <span className="text-[14px] text-red-800 shrink-0">{n.time}</span>}</div>
                        <p className="text-[14px] mt-1 opacity-85 line-clamp-4">{n.summary}</p>
                      </div>
                    </div>
                  )}
                  {/* push-pin */}
                  <button
                    data-pin
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinClick(n);
                    }}
                    title={isSel ? 'Selecionado — clique em outro alfinete para amarrar' : 'Amarrar fio a partir daqui'}
                    className="absolute left-1/2 -translate-x-1/2 -top-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={`absolute w-[3px] h-3 top-4 rounded-full bg-neutral-700 ${isSel ? 'animate-pulse' : ''}`} style={{ boxShadow: '1px 2px 3px rgba(0,0,0,.5)' }} />
                    <span className="relative w-5 h-5 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff 0, ${pinColorFor(n.category)} 30%, rgba(0,0,0,.55) 100%)`, boxShadow: isSel ? `0 0 0 3px rgba(255,255,255,.6), 3px 5px 8px rgba(0,0,0,.6)` : '3px 5px 8px rgba(0,0,0,.6)' }} />
                  </button>
                </div>
              );
            })}

            {/* torn-paper feedback strip */}
            {feedback && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-5 max-w-xl bg-[#f4efe4] text-[#1f1c17] px-5 py-3 rotate-[0.6deg] shadow-[4px_8px_18px_rgba(0,0,0,.6)] fade-up" style={{ fontFamily: "'Caveat', cursive", clipPath: 'polygon(0 6%, 3% 0, 97% 2%, 100% 8%, 99% 94%, 96% 100%, 4% 98%, 0 92%)' }}>
                <span className="text-[19px] leading-snug">{feedback}</span>
              </div>
            )}

            {/* small legend */}
            <div className="absolute right-5 bottom-4 flex gap-4 font-serif-jp text-[10px] tracking-[0.25em] uppercase text-[#3b2a18]/80">
              {[['#d33a3a', 'hora'], ['#2a62c9', 'pessoa'], ['#2f8f4a', 'lugar'], ['#e0a020', 'evidência']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
              ))}
              <span className="ml-3">{connections.length} fios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
