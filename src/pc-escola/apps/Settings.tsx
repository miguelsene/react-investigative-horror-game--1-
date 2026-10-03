import { useState } from 'react';
import { useOS, isAlive } from '../os/store';
import { Ico } from '../components/Icons';
import { Btn } from '../components/Dialogs';
import { fmtDate } from '../os/utils';
import { playSound } from '../os/sound';
import type { ImageContent, Settings as S } from '../os/types';

type Sec = 'sistema' | 'tela' | 'idioma' | 'mouse' | 'acess' | 'impressoras' | 'sobre';
const SECS: { id: Sec; label: string; icon: string }[] = [
  { id: 'sistema', label: 'Som', icon: 'volume' },
  { id: 'tela', label: 'Tela e papel de parede', icon: 'monitor' },
  { id: 'idioma', label: 'Idioma e teclado', icon: 'globe' },
  { id: 'mouse', label: 'Mouse', icon: 'mouse' },
  { id: 'acess', label: 'Acessibilidade', icon: 'eye' },
  { id: 'impressoras', label: 'Impressoras', icon: 'print' },
  { id: 'sobre', label: 'Sobre', icon: 'info' },
];

export const SOLID_WALLPAPERS = ['solid:#1e3a5f', 'solid:#2f4f4f', 'solid:#4a3b5c', 'solid:#3d3d3d', 'solid:#0f766e'];

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div className="flex-1"><div className="font-medium text-sm">{label}</div>{desc && <div className="text-xs text-slate-500">{desc}</div>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ v, on }: { v: boolean; on: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={v} onClick={() => on(!v)} className={`w-11 h-6 rounded-full relative transition ${v ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${v ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Settings() {
  const os = useOS();
  const st = os.settings;
  const set = (p: Partial<S>) => os.setSettings(p);
  const [sec, setSec] = useState<Sec>('sistema');
  const [dbl, setDbl] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const images = os.files.filter((f) => f.type === 'image' && isAlive(os.files, f.id));

  return (
    <div className="flex h-full text-sm">
      <nav className="w-52 border-r bg-slate-50 p-2 space-y-0.5 shrink-0">
        {SECS.map((s) => (
          <button key={s.id} onClick={() => setSec(s.id)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left ${sec === s.id ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-slate-100'}`}>
            <Ico name={s.icon} size={15} /> {s.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto p-5">
        <h2 className="text-lg font-semibold mb-3">{SECS.find((s) => s.id === sec)?.label}</h2>
        {sec === 'sistema' && (
          <>
            <Row label="Volume" desc={`${st.volume}%`}>
              <input type="range" min={0} max={100} value={st.volume} onChange={(e) => set({ volume: +e.target.value })} onMouseUp={() => playSound('notify', st)} className="w-48" />
            </Row>
            <Row label="Silenciar"><Toggle v={st.muted} on={(v) => set({ muted: v })} /></Row>
            <Row label="Testar som"><Btn onClick={() => playSound('success', st)}>Reproduzir</Btn></Row>
          </>
        )}
        {sec === 'tela' && (
          <>
            <Row label="Brilho da interface" desc={`${st.brightness}%`}>
              <input type="range" min={50} max={120} value={st.brightness} onChange={(e) => set({ brightness: +e.target.value })} className="w-48" />
            </Row>
            <Row label="Tamanho da fonte">
              <div className="flex rounded border overflow-hidden">
                {(['small', 'medium', 'large'] as const).map((f) => (
                  <button key={f} onClick={() => set({ fontSize: f })} className={`px-3 py-1 text-xs ${st.fontSize === f ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>{{ small: 'Pequena', medium: 'Média', large: 'Grande' }[f]}</button>
                ))}
              </div>
            </Row>
            <div className="py-3">
              <div className="font-medium mb-2">Papel de parede</div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {['/pc-escola/images/win7_wallpaper.jpg', ...images.map((i) => (i.content as ImageContent).src)].filter((v, i, a) => a.indexOf(v) === i).map((src) => (
                  <button key={src} onClick={() => set({ wallpaper: src })} className={`aspect-video rounded overflow-hidden ring-2 ${st.wallpaper === src ? 'ring-blue-600' : 'ring-transparent hover:ring-slate-300'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {SOLID_WALLPAPERS.map((w) => (
                  <button key={w} onClick={() => set({ wallpaper: w })} className={`aspect-video rounded ring-2 ${st.wallpaper === w ? 'ring-blue-600' : 'ring-transparent hover:ring-slate-300'}`} style={{ background: w.slice(6) }} />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Dica: na Galeria, use "Papel de parede" para definir qualquer foto.</p>
            </div>
          </>
        )}
        {sec === 'idioma' && (
          <>
            <Row label="Idioma da interface" desc="Altera os nomes do menu Iniciar, da área de trabalho e da barra de tarefas.">
              <select value={st.language} onChange={(e) => set({ language: e.target.value as S['language'] })} className="border rounded px-2 py-1.5">
                <option value="pt">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </Row>
            <Row label="Layout do teclado">
              <select value={st.keyboard} onChange={(e) => set({ keyboard: e.target.value as S['keyboard'] })} className="border rounded px-2 py-1.5">
                <option value="PT">PT — Português (ABNT2)</option>
                <option value="JA">JA — Japonês (IME)</option>
              </select>
            </Row>
          </>
        )}
        {sec === 'mouse' && (
          <>
            <Row label="Velocidade do cursor / duplo clique" desc={`Nível ${st.cursorSpeed} — intervalo de duplo clique: ${750 - st.cursorSpeed * 50} ms`}>
              <input type="range" min={1} max={10} value={st.cursorSpeed} onChange={(e) => set({ cursorSpeed: +e.target.value })} className="w-48" />
            </Row>
            <div className="py-3">
              <div className="text-xs text-slate-500 mb-2">Área de teste — dê um duplo clique na pasta:</div>
              <button
                onClick={() => { const now = Date.now(); if (now - lastClick < 750 - st.cursorSpeed * 50) { setDbl(dbl + 1); setLastClick(0); } else setLastClick(now); }}
                className={`w-20 h-20 rounded-lg flex items-center justify-center text-4xl transition ${dbl % 2 ? 'bg-amber-100' : 'bg-slate-100'}`}
              >{dbl % 2 ? '📂' : '📁'}</button>
              <div className="text-xs text-slate-500 mt-1">Duplos cliques detectados: {dbl}</div>
            </div>
            <Row label="Cursor grande"><Toggle v={st.largeCursor} on={(v) => set({ largeCursor: v })} /></Row>
          </>
        )}
        {sec === 'acess' && (
          <>
            <Row label="Alto contraste" desc="Aumenta o contraste de toda a interface."><Toggle v={st.highContrast} on={(v) => set({ highContrast: v })} /></Row>
            <Row label="Reduzir animações" desc="Desativa transições e animações."><Toggle v={st.reduceMotion} on={(v) => set({ reduceMotion: v })} /></Row>
            <Row label="Cursor grande"><Toggle v={st.largeCursor} on={(v) => set({ largeCursor: v })} /></Row>
            <Row label="Texto grande"><Toggle v={st.fontSize === 'large'} on={(v) => set({ fontSize: v ? 'large' : 'medium' })} /></Row>
          </>
        )}
        {sec === 'impressoras' && (
          <>
            <Row label="LAB-PRINTER-01" desc="Laser P&B • Laboratório 2 • Pronta"><span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Padrão</span></Row>
            <Row label="LAB-PRINTER-02" desc="Laser colorida • Sala dos professores • Sem papel"><span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">Offline</span></Row>
            <div className="mt-4 font-medium mb-2">Registro de impressão</div>
            {os.printLog.length === 0 ? <p className="text-xs text-slate-500">Nenhum documento impresso nesta conta.</p> : (
              <table className="w-full text-xs">
                <thead><tr className="text-left text-slate-500"><th className="py-1">Documento</th><th>Páginas</th><th>Cópias</th><th>Data</th></tr></thead>
                <tbody>{os.printLog.map((j) => <tr key={j.id} className="border-t"><td className="py-1">{j.document}</td><td>{j.pages}</td><td>{j.copies}</td><td>{fmtDate(j.date)}</td></tr>)}</tbody>
              </table>
            )}
          </>
        )}
        {sec === 'sobre' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="text-4xl font-black">東</div>
              <div><div className="font-bold text-lg">HIGASHI OS 3.4</div><div className="text-xs text-white/60">Edição Escolar • Build 2019.03</div></div>
            </div>
            <dl className="grid grid-cols-[150px_1fr] gap-y-1.5 text-sm">
              <dt className="text-slate-500">Computador</dt><dd>LAB2-PC17</dd>
              <dt className="text-slate-500">Usuário</dt><dd>{os.currentUser}</dd>
              <dt className="text-slate-500">Rede</dt><dd>HIGASHI-SCHOOL (conectado)</dd>
              <dt className="text-slate-500">Processador</dt><dd>Intel Core i3-7100 3.90 GHz</dd>
              <dt className="text-slate-500">Memória</dt><dd>4,00 GB</dd>
              <dt className="text-slate-500">Arquivos</dt><dd>{os.files.filter((f) => !f.deleted && f.type !== 'folder').length} arquivos em Meus Documentos</dd>
              <dt className="text-slate-500">Sessões</dt><dd>{os.sessions}</dd>
            </dl>
            <Btn onClick={() => os.setSettings({ volume: 60, muted: false, brightness: 100, fontSize: 'medium', wallpaper: '/pc-escola/images/win7_wallpaper.jpg', language: 'pt', cursorSpeed: 5, highContrast: false, reduceMotion: false, largeCursor: false, keyboard: 'PT' })}>Restaurar configurações padrão</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
