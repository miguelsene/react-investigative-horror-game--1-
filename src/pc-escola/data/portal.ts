export const portalStudent = {
  name: 'Gabriela',
  id: '2019-2B-17',
  turma: '2º ano B',
  tutor: 'Prof. Ishikawa',
};

export const calendarEvents: Record<string, { title: string; type: 'prova' | 'entrega' | 'evento' | 'feriado' | 'aula' }[]> = {
  '2019-04-05': [{ title: 'Início das aulas', type: 'evento' }],
  '2019-04-11': [{ title: 'Química — devolução de relatórios', type: 'aula' }],
  '2019-04-12': [
    { title: 'Informática — Atividade 01 (3ª aula)', type: 'aula' },
    { title: 'História antecipada para a 4ª aula (11:40)', type: 'aula' },
  ],
  '2019-04-15': [{ title: 'Devolução — Livro 05 (biblioteca)', type: 'entrega' }],
  '2019-04-16': [{ title: 'Prova de Biologia', type: 'prova' }],
  '2019-04-18': [{ title: 'Física — entrega lista 03', type: 'entrega' }],
  '2019-04-19': [{ title: 'Entrega — História: Japão Moderno', type: 'entrega' }],
  '2019-04-24': [{ title: 'Reunião de pais (18h)', type: 'evento' }],
  '2019-04-27': [{ title: 'Golden Week (início)', type: 'feriado' }],
  '2019-04-29': [{ title: 'Dia de Shōwa', type: 'feriado' }],
  '2019-04-30': [{ title: 'Fim da era Heisei', type: 'feriado' }],
  '2019-05-01': [{ title: 'Início da era Reiwa', type: 'feriado' }],
  '2019-05-06': [{ title: 'Golden Week (fim)', type: 'feriado' }],
  '2019-05-20': [{ title: 'Semana de provas', type: 'prova' }],
  '2019-05-31': [{ title: 'Festival esportivo', type: 'evento' }],
};

export const periods = [
  { n: 1, start: '08:40', end: '09:30' },
  { n: 2, start: '09:40', end: '10:30' },
  { n: 3, start: '10:40', end: '11:30' },
  { n: 4, start: '11:40', end: '12:30' },
  { n: 5, start: '13:30', end: '14:20' },
  { n: 6, start: '14:30', end: '15:20' },
];

export const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export const timetable: { subject: string; room: string; note?: string }[][] = [
  [
    { subject: 'Biologia', room: 'Lab. Bio' },
    { subject: 'Matemática', room: '2-B' },
    { subject: 'Inglês', room: '2-B' },
    { subject: 'Japonês', room: '2-B' },
    { subject: 'Ed. Física', room: 'Ginásio' },
    { subject: 'História', room: '2-B' },
  ],
  [
    { subject: 'Química', room: '2-B' },
    { subject: 'Física', room: '2-B' },
    { subject: 'Matemática', room: '2-B' },
    { subject: 'Japonês', room: '2-B' },
    { subject: 'Inglês', room: '2-B' },
    { subject: 'Biologia', room: '2-B' },
  ],
  [
    { subject: 'Matemática', room: '2-B' },
    { subject: 'História', room: '2-B' },
    { subject: 'Química (lab)', room: 'Lab. 1' },
    { subject: 'Química (lab)', room: 'Lab. 1' },
    { subject: 'Artes', room: 'Sala de Artes' },
    { subject: 'Japonês', room: '2-B' },
  ],
  [
    { subject: 'Física', room: '2-B' },
    { subject: 'Biologia', room: '2-B' },
    { subject: 'Química', room: '2-B' },
    { subject: 'Inglês', room: '2-B' },
    { subject: 'Matemática', room: '2-B' },
    { subject: 'Ed. Física', room: 'Ginásio' },
  ],
  [
    { subject: 'Matemática', room: '2-B' },
    { subject: 'Física', room: '2-B' },
    { subject: 'Informática', room: 'Lab. Info 2' },
    { subject: 'História', room: '2-B', note: 'Antecipada (antes: 5ª aula)' },
    { subject: 'Inglês', room: '2-B', note: 'Alterada (antes: 4ª aula)' },
    { subject: 'Artes', room: 'Sala de Artes' },
  ],
];

