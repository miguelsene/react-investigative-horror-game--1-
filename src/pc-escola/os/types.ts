export type FileType = 'folder' | 'txt' | 'doc' | 'sheet' | 'image' | 'presentation';

export interface SheetContent {
  cells: Record<string, string>;
  locked?: string[];
  cols?: number;
  rows?: number;
  widths?: Record<string, number>;
}

export interface Slide {
  title: string;
  subtitle?: string;
  bullets?: string[];
  image?: string;
  caption?: string;
  bg?: string;
}

export interface PresentationContent {
  slides: Slide[];
}

export interface ImageContent {
  src: string;
  caption: string;
  taken: string;
}

export type FileContent = string | SheetContent | PresentationContent | ImageContent | null;

export interface VFile {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  content: FileContent;
  createdAt: string;
  modifiedAt: string;
  readOnly: boolean;
  deleted: boolean;
  originalParentId?: string | null;
  deletedAt?: string;
}

export interface PageLink {
  label: string;
  url: string;
}

export interface PageDownload {
  name: string;
  type: FileType;
  content: FileContent;
  size?: string;
}

export interface Page {
  id: string;
  url: string;
  title: string;
  date: string;
  category: string;
  site: string;
  body: string;
  links: PageLink[];
  searchableTerms: string[];
  downloads?: PageDownload[];
  /** Not reachable through the local index; only through links. */
  unlisted?: boolean;
  /** Renders the "outside the public index" warning bar. */
  sensitive?: boolean;
  /** Renders the low-quality ad banner + warning (dubious sites). */
  tone?: 'clean' | 'sketchy';
}

export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export interface Email {
  id: string;
  folder: MailFolder;
  from: string;
  fromAddr: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  canReply: boolean;
  replyTo?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'contact';
  text: string;
  timestamp: string;
  attachment?: { type: 'image'; src: string; name: string; fileId?: string };
}

export interface ChatThread {
  contactId: string;
  contactName: string;
  contactStatus: 'online' | 'away' | 'offline';
  messages: ChatMessage[];
  typing: boolean;
  unlocked: boolean;
  unread: number;
  /** Escalation step of the stranger's revelation. */
  stage: number;
  /** SHAPE of the final payoff: the stranger sent Gabriela a file. */
  fileSent?: boolean;
  fileId?: string;
}

export interface Exam {
  started: boolean;
  index: number;
  score: number;
  answers: boolean[];
  done: boolean;
  sent: boolean;
}

export const DEFAULT_EXAM: Exam = {
  started: false,
  index: 0,
  score: 0,
  answers: [],
  done: false,
  sent: false,
};

export interface Lore {
  yamantakaSearched: boolean;
  sawBlog: boolean;
  sawForum: boolean;
  sawArchive: boolean;
  readNotebook: boolean;
  visitedPages: string[];
  exam: Exam;
}

export const EXAM_TOTAL = 10;
export const EXAM_PASS = 7;

export type AppId =
  | 'explorer'
  | 'browser'
  | 'mail'
  | 'portal'
  | 'editor'
  | 'sheet'
  | 'presentation'
  | 'gallery'
  | 'trash'
  | 'settings'
  | 'search'
  | 'tasks'
  | 'chat';

export interface WindowState {
  id: string;
  app: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
  props: Record<string, any>;
}

export interface Settings {
  volume: number;
  muted: boolean;
  brightness: number;
  fontSize: 'small' | 'medium' | 'large';
  wallpaper: string;
  language: 'pt' | 'en' | 'ja';
  cursorSpeed: number;
  highContrast: boolean;
  reduceMotion: boolean;
  largeCursor: boolean;
  keyboard: 'PT' | 'JA';
}

export interface TaskFlags {
  quizOpened: boolean;
  quizCompleted: boolean;
  quizScore: number;
  completedNotified: boolean;
}

export interface DownloadEntry {
  id: string;
  name: string;
  url: string;
  date: string;
  fileId: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  date: string;
}

export interface Favorite {
  url: string;
  title: string;
}

export interface PrintJob {
  id: string;
  document: string;
  pages: string;
  copies: number;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  body?: string;
}
