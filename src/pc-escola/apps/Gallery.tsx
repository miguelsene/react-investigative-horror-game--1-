import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS, isAlive, pathOf } from '../os/store';
import type { ImageContent, WindowState } from '../os/types';
import { Ico } from '../components/Icons';
import { fmtDate } from '../os/utils';

export default function Gallery({ win }: { win: WindowState }) {
  const os = useOS();
  const images = useMemo(
    () => os.files.filter((f) => f.type === 'image' && isAlive(os.files, f.id)).sort((a, b) => ((a.content as ImageContent).taken < (b.content as ImageContent).taken ? 1 : -1)),
    [os.files],
  );
  const [current, setCurrent] = useState<string | null>(win.props.imageId ?? null);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const idx = images.findIndex((i) => i.id === current);
  const img = images[idx];

  useEffect(() => {
    if (win.props.imageId) setCurrent(win.props.imageId);
  }, [win.props.imageId, win.props.nonce]);
  useEffect(() => {
    if (!playing || images.length === 0) return;
    const t = setInterval(() => setCurrent((c) => images[(images.findIndex((i) => i.id === c) + 1) % images.length].id), 3000);
    return () => clearInterval(t);
  }, [playing, images]);
  useEffect(() => { setZoom(1); }, [current]);
  useEffect(() => { ref.current?.focus(); }, [current]);

  const go = (d: number) => images.length && setCurrent(images[(idx + d + images.length) % images.length].id);

  const onKey = (e: React.KeyboardEvent) => {
    if (!img) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === '+' || e.key === '=') setZoom(Math.min(4, zoom + 0.25));
    if (e.key === '-') setZoom(Math.max(0.5, zoom - 0.25));
    if (e.key === 'Escape') { e.stopPropagation(); setPlaying(false); setCurrent(null); }
    if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
  };

  if (!img)
    return (
      <div className="flex flex-col h-full bg-neutral-50">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
          <span className="font-semibold text-sm">Todas as fotos</span>
          <span className="text-xs text-slate-500">{images.length} imagens</span>
          <button disabled={!images.length} onClick={() => { setCurrent(images[0]?.id); setPlaying(true); }} className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40">
            <Ico name="play" size={12} /> Apresentação de slides
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {images.length === 0 && <p className="text-center text-slate-400 mt-20 text-sm">Nenhuma imagem encontrada em Meus Documentos.</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {images.map((f) => {
              const c = f.content as ImageContent;
              return (
                <button key={f.id} onClick={() => setCurrent(f.id)} className="group relative aspect-square overflow-hidden rounded bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <img src={c.src} alt={c.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px] p-1.5 text-left opacity-0 group-hover:opacity-100 transition">
                    {f.name}
                    <div className="text-white/70">{c.taken.split('-').reverse().join('/')}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

  const c = img.content as ImageContent;
  return (
    <div ref={ref} tabIndex={0} onKeyDown={onKey} className="flex flex-col h-full bg-neutral-900 text-white outline-none">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 text-sm">
        <button onClick={() => { setCurrent(null); setPlaying(false); }} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-xs"><Ico name="grid" size={14} /> Miniaturas</button>
        <span className="text-xs text-white/60 truncate mx-2">{img.name}</span>
        <div className="flex-1" />
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 rounded hover:bg-white/10" title="Diminuir zoom (-)"><Ico name="zoomOut" size={16} /></button>
        <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-1.5 rounded hover:bg-white/10" title="Aumentar zoom (+)"><Ico name="zoomIn" size={16} /></button>
        <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded hover:bg-white/10" title="Apresentação de slides (Espaço)"><Ico name={playing ? 'pause' : 'play'} size={15} /></button>
        <button onClick={() => { os.setSettings({ wallpaper: c.src }); os.notify('Papel de parede alterado', img.name); }} className="text-xs px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1" title="Definir como papel de parede"><Ico name="monitor" size={14} /> <span className="hidden md:inline">Papel de parede</span></button>
        <button onClick={() => setInfo(!info)} className={`p-1.5 rounded hover:bg-white/10 ${info ? 'bg-white/15' : ''}`} title="Informações"><Ico name="info" size={16} /></button>
      </div>
      <div className="flex flex-1 min-h-0">
        <div
          className="flex-1 relative overflow-auto flex items-center justify-center"
          onWheel={(e) => { if (e.ctrlKey || e.altKey || true) setZoom((z) => Math.max(0.5, Math.min(4, z + (e.deltaY < 0 ? 0.1 : -0.1)))); }}
        >
          <img src={c.src} alt={c.caption} className="max-w-full max-h-full object-contain transition-transform duration-150" style={{ transform: `scale(${zoom})` }} draggable={false} />
          <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center" title="Anterior (←)"><Ico name="back" size={20} /></button>
          <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center" title="Próxima (→)"><Ico name="forward" size={20} /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 rounded px-3 py-1 text-xs">{c.caption}</div>
        </div>
        {info && (
          <div className="w-56 bg-neutral-800 p-3 text-xs space-y-2 overflow-auto">
            <div className="font-semibold text-sm">Informações</div>
            <div><div className="text-white/50">Nome</div>{img.name}</div>
            <div><div className="text-white/50">Data da foto</div>{c.taken.split('-').reverse().join('/')}</div>
            <div><div className="text-white/50">Local</div>{pathOf(os.files, img.parentId)}</div>
            <div><div className="text-white/50">Modificado</div>{fmtDate(img.modifiedAt)}</div>
            <div><div className="text-white/50">Legenda</div>{c.caption}</div>
            <div><div className="text-white/50">Dimensões</div>1024 × 1024</div>
            <button onClick={() => os.openApp('explorer', { folderId: img.parentId })} className="mt-2 w-full py-1.5 rounded bg-white/10 hover:bg-white/20">Abrir pasta</button>
          </div>
        )}
      </div>
      <div className="flex gap-1 p-1.5 bg-neutral-800 overflow-x-auto">
        {images.map((f) => (
          <button key={f.id} onClick={() => setCurrent(f.id)} className={`shrink-0 w-14 h-10 rounded overflow-hidden ${f.id === img.id ? 'ring-2 ring-purple-400' : 'opacity-60 hover:opacity-100'}`}>
            <img src={(f.content as ImageContent).src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
