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

const PAINT_ROUNDS = [
  { title: 'Paisagem de verão', prompt: 'Pinte um jardim no verão: céu, vegetação e um ponto de cor quente.', seconds: 120, wanted: ['#8bc5dc', '#67935c', '#e3a45b'] },
  { title: 'A janela da escola', prompt: 'Pinte uma janela com luz do fim da tarde e algo visível do lado de fora.', seconds: 60, wanted: ['#e7b66d', '#657a9b', '#81a36a'] },
  { title: 'Casa sob a chuva', prompt: 'Em pouco tempo, represente uma casa, o céu e um detalhe que pareça acolhedor.', seconds: 30, wanted: ['#52647c', '#9a6670', '#e4c989'] },
] as const;
const PAINT_COLORS = [
  { name: 'Azul céu', color: '#8bc5dc' }, { name: 'Verde folha', color: '#67935c' },
  { name: 'Laranja verão', color: '#e3a45b' }, { name: 'Ouro do entardecer', color: '#e7b66d' },
  { name: 'Azul da janela', color: '#657a9b' }, { name: 'Verde do jardim', color: '#81a36a' },
  { name: 'Índigo chuva', color: '#52647c' }, { name: 'Rosa casa', color: '#9a6670' },
  { name: 'Luz acolhedora', color: '#e4c989' }, { name: 'Amarelo luz', color: '#e3c779' },
  { name: 'Laranja', color: '#e38c54' }, { name: 'Rosa flor', color: '#cf8192' },
  { name: 'Creme', color: '#e8dfc6' }, { name: 'Marrom madeira', color: '#795b45' },
];

