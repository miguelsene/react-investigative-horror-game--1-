import React, { useMemo } from 'react';
import { SCHOOL_NAME_JP, STREET, roadZ, routeSamples } from '../data/streetRoute';

interface Props {
  progress: number;
  streetX: number;
  direction?: 'toSchool' | 'home';
}

/* The phone map is drawn from the same street data the 3D world uses:
   route, curve and destination are all derived, not decorative. */
export const PhoneMap: React.FC<Props> = ({ progress, streetX, direction = 'toSchool' }) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const route = useMemo(() => routeSamples(40), []);

  const W = 176;
  const H = 130;
  const padX = 12;
  const mapX = (x: number) => padX + ((x - STREET.minX) / (STREET.maxX - STREET.minX)) * (W - padX * 2);
  const mapZ = (z: number) => H / 2 - z * 4.4;

  const path = useMemo(
    () => route.map(([x, z], index) => `${index === 0 ? 'M' : 'L'}${mapX(x).toFixed(1)} ${mapZ(z).toFixed(1)}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route],
  );

  const blocks = useMemo(() => {
    const list: { x: number; y: number; w: number; h: number }[] = [];
    for (let x = STREET.minX + 2; x < STREET.maxX - 4; x += 8.2) {
      list.push({ x: mapX(x) - 7, y: mapZ(roadZ(x) - 8.6), w: 14, h: 9 });
    }
    for (let x = STREET.minX + 6; x < STREET.maxX - 4; x += 8.6) {
      list.push({ x: mapX(x) - 7, y: mapZ(roadZ(x) + 8.6), w: 14, h: 9 });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playerZ = roadZ(streetX) + STREET.sidewalk;
  const px = mapX(streetX);
  const py = mapZ(playerZ);
  const destinationLabel = direction === 'home' ? 'Casa' : 'Escola';
  const destinationX = direction === 'home' ? STREET.minX : STREET.maxX - 1.5;
  const destinationZ = roadZ(destinationX) + STREET.sidewalk;

  // Remaining distance is measured on the real route, not a straight line.
  const remaining = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const [ax, az] = route[i];
      const [bx, bz] = route[i + 1];
      if (ax < streetX) continue;
      sum += Math.hypot(bx - ax, bz - az);
    }
    return sum;
  }, [route, streetX]);

  const minutes = Math.max(1, Math.round(remaining / 62));

  const travelled = useMemo(() => {
    const points = route.filter(([x]) => x <= streetX);
    if (!points.length) return '';
    return points.map(([x, z], index) => `${index === 0 ? 'M' : 'L'}${mapX(x).toFixed(1)} ${mapZ(z).toFixed(1)}`).join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, streetX]);

  return (
    <aside className="absolute bottom-5 left-5 z-20 w-52 overflow-hidden rounded-[20px] border border-white/20 bg-[#0a0d13]/92 shadow-2xl backdrop-blur-md pointer-events-none">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 font-mono text-[9px] tracking-wider text-neutral-400">
        <span>MAPS · 07:2{Math.min(9, Math.round(clamped * 9))}</span>
        <span className="text-neutral-300">{minutes} min</span>
      </div>
      <div className="relative" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <rect width={W} height={H} fill="#0f1319" />
          {/* city blocks */}
          {blocks.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#1b2129" stroke="#242c36" strokeWidth="0.6" />
          ))}
          {/* cross streets */}
          {[-18, 0, 18].map((cx) => (
            <line key={cx} x1={mapX(cx)} y1={0} x2={mapX(cx)} y2={H} stroke="#232b34" strokeWidth="4" />
          ))}
          {/* route */}
          <path d={path} fill="none" stroke="#2c3641" strokeWidth="6" strokeLinecap="round" />
          {travelled && <path d={travelled} fill="none" stroke="#5c6672" strokeWidth="4.5" strokeLinecap="round" />}
          <path d={path} fill="none" stroke="#4f9be8" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="5 3" />
          {/* destination */}
          <circle cx={mapX(destinationX)} cy={mapZ(destinationZ)} r="4.6" fill="#b1322f" />
          <path
            d={`M${mapX(destinationX)} ${mapZ(destinationZ) - 4.6} l4.6 -8 -4.6 3 -4.6 -3z`}
            fill="#b1322f"
          />
          {/* start */}
          <circle cx={mapX(direction === 'home' ? STREET.maxX - 1.5 : STREET.minX)} cy={mapZ(roadZ(direction === 'home' ? STREET.maxX - 1.5 : STREET.minX) + STREET.sidewalk)} r="3" fill="#6b7280" />
          {/* player */}
          <circle cx={px} cy={py} r="5.4" fill="#eef4fb" stroke="#2f7fd0" strokeWidth="2.6" />
        </svg>
        <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-serif-jp text-[8px] text-neutral-300">
          {SCHOOL_NAME_JP}
        </span>
        <span className="absolute left-2 top-2 font-serif-jp text-[8px] tracking-widest text-neutral-500 uppercase">Rota</span>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <div>
          <p className="font-serif-jp text-[11px] text-neutral-100">{destinationLabel}</p>
          <p className="font-mono text-[9px] text-neutral-500">{Math.round(clamped * 100)}% do trajeto</p>
        </div>
        <span className="font-mono text-[9px] text-neutral-500">07:47</span>
      </div>
    </aside>
  );
};
