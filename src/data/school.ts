// ============================================================
// ESCOLA MUNICIPAL HIGASHIYAMA — KYOTO
// Todo o conteúdo textual, NPCs, salas, aulas e provas.
// ============================================================

export interface SchoolNpc {
  id: string;
  name: string;
  role: string;
  portrait: string;
  speaker: 'Desconhecido' | 'Gabriela' | 'Pensamento' | 'Chiyo (Avó)';
  x: number;
  z: number;
  bubble: string;
  talk: { id: string; speaker: string; speakerTitle?: string; text: string; next?: string; analysis?: string }[];
}

export const SCHOOL_NPCS: SchoolNpc[] = [
  {
    id: 'emi',
    name: 'Emi Takahashi',
    role: 'Colega de classe · 2-B',
    portrait: 'emi',
    speaker: 'Desconhecido',
    x: -4, z: 1.5,
    bubble: 'Gabriela! A prova de Química mudou!',
    talk: [
      { id: 'emi_1', speaker: 'Emi Takahashi', speakerTitle: 'Colega · 2-B', text: 'Gabriela! Você viu que a professora de Química mudou a prova?', next: 'emi_2' },
      { id: 'emi_2', speaker: 'Emi Takahashi', speakerTitle: 'Colega · 2-B', text: 'Para amanhã. Trinta por cento da nota.', next: 'emi_choice' },
    ],
  },
  {
    id: 'ken',
    name: 'Ken',
    role: 'Colega de classe · 2-B',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: 2, z: 1.5,
    bubble: 'Posso copiar a quatro de matemática?',
    talk: [
      { id: 'ken_1', speaker: 'Ken', speakerTitle: 'Colega · 2-B', text: 'Gabriela, você fez a tarefa de Matemática número quatro?', next: 'ken_choice' },
    ],
  },
  {
    id: 'mika',
    name: 'Mika',
    role: 'Colega estudiosa · 2-B',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: 5, z: 1.5,
    bubble: 'Você estudou para Química?',
    talk: [
      { id: 'mika_1', speaker: 'Mika', speakerTitle: 'Colega · 2-B', text: 'Você estudou para a revisão de Química?', next: 'mika_2' },
      { id: 'mika_2', speaker: 'Gabriela', text: 'O suficiente.', next: 'mika_3' },
      { id: 'mika_3', speaker: 'Mika', speakerTitle: 'Colega · 2-B', text: 'Isso não respondeu nada. Mas aposto que vai tirar dez de novo.' },
    ],
  },
  {
    id: 'ryo',
    name: 'Ryo',
    role: 'Colega brincalhão · 2-B',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: 8, z: 1.5,
    bubble: 'Gabriela, você está viva?',
    talk: [
      { id: 'ryo_1', speaker: 'Ryo', speakerTitle: 'Colega · 2-B', text: 'Gabriela, você está viva?', next: 'ryo_2' },
      { id: 'ryo_2', speaker: 'Gabriela', text: 'Infelizmente.', next: 'ryo_3' },
      { id: 'ryo_3', speaker: 'Ryo', speakerTitle: 'Colega · 2-B', text: '...Foi uma piada?', next: 'ryo_4' },
      { id: 'ryo_4', speaker: 'Gabriela', text: 'Não.' },
    ],
  },
  {
    id: 'yumi',
    name: 'Yumi Tanaka',
    role: 'Bibliotecária · 51 anos',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: -8, z: -2.5,
    bubble: 'Gabriela. Bom dia.',
    talk: [
      { id: 'yumi_1', speaker: 'Yumi Tanaka', speakerTitle: 'Bibliotecária · 51', text: 'Gabriela. Bom dia. Você terminou aquele livro?', next: 'yumi_choice' },
    ],
  },
  {
    id: 'reiko',
    name: 'Reiko Arai',
    role: 'Enfermeira',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: -5, z: -2.5,
    bubble: 'Está tudo bem?',
    talk: [
      { id: 'reiko_1', speaker: 'Reiko Arai', speakerTitle: 'Enfermeira', text: 'Está tudo bem, Gabriela? Você parece pálida e com olheiras fundas.', next: 'reiko_choice' },
    ],
  },
  {
    id: 'michiko',
    name: 'Michiko Watanabe',
    role: 'Secretária',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: -2, z: -2.5,
    bubble: 'Sua avó ligou?',
    talk: [
      { id: 'michiko_1', speaker: 'Michiko Watanabe', speakerTitle: 'Secretária', text: 'Gabriela... sua avó Chiyo ligou para a sua casa hoje de manhã?', next: 'michiko_2' },
      { id: 'michiko_2', speaker: 'Gabriela', text: 'Não. Por quê?', next: 'michiko_3' },
      { id: 'michiko_3', speaker: 'Michiko Watanabe', speakerTitle: 'Secretária', text: 'Nada, querida. Achei ter ouvido a voz dela na linha externa por volta das sete... devo ter me enganado.', analysis: 'Ela olhou para o registro telefônico e guardou o bloco de recados com rapidez.' },
    ],
  },
  {
    id: 'hana',
    name: 'Hana Fujimoto',
    role: 'Clube de arte',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: 8, z: -2.5,
    bubble: 'Posso desenhar você?',
    talk: [
      { id: 'hana_1', speaker: 'Hana Fujimoto', speakerTitle: 'Clube de Arte', text: 'Gabriela! Você ficou ótima parada sob a luz da janela. Posso desenhar você?', next: 'hana_choice' },
    ],
  },
  {
    id: 'daichi',
    name: 'Daichi Mori',
    role: 'Clube de futebol',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: 4, z: -2.5,
    bubble: 'Vai ver o jogo na sexta?',
    talk: [
      { id: 'daichi_1', speaker: 'Daichi Mori', speakerTitle: 'Futebol', text: 'Gabriela! Você vai assistir ao nosso amistoso contra Kitano na sexta?', next: 'daichi_choice' },
    ],
  },
  {
    id: 'guard',
    name: 'Zelador do santuário',
    role: 'Funcionário',
    portrait: 'unknown',
    speaker: 'Desconhecido',
    x: -7, z: 2.5,
    bubble: 'O terreno já existia antes da escola.',
    talk: [
      { id: 'guard_1', speaker: 'Pensamento', text: 'É estranho terem um pequeno santuário xintoísta dentro dos limites da escola.', next: 'guard_2' },
      { id: 'guard_2', speaker: 'Zelador', speakerTitle: 'Funcionário', text: 'O terreno sagrado já existia séculos antes de construírem a escola, menina.', next: 'guard_3' },
      { id: 'guard_3', speaker: 'Gabriela', text: 'Quanto tempo exatamente?', next: 'guard_4' },
      { id: 'guard_4', speaker: 'Zelador', speakerTitle: 'Funcionário', text: 'Muito tempo. Tempo suficiente para as pedras terem memória.' },
    ],
  },
];

