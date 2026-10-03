import { useEffect, useState } from 'react';
import { useOS } from '../os/store';

export default function Boot() {
  const setPhase = useOS((s) => s.setPhase);
  const settings = useOS((s) => s.settings);
  const [p, setP] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setP((v) => Math.min(100, v + 5)), 85);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (p >= 100 && stage === 0) {
      setStage(1);
      setTimeout(() => setStage(2), 450);
      setTimeout(() => setStage(3), 900);
      setTimeout(() => setPhase('login'), 1500);
    }
  }, [p, stage, setPhase, settings]);

  const skip = () => setPhase('login');

  useEffect(() => {
    const k = (e: KeyboardEvent) => (e.key === 'Enter' || e.key === 'Escape') && skip();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div onClick={skip} className="absolute inset-0 cursor-default select-none overflow-hidden bg-[#061324] text-white flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(27,88,139,.38),transparent_53%),linear-gradient(180deg,#071323_0%,#102b45_52%,#071322_100%)]" />
      <div className="absolute -top-32 left-[20%] w-[32rem] h-[32rem] rounded-full bg-sky-500/10 blur-[90px]" />
      <div className="absolute -bottom-48 right-[14%] w-[38rem] h-[38rem] rounded-full bg-blue-700/15 blur-[110px]" />
      <div className="relative w-[min(510px,90vw)] text-center">
        <div className="mx-auto mb-6 w-[74px] h-[74px] rounded-full border border-white/55 bg-gradient-to-br from-sky-200 via-blue-500 to-blue-950 shadow-[0_0_36px_rgba(87,190,255,.4),inset_0_2px_7px_rgba(255,255,255,.75)] flex items-center justify-center">
          <span className="font-semibold text-3xl tracking-tight drop-shadow-lg">東</span>
        </div>
        <div className="text-[11px] tracking-[.42em] text-sky-100/65">HIGASHI SCHOOL COMPUTER</div>
        <div className="mt-2 text-3xl font-light tracking-[.08em]">HIGASHI <span className="font-semibold">OS</span> <span className="text-sky-200">3.4</span></div>
        <div className="mt-8 text-sm text-sky-50/80">Carregando perfil escolar...</div>
        <div className="mx-auto mt-3 h-3 w-[min(340px,85vw)] rounded-full border border-white/30 bg-slate-950/70 p-[2px] shadow-inner overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-600 via-cyan-300 to-blue-500 shadow-[0_0_10px_rgba(61,190,255,.85)] transition-[width] duration-100" style={{ width: `${p}%` }} />
        </div>
        <div className="mt-2 text-[11px] text-sky-100/50 tabular-nums">{p}%</div>
        <div className="mt-7 space-y-1 font-mono text-xs tracking-wide">
          <div className={`transition-opacity ${stage >= 1 ? 'opacity-100' : 'opacity-0'} text-white/80`}>USUÁRIO: <span className="text-sky-200">ALUNO_17</span></div>
          <div className={`transition-opacity ${stage >= 2 ? 'opacity-100' : 'opacity-0'} text-white/80`}>REDE: <span className="text-sky-200">HIGASHI-SCHOOL</span></div>
        </div>
        <div className={`mt-5 text-xs text-sky-100/55 transition-opacity ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>Iniciando área de trabalho...</div>
      </div>
      <div className="absolute bottom-5 text-[11px] text-white/35">Clique ou pressione Enter para iniciar mais rápido</div>
    </div>
  );
}
