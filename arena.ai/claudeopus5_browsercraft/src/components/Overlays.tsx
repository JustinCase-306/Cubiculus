import { useState } from 'react';
import { BLOCKS, PLACEABLE_IDS, blockIcon } from '../game/blocks';
import type { EngineSettings } from '../game/engine';

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/70">
        <span>{label}</span>
        <span className="text-emerald-300">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between border-2 border-white/15 bg-black/30 px-3 py-2 text-[11px] uppercase tracking-wide text-white/80 hover:bg-black/50"
    >
      <span>{label}</span>
      <span className={value ? 'text-emerald-400' : 'text-red-400'}>{value ? 'AN' : 'AUS'}</span>
    </button>
  );
}

const CONTROLS: [string, string][] = [
  ['W A S D', 'Laufen'],
  ['Maus', 'Umsehen'],
  ['Leertaste', 'Springen / hoch (Flug)'],
  ['Strg', 'Sprinten'],
  ['Umschalt', 'Runter im Flugmodus'],
  ['Linksklick', 'Block abbauen'],
  ['Rechtsklick', 'Block setzen'],
  ['Mausrad / 1-9', 'Block auswählen'],
  ['Mittelklick', 'Block aufnehmen'],
  ['F / Doppel-Leer', 'Flugmodus'],
  ['E', 'Inventar'],
  ['R', 'Zum Spawn'],
  ['Esc', 'Menü'],
];

