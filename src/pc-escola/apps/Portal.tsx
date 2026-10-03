import { useMemo, useState } from 'react';
import { useOS } from '../os/store';
import { Ico } from '../components/Icons';
import { activities, calendarEvents, grades, libraryHistory, libraryLoans, notices, periods, portalStudent, teachers, timetable, weekDays } from '../data/portal';
import { normalize, pad, sceneNow } from '../os/utils';

type Section = 'inicio' | 'calendario' | 'horarios' | 'notas' | 'professores' | 'biblioteca' | 'avisos' | 'atividades';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'calendario', label: 'Calendário', icon: 'calendar' },
  { id: 'horarios', label: 'Horários', icon: 'clock' },
  { id: 'notas', label: 'Notas', icon: 'chart' },
  { id: 'professores', label: 'Professores', icon: 'users' },
  { id: 'biblioteca', label: 'Biblioteca', icon: 'book' },
  { id: 'avisos', label: 'Avisos', icon: 'bell' },
  { id: 'atividades', label: 'Atividades', icon: 'clipboard' },
];

const TYPE_COLOR = { prova: 'bg-red-100 text-red-800', entrega: 'bg-amber-100 text-amber-800', evento: 'bg-blue-100 text-blue-800', feriado: 'bg-emerald-100 text-emerald-800', aula: 'bg-violet-100 text-violet-800' };

function useSchedule() {
  const now = sceneNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const toM = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3);
  const curIdx = periods.findIndex((p) => mins >= toM(p.start) && mins < toM(p.end));
  const nextIdx = periods.findIndex((p) => toM(p.start) > mins);
  return { curIdx, nextIdx };
}

