import type { FileContent, FileType, VFile } from '../os/types';

const d = (s: string) => new Date(s).toISOString();

function f(
  id: string,
  name: string,
  type: FileType,
  parentId: string | null,
  content: FileContent,
  created: string,
  modified?: string,
  readOnly = false,
): VFile {
  return {
    id,
    name,
    type,
    parentId,
    content,
    createdAt: d(created),
    modifiedAt: d(modified ?? created),
    readOnly,
    deleted: false,
  };
}

export const ROOT_ID = 'root';
export const ESCOLA_ID = 'escola';
export const DOWNLOADS_ID = 'downloads';
export const IMAGES_ID = 'imagens';
export const TRABALHOS_ID = 'trabalhos';

const BIO = `ESCOLA HIGASHI — ENSINO MÉDIO

BIOLOGIA
SISTEMA NERVOSO

Nome: Gabriela
Turma: 2º ano B
Professora: Sra. Fujimoto
Data: 03/04/2019

────────────────────────────

1. INTRODUÇÃO

O sistema nervoso é responsável por receber informações do ambiente e do próprio corpo, interpretá-las e coordenar respostas. Ele controla desde ações voluntárias, como caminhar ou escrever, até funções involuntárias, como os batimentos cardíacos e a respiração.

2. ORGANIZAÇÃO

O sistema nervoso é dividido em duas partes principais:

• Sistema Nervoso Central (SNC): formado pelo encéfalo e pela medula espinhal. É onde as informações são processadas.
• Sistema Nervoso Periférico (SNP): formado pelos nervos e gânglios que conectam o SNC ao restante do corpo.

O SNP ainda se divide em somático (ações voluntárias) e autônomo (ações involuntárias). O autônomo possui as divisões simpática e parassimpática, que geralmente têm efeitos opostos.

3. O NEURÔNIO

O neurônio é a principal célula do sistema nervoso. Suas partes são:

• Dendritos: recebem os estímulos.
• Corpo celular: contém o núcleo.
• Axônio: conduz o impulso nervoso até outras células.

A comunicação entre neurônios acontece nas sinapses, por meio de neurotransmissores como a dopamina, a serotonina e a acetilcolina.

4. ATO REFLEXO

O ato reflexo é uma resposta rápida e involuntária. Exemplo: retirar a mão ao tocar em algo quente. O estímulo vai até a medula espinhal, que envia a resposta antes mesmo de o cérebro interpretar a dor.

5. CONCLUSÃO

O sistema nervoso funciona como uma rede de comunicação muito rápida. Mesmo ações simples, como virar a página de um livro, dependem de milhares de neurônios trabalhando ao mesmo tempo. Achei interessante perceber que muitas respostas acontecem sem que a gente precise pensar nelas.

REFERÊNCIAS

AMABIS, J. M.; MARTHO, G. R. Biologia Moderna. 2016.
Portal Educativo Higashi — Sistema Nervoso. Acesso em 02/04/2019.
Anotações de aula — Sra. Fujimoto.`;

const QUIM = `ESCOLA HIGASHI — ENSINO MÉDIO
QUÍMICA — RELATÓRIO DO LABORATÓRIO

Experimento: Reação entre bicarbonato de sódio e vinagre
Aluna: Gabriela — 2º ano B
Professora: Sra. Nakamura
Data do experimento: 04/04/2019

────────────────────────────

OBJETIVO
Observar uma reação química entre um ácido (ácido acético) e uma base (bicarbonato de sódio) e identificar evidências da formação de novas substâncias.

MATERIAIS
• 1 béquer de 250 mL
• 50 mL de vinagre (solução de ácido acético ~4%)
• 1 colher de chá de bicarbonato de sódio
• 1 balão de borracha
• 1 erlenmeyer de 125 mL
• Proveta, espátula e óculos de proteção

PROCEDIMENTO
1. Medir 50 mL de vinagre com a proveta e transferir para o erlenmeyer.
2. Colocar o bicarbonato dentro do balão usando a espátula.
3. Prender o balão na boca do erlenmeyer sem deixar o pó cair.
4. Levantar o balão para que o bicarbonato caia no vinagre.
5. Observar e anotar o que acontece durante 2 minutos.

OBSERVAÇÕES
• Formação imediata de bolhas e espuma.
• O balão começou a encher em poucos segundos.
• O frasco ficou levemente mais frio ao toque.
• Depois de aproximadamente 90 segundos a efervescência diminuiu.

RESULTADO
NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂

O gás que encheu o balão é o dióxido de carbono (CO₂). A diminuição da temperatura indica que a reação é endotérmica.

CONCLUSÃO
A liberação de gás e a variação de temperatura são evidências de uma reação química. O experimento foi simples, mas mostrou bem a diferença entre misturar substâncias e transformá-las. Seria interessante repetir variando a quantidade de bicarbonato para comparar o volume do balão.

Observação da professora: "Relatório muito bem organizado. Nota: A."`;

