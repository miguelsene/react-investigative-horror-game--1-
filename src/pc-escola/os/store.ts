import { create, persist } from './zustandCompat';
import { initialFiles, ROOT_ID, ESCOLA_ID, DOWNLOADS_ID } from '../data/filesystem';
import { initialEmails } from '../data/emails';
import type {
  AppId, DownloadEntry, Email, Favorite, FileContent, FileType, HistoryEntry, Notice,
  PageDownload, PrintJob, Settings, TaskFlags, VFile, WindowState,
  ChatThread, ChatMessage, Lore,
} from './types';
import { DEFAULT_EXAM } from './types';
import { EXAM_FINAL_MSG, EXAM_INTRO, EXAM_PASS_FILE_CONTENT, EXAM_PASS_FILE_NAME, EXAM_PASS_INTRO, EXAM_QUESTIONS, examCheck, examQuestionText, examRemark, examResult } from '../data/exam';
import { replyEmi, replyMori, replyStranger } from './chatBrain';
import { sceneISO, uid, clockElapsed, setClock, isYamantakaQuery, normalize } from './utils';
import { playSound } from './sound';

export type Phase = 'game' | 'boot' | 'login' | 'desktop' | 'exiting';

export const closeGuards = new Map<string, () => boolean>();

const DEFAULT_SETTINGS: Settings = {
  volume: 60,
  muted: false,
  brightness: 100,
  fontSize: 'medium',
  wallpaper: '/pc-escola/images/win7_wallpaper.jpg',
  language: 'pt',
  cursorSpeed: 5,
  highContrast: false,
  reduceMotion: false,
  largeCursor: false,
  keyboard: 'PT',
};

const DEFAULT_TASK: TaskFlags = {
  quizOpened: false,
  quizCompleted: false,
  quizScore: 0,
  completedNotified: false,
};

const APP_SIZE: Record<AppId, [number, number]> = {
  explorer: [860, 540],
  browser: [960, 620],
  mail: [940, 580],
  portal: [960, 620],
  editor: [820, 600],
  sheet: [920, 580],
  presentation: [880, 600],
  gallery: [900, 600],
  trash: [760, 480],
  settings: [780, 560],
  search: [720, 540],
  tasks: [440, 520],
  chat: [620, 500],
};

const APP_TITLE: Record<AppId, string> = {
  explorer: 'Meus Documentos',
  browser: 'Navegador',
  mail: 'Correio Escolar',
  portal: 'Portal da Escola',
  editor: 'Editor de Texto',
  sheet: 'Planilhas',
  presentation: 'Apresentações',
  gallery: 'Galeria',
  trash: 'Lixeira',
  settings: 'Configurações',
  search: 'Pesquisa',
  tasks: 'Atividade da Aula',
  chat: 'Mensageiro Escolar',
};

const SINGLETON: AppId[] = ['mail', 'portal', 'trash', 'settings', 'search', 'tasks', 'gallery', 'chat'];

// ---------- helpers ----------
export function isAlive(files: VFile[], id: string | null): boolean {
  let cur = files.find((f) => f.id === id);
  let guard = 0;
  while (cur && guard++ < 50) {
    if (cur.deleted) return false;
    if (cur.parentId === null) return true;
    const pid: string = cur.parentId;
    cur = files.find((f) => f.id === pid);
  }
  return false;
}

export function childrenOf(files: VFile[], parentId: string) {
  return files.filter((f) => f.parentId === parentId && !f.deleted);
}

export function pathOf(files: VFile[], id: string | null): string {
  const parts: string[] = [];
  let cur = files.find((f) => f.id === id);
  let guard = 0;
  while (cur && guard++ < 50) {
    parts.unshift(cur.name);
    const pid = cur.parentId;
    cur = pid ? files.find((f) => f.id === pid) : undefined;
  }
  return parts.join('/');
}

function isDescendant(files: VFile[], id: string, ancestorId: string) {
  let cur = files.find((f) => f.id === id);
  let guard = 0;
  while (cur && guard++ < 50) {
    if (cur.id === ancestorId) return true;
    const pid = cur.parentId;
    cur = pid ? files.find((f) => f.id === pid) : undefined;
  }
  return false;
}

export function uniqueName(files: VFile[], parentId: string, name: string, ignoreId?: string) {
  const siblings = files.filter((f) => f.parentId === parentId && !f.deleted && f.id !== ignoreId).map((f) => f.name.toLowerCase());
  if (!siblings.includes(name.toLowerCase())) return name;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let i = 2;
  while (siblings.includes(`${base} (${i})${ext}`.toLowerCase())) i++;
  return `${base} (${i})${ext}`;
}

function descendants(files: VFile[], id: string): string[] {
  const out: string[] = [];
  const walk = (pid: string) => {
    files.filter((f) => f.parentId === pid).forEach((c) => {
      out.push(c.id);
      walk(c.id);
    });
  };
  walk(id);
  return out;
}

