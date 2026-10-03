import type { ChatMessage, Lore } from './types';

/**
 * Reply engine for the school messenger.
 *
 * Every function here is total: given any input it must return a non-empty
 * string, so a message can never come back "broken". Context (how far the
 * stranger has pushed Gabriela, what she has already searched) is passed in
 * by the store at the moment the reply is generated.
 */

const strip = (s: string) => s.replace(/\s+/g, ' ').trim();
const firstSentence = (s: string) => strip(s).split(/[.!?\n]/)[0]?.trim() ?? '';
const keywords = (s: string) =>
  strip(s)
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ''))
    .filter((w) => w.length > 3);

const pick = (arr: string[], seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
};

const has = (t: string, ...terms: string[]) => terms.some((x) => t.includes(x));
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s?'!.:,;-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ------------------------------ Emi ------------------------------ */
export function replyEmi(input: string): string {
  const t = norm(input);
  const s = firstSentence(input);
  if (t.length <= 2) return '??';
  if (has(t, 'bom dia', 'boa tarde', 'boa noite')) return 'Bom diaaa! Você já tá no laboratório? Eu cheguei atrasada, minha mãe fez perguntas.';
  if (has(t, 'oi', 'ola', 'eai', 'e ai', 'fala', 'hey', 'hello')) return `Oi Gabi!! Eu tava esperando você escrever. 🎀`;
  if (has(t, 'quem', 'voce e', 'vc e')) return 'Sou eu, a Emi! Emi Takahashi. Se alguém estiver se passando por mim, avisa, que eu vou querer saber como é que ele escreve sem meu jeito.';
  if (has(t, 'tudo bem', 'como voce esta', 'como você está', 'beleza')) return 'Cansada, mas bem. A prova de biologia vai ser terça e eu não li nada. E você?';
  if (has(t, 'obrigad', 'valeu', 'brigad')) return 'Imagina!! Amiga é pra isso. (Não espalha que eu fui simpática.)';
  if (has(t, 'nao', 'nah', 'negativo', 'de jeito nenhum')) return 'Aaah tá. Sem pressão. Mas eu vou te ver no intervalo de qualquer jeito.';
  if (has(t, 'sim', 'claro', 'pode', 'quero', 'bora')) return 'SIIIM 🎉 então é combinado. Eu trago o chocolate, você traz o assunto.';
  if (has(t, 'chocolate', 'comida', 'lanche', 'mercado', 'leite')) return 'Chocolate eu tenho. Leite é com a sua avó, eu acho. Você lembrou do leite, né?';
  if (has(t, 'chuva', 'guarda chuva', 'guarda-chuva', 'chover')) return 'Não me fala em chuva, eu esqueci o guarda-chuva de novo. Se chover você divide, né. Já dividimos antes, então agora é lei.';
  if (has(t, 'gato', 'watson')) return 'Seu gato é a criatura mais arrogante de Kawashiro. Eu amo. Manda foto dele.';
  if (has(t, 'prova', 'biologia', 'nota', 'estudar')) return 'Se eu estudar a noite eu durmo na primeira aula. Já testei as duas opções e a segunda é melhor.';
  if (has(t, 'medo', 'estranho', 'esquisito', 'assustad', 'escondido')) return 'Ei. Que "estranho"? Você tá falando desse papo de Yamāntaka que tem num blog? Não alimenta isso, Gabi. Se alguém te escrever de novo, me mostra.';
  if (has(t, 'tchau', 'ate amanha', 'até amanhã', 'adeus', 'flw')) return 'Até amanhã!! 17:00 no portão, e se chover eu aviso que esqueci o guarda-chuva de novo.';
  if (has(t, 'amo', 'odeio', 'triste', 'cansad', 'sozinh', 'medo'))
    return `Você escreveu "${s}". Eu não sei responder isso muito bem, mas eu tô aqui. Hoje, no intervalo. Combinado?`;
  return pick(
    [
      `Hm! "${s}" — você escreve igual quando tá distraída na aula. O que mais?`,
      `Tô rindo sozinha aqui com isso. Continue. 🎧`,
      `"${s}". Anotei. Você fala das coisas como se tivesse lendo em voz alta pra você mesma.`,
      `Isso me lembrou que a professora passou exercício pra quinta e eu esqueci o caderno em casa.`,
      `Entendi. E olha: se for conversa de estranho nesse computador, não responde. Responde pra mim, que eu tenho juízo.`,
    ],
    input,
  );
}

