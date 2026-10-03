import { useEffect, useState } from 'react';
import { useOS, getTaskStatus } from '../os/store';
import { fmtTime, SCENE_START } from '../os/utils';

export default function GameScene() {
  const os = useOS();
  const [confirmReset, setConfirmReset] = useState(false);
  const st = getTaskStatus(os);
  const returned = os.sessions > 0;
  const sceneTime = new Date(SCENE_START + os.sceneElapsed);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') os.enterComputer();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [os]);

  const created = os.files.filter((f) => new Date(f.createdAt).getTime() >= SCENE_START && !f.deleted).length;

  return (
    <div className="absolute inset-0 bg-black text-white overflow-hidden select-none">
      <img src="/pc-escola/images/sala_informatica.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105 animate-[drift_30s_ease-in-out_infinite_alternate]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

      <div className="absolute top-5 left-6 text-xs tracking-[0.3em] text-white/50">CAPÍTULO 1</div>
      <div className="absolute top-5 right-6 text-right text-xs text-white/60 leading-relaxed">
        <div>Sexta-feira, 12/04/2019</div>
        <div className="text-white/90 text-base font-light">{fmtTime(sceneTime)}</div>
        <div>Laboratório de Informática 2 • 3ª aula</div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6">
        <div className="flex-1 max-w-2xl">
          <div className="text-[11px] tracking-[0.25em] text-white/40 mb-2">{returned ? 'CONTROLES DA PERSONAGEM: ATIVOS' : 'SALA DE INFORMÁTICA'}</div>
          {returned ? (
            <p className="text-lg md:text-xl font-light leading-relaxed text-white/90">
              Gabriela empurra a cadeira para trás e se levanta do computador ALUNO_17. A tela volta para a área de trabalho. Alguém ri no fundo da sala; o Prof. Mori continua corrigindo algo na mesa dele.
            </p>
          ) : (
            <p className="text-lg md:text-xl font-light leading-relaxed text-white/90">
              O ar-condicionado faz um zumbido baixo. Lá fora, o céu está nublado. Gabriela para ao lado do computador 17, o mesmo de sempre, perto da janela.
            </p>
          )}
          {returned && os.lore.yamantakaSearched && (
            <p className="mt-3 text-sm md:text-[15px] text-white/55 leading-relaxed">
              Na mesa ao lado, um aluno que ela não conhece fecha a aba no exato segundo em que ela se levanta. Ele não olha para ela. O laboratório inteiro continua fazendo barulho, e é isso que incomoda: nada aqui parece anormal.
            </p>
          )}
          {!returned && (
            <div className="mt-4 inline-block rounded bg-white/90 text-slate-700 px-3 py-2 shadow-lg font-mono text-[11px] leading-relaxed rotate-[-1.5deg]">
              <span className="text-slate-400">quadro branco, ao lado da porta:</span>
              <br />
              LAB 2 — usuário <b>ALUNO_XX</b> (número da mesa) · senha <b>lab2019</b>
            </div>
          )}
          {returned && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className={`px-3 py-1 rounded-full ${st.completed ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/40' : 'bg-white/10 text-white/70 ring-1 ring-white/15'}`}>
                Atividade 01: {st.completed ? 'concluída ✔' : `${st.doneCount}/${st.steps.length} etapas`}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 ring-1 ring-white/15">Arquivos criados hoje: {created}</span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 ring-1 ring-white/15">Páginas visitadas: {os.browserHistory.length}</span>
              {os.lore.yamantakaSearched && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/40">
                  Você pesquisou sobre Yamāntaka
                </span>
              )}
              {os.chats.some((c) => (c.unread || 0) > 0) && (
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-100 ring-1 ring-sky-300/40 animate-pulse">
                  {os.chats.reduce((n, c) => n + (c.unread || 0), 0)} mensagem(ns) não lida(s) no mensageiro
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 ring-1 ring-white/15">Estado do computador salvo</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <button onClick={os.enterComputer} className="group flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/30 backdrop-blur transition">
            <span className="w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center group-hover:scale-110 transition">E</span>
            <span className="text-sm tracking-wide">{returned ? 'Sentar no computador novamente' : 'Sentar no computador'}</span>
          </button>
          {returned && (
            confirmReset ? (
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                Apagar todo o estado salvo do computador?
                <button onClick={() => { os.resetComputer(); setConfirmReset(false); }} className="px-2 py-0.5 rounded bg-red-600/70 hover:bg-red-600 text-white">Apagar</button>
                <button onClick={() => setConfirmReset(false)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="text-[11px] text-white/35 hover:text-white/70">Reiniciar dados do computador (debug)</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
