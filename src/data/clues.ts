import { Clue, EvidenceNode, EvidenceConnection, InventoryItem, InspectionObjectData } from '../types/game';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_wrist_watch',
    name: 'Relógio de Pulso Analógico',
    icon: 'Watch',
    category: 'tool',
    description: 'Relógio britânico de aço cirúrgico. Calibrado diariamente às 06:00 pelo rádio-relógio atômico.',
    detailedDescription: 'Marca precisamente a passagem do tempo. O cristal de safira não possui arranhões. Gabriela confia mais neste instrumento do que nos próprios olhos.',
    modelType: 'clock',
  },
  {
    id: 'inv_notebook',
    name: 'Caderno de Anotações Metódicas',
    icon: 'BookOpen',
    category: 'document',
    description: 'Caderno quadriculado onde Gabriela cataloga horários, incongruências espaciais e hipóteses lógicas.',
    detailedDescription: 'Escrito em caligrafia minúscula e precisa em inglês e japonês. Nenhuma folha amassada.',
  },
  {
    id: 'inv_magnifier',
    name: 'Lupa Forense de Bolso',
    icon: 'Search',
    category: 'tool',
    description: 'Lente óptica 10x com luz LED circular. Essencial para verificar marcas e microinscrições.',
    detailedDescription: 'Utilizada para checar filamentos, marcas de solda e desgaste mecânico em objetos suspeitos.',
  },
];

export const INITIAL_CLUES: Clue[] = [
  {
    id: 'clue_routine_exact',
    title: 'Horário Rigoroso: 06:43',
    category: 'timeline',
    basicInfo: 'Gabriela acorda todos os dias às 06:43. Faltam dezessete minutos para as 07:00, seu horário de descer.',
    detailedInfo: 'O relógio de cabeceira está calibrado. Nenhuma falha de cronometragem detectada no quarto.',
    revealedTiers: 1,
    timeAssociated: '06:43',
  },
];

export const INITIAL_EVIDENCE_NODES: EvidenceNode[] = [
  {
    id: 'node_gabriela',
    title: 'Gabriela (16)',
    category: 'people',
    x: 180,
    y: 80,
    summary: 'Estudante britânica residente em Kyoto. Raciocínio estritamente analítico.',
    isUnlocked: true,
  },
  {
    id: 'node_chiyo',
    title: 'Avó Chiyo (74)',
    category: 'people',
    x: 480,
    y: 80,
    summary: 'Mora na casa há mais de cinquenta anos. Conhece as lendas locais, mas mantém silêncio calculado.',
    isUnlocked: true,
  },
  {
    id: 'node_house',
    title: 'Casa em Kyoto (Machiya)',
    category: 'location',
    x: 180,
    y: 280,
    summary: 'Construção tradicional de madeira com dois andares. Térreo acolhedor, segundo andar silencioso.',
    isUnlocked: true,
  },
  {
    id: 'node_clock_freeze',
    title: 'Inconsistência: 06:43',
    category: 'timeline',
    x: 480,
    y: 280,
    summary: 'O relógio da cozinha permaneceu marcando 06:43 enquanto o relógio de pulso já avançou para 06:44.',
    time: '06:43',
    isUnlocked: false,
  },
  {
    id: 'node_photo_1974',
    title: 'Fotografia de 1974',
    category: 'evidence',
    x: 780,
    y: 180,
    summary: 'Foto antiga com uma silhueta na janela que possui os traços físicos exatos de Gabriela, tirada 34 anos antes de seu nascimento.',
    time: '1974',
    isUnlocked: false,
  },
  {
    id: 'node_time_0317',
    title: 'A Hora Morta: 03:17',
    category: 'timeline',
    x: 780,
    y: 380,
    summary: 'Horário que reaparece no telefone fixo desligado e nos registros de ocorrências antigas de Kyoto.',
    time: '03:17',
    isUnlocked: false,
  },
];

export const INITIAL_CONNECTIONS: EvidenceConnection[] = [];

