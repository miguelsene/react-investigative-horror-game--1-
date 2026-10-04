import React, { useMemo, useRef, useState } from 'react';
import { EvidenceNode, EvidenceConnection } from '../types/game';
import { soundManager } from '../audio/soundManager';

/* ============================================================
   THE CORKBOARD â€” a literal wall board: cork texture in a wooden
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
  onAssignNode: (id: string, sector: number) => void;
  onAddNote: (title: string, summary: string) => string;
  onClose: () => void;
}

const DEDUCTIONS: Record<string, string> = {
  'node_clock_freeze-node_time_0317': 'Os dois relÃ³gios desafiam a causalidade: 06:43 congelado Ã© o espelho da hora morta, 03:17.',
  'node_house-node_photo_1974': 'A casa em 1974 Ã© estruturalmente idÃªntica Ã  de hoje â€” a mesma janela, o mesmo cedro.',
  'node_chiyo-node_photo_1974': 'Chiyo tinha 24 anos em 1974 e jÃ¡ vivia aqui. Ela sabe quem estÃ¡ na janela.',
  'node_gabriela-node_clock_freeze': 'SÃ³ a atenÃ§Ã£o obsessiva de Gabriela registrou a discrepÃ¢ncia de 60 segundos.',
};

const NOTE_W = 190;
const NOTE_H = 132;
const BOARD_W = 1200;
const BOARD_H = 800;

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const paperFor = (cat: string) =>
  cat === 'timeline' ? { bg: '#f7e27a', edge: '#e3c85a', ink: '#3b2f10' } : cat === 'people' ? { bg: '#f9c9d4', edge: '#e9a7b6', ink: '#3a1f28' } : cat === 'location' ? { bg: '#bfe6c7', edge: '#9ccfa8', ink: '#16321f' } : { bg: '#f4efe4', edge: '#d9d1bf', ink: '#1f1c17' };

const pinColorFor = (cat: string) => (cat === 'timeline' ? '#d33a3a' : cat === 'people' ? '#2a62c9' : cat === 'location' ? '#2f8f4a' : '#e0a020');
const sectorFor = (node: EvidenceNode) => node.sector ?? (node.id.startsWith('node_pc_') ? 9 : undefined);

export const EvidenceBoard: React.FC<Props> = ({ nodes, connections, onConnect, onRemoveConnection, onMoveNode, onAssignNode, onAddNote, onClose }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const [local, setLocal] = useState<Record<string, { x: number; y: number }>>({});
  const [reading, setReading] = useState<EvidenceNode | null>(null);
  const [sector, setSector] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftSector, setDraftSector] = useState(1);
  const [placingNodeId, setPlacingNodeId] = useState<string | null>(null);
  const storedNodes = nodes.filter((n) => sectorFor(n) == null);
  const viewNodes = sector == null ? [] : nodes.filter((n) => sectorFor(n) === sector);
  const viewConnections = connections.filter((c) => viewNodes.some((n) => n.id === c.from) && viewNodes.some((n) => n.id === c.to));
  const placeNode = (nodeId: string, targetSector: number) => {
    onAssignNode(nodeId, targetSector);
    setPlacingNodeId(null);
  };



  const pos = (n: EvidenceNode) => local[n.id] ?? { x: n.x, y: n.y };
  const pinOf = (n: EvidenceNode) => {
    const p = pos(n);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: p.x + NOTE_W / 2, y: p.y + 10 };
    return { x: p.x / BOARD_W * rect.width + Math.min(rect.width * 0.21, NOTE_W / 2), y: p.y / BOARD_H * rect.height + 10 };
  };

  const boardXY = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * BOARD_W, y: (e.clientY - r.top) / r.height * BOARD_H };
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
      setFeedback('HipÃ³tese amarrada. Nada prova a ligaÃ§Ã£o â€” ainda.');
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
    const noteWidth = Math.min(BOARD_W * 0.42, NOTE_W / r.width * BOARD_W);
    const noteHeight = Math.min(BOARD_H * 0.2, NOTE_H / r.height * BOARD_H);
    const x = Math.max(6, Math.min(BOARD_W - noteWidth - 6, m.x - drag.dx));
    const y = Math.max(6, Math.min(BOARD_H - noteHeight - 6, m.y - drag.dy));
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
      viewConnections
        .map((c) => {
          const a = viewNodes.find((n) => n.id === c.from);
          const b = viewNodes.find((n) => n.id === c.to);
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
    [viewConnections, viewNodes, local]
  );

  if (sector === null) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 text-neutral-100" onClick={onClose}>
    <section className="relative flex h-full max-h-[900px] w-full max-w-5xl flex-col rounded border border-amber-100/15 bg-[#17130f] p-4 sm:p-7" onClick={(e) => e.stopPropagation()}>
      <header className="flex items-center justify-between"><div><h2 className="font-title text-xl tracking-[.2em]">QUADRO DE INVESTIGAÃ‡ÃƒO</h2><p className="mt-1 text-xs text-neutral-400">VisÃ£o geral Â· escolha um setor para aproximar</p></div><button onClick={onClose} className="min-h-10 px-3 text-neutral-300">FECHAR Ã—</button></header>
      <div className="my-3 grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5 overflow-hidden rounded-sm border-[7px] border-[#56391f] bg-[#9a6d42] p-1.5 shadow-[inset_0_0_20px_rgba(0,0,0,.55),0_16px_40px_rgba(0,0,0,.45)] sm:my-5 sm:gap-2.5 sm:border-[12px] sm:p-2.5">
        {Array.from({ length: 9 }, (_, i) => {
          const target = i + 1;
          const sectorNodes = nodes.filter((node) => sectorFor(node) === target);
          return <button key={i} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/evidence-node') || placingNodeId; if (id) placeNode(id, target); }} onClick={() => { if (placingNodeId) placeNode(placingNodeId, target); else setSector(target); }} className={`relative flex min-h-0 flex-col overflow-hidden border border-black/30 p-1.5 text-left text-[#291b11] shadow-inner transition hover:bg-[#d0a16d] sm:p-3 ${placingNodeId ? 'bg-[#d7b17d] ring-2 ring-inset ring-amber-100/70' : 'bg-[#b8895a]'}`}>
            <div className="flex w-full items-center justify-between gap-1"><span className="font-mono text-[8px] tracking-widest opacity-60 sm:text-[10px]">SETOR {String(target).padStart(2, '0')}</span><span className="text-[9px] opacity-60">{sectorNodes.length}</span></div>
            <div className="mt-1 grid min-h-0 flex-1 grid-cols-2 content-start gap-1 overflow-hidden sm:mt-2 sm:gap-1.5">{sectorNodes.slice(0, 4).map((node) => { const paper = paperFor(node.category); return <div key={node.id} className="min-h-0 overflow-hidden rounded-[1px] px-1 py-0.5 text-[7px] leading-tight shadow-sm sm:px-1.5 sm:py-1 sm:text-[9px]" style={{ background: paper.bg, color: paper.ink }}><span className="block line-clamp-2 break-words">{node.title}</span></div>; })}</div>
            <span className="mt-1 w-full truncate text-[8px] uppercase tracking-wider opacity-55 sm:text-[9px]">{placingNodeId ? 'solte ou toque para colocar' : `${sectorNodes.length} post-it${sectorNodes.length === 1 ? '' : 's'} Â· abrir setor`}</span>
          </button>;
        })}
      </div>
      <button onClick={() => setDrawerOpen((v) => !v)} className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-t-lg border border-white/20 bg-[#28211a] px-6 py-2 text-lg shadow-lg" aria-expanded={drawerOpen} aria-label="Mostrar pistas guardadas">{drawerOpen ? 'âŒ„' : 'âŒƒ'} <span className="text-xs">GUARDADAS Â· {storedNodes.length}</span></button>
      {drawerOpen && <div className="absolute inset-x-2 bottom-12 max-h-[42%] overflow-y-auto rounded border border-white/20 bg-[#211c18] p-2 shadow-2xl sm:inset-x-8 sm:p-3"><p className="mb-2 text-[10px] text-neutral-300">{placingNodeId ? 'Post-it selecionado. Toque ou arraste para um setor; feche a gaveta para alcançar os setores cobertos.' : 'Arraste um post-it até um setor. No celular, toque no post-it e depois no setor.'}</p><form className="mb-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]" onSubmit={(e) => { e.preventDefault(); if (!draftTitle.trim() || !draftSummary.trim()) return; const id = onAddNote(draftTitle.trim(), draftSummary.trim()); onAssignNode(id, draftSector); setSector(draftSector); setDraftTitle(''); setDraftSummary(''); }}><input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="TÃ­tulo da sua anotaÃ§Ã£o" className="min-h-10 rounded bg-black/40 px-3 text-sm"/><input value={draftSummary} onChange={(e) => setDraftSummary(e.target.value)} placeholder="Escreva o que vocÃª percebeu..." className="min-h-10 rounded bg-black/40 px-3 text-sm"/><select value={draftSector} onChange={(e) => setDraftSector(Number(e.target.value))} className="rounded bg-black/60 px-2 text-xs">{Array.from({length:9},(_,i)=><option key={i} value={i+1}>Setor {i+1}</option>)}</select><button className="min-h-10 rounded bg-amber-100 px-4 text-xs font-bold text-black">COLOCAR NO QUADRO</button></form><div className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2">{storedNodes.map((node) => { const paper = paperFor(node.category); return <div key={node.id} draggable onDragStart={(e) => { e.dataTransfer.setData('text/evidence-node', node.id); setPlacingNodeId(node.id); }} onClick={() => setPlacingNodeId(node.id)} style={{ background: paper.bg, color: paper.ink }} className={`relative flex min-h-[58px] cursor-grab flex-col justify-between overflow-hidden rounded-[2px] border border-black/20 p-1.5 shadow-md sm:min-h-[78px] sm:p-2 ${placingNodeId === node.id ? 'ring-2 ring-amber-200 scale-[1.02]' : ''}`}><div className="min-w-0 flex-1"><div className="line-clamp-2 break-words font-title text-[9px] font-semibold leading-tight sm:text-xs">{node.title}</div><div className="line-clamp-1 break-words text-[8px] leading-tight opacity-70 sm:text-[10px]">{node.summary}</div></div><span className="mt-1 block text-[7px] font-bold uppercase tracking-wider opacity-60">arraste / toque para escolher</span></div>; })}</div></div>}
    </section>
  </div>;


  const selNode = selected ? viewNodes.find((n) => n.id === selected) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[3px] p-2 sm:p-6 select-none fade-up" onClick={onClose}>
      <div className="relative flex h-[calc(100dvh-1rem)] max-h-none w-full max-w-6xl flex-col sm:h-[92vh] sm:max-h-[840px]" onClick={(e) => e.stopPropagation()}>
        {/* header (HUD style) */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-2 sm:items-end sm:pb-2">
          <div className="flex items-baseline gap-3">
            <button onClick={() => { setSelected(null); setSector(null); }} className="min-h-9 rounded border border-white/20 px-3 text-[10px] tracking-widest text-neutral-300">â† SETORES</button>
            <span className="w-1.5 h-1.5 bg-red-500 translate-y-[-3px]" />
            <h2 className="font-title text-lg sm:text-xl tracking-[0.16em] sm:tracking-[0.3em] text-neutral-100">QUADRO</h2>
            <span className="hidden sm:inline font-serif-jp text-xs tracking-[0.35em] text-neutral-500">ä»®èª¬ç›¤</span>
            <span className="font-serif-jp text-[9px] sm:text-[11px] text-neutral-400 sm:text-neutral-500 sm:ml-4 hidden sm:inline">arraste as notas Â· clique em dois alfinetes para amarrar um fio</span>
          </div>
          <button onClick={onClose} className="min-h-10 shrink-0 px-2 font-serif-jp text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.3em] text-neutral-300 hover:text-white">Q / ESC âœ•</button>
        </div>

        {/* wooden frame */}
        <div className="relative flex min-h-0 flex-1 rounded-[3px] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.8)] sm:p-[14px]" style={{ background: 'linear-gradient(135deg,#5a3a22,#3b2414 40%,#4a2f1b 70%,#2c1a0e)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.6), inset 0 0 0 4px rgba(255,220,180,.06), 0 30px 80px rgba(0,0,0,.8)' }}>
          {/* cork */}
          <div
            ref={boardRef}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative w-full h-full overflow-hidden touch-none"
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
              <div className="text-xl leading-none">Caso 74-0317 â€” Kyoto</div>
              <div className="text-sm opacity-70">o que se repete nÃ£o Ã© coincidÃªncia</div>
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
            {viewNodes.map((n) => {
              const p = pos(n);
              const h = hash(n.id);
              const rot = ((h % 9) - 4) * 0.55;
              const paper = paperFor(n.category);
              const isSel = selected === n.id;
              const polaroid = n.category === 'evidence';
              const boardWidth = boardRef.current?.getBoundingClientRect().width ?? 900;
              const noteWidthPercent = Math.min(42, (NOTE_W / boardWidth) * 100);
              const leftPercent = Math.max(0, Math.min(100 - noteWidthPercent, (p.x / BOARD_W) * 100));
              return (
                <div
                  key={n.id}
                  onPointerDown={(e) => startDrag(e, n)}
                  style={{ left: `${leftPercent}%`, top: `${Math.min(82, (p.y / BOARD_H) * 100)}%`, width: 'min(42%, 190px)', transform: `rotate(${isSel ? rot * 0.3 : rot}deg)`, zIndex: drag?.id === n.id ? 30 : isSel ? 20 : 10, cursor: drag?.id === n.id ? 'grabbing' : 'grab', touchAction: 'none' }}
                  className="absolute transition-transform duration-150"
                >
                  {/* paper */}
                  {polaroid ? (
                    <div className="bg-[#f6f3ec] p-1.5 pb-3 shadow-[4px_8px_16px_rgba(0,0,0,.55)] border border-black/10 sm:p-2 sm:pb-8" style={{ minHeight: 'clamp(68px, 20vw, 132px)' }}>
                      <div className="relative h-[clamp(24px,9vw,86px)] w-full overflow-hidden sm:h-[86px]" style={{ background: 'radial-gradient(circle at 60% 40%, #8c7b68, #3a3129 70%, #1b1611)' }}>
                        <div className="absolute right-4 top-3 w-6 h-8 bg-[#d6c8ad] opacity-80" />
                        <div className="absolute right-5 top-4 w-3 h-6 bg-[#231c16]" />
                        <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(#000 0.6px, transparent 0.7px)', backgroundSize: '3px 3px' }} />
                      </div>
                      <div className="mt-2 text-[#2b2620] leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
                        <div className="line-clamp-2 break-words text-[clamp(9px,3vw,19px)]">{n.title}</div>
                        {n.time && <div className="text-[clamp(8px,2vw,13px)] text-red-800">{n.time}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="relative px-2 pt-3 pb-2 shadow-[4px_8px_16px_rgba(0,0,0,.5)] sm:px-3.5 sm:pt-5 sm:pb-3" style={{ minHeight: 'clamp(68px, 20vw, 132px)', background: `linear-gradient(180deg, ${paper.bg}, ${paper.edge})`, color: paper.ink }}>
                      <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.08))' }} />
                      <div className="leading-tight" style={{ fontFamily: "'Caveat', 'Shippori Mincho', cursive" }}>
                        <div className="flex items-baseline justify-between gap-1 text-[clamp(9px,3vw,19px)]"><span className="line-clamp-2 break-words">{n.title}</span>{n.time && <span className="shrink-0 text-[clamp(8px,2vw,14px)] text-red-800">{n.time}</span>}</div>
                        <p className="mt-1 line-clamp-3 break-words text-[clamp(8px,2.4vw,14px)] opacity-85 sm:line-clamp-4">{n.summary}</p>
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
                    title={isSel ? 'Selecionado â€” clique em outro alfinete para amarrar' : 'Amarrar fio a partir daqui'}
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
              {[['#d33a3a', 'hora'], ['#2a62c9', 'pessoa'], ['#2f8f4a', 'lugar'], ['#e0a020', 'evidÃªncia']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
              ))}
              <span className="ml-3">{viewConnections.length} fios</span>
            </div>
          </div>
        </div>
        <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded border border-white/15 bg-[#141217]/95 sm:hidden">
          <div className="shrink-0 border-b border-white/10 px-3 py-2 font-serif-jp text-[10px] leading-5 text-neutral-300">
            Toque em duas pistas para ligar os fatos. Arraste nÃ£o Ã© necessÃ¡rio.
            {selected && <span className="ml-1 text-red-200">Escolha a segunda pista.</span>}
          </div>
          {feedback && <div role="status" className="shrink-0 border-b border-amber-200/20 bg-amber-100 px-3 py-2 font-serif-jp text-sm text-[#261b10]">{feedback}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <div className="grid grid-cols-1 gap-2">
              {viewNodes.map((node, index) => {
                const paper = paperFor(node.category);
                const isSelected = selected === node.id;
                const category = node.category === 'timeline' ? 'HORA' : node.category === 'people' ? 'PESSOA' : node.category === 'location' ? 'LUGAR' : 'EVIDÃŠNCIA';
                return <article key={node.id} className={`relative flex min-h-[6.5rem] w-full items-start gap-2 rounded-sm border p-2.5 text-left shadow-md ${isSelected ? 'border-red-700 ring-1 ring-red-700/40' : 'border-black/20'}`} style={{ background: paper.bg, color: paper.ink }}>
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white shadow" style={{ background: pinColorFor(node.category) }}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 pb-8">
                    <span className="flex flex-wrap items-center justify-between gap-x-2 text-[9px] font-semibold tracking-[0.15em] opacity-65"><span>{category}</span>{node.time && <span>{node.time}</span>}</span>
                    <span className="mt-1 block font-title text-xs font-bold tracking-wide">{node.title}</span>
                    <span className="mt-1 block line-clamp-2 break-words font-serif-jp text-[11px] leading-4 opacity-85">{node.summary}</span>
                  </span>
                  <span className="absolute bottom-1.5 left-2.5 right-2.5 flex gap-2"><button onClick={() => setReading(node)} aria-label={`Ampliar e ler ${node.title}`} className="min-h-8 flex-1 rounded border border-black/20 bg-black/5 font-serif-jp text-[10px] font-semibold">AMPLIAR / LER</button><button onClick={() => onPinClick(node)} aria-pressed={isSelected} className="min-h-8 flex-1 rounded border border-black/20 bg-black/5 font-serif-jp text-[10px] font-semibold">{isSelected ? 'SELECIONADA' : 'LIGAR'}</button></span>
                </article>;
              })}
              {viewNodes.length === 0 && <p className="py-8 text-center font-serif-jp text-sm text-neutral-400">Este setor estÃ¡ vazio. Volte aos setores e abra as pistas guardadas.</p>}
            </div>
            <section className="mt-5 border-t border-white/10 pt-4">
              <h3 className="mb-2 font-title text-[10px] tracking-[0.2em] text-neutral-300">LIGAÃ‡Ã•ES ({viewConnections.length})</h3>
              {viewConnections.length === 0 ? <p className="font-serif-jp text-xs text-neutral-500">As relaÃ§Ãµes que vocÃª fizer aparecerÃ£o aqui.</p> : <ul className="space-y-2">{viewConnections.map((connection) => {
                const from = viewNodes.find((node) => node.id === connection.from)?.title ?? 'Pista';
                const to = viewNodes.find((node) => node.id === connection.to)?.title ?? 'Pista';
                return <li key={connection.id} className="flex items-center gap-2 rounded border border-white/10 bg-white/[.03] p-2.5">
                  <span className="min-w-0 flex-1 font-serif-jp text-[11px] leading-4 text-neutral-300">{from} <span className="text-red-300">â†”</span> {to}</span>
                  <button onClick={() => onRemoveConnection(connection.id)} aria-label={`Remover ligaÃ§Ã£o entre ${from} e ${to}`} className="min-h-9 min-w-9 rounded border border-white/10 text-neutral-400 hover:text-red-200">Ã—</button>
                </li>;
              })}</ul>}
            </section>
          </div>
        </div>
        {reading && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-5" onClick={() => setReading(null)}><article className="relative w-full max-w-sm p-6 shadow-2xl" style={{ background: paperFor(reading.category).bg, color: paperFor(reading.category).ink }} onClick={(e) => e.stopPropagation()}><button onClick={() => setReading(null)} className="absolute right-3 top-2 min-h-10 min-w-10 text-xl" aria-label="Fechar leitura">Ã—</button><span className="font-mono text-[10px] uppercase tracking-wider opacity-60">{reading.category}{reading.time ? ` Â· ${reading.time}` : ''}</span><h3 className="mt-4 font-title text-2xl">{reading.title}</h3><p className="mt-4 font-serif-jp text-base leading-7">{reading.summary}</p></article></div>}
      </div>
    </div>
  );
};