// Objetos inspecionáveis do cenário
export const SCHOOL_SPOTS = [
  { id: 'getabako', name: 'Armário de sapatos', type: 'EXAMINAR' as const, x: -10, z: 1.5, dialogue: 'getabako_1' },
  { id: 'mural', name: 'Mural de avisos', type: 'EXAMINAR' as const, x: -3, z: 1.5, dialogue: 'mural_1' },
  { id: 'photo1960', name: 'Fotografia antiga (1960)', type: 'EXAMINAR' as const, x: 0, z: 1.5, dialogue: 'photo1960_1' },
  { id: 'wallclock', name: 'Relógio do corredor', type: 'EXAMINAR' as const, x: 6, z: 1.5, dialogue: 'wallclock_1' },
  { id: 'vending', name: 'Máquina de bebidas', type: 'EXAMINAR' as const, x: 10, z: 1.5, dialogue: 'vending_1' },
  { id: 'pc04', name: 'Computador 04', type: 'INSPECIONAR' as const, x: -8, z: -2.5, dialogue: 'pc04_1' },
  { id: 'suspense', name: 'Livro de suspense', type: 'EXAMINAR' as const, x: -8, z: -1.5, dialogue: 'suspense_1' },
  { id: 'parentbook', name: 'Livro dos pais', type: 'EXAMINAR' as const, x: -6, z: -1.5, dialogue: 'parentbook_1' },
  { id: 'piano', name: 'Piano', type: 'EXAMINAR' as const, x: 6, z: -2.5, dialogue: 'piano_1' },
  { id: 'shrine', name: 'Santuário da escola', type: 'EXAMINAR' as const, x: -6, z: 2.5, dialogue: 'guard_1' },
  { id: 'archives', name: 'Arquivo escolar (restrito)', type: 'EXAMINAR' as const, x: 8, z: 2.5, dialogue: 'archives_1' },
];

// Aulas da manhã
export const LESSONS = [
  { id: 'biology', name: 'Biologia', time: '08:10', room: 'Sala 2-B', teacher: 'Ayaka Mori' },
  { id: 'math', name: 'Matemática', time: '10:00', room: 'Sala 2-B', teacher: 'Kenji Sato' },
  { id: 'chemistry', name: 'Química', time: '13:00', room: 'Laboratório de Química', teacher: 'Naomi Fujita' },
  { id: 'physics', name: 'Física', time: '14:30', room: 'Sala 2-B', teacher: 'Hiroshi Nakamura' },
] as const;

export type LessonId = (typeof LESSONS)[number]['id'];

