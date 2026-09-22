import React, { useState } from 'react';
import { soundManager } from '../audio/soundManager';
import { Panel, Hairline } from './ui/Panel';

interface SettingsModalProps {
  crtEnabled: boolean;
  onToggleCrt: (enabled: boolean) => void;
  cameraMotionEnabled: boolean;
  onToggleCameraMotion: (enabled: boolean) => void;
  onManualSave: () => void;
  onResetData: () => void;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: number; onChange: (v: number) => void; accent: string }> = ({ label, value, onChange, accent }) => (
  <label className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 items-center py-2">
    <span className="font-serif-jp text-sm text-neutral-300">{label}</span>
    <span className="font-title text-xs text-neutral-500 w-10 text-right">{value}%</span>
    <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`col-span-2 w-full h-px bg-neutral-700 ${accent}`} />
  </label>
);

const Toggle: React.FC<{ label: string; hint: string; on: boolean; onToggle: () => void }> = ({ label, hint, on, onToggle }) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between py-3 text-left group">
    <div>
      <div className="font-serif-jp text-sm text-neutral-200">{label}</div>
      <div className="font-serif-jp text-[11px] text-neutral-500">{hint}</div>
    </div>
    <span className={`font-title text-[11px] tracking-[0.3em] ${on ? 'text-red-400' : 'text-neutral-500 group-hover:text-neutral-300'}`}>{on ? 'LIGADO' : 'DESLIGADO'}</span>
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ crtEnabled, onToggleCrt, cameraMotionEnabled, onToggleCameraMotion, onManualSave, onResetData, onClose }) => {
  const [master, setMaster] = useState(80);
  const [music, setMusic] = useState(60);
  const [sfx, setSfx] = useState(75);
  const [muted, setMuted] = useState(soundManager.getMuted());
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const vol = (m: number, mu: number, s: number) => soundManager.setVolume(m / 100, mu / 100, s / 100);

  return (
    <Panel title="OPÇÕES" jp="設定" onClose={onClose} width="max-w-2xl" footer={<><span>Kyoto · 1974 / 2019</span><span>Alterações aplicadas imediatamente</span></>}>
      <Hairline label="Áudio" />
      <Row label="Volume geral" value={master} onChange={(v) => { setMaster(v); vol(v, music, sfx); }} accent="accent-red-500" />
      <Row label="Música e ambiente" value={music} onChange={(v) => { setMusic(v); vol(master, v, sfx); }} accent="accent-amber-400" />
      <Row label="Efeitos, passos e vozes" value={sfx} onChange={(v) => { setSfx(v); vol(master, music, v); soundManager.playClockTick(); }} accent="accent-sky-400" />
      <Toggle label="Silenciar tudo" hint="Desliga o motor de áudio sem perder os volumes" on={muted} onToggle={() => { const n = !muted; setMuted(n); soundManager.setMute(n); }} />

      <Hairline label="Vídeo" />
      <Toggle label="Filtro CRT e vinheta" hint="Linhas de varredura e escurecimento das bordas" on={crtEnabled} onToggle={() => onToggleCrt(!crtEnabled)} />
      <Toggle label="Movimentos suaves da câmera" hint="Leve respiração e balanço dos passos. Respeita a preferência de movimento reduzido do sistema." on={cameraMotionEnabled} onToggle={() => onToggleCameraMotion(!cameraMotionEnabled)} />

      <Hairline label="Comandos" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-serif-jp text-[12px] text-neutral-400">
        {[['W A S D', 'mover'], ['E', 'interagir'], ['+ / −', 'zoom da câmera'], ['I', 'inventário'], ['J', 'diário'], ['Q', 'quadro de pistas'], ['ESC', 'menu']].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-neutral-800/70 py-1"><span className="font-title text-neutral-200 text-[11px] tracking-[0.2em]">{k}</span><span>{v}</span></div>
        ))}
      </div>

      <Hairline label="Dados" />
      <div className="flex items-center justify-between font-serif-jp text-[12px] tracking-[0.25em] uppercase">
        <button onClick={() => { soundManager.playMenuSelect(); onManualSave(); setSaved(true); setTimeout(() => setSaved(false), 2500); }} className="text-neutral-300 hover:text-white">
          {saved ? '✓ Progresso salvo' : 'Salvar agora'}
        </button>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="text-neutral-500 hover:text-red-300">Apagar progresso</button>
        ) : (
          <span className="flex gap-5">
            <button onClick={() => { soundManager.playAnomalySting(); onResetData(); onClose(); }} className="text-red-400 hover:text-red-300">Confirmar</button>
            <button onClick={() => setConfirm(false)} className="text-neutral-400 hover:text-white">Cancelar</button>
          </span>
        )}
      </div>
    </Panel>
  );
};