// Detailed 3D Inspectable Data for objects in the game
export const INSPECTABLE_OBJECTS: Record<string, InspectionObjectData> = {
  bedroom_clock: {
    id: 'bedroom_clock',
    title: 'Relógio de Cabeceira',
    subtitle: 'Quarto da Gabriela — 2º Andar',
    modelType: 'clock',
    dateStr: '06:43 AM',
    rotatable: true,
    zoomable: true,
    hotspots: [
      {
        id: 'clock_face',
        label: 'Visor Numérico',
        position: [0, 0, 0.4],
        observationBasic: 'O visor digital de cristal líquido marca 06:43 com precisão.',
        observationDetailed: 'Ainda faltam dezessete minutos para as 07:00, horário que determinei para descer à cozinha.',
        observationHidden: 'Não há oscilação na voltagem. A bateria é nova.',
        gabrielaMonologue: 'Meu cronograma diário é exato. Dezessete minutos são suficientes para arrumar a cama e organizar a mesa.',
      },
      {
        id: 'clock_base',
        label: 'Base do Aparelho',
        position: [0, -0.4, 0.2],
        observationBasic: 'Base plástica fosca sem marcas de impacto.',
        observationDetailed: 'Alinhada a exatamente 5 centímetros da borda da mesa.',
        gabrielaMonologue: 'Tudo em seu devido lugar geométrico. A desordem é o primeiro sintoma da perda de clareza.',
      },
    ],
    notes: [
      'Horário de despertar: 06:43',
      'Despertador não tocou: acordei 2 minutos antes por condicionamento biológico.',
    ],
  },

  kitchen_clock: {
    id: 'kitchen_clock',
    title: 'Relógio de Parede da Cozinha',
    subtitle: 'Térreo — Acima do Batente',
    modelType: 'clock',
    dateStr: '06:43 AM (Congelado)',
    rotatable: true,
    zoomable: true,
    hotspots: [
      {
        id: 'kitchen_clock_hands',
        label: 'Ponteiros Mecânicos',
        position: [0, 0.1, 0.3],
        observationBasic: 'Ponteiro das horas no 6, ponteiro dos minutos no 43.',
        observationDetailed: 'O meu relógio de pulso marca 06:44. Este relógio marca 06:43.',
        observationHidden: 'O pêndulo interno continua em movimento harmônico simples, mas o sistema de escape parece ignorar a gravidade.',
        unlocksClueId: 'clue_kitchen_clock_anomaly',
        gabrielaMonologue: 'Um erro de engrenagem pode atrasar um relógio. Mas como o escape continua balançando sem transmitir torque aos ponteiros? Isto não faz sentido físico.',
      },
      {
        id: 'kitchen_clock_frame',
        label: 'Moldura de Madeira',
        position: [0.4, -0.2, 0.1],
        observationBasic: 'Madeira escura de cedro japonês (Sugi).',
        observationDetailed: 'A poeira ao redor do prego foi levemente perturbada.',
        gabrielaMonologue: 'Alguém tocou neste relógio recentemente. A avó nega ter mexido.',
      },
    ],
    notes: [
      'Inconsistência temporal detectada: 06:44 (pulso) vs 06:43 (cozinha).',
      'Diferença: 60 segundos de discrepância que não diminuem nem aumentam.',
    ],
  },

  study_photo: {
    id: 'study_photo',
    title: 'Fotografia Antiga em Sépia',
    subtitle: 'Encontrada na Gaveta Trancada do Escritório',
    modelType: 'photo',
    dateStr: '17 de Abril de 1974',
    rotatable: true,
    zoomable: true,
    hotspots: [
      {
        id: 'photo_subject',
        label: 'Silhueta na Janela',
        position: [0.15, 0.25, 0.1],
        observationBasic: 'Uma jovem de pé atrás da vidraça do segundo andar.',
        observationDetailed: 'A jovem usa um suéter de lã com gola alta britânica e o mesmo penteado partido ao meio que eu uso.',
        observationHidden: 'A postura e a proporção anatômica dos ombros são matematicamente indistinguíveis do meu próprio reflexo no espelho.',
        unlocksClueId: 'clue_photo_1974_anomaly',
        gabrielaMonologue: 'Pareidolia? Não. A iluminação de três pontos revela os contornos exatos do meu maxilar. Mas esta foto tem pelo menos meio século de idade.',
      },
      {
        id: 'photo_back',
        label: 'Verso da Fotografia',
        position: [-0.2, -0.3, -0.05],
        observationBasic: 'Verso amarelado pelo tempo.',
        observationDetailed: 'Inscrição manuscrita em nanquim: "17/04/1974 — Kyoto, Casa dos Cedros".',
        observationHidden: 'Abaixo da data, em letra miúda: "Ela continua vigiando as 03:17".',
        unlocksClueId: 'clue_photo_back_note',
        gabrielaMonologue: '03:17 novamente. Uma coincidência estatística repetida três vezes deixa de ser coincidência e torna-se um dado.',
      },
    ],
    notes: [
      'Data da foto: 17 de Abril de 1974.',
      'Sujeito: Garota idêntica a Gabriela aos 16 anos.',
      'Nota no verso: Menção explícita ao horário 03:17.',
    ],
  },

  rotary_phone: {
    id: 'rotary_phone',
    title: 'Telefone Fixo Showa',
    subtitle: 'Mesa Lateral da Sala de Estar',
    modelType: 'recorder',
    dateStr: 'Última Ligação: 03:17 AM',
    rotatable: true,
    zoomable: true,
    hotspots: [
      {
        id: 'phone_dial',
        label: 'Disco Giratório',
        position: [0, 0, 0.3],
        observationBasic: 'Disco numérico analógico com numerais japoneses e ocidentais.',
        observationDetailed: 'Marcas de atrito recente no dígito 3, 1 e 7.',
        gabrielaMonologue: 'O tambor mecânico parou ligeiramente descentralizado no número 7.',
      },
      {
        id: 'phone_cable',
        label: 'Conexão Traseira',
        position: [0, -0.3, -0.2],
        observationBasic: 'O fio enrolado que sai do aparelho.',
        observationDetailed: 'O conector está solto e jogado atrás do aparador. Não há linha telefônica conectada.',
        observationHidden: 'Se o fio está desligado da tomada da concessionária, como ele tocou na madrugada passada?',
        unlocksClueId: 'clue_phone_unplugged',
        gabrielaMonologue: 'Uma campainha de martelo físico requer um pulso elétrico de 90 volts em corrente alternada. Sem cabo, o toque é impossível. Logo, ou sofri uma alucinação auditiva ou uma corrente anômala passou pelo circuito.',
      },
    ],
    notes: [
      'Aparelho desprovido de conexão física à rede.',
      'Horário marcado no contador mecânico: 03:17.',
    ],
  },

  calendar_kyoto: {
    id: 'calendar_kyoto',
    title: 'Calendário de Parede de Kyoto',
    subtitle: 'Corredor do Térreo',
    modelType: 'calendar',
    dateStr: 'Mês Atual',
    rotatable: true,
    zoomable: true,
    hotspots: [
      {
        id: 'cal_circled_days',
        label: 'Datas Circuladas',
        position: [0, 0.1, 0.1],
        observationBasic: 'Vários dias marcados com círculos de caneta vermelha.',
        observationDetailed: 'O dia 17 de cada mês está circulado duas vezes.',
        observationHidden: 'Pequenos kanjis anotados abaixo do dia 17: "霧" (Kiri - Nevoeiro) e "門" (Mon - Portão).',
        unlocksClueId: 'clue_calendar_dates',
        gabrielaMonologue: 'A avó disse que eram datas de consultas médicas. Mas não há médicos especialistas em Kyoto atendendo sempre no mesmo dia 17 sem falha.',
      },
    ],
    notes: [
      'Padronização: Todo dia 17 possui marcação dupla.',
      'Símbolos enigmáticos: Nevoeiro e Portão.',
    ],
  },
};