const PaintingGame: React.FC<{ onDone: (score: number, total: number, grade: Grade) => void }> = ({ onDone }) => {
  const [round, setRound] = useState(0);
  const [seconds, setSeconds] = useState(PAINT_ROUNDS[0].seconds);
  const [selected, setSelected] = useState(PAINT_COLORS[0].color);
  const [brushSize, setBrushSize] = useState(10);
  const [isEraser, setIsEraser] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const usedColorsRef = useRef(new Set<string>());
  const roundFinishedRef = useRef(false);
  const current = PAINT_ROUNDS[round];
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return null;
    const bounds = canvas.getBoundingClientRect();
    return { context, x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  };
  const paintStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drawingRef.current = true;
    const p = point(event); if (!p) return;
    p.context.beginPath(); p.context.moveTo(p.x, p.y); p.context.lineTo(p.x + 0.1, p.y + 0.1);
    p.context.lineWidth = brushSize; p.context.lineCap = 'round'; p.context.lineJoin = 'round';
    p.context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over'; p.context.strokeStyle = selected; p.context.stroke();
    if (!isEraser) usedColorsRef.current.add(selected);
  };
  const paintMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = point(event); if (!p) return;
    p.context.lineTo(p.x, p.y); p.context.stroke();
    if (!isEraser) usedColorsRef.current.add(selected);
  };
  const clearCanvas = () => { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); usedColorsRef.current.clear(); };
  const finishRound = () => {
    if (roundFinishedRef.current || finished) return;
    roundFinishedRef.current = true;
    const canvas = canvasRef.current; const context = canvas?.getContext('2d');
    const pixels = context && canvas ? context.getImageData(0, 0, canvas.width, canvas.height).data : new Uint8ClampedArray();
    let painted = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 16) painted++;
    const coverage = pixels.length ? painted / (pixels.length / 4) : 0;
    const matching = current.wanted.filter((color) => usedColorsRef.current.has(color)).length;
    const score = Math.min(100, Math.round(coverage * 70 + matching * 10 + Math.min(usedColorsRef.current.size, 4) * 2.5));
    const nextScores = [...scores, score]; setScores(nextScores);
    if (round + 1 >= PAINT_ROUNDS.length) setFinished(true);
    else {
      setRound(round + 1); setSeconds(PAINT_ROUNDS[round + 1].seconds); setSelected(PAINT_COLORS[0].color); setIsEraser(false);
      clearCanvas(); roundFinishedRef.current = false;
    }
  };
  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [round, finished]);
  useEffect(() => { if (seconds === 0) finishRound(); }, [seconds, round, finished, scores]);
  const total = scores.reduce((sum, value) => sum + value, 0);
  const grade = gradeForScore(total, 300);
  if (finished) return <div className="py-7 text-center font-serif-jp"><p className="text-[10px] tracking-[.3em] text-neutral-500">PORTFÓLIO DA AULA</p><p className="mt-3 font-title text-7xl text-amber-100">{grade}</p><p className="mt-2 text-sm text-neutral-300">{total}/300 pontos · três estudos concluídos</p><button className="inspection-action mt-7" onClick={() => onDone(total, 300, grade)}>Guardar os quadros →</button></div>;
  return <div className="-mx-2 font-serif-jp sm:-mx-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-neutral-700 bg-[#151515] px-4 py-3"><div><p className="text-[10px] tracking-[.25em] text-amber-300">QUADRO {round + 1}/3 · {current.title}</p><p className="mt-1 text-sm text-neutral-200">{current.prompt}</p></div><div className="text-right"><span className={`font-mono text-2xl ${seconds <= 10 ? 'text-red-300' : 'text-neutral-100'}`}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span><p className="text-[9px] tracking-widest text-neutral-500">TEMPO RESTANTE</p></div></div>
    <div className="overflow-hidden rounded-lg border border-neutral-700 bg-[#29251f] shadow-[0_12px_35px_rgba(0,0,0,.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/40 bg-[#37322b] px-3 py-2"><div className="flex flex-wrap items-center gap-1.5">{PAINT_COLORS.map(({ name, color }) => <button key={color} title={name} aria-label={`Tinta: ${name}`} onClick={() => { setSelected(color); setIsEraser(false); }} className={`h-7 w-7 rounded-full border-2 shadow ${selected === color && !isEraser ? 'border-white ring-2 ring-amber-300/60' : 'border-black/60'}`} style={{ backgroundColor: color }} />)}</div><div className="flex items-center gap-2"><label className="text-[9px] tracking-widest text-neutral-300">PINCEL <input aria-label="Tamanho do pincel" type="range" min="3" max="34" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="ml-2 w-20 align-middle accent-amber-300" /></label><button onClick={() => setIsEraser((value) => !value)} className={`border px-2 py-1 text-[10px] ${isEraser ? 'border-white bg-white/15 text-white' : 'border-neutral-600 text-neutral-300'}`}>BORRACHA</button><button onClick={clearCanvas} className="border border-neutral-600 px-2 py-1 text-[10px] text-neutral-300">LIMPAR</button></div></div>
      <div className="bg-[#e9dfc9] p-2 sm:p-4"><canvas ref={canvasRef} width={1200} height={680} aria-label={`Tela de pintura livre: ${current.title}`} onPointerDown={paintStart} onPointerMove={paintMove} onPointerUp={(event) => { drawingRef.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drawingRef.current = false; }} className="block h-[42vh] min-h-64 max-h-[31rem] w-full touch-none cursor-crosshair bg-[#f4eddd] shadow-inner" /></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/40 bg-[#37322b] px-3 py-2"><span className="text-[9px] tracking-[.16em] text-neutral-400">ARRASTE O PINCEL SOBRE A TELA · {isEraser ? 'BORRACHA ATIVA' : `COR ${PAINT_COLORS.find((paint) => paint.color === selected)?.name ?? 'PERSONALIZADA'}`}</span><button onClick={finishRound} className="border border-amber-200/70 bg-amber-100 px-5 py-2 text-xs font-bold tracking-[.2em] text-[#292117] transition hover:bg-white">PRONTO · PRÓXIMO QUADRO →</button></div>
    </div>
  </div>;
};

