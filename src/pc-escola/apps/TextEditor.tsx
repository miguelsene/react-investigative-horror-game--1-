import { useEffect, useRef, useState } from 'react';
import { useOS, closeGuards, pathOf } from '../os/store';

const ROOT_FOLDER = 'root';
import type { WindowState } from '../os/types';
import { Ico } from '../components/Icons';
import { Btn, Modal, PrintDialog, SaveDialog } from '../components/Dialogs';
import { TASK_FILE, typeFromName } from '../os/utils';
import { copyText, readCopiedText } from '../os/clipboard';

type Snap = { text: string; s: number; e: number };

export default function TextEditor({ win }: { win: WindowState }) {
  const os = useOS();
  const [fileId, setFileId] = useState<string | null>(win.props.fileId ?? null);
  const file = os.files.find((f) => f.id === fileId) ?? null;
  const initial = typeof file?.content === 'string' ? file.content : '';
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [hist, setHist] = useState<{ stack: Snap[]; i: number }>({ stack: [{ text: initial, s: 0, e: 0 }], i: 0 });
  const lastPush = useRef(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const [find, setFind] = useState<{ open: boolean; q: string; r: string; cs: boolean }>({ open: false, q: '', r: '', cs: false });
  const findRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<null | 'saveas' | 'print' | 'close'>(null);
  const [closeAfterSave, setCloseAfterSave] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [wrap, setWrap] = useState(true);
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const [msg, setMsg] = useState('');
  const isDoc = file?.type === 'doc';
  const name = file?.name ?? 'Sem título.txt';
  const dirty = text !== saved;

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    closeGuards.set(win.id, () => {
      if (dirtyRef.current) {
        setDialog('close');
        return false;
      }
      return true;
    });
    return () => {
      closeGuards.delete(win.id);
    };
  }, [win.id]);

  useEffect(() => {
    os.updateWindow(win.id, { title: `${dirty ? '● ' : ''}${name} — Editor de Texto`, props: { ...win.props, fileId } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, dirty, fileId]);

  useEffect(() => {
    if ((!win.props.fileId || name.toLowerCase() === TASK_FILE) && text.trim().length >= 40 && /[.!?]/.test(text)) os.setWroteParagraph(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const pushHistory = (snap: Snap, merge: boolean) => {
    setHist((h) => {
      const base = h.stack.slice(0, h.i + 1);
      if (merge && base.length > 1) base[base.length - 1] = snap;
      else base.push(snap);
      const stack = base.slice(-200);
      return { stack, i: stack.length - 1 };
    });
  };

  const change = (v: string, s = 0, e = 0, forceNew = false) => {
    const now = Date.now();
    const merge = !forceNew && now - lastPush.current < 700;
    lastPush.current = now;
    setText(v);
    pushHistory({ text: v, s, e }, merge);
  };

  const restore = (snap: Snap) => {
    setText(snap.text);
    requestAnimationFrame(() => {
      ta.current?.focus();
      ta.current?.setSelectionRange(snap.s, snap.e);
    });
  };
  const undo = () => {
    if (hist.i === 0) return;
    lastPush.current = 0;
    const i = hist.i - 1;
    setHist({ ...hist, i });
    restore(hist.stack[i]);
  };
  const redo = () => {
    if (hist.i >= hist.stack.length - 1) return;
    const i = hist.i + 1;
    setHist({ ...hist, i });
    restore(hist.stack[i]);
  };

  const selection = () => {
    const el = ta.current!;
    return { s: el.selectionStart, e: el.selectionEnd, t: text.slice(el.selectionStart, el.selectionEnd) };
  };
  const insert = (str: string, range = selection()) => {
    const { s, e } = range;
    const v = text.slice(0, s) + str + text.slice(e);
    change(v, s + str.length, s + str.length, true);
    requestAnimationFrame(() => {
      ta.current?.focus();
      ta.current?.setSelectionRange(s + str.length, s + str.length);
    });
  };
  const copy = async (cut = false) => {
    const range = selection();
    const { t } = range;
    if (!t) return flash('Nada selecionado.');
    await copyText(t);
    if (cut && !file?.readOnly) insert('', range);
    flash(cut ? 'Recortado.' : 'Copiado.');
  };
  const paste = async () => {
    const range = selection();
    const t = await readCopiedText();
    if (t) insert(t, range);
    else flash('Área de transferência vazia.');
  };

  const save = (thenClose = false) => {
    if (file && !file.readOnly) {
      os.saveFile(file.id, text);
      setSaved(text);
      flash(`Salvo em ${pathOf(os.files, file.parentId)}`);
      if (thenClose) os.closeWindow(win.id, true);
      return;
    }
    if (file?.readOnly) flash('Arquivo somente leitura. Escolha um novo nome.');
    setCloseAfterSave(thenClose);
    setDialog('saveas');
  };

  const doSaveAs = (folderId: string, fname: string, replaceId?: string) => {
    let id = replaceId;
    if (replaceId) os.saveFile(replaceId, text);
    else id = os.createFile(folderId, fname, typeFromName(fname) === 'doc' ? 'doc' : 'txt', text);
    setFileId(id!);
    setSaved(text);
    setDialog(null);
    flash(`Salvo como ${fname}`);
    if (closeAfterSave) setTimeout(() => os.closeWindow(win.id, true), 50);
  };

  const findNext = (dir: 1 | -1 = 1) => {
    if (!find.q) return;
    const hay = find.cs ? text : text.toLowerCase();
    const needle = find.cs ? find.q : find.q.toLowerCase();
    const el = ta.current!;
    let idx: number;
    if (dir === 1) {
      idx = hay.indexOf(needle, el.selectionEnd);
      if (idx < 0) idx = hay.indexOf(needle);
    } else {
      idx = hay.lastIndexOf(needle, Math.max(0, el.selectionStart - 1));
      if (idx < 0) idx = hay.lastIndexOf(needle);
    }
    if (idx < 0) return flash(`"${find.q}" não encontrado.`);
    el.focus();
    el.setSelectionRange(idx, idx + find.q.length);
    const line = text.slice(0, idx).split('\n').length;
    el.scrollTop = Math.max(0, (line - 5) * 20 * (zoom / 100));
    requestAnimationFrame(() => findRef.current?.focus());
  };
  const matchCount = find.q ? (find.cs ? text : text.toLowerCase()).split(find.cs ? find.q : find.q.toLowerCase()).length - 1 : 0;
  const replaceOne = () => {
    const { s, e, t } = selection();
    if (t && (find.cs ? t === find.q : t.toLowerCase() === find.q.toLowerCase())) {
      const v = text.slice(0, s) + find.r + text.slice(e);
      change(v, s, s + find.r.length, true);
    }
    setTimeout(() => findNext(1), 0);
  };
  const replaceAll = () => {
    if (!find.q) return;
    const re = new RegExp(find.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), find.cs ? 'g' : 'gi');
    const v = text.replace(re, find.r);
    change(v, 0, 0, true);
    flash(`${matchCount} substituição(ões).`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((ctrl && k === 'y') || (ctrl && e.shiftKey && k === 'z')) { e.preventDefault(); redo(); }
    else if (ctrl && k === 'f') { e.preventDefault(); setFind({ ...find, open: true, q: selection().t || find.q }); setTimeout(() => findRef.current?.select(), 0); }
    else if (ctrl && e.shiftKey && k === 's') { e.preventDefault(); setDialog('saveas'); }
    else if (ctrl && k === 's') { e.preventDefault(); save(); }
    else if (ctrl && k === 'p') { e.preventDefault(); setDialog('print'); }
    else if (e.key === 'Escape' && find.open) { setFind({ ...find, open: false }); ta.current?.focus(); }
    else if (e.key === 'Tab' && e.target === ta.current) { e.preventDefault(); insert('\t'); }
  };

  const updateCursor = () => {
    const el = ta.current;
    if (!el) return;
    const before = text.slice(0, el.selectionStart).split('\n');
    setCursor({ ln: before.length, col: before[before.length - 1].length + 1 });
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const TB = ({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) => (
    <button title={label} onClick={onClick} disabled={disabled} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30">
      <Ico name={icon} size={16} />
    </button>
  );

  return (
    <div className="flex flex-col h-full" onKeyDown={onKey}>
      <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-slate-50 flex-wrap">
        <TB icon="filePlus" label="Novo" onClick={() => os.openApp('editor', {})} />
        <TB icon="folder" label="Abrir (Meus Documentos)" onClick={() => os.openApp('explorer', { folderId: file?.parentId ?? 'root' })} />
        <TB icon="save" label="Salvar (Ctrl+S)" onClick={() => save()} />
        <button onClick={() => setDialog('saveas')} className="text-xs px-2 py-1 rounded hover:bg-slate-200" title="Ctrl+Shift+S">Salvar como…</button>
        <TB icon="print" label="Imprimir (Ctrl+P)" onClick={() => setDialog('print')} />
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <TB icon="undo" label="Desfazer (Ctrl+Z)" onClick={undo} disabled={hist.i === 0} />
        <TB icon="redo" label="Refazer (Ctrl+Y)" onClick={redo} disabled={hist.i >= hist.stack.length - 1} />
        <TB icon="cut" label="Recortar (Ctrl+X)" onClick={() => copy(true)} disabled={file?.readOnly} />
        <TB icon="copy" label="Copiar (Ctrl+C)" onClick={() => copy()} />
        <TB icon="paste" label="Colar (Ctrl+V)" onClick={paste} disabled={file?.readOnly} />
        <button onClick={() => { ta.current?.focus(); ta.current?.select(); }} className="text-xs px-2 py-1 rounded hover:bg-slate-200" title="Ctrl+A">Selecionar tudo</button>
        <TB icon="search" label="Localizar (Ctrl+F)" onClick={() => { setFind({ ...find, open: !find.open }); setTimeout(() => findRef.current?.focus(), 0); }} />
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button onClick={() => setZoom(Math.max(70, zoom - 10))} className="text-xs px-1.5 py-1 rounded hover:bg-slate-200">A−</button>
        <span className="text-xs w-9 text-center text-slate-500">{zoom}%</span>
        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="text-xs px-1.5 py-1 rounded hover:bg-slate-200">A+</button>
        {!isDoc && (
          <label className="text-xs flex items-center gap-1 ml-2 text-slate-600">
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> Quebra de linha
          </label>
        )}
        {file?.readOnly && <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1"><Ico name="lock" size={11} /> Somente leitura</span>}
      </div>

      {find.open && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-amber-50 text-xs flex-wrap">
          <input ref={findRef} value={find.q} onChange={(e) => setFind({ ...find, q: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); findNext(e.shiftKey ? -1 : 1); } if (e.key === 'Escape') { setFind({ ...find, open: false }); ta.current?.focus(); } }} placeholder="Localizar" className="border rounded px-2 py-1 w-40" />
          <span className="text-slate-500 w-20">{find.q ? `${matchCount} resultado(s)` : ''}</span>
          <button onClick={() => findNext(-1)} className="px-2 py-1 rounded border bg-white hover:bg-slate-50">Anterior</button>
          <button onClick={() => findNext(1)} className="px-2 py-1 rounded border bg-white hover:bg-slate-50">Próximo</button>
          <label className="flex items-center gap-1"><input type="checkbox" checked={find.cs} onChange={(e) => setFind({ ...find, cs: e.target.checked })} /> Maiúsc./minúsc.</label>
          {!file?.readOnly && (
            <>
              <input value={find.r} onChange={(e) => setFind({ ...find, r: e.target.value })} placeholder="Substituir por" className="border rounded px-2 py-1 w-32" />
              <button onClick={replaceOne} className="px-2 py-1 rounded border bg-white hover:bg-slate-50">Substituir</button>
              <button onClick={replaceAll} className="px-2 py-1 rounded border bg-white hover:bg-slate-50">Substituir tudo</button>
            </>
          )}
          <button onClick={() => setFind({ ...find, open: false })} className="ml-auto p-1 hover:bg-amber-100 rounded"><Ico name="x" size={13} /></button>
        </div>
      )}

      <div className={`flex-1 min-h-0 overflow-auto ${isDoc ? 'bg-slate-200 py-6 px-3' : 'bg-white'}`}>
        <textarea
          ref={ta}
          value={text}
          readOnly={file?.readOnly}
          spellCheck={false}
          onChange={(e) => change(e.target.value, e.target.selectionStart, e.target.selectionEnd)}
          onSelect={updateCursor}
          onKeyUp={updateCursor}
          onClick={updateCursor}
          placeholder={file ? '' : 'Comece a escrever...'}
          style={{ fontSize: `${(isDoc ? 14 : 14) * (zoom / 100)}px`, whiteSpace: wrap || isDoc ? 'pre-wrap' : 'pre' }}
          className={`os-readable block resize-none outline-none leading-relaxed text-slate-800 ${
            isDoc ? 'mx-auto w-full max-w-[720px] min-h-[960px] bg-white shadow-md px-14 py-14 font-serif' : 'w-full h-full p-4 font-mono'
          }`}
          autoFocus
        />
      </div>

      <div className="flex items-center gap-4 px-3 py-1 border-t bg-slate-50 text-xs text-slate-500">
        <span>Ln {cursor.ln}, Col {cursor.col}</span>
        <span>{text.length} caracteres</span>
        <span>{words} palavras</span>
        <span className="hidden md:inline truncate">{file ? pathOf(os.files, file.id) : 'Não salvo'}</span>
        <span className="ml-auto text-blue-700">{msg}</span>
        <span>UTF-8</span>
      </div>

      {dialog === 'saveas' && (
        <SaveDialog
          defaultName={file && !file.readOnly ? file.name : file?.readOnly ? `Cópia de ${file.name}` : 'documento.txt'}
          defaultFolder={file && !file.readOnly && file.parentId ? file.parentId : ROOT_FOLDER}
          ext={isDoc ? ['.docx', '.txt'] : ['.txt', '.docx']}
          onSave={doSaveAs}
          onCancel={() => { setDialog(null); setCloseAfterSave(false); }}
        />
      )}
      {dialog === 'print' && <PrintDialog docName={name} text={text} onClose={() => setDialog(null)} />}
      {dialog === 'close' && (
        <Modal title="Editor de Texto" onClose={() => setDialog(null)}>
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
