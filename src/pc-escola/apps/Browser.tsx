import { useEffect, useRef, useState } from 'react';
import { useOS, isAlive, DOWNLOADS_ID } from '../os/store';
import type { Page, WindowState } from '../os/types';
import { findPage, pages, SEARCH_HOME } from '../data/pages';
import { EXAM_PASS_FILE_CONTENT, EXAM_PASS_FILE_NAME } from '../data/exam';
import { Ico } from '../components/Icons';
import { fmtDate, normalize, uid } from '../os/utils';
import { copyText, selectedText } from '../os/clipboard';

export function searchPages(q: string): { page: Page; score: number }[] {
  const nq = normalize(q);
  if (!nq) return [];
  const terms = nq.split(' ').filter((t) => t.length > 1 || /\d/.test(t));
  // Pages flagged `unlisted` (school leftovers, archives) answer to direct
  // links only — they never surface in the index.
  return pages
    .filter((p) => !p.unlisted)
    .map((p) => {
      const title = normalize(p.title);
      const body = normalize(p.body);
      const kws = p.searchableTerms.map(normalize);
      let score = 0;
      if (title.includes(nq)) score += 12;
      if (kws.some((k) => k === nq)) score += 15;
      if (body.includes(nq)) score += 5;
      let matched = 0;
      for (const t of terms) {
        let hit = false;
        if (title.includes(t)) { score += 4; hit = true; }
        if (kws.some((k) => k.includes(t))) { score += 5; hit = true; }
        const n = body.split(t).length - 1;
        if (n) { score += Math.min(n, 4); hit = true; }
        if (normalize(p.site).includes(t)) { score += 2; hit = true; }
        if (hit) matched++;
      }
      if (terms.length > 1 && matched < Math.ceil(terms.length / 2)) score = 0;
      return { page: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function snippet(body: string, q: string) {
  const nb = normalize(body);
  const t = normalize(q).split(' ')[0] ?? '';
  const idx = t ? nb.indexOf(t) : -1;
  const start = Math.max(0, idx - 60);
  const s = body.replace(/\n+/g, ' ').slice(start, start + 180);
  return (start > 0 ? '…' : '') + s + '…';
}

type Tab = { id: string; stack: string[]; i: number };

function SearchForm({ initial, big, onSearch }: { initial: string; big: boolean; onSearch: (q: string) => void }) {
  const [q, setQ] = useState(initial);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); }}
      className={`flex items-center gap-2 border rounded-full bg-white shadow-sm ${big ? 'px-5 py-3 w-full max-w-xl' : 'px-4 py-1.5 w-full max-w-lg'}`}
    >
      <Ico name="search" size={big ? 18 : 14} className="text-slate-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus={big} placeholder="pesquisar..." className="flex-1 outline-none bg-transparent" />
      <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Pesquisar</button>
    </form>
  );
}

const resolveTitle = (url: string) => {
  if (url === SEARCH_HOME) return 'Higashi Search';
  if (url.startsWith(SEARCH_HOME + '/search')) return `${decodeURIComponent(url.split('q=')[1] ?? '')} — Higashi Search`;
  if (url === 'higashi://historico') return 'Histórico';
  if (url === 'higashi://downloads') return 'Downloads';
  if (url === 'higashi://favoritos') return 'Favoritos';
  return findPage(url)?.title ?? 'Página não encontrada';
};