const COOKING_MOMENTS = [
  'Seu pai sempre dizia que macarrão era a comida perfeita para quando a gente precisava conversar.',
  'Ele mexia o molho devagar e me contava tudo o que tinha acontecido no trabalho.',
  'Seu avô ensinou a ele esta receita. Os dois discutiam sobre quanto alho colocar.',
  'Sinto falta de ouvir a chave do seu pai na porta e os dois rindo na cozinha.',
  'Também sinto falta do seu avô. Há noites em que ainda guardo lugar para ele à mesa.',
  'Obrigada por me ouvir falar deles, querida. Às vezes a saudade precisa de companhia.',
  'Está pronto. Vamos jantar juntas, como fazíamos quando eles estavam aqui.',
];
const CookingGame: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [stirs, setStirs] = useState(0);
  const [feedback, setFeedback] = useState('A avó deixou os ingredientes separados. Vamos preparar o macarrão juntas.');
  const steps = [
    { id: 'water', name: 'Encher a panela', target: 'Abra a torneira para encher a panela de água.' },
    { id: 'salt', name: 'Temperar', target: 'Pegue o saleiro e tempere a água.' },
    { id: 'pasta', name: 'Adicionar o macarrão', target: 'Coloque o macarrão na panela.' },
    { id: 'stir', name: 'Mexer o molho', target: `Mexa o molho devagar (${stirs}/3).` },
    { id: 'drain', name: 'Escorrer', target: 'Use o escorredor junto à pia.' },
    { id: 'serve', name: 'Servir', target: 'Sirva o jantar nos dois pratos.' },
  ];
  const perform = (action: string) => {
    const expected = steps[step]?.id;
    if (action !== expected) { setFeedback('A avó aponta para o próximo utensílio: ' + (steps[step]?.name ?? 'o jantar')); return; }
    soundManager.playClockTick();
    if (action === 'stir' && stirs < 2) { setStirs((count) => count + 1); setFeedback(COOKING_MOMENTS[Math.min(step + stirs, COOKING_MOMENTS.length - 1)]); return; }
    const next = step + 1;
    setStep(next); setStirs(0);
    setFeedback(COOKING_MOMENTS[Math.min(next, COOKING_MOMENTS.length - 1)]);
  };
  const current = steps[step];
  return <div className="font-serif-jp">
    <div className="mb-3 flex items-center justify-between"><span className="text-[10px] tracking-[.25em] text-amber-300">COZINHA · PREPARO DO JANTAR</span><span className="text-xs text-neutral-400">{Math.min(step, steps.length)}/{steps.length}</span></div>
    <div className="relative mx-auto h-64 max-w-2xl overflow-hidden rounded-lg border border-amber-900/60 bg-gradient-to-b from-[#28313b] via-[#4a3730] to-[#34251f] shadow-inner sm:h-72">
      <div className="absolute inset-x-0 top-0 h-10 border-b border-white/10 bg-[#46515a]" />
      <div className="absolute left-[7%] top-5 h-8 w-16 border-4 border-[#bfcbd0] bg-sky-200/20" />
      <div className="absolute left-[30%] top-4 grid grid-cols-3 gap-1"><span className="h-4 w-4 rounded-full bg-[#d6c3a0]"/><span className="h-4 w-4 rounded-full bg-[#d6c3a0]"/><span className="h-4 w-4 rounded-full bg-[#d6c3a0]"/><span className="mx-auto h-5 w-5 rounded-full bg-[#d6c3a0]"/></div>
      <div className="absolute inset-x-0 bottom-0 h-16 border-t-4 border-[#8a6246] bg-[#614737]" />
      <button onClick={() => perform('water')} className={`absolute left-[8%] top-[46%] grid h-14 w-16 place-items-center rounded border text-xs ${current?.id === 'water' ? 'border-sky-200 bg-sky-900/70 text-white animate-pulse' : 'border-white/15 bg-black/25 text-neutral-300'}`} aria-label="Torneira da pia">PIA<br/>🚰</button>
      <button onClick={() => perform('salt')} className={`absolute left-[31%] top-[51%] grid h-12 w-12 place-items-center rounded border text-xs ${current?.id === 'salt' ? 'border-amber-100 bg-amber-800/70 text-white animate-pulse' : 'border-white/15 bg-black/25 text-neutral-300'}`} aria-label="Saleiro">🧂<br/>SAL</button>
      <button onClick={() => perform('pasta')} className={`absolute left-[46%] top-[53%] grid h-12 w-16 place-items-center rounded border text-xs ${current?.id === 'pasta' ? 'border-amber-100 bg-amber-800/70 text-white animate-pulse' : 'border-white/15 bg-black/25 text-neutral-300'}`} aria-label="Pacote de macarrão">▤<br/>MASSA</button>
      <button onClick={() => perform('stir')} className={`absolute left-[64%] top-[43%] grid h-20 w-20 place-items-center rounded-full border-4 text-xs shadow-lg ${current?.id === 'stir' ? 'border-orange-200 bg-orange-800/75 text-white animate-pulse' : 'border-neutral-500 bg-neutral-800 text-neutral-300'}`} aria-label="Mexer a panela"><span className="text-2xl">{step >= 3 ? '🍝' : '♨'}</span><span>PANELA</span></button>
      <button onClick={() => perform('drain')} className={`absolute left-[8%] top-[72%] grid h-10 w-20 place-items-center rounded border text-[10px] ${current?.id === 'drain' ? 'border-sky-100 bg-sky-900/70 text-white animate-pulse' : 'border-white/15 bg-black/30 text-neutral-300'}`} aria-label="Escorredor">ESCORREDOR</button>
      <button onClick={() => perform('serve')} className={`absolute right-[9%] top-[70%] grid h-12 w-24 place-items-center rounded border text-[10px] ${current?.id === 'serve' ? 'border-emerald-100 bg-emerald-900/70 text-white animate-pulse' : 'border-white/15 bg-black/30 text-neutral-300'}`} aria-label="Pratos">{step >= 5 ? '🍽️ JANTAR' : 'DOIS PRATOS'}</button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] tracking-[.25em] text-amber-100/55">AVÓ CHIYO · GABRIELA · WATSON</div>
    </div>
    <p className="mt-3 text-center text-sm text-amber-100">{current?.target ?? 'O jantar está servido.'}</p>
    <div className="mt-3 min-h-16 border-l border-amber-700/70 bg-amber-950/20 px-3 py-2 text-sm italic leading-relaxed text-amber-100/90"><span className="mb-1 block text-[9px] not-italic tracking-[.25em] text-amber-500">{step ? 'CHIYO, ENQUANTO COZINHAM' : 'GABRIELA'}</span>{feedback}</div>
    {step >= steps.length && <div className="pt-4 text-right"><button onClick={onDone} className="inspection-action">Sentar para jantar →</button></div>}
  </div>;
};

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
  art: [],
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
  art: 'Artes',
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

