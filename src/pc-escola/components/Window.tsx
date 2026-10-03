import { useRef, type ReactNode } from 'react';
import { useOS } from '../os/store';
import type { WindowState } from '../os/types';
import { AppIcon, Ico } from './Icons';

type Edge = 'r' | 'b' | 'br' | 'l' | 'bl' | 't';

export function Window({ win, children }: { win: WindowState; children: ReactNode }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindow } = useOS.getState();
  const active = useOS((s) => s.activeId === win.id);
  const reduce = useOS((s) => s.settings.reduceMotion);
  const ref = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (win.maximized) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = win.x, oy = win.y;
    const move = (ev: PointerEvent) => {
      const nx = Math.min(window.innerWidth - 80, Math.max(-win.w + 120, ox + ev.clientX - sx));
      const ny = Math.min(window.innerHeight - 80, Math.max(0, oy + ev.clientY - sy));
      if (ref.current) ref.current.style.transform = `translate(${nx - win.x}px, ${ny - win.y}px)`;
      (ref.current as any)._pos = [nx, ny];
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const pos = (ref.current as any)?._pos;
      if (ref.current) ref.current.style.transform = '';
      if (pos) updateWindow(win.id, { x: pos[0], y: pos[1] });
      if (ref.current) (ref.current as any)._pos = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResize = (edge: Edge) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    const sx = e.clientX, sy = e.clientY;
    const o = { x: win.x, y: win.y, w: win.w, h: win.h };
    let last = o;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      const n = { ...o };
      if (edge.includes('r')) n.w = Math.max(340, o.w + dx);
      if (edge.includes('b')) n.h = Math.max(220, o.h + dy);
      if (edge.includes('l')) { n.w = Math.max(340, o.w - dx); n.x = o.x + (o.w - n.w); }
      if (edge === 't') { n.h = Math.max(220, o.h - dy); n.y = Math.max(0, o.y + (o.h - n.h)); }
      last = n;
      if (ref.current) Object.assign(ref.current.style, { left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px` });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      updateWindow(win.id, last);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 44px)', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={win.title}
      onPointerDownCapture={() => focusWindow(win.id)}
      className={`aero-window absolute flex flex-col overflow-hidden text-slate-800 ${win.maximized ? '' : 'rounded-[7px]'} ${
        active ? '' : 'aero-window-inactive'
      } ${reduce ? '' : 'animate-[winIn_.14s_ease-out]'}`}
      style={{ ...style, display: win.minimized ? 'none' : 'flex' }}
    >
      <div
        onPointerDown={startDrag}
        onDoubleClick={(e) => !(e.target as HTMLElement).closest('button') && toggleMaximize(win.id)}
        className={`aero-titlebar h-9 shrink-0 flex items-center gap-2 pl-2.5 select-none ${active ? '' : 'aero-titlebar-inactive'}`}
      >
        <AppIcon app={win.app} size={18} />
        <span className="text-[13px] font-semibold truncate flex-1">{win.title}</span>
        <div className="flex h-[25px] self-start mr-1 mt-0.5 overflow-hidden rounded-b-[4px] border border-white/80 shadow-sm">
          <button title="Minimizar" onClick={() => minimizeWindow(win.id)} className="aero-window-button w-9 h-full flex items-center justify-center">
            <Ico name="min" size={14} />
          </button>
          <button title={win.maximized ? 'Restaurar' : 'Maximizar'} onClick={() => toggleMaximize(win.id)} className="aero-window-button w-9 h-full flex items-center justify-center">
            <Ico name={win.maximized ? 'restore' : 'max'} size={12} />
          </button>
          <button title="Fechar (Alt+F4)" onClick={() => closeWindow(win.id)} className="aero-window-button aero-window-button-close w-10 h-full flex items-center justify-center">
            <Ico name="x" size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative flex flex-col">{children}</div>
      {!win.maximized && (
        <>
          <div onPointerDown={startResize('r')} className="absolute right-0 top-9 bottom-2 w-1.5 cursor-ew-resize" />
          <div onPointerDown={startResize('l')} className="absolute left-0 top-9 bottom-2 w-1.5 cursor-ew-resize" />
          <div onPointerDown={startResize('b')} className="absolute bottom-0 left-2 right-3 h-1.5 cursor-ns-resize" />
          <div onPointerDown={startResize('t')} className="absolute top-0 left-2 right-36 h-1 cursor-ns-resize" />
          <div onPointerDown={startResize('br')} className="absolute right-0 bottom-0 w-3.5 h-3.5 cursor-nwse-resize" />
          <div onPointerDown={startResize('bl')} className="absolute left-0 bottom-0 w-3 h-3 cursor-nesw-resize" />
        </>
      )}
    </div>
  );
}
