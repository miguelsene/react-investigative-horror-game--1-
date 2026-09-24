import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from './ui/Panel';
import { soundManager } from '../audio/soundManager';
import { ActivityId } from '../types/game';
import { Check, X, ChevronRight } from 'lucide-react';

export type Grade = 'F' | 'D' | 'C' | 'B' | 'A-' | 'A' | 'A+';

export interface MinigameResult {
  activity: ActivityId;
  success: boolean;
  message: string;
  score?: number;
  total?: number;
  grade?: Grade;
}

export const gradeForScore = (score: number, total: number): Grade => {
  const ratio = total > 0 ? score / total : 0;
  if (ratio === 1) return 'A+';
  if (ratio >= 0.9) return 'A';
  if (ratio >= 0.8) return 'A-';
  if (ratio >= 0.65) return 'B';
  if (ratio >= 0.5) return 'C';
  if (ratio >= 0.3) return 'D';
  return 'F';
};

interface Props {
  activity: ActivityId | null;
  onClose: () => void;
  onComplete: (result: MinigameResult) => void;
}

const CHECKLIST = [
  { id: 'sheet', label: 'Esticar o lençol' },
  { id: 'pillow', label: 'Ajeitar os travesseiros' },
  { id: 'blanket', label: 'Dobrar o cobertor' },
] as const;

const DESK = [
  { id: 'books', label: 'Empilhar livros' },
  { id: 'papers', label: 'Alinhar papéis' },
  { id: 'pen', label: 'Guardar canetas' },
] as const;

const BAG = [
  { id: 'bio', label: 'Biologia' },
  { id: 'math', label: 'Matemática' },
  { id: 'chem', label: 'Química' },
  { id: 'phys', label: 'Física' },
  { id: 'case', label: 'Estojo' },
  { id: 'calc', label: 'Calculadora' },
  { id: 'wallet', label: 'Carteira' },
  { id: 'phone', label: 'Celular' },
  { id: 'bottle', label: 'Garrafa' },
  { id: 'umbrella', label: 'Guarda-chuva' },
  { id: 'keys', label: 'Chaves' },
] as const;

const WATSON = [
  { id: 'food', label: 'Colocar comida' },
  { id: 'water', label: 'Colocar água' },
  { id: 'call', label: 'Chamar Watson' },
] as const;

const COOKING = [
  { id: 'water', label: 'Encher a panela e ferver a água' },
  { id: 'salt', label: 'Temperar a água com sal' },
  { id: 'pasta', label: 'Colocar o macarrão para cozinhar' },
  { id: 'sauce', label: 'Mexer o molho enquanto conversamos' },
  { id: 'drain', label: 'Escorrer o macarrão' },
  { id: 'serve', label: 'Servir o jantar para as duas' },
] as const;

