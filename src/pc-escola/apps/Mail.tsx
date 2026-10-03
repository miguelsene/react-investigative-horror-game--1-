import { useMemo, useState } from 'react';
import { useOS } from '../os/store';
import type { Email, MailFolder } from '../os/types';
import { Ico } from '../components/Icons';
import { Btn, Modal } from '../components/Dialogs';
import { contacts, MY_ADDR } from '../data/emails';
import { fmtDate, normalize, sceneISO, uid } from '../os/utils';

const FOLDERS: { id: MailFolder; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Caixa de entrada', icon: 'mail' },
  { id: 'sent', label: 'Enviados', icon: 'send' },
  { id: 'drafts', label: 'Rascunhos', icon: 'edit' },
  { id: 'archive', label: 'Arquivo', icon: 'archive' },
  { id: 'trash', label: 'Lixeira', icon: 'trash' },
];

type Draft = { id: string; to: string; subject: string; body: string; replyTo?: string };

export default function Mail() {
  const os = useOS();
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [selId, setSelId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [compose, setCompose] = useState<Draft | null>(null);
  const [msg, setMsg] = useState('');
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const list = useMemo(() => {
    const nq = normalize(q);
    return os.emails
      .filter((e) => (nq ? e.folder !== 'trash' || folder === 'trash' : e.folder === folder))
      .filter((e) => !nq || normalize(`${e.subject} ${e.from} ${e.body} ${e.to}`).includes(nq))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [os.emails, folder, q]);
  const sel = os.emails.find((e) => e.id === selId) ?? null;

  const open = (e: Email) => {
    if (e.folder === 'drafts') {
      setCompose({ id: e.id, to: e.to, subject: e.subject, body: e.body, replyTo: e.replyTo });
      return;
    }
    setSelId(e.id);
    if (!e.read) os.updateEmail(e.id, { read: true });
  };

  const reply = (e: Email) => {
    const quoted = e.body.split('\n').map((l) => '> ' + l).join('\n');
    setCompose({ id: uid(), to: e.fromAddr, subject: e.subject.startsWith('Re:') ? e.subject : `Re: ${e.subject}`, body: `\n\n— Em ${fmtDate(e.date)}, ${e.from} escreveu:\n${quoted}`, replyTo: e.id });
  };

  const saveDraft = (d: Draft) => {
    os.addEmail({ id: d.id, folder: 'drafts', from: 'Gabriela', fromAddr: MY_ADDR, to: d.to, subject: d.subject || '(sem assunto)', body: d.body, date: sceneISO(), read: true, canReply: false, replyTo: d.replyTo });
    setCompose(null);
    flash('Rascunho salvo.');
  };

  const send = (d: Draft) => {
    if (!d.to.trim()) return flash('Informe o destinatário.');
    os.addEmail({ id: d.id, folder: 'sent', from: 'Gabriela', fromAddr: MY_ADDR, to: d.to, subject: d.subject || '(sem assunto)', body: d.body, date: sceneISO(), read: true, canReply: false });
    setCompose(null);
    os.notify('Mensagem enviada', `Para: ${d.to}`);

    if (d.to.includes('emi.takahashi') && !os.emails.some((e) => e.id === 'emi-auto')) {
      setTimeout(() => {
        useOS.getState().addEmail({
          id: 'emi-auto', folder: 'inbox', from: 'Emi Takahashi', fromAddr: 'emi.takahashi@higashi-school.jp', to: MY_ADDR,
          subject: `Re: ${d.subject.replace(/^Re:\s*/, '')}`, date: sceneISO(), read: false, canReply: true,
          body: 'obrigadaaa 🙏\nte vejo no intervalo. vou trazer chocolate de novo, já que você não sabe comemorar sozinha.\n\nEmi',
        });
        useOS.getState().notify('Nova mensagem', 'Emi Takahashi — Re: ' + d.subject.replace(/^Re:\s*/, ''));
      }, 9000);
    }
    if (d.to.includes('mori.informatica') && !os.emails.some((e) => e.id === 'mori-auto')) {
      setTimeout(() => {
        useOS.getState().addEmail({
          id: 'mori-auto', folder: 'inbox', from: 'Prof. Mori (Informática)', fromAddr: 'mori.informatica@higashi-school.jp', to: MY_ADDR,
          subject: `Re: ${d.subject.replace(/^Re:\s*/, '')}`, date: sceneISO(), read: false, canReply: false,
          body: 'Recebido, Gabriela.\nA atividade já está lançada. Use o restante da aula para os outros trabalhos.\n\nProf. Mori',
        });
        useOS.getState().notify('Nova mensagem', 'Prof. Mori — resposta');
      }, 12000);
    }
    // The anonymous account is not a mailbox. It answers in the messenger.
    if (d.to.includes('oculto')) {
      setTimeout(() => {
        useOS.getState().addEmail({
          id: 'mailer-daemon', folder: 'inbox', from: 'Servidor de Correio', fromAddr: 'mailer-daemon@higashi-school.jp', to: MY_ADDR,
          subject: 'Falha de entrega: oculto-lab2@higashi-school.jp', date: sceneISO(), read: false, canReply: false,
          body: `O endereço oculto-lab2@higashi-school.jp não está na lista de correio da escola.\n\nConta: (inexistente)\nPasta pessoal: inexistente\nCaixa de saída: 1 mensagem enviada às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nEsta conta não recebe correio.\nSe você está tentando falar com ela, use o Mensageiro — é lá que ela está esperando.\n\n(Servidor de Correio Escolar — mensagem automática)`,
        });
        useOS.getState().notify('Servidor de Correio', 'Falha de entrega — oculto-lab2');
      }, 4000);
    }
  };

  const count = (f: MailFolder) => os.emails.filter((e) => e.folder === f && !e.read).length;

  return (
    <div className="flex h-full text-sm relative">
      <aside className="w-48 border-r bg-indigo-50/60 p-2 flex flex-col gap-0.5 shrink-0">
        <button onClick={() => setCompose({ id: uid(), to: '', subject: '', body: '' })} className="mb-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          <Ico name="edit" size={14} /> Escrever
        </button>
        {FOLDERS.map((f) => (
          <button key={f.id} onClick={() => { setFolder(f.id); setSelId(null); setQ(''); }} className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition ${folder === f.id && !q ? 'bg-indigo-100 text-indigo-900 font-medium' : 'hover:bg-indigo-100/60'}`}>
            <Ico name={f.icon} size={14} /> <span className="flex-1">{f.label}</span>
            {count(f.id) > 0 && <span className="text-[11px] bg-indigo-600 text-white rounded-full px-1.5">{count(f.id)}</span>}
            {f.id === 'drafts' && os.emails.filter((e) => e.folder === 'drafts').length > 0 && <span className="text-[11px] text-slate-500">{os.emails.filter((e) => e.folder === 'drafts').length}</span>}
          </button>
        ))}
        {os.chats.find((c) => c.contactId === 'oculto')?.unlocked && (
          <button onClick={() => os.openApp('chat')} className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] text-slate-500 hover:bg-white/70">
            <Ico name="forward" size={12} /> Conversas continuam no Mensageiro
          </button>
        )}
        <div className="mt-auto text-[11px] text-slate-500 px-2 break-all">{MY_ADDR}</div>
      </aside>

      <div className="w-72 border-r flex flex-col min-w-0 shrink-0">
        <div className="p-2 border-b">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar mensagens" className="w-full border rounded pl-7 pr-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            <Ico name="search" size={13} className="absolute left-2 top-2.5 text-slate-400" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {list.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">Nenhuma mensagem.</p>}
          {list.map((e) => (
            <button key={e.id} onClick={() => open(e)} className={`block w-full text-left px-3 py-2 border-b transition ${selId === e.id ? 'bg-indigo-100' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                {!e.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                <span className={`truncate flex-1 ${e.read ? '' : 'font-semibold'}`}>{e.folder === 'sent' || e.folder === 'drafts' ? `Para: ${e.to}` : e.from}</span>
                <span className="text-[11px] text-slate-400 shrink-0">{fmtDate(e.date, false).slice(0, 5)}</span>
              </div>
              <div className={`truncate text-[13px] ${e.read ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{e.folder === 'drafts' && <span className="text-red-600">[Rascunho] </span>}{e.subject}</div>
              <div className="truncate text-xs text-slate-400">{e.body.replace(/\n/g, ' ')}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {sel ? (
          <>
            <div className="flex items-center gap-1 px-2 py-1.5 border-b flex-wrap">
              <button disabled={!sel.canReply} onClick={() => reply(sel)} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-100 disabled:opacity-35" title={sel.canReply ? 'Responder' : 'Esta mensagem não aceita respostas'}><Ico name="reply" size={14} /> Responder</button>
              <button onClick={() => { os.updateEmail(sel.id, { read: !sel.read }); flash(sel.read ? 'Marcada como não lida.' : 'Marcada como lida.'); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-100"><Ico name="mail" size={14} /> {sel.read ? 'Não lida' : 'Lida'}</button>
              <button onClick={() => { os.updateEmail(sel.id, { folder: 'archive' }); setSelId(null); flash('Mensagem arquivada.'); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-100"><Ico name="archive" size={14} /> Arquivar</button>
              <select value={sel.folder} onChange={(ev) => { os.updateEmail(sel.id, { folder: ev.target.value as MailFolder }); flash('Mensagem movida.'); }} className="text-xs border rounded px-1 py-1" title="Mover para">
                {FOLDERS.filter((f) => f.id !== 'drafts').map((f) => <option key={f.id} value={f.id}>Mover: {f.label}</option>)}
              </select>
              <button onClick={() => { os.deleteEmail(sel.id); setSelId(null); flash(sel.folder === 'trash' ? 'Mensagem excluída.' : 'Movida para a Lixeira.'); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-red-50 text-red-700"><Ico name="trash" size={14} /> Excluir</button>
              <span className="ml-auto text-xs text-indigo-700">{msg}</span>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <h2 className="text-lg font-semibold mb-3">{sel.subject}</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold">{sel.from[0]}</div>
                <div className="text-xs">
                  <div><b className="text-sm">{sel.from}</b> &lt;{sel.fromAddr}&gt;</div>
                  <div className="text-slate-500">Para: {sel.to} • {fmtDate(sel.date)}</div>
                </div>
              </div>
              <div className="os-readable whitespace-pre-wrap leading-relaxed text-slate-800 cursor-text">{sel.body}</div>
              {!sel.canReply && sel.folder === 'inbox' && <p className="mt-6 text-xs text-slate-400">Esta mensagem não aceita respostas por correio.</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Ico name="mail" size={44} />
            <span>Selecione uma mensagem para ler</span>
            {msg && <span className="text-indigo-700 text-xs">{msg}</span>}
          </div>
        )}
      </div>

      {compose && (
        <Modal title={compose.replyTo ? 'Responder' : 'Nova mensagem'} onClose={() => saveDraft(compose)} width={600}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-14 text-slate-500 text-xs">Para</span>
              <input list="mail-contacts" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} className="flex-1 border rounded px-2 py-1.5" placeholder="destinatario@higashi-school.jp" />
              <datalist id="mail-contacts">{contacts.map((c) => <option key={c.addr} value={c.addr}>{c.name}</option>)}</datalist>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 text-slate-500 text-xs">Assunto</span>
              <input value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} className="flex-1 border rounded px-2 py-1.5" />
            </div>
            <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} rows={12} className="border rounded p-2 resize-none font-sans leading-relaxed" autoFocus />
            <div className="flex gap-2 justify-end">
              <Btn onClick={() => { if (os.emails.some((e) => e.id === compose.id && e.folder === 'drafts')) os.deleteEmail(compose.id); setCompose(null); }}>Descartar</Btn>
              <Btn onClick={() => saveDraft(compose)}>Salvar rascunho</Btn>
              <Btn primary onClick={() => send(compose)}><span className="flex items-center gap-1"><Ico name="send" size={13} /> Enviar</span></Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
