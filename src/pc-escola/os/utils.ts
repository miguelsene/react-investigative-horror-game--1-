import type { FileType, VFile } from './types';

export const SCENE_START = new Date(2019, 3, 12, 10, 44, 0).getTime();

let elapsedBase = 0;
let sessionStart = Date.now();

export function setClock(base: number) {
  elapsedBase = base;
  sessionStart = Date.now();
}
export function clockElapsed() {
  return elapsedBase + (Date.now() - sessionStart);
}
export function sceneNow(): Date {
  return new Date(SCENE_START + clockElapsed());
}
export function sceneISO() {
  return sceneNow().toISOString();
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function fmtDate(iso: string, withTime = true) {
  const d = new Date(iso);
  const s = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return withTime ? `${s} ${pad(d.getHours())}:${pad(d.getMinutes())}` : s;
}

export function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const EXT: Record<FileType, string> = {
  folder: '',
  txt: '.txt',
  doc: '.docx',
  sheet: '.xlsx',
  image: '.jpg',
  presentation: '.pptx',
};

export const TYPE_LABEL: Record<FileType, string> = {
  folder: 'Pasta de arquivos',
  txt: 'Documento de texto',
  doc: 'Documento do Editor',
  sheet: 'Planilha',
  image: 'Imagem JPEG',
  presentation: 'Apresentação',
};

export function fileSize(f: VFile): number {
  if (f.type === 'folder') return 0;
  if (f.type === 'image') return 1_200_000 + (f.name.length * 73_211) % 2_400_000;
  const raw = typeof f.content === 'string' ? f.content : JSON.stringify(f.content);
  const base = f.type === 'txt' ? 0 : f.type === 'doc' ? 11_800 : f.type === 'sheet' ? 8_400 : 240_000;
  return base + new Blob([raw ?? '']).size;
}

export function fmtSize(bytes: number) {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileText(f: VFile): string {
  if (typeof f.content === 'string') return f.content;
  if (!f.content) return '';
  const c: any = f.content;
  if (c.cells) return Object.values(c.cells).join(' ');
  if (c.slides) return c.slides.map((s: any) => [s.title, s.subtitle, ...(s.bullets || []), s.caption].join(' ')).join(' ');
  if (c.caption) return c.caption;
  return '';
}

export function typeFromName(name: string): FileType | null {
  const n = name.toLowerCase();
  if (n.endsWith('.txt')) return 'txt';
  if (n.endsWith('.docx') || n.endsWith('.doc')) return 'doc';
  if (n.endsWith('.xlsx')) return 'sheet';
  if (n.endsWith('.pptx')) return 'presentation';
  if (n.endsWith('.jpg') || n.endsWith('.png')) return 'image';
  return null;
}

export const TASK_FILE = 'atividade_informatica_gabriela.txt';

export const LAB_USER = 'ALUNO_17';
export const LAB_PASSWORD = 'lab2019';

/** Terms that mark the moment Gabriela starts looking into the stranger's hint. */
const YAMA_TERMS = [
  'yamantaka', 'yamari', 'destruidor da morte', 'devorador da morte', 'daiitoku', 'vajrabhairava',
  'senhor da morte', 'aoyagi', 'mesa 17', 'aluno 17 2003', 'lab2 pc17', 'lab2-pc17', 'o fim da morte',
];

export function isYamantakaQuery(q: string) {
  const n = normalize(q);
  return YAMA_TERMS.some((t) => n.includes(t));
}