export function StartScreen({
  onStart,
  onLoad,
  hasSave,
  onNewWorld,
  isTouch,
}: {
  onStart: () => void;
  onLoad: () => void;
  hasSave: boolean;
  onNewWorld: (seed?: number) => void;
  isTouch: boolean;
}) {
  const [seed, setSeed] = useState('');
  return (
    <div className="fade-in absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-sky-900/70 via-slate-900/80 to-slate-950/90 p-4">
      <div className="mc-panel w-full max-w-3xl p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-pixel text-2xl leading-relaxed text-emerald-400 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] sm:text-4xl">
            MINI<span className="text-amber-300">CRAFT</span>
          </h1>
          <p className="mt-3 text-sm text-white/70">
            Eine kleine Blockwelt zum Graben, Bauen und Erkunden – komplett im Browser.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <button className="mc-btn mc-btn-green w-full font-pixel text-[11px]" onClick={onStart}>
              ▶ Welt betreten
            </button>
            <button className="mc-btn w-full text-xs" onClick={() => onNewWorld(seed ? hashSeed(seed) : undefined)}>
              🌱 Neue Welt erzeugen
            </button>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Seed (optional)"
              className="w-full border-2 border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none"
            />
            <button className="mc-btn w-full text-xs disabled:opacity-40" onClick={onLoad} disabled={!hasSave}>
              💾 Gespeicherte Welt laden
            </button>
            <p className="pt-1 text-[11px] leading-relaxed text-white/50">
              {isTouch
                ? 'Touch-Steuerung erkannt: Joystick links, Wischen rechts zum Umsehen.'
                : 'Beim Start wird der Mauszeiger gesperrt (Pointer Lock). Mit Esc kommst du ins Menü zurück.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-pixel text-[11px] text-amber-300">Steuerung</h2>
            <div className="grid max-h-64 grid-cols-1 gap-1 overflow-auto pr-1 text-[11px]">
              {CONTROLS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                  <span className="rounded-sm bg-white/10 px-2 py-[2px] font-bold text-white/90">{key}</span>
                  <span className="text-white/60">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu({
  onResume,
  onSave,
  onLoad,
  hasSave,
  onNewWorld,
  onRespawn,
  settings,
  onSettings,
  time,
  onTime,
}: {
  onResume: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  onNewWorld: (seed?: number) => void;
  onRespawn: () => void;
  settings: EngineSettings;
  onSettings: (s: Partial<EngineSettings>) => void;
  time: number;
  onTime: (t: number) => void;
}) {
  const [tab, setTab] = useState<'menu' | 'settings'>('menu');
  return (
    <div
      className="fade-in absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={() => tab === 'menu' && onResume()}
    >
      <div className="mc-panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center font-pixel text-sm text-emerald-400">
          {tab === 'menu' ? 'PAUSE' : 'EINSTELLUNGEN'}
        </h2>

        {tab === 'menu' ? (
          <div className="space-y-2">
            <button className="mc-btn mc-btn-green w-full text-xs" onClick={onResume}>
              Weiterspielen
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="mc-btn text-xs" onClick={onSave}>
                💾 Speichern
              </button>
              <button className="mc-btn text-xs disabled:opacity-40" onClick={onLoad} disabled={!hasSave}>
                📂 Laden
              </button>
              <button className="mc-btn text-xs" onClick={() => onNewWorld()}>
                🌱 Neue Welt
              </button>
              <button className="mc-btn text-xs" onClick={onRespawn}>
                🧭 Zum Spawn
              </button>
            </div>
            <button className="mc-btn w-full text-xs" onClick={() => setTab('settings')}>
              ⚙ Einstellungen
            </button>
            <p className="pt-2 text-center text-[11px] text-white/40">
              Klick ins Bild oder „Weiterspielen“, um fortzufahren.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Slider
              label="Mausempfindlichkeit"
              value={settings.sensitivity}
              min={0.3}
              max={3}
              step={0.1}
              onChange={(v) => onSettings({ sensitivity: v })}
            />
            <Slider
              label="Sichtfeld"
              value={settings.fov}
              min={60}
              max={110}
              step={1}
              suffix="°"
              onChange={(v) => onSettings({ fov: v })}
            />
            <Slider
              label="Sichtweite"
              value={settings.renderDistance}
              min={40}
              max={200}
              step={5}
              onChange={(v) => onSettings({ renderDistance: v })}
            />
            <Slider label="Tageszeit" value={time} min={0} max={0.999} step={0.01} onChange={onTime} />
            <Toggle label="Sound" value={settings.sound} onChange={(v) => onSettings({ sound: v })} />
            <Toggle label="Tag-/Nachtwechsel" value={settings.dayCycle} onChange={(v) => onSettings({ dayCycle: v })} />
            <button className="mc-btn w-full text-xs" onClick={() => setTab('menu')}>
              ← Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function InventoryPanel({
  hotbar,
  selected,
  onPick,
  onSelectSlot,
  onClose,
}: {
  hotbar: number[];
  selected: number;
  onPick: (id: number) => void;
  onSelectSlot: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fade-in absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mc-panel w-full max-w-lg p-6">
        <h2 className="mb-1 text-center font-pixel text-sm text-amber-300">INVENTAR</h2>
        <p className="mb-4 text-center text-[11px] text-white/50">
          Block anklicken, um ihn in den aktiven Slot zu legen.
        </p>

        <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {PLACEABLE_IDS.map((id) => (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="flex flex-col items-center gap-1 border-2 border-white/10 bg-black/30 p-2 hover:border-emerald-400/70 hover:bg-black/50"
            >
              <img src={blockIcon(id)} alt="" className="pixelated h-10 w-10" draggable={false} />
              <span className="text-center text-[10px] leading-tight text-white/70">{BLOCKS[id]?.name}</span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex justify-center gap-1">
          {hotbar.map((id, i) => (
            <button
              key={i}
              onClick={() => onSelectSlot(i)}
              className={`slot ${i === selected ? 'slot-active' : ''}`}
              title={`Slot ${i + 1}`}
            >
              <img src={blockIcon(id)} alt="" className="pixelated h-8 w-8" draggable={false} />
            </button>
          ))}
        </div>

        <button className="mc-btn mc-btn-green w-full text-xs" onClick={onClose}>
          Weiterspielen (E)
        </button>
      </div>
    </div>
  );
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1000000;
}
