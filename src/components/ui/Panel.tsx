import React, { useEffect, useId, useRef } from 'react';

/* Minimal, HUD-matching panel: hairlines, serif typography, no heavy boxes. */
interface PanelProps {
  title: string;
  jp?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  hotkey?: string;
  bodyClassName?: string;
  surfaceClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, jp, subtitle, onClose, children, footer, width = 'max-w-4xl', hotkey, bodyClassName = '', surfaceClassName = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => { previous?.focus({ preventScroll: true }); };
  }, []);

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 backdrop-blur-[3px] p-4 sm:p-8 select-none fade-up" onClick={onClose}>
    <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      className={`relative w-full ${width} max-h-[88dvh] flex flex-col text-neutral-200 outline-none ${surfaceClassName}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        if (e.key !== 'Tab') return;
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex="0"]') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      }}>
      {/* corner marks */}
      <span className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-neutral-500/60" />
      <span className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-neutral-500/60" />
      <span className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-neutral-500/60" />
      <span className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-neutral-500/60" />

      <header className="flex shrink-0 items-end justify-between gap-4 pb-3 border-b border-neutral-700/60">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="w-1.5 h-1.5 bg-red-500 translate-y-[-3px]" />
            <h2 id={titleId} className="font-title text-xl sm:text-2xl tracking-[0.3em] text-neutral-100">{title}</h2>
            {jp && <span className="font-serif-jp text-xs tracking-[0.35em] text-neutral-500">{jp}</span>}
          </div>
          {subtitle && <p className="font-serif-jp text-[11px] tracking-[0.15em] text-neutral-500 mt-1 ml-4">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Fechar painel" className="shrink-0 font-serif-jp text-[11px] tracking-[0.3em] text-neutral-400 hover:text-white transition-colors">
          {hotkey ? `${hotkey} / ESC` : 'ESC'} ✕
        </button>
      </header>

      <div className={`min-h-0 flex-1 overflow-y-auto py-5 pr-1 ${bodyClassName}`}>{children}</div>

      {footer && <footer className="shrink-0 pt-3 border-t border-neutral-700/60 font-serif-jp text-[11px] tracking-[0.2em] text-neutral-400 flex flex-wrap gap-3 items-center justify-between">{footer}</footer>}
    </div>
  </div>
  );
};

export const Hairline: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <span className="h-px flex-1 bg-neutral-700/50" />
    {label && <span className="font-serif-jp text-[10px] tracking-[0.4em] uppercase text-neutral-500">{label}</span>}
    <span className="h-px flex-1 bg-neutral-700/50" />
  </div>
);