export const grades = [
  { subject: 'Biologia', b1: 'A-', last: 'Trabalho: Sistema Nervoso — A-', teacher: 'Sra. Fujimoto' },
  { subject: 'Química', b1: 'A', last: 'Relatório de laboratório — A (11/04)', teacher: 'Sra. Nakamura' },
  { subject: 'Física', b1: 'B+', last: 'Lista 01 — B+', teacher: 'Prof. Yamada' },
  { subject: 'Matemática', b1: 'B+', last: 'Exercícios de funções — B+', teacher: 'Prof. Kobayashi' },
  { subject: 'História', b1: 'A-', last: 'Seminário — A-', teacher: 'Prof. Ishikawa' },
  { subject: 'Japonês', b1: 'A', last: 'Redação — A', teacher: 'Sra. Mochizuki' },
  { subject: 'Inglês', b1: 'B+', last: 'Vocabulary quiz — B+', teacher: 'Mr. Hall' },
  { subject: 'Artes', b1: 'B-', last: 'Projeto final — B-', teacher: 'Prof. Sato' },
  { subject: 'Ed. Física', b1: 'C+', last: 'Avaliação prática — C+', teacher: 'Prof. Ueda' },
  { subject: 'Informática', b1: '—', last: 'Atividade 01 — em andamento', teacher: 'Prof. Mori' },
];

export const teachers = [
  { name: 'Prof. Mori', subject: 'Informática', room: 'Lab. Info 2', email: 'mori.informatica@higashi-school.jp', office: 'Seg e Sex, 15:30–16:30' },
  { name: 'Prof. Ishikawa', subject: 'História (tutor da turma)', room: 'Sala dos professores', email: 'ishikawa.historia@higashi-school.jp', office: 'Qua, 15:30–16:30' },
  { name: 'Sra. Fujimoto', subject: 'Biologia', room: 'Lab. Bio', email: 'fujimoto.biologia@higashi-school.jp', office: 'Ter, 15:30–16:30' },
  { name: 'Sra. Nakamura', subject: 'Química', room: 'Lab. 1', email: 'nakamura.quimica@higashi-school.jp', office: 'Qui, 15:30–16:30' },
  { name: 'Prof. Yamada', subject: 'Física', room: 'Sala 3-A', email: 'yamada.fisica@higashi-school.jp', office: 'Ter, 15:30–16:30' },
  { name: 'Prof. Kobayashi', subject: 'Matemática', room: 'Sala 2-A', email: 'kobayashi.mat@higashi-school.jp', office: 'Seg, 15:30–16:30' },
  { name: 'Sra. Mochizuki', subject: 'Japonês', room: 'Sala 1-C', email: 'mochizuki.jp@higashi-school.jp', office: 'Qua, 12:30–13:00' },
  { name: 'Mr. Hall', subject: 'Inglês', room: 'Sala de Idiomas', email: 'hall.english@higashi-school.jp', office: 'Qui, 12:30–13:00' },
  { name: 'Prof. Sato', subject: 'Artes', room: 'Sala de Artes', email: 'sato.artes@higashi-school.jp', office: 'Sex, 15:30–16:30' },
];

export const libraryLoans = [
  { title: 'Livro 05', due: '15/04/2019', status: 'Emprestado', renewable: true },
  { title: 'Atlas de Fotografia Urbana', due: '22/04/2019', status: 'Emprestado', renewable: true },
];

export const libraryHistory = ['Livro 01', 'Livro 02', 'Livro 03', 'Livro 04', 'História do Japão — vol. 2', 'Biologia Moderna'];

export const notices = [
  { date: '11/04/2019', title: 'Mudança de horário — 2º B (sexta, 12/04)', body: 'História passa para a 4ª aula (11:40). Inglês para a 5ª aula (13:30).' },
  { date: '10/04/2019', title: 'Prova de Biologia — 16/04', body: 'Conteúdo: sistema nervoso e órgãos dos sentidos.' },
  { date: '08/04/2019', title: 'Golden Week', body: 'Não haverá aulas de 27/04 a 06/05. Retorno em 07/05.' },
  { date: '05/04/2019', title: 'Laboratório de informática', body: 'Os computadores do Lab. 2 foram atualizados para o HIGASHI OS 3.4.' },
  { date: '02/04/2019', title: 'Reunião de pais', body: 'Dia 24/04, às 18h, no ginásio.' },
];

export const activities = [
  { subject: 'Informática', title: 'Atividade 01 — Uso do computador escolar', due: '12/04/2019', status: 'Em andamento' },
  { subject: 'Biologia', title: 'Estudar para a prova (sistema nervoso)', due: '16/04/2019', status: 'Pendente' },
  { subject: 'Física', title: 'Lista 03 — MUV', due: '18/04/2019', status: 'Pendente' },
  { subject: 'História', title: 'Apresentação: Japão Moderno', due: '19/04/2019', status: 'Em andamento' },
  { subject: 'Química', title: 'Relatório do laboratório', due: '11/04/2019', status: 'Entregue — A' },
  { subject: 'Matemática', title: 'Exercícios 12 a 20 — funções', due: '11/04/2019', status: 'Entregue' },
  { subject: 'Artes', title: 'Projeto final — natureza-morta', due: '29/03/2019', status: 'Entregue — B-' },
];