const BedMakingGame: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [done, setDone] = useState<string[]>([]);
  const steps = [
    { id: 'sheet', label: 'Estique o lençol', x: '19%', y: '65%' },
    { id: 'pillow', label: 'Ajeite os travesseiros', x: '76%', y: '24%' },
    { id: 'blanket', label: 'Dobre o cobertor', x: '53%', y: '75%' },
  ];
  const mark = (id: string) => {
    soundManager.playClockTick();
    setDone((prev) => prev.includes(id) ? prev : [...prev, id]);
  };
  const sheet = done.includes('sheet'); const pillows = done.includes('pillow'); const blanket = done.includes('blanket');
  return <div className="font-serif-jp">
    <div className="mb-3 flex items-center justify-between text-[10px] tracking-[0.22em] text-neutral-400"><span>RITUAL DA MANHÃ</span><span>{done.length}/3</span></div>
    <div className="relative mx-auto aspect-[1.05/1] w-full max-w-[25rem] overflow-hidden rounded-xl border border-amber-900/60 bg-[radial-gradient(ellipse_at_center,#65503d_0%,#30251f_74%)] p-4 shadow-inner">
      <svg viewBox="0 0 32 29" className="absolute inset-0 h-full w-full" role="img" aria-label="Sprite pixel art da cama de Gabriela" shapeRendering="crispEdges">
        <rect x="2" y="3" width="28" height="23" fill="#392a2b"/>
        <rect x="4" y="2" width="24" height="2" fill="#17171c"/><rect x="5" y="1" width="22" height="1" fill="#72505a"/>
        <rect x="5" y="4" width="22" height="18" fill="#b7a68f"/><rect x="6" y="5" width="20" height="16" fill="#e1d5bd"/>
        <rect x="3" y="21" width="26" height="2" fill="#704b3d"/><rect x="5" y="23" width="3" height="3" fill="#34231f"/><rect x="24" y="23" width="3" height="3" fill="#34231f"/>
        <rect x="7" y="6" width="8" height="4" fill="#d9d4c8"/><rect x="17" y="6" width="8" height="4" fill="#d9d4c8"/>
        {!pillows && <><rect x="6" y="6" width="4" height="1" fill="#a99c8e"/><rect x="13" y="8" width="2" height="1" fill="#aaa092"/><rect x="18" y="5" width="2" height="1" fill="#aaa092"/><rect x="22" y="9" width="4" height="1" fill="#a99c8e"/></>}
        {pillows && <><rect x="8" y="6" width="6" height="1" fill="#fff0d6"/><rect x="18" y="6" width="6" height="1" fill="#fff0d6"/><rect x="9" y="8" width="4" height="1" fill="#c7bba8"/><rect x="19" y="8" width="4" height="1" fill="#c7bba8"/></>}
        <rect x="6" y="10" width="20" height="10" fill={blanket ? '#70404d' : '#89515b'}/>
        {!sheet && <><rect x="7" y="10" width="3" height="2" fill="#eee6d4"/><rect x="12" y="11" width="3" height="2" fill="#d7d0c2"/><rect x="18" y="10" width="3" height="2" fill="#f0e7d4"/><rect x="23" y="11" width="3" height="2" fill="#d7d0c2"/></>}
        {!blanket && <><rect x="8" y="13" width="4" height="2" fill="#a36d72"/><rect x="15" y="12" width="3" height="3" fill="#513443"/><rect x="21" y="14" width="4" height="2" fill="#a36d72"/><rect x="11" y="17" width="5" height="1" fill="#392b38"/><rect x="19" y="18" width="4" height="1" fill="#392b38"/></>}
        {blanket && <><rect x="8" y="12" width="16" height="1" fill="#c48b86"/><rect x="8" y="16" width="16" height="1" fill="#513443"/><rect x="10" y="13" width="1" height="3" fill="#d5a19a"/><rect x="15" y="13" width="1" height="3" fill="#d5a19a"/><rect x="20" y="13" width="1" height="3" fill="#d5a19a"/></>}
        <rect x="5" y="20" width="22" height="1" fill="#382c34"/><rect x="10" y="24" width="12" height="1" fill="#1d1b20"/>
        <rect x="2" y="27" width="5" height="1" fill="#a94b51"/><rect x="25" y="27" width="5" height="1" fill="#a94b51"/>
      </svg>
      {steps.map((step) => {
        const checked = done.includes(step.id);
        return <button key={step.id} onClick={() => mark(step.id)} disabled={checked} className={`absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center border text-xs shadow-lg transition-all ${checked ? 'border-emerald-200/80 bg-emerald-950/80 text-emerald-100' : 'border-amber-100/80 bg-black/65 text-amber-50 hover:scale-110 hover:bg-amber-950/90'}`} style={{ left: step.x, top: step.y }} aria-label={step.label} title={step.label}>{checked ? '✓' : '✦'}</button>;
      })}
    </div>
    {done.length === steps.length && <div className="pt-4 text-right"><button onClick={onDone} className="inspection-action">Cama arrumada →</button></div>}
  </div>;
};