export default function Portal() {
  const os = useOS();
  const [sec, setSec] = useState<Section>('inicio');
  const [q, setQ] = useState('');
  const [month, setMonth] = useState(3); // April (0-indexed)
  const [day, setDay] = useState('2019-04-12');
  const [loans, setLoans] = useState(libraryLoans);
  const { curIdx, nextIdx } = useSchedule();
  const fri = timetable[4];
  const next = nextIdx >= 0 ? { ...fri[nextIdx], period: periods[nextIdx] } : null;
  const nextTeacher = next ? teachers.find((t) => t.subject.startsWith(next.subject.split(' ')[0])) : null;



  const results = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return [];
    const r: { sec: Section; text: string }[] = [];
    Object.entries(calendarEvents).forEach(([d, evs]) => evs.forEach((e) => normalize(e.title + ' ' + d).includes(nq) && r.push({ sec: 'calendario', text: `${d.split('-').reverse().join('/')} — ${e.title}` })));
    timetable.forEach((day, di) => day.forEach((c, pi) => normalize(c.subject + ' ' + weekDays[di]).includes(nq) && r.push({ sec: 'horarios', text: `${weekDays[di]}, ${pi + 1}ª aula (${periods[pi].start}) — ${c.subject}, ${c.room}` })));
    grades.forEach((g) => normalize(g.subject + ' ' + g.last + ' ' + g.teacher).includes(nq) && r.push({ sec: 'notas', text: `${g.subject}: ${g.b1} — ${g.last}` }));
    teachers.forEach((t) => normalize(t.name + ' ' + t.subject).includes(nq) && r.push({ sec: 'professores', text: `${t.name} — ${t.subject} (${t.email})` }));
    notices.forEach((n) => normalize(n.title + ' ' + n.body).includes(nq) && r.push({ sec: 'avisos', text: `${n.date} — ${n.title}` }));
    activities.forEach((a) => normalize(a.subject + ' ' + a.title).includes(nq) && r.push({ sec: 'atividades', text: `${a.subject}: ${a.title} (até ${a.due})` }));
    loans.forEach((l) => normalize(l.title).includes(nq) && r.push({ sec: 'biblioteca', text: `${l.title} — devolver até ${l.due}` }));
    return r;
  }, [q, loans]);

  const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg ring-1 ring-slate-200 p-4 ${className}`}>
      <h3 className="font-semibold text-slate-700 mb-2 text-sm">{title}</h3>
      {children}
    </div>
  );

  const renderCalendar = () => {
    const first = new Date(2019, month, 1);
    const startDay = first.getDay();
    const days = new Date(2019, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(startDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    const monthName = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const evs = calendarEvents[day] ?? [];
    return (
      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        <Card title="">
          <div className="flex items-center mb-3 -mt-6">
            <button disabled={month <= 2} onClick={() => setMonth(month - 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><Ico name="back" /></button>
            <h2 className="flex-1 text-center font-semibold capitalize">{monthName}</h2>
            <button disabled={month >= 6} onClick={() => setMonth(month + 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><Ico name="forward" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => <div key={d} className="text-slate-500 font-medium py-1">{d}</div>)}
            {cells.map((d, k) => {
              if (!d) return <div key={k} />;
              const key = `2019-${pad(month + 1)}-${pad(d)}`;
              const e = calendarEvents[key];
              const isToday = key === '2019-04-12';
              return (
                <button key={k} onClick={() => setDay(key)} className={`min-h-14 rounded p-1 text-left flex flex-col gap-0.5 ring-1 ${day === key ? 'ring-rose-500 bg-rose-50' : 'ring-slate-100 hover:bg-slate-50'} ${k % 7 === 0 || k % 7 === 6 ? 'text-slate-400' : ''}`}>
                  <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-600 text-white font-bold' : ''}`}>{d}</span>
                  {e?.slice(0, 2).map((x, j) => <span key={j} className={`text-[9px] leading-tight rounded px-1 truncate ${TYPE_COLOR[x.type]}`}>{x.title}</span>)}
                </button>
              );
            })}
          </div>
        </Card>
        <Card title={`Eventos — ${day.split('-').reverse().join('/')}${day === '2019-04-12' ? ' (hoje)' : ''}`}>
          {evs.length === 0 ? <p className="text-xs text-slate-500">Nenhum evento neste dia.</p> : (
            <ul className="space-y-2">{evs.map((e, k) => <li key={k} className={`text-xs rounded px-2 py-1.5 ${TYPE_COLOR[e.type]}`}>{e.title}</li>)}</ul>
          )}
          {day === '2019-04-12' && <button onClick={() => setSec('horarios')} className="mt-3 text-xs text-rose-700 hover:underline">Ver horário de hoje →</button>}
          <div className="mt-4 pt-3 border-t space-y-1">
            {Object.entries(TYPE_COLOR).map(([k, c]) => <div key={k} className="flex items-center gap-2 text-[11px]"><span className={`w-3 h-3 rounded ${c}`} />{k}</div>)}
          </div>
        </Card>
      </div>
    );
  };

  const content = () => {
    if (q.trim())
      return (
        <Card title={`Resultados para "${q}" (${results.length})`}>
          {results.length === 0 && <p className="text-xs text-slate-500">Nenhum resultado encontrado no portal.</p>}
          <ul className="divide-y">{results.map((r, k) => (
            <li key={k}><button onClick={() => { setSec(r.sec); setQ(''); }} className="w-full text-left py-2 text-sm hover:text-rose-700 flex gap-3"><span className="text-[11px] uppercase text-slate-400 w-20 shrink-0 pt-0.5">{r.sec}</span>{r.text}</button></li>
          ))}</ul>
        </Card>
      );
    switch (sec) {
      case 'inicio':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Hoje — sexta-feira, 12/04/2019" className="md:col-span-2">
              <div className="flex flex-wrap gap-3 text-sm">
                {curIdx >= 0 && <div className="px-3 py-2 rounded bg-slate-100">Agora: <b>{fri[curIdx].subject}</b> ({periods[curIdx].start}–{periods[curIdx].end})</div>}
                {next && <div className="px-3 py-2 rounded bg-rose-50 ring-1 ring-rose-200">Próxima aula: <b>{next.subject}</b> às {next.period.start}</div>}
              </div>
              <button onClick={() => setSec('horarios')} className="mt-3 text-xs text-rose-700 hover:underline">Ver horário completo →</button>
            </Card>
            <Card title="Avisos recentes">
              <ul className="space-y-2">{notices.slice(0, 3).map((n) => <li key={n.title} className="text-xs"><span className="text-slate-400">{n.date}</span> — {n.title}</li>)}</ul>
            </Card>
            <Card title="Próximas entregas">
              <ul className="space-y-2">{activities.filter((a) => !a.status.startsWith('Entregue')).map((a) => <li key={a.title} className="text-xs flex justify-between gap-2"><span>{a.subject}: {a.title}</span><span className="text-slate-400 shrink-0">{a.due.slice(0, 5)}</span></li>)}</ul>
            </Card>
          </div>
        );
      case 'calendario':
        return renderCalendar();
      case 'horarios':
        return (
          <div className="space-y-4">
            {next && (
              <div className="rounded-lg bg-rose-600 text-white p-4 flex flex-wrap items-center gap-4">
                <Ico name="clock" size={28} />
                <div>
                  <div className="text-xs uppercase tracking-wide text-rose-100">Próxima aula</div>
                  <div className="text-lg font-bold">{next.subject} — {next.period.start} às {next.period.end}</div>
                  <div className="text-sm text-rose-100">Sala {next.room}{nextTeacher ? ` • ${nextTeacher.name}` : ''}{next.note ? ` • ${next.note}` : ''}</div>
                </div>
              </div>
            )}
            <Card title="Horário semanal — 2º ano B">
              <div className="overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr><th className="p-2 text-left text-slate-500 font-medium">Aula</th>{weekDays.map((d, i) => <th key={d} className={`p-2 font-medium ${i === 4 ? 'bg-rose-50 text-rose-800' : 'text-slate-500'}`}>{d}{i === 4 ? ' (hoje)' : ''}</th>)}</tr></thead>
                  <tbody>
                    {periods.map((p, pi) => (
                      <tr key={p.n} className="border-t">
                        <td className="p-2 whitespace-nowrap text-slate-500">{p.n}ª <span className="text-slate-400">{p.start}–{p.end}</span></td>
                        {timetable.map((dayRow, di) => {
                          const c = dayRow[pi];
                          const isCur = di === 4 && pi === curIdx;
                          const isNext = di === 4 && pi === nextIdx;
                          return (
                            <td key={di} className={`p-2 align-top ${di === 4 ? 'bg-rose-50/50' : ''} ${isNext ? '!bg-rose-200 ring-2 ring-rose-500 ring-inset' : ''} ${isCur ? '!bg-slate-200' : ''}`}>
                              <div className="font-medium">{c.subject}</div>
                              <div className="text-slate-400">{c.room}</div>
                              {c.note && <div className="text-rose-700 text-[10px]">{c.note}</div>}
                              {isCur && <div className="text-[10px] font-bold text-slate-700">AGORA</div>}
                              {isNext && <div className="text-[10px] font-bold text-rose-800">PRÓXIMA</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="border-t"><td className="p-2 text-slate-400" colSpan={6}>Almoço: 12:30–13:30</td></tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      case 'notas':
        return (
          <Card title="Notas — 1º bimestre 2019 (parcial)">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="py-1.5">Disciplina</th><th>Média</th><th className="hidden md:table-cell">Última avaliação</th><th className="hidden md:table-cell">Professor(a)</th></tr></thead>
              <tbody>{grades.map((g) => (
                <tr key={g.subject} className="border-t"><td className="py-1.5 font-medium">{g.subject}</td><td><span className={`px-2 py-0.5 rounded text-xs font-bold ${g.b1.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : g.b1.startsWith('B') ? 'bg-blue-100 text-blue-800' : g.b1.startsWith('C') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100'}`}>{g.b1}</span></td><td className="text-xs text-slate-600 hidden md:table-cell">{g.last}</td><td className="text-xs text-slate-500 hidden md:table-cell">{g.teacher}</td></tr>
              ))}</tbody>
            </table>
          </Card>
        );
      case 'professores':
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teachers.map((t) => (
              <Card key={t.name} title={t.name}>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>{t.subject}</div><div>Sala: {t.room}</div><div>Atendimento: {t.office}</div>
                  <div className="text-blue-700 break-all">{t.email}</div>
                </div>
              </Card>
            ))}
          </div>
        );
      case 'biblioteca':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Empréstimos ativos">
              <ul className="space-y-3">{loans.map((l, k) => (
                <li key={l.title} className="flex items-center gap-3 text-sm">
                  <Ico name="book" size={18} className="text-slate-400" />
                  <div className="flex-1"><div className="font-medium">{l.title}</div><div className="text-xs text-slate-500">Devolver até {l.due}</div></div>
                  <button disabled={!l.renewable} onClick={() => { const nd = l.due === '15/04/2019' ? '29/04/2019' : '06/05/2019'; setLoans(loans.map((x, j) => (j === k ? { ...x, due: nd, renewable: false } : x))); os.notify('Empréstimo renovado', `${l.title} — nova data: ${nd}`); }} className="text-xs px-2 py-1 rounded border hover:bg-slate-50 disabled:opacity-40">{l.renewable ? 'Renovar' : 'Renovado'}</button>
                </li>
              ))}</ul>
            </Card>
            <Card title="Histórico de leitura">
              <ul className="text-xs space-y-1 text-slate-600">{libraryHistory.map((b) => <li key={b}>• {b}</li>)}</ul>
              <p className="text-[11px] text-slate-400 mt-3">Horário: seg–sex, 8h às 17h30.</p>
            </Card>
          </div>
        );
      case 'avisos':
        return <div className="space-y-3">{notices.map((n) => <Card key={n.title} title={n.title}><p className="text-xs text-slate-400 mb-1">{n.date}</p><p className="text-sm">{n.body}</p></Card>)}</div>;
      case 'atividades':
        return (
          <Card title="Atividades e entregas">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="py-1.5">Disciplina</th><th>Atividade</th><th>Prazo</th><th>Situação</th></tr></thead>
              <tbody>{activities.map((a) => {
                const status = a.subject === 'Informática' && os.task.completedNotified ? `Entregue — Nota ${(os.task.quizScore * 2).toFixed(1)}` : a.status;
                return <tr key={a.title} className="border-t"><td className="py-1.5 font-medium">{a.subject}</td><td className="text-xs">{a.title}</td><td className="text-xs">{a.due}</td><td><span className={`text-[11px] px-2 py-0.5 rounded ${status.startsWith('Entregue') ? 'bg-emerald-100 text-emerald-800' : status === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{status}</span></td></tr>;
              })}</tbody>
            </table>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col h-full text-sm bg-slate-50">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-rose-700 text-white">
        <div className="w-8 h-8 rounded bg-white/15 flex items-center justify-center font-black">東</div>
        <div className="leading-tight">
          <div className="font-semibold">Portal da Escola Higashi</div>
          <div className="text-[11px] text-rose-100">{portalStudent.name} • {portalStudent.turma} • Matrícula {portalStudent.id}</div>
        </div>
        <div className="ml-auto relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar no portal" className="rounded bg-white/15 placeholder:text-rose-100 pl-7 pr-2 py-1.5 text-[13px] w-40 md:w-56 outline-none focus:bg-white focus:text-slate-800" />
          <Ico name="search" size={13} className="absolute left-2 top-2.5 opacity-70" />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <nav className="w-44 bg-white border-r p-2 space-y-0.5 shrink-0">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => { setSec(s.id); setQ(''); }} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left ${sec === s.id && !q ? 'bg-rose-50 text-rose-800 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}>
              <Ico name={s.icon} size={14} /> {s.label}
            </button>
          ))}
        </nav>
        <main className="os-readable flex-1 overflow-auto p-4">{content()}</main>
      </div>
    </div>
  );
}