export default function Browser({ win }: { win: WindowState }) {
  const os = useOS();
  const startUrl = win.props.url ?? SEARCH_HOME;
  const [tabs, setTabs] = useState<Tab[]>([{ id: uid(), stack: [startUrl], i: 0 }]);
  const [active, setActive] = useState(tabs[0].id);
  const [address, setAddress] = useState(startUrl);
  const [loading, setLoading] = useState(false);
  const [dlPanel, setDlPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const addrRef = useRef<HTMLInputElement>(null);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  const url = tab.stack[tab.i];

  useEffect(() => {
    setAddress(url);
    os.updateWindow(win.id, { title: `${resolveTitle(url)} — Navegador` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, active]);

  useEffect(() => {
    if (win.props.url && win.props.nonce) navigate(win.props.url, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.props.nonce]);

  // The investigation log: what she looked for, and what she actually opened.
  useEffect(() => {
    const m = /^https:\/\/higashi-search\.jp\/search\?q=(.*)$/.exec(url);
    if (m) {
      const q = decodeURIComponent(m[1] ?? '');
      if (q) os.markSearch(q);
      return;
    }
    const page = findPage(url);
    if (page) os.markPageVisit(page.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const load = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 280);
  };

  function navigate(u: string, newTab = false) {
    load();
    if (!u.startsWith('higashi://')) os.addHistory(u, resolveTitle(u));
    if (newTab) {
      const t = { id: uid(), stack: [u], i: 0 };
      setTabs((ts) => [...ts, t]);
      setActive(t.id);
      return;
    }
    setTabs((ts) => ts.map((t) => (t.id === tab.id ? { ...t, stack: [...t.stack.slice(0, t.i + 1), u], i: t.i + 1 } : t)));
  }

  const go = (d: number) => {
    const ni = tab.i + d;
    if (ni < 0 || ni >= tab.stack.length) return;
    load();
    setTabs((ts) => ts.map((t) => (t.id === tab.id ? { ...t, i: ni } : t)));
  };

  const submitAddress = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (v.startsWith('higashi://')) return navigate(v);
    const looksUrl = /^https?:\/\//.test(v) || (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) && !v.includes(' '));
    if (looksUrl) {
      let u = v.replace(/^http:\/\//, 'https://');
      if (!u.startsWith('https://')) u = 'https://' + u;
      u = u.replace(/\/+$/, '');
      const p = findPage(u);
      navigate(p ? p.url : u);
    } else navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent(v)}`);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return os.closeWindow(win.id);
    const idx = tabs.findIndex((t) => t.id === id);
    const rest = tabs.filter((t) => t.id !== id);
    setTabs(rest);
    if (id === active) setActive(rest[Math.max(0, idx - 1)].id);
  };

  const isFav = os.favorites.some((f) => f.url === url);
  const copySelection = async () => {
    const text = selectedText();
    if (!text.trim()) {
      os.notify('Nada selecionado', 'Arraste o mouse sobre o texto da página para selecionar um trecho.');
      return;
    }
    const copiedToSystem = await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (!copiedToSystem) os.notify('Texto guardado', 'Use o botão Colar no Mensageiro ou no Editor de Texto.');
  };
  const onLink = (e: React.MouseEvent, u: string) => {
    e.preventDefault();
    navigate(u, e.ctrlKey || e.metaKey || e.button === 1);
  };

  const currentTone = findPage(url)?.tone;
  const linkColor = currentTone === 'sketchy' ? 'text-yellow-300' : 'text-blue-700';

  const Link = ({ u, children, className = '' }: { u: string; children: React.ReactNode; className?: string }) => (
    <a href={u} onClick={(e) => onLink(e, u)} onAuxClick={(e) => onLink(e, u)} className={`${linkColor} hover:underline cursor-pointer transition ${className}`}>
      {children}
    </a>
  );



  const renderContent = () => {
    if (url === SEARCH_HOME)
      return (
        <div className="flex flex-col items-center pt-16 px-4 gap-6">
          <div className="text-5xl font-bold tracking-tight">
            <span className="text-blue-600">Higashi</span> <span className="text-slate-600">Search</span>
          </div>
          <SearchForm initial="" big onSearch={(q) => navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent(q)}`)} />
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            {['previsão do tempo', 'calendário escolar', 'restauração meiji', 'biblioteca municipal', 'sistema nervoso', 'notícias'].map((s) => (
              <button key={s} onClick={() => navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent(s)}`)} className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition">
                {s}
              </button>
            ))}
            {os.lore.exam.sent && (
              <button
                onClick={() => {
                  const file = os.files.find((f) => f.name === EXAM_PASS_FILE_NAME && isAlive(os.files, f.id));
                  if (file) os.openFile(file.id);
                  else os.download({ name: EXAM_PASS_FILE_NAME, type: 'txt', content: EXAM_PASS_FILE_CONTENT, size: '1 KB' }, 'higashi://mensageiro/oculto');
                  setDlPanel(true);
                }}
                className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition"
                title="Enviado por Usuário Oculto — mensageiro da escola"
              >
                <Ico name="download" size={11} /> arquivo_para_Gabriela.txt
              </button>
            )}
            {(os.chats.find((c) => c.contactId === 'oculto')?.stage ?? 0) >= 1 && (
              <button
                onClick={() => navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent('Yamāntaka o destruidor da morte')}`)}
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200 flex items-center gap-1.5 transition"
                title="Sugestão registrada na sua conta"
              >
                <Ico name="search" size={11} /> Yamāntaka, o destruidor da morte
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {os.favorites.slice(0, 8).map((f) => (
              <Link key={f.url} u={f.url} className="!no-underline">
                <div className="w-28 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-center text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="mx-auto w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-1">{f.title[0]}</div>
                  <div className="truncate">{f.title}</div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-8">Rede escolar HIGASHI-SCHOOL • Conteúdo filtrado para uso educacional</p>
        </div>
      );

    if (url.startsWith(SEARCH_HOME + '/search')) {
      const q = decodeURIComponent(url.split('q=')[1] ?? '');
      const results = searchPages(q);
      return (
        <div>
          <div className="flex items-center gap-4 px-6 py-3 border-b">
            <button onClick={() => navigate(SEARCH_HOME)} className="text-xl font-bold"><span className="text-blue-600">Higashi</span> <span className="text-slate-600">Search</span></button>
            <SearchForm initial={q} key={q} big={false} onSearch={(nq) => navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent(nq)}`)} />
          </div>
          <div className="px-6 py-4 max-w-2xl">
            <p className="text-xs text-slate-500 mb-4">Aproximadamente {results.length} resultado(s) para "{q}"</p>
            {results.length === 0 && (
              <div className="text-sm text-slate-700 space-y-2">
                <p>Nenhum resultado encontrado para <b>{q}</b>.</p>
                <p className="text-slate-500">Sugestões: verifique a ortografia, use palavras mais gerais ou menos palavras.</p>
              </div>
            )}
            {results.map(({ page }) => (
              <div key={page.id} className="mb-5">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-[9px] flex items-center justify-center font-bold">{page.site[0]}</span>
                  {page.site} • <span className="text-green-700">{page.url.replace('https://', '')}</span>
                </div>
                <Link u={page.url} className="text-lg !text-blue-800 visited:text-purple-800">{page.title}</Link>
                <p className="text-sm text-slate-600 leading-snug"><span className="text-slate-400">{fmtDate(page.date + 'T12:00', false)} — </span>{snippet(page.body, q)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (url === 'higashi://historico')
      return (
        <div className="p-6 max-w-3xl">
          <div className="flex items-center mb-4"><h1 className="text-xl font-semibold">Histórico</h1><button onClick={os.clearHistory} className="ml-auto text-xs px-3 py-1 border rounded hover:bg-slate-50">Limpar histórico</button></div>
          {os.browserHistory.length === 0 && <p className="text-sm text-slate-500">O histórico está vazio.</p>}
          {os.browserHistory.map((h, k) => (
            <div key={k} className="flex gap-3 py-1.5 border-b text-sm">
              <span className="text-slate-400 w-28 shrink-0 text-xs pt-0.5">{fmtDate(h.date)}</span>
              <Link u={h.url} className="truncate">{h.title}</Link>
              <span className="text-xs text-slate-400 truncate ml-auto hidden md:inline">{h.url}</span>
            </div>
          ))}
        </div>
      );
    if (url === 'higashi://favoritos')
      return (
        <div className="p-6 max-w-3xl">
          <h1 className="text-xl font-semibold mb-4">Favoritos</h1>
          {os.favorites.map((f) => (
            <div key={f.url} className="flex items-center gap-3 py-1.5 border-b text-sm">
              <Ico name="star" size={14} fill className="text-amber-400" />
              <Link u={f.url}>{f.title}</Link>
              <span className="text-xs text-slate-400 truncate">{f.url}</span>
              <button onClick={() => os.toggleFavorite(f.url, f.title)} className="ml-auto text-xs text-red-600 hover:underline">Remover</button>
            </div>
          ))}
        </div>
      );
    if (url === 'higashi://downloads') return <div className="p-6 max-w-3xl"><h1 className="text-xl font-semibold mb-4">Downloads</h1><DownloadList /></div>;

    const page = findPage(url);
    if (!page)
      return (
        <div className="flex flex-col items-center pt-20 gap-3 text-center px-6">
          <div className="text-6xl">🌐</div>
          <h1 className="text-xl font-semibold">Não é possível acessar este site</h1>
          <p className="text-sm text-slate-500 max-w-md">O endereço <b>{url.replace('https://', '')}</b> não foi encontrado ou está bloqueado pela rede escolar HIGASHI-SCHOOL.</p>
          <button onClick={() => navigate(`${SEARCH_HOME}/search?q=${encodeURIComponent(url.replace(/https?:\/\/(www\.)?/, '').split(/[./]/)[0])}`)} className="text-sm px-4 py-1.5 rounded bg-blue-600 text-white">Pesquisar no Higashi Search</button>
        </div>
      );

    const sketchy = page.tone === 'sketchy';
    return (
      <article className={sketchy ? 'bg-[#0b0710]' : ''}>
        <div
          className={`px-6 py-3 flex items-center gap-3 ${
            sketchy
              ? 'bg-gradient-to-r from-purple-900 via-fuchsia-900 to-purple-900 text-fuchsia-100'
              : page.sensitive
                ? 'bg-stone-800 text-stone-100'
                : 'bg-slate-800 text-white'
          }`}
        >
          <span className="w-8 h-8 rounded bg-white/15 flex items-center justify-center font-bold">{page.site[0]}</span>
          <span className="font-semibold">{page.site}</span>
          <span className="ml-auto text-xs opacity-70">{page.category}</span>
        </div>

        {sketchy && (
          <>
            <div className="overflow-hidden bg-yellow-300 text-purple-950 text-[11px] font-bold py-1 whitespace-nowrap">
              <div className="inline-block animate-[adScroll_22s_linear_infinite]">
                {'★ NÃO COMPARTILHE ISTO NA REDE DA ESCOLA ★ ELES LEEM O ÍNDICE ★ YAMĀNTAKA RESPONDE ★ NÃO COMPARTILHE ISTO NA REDE DA ESCOLA ★ ELES LEEM O ÍNDICE ★ YAMĀNTAKA RESPONDE ★ '}
              </div>
            </div>
            <div className="mx-6 mt-4 mb-0 text-[11px] bg-white/5 ring-1 ring-fuchsia-400/25 text-fuchsia-100/80 rounded p-2 leading-relaxed">
              Este site não é revisado. As informações a seguir contradizem os dicionários de sânscrito e os centros de Dharma. Comentários de leitores na página pedem correções.
            </div>
          </>
        )}

        {page.sensitive && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11.5px] flex items-center gap-2">
            <Ico name="alert" size={14} className="shrink-0" />
            Página fora do índice público da escola — só existe por link direto. Registrada como arquivo de patrimônio, não como site oficial.
          </div>
        )}
        <div className={`px-6 py-6 max-w-3xl ${sketchy ? 'text-fuchsia-50' : ''}`}>
          <h1 className={`text-2xl font-bold leading-tight ${sketchy ? 'text-yellow-300 uppercase tracking-tight [text-shadow:0_0_18px_rgba(250,204,21,.45)]' : 'text-slate-900'}`}>{page.title}</h1>
          <p className={`text-xs mt-1 mb-5 ${sketchy ? 'text-fuchsia-300/70' : 'text-slate-500'}`}>Publicado em {fmtDate(page.date + 'T12:00', false)} • {page.category}{sketchy && ' • última revisão: nunca'}</p>
          <div className={`space-y-3 text-[15px] leading-relaxed ${sketchy ? 'text-fuchsia-50/90' : 'text-slate-800'}`}>
            {page.body.split('\n\n').map((p, k) => <p key={k} className="whitespace-pre-line">{p}</p>)}
          </div>
          {page.downloads && page.downloads.length > 0 && (
            <div className="mt-6 p-4 rounded-lg bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs font-semibold text-slate-500 mb-2">ARQUIVOS PARA DOWNLOAD</div>
              {page.downloads.map((d) => (
                <div key={d.name} className="flex items-center gap-3 py-1 text-sm">
                  <Ico name="download" size={15} className="text-slate-500" />
                  <span>{d.name}</span>
                  <span className="text-xs text-slate-400">{d.size}</span>
                  <button onClick={() => { os.download(d, page.url); setDlPanel(true); }} className="ml-auto text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Baixar</button>
                </div>
              ))}
            </div>
          )}
          {page.links.length > 0 && (
            <div className={`mt-6 border-t pt-4 ${sketchy ? 'border-fuchsia-400/20' : ''}`}>
              <div className={`text-xs font-semibold mb-2 ${sketchy ? 'text-fuchsia-300/70' : 'text-slate-500'}`}>LINKS</div>
              <ul className="space-y-1 text-sm">
                {page.links.map((l) => (
                  <li key={l.url} className={`flex items-center gap-2 ${sketchy ? 'text-fuchsia-100' : ''}`}>
                    <Ico name="forward" size={12} className="text-slate-400" />
                    <Link u={l.url}>{l.label}</Link>
                    <button title="Abrir em nova aba" onClick={() => navigate(l.url, true)} className="text-slate-400 hover:text-slate-700"><Ico name="external" size={12} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    );
  };

  const DownloadList = () => (
    <div className="space-y-1">
      {os.downloads.length === 0 && <p className="text-sm text-slate-500 p-2">Nenhum download nesta sessão.</p>}
      {os.downloads.map((d) => {
        const alive = isAlive(os.files, d.fileId);
        return (
          <div key={d.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 text-sm">
            <Ico name="download" size={15} className="text-slate-500" />
            <div className="min-w-0 flex-1">
              <div className={`truncate ${alive ? '' : 'line-through text-slate-400'}`}>{d.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{alive ? 'Concluído' : 'Arquivo movido ou excluído'} • {fmtDate(d.date)}</div>
            </div>
            {alive && <button onClick={() => os.openFile(d.fileId)} className="text-xs px-2 py-0.5 rounded border hover:bg-white">Abrir</button>}
            <button onClick={() => os.openApp('explorer', { folderId: os.files.find((f) => f.id === d.fileId)?.parentId ?? DOWNLOADS_ID })} className="text-xs px-2 py-0.5 rounded border hover:bg-white">Pasta</button>
            <button onClick={() => os.removeDownload(d.id)} className="p-1 text-slate-400 hover:text-slate-700" title="Remover da lista"><Ico name="x" size={12} /></button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full text-sm bg-white relative"
      onKeyDown={(e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key.toLowerCase() === 't') { e.preventDefault(); navigate(SEARCH_HOME, true); }
        if (ctrl && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(tab.id); }
        if (ctrl && e.key.toLowerCase() === 'l') { e.preventDefault(); addrRef.current?.select(); }
        if (ctrl && e.key.toLowerCase() === 'h') { e.preventDefault(); navigate('higashi://historico'); }
        if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); os.toggleFavorite(url, resolveTitle(url)); }
        if (e.key === 'F5') { e.preventDefault(); load(); }
        if (e.altKey && e.key === 'ArrowLeft') go(-1);
        if (e.altKey && e.key === 'ArrowRight') go(1);
      }}
    >
      {/* tabs */}
      <div className="flex items-end gap-0.5 px-1.5 pt-1.5 bg-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setActive(t.id)} onAuxClick={(e) => e.button === 1 && closeTab(t.id)} className={`group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-t-md max-w-[200px] min-w-[110px] cursor-default text-xs ${t.id === active ? 'bg-white shadow-sm' : 'bg-slate-300/60 hover:bg-slate-300'}`}>
            <span className="truncate flex-1">{resolveTitle(t.stack[t.i])}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="p-0.5 rounded hover:bg-slate-200"><Ico name="x" size={11} /></button>
          </div>
        ))}
        <button onClick={() => navigate(SEARCH_HOME, true)} className="p-1.5 mb-0.5 rounded hover:bg-slate-300" title="Nova aba (Ctrl+T)"><Ico name="plus" size={14} /></button>
      </div>
      {/* nav */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b">
        <button disabled={tab.i === 0} onClick={() => go(-1)} className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30" title="Voltar"><Ico name="back" /></button>
        <button disabled={tab.i >= tab.stack.length - 1} onClick={() => go(1)} className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30" title="Avançar"><Ico name="forward" /></button>
        <button onClick={load} className="p-1.5 rounded-full hover:bg-slate-100" title="Atualizar (F5)"><Ico name="refresh" size={15} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => navigate(SEARCH_HOME)} className="p-1.5 rounded-full hover:bg-slate-100" title="Página inicial"><Ico name="home" size={15} /></button>
        <form className="flex-1 flex items-center bg-slate-100 rounded-full px-3 py-1 focus-within:ring-2 focus-within:ring-blue-300 focus-within:bg-white" onSubmit={(e) => { e.preventDefault(); submitAddress(address); }}>
          {url.startsWith('https') && <Ico name="lock" size={12} className="text-slate-400 mr-2" />}
          <input ref={addrRef} value={address} onChange={(e) => setAddress(e.target.value)} onFocus={(e) => e.target.select()} className="flex-1 bg-transparent outline-none text-[13px]" />
          <button type="button" onClick={() => os.toggleFavorite(url, resolveTitle(url))} title="Favoritar (Ctrl+D)">
            <Ico name="star" size={15} fill={isFav} className={isFav ? 'text-amber-400' : 'text-slate-400'} />
          </button>
        </form>
        <button onClick={() => setDlPanel(!dlPanel)} className={`p-1.5 rounded-full hover:bg-slate-100 relative ${dlPanel ? 'bg-slate-100' : ''}`} title="Downloads">
          <Ico name="download" size={15} />
          {os.downloads.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{os.downloads.length}</span>}
        </button>
        <button onClick={() => navigate('higashi://historico')} className="p-1.5 rounded-full hover:bg-slate-100" title="Histórico (Ctrl+H)"><Ico name="history" size={15} /></button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={copySelection}
          className="p-1.5 rounded-full hover:bg-slate-100 flex items-center gap-1 text-xs"
          title="Selecione um trecho da página e copie (Ctrl+C também funciona)"
        >
          <Ico name={copied ? 'check' : 'copy'} size={15} />
          <span className="hidden lg:inline">{copied ? 'Copiado' : 'Copiar texto'}</span>
        </button>
      </div>
      {/* favorites bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b text-xs overflow-x-auto">
        {os.favorites.map((f) => (
          <button key={f.url} onClick={(e) => navigate(f.url, e.ctrlKey)} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 whitespace-nowrap">
            <Ico name="star" size={11} fill className="text-amber-400" /> {f.title}
          </button>
        ))}
        <button onClick={() => navigate('higashi://favoritos')} className="ml-auto px-2 py-0.5 rounded hover:bg-slate-100 text-slate-500 whitespace-nowrap">Gerenciar favoritos</button>
      </div>
      <div className="os-readable flex-1 overflow-auto relative">
        {loading && <div className="absolute top-0 left-0 h-0.5 bg-blue-500 animate-[load_.3s_ease-out_forwards] z-10" />}
        <div className={loading ? 'opacity-60' : ''}>{renderContent()}</div>
      </div>
      {dlPanel && (
        <div className="absolute right-2 top-[92px] w-80 bg-white shadow-xl ring-1 ring-black/10 rounded-lg p-2 z-20">
          <div className="flex items-center px-2 py-1 mb-1">
            <span className="font-semibold text-sm">Downloads</span>
            <button onClick={() => navigate('higashi://downloads')} className="ml-auto text-xs text-blue-700 hover:underline">Ver todos</button>
            <button onClick={() => setDlPanel(false)} className="ml-2 p-1 rounded hover:bg-slate-100"><Ico name="x" size={12} /></button>
          </div>
          <div className="max-h-64 overflow-auto"><DownloadList /></div>
        </div>
      )}
    </div>
  );
}