const QUIZZES: Record<string, { question: string; answers: string[]; answer: number }[]> = {
  biology: [
    { question: 'Qual é a unidade básica da vida?', answers: ['Célula', 'Átomo', 'Pulmão'], answer: 0 },
    { question: 'Qual organela produz energia?', answers: ['Núcleo', 'Mitocôndria', 'Ribossomo'], answer: 1 },
    { question: 'Qual molécula contém a informação genética?', answers: ['DNA', 'ATP', 'H₂O'], answer: 0 },
    { question: 'Qual sistema transporta o sangue?', answers: ['Nervoso', 'Circulatório', 'Digestório'], answer: 1 },
    { question: 'Qual órgão realiza trocas gasosas?', answers: ['Fígado', 'Pulmões', 'Coração'], answer: 1 },
    { question: 'Qual célula transporta oxigênio?', answers: ['Glóbulo vermelho', 'Neurônio', 'Osteócito'], answer: 0 },
    { question: 'Onde fica a maior parte do material genético?', answers: ['Membrana', 'Núcleo', 'Citoplasma'], answer: 1 },
  ],
  math: [
    { question: '2x + 6 = 18. Qual é x?', answers: ['4', '6', '12'], answer: 1 },
    { question: '15 × 4', answers: ['45', '60', '75'], answer: 1 },
    { question: '144 ÷ 12', answers: ['10', '11', '12'], answer: 2 },
    { question: '√81', answers: ['7', '8', '9'], answer: 2 },
    { question: '25% de 200', answers: ['25', '50', '75'], answer: 1 },
    { question: '¥800 com 20% de desconto', answers: ['¥600', '¥640', '¥720'], answer: 1 },
    { question: '2, 4, 8, 16, ...', answers: ['24', '30', '32'], answer: 2 },
  ],
  chemistry: [
    { question: 'Símbolo do oxigênio', answers: ['O', 'Ox', 'Og'], answer: 0 },
    { question: 'Símbolo do mercúrio', answers: ['Me', 'Hg', 'Mr'], answer: 1 },
    { question: 'pH neutro', answers: ['0', '7', '14'], answer: 1 },
    { question: 'Partícula de carga negativa', answers: ['Elétron', 'Próton', 'Nêutron'], answer: 0 },
    { question: 'Fórmula da água', answers: ['CO₂', 'H₂O', 'O₂'], answer: 1 },
    { question: 'O que é uma reação química?', answers: ['Mistura sem mudança', 'Transformação de substâncias', 'Calor apenas'], answer: 1 },
    { question: 'Qual é um gás nobre?', answers: ['Hélio', 'Hidrogênio', 'Oxigênio'], answer: 0 },
  ],
  physics: [
    { question: 'Unidade de força', answers: ['Joule', 'Newton', 'Watt'], answer: 1 },
    { question: 'Aproximação da gravidade na Terra', answers: ['9,8 m/s²', '3,0 m/s²', '1,6 m/s²'], answer: 0 },
    { question: 'Velocidade média', answers: ['Δs/Δt', 'm × a', 'F × d'], answer: 0 },
    { question: 'Força que atrai corpos para a Terra', answers: ['Atrito', 'Gravidade', 'Empuxo'], answer: 1 },
    { question: 'Unidade de energia', answers: ['Joule', 'Newton', 'Pascal'], answer: 0 },
    { question: 'Aceleração positiva indica:', answers: ['Diminuição da velocidade', 'Aumento da velocidade', 'Repouso'], answer: 1 },
    { question: 'Qual destas é energia de movimento?', answers: ['Potencial', 'Térmica parada', 'Cinética'], answer: 2 },
  ],
};

const TITLES: Record<ActivityId, string> = {
  bed: 'Arrumar a cama',
  desk: 'Organizar a escrivaninha',
  bag: 'Preparar a mochila',
  uniform: 'Uniforme',
  watson: 'Watson',
  clocks: 'Relógios',
  cooking: 'Preparar o jantar',
  biology: 'Biologia',
  math: 'Matemática',
  chemistry: 'Química',
  physics: 'Física',
};

const ChecklistGame: React.FC<{ items: readonly { id: string; label: string }[]; successLine: string; onDone: () => void; commentary?: string[] }> = ({ items, successLine, onDone, commentary }) => {
  const [done, setDone] = useState<string[]>([]);
  const complete = done.length === items.length;
  return (
    <div className="space-y-2">
      {commentary && <div className="mb-3 border-l border-amber-700/70 bg-amber-950/20 px-3 py-2 font-serif-jp text-sm italic leading-relaxed text-amber-100/90"><span className="mb-1 block text-[9px] not-italic tracking-[0.25em] text-amber-500">CHIYO, ENQUANTO COZINHAM</span>“{commentary[Math.min(done.length, commentary.length - 1)]}”</div>}
      {items.map((item) => {
        const checked = done.includes(item.id);
        return (
          <button key={item.id} onClick={() => {
            soundManager.playClockTick();
            setDone((prev) => checked ? prev : [...prev, item.id]);
          }} className={`w-full flex justify-between border-b py-3 text-left font-serif-jp text-sm transition-colors ${checked ? 'text-neutral-500 line-through' : 'text-neutral-200 hover:text-white'}`}>
            <span>{item.label}</span><span>{checked ? '✓' : '○'}</span>
          </button>
        );
      })}
      {complete && <div className="pt-4 text-right"><button onClick={onDone} className="inspection-action"><span>{successLine}</span> →</button></div>}
    </div>
  );
};

