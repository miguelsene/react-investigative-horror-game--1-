import { useState } from 'react';
import { useOS, getTaskStatus } from '../os/store';
import type { WindowState } from '../os/types';
import { Ico } from '../components/Icons';
import { playSound } from '../os/sound';
import { sceneISO } from '../os/utils';

interface Question {
  q: string;
  opts: string[];
  ans: number; // Index of correct option
  exp: string; // Explanation shown afterwards
}

const QUESTIONS: Question[] = [
  {
    q: "1. O que significa a sigla 'OS' em HIGASHI OS?",
    opts: [
      "Office System (Sistema de Escritório)",
      "Operating System (Sistema Operacional)",
      "Online Server (Servidor Online)",
      "Optical Sensor (Sensor Óptico)"
    ],
    ans: 1,
    exp: "OS significa Operating System (Sistema Operacional), que é o software principal que gerencia o hardware e os outros programas do computador."
  },
  {
    q: "2. Qual das alternativas abaixo representa um dispositivo que é exclusivamente de ENTRADA de dados?",
    opts: [
      "Monitor",
      "Impressora (LAB-PRINTER)",
      "Teclado",
      "Alto-falante"
    ],
    ans: 2,
    exp: "O Teclado envia informações para o computador, sendo um dispositivo de entrada. Monitor, Impressora e Alto-falantes são dispositivos de saída."
  },
  {
    q: "3. Qual atalho de teclado é usado no HIGASHI OS para SALVAR as alterações em um documento de texto ou planilha?",
    opts: [
      "Ctrl+S",
      "Ctrl+C",
      "Ctrl+V",
      "Ctrl+Esc"
    ],
    ans: 0,
    exp: "Ctrl+S (Save) é o atalho universal para salvar arquivos. Ctrl+C copia, Ctrl+V cola e Ctrl+Esc abre o menu Iniciar."
  },
  {
    q: "4. O que acontece com um arquivo quando ele é enviado para a Lixeira?",
    opts: [
      "É excluído permanentemente do disco imediatamente.",
      "É enviado para o e-mail do professor Mori automaticamente.",
      "Fica oculto e protegido, mas não pode ser recuperado.",
      "Fica guardado temporariamente e pode ser restaurado para sua pasta original."
    ],
    ans: 3,
    exp: "A Lixeira serve como uma área de armazenamento temporário. Os arquivos só são apagados de verdade quando você escolhe 'Esvaziar Lixeira'."
  },
  {
    q: "5. Onde os arquivos baixados de sites simulados no Navegador são salvos por padrão no HIGASHI OS?",
    opts: [
      "Na pasta 'Temporários'",
      "Na pasta 'Downloads' em Meus Documentos",
      "Na área de trabalho",
      "Na pasta do sistema 'Configurações'"
    ],
    ans: 1,
    exp: "Os arquivos baixados pelo Navegador vão direto para a pasta 'Downloads' (dentro de Meus Documentos) e também aparecem no painel de downloads do navegador."
  }
];

