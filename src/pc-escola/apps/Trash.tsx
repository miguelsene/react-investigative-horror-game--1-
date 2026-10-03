import { useState } from 'react';
import { useOS, pathOf } from '../os/store';
import { FileIcon, Ico } from '../components/Icons';
import { Confirm } from '../components/Dialogs';
import { fileSize, fmtDate, fmtSize } from '../os/utils';

export default function Trash() {
  const os = useOS();
  const items = os.files.filter((f) => f.deleted).sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<null | 'purge' | 'empty'>(null);
  const [msg, setMsg] = useState('');
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const restore = (ids: string[]) => {
    if (!ids.length) return;
    os.restoreFiles(ids);
    setSel([]);
    flash(`${ids.length} item(ns) restaurado(s).`);
  };

  return (
    <div
      className="flex flex-col h-full text-sm outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Delete' && sel.length) setConfirm('purge');
        if (e.key === 'Enter' && sel.length) restore(sel);
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setSel(items.map((i) => i.id)); }
      }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
        <button disabled={!sel.length} onClick={() => restore(sel)} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-200 disabled:opacity-35"><Ico name="undo" size={14} /> Restaurar selecionados</button>
        <button disabled={!items.length} onClick={() => restore(items.map((i) => i.id))} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-200 disabled:opacity-35"><Ico name="rotate" size={14} /> Restaurar todos</button>
        <button disabled={!sel.length} onClick={() => setConfirm('purge')} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-red-100 text-red-700 disabled:opacity-35"><Ico name="x" size={14} /> Excluir definitivamente</button>
        <button disabled={!items.length} onClick={() => setConfirm('empty')} className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-red-100 text-red-700 disabled:opacity-35"><Ico name="trash" size={14} /> Esvaziar Lixeira</button>
      </div>
      <div className="flex-1 overflow-auto" onClick={() => setSel([])}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Ico name="trash" size={48} />
            A Lixeira está vazia.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e2e8f0]">
              <tr className="text-left text-xs text-slate-500">
                <th className="font-medium px-3 py-1.5">Nome</th>
                <th className="font-medium px-3 py-1.5">Local original</th>
                <th className="font-medium px-3 py-1.5 hidden md:table-cell">Excluído em</th>
                <th className="font-medium px-3 py-1.5 hidden md:table-cell text-right">Tamanho</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); setSel(e.ctrlKey || e.metaKey ? (sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id]) : [f.id]); }}
                  onDoubleClick={() => restore([f.id])}
                  className={`cursor-default ${sel.includes(f.id) ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-3 py-1"><div className="flex items-center gap-2"><FileIcon type={f.type} size={20} src={f.type === 'image' ? (f.content as any)?.src : undefined} />{f.name}</div></td>
                  <td className="px-3 py-1 text-slate-500">{pathOf(os.files, f.originalParentId ?? null) || 'Meus Documentos'}</td>
                  <td className="px-3 py-1 text-slate-500 hidden md:table-cell">{f.deletedAt ? fmtDate(f.deletedAt) : '—'}</td>
                  <td className="px-3 py-1 text-slate-500 hidden md:table-cell text-right">{fmtSize(fileSize(f))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex px-3 py-1 border-t bg-slate-50 text-xs text-slate-500">
        <span>{items.length} item(ns) • Duplo clique ou Enter para restaurar à pasta original</span>
        <span className="ml-auto text-blue-700">{msg}</span>
      </div>
      {confirm && (
        <Confirm
          danger
          title={confirm === 'empty' ? 'Esvaziar Lixeira' : 'Excluir definitivamente'}
          message={confirm === 'empty' ? `Tem certeza de que deseja excluir permanentemente ${items.length} item(ns)? Esta ação não pode ser desfeita.` : `Excluir permanentemente ${sel.length} item(ns)? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === 'empty') os.emptyTrash();
            else os.purgeFiles(sel);
            setSel([]);
            setConfirm(null);
            flash('Itens excluídos permanentemente.');
          }}
        />
      )}
    </div>
  );
}
