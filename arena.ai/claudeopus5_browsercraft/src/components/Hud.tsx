import { BLOCKS, blockIcon } from '../game/blocks';
import type { GameStats } from '../game/engine';

export function Crosshair() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-6 w-6 opacity-80 mix-blend-difference">
        <div className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 bg-white" />
        <div className="absolute top-1/2 left-0 h-[2px] w-6 -translate-y-1/2 bg-white" />
      </div>
    </div>
  );
}

export function Hotbar({
  hotbar,
  selected,
  onSelect,
  interactive = true,
}: {
  hotbar: number[];
  selected: number;
  onSelect: (index: number) => void;
  interactive?: boolean;
}) {
  const name = BLOCKS[hotbar[selected]]?.name ?? '';
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 select-none">
      <div className="mb-2 text-center text-xs tracking-wide text-white/90 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
        {name}
      </div>
      <div
        className={`flex gap-1 rounded-sm bg-black/35 p-1 ring-2 ring-white/15 ${
          interactive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {hotbar.map((id, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`slot transition-transform ${i === selected ? 'slot-active' : ''}`}
            title={BLOCKS[id]?.name}
          >
            <img src={blockIcon(id)} alt="" className="pixelated h-9 w-9" draggable={false} />
            <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white/70">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DebugPanel({ stats, blocksPlaced }: { stats: GameStats; blocksPlaced: number }) {
  const timeLabel = () => {
    const hours = (stats.time * 24 + 6) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 space-y-1 text-[11px] leading-tight text-white/90 drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
      <div className="font-pixel text-[11px] text-emerald-300">MiniCraft</div>
      <div>FPS: {stats.fps}</div>
      <div>
        XYZ: {stats.x.toFixed(1)} / {stats.y.toFixed(1)} / {stats.z.toFixed(1)}
      </div>
      <div>Uhrzeit: {timeLabel()}</div>
      <div>
        Modus: {stats.flying ? 'Fliegen' : 'Laufen'}
        {stats.inWater ? ' · im Wasser' : ''}
      </div>
      <div>Ziel: {stats.target ?? '–'}</div>
      <div>Abgebaut/Gesetzt: {blocksPlaced}</div>
    </div>
  );
}

export function WaterOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 bg-sky-500/25 mix-blend-screen" />
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast-in pointer-events-none absolute bottom-32 left-1/2 z-50 -translate-x-1/2 rounded-sm bg-black/70 px-4 py-2 text-xs text-white ring-1 ring-white/20">
      {message}
    </div>
  );
}

export function HintBar() {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 text-right text-[11px] leading-relaxed text-white/80 drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
      <div>
        <b>Linksklick</b> abbauen · <b>Rechtsklick</b> setzen
      </div>
      <div>
        <b>WASD</b> laufen · <b>Leer</b> springen · <b>F</b> fliegen
      </div>
      <div>
        <b>E</b> Inventar · <b>Esc</b> Menü · <b>1–9</b> Blockwahl
      </div>
    </div>
  );
}