export default function Tasks({ win }: { win: WindowState }) {
  const os = useOS();
  const st = getTaskStatus(os);
  const [step, setStep] = useState<'intro' | 'quiz' | 'review' | 'done'>('intro');
  const [curr, setCurr] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const startQuiz = () => {
    setAnswers([]);
    setCurr(0);
    setScore(0);
    setStep('quiz');
  };

  const handleSelect = (idx: number) => {
    const nextAnswers = [...answers, idx];
    setAnswers(nextAnswers);

    if (idx === QUESTIONS[curr].ans) {
      setScore((s) => s + 1);
    }

    if (curr + 1 < QUESTIONS.length) {
      setCurr(curr + 1);
    } else {
      // Calculate final score
      const finalScore = idx === QUESTIONS[curr].ans ? score + 1 : score;
      os.setTask({ quizCompleted: true, quizScore: finalScore });

      // Approved: the lab is hers for the rest of the class — and this is the
      // moment someone who has been waiting decides to say something.
      if (finalScore >= 4) {
        playSound('success', os.settings);
        setTimeout(() => {
          if (!os.emails.some((e) => e.id === 'stranger-1'))
            os.addEmail({
              id: 'stranger-1',
              folder: 'inbox',
              from: 'Usuário Oculto',
              fromAddr: 'oculto-lab2@higashi-school.jp',
              to: 'gabriela.aluno17@higashi-school.jp',
              subject: 'não por aqui',
              date: sceneISO(),
              read: false,
              canReply: false,
              body:
                'Gabriela.\n\nEste endereço não recebe resposta. Não tente: é correio da escola, e tudo que entra aqui sai na tela de algum lugar.\n\nTem um Mensageiro instalado neste computador. Ele aparece na sua área de trabalho como "Mensageiro". Abra por lá.\n\nEu vou estar esperando você terminar de fazer o que o professor mandou.\n\n— alguém que usa esta rede desde antes de você saber que a rede existia.',
            });
          os.notify('Novo e-mail recebido ✉', 'Usuário Oculto — não por aqui');
        }, 4000);
      } else {
        playSound('error', os.settings);
      }
      setStep('review');
    }
  };

  const pct = Math.round((st.doneCount / st.steps.length) * 100);

  return (
    <div className="flex flex-col h-full text-sm overflow-hidden bg-slate-50">
      {/* Header */}
      <div className={`p-4 shrink-0 text-white ${st.completed ? 'bg-gradient-to-br from-emerald-600 to-green-700 shadow' : 'bg-gradient-to-br from-blue-600 to-sky-700 shadow'}`}>
        <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Informática • Prof. Mori • 3ª aula</div>
        <div className="text-base font-bold">Atividade 01 — Questionário de Computação</div>
        <div className="mt-3 h-1.5 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full bg-white transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs mt-1 text-white/85 flex justify-between">
          <span>{st.doneCount} de {st.steps.length} etapas concluídas</span>
          {st.completed && <span className="font-bold">APROVADA (Nota: {(os.task.quizScore * 2).toFixed(1)}) ✔</span>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col justify-between">
        {step === 'intro' && (
          <div className="space-y-4 max-w-md mx-auto py-4 text-slate-700">
            <div className="text-center">
              <span className="inline-flex w-12 h-12 rounded-full bg-blue-100 text-blue-700 items-center justify-center mb-2 shadow-inner">
                <Ico name="clipboard" size={24} />
              </span>
              <h3 className="font-bold text-lg text-slate-800">Instruções da Atividade</h3>
            </div>
            <p className="leading-relaxed text-slate-600 text-xs">
              Bem-vinda ao sistema de avaliação do laboratório. Você deve responder a um questionário de <b>5 perguntas de múltipla escolha</b> sobre computadores, o HIGASHI OS e o uso do computador escolar.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900 leading-relaxed">
              <b>Critério de aprovação:</b> Você precisa acertar pelo menos <b>4 das 5 questões</b> (Nota mínima 8.0). Após concluir com sucesso, o computador estará totalmente liberado para uso livre.
            </div>
            <button
              onClick={startQuiz}
              className="w-full py-2.5 rounded-[4px] bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow transition-colors active:translate-y-px"
            >
              Iniciar Questionário
            </button>
          </div>
        )}

        {step === 'quiz' && (
          <div className="space-y-4 max-w-md mx-auto py-2 flex-1 flex flex-col justify-between w-full">
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-bold tracking-wider">PERGUNTA {curr + 1} DE 5</div>
              <h3 className="font-semibold text-[15px] text-slate-800 leading-snug">{QUESTIONS[curr].q}</h3>
              <div className="space-y-2 pt-1">
                {QUESTIONS[curr].opts.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className="w-full text-left p-3 rounded border border-slate-200 bg-white hover:bg-sky-50/50 hover:border-sky-300 text-xs text-slate-700 shadow-sm transition active:translate-y-px"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-1 rounded-full bg-slate-200 overflow-hidden mt-6">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${((curr) / 5) * 100}%` }} />
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 max-w-md mx-auto py-2 text-slate-700 w-full">
            <div className="text-center">
              <span className={`inline-flex w-14 h-14 rounded-full items-center justify-center mb-2 shadow ${os.task.quizScore >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                <Ico name={os.task.quizScore >= 4 ? 'check' : 'x'} size={28} />
              </span>
              <h3 className="font-bold text-lg text-slate-800">Resultado do Questionário</h3>
              <div className="text-3xl font-black mt-2" style={{ color: os.task.quizScore >= 4 ? '#10b981' : '#f43f5e' }}>
                Nota: {(os.task.quizScore * 2).toFixed(1)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Você acertou {os.task.quizScore} de 5 questões.</p>
            </div>

            {os.task.quizScore >= 4 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3.5 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">✔ Parabéns, você foi aprovada!</p>
                <p className="leading-relaxed opacity-90">Sua nota foi enviada para o painel do Prof. Mori. O computador escolar está totalmente liberado para exploração livre e trabalhos pessoais.</p>
                <p className="leading-relaxed opacity-90 pt-1 border-t border-emerald-200">Aula livre: pode navegar, usar o correio, o mensageiro, abrir seus trabalhos e a pasta de textos pessoais. Nada aqui é vigiado pelo professor durante a aula livre.</p>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded p-3.5 text-xs text-rose-900 space-y-1">
                <p className="font-bold">❌ Nota mínima não alcançada</p>
                <p className="leading-relaxed opacity-90">Você precisa de pelo menos 4 acertos para aprovação. Revise os conceitos e tente responder novamente.</p>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-auto border rounded p-2 bg-white text-xs">
              <div className="font-bold text-slate-500 pb-1 border-b">REVISÃO DAS RESPOSTAS:</div>
              {QUESTIONS.map((q, i) => {
                const isCorrect = answers[i] === q.ans;
                return (
                  <div key={i} className="py-2 border-b last:border-0 space-y-1">
                    <div className="font-medium text-slate-800">{q.q}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {isCorrect ? '✔ Sua resposta:' : '❌ Sua resposta:'} {q.opts[answers[i]]}
                      </span>
                    </div>
                    {!isCorrect && <div className="text-emerald-700">Resposta correta: {q.opts[q.ans]}</div>}
                    <div className="text-[11px] text-slate-400 bg-slate-50 p-1.5 rounded">{q.exp}</div>
                  </div>
                );
              })}
            </div>

            {os.task.quizScore >= 4 ? (
              <button
                onClick={() => os.closeWindow(win.id, true)}
                className="w-full py-2.5 rounded-[4px] bg-slate-800 text-white font-semibold hover:bg-slate-900 transition shadow active:translate-y-px"
              >
                Concluir Atividade e Fechar
              </button>
            ) : (
              <button
                onClick={startQuiz}
                className="w-full py-2.5 rounded-[4px] bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow active:translate-y-px"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions / Progress list */}
      {step === 'intro' && (
        <div className="bg-slate-100 border-t p-3 text-[11px] text-slate-400 flex flex-col gap-1">
          <div className="font-bold text-slate-500">ETAPAS DA ATIVIDADE:</div>
          {st.steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className={s.done ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{s.done ? '✔' : '·'}</span>
              <span className={s.done ? 'line-through' : ''}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
