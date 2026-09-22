/* Shared street geometry. The 3D street and the phone map both read this,
   so the map route is literally the road the player walks. */

export const STREET = {
  minX: -54,
  maxX: 62,
  zAmp: 2.4,
  zFreq: 0.055,
  roadHalf: 3.1,
  sidewalk: 2.5,
  buildingLine: 6.2,
};

export const roadZ = (x: number) => Math.sin(x * STREET.zFreq) * STREET.zAmp;
export const walkZ = (x: number) => roadZ(x) + STREET.sidewalk;
export const progressAt = (x: number) =>
  Math.max(0, Math.min(1, (x - STREET.minX) / (STREET.maxX - STREET.minX)));

export const routeSamples = (count = 48): [number, number][] =>
  Array.from({ length: count + 1 }, (_, index) => {
    const x = STREET.minX + (STREET.maxX - STREET.minX) * (index / count);
    return [x, walkZ(x)] as [number, number];
  });

export const SCHOOL_X = STREET.maxX - 1.5;

/** Sabrina's inner voice while walking. Fires once per threshold. */
export const STREET_MONOLOGUES: { at: number; text: string }[] = [
  { at: -52, text: 'A chuva começou às 04:15 e continua. Nada fora do previsto.' },
  { at: -47, text: 'A rua está mais quieta do que o normal. Talvez pelo horário.' },
  { at: -42, text: 'O senhor da loja de legumes abre às sete. Hoje ainda não abriu.' },
  { at: -37, text: 'Cada casa tem o mesmo tipo de telhado e uma cor diferente de persiana. Consistente, mas não idêntico.' },
  { at: -32, text: 'Três postes até aqui. Não é uma medida — é uma referência.' },
  { at: -27, text: 'A máquina de bebidas continua com a mesma garrafa presa desde terça.' },
  { at: -22, text: 'A loja de conveniência está com a vitrine acesa. Alguém já trabalhou a noite inteira.' },
  { at: -17, text: 'A cidade acorda por partes. Primeiro as bicicletas, depois as janelas.' },
  { at: -12, text: 'A senhora do cachorro me cumprimenta sempre com a mesma frase. Hoje ela só acenou.' },
  { at: -6, text: 'A água corre pela sarjeta sempre na mesma direção. Isso é bom.' },
  { at: -1, text: 'Estou andando mais devagar do que o normal. Vou corrigir.' },
  { at: 6, text: 'O santuário fica silencioso mesmo com a rua cheia. Já anotei isso ontem.' },
  { at: 13, text: 'Se eu chegar às 07:47, ainda tenho treze minutos para revisar Biologia.' },
  { at: 22, text: 'Cheiro de pão. A padaria está aberta. Isso explica o cheiro.' },
  { at: 31, text: 'Os alunos sempre usam o mesmo trecho de calçada perto da escola. Padrão comportamental.' },
  { at: 41, text: 'O lixo dos vizinhos está na esquina na mesma hora de sempre. Consistente.' },
  { at: 51, text: 'A segunda metade do caminho é sempre mais rápida. Provavelmente expectativa.' },
  { at: 58, text: 'O portão da escola está aberto. Mais um dia.' },
];

export const SCHOOL_NAME_JP = '京都市立高校';

/** Reflections on the walk home after results. They are deliberately slower
    and quieter than the morning observations. */
export const RETURN_MONOLOGUES: { at: number; text: string }[] = [
  { at: 58, text: 'O portão fecha atrás de mim. O barulho diminui, mas a pressão não.' },
  { at: 51, text: 'As notas estão na mochila. Não vou abrir o envelope até chegar em casa.' },
  { at: 44, text: 'Física foi o pior. Se eu tivesse parado de pensar duas vezes, teria acertado a última.' },
  { at: 36, text: 'Cansaço não é uma matéria. Se fosse, eu teria nota máxima.' },
  { at: 27, text: 'Emi me chamou para a livraria. Eu inventei dever de casa. Não foi uma mentira completa.' },
  { at: 19, text: 'Do lado de fora da escola, é mais fácil ouvir as próprias palavras.' },
  { at: 11, text: 'Quando eu não sei responder, todo mundo olha como se eu tivesse traído a pessoa que deveria ser.' },
  { at: 4, text: 'A luz dos postes já está acesa. Hoje o dia passou rápido demais.' },
  { at: -6, text: 'Não é pelas notas. É porque ninguém me pergunta o que eu penso sobre as coisas.' },
  { at: -18, text: 'Se eu contar para a vovó que foi bem, ela vai sorrir. Se contar que estou cansada, ela faz chá.' },
  { at: -30, text: 'Eu queria não precisar de nota nenhuma para existir naquela sala.' },
  { at: -44, text: 'A casa está perto. Talvez eu durma antes das vinte e três.' },
];
