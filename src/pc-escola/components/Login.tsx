import { useEffect, useRef, useState } from 'react';
import { useOS } from '../os/store';
import { playSound } from '../os/sound';
import { LAB_PASSWORD, LAB_USER } from '../os/utils';
import { Ico } from './Icons';

export default function Login() {
  const setPhase = useOS((s) => s.setPhase);
  const exitComputer = useOS((s) => s.exitComputer);
  const settings = useOS((s) => s.settings);
  const [user, setUser] = useState(LAB_USER);
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);
  const [caps, setCaps] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'welcome'>('idle');
  const [shake, setShake] = useState(false);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passRef.current?.focus();
  }, []);

  const fail = (msg: string) => {
    playSound('error', settings);
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
    setPass('');
    setTimeout(() => passRef.current?.focus(), 0);
  };

  const submit = () => {
    if (status !== 'idle') return;
    const u = user.trim().toUpperCase();
    if (!u) return fail('Digite o nome de usuário.');
    if (u !== LAB_USER) return fail(`O usuário "${user.trim()}" não existe neste computador. Use o perfil ${LAB_USER}.`);
    if (pass !== LAB_PASSWORD) {
      setHint(true);
      return fail('A senha está incorreta. Tente novamente.');
    }
    setError('');
    setStatus('checking');
    setTimeout(() => setStatus('welcome'), 900);
    setTimeout(() => {
      playSound('boot', settings);
      setPhase('desktop');
    }, 2100);
  };

  return (
    <div className="absolute inset-0 overflow-hidden select-none text-white bg-[#0b2d5b]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#2d78c8_0%,#17529e_30%,#0d3570_60%,#071f45_100%)]" />
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_18%_80%,rgba(120,200,255,.28),transparent_38%),radial-gradient(circle_at_82%_22%,rgba(90,170,255,.22),transparent_42%)]" />
      <svg className="absolute inset-0 w-full h-full opacity-[.16]" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M-50 650 C 300 450, 600 820, 950 560 S 1500 420, 1700 620" fill="none" stroke="#bfe6ff" strokeWidth="90" strokeLinecap="round" />
        <path d="M-50 720 C 350 540, 650 900, 1000 640 S 1450 520, 1700 700" fill="none" stroke="#8ec9ff" strokeWidth="40" strokeLinecap="round" />
      </svg>

      <div className={`relative h-full flex flex-col items-center justify-center px-4 ${shake ? 'animate-[shake_.4s_ease-in-out]' : ''}`}>
        {status === 'welcome' ? (
          <div className="flex flex-col items-center gap-5 animate-[winIn_.3s_ease-out]">
            <UserTile large />
            <div className="text-2xl font-light tracking-wide">Bem-vinda</div>
            <Spinner />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex flex-col items-center gap-3 w-full max-w-sm"
          >
            <UserTile large />
            <div className="text-[22px] font-light tracking-wide drop-shadow">{user.trim() || LAB_USER}</div>

            <label className="w-[290px] text-left">
              <span className="block text-[11px] text-white/70 mb-1 ml-0.5">Nome de usuário</span>
              <input
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setError('');
                }}
                disabled={status !== 'idle'}
                className="w-full rounded-[3px] px-2.5 py-1.5 text-[14px] text-slate-800 bg-white/95 border border-[#8fa9c4] shadow-[inset_0_1px_3px_rgba(0,0,0,.18)] outline-none focus:ring-2 focus:ring-sky-300"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <div className="w-[290px] text-left">
              <span className="block text-[11px] text-white/70 mb-1 ml-0.5">Senha</span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={passRef}
                    type={show ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => {
                      setPass(e.target.value);
                      setError('');
                    }}
                    onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState('CapsLock'))}
                    disabled={status !== 'idle'}
                    placeholder="Senha"
                    className="w-full rounded-[3px] pl-2.5 pr-8 py-1.5 text-[14px] text-slate-800 bg-white/95 border border-[#8fa9c4] shadow-[inset_0_1px_3px_rgba(0,0,0,.18)] outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-slate-400"
                    autoComplete="off"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShow(!show)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800" title={show ? 'Ocultar senha' : 'Mostrar senha'}>
                    <Ico name="eye" size={14} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={status !== 'idle'}
                  title="Entrar (Enter)"
                  className="login-go w-[34px] h-[34px] rounded-[4px] flex items-center justify-center shrink-0 disabled:opacity-60"
                >
                  {status === 'checking' ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Ico name="forward" size={18} />}
                </button>
              </div>
            </div>

            <div className="w-[290px] min-h-[44px] text-center text-[12px] leading-snug">
              {caps && !error && <div className="text-amber-200">Caps Lock está ativado.</div>}
              {error && <div className="text-rose-100 bg-rose-900/35 ring-1 ring-rose-300/40 rounded px-2 py-1">{error}</div>}
              {hint && !error && (
                <div className="text-sky-100/90 bg-sky-900/35 ring-1 ring-sky-300/30 rounded px-2 py-1">
                  Dica de senha: <b>senha padrão do Laboratório 2</b> — está escrita no quadro branco, ao lado da porta.
                </div>
              )}
            </div>
            {!hint && (
              <button type="button" onClick={() => setHint(true)} className="text-[12px] text-sky-100/80 hover:text-white hover:underline -mt-2">
                Esqueci a senha
              </button>
            )}
            {hint && (
              <details className="text-[11px] text-sky-100/70 -mt-1">
                <summary className="cursor-pointer hover:text-white">Olhar o quadro branco</summary>
                <div className="mt-1 inline-block rounded bg-white text-slate-700 px-3 py-2 shadow-lg font-mono text-xs text-left rotate-[-1deg]">
                  LAB 2 — COMPUTADORES
                  <br />
                  usuário: ALUNO_XX (número da mesa)
                  <br />
                  senha: <b>{LAB_PASSWORD}</b>
                  <br />
                  <span className="text-slate-400">não mudem o papel de parede — Prof. Mori</span>
                </div>
              </details>
            )}
          </form>
        )}
      </div>

      <button
        onClick={() => setHint(true)}
        className="absolute left-4 bottom-4 w-10 h-10 rounded-[4px] bg-white/10 hover:bg-white/20 ring-1 ring-white/30 flex items-center justify-center"
        title="Facilidade de acesso"
      >
        <Ico name="eye" size={18} />
      </button>
      <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-1 pointer-events-none">
        <div className="flex items-center gap-2 text-sm font-light tracking-wide">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-200 via-blue-500 to-blue-900 border border-white/70 shadow flex items-center justify-center text-[11px] font-semibold">東</span>
          HIGASHI <b className="font-semibold">OS</b> 3.4
        </div>
        <div className="text-[11px] text-white/55">Edição Escolar · Laboratório 2 · HIGASHI-SCHOOL</div>
      </div>
      <button
        onClick={exitComputer}
        className="login-power absolute right-4 bottom-4 h-10 px-3 rounded-[4px] flex items-center gap-2 text-sm"
        title="Levantar do computador"
      >
        <Ico name="power" size={16} /> <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
}

function UserTile({ large }: { large?: boolean }) {
  const s = large ? 112 : 64;
  return (
    <div className="rounded-[6px] p-[5px] bg-gradient-to-b from-white/90 to-white/60 shadow-[0_6px_20px_rgba(0,0,0,.35)] ring-1 ring-white" style={{ width: s + 10, height: s + 10 }}>
      <div className="w-full h-full rounded-[3px] overflow-hidden bg-gradient-to-br from-sky-200 via-sky-500 to-blue-800 relative">
        <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full" aria-hidden>
          <circle cx="32" cy="24" r="12" fill="#fff" opacity=".92" />
          <path d="M10 60c2-14 11-20 22-20s20 6 22 20z" fill="#fff" opacity=".92" />
        </svg>
        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/25" />
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />;
}
