import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Shield, Sparkles, Footprints, Eye, Zap, Crosshair } from 'lucide-react';

interface CombatEnemy {
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  weakness: string;
  analyses: string[];
}

interface CombatModalProps {
  playerStats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onVictory: () => void;
  onFlee: () => void;
  onDefeat: () => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({
  playerStats,
  onUpdateStats,
  onVictory,
  onFlee,
  onDefeat,
}) => {
  const [enemy, setEnemy] = useState<CombatEnemy>({
    name: 'Silhueta Residual das 03:17',
    type: 'Anomalia Eletromagnética de Kyoto',
    hp: 120,
    maxHp: 120,
    weakness: 'Frequência de Luz e Pulso Rítmico',
    analyses: [
      'Análise 1/3: A entidade reage bruscamente a gradientes de luminosidade acima de 400 lumens.',
      'Análise 2/3: Os vetores de aproximação revelam que ela evita áreas de piso de madeira com reflexo úmido.',
      'Análise 3/3: O núcleo oscila a 3.17 Hz. Uma perturbação rítmica pode dissipar a coesão da massa escura.',
    ],
  });

  const [analysisLevel, setAnalysisLevel] = useState<number>(0);
  const [combatLog, setCombatLog] = useState<string[]>([
    'Uma anomalia sombria materializou-se no corredor.',
    'Gabriela mantém a pulsação controlada para avaliar a situação.',
  ]);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [isDefending, setIsDefending] = useState<boolean>(false);

  const addLog = (text: string) => {
    setCombatLog((prev) => [text, ...prev.slice(0, 5)]);
  };

  const handlePlayerAction = (action: 'attack' | 'defend' | 'analyze' | 'skill' | 'flee') => {
    if (!isPlayerTurn) return;

    if (action === 'analyze') {
      soundManager.playClueDiscovered();
      const nextLevel = Math.min(analysisLevel + 1, enemy.analyses.length);
      setAnalysisLevel(nextLevel);
      addLog(`[ANALISAR]: ${enemy.analyses[nextLevel - 1]}`);
      
      // Bonus to observation
      onUpdateStats({
        observation: Math.min(100, playerStats.observation + 3),
        focus: Math.min(100, playerStats.focus + 5),
      });

      if (nextLevel === 3) {
        addLog('Ponto fraco totalmente mapeado! Dano analítico aumentado em 200%.');
      }

      endTurn();
      return;
    }

    if (action === 'attack') {
      soundManager.playFootstep('wood');
      const baseDamage = 25 + Math.floor(playerStats.investigation * 0.2);
      const multiplier = analysisLevel === 3 ? 2.5 : analysisLevel === 2 ? 1.6 : 1.0;
      const damage = Math.round(baseDamage * multiplier);

      const newEnemyHp = Math.max(0, enemy.hp - damage);
      setEnemy((prev) => ({ ...prev, hp: newEnemyHp }));
      addLog(`Gabriela ataca com foco metódico causando ${damage} de dispersão na anomalia.`);

      if (newEnemyHp <= 0) {
        soundManager.playClueDiscovered();
        addLog('A anomalia perdeu coesão e se desfez no ar.');
        setTimeout(() => onVictory(), 1800);
        return;
      }

      endTurn();
      return;
    }

    if (action === 'defend') {
      soundManager.playDoorCreak();
      setIsDefending(true);
      addLog('Gabriela assume postura defensiva, protegendo seu foco e reduzindo o impacto.');
      onUpdateStats({ focus: Math.min(100, playerStats.focus + 12) });
      endTurn();
      return;
    }

    if (action === 'skill') {
      soundManager.playAnomalySting();
      if (playerStats.focus < 25) {
        addLog('Foco insuficiente para executar Dedução Instantânea.');
        return;
      }
      onUpdateStats({ focus: playerStats.focus - 25 });
      const skillDamage = 50;
      const newEnemyHp = Math.max(0, enemy.hp - skillDamage);
      setEnemy((prev) => ({ ...prev, hp: newEnemyHp }));
      addLog(`[HABILIDADE: HIPÓTESE CARTESIANA]: Gabriela neutraliza a geometria do espectro por ${skillDamage} de dano!`);

      if (newEnemyHp <= 0) {
        soundManager.playClueDiscovered();
        setTimeout(() => onVictory(), 1800);
        return;
      }

      endTurn();
      return;
    }

    if (action === 'flee') {
      soundManager.playFootstep('wood');
      addLog('Gabriela recua estrategicamente em direção à área iluminada.');
      setTimeout(() => onFlee(), 1000);
    }
  };

  const endTurn = () => {
    setIsPlayerTurn(false);
    setTimeout(() => {
      enemyTurn();
    }, 1200);
  };

  const enemyTurn = () => {
    soundManager.playHeartbeat();
    const rawDamage = 18;
    const actualDamage = isDefending ? Math.floor(rawDamage * 0.4) : rawDamage;
    const focusDrain = isDefending ? 5 : 12;

    const newHp = Math.max(0, playerStats.health - actualDamage);
    const newFocus = Math.max(0, playerStats.focus - focusDrain);

    onUpdateStats({
      health: newHp,
      focus: newFocus,
    });

    addLog(`A anomalia distorce o espaço, causando ${actualDamage} de impacto e ${focusDrain} de tensão.`);
    setIsDefending(false);
    setIsPlayerTurn(true);

    if (newHp <= 0) {
      soundManager.playAnomalySting();
      addLog('A percepção de Gabriela vacilou completamente.');
      setTimeout(() => onDefeat(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg select-none">
      <div className="relative w-full max-w-4xl bg-[#0d0f14] border-2 border-red-950/80 rounded-lg shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        
        {/* Header Bar */}
        <div className="p-4 bg-red-950/20 border-b border-red-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              ENCONTRO DE TENSÃO PSICOLÓGICA
            </span>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {isPlayerTurn ? 'TURNO DE GABRIELA' : 'AÇÃO DA ANOMALIA...'}
          </span>
        </div>

        {/* Battlefield Visual Presentation */}
        <div className="relative p-6 bg-gradient-to-b from-[#151922] to-[#0c0e12] flex flex-col md:flex-row items-center justify-between gap-6 border-b border-neutral-800 min-h-[220px]">
          
          {/* Gabriela's Status Card */}
          <div className="w-full md:w-5/12 bg-black/40 border border-neutral-800 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm font-title text-neutral-100">GABRIELA (16)</h3>
              <span className="text-[10px] font-mono text-neutral-400">STATUS: CONCENTRADA</span>
            </div>

            {/* Health Bar */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                <span>VIDA</span>
                <span>{playerStats.health} / {playerStats.maxHealth}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden border border-neutral-800">
                <div
                  className="bg-red-600 h-full transition-all duration-300"
                  style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Focus (Calm / Sanity) Bar */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                <span>FOCO MENTAL</span>
                <span>{playerStats.focus} / {playerStats.maxFocus}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden border border-neutral-800">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${(playerStats.focus / playerStats.maxFocus) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-1">
              <div>OBSERVAÇÃO: {playerStats.observation}</div>
              <div>INVESTIGAÇÃO: {playerStats.investigation}</div>
            </div>
          </div>

          {/* Anomaly Silhouette Center & Enemy Card */}
          <div className="w-full md:w-6/12 bg-red-950/20 border border-red-900/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm font-title text-red-200">{enemy.name}</h3>
                <span className="text-[10px] font-mono text-red-400">{enemy.type}</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                ESTÁGIO ANALÍTICO: {analysisLevel}/3
              </span>
            </div>

            {/* Enemy HP */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                <span>COESÃO DO ESPECTRO</span>
                <span>{enemy.hp} / {enemy.maxHp}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden border border-neutral-800">
                <div
                  className="bg-red-700 h-full transition-all duration-300"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {analysisLevel > 0 && (
              <div className="p-2 bg-black/50 border border-red-900/60 rounded text-[11px] font-mono text-red-300">
                <span className="font-bold text-red-400 uppercase block text-[9px]">Ponto de Fraqueza Identificado:</span>
                {enemy.weakness}
              </div>
            )}
          </div>
        </div>

        {/* Combat Action Buttons */}
        <div className="p-4 bg-[#0a0c10] border-b border-neutral-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => handlePlayerAction('attack')}
            disabled={!isPlayerTurn}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-center text-xs font-mono font-bold text-neutral-100 transition-all flex flex-col items-center gap-1.5"
          >
            <Crosshair className="w-4 h-4 text-red-400" />
            ATACAR
          </button>

          <button
            onClick={() => handlePlayerAction('analyze')}
            disabled={!isPlayerTurn || analysisLevel >= 3}
            className="p-3 bg-red-950/40 hover:bg-red-950/70 disabled:opacity-40 border border-red-800/80 rounded text-center text-xs font-mono font-bold text-red-200 transition-all flex flex-col items-center gap-1.5 shadow-[0_0_10px_rgba(220,38,38,0.15)]"
          >
            <Eye className="w-4 h-4 text-red-400 animate-pulse" />
            ANALISAR
          </button>

          <button
            onClick={() => handlePlayerAction('defend')}
            disabled={!isPlayerTurn}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-center text-xs font-mono font-bold text-neutral-100 transition-all flex flex-col items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-blue-400" />
            DEFENDER
          </button>

          <button
            onClick={() => handlePlayerAction('skill')}
            disabled={!isPlayerTurn || playerStats.focus < 25}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-center text-xs font-mono font-bold text-neutral-100 transition-all flex flex-col items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            HABILIDADE
          </button>

          <button
            onClick={() => addLog('Item utilizado: Sal de purificação recupera 20 de Foco.')}
            disabled={!isPlayerTurn}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-center text-xs font-mono font-bold text-neutral-100 transition-all flex flex-col items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            ITEM
          </button>

          <button
            onClick={() => handlePlayerAction('flee')}
            disabled={!isPlayerTurn}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-center text-xs font-mono font-bold text-neutral-100 transition-all flex flex-col items-center gap-1.5"
          >
            <Footprints className="w-4 h-4 text-neutral-400" />
            FUGIR
          </button>
        </div>

        {/* Combat Log */}
        <div className="p-3 bg-[#08090d] font-mono text-xs text-neutral-300 space-y-1 max-h-28 overflow-y-auto">
          {combatLog.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">›</span>
              <span className={index === 0 ? 'text-neutral-100 font-semibold' : 'text-neutral-400'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
