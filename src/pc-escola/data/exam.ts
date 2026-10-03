import { normalize } from '../os/utils';

export interface ExamQ {
  q: string;
  check: (text: string, original: string) => boolean;
}

const clean = (text: string) => normalize(text).replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim();

function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = next;
  }
  return prev[b.length];
}

// Accept complete sentences, excerpts pasted from a site, common spellings,
// accents and a small typo in the important word. Short generic words are
// never fuzzy-matched, so "9" cannot accidentally count as "34".
function says(text: string, ...concepts: string[]): boolean {
  const words = text.split(' ');
  return concepts.some((concept) => {
    const term = clean(concept);
    if (term.includes(' ')) return ` ${text} `.includes(` ${term} `);
    return words.some((word) => {
      if (word === term || (term.length >= 4 && word.startsWith(term))) return true;
      const tolerance = term.length >= 8 ? 2 : term.length >= 5 ? 1 : 0;
      return tolerance > 0 && Math.abs(word.length - term.length) <= tolerance && distance(word, term) <= tolerance;
    });
  });
}

export const EXAM_QUESTIONS: ExamQ[] = [
  {
    q: 'Em poucas palavras: o que Yamāntaka significa no dicionário?',
    check: (t) =>
      says(t, 'fim da morte', 'aquele que faz acabar', 'faz a morte acabar', 'destruidor da morte', 'conquistador da morte') ||
      (says(t, 'morte', 'yama') && says(t, 'fim', 'termin', 'acab', 'encerr', 'venc', 'conquist', 'destruid')),
  },
  {
    q: 'Quem assume a forma de Yamāntaka na lenda?',
    check: (t) => says(t, 'manjushri', 'manjusri', 'mandjusri', 'manjushree') || (says(t, 'bodhisattva', 'bodisatva') && says(t, 'sabedoria')),
  },
  {
    q: 'Quantos braços tem Yamāntaka Ekavira? Só o número já serve.',
    check: (t) => says(t, '34', 'trinta e quatro', 'trinta quatro', 'trinta e 4', 'trinta 4'),
  },
  {
    q: 'Qual é o nome japonês de Yamāntaka?',
    check: (t, original) => original.includes('大威徳明王') || says(t, 'daiitoku', 'daitoku', 'dai itoku', 'dai toku'),
  },
  {
    q: 'Em que animal Daiitoku aparece montado no museu de Kyoto?',
    check: (t) => says(t, 'boi', 'touro', 'vaca', 'bovino', 'bufalo', 'cow', 'bull'),
  },
  {
    q: 'Qual objeto Yama tem no peito e o Yamāntaka não tem?',
    check: (t) => says(t, 'roda', 'disco', 'circulo', 'circle'),
  },
  {
    q: 'Segundo o Centro de Dharma, o que alguém precisa receber antes de praticar?',
    check: (t) => says(t, 'iniciacao', 'abhiseka', 'abhisheka', 'mestre', 'lama', 'guru', 'linhagem'),
  },
  {
    q: 'O blog Darshana chama Yamāntaka de "____ da morte". Qual palavra ele usa?',
    check: (t) => says(t, 'devorador', 'devorar', 'devora', 'comedor'),
  },
  {
    q: 'Para o moderador do fórum, o "ritual" do blog é real ou invenção?',
    check: (t) => says(t, 'ficcao', 'ficticio', 'invencao', 'inventad', 'invento', 'falso', 'mentira', 'golpe', 'engenharia social', 'nao existe', 'nao e real', 'nao era real', 'nao e verdadeiro'),
  },
  {
    q: 'O que aconteceu com Aoyagi R. no fim de 2003?',
    check: (t) => says(t, 'transferid', 'desativad', 'mudou de escola', 'foi para outra escola', 'foi embora', 'saiu da escola', 'trocou de escola'),
  },
];

export const EXAM_INTRO =
  'Então. Você pesquisou. Quero saber se leu de verdade.\n\nDez perguntas curtas. Pode responder com UMA palavra, um número, uma frase sua ou copiar um trecho dos sites e colar aqui (Ctrl+C / Ctrl+V). Não precisa escrever exatamente do meu jeito.\n\nCada pergunta aceita uma resposta. Não dá para pular: se errar, seguimos direto para a próxima sem mostrar a solução. No fim, se não chegar a sete acertos, poderá refazer as dez perguntas. Vamos começar.';

/** pay-off file: the stranger rewards her once she passes. */
export const EXAM_PASS_FILE_NAME = 'arquivo_para_Gabriela.txt';

export const EXAM_PASS_FILE_CONTENT = `--. . .. . / -.-. .-- / --- -.. . .--- -. .-- . / --- -.. . .--. .- / . -. --.- / .-- .--- -.- / -.. . .--. -.- / ... .-- --..-- / -..- -.- --. --.- / -.. -.- --.. -.- / --. . .. . / .--. -.- / --- -.. . .--. .-- --- -.. / ... .-- --. .- / ..-. .-- .--- .-- . .-.-.- / --- -.- .--- -.- / ..- --.- .. .- --. .-- -. .-- --- .-- .. .- .--. .- --..-- / -..- -.- --. --.- / .--- . / .-- . / .--- . / --. . .--. .-- / -.. / -.-. .-- / / .--. -.- / -.- .. -.- --.- / ..- -.- .-.-.- / -..- -.- --. --.- / ... .-- / --. .- --- --- -.. . .--. .- / ... .-- -. --.- . / .--- . .--- -.-. .- .--- / ..-. .-- .--- .-- . / / .--. .-- --.. .-- / .--- -.- / .--. -.- .. -.- --.. .-- -.-- -.. . / --- .-- .-.-.-`;

export function examQuestionText(i: number): string {
  const q = EXAM_QUESTIONS[i];
  return `Pergunta ${i + 1} de ${EXAM_QUESTIONS.length}:\n\n${q.q}`;
}

export function examCheck(i: number, answer: string): boolean {
  const q = EXAM_QUESTIONS[i];
  return !!q && q.check(clean(answer), answer);
}

/**
 * A remark he writes *after* reading the answer — the player sees the grade
 * through his typing, not through a progress widget.
 */
export function examRemark(i: number, ok: boolean, remaining: number): string {
  if (!ok) return remaining === 0 ? 'Não. Essa era a última pergunta.' : 'Não. Vamos à próxima.';
  const rightNow = [
    'Exato.',
    'Certo.',
    'É isso.',
    'Correto.',
    'Agora sim.',
    'Você leu com jeito.',
    'Bom. Continue assim.',
    'Vou guardar essa resposta.',
  ];
  return `${rightNow[i % rightNow.length]}${remaining === 0 ? '' : ` ${remaining === 1 ? 'Falta uma pergunta.' : `Faltam ${remaining} perguntas.`}`}`;
}

export function examResult(score: number): { passed: boolean } {
  return { passed: score >= 7 };
}

export const EXAM_PASS_INTRO =
  'Mínimo suficiente: sete de dez. Você leu o suficiente para entender o que essa rede canta.\n\nEstava em Documentos da sua conta agora. Baixe este arquivo. Ele é baixo, é somente texto, e eu não toco em nada se você abrir agora — ainda hoje, na aula livre, com o professor longe.';

export const EXAM_FINAL_MSG =
  'manha de noite tente fugir sem deixar rastros e venha falar comigo por esse mesmo computador as 21:45';
