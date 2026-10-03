import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS, isAlive, pathOf } from '../os/store';
import type { AppId, FileType } from '../os/types';
import { AppIcon, FileIcon, Ico } from '../components/Icons';
import { fileText, fmtDate, normalize, TYPE_LABEL } from '../os/utils';
import { tr } from '../os/i18n';

const APPS: AppId[] = ['explorer', 'browser', 'mail', 'portal', 'editor', 'sheet', 'gallery', 'trash', 'settings', 'search', 'tasks'];

export function searchAll(files: ReturnType<typeof useOS.getState>['files'], query: string) {
  const q = normalize(query);
  if (!q) return { apps: [] as AppId[], files: [] as { id: string; snippet: string; inName: boolean }[] };
  const apps = APPS.filter((a) => (['pt', 'en', 'ja'] as const).some((l) => normalize(tr(l, a)).includes(q)));
  const res = files
    .filter((f) => isAlive(files, f.id) && f.parentId !== null)
    .map((f) => {
      const inName = normalize(f.name).includes(q);
      const text = fileText(f);
      const nt = normalize(text);
      const idx = nt.indexOf(q);
      if (!inName && idx < 0) return null;
      const snippet = idx >= 0 ? (idx > 30 ? '…' : '') + text.replace(/\s+/g, ' ').slice(Math.max(0, idx - 30), idx + 90) + '…' : '';
      return { id: f.id, snippet, inName };
    })
    .filter(Boolean) as { id: string; snippet: string; inName: boolean }[];
  return { apps, files: res };
}

export default function Search({ win }: { win: { props: Record<string, any> } }) {
  const os = useOS();
  const [q, setQ] = useState<string>(win.props.query ?? '');
  const [sort, setSort] = useState<'relevance' | 'name' | 'date'>('relevance');
  const [type, setType] = useState<'all' | FileType>('all');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (win.props.query !== undefined) setQ(win.props.query);
    ref.current?.focus();
  }, [win.props.query, win.props.nonce]);

  const { apps, files } = useMemo(() => searchAll(os.files, q), [os.files, q]);
  const sorted = useMemo(() => {
    const list = files.map((r) => ({ ...r, f: os.files.find((x) => x.id === r.id)! })).filter((r) => type === 'all' || r.f.type === type);
    if (sort === 'name') list.sort((a, b) => a.f.name.localeCompare(b.f.name, 'pt', { numeric: true }));
    else if (sort === 'date') list.sort((a, b) => b.f.modifiedAt.localeCompare(a.f.modifiedAt));
    else list.sort((a, b) => Number(b.inName) - Number(a.inName));
    return list;
  }, [files, sort, type, os.files]);

  const openFirst = () => {
    if (apps[0]) os.openApp(apps[0]);
    else if (sorted[0]) os.openFile(sorted[0].id);
  };

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="p-3 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="relative">
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && openFirst()} placeholder="Pesquisar arquivos, conteúdos e aplicativos..." className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <Ico name="search" size={17} className="absolute left-3 top-3 text-slate-400" />
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="text-slate-500">Ordenar:</span>
          {(['relevance', 'name', 'date'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`px-2 py-0.5 rounded-full ${sort === s ? 'bg-teal-600 text-white' : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'}`}>{{ relevance: 'Relevância', name: 'Nome', date: 'Data' }[s]}</button>
          ))}
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="ml-auto border rounded px-1 py-0.5 bg-white">
            <option value="all">Todos os tipos</option>
            {(['txt', 'doc', 'sheet', 'presentation', 'image', 'folder'] as FileType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {!q.trim() && <p className="text-center text-slate-400 mt-14">Digite para pesquisar nomes de arquivos, conteúdos e aplicativos.<br /><span className="text-xs">A busca ignora maiúsculas, minúsculas e acentos.</span></p>}
        {q.trim() && apps.length === 0 && sorted.length === 0 && <p className="text-center text-slate-500 mt-14">Nenhum resultado para "{q}".</p>}
        {apps.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-slate-500 px-2 mb-1">APLICATIVOS</div>
            {apps.map((a) => (
              <button key={a} onClick={() => os.openApp(a)} className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-teal-50 text-left">
                <AppIcon app={a} size={28} /> {tr(os.settings.language, a)}
              </button>
            ))}
          </div>
        )}
        {sorted.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 px-2 mb-1">ARQUIVOS E PASTAS ({sorted.length})</div>
            {sorted.map(({ f, snippet }) => (
              <button key={f.id} onClick={() => os.openFile(f.id)} className="w-full flex items-start gap-3 px-2 py-2 rounded hover:bg-teal-50 text-left">
                <FileIcon type={f.type} size={28} src={f.type === 'image' ? (f.content as any)?.src : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex gap-2 items-baseline"><span className="font-medium truncate">{f.name}</span><span className="text-[11px] text-slate-400 shrink-0">{fmtDate(f.modifiedAt)}</span></div>
                  <div className="text-[11px] text-slate-500 truncate">{pathOf(os.files, f.parentId)}</div>
                  {snippet && <div className="text-xs text-slate-600 truncate">{snippet}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
