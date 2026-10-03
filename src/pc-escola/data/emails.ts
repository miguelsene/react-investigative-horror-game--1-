import type { Email } from '../os/types';

export const MY_ADDR = 'gabriela.aluno17@higashi-school.jp';

const t = (s: string) => new Date(s).toISOString();

export const contacts = [
  { name: 'Emi Takahashi', addr: 'emi.takahashi@higashi-school.jp' },
  { name: 'Prof. Mori (Informática)', addr: 'mori.informatica@higashi-school.jp' },
  { name: 'Sra. Fujimoto (Biologia)', addr: 'fujimoto.biologia@higashi-school.jp' },
  { name: 'Biblioteca', addr: 'biblioteca@higashi-school.jp' },
  { name: 'Secretaria', addr: 'secretaria@higashi-school.jp' },
];

export const initialEmails: Email[] = [
  {
    id: 'm1',
    folder: 'inbox',
    from: 'Emi Takahashi',
    fromAddr: 'emi.takahashi@higashi-school.jp',
    to: MY_ADDR,
    subject: 'Trabalho de História',
    date: t('2019-04-12T07:48'),
    read: false,
    canReply: true,
    body: `Gabi!!

Você já terminou os slides de história? Eu ainda estou no Meiji 😭
Se você terminar hoje na aula de informática, me empresta as referências? Prometo que não copio, só quero ver quais livros você usou.

Ah, e obrigada por ontem. Quer dizer, eu que comprei o chocolate, mas você entendeu.

Vai chover amanhã. Dessa vez eu trouxe guarda-chuva. Acho.

Emi`,
  },
  {
    id: 'm2',
    folder: 'inbox',
    from: 'Prof. Mori (Informática)',
    fromAddr: 'mori.informatica@higashi-school.jp',
    to: 'turma-2b@higashi-school.jp',
    subject: 'Informática — Atividade da semana',
    date: t('2019-04-11T16:30'),
    read: false,
    canReply: true,
    body: `Bom dia, turma 2-B.

Na aula de sexta-feira (12/04) faremos a Atividade 01 no laboratório 2:

1. Abram o Portal da Escola.
2. Consultem o calendário.
3. Encontrem o horário da próxima aula.
4. Abram o Editor de Texto.
5. Escrevam um pequeno parágrafo.
6. Salvem como atividade_informatica_SEUNOME.txt
7. Salvem em Documentos/Escola/
8. Fechem o documento.

O sistema registra a conclusão automaticamente. Quem terminar antes pode usar o tempo restante para outros trabalhos escolares.

Atenciosamente,
Prof. Mori`,
  },
  {
    id: 'm3',
    folder: 'inbox',
    from: 'Secretaria',
    fromAddr: 'secretaria@higashi-school.jp',
    to: 'turma-2b@higashi-school.jp',
    subject: 'Secretaria — Atualização de horário',
    date: t('2019-04-11T12:05'),
    read: true,
    canReply: false,
    body: `Prezados alunos do 2º ano B,

Informamos que na sexta-feira, 12/04, a aula de História (Prof. Ishikawa) será antecipada para a 4ª aula (11:40–12:30), na sala 2-B.

A aula de Inglês passa para a 5ª aula (13:30).

O horário atualizado já está disponível no Portal da Escola.

Secretaria — Escola Higashi
(Mensagem automática. Não responda.)`,
  },
  {
    id: 'm4',
    folder: 'inbox',
    from: 'Sra. Fujimoto (Biologia)',
    fromAddr: 'fujimoto.biologia@higashi-school.jp',
    to: 'turma-2b@higashi-school.jp',
    subject: 'Lembrete — Prova de Biologia',
    date: t('2019-04-10T18:20'),
    read: true,
    canReply: false,
    body: `Olá, turma.

Lembrete: a prova de Biologia será na terça-feira, 16/04, na 6ª aula.

Conteúdo: sistema nervoso (organização, neurônio, sinapse, ato reflexo) e órgãos dos sentidos.

Tragam lápis e borracha. Não será permitido o uso de calculadora.

Sra. Fujimoto`,
  },
  {
    id: 'm5',
    folder: 'inbox',
    from: 'Biblioteca',
    fromAddr: 'biblioteca@higashi-school.jp',
    to: MY_ADDR,
    subject: 'Biblioteca — Devolução de livro',
    date: t('2019-04-09T09:00'),
    read: true,
    canReply: false,
    body: `Olá, Gabriela.

O empréstimo abaixo vence em breve:

• Livro 05 — devolução até 15/04/2019

Você pode renovar uma vez pelo Portal da Escola (seção Biblioteca) ou no balcão.

Obrigado por usar a biblioteca. Você é a aluna com mais empréstimos do 2º ano neste trimestre.

Biblioteca — Escola Higashi`,
  },
  {
    id: 'm6',
    folder: 'inbox',
    from: 'Emi Takahashi',
    fromAddr: 'emi.takahashi@higashi-school.jp',
    to: MY_ADDR,
    subject: 'guarda-chuva',
    date: t('2019-04-09T08:12'),
    read: true,
    canReply: true,
    body: `esqueci o guarda-chuva. de novo.
divide o seu comigo na saída? por favor por favor por favor

(eu sei que você vai dizer que sim)`,
  },
  {
    id: 'm7',
    folder: 'sent',
    from: 'Gabriela',
    fromAddr: MY_ADDR,
    to: 'emi.takahashi@higashi-school.jp',
    subject: 'Re: guarda-chuva',
    date: t('2019-04-09T08:30'),
    read: true,
    canReply: false,
    body: `Tá.
Te espero no portão às 17h.`,
  },
  {
    id: 'm8',
    folder: 'archive',
    from: 'Escola Higashi',
    fromAddr: 'noreply@higashi-school.jp',
    to: MY_ADDR,
    subject: 'Bem-vinda ao Correio Escolar',
    date: t('2019-01-10T08:00'),
    read: true,
    canReply: false,
    body: `Sua conta do Correio Escolar foi criada.

Usuário: gabriela.aluno17
Computador do laboratório: ALUNO_17

Use o correio apenas para assuntos escolares.`,
  },
];
