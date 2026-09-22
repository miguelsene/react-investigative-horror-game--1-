import { DialogueNode } from '../types/game';

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  // --- PROLOGUE: BEDROOM WAKING UP ---
  intro_bedroom_1: {
    id: 'intro_bedroom_1',
    speaker: 'Pensamento',
    avatar: 'gabriela_calm',
    text: '06:43. Meus olhos se abriram exatamente dezessete minutos antes do alarme programado.',
    gabrielaAnalysis: 'Ciclo circadiano adiantado em 17 minutos. Frequência cardíaca basal: 62 bpm. Pressão atmosférica normal. Sem dor de cabeça.',
    next: 'intro_bedroom_2',
  },
  intro_bedroom_2: {
    id: 'intro_bedroom_2',
    speaker: 'Pensamento',
    avatar: 'gabriela_calm',
    text: 'A chuva suave contra o telhado de telhas cerâmicas de Kyoto começou por volta das 04:15. O cheiro de cedro molhado permeia o quarto.',
    gabrielaAnalysis: 'A casa é silenciosa. Lá embaixo, no térreo, posso ouvir o som metálico da chaleira de ferro (Tetsubin) sendo colocada no fogão.',
    next: 'intro_bedroom_3',
  },
  intro_bedroom_3: {
    id: 'intro_bedroom_3',
    speaker: 'Pensamento',
    avatar: 'gabriela_focus',
    text: 'Preciso me levantar, checar meus pertences na escrivaninha e descer para o café da manhã com a avó Chiyo.',
    gabrielaAnalysis: 'Objetivo imediato: Inspecionar o quarto e descer para o térreo.',
  },

  // --- MORNING CONVERSATION WITH GRANDMOTHER CHIYO ---
  grandma_morning_1: {
    id: 'grandma_morning_1',
    speaker: 'Chiyo (Avó)',
    speakerTitle: '74 anos, Kyoto',
    avatar: 'grandma_warm',
    text: 'Bom dia, Gabriela. Você acordou cedo hoje.',
    soundCue: 'tick',
    options: [
      {
        text: '“São 06:44. Meu horário oficial de descer é 07:00.”',
        nextNodeId: 'grandma_morning_2a',
      },
      {
        text: '“O relógio da cozinha me pareceu estranho quando passei.”',
        nextNodeId: 'grandma_morning_2b',
      },
      {
        text: '“Bom dia, obaasan. O chá já está pronto?”',
        nextNodeId: 'grandma_morning_2c',
      },
    ],
  },
  grandma_morning_2a: {
    id: 'grandma_morning_2a',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_smile',
    text: 'Eu sei, querida.',
    next: 'grandma_morning_3a',
  },
  grandma_morning_3a: {
    id: 'grandma_morning_3a',
    speaker: 'Gabriela',
    avatar: 'gabriela_inquisitive',
    text: 'Se você sabia que eram apenas 06:44, por que afirmou que acordei cedo?',
    next: 'grandma_morning_4a',
  },
  grandma_morning_4a: {
    id: 'grandma_morning_4a',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_gentle',
    text: 'Porque você sempre desce exatamente às 07:00, nem um segundo a mais, nem a menos. Dezesseis minutos em Kyoto às vezes guardam histórias inteiras.',
    gabrielaAnalysis: 'Ela não olhou para o relógio da parede nem para o fogão. Ela sabia do desvio temporal antes mesmo de eu entrar no raio visual da cozinha.',
    next: 'grandma_morning_serve_tea',
  },

  grandma_morning_2b: {
    id: 'grandma_morning_2b',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_quiet',
    text: 'O relógio de madeira? Ah... relógios velhos às vezes se apegam a certos instantes, Gabriela.',
    next: 'grandma_morning_clock_debate',
  },
  grandma_morning_clock_debate: {
    id: 'grandma_morning_clock_debate',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'Relógios são engrenagens de latão, obaasan. Eles não têm memória emocional nem se apegam a nada. Ele marca 06:43 enquanto meu pulso marca 06:44.',
    next: 'grandma_morning_clock_chiyo',
  },
  grandma_morning_clock_chiyo: {
    id: 'grandma_morning_clock_chiyo',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_quiet',
    text: 'Talvez o mundo lá fora corra rápido demais para esta casa. Beba seu chá de bancha quente enquanto ainda está fresco.',
    gabrielaAnalysis: 'Evasão deliberada. Chiyo costuma usar metáforas poéticas sempre que um assunto toca em algo que ela prefere manter em segredo.',
    next: 'grandma_morning_serve_tea',
  },

  grandma_morning_2c: {
    id: 'grandma_morning_2c',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_warm',
    text: 'Sim, acabei de colocar na xícara. Feito com folhas colhidas em Uji. Você tem as aulas no colégio daqui a pouco.',
    next: 'grandma_morning_serve_tea',
  },

  grandma_morning_serve_tea: {
    id: 'grandma_morning_serve_tea',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_warm',
    text: 'Preparei arroz com missoshiru e conserva de ameixa (umeboshi). Coma com calma. Hoje o dia promete ser frio.',
    gabrielaAnalysis: 'A rotina matinal transmite uma aparente normalidade reconfortante. Mas sinto que pequenos detalhes ao redor estão fora de esquadro.',
    options: [
      {
        text: '“Obaasan, onde você guardou os documentos do escritório lá em cima?”',
        nextNodeId: 'grandma_ask_study',
      },
      {
        text: '“Ouvir o telefone tocar de madrugada... você ouviu algo às 03:17?”',
        nextNodeId: 'grandma_ask_phone',
      },
      {
        text: '“Obrigada. Vou comer e depois organizar minhas coisas.”',
        nextNodeId: 'grandma_finish_morning',
      },
    ],
  },

  grandma_ask_study: {
    id: 'grandma_ask_study',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_serious',
    text: 'O escritório do seu avô está como ele deixou. Algumas gavetas antigas estão emperradas. Não mexa nas caixas de cedro do armário, Gabriela.',
    gabrielaAnalysis: 'Tom de voz diminuiu 4 decibéis. Postura dos ombros ficou tensa por exatos 1,8 segundos. Há algo relevante trancado naquele cômodo.',
    next: 'grandma_finish_morning',
  },

  grandma_ask_phone: {
    id: 'grandma_ask_phone',
    speaker: 'Chiyo (Avó)',
    avatar: 'grandma_serious',
    text: 'O telefone da sala está mudo há quase dois anos, Gabriela. A fiação na rua caiu na tempestade do tufão e nunca mandei consertar. Deve ter sido um sonho.',
    soundCue: 'sting',
    gabrielaAnalysis: 'Eu não sonho com sons de campainhas mecânicas com frequência de 420 Hz. Eu estava acordada e anotei o horário exato: 03:17.',
    next: 'grandma_finish_morning',
  },

  grandma_finish_morning: {
    id: 'grandma_finish_morning',
    speaker: 'Pensamento',
    avatar: 'gabriela_focus',
    text: 'Terminei a refeição. A discrepância entre os relógios precisa ser verificada no escritório do segundo andar.',
    gabrielaAnalysis: 'Pista desbloqueada: Verificar o antigo escritório do avô e a gaveta fechada.',
  },

  // --- INSPECTION OF THE HALLWAY MISSING PAINTING ---
  hallway_missing_painting: {
    id: 'hallway_missing_painting',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'A parede do corredor está diferente. O quadro em xilogravura de Hokusai que estava pendurado aqui ontem sumiu.',
    gabrielaAnalysis: 'A marca retangular na madeira tem 40 x 30 cm. A poeira nas bordas comprova que ele esteve afixado por anos, mas foi retirado há menos de 8 horas.',
    soundCue: 'sting',
    options: [
      {
        text: 'Examinar o prego de fixação na parede.',
        nextNodeId: 'hallway_nail_examine',
      },
      {
        text: 'Anotar no caderno investigativo.',
        nextNodeId: 'hallway_note_down',
      },
    ],
  },
  hallway_nail_examine: {
    id: 'hallway_nail_examine',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'O prego de ferro forjado está torto para baixo em um ângulo de 15 graus. Ele não foi retirado com cuidado por uma pessoa idosa; foi arrancado por uma tração brusca.',
    gabrielaAnalysis: 'Quem retirou o quadro agiu com pressa. E por que retirar uma paisagem marítima no meio da madrugada?',
  },
  hallway_note_down: {
    id: 'hallway_note_down',
    speaker: 'Pensamento',
    avatar: 'gabriela_focus',
    text: 'Anotado no diário: Anomalia do Corredor. O espaço físico desta casa está sofrendo subtrações sem explicação comunicada.',
  },

  // --- MYSTERIOUS CALL DIALOGUE (TRIGGERABLE) ---
  phone_call_event: {
    id: 'phone_call_event',
    speaker: 'Pensamento',
    avatar: 'gabriela_shock',
    text: '*TRRRRRRIIIIIIIM! TRRRRRRIIIIIIIM!*',
    soundCue: 'phone',
    gabrielaAnalysis: 'A campainha analógica do telefone na sala tocou duas vezes. Eu verifiquei o cabo: ele continua solto no chão.',
    options: [
      {
        text: 'Atender o fone com cautela.',
        nextNodeId: 'phone_pick_up',
      },
      {
        text: 'Ignorar e analisar a frequência do som.',
        nextNodeId: 'phone_analyze_sound',
      },
    ],
  },
  phone_pick_up: {
    id: 'phone_pick_up',
    speaker: 'Voz no Telefone',
    avatar: 'unknown_shadow',
    text: '... Gabriela ... ? 03:17 ... não olhe para a janela do segundo andar ... a água não corre para baixo ...',
    soundCue: 'static',
    next: 'phone_reaction',
  },
  phone_analyze_sound: {
    id: 'phone_analyze_sound',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'A vibração metálica produziu um pico acústico de 86 decibéis. Ao levantar o gancho, ouço um ruído branco característico de ondas eletromagnéticas atmosféricas.',
    next: 'phone_reaction',
  },
  phone_reaction: {
    id: 'phone_reaction',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'Quem está falando? Este aparelho não está conectado ao ramal da NTT. Identifique-se imediatamente.',
    soundCue: 'static',
    gabrielaAnalysis: 'A linha caiu instantaneamente. Sobrou apenas um estalo estático e um pulso rítmico que lembra uma contagem regressiva.',
  },

  // --- AMBIENT OBSERVATIONS (objects around the house) ---
  look_tv: {
    id: 'look_tv',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'A televisão está ligada em um canal fora do ar. A avó nunca a deixa ligada antes das oito.',
    gabrielaAnalysis: 'O botão de energia está frio. Ela foi ligada há pelo menos quarenta minutos — antes de eu acordar.',
  },
  look_butsudan: {
    id: 'look_butsudan',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'O altar do meu avô. As velas foram acesas há pouco: a cera ainda não formou crosta na borda.',
    gabrielaAnalysis: 'Há dois incensos queimados. A avó acende apenas um por manhã. Sem exceção, nos últimos 214 dias.',
  },
  look_genkan_shoes: {
    id: 'look_genkan_shoes',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'As sandálias de madeira da avó estão molhadas. A chuva começou às 04:15.',
    soundCue: 'tick',
    gabrielaAnalysis: 'Conclusão inevitável: ela saiu de casa durante a madrugada. Ela não mencionou isso.',
  },
  look_tokonoma: {
    id: 'look_tokonoma',
    speaker: 'Gabriela',
    avatar: 'gabriela_calm',
    text: 'O pergaminho diz "Noite Silenciosa". A flor do ikebana foi trocada hoje. Camélia de inverno, cortada com precisão.',
    gabrielaAnalysis: 'O corte é limpo, em ângulo de 45 graus. A mesma técnica de sempre. Isto, ao menos, é consistente.',
  },
  look_furin: {
    id: 'look_furin',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'O furin está tocando.',
    soundCue: 'sting',
    gabrielaAnalysis: 'Não há vento. As folhas do bordo estão imóveis. A tira de papel oscila sozinha.',
  },
  look_breakfast: {
    id: 'look_breakfast',
    speaker: 'Gabriela',
    avatar: 'gabriela_calm',
    text: 'Dois conjuntos de louça. Arroz, missoshiru, umeboshi. Ela pôs a mesa antes de eu descer, como sempre.',
    gabrielaAnalysis: 'A sopa do meu lugar ainda solta vapor. A dela já esfriou. Ela sentou-se aqui por um longo tempo antes de eu chegar.',
  },
  look_corkboard: {
    id: 'look_corkboard',
    speaker: 'Pensamento',
    avatar: 'gabriela_focus',
    text: 'Meu quadro de horários. Cada linha, um dado. Nenhum imprevisto registrado nos últimos 214 dias.',
    gabrielaAnalysis: 'Hoje é o primeiro dia em que o horário de despertar não bate com o previsto. Anotar: 06:43.',
  },
  look_study_clock: {
    id: 'look_study_clock',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'Um segundo relógio parado. Este marca 03:17. O da cozinha, 06:43.',
    soundCue: 'tick',
    gabrielaAnalysis: 'Dois pontos definem uma reta. Preciso de um terceiro relógio para saber se há um padrão ou uma coincidência.',
  },
  look_bedroom_window: {
    id: 'look_bedroom_window',
    speaker: 'Gabriela',
    avatar: 'gabriela_calm',
    text: 'A rua está vazia. Há alguém parado sob o poste... não. É apenas o guarda-chuva esquecido do vizinho.',
    gabrielaAnalysis: 'Correção registrada. A mente preenche silhuetas com pessoas quando está privada de sono. Dormi 6 horas e 12 minutos.',
  },
  look_bathroom: {
    id: 'look_bathroom',
    speaker: 'Gabriela',
    avatar: 'gabriela_inquisitive',
    text: 'Trancada por dentro.',
    soundCue: 'creak',
    gabrielaAnalysis: 'A porta do banheiro só tranca pelo lado de dentro. Há apenas duas pessoas nesta casa, e a avó está na cozinha.',
  },
  look_kimono: {
    id: 'look_kimono',
    speaker: 'Gabriela',
    avatar: 'gabriela_analytical',
    text: 'O kimono da avó está pendurado para secar. A barra está úmida e há lama seca no tecido.',
    gabrielaAnalysis: 'Lama argilosa, avermelhada. Não existe esse solo na nossa rua. Existe nas encostas do santuário.',
  },
  look_front_door: {
    id: 'look_front_door',
    speaker: 'Pensamento',
    avatar: 'gabriela_focus',
    text: 'A porta de entrada. Faltam cinquenta e seis minutos para o horário de saída. Não há razão lógica para abrir agora.',
    gabrielaAnalysis: 'A tranca está fechada. Mas a corrente de segurança está solta — e eu mesma a prendi às 22:40.',
  },
  look_garden: {
    id: 'look_garden',
    speaker: 'Gabriela',
    avatar: 'gabriela_calm',
    text: 'A lanterna de pedra está acesa. Vaga-lumes em abril, sob chuva. Biologicamente improvável.',
    gabrielaAnalysis: 'Improvável não é impossível. Mas a probabilidade acumulada desta manhã já ultrapassou qualquer margem aceitável.',
  },

  /* ============================== CAPÍTULO 1 — 3:17 ============================== */

  // Prólogo, 03:17
  prologue_tick_1: { id: 'prologue_tick_1', speaker: 'Pensamento', avatar: 'gabriela_calm', text: 'Tic.', gabrielaAnalysis: 'Chuva. Um relógio mecânico. Nada além disso.', next: 'prologue_tick_2' },
  prologue_tick_2: { id: 'prologue_tick_2', speaker: 'Pensamento', avatar: 'gabriela_calm', text: 'Tic.', next: 'prologue_paralysis_1' },
  prologue_paralysis_1: {
    id: 'prologue_paralysis_1', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'Não...',
    gabrielaAnalysis: 'Meus olhos abriram. Meu corpo não respondeu.',
    next: 'prologue_paralysis_2',
  },
  prologue_paralysis_2: {
    id: 'prologue_paralysis_2', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'De novo.',
    next: 'prologue_paralysis_3',
  },
  prologue_paralysis_3: {
    id: 'prologue_paralysis_3', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Calma. É só paralisia do sono.',
    gabrielaAnalysis: 'A explicação mais provável. Não a única que eu aceitaria, mas a primeira.',
    next: 'prologue_window',
  },
  prologue_window: {
    id: 'prologue_window', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'A cortina está se movendo.',
    next: 'prologue_figure',
  },
  prologue_figure: {
    id: 'prologue_figure', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'Tem alguém ali.',
    gabrielaAnalysis: 'Parada. Altura de uma pessoa. Não bate com o desenho da cortina.',
    next: 'prologue_deny',
  },
  prologue_deny: {
    id: 'prologue_deny', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'Não. Não pode ter.',
    next: 'prologue_wake',
  },
  prologue_wake: {
    id: 'prologue_wake', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'Acorda. Acorda. Acorda...',
    next: 'morning_wake',
  },

  // Manhã, 06:20
  morning_wake: {
    id: 'morning_wake', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: '06:20. Foi um sonho. Provavelmente.',
    gabrielaAnalysis: 'A janela está fechada. A cortina está imóvel. A explicação mais simples ainda é paralisia do sono.',
    next: 'morning_sleep',
  },
  morning_sleep: {
    id: 'morning_sleep', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Eu realmente preciso dormir mais.',
  },

  look_family_photo: {
    id: 'look_family_photo', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Eu era tão pequena.',
    gabrielaAnalysis: 'No verso: "Nossa pequena leitora". Faz cinco anos.',
    next: 'look_family_photo_2',
  },
  look_family_photo_2: {
    id: 'look_family_photo_2', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Parece outra pessoa.',
  },
  look_horror_book: {
    id: 'look_horror_book', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Esse foi o primeiro livro que li depois de chegar aqui. Eu não entendia metade das palavras.',
    gabrielaAnalysis: 'Talvez eu tenha gostado porque monstros obedecem a regras.',
    next: 'look_horror_book_2',
  },
  look_horror_book_2: {
    id: 'look_horror_book_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Ainda assim, gostei.',
  },
  look_diary: {
    id: 'look_diary', speaker: 'Pensamento', avatar: 'gabriela_focus',
    text: '"Acordei novamente às 3:17. Talvez seja apenas meu cérebro associando o horário ao medo."',
    gabrielaAnalysis: 'Eu estava tentando encontrar uma explicação. Ainda estou.',
  },

  // Conversa inicial com Chiyo
  morning_greeting_1: { id: 'morning_greeting_1', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Bom dia, querida.', next: 'morning_sleep_question' },
  morning_greeting_2: { id: 'morning_greeting_2', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Bom dia. Você já está acordada há muito tempo?', next: 'morning_greeting_soft' },
  morning_greeting_3: { id: 'morning_greeting_3', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Bom dia... que horas são?', next: 'morning_greeting_soft' },
  morning_greeting_soft: { id: 'morning_greeting_soft', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'O chá está quente. Sente-se.', next: 'morning_sleep_question' },

  morning_sleep_question: {
    id: 'morning_sleep_question', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm',
    text: 'Dormiu bem?',
    options: [
      { text: 'Sim.', nextNodeId: 'sleep_answer_yes' },
      { text: 'Mais ou menos.', nextNodeId: 'sleep_answer_meh' },
      { text: 'Tive outra paralisia.', nextNodeId: 'sleep_answer_paralysis' },
      { text: 'Não quero falar disso.', nextNodeId: 'sleep_answer_no' },
    ],
  },
  sleep_answer_yes: { id: 'sleep_answer_yes', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Que bom.', next: 'sleep_yes_thought' },
  sleep_yes_thought: { id: 'sleep_yes_thought', speaker: 'Pensamento', avatar: 'gabriela_calm', text: 'Não foi uma noite normal.', next: 'watson_intro' },
  sleep_answer_meh: { id: 'sleep_answer_meh', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Paralisia novamente?', next: 'sleep_meh_2' },
  sleep_meh_2: { id: 'sleep_meh_2', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Talvez.', next: 'sleep_meh_3' },
  sleep_meh_3: { id: 'sleep_meh_3', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Você precisa descansar.', next: 'watson_intro' },
  sleep_answer_paralysis: {
    id: 'sleep_answer_paralysis', speaker: 'Chiyo (Avó)', avatar: 'grandma_serious',
    text: 'Às três e dezessete?',
    next: 'sleep_paralysis_reaction',
  },
  sleep_paralysis_reaction: { id: 'sleep_paralysis_reaction', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Como você sabe?', next: 'sleep_paralysis_clock' },
  sleep_paralysis_clock: { id: 'sleep_paralysis_clock', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'O relógio da sala parou.', next: 'sleep_paralysis_thought' },
  sleep_paralysis_thought: { id: 'sleep_paralysis_thought', speaker: 'Pensamento', avatar: 'gabriela_focus', text: 'Ela sabia.', next: 'watson_intro' },
  sleep_answer_no: { id: 'sleep_answer_no', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Tudo bem. Quando quiser falar, eu estou aqui.', next: 'watson_intro' },

  watson_intro: { id: 'watson_intro', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Você também quer café?', next: 'watson_intro_2' },
  watson_intro_2: { id: 'watson_intro_2', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Você sabe que não pode.', next: 'watson_intro_3' },
  watson_intro_3: { id: 'watson_intro_3', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Está bem.', gabrielaAnalysis: 'Ele sempre esteve aqui. Quando eu cheguei, já era velho. Ainda assim, parece nunca mudar.' },
  watson_fed: { id: 'watson_fed', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Bom garoto.', next: 'clock_request' },

  // Relógios
  clock_request: {
    id: 'clock_request', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm',
    text: 'Antes de ir para a escola, pode acertar os relógios da casa?',
    options: [
      { text: 'Claro.', nextNodeId: 'clock_answer_ok' },
      { text: 'Todos eles?', nextNodeId: 'clock_answer_all' },
      { text: 'Eles pararam novamente?', nextNodeId: 'clock_answer_stopped' },
      { text: 'Por que sempre fazem isso?', nextNodeId: 'clock_answer_why' },
      { text: 'É 3:17 de novo?', nextNodeId: 'clock_answer_317' },
    ],
  },
  clock_answer_ok: { id: 'clock_answer_ok', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Obrigada, querida. Todos estão em 03:17 de novo. Ajuste-os para as sete.' },
  clock_answer_all: { id: 'clock_answer_all', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Todos.', next: 'clock_answer_ok' },
  clock_answer_stopped: { id: 'clock_answer_stopped', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Esta manhã, sim.', next: 'clock_answer_ok' },
  clock_answer_why: { id: 'clock_answer_why', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Relógios velhos gostam de prender o tempo.', next: 'clock_answer_ok' },
  clock_answer_317: { id: 'clock_answer_317', speaker: 'Chiyo (Avó)', avatar: 'grandma_serious', text: 'Não pense demais nisso.', next: 'clock_317_reply' },
  clock_317_reply: { id: 'clock_317_reply', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Isso não é uma resposta.', next: 'clock_317_avó' },
  clock_317_avó: { id: 'clock_317_avó', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Eu sei.', next: 'clock_answer_ok' },

  // Escola
  emi_greeting: { id: 'emi_greeting', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Sabrina!', next: 'emi_homework' },
  emi_homework: {
    id: 'emi_homework', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você fez o trabalho?',
    options: [
      { text: 'Sim.', nextNodeId: 'emi_yes' },
      { text: 'Terminei ontem.', nextNodeId: 'emi_yes' },
      { text: 'Ainda não.', nextNodeId: 'emi_no' },
      { text: 'Você quer copiar?', nextNodeId: 'emi_copy' },
    ],
  },
  emi_yes: { id: 'emi_yes', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Você realmente faz tudo cedo.', next: 'emi_strange' },
  emi_no: { id: 'emi_no', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Você? Sem fazer? Hoje o mundo vai acabar.', next: 'emi_strange' },
  emi_copy: { id: 'emi_copy', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Tentando me corromper antes do primeiro sinal?', next: 'emi_strange' },
  emi_strange: { id: 'emi_strange', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Você é estranha.', next: 'emi_reply' },
  emi_reply: { id: 'emi_reply', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Eu sei.' },

  // Intervalo
  lunch_emi: {
    id: 'lunch_emi', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Posso?',
    next: 'lunch_permission',
  },
  lunch_permission: { id: 'lunch_permission', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Pode.', next: 'lunch_question' },
  lunch_question: {
    id: 'lunch_question', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você nunca sai com ninguém?',
    options: [
      { text: 'Eu gosto de ficar sozinha.', nextNodeId: 'lunch_alone' },
      { text: 'Ainda estou me acostumando com as pessoas daqui.', nextNodeId: 'lunch_adjust' },
      { text: 'Eu não sei.', nextNodeId: 'lunch_idk' },
      { text: 'Você está tentando ser minha amiga?', nextNodeId: 'lunch_friend' },
    ],
  },
  lunch_alone: { id: 'lunch_alone', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Mesmo assim, você me deixou sentar.' },
  lunch_adjust: { id: 'lunch_adjust', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Cinco anos ainda podem ser cedo para algumas coisas.' },
  lunch_idk: { id: 'lunch_idk', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Tudo bem não saber.' },
  lunch_friend: { id: 'lunch_friend', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Talvez.', next: 'lunch_friend_2' },
  lunch_friend_2: { id: 'lunch_friend_2', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Isso é uma resposta vaga.', next: 'lunch_friend_3' },
  lunch_friend_3: { id: 'lunch_friend_3', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Então talvez sim.' },

  // Volta para casa
  home_return: { id: 'home_return', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Chegou.' },
  home_response_normal: { id: 'home_response_normal', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Cheguei. Normal.', next: 'home_how' },
  home_response_tired: { id: 'home_response_tired', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Cheguei. Cansativo.', next: 'home_how' },
  home_response_good: { id: 'home_response_good', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Cheguei. Foi bom.', next: 'home_how' },
  home_response_strange: { id: 'home_response_strange', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Cheguei. Foi estranho.', next: 'home_strange_why' },
  home_strange_why: { id: 'home_strange_why', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Por quê?', next: 'home_strange_idk' },
  home_strange_idk: { id: 'home_strange_idk', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Não sei.', next: 'home_strange_reply' },
  home_strange_reply: { id: 'home_strange_reply', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Então não precisa saber agora.', next: 'home_how' },
  home_how: { id: 'home_how', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Pode me ajudar com o jantar?' },

  parents_question: {
    id: 'parents_question', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet',
    text: 'Você ainda sente falta deles?',
    options: [
      { text: 'Todos os dias.', nextNodeId: 'parents_daily' },
      { text: 'Às vezes.', nextNodeId: 'parents_sometimes' },
      { text: 'Não quero falar disso.', nextNodeId: 'parents_silent' },
      { text: 'Eu queria lembrar mais deles.', nextNodeId: 'parents_memory' },
    ],
  },
  parents_daily: { id: 'parents_daily', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Todos os dias.', next: 'parents_daily_2' },
  parents_daily_2: { id: 'parents_daily_2', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Eu também.', next: 'parents_daily_3' },
  parents_daily_3: { id: 'parents_daily_3', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Cinco anos.', next: 'parents_daily_4' },
  parents_daily_4: { id: 'parents_daily_4', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Algumas pessoas continuam fazendo parte de nós mesmo depois que partem.', next: 'grandfather_question' },
  parents_sometimes: { id: 'parents_sometimes', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Às vezes é suficiente.', next: 'parents_sometimes_2' },
  parents_sometimes_2: { id: 'parents_sometimes_2', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'A saudade não precisa ocupar todos os dias para ser verdadeira.', next: 'grandfather_question' },
  parents_silent: { id: 'parents_silent', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Tudo bem. Não vou insistir.', next: 'grandfather_question' },
  parents_memory: { id: 'parents_memory', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Eu queria lembrar mais.', next: 'parents_memory_2' },
  parents_memory_2: { id: 'parents_memory_2', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Você lembra.', next: 'parents_memory_3' },
  parents_memory_3: { id: 'parents_memory_3', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Não de tudo.', next: 'parents_memory_4' },
  parents_memory_4: { id: 'parents_memory_4', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Ninguém lembra de tudo. É por isso que existem fotografias.', next: 'grandfather_question' },

  grandfather_question: { id: 'grandfather_question', speaker: 'Gabriela', avatar: 'gabriela_inquisitive', text: 'Você ainda sente falta do vovô?', next: 'grandfather_reply' },
  grandfather_reply: { id: 'grandfather_reply', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Todos os dias.', next: 'grandfather_why' },
  grandfather_why: { id: 'grandfather_why', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Você nunca fala muito sobre ele.', next: 'grandfather_pain' },
  grandfather_pain: { id: 'grandfather_pain', speaker: 'Chiyo (Avó)', avatar: 'grandma_quiet', text: 'Porque ainda dói.', next: 'grandfather_continue' },
  grandfather_continue: { id: 'grandfather_continue', speaker: 'Gabriela', avatar: 'gabriela_calm', text: 'Mas você continua.', next: 'grandfather_lesson' },
  grandfather_lesson: { id: 'grandfather_lesson', speaker: 'Chiyo (Avó)', avatar: 'grandma_warm', text: 'Continuar não significa esquecer. Você vai aprender isso com o tempo.', next: 'dinner_eat_1' },

  dinner_eat_1: {
    id: 'dinner_eat_1', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Jantamos juntas na mesa da cozinha. A avó coloca um pedaço de peixe cozido para Watson. Ele come rápido e se esfrega nas nossas pernas.',
    next: 'dinner_eat_2',
  },
  dinner_eat_2: {
    id: 'dinner_eat_2', speaker: 'Pensamento', avatar: 'gabriela_focus',
    text: '21:43. Vou subir para o meu quarto (2º andar) para guardar o material escolar e descansar.',
  },

  // Hora de dormir (21:43)
  bedtime_reading_1: {
    id: 'bedtime_reading_1', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: '21:43. Coloco os materiais na escrivaninha para amanhã. Pego o livro de terror sobre o criado-mudo.',
    next: 'bedtime_reading_2',
  },
  bedtime_reading_2: {
    id: 'bedtime_reading_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Só mais um capítulo.',
    next: 'bedtime_reading_3',
  },
  bedtime_reading_3: {
    id: 'bedtime_reading_3', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: '...Último.',
    next: 'bedtime_reading_4',
  },
  bedtime_reading_4: {
    id: 'bedtime_reading_4', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Está bem. Só mais um.',
    next: 'bedtime_reading_sleep',
  },
  bedtime_reading_sleep: {
    id: 'bedtime_reading_sleep', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Fecho o livro. Apago a luz do abajur. Deito na cama.',
  },

  // Segunda noite
  second_317_wake: { id: 'second_317_wake', speaker: 'Pensamento', avatar: 'gabriela_shock', text: '03:17. Duas noites.', next: 'second_317_move' },
  second_317_move: { id: 'second_317_move', speaker: 'Pensamento', avatar: 'gabriela_focus', text: 'Desta vez eu consigo me mexer.', next: 'second_317_window' },
  second_317_window: { id: 'second_317_window', speaker: 'Pensamento', avatar: 'gabriela_calm', text: 'Não existe nada ali.', next: 'second_317_figure' },
  second_317_figure: { id: 'second_317_figure', speaker: 'Pensamento', avatar: 'gabriela_shock', text: 'Ela está olhando para mim.', next: 'second_317_impossible' },
  second_317_impossible: { id: 'second_317_impossible', speaker: 'Pensamento', avatar: 'gabriela_shock', text: 'Segundo andar. Não existe nenhuma maneira de alguém estar ali.', next: 'second_317_gone' },
  second_317_gone: { id: 'second_317_gone', speaker: 'Pensamento', avatar: 'gabriela_focus', text: 'Nada.', next: 'second_317_handprint' },
  second_317_handprint: { id: 'second_317_handprint', speaker: 'Pensamento', avatar: 'gabriela_shock', text: 'Uma marca de mão. Do lado de dentro.', next: 'second_317_hand' },
  second_317_hand: { id: 'second_317_hand', speaker: 'Pensamento', avatar: 'gabriela_shock', text: 'Eu não toquei no vidro.', next: 'chapter_1_close' },
  chapter_1_close: { id: 'chapter_1_close', speaker: 'Pensamento', avatar: 'gabriela_shock', text: '03:18.', gabrielaAnalysis: 'Algumas coisas não começam quando você as encontra. Talvez já estivessem esperando.' },

  // School
  after_school_grades: {
    id: 'after_school_grades', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'As provas voltaram. As notas estão registradas. É o que eu deveria sentir, não é?',
    next: 'after_school_grades_2',
  },
  after_school_grades_2: {
    id: 'after_school_grades_2', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Mesmo assim, o peso no peito não passa. Como se tirar A+ só provasse o quanto eu preciso provar alguma coisa.',
    next: 'after_school_grades_3',
  },
  after_school_grades_3: {
    id: 'after_school_grades_3', speaker: 'Pensamento', avatar: 'gabriela_focus',
    text: 'Os comentários no corredor. Os olhares. Eu anoto cada um porque, se eu entender, talvez doa menos.',
    next: 'after_school_grades_4',
  },
  after_school_grades_4: {
    id: 'after_school_grades_4', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: '16:32. A escola esvazia. O eco dos meus passos no corredor: toc... toc... Hora de voltar para casa.',
  },
  return_home_thought_1: {
    id: 'return_home_thought_1', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Papai e mamãe teriam dito que eu devia ser cientista. A vovó só faz chá.',
  },
  return_home_thought_2: {
    id: 'return_home_thought_2', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Talvez ela entenda que nota não conserta cansaço. Eu mesma não entendo.',
  },
  return_home_thought_3: {
    id: 'return_home_thought_3', speaker: 'Pensamento', avatar: 'gabriela_focus',
    text: 'Emi perguntou se eu queria ir à livraria. Eu disse que tinha dever de casa. Não tenho. Eu só... precisava ficar sozinha.',
  },

  // --- HIGASHIYAMA HIGH SCHOOL COMPLETE NPC DIALOGUES ---
  school_entrance_student: {
    id: 'school_entrance_student', speaker: 'Desconhecido', speakerTitle: 'Estudante', avatar: 'unknown_shadow',
    text: 'Bom dia!',
    options: [
      { text: '“Bom dia.”', nextNodeId: 'school_entrance_1' },
      { text: '“Oi.”', nextNodeId: 'school_entrance_2' },
      { text: '[Ignorar]', nextNodeId: 'school_entrance_3' },
    ],
  },
  school_entrance_1: {
    id: 'school_entrance_1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você parece cansada.',
    next: 'school_entrance_1b',
  },
  school_entrance_1b: {
    id: 'school_entrance_1b', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Só dormi mal.',
  },
  school_entrance_2: {
    id: 'school_entrance_2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você vai perder a primeira aula?',
    next: 'school_entrance_2b',
  },
  school_entrance_2b: {
    id: 'school_entrance_2b', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Não.',
    next: 'school_entrance_2c',
  },
  school_entrance_2c: {
    id: 'school_entrance_2c', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Então corre!',
  },
  school_entrance_3: {
    id: 'school_entrance_3', speaker: 'Pensamento', avatar: 'gabriela_focus',
    text: 'Ele apenas dá de ombros: "Estranha..." Não tenho energia para conversar às sete da manhã.',
  },

  // Armário de sapatos (Getabako)
  getabako_locker_note: {
    id: 'getabako_locker_note', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'Abro meu armário de sapatos. Sapatos escolares, guarda-chuva, um bilhete dobrado: "Não esquecer: trabalho de Biologia."',
    gabrielaAnalysis: 'Eu já terminei há três dias. Está na primeira pasta da mochila.',
  },

  // Emi Takahashi diálogo detalhado no corredor
  emi_corridor_chat: {
    id: 'emi_corridor_chat', speaker: 'Desconhecido', speakerTitle: 'Emi Takahashi', avatar: 'unknown_shadow',
    text: 'Sabrina! Você viu que a professora de Química mudou a prova para amanhã?',
    options: [
      { text: '“Eu já sabia.”', nextNodeId: 'emi_chat_opt1' },
      { text: '“Você está brincando.”', nextNodeId: 'emi_chat_opt2' },
      { text: '“Quanto vale?”', nextNodeId: 'emi_chat_opt3' },
    ],
  },
  emi_chat_opt1: {
    id: 'emi_chat_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Claro que sabia! Você sempre sabe tudo antes de todo mundo.',
    gabrielaAnalysis: 'Eu realmente sabia. Li o cronograma atualizado no mural às 07:42.',
  },
  emi_chat_opt2: {
    id: 'emi_chat_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Eu queria estar! Você parece genuinamente triste com isso.',
  },
  emi_chat_opt3: {
    id: 'emi_chat_opt3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Trinta por cento da nota! Essa foi uma reação assustadoramente calma da sua parte.',
  },

  // Biblioteca: Yumi Tanaka & Livros
  librarian_yumi: {
    id: 'librarian_yumi', speaker: 'Desconhecido', speakerTitle: 'Yumi Tanaka (Bibliotecária, 51)', avatar: 'unknown_shadow',
    text: 'Sabrina. Bom dia. Você terminou aquele livro?',
    options: [
      { text: '“Gostei.”', nextNodeId: 'yumi_opt1' },
      { text: '“O final foi previsível.”', nextNodeId: 'yumi_opt2' },
      { text: '“Não sei ainda o que achei.”', nextNodeId: 'yumi_opt3' },
    ],
  },
  yumi_opt1: {
    id: 'yumi_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Eu sabia. Deixei outro de suspense reservado na prateleira três para quando você quiser.',
  },
  yumi_opt2: {
    id: 'yumi_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você sempre diz isso! Um dia vou encontrar um mistério que você não consiga adivinhar antes da página cinquenta.',
  },
  yumi_opt3: {
    id: 'yumi_opt3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Às vezes os melhores livros são assim. Eles precisam de alguns dias de silêncio para assentarem.',
  },
  inspect_book_suspense: {
    id: 'inspect_book_suspense', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Um romance policial antigo de Agatha Christie em tradução japonesa.',
    gabrielaAnalysis: 'A solução estava escondida na descrição da mobília desde o primeiro capítulo. Nada é colocado por acaso.',
  },
  inspect_book_literature: {
    id: 'inspect_book_literature', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Um romance japonês clássico sobre o inverno em Kyoto.',
    gabrielaAnalysis: 'Minha mãe costumava ler esse tipo de livro quando chovia. Ela dobrava a orelha da página 42.',
  },
  inspect_book_parents: {
    id: 'inspect_book_parents', speaker: 'Pensamento', avatar: 'gabriela_shock',
    text: 'Eu reconheço esta capa... É o mesmo livro de poesia britânica que ficava na sala dos meus pais.',
    gabrielaAnalysis: 'Na página de guarda, uma pequena letra em tinta azul: "Para lembrar depois." Mãe...? Como esse exemplar veio parar aqui em Kyoto?',
  },

  // Enfermaria: Reiko Arai
  nurse_reiko: {
    id: 'nurse_reiko', speaker: 'Desconhecido', speakerTitle: 'Reiko Arai (Enfermeira)', avatar: 'unknown_shadow',
    text: 'Está tudo bem, Sabrina? Você parece pálida e com olheiras fundas.',
    options: [
      { text: '“Só dormi mal.”', nextNodeId: 'nurse_opt1' },
      { text: '“Preciso de um analgésico.”', nextNodeId: 'nurse_opt2' },
    ],
  },
  nurse_opt1: {
    id: 'nurse_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Então tente descansar hoje à noite. Promete para mim?',
    next: 'nurse_opt1b',
  },
  nurse_opt1b: {
    id: 'nurse_opt1b', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Não posso prometer.',
    next: 'nurse_opt1c',
  },
  nurse_opt1c: {
    id: 'nurse_opt1c', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Justo. Venha deitar na maca se a cabeça começar a latejar.',
  },
  nurse_opt2: {
    id: 'nurse_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Aqui está. Beba com bastante água morna e não force demais a vista no computador.',
  },

  // Secretaria: Michiko Watanabe
  secretary_michiko: {
    id: 'secretary_michiko', speaker: 'Desconhecido', speakerTitle: 'Michiko Watanabe (Secretária)', avatar: 'unknown_shadow',
    text: 'Sabrina... sua avó Chiyo ligou para a sua casa hoje de manhã?',
    options: [
      { text: '“Não. Por quê?”', nextNodeId: 'secretary_reply' },
      { text: '“O telefone de casa está mudo.”', nextNodeId: 'secretary_reply' },
    ],
  },
  secretary_reply: {
    id: 'secretary_reply', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Nada, querida. Achei ter ouvido a voz dela na linha externa por volta das sete... devo ter me enganado.',
    gabrielaAnalysis: 'Ela olhou para o registro telefônico e guardou o bloco de recados com rapidez.',
  },

  // Laboratório de Informática
  pc_sync_glitch: {
    id: 'pc_sync_glitch', speaker: 'Pensamento', avatar: 'gabriela_analytical',
    text: 'O terminal 04 do laboratório de informática exibe em tela preta: "ERRO DE SINCRONIZAÇÃO — CÓDIGO 0317".',
    gabrielaAnalysis: 'O sistema escolar roda em rede fechada Unix. Este código não faz parte do protocolo TCP/IP da instituição.',
  },

  // Sala de Artes: Hana Fujimoto
  art_hana: {
    id: 'art_hana', speaker: 'Desconhecido', speakerTitle: 'Hana Fujimoto (Clube de Arte)', avatar: 'unknown_shadow',
    text: 'Sabrina! Você ficou ótima parada sob a luz da janela. Posso desenhar você?',
    options: [
      { text: '“Agora?”', nextNodeId: 'hana_opt1' },
      { text: '“Não.”', nextNodeId: 'hana_opt2' },
      { text: '“Quanto tempo?”', nextNodeId: 'hana_opt3' },
    ],
  },
  hana_opt1: {
    id: 'hana_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'É! Só cinco minutinhos em carvão. Fica paradinha assim com essa cara séria!',
  },
  hana_opt2: {
    id: 'hana_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Tudo bem! Mas se você mudar de ideia, eu sempre fico aqui desenhando.',
  },
  hana_opt3: {
    id: 'hana_opt3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Cinco minutos! Prometo que não distorço sua expressão.',
    gabrielaAnalysis: 'Ela desenha com traços precisos e firmes. Há sensibilidade genuína em suas linhas.',
  },

  // Sala de Música: Piano
  music_room_chat: {
    id: 'music_room_chat', speaker: 'Desconhecido', speakerTitle: 'Estudante de Música', avatar: 'unknown_shadow',
    text: 'Você está procurando alguém?',
    next: 'music_room_chat_2',
  },
  music_room_chat_2: {
    id: 'music_room_chat_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Não. Só ouvi a melodia do corredor.',
    next: 'music_room_chat_3',
  },
  music_room_chat_3: {
    id: 'music_room_chat_3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'É uma sonata antiga de Chopin. Fique à vontade para ouvir quando quiser silêncio.',
  },

  // Quadra de Esportes: Daichi Mori
  soccer_daichi: {
    id: 'soccer_daichi', speaker: 'Desconhecido', speakerTitle: 'Daichi Mori (Futebol)', avatar: 'unknown_shadow',
    text: 'Sabrina! Você vai assistir ao nosso amistoso contra Kitano na sexta?',
    options: [
      { text: '“Talvez.”', nextNodeId: 'daichi_opt1' },
      { text: '“Não gosto muito de futebol.”', nextNodeId: 'daichi_opt2' },
      { text: '“Tenho que estudar.”', nextNodeId: 'daichi_opt3' },
    ],
  },
  daichi_opt1: { id: 'daichi_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Legal! Se você for, vamos jogar com mais garra!' },
  daichi_opt2: { id: 'daichi_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Haha, justo! É meio barulhento mesmo.' },
  daichi_opt3: { id: 'daichi_opt3', speaker: 'Desconhecido', avatar: 'unknown_shadow', text: 'Você sempre estuda! Não esquece de respirar um pouco!' },

  // Santuário escolar
  shrine_school_talk: {
    id: 'shrine_school_talk', speaker: 'Pensamento', avatar: 'gabriela_calm',
    text: 'É estranho terem um pequeno santuário xintoísta dentro dos limites da escola.',
    next: 'shrine_school_talk_2',
  },
  shrine_school_talk_2: {
    id: 'shrine_school_talk_2', speaker: 'Desconhecido', speakerTitle: 'Zelador', avatar: 'unknown_shadow',
    text: 'O terreno sagrado já existia séculos antes de construírem a escola, menina.',
    next: 'shrine_school_talk_3',
  },
  shrine_school_talk_3: {
    id: 'shrine_school_talk_3', speaker: 'Gabriela', avatar: 'gabriela_inquisitive',
    text: 'Quanto tempo exatamente?',
    next: 'shrine_school_talk_4',
  },
  shrine_school_talk_4: {
    id: 'shrine_school_talk_4', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Muito tempo. Tempo suficiente para as pedras terem memória.',
  },

  // Máquina de bebidas escolar
  vending_school_chat: {
    id: 'vending_school_chat', speaker: 'Desconhecido', speakerTitle: 'Emi Takahashi', avatar: 'unknown_shadow',
    text: 'Você sempre compra chá verde gelado, Sabrina!',
    next: 'vending_school_chat_2',
  },
  vending_school_chat_2: {
    id: 'vending_school_chat_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Porque gosto. Não tem açúcar e ajuda na concentração.',
    next: 'vending_school_chat_3',
  },
  vending_school_chat_3: {
    id: 'vending_school_chat_3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você é tão previsível! Mas tudo bem, pelo menos nunca erram seu pedido.',
  },

  // Colegas da sala 2-B
  ken_talk: {
    id: 'ken_talk', speaker: 'Desconhecido', speakerTitle: 'Ken (Colega)', avatar: 'unknown_shadow',
    text: 'Sabrina, você fez a tarefa de Matemática número quatro?',
    options: [
      { text: '“Sim.”', nextNodeId: 'ken_opt1' },
      { text: '“Não me peça para copiar.”', nextNodeId: 'ken_opt2' },
    ],
  },
  ken_opt1: {
    id: 'ken_opt1', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Posso copiar só a resposta final? Por favorzinho!',
    next: 'ken_opt1b',
  },
  ken_opt1b: {
    id: 'ken_opt1b', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Não.',
    next: 'ken_opt1c',
  },
  ken_opt1c: {
    id: 'ken_opt1c', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Valia a pena tentar...',
  },
  ken_opt2: {
    id: 'ken_opt2', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Você lê mentes agora? Tá bom, vou quebrar a cabeça sozinho.',
  },

  mika_talk: {
    id: 'mika_talk', speaker: 'Desconhecido', speakerTitle: 'Mika (Colega)', avatar: 'unknown_shadow',
    text: 'Sabrina, você estudou para a revisão de Química?',
    next: 'mika_talk_2',
  },
  mika_talk_2: {
    id: 'mika_talk_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'O suficiente.',
    next: 'mika_talk_3',
  },
  mika_talk_3: {
    id: 'mika_talk_3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: 'Isso não respondeu nada! Mas aposto que vai tirar dez de novo.',
  },

  ryo_talk: {
    id: 'ryo_talk', speaker: 'Desconhecido', speakerTitle: 'Ryo (Colega)', avatar: 'unknown_shadow',
    text: 'Sabrina, você está viva?',
    next: 'ryo_talk_2',
  },
  ryo_talk_2: {
    id: 'ryo_talk_2', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Infelizmente.',
    next: 'ryo_talk_3',
  },
  ryo_talk_3: {
    id: 'ryo_talk_3', speaker: 'Desconhecido', avatar: 'unknown_shadow',
    text: '...Foi uma piada?',
    next: 'ryo_talk_4',
  },
  ryo_talk_4: {
    id: 'ryo_talk_4', speaker: 'Gabriela', avatar: 'gabriela_calm',
    text: 'Não.',
  },

  mural_bulletin_inspect: {
    id: 'mural_bulletin_inspect', speaker: 'Pensamento', avatar: 'gabriela_analytical',
    text: 'Mural de Avisos da Higashiyama: "Semana Cultural na próxima sexta." e abaixo em destaque: "Alunos devem evitar permanecer no prédio após o horário permitido das 18h."',
    gabrielaAnalysis: 'Não há motivo especificado para a proibição noturna.',
  },

  old_photo_school_inspect: {
    id: 'old_photo_school_inspect', speaker: 'Pensamento', avatar: 'gabriela_analytical',
    text: 'Fotografia em preto e branco dos anos 1960 mostrando o antigo pátio.',
    gabrielaAnalysis: 'Ao fundo, onde hoje fica o bicicletário, existia uma construção de madeira com telhado tradicional. Ela foi demolida sem deixar registros na planta atual.',
  },
};
