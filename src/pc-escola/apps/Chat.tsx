import { useEffect, useRef, useState } from 'react';
import { useOS, getTaskStatus } from '../os/store';
import type { ChatMessage, ChatThread, WindowState } from '../os/types';
import { AppIcon, Ico } from '../components/Icons';
import { fileSize, fmtSize, normalize } from '../os/utils';
import { EXAM_QUESTIONS } from '../data/exam';
import { copyText, readCopiedText } from '../os/clipboard';

const ACTIVE_TOTAL = EXAM_QUESTIONS.length;

const AVATAR: Record<string, { bg: string; label: string }> = {
  emi: { bg: 'from-pink-400 to-rose-500', label: 'E' },
  mori: { bg: 'from-indigo-400 to-indigo-600', label: 'M' },
  oculto: { bg: 'from-zinc-600 to-black', label: '?' },
};

const STATUS_DOT: Record<ChatThread['contactStatus'], string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-zinc-400',
};
const STATUS_LABEL: Record<ChatThread['contactStatus'], string> = { online: 'Disponível', away: 'Ausente', offline: 'Offline' };

export default function Chat(_: { win: WindowState }) {
  const os = useOS();
  const chats = os.chats;
  const lore = os.lore;
  const task = getTaskStatus(os);

  const [activeId, setActiveId] = useState<string>('emi');
  const [input, setInput] = useState('');
  const empty: ChatThread = { contactId: 'emi', contactName: '—', contactStatus: 'offline', messages: [], typing: false, unlocked: false, unread: 0, stage: 0 };
  const active: ChatThread = chats.find((c) => c.contactId === activeId) ?? chats[0] ?? empty;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [active.messages.length, active.typing, activeId]);

  // Reading a thread clears its badge.
  useEffect(() => {
    if (active.unread > 0) os.updateChat(active.contactId, { unread: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active.messages.length]);

  const isStranger = active.contactId === 'oculto';
  const exam = lore.exam;
  const trail = [
    { label: 'Pesquisou Yamāntaka', done: lore.yamantakaSearched },
    { label: 'Abriu o blog duvidoso', done: lore.sawBlog },
    { label: 'Leu o fórum / a correção', done: lore.sawForum },
    { label: 'Achou o inventário da mesa 17', done: lore.sawArchive },
    { label: 'Leu o arquivo de 2003', done: lore.readNotebook },
    { label: 'Questionário (sete de dez)', done: exam.done && exam.score >= 7 },
    { label: 'Arquivo ele chegou', done: exam.sent },
  ];

  const send = () => {
    const text = input.trim();
    if (!text || !active.unlocked) return;
    os.sendChatMessage(active.contactId, text);
    setInput('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const paste = async () => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    const text = await readCopiedText();
    if (!text) {
      os.notify('Área de transferência vazia', 'Selecione um trecho no Navegador ou no chat e pressione Ctrl+C.');
      return;
    }
    setInput((current) => current.slice(0, start) + text + current.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const openNote = () => {
    const f = os.files.find((x) => x.id === 'sh3' || x.name === 'arquivo_ALUNO_17_2003.txt');
    if (f) {
      os.openFile(f.id);
      if (!lore.readNotebook) os.markLore({ readNotebook: true });
    } else os.notify('Arquivo indisponível', 'O arquivo antigo não está mais na pasta Compartilhados.');
  };

  const downloadDeliveredFile = () => {
    const thread = chats.find((c) => c.contactId === 'oculto');
    if (thread?.fileId) {
      os.openFile(thread.fileId);
      return;
    }
    os.notify('Arquivo perdido', 'O arquivo do Oculto sumiu da pasta Compartilhados.');
  };

  const deliver = active.contactId === 'oculto' && active.fileSent && active.fileId;
  const deliveredFile = deliver ? os.files.find((f) => f.id === active.fileId) : undefined;

  return (
    <div className={`flex h-full text-sm select-none relative overflow-hidden ${isStranger ? 'bg-[#12161c]' : 'bg-white'}`}>
      {isStranger && <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:repeating-linear-gradient(0deg,#fff,#fff_1px,transparent_1px,transparent_3px)]" />}

      {/* ---------- contact list ---------- */}
      <aside className={`w-48 shrink-0 border-r flex flex-col ${isStranger ? 'bg-zinc-900 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`px-3 py-2 border-b text-[10px] font-bold tracking-[.14em] ${isStranger ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-500'}`}>CONTATOS</div>
        <div className="flex-1 overflow-auto">
          {chats.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const selected = c.contactId === activeId;
            return (
              <button
                key={c.contactId}
                onClick={() => setActiveId(c.contactId)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-left border-b transition-colors ${
                  isStranger ? 'border-white/5' : 'border-slate-200/70'
                } ${selected ? (isStranger ? 'bg-white/10' : 'bg-blue-100') : isStranger ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
              >
                <span className="relative shrink-0">
                  <span className={`w-9 h-9 rounded-md bg-gradient-to-br ${AVATAR[c.contactId]?.bg ?? 'bg-slate-400'} text-white grid place-items-center font-bold shadow ring-1 ${isStranger ? 'ring-white/20' : 'ring-black/10'} ${!c.unlocked ? 'grayscale opacity-60' : ''}`}>
                    {!c.unlocked ? <Ico name="lock" size={14} /> : AVATAR[c.contactId]?.label ?? '?'}
                  </span>
                  <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ${isStranger ? 'ring-zinc-900' : 'ring-slate-50'} ${STATUS_DOT[c.contactStatus]}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold truncate ${isStranger ? 'text-white/90' : 'text-slate-800'}`}>
                    <span className="truncate">{c.contactName}</span>
                    {c.unread > 0 && <span className="ml-auto shrink-0 min-w-4 px-1 h-4 grid place-items-center rounded-full bg-rose-600 text-white text-[10px] font-bold">{c.unread}</span>}
                  </span>
                  <span className={`block text-[11px] truncate ${isStranger ? 'text-white/40' : 'text-slate-500'} ${c.typing ? 'text-emerald-500 font-medium' : ''}`}>
                    {c.typing ? 'digitando…' : c.unlocked ? (last ? `${last.sender === 'me' ? 'Você: ' : ''}${last.text.split('\n')[0]}` : 'Sem mensagens') : 'Bloqueado'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className={`px-3 py-2 border-t text-[10px] leading-snug ${isStranger ? 'border-white/10 text-white/35' : 'border-slate-200 text-slate-400'}`}>
          Sessão: {os.currentUser}
          <br />
          {task.completed ? 'Atividade concluída — uso livre' : 'Aula em andamento'}
        </div>
      </aside>

      {/* ---------- thread ---------- */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className={`h-[52px] shrink-0 px-3 flex items-center gap-2.5 border-b ${isStranger ? 'bg-zinc-900 border-white/10 text-white' : 'bg-gradient-to-b from-white to-slate-50 border-slate-200'}`}>
          <span className={`w-9 h-9 rounded-md bg-gradient-to-br ${AVATAR[active.contactId]?.bg ?? 'bg-slate-400'} grid place-items-center text-white font-bold shadow ring-1 ${isStranger ? 'ring-white/20' : 'ring-black/10'}`}>
            {AVATAR[active.contactId]?.label ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold truncate leading-tight">{active.contactName}</div>
            <div className={`text-[11px] flex items-center gap-1.5 ${isStranger ? 'text-white/45' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[active.contactStatus]}`} />
              {STATUS_LABEL[active.contactStatus]}
              {isStranger && active.unlocked && <span className="truncate">· conta sem responsável de contato</span>}
            </div>
          </div>
          {isStranger && active.unlocked && (
            <span className="hidden md:flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-white/5 text-white/50 ring-1 ring-white/10">
              <Ico name="eye" size={11} /> Etapa {Math.max(1, active.stage)} de 4
            </span>
          )}
        </header>

        {/* Exam strip (shown only when the questionnaire is live) */}
        {isStranger && exam.started && !exam.done && (
          <div className="px-3 py-1.5 text-[11px] flex items-center gap-2 bg-emerald-950/60 border-b border-emerald-400/20 text-emerald-100">
            <Ico name="clipboard" size={13} className="text-emerald-300 shrink-0" />
            <span>
              Questionário do Oculto — pergunta {Math.min(exam.index + 1, ACTIVE_TOTAL)}/{ACTIVE_TOTAL}
            </span>
            <span className="ml-auto font-semibold">certas: {exam.score} · erros: {exam.answers.filter((a) => !a).length}</span>
          </div>
        )}
        {isStranger && exam.done && (
          <div className={`px-3 py-1.5 text-[11px] flex items-center gap-2 border-b ${exam.score >= 7 ? 'bg-emerald-950/60 border-emerald-400/20 text-emerald-100' : 'bg-rose-950/60 border-rose-400/20 text-rose-100'}`}>
            <Ico name="check" size={13} className="shrink-0" />
            <span>Questionário concluído — {exam.score}/{ACTIVE_TOTAL}</span>
            {exam.sent && <span className="ml-auto">o arquivo foi entregue</span>}
          </div>
        )}
        {isStranger && exam.done && exam.score < 7 && (
          <div className="px-3 py-2 bg-zinc-900 border-b border-white/10 flex items-center justify-between gap-3 text-[11px] text-white/55">
            <span>Você pode tentar novamente. Nenhum arquivo ou mensagem será apagado.</span>
            <button onClick={() => os.startExam()} className="shrink-0 px-2.5 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white transition">Refazer perguntas</button>
          </div>
        )}

        <div className={`os-readable flex-1 min-h-0 overflow-auto px-4 py-3 space-y-2.5 ${isStranger ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
          {!active.unlocked ? (
            <LockedScreen completed={task.completed} />
          ) : active.messages.length === 0 ? (
            <p className={`text-center text-xs mt-14 ${isStranger ? 'text-white/30' : 'text-slate-400'}`}>Diga algo. Esta conta responde.</p>
          ) : (
            active.messages.map((m) => <Bubble key={m.id} msg={m} dark={isStranger} contact={active.contactId} />)
          )}
          {deliver && (
            <div className="flex justify-start">
              <button
                onClick={downloadDeliveredFile}
                className="group max-w-[76%] text-left rounded-2xl rounded-bl-sm bg-white/5 ring-1 ring-sky-400/25 px-3.5 py-2.5 hover:bg-white/10 transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white grid place-items-center shadow-md shrink-0">
                    <Ico name="download" size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-white truncate">arquivo_para_Gabriela.txt</span>
                    <span className="block text-[10.5px] text-sky-200/70">{deliveredFile ? fmtSize(fileSize(deliveredFile)) : 'TXT'} · entregue pelo Mensageiro · use o Editor de Texto</span>
                  </span>
                </div>
                <span className="mt-1 block text-[10px] text-sky-300 group-hover:underline">Clique para abrir o arquivo recebido</span>
              </button>
            </div>
          )}
          {active.typing && <TypingBubble dark={isStranger} contact={active.contactId} />}
          <div ref={bottomRef} />
        </div>

        {isStranger && active.unlocked && (
          <div className="px-3 py-2 border-t border-white/10 bg-zinc-900 flex flex-wrap gap-1.5">
            {trail.map((s) => (
              <span key={s.label} className={`text-[10px] px-2 py-0.5 rounded-full ring-1 ${s.done ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30 line-through decoration-emerald-500/50' : 'bg-white/5 text-white/35 ring-white/10'}`}>
                {s.done ? '✔ ' : '· '}
                {s.label}
              </span>
            ))}
            {lore.sawArchive && (
              <button onClick={openNote} className="ml-auto text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 ring-1 ring-sky-400/30 transition">
                Abrir o arquivo de 2003 →
              </button>
            )}
          </div>
        )}

        <div className={`shrink-0 px-3 py-2.5 border-t ${isStranger ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={paste}
              className={`p-2 rounded hover:bg-slate-500/20 transition ${isStranger ? 'text-white/60' : 'text-slate-500'}`}
              title="Colar texto copiado (Ctrl+V)"
              aria-label="Colar texto copiado"
            ><Ico name="paste" size={17} /></button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={!active.unlocked}
              rows={2}
              aria-label={`Mensagem para ${active.contactName}`}
              placeholder={active.unlocked
                ? isStranger && exam.started && !exam.done
                  ? 'Sua resposta: uma palavra ou um trecho copiado…'
                  : `Mensagem para ${active.contactName}…`
                : 'Bloqueado — a aula ainda não terminou para você.'}
              className={`flex-1 min-w-0 min-h-[42px] max-h-24 resize-y rounded-xl px-3.5 py-2 text-[13px] outline-none border transition select-text ${
                isStranger
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:ring-2 focus:ring-sky-500/30'
                  : 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-300'
              } disabled:opacity-50`}
            />
            <button
              onClick={send}
              disabled={!active.unlocked || !input.trim()}
              className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${
                isStranger ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,.35)]' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span className="flex items-center gap-1.5"><Ico name="send" size={13} /> Enviar</span>
            </button>
          </div>
          <div className={`pt-1.5 text-[10px] ${isStranger ? 'text-white/35' : 'text-slate-400'}`}>Arraste para selecionar texto nas mensagens ou no Navegador. Ctrl+C copia · Ctrl+V cola · Enter envia.</div>
        </div>
      </main>
    </div>
  );
}

function Bubble({ msg, dark, contact }: { msg: ChatMessage; dark?: boolean; contact: string }) {
  const mine = msg.sender === 'me';
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copyMessage = async () => {
    const selection = window.getSelection();
    const withinBubble = selection?.anchorNode && selection.focusNode &&
      contentRef.current?.contains(selection.anchorNode) && contentRef.current?.contains(selection.focusNode);
    const text = withinBubble ? selection?.toString() || msg.text : msg.text;
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} animate-[msgIn_.18s_ease-out]`}>
      {!mine && (
        <span className={`w-7 h-7 rounded-md shrink-0 bg-gradient-to-br ${AVATAR[contact]?.bg ?? 'bg-slate-400'} text-white grid place-items-center text-[11px] font-bold shadow ring-1 ${dark ? 'ring-white/15' : 'ring-black/10'}`}>
          {AVATAR[contact]?.label ?? '?'}
        </span>
      )}
      <div
        className={`max-w-[74%] rounded-2xl px-3.5 py-2 text-[13px] leading-[1.5] shadow-sm ${
          mine
            ? dark
              ? 'bg-sky-600 text-white rounded-br-sm'
              : 'bg-blue-600 text-white rounded-br-sm'
            : dark
              ? 'bg-[#1c2530] text-slate-200 rounded-bl-sm ring-1 ring-white/10'
              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        }`}
      >
        <div ref={contentRef} className="os-readable whitespace-pre-wrap break-words cursor-text">{msg.text}</div>
        {msg.timestamp && <div className={`text-[10px] mt-1 text-right ${mine ? 'text-white/60' : dark ? 'text-white/30' : 'text-slate-400'}`}>{msg.timestamp}{mine && ' · entregue'}</div>}
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={copyMessage}
        title="Copiar mensagem ou trecho selecionado"
        aria-label={copied ? 'Texto copiado' : 'Copiar mensagem ou trecho selecionado'}
        className={`shrink-0 p-1.5 rounded-md opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition ${dark ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200'}`}
      >
        <Ico name={copied ? 'check' : 'copy'} size={14} />
      </button>
    </div>
  );
}

function TypingBubble({ dark, contact }: { dark?: boolean; contact: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${AVATAR[contact]?.bg ?? 'bg-slate-400'} text-white grid place-items-center text-[11px] font-bold shadow ring-1 ${dark ? 'ring-white/15' : 'ring-black/10'}`}>
        {AVATAR[contact]?.label ?? '?'}
      </span>
      <span className={`px-4 py-2.5 rounded-2xl rounded-bl-sm inline-flex items-center gap-1 ${dark ? 'bg-[#1c2530] ring-1 ring-white/10' : 'bg-white border border-slate-200'}`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 140}ms`, animationDuration: '900ms' }} />
        ))}
      </span>
    </div>
  );
}

function LockedScreen({ completed }: { completed: boolean }) {
  return (
    <div className="h-full grid place-items-center text-center px-6">
      <div className="max-w-xs">
        <div className="mx-auto w-14 h-14 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center text-white/40 mb-3">
          <Ico name="lock" size={26} />
        </div>
        <p className="text-white/80 font-semibold text-[13px]">Esta conversa está bloqueada</p>
        <p className="text-[11.5px] text-white/40 mt-1.5 leading-relaxed">
          O contato aparece na sua lista desde que você ligou o computador, mas a conversa só abre quando a atividade da aula é aprovada.
          {completed ? ' Você já foi aprovada — espere um instante.' : ' Conclua a Atividade 01 no aplicativo "Atividade da Aula".'}
        </p>
      </div>
    </div>
  );
}

/** Used by the search index elsewhere; kept here so the messenger can highlight
 *  the words the stranger asked for without duplicating the term list. */
export const STRANGER_TERMS = ['yamantaka', 'destruidor da morte', 'daiitoku', 'yamari', 'vajrabhairava'];
export const matchesStrangerTerms = (q: string) => {
  const n = normalize(q);
  return STRANGER_TERMS.some((t) => n.includes(normalize(t)));
};

export function ChatIcon({ size = 22 }: { size?: number }) {
  return <AppIcon app="chat" size={size} />;
}
