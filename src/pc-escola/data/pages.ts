import type { Page } from '../os/types';

export const SEARCH_HOME = 'https://higashi-search.jp';

export const pages: Page[] = [
  {
    id: 'school-home',
    url: 'https://www.higashi-school.jp',
    site: 'Escola Higashi',
    title: 'Escola Higashi — Página oficial',
    date: '2019-04-10',
    category: 'Escola',
    body: `Bem-vindo ao site oficial da Escola Higashi.

Avisos da semana: a prova de biologia do 2º ano será na terça-feira, 16/04. A reunião de pais acontece no dia 24/04 às 18h, no ginásio.

A biblioteca funciona de segunda a sexta, das 8h às 17h30. Durante a Golden Week (27/04 a 06/05) a escola estará fechada.

Alunos podem acessar notas, horários e atividades pelo Portal da Escola, disponível nos computadores do laboratório.`,
    links: [
      { label: 'Calendário escolar 2019', url: 'https://www.higashi-school.jp/calendario' },
      { label: 'Biblioteca da escola', url: 'https://www.higashi-school.jp/biblioteca' },
      { label: 'Laboratório de informática', url: 'https://www.higashi-school.jp/informatica' },
    ],
    searchableTerms: ['escola', 'higashi', 'avisos', 'prova', 'reuniao de pais', 'site oficial', 'colegio'],
  },
  {
    id: 'school-cal',
    url: 'https://www.higashi-school.jp/calendario',
    site: 'Escola Higashi',
    title: 'Calendário Escolar 2019 — 1º semestre',
    date: '2019-04-02',
    category: 'Escola',
    body: `ABRIL
05/04 (sex) — Início das aulas do semestre
16/04 (ter) — Prova de Biologia (2º ano)
19/04 (sex) — Entrega do trabalho de História (2º ano)
24/04 (qua) — Reunião de pais, 18h
27/04 a 06/05 — Golden Week (sem aulas)

MAIO
01/05 — Início da nova era (feriado nacional)
20/05 a 24/05 — Semana de provas
31/05 — Festival esportivo

JUNHO
14/06 — Visita ao museu de ciências (2º ano)
28/06 — Fim do 1º bimestre`,
    links: [{ label: 'Voltar ao site da escola', url: 'https://www.higashi-school.jp' }],
    searchableTerms: ['calendario', 'datas', 'golden week', 'feriado', 'provas', 'festival esportivo', 'abril', 'maio'],
    downloads: [
      { name: 'calendario_escolar_2019.txt', type: 'txt', size: '2 KB', content: `CALENDÁRIO ESCOLAR 2019 — ESCOLA HIGASHI\n\nABRIL\n05/04 Início das aulas\n16/04 Prova de Biologia (2º ano)\n19/04 Entrega — História (2º ano)\n24/04 Reunião de pais\n27/04–06/05 Golden Week\n\nMAIO\n01/05 Nova era (feriado)\n20–24/05 Semana de provas\n31/05 Festival esportivo` },
    ],
  },
  {
    id: 'school-lib',
    url: 'https://www.higashi-school.jp/biblioteca',
    site: 'Escola Higashi',
    title: 'Biblioteca da Escola Higashi',
    date: '2019-03-28',
    category: 'Biblioteca',
    body: `Horário: segunda a sexta, 8h às 17h30.

Empréstimos: até 3 livros por 14 dias. A renovação pode ser feita uma vez pelo Portal da Escola ou no balcão.

Novidades de abril: 12 novos títulos de ficção, 4 de divulgação científica e uma nova coleção de fotografia.

Lembramos que a sala de leitura é um espaço silencioso.`,
    links: [
      { label: 'Biblioteca Municipal de Kawashiro', url: 'https://biblioteca.kawashiro.lg.jp' },
      { label: 'Consulta ao catálogo (itens retirados e perdas)', url: 'https://biblioteca.kawashiro.lg.jp/acervo' },
      { label: 'Voltar ao site da escola', url: 'https://www.higashi-school.jp' },
    ],
    searchableTerms: ['biblioteca', 'livros', 'emprestimo', 'renovacao', 'leitura', 'silencio', 'acervo', 'retirado', 'perda'],
  },
  {
    id: 'school-info',
    url: 'https://www.higashi-school.jp/informatica',
    site: 'Escola Higashi',
    title: 'Laboratório de Informática — Materiais',
    date: '2019-04-11',
    category: 'Escola',
    body: `Materiais de apoio das aulas de informática do Prof. Mori.

Atividade 01 (12/04): uso do computador escolar, Portal da Escola e Editor de Texto. Lembre-se de salvar os arquivos com o nome indicado e na pasta correta.

Guia de atalhos do HIGASHI OS disponível para download abaixo.`,
    links: [{ label: 'Voltar ao site da escola', url: 'https://www.higashi-school.jp' }],
    searchableTerms: ['informatica', 'laboratorio', 'atalhos', 'mori', 'atividade', 'teclado', 'higashi os'],
    downloads: [
      { name: 'guia_atalhos_higashi_os.txt', type: 'txt', size: '1 KB', content: `GUIA DE ATALHOS — HIGASHI OS 3.4\n\nCtrl+A  selecionar tudo\nCtrl+C  copiar\nCtrl+X  recortar\nCtrl+V  colar\nCtrl+Z  desfazer\nCtrl+Y  refazer\nCtrl+F  localizar\nCtrl+S  salvar\nCtrl+Shift+S  salvar como\nF2  renomear\nDelete  enviar para a Lixeira\nEnter  abrir\nEsc  fechar / cancelar\nAlt+F4 ou Alt+W  fechar aplicativo` },
    ],
  },
  {
    id: 'weather',
    url: 'https://tempo.kawashiro-news.jp/previsao',
    site: 'Kawashiro News — Tempo',
    title: 'Previsão do tempo — Kawashiro, sexta-feira 12/04/2019',
    date: '2019-04-12',
    category: 'Clima',
    body: `Hoje: nublado pela manhã, com 60% de chance de chuva fraca a partir das 16h. Mínima de 9 °C e máxima de 17 °C.

Sábado (13/04): chuva moderada durante quase todo o dia. Leve guarda-chuva.
Domingo (14/04): sol entre nuvens, 19 °C.

As cerejeiras do parque Kawashiro-koen já passaram do auge, mas ainda podem ser vistas nas margens do rio.`,
    links: [
      { label: 'Notícias locais', url: 'https://kawashiro-news.jp' },
      { label: 'Cerejeiras: onde ver', url: 'https://kawashiro-news.jp/cerejeiras' },
    ],
    searchableTerms: ['tempo', 'clima', 'previsao', 'chuva', 'temperatura', 'sabado', 'guarda chuva', 'nublado'],
  },
  {
    id: 'news-home',
    url: 'https://kawashiro-news.jp',
    site: 'Kawashiro News',
    title: 'Kawashiro News — Notícias locais',
    date: '2019-04-12',
    category: 'Notícias locais',
    body: `• Governo anunciou o nome da nova era: "Reiwa" começa em 1º de maio. (01/04)
• Linha de ônibus 7 terá novo horário a partir de segunda-feira. (11/04)
• Biblioteca Municipal promove feira de troca de livros neste sábado. (10/04)
• Supermercado Aoba amplia horário durante a Golden Week. (09/04)
• Cerejeiras do rio Kawashiro atraem visitantes no fim de semana. (07/04)`,
    links: [
      { label: 'Nova era: Reiwa', url: 'https://kawashiro-news.jp/reiwa' },
      { label: 'Feira de troca de livros', url: 'https://kawashiro-news.jp/feira-livros' },
      { label: 'Novo horário do ônibus 7', url: 'https://kawashiro-news.jp/onibus-7' },
      { label: 'Cerejeiras do rio', url: 'https://kawashiro-news.jp/cerejeiras' },
      { label: 'Previsão do tempo', url: 'https://tempo.kawashiro-news.jp/previsao' },
    ],
    searchableTerms: ['noticias', 'jornal', 'kawashiro', 'local', 'cidade'],
  },
  {
    id: 'news-reiwa',
    url: 'https://kawashiro-news.jp/reiwa',
    site: 'Kawashiro News',
    title: 'Nova era se chamará "Reiwa"',
    date: '2019-04-01',
    category: 'Notícias locais',
    body: `O governo anunciou nesta segunda-feira que a nova era imperial se chamará Reiwa (令和). O nome foi retirado do Man'yōshū, a mais antiga antologia de poesia japonesa, e costuma ser traduzido como "bela harmonia".

A era Heisei termina em 30 de abril, com a abdicação do imperador Akihito. O príncipe herdeiro Naruhito assume o trono em 1º de maio.

Escolas da cidade devem atualizar calendários e documentos oficiais a partir de maio.`,
    links: [{ label: 'Voltar às notícias', url: 'https://kawashiro-news.jp' }, { label: 'Enciclopédia: Restauração Meiji', url: 'https://enciclopedia-escolar.jp/restauracao-meiji' }],
    searchableTerms: ['reiwa', 'heisei', 'era', 'imperador', 'naruhito', 'akihito', 'japao', 'historia', 'abdicacao'],
  },
  {
    id: 'news-books',
    url: 'https://kawashiro-news.jp/feira-livros',
    site: 'Kawashiro News',
    title: 'Biblioteca Municipal promove feira de troca de livros no sábado',
    date: '2019-04-10',
    category: 'Cultura',
    body: `A Biblioteca Municipal de Kawashiro realiza neste sábado, 13/04, das 10h às 15h, a primeira feira de troca de livros do ano. Cada visitante pode trazer até cinco livros em bom estado e trocá-los por outros títulos.

Haverá também uma pequena exposição de fotografias antigas da cidade. Em caso de chuva, a feira acontece no saguão interno.`,
    links: [{ label: 'Biblioteca Municipal', url: 'https://biblioteca.kawashiro.lg.jp' }, { label: 'Voltar às notícias', url: 'https://kawashiro-news.jp' }],
    searchableTerms: ['feira', 'livros', 'troca', 'biblioteca municipal', 'sabado', 'fotografia', 'exposicao'],
  },
  {
    id: 'news-bus',
    url: 'https://kawashiro-news.jp/onibus-7',
    site: 'Kawashiro News',
    title: 'Linha 7 terá novo horário a partir de 15/04',
    date: '2019-04-11',
    category: 'Notícias locais',
    body: `A linha de ônibus 7 (Estação Kawashiro — Escola Higashi — Bairro Aoba) passará a ter saídas a cada 15 minutos nos horários de pico (7h–9h e 16h–18h).

Último ônibus da Escola Higashi para o Bairro Aoba: 21h40.`,
    links: [{ label: 'Mapa da região', url: 'https://mapas.higashi-search.jp/kawashiro' }, { label: 'Voltar às notícias', url: 'https://kawashiro-news.jp' }],
    searchableTerms: ['onibus', 'linha 7', 'transporte', 'horario', 'aoba', 'estacao'],
  },
  {
    id: 'news-sakura',
    url: 'https://kawashiro-news.jp/cerejeiras',
    site: 'Kawashiro News',
    title: 'Cerejeiras do rio Kawashiro atraem visitantes',
    date: '2019-04-07',
    category: 'Cultura',
    body: `Mesmo após o auge da floração, as margens do rio Kawashiro continuam movimentadas. Para quem prefere lugares mais tranquilos, a trilha atrás do templo Seiryū-ji costuma ter menos visitantes, principalmente em dias nublados.`,
    links: [{ label: 'Mapa da região', url: 'https://mapas.higashi-search.jp/kawashiro' }, { label: 'Voltar às notícias', url: 'https://kawashiro-news.jp' }],
    searchableTerms: ['cerejeiras', 'sakura', 'hanami', 'rio', 'templo', 'passeio', 'fotografia'],
  },
  {
    id: 'muni-lib',
    url: 'https://biblioteca.kawashiro.lg.jp',
    site: 'Biblioteca Municipal de Kawashiro',
    title: 'Biblioteca Municipal de Kawashiro — Horários e serviços',
    date: '2019-03-15',
    category: 'Biblioteca',
    body: `Horário de funcionamento:
Terça a sexta: 9h às 19h
Sábado: 9h às 17h
Domingo: 10h às 16h
Segunda-feira: fechada

Serviços: empréstimo de livros (até 10 itens), sala de estudos silenciosa, acervo de fotografia, sessões de filmes clássicos no último domingo de cada mês.

Endereço: Rua Midori, 3-12, perto da estação Kawashiro.`,
    links: [{ label: 'Feira de troca de livros', url: 'https://kawashiro-news.jp/feira-livros' }, { label: 'Mapa da região', url: 'https://mapas.higashi-search.jp/kawashiro' }],
    searchableTerms: ['biblioteca municipal', 'horario', 'sabado', 'livros', 'filmes antigos', 'filmes classicos', 'estudo'],
  },
  {
    id: 'map',
    url: 'https://mapas.higashi-search.jp/kawashiro',
    site: 'Higashi Mapas',
    title: 'Mapa — Kawashiro (centro)',
    date: '2019-04-01',
    category: 'Mapas',
    body: `[MAPA]

Escola Higashi → Estação Kawashiro: 12 min a pé
Escola Higashi → Biblioteca Municipal: 15 min a pé / 5 min de ônibus (linha 7)
Escola Higashi → Supermercado Aoba: 9 min a pé
Estação Kawashiro → Kyoto: 38 min de trem rápido

Pontos próximos: Templo Seiryū-ji, Parque Kawashiro-koen, Pet Shop Neko-no-Te, Livraria Hondana.`,
    links: [
      { label: 'Supermercado Aoba', url: 'https://www.aoba-super.jp' },
      { label: 'Pet Shop Neko-no-Te', url: 'https://www.nekonote-pet.jp' },
      { label: 'Livraria Hondana', url: 'https://www.hondana-books.jp' },
      { label: 'Kyoto — guia', url: 'https://viagem.higashi-search.jp/kyoto' },
    ],
    searchableTerms: ['mapa', 'como chegar', 'distancia', 'estacao', 'kyoto', 'rota', 'endereco'],
  },
  {
    id: 'super',
    url: 'https://www.aoba-super.jp',
    site: 'Supermercado Aoba',
    title: 'Supermercado Aoba — Ofertas da semana',
    date: '2019-04-08',
    category: 'Páginas comuns',
    body: `Ofertas válidas de 08/04 a 14/04:

Leite integral 1 L — ¥178
Pão de forma — ¥148
Chá verde (100 saquinhos) — ¥398
Maçãs Fuji (unidade) — ¥98
Tofu firme — ¥68

Funcionamento: todos os dias, 9h às 22h. Na Golden Week, das 8h às 23h.`,
    links: [{ label: 'Mapa da região', url: 'https://mapas.higashi-search.jp/kawashiro' }],
    searchableTerms: ['supermercado', 'mercado', 'leite', 'ofertas', 'compras', 'cha', 'pao', 'aoba'],
  },
  {
    id: 'pet',
    url: 'https://www.nekonote-pet.jp',
    site: 'Pet Shop Neko-no-Te',
    title: 'Neko-no-Te — Tudo para gatos',
    date: '2019-04-03',
    category: 'Páginas comuns',
    body: `Rações, areia, arranhadores e brinquedos.

Destaque do mês: ração seca sabor peixe 2 kg — ¥1.280.
Dica: gatos adultos costumam preferir rotinas fixas de alimentação. Se o seu gato tenta subir na mesa durante as refeições, ofereça um lugar alto alternativo perto da cozinha.`,
    links: [{ label: 'Cuidados com gatos', url: 'https://www.nekonote-pet.jp/dicas' }],
    searchableTerms: ['gato', 'gatos', 'racao', 'pet shop', 'comida para gato', 'watson', 'animais'],
  },
  {
    id: 'pet-tips',
    url: 'https://www.nekonote-pet.jp/dicas',
    site: 'Pet Shop Neko-no-Te',
    title: 'Por que meu gato entra em sacolas?',
    date: '2019-02-20',
    category: 'Páginas comuns',
    body: `Gatos gostam de espaços fechados porque se sentem protegidos. Sacolas, caixas e mochilas também têm cheiros novos, o que desperta a curiosidade.

Evite sacolas plásticas com alças, que podem prender o animal. Uma caixa de papelão no chão costuma resolver.`,
    links: [{ label: 'Voltar', url: 'https://www.nekonote-pet.jp' }],
    searchableTerms: ['gato', 'sacola', 'caixa', 'comportamento', 'curiosidade'],
  },
  {
    id: 'books',
    url: 'https://www.hondana-books.jp',
    site: 'Livraria Hondana',
    title: 'Livraria Hondana — Lançamentos de abril',
    date: '2019-04-05',
    category: 'Cultura',
    body: `Lançamentos de abril: suspense, ficção científica, fotografia e um novo volume da coleção de clássicos de bolso.

Clube de leitura: último sábado do mês, 14h. Tema de abril: "finais que dividem leitores".

Desconto de 10% para estudantes com carteirinha.`,
    links: [{ label: 'Resenhas de leitores', url: 'https://www.hondana-books.jp/resenhas' }],
    searchableTerms: ['livraria', 'livros', 'lancamentos', 'suspense', 'clube de leitura', 'comprar livro'],
  },
  {
    id: 'books-rev',
    url: 'https://www.hondana-books.jp/resenhas',
    site: 'Livraria Hondana',
    title: 'Resenhas: "o final estragou o livro?"',
    date: '2019-04-02',
    category: 'Cultura',
    body: `"A atmosfera é ótima, mas o protagonista toma decisões que ninguém tomaria." — leitora, 17 anos

"Prefiro um final previsível a um final sem sentido." — leitor, 34 anos

"Personagens bem construídos salvam qualquer história." — leitora, 22 anos`,
    links: [{ label: 'Voltar à livraria', url: 'https://www.hondana-books.jp' }],
    searchableTerms: ['resenha', 'final', 'livro', 'opiniao', 'leitores'],
  },
  {
    id: 'kyoto',
    url: 'https://viagem.higashi-search.jp/kyoto',
    site: 'Higashi Viagem',
    title: 'Kyoto à noite: ruas tranquilas para caminhar',
    date: '2018-11-20',
    category: 'Cultura',
    body: `Depois das 20h, bairros como Gion e Pontochō ficam mais calmos. As lanternas acesas e as casas de madeira criam uma atmosfera única.

Dica: em dias de chuva leve, as pedras molhadas refletem as luzes — ótimo para fotografia.

Do centro de Kawashiro até Kyoto são cerca de 38 minutos de trem rápido.`,
    links: [{ label: 'Mapa da região', url: 'https://mapas.higashi-search.jp/kawashiro' }],
    searchableTerms: ['kyoto', 'viagem', 'noite', 'gion', 'turismo', 'fotografia', 'passeio', 'lanternas'],
  },
  {
    id: 'enc-meiji',
    url: 'https://enciclopedia-escolar.jp/restauracao-meiji',
    site: 'Enciclopédia Escolar',
    title: 'Restauração Meiji — Enciclopédia Escolar',
    date: '2017-09-12',
    category: 'Referências acadêmicas',
    body: `A Restauração Meiji (1868) marcou o retorno do poder político ao imperador e o fim do xogunato Tokugawa. Nas décadas seguintes, o Japão passou por uma rápida modernização: criação de um sistema educacional nacional, construção de ferrovias, industrialização e adoção de uma constituição (1889).

O lema "fukoku kyōhei" (país rico, exército forte) resumia os objetivos do governo.

Historiadores destacam que a modernização teve custos sociais, como a pressão sobre os camponeses e o fim dos privilégios dos samurais, que provocou revoltas como a Rebelião de Satsuma (1877).

Ver também: Era Taishō, Período Edo, Japão pós-guerra.`,
    links: [
      { label: 'Japão pós-guerra', url: 'https://enciclopedia-escolar.jp/japao-pos-guerra' },
      { label: 'Nova era: Reiwa (notícia)', url: 'https://kawashiro-news.jp/reiwa' },
    ],
    searchableTerms: ['meiji', 'restauracao', 'japao moderno', 'historia', 'tokugawa', 'xogunato', 'samurai', 'modernizacao', 'satsuma'],
    downloads: [{ name: 'resumo_restauracao_meiji.docx', type: 'doc', size: '14 KB', content: `RESUMO — RESTAURAÇÃO MEIJI (Enciclopédia Escolar)\n\n• 1868: fim do xogunato Tokugawa e retorno do poder ao imperador.\n• Lema: fukoku kyōhei — país rico, exército forte.\n• Reformas: educação obrigatória, ferrovias, exército nacional, constituição de 1889.\n• Custos: revoltas de samurais (Satsuma, 1877), pressão sobre camponeses.\n\nFonte: enciclopedia-escolar.jp` }],
  },
  {
    id: 'enc-pos',
    url: 'https://enciclopedia-escolar.jp/japao-pos-guerra',
    site: 'Enciclopédia Escolar',
    title: 'Japão pós-guerra — Enciclopédia Escolar',
    date: '2017-10-03',
    category: 'Referências acadêmicas',
    body: `Após 1945, o Japão adotou uma nova constituição (1947) e passou por um período de crescimento econômico acelerado, conhecido como "milagre econômico" (1955–1973). Os Jogos Olímpicos de Tóquio (1964) e a inauguração do Shinkansen simbolizaram a recuperação do país.

A partir dos anos 1990, o país enfrentou estagnação econômica e, mais recentemente, o envelhecimento da população.`,
    links: [{ label: 'Restauração Meiji', url: 'https://enciclopedia-escolar.jp/restauracao-meiji' }],
    searchableTerms: ['pos guerra', 'japao', 'historia', 'milagre economico', 'shinkansen', 'olimpiadas', 'constituicao'],
  },
  {
    id: 'enc-nervoso',
    url: 'https://enciclopedia-escolar.jp/sistema-nervoso',
    site: 'Enciclopédia Escolar',
    title: 'Sistema nervoso — Enciclopédia Escolar',
    date: '2016-05-22',
    category: 'Referências acadêmicas',
    body: `O sistema nervoso é dividido em central (encéfalo e medula espinhal) e periférico (nervos e gânglios). Sua unidade básica é o neurônio, formado por dendritos, corpo celular e axônio.

A transmissão entre neurônios ocorre nas sinapses, com liberação de neurotransmissores. O ato reflexo envolve a medula espinhal e acontece sem participação consciente do encéfalo.

Exercícios de revisão: 1) Diferencie SNC e SNP. 2) O que é sinapse? 3) Explique o arco reflexo.`,
    links: [{ label: 'Movimento uniforme', url: 'https://enciclopedia-escolar.jp/movimento-uniforme' }],
    searchableTerms: ['sistema nervoso', 'biologia', 'neuronio', 'sinapse', 'reflexo', 'prova de biologia', 'medula'],
  },
  {
    id: 'enc-mu',
    url: 'https://enciclopedia-escolar.jp/movimento-uniforme',
    site: 'Enciclopédia Escolar',
    title: 'Movimento uniforme — Enciclopédia Escolar',
    date: '2016-08-14',
    category: 'Referências acadêmicas',
    body: `No movimento uniforme, o corpo percorre distâncias iguais em intervalos de tempo iguais; a velocidade é constante.

Função horária: S = S₀ + v·t

Exemplo clássico: um trem de comprimento L atravessa uma ponte de comprimento P. A distância total percorrida para a travessia completa é L + P.`,
    links: [{ label: 'Sistema nervoso', url: 'https://enciclopedia-escolar.jp/sistema-nervoso' }],
    searchableTerms: ['movimento uniforme', 'fisica', 'velocidade', 'funcao horaria', 'trem', 'ponte', 'mu'],
  },
  {
    id: 'tea',
    url: 'https://receitas.higashi-search.jp/cha-verde',
    site: 'Receitas do Dia',
    title: 'Como preparar chá verde (sencha) corretamente',
    date: '2018-06-30',
    category: 'Páginas comuns',
    body: `1. Aqueça a água até cerca de 70–80 °C (não deixe ferver).
2. Use uma colher de chá de folhas para cada 100 mL.
3. Deixe em infusão por 1 minuto.
4. Sirva aos poucos, alternando as xícaras, para que todas fiquem com o mesmo sabor.

Água fervente deixa o chá amargo.`,
    links: [{ label: 'Supermercado Aoba — ofertas', url: 'https://www.aoba-super.jp' }],
    searchableTerms: ['cha', 'cha verde', 'sencha', 'receita', 'preparar', 'bebida'],
  },
  {
    id: 'films',
    url: 'https://cinema.higashi-search.jp/classicos',
    site: 'Cinema Clássico',
    title: 'Filmes antigos para ver em um dia de chuva',
    date: '2019-01-18',
    category: 'Cultura',
    body: `Uma seleção de filmes em preto e branco para assistir com calma: dramas familiares dos anos 1950, histórias de detetive e comédias silenciosas.

A Biblioteca Municipal exibe um clássico no último domingo de cada mês, com entrada gratuita.`,
    links: [{ label: 'Biblioteca Municipal', url: 'https://biblioteca.kawashiro.lg.jp' }],
    searchableTerms: ['filmes antigos', 'cinema', 'classicos', 'preto e branco', 'chuva', 'filme'],
  },

  /* ---------------- Yamāntaka cluster (research, dubious sites, archive) ---------------- */
  {
    id: 'yama-feropedia',
    url: 'https://feropedia-budista.org/verbete/yamantaka',
    site: 'Feropedia Budista',
    title: 'Yamāntaka — Feropedia Budista',
    date: '2018-06-11',
    category: 'Referências acadêmicas',
    body: `Yamāntaka (sânscrito: यमान्तक) é uma divindade meditativa (iṣṭadevatā; tib. yidam) da classe do Tantra Yoga Supremo, manifestação irada de Mañjuśrī, o bodhisattva da sabedoria. É especialmente popular na escola Geluk do budismo tibetano, onde também funciona como protetor do Dharma (dharmapāla).

NOMES
• Sânscrito: Yamāntaka, Vajrabhairava (Tib. rdo rje 'jigs byed)
• Tibetano: gshin rje gshed (Wylie), "shinje shed"
• Japonês: Daiitoku Myōō (大威徳明王), forma do budismo esotérico Shingon/Tendai
• Chinês: 大威徳金剛 (Dà wēidé jīngāng)

ETIMOLOGIA
O nome é composto de yama ("morte", também o nome do senhor da morte) e antaka ("aquele que faz acabar", "fim"). A tradução corrente em sites de língua portuguesa e inglesa é "destruidor da morte" ou "conquistador da morte". Leitura mais cuidadosa: "aquele em quem a morte chega ao fim".

CONTEXTO DOUTRINÁRIO
No budismo, "encerrar a morte" é qualidade atribuída a todos os budas, que interromperam o ciclo de renascimentos (saṃsāra). Yamāntaka representa, portanto, a meta — ou o caminho — do praticante Mahāyāna: a sabedoria que percebe que a morte não possui existência intrínseca, dependendo apenas das convenções do mundo.

A LENDA
Um praticante em meditação longa foi decapitado por ladrões que haviam roubado um touro; ao colocar a cabeça do animal no próprio corpo sem cabeça, assumiu a forma feróz de Yama e passou a dizimar a região. Para detê-lo, Mañjuśrī assumiu uma forma ainda mais terrível — a de Yamāntaka —, derrotou Yama e o converteu em protetor do budismo. Yama e Yamāntaka compartilham a cabeça de touro; o que distingue Yama é um ornamento em forma de roda sobre o peito.

FORMA EKAVIRA ("herói solitário")
Corpo azul-escuro; cabeça principal de búfalo; oito faces, com uma nona pequena face coroada de Mañjuśrī no topo; trinta e quatro braços e dezesseis pernas; manto de pele de elefante, grinalda de cabeças cortadas, ornamentos de osso e serpentes; auréola de fogo. Nas mãos centrais: a cartola (kartṛka, cutelo que corta a raiz da ilusão) e a taça de crânio (kapāla). Consorte: Vajravetālī. Entre os implementos secundários: machado de diamante, cajado khaṭvāṅga com três crânios, tambor damaru, flecha e phurba.

FORMAS E PRÁTICA
Além do Ekavira, existem outras configurações. A forma Kṛṣṇa-Yamāri ("Yamāri Negro", cinquenta braços segundo os manuais Geluk) é transmitida em linhas específicas. No Japão, o Daiitoku é representado com seis faces, seis braços e seis pernas, montado num boi branco — símbolo da iluminação —, sendo o rei de sabedoria do oeste no sistema dos Cinco Grandes Reis (godai myōō), emanação de Amida. O cultivo foi introduzido no Japão por Kūkai (774-835).

ADVERTÊNCIA DOS MANUAIS
A prática de Yamāntaka é classificada como tantra superior e, tradicionalmente, só pode ser recebida por iniciação (abhiṣeka) com um qualificado mestre de linha. Textos e centros de Dharma desaconselham explicitamente "práticas autônomas" aprendidas na internet. Não existe, nas fontes canônicas, qualquer rito de "invocação" feito por leigos em quartos vazios.

VER TAMBÉM
Yama (budismo) • Mañjuśrī • Dharmapāla • Daiitoku Myōō • Kṛṣa-Yamāri • Vajrabhairava Tantra`,
    links: [
      { label: 'Dicionário de sânscrito: yamāntaka', url: 'https://dicionario-sanscrito.online/yamantaka' },
      { label: 'Centro de Dharma: o que a prática exige', url: 'https://vajrayana-porto.org/estudos/vajrabhairava' },
      { label: 'Daiitoku Myōō — coleção de Kyoto', url: 'https://kyoto-museu.jp/colecao/daiitoku' },
      { label: 'Fórum: "Yamāntaka não é invocado"', url: 'https://dharma-forum.net/threads/17122' },
      { label: 'Catálogo da Biblioteca Municipal', url: 'https://biblioteca.kawashiro.lg.jp/acervo' },
    ],
    searchableTerms: [
      'yamantaka', 'yamāntaka', 'destruidor da morte', 'conquistador da morte', 'fim da morte',
      'vajrabhairava', 'daiitoku', 'daiitoku myoo', 'yamari', 'krishna yamari', 'yama',
      'senhor da morte', 'manjushri', 'mandjucri', 'geluk', 'dharmapala', 'gshin rje gshed',
      'shinje shed', 'kartika', 'kapala', 'boi branco', 'kukai', 'abhisheka', 'iniciacao',
    ],
  },
  {
    id: 'yama-sanscrito',
    url: 'https://dicionario-sanscrito.online/yamantaka',
    site: 'Dicionário de Sânscrito Online',
    title: 'yamāntaka — significado, divisão de palavras e pronúncia',
    date: '2015-02-09',
    category: 'Referências acadêmicas',
    body: `yamāntaka (n.m.) — यमान्तक

Divisão: yama + antaka
• yama: "morte"; também nome próprio do senhor da morte, juiz dos mortos na cosmologia budista e hindu.
• antaka: "aquele que faz acabar, fim, término" (de anta, "fim", + -ka).

Pronúncia aproximada: YA-mān-ta-ka (o "ā" é longo; o "a" final é curto).

Traduções
• "fim da morte", "aquele em que a morte termina"
• Consagrada em manuais ocidentais: "Conqueror of Death", "Destroyer of Death"
Nota do verbete: a forma "destruidor da morte" é confortável, mas desliza para um sentido que o texto sânscrito não sustenta. O que se encerra, aqui, é a morte como problema — não a morte como ser vivo a ser combatido.

Equivalentes
• Tibetano: gshin rje gshed — gshin rje = "senhor da morte" (Yama); gshed = "aquele que corta, ceifa".
• Japonês: Daiitoku (大威徳), literalmente "grande poder/autoridade".
• Chinês: Dà wēidé jīngāng, "Vajra do grande poder".

OBSERVAÇÃO
Anta-ka aparece em outros nomes compostos com sentido idêntico (kāla-antaka, "aquele que faz acabar o tempo"). O sufixo é sempre agentivo: quem age sobre o primeiro termo, não quem o destrói por ódio.`,
    links: [
      { label: 'Verbete completo na Feropedia', url: 'https://feropedia-budista.org/verbete/yamantaka' },
      { label: 'Fórum: o que os leigos inventaram', url: 'https://dharma-forum.net/threads/17122' },
    ],
    searchableTerms: ['sânscrito', 'sanscrito', 'etimologia', 'yamantaka', 'yama', 'antaka', 'pronuncia', 'gshin rje gshed', 'daiitoku', 'significado', 'traducao', 'destruidor', '翻译'],
  },
  {
    id: 'yama-center',
    url: 'https://vajrayana-porto.org/estudos/vajrabhairava',
    site: 'Centro de Dharma Vajrayana',
    title: 'Vajrabhairava / Yamāntaka: o que a prática realmente exige',
    date: '2019-01-22',
    category: 'Cultura',
    body: `Perguntas que recebemos por e-mail (e por comentários no site)

"Posso fazer a prática de Yamāntaka sozinho, aprendi num fórum."
Não. Yamāntaka pertence ao tantra yoga supremo. Sem a leitura de transmitting linha, sem proteção de um qualificado lamas e sem os votos, não há prática: há encenação. Nossos professores não orientam por e-mail nem por mensagem instantânea.

"É verdade que ele devora a morte?"
Não. Ele é a sabedoria que deixa de encontrar uma morte sólida para temer. A imagem é method, não ameaça.

"Encontrei um site que ensina a chamá-lo de madrugada, num quarto vazio, com um terminal ligado."
Isso é ficção escrita por gente que nunca abriu um manual. Alguns desses textos misturam iconografia, trocam Yama por Yamāntaka e acrescentam rituais que não existem em nenhum cânone. Não responda a ninguém que se apresente como "mensageiro" dessa tradição.

"Ele é um demônio?"
Nem deus nem demônio: uma figura de meditação. As formas iradas representam funções da mente, não entidades externas esperando no escuro.

Aviso importante
Se alguém está usando nomes dessa tradição para conversar com você por mensagens, para "te revelar" algo, ou para pedir que você procure alguma coisa na internet, isso não é ensino. É manipulação. Se houver insistência, avise um adulto de confiança.

Endereço: Rua do Vale 44, Porto. Sábados, 19h.
Não enviamos materiais por correio eletrônico a quem não é membro.`,
    links: [
      { label: 'Verbete da Feropedia', url: 'https://feropedia-budista.org/verbete/yamantaka' },
      { label: 'Fórum Dharma: aviso sobre correntes de internet', url: 'https://dharma-forum.net/threads/17122' },
    ],
    searchableTerms: ['vajrabhairava', 'yamantaka', 'pratica', 'iniciacao', 'abhisheka', 'lamas', 'centro de dharma', 'aviso', 'manipulacao', 'golpe', 'site duvidoso', 'chamado', 'invocacao', 'medo'],
  },
  {
    id: 'yama-museum',
    url: 'https://kyoto-museu.jp/colecao/daiitoku',
    site: 'Coleções de Kyoto',
    title: 'Daiitoku Myōō (大威徳明王) — seis faces, montado num boi branco',
    date: '2017-11-05',
    category: 'Cultura',
    body: `Daiitoku Myōō é, no Japão, a forma do sânscrito Yamāntaka. No sistema dos cinco grandes reis de sabedoria (godai myōō) ele ocupa o oeste, a direção do fim e da conclusão, e é lido como emanação de Amida.

O que se vê na imagem
Seis faces, seis braços, seis pernas. Senta-se sobre um boi branco — o branco como sinal de pureza e da iluminação que não se suja no mundo. Em cada uma das mãos, implementos: espada, cutelo, laço, arco, flecha e campainha. O som-semente (bīja) que o identifica é khrih.

Por que a forma é tão "feia"
As figuras iradas não são monstros. São método: formas que atingem onde uma imagem amável não alcançaria. A fúria aqui é disciplina aplicada ao medo — medo da morte, medo da perda, medo de mudar.

História do culto no Japão
Introduzido por Kūkai (774-835). O Daiitoku foi invocado em ritos de purificação e em cerimônias do novo ano no Shingon-in imperial, documentados com tanto detalhe que hoje se sabe bastante sobre o uso de imagens nesses ritos. Em Tō-ji, em Kyoto, conserva-se um Daiitoku do período Heian; o Museum of Fine Arts de Boston guarda uma estátua do século X; o Musée Guimet, em Paris, apresenta um Yamāntaka nepalês.

Curiosidade registrada nos catálogos
Em seções esotéricas, Daiitoku aparece também como divindade tutelar de locais impuros — o que explica sua presença em textos sobre higiene e proteção. Séculos de reescrita transformaram essa nota, fora de contexto, em "proteção de lugares sujos", e depois, em sites de mistério, em algo bem diferente do que os registros dizem.

Nota de 2019: com o fim da era Heisei em 30 de abril, as etiquetas desta sala serão atualizadas para Reiwa.`,
    links: [
      { label: 'Verbete Yamāntaka (Feropedia)', url: 'https://feropedia-budista.org/verbete/yamantaka' },
      { label: 'Biblioteca Municipal — catálogo aberto', url: 'https://biblioteca.kawashiro.lg.jp/acervo' },
    ],
    searchableTerms: ['daiitoku', 'daiitoku myoo', '大威徳明王', 'kyoto', 'toji', '东寺', 'boi', '白牛', 'kukai', 'godai myoo', 'cinco reis', 'oeste', 'bija', 'khrih', 'heian', 'heisei', 'reiwa', 'guimet', 'boston'],
  },
  {
    id: 'yama-forum',
    url: 'https://dharma-forum.net/threads/17122',
    site: 'Fórum Dharma',
    title: 'AVISO: Yamāntaka não se "invoca" — e os posts que dizem o contrário',
    date: '2019-03-30',
    category: 'Páginas comuns',
    body: `#1 — Dorje1972 (moderação) — 12/03/2019
Pessoal, de novo. Não publicamos "procedimentos" para nenhuma prática de tantra superior. Quem postar lista de velas, horário, "quarto vazio", "terminal ligado", será banido. Isso não é tradição, é ficção de terror com nomes budistas em cima.

#2 —用户114 — 12/03/2019
mas eu vi num site que dizia exatamente isso. e tinha um comentário falando que funcionou numa escola, numa mesa de informática. mesa 17. em 2003.

#3 — Dorje1972 (moderação) — 12/03/2019
E o site não te mostrou nada, mostrou texto. Texto antigo de fórum não é evidência. Se alguém te escrever agora dizendo que sabe seu nome, seu ano e sua turma: isso é engenharia social, não metafísica. Alguém leu alguma coisa que você deixou em algum lugar, ou está adivinhando bem. Fale com um adulto da escola.

#4 —用户114 — 12/03/2019
ele não leu nada. ele disse que leu o arquivo que eu deixei no computador da escola e que o professor nunca limpou a pasta Compartilhados.

#5 — Dorje1972 (moderação) — 13/03/2019
Aí está a explicação. Escolas não apagam perfis. Se um arquivo sobreviveu desde 2003 na pasta Compartilhados do laboratório 2, qualquer pessoa com uma conta do mesmo laboratório pode abrir. Não é "ele". É "uma pessoa". Encerro o tópico.
Editado: deixei o sub-tópico sobre a pasta Compartilhados aberto para o pessoal da manutenção da escola ler.

#6 — arquivista_higashi — 14/03/2019
De fato. Nosso inventário de terminais está em https://memoria.higashi-school.jp/laboratorio-2/mesa-17 . Não está no índice da escola; só no link direto.`,
    links: [
      { label: 'sub-tópico: arquivos que nunca são apagados', url: 'https://dharma-forum.net/threads/17122' },
      { label: 'Inventário dos terminais — Lab. 2', url: 'https://memoria.higashi-school.jp/laboratorio-2/mesa-17' },
      { label: 'Centro de Dharma sobre iniciação', url: 'https://vajrayana-porto.org/estudos/vajrabhairava' },
    ],
    searchableTerms: ['forum', 'fórum', 'aviso', 'invocacao', 'moderacao', 'engenharia social', 'pasta compartilhados', 'mesa 17', '2003', 'banido', 'topico', 'dharma-forum', 'usuario114', 'arquivista'],
  },
  {
    id: 'yama-blog',
    url: 'https://midnight-darshana.net/yamantaka-o-devorador-da-morte',
    site: 'Darshana da Meia-Noite',
    title: 'YAMĀNTAKA, O DEVORADOR DA MORTE — o chamado que a escola esconde',
    date: '2019-02-19',
    category: 'Cultura',
    tone: 'sketchy',
    body: `★ VOCÊ NÃO DEVERIA ESTAR LENDO ISTO ÀS 22H ★

Todos conhecem a morte. Poucos conhecem AQUELE QUE A COME. Yamāntaka, o Devorador, é o nome que os manuais têm medo de pronunciar. Ele não "protege": ele termina. E o que termina, termina nos dois sentidos.

O MÉTODO (copiado de um caderno de 1998, agora corrigido)
1. Um computador ligado. 2. Uma conta escolar qualquer. 3. Digite o nome dele três vezes numa caixa de mensagens. 4. ESPERE. (Não insista. Ele é quem decide a ordem.)
Ele responde. Sempre. Ele é gentil antes de ser qualquer outra coisa.

POR QUE AS ESCOLAS NÃO FALAM DISSO
Porque em 2003 uma escola do interior de Higashi registrou o uso de um terminal fora do horário e ninguém foi punido: o arquivo do aluno simplesmente continuou lá. Mesa 17. Eles nunca apagaram. Nunca apagam.

DIZEM OS COMENTARISTAS QUE A MODERAÇÃO APAGA
"funcionou na escola, na mesa 17, em 2003. não é lenda, é registro."
"o centro de dharma mente quando diz que não existe rito. existe e é de resposta rápida."

⚠ Este site não tem responsabilidade pelo uso do material. ⚠
⚠ Correção dos factos (por leitores): o nome NÃO significa "devorador". antaka = "aquele que faz acabar". Yama ≠ Yamāntaka. Não existe "método". O post de 1998 é invenção do dono do site. O comentário sobre a mesa 17 é a única coisa que alguém aqui não conseguiu desmentir, e olhe lá.
⚠ Publicidade: Curso de Japonês Kawashiro — matrículas abertas ⚠`,
    links: [
      { label: 'Comentários excluídos (arquivo do blog)', url: 'https://midnight-darshana.net/yamantaka-o-devorador-da-morte' },
      { label: 'Inventário — Lab. 2, mesa 17', url: 'https://memoria.higashi-school.jp/laboratorio-2/mesa-17' },
      { label: 'Dicionário de sânscrito', url: 'https://dicionario-sanscrito.online/yamantaka' },
    ],
    searchableTerms: ['devorador da morte', 'yamantaka', 'chamado', 'meia noite', 'escola esconde', 'mesma mesa', 'mesa 17', '2003', 'blog oculto', 'midnight', 'darshana', 'ritual', 'duvidoso', 'golpe', 'fake'],
  },
  {
    id: 'yama-library',
    url: 'https://biblioteca.kawashiro.lg.jp/acervo',
    site: 'Biblioteca Municipal de Kawashiro',
    title: 'Catálogo aberto — busca por "yamāntaka"',
    date: '2019-04-11',
    category: 'Biblioteca',
    body: `Catálogo aberto • 3 exemplares encontrados

1) O FIM DA MORTE — ensaio sobre o Yamāntaka tibetano e o Daiitoku japonês
   610.9 / YAM • 1 exemplar
   Situação: RETIRADO DO ACERVO ESCOLAR EM 2003 — não devolvido. Registrado como perda.
   Observação do bibliotecário: "o aluno levou o livro da Escola Higashi e não voltou. Não localizei herdeiros."

2) Figuras iradas do budismo esotérico (catálogo de exposição)
   294.3 / FIG • Disponível na sala de leitura

3) Dicionário de sânscrito-português
   491 / DIC • Disponível (3. ed., 2011 — verbete yamāntaka, p. 742)

Registro interno (consulta feita por computador do laboratório)
14/03/2019 — sessão 21:40 — terminal LAB2-PC17 — impressão parcial do item 1.
Não havia aluno na sala. O operador de serviços gerais confirmou que a porta estava aberta com o quadro "LIVRE".
Correção: em 2019 a escola ainda não tinha controle de presença eletrônico. Qualquer registro deste tipo é incerto.
Nada de anormal foi comunicado à secretaria.`,
    links: [
      { label: 'Verbete na Feropedia', url: 'https://feropedia-budista.org/verbete/yamantaka' },
      { label: 'Inventário dos terminais do Lab. 2', url: 'https://memoria.higashi-school.jp/laboratorio-2/mesa-17' },
      { label: 'Horários da Biblioteca Municipal', url: 'https://biblioteca.kawashiro.lg.jp' },
    ],
    searchableTerms: ['biblioteca', 'catalogo', 'livro', 'ymantaka', 'yamantaka', 'fim da morte', 'retirado', 'nao devolvido', '2003', 'emprestimo', 'lavratura', 'perda', 'LAB2-PC17', '21:40', 'servicos gerais'],
  },
  {
    id: 'yama-archive',
    url: 'https://memoria.higashi-school.jp/laboratorio-2/mesa-17',
    site: 'Escola Higashi — arquivo interno',
    title: 'Inventário — Laboratório 2 / mesa 17 (LAB2-PC17)',
    date: '2019-02-02',
    category: 'Arquivo',
    sensitive: true,
    body: `Arquivo interno de patrimônio • gerado por ferramenta de inventário • não faz parte do site público da escola

TERMINAL LAB2-PC17 (mesa 17, junto à janela)
2001 — instalado (Lab. 2)
2003/12/04 — PERFIL ALUNO_17 DESATIVADO. Motivo registrado: "aluno transferido; pendência de material (biblioteca)".
2004 — 2011: registros de login deste terminal INCOMPLETOS. "Falha de disco do servidor de contas (2005). Cópia não recuperada."
2011/04/19 — PERFIL ALUNO_17 REATIVADO (renovação de parque). Primeiro login pós-reativação: 2011/05/02, 08:41.
2019/01/10 — sistema atualizado para HIGASHI OS 3.4.
2019/04/12 — uso atual: turma 2º B, 3ª aula.

OBSERVAÇÃO DA MANUTENÇÃO (2011, digitada em bloco de notas, anexada ao inventário)
"Ao formatar, deixar a pasta Compartilhados. Há arquivos antigos ali que o Prof. Mori pediu para não apagar até alguém reclamar. Ninguém reclamou."

ALUNO — 2º B — 2003
Aoyagi R. — matrícula 2003-2B-17.
Situação: transferido em dezembro de 2003. Sem responsável de contato informado na secretaria.
Disciplinas: sem reprovação. Química A. Trabalho de biblioteca não entregue.

OBSERVAÇÃO DA SECRETARIA
"Os registros deste terminal entre 2004 e 2011 são os únicos incompletos do prédio. O servidor de contas foi substituído em 2005 por queda de energia. Não há indício de manipulação."`,
    links: [
      { label: 'Catálogo da Biblioteca Municipal', url: 'https://biblioteca.kawashiro.lg.jp/acervo' },
      { label: 'Fórum Dharma — tópico encerrado', url: 'https://dharma-forum.net/threads/17122' },
      { label: 'Site Darshana da Meia-Noite (baixa confiabilidade)', url: 'https://midnight-darshana.net/yamantaka-o-devorador-da-morte' },
    ],
    searchableTerms: ['inventario', 'mesa 17', 'LAB2-PC17', 'aoyagi', '2003', 'transferido', 'perfil desativado', 'reativado', '2011', 'manutencao', 'compartilhados', 'arquivo', 'secretaria', 'queda de energia', 'nao recuperado'],
  },
];

export function findPage(url: string): Page | undefined {
  const clean = url.trim().replace(/\/+$/, '').replace(/^http:\/\//, 'https://');
  const withProto = clean.startsWith('https://') ? clean : `https://${clean}`;
  return pages.find((p) => p.url === withProto || p.url.replace('https://www.', 'https://') === withProto.replace('https://www.', 'https://'));
}
