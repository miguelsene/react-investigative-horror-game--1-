import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS, getTaskStatus, isAlive } from '../os/store';
import type { AppId } from '../os/types';
import { AppIcon, FileIcon, Ico } from './Icons';
import { useT } from '../os/i18n';
import { fmtTime, sceneNow, pad } from '../os/utils';
import { searchAll } from '../apps/Search';
import { useDoubleClick } from '../apps/FileExplorer';

export const DESKTOP_APPS: AppId[] = ['chat', 'explorer', 'browser', 'mail', 'portal', 'editor', 'sheet', 'gallery', 'trash', 'settings', 'search'];

function StartOrb({ size = 42 }: { size?: number }) {
  return (
    <span className="aero-start-orb relative flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" width={size * 0.61} height={size * 0.61} aria-hidden>
        <path d="M3 6.2 14.5 4v10.7H3z" fill="#ffca34" />
        <path d="M17 3.5 29 1.5v13.2H17z" fill="#54c653" />
        <path d="M3 17.2h11.5v10.7L3 25.8z" fill="#38a9ed" />
        <path d="M17 17.2h12v13.2l-12-2z" fill="#ed4f48" />
      </svg>
      <span className="absolute inset-x-1 top-[2px] h-1/3 rounded-full bg-white/40 blur-[1px]" />
    </span>
  );
}