const FIS = `ESCOLA HIGASHI — ENSINO MÉDIO
FÍSICA — MOVIMENTO UNIFORME
Lista de exercícios 02 — Prof. Yamada
Aluna: Gabriela — 2º ano B — 01/04/2019

────────────────────────────

RESUMO
No movimento uniforme (MU) a velocidade é constante e diferente de zero.
Função horária: S = S₀ + v·t

TABELA — Ciclista em uma ciclovia

 t (s)  |  S (m)
--------+--------
   0    |   20
   2    |   36
   4    |   52
   6    |   68
   8    |   84

QUESTÕES

1) Qual é a posição inicial do ciclista?
R: S₀ = 20 m.

2) Qual é a velocidade do ciclista?
R: v = ΔS / Δt = (36 − 20) / (2 − 0) = 8 m/s.

3) Escreva a função horária do movimento.
R: S = 20 + 8t

4) Qual será a posição em t = 15 s?
R: S = 20 + 8·15 = 140 m.

5) Em que instante o ciclista passa pela posição 260 m?
R: 260 = 20 + 8t → t = 30 s.

6) O movimento é progressivo ou retrógrado? Justifique.
R: Progressivo, porque a velocidade é positiva (a posição aumenta com o tempo).

7) Um trem de 200 m atravessa uma ponte de 300 m a 20 m/s. Quanto tempo leva a travessia completa?
R: ΔS = 200 + 300 = 500 m → t = 500/20 = 25 s.

(conferir a 7 com o professor — não sei se é preciso somar o comprimento do trem. acho que sim.)`;

const INFO_ATIV = `ESCOLA HIGASHI — INFORMÁTICA
ATIVIDADE 01 — USO DO COMPUTADOR ESCOLAR
Prof. Mori — Laboratório 2 — 12/04/2019

(Documento somente leitura — use "Salvar como" para criar uma cópia.)

Objetivo: praticar a navegação no sistema, a consulta ao Portal da Escola e a criação de arquivos.

ETAPAS
1. Abra o Portal da Escola.
2. Consulte o calendário.
3. Encontre o horário da próxima aula.
4. Abra o Editor de Texto.
5. Escreva um pequeno parágrafo (mínimo de 2 frases) dizendo qual é a sua próxima aula e o que você pretende fazer nela.
6. Salve como atividade_informatica_gabriela.txt
   (cada aluno deve usar o próprio nome no arquivo)
7. Salve em Documentos/Escola/
8. Feche o documento.

Dicas
• Ctrl+S salva; Ctrl+Shift+S abre "Salvar como".
• Se salvar na pasta errada, use o Gerenciador de Arquivos para mover o arquivo (Ctrl+X / Ctrl+V).
• Não altere arquivos da pasta Compartilhados.

Avaliação: o sistema registra a conclusão automaticamente.`;

