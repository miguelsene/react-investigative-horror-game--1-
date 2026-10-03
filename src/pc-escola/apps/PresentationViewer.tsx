import { useEffect, useRef, useState } from 'react';
import { useOS } from '../os/store';
import type { PresentationContent, WindowState } from '../os/types';
import { Ico } from '../components/Icons';
import { PrintDialog } from '../components/Dialogs';

export default function PresentationViewer({ win }: { win: WindowState }) {
  const os = useOS();
  const file = os.files.find((f) => f.id === win.props.fileId);
  const pres = (file?.content as PresentationContent) ?? { slides: [] };
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [print, setPrint] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = pres.slides.length;
  const slide = pres.slides[i];

  useEffect(() => ref.current?.focus(), [show]);

  const onKey = (e: React.KeyboardEvent) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); setI(Math.min(n - 1, i + 1)); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); setI(Math.max(0, i - 1)); }
    if (e.key === 'Home') setI(0);
    if (e.key === 'End') setI(n - 1);
    if (e.key === 'Escape' && show) { e.stopPropagation(); setShow(false); }
    if (e.key === 'F5') { e.preventDefault(); setShow(true); }
  };

  if (!file || !slide) return <div className="p-6 text-slate-500">Apresentação não encontrada.</div>;

  const Slide = ({ s, big }: { s: typeof slide; big?: boolean }) => (
    <div className={`w-full h-full bg-gradient-to-br ${s.bg ?? 'from-slate-700 to-slate-900'} text-white flex flex-col ${big ? 'p-[5%]' : 'p-2'} overflow-hidden`}>
      {s.subtitle && !s.bullets && !s.image ? (
        <div className="flex-1 flex flex-col justify-center">
          <h1 className={`${big ? 'text-[min(5vw,3rem)]' : 'text-[8px]'} font-bold leading-tight`}>{s.title}</h1>
          <div className={`${big ? 'w-24 h-1 my-4' : 'w-4 h-px my-1'} bg-white/60`} />
          <p className={`${big ? 'text-[min(2vw,1.15rem)]' : 'text-[4px]'} text-white/80 whitespace-pre-line`}>{s.subtitle}</p>
        </div>
      ) : (
        <>
          <h2 className={`${big ? 'text-[min(3.4vw,2rem)] mb-[3%]' : 'text-[6px] mb-1'} font-bold`}>{s.title}</h2>
          {s.bullets && (
            <ul className={`${big ? 'space-y-3 text-[min(2vw,1.2rem)]' : 'space-y-px text-[3.5px]'} list-disc pl-[5%] text-white/90`}>
              {s.bullets.map((b, k) => <li key={k}>{b}</li>)}
            </ul>
          )}
          {s.image && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
              <img src={s.image} alt="" className="max-h-[80%] max-w-full object-contain rounded shadow-lg" />
              {s.caption && <p className={`${big ? 'text-[min(1.6vw,1rem)]' : 'text-[3.5px]'} text-white/80`}>{s.caption}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (show)
    return (
      <div ref={ref} tabIndex={0} onKeyDown={onKey} onClick={() => setI(Math.min(n - 1, i + 1))} className="absolute inset-0 bg-black flex items-center justify-center outline-none z-30">
        <div className="aspect-video w-full max-h-full">
          <Slide s={slide} big />
        </div>
        <div className="absolute bottom-2 right-3 text-white/50 text-xs">{i + 1} / {n} — Esc para sair</div>
      </div>
    );

  return (
    <div ref={ref} tabIndex={0} onKeyDown={onKey} className="flex flex-col h-full outline-none">
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-orange-50 text-sm">
        <button onClick={() => setShow(true)} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-orange-100 text-xs font-medium" title="F5"><Ico name="play" size={14} /> Apresentar</button>
        <button onClick={() => setPrint(true)} className="p-1.5 rounded hover:bg-orange-100" title="Imprimir"><Ico name="print" size={16} /></button>
        <div className="flex-1" />
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="p-1.5 rounded hover:bg-orange-100 disabled:opacity-30"><Ico name="back" /></button>
        <span className="text-xs w-16 text-center">{i + 1} / {n}</span>
        <button disabled={i === n - 1} onClick={() => setI(i + 1)} className="p-1.5 rounded hover:bg-orange-100 disabled:opacity-30"><Ico name="forward" /></button>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-36 border-r bg-slate-100 overflow-auto p-2 space-y-2 hidden sm:block">
          {pres.slides.map((s, k) => (
            <button key={k} onClick={() => setI(k)} className={`block w-full text-left ${k === i ? 'ring-2 ring-orange-500' : 'ring-1 ring-slate-300 hover:ring-orange-300'} rounded overflow-hidden`}>
              <div className="aspect-video pointer-events-none"><Slide s={s} /></div>
              <div className="text-[10px] px-1 py-0.5 bg-white truncate">{k + 1}. {s.title}</div>
            </button>
          ))}
        </div>
        <div className="flex-1 bg-slate-300 flex items-center justify-center p-4 min-w-0">
          <div className="aspect-video w-full max-w-4xl shadow-xl max-h-full">
            <Slide s={slide} big />
          </div>
        </div>
      </div>
      <div className="px-3 py-1 border-t bg-slate-50 text-xs text-slate-500">Slide {i + 1} de {n} • Setas para navegar • F5 apresentar</div>
      {print && (
        <PrintDialog
          docName={file.name}
          text={pres.slides.map((s, k) => `SLIDE ${k + 1}: ${s.title}\n${s.subtitle ?? ''}\n${(s.bullets ?? []).map((b) => '• ' + b).join('\n')}${s.caption ? '\n[imagem] ' + s.caption : ''}\n`).join('\n')}
          onClose={() => setPrint(false)}
        />
      )}
    </div>
  );
}