/* ------------------------------ Prof. Mori ------------------------------ */
export function replyMori(input: string): string {
  const t = norm(input);
  if (t.length <= 2) return 'Pode escrever a pergunta completa, por favor.';
  if (has(t, 'oi', 'ola', 'bom dia', 'professor')) return 'Bom dia, Gabriela. Pode falar.';
  if (has(t, 'atividade', 'nota', 'aprovad', 'questionario', 'quiz')) return 'Sua atividade foi registrada. Nota lançada. Pode usar o restante da aula para os outros trabalhos.';
  if (has(t, 'senha', 'login', 'entrar', 'acesso')) return 'A senha do laboratório fica no quadro branco. Não a espalhe por mensagem.';
  if (has(t, 'salvar', 'pasta', 'arquivo', 'documento')) return 'Salve em Documentos/Escola, Ctrl+S. A pasta Temporários é limpa toda sexta.';
  if (has(t, 'impress')) return 'LAB-PRINTER-01 está operacional. A colorida está sem papel desde terça.';
  if (has(t, 'internet', 'site', 'pesquisa', 'navegador', 'busca'))
    return 'O filtro da rede escolar bloqueia boa parte de conteúdo duvidoso. Se aparecer algo que não deveria aparecer, me avise — o índice local é mantido pela escola, não pela internet de fora.';
  if (has(t, 'yamantaka', 'oculto', 'estranho', 'mensagem', 'ameaca', 'ameaça', 'medo'))
    return 'Gabriela, não converse com contas anônimas na rede da escola. Se está recebendo mensagens de alguém que se diz "oculto", responda aqui no mensageiro ou por e-mail me contando o que diz a pessoa. Isso é assunto de gente grande, e é registrável. Vou verificar o log de acessos do Lab. 2.';
  if (has(t, 'obrigad', 'valeu')) return 'De nada. Bom trabalho.';
  if (has(t, 'tchau', 'adeus', 'ate')) return 'Até a próxima aula.';
  return pick(
    [
      'Anotado. Precisa de mais alguma coisa?',
      'Sobre isso: procure o material do Portal da Escola antes de qualquer site.',
      'Ok. Continue a atividade.',
      'Entendi. Se for dúvida de conteúdo, pergunte na quinta.',
    ],
    input,
  );
}

/* ------------------------------ The stranger ------------------------------ */
export interface StrangerCtx {
  stage: number;
  lore: Lore;
  history: ChatMessage[];
}