const PIXEL_ROWS: Record<(typeof BAG)[number]['id'], string[]> = {
  bio: ['..AAAA..','.ABBBBA.','.ACCCBA.','.ACDDCA.','.ACCCBA.','.ACCCBA.','.ABBBBA.','..AAAA..'],
  math: ['...AA...','..ABA...','.ABBA...','ABBBBBA.','ACCCCBBA','ABDDDDA.','.AAAAAA.','..AAAA..'],
  chem: ['..AA..AA','..AA..AA','...AAAA.','..ACCCA.','.ACCCCA.','.ACDDCA.','..ABBA..','...AA...'],
  phys: ['.AAAAAA.','.ABBBBBA','.ACCCBBA','.ACDDBBA','.ACCCBBA','.ABBBBBA','.AAAAAAA','..AAAA..'],
  case: ['........','AAAAAAA.','ABBBBBBA','ACCCCCCA','ACDDDDCA','ACCCCCCA','ABBBBBBA','AAAAAAAA'],
  calc: ['.AAAAAA.','.ABBBBBA','.ACCCBBA','.ACDDCBA','.ACCCBBA','.ABDBBBA','.ACCCBBA','.AAAAAAA'],
  wallet: ['..AAAA..','.ABBBBA.','ABCCCCBA','ACDDDDCA','ACCCCCCA','ABBBBBBA','.AAAAAA.','..AAAA..'],
  phone: ['..AAAA..','.ABBBBA.','.ACCCCA.','.ACDDCA.','.ACDDCA.','.ACCCCA.','.ABBBBA.','..AAAA..'],
  bottle: ['...AA...','..ABBA..','..ACCA..','.ACCCCA.','.ACDDCA.','.ACCCCA.','.ABBBBA.','..AAAA..'],
  umbrella: ['..AAAA..','.ABBBBA.','ACCCCCCA','ACCCCCCA','..ACCA..','..ACCA..','...ACA..','....A...'],
  keys: ['..AAAA..','.ABBBBA.','.ACCCCA.','..AA.AA.','...A.AA.','...AAAA.','.....AA.','.....AA.'],
};
const PixelArtItem: React.FC<{ id: (typeof BAG)[number]['id']; size?: number }> = ({ id, size = 42 }) => {
  const palettes: Record<string, Record<string, string>> = {
    bio: { A: '#171820', B: '#547a91', C: '#e4d2a9', D: '#394657' }, math: { A: '#171820', B: '#d2bd85', C: '#f0e9d5', D: '#7894aa' },
    chem: { A: '#171820', B: '#738f72', C: '#b4d39b', D: '#45604d' }, phys: { A: '#171820', B: '#6d688f', C: '#e6d8c3', D: '#413c60' },
    case: { A: '#171820', B: '#8d5b4a', C: '#dda46a', D: '#503432' }, calc: { A: '#171820', B: '#666c75', C: '#7bc5b0', D: '#303944' },
    wallet: { A: '#171820', B: '#9c5945', C: '#d8a465', D: '#60392d' }, phone: { A: '#171820', B: '#353b4e', C: '#76c2bd', D: '#222632' },
    bottle: { A: '#171820', B: '#54806a', C: '#b0d4a0', D: '#324c40' }, umbrella: { A: '#171820', B: '#59628f', C: '#c7a7a4', D: '#373e65' }, keys: { A: '#171820', B: '#c29a50', C: '#f0d486', D: '#77592d' },
  };
  return <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">{PIXEL_ROWS[id].flatMap((row, y) => [...row].map((pixel, x) => pixel === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={palettes[id][pixel]} />))}</svg>;
};
const ITEM_POSITIONS = [[6,9],[27,12],[51,8],[77,13],[14,40],[39,36],[65,41],[88,38],[9,69],[38,70],[72,68]] as const;