const MAT_SHEET = {
  cols: 8,
  rows: 22,
  cells: {
    A1: 'MATEMÁTICA — FUNÇÕES (2º B)',
    A2: 'Gabriela — 08/04/2019',
    A4: 'x',
    B4: 'f(x) = 2x + 3',
    C4: 'g(x) = x²',
    D4: 'h(x) = 5 - x',
    A5: '-2', B5: '=2*A5+3', C5: '=A5*A5', D5: '=5-A5',
    A6: '-1', B6: '=2*A6+3', C6: '=A6*A6', D6: '=5-A6',
    A7: '0', B7: '=2*A7+3', C7: '=A7*A7', D7: '=5-A7',
    A8: '1', B8: '=2*A8+3', C8: '=A8*A8', D8: '=5-A8',
    A9: '2', B9: '=2*A9+3', C9: '=A9*A9', D9: '=5-A9',
    A10: '3', B10: '=2*A10+3', C10: '=A10*A10', D10: '=5-A10',
    A11: 'SOMA', B11: '=SUM(B5:B10)', C11: '=SUM(C5:C10)', D11: '=SUM(D5:D10)',
    A13: 'EXERCÍCIOS',
    A14: '1) f(4) =', B14: '=2*4+3',
    A15: '2) g(6) =', B15: '=6*6',
    A16: '3) f(x)=h(x) →', B16: '=(5-3)/(2+1)',
    A17: '4) f(g(2)) =', B17: '=2*(2*2)+3',
    A19: 'Teste (A1+A2):',
    A20: '10', B20: '20', C20: '=SUM(A20:B20)',
    E4: 'Anotações',
    E5: 'f é crescente (a > 0)',
    E6: 'h é decrescente (a < 0)',
    E7: 'g é parábola, mínimo em x=0',
    E9: 'Valores de x podem ser',
    E10: 'alterados (coluna A).',
  },
  locked: [
    'A1', 'A2', 'A4', 'B4', 'C4', 'D4', 'A11', 'A13',
    ...[5, 6, 7, 8, 9, 10, 11].flatMap((r) => [`B${r}`, `C${r}`, `D${r}`]),
  ],
  widths: { A: 130, B: 120, C: 100, D: 110, E: 190 },
};

const HIST_PPT = {
  slides: [
    { title: 'Japão Moderno', subtitle: 'Da Restauração Meiji ao Japão contemporâneo\nGabriela — 2º ano B — História — Prof. Ishikawa', bg: 'from-rose-800 to-rose-950' },
    { title: 'Antes de 1868: o Xogunato Tokugawa', bullets: ['Período Edo (1603–1868): governo dos xoguns em Edo (Tóquio).', 'Política de isolamento (sakoku): comércio exterior muito restrito.', 'Sociedade dividida em camadas: samurais, camponeses, artesãos e comerciantes.', '1853: chegada dos navios do Comodoro Perry força a abertura dos portos.'], bg: 'from-stone-700 to-stone-900' },
    { title: 'A Restauração Meiji (1868)', bullets: ['O poder volta formalmente ao imperador Meiji.', 'Fim do sistema de domínios feudais (han) e criação das províncias.', 'Lema: "País rico, exército forte" (fukoku kyōhei).', 'Capital transferida para Tóquio.'], bg: 'from-red-800 to-red-950' },
    { title: 'Modernização', bullets: ['Primeira ferrovia: Tóquio–Yokohama (1872).', 'Educação obrigatória e escolas em todo o país.', 'Constituição Meiji (1889), inspirada no modelo alemão.', 'Industrialização rápida: têxteis, aço, construção naval.'], bg: 'from-amber-800 to-amber-950' },
    { title: 'Guerras e expansão (1894–1945)', bullets: ['Guerra Sino-Japonesa (1894–1895) e Russo-Japonesa (1904–1905).', 'Período Taishō (1912–1926): maior participação política.', 'Militarismo e expansão na Ásia nos anos 1930.', 'Segunda Guerra Mundial termina em 1945.'], bg: 'from-slate-700 to-slate-900' },
    { title: 'Pós-guerra e "milagre econômico"', bullets: ['Constituição de 1947: o imperador como símbolo do Estado.', 'Crescimento econômico acelerado entre 1955 e 1973.', 'Jogos Olímpicos de Tóquio (1964) e o Shinkansen.', 'Anos 1990: estagnação econômica ("década perdida").'], bg: 'from-sky-800 to-sky-950' },
    { title: 'Hoje (2019)', bullets: ['Era Heisei termina em 30 de abril de 2019.', 'Nova era começa em 1º de maio (nome será anunciado/ver notícias).', 'Desafios: envelhecimento da população e baixa natalidade.', 'Tóquio vai sediar as Olimpíadas de 2020.'], bg: 'from-emerald-800 to-emerald-950' },
    { title: 'Referências', bullets: ['Livro didático de História — volume 2.', 'Enciclopédia Escolar Online — "Restauração Meiji".', 'Biblioteca da Escola Higashi.', '[falta: conclusão — terminar na aula de informática]'], bg: 'from-zinc-700 to-zinc-900' },
  ],
};