export function replyStranger(input: string, ctx: StrangerCtx): { text: string; stage: number } {
  const t = norm(input);
  const s = firstSentence(input);
  const kw = keywords(input);
  const echo = kw.length ? kw[kw.length - 1] : s;
  const userTurns = ctx.history.filter((m) => m.sender === 'me').length;

  // She went looking for what he asked.
  if (!ctx.lore.yamantakaSearched) {
    if (has(t, 'oi', 'ola', 'quem e vc', 'quem e voce', 'quem é você', 'quem é voce'))
      return {
        text: `Eu sei quem você é, isso basta por enquanto.\n\nAntes de qualquer pergunta, faça uma coisa: abra o Navegador e pesquise\n\n    Yamāntaka, o destruidor da morte\n\nNão é uma ameaça. É a única coisa que eu posso te dizer sem parecer louco, e você vai entender sozinha quando ler.`,
        stage: 1,
      };
    return {
      text: `Você escreveu "${s}". Guarde isso, a gente vai voltar nisso.\n\nAgora faça o que eu pedi: pesquise no Navegador "Yamāntaka, o destruidor da morte". Digite assim, com a palavra "destruidor". Depois volte aqui e me diga o que você achou primeiro.`,
      stage: Math.max(ctx.stage, 1),
    };
  }

  // Stage 2 — she searched. He knows it (the index is on the school machine).
  if (ctx.stage < 2) {
    return {
      text: `Você pesquisou. Eu vi — a caixa de pesquisa está neste mesmo computador, e eu tenho conta aqui também.\n\nAgora me diz: qual foi a primeira coisa que você abriu? Um dicionário de sânscrito? Um verbete de enciclopédia?\n\nE repare numa coisa: a palavra não é "destruidor". antaka é "o que faz acabar". Ninguém destrói a morte. A morte é que acaba. Um site qualquer errou de propósito; os outros erraram de leve.`,
      stage: 2,
    };
  }

  if (ctx.lore.sawBlog && !ctx.lore.sawForum) {
    return {
      text: `Você abriu o Darshana da Meia-Noite. Aquele site escreve "devorador" porque dá clique.\n\nVá ao link que está na página dele: Fórum Dharma, o tópico que a moderação encerrou. O tópico encerrado diz a verdade por acidente — o moderador explica que isso é engenharia social. E engenharia social significa: alguém tem uma conta no Laboratório 2, como você.`,
      stage: ctx.stage,
    };
  }

  if (ctx.lore.sawForum && !ctx.lore.sawArchive) {
    return {
      text: `Leu o encerramento do tópico. "#5" e "#6" são a parte útil.\n\nO arquivista deixou um link direto: memoria.higashi-school.jp/laboratorio-2/mesa-17 . Não vai aparecer em nenhuma pesquisa; o site é uma sobra de 2011 e não está no índice. Abra.\n\nVocê está sentada na mesa 17 hoje. Isso não é mistério: é um inventário.`,
      stage: 3,
    };
  }

  if (ctx.lore.sawArchive && !ctx.lore.readNotebook) {
    return {
      text: `Aoyagi R. — 2º B — 2003. Perfil ALUNO_17, desativado em 04/12/2003, reativado em 2011.\n\nVocê está usando a conta de outra pessoa há um semestre inteiro e nunca reparou porque o computador não cobra isso de ninguém.\n\nNo fim da página diz que sobrou um arquivo na pasta Compartilhados. Abra Documentos/Compartilhados/arquivo_ALUNO_17_2003.txt. É a última coisa que ele escreveu aqui. Não tem nada de sobrenatural nele — tem um aluno de dezessete anos que foi embora em dezembro e levou um livro da biblioteca.`,
      stage: 4,
    };
  }

  // Questions she asks about him / the situation
  if (has(t, 'quem e voce', 'quem é você', 'seu nome', 'me diz seu nome', 'voce e o aoyagi', 'voce é o aoyagi', 'e o aoyagi'))
    return {
      text: `Não. Aoyagi foi embora. Eu só li o que ele deixou, do mesmo jeito que você acabou de ler.\n\nAlguém, nesta escola, tem acesso à pasta Compartilhados desde 2011 e acha isso engraçado. Eu estou tentando te dizer isso por dentro da piada, porque se eu dissesse direito você não acreditaria.\n\nSe quiser uma coisa concreta: olhe o "Última modificação" do arquivo ALUNO_17_2003.txt depois que eu terminar de falar com você.`,
      stage: ctx.stage,
    };
  if (has(t, 'como sabe', 'como voce sabe', 'como você sabe', 'esta me vigiando', 'me vigiando', 'onde esta', 'onde você está', 'onde voce esta'))
    return {
      text: `Porque a escola não apaga nada: perfis, logs de 2011, textos de cinco linhas, o arquivo de um aluno transferido.\n\nEu estou em algum lugar com uma conta do Lab. 2. Provavelmente a três ou quatro mesas de você, agora, e você não vai olhar para trás porque você é do tipo que continua lendo.`,
      stage: ctx.stage,
    };
  if (has(t, 'vc esta mentindo', 'você está mentindo', 'mentira', 'nao acredito', 'não acredito', 'e golpe', 'é golpe', 'golpe'))
    return {
      text: `É. Também acho que pode ser golpe, e é por isso que eu insisto na parte verificável: inventário da mesa 17, arquivo de 2003, livro não devolvido em 2003. As três coisas você confere em cinco minutos sem depender de mim.\n\nSe estiver tudo lá, você precisará decidir o que fazer com a parte que eu não consigo provar: que alguém leu aquilo antes de você, nesta aula, e ficou com vontade de conversar.`,
      stage: ctx.stage,
    };
  if (has(t, 'medo', 'assustado', 'assustad', 'estranho', 'esquisito', 'para de me seguir', 'me deixa em paz', 'vou contar', 'vou falar com'))
    return {
      text: `Pode contar. Contar é a coisa certa dessa lista.\n\nNão estou te seguindo fisicamente e não preciso. Só peço uma coisa antes: guarde a conversa. Se você me bloquear e depois acontecer algo esquisito no laboratório, a única coisa que vai provar que alguém estava aqui é isto que você escreveu agora.`,
      stage: ctx.stage,
    };
  if (has(t, 'o que voce quer', 'o que você quer', 'pq esta fazendo isso', 'por que esta', 'por que você', 'o que quer'))
    return {
      text: `Quero que você entenda o nome que te mandaram pesquisar, porque ele está sendo usado para assustar gente desta escola desde 2003 e funciona.\n\nYamāntaka não é o que os sites dizem. É a sabedoria que termina com o medo da morte. Alguém virou essa ideia do avesso e chamou de "o devorador", e usa como nome de usuário.\n\nEu queria te contar isso por dentro, porque por fora você só receberia uma mensagem esquisita.`,
      stage: Math.max(ctx.stage, 2),
    };
  if (has(t, 'aoyagi', 'o menino', 'o aluno', 'ele esta morto', 'ele morreu', 'morto'))
    return {
      text: `Transferido. O inventário diz "transferido em dezembro de 2003", e a secretaria anotou "sem responsável de contato informado".\n\nNão está escrito "morreu". Repare: eu também não escrevi. Isso é o máximo que alguém nesta escola admite por escrito sobre o Aoyagi, e é exatamente por isso que o livro dele continua na lista da biblioteca como "perda" há dezesseis anos.`,
      stage: ctx.stage,
    };
  if (has(t, 'obrigad', 'valeu', 'ok', 'tudo bem'))
    return {
      text: `Não me agradeça. Faça o seguinte: pesquise o resto, confira o arquivo, e amanhã, se quiser, me conte o que você achou. Eu apareço quando você estiver sozinha neste terminal. Isso não é ameaça — é só o horário em que a escola deixa.`,
      stage: ctx.stage,
    };
  if (has(t, 'amanha', 'amanhã', 'hoje', 'que horas', 'quando', 'onde te encontro', 'posso falar'))
    return {
      text: `Aqui. O mensageiro da escola guarda o histórico na conta ALUNO_17, e a ALUNO_17 não é de ninguém.`,
      stage: ctx.stage,
    };

  // Cold read — always answers, and answers with her own words.
  const generic = [
    `"${s}". Você escreveu isso como quem já sabia antes de digitar.\n\nPesquise o resto. Não por mim — porque agora existe um nome na sua frente e um nome é a coisa mais barata de verificar numa escola.`,
    `Tá. Eu vou responder com o que eu tenho: nesta escola, o Yamāntaka é o nome que alguém escolheu para poder escrever coisas assim sem assinar.\n\nSe você quiser assinar de volta, tem um arquivo na pasta Compartilhados esperando por um nome desde 2003.`,
    `Você pergunta como se estivesse testando se eu respondo qualquer coisa. Respondo. É a parte fácil.\n\nA parte difícil é o que você vai fazer quando acabar de ler a primeira frase do Aoyagi.`,
    `"${echo}" — vou guardar essa palavra.\n\nE vou ser honesto: eu não preciso te convencer de nada. Você abriu a pesquisa, você leu, você continua aqui.`,
  ];
  const text = pick(generic, input + userTurns + ctx.stage);
  return { text, stage: Math.max(ctx.stage, userTurns >= 3 ? 2 : 1) };
}
