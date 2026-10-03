import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS, childrenOf, isAlive, pathOf, ROOT_ID } from '../os/store';
import type { VFile, WindowState } from '../os/types';
import { FileIcon, Ico } from '../components/Icons';
import { FolderTree } from '../components/FolderTree';
import { Btn, Modal } from '../components/Dialogs';
import { fileSize, fileText, fmtDate, fmtSize, normalize, TYPE_LABEL } from '../os/utils';

type SortKey = 'name' | 'modifiedAt' | 'type' | 'size';

export function useDoubleClick() {
  const speed = useOS((s) => s.settings.cursorSpeed);
  const last = useRef<{ id: string; t: number } | null>(null);
  const threshold = 750 - speed * 50;
  return (id: string) => {
    const now = Date.now();
    const isDouble = !!last.current && last.current.id === id && now - last.current.t < threshold;
    last.current = isDouble ? null : { id, t: now };
    return isDouble;
  };
}

export default function FileExplorer({ win }: { win: WindowState }) {
  const s = useOS();
  const { files, clipboard } = s;
  const [folderId, setFolderId] = useState<string>(win.props.folderId ?? ROOT_ID);
  const [hist, setHist] = useState<{ stack: string[]; i: number }>({ stack: [win.props.folderId ?? ROOT_ID], i: 0 });
  const [sel, setSel] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  const [view, setView] = useState<'list' | 'icons'>('list');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; item: string | null } | null>(null);
  const [props, setProps] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [dropOver, setDropOver] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isDouble = useDoubleClick();

  useEffect(() => {
    if (win.props.folderId && win.props.folderId !== folderId) navigate(win.props.folderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.props.folderId, win.props.nonce]);

  // if current folder deleted, go root
  useEffect(() => {
    if (!isAlive(files, folderId)) navigate(ROOT_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const current = files.find((f) => f.id === folderId);
  useEffect(() => {
    if (current) s.updateWindow(win.id, { title: current.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.name]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  function navigate(id: string, push = true) {
    setFolderId(id);
    setSel([]);
    setQuery('');
    setRenaming(null);
    if (push) setHist((h) => ({ stack: [...h.stack.slice(0, h.i + 1), id], i: h.i + 1 }));
  }
  const goBack = () => hist.i > 0 && (setHist({ ...hist, i: hist.i - 1 }), navigate(hist.stack[hist.i - 1], false));
  const goFwd = () => hist.i < hist.stack.length - 1 && (setHist({ ...hist, i: hist.i + 1 }), navigate(hist.stack[hist.i + 1], false));
  const goUp = () => current?.parentId && navigate(current.parentId);

  const items = useMemo(() => {
    let list: VFile[];
    if (query.trim()) {
      const q = normalize(query);
      list = files.filter((f) => isAlive(files, f.id) && f.id !== folderId && pathOf(files, f.id).startsWith(pathOf(files, folderId) + '/') && (normalize(f.name).includes(q) || normalize(fileText(f)).includes(q)));
    } else list = childrenOf(files, folderId);
    return [...list].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (b.type === 'folder' && a.type !== 'folder') return 1;
      let r = 0;
      if (sort.key === 'name') r = a.name.localeCompare(b.name, 'pt', { numeric: true });
      if (sort.key === 'modifiedAt') r = a.modifiedAt.localeCompare(b.modifiedAt);
      if (sort.key === 'type') r = TYPE_LABEL[a.type].localeCompare(TYPE_LABEL[b.type]);
      if (sort.key === 'size') r = fileSize(a) - fileSize(b);
      return r * sort.dir;
    });
  }, [files, folderId, query, sort]);

  const open = (f: VFile) => (f.type === 'folder' ? navigate(f.id) : s.openFile(f.id));

  const startRename = (id?: string) => {
    const f = files.find((x) => x.id === (id ?? sel[0]));
    if (!f) return;
    if (f.readOnly) return flash('Arquivo somente leitura — não pode ser renomeado.');
    setRenaming(f.id);
    setRenameVal(f.name);
  };
  const commitRename = () => {
    if (!renaming) return;
    const err = s.renameFile(renaming, renameVal);
    if (err) flash(err);
    setRenaming(null);
    rootRef.current?.focus();
  };

  const doCopy = (mode: 'copy' | 'cut') => {
    if (!sel.length) return;
    s.setClipboard({ mode, ids: sel });
    flash(`${sel.length} item(ns) ${mode === 'copy' ? 'copiado(s)' : 'recortado(s)'}.`);
  };
  const doPaste = (target = folderId) => {
    if (!clipboard) return;
    if (clipboard.mode === 'cut') {
      const n = s.moveFiles(clipboard.ids, target);
      s.setClipboard(null);
      flash(n ? `${n} item(ns) movido(s).` : 'Nada foi movido (mesmo local, protegido ou somente leitura).');
    } else {
      const created = s.copyFiles(clipboard.ids, target);
      flash(`${created.length} item(ns) colado(s).`);
      setSel(created);
    }
  };
  const doDelete = () => {
    if (!sel.length) return;
    const n = s.trashFiles(sel);
    if (n) flash(`${n} item(ns) enviado(s) para a Lixeira.`);
    setSel([]);
  };
  const doUndo = () => flash(s.undoFiles() ? 'Ação desfeita.' : 'Nada para desfazer.');
  const newFolder = () => {
    const id = s.createFolder(folderId);
    setSel([id]);
    setRenaming(id);
    setRenameVal(useOS.getState().files.find((f) => f.id === id)?.name ?? 'Nova pasta');
  };
  const newText = () => {
    const id = s.createFile(folderId, 'Novo documento.txt', 'txt', '');
    setSel([id]);
    setRenaming(id);
    setRenameVal(useOS.getState().files.find((f) => f.id === id)?.name ?? 'Novo documento.txt');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (ctrl && k === 'c') { e.preventDefault(); doCopy('copy'); }
    else if (ctrl && k === 'x') { e.preventDefault(); doCopy('cut'); }
    else if (ctrl && k === 'v') { e.preventDefault(); doPaste(); }
    else if (ctrl && k === 'z') { e.preventDefault(); doUndo(); }
    else if (ctrl && k === 'a') { e.preventDefault(); setSel(items.map((i) => i.id)); }
    else if (ctrl && k === 'f') { e.preventDefault(); searchRef.current?.focus(); }
    else if (e.key === 'Delete') { e.preventDefault(); doDelete(); }
    else if (e.key === 'F2') { e.preventDefault(); startRename(); }
    else if (e.key === 'Enter') { const f = files.find((x) => x.id === sel[0]); if (f) open(f); }
    else if (e.key === 'Backspace') { e.preventDefault(); goUp(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = items.findIndex((i) => i.id === sel[sel.length - 1]);
      const n = Math.max(0, Math.min(items.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1)));
      if (items[n]) { setSel([items[n].id]); setAnchor(items[n].id); }
    }
  };

  const clickItem = (e: React.MouseEvent, f: VFile) => {
    e.stopPropagation();
    setMenu(null);
    if (renaming === f.id) return;
    if (isDouble(f.id) && !e.ctrlKey && !e.shiftKey) return open(f);
    if (e.ctrlKey || e.metaKey) setSel(sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id]);
    else if (e.shiftKey && anchor) {
      const a = items.findIndex((i) => i.id === anchor), b = items.findIndex((i) => i.id === f.id);
      setSel(items.slice(Math.min(a, b), Math.max(a, b) + 1).map((i) => i.id));
    } else setSel([f.id]);
    if (!e.shiftKey) setAnchor(f.id);
  };

  const onDropTo = (ids: string[], target: string) => {
    const n = s.moveFiles(ids, target);
    flash(n ? `${n} item(ns) movido(s) para ${files.find((f) => f.id === target)?.name}.` : 'Não foi possível mover para esse local.');
  };

  const ctx = (e: React.MouseEvent, item: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const r = rootRef.current!.getBoundingClientRect();
    if (item && !sel.includes(item)) setSel([item]);
    setMenu({ x: Math.min(e.clientX - r.left, r.width - 200), y: Math.min(e.clientY - r.top, r.height - 260), item });
  };

  const sortBy = (key: SortKey) => setSort((p) => ({ key, dir: p.key === key ? (p.dir === 1 ? -1 : 1) : 1 }));
  const propFile = files.find((f) => f.id === props);
  const crumbs = pathOf(files, folderId).split('/');
  const crumbIds = (() => {
    const ids: string[] = [];
    let c = current;
    while (c) { ids.unshift(c.id); const p = c.parentId; c = p ? files.find((x) => x.id === p) : undefined; }
    return ids;
  })();

  const TB = ({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) => (
    <button title={label} disabled={disabled} onClick={onClick} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-200 disabled:opacity-35">
      <Ico name={icon} size={15} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKey} onClick={() => setMenu(null)} className="flex flex-col h-full outline-none text-sm relative">
      {/* address bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
        <button onClick={goBack} disabled={hist.i === 0} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30" title="Voltar"><Ico name="back" /></button>
        <button onClick={goFwd} disabled={hist.i >= hist.stack.length - 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30" title="Avançar"><Ico name="forward" /></button>
        <button onClick={goUp} disabled={!current?.parentId} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30" title="Acima (Backspace)"><Ico name="up" /></button>
        <div className="flex-1 flex items-center gap-0.5 border rounded bg-white px-2 py-1 overflow-hidden text-[13px]">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-0.5 whitespace-nowrap">
              {i > 0 && <Ico name="forward" size={11} className="text-slate-400" />}
              <button onClick={() => navigate(crumbIds[i])} className="hover:bg-slate-100 rounded px-1">{c}</button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Pesquisar em ${current?.name ?? ''}`} className="border rounded pl-7 pr-2 py-1 w-44 md:w-56 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <Ico name="search" size={13} className="absolute left-2 top-2 text-slate-400" />
        </div>
      </div>
      {/* toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b flex-wrap">
        <TB icon="folderPlus" label="Nova pasta" onClick={newFolder} />
        <TB icon="filePlus" label="Novo texto" onClick={newText} />
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <TB icon="cut" label="Recortar" onClick={() => doCopy('cut')} disabled={!sel.length} />
        <TB icon="copy" label="Copiar" onClick={() => doCopy('copy')} disabled={!sel.length} />
        <TB icon="paste" label="Colar" onClick={() => doPaste()} disabled={!clipboard} />
        <TB icon="edit" label="Renomear" onClick={() => startRename()} disabled={sel.length !== 1} />
        <TB icon="trash" label="Excluir" onClick={doDelete} disabled={!sel.length} />
        <TB icon="undo" label="Desfazer" onClick={doUndo} disabled={!s.fileUndo.length} />
        <TB icon="info" label="Propriedades" onClick={() => setProps(sel[0] ?? folderId)} />
        <div className="ml-auto flex items-center gap-1">
          <select value={sort.key} onChange={(e) => setSort({ key: e.target.value as SortKey, dir: 1 })} className="text-xs border rounded px-1 py-1 bg-white" title="Ordenar por">
            <option value="name">Nome</option>
            <option value="modifiedAt">Data</option>
            <option value="type">Tipo</option>
            <option value="size">Tamanho</option>
          </select>
          <button onClick={() => setSort({ ...sort, dir: sort.dir === 1 ? -1 : 1 })} className="p-1 rounded hover:bg-slate-200 text-xs w-6" title="Inverter ordem">{sort.dir === 1 ? '↑' : '↓'}</button>
          <button onClick={() => setView('list')} className={`p-1 rounded ${view === 'list' ? 'bg-slate-200' : 'hover:bg-slate-100'}`} title="Lista"><Ico name="list" size={15} /></button>
          <button onClick={() => setView('icons')} className={`p-1 rounded ${view === 'icons' ? 'bg-slate-200' : 'hover:bg-slate-100'}`} title="Ícones"><Ico name="grid" size={15} /></button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="w-48 border-r bg-slate-50/70 overflow-auto p-1.5 hidden sm:block">
          <FolderTree selected={folderId} onSelect={navigate} onDropItems={onDropTo} />
          <div className="border-t my-2" />
          <button onClick={() => s.openApp('trash')} className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-slate-100 text-[13px]">
            <Ico name="trash" size={15} className="text-slate-500" /> Lixeira
            <span className="ml-auto text-[11px] text-slate-400">{files.filter((f) => f.deleted).length}</span>
          </button>
        </aside>

        <div className="flex-1 overflow-auto" onClick={() => setSel([])} onContextMenu={(e) => ctx(e, null)}>
          {query && <div className="px-3 py-1.5 text-xs bg-amber-50 border-b text-amber-800">Resultados da pesquisa por "{query}" em {current?.name} — {items.length} item(ns)</div>}
          {items.length === 0 && <div className="text-center text-slate-400 mt-16 text-sm">{query ? 'Nenhum item corresponde à pesquisa.' : 'Esta pasta está vazia.'}</div>}

          {view === 'list' && items.length > 0 && (
            <table className="w-full text-[13px] border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e2e8f0] z-10">
                <tr className="text-left text-slate-500 text-xs">
                  {([['name', 'Nome'], ['modifiedAt', 'Data de modificação'], ['type', 'Tipo'], ['size', 'Tamanho']] as [SortKey, string][]).map(([k, l]) => (
                    <th key={k} onClick={(e) => { e.stopPropagation(); sortBy(k); }} className={`font-medium px-3 py-1.5 hover:bg-slate-100 cursor-default ${k === 'type' || k === 'size' ? 'hidden md:table-cell' : ''}`}>
                      {l} {sort.key === k ? (sort.dir === 1 ? '▲' : '▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr
                    key={f.id}
                    draggable={renaming !== f.id}
                    onDragStart={(e) => e.dataTransfer.setData('text/higashi-files', (sel.includes(f.id) ? sel : [f.id]).join(','))}
                    onDragOver={(e) => { if (f.type === 'folder') { e.preventDefault(); setDropOver(f.id); } }}
                    onDragLeave={() => setDropOver(null)}
                    onDrop={(e) => { e.preventDefault(); setDropOver(null); const ids = e.dataTransfer.getData('text/higashi-files'); if (ids && f.type === 'folder') onDropTo(ids.split(',').filter((x) => x !== f.id), f.id); }}
                    onClick={(e) => clickItem(e, f)}
                    onContextMenu={(e) => ctx(e, f.id)}
                    className={`cursor-default ${sel.includes(f.id) ? 'bg-blue-100' : 'hover:bg-slate-50'} ${dropOver === f.id ? 'outline outline-2 outline-blue-400' : ''} ${clipboard?.mode === 'cut' && clipboard.ids.includes(f.id) ? 'opacity-50' : ''}`}
                  >
                    <td className="px-3 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon type={f.type} size={20} src={f.type === 'image' ? (f.content as any)?.src : undefined} empty={f.type === 'folder' && childrenOf(files, f.id).length === 0} />
                        {renaming === f.id ? (
                          <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onFocus={(e) => { const d = e.target.value.lastIndexOf('.'); e.target.setSelectionRange(0, d > 0 && f.type !== 'folder' ? d : e.target.value.length); }} onBlur={commitRename} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenaming(null); rootRef.current?.focus(); } }} onClick={(e) => e.stopPropagation()} className="border border-blue-400 rounded px-1 py-0.5 flex-1 min-w-0 outline-none" />
                        ) : (
                          <span className="truncate">{f.name}</span>
                        )}
                        {f.readOnly && <Ico name="lock" size={11} className="text-slate-400 shrink-0" />}
                        {query && <span className="text-[11px] text-slate-400 truncate ml-1">{pathOf(files, f.parentId)}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-1 text-slate-500 whitespace-nowrap">{fmtDate(f.modifiedAt)}</td>
                    <td className="px-3 py-1 text-slate-500 hidden md:table-cell whitespace-nowrap">{TYPE_LABEL[f.type]}</td>
                    <td className="px-3 py-1 text-slate-500 hidden md:table-cell whitespace-nowrap text-right">{fmtSize(fileSize(f))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'icons' && items.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1 p-2">
              {items.map((f) => (
                <div
                  key={f.id}
                  draggable={renaming !== f.id}
                  onDragStart={(e) => e.dataTransfer.setData('text/higashi-files', (sel.includes(f.id) ? sel : [f.id]).join(','))}
                  onDragOver={(e) => { if (f.type === 'folder') { e.preventDefault(); setDropOver(f.id); } }}
                  onDragLeave={() => setDropOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDropOver(null); const ids = e.dataTransfer.getData('text/higashi-files'); if (ids && f.type === 'folder') onDropTo(ids.split(',').filter((x) => x !== f.id), f.id); }}
                  onClick={(e) => clickItem(e, f)}
                  onContextMenu={(e) => ctx(e, f.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded text-center ${sel.includes(f.id) ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-slate-100'} ${dropOver === f.id ? 'ring-2 ring-blue-400' : ''} ${clipboard?.mode === 'cut' && clipboard.ids.includes(f.id) ? 'opacity-50' : ''}`}
                >
                  <FileIcon type={f.type} size={52} src={f.type === 'image' ? (f.content as any)?.src : undefined} />
                  {renaming === f.id ? (
                    <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }} onClick={(e) => e.stopPropagation()} className="border border-blue-400 rounded px-1 text-xs w-full outline-none" />
                  ) : (
                    <span className="text-xs leading-tight line-clamp-2 break-all">{f.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 py-1 border-t bg-slate-50 text-xs text-slate-500">
        <span>{items.length} item(ns)</span>
        {sel.length > 0 && <span>{sel.length} selecionado(s)</span>}
        {clipboard && <span>Área de transferência: {clipboard.ids.length} item(ns) ({clipboard.mode === 'cut' ? 'recortar' : 'copiar'})</span>}
        <span className="ml-auto text-blue-700">{msg}</span>
      </div>

      {menu && (
        <div className="absolute z-40 bg-white shadow-xl ring-1 ring-black/10 rounded py-1 w-48 text-[13px]" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {(menu.item
            ? [
                ['Abrir', () => { const f = files.find((x) => x.id === menu.item); if (f) open(f); }],
                ['—'],
                ['Recortar  Ctrl+X', () => doCopy('cut')],
                ['Copiar  Ctrl+C', () => doCopy('copy')],
                ...(files.find((x) => x.id === menu.item)?.type === 'folder' ? [['Colar na pasta', () => doPaste(menu.item!)] as const] : []),
                ['Renomear  F2', () => startRename(menu.item!)],
                ['Excluir  Del', doDelete],
                ['—'],
                ['Propriedades', () => setProps(menu.item)],
              ]
            : [
                ['Nova pasta', newFolder],
                ['Novo documento de texto', newText],
                ['—'],
                ['Colar  Ctrl+V', () => doPaste()],
                ['Desfazer  Ctrl+Z', doUndo],
                ['—'],
                ['Ordenar por nome', () => setSort({ key: 'name', dir: 1 })],
                ['Ordenar por data', () => setSort({ key: 'modifiedAt', dir: -1 })],
                ['Atualizar', () => flash('Pasta atualizada.')],
                ['Propriedades', () => setProps(folderId)],
              ]
          ).map((m, i) =>
            m[0] === '—' ? (
              <div key={i} className="border-t my-1" />
            ) : (
              <button key={i} onClick={() => { (m[1] as () => void)(); setMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-blue-50 flex justify-between">
                {(m[0] as string).split('  ')[0]}
                <span className="text-slate-400 text-xs">{(m[0] as string).split('  ')[1]}</span>
              </button>
            ),
          )}
        </div>
      )}

      {propFile && (
        <Modal title={`Propriedades — ${propFile.name}`} onClose={() => setProps(null)}>
          <div className="flex items-center gap-3 mb-4">
            <FileIcon type={propFile.type} size={44} src={propFile.type === 'image' ? (propFile.content as any)?.src : undefined} />
            <div className="font-semibold break-all">{propFile.name}</div>
          </div>
          <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[13px]">
            <dt className="text-slate-500">Tipo</dt><dd>{TYPE_LABEL[propFile.type]}</dd>
            <dt className="text-slate-500">Local</dt><dd className="break-all">{pathOf(files, propFile.parentId) || '—'}</dd>
            <dt className="text-slate-500">Tamanho</dt>
            <dd>{propFile.type === 'folder' ? `${files.filter((f) => isAlive(files, f.id) && pathOf(files, f.id).startsWith(pathOf(files, propFile.id) + '/')).length} item(ns)` : fmtSize(fileSize(propFile))}</dd>
            <dt className="text-slate-500">Criado em</dt><dd>{fmtDate(propFile.createdAt)}</dd>
            <dt className="text-slate-500">Modificado em</dt><dd>{fmtDate(propFile.modifiedAt)}</dd>
            <dt className="text-slate-500">Atributos</dt>
            <dd>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={propFile.readOnly} disabled={propFile.id === ROOT_ID || propFile.parentId === 'compartilhados'} onChange={(e) => s.setReadOnly(propFile.id, e.target.checked)} /> Somente leitura
              </label>
            </dd>
          </dl>
          <div className="flex justify-end mt-4"><Btn primary onClick={() => setProps(null)}>OK</Btn></div>
        </Modal>
      )}
    </div>
  );
}