export function getTaskStatus(s: Pick<OSState, 'files' | 'windows' | 'task' | 'wroteParagraph'>) {
  const steps = [
    { label: 'Abra o aplicativo de atividade', done: s.task.quizOpened },
    { label: 'Responda o Questionário de Informática', done: s.task.quizCompleted },
    { label: 'Acerte pelo menos 4 questões (nota 8.0+)', done: s.task.quizCompleted && s.task.quizScore >= 4 },
  ];
  const hints: string[] = [];
  if (s.task.quizCompleted && s.task.quizScore < 4) hints.push(`Você acertou ${s.task.quizScore} de 5 questões. Refaça a atividade para obter a nota mínima de aprovação.`);
  return { steps, hints, completed: steps.every((x) => x.done), doneCount: steps.filter((x) => x.done).length };
}

// ---------- state ----------
export interface OSState {
  phase: Phase;
  currentUser: string;
  files: VFile[];
  fileUndo: VFile[][];
  clipboard: { mode: 'copy' | 'cut'; ids: string[] } | null;
  downloads: DownloadEntry[];
  browserHistory: HistoryEntry[];
  favorites: Favorite[];
  lastVisitedPages: string[];
  emails: Email[];
  chats: ChatThread[];
  lore: Lore;
  settings: Settings;
  printLog: PrintJob[];
  windows: WindowState[];
  activeId: string | null;
  zTop: number;
  task: TaskFlags;
  wroteParagraph: boolean;
  notices: Notice[];
  sceneElapsed: number;
  startOpen: boolean;
  sessions: number;

  setPhase: (p: Phase) => void;
  enterComputer: () => void;
  exitComputer: () => void;
  resetComputer: () => void;
  setStartOpen: (v: boolean) => void;

  notify: (title: string, body?: string) => void;
  dismissNotice: (id: string) => void;

  openApp: (app: AppId, props?: Record<string, any>) => string;
  openFile: (id: string) => void;
  closeWindow: (id: string, force?: boolean) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  setWindowProps: (id: string, props: Record<string, any>) => void;

  snapshot: () => void;
  undoFiles: () => boolean;
  createFolder: (parentId: string, name?: string) => string;
  createFile: (parentId: string, name: string, type: FileType, content: FileContent) => string;
  saveFile: (id: string, content: FileContent) => void;
  renameFile: (id: string, name: string) => string | null;
  moveFiles: (ids: string[], parentId: string) => number;
  copyFiles: (ids: string[], parentId: string) => string[];
  trashFiles: (ids: string[]) => number;
  restoreFiles: (ids: string[]) => void;
  purgeFiles: (ids: string[]) => void;
  emptyTrash: () => void;
  setReadOnly: (id: string, v: boolean) => void;
  setClipboard: (c: OSState['clipboard']) => void;

  addHistory: (url: string, title: string) => void;
  clearHistory: () => void;
  toggleFavorite: (url: string, title: string) => void;
  download: (d: PageDownload, url: string) => string;
  removeDownload: (id: string) => void;

  updateEmail: (id: string, patch: Partial<Email>) => void;
  addEmail: (e: Email) => void;
  deleteEmail: (id: string) => void;

  updateChat: (contactId: string, patch: Partial<ChatThread>) => void;
  sendChatMessage: (contactId: string, text: string) => void;
  receiveChat: (contactId: string, text: string) => void;
  startExam: () => void;
  answerExam: (answer: string) => void;
  unlockChat: (contactId: string) => void;
  markLore: (patch: Partial<Lore>) => void;
  markSearch: (query: string) => void;
  markPageVisit: (url: string) => void;
  startStrangerContact: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  addPrintJob: (j: Omit<PrintJob, 'id' | 'date'>) => void;

  setTask: (patch: Partial<TaskFlags>) => void;
  setWroteParagraph: (v: boolean) => void;
  checkTask: () => void;
}

const initialData = () => ({
  currentUser: 'ALUNO_17',
  files: initialFiles.map((f) => ({ ...f })),
  fileUndo: [] as VFile[][],
  downloads: [] as DownloadEntry[],
  browserHistory: [] as HistoryEntry[],
  favorites: [
    { url: 'https://www.higashi-school.jp', title: 'Escola Higashi' },
    { url: 'https://enciclopedia-escolar.jp/restauracao-meiji', title: 'Enciclopédia Escolar' },
    { url: 'https://biblioteca.kawashiro.lg.jp', title: 'Biblioteca Municipal' },
  ] as Favorite[],
  lastVisitedPages: [] as string[],
  emails: initialEmails.map((e) => ({ ...e })),
  chats: [
    {
      contactId: 'emi',
      contactName: 'Emi Takahashi',
      contactStatus: 'online',
      messages: [
        { id: 'e1', sender: 'contact', text: 'Gabi!!', timestamp: '10:14' },
        { id: 'e2', sender: 'contact', text: 'Você tá livre depois da aula? Queria te mostrar o chocolate que comprei 😋', timestamp: '10:15' },
        { id: 'e3', sender: 'contact', text: 'ah, e não abre aqueles sites esquisitos que tem no blog da escola. o Mori falou pra turma inteira ontem.', timestamp: '10:16' },
      ],
      typing: false,
      unlocked: true,
      unread: 3,
      stage: 0,
    },
    {
      contactId: 'mori',
      contactName: 'Prof. Mori (Informática)',
      contactStatus: 'away',
      messages: [
        { id: 'p1', sender: 'contact', text: 'Bom dia. Façam a atividade pelo mensageiro ou pelo editor, o que preferir. O laboratório fecha às 15:30 para manutenção.', timestamp: '08:42' },
      ],
      typing: false,
      unlocked: true,
      unread: 1,
      stage: 0,
    },
    {
      contactId: 'oculto',
      contactName: 'Usuário Oculto',
      contactStatus: 'offline',
      messages: [],
      typing: false,
      unlocked: false,
      unread: 0,
      stage: 0,
    },
  ] as ChatThread[],
  lore: {
    yamantakaSearched: false,
    sawBlog: false,
    sawForum: false,
    sawArchive: false,
    readNotebook: false,
    visitedPages: [],
    exam: { ...DEFAULT_EXAM },
  } as Lore,
  settings: { ...DEFAULT_SETTINGS },
  printLog: [] as PrintJob[],
  windows: [] as WindowState[],
  activeId: null as string | null,
  zTop: 10,
  task: { ...DEFAULT_TASK },
  wroteParagraph: false,
  sceneElapsed: 0,
  sessions: 0,
});

