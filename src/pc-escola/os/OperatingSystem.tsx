import { useEffect, useState, type ComponentType } from 'react';
import { useOS, closeGuards, getTaskStatus } from './store';
import type { AppId, WindowState } from './types';
import { Window } from '../components/Window';
import { DesktopIcons, Notifications, StartMenu, TaskWidget, Taskbar } from '../components/Shell';
import FileExplorer from '../apps/FileExplorer';
import TextEditor from '../apps/TextEditor';
import Spreadsheet from '../apps/Spreadsheet';
import PresentationViewer from '../apps/PresentationViewer';
import Browser from '../apps/Browser';
import Mail from '../apps/Mail';
import Portal from '../apps/Portal';
import Gallery from '../apps/Gallery';
import Trash from '../apps/Trash';
import Settings from '../apps/Settings';
import Search from '../apps/Search';
import Tasks from '../apps/Tasks';
import Chat from '../apps/Chat';
import { playSound } from './sound';
import { trackNativeCopies } from './clipboard';

const REGISTRY: Record<AppId, ComponentType<{ win: WindowState }>> = {
  explorer: FileExplorer,
  editor: TextEditor,
  sheet: Spreadsheet,
  presentation: PresentationViewer,
  browser: Browser,
  mail: Mail as ComponentType<{ win: WindowState }>,
  portal: Portal as ComponentType<{ win: WindowState }>,
  gallery: Gallery,
  trash: Trash as ComponentType<{ win: WindowState }>,
  settings: Settings as ComponentType<{ win: WindowState }>,
  search: Search,
  tasks: Tasks as ComponentType<{ win: WindowState }>,
  chat: Chat as ComponentType<{ win: WindowState }>,
};

export default function OperatingSystem() {
  const windows = useOS((s) => s.windows);
  const files = useOS((s) => s.files);
  const startOpen = useOS((s) => s.startOpen);
  const wallpaper = useOS((s) => s.settings.wallpaper);
  const [exiting, setExiting] = useState<null | 'exit' | 'restart'>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => trackNativeCopies(), []);

  useEffect(() => {
    const s = useOS.getState();
    if (getTaskStatus(s).completed && !s.chats.find((c) => c.contactId === 'oculto')?.unlocked) {
      s.startStrangerContact();
    }
  }, []);

  useEffect(() => {
    useOS.getState().checkTask();
  }, [files, windows]);

  const blocked = () => {
    const s = useOS.getState();
    for (const w of s.windows) {
      const g = closeGuards.get(w.id);
      if (g && !g()) {
        s.focusWindow(w.id);
        s.notify('Alterações não salvas', `Salve ou descarte as alterações em "${w.title.replace('● ', '').replace(/ — .*$/, '')}" antes de sair.`);
        return true;
      }
    }
    return false;
  };

  const exit = () => {
    const s = useOS.getState();
    s.setStartOpen(false);
    if (blocked()) return;
    setExiting('exit');
    playSound('close', s.settings);
    setTimeout(() => useOS.getState().exitComputer(), 1600);
  };
  const restart = () => {
    const s = useOS.getState();
    s.setStartOpen(false);
    if (blocked()) return;
    setExiting('restart');
    setTimeout(() => {
      closeGuards.clear();
      useOS.setState({ windows: [], activeId: null });
      useOS.getState().setPhase('boot');
    }, 1400);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useOS.getState();
      if (e.altKey && (e.key === 'F4' || e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        if (s.activeId) s.closeWindow(s.activeId);
        else exit();
      }
      if (e.ctrlKey && e.key === 'Escape') {
        e.preventDefault();
        s.setStartOpen(!s.startOpen);
      }
      if (e.key === 'Escape' && s.startOpen) s.setStartOpen(false);
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bg = wallpaper.startsWith('solid:') ? { background: wallpaper.slice(6) } : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  return (
    <div
      className="aero-desktop absolute inset-0 overflow-hidden select-none"
      style={bg}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).dataset.desktop) {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }
      }}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('[data-ctx]')) setMenu(null); }}
    >
      <div data-desktop="1" className="absolute inset-0" />
      <DesktopIcons />
      <TaskWidget />
      {windows.map((w) => {
        const App = REGISTRY[w.app];
        return (
          <Window key={w.id} win={w}>
            <App win={w} />
          </Window>
        );
      })}
      {menu && (
        <div data-ctx className="aero-context-menu absolute rounded-[3px] py-1 w-52 text-[13px]" style={{ left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 220), zIndex: 99997 }}>
          {[
            ['Abrir Meus Documentos', () => useOS.getState().openApp('explorer')],
            ['Novo documento de texto', () => useOS.getState().openApp('editor', {})],
            ['Nova planilha', () => useOS.getState().openApp('sheet', {})],
            ['Pesquisar…', () => useOS.getState().openApp('search')],
            ['Atividade da aula', () => useOS.getState().openApp('tasks')],
            ['Personalizar (Configurações)', () => useOS.getState().openApp('settings')],
            ['Atualizar', () => useOS.getState().notify('Área de trabalho atualizada')],
          ].map(([l, fn]) => (
            <button key={l as string} onClick={() => { (fn as () => void)(); setMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-sky-100/70">{l as string}</button>
          ))}
        </div>
      )}
      {startOpen && <StartMenu onExit={exit} onRestart={restart} />}
      <Taskbar />
      <Notifications />
      {exiting && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white gap-4" style={{ zIndex: 200000 }}>
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-sm tracking-wide">{exiting === 'exit' ? 'Salvando estado do computador...' : 'Reiniciando...'}</div>
          <div className="text-[11px] text-white/40">Arquivos, downloads, histórico, e-mails, configurações e progresso preservados</div>
        </div>
      )}
    </div>
  );
}