const ART_PPT = {
  slides: [
    { title: 'Projeto Final de Artes', subtitle: 'Natureza-morta: objetos do cotidiano\nGabriela — 2º ano B — Prof. Sato', bg: 'from-indigo-800 to-indigo-950' },
    { title: 'O trabalho', image: '/pc-escola/images/artes.jpg', caption: 'Desenho a lápis 6B sobre papel A3. Xícara, maçã e três livros.', bg: 'from-neutral-800 to-neutral-950' },
    { title: 'Por que esses objetos', bullets: ['São coisas que estão sempre na minha mesa.', 'A xícara é a que minha avó usa para o chá da tarde.', 'Os livros estão empilhados do jeito que realmente ficam.', 'A maçã foi a parte mais difícil (formas redondas).'], bg: 'from-violet-800 to-violet-950' },
    { title: 'Processo', bullets: ['1. Esboço com linhas leves (20 min).', '2. Definição das sombras com a luz vindo da janela à esquerda.', '3. Hachuras para dar volume.', '4. Ajustes finais com borracha limpa-tipos.'], bg: 'from-fuchsia-900 to-fuchsia-950' },
    { title: 'Referências visuais', image: '/pc-escola/images/biblioteca.jpg', caption: 'Estudei a luz nas mesas da biblioteca da escola, no fim da tarde.', bg: 'from-neutral-800 to-neutral-950' },
    { title: 'Autoavaliação', bullets: ['Proporções: razoáveis.', 'Sombras: melhores do que eu esperava.', 'Ainda não sei desenhar, mas sei observar.', 'Nota que eu me daria: 6,5.'], bg: 'from-indigo-800 to-indigo-950' },
  ],
};

