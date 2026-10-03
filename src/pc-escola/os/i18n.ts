import type { AppId, Settings } from './types';
import { useOS } from './store';

const dict = {
  pt: {
    explorer: 'Meus Documentos', browser: 'Navegador', mail: 'Correio Escolar', portal: 'Portal da Escola',
    editor: 'Editor de Texto', sheet: 'Planilhas', presentation: 'Apresentações', gallery: 'Galeria', trash: 'Lixeira',
    settings: 'Configurações', search: 'Pesquisa', tasks: 'Atividade da Aula', chat: 'Mensageiro',
    start: 'Iniciar', exit: 'Sair do computador', restart: 'Reiniciar', searchPh: 'Pesquisar aplicativos e arquivos',
    connected: 'Conectado', activity: 'Atividade', allApps: 'Aplicativos', recent: 'Arquivos recentes',
  },
  en: {
    explorer: 'My Documents', browser: 'Browser', mail: 'School Mail', portal: 'School Portal',
    editor: 'Text Editor', sheet: 'Spreadsheets', presentation: 'Presentations', gallery: 'Gallery', trash: 'Recycle Bin',
    settings: 'Settings', search: 'Search', tasks: 'Class Activity', chat: 'Messenger',
    start: 'Start', exit: 'Leave computer', restart: 'Restart', searchPh: 'Search apps and files',
    connected: 'Connected', activity: 'Activity', allApps: 'Apps', recent: 'Recent files',
  },
  ja: {
    explorer: 'マイドキュメント', browser: 'ブラウザ', mail: '学校メール', portal: '学校ポータル',
    editor: 'テキストエディタ', sheet: 'スプレッドシート', presentation: 'プレゼンテーション', gallery: 'ギャラリー', trash: 'ごみ箱',
    settings: '設定', search: '検索', tasks: '授業の課題', chat: 'メッセンジャー',
    start: 'スタート', exit: 'パソコンを離れる', restart: '再起動', searchPh: 'アプリとファイルを検索',
    connected: '接続済み', activity: '課題', allApps: 'アプリ', recent: '最近のファイル',
  },
};

export type I18nKey = keyof typeof dict.pt;

export function tr(lang: Settings['language'], key: I18nKey | AppId) {
  return (dict[lang] as any)[key] ?? (dict.pt as any)[key] ?? key;
}

export function useT() {
  const lang = useOS((s) => s.settings.language);
  return (key: I18nKey | AppId) => tr(lang, key);
}
