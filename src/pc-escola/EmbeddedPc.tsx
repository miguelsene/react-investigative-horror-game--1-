import { useEffect, useRef, useState } from 'react';
import { useOS } from './os/store';
import OperatingSystem from './os/OperatingSystem';
import Boot from './components/Boot';
import Login from './components/Login';
import './pc-escola.css';

export default function EmbeddedPc({ onExit }: { onExit: () => void }) {
  const phase = useOS((s) => s.phase);
  const settings = useOS((s) => s.settings);
  const [launched, setLaunched] = useState(false);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    if (useOS.getState().phase === 'game') useOS.getState().enterComputer();
    setLaunched(true);
  }, []);

  useEffect(() => {
    if (launched && phase === 'game') onExitRef.current();
  }, [launched, phase]);

  const inOS = phase === 'desktop' || phase === 'exiting';
  const filter = inOS ? `brightness(${settings.brightness}%)${settings.highContrast ? ' contrast(1.3) saturate(1.15)' : ''}` : undefined;

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-black" style={{ filter, cursor: settings.largeCursor && inOS ? 'crosshair' : undefined }}>
      {phase === 'boot' && <Boot />}
      {phase === 'login' && <Login />}
      {inOS && <OperatingSystem />}
    </div>
  );
}
