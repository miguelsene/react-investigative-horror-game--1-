import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS, closeGuards, ESCOLA_ID } from '../os/store';
import type { SheetContent, WindowState } from '../os/types';
import { COLS, displayValue, evaluateSheet } from '../os/formula';
import { Ico } from '../components/Icons';
import { Btn, Modal, PrintDialog, SaveDialog } from '../components/Dialogs';

const EMPTY: SheetContent = { cells: {}, cols: 8, rows: 20 };

export default function Spreadsheet({ win }: { win: WindowState }) {
  const os = useOS();
  const [fileId, setFileId] = useState<string | null>(win.props.fileId ?? null);
  const file = os.files.find((f) => f.id === fileId);
  const content = (file?.content as SheetContent) ?? EMPTY;
  const [cells, setCells] = useState<Record<string, string>>({ ...content.cells });
  const [saved, setSaved] = useState(JSON.stringify(content.cells));
  const [undo, setUndo] = useState<Record<string, string>[]>([]);
  const [redo, setRedo] = useState<Record<string, string>[]>([]);
  const [sel, setSel] = useState('A1');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [barEdit, setBarEdit] = useState(false);
  const [dialog, setDialog] = useState<null | 'saveas' | 'print' | 'close'>(null);
  const [msg, setMsg] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = COLS.slice(0, content.cols ?? 8);
  const rows = Array.from({ length: content.rows ?? 20 }, (_, i) => i + 1);
  const locked = new Set(content.locked ?? []);
  const dirty = JSON.stringify(cells) !== saved;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const name = file?.name ?? 'Nova planilha.xlsx';

  const evalr = useMemo(() => evaluateSheet(cells), [cells]);

  useEffect(() => {
    closeGuards.set(win.id, () => (dirtyRef.current ? (setDialog('close'), false) : true));
    return () => void closeGuards.delete(win.id);
  }, [win.id]);
  useEffect(() => {
    os.updateWindow(win.id, { title: `${dirty ? '● ' : ''}${name} — Planilhas`, props: { ...win.props, fileId } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, dirty, fileId]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const setCell = (ref: string, val: string) => {
    if (locked.has(ref)) return flash(`A célula ${ref} está protegida.`);
    if ((cells[ref] ?? '') === val) return;
    setUndo([...undo.slice(-50), cells]);
    setRedo([]);
    const next = { ...cells };
    if (val === '') delete next[ref];
    else next[ref] = val;
    setCells(next);
  };

  const move = (dc: number, dr: number) => {
    const c = COLS.indexOf(sel.match(/[A-L]/)![0]);
    const r = parseInt(sel.slice(1), 10);
    const nc = Math.max(0, Math.min(cols.length - 1, c + dc));
    const nr = Math.max(1, Math.min(rows.length, r + dr));
    setSel(`${COLS[nc]}${nr}`);
  };

  const startEdit = (initial?: string) => {
    if (locked.has(sel)) return flash(`A célula ${sel} está protegida. Edite apenas as células brancas.`);
    setBarEdit(false);
    setEditing(sel);
    setDraft(initial ?? cells[sel] ?? '');
  };
  const commit = (dc = 0, dr = 1) => {
    if (editing) setCell(editing, draft.trim());
    setEditing(null);
    setBarEdit(false);
    move(dc, dr);
    gridRef.current?.focus();
  };

  const save = (thenClose = false) => {
    if (file && !file.readOnly) {
      os.saveFile(file.id, { ...content, cells });
      setSaved(JSON.stringify(cells));
      flash('Planilha salva.');
      if (thenClose) os.closeWindow(win.id, true);
    } else setDialog('saveas');
  };

  const onGridKey = (e: React.KeyboardEvent) => {
    if (editing) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (ctrl && k.toLowerCase() === 's') { e.preventDefault(); e.shiftKey ? setDialog('saveas') : save(); return; }
    if (ctrl && k.toLowerCase() === 'z') { e.preventDefault(); if (undo.length) { setRedo([...redo, cells]); setCells(undo[undo.length - 1]); setUndo(undo.slice(0, -1)); } return; }
    if (ctrl && k.toLowerCase() === 'y') { e.preventDefault(); if (redo.length) { setUndo([...undo, cells]); setCells(redo[redo.length - 1]); setRedo(redo.slice(0, -1)); } return; }
    if (ctrl && k.toLowerCase() === 'c') { navigator.clipboard?.writeText(cells[sel] ?? '').catch(() => {}); flash(`${sel} copiada.`); return; }
    if (ctrl && k.toLowerCase() === 'p') { e.preventDefault(); setDialog('print'); return; }
    if (k === 'ArrowUp') { e.preventDefault(); move(0, -1); }
    else if (k === 'ArrowDown') { e.preventDefault(); move(0, 1); }
    else if (k === 'ArrowLeft') { e.preventDefault(); move(-1, 0); }
    else if (k === 'ArrowRight' || k === 'Tab') { e.preventDefault(); move(e.shiftKey && k === 'Tab' ? -1 : 1, 0); }
    else if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); setCell(sel, ''); }
    else if (k.length === 1 && !ctrl && !e.altKey) { e.preventDefault(); startEdit(k); }
  };

  const printText = () => {
    const lines: string[] = [name, ''];
    rows.forEach((r) => {
      const vals = cols.map((c) => displayValue(evalr.valueOf(`${c}${r}`)));
      if (vals.some((v) => v !== '')) lines.push(`${r}`.padStart(2) + ' | ' + vals.map((v) => v.slice(0, 14).padEnd(14)).join(' | '));
    });
    return lines.join('\n');
  };

  const raw = editing === sel ? draft : cells[sel] ?? '';

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-emerald-50 flex-wrap">
        <button onClick={() => os.openApp('sheet', {})} className="p-1.5 rounded hover:bg-emerald-100" title="Nova planilha"><Ico name="filePlus" size={16} /></button>
        <button onClick={() => save()} className="p-1.5 rounded hover:bg-emerald-100" title="Salvar (Ctrl+S)"><Ico name="save" size={16} /></button>
        <button onClick={() => setDialog('saveas')} className="text-xs px-2 py-1 rounded hover:bg-emerald-100">Salvar como…</button>
        <button onClick={() => setDialog('print')} className="p-1.5 rounded hover:bg-emerald-100" title="Imprimir"><Ico name="print" size={16} /></button>
        <div className="w-px h-5 bg-emerald-200 mx-1" />
        <button disabled={!undo.length} onClick={() => { setRedo([...redo, cells]); setCells(undo[undo.length - 1]); setUndo(undo.slice(0, -1)); }} className="p-1.5 rounded hover:bg-emerald-100 disabled:opacity-30" title="Desfazer"><Ico name="undo" size={16} /></button>
        <button disabled={!redo.length} onClick={() => { setUndo([...undo, cells]); setCells(redo[redo.length - 1]); setRedo(redo.slice(0, -1)); }} className="p-1.5 rounded hover:bg-emerald-100 disabled:opacity-30" title="Refazer"><Ico name="redo" size={16} /></button>
        <button onClick={() => { setSel(sel); startEdit('=SUM()'); }} className="text-xs px-2 py-1 rounded hover:bg-emerald-100 font-semibold">Σ SUM</button>
        <span className="ml-auto text-xs text-emerald-800">{msg}</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 border-b">
        <div className="w-14 text-center font-mono text-xs border rounded py-1 bg-slate-50">{sel}</div>
        <span className="italic text-slate-400 font-serif">fx</span>
        <input
          value={raw}
          readOnly={locked.has(sel)}
          onFocus={() => { if (!editing && !locked.has(sel)) { setBarEdit(true); setEditing(sel); setDraft(cells[sel] ?? ''); } }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(null); setBarEdit(false); gridRef.current?.focus(); } }}
          onBlur={() => { if (barEdit && editing) { setCell(editing, draft.trim()); setEditing(null); setBarEdit(false); } }}
          className={`flex-1 border rounded px-2 py-1 font-mono text-xs ${locked.has(sel) ? 'bg-slate-50 text-slate-500' : ''}`}
          placeholder={locked.has(sel) ? 'Célula protegida' : 'Valor ou fórmula (ex.: =SUM(A1:A2))'}
        />
      </div>
      <div ref={gridRef} tabIndex={0} onKeyDown={onGridKey} className="flex-1 overflow-auto outline-none bg-white">
        <table className="border-collapse text-[13px] select-none">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 bg-slate-100 border border-slate-300 sticky left-0 z-20" />
              {cols.map((c) => (
                <th key={c} className={`bg-slate-100 border border-slate-300 font-medium text-slate-600 py-0.5 ${sel.startsWith(c) && /\d/.test(sel[1]) ? 'bg-emerald-100' : ''}`} style={{ width: content.widths?.[c] ?? 96, minWidth: content.widths?.[c] ?? 96 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td className={`bg-slate-100 border border-slate-300 text-center text-slate-600 text-xs sticky left-0 ${sel.slice(1) === String(r) ? 'bg-emerald-100' : ''}`}>{r}</td>
                {cols.map((c) => {
                  const ref = `${c}${r}`;
                  const v = evalr.valueOf(ref);
                  const isSel = sel === ref;
                  const isLocked = locked.has(ref);
                  const isNum = typeof v === 'number';
                  const isErr = typeof v === 'string' && v.startsWith('#');
                  const isHeader = isLocked && !isNum && (cells[ref] ?? '') !== '';
                  return (
                    <td
                      key={ref}
                      onClick={() => { if (editing && editing !== ref) commit(0, 0); setSel(ref); gridRef.current?.focus(); }}
                      onDoubleClick={() => { setSel(ref); setTimeout(() => startEdit(), 0); }}
                      className={`border border-slate-200 h-6 px-1.5 relative ${isLocked ? 'bg-slate-50' : ''} ${isSel ? 'outline outline-2 outline-emerald-600 -outline-offset-1 z-[1]' : ''} ${isNum ? 'text-right tabular-nums' : ''} ${isErr ? 'text-red-600' : ''} ${isHeader ? 'font-semibold text-slate-700' : ''}`}
                    >
                      {editing === ref && !barEdit ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commit(0, 1); }
                            else if (e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? -1 : 1, 0); }
                            else if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); gridRef.current?.focus(); }
                          }}
                          onBlur={() => editing && commit(0, 0)}
                          className="absolute inset-0 w-full h-full px-1.5 font-mono text-xs outline-none bg-white border-2 border-emerald-600"
                        />
                      ) : (
                        <span className="block truncate">{displayValue(v)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 px-3 py-1 border-t bg-slate-50 text-xs text-slate-500">
        <span>Planilha1</span>
        <span>Valor: {displayValue(evalr.valueOf(sel))}</span>
        <span>{locked.has(sel) ? '🔒 protegida' : 'editável'}</span>
        <span className="ml-auto hidden md:inline">Enter editar • Setas navegar • Delete limpar • Ctrl+Z desfazer</span>
      </div>

      {dialog === 'saveas' && (
        <SaveDialog
          defaultName={file?.name ?? 'planilha.xlsx'}
          defaultFolder={file?.parentId ?? ESCOLA_ID}
          ext={['.xlsx']}
          onSave={(folder, n, replaceId) => {
            const c = { ...content, cells };
            let id = replaceId;
            if (replaceId) os.saveFile(replaceId, c);
            else id = os.createFile(folder, n, 'sheet', c);
            setFileId(id!);
            setSaved(JSON.stringify(cells));
            setDialog(null);
            flash(`Salvo como ${n}`);
          }}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'print' && <PrintDialog docName={name} text={printText()} onClose={() => setDialog(null)} />}
      {dialog === 'close' && (
        <Modal title="Planilhas" onClose={() => setDialog(null)}>
          <p>Deseja salvar as alterações em <b>{name}</b>?</p>
          <div className="flex justify-end gap-2 mt-5">
            <Btn primary onClick={() => { setDialog(null); save(true); }}>Salvar</Btn>
            <Btn onClick={() => os.closeWindow(win.id, true)}>Não salvar</Btn>
            <Btn onClick={() => setDialog(null)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