export const initialFiles: VFile[] = [
  f(ROOT_ID, 'Meus Documentos', 'folder', null, null, '2019-01-10T08:00'),
  f(ESCOLA_ID, 'Escola', 'folder', ROOT_ID, null, '2019-01-10T08:00'),
  f(TRABALHOS_ID, 'Trabalhos', 'folder', ROOT_ID, null, '2019-01-10T08:00'),
  f('pessoais', 'Textos Pessoais', 'folder', ROOT_ID, null, '2019-02-02T19:10'),
  f(IMAGES_ID, 'Imagens', 'folder', ROOT_ID, null, '2019-01-10T08:00'),
  f(DOWNLOADS_ID, 'Downloads', 'folder', ROOT_ID, null, '2019-01-10T08:00'),
  f('compartilhados', 'Compartilhados', 'folder', ROOT_ID, null, '2019-01-10T08:00'),
  f('temp', 'Temporários', 'folder', ROOT_ID, null, '2019-01-10T08:00'),

  // Escola
  f('esc1', 'Horário 2019 - 2B.txt', 'txt', ESCOLA_ID, `HORÁRIO — 2º ANO B — 1º SEMESTRE 2019

SEGUNDA: Biologia, Matemática, Inglês, Japonês, Ed. Física, História
TERÇA: Química, Física, Matemática, Japonês, Inglês, Biologia
QUARTA: Matemática, História, Química (lab), Química (lab), Artes, Japonês
QUINTA: Física, Biologia, Química, Inglês, Matemática, Ed. Física
SEXTA: Matemática, Física, Informática, História*, Inglês, Artes

* sexta 12/04: história mudou para a 4ª aula (11:40). ver e-mail da secretaria.

1ª 08:40 | 2ª 09:40 | 3ª 10:40 | 4ª 11:40 | almoço 12:30 | 5ª 13:30 | 6ª 14:30`, '2019-04-08T07:30', '2019-04-11T21:05'),
  f('esc2', 'Anotações de aula.txt', 'txt', ESCOLA_ID, `biologia 08/04
- prova dia 16/04 (terça). sistema nervoso + sentidos
- revisar sinapse e ato reflexo

matemática 08/04
- mesma coisa de funções. exercícios 12 a 20 p/ quinta

física 09/04
- MU. lista 02 até sexta. a 7 é estranha

química 10/04
- relatório entregue. próxima aula: estequiometria (de novo)

história 10/04
- apresentação Japão Moderno: entrega 19/04
- falta conclusão e referências`, '2019-04-08T13:00', '2019-04-10T16:20'),

  // Trabalhos
  f('tr1', 'Biologia - Sistema Nervoso.docx', 'doc', TRABALHOS_ID, BIO, '2019-04-01T19:40', '2019-04-03T22:10'),
  f('tr2', 'Matemática - Funções.xlsx', 'sheet', TRABALHOS_ID, MAT_SHEET, '2019-04-08T20:00', '2019-04-08T21:12'),
  f('tr3', 'Química - Relatório do Laboratório.docx', 'doc', TRABALHOS_ID, QUIM, '2019-04-04T18:30', '2019-04-11T17:40'),
  f('tr4', 'Física - Movimento Uniforme.docx', 'doc', TRABALHOS_ID, FIS, '2019-04-01T20:15', '2019-04-09T21:30'),
  f('tr5', 'História - Japão Moderno.pptx', 'presentation', TRABALHOS_ID, HIST_PPT, '2019-04-05T19:00', '2019-04-10T22:41'),
  f('tr6', 'Artes - Projeto Final.pptx', 'presentation', TRABALHOS_ID, ART_PPT, '2019-03-20T18:00', '2019-03-28T20:00'),
  f('tr7', 'Informática - Atividade 01.docx', 'doc', TRABALHOS_ID, INFO_ATIV, '2019-04-12T08:00', '2019-04-12T08:00', true),

  // Textos pessoais
  f('tp1', '08-04-2019.txt', 'txt', 'pessoais', `Acordei 6:20 novamente.
Minha avó já estava acordada quando desci.
Comi pão, fruta e tomei chá.

Na escola tivemos biologia e matemática. A aula de biologia foi interessante, mas matemática foi praticamente a mesma coisa da semana passada.

Conversei um pouco com a Emi no intervalo.

Voltei para casa às 17:02.
Watson estava dormindo na minha cama.

Fiz minha lição e li algumas páginas antes de dormir.

Dia normal.`, '2019-04-08T22:14'),
  f('tp2', '09-04-2019.txt', 'txt', 'pessoais', `Choveu bastante hoje.
Gosto de quando chove porque a escola fica mais silenciosa.

A Emi reclamou da chuva porque esqueceu o guarda-chuva.
Ela tentou me convencer a dividir o dela.
Funcionou.

Cheguei em casa um pouco molhada.
Minha avó fez sopa.

Watson tentou subir na mesa durante o jantar.
Ele sabe que não pode.
Mesmo assim continua tentando.`, '2019-04-09T21:48'),
  f('tp3', '10-04-2019.txt', 'txt', 'pessoais', `Hoje terminei um livro.
Não gostei muito do final.

A ideia era boa, mas o personagem principal tomou decisões completamente irracionais.

Talvez eu esteja sendo muito crítica.

Comecei outro livro.
Parece melhor.`, '2019-04-10T23:02'),
  f('tp4', '11-04-2019.txt', 'txt', 'pessoais', `Tirei A em química.
A professora elogiou meu relatório.

Emi disse que eu deveria comemorar.
Não sei exatamente o que isso significa.

Ela comprou um chocolate para mim no intervalo.
Eu agradeci.

Foi bom.`, '2019-04-11T21:30'),
  f('tp5', '12-04-2019.txt', 'txt', 'pessoais', `Hoje temos informática.
Não vejo muito sentido em algumas das atividades, mas pelo menos posso terminar o trabalho de história.

Depois da escola preciso passar no mercado com minha avó.
Ela pediu para eu comprar leite.

Preciso lembrar.

LEITE.

Watson provavelmente vai tentar entrar na sacola quando eu chegar em casa.`, '2019-04-12T07:05'),
  f('tp6', 'Coisas.txt', 'txt', 'pessoais', `Coisas que eu gosto

Livros
Chuva
Fotografia
Lugares silenciosos
Chá
Gatos
Música enquanto estudo
Caminhar sem destino específico
Kyoto à noite
Filmes antigos

Coisas que não gosto

Lugares muito cheios
Pessoas falando alto
Trabalho em grupo
Calor
Quando alguém mexe nas minhas coisas
Acordar atrasada`, '2019-02-02T19:12', '2019-03-17T20:40'),
  f('tp7', 'Livros.txt', 'txt', 'pessoais', `LIVROS QUE LI

Livro 01 — 8/10 — Boa atmosfera. Final previsível.
Livro 02 — 5/10 — A história começou bem. O final não fez sentido.
Livro 03 — 9/10 — Personagens bons. Gostei do suspense.
Livro 04 — 7/10 — Algumas partes poderiam ser menores.

LENDO AGORA: Livro 05
PRÓXIMO: Livro 06`, '2019-02-02T19:20', '2019-04-10T23:05'),
  f('tp8', 'Escola.txt', 'txt', 'pessoais', `Biologia — interessante.
Matemática — tolerável.
Química — interessante quando temos laboratório.
Física — difícil, mas gosto.
Artes — não sei desenhar.
Educação física — desnecessária.
Informática — depende da atividade.

Biblioteca — melhor lugar da escola.`, '2019-03-01T18:00', '2019-03-29T19:30'),
  f('tp9', 'Ideias.txt', 'txt', 'pessoais', `Fotografar a cidade quando chover.
Visitar a biblioteca no sábado.
Comprar um livro novo.
Organizar as fotos do computador.
Perguntar para minha avó sobre a viagem que ela fez quando era jovem.
Terminar o trabalho de história.
Comprar comida para Watson.`, '2019-03-10T20:00', '2019-04-11T22:00'),

  // Imagens
  f('img1', 'escola_entrada.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/escola.jpg', caption: 'Entrada da escola. Primeiro dia do semestre.', taken: '2019-04-05' }, '2019-04-05T08:10'),
  f('img2', 'chuva_rua.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/chuva.jpg', caption: 'Voltando da escola. 09/04, chuva.', taken: '2019-04-09' }, '2019-04-09T17:00'),
  f('img3', 'watson.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/watson.jpg', caption: 'Watson na minha cama. De novo.', taken: '2019-04-08' }, '2019-04-08T17:05'),
  f('img4', 'biblioteca.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/biblioteca.jpg', caption: 'Biblioteca da escola às 16h.', taken: '2019-03-27' }, '2019-03-27T16:02'),
  f('img5', 'kyoto_noite.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/kyoto.jpg', caption: 'Kyoto, viagem de inverno com a avó.', taken: '2018-12-28' }, '2018-12-28T21:40'),
  f('img6', 'laboratorio_quimica.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/laboratorio.jpg', caption: 'Laboratório 1 antes do experimento.', taken: '2019-04-04' }, '2019-04-04T13:20'),
  f('img7', 'artes_natureza_morta.jpg', 'image', IMAGES_ID, { src: '/pc-escola/images/artes.jpg', caption: 'Projeto final de artes (versão entregue).', taken: '2019-03-28' }, '2019-03-28T19:00'),

  // Downloads
  f('dl1', 'calendario_abril_2019.txt', 'txt', DOWNLOADS_ID, `CALENDÁRIO ESCOLAR — ABRIL 2019 (baixado do site da escola)

05/04 início das aulas do semestre
16/04 prova de biologia
19/04 entrega — História (apresentação)
24/04 reunião de pais
27/04 a 06/05 Golden Week (sem aulas)`, '2019-04-06T10:00'),

  // Compartilhados
  f('sh1', 'Regras do Laboratório.txt', 'txt', 'compartilhados', `LABORATÓRIO DE INFORMÁTICA 2 — REGRAS

1. Não coma nem beba perto dos computadores.
2. Use apenas o seu perfil (ALUNO_XX).
3. Salve seus arquivos na pasta Documentos.
4. Arquivos na pasta Temporários podem ser apagados na sexta-feira.
5. Não instale programas.
6. Ao sair, feche os aplicativos.

Prof. Mori`, '2019-01-10T08:00', '2019-01-10T08:00', true),
  f('sh3', 'arquivo_ALUNO_17_2003.txt', 'txt', 'compartilhados', `rascunho — 14/11/2003  (não apagar: arquivo antigo do laboratório)

YAMĀNTAKA, "o destruidor da morte"
tradução que a internet usa e que não é bem isso.
yama = morte (e também o nome do senhor da morte)
antaka = aquilo que faz acabar
então: yamāntaka = aquilo em que a morte acaba. não "aquele que mata a morte".

a lenda, resumida: um homem em meditação é decapitado por ladrões que
traziam a cabeça de um touro cortada. ele põe a cabeça do touro no próprio
corpo e vira Yama. Yama começa a acabar com gente demais.
Manjushri, para parar aquilo, assume forma ainda mais terrível — cabeça de
búfalo, oito faces, trinta e quatro braços, dezesseis pernas, cutelo e taça
de crânio. Derrota Yama e o transforma em protetor do dharma.
Yama tem uma roda no peito. Yamāntaka não tem. Se a figura tem roda no peito,
é Yama, e não o contrário. Nesses sites de mistério estão sempre trocando.

no Japão chama Daiitoku Myōō. seis faces, seis braços, montado num boi branco,
direção oeste, emanação de Amida. Kūkai trouxe. som-semente khrih.

e é exatamente aqui que eu perco o fio:
nada disso é invocação. é figura de meditação.
o professor do centro de dharma respondeu meu e-mail em duas linhas:
"sem iniciação não há prática. há encenação. não converse com estranhos
sobre isso."

falta: comparar o Daiitoku de Tō-ji com o Ekavira. mesma figura, dois países.
e descobrir por que a escola tem medo desse nome.

— Aoyagi R., 2º B, 2003

[nota da secretaria, acrescentada depois]
Aluno transferido em 04/12/2003. Livro "O fim da morte" retirado do acervo,
não devolvido. Arquivo pessoal deixado nesta pasta por engano; o Prof. Mori
pediu para não apagar até alguém reclamar. Ninguém reclamou.`, '2003-11-14T21:40', '2003-11-14T22:05'),
  f('sh2', 'Modelo de relatório.docx', 'doc', 'compartilhados', `MODELO DE RELATÓRIO — ESCOLA HIGASHI

Título
Nome / Turma / Data

1. Objetivo
2. Materiais
3. Procedimento
4. Observações
5. Resultado
6. Conclusão
Referências`, '2019-01-15T08:00', '2019-01-15T08:00', true),

  // Temporários
  f('tmp1', 'rascunho.txt', 'txt', 'temp', `conclusão história:
o japão mudou muito rápido em pouco tempo
(muito simples. reescrever)

- a modernização foi rápida mas teve custos
- comparar com hoje? fim da era heisei`, '2019-04-10T22:30'),
];

const trashed: VFile = {
  ...f('trash1', 'lista_compras_antiga.txt', 'txt', 'temp', `mercado (sábado)
- leite
- chá verde
- pão de forma
- ração do Watson (a de peixe, não a de frango)
- pilhas`, '2019-03-30T09:00'),
  deleted: true,
  originalParentId: 'temp',
  deletedAt: new Date('2019-04-06T11:00').toISOString(),
};

initialFiles.push(trashed);
