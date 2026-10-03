import type { AppId, FileType } from '../os/types';

const P: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  forward: 'M9 18l6-6-6-6',
  up: 'M12 19V5M5 12l7-7 7 7',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0020.5 15',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  x: 'M18 6L6 18M6 6l12 12',
  min: 'M5 12h14',
  max: 'M4 4h16v16H4z',
  restore: 'M8 8h12v12H8zM4 16V4h12',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  folderPlus: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2zM12 11v6M9 14h6',
  filePlus: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15h6',
  cut: 'M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12',
  copy: 'M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
  paste: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6v4H9z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  undo: 'M3 7v6h6M3 13a9 9 0 103-7.7L3 8',
  redo: 'M21 7v6h-6M21 13a9 9 0 11-3-7.7L21 8',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  edit: 'M17 3a2.8 2.8 0 014 4L7.5 20.5 2 22l1.5-5.5z',
  wifi: 'M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M2 9a15 15 0 0120 0M12 20h.01',
  volume: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14',
  mute: 'M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6',
  keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
  power: 'M18.4 6.6a9 9 0 11-12.8 0M12 2v10',
  rotate: 'M1 4v6h6M3.5 15a9 9 0 102.1-9.4L1 10',
  play: 'M5 3l14 9-14 9z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  zoomIn: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
  zoomOut: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3M8 11h6',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  reply: 'M9 17l-5-5 5-5M20 18v-2a4 4 0 00-4-4H4',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  mail: 'M4 4h16v16H4zM22 6l-10 7L2 6',
  check: 'M20 6L9 17l-5-5',
  history: 'M12 8v4l3 3M3.05 11a9 9 0 11.5 4M3 4v5h5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  calendar: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  clipboard: 'M9 2h6v4H9zM16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 13l2 2 4-4',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  monitor: 'M2 3h20v14H2zM8 21h8M12 17v4',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20',
  mouse: 'M6 3h12v18H6zM12 7v4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  more: 'M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  lock: 'M5 11h14v10H5zM7 11V7a5 5 0 0110 0v4',
  smile: 'M12 22a10 10 0 100-20 10 10 0 000 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  paperclip: 'M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.2-9.19a4 4 0 015.65 5.66l-9.2 9.19a2 2 0 01-2.82-2.83l8.49-8.48',
  ghost: 'M12 2a8 8 0 00-8 8v10l3-2 2.5 2L12 18l2.5 2L17 18l3 2V10a8 8 0 00-8-8zM9 10h.01M15 10h.01',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
};

export function Ico({ name, size = 16, className = '', fill = false }: { name: keyof typeof P | string; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[name] ?? P.info} />
    </svg>
  );
}

/* ---------- Windows-7-style application icons (illustrated SVG) ---------- */

