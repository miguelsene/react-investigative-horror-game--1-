import { useState } from 'react';
import { useOS, childrenOf, ROOT_ID } from '../os/store';
import { FileIcon, Ico } from './Icons';

export function FolderTree({
  selected,
  onSelect,
  onDropItems,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onDropItems?: (ids: string[], folderId: string) => void;
}) {
  const files = useOS((s) => s.files);
  const [open, setOpen] = useState<Record<string, boolean>>({ [ROOT_ID]: true });
  const [over, setOver] = useState<string | null>(null);

  const render = (id: string, depth: number) => {
    const f = files.find((x) => x.id === id);
    if (!f || f.deleted) return null;
    const kids = childrenOf(files, id).filter((c) => c.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
    const isOpen = open[id] ?? false;
    return (
      <div key={id}>
        <div
          onClick={() => onSelect(id)}
          onDragOver={(e) => {
            if (!onDropItems) return;
            e.preventDefault();
            setOver(id);
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            const ids = e.dataTransfer.getData('text/higashi-files');
            if (ids && onDropItems) onDropItems(ids.split(','), id);
          }}
          className={`flex items-center gap-1 py-[3px] pr-2 rounded cursor-default text-[13px] ${
            selected === id ? 'bg-blue-100 text-blue-900' : 'hover:bg-slate-100'
          } ${over === id ? 'ring-2 ring-blue-400' : ''}`}
          style={{ paddingLeft: 4 + depth * 14 }}
        >
          <button
            className={`w-4 h-4 flex items-center justify-center text-slate-500 ${kids.length ? '' : 'invisible'}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen({ ...open, [id]: !isOpen });
            }}
          >
            <Ico name="forward" size={11} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
          <FileIcon type="folder" size={16} />
          <span className="truncate">{f.name}</span>
        </div>
        {isOpen && kids.map((k) => render(k.id, depth + 1))}
      </div>
    );
  };

  return <div className="select-none">{render(ROOT_ID, 0)}</div>;
}