const BagPackingGame: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [packed, setPacked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const packedRef = useRef(new Set<string>());
  const pack = (id: string) => {
    if (!BAG.some((item) => item.id === id) || packedRef.current.has(id)) return;
    packedRef.current.add(id); soundManager.playClockTick(); setPacked((items) => [...items, id]); setSelected(null);
  };
  const drop = (event: React.DragEvent) => { event.preventDefault(); setHovering(false); pack(event.dataTransfer.getData('text/plain')); };
  const complete = packed.length === BAG.length;
  return <div className="grid gap-5 font-serif-jp md:grid-cols-[1.05fr_0.95fr]">
    <section>
      <p className="mb-3 flex justify-between text-[10px] tracking-[0.2em] text-neutral-400"><span>PREPARO ESCOLAR</span><span>{packed.length}/{BAG.length}</span></p>
      <div className="relative min-h-[18rem] overflow-hidden rounded-xl border border-amber-900/60 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.025)_0_2px,transparent_2px_34px),linear-gradient(145deg,#594332,#35271f_55%,#594333)] shadow-inner">
        <div className="absolute inset-x-0 top-3 text-center text-[9px] tracking-[0.3em] text-amber-100/40">QUARTO · ANTES DA AULA</div>
        {BAG.map((item, index) => {
          if (packed.includes(item.id)) return null;
          const [x, y] = ITEM_POSITIONS[index];
          return <button key={item.id} draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; }} onClick={() => setSelected(item.id)}
            className={`absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg text-amber-50 drop-shadow-[0_3px_3px_rgba(0,0,0,.9)] transition hover:scale-110 ${selected === item.id ? 'bg-amber-950/75 ring-1 ring-amber-200' : 'hover:bg-black/30'}`}
            style={{ left: `${x}%`, top: `${y}%` }} aria-label={`Selecionar ${item.label}`} title={item.label}><PixelArtItem id={item.id} size={46} /></button>;
        })}
      </div>
      <p className="mt-3 text-[10px] text-neutral-500">Arraste cada objeto até a mochila aberta ou selecione-o e clique na bolsa.</p>
    </section>
    <section onDragOver={(event) => { event.preventDefault(); setHovering(true); }} onDragLeave={() => setHovering(false)} onDrop={drop} onClick={() => selected && pack(selected)}
      onKeyDown={(event) => { if (selected && (event.key === 'Enter' || event.key === ' ')) pack(selected); }} role="button" tabIndex={0} aria-label="Mochila aberta: solte aqui os itens selecionados"
      className={`relative flex min-h-[18rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border p-4 transition-colors ${hovering || selected ? 'border-amber-300 bg-amber-950/50' : 'border-amber-900/60 bg-[radial-gradient(ellipse_at_center,#70573e,#35271f_72%)]'}`}>
      <div className="absolute inset-x-0 top-3 text-center text-[9px] tracking-[0.3em] text-amber-100/45">MOCHILA ABERTA NO CHÃO</div>
      <svg viewBox="0 0 24 20" className="absolute inset-x-3 bottom-6 h-[78%] w-[calc(100%-1.5rem)] drop-shadow-[0_14px_14px_rgba(0,0,0,.65)]" aria-hidden="true" shapeRendering="crispEdges">
        <rect x="2" y="6" width="2" height="10" fill="#201a1b"/><rect x="4" y="4" width="2" height="12" fill="#4a302c"/><rect x="18" y="4" width="2" height="12" fill="#4a302c"/><rect x="20" y="6" width="2" height="10" fill="#201a1b"/>
        <rect x="5" y="3" width="14" height="2" fill="#17181d"/><rect x="4" y="5" width="16" height="10" fill="#7b493e"/><rect x="5" y="6" width="14" height="8" fill="#a7614e"/>
        <rect x="6" y="6" width="12" height="7" fill="#322832"/><rect x="7" y="7" width="10" height="5" fill="#25232c"/>
        <rect x="6" y="4" width="2" height="2" fill="#d9a36c"/><rect x="8" y="5" width="8" height="1" fill="#edc28a"/><rect x="16" y="4" width="2" height="2" fill="#d9a36c"/>
        <rect x="8" y="2" width="8" height="2" fill="#9b6047"/><rect x="10" y="1" width="4" height="1" fill="#c17d59"/>
        <rect x="7" y="13" width="10" height="3" fill="#684037"/><rect x="8" y="14" width="8" height="1" fill="#d6a16a"/><rect x="10" y="13" width="4" height="2" fill="#d6a16a"/>
        <rect x="10" y="7" width="4" height="3" fill="#be9a65"/><rect x="11" y="8" width="2" height="1" fill="#f1d7a6"/>
        <rect x="8" y="16" width="2" height="2" fill="#36251f"/><rect x="14" y="16" width="2" height="2" fill="#36251f"/><rect x="3" y="17" width="18" height="1" fill="#17171c"/>
      </svg>
      <div className="absolute left-[33%] top-[43%] grid w-[34%] grid-cols-4 place-items-center gap-x-1 gap-y-0.5">
        {packed.map((id) => <span key={id} className="rounded bg-black/45 p-0.5" title={BAG.find((item) => item.id === id)?.label}><PixelArtItem id={id as (typeof BAG)[number]['id']} size={27}/></span>)}
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
  if (activity === 'bed') body = <BedMakingGame onDone={() => finish('A cama está arrumada.')} />;
  if (activity === 'desk') body = <ChecklistGame items={DESK} successLine="Mesa organizada." onDone={() => finish('A escrivaninha está organizada.')} />;
  if (activity === 'bag') body = <BagPackingGame onDone={() => finish('A mochila está pronta.')} />;
  if (activity === 'uniform') body = <ChecklistGame items={[{ id: 'uniform', label: 'Trocar de roupa e dobrar o pijama' }]} successLine="Pronto." onDone={() => finish('Uniforme preparado.')} />;
  if (activity === 'watson') body = <ChecklistGame items={WATSON} successLine="Bom garoto." onDone={() => finish('Watson foi alimentado.')} />;
  if (activity === 'cooking') body = <CookingGame onDone={() => finish('O jantar está pronto.')} />;
  if (activity === 'art') body = <PaintingGame onDone={(score, total, grade) => finish(`Aula de artes concluída — nota ${grade} (${score}/${total}).`, { score, total, grade })} />;
  if (activity === 'biology' || activity === 'math' || activity === 'chemistry' || activity === 'physics') {
    body = <Quiz subject={activity} onDone={(score, total) => {
      const grade = gradeForScore(score, total);
      finish(`${TITLES[activity]} concluída — nota ${grade} (${score}/${total}).`, { score, total, grade });
    }} />;
  }

  return (
    <Panel title={TITLES[activity] ?? 'Atividade'} jp="æ—¥å¸¸" onClose={onClose} width={activity === 'art' ? 'max-w-6xl' : activity === 'bed' || activity === 'bag' ? 'max-w-4xl' : 'max-w-xl'} surfaceClassName={activity === 'bed' || activity === 'bag' ? 'minigame-pixel-panel' : ''}>
      {body}
    </Panel>
  );
};