export function useSceneClock() {
  const [now, setNow] = useState(sceneNow());
  useEffect(() => {
    const t = setInterval(() => setNow(sceneNow()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function DesktopIcons() {
  const os = useOS();
  const t = useT();
  const [sel, setSel] = useState<AppId | null>(null);
  const [over, setOver] = useState(false);
  const isDouble = useDoubleClick();
  const trashCount = os.files.filter((f) => f.deleted).length;
  const chatUnread = os.chats.reduce((n, c) => n + (c.unread || 0), 0);
  const strangerWaiting = os.chats.some((c) => c.contactId === 'oculto' && (c.unread || 0) > 0);

  const openApp = (a: AppId) => (a === 'editor' || a === 'sheet' ? os.openApp(a, {}) : os.openApp(a));

  return (
    <div
      className="absolute top-2 left-2 bottom-12 grid grid-flow-col grid-rows-[repeat(auto-fill,88px)] gap-1 content-start"
      onKeyDown={(e) => { if (e.key === 'Enter' && sel) openApp(sel); }}
    >
      {DESKTOP_APPS.map((a) => (
        <button
          key={a}
          onClick={(e) => { e.stopPropagation(); setSel(a); if (isDouble(a)) openApp(a); }}
          onDragOver={(e) => { if (a === 'trash' || a === 'explorer') { e.preventDefault(); if (a === 'trash') setOver(true); } }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const ids = e.dataTransfer.getData('text/higashi-files');
            if (!ids) return;
            if (a === 'trash') { const n = os.trashFiles(ids.split(',')); if (n) os.notify('Lixeira', `${n} item(ns) enviado(s) para a Lixeira.`); }
            if (a === 'explorer') { const n = os.moveFiles(ids.split(','), 'root'); if (n) os.notify('Movido', `${n} item(ns) movido(s) para Meus Documentos.`); }
          }}
          className={`aero-desktop-icon w-[84px] h-[86px] flex flex-col items-center justify-start gap-1 pt-1.5 rounded-[3px] focus:outline-none ${sel === a ? 'bg-sky-300/30 ring-1 ring-sky-100/75' : ''} ${over && a === 'trash' ? 'bg-white/30 ring-2 ring-white' : ''}`}
        >
          <div className="relative">
            <AppIcon app={a} size={46} full={a === 'trash' && trashCount > 0} />
            {a === 'chat' && chatUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 ring-2 ring-white/20 text-white text-[10px] font-bold grid place-items-center shadow">{chatUnread}</span>
            )}
            {a === 'chat' && strangerWaiting && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-sky-400/80 animate-pulse" />}
          </div>
          <span className="text-[11.5px] leading-tight text-center line-clamp-2 px-0.5">{t(a)}</span>
        </button>
      ))}
    </div>
  );
}

export function TaskWidget() {
  const os = useOS();
  const [collapsed, setCollapsed] = useState(false);
  const st = getTaskStatus(os);
  return (
    <div className="aero-gadget absolute top-3 right-3 w-64 rounded-[5px] text-slate-800 text-xs select-none" style={{ zIndex: 5 }}>
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-2 px-2.5 py-1.5 border-b border-sky-900/10">
        <span className="w-6 h-6 rounded-sm bg-gradient-to-b from-sky-400 to-blue-700 text-white flex items-center justify-center shadow-sm"><Ico name="clipboard" size={13} /></span>
        <span className="font-semibold flex-1 text-left">Atividade 01 — Informática</span>
        <span className="text-sky-800 font-semibold">{st.doneCount}/{st.steps.length}</span>
      </button>
      {!collapsed && (
        <div className="px-3 py-2 space-y-1">
          <div className="h-1.5 rounded-full bg-slate-300/70 overflow-hidden mb-2"><div className={`h-full ${st.completed ? 'bg-emerald-500' : 'bg-sky-600'} transition-all`} style={{ width: `${(st.doneCount / st.steps.length) * 100}%` }} /></div>
          {st.steps.map((s, i) => (
            <div key={i} className={`flex gap-2 ${s.done ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
              <span className={s.done ? 'text-emerald-700' : 'text-slate-400'}>{s.done ? '✔' : `${i + 1}.`}</span>
              <span>{s.label}</span>
            </div>
          ))}
          {st.hints.map((h) => <div key={h} className="text-amber-800 pt-1">⚠ {h}</div>)}
          <button onClick={() => os.openApp('tasks')} className="mt-1 text-blue-800 hover:underline">Abrir detalhes</button>
        </div>
      )}
    </div>
  );
}

export function StartMenu({ onExit, onRestart }: { onExit: () => void; onRestart: () => void }) {
  const os = useOS();
  const t = useT();
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchAll(os.files, q), [os.files, q]);
  const recent = useMemo(
    () => os.files.filter((f) => f.type !== 'folder' && isAlive(os.files, f.id)).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)).slice(0, 3),
    [os.files],
  );

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-start-button]')) os.setStartOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [os]);

  const apps: AppId[] = ['chat', 'browser', 'mail', 'portal', 'explorer', 'editor', 'sheet', 'gallery', 'search', 'tasks', 'trash', 'settings'];
  const shownApps = q.trim() ? results.apps : showAll ? apps : apps.slice(0, 7);
  const openFolder = (folderId: string) => os.openApp('explorer', { folderId });

  return (
    <div ref={ref} className="aero-start-menu absolute bottom-[44px] left-1 w-[min(640px,calc(100vw-8px))] h-[min(580px,calc(100dvh-52px))] text-slate-800 rounded-t-[8px] shadow-2xl ring-1 ring-white/90 flex flex-col overflow-hidden animate-[startIn_.15s_ease-out]" style={{ zIndex: 99999 }}>
      <div className="h-[62px] shrink-0 flex items-center gap-3 px-4 border-b border-white/70 bg-gradient-to-b from-white/55 to-sky-100/20">
        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-sky-300 via-blue-600 to-blue-950 border-[2px] border-white shadow-lg flex items-center justify-center text-white font-bold text-sm ring-1 ring-slate-500/30">
          17<span className="absolute inset-x-1 top-0.5 h-1/3 rounded-full bg-white/35" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-[15px] text-slate-900">{os.currentUser}</div>
          <div className="text-[11px] text-slate-600">Laboratório 2 · HIGASHI-SCHOOL</div>
        </div>
        <div className="ml-auto text-right leading-tight">
          <div className="text-xs font-semibold tracking-wide text-sky-950">HIGASHI OS 3.4</div>
          <div className="text-[10px] text-slate-500">Perfil escolar</div>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 gap-2 p-2">
        <div className="flex-1 min-w-0 rounded-[3px] border border-white/80 bg-white/90 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[10px] font-bold tracking-wide text-slate-500">
            <span>{q.trim() ? 'RESULTADOS DA PESQUISA' : showAll ? t('allApps').toUpperCase() : 'PROGRAMAS USADOS RECENTEMENTE'}</span>
            {q.trim() && <span>{results.apps.length + results.files.length} item(ns)</span>}
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-1.5 pb-1">
            {q.trim() ? (
              <>
                {results.apps.map((a) => (
                  <button key={a} onClick={() => os.openApp(a)} className="aero-start-link w-full flex items-center gap-2 px-2 py-1 rounded-sm text-left text-[13px]">
                    <AppIcon app={a} size={26} /><span className="truncate">{t(a)}</span>
                  </button>
                ))}
                {results.files.slice(0, 8).map((r) => {
                  const f = os.files.find((x) => x.id === r.id)!;
                  return (
                    <button key={r.id} onClick={() => os.openFile(r.id)} className="aero-start-link w-full flex items-center gap-2 px-2 py-1 rounded-sm text-left text-[13px]">
                      <FileIcon type={f.type} size={26} src={f.type === 'image' ? (f.content as any)?.src : undefined} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  );
                })}
                {!results.apps.length && !results.files.length && <div className="p-3 text-xs text-slate-500">Nenhum resultado encontrado.</div>}
                <button onClick={() => os.openApp('search', { query: q })} className="w-full text-left px-2 py-1.5 text-xs text-blue-800 hover:underline">Ver todos os resultados para "{q}" →</button>
              </>
            ) : (
              <>
                {shownApps.map((a) => (
                  <button key={a} onClick={() => os.openApp(a, a === 'editor' || a === 'sheet' ? {} : undefined)} className="aero-start-link w-full flex items-center gap-2.5 px-2 py-1 rounded-sm text-left text-[13px]">
                    <AppIcon app={a} size={27} />
                    <span className="truncate flex-1">{t(a)}</span>
                    {(a === 'mail' || a === 'portal' || a === 'explorer') && <Ico name="forward" size={12} className="text-slate-400" />}
                  </button>
                ))}
                {!showAll && (
                  <div className="mt-1 border-t border-slate-200 pt-1">
                    <button onClick={() => setShowAll(true)} className="aero-start-link w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-semibold rounded-sm">
                      <span>Todos os programas</span><Ico name="forward" size={14} />
                    </button>
                    <div className="px-2 pt-1 text-[10px] font-bold tracking-wide text-slate-400">{t('recent').toUpperCase()}</div>
                    {recent.map((f) => (
                      <button key={f.id} onClick={() => os.openFile(f.id)} className="aero-start-link w-full flex items-center gap-2 px-2 py-1 rounded-sm text-left text-[12px]">
                        <FileIcon type={f.type} size={22} src={f.type === 'image' ? (f.content as any)?.src : undefined} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showAll && <button onClick={() => setShowAll(false)} className="aero-start-link mt-1 w-full flex items-center gap-2 border-t border-slate-200 px-3 py-2 text-xs font-semibold"><Ico name="back" size={13} /> Voltar</button>}
              </>
            )}
          </div>
          <div className="px-2 py-1 border-t border-slate-200 bg-slate-50/70 text-[10px] text-slate-400">HIGASHI SCHOOL COMPUTER · perfil ALUNO_17</div>
        </div>

        <div className="w-[42%] min-w-[168px] rounded-[3px] border border-white/40 bg-gradient-to-b from-sky-50/55 to-blue-100/45 px-1.5 py-1 shadow-inner overflow-auto">
          <div className="px-2 py-1.5 text-[10px] font-bold tracking-wide text-slate-500">ATALHOS</div>
          <button onClick={() => openFolder('root')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[13px] font-semibold"><FileIcon type="folder" size={24} /> Documentos</button>
          <button onClick={() => openFolder('imagens')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[13px] font-semibold"><Ico name="image" size={19} className="text-blue-700" /> Imagens</button>
          <button onClick={() => openFolder('downloads')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[13px] font-semibold"><Ico name="download" size={18} className="text-blue-700" /> Downloads</button>
          <div className="mx-2 my-1 border-t border-sky-900/15" />
          <button onClick={() => os.openApp('chat')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="chat" size={22} /> Mensageiro</button>
          <button onClick={() => os.openApp('browser')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="browser" size={22} /> Navegador</button>
          <button onClick={() => os.openApp('mail')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="mail" size={22} /> Correio Escolar</button>
          <button onClick={() => os.openApp('portal')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="portal" size={22} /> Portal da Escola</button>
          <button onClick={() => os.openApp('tasks')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="tasks" size={22} /> Atividade da aula</button>
          <div className="mx-2 my-1 border-t border-sky-900/15" />
          <button onClick={() => os.openApp('settings')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="settings" size={22} /> Painel de Controle</button>
          <button onClick={() => os.openApp('trash')} className="aero-start-link w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left text-[12px]"><AppIcon app="trash" size={22} /> Lixeira</button>
        </div>
      </div>

      <div className="aero-start-footer shrink-0 flex items-center gap-2 px-3 py-2 border-t border-white/70">
        <form className="relative flex-1 max-w-[290px]" onSubmit={(e) => {
          e.preventDefault();
          if (results.apps[0]) os.openApp(results.apps[0]);
          else if (results.files[0]) os.openFile(results.files[0].id);
          else os.openApp('search', { query: q });
        }}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && os.setStartOpen(false)}
            placeholder={t('searchPh')}
            className="aero-start-input w-full rounded-[3px] px-2.5 py-1.5 pr-8 text-[13px] outline-none placeholder:text-slate-400"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-700"><Ico name="search" size={15} /></button>
        </form>
        <div className="flex-1" />
        <button onClick={onRestart} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] text-slate-700 hover:bg-white/60" title={t('restart')}>
          <Ico name="rotate" size={14} /> <span className="hidden sm:inline">Reiniciar</span>
        </button>
        <button onClick={onExit} className="aero-shutdown-button flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-xs font-semibold text-white" title={t('exit')}>
          <Ico name="power" size={15} /> Desligar
        </button>
      </div>
    </div>
  );
}

export function Taskbar() {
  const os = useOS();
  const t = useT();
  const now = useSceneClock();
  const [pop, setPop] = useState<null | 'net' | 'vol' | 'clock'>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPop(null); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const lang = os.settings.language;
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const cells: (number | null)[] = [...Array(new Date(2019, now.getMonth(), 1).getDay()).fill(null), ...Array.from({ length: new Date(2019, now.getMonth() + 1, 0).getDate() }, (_, i) => i + 1)];

  return (
    <div ref={ref} className="aero-taskbar absolute bottom-0 inset-x-0 h-11 text-white flex items-center px-1 gap-1" style={{ zIndex: 99998 }}>
      <button data-start-button aria-label={t('start')} onClick={() => os.setStartOpen(!os.startOpen)} className={`relative h-11 w-[50px] flex items-center justify-center ${os.startOpen ? 'brightness-110' : ''}`} title="Iniciar (Ctrl+Esc)">
        <StartOrb size={42} />
      </button>
      <div className="w-px h-7 bg-white/20 mx-1 shadow-[1px_0_rgba(0,0,0,.22)]" />
      <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0">
        {os.windows.map((w) => {
          const active = os.activeId === w.id && !w.minimized;
          return (
            <button
              key={w.id}
              onClick={() => (active ? os.minimizeWindow(w.id) : os.focusWindow(w.id))}
              title={w.title}
              className={`aero-task-button h-10 flex items-center gap-2 px-2.5 rounded-[4px] max-w-[190px] min-w-[46px] shrink-0 ${active ? 'aero-task-button-active' : w.minimized ? 'opacity-80' : ''}`}
            >
              <AppIcon app={w.app} size={25} />
              <span className="text-xs truncate hidden lg:inline">{w.title.replace(/ — .*$/, '')}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-0 text-xs relative border-l border-white/20 pl-1">
        <button onClick={() => setPop(pop === 'net' ? null : 'net')} className="h-9 px-1.5 rounded hover:bg-white/15" title="Rede: HIGASHI-SCHOOL"><Ico name="wifi" size={15} /></button>
        <button onClick={() => setPop(pop === 'vol' ? null : 'vol')} className="h-9 px-1.5 rounded hover:bg-white/15" title={`Volume: ${os.settings.muted ? 'mudo' : os.settings.volume + '%'}`}><Ico name={os.settings.muted || os.settings.volume === 0 ? 'mute' : 'volume'} size={15} /></button>
        <button onClick={() => os.setSettings({ keyboard: os.settings.keyboard === 'PT' ? 'JA' : 'PT' })} className="h-9 px-1.5 rounded hover:bg-white/15 font-semibold text-[11px]" title="Layout do teclado (clique para alternar)">{os.settings.keyboard}</button>
        <button onClick={() => setPop(pop === 'clock' ? null : 'clock')} className="h-9 px-2 rounded hover:bg-white/15 text-right leading-tight" title={dateStr}>
          <div>{fmtTime(now)}</div>
          <div className="text-[10px] text-white/70">{dateStr}</div>
        </button>
        {pop === 'net' && (
          <div className="aero-popup absolute bottom-11 right-0 w-64 rounded-[4px] p-3 text-slate-800">
            <div className="flex items-center gap-3"><Ico name="wifi" size={20} className="text-sky-700" /><div><div className="font-semibold text-sm">HIGASHI-SCHOOL</div><div className="text-slate-500">{t('connected')} • Ethernet</div></div></div>
            <div className="mt-3 border-t border-slate-300 pt-2 text-slate-500 text-[11px]">IP 10.2.17.117 • Proxy escolar ativo</div>
          </div>
        )}
        {pop === 'vol' && (
          <div className="aero-popup absolute bottom-11 right-0 w-64 rounded-[4px] p-3 text-slate-800 flex items-center gap-3">
            <button onClick={() => os.setSettings({ muted: !os.settings.muted })}><Ico name={os.settings.muted ? 'mute' : 'volume'} size={18} /></button>
            <input type="range" min={0} max={100} value={os.settings.volume} onChange={(e) => os.setSettings({ volume: +e.target.value, muted: false })} className="flex-1" />
            <span className="w-8 text-right">{os.settings.volume}</span>
          </div>
        )}
        {pop === 'clock' && (
          <div className="aero-popup absolute bottom-11 right-0 w-72 rounded-[4px] p-4 text-slate-800">
            <div className="text-3xl font-light">{fmtTime(now)}<span className="text-lg text-slate-400">:{pad(now.getSeconds())}</span></div>
            <div className="text-slate-500 capitalize mb-3">{now.toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="text-slate-400">{d}</div>)}
              {cells.map((d, i) => <div key={i} className={`py-1 rounded ${d === now.getDate() ? 'bg-blue-600 text-white font-bold shadow-sm' : 'hover:bg-white/70'}`}>{d ?? ''}</div>)}
            </div>
            <button onClick={() => { os.openApp('portal'); setPop(null); }} className="mt-3 w-full border-t border-slate-300 pt-2 text-xs text-blue-800 hover:underline text-left">Abrir calendário da escola</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Notifications() {
  const notices = useOS((s) => s.notices);
  const dismiss = useOS((s) => s.dismissNotice);
  return (
    <div className="absolute right-3 bottom-14 flex flex-col gap-2 w-80 max-w-[calc(100vw-24px)] pointer-events-none" style={{ zIndex: 100000 }}>
      {notices.map((n) => (
        <div key={n.id} onClick={() => dismiss(n.id)} className="aero-toast pointer-events-auto rounded-[4px] p-3 animate-[toastIn_.2s_ease-out] cursor-pointer">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded bg-gradient-to-br from-rose-500 to-red-700 text-[10px] font-black flex items-center justify-center shrink-0">東</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{n.title}</div>
              {n.body && <div className="text-xs text-slate-600 mt-0.5">{n.body}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}