const G = ({ id, from, to, x2 = '0', y2 = '1' }: { id: string; from: string; to: string; x2?: string; y2?: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0" stopColor={from} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
);

const Gloss = ({ d }: { d: string }) => <path d={d} fill="#fff" opacity=".28" />;

function FolderGlyph({ papers = true }: { papers?: boolean }) {
  return (
    <>
      <defs>
        <G id="fdBack" from="#f1cd6b" to="#d59a1f" />
        <G id="fdFront" from="#ffe8a3" to="#eab63a" />
      </defs>
      <path d="M4 11a3 3 0 0 1 3-3h10.5l4 4.5H41a3 3 0 0 1 3 3V38a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#fdBack)" stroke="#b7811a" strokeWidth=".8" />
      {papers && (
        <>
          <rect x="11" y="14" width="23" height="18" rx="1.5" fill="#fff" stroke="#c4d0da" transform="rotate(-4 22 23)" />
          <rect x="14" y="16" width="22" height="18" rx="1.5" fill="#fff" stroke="#c4d0da" />
          {[20, 24, 28].map((y) => <rect key={y} x="17" y={y} width={y === 28 ? 9 : 15} height="1.6" rx=".8" fill="#9db0c0" />)}
        </>
      )}
      <path d="M3 21h42l-3.6 18.6A3 3 0 0 1 38.5 42h-29a3 3 0 0 1-2.9-2.4z" fill="url(#fdFront)" stroke="#c4902a" strokeWidth=".8" />
      <Gloss d="M4.5 22h39l-.8 4H5.3z" />
    </>
  );
}

const APP_GLYPH: Record<AppId, (full?: boolean) => React.ReactNode> = {
  explorer: () => <FolderGlyph />,
  browser: () => (
    <>
      <defs>
        <radialGradient id="glGlobe" cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#b6e6ff" />
          <stop offset=".45" stopColor="#2f93e4" />
          <stop offset="1" stopColor="#0a4a9c" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="19" fill="url(#glGlobe)" stroke="#0b3f86" strokeWidth=".8" />
      <path d="M13 13c4-3 9-1.5 10.5 1.5s-1 5.5 2 7.5 7.5 1 9 4.5-2.5 8-6.5 7.5-5.5-4.5-8.5-3.5-5 6.5-8.5 3.5-2.5-9 0-12 .5-7 2-9z" fill="#5fcf6c" opacity=".92" />
      <path d="M30 9.5c3 1 5 3 6 5.5-2 1-4.5 0-5.5-2s-1.5-3-.5-3.5z" fill="#5fcf6c" opacity=".9" />
      <ellipse cx="17.5" cy="13" rx="8" ry="4" fill="#fff" opacity=".35" />
      <ellipse cx="24" cy="24" rx="23" ry="8.5" fill="none" stroke="#dff3ff" strokeWidth="2.2" opacity=".85" transform="rotate(-22 24 24)" />
    </>
  ),
  mail: () => (
    <>
      <defs>
        <G id="mlBody" from="#ffffff" to="#d7e2ec" />
        <G id="mlFlap" from="#f8fbfd" to="#bfd0de" />
      </defs>
      <rect x="4" y="11" width="40" height="27" rx="3" fill="url(#mlBody)" stroke="#8ea4b8" strokeWidth=".9" />
      <rect x="9" y="6" width="30" height="20" rx="1.5" fill="#fff" stroke="#c7d3dd" />
      {[11, 15, 19].map((y) => <rect key={y} x="13" y={y} width={y === 19 ? 12 : 22} height="1.6" rx=".8" fill="#a5b7c6" />)}
      <path d="M4 37.5 20 24h8l16 13.5A3 3 0 0 1 41 38H7a3 3 0 0 1-3-.5z" fill="url(#mlBody)" stroke="#8ea4b8" strokeWidth=".9" />
      <path d="M4 14a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3L24 29z" fill="url(#mlFlap)" stroke="#8ea4b8" strokeWidth=".9" />
      <rect x="33" y="14" width="7" height="6" fill="#e4574a" stroke="#fff" strokeDasharray="1 1" />
    </>
  ),
  portal: () => (
    <>
      <defs>
        <G id="ptRoof" from="#ef6d5f" to="#a52d24" />
        <G id="ptWall" from="#fbf5ec" to="#ddcdb6" />
      </defs>
      <path d="M24 6 45 21H3z" fill="url(#ptRoof)" stroke="#8f241c" strokeWidth=".8" strokeLinejoin="round" />
      <rect x="7" y="21" width="34" height="20" fill="url(#ptWall)" stroke="#a7927a" strokeWidth=".8" />
      {[10, 20, 30].map((x) => <rect key={x} x={x} y="24" width="6" height="6" fill="#6fb8ec" stroke="#fff" />)}
      <rect x="20" y="31" width="8" height="10" fill="#8a4b2a" stroke="#5d3019" strokeWidth=".6" />
      <circle cx="24" cy="15.5" r="3" fill="#fff6c9" stroke="#8f241c" />
      <path d="M24 13.5v2.2h1.6" stroke="#8f241c" strokeWidth=".8" fill="none" />
      <rect x="3" y="41" width="42" height="3" rx="1" fill="#9db4c6" />
      <Gloss d="M24 7.5 41 20H24z" />
    </>
  ),
  editor: () => (
    <>
      <defs>
        <G id="edPad" from="#ffffff" to="#e4ecf2" />
        <G id="edTop" from="#75bcf5" to="#2a79cf" />
      </defs>
      <rect x="9" y="6" width="30" height="38" rx="2.5" fill="url(#edPad)" stroke="#86a0b5" strokeWidth=".9" />
      <rect x="9" y="6" width="30" height="8" rx="2.5" fill="url(#edTop)" />
      <rect x="9" y="12" width="30" height="2" fill="#2a79cf" />
      {[14, 20, 26, 32].map((x) => <circle key={x} cx={x} cy="6.5" r="1.7" fill="#dce6ee" stroke="#5f7a90" strokeWidth=".7" />)}
      {[19, 24, 29, 34].map((y) => <rect key={y} x="14" y={y} width={y === 34 ? 12 : 20} height="1.6" rx=".8" fill="#9fb4c6" />)}
      <g transform="rotate(45 34 34)">
        <rect x="31.5" y="22" width="5" height="16" fill="#f6c543" stroke="#b58a1d" strokeWidth=".6" />
        <path d="M31.5 38 34 43.5 36.5 38z" fill="#f3d8b0" stroke="#b58a1d" strokeWidth=".6" />
        <path d="M33 41.3 34 43.5 35 41.3z" fill="#333" />
        <rect x="31.5" y="22" width="5" height="3" fill="#e97d8a" />
      </g>
    </>
  ),
  sheet: () => (
    <>
      <defs>
        <G id="shTop" from="#5fcc7f" to="#1f8e45" />
      </defs>
      <rect x="6" y="7" width="36" height="34" rx="2" fill="#fff" stroke="#6e9d7c" strokeWidth=".9" />
      <rect x="6" y="7" width="36" height="7" rx="2" fill="url(#shTop)" />
      <rect x="6" y="14" width="9" height="27" fill="#dcf2e2" />
      {[20, 26, 32].map((y) => <path key={y} d={`M6 ${y}h36`} stroke="#bcd9c4" />)}
      {[15, 24, 33].map((x) => <path key={x} d={`M${x} 14v27`} stroke="#bcd9c4" />)}
      <rect x="25" y="21" width="8" height="5" fill="#8dd3a2" opacity=".7" />
      <text x="9" y="12.6" fontSize="5.5" fontWeight="700" fill="#fff" fontFamily="sans-serif">A B C D</text>
    </>
  ),
  presentation: () => (
    <>
      <defs>
        <G id="prTop" from="#ffa85c" to="#e2621e" />
      </defs>
      <rect x="4" y="8" width="40" height="27" rx="2" fill="#fff" stroke="#c48a63" strokeWidth=".9" />
      <rect x="4" y="8" width="40" height="6" rx="2" fill="url(#prTop)" />
      <rect x="12" y="25" width="5" height="7" fill="#e2621e" />
      <rect x="20" y="19" width="5" height="13" fill="#ffa85c" />
      <rect x="28" y="22" width="5" height="10" fill="#f6b26b" />
      <path d="M10 32h28" stroke="#9c7a65" />
      <path d="M24 35v6M17 43h14" stroke="#8e6a53" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  gallery: () => (
    <>
      <defs>
        <G id="gaSky" from="#9fd9ff" to="#3b8fdc" />
      </defs>
      <rect x="10" y="7" width="27" height="21" rx="1" fill="#fff" stroke="#b4c1cb" transform="rotate(-9 23 17)" />
      <rect x="11" y="15" width="30" height="24" rx="1" fill="#fff" stroke="#93a6b4" strokeWidth=".9" />
      <rect x="13.5" y="17.5" width="25" height="19" fill="url(#gaSky)" />
      <circle cx="32" cy="22.5" r="2.6" fill="#ffe36a" />
      <path d="M13.5 36.5 22 26l5 5.5 4-4 7.5 9z" fill="#3b9a4e" />
      <path d="M13.5 36.5 22 26l5 5.5-5 5z" fill="#2d7d3e" />
    </>
  ),
  trash: (full) => (
    <>
      <defs>
        <G id="trBody" from="#e9f4fa" to="#a9c6d8" x2="1" y2="0" />
      </defs>
      {full && (
        <>
          <rect x="16" y="6" width="12" height="12" rx="1" fill="#fff" stroke="#b4c1cb" transform="rotate(-14 22 12)" />
          <rect x="22" y="5" width="11" height="12" rx="1" fill="#fff" stroke="#b4c1cb" transform="rotate(12 27 11)" />
        </>
      )}
      <path d="M11 15h26l-2.4 25.5a2.5 2.5 0 0 1-2.5 2.3H15.9a2.5 2.5 0 0 1-2.5-2.3z" fill="url(#trBody)" opacity=".92" stroke="#6b8ca4" strokeWidth=".9" />
      <ellipse cx="24" cy="15" rx="13.5" ry="3.6" fill="#dfeef7" stroke="#6b8ca4" strokeWidth=".9" />
      <path d="M17 19.5 16 39M24 19.5V39M31 19.5 32 39" stroke="#fff" strokeWidth="1.4" opacity=".7" />
      <g fill="#2f9d4e">
        <path d="M22.4 25.6 25 21.4l2.6 4.2h-1.6v3h-2v-3z" />
        <path d="M17.6 32.4l4.9-.2-2.3 4.4-1-1.3-2.5 1.6-1-1.7 2.5-1.6z" />
        <path d="M30.4 32.2l-2.3-4.4 4.9.2-.6 1.2 2.5 1.6-1 1.7-2.5-1.6z" />
      </g>
    </>
  ),
  settings: () => (
    <>
      <defs>
        <G id="stFrame" from="#6cb3ea" to="#2160ae" />
      </defs>
      <rect x="5" y="7" width="38" height="28" rx="3" fill="url(#stFrame)" stroke="#174b8a" strokeWidth=".9" />
      <rect x="8" y="10" width="32" height="22" fill="#eef5fb" />
      <rect x="11" y="13" width="8" height="7" rx="1" fill="#f1a24a" />
      <rect x="21" y="13" width="8" height="7" rx="1" fill="#5ab8f5" />
      <rect x="11" y="22" width="8" height="7" rx="1" fill="#6cc870" />
      <rect x="21" y="22" width="8" height="7" rx="1" fill="#c987e3" />
      <path d="M31 23.5 34.2 27 40 19.5" stroke="#2e9e4a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="35" width="8" height="4" fill="#6f8696" />
      <rect x="14" y="39" width="20" height="3" rx="1" fill="#8da2b2" />
      <Gloss d="M6 8.5h36v4H6z" />
    </>
  ),
  search: () => (
    <>
      <defs>
        <radialGradient id="seLens" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8ec9ef" />
        </radialGradient>
      </defs>
      <path d="M28.5 28.5 41 41" stroke="#5a4535" strokeWidth="7" strokeLinecap="round" />
      <path d="M29.5 29.5 40 40" stroke="#c99f6e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="19.5" cy="19.5" r="12.5" fill="url(#seLens)" stroke="#2b6ea8" strokeWidth="3.2" />
      <ellipse cx="15.5" cy="14.5" rx="5" ry="3" fill="#fff" opacity=".75" />
    </>
  ),
  tasks: () => (
    <>
      <defs>
        <G id="tkBoard" from="#cf9354" to="#9a6230" />
      </defs>
      <rect x="9" y="8" width="30" height="36" rx="3" fill="url(#tkBoard)" stroke="#7a4b22" strokeWidth=".8" />
      <rect x="12.5" y="13" width="23" height="28" fill="#fff" stroke="#d6c9bb" strokeWidth=".6" />
      <rect x="17.5" y="5" width="13" height="7" rx="2" fill="#9aa8b4" stroke="#5f6f7c" strokeWidth=".7" />
      {[19, 25, 31].map((y) => <rect key={y} x="17" y={y} width={y === 31 ? 8 : 14} height="1.6" rx=".8" fill="#b6c4cf" />)}
      <path d="M17 32.5 21 36.5 30 26.5" stroke="#2fa64f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chat: () => (
    <>
      <defs>
        <G id="chB1" from="#b3e1ff" to="#228be6" />
        <G id="chB2" from="#c2f9d8" to="#2f9e44" />
      </defs>
      <path d="M7 26.5 C 7 17, 15 14, 21.5 14 S 32 17, 32 23 C 32 27, 28.5 30, 25 31 L 27 36 L 20 32 C 11.5 32, 7 31, 7 26.5 Z" fill="url(#chB1)" stroke="#1a6cb8" strokeWidth=".9" />
      <ellipse cx="19.5" cy="22.5" rx="10" ry="6" fill="none" stroke="#fff" opacity=".35" transform="rotate(-5 19.5 22.5)" />
      <path d="M22 23.5 C 19 28, 23 34, 28 34.5 S 39 33.5, 39 29 C 39 24.5, 33.5 22, 28 22 C 25.5 22, 22 22.5, 22 23.5 Z" fill="url(#chB2)" stroke="#1e7e34" strokeWidth=".9" />
    </>
  ),
};

export function AppIcon({ app, size = 40, full }: { app: AppId; size?: number; full?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]" aria-hidden>
      {APP_GLYPH[app](full)}
    </svg>
  );
}

export function FileIcon({ type, size = 32, src, empty }: { type: FileType; size?: number; src?: string; empty?: boolean }) {
  if (type === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
        <FolderGlyph papers={!empty} />
      </svg>
    );
  }
  if (type === 'image' && src) {
    return (
      <span className="shrink-0 inline-block bg-white p-[2px] shadow-sm ring-1 ring-slate-300" style={{ width: size, height: size }}>
        <img src={src} alt="" className="object-cover w-full h-full" />
      </span>
    );
  }
  const color = { txt: '#7b8ea0', doc: '#2b6fd0', sheet: '#1f8e45', presentation: '#e2621e', image: '#8d4fcf', folder: '' }[type];
  const label = { txt: '', doc: 'DOC', sheet: 'XLS', presentation: 'PPT', image: 'JPG', folder: '' }[type];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <defs>
        <G id="fiPage" from="#ffffff" to="#e9eff4" />
      </defs>
      <path d="M10 3h20l10 10v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="url(#fiPage)" stroke="#a9b8c6" strokeWidth=".9" />
      <path d="M30 3v8a2 2 0 0 0 2 2h8z" fill="#d3dde6" stroke="#a9b8c6" strokeWidth=".9" />
      {type === 'txt' && [16, 21, 26, 31, 36].map((y) => <rect key={y} x="13" y={y} width={y === 36 ? 12 : 22} height="2" rx="1" fill="#9fb0c0" />)}
      {type !== 'txt' && (
        <>
          <rect x="13" y="17" width="16" height="1.8" rx=".9" fill="#b7c5d1" />
          <rect x="13" y="21" width="22" height="1.8" rx=".9" fill="#b7c5d1" />
          <rect x="5" y="26" width="28" height="13" rx="2" fill={color} stroke="rgba(0,0,0,.2)" strokeWidth=".6" />
          <Gloss d="M5.5 27h27v5h-27z" />
          <text x="19" y="35.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">
            {label}
          </text>
        </>
      )}
    </svg>
  );
}