const BAG_ICONS: Record<(typeof BAG)[number]['id'], string> = {
  bio: '📗', math: '📐', chem: '🧪', phys: '📘', case: '🖊️', calc: '🔢',
  wallet: '👛', phone: '📱', bottle: '🧴', umbrella: '☂️', keys: '🔑',
};

const BagPackingGame: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [packed, setPacked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const packedRef = useRef(new Set<string>());
  const pack = (id: string) => {
    if (!BAG.some((item) => item.id === id) || packedRef.current.has(id)) return;
    packedRef.current.add(id);
    soundManager.playClockTick();
    setPacked((items) => [...items, id]);
    setSelected(null);
  };
  const drop = (event: React.DragEvent) => {
    event.preventDefault();
    setHovering(false);
    pack(event.dataTransfer.getData('text/plain'));
  };
  const complete = packed.length === BAG.length;
  return <div className="grid gap-5 md:grid-cols-[1fr_0.9fr] font-serif-jp">
    <section>
      <p className="mb-3 text-xs tracking-widest text-neutral-400">ITENS PARA LEVAR · {packed.length}/{BAG.length}</p>
      <div className="grid grid-cols-2 gap-2">
        {BAG.map((item) => {
          const isPacked = packed.includes(item.id);
          return <button key={item.id} draggable={!isPacked}
            onDragStart={(event) => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; }}
            onClick={() => !isPacked && setSelected(item.id)}
            className={`flex items-center gap-2 border px-3 py-2 text-left text-xs transition ${isPacked ? 'border-emerald-900/50 text-neutral-600 opacity-50' : selected === item.id ? 'border-amber-300 bg-amber-950/40 text-white' : 'border-neutral-700 bg-neutral-900/70 text-neutral-200 hover:border-neutral-400'}`}>
            <span className="text-lg">{BAG_ICONS[item.id]}</span><span>{item.label}</span>{isPacked && <span className="ml-auto text-emerald-400">✓</span>}
          </button>;
        })}
      </div>
      <p className="mt-3 text-[10px] text-neutral-500">Arraste os itens até a mochila ou selecione um item e clique nela.</p>
    </section>
    <section onDragOver={(event) => { event.preventDefault(); setHovering(true); }} onDragLeave={() => setHovering(false)} onDrop={drop}
      onClick={() => selected && pack(selected)} onKeyDown={(event) => { if (selected && (event.key === 'Enter' || event.key === ' ')) pack(selected); }}
      role="button" tabIndex={0} aria-label="Mochila: solte aqui os itens selecionados"
      className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 p-4 transition-colors ${hovering || selected ? 'border-amber-300 bg-amber-950/25' : 'border-dashed border-neutral-600 bg-neutral-900/40'}`}>
      <div className="absolute top-5 h-8 w-16 rounded-t-2xl border-2 border-neutral-500" />
      <div className="mt-8 flex h-36 w-40 flex-col items-center rounded-[2.5rem_2.5rem_1.2rem_1.2rem] border-2 border-amber-800/80 bg-gradient-to-br from-amber-950 to-neutral-950 p-3 shadow-[inset_0_0_28px_rgba(180,110,45,.12),0_12px_32px_rgba(0,0,0,.45)]">
        <div className="mb-2 h-3 w-12 rounded-full border border-amber-700/70" />
        <div className="grid w-full flex-1 grid-cols-4 content-center gap-1 rounded-lg border border-amber-900/60 bg-black/25 p-2">
          {packed.map((id) => <span key={id} className="text-center text-xl" title={BAG.find((item) => item.id === id)?.label}>{BAG_ICONS[id as (typeof BAG)[number]['id']]}</span>)}
          {Array.from({ length: BAG.length - packed.length }, (_, i) => <span key={`empty-${i}`} className="grid h-7 place-items-center text-xs text-amber-100/20">·</span>)}
        </div>
      </div>
      <p className="mt-4 text-xs tracking-widest text-amber-100/80">{complete ? 'MOCHILA PRONTA' : 'SOLTE OS ITENS AQUI'}</p>
    </section>
    {complete && <div className="md:col-span-2 text-right"><button onClick={onDone} className="inspection-action">Fechar a mochila e descer →</button></div>}
  </div>;
};

const QuizResult: React.FC<{ subject: string; score: number; total: number; onDone: (score: number, total: number) => void }> = ({ score, total, onDone }) => {
  const grade = gradeForScore(score, total);
  const tone =
    grade === 'A+' || grade === 'A' ? 'text-emerald-200' :
    grade === 'A-' || grade === 'B' ? 'text-sky-200' :
    grade === 'C' || grade === 'D' ? 'text-amber-200' : 'text-red-300';
  const remark =
    grade === 'A+' ? 'Perfeito. Ainda assim, não consigo sentir alívio.' :
    grade === 'A' ? 'Quase. Um erro é suficiente para eu repetir a matéria na cabeça.' :
    grade === 'A-' ? 'Aceitável. Não é como eu queria começar o dia.' :
    grade === 'B' ? 'Bom, mas as vozes no corredor não vão esquecer que alguém passou de mim.' :
    grade === 'C' ? 'Mediano. Isso não combina com o que eu espero de mim.' :
    grade === 'D' ? 'Eu sabia a resposta. Por que hesitei?' :
    'Não fui eu. Ou fui? Não reconheço essa prova.';
  return (
    <div className="py-10 text-center font-serif-jp">
      <p className="text-[10px] tracking-[0.3em] text-neutral-500 uppercase">Boletim da aula</p>
      <p className={`text-7xl font-title mt-4 ${tone}`}>{grade}</p>
      <p className="mt-3 text-neutral-300 text-sm">{score}/{total} acertos</p>
      <p className="mt-4 text-neutral-400 italic max-w-sm mx-auto leading-relaxed">“{remark}”</p>
      <button onClick={() => onDone(score, total)} className="inspection-action justify-center mx-auto mt-7">Guardar o caderno →</button>
    </div>
  );
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const Quiz: React.FC<{ subject: keyof typeof QUIZZES; onDone: (score: number, total: number) => void }> = ({ subject, onDone }) => {
  const questions = useMemo(() => QUIZZES[subject], [subject]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const finished = index >= questions.length;
  const question = questions[index];

  const pick = (i: number) => {
    if (picked !== null || !question) return;
    setPicked(i);
    if (i === question.answer) {
      setScore((s) => s + 1);
      soundManager.playClueDiscovered();
    } else {
      soundManager.playAnomalySting();
    }
  };

  const advance = () => {
    setPicked(null);
    setIndex((v) => v + 1);
  };

  if (finished) {
    return <QuizResult subject={subject} score={score} total={questions.length} onDone={onDone} />;
  }
  if (!question) return null;
  const isCorrect = picked === question.answer;

  return (
    <div className="font-serif-jp">
      <p className="text-[10px] tracking-[0.3em] text-neutral-500 uppercase">Pergunta {index + 1}/{questions.length} · Acertos: {score}</p>
      <h3 className="text-lg text-neutral-100 mt-3 mb-5">{question.question}</h3>
      <div className="grid gap-2">
        {question.answers.map((answer, i) => {
          const letter = LETTERS[i] ?? String(i + 1);
          const answered = picked !== null;
          const isRight = i === question.answer;
          let cls = 'border-neutral-700 hover:border-neutral-400 hover:bg-neutral-800/40';
          if (answered) {
            if (isRight) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-200';
            else if (i === picked) cls = 'border-red-500 bg-red-500/10 text-red-200';
            else cls = 'border-neutral-800 text-neutral-500';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`text-left border px-4 py-3 text-sm flex items-center gap-3 transition-colors ${cls}`}
            >
              <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        answered && isRight ? 'bg-emerald-500 text-black' :
                        answered && i === picked ? 'bg-red-500 text-white' :
                        'bg-neutral-800 text-neutral-300'
                      }`}>{letter}</span>
              <span className="flex-1">{answer}</span>
              {answered && isRight && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {answered && !isRight && i === picked && <X className="w-4 h-4 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback + advance */}
              {picked !== null && (
                <div className="mt-4 fade-up">
                  <div className={`flex items-center gap-2 mb-3 text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                    {isCorrect
                      ? <><Check className="w-4 h-4" /> Correto.</>
                      : <><X className="w-4 h-4" /> Resposta correta: {LETTERS[question.answer]}</>}
                  </div>
                  <button
                    onClick={advance}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-600 font-serif-jp text-sm tracking-wider hover:bg-neutral-700 flex items-center justify-center gap-2"
                  >
                    {index + 1 < questions.length ? 'Próxima pergunta' : 'Ver boletim'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        };

export const ChapterMinigames: React.FC<Props> = ({ activity, onClose, onComplete }) => {
  useEffect(() => {
    if (activity) soundManager.playDoorCreak();
  }, [activity]);
  if (!activity) return null;

  const finish = (message: string, result?: { score: number; total: number; grade: Grade }) => {
    soundManager.playClueDiscovered();
    onComplete({
      activity,
      success: true,
      message,
      score: result?.score,
      total: result?.total,
      grade: result?.grade,
    });
    onClose();
  };

  let body: React.ReactNode = null;
  if (activity === 'bed') body = <ChecklistGame items={CHECKLIST} successLine="Pronto." onDone={() => finish('A cama está arrumada.')} />;
  if (activity === 'desk') body = <ChecklistGame items={DESK} successLine="Mesa organizada." onDone={() => finish('A escrivaninha está organizada.')} />;
  if (activity === 'bag') body = <BagPackingGame onDone={() => finish('A mochila está pronta.')} />;
  if (activity === 'uniform') body = <ChecklistGame items={[{ id: 'uniform', label: 'Trocar de roupa e dobrar o pijama' }]} successLine="Pronto." onDone={() => finish('Uniforme preparado.')} />;
  if (activity === 'watson') body = <ChecklistGame items={WATSON} successLine="Bom garoto." onDone={() => finish('Watson foi alimentado.')} />;
  if (activity === 'cooking') body = <ChecklistGame
    items={COOKING}
    successLine="Servir o jantar."
    onDone={() => finish('O jantar está pronto.')}
    commentary={[
      'Seu pai sempre dizia que macarrão era a comida perfeita para quando a gente precisava conversar.',
      'Ele mexia o molho devagar e me contava tudo o que tinha acontecido no trabalho.',
      'Seu avô ensinou a ele esta receita. Os dois discutiam sobre quanto alho colocar.',
      'Sinto falta de ouvir a chave do seu pai na porta e os dois rindo na cozinha.',
      'Também sinto falta do seu avô. Há noites em que ainda guardo lugar para ele à mesa.',
      'Obrigada por me ouvir falar deles, querida. Às vezes a saudade precisa de companhia.',
      'Está pronto. Vamos jantar juntas, como fazíamos quando eles estavam aqui.',
    ]}
  />;
  if (activity === 'biology' || activity === 'math' || activity === 'chemistry' || activity === 'physics') {
    body = <Quiz subject={activity} onDone={(score, total) => {
      const grade = gradeForScore(score, total);
      finish(`${TITLES[activity]} concluída — nota ${grade} (${score}/${total}).`, { score, total, grade });
    }} />;
  }

  return (
    <Panel title={TITLES[activity] ?? 'Atividade'} jp="日常" onClose={onClose} width="max-w-xl">
      {body}
    </Panel>
  );
};
