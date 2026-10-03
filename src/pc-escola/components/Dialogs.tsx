import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useOS, pathOf, childrenOf } from '../os/store';
import { FolderTree } from './FolderTree';
import { Ico } from './Icons';

export function Modal({ title, children, onClose, width = 420 }: { title: string; children: ReactNode; onClose: () => void; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>('input, textarea, select, button.primary');
    first?.focus();
  }, []);
  return (
    <div
      className="absolute inset-0 z-50 bg-slate-900/35 flex items-center justify-center p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div ref={ref} className="bg-white rounded-lg shadow-2xl ring-1 ring-black/10 max-h-full flex flex-col overflow-hidden" style={{ width, maxWidth: '100%' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50">
          <span className="font-semibold text-sm">{title}</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200" title="Fechar (Esc)">
            <Ico name="x" size={14} />
          </button>
        </div>
        <div className="p-4 overflow-auto text-sm">{children}</div>
      </div>
    </div>
  );
}

export function Btn({ children, primary, danger, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; danger?: boolean }) {
  return (
    <button
      {...rest}
      className={`px-3.5 py-1.5 rounded text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        primary ? 'primary bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : danger ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-white border-slate-300 hover:bg-slate-100'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Confirm({ title, message, confirmLabel = 'OK', danger, onConfirm, onCancel, extra }: { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; extra?: ReactNode }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex gap-3 items-start">
        <div className={`mt-0.5 ${danger ? 'text-red-600' : 'text-blue-600'}`}>
          <Ico name="info" size={28} />
        </div>
        <div className="flex-1 leading-relaxed">{message}</div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        {extra}
        <Btn onClick={onCancel}>Cancelar</Btn>
        <Btn primary={!danger} danger={danger} className="primary" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Btn>
      </div>
    </Modal>
  );
}

export function SaveDialog({
  title = 'Salvar como',
  defaultName,
  defaultFolder,
  ext,
  onSave,
  onCancel,
}: {
  title?: string;
  defaultName: string;
  defaultFolder: string;
  ext: string[];
  onSave: (folderId: string, name: string, replaceId?: string) => void;
  onCancel: () => void;
}) {
  const files = useOS((s) => s.files);
  const createFolder = useOS((s) => s.createFolder);
  const [folder, setFolder] = useState(defaultFolder);
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');
  const [confirmReplace, setConfirmReplace] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      const dot = defaultName.lastIndexOf('.');
      el.setSelectionRange(0, dot > 0 ? dot : defaultName.length);
    }
  }, [defaultName]);

  const contents = useMemo(() => childrenOf(files, folder).sort((a, b) => (a.type === 'folder' ? -1 : 1) - (b.type === 'folder' ? -1 : 1) || a.name.localeCompare(b.name)), [files, folder]);

  const submit = () => {
    let n = name.trim();
    if (!n) return setError('Digite um nome para o arquivo.');
    if (/[\\/:*?"<>|]/.test(n)) return setError('O nome não pode conter: \\ / : * ? " < > |');
    if (!ext.some((e) => n.toLowerCase().endsWith(e))) n = n + ext[0];
    const existing = files.find((f) => f.parentId === folder && !f.deleted && f.name.toLowerCase() === n.toLowerCase());
    if (existing) {
      if (existing.type === 'folder' || existing.readOnly) return setError('Já existe uma pasta ou arquivo protegido com esse nome.');
      setName(n);
      setConfirmReplace(existing.id);
      return;
    }
    onSave(folder, n);
  };

  return (
    <Modal title={title} onClose={onCancel} width={620}>
      {confirmReplace ? (
        <div>
          <p>
            <b>{name}</b> já existe em <b>{pathOf(files, folder)}</b>. Deseja substituí-lo?
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setConfirmReplace(null)}>Não</Btn>
            <Btn primary onClick={() => onSave(folder, name.trim(), confirmReplace)}>
              Substituir
            </Btn>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Ico name="folder" size={13} /> {pathOf(files, folder)}
          </div>
          <div className="flex gap-3 h-56">
            <div className="w-52 border rounded overflow-auto p-1 bg-slate-50">
              <FolderTree selected={folder} onSelect={setFolder} />
            </div>
            <div className="flex-1 border rounded overflow-auto p-1">
              {contents.length === 0 && <div className="text-slate-400 text-xs p-2">Pasta vazia</div>}
              {contents.map((c) => (
                <div
                  key={c.id}
                  onClick={() => (c.type === 'folder' ? null : setName(c.name))}
                  onDoubleClick={() => c.type === 'folder' && setFolder(c.id)}
                  className={`px-2 py-1 text-[13px] rounded hover:bg-slate-100 truncate ${c.type === 'folder' ? 'font-medium' : 'text-slate-600'}`}
                >
                  {c.type === 'folder' ? '📁 ' : '📄 '}
                  {c.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-12 text-slate-600">Nome:</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="flex-1 border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-12">Tipo:</span> {ext.join(', ')}
          </div>
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <div className="flex justify-between gap-2 mt-1">
            <Btn onClick={() => setFolder(createFolder(folder))}>
              <span className="flex items-center gap-1">
                <Ico name="folderPlus" size={14} /> Nova pasta
              </span>
            </Btn>
            <div className="flex gap-2">
              <Btn onClick={onCancel}>Cancelar</Btn>
              <Btn primary onClick={submit}>
                Salvar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function paginate(text: string, perPage = 34, width = 72) {
  const lines: string[] = [];
  text.split('\n').forEach((l) => {
    if (l.length <= width) lines.push(l);
    else {
      let rest = l;
      while (rest.length > width) {
        let cut = rest.lastIndexOf(' ', width);
        if (cut < 20) cut = width;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut).trimStart();
      }
      lines.push(rest);
    }
  });
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  return pages.length ? pages : [['']];
}

export function PrintDialog({ docName, text, onClose }: { docName: string; text: string; onClose: () => void }) {
  const { addPrintJob, notify } = useOS.getState();
  const pages = useMemo(() => paginate(text), [text]);
  const [printer, setPrinter] = useState('LAB-PRINTER-01');
  const [mode, setMode] = useState<'all' | 'range'>('all');
  const [range, setRange] = useState(`1-${pages.length}`);
  const [copies, setCopies] = useState(1);
  const [preview, setPreview] = useState(0);
  const [status, setStatus] = useState<'idle' | 'printing'>('idle');
  const [error, setError] = useState('');

  const doPrint = () => {
    if (printer === 'LAB-PRINTER-02') return setError('LAB-PRINTER-02 está offline (sem papel). Escolha LAB-PRINTER-01.');
    let label = `1-${pages.length}`;
    if (mode === 'range') {
      const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(range);
      if (!m) return setError('Intervalo inválido. Use, por exemplo, 1-3.');
      const a = +m[1], b = +(m[2] ?? m[1]);
      if (a < 1 || b > pages.length || a > b) return setError(`O documento tem ${pages.length} página(s).`);
      label = a === b ? `${a}` : `${a}-${b}`;
    }
    if (copies < 1 || copies > 20) return setError('Número de cópias entre 1 e 20.');
    setStatus('printing');
    setTimeout(() => {
      addPrintJob({ document: docName, pages: label, copies });
      notify('Enviado para impressão', `${docName} — páginas ${label}, ${copies} cópia(s) em ${printer}.`);
      onClose();
    }, 1400);
  };

  return (
    <Modal title="Imprimir" onClose={onClose} width={640}>
      {status === 'printing' ? (
        <div className="py-10 text-center">
          <div className="mx-auto w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4">Enviando "{docName}" para {printer}...</p>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">IMPRESSORA</span>
              <select value={printer} onChange={(e) => setPrinter(e.target.value)} className="border rounded px-2 py-1.5">
                <option>LAB-PRINTER-01</option>
                <option value="LAB-PRINTER-02">LAB-PRINTER-02 (offline)</option>
              </select>
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">PÁGINAS</span>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} /> Todas ({pages.length})
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'range'} onChange={() => setMode('range')} /> Intervalo:
                <input value={range} onFocus={() => setMode('range')} onChange={(e) => setRange(e.target.value)} className="border rounded px-2 py-1 w-24" />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">CÓPIAS</span>
              <input type="number" min={1} max={20} value={copies} onChange={(e) => setCopies(+e.target.value)} className="border rounded px-2 py-1.5 w-24" />
            </label>
            {error && <div className="text-red-600 text-xs">{error}</div>}
            <div className="flex gap-2 mt-auto">
              <Btn onClick={onClose}>Cancelar</Btn>
              <Btn primary onClick={doPrint}>
                Imprimir
              </Btn>
            </div>
          </div>
          <div className="w-60 flex flex-col items-center gap-2">
            <div className="w-full aspect-[1/1.41] bg-white shadow-md ring-1 ring-slate-300 p-3 overflow-hidden">
              <pre className="text-[5.5px] leading-[7px] font-mono whitespace-pre-wrap text-slate-700">{pages[preview].join('\n')}</pre>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button disabled={preview === 0} onClick={() => setPreview(preview - 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                <Ico name="back" size={14} />
              </button>
              Página {preview + 1} de {pages.length}
              <button disabled={preview >= pages.length - 1} onClick={() => setPreview(preview + 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                <Ico name="forward" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