export const useOS = create<OSState>()(
  persist<OSState>(
    (set, get) => ({
      ...initialData(),
      phase: 'game',
      clipboard: null,
      notices: [],
      startOpen: false,

      setPhase: (phase) => set({ phase }),
      enterComputer: () => {
        setClock(get().sceneElapsed);
        set({ phase: 'boot', sessions: get().sessions + 1 });
      },
      exitComputer: () => {
        closeGuards.clear();
        set({ phase: 'game', startOpen: false, sceneElapsed: clockElapsed() });
      },
      resetComputer: () => {
        closeGuards.clear();
        set({ ...initialData(), phase: 'game', notices: [], clipboard: null, startOpen: false });
      },
      setStartOpen: (startOpen) => set({ startOpen }),

      notify: (title, body) => {
        const id = uid();
        playSound('notify', get().settings);
        set({ notices: [...get().notices.slice(-3), { id, title, body }] });
        setTimeout(() => get().dismissNotice(id), 4500);
      },
      dismissNotice: (id) => set({ notices: get().notices.filter((n) => n.id !== id) }),

      openApp: (app, props = {}) => {
        const s = get();
        let existing: WindowState | undefined;
        if (SINGLETON.includes(app)) existing = s.windows.find((w) => w.app === app);
        if (props.fileId) existing = s.windows.find((w) => w.props.fileId === props.fileId && w.app === app);
        if (app === 'tasks') existing = s.windows.find((w) => w.app === 'tasks');
        if (existing) {
          set({
            windows: s.windows.map((w) => (w.id === existing!.id ? { ...w, minimized: false, z: s.zTop + 1, props: { ...w.props, ...props, nonce: uid() } } : w)),
            zTop: s.zTop + 1,
            activeId: existing.id,
            startOpen: false,
          });
          return existing.id;
        }
        const [w, h] = APP_SIZE[app];
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight - 44 : 720;
        const n = s.windows.length;
        const ww = Math.min(w, vw - 20);
        const hh = Math.min(h, vh - 20);
        const x = Math.max(10, Math.min(vw - ww - 10, 90 + (n * 30) % 240));
        const y = Math.max(8, Math.min(vh - hh - 8, 30 + (n * 26) % 160));
        const id = uid();
        const win: WindowState = {
          id, app, title: props.title ?? APP_TITLE[app], x, y, w: ww, h: hh,
          minimized: false, maximized: vw < 700, z: s.zTop + 1, props,
        };
        const task = { ...s.task };
        if (app === 'tasks') task.quizOpened = true;
        playSound('open', s.settings);
        set({ windows: [...s.windows, win], zTop: s.zTop + 1, activeId: id, startOpen: false, task });
        return id;
      },

      openFile: (id) => {
        const s = get();
        const f = s.files.find((x) => x.id === id);
        if (!f) return;
        if (f.id === 'sh3' || f.name === 'arquivo_ALUNO_17_2003.txt') {
          if (!s.lore.readNotebook) s.markLore({ readNotebook: true });
          const thread = s.chats.find((c) => c.contactId === 'oculto');
          if (thread?.unlocked && thread.stage < 5) {
            window.setTimeout(() => {
              get().receiveChat(
                'oculto',
                'Você leu.\n\nAgora você tem a parte verdadeira: um aluno de dezessete anos escreveu aquilo em 2003, transferiu-se em dezembro, e o arquivo dele nunca foi apagado porque ninguém nesta escola assume a responsabilidade de apagar.\n\nE tem a parte que eu não posso provar: se alguém escreveu aquele blog em 1998, como o site mesmo admite nas correções no rodapé, então o nome Yamāntaka circula nesta rede há vinte e um anos, e sempre houve alguém do outro lado respondendo.\n\nEu não sou o Aoyagi. Se eu fosse, você estaria conversando com um arquivo morto.\n\nEu sou a pessoa que encontrou o arquivo dele primeiro. E hoje, quando você terminou a atividade, eu abri o mensageiro da escola, e você apareceu logada na conta ALUNO_17 — a conta dele.',
              );
              get().updateChat('oculto', { stage: 5 });
            }, 1800);
          }
        }
        if (f.deleted) {
          s.notify('Arquivo na Lixeira', 'Restaure o arquivo para abri-lo.');
          return;
        }
        switch (f.type) {
          case 'folder': s.openApp('explorer', { folderId: f.id }); break;
          case 'txt':
          case 'doc': s.openApp('editor', { fileId: f.id, title: f.name }); break;
          case 'sheet': s.openApp('sheet', { fileId: f.id, title: f.name }); break;
          case 'presentation': s.openApp('presentation', { fileId: f.id, title: f.name }); break;
          case 'image': s.openApp('gallery', { imageId: f.id }); break;
        }
      },

      closeWindow: (id, force = false) => {
        if (!force) {
          const g = closeGuards.get(id);
          if (g && !g()) return;
        }
        closeGuards.delete(id);
        const s = get();
        const rest = s.windows.filter((w) => w.id !== id);
        const top = rest.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
        playSound('close', s.settings);
        set({ windows: rest, activeId: top?.id ?? null });
      },
      focusWindow: (id) => {
        const s = get();
        if (s.activeId === id && !s.windows.find((w) => w.id === id)?.minimized) return;
        set({
          windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.zTop + 1, minimized: false } : w)),
          zTop: s.zTop + 1,
          activeId: id,
        });
      },
      minimizeWindow: (id) => {
        const s = get();
        const ws = s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
        const top = ws.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
        set({ windows: ws, activeId: top?.id ?? null });
      },
      toggleMaximize: (id) => set({ windows: get().windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) }),
      updateWindow: (id, patch) => set({ windows: get().windows.map((w) => (w.id === id ? { ...w, ...patch } : w)) }),
      setWindowProps: (id, props) => set({ windows: get().windows.map((w) => (w.id === id ? { ...w, props: { ...w.props, ...props } } : w)) }),

      // ---------- file system ----------
      snapshot: () => set({ fileUndo: [...get().fileUndo.slice(-14), get().files] }),
      undoFiles: () => {
        const u = get().fileUndo;
        if (!u.length) return false;
        set({ files: u[u.length - 1], fileUndo: u.slice(0, -1) });
        return true;
      },
      createFolder: (parentId, name = 'Nova pasta') => {
        get().snapshot();
        const files = get().files;
        const id = uid();
        const now = sceneISO();
        set({ files: [...files, { id, name: uniqueName(files, parentId, name), type: 'folder', parentId, content: null, createdAt: now, modifiedAt: now, readOnly: false, deleted: false }] });
        return id;
      },
      createFile: (parentId, name, type, content) => {
        get().snapshot();
        const files = get().files;
        const id = uid();
        const now = sceneISO();
        set({ files: [...files, { id, name: uniqueName(files, parentId, name), type, parentId, content, createdAt: now, modifiedAt: now, readOnly: false, deleted: false }] });
        return id;
      },
      saveFile: (id, content) => set({ files: get().files.map((f) => (f.id === id ? { ...f, content, modifiedAt: sceneISO() } : f)) }),
      renameFile: (id, name) => {
        const files = get().files;
        const f = files.find((x) => x.id === id);
        if (!f) return 'Arquivo não encontrado.';
        const n = name.trim();
        if (!n) return 'O nome não pode ficar vazio.';
        if (/[\\/:*?"<>|]/.test(n)) return 'O nome não pode conter: \\ / : * ? " < > |';
        if (f.readOnly) return 'Arquivo somente leitura.';
        if (f.id === ROOT_ID) return 'Esta pasta não pode ser renomeada.';
        if (n === f.name) return null;
        if (files.some((x) => x.parentId === f.parentId && !x.deleted && x.id !== id && x.name.toLowerCase() === n.toLowerCase())) return 'Já existe um item com esse nome nesta pasta.';
        get().snapshot();
        set({ files: get().files.map((x) => (x.id === id ? { ...x, name: n, modifiedAt: sceneISO() } : x)) });
        return null;
      },
      moveFiles: (ids, parentId) => {
        let files = get().files;
        const valid = ids.filter((id) => {
          const f = files.find((x) => x.id === id);
          return f && f.id !== ROOT_ID && f.parentId !== parentId && !isDescendant(files, parentId, id) && !f.readOnly;
        });
        if (!valid.length) return 0;
        get().snapshot();
        files = get().files;
        for (const id of valid) {
          const f = files.find((x) => x.id === id)!;
          const name = uniqueName(files, parentId, f.name, id);
          files = files.map((x) => (x.id === id ? { ...x, parentId, name } : x));
        }
        set({ files });
        return valid.length;
      },
      copyFiles: (ids, parentId) => {
        get().snapshot();
        let files = get().files;
        const created: string[] = [];
        const now = sceneISO();
        const copyRec = (srcId: string, dest: string, top: boolean) => {
          const src = files.find((x) => x.id === srcId);
          if (!src) return;
          const id = uid();
          let name = src.name;
          if (top) {
            const sib = files.some((x) => x.parentId === dest && !x.deleted && x.name.toLowerCase() === name.toLowerCase());
            if (sib) {
              const dot = name.lastIndexOf('.');
              name = dot > 0 && src.type !== 'folder' ? `${name.slice(0, dot)} - Cópia${name.slice(dot)}` : `${name} - Cópia`;
            }
            name = uniqueName(files, dest, name);
            created.push(id);
          }
          files = [...files, { ...src, id, name, parentId: dest, createdAt: now, modifiedAt: now, readOnly: false, deleted: false, content: src.content && typeof src.content === 'object' ? JSON.parse(JSON.stringify(src.content)) : src.content }];
          if (src.type === 'folder') files.filter((c) => c.parentId === srcId && !c.deleted).forEach((c) => copyRec(c.id, id, false));
        };
        ids.forEach((id) => {
          if (!isDescendant(files, parentId, id) || files.find((f) => f.id === id)?.type !== 'folder') copyRec(id, parentId, true);
        });
        set({ files });
        return created;
      },
      trashFiles: (ids) => {
        const files = get().files;
        const valid = ids.filter((id) => {
          const f = files.find((x) => x.id === id);
          return f && f.id !== ROOT_ID && !f.readOnly && !f.deleted;
        });
        if (valid.length < ids.length) get().notify('Alguns itens não foram excluídos', 'Arquivos somente leitura ou protegidos não podem ser excluídos.');
        if (!valid.length) return 0;
        get().snapshot();
        const now = sceneISO();
        set({ files: get().files.map((f) => (valid.includes(f.id) ? { ...f, deleted: true, originalParentId: f.parentId, deletedAt: now } : f)) });
        playSound('trash', get().settings);
        // close windows of trashed files
        get().windows.filter((w) => valid.includes(w.props.fileId)).forEach((w) => get().closeWindow(w.id, true));
        return valid.length;
      },
      restoreFiles: (ids) => {
        get().snapshot();
        let files = get().files;
        for (const id of ids) {
          const f = files.find((x) => x.id === id);
          if (!f) continue;
          const target = f.originalParentId && isAlive(files, f.originalParentId) ? f.originalParentId : ROOT_ID;
          const name = uniqueName(files, target, f.name, id);
          files = files.map((x) => (x.id === id ? { ...x, deleted: false, parentId: target, name, deletedAt: undefined } : x));
        }
        set({ files });
      },
      purgeFiles: (ids) => {
        const files = get().files;
        const all = new Set<string>();
        ids.forEach((id) => {
          all.add(id);
          descendants(files, id).forEach((d) => all.add(d));
        });
        set({ files: files.filter((f) => !all.has(f.id)), fileUndo: [] });
      },
      emptyTrash: () => get().purgeFiles(get().files.filter((f) => f.deleted).map((f) => f.id)),
      setReadOnly: (id, v) => set({ files: get().files.map((f) => (f.id === id ? { ...f, readOnly: v } : f)) }),
      setClipboard: (clipboard) => set({ clipboard }),

      // ---------- browser ----------
      addHistory: (url, title) => {
        const s = get();
        set({
          browserHistory: [{ url, title, date: sceneISO() }, ...s.browserHistory].slice(0, 200),
          lastVisitedPages: [url, ...s.lastVisitedPages.filter((u) => u !== url)].slice(0, 10),
        });
      },
      clearHistory: () => set({ browserHistory: [], lastVisitedPages: [] }),
      toggleFavorite: (url, title) => {
        const favs = get().favorites;
        set({ favorites: favs.some((f) => f.url === url) ? favs.filter((f) => f.url !== url) : [...favs, { url, title }] });
      },
      download: (d, url) => {
        const fileId = get().createFile(DOWNLOADS_ID, d.name, d.type, d.content);
        const file = get().files.find((f) => f.id === fileId)!;
        set({ downloads: [{ id: uid(), name: file.name, url, date: sceneISO(), fileId }, ...get().downloads] });
        get().notify('Download concluído', `${file.name} foi salvo em Downloads.`);
        return fileId;
      },
      removeDownload: (id) => set({ downloads: get().downloads.filter((d) => d.id !== id) }),

      // ---------- mail ----------
      updateEmail: (id, patch) => set({ emails: get().emails.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
      addEmail: (e) => set({ emails: [e, ...get().emails.filter((x) => x.id !== e.id)] }),
      deleteEmail: (id) => {
        const e = get().emails.find((x) => x.id === id);
        if (!e) return;
        if (e.folder === 'trash') set({ emails: get().emails.filter((x) => x.id !== id) });
        else get().updateEmail(id, { folder: 'trash' });
      },

      // ---------- chat ----------
      updateChat: (contactId, patch) => set({ chats: get().chats.map((c) => (c.contactId === contactId ? { ...c, ...patch } : c)) }),

      /**
       * Every message is appended by reading the store *at the moment of the
       * write*, never from a captured render snapshot, and replies are looked
       * up by thread id. That is what keeps a fast follow-up message or a
       * re-opened window from clobbering a conversation.
       */
      sendChatMessage: (contactId, text) => {
        const stamp = () => {
          const d = new Date();
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };
        if (contactId === 'oculto' && !get().chats.find((c) => c.contactId === 'oculto')?.unlocked) return;
        set({
          chats: get().chats.map((c) =>
            c.contactId === contactId ? { ...c, messages: [...c.messages, { id: uid(), sender: 'me', text, timestamp: stamp() } as ChatMessage] } : c,
          ),
        });
        // Grade the current question immediately so rapid messages cannot
        // accidentally be scored against the same question by delayed timers.
        if (contactId === 'oculto' && get().lore.exam.started && !get().lore.exam.done) {
          get().answerExam(text);
          return;
        }

        window.setTimeout(() => {
          const thread = get().chats.find((c) => c.contactId === contactId);
          if (!thread) return;
          set({ chats: get().chats.map((c) => (c.contactId === contactId ? { ...c, typing: true } : c)) });
        }, 500);

        const delay = 1400 + Math.min(2200, text.length * 22);
        // Safety net: the typing indicator can never stay on forever.
        window.setTimeout(() => {
          const t = get().chats.find((c) => c.contactId === contactId);
          if (t?.typing) set({ chats: get().chats.map((c) => (c.contactId === contactId ? { ...c, typing: false } : c)) });
        }, delay + 9000);
        window.setTimeout(() => {
          const s = get();
          const thread = s.chats.find((c) => c.contactId === contactId);
          if (!thread) return;
          let answer = '';
          let stage = thread.stage;
          try {
            if (contactId === 'emi') answer = replyEmi(text);
            else if (contactId === 'mori') answer = replyMori(text);
            else {
              // Free conversation until the player says something that starts
              // the exam ("ok", "pronto", "começa").
              const wantsExam =
                s.lore.yamantakaSearched &&
                (!s.lore.exam.started || (s.lore.exam.done && s.lore.exam.score < 7)) &&
                /^(ok|oka|pronto|pronta|bora|começa|comeca|vamos|entendi|pode ser|sim|vai|refazer|tentar de novo|reiniciar)$/i.test(text.trim());
              const r = replyStranger(text, { stage: thread.stage, lore: s.lore, history: thread.messages });
              answer = r?.text ?? '';
              stage = typeof r?.stage === 'number' ? r.stage : thread.stage;
              if (wantsExam) {
                answer = 'Agora.';
                window.setTimeout(() => get().startExam(), 800);
              }
            }
          } catch {
            answer = '';
          }
          if (!answer.trim()) answer = `"${text.slice(0, 60)}" — eu li duas vezes. Continue.`;
          playSound('notify', s.settings);
          const openHere = s.windows.some((w) => w.app === 'chat' && !w.minimized);
          set({
            chats: s.chats.map((c) =>
              c.contactId === contactId
                ? {
                    ...c,
                    typing: false,
                    stage,
                    unread: openHere ? 0 : c.unread + 1,
                    messages: [...c.messages, { id: uid(), sender: 'contact', text: answer, timestamp: stamp() } as ChatMessage],
                  }
                : c,
            ),
          });
          if (!openHere) s.notify('Mensageiro', `${thread.contactName} respondeu`);
        }, delay);
      },

      receiveChat: (contactId, text) => {
        const s = get();
        const d = new Date();
        const timestamp = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const openHere = s.windows.some((w) => w.app === 'chat' && !w.minimized);
        const name = s.chats.find((c) => c.contactId === contactId)?.contactName ?? 'Contato';
        set({
          chats: s.chats.map((c) =>
            c.contactId === contactId
              ? { ...c, contactStatus: 'online', unread: openHere ? 0 : c.unread + 1, messages: [...c.messages, { id: uid(), sender: 'contact', text, timestamp } as ChatMessage] }
              : c,
          ),
        });
        playSound('notify', s.settings);
        if (!openHere) s.notify('Mensageiro', `${name} enviou uma mensagem`);
      },
      unlockChat: (contactId) => set({ chats: get().chats.map((c) => (c.contactId === contactId ? { ...c, unlocked: true, contactStatus: 'online' } : c)) }),

      // ---------- the Yamāntaka trail: questionnaire + payoff ----------
      startExam: () => {
        const s = get();
        if (s.lore.exam.started && (!s.lore.exam.done || s.lore.exam.score >= 7)) return;
        set({ lore: { ...s.lore, exam: { ...DEFAULT_EXAM, started: true } } });
        s.receiveChat('oculto', EXAM_INTRO);
        s.receiveChat('oculto', examQuestionText(0));
      },

      answerExam: (answer) => {
        const s = get();
        const ex = s.lore.exam;
        if (!ex.started || ex.done || ex.index >= EXAM_QUESTIONS.length) return;

        const command = normalize(answer).replace(/[._-]/g, ' ').trim();
        if (/^(pular|pula|pula essa|pular pergunta|passar|proxima|proxima pergunta|ir para a proxima|nao sei|sei la|skip|saltar)$/.test(command)) {
          s.receiveChat('oculto', 'Não dá para pular. Responda o que você acha, mesmo sem ter certeza.');
          return;
        }

        const ok = examCheck(ex.index, answer);
        const next = ex.index + 1;
        const finished = next >= EXAM_QUESTIONS.length;
        const score = ex.score + Number(ok);
        set({
          lore: {
            ...s.lore,
            exam: { ...ex, index: next, score, answers: [...ex.answers, ok], done: finished },
          },
        });
        s.receiveChat('oculto', examRemark(ex.index, ok, EXAM_QUESTIONS.length - next));
        if (!finished) {
          s.receiveChat('oculto', examQuestionText(next));
          return;
        }

        s.receiveChat('oculto', `Terminamos: ${score} de ${EXAM_QUESTIONS.length}.`);
        if (!examResult(score).passed) {
          s.receiveChat('oculto', 'Ainda não chegou a sete. Releia as páginas e me diga "refazer" quando estiver pronta. Nada foi perdido.');
          return;
        }

        s.receiveChat('oculto', EXAM_PASS_INTRO);
        // The reward is created once, in the real Downloads folder. It also
        // appears in the browser's downloads list and can be opened in Editor.
        const existing = get().files.find((f) => f.name === EXAM_PASS_FILE_NAME && !f.deleted);
        let fileId: string;
        if (existing) {
          fileId = existing.id;
          if (existing.parentId !== DOWNLOADS_ID) get().moveFiles([fileId], DOWNLOADS_ID);
          if (!get().downloads.some((d) => d.fileId === fileId)) {
            set({ downloads: [{ id: uid(), name: EXAM_PASS_FILE_NAME, fileId, url: 'higashi://mensageiro/oculto', date: sceneISO() }, ...get().downloads] });
          }
        } else {
          fileId = get().download({ name: EXAM_PASS_FILE_NAME, type: 'txt', content: EXAM_PASS_FILE_CONTENT }, 'higashi://mensageiro/oculto');
        }
        set({
          lore: { ...get().lore, exam: { ...get().lore.exam, sent: true } },
          chats: get().chats.map((c) => c.contactId === 'oculto' ? { ...c, fileSent: true, fileId } : c),
        });
        get().receiveChat('oculto', `Baixe: ${EXAM_PASS_FILE_NAME}\n\nEstá em Downloads. Abra no Editor de Texto quando quiser.`);
        get().receiveChat('oculto', EXAM_FINAL_MSG);
      },

      // ---------- the Yamāntaka trail ----------
      markLore: (patch) => set({ lore: { ...get().lore, ...patch } }),
      markSearch: (query) => {
        const s = get();
        if (!isYamantakaQuery(query) || s.lore.yamantakaSearched) return;
        set({ lore: { ...s.lore, yamantakaSearched: true } });
        const thread = s.chats.find((c) => c.contactId === 'oculto');
        if (thread?.unlocked && thread.stage < 2) {
          window.setTimeout(() => {
            get().receiveChat(
              'oculto',
              'Você pesquisou. Eu vi — a caixa de pesquisa está neste mesmo computador, e eu também tenho conta aqui.\n\nMe diz o que você achou primeiro. E repare numa coisa: a palavra não é "destruidor". antaka é "aquilo que faz acabar". Ninguém destrói a morte. A morte é que acaba.\n\nLeia os resultados, os que parecem sérios e os que parecem mentira. Eu vou esperar — e já aviso: quando você terminar a leitura eu te faço DEZ perguntas. Se acertar SETE, eu te mando um arquivo em troca. Diga "ok" quando estiver pronto.',
            );
            get().updateChat('oculto', { stage: 2 });
          }, 1600);
        }
      },
      markPageVisit: (url) => {
        const s = get();
        const visited = s.lore.visitedPages.includes(url) ? s.lore.visitedPages : [...s.lore.visitedPages, url];
        const patch: Partial<Lore> = { visitedPages: visited };
        if (url.includes('midnight-darshana')) patch.sawBlog = true;
        if (url.includes('dharma-forum')) patch.sawForum = true;
        if (url.includes('memoria.higashi-school')) patch.sawArchive = true;
        const first = !s.lore.sawBlog && url.includes('midnight-darshana');
        const firstArchive = !s.lore.sawArchive && url.includes('memoria.higashi-school');
        set({ lore: { ...s.lore, ...patch } });
        if (first) get().notify('Mensageiro', 'Você abriu um site que não deveria existir na rede da escola');
        if (firstArchive) {
          window.setTimeout(() => {
            const t = get().chats.find((c) => c.contactId === 'oculto');
            if (t?.unlocked && t.stage < 4)
              get().receiveChat(
                'oculto',
                'Você abriu o inventário. Aoyagi R., 2º B, desativado em 04/12/2003 e reativado em 2011.\n\nVocê está usando a conta de outra pessoa desde o começo do semestre, e ninguém nunca cobrou isso de você, porque o computador não cobra nada de ninguém.\n\nNo fim da página diz que sobrou um arquivo na pasta Compartilhados. Abra Documentos/Compartilhados/arquivo_ALUNO_17_2003.txt. É a última coisa que ele escreveu neste terminal.',
              );
            get().updateChat('oculto', { stage: 4 });
          }, 4000);
        }
      },
      startStrangerContact: () => {
        const s = get();
        const thread = s.chats.find((c) => c.contactId === 'oculto');
        if (!thread || thread.unlocked) return;
        s.unlockChat('oculto');
        window.setTimeout(() => {
          get().receiveChat(
            'oculto',
            'Gabriela.\n\nVocê passou na atividade e agora o computador é seu pelo resto da aula. Bom. Era essa a parte chata.\n\nEu não vou dizer quem sou ainda, porque você não acreditaria e contaria para alguém, e é exatamente por isso que eu estou escrevendo em vez de falar: porque você é a única pessoa desta escola que lê o que alguém escreve antes de rir.\n\nFaça uma coisa por mim. Abra o Navegador e pesquise, com estas palavras:\n\n    Yamāntaka, o destruidor da morte\n\nDepois volte aqui e me diga o que você achou primeiro. Não é ameaça. É a única coisa que eu posso te dizer sem parecer louco.',
          );
          get().updateChat('oculto', { stage: 1 });
        }, 2500);
        window.setTimeout(() => {
          get().receiveChat('oculto', 'Ah — e não pergunte ao professor Mori sobre isso ainda. Ele é a única pessoa aqui que conseguiria ler seus registros de pesquisa. Eu quero que você leia primeiro.');
        }, 16000);
      },

      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      addPrintJob: (j) => set({ printLog: [{ ...j, id: uid(), date: sceneISO() }, ...get().printLog] }),

      setTask: (patch) => set({ task: { ...get().task, ...patch } }),
      setWroteParagraph: (v) => {
        if (get().wroteParagraph !== v && v) set({ wroteParagraph: true });
      },
      checkTask: () => {
        const s = get();
        const st = getTaskStatus(s);
        if (st.completed && !s.task.completedNotified) {
          set({ task: { ...s.task, completedNotified: true } });
          playSound('success', s.settings);
          s.notify('Atividade 01 concluída ✔', 'O Prof. Mori recebeu sua atividade. O computador está liberado para uso livre.');
          // The class is over for grading purposes: from here the lab is hers,
          // and this is the moment the stranger chooses to start talking.
          window.setTimeout(() => get().startStrangerContact(), 9000);
        }
      },
    }),
    {
      name: 'higashi-os-state-v1',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<OSState>;
        if (!state) return state;
        if (state.settings?.wallpaper === '/pc-escola/images/wallpaper.jpg' || state.settings?.wallpaper === '/images/wallpaper.jpg' || state.settings?.wallpaper === '/images/win7_wallpaper.jpg') {
          state.settings = { ...state.settings, wallpaper: '/pc-escola/images/win7_wallpaper.jpg' };
        }
        if (version < 3) {
          const base = initialData();
          // Rebuild the messenger threads and the investigation log on top of
          // whatever the player already had, so an old save keeps its files.
          state.chats = base.chats?.map((c) => {
            const old = state.chats?.find((o) => o.contactId === c.contactId);
            return old ? { ...c, messages: old.messages ?? c.messages, unlocked: c.contactId === 'oculto' ? c.unlocked : true } : c;
          });
          state.lore = { ...base.lore, ...(state.lore ?? {}) };
          const files = state.files ?? base.files;
          if (base.files.some((f) => f.id === 'sh3') && !files.some((f) => f.id === 'sh3')) {
            state.files = [...files, base.files.find((f) => f.id === 'sh3')!];
          }
        }
        if (version < 4) {
          const base = initialData();
          state.chats = (state.chats ?? base.chats).map((c) => ({ ...c, typing: false }));
          const old = state.lore?.exam;
          const index = Math.min(EXAM_QUESTIONS.length, Math.max(0, old?.index ?? 0));
          const exam = {
            ...DEFAULT_EXAM,
            ...old,
            index,
            // In older saves a question advanced only when answered correctly.
            answers: old?.done ? (old.answers ?? []).slice(0, EXAM_QUESTIONS.length) : Array(index).fill(true),
            score: old?.done ? (old.score ?? 0) : index,
          };
          state.lore = { ...base.lore, ...state.lore, exam };

          // Older builds marked the reward "sent" before creating its file.
          // Repair those saves without deleting the player's chat or files.
          if (exam.done && exam.score >= 7) {
            const files = state.files ?? base.files;
            let file = files.find((f) => f.name === EXAM_PASS_FILE_NAME && !f.deleted);
            if (!file) {
              const date = sceneISO();
              file = {
                id: uid(), name: EXAM_PASS_FILE_NAME, type: 'txt', parentId: DOWNLOADS_ID,
                content: EXAM_PASS_FILE_CONTENT, createdAt: date, modifiedAt: date,
                readOnly: false, deleted: false,
              };
              state.files = [...files, file];
            } else if (file.parentId !== DOWNLOADS_ID) {
              state.files = files.map((f) => f.id === file!.id ? { ...f, parentId: DOWNLOADS_ID } : f);
            }
            if (!(state.downloads ?? []).some((d) => d.fileId === file.id)) {
              state.downloads = [
                { id: uid(), fileId: file.id, name: EXAM_PASS_FILE_NAME, url: 'higashi://mensageiro/oculto', date: sceneISO() },
                ...(state.downloads ?? []),
              ];
            }
            state.chats = (state.chats ?? base.chats).map((c) => c.contactId === 'oculto' ? { ...c, fileSent: true, fileId: file!.id } : c);
            state.lore.exam.sent = true;
          }
        }
        return state;
      },
      partialize: (s) => ({
        currentUser: s.currentUser,
        files: s.files,
        downloads: s.downloads,
        browserHistory: s.browserHistory,
        favorites: s.favorites,
        lastVisitedPages: s.lastVisitedPages,
        emails: s.emails,
        // Typing indicators are transient; never restore one without its timer.
        chats: s.chats.map((c) => ({ ...c, typing: false })),
        lore: s.lore,
        settings: s.settings,
        printLog: s.printLog,
        windows: s.windows,
        zTop: s.zTop,
        task: s.task,
        wroteParagraph: s.wroteParagraph,
        sceneElapsed: s.sceneElapsed,
        sessions: s.sessions,
      }),
    },
  ),
);

export { ROOT_ID, ESCOLA_ID, DOWNLOADS_ID };