export interface QuizQuestion {
  q: string;
  a: string[];
  correct: number;
}

export const QUIZZES: Record<LessonId, QuizQuestion[]> = {
  biology: [
    { q: 'Qual é a unidade básica da vida?', a: ['Tecido', 'Órgão', 'Célula', 'Sistema'], correct: 2 },
    { q: 'Qual organela está relacionada à produção de energia celular?', a: ['Ribossomo', 'Mitocôndria', 'Núcleo', 'Lisossomo'], correct: 1 },
    { q: 'Onde está armazenada a maior parte do DNA de uma célula eucariótica?', a: ['Núcleo', 'Citoplasma', 'Membrana', 'Ribossomo'], correct: 0 },
    { q: 'Qual sistema transporta sangue pelo corpo?', a: ['Respiratório', 'Digestório', 'Circulatório', 'Nervoso'], correct: 2 },
    { q: 'Qual órgão é responsável pelas trocas gasosas?', a: ['Estômago', 'Pulmão', 'Fígado', 'Rim'], correct: 1 },
    { q: 'Qual célula transporta oxigênio pelo sangue?', a: ['Plaqueta', 'Neurônio', 'Glóbulo vermelho', 'Leucócito'], correct: 2 },
    { q: 'Qual estrutura contém o material genético?', a: ['Núcleo', 'Membrana', 'Vacúolo', 'Citoplasma'], correct: 0 },
  ],
  math: [
    { q: '2x + 6 = 18. Qual é o valor de x?', a: ['x = 5', 'x = 6', 'x = 7', 'x = 8'], correct: 1 },
    { q: '15 × 4', a: ['45', '60', '75', '90'], correct: 1 },
    { q: '144 ÷ 12', a: ['10', '11', '12', '13'], correct: 2 },
    { q: '√81', a: ['7', '8', '9', '10'], correct: 2 },
    { q: '25% de 200 é igual a:', a: ['25', '40', '50', '75'], correct: 2 },
    { q: '20% de desconto em ¥800 resulta em:', a: ['¥600', '¥640', '¥680', '¥720'], correct: 1 },
    { q: 'Complete a sequência: 2, 4, 8, 16, ...', a: ['24', '28', '30', '32'], correct: 3 },
  ],
  chemistry: [
    { q: 'Qual é o símbolo químico do oxigênio?', a: ['O', 'Ox', 'Oxg', 'Og'], correct: 0 },
    { q: 'Qual é o símbolo químico do mercúrio?', a: ['Mc', 'Hg', 'Mr', 'M'], correct: 1 },
    { q: 'Qual o valor do pH neutro?', a: ['0', '5', '7', '14'], correct: 2 },
    { q: 'Qual partícula possui carga negativa?', a: ['Elétron', 'Próton', 'Nêutron', 'Núcleo'], correct: 0 },
    { q: 'O que significa H₂O?', a: ['Água', 'Sal', 'Açúcar', 'Oxigênio'], correct: 0 },
    { q: 'Transformação de substâncias com formação de novas substâncias?', a: ['Física', 'Reação química', 'Fusão', 'Diluição'], correct: 1 },
    { q: 'Elemento usado em balões e muito leve?', a: ['Hélio', 'Hidrogênio', 'Oxigênio', 'Nitrogênio'], correct: 0 },
  ],
  physics: [
    { q: 'Qual é a unidade de força?', a: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 1 },
    { q: 'A aceleração da gravidade na Terra é aproximadamente:', a: ['5,0 m/s²', '9,8 m/s²', '15,0 m/s²', '3,0 m/s²'], correct: 1 },
    { q: 'Qual é a fórmula da velocidade média?', a: ['v = Δs/Δt', 'v = m × a', 'v = F × d', 'v = t/s'], correct: 0 },
    { q: 'Qual força atrai corpos para o centro da Terra?', a: ['Atrito', 'Gravidade', 'Elétrica', 'Nuclear'], correct: 1 },
    { q: 'Qual é a unidade de energia?', a: ['Joule', 'Newton', 'Watt', 'Metro'], correct: 0 },
    { q: 'Uma aceleração positiva significa:', a: ['Aumento da velocidade', 'Diminuição da velocidade', 'Repouso', 'Mudança de direção'], correct: 0 },
    { q: 'Energia associada ao movimento:', a: ['Potencial', 'Térmica', 'Cinética', 'Química'], correct: 2 },
  ],
};

// Grade de notas
export const gradeFor = (score: number, total: number): string => {
  const r = total > 0 ? score / total : 0;
  if (r >= 1) return 'A+';
  if (r >= 0.9) return 'A';
  if (r >= 0.8) return 'A-';
  if (r >= 0.65) return 'B';
  if (r >= 0.5) return 'C';
  if (r >= 0.3) return 'D';
  return 'F';
};
