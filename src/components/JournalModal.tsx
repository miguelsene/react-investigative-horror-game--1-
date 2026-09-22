import React, { useState } from 'react';
import { Clue } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Panel, Hairline } from './ui/Panel';

interface JournalModalProps {
  clues: Clue[];
  notes: string[];
  currentTime: string;
  onClose: () => void;
  onSelectInspectClue?: (clueId: string) => void;
}

type Tab = 'evidencias' | 'pessoas' | 'locais' | 'cronologia' | 'notas';
const TABS: { id: Tab; label: string }[] = [
  { id: 'evidencias', label: 'Evidências' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'locais', label: 'Locais' },
  { id: 'cronologia', label: 'Cronologia' },
  { id: 'notas', label: 'Notas' },
];

const Person: React.FC<{ img: string; name: string; role: string; text: string; note?: string; danger?: boolean }> = ({ img, name, role, text, note, danger }) => (
  <div className="flex gap-4">
    <div className={`w-16 h-16 shrink-0 border ${danger ? 'border-red-800' : 'border-neutral-700'} overflow-hidden bg-black`}>
      <img src={img} alt={name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
    </div>
    <div className="min-w-0">
      <h4 className={`font-title text-sm tracking-[0.2em] ${danger ? 'text-red-300' : 'text-neutral-100'}`}>{name}</h4>
      <span className="font-serif-jp text-[10px] tracking-[0.3em] uppercase text-neutral-500">{role}</span>
      <p className="font-serif-jp text-sm text-neutral-300 leading-relaxed mt-2">{text}</p>
      {note && <p className="font-serif-jp text-xs italic text-neutral-500 mt-2 border-l border-neutral-700 pl-3">{note}</p>}
    </div>
  </div>
);

export const JournalModal: React.FC<JournalModalProps> = ({ clues, notes, currentTime, onClose, onSelectInspectClue }) => {
  const [tab, setTab] = useState<Tab>('evidencias');
  return (
    <Panel title="DIÁRIO" jp="捜査手帳" subtitle={`Caso 74-0317 · ${currentTime}`} onClose={onClose} hotkey="J" width="max-w-4xl" footer={<><span>Caderno de campo de Gabriela</span><span>{clues.length} evidências · {notes.length} notas</span></>}>
      <nav className="flex gap-6 mb-6 font-serif-jp text-[12px] tracking-[0.3em] uppercase">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              soundManager.playMenuMove();
              setTab(t.id);
            }}
            className={`pb-1 border-b transition-colors ${tab === t.id ? 'border-red-500 text-neutral-100' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'evidencias' && (
        <div className="space-y-7">
          {clues.map((c, i) => (
            <article key={c.id} className="grid grid-cols-[2.2rem_1fr] gap-3">
              <span className="font-title text-xs text-neutral-600 pt-1">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="font-title text-sm tracking-[0.18em] text-neutral-100">{c.title}</h4>
                  {c.timeAssociated && <span className="font-title text-xs text-amber-400">{c.timeAssociated}</span>}
                </div>
                <p className="font-serif-jp text-sm text-neutral-300 leading-relaxed mt-1.5">{c.basicInfo}</p>
                {c.detailedInfo && <p className="font-serif-jp text-sm text-neutral-400 leading-relaxed mt-2 pl-3 border-l border-sky-700/60">{c.detailedInfo}</p>}
                {c.hiddenInfo && <p className="font-serif-jp text-sm text-red-200/90 leading-relaxed mt-2 pl-3 border-l border-red-600">{c.hiddenInfo}</p>}
                {onSelectInspectClue && (
                  <button onClick={() => onSelectInspectClue(c.id)} className="mt-2 font-serif-jp text-[11px] tracking-[0.25em] uppercase text-neutral-500 hover:text-red-300">
                    Examinar objeto →
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'pessoas' && (
        <div className="space-y-7">
          <Person img="/images/gabriela_portrait.png" name="GABRIELA · 16" role="Protagonista" text="Nascida na Inglaterra, vive em Kyoto com a avó paterna. Cognição analítica, aversão a explicações metafísicas e rigor cronológico absoluto." note="“Se um fenômeno parece sobrenatural, isso apenas prova a incompetência transitória do observador.”" />
          <Hairline />
          <Person img="/images/chiyo_portrait.png" name="CHIYO · 74" role="Avó" text="Serena e carinhosa, mas conhece mais sobre 1974 do que admite. Desvia de perguntas sobre relógios e datas." note="Sandálias molhadas e lama vermelha do santuário no kimono: saiu de casa durante a madrugada." />
          <Hairline />
          <Person danger img="/images/shadow_portrait.png" name="SILHUETA · 1974" role="Identidade desconhecida" text="Fotografada na janela do segundo andar em 17/04/1974. Traços, corte de cabelo e clipe idênticos aos de Gabriela — nascida em 2008." />
        </div>
      )}

      {tab === 'locais' && (
        <div className="grid sm:grid-cols-2 gap-8 font-serif-jp text-sm text-neutral-300">
          <div>
            <h4 className="font-title text-xs tracking-[0.3em] text-neutral-100 mb-3">TÉRREO</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><b className="text-neutral-200">Genkan</b> — sapateira, casacos, espelho, saída para a rua.</li>
              <li><b className="text-neutral-200">Cozinha</b> — fogão, chaleira, relógio parado às 06:43, mesa do café.</li>
              <li><b className="text-neutral-200">Sala</b> — kotatsu, TV de tubo, telefone de disco, tansu, tokonoma.</li>
              <li><b className="text-neutral-200">Quarto da avó</b> — butsudan aceso, futon, kimono com lama.</li>
              <li><b className="text-neutral-200">Jardim</b> — lanterna de pedra, bordo, bambu, vaga-lumes na chuva.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-title text-xs tracking-[0.3em] text-neutral-100 mb-3">2º ANDAR</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><b className="text-neutral-200">Quarto de Gabriela</b> — cama, escrivaninha, quadro de horários, janela.</li>
              <li><b className="text-neutral-200">Corredor</b> — moldura vazia, porta do banheiro trancada por dentro.</li>
              <li><b className="text-neutral-200">Escritório</b> — mesa do avô, relógio às 03:17, caixa com a foto de 1974.</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'cronologia' && (
        <ol className="relative pl-6 space-y-6 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-neutral-700">
          {[
            ['17 · 04 · 1974', 'Foto tirada no 2º andar. A silhueta na janela tem os traços de Gabriela.', 'bg-red-500'],
            ['03:17', 'O telefone desconectado toca. O relógio do escritório está parado nesta hora.', 'bg-amber-400'],
            ['06:43', 'Gabriela desperta 17 minutos antes do previsto. O relógio da cozinha congela.', 'bg-sky-400'],
            ['06:44', 'Chiyo diz “você acordou cedo” antes de qualquer confirmação.', 'bg-emerald-400'],
          ].map(([t, d, c]) => (
            <li key={t} className="relative">
              <span className={`absolute -left-[1.35rem] top-1.5 w-2 h-2 rounded-full ${c}`} />
              <div className="font-title text-xs tracking-[0.2em] text-neutral-100">{t}</div>
              <p className="font-serif-jp text-sm text-neutral-400 mt-1">{d}</p>
            </li>
          ))}
        </ol>
      )}

      {tab === 'notas' && (
        <div className="space-y-4">
          {notes.length === 0 && <p className="font-serif-jp text-sm text-neutral-500 italic">Nenhuma anotação.</p>}
          {notes.map((n, i) => (
            <div key={i} className="grid grid-cols-[2.2rem_1fr] gap-3">
              <span className="font-title text-xs text-neutral-600 pt-0.5">{String(notes.length - i).padStart(2, '0')}</span>
              <p className="font-serif-jp text-sm text-neutral-300 leading-relaxed">{n}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};
