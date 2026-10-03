import React, { useEffect, useRef, useState } from 'react';
import { Panel } from './ui/Panel';
import { Minus, Plus, Check } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface Props {
  clockId: string;
  name: string;
  room: string;
  wrong: string;
  target: string;
  alreadyFixed: boolean;
  onClose: () => void;
  onFixed: (clockId: string) => void;
}

const parseTime = (text: string) => {
  const [h, m] = text.split(':').map(Number);
  return { h, m };
};

export const ClockRepairModal: React.FC<Props> = ({ clockId, name, room, wrong, target, alreadyFixed, onClose, onFixed }) => {
  const mountRef = useRef<HTMLCanvasElement>(null);
  const [hours, setHours] = useState(parseTime(alreadyFixed ? target : wrong).h);
  const [minutes, setMinutes] = useState(parseTime(alreadyFixed ? target : wrong).m);
  const [fixed, setFixed] = useState(alreadyFixed);

  const goal = parseTime(target);
  const label = () => {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m}`;
  };

  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;
    const draw = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2; const cy = height / 2; const radius = Math.min(width, height) * 0.39;
      const rim = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.35, radius * 0.12, cx, cy, radius * 1.12);
      rim.addColorStop(0, '#c9a96d'); rim.addColorStop(0.72, '#634728'); rim.addColorStop(1, '#170f0b');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, radius * 1.12, 0, Math.PI * 2); ctx.fill();
      const face = ctx.createRadialGradient(cx - radius * 0.22, cy - radius * 0.28, radius * 0.05, cx, cy, radius);
      face.addColorStop(0, '#fffdf1'); face.addColorStop(0.78, '#e8dfc8'); face.addColorStop(1, '#b8aa8b');
      ctx.fillStyle = face; ctx.beginPath(); ctx.arc(cx, cy, radius * 0.94, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 60; i++) {
        const angle = i * Math.PI / 30 - Math.PI / 2;
        const major = i % 5 === 0;
        ctx.strokeStyle = major ? '#322417' : '#75684f'; ctx.lineWidth = major ? 2 : 0.8;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(angle) * radius * 0.79, cy + Math.sin(angle) * radius * 0.79); ctx.lineTo(cx + Math.cos(angle) * radius * (major ? 0.9 : 0.86), cy + Math.sin(angle) * radius * (major ? 0.9 : 0.86)); ctx.stroke();
      }
      ctx.fillStyle = '#30251b'; ctx.font = `600 ${Math.max(12, radius * 0.15)}px Georgia, serif`;
      for (let i = 1; i <= 12; i++) { const angle = i * Math.PI / 6 - Math.PI / 2; ctx.fillText(String(i), cx + Math.cos(angle) * radius * 0.68, cy + Math.sin(angle) * radius * 0.68); }
      const minuteAngle = minutes * Math.PI / 30 - Math.PI / 2;
      const hourAngle = (hours % 12 + minutes / 60) * Math.PI / 6 - Math.PI / 2;
      const hand = (angle: number, length: number, color: string, lineWidth: number) => { ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - Math.cos(angle) * radius * 0.12, cy - Math.sin(angle) * radius * 0.12); ctx.lineTo(cx + Math.cos(angle) * radius * length, cy + Math.sin(angle) * radius * length); ctx.stroke(); };
      hand(hourAngle, 0.48, '#281a12', Math.max(4, radius * 0.055)); hand(minuteAngle, 0.7, '#322015', Math.max(2.5, radius * 0.035));
      ctx.fillStyle = '#8d2821'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, radius * 0.055), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(cx - radius * 0.26, cy - radius * 0.52, radius * 0.38, radius * 0.09, -0.5, 0, Math.PI * 2); ctx.fill();
    };
    draw();
    const resize = new ResizeObserver(draw); resize.observe(canvas);
    return () => resize.disconnect();
  }, [hours, minutes]);

  useEffect(() => {
    if (fixed || (hours === goal.h && minutes === goal.m)) {
      if (!fixed) {
        setFixed(true);
        soundManager.playClueDiscovered();
        onFixed(clockId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, minutes]);

  const step = (kind: 'h' | 'm10' | 'm1', direction: 1 | -1) => {
    soundManager.playClockTick();
    if (kind === 'h') setHours((v) => ((v - 1 + direction + 12) % 12) + 1);
    else if (kind === 'm10') setMinutes((v) => (v + direction * 10 + 60) % 60);
    else setMinutes((v) => (v + direction + 60) % 60);
  };

  const Control: React.FC<{ label: string; kind: 'h' | 'm10' | 'm1' }> = ({ label: text, kind }) => (
    <div className="flex items-center justify-between border border-neutral-800 px-3 py-2">
      <span className="font-serif-jp text-[12px] text-neutral-400">{text}</span>
      <span className="flex items-center gap-1">
        <button aria-label={`Atrasar ${text}`} onClick={() => step(kind, -1)} className="p-1 text-neutral-400 hover:text-white">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button aria-label={`Adiantar ${text}`} onClick={() => step(kind, 1)} className="p-1 text-neutral-400 hover:text-white">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  );

  return (
    <Panel title="AJUSTAR RELÓGIO" jp="時計" subtitle={`${name} · ${room}`} onClose={onClose} width="max-w-3xl">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="h-72 inspection-view grid place-items-center">
          <canvas ref={mountRef} className="h-full w-full" aria-label={`Relógio marcando ${label()}`} />
        </div>
        <div className="font-serif-jp">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Ponteiros</p>
          <p className={`text-5xl font-title mt-3 ${fixed ? 'text-emerald-200' : 'text-red-200'}`}>{label()}</p>
          <p className="text-sm text-neutral-400 mt-4 leading-relaxed">
            {fixed
              ? 'O relógio está certo. A casa volta a marcar a manhã.'
              : `A avó pediu ${target}. Este estava em ${wrong}.`}
          </p>

          {!fixed && (
            <div className="grid gap-2 mt-6">
              <Control label="Hora" kind="h" />
              <Control label="10 minutos" kind="m10" />
              <Control label="1 minuto" kind="m1" />
            </div>
          )}

          {fixed && (
            <p className="mt-6 flex items-center gap-2 text-sm text-emerald-200">
              <Check className="w-4 h-4" /> Registrado no diário.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
};
